---
name: Applied Statistics Learning Path Plan (v2 — PhD-Level)
description: World-class plan for a top-level "Applied Statistics with R" learning path — practitioner-through-PhD depth
type: learning-path-plan
version: 2
---

# Applied Statistics with R — Learning Path Plan (v2)

## Why This Path Exists

R was *born* for statistics. While the existing Statistics path in the curriculum covers the theoretical foundations (probability, inference, regression, ANOVA, Bayesian, etc.), it reads like a university textbook — organized by mathematical topic. Researchers, analysts, and practitioners don't think that way. They think:

> "I have data. I need to answer a question. Which method do I use, and how do I run it in R?"

**Applied Statistics** flips the organization: it starts from the *research question* and works backward to the method. Every post answers a real question a working analyst or researcher would ask, with complete R code, interpretation guidance, and "what to report" sections.

### What Makes This PhD-Level

Most free R statistics resources stop at ANOVA and basic regression. This path goes all the way to:
- **Causal inference** (DAGs, instrumental variables, difference-in-differences, regression discontinuity, synthetic controls)
- **Meta-analysis** (fixed/random effects, network meta-analysis, publication bias)
- **Structural equation modeling** (CFA, full SEM, measurement invariance, mediation)
- **Spatial statistics** (geostatistics, kriging, spatial regression, point processes)
- **Computational statistics** (Monte Carlo simulation, EM algorithm, bootstrap theory)
- **High-dimensional inference** (penalized regression theory, debiased lasso, false discovery rate)
- **Multivariate methods** (PCA, discriminant analysis, MANOVA, canonical correlation, MDS)

This isn't dumbed-down theory. It's theory made *actionable* — every concept has runnable R code, real data, and interpretation guidance.

### Competitive Landscape

| Resource | Strength | Weakness |
|----------|----------|----------|
| STHDA.com | Great test-by-test coverage | No progression, no interactive code, no decision framework, stops at ANOVA level |
| Hyndman's FPP3 | Gold standard for time series | Statistics coverage is narrow (forecasting only) |
| DataCamp | Interactive, good pacing | Shallow (20 min per topic), paywalled, no depth on assumptions |
| Penn State STAT 501-510 | Excellent depth | No R code, no interactivity, academic tone, dated |
| Coursera (Duke/Johns Hopkins) | Video-first, structured | Paywalled certificates, not searchable, no runnable code |
| Learning Statistics with R (Navarro) | Superb textbook | Not web-optimized, monolithic PDF, stops at intermediate level |
| r-causal.org | Excellent causal inference | Causal-only, no broader statistics coverage |
| Spatial Data Science (r-spatial.org) | Authoritative spatial | Spatial-only, no interactive code blocks |

**Our edge:** The only free resource that covers the *full arc* — from "which test do I run?" to causal inference, meta-analysis, SEM, spatial stats, and computational methods — with interactive R code in the browser, decision-tree navigation, and a progression from beginner to PhD-level.

---

## Path Structure

### Organizing Principle: "I have this question → here's the method"

The path is organized into 16 sub-paths, each covering a family of research questions. Within each sub-path, posts progress from "when and why" → core method → variants → diagnostics → reporting.

**Three tiers of difficulty:**
- **Tier 1 (Sub-Paths 1-8):** Essential applied statistics — every working analyst needs this
- **Tier 2 (Sub-Paths 9-12):** Advanced applied methods — researchers, PhD students, specialists
- **Tier 3 (Sub-Paths 13-16):** Computational and theoretical foundations — PhD-level depth

---

## TIER 1: ESSENTIAL APPLIED STATISTICS

---

## Sub-Path 1: Choosing the Right Test (Decision Framework)

