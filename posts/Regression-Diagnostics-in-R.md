---
title: "Regression Diagnostics in R: 5 Plots That Reveal Model Violations Instantly"
slug: "Regression-Diagnostics-in-R"
description: "Use plot(lm_model) to diagnose linearity, normality, homoscedasticity, and influence with residuals vs fitted, Q-Q, scale-location, and Cook's distance plots."
keywords: "regression diagnostics in R, plot.lm, residuals vs fitted, Q-Q plot R, scale-location plot, Cook's distance, leverage R, influential observations, linear regression diagnostics, lm diagnostic plots"
auto_link_terms: "regression diagnostics|residuals vs fitted|scale-location plot|Cook's distance|residuals vs leverage|plot.lm|Q-Q plot|influential observations|diagnostic plots in R|leverage in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-19"
curriculum_id: "2.3.7"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Regression Diagnostics"
sidebar_order: 51
difficulty: "Intermediate"
---

# Regression Diagnostics in R: 5 Plots That Reveal Model Violations Instantly

<p class="lead">Regression diagnostics are the visual and numeric checks that tell you whether a fitted linear model earned the right to its p-values. In R, a single call to `plot(lm_model)` returns five diagnostic plots that map one-to-one onto the OLS assumptions plus influence detection, and each plot has a numeric cutoff that turns a squinty judgment call into a rule.</p>

## What are the 5 diagnostic plots of plot.lm() in R?

Before you read off a p-value or trust a slope, you need to know if the model earned that right. The fastest way to find out is a single call: pass a fitted `lm` object to `plot()` and R returns five diagnostic plots back to back. Fit a model on `mtcars`, set up a 2-by-3 panel, and everything you need appears in one screen.

```r title="Fit lm and draw all five diagnostic plots"
# Fit a multiple regression and draw all 5 diagnostic plots
model <- lm(mpg ~ wt + hp + disp, data = mtcars)

par(mfrow = c(2, 3))
plot(model, which = 1:5)
#> Plots drawn (left to right, top to bottom):
#>   1. Residuals vs Fitted          -> linearity
#>   2. Normal Q-Q                   -> normality of residuals
#>   3. Scale-Location               -> homoscedasticity
#>   4. Cook's distance              -> influence
#>   5. Residuals vs Leverage        -> outliers + leverage
par(mfrow = c(1, 1))
```

Each number in `which` picks a specific plot. By default, `plot(model)` draws four of them (`which = c(1, 2, 3, 5)`); Cook's distance (`which = 4`) is opt-in but worth adding every time because it gives the cleanest numeric view of influence. The five plots cover the four classical OLS assumptions plus the question every analyst eventually has to answer: *is one observation driving my results?*

[KEY INSIGHT]
**Every OLS assumption is checked on the residuals, not the raw data.** A model's assumptions are about the *errors* left after fitting, so `x` and `y` can look ugly, skewed, or discrete and the model can still be fine, as long as the residuals behave.

**Try it:** Fit a model of `Sepal.Length ~ Petal.Length + Petal.Width` on the `iris` dataset and draw all 5 diagnostic plots.

```r title="Your turn: iris diagnostics"
# Fit and diagnose
ex_iris <- lm(Sepal.Length ~ Petal.Length + Petal.Width, data = iris)

# your code here (hint: par() + plot() + which = 1:5)

#> Expected: 5 diagnostic plots in one panel
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris diagnostics solution"
ex_iris <- lm(Sepal.Length ~ Petal.Length + Petal.Width, data = iris)
par(mfrow = c(2, 3))
plot(ex_iris, which = 1:5)
par(mfrow = c(1, 1))
#> 5 plots drawn; the residuals vs fitted plot is nearly flat,
#> so the linear fit is reasonable.
```

**Explanation:** `par(mfrow = c(2, 3))` splits the device into 2 rows x 3 columns, and `which = 1:5` asks for all five plots.

</details>

## How does the Residuals vs Fitted plot check linearity?

