import { forwardRef } from 'react';
import DocumentBody, { type DocumentBodyHandle } from './DocumentBody';
import type { HighlightRange } from '../../types/detection';
import {
  countWords,
  formatDocumentLengthMeta,
  PAGE_ESTIMATE_HINT,
} from '../../utils/textMetrics';

type Props = {
  text: string;
  highlights?: HighlightRange[];
  /** False until the submission settle finishes; opacity-only reveal. */
  revealed?: boolean;
  /** V20 coordinated highlight reveal progress 0…1. */
  revealProgress?: number;
  /** V21 manual highlight visibility (independent of reveal). */
  highlightsVisible?: boolean;
};

/**
 * Living Document Workspace surface — full submitted text at composer width.
 * Fills available height; body scrolls when content exceeds the region.
 */
const DocumentWorkspace = forwardRef<DocumentBodyHandle, Props>(
  function DocumentWorkspace(
    {
      text,
      highlights,
      revealed = true,
      revealProgress,
      highlightsVisible = true,
    },
    ref,
  ) {
    const words = countWords(text);
    const metaLabel = formatDocumentLengthMeta(words);

    return (
      <article
        className={`document-workspace${revealed ? ' is-revealed' : ' is-pending'}`}
        aria-labelledby="document-workspace-heading"
      >
        <header className="document-workspace-header">
          <h2 id="document-workspace-heading" className="workspace-section-label">
            Submitted text
          </h2>
          <p
            className="document-workspace-meta"
            title={PAGE_ESTIMATE_HINT}
            aria-label={`${metaLabel}. ${PAGE_ESTIMATE_HINT}`}
          >
            {metaLabel}
          </p>
        </header>

        <div className="document-surface">
          <DocumentBody
            ref={ref}
            text={text}
            highlights={highlights}
            revealProgress={revealProgress}
            highlightsVisible={highlightsVisible}
          />
        </div>
      </article>
    );
  },
);

export default DocumentWorkspace;
