import { useId, useRef } from 'react';
import HighlightedText from '../../components/ChatWorkspace/HighlightedText';
import type { DetectionReport } from '../../types/detection';
import {
  MAX_DETECTION_WORDS,
  countWords,
  estimatePages,
  formatPageEstimate,
  formatWordLabel,
  isOverDetectionWordLimit,
} from '../../utils/textMetrics';

export type InputMode = 'edit' | 'highlighted';

type Props = {
  text: string;
  onChange: (value: string) => void;
  mode: InputMode;
  report: DetectionReport | null;
  onEdit: () => void;
  onDetect: () => void;
  detecting: boolean;
};

export default function ClassicTextInput({
  text,
  onChange,
  mode,
  report,
  onEdit,
  onDetect,
  detecting,
}: Props) {
  const labelId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const wordCount = countWords(text);
  const pages = estimatePages(wordCount);
  const overLimit = isOverDetectionWordLimit(wordCount);
  const empty = !/\S/.test(text);

  const onPaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) onChange(clip);
    } catch {
      /* Clipboard may be blocked; user can paste manually. */
    }
  };

  const onUploadTxt = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <section className="classic-input" aria-labelledby={labelId}>
      <header className="classic-pane-header">
        <h2 id={labelId} className="classic-pane-label">
          Your text
        </h2>
        <p className="classic-pane-meta" aria-live="polite">
          {formatWordLabel(wordCount)}
          <span className="classic-pane-meta-limit">
            {' '}
            / {MAX_DETECTION_WORDS.toLocaleString()}
          </span>
          {wordCount > 0 ? ` · ${formatPageEstimate(pages)}` : ''}
        </p>
      </header>

      <div className="classic-input-body">
        {mode === 'highlighted' && report ? (
          <div className="classic-input-document" tabIndex={0}>
            <HighlightedText text={report.text} highlights={report.highlights} />
          </div>
        ) : (
          <label className="classic-input-label">
            <span className="sr-only">Document text</span>
            <textarea
              className="classic-textarea"
              value={text}
              onChange={e => onChange(e.target.value)}
              placeholder="Paste or write your text here..."
              spellCheck
              rows={14}
            />
          </label>
        )}
      </div>

      <footer className="classic-input-footer">
        <div className="classic-input-footer-left">
          {mode === 'edit' && (
            <>
              <button type="button" className="classic-secondary-btn" onClick={() => void onPaste()}>
                Paste
              </button>
              <button
                type="button"
                className="classic-secondary-btn"
                onClick={() => fileRef.current?.click()}
              >
                Upload .txt
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,text/plain"
                className="sr-only"
                tabIndex={-1}
                onChange={e => {
                  onUploadTxt(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </>
          )}
          {overLimit && (
            <p className="classic-input-error" role="alert">
              Maximum {MAX_DETECTION_WORDS.toLocaleString()} words.
            </p>
          )}
          {mode === 'highlighted' && (
            <button type="button" className="text-button" onClick={onEdit}>
              Edit text
            </button>
          )}
        </div>
        <button
          type="button"
          className="header-signup classic-detect-btn"
          onClick={onDetect}
          disabled={detecting || empty || overLimit || mode === 'highlighted'}
        >
          {detecting ? 'Analyzing…' : 'Detect AI'}
        </button>
      </footer>
    </section>
  );
}