*The gateway section. Every visitor's first stop.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Which Statistical Test Should I Use? The Decision Flowchart for R Users | I have data — where do I even start? |
| 2 | C | Parametric vs Non-Parametric Tests in R: How to Choose and Why It Matters | My data isn't normal — does that kill my analysis? |
| 3 | C | Checking Assumptions in R: Normality, Homoscedasticity, and Independence Tests | How do I verify my data meets the test's requirements? |
| 4 | C | Effect Size in R: Cohen's d, Eta-Squared, and Why p-Values Aren't Enough | The test is significant — but is the effect meaningful? |
| 5 | C | Statistical Power and Sample Size in R: pwr Package Step-by-Step | How many observations do I actually need? |
| 6 | C | Equivalence Testing in R: TOST Procedure — When "No Significant Difference" Isn't Enough | How do I prove two things are equivalent? |
| 7 | FR | Multiple Testing Correction in R: Bonferroni, FDR, and When Each Applies | |
| 8 | FR | Bootstrap Hypothesis Testing in R: When Assumptions Fail, Resample | |
| 9 | FR | Non-Inferiority Testing in R: Prove the New Treatment Is At Least As Good | |
| 10 | EX | Choosing Statistical Tests Exercises: 10 Scenarios to Diagnose | |

---

## Sub-Path 2: Comparing Groups (t-Tests, ANOVA, and Alternatives)

*The most-searched family of statistical tests.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | One-Sample t-Test in R: Test Whether a Mean Differs from a Known Value | Is my sample mean different from a target? |
| 2 | C | Independent Two-Sample t-Test in R: Compare Means Between Two Groups | Are these two groups different? |
| 3 | C | Paired t-Test in R: Before-and-After Comparisons Done Right | Did the treatment change scores? |
| 4 | C | Welch's t-Test in R: The Default You Should Already Be Using | What if variances are unequal? |
| 5 | C | One-Way ANOVA in R: Compare Means Across 3+ Groups | Which of these groups differ? |
| 6 | C | Two-Way ANOVA in R: Test Two Factors and Their Interaction | Do two factors combine to affect the outcome? |
| 7 | C | Post-Hoc Tests in R: Tukey HSD, Bonferroni, and emmeans Pairwise Comparisons | ANOVA is significant — which groups differ? |
| 8 | C | Repeated Measures ANOVA in R: Handle Within-Subject Designs | Same subjects measured multiple times |
| 9 | C | ANCOVA in R: Compare Groups While Controlling for a Covariate | How do I adjust for a confounding variable? |
| 10 | C | Wilcoxon and Mann-Whitney Tests in R: Non-Parametric Group Comparisons | My data isn't normal — what now? |
| 11 | C | Kruskal-Wallis Test in R: Non-Parametric Alternative to One-Way ANOVA | Non-normal data, 3+ groups |
| 12 | FR | Friedman Test in R: Non-Parametric Repeated Measures | |
| 13 | FR | Games-Howell Test in R: Post-Hoc When Variances Differ | |
| 14 | FR | Permutation Tests in R: Distribution-Free Hypothesis Testing | |
| 15 | FR | Robust ANOVA in R: WRS2 Package for Trimmed Means and Medians | |
| 16 | FR | How to Report t-Test and ANOVA Results: APA/NEJM Templates with R Code | |
| 17 | EX | t-Test and ANOVA Exercises: 12 Problems from One-Sample to Factorial | |
| 18 | EX | Non-Parametric Tests Exercises: 8 Wilcoxon, Kruskal-Wallis, and Friedman Problems | |

---

## Sub-Path 3: Correlation and Association

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Pearson Correlation in R: Measure Linear Relationships Between Two Variables | How strongly are X and Y related? |
| 2 | C | Spearman and Kendall Rank Correlation in R: When Your Data Isn't Linear | What about monotonic but non-linear relationships? |
| 3 | C | Correlation Matrix in R: Visualize and Test Many Relationships at Once | Which variables in my dataset are correlated? |
| 4 | C | Partial Correlation in R: Control for Confounders in Correlation Analysis | Is the correlation real or driven by a third variable? |
| 5 | C | Chi-Squared Test in R: Test Association Between Categorical Variables | Are these two categories independent? |
| 6 | C | Fisher's Exact Test in R: Small-Sample Alternative to Chi-Squared | Same question, but my cells have small counts |
| 7 | FR | Point-Biserial Correlation in R: Correlate a Binary and a Continuous Variable | |
| 8 | FR | Polychoric and Tetrachoric Correlation in R: Ordinal and Binary Variables | |
| 9 | FR | Distance and Similarity Measures in R: Beyond Correlation | |
| 10 | FR | How to Report Correlation Results: Tables, Matrices, and Write-Up Templates | |
| 11 | EX | Correlation and Association Exercises: 10 Problems with Solutions | |

