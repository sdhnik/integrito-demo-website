import { useCallback, useEffect, useRef, useState } from 'react';
import { CURRENT_PRODUCT_ID } from '../../components/header/products';
import { SAMPLE_DOCUMENT_TEXT } from '../../data/sampleDetectionReport';
import { runDemoDetection } from '../../services/demoDetection';
import { countWords, isOverDetectionWordLimit } from '../../utils/textMetrics';
import ClassicResultPanel, { type ResultState } from './ClassicResultPanel';
import ClassicTextInput, { type InputMode } from './ClassicTextInput';

type Props = {
  productId: string;
  demoMode: boolean;
  /** Increment to hard-reset local detector state (New Check). */
  resetToken?: number;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function ClassicDetector({
  productId,
  demoMode,
  resetToken = 0,
  onDirtyChange,
}: Props) {
  const isTextDetector = productId === CURRENT_PRODUCT_ID;
  const [text, setText] = useState(() => (demoMode ? SAMPLE_DOCUMENT_TEXT : ''));
  const [mode, setMode] = useState<InputMode>('edit');
  const [result, setResult] = useState<ResultState>({ kind: 'idle' });
  const [detecting, setDetecting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const lastResetToken = useRef(resetToken);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    setDetecting(false);
    setMode('edit');
    setResult({ kind: 'idle' });
  }, [productId]);

  useEffect(() => {
    if (resetToken === lastResetToken.current) return;
    lastResetToken.current = resetToken;
    abortRef.current?.abort();
    setDetecting(false);
    setText('');
    setMode('edit');
    setResult({ kind: 'idle' });
  }, [resetToken]);

  useEffect(() => {
    const dirty = /\S/.test(text) || result.kind !== 'idle' || detecting;
    onDirtyChange?.(dirty);
  }, [text, result.kind, detecting, onDirtyChange]);

  const onChange = useCallback((value: string) => {
    setText(value);
    setResult(prev => (prev.kind === 'idle' ? prev : { kind: 'idle' }));
    setMode('edit');
  }, []);

  const onEdit = useCallback(() => {
    setMode('edit');
    setResult({ kind: 'idle' });
  }, []);

  const onDetect = useCallback(async () => {
    const words = countWords(text);
    if (!/\S/.test(text) || isOverDetectionWordLimit(words) || detecting) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setDetecting(true);
    setResult({ kind: 'analyzing' });

    try {
      const outcome = await runDemoDetection(
        { text },
        {
          signal: controller.signal,
          delayMs: 850,
          allowSampleFixture: demoMode,
        },
      );
      if (outcome.kind === 'sample-report') {
        setResult({ kind: 'demo-report', report: outcome.report });
        setMode('highlighted');
      } else {
        setResult({ kind: 'unavailable' });
        setMode('edit');
      }

      if (window.matchMedia('(max-width: 900px)').matches) {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setResult({ kind: 'unavailable' });
    } finally {
      setDetecting(false);
    }
  }, [text, detecting, demoMode]);

  if (productId === 'ai-image-detector') {
    return (
      <div className="classic-detector classic-detector--preview">
        <div className="classic-preview">
          <p className="classic-preview-eyebrow">Concept preview</p>
          <h2 className="classic-preview-title">AI Image Detector</h2>
          <div className="classic-upload-zone" role="group" aria-label="Image upload concept">
            <p className="classic-upload-title">Drop an image here</p>
            <p className="classic-upload-body">or choose a file to examine</p>
            <button type="button" className="header-signup" disabled>
              Choose image
            </button>
          </div>
          <p className="classic-preview-note" role="note">
            Live image analysis is unavailable in this Classic prototype. No image detection scores
            are invented.
          </p>
        </div>
      </div>
    );
  }

  if (productId === 'plagiarism-checker') {
    return (
      <div className="classic-detector classic-detector--preview">
        <div className="classic-preview">
          <p className="classic-preview-eyebrow">Concept preview</p>
          <h2 className="classic-preview-title">Plagiarism Checker</h2>
          <textarea
            className="classic-textarea classic-preview-textarea"
            placeholder="Paste text to explore originality checking…"
            rows={8}
            readOnly
            aria-disabled="true"
          />
          <p className="classic-preview-note" role="note">
            Live plagiarism checking is unavailable in this Classic prototype. No originality
            percentages are fabricated.
          </p>
        </div>
      </div>
    );
  }

  if (!isTextDetector) return null;

  return (
    <div className="classic-detector" role="region" aria-label="AI Text Detector">
      <ClassicTextInput
        text={text}
        onChange={onChange}
        mode={mode}
        report={result.kind === 'demo-report' ? result.report : null}
        onEdit={onEdit}
        onDetect={onDetect}
        detecting={detecting}
      />
      <div
        className="classic-result-wrap"
        ref={el => {
          resultRef.current = el;
        }}
      >
        <ClassicResultPanel state={result} />
      </div>
    </div>
  );
}
