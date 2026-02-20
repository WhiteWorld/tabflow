// Known 2-part TLDs (e.g. co.uk, com.au) — root domain needs 3 parts
const MULTI_PART_TLDS = new Set([
  'co.uk', 'co.jp', 'co.nz', 'co.za', 'co.kr', 'co.in', 'co.id', 'co.il', 'co.th',
  'com.au', 'com.br', 'com.cn', 'com.tw', 'com.hk', 'com.sg', 'com.mx', 'com.ar',
  'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
]);

/**
 * Extract eTLD+1 root domain from a hostname.
 * e.g. gist.github.com → github.com, mail.google.co.uk → google.co.uk
 */
export function extractRootDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_PART_TLDS.has(lastTwo) ? parts.slice(-3).join('.') : parts.slice(-2).join('.');
}

/**
 * Normalize a domain input to its root domain.
 * Accepts full URLs (pasted) or bare domain/hostname strings.
 */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s) return s;

  // Handle pasted full URLs
  if (s.includes('://')) {
    try {
      s = new URL(s).hostname;
    } catch {
      // fall through
    }
  }

  // Strip port
  s = s.split(':')[0];

  return extractRootDomain(s);
}
