# Data Scientist Track - Complete Curriculum (2026)

> The production curriculum for the Data Scientist track. Rationale and the audit of the old 16-section track live in the companion file `Roadmap-Curriculum-Plan-DataScientist-2026.md`. This file is the **what we build**: every section, every lesson, tiered and tagged. One interactive lesson per line item.
>
> **Tiers:** `[CORE]` = the certified path (finishable, sequential). `[ADV]` = Advanced (senior depth, after the cert). `[SPEC]` = Specialization elective (modality/domain, non-linear).
> **WebR tag per lesson:** `(R)` runs live in interactive R; `(R~)` runs live on small data / a reduced demo; `(static)` illustrative code + precomputed output (needs heavy compile, GPU, an API key, or real infra).

## How the page differentiates Core / Advanced / Specialization

Three bands on `data-scientist.html`, top to bottom:
1. **Core - The certified path.** Sections C1-C12, sequential, cert badge. Ends with a **"- Certified Data Scientist -"** milestone divider.
2. **Advanced - Become a senior DS.** Sections A1-A10, band header, visually lighter, all Pro. These deepen Core topics.
3. **Specializations - Pick your domain.** Sections S1-S7, non-linear electives; the learner takes what fits their work.

Mechanism: add `tier: 'core'|'advanced'|'spec'` to each section in `RM2.sections.ds`; the renderer (the shared roadmap module) groups by tier under band headers and draws the cert milestone after the last `core` section. Lesson-level Free/Pro tags are unchanged (Core = free foundations + Pro depth; Adv/Spec = Pro). The free/Pro positional rule still applies within Core.

**Why this shape:** the Core stays coherent and finishable (the thing you certify), while the catalog goes as deep as a senior practitioner needs without making the certified path a 200-lesson slog. It also reads as a career story: *get certified -> go deep -> specialize.*

---

# CORE - The certified Data Scientist path

> Goal of Core: a graduate can frame a problem as ML, build the right model on tabular data, validate it honestly, explain it, run a basic experiment, and ship it. ~12 courses.

## C1. The ML workflow and first models  [CORE]
1. From business question to a validated model - CRISP-DM, the modeling mindset, and beating a baseline as one idea `(R)`
2. Signal, noise and generalization; the bias-variance tradeoff (with a note on double descent) `(R)`
3. Train / validation / test discipline, and the leakage taxonomy (target, temporal, train-serving) `(R)`
4. Your first end-to-end model: raw data to a held-out score `(R)`
5. Reproducibility from day one - seeds, project structure, renv `(R)`

## C2. Regression, done properly  [CORE]  (the spine)
1. OLS from scratch - geometry, the normal equations, what the coefficients mean `(R)`
2. Assumptions and residual analysis - residuals-vs-fitted, Q-Q, scale-location, residuals-vs-leverage `(R)`
3. Influence and leverage - hat values, Cook's distance, DFBETAS / DFFITS `(R)`
4. Multicollinearity - VIF, condition number, and what to actually do about it `(R)`
5. Heteroskedasticity and autocorrelation - tests, robust (sandwich) SEs, WLS / GLS `(R)`
6. Inference and prediction - confidence vs prediction intervals, the bootstrap, the RESET test `(R)`
7. Logistic regression, properly - link and odds, marginal effects, separation and Firth's penalty `(R)`
8. GLMs beyond logistic - Poisson, Negative Binomial and quasi models for counts `(R)`

## C3. Classification fundamentals  [CORE]
1. k-nearest neighbors and the curse of dimensionality - distance metrics, weighting `(R)`
2. Naive Bayes for text and tabular data - why independence works `(R)`
3. Linear and quadratic discriminant analysis (LDA / QDA) `(R)`
4. Decision trees from the ground up `(R)`
5. Decision boundaries, model geometry, and generative vs discriminative `(R)`
6. Reading a classifier - confusion matrix, precision/recall, ROC vs PR `(R)`

