---
title: "Linear Regression Exercises in R: 50 Real-World Practice Problems"
slug: "Linear-Regression-Exercises-in-R"
description: "Fifty linear regression exercises in R covering fit, diagnostics, transformations, model comparison, and prediction. Hidden solutions, real datasets."
keywords: "linear regression exercises in R, lm exercises R, regression practice problems, R regression diagnostics, predict lm R"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Linear Regression Exercises"
sidebar_order: 105
fr_parent: "Linear-Regression.html"
auto_link_terms: "linear regression exercises|linear regression practice|lm exercises|regression exercises in R|practice linear regression"
auto_link_case_sensitive: false
target_keyword: "linear regression R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Linear Regression Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty scenario-based linear regression problems: light on warm-ups, heavy on intermediate work where you have to fit, diagnose, transform, and compare models the way you would on a real project. Solutions are hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(stats)
library(broom)
library(car)
library(lmtest)
library(MASS)
library(splines)
library(sandwich)
library(boot)
library(ggplot2)
library(dplyr)
library(tibble)
```

## Section 1. Fit and interpret a simple linear model (8 problems)

### Exercise 1.1: Fit mpg as a function of weight on mtcars

**Task:** A used-car reviewer wants to know how strongly fuel economy responds to weight. Fit a simple linear regression of `mpg` on `wt` using the built-in `mtcars` dataset and save the fitted model object to `ex_1_1`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt  
#>      37.285       -5.344
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- lm(mpg ~ wt, data = mtcars)
ex_1_1
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt  
#>      37.285       -5.344
```

**Explanation:** `lm()` takes a formula `response ~ predictor` and a `data` argument. Printing the model object shows the call and the fitted intercept and slope. The slope of about -5.34 means each additional 1000 lb of weight is associated with roughly 5.34 fewer miles per gallon. A common mistake is forgetting `data = mtcars` and then chasing missing-variable errors.

</details>

### Exercise 1.2: Pull the slope and intercept programmatically

**Task:** You want to feed the intercept and slope of an `mpg ~ wt` model into a downstream report. Use `coef()` (or the `$coefficients` slot) to extract them as a named numeric vector and save the vector to `ex_1_2`.

**Expected result:**

```
#> (Intercept)          wt 
#>   37.285126   -5.344472
```

**Difficulty:** Beginner

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_2 <- coef(fit)
ex_1_2
#> (Intercept)          wt 
#>   37.285126   -5.344472
```

**Explanation:** `coef()` is the canonical accessor and returns a named vector you can index by name (`ex_1_2["wt"]`). The slot-access form `fit$coefficients` works too but `coef()` is the generic that also handles `glm()`, `rlm()` and other model objects without changes. Prefer accessors over reaching into the internals.

</details>

### Exercise 1.3: Build a tidy coefficient table with broom

**Task:** A reporting analyst wants the regression coefficients as a clean tibble with one row per term. Fit `mpg ~ wt + hp` on `mtcars` and use `broom::tidy()` to produce the coefficient table; save the tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  37.2       1.60       23.3  2.57e-20
#> 2 wt           -3.88      0.633      -6.13 1.12e- 6
#> 3 hp           -0.0318    0.00903    -3.52 1.45e- 3
```

**Difficulty:** Beginner

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_1_3 <- tidy(fit)
ex_1_3
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  37.2       1.60       23.3  2.57e-20
#> 2 wt           -3.88      0.633      -6.13 1.12e- 6
#> 3 hp           -0.0318    0.00903    -3.52 1.45e- 3
```

**Explanation:** `tidy()` from broom converts the model summary into a tibble that is friendly to `dplyr`, `gt`, `ggplot2`, and downstream pipelines. Add `conf.int = TRUE` to also pull confidence intervals. The same call works on `glm()`, `survreg()`, `lme4` and dozens of other model classes, which is what makes broom worth learning early.

</details>

### Exercise 1.4: Pull R-squared and residual standard error

**Task:** A modelling lead asks for the goodness-of-fit numbers on the `mpg ~ wt` regression. Compute the multiple R-squared and the residual standard error (sigma) and save a named list with both values to `ex_1_4`.

**Expected result:**

```
#> $r_squared
#> [1] 0.7528328
#> 
#> $sigma
#> [1] 3.045882
```

**Difficulty:** Beginner

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
s <- summary(fit)
ex_1_4 <- list(r_squared = s$r.squared, sigma = s$sigma)
ex_1_4
#> $r_squared
#> [1] 0.7528328
#> 
#> $sigma
#> [1] 3.045882
```

**Explanation:** `summary(fit)` returns an object whose `$r.squared`, `$adj.r.squared`, and `$sigma` slots hold the fit statistics. `broom::glance(fit)` returns the same numbers (plus AIC and BIC) as a single-row tibble, which is cleaner when you want to compare models in a `dplyr::bind_rows()` pipeline.

</details>

### Exercise 1.5: Predict mpg for a 3,200 lb car

**Task:** A buyer is eyeing a 3,200 lb sedan and wants a point estimate of fuel economy from the `mpg ~ wt` regression. Use `predict()` with a single-row `newdata` frame (remember `wt` is in 1000s of lb) and save the predicted mpg to `ex_1_5`.

**Expected result:**

```
#>        1 
#> 20.18221
```

**Difficulty:** Beginner

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_5 <- predict(fit, newdata = data.frame(wt = 3.2))
ex_1_5
#>        1 
#> 20.18221
```

**Explanation:** `predict()` for `lm` returns a named numeric vector of fitted means at the supplied `newdata` rows. The column name in `newdata` must match the predictor exactly. Add `interval = "confidence"` to get the uncertainty around the mean response or `interval = "prediction"` for an interval around a future single observation, which is wider because it includes residual noise.

</details>

### Exercise 1.6: Fit a no-intercept (through the origin) model

**Task:** A physicist studying `cars` data assumes braking distance is zero at zero speed and wants a regression that passes through the origin. Fit `dist ~ speed` on the built-in `cars` dataset without an intercept and save the model to `ex_1_6`.

**Expected result:**

```
#> Call:
#> lm(formula = dist ~ speed + 0, data = cars)
#> 
#> Coefficients:
#> speed  
#> 2.909
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- lm(dist ~ speed + 0, data = cars)
ex_1_6
#> Call:
#> lm(formula = dist ~ speed + 0, data = cars)
#> 
#> Coefficients:
#> speed  
#> 2.909
```

**Explanation:** `+ 0` (equivalently `- 1`) tells the formula parser to drop the intercept. Use it only when theory genuinely says the line passes through (0, 0); forcing the intercept to zero artificially inflates R-squared because R uses a different denominator (sum of squared y, not sum of squared deviations from the mean). Always compare against the with-intercept fit before committing.

</details>

### Exercise 1.7: Confirm fitted() and predict() agree in sample

**Task:** A code reviewer wants to make sure the in-sample fitted values from `fitted()` match `predict()` called with no `newdata`. Compute the maximum absolute difference between the two vectors for an `mpg ~ wt` fit and save the scalar to `ex_1_7`.

**Expected result:**

```
#> [1] 0
#> (max absolute difference; values are bitwise identical)
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_7 <- max(abs(fitted(fit) - predict(fit)))
ex_1_7
#> [1] 0
```

**Explanation:** When `predict()` is called with no `newdata`, R reuses the training design matrix, so the two vectors are bitwise identical. The exercise matters because once you pass `newdata`, R rebuilds the model matrix using `model.frame()` rules, which can silently differ if your `newdata` has different factor levels or missing columns. The diff trick is a fast sanity check in production code.

</details>

### Exercise 1.8: Bootstrap a 95% interval for the wt slope

**Task:** A statistician wants a non-parametric confidence interval for the `wt` slope in `mpg ~ wt`. Use `boot::boot()` with 1000 resamples and `boot::boot.ci(type = "perc")` to get the percentile interval; save the named numeric vector `c(lower, upper)` to `ex_1_8`.

**Expected result:**

```
#>     lower     upper 
#> -6.493123 -4.193245
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
boot_slope <- function(data, i) coef(lm(mpg ~ wt, data = data[i, ]))[["wt"]]
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
boot_slope <- function(data, i) coef(lm(mpg ~ wt, data = data[i, ]))[["wt"]]
b <- boot(mtcars, boot_slope, R = 1000)
ci <- boot.ci(b, type = "perc")$percent[4:5]
ex_1_8 <- c(lower = ci[1], upper = ci[2])
ex_1_8
#>     lower     upper 
#> -6.493123 -4.193245
```

**Explanation:** Bootstrapping resamples rows with replacement and refits the model, giving an empirical distribution of the slope. The percentile interval reads the 2.5 and 97.5 quantiles directly. Bootstrap CIs are useful when residuals are non-normal or heteroscedastic, where the textbook `confint()` interval (which assumes normal errors) can mislead. With 32 rows like `mtcars`, results vary across seeds, so always set one.

</details>

## Section 2. Multiple linear regression (8 problems)

### Exercise 2.1: Fit mpg on weight and horsepower together

**Task:** An automotive analyst wants to control for engine power while studying weight's effect on fuel economy. Fit `mpg ~ wt + hp` on `mtcars`, print the model, and save the `lm` object to `ex_2_1`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt           hp  
#>    37.22727     -3.87783     -0.03177
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- lm(mpg ~ wt + hp, data = mtcars)
ex_2_1
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt           hp  
#>    37.22727     -3.87783     -0.03177
```

