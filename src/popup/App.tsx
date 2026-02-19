import { useState, useEffect, useCallback } from 'react';
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

type View = 'now' | 'soon' | 'past';

export default function App() {
  const { tabs, activeTab } = useTabs();
  const runtime = useRuntime();
  const rules = useRules();
  const { stash, restore } = usePast();

  const [view, setView] = useState<View>('now');
  const [search, setSearch] = useState('');
  const [intentDomain, setIntentDomain] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(true);
  const [trustDismissed, setTrustDismissed] = useState(false);
  const [pendingCleanCount, setPendingCleanCount] = useState(0);

  // Load onboarding state and settings
  useEffect(() => {
    chrome.storage.local.get(['onboardingBannerDismissed', 'settings']).then(data => {
      setOnboardingDismissed(!!(data.onboardingBannerDismissed as boolean));
      const settings = data.settings as { pendingCleanCount?: number } | undefined;
      setPendingCleanCount(settings?.pendingCleanCount ?? 0);
    });

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.onboardingBannerDismissed !== undefined) {
        setOnboardingDismissed(!!(changes.onboardingBannerDismissed.newValue as boolean));
      }
      if (changes.settings?.newValue) {
        const s = changes.settings.newValue as { pendingCleanCount?: number };
        setPendingCleanCount(s.pendingCleanCount ?? 0);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Check undo window
  const hasActiveUndo = !!runtime.pendingUndoGroup &&
    Date.now() - runtime.pendingUndoGroup.closedAt < 5000;

  // Compute counts — all managed tabs (pending or counting) go to Soon
  const managedTabIds = new Set(
    Object.values(runtime.managedTabs).map(e => e.tabId)
  );
  const nowTabs = tabs.filter(t => !managedTabIds.has(t.id!));
  const soonEntries = Object.values(runtime.managedTabs);
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

  const handleDismissOnboarding = useCallback(async () => {
    setOnboardingDismissed(true);
    await chrome.storage.local.set({ onboardingBannerDismissed: true });
  }, []);

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

  return (
    <div className="bg-bg2 flex flex-col" style={{ width: 380, maxHeight: 580, overflow: 'hidden' }}>
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
        onManage={handleManage}
      />

      <NavBar
        view={view}
        setView={setView}
        nowCount={nowTabs.length}
        soonCount={soonEntries.length}
        pastCount={stash.length}
      />

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: 400 }}
      >
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
          value={search}
          onChange={setSearch}
          placeholder={view === 'past' ? 'Search past tabs...' : 'Search tabs...'}
        />

        {view === 'now' && (
          <TabList
            tabs={filterBySearch(nowTabs, search)}
            runtime={runtime}
            onManage={handleManage}
          />
        )}

        {view === 'soon' && (
          <SoonList
            entries={soonEntries}
            tabs={tabs}
            search={search}
          />
        )}

        {view === 'past' && (
          <PastList
            stash={filterBySearch(stash, search)}
            onRestore={restore}
          />
        )}
      </div>

      {/* AI Analyze button */}
      <div className="border-t border-white/[0.06] px-3 py-2 bg-bg1">
        <button className="w-full py-2 text-xs font-semibold text-ter hover:text-sec transition-colors">
          ✨ AI Analyze All {tabs.length > 0 ? `${tabs.length} ` : ''}Tabs
        </button>
      </div>
    </div>
  );
}
