# Plan: Which Regression Model in R?

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | Which Regression Model in R? A Decision Framework From Data Type to Final Choice |
| slug | Which-Regression-Model-in-R |
| description | Outcome type, distribution, and research question jointly determine the right regression. This guide maps every combination to its R function and assumptions. |
| keywords | which regression model R, choosing regression model, regression decision guide R, GLM R, logistic regression R, Poisson regression R, ordinal regression R, survival regression R, regression flowchart |
| auto_link_terms | choosing regression model\|regression decision guide\|which regression model\|regression model selection\|choosing the right regression |
| auto_link_case_sensitive | false |
| mathjax | true |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | DG2 |
| post_type | FR |
| sidebar_section | (none — FR post) |
| sidebar_title | (none) |
| sidebar_order | (none) |
| fr_parent | Choosing-the-Right-Statistical-Test-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > Statistical Consulting & Decision Frameworks > Which Regression Model in R?

## C. Full Section Outline

### Lead sentence
Choosing the right regression model starts with one question: what type of outcome are you predicting? This guide maps five outcome types — continuous, binary, count, ordinal, and time-to-event — to their R functions, key assumptions, and diagnostic checks.

### Introduction plan
- Hook: Most analysts know lm() and glm(), but freeze when the outcome is ordinal, zero-inflated, or survival. The wrong model doesn't always throw an error — it silently gives misleading estimates.
- What/why: Outcome type, distribution shape, and research question jointly determine the correct regression family. This post gives you a decision framework you can follow every time.
- What you'll learn: By the end you'll be able to identify your outcome type, pick the right model family, fit it in R, and check its assumptions — all using base R and the stats package (plus MASS and survival for specialized models).

### Core Content Sections

#### H2 1: "What Are the Five Outcome Types That Determine Your Regression Model?"
- Theory: Define continuous, binary, count, ordinal, time-to-event with examples
- Diagram: overview mindmap (Figure 1)
- Code block 1: Create sample datasets for each outcome type using built-in data
- Callout: KEY INSIGHT — the outcome type is the first and most important decision
- Inline exercise: Given a described research question, identify the outcome type

#### H2 2: "How Does Linear Regression Handle Continuous Outcomes?"
- Theory: OLS assumptions — linearity, normality of residuals, homoscedasticity, independence
- Code block 2: Fit lm() on mtcars (mpg ~ wt + hp), summary, interpretation
- Code block 3: Diagnostic plots (residuals vs fitted, Q-Q)
- Formula: OLS cost function with LaTeX
- Callout: TIP — use plot(model) for quick diagnostics
- Inline exercise: Fit a linear model predicting Sepal.Length from Petal.Width using iris

#### H2 3: "When Should You Use Logistic Regression for Binary Outcomes?"
- Theory: Binary outcome → logistic regression via glm(family=binomial). Log-odds, odds ratios.
- Code block 4: Fit logistic regression on a binary outcome (e.g., am in mtcars)
- Code block 5: Interpret coefficients as odds ratios with exp(coef())
- Formula: logistic function with LaTeX
- Callout: WARNING — logistic coefficients are log-odds, not probabilities
- Inline exercise: Predict vs (engine shape) from wt using logistic regression

#### H2 4: "How Do You Model Count Data with Poisson Regression?"
- Theory: Count outcomes (0, 1, 2, ...) with mean=variance assumption. When to use negative binomial instead.
- Code block 6: Fit Poisson glm on warpbreaks data
- Code block 7: Check overdispersion, show negative binomial alternative with MASS::glm.nb()
- Callout: WARNING — overdispersion is the number-one Poisson violation
- Inline exercise: Fit Poisson regression on a count variable and check dispersion

#### H2 5: "What Is Ordinal Regression and When Do You Need It?"
- Theory: Ordered categories (e.g., low/medium/high). Proportional odds assumption. MASS::polr().
- Code block 8: Fit ordinal regression with polr() on a created ordinal dataset
- Code block 9: Test proportional odds assumption
- Callout: NOTE — if proportional odds fails, consider multinomial logistic
- Inline exercise: Fit ordinal regression on a 3-level ordered outcome

