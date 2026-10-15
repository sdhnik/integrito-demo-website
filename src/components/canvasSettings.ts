export type CanvasSettings = {
  accent: 'Monochrome' | 'Integrito Blue';
  speed: 'Slow' | 'Medium' | 'Fast';
  /** Legacy spacing intensity for non-Minimal presets. */
  intensity: 'Low' | 'Medium' | 'High';
  /** GPU ripple amplitude. Does not rebuild typography textures. */
  rippleStrength: 'Very Subtle' | 'Subtle' | 'Medium' | 'Original';
  /** Radial ring density. Rebuilds bake when changed. */
  ringSpacing: 'Default' | 'Spacious' | 'Extra Spacious' | 'Airy' | 'Minimal';
  /** Deterministic whole-phrase omissions. Rebuilds bake when changed. */
  textFragmentation: 'None' | 'Subtle' | 'Open' | 'More Open' | 'Experimental';
  /**
   * Responsive = width breakpoints add outer rings.
   * Fixed = base ring count only (dev comparison).
   */
  ringCountMode: 'Responsive' | 'Fixed';
  /** Deterministic blue word accents on visible phrase words. Rebuilds bake. */
  blueAccent: 'None' | 'Sparse' | 'Balanced' | 'Rich';
};

export const initialSettings: CanvasSettings = {
  accent: 'Integrito Blue',
  speed: 'Slow',
  intensity: 'Medium',
  rippleStrength: 'Very Subtle',
  ringSpacing: 'Minimal',
  textFragmentation: 'More Open',
  ringCountMode: 'Responsive',
  blueAccent: 'Rich',
};

/** Base concentric set — extra rings grow outward from this count. */
export const BASE_RING_COUNT = 10;

/**
 * Viewport-width → total ring count (configurable).
 * Extra rings beyond BASE_RING_COUNT are added outside the base radius.
 */
export const RESPONSIVE_RING_BREAKPOINTS: readonly { maxWidth: number; rings: number }[] = [
  { maxWidth: 1440, rings: 10 },
  { maxWidth: 1680, rings: 11 },
  { maxWidth: 2079, rings: 12 },
  { maxWidth: 2399, rings: 13 },
  { maxWidth: Number.POSITIVE_INFINITY, rings: 14 },
];

/** Resolve total ring count from CSS viewport width. */
export function resolveResponsiveRingCount(viewportWidth: number): number {
  for (const bp of RESPONSIVE_RING_BREAKPOINTS) {
    if (viewportWidth <= bp.maxWidth) return bp.rings;
  }
  return RESPONSIVE_RING_BREAKPOINTS[RESPONSIVE_RING_BREAKPOINTS.length - 1].rings;
}

/**
 * Multiplier on the V9 shader baseline.
 * Very Subtle = half of V9 Subtle; Original ≈ Phase-2 peak.
 */
export const RIPPLE_STRENGTH_GAIN: Record<CanvasSettings['rippleStrength'], number> = {
  'Very Subtle': 0.5,
  Subtle: 1,
  Medium: 1.45,
  Original: 2.22,
};

/** Idle rotation rad/s — ~17% calmer than the V11 Slow/Medium/Fast values. */
export const ROTATION_SPEED: Record<CanvasSettings['speed'], number> = {
  Slow: 0.0215,
  Medium: 0.037,
  Fast: 0.062,
};
