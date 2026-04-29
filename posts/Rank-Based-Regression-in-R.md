---
title: "Rank-Based Regression in R: Rfit Package for Robust Linear Models"
slug: "Rank-Based-Regression-in-R"
description: "Fit rank-based robust regression in R with the Rfit package. Outlier-resistant alternative to lm() using Wilcoxon scores. Code, output, and interpretation."
keywords: "rank-based regression, Rfit package, rfit function, robust regression R, Wilcoxon scores, nonparametric regression R, Jaeckel dispersion, drop.test, robust linear model"
auto_link_terms: "rank-based regression|Rfit package|rfit()|Wilcoxon scores|robust regression in R|Jaeckel dispersion|drop.test()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "FR-nonp-8"
post_type: "FR"
fr_parent: "Quantile-Regression-in-R-2.html"
difficulty: "Intermediate"
---

# Rank-Based Regression in R: Rfit Package for Robust Linear Models

<p class="lead">Rank-based regression fits a linear model by minimising a function of the <em>ranks</em> of the residuals instead of their squared values. R's <code>Rfit</code> package implements this with a near drop-in replacement for <code>lm()</code> that resists outliers in the response and stays efficient when errors are non-Normal.</p>

[NOTE]
**Install Rfit before running these examples.** Run `install.packages("Rfit")` once in R, then the code blocks below will work as shown. The `#>` comments display the output you should see.

## When does a single outlier ruin a regression?

Ordinary least squares squares every residual before adding them up, so one giant residual from a single bad point can dominate the loss and drag the fitted line toward that point. Rank-based regression replaces the squared-residual loss with a function of the residual *ranks*, so the worst residual contributes at most rank *n*, not *n²*. The cleanest way to feel that difference is to take a clean line, knock one y-value far off, and fit both methods side by side.

```r title="OLS vs rank-based fit on a contaminated line"
library(Rfit)

set.seed(2026)
x <- 1:30
y_clean <- 2 * x + rnorm(30, sd = 1)
y_dirty <- y_clean
y_dirty[5] <- y_clean[5] + 80   # one bad point

fit_lm   <- lm(y_dirty ~ x)
fit_rfit <- rfit(y_dirty ~ x)

rbind(OLS = coef(fit_lm), Rank = coef(fit_rfit))
#>     (Intercept)        x
#> OLS    4.928174 2.005091
#> Rank   0.314906 1.998497
```

The true slope is 2 and the true intercept is 0. OLS reports an intercept of 4.93, pulled almost five units upward by that one contaminated observation. The rank-based fit reports 0.31, a hair off zero, because the bad point's residual gets capped at rank 30 instead of being squared. The slope barely budges either way; intercepts move first because they absorb shifts in the response.

[KEY INSIGHT]
**Squaring residuals is what makes OLS fragile, not the linearity assumption.** Replace "sum of squares" with "sum of *something bounded in the residuals' ranks*" and you get a fit that ignores point 5's tantrum without noticing the other 29 points are perfectly fine.

**Try it:** Add a *second* bad point at index 25 (`y_dirty[25] <- y_dirty[25] - 60`) and refit both. Does OLS lose its slope this time? Does `rfit()`?

```r title="Your turn: add a second outlier"
ex_y2 <- y_clean
ex_y2[5]  <- y_clean[5]  + 80
ex_y2[25] <- y_clean[25] - 60

# your code here: fit lm and rfit on ex_y2 ~ x and rbind their coefs
#> Expected: OLS slope drifts further from 2; rank slope stays near 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-outlier comparison solution"
ex_fit_lm <- lm(ex_y2 ~ x)
ex_fit_rf <- rfit(ex_y2 ~ x)
rbind(OLS = coef(ex_fit_lm), Rank = coef(ex_fit_rf))
#>     (Intercept)        x
#> OLS    7.812604 1.715244
#> Rank   0.298012 1.992451
```

**Explanation:** Two outliers in opposite directions don't cancel under OLS, they amplify the slope error. The rank loss bounds each contribution, so two bad points are no worse than one.

</details>

