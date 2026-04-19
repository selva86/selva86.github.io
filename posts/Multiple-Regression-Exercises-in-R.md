---
title: "Multiple Regression Exercises in R: 12 Model-Building Problems, Solved Step-by-Step"
slug: Multiple-Regression-Exercises-in-R
description: "12 multiple regression exercises in R with runnable solutions: fit models, interpret coefficients, test significance, diagnose residuals, add interactions."
keywords: "multiple regression exercises in R, multiple regression practice problems, multiple linear regression R exercises, VIF multicollinearity practice R, regression diagnostics exercises, stepwise regression practice R"
auto_link_terms: "multiple regression exercises|multiple regression practice|multiple regression problems|multiple regression questions|multiple regression practice problems|regression exercises in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: E6.2
post_type: EX
sidebar_title: "Multiple Regression Exercises"
fr_parent: Multiple-Regression-in-R.html
difficulty: Intermediate
---

# Multiple Regression Exercises in R: 12 Model-Building Problems, Solved Step-by-Step

<p class="lead">These 12 multiple regression exercises in R walk you through fitting models, interpreting partial coefficients, testing predictor significance with t-tests and anova(), diagnosing residuals, spotting multicollinearity with VIF, adding interactions, and predicting on new data. Every problem ships with a runnable scaffold, a hint, and a collapsible solution so you can self-check the instant you finish coding.</p>

## How do you fit and interpret a multiple regression model?

One line of R fits a multiple regression: pass `y ~ x1 + x2 + ...` to `lm()` and wrap the result with `summary()`. The slopes you read off the output are *partial* effects, meaning each coefficient shows the change in the outcome for a 1-unit change in that predictor while the other predictors stay constant. We'll fit a two-predictor model on `mtcars` right now, then Problems 1 to 3 ask you to pull a coefficient, interpret it, and build a 95% confidence interval for it.

```r title="Fit a multiple regression on mtcars"
# Predict miles per gallon from weight and horsepower
fit1 <- lm(mpg ~ wt + hp, data = mtcars)
summary(fit1)
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars)
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 37.22727    1.59879  23.285  < 2e-16 ***
#> wt          -3.87783    0.63273  -6.129 1.12e-06 ***
#> hp          -0.03177    0.00903  -3.519  0.00145 **
#>
#> Residual standard error: 2.593 on 29 degrees of freedom
#> Multiple R-squared:  0.8268,    Adjusted R-squared:  0.8148
#> F-statistic: 69.21 on 2 and 29 DF,  p-value: 9.109e-12
```

The weight coefficient (−3.88) says mpg drops by roughly 3.88 miles per gallon for each extra 1000 lb of weight, *after holding horsepower constant*. The horsepower coefficient (−0.032) says mpg drops 0.032 per extra hp, *holding weight constant*. Both p-values are tiny, so both predictors earn their place. Adjusted R² of 0.81 means the two predictors together explain about 81% of the variation in mpg, which is very strong for a two-variable model.

[KEY INSIGHT]
**Every multiple-regression slope is a partial slope.** The coefficient on `wt` is not "the effect of weight" in general, it is "the effect of weight once hp is already in the model." Change the set of other predictors and the partial slope changes too. That one idea is what separates multiple regression from a stack of simple regressions.

### Problem 1: Fit a new model and extract one coefficient

**Try it:** Fit a model predicting `mpg` from `wt` and `cyl` on `mtcars`, then print only the `cyl` coefficient (a single number).

```r title="Your turn: extract cyl coefficient"
# Problem 1: fit lm(mpg ~ wt + cyl) and pull the cyl slope
ex1_fit <- lm(mpg ~ wt + cyl, data = mtcars)

# Print just the cyl slope here:
# your code here
#> Expected: approximately -1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 1 solution"
ex1_fit <- lm(mpg ~ wt + cyl, data = mtcars)
coef(ex1_fit)["cyl"]
#>       cyl
#> -1.507795
```

**Explanation:** `coef()` returns a named numeric vector of all slopes; indexing by name pulls out just the one you want. Each extra cylinder costs about 1.51 mpg after controlling for weight.

</details>

### Problem 2: Write a one-sentence interpretation of a coefficient

**Try it:** Using `fit1` from the teaching block above, write one sentence that correctly interprets the `hp` coefficient (−0.032). Store your interpretation as a character string in `ex2_ans`. The grader below checks that the sentence mentions "holding" or "constant".