---

## Sub-Path 4: Regression in Practice

*Focused on applied use — model building, diagnostics, interpretation, reporting.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Simple Linear Regression in R: Fit, Interpret, and Report Your First Model | How do I predict Y from X? |
| 2 | C | Multiple Linear Regression in R: Add Predictors, Check Assumptions, Report Results | Multiple predictors — which ones matter? |
| 3 | C | Regression Diagnostics in R: Residual Plots, VIF, Cook's Distance, and Leverage | Is my model actually valid? |
| 4 | C | Reading R's 4 Diagnostic Plots: Residuals vs Fitted, Q-Q, Scale-Location, and Leverage — Annotated Visual Guide | What do these plots actually tell me? |
| 5 | C | Logistic Regression in R: Predict Binary Outcomes Step-by-Step | My outcome is yes/no — how do I model that? |
| 6 | C | Ordinal Logistic Regression in R: Model Ordered Categories with MASS::polr | My outcome has ordered levels (low/medium/high) |
| 7 | C | Multinomial Logistic Regression in R: Model Unordered Categories with nnet | My outcome has 3+ unordered categories |
| 8 | C | Poisson Regression in R: Model Count Data with glm() | My outcome is a count (0, 1, 2, ...) |
| 9 | C | Negative Binomial Regression in R: Handle Overdispersed Count Data | Poisson doesn't fit — counts are too spread out |
| 10 | C | Model Selection in R: AIC, BIC, Stepwise, and Cross-Validation Compared | Which predictors should I keep? |
| 11 | C | Interaction Effects in R: When the Effect of X Depends on Z | Does the relationship change across groups? |
| 12 | C | Generalized Additive Models (GAMs) in R: mgcv for Non-Linear Relationships | What if the relationship isn't a straight line? |
| 13 | FR | Zero-Inflated Models in R: pscl Package for Excess-Zero Count Data | |
| 14 | FR | Robust Regression in R: rlm() and Quantile Regression for Outlier-Resistant Fits | |
| 15 | FR | Beta Regression in R: Model Proportions and Rates (0-1 Bounded Outcomes) | |
| 16 | FR | LOESS and Spline Regression in R: Smooth Curves When Linear Doesn't Fit | |
| 17 | FR | performance Package in R: One-Line Model Diagnostics with check_model() | |
| 18 | FR | Reporting Regression Results: How to Write Up lm() and glm() Output for Publication | |
| 19 | EX | Linear Regression Exercises: 10 Problems from Simple to Multiple with Diagnostics | |
| 20 | EX | Logistic and Count Regression Exercises: 8 GLM Problems with Solutions | |

---

## Sub-Path 5: When Assumptions Fail — Practical Remedies

*The section that makes practitioners say "finally, someone tells me what to do when things go wrong."*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | What to Do When Normality Fails: Transformations, Non-Parametric Alternatives, and Robust Methods | My data isn't normal — now what? |
| 2 | C | What to Do When Homoscedasticity Fails: Welch's Correction, Sandwich Estimators, and WLS | My residuals fan out — is my model broken? |
| 3 | C | Handling Outliers in R: Detection, Diagnosis, and 5 Strategies Beyond "Just Delete Them" | How do I deal with extreme values responsibly? |
| 4 | C | Missing Data in R: MCAR/MAR/MNAR, Multiple Imputation with mice, and When to Drop vs Impute | Every real dataset has missing values |
| 5 | C | Multicollinearity in R: VIF, Condition Index, and What to Actually Do About It | My predictors are correlated — what breaks? |
| 6 | FR | Influential Points vs Outliers: Cook's Distance, DFFITS, and Leverage in R | |
| 7 | FR | Data Transformations in R: Log, Square Root, Box-Cox — When and Why Each Works | |
| 8 | FR | mice Package Deep Dive: Chained Equations, Passive Imputation, and Pooling Results | |
| 9 | FR | Visualizing Missingness Patterns in R: naniar and VIM Packages | |
| 10 | EX | Assumption Remedies Exercises: 8 Problems — Diagnose, Fix, and Refit | |

