---
title: "Advanced Regression Lesson 2: MM-Estimation and the Breakdown Point"
catalog_blurb: "How to fit a regression you can trust when many rows are bad."
description: "A batch of bad high-leverage rows can fool Huber and break an M-estimator. Learn what the breakdown point means, then fit MM-estimators in R with rlm and lmrob."
keywords: "robust regression, MM-estimation, breakdown point, S-estimator, high leverage, lmrob, robustbase, rlm, MASS, Huber, outliers, R"
post_type: "LESSON"
curriculum_id: "6.130.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "2"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Quantile-Regression.html"
course_prev: "Robust-Regression-M-Estimators.html"
---

=== step === cover
::eyebrow Lesson 2 of 13
## MM-Estimation and the Breakdown Point

Last lesson, a clerk at the rental agency mistyped one flat's rent, and a Huber M-estimator quietly caught it: the bad row lost its weight and the line snapped back to the honest trend. Huber wins when the bad value sits in the **middle** of the data.

This week the trouble is worse. The agency's data feed imported a batch of large commercial units, and every one of their rents came in as the same wrong placeholder. These bad rows are not just off-trend, they are also far out on the size axis. That combination, as you are about to see, walks straight past Huber. To beat it you need a stronger idea: the breakdown point, and the MM-estimator built to reach it.

By the end of this lesson you will be able to:

- Explain how a bad **high-leverage** point drags the line onto itself and hides in a small residual
- Define an estimator's **breakdown point** and rank OLS, M-estimators, and MM-estimators by it
- Fit an **MM-estimator** in R with `rlm(method = "MM")` and `lmrob()`, and read the weights it assigns

**Prerequisites:** Lesson 1 of this course (M-estimators, Huber and Tukey weights, `rlm()`, and telling leverage apart from influence).

::widget robust-weights {}

=== step === concept
::eyebrow The new villain
## A bad row that hides in plain sight

In Lesson 1 the mistyped flat sat in the middle of the size range, so when it pulled the line down it still ended up far from that line: a big residual, which is exactly the signal Huber watches for. A **high-leverage** point is different. Leverage measures how unusual a row's x value is: a listing whose floor area is far larger than every other sits at the end of a long see-saw, so it can swing the line hard.

Here is the trap. When a far-out point is also off-trend, the least-squares line **tips toward it** to shave down its huge squared residual. Once the line has tipped, the point is no longer far from the line. Its residual \(r_i = y_i - \hat{y}_i\) shrinks toward zero even though the row is badly wrong. Statisticians call this **masking**: the outlier hides inside the fit it just corrupted.

Drag the far-right point below the trend and watch it happen. The solid "with the point" line chases it down, so the vertical gap between the point and that solid line, its residual, stays far smaller than such a wrong value should ever produce. Any method that decides who to trust by looking at residual size is now blind.

::widget leverage-point {}

=== step === concept
::eyebrow The shock
## Watch Huber break

Let us rebuild the agency's data and add the broken import: twelve clean listings on the true trend, then four large commercial units (150 to 165 square metres) whose rents all arrived as a low placeholder near 600.

```r
set.seed(1)
size <- c(30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85)   # floor area, square metres
rent <- round(250 + 11 * size + rnorm(12, 0, 45))           # clean listings, monthly euros
apartments <- data.frame(size, rent)

# a broken import: four big units, each rent mis-fed as a ~600 placeholder
bad <- data.frame(size = c(150, 155, 160, 165), rent = c(600, 640, 610, 660))
apartments <- rbind(apartments, bad)

round(coef(lm(rent ~ size, data = apartments)), 2)          # OLS, WITH the bad batch
#> (Intercept)        size
#>      920.06       -1.12
round(coef(lm(rent ~ size, data = apartments[1:12, ])), 2)  # the clean rows only
#> (Intercept)        size
#>      217.97       11.77
```