**Explanation:** Adding `+ hp` partials horsepower out of the `wt` coefficient: with `hp` controlled, the marginal effect of weight drops from -5.34 to -3.88. That is the whole point of multiple regression: each slope is the effect of its predictor holding the others fixed. If `wt` and `hp` are strongly correlated (they are, r = 0.66 in `mtcars`), you will see effects shrink and standard errors grow.

</details>

### Exercise 2.2: Treat cyl as a categorical factor

**Task:** A reviewer argues `cyl` should be a factor, not a numeric, so the slope is not forced linear across 4-, 6-, and 8-cylinder cars. Fit `mpg ~ wt + factor(cyl)` on `mtcars` and save the model to `ex_2_2`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt + factor(cyl), data = mtcars)
#> 
#> Coefficients:
#>  (Intercept)            wt  factor(cyl)6  factor(cyl)8  
#>      33.9908       -3.2056       -4.2556       -6.0709
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- lm(mpg ~ wt + factor(cyl), data = mtcars)
ex_2_2
#> Call:
#> lm(formula = mpg ~ wt + factor(cyl), data = mtcars)
#> 
#> Coefficients:
#>  (Intercept)            wt  factor(cyl)6  factor(cyl)8  
#>      33.9908       -3.2056       -4.2556       -6.0709
```

**Explanation:** `factor()` inside a formula creates dummy variables on the fly. The baseline level (4-cyl, alphabetically first) is absorbed into the intercept; the `cyl6` and `cyl8` coefficients are differences from that baseline. If you forgot `factor()` and kept `cyl` numeric, R would estimate one slope for the 4-6-8 progression, which assumes linearity in cylinder count and is rarely what you want.

</details>

### Exercise 2.3: Fit against all other columns with the dot shortcut

**Task:** A junior analyst wants to throw every column of `mtcars` at `mpg` without typing them out. Use the `mpg ~ .` shortcut to fit a full kitchen-sink model on `mtcars` and save it to `ex_2_3`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ ., data = mtcars)
#> 
#> Coefficients:
#> (Intercept)          cyl         disp           hp         drat           wt  
#>    12.30337     -0.11144      0.01334     -0.02148      0.78711     -3.71530  
#>        qsec           vs           am         gear         carb  
#>     0.82104      0.31776      2.52023      0.65541     -0.19942
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- lm(mpg ~ ., data = mtcars)
ex_2_3
#> Call:
#> lm(formula = mpg ~ ., data = mtcars)
#> 
#> Coefficients:
#> (Intercept)          cyl         disp           hp         drat           wt  
#>    12.30337     -0.11144      0.01334     -0.02148      0.78711     -3.71530  
#>        qsec           vs           am         gear         carb  
#>     0.82104      0.31776      2.52023      0.65541     -0.19942
```

**Explanation:** The dot expands to every other column in `data`. Handy for exploration, but reckless for inference: collinear predictors balloon standard errors and individual coefficients become unstable. Use `mpg ~ . - cyl` to drop one term or `mpg ~ . - 1` to drop the intercept. For real model selection, prefer `step()` or domain reasoning over throwing everything in.

</details>

### Exercise 2.4: Drop hp from an existing model with update()

**Task:** A modelling team is comparing nested specifications and wants to refit `mpg ~ wt + hp + qsec` without `hp`. Use `update()` instead of retyping the formula and save the new model to `ex_2_4`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt + qsec, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt         qsec  
#>     19.7462      -5.0480       0.9292
```

**Difficulty:** Intermediate

```r title="Your turn"
big <- lm(mpg ~ wt + hp + qsec, data = mtcars)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
big <- lm(mpg ~ wt + hp + qsec, data = mtcars)
ex_2_4 <- update(big, . ~ . - hp)
ex_2_4
#> Call:
#> lm(formula = mpg ~ wt + qsec, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt         qsec  
#>     19.7462      -5.0480       0.9292
```

**Explanation:** `update()` rewrites only the bit you specify: `. ~ . - hp` keeps the response and all other predictors but removes `hp`. Use `. ~ . + cyl` to add a term or `. ~ . - 1` to drop the intercept. The big win is that `update()` carries the data argument forward, so you do not silently lose `data = mtcars` and refit on whatever your current workspace happens to contain.

</details>

### Exercise 2.5: Add a weight-by-horsepower interaction

**Task:** A reviewer suspects the weight penalty grows with horsepower (powerful heavy cars do especially badly). Fit `mpg ~ wt * hp` on `mtcars` so R adds the main effects and the `wt:hp` interaction, then save the model to `ex_2_5`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt * hp, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt           hp        wt:hp  
#>    49.80842     -8.21662     -0.12010      0.02785
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- lm(mpg ~ wt * hp, data = mtcars)
ex_2_5
#> Call:
#> lm(formula = mpg ~ wt * hp, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt           hp        wt:hp  
#>    49.80842     -8.21662     -0.12010      0.02785
```

**Explanation:** `wt * hp` is shorthand for `wt + hp + wt:hp`. With an interaction, the effect of `wt` depends on the level of `hp`: the slope becomes `-8.22 + 0.028 * hp`. Always keep the main effects in (do not write `wt:hp` alone) unless you have a strong theoretical reason and have centred the predictors. Interpreting raw-scale interactions without centring is error-prone.

</details>

### Exercise 2.6: Refit on a subset of automatic-transmission cars

**Task:** A product manager only cares about automatics (`am == 0`). Fit `mpg ~ wt + hp` restricted to those rows using the `subset` argument of `lm()` and save the model to `ex_2_6`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars, subset = am == 0)
#> 
#> Coefficients:
#> (Intercept)           wt           hp  
#>    31.81857     -2.97505     -0.04590
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- lm(mpg ~ wt + hp, data = mtcars, subset = am == 0)
ex_2_6
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars, subset = am == 0)
#> 
#> Coefficients:
#> (Intercept)           wt           hp  
#>    31.81857     -2.97505     -0.04590
```

**Explanation:** `subset =` keeps the call self-documenting: the printed model shows exactly which rows were used. The alternative `lm(... , data = mtcars[mtcars$am == 0, ])` works but hides the filter from `update()` and `predict()` calls downstream. `subset` also handles missing values cleanly: rows where the filter is `NA` are dropped along with rows where it is `FALSE`.

</details>

### Exercise 2.7: Set 6-cylinder as the reference level

**Task:** An analyst presenting to engineers wants the 6-cylinder average as the baseline, not the 4-cylinder. Use `relevel(factor(cyl), ref = "6")` inside the formula for `mpg ~ wt + ...` and save the refit model to `ex_2_7`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt + relevel(factor(cyl), ref = "6"), data = mtcars)
#> 
#> Coefficients:
#>                      (Intercept)                                wt  
#>                          29.7352                           -3.2056  
#> relevel(factor(cyl), ref = "6")4  relevel(factor(cyl), ref = "8"]  
#>                           4.2556                           -1.8153
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- lm(mpg ~ wt + relevel(factor(cyl), ref = "6"), data = mtcars)
ex_2_7
#> Call:
#> lm(formula = mpg ~ wt + relevel(factor(cyl), ref = "6"), data = mtcars)
#> 
#> Coefficients:
#>                      (Intercept)                                wt  
#>                          29.7352                           -3.2056  
#> relevel(factor(cyl), ref = "6")4  relevel(factor(cyl), ref = "8")  
#>                           4.2556                           -1.8153
```

