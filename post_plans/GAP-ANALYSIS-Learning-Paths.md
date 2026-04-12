---
name: Gap Analysis for Applied Statistics and Time Series Learning Paths
description: Thorough gap analysis identifying missing topics, weak spots, and enhancements for both learning paths
type: learning-path-plan
---

# Gap Analysis: Applied Statistics & Time Series Forecasting

After researching CRAN task views, university syllabi (Penn State STAT 500-510, Harvard, Duke/Coursera), competing free sites (STHDA, FPP3, Modern Statistics with R), paid platforms (DataCamp, Business Science), StackOverflow/CrossValidated common questions, and domain-specific needs (clinical, psychometrics, epidemiology, finance), here are the gaps in the v1 plans.

---

## PART A: Applied Statistics — Gaps Found

### Gap 1: No "When Things Go Wrong" Troubleshooting Section

**What's missing:** Practitioners don't just need to know *which test* — they need to know *what to do when the test breaks*. Assumptions fail. Data is messy. Results are ambiguous. No competitor covers this systematically.

**Add Sub-Path: "When Assumptions Fail — Practical Remedies"**

| # | Type | Title | Why it's needed |
|---|------|-------|-----------------|
| 1 | C | What to Do When Normality Fails: Transformations, Non-Parametric Alternatives, and Robust Methods | #1 StackOverflow question in R stats |
| 2 | C | What to Do When Homoscedasticity Fails: Welch's Correction, Sandwich Estimators, and WLS | Heteroscedasticity is the most common regression violation |
| 3 | C | Handling Outliers in R: Detection, Diagnosis, and 5 Strategies Beyond "Just Delete Them" | r-statistics.co already has a legacy outlier page — this replaces it |
| 4 | C | Missing Data in R: MCAR/MAR/MNAR, Multiple Imputation with mice, and When to Drop vs Impute | Every real dataset has missing values |
| 5 | C | Multicollinearity in R: VIF, Condition Index, and What to Actually Do About It | Regression users hit this constantly |
| 6 | FR | Influential Points vs Outliers: Cook's Distance, DFFITS, and Leverage in R | |
| 7 | FR | Data Transformations in R: Log, Square Root, Box-Cox — When and Why Each Works | |

**Impact:** This is the section that makes practitioners say "finally, someone tells me what to do when my analysis doesn't go smoothly." No other free site has this as a cohesive section.

---

### Gap 2: No Bayesian Applied Statistics Section

**What's missing:** The existing curriculum has a 34-post Bayesian Statistics sub-path under the theoretical Statistics path — but it's heavy on theory (conjugate priors, MCMC theory). Applied Statistics needs a *practical* Bayesian section: "I want to run a Bayesian t-test / regression / mixed model. How?"

**Add Sub-Path: "Bayesian Analysis in Practice"**

| # | Type | Title | Why it's needed |
|---|------|-------|-----------------|
| 1 | C | Bayesian Statistics for Practitioners: Priors, Posteriors, and Why You'd Choose Bayes Over Frequentist | The "why" — not MCMC theory, but practical advantages |
| 2 | C | Bayesian t-Tests and ANOVA in R: BayesFactor Package Step-by-Step | Direct parallel to the frequentist versions earlier in the path |
| 3 | C | Bayesian Regression in R with brms: From Prior Choice to Posterior Interpretation | brms is the gold standard — no good free tutorial exists |
| 4 | C | Bayesian Mixed Models in R with brms: The Natural Extension of lme4 | Moved from Mixed Models sub-path — fits better here as a progression |
| 5 | C | MCMC Diagnostics in R: Trace Plots, R-hat, ESS — Is My Model Actually Converged? | Every brms user needs this |
| 6 | C | Bayes Factors vs Credible Intervals: Two Frameworks for Bayesian Inference in R | Resolves the "which Bayesian approach?" confusion |
| 7 | FR | Bayesian Power Analysis in R: simr and bfdesign for Study Planning | |
| 8 | FR | Prior Sensitivity Analysis: How Much Do Your Priors Change the Conclusions? | |
| 9 | EX | Bayesian Analysis Exercises: 8 Problems — From BayesFactor to brms | |

