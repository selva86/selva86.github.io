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

A rental agency has 12 tidy listings where monthly rent rises neatly with floor area. Then a clerk types one flat's rent as **300** euros instead of **1300**, and the whole trend line lurches. Ordinary least squares trusts every row equally, so a single typo can quietly steer the entire model.

Robust regression fixes this by learning which rows to believe. Toggle the buttons below: watch the least-squares line (OLS) get dragged down by the red outlier, then switch to a robust fit and see it snap back to the honest trend while the bad point shrinks to the size of its real influence.

By the end of this lesson you will be able to:

- Explain why squaring residuals lets a single outlier dominate an OLS fit
- Tell a high-leverage point apart from an influential one, and measure influence with Cook's distance
- Fit a robust regression in R with `rlm()`, read the per-row weights, and know how Huber and Tukey differ

**Prerequisites:** you can fit and read a simple linear regression with `lm()`, and you know a residual is the gap between the actual value and the prediction. If `lm()` is rusty, see [linear regression](Linear-Regression.html).

::widget robust-weights {}

=== step === concept
::eyebrow The problem
## One typo, and the line collapses

Let us rebuild the agency's data so you can see the damage yourself. Twelve clean listings follow a real trend, rent climbing about 11.8 euros for every extra square metre. Then we add the mistyped flat: a 78 square metre unit whose 1300 euro rent was entered as 300. Each lesson runs in a fresh R session, so we build the data right here.

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

One row knocks the slope from **11.77** down to **7.78**, roughly a third. Why is a single point so powerful? Look at what OLS is minimizing. For each apartment \(i\), the residual \(r_i = y_i - \hat{y}_i\) is the gap between the actual rent \(y_i\) and the line's prediction \(\hat{y}_i\). OLS chooses the slope and intercept that make the **sum of squared residuals** \(\sum_i r_i^2\) as small as possible:

\[ \hat{\beta}^{\text{OLS}} = \arg\min_{\beta} \sum_{i=1}^{n} r_i^2. \]

The squaring is the culprit. The typo sits about 900 euros below the honest line, so it alone contributes roughly \(900^2 = 810{,}000\) to that sum, dwarfing every well-behaved row. To shave down one enormous squared term, the line bends toward the bad point and betrays the twelve good ones. Every row gets full, equal trust, so the loudest mistake wins.

=== step === widget
::eyebrow A crucial distinction
## Leverage is not the same as influence

It is tempting to say "just find the point with the biggest residual and drop it." But two different things decide how much a row can move a fit, and confusing them is the classic beginner mistake.

- **Leverage** is about position on the x axis. A point whose floor area is far from all the others sits at the end of a long see-saw, so it *can* swing the line hard. Leverage is only potential.
- **Influence** is what actually happens to the fit when you remove the row. **Cook's distance** puts a number on it, combining how far a row sits from the others (leverage) with how badly it fits (residual).

Here is the influence of our typo, measured directly:

```r
ck <- cooks.distance(lm(rent ~ size, data = apartments))
round(ck[13], 2)          # the mistyped flat: a common flag is anything above 1
#>   13
#> 1.08
round(max(ck[1:12]), 3)   # the most influential HONEST row, for comparison
#> [1] 0.094
```

The typo scores **1.08**, past the usual alarm line of 1, while the worst honest row sits at **0.094**, ten times smaller. Now feel the distinction for yourself. Drag the far-right point up and down. When it lines up with the trend, its leverage is high but its influence is almost nothing (the solid and dashed lines overlap). Pull it away and the solid "with the point" line pivots toward it while the dashed "without it" line stays put. Influence needs **both** an unusual position and a poor fit.

::widget leverage-point {}

=== step === quiz
::eyebrow Check yourself
## Which point should worry you?

A clean flat sits far to the right at 120 square metres but lands exactly on the trend line. The mistyped flat sits in the middle of the x range but 900 euros below the line. Which one actually distorts the regression?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The 120 square metre flat, because it has the most extreme x value ::no That point has high leverage, but it lands on the trend, so its residual is tiny and its influence is near zero. Leverage is only potential.
- The mistyped flat, because it combines a large residual with enough leverage to pull the line ::ok Right. Influence needs both a poor fit and some leverage. The typo has a huge residual and moves the fit the most, with a Cook's distance of 1.08.
- Neither, since a single row can never change a regression much ::no One row changed the slope from 11.77 to 7.78 here, a drop of a third. A single influential point absolutely can dominate an OLS fit.

