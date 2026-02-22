import { useState } from 'react';
import type { StashedTab } from '../../shared/types';
import { formatRelativeTime, getDomain, getPastTimeGroup, type PastTimeGroup } from '../utils';
import { useT } from '../../shared/LangContext';
import type { Strings } from '../../shared/lang';

const GROUP_LABEL_KEYS: Record<PastTimeGroup, keyof Strings> = {
  justNow: 'pastlist_group_just_now',
  lastHour: 'pastlist_group_last_hour',
  today: 'pastlist_group_today',
  twoDaysAgo: 'pastlist_group_two_days_ago',
  older: 'pastlist_group_older',
} as const;

interface PastListProps {
  stash: StashedTab[];
  onRestore: (id: string) => void;
  onRestoreAll: (ids: string[]) => void;
  stashExpiryDays: number;
}

const GROUP_ORDER: PastTimeGroup[] = ['justNow', 'lastHour', 'today', 'twoDaysAgo', 'older'];
// Newer groups expanded by default, older collapsed
const DEFAULT_COLLAPSED = new Set<PastTimeGroup>(['twoDaysAgo', 'older']);

function FaviconCell({ url, size = 18 }: { url?: string; size?: number }) {
  return (
    <div
      className="flex-shrink-0 rounded-[5px] overflow-hidden"
      style={{ width: size, height: size, background: 'rgba(255,255,255,0.08)' }}
    >
      {url ? <img src={url} alt="" style={{ width: size, height: size }} /> : null}
    </div>
  );
}

function RestoreBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 font-semibold text-[10px] rounded-[5px]"
      style={{ background: '#3CE882', color: '#080A0F', padding: '3px 8px' }}
    >
      {label}
    </button>
  );
}

export default function PastList({ stash, onRestore, onRestoreAll, stashExpiryDays }: PastListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(DEFAULT_COLLAPSED));
  const t = useT();

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleClearExpired = async () => {
    const now = Date.now();
    await chrome.storage.local.set({ stash: stash.filter(s => s.expiresAt > now) });
  };

  const handleRestoreAll = async (items: StashedTab[], e: React.MouseEvent) => {
    e.stopPropagation();
    // Snapshot ids before any re-render invalidates the array reference
    const ids = items.map(i => i.id);
    await onRestoreAll(ids);
  };

  const expiredCount = stash.filter(s => s.expiresAt <= Date.now()).length;

  // Empty state
  if (stash.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <div className="text-2xl mb-2">🗂</div>
        <div className="text-[12px] font-medium text-ter">{t('pastlist_empty_title')}</div>
        <div className="text-[11px] text-faint mt-1">{t('pastlist_empty_subtitle')}</div>
      </div>
    );
  }

  // Stat row
  const statRow = (
    <div className="flex items-center justify-between px-3.5 py-1.5">
      <span className="text-[11px] text-ter">
        {stash.length === 1 ? t('pastlist_stat_one') : t('pastlist_stat', { n: stash.length })}
      </span>
      {expiredCount > 0 && (
        <button onClick={handleClearExpired} className="text-[10px] text-danger font-medium">
          {t('pastlist_clear_expired', { n: expiredCount })}
        </button>
      )}
    </div>
  );

  const renderItem = (item: StashedTab, inGroup = false) => (
    <div
      key={item.id}
      className="flex items-center gap-2.5"
      style={inGroup
        ? { padding: '7px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }
        : { padding: '7px 10px', borderRadius: 9, background: '#151921', border: '1px solid rgba(255,255,255,0.06)' }
      }
    >
      <FaviconCell url={item.favIconUrl} size={inGroup ? 16 : 18} />
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-medium text-pri truncate">{item.title || getDomain(item.url)}</div>
        <div className="font-mono text-[10.5px] text-ter truncate">
          {item.closedBy} · {formatRelativeTime(item.closedAt)}
        </div>
      </div>
      <RestoreBtn onClick={() => onRestore(item.id)} label={t('pastlist_restore')} />
    </div>
  );

  // ── Flat view (≤10) ──
  if (stash.length <= 10) {
    return (
      <div>
        {statRow}
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          {stash.map(item => renderItem(item, false))}
        </div>
        <div className="px-3.5 pb-3 pt-1 text-center text-[10.5px] text-ter">
          {t('pastlist_expiry', { n: stashExpiryDays })}
        </div>
      </div>
    );
  }

  // ── Grouped view (>10) ──
  const groups: Partial<Record<PastTimeGroup, StashedTab[]>> = {};
  for (const item of stash) {
    const g = getPastTimeGroup(item.closedAt);
    if (!groups[g]) groups[g] = [];
    groups[g]!.push(item);
  }

  return (
    <div>
      {statRow}
      <div className="px-3 pb-2 flex flex-col gap-1.5">
        {GROUP_ORDER.filter(g => groups[g]?.length).map(g => {
          const isCollapsed = collapsed.has(g);
          const items = groups[g]!;
          return (
            <div
              key={g}
              className="rounded-[9px] overflow-hidden"
              style={{
                background: '#151921',
                border: `1px solid ${isCollapsed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)'}`,
              }}
            >
              {/* Group header */}
              <div
                className="flex items-center gap-2 px-2.5 py-2 cursor-pointer select-none"
                onClick={() => toggleGroup(g)}
              >
                <span className={`flex-1 text-[11px] font-semibold ${isCollapsed ? 'text-ter' : 'text-pri'}`}>
                  {t(GROUP_LABEL_KEYS[g])}
                  <span className="font-normal text-faint ml-1.5">
                    {items.length === 1 ? t('pastlist_group_tab', { n: 1 }) : t('pastlist_group_tabs', { n: items.length })}
                  </span>
                </span>
                {!isCollapsed && items.length > 1 && (
                  <button
                    onClick={e => handleRestoreAll(items, e)}
                    className="text-[9.5px] font-semibold text-accent mr-1"
                  >
                    {t('pastlist_restore_all')}
                  </button>
                )}
                <span
                  className="text-[10px] text-ter"
                  style={{
                    display: 'inline-block',
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 0.15s',
                  }}
                >
                  ▼
                </span>
              </div>
              {/* Group items */}
              {!isCollapsed && items.map(item => renderItem(item, true))}
            </div>
          );
        })}
      </div>
      <div className="px-3.5 pb-3 pt-1 text-center text-[9.5px] text-faint">
        {t('pastlist_expiry', { n: stashExpiryDays })}
      </div>
    </div>
  );
}
