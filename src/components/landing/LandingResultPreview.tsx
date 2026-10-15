import DetectionScore from '../ChatWorkspace/DetectionScore';
import HighlightedText from '../ChatWorkspace/HighlightedText';
import {
  SAMPLE_DETECTION_REPORT,
  getPreviewFragment,
} from '../../data/sampleDetectionReport';

/**
 * Presentation-only report preview. Uses the fixed demo fixture only —
 * no Workspace state, no live detection.
 */
export default function LandingResultPreview() {
  const report = SAMPLE_DETECTION_REPORT;
  const fragment = getPreviewFragment(report, 260);

  return (
    <section className="landing-section landing-result" aria-labelledby="landing-result-heading">
      <div className="landing-section-inner landing-result-grid">
        <div className="landing-result-copy">
          <p className="landing-eyebrow">03 / THE RESULT</p>
          <h2 id="landing-result-heading" className="landing-heading">
            More than just a percentage.
          </h2>
          <p className="landing-lede">
            A single number rarely tells the whole story. Explore highlighted passages alongside
            the original writing to understand what deserves a closer look.
          </p>
        </div>

        <aside className="landing-result-preview" aria-label="Illustrative detection report preview">
          <div className="landing-result-preview-meta">
            <p className="workspace-section-label">AI Detection Result</p>
            <p className="landing-result-preview-badge">Illustrative demo</p>
          </div>
          <DetectionScore
            score={report.score}
            finalScore={report.score}
            classification={report.classification}
            showHighlightCategory
          />
          <div className="landing-result-excerpt">
            <p className="landing-result-excerpt-label">Submitted text</p>
            <div className="landing-result-excerpt-body">
              <HighlightedText
                text={report.text}
                highlights={report.highlights}
                range={fragment}
                className="landing-result-excerpt-text"
              />
            </div>
          </div>
          <p className="landing-result-preview-note">
            Demo visualization · Predefined sample, no AI detection performed.
          </p>
        </aside>
      </div>
    </section>
  );
}