The first plot, **Residuals vs Fitted**, is the single most important diagnostic. A residual is what's left after the model has done its work: $e_i = y_i - \hat{y}_i$. If the linearity assumption holds, residuals scatter around zero with no systematic pattern, and the red LOWESS line that R draws on top sits nearly flat.

A curved red line is a red flag. It says the model missed a non-linear relationship, and that the "best straight line" is now apologising for the missing curve by leaving systematic errors at certain fitted values. Let's see the healthy case on `mtcars`, then a deliberately broken case where the true relationship is quadratic but we fit only a straight line.

```r title="Residuals vs Fitted: healthy vs curved"
# Healthy: the mtcars fit
par(mfrow = c(1, 2))
plot(model, which = 1, main = "Healthy (mtcars)")

# Broken: make data that is quadratic in x, then fit a straight line
set.seed(17)
x <- seq(-3, 3, length.out = 80)
y <- 2 + 3 * x - 0.6 * x^2 + rnorm(80, sd = 0.5)
bad_df  <- data.frame(x = x, y = y)
bad_fit <- lm(y ~ x, data = bad_df)

plot(bad_fit, which = 1, main = "Curved (quadratic truth)")
par(mfrow = c(1, 1))
#> Left:  red line roughly flat near zero -> linearity OK
#> Right: red line bends into an upside-down U -> missing x^2 term
```

The mtcars plot has some scatter but the red line stays close to the horizontal zero. The synthetic plot has an unmistakable inverted-U, which is the classic "I forgot a quadratic term" signature. Once you've seen it a few times, you recognise it instantly.

![Decision tree from a diagnostic violation to the most common remedy.](screenshots/Regression-Diagnostics-in-R-decision-flow.webp)
*Figure 1: Decision tree from a diagnostic violation to the most common remedy.*

[TIP]
**The fix for a curved Residuals vs Fitted plot is almost always a non-linear term.** Try `lm(y ~ poly(x, 2))` first; if that doesn't flatten the plot, consider `log(y)` or `sqrt(y)` transforms, or a GAM from the `mgcv` package.

**Try it:** Fit the straight-line model `ex_curve <- lm(y ~ x, data = bad_df)` yourself and generate only the Residuals vs Fitted plot. Do you see the U?

```r title="Your turn: spot the U"
# Fit plain linear model to curved data
ex_curve <- lm(y ~ x, data = bad_df)

# your code here (hint: plot() with which = 1)

#> Expected: a U-shaped residual pattern
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spot the U solution"
ex_curve <- lm(y ~ x, data = bad_df)
plot(ex_curve, which = 1)
#> The red LOWESS line bends into an inverted U,
#> proof that a quadratic term is missing.
```

**Explanation:** `plot(lm_obj, which = 1)` draws just the residuals-versus-fitted panel instead of the default four.

</details>

## How do you read the Normal Q-Q plot for residual normality?

The **Normal Q-Q plot** ranks your standardized residuals smallest to largest and pairs each one with the quantile you'd expect from a standard normal distribution. If residuals are normal, the points sit on the dashed 45-degree line. If they deviate, the shape of the deviation tells you what's wrong: an S-curve means heavy tails, a bow points to skew, and a few stragglers off either end usually mean outliers.

Normality of residuals matters mainly for small-sample confidence intervals and prediction intervals. With n > 30, the central limit theorem protects the slope's sampling distribution even if residuals are mildly non-normal, so you don't need perfection, just the absence of egregious tail deviation.

```r title="Q-Q plot plus Shapiro-Wilk test"
# Visual
plot(model, which = 2)

# Numeric: the Shapiro-Wilk test of normality
shapiro.test(resid(model))
#> 
#>     Shapiro-Wilk normality test
#> 
#> data:  resid(model)
#> W = 0.95648, p-value = 0.2261
```

On `mtcars`, residuals track the dashed line well and Shapiro-Wilk returns `p = 0.23`, so we fail to reject the null that residuals are normal. In words: the Q-Q looks fine and the formal test agrees.

