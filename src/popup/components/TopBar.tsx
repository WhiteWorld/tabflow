import { useState } from 'react';
import { useT } from '../../shared/LangContext';

interface TopBarProps {
  tabCount: number;
  ruleCount: number;
}

function Tooltip({ text }: { text: string }) {
  return (
    <div
      className="absolute right-0 top-full mt-1.5 z-50 pointer-events-none"
      style={{
        background: '#1C2230',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '4px 8px',
        whiteSpace: 'nowrap',
        fontSize: 11,
        color: '#9AA4BD',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {text}
    </div>
  );
}

export default function TopBar({ tabCount, ruleCount }: TopBarProps) {
  const [tooltip, setTooltip] = useState<'tabs' | 'sites' | 'settings' | null>(null);
  const t = useT();

  const openOptions = async () => {
    await chrome.storage.local.set({ pendingIntent: 'settings' });
    chrome.runtime.openOptionsPage();
  };

  const openRules = async () => {
    await chrome.storage.local.set({ pendingIntent: 'rules' });
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 bg-bg2 border-b border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-bg0 text-[11px] font-bold"
          style={{ background: 'linear-gradient(135deg, #3CE882, #28B860)' }}
        >
          ⚡
        </div>
        <span className="font-bold text-[13px] text-pri">TabFlow</span>
      </div>

      {/* Stats + Settings */}
      <div className="flex items-center gap-2">
        {/* Tab count */}
        <div
          className="relative"
          onMouseEnter={() => setTooltip('tabs')}
          onMouseLeave={() => setTooltip(null)}
        >
          <span className="font-mono text-[10px] text-ter cursor-default">
            <b className="text-sec">{tabCount}</b> {t('topbar_tabs')}
          </span>
          {tooltip === 'tabs' && <Tooltip text={t('topbar_tabs_tooltip')} />}
        </div>

        {/* Sites count */}
        <div
          className="relative"
          onMouseEnter={() => setTooltip('sites')}
          onMouseLeave={() => setTooltip(null)}
        >
          <button
            onClick={openRules}
            className="font-mono text-[10px] text-ter hover:text-accent transition-colors"
          >
            <b className="text-sec">{ruleCount}</b> {t('topbar_sites')}
          </button>
          {tooltip === 'sites' && <Tooltip text={t('topbar_sites_tooltip')} />}
        </div>

        {/* Settings */}
        <div
          className="relative ml-1"
          onMouseEnter={() => setTooltip('settings')}
          onMouseLeave={() => setTooltip(null)}
        >
          <button
            onClick={openOptions}
            className="w-6 h-6 flex items-center justify-center rounded-[6px] text-ter hover:text-pri hover:bg-white/[0.06] transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
              <path fillRule="evenodd" d="M6.5 1a.5.5 0 0 0-.488.392L5.72 2.77a5.5 5.5 0 0 0-.914.527l-1.348-.39a.5.5 0 0 0-.577.24L1.88 4.62a.5.5 0 0 0 .116.627l1.07.9a5.6 5.6 0 0 0 0 1.706l-1.07.9a.5.5 0 0 0-.116.627l1 1.473a.5.5 0 0 0 .577.24l1.348-.39c.285.2.59.375.914.527l.292 1.378A.5.5 0 0 0 6.5 13h3a.5.5 0 0 0 .488-.392l.292-1.378a5.5 5.5 0 0 0 .914-.527l1.348.39a.5.5 0 0 0 .577-.24l1-1.473a.5.5 0 0 0-.116-.627l-1.07-.9a5.6 5.6 0 0 0 0-1.706l1.07-.9a.5.5 0 0 0 .116-.627l-1-1.473a.5.5 0 0 0-.577-.24l-1.348.39a5.5 5.5 0 0 0-.914-.527L9.488 1.392A.5.5 0 0 0 9.5 1h-3Zm-1 7a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" clipRule="evenodd"/>
            </svg>
          </button>
          {tooltip === 'settings' && <Tooltip text={t('topbar_settings_tooltip')} />}
        </div>
      </div>
    </div>
  );
}
