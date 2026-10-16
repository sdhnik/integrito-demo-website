import { useEffect, useState } from 'react';
import type { Theme } from '../../components/ThemeSwitcher';
import { readDemoMode } from '../../utils/concept';
import ClassicPage from './ClassicPage';
import './classic.css';

/**
 * Integrito Classic — public AI detector page with a compact tool rail
 * and subtle Original typographic spiral (V22.9.19+).
 * Isolated from the Original App shell.
 */
export default function ClassicApp() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('integrito-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [demoMode] = useState(readDemoMode);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'light' ? '#F7F7F5' : '#0C0D10',
    );
    try {
      localStorage.setItem('integrito-theme', theme);
    } catch {
      /* optional */
    }
  }, [theme]);

  return (
    <div className="classic" data-concept="classic">
      <ClassicPage theme={theme} onThemeChange={setTheme} demoMode={demoMode} />
    </div>
  );
}
