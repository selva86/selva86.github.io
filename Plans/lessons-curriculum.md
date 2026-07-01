# Lessons Curriculum (course arcs SSOT)

The hand-curated list of interactive courses + their lesson arcs. `/write-lesson` Pass 0 reads a course's arc HERE: which lessons, each lesson's focus + the signature widget(s) it should use, its `curriculum_id`, and access. This complements the roadmap (`www/roadmap-curriculum.js`, RM2): RM2 lists lesson TITLES per track section; this file holds the interactive-COURSE arcs (slug + focus + widget) that RM2 does not. A "complex lesson" can be a 1-lesson course. Widgets are SELECTED from `_build/lesson-visual-catalog.md`; a needed-but-absent widget is hand-built first (never faked).

Format per course:
`## <course_id>  (track, curriculum_id, landing, access)` then a numbered lesson list, each: `<slug> - <focus> - widgets: <ids>`.

---

## random-forest  (track: scientist; curriculum_id 6.3; landing Random-Forest-Course.html; access: free)
1. RF-Course-Lesson-1 - Decision trees from scratch: a tree as a flowchart, Gini splits, growing one in R, watching a deep tree overfit, and why one tree is unstable. widgets: tree-diagram, gini-split, decision-region, forest-averaging
2. RF-Course-Lesson-2 - From one tree to a forest: averaging crushes variance, bootstrap makes trees differ, random features decorrelate them. widgets: forest-averaging, bootstrap-sample, decorrelation, process-flow
3. RF-Course-Lesson-3 - Train, tune and read a forest in R: OOB error, tuning mtry + trees, variable importance, limits. widgets: oob-tuner, bootstrap-sample, importance-bars

## t-test  (track: scientist; curriculum_id 4.2.1; landing T-Test-Course.html; access: free)
1. The-t-test-from-scratch - ONE complex lesson teaching hypothesis testing from scratch via the t-test. Arc within the lesson: (a) the question - is a difference real or noise; (b) the sampling distribution of the mean under H0; (c) the t-statistic as a signal-to-noise ratio (define every symbol in MathJax); (d) the p-value as a tail area under H0 (the signature interactive); (e) one-sample vs two-sample (Welch); (f) effect size + sample size + power, and why a small p is not a big effect; (g) doing it in R with t.test(); (h) misuses (p-hacking, multiple comparisons, assuming normality). widgets: null-distribution (signature: drag the observed t, watch the p-value tail), plus a means/sampling illustration. Outcome: the learner computes and correctly READS a p-value and knows when the test (mis)applies.

## llm-agents  (track: scientist; curriculum_id 6.6.1; landing LLM-Agents-Course.html; access: free)
1. LLM-Agents-in-R - ONE complex lesson on what an LLM agent is, from scratch, grounded in R (ellmer). Arc within the lesson: (a) plain LLM vs an agent that can act; (b) tools - giving the model functions to call; (c) the ReAct loop: Thought -> Action -> Observation, repeating until it can Answer (the signature interactive, stepped through a worked trace); (d) when to stop + guard rails (max steps, validation); (e) building one in R with ellmer (register a tool, run the loop); (f) failure modes (hallucinated tool calls, loops, prompt injection) and how to defend. widgets: agent-loop (signature: step the ReAct trace), process-flow (the build recipe). Outcome: the learner can trace an agent's reasoning loop and wire tools + guard rails responsibly. Never name the in-browser R runtime; say "interactive R".

# Data Scientist track - sections 1-5 (roadmap track `ds`, the "core" tier; ~1 lesson per curriculum item)

> Granularity: near 1:1 with the roadmap curriculum (owner). Thin items merged where noted. Section 4 reuses the existing `random-forest` course (it already teaches trees + bagging), so section 3's "Decision trees" item cross-links there rather than duplicating. Access `free` to match the roadmap (DS core 1-12 marked free); confirm before publish.
>
> **NEW widgets to build first (the quality lever - do NOT fake):** `bias-variance` (slide model complexity, watch train vs test error U-curve), `data-split` (a row strip split train/val/test + a leakage demo), `residual-plot` (residuals-vs-fitted + Q-Q + leverage), `gradient-boosting` (add trees, watch residuals shrink), `learning-curve` (train/validation error vs rounds, early-stop marker), `cv-folds` (the k-fold resampling strip), `roc-curve` (threshold slider -> ROC/PR + confusion matrix), `naive-bayes` (optional; else reuse decision-region). Reused: decision-region, tree-diagram, gini-split, bootstrap-sample, forest-averaging, decorrelation, oob-tuner, importance-bars, chart-plotter, correlation-heatmap, null-distribution, process-flow, styled-table.

