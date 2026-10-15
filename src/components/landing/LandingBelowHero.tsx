import type { Theme } from '../ThemeSwitcher';
import whiteLogo from '../../assets/integrito-logo-white.svg';
import defaultLogo from '../../assets/integrito-logo-black.svg';
import {
  CURRENT_PRODUCT_ID,
  INTEGRITO_PRODUCTS,
} from '../header/products';
import LandingFaq from './LandingFaq';
import LandingResultPreview from './LandingResultPreview';

type Props = {
  theme: Theme;
  onTryDetector: () => void;
};

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Paste your text',
    body: 'Add the writing you want to examine.',
  },
  {
    number: '02',
    title: 'Review the analysis',
    body: 'Explore the reported score and highlighted passages.',
  },
  {
    number: '03',
    title: 'Understand the result',
    body: 'Review the findings in context and export a report when available.',
  },
] as const;

/**
 * SEO / presentation sections below the approved Hero.
 * Does not alter Hero, spiral, or Composer markup.
 */
export default function LandingBelowHero({ theme, onTryDetector }: Props) {
  const logo = theme === 'dark' ? whiteLogo : defaultLogo;

  return (
    <div className="landing-below">
      <section
        className="landing-section landing-understanding"
        aria-labelledby="landing-understanding-heading"
      >
        <div className="landing-section-inner landing-understanding-grid">
          <div className="landing-understanding-lead">
            <p className="landing-eyebrow">01 / UNDERSTANDING</p>
            <h2 id="landing-understanding-heading" className="landing-heading landing-heading--lg">
              What is an AI Text Detector?
            </h2>
          </div>
          <div className="landing-understanding-copy">
            <p>
              An AI text detector examines writing for patterns that may be associated with
              AI-generated content.
            </p>
            <p>
              Its findings are signals worth exploring—not definitive proof of who wrote a text.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-process" aria-labelledby="landing-process-heading">
        <div className="landing-section-inner">
          <p className="landing-eyebrow">02 / THE PROCESS</p>
          <h2 id="landing-process-heading" className="landing-heading">
            How Integrito Works
          </h2>
          <p className="landing-lede landing-lede--narrow">
            A simple workflow for examining writing and understanding its results.
          </p>
          <ol className="landing-process-steps">
            {PROCESS_STEPS.map(step => (
              <li key={step.number} className="landing-process-step">
                <span className="landing-process-number" aria-hidden="true">
                  {step.number}
                </span>
                <h3 className="landing-process-title">{step.title}</h3>
                <p className="landing-process-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <LandingResultPreview />

      <section className="landing-section landing-products" aria-labelledby="landing-products-heading">
        <div className="landing-section-inner">
          <p className="landing-eyebrow">04 / EXPLORE</p>
          <h2 id="landing-products-heading" className="landing-heading">
            More tools. One platform.
          </h2>
          <p className="landing-lede landing-lede--narrow">
            Explore the tools Integrito is building for a clearer understanding of digital content.
          </p>
          <ul className="landing-product-list">
            {INTEGRITO_PRODUCTS.map(product => {
              const current = product.id === CURRENT_PRODUCT_ID;
              const soon = product.status === 'soon';
              return (
                <li
                  key={product.id}
                  className={`landing-product-item${current ? ' is-current' : ''}${
                    soon ? ' is-soon' : ''
                  }`}
                >
                  {current ? (
                    <button
                      type="button"
                      className="landing-product-hit"
                      onClick={onTryDetector}
                    >
                      <div className="landing-product-row">
                        <h3 className="landing-product-name">
                          {product.name}
                          <span className="blue-dot" aria-hidden="true" />
                        </h3>
                        <span className="landing-product-status is-current-label">Current demo</span>
                      </div>
                      <p className="landing-product-desc">{product.description}</p>
                    </button>
                  ) : (
                    <div className="landing-product-hit is-static" aria-disabled="true">
                      <div className="landing-product-row">
                        <h3 className="landing-product-name">{product.name}</h3>
                        <span className="landing-product-status">Coming soon</span>
                      </div>
                      <p className="landing-product-desc">{product.description}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <LandingFaq />

      <section className="landing-section landing-cta" aria-labelledby="landing-cta-heading">
        <div className="landing-section-inner landing-cta-inner">
          <h2 id="landing-cta-heading" className="landing-cta-heading">
            Ready to examine a passage?
          </h2>
          <p className="landing-cta-copy">
            Return to the detector and paste the writing you want to explore.
          </p>
          <button type="button" className="landing-cta-button" onClick={onTryDetector}>
            Try AI Text Detector
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-section-inner landing-footer-inner">
          <div className="landing-footer-brand">
            <img className="landing-footer-logo" src={logo} alt="Integrito" width={132} height={28} />
            <p className="landing-footer-tagline">A clearer perspective on digital content.</p>
          </div>
          <div className="landing-footer-cols">
            <div className="landing-footer-col">
              <p className="landing-footer-label">Products</p>
              <ul className="landing-footer-list">
                {INTEGRITO_PRODUCTS.map(product => (
                  <li key={product.id}>
                    {product.id === CURRENT_PRODUCT_ID ? (
                      <button type="button" className="landing-footer-link" onClick={onTryDetector}>
                        {product.name}
                      </button>
                    ) : (
                      <span className="landing-footer-soon">
                        {product.name}
                        <span>Coming soon</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="landing-footer-col">
              <p className="landing-footer-label">About Integrito</p>
              <p className="landing-footer-about">
                Integrito is building a thoughtful platform for AI content analysis. This preview
                demonstrates the AI Text Detector experience and is not connected to a live
                detection service.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
