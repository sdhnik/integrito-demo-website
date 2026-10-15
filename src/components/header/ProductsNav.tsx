import { CURRENT_PRODUCT_ID, INTEGRITO_PRODUCTS } from './products';

/**
 * Desktop Header product strip — one horizontal text row.
 * Reuses INTEGRITO_PRODUCTS (same source as mobile menu).
 * Current product is an indicator only (does not reset Workspace).
 * Coming-soon products are non-interactive; status is sr-only + title tooltip.
 */
export default function ProductsNav() {
  return (
    <nav className="header-products-nav" aria-label="Integrito products">
      {INTEGRITO_PRODUCTS.map(product => {
        const current = product.id === CURRENT_PRODUCT_ID;
        const soon = product.status === 'soon';

        if (soon) {
          return (
            <span
              key={product.id}
              className="header-product-link is-soon"
              aria-disabled="true"
              title="Coming soon"
            >
              <span className="header-product-link-name">{product.name}</span>
              <span className="sr-only">Coming soon</span>
            </span>
          );
        }

        return (
          <span
            key={product.id}
            className={`header-product-link${current ? ' is-current' : ''}`}
            aria-current={current ? 'page' : undefined}
          >
            <span className="header-product-link-name">{product.name}</span>
            {current && <span className="blue-dot" aria-hidden="true" />}
          </span>
        );
      })}
    </nav>
  );
}
