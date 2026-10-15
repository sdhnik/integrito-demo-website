import type { DetectionReport, HighlightRange } from '../types/detection';

/**
 * Fixed illustrative fixture for V18.
 * Not derived from any user submission.
 */
export const SAMPLE_DOCUMENT_TITLE = 'How Small Decisions Shape Our Lives';

export const SAMPLE_DOCUMENT_TEXT = [
  'People often imagine that their lives are shaped by a few dramatic moments: moving to another country, choosing a career, or meeting someone special.',
  '',
  'However, I believe that small everyday decisions can be just as important.',
  '',
  'Every morning, we make choices without thinking much about them.',
  '',
  'We decide whether to exercise, read a book, call a friend, or spend another hour scrolling through social media.',
  '',
  'One decision may seem insignificant, but repeated choices slowly become habits.',
  '',
  'Over time, our habits influence our health, relationships, and opportunities.',
].join('\n');

/** Exact illustrative score from the product brief — never randomized. */
export const SAMPLE_DETECTION_SCORE = 81.59;

function rangeFor(snippet: string): HighlightRange {
  const start = SAMPLE_DOCUMENT_TEXT.indexOf(snippet);
  if (start < 0) {
    throw new Error(`Sample highlight snippet not found: ${snippet}`);
  }
  return {
    start,
    end: start + snippet.length,
    category: 'highly-likely',
  };
}

const SAMPLE_HIGHLIGHTS: HighlightRange[] = [
  rangeFor('However, I believe that small everyday decisions can be just as important.'),
  rangeFor('One decision may seem insignificant, but repeated choices slowly become habits.'),
].sort((a, b) => a.start - b.start);

export const SAMPLE_DETECTION_REPORT: DetectionReport = {
  id: 'sample-report-v18',
  documentTitle: SAMPLE_DOCUMENT_TITLE,
  text: SAMPLE_DOCUMENT_TEXT,
  score: SAMPLE_DETECTION_SCORE,
  classification: 'Potentially AI-generated',
  highlights: SAMPLE_HIGHLIGHTS,
  isDemo: true,
};

/**
 * Deterministic preview window: prefer a slice that includes the first highlight
 * with a little surrounding context. Falls back to the document start.
 */
export function getPreviewFragment(
  report: DetectionReport,
  maxChars = 280,
): { start: number; end: number } {
  const { text, highlights } = report;
  if (!text) return { start: 0, end: 0 };

  const first = highlights[0];
  if (!first) {
    return { start: 0, end: Math.min(text.length, maxChars) };
  }

  const pad = Math.floor((maxChars - (first.end - first.start)) / 2);
  let start = Math.max(0, first.start - Math.max(40, pad));
  let end = Math.min(text.length, start + maxChars);

  if (end - start < maxChars && start > 0) {
    start = Math.max(0, end - maxChars);
  }

  /* Prefer breaking on whitespace so the card does not clip mid-word. */
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space > start && space < start + 24) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > end - 24 && space > start) end = space;
  }

  return { start, end };
}
