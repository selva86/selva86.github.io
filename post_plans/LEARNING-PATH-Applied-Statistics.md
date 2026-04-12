---
name: Applied Statistics Learning Path Plan
description: Comprehensive plan for a new top-level "Applied Statistics" learning path on r-statistics.co
type: learning-path-plan
---

# Applied Statistics with R — Learning Path Plan

## Why This Path Exists

R was *born* for statistics. While the existing Statistics path in the curriculum covers the theoretical foundations (probability, inference, regression, ANOVA, Bayesian, etc.), it reads like a university textbook — organized by mathematical topic. Researchers, analysts, and practitioners don't think that way. They think:

> "I have data. I need to answer a question. Which test do I run, and how do I run it in R?"

**Applied Statistics** flips the organization: it starts from the *research question* and works backward to the method. Every post answers a real question a working analyst would ask, with complete R code, interpretation guidance, and "what to report" sections.

### Competitive Gap

| Resource | Weakness |
|----------|----------|
| STHDA.com | Great test-by-test coverage, but no progression, no interactive code, no "which test should I use?" decision framework |
| DataCamp | Interactive but shallow — 20 min per topic, no depth on assumptions or edge cases |
| Penn State STAT 501-510 | Excellent depth but no R code, no interactivity, academic tone |
| Coursera (Duke) | Video-first, no searchable reference, paywalled certificates |
| Learning Statistics with R (Navarro) | Superb textbook, but not web-optimized, no interactive blocks, monolithic PDF |

**Our edge:** Interactive R code in the browser + decision-tree navigation + deep-yet-accessible writing + SEO-optimized individual pages that rank for specific queries.

---

## Path Structure

### Organizing Principle: "I have this question → here's the method"

The path is organized into 8 sub-paths, each covering a family of research questions. Within each sub-path, posts progress from "when and why" → core method → variants → diagnostics → reporting.

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
| 6 | FR | Multiple Testing Correction in R: Bonferroni, FDR, and When Each Applies | |
| 7 | FR | Bootstrap Hypothesis Testing in R: When Assumptions Fail, Resample | |
| 8 | EX | Choosing Statistical Tests Exercises: 10 Scenarios to Diagnose (8 problems) | |

**Why this comes first:** Most visitors arrive with a dataset and no idea which test to run. This section is the "triage room" — it directs them to the right sub-path. The decision flowchart post alone could be the highest-traffic page on the site.

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
| 16 | EX | t-Test and ANOVA Exercises: 12 Problems from One-Sample to Factorial (12 problems) | |
| 17 | EX | Non-Parametric Tests Exercises: 8 Wilcoxon, Kruskal-Wallis, and Friedman Problems | |

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
| 10 | EX | Correlation and Association Exercises: 10 Problems with Solutions | |

---

## Sub-Path 4: Regression in Practice

*Focused on applied use — model building, diagnostics, interpretation, reporting. Not theory-heavy.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Simple Linear Regression in R: Fit, Interpret, and Report Your First Model | How do I predict Y from X? |
| 2 | C | Multiple Linear Regression in R: Add Predictors, Check Assumptions, Report Results | Multiple predictors — which ones matter? |
| 3 | C | Regression Diagnostics in R: Residual Plots, VIF, Cook's Distance, and Leverage | Is my model actually valid? |
| 4 | C | Logistic Regression in R: Predict Binary Outcomes Step-by-Step | My outcome is yes/no — how do I model that? |
| 5 | C | Ordinal Logistic Regression in R: Model Ordered Categories with MASS::polr | My outcome has ordered levels (low/medium/high) |
| 6 | C | Multinomial Logistic Regression in R: Model Unordered Categories with nnet | My outcome has 3+ unordered categories |
| 7 | C | Poisson Regression in R: Model Count Data with glm() | My outcome is a count (0, 1, 2, ...) |
| 8 | C | Negative Binomial Regression in R: Handle Overdispersed Count Data | Poisson doesn't fit — counts are too spread out |
| 9 | C | Model Selection in R: AIC, BIC, Stepwise, and Cross-Validation Compared | Which predictors should I keep? |
| 10 | C | Interaction Effects in R: When the Effect of X Depends on Z | Does the relationship change across groups? |
| 11 | FR | Zero-Inflated Models in R: pscl Package for Excess-Zero Count Data | |
| 12 | FR | Robust Regression in R: rlm() and Quantile Regression for Outlier-Resistant Fits | |
| 13 | FR | Ridge, Lasso, and Elastic Net in R: Regularised Regression with glmnet | |
| 14 | FR | Beta Regression in R: Model Proportions and Rates (0-1 Bounded Outcomes) | |
| 15 | FR | Reporting Regression Results: How to Write Up lm() and glm() Output for Publication | |
| 16 | EX | Linear Regression Exercises: 10 Problems from Simple to Multiple with Diagnostics | |
| 17 | EX | Logistic and Count Regression Exercises: 8 GLM Problems with Solutions | |