## ds-ml-workflow  (track: scientist; curriculum_id 6.10; landing R-ML-Workflow-Course.html; access: free)  [roadmap §1]
1. Framing-a-Problem-as-ML - CRISP-DM end to end: turn a business question into a supervised task (define the target, the unit of analysis, the features available at prediction time), and pick a metric that matches the decision. widgets: process-flow
2. The-Bias-Variance-Tradeoff - underfit vs overfit as bias vs variance, the U-shaped test-error curve, model complexity, and why more flexible is not always better. widgets: NEW:bias-variance, decision-region
3. Train-Validation-Test-and-Data-Leakage - the three-way split and why; the cardinal sin of leakage (fitting on test, target leakage, temporal leakage) and how to evaluate honestly. widgets: NEW:data-split, process-flow
4. Your-First-End-to-End-Model-in-R - one dataset start to finish: split, fit, predict, evaluate, and make it reproducible with a seed + script (folds in "reproducibility from day one"). widgets: process-flow, chart-plotter

## ds-regression  (track: scientist; curriculum_id 6.20; landing R-Regression-Modeling-Course.html; access: free)  [roadmap §2]
1. OLS-Regression-from-Scratch - the line that minimizes squared error, the normal equations, fitting lm() in R, reading coefficients and R-squared. widgets: chart-plotter
2. Regression-Assumptions-and-Residuals - the four assumptions (linearity, independence, constant variance, normality) and reading residual plots to check them. widgets: NEW:residual-plot, chart-plotter
3. Influence-and-Leverage - high-leverage points vs influential observations, Cook's distance, and what one row can do to a fit. widgets: NEW:residual-plot, chart-plotter
4. Multicollinearity-in-Regression - correlated predictors, unstable coefficients, the VIF, and how to detect and fix it. widgets: correlation-heatmap, chart-plotter
5. Heteroskedasticity-and-Autocorrelation - non-constant variance and correlated errors, how to spot them, and robust / corrected standard errors. widgets: NEW:residual-plot, chart-plotter
6. Inference-and-Prediction-in-Regression - confidence vs prediction intervals, tests on coefficients, and explaining vs predicting. widgets: chart-plotter, null-distribution
7. Logistic-Regression-Done-Properly - modeling a probability, the logit link, odds ratios, fitting glm(), reading the model. widgets: chart-plotter, decision-region
8. GLMs-Beyond-Logistic - the GLM family (Poisson counts, Gamma, etc.), link functions, and matching the model to the response. widgets: process-flow, chart-plotter

## ds-classification  (track: scientist; curriculum_id 6.30; landing R-Classification-Course.html; access: free)  [roadmap §3]
1. kNN-and-the-Curse-of-Dimensionality - classify by nearest neighbors, choosing k, the distance metric, and why high dimensions break distance. widgets: decision-region
2. Naive-Bayes-for-Tabular-and-Text - Bayes' rule for classification, the naive independence assumption, and why it works well anyway. widgets: NEW:naive-bayes, chart-plotter
3. Discriminant-Analysis-LDA-and-QDA - linear vs quadratic discriminant analysis, the Gaussian assumption, and the boundary each draws. widgets: decision-region
4. Decision-Trees-for-Classification - a single tree as a standalone classifier: recursive splits, impurity (Gini/entropy), growing and pruning with rpart, reading the tree, and why one tree overfits - the bridge to the ensembles in §4. widgets: tree-diagram, gini-split, decision-region
5. Decision-Boundaries-and-Model-Geometry - what a classifier's boundary looks like (linear vs nonlinear), generative vs discriminative, and how the boundary reflects the model. widgets: decision-region
6. Reading-a-Classifier - the confusion matrix, accuracy/precision/recall/F1, ROC and PR curves, and why accuracy alone misleads. widgets: NEW:roc-curve
   (Decision trees appear in BOTH §3 here as a standalone classifier AND §4 as the base learner for ensembles - the existing `random-forest` course teaches trees-as-ensemble-base. Both framings are intended; not a duplicate.)