## C4. Trees and gradient boosting  [CORE]  (the tabular workhorses)
1. Bagging and random forests with ranger - OOB error, importance-bias `(R)`
2. Gradient boosting - intuition, then xgboost `(R~)`
3. LightGBM and CatBoost in R - native categoricals, ordered target statistics `(R~)`
4. The hyperparameters that actually matter - learning rate, depth, regularization `(R~)`
5. Early stopping and reading learning curves `(R~)`
6. Monotonic constraints for business rules `(R~)`
7. Quantile regression forests and prediction intervals from trees `(R)`

## C5. The tidymodels workflow  [CORE]
1. Preprocess data with recipes `(R)`
2. Define models with parsnip (and bonsai for boosting) `(R)`
3. Bundle steps with workflows `(R)`
4. Resample with rsample `(R)`
5. Measure with yardstick `(R)`
6. Tune with the tune package `(R)`
7. Compare many models with workflowsets, and a peek at AutoML (agua / h2o) `(R~)`

## C6. Feature engineering and selection  [CORE]
1. Encoding categorical variables - one-hot, dummy, ordinal `(R)`
2. Target / impact encoding, done out-of-fold (leak-free) `(R)`
3. Scaling and transformations - Yeo-Johnson, Box-Cox `(R)`
4. Interaction and spline features `(R)`
5. Date, text and geospatial features `(R)`
6. Missing data - single vs multiple imputation (MICE), and what is honest `(R)`
7. Feature selection - filter, wrapper, embedded (Boruta, RFE) `(R)`
8. Detecting target leakage - the checklist `(R)`

## C7. Model evaluation, resampling and tuning  [CORE]
1. Cross-validation strategies - k-fold, repeated, stratified `(R)`
2. Grouped, blocked and time-aware CV - preventing group and temporal leakage `(R)`
3. Nested cross-validation, done right `(R)`
4. Grid, random and Bayesian tuning `(R)`
5. Faster search - racing (finetune) and Hyperband / ASHA `(R)`
6. Proper scoring rules and regression metrics `(R)`
7. Comparing models statistically, and the one-standard-error rule `(R)`
8. From metrics to money - decision curves and profit curves `(R)`

## C8. Imbalanced, cost-sensitive and calibrated classification  [CORE]
1. Beyond binary - multiclass and multilabel strategies `(R)`
2. Class imbalance with themis - SMOTE, ROSE `(R)`
3. Choosing the threshold under asymmetric costs `(R)`
4. ROC, PR, lift and gains curves `(R)`
5. Calibrating predicted probabilities - Platt, isotonic `(R)`
6. Why AUC is not enough - the Brier score and calibration `(R)`

## C9. Unsupervised - clustering and dimensionality reduction  [CORE]
1. PCA in R - and how to read it (scores, loadings, biplot) `(R)`
2. Factor analysis `(R)`
3. k-means and choosing k - silhouette, the gap statistic `(R)`
4. Hierarchical and density clustering - DBSCAN / HDBSCAN `(R)`
5. Gaussian mixture models with mclust `(R)`
6. Cluster validation and stability `(R)`
7. t-SNE and UMAP - and how not to over-read them `(R)`
8. Association rules and market-basket analysis `(R)`

## C10. Experiment and causal basics  [CORE]
1. Correlation, causation and potential outcomes `(R)`
2. Causal diagrams (DAGs) for your assumptions `(R)`
3. A/B testing and experiment design - power and sample size `(R)`
4. Reading an experiment - effect size, CIs, the common pitfalls `(R)`
5. When you cannot randomize - an intro to observational methods `(R)`

## C11. Interpretability and responsible AI (essentials)  [CORE]
1. Global vs local explanations `(R)`
2. Permutation and drop-column importance `(R)`
3. SHAP values - the workhorse `(R)`
4. Partial dependence, ICE and ALE plots `(R)`
5. Fairness basics - metrics and where bias enters `(R)`
6. Model cards and documenting a model `(R)`

