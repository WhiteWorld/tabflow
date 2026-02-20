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

  const restoreAll = useCallback(async (stashIds: string[]) => {
    // Snapshot ids first, then fire all in parallel before any storage update triggers re-render
    await Promise.all(stashIds.map(id => chrome.runtime.sendMessage({ type: 'RESTORE_FROM_STASH', stashId: id })));
  }, []);

  return { stash, restore, restoreAll, reload };
}
