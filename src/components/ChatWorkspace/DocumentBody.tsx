import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import HighlightedText from './HighlightedText';
import type { HighlightRange } from '../../types/detection';

export type DocumentBodyHandle = {
  /** Scroll the internal document scroller to highlight index (document order). */
  scrollToHighlight: (index: number) => void;
};

type Props = {
  text: string;
  /**
   * Analysis marks. When empty/omitted, the full original text still renders
   * through the same span pipeline so later highlights share one code path.
   */
  highlights?: HighlightRange[];
  /** V20 coordinated reveal progress 0…1. */
  revealProgress?: number;
  /**
   * Manual visibility after reveal (V21). Independent of revealProgress.
   * When false, marks stay in the DOM at zero fill — no text reflow.
   */
  highlightsVisible?: boolean;
};

function prefersReducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Read-only document text. Always renders via HighlightedText so the DOM
 * structure stays stable when highlights arrive.
 */
const DocumentBody = forwardRef<DocumentBodyHandle, Props>(function DocumentBody(
  { text, highlights = [], revealProgress, highlightsVisible = true },
  ref,
) {
  const scroller = useRef<HTMLDivElement>(null);

  /* Reset internal scroll only when a new document is submitted. */
  useEffect(() => {
    const root = scroller.current;
    if (root) root.scrollTop = 0;
  }, [text]);

  useImperativeHandle(ref, () => ({
    scrollToHighlight(index: number) {
      const root = scroller.current;
      if (!root) return;
      const mark = root.querySelector<HTMLElement>(
        `mark.ai-highlight[data-highlight-index="${index}"]`,
      );
      if (!mark) return;

      const rootRect = root.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();
      /* Comfortable inset from the top of the scrollport (not under header). */
      const pad = 28;
      const nextTop = root.scrollTop + (markRect.top - rootRect.top) - pad;
      const maxTop = Math.max(0, root.scrollHeight - root.clientHeight);
      const clamped = Math.min(maxTop, Math.max(0, nextTop));
      const reduce = prefersReducedMotion();
      root.scrollTo({ top: clamped, behavior: reduce ? 'auto' : 'smooth' });
    },
  }));

  return (
    <div
      ref={scroller}
      className="document-body"
      tabIndex={0}
      role="region"
      aria-label="Submitted document"
    >
      <HighlightedText
        text={text}
        highlights={highlights}
        revealProgress={revealProgress}
        highlightsVisible={highlightsVisible}
        className="document-body-text"
      />
    </div>
  );
});

export default DocumentBody;
