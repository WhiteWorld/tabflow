import { useState } from 'react';
import type { StashedTab } from '../../shared/types';
import { formatRelativeTime, getDomain, getTimeGroup } from '../utils';

interface PastListProps {
  stash: StashedTab[];
  onRestore: (id: string) => void;
}

type Filter = 'all' | 'byRule' | 'bySite';

const GROUP_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  older: 'Older',
};

export default function PastList({ stash, onRestore }: PastListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['older']));

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'byRule', label: 'By Rule' },
    { id: 'bySite', label: 'By Site' },
  ];

  const handleClearExpired = async () => {
    const now = Date.now();
    const valid = stash.filter(s => s.expiresAt > now);
    await chrome.storage.local.set({ stash: valid });
  };

  if (stash.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="text-ter text-xs">No stashed tabs yet</div>
        <div className="text-ter text-[10px] mt-1">Auto-closed tabs will appear here</div>
      </div>
    );
  }

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Flat view (≤20) or grouped (>20)
  const useGrouped = stash.length > 20;

  const renderItem = (item: StashedTab) => (
    <div
      key={item.id}
      className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-bg3 transition-colors border-b border-white/[0.04] group"
    >
      {/* Favicon */}
      <div className="w-4 h-4 flex-shrink-0">
        {item.favIconUrl ? (
          <img src={item.favIconUrl} alt="" className="w-4 h-4 rounded-sm" />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-bg4" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-pri truncate">{item.title || getDomain(item.url)}</div>
        <div className="text-[10px] text-ter font-mono truncate">
          {item.closedBy} · {formatRelativeTime(item.closedAt)}
        </div>
      </div>

      {/* Restore */}
      <button
        onClick={() => onRestore(item.id)}
        className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold text-accent bg-accent/10 hover:bg-accent/20 transition-colors opacity-0 group-hover:opacity-100"
      >
        Restore
      </button>
    </div>
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06]">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
              filter === f.id
                ? 'bg-accent/10 text-accent'
                : 'text-ter hover:text-sec'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-ter">{stash.length} stashed</span>
        <button
          onClick={handleClearExpired}
          className="ml-2 text-[10px] text-ter hover:text-danger transition-colors"
        >
          Clear expired
        </button>
      </div>

      {!useGrouped ? (
        stash.map(renderItem)
      ) : (
        (() => {
          const groups: Record<string, StashedTab[]> = {};
          for (const item of stash) {
            const g = getTimeGroup(item.closedAt);
            if (!groups[g]) groups[g] = [];
            groups[g].push(item);
          }

          return (['today', 'yesterday', 'thisWeek', 'older'] as const)
            .filter(g => groups[g]?.length)
            .map(g => {
              const isCollapsed = collapsed.has(g);
              const items = groups[g];
              return (
                <div key={g}>
                  <button
                    onClick={() => toggleGroup(g)}
                    className="w-full flex items-center gap-2 px-3.5 py-1.5 bg-bg1 hover:bg-bg3 transition-colors border-b border-white/[0.06]"
                  >
                    <span className="text-[10px] text-ter">{isCollapsed ? '▶' : '▼'}</span>
                    <span className="text-xs text-sec font-semibold flex-1 text-left">
                      {GROUP_LABELS[g]}
                    </span>
                    <span className="font-mono text-[10px] text-ter">{items.length}</span>
                    {!isCollapsed && (
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          for (const item of items) await onRestore(item.id);
                        }}
                        className="text-[10px] text-accent hover:underline"
                      >
                        Restore all
                      </button>
                    )}
                  </button>
                  {!isCollapsed && items.map(renderItem)}
                </div>
              );
            });
        })()
      )}

      <div className="px-3.5 py-3 text-center text-[10px] text-ter">
        Everything is recoverable for 7 days.
      </div>
    </div>
  );
}
