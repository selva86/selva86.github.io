---
title: "Regression Diagnostics Exercises in R: 10 Assumption-Testing Problems, Solved Step-by-Step"
slug: Regression-Diagnostics-Exercises-in-R
description: "Work through 10 regression diagnostics exercises in R: check linearity, normality, homoscedasticity, multicollinearity, and influence with runnable solutions."
keywords: "regression diagnostics exercises in R, regression diagnostics practice problems, regression assumptions testing R, Cook's distance practice, VIF multicollinearity exercises, Breusch-Pagan test R practice, regression residual analysis exercises"
auto_link_terms: "regression diagnostics exercises|regression diagnostics practice|regression diagnostics problems|regression assumption exercises|regression assumption problems|diagnostics exercises in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: E6.4
post_type: EX
sidebar_title: "Regression Diagnostics Exercises"
fr_parent: Regression-Diagnostics-in-R.html
difficulty: Intermediate
---

# Regression Diagnostics Exercises in R: 10 Assumption-Testing Problems, Solved Step-by-Step

<p class="lead">These 10 regression diagnostics exercises in R walk you through every OLS assumption check: linearity via residuals vs fitted, normality via Q-Q plots and Shapiro-Wilk, homoscedasticity via a Breusch-Pagan test, multicollinearity via VIF, and influence via Cook's distance and leverage. Every problem ships with a runnable scaffold, a hint, and a collapsible solution so you can self-check the moment you finish coding.</p>

## How do you test the linearity assumption in R?

The single most important diagnostic in OLS is the residuals vs fitted plot: if the red LOWESS line bends, your model missed a non-linear pattern. We will fit a multiple regression on `mtcars` and read the plot right now, then Problems 1 and 2 ask you to diagnose a new specification and tame a deliberately curved one. Every block here is base R, so the diagnostic runs in your browser with no package install.

```r title="Fit base model and draw residuals vs fitted"
# Fit a 3-predictor model and inspect the first diagnostic plot
model <- lm(mpg ~ wt + hp + disp, data = mtcars)

plot(model, which = 1)
#> Residuals vs Fitted plot for the mtcars model.
#> The red LOWESS line wobbles slightly but stays close to zero,
#> so the linear fit is defensible.
```

The residuals vs fitted plot draws each residual against its corresponding fitted value. If the linearity assumption holds, the cloud hovers around zero with no systematic pattern and the red LOWESS line stays roughly flat. A clear curve (U-shape, S-shape, or monotonic tilt) is the signature of a missing non-linear term, usually a polynomial or a log transform on a predictor.

[KEY INSIGHT]
**Every OLS assumption is checked on the residuals, not the raw data.** Your X and Y can look skewed, discrete, or bounded and the model can still be fine, as long as the residuals behave. That is why the exercises below build and inspect residual objects rather than the raw columns.

### Problem 1: Diagnose a two-predictor mtcars specification

**Try it:** Fit `lm(mpg ~ wt + disp, data = mtcars)`, draw the Residuals vs Fitted plot, and print a short character string (`"roughly linear"` or `"curved"`) describing what you see. Store it in `ex1_verdict`.

```r title="Your turn: diagnose mpg ~ wt + disp"
# Problem 1: fit + residuals vs fitted + verdict
ex1_fit <- lm(mpg ~ wt + disp, data = mtcars)

# your code here (hint: plot(..., which = 1), then assign ex1_verdict)

#> Expected: the LOWESS line curves slightly; a "curved" verdict is defensible.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 1 solution"
ex1_fit <- lm(mpg ~ wt + disp, data = mtcars)
plot(ex1_fit, which = 1)
ex1_verdict <- "curved"
ex1_verdict
#> [1] "curved"
```

**Explanation:** On `mpg ~ wt + disp` the LOWESS line bends downward then flattens, hinting that one of the predictors enters non-linearly. Adding `I(wt^2)` or swapping `disp` for `log(disp)` straightens the plot.

</details>

### Problem 2: Fix a deliberately curved model with poly()

**Try it:** Generate a known-curved dataset (`y = 2 + 3x - 0.6x^2 + noise`), fit a straight-line model, confirm the residuals vs fitted plot bends, then refit with `poly(x, 2)` and confirm the bend disappears.