## ds-boosting  (track: scientist; curriculum_id 6.40; landing R-Gradient-Boosting-Course.html; access: free)  [roadmap §4: the interactive lessons in this section = the EXISTING `random-forest` course (decision trees from scratch + bagging + random forests + OOB tuning, 3 lessons, already live) PLUS this `ds-boosting` course below]
1. Gradient-Boosting-from-Scratch - boosting as sequential error-correction: fit to residuals, the learning rate, and how it differs from bagging. widgets: NEW:gradient-boosting
2. LightGBM-and-CatBoost-in-R - the modern fast boosters, histogram splits, native categorical handling, when to pick which. widgets: process-flow, importance-bars
3. The-Hyperparameters-That-Matter - the few knobs that actually move boosting (trees, learning rate, depth, regularization) and how they interact. widgets: NEW:learning-curve
4. Early-Stopping-and-Learning-Curves - reading train/validation curves, stopping before overfit, the rounds-vs-error picture. widgets: NEW:learning-curve
5. Monotonic-Constraints-for-Business-Rules - forcing a feature's effect one way, why a business needs it, and the accuracy-for-trust trade. widgets: chart-plotter
6. Quantile-Regression-Forests-and-Prediction-Intervals - predict a range not a point, quantile loss, and intervals from trees. widgets: chart-plotter

## ds-tidymodels  (track: scientist; curriculum_id 6.50; landing R-tidymodels-Course.html; access: free)  [roadmap §5]
1. Preprocess-with-recipes - the recipe as a reusable, leak-free preprocessing pipeline (scaling, dummies, imputation) that learns on train and applies to test. widgets: process-flow
2. Define-Models-with-parsnip - one interface to many engines, switching engines without rewriting, bonsai for boosting. widgets: process-flow
3. Bundle-Steps-with-workflows - tie a recipe + model into one object you fit and predict as a unit. widgets: process-flow
4. Resample-with-rsample - cross-validation and the bootstrap for honest estimates, folds, and why resampling beats one split. widgets: NEW:cv-folds
5. Measure-with-yardstick - choosing and computing metrics, metric sets, and reading them across resamples. widgets: NEW:roc-curve, chart-plotter
6. Tune-with-the-tune-package - tune hyperparameters over a grid with resampling, pick the best, finalize the workflow. widgets: NEW:learning-curve, process-flow
7. Compare-Many-Models-with-workflowsets - fit and compare a set of model+recipe combinations to pick a winner. widgets: chart-plotter, styled-table

## ds-feature-engineering  (track: scientist; curriculum_id 6.60; landing R-Feature-Engineering-Course.html; access: free)  [roadmap §6]
1. Encoding-Categorical-Variables - one-hot / dummy, ordinal, and high-cardinality handling; when each is right and what each costs a model. widgets: table-transform
2. Target-Encoding-Without-Leakage - impact / target encoding done out-of-fold so the encoding never sees the rows it scores; the leak it prevents. widgets: data-split, table-transform
3. Scaling-and-Transformations - center / scale, log, Box-Cox and Yeo-Johnson, and which models care about scale and which do not. widgets: NEW:transform-shaper, table-transform
4. Interaction-and-Spline-Features - products, polynomials and splines that let a linear model bend without overfitting. widgets: chart-plotter, ols-fit
5. Features-from-Dates-Text-and-Geo - pulling signal out of timestamps, strings and coordinates into model-ready columns. widgets: table-transform
6. Imputing-Missing-Values-in-Features - mean / median / kNN / model-based imputation done inside the pipeline so it stays leak-free. widgets: table-transform, data-split
7. Feature-Selection-and-Spotting-Leakage - filter, wrapper and embedded selection, plus how to catch target leakage before it flatters your score. widgets: importance-bars, data-split

## ds-evaluation-tuning  (track: scientist; curriculum_id 6.70; landing R-Model-Evaluation-Course.html; access: free)  [roadmap §7]
1. Cross-Validation-Strategies - k-fold, repeated and LOOCV, and the bias-variance of the estimate itself. widgets: cv-folds
2. Grouped-Blocked-and-Time-Aware-CV - leakage-safe resampling when rows are grouped or ordered in time. widgets: cv-folds, data-split
3. Nested-Cross-Validation - tune on the inside, evaluate on the outside, so the reported score is not optimistic. widgets: cv-folds
4. Hyperparameter-Tuning-Strategies - grid, random and Bayesian search, and how to spend the search budget well. widgets: NEW:tuning-search, learning-curve
5. Scoring-Rules-and-Regression-Metrics - proper scoring rules, log-loss, RMSE / MAE / MAPE and what each one rewards. widgets: chart-plotter, roc-curve
6. Comparing-Models-Statistically - resampled differences with uncertainty, not single-split luck. widgets: null-distribution
7. From-Metrics-to-Money - turning a metric gain into the business decision it should drive. widgets: roc-curve, process-flow