---

## Sub-Path 6: Mixed-Effects and Multilevel Models

*Where R is unmatched. lme4, nlme, and brms are the gold standard worldwide.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Why You Need Mixed Models: Repeated Measures, Nested Data, and the Independence Problem | My observations aren't independent — what breaks? |
| 2 | C | Linear Mixed Models in R: Random Intercepts and Slopes with lme4 | Students nested in classrooms, patients in hospitals |
| 3 | C | Interpreting Mixed Model Output: Fixed Effects, Random Effects, and ICC | What do these numbers actually mean? |
| 4 | C | Generalized Linear Mixed Models in R: Logistic and Poisson with Random Effects | Binary or count outcomes + clustering |
| 5 | C | Mixed Model Diagnostics: Check Assumptions for lmer() and glmer() | How do I know if my mixed model is valid? |
| 6 | C | Crossed vs Nested Random Effects: Choose the Right Structure for Your Design | Items crossed with subjects vs students within schools |
| 7 | FR | Growth Curve Models in R: Model Change Over Time with lme4 | |
| 8 | FR | nlme vs lme4: Which R Package for Mixed Models and When | |
| 9 | FR | Reporting Mixed Model Results: APA-Style Write-Up from lme4 Output | |
| 10 | EX | Mixed Models Exercises: 8 Problems from Random Intercepts to GLMMs | |

---

## Sub-Path 7: Survival Analysis

*Clinical trials, reliability engineering, time-to-event data. R's survival package is the world standard.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Survival Analysis Basics in R: Censoring, Kaplan-Meier Curves, and the survival Package | How do I analyze time-to-event data? |
| 2 | C | Log-Rank Test in R: Compare Survival Curves Between Groups | Do two treatment groups have different survival? |
| 3 | C | Cox Proportional Hazards in R: The Workhorse of Survival Regression | Which factors predict survival time? |
| 4 | C | Checking the Proportional Hazards Assumption: cox.zph and Schoenfeld Residuals | Is my Cox model valid? |
| 5 | C | Parametric Survival Models in R: Weibull, Exponential, and Log-Normal | When I want to model the hazard function shape |
| 6 | FR | Time-Varying Covariates in Cox Models: Handle Predictors That Change Over Time | |
| 7 | FR | Competing Risks in R: cmprsk and Fine-Gray Models | |
| 8 | FR | survminer: Publication-Ready Survival Plots in R | |
| 9 | FR | How to Report Survival Analysis: Kaplan-Meier Tables and Cox Model Write-Ups | |
| 10 | EX | Survival Analysis Exercises: 8 Problems from Kaplan-Meier to Cox Regression | |

---

## Sub-Path 8: Experimental Design and Survey Methods

*The planning side of statistics — before you collect data.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Experimental Design Principles in R: Randomization, Blocking, and Replication | How do I design an experiment that gives valid results? |
| 2 | C | Factorial Designs in R: Full and Fractional Factorials with FrF2 | Testing multiple factors efficiently |
| 3 | C | A/B Testing in R: Sample Size, Duration, and Statistical Significance | Is version B better than version A? |
| 4 | C | Survey Sampling in R: Simple Random, Stratified, and Cluster Sampling with the survey Package | How do I analyze survey data properly? |
| 5 | FR | Crossover Designs in R: Analyze Within-Subject Experiments | |
| 6 | FR | Power Analysis for Complex Designs: simr Package for Mixed Models | |
| 7 | EX | Experimental Design Exercises: 6 Problems from A/B Tests to Factorial Designs | |

---

## TIER 2: ADVANCED APPLIED METHODS

---

## Sub-Path 9: Causal Inference

