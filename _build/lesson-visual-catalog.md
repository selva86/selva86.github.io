# Lesson Visual Catalog (SSOT)

The menu of visuals `/write-lesson` chooses from, and the inventory that makes "every visualizable concept gets a visual" checkable. Pairs with `_build/lesson-pedagogy.md` R6 (show, don't tell) and `_build/lesson-contract.md` (how a widget is wired). If a concept can be drawn, it must be drawn; this file says with what.

## The rule (R6, restated as a pipeline)

- **Plan time:** the step arc names a visual for every step that introduces something visualizable, or marks it `prose-only (why)`.
- **Author time:** pick the visual from the catalog below. If none fits, add a NEEDS-BUILD row and flag it for hand-build. Never skip, never fake.
- **Verify time:** `lesson_quality_check.py` flags any step whose prose hits the lexicon below but carries no `::widget`, `<img>`, or inline `<svg>`; the judge asks "is any visualizable concept taught in prose alone, and is each visual the right one?"

## Visualizable lexicon (deterministic trigger)

A concept step is "visualizable" if its prose contains any of: tree, split, node, leaf, branch, boundary, region, distribution, curve, histogram, sample / resample / bootstrap, correlation, matrix, network / graph, architecture / pipeline / flow / steps, importance / ranking, gradient / surface, vector / projection, cluster, path, timeline, hypothesis, significance, agent, token, **table / column / row, join / merge, pivot / reshape / tidy, chart / plot / scatter / bar / line, facet, theme / palette, dashboard, report, document**, **bias / variance / overfit / underfit, residual / leverage / influence, threshold / ROC / AUC / precision / recall / confusion, fold / cross-validation / resample, learning rate / loss / converge, leakage / train-test split, confidence / prediction interval**. A hit means a visual is expected on that step.

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
| What a regular expression matches | pick a pattern, every match highlights in a sample string + run | `regex-highlight` | interactive | built |
| List-columns: nest / unnest | toggle flat frame vs one-row-per-group nested tibbles + run nest()/unnest() | `nest-unnest` | interactive | built |
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

## Data Scientist / ML widget family (2026-06-30)

For the Data Scientist track (track `ds` / `scientist`, sections 1-5+). Each renders from `{}` with built-in DEFAULTS, is interactive (a parameter the learner MOVES), AND emits a runnable R block beside the SVG (the `u.runnable` pattern); every widget's emitted R was verified executing in WebR. The standing rule that a widget must be runnable: [[feedback_widgets_runnable]] / `project_lesson_runnable_widgets`.

| Widget | What the learner moves (the feel-it) | Serves lessons |
|---|---|---|
| `bias-variance` | complexity slider -> train vs test U-curve | §1 bias-variance; any underfit/overfit moment |
| `bias-variance-target` | bias + variance sliders -> dartboard shots; MSE = bias^2 + variance | §1 bias-variance (dartboard view) |
| `ols-fit` | slope/intercept -> residual SQUARES + SSE; snap-to-least-squares | §2 OLS from scratch |
| `gradient-descent` | learning-rate slider -> converge / oscillate / diverge on a loss bowl | §1-2 optimization; §4 boosting learning rate |
| `residual-plot` | healthy / funnel / curve toggle | §2 assumptions, heteroskedasticity, influence |
| `leverage-point` | drag one far point -> the line swings; Cook's distance | §2 influence and leverage |
| `regression-intervals` | sample-size n -> confidence band shrinks, prediction band stays | §2 inference; §4 quantile-RF intervals |
| `logistic-curve` | threshold slider -> S-curve cutoff; FP/FN trade | §2 logistic regression |
| `knn-vote` | click to place a query + k slider -> k nearest vote | §3 kNN |
| `roc-curve` | threshold -> ROC operating point + confusion matrix + AUC | §3 reading a classifier; §5 yardstick |
| `gradient-boosting` | rounds slider -> trees stack, residuals shrink | §4 gradient boosting |
| `learning-curve` | early-stop marker -> train vs validation over rounds | §4 hyperparameters, early stopping |
| `cv-folds` | fold stepper + k -> rotating holdout; CV mean | §5 rsample / resampling; §7 CV strategies, nested CV |
| `calibration-curve` | confidence slider -> reliability curve bows off the diagonal | §8 calibrating probabilities; why AUC is not enough |
| `pca-projection` | PC1/PC2 scatter by group + variance-explained bars | §9 PCA, factor analysis, t-SNE/UMAP |
| `kmeans-cluster` | step button -> assign / move centroids; within-SS drops | §9 k-means, hierarchical, GMM |
| `shap-bars` | baseline + signed per-feature bars that sum to the prediction | §11 SHAP, global vs local explanations |
| `pdp-curve` | ICE lines + their average (the PDP) over a feature sweep | §11 partial dependence / ICE / ALE |
| `transform-shaper` | transform toggle (log / sqrt / Box-Cox) -> skewed histogram becomes symmetric; skew stat | §6 scaling and transformations |
| `tuning-search` | grid vs random toggle over a 2D loss surface; best point ringed | §7 hyperparameter tuning |
| `imbalance-resample` | original / oversample / SMOTE -> minority region fills in; class counts | §8 class imbalance and resampling |
| `dendrogram` | cut-height slider -> the merge tree splits into k coloured clusters | §9 hierarchical and density clustering |
| `gmm-clusters` | soft vs hard toggle -> boundary points take an in-between colour (responsibilities) | §9 Gaussian mixture models |
| `cluster-validate` | k marker on the elbow (within-SS) + silhouette bars | §9 choosing k, cluster validation/stability |
| `assoc-rules` | pick a rule -> support / confidence / lift bars | §9 association rules / market basket |
| `causal-dag` | confounder / collider / mediator toggle -> what to control for | §10 causal diagrams (DAGs) |
| `fairness-metrics` | fairness-definition toggle -> per-group selection / TPR / FPR bars + the gap | §11 fairness basics |
| `drift-monitor` | weeks-since-launch slider -> live histogram drifts; PSI climbs to an alert | §12 monitoring and drift |
| `robust-weights` | OLS/Huber/Tukey toggle -> the outlier's weight drops and the line snaps back to the honest slope | §13 robust regression I/II |
| `quantile-lines` | 10th/median/90th percentile lines fan apart on heteroskedastic data | §13 quantile regression; §21 distributional/quantile uncertainty |
| `coef-path` | lasso/ridge toggle + lambda slider -> coefficients shrink; lasso hits exactly 0 (selection) | §13 regularized regression I/II |
| `spline-smoother` | smoothness slider -> stiff line to good fit to overfit wiggle vs the true curve | §13 GAMs I/II |
| `count-dist` | Poisson/NB/zero-inflated toggle -> the fitted line matches the excess-zero bar and long tail | §13 count, overdispersion, zero-inflated/hurdle |
| `glm-family-shapes` | Gamma/Beta/Tweedie toggle -> the density shape each family implies (positive-skewed, [0,1], spike-at-0) | §13 Gamma/Tweedie/beta regression |
| `ordinal-cumlogit` | predictor slider -> stacked category bands shift low->high (proportional odds) | §13 ordinal/multinomial regression |
| `shrinkage-pool` | pooling slider -> small noisy groups shrink toward the grand mean | §13 mixed/multilevel models; §16 hierarchical models, partial pooling |
| `kernel-svm` | linear/poly/RBF toggle -> boundary bends to wrap the inner class; support vectors circled | §14 SVM + the kernel trick |
| `bayes-update` | prior mean/confidence + data sliders -> prior x likelihood -> posterior; tightens with n | §16 the Bayesian update, conjugacy, choosing priors |
| `gp-posterior` | lengthscale toggle -> GP posterior mean + 95% band that pinches at data, flares in gaps | §14 Gaussian processes for regression & uncertainty |
| `stacking-blend` | errors/weights toggle -> stacked RMSE beats every base learner; meta-learner blend weights | §14 stacking & the Super Learner |
| `bayesopt-acq` | Next-sample button -> GP surrogate + Expected-Improvement acquisition homes in on the global max | §14 Bayesian optimization for hyperparameters |
| `km-curve` | arm toggle -> Kaplan-Meier step curves with censoring ticks; medians where curves cross 50% | §15 survival data, Kaplan-Meier & log-rank |
| `hazard-ratio` | HR toggle -> S1(t)=S0(t)^HR; curve pulls below (HR>1) or above (HR<1) baseline, never crossing | §15 Cox proportional hazards, checking PH |
| `competing-risks` | time-point toggle -> stacked cumulative-incidence bands (event-free/relapse/death) summing to 1 | §15 competing risks & cumulative incidence |
| `mcmc-walk` | proposal-width toggle -> Metropolis trace + running histogram vs true posterior; mixing/acceptance trade-off | §16 MCMC, the Metropolis sampler, diagnostics |
| `ppc-overlay` | good/bad-model toggle -> histogram of a replicated test statistic with the observed value marked (PPC p-value) | §16 posterior predictive checks, Bayesian workflow |
| `power-curve` | effect-size toggle -> power-vs-sample-size curve with the n-for-80%-power mark; emits `power.t.test` | §17 designing for power, sample size, the effect/alpha/n tradeoff |
| `cuped-variance` | pre-period correlation toggle -> raw vs CUPED 95% CI shrinking by sqrt(1-rho^2); emits the raw-vs-CUPED SEs | §17 variance reduction, CUPED, stratification |
| `bandit-explore` | epsilon-greedy vs Thompson toggle -> cumulative-regret curves for a 3-arm bandit; emits a base-R bandit sim | §17 multi-armed bandits, explore/exploit, Thompson sampling |

Reuse for `ds` (sections 6-12): `table-transform` + `data-split` (§6 feature engineering, encoding, imputation, leakage), `importance-bars` (§6 feature selection; §11 permutation importance), `learning-curve` + `oob-tuner` (§7 tuning), `null-distribution` (§7 model comparison; §10 A/B testing, reading an experiment), `roc-curve` + `logistic-curve` + `decision-region` (§8 imbalance, thresholds, curves), `tree-diagram` (§9 hierarchical clustering; §10 DAGs), `process-flow` (§10 causal frames; §12 pipelines/serving/monitoring), `doc-structure` (§11 model cards; §12 system-design checklist).

Reuse for `ds`: `tree-diagram`+`gini-split` (§3 + §4 decision trees), `decision-region` (§3 LDA/QDA, decision boundaries, and Naive Bayes), `correlation-heatmap` (§2 multicollinearity), `process-flow` (§1 CRISP-DM; §5 recipes/parsnip/workflows), and the RF set `forest-averaging`/`decorrelation`/`oob-tuner`/`bootstrap-sample`/`importance-bars` for §4 (the existing `random-forest` course owns trees-as-ensemble).

## Adding a widget

One IIFE per file in `www/lesson-widgets/`, contract `mount(el, cfg)`, register with `window.LessonWidgets.register('<id>', mount)`, deterministic data, idempotent. `build.py` bundles it. Author into a lesson with `::widget <id> {json-cfg}` (config must not contain single quotes or raw `<` / `>`; use word forms). Full mechanics: `_build/lesson-contract.md`.