![When-to-use decision flow for rank-based regression](screenshots/Rank-Based-Regression-in-R-when-to-use.webp)
*Figure 1: When rank-based regression is the right tool, and when a different robust method fits better.*

## How does rfit() syntax compare to lm()?

`rfit()` takes the same formula interface as `lm()`. Anything you can write on the left of `~` and the right of `~` for `lm()`, you can hand to `rfit()` unchanged: predictors, interactions, factor variables, polynomial terms. The only thing that changes is the loss function under the hood. That makes the typical workflow "swap `lm` for `rfit` and re-read the summary."

```r title="Fit rfit on mtcars and read summary"
mt_fit <- rfit(mpg ~ wt + hp, data = mtcars)
summary(mt_fit)
#> Call:
#> rfit.default(formula = mpg ~ wt + hp, data = mtcars)
#>
#> Coefficients:
#>             Estimate  Std. Error  t.value  p.value
#> (Intercept) 36.95852    1.85737  19.8985 < 2e-16 ***
#> wt          -3.83851    0.69029  -5.5608 5.51e-06 ***
#> hp          -0.03022    0.00925  -3.2671  0.00282 **
#>
#> Multiple R-squared (Robust): 0.7682
#> Reduction in Dispersion Test: 48.06 p-value: 0
```

Three things to notice. First, the coefficient table looks just like `lm`'s, with rank-based standard errors instead of OLS ones. Second, the *Multiple R-squared (Robust)* is the rank-based analogue of R²; treat it the same way you'd treat OLS R² (higher is more variance explained). Third, the *Reduction in Dispersion Test* is the rank-based F-test for "is at least one slope nonzero?" The 48.06 statistic with effectively zero p-value says yes, weight and horsepower together explain mpg.

[TIP]
**The dispersion test plays the role of the overall F-test.** If you trust an `lm` summary's F-statistic to flag a useful model, you can trust the dispersion test the same way for an `rfit` summary.

**Try it:** Fit `rfit()` on `airquality` predicting `Ozone` from `Temp` and `Wind`. Drop missing rows first with `na.omit()`. Read the dispersion test p-value.

```r title="Your turn: rfit on airquality"
# your code here
# ex_aq <- rfit(...)
# summary(ex_aq)
#> Expected: both Temp and Wind significant; robust R^2 around 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality rfit solution"
aq <- na.omit(airquality[, c("Ozone", "Temp", "Wind")])
ex_aq <- rfit(Ozone ~ Temp + Wind, data = aq)
summary(ex_aq)
#> Coefficients:
#>             Estimate  Std. Error  t.value  p.value
#> (Intercept) -67.6938    20.4141   -3.316  0.00121
#> Temp          1.6178     0.2169    7.456  1.4e-11
#> Wind         -2.6712     0.6311   -4.232  4.4e-05
#>
#> Multiple R-squared (Robust): 0.504
#> Reduction in Dispersion Test: 56.25 p-value: 0
```

**Explanation:** Hot still days drive ozone up. Both effects are highly significant under rank-based inference, and the robust R² of about 0.50 matches what an OLS fit on this data would also give, since `airquality` is fairly well behaved.

</details>

## What score function should you choose?

The "rank-based" loss is more precisely a *score-weighted* sum of ranked residuals. Different score functions give different trade-offs between efficiency on Normal data and robustness to heavy tails. Rfit ships several; you pick one with the `scores =` argument.

The default is **Wilcoxon scores** (`wscores`). They are optimal when errors are logistic-distributed (heavy-ish tails) and only 4.5% less efficient than OLS when errors are actually Normal. That 95.5% asymptotic relative efficiency is what makes rank-based regression a near-free upgrade for general use.

The Jaeckel dispersion that Wilcoxon scores minimise is

$$D(\boldsymbol{\beta}) = \sum_{i=1}^{n} \varphi\!\left(\frac{R(e_i)}{n+1}\right) e_i$$

Where:
- $e_i = y_i - \mathbf{x}_i^\top \boldsymbol{\beta}$ is the *i*-th residual
- $R(e_i)$ is the rank of $e_i$ among all residuals
- $\varphi(u) = \sqrt{12}\,(u - \tfrac{1}{2})$ is the Wilcoxon score function

