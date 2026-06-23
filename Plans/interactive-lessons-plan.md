# Interactive Lesson-Mode: separate `lessons/` pipeline + ship the RF course + design the all-courses factory

## Context
We built and verified a 3-lesson interactive course, "Random Forests, from the ground up," as standalone mocks (`_mocks/rf-course-lesson{1,2,3}.html`): a full-screen step-player with gated quizzes, graded try-its, between-lesson breaks, a cert finale, and four real in-browser widgets (CART overfit canvas, forest-averaging boundary, decorrelation toggle, OOB tuner). The owner wants to (1) **productionize** lesson-mode through the real build pipeline, and (2) **scale** it so every curriculum topic becomes a multi-lesson course, without context exhaustion or quality loss.

**How `template.html` works (owner's question):** it is the single shared shell every published page is poured into. `build.py` reads each page's frontmatter and fills placeholders, conditionally injecting per-page features from booleans — the exact mechanism `webr`/`mathjax`/`post_type:EX` already use (`page_html.replace('{{WEBR_BODY}}', make_webr_body_block(...) if webr else '')`). Lesson-mode is one more such feature, switched on by `post_type: LESSON`; pages without it are byte-identical to today (empty placeholder = zero overhead).

**Locked decisions:**
- **Separate source dirs:** lessons live in **`lessons/`** (markdown) + **`_lessons/`** (HTML fragments), parallel to `posts/`+`_posts/`, so lesson source never mixes with post source. Both committed.
- **Flat root output:** built lesson pages go to repo root like every other page (`/RF-Course-Lesson-1.html`). This keeps `build.py`'s (non-depth-aware) asset links, the grading hub-derivation, and sitemap/feed working unchanged. Source is separated; generated `.html` co-locates at root as all built artifacts do.
- **Every topic is a multi-lesson course** (landing page + N lesson pages), like the RF module.
- **Positional free/Pro gate:** lesson-mode exists on every lesson but is free only for (a) all sections of Level 1 (R Foundations) and (b) the first section of every other level; the rest is Pro. Rule from `curriculum_id` "L.S.P": **free if level==1 OR section==1, else pro.**
- Scope: **build Phase 1** (infra + ship the RF course live as the proof); **design Phase 2** (the factory) as a roadmap.

**Decisive reuse finding:** the exercise-grading backend is authorized by a build-time manifest keyed on `hub_slug = file stem` (`build_exercise_manifest.py` → `attempt.ts`, which rejects unknown ids and awards XP from baked difficulty). Because lesson pages output to root, `hub_slug = stem = URL segment`, so a lesson reuses the **entire grading/XP/streak/backfill backend with ZERO new server code** — the one required change is making the manifest builder also scan `_lessons/`.

Constraints (persist): no em dashes anywhere; never name "WebR" in user-facing text (label "Interactive R"); never `git add -A` (stage explicit paths); UI/template changes go through a branch + CF preview before master; bump `?v=N` on hand-edited `/www/*`.

---

## Architecture: parallel source pipeline, shared assembler, flat output
```
lessons/<slug>.md  --(_build/md2lesson.py, NEW)-->  _lessons/<slug>.html  --\
                                                                            >-- build.py --> /<slug>.html (root)
posts/<slug>.md    --(_build/md2html.py)         -->  _posts/<slug>.html   --/
```
- **Separate converter `md2lesson.py`:** lesson markdown has a different structure (`=== step ===` + `::` directives); isolating it protects the 1,300-page post build from lesson-parser bugs. Writes to `_lessons/`.
- **Shared assembler `build.py`:** extended to enumerate BOTH `_posts/` and `_lessons/`, writing to root. Reusing it (not a separate `build_lessons.py`) avoids duplicating template-fill / asset-href / JSON-LD / sitemap / feed. The `post_type: LESSON` branch supplies the lesson shell.
- **Course landing = a normal post** (`post_type: C`) in `posts/`: indexable SEO hub, appears in the sidebar under its track, links to (launches) the lesson pages. Lessons themselves are NOT in the sidebar.

---

## Phase 1 — Productionize lesson-mode and ship the RF course live

### 1. Directory layout & content model
- `lessons/RF-Course-Lesson-{1,2,3}.md` -> `_lessons/RF-Course-Lesson-{1,2,3}.html` -> `/RF-Course-Lesson-{1,2,3}.html`.
- `posts/Random-Forest-Course.md` (landing, `post_type: C`) -> `/Random-Forest-Course.html`, added to `sidebar.json` under Machine Learning.
- Lesson slugs MUST be globally unique vs posts (shared root + shared grading-hub namespace): use the course-prefixed convention (`RF-Course-Lesson-N`). Enforced by a collision check (below).

### 2. Authoring format (one markdown file per lesson)
- Frontmatter (flat strings): `post_type: LESSON`, `curriculum_id`, `webr: true`, `course_id`, `course_title`, `course_lesson`, `course_total`, `course_landing`, `course_next`, `course_prev`, optional `lesson_access` override. Documented in `_build/frontmatter-spec.md`.
- Body = ordered steps delimited by `=== step === <type>` (types: `concept | widget | quiz | tryit | complete`) with `::` directives (`::eyebrow`, `::widget <type> {json}`, `::quiz {json}` + `- option ::ok/::no`, `::check {json}`, `::solution`). Ordinary markdown between fences reuses existing helpers for prose / ```r blocks / callouts / tables / `<details>`.

### 3. New converter `_build/md2lesson.py`
- Splits the body on `=== step ===` (skipping ```` ``` ```` code-fence interiors), parses `::` directives, emits one `<section class="lesson-step" data-step data-step-type [data-gate]>` per step. Imports md2html's inline/code/callout helpers (do not fork them).
- Gradable steps (`gate:true`) ALSO emit the nested exercise contract `<section class="exercise" data-exercise-id="<slug>-step<N>" data-grade-mode data-difficulty>`.
- Widget steps emit `<div class="lesson-widget" data-widget-type data-widget-config='{...}'>` + a `<noscript>` static fallback.
- Carries lesson frontmatter through to `_lessons/<slug>.html`; collision-checks the stem against `posts/`, `_posts/`, `_lessons/`, root `*.html` and aborts on clash.

