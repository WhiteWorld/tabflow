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
    <div className="absolute inset-0 z-50 bg-bg1/95 flex flex-col" style={{ width: 380 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-3 border-b border-white/[0.06]">
        <div className="w-4 h-4 rounded-sm bg-bg4 flex items-center justify-center text-[8px]">🌐</div>
        <span className="font-mono text-xs text-sec flex-1 truncate">{domain}</span>
        <span className="text-[10px] text-ter bg-bg3 px-1.5 py-0.5 rounded">current tab</span>
      </div>

      {/* Duplicate warning */}
      {existingRule && (
        <div className="mx-3.5 mt-3 px-3 py-2 rounded bg-warn/10 border border-warn/20 text-xs text-warn">
          Already covered by <b>{existingRule.name}</b>
          <button
            onClick={() => setSelected('browsing')}
            className="ml-2 underline text-warn"
          >
            Replace
          </button>
        </div>
      )}

      {/* Intent question */}
      <div className="px-3.5 pt-4 pb-2">
        <div className="text-sm font-semibold text-pri">Why is this tab open?</div>
      </div>

      {/* Intent options */}
      <div className="px-3.5 flex flex-col gap-2 flex-1">
        {INTENTS.map(intent => (
          <button
            key={intent.id}
            onClick={() => setSelected(intent.id)}
            className={`flex items-center gap-3 px-3 py-3 rounded-md border text-left transition-colors ${
              selected === intent.id
                ? 'border-accent/40 bg-accent/10'
                : 'border-white/[0.06] bg-bg3 hover:border-white/[0.12]'
            }`}
          >
            <span className="text-lg">{intent.icon}</span>
            <div>
              <div className={`text-xs font-semibold ${selected === intent.id ? 'text-accent' : 'text-pri'}`}>
                {intent.label}
              </div>
              <div className="text-[10px] text-ter mt-0.5">{intent.hint}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3.5 py-3 border-t border-white/[0.06] mt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded text-xs font-semibold text-ter border border-white/[0.06] hover:border-white/[0.12] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDone}
          disabled={!selected || loading}
          className="flex-1 py-2 rounded text-xs font-semibold bg-accent text-bg1 hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Done'}
        </button>
      </div>
    </div>
  );
}