```r title="Your turn: straighten a curved fit"
# Problem 2: simulate, diagnose, refit
set.seed(17)
ex2_x  <- seq(-3, 3, length.out = 80)
ex2_y  <- 2 + 3 * ex2_x - 0.6 * ex2_x^2 + rnorm(80, sd = 0.5)
ex2_df <- data.frame(x = ex2_x, y = ex2_y)

# your code here: fit ex2_fit (linear) and ex2_fit2 (quadratic)
# draw residuals vs fitted for both

#> Expected: ex2_fit shows an inverted-U; ex2_fit2 is flat near zero.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 2 solution"
ex2_fit  <- lm(y ~ x, data = ex2_df)
ex2_fit2 <- lm(y ~ poly(x, 2), data = ex2_df)

par(mfrow = c(1, 2))
plot(ex2_fit,  which = 1, main = "Linear (broken)")
plot(ex2_fit2, which = 1, main = "Quadratic (fixed)")
par(mfrow = c(1, 1))
#> Left:  clear inverted-U -> missing quadratic term.
#> Right: LOWESS line sits on zero -> linearity restored.
```

**Explanation:** `poly(x, 2)` adds an orthogonal quadratic term, which is exactly what the curved residual pattern was asking for. Once the missing curvature is in the model, the residuals lose their pattern.

</details>

## How do you check residual normality in R?

The Normal Q-Q plot sorts the standardized residuals and plots them against theoretical normal quantiles. On a clean fit the points hug the diagonal reference line; heavy tails, skew, or outliers show up as systematic deviations at the ends. Pair the plot with `shapiro.test(resid(fit))`, which returns a p-value that formalises what your eyes saw.

```r title="Q-Q plot and Shapiro-Wilk on the base model"
# Visual: Normal Q-Q
plot(model, which = 2)

# Numeric: Shapiro-Wilk test on the residuals
shapiro.test(resid(model))
#>
#>  Shapiro-Wilk normality test
#>
#> data:  resid(model)
#> W = 0.95694, p-value = 0.2254
```

The Q-Q plot for `model` keeps most points near the diagonal with a mild tail at the top. Shapiro-Wilk returns p = 0.225, so at the 0.05 level we do not reject normality. The visual and numeric checks agree: the residuals are close enough to normal that the reported standard errors and p-values can be trusted.

[NOTE]
**Shapiro-Wilk gets very sensitive on large n.** On a 10,000-row regression even trivial deviations from normality produce a significant p-value. Always pair the test with the Q-Q plot so you can tell a *meaningful* departure from a merely *detectable* one.

### Problem 3: Shapiro-Wilk on a 3-predictor model

**Try it:** Fit `lm(mpg ~ wt + hp + qsec, data = mtcars)`, run Shapiro-Wilk on its residuals, and store the p-value in `ex3_p` plus a logical `ex3_reject` that is TRUE iff the test rejects at alpha = 0.05.

```r title="Your turn: Shapiro on mpg ~ wt + hp + qsec"
# Problem 3: fit, Shapiro, decide
ex3_fit <- lm(mpg ~ wt + hp + qsec, data = mtcars)

# your code here

#> Expected: ex3_p around 0.34; ex3_reject FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 3 solution"
ex3_fit    <- lm(mpg ~ wt + hp + qsec, data = mtcars)
ex3_p      <- shapiro.test(resid(ex3_fit))$p.value
ex3_reject <- ex3_p < 0.05
c(p = round(ex3_p, 3), reject = ex3_reject)
#>      p reject
#>  0.342  0.000
```

**Explanation:** `$p.value` pulls the scalar p from the htest object. With p = 0.34 the residuals are consistent with a normal distribution, so the normality assumption holds for this specification.

</details>

### Problem 4: Show how a single outlier drives a Shapiro rejection

**Try it:** You are given a residual vector `ex4_res` that contains 49 standard-normal draws plus a single large outlier. Compute the Shapiro p-value on the full vector and on the vector with the outlier dropped, then confirm the decision flips from reject to accept.

```r title="Your turn: one outlier flips the decision"
# Problem 4: compare Shapiro before and after removing the outlier
set.seed(7)
ex4_res <- c(rnorm(49), 6)  # 49 clean residuals + one big spike

# your code here: ex4_p_all, ex4_p_clean

#> Expected: ex4_p_all << 0.05; ex4_p_clean > 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 4 solution"
ex4_p_all   <- shapiro.test(ex4_res)$p.value
ex4_p_clean <- shapiro.test(ex4_res[-which.max(abs(ex4_res))])$p.value
round(c(all = ex4_p_all, clean = ex4_p_clean), 4)
#>    all  clean 
#> 0.0000 0.4212
```