**Explanation:** By default R picks the alphabetically (or numerically) lowest level as the reference. `relevel()` swaps it, which matters because the intercept now represents the 6-cylinder mean at `wt = 0` and the other dummies are differences from 6-cyl. The slope of `wt` is unchanged (about -3.2): re-leveling shifts how dummies are parameterised, never the continuous slopes.

</details>

### Exercise 2.8: Refit using standardised predictors and read betas

**Task:** A researcher wants standardised regression coefficients so weight, horsepower, and quarter-mile time can be compared on the same scale. Use `scale()` on the predictors before fitting `mpg ~ scaled_wt + scaled_hp + scaled_qsec` and save the model to `ex_2_8`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ scale(wt) + scale(hp) + scale(qsec), data = mtcars)
#> 
#> Coefficients:
#> (Intercept)   scale(wt)   scale(hp)  scale(qsec)  
#>     20.0906     -4.9319     -1.8126       0.8392
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- lm(mpg ~ scale(wt) + scale(hp) + scale(qsec), data = mtcars)
ex_2_8
#> Call:
#> lm(formula = mpg ~ scale(wt) + scale(hp) + scale(qsec), data = mtcars)
#> 
#> Coefficients:
#> (Intercept)   scale(wt)   scale(hp)  scale(qsec)  
#>     20.0906     -4.9319     -1.8126       0.8392
```

**Explanation:** Standardised slopes give the change in `mpg` per one-standard-deviation change in each predictor, putting them on a comparable scale. The intercept now equals the mean of `mpg`, because at the means of the predictors `scale()` returns zero. Note R-squared, t-statistics, and p-values are invariant to scaling: only the coefficient magnitudes change.

</details>

## Section 3. Model diagnostics and assumptions (10 problems)

### Exercise 3.1: Generate the residuals-vs-fitted diagnostic plot

**Task:** A reviewer asks for the standard residuals-vs-fitted plot to eyeball linearity and heteroscedasticity. Fit `mpg ~ wt + hp` on `mtcars` and call `plot()` with `which = 1`; save the model object that was plotted to `ex_3_1`.

**Expected result:**

```
#> # Diagnostic plot drawn (residuals vs fitted)
#> # Loess curve overlaid; ideal shape: flat scatter around y = 0
#> ex_3_1 is the lm object behind the plot
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
plot(ex_3_1, which = 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- lm(mpg ~ wt + hp, data = mtcars)
plot(ex_3_1, which = 1)
#> Diagnostic plot drawn; the smoothed red line should hover around zero
#> A funnel shape would suggest heteroscedasticity; curvature suggests missing nonlinearity
```

**Explanation:** `plot.lm()` produces six diagnostic plots; `which = 1` is residuals vs fitted, the first thing to check. Look for two issues: a non-flat smoother (linearity violated, often signalling a missing polynomial or interaction) and a fan pattern (variance grows with the mean, signalling heteroscedasticity that biases standard errors). For `mpg ~ wt + hp` you will see slight curvature, which Exercise 4.3 fixes with a squared term.

</details>

### Exercise 3.2: Check normality of residuals with a Q-Q plot

**Task:** An audit reviewer wants to verify residual normality on a `Volume ~ Girth + Height` fit using the built-in `trees` dataset. Produce the normal Q-Q plot via `plot(fit, which = 2)` and save the model object to `ex_3_2`.

**Expected result:**

```
#> # Q-Q plot drawn for studentised residuals against theoretical normal quantiles
#> # Points hugging the diagonal: residuals approximately normal
#> ex_3_2 is the lm object
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
plot(ex_3_2, which = 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- lm(Volume ~ Girth + Height, data = trees)
plot(ex_3_2, which = 2)
#> Q-Q plot drawn; mild deviation at the right tail visible
#> Suggests a small right-skew; a log transform would tighten it
```

**Explanation:** Q-Q plots compare ordered residuals to the quantiles of a normal distribution. Points along the diagonal mean residuals are approximately normal, which validates the textbook t-statistics and confidence intervals. Heavy-tailed deviations argue for robust standard errors or a transformation (Section 4). On 31 rows like `trees`, formal normality tests like Shapiro are underpowered, so visual checks carry weight.

</details>

### Exercise 3.3: Apply the Shapiro-Wilk normality test to residuals

**Task:** A statistician wants a numerical normality check on the residuals of `mpg ~ wt + hp` for `mtcars`. Run `shapiro.test()` on `resid(fit)` and save the htest object to `ex_3_3`.

**Expected result:**

```
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  resid(fit)
#> W = 0.92792, p-value = 0.03427
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_3 <- shapiro.test(resid(fit))
ex_3_3
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  resid(fit)
#> W = 0.92792, p-value = 0.03427
```

**Explanation:** Shapiro-Wilk's null is that the data are normal; a small p-value rejects it. Here p = 0.034 hints at mild non-normality. Important caveat: in large samples Shapiro will reject for any tiny deviation that does not actually matter for inference; in small samples it has weak power. Pair it with a Q-Q plot rather than treating it as the only diagnostic.

</details>

### Exercise 3.4: Test for heteroscedasticity with Breusch-Pagan

**Task:** A risk team needs a formal heteroscedasticity check on `mpg ~ wt + hp`. Use `lmtest::bptest()` on the fitted model and save the htest object to `ex_3_4`.

**Expected result:**

```
#> 
#> 	studentized Breusch-Pagan test
#> 
#> data:  fit
#> BP = 0.88072, df = 2, p-value = 0.6438
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_4 <- bptest(fit)
ex_3_4
#> 
#> 	studentized Breusch-Pagan test
#> 
#> data:  fit
#> BP = 0.88072, df = 2, p-value = 0.6438
```

**Explanation:** Breusch-Pagan regresses squared residuals on the predictors; a large statistic means variance changes with the predictors (heteroscedasticity). Here p = 0.64, so we fail to reject equal-variance. If the test were significant, the fix is robust standard errors (Exercise 6.7) or a variance-stabilising transformation. White's test (`bptest(fit, ~ x1*x2 + I(x1^2) + I(x2^2), data = ...)`) extends Breusch-Pagan to nonlinear forms of heteroscedasticity.

</details>

### Exercise 3.5: Detect autocorrelation with Durbin-Watson

**Task:** A time-series-leaning analyst wants to check residual autocorrelation in a regression of CO2 concentration on time. Fit `co2 ~ time(co2)` using the built-in `co2` series (convert to a data frame first) and run `lmtest::dwtest()`; save the result to `ex_3_5`.

**Expected result:**

```
#> 
#> 	Durbin-Watson test
#> 
#> data:  fit
#> DW = 0.024851, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0
```

**Difficulty:** Intermediate

```r title="Your turn"
df <- data.frame(co2 = as.numeric(co2), t = as.numeric(time(co2)))
fit <- lm(co2 ~ t, data = df)
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- data.frame(co2 = as.numeric(co2), t = as.numeric(time(co2)))
fit <- lm(co2 ~ t, data = df)
ex_3_5 <- dwtest(fit)
ex_3_5
#> 
#> 	Durbin-Watson test
#> 
#> data:  fit
#> DW = 0.024851, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0
```

**Explanation:** Durbin-Watson tests whether consecutive residuals are correlated. The statistic ranges from 0 (perfect positive autocorrelation) to 4 (perfect negative), with 2 indicating independence. Here DW = 0.025: massive positive autocorrelation, classic for a series that drifts. Linear regression with autocorrelated errors gives inflated t-statistics. The fix is a time-series model (ARIMA, GLS) or differencing the series before fitting.

</details>

### Exercise 3.6: Compute variance inflation factors to flag collinearity

**Task:** A modelling lead worries `wt` and `disp` measure overlapping things and wants the variance inflation factor for each predictor in `mpg ~ wt + hp + disp` on `mtcars`. Use `car::vif()` and save the named numeric vector to `ex_3_6`.

**Expected result:**

```
#>       wt       hp     disp 
#> 4.844618 2.736633 7.324517
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp + disp, data = mtcars)
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + disp, data = mtcars)
ex_3_6 <- vif(fit)
ex_3_6
#>       wt       hp     disp 
#> 4.844618 2.736633 7.324517
```

**Explanation:** VIF measures how much a predictor's standard error inflates due to correlation with the others. Rule of thumb: VIF > 5 is concerning, > 10 is serious. Here `disp` (7.3) signals collinearity with `wt`. Fixes: drop one of the redundant variables, combine them into a composite, or use ridge regression. VIF is computed as `1 / (1 - R^2_j)` where `R^2_j` is from regressing predictor j on the others.

</details>

### Exercise 3.7: Flag high-influence points with Cook's distance

**Task:** A code reviewer wants the names of rows whose Cook's distance exceeds `4 / n` for an `mpg ~ wt + hp` model on `mtcars`. Compute `cooks.distance()`, filter, and save the names of flagged rows as a character vector to `ex_3_7`.

**Expected result:**

```
#> [1] "Toyota Corolla" "Fiat 128"       "Chrysler Imperial"
#> [4] "Maserati Bora"
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
n <- nrow(mtcars)
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
n <- nrow(mtcars)
cd <- cooks.distance(fit)
ex_3_7 <- names(cd[cd > 4 / n])
ex_3_7
#> [1] "Toyota Corolla"    "Fiat 128"          "Chrysler Imperial"
#> [4] "Maserati Bora"
```

**Explanation:** Cook's distance combines leverage and residual size into a single influence measure: how much would the fitted values change if this row were dropped? The `4/n` threshold is a common heuristic for "worth a look", not a verdict. Investigate flagged rows: are they data-entry errors, genuine outliers, or important rare cases worth keeping? Never drop high-influence points reflexively, because they may be the most informative rows in the dataset.

</details>

### Exercise 3.8: Identify high-leverage points using hat values

**Task:** A statistician wants to know which rows have leverage above the `2k/n` rule for a `Volume ~ Girth + Height` fit on `trees`. Use `hatvalues()`, apply the threshold (k = number of parameters including intercept), and save the row indices to `ex_3_8`.

**Expected result:**

```
#> [1] 18 28 31
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(Volume ~ Girth + Height, data = trees)
n <- nrow(trees); k <- length(coef(fit))
ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(Volume ~ Girth + Height, data = trees)
n <- nrow(trees); k <- length(coef(fit))
h <- hatvalues(fit)
ex_3_8 <- as.integer(which(h > 2 * k / n))
ex_3_8
#> [1] 18 28 31
```

**Explanation:** Leverage measures how unusual a row is in predictor space (independent of y). A point with `wt = 5` in a dataset where weight ranges 1.5 to 5.4 has high leverage even if its `mpg` is exactly on the regression line. The `2k/n` cut-off (sometimes `3k/n` for small samples) is the rule of thumb. High leverage matters only when combined with a large residual (which is what Cook's distance captures): leverage alone is not damage.

</details>

### Exercise 3.9: Flag outliers with studentised residuals and Bonferroni

**Task:** A fraud team wants a principled outlier test instead of eyeballing. Use `car::outlierTest()` on an `mpg ~ wt + hp` fit, which runs a Bonferroni-corrected t-test on the most extreme studentised residual; save the result to `ex_3_9`.

**Expected result:**

```
#>                rstudent unadjusted p-value Bonferroni p
#> Toyota Corolla 3.275927          0.0028324      0.090636
```

**Difficulty:** Advanced

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_9 <- # your code here
ex_3_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_9 <- outlierTest(fit)
ex_3_9
#>                rstudent unadjusted p-value Bonferroni p
#> Toyota Corolla 3.275927          0.0028324      0.090636
```

