/** Maximum words accepted for AI Text Detection (Landing + New Check). */
export const MAX_DETECTION_WORDS = 3000;

/** Approximate words per page for the Composer / document length estimate. */
export const WORDS_PER_PAGE = 275;

export const PAGE_ESTIMATE_HINT =
  'Estimated using 275 words per page. Actual document pages may vary.';

let wordSegmenter: Intl.Segmenter | null | undefined;

function getWordSegmenter(): Intl.Segmenter | null {
  if (wordSegmenter !== undefined) return wordSegmenter;
  try {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
      return wordSegmenter;
    }
  } catch {
    /* Unsupported locale / environment — fall through. */
  }
  wordSegmenter = null;
  return null;
}

/**
 * Unicode-aware word count shared by Composer validation and document meta.
 * Prefers Intl.Segmenter (isWordLike); falls back to letter/number sequences.
 */
export function countWords(text: string): number {
  if (!text || !/\S/.test(text)) return 0;

  const segmenter = getWordSegmenter();
  if (segmenter) {
    let count = 0;
    for (const part of segmenter.segment(text)) {
      if (part.isWordLike) count += 1;
    }
    return count;
  }

  /* Fallback: letters/numbers with optional internal apostrophe or hyphen. */
  const parts = text.match(/[\p{L}\p{N}]+(?:['\u2019\-][\p{L}\p{N}]+)*/gu);
  return parts ? parts.length : 0;
}

/** Estimated document pages from word count (0 → 0; otherwise ceil division). */
export function estimatePages(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.ceil(wordCount / WORDS_PER_PAGE);
}

export function formatWordLabel(wordCount: number): string {
  const n = Math.max(0, wordCount);
  return `${n.toLocaleString()} ${n === 1 ? 'word' : 'words'}`;
}

export function formatPageEstimate(pages: number): string {
  const n = Math.max(0, pages);
  return `≈ ${n.toLocaleString()} ${n === 1 ? 'page' : 'pages'}`;
}

/** Submitted Text header meta: "86 words · ≈ 1 page". */
export function formatDocumentLengthMeta(wordCount: number): string {
  return `${formatWordLabel(wordCount)} · ${formatPageEstimate(estimatePages(wordCount))}`;
}

export function isOverDetectionWordLimit(wordCount: number): boolean {
  return wordCount > MAX_DETECTION_WORDS;
}