```r title="Your turn: interpret hp coefficient"
# Problem 2: write a correct partial-effect interpretation
ex2_ans <- "your one-sentence interpretation here"

grepl("holding|constant", ex2_ans, ignore.case = TRUE)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 2 solution"
ex2_ans <- "Each extra unit of horsepower lowers mpg by about 0.032, holding weight constant."
grepl("holding|constant", ex2_ans, ignore.case = TRUE)
#> [1] TRUE
```

**Explanation:** The sentence nails all three requirements: the direction (lowers), the magnitude (0.032), and the partial qualifier (holding weight constant). Any interpretation of a multiple-regression slope that skips the partial phrase is technically wrong.

</details>

### Problem 3: Build 95% confidence intervals for every coefficient

**Try it:** Use `confint()` on `fit1` to get 95% confidence intervals for all three coefficients, then read the interval for `wt`.

```r title="Your turn: confidence intervals via confint()"
# Problem 3: get 95% CIs for every coefficient
ex3_ci <- # your code here

print(ex3_ci)
#> Expected: a 3-row matrix with 2.5 % and 97.5 % columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 3 solution"
ex3_ci <- confint(fit1, level = 0.95)
print(ex3_ci)
#>                   2.5 %      97.5 %
#> (Intercept) 33.95738283 40.49715778
#> wt          -5.17191604 -2.58374544
#> hp          -0.05025119 -0.01328079
```

**Explanation:** The `wt` interval [−5.17, −2.58] does not cross zero, so the partial effect of weight is confidently negative. `confint()` uses the t-distribution with residual degrees of freedom, which matches the t-test in `summary()` exactly.

</details>

## How do you test whether a predictor truly matters?

Two tests decide whether a predictor earns its place. The t-test row next to each coefficient in `summary()` answers "does this one predictor add value, given all the others?" The partial F-test from `anova(fit_small, fit_big)` answers the same question for a *group* of predictors at once, which is what you need when adding or dropping several variables together. Problems 4 to 6 make you read a t-row, compare two nested models, and run `drop1()` to test every predictor one at a time.

```r title="Compare nested models with anova()"
# Small model: weight + horsepower
fit_small <- lm(mpg ~ wt + hp, data = mtcars)

# Big model: small + cylinders
fit_big <- lm(mpg ~ wt + hp + cyl, data = mtcars)

anova(fit_small, fit_big)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ wt + hp
#> Model 2: mpg ~ wt + hp + cyl
#>   Res.Df    RSS Df Sum of Sq      F  Pr(>F)
#> 1     29 195.05
#> 2     28 170.44  1    24.603 4.0418 0.05403 .
```

The F statistic compares how much *extra* residual sum of squares the big model reduces against the noise you would see by chance. Here F = 4.04 with p = 0.054, right at the edge of significance. Adding `cyl` nudges the fit but does not clearly beat chance at α = 0.05. That borderline result is a healthy reminder: real data rarely gives you a clean yes/no, and a p-value hovering near α deserves a skeptical second look (sample size, confounding, a better specification).

The partial F-test follows the same F formula every nested model comparison uses:

$$F = \frac{(RSS_{small} - RSS_{big})/q}{RSS_{big}/(n - p - 1)}$$

Where:
- $RSS_{small}$, $RSS_{big}$ = residual sums of squares of the two models
- $q$ = number of parameters the big model adds
- $n$ = sample size
- $p$ = number of predictors in the big model

[TIP]
**Report the F statistic, its degrees of freedom, the p-value, and the change in adjusted R² together.** A p-value alone is the weakest of those four numbers. The ΔR² tells the reader how much predictive power you gained, the F and df let them reproduce the test, and the p-value puts a probability on the comparison.

### Problem 4: Read a t-test row and decide

**Try it:** Using `fit_big` from the teaching block, print the coefficient table and state whether `hp` is significant at α = 0.05. Save `"yes"` or `"no"` to `ex4_ans`.

