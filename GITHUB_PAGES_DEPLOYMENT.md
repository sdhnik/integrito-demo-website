# GitHub Pages — Integrito demo deployment

Independent of GitLab Pages. Same codebase; separate remote and CI.

See also: [GITLAB_DEPLOYMENT.md](./GITLAB_DEPLOYMENT.md)

## 1. Repository settings (manual)

In GitHub:

1. Open the repository.
2. **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.

Do not choose “Deploy from a branch” — this project publishes via the Actions workflow.

## 2. Workflow file

`.github/workflows/deploy.yml`

## 3. Deployment branch

`master`

Also: **Actions → Deploy GitHub Pages → Run workflow** (`workflow_dispatch`).

## 4. Vite base path strategy

| Context | Base |
|---------|------|
| Local `npm run dev` / `npm run build` | `/` (default) |
| GitHub Pages CI | `/integrito-demo-website/` via `VITE_BASE_PATH` |
| GitLab Pages CI | From `CI_PAGES_URL` or CI variable (see GitLab guide) |

GitHub workflow sets:

```yaml
VITE_BASE_PATH: /${{ github.event.repository.name }}/
```

No manual edits to `vite.config.ts` when switching platforms.

## 5. Enable GitHub Pages

**Settings → Pages → Source: GitHub Actions** (once).

## 6. Trigger deployment

```sh
git push origin master
```

Or run the workflow manually from the **Actions** tab.

## 7. Expected published URL

```
https://sdhnik.github.io/integrito-demo-website/
```

Confirm on the successful deploy job or **Settings → Pages**.

## 8. Verify deployment

1. Open the Pages URL.
2. Header, Hero, spiral, Composer, SEO sections.
3. Light / Dark, Products menu.
4. Demo (below).
5. Workspace, highlights, Quick Actions, Export PDF.
6. Network tab: no 404s for JS/CSS/fonts/SVGs.

## 9. Management demo

```
https://sdhnik.github.io/integrito-demo-website/?demo=1
```

Only the exact predefined sample text produces the demo detection report.

| Query | Availability |
|-------|----------------|
| `?demo=1` | Production presentation |
| `?buttons=1` | Development only |
| `?headerPreview=authenticated` | Development only |

## 10. Known limitations

- Public static site (no private backend auth).
- No real AI detection API.
- First deploy may take a few minutes after enabling Actions as the Pages source.
- GitLab deploy is separate — pushing only to `origin` does not update GitLab Pages.
