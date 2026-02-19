import { useState, useEffect, useCallback } from 'react';

export function useTabs() {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);

  const loadTabs = useCallback(async () => {
    const allTabs = await chrome.tabs.query({});
    setTabs(allTabs);
    const [current] = await chrome.tabs.query({ active: true, currentWindow: true });
    setActiveTab(current ?? null);
  }, []);

  useEffect(() => {
    loadTabs();

    const onUpdated = () => void loadTabs();
    const onActivated = () => void loadTabs();
    const onRemoved = () => void loadTabs();
    const onCreated = () => void loadTabs();

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs.onCreated.addListener(onCreated);

    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      chrome.tabs.onCreated.removeListener(onCreated);
    };
  }, [loadTabs]);

  return { tabs, activeTab, reload: loadTabs };
}