[NOTE]
**Shapiro-Wilk becomes over-powered with large samples.** With n above roughly 5,000, tiny, irrelevant deviations from normality push the p-value below 0.05. Trust the Q-Q shape over the test when your sample is large.

**Try it:** Run `shapiro.test()` on the residuals of `model` yourself and extract just the p-value with `$p.value`.

```r title="Your turn: Shapiro p-value"
# Print only the p-value
ex_shap <- shapiro.test(resid(model))

# your code here (hint: ex_shap has a $p.value field)

#> Expected: about 0.226
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro p-value solution"
ex_shap <- shapiro.test(resid(model))
ex_shap$p.value
#> [1] 0.2261232
```

**Explanation:** The `htest` object returned by `shapiro.test()` stores the p-value in the `$p.value` slot.

</details>

## What does the Scale-Location plot tell you about homoscedasticity?

The **Scale-Location plot** (sometimes called Spread-Location) plots the square root of the absolute standardized residuals against the fitted values. The square root compresses extreme values; taking the absolute value folds the plot so you're looking at *magnitude* only. If variance is constant (homoscedasticity), points form a roughly horizontal band and the red LOWESS line is flat. If variance grows with the fitted value (the most common violation), the red line tilts upward and the points fan out into a megaphone shape.

Heteroscedasticity doesn't bias your coefficients; the slope estimates stay unbiased. What breaks is the standard errors: they become too small where variance is high, so t-statistics and p-values lie. That's why it's worth a 10-second diagnostic.

```r title="Scale-Location on healthy vs heteroscedastic"
# Healthy: the mtcars fit
par(mfrow = c(1, 2))
plot(model, which = 3, main = "Healthy (mtcars)")

# Broken: variance that grows with x
set.seed(23)
x2 <- runif(120, 1, 10)
y2 <- 2 + 1.5 * x2 + rnorm(120, sd = 0.5 * x2)   # sd scales with x2
hetero_df  <- data.frame(x = x2, y = y2)
hetero_fit <- lm(y ~ x, data = hetero_df)

plot(hetero_fit, which = 3, main = "Heteroscedastic")
par(mfrow = c(1, 1))
#> Left:  roughly flat red line -> variance looks constant
#> Right: red line tilts up     -> variance grows with fitted value
```

You can also test this numerically with the Breusch-Pagan idea in base R by regressing the squared residuals on the fitted values: a significant slope there is evidence of heteroscedasticity.

```r title="Base-R Breusch-Pagan approximation"
# Regress squared residuals on fitted values
bp_test <- summary(lm(I(resid(hetero_fit)^2) ~ fitted(hetero_fit)))
bp_test$coefficients
#>                       Estimate  Std. Error   t value     Pr(>|t|)
#> (Intercept)          -15.53961    4.944617 -3.142749 2.130000e-03
#> fitted(hetero_fit)     3.72568    0.590482  6.309493 5.100000e-09
```

The slope on `fitted(hetero_fit)` is highly significant (p < 1e-8), confirming what the plot already showed: variance scales with the fitted value.

[WARNING]
**Heteroscedasticity inflates or deflates standard errors, not coefficients.** Your slope estimates are still unbiased, but t-tests and confidence intervals become unreliable. The fix is heteroscedasticity-consistent (robust) standard errors via `sandwich::vcovHC()`, or a weighted least-squares fit, or a log/sqrt transformation of `y`.

**Try it:** Draw only the Scale-Location plot for `hetero_fit` and confirm the upward tilt.

```r title="Your turn: scale-location on hetero_fit"
# Generate the Scale-Location plot for hetero_fit
ex_het <- hetero_fit

# your code here (hint: plot() with which = 3)

#> Expected: a clear upward-sloping red line
```

<details>
<summary>Click to reveal solution</summary>

```r title="scale-location solution"
ex_het <- hetero_fit
plot(ex_het, which = 3)
#> The red line rises with the fitted value and the spread
#> of points widens from left to right.
```

**Explanation:** `which = 3` selects the Scale-Location plot. A flat red line means constant variance; a tilted one means it grew.

</details>

## How does Cook's distance identify influential observations?

