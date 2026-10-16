import { useEffect, useMemo, useState } from 'react';
import type { Theme } from '../../components/ThemeSwitcher';
import GenerativeCanvas from '../../components/GenerativeCanvas';
import { initialSettings, type CanvasSettings } from '../../components/canvasSettings';
import { CURRENT_PRODUCT_ID, INTEGRITO_PRODUCTS } from '../../components/header/products';
import ClassicDetector from './ClassicDetector';
import ClassicHeader from './ClassicHeader';
import ClassicHero from './ClassicHero';
import ClassicSections from './ClassicSections';
import ClassicSidebar from './ClassicSidebar';

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  demoMode: boolean;
};

const MOBILE_NAV_MQ = '(max-width: 900px)';

/** Subtle Classic presentation of the shared Original spiral. */
const CLASSIC_SPIRAL_SETTINGS: CanvasSettings = {
  ...initialSettings,
  speed: 'Slow',
  rippleStrength: 'Very Subtle',
  blueAccent: 'Sparse',
  ringSpacing: 'Minimal',
  textFragmentation: 'More Open',
};

export default function ClassicPage({ theme, onThemeChange, demoMode }: Props) {
  const [selectedProductId, setSelectedProductId] = useState(CURRENT_PRODUCT_ID);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(() => {
    try {
      return window.matchMedia(MOBILE_NAV_MQ).matches;
    } catch {
      return false;
    }
  });

  const product = INTEGRITO_PRODUCTS.find(p => p.id === selectedProductId) ?? INTEGRITO_PRODUCTS[0];
  const spiralSettings = useMemo(() => CLASSIC_SPIRAL_SETTINGS, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const sync = () => {
      setIsMobileNav(mq.matches);
      if (!mq.matches) setMenuOpen(false);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const heading =
    selectedProductId === CURRENT_PRODUCT_ID
      ? {
          title: 'AI Text Detector',
          support: "Understand what's behind the writing.",
          secondary: 'Check your text and explore the passages highlighted by Integrito.',
        }
      : selectedProductId === 'ai-image-detector'
        ? {
            title: 'AI Image Detector',
            support: 'Explore visual authenticity concepts.',
            secondary: undefined as string | undefined,
          }
        : {
            title: 'Plagiarism Checker',
            support: 'Explore originality checking concepts.',
            secondary: undefined as string | undefined,
          };

  return (
    <div className="classic-layout">
      <ClassicHeader
        theme={theme}
        onThemeChange={onThemeChange}
        showMenuButton={isMobileNav}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(open => !open)}
      />

      {!isMobileNav && (
        <ClassicSidebar
          variant="rail"
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
        />
      )}

      {isMobileNav && (
        <div id="classic-mobile-sidebar">
          <ClassicSidebar
            variant="drawer"
            mobileOpen={menuOpen}
            onMobileClose={() => setMenuOpen(false)}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
          />
        </div>
      )}

      <div className="classic-main">
        <section className="classic-hero-stage" aria-label="Detector">
          <div className="classic-spiral-layer" aria-hidden="true">
            <GenerativeCanvas theme={theme} settings={spiralSettings} ringCountSubtract={1} />
          </div>
          <div className="classic-hero-stage-inner">
            <ClassicHero
              title={heading.title}
              support={heading.support}
              secondary={heading.secondary}
              note={
                product.status === 'soon'
                  ? 'Concept preview — live analysis is not available for this product.'
                  : undefined
              }
            />
            <ClassicDetector productId={selectedProductId} demoMode={demoMode} />
          </div>
        </section>

        <ClassicSections />
      </div>
    </div>
  );
}