## C12. Shipping your first model (production essentials)  [CORE]
1. Reproducible pipelines with targets `(R)`
2. Version and register a model with vetiver and pins `(R~)`
3. Serve a model with plumber - defining and testing the API `(R~)`
4. Batch vs real-time inference - the trade-offs `(static)`
5. Monitoring and drift - the basics (computing the metrics) `(R)`
6. An ML system design checklist `(static)`

> **- Certified Data Scientist -**  (Core complete)

---

# ADVANCED - Become a senior Data Scientist

> Goal: the depth that separates a senior from a competent practitioner. All Pro. Each Core topic that has an "expert cut" lives here.

## A1. Regression and GLMs - the expert cut  [ADV]
1. Robust regression I - M-estimators (Huber, Tukey) with MASS::rlm `(R)`
2. Robust regression II - MM and LTS (robustbase), RANSAC, Theil-Sen `(R)`
3. Quantile regression - median and beyond (quantreg) `(R)`
4. Regularized regression, deep - group / adaptive / relaxed lasso, the elastic-net path `(R)`
5. GAMs done properly - mgcv, REML, smooth selection, concurvity `(R)`
6. Zero-inflated and hurdle models for counts (pscl) `(R)`
7. Gamma, Tweedie and beta regression - positive and proportion targets `(R)`
8. Ordinal and multinomial regression (polr, VGAM) `(R)`
9. Mixed / multilevel models - partial pooling, random slopes (lme4) `(R)`

## A2. Advanced supervised learning  [ADV]
1. Support vector machines and the kernel trick - C, gamma, score calibration `(R)`
2. Regularized discriminant analysis and shrinkage covariance `(R)`
3. Gaussian processes for regression and uncertainty `(R)`
4. Stacking and the Super Learner `(R)`
5. Bayesian optimization for hyperparameters `(R)`
6. Approximate nearest neighbors at scale `(R~)`

## A3. Survival and time-to-event  [ADV]
1. Censoring, the survival and hazard functions; Kaplan-Meier and the log-rank test `(R)`
2. Cox proportional hazards - and checking PH with Schoenfeld residuals `(R)`
3. Parametric and accelerated failure time (AFT) models (flexsurv) `(R)`
4. Competing risks and cumulative incidence (Fine-Gray) `(R)`
5. Survival machine learning - random survival forests `(R)`
6. Evaluating survival models - C-index, time-dependent AUC, calibration `(R)`

## A4. Bayesian and hierarchical modeling  [ADV]
1. The Bayesian update - priors, likelihood, posterior `(R)`
2. MCMC in practice with brms / rstanarm - R-hat, ESS, divergences `(static)`
3. Hierarchical / multilevel models and partial pooling `(R~)`
4. Posterior predictive checks and the Bayesian workflow `(R~)`
5. Model comparison - WAIC and LOO `(R~)`
6. Bayesian regression and GLMs `(R~)`

## A5. Experimentation and online learning  [ADV]
1. Designing for power - MDE, sample size, sequential / always-valid tests `(R)`
2. Variance reduction - CUPED, stratification, regression adjustment `(R)`
3. Pitfalls - peeking, multiple testing (FDR), interference / SUTVA `(R)`
4. Cluster and switchback experiments `(R)`
5. Multi-armed bandits - epsilon-greedy, UCB, Thompson sampling `(R)`
6. Contextual bandits and off-policy evaluation - IPS, doubly-robust `(R)`

## A6. Causal inference for decisions  [ADV]
1. Matching and inverse-probability weighting (MatchIt, WeightIt) `(R)`
2. Difference-in-differences, including modern staggered adoption `(R)`
3. Regression discontinuity (rdrobust) `(R)`
4. Instrumental variables and 2SLS (ivreg) `(R)`
5. Synthetic control (tidysynth) `(R)`
6. Uplift and heterogeneous treatment effects; causal forests (grf) `(R)`
7. Double / debiased machine learning (DoubleML) `(R)`
8. Sensitivity analysis and placebo tests `(R)`
9. Mediation analysis `(R)`

