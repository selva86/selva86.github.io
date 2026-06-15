# Sections v3 — implementation plan (APPROVED)

> Durable copy of the approved plan for resuming across Claude sessions.
> Live progress/status: `Plans/sections-v3-progress.md`. Memory: `project_sections_v3`.

## Context

Ship the six polished v3 design mocks in `_mocks/` (tutorials, exercises, tools, roadmap, topic, certification) as real production pages with the **exact look and feel**, fully wired to real data, real auth/personalization, and real interactive features ("whole and complete", no fake personas/stub states). The mocks fit the existing **standalone "section page"** pattern (like `/tools/index.html`, `/posts/index.html`) which bypass the article template. Most numbers/features are already backed by real data (`functions/_data/tracks.json` track counts match the mocks exactly) and the live `/api/me/*` endpoints + WebR + 28 calculators + exercise grader + cert mint/verify/SVG pipeline are shippable.

## Decisions (locked with user)

1. **Nav scope**: v3 masthead on the new section pages **only**; ~1,300 article pages keep the template masthead (sitewide retrofit is a later separate effort).
2. **Roadmap progress**: static route structure + real signed-in progress via existing `/api/me/tracks` (no new backend).
3. **Page mapping**: tools mock **replaces** `/tools/`; certification mock **replaces** `/certifications/`; tutorials mock = **new** `/tutorials/` curated landing linking to the existing `/posts/` archive (Compendium stays).
4. **Flagship first**: **Certification**, then roll out the rest reusing the shared foundation.

## Architecture

Standalone section pages (no article template, no sidebar) via a new generator `_build/gen_sections.py` (modeled on `_build/gen_tools_landing.py`): shared chrome (head + v3 masthead + footer + scripts) + authored page body (from the mock, real-data placeholders filled) + page CSS/JS. Real counts injected at build time; per-user personalization hydrated at runtime by small per-page JS calling `/api/me/*`.

### Page map

| Page | URL | Replaces? | Build data | Personalization (signed-in) |
|---|---|---|---|---|
| Certification | `/certifications/` (`certifications.html`) | replaces | `tracks.json` (5 tracks, free/Pro split), sample cert | `/api/me/tracks`, `/api/me/certificates` |
| Tools | `/tools/` (`tools/index.html`) | replaces (v3 rewrite of `gen_tools_landing.py`) | scan `tools/*.html` (27 tools, 6 cats); hero real t-test calc | none |
| Tutorials | `/tutorials/` | new (links to `/posts/`) | `curriculum-status.json`+`pseo-status.json` counts, `sidebar.json` 9 paths | `/api/me/reading` (resume) |
| Exercises | `/exercises/` | new | `exercise-manifest.json` (2,904/127), `tracks.json` | `/api/me/stats`, `/api/me/exercises` |
| Roadmap | `/roadmap/` | new | authored routes from `tracks.json` hubs + real slugs | `/api/me/tracks` ("you are here") |
| Topic (pilot Statistics) | `/statistics/` | new (reusable) | curated real slugs | minimal |

v3 masthead nav (Roadmap · Tutorials · Exercises · Tools · Certification) = these five section pages. Topic pages are sub-pages.

## Shared foundation (Phase 0)

- **`www/sections-v3.css`** — shared tokens (light + `html.dark`), self-hosted `@font-face` IBM Plex (reuse template `/www/fonts/ibm-plex/`, NOT Google CDN), reset/typography, masthead, `.btn`, `.reveal`, dark-mode, common primitives. Bespoke per-page section CSS stays inline.
- **`www/sections-v3.js`** — reveal-on-scroll IntersectionObserver + dark-mode toggle reconciled to site convention (`html.dark` + `localStorage['theme']`).
- **`_build/gen_sections.py`** — `render_head`, `render_masthead(active)` with REAL auth slots (`.auth-anon` Sign in / `.auth-user` avatar + `body.state-anon`/`state-pro` CSS, keep "Try Pro free"), footer = inject `_build/site_footer.html`, `render_scripts` (`auth-hydrate.js?v=10`, `sections-v3.js`, `consent-banner.js?v=2`, CF analytics beacon, deferred GA4, `signin-nudge.js?v=10`, + `saved-posts-button.js?v=6` on tutorials/exercises), `render_section` glue, sitemap registration.
- Wire into `_build/build_with_pagefind.py`/`build.py`; add URLs to sitemap; Pagefind index.