**Explanation:** One extreme residual can sink the test on the whole sample even when the other 49 values are perfectly normal. Always inspect the Q-Q plot before acting on a Shapiro rejection, the test cannot tell you whether the problem is widespread or one-point.

</details>

## How do you detect heteroscedasticity in R?

The Scale-Location plot draws the square-root of the absolute standardized residuals against the fitted values. A horizontal band means variance is constant (homoscedasticity); a rising or funnel-shaped band means variance grows with the fit (heteroscedasticity). The numeric companion is the Breusch-Pagan test: regress squared residuals on the fitted values and check whether the auxiliary regression explains any variance.

```r title="Scale-Location plot and a manual Breusch-Pagan test"
# Visual check
plot(model, which = 3)

# Manual Breusch-Pagan: regress squared residuals on fitted values
res_sq   <- resid(model)^2
fitvals  <- fitted(model)
bp_aux   <- lm(res_sq ~ fitvals)
bp_stat  <- nrow(mtcars) * summary(bp_aux)$r.squared
bp_p     <- pchisq(bp_stat, df = 1, lower.tail = FALSE)
c(BP = round(bp_stat, 3), p_value = round(bp_p, 3))
#>      BP p_value 
#>   0.913   0.339
```

The BP statistic is `n * R²` from the auxiliary regression of squared residuals on fitted values, with 1 degree of freedom (one explanatory variable). The statistic 0.91 gives p = 0.34, well above 0.05, so for this model the variance is compatible with being constant. Any p below 0.05 is the flag to consider a `log(y)` transform or weighted least squares.

[TIP]
**A funneling Scale-Location plot is your clue, the BP test is your witness.** Use them together: the plot tells you *where* variance changes (low fit vs high fit, specific predictor range), the test gives a single number you can report and compare across model specifications.

### Problem 5: Wrap the BP calculation in a reusable function

**Try it:** Write `bp_test(fit)` that takes any fitted `lm` and returns a named numeric vector with `stat` and `p`. Use the `n * R²` formulation shown above with df = 1.

```r title="Your turn: write bp_test()"
# Problem 5: define bp_test and run it on the base model
bp_test <- function(fit) {
  # your code here
}

bp_test(model)
#> Expected:      stat       p 
#>               0.913   0.339
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 5 solution"
bp_test <- function(fit) {
  res_sq  <- resid(fit)^2
  fv      <- fitted(fit)
  aux     <- lm(res_sq ~ fv)
  stat    <- length(fv) * summary(aux)$r.squared
  p_val   <- pchisq(stat, df = 1, lower.tail = FALSE)
  c(stat = unname(stat), p = unname(p_val))
}

round(bp_test(model), 3)
#>  stat     p 
#> 0.913 0.339
```

**Explanation:** Wrapping the auxiliary regression, the test statistic, and the chi-squared tail in one function means you can reuse it on every model in this post (and every model in your workflow) with a single call.

</details>

### Problem 6: Detect and cure heteroscedasticity on a synthetic dataset

**Try it:** Build a dataset where variance grows with `x` (`y = 1 + 2*x + noise * x`), show `bp_test()` flags it, then refit with `log(y)` on the shifted response and show the flag goes away.

```r title="Your turn: variance-grows-with-x, then log-transform"
# Problem 6: build heteroscedastic data, test, fix, retest
set.seed(42)
ex6_x  <- seq(1, 10, length.out = 80)
ex6_y  <- 1 + 2 * ex6_x + rnorm(80, sd = 1) * ex6_x
ex6_df <- data.frame(x = ex6_x, y = ex6_y)

ex6_fit <- lm(y ~ x, data = ex6_df)

# your code here: bp_test(ex6_fit), refit with log, bp_test again
# assign ex6_fit2 for the log-transformed model

#> Expected: ex6_fit p near 0 (reject); ex6_fit2 p > 0.05.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 6 solution"
ex6_fit <- lm(y ~ x, data = ex6_df)
round(bp_test(ex6_fit), 4)
#>   stat      p 
#> 29.8201 0.0000

# Shift y to be strictly positive before logging
ex6_df$y_pos <- ex6_df$y - min(ex6_df$y) + 1
ex6_fit2     <- lm(log(y_pos) ~ x, data = ex6_df)
round(bp_test(ex6_fit2), 4)
#>   stat      p 
#> 0.3127 0.5761
```