```r title="Your turn: read a t-test row"
# Problem 4: inspect fit_big's summary and decide on hp at alpha=0.05
# your code here

ex4_ans <- # "yes" or "no"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 4 solution"
summary(fit_big)$coefficients
#>                Estimate  Std. Error    t value     Pr(>|t|)
#> (Intercept) 38.75178840 1.786999400 21.6854668 4.867545e-19
#> wt          -3.16697281 0.740557190 -4.2765351 2.008846e-04
#> hp          -0.01804156 0.011985755 -1.5052507 1.435138e-01
#> cyl         -0.94161630 0.550640701 -1.7098844 9.847503e-02

ex4_ans <- "no"
#> Explanation: hp p-value is 0.144, above 0.05.
```

**Explanation:** Once `cyl` enters the model, `hp` no longer clears α = 0.05, its p-value jumps from 0.0015 in `fit1` to 0.144 here. That shift is a classic multicollinearity symptom: `hp` and `cyl` carry overlapping information, so each partial slope gets diluted.

</details>

### Problem 5: Compare two nested models with anova()

**Try it:** Fit `lm(mpg ~ wt + hp + cyl + disp)` on `mtcars` and compare it against `fit_big` using `anova()`. Does adding `disp` improve the fit at α = 0.05?

```r title="Your turn: nested model comparison"
# Problem 5: compare fit_big (wt + hp + cyl) vs. a bigger model that adds disp
ex5_anova <- # your code here
print(ex5_anova)
#> Expected: an anova table with 2 rows and a Pr(>F) column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 5 solution"
fit_biggest <- lm(mpg ~ wt + hp + cyl + disp, data = mtcars)
ex5_anova <- anova(fit_big, fit_biggest)
print(ex5_anova)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ wt + hp + cyl
#> Model 2: mpg ~ wt + hp + cyl + disp
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1     28 170.44
#> 2     27 167.93  1    2.5071 0.4031 0.5308
```

**Explanation:** F = 0.40 with p = 0.53, nowhere close to significant. `disp` carries almost no new information once `wt`, `hp`, and `cyl` are already in. Keep the smaller model.

</details>

### Problem 6: Use drop1() to test every predictor at once

**Try it:** Run `drop1(fit_big, test = "F")` and identify which predictor would hurt the model *least* if dropped (the row with the highest p-value).

```r title="Your turn: drop1() for one-predictor-at-a-time F tests"
# Problem 6: run drop1() with F tests on fit_big
ex6_drop <- # your code here
print(ex6_drop)
#> Expected: a table with one row per predictor and Pr(>F)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 6 solution"
ex6_drop <- drop1(fit_big, test = "F")
print(ex6_drop)
#> Single term deletions
#>
#> Model:
#> mpg ~ wt + hp + cyl
#>        Df Sum of Sq    RSS    AIC F value    Pr(>F)
#> <none>              170.44 62.665
#> wt      1   111.264 281.70 74.994 18.2887 0.0002009
#> hp      1    13.792 184.23 63.153  2.2658 0.1435138
#> cyl     1    17.787 188.22 63.838  2.9237 0.0984750
```

**Explanation:** The row with the largest Pr(>F) is `hp` at 0.144, losing `hp` hurts the model least. `drop1()` refits the model without each predictor and reports the F test, which is the same as the individual t-test squared for a one-degree-of-freedom predictor.

</details>

## How do you diagnose and refine the model?

A fitted model only deserves trust as far as its residuals allow. Three checks cover most damage: `plot(fit)` scans the four diagnostic panels for curvature, non-normality, heteroscedasticity, and influence; Variance Inflation Factors (VIF) flag correlated predictors that inflate standard errors; and a log transform of a right-skewed predictor often straightens a curve the diagnostic panel flagged. Problems 7 to 9 put each of those three tools in your hands.

```r title="Diagnostic plots and a manual VIF"
# Fit a candidate model
fit_diag <- lm(mpg ~ wt + hp + disp + cyl, data = mtcars)

# Residuals-vs-fitted is the single most informative panel
plot(fit_diag, which = 1)

# Manual VIF for wt: regress wt on the remaining predictors
aux_wt <- lm(wt ~ hp + disp + cyl, data = mtcars)
vif_wt <- 1 / (1 - summary(aux_wt)$r.squared)
vif_wt
#> [1] 4.844618
```

The residuals-vs-fitted plot lets you judge two assumptions at once: linearity (no curved trend) and constant variance (no funnel). The VIF for `wt` is 4.84, below the common cutoff of 5, so `wt` is tolerably correlated with the other predictors. Anything above 10 is a red flag that the model cannot cleanly separate that predictor's effect from its neighbors.

