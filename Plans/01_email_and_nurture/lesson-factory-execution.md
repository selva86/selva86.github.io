# The windowed-lesson factory: execution plan + subagent context pack

> **Superseded (2026-08-18):** the per-lesson pipeline in this file (single
> writer session, human widget gate) is NOT what runs. The live pipeline is
> plan -> plan-review -> build -> review in four fresh sessions, driven by
> `Scripts/batch_windowed.py` (see its docstring), with all rules inside the
> self-contained lesson skills. What remains useful below: the windowed
> frontmatter law, the never-list (sidebar/courses.json/roadmaps/tracker),
> the widget gap table, and the launch checklist.

Phase D of the windowed-lessons build. This file is BOTH the plan and the
context pack every lesson-writing run receives - it exists so a fresh
subprocess has everything and guesses nothing. Owner directives baked in
(2026-08-15): every lesson beginner-friendly, detailed, comprehensive,
natural speaking tone, NO length limits, widgets created BEFORE writing,
model = Opus 5.

## The per-lesson pipeline (strict order)

For sequence item N (from `functions/_data/mini-courses.json`):

1. **PLAN** - write `post_plans/<slug>_lesson-plan.md` per the PLAN gate in
   `_build/lesson-pedagogy.md` (objectives->steps->checks, entry bar,
   concept order, step arc with a named visual per visualizable step).
2. **WIDGET GATE (before any prose - owner rule)** - walk the step arc
   against `_build/lesson-visual-catalog.md`. Every visualizable step needs
   a cataloged widget id, a static diagram, or a NEEDS-BUILD row. If
   NEEDS-BUILD: hand-build the widget in `www/lesson-widgets/` first
   (deterministic mount(el,cfg) IIFE, REAL computed numbers, registered in
   index.js + the catalog), verify it standalone, THEN write. Never fake,
   never skip, never substitute prose.
3. **WRITE** - `/write-lesson` on **Opus 5** (`claude --model claude-opus-5`),
   context = this file + the specifics block below. Full R1-R15 regime.
4. **GATES** - `Scripts/lesson_quality_check.py` (deterministic + judge +
   Playwright), then `/check-lesson` fresh-eyes. Fail -> fix -> rerun; one
   retry then manual_review.
5. **PUBLISH** - `/publish-lesson` (md2lesson -> build.py -> manifest).
   Windowed specifics verified after build: body carries
   `data-lesson-access="windowed"` + `data-pagefind-ignore` + robots
   noindex meta; the page is NOT in sitemap.xml/feed.xml (build.py handles
   all of this from the frontmatter).
6. **REGISTER** - `python Scripts/update_mini_registry.py --seq N --slug S`
   then commit registry + lesson files together and push. The moment the
   deploy lands, the middleware windows the page and the sender may send N.
7. **VERIFY LIVE** - curl: anon on the new slug -> 302 to lesson-locked;
   with a valid token -> 200 + noindex header; catalog shows status built.

Batching: one lesson per fresh subprocess, sequential (no parallel agents -
project rule). Order = sequence order (seq 1 upward); email click data may
reorder WITHIN a course later, never across the frontier.

## Frontmatter for windowed lessons (differences from standard)

```yaml
lesson_access: "windowed"        # the access class; drives noindex + windowing
course_id: "<mini-course id>"    # e.g. inference-from-zero (from the registry)
course_title: "<mini course title>"
course_lesson: "<part number>"   # 1-based within the mini course
course_total: "<parts in course>"
course_landing: "/dashboard.html"   # windowed courses have no public landing
course_next / course_prev: "<sibling slugs, when built>"
```
Slug convention: `<CourseTitleCompact>-Mini-<part>` (e.g. `Inference-Mini-1`).
NEVER add windowed lessons to: sidebar.json, courses.json, any roadmap,
lessons-curriculum.md, pro-lessons.json (the tracker skips lesson_access
windowed; verify after each publish).

## The teaching contract (owner directives, restated as law)

- **Assume a beginner even on researcher topics.** Entry bar for seq 1-14:
  "can read a simple R script; no statistics background." Define everything.
- **No length limit** (R13). As many steps as full understanding takes;
  never compress to fit anything. Split only at a genuine conceptual seam.
- **Natural speaking voice** (R12/R15): a patient teacher talking, concrete
  named examples with real numbers, one running example through the lesson,
  contractions welcome, no lecture-register.
- **Comprehensive**: the lesson must beat the source blog post in depth,
  not summarize it. The post is raw material, never the ceiling.
- Source post for each seq item is in the registry (`source` field); read it
  in Pass 0 as material. The subject line of the email IS the promise the
  lesson must cash.

## Widget gap analysis for lessons 1-14 (done 2026-08-15)

Catalog has 100 built widgets. Mapping the first 14 sequence lessons:

| Seq | Lesson | Widgets available | NEEDS BUILD first |
|---|---|---|---|
| 1 | How inference works | process-flow, bootstrap-sample | `sampling-variation` (repeated samples from a population -> spread of sample means; the lesson's core feel-it) |
| 2 | What p-values mean | null-distribution (core), bootstrap-sample | none expected |
| 3 | Confidence intervals | regression-intervals (partial) | `ci-catcher` (many CIs drawn, ~95% catch the true line; THE canonical CI sim) |
| 4 | ARIMA: AR/I/MA | none fit | `series-simulator` (AR/MA/drift knobs -> live series; also serves 8, 14, 19) |
| 5 | lm() output | residual-plot, regression-intervals | `lm-output-annotate` (annotated summary() with hover/step explains) - static diagram may suffice; decide at PLAN |
| 6 | Interaction effects | chart-plotter (grouped slopes) | likely none (interaction = two slopes on chart-plotter) |
| 7 | (public treat - no lesson) | - | - |
| 8 | Power analysis | power-curve (core), null-distribution | none expected |
| 9 | Which test flowchart | process-flow / tree-diagram | none expected |
| 10 | Conditional probability | bayes-update (partial) | `prob-grid` (counts-in-a-grid conditional prob; decide at PLAN, static may do) |
| 11 | ACF and PACF | none fit | `acf-explorer` (series + its ACF/PACF bars, linked; serves the whole ARIMA course) |
| 12 | Multicollinearity | correlation-heatmap, coef-path | none expected |
| 13 | Expected value + variance | estimate-averaging (catalog: optional build) | `ev-simulator` OR build estimate-averaging as specced |
| 14 | Welch's ANOVA | null-distribution, chart-plotter | none expected |

So ~5-6 new widgets unlock the first 14 lessons, and `series-simulator` +
`acf-explorer` carry the entire ARIMA course beyond them. Widgets are built
in the same session as their first lesson (pipeline step 2), never batched
speculatively - the PLAN may downgrade a candidate to a static diagram.

## Session budget honesty

A lesson at this bar (plan + widgets + write + gates + publish) is a
multi-hour, context-heavy job: expect 1-2 lessons per working session, the
first ones slower (widget builds). ~14 lessons = roughly a week of factory
sessions before the nurture flag can flip. The frontier-hold in the sender
means partial progress is always safe to deploy.

## Launch checklist (when ~14 are built)

- [ ] `python Scripts/update_mini_registry.py --list` shows frontier >= 14
- [ ] Owner has read week-one emails (inbox + /admin/email.html)
- [ ] Owner opt-in: own account email_nurture=1, walk the real experience
- [ ] Flip `flag:nurture-sequence` on (KV, prod) - engine stays in dev mode
      until flag:email-live, so the sequence can run allowlist-only first
- [ ] Factory keeps a 7-lesson head start on the calendar thereafter
