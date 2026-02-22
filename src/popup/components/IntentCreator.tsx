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
    hint: 'Close after inactive',
    defaultMinutes: 15,
    triggerType: 'inactive' as const,
  },
  {
    id: 'returning' as const,
    icon: '🔄',
    label: "I'll come back later",
    hint: 'Close after inactive',
    defaultMinutes: 120,
    triggerType: 'inactive' as const,
  },
  {
    id: 'important' as const,
    icon: '📌',
    label: "Important — don't close",
    hint: 'Never auto-close this site',
    defaultMinutes: 0,
    triggerType: null,
  },
];

const TIME_PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function IntentCreator({ domain, rules, onClose, onSuccess }: IntentCreatorProps) {
  const [selected, setSelected] = useState<Intent>(null);
  const [minutes, setMinutes] = useState<number>(15);
  const [customMinutes, setCustomMinutes] = useState('');
  const [loading, setLoading] = useState(false);

  // Duplicate detection
  const existingRule = rules.find(
    r => r.enabled && r.domains.some(d => d === domain || domain.endsWith('.' + d))
  );

  const handleSelectIntent = (id: Intent) => {
    setSelected(id);
    const intent = INTENTS.find(i => i.id === id);
    if (intent && intent.defaultMinutes > 0) {
      setMinutes(intent.defaultMinutes);
      setCustomMinutes('');
    }
  };

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
          name: generateRuleName(domain, minutes),
          enabled: true,
          domains: [domain],
          trigger: { type: intent.triggerType!, minutes },
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

  const selectedIntent = INTENTS.find(i => i.id === selected);
  const showTimePicker = selected && selected !== 'important';

  const colorMap = {
    browsing: { color: '#3CE882', bg: 'rgba(60,232,130,0.12)', border: '#3CE882' },
    returning: { color: '#F0A030', bg: 'rgba(240,160,48,0.12)', border: '#F0A030' },
    important: { color: '#5090F0', bg: 'rgba(80,144,240,0.12)', border: '#5090F0' },
  };

  return (
    <div className="absolute inset-0 z-50" style={{ width: 380 }}>
      {/* Dimmed backdrop */}
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
            <button onClick={() => handleSelectIntent('browsing')} className="ml-2 underline">Replace</button>
          </div>
        )}

        {/* Intent question */}
        <div className="text-[12px] font-semibold text-sec mb-2.5">Why is this tab open?</div>

        {/* Intent options */}
        <div className="flex flex-col gap-1.5 mb-3">
          {INTENTS.map(intent => {
            const isSelected = selected === intent.id;
            const c = colorMap[intent.id];
            return (
              <button
                key={intent.id}
                onClick={() => handleSelectIntent(intent.id)}
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
                  <div className="text-[9.5px] text-ter mt-0.5">
                    {intent.id !== 'important' && isSelected
                      ? `Close after ${formatMinutes(minutes)} inactive`
                      : intent.hint}
                  </div>
                </div>
                {isSelected && <span className="text-[12px]" style={{ color: c.color }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Time picker — shown when a timed intent is selected */}
        {showTimePicker && (
          <div
            className="mb-3 px-3 py-2.5 rounded-[9px]"
            style={{ background: '#151921', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-[10px] font-semibold text-ter uppercase tracking-wide mb-2">Close after</div>
            <div className="flex gap-1.5 mb-2">
              {TIME_PRESETS.map(preset => {
                const isActive = minutes === preset.minutes && !customMinutes;
                return (
                  <button
                    key={preset.minutes}
                    onClick={() => { setMinutes(preset.minutes); setCustomMinutes(''); }}
                    className="flex-1 py-1.5 text-center text-[11px] font-semibold rounded-[6px] transition-colors"
                    style={{
                      border: `1px solid ${isActive ? '#3CE882' : 'rgba(255,255,255,0.06)'}`,
                      background: isActive ? 'rgba(60,232,130,0.12)' : 'transparent',
                      color: isActive ? '#3CE882' : '#9AA4BD',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={customMinutes}
                onChange={e => {
                  const v = e.target.value;
                  setCustomMinutes(v);
                  const n = Number(v);
                  if (n > 0) setMinutes(n);
                }}
                placeholder="Custom"
                className="font-mono text-[11px] text-pri outline-none px-2 py-1 rounded-[6px] w-20"
                style={{
                  background: '#0E1117',
                  border: `1px solid ${customMinutes ? '#3CE882' : 'rgba(255,255,255,0.06)'}`,
                  color: '#EAF0FA',
                }}
              />
              <span className="text-[10px] text-ter">min</span>
              {customMinutes && (
                <span className="text-[10px] font-semibold text-accent">= {formatMinutes(Number(customMinutes))}</span>
              )}
            </div>
          </div>
        )}

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
            {loading ? 'Saving...' : existingRule ? 'Replace & Save' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
