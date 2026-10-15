import type { Theme } from './ThemeSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClose: () => void;
};

/**
 * Development-only visual inventory for V22.9.2 button variants.
 * Open with ?buttons=1 — not linked from product navigation.
 */
export default function ButtonShowcase({ theme, onThemeChange, onClose }: Props) {
  return (
    <div className="button-showcase" data-theme={theme}>
      <header className="button-showcase-header">
        <div>
          <h1>Button system</h1>
          <p>V22.9.2 variants — Primary · Secondary · Ghost · Icon · Menu Item</p>
        </div>
        <div className="button-showcase-row">
          <ThemeSwitcher theme={theme} onChange={onThemeChange} />
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onClose}>
            Close showcase
          </button>
        </div>
      </header>

      <div className="button-showcase-grid">
        <section className="button-showcase-section" aria-labelledby="bs-primary">
          <h2 id="bs-primary">Primary</h2>
          <p>High-priority actions — Detect AI, Sign up (sm), Try Detector (lg).</p>
          <div className="button-showcase-row">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm">
              Sign up
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--md">
              Detect AI <span aria-hidden="true">↗</span>
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg">
              Try AI Text Detector
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--md" disabled>
              Detect AI
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--md detect-button--idle" disabled>
              Busy…
            </button>
          </div>
        </section>

        <section className="button-showcase-section" aria-labelledby="bs-secondary">
          <h2 id="bs-secondary">Secondary</h2>
          <p>Soft-blue Quick Actions — supporting Workspace controls.</p>
          <div className="button-showcase-row">
            <button type="button" className="ui-btn ui-btn--secondary">
              Hide highlights
            </button>
            <button type="button" className="ui-btn ui-btn--secondary is-selected" aria-pressed="true">
              What does this mean?
            </button>
            <button type="button" className="ui-btn ui-btn--secondary" disabled>
              Export PDF
            </button>
          </div>
        </section>

        <section className="button-showcase-section" aria-labelledby="bs-ghost">
          <h2 id="bs-ghost">Ghost</h2>
          <p>Lightweight Header and Composer tools.</p>
          <div className="button-showcase-row">
            <button type="button" className="ui-btn ui-btn--ghost">
              Products
            </button>
            <button type="button" className="ui-btn ui-btn--ghost">
              Log in
            </button>
            <button type="button" className="ui-btn ui-btn--ghost">
              Start over
            </button>
            <button type="button" className="ui-btn ui-btn--ghost">
              Paste text
            </button>
          </div>
        </section>

        <section className="button-showcase-section" aria-labelledby="bs-icon">
          <h2 id="bs-icon">Icon</h2>
          <p>Compact icon-first controls — Mobile menu, dialog close pattern.</p>
          <div className="button-showcase-row">
            <button type="button" className="ui-btn ui-btn--icon" aria-label="Menu">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <button type="button" className="ui-btn ui-btn--icon" aria-label="Close">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <ThemeSwitcher theme={theme} onChange={onThemeChange} />
          </div>
        </section>

        <section className="button-showcase-section" aria-labelledby="bs-menu">
          <h2 id="bs-menu">Menu item</h2>
          <p>Dropdown and floating-menu rows — not CTAs.</p>
          <div className="button-showcase-menu">
            <button type="button" className="ui-btn ui-btn--menu">
              AI Text Detector
            </button>
            <button type="button" className="ui-btn ui-btn--menu" disabled>
              AI Image Detector · Coming soon
            </button>
            <button type="button" className="ui-btn ui-btn--menu">
              Give feedback
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
