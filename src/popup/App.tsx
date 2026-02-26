import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTabs } from './hooks/useTabs';
import { useRuntime } from './hooks/useRuntime';
import { useRules } from './hooks/useRules';
import { usePast } from './hooks/usePast';
import TopBar from './components/TopBar';
import CurrentTabBar from './components/CurrentTabBar';
import NavBar from './components/NavBar';
import SearchBar from './components/SearchBar';
import TabList from './components/TabList';
import SoonList from './components/SoonList';
import PastList from './components/PastList';
import UndoBanner from './components/UndoBanner';
import TrustBanner from './components/TrustBanner';
import OnboardingBanner from './components/OnboardingBanner';
import IntentCreator from './components/IntentCreator';
import { LangContext } from '../shared/LangContext';
import { createT, resolveLang } from '../shared/lang';
import type { Settings } from '../shared/types';
import { extractRootDomain } from '../shared/utils';

type View = 'now' | 'soon' | 'past';

export default function App() {
  const { tabs, activeTab } = useTabs();
  const runtime = useRuntime();
  const rules = useRules();
  const { stash, restore, restoreAll } = usePast();

  const [view, setView] = useState<View>('now');
  const [search, setSearch] = useState('');
  const [pastSearch, setPastSearch] = useState('');
  const [intentDomain, setIntentDomain] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(true);
  const [trustDismissed, setTrustDismissed] = useState(false);
  const [pendingCleanCount, setPendingCleanCount] = useState(0);
  const [stashExpiryDays, setStashExpiryDays] = useState(7);
  const [language, setLanguage] = useState<Settings['language']>('auto');

  // Load onboarding state and settings
  useEffect(() => {
    chrome.storage.local.get(['onboardingBannerDismissed', 'settings']).then(data => {
      setOnboardingDismissed(!!(data.onboardingBannerDismissed as boolean));
      const settings = data.settings as { pendingCleanCount?: number; stashExpiryDays?: number } | undefined;
      setPendingCleanCount(settings?.pendingCleanCount ?? 0);
      setStashExpiryDays(settings?.stashExpiryDays ?? 7);
      setLanguage((settings?.language ?? 'auto') as Settings['language']);
    });

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.onboardingBannerDismissed !== undefined) {
        setOnboardingDismissed(!!(changes.onboardingBannerDismissed.newValue as boolean));
      }
      if (changes.settings?.newValue) {
        const s = changes.settings.newValue as { pendingCleanCount?: number; stashExpiryDays?: number; language?: Settings['language'] };
        setPendingCleanCount(s.pendingCleanCount ?? 0);
        setStashExpiryDays(s.stashExpiryDays ?? 7);
        setLanguage(s.language ?? 'auto');
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Check undo window
  const hasActiveUndo = !!runtime.pendingUndoGroup &&
    Date.now() - runtime.pendingUndoGroup.closedAt < 5000;

  // Compute counts — filter soonEntries to only tabs actually open
  const openTabIds = new Set(tabs.map(t => t.id).filter(Boolean));
  const managedTabIds = new Set(
    Object.values(runtime.managedTabs).map(e => e.tabId)
  );
  // Domains covered by at least one enabled rule
  const ruledDomains = new Set(
    rules.filter(r => r.enabled).flatMap(r => r.domains)
  );
  // Now: tabs not in managed (active countdown) AND whose domain has no rule
  const nowTabs = tabs.filter(t => {
    if (managedTabIds.has(t.id!)) return false;
    try {
      const hostname = new URL(t.url ?? '').hostname;
      const rootDomain = extractRootDomain(hostname);
      return !ruledDomains.has(rootDomain);
    } catch {
      return true;
    }
  });
  const soonEntries = Object.values(runtime.managedTabs).filter(e => openTabIds.has(e.tabId));
  const activeRuleCount = rules.filter(r => r.enabled).length;

  const handleManage = useCallback((domain: string) => {
    setIntentDomain(domain);
  }, []);

  const handleIntentClose = useCallback(() => {
    setIntentDomain(null);
  }, []);

  const handleUndo = useCallback(async () => {
    await chrome.runtime.sendMessage({ type: 'UNDO_CLOSE' });
  }, []);

  const handleDismissTrust = useCallback(async () => {
    setTrustDismissed(true);
    const data = await chrome.storage.local.get('settings');
    const settings = { ...(data.settings ?? {}), pendingCleanCount: 0 };
    await chrome.storage.local.set({ settings });
    setPendingCleanCount(0);
  }, []);

  // Auto-dismiss TrustBanner after 5s
  useEffect(() => {
    if (pendingCleanCount > 0 && !trustDismissed) {
      const timer = setTimeout(() => {
        handleDismissTrust();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pendingCleanCount, trustDismissed, handleDismissTrust]);

  const handleDismissOnboarding = useCallback(async () => {
    setOnboardingDismissed(true);
    await chrome.storage.local.set({ onboardingBannerDismissed: true });
  }, []);

  // Auto-dismiss OnboardingBanner after 5s
  useEffect(() => {
    if (!onboardingDismissed && activeRuleCount > 0) {
      const timer = setTimeout(() => {
        handleDismissOnboarding();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onboardingDismissed, activeRuleCount, handleDismissOnboarding]);

  // Filter function
  const filterBySearch = <T extends { title?: string; url?: string }>(
    items: T[],
    q: string
  ): T[] => {
    if (!q) return items;
    const lower = q.toLowerCase();
    return items.filter(
      item =>
        item.title?.toLowerCase().includes(lower) ||
        item.url?.toLowerCase().includes(lower)
    );
  };

  const t = useMemo(() => createT(resolveLang(language)), [language]);

  return (
    <LangContext.Provider value={t}>
    <div className="bg-bg2 flex flex-col" style={{ width: 380, height: 580, overflow: 'hidden' }}>
      {intentDomain && (
        <IntentCreator
          domain={intentDomain}
          rules={rules}
          onClose={handleIntentClose}
          onSuccess={handleIntentClose}
        />
      )}

      <TopBar
        tabCount={tabs.length}
        ruleCount={activeRuleCount}
      />

      <CurrentTabBar
        activeTab={activeTab}
        runtime={runtime}
        rules={rules}
        onManage={handleManage}
      />

      <NavBar
        view={view}
        setView={setView}
        nowCount={nowTabs.length}
        soonCount={soonEntries.length}
        pastCount={stash.length}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Banners */}
        {hasActiveUndo && (
          <UndoBanner
            count={runtime.pendingUndoGroup!.stashIds.length}
            onUndo={handleUndo}
          />
        )}
        {pendingCleanCount > 0 && !trustDismissed && !hasActiveUndo && (
          <TrustBanner
            count={pendingCleanCount}
            onDismiss={handleDismissTrust}
            onShowPast={() => setView('past')}
          />
        )}
        {!onboardingDismissed && activeRuleCount > 0 && view === 'now' && (
          <OnboardingBanner
            ruleCount={activeRuleCount}
            onDismiss={handleDismissOnboarding}
          />
        )}

        <SearchBar
          value={view === 'past' ? pastSearch : search}
          onChange={view === 'past' ? setPastSearch : setSearch}
          placeholder={view === 'past' ? t('search_placeholder_past') : t('search_placeholder_now')}
        />

        {view === 'now' && (
          <>
            <TabList
              tabs={filterBySearch(nowTabs, search)}
              runtime={runtime}
              onManage={handleManage}
            />
          </>
        )}

        {view === 'soon' && (
          <SoonList
            entries={soonEntries}
            tabs={tabs}
            search={search}
            rules={rules}
          />
        )}

        {view === 'past' && (
          <PastList
            stash={filterBySearch(stash, pastSearch)}
            onRestore={restore}
            onRestoreAll={restoreAll}
            stashExpiryDays={stashExpiryDays}
          />
        )}
      </div>
    </div>
    </LangContext.Provider>
  );
}
