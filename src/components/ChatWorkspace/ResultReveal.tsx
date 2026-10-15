import type { DetectionReport } from '../../types/detection';
import DetectionScore from './DetectionScore';
import ResultQuickActions from './ResultQuickActions';

type Props = {
  report: DetectionReport;
  /** Shared reveal progress 0…1 (eased). */
  progress: number;
  /** True only after the 1500ms reveal finishes. */
  actionsReady?: boolean;
  highlightsVisible?: boolean;
  onToggleHighlights?: () => void;
  explanationOpen?: boolean;
  onToggleExplanation?: () => void;
  onGiveFeedback?: () => void;
  onCheckAnotherText?: () => void;
  onExportPdf?: () => void;
  exportBusy?: boolean;
  exportNotice?: string;
  /** Height-compact: collapse Quick Actions into Actions menu. */
  compactActions?: boolean;
};

/**
 * Compact full-width horizontal result (V20.1) + contextual actions (V21 / V22.7).
 * Highlights live in DocumentBody — no second document copy.
 */
export default function ResultReveal({
  report,
  progress,
  actionsReady = false,
  highlightsVisible = true,
  onToggleHighlights,
  explanationOpen = false,
  onToggleExplanation,
  onGiveFeedback,
  onCheckAnotherText,
  onExportPdf,
  exportBusy = false,
  exportNotice = '',
  compactActions = false,
}: Props) {
  const displayed = report.score * Math.min(1, Math.max(0, progress));
  const hasHighlights = report.highlights.length > 0;
  const showActions =
    actionsReady && onToggleHighlights != null && onToggleExplanation != null;
  const noticeIsError = exportNotice.toLowerCase().includes('could not');

  return (
    <div className="result-reveal" aria-label="AI detection result">
      <div className="result-reveal-meta">
        <p className="workspace-section-label">AI Detection Result</p>
        {exportNotice ? (
          <p
            className={`result-reveal-disclaimer result-export-status${
              noticeIsError ? ' is-error' : ''
            }`}
            role="status"
            aria-live="polite"
          >
            {exportNotice}
          </p>
        ) : report.isDemo ? (
          <p className="result-reveal-disclaimer">
            Demo visualization · Predefined sample, no AI detection performed.
          </p>
        ) : null}
      </div>
      <DetectionScore
        score={displayed}
        finalScore={report.score}
        classification={report.classification}
        showHighlightCategory={hasHighlights}
      />
      {showActions && (
        <ResultQuickActions
          highlightsVisible={highlightsVisible}
          onToggleHighlights={onToggleHighlights}
          explanationOpen={explanationOpen}
          onToggleExplanation={onToggleExplanation}
          onGiveFeedback={onGiveFeedback}
          onCheckAnotherText={onCheckAnotherText}
          onExportPdf={onExportPdf}
          exportBusy={exportBusy}
          compactActions={compactActions}
        />
      )}
    </div>
  );
}