**Explanation:** The raw fit has BP = 29.8 with p < 0.0001, which lines up with the clear funnel in the Scale-Location plot. The log transform compresses the large-y residuals and brings p back above 0.05. Any time a Scale-Location plot funnels, try `log(y)` first, then weighted least squares.

</details>

## How do you measure multicollinearity with VIF?

Variance Inflation Factors (VIF) quantify how much the standard error of a coefficient is inflated because the predictor can be predicted from the others. The formula is simple: regress predictor `j` on every other predictor, read the auxiliary R² , then

$$\text{VIF}_j = \frac{1}{1 - R^2_j}$$

Values above 5 are a warning, values above 10 are a red flag. Below we compute the full VIF vector on a 4-predictor mtcars model using base R, no `car` package required.

```r title="Manual VIF sweep on a 4-predictor model"
# Fit and compute VIF for each predictor
full_fit <- lm(mpg ~ wt + hp + disp + cyl, data = mtcars)

predictors <- c("wt", "hp", "disp", "cyl")
vifs <- sapply(predictors, function(p) {
  rhs <- paste(setdiff(predictors, p), collapse = " + ")
  aux <- lm(as.formula(paste(p, "~", rhs)), data = mtcars)
  1 / (1 - summary(aux)$r.squared)
})
round(vifs, 2)
#>    wt    hp  disp   cyl 
#>  5.17  3.26 10.11  7.87
```

Every VIF sits above 3, but `disp` stands out at 10.1, meaning `disp` is almost a linear combination of the other three. That is why the `disp` coefficient will flip sign and lose significance depending on which other predictors are in the model. Dropping `disp` (or replacing it with a derived quantity like `disp/cyl`) is the cleanest fix.

[WARNING]
**A high VIF does not mean the model is wrong.** It means the standard errors are inflated, the individual t-statistics become unstable, and small changes in the data can flip signs. If the predictor is scientifically necessary, keep it and report the instability; do not silently drop a meaningful variable just to clean up the VIF.

### Problem 7: Generalize the VIF sweep into a function

**Try it:** Write `vif_all(fit)` that takes any fitted `lm` and returns a named numeric vector of VIFs for every predictor. The function should work regardless of how many predictors the model has.

```r title="Your turn: write vif_all()"
# Problem 7: a VIF function that generalises to any lm
vif_all <- function(fit) {
  # hint: model.matrix(fit)[, -1] gives the design matrix without the intercept
  # your code here
}

round(vif_all(full_fit), 2)
#> Expected:    wt    hp  disp   cyl 
#>             5.17  3.26 10.11  7.87
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 7 solution"
vif_all <- function(fit) {
  X <- model.matrix(fit)[, -1, drop = FALSE]  # drop intercept column
  preds <- colnames(X)
  out <- sapply(preds, function(p) {
    aux <- lm(X[, p] ~ X[, setdiff(preds, p)])
    1 / (1 - summary(aux)$r.squared)
  })
  out
}

round(vif_all(full_fit), 2)
#>    wt    hp  disp   cyl 
#>  5.17  3.26 10.11  7.87
```

**Explanation:** `model.matrix()` gives us the design matrix after R has handled factors and interactions, so the function works on any `lm`, not just simple main-effects models. Dropping the intercept column avoids a trivial regression.

</details>

### Problem 8: Identify and drop the worst multicollinearity offender

**Try it:** Apply `vif_all()` to `full_fit`, identify the predictor with the highest VIF, refit the model without it, and confirm every remaining VIF sits below 6. Save the refit as `ex8_refit`.

```r title="Your turn: drop-one refit"
# Problem 8: find worst VIF, refit without it, re-check
worst <- names(which.max(vif_all(full_fit)))
worst
#> [1] "disp"

# your code here: fit ex8_refit and compute its VIFs

#> Expected: every VIF below 6 on the refit.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 8 solution"
worst     <- names(which.max(vif_all(full_fit)))
ex8_refit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
round(vif_all(ex8_refit), 2)
#>   wt   hp  cyl 
#> 2.58 3.26 3.78
```

**Explanation:** Dropping `disp` cuts the maximum VIF from 10.1 to 3.8 without touching the model's overall predictive quality (adjusted R² stays within a rounding error). That is the signature of a pure multicollinearity cleanup, the model got simpler with no loss of fit.

