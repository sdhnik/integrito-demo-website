/** Original geometry, based on visual observation of the reference—not its source. */
export const SPIRAL_PHRASES = [
  'INTEGRITO',
  'HUMAN OR AI',
  'AI TEXT DETECTOR',
  'AI IMAGE DETECTOR',
  'PLAGIARISM CHECKER',
  'ORIGINALITY',
  'AUTHENTIC CONTENT',
] as const;

/** Lightweight centered dot with flanking spaces — never a dash. */
export const PHRASE_SEPARATOR = ' · ';

export type SpiralGlyph = { character: string; x: number; y: number; rotation: number; blue: boolean };
export type SpiralRing = { fontSize: number; glyphs: SpiralGlyph[]; depth: number; radius: number };

export type SpiralFragmentation = 'None' | 'Subtle' | 'Open' | 'More Open' | 'Experimental';
export type BlueAccentDensity = 'None' | 'Sparse' | 'Balanced' | 'Rich';

/** Whole-phrase omission rates only — never character-level cuts. */
export const PHRASE_OMIT_RATE: Record<SpiralFragmentation, number> = {
  None: 0,
  Subtle: 0.12,
  Open: 0.2,
  'More Open': 0.3,
  Experimental: 0.4,
};

/** Target highlighted complete words per ring (before visibility / spacing filters). */
const ACCENT_WORD_TARGET: Record<BlueAccentDensity, { min: number; max: number }> = {
  None: { min: 0, max: 0 },
  Sparse: { min: 0, max: 1 },
  Balanced: { min: 1, max: 2 },
  Rich: { min: 2, max: 3 },
};

/** Deterministic LCG — stable across frames, unique per seed. */
function createRng(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

type WordSpan = {
  unit: number;
  /** Character start within the phrase (not the full ring text). */
  start: number;
  end: number;
  /** Mid-angle of this word on the ring (radians). */
  angle: number;
};

/** Split a phrase into complete word spans (space-delimited). */
function phraseWordSpans(phrase: string): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  let i = 0;
  while (i < phrase.length) {
    while (i < phrase.length && phrase[i] === ' ') i++;
    if (i >= phrase.length) break;
    const start = i;
    while (i < phrase.length && phrase[i] !== ' ') i++;
    spans.push({ start, end: i });
  }
  return spans;
}

/**
 * Decide which phrase repeats are visible, then build ring text with
 * conditional · separators. Returns text plus per-unit visibility.
 */
function buildFragmentedRing(
  phrase: string,
  repeats: number,
  ring: number,
  depth: number,
  fragmentation: SpiralFragmentation,
): { text: string; visible: boolean[] } {
  const sep = PHRASE_SEPARATOR;
  const phraseOmit = PHRASE_OMIT_RATE[fragmentation];
  const visible = Array.from({ length: repeats }, () => true);

  if (phraseOmit > 0) {
    // Fragmentation seed — independent of accent seed so presets compose cleanly.
    const rand = createRng(ring * 7919 + 104729 + Math.round(depth * 9973));
    const ringMood = rand();
    // Organic: some rings stay dense, others carry larger voids.
    const phraseRate = ringMood < 0.22 ? phraseOmit * 0.35 : ringMood < 0.55 ? phraseOmit : phraseOmit * 1.45;
    const depthScale = depth < 0.18 ? 0.3 : depth < 0.35 ? 0.6 : 1;

    for (let i = 0; i < repeats; i++) {
      const phraseRoll = rand() + ((ring * 0.17 + i * 0.31) % 0.2) - 0.1;
      if (phraseRoll < phraseRate * depthScale) visible[i] = false;
    }
    // Keep at least one visible phrase so the ring stays recognizable.
    if (!visible.some(Boolean)) visible[Math.floor(rand() * repeats) % repeats] = true;
  }

  let out = '';
  for (let i = 0; i < repeats; i++) {
    out += visible[i] ? phrase : ' '.repeat(phrase.length);
    const next = (i + 1) % repeats;
    if (visible[i] && visible[next]) out += sep;
    else out += ' '.repeat(sep.length);
  }
  return { text: out, visible };
}

/**
 * Pick complete visible words to accent. Avoids neighbor-ring angular
 * alignment and adjacent picks on the same ring.
 */