*THE hottest topic in modern statistics. Every top PhD program now requires this. R has world-class tools.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Causal Inference in R: Why Correlation Isn't Causation and What to Do About It | How do I move from "X is associated with Y" to "X causes Y"? |
| 2 | C | DAGs in R: Draw and Query Causal Diagrams with dagitty and ggdag | How do I map out which variables confound my analysis? |
| 3 | C | Propensity Score Methods in R: Matching, Weighting, and Stratification with MatchIt | I can't randomize — how do I approximate an experiment? |
| 4 | C | Inverse Probability Weighting in R: IPW and Augmented IPW for Causal Effects | How do I weight observations to mimic a randomized trial? |
| 5 | C | Difference-in-Differences in R: The Natural Experiment Design for Policy Evaluation | I have before/after data for treated and control groups |
| 6 | C | Regression Discontinuity Design in R: Sharp and Fuzzy RDD with rdrobust | There's a cutoff score — how do I exploit it? |
| 7 | C | Instrumental Variables in R: 2SLS with ivreg When You Have an Instrument | My treatment is endogenous — what's the fix? |
| 8 | C | Synthetic Control Method in R: Estimate Causal Effects When You Have One Treated Unit | I have one treated state/country — can I still estimate the effect? |
| 9 | FR | Double Machine Learning in R: Combine ML and Causal Inference with DoubleML | |
| 10 | FR | Causal Forests in R: Heterogeneous Treatment Effects with grf | |
| 11 | FR | Mediation Analysis in R: Decompose Total Effects into Direct and Indirect | |
| 12 | FR | Sensitivity Analysis for Unmeasured Confounding: How Robust Are Your Causal Claims? | |
| 13 | EX | Causal Inference Exercises: 10 Problems — From DAGs to Synthetic Controls | |

**Why this is critical:** Harvard, Stanford, and Columbia all have dedicated causal inference PhD courses. The `r-causal.org` book is excellent but narrowly focused. No free site covers the full toolkit (DAGs + matching + DiD + RDD + IV + synthetic controls + ML-based methods) with interactive R code. This sub-path alone could drive massive traffic from economics, epidemiology, political science, and policy evaluation.

---

## Sub-Path 10: Meta-Analysis

*Synthesize evidence across studies. CRAN has an entire Task View for this — it's that important.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Meta-Analysis in R: Fixed-Effect and Random-Effects Models with metafor | How do I combine results from multiple studies? |
| 2 | C | Forest Plots in R: Visualize Meta-Analysis Results with Publication Quality | How do I display study-level and pooled estimates? |
| 3 | C | Heterogeneity in Meta-Analysis: I², Q-Test, and Prediction Intervals in R | Are these studies measuring the same thing? |
| 4 | C | Publication Bias in R: Funnel Plots, Egger's Test, Trim-and-Fill, and p-Curve | Am I missing studies that found no effect? |
| 5 | C | Meta-Regression in R: Explain Between-Study Variation with Moderators | Why do effect sizes differ across studies? |
| 6 | FR | Network Meta-Analysis in R: Compare Multiple Treatments Simultaneously with netmeta | |
| 7 | FR | Bayesian Meta-Analysis in R: bayesmeta and brms for Hierarchical Synthesis | |
| 8 | FR | Individual Participant Data Meta-Analysis in R: When Summary Data Isn't Enough | |
| 9 | FR | Diagnostic Test Accuracy Meta-Analysis in R: mada Package | |
| 10 | EX | Meta-Analysis Exercises: 8 Problems — From Fixed-Effects to Publication Bias | |

**Why this is critical:** Systematic reviews and meta-analyses are the highest level of evidence in medicine, psychology, and education. The metafor package is the most powerful meta-analysis tool in any language. Cochrane reviews, Campbell Collaboration reviews, and most journal meta-analyses use R. No free tutorial covers the full workflow with interactive code.

---

## Sub-Path 11: Multivariate Analysis

