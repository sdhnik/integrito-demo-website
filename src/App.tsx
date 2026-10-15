import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import LandingBelowHero from './components/landing/LandingBelowHero';
import PromptInput, { COMPOSER_HEIGHT_COLLAPSE_MS } from './components/PromptInput';
import DesignPlayground from './components/DesignPlayground';
import ButtonShowcase from './components/ButtonShowcase';
import GenerativeCanvas, { initialSettings } from './components/GenerativeCanvas';
import ChatWorkspace from './components/ChatWorkspace/ChatWorkspace';
import type { Theme } from './components/ThemeSwitcher';
import { SAMPLE_DOCUMENT_TEXT } from './data/sampleDetectionReport';
import type { ComposerMode } from './types/composer';

function scrollWindowToTop(behavior: ScrollBehavior = 'auto') {
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch {
    window.scrollTo(0, 0);
  }
}

type View = 'landing' | 'workspace';
type Transition = 'none' | 'to-workspace' | 'to-landing';

/** Master bidirectional crossfade (CSS tokens must match). */
const TRANSITION_MS = 1000;

/** Forward: mount Workspace after V19.5 composer collapse so layout can settle at opacity 0. */
const WORKSPACE_MOUNT_MS = COMPOSER_HEIGHT_COLLAPSE_MS;
/** Forward: Workspace layer fade-in window (600 → 1000). */
const WORKSPACE_IN_DELAY_MS = 600;
const WORKSPACE_IN_MS = 400;

/** Reverse: Workspace exit fade. */
const WORKSPACE_OUT_MS = 400;
/** Reverse: Landing / spiral fade-in (350 → 1000). */
const LANDING_IN_DELAY_MS = 350;
const LANDING_IN_MS = 650;

function prefersReducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function readDemoMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('integrito-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [settings, setSettings] = useState(initialSettings);
  const [modal, setModal] = useState<'about' | 'preview' | null>(null);
  const [view, setView] = useState<View>('landing');
  const [transition, setTransition] = useState<Transition>('none');
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [checkId, setCheckId] = useState(0);
  const [spiralAlive, setSpiralAlive] = useState(true);
  /** Workspace DOM mounted (may be opacity 0 while settling). */
  const [workspaceMounted, setWorkspaceMounted] = useState(false);
  /** Workspace visual opacity target — drives CSS opacity transition. */
  const [workspaceOpaque, setWorkspaceOpaque] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [composerMode, setComposerMode] = useState<ComposerMode>('new-check');
  const [composerActive, setComposerActive] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  /** Presentation demo (?demo=1): sample fixture only when text matches exactly. */
  const [demoMode] = useState(readDemoMode);
  const dialog = useRef<HTMLDialogElement>(null);
  const timers = useRef<number[]>([]);
  /** Holds submitted text from Detect AI until Workspace mounts. */
  const pendingDocument = useRef<string | null>(null);
  const busy = transition !== 'none';

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'light' ? '#F8F8F6' : '#0C0D10',
    );
    try {
      localStorage.setItem('integrito-theme', theme);
    } catch {
      /* Storage is optional. */
    }
  }, [theme]);

  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);

  useEffect(() => {
    document.documentElement.dataset.appView = view;
    document.documentElement.dataset.appTransition = transition;
  }, [view, transition]);

  useEffect(() => {
    if (view !== 'workspace' || transition !== 'none') return;
    const target = document.querySelector<HTMLElement>('.start-over-button.is-visible');
    target?.focus({ preventScroll: true });
  }, [view, transition]);

  const bumpReset = useCallback(() => {
    setResetToken(n => n + 1);
    setComposerMode('new-check');
    setComposerActive(false);
  }, []);

  const handleDetect = useCallback(
    (text: string) => {
      if (busy || view !== 'landing') return;
      const trimmed = text.trim();
      if (!trimmed) return;

      pendingDocument.current = text;
      setComposerMode('new-check');
      setComposerActive(false);

      if (prefersReducedMotion()) {
        setDocumentText(text);
        setCheckId(id => id + 1);
        setSpiralAlive(false);
        setView('workspace');
        setWorkspaceMounted(true);
        setWorkspaceOpaque(true);
        setTransition('none');
        return;
      }

      clearTimers();
      setWorkspaceOpaque(false);
      setWorkspaceMounted(false);
      setDocumentText(null);
      setTransition('to-workspace');

      timers.current.push(
        window.setTimeout(() => {
          setDocumentText(pendingDocument.current);
          setCheckId(id => id + 1);
          setWorkspaceMounted(true);
          setWorkspaceOpaque(false);
        }, WORKSPACE_MOUNT_MS),
      );
      timers.current.push(
        window.setTimeout(() => {
          setWorkspaceOpaque(true);
        }, WORKSPACE_IN_DELAY_MS),
      );
      timers.current.push(
        window.setTimeout(() => {
          setSpiralAlive(false);
          setView('workspace');
          setTransition('none');
          setDocumentText(pendingDocument.current);
          setWorkspaceMounted(true);
          setWorkspaceOpaque(true);
        }, TRANSITION_MS),
      );
    },
    [busy, view],
  );

  /** In-Workspace New Check — no Landing navigation, no spiral remount. */
  const handleWorkspaceDetect = useCallback(
    (text: string) => {
      if (busy || view !== 'workspace' || !composerActive) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      setComposerMode('new-check');
      setComposerActive(false);
      setDocumentText(text);
      setCheckId(id => id + 1);
    },
    [busy, view, composerActive],
  );

  const composerModeRef = useRef(composerMode);
  composerModeRef.current = composerMode;

  const handleComposerStateChange = useCallback((state: { active: boolean; hasReport: boolean }) => {
    setComposerActive(state.active);
    if (!state.hasReport && composerModeRef.current === 'feedback') {
      setComposerMode('new-check');
    }
  }, []);

  const handleGiveFeedback = useCallback(() => {
    setComposerMode('feedback');
    setFocusToken(n => n + 1);
  }, []);

  const handleCheckAnotherText = useCallback(() => {
    setComposerMode('new-check');
    setFocusToken(n => n + 1);
  }, []);

  const handleNewCheck = useCallback(() => {
    if (busy || view !== 'workspace') return;

    clearTimers();
    pendingDocument.current = null;

    if (prefersReducedMotion()) {
      setWorkspaceOpaque(false);
      setWorkspaceMounted(false);
      setDocumentText(null);
      setView('landing');
      setSpiralAlive(true);
      setTransition('none');
      bumpReset();
      return;
    }

    setWorkspaceOpaque(false);
    setTransition('to-landing');
    setSpiralAlive(true);
    setView('landing');
    bumpReset();

    timers.current.push(
      window.setTimeout(() => {
        setWorkspaceMounted(false);
        setDocumentText(null);
        setTransition('none');
      }, TRANSITION_MS),
    );
  }, [busy, view, bumpReset]);

  const playground =
    import.meta.env.DEV || new URLSearchParams(window.location.search).get('playground') === '1';
  const [buttonShowcase, setButtonShowcase] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).get('buttons') === '1',
  );

  const exitingToLanding = transition === 'to-landing';
  const enteringWorkspace = transition === 'to-workspace';

  const showWorkspace =
    workspaceMounted &&
    documentText !== null &&
    (view === 'workspace' || enteringWorkspace || exitingToLanding);

  const showLandingHero =
    view === 'landing' || enteringWorkspace || exitingToLanding;

  /** Composer chrome / New Check during Workspace residency and forward enter. */
  const inWorkspaceChrome = view === 'workspace' || enteringWorkspace;
  const mainWorkspace = showWorkspace || inWorkspaceChrome;

  const landingActive = view === 'landing' && transition === 'none';
  const workspaceActive = view === 'workspace' && transition === 'none';

  const handleTryDetector = useCallback(() => {
    if (!landingActive) return;
    const reduce = prefersReducedMotion();
    scrollWindowToTop(reduce ? 'auto' : 'smooth');

    const focusComposer = () => {
      const field = document.querySelector<HTMLTextAreaElement>('#detector-text');
      field?.focus({ preventScroll: true });
    };

    if (reduce) {
      focusComposer();
      return;
    }

    /* Wait for smooth scroll so the Hero-bound Composer is on-screen. */
    window.setTimeout(focusComposer, 520);
  }, [landingActive]);

  const handleDetectWithScrollReset = useCallback(
    (text: string) => {
      scrollWindowToTop('auto');
      handleDetect(text);
    },
    [handleDetect],
  );

  const handleNewCheckWithScrollReset = useCallback(() => {
    scrollWindowToTop('auto');
    handleNewCheck();
  }, [handleNewCheck]);

  return (
    <>
      <div
        className="page"
        data-view={view}
        data-transition={transition === 'none' ? undefined : transition}
        style={
          {
            ['--exit-ms']: `${TRANSITION_MS}ms`,
            ['--workspace-in-delay']: `${WORKSPACE_IN_DELAY_MS}ms`,
            ['--workspace-in-ms']: `${WORKSPACE_IN_MS}ms`,
            ['--workspace-out-ms']: `${WORKSPACE_OUT_MS}ms`,
            ['--landing-in-delay']: `${LANDING_IN_DELAY_MS}ms`,
            ['--landing-in-ms']: `${LANDING_IN_MS}ms`,
            ['--to-landing-ms']: `${TRANSITION_MS}ms`,
          } as CSSProperties
        }
      >
        <Header
          theme={theme}
          onThemeChange={setTheme}
          showStartOver={inWorkspaceChrome && !busy}
          onStartOver={handleNewCheckWithScrollReset}
        />
        {/*
          First-screen stage: full-bleed Hero clip on Landing, viewport shell
          on Workspace. Shared PromptInput is positioned against this stage so
          Landing scrolls it with the Hero while Workspace keeps it docked.
        */}
        <div className="app-stage">
          {spiralAlive && (
            <div className="spiral-exit-layer" aria-hidden="true">
              <GenerativeCanvas theme={theme} settings={settings} />
            </div>
          )}
          <main className={mainWorkspace ? 'main--workspace' : 'main--landing'}>
            {showLandingHero && (
              <div
                className="landing-hero-layer"
                aria-hidden={!landingActive || undefined}
                {...(!landingActive ? { tabIndex: -1 } : {})}
              >
                <Hero />
              </div>
            )}
            {showWorkspace && documentText !== null && (
              <div
                className={`workspace-layer${workspaceOpaque ? ' is-opaque' : ''}`}
                aria-hidden={!workspaceActive || undefined}
                {...(!workspaceActive ? { tabIndex: -1 } : {})}
              >
                <ChatWorkspace
                  text={documentText}
                  checkId={checkId}
                  ready={workspaceActive}
                  documentRevealed
                  allowSampleFixture={demoMode}
                  onComposerStateChange={handleComposerStateChange}
                  onGiveFeedback={handleGiveFeedback}
                  onCheckAnotherText={handleCheckAnotherText}
                />
              </div>
            )}
          </main>
          <PromptInput
            variant={inWorkspaceChrome ? 'workspace' : 'landing'}
            onSubmit={handleDetectWithScrollReset}
            onSubmitNewCheck={handleWorkspaceDetect}
            submitting={(busy && !inWorkspaceChrome) || (inWorkspaceChrome && !composerActive)}
            resetToken={resetToken}
            initialText={demoMode ? SAMPLE_DOCUMENT_TEXT : undefined}
            mode={composerMode}
            onModeChange={setComposerMode}
            composerActive={inWorkspaceChrome && composerActive && !busy}
            focusToken={focusToken}
          />
        </div>
        {landingActive && (
          <LandingBelowHero theme={theme} onTryDetector={handleTryDetector} />
        )}
      </div>
      {playground && (
        <DesignPlayground
          settings={settings}
          onChange={setSettings}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}
      {buttonShowcase && (
        <ButtonShowcase
          theme={theme}
          onThemeChange={setTheme}
          onClose={() => {
            setButtonShowcase(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('buttons');
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
          }}
        />
      )}
      <dialog
        ref={dialog}
        className="info-dialog"
        onCancel={() => setModal(null)}
        onClick={e => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        <button className="dialog-close" aria-label="Close dialog" onClick={() => setModal(null)}>
          ×
        </button>
        <span className="eyebrow">INTEGRITO / EARLY PREVIEW</span>
        <h2>
          {modal === 'about' ? 'A little more clarity.' : 'The beginning of a clearer picture.'}
        </h2>
        <p>
          {modal === 'about'
            ? 'Integrito is exploring a thoughtful way to identify signs of AI-generated writing. This is a preview of our upcoming AI Text Detector.'
            : 'This design preview isn’t connected to an AI detection service yet. Your text hasn’t been analyzed or sent anywhere.'}
        </p>
        <p className="dialog-note">
          {modal === 'about'
            ? 'Detection can offer signals, not certainty. No detector can establish authorship on its own.'
            : 'Your text is still in the editor. You can keep exploring the experience.'}
        </p>
        <button className="detect-button" onClick={() => setModal(null)}>
          Back to exploring <span aria-hidden="true">↗</span>
        </button>
      </dialog>
    </>
  );
}
