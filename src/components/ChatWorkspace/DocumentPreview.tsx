import type { DetectionReport } from '../../types/detection';
import { getPreviewFragment } from '../../data/sampleDetectionReport';
import HighlightedText from './HighlightedText';

type Props = {
  report: DetectionReport;
  /** When provided in V19, the card becomes an interactive control. */
  onOpen?: () => void;
};

export default function DocumentPreview({ report, onOpen }: Props) {
  const fragment = getPreviewFragment(report);
  const interactive = typeof onOpen === 'function';

  const body = (
    <>
      <span className="document-preview-kicker">Document preview</span>
      <span className="document-preview-title">{report.documentTitle}</span>
      <span className="document-preview-excerpt">
        {fragment.start > 0 && <span className="document-preview-ellipsis">… </span>}
        <HighlightedText
          text={report.text}
          highlights={report.highlights}
          range={fragment}
        />
        {fragment.end < report.text.length && (
          <span className="document-preview-ellipsis"> …</span>
        )}
      </span>
      <span className="document-preview-fade" aria-hidden="true" />
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className="document-preview document-preview--interactive"
        onClick={onOpen}
        aria-label={`Open document preview: ${report.documentTitle}`}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      className="document-preview"
      role="group"
      aria-label={`Sample document preview: ${report.documentTitle}`}
    >
      {body}
    </div>
  );
}