## A7. Robustness, drift and distribution shift  [ADV]
1. Kinds of shift - covariate, label, concept `(R)`
2. Detecting shift - tests, PSI, drift metrics `(R)`
3. Adapting - importance weighting, recalibration, retraining triggers `(R)`
4. Out-of-distribution and novelty detection `(R)`
5. Group robustness / DRO and worst-group accuracy `(R)`
6. Adversarial robustness - the basics `(R~)`

## A8. Anomaly detection and advanced unsupervised  [ADV]
1. Isolation forest and extended isolation forest (isotree) `(R)`
2. Local outlier factor and one-class SVM `(R)`
3. Autoencoders for anomalies `(static)`
4. Time-series anomaly detection `(R)`
5. Kernel PCA, sparse PCA and NMF `(R)`
6. Self-supervised / contrastive representation - an intro `(static)`

## A9. Uncertainty - conformal, calibration and probabilistic prediction  [ADV]
1. Prediction intervals you can trust `(R)`
2. Conformal prediction - distribution-free, for any model `(R)`
3. Quantile and distributional regression for uncertainty `(R)`
4. Calibration, deep - under shift, multiclass `(R)`
5. The bootstrap and the jackknife+ `(R)`

## A10. Explainability, fairness and privacy (deep)  [ADV]
1. SHAP interactions and the H-statistic `(R)`
2. LIME, anchors and counterfactual explanations (recourse) `(R)`
3. Global surrogate and feature-interaction detection `(R)`
4. Fairness - in-/at-/post-processing trade-offs and causal fairness `(R)`
5. Differential privacy and membership-inference attacks `(R~)`
6. Governance - model cards, datasheets, and the EU AI Act `(static)`

---

# SPECIALIZATIONS - Pick your domain / modality

> Non-linear electives. A learner takes the ones their work demands. All Pro.

## S1. Natural language processing  [SPEC]
1. Text preprocessing and tokenization (tidytext) `(R)`
2. Bag-of-words and TF-IDF `(R)`
3. Topic modeling with LDA `(R)`
4. Word and document embeddings `(R~)`
5. Named-entity recognition and sequence labeling `(R~)`
6. Text classification, end to end `(R)`
7. Text similarity and dedup - MinHash / LSH `(R)`
8. Transformers and sentence embeddings `(static)`
9. LLMs for extraction and classification (ellmer) `(static)`

## S2. Deep learning  [SPEC]
1. Neural networks from the ground up `(R~)`
2. How training works - SGD, backprop, loss `(R~)`
3. Optimization - Adam / AdamW, schedules, gradient clipping `(static)`
4. Regularization - dropout, batch norm, early stopping `(static)`
5. Deep learning in R with torch and luz `(static)`
6. Convolutional networks for images `(static)`
7. Sequence models, attention and transformers `(static)`
8. Transfer learning and fine-tuning `(static)`
9. Tabular deep learning - and when it loses to GBMs `(R~)`

## S3. Recommenders, ranking and search  [SPEC]
1. Collaborative filtering and matrix factorization `(R)`
2. Content-based and hybrid recommenders `(R)`
3. Implicit feedback and the cold-start problem `(R)`
4. Learning to rank `(R~)`
5. Two-tower retrieval and embeddings for search `(static)`
6. Sequential / session-based recommendation `(static)`
7. Off-policy evaluation and position bias (IPS) `(R)`
8. Evaluating recommenders - NDCG, MAP, coverage `(R)`