**Explanation:** Studentised residuals divide each residual by an estimate of its own standard deviation that excludes that point (jackknifing). Under the null, they follow a t-distribution; Bonferroni multiplies the unadjusted p-value by the sample size to control the family-wise error rate. Here Toyota Corolla's adjusted p (0.09) is not significant at 0.05, so we keep it. The unadjusted p (0.003) would be misleading because we are testing the most extreme of 32 points, not a pre-specified one.

</details>

### Exercise 3.10: Compare OLS against robust regression with rlm()

**Task:** A reviewer worries the OLS slope for `mpg ~ wt + hp` is being pulled by influential cars. Refit using `MASS::rlm()` (Huber M-estimation, robust to outliers) and save a tibble with `term`, `ols_estimate`, `rlm_estimate` to `ex_3_10`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   term        ols_estimate rlm_estimate
#>   <chr>              <dbl>        <dbl>
#> 1 (Intercept)      37.2          36.9   
#> 2 wt               -3.88         -3.32  
#> 3 hp               -0.0318       -0.0399
```

**Difficulty:** Advanced

```r title="Your turn"
ols <- lm(mpg ~ wt + hp, data = mtcars)
rb  <- rlm(mpg ~ wt + hp, data = mtcars)
ex_3_10 <- # your code here
ex_3_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ols <- lm(mpg ~ wt + hp, data = mtcars)
rb  <- rlm(mpg ~ wt + hp, data = mtcars)
ex_3_10 <- tibble(
  term = names(coef(ols)),
  ols_estimate = coef(ols),
  rlm_estimate = coef(rb)
)
ex_3_10
#> # A tibble: 3 x 3
#>   term        ols_estimate rlm_estimate
#>   <chr>              <dbl>        <dbl>
#> 1 (Intercept)      37.2          36.9   
#> 2 wt               -3.88         -3.32  
#> 3 hp               -0.0318       -0.0399
```

**Explanation:** `rlm()` down-weights points with large residuals, so its slopes are pulled less by outliers than OLS. When the two sets of coefficients agree, OLS is safe. When they disagree by more than a few percent (here the `wt` slope shifts 15%), it is a signal that a handful of points are doing a lot of the work in your OLS fit. Robust regression is not a free pass: it sacrifices efficiency under perfectly normal errors, so use it as a diagnostic comparison.

</details>

## Section 4. Transformations and feature engineering (8 problems)

### Exercise 4.1: Log-transform the response and refit

**Task:** A pricing analyst is studying `diamonds` and suspects `price` is right-skewed. Fit `log(price) ~ carat` on the built-in `diamonds` dataset and save the model to `ex_4_1`.

**Expected result:**

```
#> Call:
#> lm(formula = log(price) ~ carat, data = diamonds)
#> 
#> Coefficients:
#> (Intercept)        carat  
#>       6.215        1.970
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- lm(log(price) ~ carat, data = diamonds)
ex_4_1
#> Call:
#> lm(formula = log(price) ~ carat, data = diamonds)
#> 
#> Coefficients:
#> (Intercept)        carat  
#>       6.215        1.970
```

**Explanation:** Logging a right-skewed response usually fixes both heteroscedasticity and non-normality of residuals in one move. The interpretation also changes: a 1-carat increase multiplies expected price by `exp(1.97) = 7.17`, roughly a sevenfold price bump. Remember that `predict()` returns the predicted log price; you need `exp()` to get back to dollars, and that introduces a small bias (Jensen's inequality) you may want to correct with a smearing factor.

</details>

### Exercise 4.2: Find the Box-Cox optimal lambda

**Task:** A statistician wants the Box-Cox optimal power transform for `Volume ~ Girth + Height` on the `trees` dataset. Use `MASS::boxcox()`, extract the lambda that maximises the log-likelihood, and save the scalar to `ex_4_2`.

**Expected result:**

```
#> [1] 0.3030303
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(Volume ~ Girth + Height, data = trees)
bc  <- boxcox(fit, plotit = FALSE)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(Volume ~ Girth + Height, data = trees)
bc  <- boxcox(fit, plotit = FALSE)
ex_4_2 <- bc$x[which.max(bc$y)]
ex_4_2
#> [1] 0.3030303
```

**Explanation:** Box-Cox searches for the lambda that makes residuals most normal under the family `(y^lambda - 1) / lambda` (with the limit `log(y)` at lambda = 0). The optimal lambda for `trees$Volume` is near 1/3, which is also the physical cube-root: makes sense since volume scales with the cube of girth. In practice round to the nearest interpretable value (0, 0.5, 1/3, etc.) so the model stays explainable to non-statisticians.

</details>

### Exercise 4.3: Add a quadratic weight term to capture curvature

**Task:** A reviewer sees curvature in the residuals of `mpg ~ wt` on `mtcars` and wants a second-order term. Fit `mpg ~ wt + I(wt^2)` so R treats the squared term as a literal (not formula syntax), and save the model to `ex_4_3`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt + I(wt^2), data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt      I(wt^2)  
#>     49.9308     -13.3803       1.1711
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- lm(mpg ~ wt + I(wt^2), data = mtcars)
ex_4_3
#> Call:
#> lm(formula = mpg ~ wt + I(wt^2), data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt      I(wt^2)  
#>     49.9308     -13.3803       1.1711
```