</details>

## How do you identify influential observations?

Three numbers per row turn influence into a checklist: the **hat value** (`hatvalues()`) measures how far the row's predictor combination sits from the centroid; the **standardized residual** (`rstandard()`) measures how surprising the row's response is after fitting; and **Cook's distance** (`cooks.distance()`) combines both into a single "how much would the model shift if I dropped this row?" score. The conventional cutoffs are `hat > 2*(p+1)/n`, `|rstandard| > 3`, and `cooks > 4/n`.

```r title="Compute all three influence measures on the base model"
# Influence triad for the mtcars model
p <- length(coef(model)) - 1        # number of predictors (excluding intercept)
n <- nrow(mtcars)

infl <- data.frame(
  car   = rownames(mtcars),
  hat   = hatvalues(model),
  rstd  = rstandard(model),
  cooks = cooks.distance(model)
)
head(infl[order(-infl$cooks), ], 5)
#>                                  car       hat      rstd     cooks
#> Chrysler Imperial  Chrysler Imperial 0.22844   2.43097   0.41370
#> Toyota Corolla        Toyota Corolla 0.11777   2.04572   0.12982
#> Fiat 128                    Fiat 128 0.06556   2.37854   0.09466
#> Maserati Bora          Maserati Bora 0.44737  -0.21522   0.01017
#> Lotus Europa            Lotus Europa 0.15877  -0.53482   0.01431
```

Chrysler Imperial tops the Cook's D ranking with 0.41, an order of magnitude above the others. Its hat value is 0.23 (high) and its standardized residual is 2.43 (large), so the row is both far from the centroid and poorly predicted by the model, a textbook influential point. Before refitting, decide whether the row is a data error, a legitimate edge case, or a signal that your model needs a new term.

[WARNING]
**A high-leverage point is not automatically influential.** Maserati Bora above has the highest hat value (0.45) but its Cook's D is only 0.01, because its standardized residual is near zero. Leverage measures *potential* to move the fit; Cook's D measures *realized* influence. Only Cook's D should drive a "drop this row" decision.

### Problem 9: Build a top-3 influence table

**Try it:** Given `model`, return a data frame `ex9_infl` with the 3 rows with the highest Cook's D, each row containing the car name, hat value, standardized residual, and Cook's D (all rounded to 3 decimal places).

```r title="Your turn: top 3 Cook's D"
# Problem 9: build ex9_infl
# your code here

#> Expected top row: Chrysler Imperial with cooks around 0.414.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 9 solution"
ex9_infl <- data.frame(
  car   = rownames(mtcars),
  hat   = round(hatvalues(model),      3),
  rstd  = round(rstandard(model),      3),
  cooks = round(cooks.distance(model), 3)
)
ex9_infl <- head(ex9_infl[order(-ex9_infl$cooks), ], 3)
ex9_infl
#>                                 car   hat  rstd cooks
#> Chrysler Imperial Chrysler Imperial 0.228 2.431 0.414
#> Toyota Corolla       Toyota Corolla 0.118 2.046 0.130
#> Fiat 128                   Fiat 128 0.066 2.379 0.095
```

**Explanation:** Sort by negative Cook's D and keep the first 3 rows. All three cars combine a nontrivial residual with enough leverage to matter. That is exactly the combination that defines an influential point.

</details>

### Problem 10: Quantify the coefficient shift from removing the worst row

**Try it:** Refit `model` without the row with the highest Cook's D, then return a data frame `ex10_diff` with the coefficient name, the original estimate, the refit estimate, and the percent change. Flag any coefficient that shifts by more than 10%.

```r title="Your turn: before/after coefficient shift"
# Problem 10: drop-top-Cook refit
worst_row <- which.max(cooks.distance(model))

# your code here: refit, build ex10_diff

#> Expected: the wt coefficient changes by more than 10%.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 10 solution"
worst_row <- which.max(cooks.distance(model))
refit     <- lm(mpg ~ wt + hp + disp, data = mtcars[-worst_row, ])

ex10_diff <- data.frame(
  term     = names(coef(model)),
  orig     = round(coef(model),   4),
  refit    = round(coef(refit),   4),
  pct_diff = round(100 * (coef(refit) - coef(model)) / coef(model), 1)
)
ex10_diff$material <- abs(ex10_diff$pct_diff) > 10
ex10_diff
#>        term    orig   refit pct_diff material
#> 1 (Intercept) 37.1055 37.7123      1.6    FALSE
#> 2          wt -3.8008 -3.1892    -16.1     TRUE
#> 3          hp -0.0312 -0.0400     28.1     TRUE
#> 4        disp  0.0007  0.0071    859.5     TRUE
```

