import { useState, useEffect, useMemo } from 'react';
import type { Rule, Settings } from '../shared/types';
import WelcomePage from './pages/WelcomePage';
import QuickSetupPage from './pages/QuickSetupPage';
import RulesPage from './pages/RulesPage';
import SettingsPage from './pages/SettingsPage';
import { LangContext } from '../shared/LangContext';
import { createT, resolveLang } from '../shared/lang';

type Page = 'welcome' | 'quickSetup' | 'rules' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('settings');
  const [rules, setRules] = useState<Rule[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['rules', 'settings']).then(data => {
      const s = data.settings as Settings | undefined;
      setRules((data.rules as Rule[]) ?? []);
      setSettings(s ?? null);

      // Check for pending intent from context menu
      chrome.storage.local.get('pendingIntent').then(d => {
        if (d.pendingIntent) {
          chrome.storage.local.remove('pendingIntent');
          const target = d.pendingIntent as string;
          if (target === 'settings') setPage('settings');
          else setPage('rules');
        } else if (s?.isFirstInstall && !s?.onboardingComplete) {
          setPage('welcome');
        }
      });
    });

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.rules?.newValue !== undefined) {
        setRules((changes.rules.newValue as Rule[]) ?? []);
      }
      if (changes.settings?.newValue) {
        setSettings(changes.settings.newValue as Settings);
      }
      if (changes.pendingIntent?.newValue) {
        const target = changes.pendingIntent.newValue as string;
        chrome.storage.local.remove('pendingIntent');
        if (target === 'settings') setPage('settings');
        else if (target === 'rules') setPage('rules');
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const t = useMemo(() => createT(resolveLang(settings?.language ?? 'auto')), [settings?.language]);

  const handleWelcomeContinue = () => setPage('quickSetup');
  const handleWelcomeSkip = async () => {
    if (settings) {
      const updated = { ...settings, isFirstInstall: false, onboardingComplete: true };
      await chrome.storage.local.set({ settings: updated });
    }
    setPage('settings');
  };

  const handleQuickSetupDone = async () => {
    if (settings) {
      const updated = { ...settings, isFirstInstall: false, onboardingComplete: true };
      await chrome.storage.local.set({ settings: updated });
    }
    setPage('rules');
  };

  return (
    <LangContext.Provider value={t}>
    <div className="min-h-screen bg-bg1 text-pri">
      {/* Nav header (not shown on welcome/quickSetup) */}
      {page !== 'welcome' && page !== 'quickSetup' && (
        <header className="border-b border-white/[0.06] bg-bg2">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-bg1 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #3EE889, #28B860)' }}
              >
                ⚡
              </div>
              <span className="font-bold text-base text-pri">TabFlow</span>
            </div>
            <nav className="flex items-center gap-1">
              {[
                { id: 'settings' as const, label: t('options_settings') },
                { id: 'rules' as const, label: t('options_sites') },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    page === item.id
                      ? 'text-accent bg-accent/10'
                      : 'text-ter hover:text-sec'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8">
        {page === 'welcome' && (
          <WelcomePage onContinue={handleWelcomeContinue} onSkip={handleWelcomeSkip} />
        )}
        {page === 'quickSetup' && (
          <QuickSetupPage rules={rules} onDone={handleQuickSetupDone} />
        )}
        {page === 'rules' && (
          <RulesPage rules={rules} settings={settings} onNavigate={setPage} />
        )}
        {page === 'settings' && (
          <SettingsPage settings={settings} rules={rules} onNavigate={setPage} />
        )}
      </main>
    </div>
    </LangContext.Provider>
  );
}