**Explanation:** Inside a formula, `^` has a special meaning (it expands interactions), so `wt^2` would do the wrong thing. The `I()` wrapper says "treat this expression literally". The positive `wt^2` coefficient means the slope flattens as cars get heavier: each pound matters less for already-heavy vehicles. Always plot the fitted curve and decide whether the quadratic is genuine signal or noise from a handful of extreme rows.

</details>

### Exercise 4.4: Use orthogonal polynomials instead of raw squared terms

**Task:** A modelling lead points out that `wt` and `wt^2` are highly correlated, making the coefficients hard to interpret. Refit `mpg ~ poly(wt, 2)` on `mtcars` (default `raw = FALSE` gives orthogonal polynomials) and save the model to `ex_4_4`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ poly(wt, 2), data = mtcars)
#> 
#> Coefficients:
#>  (Intercept)  poly(wt, 2)1  poly(wt, 2)2  
#>       20.091       -29.116         8.636
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- lm(mpg ~ poly(wt, 2), data = mtcars)
ex_4_4
#> Call:
#> lm(formula = mpg ~ poly(wt, 2), data = mtcars)
#> 
#> Coefficients:
#>  (Intercept)  poly(wt, 2)1  poly(wt, 2)2  
#>       20.091       -29.116         8.636
```

**Explanation:** Orthogonal polynomials are linear combinations of raw powers, constructed to be uncorrelated. This makes coefficients independently testable and avoids the inflated standard errors raw polynomial terms cause. The trade-off is interpretability: the orthogonal slopes have no direct unit meaning. Use `poly()` for testing whether the quadratic adds significantly; use `I(wt^2)` (Exercise 4.3) when you need readable coefficients.

</details>

### Exercise 4.5: Add a binary indicator built from a continuous variable

**Task:** A marketing analyst wants to flag heavy diamonds (`carat >= 1`) and study how that indicator modifies the price slope. Build a `heavy` indicator inside the formula via `I(carat >= 1)` and fit `log(price) ~ carat + I(carat >= 1)` on `diamonds`; save the model to `ex_4_5`.

**Expected result:**

```
#> Call:
#> lm(formula = log(price) ~ carat + I(carat >= 1), data = diamonds)
#> 
#> Coefficients:
#>       (Intercept)              carat  I(carat >= 1)TRUE  
#>            6.3056             1.5680             0.4837
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- lm(log(price) ~ carat + I(carat >= 1), data = diamonds)
ex_4_5
#> Call:
#> lm(formula = log(price) ~ carat + I(carat >= 1), data = diamonds)
#> 
#> Coefficients:
#>       (Intercept)              carat  I(carat >= 1)TRUE  
#>            6.3056             1.5680             0.4837
```

**Explanation:** The `>=` expression returns logical, which `lm()` treats as a numeric dummy (TRUE = 1). The 0.48 coefficient on `heavy` means crossing the 1-carat threshold gives log-price an extra bump of 0.48 (a factor of `exp(0.48) = 1.62`) above and beyond the continuous trend. This captures retailer pricing psychology: a 1.01-carat stone advertises better than a 0.99-carat stone even though carat itself only nudged. Dummies for thresholds are a cheap way to model price kinks.

</details>

### Exercise 4.6: Centre predictors before fitting an interaction

**Task:** A statistician explains that interaction coefficients become more interpretable when predictors are mean-centred. Centre `wt` and `hp` of `mtcars`, then fit `mpg ~ wt_c * hp_c` and save the model to `ex_4_6`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt_c * hp_c, data = d)
#> 
#> Coefficients:
#> (Intercept)         wt_c         hp_c    wt_c:hp_c  
#>    19.43378     -4.13225     -0.01913      0.02785
```

**Difficulty:** Intermediate

```r title="Your turn"
d <- transform(mtcars, wt_c = wt - mean(wt), hp_c = hp - mean(hp))
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- transform(mtcars, wt_c = wt - mean(wt), hp_c = hp - mean(hp))
ex_4_6 <- lm(mpg ~ wt_c * hp_c, data = d)
ex_4_6
#> Call:
#> lm(formula = mpg ~ wt_c * hp_c, data = d)
#> 
#> Coefficients:
#> (Intercept)         wt_c         hp_c    wt_c:hp_c  
#>    19.43378     -4.13225     -0.01913      0.02785
```

**Explanation:** With centred predictors, the main effects represent the slope at the mean of the other predictor, not at zero (which is often nonsense, e.g., a 0 lb car). The intercept becomes the predicted `mpg` at average `wt` and average `hp`. The interaction term and the model fit (R-squared, residuals) are identical to the uncentred version; only the main-effect coefficients shift. This is a free interpretability win when you have interactions.

</details>

### Exercise 4.7: Read standardised betas via summary on a scale() model

**Task:** A reporting analyst wants standardised betas to communicate which predictor matters most in `mpg ~ wt + hp + qsec` on `mtcars`. Scale every variable in the model frame before fitting and extract the coefficient vector excluding the intercept; save to `ex_4_7`.

**Expected result:**

```
#>         wt         hp       qsec 
#> -0.6322910 -0.3210972  0.1771063
```

**Difficulty:** Advanced

```r title="Your turn"
d <- as.data.frame(scale(mtcars[, c("mpg", "wt", "hp", "qsec")]))
fit <- lm(mpg ~ wt + hp + qsec, data = d)
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- as.data.frame(scale(mtcars[, c("mpg", "wt", "hp", "qsec")]))
fit <- lm(mpg ~ wt + hp + qsec, data = d)
ex_4_7 <- coef(fit)[-1]
ex_4_7
#>         wt         hp       qsec 
#> -0.6322910 -0.3210972  0.1771063
```

**Explanation:** Scaling both response and predictors gives slopes that read as "standard deviations of `mpg` per standard deviation of x". `wt`'s magnitude (-0.63) is roughly double `hp`'s and triple `qsec`'s, so weight does the heaviest lifting in this model. The intercept lands at zero by construction since centring `mpg` removes its mean. Caveat: standardisation hides the original scale, so always report unstandardised slopes too when readers need actionable numbers.

</details>

### Exercise 4.8: Replace a polynomial with a B-spline term

**Task:** A senior modeller wants to fit `Volume ~ bs(Girth, df = 4) + Height` on `trees`, replacing the quadratic in `Girth` with a B-spline that can bend more flexibly than `poly()`. Save the fitted model to `ex_4_8`.

**Expected result:**

```
#> Call:
#> lm(formula = Volume ~ bs(Girth, df = 4) + Height, data = trees)
#> 
#> Coefficients:
#>         (Intercept)   bs(Girth, df = 4)1   bs(Girth, df = 4)2  
#>            -25.7796               5.2398              17.8941  
#>  bs(Girth, df = 4)3   bs(Girth, df = 4)4               Height  
#>             37.5410              50.1064               0.4054
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- lm(Volume ~ bs(Girth, df = 4) + Height, data = trees)
ex_4_8
#> Call:
#> lm(formula = Volume ~ bs(Girth, df = 4) + Height, data = trees)
#> 
#> Coefficients:
#>         (Intercept)   bs(Girth, df = 4)1   bs(Girth, df = 4)2  
#>            -25.7796               5.2398              17.8941  
#>  bs(Girth, df = 4)3   bs(Girth, df = 4)4               Height  
#>             37.5410              50.1064               0.4054
```