---

## Sub-Path 5: Mixed-Effects and Multilevel Models

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
| 8 | FR | Bayesian Mixed Models with brms: Priors, Convergence, and Interpretation | |
| 9 | FR | nlme vs lme4: Which R Package for Mixed Models and When | |
| 10 | FR | Reporting Mixed Model Results: APA-Style Write-Up from lme4 Output | |
| 11 | EX | Mixed Models Exercises: 8 Problems from Random Intercepts to GLMMs | |

---

## Sub-Path 6: Survival Analysis

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
| 9 | EX | Survival Analysis Exercises: 8 Problems from Kaplan-Meier to Cox Regression | |

---

## Sub-Path 7: Experimental Design and Survey Methods

*The planning side of statistics — before you collect data.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Experimental Design Principles in R: Randomization, Blocking, and Replication | How do I design an experiment that gives valid results? |
| 2 | C | Factorial Designs in R: Full and Fractional Factorials with FrF2 | Testing multiple factors efficiently |
| 3 | C | A/B Testing in R: Sample Size, Duration, and Statistical Significance | Is version B better than version A? |
| 4 | C | Survey Sampling in R: Simple Random, Stratified, and Cluster Sampling with the survey Package | How do I analyze survey data properly? |
| 5 | C | Propensity Score Matching in R: Estimate Causal Effects from Observational Data | I can't randomize — how do I approximate an experiment? |
| 6 | FR | Crossover Designs in R: Analyze Within-Subject Experiments | |
| 7 | FR | Power Analysis for Complex Designs: simr Package for Mixed Models | |
| 8 | EX | Experimental Design Exercises: 6 Problems from A/B Tests to Factorial Designs | |

---

## Sub-Path 8: Reporting and Reproducibility

*The last mile — turning analysis into communication.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Descriptive Statistics in R: Summary Tables That Tell the Story | How do I summarise my data before any test? |
| 2 | C | Publication-Ready Tables in R: gt, gtsummary, and flextable | How do I make tables that journals accept? |
| 3 | C | Reporting Statistical Results: APA, NEJM, and Journal-Ready Write-Ups from R Output | What do I actually write in the paper? |
| 4 | C | Reproducible Statistical Analysis: R Markdown Workflow from Import to Publication | How do I make my analysis fully reproducible? |
| 5 | FR | forest plots, funnel plots, and diagnostic plots for meta-analyses | |
| 6 | EX | Reporting Exercises: 6 Problems — Turn Raw Output into Publication Paragraphs | |

---

## Totals

| Sub-Path | C | FR | EX | Total |
|----------|---|----|----|-------|
| 1. Choosing the Right Test | 5 | 2 | 1 | 8 |
| 2. Comparing Groups | 11 | 4 | 2 | 17 |
| 3. Correlation & Association | 6 | 3 | 1 | 10 |
| 4. Regression in Practice | 10 | 5 | 2 | 17 |
| 5. Mixed-Effects Models | 6 | 4 | 1 | 11 |
| 6. Survival Analysis | 5 | 3 | 1 | 9 |
| 7. Experimental Design & Surveys | 5 | 2 | 1 | 8 |
| 8. Reporting & Reproducibility | 4 | 1 | 1 | 6 |
| **TOTAL** | **52** | **24** | **10** | **86** |

---

## Key Differentiators from Competitors

1. **Decision flowchart as entry point** — no other site starts with "which test do I need?" in an interactive, searchable format
2. **Every post has runnable R code** — STHDA has static code, DataCamp is paywalled, Penn State has no code
3. **Assumption checking built into every test** — not a separate afterthought page
4. **"What to report" section in every post** — copy-paste-ready sentences for papers
5. **Real datasets** — not just `iris` and `mtcars`, but clinical, survey, and experimental data
6. **Progressive difficulty** — each sub-path goes beginner → intermediate → advanced
7. **Mixed models depth** — most free sites stop at ANOVA; we go all the way to GLMMs and Bayesian mixed models
8. **Exercises with worked solutions** — practice problems tied to each concept family

## Relationship to Existing Statistics Path

The existing `/statistics/` path in the curriculum is theory-heavy (probability theory, mathematical statistics, stochastic processes). **Applied Statistics** is the practical companion:

- Statistics path: "What is the Central Limit Theorem?"
- Applied Statistics path: "Which test do I use for my data?"

They are complementary, not redundant. Cross-links between them will be extensive.