The honest slope is **11.77** euros per square metre. With the bad batch, ordinary least squares reports **-1.12**: it now claims bigger flats rent for *less*. No surprise, we know OLS trusts every row. The real question is whether Huber, which saved us last time, rescues this. Fit it and read the per-row weights.

```r
library(MASS)
fit_huber <- rlm(rent ~ size, data = apartments, psi = psi.huber, maxit = 50)
round(coef(fit_huber), 2)
#> (Intercept)        size
#>      915.58       -1.17
round(fit_huber$w, 2)   # the weight Huber gave each row (rows 13-16 are the bad batch)
#>  [1] 0.91 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 0.79 0.77 1.00 1.00 1.00
#> [16] 1.00
```

[WARNING]
Huber failed. Its slope is **-1.17**, no better than OLS, and look at the weights: the four bad rows (13 to 16) each got **1.00**, full trust. Worse, two honest rows (11 and 12) were down-weighted to 0.79 and 0.77. The bad cluster tipped the line onto itself, masking its own residuals, and then framed the good rows for the crime.

=== step === quiz
::eyebrow Check yourself
## Why did Huber trust the bad rows?

The four mistyped commercial units are obviously wrong, yet the Huber fit handed each of them a weight of 1.00. What happened?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Huber decided the four rows were clean because their rents are close together ::no It is not about the rows agreeing with each other. Huber weights a row purely by its own residual; clustering matters only because it helped the four drag the line onto themselves.
- Their rents are small numbers, and small numbers get small weights ::no Weight has nothing to do with the size of the value. It depends on the residual, the gap from the fitted line, standardized by the residual spread.
- The four points dragged the line down onto themselves, so their residuals became small, and Huber weights by residual size ::ok Exactly. That is masking. A high-leverage cluster tips the fit toward itself until its residuals look tiny, and any residual-based method, Huber included, is fooled into full trust.

=== step === concept
::eyebrow The measure that matters
## The breakdown point

Lesson 1 hinted at this, now we make it precise. An estimator's **breakdown point** \(\varepsilon^*\) is the smallest fraction of the rows that, if replaced by arbitrarily bad values, can drag the estimate arbitrarily far from the truth. It answers a blunt question: how much of my data can be garbage before my fit is meaningless?

For ordinary least squares, \(\varepsilon^* = 0\): a single row taken to infinity takes the slope with it. A monotone M-estimator like Huber protects against a bad **y**, but against bad **leverage** its breakdown point is still essentially \(0\), because one well-placed cluster can mask itself, exactly what you just saw. The most any estimator can hope for is \(\varepsilon^* = 0.5\): past half your rows being bad, no method can tell the real trend from the contamination, because the contamination *is* the majority.

| Method | In R | What it minimizes | Breakdown point |
|---|---|---|---|
| Least squares | `lm()` | the sum of squared residuals | 0% (one bad row is enough) |
| M-estimator | `rlm()`, Huber | a gentler loss of each residual | about 0% against bad leverage |
| S-estimator | (the engine inside MM) | a robust **spread** of the residuals | up to 50% |
| MM-estimator | `rlm(method = "MM")`, `lmrob()` | an S-fit, then an efficient M-step | up to 50%, high efficiency |

Our bad batch is 4 of 16 rows, 25%. Under 50%, so an estimator with a 50% breakdown point should shrug it off completely. That estimator is the MM-estimator.

=== step === concept
::eyebrow The fix
## MM-estimation: robust start, efficient finish

Huber breaks because it starts from the OLS line, which the leverage cluster has already poisoned, and then judges residuals against that poisoned fit. MM-estimation refuses to trust the starting point. The name is literally "M applied twice, with an S in the middle," and it runs in three moves.

