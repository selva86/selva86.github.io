# DS Track Lessons - "Rushed Pedagogy" Triage

_Auto-generated. Verdicts PENDING a read-judge. Do NOT rewrite until the owner says go._

## What "rushed" means

The SAME failure as the original **`Quantile-Regression`** lesson: notation dropped fast, clever-cryptic code (`r * (tau - (r < 0))`), ideas asserted not shown, multiple ideas per step. Every DS lesson except **`Split-Conformal-Prediction`** was authored under the old pipeline (global CLAUDE.md persona + 12-step cap + no R14 care rules), so any CAN read rushed.

## Why cheap metrics CANNOT decide this (tested, and it failed)

I calibrated the only cheap signals (notation density = formulas/step, and a clever-golf code smell) against the two known reference lessons:

- REFERENCE-RUSHED `Quantile-Regression`: **1.92** formulas/step (23 formulas / 12 steps), golf-smell 2
- REFERENCE-GOOD  `Split-Conformal-Prediction`: **2.40** formulas/step (36 formulas / 15 steps), golf-smell 0

**The good lesson scores HIGHER density than the bad one.** So formula count / density does NOT separate rushed from careful - the difference is whether each formula is *explained patiently or dropped cold*, which no cheap metric can see. Conclusion: there is **no reliable token-free way** to flag "rushed like Quantile"; it needs a per-lesson READ. The metrics below are CONTEXT only (they help spot the most notation-heavy lessons to read first), NOT a verdict.

## The reliable method: a cheap read-judge (does not burn the main context)