### 4. Page assembly `build.py` (dual-dir, flat output)
- Add `LESSONS_DIR = _lessons`; enumerate `_posts/*.html` + `_lessons/*.html`; output every page to root (existing `output_path = REPO_ROOT/<file>` logic, unchanged).
- Mirror the EX placeholder block (~lines 1353-1364): `_is_lesson` -> fill `{{LESSON_HEAD}}`/`{{LESSON_BODY}}` (-> `www/lesson-mode.css/js` + `lesson-widgets.bundle.js`), extend the WEBR gate to lessons, inject `{{BODY_MODE_CLASS}}` (` lesson-mode`) + `{{LESSON_ACCESS}}` (`data-lesson-access`). Register new assets in `minify_assets` + `compute_asset_hrefs`.
- `lesson_access_from_curriculum(cid)`: `free if level==1 or section==1 else pro` (fail-open to free on malformed id); `lesson_access` frontmatter overrides.
- Add an explicit cross-dir slug-collision guard at enumeration time.

### 5. `template.html` (3 lines; reuse the shell, do NOT make a second template)
`<body{{BODY_MODE_CLASS}}{{LESSON_ACCESS}}>`, `{{LESSON_HEAD}}`, `{{LESSON_BODY}}`. A second template would re-implement the SEO `<head>` + the unconditional auth/masthead script stack (lines ~924-928) that gives Pro gating + sign-in for free. `body.lesson-mode` CSS hides masthead/sidebar/TOC/byline/footer but keeps auth spans in the DOM; player chrome (exit / step-counter / progress / Back-Continue) is injected at runtime by `lesson-mode.js`.

### 6. SEO / crawlability (progressive enhancement)
All steps render server-side as a flat crawlable document; widget mounts carry a `<noscript>` fallback. `lesson-mode.js` adds `body.lesson-js-ready` and CSS collapses to one-step-at-a-time; no-JS shows the whole lesson. NOT `noindex`. Course landings + free lessons fully indexable; Pro lessons keep the body server-rendered but runtime preview-gate and declare it honestly in JSON-LD (`isAccessibleForFree:false` + free-preview `hasPart`).

