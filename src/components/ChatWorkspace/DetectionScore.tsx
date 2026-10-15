type Props = {
  /** Displayed percentage 0–100 (may be mid-reveal). */
  score: number;
  classification: string;
  /** Final fixture score — used for accessible “current of final” labeling. */
  finalScore?: number;
  /** When false, hide the highlight legend (e.g. zero-highlight reports). */
  showHighlightCategory?: boolean;
};

function formatScore(score: number): string {
  return `${score.toFixed(2)}%`;
}

/**
 * Horizontal score block: large % left, classification + bar + legend right.
 * Eyebrow / demo disclaimer live in ResultReveal metadata row.
 */
export default function DetectionScore({
  score,
  classification,
  finalScore,
  showHighlightCategory = true,
}: Props) {
  const clamped = Math.min(100, Math.max(0, score));
  const final = finalScore ?? clamped;

  return (
    <div className="detection-score">
      <p
        className="detection-score-value"
        aria-label={`AI detection score ${formatScore(clamped)}${
          final !== clamped ? ` of ${formatScore(final)}` : ''
        }`}
      >
        {formatScore(clamped)}
      </p>
      <div className="detection-score-detail">
        <p className="detection-score-label">{classification}</p>
        <div
          className="detection-score-bar"
          role="img"
          aria-label={`Score indicator at ${formatScore(clamped)}`}
        >
          <div className="detection-score-bar-track">
            <div className="detection-score-bar-fill" style={{ width: `${clamped}%` }} />
          </div>
        </div>
        {showHighlightCategory && (
          <p
            className="detection-score-category"
            aria-label="Highly likely passages marked with purple highlighting"
          >
            <span className="detection-score-swatch" aria-hidden="true" />
            Highly likely passages
          </p>
        )}
      </div>
    </div>
  );
}
