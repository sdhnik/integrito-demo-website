import { useEffect, useRef } from 'react';
import { INTEGRITO_PRODUCTS } from '../../components/header/products';

type Props = {
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  variant: 'rail' | 'drawer';
};

/** Two-line label for the compact icon-over-text rail. */
function productLines(name: string): [string, string] {
  if (name === 'AI Text Detector') return ['AI Text', 'Detector'];
  if (name === 'AI Image Detector') return ['AI Image', 'Detector'];
  if (name === 'Plagiarism Checker') return ['Plagiarism', 'Checker'];
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return [parts.slice(0, -1).join(' '), parts[parts.length - 1]!];
  }
  return [name, ''];
}

function ProductIcon({ id }: { id: string }) {
  if (id === 'ai-image-detector') {
    return (
      <svg className="classic-rail-icon" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="10.5" r="1.6" fill="currentColor" />
        <path
          d="M5 16.5 9.2 12.5l3 3 3.3-4 3.5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === 'plagiarism-checker') {
    return (
      <svg className="classic-rail-icon" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path
          d="M7 4.5h6.2L17 8.3V19.5H7V4.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M13.2 4.5V8.3H17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="14.5" cy="14" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16.8 16.3 19.2 18.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="classic-rail-icon" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M7 4.5h6.2L17 8.3V19.5H7V4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M13.2 4.5V8.3H17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 12h5M9.5 14.5h4M9.5 17h3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Compact Originality-inspired tool rail: icon above label, stacked vertically.
 * Not a dashboard sidebar.
 */
export default function ClassicSidebar({
  selectedProductId,
  onSelectProduct,
  mobileOpen = false,
  onMobileClose,
  variant,
}: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const isDrawer = variant === 'drawer';

  useEffect(() => {
    if (!isDrawer || !mobileOpen) return;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = panel?.querySelector<HTMLElement>('button');
    focusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onMobileClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isDrawer, mobileOpen, onMobileClose]);

  const nav = (
    <nav
      ref={panelRef}
      className={`classic-rail${isDrawer ? ' classic-rail--drawer' : ''}${isDrawer && mobileOpen ? ' is-open' : ''}`}
      aria-label="Integrito tools"
      {...(isDrawer
        ? {
            role: 'dialog' as const,
            'aria-modal': true,
            'aria-hidden': !mobileOpen,
          }
        : {})}
    >
      <ul className="classic-rail-list">
        {INTEGRITO_PRODUCTS.map(product => {
          const active = product.id === selectedProductId;
          const [line1, line2] = productLines(product.name);
          return (
            <li key={product.id}>
              <button
                type="button"
                className={`classic-rail-item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={product.name}
                onClick={() => {
                  onSelectProduct(product.id);
                  if (isDrawer) onMobileClose?.();
                }}
              >
                <ProductIcon id={product.id} />
                <span className="classic-rail-item-label">
                  <span>{line1}</span>
                  {line2 ? <span>{line2}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  if (!isDrawer) return nav;

  return (
    <>
      <div
        className={`classic-rail-backdrop${mobileOpen ? ' is-open' : ''}`}
        aria-hidden="true"
        onClick={onMobileClose}
      />
      {nav}
    </>
  );
}