function selectBlueWords(
  phrase: string,
  repeats: number,
  visible: boolean[],
  startAngle: number,
  step: number,
  ring: number,
  density: BlueAccentDensity,
  neighborAngles: number[],
): Set<string> {
  const target = ACCENT_WORD_TARGET[density];
  if (target.max <= 0) return new Set();

  const unitLen = phrase.length + PHRASE_SEPARATOR.length;
  const wordDefs = phraseWordSpans(phrase);
  const candidates: WordSpan[] = [];

  for (let unit = 0; unit < repeats; unit++) {
    if (!visible[unit]) continue;
    const unitBase = unit * unitLen;
    for (const w of wordDefs) {
      const midChar = unitBase + (w.start + w.end) / 2;
      const angle = startAngle - midChar * step;
      candidates.push({ unit, start: w.start, end: w.end, angle });
    }
  }
  if (!candidates.length) return new Set();

  const rand = createRng(ring * 6151 + 224737 + density.length * 97);
  const want = target.min + Math.floor(rand() * (target.max - target.min + 1));
  if (want <= 0) return new Set();

  // Pre-roll tie-breaks once so re-scoring stays deterministic.
  const jitter = candidates.map(() => rand());
  const picked: WordSpan[] = [];
  const pool = candidates.map((c, i) => ({ c, i }));

  const scoreOf = (c: WordSpan, jitterI: number) => {
    let score = jitter[jitterI];
    for (const a of neighborAngles) {
      const d = Math.abs(Math.atan2(Math.sin(c.angle - a), Math.cos(c.angle - a)));
      if (d < 0.4) score -= 2;
      else score += Math.min(d, 1.2) * 0.15;
    }
    for (const p of picked) {
      // Same phrase unit: reject adjacent / overlapping word picks.
      if (p.unit === c.unit) score -= 3;
      if (Math.abs(p.unit - c.unit) === 1 || Math.abs(p.unit - c.unit) === repeats - 1) score -= 1.2;
      const d = Math.abs(Math.atan2(Math.sin(c.angle - p.angle), Math.cos(c.angle - p.angle)));
      if (d < 0.55) score -= 1.5;
    }
    return score;
  };

  while (picked.length < want && pool.length) {
    let best = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const s = scoreOf(pool[i].c, pool[i].i);
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    }
    picked.push(pool.splice(best, 1)[0].c);
  }

  // Key: "unit:start:end" for glyph tagging.
  return new Set(picked.map(p => `${p.unit}:${p.start}:${p.end}`));
}

export type CreateSpiralOptions = {
  fragmentation?: SpiralFragmentation;
  blueAccent?: BlueAccentDensity;
  /** Radial falloff exponent for the base ring span. Default 1.12. */
  radiusPower?: number;
  /**
   * Rings that occupy `radius`. Additional rings (count - baseRingCount)
   * are placed OUTSIDE with the same radial gap as the last base step.
   */
  baseRingCount?: number;
};

/** Radius of ring `index` when the first `baseCount` rings span `baseRadius`. */
export function ringRadiusAt(
  index: number,
  baseRadius: number,
  baseCount: number,
  radiusPower: number,
): number {
  if (baseCount < 2) return baseRadius;
  if (index < baseCount) {
    const depth = index / (baseCount - 1);
    return 12 + (baseRadius - 12) * Math.pow(depth, radiusPower);
  }
  const rPrev = 12 + (baseRadius - 12) * Math.pow((baseCount - 2) / (baseCount - 1), radiusPower);
  const gap = Math.max(4, baseRadius - rPrev);
  return baseRadius + gap * (index - baseCount + 1);
}

/** Geometry and tangents are computed once; only cached layers move at runtime. */
export function createSpiralRings(
  baseRadius: number,
  count: number,
  phrases: readonly string[],
  options: CreateSpiralOptions = {},
): SpiralRing[] {
  const words = phrases.map(phrase => phrase.trim().toUpperCase()).filter(Boolean);
  if (!words.length || count < 2) return [];
  const fragmentation = options.fragmentation ?? 'None';
  const blueAccent = options.blueAccent ?? 'None';
  const radiusPower = options.radiusPower ?? 1.12;
  const baseCount = Math.min(Math.max(2, options.baseRingCount ?? count), count);

  const neighborAngles: number[] = [];
  const rings: SpiralRing[] = [];

  for (let ring = 0; ring < count; ring++) {
    const r = ringRadiusAt(ring, baseRadius, baseCount, radiusPower);
    const depth = ring / (count - 1);
    const fontDepth = Math.min(1.25, r / baseRadius);
    const fontSize = Math.max(4, baseRadius * (0.015 + fontDepth * 0.031));
    const phrase = words[ring % words.length];
    const unitWidth = phrase.length * fontSize * 0.62 + PHRASE_SEPARATOR.length * fontSize * 0.62;
    const repeats = Math.max(1, Math.round((2 * Math.PI * r) / unitWidth));
    const { text, visible } = buildFragmentedRing(phrase, repeats, ring, depth, fragmentation);
    const step = (2 * Math.PI) / text.length;
    const start = ring * 0.71;
    const sep = PHRASE_SEPARATOR;
    const phraseLen = phrase.length;
    const unitLen = phraseLen + sep.length;

    const blueKeys = selectBlueWords(
      phrase,
      repeats,
      visible,
      start,
      step,
      ring,
      blueAccent,
      neighborAngles.slice(-4),
    );

    // Record angles of this ring's accents for the next rings' avoidance.
    for (const key of blueKeys) {
      const [u, s, e] = key.split(':').map(Number);
      const midChar = u * unitLen + (s + e) / 2;
      neighborAngles.push(start - midChar * step);
    }

    rings.push({
      fontSize,
      depth,
      radius: r,
      glyphs: Array.from(text, (character, index) => {
        const angle = start - index * step;
        const unit = Math.floor(index / unitLen);
        const posInUnit = index % unitLen;
        const inPhrase = posInUnit < phraseLen;
        let blue = false;
        if (inPhrase && character !== ' ' && visible[unit]) {
          for (const key of blueKeys) {
            const parts = key.split(':');
            if (Number(parts[0]) !== unit) continue;
            const s = Number(parts[1]);
            const e = Number(parts[2]);
            if (posInUnit >= s && posInUnit < e) {
              blue = true;
              break;
            }
          }
        }
        return {
          character,
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          rotation: angle - Math.PI / 2,
          blue,
        };
      }),
    });
  }

  return rings;
}