## ds-imbalanced-classification  (track: scientist; curriculum_id 6.80; landing R-Imbalanced-Classification-Course.html; access: free)  [roadmap §8]
1. Beyond-Binary-Multiclass-Classification - one-vs-rest and one-vs-one, and how the metrics change with more than two classes. widgets: roc-curve, decision-region
2. Class-Imbalance-and-Resampling - under / oversampling and SMOTE with themis, applied without leaking into evaluation. widgets: NEW:imbalance-resample, decision-region
3. Thresholds-Under-Asymmetric-Costs - moving the cutoff when a false negative costs far more than a false positive. widgets: logistic-curve, roc-curve
4. ROC-PR-Lift-and-Gains-Curves - the curve family, and why precision-recall beats ROC on rare positives. widgets: roc-curve
5. Calibrating-Predicted-Probabilities - reliability diagrams and Platt / isotonic calibration so a 0.7 means 0.7. widgets: NEW:calibration-curve
6. Why-AUC-Is-Not-Enough - what a single AUC number hides about a model. widgets: roc-curve, NEW:calibration-curve

## ds-unsupervised  (track: scientist; curriculum_id 6.90; landing R-Unsupervised-Learning-Course.html; access: free)  [roadmap §9]
1. PCA-in-R - principal components, variance explained, and reading a biplot. widgets: NEW:pca-projection
2. Factor-Analysis - latent factors behind observed variables, and how it differs from PCA. widgets: NEW:pca-projection, importance-bars
3. k-Means-and-Choosing-k - Lloyd's algorithm step by step, and the elbow / silhouette for picking k. widgets: NEW:kmeans-cluster, NEW:cluster-validate
4. Hierarchical-and-Density-Clustering - hclust dendrograms and DBSCAN for shapes k-means cannot find. widgets: NEW:dendrogram, tree-diagram
5. Gaussian-Mixture-Models - soft, probabilistic clusters with mclust. widgets: NEW:gmm-clusters
6. Cluster-Validation-and-Stability - silhouette, the gap statistic, and asking whether the clusters are even real. widgets: NEW:cluster-validate, chart-plotter
7. t-SNE-and-UMAP - nonlinear embeddings for seeing structure, and the traps in reading them. widgets: NEW:pca-projection
8. Association-Rules-and-Market-Basket - support, confidence and lift with arules. widgets: NEW:assoc-rules, table-transform

## ds-causal  (track: scientist; curriculum_id 6.100; landing R-Causal-Inference-Course.html; access: free)  [roadmap §10]
1. Correlation-Causation-and-Potential-Outcomes - the counterfactual frame and why a correlation is never enough. widgets: null-distribution, process-flow
2. Causal-Diagrams-with-DAGs - drawing your assumptions, then reading confounders and colliders off the graph. widgets: NEW:causal-dag, process-flow
3. AB-Testing-and-Experiment-Design - randomization, power and the sample size you actually need. widgets: null-distribution, data-split
4. Reading-an-Experiment - effect sizes, intervals, and what a result does and does not let you claim. widgets: null-distribution
5. When-You-Cannot-Randomize - matching and difference-in-differences, and the assumptions they ask you to buy. widgets: process-flow, ols-fit

## ds-interpretability  (track: scientist; curriculum_id 6.110; landing R-Interpretability-Course.html; access: free)  [roadmap §11]
1. Global-vs-Local-Explanations - what the model learned overall versus why it made this one prediction. widgets: importance-bars
2. Permutation-and-Drop-Column-Importance - model-agnostic importance done honestly, and how it can mislead. widgets: importance-bars
3. SHAP-Values - additive, per-feature contributions that sum exactly to the prediction. widgets: NEW:shap-bars
4. Partial-Dependence-ICE-and-ALE - the shape of a feature's effect, averaged and per-row. widgets: NEW:pdp-curve
5. Fairness-Basics - group metrics, the impossibility results, and what you can actually do about them. widgets: NEW:fairness-metrics, styled-table
6. Model-Cards-and-Documenting-a-Model - writing down intended use, training data and known limits. widgets: doc-structure

## ds-production  (track: scientist; curriculum_id 6.120; landing R-ML-Production-Course.html; access: free)  [roadmap §12]
1. Reproducible-Pipelines-with-targets - a dependency graph that only reruns the steps that changed. widgets: process-flow
2. Versioning-Models-with-vetiver-and-pins - register, version and retrieve a model the way you do code. widgets: process-flow
3. Serving-a-Model-with-plumber - wrap a fitted model in a small REST API. widgets: process-flow
4. Batch-vs-Real-Time-Inference - matching the serving pattern to the decision being made. widgets: process-flow
5. Monitoring-and-Drift - watching inputs and performance after launch, and knowing when to retrain. widgets: NEW:drift-monitor, learning-curve
6. An-ML-System-Design-Checklist - the questions to answer before a model ships. widgets: doc-structure, process-flow

