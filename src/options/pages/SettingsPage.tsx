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
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-pri mb-6">Settings</h2>

      {/* Rules section */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-sec uppercase tracking-wider mb-3">Rules</h3>
        <div className="bg-bg2 rounded-lg border border-white/[0.06] divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-pri">Manage Rules</span>
            <button
              onClick={() => onNavigate('rules')}
              className="text-sm text-accent hover:underline"
            >
              Manage Rules →
            </button>
          </div>
          {settings && settings.protectedDomains.length > 0 && (
            <div className="px-4 py-3">
              <div className="text-xs text-ter mb-2">Protected Domains</div>
              <div className="flex flex-wrap gap-1.5">
                {settings.protectedDomains.map(d => (
                  <span
                    key={d}
                    className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent"
                  >
                    📌 {d}
                    <button
                      onClick={() => handleRemoveProtected(d)}
                      className="text-ter hover:text-danger ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* General */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-sec uppercase tracking-wider mb-3">General</h3>
        <div className="bg-bg2 rounded-lg border border-white/[0.06] divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-pri">Language</span>
            <select
              value={settings?.language ?? 'auto'}
              onChange={e => updateSettings({ language: e.target.value as Settings['language'] })}
              className="bg-bg3 text-sm text-sec border border-white/[0.06] rounded px-2 py-1 outline-none"
            >
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="zh_CN">简体中文</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-pri">Past Expiry</span>
            <select
              value={settings?.stashExpiryDays ?? 7}
              onChange={e => updateSettings({ stashExpiryDays: Number(e.target.value) })}
              className="bg-bg3 text-sm text-sec border border-white/[0.06] rounded px-2 py-1 outline-none"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        </div>
      </section>

      {/* AI Configuration */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-sec uppercase tracking-wider mb-3">AI Configuration</h3>
        <div className="bg-bg2 rounded-lg border border-white/[0.06] divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm text-pri">AI Analysis</div>
              <div className="text-xs text-ter mt-0.5">Analyze tabs with Claude or DeepSeek</div>
            </div>
            <button
              onClick={() => updateSettings({ aiEnabled: !settings?.aiEnabled })}
              className={`w-9 h-5 rounded-full relative transition-colors ${
                settings?.aiEnabled ? 'bg-accent' : 'bg-bg4'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                  settings?.aiEnabled ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          {settings?.aiEnabled && (
            <>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-pri">Provider</span>
                <select
                  value={settings.aiProvider}
                  onChange={e => updateSettings({ aiProvider: e.target.value as Settings['aiProvider'] })}
                  className="bg-bg3 text-sm text-sec border border-white/[0.06] rounded px-2 py-1 outline-none"
                >
                  <option value="claude">Claude Haiku</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>
              <div className="px-4 py-3">
                <div className="text-xs text-ter mb-1.5">API Key</div>
                <input
                  type="password"
                  value={settings.aiApiKey}
                  onChange={e => updateSettings({ aiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-bg3 text-sm text-pri border border-white/[0.06] rounded px-3 py-1.5 outline-none focus:border-white/[0.12]"
                />
                <div className="text-[10px] text-ter mt-1">Stored locally. Never uploaded.</div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Data Management */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-sec uppercase tracking-wider mb-3">Data Management</h3>
        <div className="bg-bg2 rounded-lg border border-white/[0.06] divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-pri">Export Rules</span>
            <button
              onClick={handleExport}
              className="text-sm text-accent hover:underline"
            >
              Download JSON
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-pri">Import Rules</span>
            <button
              onClick={handleImport}
              className="text-sm text-accent hover:underline"
            >
              Upload JSON
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm text-danger">Clear All Data</div>
              <div className="text-xs text-ter mt-0.5">Deletes all rules, stash, and settings</div>
            </div>
            {confirmClear ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-ter hover:text-sec"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-danger font-semibold hover:underline"
                >
                  Confirm Delete
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-sm text-danger hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
