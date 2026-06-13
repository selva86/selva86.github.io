# Sections v3 — progress tracker (RESUMABLE)

Plan: `Plans/sections-v3-implementation-plan.md`. Memory: `project_sections_v3`.
Branch: **`sections-v3`** (NEVER work on master; master deploys to GH Pages + CF Pages prod).

## ▶ RESUME HERE
**Current status:** Phase 0 COMPLETE + verified (foundation renders: masthead, anon Sign-in via auth-hydrate, dark mode, reveal, italic serif, footer). On branch `sections-v3`.
**Next action:** Phase 1 — Certification. Add free/Pro tier flag to `functions/_data/tracks.json`, then author the cert page body in `_build/gen_sections.py` (from `certification-mock-v3.html`), build `certifications.html`, write `www/cert-page.js`.
**Foundation notes:** fonts = Google Fonts (italics needed, not self-hosted) — deliberate deviation. Dark = `html.dark`+`localStorage['theme']`. Generator = `_build/gen_sections.py` (`render_page()` does head+masthead+footer+scripts; add per-section builders to `build_all()`). Wired into `build_with_pagefind.py` (step 1b). Smoke test verified at `/_sections-smoketest.html` (deleted).

## How to resume on a fresh session
1. Read `Plans/sections-v3-implementation-plan.md` (full plan) + this file.
2. `git -C D:\09_rstatisticsco\selva86.github.io branch --show-current` (should be `sections-v3`).
3. Continue at the first unchecked step below. Verify each on the CF preview before moving on.
4. Reference mocks: `_mocks/*-mock-v3.html` (exact look/feel; do NOT ship the mock files).

## Checklist

### Phase 0 — Branch + foundation ✅ DONE
- [x] Create/switch to branch `sections-v3`
- [x] `www/sections-v3.css` (tokens light+`html.dark`, reset/type, masthead, auth slots, .btn, .reveal, dark-mode, primitives). NOTE: fonts via Google Fonts (italics not self-hosted).
- [x] `www/sections-v3.js` (reveal-on-scroll IO + dark-mode toggle → `html.dark`+`localStorage['theme']`)
- [x] `_build/gen_sections.py` chrome (render_page / render_masthead w/ real auth slots / footer inject / render_scripts; NAV const; ANALYTICS+FOUC consts)
- [x] Wire generator into `_build/build_with_pagefind.py` (step 1b, before Pagefind)
- [x] Verify foundation renders (smoke test): masthead+anon Sign-in+dark+reveal+italic+footer all confirmed in browser. (local server only; CF preview comes after first commit push)

### Phase 1 — Certification (flagship)
- [ ] Add free/Pro tier flag to `functions/_data/tracks.json`
- [ ] Author cert body from `certification-mock-v3` (strip DESIGN MOCK + Jordan; cert = labeled sample; ladder from tracks.json)
- [ ] `www/cert-page.js` (anon "start a track"; signed-in `/api/me/tracks`+`/api/me/certificates` overlay; verify box → `/cert/<id>`)
- [ ] Generate `certifications.html` (keep `/certifications/` URL + canonical)
- [ ] Verify e2e: anon, signed-in, light+dark, mobile, all links, cert verify flow

### Phase 2 — Tools
- [ ] v3 rewrite of `_build/gen_tools_landing.py` (real t-test calc hero, curated, 27-tool index, Pro). Keep `/tools/` URL+canonical.
- [ ] Verify

### Phase 3 — Tutorials
- [ ] New `/tutorials/` (WebR hero, curated 5, 9 path cards real counts, browse-all → `/posts/`)
- [ ] `www/tutorials-page.js` resume via `/api/me/reading`
- [ ] Verify

### Phase 4 — Exercises
- [ ] New `/exercises/` (real grader hero, browse by track/difficulty)
- [ ] `www/exercises-page.js` XP/streak `/api/me/stats`, solved `/api/me/exercises`
- [ ] Verify

### Phase 5 — Roadmap + Topic
- [ ] New `/roadmap/` (routes from tracks.json + validated slugs; `www/roadmap-page.js` `/api/me/tracks`)
- [ ] New `/statistics/` topic pilot (reusable; distribution interactive plain JS dnorm/pnorm)
- [ ] Verify

### Phase 6 — Cross-cutting + launch
- [ ] Cross-links (5 nav targets), sitemap/canonical/og/JSON-LD/breadcrumbs
- [ ] Pagefind index + middleware sanity (new dirs not blocked; `.html` intact)
- [ ] Full QA matrix (page × anon/signed-in × light/dark × desktop/mobile × links × hero interactions)
- [ ] No regressions (old `/tools/`+`/certifications/` URLs+canonicals; article pages untouched)
- [ ] Merge `sections-v3` → master after CF preview sign-off

## Decisions log
- Nav: v3 masthead on new section pages only.
- Roadmap: static routes + signed-in `/api/me/tracks` (no new backend).
- Mapping: replace /tools/ + /certifications/; new /tutorials/ links to /posts/.
- Flagship: Certification first.