NEW widgets for sections 6-12 (built before the batch; runnable interactive-R required like every widget): **calibration-curve**, **pca-projection**, **kmeans-cluster**, **shap-bars**, **pdp-curve**. Everything else reuses the existing library.

---

# Data Scientist track - ADVANCED tier (roadmap sections 13-22, Pro; first lesson of each section free as a taste)

## ds-reg-glm-expert  (track: scientist; curriculum_id 6.130; landing R-Advanced-Regression-Course.html; access: pro)  [roadmap §13]
1. Robust-Regression-M-Estimators - why one outlier tilts an OLS line, and how M-estimators (Huber) down-weight it. widgets: NEW:robust-weights, leverage-point
2. Robust-Regression-MM-and-Breakdown - the breakdown point, MM-estimation, and rlm vs lmrob for real robustness. widgets: NEW:robust-weights, residual-plot
3. Quantile-Regression - modeling the median and the tails, not just the mean, when spread changes with x. widgets: NEW:quantile-lines
4. Ridge-Regression-and-Shrinkage - the bias-variance trade of shrinking coefficients, and when ridge helps. widgets: NEW:coef-path
5. Lasso-and-Elastic-Net - L1 selection, the coefficient path, and elastic net for correlated predictors. widgets: NEW:coef-path
6. GAMs-Splines-and-Smooths - letting the data choose a smooth curve with penalized splines in mgcv. widgets: NEW:spline-smoother
7. GAMs-Choosing-Smoothness - the wiggliness penalty, k, concurvity, and reading gam.check. widgets: NEW:spline-smoother, residual-plot
8. Count-Models-Poisson-and-Negative-Binomial - Poisson regression, overdispersion, and the negative-binomial fix. widgets: NEW:count-dist
9. Zero-Inflated-and-Hurdle-Models - when a pile of extra zeros needs a two-part model. widgets: NEW:count-dist
10. Gamma-and-Tweedie-Regression - modeling positive, right-skewed outcomes and insurance-style loss. widgets: NEW:glm-family-shapes
11. Beta-and-Ordinal-Regression - proportions in [0,1] with beta, and ordered categories with proportional odds. widgets: NEW:ordinal-cumlogit, NEW:glm-family-shapes
12. Mixed-Models-Random-Intercepts - random intercepts, partial pooling, and the ICC with lme4. widgets: NEW:shrinkage-pool
13. Mixed-Models-Random-Slopes-and-GLMMs - random slopes, GLMMs, and troubleshooting convergence. widgets: NEW:shrinkage-pool

NEW widgets for section 13 (built + mount-tested + emitted-R WebR-verified before the batch): **robust-weights**, **quantile-lines**, **coef-path**, **spline-smoother**, **count-dist**, **glm-family-shapes**, **ordinal-cumlogit**, **shrinkage-pool**. Everything else reuses the existing library. §14-22 arcs + widgets are appended after the §13 pilot verifies.

---

# Data Analyst track (level 2, all free)

Nine courses, one per roadmap section of the Data Analyst track. All free (the analyst track is part of the free common base). Each course's `section` in `Scripts/build_lessons_tracker.py` COURSE_ROADMAP must match the roadmap section number so the breadcrumb + reverse-link line up. Ground every lesson in ONE concrete, named dataset (a small tibble of real-feeling rows) carried through the lesson; teach from scratch; <=12 steps each.

## da-dplyr  (track: analyst; curriculum_id 2.1; landing Data-Wrangling-dplyr-Course.html; access: free)
1. Importing-and-Tidy-Data-in-R - Read a real CSV with readr (column types, the usual import snags), then the three rules of tidy data (one variable per column, one observation per row, one value per cell) and why tidy shape makes everything downstream easier. Show one small messy table becoming tidy. widgets: process-flow, reshape-grid
2. The-dplyr-Verbs - The core verbs on ONE running data frame: filter (keep rows), select (keep columns), mutate/transmute (derive columns), arrange/distinct/count (order, dedupe, tally), and the pipe chaining them into a readable sentence. widgets: table-transform
3. Group-Summarise-and-Clean-in-dplyr - Split-apply-combine with group_by + summarise (counts, means, several summaries at once), deriving categories with case_when, and handling missing values honestly (drop vs impute, na.rm). widgets: table-transform
4. Missing-Value-Treatment - Where NAs come from and how to treat them honestly: find missingness (is.na, per-column counts, simple patterns), the three kinds in plain language (MCAR / MAR / MNAR), and the trade-offs of dropping rows, dropping columns, or imputing (mean / median / mode, last-value-carried-forward), and how each choice can bias the result. widgets: table-transform, chart-plotter

