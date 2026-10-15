import { pdf } from '@react-pdf/renderer';
import type { DetectionReport } from '../../types/detection';
import DetectionReportDocument from './DetectionReportDocument';
import { registerReportFonts } from './registerFonts';

export type CreateDetectionPdfInput = {
  documentText: string;
  report: DetectionReport;
  generatedAt?: Date;
};

export function buildExportFilename(generatedAt: Date = new Date()): string {
  const y = generatedAt.getFullYear();
  const m = String(generatedAt.getMonth() + 1).padStart(2, '0');
  const d = String(generatedAt.getDate()).padStart(2, '0');
  return `integrito-ai-text-report-${y}-${m}-${d}.pdf`;
}

/**
 * Build a downloadable PDF Blob from a completed detection report snapshot.
 * Runs entirely in the browser — no network upload.
 */
export async function createDetectionPdf(input: CreateDetectionPdfInput): Promise<Blob> {
  const { documentText, report } = input;
  if (!report) {
    throw new Error('No detection report available for export.');
  }
  if (!documentText && !report.text) {
    throw new Error('No document text available for export.');
  }

  registerReportFonts();
  const generatedAt = input.generatedAt ?? new Date();

  const instance = pdf(
    <DetectionReportDocument
      documentText={documentText || report.text}
      report={report}
      generatedAt={generatedAt}
    />,
  );

  return instance.toBlob();
}

/** Trigger a browser download and revoke the temporary object URL. */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
