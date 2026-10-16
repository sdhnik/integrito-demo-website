import { INTEGRITO_PRODUCTS } from '../header/products';

type Props = {
  productId: string;
};

/**
 * Presentation-only concept preview for unimplemented products.
 * No H1 — keeps a single document H1 on the AI Text Detector view.
 * No simulated scores, reports, or routes.
 */
export default function ProductConceptPreview({ productId }: Props) {
  const product = INTEGRITO_PRODUCTS.find(p => p.id === productId);
  if (!product) return null;

  return (
    <div className="product-concept-preview" role="status">
      <p className="product-concept-eyebrow">Concept preview</p>
      <p className="product-concept-title">{product.name}</p>
      <p className="product-concept-body">{product.description}</p>
      <p className="product-concept-note">
        This tool is not available yet. The preview is for navigation design
        only — no analysis is performed.
      </p>
    </div>
  );
}
