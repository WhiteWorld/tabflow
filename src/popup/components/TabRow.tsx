import { useState } from 'react';
import type { RuntimeState } from '../../shared/types';
import { getDomain, getRootDomain } from '../utils';

interface TabRowProps {
  tab: chrome.tabs.Tab;
  runtime: RuntimeState;
  onManage: (domain: string) => void;
  hideManage?: boolean;
}

export default function TabRow({ tab, runtime, onManage, hideManage }: TabRowProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const domain = tab.url ? getDomain(tab.url) : '';
  const entry = tab.id ? runtime.managedTabs[tab.id] : null;

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tab.id) await chrome.tabs.remove(tab.id);
  };

  const handleManage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (domain) onManage(getRootDomain(domain));
  };

  const handleClick = () => {
    if (tab.id) chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId) chrome.windows.update(tab.windowId, { focused: true });
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-bg2 rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group mx-3 my-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Favicon */}
      <div className="w-4 h-4 flex-shrink-0 rounded overflow-hidden">
        {tab.favIconUrl && !imgError ? (
          <img
            src={tab.favIconUrl}
            alt=""
            className="w-4 h-4"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-4 h-4 bg-bg4 flex items-center justify-center text-[8px] text-ter">
            🌐
          </div>
        )}
      </div>

      {/* Title + domain */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-pri truncate leading-tight">
          {tab.title || domain}
        </div>
        <div className="text-[10px] text-ter font-mono truncate">
          {domain}
          {entry && entry.triggerAt > 0 && (
            <span className="ml-1 text-warn">· {entry.ruleName}</span>
          )}
        </div>
      </div>

      {/* Actions (hover) */}
      {hovered && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {!hideManage && (
            <button
              onClick={handleManage}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-bg3 text-ter hover:text-sec transition-colors text-xs"
              title="Manage"
            >
              ⚙️
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-danger-dim text-ter hover:text-danger transition-colors text-xs"
            title="Close tab"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
