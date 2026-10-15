import { defineConfig } from 'vite';

/**
 * Shared Vite `base` for local, GitHub Pages, and GitLab Pages.
 *
 * - Local / default: `/` — `npm run dev` and plain `npm run build` stay at root.
 * - GitHub Actions: sets `VITE_BASE_PATH=/integrito-demo-website/` (repo name).
 * - GitLab CI: sets `VITE_BASE_PATH` from `CI_PAGES_URL` path, or an explicit
 *   CI/CD variable — never hardcode a GitLab hostname or namespace here.
 *
 * Values should use leading and trailing slashes (e.g. `/my-project/`).
 * `/` is left unchanged.
 */
function resolveBase(raw: string | undefined): string {
  if (!raw || raw === '/') return '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  base: resolveBase(process.env.VITE_BASE_PATH),
});
