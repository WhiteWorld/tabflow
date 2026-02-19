import type { StashedTab } from '../shared/types';
import { getStash, setStash, getSettings } from '../shared/storage';

export async function saveToStash(tab: chrome.tabs.Tab, closedBy: string): Promise<StashedTab> {
  const settings = await getSettings();
  const stash = await getStash();

  const now = Date.now();
  const entry: StashedTab = {
    id: crypto.randomUUID(),
    url: tab.url ?? '',
    title: tab.title ?? tab.url ?? '',
    favIconUrl: tab.favIconUrl ?? '',
    closedAt: now,
    closedBy,
    expiresAt: now + settings.stashExpiryDays * 24 * 60 * 60 * 1000,
  };

  stash.push(entry);
  await setStash(stash);
  return entry;
}

export async function restoreFromStash(stashId: string): Promise<void> {
  const stash = await getStash();
  const entry = stash.find(s => s.id === stashId);

  if (entry) {
    await chrome.tabs.create({ url: entry.url });
    await setStash(stash.filter(s => s.id !== stashId));
  }
}

export async function deleteFromStash(stashId: string): Promise<void> {
  const stash = await getStash();
  await setStash(stash.filter(s => s.id !== stashId));
}

export async function cleanupExpiredStash(): Promise<void> {
  const stash = await getStash();
  const now = Date.now();
  const valid = stash.filter(s => s.expiresAt > now);

  if (valid.length !== stash.length) {
    await setStash(valid);
  }
}
