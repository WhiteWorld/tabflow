import { useState } from 'react';
import type { RuntimeState } from '../../shared/types';
import TabRow from './TabRow';
import { getRootDomain, formatRelativeTime } from '../utils';
import { extractRootDomain } from '../../shared/utils';

interface TabListProps {
  tabs: chrome.tabs.Tab[];
  runtime: RuntimeState;
  onManage: (domain: string) => void;
}

interface GroupedTabs {
  domain: string;
  tabs: chrome.tabs.Tab[];
}

function groupByDomain(tabs: chrome.tabs.Tab[]): GroupedTabs[] {
  const map = new Map<string, chrome.tabs.Tab[]>();
  for (const tab of tabs) {
    try {
      const hostname = new URL(tab.url ?? '').hostname;
      const rootDomain = extractRootDomain(hostname);
      if (!map.has(rootDomain)) map.set(rootDomain, []);
      map.get(rootDomain)!.push(tab);
    } catch {
      const key = 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tab);
    }
  }
  return Array.from(map.entries())
    .map(([domain, tabs]) => ({ domain, tabs }))
    .sort((a, b) => b.tabs.length - a.tabs.length);
}

export default function TabList({ tabs, runtime, onManage }: TabListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (tabs.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-ter text-xs">
        No tabs to show
      </div>
    );
  }

  if (tabs.length <= 15) {
    return (
      <div className="py-1">
        {tabs.map(tab => (
          <TabRow
            key={tab.id}
            tab={tab}
            runtime={runtime}
            onManage={onManage}
          />
        ))}
      </div>
    );
  }

  // Grouped view for >15 tabs
  const groups = groupByDomain(tabs);

  const toggleGroup = (domain: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

// Get favicon for a domain from the first tab in the group
function getDomainFavicon(tabs: chrome.tabs.Tab[]): string | null {
  const tabWithFavicon = tabs.find(t => t.favIconUrl);
  return tabWithFavicon?.favIconUrl || null;
}

  return (
    <div className="px-3 py-1 flex flex-col gap-1.5">
      {groups.map(({ domain, tabs: groupTabs }) => {
        const isCollapsed = collapsed.has(domain);
        const favicon = getDomainFavicon(groupTabs);
        const ruledCount = groupTabs.filter(t => t.id && runtime.managedTabs[t.id]).length;
        return (
          <div
            key={domain}
            className="rounded-[9px] overflow-hidden"
            style={{
              background: '#151921',
              border: `1px solid ${isCollapsed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            {/* Group header */}
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              {/* Collapse toggle area */}
              <div
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                onClick={() => toggleGroup(domain)}
              >
                {favicon ? (
                  <img src={favicon} alt="" className="flex-shrink-0 rounded-[5px]" style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.08)' }} />
                ) : (
                  <div className="flex-shrink-0 rounded-[5px]" style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.08)' }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-semibold text-pri">{domain}</div>
                  <div className="font-mono text-[9.5px] text-faint">
                    {groupTabs.length} tabs{ruledCount > 0 ? ` · ${ruledCount} ruled` : ''}
                  </div>
                </div>
              </div>
              {/* Manage button — always visible on group header */}
              <button
                onClick={e => { e.stopPropagation(); onManage(getRootDomain(domain)); }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[5px] flex-shrink-0 transition-colors"
                style={{
                  background: ruledCount > 0 ? 'rgba(60,232,130,0.12)' : 'transparent',
                  border: `1px solid ${ruledCount > 0 ? 'rgba(60,232,130,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}
                title="Set rule for this site"
              >
                <span className="text-[10px]">⚙️</span>
                {ruledCount > 0 && (
                  <span className="font-mono text-[10px] font-semibold text-accent ml-0.5">{ruledCount}</span>
                )}
              </button>
              <span
                className="text-[10px] text-ter flex-shrink-0 cursor-pointer transition-transform"
                style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                onClick={() => toggleGroup(domain)}
              >
                ▼
              </span>
            </div>
            {/* Expanded tabs — simple rows, no manage/close buttons (group header handles domain-level manage) */}
            {!isCollapsed && groupTabs.map(tab => {
              const entry = tab.id ? runtime.managedTabs[tab.id] : null;
              const remaining = entry && entry.triggerAt > 0 ? entry.triggerAt - Date.now() : null;
              const urgent = remaining !== null && remaining < 5 * 60 * 1000;
              return (
                <div
                  key={tab.id}
                  className="flex items-center gap-2.5 cursor-pointer hover:bg-bg3 transition-colors"
                  style={{ paddingLeft: 39, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => {
                    if (tab.id) chrome.tabs.update(tab.id, { active: true });
                    if (tab.windowId) chrome.windows.update(tab.windowId, { focused: true });
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-pri truncate">{tab.title || tab.url}</div>
                    <div className="font-mono text-[9px] text-faint">
                      {(() => {
                        const createdAt = (tab.id && runtime.tabCreatedAt[tab.id]) || (tab as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed;
                        return createdAt ? `opened ${formatRelativeTime(createdAt)}` : '';
                      })()}
                    </div>
                  </div>
                  {remaining !== null && (
                    <span
                      className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] flex-shrink-0 ${urgent ? 'animate-blink' : ''}`}
                      style={{
                        background: urgent ? 'rgba(232,69,90,0.12)' : 'rgba(240,160,48,0.12)',
                        color: urgent ? '#E8455A' : '#F0A030',
                      }}
                    >
                      {remaining > 0 ? `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}` : 'closing...'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