---

### Gap 3: No Equivalence Testing / Non-Inferiority Section

**What's missing:** Classical hypothesis testing asks "is there a difference?" But researchers increasingly need to ask "are these *equivalent*?" or "is the new treatment *not worse* than the old one?" The TOSTER package and equivalence testing are heavily searched and virtually uncovered in free tutorials.

**Add to Sub-Path 1 (Choosing the Right Test):**

| # | Type | Title |
|---|------|-------|
| + | C | Equivalence Testing in R: TOST Procedure and When "No Significant Difference" Isn't Enough |
| + | FR | Non-Inferiority Testing in R: Prove the New Treatment Is At Least As Good |

---

### Gap 4: No Psychometrics / Scale Validation Section

**What's missing:** Psychology, education, and health researchers who build questionnaires and scales represent a massive R user base. Factor analysis, reliability (Cronbach's alpha, omega), IRT, and SEM with lavaan are heavily searched.

**Add Sub-Path: "Measurement and Psychometrics"**

| # | Type | Title | Why it's needed |
|---|------|-------|-----------------|
| 1 | C | Exploratory Factor Analysis in R: psych Package from Extraction to Rotation | Scale development step 1 |
| 2 | C | Confirmatory Factor Analysis in R: lavaan CFA from Model Specification to Fit Indices | Scale validation |
| 3 | C | Reliability Analysis in R: Cronbach's Alpha, McDonald's Omega, and When Alpha Misleads | Most-searched psychometrics topic |
| 4 | C | Structural Equation Modeling in R: lavaan SEM from Path Diagrams to Model Comparison | The flagship method of social science |
| 5 | C | Item Response Theory in R: mirt Package for Modern Test Analysis | Advanced but heavily used in education/clinical |
| 6 | FR | Multi-Group CFA and Measurement Invariance in R: Test Fairness Across Groups | |
| 7 | FR | Mediation and Moderation Analysis in R: lavaan and mediation Packages | |
| 8 | EX | Psychometrics Exercises: 8 Problems — From EFA to SEM | |

**Impact:** STHDA doesn't cover this. DataCamp has a shallow course. This becomes the go-to resource for social science researchers learning R.

---

### Gap 5: No Diagnostic Plots Interpretation Guide

**What's missing:** "What does this plot mean?" is one of the most common R questions. `plot(lm_model)` produces 4 diagnostic plots that most users can't interpret. A visual guide with annotated examples is a huge SEO opportunity.

**Add to Sub-Path 4 (Regression in Practice):**

| # | Type | Title |
|---|------|-------|
| + | C | Reading R's 4 Diagnostic Plots: Residuals vs Fitted, Q-Q, Scale-Location, and Leverage — An Annotated Visual Guide |
| + | FR | performance Package in R: One-Line Model Diagnostics with check_model() |

---

### Gap 6: No Nonparametric Regression

**What's missing:** The original plan covers nonparametric *tests* (Wilcoxon, Kruskal-Wallis) but not nonparametric *regression* — loess, GAMs, and splines. These are workhorse methods for any analyst whose data isn't linear.

**Add to Sub-Path 4 (Regression in Practice):**

| # | Type | Title |
|---|------|-------|
| + | C | Generalized Additive Models (GAMs) in R: mgcv for Non-Linear Relationships Without Specifying the Shape |
| + | FR | LOESS and Spline Regression in R: Smooth Curves When Linear Doesn't Fit |

---

### Gap 7: Missing Data Gets Its Own Depth

**What's missing:** Missing data is listed as one post in "When Assumptions Fail" but deserves deeper treatment — it's a top-5 practical challenge.

**Expand within "When Assumptions Fail":**

| # | Type | Title |
|---|------|-------|
| + | FR | mice Package Deep Dive: Chained Equations, Passive Imputation, and Pooling Results |
| + | FR | Visualizing Missingness Patterns in R: naniar and VIM Packages |

---

### Gap 8: No "How to Report" Companion Posts