### 7. Gating (build-time derive, runtime enforce; reuse the Pro signal)
`data-lesson-access` baked at build; `lesson-mode.js` reads it and, for `pro` + non-pro user, locks steps after a 2-step preview and inserts a paywall CTA to `/pricing.html`, using existing `body.pro` + `auth-hydrated`. No new auth, no new flag. (RF is in the ML level -> Pro, exercising the gate; the free landing exercises the free path.) **Verify** level 1 == R Foundations in curriculum_id numbering.

### 8. Grading reuse (zero new backend) + the REQUIRED pipeline fixes
- Each lesson = an exercise hub (`hub_slug = stem`); gradable steps emit the exercise contract. `lesson-mode.js` owns the quiz/try-it UI + gating and on pass calls `POST /api/exercise/<hub>/<id>/attempt` with `window.__auth.getAccessToken()`, reusing `/api/exercise/backfill` + `/api/me/exercises`. **Never load `exercise-hub.js` on LESSON pages** (its accordion chrome fights the player). Extract shared helpers (`reportSolve`/`backfillIfNeeded`/`hydrateSolvedFromServer`/`hubSlugFromPath`) into `www/exercise-api.js` that both load.
- **FIX 1 (manifest glob):** `build_exercise_manifest.py` (~line 82) globs `_posts/*.html` only; add `_lessons/*.html`. Without it every lesson step POST 400s and XP is silently lost. (hub_slug stays `.stem`; flat output keeps client `hubSlugFromPath()` working.)
- **FIX 2 (middleware denylist):** `functions/_middleware.ts` add `_lessons` to `BLOCK_DIRS` and `lessons` to the md rule (`/^\/(?:posts|lessons)\/.+\.md$/i`) so `lessons/*.md` + `_lessons/*.html` never serve; built `/<slug>.html` still serves.
- **FIX 3 (auto-link exclusion):** lesson pages output to root, so `auto_link.py`'s root scan WOULD inject inline links into the player. Skip pages carrying the lesson marker (`lesson-mode` body class / `data-lesson-access`).
- Step gating + resume = client localStorage `rsc-lesson-v1:<pathname>`; add it to the `auth-hydrate.js` signOut cleanup loop (else step position leaks across accounts).

### 9. Widget library seed
`www/lesson-widgets/`: `index.js` (registry `window.LessonWidgets.register(type, mountFn)` + `mountAll(stepEl)`) + `decision-region.js` (reference type), `forest-averaging.js`, `decorrelation.js`, `oob-tuner.js`. `build.py` concatenates to a hashed `lesson-widgets.bundle.js` (same trick as `build_editor_bundle()`). `lesson-mode.js` calls `mountAll(stepEl)` when a step becomes visible (canvases must size when shown). Each widget: self-contained IIFE, `mount(el,cfg)` contract, deterministic seeded data (port `mulberry32`/`gauss`/`blob`/`build`/`predict` from the mocks), idempotent. The decision-region config schema (dataset/control/min/max/start/showTest/noise/seed/labels/metrics) is the pattern Phase 2's generator composes against.

### Files (Phase 1)
- **Create:** `lessons/RF-Course-Lesson-{1,2,3}.md`; `posts/Random-Forest-Course.md`; `_build/md2lesson.py`; `www/lesson-mode.css`, `www/lesson-mode.js`, `www/exercise-api.js`; `www/lesson-widgets/{index,decision-region,forest-averaging,decorrelation,oob-tuner}.js`; `_build/lesson-contract.md`.
- **Modify:** `_build/build.py` (dual-dir enumerate + LESSON injectors/placeholders + `lesson_access` + WEBR gate + asset registration + collision guard); `_build/template.html` (3 lines); `_build/build_exercise_manifest.py` (add `_lessons` glob — REQUIRED); `functions/_middleware.ts` (denylist — REQUIRED); `_build/auto_link.py` (skip lesson pages — REQUIRED); `www/auth-hydrate.js` (signOut cleanup, one line); `www/sidebar.json` (landing under ML); `_build/frontmatter-spec.md`.
- **Deliberately NOT changed (lessons excluded by design):** `sync_registries.py` (keeps scanning `_posts/` only; lessons aren't in the curriculum sidebar/curriculum-status — the landing post carries sidebar presence); `fr_cards.py`/FR system (lessons have no `fr_parent`); compendium/`gen_sections.py` stats (lessons aren't compendium posts). `attempt.ts`/`exercises.ts`/`db.ts`/`schema.sql`/`flags.ts` untouched.