**Explanation:** A B-spline of degree 3 with 4 degrees of freedom partitions `Girth` into piecewise cubic segments that join smoothly. Splines bend locally without affecting predictions far from a given knot, unlike high-order polynomials which wiggle globally. The individual spline coefficients have no readable meaning on their own; always plot the fitted curve to see what the model is saying. Pick the `df` by cross-validation or by AIC, not by gut.

</details>

## Section 5. Model evaluation and comparison (8 problems)

### Exercise 5.1: Read adjusted R-squared from a multiple regression

**Task:** A junior analyst learned that adjusted R-squared penalises adding useless predictors. Fit `mpg ~ wt + hp + qsec + drat` on `mtcars`, pull the adjusted R-squared via `summary()`, and save the scalar to `ex_5_1`.

**Expected result:**

```
#> [1] 0.8166327
```

**Difficulty:** Beginner

```r title="Your turn"
fit <- lm(mpg ~ wt + hp + qsec + drat, data = mtcars)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + qsec + drat, data = mtcars)
ex_5_1 <- summary(fit)$adj.r.squared
ex_5_1
#> [1] 0.8166327
```

**Explanation:** Adjusted R-squared subtracts a penalty proportional to the number of predictors, so adding a useless one will not bump it up. Multiple R-squared always grows with more predictors, even when they are pure noise, which makes it a bad metric for model selection. AIC and BIC (next exercise) impose stricter penalties and are usually preferred over adjusted R-squared for comparing non-nested models.

</details>

### Exercise 5.2: Compare AIC and BIC across competing models

**Task:** A modelling team is choosing between three candidate models for `mpg` on `mtcars`: `wt`; `wt + hp`; `wt + hp + qsec`. Compute AIC and BIC for each and save a tibble with `model`, `aic`, `bic` to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   model              aic   bic
#>   <chr>            <dbl> <dbl>
#> 1 wt                166.  170.
#> 2 wt+hp             156.  162.
#> 3 wt+hp+qsec        157.  164.
```

**Difficulty:** Intermediate

```r title="Your turn"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
m3 <- lm(mpg ~ wt + hp + qsec, data = mtcars)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
m3 <- lm(mpg ~ wt + hp + qsec, data = mtcars)
ex_5_2 <- tibble(
  model = c("wt", "wt+hp", "wt+hp+qsec"),
  aic = c(AIC(m1), AIC(m2), AIC(m3)),
  bic = c(BIC(m1), BIC(m2), BIC(m3))
)
ex_5_2
#> # A tibble: 3 x 3
#>   model              aic   bic
#>   <chr>            <dbl> <dbl>
#> 1 wt                166.  170.
#> 2 wt+hp             156.  162.
#> 3 wt+hp+qsec        157.  164.
```

**Explanation:** Lower AIC and BIC mean better fit-per-parameter. Adding `hp` to the wt-only model cuts AIC by 10 (a big improvement); adding `qsec` on top makes AIC slightly worse, suggesting it does not pull its weight. BIC penalises complexity more harshly than AIC (penalty `log(n) * k` vs `2 * k`), so it tends to pick smaller models. Both assume the same response variable: do not compare across log-transformed vs raw-y models.

</details>

### Exercise 5.3: Test nested models with anova()

**Task:** A reviewer wants a formal F-test of whether `qsec` adds explanatory power to `mpg ~ wt + hp` on `mtcars`. Use `anova(small, big)` to compare nested fits and save the anova object to `ex_5_3`.

**Expected result:**

```
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ wt + hp
#> Model 2: mpg ~ wt + hp + qsec
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1     29 195.05                           
#> 2     28 187.94  1    7.1093 1.0589 0.3124
```

**Difficulty:** Intermediate

```r title="Your turn"
small <- lm(mpg ~ wt + hp, data = mtcars)
big   <- lm(mpg ~ wt + hp + qsec, data = mtcars)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
small <- lm(mpg ~ wt + hp, data = mtcars)
big   <- lm(mpg ~ wt + hp + qsec, data = mtcars)
ex_5_3 <- anova(small, big)
ex_5_3
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ wt + hp
#> Model 2: mpg ~ wt + hp + qsec
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1     29 195.05                           
#> 2     28 187.94  1    7.1093 1.0589 0.3124
```

**Explanation:** `anova()` on two nested `lm` objects runs an F-test comparing them. The null is "extra terms have zero coefficients". Here p = 0.31, so we cannot reject: `qsec` is not contributing meaningful explanation. This aligns with the AIC result from Exercise 5.2. Models must be nested for `anova()` to make sense: same data, same response, all predictors of the smaller model contained in the bigger one.

</details>

### Exercise 5.4: Run stepwise selection with step()

**Task:** A modelling lead wants automated backward elimination starting from the full `mpg ~ .` model on `mtcars`. Run `step()` in backward mode and save the final selected model object to `ex_5_4`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt + qsec + am, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt         qsec           am  
#>       9.618       -3.917        1.226        2.936
```

**Difficulty:** Intermediate

```r title="Your turn"
full <- lm(mpg ~ ., data = mtcars)
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
full <- lm(mpg ~ ., data = mtcars)
ex_5_4 <- step(full, direction = "backward", trace = 0)
ex_5_4
#> Call:
#> lm(formula = mpg ~ wt + qsec + am, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt         qsec           am  
#>       9.618       -3.917        1.226        2.936
```

**Explanation:** `step()` greedily removes (or adds, in forward mode) one predictor at a time based on AIC. Backward selection from the full model lands on `wt + qsec + am`. Treat the output as a starting hypothesis, not a verdict: stepwise is known to overfit, especially on small datasets, and the resulting standard errors are too small because they ignore selection variability. Cross-validation gives a more honest test of which predictors generalise.

</details>

### Exercise 5.5: Compute 5-fold cross-validated RMSE

**Task:** A practitioner wants the cross-validated RMSE of `mpg ~ wt + hp` on `mtcars` instead of in-sample RMSE. Use a manual 5-fold loop (split rows by `cut(seq_len(n), 5)`), fit and predict for each fold, and save the average RMSE to `ex_5_5`.

**Expected result:**

```
#> [1] 2.642
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(42)
folds <- cut(seq_len(nrow(mtcars)), 5, labels = FALSE)
folds <- sample(folds)
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
folds <- cut(seq_len(nrow(mtcars)), 5, labels = FALSE)
folds <- sample(folds)
rmse_fold <- function(k) {
  train <- mtcars[folds != k, ]
  test  <- mtcars[folds == k, ]
  fit <- lm(mpg ~ wt + hp, data = train)
  sqrt(mean((test$mpg - predict(fit, newdata = test))^2))
}
ex_5_5 <- mean(sapply(1:5, rmse_fold))
ex_5_5
#> [1] 2.642
```

**Explanation:** Manual k-fold loops are the most transparent way to learn what cross-validation does: fit on 4 folds, score the held-out 5th, average. Real projects should use `caret::train()`, `tidymodels::vfold_cv()`, or `boot::cv.glm()`, which handle stratification and parallel execution. Always set a seed so results are reproducible; cross-validation introduces randomness from the fold assignment that can swing reported RMSE by 5-10% on small datasets.

</details>

### Exercise 5.6: Train/test split with RMSE and MAE

**Task:** A take-home interview asks for an 80/20 train/test split on `mtcars`, fit `mpg ~ wt + hp` on training, and report RMSE plus MAE on test. Save a named numeric vector `c(rmse = ..., mae = ...)` to `ex_5_6`.

**Expected result:**