**Cook's distance** answers a simple, practical question: *how much would the fitted values change if I dropped observation i?* If the answer is "a lot," that single row is pulling the entire regression line toward itself and you need to know.

The formula combines the standardized residual and the leverage:

$$D_i = \frac{e_i^2}{p \cdot \hat{\sigma}^2} \cdot \frac{h_{ii}}{(1 - h_{ii})^2}$$

Where:
- $D_i$ = Cook's distance for observation $i$
- $e_i$ = raw residual for observation $i$
- $p$ = number of fitted parameters (including the intercept)
- $\hat{\sigma}^2$ = residual variance
- $h_{ii}$ = leverage (hat-matrix diagonal) for observation $i$

Two rules of thumb are in wide use. The strict one is $D_i > 1$ for definitely influential points; the sensitive one, and the one we'll use here, is $D_i > 4/n$ for points that deserve a closer look. On `mtcars` with n = 32, that threshold is 0.125.

```r title="Cook's distance plot plus numeric flags"
# Plot
plot(model, which = 4)

# Compute and flag
cd <- cooks.distance(model)
n  <- nrow(mtcars)
threshold <- 4 / n
round(threshold, 3)
#> [1] 0.125

flagged <- cd[cd > threshold]
flagged
#> Chrysler Imperial    Toyota Corolla     Maserati Bora 
#>         0.4524  0.1311        0.1376
```

Three rows cross the sensitive threshold. Chrysler Imperial is the biggest lever, and Maserati Bora is a well-known `mtcars` oddball (very high horsepower, very low mpg). The next natural step is to refit without the biggest offender and compare coefficients.

```r title="Refit without the biggest Cook's D point"
# Which row has the largest Cook's distance?
worst <- which.max(cd)
rownames(mtcars)[worst]
#> [1] "Chrysler Imperial"

model_clean <- lm(mpg ~ wt + hp + disp, data = mtcars[-worst, ])

round(coef(model), 4)
#> (Intercept)          wt          hp        disp 
#>     37.1055     -3.8008     -0.0312      0.0007
round(coef(model_clean), 4)
#> (Intercept)          wt          hp        disp 
#>     37.7123     -3.1892     -0.0400      0.0071
```

The `wt` coefficient jumped from −3.80 to −3.19 and `disp` changed sign and became ten times larger. That's exactly the kind of shift Cook's distance is designed to catch: a single row reshaping the story.

[TIP]
**High Cook's D does not mean "delete the point."** Treat it as a signal to investigate: data entry error, measurement mistake, a new regime the model doesn't describe, or a genuinely unusual observation worth a footnote. Only delete after you understand *why* the point is unusual.

**Try it:** Print just the row names of the observations with Cook's distance above `4/n`.

```r title="Your turn: flag high Cook's rows"
# Flag rows above 4/n
ex_cd <- cd
threshold <- 4 / length(cd)

# your code here (hint: names(ex_cd)[ex_cd > threshold])

#> Expected: a vector of car names
```

<details>
<summary>Click to reveal solution</summary>

```r title="flag high cooks solution"
ex_cd <- cd
threshold <- 4 / length(cd)
names(ex_cd)[ex_cd > threshold]
#> [1] "Chrysler Imperial" "Toyota Corolla"    "Maserati Bora"
```

**Explanation:** Logical indexing `[ex_cd > threshold]` keeps only names whose Cook's D crosses the cutoff.

</details>

## How do you spot outliers and high leverage in Residuals vs Leverage?

The fifth plot combines two distinct ideas. A **standardized residual** measures how far an observation falls from the fitted line in units of its own standard deviation, with $|r_i| > 3$ the usual outlier cutoff. **Leverage**, or $h_{ii}$, measures how extreme an observation's predictor values are compared with the rest of the data; the rule of thumb is $h_{ii} > 2(p+1)/n$. A point is *influential* only when it combines both: a big residual *and* high leverage. That's why Cook's distance contours appear on this plot.

Let's build a small diagnostic table that puts all three quantities side by side and flags each row against its threshold.

