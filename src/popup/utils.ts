import { extractRootDomain } from '../shared/utils';

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Strip www. prefix so rules cover all subdomains (e.g. www.douban.com → douban.com)
export function getRootDomain(hostname: string): string {
  return extractRootDomain(hostname);
}

export type PastTimeGroup = 'justNow' | 'lastHour' | 'today' | 'twoDaysAgo' | 'older';

export function getPastTimeGroup(closedAt: number): PastTimeGroup {
  const diffMs = Date.now() - closedAt;
  const diffMin = diffMs / 60000;
  const diffHour = diffMs / 3600000;
  const diffDay = diffMs / 86400000;

  if (diffMin < 10) return 'justNow';
  if (diffHour < 1) return 'lastHour';
  if (diffDay < 1) return 'today';
  if (diffDay < 2) return 'twoDaysAgo';
  return 'older';
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
