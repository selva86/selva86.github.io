---
title: "Advanced Regression Lesson 1: Robust Regression with M-Estimators"
catalog_blurb: "How to keep one bad data point from tilting your regression line."
description: "One mistyped row can drag an OLS line off the true trend. See why, then use M-estimators (Huber, Tukey) in R to down-weight outliers instead of deleting them."
keywords: "robust regression, M-estimator, Huber, Tukey bisquare, rlm, MASS, outliers, leverage, Cook's distance, R"
post_type: "LESSON"
curriculum_id: "6.130.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "1"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Robust-Regression-MM-and-Breakdown.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 13
## Robust Regression with M-Estimators

A rental agency has 12 tidy listings where rent rises neatly with floor area. Then a clerk types one flat's rent as **300** euros instead of **1300**, and the trend line lurches. Ordinary least squares trusts every row equally, so a single typo can quietly steer the whole model.

Robust regression fixes this by learning which rows to believe. Toggle the buttons below: watch the least-squares line (OLS) get dragged down by the red outlier, then switch to a robust fit and see it snap back to the honest trend while the bad point shrinks to the size of its influence.

By the end of this lesson you will be able to:

- Explain why squaring residuals lets one outlier dominate an OLS fit
- Tell a high-leverage point apart from an influential one, and measure influence with Cook's distance
- Fit a robust regression in R with `rlm()` and read the per-row weights it assigns

**Prerequisites:** you can fit and read a simple linear regression with `lm()`, and you know a residual is the gap between actual and predicted.

::widget robust-weights {}

=== step === concept
::eyebrow The problem
## One typo, and the line collapses

Let us rebuild the analyst's data so you can see the damage yourself. Twelve clean listings follow a real trend, rent climbing about 11.8 euros for every extra square metre. Then we add the mistyped flat: a 78 square metre unit whose 1300 euro rent was entered as 300.

```r
set.seed(1)
size <- c(30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85)   # floor area, square metres
rent <- round(250 + 11 * size + rnorm(12, 0, 45))           # monthly rent, euros
apartments <- data.frame(size, rent)

# the 13th listing: a 1300-euro flat mistyped as 300
apartments <- rbind(apartments, data.frame(size = 78, rent = 300))

round(coef(lm(rent ~ size, data = apartments)), 2)          # fit WITH the typo
#> (Intercept)        size
#>      389.46        7.78
round(coef(lm(rent ~ size, data = apartments[1:12, ])), 2)  # fit WITHOUT it
#> (Intercept)        size
#>      217.97       11.77
```

One row knocks the slope from **11.77** down to **7.78**, roughly a third. Why is a single point so powerful? Look at what OLS is minimizing. For each apartment \(i\), the residual \(r_i = y_i - \hat{y}_i\) is the gap between the actual rent \(y_i\) and the line's prediction \(\hat{y}_i\). OLS chooses the slope and intercept that make the **sum of squared residuals** \(\sum_i r_i^2\) as small as possible.

The squaring is the culprit. The typo sits about 900 euros below the honest line, so it contributes roughly \(900^2 = 810{,}000\) to that sum. To shave down one enormous squared term, the line bends toward the bad point, betraying the twelve good ones. Every row gets full, equal trust, so the loudest mistake wins.

=== step === widget
::eyebrow A crucial distinction
## Leverage is not the same as influence

It is tempting to say "just find the point with the biggest residual and drop it." But two different things decide how much a row can move a fit, and confusing them is the classic beginner mistake.

- **Leverage** is about position on the x axis. A point whose floor area is far from all the others sits at the end of a long see-saw, so it *can* swing the line hard. Leverage is only potential.
- **Influence** is what actually happens to the fit if you remove the row. **Cook's distance** puts a number on it: for the typo above, Cook's distance is **1.08** (a common flag is anything above 1), while every honest row sits well below 0.1.

Drag the far-right point up and down. When it lines up with the trend, its leverage is high but its influence is almost nothing (the solid and dashed lines overlap). Pull it away and the solid "with the point" line pivots toward it while the dashed "without it" line stays put. Influence needs **both** unusual position and a poor fit.

::widget leverage-point {}

