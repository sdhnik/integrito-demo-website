import { useCallback, useEffect, useId, useState } from 'react';
import whiteLogo from '../assets/integrito-logo-white.svg';
import defaultLogo from '../assets/integrito-logo-black.svg';
import ThemeSwitcher, { type Theme } from './ThemeSwitcher';
import AccountAccessDialog, { type AccountEntry } from './header/AccountAccessDialog';
import {
  PREVIEW_IDENTITY,
  readHeaderAuthPreview,
  type HeaderAuthMode,
} from './header/authPreview';
import ProductsNav from './header/ProductsNav';
import ProfileDropdown from './header/ProfileDropdown';
import { CURRENT_PRODUCT_ID, INTEGRITO_PRODUCTS } from './header/products';

type OpenMenu = 'profile' | 'mobile' | null;

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  /** Workspace-only: return to Landing (existing Crossfade). */
  onStartOver?: () => void;
  /** True while Workspace chrome is active — Start over visible without layout jump. */
  showStartOver?: boolean;
  /**
   * V22.9.8 — hide desktop product strip when Hero owns product navigation
   * (editorial / surface / surface-minimal). Mobile menu products remain available.
   */
  hideDesktopProducts?: boolean;
};

export default function Header({
  theme,
  onThemeChange,
  onStartOver,
  showStartOver = false,
  hideDesktopProducts = false,
}: Props) {
  const [authMode] = useState<HeaderAuthMode>(() => readHeaderAuthPreview());
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [accountEntry, setAccountEntry] = useState<AccountEntry | null>(null);
  const mobileNavId = useId();
  const isPreviewAuth = authMode === 'preview-authenticated';

  const closeMenus = useCallback(() => setOpenMenu(null), []);

  const setMenu = useCallback((menu: OpenMenu) => {
    setOpenMenu(current => (current === menu ? null : menu));
  }, []);

  /* Close overlays when Landing ↔ Workspace chrome flips or during transitions. */
  useEffect(() => {
    closeMenus();
    setAccountEntry(null);
  }, [showStartOver, closeMenus]);

  useEffect(() => {
    if (openMenu !== 'mobile') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openMenu, closeMenus]);

  const openAccount = (entry: AccountEntry) => {
    closeMenus();
    setAccountEntry(entry);
  };

  const startOver = (
    <div className="header-start-over-slot">
      <button
        type="button"
        className={`text-button start-over-button${showStartOver ? ' is-visible' : ''}`}
        onClick={() => {
          closeMenus();
          onStartOver?.();
        }}
        tabIndex={showStartOver ? 0 : -1}
        aria-hidden={!showStartOver}
        disabled={!showStartOver || !onStartOver}
      >
        Start over
        <span className="blue-dot" aria-hidden="true" />
      </button>
    </div>
  );

  const guestActions = (
    <div className="header-account-actions">
      <button type="button" className="text-button header-login" onClick={() => openAccount('login')}>
        Log in
      </button>
      <button type="button" className="header-signup" onClick={() => openAccount('signup')}>
        Sign up
      </button>
    </div>
  );

  const profileActions = (
    <ProfileDropdown
      open={openMenu === 'profile'}
      onOpenChange={open => setOpenMenu(open ? 'profile' : null)}
      identity={PREVIEW_IDENTITY}
    />
  );

  return (
    <>
      <header className="header">
        <div className="header-left">
          <a className="brand" href="./" aria-label="Integrito home">
            <img
              src={theme === 'dark' ? whiteLogo : defaultLogo}
              alt="Integrito"
              width="185"
              height="42"
            />
          </a>
          {!hideDesktopProducts && (
            <div className="header-desktop-products">
              <ProductsNav />
            </div>
          )}
        </div>

        <div className="header-right">
          <nav className="header-desktop-nav" aria-label="Account and workspace">
            {startOver}
            {isPreviewAuth ? profileActions : guestActions}
          </nav>
          <ThemeSwitcher theme={theme} onChange={onThemeChange} />
          <button
            type="button"
            className="header-mobile-toggle"
            aria-expanded={openMenu === 'mobile'}
            aria-controls={mobileNavId}
            aria-label={openMenu === 'mobile' ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu('mobile')}
          >
            <span className="header-mobile-icon" aria-hidden="true">
              {openMenu === 'mobile' ? (
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path
                    d="M5 5l10 10M15 5 5 15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path
                    d="M3.5 6h13M3.5 10h13M3.5 14h13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
          </button>
        </div>

        {openMenu === 'mobile' && (
          <>
            <button
              type="button"
              className="header-mobile-backdrop"
              aria-label="Close menu"
              onClick={closeMenus}
            />
            <div id={mobileNavId} className="header-mobile-panel" role="navigation" aria-label="Mobile">
              <section className="header-mobile-section" aria-labelledby="mobile-products-heading">
                <h2 id="mobile-products-heading" className="header-mobile-heading">
                  Products
                </h2>
                <ul className="header-mobile-list">
                  {INTEGRITO_PRODUCTS.map(product => {
                    const current = product.id === CURRENT_PRODUCT_ID;
                    const soon = product.status === 'soon';
                    return (
                      <li key={product.id}>
                        {soon ? (
                          <div className="header-mobile-item is-soon">
                            <span>
                              {product.name}
                              <span className="sr-only">Coming soon</span>
                            </span>
                            <p>{product.description}</p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`header-mobile-item${current ? ' is-current' : ''}`}
                            onClick={closeMenus}
                          >
                            <span>
                              {product.name}
                              {current && (
                                <>
                                  <span className="header-product-status is-current-label">
                                    Current
                                  </span>
                                  <span className="blue-dot" aria-hidden="true" />
                                </>
                              )}
                            </span>
                            <p>{product.description}</p>
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {showStartOver && onStartOver && (
                <section className="header-mobile-section">
                  <button
                    type="button"
                    className="header-mobile-action start-over-button is-visible"
                    onClick={() => {
                      closeMenus();
                      onStartOver();
                    }}
                  >
                    Start over
                    <span className="blue-dot" aria-hidden="true" />
                  </button>
                </section>
              )}

              <section className="header-mobile-section" aria-labelledby="mobile-account-heading">
                <h2 id="mobile-account-heading" className="header-mobile-heading">
                  Account
                </h2>
                {isPreviewAuth ? (
                  <div className="header-mobile-preview-account">
                    <span className="header-avatar" aria-hidden="true">
                      {PREVIEW_IDENTITY.initials}
                    </span>
                    <div>
                      <p className="header-profile-name">{PREVIEW_IDENTITY.displayName}</p>
                      <p className="header-profile-hint">Preview only · not a real session</p>
                    </div>
                  </div>
                ) : (
                  <div className="header-mobile-account-actions">
                    <button
                      type="button"
                      className="text-button header-login"
                      onClick={() => openAccount('login')}
                    >
                      Log in
                    </button>
                    <button
                      type="button"
                      className="header-signup"
                      onClick={() => openAccount('signup')}
                    >
                      Sign up
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </header>

      <AccountAccessDialog entry={accountEntry} onClose={() => setAccountEntry(null)} />
    </>
  );
}

/* Re-export for typed consumers that imported Theme from Header historically — none today. */
export type { Theme };
