# Data Scientist Track - Curriculum 2026 (improvement plan)

> Plan only. This studies the **current** DS track (16 sections, ~110 topics in `www/roadmap-curriculum.js` -> `RM2.sections.ds`) and proposes how to make it the richest, deepest R-for-DS curriculum anywhere. No live edits made.

---

## 0. Philosophy: richness is the moat

Students choose a course for the **curriculum**, and they stay for the **depth they can't get from a free blog post**. Two failure modes to avoid:
1. **Breadth without depth** - a topic list that "covers" linear regression in one lesson and never teaches residual diagnostics, influence, heteroskedasticity, or the robust-estimator family. Looks complete; teaches a beginner.
2. **Depth without a spine** - a pile of niche techniques with no path. Avoided by keeping a clear core arc and hanging niche/expert material off it as named "expert edge" lessons.

The bar: **every core topic carries an expert-edge lesson** (the thing a senior DS knows that a bootcamp grad doesn't), and **every section reaches at least one cross-domain niche** (the thing a quant / a bioinformatician / a search engineer knows that a generalist doesn't). The current track is broad and modern; the gaps are almost all **depth-within-core** and **a few missing pillars** (regression done properly, survival, Bayesian/hierarchical, experimentation depth, distribution shift).

---

## 1. Headline moves (highest leverage, ranked)

