import ThemeSwitcher, { type Theme } from '../../components/ThemeSwitcher';
import whiteLogo from '../../assets/integrito-logo-white.svg';
import defaultLogo from '../../assets/integrito-logo-black.svg';

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  /** Mobile-only: open/close product drawer. */
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
};

export default function ClassicHeader({
  theme,
  onThemeChange,
  menuOpen = false,
  onMenuToggle,
  showMenuButton = false,
}: Props) {
  const logo = theme === 'dark' ? whiteLogo : defaultLogo;

  return (
    <header className="classic-header">
      <div className="classic-header-inner">
        <div className="classic-header-left">
          {showMenuButton && (
            <button
              type="button"
              className="classic-menu-btn"
              aria-label={menuOpen ? 'Close tools menu' : 'Open tools menu'}
              aria-expanded={menuOpen}
              aria-controls="classic-mobile-sidebar"
              onClick={onMenuToggle}
            >
              <span className="classic-menu-btn-bars" aria-hidden="true" />
            </button>
          )}
          <a className="classic-logo" href="?concept=classic" aria-label="Integrito Classic home">
            <img src={logo} alt="" width={120} height={28} />
          </a>
        </div>

        <div className="classic-header-actions">
          <button type="button" className="text-button classic-header-login" disabled title="Demo only">
            Log in
          </button>
          <button
            type="button"
            className="header-signup classic-header-signup"
            disabled
            title="Demo only"
          >
            Sign up
          </button>
          <ThemeSwitcher theme={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}
