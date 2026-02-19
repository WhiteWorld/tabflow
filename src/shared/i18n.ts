export function getMessage(key: string, substitutions?: string | string[]): string {
  try {
    const msg = chrome.i18n.getMessage(key, substitutions);
    return msg || key;
  } catch {
    return key;
  }
}
