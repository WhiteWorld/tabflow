import type { Rule } from '../shared/types';
import { loadRuntime, saveRuntime } from './runtime-state';
import {
  registerManagedTab,
  registerManagedTabPending,
  unregisterManagedTab,
  matchDomain,
} from './alarm-manager';
import { saveToStash } from './stash-manager';
import { getRules, setRules, getSettings, setSettings, getStash, setStash } from '../shared/storage';
import { HUMAN_ACTIVITY_GUARD_MS, UNDO_EXPIRE_ALARM } from '../shared/constants';

export function findMatchingRule(
  tabUrl: string,
  rules: Rule[],
  protectedDomains: string[]
): Rule | null {
  if (protectedDomains.some(d => matchDomain(tabUrl, d))) return null;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.domains.some(d => matchDomain(tabUrl, d))) {
      return rule;
    }
  }

  return null;
}

export async function handleTabUpdated(tabId: number, url: string): Promise<void> {
  const [rules, settings] = await Promise.all([getRules(), getSettings()]);

  if (settings.protectedDomains.some(d => matchDomain(url, d))) {
    await unregisterManagedTab(tabId);
    return;
  }

  // If this tab is already managed for the same rule, don't reset its countdown
  const runtime = await loadRuntime();
  const existing = runtime.managedTabs[tabId];
  if (existing) {
    const rule = rules.find(r => r.id === existing.ruleId && r.enabled);
    if (rule && rule.domains.some(d => matchDomain(url, d))) {
      return; // Same rule still applies — leave countdown untouched
    }
  }

  await unregisterManagedTab(tabId);

  const rule = findMatchingRule(url, rules, settings.protectedDomains);
  if (!rule) return;

  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return;

  if (rule.trigger.type === 'openDuration') {
    await registerManagedTab(rule, tab);
  } else {
    // inactive rule: only pending if this tab is currently active
    const isActive = tab.active === true;
    if (isActive) {
      await registerManagedTabPending(rule, tab);
    } else {
      await registerManagedTab(rule, tab);
    }
  }
}

export async function handleTabActivated(
  activeTabId: number,
  prevTabId: number | undefined
): Promise<void> {
  // Step 1: update lastUserInteractionAt
  const runtime = await loadRuntime();
  runtime.lastUserInteractionAt = Date.now();
  await saveRuntime(runtime);

  // Step 2: start countdown for the tab the user just left
  if (prevTabId !== undefined) {
    const r1 = await loadRuntime();
    const prevEntry = r1.managedTabs[prevTabId];
    if (prevEntry && prevEntry.triggerType === 'inactive') {
      const rules = await getRules();
      const prevRule = rules.find(r => r.id === prevEntry.ruleId);
      if (prevRule) {
        const prevTab = await chrome.tabs.get(prevTabId).catch(() => null);
        if (prevTab) {
          await registerManagedTab(prevRule, prevTab);
        }
      }
    }
  }

  // Step 3: reset countdown for the newly active tab (load fresh runtime)
  const r2 = await loadRuntime();
  const activeEntry = r2.managedTabs[activeTabId];
  if (activeEntry && activeEntry.triggerType === 'inactive') {
    if (activeEntry.alarmName) {
      await chrome.alarms.clear(activeEntry.alarmName);
    }
    r2.managedTabs[activeTabId] = {
      ...activeEntry,
      triggerAt: 0,
      alarmName: '',
      startedAt: 0,
      pausedAt: activeEntry.triggerAt > 0 ? activeEntry.triggerAt : activeEntry.pausedAt,
    };
    await saveRuntime(r2);
  }
}

