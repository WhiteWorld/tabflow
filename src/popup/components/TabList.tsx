import { useState } from 'react';
import type { RuntimeState } from '../../shared/types';
import TabRow from './TabRow';
import { getRootDomain } from '../utils';
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
      <div>
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
    <div>
      {groups.map(({ domain, tabs: groupTabs }) => {
        const isCollapsed = collapsed.has(domain);
        const favicon = getDomainFavicon(groupTabs);
        return (
          <div key={domain}>
            <div className="flex items-center gap-2 px-3 py-2 bg-bg1 border-b border-white/[0.06]">
              <button
                onClick={() => toggleGroup(domain)}
                className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <span className="text-[10px] text-ter w-3 text-center">{isCollapsed ? '▶' : '▼'}</span>
                {favicon ? (
                  <img src={favicon} alt="" className="w-4 h-4 rounded flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded bg-bg4 flex-shrink-0" />
                )}
                <span className="font-mono text-xs text-sec flex-1 text-left truncate">{domain}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg3 text-ter">{groupTabs.length}</span>
              </button>
              <button
                onClick={() => onManage(getRootDomain(domain))}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-bg4 text-ter hover:text-sec transition-colors text-xs flex-shrink-0"
                title="Manage this site"
              >
                ⚙️
              </button>
            </div>
            {!isCollapsed && groupTabs.map(tab => (
              <TabRow
                key={tab.id}
                tab={tab}
                runtime={runtime}
                onManage={onManage}
                hideManage
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