*The classical multivariate methods that every PhD statistician needs. R has excellent built-in support.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Principal Component Analysis (PCA) in R: Reduce Dimensions While Preserving Variance | I have 50 variables — how do I simplify? |
| 2 | C | Factor Analysis in R: Uncover Latent Variables Behind Observed Correlations | What hidden constructs explain my data? |
| 3 | C | PCA vs Factor Analysis: When to Use Each and Why They're Not the Same Thing | Everyone confuses these — what's the real difference? |
| 4 | C | MANOVA in R: Test Group Differences Across Multiple Outcomes Simultaneously | ANOVA but with multiple dependent variables |
| 5 | C | Linear Discriminant Analysis in R: Classify Observations into Groups with MASS::lda | Which group does this observation belong to? |
| 6 | C | Cluster Analysis in R: K-Means, Hierarchical, and PAM — Choose and Validate | How do I find natural groupings in my data? |
| 7 | C | Multidimensional Scaling in R: Visualize Similarity and Distance in 2D | How do I map high-dimensional distances onto a plot? |
| 8 | FR | Canonical Correlation Analysis in R: Relate Two Sets of Variables | |
| 9 | FR | Correspondence Analysis in R: FactoMineR for Categorical Data Reduction | |
| 10 | FR | Non-Negative Matrix Factorization in R: NMF for Parts-Based Decomposition | |
| 11 | FR | t-SNE and UMAP in R: Modern Nonlinear Dimension Reduction for Visualization | |
| 12 | EX | Multivariate Analysis Exercises: 10 Problems — PCA to Clustering | |

---

## Sub-Path 12: Psychometrics, Scale Validation, and SEM

*Psychology, education, and health researchers who build questionnaires and scales. R's lavaan is the world standard for SEM.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Exploratory Factor Analysis in R: psych Package from Extraction to Rotation | How do I discover the structure of my questionnaire? |
| 2 | C | Confirmatory Factor Analysis in R: lavaan CFA from Model Specification to Fit Indices | Does my proposed scale structure actually fit the data? |
| 3 | C | Reliability Analysis in R: Cronbach's Alpha, McDonald's Omega, and When Alpha Misleads | How internally consistent is my scale? |
| 4 | C | Structural Equation Modeling in R: lavaan SEM from Path Diagrams to Model Comparison | How do I test a full theoretical model with latent variables? |
| 5 | C | Item Response Theory in R: mirt Package for Modern Test Analysis | How do my test items perform across ability levels? |
| 6 | C | Measurement Invariance in R: Multi-Group CFA to Test Fairness Across Groups | Does my scale measure the same thing in different populations? |
| 7 | FR | Mediation and Moderation in SEM: lavaan for Indirect and Conditional Effects | |
| 8 | FR | Bayesian SEM with blavaan: Informative Priors and Small-Sample Solutions | |
| 9 | FR | Rasch Models in R: eRm and TAM Packages for Measurement | |
| 10 | EX | Psychometrics and SEM Exercises: 8 Problems — From EFA to Full SEM | |

---

## TIER 3: COMPUTATIONAL AND THEORETICAL FOUNDATIONS

---

## Sub-Path 13: Bayesian Analysis in Practice

*Not MCMC theory — practical Bayesian analysis. "I want to run a Bayesian t-test / regression / mixed model. How?"*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Bayesian Statistics for Practitioners: Priors, Posteriors, and Why You'd Choose Bayes | When and why should I go Bayesian? |
| 2 | C | Bayesian t-Tests and ANOVA in R: BayesFactor Package Step-by-Step | How do I run the Bayesian version of my frequentist test? |
| 3 | C | Bayesian Regression in R with brms: From Prior Choice to Posterior Interpretation | The gold standard for Bayesian modeling in R |
| 4 | C | Bayesian Mixed Models in R with brms: The Natural Extension of lme4 | Hierarchical data + Bayesian inference |
| 5 | C | MCMC Diagnostics in R: Trace Plots, R-hat, ESS — Is My Model Converged? | How do I know my Bayesian model actually worked? |
| 6 | C | Bayes Factors vs Credible Intervals: Two Frameworks for Bayesian Inference | Which Bayesian approach should I use? |
| 7 | FR | Prior Sensitivity Analysis: How Much Do Your Priors Change the Conclusions? | |
| 8 | FR | Bayesian Power Analysis in R: simr and bfdesign for Study Planning | |
| 9 | FR | Stan in R: Write Custom Bayesian Models When brms Isn't Enough | |
| 10 | EX | Bayesian Analysis Exercises: 8 Problems — From BayesFactor to brms | |

---

## Sub-Path 14: Computational Statistics and Simulation

