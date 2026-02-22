import { useState } from 'react';
import type { Settings, Rule } from '../../shared/types';

interface SettingsPageProps {
  settings: Settings | null;
  rules: Rule[];
  onNavigate: (page: 'rules' | 'settings') => void;
}

export default function SettingsPage({ settings, rules, onNavigate }: SettingsPageProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const updateSettings = async (patch: Partial<Settings>) => {
    const data = await chrome.storage.local.get('settings');
    const current = (data.settings as Settings) ?? {};
    await chrome.storage.local.set({ settings: { ...current, ...patch } });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tabflow-rules.json';
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
        const imported = JSON.parse(text) as Rule[];
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        const data = await chrome.storage.local.get('rules');
        const existing = (data.rules as Rule[]) ?? [];
        const merged = [...existing, ...imported.map(r => ({ ...r, id: crypto.randomUUID() }))];
        await chrome.storage.local.set({ rules: merged });
      } catch {
        alert('Invalid rules file');
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

      {/* ── Rules ── */}
      <section className="mb-7">
        <div
          className="flex items-center gap-1.5 text-[14px] font-bold text-pri pb-3.5 mb-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          🌐 Sites
        </div>

        <div
          className="flex items-center justify-between py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="text-[12.5px] font-medium text-pri">Active Sites</div>
            <div className="text-[10px] text-faint mt-0.5">
              {rules.filter(r => r.enabled).length} of {rules.length} sites enabled
            </div>
          </div>
          <button
            onClick={() => onNavigate('rules')}
            className="text-[12px] font-semibold text-accent"
          >
            Manage →
          </button>
        </div>

        <div className="py-2.5">
          <div className="text-[12.5px] font-medium text-pri mb-1.5">Protected Domains</div>
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
          <div className="text-[9.5px] text-ter mt-1.5">These sites will never be auto-closed.</div>
        </div>
      </section>

      {/* ── General ── */}
      <section className="mb-7">
        <div
          className="flex items-center gap-1.5 text-[14px] font-bold text-pri pb-3.5 mb-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          ⚙️ General
        </div>

        {[
          {
            label: 'Language',
            sub: 'Auto-detect from browser',
            value: settings?.language ?? 'auto',
            onChange: (v: string) => updateSettings({ language: v as Settings['language'] }),
            options: [['auto', 'Auto-detect'], ['en', 'English'], ['zh_CN', '简体中文']] as [string, string][],
          },
          {
            label: 'Past Expiry',
            sub: 'How long closed tabs are recoverable',
            value: String(settings?.stashExpiryDays ?? 7),
            onChange: (v: string) => updateSettings({ stashExpiryDays: Number(v) }),
            options: [['7', '7 days'], ['14', '14 days'], ['30', '30 days']] as [string, string][],
          },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          >
            <div>
              <div className="text-[12.5px] font-medium text-pri">{row.label}</div>
              {row.sub && <div className="text-[10px] text-faint mt-0.5">{row.sub}</div>}
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

      {/* ── Data Management ── */}
      <section>
        <div
          className="flex items-center gap-1.5 text-[14px] font-bold text-pri pb-3.5 mb-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          💾 Data Management
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="text-[12px] font-medium text-sec px-4 py-2 rounded-[7px] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
          >
            📤 Export
          </button>
          <button
            onClick={handleImport}
            className="text-[12px] font-medium text-sec px-4 py-2 rounded-[7px] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
          >
            📥 Import
          </button>
          {confirmClear ? (
            <div className="flex gap-2 items-center ml-2">
              <button onClick={() => setConfirmClear(false)} className="text-xs text-ter">Cancel</button>
              <button onClick={handleClearAll} className="text-xs text-danger font-semibold">Confirm Delete</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-[12px] font-medium text-danger px-4 py-2 rounded-[7px] transition-colors"
              style={{ background: 'rgba(232,69,90,0.12)', border: 'none' }}
            >
              🗑 Clear All Data
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
