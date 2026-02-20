import { useState, useEffect, useRef } from 'react';
import type { Rule } from '../../shared/types';
import { generateRuleName } from '../../shared/constants';
import { normalizeDomain, extractRootDomain } from '../../shared/utils';

interface RuleEditorProps {
  rule: Rule | null;
  existingRules?: Rule[];
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

const TIME_PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hour${h > 1 ? 's' : ''} ${m} min` : `${h} hour${h > 1 ? 's' : ''}`;
}

function describeTrigger(
  type: 'inactive' | 'openDuration',
  minutes: number,
  domains: string[]
): string {
  const site =
    domains.length > 0
      ? `${domains[0]}${domains.length > 1 ? ` +${domains.length - 1}` : ''} tabs`
      : 'These tabs';
  const time = formatMinutes(minutes);
  return type === 'inactive'
    ? `${site} will close ${time} after you switch away.`
    : `${site} will close ${time} after they were opened.`;
}

function tabMatchesDomains(tab: chrome.tabs.Tab, domains: string[]): boolean {
  if (!tab.url) return false;
  try {
    const hostname = extractRootDomain(new URL(tab.url).hostname);
    return domains.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

export default function RuleEditor({ rule, existingRules = [], onSave, onCancel }: RuleEditorProps) {
  const [domainsInput, setDomainsInput] = useState(rule?.domains.join(', ') ?? '');
  const [minutes, setMinutes] = useState(rule?.trigger.minutes ?? 30);
  const [triggerType, setTriggerType] = useState<'inactive' | 'openDuration'>(
    rule?.trigger.type ?? 'inactive'
  );
  const [customMinutes, setCustomMinutes] = useState('');
  const [matchingTabs, setMatchingTabs] = useState<chrome.tabs.Tab[]>([]);
  const [showMatchingTitles, setShowMatchingTitles] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const domains = domainsInput
    .split(',')
    .map(d => normalizeDomain(d))
    .filter(Boolean);

  // Find conflicts: domains already covered by other rules (excluding the rule being edited)
  const conflicts = domains.flatMap(d =>
    existingRules
      .filter(r => r.id !== rule?.id && r.enabled && r.domains.some(rd => rd === d || d.endsWith('.' + rd) || rd.endsWith('.' + d)))
      .map(r => ({ domain: d, ruleName: r.name, ruleId: r.id }))
  );

  // Debounced matching tabs query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (domains.length === 0) {
      setMatchingTabs([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const tabs = await chrome.tabs.query({});
      setMatchingTabs(tabs.filter(t => tabMatchesDomains(t, domains)));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainsInput]);

  const handleSave = async () => {
    if (domains.length === 0) return;

    // Remove conflicting rules from storage before saving
    if (conflicts.length > 0) {
      const conflictIds = [...new Set(conflicts.map(c => c.ruleId))];
      const data = await chrome.storage.local.get('rules');
      const allRules = (data.rules as Rule[]) ?? [];
      await chrome.storage.local.set({
        rules: allRules.filter(r => !conflictIds.includes(r.id)),
      });
      // Notify background SW to cancel alarms for removed rules
      await Promise.all(
        conflictIds.map(id => chrome.runtime.sendMessage({ type: 'RULE_DELETED', ruleId: id }))
      );
    }

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

  const hasConflicts = conflicts.length > 0;
  const conflictRuleNames = [
    ...new Map(conflicts.map(c => [c.ruleId, c.ruleName])).values(),
  ];

  return (
    <div className="flex flex-col gap-4.5">

      {/* Step 1: Domain */}
      <div>
        <div className="text-[11px] font-semibold text-ter uppercase tracking-wide mb-1.5">Site</div>
        <input
          type="text"
          value={domainsInput}
          onChange={e => setDomainsInput(e.target.value)}
          placeholder="youtube.com, bilibili.com"
          className="w-full font-mono text-[12.5px] text-pri outline-none px-3 py-2.5 rounded-[7px]"
          style={{
            background: '#1C2230',
            border: `1px solid ${hasConflicts ? 'rgba(240,160,48,0.4)' : 'rgba(255,255,255,0.06)'}`,
            color: '#EAF0FA',
          }}
        />
        <div className="text-[9.5px] text-ter mt-1">Separate with commas. Subdomains auto-matched.</div>

        {/* Matching tabs count */}
        {domains.length > 0 && (
          <div className="mt-1">
            {matchingTabs.length > 0 ? (
              <button
                onClick={() => setShowMatchingTitles(v => !v)}
                className="text-[9.5px] font-medium text-accent hover:opacity-80 transition-opacity text-left"
              >
                Matches {matchingTabs.length} open tab{matchingTabs.length !== 1 ? 's' : ''} ▾
              </button>
            ) : (
              <span className="text-[9.5px] text-ter">No open tabs match</span>
            )}
            {showMatchingTitles && matchingTabs.length > 0 && (
              <div
                className="mt-1 px-2 py-1.5 rounded-[6px] flex flex-col gap-0.5"
                style={{ background: 'rgba(62,232,137,0.06)', border: '1px solid rgba(62,232,137,0.12)' }}
              >
                {matchingTabs.slice(0, 8).map(t => (
                  <div key={t.id} className="text-[9.5px] text-sec truncate">{t.title || t.url}</div>
                ))}
                {matchingTabs.length > 8 && (
                  <div className="text-[9.5px] text-ter">+{matchingTabs.length - 8} more</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conflict warning */}
        {hasConflicts && (
          <div
            className="mt-2 px-3 py-2 rounded-[7px] text-[11px] text-warn"
            style={{ background: 'rgba(240,160,48,0.10)', border: '1px solid rgba(240,160,48,0.2)' }}
          >
            {[...new Map(conflicts.map(c => [c.domain, c])).values()].map(c => (
              <div key={c.domain}>
                <b className="font-mono">{c.domain}</b> already covered by <b>{c.ruleName}</b>
              </div>
            ))}
            <div className="mt-1 text-[9.5px] text-warn/70">
              Will remove: {conflictRuleNames.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Time */}
      <div>
        <div className="text-[11px] font-semibold text-ter uppercase tracking-wide mb-1.5">Close after</div>
        <div className="flex gap-1.5">
          {TIME_PRESETS.map(preset => {
            const isSelected = minutes === preset.minutes && !customMinutes;
            return (
              <button
                key={preset.minutes}
                onClick={() => { setMinutes(preset.minutes); setCustomMinutes(''); }}
                className="flex-1 py-2.5 text-center text-[12px] font-semibold rounded-[7px] transition-colors"
                style={{
                  border: `1px solid ${isSelected ? '#3CE882' : 'rgba(255,255,255,0.06)'}`,
                  background: isSelected ? 'rgba(60,232,130,0.12)' : '#1C2230',
                  color: isSelected ? '#3CE882' : '#9AA4BD',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        {/* Custom time input */}
        <div className="flex items-center gap-2 mt-2">
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
            className="font-mono text-[12px] text-pri outline-none px-2.5 py-1.5 rounded-[7px] w-24"
            style={{
              background: '#1C2230',
              border: `1px solid ${customMinutes ? '#3CE882' : 'rgba(255,255,255,0.06)'}`,
              color: '#EAF0FA',
            }}
          />
          <span className="text-[11px] text-ter">min</span>
          {customMinutes && (
            <span className="text-[11px] font-semibold text-accent">= {Number(customMinutes) >= 60 ? `${Math.floor(Number(customMinutes) / 60)}h${Number(customMinutes) % 60 ? ` ${Number(customMinutes) % 60}m` : ''}` : `${customMinutes}min`}</span>
          )}
        </div>
      </div>

      {/* Step 3: Trigger type */}
      <div>
        <div className="text-[11px] font-semibold text-ter uppercase tracking-wide mb-1.5">Start timer when</div>
        <div className="flex gap-1.5">
          {[
            {
              type: 'inactive' as const,
              label: 'Tab not viewed',
              sub: 'Timer starts when you switch away',
            },
            {
              type: 'openDuration' as const,
              label: 'Tab open time',
              sub: 'Timer starts when the tab opens',
            },
          ].map(opt => {
            const isSelected = triggerType === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => setTriggerType(opt.type)}
                className="flex-1 py-3 px-2.5 text-center rounded-[7px] transition-colors leading-snug flex flex-col items-center gap-0.5"
                style={{
                  border: `1px solid ${isSelected ? '#3CE882' : 'rgba(255,255,255,0.06)'}`,
                  background: isSelected ? 'rgba(60,232,130,0.12)' : '#1C2230',
                }}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isSelected ? '#3CE882' : '#9AA4BD' }}
                >
                  {isSelected ? '✓ ' : ''}{opt.label}
                </span>
                <span
                  className="text-[9.5px]"
                  style={{ color: isSelected ? 'rgba(62,232,137,0.7)' : '#5A6478' }}
                >
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live trigger description */}
        <div className="text-[10px] text-accent/80 mt-2 italic">
          {describeTrigger(triggerType, minutes, domains)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="text-[12px] font-semibold text-sec px-4 py-2 rounded-[7px]"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={domains.length === 0}
          className="text-[12px] font-semibold px-4 py-2 rounded-[7px] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#3CE882', color: '#080A0F', border: 'none' }}
        >
          {hasConflicts ? 'Replace & Save' : 'Save Rule'}
        </button>
      </div>
    </div>
  );
}
