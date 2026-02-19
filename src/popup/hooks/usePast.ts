import { useState, useEffect, useCallback } from 'react';
import type { StashedTab } from '../../shared/types';

export function usePast() {
  const [stash, setStash] = useState<StashedTab[]>([]);

  const reload = useCallback(() => {
    chrome.storage.local.get('stash').then(data => {
      setStash((data.stash as StashedTab[]) ?? []);
    });
  }, []);

  useEffect(() => {
    reload();

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.stash?.newValue !== undefined) {
        setStash((changes.stash.newValue as StashedTab[]) ?? []);
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [reload]);

  const restore = useCallback(async (stashId: string) => {
    await chrome.runtime.sendMessage({ type: 'RESTORE_FROM_STASH', stashId });
  }, []);

  return { stash, restore, reload };
}
