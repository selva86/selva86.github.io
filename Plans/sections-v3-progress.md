# Sections v3 — progress tracker (RESUMABLE)

Plan: `Plans/sections-v3-implementation-plan.md`. Memory: `project_sections_v3`.
Branch: **`sections-v3`** (NEVER work on master; master deploys to GH Pages + CF Pages prod).

## ▶ RESUME HERE
**Current status:** Phases 0-3 COMPLETE (Foundation, Certification, Tools, Tutorials). Plus several user-requested fixes (see below). On branch `sections-v3`. Local screenshot tool is DOWN (harness `params.clip.scale` bug) so visual checks are on the CF preview `https://sections-v3.r-statistics-co.pages.dev/<page>`.
**Next action:** Phase 4 — Exercises. New `/exercises/`. Delegate `_build/sections/exercises-fragment.html` + `www/exercises-page.js` from `exercises-mock-v3.html` (real graded-exercise hero via exercise-hub.js patterns or a labeled sample; browse by track/difficulty). Add `build_exercises()` to gen_sections (`exercises/index.html`). Personalization: signed-in XP/streak via `/api/me/stats`, solved markers via `/api/me/exercises`. Real counts from `functions/_data/exercise-manifest.json` (2,904 exercises/127 hubs) + tracks.json.
**Pattern (cert/tools/tutorials):** delegate mock→fragment+page-JS extraction to a focused agent (3 markers CSS/SPRITE/BODY, body.dark→html.dark, strip head/masthead/footer/DESIGN-MOCK/scripts, `{{PLACEHOLDER}}` for data-driven bits, repoint `*-mock*` links to real URLs), then add `build_X()` to gen_sections (load fragment, fill placeholders, render_page). Counts: use COMMITTED data only (curriculum-status.json is gitignored/absent on CF). Tutorials total = `len(_posts/*.html)` (=1,267). Tools index data-driven from `gen_tools_landing.collect_tools`. ALWAYS audit links after build (grep `href="#"`, `*-mock*`, self-page anchors) - the agents miss a few in the body.
**User fixes applied (post Phase 1-2):** cert ladder cards cleaned (removed floating "proves you", "You can.." sentences, dropped per-card free/Pro tag); cert section asides moved from far-right hang to serif-italic subtitles under each heading; tools hero "Start with the t-test" -> /tools/t-test-calculator.html; cert leftover mock links fixed (pricing-mock, about-mock); cert ladder CTAs -> per-track first hub; **cert editable certificate name REMOVED** (misuse/screenshot-faking risk - cert-page.js mint logic deleted, name now fixed). Deferred verify page still pending (see below).
**Foundation notes:** fonts = Google Fonts (italics needed, not self-hosted) — deliberate deviation. Dark = `html.dark`+`localStorage['theme']`. Generator `_build/gen_sections.py`: `render_page()` (head+masthead+footer+scripts), `load_fragment(name)` (splits `_build/sections/<name>-fragment.html` on `<!--===CSS===-->/SPRITE/BODY` markers), per-section builders in `build_all()`. Wired into `build_with_pagefind.py` step 1b.
**Cert (Phase 1) notes:** page fragment `_build/sections/certification-fragment.html` (full mock CSS w/ body.dark→html.dark + cert body w/ `data-track` attrs on the 6 ladder cards + sprite). `www/cert-page.js` = mintCert (editable-name demo), doVerify (→ `/cert/<id>` on valid RST format), + signed-in personalization via `/api/me/tracks`+`/api/me/certificates` (anon = silent no-op, verified). DID NOT modify `tracks.json` (free-set hardcoded in cert-page.js: r-fundamentals + tidyverse-practitioner). Canonical preserved `/certifications` (no slash).

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

### Phase 1 — Certification (flagship) ✅ DONE
- [x] (skipped tracks.json edit — free-set hardcoded in cert-page.js instead; lower risk to live backend)
- [x] Author cert body -> `_build/sections/certification-fragment.html` (strip DESIGN MOCK + mock masthead/footer; cert = labeled sample; data-track attrs added)
- [x] `www/cert-page.js` (mintCert demo; doVerify → `/cert/<id>`; signed-in `/api/me/tracks`+`/api/me/certificates` overlay, anon no-op)
- [x] `build_certification()` in gen_sections.py generates `certifications.html` (canonical `/certifications` preserved)
- [x] Verified in-browser: anon, light+dark, full page, verify box, nudge, footer. (signed-in overlay = wired, anon-safe; needs a real session on CF preview to fully exercise. mobile = pending CF-preview QA in Phase 6.)

### Phase 2 — Tools ✅ DONE
- [x] `_build/sections/tools-fragment.html` (hero t-test calc + curated + `{{TOOL_INDEX}}` placeholder in `section#index` + Pro) ; `www/tools-page.js` (the calc)
- [x] `gen_sections.build_tools()` (data-driven 27-tool index from collect_tools + `_TOOLS_CAT_META`); `gen_tools_landing.render()` delegates to it. Title/canonical/desc preserved.
- [x] Verified structurally (27 cards/6 cats, JS valid, no leftovers). Visual = CF preview.

### Phase 3 — Tutorials ✅ DONE
- [x] `_build/sections/tutorials-fragment.html` (hero "Run it" demo + curated 5 + 9 path cards (->/posts/) + Pro band w/ labeled sample cert; `{{TOTAL}}` placeholder; resume strip `hidden` by default, persona removed). `www/tutorials-page.js` (hero animation + resume hydration).
- [x] `gen_sections.build_tutorials()` (`{{TOTAL}}`=len(_posts)=1,267; output tutorials/index.html, canonical /tutorials/)
- [x] Verified structurally (total filled, no leftovers, resume hidden, JS valid, path cards->/posts/). Visual=CF preview.
- [ ] FOLLOW-UP: path-card counts are currently static (from mock); make data-driven from sidebar.json item-counts-per-section later (deferred, low priority).

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

## Deferred follow-ups (do AFTER the 6 section pages are built, before/at launch)
- [ ] **Build a dedicated "Verify a credential" page** (e.g. `/verify/` or `/verify-credential.html`, same v3 chrome): a clean standalone lookup where anyone pastes an RST-YYYY-XXXXXX id and is taken to / shown the real `/cert/<id>` result. Then **update the certification page** so its "Verify a credential" hero button (currently `href="#verify"` anchoring the inline section) points to this new page. (Requested by Selva 2026-06-14: the verify-credential link should go to a separate page, not just an in-page anchor.) Decide whether to keep the inline verify section on /certifications as well or replace it with a link.

## Decisions log
- Nav: v3 masthead on new section pages only.
- Roadmap: static routes + signed-in `/api/me/tracks` (no new backend).
- Mapping: replace /tools/ + /certifications/; new /tutorials/ links to /posts/.
- Flagship: Certification first.