![Diagnostics map](screenshots/Multiple-Regression-Exercises-in-R-diagnostics-map.webp)
*Figure 2: What each residual-plot pattern is warning you about. Match the plot's shape to the failure mode before choosing a remedy.*

[WARNING]
**A VIF above 5 does not automatically invalidate the model.** It flags *unstable* standard errors, the t-statistics become sensitive to tiny changes in the data. If the predictor is scientifically necessary, keep it and report that the individual coefficients are hard to separate; do not silently drop a meaningful predictor just to clean up the VIF.

[NOTE]
**`car::vif()` is the standard shortcut for production code.** We compute VIF manually here so every block runs directly in your browser without an extra package install. The numeric result is identical to `car::vif()`.

### Problem 7: Read residuals vs fitted

**Try it:** Fit `lm(mpg ~ disp, mtcars)` (one predictor, on purpose), draw the residuals-vs-fitted plot, and note whether you see a curved pattern. Set `ex7_curved` to `TRUE` or `FALSE`.

```r title="Your turn: spot curvature in residuals"
# Problem 7: fit a simple lm, plot residuals-vs-fitted, answer about curvature
ex7_fit <- lm(mpg ~ disp, data = mtcars)
plot(ex7_fit, which = 1)

ex7_curved <- # TRUE or FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 7 solution"
ex7_fit <- lm(mpg ~ disp, data = mtcars)
plot(ex7_fit, which = 1)
ex7_curved <- TRUE
#> The LOWESS smoother dips below zero in the middle and rises at both ends.
```

**Explanation:** The residuals-vs-fitted plot shows a clear U-shape because mpg is a nonlinear function of engine displacement. The remedy is either a quadratic term (`I(disp^2)`) or a log transform of `disp`, both of which straighten the curve.

</details>

### Problem 8: Compute VIF for disp in a four-predictor model

**Try it:** Using the same four-predictor model as the teaching block, compute the manual VIF for `disp` (not `wt`). Is it above or below the common cutoff of 5?

```r title="Your turn: manual VIF for disp"
# Problem 8: compute VIF(disp) by regressing disp on hp, wt, cyl
aux_disp <- # your code here
ex8_vif <- # 1 / (1 - R^2)
ex8_vif
#> Expected: a single number, well above 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 8 solution"
aux_disp <- lm(disp ~ wt + hp + cyl, data = mtcars)
ex8_vif <- 1 / (1 - summary(aux_disp)$r.squared)
ex8_vif
#> [1] 10.4634
```

**Explanation:** VIF(disp) = 10.5 exceeds the conventional cutoff of 10, `disp` is almost perfectly predictable from the other three variables, which explains why it was non-significant in Problem 5. Dropping `disp` from the model is the right call, which is exactly what Problem 5 already told you.

</details>

### Problem 9: Log-transform a skewed predictor and refit

**Try it:** `hp` has a right-skewed distribution. Refit `fit1` with `log(hp)` instead of `hp`, compare adjusted R², and decide which model fits better.

```r title="Your turn: log transform and compare"
# Problem 9: swap hp for log(hp) and compare adjusted R-squared
ex9_fit_log <- # your code here
summary(ex9_fit_log)$adj.r.squared
summary(fit1)$adj.r.squared
#> Expected: log version ~0.83, original ~0.81
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 9 solution"
ex9_fit_log <- lm(mpg ~ wt + log(hp), data = mtcars)

c(log_adj_r2 = summary(ex9_fit_log)$adj.r.squared,
  orig_adj_r2 = summary(fit1)$adj.r.squared)
#>  log_adj_r2 orig_adj_r2
#>   0.8306469   0.8148396
```

**Explanation:** Adjusted R² rises from 0.815 to 0.831 after the log transform, a small but real improvement. The log of hp compresses the long right tail, so the relationship with mpg straightens. Always prefer adjusted R² over raw R² when comparing models with the same outcome but different predictor forms, because adjusted R² penalises unnecessary complexity.

</details>

## Practice Exercises

Three capstone problems that combine every concept above. Each uses distinct `cap_` variable names so your exercise code does not collide with the teaching variables.

### Problem 10: Full model-building workflow

