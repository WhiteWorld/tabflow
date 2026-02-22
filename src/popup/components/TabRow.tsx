import { useState } from 'react';
import type { RuntimeState } from '../../shared/types';
import { getDomain, getRootDomain } from '../utils';
import { useT } from '../../shared/LangContext';

interface TabRowProps {
  tab: chrome.tabs.Tab;
  runtime: RuntimeState;
  onManage: (domain: string) => void;
  hideManage?: boolean;
}

export default function TabRow({ tab, runtime, onManage, hideManage }: TabRowProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const t = useT();

  const domain = tab.url ? getDomain(tab.url) : '';
  const entry = tab.id ? runtime.managedTabs[tab.id] : null;

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
      className="flex items-center gap-2.5 px-3 py-2 mx-3 my-1.5 rounded-[9px] cursor-pointer transition-all"
      style={{
        background: '#151921',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Favicon 22×22 */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-[6px] overflow-hidden"
        style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.08)' }}
      >
        {tab.favIconUrl && !imgError ? (
          <img
            src={tab.favIconUrl}
            alt=""
            style={{ width: 22, height: 22 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-bg4 text-ter"
            style={{ width: 22, height: 22, fontSize: 11, borderRadius: 6 }}
          >
            🌐
          </div>
        )}
      </div>

      {/* Title + domain */}
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium text-pri truncate leading-tight">
          {tab.title || domain}
        </div>
        <div className="font-mono text-[11px] text-ter truncate">
          {domain}
          {entry && entry.triggerAt > 0 && (
            <span className="ml-1 text-warn">· {entry.ruleName}</span>
          )}
        </div>
      </div>

      {/* Right side: rule pill OR manage button */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {entry && entry.triggerAt > 0 ? (
          <span
            className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-[5px]"
            style={{ background: 'rgba(240,160,48,0.15)', color: '#F0A030' }}
          >
            {entry.ruleName}
          </span>
        ) : !hideManage ? (
          <button
            onClick={handleManage}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[5px] transition-colors"
            style={{
              background: hovered ? 'rgba(60,232,130,0.12)' : 'transparent',
              border: `1px solid ${hovered ? 'rgba(60,232,130,0.2)' : 'transparent'}`,
            }}
            title="Set rule for this site"
          >
            <span className="text-[11px]">⚙️</span>
            {hovered && (
              <span className="text-[11px] font-semibold text-accent">{t('tabrow_manage')}</span>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
