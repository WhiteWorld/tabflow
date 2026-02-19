import type { Rule, ManagedTabEntry } from '../shared/types';
import { loadRuntime, saveRuntime } from './runtime-state';
import { getRules, getSettings } from '../shared/storage';

export function matchDomain(tabUrl: string, domain: string): boolean {
  try {
    const hostname = new URL(tabUrl).hostname;
    return hostname === domain || hostname.endsWith('.' + domain);
  } catch {
    return false;
  }
}

export async function registerManagedTab(rule: Rule, tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id || !tab.url) return;

  const runtime = await loadRuntime();
  const now = Date.now();
  const triggerAt = now + rule.trigger.minutes * 60 * 1000;
  const alarmName = `rule_${rule.id}_${tab.id}_${now}`;

  // Clear existing alarm if any
  const existing = runtime.managedTabs[tab.id];
  if (existing?.alarmName) {
    await chrome.alarms.clear(existing.alarmName);
  }

  const entry: ManagedTabEntry = {
    tabId: tab.id,
    ruleId: rule.id,
    ruleName: rule.name,
    triggerType: rule.trigger.type,
    startedAt: now,
    triggerAt,
    alarmName,
  };

  runtime.managedTabs[tab.id] = entry;
  await saveRuntime(runtime);
  chrome.alarms.create(alarmName, { when: triggerAt });
}

export async function registerManagedTabPending(rule: Rule, tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id) return;

  const runtime = await loadRuntime();

  const entry: ManagedTabEntry = {
    tabId: tab.id,
    ruleId: rule.id,
    ruleName: rule.name,
    triggerType: rule.trigger.type,
    startedAt: 0,
    triggerAt: 0,
    alarmName: '',
  };

  runtime.managedTabs[tab.id] = entry;
  await saveRuntime(runtime);
}

export async function unregisterManagedTab(tabId: number): Promise<void> {
  const runtime = await loadRuntime();
  const entry = runtime.managedTabs[tabId];

  if (entry) {
    if (entry.alarmName) {
      await chrome.alarms.clear(entry.alarmName);
    }
    delete runtime.managedTabs[tabId];
    await saveRuntime(runtime);
  }
}

export async function rebuildForRule(rule: Rule, protectedDomains: string[]): Promise<void> {
  if (!rule.enabled) return;

  const allTabs = await chrome.tabs.query({});

  // Get currently active tab IDs to know which tabs are "inactive"
  const activeTabs = await chrome.tabs.query({ active: true });
  const activeTabIds = new Set(activeTabs.map(t => t.id).filter(Boolean));

  for (const tab of allTabs) {
    if (!tab.url || !tab.id) continue;

    if (protectedDomains.some(d => matchDomain(tab.url!, d))) continue;

    if (rule.domains.some(d => matchDomain(tab.url!, d))) {
      if (rule.trigger.type === 'openDuration') {
        await registerManagedTab(rule, tab);
      } else {
        // inactive rule: start countdown immediately for non-active tabs
        if (activeTabIds.has(tab.id)) {
          await registerManagedTabPending(rule, tab);
        } else {
          await registerManagedTab(rule, tab);
        }
      }
    }
  }
}

export async function rebuildAllRules(rules: Rule[], protectedDomains: string[]): Promise<void> {
  for (const rule of rules.filter(r => r.enabled)) {
    await rebuildForRule(rule, protectedDomains);
  }
}

export async function clearRuleAlarms(ruleId: string): Promise<void> {
  const runtime = await loadRuntime();
  for (const [tabIdStr, entry] of Object.entries(runtime.managedTabs)) {
    if (entry.ruleId === ruleId) {
      await unregisterManagedTab(Number(tabIdStr));
    }
  }
}

// Get current rules - used by alarm-manager internally
export async function getRulesForRebuild(): Promise<{ rules: Rule[]; protectedDomains: string[] }> {
  const [rules, settings] = await Promise.all([getRules(), getSettings()]);
  return { rules, protectedDomains: settings.protectedDomains };
}
