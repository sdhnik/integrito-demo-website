/** Lightweight concept selector for design experiments (query-based). */

export type AppConcept = 'original' | 'classic';

/**
 * Strip unsupported `concept` values (studio / signal / unknown) from the URL
 * while preserving unrelated query params (`demo`, `nav`, …).
 */
export function normalizeObsoleteConceptParam(): void {
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get('concept');
    if (value == null || value === 'classic') return;
    url.searchParams.delete('concept');
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', next);
  } catch {
    /* ignore */
  }
}

/**
 * Read `?concept=` from the URL.
 * Missing / unknown / obsolete → Integrito Original.
 * Preserves other params (`demo`, `nav`, …).
 */
export function readConcept(): AppConcept {
  try {
    const value = new URLSearchParams(window.location.search).get('concept');
    if (value === 'classic') return 'classic';
  } catch {
    /* ignore */
  }
  return 'original';
}

export function readDemoMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  } catch {
    return false;
  }
}
