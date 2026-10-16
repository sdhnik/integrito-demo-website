import ProductConceptPreview from './hero/ProductConceptPreview';
import { CURRENT_PRODUCT_ID } from './header/products';
import type { NavVariant } from '../utils/navVariant';

type Props = {
  navVariant?: NavVariant;
  selectedProductId?: string;
  onSelectProduct?: (id: string) => void;
};

/**
 * Hero copy / concept preview.
 * Editorial / Surface / Surface Minimal Product Index are stage-persistent (App).
 * Inset comes from main padding when those variants are active.
 */
export default function Hero({
  navVariant = 'top',
  selectedProductId = CURRENT_PRODUCT_ID,
}: Props) {
  const showingDetector = selectedProductId === CURRENT_PRODUCT_ID;

  const copy = showingDetector ? (
    <div className="hero-copy">
      <h1 id="hero-title">
        AI Text
        <br />
        <span>Detector</span>
        <span className="period">.</span>
      </h1>
      <p>
        Human expression. Artificial intelligence.
        <br />
        Understand the writing in front of you.
      </p>
    </div>
  ) : (
    <ProductConceptPreview productId={selectedProductId} />
  );

  const heroMod =
    navVariant === 'editorial'
      ? ' hero--editorial'
      : navVariant === 'surface'
        ? ' hero--surface'
        : navVariant === 'surface-minimal'
          ? ' hero--surface-minimal'
          : '';

  return (
    <section
      className={`hero${heroMod}`}
      aria-labelledby={showingDetector ? 'hero-title' : undefined}
    >
      {copy}
    </section>
  );
}
