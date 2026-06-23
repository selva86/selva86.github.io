# Lesson Visual Catalog (SSOT)

The menu of visuals `/write-lesson` chooses from, and the inventory that makes "every visualizable concept gets a visual" checkable. Pairs with `_build/lesson-pedagogy.md` R6 (show, don't tell) and `_build/lesson-contract.md` (how a widget is wired). If a concept can be drawn, it must be drawn; this file says with what.

## The rule (R6, restated as a pipeline)

- **Plan time:** the step arc names a visual for every step that introduces something visualizable, or marks it `prose-only (why)`.
- **Author time:** pick the visual from the catalog below. If none fits, add a NEEDS-BUILD row and flag it for hand-build. Never skip, never fake.
- **Verify time:** `lesson_quality_check.py` flags any step whose prose hits the lexicon below but carries no `::widget`, `<img>`, or inline `<svg>`; the judge asks "is any visualizable concept taught in prose alone, and is each visual the right one?"

## Visualizable lexicon (deterministic trigger)

A concept step is "visualizable" if its prose contains any of: tree, split, node, leaf, branch, boundary, region, distribution, curve, histogram, sample / resample / bootstrap, correlation, matrix, network / graph, architecture / pipeline / flow / steps, importance / ranking, gradient / surface, vector / projection, cluster, path, timeline. A hit means a visual is expected on that step.

## Static vs interactive (pick the cheaper one that teaches)

- **Interactive widget:** ONLY for a "feel-it" moment, a parameter the learner moves to see an effect, AND it computes real results (overfit slider, averaging slider, mtry tuner).
- **Static SVG / image:** everything else, structures and flows and one-shot illustrations. Cheaper, no flash, always the default unless manipulation itself teaches.

## Catalog

| Concept archetype | Visual | Widget id | Kind | Status |
|---|---|---|---|---|
| A tree / hierarchy of decisions | labeled node-edge tree | `tree-diagram` | static | built |
| Overfitting vs depth / complexity | train-vs-test boundary + accuracy | `decision-region` | interactive | built |
| Averaging many models cuts variance | boundary smooths as N rises | `forest-averaging` | interactive | built |
| De-correlation / feature subsetting | first-split feature spread | `decorrelation` | interactive | built |
| Tuning a U-shaped error curve | error vs knob, draggable | `oob-tuner` | interactive | built |
| Impurity drop at a split | before / after class mix + Gini number | `gini-split` | static | built |
| Sampling with replacement / OOB | row strip resampled, ~37% greyed | `bootstrap-sample` | interactive | built |
| Ranking of feature importance | sorted horizontal bars | `importance-bars` | static | built |
| An N-step process / pipeline | numbered flow diagram | `process-flow` | static | built |
| Spread of estimates averaging to a mean | dots collapsing to a line | `estimate-averaging` | interactive | NEEDS BUILD (optional) |

## Gaps surfaced by the RF audit (2026-06-24)

Built 2026-06-24 to make the RF proof course fully "show, don't tell" and to seed the library for the stats / ML lessons that reuse them:

- `gini-split` - L1 "How it chooses": two-panel before / after of one split with the Gini number dropping. Reusable for any impurity / entropy lesson.
- `bootstrap-sample` - L2 "Give each tree different data" and L3 "Out-of-bag error": a row strip resampled with replacement, duplicates highlighted, ~37% greyed as out-of-bag. One widget serves both steps.
- `importance-bars` - L3 "Which features mattered": sorted horizontal bars (tenure, spend, ...). Reusable for any feature-importance / coefficient lesson.
- `process-flow` - L2 "The whole forest in three rules": a numbered 3-step flow. Generic, reusable everywhere.

Softer (formula already carries the idea, a viz would reinforce): L2 "wisdom of crowds" and "bootstrap is not enough" (correlation floor).

## Adding a widget

One IIFE per file in `www/lesson-widgets/`, contract `mount(el, cfg)`, register with `window.LessonWidgets.register('<id>', mount)`, deterministic data, idempotent. `build.py` bundles it. Author into a lesson with `::widget <id> {json-cfg}` (config must not contain single quotes or raw `<` / `>`; use word forms). Full mechanics: `_build/lesson-contract.md`.
