import { useState } from 'react';
import type { Rule } from '../../shared/types';
import { RULE_TEMPLATES } from '../../shared/constants';

interface QuickSetupPageProps {
  rules: Rule[];
  onDone: () => void;
}

export default function QuickSetupPage({ rules, onDone }: QuickSetupPageProps) {
  // Find template rules by name
  const templateRules = rules.filter(r => r.source === 'template');
  const [enabled, setEnabled] = useState<Set<string>>(new Set());

  const handleToggle = (ruleId: string) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  const handleDone = async () => {
    // Enable selected template rules
    const data = await chrome.storage.local.get('rules');
    const allRules = (data.rules as Rule[]) ?? [];
    const updated = allRules.map(r => ({
      ...r,
      enabled: enabled.has(r.id) ? true : r.enabled,
    }));
    await chrome.storage.local.set({ rules: updated });

    // Notify background for each enabled rule
    for (const rule of updated.filter(r => enabled.has(r.id))) {
      await chrome.runtime.sendMessage({ type: 'RULE_CREATED', rule });
    }

    onDone();
  };

  const displayTemplates = templateRules.length > 0 ? templateRules : RULE_TEMPLATES.map((t, i) => ({
    ...t,
    id: `template-${i}`,
    stats: { triggeredCount: 0 },
    createdAt: 0,
    updatedAt: 0,
  }));

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
        <div className="text-[18px] font-bold text-pri mb-1">⚡ Quick Setup</div>
        <div className="text-[12.5px] text-ter">Toggle on the rules you want. You can customize them later.</div>
      </div>

      {/* Template cards */}
      <div className="flex flex-col gap-2.5 mb-5">
        {displayTemplates.map(rule => {
          const isOn = enabled.has(rule.id);
          return (
            <div
              key={rule.id}
              onClick={() => handleToggle(rule.id)}
              className="px-4 py-3.5 rounded-[11px] cursor-pointer transition-all"
              style={{
                background: isOn ? 'rgba(60,232,130,0.06)' : '#151921',
                border: `1px solid ${isOn ? 'rgba(60,232,130,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13.5px] font-semibold text-pri">{rule.name}</span>
                {/* Toggle */}
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
                    style={{
                      width: 14,
                      height: 14,
                      top: 2.5,
                      left: isOn ? 17.5 : 2.5,
                    }}
                  />
                </div>
              </div>
              <div className="text-[11px] text-ter leading-snug mb-2">
                {rule.trigger.type === 'inactive' ? 'inactive' : 'open'} {rule.trigger.minutes}min — auto-close matching tabs
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {rule.domains.map(d => (
                  <span
                    key={d}
                    className="font-mono text-[9.5px] px-1.5 py-0.5 rounded-[4px]"
                    style={{ background: 'rgba(80,144,240,0.12)', color: '#5090F0' }}
                  >
                    {d}
                  </span>
                ))}
                <span
                  className="font-mono text-[9.5px] px-1.5 py-0.5 rounded-[4px] cursor-pointer"
                  style={{ background: '#252B3C', color: '#3C4360' }}
                >
                  + edit
                </span>
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
          Skip all
        </button>
        <button
          onClick={handleDone}
          className="flex-[2] py-2.5 rounded-[9px] text-[13px] font-bold"
          style={{ background: '#3CE882', color: '#080A0F', border: 'none' }}
        >
          Done · Activate {enabled.size} rule{enabled.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