## da-joins  (track: analyst; curriculum_id 2.2; landing Join-Reshape-Course.html; access: free)
1. Joining-Tables-in-R - Combine two keyed tables: the mutating joins (inner, left, right, full) and what happens to unmatched rows; the filtering joins (semi, anti); and when you need non-equi / rolling joins with join_by. widgets: join-diagram
2. Pivoting-Long-and-Wide-in-R - Reshape with pivot_longer / pivot_wider (why long/tidy is what ggplot and models want), and rectangle nested data with nest / unnest. widgets: reshape-grid, table-transform
3. Splitting-Uniting-and-Fuzzy-Joins - Clean columns by splitting and uniting (separate / unite), and join keys that do not match exactly with fuzzy matching. widgets: table-transform, join-diagram
4. Nest-Unnest-and-Rectangling - Treat a column as a column of tables: nest() to pack each group into a list-column, map a summary or model over each, then unnest() back to a flat frame; and rectangle awkward nested / JSON-like data into tidy rows. widgets: reshape-grid, table-transform

## da-eda  (track: analyst; curriculum_id 2.3; landing EDA-Course.html; access: free)
1. An-EDA-Framework-and-One-Variable - A repeatable 7-step EDA framework, then univariate analysis: distribution shape, center and spread, histogram and boxplot for one variable at a time. widgets: process-flow, chart-plotter
2. Two-Variables-and-Correlation-in-R - Bivariate EDA: scatterplots for two numerics, reading the relationship, and correlation (Pearson r, the correlation matrix, why correlation is not causation). widgets: chart-plotter, correlation-heatmap
3. Outliers-and-Automated-EDA - Spot outliers (the IQR rule, boxplots) and decide what to do about them, then speed up the first pass with automated EDA (skimr, DataExplorer). widgets: chart-plotter, styled-table
4. Detecting-Outliers-in-R - Go past eyeballing: the IQR / boxplot rule, z-scores and the robust modified z-score (MAD), a quick look at multivariate outliers, and the decision that follows - keep, cap (winsorize), or drop, and how each changes the summary. widgets: chart-plotter, table-transform
5. Categorical-and-Frequency-EDA - Explore categories properly: frequency and proportion tables, two-way cross-tabs, bar and stacked / proportion views, and spotting rare, missing or mislabeled levels before they break a model. widgets: chart-plotter, styled-table
6. Distribution-Shape-and-Transformations - Read distribution shape (skew, heavy tails, multiple peaks), check normality with a Q-Q plot, and tame skew with log / square-root / Box-Cox transformations so later methods behave. widgets: chart-plotter, process-flow
7. Multivariate-EDA-with-Pairs-and-PCA - Look at many variables at once: the pairs / scatterplot matrix and correlation heatmap (GGally), then compress correlated columns into a few components with PCA (prcomp) and read a scree plot and biplot. widgets: correlation-heatmap, chart-plotter
8. Data-Quality-and-Validation - A pre-analysis quality pass: check types, ranges, uniqueness and key integrity, find duplicates and impossible values, and codify the checks as reusable rules so they run on every refresh. widgets: styled-table, process-flow

## da-ggplot  (track: analyst; curriculum_id 2.4; landing ggplot2-Course.html; access: free)
1. The-Grammar-of-Graphics - The idea behind ggplot2: data -> aesthetic mappings -> geoms -> layers. Build the same plot up one layer at a time and read the code as a grammar. widgets: chart-plotter
2. Scatter-and-Line-Charts-in-ggplot2 - geom_point and geom_line: when to use each, mapping a third variable to color/size, adding a trend line. widgets: chart-plotter
3. Bar-and-Distribution-Charts-in-ggplot2 - geom_col/geom_bar for counts and amounts, and histograms/boxplots for distributions; what each chart answers. widgets: chart-plotter
4. A-ggplot2-Gallery-and-Publication-Figures - A short tour of common chart types and how to choose, then polishing one figure to publication quality (labels, titles, theme). widgets: chart-plotter, theme-styler

## da-ggplot2-adv  (track: analyst; curriculum_id 2.5; landing Advanced-ggplot2-Course.html; access: free)
1. Facets-and-Scales-in-ggplot2 - Small multiples with facet_wrap/facet_grid (one chart per group), and controlling scales, guides and legends. widgets: facet-grid, chart-plotter
2. Themes-Color-and-Accessibility - Restyle without touching data: built-in and custom themes, color scales, and colorblind-safe, accessible palettes. widgets: theme-styler
3. Annotate-and-Compose-Plots - Annotations that explain (labels, reference lines), non-overlapping text with ggrepel, and composing several plots with patchwork. widgets: chart-plotter, process-flow