Run one `claude -p --model haiku` per lesson (as a subprocess, so it costs cheap API tokens, not this session's context): give it the lesson + the rubric "is this rushed like `Quantile-Regression` (bad) or careful like `Split-Conformal-Prediction` (good)? verdict RUSHED / BORDERLINE / OK + one reason". Collect the verdicts into the `verdict` column. That is the accurate, efficient answer - ask and I will run it over the whole track (or advanced-tier first).

## All DS-track lessons (metrics = context; verdict PENDING a read-judge)

| Sec | Slug | Kind | Steps | formulas | f/step | golf | w/step | verdict |
|-----|------|------|-------|----------|--------|------|--------|---------|
| 1 | `Framing-a-Problem-as-ML` | lesson | 12 | 1 | 0.08 | 0 | 222 | PENDING read-judge |
| 1 | `ML-Workflow-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 90 | PENDING read-judge |
| 1 | `The-Bias-Variance-Tradeoff` | lesson | 12 | 7 | 0.58 | 0 | 208 | PENDING read-judge |
| 1 | `Train-Validation-Test-and-Data-Leakage` | lesson | 12 | 12 | 1.00 | 0 | 229 | PENDING read-judge |
| 1 | `Your-First-End-to-End-Model-in-R` | lesson | 12 | 13 | 1.08 | 0 | 237 | PENDING read-judge |
| 2 | `GLMs-Beyond-Logistic` | lesson | 12 | 19 | 1.58 | 0 | 269 | PENDING read-judge |
| 2 | `Heteroskedasticity-and-Autocorrelation` | lesson | 12 | 39 | 3.25 | 0 | 274 | PENDING read-judge |
| 2 | `Inference-and-Prediction-in-Regression` | lesson | 11 | 33 | 3.00 | 0 | 271 | PENDING read-judge |
| 2 | `Influence-and-Leverage` | lesson | 11 | 33 | 3.00 | 0 | 249 | PENDING read-judge |
| 2 | `Logistic-Regression-Done-Properly` | lesson | 12 | 19 | 1.58 | 0 | 234 | PENDING read-judge |
| 2 | `Multicollinearity-in-Regression` | lesson | 11 | 14 | 1.27 | 0 | 254 | PENDING read-judge |
| 2 | `OLS-Regression-from-Scratch` | lesson | 11 | 27 | 2.45 | 0 | 227 | PENDING read-judge |
| 2 | `Regression-Assumptions-and-Residuals` | lesson | 12 | 25 | 2.08 | 0 | 224 | PENDING read-judge |
| 2 | `Regression-Modeling-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 87 | PENDING read-judge |
| 3 | `Classification-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 88 | PENDING read-judge |
| 3 | `Decision-Boundaries-and-Model-Geometry` | lesson | 12 | 24 | 2.00 | 0 | 226 | PENDING read-judge |
| 3 | `Decision-Trees-for-Classification` | lesson | 12 | 5 | 0.42 | 0 | 207 | PENDING read-judge |
| 3 | `Discriminant-Analysis-LDA-and-QDA` | lesson | 12 | 44 | 3.67 | 0 | 265 | PENDING read-judge |
| 3 | `Naive-Bayes-for-Tabular-and-Text` | lesson | 12 | 25 | 2.08 | 0 | 226 | PENDING read-judge |
| 3 | `Reading-a-Classifier` | lesson | 11 | 10 | 0.91 | 0 | 202 | PENDING read-judge |
| 3 | `kNN-and-the-Curse-of-Dimensionality` | lesson | 12 | 14 | 1.17 | 0 | 232 | PENDING read-judge |
| 4 | `Early-Stopping-and-Learning-Curves` | lesson | 11 | 12 | 1.09 | 0 | 247 | PENDING read-judge |
| 4 | `Gradient-Boosting-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 92 | PENDING read-judge |
| 4 | `Gradient-Boosting-from-Scratch` | lesson | 11 | 17 | 1.55 | 0 | 226 | PENDING read-judge |
| 4 | `LightGBM-and-CatBoost-in-R` | lesson | 12 | 22 | 1.83 | 0 | 230 | PENDING read-judge |
| 4 | `Monotonic-Constraints-for-Business-Rules` | lesson | 11 | 7 | 0.64 | 0 | 231 | PENDING read-judge |
| 4 | `Quantile-Regression-Forests-and-Prediction-Intervals` | lesson | 12 | 19 | 1.58 | 0 | 228 | PENDING read-judge |
| 4 | `RF-Course-Lesson-1` | lesson | 11 | 6 | 0.55 | 1 | 126 | PENDING read-judge |
| 4 | `RF-Course-Lesson-2` | lesson | 12 | 7 | 0.58 | 1 | 108 | PENDING read-judge |
| 4 | `RF-Course-Lesson-3` | lesson | 11 | 3 | 0.27 | 1 | 111 | PENDING read-judge |
| 4 | `The-Hyperparameters-That-Matter` | lesson | 12 | 39 | 3.25 | 0 | 267 | PENDING read-judge |
| 5 | `Bundle-Steps-with-workflows` | lesson | 12 | 10 | 0.83 | 2 | 211 | PENDING read-judge |
| 5 | `Compare-Many-Models-with-workflowsets` | lesson | 11 | 5 | 0.45 | 2 | 248 | PENDING read-judge |
| 5 | `Define-Models-with-parsnip` | lesson | 12 | 5 | 0.42 | 2 | 198 | PENDING read-judge |
| 5 | `Measure-with-yardstick` | lesson | 11 | 6 | 0.55 | 2 | 221 | PENDING read-judge |
| 5 | `Preprocess-with-recipes` | lesson | 11 | 6 | 0.55 | 0 | 192 | PENDING read-judge |
| 5 | `Resample-with-rsample` | lesson | 12 | 13 | 1.08 | 2 | 213 | PENDING read-judge |
| 5 | `Tune-with-the-tune-package` | lesson | 11 | 12 | 1.09 | 2 | 245 | PENDING read-judge |
| 5 | `tidymodels-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 83 | PENDING read-judge |
| 6 | `Encoding-Categorical-Variables` | lesson | 12 | 16 | 1.33 | 0 | 220 | PENDING read-judge |
| 6 | `Feature-Engineering-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 109 | PENDING read-judge |
| 6 | `Feature-Selection-and-Spotting-Leakage` | lesson | 12 | 22 | 1.83 | 0 | 275 | PENDING read-judge |
| 6 | `Features-from-Dates-Text-and-Geo` | lesson | 11 | 13 | 1.18 | 0 | 288 | PENDING read-judge |
| 6 | `Imputing-Missing-Values-in-Features` | lesson | 11 | 17 | 1.55 | 0 | 301 | PENDING read-judge |
| 6 | `Interaction-and-Spline-Features` | lesson | 12 | 24 | 2.00 | 0 | 228 | PENDING read-judge |
| 6 | `Scaling-and-Transformations` | lesson | 11 | 22 | 2.00 | 0 | 271 | PENDING read-judge |
| 6 | `Target-Encoding-Without-Leakage` | lesson | 12 | 35 | 2.92 | 0 | 250 | PENDING read-judge |
| 7 | `Comparing-Models-Statistically` | lesson | 12 | 17 | 1.42 | 0 | 237 | PENDING read-judge |
| 7 | `Cross-Validation-Strategies` | lesson | 12 | 16 | 1.33 | 0 | 210 | PENDING read-judge |
| 7 | `From-Metrics-to-Money` | lesson | 10 | 25 | 2.50 | 0 | 280 | PENDING read-judge |
| 7 | `Grouped-Blocked-and-Time-Aware-CV` | lesson | 12 | 16 | 1.33 | 0 | 264 | PENDING read-judge |
| 7 | `Hyperparameter-Tuning-Strategies` | lesson | 12 | 22 | 1.83 | 0 | 264 | PENDING read-judge |
| 7 | `Model-Evaluation-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 105 | PENDING read-judge |
| 7 | `Nested-Cross-Validation` | lesson | 12 | 15 | 1.25 | 0 | 234 | PENDING read-judge |
| 7 | `Scoring-Rules-and-Regression-Metrics` | lesson | 11 | 37 | 3.36 | 0 | 284 | PENDING read-judge |
| 8 | `Beyond-Binary-Multiclass-Classification` | lesson | 12 | 39 | 3.25 | 1 | 214 | PENDING read-judge |
| 8 | `Calibrating-Predicted-Probabilities` | lesson | 12 | 22 | 1.83 | 0 | 251 | PENDING read-judge |
| 8 | `Class-Imbalance-and-Resampling` | lesson | 11 | 12 | 1.09 | 0 | 217 | PENDING read-judge |
| 8 | `Imbalanced-Classification-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 101 | PENDING read-judge |
| 8 | `ROC-PR-Lift-and-Gains-Curves` | lesson | 12 | 14 | 1.17 | 2 | 227 | PENDING read-judge |
| 8 | `Thresholds-Under-Asymmetric-Costs` | lesson | 12 | 34 | 2.83 | 0 | 189 | PENDING read-judge |
| 8 | `Why-AUC-Is-Not-Enough` | lesson | 11 | 10 | 0.91 | 0 | 214 | PENDING read-judge |
| 9 | `Association-Rules-and-Market-Basket` | lesson | 12 | 53 | 4.42 | 3 | 238 | PENDING read-judge |
| 9 | `Cluster-Validation-and-Stability` | lesson | 11 | 22 | 2.00 | 0 | 291 | PENDING read-judge |
| 9 | `Factor-Analysis` | lesson | 11 | 22 | 2.00 | 0 | 207 | PENDING read-judge |
| 9 | `Gaussian-Mixture-Models` | lesson | 12 | 30 | 2.50 | 0 | 268 | PENDING read-judge |
| 9 | `Hierarchical-and-Density-Clustering` | lesson | 11 | 20 | 1.82 | 0 | 274 | PENDING read-judge |
| 9 | `Principal-Component-Analysis` | lesson | 12 | 8 | 0.67 | 0 | 191 | PENDING read-judge |
| 9 | `Unsupervised-Learning-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 103 | PENDING read-judge |
| 9 | `k-Means-and-Choosing-k` | lesson | 12 | 22 | 1.83 | 0 | 210 | PENDING read-judge |
| 9 | `t-SNE-and-UMAP` | lesson | 12 | 25 | 2.08 | 0 | 310 | PENDING read-judge |
| 10 | `AB-Testing-and-Experiment-Design` | lesson | 13 | 62 | 4.77 | 0 | 288 | PENDING read-judge |
| 10 | `Causal-Diagrams-with-DAGs` | lesson | 12 | 38 | 3.17 | 0 | 261 | PENDING read-judge |
| 10 | `Causal-Inference-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 112 | PENDING read-judge |
| 10 | `Correlation-Causation-and-Potential-Outcomes` | lesson | 12 | 32 | 2.67 | 0 | 267 | PENDING read-judge |
| 10 | `Reading-an-Experiment` | lesson | 12 | 11 | 0.92 | 0 | 279 | PENDING read-judge |
| 10 | `When-You-Cannot-Randomize` | lesson | 12 | 17 | 1.42 | 0 | 312 | PENDING read-judge |
| 11 | `Fairness-Basics` | lesson | 12 | 15 | 1.25 | 0 | 232 | PENDING read-judge |
| 11 | `Global-vs-Local-Explanations` | lesson | 12 | 17 | 1.42 | 0 | 204 | PENDING read-judge |
| 11 | `Model-Cards-and-Documenting-a-Model` | lesson | 11 | 0 | 0.00 | 0 | 256 | PENDING read-judge |
| 11 | `Model-Interpretability-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 100 | PENDING read-judge |
| 11 | `Partial-Dependence-ICE-and-ALE` | lesson | 12 | 26 | 2.17 | 0 | 256 | PENDING read-judge |
| 11 | `Permutation-and-Drop-Column-Importance` | lesson | 12 | 16 | 1.33 | 0 | 236 | PENDING read-judge |
| 11 | `SHAP-Values` | lesson | 12 | 42 | 3.50 | 0 | 263 | PENDING read-judge |
| 12 | `An-ML-System-Design-Checklist` | lesson | 12 | 6 | 0.50 | 0 | 283 | PENDING read-judge |
| 12 | `Batch-vs-Real-Time-Inference` | lesson | 11 | 14 | 1.27 | 0 | 257 | PENDING read-judge |
| 12 | `ML-Production-Quiz` | quiz | 10 | 0 | 0.00 | 0 | 106 | PENDING read-judge |
| 12 | `Monitoring-and-Drift` | lesson | 12 | 23 | 1.92 | 0 | 262 | PENDING read-judge |
| 12 | `Reproducible-Pipelines-with-targets` | lesson | 12 | 0 | 0.00 | 0 | 223 | PENDING read-judge |
| 12 | `Serving-a-Model-with-plumber` | lesson | 12 | 0 | 0.00 | 0 | 234 | PENDING read-judge |
| 12 | `Versioning-Models-with-vetiver-and-pins` | lesson | 11 | 0 | 0.00 | 0 | 220 | PENDING read-judge |
| 13 | `Advanced-Regression-Quiz` | quiz | 14 | 0 | 0.00 | 0 | 152 | PENDING read-judge |
| 13 | `Beta-and-Ordinal-Regression` | lesson | 12 | 29 | 2.42 | 1 | 303 | PENDING read-judge |
| 13 | `Count-Models-Poisson-and-Negative-Binomial` | lesson | 12 | 36 | 3.00 | 0 | 224 | PENDING read-judge |
| 13 | `GAMs-Choosing-Smoothness` | lesson | 12 | 4 | 0.33 | 0 | 254 | PENDING read-judge |
| 13 | `GAMs-Splines-and-Smooths` | lesson | 12 | 23 | 1.92 | 0 | 261 | PENDING read-judge |
| 13 | `Gamma-and-Tweedie-Regression` | lesson | 12 | 31 | 2.58 | 0 | 288 | PENDING read-judge |
| 13 | `Lasso-and-Elastic-Net` | lesson | 12 | 25 | 2.08 | 1 | 241 | PENDING read-judge |
| 13 | `Mixed-Models-Random-Intercepts` | lesson | 12 | 37 | 3.08 | 0 | 257 | PENDING read-judge |
| 13 | `Mixed-Models-Random-Slopes-and-GLMMs` | lesson | 12 | 33 | 2.75 | 0 | 271 | PENDING read-judge |
| 13 | `Quantile-Regression` | lesson | 12 | 23 | 1.92 | 2 | 229 | REFERENCE-RUSHED |
| 13 | `Ridge-Regression-and-Shrinkage` | lesson | 12 | 26 | 2.17 | 0 | 239 | PENDING read-judge |
| 13 | `Robust-Regression-M-Estimators` | lesson | 11 | 21 | 1.91 | 0 | 191 | PENDING read-judge |
| 13 | `Robust-Regression-MM-and-Breakdown` | lesson | 12 | 13 | 1.08 | 0 | 216 | PENDING read-judge |
| 13 | `Zero-Inflated-and-Hurdle-Models` | lesson | 11 | 27 | 2.45 | 0 | 290 | PENDING read-judge |
| 14 | `A-Tuned-Stacked-Model-End-to-End` | lesson | 12 | 9 | 0.75 | 2 | 445 | PENDING read-judge |
| 14 | `Advanced-Supervised-Learning-Quiz` | quiz | 14 | 0 | 0.00 | 0 | 175 | PENDING read-judge |
| 14 | `Approximate-Nearest-Neighbors-at-Scale` | lesson | 12 | 15 | 1.25 | 0 | 420 | PENDING read-judge |
| 14 | `Bayesian-Optimization-for-Hyperparameters` | lesson | 12 | 46 | 3.83 | 0 | 403 | PENDING read-judge |
| 14 | `Gaussian-Processes-for-Regression` | lesson | 12 | 46 | 3.83 | 0 | 350 | PENDING read-judge |
| 14 | `Kernel-SVMs-and-the-Kernel-Trick` | lesson | 12 | 30 | 2.50 | 0 | 241 | PENDING read-judge |
| 14 | `Regularized-Discriminant-Analysis` | lesson | 12 | 61 | 5.08 | 0 | 286 | PENDING read-judge |
| 14 | `Stacking-and-the-Super-Learner` | lesson | 12 | 30 | 2.50 | 1 | 385 | PENDING read-judge |
| 14 | `Support-Vector-Machines-Maximum-Margin` | lesson | 11 | 34 | 3.09 | 0 | 251 | PENDING read-judge |
| 15 | `Checking-Proportional-Hazards` | lesson | 11 | 26 | 2.36 | 0 | 279 | PENDING read-judge |
| 15 | `Competing-Risks-and-Cumulative-Incidence` | lesson | 12 | 21 | 1.75 | 0 | 307 | PENDING read-judge |
| 15 | `Cox-Proportional-Hazards` | lesson | 11 | 42 | 3.82 | 0 | 289 | PENDING read-judge |
| 15 | `Kaplan-Meier-and-the-Log-Rank-Test` | lesson | 12 | 21 | 1.75 | 0 | 218 | PENDING read-judge |
| 15 | `Parametric-and-AFT-Models` | lesson | 12 | 37 | 3.08 | 0 | 337 | PENDING read-judge |
| 15 | `Survival-Analysis-Quiz` | quiz | 14 | 0 | 0.00 | 0 | 175 | PENDING read-judge |
| 15 | `Survival-Data-and-Censoring` | lesson | 12 | 37 | 3.08 | 0 | 278 | PENDING read-judge |
| 15 | `Survival-ML-and-Evaluation` | lesson | 11 | 23 | 2.09 | 0 | 336 | PENDING read-judge |
| 16 | `Bayesian-Model-Comparison-LOO-and-WAIC` | lesson | 12 | 38 | 3.17 | 0 | 383 | PENDING read-judge |
| 16 | `Bayesian-Modeling-Quiz` | quiz | 14 | 0 | 0.00 | 0 | 200 | PENDING read-judge |
| 16 | `Bayesian-Regression-and-GLMs-End-to-End` | lesson | 12 | 28 | 2.33 | 0 | 368 | PENDING read-judge |
| 16 | `Conjugacy-and-Choosing-Priors` | lesson | 12 | 44 | 3.67 | 0 | 312 | PENDING read-judge |
| 16 | `HMC-NUTS-and-MCMC-Diagnostics` | lesson | 12 | 54 | 4.50 | 0 | 399 | PENDING read-judge |
| 16 | `Hierarchical-Models-and-Partial-Pooling` | lesson | 12 | 64 | 5.33 | 1 | 357 | PENDING read-judge |
| 16 | `LLM-Agents-in-R` | lesson | 14 | 13 | 0.93 | 0 | 191 | PENDING read-judge |
| 16 | `MCMC-and-the-Metropolis-Sampler` | lesson | 12 | 23 | 1.92 | 0 | 343 | PENDING read-judge |
| 16 | `Posterior-Predictive-Checks` | lesson | 12 | 28 | 2.33 | 0 | 368 | PENDING read-judge |
| 16 | `The-Bayesian-Update` | lesson | 12 | 29 | 2.42 | 0 | 254 | PENDING read-judge |
| 17 | `Cluster-and-Switchback-Experiments` | lesson | 12 | 28 | 2.33 | 0 | 338 | PENDING read-judge |
| 17 | `Contextual-Bandits-and-Off-Policy-Evaluation` | lesson | 12 | 34 | 2.83 | 0 | 392 | PENDING read-judge |
| 17 | `Designing-Experiments-for-Power` | lesson | 12 | 35 | 2.92 | 0 | 244 | PENDING read-judge |
| 17 | `Experiment-Pitfalls-Peeking-and-SRM` | lesson | 12 | 22 | 1.83 | 0 | 324 | PENDING read-judge |
| 17 | `Experimentation-Quiz` | quiz | 14 | 0 | 0.00 | 0 | 195 | PENDING read-judge |
| 17 | `Multi-Armed-Bandits-Explore-vs-Exploit` | lesson | 12 | 33 | 2.75 | 0 | 331 | PENDING read-judge |
| 17 | `Thompson-Sampling-and-Bayesian-Bandits` | lesson | 11 | 20 | 1.82 | 0 | 328 | PENDING read-judge |
| 17 | `Variance-Reduction-with-CUPED` | lesson | 12 | 41 | 3.42 | 1 | 297 | PENDING read-judge |
| 18 | `Causal-Inference-for-Decisions-Quiz` | quiz | 16 | 0 | 0.00 | 0 | 181 | PENDING read-judge |
| 18 | `Difference-in-Differences-and-Parallel-Trends` | lesson | 12 | 12 | 1.00 | 0 | 262 | PENDING read-judge |
| 18 | `Double-Debiased-Machine-Learning` | lesson | 11 | 42 | 3.82 | 0 | 293 | PENDING read-judge |
| 18 | `Instrumental-Variables-and-2SLS` | lesson | 12 | 12 | 1.00 | 0 | 292 | PENDING read-judge |
| 18 | `Inverse-Probability-Weighting-and-Doubly-Robust` | lesson | 12 | 23 | 1.92 | 0 | 313 | PENDING read-judge |
| 18 | `Matching-and-the-Propensity-Score` | lesson | 12 | 21 | 1.75 | 0 | 242 | PENDING read-judge |
| 18 | `Mediation-Analysis` | lesson | 12 | 41 | 3.42 | 0 | 260 | PENDING read-judge |
| 18 | `Regression-Discontinuity` | lesson | 12 | 16 | 1.33 | 0 | 284 | PENDING read-judge |
| 18 | `Sensitivity-Analysis-and-Placebo-Tests` | lesson | 12 | 26 | 2.17 | 0 | 269 | PENDING read-judge |
| 18 | `Staggered-DiD-and-the-Negative-Weights-Problem` | lesson | 12 | 29 | 2.42 | 0 | 259 | PENDING read-judge |
| 18 | `Synthetic-Control` | lesson | 12 | 14 | 1.17 | 0 | 326 | PENDING read-judge |
| 18 | `Uplift-and-Heterogeneous-Effects` | lesson | 12 | 32 | 2.67 | 0 | 304 | PENDING read-judge |
| 19 | `A-Monitoring-and-Robustness-Playbook` | lesson | 12 | 14 | 1.17 | 1 | 307 | PENDING read-judge |
| 19 | `Adapting-to-Drift-Reweighting-and-Retraining` | lesson | 12 | 29 | 2.42 | 0 | 275 | PENDING read-judge |
| 19 | `Adversarial-Robustness` | lesson | 12 | 37 | 3.08 | 8 | 295 | PENDING read-judge |
| 19 | `Detecting-Distribution-Shift` | lesson | 11 | 20 | 1.82 | 0 | 268 | PENDING read-judge |
| 19 | `Group-Robustness-and-DRO` | lesson | 12 | 29 | 2.42 | 0 | 238 | PENDING read-judge |
| 19 | `Kinds-of-Distribution-Shift` | lesson | 11 | 30 | 2.73 | 0 | 202 | PENDING read-judge |
| 19 | `Out-of-Distribution-and-Novelty-Detection` | lesson | 12 | 11 | 0.92 | 0 | 259 | PENDING read-judge |
| 19 | `Robustness-and-Drift-Quiz` | quiz | 14 | 0 | 0.00 | 0 | 222 | PENDING read-judge |
| 20 | `Anomaly-Detection-Quiz` | quiz | 14 | 0 | 0.00 | 0 | 211 | PENDING read-judge |
| 20 | `Autoencoders-for-Anomaly-Detection` | lesson | 11 | 28 | 2.55 | 0 | 291 | PENDING read-judge |
| 20 | `Isolation-Forest-and-Extended-Isolation-Forest` | lesson | 12 | 20 | 1.67 | 0 | 257 | PENDING read-judge |
| 20 | `Kernel-PCA-Sparse-PCA-and-NMF` | lesson | 12 | 44 | 3.67 | 1 | 296 | PENDING read-judge |
| 20 | `Local-Outlier-Factor-and-One-Class-SVM` | lesson | 12 | 45 | 3.75 | 0 | 278 | PENDING read-judge |
| 20 | `Self-Supervised-and-Contrastive-Learning` | lesson | 12 | 23 | 1.92 | 0 | 296 | PENDING read-judge |
| 20 | `Time-Series-Anomaly-Detection` | lesson | 12 | 16 | 1.33 | 0 | 286 | PENDING read-judge |
| 20 | `What-is-an-Anomaly` | lesson | 12 | 16 | 1.33 | 0 | 192 | PENDING read-judge |
| 21 | `Prediction-Intervals-You-Can-Trust` | lesson | 11 | 19 | 1.73 | 0 | 219 | PENDING read-judge |

## Re-write mechanics (when the owner says go, per confirmed-rushed lesson)
delete the lesson `.md`, reset its `lessons-status.json` row to `pending`, run `python Scripts/batch_lessons.py --slug <slug>` (now clean-room: no global CLAUDE.md, no cap, R14). STEP-C review each. Section by section.