*The engine room of modern statistics. Every PhD program requires this.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Monte Carlo Simulation in R: Generate, Simulate, and Understand Sampling Distributions | How do I use simulation to understand statistical properties? |
| 2 | C | The Bootstrap in R: Theory, Implementation, and When It Fails | How does resampling give me confidence intervals without formulas? |
| 3 | C | Permutation Tests in R: The Logic of Randomization-Based Inference | How can I test hypotheses without distributional assumptions? |
| 4 | C | The EM Algorithm in R: Maximum Likelihood with Missing Data and Mixtures | How do I estimate parameters when data is incomplete or mixed? |
| 5 | C | Cross-Validation in R: Leave-One-Out, k-Fold, and Repeated CV Done Right | How do I honestly evaluate my model's predictive performance? |
| 6 | C | Simulation Studies in R: Design, Run, and Analyze a Monte Carlo Experiment | How do I compare statistical methods fairly? |
| 7 | FR | Jackknife Estimation in R: Bias Correction and Variance Estimation | |
| 8 | FR | Markov Chain Monte Carlo from Scratch in R: Metropolis-Hastings and Gibbs Sampling | |
| 9 | FR | Importance Sampling and Sequential Monte Carlo in R | |
| 10 | FR | Numerical Optimization in R: optim(), nlm(), and Newton-Raphson for MLE | |
| 11 | EX | Computational Statistics Exercises: 8 Problems — Simulation, Bootstrap, and EM | |

---

## Sub-Path 15: High-Dimensional Statistics

*When you have more variables than observations. The modern statistics frontier.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Ridge, Lasso, and Elastic Net in R: Penalized Regression with glmnet | How do I fit regression when p is large relative to n? |
| 2 | C | Choosing the Penalty: Cross-Validation for Lambda in glmnet | How do I pick the regularization strength? |
| 3 | C | Variable Selection with Lasso: Which Predictors Actually Matter? | Does lasso give me reliable variable selection? |
| 4 | C | False Discovery Rate in R: Control FDR When Testing Thousands of Hypotheses | How do I handle multiple testing at genomic scale? |
| 5 | C | Sparse PCA and Sparse Regression: When Standard Methods Can't Handle p >> n | How do I do PCA or regression with thousands of variables? |
| 6 | FR | Debiased Lasso in R: Valid Inference After Penalized Regression | |
| 7 | FR | Group Lasso and Adaptive Lasso in R: Structured and Weighted Penalties | |
| 8 | FR | Knockoff Filter in R: Controlled Variable Selection with knockoff Package | |
| 9 | EX | High-Dimensional Statistics Exercises: 6 Problems — Penalization to FDR | |

---

## Sub-Path 16: Spatial Statistics

*R is THE language for spatial statistics. sf, spdep, gstat, spatstat are the global standards.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Spatial Data in R: sf Objects, Coordinate Systems, and the Modern Spatial Stack | How do I work with geographic data in R? |
| 2 | C | Spatial Autocorrelation in R: Moran's I, Geary's C, and Why Location Matters | Are nearby observations more similar than distant ones? |
| 3 | C | Spatial Regression in R: Spatial Lag and Spatial Error Models with spatialreg | How do I account for spatial dependence in regression? |
| 4 | C | Geostatistics in R: Variograms and Kriging with gstat | How do I interpolate values at unsampled locations? |
| 5 | C | Point Process Analysis in R: spatstat for Spatial Point Patterns | Are my events (crimes, trees, earthquakes) randomly distributed? |
| 6 | FR | Geographically Weighted Regression in R: GWmodel for Spatially Varying Relationships | |
| 7 | FR | Spatial Clustering in R: Detect Hot Spots with spdep and Local Moran's I | |
| 8 | FR | Bayesian Spatial Models in R: INLA for Fast Approximate Inference | |
| 9 | EX | Spatial Statistics Exercises: 6 Problems — Autocorrelation to Kriging | |

---

## Sub-Path 17: Reporting and Reproducibility