#### H2 6: "How Does Cox Regression Handle Time-to-Event Data?"
- Theory: Survival analysis when outcome is time until an event. Censoring. Cox PH model.
- Code block 10: Fit coxph() on lung dataset from survival package
- Code block 11: Check proportional hazards with cox.zph()
- Diagram: decision flow (Figure 2)
- Callout: KEY INSIGHT — Cox models estimate hazard ratios, not probabilities
- Inline exercise: Fit Cox model on lung data with different predictors

#### H2 7: "How Do You Choose Between Competing Models?"
- Theory: Decision framework recap — flowchart. Model comparison within family (AIC, BIC, likelihood ratio). Residual diagnostics.
- Diagram: assumptions check (Figure 3)
- Code block 12: Compare nested models with anova(), AIC()
- Callout: TIP — AIC compares models fit to the same data; lower is better
- Inline exercise: Compare two nested linear models using AIC

### Common Mistakes plan
1. Using lm() on a binary outcome (wrong model family — predicted values outside 0-1)
2. Ignoring overdispersion in Poisson regression (underestimated standard errors)
3. Treating ordinal outcomes as continuous (loses ordering information or imposes equal spacing)
4. Forgetting to check proportional hazards in Cox models (biased hazard ratios)
5. Comparing AIC across different outcome transformations (not comparable)

### Practice Exercises plan (capstone)
1. Medium: Given a dataset, identify outcome type, fit appropriate model, interpret coefficients
2. Hard: Fit both Poisson and negative binomial to same count data, compare, justify choice
3. Hard: Complete pipeline — explore data, identify outcome type, fit model, check assumptions, interpret

### Complete Example plan
End-to-end: Take a research question with mixed predictors, identify outcome as binary, fit logistic, check assumptions, interpret odds ratios, compare models.

### Summary plan
Table mapping each outcome type → model → R function → key assumption → diagnostic check

### FAQ plan
1. Can I use linear regression if my outcome is bounded between 0 and 1?
2. What's the difference between logistic and probit regression?
3. When should I use negative binomial instead of Poisson?
4. How do I handle zero-inflated count data in R?
5. Can I use Cox regression with time-varying covariates?

### References plan
1. R Core Team — An Introduction to R
2. Hosmer, Lemeshow, Sturdivant — Applied Logistic Regression (3rd ed)
3. Cameron & Trivedi — Regression Analysis of Count Data
4. Agresti — Analysis of Ordinal Categorical Data
5. Therneau & Grambsch — Modeling Survival Data
6. Venables & Ripley — Modern Applied Statistics with S (MASS package)
7. glm() documentation — CRAN
8. survival package documentation — CRAN
9. Harrell — Regression Modeling Strategies
10. Fox — Applied Regression Analysis (car package)

### What's Next plan
1. Choosing the Right Statistical Test in R — the parent decision guide
2. Linear Regression in R (if published)
3. Logistic Regression in R (if published)

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Which-Regression-Model-in-R-overview-mindmap.webp | Figure 1 | Overview of regression model families organized by outcome type. | What Are the Five Outcome Types...? |
| 2 | Which-Regression-Model-in-R-decision-flow.webp | Figure 2 | Decision flowchart: from outcome type to R function. | How Does Cox Regression Handle...? |
| 3 | Which-Regression-Model-in-R-assumptions-check.webp | Figure 3 | Key assumptions to verify for each model family. | How Do You Choose Between...? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Create sample datasets for each outcome type | — | cont_data, bin_data, count_data | — |
| 2 | Fit linear regression on mtcars | — | lm_model | — |
| 3 | Diagnostic plots for lm | — | — | lm_model |
| 4 | Fit logistic regression on mtcars | — | logit_model | — |
| 5 | Interpret logistic coefficients as odds ratios | — | odds_ratios | logit_model |
| 6 | Fit Poisson regression on warpbreaks | — | pois_model | — |
| 7 | Check overdispersion + negative binomial | MASS | nb_model | pois_model |
| 8 | Fit ordinal regression with polr() | MASS | ord_data, ord_model | — |
| 9 | Test proportional odds assumption | — | — | ord_model, ord_data |
| 10 | Fit Cox PH on lung data | survival | cox_model | — |
| 11 | Check proportional hazards | — | ph_test | cox_model |
| 12 | Compare models with AIC | — | model_a, model_b | — |

Estimated word count: ~5500-6500 words
Code blocks: 12 tutorial + 7 inline exercises + 3 capstone = ~22 total
Diagrams: 3
