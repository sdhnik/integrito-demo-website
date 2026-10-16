import { useState } from 'react';
import { INTEGRITO_PRODUCTS } from '../../components/header/products';
import { SAMPLE_DETECTION_SCORE } from '../../data/sampleDetectionReport';

const FAQ = [
  {
    q: 'What is an AI text detector?',
    a: 'An AI text detector examines writing for patterns associated with AI-generated content and presents an indicative reading. It is a decision-support tool, not definitive proof of authorship.',
  },
  {
    q: 'How do I interpret the result?',
    a: 'The percentage is a confidence-style indication for the submitted document. Highlighted passages mark regions the demonstration fixture flags as highly likely to be AI-assisted. Always read the classification and context together.',
  },
  {
    q: 'Can AI detectors be wrong?',
    a: 'Yes. Detectors can misclassify human and AI writing. Treat Integrito results as signals to investigate, not as absolute judgments.',
  },
  {
    q: 'Can I check text without signing up?',
    a: 'Yes. In this Classic preview you can paste text and run Detect AI without creating an account. The full available demonstration result is shown before any secondary registration prompt.',
  },
  {
    q: 'What is included in this preview?',
    a: 'Classic is a structural design concept. Live model analysis is not connected. With demo mode enabled, the predefined sample document shows a fixed fixture report; other text receives an honest unavailable state.',
  },
];

export default function ClassicSections() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="classic-below">
      <section className="classic-section" aria-labelledby="classic-how-heading">
        <h2 id="classic-how-heading" className="classic-section-title">
          How It Works
        </h2>
        <ol className="classic-steps">
          <li>
            <span className="classic-step-num">01</span>
            <div>
              <p className="classic-step-title">Add your text</p>
              <p className="classic-step-body">Paste or write in the submission area on the left.</p>
            </div>
          </li>
          <li>
            <span className="classic-step-num">02</span>
            <div>
              <p className="classic-step-title">Run the check</p>
              <p className="classic-step-body">Press Detect AI without leaving the page.</p>
            </div>
          </li>
          <li>
            <span className="classic-step-num">03</span>
            <div>
              <p className="classic-step-title">Explore the result</p>
              <p className="classic-step-body">
                Review the confidence reading and highlighted passages on the right.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="classic-section" aria-labelledby="classic-understand-heading">
        <h2 id="classic-understand-heading" className="classic-section-title">
          Understand Your Result
        </h2>
        <p className="classic-section-lede">
          Illustrative example from the Integrito demonstration fixture — labeled as an example,
          not a live model output.
        </p>
        <ul className="classic-understand-list">
          <li>
            <strong>Detection score</strong>
            <span>
              Example: {SAMPLE_DETECTION_SCORE.toFixed(2)}% — an overall indication for the sample
              document.
            </span>
          </li>
          <li>
            <strong>Highlighted passages</strong>
            <span>Regions the fixture marks as highly likely to be AI-assisted.</span>
          </li>
          <li>
            <strong>Report interpretation</strong>
            <span>
              Use the classification and highlights together. Detection is not definitive proof of
              authorship.
            </span>
          </li>
        </ul>
      </section>

      <section className="classic-section" aria-labelledby="classic-explore-heading">
        <h2 id="classic-explore-heading" className="classic-section-title">
          Explore Integrito
        </h2>
        <ul className="classic-explore-list">
          {INTEGRITO_PRODUCTS.map(product => (
            <li key={product.id}>
              <p className="classic-explore-name">{product.name}</p>
              <p className="classic-explore-body">{product.description}</p>
              <p className="classic-explore-status">
                {product.status === 'current' ? 'Available in this preview' : 'Concept preview only'}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="classic-section" aria-labelledby="classic-faq-heading">
        <h2 id="classic-faq-heading" className="classic-section-title">
          FAQ
        </h2>
        <div className="classic-faq">
          {FAQ.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q} className="classic-faq-item">
                <button
                  type="button"
                  className="classic-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  {item.q}
                </button>
                {isOpen && <p className="classic-faq-body">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="classic-footer">
        <p className="classic-footer-brand">Integrito</p>
        <p className="classic-footer-meta">
          <a href="./">Original</a>
          <span aria-hidden="true">·</span>
          <a href="?concept=classic">Classic</a>
        </p>
      </footer>
    </div>
  );
}