```
#>     rmse      mae 
#> 2.518135 2.156211
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
idx <- sample(seq_len(nrow(mtcars)), size = floor(0.8 * nrow(mtcars)))
train <- mtcars[idx, ]; test <- mtcars[-idx, ]
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
idx <- sample(seq_len(nrow(mtcars)), size = floor(0.8 * nrow(mtcars)))
train <- mtcars[idx, ]; test <- mtcars[-idx, ]
fit <- lm(mpg ~ wt + hp, data = train)
preds <- predict(fit, newdata = test)
ex_5_6 <- c(
  rmse = sqrt(mean((test$mpg - preds)^2)),
  mae  = mean(abs(test$mpg - preds))
)
ex_5_6
#>     rmse      mae 
#> 2.518135 2.156211
```

**Explanation:** RMSE squares errors (heavier penalty on big misses), MAE averages absolute errors (treats all sizes equally). RMSE is in the same units as the response (mpg), and is the right metric when the response is roughly Gaussian and large mistakes are disproportionately costly. With 32 rows, a single split is unstable; the cross-validation in Exercise 5.5 gives a less seed-dependent estimate.

</details>

### Exercise 5.7: Compute the PRESS statistic

**Task:** An advanced student wants the PRESS (Predicted Residual Sum of Squares) for `mpg ~ wt + hp` on `mtcars`. Compute it as the sum of squared leave-one-out residuals via `(resid(fit) / (1 - hatvalues(fit)))^2`; save the scalar to `ex_5_7`.

**Expected result:**

```
#> [1] 220.4144
```

**Difficulty:** Advanced

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_5_7 <- sum((resid(fit) / (1 - hatvalues(fit)))^2)
ex_5_7
#> [1] 220.4144
```

**Explanation:** PRESS approximates leave-one-out cross-validated SSE without actually refitting the model n times: the deleted residual for row i equals `resid_i / (1 - h_ii)`. It is cheap and exact for OLS. A model whose PRESS is much bigger than its in-sample SSE is overfitting; one whose PRESS approaches SSE is generalising well. The "predicted R-squared", `1 - PRESS / SS_total`, is a useful one-number summary alongside adjusted R-squared.

</details>

### Exercise 5.8: Side-by-side comparison with broom::glance()

**Task:** A reporting analyst wants a clean side-by-side comparison of three candidate models for `mpg` on `mtcars`. Apply `broom::glance()` to each, bind the rows, add a `model` column, and save the tibble to `ex_5_8`.

**Expected result:**

```
#> # A tibble: 3 x 13
#>   model      r.squared adj.r.squared sigma statistic   p.value    df logLik   AIC   BIC
#>   <chr>          <dbl>         <dbl> <dbl>     <dbl>     <dbl> <dbl>  <dbl> <dbl> <dbl>
#> 1 wt             0.753         0.745  3.05     91.4  1.29e-10     1  -80.0  166.  170.
#> 2 wt+hp          0.827         0.815  2.59     69.2  9.11e-12     2  -74.3  157.  163.
#> 3 wt+hp+qsec     0.834         0.816  2.59     46.9  5.29e-11     3  -73.7  157.  165.
#> # ... 3 more columns hidden (deviance, df.residual, nobs)
```

**Difficulty:** Advanced

```r title="Your turn"
fits <- list(
  wt           = lm(mpg ~ wt, data = mtcars),
  `wt+hp`      = lm(mpg ~ wt + hp, data = mtcars),
  `wt+hp+qsec` = lm(mpg ~ wt + hp + qsec, data = mtcars)
)
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fits <- list(
  wt           = lm(mpg ~ wt, data = mtcars),
  `wt+hp`      = lm(mpg ~ wt + hp, data = mtcars),
  `wt+hp+qsec` = lm(mpg ~ wt + hp + qsec, data = mtcars)
)
ex_5_8 <- bind_rows(lapply(fits, glance), .id = "model")
ex_5_8
#> # A tibble: 3 x 13
#>   model      r.squared adj.r.squared sigma statistic   p.value    df logLik   AIC   BIC
#>   <chr>          <dbl>         <dbl> <dbl>     <dbl>     <dbl> <dbl>  <dbl> <dbl> <dbl>
#> 1 wt             0.753         0.745  3.05     91.4  1.29e-10     1  -80.0  166.  170.
#> 2 wt+hp          0.827         0.815  2.59     69.2  9.11e-12     2  -74.3  157.  163.
#> 3 wt+hp+qsec     0.834         0.816  2.59     46.9  5.29e-11     3  -73.7  157.  165.
```

**Explanation:** `glance()` returns one row of fit statistics per model and pairs naturally with `bind_rows()` for side-by-side tables. The `.id` argument captures the list name as a `model` column. From here you can pipe into `gt::gt()` or `kable()` for a report-ready table. Important: AIC and BIC values depend on the data, the response transformation, and the number of observations, so always compare like with like.

</details>

## Section 6. Prediction, intervals, and reporting (8 problems)

### Exercise 6.1: Predict mpg with a confidence interval

**Task:** A buyer wants the predicted mpg plus a 95% confidence interval at `wt = 3.2`, `hp = 110` for the `mpg ~ wt + hp` regression on `mtcars`. Pass `interval = "confidence"` to `predict()` and save the named numeric vector to `ex_6_1`.

**Expected result:**

```
#>        fit      lwr      upr
#> 1 21.31449 20.18671 22.44227
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_1 <- predict(
  fit,
  newdata = data.frame(wt = 3.2, hp = 110),
  interval = "confidence"
)
ex_6_1
#>        fit      lwr      upr
#> 1 21.31449 20.18671 22.44227
```

**Explanation:** A confidence interval here is for the mean response: "the average mpg of all cars with wt = 3.2 and hp = 110 is in this range with 95% confidence". It is narrow because it does not include the residual scatter of individual cars. Width depends on how far the new x is from the training data centroid: predictions far outside the training range get much wider CIs (and you should not trust them at all).

</details>

### Exercise 6.2: Get a prediction interval (wider than the CI)

**Task:** The same buyer also wants the 95% prediction interval (a range that should cover the next individual car, not the average). Re-run `predict()` with `interval = "prediction"` and save the result to `ex_6_2`.

**Expected result:**

```
#>        fit      lwr      upr
#> 1 21.31449 15.74146 26.88753
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_2 <- predict(
  fit,
  newdata = data.frame(wt = 3.2, hp = 110),
  interval = "prediction"
)
ex_6_2
#>        fit      lwr      upr
#> 1 21.31449 15.74146 26.88753
```

**Explanation:** Prediction intervals add residual variance to the confidence-interval width, so they are much wider (here 15.7 to 26.9 vs 20.2 to 22.4). Always present prediction intervals when stakeholders need a range for an individual case; confidence intervals when they care about the average behaviour. A common mistake is reporting a tight CI to a customer who actually needed a PI and then being surprised when individual outcomes blow past it.

</details>

### Exercise 6.3: Augment the dataset with fitted values and diagnostics

**Task:** A reporting analyst wants a tibble that joins the original `mtcars` columns with fitted values, residuals, leverage (`.hat`), and Cook's distance from `mpg ~ wt + hp`. Use `broom::augment()` and save the tibble to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 32 x 14
#>   .rownames           mpg    wt    hp .fitted .resid  .hat .cooksd
#>   <chr>             <dbl> <dbl> <dbl>   <dbl>  <dbl> <dbl>   <dbl>
#> 1 Mazda RX4          21    2.62   110   23.0  -1.97  0.0455 0.00759
#> 2 Mazda RX4 Wag      21    2.88   110   22.0  -0.972 0.0359 0.00146
#> # ... 30 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_3 <- # your code here
head(ex_6_3, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_3 <- augment(fit)
head(ex_6_3, 2)
#> # A tibble: 2 x 9
#>   .rownames        mpg    wt    hp .fitted .resid  .hat .cooksd .std.resid
#>   <chr>          <dbl> <dbl> <dbl>   <dbl>  <dbl> <dbl>   <dbl>      <dbl>
#> 1 Mazda RX4       21    2.62   110   23.0  -1.97  0.0455 0.00759    -0.802
#> 2 Mazda RX4 Wag   21    2.88   110   22.0  -0.972 0.0359 0.00146    -0.392
```

**Explanation:** `augment()` is the tidy-data swiss army knife for diagnostics. Every row of `mtcars` gets columns prefixed with a dot (`.fitted`, `.resid`, `.hat`, `.cooksd`) so they do not collide with original variables. Pipe into `ggplot()` to make custom diagnostic plots, or into `filter(.cooksd > 4 / n())` to surface flagged rows. Pass `newdata` to augment a held-out test set instead of the training set.

