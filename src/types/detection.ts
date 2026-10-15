/** Frontend UI model for detection reports. Not a backend API contract. */

export type HighlightCategory = 'highly-likely';

export type HighlightRange = {
  start: number;
  end: number;
  category: HighlightCategory;
};

export type DetectionReport = {
  id: string;
  documentTitle: string;
  text: string;
  /** Percentage 0–100 (display value). */
  score: number;
  /** Short classification label under the score. */
  classification: string;
  highlights: HighlightRange[];
  isDemo: boolean;
};