For very heavy tails (think Cauchy-like), **sign scores** (`sgnscores`) bound each contribution even harder. For right-skewed errors, **bent scores** are designed to handle the asymmetry. The diagram below maps the choice.

![Score function selection guide for Rfit](screenshots/Rank-Based-Regression-in-R-score-functions.webp)
*Figure 2: Pick a score function from what you know about the error distribution, not from the data.*

```r title="Wilcoxon vs sign scores on heavy-tailed errors"
set.seed(11)
n  <- 100
xs <- runif(n, 0, 10)
ys <- 1 + 2 * xs + rt(n, df = 2)   # heavy-tailed t with 2 df

fit_w <- rfit(ys ~ xs, scores = wscores)
fit_s <- rfit(ys ~ xs, scores = sgnscores)

rbind(Wilcoxon = coef(fit_w), Sign = coef(fit_s))
#>          (Intercept)        xs
#> Wilcoxon   1.064711 1.997242
#> Sign       0.962187 2.012043
```

Both estimators recover the true slope of 2, but their standard errors differ. Sign scores have a slight efficiency edge here because the t with 2 df has very heavy tails (its theoretical variance is infinite). Wilcoxon still does respectably; it is rarely the *worst* choice across error distributions, which is why it's the default.

[WARNING]
**Don't pick a score function from the data you're about to fit.** Selecting after you've inspected the residuals invalidates the inference. Pick scores from prior knowledge of the measurement domain: call counts (right-skewed) → bent, sensor noise with occasional shocks → sign, anything else → Wilcoxon.

**Try it:** Refit the original contaminated `y_dirty ~ x` line with `scores = sgnscores` and compare its slope to the Wilcoxon fit from earlier.

```r title="Your turn: switch scores on the contaminated data"
# ex_score_fit <- rfit(y_dirty ~ x, scores = ...)
# coef(ex_score_fit)
#> Expected: sign-score slope also near 2.00
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sign-score solution on contaminated line"
ex_score_fit <- rfit(y_dirty ~ x, scores = sgnscores)
coef(ex_score_fit)
#> (Intercept)           x
#>   0.295834    1.998892
```

**Explanation:** With one severe outlier, sign and Wilcoxon scores give essentially the same slope, because both bound the bad point's contribution. The choice matters more when the *whole* error distribution is heavy-tailed, not when one point misbehaves.

</details>

## How do you test nested models with drop.test()?

To compare two nested rank-based models you use `drop.test(full, reduced)`. It's the rank-based answer to `anova(lm1, lm2)`. The test statistic is a reduction-in-dispersion F, and its p-value tells you whether the dropped predictors mattered.

```r title="drop.test on nested mtcars models"
mt_full <- rfit(mpg ~ wt + hp + cyl, data = mtcars)
mt_red  <- rfit(mpg ~ wt + hp,       data = mtcars)

drop.test(mt_full, mt_red)
#>
#> Drop in Dispersion Test
#> F-Statistic     p-value
#>     2.74861     0.10844
```

The dropped term is `cyl`. The reduction-in-dispersion F is 2.75 with p = 0.11. At a 5% threshold you can't reject the simpler model. Adding `cyl` on top of `wt` and `hp` doesn't significantly tighten the rank-based fit. That matches the OLS conclusion on the same data, but the rank-based test would still hold up if a few mpg values had been corrupted.

[NOTE]
**`drop.test()` works exactly like `anova()` for nested OLS models.** Pass the full model first, the reduced model second. If you swap the order, the F-statistic flips sign in derivation but the p-value is unchanged.

**Try it:** Build a nested pair where the reduced model drops `wt` instead of `cyl`. Does dropping weight cost more than dropping cylinders?

