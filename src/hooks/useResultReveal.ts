import { useLayoutEffect, useRef, useState } from 'react';

export const RESULT_REVEAL_MS = 1500;

/** Approximate cubic-bezier(0.22, 1, 0.36, 1). */
export function revealEase(t: number): number {
  const p = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - p, 3.6);
}

function prefersReducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

type Options = {
  /** When true, animate progress 0 → 1 over RESULT_REVEAL_MS. */
  active: boolean;
  durationMs?: number;
};

/**
 * Single source of truth for V20 result reveal progress.
 * Local rAF only — does not thrash the rest of the tree.
 */
export function useResultReveal({ active, durationMs = RESULT_REVEAL_MS }: Options) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useLayoutEffect(() => {
    cancelAnimationFrame(frame.current);

    /* Inactive: cancel rAF but keep last progress (avoids a 0 flash at complete). */
    if (!active) {
      return;
    }

    if (prefersReducedMotion()) {
      setProgress(1);
      return;
    }

    setProgress(0);
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setProgress(revealEase(t));
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setProgress(1);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [active, durationMs]);

  return {
    progress,
    complete: progress >= 1 - 1e-6,
  };
}