### Phase 1 verification
1. `python _build/md2lesson.py lessons/RF-Course-Lesson-1.md` then `python _build/build.py`; confirm `_lessons/` fragment has `.lesson-step` + nested `section.exercise` ids; the built ROOT page is a valid template page (head/JSON-LD/auth stack present).
2. Run the manifest builder; confirm `functions/_data/exercise-manifest.json` has `RF-Course-Lesson-1-step<N>` under hub `RF-Course-Lesson-1`. **Verify CI (`build_with_pagefind.py`) actually runs the manifest builder** — if not, add it (else prod grading 400s for lessons AND existing exercises).
3. On CF preview: `/lessons/RF-Course-Lesson-1.md` + `/_lessons/RF-Course-Lesson-1.html` -> 404; `/RF-Course-Lesson-1.html` -> 200.
4. Branch + push -> CF preview. Headless (Playwright): steps advance one at a time, quiz/try-it gate Continue, each widget draws + computes (port the mock verification), no-JS shows full content; confirm auto_link did NOT inject into the lesson page.
5. Pro gate: logged-out on a Pro lesson -> 2-step preview + paywall; Pro account unlocks; XP POSTs and shows in the avatar; sign-out clears `rsc-lesson-v1:`.
6. SEO: view-source shows full step content server-rendered; canonical/OG/JSON-LD correct (`isAccessibleForFree:false` on Pro lessons); page in sitemap.
7. Eyeball on preview, then merge to master.

---

## Phase 2 — The all-courses factory (DESIGN ONLY; build after Phase 1 is validated live)

