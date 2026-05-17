---
title: "Logistic Regression Exercises in R: 25 Practice Problems"
slug: "Logistic-Regression-Exercises-in-R"
description: "Logistic regression R exercises: 25 binary classification problems covering glm(), odds ratios, ROC/AUC, threshold tuning, and end-to-end model workflows."
keywords: "logistic regression R exercises, glm R practice, binary classification R, odds ratio R, ROC AUC R, logistic regression practice problems"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Logistic Regression Exercises"
sidebar_order: 127
fr_parent: "Logistic-Regression-With-R.html"
auto_link_terms: "logistic regression in r|glm in r|binary classification|odds ratio|roc curve|confusion matrix"
auto_link_case_sensitive: false
target_keyword: "logistic regression R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Logistic Regression Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five graded logistic regression problems in R, from fitting your first `glm()` and reading odds ratios to ROC/AUC scoring, threshold tuning, and an end-to-end churn pipeline. Each problem ships with an Expected result and a hidden solution so you can self-check.</p>

```r title="Run this once before any exercise"
library(stats)
library(dplyr)
library(tibble)
library(pROC)
library(broom)
library(ggplot2)
```

## Section 1. Fit, predict, and interpret a binary logistic model (4 problems)

### Exercise 1.1: Fit a one-predictor logistic regression on mtcars

**Task:** Use `glm()` with `family = binomial` to fit a logistic regression predicting transmission type (`am`, 1 = manual) from miles per gallon (`mpg`) on the built-in `mtcars` dataset. Save the fitted model object to `ex_1_1` and print its summary coefficients.

**Expected result:**

```
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -6.6035     2.3514  -2.808  0.00498 **
#> mpg           0.3070     0.1148   2.673  0.00751 **
```

**Difficulty:** Beginner

[HINTS]
A logistic regression is a generalized linear model with a binomial response; the model formula puts the outcome on the left and the predictor on the right.
Call `glm()` with the formula `am ~ mpg`, `data = mtcars`, and `family = binomial`.

```r title="Your turn"
ex_1_1 <- # your code here
summary(ex_1_1)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- glm(am ~ mpg, data = mtcars, family = binomial)
summary(ex_1_1)$coefficients
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -6.6035     2.3514  -2.808  0.00498
#> mpg           0.3070     0.1148   2.673  0.00751
```

**Explanation:** `glm()` with `family = binomial` fits a logistic regression by maximum likelihood. The default link is `logit`, so coefficients are on the log-odds scale: a one-MPG increase raises the log-odds of a manual transmission by 0.307. The Wald z-value tests whether each coefficient differs from zero. Use `family = binomial(link = "probit")` if you ever need the probit alternative.

</details>

### Exercise 1.2: Predict response-scale probabilities for new mpg values

**Task:** Using the model `ex_1_1`, predict the probability of a manual transmission for cars with `mpg` values of 10, 20, and 30. Use `predict()` with `type = "response"` so the output is on the probability scale, not log-odds. Save the named numeric result to `ex_1_2`.

**Expected result:**

```
#>          1          2          3
#> 0.02672 0.36625 0.92293
```

**Difficulty:** Intermediate

