import FloatingActionMenu from './FloatingActionMenu';
import { useEffect, useId, useRef, useState } from 'react';
import {
  IconDoc,
  IconExportPdf,
  IconEye,
  IconEyeOff,
  IconInfo,
  IconMessage,
  IconMore,
} from './ResultActionIcons';

export const RESULT_EXPLANATION_COPY =
  'AI detection scores are indicators, not proof of authorship. Highlighted passages identify text marked as Highly likely. This preview uses predefined sample data; no real AI detection was performed.';

type Props = {
  highlightsVisible: boolean;
  onToggleHighlights: () => void;
  explanationOpen: boolean;
  onToggleExplanation: () => void;
  onGiveFeedback?: () => void;
  onCheckAnotherText?: () => void;
  onExportPdf?: () => void;
  exportBusy?: boolean;
  /**
   * Height-compact: collapse the five chips into a single Actions menu
   * so the document keeps usable vertical space.
   */
  compactActions?: boolean;
};

/**
 * Compact contextual actions under the horizontal detection result.
 * Shown only after reveal completes (parent gates visibility).
 */
export default function ResultQuickActions({
  highlightsVisible,
  onToggleHighlights,
  explanationOpen,
  onToggleExplanation,
  onGiveFeedback,
  onCheckAnotherText,
  onExportPdf,
  exportBusy = false,
  compactActions = false,
}: Props) {
  const explanationId = useId();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrap = useRef<HTMLDivElement>(null);
  const hasFeedback = onGiveFeedback != null;
  const hasCheckAnother = onCheckAnotherText != null;
  const hasExport = onExportPdf != null;
  const hasWidthMoreItems = hasCheckAnother || hasExport;

  const menuId = useId();
  useEffect(() => { setMoreOpen(false); }, [compactActions]);

  const highlightLabel = highlightsVisible ? 'Hide highlights' : 'Show highlights';
  const exportLabel = exportBusy ? 'Preparing PDF…' : 'Export PDF';

  const explanationPanel = explanationOpen ? (
    <p
      id={explanationId}
      className={`result-explanation${compactActions ? ' result-explanation--overlay' : ''}`}
      role="region"
      aria-label="Result explanation"
    >
      {RESULT_EXPLANATION_COPY}
    </p>
  ) : null;

  if (compactActions) {
    return (
      <div className="result-quick-actions result-quick-actions--compact">
        <div className="result-quick-actions-row" role="toolbar" aria-label="Result actions">
          <div className="result-action-more result-action-more--compact" ref={moreWrap}>
            <button
              type="button"
              className="result-action-chip result-action-chip--actions"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              aria-controls={moreOpen ? menuId : undefined}
              onClick={() => setMoreOpen(open => !open)}
            >
              <IconMore />
              Actions
              <span className="result-action-chevron" aria-hidden="true">
                ▾
              </span>
            </button>
            {moreOpen && (
              <FloatingActionMenu anchor={moreWrap} id={menuId} onClose={() => setMoreOpen(false)}>
                <button
                  type="button"
                  className="result-action-menu-item"
                  role="menuitem"
                  aria-pressed={highlightsVisible}
                  onClick={() => {
                    setMoreOpen(false);
                    onToggleHighlights();
                  }}
                >
                  {highlightsVisible ? <IconEye /> : <IconEyeOff />}
                  {highlightLabel}
                </button>
                <button
                  type="button"
                  className="result-action-menu-item"
                  role="menuitem"
                  aria-expanded={explanationOpen}
                  aria-controls={explanationId}
                  onClick={() => {
                    setMoreOpen(false);
                    onToggleExplanation();
                  }}
                >
                  <IconInfo />
                  What does this mean?
                </button>
                {hasFeedback && (
                  <button
                    type="button"
                    className="result-action-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      onGiveFeedback();
                    }}
                  >
                    <IconMessage />
                    Give feedback
                  </button>
                )}
                {hasCheckAnother && (
                  <button
                    type="button"
                    className="result-action-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      onCheckAnotherText();
                    }}
                  >
                    <IconDoc />
                    Check another text
                  </button>
                )}
                {hasExport && (
                  <button
                    type="button"
                    className="result-action-menu-item"
                    role="menuitem"
                    disabled={exportBusy}
                    aria-busy={exportBusy || undefined}
                    onClick={() => {
                      if (exportBusy) return;
                      setMoreOpen(false);
                      onExportPdf();
                    }}
                  >
                    <IconExportPdf />
                    {exportLabel}
                  </button>
                )}
              </FloatingActionMenu>
            )}
          </div>
        </div>
        {explanationPanel}
      </div>
    );
  }

  return (
    <div className="result-quick-actions">
      <div className="result-quick-actions-row" role="toolbar" aria-label="Result actions">
        <button
          type="button"
          className="result-action-chip"
          aria-pressed={highlightsVisible}
          onClick={onToggleHighlights}
        >
          {highlightsVisible ? <IconEye /> : <IconEyeOff />}
          {highlightLabel}
        </button>

        <button
          type="button"
          className={`result-action-chip result-action-chip--emphasis${
            explanationOpen ? ' is-expanded' : ''
          }`}
          aria-expanded={explanationOpen}
          aria-controls={explanationId}
          onClick={onToggleExplanation}
        >
          <IconInfo />
          What does this mean?
        </button>

        {hasFeedback && (
          <button type="button" className="result-action-chip" onClick={onGiveFeedback}>
            <IconMessage />
            Give feedback
          </button>
        )}

        {hasCheckAnother && (
          <button
            type="button"
            className="result-action-chip result-action-chip--desktop"
            onClick={onCheckAnotherText}
          >
            <IconDoc />
            Check another text
          </button>
        )}

        {hasExport && (
          <button
            type="button"
            className="result-action-chip result-action-chip--desktop"
            onClick={onExportPdf}
            disabled={exportBusy}
            aria-busy={exportBusy || undefined}
          >
            <IconExportPdf />
            {exportLabel}
          </button>
        )}

        {hasWidthMoreItems && (
          <div className="result-action-more" ref={moreWrap}>
            <button
              type="button"
              className="result-action-chip result-action-chip--more"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              aria-controls={moreOpen ? menuId : undefined}
              onClick={() => setMoreOpen(open => !open)}
            >
              <IconMore />
              More
            </button>
            {moreOpen && (
              <FloatingActionMenu anchor={moreWrap} id={menuId} onClose={() => setMoreOpen(false)}>
                {hasCheckAnother && (
                  <button
                    type="button"
                    className="result-action-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      onCheckAnotherText();
                    }}
                  >
                    <IconDoc />
                    Check another text
                  </button>
                )}
                {hasExport && (
                  <button
                    type="button"
                    className="result-action-menu-item"
                    role="menuitem"
                    disabled={exportBusy}
                    aria-busy={exportBusy || undefined}
                    onClick={() => {
                      if (exportBusy) return;
                      setMoreOpen(false);
                      onExportPdf();
                    }}
                  >
                    <IconExportPdf />
                    {exportLabel}
                  </button>
                )}
              </FloatingActionMenu>
            )}
          </div>
        )}
      </div>

      {explanationPanel}
    </div>
  );
}