export async function handleWindowFocusChanged(windowId: number): Promise<void> {
  const runtime = await loadRuntime();

  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    runtime.lastUserInteractionAt = Date.now();
    await saveRuntime(runtime);

    // Reset active tab's inactive countdown
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      const entry = runtime.managedTabs[activeTab.id];
      if (entry && entry.triggerType === 'inactive' && entry.alarmName) {
        await chrome.alarms.clear(entry.alarmName);
        const freshRuntime = await loadRuntime();
        freshRuntime.managedTabs[activeTab.id] = {
          ...entry,
          triggerAt: 0,
          alarmName: '',
          startedAt: 0,
          pausedAt: entry.triggerAt > 0 ? entry.triggerAt : entry.pausedAt,
        };
        await saveRuntime(freshRuntime);
      }
    }
  } else {
    // Browser lost focus — start countdowns for pending inactive tabs
    const rules = await getRules();

    for (const [tabIdStr, entry] of Object.entries(runtime.managedTabs)) {
      const tabId = Number(tabIdStr);
      if (entry.triggerType === 'inactive' && entry.triggerAt === 0) {
        const rule = rules.find(r => r.id === entry.ruleId);
        if (rule) {
          const tab = await chrome.tabs.get(tabId).catch(() => null);
          if (tab) {
            await registerManagedTab(rule, tab);
          }
        }
      }
    }
  }
}

export async function handleAlarmFired(alarm: chrome.alarms.Alarm): Promise<void> {
  if (!alarm.name.startsWith('rule_')) return;

  const runtime = await loadRuntime();

  // Parse alarm name: rule_{ruleId}_{tabId}_{timestamp}
  const parts = alarm.name.split('_');
  const tabId = Number(parts[2]);

  const entry = runtime.managedTabs[tabId];

  // Stale alarm check
  if (!entry || entry.alarmName !== alarm.name) return;

  // Human Activity Guard
  if (Date.now() - runtime.lastUserInteractionAt < HUMAN_ACTIVITY_GUARD_MS) {
    const newTriggerAt = Date.now() + 60_000;
    chrome.alarms.create(entry.alarmName, { delayInMinutes: 1 });
    runtime.managedTabs[tabId] = { ...entry, triggerAt: newTriggerAt };
    await saveRuntime(runtime);
    return;
  }

  // Get tab
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) {
    await unregisterManagedTab(tabId);
    return;
  }

  // Save to stash before closing
  const stashEntry = await saveToStash(tab, entry.ruleName);
  await chrome.tabs.remove(tabId);
  await unregisterManagedTab(tabId);

  // Update rule stats
  const rules = await getRules();
  const ruleIdx = rules.findIndex(r => r.id === entry.ruleId);
  if (ruleIdx >= 0) {
    rules[ruleIdx].stats.triggeredCount++;
    await setRules(rules);
  }

  // Update pendingCleanCount
  const settings = await getSettings();
  settings.pendingCleanCount++;
  await setSettings(settings);

  // Update undo group
  const freshRuntime = await loadRuntime();
  if (
    !freshRuntime.pendingUndoGroup ||
    Date.now() - freshRuntime.pendingUndoGroup.closedAt > 5000
  ) {
    freshRuntime.pendingUndoGroup = {
      stashIds: [stashEntry.id],
      closedAt: Date.now(),
    };
  } else {
    freshRuntime.pendingUndoGroup.stashIds.push(stashEntry.id);
  }

  await saveRuntime(freshRuntime);

  // Badge
  const count = freshRuntime.pendingUndoGroup.stashIds.length;
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: '#E84444' });

  // Schedule undo expiry (5 seconds)
  chrome.alarms.create(UNDO_EXPIRE_ALARM, { delayInMinutes: 5 / 60 });
}

export async function performUndo(): Promise<void> {
  const runtime = await loadRuntime();
  if (!runtime.pendingUndoGroup) return;

  const { stashIds } = runtime.pendingUndoGroup;
  const stash = await getStash();

  for (const stashId of stashIds) {
    const entry = stash.find(s => s.id === stashId);
    if (entry) {
      await chrome.tabs.create({ url: entry.url });
    }
  }

  await setStash(stash.filter(s => !stashIds.includes(s.id)));

  const settings = await getSettings();
  settings.pendingCleanCount = Math.max(0, settings.pendingCleanCount - stashIds.length);
  await setSettings(settings);

  runtime.pendingUndoGroup = null;
  await saveRuntime(runtime);

  chrome.action.setBadgeText({ text: '' });
}