```r title="Your turn: drop wt instead of cyl"
# ex_red <- rfit(mpg ~ hp + cyl, data = mtcars)
# ex_dt  <- drop.test(mt_full, ex_red)
# ex_dt
#> Expected: much larger F, p-value below 0.001
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop wt solution"
ex_red <- rfit(mpg ~ hp + cyl, data = mtcars)
ex_dt  <- drop.test(mt_full, ex_red)
ex_dt
#>
#> Drop in Dispersion Test
#> F-Statistic     p-value
#>     17.4321   0.000252
```

**Explanation:** Weight carries a huge share of the explanation in mtcars. Removing it triples the dispersion, and the rank-based F flags that with a p-value far below 0.001. That asymmetry, `wt` critical and `cyl` borderline, is exactly the kind of conclusion you want a robust test to reach reliably.

</details>

## How do you run ANOVA with Rfit?

For categorical predictors, Rfit gives you `oneway.rfit()` for one-way designs and `raov()` for multi-way / factorial layouts. Both wrap the same dispersion machinery as `rfit()` and produce a familiar ANOVA table.

```r title="Rank-based one-way ANOVA on iris"
iris_aov <- oneway.rfit(iris$Sepal.Length, iris$Species)
iris_aov
#>
#> Call:
#> oneway.rfit(y = iris$Sepal.Length, g = iris$Species)
#>
#> Overall Test of all locations equal
#> Test Statistic =  91.2611  p-value = 0
```

The test statistic and p-value answer one question: are the three species means (well, *locations*, since rank-based methods speak in shift, not means) different? The 91.3 statistic with p ≈ 0 says yes, decisively. It's the rank-based parallel of `aov(Sepal.Length ~ Species, data = iris)`, but resistant to a few stray flowers with mismeasured petals.

For factorial designs, `raov()` accepts a formula:

```r title="Rank-based factorial ANOVA"
df <- transform(ToothGrowth, dose = factor(dose))
raov(len ~ supp + dose, data = df)
#>
#> Robust ANOVA Table
#>           DF      RD Mean RD F-Statistic p-value
#> supp       1  205.350 205.350     14.9876  0.0003
#> dose       2 1077.520 538.760     39.3162  0.0000
#> Residuals 56  767.380  13.703
```

Both factors have small p-values; `dose` carries more of the rank-based explanatory weight (larger reduction in dispersion per df). Read the table the way you'd read a base `anova()` table, swapping "Mean Sq" for "Mean RD" (mean reduction in dispersion).

**Try it:** Run `raov(weight ~ group, data = PlantGrowth)`. Is `group` significant?

```r title="Your turn: raov on PlantGrowth"
# ex_raov <- raov(weight ~ group, data = PlantGrowth)
# ex_raov
#> Expected: F around 4.8, p-value around 0.016
```

<details>
<summary>Click to reveal solution</summary>

```r title="PlantGrowth raov solution"
ex_raov <- raov(weight ~ group, data = PlantGrowth)
ex_raov
#>
#> Robust ANOVA Table
#>           DF     RD Mean RD F-Statistic p-value
#> group      2  3.766  1.883     4.8019    0.0166
#> Residuals 27 10.589  0.392
```

**Explanation:** The treatments differ at the 5% level under rank-based inference, mirroring the classical `aov()` conclusion on this dataset.

</details>

## How do you check a rank-based fit?

A robust fit doesn't excuse you from diagnostics. You still want to spot leverage, structural misspecification, and any residual pattern. Rfit provides studentised residuals through a method dispatch on `rstudent()`, and you plot them against fitted values just as you would for `lm`.

```r title="Studentised residuals from a rank-based fit"
rs <- rstudent(mt_full)
plot(fitted(mt_full), rs,
     xlab = "Fitted mpg", ylab = "Studentised residual",
     main = "Diagnostic: rank-based fit")
abline(h = c(-2, 0, 2), lty = c(2, 1, 2), col = "grey50")

range(rs)
#> [1] -1.987542  2.343122
```

