import { loadRuntime, saveRuntime } from './runtime-state';
import { rebuildAllRules, unregisterManagedTab, clearRuleAlarms } from './alarm-manager';
import { cleanupExpiredStash, restoreFromStash } from './stash-manager';
import {
  handleTabUpdated,
  handleTabActivated,
  handleWindowFocusChanged,
  handleAlarmFired,
  performUndo,
} from './rule-engine';
import { getRules, getSettings, setSettings, setRules } from '../shared/storage';
import { RULE_TEMPLATES, STASH_CLEANUP_ALARM, UNDO_EXPIRE_ALARM } from '../shared/constants';
import type { MessageType, Rule } from '../shared/types';
import { rebuildForRule } from './alarm-manager';

// ========== onInstalled ==========

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    const settings = await getSettings();
    settings.isFirstInstall = true;
    await setSettings(settings);

    // Load template rules (disabled by default)
    const rules: Rule[] = RULE_TEMPLATES.map(template => ({
      ...template,
      id: crypto.randomUUID(),
      stats: { triggeredCount: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    await setRules(rules);

    // Open options page for onboarding
    chrome.runtime.openOptionsPage();
  }

  // Register context menus (always on install/update)
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'manage-tab',
      title: '⚙️ Manage this site',
      contexts: ['action'],
    });
    chrome.contextMenus.create({
      id: 'ai-analyze',
      title: '✨ AI Analyze all tabs',
      contexts: ['action'],
    });
    chrome.contextMenus.create({
      id: 'sep',
      type: 'separator',
      contexts: ['action'],
    });
    chrome.contextMenus.create({
      id: 'settings',
      title: 'Settings',
      contexts: ['action'],
    });
  });

  // Schedule stash cleanup alarm
  chrome.alarms.create(STASH_CLEANUP_ALARM, { periodInMinutes: 60 });

  // Rebuild alarms for all open tabs (covers extension reload during dev)
  if (reason !== 'install') {
    const [rules, settings] = await Promise.all([getRules(), getSettings()]);
    await rebuildAllRules(rules, settings.protectedDomains);
  }
});

// ========== onStartup ==========

chrome.runtime.onStartup.addListener(async () => {
  const [rules, settings] = await Promise.all([getRules(), getSettings()]);
  const runtime = await loadRuntime();

  // Consistency check: remove entries for tabs no longer open
  const allTabs = await chrome.tabs.query({});
  const openTabIds = new Set(allTabs.map(t => t.id).filter(Boolean));

  // Seed tabCreatedAt for tabs that existed before this startup
  for (const tab of allTabs) {
    if (tab.id && !runtime.tabCreatedAt[tab.id]) {
      runtime.tabCreatedAt[tab.id] = Date.now();
    }
  }

  // Clean up tabCreatedAt for closed tabs
  for (const tabIdStr of Object.keys(runtime.tabCreatedAt)) {
    if (!openTabIds.has(Number(tabIdStr))) {
      delete runtime.tabCreatedAt[Number(tabIdStr)];
    }
  }

  for (const tabIdStr of Object.keys(runtime.managedTabs)) {
    const tabId = Number(tabIdStr);
    if (!openTabIds.has(tabId)) {
      const entry = runtime.managedTabs[tabId];
      if (entry?.alarmName) {
        await chrome.alarms.clear(entry.alarmName);
      }
      delete runtime.managedTabs[tabId];
    }
  }

  // Rebuild alarms for surviving entries
  for (const entry of Object.values(runtime.managedTabs)) {
    if (entry.triggerAt > 0) {
      if (entry.triggerAt > Date.now()) {
        chrome.alarms.create(entry.alarmName, { when: entry.triggerAt });
      } else {
        // Past due — reset to pending state (safe recovery)
        runtime.managedTabs[entry.tabId] = {
          ...entry,
          triggerAt: 0,
          alarmName: '',
          startedAt: 0,
        };
      }
    }
  }

  await saveRuntime(runtime);

  // Full rule rebuild
  await rebuildAllRules(rules, settings.protectedDomains);

  // Cleanup expired stash
  await cleanupExpiredStash();

  // Ensure stash cleanup alarm is scheduled
  chrome.alarms.create(STASH_CLEANUP_ALARM, { periodInMinutes: 60 });
});