**What's missing:** Every test section should have a companion "how to write up the results" reference. Currently only the Reporting sub-path covers this, but it should be cross-linked per method.

**Add FR posts across sub-paths:**

| Sub-Path | FR Post |
|----------|---------|
| Comparing Groups | How to Report t-Test and ANOVA Results: APA/NEJM Templates with R Code |
| Correlation | How to Report Correlation Results: Tables, Matrices, and Write-Up Templates |
| Regression | (already in plan) |
| Mixed Models | (already in plan) |
| Survival | How to Report Survival Analysis: Kaplan-Meier Tables and Cox Model Write-Ups |

---

## PART B: Time Series Forecasting — Gaps Found

### Gap 1: No "Time Series Data Preparation" Section

**What's missing:** Real-world time series data is messy — irregular timestamps, missing observations, duplicate entries, timezone issues. Every practitioner spends 50%+ of their time on data prep, but no tutorial covers this.

**Add to Sub-Path 1 (Foundations) or create new sub-path:**

| # | Type | Title | Why it's needed |
|---|------|-------|-----------------|
| + | C | Time Series Data Cleaning in R: Handle Missing Timestamps, Irregular Intervals, and Duplicates | #1 real-world pain point |
| + | C | Resampling and Aggregating Time Series in R: Convert Daily to Weekly/Monthly and Vice Versa | Every analysis starts here |
| + | FR | Timezone Handling in R: lubridate, clock, and the Pitfalls of DST | Silently breaks analyses |

---

### Gap 2: No Intermittent / Count Time Series Section

**What's missing:** Retail, spare parts, and healthcare data has lots of zeros. Standard methods (ARIMA, ETS) fail. Croston's method is mentioned as one FR post, but this needs more depth — it's a huge practical domain.

**Expand Sub-Path 2 (Classical) or create dedicated section:**

| # | Type | Title |
|---|------|-------|
| + | C | Intermittent Demand Forecasting in R: Croston, TSB, and INARMA for Sparse Series |
| + | FR | Zero-Inflated Time Series in R: Count Models with tscount and tsglm |

---

### Gap 3: No Time Series Classification / Clustering Section

**What's missing:** Not all time series problems are forecasting. Classification ("is this pattern normal or anomalous?") and clustering ("which series behave similarly?") are critical in IoT, manufacturing, and finance. R has excellent tools (dtw, dtwclust, TSclust).

**Add Sub-Path: "Time Series Mining — Classification, Clustering, and Anomaly Detection"**

| # | Type | Title | Why it's needed |
|---|------|-------|-----------------|
| 1 | C | Anomaly Detection in Time Series with R: Statistical, Distance-Based, and ML Approaches | Top industry use case |
| 2 | C | Changepoint Detection in R: changepoint, bcp, and strucchange Packages | Detect regime shifts |
| 3 | C | Time Series Clustering in R: DTW, Shape-Based, and Feature-Based Approaches | Group similar series |
| 4 | C | Time Series Classification in R: k-NN with DTW, Shapelet, and Feature-Based Methods | Classify patterns |
| 5 | FR | Motif Discovery in Time Series: Find Recurring Patterns with tsmp | |
| 6 | EX | Time Series Mining Exercises: 6 Problems — Anomalies, Changepoints, and Clustering | |

---

### Gap 4: No Multiple / Complex Seasonality Section

**What's missing:** FPP3 Chapter 12 covers this, but it's one of the hardest practical problems — hourly data with daily + weekly + annual patterns. Needs dedicated coverage with TBATS, MSTL, Fourier terms, and Prophet.

**Expand or add to Sub-Path 5 (Advanced):**

| # | Type | Title |
|---|------|-------|
| + | C | Multiple Seasonality in R: MSTL, TBATS, and Dynamic Harmonic Regression for Sub-Daily Data |
| + | FR | Hourly and Sub-Daily Forecasting in R: Handle 3+ Seasonal Periods |

---

### Gap 5: No Forecast Combination / Model Selection Strategy Section

**What's missing:** The plan mentions model stacking in the ML sub-path, but forecast combination deserves its own C post as a standalone concept — it's one of the most robust strategies (Hyndman FPP3 Ch 13.4).