Start with every predictor in `mtcars` (`lm(mpg ~ ., data = mtcars)`), let `step()` pick the best AIC subset, refit on the chosen variables, and report the final adjusted R² plus the F statistic. Also name the predictors `step()` kept.

```r title="Capstone 10: step() + refit + report"
# Problem 10: full kitchen-sink workflow via AIC stepwise selection
cap10_full <- lm(mpg ~ ., data = mtcars)
cap10_step <- # your code using step()

# Then pull adjusted R^2 and F-statistic:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 10 solution"
cap10_full <- lm(mpg ~ ., data = mtcars)
cap10_step <- step(cap10_full, trace = 0, direction = "backward")

# Selected predictors
names(coef(cap10_step))[-1]
#> [1] "wt"   "qsec" "am"

# Final adjusted R-squared and F
cap10_summary <- summary(cap10_step)
c(adj_r2 = cap10_summary$adj.r.squared,
  fstat  = cap10_summary$fstatistic[1])
#>  adj_r2 fstat.value
#>  0.8335509  52.74807
```

**Explanation:** Backward stepwise removes variables that do not reduce AIC. The winning set for mpg is `wt`, `qsec`, and `am`, with adjusted R² = 0.83 and F = 52.7. `step()` silently refits and compares dozens of candidate models, `trace = 0` keeps the console quiet.

</details>

### Problem 11: Add and interpret an interaction term

Add the interaction `wt:am` to `lm(mpg ~ wt + am)` and interpret the coefficient on `wt:am`. Use one sentence along the lines of: "When `am` changes from 0 to 1, the slope of mpg on wt changes by X."

```r title="Capstone 11: interaction term"
# Problem 11: add wt:am interaction and read its coefficient
cap11_int <- # your code here
coef(cap11_int)
#> Expected: four coefficients including wt:am
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 11 solution"
cap11_int <- lm(mpg ~ wt + am + wt:am, data = mtcars)
coef(cap11_int)
#> (Intercept)          wt          am       wt:am
#>   31.416055   -3.785908   14.878422   -5.298360

# Interpretation:
# When am flips from 0 (automatic) to 1 (manual), the slope of mpg on wt
# steepens by -5.30, so manuals lose 5.30 *more* mpg per 1000 lb than automatics.
```

**Explanation:** The `wt:am` coefficient of −5.30 says the weight penalty is much harsher for manual cars. For automatics (am=0), one extra 1000 lb costs 3.79 mpg. For manuals (am=1), the cost is 3.79 + 5.30 = 9.09 mpg. That sign reversal of the `am` main effect once you account for the interaction is why interactions matter, the "average" effect of am is misleading when it depends on wt.

</details>

### Problem 12: Predict new cars with 95% prediction intervals

Refit `cap10_step` from Problem 10, then predict `mpg` for three new cars with these values: (wt=2.5, qsec=17.0, am=1), (wt=3.5, qsec=18.0, am=0), (wt=4.5, qsec=19.0, am=0). Return a matrix of point predictions and 95% prediction intervals.

```r title="Capstone 12: predict() with prediction intervals"
# Problem 12: predict three new cars with 95% prediction intervals
cap12_newdata <- data.frame(
  wt   = c(2.5, 3.5, 4.5),
  qsec = c(17.0, 18.0, 19.0),
  am   = c(1, 0, 0)
)
cap12_pred <- # predict with interval = "prediction"
print(cap12_pred)
#> Expected: 3-row matrix with fit, lwr, upr columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Problem 12 solution"
cap12_newdata <- data.frame(
  wt   = c(2.5, 3.5, 4.5),
  qsec = c(17.0, 18.0, 19.0),
  am   = c(1, 0, 0)
)
cap12_pred <- predict(cap10_step, newdata = cap12_newdata,
                      interval = "prediction", level = 0.95)
print(cap12_pred)
#>        fit       lwr      upr
#> 1 24.99008 19.725770 30.25439
#> 2 18.77116 13.791366 23.75095
#> 3 14.56916  9.368020 19.77030
```

**Explanation:** The first car (light, manual) is predicted at 25.0 mpg, with a 95% prediction interval of roughly [19.7, 30.3]. Prediction intervals are always wider than confidence intervals for the mean because they include *individual-car* variability, not just uncertainty in the average response. Use `interval = "confidence"` for the mean line, `interval = "prediction"` for a single new observation.

</details>

## Complete Example: the full workflow end to end