// ========== Tab Events ==========

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Trigger on URL change (navigation) OR on load complete (catches new tabs whose URL was set before listener fired)
  if ((changeInfo.url || changeInfo.status === 'complete') && tab.url) {
    await handleTabUpdated(tabId, tab.url);
  }
});

let previousActiveTabId: number | undefined;

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  // Read previous tab from runtime if in-memory var is gone (SW woke up)
  if (previousActiveTabId === undefined) {
    const runtime = await loadRuntime();
    previousActiveTabId = runtime.lastActiveTabId;
  }
  await handleTabActivated(tabId, previousActiveTabId);
  previousActiveTabId = tabId;
  // Persist so it survives SW sleep
  const runtime = await loadRuntime();
  runtime.lastActiveTabId = tabId;
  await saveRuntime(runtime);
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (!tab.id) return;
  const runtime = await loadRuntime();
  runtime.tabCreatedAt[tab.id] = Date.now();
  await saveRuntime(runtime);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await unregisterManagedTab(tabId);
  const runtime = await loadRuntime();
  delete runtime.tabCreatedAt[tabId];
  await saveRuntime(runtime);
});

// ========== Window Events ==========

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await handleWindowFocusChanged(windowId);
});

// Serial queue — prevents concurrent alarm handlers from racing on storage writes
let _alarmQueue: Promise<void> = Promise.resolve();

function enqueueAlarm(fn: () => Promise<void>): void {
  _alarmQueue = _alarmQueue.then(fn).catch(err => {
    console.error('[TabFlow] alarm handler error:', err);
  });
}

// ========== Alarms ==========

chrome.alarms.onAlarm.addListener((alarm) => {
  enqueueAlarm(async () => {
    if (alarm.name === UNDO_EXPIRE_ALARM) {
      const runtime = await loadRuntime();
      runtime.pendingUndoGroup = null;
      await saveRuntime(runtime);
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    if (alarm.name === STASH_CLEANUP_ALARM) {
      await cleanupExpiredStash();
      return;
    }

    await handleAlarmFired(alarm);
  });
});

// ========== Context Menus ==========

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'manage-tab') {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.url) {
      try {
        const domain = new URL(activeTab.url).hostname;
        await chrome.storage.local.set({ pendingIntent: { domain } });
      } catch {
        // ignore
      }
      chrome.runtime.openOptionsPage();
    }
  }

  if (info.menuItemId === 'settings') {
    chrome.runtime.openOptionsPage();
  }
});

// ========== Message Handler ==========

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case 'UNDO_CLOSE': {
            await performUndo();
            sendResponse({ success: true });
            break;
          }

          case 'RULE_CREATED': {
            const settings = await getSettings();
            await rebuildForRule(message.rule, settings.protectedDomains);
            sendResponse({ success: true });
            break;
          }

          case 'RULE_UPDATED': {
            await clearRuleAlarms(message.rule.id);
            const settings = await getSettings();
            await rebuildForRule(message.rule, settings.protectedDomains);
            sendResponse({ success: true });
            break;
          }

          case 'RULE_DELETED': {
            await clearRuleAlarms(message.ruleId);
            sendResponse({ success: true });
            break;
          }

          case 'PROTECT_DOMAIN': {
            const settings = await getSettings();
            if (!settings.protectedDomains.includes(message.domain)) {
              settings.protectedDomains.push(message.domain);
              await setSettings(settings);
            }
            // Clear alarms for tabs on this domain
            const allTabs = await chrome.tabs.query({});
            for (const tab of allTabs) {
              if (tab.url && tab.id) {
                try {
                  const hostname = new URL(tab.url).hostname;
                  if (
                    hostname === message.domain ||
                    hostname.endsWith('.' + message.domain)
                  ) {
                    await unregisterManagedTab(tab.id);
                  }
                } catch {
                  // ignore
                }
              }
            }
            sendResponse({ success: true });
            break;
          }

          case 'RESTORE_FROM_STASH': {
            await restoreFromStash(message.stashId);
            sendResponse({ success: true });
            break;
          }

          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
    })();

    return true; // Keep channel open for async response
  }
);