## da-datatable  (track: analyst; curriculum_id 2.6; landing data-table-Course.html; access: free)
1. data-table-Syntax-and-Keys - The DT[i, j, by] anatomy (filter rows, compute columns, group), and keys for lightning-fast lookups and joins. widgets: table-transform, process-flow
2. dplyr-vs-data-table - The same task in both, head to head, and the speed / memory trade-offs. Keep every data.table example TINY and single-threaded (call setDTthreads(1) once up front) so it runs fast in-browser; if any block is slow or risky, make it an illustrative r-static block. widgets: chart-plotter, table-transform
3. Bigger-than-Memory-Data-in-R - Wrangling millions of rows, and querying data that does not fit in memory with duckdb / duckplyr. widgets: chart-plotter, process-flow
4. Bridge-with-dtplyr - Write dplyr, get data.table speed: dtplyr's lazy_dt() translates dplyr verbs into data.table under the hood; see the translation with show_query(), know when the bridge pays off, and where it leaks (collect() to materialize). widgets: table-transform, process-flow

## da-tables  (track: analyst; curriculum_id 2.7; landing Report-Tables-Course.html; access: free)
1. Report-Tables-with-gt-and-flextable - Turn a raw data frame into a presentation-ready table (titles, grouping, formatting) with gt and flextable, and HTML tables with kableExtra. widgets: styled-table
2. Summary-Tables-and-Number-Formatting - One-line summary and regression tables with gtsummary, and formatting numbers, percentages and units so a table reads cleanly. widgets: styled-table

## da-dashboards  (track: analyst; curriculum_id 2.8; landing Dashboards-Course.html; access: free)
1. Interactive-Charts-and-Maps-in-R - Make a chart interactive with plotly (hover, zoom) and put points on a map with leaflet. widgets: chart-plotter, dashboard-layout
2. Quarto-Dashboards-and-Linked-Views - Lay out a Quarto dashboard (value boxes + chart tiles) and link views so a selection in one updates the others (crosstalk). widgets: dashboard-layout
3. Your-First-Shiny-App - Reactivity from scratch: an input drives an output, the smallest Shiny app, and how the reactive graph re-runs. widgets: dashboard-layout, process-flow

## da-communicate  (track: analyst; curriculum_id 2.9; landing Communicate-Automate-Course.html; access: free)
1. Reproducible-Reports-with-Quarto - The anatomy of a Quarto / R Markdown document (YAML, prose, code chunks) and what it knits to, then parameterized reports that re-run for any input. widgets: doc-structure, process-flow
2. Telling-a-Story-with-Data - Lead with the answer (the executive summary), then structure a short data story that a busy reader can act on. widgets: chart-plotter, doc-structure
3. AI-Assisted-Analysis-in-R - Use an LLM to summarize and label data from R (ellmer), and a clear-eyed guide to when to trust, and when not to trust, an LLM in an analysis. widgets: agent-loop, process-flow


# New to R (Foundations) track (level 1, all free)
The shared base track; courses map to the New to R roadmap sections (one course per section), all free (level 1). Lessons consolidate related curriculum items so every item is taught from scratch without thin filler lessons (Option A, owner-approved 2026-06-29: ~35 lessons, full coverage). Ground each lesson in ONE concrete running example, <=12 steps. Foundations widgets: vector-coercion, dataframe-builder, control-flow, scope-chain, regex-highlight, nest-unnest (plus tree-diagram, process-flow, table-transform). Each section also gets a "Quiz" (hand-authored after its lessons, like the analyst quizzes).

## nr-basics  (track: foundations; curriculum_id 1.1; landing R-Foundations-Basics-Course.html; access: free)
1. R-Syntax-and-First-Objects - Your first R session: run code, assign with <-, call functions, read an error, and get help. widgets: process-flow
2. Atomic-Vectors-and-Data-Types - The atomic vector and R's core types (logical, integer, double, character); typeof and length. widgets: vector-coercion
3. Operators-Recycling-and-Coercion - Arithmetic and logical operators, vector recycling, and how mixing types coerces the whole vector. widgets: vector-coercion
4. Missing-and-Special-Values - NA, NULL, NaN, and Inf: what each means and how it propagates through your code. widgets: dataframe-builder
5. Install-and-Load-Packages - Install from CRAN with install.packages, load with library, and where packages live on your machine. widgets: process-flow

