import { useId, useState } from 'react';

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Can an AI detector prove that text was written by AI?',
    answer:
      'No. AI detection results should be treated as indicators rather than definitive proof of authorship.',
  },
  {
    question: 'What does an AI detection score mean?',
    answer:
      'A detection score summarizes the analysis provided by the detector. It should be interpreted alongside the document and any highlighted passages, not as proof of authorship.',
  },
  {
    question: 'Can I try Integrito without an account?',
    answer:
      'You can explore the current AI Text Detector demonstration without creating an account.',
  },
  {
    question: 'Can I export a report?',
    answer:
      'The current demonstration supports downloadable PDF reports for its predefined sample result.',
  },
  {
    question: 'Will Integrito support other content types?',
    answer:
      'AI Image Detection and Plagiarism Checking are planned additions to the platform.',
  },
];

export default function LandingFaq() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="landing-section landing-faq" aria-labelledby={`${baseId}-heading`}>
      <div className="landing-section-inner">
        <p className="landing-eyebrow">05 / QUESTIONS</p>
        <h2 id={`${baseId}-heading`} className="landing-heading">
          Frequently Asked Questions
        </h2>
        <div className="landing-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            const open = openIndex === index;
            return (
              <div key={item.question} className={`landing-faq-item${open ? ' is-open' : ''}`}>
                <h3 className="landing-faq-question">
                  <button
                    type="button"
                    id={buttonId}
                    className="landing-faq-trigger"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span className="landing-faq-icon" aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="landing-faq-panel"
                  hidden={!open}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
