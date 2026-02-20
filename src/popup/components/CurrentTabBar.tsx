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
    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-bg3 border-b border-white/[0.06]">
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

      <span className="font-mono text-[10.5px] text-ter flex-1 truncate">{domain}</span>

      {hasRule ? (
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-[5px]"
          style={{
            background: isUrgent ? 'rgba(232,69,90,0.12)' : 'rgba(240,160,48,0.12)',
            border: `1px solid ${isUrgent ? 'rgba(232,69,90,0.15)' : 'rgba(240,160,48,0.15)'}`,
          }}
        >
          <span className={`text-[10px] font-semibold font-mono ${isUrgent ? 'text-danger animate-blink' : 'text-warn'}`}>
            {entry.ruleName}
            {isCounting
              ? ` · ${remaining > 0 ? formatCountdown(remaining) : 'closing...'}`
              : ' · timer starts on leave'}
          </span>
        </div>
      ) : (
        <button
          onClick={() => onManage(getRootDomain(domain))}
          className="flex items-center gap-1 px-2 py-0.5 rounded-[5px] cursor-pointer"
          style={{
            background: 'rgba(60,232,130,0.12)',
            border: '1px solid rgba(60,232,130,0.2)',
          }}
        >
          <span className="text-[10px]">⚙️</span>
          <span className="text-[10px] font-semibold text-accent">Manage</span>
        </button>
      )}
    </div>
  );
}
