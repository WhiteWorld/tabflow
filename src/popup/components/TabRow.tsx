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
      className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-bg3 transition-colors cursor-pointer border-b border-white/[0.04] group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Favicon */}
      <div className="w-4 h-4 flex-shrink-0">
        {tab.favIconUrl && !imgError ? (
          <img
            src={tab.favIconUrl}
            alt=""
            className="w-4 h-4 rounded-sm"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-bg4 flex items-center justify-center text-[8px] text-ter">
            🌐
          </div>
        )}
      </div>

      {/* Title + domain */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-pri truncate leading-tight">
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
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-bg4 text-ter hover:text-sec transition-colors text-xs"
              title="Manage"
            >
              ⚙️
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-danger/10 text-ter hover:text-danger transition-colors text-xs"
            title="Close tab"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
