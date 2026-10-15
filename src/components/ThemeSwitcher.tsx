export type Theme = 'light' | 'dark';
export default function ThemeSwitcher({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return <div className="theme-switcher" role="group" aria-label="Color theme"><button type="button" aria-label="Light theme" aria-pressed={theme === 'light'} onClick={() => onChange('light')}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button><button type="button" aria-label="Dark theme" aria-pressed={theme === 'dark'} onClick={() => onChange('dark')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14a9 9 0 0 1-10.5-10.5A9 9 0 1 0 20.5 14Z"/></svg></button></div>;
}