**Add to Sub-Path 3 (Evaluation):**

| # | Type | Title |
|---|------|-------|
| + | C | Forecast Combination in R: Simple Averaging, Weighted Ensembles, and Stacking — Why Combining Models Almost Always Wins |

---

### Gap 6: No "Deploying Forecasts" / Production Section

**What's missing:** Getting a forecast into production — APIs, scheduled retraining, monitoring forecast drift. No tutorial site covers this for R, but it's what managers ask about.

**Add Sub-Path: "Forecasting in Production"**

| # | Type | Title | Why it's needed |
|---|------|-------|-----------------|
| 1 | C | Automating Forecasts in R: Schedule, Retrain, and Monitor with cronR and targets | Bridge from analysis to production |
| 2 | C | Forecast Monitoring and Drift Detection in R: Know When Your Model Goes Stale | Models degrade — when to retrain? |
| 3 | FR | Building a Forecast API with R and plumber: Serve Predictions via REST | |
| 4 | FR | Forecast Dashboards with R Shiny: Interactive Visualization for Stakeholders | |

---

### Gap 7: No Causal Impact / Intervention Analysis

**What's missing:** "Did my marketing campaign / policy change / product launch affect sales?" This is Bayesian structural time series (bsts) + CausalImpact. Listed as one C post in the plan, but it's one of the highest-value topics.

**Expand in Sub-Path 5 (Advanced):**

| # | Type | Title |
|---|------|-------|
| + | FR | Google's CausalImpact Package in R: Measure Marketing ROI with Time Series |
| + | FR | Interrupted Time Series Analysis in R: Pre-Post Intervention Design |

---

### Gap 8: No Spatial-Temporal Section

**What's missing:** Forecasting with a spatial dimension (predict demand across 500 store locations, disease spread across counties). R has excellent tools (spacetime, stars, sfdep). No free tutorial covers spatio-temporal forecasting.

**Add as FR posts under Advanced:**

| # | Type | Title |
|---|------|-------|
| + | FR | Spatio-Temporal Forecasting in R: Combine Geography and Time Series |
| + | FR | Spatial Autocorrelation in Time Series: Moran's I Over Time with sfdep |

---

## PART C: Cross-Path Gaps (Structural Issues)

### Gap C1: No "R for Domain X" Landing Pages

Both paths should have domain-specific entry points that aggregate relevant posts:

| Domain | Applied Statistics Posts | Time Series Posts |
|--------|------------------------|-------------------|
| **Healthcare / Clinical** | Survival analysis, mixed models (repeated measures), meta-analysis, sample size | Epidemiological forecasting, disease curves |
| **Business / Marketing** | A/B testing, regression, chi-squared | Demand forecasting, causal impact, anomaly detection |
| **Finance** | Regression, Bayesian | GARCH, financial returns, backtesting |
| **Social Science / Psychology** | Psychometrics, SEM, mixed models, effect size | — |
| **Environmental / Ecology** | Mixed models, survival, GAMs | Spatial-temporal, seasonal decomposition |

These don't need to be separate posts — they can be curated "start here" landing pages linking to existing posts.

### Gap C2: No Progression Badges / Certification Track

Competitors like DataCamp have "skill tracks" with completion badges. While we can't issue certificates, we can:
- Mark posts with difficulty levels (Beginner / Intermediate / Advanced)
- Create a "Recommended Path" sequence within each sub-path
- Add a "Prerequisites" line to each post's intro

### Gap C3: No "Common Mistakes" Section

A single post per path: "10 Most Common Statistical Mistakes in R (And How to Avoid Them)" and "10 Most Common Forecasting Mistakes in R" — these are extremely high-traffic SEO targets.

---

## PART D: Revised Totals After Gap Fills

### Applied Statistics (revised)

