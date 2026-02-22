import { useState, useEffect } from 'react';
import type { ManagedTabEntry, Rule } from '../../shared/types';
import { formatCountdown, getDomain } from '../utils';
import { useT } from '../../shared/LangContext';

interface SoonListProps {
  entries: ManagedTabEntry[];
  tabs: chrome.tabs.Tab[];
  search: string;
  rules: Rule[];
}

export default function SoonList({ entries, tabs, search, rules }: SoonListProps) {
  const [, setTick] = useState(0);
  const t = useT();

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const tabMap = new Map(tabs.map(t => [t.id, t]));

  const filtered = entries
    .filter(entry => {
      const tab = tabMap.get(entry.tabId);
      if (!tab) return false;
      if (!search) return true;
      const lower = search.toLowerCase();
      return (
        tab.title?.toLowerCase().includes(lower) ||
        tab.url?.toLowerCase().includes(lower)
      );
    })
    .sort((a, b) => {
      // pending (triggerAt=0) goes last
      if (a.triggerAt === 0 && b.triggerAt === 0) return 0;
      if (a.triggerAt === 0) return 1;
      if (b.triggerAt === 0) return -1;
      // soonest first
      return a.triggerAt - b.triggerAt;
    });

  if (filtered.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="text-ter text-xs">{t('soonlist_empty')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-3.5 py-2 text-[10px] text-ter">
        {t('soonlist_hint')}
      </div>
      <div className="px-3 pb-2 flex flex-col gap-1.5">
        {filtered.map(entry => {
          const tab = tabMap.get(entry.tabId);
          if (!tab) return null;

          const isPending = entry.triggerAt === 0;
          const remaining = isPending ? null : entry.triggerAt - Date.now();
          const isUrgent = remaining !== null && remaining < 5 * 60 * 1000;
          const domain = tab.url ? getDomain(tab.url) : '';

          const rule = rules.find(r => r.id === entry.ruleId);
          const configuredMinutes = rule?.trigger.minutes ?? null;
          const pendingLabel = configuredMinutes !== null
            ? (configuredMinutes >= 60 ? `${configuredMinutes / 60}h` : `${configuredMinutes}m`)
            : '—';

          return (
            <div
              key={entry.tabId}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px]"
              style={{
                background: '#151921',
                border: `1px solid ${isUrgent ? 'rgba(232,69,90,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {/* Favicon */}
              <div className="flex-shrink-0" style={{ width: 18, height: 18 }}>
                {tab.favIconUrl ? (
                  <img src={tab.favIconUrl} alt="" className="rounded-[5px]" style={{ width: 18, height: 18 }} />
                ) : (
                  <div className="rounded-[5px] bg-bg4" style={{ width: 18, height: 18 }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-pri truncate">{tab.title || domain}</div>
                <div className="font-mono text-[11px] text-ter truncate">
                  {entry.ruleName}
                </div>
              </div>

              {/* Countdown pill */}
              {isPending ? (
                <span
                  className="flex-shrink-0 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-[5px]"
                  style={{ background: '#2C3347', color: '#6B7594' }}
                >
                  {pendingLabel}
                </span>
              ) : (
                <span
                  className={`flex-shrink-0 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-[5px] ${isUrgent ? 'animate-blink' : ''}`}
                  style={{
                    background: isUrgent ? 'rgba(232,69,90,0.15)' : 'rgba(240,160,48,0.15)',
                    color: isUrgent ? '#E8455A' : '#F0A030',
                  }}
                >
                  {remaining! > 0 ? formatCountdown(remaining!) : t('soonlist_closing')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
