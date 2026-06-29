# Lesson Visual Catalog (SSOT)

The menu of visuals `/write-lesson` chooses from, and the inventory that makes "every visualizable concept gets a visual" checkable. Pairs with `_build/lesson-pedagogy.md` R6 (show, don't tell) and `_build/lesson-contract.md` (how a widget is wired). If a concept can be drawn, it must be drawn; this file says with what.

## The rule (R6, restated as a pipeline)

- **Plan time:** the step arc names a visual for every step that introduces something visualizable, or marks it `prose-only (why)`.
- **Author time:** pick the visual from the catalog below. If none fits, add a NEEDS-BUILD row and flag it for hand-build. Never skip, never fake.
- **Verify time:** `lesson_quality_check.py` flags any step whose prose hits the lexicon below but carries no `::widget`, `<img>`, or inline `<svg>`; the judge asks "is any visualizable concept taught in prose alone, and is each visual the right one?"

## Visualizable lexicon (deterministic trigger)

A concept step is "visualizable" if its prose contains any of: tree, split, node, leaf, branch, boundary, region, distribution, curve, histogram, sample / resample / bootstrap, correlation, matrix, network / graph, architecture / pipeline / flow / steps, importance / ranking, gradient / surface, vector / projection, cluster, path, timeline, hypothesis, significance, agent, token, **table / column / row, join / merge, pivot / reshape / tidy, chart / plot / scatter / bar / line, facet, theme / palette, dashboard, report, document**. A hit means a visual is expected on that step.

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
| Hypothesis test: null dist + p-value tail | shaded tail under H0, draggable statistic | `null-distribution` | interactive | built |
| Agent reasoning loop (ReAct) | Thought -> Action -> Observation cycle, stepped | `agent-loop` | interactive | built |
| A table changing under a dplyr/data.table verb | before -> after table diff + the code | `table-transform` | interactive | built |
| Joining two keyed tables | two tables + switchable join type + live result | `join-diagram` | interactive | built |
| Reshaping wide <-> long (pivot) | table morphs, id vs names/values tinted | `reshape-grid` | interactive | built |
| Raw data vs a report-ready table | raw -> formatted (gt / flextable) toggle | `styled-table` | interactive | built |
| Chart type / grammar of graphics | geom switch + live ggplot2 code (+ Pearson r) | `chart-plotter` | interactive | built |
| A correlation matrix | diverging color grid of r (computed) | `correlation-heatmap` | static | built |
| Facets / small multiples | one chart vs facet_wrap small multiples | `facet-grid` | interactive | built |
| Theme / palette / accessibility | restyle a chart live + scale/theme code | `theme-styler` | interactive | built |
| Dashboard layout / reactivity | one filter input -> value boxes + chart tiles update | `dashboard-layout` | interactive | built |
| R Markdown / Quarto doc anatomy | source (.qmd) <-> rendered toggle | `doc-structure` | interactive | built |
| Atomic-vector type coercion | add mixed-type elements, vector coerces up the hierarchy + run | `vector-coercion` | interactive | built |
| A data frame as equal-length typed columns | toggle columns -> table, dim, per-column type + run | `dataframe-builder` | interactive | built |
| Control flow: a loop with if/else executing | step a for-loop, branch taken + console builds up + run | `control-flow` | interactive | built |
| Lexical scoping / environment lookup | name resolves local-then-global, chain highlighted + run | `scope-chain` | interactive | built |
| Spread of estimates averaging to a mean | dots collapsing to a line | `estimate-averaging` | interactive | NEEDS BUILD (optional) |

## Gaps surfaced by the RF audit (2026-06-24)

Built 2026-06-24 to make the RF proof course fully "show, don't tell" and to seed the library for the stats / ML lessons that reuse them:

- `gini-split` - L1 "How it chooses": two-panel before / after of one split with the Gini number dropping. Reusable for any impurity / entropy lesson.
- `bootstrap-sample` - L2 "Give each tree different data" and L3 "Out-of-bag error": a row strip resampled with replacement, duplicates highlighted, ~37% greyed as out-of-bag. One widget serves both steps.
- `importance-bars` - L3 "Which features mattered": sorted horizontal bars (tenure, spend, ...). Reusable for any feature-importance / coefficient lesson.
- `process-flow` - L2 "The whole forest in three rules": a numbered 3-step flow. Generic, reusable everywhere.

Softer (formula already carries the idea, a viz would reinforce): L2 "wisdom of crowds" and "bootstrap is not enough" (correlation floor).

## Data Analyst widget family (2026-06-24)

Built to make the Data Analyst track (level 2 / track `analyst`) "show, don't tell" - the library was stats/ML-only before this. All share a helper layer in `index.js` (`LessonWidgets.u`: palette, `tbl`, `seg`/`wireSeg`, `code`, `plot` - a compact multi-geom SVG engine). Every widget has meaningful DEFAULTS (renders from `{}`) and accepts `cfg` to carry the lesson's own data. Config must not contain single quotes or raw `<` / `>`.

| Widget | cfg (all optional; defaults shown render standalone) | Serves sections |
|---|---|---|
| `table-transform` | `{code, caption, before:{cols,rows}, after:{cols,rows}}` - diffs before/after, new cols green, removed rows struck | S1 (filter/select/mutate/arrange/distinct/summarise/recode/missing), S2 (separate/unite), S6 (data.table verbs) |
| `join-diagram` | `{left:{cols,rows}, right:{cols,rows}, key, op}` - switch inner/left/right/full/semi/anti | S2 |
| `reshape-grid` | `{wide:{cols,rows}, idCols:[], namesTo, valuesTo}` - derives + toggles long form | S1 (tidy data), S2 (pivot) |
| `styled-table` | `{cols, rows, formats:{col:"dollar|pct|comma|1dp"}, title, note}` - raw vs report table | S7 |
| `chart-plotter` | `{data:[{x,y,fill}], geoms:[], x, y, code:{}}` - geom switch + ggplot code + r | S3 (univariate/bivariate), S4 (all chart types + grammar) |
| `correlation-heatmap` | `{vars:[], data:{var:[]}}` or `{vars, matrix:[[]]}` - computes Pearson r | S3 |
| `facet-grid` | `{data:[{x,y,facet}], geom, x, y, facetVar}` - one chart vs small multiples | S5 |
| `theme-styler` | `{data:[{x,y}], x, y}` - palette (incl. colorblind) + theme switch | S5 |
| `dashboard-layout` | `{filterLabel, views:{name:{boxes:[[label,value]], line:[{x,y}], bar:[{x,y}]}}}` - reactive filter | S8 |
| `doc-structure` | `{blocks:[{type:"yaml|prose|code", text, chart}]}` - source vs rendered | S9 |

Reuse for `analyst`: `process-flow` (S1 import flow, S3 EDA framework, S6 data.table anatomy, S8 reactivity, S9 parameterized reports), `agent-loop` (S9 LLM/ellmer), `chart-plotter` bar geom (S6 speed benchmark). `u.plot` geoms: point (with `corr`), line, bar/col, histogram, boxplot - all compute real scales/quartiles/r, no faked numbers.

## Adding a widget

One IIFE per file in `www/lesson-widgets/`, contract `mount(el, cfg)`, register with `window.LessonWidgets.register('<id>', mount)`, deterministic data, idempotent. `build.py` bundles it. Author into a lesson with `::widget <id> {json-cfg}` (config must not contain single quotes or raw `<` / `>`; use word forms). Full mechanics: `_build/lesson-contract.md`.