1. **Split a dedicated "Regression, done properly" section out of §1.** Today linear + logistic are 2 bullets inside the workflow section. That is the single biggest depth gap. Linear regression alone is a whole course: assumptions, **residual analysis**, leverage/influence (Cook's D, DFBETAS, hat values), multicollinearity (VIF, condition number), heteroskedasticity (Breusch-Pagan/White, sandwich SEs), the **robust-estimator family** (Huber/Tukey M-estimators, MM, LTS, **RANSAC**, **Theil-Sen**), and **GLMs beyond logistic** (Poisson/NB/ZIP/hurdle, gamma/Tweedie, beta, ordinal).
2. **Add a Survival / time-to-event section.** Currently absent. It is the backbone of churn, reliability, credit, and clinical work - the canonical cross-domain pillar.
3. **Add a Bayesian & hierarchical/multilevel modeling section.** Absent (only `bsts` is mentioned under time series). Partial pooling / mixed models (`lme4`, `brms`) is both essential for grouped data and an expert differentiator.
4. **Promote experimentation to its own section and deepen it** (power/MDE, sequential/always-valid tests, **CUPED** & variance reduction, multiple testing, interference/SUTVA, **bandits**: epsilon-greedy/UCB/Thompson/contextual). Today A/B is one bullet inside causal.
5. **Add a "Robustness, drift & distribution shift" section** (covariate/label/concept shift, importance weighting, OOD detection, group robustness/DRO, adversarial basics). Drift detection exists in MLOps but the modeling response does not.
6. **Weave an "expert edge" lesson into every model section** (see §6) - this is where RANSAC/Theil-Sen/residual-analysis-style depth lives.
7. **Prune the thin connective bullets** (see §4) - merge "Always start with a baseline", "Interpreting PCA Results", and the two conceptual classification bullets.
8. **Add the missing classical pillars**: **stacking / Super Learner** (only bagging+boosting today), **Gaussian processes**, **isolation forest / LOF anomaly depth**, **mixed models**, **multiple imputation (MICE)**.

---

## 2. Current track at a glance + scorecard

| # | Section | Verdict |
|---|---------|---------|
| 1 | DS workflow & first models | **Reorganize** - overloaded; regression is buried, one thin bullet |
| 2 | Classical supervised learning | Strong; trim 2 conceptual bullets, add depth |
| 3 | Regularization & flexible regression | Good; absorb into the new Regression spine + add depth |
| 4 | Tree-based & gradient boosting | Strong; add stacking + extrapolation/quantile forests |
| 5 | tidymodels workflow | Good; tighten (yardstick overlaps §7) |
| 6 | Feature engineering & selection | Strong; add automated FE, entity embeddings, MICE |
| 7 | Model evaluation, resampling, tuning | Strong; add Hyperband/ASHA, decision/profit curves |
| 8 | Imbalanced, cost-sensitive, calibrated | Strong; one of the best sections |
| 9 | Unsupervised | Good but sprawling; split clustering vs DR; merge PCA bullets |
| 10 | NLP | Good; add NER/seq-labeling, advanced RAG (or defer to §16) |
| 11 | Deep learning | Strong; add optimization depth, embeddings |
| 12 | Recommenders, ranking & search | Good; add two-tower, sequential/session, bandits-for-recs |
| 13 | Causal inference | Strong; **missing RDD, IV, synthetic control, mediation** |
| 14 | Explainability, fairness, responsible AI | Strong; add privacy/security (DP, membership inference) |
| 15 | MLOps | Strong; add training-serving skew, shadow/canary, compression |
| 16 | Frontier 2026 (LLMs) | Strong & current; add advanced-RAG, LoRA, guardrails |

**Missing pillars (no home today):** Regression deep-dive, Survival, Bayesian/Hierarchical, Experimentation (as its own thing), Robustness/Distribution-shift, Gaussian processes, Optimization-for-ML, Graph ML, Geospatial ML, Data-centric AI (label noise / active learning / weak supervision).

---

## 3. Section-by-section audit (what to DEEPEN / what's THIN)

### §1 - DS workflow & first models  -> **reorganize into "Foundations" + hand models to a new Regression section**
- THIN / MERGE: **"Always start with a baseline"** -> fold into "The modeling mindset" (a baseline *is* the mindset: beat the dumb model first) OR into "Train/val/test" (the baseline is the first thing you validate against). As a standalone it teaches ~one idea.
- MERGE: "Framing as ML (CRISP-DM)" + "modeling mindset" can be one lesson ("From business question to a validated model").
- MOVE OUT: "Linear Regression", "Logistic Regression" -> the new **Regression** section (they deserve 5-6 lessons, not 2 bullets).
- KEEP & DEEPEN here: "bias-variance" (add double descent, the modern picture), "data leakage" (add train-serving skew, target leakage taxonomy, temporal leakage).
- ADD: "What could explain this? signal vs noise vs confounding" (sets up causal later), "Reproducibility from day one" (seeds, renv, project structure).

### §2 - Classical supervised learning
- THIN: "Decision boundaries and model geometry" + "Generative vs discriminative" -> merge into ONE conceptual lesson, or fold the geometry into each model.
- DEEPEN: kNN -> distance metrics, weighting, **approximate NN (HNSW/annoy) for scale**; SVM -> kernel choice, C/gamma, **calibrating SVM scores**, nu-SVM; Naive Bayes -> when independence shockingly works, log-space, smoothing.
- ADD (expert edge): "Discriminant analysis deep cut" - RDA (regularized), shrinkage covariance, when LDA beats logistic.

### §3 - Regularization & flexible regression  -> **absorb into the Regression spine**
- KEEP: Ridge/Lasso/Elastic Net, lambda via CV, splines/GAMs, quantile, robust.
- DEEPEN: **robust regression is one bullet today** - expand to the full family (M/MM/LTS/**RANSAC**/**Theil-Sen**); add **group lasso / adaptive lasso / relaxed lasso**, the **elastic-net path & one-SE rule**, **principled standardization**, **post-selection inference (selective inference)** as an expert-edge note.
- ADD: **GAM depth** (smooth term selection, `mgcv` REML, concurvity - the GAM analogue of multicollinearity).

### §4 - Tree-based & gradient boosting
- KEEP all (excellent, incl. monotonic constraints).
- ADD: **stacking / model blending** (today there is bagging + boosting but **no stacking**; use `stacks`), **quantile regression forests** & prediction intervals from trees, **tree extrapolation failure** (why trees can't trend), **SHAP-for-trees** cross-link, **categorical handling** (CatBoost ordered target stats vs one-hot vs native LightGBM).

### §5 - tidymodels workflow
- KEEP; TIGHTEN: "Measure with yardstick" overlaps §7 - keep it light here, deep in §7.
- ADD: **`agua`/h2o AutoML** and **`finetune` racing** cross-link; **`bonsai`** (LightGBM/CatBoost via tidymodels) so §4 and §5 connect.

### §6 - Feature engineering & selection
- KEEP (target encoding out-of-fold + leakage focus is excellent).
- ADD: **multiple imputation (MICE)** vs single imputation and when each is honest; **entity embeddings** for high-cardinality categoricals; **automated FE** (featuretools-style deep feature synthesis) with a leakage warning; **the hashing trick**; **count/frequency encoding** nuances; **drift-aware features**.

### §7 - Model evaluation, resampling & tuning
- KEEP (nested CV + one-SE rule + proper scoring is senior-level - great).
- ADD: **Hyperband / ASHA / successive halving** and **multi-fidelity HPO** (today only grid/random/Bayes/racing); **decision curves / profit curves / expected-value framing** (tie metrics to money); **bootstrap & permutation CIs for metrics**; **grouped & blocked CV** (preventing group leakage), **time-aware CV** cross-link.

### §8 - Imbalanced, cost-sensitive & calibrated classification
- KEEP - one of the strongest sections. Minor ADD: **focal loss**, **cost-curves**, **calibration under shift**, **multilabel** (vs multiclass).

### §9 - Unsupervised learning  -> **split into "Clustering" and "Dimensionality reduction & representation"**
- THIN / MERGE: "PCA in R" + "Interpreting PCA Results" -> one lesson.
- DEEPEN clustering: **choosing k (silhouette, gap statistic, elbow done right)**, **cluster validation & stability (consensus clustering, bootstrap)**, **HDBSCAN** (not just DBSCAN), **spectral clustering**, **clustering mixed-type data (Gower + PAM)**.
- DEEPEN DR: **kernel PCA, sparse PCA, NMF**, **UMAP pitfalls (don't trust distances/cluster sizes)**, **autoencoders for representation**.
- ADD: **self-supervised / contrastive representation** (expert edge).

### §10 - NLP
- KEEP. ADD: **NER & sequence labeling**, **text similarity/dedup (MinHash/LSH)**, **weak supervision for labels (Snorkel-style)**; defer advanced-RAG to §16 to avoid overlap.

### §11 - Deep learning
- KEEP. ADD: **optimization depth** (SGD vs Adam/AdamW, schedules, warmup, gradient clipping - currently only "SGD/backprop"), **embeddings as a first-class idea**, **handling tabular: when DL loses to GBMs** (honesty), **mixed precision / training on a budget**.

### §12 - Recommenders, ranking & search
- KEEP. ADD: **two-tower / dual-encoder retrieval**, **sequential / session-based recs (next-item)**, **bandits for exploration in recs**, **position/selection bias & counterfactual evaluation (IPS)** - the niche search-engineer topics.

### §13 - Causal inference  -> **deepen; spin experimentation into its own section (see §5 new)**
- MISSING and important: **Regression discontinuity (RDD, `rdrobust`)**, **Instrumental variables (`ivreg`/2SLS)**, **Synthetic control (`tidysynth`)**, **mediation analysis**, **front-door / g-methods**, **causal discovery**.
- KEEP: DAGs, potential outcomes, matching/IPW/DiD, uplift, DML, sensitivity.
- DEEPEN: **difference-in-differences modern advances** (staggered adoption, Callaway-Sant'Anna - a 2020s expert topic), **causal forests (`grf`) depth**, **CATE estimation & policy learning**.

### §14 - Explainability, fairness & responsible AI
- KEEP. ADD: **privacy & security** - differential privacy, membership-inference attacks, model extraction/stealing, federated basics; **the H-statistic for interaction detection**; **anchors**; **fairness in/at/post-processing trade-offs + causal fairness**; **recourse** (actionable counterfactuals).

### §15 - MLOps
- KEEP (excellent). ADD: **training-serving skew & feature/serving consistency** (the #1 silent prod bug), **shadow + canary deployment, online A/B for models**, **model compression (pruning/quantization/distillation)**, **latency/throughput/cost optimization**, **CI/CD for ML & data contracts**, **incident response & rollback**.

### §16 - Frontier 2026 (LLMs)
- KEEP & current. ADD: **advanced RAG** (hybrid search, re-ranking, chunking strategies, eval with ragas-style metrics), **LoRA/QLoRA fine-tuning**, **guardrails & hallucination mitigation**, **LLM-as-judge & its failure modes**, **semantic caching / cost control**, **structured generation (grammars)**.

---

## 4. Thin topics to merge or cut (explicit)

| Topic (loc) | Action | Why |
|---|---|---|
| "Always start with a baseline" (§1.3) | **Merge** into "modeling mindset" or "train/val/test" | One idea; stronger as the punchline of the mindset lesson (the user's call - agreed) |
| "Framing as ML (CRISP-DM)" + "modeling mindset" (§1.1-1.2) | **Merge** | Same lesson: business question -> validated model |
| "Decision boundaries & geometry" + "Generative vs discriminative" (§2.5-2.6) | **Merge** into one concept lesson | Both conceptual; one well-told geometry lesson beats two stubs |
| "PCA in R" + "Interpreting PCA Results" (§9.1-9.2) | **Merge** | Interpretation belongs in the same lesson as the method |
| "Measure with yardstick" (§5.5) | **Slim** (deep version lives in §7) | Avoid duplicating evaluation across two sections |

Net: ~5 bullets reclaimed, redeployed into depth. **Rule going forward: a topic earns a standalone lesson only if it has its own technique, its own pitfalls, and its own try-it.** Pure "concept glue" rides inside the nearest technique lesson.

---

## 5. New sections to add (with lesson lists)

### NEW A - "Regression, done properly" (the spine; pulls from §1 + §3)
1. OLS from scratch: the geometry, the normal equations, what the coefficients mean
2. **Assumptions & residual analysis** - residuals-vs-fitted, Q-Q, scale-location, residuals-vs-leverage; what each plot catches
3. **Influence & leverage** - hat values, Cook's distance, DFBETAS/DFFITS, the influence dashboard
4. **Multicollinearity** - VIF, condition number, what to do (and what not to)
5. **Heteroskedasticity & autocorrelation** - Breusch-Pagan/White, **sandwich/robust SEs (HC0-HC3)**, Newey-West, WLS/GLS
6. **Inference & prediction** - CIs vs prediction intervals, the bootstrap for regression, specification tests (RESET)
7. **Robust regression family** - Huber/Tukey **M-estimators (`MASS::rlm`)**, **MM/LTS (`robustbase`)**, **RANSAC**, **Theil-Sen (`mblm`)**, quantile/median regression - when and why
8. **GLMs beyond logistic** - Poisson/Negative-Binomial/quasi, **zero-inflated & hurdle (`pscl`)**, gamma/**Tweedie** (insurance), **beta regression**, **ordinal/multinomial** (`polr`/`VGAM`)

### NEW B - "Survival & time-to-event"
1. Censoring & the survival/hazard functions; Kaplan-Meier & the log-rank test
2. **Cox proportional hazards** + checking PH (Schoenfeld residuals), stratification, time-varying covariates
3. Parametric & **accelerated failure time (AFT)** models (`flexsurv`)
4. **Competing risks** (Fine-Gray) & cumulative incidence
5. **Survival machine learning** - random survival forests (`randomForestSRC`), survival XGBoost, discrete-time survival as classification
6. Evaluating survival models - **C-index**, time-dependent AUC, calibration; **survival in churn/credit/reliability** (cross-domain)

### NEW C - "Bayesian & hierarchical modeling"
1. The Bayesian update; priors, likelihood, posterior; conjugate intuition
2. **MCMC in practice** with Stan via `brms`/`rstanarm`; diagnostics (R-hat, ESS, divergences)
3. **Hierarchical / multilevel models** - partial pooling, random intercepts/slopes, ICC (`lme4`/`brms`) - the grouped-data superpower
4. **Posterior predictive checks** & Bayesian workflow
5. Model comparison - **WAIC/LOO** (`loo`), Bayes factors, when Bayesian beats frequentist
6. Expert edge: **variational inference**, **Bayesian regression/GLMs**, **Gaussian processes** (`GauPro`/`kernlab`) as Bayesian nonparametrics + their link to Bayesian optimization

### NEW D - "Experimentation & online learning" (promote A/B out of causal)
1. **Designing an experiment** - hypotheses, randomization unit, **power & MDE, sample size**
2. **Analyzing experiments** - t/z, CUPED & **variance reduction** (regression adjustment, stratification), CIs, **multiple testing (FDR)**
3. **Pitfalls** - peeking & **sequential/always-valid tests (mSPRT)**, **interference/SUTVA**, novelty/primacy, Simpson's paradox, **cluster & switchback randomization**
4. **Quasi-experiments** when you can't randomize (bridges to causal §)
5. **Multi-armed bandits** - epsilon-greedy, UCB, **Thompson sampling**; explore-exploit
6. **Contextual bandits & off-policy evaluation** (IPS/doubly-robust) - the expert edge

### NEW E - "Robustness, drift & distribution shift"
1. Kinds of shift - covariate, label/prior, concept; how to tell which
2. **Detecting shift** - statistical tests, drift metrics, PSI; tie to MLOps monitoring
3. **Adapting** - importance weighting, reweighting, recalibration, retraining triggers
4. **OOD & novelty detection**; **conformal prediction under shift**
5. **Group robustness / DRO**, sub-population performance, worst-group accuracy
6. Expert edge: **adversarial robustness basics**, test-time adaptation, **why your offline metric lied**

### Optional NEW (specialization mini-sections, or fold as expert-edge lessons)
- **Anomaly detection** (deserves more than one bullet): isolation forest (`isotree`), LOF, one-class SVM, autoencoders, **time-series anomalies**, evaluation without labels.
- **Graph & network ML**: centrality, **community detection (Louvain/Leiden)**, **node embeddings (node2vec)**, GNN intuition, link prediction (`igraph`/`tidygraph`).
- **Geospatial ML**: spatial autocorrelation (**Moran's I**), **spatial cross-validation / spatial leakage (`blockCV`/CAST)** - a genuinely niche expert trap, kriging/GWR.
- **Data-centric AI**: label noise & **confident learning**, **active learning**, **weak supervision**, **data valuation (data Shapley)**, dataset/curriculum design.
- **Optimization for ML**: convex vs non-convex, GD variants, constrained/second-order, the optimization view of regularization.

---

## 6. The "expert edge" thread (depth-within-core, by topic)

The differentiator the user named. Each becomes the **last lesson of its section** ("X: the expert cut"):

- **Linear regression** -> residual analysis, influence (Cook's D), heteroskedasticity-robust SEs, RANSAC/Theil-Sen, GLM family.
- **Logistic regression** -> **separation & Firth's penalized likelihood**, calibration, Hosmer-Lemeshow, **marginal effects** vs odds ratios, deviance residuals.
- **Random forest** -> OOB vs CV, **impurity-importance bias** vs permutation, proximity, **quantile regression forests**, extrapolation failure.
- **Gradient boosting** -> loss design, regularization knobs that matter, ordered target statistics, SHAP-for-trees, leakage via target encoding.
- **kNN/SVM** -> approximate NN at scale; SVM score calibration; kernel selection.
- **PCA/clustering** -> scaling traps, gap statistic, cluster stability, UMAP "don't trust the distances".
- **Cross-validation** -> grouped/blocked/time CV, nested CV, the leakage that fakes great CV.
- **Metrics** -> proper scoring rules, calibration, decision/profit curves, the one-SE rule.
- **Causal** -> DiD staggered adoption (Callaway-Sant'Anna), sensitivity analysis, placebo tests.

---

## 7. Cross-domain niche appendix (different domains, different niches)

The "DSs from different domains know different things" angle - source these as advanced/specialization lessons or cross-links:

- **Finance/quant:** GARCH family & VaR (in TS), **fractional differencing**, regime-switching (HMM), backtesting & purged/embargoed CV (Lopez de Prado), copulas, factor models.
- **Healthcare/clinical:** survival & competing risks, **propensity scores**, **calibration & net benefit / decision curves**, multiple imputation (MICE), TRIPOD reporting.
- **Insurance/actuarial:** **Tweedie & GLMs**, frequency-severity, credibility/mixed models.
- **Bio/genomics:** high-dim p>>n, **FDR & multiple testing at scale**, **sparse/group lasso**, batch effects, **stability selection**.
- **Marketing/growth:** uplift/CATE, **media mix modeling (adstock/saturation)**, attribution, survival for churn, bandits.
- **Search/recsys:** learning-to-rank, two-tower retrieval, **counterfactual/off-policy evaluation**, position bias.
- **Ops/IoT/manufacturing:** anomaly detection, changepoints, **remaining-useful-life (survival)**, control charts.
- **Geospatial:** spatial CV, kriging, Moran's I, GWR.
- **NLP/LLM-era:** weak supervision, **RAG evaluation**, LoRA, structured extraction, embeddings & vector search.

---

## 8. Proposed target structure (revised)

A coherent ~20-section arc (current good sections kept; new pillars inserted; thin glue merged). Order = dependency-aware.

1. **Foundations**: business->ML framing+mindset+baseline (merged), train/val/test, bias-variance (+double descent), **leakage taxonomy** (incl. train-serving), reproducibility.
2. **Regression, done properly** (NEW A) - the spine.
3. **Classical supervised learning** (trimmed + deepened).
4. **Regularization & flexible regression** (folded toward the spine; group/adaptive lasso, GAM depth).
5. **Tree-based & gradient boosting** (+ stacking, quantile forests).
6. **tidymodels workflow** (tightened; AutoML + racing).
7. **Feature engineering & selection** (+ MICE, entity embeddings, automated FE).
8. **Model evaluation, resampling & tuning** (+ Hyperband/ASHA, decision/profit curves).
9. **Imbalanced, cost-sensitive & calibrated classification**.
10. **Clustering** (split) and 11. **Dimensionality reduction & representation** (split; PCA merged).
12. **Anomaly detection** (promoted).
13. **Survival & time-to-event** (NEW B).
14. **Bayesian & hierarchical modeling** (NEW C) (+ Gaussian processes).
15. **Experimentation & online learning / bandits** (NEW D).
16. **Causal inference** (+ RDD, IV, synthetic control, mediation, modern DiD).
17. **Robustness, drift & distribution shift** (NEW E).
18. **NLP**; 19. **Deep learning**; 20. **Recommenders, ranking & search**.
21. **Explainability, fairness, privacy & responsible AI** (+ DP/security).
22. **MLOps** (+ train-serving skew, shadow/canary, compression).
23. **Frontier 2026: LLMs & modern ML** (+ advanced RAG, LoRA, guardrails).
24. *(Specialization electives)*: Graph ML, Geospatial ML, Data-centric AI - as optional advanced courses.

(If 24 feels long for one "track", keep the **core 1-17 + 21-23** as the certified path and label 18-20 + electives as **advanced/specialization** modules - depth without forcing linear length.)

---

## 9. Practicality notes (for the lesson factory)

- **WebR-runnable** (most of the new material): regression/robust/GLM (`MASS`, `robustbase`, `mblm`, `pscl`, `betareg`), survival (`survival`, `flexsurv`), mixed models (`lme4`), causal (`MatchIt`, `ivreg`, `rdrobust`), experimentation, anomaly (`isotree`, `dbscan`), unsupervised. Teach these live.
- **Likely `r-static` / illustrative** (heavy or non-WASM): `brms`/Stan (compiles), `torch`/`luz`, `xgboost`/`lightgbm` at size, `h2o`, GNNs, large RAG. Teach with precomputed outputs + a real local-run callout.
- Each section -> one **course** (landing + lessons), same machinery as the DA track. The "expert cut" lesson per section is the marketing hook ("we teach the part others skip").
- Slug-collision check every new lesson vs existing root tutorials before authoring (a real trap - see the DA batch).

---

## 10. Decisions for Selva

1. **Track length:** one long certified track (1-23) vs **core (1-17,21-23) + advanced/specialization electives (18-20, graph/geo/data-centric)?** (I lean core+electives - keeps the certified path coherent while the catalog stays deep.)
2. **Regression split:** approve carving "Regression, done properly" out of §1/§3? (Strongly recommend - it's the flagship depth.)
3. **New pillars to greenlight first:** Survival, Bayesian/Hierarchical, Experimentation, Robustness - which order?
4. **Thin merges:** approve the 5 merges in §4 (baseline, CRISP-DM+mindset, geometry+gen/disc, PCA, yardstick-slim)?
5. **Electives scope:** include Graph ML / Geospatial / Data-centric now, or backlog?

Once you mark these, the next step is to fold the approved structure into `RM2.sections.ds` (roadmap) + author the new courses through the lesson factory.
