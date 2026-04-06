# Plan: Sensitivity Analysis in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | Sensitivity Analysis in R: How Robust Are Your Statistical Conclusions? |
| slug | Sensitivity-Analysis-in-R |
| description | Sensitivity analysis tests whether your conclusions change when you alter assumptions, exclude outliers, or use different models. Learn 5 practical approaches with R code. |
| keywords | sensitivity analysis R, robustness check R, specification curve, outlier sensitivity, bootstrap stability, model comparison R, sensitivity analysis tutorial, robust statistics R |
| auto_link_terms | sensitivity analysis\|sensitivity analysis in R\|robustness check\|specification curve\|bootstrap stability\|outlier sensitivity analysis |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-cons-3 |
| post_type | FR |
| fr_parent | Statistical-Consulting-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > Consulting > Sensitivity Analysis in R

## C. Full Section Outline

### Lead sentence
Sensitivity analysis tests whether your statistical conclusions hold up when you change your assumptions, exclude certain observations, or use alternative models — it is the difference between a fragile finding and a trustworthy one.

### Introduction (## Introduction)
- Hook: You run a regression, get a significant result, and write it up. But would the result survive if you dropped 3 outliers? Used a different control variable? Tried a non-parametric model? If you can't answer those questions, your finding is fragile.
- What: Sensitivity analysis is a structured way to test how robust your conclusions are to reasonable changes in your analytical decisions.
- Why it matters: Reviewers, clients, and stakeholders trust robust findings. Fragile results that hinge on one modeling choice are red flags.
- What you'll learn: 5 practical approaches — outlier exclusion, variable specification, alternative models, bootstrap resampling, and subgroup analysis — all in base R.
- Note: All code uses base R (no external packages needed).

### Core H2 Sections (5 sections, all question-form)

#### H2-1: What Is Sensitivity Analysis and Why Does It Matter?
- Theory: Define sensitivity analysis vs. robustness check. The "multiverse" of analytical decisions.
- Analogy: Like stress-testing a bridge — you need to know it holds under different conditions, not just ideal ones.
- Code: Create sample consulting dataset (client satisfaction ~ training_hours + experience + team_size). Fit baseline model. Show summary.
- Callout: KEY INSIGHT — A robust finding persists across reasonable alternative specifications.
- Inline exercise: Fit the same model adding an interaction term. Does the main effect change?

#### H2-2: How Do You Test Sensitivity to Outliers?
- Theory: Outliers can inflate or deflate effects. Cook's distance identifies influential points.
- Code block 1: Compute Cook's distance, identify influential observations (threshold 4/n).
- Code block 2: Refit model excluding influential observations. Compare coefficients side by side.
- Callout: WARNING — Removing outliers to "improve" p-values is data manipulation. Only remove with documented justification.
- Inline exercise: Identify observations with Cook's distance > 1 (extreme influence). How many are there?

#### H2-3: How Do You Run a Specification Curve Analysis?
- Theory: Different analysts make different defensible choices (which covariates, which sample, which transformation). A specification curve tests many at once.
- Code block 1: Define 4 model specifications (different covariate sets). Fit all, extract coefficients.
- Code block 2: Build a specification curve table showing coefficient, SE, p-value, and model description.
- Code block 3: Visualize with a simple dotchart of coefficients across specifications.
- Callout: TIP — Start with the simplest specification and add complexity. If the effect flips sign, investigate why.
- Inline exercise: Add a 5th specification that uses log-transformed outcome. Does the direction hold?

#### H2-4: How Do You Compare Alternative Models?
- Theory: Your choice of model (OLS vs. robust regression vs. non-parametric) is itself an assumption. Test it.
- Code block 1: Fit OLS, median regression (using quantile approach with optim), and rank-based comparison.
- Code block 2: Create comparison table of coefficients across model types.
- Callout: KEY INSIGHT — If OLS and a rank-based test agree, your finding is robust to distributional assumptions.
- Inline exercise: Fit a model on the log-transformed outcome. Compare the sign and significance to OLS.

