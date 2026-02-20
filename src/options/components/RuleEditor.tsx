import { useState } from 'react';
import type { Rule } from '../../shared/types';
import { generateRuleName } from '../../shared/constants';
import { normalizeDomain } from '../../shared/utils';

interface RuleEditorProps {
  rule: Rule | null;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

const TIME_PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
];

export default function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const [domainsInput, setDomainsInput] = useState(rule?.domains.join(', ') ?? '');
  const [minutes, setMinutes] = useState(rule?.trigger.minutes ?? 30);
  const [triggerType, setTriggerType] = useState<'inactive' | 'openDuration'>(
    rule?.trigger.type ?? 'inactive'
  );
  const [customMinutes, setCustomMinutes] = useState('');

  const domains = domainsInput
    .split(',')
    .map(d => normalizeDomain(d))
    .filter(Boolean);

  const handleSave = () => {
    if (domains.length === 0) return;

    const name = generateRuleName(domains, minutes);
    const saved: Rule = {
      id: rule?.id ?? crypto.randomUUID(),
      name,
      enabled: rule?.enabled ?? true,
      domains,
      trigger: { type: triggerType, minutes },
      action: 'closeStash',
      source: rule?.source ?? 'manual',
      stats: rule?.stats ?? { triggeredCount: 0 },
      createdAt: rule?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    onSave(saved);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: Domain */}
      <div>
        <div className="text-xs font-semibold text-sec uppercase tracking-wider mb-2">
          Step 1 — Which site?
        </div>
        <input
          type="text"
          value={domainsInput}
          onChange={e => setDomainsInput(e.target.value)}
          placeholder="e.g. reddit.com, twitter.com"
          className="w-full bg-bg3 text-sm text-pri border border-white/[0.06] rounded-lg px-3 py-2.5 outline-none focus:border-white/[0.12] placeholder-ter"
        />
        <div className="text-[10px] text-ter mt-1">Comma-separated · Subdomains auto-matched</div>
      </div>

      {/* Step 2: Time */}
      <div>
        <div className="text-xs font-semibold text-sec uppercase tracking-wider mb-2">
          Step 2 — Close after
        </div>
        <div className="flex flex-wrap gap-2">
          {TIME_PRESETS.map(preset => (
            <button
              key={preset.minutes}
              onClick={() => { setMinutes(preset.minutes); setCustomMinutes(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                minutes === preset.minutes && !customMinutes
                  ? 'bg-accent text-bg1'
                  : 'bg-bg3 text-sec hover:bg-bg4 border border-white/[0.06]'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <input
            type="number"
            value={customMinutes}
            onChange={e => {
              setCustomMinutes(e.target.value);
              const n = Number(e.target.value);
              if (n > 0) setMinutes(n);
            }}
            placeholder="Custom min"
            className="w-24 bg-bg3 text-xs text-pri border border-white/[0.06] rounded-lg px-2 py-1.5 outline-none focus:border-white/[0.12] placeholder-ter"
          />
        </div>
      </div>

      {/* Step 3: Trigger type */}
      <div>
        <div className="text-xs font-semibold text-sec uppercase tracking-wider mb-2">
          Step 3 — Start counting when...
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setTriggerType('inactive')}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
              triggerType === 'inactive'
                ? 'border-accent/30 bg-accent/5'
                : 'border-white/[0.06] bg-bg3 hover:border-white/[0.12]'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
              triggerType === 'inactive' ? 'border-accent bg-accent' : 'border-ter'
            }`} />
            <div>
              <div className={`text-xs font-semibold ${triggerType === 'inactive' ? 'text-accent' : 'text-pri'}`}>
                I stop looking at it
              </div>
              <div className="text-[10px] text-ter mt-0.5">Counts from when you switch away</div>
            </div>
          </button>
          <button
            onClick={() => setTriggerType('openDuration')}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
              triggerType === 'openDuration'
                ? 'border-accent/30 bg-accent/5'
                : 'border-white/[0.06] bg-bg3 hover:border-white/[0.12]'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
              triggerType === 'openDuration' ? 'border-accent bg-accent' : 'border-ter'
            }`} />
            <div>
              <div className={`text-xs font-semibold ${triggerType === 'openDuration' ? 'text-accent' : 'text-pri'}`}>
                It's been open (total)
              </div>
              <div className="text-[10px] text-ter mt-0.5">Counts from when the tab was opened</div>
            </div>
          </button>
        </div>
        <div className="text-[10px] text-ter mt-2">Most people pick the first option</div>
      </div>

      {/* Preview */}
      {domains.length > 0 && (
        <div className="bg-bg3 rounded-lg px-3 py-2 border border-white/[0.06]">
          <div className="text-[10px] text-ter mb-0.5">Rule name (auto-generated)</div>
          <div className="text-xs font-mono text-sec">{generateRuleName(domains, minutes)}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-ter border border-white/[0.06] hover:border-white/[0.12] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={domains.length === 0}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-accent text-bg1 hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
}
