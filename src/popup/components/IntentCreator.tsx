import { useState } from 'react';
import type { Rule } from '../../shared/types';
import { generateRuleName } from '../../shared/constants';

interface IntentCreatorProps {
  domain: string;
  rules: Rule[];
  onClose: () => void;
  onSuccess: () => void;
}

type Intent = 'browsing' | 'returning' | 'important' | null;

const INTENTS = [
  {
    id: 'browsing' as const,
    icon: '⏳',
    label: 'Just browsing',
    hint: 'Close after 15 min inactive',
    minutes: 15,
    triggerType: 'inactive' as const,
  },
  {
    id: 'returning' as const,
    icon: '🔄',
    label: "I'll come back later",
    hint: 'Close after 2 hrs inactive',
    minutes: 120,
    triggerType: 'inactive' as const,
  },
  {
    id: 'important' as const,
    icon: '📌',
    label: "Important — don't close",
    hint: 'Never auto-close this site',
    minutes: 0,
    triggerType: null,
  },
];

export default function IntentCreator({ domain, rules, onClose, onSuccess }: IntentCreatorProps) {
  const [selected, setSelected] = useState<Intent>(null);
  const [loading, setLoading] = useState(false);

  // Duplicate detection
  const existingRule = rules.find(
    r => r.enabled && r.domains.some(d => d === domain || domain.endsWith('.' + d))
  );

  const handleDone = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      if (selected === 'important') {
        await chrome.runtime.sendMessage({ type: 'PROTECT_DOMAIN', domain });
      } else {
        const intent = INTENTS.find(i => i.id === selected)!;
        const rule: Rule = {
          id: crypto.randomUUID(),
          name: generateRuleName([domain], intent.minutes),
          enabled: true,
          domains: [domain],
          trigger: { type: intent.triggerType!, minutes: intent.minutes },
          action: 'closeStash',
          source: 'manual',
          stats: { triggeredCount: 0 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // If replacing existing rule, remove it first
        if (existingRule) {
          const data = await chrome.storage.local.get('rules');
          const existing = (data.rules as Rule[]) ?? [];
          await chrome.storage.local.set({
            rules: existing.filter(r => r.id !== existingRule.id),
          });
          await chrome.runtime.sendMessage({ type: 'RULE_DELETED', ruleId: existingRule.id });
        }

        const data = await chrome.storage.local.get('rules');
        const existing = (data.rules as Rule[]) ?? [];
        await chrome.storage.local.set({ rules: [...existing, rule] });
        await chrome.runtime.sendMessage({ type: 'RULE_CREATED', rule });
      }

      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50" style={{ width: 380 }}>
      {/* Dimmed backdrop with tab list showing through */}
      <div className="absolute inset-0" style={{ background: 'rgba(14,17,23,0.7)' }} />

      {/* Modal card */}
      <div
        className="absolute"
        style={{
          top: 8,
          left: 16,
          right: 16,
          background: '#0E1117',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Domain row */}
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg mb-3.5"
          style={{ background: '#151921', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-4 h-4 rounded-sm bg-bg4 flex items-center justify-center text-[8px] flex-shrink-0">🌐</div>
          <span className="font-semibold text-[12.5px] text-pri flex-1 truncate">{domain}</span>
          <span className="font-mono text-[9px] text-ter">current tab</span>
        </div>

        {/* Duplicate warning */}
        {existingRule && (
          <div
            className="px-3 py-2 rounded-[9px] mb-3 text-xs text-warn"
            style={{ background: 'rgba(240,160,48,0.12)', border: '1px solid rgba(240,160,48,0.2)' }}
          >
            Already covered by <b>{existingRule.name}</b>
            <button onClick={() => setSelected('browsing')} className="ml-2 underline">Replace</button>
          </div>
        )}

        {/* Intent question */}
        <div className="text-[12px] font-semibold text-sec mb-2.5">Why is this tab open?</div>

        {/* Intent options */}
        <div className="flex flex-col gap-1.5 mb-3.5">
          {INTENTS.map(intent => {
            const isSelected = selected === intent.id;
            const colorMap = {
              browsing: { color: '#3CE882', bg: 'rgba(60,232,130,0.12)', border: '#3CE882' },
              returning: { color: '#F0A030', bg: 'rgba(240,160,48,0.12)', border: '#F0A030' },
              important: { color: '#5090F0', bg: 'rgba(80,144,240,0.12)', border: '#5090F0' },
            };
            const c = colorMap[intent.id];
            return (
              <button
                key={intent.id}
                onClick={() => setSelected(intent.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-left transition-colors"
                style={{
                  background: isSelected ? c.bg : '#151921',
                  border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span className="text-base flex-shrink-0">{intent.icon}</span>
                <div className="flex-1">
                  <div className="text-[12px] font-semibold" style={{ color: isSelected ? c.color : '#9AA4BD' }}>
                    {intent.label}
                  </div>
                  <div className="text-[9.5px] text-ter mt-0.5">{intent.hint}</div>
                </div>
                {isSelected && <span className="text-[12px]" style={{ color: c.color }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-[7px] text-xs font-semibold text-sec"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={!selected || loading}
            className="flex-[2] py-2 rounded-[7px] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#3CE882', color: '#080A0F' }}
          >
            {loading ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