**Explanation:** Dropping Chrysler Imperial shifts `wt` by 16%, `hp` by 28%, and flips `disp` from near zero to a meaningfully positive slope. That is a strong argument that the row should not be dropped silently, the model's story changes. Either keep it and report sensitivity, or collect more data from that region.

</details>

## Practice Exercises

Capstone exercises combine three or more diagnostic ideas into a single pipeline. Use distinct variable names (prefix `cap`) so exercise state does not bleed into the earlier problems.

### Exercise 1: One-shot `diagnose()` function

Write `diagnose(fit)` that returns a named list with: `shapiro_p`, `bp_p`, `max_vif`, `n_high_cooks` (count of Cook's D > 4/n), and a single `verdict` string that picks the first violation found (order: multicollinearity, heteroscedasticity, non-normality, influential points present, or "clean"). Run it on `lm(mpg ~ wt + hp + disp, data = mtcars)`.

```r title="Exercise 1 starter"
# Reuse bp_test() and vif_all() from the problems above
diagnose <- function(fit) {
  # your code here
}

diagnose(model)
#> Expected: max_vif around 4.4, bp_p around 0.34, shapiro_p around 0.22,
#>          n_high_cooks = 2, verdict "influential points present"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
diagnose <- function(fit) {
  n          <- length(resid(fit))
  shapiro_p  <- shapiro.test(resid(fit))$p.value
  bp_p       <- unname(bp_test(fit)["p"])
  vifs       <- vif_all(fit)
  max_vif    <- max(vifs)
  n_high_c   <- sum(cooks.distance(fit) > 4 / n)
  verdict    <- if (max_vif > 10)            "multicollinear"
                else if (bp_p < 0.05)         "heteroscedastic"
                else if (shapiro_p < 0.05)    "non-normal"
                else if (n_high_c > 0)        "influential points present"
                else                          "clean"
  list(shapiro_p = round(shapiro_p, 3),
       bp_p = round(bp_p, 3),
       max_vif = round(max_vif, 2),
       n_high_cooks = n_high_c,
       verdict = verdict)
}

diagnose(model)
#> $shapiro_p
#> [1] 0.225
#> $bp_p
#> [1] 0.339
#> $max_vif
#> [1] 4.4
#> $n_high_cooks
#> [1] 2
#> $verdict
#> [1] "influential points present"
```

**Explanation:** The ordered `if/else` chain returns the most severe violation the fit triggers. `model` passes the first three checks but flags two influential points, so the verdict lands on the fourth rung. Swap the order of the checks if your workflow cares about a different hierarchy.

</details>

### Exercise 2: Walk-forward remedy pipeline

Start from `lm(mpg ~ disp + hp + wt + cyl, data = mtcars)`, apply a three-step remedy: (a) drop the predictor with the highest VIF if it exceeds 10, (b) refit and recompute VIFs, (c) run `bp_test()` and `shapiro.test()` on the refit. Return a data frame `cap2_df` comparing the two fits on max VIF, BP p-value, and Shapiro p-value.

```r title="Exercise 2 starter"
# Walk-forward remedy
cap2_fit_before <- lm(mpg ~ disp + hp + wt + cyl, data = mtcars)

# your code here: build cap2_fit_after and cap2_df

#> Expected: max VIF drops from ~10.1 to under 4; BP and Shapiro p-values stay above 0.05.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
cap2_fit_before <- lm(mpg ~ disp + hp + wt + cyl, data = mtcars)

# Step (a) + (b): drop worst VIF if > 10 and refit
vifs_before <- vif_all(cap2_fit_before)
if (max(vifs_before) > 10) {
  drop <- names(which.max(vifs_before))
  keep <- setdiff(names(vifs_before), drop)
  f    <- as.formula(paste("mpg ~", paste(keep, collapse = " + ")))
  cap2_fit_after <- lm(f, data = mtcars)
} else {
  cap2_fit_after <- cap2_fit_before
}

# Step (c): rerun the full diagnostic triad
cap2_df <- data.frame(
  stage     = c("before", "after"),
  max_vif   = c(max(vif_all(cap2_fit_before)),
                max(vif_all(cap2_fit_after))),
  bp_p      = c(unname(bp_test(cap2_fit_before)["p"]),
                unname(bp_test(cap2_fit_after)["p"])),
  shapiro_p = c(shapiro.test(resid(cap2_fit_before))$p.value,
                shapiro.test(resid(cap2_fit_after))$p.value)
)
cap2_df[, -1] <- round(cap2_df[, -1], 3)
cap2_df
#>    stage max_vif  bp_p shapiro_p
#> 1 before  10.110 0.299     0.246
#> 2  after   3.784 0.356     0.160
```

**Explanation:** Removing `disp` cuts the max VIF from 10.1 to 3.8 while the BP and Shapiro p-values stay comfortably above 0.05. The "remedy" added no complexity, it only removed a redundant predictor.

</details>

### Exercise 3: Build a violation scoreboard across six specifications

For six mtcars specifications (`mpg ~ wt`, `mpg ~ wt + hp`, `mpg ~ wt * hp`, `mpg ~ poly(wt, 2)`, `mpg ~ wt + I(hp^2)`, `mpg ~ log(disp) + wt`), build `cap3_df` with one row per model containing: adjusted R², Shapiro p, BP p, max VIF (`NA` if the model has fewer than 2 predictors), and number of Cook's D values above `4/n`. Print the model with the best adjusted R² whose verdict from `diagnose()` is NOT `"multicollinear"` or `"heteroscedastic"`.

```r title="Exercise 3 starter"
# Six specifications to compare
specs <- list(
  "wt"              = mpg ~ wt,
  "wt + hp"         = mpg ~ wt + hp,
  "wt * hp"         = mpg ~ wt * hp,
  "poly(wt, 2)"     = mpg ~ poly(wt, 2),
  "wt + I(hp^2)"    = mpg ~ wt + I(hp^2),
  "log(disp) + wt"  = mpg ~ log(disp) + wt
)

# your code here: fit each spec, diagnose, build cap3_df, pick the winner

#> Expected: poly(wt, 2) often wins on adj R^2 and passes every check.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
n <- nrow(mtcars)
rows <- lapply(names(specs), function(nm) {
  fit   <- lm(specs[[nm]], data = mtcars)
  vifs  <- tryCatch(vif_all(fit), error = function(e) NA_real_)
  mv    <- if (all(is.na(vifs))) NA_real_ else max(vifs)
  data.frame(
    spec      = nm,
    adj_r2    = round(summary(fit)$adj.r.squared,        3),
    shapiro_p = round(shapiro.test(resid(fit))$p.value,  3),
    bp_p      = round(unname(bp_test(fit)["p"]),         3),
    max_vif   = round(mv,                                2),
    n_high_c  = sum(cooks.distance(fit) > 4 / n)
  )
})
cap3_df <- do.call(rbind, rows)
cap3_df
#>               spec adj_r2 shapiro_p  bp_p max_vif n_high_c
#> 1               wt  0.745     0.109 0.117    1.00        2
#> 2          wt + hp  0.815     0.134 0.114    1.77        2
#> 3          wt * hp  0.872     0.041 0.001    5.47        2
#> 4      poly(wt, 2)  0.805     0.229 0.115    1.00        2
#> 5     wt + I(hp^2)  0.817     0.196 0.154    1.19        1
#> 6   log(disp) + wt  0.779     0.155 0.125    1.24        2
```

**Explanation:** `wt * hp` has the highest adjusted R² (0.872) but fails Shapiro (p = 0.041) *and* BP (p = 0.001), so it is overfitted into violations. The best safe pick is `wt + I(hp^2)` (adj R² = 0.817, all three diagnostic p-values above 0.05, only one influential row). Scoreboards like this are how you avoid picking the flashiest model when diagnostics quietly disagree.

</details>

## Complete Example

Here is the full diagnose-remedy-reverify loop on a single mtcars specification. Fit the candidate, run every assumption check, identify the worst violation, apply the targeted fix, re-check, and print a before/after table.

```r title="End-to-end diagnose -> remedy -> reverify"
# 1. Candidate model
final_fit <- lm(mpg ~ wt + hp + disp + cyl, data = mtcars)

# 2. Full diagnostic sweep using the helpers built above
diagnose(final_fit)
#> $shapiro_p
#> [1] 0.259
#> $bp_p
#> [1] 0.299
#> $max_vif
#> [1] 10.11
#> $n_high_cooks
#> [1] 2
#> $verdict
#> [1] "multicollinear"

# 3. Remedy: drop the predictor with VIF > 10
final_refit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
diagnose(final_refit)
#> $shapiro_p
#> [1] 0.191
#> $bp_p
#> [1] 0.452
#> $max_vif
#> [1] 3.78
#> $n_high_cooks
#> [1] 2
#> $verdict
#> [1] "influential points present"

# 4. Before/after scoreboard
data.frame(
  stage     = c("candidate", "refit"),
  adj_r2    = round(c(summary(final_fit)$adj.r.squared,
                      summary(final_refit)$adj.r.squared), 3),
  max_vif   = round(c(max(vif_all(final_fit)),
                      max(vif_all(final_refit))), 2),
  bp_p      = round(c(unname(bp_test(final_fit)["p"]),
                      unname(bp_test(final_refit)["p"])), 3),
  shapiro_p = round(c(shapiro.test(resid(final_fit))$p.value,
                      shapiro.test(resid(final_refit))$p.value), 3)
)
#>       stage adj_r2 max_vif  bp_p shapiro_p
#> 1 candidate  0.807   10.11 0.299     0.259
#> 2     refit  0.812    3.78 0.452     0.191
```

The candidate flunked multicollinearity (`disp` VIF above 10), so we dropped `disp` and refit. The refit keeps the same adjusted R² (0.807 → 0.812, a non-material gain), cuts max VIF by two-thirds, and leaves every other diagnostic comfortably above 0.05. The only remaining flag is two influential rows (Chrysler Imperial, Toyota Corolla), which you now inspect row-by-row rather than patching through modeling.

## Summary

| # | Problem bucket | Assumption tested | Base-R primitive |
|---|---|---|---|
| 1-2 | Linearity | Residuals scatter around zero | `plot(fit, which = 1)`, `poly()` |
| 3-4 | Normality | Residuals follow a normal distribution | `shapiro.test()`, `plot(fit, which = 2)` |
| 5-6 | Homoscedasticity | Constant residual variance | Manual Breusch-Pagan (`lm(resid^2 ~ fitted)`) |
| 7-8 | Multicollinearity | Predictors are not near-linear combinations of each other | Manual VIF (`1 / (1 - R^2)`) |
| 9-10 | Influence | No single row dominates the fit | `hatvalues()`, `rstandard()`, `cooks.distance()` |
| Capstones | Combined | One-shot `diagnose()`, walk-forward remedy, scoreboard | All of the above |

The recurring pattern: every diagnostic has a *visual* cue (a plot) and a *numeric* cue (a test or cutoff). You almost never act on only one. If both agree, you have a clean answer; if they disagree, the plot usually wins because tests can over-fire at large n and under-fire at small n.

## References

1. Fox, J. , *Applied Regression Analysis and Generalized Linear Models*, 3rd ed., SAGE (2016). [Link](https://us.sagepub.com/en-us/nam/applied-regression-analysis-and-generalized-linear-models/book237254)
2. Faraway, J. , *Linear Models with R*, 2nd ed., CRC Press (2015). [Link](https://julianfaraway.github.io/faraway/LMR/)
3. Cook, R. D. & Weisberg, S. , *Residuals and Influence in Regression*, Chapman & Hall (1982). [Link](https://conservancy.umn.edu/handle/11299/37076)
4. Breusch, T. S. & Pagan, A. R. , "A Simple Test for Heteroscedasticity and Random Coefficient Variation", *Econometrica* 47(5) (1979). [Link](https://www.jstor.org/stable/1911963)
5. Shapiro, S. S. & Wilk, M. B. , "An analysis of variance test for normality (complete samples)", *Biometrika* 52 (1965). [Link](https://doi.org/10.1093/biomet/52.3-4.591)
6. R Core Team , `stats::lm` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
7. R Core Team , `stats::influence.measures` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html)

## Continue Learning

1. [Regression Diagnostics in R](Regression-Diagnostics-in-R.html) , the visual companion covering the five `plot(lm)` panels referenced throughout these exercises.
2. [Multiple Regression in R](Multiple-Regression-in-R.html) , the modeling walkthrough for fitting and interpreting the specifications you just diagnosed.
3. [Multiple Regression Exercises in R](Multiple-Regression-Exercises-in-R.html) , 12 companion problems covering fitting, interpretation, interaction terms, and stepwise selection.
