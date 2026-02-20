import { useMemo, useState, useEffect } from 'react';
import type { RuntimeState } from '../../shared/types';
import { formatCountdown, getRootDomain } from '../utils';

interface CurrentTabBarProps {
  activeTab: chrome.tabs.Tab | null;
  runtime: RuntimeState;
  onManage: (domain: string) => void;
}

export default function CurrentTabBar({ activeTab, runtime, onManage }: CurrentTabBarProps) {
  const [, setTick] = useState(0);

  // Tick every second for countdown refresh
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { domain, entry } = useMemo(() => {
    if (!activeTab?.url) return { domain: null, entry: null };
    try {
      const hostname = new URL(activeTab.url).hostname;
      const rootDomain = getRootDomain(hostname);
      const e = activeTab.id ? runtime.managedTabs[activeTab.id] ?? null : null;
      return { domain: rootDomain, entry: e };
    } catch {
      return { domain: null, entry: null };
    }
  }, [activeTab, runtime.managedTabs]);

  if (!domain) return null;

  const hasRule = !!entry;
  const isCounting = entry && entry.triggerAt > 0;
  const remaining = isCounting ? entry.triggerAt - Date.now() : 0;
  const isUrgent = remaining > 0 && remaining < 5 * 60 * 1000;

  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-bg2 border-b border-white/[0.06]">
      {/* Favicon */}
      {activeTab?.favIconUrl ? (
        <img
          src={activeTab.favIconUrl}
          alt=""
          className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-3.5 h-3.5 rounded-sm bg-bg4 flex-shrink-0" />
      )}

      <span className="font-mono text-xs text-ter flex-1 truncate">{domain}</span>

      {hasRule ? (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${
          isUrgent
            ? 'bg-danger/10 border border-danger/20'
            : 'bg-warn/10 border border-warn/20'
        }`}>
          <span className={`text-xs font-semibold font-mono ${isUrgent ? 'text-danger animate-blink' : 'text-warn'}`}>
            {entry.ruleName}
            {isCounting
              ? ` · ${remaining > 0 ? formatCountdown(remaining) : 'closing...'}`
              : ' · timer starts on leave'}
          </span>
        </div>
      ) : (
        <button
          onClick={() => onManage(getRootDomain(domain))}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
        >
          <span className="text-xs">⚙️</span>
          <span className="text-xs font-semibold text-accent">Manage</span>
        </button>
      )}
    </div>
  );
}