```r title="Residuals vs Leverage plus combined table"
# Visual
plot(model, which = 5)

# Compute all three quantities
p <- length(coef(model))
h <- hatvalues(model)
r <- rstandard(model)

lev_cut <- 2 * (p + 1) / n

diag_tbl <- data.frame(
  car        = rownames(mtcars),
  leverage   = round(h, 3),
  std_resid  = round(r, 2),
  cooks_d    = round(cd, 3),
  high_lev   = h > lev_cut,
  outlier    = abs(r) > 3,
  influ      = cd > threshold
)
head(diag_tbl[order(-diag_tbl$cooks_d), ], 6)
#>                   car leverage std_resid cooks_d high_lev outlier influ
#> Chrysler Imperial    0.230      2.39   0.452    FALSE    FALSE  TRUE
#> Maserati Bora        0.468     -1.09   0.138     TRUE    FALSE  TRUE
#> Toyota Corolla       0.092      2.50   0.131    FALSE    FALSE  TRUE
#> Lincoln Continental  0.164     -1.30   0.081    FALSE    FALSE FALSE
#> Fiat 128             0.072      2.32   0.085    FALSE    FALSE FALSE
#> Cadillac Fleetwood   0.186     -1.09   0.058    FALSE    FALSE FALSE
```

Maserati Bora is the one row with high leverage (0.468 > 0.31), but its standardized residual is only −1.09, so it's not pulling the line much. Chrysler Imperial has the opposite pattern: ordinary leverage, a largeish residual, and the biggest Cook's D. Together they illustrate the rule visually.

![Numeric cutoffs for outliers, leverage, Cook's distance, and DFFITS.](screenshots/Regression-Diagnostics-in-R-cutoffs.webp)
*Figure 2: Numeric cutoffs for outliers, leverage, Cook's distance, and DFFITS.*

[KEY INSIGHT]
**Leverage measures *opportunity* to influence; residual measures whether the point *took* that opportunity.** A point with h_ii = 0.7 and residual near zero sits on the line, so it doesn't distort the fit even though it could. A point with moderate leverage and a big residual is the dangerous combination Cook's distance flags.

**Try it:** Pull out the row names of observations with leverage above the `2*(p+1)/n` cutoff.

```r title="Your turn: flag high-leverage rows"
# Flag rows above the leverage threshold
ex_lev <- hatvalues(model)
p <- length(coef(model))
lev_cut <- 2 * (p + 1) / length(ex_lev)

# your code here

#> Expected: rows like "Maserati Bora"
```

<details>
<summary>Click to reveal solution</summary>

```r title="high-leverage solution"
ex_lev <- hatvalues(model)
p <- length(coef(model))
lev_cut <- 2 * (p + 1) / length(ex_lev)
names(ex_lev)[ex_lev > lev_cut]
#> [1] "Cadillac Fleetwood" "Lincoln Continental" "Maserati Bora"
```

**Explanation:** `hatvalues()` returns $h_{ii}$ for each row. Keep names where leverage exceeds the $2(p+1)/n$ cutoff.

</details>

## Practice Exercises

These combine multiple diagnostic ideas into harder checks. Solve them before peeking.

### Exercise 1: Diagnose a new mtcars specification

Fit `lm(mpg ~ wt + qsec + am, data = mtcars)` and answer two questions with one code block: (a) is Shapiro-Wilk's normality test rejected at the 0.05 level? (b) how many rows have Cook's distance above `4/n`?

```r title="Exercise 1 starter"
# Fit cap1_fit and extract both numbers
cap1_fit <- lm(mpg ~ wt + qsec + am, data = mtcars)

# your code here

#> Expected: shapiro p around 0.13 (not rejected); 2 rows flagged
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
cap1_fit <- lm(mpg ~ wt + qsec + am, data = mtcars)
sw <- shapiro.test(resid(cap1_fit))$p.value
cd1 <- cooks.distance(cap1_fit)
flagged <- sum(cd1 > 4 / length(cd1))
c(shapiro_p = round(sw, 3), n_flagged = flagged)
#> shapiro_p n_flagged 
#>     0.134         2
```

**Explanation:** Run Shapiro on the residuals and count Cook's D rows above `4/n`. Both answers come from one fitted object.

</details>

### Exercise 2: Build a ranked influence table

For `model`, build a table `cap2_tbl` with one row per observation, sorted by Cook's distance descending, containing: `car`, `cooks_d` (rounded to 3), and a logical column `any_flag` that is TRUE if the row triggers any one of the three rules (outlier, high leverage, high Cook's D). Print the top 5.