## S4. LLMs and Generative AI (2026 frontier)  [SPEC]
1. Talk to an LLM from R with ellmer `(static)`
2. Structured output and function / tool calling `(static)`
3. Embeddings and vector search with duckdb `(R~)`
4. Retrieval-augmented generation (RAG) `(static)`
5. Advanced RAG - hybrid search, re-ranking, chunking `(static)`
6. Fine-tuning vs RAG vs prompting (LoRA / QLoRA) `(static)`
7. Evaluating LLM systems and LLM-as-judge `(static)`
8. Agents and tool use `(static)`
9. Guardrails, cost and hallucination control `(static)`

## S5. Graph and network ML  [SPEC]
1. Graph data and features (igraph / tidygraph) `(R)`
2. Centrality and influence `(R)`
3. Community detection - Louvain / Leiden `(R)`
4. Node embeddings - node2vec `(R~)`
5. Graph neural networks - an intro `(static)`
6. Link prediction `(R)`

## S6. Geospatial ML  [SPEC]
1. Spatial data and features (sf) `(R~)`
2. Spatial autocorrelation - Moran's I `(R)`
3. Spatial cross-validation and spatial leakage (blockCV / CAST) `(R)`
4. Kriging and Gaussian-process spatial models (gstat) `(R)`
5. Geographically weighted regression `(R)`

## S7. Data-centric AI  [SPEC]
1. Label noise and confident learning `(R)`
2. Active learning `(R)`
3. Weak supervision and programmatic labeling `(R)`
4. Data valuation - data Shapley `(R)`
5. Dataset shift and curriculum design `(R)`

> **Domain packs** (cross-link existing tutorials + a few new lessons, not full sections): Quant/Finance (purged & embargoed CV, fractional differencing, factor models), Health/Clinical (decision curves, propensity scores, TRIPOD), Marketing/Growth (media-mix modeling, attribution, uplift).

---

# WebR runnability summary

| Tier | Lessons | Live-runnable `(R)`+`(R~)` | Illustrative `(static)` |
|---|---|---|---|
| Core (C1-C12) | ~78 | ~92% | ~8% (system design, batch/real-time, LLM/API bits) |
| Advanced (A1-A10) | ~62 | ~88% | ~12% (Stan compile, autoencoders, DP, governance) |
| Specializations (S1-S7) | ~52 | ~55% | ~45% (DL, LLMs, transformers, GNNs are Python/GPU/API territory) |
| **Whole track** | **~190** | **~80%** | **~20%** |

Core and Advanced are overwhelmingly live R - classical ML, stats, causal, survival, and (mostly) Bayesian all run in WebR on teaching-sized data. The `(static)` share concentrates in the Specializations (deep learning, LLMs, transformers, GNNs) where the real tooling is Python/GPU/API; we teach those with real code + precomputed output + a "run this locally" callout, never faked.

# Migration from the current 16-section `ds`

- KEEP (re-tiered): all 16 current sections map into Core/Advanced/Spec above. Nothing is lost.
- THIN MERGES applied: baseline -> C1.1; CRISP-DM+mindset -> C1.1; geometry+gen/disc -> C3.5; PCA+interpretation -> C9.1.
- NEW pillars: C2 (Regression spine), A3 (Survival), A4 (Bayesian/hierarchical), A5 (Experimentation/bandits), A7 (Robustness/shift), A9 (Uncertainty), plus S5/S6/S7 electives.
- MOVED OUT to specializations: NLP, Deep Learning, Recommenders, LLMs (they were Core sections; better as modality electives so the certified Core stays tabular-ML focused and finishable).
- BOUNDARY with the new ML Engineer track: C12 is the *intro* to shipping (enough for a DS); all production depth (serving at scale, Docker/CI, monitoring infra, feature stores, LLMOps) lives in the ML Engineer track, not here.

# Build order (suggested)
1. C2 Regression spine (flagship depth, all WebR) -> 2. the rest of Core in order -> 3. A1/A3/A5/A6 (the highest-demand Advanced, all WebR) -> 4. A4 Bayesian + remaining Advanced -> 5. Specializations as demand dictates (S1 NLP, S4 LLMs first; DL/graph/geo after).
