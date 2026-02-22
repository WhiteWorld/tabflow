import { useState } from 'react';
import type { Rule } from '../../shared/types';
import { PRESET_GROUPS, generateRuleName } from '../../shared/constants';
import { useT } from '../../shared/LangContext';

interface QuickSetupPageProps {
  rules: Rule[];
  onDone: () => void;
}

export default function QuickSetupPage({ onDone }: QuickSetupPageProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const t = useT();

  const handleToggle = (groupName: string) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const handleDone = async () => {
    const selectedGroups = PRESET_GROUPS.filter(g => enabled.has(g.name));
    if (selectedGroups.length === 0) { onDone(); return; }

    // Expand each group into per-domain rules
    const newRules: Rule[] = selectedGroups.flatMap(group =>
      group.domains.map(domain => ({
        id: crypto.randomUUID(),
        name: generateRuleName(domain, group.trigger.minutes),
        enabled: true,
        domains: [domain],
        trigger: group.trigger,
        action: 'closeStash' as const,
        source: 'template' as const,
        stats: { triggeredCount: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }))
    );

    const data = await chrome.storage.local.get('rules');
    const existing = (data.rules as Rule[]) ?? [];
    await chrome.storage.local.set({ rules: [...existing, ...newRules] });

    for (const rule of newRules) {
      await chrome.runtime.sendMessage({ type: 'RULE_CREATED', rule });
    }

    onDone();
  };

  const totalDomains = PRESET_GROUPS
    .filter(g => enabled.has(g.name))
    .reduce((n, g) => n + g.domains.length, 0);

  return (
    <div
      className="max-w-[480px] mx-auto rounded-xl"
      style={{
        background: '#0E1117',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 28px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <div className="text-[18px] font-bold text-pri mb-1">{t('quicksetup_title')}</div>
        <div className="text-[12.5px] text-ter">{t('quicksetup_subtitle')}</div>
      </div>

      {/* Preset group cards */}
      <div className="flex flex-col gap-2.5 mb-5">
        {PRESET_GROUPS.map(group => {
          const isOn = enabled.has(group.name);
          return (
            <div
              key={group.name}
              onClick={() => handleToggle(group.name)}
              className="px-4 py-3.5 rounded-[11px] cursor-pointer transition-all"
              style={{
                background: isOn ? 'rgba(60,232,130,0.06)' : '#151921',
                border: `1px solid ${isOn ? 'rgba(60,232,130,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13.5px] font-semibold text-pri">{group.name}</span>
                <div
                  className="relative flex-shrink-0 transition-colors"
                  style={{
                    width: 34,
                    height: 19,
                    borderRadius: 10,
                    background: isOn ? '#3CE882' : '#252B3C',
                  }}
                >
                  <div
                    className="absolute bg-white rounded-full transition-all"
                    style={{ width: 14, height: 14, top: 2.5, left: isOn ? 17.5 : 2.5 }}
                  />
                </div>
              </div>
              <div className="text-[11px] text-ter leading-snug mb-2">{group.description}</div>
              <div className="flex gap-1.5 flex-wrap">
                {group.domains.map(d => (
                  <span
                    key={d}
                    className="font-mono text-[9.5px] px-1.5 py-0.5 rounded-[4px]"
                    style={{ background: 'rgba(80,144,240,0.12)', color: '#5090F0' }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom buttons */}
      <div className="flex gap-2">
        <button
          className="flex-1 py-2.5 rounded-[9px] text-[12.5px] text-ter"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
          onClick={onDone}
        >
          {t('quicksetup_skip')}
        </button>
        <button
          onClick={handleDone}
          className="flex-[2] py-2.5 rounded-[9px] text-[13px] font-bold"
          style={{ background: '#3CE882', color: '#080A0F', border: 'none' }}
        >
          {totalDomains > 0 ? (totalDomains === 1 ? t('quicksetup_done_with_count_one') : t('quicksetup_done_with_count', { n: totalDomains })) : t('quicksetup_done')}
        </button>
      </div>
    </div>
  );
}