Here is every step chained on one dataset. Fit a candidate model on `mtcars`, read its summary, compare against a smaller rival with `anova()`, scan diagnostics with a VIF sweep, drop the worst offender, refit, and predict on a held-out row.

![Workflow](screenshots/Multiple-Regression-Exercises-in-R-workflow-flow.webp)
*Figure 1: The six-stage model-building workflow these 12 problems rehearse.*

```r title="Complete example: fit, test, diagnose, refine, predict"
# 1. Candidate model
final_fit <- lm(mpg ~ wt + hp + cyl + am, data = mtcars)

# 2. Read the summary
summary(final_fit)$adj.r.squared
#> [1] 0.8227204

# 3. VIF sweep (manual)
predictors <- c("wt", "hp", "cyl", "am")
vifs <- sapply(predictors, function(p) {
  f <- as.formula(paste(p, "~", paste(setdiff(predictors, p), collapse = "+")))
  1 / (1 - summary(lm(f, data = mtcars))$r.squared)
})
round(vifs, 2)
#>    wt    hp   cyl    am
#>  3.72  4.20  5.15  2.60

# 4. cyl has the highest VIF, drop it, refit
final_fit2 <- update(final_fit, . ~ . - cyl)
summary(final_fit2)$adj.r.squared
#> [1] 0.8227357

# 5. Predict for one held-out car
new_car <- data.frame(wt = 3.0, hp = 110, am = 1)
predict(final_fit2, newdata = new_car, interval = "prediction")
#>        fit      lwr      upr
#> 1 22.58067 17.23022 27.93111
```

Dropping `cyl` left adjusted R² essentially unchanged (0.8227 → 0.8227) while cleaning up the highest VIF. That is the hallmark of a healthy refine step, the model got simpler without sacrificing fit. The predicted mpg for a 3000-lb, 110-hp manual is 22.6, with a 95% prediction interval of [17.2, 27.9]. That width of roughly ±5.4 mpg is the honest uncertainty you should quote to a stakeholder, not the point estimate alone.

## Summary

| # | Problem | Concept tested | R function |
|---|---|---|---|
| 1 | Extract a coefficient | `coef()` indexing | `coef()` |
| 2 | Interpret a partial slope | Partial effect language | Prose |
| 3 | Build 95% CIs | t-based interval | `confint()` |
| 4 | Read a t-test row | p-value decision | `summary()$coefficients` |
| 5 | Compare nested models | Partial F-test | `anova()` |
| 6 | Drop predictors | One-at-a-time F-tests | `drop1()` |
| 7 | Spot curvature | Residuals vs fitted | `plot(fit, which = 1)` |
| 8 | Detect multicollinearity | Manual VIF | `lm()` + `summary()$r.squared` |
| 9 | Transform a predictor | Log transform | `log()` inside formula |
| 10 | Select variables by AIC | Backward stepwise | `step()` |
| 11 | Add an interaction | Slope-change interpretation | `wt:am` formula syntax |
| 12 | Predict new data | Prediction intervals | `predict(..., interval = "prediction")` |

## References

1. James, G., Witten, D., Hastie, T., Tibshirani, R., *An Introduction to Statistical Learning*, 2nd edition, Chapter 3. [Link](https://www.statlearning.com/)
2. Fox, J., *Applied Regression Analysis and Generalized Linear Models*, 3rd edition. Sage Publications (2016).
3. Wickham, H. & Grolemund, G., *R for Data Science*, Chapter 23: Model Basics. [Link](https://r4ds.had.co.nz/model-basics.html)
4. R Core Team, `stats::lm` reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
5. R Core Team, `stats::step` reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/step.html)
6. Fox, J. & Weisberg, S., *car* package documentation: Variance Inflation Factors. [Link](https://cran.r-project.org/package=car)
7. Kutner, M. H., Nachtsheim, C. J., Neter, J., Li, W., *Applied Linear Statistical Models*, 5th edition. McGraw-Hill (2004).

## Continue Learning

1. [Multiple Regression in R](Multiple-Regression-in-R.html), the parent tutorial that introduces every concept used above.
2. [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), a deeper dive into the four diagnostic plots and how to remedy each failure.
3. [Interpreting Regression Output Completely](Interpreting-Regression-Output-Completely.html), line-by-line reading of `summary(lm)` output for every term.
