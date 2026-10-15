import type { HighlightRange } from '../../types/detection';

export type TextSegment = {
  text: string;
  highlighted: boolean;
};

function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: HighlightRange[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const next = sorted[i];
    if (next.start <= prev.end) {
      prev.end = Math.max(prev.end, next.end);
    } else {
      merged.push({ ...next });
    }
  }
  return merged;
}

/** Normalize highlight offsets against document length; drop empty/out-of-range. */
export function normalizeHighlights(
  text: string,
  highlights: HighlightRange[],
): HighlightRange[] {
  const len = text.length;
  return mergeRanges(
    highlights
      .map(h => ({
        ...h,
        start: Math.max(0, Math.min(h.start, len)),
        end: Math.max(0, Math.min(h.end, len)),
      }))
      .filter(h => h.end > h.start),
  );
}

/**
 * Split document text into plain / highlighted segments (same semantics as Workspace).
 * Does not mutate the original string.
 */
export function buildTextSegments(
  text: string,
  highlights: HighlightRange[],
): TextSegment[] {
  const local = normalizeHighlights(text, highlights);
  if (!text) return [];
  if (local.length === 0) return [{ text, highlighted: false }];

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const h of local) {
    if (h.start > cursor) {
      segments.push({ text: text.slice(cursor, h.start), highlighted: false });
    }
    segments.push({ text: text.slice(h.start, h.end), highlighted: true });
    cursor = h.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }
  return segments;
}

/** Split into paragraph blocks on blank lines; keep single newlines inside a block. */
export function splitParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n');
  const parts = normalized.split(/\n{2,}/);
  return parts.length > 0 ? parts : [normalized];
}