## Phases

- **Phase 0** — branch `sections-v3` + foundation (css/js/generator chrome, wire build, reconcile dark-mode/fonts/auth).
- **Phase 1** — Certification (flagship). Body from `certification-mock-v3` (strip DESIGN MOCK + Jordan persona; cert is a labeled sample). Ladder from `tracks.json` + free/Pro flag. `www/cert-page.js`: signed-in `/api/me/tracks`+`/api/me/certificates` progress/mint overlay; anon "start a track". Verify box → `/cert/<id>`. Output `certifications.html`. Verify e2e on preview.
- **Phase 2** — Tools. v3 rewrite of `gen_tools_landing.py`; real t-test calc hero; curated + 27-tool index; Pro band. Keep `/tools/`.
- **Phase 3** — Tutorials. New `/tutorials/`. WebR hero (`webr-init.js`); curated 5; 9 path cards real counts; browse-all → `/posts/`. `tutorials-page.js` resume via `/api/me/reading`.
- **Phase 4** — Exercises. New `/exercises/`. Real grader hero (`exercise-hub.js`); browse by track/difficulty. `exercises-page.js` XP/streak `/api/me/stats`, solved `/api/me/exercises`.
- **Phase 5** — Roadmap + Topic. New `/roadmap/` (routes from `tracks.json` + validated slugs; `roadmap-page.js` `/api/me/tracks`). New `/statistics/` topic pilot (reusable; distribution interactive via plain JS dnorm/pnorm).
- **Phase 6** — Cross-cutting + launch. Cross-links, sitemap/canonical/og/JSON-LD/breadcrumbs, Pagefind, middleware sanity, full QA matrix (page × anon/signed-in × light/dark × desktop/mobile × links). Merge to master only after CF preview sign-off (master deploys to GH Pages AND CF Pages prod).

## Conflicts / edge cases (must handle)

- Auth FOUC: hide personalization until `auth-hydrate` sets state; anon-default markup, enhance for signed-in.
- Dark-mode: convert mock `body.dark` → site `html.dark` + `localStorage['theme']`.
- Fonts: self-host (drop Google CDN). Footer: use `site_footer.html`.
- Remove all sample/fake data (Jordan, DESIGN MOCK, hardcoded progress).
- `tracks.json` needs a free/Pro tier flag (Fundamentals+Tidyverse free; Viz/Stats/ML Pro; Capstone Pro).
- Validate every roadmap slug exists on disk (fail loudly).
- Real counts at build from canonical JSON (not hardcoded).
- Replacing `/tools/` + `/certifications/` must preserve URLs/canonicals/inbound links (diff title/meta).
- Topic page parameterized for the other 8 paths later.
- Perf: WebR lazy; defer JS; self-host fonts. Pagefind index new pages; middleware doesn't block new dirs. A11y + mobile (760/480).

## Verification

Per push: CF preview `<hash>.r-statistics-co.pages.dev`. Local: `python _build/build_with_pagefind.py` then `python -m http.server` / `wrangler pages dev .`. Chrome automation: each page anon+signed-in, light+dark, desktop+480px, all links, each hero interactive. Confirm counts match JSON; `/api/me/*` drives personalization; old `/tools/`+`/certifications/` URLs+canonicals intact; article pages untouched. Merge only after full QA on preview.

## Key files

- New: `www/sections-v3.css`, `www/sections-v3.js`, `_build/gen_sections.py`, `www/cert-page.js`, `www/tutorials-page.js`, `www/exercises-page.js`, `www/roadmap-page.js`; outputs `certifications.html`, `tools/index.html` (rewritten), `tutorials/index.html`, `exercises/index.html`, `roadmap/index.html`, `statistics/index.html`.
- Modify: `_build/gen_tools_landing.py`, `_build/build_with_pagefind.py`/`build.py`, `functions/_data/tracks.json` (tier flag).
- Reuse: `_build/site_footer.html`, template `@font-face`+auth-slot CSS, `www/auth-hydrate.js`, `www/webr-init.js`, `www/exercise-hub.js`, `functions/cert/[id].ts`, `functions/_lib/cert-svg.ts`, `/api/me/*`.
- Reference only (do not ship): `_mocks/*-mock-v3.html`.
