---
name: Gap Analysis for Learning Paths (v1 → v2)
description: Documents what changed between v1 and v2 of both learning path plans and why
type: learning-path-plan
---

# Gap Analysis: v1 → v2 Upgrade (Practitioner → PhD-Level)

This document records the gaps identified in the v1 plans and how they were addressed in v2.

---

## What Changed: Summary

| Metric | v1 | v2 | Delta |
|--------|----|----|-------|
| Applied Statistics posts | 86 | 187 | +101 |
| Applied Statistics sub-paths | 8 | 17 | +9 |
| Time Series posts | 65 | 116 | +51 |
| Time Series sub-paths | 7 | 14 | +7 |
| **Combined posts** | **151** | **303** | **+152** |
| **Combined sub-paths** | **15** | **31** | **+16** |

---

## Applied Statistics: 9 New Sub-Paths Added

### 1. Causal Inference (13 posts) — NEW
**Gap:** THE hottest topic in modern statistics. Harvard, Stanford, Columbia all have dedicated PhD courses. DAGs, instrumental variables, DiD, RDD, synthetic controls, double ML, causal forests. Zero coverage in v1.
**Source:** r-causal.org, Mixtape (scunning.com), Harvard BST 258 syllabus, Duke/Harvard causal inference courses.

### 2. Meta-Analysis (10 posts) — NEW
**Gap:** CRAN has an entire Task View for it. metafor is the most powerful meta-analysis tool in any language. Cochrane and Campbell reviews use R. Critical for researchers. Absent from v1.
**Source:** CRAN MetaAnalysis Task View, Cochrane Handbook Ch 10, metafor documentation.

### 3. Multivariate Analysis (12 posts) — NEW
**Gap:** PCA, factor analysis, discriminant analysis, MANOVA, MDS, canonical correlation, clustering. A core PhD statistics course. Only partially touched via psychometrics in v1.
**Source:** Stanford Stats 325, Applied Multivariate Statistics in R (UW Pressbooks), FactoMineR documentation.

### 4. Psychometrics & SEM (10 posts) — EXPANDED from Gap Analysis v1
**Gap:** Psychology, education, health researchers who build scales. lavaan is the world standard for SEM. Added measurement invariance and Bayesian SEM depth.
**Source:** lavaan tutorial, psych package vignettes, mirt documentation.

### 5. Bayesian in Practice (10 posts) — EXPANDED from Gap Analysis v1
**Gap:** Practical Bayesian analysis (brms, BayesFactor, Stan) vs the existing theoretical Bayesian path. Added Stan for custom models.
**Source:** brms vignettes, BayesFactor documentation, Stan documentation.

### 6. Computational Statistics (11 posts) — NEW
**Gap:** Monte Carlo simulation, bootstrap theory, EM algorithm, permutation tests, simulation studies, MCMC from scratch. Every PhD program requires this. Absent from v1.
**Source:** Duke STA 663 syllabus, Stirling Coding Club resampling tutorial, Am. Stat. bootstrap curriculum paper.

### 7. High-Dimensional Statistics (9 posts) — NEW
**Gap:** When p > n: penalized regression theory (Lasso, Ridge, Elastic Net), FDR, sparse PCA, debiased lasso, knockoff filter. The modern statistics frontier. Absent from v1 except for one FR post on glmnet.
**Source:** glmnet vignettes, knockoff package, Wharton PhD curriculum.

### 8. Spatial Statistics (9 posts) — NEW
**Gap:** R is THE language for spatial statistics (sf, spdep, gstat, spatstat). Geostatistics, kriging, spatial regression, point processes. Completely absent from v1.
**Source:** r-spatial.org/book, CRAN Spatial Task View, gstat documentation, spatstat documentation.

### 9. When Assumptions Fail (10 posts) — EXPANDED from Gap Analysis v1
**Gap:** Practical troubleshooting: normality failure, heteroscedasticity, outliers, missing data, multicollinearity. Added mice deep dive and missingness visualization.

### Other v1 → v2 changes:
- **Regression:** Added GAMs, diagnostic plots visual guide, LOESS/splines, performance package (+5 posts)
- **Comparing Groups:** Added reporting companion post (+1)
- **Correlation:** Added reporting companion post (+1)
- **Survival:** Added reporting companion post (+1)
- **Choosing the Right Test:** Added equivalence testing and non-inferiority (+2)

---

## Time Series: 7 New Sub-Paths Added

