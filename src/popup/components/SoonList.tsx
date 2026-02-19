import { useState, useEffect } from 'react';
import type { ManagedTabEntry } from '../../shared/types';
import { formatCountdown, getDomain } from '../utils';

interface SoonListProps {
  entries: ManagedTabEntry[];
  tabs: chrome.tabs.Tab[];
  search: string;
}

export default function SoonList({ entries, tabs, search }: SoonListProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const tabMap = new Map(tabs.map(t => [t.id, t]));

  const filtered = entries.filter(entry => {
    const tab = tabMap.get(entry.tabId);
    if (!tab) return false;
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      tab.title?.toLowerCase().includes(lower) ||
      tab.url?.toLowerCase().includes(lower)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="text-ter text-xs">No rule-managed tabs</div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-3.5 py-2 text-[10px] text-ter border-b border-white/[0.04]">
        These tabs are managed by rules and will auto-close.
      </div>
      {filtered.map(entry => {
        const tab = tabMap.get(entry.tabId);
        if (!tab) return null;

        const isPending = entry.triggerAt === 0;
        const remaining = isPending ? null : entry.triggerAt - Date.now();
        const isUrgent = remaining !== null && remaining < 5 * 60 * 1000;
        const domain = tab.url ? getDomain(tab.url) : '';

        return (
          <div
            key={entry.tabId}
            className={`flex items-center gap-2.5 px-3.5 py-2 border-b border-white/[0.04] ${
              isUrgent ? 'border-l-2 border-l-danger' : ''
            }`}
          >
            {/* Favicon */}
            <div className="w-4 h-4 flex-shrink-0">
              {tab.favIconUrl ? (
                <img src={tab.favIconUrl} alt="" className="w-4 h-4 rounded-sm" />
              ) : (
                <div className="w-4 h-4 rounded-sm bg-bg4" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-pri truncate">{tab.title || domain}</div>
              <div className="text-[10px] text-ter font-mono truncate">
                {domain} · {entry.ruleName}
              </div>
            </div>

            {/* Countdown pill */}
            {isPending ? (
              <div className="flex-shrink-0 px-2 py-0.5 rounded font-mono text-xs font-semibold bg-bg4 text-ter">
                timer starts on leave
              </div>
            ) : (
              <div className={`flex-shrink-0 px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                isUrgent
                  ? 'bg-danger/10 text-danger animate-blink'
                  : 'bg-warn/10 text-warn'
              }`}>
                {remaining! > 0 ? formatCountdown(remaining!) : 'closing...'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
