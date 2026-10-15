import type { DetectionReport } from '../../types/detection';
import DetectionScore from './DetectionScore';
import DocumentPreview from './DocumentPreview';

type Props = {
  report: DetectionReport;
  onOpenDocument?: () => void;
};

export default function DetectionResult({ report, onOpenDocument }: Props) {
  return (
    <div className="detection-result">
      <DetectionScore score={report.score} classification={report.classification} />

      <DocumentPreview report={report} onOpen={onOpenDocument} />

      {report.isDemo && (
        <p className="detection-result-disclaimer">
          Demo result · Not based on your submitted text.
        </p>
      )}
    </div>
  );
}
