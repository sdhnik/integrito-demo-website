import { CURRENT_PRODUCT_ID, INTEGRITO_PRODUCTS } from '../header/products';
import type { SidebarNavVariant } from '../../utils/navVariant';

type Props = {
  variant: SidebarNavVariant;
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
};

/**
 * Hero-bound product navigation for design exploration.
 * Semantic nav only — no heading tags (SEO H1 stays in Hero copy).
 * Shared behavior; presentation via hero-product-nav--{variant}.
 */
export default function HeroProductNav({
  variant,
  selectedProductId,
  onSelectProduct,
}: Props) {
  return (
    <nav
      className={`hero-product-nav hero-product-nav--${variant}`}
      aria-label="Integrito products"
    >
      <p className="hero-product-nav-label" aria-hidden="true">
        Products
      </p>
      <ul className="hero-product-nav-list">
        {INTEGRITO_PRODUCTS.map((product, index) => {
          const active = product.id === selectedProductId;
          const current = product.id === CURRENT_PRODUCT_ID;
          const soon = product.status === 'soon';
          const num = String(index + 1).padStart(2, '0');

          return (
            <li key={product.id}>
              <button
                type="button"
                className={[
                  'hero-product-nav-item',
                  active ? 'is-active' : '',
                  soon ? 'is-soon' : '',
                  current ? 'is-implemented' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelectProduct(product.id)}
              >
                {variant === 'editorial' && (
                  <span className="hero-product-nav-num" aria-hidden="true">
                    {num}
                  </span>
                )}
                <span className="hero-product-nav-name">{product.name}</span>
                {active && <span className="hero-product-nav-indicator" aria-hidden="true" />}
                {soon && <span className="sr-only">Coming soon</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