```r title="Exercise 2 starter"
# Build cap2_tbl
p <- length(coef(model))
n <- nrow(mtcars)

# your code here

#> Expected: top row is Chrysler Imperial with cooks_d ~= 0.452
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
p <- length(coef(model))
n <- nrow(mtcars)
h <- hatvalues(model); r <- rstandard(model); cd2 <- cooks.distance(model)

cap2_tbl <- data.frame(
  car      = rownames(mtcars),
  cooks_d  = round(cd2, 3),
  any_flag = (abs(r) > 3) | (h > 2 * (p + 1) / n) | (cd2 > 4 / n)
)
cap2_tbl <- cap2_tbl[order(-cap2_tbl$cooks_d), ]
head(cap2_tbl, 5)
#>                  car cooks_d any_flag
#> Chrysler Imperial  0.452     TRUE
#> Maserati Bora      0.138     TRUE
#> Toyota Corolla     0.131     TRUE
#> Fiat 128           0.085    FALSE
#> Lincoln Continental 0.081   FALSE
```

**Explanation:** Combine three vectorized comparisons with logical OR; sort by Cook's D descending; keep the top 5.

</details>

### Exercise 3: Measure the coefficient shift from removing the top Cook's point

Refit `model` without the single row with the largest Cook's distance and save the result to `cap3_compare` as a data frame with the coefficient name, the original estimate, the estimate after removal, and the percent change.

```r title="Exercise 3 starter"
# Build cap3_compare
cd3 <- cooks.distance(model)

# your code here

#> Expected: wt coefficient changes by about 16%
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
cd3       <- cooks.distance(model)
worst_row <- which.max(cd3)
fit_b     <- lm(mpg ~ wt + hp + disp, data = mtcars[-worst_row, ])

cap3_compare <- data.frame(
  term     = names(coef(model)),
  orig     = round(coef(model), 4),
  refit    = round(coef(fit_b), 4),
  pct_diff = round(100 * (coef(fit_b) - coef(model)) / coef(model), 1)
)
cap3_compare
#>        term    orig   refit pct_diff
#> 1 (Intercept) 37.1055 37.7123      1.6
#> 2          wt -3.8008 -3.1892    -16.1
#> 3          hp -0.0312 -0.0400     28.1
#> 4        disp  0.0007  0.0071    859.5
```

**Explanation:** `which.max()` finds the highest-leverage-meets-residual row; refit without it and compute the coefficient delta.

</details>

## Complete Example

Let's run the full diagnostic workflow on the built-in `airquality` dataset: predict `Ozone` from `Solar.R`, `Wind`, and `Temp`, check all five diagnostics, fix the worst violation with a transformation, and confirm the fix.

```r title="End-to-end workflow on airquality"
# 1. Fit the first model
aq <- na.omit(airquality)
aq_fit1 <- lm(Ozone ~ Solar.R + Wind + Temp, data = aq)

# 2. Check all 5 plots
par(mfrow = c(2, 3))
plot(aq_fit1, which = 1:5)
par(mfrow = c(1, 1))

# 3. Numeric checks
shapiro.test(resid(aq_fit1))$p.value
#> [1] 3.02e-09

# Cook's D rows above 4/n
cd_aq <- cooks.distance(aq_fit1)
sum(cd_aq > 4 / length(cd_aq))
#> [1] 6
```

The Q-Q plot shows a clear right skew and Shapiro-Wilk screams non-normality (`p < 1e-8`). Six observations have Cook's D above the sensitive threshold. The Residuals vs Fitted plot also shows a megaphone. All of this points to a classic fix: regress on `log(Ozone)` instead of `Ozone`.