**Stage 1, the S-estimator.** Instead of minimizing the sum of squared residuals, search for the line whose residuals have the smallest *robust spread*. Formally the S-estimator picks the coefficients that minimize a scale \(\hat{s}\) solving \(\frac{1}{n}\sum_i \rho\!\left(\frac{r_i}{\hat{s}}\right) = \delta\), where \(\rho\) is a **bounded** loss (each residual can add only so much, no matter how huge) and \(\delta\) is a constant tuned for a 50% breakdown point. Because \(\rho\) is capped, a far-off cluster cannot inflate \(\hat{s}\), so the S-line ignores the bad rows from the very start.

**Stage 2, the efficient M-step.** An S-estimator has the 50% breakdown we want but is noisy on clean data (it throws away efficiency, the share of least-squares precision you keep when the data really are clean). So we polish: run one redescending M-estimate (a weighting that lets a wild residual fall all the way to zero weight, the way the Tukey loss did in Lesson 1) starting from the robust S-line and holding its robust scale \(\hat{s}\) fixed, tuned so efficiency \(\approx 0.95\). The result **inherits** the 50% breakdown point from Stage 1 and **recovers** near-OLS precision from Stage 2. Best of both.

::widget process-flow {"steps":[{"title":"Robust start: S-estimator","sub":"find the line whose residuals have the smallest robust spread"},{"title":"Lock the robust scale","sub":"keep that spread s; a far cluster cannot inflate it"},{"title":"Efficient M-step","sub":"polish from the robust start; keep near-OLS precision"}]}

=== step === quiz
::eyebrow Check yourself
## What the S-stage buys

Huber and MM both finish with an M-step. The difference is that MM runs an S-estimator first. What does that first stage give the MM-estimator that a plain Huber fit never has?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A starting line and a residual scale built to ignore high-leverage contamination, so the M-step never judges residuals against a poisoned fit ::ok Right. The S-estimator has a 50% breakdown point, so its line and its scale survive the bad cluster. The M-step then refines from safe ground, which is why MM catches what Huber masks.
- Faster convergence, because the S-estimator needs fewer iterations ::no Speed is not the point, and the S-estimator is actually more work. The value is robustness of the starting fit and scale, not iteration count.
- Higher efficiency on clean data than the M-step alone could reach ::no It is the other way around: the S-estimator is inefficient. Efficiency comes from the second stage, the M-step. The S-stage contributes the breakdown point, not the efficiency.

=== step === tryit
::eyebrow In R
## Fit an MM-estimator in two words

You already know `rlm()`. To make it an MM-estimator instead of a plain Huber M-estimator, pass `method = "MM"`, which tells `rlm` to run the S-stage first and then the efficient M-step. Fill in the blank.

```r
library(MASS)
set.seed(7)   # the S-stage resamples; a seed makes the fit reproducible
fit_mm <- rlm(rent ~ size, data = apartments, method = ____)
round(coef(fit_mm), 2)
round(fit_mm$w, 2)   # rows 13-16 (the bad batch) should collapse toward 0
```
::check {"regex":"method\\s*=\\s*\\W*MM","gate":true,"difficulty":"intermediate","ok":"That is it. Passing the method MM runs the S-stage first, then the efficient M-step: the slope returns to 11.79 and the bad batch drops to weight 0.","no":"Set the method to the string MM (in quotes). That switches rlm from a plain Huber M-estimator to a full MM-estimator."}
::solution
```r
library(MASS)
set.seed(7)
fit_mm <- rlm(rent ~ size, data = apartments, method = "MM")
round(coef(fit_mm), 2)
#> (Intercept)        size
#>      216.50       11.79
round(fit_mm$w, 2)
#>  [1] 0.99 1.00 0.97 0.89 1.00 0.95 1.00 0.99 1.00 0.96 0.96 0.99 0.00 0.00 0.00
#> [16] 0.00
```

The slope is back to **11.79**, right on the honest 11.77 the bad batch had hidden. And the four commercial units (rows 13 to 16) now sit at weight **0.00**: rejected outright, while every clean row keeps a weight near 1. The same rows Huber trusted completely, MM discards completely.

=== step === concept
::eyebrow Two tools, one idea
## rlm versus lmrob

