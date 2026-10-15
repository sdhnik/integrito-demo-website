import { useEffect, useId, useRef } from 'react';
import ChevronIcon from './ChevronIcon';
import { CURRENT_PRODUCT_ID, INTEGRITO_PRODUCTS } from './products';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProductsDropdown({ open, onOpenChange }: Props) {
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="header-menu header-menu--products" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className="header-nav-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => onOpenChange(!open)}
      >
        Products
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div id={menuId} className="header-dropdown" role="menu" aria-label="Integrito products">
          {INTEGRITO_PRODUCTS.map(product => {
            const current = product.id === CURRENT_PRODUCT_ID;
            const soon = product.status === 'soon';
            if (soon) {
              return (
                <div
                  key={product.id}
                  className="header-product-item is-soon"
                  role="presentation"
                >
                  <div className="header-product-row">
                    <span className="header-product-name">{product.name}</span>
                    <span className="header-product-status">Coming soon</span>
                  </div>
                  <p className="header-product-desc">{product.description}</p>
                </div>
              );
            }
            return (
              <button
                key={product.id}
                type="button"
                role="menuitem"
                className={`header-product-item${current ? ' is-current' : ''}`}
                onClick={() => onOpenChange(false)}
              >
                <div className="header-product-row">
                  <span className="header-product-name">
                    {product.name}
                    {current && <span className="blue-dot" aria-hidden="true" />}
                  </span>
                  <span className="header-product-status is-current-label">Current</span>
                </div>
                <p className="header-product-desc">{product.description}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
