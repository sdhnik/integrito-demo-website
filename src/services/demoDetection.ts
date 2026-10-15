/** Demo-only async adapter. Replaceable when a real API exists. */

import {
  SAMPLE_DETECTION_REPORT,
  SAMPLE_DOCUMENT_TEXT,
} from '../data/sampleDetectionReport';
import type { DetectionReport } from '../types/detection';

export type DetectionRequest = {
  text: string;
};

export type DemoDetectionResult =
  | { kind: 'sample-report'; report: DetectionReport }
  | { kind: 'preview-complete' };

/** Delay after Workspace is ready before demo completion. */
export const DEMO_PROCESSING_MS = 2200;

/**
 * Exact document match required before returning the sample fixture.
 * Arbitrary submissions never receive fabricated scores or highlights.
 */
export function matchesSampleFixture(text: string): boolean {
  return text === SAMPLE_DOCUMENT_TEXT;
}

/**
 * Simulates waiting for analysis. Does not perform detection.
 * When `allowSampleFixture` is true and the submitted text is an exact
 * match for the V18 sample document, returns the predefined report.
 * Otherwise resolves with an honest preview-complete placeholder.
 */
export function runDemoDetection(
  request: DetectionRequest,
  options?: {
    signal?: AbortSignal;
    delayMs?: number;
    /** When true (?demo=1), allow the predefined sample fixture for exact text match only. */
    allowSampleFixture?: boolean;
  },
): Promise<DemoDetectionResult> {
  const delayMs = options?.delayMs ?? DEMO_PROCESSING_MS;
  const signal = options?.signal;
  const allowSample = options?.allowSampleFixture === true;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (allowSample && matchesSampleFixture(request.text)) {
        resolve({ kind: 'sample-report', report: SAMPLE_DETECTION_REPORT });
        return;
      }
      resolve({ kind: 'preview-complete' });
    }, delayMs);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