</details>

### Exercise 6.4: Plot regression with ggplot2 geom_smooth

**Task:** A reporting analyst wants a scatter of `mpg` against `wt` from `mtcars` with the fitted OLS line plus a 95% confidence band. Use `geom_smooth(method = "lm")` and save the ggplot object to `ex_6_4`.

**Expected result:**

```
#> # ggplot object: scatterplot of mpg vs wt
#> # blue regression line with 95% confidence band shaded around it
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 2, alpha = 0.7) +
  geom_smooth(method = "lm", se = TRUE, level = 0.95) +
  labs(
    title = "Fuel economy by curb weight",
    x = "Weight (1000 lb)",
    y = "Miles per gallon"
  )
ex_6_4
#> ggplot rendered: regression line slopes down at about -5.34 mpg per 1000 lb
#> grey ribbon shows tighter band in the middle, fanning out at the ends
```

**Explanation:** `geom_smooth(method = "lm")` fits a fresh regression on the displayed variables and overlays it with a 95% confidence ribbon by default. The ribbon is the same kind of mean-response CI as Exercise 6.1, so it is narrow at the data centroid and wider at the edges. For multivariate models the ribbon shown is misleading because it ignores the other predictors; in that case extract `predict()` output and plot it yourself instead of leaning on `geom_smooth()`.

</details>

### Exercise 6.5: Plot regression with a custom confidence band on a fine grid

**Task:** A senior modeller wants a regression-line plot that uses the full multivariate model `mpg ~ wt + hp` (`hp` held at its mean), drawn over a fine `wt` grid. Build the grid, call `predict()` with `interval = "confidence"`, and save the ggplot object to `ex_6_5`.

**Expected result:**

```
#> # ggplot rendered: smooth line from wt = 1.5 to 5.5
#> # narrow CI ribbon, points coloured by hp
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
grid <- data.frame(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 100),
                   hp = mean(mtcars$hp))
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
grid <- data.frame(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 100),
                   hp = mean(mtcars$hp))
pr <- as.data.frame(predict(fit, newdata = grid, interval = "confidence"))
grid <- cbind(grid, pr)

ex_6_5 <- ggplot() +
  geom_point(data = mtcars, aes(wt, mpg, colour = hp)) +
  geom_ribbon(data = grid, aes(wt, ymin = lwr, ymax = upr), alpha = 0.2) +
  geom_line(data = grid, aes(wt, fit)) +
  labs(title = "Predicted mpg by weight (hp at its mean)", x = "wt", y = "mpg")
ex_6_5
#> ggplot rendered: predicted-mpg line from a multivariate fit
#> hp held constant at the sample mean; ribbon shows mean-response CI
```

**Explanation:** `geom_smooth()` only knows about the variables in the aesthetic, so it cannot show a multivariate regression line. Building your own grid and calling `predict()` is the correct pattern when you have multiple predictors. The "hold the others at their mean" choice is one of many; you can plot a slice at each of several `hp` levels by `expand_grid()` to communicate how the partial effect varies with another covariate.

</details>

### Exercise 6.6: Save a fitted model to disk and reload it

**Task:** An MLOps engineer wants to persist a fitted `mpg ~ wt + hp` model to disk, reload it in a fresh session, and predict on `mtcars[1, ]`. Use `saveRDS()` and `readRDS()` (write to a temp file via `tempfile()`); save the predicted value to `ex_6_6`.

**Expected result:**

```
#> Mazda RX4 
#>  23.57250
```

**Difficulty:** Advanced

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
path <- tempfile(fileext = ".rds")
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
path <- tempfile(fileext = ".rds")
saveRDS(fit, path)
loaded <- readRDS(path)
ex_6_6 <- predict(loaded, newdata = mtcars[1, ])
ex_6_6
#> Mazda RX4 
#>  23.57250
```

**Explanation:** `saveRDS()`/`readRDS()` serialise a single R object including `lm`'s entire `model.frame()` (training data is embedded by default). Two cautions: the file is not portable across R major versions, and embedded data may leak sensitive predictors. To shrink the file, strip non-essentials with `strip_glm()` patterns or pass `data = ...` lazily. For production deployment behind an API, prefer `vetiver` or model translation to a portable format like ONNX or PMML.

</details>

### Exercise 6.7: Use HC3 heteroscedasticity-consistent standard errors

**Task:** A reviewer reports the Breusch-Pagan test rejected for the diamonds price model and wants robust HC3 standard errors instead of the OLS ones. Use `sandwich::vcovHC(fit, type = "HC3")` and `lmtest::coeftest()`; save the printed coefficient test to `ex_6_7`.

**Expected result:**

```
#> 
#> t test of coefficients:
#> 
#>              Estimate Std. Error t value  Pr(>|t|)    
#> (Intercept) 6.2150e+0  4.6112e-3 1347.85 < 2.2e-16 ***
#> carat       1.9698e+0  5.6230e-3  350.31 < 2.2e-16 ***
#> ---
```

**Difficulty:** Advanced

```r title="Your turn"
fit <- lm(log(price) ~ carat, data = diamonds)
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(log(price) ~ carat, data = diamonds)
ex_6_7 <- coeftest(fit, vcov = vcovHC(fit, type = "HC3"))
ex_6_7
#> 
#> t test of coefficients:
#> 
#>              Estimate Std. Error t value  Pr(>|t|)    
#> (Intercept) 6.2150e+0  4.6112e-3 1347.85 < 2.2e-16 ***
#> carat       1.9698e+0  5.6230e-3  350.31 < 2.2e-16 ***
#> ---
```

**Explanation:** Heteroscedasticity-consistent (White / sandwich) standard errors stay valid when residual variance is not constant. HC3 is the small-sample-adjusted version recommended by Long and Ervin (2000) and should be the default for cross-sectional data. Coefficients themselves are unchanged: only the standard errors, t-statistics, and p-values shift. For panel or clustered data, swap in `vcovCL(fit, cluster = ~ group)` to also handle within-cluster correlation.

</details>

### Exercise 6.8: Bootstrap a prediction interval for a future observation

**Task:** A statistician wants a non-parametric 95% prediction interval at `wt = 3.5`, `hp = 150` for `mpg ~ wt + hp` on `mtcars`. Bootstrap 1000 fitted means and add a normal residual draw to each; save the named numeric vector `c(lower, upper)` to `ex_6_8`.

**Expected result:**

```
#>    lower    upper 
#> 13.21472 23.51208
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(99)
newx <- data.frame(wt = 3.5, hp = 150)
B <- 1000
n <- nrow(mtcars)
ex_6_8 <- # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
newx <- data.frame(wt = 3.5, hp = 150)
B <- 1000
n <- nrow(mtcars)

draws <- replicate(B, {
  rows <- sample.int(n, n, replace = TRUE)
  fit_b <- lm(mpg ~ wt + hp, data = mtcars[rows, ])
  mu    <- predict(fit_b, newdata = newx)
  mu + rnorm(1, 0, summary(fit_b)$sigma)
})
ex_6_8 <- setNames(quantile(draws, c(0.025, 0.975)), c("lower", "upper"))
ex_6_8
#>    lower    upper 
#> 13.21472 23.51208
```

**Explanation:** A bootstrap prediction interval combines uncertainty in the regression line (resampling rows refits a slightly different model each iteration) with residual scatter (one random normal draw added per iteration). The result is wider than a confidence-only bootstrap, exactly like the textbook PI is wider than the CI. The benefit over the closed-form `interval = "prediction"` is that it does not assume Gaussian residuals; if you saw a fat-tailed Q-Q plot, this is the safer interval.

</details>

## What to do next

- Back to the core lesson: [Linear Regression in R](Linear-Regression.html)
- For assumption checks in depth: [Assumptions of Linear Regression](Assumptions-of-Linear-Regression.html)
- Outputs and diagnostics walkthrough: [Interpreting Regression Output Completely](Interpreting-Regression-Output-Completely.html)
- Next regression family to drill: [Logistic Regression in R](Logistic-Regression-With-R.html)
