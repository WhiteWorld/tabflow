import { useMemo, useState, useEffect } from 'react';
import type { RuntimeState, Rule } from '../../shared/types';
import { formatCountdown, getRootDomain } from '../utils';

interface CurrentTabBarProps {
  activeTab: chrome.tabs.Tab | null;
  runtime: RuntimeState;
  rules: Rule[];
  onManage: (domain: string) => void;
}

export default function CurrentTabBar({ activeTab, runtime, rules, onManage }: CurrentTabBarProps) {
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

  const rule = entry ? rules.find(r => r.id === entry.ruleId) : null;
  const configuredMinutes = rule?.trigger.minutes ?? null;

  const timeDisplay = isCounting
    ? (remaining > 0 ? formatCountdown(remaining) : 'closing...')
    : configuredMinutes !== null
      ? (configuredMinutes >= 60 ? `${configuredMinutes / 60}h` : `${configuredMinutes}m`)
      : null;

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

      {hasRule && timeDisplay ? (
        <div
          className="flex items-center px-2.5 py-1 rounded-[7px]"
          style={{
            background: isUrgent ? 'rgba(232,69,90,0.15)' : 'rgba(240,160,48,0.12)',
            border: `1px solid ${isUrgent ? 'rgba(232,69,90,0.2)' : 'rgba(240,160,48,0.18)'}`,
          }}
        >
          <span className={`text-[10.5px] font-bold font-mono flex-shrink-0 ${isUrgent ? 'animate-blink' : ''}`}
            style={{ color: isUrgent ? '#E8455A' : '#F0A030' }}
          >
            {timeDisplay}
          </span>
        </div>
      ) : (
        <button
          onClick={() => onManage(getRootDomain(domain))}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] cursor-pointer"
          style={{
            background: 'rgba(60,232,130,0.15)',
            border: '1px solid rgba(60,232,130,0.25)',
          }}
        >
          <span className="text-[11px]">⚙️</span>
          <span className="text-[10.5px] font-semibold text-accent">Manage</span>
        </button>
      )}
    </div>
  );
}
