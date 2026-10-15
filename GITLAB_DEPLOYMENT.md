# GitLab Pages — Integrito demo deployment

Independent of GitHub Pages. Same codebase; separate remote and CI.

## Remotes (local)

| Remote | URL |
|--------|-----|
| `gitlab` | `git@gitlab.zae.cc:aleksey.severnyuk/integrito-demo-website.git` |
| `origin` | `https://github.com/sdhnik/integrito-demo-website.git` (GitHub) |

Push to GitLab:

```sh
git push gitlab master
```

## Pipeline file

`.gitlab-ci.yml`

- Job: `pages` (GitLab Pages)
- Branch: `master` only
- Node: 20.18.1 (downloaded into `.ci-node/` for shell runners)
- Install: `npm ci`
- Build: `npm run build` with resolved `VITE_BASE_PATH`
- Artifact: `public/` (contents of Vite `dist/`)

## Vite base path

Priority:

1. **CI/CD variable** `VITE_BASE_PATH` (set in GitLab → Settings → CI/CD → Variables)
2. **Path of** `CI_PAGES_URL` when GitLab provides it after Pages is enabled
3. Fallback: `/`

Examples:

| Pages URL style | Typical `VITE_BASE_PATH` |
|-----------------|--------------------------|
| `https://…/integrito-demo-website/` | `/integrito-demo-website/` |
| Unique subdomain root | `/` |
| Custom domain root | `/` |

Do **not** assume `CI_PROJECT_NAME` equals the URL path on every self-managed instance.

If the site loads but JS/CSS 404, set `VITE_BASE_PATH` explicitly to the path segment of the live Pages URL.

## Enable GitLab Pages (manual)

On `gitlab.zae.cc` (admin / project settings may vary):

1. Ensure **Pages** is available on the instance.
2. Ensure a **Runner** is online (shell or Docker).
3. Push `master` so the `pages` job runs.
4. After a green job, open **Deploy → Pages** (or **Settings → Pages**) for the published URL.

The exact Pages hostname is instance-specific — do not invent it from GitHub’s URL.

## Demo

Once the Pages URL is known:

```
<PAGES_URL>?demo=1
```

Same rules as GitHub: only the predefined sample text yields the demo report.

## Dual maintenance

| Action | Command |
|--------|---------|
| Deploy GitHub | `git push origin master` |
| Deploy GitLab | `git push gitlab master` |
| Deploy both | push to both remotes (no automatic mirroring) |

GitHub Actions and GitLab CI do not call each other and share no tokens.
