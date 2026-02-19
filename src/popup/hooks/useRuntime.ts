import { useState, useEffect } from 'react';
import type { RuntimeState } from '../../shared/types';

const DEFAULT_RUNTIME: RuntimeState = {
  managedTabs: {},
  lastUserInteractionAt: 0,
  pendingUndoGroup: null,
};

export function useRuntime() {
  const [runtime, setRuntime] = useState<RuntimeState>(DEFAULT_RUNTIME);

  useEffect(() => {
    chrome.storage.local.get('runtime').then(data => {
      const stored = data.runtime as Partial<RuntimeState> | undefined;
      setRuntime({
        ...DEFAULT_RUNTIME,
        ...stored,
        managedTabs: stored?.managedTabs ?? {},
      });
    });

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.runtime?.newValue) {
        const val = changes.runtime.newValue as Partial<RuntimeState>;
        setRuntime({
          ...DEFAULT_RUNTIME,
          ...val,
          managedTabs: val.managedTabs ?? {},
        });
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  return runtime;
}
