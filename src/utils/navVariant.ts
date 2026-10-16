/** Landing product-nav presentation variants (management design exploration). */
export type NavVariant = 'top' | 'editorial' | 'surface' | 'surface-minimal';

export type SidebarNavVariant = Extract<
  NavVariant,
  'editorial' | 'surface' | 'surface-minimal'
>;

/**
 * Read `?nav=` from the URL. Unknown / missing → approved horizontal baseline.
 * Preserves other params (`demo`, `headerPreview`, …).
 */
export function readNavVariant(): NavVariant {
  try {
    const value = new URLSearchParams(window.location.search).get('nav');
    if (
      value === 'editorial' ||
      value === 'surface' ||
      value === 'surface-minimal' ||
      value === 'top'
    ) {
      return value;
    }
  } catch {
    /* ignore */
  }
  return 'top';
}

export function isSidebarNav(variant: NavVariant): variant is SidebarNavVariant {
  return variant === 'editorial' || variant === 'surface' || variant === 'surface-minimal';
}

/**
 * Stage-persistent product nav (survives Landing ↔ Workspace Crossfade).
 * Editorial, Surface, and Surface Minimal share this mounting lifecycle.
 * Visual styling remains variant-specific.
 */
export function isStagePersistentNav(variant: NavVariant): variant is SidebarNavVariant {
  return isSidebarNav(variant);
}