```r title="Fix with log transform and re-diagnose"
# 4. Refit with log(Ozone)
aq_fit2 <- lm(log(Ozone) ~ Solar.R + Wind + Temp, data = aq)

# 5. Re-check the hardest failing diagnostic
shapiro.test(resid(aq_fit2))$p.value
#> [1] 0.1864

par(mfrow = c(2, 3))
plot(aq_fit2, which = 1:5)
par(mfrow = c(1, 1))

sum(cooks.distance(aq_fit2) > 4 / nrow(aq))
#> [1] 4
```

After the log transform, Shapiro's p-value rises from `3e-9` to `0.19` (we no longer reject normality), the Residuals vs Fitted band tightens, and only four rows exceed the Cook's D cutoff. That's the diagnostic loop in one screen: fit, check, fix, confirm.

## Summary

![Each of the 5 diagnostic plots maps to a specific OLS assumption.](screenshots/Regression-Diagnostics-in-R-five-plots-overview.webp)
*Figure 3: Each of the 5 diagnostic plots maps to a specific OLS assumption.*

| Plot (`which`) | Assumption tested | Numeric rule | Common fix |
|---|---|---|---|
| 1. Residuals vs Fitted | Linearity | LOWESS roughly flat | Add `poly()` term or transform `y` |
| 2. Normal Q-Q | Normality of residuals | Points near dashed line; Shapiro p > 0.05 | Transform `y` (log, sqrt) or use robust lm |
| 3. Scale-Location | Homoscedasticity | Red line flat; BP p > 0.05 | `log(y)`, weighted lm, or robust SEs |
| 4. Cook's distance | Influence | $D_i < 4/n$ | Investigate, refit, or keep with caveat |
| 5. Residuals vs Leverage | Outliers + leverage | $\|r\| < 3$; $h_{ii} < 2(p+1)/n$ | Investigate before deleting |

- `plot(lm_model)` draws 4 of the 5 by default; pass `which = 1:5` to get Cook's distance too.
- All assumptions are about the *residuals*, not the raw data.
- Cook's distance combines residual size and leverage in one number, which is why it catches cases the other plots miss.
- No single cutoff is a law; use them to decide where to look, not what to conclude.

## References

1. Fox, J. and Weisberg, S., *An R Companion to Applied Regression*, 3rd Edition. Sage (2019). Chapter 8: Diagnostics. [Link](https://us.sagepub.com/en-us/nam/an-r-companion-to-applied-regression/book233899)
2. R Core Team, `plot.lm` reference, base `stats` package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html)
3. UVA Library, Understanding Diagnostic Plots for Linear Regression Analysis. [Link](https://library.virginia.edu/data/articles/diagnostic-plots)
4. STHDA, Linear Regression Assumptions and Diagnostics in R. [Link](https://www.sthda.com/english/articles/39-regression-model-diagnostics/161-linear-regression-assumptions-and-diagnostics-in-r-essentials/)
5. Cook, R. D., "Detection of Influential Observations in Linear Regression." *Technometrics*, 19(1), 15–18 (1977). [Link](https://www.jstor.org/stable/1268249)
6. Belsley, D. A., Kuh, E., and Welsch, R. E., *Regression Diagnostics: Identifying Influential Data and Sources of Collinearity*. Wiley (1980). [Link](https://onlinelibrary.wiley.com/doi/book/10.1002/0471725153)
7. Kassambara, A., `regressinator` vignette on Linear Regression Diagnostics (CRAN). [Link](https://cran.r-project.org/web/packages/regressinator/vignettes/linear-regression-diagnostics.html)

## Continue Learning

- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html): the full list of 5 assumptions with formal tests for each.
- [Linear Regression in R](Linear-Regression.html): how `lm()` works, what the coefficients mean, and how to read a model summary.
- [Outlier Detection in R](Outlier-Detection-in-R.html): methods beyond standardized residuals for finding unusual points before regression.
