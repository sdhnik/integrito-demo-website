import type { CSSProperties } from 'react';
import type { HighlightRange } from '../../types/detection';

type Props = {
  text: string;
  highlights: HighlightRange[];
  /** Optional window — when set, only render text[start:end] with remapped marks. */
  range?: { start: number; end: number };
  className?: string;
  /**
   * V20 coordinated reveal progress 0…1.
   * When omitted, highlights render at full strength (static / complete).
   */
  revealProgress?: number;
  /**
   * V21 manual visibility. When false, keep mark markup but zero fill
   * (no geometry change, no re-reveal animation).
   */
  highlightsVisible?: boolean;
};

type Segment = {
  text: string;
  highlighted: boolean;
  /** Index among highlighted segments in document order (for staggered reveal). */
  highlightIndex: number;
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

function buildSegments(
  text: string,
  highlights: HighlightRange[],
  window?: { start: number; end: number },
): Segment[] {
  const winStart = window?.start ?? 0;
  const winEnd = window?.end ?? text.length;
  const slice = text.slice(winStart, winEnd);
  if (!slice) return [];

  const local = mergeRanges(
    highlights
      .map(h => ({
        ...h,
        start: Math.max(h.start, winStart) - winStart,
        end: Math.min(h.end, winEnd) - winStart,
      }))
      .filter(h => h.end > h.start),
  );

  if (local.length === 0) return [{ text: slice, highlighted: false, highlightIndex: -1 }];

  const segments: Segment[] = [];
  let cursor = 0;
  let highlightIndex = 0;
  for (const h of local) {
    if (h.start > cursor) {
      segments.push({ text: slice.slice(cursor, h.start), highlighted: false, highlightIndex: -1 });
    }
    segments.push({
      text: slice.slice(h.start, h.end),
      highlighted: true,
      highlightIndex: highlightIndex++,
    });
    cursor = h.end;
  }
  if (cursor < slice.length) {
    segments.push({ text: slice.slice(cursor), highlighted: false, highlightIndex: -1 });
  }
  return segments;
}

/** Per-passage opacity from shared master progress (document order). */
export function highlightRevealAmount(
  index: number,
  count: number,
  progress: number,
): number {
  if (count <= 0) return 0;
  if (progress >= 1) return 1;
  if (progress <= 0) return 0;
  const start = index / count;
  const end = (index + 1) / count;
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

/**
 * Renders plain text with soft purple marks for highly-likely ranges.
 * No dangerouslySetInnerHTML — spans only.
 * Reveal animates background strength only — no typography or geometry change.
 */
export default function HighlightedText({
  text,
  highlights,
  range,
  className,
  revealProgress,
  highlightsVisible = true,
}: Props) {
  const segments = buildSegments(text, highlights, range);
  const highlightCount = segments.filter(s => s.highlighted).length;
  const progress = revealProgress ?? 1;

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (!segment.highlighted) {
          return <span key={index}>{segment.text}</span>;
        }
        const revealed = highlightRevealAmount(
          segment.highlightIndex,
          highlightCount,
          progress,
        );
        /* Visibility gate is independent of the progressive reveal. */
        const amount = highlightsVisible ? revealed : 0;
        const style = {
          ['--hl-reveal']: String(amount),
        } as CSSProperties;

        return (
          <mark
            key={index}
            className="ai-highlight"
            data-category="highly-likely"
            data-highlight-index={segment.highlightIndex}
            title="Highly likely"
            style={style}
          >
            {segment.text}
          </mark>
        );
      })}
    </span>
  );
}