#### H2-5: How Do You Use Bootstrap Resampling for Stability?
- Theory: Bootstrap resampling draws thousands of samples-with-replacement. If the coefficient is stable across resamples, it's robust.
- Code block 1: Write a bootstrap function, run 2000 iterations, collect coefficients.
- Code block 2: Plot histogram of bootstrap coefficients. Calculate 95% CI and proportion of sign flips.
- Callout: TIP — If more than 5% of bootstrap samples flip the sign of your effect, the finding is fragile.
- Inline exercise: Reduce bootstrap to 500 iterations. Does the CI width change noticeably?

### Tail Sections

#### Common Mistakes (3-5)
1. Removing outliers without justification to chase significance
2. Running only one model and calling it "robust"
3. Cherry-picking the specification that supports your hypothesis
4. Ignoring bootstrap sign flips
5. Confusing sensitivity analysis with exploratory analysis

#### Practice Exercises (2 capstone)
1. Exercise 1 (medium): Given the consulting dataset, run a full sensitivity analysis: identify outliers, refit without them, compare 3 specifications, and report whether the main effect is robust.
2. Exercise 2 (hard): Write a function that takes a formula, dataset, and number of bootstrap samples, and returns a summary table with the original coefficient, bootstrap mean, 95% CI, and sign-flip percentage.

#### Complete Example
End-to-end sensitivity analysis on the consulting dataset: outlier check → specification curve → alternative model → bootstrap → conclusion statement.

#### Summary
Table of 5 approaches with columns: Approach, What It Tests, Key Function, Red Flag Threshold.

#### FAQ (4 questions)
1. How many specifications should I test in a specification curve?
2. Is sensitivity analysis the same as power analysis?
3. Should I always remove outliers flagged by Cook's distance?
4. How many bootstrap iterations are enough?

#### References (6 sources)
1. Simonsohn et al. — Specification Curve Analysis. SSRN (2020).
2. Cinelli & Hazlett — sensemakr: Sensitivity Analysis Tools for OLS. JSS (2020).
3. R Core Team — stats package documentation.
4. Efron & Tibshirani — An Introduction to the Bootstrap. CRC Press (1993).
5. Cook, R.D. — Detection of Influential Observation in Linear Regression. Technometrics (1977).
6. Steegen et al. — Increasing Transparency Through a Multiverse Analysis. Perspectives on Psychological Science (2016).

#### What's Next
- Statistical Consulting in R (parent post) — the full consulting framework
- Outlier Detection in R — deep dive into outlier methods
- Pre-Analysis Plans in R — commit your analysis before seeing data

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Sensitivity-Analysis-in-R-workflow.webp | Figure 1 | The five-step sensitivity analysis workflow: from baseline model to robustness conclusion. | Introduction |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Create dataset + baseline model | — | consulting, baseline_model | — |
| 2 | Cook's distance + identify outliers | — | cooks_d, influential | consulting, baseline_model |
| 3 | Refit without outliers, compare | — | clean_data, clean_model | consulting, baseline_model, influential |
| 4 | Specification curve: 4 models | — | specs, spec_results | consulting |
| 5 | Specification curve visualization | — | — | spec_results |
| 6 | Alternative models (OLS vs median vs rank) | — | median_coefs, rank_result | consulting |
| 7 | Compare alternative models table | — | comparison | baseline_model, median_coefs, rank_result |
| 8 | Bootstrap function + run | — | boot_coefs | consulting |
| 9 | Bootstrap histogram + CI | — | boot_ci, sign_flips | boot_coefs |
| 10 | Inline exercise 1 (interaction) | — | ex_interaction | consulting |
| 11 | Inline exercise 2 (extreme Cook's) | — | ex_extreme | cooks_d |
| 12 | Inline exercise 3 (log spec) | — | ex_log_model | consulting, spec_results |
| 13 | Inline exercise 4 (log outcome) | — | ex_log_compare | consulting |
| 14 | Inline exercise 5 (500 bootstrap) | — | ex_boot_500 | consulting |
| 15 | Complete example (end-to-end) | — | final_* | consulting |
| 16 | Capstone exercise 1 | — | my_* | consulting |
| 17 | Capstone exercise 2 | — | my_sensitivity_fn | — |
