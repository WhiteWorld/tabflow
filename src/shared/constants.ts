import type { Rule } from './types';

export const RULE_TEMPLATES: Omit<Rule, 'id' | 'stats' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Social Media · 30min',
    enabled: false,
    domains: ['x.com', 'twitter.com', 'reddit.com', 'instagram.com', 'weibo.com'],
    trigger: { type: 'inactive', minutes: 30 },
    action: 'closeStash',
    source: 'template',
  },
  {
    name: 'Video Sites · 1hr',
    enabled: false,
    domains: ['youtube.com', 'bilibili.com'],
    trigger: { type: 'openDuration', minutes: 60 },
    action: 'closeStash',
    source: 'template',
  },
  {
    name: 'Shopping · 20min',
    enabled: false,
    domains: ['amazon.com', 'taobao.com', 'jd.com'],
    trigger: { type: 'inactive', minutes: 20 },
    action: 'closeStash',
    source: 'template',
  },
];

export const HUMAN_ACTIVITY_GUARD_MS = 15_000;
export const UNDO_WINDOW_MS = 5_000;
export const STASH_CLEANUP_ALARM = 'stash_cleanup';
export const UNDO_EXPIRE_ALARM = 'undo_expire';

export const INTENT_PRESETS = {
  browsing: { triggerType: 'inactive' as const, minutes: 15, label: '⏳ Just browsing' },
  returning: { triggerType: 'inactive' as const, minutes: 120, label: '🔄 I\'ll come back later' },
  important: { label: '📌 Important — don\'t close' },
};

export function generateRuleName(domains: string[], minutes: number): string {
  const time = minutes >= 60 ? `${minutes / 60}hr` : `${minutes}min`;
  const domain = domains[0] ?? 'site';
  const extra = domains.length > 1 ? ` +${domains.length - 1}` : '';
  return `${domain}${extra} · ${time}`;
}
