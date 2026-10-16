import { createSpiralRings, ringRadiusAt, SPIRAL_PHRASES } from './spiralGeometry';
import {
  applySidebarRingSubtract,
  BASE_RING_COUNT,
  resolveResponsiveRingCount,
  type CanvasSettings,
} from './canvasSettings';

/** Matches GenerativeCanvas layer rotation multipliers: phase * (0.82 + i * 0.12). */
export const LAYER_ROTATION_FACTORS = [0.82, 0.94, 1.06] as const;

/** Base ring counts before spacing adjustments (intensity × viewport). Legacy presets. */
const BASE_RING_COUNTS = {
  desktop: { Low: 17, Medium: 20, High: 23 },
  mobile: 13,
} as const;

/**
 * Spacing reduces ring count while keeping the same outer radius (legacy presets).
 * Airy / Minimal use dedicated paths; Minimal is the V13 base (10 rings).
 */
const SPACING_RING_SCALE: Record<Exclude<CanvasSettings['ringSpacing'], 'Airy' | 'Minimal'>, number> = {
  Default: 1,
  Spacious: 0.8,
  'Extra Spacious': 0.7,
};

const SPACING_RADIUS_POWER: Record<CanvasSettings['ringSpacing'], number> = {
  Default: 1.12,
  Spacious: 1.06,
  'Extra Spacious': 1.02,
  Airy: 1,
  Minimal: 1,
};

export type SpiralBakeInput = {
  width: number;
  height: number;
  /** CSS viewport width — drives responsive ring breakpoints. */
  viewportWidth: number;
  mobile: boolean;
  theme: 'light' | 'dark';
  settings: CanvasSettings;
  phrases: readonly string[];
  /**
   * V22.9.9 — when > 0 (sidebar nav variants), drop this many outermost
   * rings from the responsive count without redistributing radii.
   */
  ringCountSubtract?: number;
};

export type SpiralBakeResult = {
  layers: HTMLCanvasElement[];
  layerSize: number;
  centerX: number;
  centerY: number;
  radius: number;
  ringCount: number;
};

/**
 * Total rings for the bake.
 * Responsive (default): viewport-width breakpoints, base 10 + outer extras.
 * Fixed: base 10 for Minimal; legacy counts for older spacing presets.
 * Optional ringCountSubtract clips outer rings (sidebar variants only).
 */
export function resolveRingCount(
  viewportWidth: number,
  mobile: boolean,
  settings: CanvasSettings,
  ringCountSubtract = 0,
): number {
  let count: number;
  if (settings.ringCountMode === 'Responsive') {
    count = resolveResponsiveRingCount(viewportWidth);
  } else if (settings.ringSpacing === 'Minimal') {
    count = BASE_RING_COUNT;
  } else if (settings.ringSpacing === 'Airy') {
    count = mobile ? 8 : 12;
  } else {
    const base = mobile ? BASE_RING_COUNTS.mobile : BASE_RING_COUNTS.desktop[settings.intensity];
    const scaled = Math.round(base * SPACING_RING_SCALE[settings.ringSpacing]);
    count = Math.max(mobile ? 8 : 10, scaled);
  }

  if (ringCountSubtract > 0) {
    return applySidebarRingSubtract(count, ringCountSubtract);
  }
  return count;
}

/** Inner rings slightly softer; outer rings keep full presence. Baked once. */
function ringOpacity(depth: number): number {
  return 0.5 + 0.5 * Math.pow(depth, 0.72);
}

/** Canvas 2D typography bake — uploaded to WebGL textures (and static fallback). */
export function bakeSpiralLayers({
  width,
  height,
  viewportWidth,
  mobile,
  theme,
  settings,
  phrases,
  ringCountSubtract = 0,
}: SpiralBakeInput): SpiralBakeResult {
  // Base outer radius for the 10-ring core — not redistributed when extras are added.
  const baseRadius = Math.max(12, Math.min(height * 0.46 - 18, width * 0.48 - 18));
  const count = resolveRingCount(viewportWidth, mobile, settings, ringCountSubtract);
  const radiusPower = SPACING_RADIUS_POWER[settings.ringSpacing];
  /*
    Radial reference is always the full base set (10 for Minimal/Responsive).
    When count < baseCount (sidebar subtract), outer rings are omitted and
    remaining rings keep their original radii — no redistribution.
  */
  const baseCount =
    settings.ringCountMode === 'Responsive' || settings.ringSpacing === 'Minimal'
      ? BASE_RING_COUNT
      : count;

  const rings = createSpiralRings(baseRadius, count, phrases.length ? phrases : SPIRAL_PHRASES, {
    fragmentation: settings.textFragmentation,
    blueAccent: settings.accent === 'Integrito Blue' ? settings.blueAccent : 'None',
    radiusPower,
    baseRingCount: baseCount,
  });

  const totalRadius = ringRadiusAt(count - 1, baseRadius, baseCount, radiusPower);
  const extra = Math.max(0, count - baseCount);

  // Nudge center left as outer rings grow so they fill toward the headline
  // without covering the copy. Still biased to the right half.
  const centerBias = mobile ? 0.58 : Math.max(0.55, 0.69 - extra * 0.04);
  let centerX = Math.min(width * centerBias, width - totalRadius * 0.55);
  centerX = Math.max(totalRadius * 0.42, centerX);
  const centerY = height / 2;

  const layerSize = Math.ceil(totalRadius * 2 + 36);
  const layers = Array.from({ length: 3 }, () => {
    const layer = document.createElement('canvas');
    layer.width = layer.height = layerSize;
    return layer;
  });

  const baseInk = theme === 'dark' ? '#d5d8df' : '#35363b';
  const accentInk = theme === 'dark' ? '#8294ff' : '#4361ff';

  for (let i = 0; i < rings.length; i++) {
    const ink = layers[i % layers.length].getContext('2d')!;
    const ring = rings[i];
    const alpha = ringOpacity(ring.depth);
    ink.font = `500 ${ring.fontSize}px "Courier New", monospace`;
    ink.textAlign = 'center';
    ink.textBaseline = 'middle';
    for (const glyph of ring.glyphs) {
      if (glyph.character === ' ') continue;
      ink.save();
      ink.globalAlpha = alpha;
      ink.translate(layerSize / 2 + glyph.x, layerSize / 2 + glyph.y);
      ink.rotate(glyph.rotation);
      ink.fillStyle = glyph.blue && settings.accent === 'Integrito Blue' ? accentInk : baseInk;
      ink.fillText(glyph.character, 0, 0);
      ink.restore();
    }
  }

  return { layers, layerSize, centerX, centerY, radius: totalRadius, ringCount: count };
}

/** Bake cache key — excludes rippleStrength; includes ring mode + breakpoint bucket. */
export function spiralCacheKey(
  width: number,
  height: number,
  viewportWidth: number,
  theme: string,
  settings: Pick<
    CanvasSettings,
    'accent' | 'intensity' | 'ringSpacing' | 'textFragmentation' | 'ringCountMode' | 'blueAccent'
  >,
  phrases: readonly string[],
  ringCountSubtract = 0,
): string {
  const ringBucket =
    settings.ringCountMode === 'Responsive'
      ? applySidebarRingSubtract(
          resolveResponsiveRingCount(viewportWidth),
          ringCountSubtract,
        )
      : `fixed-${ringCountSubtract}`;
  return JSON.stringify([
    width,
    height,
    ringBucket,
    ringCountSubtract,
    theme,
    settings.accent,
    settings.intensity,
    settings.ringSpacing,
    settings.textFragmentation,
    settings.ringCountMode,
    settings.blueAccent,
    phrases,
  ]);
}
