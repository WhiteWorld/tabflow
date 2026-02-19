import { useState, useEffect } from 'react';
import type { Rule } from '../../shared/types';

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    chrome.storage.local.get('rules').then(data => {
      setRules((data.rules as Rule[]) ?? []);
    });

    const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.rules?.newValue !== undefined) {
        setRules((changes.rules.newValue as Rule[]) ?? []);
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  return rules;
}
