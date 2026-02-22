import { useState, useEffect, useRef } from 'react';
import type { Rule } from '../../shared/types';
import { generateRuleName } from '../../shared/constants';
import { normalizeDomain, extractRootDomain } from '../../shared/utils';
import { useT } from '../../shared/LangContext';

interface RuleEditorProps {
  rule: Rule | null;
  existingRules?: Rule[];
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

const TIME_PRESETS_META = [
  { labelKey: 'ruleeditor_preset_15' as const, minutes: 15 },
  { labelKey: 'ruleeditor_preset_30' as const, minutes: 30 },
  { labelKey: 'ruleeditor_preset_1h' as const, minutes: 60 },
  { labelKey: 'ruleeditor_preset_2h' as const, minutes: 120 },
];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hour${h > 1 ? 's' : ''} ${m} min` : `${h} hour${h > 1 ? 's' : ''}`;
}

function tabMatchesDomain(tab: chrome.tabs.Tab, domain: string): boolean {
  if (!tab.url || !domain) return false;
  try {
    const hostname = extractRootDomain(new URL(tab.url).hostname);
    return hostname === domain || hostname.endsWith('.' + domain);
  } catch {
    return false;
  }
}

export default function RuleEditor({ rule, existingRules = [], onSave, onCancel }: RuleEditorProps) {
  // Single domain input
  const [domainInput, setDomainInput] = useState(rule?.domains[0] ?? '');
  const [minutes, setMinutes] = useState(rule?.trigger.minutes ?? 30);
  const [triggerType, setTriggerType] = useState<'inactive' | 'openDuration'>(
    rule?.trigger.type ?? 'inactive'
  );
  const [customMinutes, setCustomMinutes] = useState('');
  const [matchingTabs, setMatchingTabs] = useState<chrome.tabs.Tab[]>([]);
  const [showMatchingTitles, setShowMatchingTitles] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useT();

  const domain = normalizeDomain(domainInput);

  // Validation
  const domainError = (() => {
    if (!domainInput.trim()) return null;
    if (domainInput.includes(',')) return t('ruleeditor_domain_error_comma');
    if (domainInput.includes(' ')) return t('ruleeditor_domain_error_spaces');
    if (domain && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain)) {
      return t('ruleeditor_domain_error_invalid');
    }
    return null;
  })();

  // Find conflicts: domain already covered by another rule (excluding the rule being edited)
  const conflicts = domain ? existingRules
    .filter(r => r.id !== rule?.id && r.enabled && r.domains.some(rd => rd === domain || domain.endsWith('.' + rd) || rd.endsWith('.' + domain)))
    .map(r => ({ ruleName: r.name, ruleId: r.id }))
    : [];

  // Debounced matching tabs query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!domain) {
      setMatchingTabs([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const tabs = await chrome.tabs.query({});
      setMatchingTabs(tabs.filter(t => tabMatchesDomain(t, domain)));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainInput]);

  const handleSave = async () => {
    if (!domain) return;

    // Remove conflicting rules from storage before saving
    if (conflicts.length > 0) {
      const conflictIds = conflicts.map(c => c.ruleId);
      const data = await chrome.storage.local.get('rules');
      const allRules = (data.rules as Rule[]) ?? [];
      await chrome.storage.local.set({
        rules: allRules.filter(r => !conflictIds.includes(r.id)),
      });
      await Promise.all(
        conflictIds.map(id => chrome.runtime.sendMessage({ type: 'RULE_DELETED', ruleId: id }))
      );
    }

    const saved: Rule = {
      id: rule?.id ?? crypto.randomUUID(),
      name: generateRuleName(domain, minutes),
      enabled: rule?.enabled ?? true,
      domains: [domain],
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

  return (
    <div className="flex flex-col gap-4.5">

      {/* Domain */}
      <div>
        <div className="text-[11px] font-semibold text-ter uppercase tracking-wide mb-1.5">{t('ruleeditor_domain_label')}</div>
        <input
          type="text"
          value={domainInput}
          onChange={e => setDomainInput(e.target.value)}
          placeholder="youtube.com"
          className="w-full font-mono text-[12.5px] text-pri outline-none px-3 py-2.5 rounded-[7px]"
          style={{
            background: '#1C2230',
            border: `1px solid ${domainError ? 'rgba(244,91,105,0.5)' : hasConflicts ? 'rgba(240,160,48,0.4)' : 'rgba(255,255,255,0.06)'}`,
            color: '#EAF0FA',
          }}
        />
        <div className="text-[9.5px] text-ter mt-1">{t('ruleeditor_domain_hint')}</div>
        {domainError && (
          <div className="text-[9.5px] text-danger mt-1">{domainError}</div>
        )}

        {/* Matching tabs count */}
        {domain && (
          <div className="mt-1">
            {matchingTabs.length > 0 ? (
              <button
                onClick={() => setShowMatchingTitles(v => !v)}
                className="text-[9.5px] font-medium text-accent hover:opacity-80 transition-opacity text-left"
              >
                {matchingTabs.length === 1 ? t('ruleeditor_matching_tab') : t('ruleeditor_matching_tabs', { n: matchingTabs.length })}
              </button>
            ) : (
              <span className="text-[9.5px] text-ter">{t('ruleeditor_no_matching')}</span>
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
                  <div className="text-[9.5px] text-ter">{t('ruleeditor_more', { n: matchingTabs.length - 8 })}</div>
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
            {t('ruleeditor_already_configured', { domain })}
            <div className="mt-1 text-[9.5px] text-warn/70">
              {t('ruleeditor_will_replace', { names: conflicts.map(c => c.ruleName).join(', ') })}
            </div>
          </div>
        )}
      </div>

      {/* Close after */}
      <div>
        <div className="text-[11px] font-semibold text-ter uppercase tracking-wide mb-1.5">{t('ruleeditor_close_after')}</div>
        <div className="flex gap-1.5">
          {TIME_PRESETS_META.map(preset => {
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
                {t(preset.labelKey)}
              </button>
            );
          })}
        </div>
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
            placeholder={t('ruleeditor_custom')}
            className="font-mono text-[12px] text-pri outline-none px-2.5 py-1.5 rounded-[7px] w-24"
            style={{
              background: '#1C2230',
              border: `1px solid ${customMinutes ? '#3CE882' : 'rgba(255,255,255,0.06)'}`,
              color: '#EAF0FA',
            }}
          />
          <span className="text-[11px] text-ter">{t('ruleeditor_min')}</span>
          {customMinutes && (
            <span className="text-[11px] font-semibold text-accent">= {Number(customMinutes) >= 60 ? `${Math.floor(Number(customMinutes) / 60)}h${Number(customMinutes) % 60 ? ` ${Number(customMinutes) % 60}m` : ''}` : `${customMinutes}min`}</span>
          )}
        </div>
      </div>

      {/* Start timer when */}
      <div>
        <div className="text-[11px] font-semibold text-ter uppercase tracking-wide mb-1.5">{t('ruleeditor_start_timer')}</div>
        <div className="flex gap-1.5">
          {[
            {
              type: 'inactive' as const,
              labelKey: 'ruleeditor_trigger_inactive_label' as const,
              subKey: 'ruleeditor_trigger_inactive_sub' as const,
            },
            {
              type: 'openDuration' as const,
              labelKey: 'ruleeditor_trigger_duration_label' as const,
              subKey: 'ruleeditor_trigger_duration_sub' as const,
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
                  {isSelected ? '✓ ' : ''}{t(opt.labelKey)}
                </span>
                <span
                  className="text-[9.5px]"
                  style={{ color: isSelected ? 'rgba(62,232,137,0.7)' : '#5A6478' }}
                >
                  {t(opt.subKey)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live trigger description */}
        <div className="text-[10px] text-accent/80 mt-2 italic">
          {triggerType === 'inactive'
            ? t('ruleeditor_desc_inactive', { site: domain ? `${domain} tabs` : t('ruleeditor_these_tabs'), time: formatMinutes(minutes) })
            : t('ruleeditor_desc_duration', { site: domain ? `${domain} tabs` : t('ruleeditor_these_tabs'), time: formatMinutes(minutes) })
          }
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="text-[12px] font-semibold text-sec px-4 py-2 rounded-[7px]"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
        >
          {t('ruleeditor_cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={!domain || !!domainError}
          className="text-[12px] font-semibold px-4 py-2 rounded-[7px] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#3CE882', color: '#080A0F', border: 'none' }}
        >
          {hasConflicts ? t('ruleeditor_replace_save') : t('ruleeditor_save')}
        </button>
      </div>
    </div>
  );
}
