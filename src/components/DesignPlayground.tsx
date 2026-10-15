import { useState } from 'react';
import type { CanvasSettings } from './canvasSettings';
import type { Theme } from './ThemeSwitcher';

type Props = {
  settings: CanvasSettings;
  onChange: (settings: CanvasSettings) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export default function DesignPlayground({
  settings, onChange, theme, onThemeChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const options: { key: keyof CanvasSettings; label: string; values: string[] }[] = [
    { key: 'accent', label: 'Canvas accent', values: ['Monochrome', 'Integrito Blue'] },
    { key: 'speed', label: 'Animation speed', values: ['Slow', 'Medium', 'Fast'] },
    { key: 'intensity', label: 'Canvas intensity', values: ['Low', 'Medium', 'High'] },
    { key: 'rippleStrength', label: 'Ripple strength', values: ['Very Subtle', 'Subtle', 'Medium', 'Original'] },
    { key: 'ringSpacing', label: 'Ring spacing', values: ['Default', 'Spacious', 'Extra Spacious', 'Airy', 'Minimal'] },
    { key: 'textFragmentation', label: 'Text fragmentation', values: ['None', 'Subtle', 'Open', 'More Open', 'Experimental'] },
    { key: 'blueAccent', label: 'Blue accent distribution', values: ['None', 'Sparse', 'Balanced', 'Rich'] },
    { key: 'ringCountMode', label: 'Ring count', values: ['Responsive', 'Fixed'] },
  ];
  return (
    <aside className="playground">
      <button className="playground-toggle" aria-label="Design playground" aria-expanded={open} aria-controls="playground-panel" onClick={() => setOpen(!open)} title="Design playground">
        {open ? '×' : '☷'}
        <span className="sr-only">Design playground</span>
      </button>
      {open && (
        <div className="playground-panel" id="playground-panel">
          <div className="playground-title">Design playground<span>DEV</span></div>
          <label>Theme
            <select value={theme} onChange={e => onThemeChange(e.target.value as Theme)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          {options.map(option => (
            <label key={option.key}>{option.label}
              <select
                value={settings[option.key]}
                onChange={e => onChange({ ...settings, [option.key]: e.target.value as never })}
              >
                {option.values.map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
          ))}
          <p>
            WebGL spiral is always on when supported. More Open ≈30% gaps · Balanced accents · Very Subtle ripple.
          </p>
        </div>
      )}
    </aside>
  );
}
