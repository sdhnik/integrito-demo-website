import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import DocumentWorkspace from './DocumentWorkspace';
import type { DocumentBodyHandle } from './DocumentBody';
import IntegritoMessage, { type IntegritoPhase } from './IntegritoMessage';
import {
  buildExportFilename,
  createDetectionPdf,
  downloadPdfBlob,
} from '../../features/pdfExport';
import { runDemoDetection } from '../../services/demoDetection';
import { useResultReveal } from '../../hooks/useResultReveal';
import { useWorkspaceHeightCompact } from '../../hooks/useWorkspaceHeightCompact';
import type { DetectionReport } from '../../types/detection';

export type ComposerInteractionState = {
  /** True when the Workspace Composer may accept input. */
  active: boolean;
  /** True when a matching detection report is available (Feedback allowed). */
  hasReport: boolean;
};

type Props = {
  text: string;
  /**
   * Increments on every Detect AI submission (Landing or in-Workspace)
   * so repeated checks of identical text still restart processing.
   */
  checkId?: number;
  /**
   * When true, the Landing→Workspace transition has settled and the demo
   * timer may start. Processing UI can still render before this is true.
   */
  ready?: boolean;
  /** Document visible after composer settle (or immediately when reduced-motion). */
  documentRevealed?: boolean;
  /**
   * Development-only (?demo=1): allow returning the sample fixture when the
   * submitted document exactly matches SAMPLE_DOCUMENT_TEXT.
   */
  allowSampleFixture?: boolean;
  onComposerStateChange?: (state: ComposerInteractionState) => void;
  onGiveFeedback?: () => void;
  onCheckAnotherText?: () => void;
};

const RESULT_HEIGHT_MS = 350;
const EXPORT_NOTICE_CLEAR_MS = 3500;

function prefersReducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export default function ChatWorkspace({
  text,
  checkId = 0,
  ready = false,
  documentRevealed = true,
  allowSampleFixture = false,
  onComposerStateChange,
  onGiveFeedback,
  onCheckAnotherText,
}: Props) {
  const [phase, setPhase] = useState<IntegritoPhase>('processing');
  const [report, setReport] = useState<DetectionReport | null>(null);
  const [highlightsVisible, setHighlightsVisible] = useState(true);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const resultShell = useRef<HTMLDivElement>(null);
  const resultInner = useRef<HTMLDivElement>(null);
  const resultHeight = useRef(0);
  const documentBody = useRef<DocumentBodyHandle>(null);
  const exportAlive = useRef(true);
  const exportNoticeTimer = useRef<number | null>(null);
  const heightCompact = useWorkspaceHeightCompact();
  /* Soft + tight: collapse chips so short phones / short desktops keep document height. */
  const compactActions = heightCompact === 'tight' || heightCompact === 'soft';

  const revealing = phase === 'revealing' || phase === 'complete';
  const { progress: revealProgress, complete: revealComplete } = useResultReveal({
    active: phase === 'revealing' && ready,
  });

  useEffect(() => {
    exportAlive.current = true;
    return () => {
      exportAlive.current = false;
      if (exportNoticeTimer.current != null) {
        window.clearTimeout(exportNoticeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase === 'revealing' && revealComplete) {
      setPhase('complete');
    }
  }, [phase, revealComplete]);

  useEffect(() => {
    setPhase('processing');
    setReport(null);
    setHighlightsVisible(true);
    setExplanationOpen(false);
    setExportBusy(false);
    setExportNotice('');
    if (exportNoticeTimer.current != null) {
      window.clearTimeout(exportNoticeTimer.current);
      exportNoticeTimer.current = null;
    }
  }, [text, checkId]);

  useEffect(() => {
    const active = phase === 'complete' || phase === 'preview-complete';
    const hasReport = phase === 'complete' && report != null;
    onComposerStateChange?.({ active, hasReport });
  }, [phase, report, onComposerStateChange]);

  useLayoutEffect(() => {
    const page = document.querySelector<HTMLElement>('.page');
    const chat = document.querySelector<HTMLElement>('.chat-workspace');
    const section = document.querySelector<HTMLElement>('.input-section');
    const prompt = section?.querySelector<HTMLElement>('.prompt');
    const editor = section?.querySelector('textarea');
    const layout = chat?.querySelector<HTMLElement>('.workspace-layout');
    const heading = chat?.querySelector<HTMLElement>('.document-workspace-header');
    if (!page || !chat || !section || !prompt || !editor || !layout || !heading) return;
    let frame = 0;
    const update = () => {
      const pageStyle = getComputedStyle(page);
      const chatStyle = getComputedStyle(chat);
      const layoutStyle = getComputedStyle(layout);
      const documentStyle = getComputedStyle(heading.parentElement!);
      const bottom = page.getBoundingClientRect().bottom - parseFloat(pageStyle.paddingBottom);
      const gap = parseFloat(pageStyle.getPropertyValue('--result-composer-gap'));
      const result = resultInner.current?.offsetHeight ?? 0;
      const surfaceMin = parseFloat(pageStyle.getPropertyValue('--document-surface-min'));
      const documentChrome = heading.getBoundingClientRect().height + parseFloat(documentStyle.gap);
      const layoutGap = parseFloat(layoutStyle.gap);
      // Exclude the transparent heading; include the footer below the visible prompt.
      const chrome = section.getBoundingClientRect().bottom - prompt.getBoundingClientRect().top - editor.getBoundingClientRect().height;
      const available = section.getBoundingClientRect().bottom - chat.getBoundingClientRect().top - parseFloat(chatStyle.paddingTop);
      // Aim for 180px in tight mode; permit a small reduction before scrolling.
      const surfaceBudget = available - result - layoutGap - gap - chrome - 48 - documentChrome;
      const usableSurface = heightCompact === 'tight' ? Math.max(160, Math.min(surfaceMin, surfaceBudget)) : surfaceMin;
      const stackMin = documentChrome + usableSurface + layoutGap + result;
      page.style.setProperty('--document-surface-floor', `${usableSurface}px`);
      const cap = Math.max(48, Math.min(144, Math.floor(available - stackMin - gap - chrome)));
      const capValue = `${cap}px`;
      if (page.style.getPropertyValue('--composer-textarea-max') !== capValue) {
        page.style.setProperty('--composer-textarea-max', capValue);
        window.dispatchEvent(new Event('composer-budget-change'));
      }
      // The scroll region ends above the visible prompt; fallback content never sits behind it.
      const clearance = bottom - prompt.getBoundingClientRect().top + gap;
      page.style.setProperty('--composer-clearance', `${clearance}px`);
      layout.style.minHeight = `${stackMin}px`;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    observer.observe(resultInner.current!);
    observer.observe(heading);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      page.style.removeProperty('--composer-clearance');
      page.style.removeProperty('--composer-textarea-max');
      page.style.removeProperty('--document-surface-floor');
    };
  }, [heightCompact]);

  useLayoutEffect(() => {
    const shell = resultShell.current;
    const inner = resultInner.current;
    if (!shell || !inner) return;

    const apply = () => {
      /*
        Use offsetHeight (in-flow) rather than scrollHeight. Absolute overlays
        (compact Actions menu / explanation) must not inflate the shell and
        steal document height on short viewports.
      */
      const next = Math.ceil(inner.offsetHeight);
      if (next <= 0) return;
      const reduce = prefersReducedMotion();
      if (!resultHeight.current || reduce) {
        resultHeight.current = next;
        shell.style.transition = 'none';
        shell.style.height = `${next}px`;
        return;
      }
      if (next === resultHeight.current) return;
      shell.style.transition = `height ${RESULT_HEIGHT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      shell.style.height = `${resultHeight.current}px`;
      void shell.offsetHeight;
      resultHeight.current = next;
      shell.style.height = `${next}px`;
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [phase, report, explanationOpen, exportBusy, heightCompact, compactActions]);

  useEffect(() => {
    if (!ready) return;

    const controller = new AbortController();
    let cancelled = false;

    runDemoDetection(
      { text },
      { signal: controller.signal, allowSampleFixture },
    )
      .then(result => {
        if (cancelled) return;
        if (result.kind === 'sample-report') {
          setReport(result.report);
          setPhase('revealing');
          return;
        }
        setReport(null);
        setPhase('preview-complete');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ready, text, checkId, allowSampleFixture]);

  const showExportNotice = useCallback((message: string) => {
    setExportNotice(message);
    if (exportNoticeTimer.current != null) {
      window.clearTimeout(exportNoticeTimer.current);
    }
    exportNoticeTimer.current = window.setTimeout(() => {
      if (exportAlive.current) setExportNotice('');
      exportNoticeTimer.current = null;
    }, EXPORT_NOTICE_CLEAR_MS);
  }, []);

  const handleToggleHighlights = useCallback(() => {
    setHighlightsVisible(visible => !visible);
  }, []);

  const handleToggleExplanation = useCallback(() => {
    setExplanationOpen(open => !open);
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!report || exportBusy) return;

    setExportBusy(true);
    setExportNotice('');
    try {
      const generatedAt = new Date();
      const blob = await createDetectionPdf({
        documentText: text,
        report,
        generatedAt,
      });
      if (!exportAlive.current) return;
      downloadPdfBlob(blob, buildExportFilename(generatedAt));
      showExportNotice('PDF download started.');
    } catch {
      if (!exportAlive.current) return;
      showExportNotice('PDF could not be generated. Please try again.');
    } finally {
      if (exportAlive.current) setExportBusy(false);
    }
  }, [report, exportBusy, text, showExportNotice]);

  const highlightProgress =
    phase === 'complete' ? 1 : phase === 'revealing' ? revealProgress : 0;
  const activeHighlights =
    report && revealing ? report.highlights : [];
  const actionsReady = phase === 'complete';
  const canExport = actionsReady && report != null;

  return (
    <section className="chat-workspace" aria-label="Document workspace">
      <div className="workspace-layout">
        <div className="workspace-document">
          <DocumentWorkspace
            ref={documentBody}
            text={text}
            revealed={documentRevealed}
            highlights={activeHighlights}
            revealProgress={highlightProgress}
            highlightsVisible={highlightsVisible}
          />
        </div>
        <div className="workspace-result" ref={resultShell}>
          <div className="workspace-result-inner" ref={resultInner}>
            <IntegritoMessage
              phase={phase}
              report={report}
              revealProgress={phase === 'complete' ? 1 : revealProgress}
              highlightsVisible={highlightsVisible}
              onToggleHighlights={handleToggleHighlights}
              explanationOpen={explanationOpen}
              onToggleExplanation={handleToggleExplanation}
              onGiveFeedback={actionsReady ? onGiveFeedback : undefined}
              onCheckAnotherText={actionsReady ? onCheckAnotherText : undefined}
              onExportPdf={canExport ? handleExportPdf : undefined}
              exportBusy={exportBusy}
              exportNotice={exportNotice}
              compactActions={compactActions}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
