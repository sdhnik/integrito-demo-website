import { useId, useState } from 'react';
import { countWords, formatWordLabel } from '../../utils/textMetrics';

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`user-message-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 6.5 8 10.5 12 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  text: string;
  /** Reserved for V19 Document Viewer — unused for local expand/collapse. */
  onOpen?: () => void;
};

export default function UserMessage({ text }: Props) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const wordLabel = formatWordLabel(countWords(text));

  return (
    <article className={`user-message${expanded ? ' is-expanded' : ''}`}>
      <div className="user-message-card">
        <button
          type="button"
          className="user-message-header"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded(value => !value)}
        >
          <span className="user-message-label">Your submitted text</span>
          <Chevron open={expanded} />
        </button>

        <div id={panelId} className="user-message-panel">
          {expanded ? (
            <div className="user-message-body" role="region" aria-label="Full submitted text">
              {text}
            </div>
          ) : (
            <button
              type="button"
              className="user-message-preview"
              aria-expanded={false}
              aria-label={`Your submitted text, ${wordLabel}. Expand to read the full document.`}
              onClick={() => setExpanded(true)}
            >
              {text}
            </button>
          )}
        </div>

        <span className="user-message-meta">{wordLabel}</span>
      </div>
    </article>
  );
}
