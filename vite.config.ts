import { defineConfig } from 'vite';

/**
 * Portable static hosting base for GitLab Pages.
 *
 * Relative `./` keeps asset URLs correct whether Pages serves from a
 * project subdirectory or a dedicated domain root. Local `npm run dev`
 * is unaffected. Override with VITE_BASE_PATH if an absolute base is required.
 *
 * Example (only if your Pages path is confirmed):
 *   VITE_BASE_PATH=/integrito-demo-website/ npm run build
 */
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
});