Principle (answers the scaling + quality worry): **the LLM must never author bespoke simulation code per topic.** Prose scales; novel canvas physics does not, and a broken sim still renders (a word-count gate can't catch it). The generator SELECTS + CONFIGURES widgets from the library; novel-widget topics are flagged for hand-authoring, never faked.

Layers (each proven by an existing analogue; all read `lessons/`, write `_lessons/`, publish to root):
1. **`Scripts/batch_lessons.py`** — clone `batch_pseo.py`: a FRESH `claude -p "/write-lesson <slug>"` subprocess per lesson (clean context each = the core fix for exhaustion), validator -> write -> quality-gate -> publish, atomic `lessons-status.json` (gitignored), lock file, resumability, `--sync-every N`, stash-on-dirty guard.
2. **`/write-lesson` skill** — multi-pass like `/write-pseo-v2`, non-interactive. Pass 0 derives metadata deterministically from `_build/lessons-derive.md` (per-level/section rules). Emits lesson markdown (steps + quiz/try-it + `::widget` configs chosen from the catalog), not raw JS. Writes `lessons/<slug>.md`.
3. **`/publish-lesson` skill** — clone `/publish-post` for lessons/_lessons/root paths; runs `md2lesson.py` -> `build.py` -> manifest rebuild -> stage explicit paths -> commit. (publish-post is hardcoded to posts/_posts, so a lesson variant is needed.)
4. **Widget library (expanded)** — grow `www/lesson-widgets/` to ~12-20 configurable ML/stats types + a catalog file the skill reads. The moat and the quality lever.
5. **`Scripts/lesson_quality_check.py`** — deterministic checks (frontmatter, steps present, every `::widget` type exists, every gradable step has a valid exercise id + collision-free slug) PLUS a **Playwright smoke test** (page loads, every step advances, each gate blocks until passed, each widget canvas draws + metrics compute, no console errors). Catches broken interactives text checks can't. Fail -> retry (max 2) -> manual_review.
6. **Specs/trackers** — `lessons-status.json` (gitignored, like `curriculum-status.json`), `_build/lessons-derive.md`, `_build/lessons-formatting.md`, `_build/lesson-contract.md` + `_build/lesson-pedagogy.md` (both built in Phase 1; the quality gate + skill enforce them).

**Course planning = curriculum-doc-driven (DECIDED 2026-06-23).** A committed, hand-curated `Plans/lessons-curriculum.md` is the SSOT for WHAT to build: one entry per course (slug, title, track/`curriculum_id`) with an ordered lesson list (each lesson: slug, title, one-line focus, signature widget). `Scripts/build_lessons_tracker.py` scans it -> `lessons-status.json` (mirrors `build_pseo_tracker.py` -> `pseo-status.json`). The factory executes the doc; it does not invent the arc. `/write-lesson` reads its lesson's focus from the doc. Operational trigger for a new topic: (1) add the course + lesson arc to `Plans/lessons-curriculum.md`, (2) `python Scripts/build_lessons_tracker.py`, (3) `python Scripts/batch_lessons.py --slug <course>`. No blog post is required (the landing page is generated; an existing post is an optional source/cross-link only).

Not chosen: (a) in-context subagents as the scaling unit (shared context -> exhaustion across hundreds of courses; subagents may help WITHIN one lesson's generation, e.g. a fresh gap-critic for R8, but the cross-topic unit is a fresh process). (b) auto-planning the lesson arc from the topic (rejected in favour of the curated curriculum doc for predictability + reviewability).

---

## Issues, gaps, conflicts & edge cases (now and future)

**Blockers — silent failure if missed:**
- **Manifest must scan `_lessons/`** (Fix 1) or every lesson quiz/try-it POST 400s -> XP silently lost.
- **CI may not build the manifest:** `build_with_pagefind.py` runs build.py / gen_sections / tools-sitemap / pagefind but was NOT observed to run `build_exercise_manifest.py`. Verify; if absent, no lesson (or exercise) step id is authorized in prod. Add it to CI.
- **auto_link.py would inject into lesson pages** (root output + root-level scan) -> broken inline links inside the step-player. Must skip lesson pages (Fix 3).
- **Source leak** if the middleware denylist isn't updated (Fix 2) -> `lessons/*.md` / `_lessons/*.html` served publicly.
- **Slug collision post<->lesson** (shared root + shared grading-hub namespace): `posts/X.md` and `lessons/X.md` both build `X.html` (one clobbers the other) and grading hubs collide. Enforce a cross-dir collision check in md2lesson.py + build.py; use course-prefixed slugs.

**Correctness / UX edge cases:**
- **`=== step ===` inside a code fence** must not split — pre-pass skips fence interiors.
- **Canvas sized while hidden = 0** — mount/repaint the active step's widgets on step change.
- **FOUC / flash of locked content** — pre-paint inline script sets `body.lesson-js-ready`; default-lock Pro lessons until `auth-hydrated` proves pro (same trade-off the avatar makes).
- **localStorage leak across accounts** — add `rsc-lesson-v1:` to signOut cleanup.
- **curriculum_id level mapping** — confirm level 1 == R Foundations before trusting the gate; `lesson_access` is the override.
- **Double-grading UI** — never load `exercise-hub.js` on LESSON pages.
- **SEO cloaking perception** on Pro lessons — declared paywall JSON-LD; identical preview for bot and logged-out human.

**Future / scale considerations:**
- **Root-dir growth:** all-courses x N lessons adds thousands of built `.html` at root (already 1,300+). Acceptable, but course-prefixed naming is mandatory; consider an index for tooling.
- **`/lessons/` URL migration** (if ever wanted) is a separate deliberate project: depth-aware asset hrefs in build.py, the `hubSlugFromPath` regex, sitemap/feed/registry URLs, 301s. The middleware `.html` rewrite already handles subdirs. Not now.
- **Per-script `_posts` assumptions:** ~8 `Scripts/*.py` glob `_posts/`; they silently exclude lessons (correct for most), but audit each before reusing one on lessons.
- **FR / further-reading:** lessons don't participate (no `fr_parent`); a post may auto-link to a course landing (landing is a post). Fine.
- **Pagefind** indexes root `.html` -> free + Pro-preview lessons indexed automatically; acceptable.