*The last mile — turning analysis into communication.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Descriptive Statistics in R: Summary Tables That Tell the Story | How do I summarize my data before any test? |
| 2 | C | Publication-Ready Tables in R: gt, gtsummary, and flextable | How do I make tables that journals accept? |
| 3 | C | Reporting Statistical Results: APA, NEJM, and Journal-Ready Write-Ups from R Output | What do I actually write in the paper? |
| 4 | C | Reproducible Statistical Analysis: R Markdown Workflow from Import to Publication | How do I make my analysis fully reproducible? |
| 5 | FR | Forest Plots, Funnel Plots, and Diagnostic Plots for Publication | |
| 6 | EX | Reporting Exercises: 6 Problems — Turn Raw Output into Publication Paragraphs | |

---

## Totals

| Sub-Path | C | FR | EX | Total |
|----------|---|----|----|-------|
| **TIER 1: ESSENTIAL** | | | | |
| 1. Choosing the Right Test | 6 | 3 | 1 | 10 |
| 2. Comparing Groups | 11 | 5 | 2 | 18 |
| 3. Correlation & Association | 6 | 4 | 1 | 11 |
| 4. Regression in Practice | 12 | 6 | 2 | 20 |
| 5. When Assumptions Fail | 5 | 4 | 1 | 10 |
| 6. Mixed-Effects Models | 6 | 3 | 1 | 10 |
| 7. Survival Analysis | 5 | 4 | 1 | 10 |
| 8. Experimental Design & Surveys | 5 | 2 | 1 | 8 |
| **TIER 2: ADVANCED** | | | | |
| 9. Causal Inference | 8 | 4 | 1 | 13 |
| 10. Meta-Analysis | 5 | 4 | 1 | 10 |
| 11. Multivariate Analysis | 7 | 4 | 1 | 12 |
| 12. Psychometrics & SEM | 6 | 3 | 1 | 10 |
| **TIER 3: COMPUTATIONAL** | | | | |
| 13. Bayesian in Practice | 6 | 3 | 1 | 10 |
| 14. Computational Statistics | 6 | 4 | 1 | 11 |
| 15. High-Dimensional Statistics | 5 | 3 | 1 | 9 |
| 16. Spatial Statistics | 5 | 3 | 1 | 9 |
| 17. Reporting & Reproducibility | 4 | 1 | 1 | 6 |
| **TOTAL** | **108** | **60** | **19** | **187** |

---

## Key Differentiators — What Makes This PhD-Level

1. **Three-tier architecture** — beginners start at Tier 1, researchers go to Tier 2, PhD students go to Tier 3. No one is lost, no one is bored.
2. **Causal inference sub-path** — the only free resource covering DAGs + matching + DiD + RDD + IV + synthetic controls + ML-based causal methods with interactive R code
3. **Meta-analysis sub-path** — the only free tutorial covering the full metafor pipeline: fixed/random effects, heterogeneity, publication bias, meta-regression, network meta-analysis
4. **Multivariate analysis sub-path** — PCA, factor analysis, discriminant analysis, MANOVA, MDS, clustering — the classical methods that every PhD statistician needs
5. **Computational statistics sub-path** — Monte Carlo, bootstrap theory, EM algorithm, simulation studies — the engine room of modern statistics
6. **Spatial statistics sub-path** — R is THE language for spatial stats; no other tutorial site covers this with interactive code
7. **High-dimensional statistics** — penalized regression theory, FDR, sparse methods — the modern frontier
8. **Every post has runnable R code** in the browser — no installation, no friction
9. **Decision flowchart as entry point** — no other site starts with "which method do I need?"
10. **"What to report" in every post** — copy-paste-ready sentences for papers
11. **When Assumptions Fail sub-path** — the practical troubleshooting section no competitor has
12. **SEM depth** — CFA, full SEM, measurement invariance, Bayesian SEM — the complete lavaan journey

## Relationship to Existing Paths

| Existing Path | Relationship |
|---------------|-------------|
| `/statistics/` (theory) | Complementary — theory teaches the math, Applied Statistics teaches the practice |
| `/machine-learning/` | Minimal overlap — ML focuses on prediction, Applied Stats focuses on inference and hypothesis testing |
| `/specializations/` | Spatial statistics overlaps with Geospatial specialization — cross-link extensively |
| `/advanced-r/` | Computational Statistics overlaps with Advanced R's Computational Stats — cross-link or merge |