## nr-structures  (track: foundations; curriculum_id 1.2; landing R-Foundations-Structures-Course.html; access: free)
1. Lists-and-Nested-Data - Lists hold mixed types and nest inside each other; reach inside with [, [[ and $. widgets: tree-diagram
2. Data-Frames-and-Tibbles - The data frame as equal-length typed columns, and what a tibble adds. widgets: dataframe-builder
3. Inspecting-Data-Structure - See any object's shape with str, class, length, dim, names and attributes. widgets: dataframe-builder
4. Matrices-and-Arrays - Rectangular all-one-type data: build it, index by row and column, and reduce it with apply. widgets: table-transform
5. Type-Conversion-in-Practice - Convert on purpose with as.numeric, as.character and as.factor, and fix a column that imported as the wrong type. widgets: vector-coercion

## nr-programming  (track: foundations; curriculum_id 1.3; landing R-Foundations-Programming-Course.html; access: free)
1. Subsetting-and-Replacement - Pull out and overwrite elements with [, [[, $, logical and negative indices, including x[i] <- value. widgets: table-transform
2. Control-Flow-in-R - if and else, for and while loops, and next and break, watched one iteration at a time. widgets: control-flow
3. Writing-Functions-in-R - Wrap repeated work in a function: the arguments, the body, and the value it returns. widgets: process-flow
4. Arguments-Defaults-and-the-Pipe - Default and named arguments, the dots, and chaining steps with the |> pipe. widgets: process-flow
5. Environments-and-Scope - How R resolves a name: the function's own environment first, then outward to the global one. widgets: scope-chain

## nr-import  (track: foundations; curriculum_id 1.4; landing R-Foundations-Import-Course.html; access: free)
1. Reading-CSV-and-Delimited-Files - Read CSV and delimited files with readr, controlling column types and parsing problems. widgets: table-transform
2. Reading-Excel-and-Other-Formats - Read Excel workbooks with readxl and SPSS, Stata and SAS files with haven. widgets: table-transform
3. JSON-and-Web-Data - Pull JSON from an API with jsonlite and scrape an HTML table with rvest. widgets: tree-diagram
4. Databases-and-Big-Files - Query a database with DBI and dbplyr, read Parquet with arrow, and handle encodings and very large files. widgets: process-flow
5. Saving-and-Exporting-Data - Write results back out with write_csv, saveRDS and writexl, and choose the right format. widgets: process-flow

## nr-strings  (track: foundations; curriculum_id 1.5; landing R-Foundations-Strings-Course.html; access: free)
1. Strings-with-stringr - Detect, extract, replace and join text with the stringr verbs. widgets: table-transform
2. Regular-Expressions-in-R - Build a pattern from scratch, see exactly what it matches, then find, extract and replace with it. widgets: regex-highlight
3. Dates-and-Times-in-R - Parse and do arithmetic on dates with lubridate, and work correctly across time zones. widgets: process-flow
4. Factors-with-forcats - Ordered categories: create, reorder and relabel factors with forcats. widgets: table-transform

## nr-iteration  (track: foundations; curriculum_id 1.6; landing R-Foundations-Iteration-Course.html; access: free)
1. Why-Vectorization-Beats-Loops - Operate on a whole vector at once instead of looping element by element, and why it is faster and clearer. widgets: control-flow
2. The-apply-Family - apply, lapply and sapply, plus the type-safe vapply, over lists and matrices. widgets: process-flow
3. The-purrr-map-Family - map and its typed variants, map2 and pmap for several inputs, and walk for side effects. widgets: process-flow
4. Resilient-and-Nested-Iteration - Keep going past failures with safely and possibly, and work with list-columns using nest and unnest. widgets: nest-unnest

## nr-debugging  (track: foundations; curriculum_id 1.7; landing R-Foundations-Debugging-Course.html; access: free)
1. Errors-Warnings-and-Messages - Signal problems with stop, warning and message, and write error messages people can act on. widgets: process-flow
2. tryCatch-and-Input-Validation - Recover from failures with tryCatch, and guard a function's inputs with stopifnot. widgets: control-flow
3. Debugging-Tools-in-R - Locate a bug with traceback, step through it with browser, and use the IDE debugger. widgets: process-flow

## nr-workflow  (track: foundations; curriculum_id 1.8; landing R-Foundations-Workflow-Course.html; access: free)
1. RStudio-Projects-and-here - Keep work self-contained with RStudio Projects and stable paths with the here package. widgets: tree-diagram
2. Reproducibility-with-renv-and-git - Pin package versions with renv and track your changes with git. widgets: process-flow
3. The-Modern-R-Toolchain-2026 - A short tour of Positron, httr2, duckdb and arrow, and talking to an LLM from R with ellmer. widgets: process-flow
4. Capstone-A-Reproducible-Analysis - Tie it together: a project that imports, tidies, analyzes and reports, reproducibly from start to finish. widgets: process-flow
