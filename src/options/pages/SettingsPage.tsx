import { useState } from 'react';
import type { Settings, Rule } from '../../shared/types';
import { useT } from '../../shared/LangContext';

interface SettingsPageProps {
  settings: Settings | null;
  rules: Rule[];
  onNavigate: (page: 'rules' | 'settings') => void;
}

export default function SettingsPage({ settings, rules, onNavigate }: SettingsPageProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const t = useT();

  const updateSettings = async (patch: Partial<Settings>) => {
    const data = await chrome.storage.local.get('settings');
    const current = (data.settings as Settings) ?? {};
    await chrome.storage.local.set({ settings: { ...current, ...patch } });
  };

  const handleExport = async () => {
    const data = await chrome.storage.local.get(['rules', 'settings', 'stash']);
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      rules: data.rules ?? [],
      settings: data.settings ?? {},
      stash: data.stash ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);

        const mergeRules = (existing: Rule[], imported: Rule[]): Rule[] => {
          // Existing domains take priority — skip imported rules whose domain already exists
          const existingDomains = new Set(existing.flatMap(r => r.domains));
          const newRules = imported
            .filter(r => r.domains.every(d => !existingDomains.has(d)))
            .map(r => ({ ...r, id: crypto.randomUUID() }));
          return [...existing, ...newRules];
        };

        if (Array.isArray(parsed)) {
          // Legacy: array of rules
          const data = await chrome.storage.local.get('rules');
          const existing = (data.rules as Rule[]) ?? [];
          await chrome.storage.local.set({ rules: mergeRules(existing, parsed) });
        } else if (parsed.version === 1) {
          // Full backup
          const data = await chrome.storage.local.get(['rules', 'stash', 'settings']);
          const existingRules = (data.rules as Rule[]) ?? [];
          const existingStash = (data.stash as object[]) ?? [];
          // Stash: dedupe by url+closedAt to avoid duplicates
          const stashKeys = new Set(existingStash.map((s: object) => {
            const t = s as { url: string; closedAt: number };
            return `${t.url}|${t.closedAt}`;
          }));
          const newStash = (parsed.stash ?? []).filter((s: { url: string; closedAt: number }) =>
            !stashKeys.has(`${s.url}|${s.closedAt}`)
          );
          await chrome.storage.local.set({
            rules: mergeRules(existingRules, parsed.rules ?? []),
            stash: [...existingStash, ...newStash],
            // Settings: only fill in keys not already set
            ...(parsed.settings ? {
              settings: { ...parsed.settings, ...((data as { settings?: object }).settings ?? {}) }
            } : {}),
          });
        } else {
          throw new Error('Unknown format');
        }
        window.location.reload();
      } catch {
        alert(t('settings_import_error'));
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    await chrome.storage.local.clear();
    setConfirmClear(false);
    window.location.reload();
  };

  const handleRemoveProtected = async (domain: string) => {
    if (!settings) return;
    await updateSettings({
      protectedDomains: settings.protectedDomains.filter(d => d !== domain),
    });
  };

  return (
    <div className="max-w-[600px]">

      {/* ── Sites ── */}
      <section className="mb-7">
        <div
          className="flex items-center gap-1.5 text-[14px] font-bold text-pri pb-3.5 mb-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {t('settings_section_sites')}
        </div>

        <div
          className="flex items-center justify-between py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="text-[12.5px] font-medium text-pri">{t('settings_active_sites')}</div>
            <div className="text-[10px] text-faint mt-0.5">
              {t('settings_active_sites_count', { enabled: rules.filter(r => r.enabled).length, total: rules.length })}
            </div>
          </div>
          <button
            onClick={() => onNavigate('rules')}
            className="text-[12px] font-semibold text-accent"
          >
            {t('settings_manage')}
          </button>
        </div>

        <div className="py-2.5">
          <div className="text-[12.5px] font-medium text-pri mb-1.5">{t('settings_protected_domains')}</div>
          <div className="flex flex-wrap gap-1.5">
            {(settings?.protectedDomains ?? []).map(d => (
              <span
                key={d}
                className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-[5px]"
                style={{ background: 'rgba(80,144,240,0.12)', color: '#5090F0' }}
              >
                📌 {d}
                <button
                  onClick={() => handleRemoveProtected(d)}
                  className="opacity-60 hover:opacity-100 ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="text-[9.5px] text-ter mt-1.5">{t('settings_protected_hint')}</div>
        </div>
      </section>

      {/* ── General ── */}
      <section className="mb-7">
        <div
          className="flex items-center gap-1.5 text-[14px] font-bold text-pri pb-3.5 mb-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {t('settings_section_general')}
        </div>

        {[
          {
            labelKey: 'settings_language' as const,
            subKey: 'settings_language_sub' as const,
            value: settings?.language ?? 'auto',
            onChange: (v: string) => updateSettings({ language: v as Settings['language'] }),
            options: [
              ['auto', t('settings_language_auto')],
              ['en', t('settings_language_en')],
              ['zh_CN', t('settings_language_zh_cn')],
            ] as [string, string][],
          },
          {
            labelKey: 'settings_expiry' as const,
            subKey: 'settings_expiry_sub' as const,
            value: String(settings?.stashExpiryDays ?? 7),
            onChange: (v: string) => updateSettings({ stashExpiryDays: Number(v) }),
            options: [
              ['7', t('settings_expiry_7')],
              ['14', t('settings_expiry_14')],
              ['30', t('settings_expiry_30')],
            ] as [string, string][],
          },
        ].map((row, i, arr) => (
          <div
            key={row.labelKey}
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          >
            <div>
              <div className="text-[12.5px] font-medium text-pri">{t(row.labelKey)}</div>
              {row.subKey && <div className="text-[10px] text-faint mt-0.5">{t(row.subKey)}</div>}
            </div>
            <select
              value={row.value}
              onChange={e => row.onChange(e.target.value)}
              className="font-sans text-[11.5px] text-sec outline-none px-2.5 py-1.5 rounded-[6px]"
              style={{
                width: 170,
                background: '#1C2230',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#EAF0FA',
                appearance: 'none',
              }}
            >
              {row.options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
        ))}
      </section>

      {/* ── Data ── */}
      <section>
        <div
          className="flex items-center gap-1.5 text-[14px] font-bold text-pri pb-3.5 mb-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {t('settings_section_data')}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="text-[12px] font-medium text-sec px-4 py-2 rounded-[7px] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
          >
            {t('settings_export')}
          </button>
          <button
            onClick={handleImport}
            className="text-[12px] font-medium text-sec px-4 py-2 rounded-[7px] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
          >
            {t('settings_import')}
          </button>
          {confirmClear ? (
            <div className="flex gap-2 items-center ml-2">
              <button onClick={() => setConfirmClear(false)} className="text-xs text-ter">{t('settings_clear_cancel')}</button>
              <button onClick={handleClearAll} className="text-xs text-danger font-semibold">{t('settings_clear_confirm')}</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-[12px] font-medium text-danger px-4 py-2 rounded-[7px] transition-colors"
              style={{ background: 'rgba(232,69,90,0.12)', border: 'none' }}
            >
              {t('settings_clear_all')}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
