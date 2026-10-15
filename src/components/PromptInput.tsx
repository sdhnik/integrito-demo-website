import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComposerMode } from '../types/composer';
import { FEEDBACK_CHAR_LIMIT, FEEDBACK_DRAFT_STORAGE_KEY } from '../types/composer';
import {
  countWords,
  estimatePages,
  formatPageEstimate,
  isOverDetectionWordLimit,
  MAX_DETECTION_WORDS,
  PAGE_ESTIMATE_HINT,
} from '../utils/textMetrics';

type Props = {
  /** Landing submits detection; workspace uses explicit composer modes. */
  variant?: 'landing' | 'workspace';
  /** Landing Detect AI. */
  onSubmit?: (text: string) => void;
  /** Workspace New Check — stay in Workspace. */
  onSubmitNewCheck?: (text: string) => void;
  /** Blocks duplicate Detect AI during transitions / processing. */
  submitting?: boolean;
  /**
   * External reset (header New Check / reduced-motion jump).
   * Increments to force empty value + baseline height.
   */
  resetToken?: number;
  /**
   * Development-only prefill (?demo=1). Applied once on mount when landing.
   */
  initialText?: string;
  /** Workspace interaction mode. Ignored on Landing. */
  mode?: ComposerMode;
  onModeChange?: (mode: ComposerMode) => void;
  /**
   * When false in Workspace, composer stays locked (processing / revealing).
   * Landing ignores this flag.
   */
  composerActive?: boolean;
  /** Increment to focus the textarea (Give feedback / Check another text). */
  focusToken?: number;
};

/** Height collapse before text clear (must finish before clear). */
const HEIGHT_COLLAPSE_MS = 350;
/** Programmatic demo restore expansion (New Check → Landing). */
const RESTORE_EXPAND_MS = 300;
const EMPTY_MIN_PX = 48;
const CONTENT_MAX_PX = 144;

function prefersReducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Approximate cubic-bezier(0.4, 0, 0.2, 1) progress. */
function collapseEase(t: number): number {
  const p = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - p, 3);
}

