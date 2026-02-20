/**
 * Normalize a domain input: strips protocol/path/port/www prefix.
 * Accepts full URLs (pasted) or bare domain strings.
 */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s) return s;

  // Handle pasted full URLs
  if (s.includes('://')) {
    try {
      s = new URL(s).hostname;
    } catch {
      // fall through with original string
    }
  }

  // Strip port
  s = s.split(':')[0];

  // Strip www. prefix
  if (s.startsWith('www.')) s = s.slice(4);

  return s;
}
