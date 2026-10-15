export type ProductStatus = 'current' | 'soon';

export type ProductEntry = {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
};

/** Platform product catalog — no fabricated routes. */
export const INTEGRITO_PRODUCTS: ProductEntry[] = [
  {
    id: 'ai-text-detector',
    name: 'AI Text Detector',
    description: 'Examine writing for indications of AI-generated content.',
    status: 'current',
  },
  {
    id: 'ai-image-detector',
    name: 'AI Image Detector',
    description: 'Explore whether visual content may have been AI-generated.',
    status: 'soon',
  },
  {
    id: 'plagiarism-checker',
    name: 'Plagiarism Checker',
    description: 'Examine text originality and potential source overlap.',
    status: 'soon',
  },
];

export const CURRENT_PRODUCT_ID = 'ai-text-detector';