| Sub-Path | C | FR | EX | Total | Status |
|----------|---|----|----|-------|--------|
| 1. Choosing the Right Test | 7 (+2) | 3 (+1) | 1 | 11 | +3 new |
| 2. Comparing Groups | 11 | 5 (+1) | 2 | 18 | +1 new |
| 3. Correlation & Association | 6 | 3 | 1 | 10 | unchanged |
| 4. Regression in Practice | 13 (+3) | 7 (+2) | 2 | 22 | +5 new |
| 5. Mixed-Effects Models | 5 (-1) | 4 | 1 | 10 | moved 1 to Bayesian |
| 6. Survival Analysis | 5 | 4 (+1) | 1 | 10 | +1 new |
| 7. Experimental Design & Surveys | 5 | 2 | 1 | 8 | unchanged |
| 8. Reporting & Reproducibility | 4 | 1 | 1 | 6 | unchanged |
| **9. When Assumptions Fail (NEW)** | **5** | **4** | **0** | **9** | **new sub-path** |
| **10. Bayesian in Practice (NEW)** | **6** | **2** | **1** | **9** | **new sub-path** |
| **11. Psychometrics & Measurement (NEW)** | **5** | **2** | **1** | **8** | **new sub-path** |
| **TOTAL** | **72** | **37** | **12** | **121** | +35 vs v1 |

### Time Series Forecasting (revised)

| Sub-Path | C | FR | EX | Total | Status |
|----------|---|----|----|-------|--------|
| 1. Foundations | 9 (+2) | 4 (+1) | 1 | 14 | +3 new (data prep) |
| 2. Classical Models | 9 (+1) | 3 | 2 | 14 | +1 new (intermittent) |
| 3. Evaluation & Selection | 6 (+1) | 2 | 1 | 9 | +1 new (combination) |
| 4. ML for Forecasting | 6 | 3 | 1 | 10 | unchanged |
| 5. Multivariate & Advanced | 5 | 7 (+3) | 1 | 13 | +3 new (causal, spatial, multi-season) |
| 6. Real-World Projects | 4 | 3 | 0 | 7 | unchanged |
| 7. fable Ecosystem | 4 | 1 | 1 | 6 | unchanged |
| **8. TS Mining (NEW)** | **4** | **1** | **1** | **6** | **new sub-path** |
| **9. Forecasting in Production (NEW)** | **2** | **2** | **0** | **4** | **new sub-path** |
| **TOTAL** | **49** | **26** | **8** | **83** | +18 vs v1 |

### Grand Total (Both Paths Combined)

| | Applied Statistics | Time Series | Combined |
|--|-------------------|-------------|----------|
| Core [C] | 72 | 49 | **121** |
| Further Reading [FR] | 37 | 26 | **63** |
| Exercise [EX] | 12 | 8 | **20** |
| **Total posts** | **121** | **83** | **204** |
| Sub-paths | 11 | 9 | **20** |

204 posts across 20 sub-paths — up from 151 posts / 15 sub-paths in v1.

---

## Priority Ranking: Which Gaps Matter Most?

### Must-Have (addresses a gap no competitor fills):

1. **"When Assumptions Fail" sub-path** — the #1 practical pain point, zero competition
2. **Diagnostic Plots visual guide** — massive SEO opportunity, everyone searches this
3. **Time Series Data Preparation** — 50% of real-world work, no tutorial covers it
4. **Anomaly Detection + Changepoint** — top industry use case for time series
5. **Psychometrics / SEM** — huge underserved audience (social science researchers)
6. **"Which test?" decision flowchart** — the gateway page that drives all traffic

### Should-Have (strengthens the path significantly):

7. **Bayesian in Practice** — brms tutorials are scarce and heavily searched
8. **Equivalence testing** — growing rapidly in pharma, psychology, regulatory
9. **Forecast Combination** — the "secret weapon" most practitioners don't know about
10. **Intermittent Demand** — critical for retail/supply chain
11. **Missing Data depth** — mice package tutorial is a top search term
12. **Common Mistakes posts** — high-traffic SEO magnets

### Nice-to-Have (differentiators for completeness):

13. **Forecasting in Production** — impressive but niche audience
14. **Spatio-temporal** — cutting edge, smaller audience
15. **Time Series Classification/Clustering** — growing but specialized
16. **Domain landing pages** — navigational aid, not content
