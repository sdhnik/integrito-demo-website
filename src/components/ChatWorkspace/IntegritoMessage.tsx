import ThinkingIndicator from './ThinkingIndicator';
import ResultReveal from './ResultReveal';
import type { DetectionReport } from '../../types/detection';

/** Configurable copy — swap for live API strings in a later version. */
export const INTEGRITO_COPY = {
  processingTitle: 'Preparing analysis preview…',
  liveProcessingTitle: 'Analyzing your text…',
  processingNote: 'Demo mode · No AI detection is running.',
  readyTitle: 'Document presentation ready.',
  readyDetail: 'No matching sample report for this text.',
  readyNote: 'Demo mode · No AI detection was performed.',
} as const;

export type IntegritoPhase = 'processing' | 'revealing' | 'complete' | 'preview-complete';

type Props = {
  phase: IntegritoPhase;
  report?: DetectionReport | null;
  /** Shared reveal progress 0…1. */
  revealProgress?: number;
  highlightsVisible?: boolean;
  onToggleHighlights?: () => void;
  explanationOpen?: boolean;
  onToggleExplanation?: () => void;
  onGiveFeedback?: () => void;
  onCheckAnotherText?: () => void;
  onExportPdf?: () => void;
  exportBusy?: boolean;
  exportNotice?: string;
  compactActions?: boolean;
};

/**
 * Bottom-anchored status / result region.
 * Brand signature removed in V19.3 — header already identifies Integrito.
 */
export default function IntegritoMessage({
  phase,
  report = null,
  revealProgress = 0,
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
  const isProcessing = phase === 'processing';
  const showResult =
    report !== null && (phase === 'revealing' || phase === 'complete');

  return (
    <article
      className={`integrito-message${
        isProcessing
          ? ' integrito-message--processing'
          : showResult
            ? ' integrito-message--result'
            : ' integrito-message--complete'
      }`}
      aria-label={showResult ? 'AI detection result' : 'Analysis status'}
    >
      {isProcessing ? (
        <>
          <p className="integrito-message-body" role="status" aria-live="polite">
            {INTEGRITO_COPY.processingTitle}
          </p>
          <ThinkingIndicator />
          <p className="integrito-message-note">{INTEGRITO_COPY.processingNote}</p>
        </>
      ) : showResult && report ? (
        <ResultReveal
          report={report}
          progress={revealProgress}
          actionsReady={phase === 'complete'}
          highlightsVisible={highlightsVisible}
          onToggleHighlights={onToggleHighlights}
          explanationOpen={explanationOpen}
          onToggleExplanation={onToggleExplanation}
          onGiveFeedback={onGiveFeedback}
          onCheckAnotherText={onCheckAnotherText}
          onExportPdf={onExportPdf}
          exportBusy={exportBusy}
          exportNotice={exportNotice}
          compactActions={compactActions}
        />
      ) : (
        <>
          <p className="integrito-message-body" role="status">
            {INTEGRITO_COPY.readyTitle}
          </p>
          <p className="integrito-message-sub">{INTEGRITO_COPY.readyDetail}</p>
          <p className="integrito-message-note">{INTEGRITO_COPY.readyNote}</p>
        </>
      )}
    </article>
  );
}
