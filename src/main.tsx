import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';
import { normalizeObsoleteConceptParam, readConcept } from './utils/concept';

const root = ReactDOM.createRoot(document.getElementById('root')!);

/**
 * Concept gate before mounting concept-specific trees.
 * Classic is dynamically imported so Original spiral / OGL stay out of that path.
 * Obsolete concepts (studio / signal) fall back to Original.
 */
async function boot() {
  normalizeObsoleteConceptParam();
  const concept = readConcept();

  if (concept === 'classic') {
    const { default: ClassicApp } = await import('./concepts/classic/ClassicApp');
    root.render(
      <React.StrictMode>
        <ClassicApp />
      </React.StrictMode>,
    );
    return;
  }

  const { default: App } = await import('./App');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void boot();
