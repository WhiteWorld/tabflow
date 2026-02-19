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
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-pri mb-1">Pick your presets</h2>
      <p className="text-sec text-sm mb-8">Enable the rules you want. You can always change them later.</p>

      <div className="flex flex-col gap-3 mb-8">
        {displayTemplates.map(rule => {
          const isOn = enabled.has(rule.id);
          return (
            <div
              key={rule.id}
              onClick={() => handleToggle(rule.id)}
              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                isOn
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-white/[0.06] bg-bg2 hover:border-white/[0.12]'
              }`}
            >
              <div className="flex-1">
                <div className="text-sm font-semibold text-pri mb-1">{rule.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {rule.domains.map(d => (
                    <span key={d} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-info/10 text-info">
                      {d}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warn/10 text-warn">
                    {rule.trigger.type === 'inactive' ? 'inactive' : 'open'} {rule.trigger.minutes}min
                  </span>
                </div>
              </div>
              {/* Toggle */}
              <div
                className={`w-9 h-5 rounded-full relative flex-shrink-0 mt-0.5 transition-colors ${
                  isOn ? 'bg-accent' : 'bg-bg4'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                    isOn ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleDone}
        className="w-full py-3 rounded-lg bg-accent text-bg1 font-semibold text-sm hover:bg-accent/90 transition-colors"
      >
        Done · Activate {enabled.size} rule{enabled.size !== 1 ? 's' : ''}
      </button>
    </div>
  );
}