=== step === quiz
::eyebrow Check yourself
## Which point should worry you?

A clean flat sits far to the right at 120 square metres but lands exactly on the trend line. The mistyped flat sits in the middle of the x range but 900 euros below the line. Which one actually distorts the regression?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The 120 square metre flat, because it has the most extreme x value ::no High leverage is only potential. A far-out point that sits ON the trend has a tiny residual, so removing it barely changes the fit (low Cook's distance).
- The mistyped flat, because it combines a large residual with enough leverage to pull the line ::ok Right. Influence needs both a poor fit and some leverage. The typo has a huge residual and moves the fit the most (Cook's distance 1.08).
- Neither, since a single row can never change a regression much ::no One row changed the slope from 11.77 to 7.78 here. A single influential point absolutely can dominate an OLS fit.

=== step === concept
::eyebrow The fix
## Down-weight, do not delete

Deleting suspicious rows by hand does not scale to 500 listings a week, and it throws away good data whenever you guess wrong. Robust regression automates the judgment: instead of trusting every row equally, it gives each row a **weight** and lets rows that do not fit lose their vote.

An **M-estimator** replaces the squared loss with a gentler loss \(\rho\), minimizing \(\sum_i \rho\!\left(\frac{r_i}{s}\right)\), where \(s\) is a robust estimate of the residual spread (so a "big" residual is judged on a standardized scale). Choosing \(\rho\) to grow more slowly than a square in the tails is the same as solving a **weighted** least squares with

\[ w_i = \frac{\psi(u_i)}{u_i}, \qquad u_i = \frac{r_i}{s}, \qquad \psi = \rho'. \]

Here \(\psi\) is just the derivative of the loss \(\rho\), so it measures how hard a row still pulls: rows that fit get \(w_i \approx 1\), while rows with large standardized residuals \(u_i\) get weights shrinking toward 0.

The **Huber** loss is the workhorse: \(\rho_k(u) = \tfrac{1}{2}u^2\) when \(|u| \le k\) and \(k|u| - \tfrac{1}{2}k^2\) when \(|u| > k\). It is quadratic (just like OLS) for well-behaved rows and only linear in the tails, giving the weight \(w_i = \min\!\left(1, \frac{k}{|u_i|}\right)\). The default \(k = 1.345\) keeps about 95% of OLS's efficiency (its precision) when the data really are clean. **Tukey's bisquare** goes further and *redescends*: past a cutoff the weight drops to exactly 0, rejecting gross outliers outright.

[KEY INSIGHT]
Robust regression never removes a row. It reweights: a point is not "in or out," it earns a weight between 0 and 1 based on how well it fits. Toggle Huber and Tukey below and watch the red outlier's weight, printed under the plot, fall toward zero as the line straightens.

::widget robust-weights {}

=== step === widget
::eyebrow Under the hood
## How rlm finds the line: IRLS

There is a chicken-and-egg problem. The weights depend on the residuals, but the residuals depend on the line, which depends on the weights. Robust fitting breaks the loop by iterating: guess, measure, reweight, refit, and repeat until the line stops moving. This is **iteratively reweighted least squares (IRLS)**, and it is exactly what `rlm()` runs for you.

::widget process-flow {"steps":[{"title":"Start with equal weights","sub":"fit an ordinary least-squares line as the first guess"},{"title":"Measure the residuals","sub":"see how far each row sits from the current line"},{"title":"Re-weight each row","sub":"a big residual gets a small weight; a good fit stays near 1"},{"title":"Refit and repeat","sub":"weighted least squares, re-weight, until the line settles"}]}

=== step === tryit
::eyebrow In R
## Fit a robust line in two lines

The `rlm()` function lives in the `MASS` package (it ships with R). It works just like `lm()`, plus a `psi` argument that picks the weight function. Use `psi.huber` for the Huber loss. Fill in the blank.

```r
library(MASS)
fit_rob <- rlm(rent ~ size, data = apartments, psi = ____)
round(coef(fit_rob), 2)
round(fit_rob$w, 2)   # the weight rlm gave each row
```
::check {"regex":"psi\\.(huber|bisquare|hampel)","gate":true,"difficulty":"intermediate","ok":"That is a valid weight function. Huber recovers a slope near the honest 11.8 and hands the typo a near-zero weight.","no":"Pass one of MASS's psi functions, e.g. psi = psi.huber (or psi.bisquare for Tukey)."}
::solution
```r
library(MASS)
fit_rob <- rlm(rent ~ size, data = apartments, psi = psi.huber)
round(coef(fit_rob), 2)
#> (Intercept)        size
#>      222.35       11.58
round(fit_rob$w, 2)
#>  [1] 1.00 1.00 1.00 0.62 1.00 1.00 1.00 1.00 1.00 1.00 0.93 1.00 0.06
```

The robust slope is **11.58**, right back near the honest 11.77 that the typo had hidden. And look at the last weight: the mistyped row got **0.06**, so it barely counts, while the good rows sit at 1.00. Nothing was deleted; the outlier simply lost its vote.

=== step === quiz
::eyebrow Check yourself
## Huber gave 0.06, Tukey gives 0

Fit the same data with Tukey's bisquare (`psi = psi.bisquare`) and the typo's weight is exactly **0**, versus Huber's **0.06**. What does that difference tell you?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Huber caps a large residual's pull but never fully discards it; Tukey redescends to zero, rejecting gross outliers outright ::ok Exactly. Huber's weight is min(1, k/|u|), which only shrinks toward 0. Tukey's bisquare hits 0 past a cutoff, so extreme points are dropped completely.
- Huber deletes the offending row from the data, while Tukey keeps it ::no Neither method deletes rows. Both keep every row and assign it a weight; the row with weight 0 is simply ignored during that fit.
- The two functions are the same and the weights differed by chance ::no They are different loss functions by design. Huber stays linear in the tails; Tukey redescends to zero. The weights differ for a reason, not by chance.

=== step === concept
::eyebrow The honest limits
## When M-estimators are not enough

M-estimators solve the **vertical** outlier problem cleanly, a bad y value gets a small weight and loses its pull. But they are not bulletproof.

[WARNING]
The Huber estimator's breakdown point (the fraction of rows that can go bad before the estimate becomes meaningless) is essentially 0%. Its protection comes from spotting a large residual, so a **bad high-leverage point** that drags the line toward itself keeps a small residual and slips through with near-full weight. A cluster of such points can still wreck the fit.

Three practical habits keep you safe:

- **Escalate for leverage.** When bad points are also extreme in x, reach for high-breakdown methods (MM-estimation, `lmrob`), which tolerate up to 50% contamination. That is exactly what Lesson 2 builds.
- **Investigate before you trust the fix.** A down-weighted row is a flag, not a verdict. The 0.06 weight told the analyst to check that listing, where she found the dropped digit. Sometimes the "outlier" is the most important real signal.
- **Report robust standard errors.** A robust slope deserves robust uncertainty; `summary(rlm(...))` and sandwich estimators give inference that is not distorted by the outliers you just down-weighted.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Huber (1964), Robust Estimation of a Location Parameter](https://doi.org/10.1214/aoms/1177703732) - the paper that introduced M-estimation.
- [UCLA OARC: Robust Regression in R](https://stats.oarc.ucla.edu/r/dae/robust-regression/) - a hands-on walk-through of `rlm()` with Huber and bisquare weights.
- [MASS on CRAN (Venables and Ripley)](https://cran.r-project.org/package=MASS) - the package providing `rlm()`; the reference manual documents every `psi` option.
- [The Elements of Statistical Learning (free PDF)](https://hastie.su.domains/ElemStatLearn/) - robust loss functions in the wider machine-learning setting.

=== step === complete
## Lesson 1 complete

You saw a single typo drag an OLS line off the truth, learned to separate leverage from influence, and used an M-estimator to down-weight the bad row instead of deleting it, recovering the honest slope with `rlm()`.

Next, Lesson 2: Robust Regression, MM-estimation and the breakdown point. You will meet the high-leverage case that defeats Huber, learn what a 50% breakdown point buys you, and compare `rlm` against `lmrob` for regression you can trust even when a chunk of the data is bad.
