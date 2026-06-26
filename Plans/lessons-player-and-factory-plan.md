# Interactive Lessons v2: Course Player + No-Blank-Slide Guarantee + Phase 2 Factory

One master plan for three tied workstreams: (A) a course player (lesson rail + watchable pane + catalog), (B) a layered gate (deterministic lexicon check + LLM judge + human review) that makes a blank visualizable slide effectively impossible to ship, (C) the Phase 2 factory that mass-produces lessons. They share one keystone: a single course data layer derived from the existing roadmap curriculum.

Status: PLAN, hardened 2026-06-24 after a code-grounded review (findings folded in: `data-course-id` is not injected today, done-state needs a real mechanism, RM2 is client JS not machine-readable, the gate must be scoped to avoid blast radius, the "deterministic guarantee" was overstated, and the free/Pro conflict is resolved). Companion docs: `Plans/interactive-lessons-plan.md` (Phase 1 record + original Phase 2 design), `_build/lesson-pedagogy.md` (quality rules), `_build/lesson-visual-catalog.md` (visual menu), `_build/lesson-contract.md` (DOM contract).

---

## What exists today (ground truth from the code)

- **Player (Phase 1, on branch `lesson-mode-phase1`):** `www/lesson-mode.js` builds a full-screen `.lm-app` overlay (top bar: exit->landing, title, step counter, "Get certified"; segmented progress; stage; Back/Continue). It knows ONLY `courseTitle / courseLanding / courseNext / coursePrev / courseLesson / courseTotal` from `body.dataset`. **It has no list of sibling lessons, no rail, and resume is per-lesson** (`rsc-lesson-v1:<pathname>`).
- **Pipeline:** `lessons/*.md -> md2lesson.py -> _lessons/*.html -> build.py (post_type LESSON) -> /<slug>.html` (flat root). Grading reuse via `hub_slug == stem`. 9 widgets in `www/lesson-widgets/`. RF course is free and live on the preview.
- **Quality:** `_build/lesson-pedagogy.md` (R1-R11, R6 = show-don't-tell) + `_build/lesson-visual-catalog.md` exist. **`Scripts/lesson_quality_check.py` does NOT exist yet** (specified only).
- **Roadmap / catalog (already live):** `www/roadmap-curriculum.js` (`RM2`) is the curriculum SSOT: tracks -> sections `S(n, free, title, outcome, items[], hub, tool)` where `items` are lesson titles; a `links{}` overlay maps titles to existing post URLs; access model baked into the renderer. Rendered via `_build/sections/roadmap-fragment.html` + `www/roadmap-*.js/.css`. Unmatched free lessons route to `/tutorials/`; Pro routes to enrollment.
- **Factory:** none of `Plans/lessons-curriculum.md`, `Scripts/build_lessons_tracker.py`, `Scripts/batch_lessons.py`, `Scripts/lesson_quality_check.py`, `/write-lesson`, `/publish-lesson` exist. Phase 2 is design only.

## Locked decisions (this session)

- Scope = player + gate + Phase 2, one plan. Rail = the current course's lessons (roadmap order) + the roadmap as catalog.
- Architecture = SEO-preserving per-lesson pages with a shared course rail; NOT a single-page app. Soft (no-reload) navigation is a later enhancement, never a dependency.
- Constraints (persist): no em dashes anywhere; never name WebR in user-facing text; never `git add -A` (stage explicit paths); UI/template changes go branch -> CF preview -> eyeball -> merge; bump `?v=N` on hand-edited `/www/*` (content-hashed assets like lesson-mode.* auto-bust).

---

## Keystone: one course data layer (`courses.json`)

The single source the rail, the catalog, and the factory all read. Built artifact, public, fetched at runtime (NOT baked into pages, so editing it does not trigger a 1,300-page rebuild).

Shape (per course):
```
{ course_id, title, landing, track, curriculum_id, access_default,
  lessons: [ { slug, title, order, access, built } ] }
```

- **Produced by** `Scripts/build_lessons_tracker.py` from the curriculum SSOT (below) + an `_lessons/*.html` scan (which lessons are actually built). NOTE: RM2 (`roadmap-curriculum.js`) is client-side JS (an IIFE), NOT machine-readable from Python; the tracker needs an RM2 -> JSON export step first (a Node one-liner that evaluates RM2 and dumps `www/roadmap-data.json`, run in the build). **Interim (so the player ships now): `courses.json` is hand-seeded with the RF course; the tracker generalizes it from RM2 in Workstream C.**
- **Curriculum SSOT decision (critical):** do NOT create a parallel `Plans/lessons-curriculum.md`. The roadmap `RM2` (`roadmap-curriculum.js`) is already the live curriculum; a second list will drift from it. A "course" is a roadmap node flagged interactive; its lessons derive from that node. The factory reads RM2 (or a JSON derived from it), so roadmap, catalog, player, and factory share ONE source. `lessons-derive.md` holds the node -> {course_id, lesson slugs, access} rules.
- **Completion is never baked** (it is per-user) and needs a real mechanism, not a hand-wave. "Lesson done" = all its gated steps solved. The existing endpoint `/api/me/exercises?hub=<slug>` is PER-HUB and each lesson is its own hub, so there is no single all-hubs call; the rail uses: (a) a client `rsc-course-v1:<course_id>` completion set for instant state (covers logged-out), plus (b) for signed-in users, a per-lesson reconcile via the existing per-hub endpoint (small N = lessons in a course; the player already knows each lesson's gated-step ids). **No new backend for the rail.** A global all-hubs endpoint is deferred (only a cross-course dashboard would need it).

---

## Workstream A - Course Player (rail + pane + catalog)

0. **Step 0 (required wiring):** `build.py` does NOT emit `data-course-id` today (only title/lesson/total/landing/next/prev, at build.py:1449). Add `('data-course-id', 'course_id')` to that injection loop so `ds.courseId` exists for the rail to key on.
1. **Rail data:** `lesson-mode.js` fetches `courses.json` once, selects the slice for `ds.courseId`, renders the rail. Fallback if the fetch fails: rail collapses to the existing next/prev (already in `dataset`), so no hard dependency.
2. **Two-pane shell:** `.lm-app` gains a left `.lm-rail` (lessons in order: current highlighted `aria-current`, done ticks, Pro lock badges, "2 / 3 done") + the existing `.lm-stage` on the right. Rail item click = real navigation to that lesson page (soft-nav later).
3. **Fullscreen + reading width:** keep the overlay; add an explicit fullscreen toggle and a rail collapse control.
4. **Resume (course level):** new `rsc-course-v1:<course_id>` records the last lesson; per-lesson step resume already exists. "Continue where you left off" entry from the landing + catalog.
5. **Mobile:** rail becomes a drawer (hamburger) / top dropdown; pane is full width.
6. **Catalog = the roadmap:** mark roadmap items that are built interactive courses (badge "Interactive course") and route them into the player (lesson 1 or the landing) instead of `/tutorials/`. Driven by `courses.json` overlay on the existing roadmap renderer. Optionally a simple `/courses.html` index later.
7. **a11y:** rail is a `nav` landmark; focus moves to the step heading on change; full keyboard nav; arrow keys already wired.

## Workstream B - The no-blank-slide guarantee (the gate)

Honest framing: a keyword lexicon cannot be a perfect guarantee on its own (it catches a blank step that mentions a trigger word, not a visualizable idea phrased without one). The real guarantee is layered: a deterministic lexicon net (blocking) + an LLM judge (catches what the lexicon misses, probabilistic) + human review. Wire the deterministic net everywhere a lesson can change; the judge runs in the factory and pre-merge.

1. **`Scripts/lesson_quality_check.py` (deterministic):** cover has a visual (R1); **visual coverage (R6)** = for each `concept`/`widget` step, tokenize its prose; if it hits the visualizable lexicon (`_build/lesson-visual-catalog.md`) and has no `.lesson-widget` / `<img>` / inline `<svg>` AND no explicit `prose-only` marker, FAIL; >=1 try-it + >=1 quiz; 3-5 references that resolve; every `::widget` type exists in the bundle; every gated step has a valid, unique exercise id present in the manifest; `mathjax:true` when formulas are present; frontmatter complete; slug collision-free.
2. **Escape hatch (prevents false failures):** a step may carry `::prose-only <reason>`; the check records it and skips that step. The reason is required, so "blank" is always a deliberate, logged choice (matches R6).
3. **Wiring (scoped to avoid blast radius):** HARD at publish time, per lesson - `/publish-lesson` refuses to publish on fail and `batch_lessons.py` marks `quality_failed` and never commits it. ADVISORY in the site build (`build_with_pagefind.py`): it logs failures but does NOT fail the whole deploy - there is no PR/branch-protection here (pushes go straight to master), so one bad lesson must never block all 1,300 pages from deploying. Net: a lesson cannot be PUBLISHED with a blank lexicon-step, and the site build stays resilient.
4. **Plan-time check:** the plan file must list a visual per teaching step; a planning assertion (in `/write-lesson` Pass 0/PLAN) rejects an unjustified blank before authoring.
5. **Probabilistic layers on top (not blocking-by-themselves):** LLM-judge (visual fit, from-scratch, depth ladder, gap critique) + Playwright headless (every step advances, gates block until passed, every widget mounts and computes, no console errors, no-JS shows content, Pro gate behaves).
6. **Honest boundary:** the deterministic net guarantees a visual exists on every step whose prose matches the lexicon; a visualizable idea phrased without a trigger word is caught by the LLM judge (probabilistic), then human review. So this is near-airtight in practice, not a pure-deterministic absolute. Whether the visual is the BEST one is judge + human, never a hard gate.

## Workstream C - Phase 2 Factory (extends the original design)

1. **`Scripts/build_lessons_tracker.py`** -> `courses.json` + `lessons-status.json` (resumable tracker, gitignored), from RM2 + `_lessons/` scan.
2. **`/write-lesson` skill:** non-interactive, multi-pass. Pass 0 derives metadata from `_build/lessons-derive.md` (per track/section; access from the SINGLE positional rule, see conflict C1). PLAN gate writes `post_plans/<slug>_lesson-plan.md` incl. the per-step visual map. BUILD emits lesson markdown (steps, cover visual, depth-ladder prose + MathJax, widgets SELECTED from the catalog, quizzes/try-its, references). Never authors widget JS; a novel widget is flagged for hand-build.
3. **`/publish-lesson` skill:** `md2lesson -> build.py -> build_exercise_manifest -> build_lessons_tracker (courses.json refresh) -> generate landing + sidebar entry -> commit explicit paths`. (clone `/publish-post`, retargeted to lessons/_lessons/root.)
4. **`Scripts/batch_lessons.py`:** fresh `claude -p` subprocess per lesson (clean context = the scaling fix); validate -> write -> quality-gate -> publish; `lessons-status.json` state; lock file; `--sync-every`; stash-on-dirty guard. (clone `batch_pseo.py`.)
5. **Widget library growth:** catalog-driven; grow toward ~15-20 reusable types as courses demand them.
6. **Specs:** `_build/lessons-derive.md` (derivation), reuse `lesson-pedagogy.md` + `lesson-visual-catalog.md` + `lesson-contract.md`.

---

## Sequencing (each ships independently behind branch -> preview -> merge)

1. **Keystone:** `courses.json` + `build_lessons_tracker.py`, sourced from RM2. Unblocks A and C.
2. **Workstream A** (player rail + catalog wiring): visible value on the RF course immediately.
3. **Workstream B** (the gate): lock quality BEFORE scaling.
4. **Workstream C** (factory): scale, with the gate enforced.
5. **Later:** soft-nav, nice-to-haves (outline panel, notes, cert hook), the build-speed incremental-rebuild fix.

## Effort (heavy reuse; rough)

- Keystone for RF (hand-seed `courses.json` + `data-course-id` injection): ~0.5 day. The RM2 -> JSON tracker that generalizes it: ~1-2 days (Workstream C).
- Workstream A (rail + catalog + mobile + a11y + resume + done-state): ~4-5 days (done-state via per-hub calls + localStorage is more wiring than first scoped).
- Workstream B (quality check + scoped wiring): ~1-2 days.
- Workstream C (factory: 2 skills + 2 scripts + derive spec + RM2 -> JSON): ~5-7 days.
- Total ~2.5-3.5 weeks for the full master plan; the RF course player + gate alone ~1.5 weeks.

---

## Issues, conflicts, gaps & edge cases (the review)

**Conflicts (must reconcile or things silently disagree):**
- **C1 - two free/Pro models (RESOLVED).** Confirmed real at roadmap-f2.js:36 (`allFree = key==='foundations' || key==='analyst'` makes the ENTIRE analyst track free) vs the lesson gate (`build.py lesson_access_from_curriculum`: free if level==1 OR section==1). They disagree about a whole track. Per the owner's stated intent (all sections of level 1 free + section 1 of every other level, rest Pro), the **lesson positional rule is canonical for interactive courses.** Resolution that does NOT touch existing post pricing: an interactive-course item gets its badge + route from `courses.json` (lesson rule), overriding the roadmap section flag for that item only; the roadmap's existing post free/Pro behavior is untouched. So a course's catalog badge always matches its in-player paywall.
- **C2 - curriculum duplication.** A Phase-2 `lessons-curriculum.md` would parallel RM2 and drift. ACTION (decided): RM2 is the SSOT; the factory derives course/lesson slugs from RM2 via `lessons-derive.md`; no second curriculum doc.

**Gaps (undefined; must specify before building):**
- **G1 - course <-> roadmap node mapping.** RM2 items are conceptual titles, not course/lesson slugs; "is RF a section or an item?" is undefined. ACTION: define `course_id <-> (track, section/item)` in `courses.json` + the derivation rules.
- **G2 - completion definition.** "Lesson done" / "course done" must be defined (all gated steps solved? a completion ping?) and shared by the rail tick, the course %, and any certificate hook.
- **G3 - catalog entry for non-roadmap users.** The roadmap is the catalog; consider a lightweight `/courses.html` index later for direct discovery.

**Edge cases:**
- **E1 - logged-out rail state.** No grading data -> show ticks only when signed-in; logged-out uses localStorage resume only. Never show false "done".
- **E2 - manifest vs reality.** A course lesson listed but not yet built -> rail shows "coming soon"/locked, never a 404 (`built:false` in `courses.json`).
- **E3 - Pro lock consistency.** A Pro lesson clicked logged-out must hit its own preview + paywall (PREVIEW_STEPS), matching the rail's lock badge. No way to bypass via the rail.
- **E4 - SEO duplicate nav.** The rail adds the same nav to every lesson page. Keep it lightweight; the step content stays the unique indexable body; confirm `auto_link.py` still skips lesson pages (it does, via `data-lesson-access`); confirm the rail nav is not mistaken for primary content.
- **E5 - courses.json fetch failure.** Rail degrades to next/prev (already in `dataset`); the lesson is fully usable. No hard dependency.
- **E6 - middleware.** Keep blocking `lessons/*.md` + `_lessons/*.html`; ensure the new public `courses.json` is served (not caught by a denylist).
- **E7 - build-speed coupling.** `courses.json` is fetched at runtime, so editing it does NOT rebuild pages. The rail markup is injected client-side by `lesson-mode.js`, so adding the rail does NOT require re-baking 1,300 pages. (The separate incremental-rebuild fix stays a later item.)
- **E8 - soft-nav (deferred) correctness.** If/when added, it must re-mount widgets, switch the `rsc-lesson-v1:<pathname>` resume key, push history, re-hydrate grading, and fire analytics. Design the rail with real links so soft-nav is purely additive.
- **E9 - visual-lexicon false positives.** A concept step that legitimately needs no visual but mentions a trigger word -> the `::prose-only <reason>` escape hatch (B2) prevents a false failure while keeping the choice logged.
- **E10 - certificate hook.** RF is already framed as a graded module; course completion -> the existing cert backend. Keep the completion definition (G2) consistent across rail, %, and cert.
- **E11 - scope risk.** Three workstreams is large; the sequencing makes each shippable alone behind the existing preview flow, so partial delivery is always safe.
