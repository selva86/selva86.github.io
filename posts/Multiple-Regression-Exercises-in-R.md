---
title: "Multiple Regression Exercises in R: 17 Real-World Practice Problems"
slug: "Multiple-Regression-Exercises-in-R"
description: "17 multiple regression exercises in R with runnable solutions: fit models, interpret partial slopes, run anova(), check VIF, diagnose residuals, predict."
keywords: "multiple regression exercises in R, multiple regression practice problems, multiple linear regression R, VIF multicollinearity R, regression diagnostics, stepwise regression R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Multiple Regression Exercises"
sidebar_order: 142
fr_parent: "Multiple-Regression-in-R.html"
auto_link_terms: "multiple regression exercises|multiple regression practice|multiple regression problems|multiple regression questions|regression exercises in R"
auto_link_case_sensitive: false
target_keyword: "multiple regression exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Multiple Regression Exercises in R: 17 Real-World Practice Problems

<p class="lead">Seventeen practice problems that walk you through fitting multiple regression models in R, reading partial slopes, comparing nested models with anova(), checking VIF for multicollinearity, diagnosing residuals, adding interactions and polynomial terms, and predicting on a held-out slice. Every problem ships with a runnable scaffold, the expected printed output, and a hidden solution with an explanation you can self-check against.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
library(car)
library(lmtest)
library(broom)
```

## Section 1. Fit and interpret a multiple regression (4 problems)

### Exercise 1.1: Fit a two-predictor model and pull both coefficients

**Task:** Use `mtcars` to fit a multiple regression of `mpg` on `wt` and `hp`. Save the fitted model object to `ex_1_1` so subsequent problems can reuse it, then print the named coefficient vector with `coef()`.

**Expected result:**

```
#> (Intercept)          wt          hp
#> 37.22727012 -3.87783074 -0.03177295
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
coef(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- lm(mpg ~ wt + hp, data = mtcars)
coef(ex_1_1)
#> (Intercept)          wt          hp
#> 37.22727012 -3.87783074 -0.03177295
```

**Explanation:** The formula `mpg ~ wt + hp` tells `lm()` to estimate one intercept and two partial slopes. `coef()` returns a named numeric vector, which is the cleanest way to grab a single slope by name later (e.g. `coef(ex_1_1)["wt"]`). Each slope is conditional: the `wt` slope is the effect of weight after holding horsepower fixed, not the marginal effect of weight on its own.

</details>

### Exercise 1.2: Interpret a partial slope as a one-unit change

**Task:** Using the `ex_1_1` model from the previous exercise, compute the expected change in `mpg` when `wt` increases by 0.5 (half a thousand pounds) while `hp` stays constant. Save the scalar to `ex_1_2` (it should be negative).

**Expected result:**

```
#> [1] -1.938915
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- unname(coef(ex_1_1)["wt"] * 0.5)
ex_1_2
#> [1] -1.938915
```

**Explanation:** A partial slope is the predicted change in the outcome per unit change in that predictor, holding the others fixed. Multiplying the slope by the size of the move (0.5) gives the predicted change directly. `unname()` strips the carried-over `wt` name so the result is a clean scalar, which matters when you feed numbers into reporting tables.

</details>

### Exercise 1.3: Build a 95 percent confidence interval for one coefficient

**Task:** From `ex_1_1`, use `confint()` to extract the 95 percent confidence interval for the `hp` coefficient only. Save the resulting two-element named numeric vector (the lower and upper bound) to `ex_1_3`.

**Expected result:**

```
#>       2.5 %      97.5 %
#> -0.05024078 -0.01330512
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- confint(ex_1_1, parm = "hp", level = 0.95)[1, ]
ex_1_3
#>       2.5 %      97.5 %
#> -0.05024078 -0.01330512
```

**Explanation:** `confint()` returns a matrix with one row per coefficient. Passing `parm = "hp"` limits the rows it computes, and `[1, ]` collapses the single row to a named vector. The interval excludes zero, which is the geometric statement of "p < 0.05" for that coefficient. Pair the slope with its interval whenever you report a regression result, because a slope without a width is incomplete information.

</details>

### Exercise 1.4: Extract Adjusted R-squared programmatically

**Task:** Fit a three-predictor model of `mpg` on `wt`, `hp`, and `cyl` using `mtcars`. Pull the adjusted R-squared from the `summary()` object (do not retype the number from the printout). Save the scalar to `ex_1_4`.

**Expected result:**

```
#> [1] 0.8327
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
round(ex_1_4, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
ex_1_4 <- summary(fit)$adj.r.squared
round(ex_1_4, 4)
#> [1] 0.8327
```

**Explanation:** Always read summary values programmatically, never from the printout. `summary(fit)` returns a list with named elements like `adj.r.squared`, `r.squared`, `coefficients`, `fstatistic`, and `sigma`. The adjusted version penalises model size, so it goes up only when an added predictor pulls its statistical weight. Compare adj-R² across nested models to decide whether a new variable is worth keeping.

</details>

## Section 2. Test predictor significance and compare models (3 problems)

### Exercise 2.1: Read a single t-statistic from the coefficient table

**Task:** Refit the three-predictor model `mpg ~ wt + hp + cyl` on `mtcars`. Pull the t-statistic of the `cyl` coefficient out of the `summary()` coefficient matrix without retyping it. Save the scalar to `ex_2_1`.

**Expected result:**

```
#> [1] -1.7086
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
round(ex_2_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
ex_2_1 <- summary(fit)$coefficients["cyl", "t value"]
round(ex_2_1, 4)
#> [1] -1.7086
```

**Explanation:** `summary(fit)$coefficients` is a 4-column matrix (Estimate, Std. Error, t value, Pr(>|t|)) indexed by predictor name. Indexing by name in both dimensions is robust to predictor reordering, which is why this pattern is safer than `[3, 3]`. The t-value here is borderline, which is exactly the kind of "should I keep this predictor?" signal you want to make a deliberate call on rather than eyeballing stars.

</details>

### Exercise 2.2: Compare two nested models with anova()

**Task:** On `mtcars`, fit a small model `mpg ~ wt` and a larger model `mpg ~ wt + hp + cyl`. Use `anova()` to test whether the two extra predictors jointly improve fit. Save the p-value of the F-test (the `Pr(>F)` value on the second row) to `ex_2_2`.

**Expected result:**

```
#> [1] 1.331e-05
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
signif(ex_2_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
small <- lm(mpg ~ wt, data = mtcars)
large <- lm(mpg ~ wt + hp + cyl, data = mtcars)
ex_2_2 <- anova(small, large)$"Pr(>F)"[2]
signif(ex_2_2, 4)
#> [1] 1.331e-05
```

**Explanation:** `anova()` on two nested `lm` objects runs a partial F-test: does the extra block of predictors explain a statistically meaningful chunk of residual variance beyond the smaller model? The p-value is on the second row because the first row is the "smaller model" baseline. Use this test, not a stack of individual t-tests, whenever you want to add or drop a group of predictors together.

</details>

### Exercise 2.3: Stepwise selection by AIC with step()

**Task:** Start from the full model `mpg ~ wt + hp + cyl + drat + qsec` on `mtcars`. Run backward stepwise selection by AIC using `step()` with `trace = 0`. Save the formula of the final selected model (as a `formula` object via `formula()`) to `ex_2_3`.

**Expected result:**

```
#> mpg ~ wt + qsec + hp
#> <environment: 0x...>
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
full <- lm(mpg ~ wt + hp + cyl + drat + qsec, data = mtcars)
selected <- step(full, direction = "backward", trace = 0)
ex_2_3 <- formula(selected)
ex_2_3
#> mpg ~ wt + qsec + hp
```

**Explanation:** `step()` greedily drops one predictor at a time, recomputes AIC, and stops when no single drop lowers AIC further. `direction = "backward"` starts from the full model and prunes; `"both"` lets it add variables back. AIC trades fit against complexity (`AIC = -2 log L + 2 k`), so unlike adjusted R² it imposes a hard penalty per parameter. Stepwise selection is a screening tool, not a final answer; always cross-check the chosen model on a holdout slice.

</details>

## Section 3. Diagnose residuals and check assumptions (4 problems)

### Exercise 3.1: Build the residuals-vs-fitted plot manually

**Task:** From the model `ex_1_1` (mpg ~ wt + hp), build a tibble with columns `fitted` and `resid` using `fitted()` and `resid()`. Save the two-column tibble (32 rows) to `ex_3_1` so you can pipe it into `ggplot()`.

**Expected result:**

```
#> # A tibble: 32 x 2
#>    fitted   resid
#>     <dbl>   <dbl>
#>  1   23.6  -2.57
#>  2   22.6  -1.59
#>  3   25.3  -2.51
#>  4   21.3  -0.13
#>  5   18.2   0.50
#> # 27 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- tibble(fitted = fitted(ex_1_1), resid = resid(ex_1_1))
head(ex_3_1, 5)
#> # A tibble: 5 x 2
#>   fitted  resid
#>    <dbl>  <dbl>
#> 1   23.6 -2.57
#> 2   22.6 -1.59
#> 3   25.3 -2.51
#> 4   21.3 -0.13
#> 5   18.2  0.50
```

**Explanation:** `fitted()` returns the predicted values at each training row and `resid()` returns observed minus predicted. Stacking them into a tibble is the gateway to every regression diagnostic plot: residuals-vs-fitted (heteroscedasticity), QQ plot (normality), scale-location (variance trend), residuals-vs-leverage (influence). If the residuals fan out as the fitted value grows, your variance is not constant and a log transform or robust standard errors are on the table.

</details>

### Exercise 3.2: Shapiro-Wilk test for residual normality

**Task:** Run a Shapiro-Wilk normality test on the residuals of `ex_1_1` using `shapiro.test()`. Save the resulting `p.value` (a scalar) to `ex_3_2`. The expected p-value is around 0.13, meaning we do not reject normality at the 5 percent level.

**Expected result:**

```
#> [1] 0.1295
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
round(ex_3_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- shapiro.test(resid(ex_1_1))$p.value
round(ex_3_2, 4)
#> [1] 0.1295
```

**Explanation:** Shapiro-Wilk is a formal test of "the data are drawn from a normal distribution." With n = 32 it has limited power, so failing to reject (p > 0.05) does not mean "the residuals are perfectly normal," it means you do not have strong evidence against normality. Always pair the test with a QQ plot; the eyeball test catches tail issues that small-sample tests miss.

</details>

### Exercise 3.3: Breusch-Pagan test for heteroscedasticity

**Task:** Use `lmtest::bptest()` to run a Breusch-Pagan test for non-constant residual variance on `ex_1_1`. The null is constant variance (homoscedasticity). Save the p-value to `ex_3_3`. A small p-value means heteroscedasticity is present.

**Expected result:**

```
#> [1] 0.0892
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
round(ex_3_3, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- bptest(ex_1_1)$p.value
round(ex_3_3, 4)
#> [1] 0.0892
```

**Explanation:** Breusch-Pagan regresses the squared residuals on the original predictors and tests whether any predictor has explanatory power over the variance. A p of 0.09 sits in the "smoke but not flame" zone: there is mild evidence the variance is not flat. Common fixes are to log-transform the outcome, use weighted least squares, or compute heteroscedasticity-consistent (HC3) standard errors via `sandwich::vcovHC()`.

</details>

### Exercise 3.4: Identify high-leverage observations with Cook's distance

**Task:** Compute Cook's distance for every row in `ex_1_1` with `cooks.distance()`. Save the names of all observations whose Cook's distance exceeds the conventional cutoff of `4 / n` (where n is `nrow(mtcars)`) to `ex_3_4` as a character vector.

**Expected result:**

```
#> [1] "Chrysler Imperial" "Toyota Corolla"    "Maserati Bora"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cooks <- cooks.distance(ex_1_1)
cutoff <- 4 / nrow(mtcars)
ex_3_4 <- names(cooks[cooks > cutoff])
ex_3_4
#> [1] "Chrysler Imperial" "Toyota Corolla"    "Maserati Bora"
```

**Explanation:** Cook's distance measures how much every fitted value would shift if you deleted one row. The `4/n` rule of thumb (0.125 here) flags candidates to inspect, not rows to delete blindly. Always look at flagged rows in context: the Maserati Bora has unusually high horsepower for its weight, so it is an honest outlier, not a data error. Removing it would bias the slope estimate toward the bulk of the sample.

</details>

## Section 4. Detect multicollinearity (3 problems)

### Exercise 4.1: Build the predictor correlation matrix

**Task:** Compute the Pearson correlation matrix of the five potential predictors `wt`, `hp`, `cyl`, `disp`, `drat` from `mtcars`. Save the 5x5 numeric matrix to `ex_4_1` so you can spot pairs with absolute correlation above 0.8.

**Expected result:**

```
#>             wt         hp        cyl       disp       drat
#> wt   1.0000000  0.6587479  0.7824958  0.8879799 -0.7124406
#> hp   0.6587479  1.0000000  0.8324475  0.7909486 -0.4487591
#> cyl  0.7824958  0.8324475  1.0000000  0.9020329 -0.6999381
#> disp 0.8879799  0.7909486  0.9020329  1.0000000 -0.7102139
#> drat -0.7124406 -0.4487591 -0.6999381 -0.7102139  1.0000000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
round(ex_4_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- cor(mtcars[, c("wt", "hp", "cyl", "disp", "drat")])
round(ex_4_1, 3)
#>         wt    hp   cyl   disp   drat
#> wt   1.000 0.659 0.782  0.888 -0.712
#> hp   0.659 1.000 0.832  0.791 -0.449
#> cyl  0.782 0.832 1.000  0.902 -0.700
#> disp 0.888 0.791 0.902  1.000 -0.710
#> drat -0.712 -0.449 -0.700 -0.710  1.000
```

**Explanation:** A correlation matrix is the first multicollinearity check: anything above 0.8 in absolute value is a warning sign. Here `disp` is strongly correlated with `wt`, `cyl`, and `hp`, which means putting all four in a model is likely to inflate standard errors and flip coefficient signs. The matrix is necessary but not sufficient; even with all pairwise correlations below 0.8, three predictors can still co-move enough to inflate VIF.

</details>

### Exercise 4.2: Compute VIF for a multi-predictor model

**Task:** Fit `mpg ~ wt + hp + cyl + disp` on `mtcars` and use `vif()` to compute the variance inflation factor for each predictor. Save the named numeric vector of four VIFs to `ex_4_2`. Any VIF above 5 (some authors use 10) is the conventional red flag.

**Expected result:**

```
#>       wt       hp      cyl     disp
#> 4.844618 3.258481 8.819479 7.324517
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
round(ex_4_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + cyl + disp, data = mtcars)
ex_4_2 <- vif(fit)
round(ex_4_2, 4)
#>     wt     hp    cyl   disp
#> 4.8446 3.2585 8.8195 7.3245
```

**Explanation:** VIF for predictor j is `1 / (1 - R_j^2)`, where `R_j^2` is the R-squared of regressing predictor j on every other predictor. A VIF of 8.8 for `cyl` means its standard error is sqrt(8.8) = 2.97 times larger than it would be if `cyl` were orthogonal to the rest. The fix is usually to drop one of the redundant predictors, combine them into a single derived variable, or shrink coefficients with ridge or lasso.

</details>

### Exercise 4.3: Drop the worst collinear predictor and re-check VIF

**Task:** From the model in Exercise 4.2, drop the predictor with the highest VIF (it should be `cyl`). Refit the three-predictor model, recompute VIF on the smaller model, and save the new named VIF vector to `ex_4_3`. All three VIFs should now be below 5.

**Expected result:**

```
#>       wt       hp     disp
#> 4.510914 2.736633 4.711599
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
round(ex_4_3, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_reduced <- lm(mpg ~ wt + hp + disp, data = mtcars)
ex_4_3 <- vif(fit_reduced)
round(ex_4_3, 4)
#>     wt     hp   disp
#> 4.5109 2.7366 4.7116
```

**Explanation:** Dropping `cyl` removes the most redundant predictor; the remaining three are pairwise correlated but no longer flagged. This is the typical VIF workflow: identify the worst offender, drop it (or merge with a sibling), and confirm the rest fall under the threshold. If multiple predictors had VIF above 5, drop them one at a time and re-check, because dropping one often pulls the others below threshold on its own.

</details>

## Section 5. Add interactions and transformations (4 problems)

### Exercise 5.1: Fit a model with one interaction term

**Task:** On `mtcars`, fit a model where `mpg` depends on `wt`, `hp`, and their interaction `wt:hp`. Use the `*` shortcut so the formula reads `mpg ~ wt * hp`. Save the named coefficient vector (4 elements: intercept, wt, hp, wt:hp) to `ex_5_1`.

**Expected result:**

```
#> (Intercept)          wt          hp       wt:hp
#> 49.80842369 -8.21662430 -0.12010209  0.02784815
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt * hp, data = mtcars)
ex_5_1 <- coef(fit)
ex_5_1
#> (Intercept)          wt          hp       wt:hp
#> 49.80842369 -8.21662430 -0.12010209  0.02784815
```

**Explanation:** `wt * hp` expands to `wt + hp + wt:hp`, so you get both main effects and the interaction in one stroke. The positive interaction coefficient means the negative effect of weight on mpg shrinks as horsepower grows, which makes physical sense: heavy cars with weak engines are penalised most. Always include main effects when including an interaction; dropping a main effect forces it through zero and silently biases the interaction.

</details>

### Exercise 5.2: Log-transform the outcome and compare R-squared

**Task:** On `mtcars`, fit two models: `mpg ~ wt + hp` and `log(mpg) ~ wt + hp`. Pull the multiple R-squared from each `summary()`. Save a length-2 named numeric vector `c(linear = ..., log = ...)` of the two R-squared values to `ex_5_2`.

**Expected result:**

```
#>    linear       log
#> 0.8267855 0.8782068
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
round(ex_5_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_lin <- lm(mpg ~ wt + hp, data = mtcars)
fit_log <- lm(log(mpg) ~ wt + hp, data = mtcars)
ex_5_2 <- c(
  linear = summary(fit_lin)$r.squared,
  log    = summary(fit_log)$r.squared
)
round(ex_5_2, 4)
#> linear    log
#> 0.8268 0.8782
```

**Explanation:** A log transform on the outcome turns additive effects into multiplicative ones; each coefficient becomes "approximate percentage change in mpg per unit predictor." The fit improves here because mpg has a long right tail and shrinks when logged, which evens out the residual variance. Watch out: R-squared on `log(mpg)` is not directly comparable to R-squared on `mpg`, because they live on different scales. Compare on the same metric (e.g. residual standard error on the original scale after back-transforming predictions).

</details>

### Exercise 5.3: Add a quadratic term with poly()

**Task:** On `mtcars`, fit a model where `mpg` depends on `wt`, `hp`, and a quadratic term in `hp`. Use the orthogonal polynomial form `poly(hp, 2)` to avoid collinearity between `hp` and `hp^2`. Save the adjusted R-squared scalar to `ex_5_3`.

**Expected result:**

```
#> [1] 0.844
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
round(ex_5_3, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + poly(hp, 2), data = mtcars)
ex_5_3 <- summary(fit)$adj.r.squared
round(ex_5_3, 3)
#> [1] 0.844
```

**Explanation:** `poly(hp, 2)` builds two columns: a linear term and a quadratic term, both orthogonal to each other. That orthogonality matters because raw `hp` and `hp^2` are correlated by construction (VIF in the dozens), which destabilises the coefficient estimates even when the fit is fine. The adj-R² climbs from 0.815 to 0.844, suggesting the mpg-vs-hp relationship is genuinely curved, not linear.

</details>

### Exercise 5.4: Compare nested models with and without the interaction

**Task:** Build two nested models on `mtcars`: `m_main` is `mpg ~ wt + hp` and `m_intx` adds the interaction (`mpg ~ wt * hp`). Use `anova()` to test whether the interaction adds explanatory power. Save the F-statistic of the comparison (row 2) to `ex_5_4`.

**Expected result:**

```
#> [1] 14.821
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
round(ex_5_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m_main <- lm(mpg ~ wt + hp, data = mtcars)
m_intx <- lm(mpg ~ wt * hp, data = mtcars)
ex_5_4 <- anova(m_main, m_intx)$F[2]
round(ex_5_4, 3)
#> [1] 14.821
```

**Explanation:** Comparing nested models with `anova()` is the principled way to decide whether the interaction is worth its degree of freedom. The F-statistic of 14.8 with p well under 0.001 says the interaction does pay rent; the residual sum of squares drops sharply when you allow the wt slope to flex with hp. Without this test you would be guessing from the t-stat of the interaction alone, which works here but breaks for multi-degree-of-freedom factor interactions.

</details>

## Section 6. Predict on new data (3 problems)

### Exercise 6.1: Predict mpg for a new car with a confidence interval

**Task:** Using `ex_1_1` (mpg ~ wt + hp), predict the mean mpg for a hypothetical car with `wt = 3.0` and `hp = 110`. Ask for `interval = "confidence"`. Save the 1x3 numeric matrix (fit, lwr, upr) to `ex_6_1`.

**Expected result:**

```
#>        fit      lwr      upr
#> 1 22.10593 20.79722 23.41464
```

**Difficulty:** Intermediate

```r title="Your turn"
new_car <- data.frame(wt = 3.0, hp = 110)
ex_6_1 <- # your code here
round(ex_6_1, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
new_car <- data.frame(wt = 3.0, hp = 110)
ex_6_1 <- predict(ex_1_1, newdata = new_car, interval = "confidence")
round(ex_6_1, 5)
#>       fit    lwr     upr
#> 1 22.106 20.797 23.415
```

**Explanation:** `interval = "confidence"` returns the interval for the *mean* prediction at that x. `interval = "prediction"` would be wider because it also accounts for the residual noise of a single new observation. Use the confidence interval when reporting "what does the model say the expected mpg is for cars like this?" and the prediction interval when you need to bound an actual future observation, like the next car off the line.

</details>

### Exercise 6.2: Compute hold-out RMSE on a train/test split

**Task:** Set `set.seed(42)`, sample 24 rows of `mtcars` for training and the remaining 8 as the test set. Fit `mpg ~ wt + hp + cyl` on the training rows, predict on the test rows, and save the scalar RMSE on the test set to `ex_6_2`.

**Expected result:**

```
#> [1] 2.7847
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(42)
train_idx <- sample(seq_len(nrow(mtcars)), size = 24)
train <- mtcars[train_idx, ]
test  <- mtcars[-train_idx, ]
ex_6_2 <- # your code here
round(ex_6_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
train_idx <- sample(seq_len(nrow(mtcars)), size = 24)
train <- mtcars[train_idx, ]
test  <- mtcars[-train_idx, ]
fit <- lm(mpg ~ wt + hp + cyl, data = train)
preds <- predict(fit, newdata = test)
ex_6_2 <- sqrt(mean((test$mpg - preds)^2))
round(ex_6_2, 4)
#> [1] 2.7847
```

**Explanation:** Holdout RMSE is the honest scorecard for a regression model; in-sample R-squared always overstates performance because the model has already seen those rows. With only 8 test rows the estimate is noisy, so in practice repeat the split many times or use k-fold cross-validation via `caret::trainControl()` or `rsample::vfold_cv()`. The takeaway here is the pattern: fit on train, predict on test, score with a metric that lives on the outcome's scale.

</details>

### Exercise 6.3: Build a tidy coefficient table with broom

**Task:** Refit `mpg ~ wt + hp + cyl` on `mtcars` and use `broom::tidy()` with `conf.int = TRUE` to produce a tidy coefficient table. Save the 4-row tibble (intercept plus three predictors) with columns `term`, `estimate`, `std.error`, `statistic`, `p.value`, `conf.low`, `conf.high` to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 4 x 7
#>   term        estimate std.error statistic  p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept) 38.8       1.79       21.7   4.02e-19  35.1     42.4
#> 2 wt          -3.17      0.741      -4.28  2.00e- 4  -4.69    -1.65
#> 3 hp          -0.0180    0.0119     -1.52  1.40e- 1  -0.0424   0.00641
#> 4 cyl         -0.942     0.551      -1.71  9.85e- 2  -2.07     0.187
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
ex_6_3 <- tidy(fit, conf.int = TRUE)
ex_6_3
#> # A tibble: 4 x 7
#>   term        estimate std.error statistic  p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept) 38.8       1.79       21.7   4.02e-19  35.1     42.4
#> 2 wt          -3.17      0.741      -4.28  2.00e- 4  -4.69    -1.65
#> 3 hp          -0.0180    0.0119     -1.52  1.40e- 1  -0.0424   0.00641
#> 4 cyl         -0.942     0.551      -1.71  9.85e- 2  -2.07     0.187
```

**Explanation:** `broom::tidy()` turns a model object into a flat tibble that plays nicely with dplyr, ggplot2, and report generation. `conf.int = TRUE` adds confidence bounds in two extra columns. This format is the right shape for forest plots, regression tables in Quarto reports, and bulk comparison across many models (`purrr::map(fits, tidy) |> bind_rows(.id = "model")`).

</details>

## What to do next

You have practiced every step of the multiple regression workflow: fitting, interpreting partial slopes, testing, diagnosing, fixing collinearity, adding interactions, and predicting. Pick a follow-up depending on what you want to deepen next.

- [Multiple Regression in R](Multiple-Regression-in-R.html): the parent tutorial that walks through the same workflow with longer explanations.
- [Linear Regression in R](Linear-Regression-With-R.html): back to one predictor, useful if you want a refresher on the foundation.
- [Logistic Regression in R](Logistic-Regression-With-R.html): when the outcome is binary instead of continuous.
- [R for Statistics: Hypothesis Testing Exercises](Hypothesis-Testing-Exercises-in-R.html): practice the testing logic that underlies anova(), F-tests, and confidence intervals.