export default function PromptInput({
  variant = 'landing',
  onSubmit,
  onSubmitNewCheck,
  submitting = false,
  resetToken = 0,
  initialText,
  mode = 'new-check',
  onModeChange,
  composerActive = false,
  focusToken = 0,
}: Props) {
  const [text, setText] = useState(() => initialText ?? '');
  const [notice, setNotice] = useState('');
  /** True while height collapse / clear cycle runs after Detect AI. */
  const [collapsing, setCollapsing] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const emptyHeight = useRef<number | null>(null);
  const settling = useRef(false);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const lastReset = useRef(0);
  const lastFocus = useRef(0);
  /** Bumped on submit/reset so stale collapse/clear callbacks cannot clear restored text. */
  const actionGen = useRef(0);
  /** When true, next text sync expands height with RESTORE_EXPAND_MS (demo New Check). */
  const pendingExpand = useRef(false);
  const modeRef = useRef<ComposerMode>(mode);
  const textRef = useRef(text);
  const drafts = useRef<{ 'new-check': string; feedback: string }>({
    'new-check': '',
    feedback: '',
  });
  const isWorkspace = variant === 'workspace';
  const isFeedback = isWorkspace && mode === 'feedback';
  const interactive = isWorkspace ? composerActive && !collapsing && !submitting : !collapsing && !submitting;
  const locked = !interactive;
  const wordCount = isFeedback ? 0 : countWords(text);
  const pageEstimate = isFeedback ? 0 : estimatePages(wordCount);
  const overWordLimit = !isFeedback && isOverDetectionWordLimit(wordCount);
  const detectionLimitLabel = MAX_DETECTION_WORDS.toLocaleString();
  const overLimitMessage = `This text exceeds the ${detectionLimitLabel}-word limit. Shorten it to continue.`;
  const pageEstimateId = useId();

  textRef.current = text;

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
  };

  useEffect(() => () => clearTimers(), []);

  /* Swap drafts when Workspace mode changes — never merge feedback into document text. */
  useLayoutEffect(() => {
    if (!isWorkspace) {
      modeRef.current = mode;
      return;
    }
    const prev = modeRef.current;
    if (prev === mode) return;
    drafts.current[prev] = textRef.current;
    modeRef.current = mode;
    const nextText = drafts.current[mode] ?? '';
    setText(nextText);
    setNotice('');
  }, [mode, isWorkspace]);

  useLayoutEffect(() => {
    if (!focusToken || focusToken === lastFocus.current) return;
    lastFocus.current = focusToken;
    if (!isWorkspace || !composerActive) return;
    input.current?.focus({ preventScroll: true });
  }, [focusToken, isWorkspace, composerActive]);

  const contentMax = useCallback((): number => {
    const editor = input.current;
    if (!editor) return CONTENT_MAX_PX;
    return parseFloat(getComputedStyle(editor).maxHeight) || CONTENT_MAX_PX;
  }, []);

  const measureEmptyHeight = useCallback((): number => {
    const editor = input.current;
    if (!editor) return EMPTY_MIN_PX;
    const prev = editor.style.height;
    const prevTransition = editor.style.transition;
    const prevValue = editor.value;
    editor.style.transition = 'none';
    editor.value = '';
    editor.style.height = 'auto';
    const h = Math.max(editor.scrollHeight, EMPTY_MIN_PX);
    editor.value = prevValue;
    editor.style.height = prev;
    editor.style.transition = prevTransition;
    return h;
  }, []);

  /** Measure height for the editor’s current value (controlled text is source of truth). */
  const measureContentHeight = useCallback((): number => {
    const editor = input.current;
    if (!editor) return EMPTY_MIN_PX;
    if (!editor.value) {
      return emptyHeight.current ?? measureEmptyHeight();
    }
    const prev = editor.style.height;
    const prevTransition = editor.style.transition;
    editor.style.transition = 'none';
    editor.style.height = 'auto';
    const h = Math.min(Math.max(editor.scrollHeight, EMPTY_MIN_PX), contentMax());
    editor.style.height = prev;
    editor.style.transition = prevTransition;
    return h;
  }, [measureEmptyHeight, contentMax]);

  const captureEmptyBaseline = useCallback(() => {
    if (text !== '' || settling.current || collapsing) return;
    emptyHeight.current = measureEmptyHeight();
  }, [text, measureEmptyHeight, collapsing]);

  useLayoutEffect(() => {
    captureEmptyBaseline();
  }, [captureEmptyBaseline]);

  const applyContentHeight = useCallback(
    (height: number, overflowScroll: boolean) => {
      const editor = input.current;
      if (!editor) return;
      editor.style.transition = 'none';
      editor.style.height = `${height}px`;
      editor.style.overflow = overflowScroll ? 'auto' : '';
      editor.style.overflowY = overflowScroll ? 'auto' : '';
    },
    [],
  );

  /** Sync textarea height to controlled value. Optional upward expand for demo restore. */
  const syncHeightToValue = useCallback(
    (animate: boolean) => {
      const editor = input.current;
      if (!editor || settling.current) return;

      const to = measureContentHeight();
      const from = editor.offsetHeight;
      const needsScroll = to >= contentMax() - 0.5 && editor.value.length > 0;

      if (!animate || prefersReducedMotion() || Math.abs(from - to) < 2) {
        applyContentHeight(to, needsScroll);
        return;
      }

      settling.current = true;
      editor.style.overflow = 'hidden';
      editor.style.overflowY = 'hidden';
      editor.style.transition = 'none';
      editor.style.height = `${from}px`;
      const gen = actionGen.current;
      const start = performance.now();

      const tick = (now: number) => {
        if (!input.current || gen !== actionGen.current) {
          settling.current = false;
          return;
        }
        const t = Math.min(1, (now - start) / RESTORE_EXPAND_MS);
        const h = from + (to - from) * collapseEase(t);
        input.current.style.height = `${h}px`;
        if (t < 1) {
          raf.current = requestAnimationFrame(tick);
        } else {
          applyContentHeight(to, needsScroll);
          settling.current = false;
          raf.current = 0;
        }
      };

      raf.current = requestAnimationFrame(tick);
    },
    [measureContentHeight, contentMax, applyContentHeight],
  );

  const resizeForContent = useCallback(() => {
    syncHeightToValue(false);
  }, [syncHeightToValue]);

  const finishCollapseChrome = useCallback(() => {
    const editor = input.current;
    if (!editor) return;
    const to = emptyHeight.current ?? EMPTY_MIN_PX;
    editor.style.transition = '';
    editor.style.height = `${to}px`;
    editor.style.overflow = '';
    editor.style.overflowY = '';
    editor.scrollTop = 0;
    settling.current = false;
  }, []);

  const clearTextNow = useCallback(() => {
    setText('');
    setNotice('');
  }, []);

  const snapToBaseline = useCallback(() => {
    const editor = input.current;
    if (!editor) return;
    const to = emptyHeight.current ?? measureEmptyHeight();
    emptyHeight.current = to;
    editor.style.transition = 'none';
    editor.style.height = `${to}px`;
    editor.style.overflow = 'hidden';
    editor.style.overflowY = 'hidden';
    editor.scrollTop = 0;
  }, [measureEmptyHeight]);

  const collapseThenClear = useCallback(
    (animate: boolean) => {
      const editor = input.current;
      if (!editor) return;

      const gen = actionGen.current;
      const from = editor.offsetHeight;
      const to = emptyHeight.current ?? measureEmptyHeight();
      emptyHeight.current = to;

      editor.style.overflow = 'hidden';
      editor.style.overflowY = 'hidden';
      editor.scrollTop = 0;
      editor.style.transition = 'none';

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (raf.current) {
          cancelAnimationFrame(raf.current);
          raf.current = 0;
        }
        /* Stale after New Check / newer submit — do not clear restored text. */
        if (gen !== actionGen.current) {
          settling.current = false;
          setCollapsing(false);
          return;
        }
        clearTextNow();
        finishCollapseChrome();
        setCollapsing(false);
      };

      if (!animate || prefersReducedMotion() || Math.abs(from - to) < 2) {
        editor.style.height = `${to}px`;
        settling.current = false;
        if (!animate || prefersReducedMotion()) {
          finish();
          return;
        }
        timers.current.push(window.setTimeout(finish, HEIGHT_COLLAPSE_MS));
        return;
      }

      settling.current = true;
      editor.style.height = `${from}px`;
      const start = performance.now();

      const tick = (now: number) => {
        if (done || !input.current) return;
        if (gen !== actionGen.current) {
          done = true;
          settling.current = false;
          setCollapsing(false);
          return;
        }
        const t = Math.min(1, (now - start) / HEIGHT_COLLAPSE_MS);
        const h = from + (to - from) * collapseEase(t);
        input.current.style.height = `${h}px`;
        if (t < 1) {
          raf.current = requestAnimationFrame(tick);
        } else {
          finish();
        }
      };

      raf.current = requestAnimationFrame(tick);
      timers.current.push(window.setTimeout(finish, HEIGHT_COLLAPSE_MS + 32));
    },
    [measureEmptyHeight, clearTextNow, finishCollapseChrome],
  );

  /*
    External reset (header New Check).
    Restore demo prefill when landing; expand to content height — never snapToBaseline
    after restoring sample text (that was the V21.1 height/jump bug).
  */
  useLayoutEffect(() => {
    if (!resetToken || resetToken === lastReset.current) return;
    lastReset.current = resetToken;
    actionGen.current += 1;
    clearTimers();
    settling.current = false;
    setCollapsing(false);
    drafts.current = { 'new-check': '', feedback: '' };
    modeRef.current = 'new-check';
    const restore = initialText && !isWorkspace ? initialText : '';
    pendingExpand.current = Boolean(restore) && !prefersReducedMotion();
    setText(restore);
    setNotice('');
    if (!restore) {
      pendingExpand.current = false;
      const to = emptyHeight.current ?? EMPTY_MIN_PX;
      const editor = input.current;
      if (editor) {
        editor.style.transition = 'none';
        editor.style.height = `${to}px`;
        editor.style.overflow = '';
        editor.style.overflowY = '';
      }
    }
  }, [resetToken, initialText, isWorkspace]);

  useLayoutEffect(() => {
    if (isWorkspace) return;
    setNotice('');
  }, [isWorkspace]);

  /* Controlled value → textarea height (typing, paste, demo prefill, restore). */
  useLayoutEffect(() => {
    if (settling.current || collapsing) return;
    if (text === '') {
      captureEmptyBaseline();
      const editor = input.current;
      if (editor && !settling.current) {
        const to = emptyHeight.current ?? EMPTY_MIN_PX;
        editor.style.transition = 'none';
        editor.style.height = `${to}px`;
        editor.style.overflow = '';
        editor.style.overflowY = '';
      }
      return;
    }
    const animate = pendingExpand.current;
    pendingExpand.current = false;
    syncHeightToValue(animate);
  }, [text, syncHeightToValue, captureEmptyBaseline, collapsing]);

  useLayoutEffect(() => {
    let scrollFrame = 0;
    const viewportChanged = () => {
      if (!settling.current && !collapsing) resizeForContent();
      cancelAnimationFrame(scrollFrame);
      if (document.activeElement === input.current && matchMedia('(max-width: 760px)').matches) {
        scrollFrame = requestAnimationFrame(() =>
          input.current?.closest('section')?.scrollIntoView({ block: 'end' }),
        );
      }
    };
    window.addEventListener('resize', viewportChanged);
    window.addEventListener('composer-budget-change', viewportChanged);
    window.visualViewport?.addEventListener('resize', viewportChanged);
    return () => {
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener('resize', viewportChanged);
      window.removeEventListener('composer-budget-change', viewportChanged);
      window.visualViewport?.removeEventListener('resize', viewportChanged);
    };
  }, [resizeForContent, collapsing]);

  const submitNewCheck = (payload: string) => {
    setNotice('');
    actionGen.current += 1;
    clearTimers();
    input.current?.blur();
    setCollapsing(true);
    drafts.current['new-check'] = '';

    if (prefersReducedMotion()) {
      snapToBaseline();
      clearTextNow();
      finishCollapseChrome();
      setCollapsing(false);
      onSubmitNewCheck?.(payload);
      return;
    }

    collapseThenClear(true);
    onSubmitNewCheck?.(payload);
  };

  const saveFeedbackDraft = (payload: string) => {
    try {
      sessionStorage.setItem(
        FEEDBACK_DRAFT_STORAGE_KEY,
        JSON.stringify({ text: payload, savedAt: Date.now() }),
      );
    } catch {
      /* Storage may be unavailable — still confirm local-only intent. */
    }
    drafts.current.feedback = payload;
    setNotice('Draft saved in this browser tab. Not sent to Integrito.');
  };

  const submit = () => {
    if (locked) return;

    if (isWorkspace && isFeedback) {
      if (!text.trim()) {
        setNotice('Write a short note about what seems incorrect.');
        input.current?.focus();
        return;
      }
      saveFeedbackDraft(text);
      return;
    }

    if (!text.trim()) {
      setNotice('Paste some text to get started.');
      input.current?.focus();
      return;
    }

    const words = countWords(text);
    if (isOverDetectionWordLimit(words)) {
      setNotice(overLimitMessage);
      input.current?.focus();
      return;
    }

    if (isWorkspace) {
      submitNewCheck(text);
      return;
    }

    /* Landing */
    const payload = text;
    setNotice('');
    actionGen.current += 1;
    clearTimers();
    input.current?.blur();
    setCollapsing(true);

    if (prefersReducedMotion()) {
      snapToBaseline();
      clearTextNow();
      finishCollapseChrome();
      setCollapsing(false);
      onSubmit?.(payload);
      return;
    }

    collapseThenClear(true);
    onSubmit?.(payload);
  };

  const paste = async () => {
    if (locked || isFeedback) return;
    try {
      const value = await navigator.clipboard.readText();
      if (value) {
        /* Detection: keep full paste — never truncate to a character cap. */
        setText(value);
        const words = countWords(value);
        setNotice(
          isOverDetectionWordLimit(words)
            ? overLimitMessage
            : '',
        );
      } else setNotice('Your clipboard is empty.');
    } catch {
      setNotice('Use Ctrl+V or ⌘V to paste into the text field.');
    }
    input.current?.focus();
  };

  const fieldId = isWorkspace ? 'workspace-composer' : 'detector-text';
  const noticeId = isWorkspace ? 'workspace-notice' : 'input-notice';
  const modeLabelId = 'composer-mode-label';
  const feedbackLimitLabel = FEEDBACK_CHAR_LIMIT.toLocaleString();
  const detectDisabled = locked || overWordLimit || submitting || collapsing;

  const placeholder = !isWorkspace
    ? 'Paste your text to check for AI…'
    : !composerActive
      ? 'Follow-up messages arrive in a later preview…'
      : isFeedback
        ? 'Tell us what seems incorrect about this result…'
        : 'Paste another text to check for AI…';

  const statusCopy = overWordLimit
    ? overLimitMessage
    : notice ||
      (isWorkspace
        ? 'Your text stays in this browser preview.'
        : 'Your words stay in your browser in this preview.');

  return (
    <section
      className={`input-section${isWorkspace ? ' input-section--workspace' : ''}${
        isWorkspace && composerActive ? ' input-section--active' : ''
      }`}
      aria-label={
        isWorkspace
          ? isFeedback
            ? 'Feedback composer'
            : 'New check composer'
          : 'Check text for AI'
      }
    >
      <div
        className={`input-heading${isWorkspace ? ' input-heading--ghost' : ''}`}
        aria-hidden={isWorkspace || undefined}
      >
        <label htmlFor={isWorkspace ? undefined : fieldId}>
          A clearer picture starts with your text.
        </label>
      </div>
      <form
        className="prompt"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          id={fieldId}
          ref={input}
          className={collapsing ? 'is-collapsing' : undefined}
          value={text}
          rows={2}
          maxLength={isFeedback ? FEEDBACK_CHAR_LIMIT : undefined}
          placeholder={placeholder}
          onChange={e => {
            if (locked) return;
            const next = isFeedback
              ? e.target.value.slice(0, FEEDBACK_CHAR_LIMIT)
              : e.target.value;
            setText(next);
            /* Clear sticky notices on edit; over-limit message is derived below. */
            if (notice) setNotice('');
          }}
          onKeyDown={e => {
            if (locked) return;
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          aria-invalid={overWordLimit || undefined}
          aria-describedby={[
            noticeId,
            isWorkspace && composerActive ? modeLabelId : '',
            !isFeedback ? pageEstimateId : '',
          ]
            .filter(Boolean)
            .join(' ')}
          readOnly={locked}
          aria-readonly={locked || undefined}
        />
        <div className="prompt-toolbar">
          <div className="input-tools">
            {isWorkspace && composerActive && (
              <span id={modeLabelId} className="composer-mode-label" aria-live="polite">
                {isFeedback ? 'Feedback' : 'New check'}
              </span>
            )}
            <button
              type="button"
              className={`paste-button${
                isWorkspace && composerActive && !isFeedback ? ' composer-tool-divided' : ''
              }`}
              onClick={paste}
              disabled={locked || isFeedback}
              hidden={isFeedback}
              title={
                isWorkspace && !composerActive
                  ? 'Composer unlocks after the result is ready'
                  : undefined
              }
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="5" y="5" width="10" height="12" rx="1.5" />
                <path d="M7 5V3h6v2M8 9h4m-4 3h4" />
              </svg>
              Paste text
            </button>
            {isFeedback ? (
              <span
                className="character-count composer-tool-divided"
                aria-label={`${text.length.toLocaleString()} of ${feedbackLimitLabel} characters`}
              >
                {text.length.toLocaleString()} /{' '}
                <span className="counter-limit">{feedbackLimitLabel}</span>
                <span className="counter-label"> characters</span>
              </span>
            ) : (
              <>
                <span
                  className={`character-count composer-tool-divided${
                    overWordLimit ? ' is-over-limit' : ''
                  }`}
                  aria-label={`${wordCount.toLocaleString()} of ${detectionLimitLabel} words, ${formatPageEstimate(pageEstimate)}`}
                >
                  <span className="composer-count-words">
                    {wordCount.toLocaleString()} /{' '}
                    <span className="counter-limit">{detectionLimitLabel}</span>
                    <span className="counter-label"> words</span>
                  </span>
                  <span className="composer-count-sep" aria-hidden="true">
                    {' '}
                    ·{' '}
                  </span>
                  <span className="page-estimate" title={PAGE_ESTIMATE_HINT}>
                    {formatPageEstimate(pageEstimate)}
                  </span>
                </span>
                <span id={pageEstimateId} className="sr-only">
                  {PAGE_ESTIMATE_HINT}
                </span>
              </>
            )}
            {(!isWorkspace || (composerActive && !isFeedback)) && text && !collapsing && (
              <button
                type="button"
                className="clear-button"
                onClick={() => {
                  if (locked) return;
                  setText('');
                  setNotice('');
                  input.current?.focus();
                }}
                disabled={locked}
              >
                Clear
              </button>
            )}
          </div>
          {!isWorkspace ? (
            <button
              type="submit"
              className="detect-button"
              disabled={detectDisabled}
              title={overWordLimit ? overLimitMessage : undefined}
            >
              Detect AI <span aria-hidden="true">↗</span>
            </button>
          ) : !composerActive ? (
            <button
              type="button"
              className="detect-button detect-button--idle"
              disabled
              title="Composer unlocks after the result is ready"
            >
              Coming soon
            </button>
          ) : isFeedback ? (
            <button type="submit" className="detect-button" disabled={locked}>
              Save draft
            </button>
          ) : (
            <button
              type="submit"
              className="detect-button"
              disabled={detectDisabled}
              title={overWordLimit ? overLimitMessage : undefined}
            >
              Detect AI <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </form>
      <div className="input-footnote">
        <span id={noticeId} role="status" aria-live="polite">
          {statusCopy}
        </span>
        <span
          className={`shortcut${isWorkspace && !composerActive ? ' input-heading--ghost' : ''}`}
          aria-hidden={isWorkspace && !composerActive ? true : undefined}
        >
          ⌘ / Ctrl + Enter
        </span>
      </div>
    </section>
  );
}

export const COMPOSER_HEIGHT_COLLAPSE_MS = HEIGHT_COLLAPSE_MS;
/** Document reveal after collapse + clear (keeps overall Pure Fade at 1000ms). */
export const COMPOSER_DOCUMENT_REVEAL_MS = 650;
