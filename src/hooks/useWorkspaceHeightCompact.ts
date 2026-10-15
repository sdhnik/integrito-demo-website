import { useEffect, useState } from 'react';

export type WorkspaceHeightCompact = 'none' | 'soft' | 'tight';

const SOFT_MAX = 720;
const TIGHT_MAX = 640;

function readCompact(): WorkspaceHeightCompact {
  try {
    const h = window.visualViewport?.height ?? window.innerHeight;
    if (h <= TIGHT_MAX) return 'tight';
    if (h <= SOFT_MAX) return 'soft';
    return 'none';
  } catch {
    return 'none';
  }
}

/**
 * Height-responsive Workspace compact mode (V22.7.2).
 * Syncs `data-height-compact` on `.page` for CSS + returns mode for React.
 */
export function useWorkspaceHeightCompact(): WorkspaceHeightCompact {
  const [mode, setMode] = useState<WorkspaceHeightCompact>(() =>
    typeof window === 'undefined' ? 'none' : readCompact(),
  );

  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.page');

    const apply = () => {
      const next = readCompact();
      setMode(next);
      if (!page) return;
      page.style.setProperty('--workspace-viewport-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
      if (next === 'none') {
        page.removeAttribute('data-height-compact');
      } else {
        page.setAttribute('data-height-compact', next);
      }
    };

    apply();
    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('scroll', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('scroll', apply);
      page?.removeAttribute('data-height-compact');
      page?.style.removeProperty('--workspace-viewport-height');
    };
  }, []);

  return mode;
}