[HINTS]
Predicting for unseen predictor values means supplying a fresh data frame and asking for output on the probability scale rather than the log-odds scale.
Use `predict()` with `newdata = data.frame(mpg = c(10, 20, 30))` and `type = "response"`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- predict(ex_1_1, newdata = data.frame(mpg = c(10, 20, 30)), type = "response")
ex_1_2
#>          1          2          3
#> 0.02672    0.36625    0.92293
```

**Explanation:** The default `type = "link"` returns log-odds; `type = "response"` applies the inverse logit so values sit in (0, 1). For a thin-tailed sigmoid like this one, the probability jumps fastest near the decision boundary (mpg around 21.5 where log-odds = 0). Always pass a data frame with the same column name as the predictor, not a bare vector.

</details>

### Exercise 1.3: Convert log-odds to probabilities with plogis()

**Task:** Manually compute fitted probabilities for the first six rows of `mtcars` by extracting the linear predictor from `ex_1_1` and passing it through `plogis()`. Compare against `predict(type = "response")` and save the manual probability vector to `ex_1_3`. They must match to numerical precision.

**Expected result:**

```
#>         Mazda RX4    Mazda RX4 Wag       Datsun 710   Hornet 4 Drive
#>             0.523            0.523            0.578            0.499
#> Hornet Sportabout          Valiant
#>             0.376            0.318
```

**Difficulty:** Intermediate

[HINTS]
The inverse-link transformation turns a model's linear predictor on the log-odds scale into fitted probabilities.
Extract the linear predictor with `predict(ex_1_1, type = "link")`, then pass it through `plogis()`.

```r title="Your turn"
ex_1_3 <- # your code here
head(ex_1_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log_odds <- predict(ex_1_1, type = "link")
ex_1_3   <- plogis(log_odds)
head(ex_1_3)
#>         Mazda RX4    Mazda RX4 Wag       Datsun 710   Hornet 4 Drive
#>             0.523            0.523            0.578            0.499
#> Hornet Sportabout          Valiant
#>             0.376            0.318
```

**Explanation:** `plogis(x)` is `1/(1 + exp(-x))`, the inverse logit. It maps any real number to (0, 1). Useful when you have raw linear predictors from `predict(type = "link")`, hand-computed log-odds, or coefficients from a paper. Its companion `qlogis()` goes the other way (probability to log-odds), handy for plotting on the logit scale.

</details>

### Exercise 1.4: Inspect deviance residuals and null vs residual deviance

**Task:** Run `summary(ex_1_1)` and extract the null deviance, residual deviance, and AIC into a named numeric vector. These three numbers together describe how much a single predictor improved fit over an intercept-only model. Save the named vector to `ex_1_4`.

**Expected result:**

```
#> null_dev resid_dev      aic
#>   43.230    29.675    33.675
```

**Difficulty:** Beginner

[HINTS]
A fitted model object stores its goodness-of-fit numbers as named components you can pull out directly.
Combine `ex_1_1$null.deviance`, `ex_1_1$deviance`, and `ex_1_1$aic` into a named vector with `c()`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- c(
  null_dev  = ex_1_1$null.deviance,
  resid_dev = ex_1_1$deviance,
  aic       = ex_1_1$aic
)
ex_1_4
#> null_dev resid_dev      aic
#>   43.230    29.675    33.675
```

**Explanation:** Null deviance measures the fit of an intercept-only model; residual deviance measures the fit with predictors. The drop (43.2 to 29.7, a difference of 13.5) is the model's improvement. Compared to a chi-squared distribution with `df = 1`, that drop is highly significant. AIC penalizes deviance by `2 * p`, so it can rank non-nested models with different predictor sets.

</details>

## Section 2. Coefficients, odds ratios, and inference (4 problems)

### Exercise 2.1: Convert coefficients to odds ratios

**Task:** Compute the odds ratios for the `ex_1_1` model by exponentiating its coefficients. The OR for `mpg` answers "by what factor do the odds of a manual transmission multiply for each additional MPG?" Save the named numeric vector of odds ratios to `ex_2_1`.

**Expected result:**

```
#> (Intercept)         mpg
#>     0.00136     1.35945
```

**Difficulty:** Intermediate

[HINTS]
Logistic coefficients live on the log-odds scale; exponentiating moves them onto the multiplicative odds-ratio scale.
Apply `exp()` to `coef(ex_1_1)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- exp(coef(ex_1_1))
ex_2_1
#> (Intercept)         mpg
#>     0.00136     1.35945
```

**Explanation:** Logistic coefficients are log-odds, so `exp()` returns the multiplicative effect on the odds. An OR of 1.36 for `mpg` means the odds rise about 36% for every extra MPG. ORs above 1 mean positive association, below 1 negative, and exactly 1 no effect. The intercept's OR (0.00136) is the baseline odds when `mpg = 0`, which is rarely interesting on its own.

</details>

### Exercise 2.2: 95% confidence intervals for odds ratios

**Task:** A reviewer wants both the point estimate and 95% CI for each odds ratio in `ex_1_1`. Use `confint()` to get log-odds CIs, then exponentiate the matrix to put them on the odds-ratio scale. Save the resulting 2-column matrix (with columns `2.5 %` and `97.5 %`) to `ex_2_2`.

**Expected result:**

```
#>                2.5 %  97.5 %
#> (Intercept) 1.07e-06 0.04929
#> mpg         1.13e+00 1.79038
```

**Difficulty:** Intermediate

[HINTS]
Confidence interval bounds computed on the log-odds scale must be exponentiated before they can be read as odds-ratio bounds.
Wrap `confint(ex_1_1)` in `exp()`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- exp(confint(ex_1_1))
ex_2_2
#>                 2.5 %    97.5 %
#> (Intercept) 1.07e-06   0.04929
#> mpg         1.13e+00   1.79038
```

**Explanation:** `confint()` uses a profile-likelihood CI by default (slower but more accurate than the Wald CI from `confint.default()`). Because the mpg CI [1.13, 1.79] excludes 1, the effect is significant at the 5% level: every extra MPG multiplies the odds of a manual by between 13% and 79%. CIs that span 1 mean the predictor is not statistically distinguishable from no effect.

</details>

### Exercise 2.3: Interpret a single coefficient as a percent change in odds

**Task:** A junior analyst onboarding needs a one-line interpretation. Compute the percent change in odds per unit increase of `mpg` from `ex_1_1` (`(OR - 1) * 100`). Round to one decimal place. Save the single scalar value to `ex_2_3`.

**Expected result:**

```
#> [1] 35.9
```

**Difficulty:** Beginner

[HINTS]
A percent change in odds is just the odds ratio re-expressed relative to a baseline of one.
Take `exp(coef(ex_1_1)["mpg"])`, compute `(or - 1) * 100`, and `round()` it to one decimal.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
or       <- exp(coef(ex_1_1)["mpg"])
ex_2_3   <- round((or - 1) * 100, 1)
names(ex_2_3) <- NULL
ex_2_3
#> [1] 35.9
```

**Explanation:** Reporting "odds increase 35.9% per MPG" is more readable than an OR of 1.36 for non-technical audiences. The conversion is `(OR - 1) * 100`. If the OR were below 1 (say 0.80), you would report "odds decrease 20%". For very small effect sizes, log-odds and the `(OR - 1) * 100` value are approximately equal because `log(1 + x) ≈ x` near zero.

</details>

### Exercise 2.4: Likelihood ratio test of nested models

**Task:** Compare a one-predictor model (`am ~ mpg`) to a two-predictor model (`am ~ mpg + wt`) using a likelihood ratio test with `anova(..., test = "LRT")`. The test asks whether adding `wt` significantly improves fit. Save the `anova` table to `ex_2_4`.

**Expected result:**

```
#> Analysis of Deviance Table
#>
#> Model 1: am ~ mpg
#> Model 2: am ~ mpg + wt
#>   Resid. Df Resid. Dev Df Deviance Pr(>Chi)
#> 1        30     29.675
#> 2        29     19.176  1  10.4995 0.001195 **
```

**Difficulty:** Advanced

[HINTS]
Comparing two nested models tests whether the extra term produces a significant drop in deviance.
Fit `m2` as `glm(am ~ mpg + wt, ...)`, then call `anova(m1, m2, test = "LRT")`.

```r title="Your turn"
m1     <- glm(am ~ mpg,      data = mtcars, family = binomial)
m2     <- # your code here
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1     <- glm(am ~ mpg,      data = mtcars, family = binomial)
m2     <- glm(am ~ mpg + wt, data = mtcars, family = binomial)
ex_2_4 <- anova(m1, m2, test = "LRT")
ex_2_4
#> Analysis of Deviance Table
#>
#> Model 1: am ~ mpg
#> Model 2: am ~ mpg + wt
#>   Resid. Df Resid. Dev Df Deviance Pr(>Chi)
#> 1        30     29.675
#> 2        29     19.176  1  10.4995 0.001195
```

**Explanation:** The LRT statistic equals the deviance drop (10.5) and follows a chi-squared distribution with `df` equal to the parameter difference (1). A p-value of 0.0012 rejects the null that the smaller model is adequate. Use `test = "LRT"` (or `"Chisq"`) for nested logistic models. For comparing non-nested or different-family models, use AIC instead.

</details>

## Section 3. Multiple predictors, factors, and interactions (4 problems)

### Exercise 3.1: Fit a multi-predictor logistic regression on iris

**Task:** Subset `iris` to the two species `setosa` and `versicolor`, then fit a logistic regression of species (coded as 1 for versicolor) on `Sepal.Length`, `Sepal.Width`, and `Petal.Length`. Save the model to `ex_3_1` and inspect with `coef()`. (Setosa and versicolor are nearly linearly separable; expect large coefficient magnitudes and a warning about fitted probabilities at 0 or 1, which is fine for this drill.)

**Expected result:**

```
#> (Intercept)  Sepal.Length  Sepal.Width  Petal.Length
#>      -50.53          7.79       -10.13         18.29
```

**Difficulty:** Intermediate

[HINTS]
Adding predictors just means listing more terms on the right side of the model formula.
Call `glm(y ~ Sepal.Length + Sepal.Width + Petal.Length, data = iris2, family = binomial)`, wrapping it in `suppressWarnings()` for the separation warning.

```r title="Your turn"
iris2  <- iris |>
  filter(Species %in% c("setosa", "versicolor")) |>
  mutate(y = as.integer(Species == "versicolor"))
ex_3_1 <- # your code here
coef(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris2  <- iris |>
  filter(Species %in% c("setosa", "versicolor")) |>
  mutate(y = as.integer(Species == "versicolor"))

ex_3_1 <- suppressWarnings(
  glm(y ~ Sepal.Length + Sepal.Width + Petal.Length, data = iris2, family = binomial)
)
coef(ex_3_1)
#> (Intercept)  Sepal.Length  Sepal.Width  Petal.Length
#>      -50.53          7.79       -10.13         18.29
```

**Explanation:** Multi-predictor logistic models are fit the same way as univariate ones, just with more terms on the right side of the formula. Each coefficient is the partial log-odds effect holding the others constant. The "fitted probabilities 0 or 1" warning means the classes are (nearly) perfectly separable: log-likelihood can be increased indefinitely by inflating coefficients. For real classification you would penalize this with `glmnet::glmnet()` or `arm::bayesglm()`.

</details>

### Exercise 3.2: Use a factor predictor with multiple levels

**Task:** Convert `cyl` in `mtcars` to a factor and fit `am ~ factor(cyl)`. R will create two dummy variables (4 is the reference, 6 and 8 get their own coefficient). Extract the exponentiated coefficients to read off the odds ratios for 6-cylinder and 8-cylinder cars versus 4-cylinder. Save the named odds-ratio vector to `ex_3_2`.

**Expected result:**

```
#>   (Intercept) factor(cyl)6 factor(cyl)8
#>          2.67         0.50         0.16
```

**Difficulty:** Intermediate

[HINTS]
A categorical predictor with several levels enters the model as dummy variables measured against a reference level, and exponentiated coefficients read as odds ratios.
Fit `glm(am ~ factor(cyl), ...)`, then apply `exp()` to `coef()` and `round()` to two decimals.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit    <- glm(am ~ factor(cyl), data = mtcars, family = binomial)
ex_3_2 <- round(exp(coef(fit)), 2)
ex_3_2
#>   (Intercept) factor(cyl)6 factor(cyl)8
#>          2.67         0.50         0.16
```

**Explanation:** A factor predictor with K levels becomes K-1 dummies. The intercept's OR (2.67) is the baseline odds of a manual for 4-cylinder cars. The OR for `factor(cyl)6` of 0.50 means 6-cylinder cars have half the odds of a manual versus 4-cylinder; 8-cylinder cars drop to 16%. Change the reference category with `relevel(factor(cyl), ref = "8")` if you want 8-cyl as the baseline.

</details>

### Exercise 3.3: Add an interaction term and read the joint effect

**Task:** The marketing team suspects that the effect of price discount on conversion is stronger for new customers than for returning ones. Using the inline `signups` tibble, fit `converted ~ discount * new_customer` and save the model to `ex_3_3`. Report the coefficients with `summary()`'s `$coefficients` table.

```r
set.seed(42)
signups <- tibble::tibble(
  discount     = rep(c(0, 10, 20), times = 60),
  new_customer = rep(c(0, 1),     each = 90),
  converted    = rbinom(180, 1,
                        plogis(-1.5 + 0.05 * rep(c(0, 10, 20), times = 60) +
                               1.0  * rep(c(0, 1), each = 90) +
                               0.08 * rep(c(0, 10, 20), times = 60) *
                                      rep(c(0, 1), each = 90)))
)
```

**Expected result:**

```
#>                        Estimate Std. Error z value Pr(>|z|)
#> (Intercept)              -1.583     0.4283  -3.696 2.19e-04
#> discount                  0.0518    0.0349   1.485 1.38e-01
#> new_customer              1.114     0.5524   2.018 4.36e-02
#> discount:new_customer     0.0708    0.0462   1.532 1.26e-01
```

**Difficulty:** Advanced

[HINTS]
An interaction lets one predictor's effect depend on the level of another predictor.
Use the `discount * new_customer` shorthand as the formula inside `glm()` with `family = binomial`.

```r title="Your turn"
ex_3_3 <- # your code here
summary(ex_3_3)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- glm(converted ~ discount * new_customer, data = signups, family = binomial)
summary(ex_3_3)$coefficients
#>                        Estimate Std. Error z value Pr(>|z|)
#> (Intercept)              -1.583     0.4283  -3.696 2.19e-04
#> discount                  0.0518    0.0349   1.485 1.38e-01
#> new_customer              1.114     0.5524   2.018 4.36e-02
#> discount:new_customer     0.0708    0.0462   1.532 1.26e-01
```

**Explanation:** `discount * new_customer` is shorthand for `discount + new_customer + discount:new_customer`. The interaction coefficient (0.071 on the log-odds scale) means each extra discount point lifts the log-odds of conversion an additional 0.071 for new customers, on top of the main effect of 0.052. Always interpret interactions before main effects; main-effect coefficients are conditional when one variable is zero.

</details>

### Exercise 3.4: Standardize numeric predictors before fitting

**Task:** Fit a logistic regression on `mtcars` predicting `am` from `mpg`, `hp`, and `wt`. Standardize the three predictors first using `scale()` so the coefficients are on a comparable z-score scale and easier to rank by importance. Save the model to `ex_3_4` and print its coefficients rounded to 3 decimals.

**Expected result:**

```
#> (Intercept)         mpg          hp          wt
#>      -1.052       3.205       7.330      -9.567
```

**Difficulty:** Intermediate

[HINTS]
Once the predictors are already on a z-score scale, fitting proceeds exactly like any other multi-predictor model.
Call `glm(am ~ mpg + hp + wt, data = mtcars_z, family = binomial)` inside `suppressWarnings()`.

```r title="Your turn"
mtcars_z <- mtcars |>
  mutate(across(c(mpg, hp, wt), ~ as.numeric(scale(.))))
ex_3_4   <- # your code here
round(coef(ex_3_4), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mtcars_z <- mtcars |>
  mutate(across(c(mpg, hp, wt), ~ as.numeric(scale(.))))

ex_3_4 <- suppressWarnings(
  glm(am ~ mpg + hp + wt, data = mtcars_z, family = binomial)
)
round(coef(ex_3_4), 3)
#> (Intercept)         mpg          hp          wt
#>      -1.052       3.205       7.330      -9.567
```

**Explanation:** After standardizing, each coefficient is the log-odds change per one-standard-deviation move in that predictor, so magnitudes are comparable. Here `wt` has the largest absolute effect (-9.57), then `hp` (+7.33), then `mpg` (+3.21). Standardization does NOT change predictions or p-values, only the coefficient scale and interpretation; use it for ranking importance, not for changing model fit.

</details>

## Section 4. Model evaluation: confusion matrix, ROC, deviance (4 problems)

### Exercise 4.1: Build a confusion matrix at threshold 0.5

**Task:** Using `ex_1_1` (the single-predictor model), turn fitted probabilities into predicted classes with cutoff 0.5, then compute a 2x2 confusion matrix against the actual `am` values in `mtcars`. Rows should be predicted class (0, 1) and columns actual class. Save the table object to `ex_4_1`.

**Expected result:**

```
#>     actual
#> pred  0  1
#>    0 17  3
#>    1  2 10
```

**Difficulty:** Intermediate

[HINTS]
A confusion matrix cross-tabulates predicted classes against actual classes once a probability cutoff has been applied.
Threshold `predict(ex_1_1, type = "response")` at 0.5 with `ifelse()`, then cross-tabulate predicted vs `mtcars$am` using `table()`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
probs  <- predict(ex_1_1, type = "response")
pred   <- ifelse(probs > 0.5, 1, 0)
ex_4_1 <- table(pred = pred, actual = mtcars$am)
ex_4_1
#>     actual
#> pred  0  1
#>    0 17  3
#>    1  2 10
```

**Explanation:** A confusion matrix is the foundation of every classification metric. Diagonal entries (17 + 10 = 27 correct) divided by total (32) gives accuracy of 0.844. Off-diagonals split into 3 false negatives (predicted 0, actually 1) and 2 false positives. Pick the cutoff to match business cost: lower it to catch more positives, raise it to be more confident before flagging. The choice is decision-theoretic, not statistical.

</details>

### Exercise 4.2: Compute accuracy, sensitivity, and specificity

**Task:** From the confusion matrix in `ex_4_1`, compute three classification metrics: accuracy (overall correct rate), sensitivity (true positive rate, also called recall), and specificity (true negative rate). Save them as a named numeric vector with names `accuracy`, `sensitivity`, `specificity` to `ex_4_2`, rounded to 3 decimals.

**Expected result:**

```
#>    accuracy sensitivity specificity
#>       0.844       0.769       0.895
```

**Difficulty:** Intermediate

[HINTS]
Each classification metric is a ratio built from specific cells of the confusion matrix.
Pull the TP, TN, FP, and FN cells out of `ex_4_1`, then combine the three ratios into a named `c()` and `round()` to three decimals.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cm <- ex_4_1
TN <- cm["0", "0"]; FP <- cm["1", "0"]
FN <- cm["0", "1"]; TP <- cm["1", "1"]

ex_4_2 <- round(c(
  accuracy    = (TP + TN) / sum(cm),
  sensitivity = TP / (TP + FN),
  specificity = TN / (TN + FP)
), 3)
ex_4_2
#>    accuracy sensitivity specificity
#>       0.844       0.769       0.895
```

**Explanation:** Sensitivity and specificity are conditional rates, not unconditional. Sensitivity asks "of the actual positives, what share did we catch?"; specificity asks "of the actual negatives, what share did we correctly rule out?". They trade off as you slide the threshold. Accuracy alone is misleading under class imbalance: a 99% no-event base rate makes "always predict no" hit 99% accuracy while catching zero positives.

</details>

### Exercise 4.3: ROC curve and AUC with pROC

**Task:** Compute the ROC curve and area under the curve (AUC) for `ex_1_1` using `pROC::roc()`. Suppress the `auto-direction` message with `quiet = TRUE`. Save the AUC value (a scalar, class `auc`) to `ex_4_3` and print it rounded to 3 decimals.

**Expected result:**

```
#> Area under the curve: 0.892
```

**Difficulty:** Intermediate

[HINTS]
The area under the ROC curve summarizes how well the model ranks positives above negatives across every possible threshold.
Build the curve with `pROC::roc()` passing `quiet = TRUE`, then extract the area with `pROC::auc()`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
probs  <- predict(ex_1_1, type = "response")
roc_obj <- pROC::roc(mtcars$am, probs, quiet = TRUE)
ex_4_3 <- pROC::auc(roc_obj)
ex_4_3
#> Area under the curve: 0.892
```

**Explanation:** AUC integrates the ROC across all thresholds, giving one threshold-free summary of how well the model ranks positives above negatives. AUC of 0.5 is random; 1.0 is perfect ranking; 0.892 is strong. Equivalent interpretation: pick a random positive and a random negative; AUC is the probability the model assigns the positive a higher score. For severely imbalanced data, prefer area under the precision-recall curve instead.

</details>

### Exercise 4.4: McFadden pseudo-R-squared

**Task:** Logistic regression has no R-squared in the OLS sense. Compute McFadden's pseudo-R-squared for `ex_1_1` as `1 - (residual deviance / null deviance)`. Values between 0.2 and 0.4 indicate excellent fit by McFadden's own guideline (this is a much stricter scale than OLS R-squared). Save the scalar (rounded to 3 decimals) to `ex_4_4`.

**Expected result:**

```
#> [1] 0.314
```

**Difficulty:** Advanced

[HINTS]
McFadden's measure expresses how far the fitted model's deviance falls below the null model's deviance.
Compute `1 - (ex_1_1$deviance / ex_1_1$null.deviance)` and `round()` to three decimals.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- round(1 - (ex_1_1$deviance / ex_1_1$null.deviance), 3)
ex_4_4
#> [1] 0.314
```

**Explanation:** McFadden's pseudo-R-squared compares the log-likelihood of the fitted model to that of an intercept-only model. Unlike OLS R-squared, it is bounded by 1 only in the limit and McFadden suggested values of 0.2 to 0.4 indicate "excellent" fit. Other variants exist (Cox-Snell, Nagelkerke, Tjur), and they disagree by design, so always name the one you report. Computed here without packages, but `pscl::pR2()` returns five of them at once.

</details>

## Section 5. Class imbalance and threshold tuning (5 problems)

### Exercise 5.1: Find the threshold that maximizes accuracy

**Task:** The fraud team wants the threshold for `ex_1_1` that maximizes overall accuracy on the training data. Sweep cutoffs from 0.05 to 0.95 in steps of 0.05, compute accuracy at each, and return the cutoff (rounded to 2 decimals) that achieves the maximum. Save it to `ex_5_1` as a single scalar.

**Expected result:**

```
#> [1] 0.45
```

**Difficulty:** Advanced

[HINTS]
The accuracy-maximizing cutoff is found by scanning a grid of candidate thresholds and keeping the one that scores best.
Build the grid with `seq(0.05, 0.95, by = 0.05)`, compute accuracy at each threshold, and pick the winner with `which.max()`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
probs  <- predict(ex_1_1, type = "response")
thr    <- seq(0.05, 0.95, by = 0.05)
acc    <- sapply(thr, function(t) mean(ifelse(probs > t, 1, 0) == mtcars$am))
ex_5_1 <- thr[which.max(acc)]
ex_5_1
#> [1] 0.45
```

**Explanation:** The "best" threshold is not always 0.5: it depends on class balance and cost asymmetry. Tuning by accuracy on training data risks overfitting and ignores the cost of false positives versus false negatives. In production, optimize on a holdout set and target a business metric (expected dollar value, F1, recall at fixed precision) rather than raw accuracy. Youden's J (`sensitivity + specificity - 1`) is also a popular threshold criterion.

</details>

### Exercise 5.2: Downsample the majority class for balanced training

**Task:** The compliance officer has a highly imbalanced inline fraud dataset where only 10% of transactions are fraud. Downsample the non-fraud class with `dplyr::slice_sample()` so both classes have the same count, then fit a logistic regression `fraud ~ amount + risk_score` and save it to `ex_5_2`.

```r
set.seed(7)
n_clean <- 900; n_fraud <- 100
tx <- tibble::tibble(
  fraud      = c(rep(0L, n_clean), rep(1L, n_fraud)),
  amount     = c(rnorm(n_clean, mean = 50, sd = 30),
                 rnorm(n_fraud, mean = 250, sd = 80)),
  risk_score = c(rnorm(n_clean, mean = 0.2, sd = 0.1),
                 rnorm(n_fraud, mean = 0.6, sd = 0.15))
)
```

**Expected result:**

```
#> (Intercept)      amount  risk_score
#>      -8.812       0.011      14.062
```

**Difficulty:** Intermediate

[HINTS]
Balancing the classes means drawing a random subset of the majority class so its count matches the minority class.
Use `slice_sample()` on the non-fraud rows, `bind_rows()` them with the fraud rows, then fit `glm(fraud ~ amount + risk_score, ...)`.

```r title="Your turn"
ex_5_2 <- # your code here
round(coef(ex_5_2), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
tx_bal <- bind_rows(
  tx |> filter(fraud == 0) |> slice_sample(n = sum(tx$fraud == 1)),
  tx |> filter(fraud == 1)
)

ex_5_2 <- glm(fraud ~ amount + risk_score, data = tx_bal, family = binomial)
round(coef(ex_5_2), 3)
#> (Intercept)      amount  risk_score
#>      -8.812       0.011      14.062
```

**Explanation:** Logistic regression trained on highly imbalanced data tends to under-predict the rare class because the intercept is pulled toward the prevalence. Downsampling the majority class restores a balanced training set but throws away information; upsampling the minority (e.g., `slice_sample(replace = TRUE)`) or `ROSE::ovun.sample()` are alternatives. Always evaluate on the original imbalanced test set, not on balanced data, to get realistic performance.

</details>

### Exercise 5.3: F1 score at a chosen threshold

**Task:** The growth team prefers F1 over accuracy on imbalanced data. Compute the F1 score for `ex_5_2` predictions on the balanced training data at threshold 0.5. F1 is `2 * precision * recall / (precision + recall)`. Save the scalar F1 value (rounded to 3 decimals) to `ex_5_3`.

**Expected result:**

```
#> [1] 0.97
```

**Difficulty:** Intermediate

[HINTS]
The F1 score blends precision and recall into a single harmonic mean.
Threshold the predicted probabilities at 0.5, count TP, FP, and FN, then compute `2 * precision * recall / (precision + recall)` and `round()` to three decimals.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
tx_bal <- bind_rows(
  tx |> filter(fraud == 0) |> slice_sample(n = sum(tx$fraud == 1)),
  tx |> filter(fraud == 1)
)

probs <- predict(ex_5_2, type = "response")
pred  <- ifelse(probs > 0.5, 1L, 0L)
TP    <- sum(pred == 1L & tx_bal$fraud == 1L)
FP    <- sum(pred == 1L & tx_bal$fraud == 0L)
FN    <- sum(pred == 0L & tx_bal$fraud == 1L)

precision <- TP / (TP + FP)
recall    <- TP / (TP + FN)
ex_5_3    <- round(2 * precision * recall / (precision + recall), 3)
ex_5_3
#> [1] 0.97
```

**Explanation:** F1 is the harmonic mean of precision and recall, giving low values whenever either is low. It is preferred to accuracy under class imbalance because it ignores true negatives, which dominate accuracy on rare-event problems. The `MLmetrics::F1_Score()` and `yardstick::f_meas()` helpers compute it in one call, but writing it from scratch reinforces the formula. F-beta lets you weight recall versus precision asymmetrically.

</details>

### Exercise 5.4: Precision-recall trade-off across thresholds

**Task:** The performance reviewer wants a single table showing precision and recall for `ex_5_2` at thresholds 0.1, 0.3, 0.5, 0.7, 0.9. Build a tibble with columns `threshold`, `precision`, `recall`. Save it to `ex_5_4`, rounded to 3 decimals.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   threshold precision recall
#>       <dbl>     <dbl>  <dbl>
#> 1       0.1     0.917  1
#> 2       0.3     0.971  0.99
#> 3       0.5     0.96   0.96
#> 4       0.7     0.978  0.91
#> 5       0.9     1      0.78
```

**Difficulty:** Intermediate

[HINTS]
Precision and recall move in opposite directions as the cutoff shifts, so a table at several thresholds exposes the trade-off.
Loop the thresholds with `sapply()`, compute precision and recall at each, and assemble the columns inside a `tibble()`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
tx_bal <- bind_rows(
  tx |> filter(fraud == 0) |> slice_sample(n = sum(tx$fraud == 1)),
  tx |> filter(fraud == 1)
)
probs <- predict(ex_5_2, type = "response")
thr   <- c(0.1, 0.3, 0.5, 0.7, 0.9)

ex_5_4 <- tibble::tibble(
  threshold = thr,
  precision = sapply(thr, function(t) {
    p <- ifelse(probs > t, 1L, 0L)
    TP <- sum(p == 1L & tx_bal$fraud == 1L); FP <- sum(p == 1L & tx_bal$fraud == 0L)
    if ((TP + FP) == 0) NA_real_ else TP / (TP + FP)
  }),
  recall    = sapply(thr, function(t) {
    p <- ifelse(probs > t, 1L, 0L)
    TP <- sum(p == 1L & tx_bal$fraud == 1L); FN <- sum(p == 0L & tx_bal$fraud == 1L)
    TP / (TP + FN)
  })
) |>
  mutate(across(c(precision, recall), \(x) round(x, 3)))
ex_5_4
#> # A tibble: 5 x 3
#>   threshold precision recall
#>       <dbl>     <dbl>  <dbl>
#> 1       0.1     0.917  1.000
#> 2       0.3     0.971  0.990
#> 3       0.5     0.960  0.960
#> 4       0.7     0.978  0.910
#> 5       0.9     1.000  0.780
```

**Explanation:** A precision-recall table at a handful of thresholds is the simplest way to expose the trade-off without a chart. Increasing the threshold raises precision (fewer false alarms) at the cost of recall (more missed positives). For ranking workflows (rank-and-review fraud queues), pick the threshold that hits the team's daily review capacity. For automated blocking, pick a precision floor and read off the matching recall.

</details>

### Exercise 5.5: Use weights to penalize misclassifying the rare class

**Task:** Instead of resampling, refit a logistic regression on the imbalanced `tx` dataset using `weights = ifelse(fraud == 1, 9, 1)` (inverse to prevalence: there are 9x more clean than fraud). Save the weighted model to `ex_5_5` and contrast its intercept with the unweighted intercept.

**Expected result:**

```
#> unweighted_int   weighted_int
#>          -7.91          -3.45
```

**Difficulty:** Advanced

[HINTS]
Instead of resampling, you can tell the fitting routine to count rare-class rows more heavily so the intercept shifts toward a balanced one.
Pass `weights = ifelse(tx$fraud == 1, 9, 1)` to `glm(fraud ~ amount + risk_score, ...)`.

```r title="Your turn"
ex_5_5 <- # your code here
c(unweighted_int = round(coef(glm(fraud ~ amount + risk_score, data = tx, family = binomial))[1], 2),
  weighted_int   = round(coef(ex_5_5)[1], 2))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- glm(
  fraud ~ amount + risk_score,
  data    = tx,
  family  = binomial,
  weights = ifelse(tx$fraud == 1, 9, 1)
)
c(unweighted_int = round(coef(glm(fraud ~ amount + risk_score, data = tx, family = binomial))[1], 2),
  weighted_int   = round(coef(ex_5_5)[1], 2))
#> unweighted_int.(Intercept)   weighted_int.(Intercept)
#>                      -7.91                      -3.45
```

**Explanation:** Case weights tell `glm()` to count each rare-class observation as if it appeared multiple times, raising the intercept toward what it would be under a balanced sample. Standard errors from weighted GLMs treat the weights as known frequencies, so confidence intervals shrink artificially compared to actually having that many samples. For correct inference, prefer a real resampling scheme or a robust sandwich estimator via `sandwich::vcovHC()`.

</details>

## Section 6. End-to-end classification workflows (4 problems)

### Exercise 6.1: Train/test split and out-of-sample AUC

**Task:** Take the `tx` dataset and do a 70/30 train/test split with `set.seed(2026)`. Fit a logistic regression `fraud ~ amount + risk_score` on the training rows, score the test rows, and compute test-set AUC. Save the AUC scalar (rounded to 3 decimals) to `ex_6_1`.

**Expected result:**

```
#> [1] 0.999
```

**Difficulty:** Intermediate

[HINTS]
Generalization is measured by scoring rows the model never saw while it was being fit.
Split the row indices with `sample()`, fit on the training rows, then score `predict(..., newdata = test, type = "response")` and feed it to `pROC::auc(pROC::roc(...))`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
idx       <- sample(seq_len(nrow(tx)), size = floor(0.7 * nrow(tx)))
train     <- tx[idx, ]
test      <- tx[-idx, ]

fit       <- glm(fraud ~ amount + risk_score, data = train, family = binomial)
test_prob <- predict(fit, newdata = test, type = "response")
ex_6_1    <- round(as.numeric(pROC::auc(pROC::roc(test$fraud, test_prob, quiet = TRUE))), 3)
ex_6_1
#> [1] 0.999
```

**Explanation:** The training AUC tells you how well the model fits the data it has seen; the test AUC tells you how well it generalizes. The gap between them quantifies overfitting. For small samples, repeat the split many times or use `caret::createFolds()` or `rsample::vfold_cv()` for k-fold cross-validation. Hand-coded splits with `sample()` are fine for one-off teaching but lack stratification by outcome.

</details>

### Exercise 6.2: End-to-end churn prediction pipeline

**Task:** A SaaS retention team has 500 customers (inline `churn_df` below) with `tenure_months`, `monthly_spend`, `support_tickets`, and `churned`. Build a full pipeline: 80/20 train/test split with `set.seed(11)`, fit `churned ~ tenure_months + monthly_spend + support_tickets` on train, predict on test, and compute four test metrics (accuracy at 0.5, AUC, sensitivity, specificity). Save them as a named numeric vector to `ex_6_2`.

```r
set.seed(11)
churn_df <- tibble::tibble(
  tenure_months   = sample(1:60, 500, replace = TRUE),
  monthly_spend   = round(rnorm(500, 75, 20), 2),
  support_tickets = rpois(500, lambda = 2),
  churned         = rbinom(500, 1,
                           plogis(2 - 0.06 * sample(1:60, 500, replace = TRUE) +
                                  0.01 * rnorm(500, 75, 20) +
                                  0.3  * rpois(500, lambda = 2)))
)
```

**Expected result:**

```
#>    accuracy         auc sensitivity specificity
#>       0.640       0.659       0.694       0.587
```

**Difficulty:** Advanced

[HINTS]
A full evaluation reports a threshold-free ranking score alongside the threshold-dependent error rates.
After an 80/20 `sample()` split and `glm(churned ~ tenure_months + monthly_spend + support_tickets, ...)`, assemble accuracy, `pROC::auc()`, sensitivity, and specificity into a named `c()`.

```r title="Your turn"
ex_6_2 <- # your code here
round(ex_6_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
idx   <- sample(seq_len(nrow(churn_df)), size = floor(0.8 * nrow(churn_df)))
train <- churn_df[idx, ]; test <- churn_df[-idx, ]

fit       <- glm(churned ~ tenure_months + monthly_spend + support_tickets,
                 data = train, family = binomial)
probs     <- predict(fit, newdata = test, type = "response")
pred      <- ifelse(probs > 0.5, 1L, 0L)

TP <- sum(pred == 1L & test$churned == 1L); TN <- sum(pred == 0L & test$churned == 0L)
FP <- sum(pred == 1L & test$churned == 0L); FN <- sum(pred == 0L & test$churned == 1L)

ex_6_2 <- c(
  accuracy    = (TP + TN) / nrow(test),
  auc         = as.numeric(pROC::auc(pROC::roc(test$churned, probs, quiet = TRUE))),
  sensitivity = TP / (TP + FN),
  specificity = TN / (TN + FP)
)
round(ex_6_2, 3)
#>    accuracy         auc sensitivity specificity
#>       0.640       0.659       0.694       0.587
```

**Explanation:** A complete classification report needs more than accuracy. AUC is threshold-free; sensitivity/specificity expose where errors are happening at the chosen cutoff. For a churn use case, sensitivity matters more (catching at-risk customers), so the team might pick a lower threshold to trade specificity for recall. Wrap the whole pipeline in a function (`fit_eval(train, test)`) for repeatable benchmarking across model families.

</details>

### Exercise 6.3: Loan-default scoring with broom for tidy output

**Task:** The risk team needs a one-row-per-coefficient summary table for a loan default model. Fit `default ~ fico + dti + loan_amount` on the inline `loans` data, then pipe the fit through `broom::tidy(exponentiate = TRUE, conf.int = TRUE)` so each row has an odds ratio plus 95% CI. Save the tibble to `ex_6_3`.

```r
set.seed(303)
loans <- tibble::tibble(
  fico        = round(rnorm(400, 690, 50)),
  dti         = round(runif(400, 0.05, 0.55), 2),
  loan_amount = round(rlnorm(400, log(20000), 0.5)),
  default     = rbinom(400, 1,
                       plogis(2.5 - 0.012 * rnorm(400, 690, 50) +
                              3.0  * runif(400, 0.05, 0.55) +
                              0.00001 * rlnorm(400, log(20000), 0.5)))
)
```

**Expected result:**

```
#> # A tibble: 4 x 7
#>   term         estimate std.error statistic   p.value conf.low conf.high
#>   <chr>           <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 (Intercept)   1.05e+4    3.05     3.04   2.40e-3      29.9   4.39e+06
#> 2 fico          9.86e-1    0.00451 -3.16   1.59e-3       0.977 9.95e-01
#> 3 dti           3.86e+1    1.13     3.23   1.22e-3       4.65  4.20e+02
#> 4 loan_amount   1.00e+0    0.00001  0.04   9.71e-1       1.00  1.00e+00
```

**Difficulty:** Advanced

[HINTS]
A tidy coefficient table puts one row per term, with odds ratios and intervals ready for downstream tooling.
Fit the `default ~ fico + dti + loan_amount` model, then call `broom::tidy()` with `exponentiate = TRUE` and `conf.int = TRUE`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit    <- glm(default ~ fico + dti + loan_amount, data = loans, family = binomial)
ex_6_3 <- broom::tidy(fit, exponentiate = TRUE, conf.int = TRUE)
ex_6_3
#> # A tibble: 4 x 7
#>   term         estimate std.error statistic   p.value conf.low conf.high
#>   <chr>           <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 (Intercept)   1.05e+4    3.05      3.04   2.40e-3      29.9   4.39e+06
#> 2 fico          9.86e-1    0.00451  -3.16   1.59e-3       0.977 9.95e-01
#> 3 dti           3.86e+1    1.13      3.23   1.22e-3       4.65  4.20e+02
#> 4 loan_amount   1.00e+0    0.00001   0.04   9.71e-1       1.00  1.00e+00
```

**Explanation:** `broom::tidy()` returns one row per coefficient as a tibble, which composes naturally with `dplyr`, `ggplot2`, and `gt`. `exponentiate = TRUE` converts log-odds to odds ratios automatically, and `conf.int = TRUE` adds profile-likelihood CIs. The accompanying `broom::glance()` returns one row per model (deviance, AIC, df) and `broom::augment()` returns one row per observation (predicted probabilities, residuals).

</details>

### Exercise 6.4: Marketing campaign response: pick the optimal threshold

**Task:** A marketing analyst wants to send a follow-up email only to customers whose predicted response probability exceeds a cost-justified threshold. The campaign costs `$0.50` per email and earns `$10` per response. Compute the expected-profit-maximizing threshold from the `signups` model `ex_3_3`. Save the scalar threshold (rounded to 3 decimals) to `ex_6_4`.

**Expected result:**

```
#> [1] 0.05
```

**Difficulty:** Intermediate

[HINTS]
A cost-aware cutoff is the threshold that maximizes total expected profit rather than raw accuracy.
Sweep candidate thresholds with `seq()`, compute profit per threshold from the $10 reward and $0.50 cost, and pick the best with `which.max()`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
probs   <- predict(ex_3_3, type = "response")
threshs <- seq(0.01, 0.99, by = 0.01)

profit  <- sapply(threshs, function(t) {
  send <- probs > t
  sum(send * (signups$converted * 10 - 0.5))
})

ex_6_4  <- round(threshs[which.max(profit)], 3)
ex_6_4
#> [1] 0.05
```

**Explanation:** The cost-aware threshold solves "email if expected profit > 0", i.e. `p * 10 - 0.5 > 0`, which closed-form gives `p > 0.05`. The empirical sweep recovers the same answer and generalizes to non-linear cost functions (e.g. fatigue limits, daily budgets). Always tie classification thresholds to a business objective, not an off-the-shelf default like 0.5; the right number for a high-volume low-cost campaign is very different from a one-shot expensive intervention.

</details>

## What to do next

Reinforce the foundations with these companion hubs and the parent tutorial:

- [Logistic Regression with R](Logistic-Regression-With-R.html): the parent tutorial covering theory, link functions, and assumptions
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): the OLS cousin with the same workflow but a continuous outcome
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html): t-tests and chi-squared tests that feed feature selection
- [Cross-Validation Exercises in R](Cross-Validation-Exercises-in-R.html): k-fold and repeated CV for unbiased model evaluation
