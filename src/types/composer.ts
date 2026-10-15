/** Explicit Workspace Composer interaction modes (V22). */
export type ComposerMode = 'new-check' | 'feedback';

/** Feedback drafts remain character-capped (unchanged from V22). */
export const FEEDBACK_CHAR_LIMIT = 2000;

export const FEEDBACK_DRAFT_STORAGE_KEY = 'integrito-feedback-draft';

export {
  MAX_DETECTION_WORDS,
  WORDS_PER_PAGE,
  PAGE_ESTIMATE_HINT,
} from '../utils/textMetrics';