`rlm(method = "MM")` works, but the modern reference implementation of MM-estimation lives in the **robustbase** package, in `lmrob()`. It uses a fast, well-tuned S-stage by default and returns proper robust standard errors and diagnostics, which is why practitioners reach for it on real work.

```r
library(robustbase)
set.seed(7)
fit_lmrob <- lmrob(rent ~ size, data = apartments)
round(coef(fit_lmrob), 2)
#> (Intercept)        size
#>      216.50       11.79
round(weights(fit_lmrob, type = "robustness"), 2)   # rows 13-16 = 0, the bad batch
#>    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16
#> 0.99 1.00 0.97 0.89 1.00 0.95 1.00 0.99 1.00 0.96 0.96 0.99 0.00 0.00 0.00 0.00
```

Same slope, same rejection of the bad batch. Here is how to choose between them.

| | `MASS::rlm` | `robustbase::lmrob` |
|---|---|---|
| Ships with R | yes | no (`install.packages("robustbase")`) |
| Default estimator | Huber M (low breakdown) | MM (50% breakdown) |
| Handles bad leverage | only with `method = "MM"` | yes, by default |
| Robust inference and diagnostics | limited | full (`summary()`, standard errors, tests) |
| Reach for it when | a quick down-weighting of vertical outliers | leverage is possible, or you need to report the fit |

The one-line rule: if bad rows might be extreme in x, or you have to defend the model, use `lmrob()`.

=== step === concept
::eyebrow Stay honest
## When robustness runs out

MM-estimation is powerful, not magic. Three habits keep you out of trouble.

[WARNING]
No estimator survives past a 50% breakdown point. If **more than half** your rows are contaminated, a high-breakdown fit will happily lock onto the bad majority and call the honest rows outliers. Robustness buys you tolerance up to half, not immunity.

- **A weight of 0 is a flag, not a verdict.** MM told you those four rows do not fit; it did not tell you why. That is your cue to investigate, where you would find the broken import and could fix it at the source. Sometimes the "outlier" is the most important real signal, do not delete it on the model's say-so.
- **Report robust standard errors.** A robust slope deserves robust uncertainty. `summary(lmrob(...))` gives standard errors and tests that are not distorted by the rows you just down-weighted, so your confidence intervals stay honest.
- **Mind the small efficiency cost.** On genuinely clean data, an MM fit is a touch noisier than OLS (that is the roughly 5% you trade for the 95% efficiency). It is cheap insurance, but it is not free: when you are certain the data are clean, plain `lm()` is still the most precise choice.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Yohai (1987), High Breakdown-Point and High Efficiency Robust Estimates for Regression, Annals of Statistics](https://doi.org/10.1214/aos/1176350366) - the paper that defined MM-estimation, combining both goals in one estimator.
- [Rousseeuw and Yohai (1984), Robust Regression by Means of S-Estimators](https://doi.org/10.1007/978-1-4615-7821-5_15) - the high-breakdown S-estimator that MM starts from.
- [robustbase reference manual (CRAN)](https://cran.r-project.org/web/packages/robustbase/robustbase.pdf) - the documentation for `lmrob()`, the MM-estimator you fit here.
- [MASS on CRAN (Venables and Ripley)](https://cran.r-project.org/package=MASS) - provides `rlm()`; the manual documents `method = "MM"` and every `psi` option.

=== step === complete
## Lesson 2 complete

You saw a bad high-leverage cluster mask itself and walk past a Huber M-estimator, learned to measure protection with the breakdown point, and used MM-estimation, a robust S-start polished by an efficient M-step, to recover the honest slope with `rlm(method = "MM")` and `lmrob()` while the bad batch fell to weight 0.

Next, Lesson 3: Quantile Regression. So far every method has modeled the **mean** rent. But when the spread of rents grows with floor area, the average stops telling the whole story. You will learn to model the median and the tails directly, and see when that is exactly what a decision needs.