### 1. Spectral Analysis (8 posts) — NEW
**Gap:** The frequency domain is literally half of time series theory. Periodogram, spectral density, cross-spectrum, coherence, filtering. Covered in Shumway & Stoffer (3 chapters), Penn State STAT 510. Absent from FPP3 and every free tutorial with R code.
**Source:** Shumway & Stoffer ASTSA, Penn State STAT 510, spectrum() documentation, WaveletComp package.

### 2. State Space & Kalman Filter (8 posts) — EXPANDED from 1 post
**Gap:** v1 had one C post on "state space models." PhD-level requires: Kalman filter mechanics, DLMs, particle filters, unobserved components. dlm, KFAS, bsts packages.
**Source:** Commandeur & Koopman (State Space Time Series Analysis), dlm and KFAS documentation.

### 3. Nonlinear Time Series (7 posts) — NEW
**Gap:** SETAR, STAR, LSTAR, Markov switching models. The tsDyn package implements all of these. Critical for finance and macroeconomics. Absent from v1.
**Source:** tsDyn documentation, MSwM package, Zivot UW lecture notes, Springer handbook on regime switching.

### 4. Financial Time Series & Volatility (9 posts) — EXPANDED from 1 FR post
**Gap:** v1 had GARCH as one FR post. PhD-level requires: univariate GARCH variants (EGARCH, GJR), multivariate GARCH (DCC, CCC), VaR/ES, ARFIMA (long memory), high-frequency data, copulas.
**Source:** Tsay (Financial Time Series), rugarch/rmgarch documentation, highfrequency package, CRAN Finance Task View.

### 5. Spatio-Temporal (6 posts) — EXPANDED from 2 FR posts
**Gap:** Forecasting with a geographic dimension. Upgraded from FR posts to a full sub-path with C posts on spatio-temporal data structures, kriging over time, and spatial autocorrelation trajectories.
**Source:** stars package, spacetime package, gstat spatio-temporal vignettes, sfdep documentation.

### 6. TS Mining (7 posts) — from Gap Analysis v1
**Gap:** Classification, clustering, anomaly detection, changepoint detection, motif discovery. Added interrupted time series analysis.

### 7. Forecasting in Production (4 posts) — from Gap Analysis v1
**Gap:** APIs, automation, monitoring, drift detection. The "last mile."

### Other v1 → v2 changes:
- **Foundations:** Added data cleaning and resampling/aggregation (+2 C), timezone handling FR (+1)
- **Classical Models:** Added intermittent demand as C post (+1), zero-inflated count TS FR (+1)
- **Evaluation:** Added forecast combination as C post (+1), conformal prediction FR (+1)
- **Multivariate:** Reorganized — split financial topics into dedicated sub-path, kept VAR/hierarchical/Granger

---

## Research Sources

The v2 plans were informed by:

**PhD Curricula:**
- Stanford Statistics PhD coursework (Stats 325 Multivariate, Stats 361 Causal Inference)
- Harvard Biostatistics PhD (BST 258 Causal Inference, missing data, survival)
- Columbia PhD Statistics courses (applied statistics sequence)
- Wharton PhD curriculum (probability, mathematical statistics, linear models, computing)
- Rice University PhD requirements

**CRAN Task Views:**
- TimeSeries (spectral, state space, nonlinear, financial)
- ClinicalTrials (survival, design)
- MetaAnalysis (metafor, bayesmeta, network meta-analysis)
- ExperimentalDesign (factorial, clinical trials)
- Spatial (sf, spdep, gstat, spatstat)
- CausalInference (dagitty, MatchIt, rdrobust, ivreg)
- FunctionalData (fda, fdapace)

**Textbooks (where free tutorials fall short):**
- Shumway & Stoffer: Time Series Analysis and Its Applications (spectral, state space)
- Tsay: Analysis of Financial Time Series (GARCH, multivariate GARCH, VaR)
- Hyndman & Athanasopoulos: Forecasting Principles and Practice (fable ecosystem)
- Cunningham: Causal Inference: The Mixtape (DiD, RDD, IV, synthetic controls)
- Borenstein et al.: Introduction to Meta-Analysis (metafor workflow)

**Competing Free Resources (gaps confirmed):**
- STHDA.com: Stops at ANOVA/regression, no causal inference, no meta-analysis
- r-causal.org: Causal inference only, no broader statistics
- r-spatial.org: Spatial only, no interactive code blocks
- FPP3: No spectral analysis, no nonlinear models, no ML integration
