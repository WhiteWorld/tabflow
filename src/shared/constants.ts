import type { Rule } from './types';

// Preset groups for Quick Setup — each domain becomes its own rule on activation
export const PRESET_GROUPS: {
  name: string;
  description: string;
  domains: string[];
  trigger: Rule['trigger'];
}[] = [
  {
    name: 'Social Media',
    description: 'close after 30 min inactive',
    domains: ['x.com', 'twitter.com', 'reddit.com', 'instagram.com', 'weibo.com'],
    trigger: { type: 'inactive', minutes: 30 },
  },
  {
    name: 'Video',
    description: 'close after 1 hr open',
    domains: ['youtube.com', 'bilibili.com'],
    trigger: { type: 'openDuration', minutes: 60 },
  },
  {
    name: 'Shopping',
    description: 'close after 20 min inactive',
    domains: ['amazon.com', 'taobao.com', 'jd.com'],
    trigger: { type: 'inactive', minutes: 20 },
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

export function generateRuleName(domain: string, minutes: number): string {
  const time = minutes >= 60 ? `${minutes / 60}hr` : `${minutes}min`;
  return `${domain} · ${time}`;
}
