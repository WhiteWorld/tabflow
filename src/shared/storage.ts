import type { Rule, StashedTab, Settings, RuntimeState } from './types';

const DEFAULT_SETTINGS: Settings = {
  language: 'auto',
  stashExpiryDays: 7,
  aiEnabled: false,
  aiProvider: 'claude',
  aiApiKey: '',
  isFirstInstall: true,
  onboardingComplete: false,
  protectedDomains: [],
  pendingCleanCount: 0,
};

const DEFAULT_RUNTIME: RuntimeState = {
  managedTabs: {},
  lastUserInteractionAt: 0,
  pendingUndoGroup: null,
};

export async function getRules(): Promise<Rule[]> {
  const data = await chrome.storage.local.get('rules');
  return (data.rules as Rule[]) ?? [];
}

export async function setRules(rules: Rule[]): Promise<void> {
  await chrome.storage.local.set({ rules });
}

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(data.settings as Partial<Settings>) };
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

export async function getRuntime(): Promise<RuntimeState> {
  const data = await chrome.storage.local.get('runtime');
  const stored = data.runtime as Partial<RuntimeState> | undefined;
  return {
    ...DEFAULT_RUNTIME,
    ...stored,
    managedTabs: stored?.managedTabs ?? {},
  };
}

export async function setRuntime(runtime: RuntimeState): Promise<void> {
  await chrome.storage.local.set({ runtime });
}

export async function getStash(): Promise<StashedTab[]> {
  const data = await chrome.storage.local.get('stash');
  return (data.stash as StashedTab[]) ?? [];
}

export async function setStash(stash: StashedTab[]): Promise<void> {
  await chrome.storage.local.set({ stash });
}

export async function getOnboardingBannerDismissed(): Promise<boolean> {
  const data = await chrome.storage.local.get('onboardingBannerDismissed');
  return (data.onboardingBannerDismissed as boolean) ?? false;
}

export async function setOnboardingBannerDismissed(val: boolean): Promise<void> {
  await chrome.storage.local.set({ onboardingBannerDismissed: val });
}