=== step === concept
::eyebrow The fix
## Down-weight, do not delete

Deleting suspicious rows by hand does not scale to 500 listings a week, and it throws away good data whenever you guess wrong. Robust regression automates the judgment: instead of trusting every row equally, it gives each row a **weight** and lets rows that do not fit lose their vote.

An **M-estimator** replaces the squared loss with a gentler loss function \(\rho\) (the Greek letter rho), minimizing

\[ \sum_{i=1}^{n} \rho\!\left(\frac{r_i}{s}\right), \]

where \(r_i\) is the residual for row \(i\) and \(s\) is a robust estimate of how spread out the residuals are, so that a "big" residual is judged on a standardized scale rather than in raw euros. Choosing \(\rho\) to grow more slowly than a square in the tails turns out to be exactly the same as solving a **weighted** least squares, where each row carries a weight

\[ w_i = \frac{\psi(u_i)}{u_i}, \qquad u_i = \frac{r_i}{s}, \qquad \psi = \rho'. \]

Here \(u_i\) is the standardized residual (the residual divided by its spread) and \(\psi\) (psi) is just the derivative of the loss \(\rho\), so it measures how hard a row still pulls. Rows that fit well get a weight \(w_i \approx 1\) and keep their full vote; rows with large standardized residuals \(u_i\) get weights shrinking toward 0 and are quietly overruled.

[KEY INSIGHT]
Robust regression never removes a row. It reweights: a point is not "in or out," it earns a weight between 0 and 1 based on how well it fits. Toggle Huber and Tukey below and watch the red outlier's weight, printed under the plot, fall toward zero as the line straightens.

::widget robust-weights {}

=== step === concept
::eyebrow The two workhorses
## How Huber and Tukey set a weight

The whole method comes down to one choice: how fast should a row's weight fall as it fits worse? Two loss functions dominate practice, and the cleanest way to understand them is to watch the weight each one hands out.

The **Huber** loss is the default. It stays quadratic (just like OLS) for well-behaved rows, \(|u| \le k\), and only linear in the tails, \(|u| > k\):

\[ \rho_k(u) = \begin{cases} \tfrac{1}{2}u^2 & |u| \le k \\ k\,|u| - \tfrac{1}{2}k^2 & |u| > k \end{cases} \qquad\Rightarrow\qquad w = \min\!\left(1, \frac{k}{|u|}\right). \]

The tuning constant \(k = 1.345\) is the standard choice: it keeps about 95% of OLS's efficiency (its precision) when the data really are clean. **Tukey's bisquare** goes further and *redescends*: past a cutoff \(c = 4.685\) the weight drops to exactly 0, rejecting a gross outlier outright.

Rather than take the formulas on faith, let us run them on three residuals: a row that fits well (\(u = 0.5\)), a mild outlier (\(u = 2\)), and a gross one (\(u = 6\)).

```r
# a residual's WEIGHT depends only on its standardized size u = r / s
huber_w <- function(u, k = 1.345) pmin(1, k / abs(u))
tukey_w <- function(u, c = 4.685) ifelse(abs(u) <= c, (1 - (u / c)^2)^2, 0)

u <- c(0.5, 2, 6)          # a good row, a mild outlier, a gross outlier
round(data.frame(u, huber = huber_w(u), tukey = tukey_w(u)), 2)
#>     u huber tukey
#> 1 0.5  1.00  0.98
#> 2 2.0  0.67  0.67
#> 3 6.0  0.22  0.00
```

Read the last row. Both losses treat the good row (weight near 1) and the mild outlier (about two-thirds weight) almost identically. They part ways on the gross outlier: Huber still lets it keep **0.22** of a vote, because \(\min(1, 1.345/6) = 0.22\), whereas Tukey has already zeroed it out. Capping versus fully rejecting is the entire practical difference between the two.

=== step === widget
::eyebrow Under the hood
## How rlm finds the line: IRLS

There is a chicken-and-egg problem hiding in that weight formula. The weights depend on the residuals, but the residuals depend on the line, which depends on the weights. Robust fitting breaks the loop by iterating: guess a line, measure the residuals, reweight, refit, and repeat until the line stops moving. This is **iteratively reweighted least squares (IRLS)**, and it is exactly what `rlm()` runs for you.

::widget process-flow {"steps":[{"title":"Start with equal weights","sub":"fit an ordinary least-squares line as the first guess"},{"title":"Measure the residuals","sub":"see how far each row sits from the current line"},{"title":"Re-weight each row","sub":"a big residual gets a small weight; a good fit stays near 1"},{"title":"Refit and repeat","sub":"weighted least squares, re-weight, until the line settles"}]}

=== step === tryit
::eyebrow In R
## Fit a robust line in two lines

The `rlm()` function lives in the `MASS` package, which ships with R. It works just like `lm()`, plus a `psi` argument that picks the weight function: use `psi.huber` for the Huber loss (or `psi.bisquare` for Tukey). Fill in the blank so the fit uses Huber weights.

```r
library(MASS)
fit_rob <- rlm(rent ~ size, data = apartments, psi = ____)
round(coef(fit_rob), 2)
round(fit_rob$w, 2)   # the weight rlm gave each row
```
::check {"regex":"psi\\.(huber|bisquare|hampel)","gate":true,"difficulty":"intermediate","ok":"That is a valid weight function. Huber recovers a slope near the honest 11.8 and gives the typo a weight of just 0.06, so it barely pulls the line.","no":"Pass one of the MASS psi functions, for example psi = psi.huber (or psi.bisquare for Tukey)."}
::solution
```r
library(MASS)
fit_rob <- rlm(rent ~ size, data = apartments, psi = psi.huber)
round(coef(fit_rob), 2)
#> (Intercept)        size
#>      222.35       11.58
round(fit_rob$w, 2)   # row 13 (the typo) is down-weighted to 0.06
#>  [1] 1.00 1.00 1.00 0.62 1.00 1.00 1.00 1.00 1.00 1.00 0.93 1.00 0.06
```

The Huber fit recovers a slope of **11.58**, almost exactly the honest 11.77 from the clean data, because it handed the typo (row 13) a weight of just **0.06**. The bad row is still in the data, it has simply lost almost all of its vote.

=== step === quiz
::eyebrow Check yourself
## Huber gave 0.06, Tukey gives 0

Refit the same data with Tukey's bisquare (`psi = psi.bisquare`) and the typo's weight comes out at exactly **0**, versus Huber's **0.06**. What does that difference tell you?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Huber caps a large residual's pull but never fully discards it; Tukey redescends to zero, rejecting gross outliers outright ::ok Exactly. Huber's weight is min(1, k/|u|), which only shrinks toward 0. Tukey's bisquare hits 0 past its cutoff, so extreme points are dropped completely.
- Huber deletes the offending row from the data, while Tukey keeps it ::no Neither method deletes a row. Both reweight. Huber shrinks the weight toward zero; Tukey takes it all the way to zero, but the row is still there.
- The two functions are identical and the weights differed by chance ::no They are different loss functions by design. Huber stays linear in the tails; Tukey redescends to zero. The weights differ for a reason, not by chance.

=== step === concept
::eyebrow The honest limits
## When M-estimators are not enough

M-estimators solve the **vertical** outlier problem cleanly: a bad y value gets a small weight and loses its pull. But they are not bulletproof, and knowing the edge is what separates a practitioner from a button-pusher.

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

- [Huber (1964), Robust Estimation of a Location Parameter](https://doi.org/10.1214/aoms/1177703732) - the paper that introduced M-estimation and the Huber loss.
- [UCLA OARC: Robust Regression in R](https://stats.oarc.ucla.edu/r/dae/robust-regression/) - a hands-on walk-through of `rlm()` with Huber and bisquare weights on real data.
- [MASS on CRAN (Venables and Ripley)](https://cran.r-project.org/package=MASS) - the package providing `rlm()`; the reference manual documents every `psi` option.
- [Fox and Weisberg, Robust Regression appendix (free PDF)](https://socialsciences.mcmaster.ca/jfox/Books/Companion/appendices/Appendix-Robust-Regression.pdf) - leverage, influence, and M-estimation worked through in R.

=== step === complete
## Lesson 1 complete

You saw a single typo drag an OLS line off the truth, learned to separate leverage from influence, and used an M-estimator to down-weight the bad row instead of deleting it, recovering the honest slope with `rlm()`. You also saw, on real numbers, how Huber caps an outlier's pull while Tukey's bisquare redescends all the way to zero.

Next, Lesson 2: Robust Regression, MM-estimation and the breakdown point. You will meet the high-leverage case that defeats Huber, learn what a 50% breakdown point buys you, and compare `rlm` against `lmrob` for regression you can trust even when a large chunk of the data is bad.