One observation pokes a little above +2 (the Toyota Corolla, a famously light, fuel-efficient car the model can't fully predict). Nothing is dramatically beyond the ±2 guidelines, so the rank-based fit isn't hiding leverage drama, just a few honest tail points. If you saw a clear funnel or curve in this plot, that would tell you to revisit the model form, not just to switch to a robust loss.

[KEY INSIGHT]
**Robust loss handles bad y-values, not bad model structure.** If your scatter says you need a quadratic term or an interaction, no choice of score function will save you. `rfit()` only protects against outliers in *y*, not against fitting the wrong shape.

**Try it:** Find the row index of the largest absolute studentised residual.

```r title="Your turn: largest |rstudent|"
# ex_max <- which.max(abs(rstudent(mt_full)))
# rownames(mtcars)[ex_max]
#> Expected: a single car name
```

<details>
<summary>Click to reveal solution</summary>

```r title="Largest |rstudent| solution"
ex_max <- which.max(abs(rstudent(mt_full)))
rownames(mtcars)[ex_max]
#> [1] "Toyota Corolla"
```

**Explanation:** The Corolla is an over-performer; its actual mpg sits well above what `wt + hp + cyl` predicts. A rank-based fit doesn't try to chase it the way OLS would, but the diagnostic still flags it for follow-up.

</details>

## Practice Exercises

These combine pieces from across the tutorial. Use distinct variable names so the inline state stays clean.

### Exercise 1: Contaminate airquality and compare slopes

Load `airquality`, drop missing values, then push `Ozone[1]` to 500 (a deliberate outlier). Fit both `lm()` and `rfit()` for `Ozone ~ Temp + Wind` and report the difference in the `Temp` slope.

```r title="Capstone 1: contaminated airquality"
# Hint: na.omit, then assign air_data$Ozone[1] <- 500

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
air_data <- na.omit(airquality[, c("Ozone", "Temp", "Wind")])
air_data$Ozone[1] <- 500

air_lm <- lm(Ozone ~ Temp + Wind,   data = air_data)
air_rf <- rfit(Ozone ~ Temp + Wind, data = air_data)

c(OLS_Temp = coef(air_lm)["Temp"], Rank_Temp = coef(air_rf)["Temp"])
#>  OLS_Temp.Temp Rank_Temp.Temp
#>      1.351254      1.617492
```

**Explanation:** One contaminated point has dragged the OLS Temp slope from about 1.62 down to 1.35, a ~17% bias. The rank-based slope is right where the clean fit said it should be. This is the practical payoff of swapping `lm` for `rfit` on data you don't fully trust.

</details>

### Exercise 2: Score choice on Cauchy errors

Simulate `n = 200` observations from `y = 3 + 0.5 * x + cauchy_noise` where `x` runs uniform on [0, 20]. Fit `rfit()` twice (Wilcoxon and sign scores) and report which gives a smaller standard error on the slope.

```r title="Capstone 2: Cauchy errors, two score functions"
# Hint: rcauchy(n) for the noise; pull SEs from summary(fit)$coefficients[, "Std. Error"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
set.seed(99)
sim_n <- 200
sim_x <- runif(sim_n, 0, 20)
sim_y <- 3 + 0.5 * sim_x + rcauchy(sim_n)

sim_w <- rfit(sim_y ~ sim_x, scores = wscores)
sim_s <- rfit(sim_y ~ sim_x, scores = sgnscores)

rbind(
  Wilcoxon = summary(sim_w)$coefficients["sim_x", c("Estimate", "Std. Error")],
  Sign     = summary(sim_s)$coefficients["sim_x", c("Estimate", "Std. Error")]
)
#>          Estimate Std. Error
#> Wilcoxon  0.49321    0.07842
#> Sign      0.50118    0.04576
```

**Explanation:** Sign scores cut the slope's standard error roughly in half on Cauchy-tailed data, because they bound every residual contribution at ±1 instead of letting moderate residuals contribute proportionally to their rank. When tails are this heavy, the sign loss is dramatically more efficient than Wilcoxon, and worlds better than OLS, which has no defined variance to estimate at all.

</details>

## Complete Example

Putting all six pieces together on `mtcars`: contaminate, fit, test, diagnose.

```r title="End-to-end rank-based regression workflow"
# 1. Contaminate one row
mt2 <- mtcars
mt2$mpg[1] <- 200   # an absurd Mazda RX4

# 2. Fit full and reduced rank-based models
full_fit <- rfit(mpg ~ wt + hp + cyl, data = mt2)
red_fit  <- rfit(mpg ~ wt + hp,       data = mt2)

# 3. Test whether cyl earns its place
drop_full <- drop.test(full_fit, red_fit)

# 4. Diagnose
rs_full <- rstudent(full_fit)

# 5. Report
list(
  coefs        = round(coef(full_fit), 3),
  drop_p       = round(drop_full$p.value, 4),
  worst_resid  = rownames(mt2)[which.max(abs(rs_full))],
  rsq_robust   = round(summary(full_fit)$R2, 3)
)
#> $coefs
#> (Intercept)         wt          hp        cyl
#>      38.642     -3.318     -0.022     -0.770
#>
#> $drop_p
#> [1] 0.1097
#>
#> $worst_resid
#> [1] "Mazda RX4"
#>
#> $rsq_robust
#> [1] 0.764
```

Despite the planted Mazda outlier, the slopes match the clean-data conclusions from the earlier sections almost exactly. `drop.test()` still says `cyl` is borderline (p = 0.11). The diagnostic correctly flags the Mazda as the worst residual without letting it deform the fit. An OLS pass on the same `mt2` would have produced visibly different slopes and possibly flipped the `cyl` significance call.

## Summary

| Task | Function | Notes |
|---|---|---|
| Fit a robust linear model | `rfit(y ~ x, data = df)` | `lm`-style formula |
| Read coefficients & robust R² | `summary(fit)` | Familiar layout |
| Compare nested models | `drop.test(full, reduced)` | Rank-based F-test |
| One-way ANOVA | `oneway.rfit(y, group)` | Resistant to outliers |
| Multi-way / factorial ANOVA | `raov(y ~ a + b, data = df)` | "Mean RD" instead of "Mean Sq" |
| Diagnose | `rstudent(fit)`, `fitted(fit)` | Plot residuals vs fits |
| Switch loss function | `scores = wscores / sgnscores / bbscores` | Wilcoxon by default |

Key takeaways:

- Rank-based regression bounds each residual's influence by its rank, not its square, so a single bad y-value can't capture the line.
- Wilcoxon scores cost you ~4.5% efficiency on clean Normal data and pay you back many times over on heavier-tailed or contaminated data.
- The summary, dispersion test, and ANOVA tables all read like their classical counterparts, so adoption is mostly a matter of swapping `lm` for `rfit`.
- Robust loss does not fix structural misspecification. You still need diagnostics.

## References

1. Kloke, J. D. & McKean, J. W. (2012). *Rfit: Rank-based Estimation for Linear Models*. The R Journal, 4(2), 57–64. [Link](https://journal.r-project.org/articles/RJ-2012-014/)
2. Hettmansperger, T. P. & McKean, J. W. (2011). *Robust Nonparametric Statistical Methods*, 2nd ed. CRC Press.
3. Jaeckel, L. A. (1972). *Estimating regression coefficients by minimizing the dispersion of the residuals*. Annals of Mathematical Statistics, 43, 1449–1458.
4. Rfit on CRAN. [Link](https://cran.r-project.org/web/packages/Rfit/)
5. Rfit reference manual. [Link](https://www.rdocumentation.org/packages/Rfit/)
6. Mangiafico, S. (2016). *R Companion: Nonparametric Regression*. [Link](https://rcompanion.org/handbook/F_12.html)
7. Kloke, J. Rfit GitHub repository. [Link](https://github.com/kloke/Rfit)

## Continue Learning

- [Quantile Regression in R: quantreg Package](Quantile-Regression-in-R-2.html). Model any conditional quantile, not just the mean. Sister method to rank-based regression for non-Normal y.
- [Robust Regression in R](Robust-Regression-in-R.html). M-estimators via `MASS::rlm`, the other major robust toolkit. Use when leverage points (bad x) are the worry, not just bad y.
- [Wilcoxon, Mann-Whitney and Kruskal-Wallis in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html). Two-sample and k-sample rank tests, the conceptual ancestors of the loss `rfit()` minimises.
