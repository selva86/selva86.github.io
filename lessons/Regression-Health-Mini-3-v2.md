---
title: "Robust regression, when outliers bite"
slug: "Regression-Health-Mini-3-v2"
description: "One outlier can quietly bias a regression fit. Learn robust regression with rlm() in R, compare it to ordinary least squares, and see where it still fails."
keywords: "robust regression, rlm in R, MASS rlm, Huber weights, bisquare weights, IRLS, M-estimation, outliers in regression, high leverage points, Cook's distance"
mathjax: true
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "3"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: "Regression-Health-Mini-2"
course_next: ""
curriculum_id: "0.0.26"
lesson_access: "windowed"
catalog_blurb: "How one outlier can bias a regression fit, and the method that resists it."
---

=== step === cover
## Robust regression, when outliers bite

Every regression line is a kind of average, and like any average, it can be thrown off by just one number that does not belong.

Picture a 30-week ad campaign. Each week has a spend, in units of \$10, so a value of 1 means \$10 spent and a value of 30 means \$300 spent. Each week also has a revenue, in units of \$100. Across the 30 weeks, revenue climbs in a steady line as spend goes up, week after week, with only ordinary noise around that line, except for one week.

Week 10 spent an ordinary \$100, but its revenue is recorded at 80, or \$8,000, a spike nowhere near what any other week produced. Look at the 30 weeks plotted below.

::widget chart-plotter {"data":[{"x":1,"y":4.02},{"x":2,"y":3.92},{"x":3,"y":6.64},{"x":4,"y":7.92},{"x":5,"y":8.83},{"x":6,"y":8.48},{"x":7,"y":11.76},{"x":8,"y":12.98},{"x":9,"y":15.61},{"x":10,"y":80},{"x":11,"y":18.09},{"x":12,"y":19.27},{"x":13,"y":21.28},{"x":14,"y":22.77},{"x":15,"y":21.95},{"x":16,"y":27.35},{"x":17,"y":28.12},{"x":18,"y":29.22},{"x":19,"y":29.7},{"x":20,"y":32.69},{"x":21,"y":33.17},{"x":22,"y":34.84},{"x":23,"y":35.11},{"x":24,"y":39.47},{"x":25,"y":39.55},{"x":26,"y":42.91},{"x":27,"y":44.23},{"x":28,"y":44.06},{"x":29,"y":46.15},{"x":30,"y":48.73}],"geoms":["point"],"x":"spend","y":"revenue"}

Week 10 sits far above every other point on the chart, the one week that breaks an otherwise straight climb.

=== step === concept
## Why one point can swing an entire regression line

The usual way to fit a line through data like this is ordinary least squares, or OLS, which R does with `lm()`. OLS picks the intercept and slope that make the sum of squared residuals as small as possible, where a residual is just the gap between a week's actual revenue and what the line predicts for it.

Build the 30 weeks and fit that line.

```r
# Build the 30-week campaign, then fit an ordinary least squares line
set.seed(2026)
spend <- 1:30
revenue <- 2 + 1.5 * spend + rnorm(30, sd = 1)
revenue[10] <- 80

ols_fit <- lm(revenue ~ spend)
round(coef(ols_fit), 2)
#> (Intercept)       spend 
#>        5.51        1.41 
```

The data was built from revenue = 2 + 1.5 times spend, so the true intercept is 2 and the true slope is 1.5. OLS lands at 5.51 and 1.41 instead, both pulled away from the truth by a single week.

See just how much that one week is worth to OLS.

```r
# Compare week 10's squared residual to the average squared residual elsewhere
round(residuals(ols_fit)[10], 1)
#>   10 
#> 60.4 
round(residuals(ols_fit)[10]^2, 0)
#>   10 
#> 3652 
round(mean(residuals(ols_fit)[-10]^2), 2)
#> [1] 7.1
round(residuals(ols_fit)[10]^2 / mean(residuals(ols_fit)[-10]^2), 0)
#>  10 
#> 514 
```

Week 10's residual is 60.4, and squaring it turns that into about 3652. The other 29 weeks average a squared residual of only about 7.1. So on its own, week 10 contributes roughly 514 times what an ordinary week contributes to the total loss OLS is trying to shrink. Squaring a large number makes it enormous, and OLS cannot tell the difference between "enormous because this measurement is genuinely informative" and "enormous because something went wrong that week." It just chases whatever shrinks the total, and one outsized residual is usually cheaper to fix by bending the whole line than by leaving it alone.

=== step === concept
## Bounding the loss: Huber's rho function

If squaring is what lets one week dominate, the fix is a loss that does not square everything. M-estimation replaces OLS's sum of squared residuals with the sum of a different function, written rho, applied to each residual.

Huber's version of rho is the standard choice, and it treats small and large residuals differently.

\[
\rho_H(r) = \begin{cases} \dfrac{1}{2} r^2, & |r| \le k \\[4pt] k\left(|r| - \dfrac{k}{2}\right), & |r| > k \end{cases}
\]

Here, r is the standardized residual, the residual divided by a robust estimate of how spread out all the residuals are, so it can be compared on the same scale across weeks. k is the cutoff between an "ordinary" residual and an "outsized" one, and its default value is 1.345, chosen because on clean, normally distributed data it still keeps 95% of OLS's precision. And rho of r is what that one week adds to the total loss.

Below the cutoff, rho is exactly the same quadratic OLS already uses, so an ordinary week gets treated exactly the way OLS treats it. Past the cutoff, the penalty switches from squaring to growing in a straight line, so a week as extreme as week 10 adds far less to the total than squaring would have. That single change, from squaring to capping, is the whole idea behind robust regression.

=== step === concept
## How rlm() actually finds the fit: iteratively reweighted least squares

Bounding the loss is the idea. Actually finding the line that minimizes it takes an algorithm, because unlike OLS, there is no longer a simple formula that returns the answer directly. `MASS::rlm()` finds it with iteratively reweighted least squares, or IRLS, which repeats a short loop until the coefficients settle.

::widget process-flow {"steps":[{"title":"Fit ordinary least squares","sub":"start from the plain line through all 30 weeks"},{"title":"Compute each residual","sub":"how far off the current line each week sits"},{"title":"Assign Huber weights","sub":"weight 1 inside k = 1.345, smaller past it"},{"title":"Refit with those weights","sub":"repeat until the coefficients stop moving"}]}

Each pass turns residuals into weights and turns weights into a new, weighted line, and that new line produces new residuals for the next pass. The loop stops once the coefficients barely move between passes.

Fit it on the campaign data and put its coefficients next to the plain OLS line.

```r
# Fit a robust regression with Huber weights and compare it to OLS
library(MASS)
rlm_fit <- rlm(revenue ~ spend)
round(cbind(OLS = coef(ols_fit), RLM = coef(rlm_fit)), 4)
#>                OLS    RLM
#> (Intercept) 5.5136 1.2129
#> spend       1.4051 1.5552
```

The clearest fix shows up in the intercept. OLS overshoots the true value of 2 by more than three and a half, landing at 5.51, while `rlm()` lands at 1.21, under one off. The slope moves too, from OLS's 1.41 up to 1.56, a bit closer to the true 1.5, though that gap was smaller to start with. One bad week no longer dominates the line.

=== step === concept
## Reading which weeks rlm() downweighted

Robust regression does not just change the fit. It also tells you which weeks it counted less. `rlm_fit$w` holds one weight per week, a number between 0 and 1 saying how much that week counted toward the final line.

Build a small table of each week's residual, weight, and Cook's distance under the plain OLS fit, then sort it by weight so the most suppressed weeks rise to the top.

```r
# Build a diagnostic table and sort it by weight, smallest first
diag_df <- data.frame(
  week = seq_along(revenue),
  residual = round(residuals(rlm_fit), 2),
  weight = round(rlm_fit$w, 3),
  cooks = round(cooks.distance(ols_fit), 3)
)
head(diag_df[order(diag_df$weight), ], 4)
#>  week residual weight cooks
#>    10    63.24  0.020 0.683
#>    15    -2.59  0.493 0.003
#>     6    -2.06  0.619 0.009
#>    23    -1.87  0.681 0.002
```

Week 10 sits at the top with a weight of 0.020, meaning it counts for about 2% of what an ordinary week counts for. Notice its residual here, 63.24, is even bigger than the 60.4 measured under plain OLS. That is not a mistake. Once the fit stops bending toward week 10, week 10 looks even further from this less biased line, which is exactly why its weight collapses so far.

Weeks 15, 6 and 23 also come in below 1, at 0.493, 0.619 and 0.681. Nothing marks these as bad weeks. They are just the three weeks whose ordinary random noise happened to land a bit further from the line than the rest, so Huber's weighting trims their influence slightly too, without ever treating them the way it treats week 10.

Cook's distance checks the same idea from a different angle: how much would the whole fit shift if you deleted a single week. A common rule of thumb flags anything above 4 divided by the sample size, which here is 4/30, about 0.133. Week 10's Cook's distance is 0.683, more than five times that threshold, while the next highest week, week 2, sits at only 0.010. Weight and Cook's distance are two different measurements, and both land on the exact same week.

[KEY INSIGHT]
A weight near 0 does not mean a week was deleted. It means that once IRLS has converged, that week's own revenue barely moves the line at all, while every other week still counts close to its full value.

=== step === concept
## Huber vs bisquare: two ways to cap the loss

Huber is not the only way to bound the loss. Tukey's bisquare weighting, also built into `rlm()`, is more aggressive with residuals that go far enough.

Huber's weighting never reaches exactly zero, so even a very large residual still counts for something, however small. Bisquare is redescending: past roughly 4.685 robust standard deviations, its weight drops to exactly zero, and that week stops contributing to the fit at all. The cost is that Huber's loss is convex, so IRLS always lands on the same answer no matter where it starts, while bisquare's is not, so its answer can depend on the starting fit.

Refit the campaign data with bisquare weights and put the two robust fits side by side.

```r
# Refit with Tukey's bisquare weights and compare to Huber
rlm_bi <- rlm(revenue ~ spend, psi = psi.bisquare)
round(cbind(Huber = coef(rlm_fit), Bisquare = coef(rlm_bi)), 4)
#>              Huber Bisquare
#> (Intercept) 1.2129   1.0905
#> spend       1.5552   1.5587
```

The two barely disagree on the slope, 1.5552 against 1.5587, and stay close on the intercept too, 1.21 against 1.09. The real difference is not in the coefficients. It is in what each one does with week 10.

```r
# Compare week 10's weight under Huber and under bisquare
c(huber = round(rlm_fit$w[10], 3), bisquare = round(rlm_bi$w[10], 3))
#>    huber bisquare 
#>     0.02     0.00 
```

Huber still gives week 10 a small weight, 0.02. Bisquare cuts it to exactly zero: past its cutoff, that week's residual contributes nothing at all to the fit. For a week this far off, zero is arguably the more accurate number.

See the shapes that produce this difference by plotting the two weighting rules against a growing residual.

```r
# Plot how Huber and bisquare weight a residual as it grows
r_range <- seq(0, 6, length.out = 200)
plot(r_range, psi.huber(r_range), type = "l", col = "steelblue", lwd = 2,
     ylim = c(0, 1.05), xlab = "Standardized residual", ylab = "Weight",
     main = "How Huber and bisquare cap a growing residual")
lines(r_range, psi.bisquare(r_range), col = "firebrick", lwd = 2, lty = 2)
legend("topright", c("Huber", "Bisquare"), col = c("steelblue", "firebrick"),
       lty = c(1, 2), lwd = 2, bty = "n")
```

The blue Huber curve decreases smoothly but never touches zero, even far out. The red bisquare curve reaches zero at its cutoff and stays flat there. That is the entire difference in one picture: Huber always keeps a little of every week, bisquare is willing to drop one completely.

[TIP]
Start with Huber. Its convex loss means the fit never depends on where IRLS started, which makes it a safe default. Reach for bisquare only when you suspect a row is not just noisy but wrong, since `rlm()` typically starts a bisquare fit from a Huber solution to avoid getting stuck.

=== step === widget
## Watching a week's weight collapse as the estimator changes

You have now watched the numbers move step by step. OLS gives week 10 full weight, since squared-error loss never downweights any point. Huber cuts that weight to 0.02. Bisquare cuts it clean to zero. And each time more weight comes off week 10, the fitted slope edges up, from OLS's 1.41 toward Huber's 1.56 and bisquare's 1.56.

The widget below repeats the same demonstration on a small worked example of its own: 14 ordinary points sitting close to a straight line, plus one point that should read about 12 but sits at 2 instead.

::widget robust-weights {}

Switch between OLS, Huber and Tukey underneath the plot, and watch the fitted line and the outlier's own size, points shrink as their weight drops, move together. Whichever tab is open, the text under the plot reports that estimator's exact slope and the outlier's exact weight, so you can read off the same trade you just measured on the campaign: give the bad point less weight, and the line moves back toward the truth. The runnable code beneath it fits the same comparison with `MASS::rlm()`, if you want to check the numbers for yourself.

=== step === quiz
## Quick check: what a weight actually means

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Week 10 was deleted from the dataset before rlm() found the final line. ::no
- Week 10's revenue was rewritten to match what the line predicted, then the fit was rerun on the corrected value. ::no
- Week 10 still sits in the data with its real revenue of 80, but a weight near 0 means the refit treats it as if it barely counts. ::ok Right. rlm() never touches the data itself. It only turns down how much a row counts once it fits the line, so a weight of 0.02 means week 10 counts for almost nothing in the final fit, even though its revenue of 80 is still sitting right there in the data.
- A weight near 0 means rlm() could not decide what to do with week 10, so it needs another round of fitting before it can be trusted. ::no A weight is not a sign of confusion, and it is not a stopping condition either. It is how much a row counts toward the line once IRLS has already converged: close to 1 means nearly full weight, close to 0 means almost none, and the data underneath never changes.

=== step === widget
## The limit: a high-leverage week breaks both estimators

Every fix so far has worked on a week that was unusual in its revenue. But there is a different kind of bad week: one that is unusual in its spend instead.

Picture one more week added to the campaign, where spend suddenly jumps to \$2,000, more than six times the campaign's usual top spend of \$300, but revenue for that week comes in at just \$5,000, barely more than an ordinary week produces. Add it to the data and refit both models.

```r
# Add one high-spend, ordinary-revenue week and refit both models
spend_lev <- c(spend, 200)
revenue_lev <- c(revenue, 50)
ols_lev <- lm(revenue_lev ~ spend_lev)
rlm_lev <- rlm(revenue_lev ~ spend_lev)
round(cbind(OLS = coef(ols_lev), RLM = coef(rlm_lev)), 3)
#>                OLS    RLM
#> (Intercept) 23.629 22.375
#> spend_lev    0.205  0.215
```

Both estimators collapse to a slope near 0.21, nowhere near the true 1.5. Robust regression, which just fixed week 10 so well, does almost nothing for this one.

Check the new week's own weight in the robust fit to see why.

```r
# Check the new week's weight in the robust fit
round(tail(rlm_lev$w, 1), 3)
#> [1] 1
```

A weight of 1: full weight, nothing flagged as unusual. Once the line bends far enough to shrink this week's own residual, that residual no longer looks unusual, so Huber's rule has nothing left to flag. `rlm()` only ever measures how far a residual sits from the fit currently in hand, and this week has already dragged that fit to wherever it needs to be to look ordinary.

Cook's distance, which measures something different, an unusual position rather than an unusual outcome, still catches it.

```r
# Cook's distance still flags the new week as influential
round(unname(tail(cooks.distance(ols_lev), 1)), 1)
#> [1] 104
```

The threshold here is 4 divided by 31 weeks, about 0.129. A Cook's distance of 104 is more than 800 times that. So a weight near 1 says the robust fit found nothing wrong with this week's revenue given where the line ended up, while Cook's distance says the opposite: removing this single week would move the fit enormously. The two measurements are answering different questions, and here they disagree completely.

[WARNING]
A weight near 1 does not mean a week is harmless. It can mean the fit has already bent enough to make that week look ordinary. Check leverage or Cook's distance alongside the weights whenever a row's predictor values, not just its outcome, might sit far from the rest.

The widget below isolates exactly this mechanism on a small worked example: seven ordinary points on a line, plus one point sitting far out on the x-axis that you can drag up and down.

::widget leverage-point {}

Wherever you drag that far-out point, the fitted line pivots toward it, because its position alone, far from every other point on the x-axis, gives it outsized pull no matter what its y-value says. That is the boundary of what Huber and bisquare weighting can do. They handle a week that says something unusual, but not a week that stands somewhere unusual. For that, the fix is a different estimator, one built from a starting fit that is not already pulled toward the troublesome point before any weighting begins.

=== step === quiz
## Quick check: choosing the right fix

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Refit with psi = psi.bisquare instead of the default Huber weights, since bisquare is the stronger of the two. ::no
- Fit an M-estimator that starts from a high breakdown initial fit rather than an ordinary least squares one, such as robustbase's lmrob(), or rlm() run with MM-estimation. ::ok Right. Huber and bisquare both measure how far a residual sits from the current fit, and a high-leverage week can pull that fit toward itself first, so its own residual ends up looking small. An estimator that starts from a fit resistant to that pull in the first place does not share this limitation.
- Add the high-spend week's spend value as a second predictor so the model can account for it separately. ::no
- Lower Huber's cutoff k so that a smaller residual already counts as outsized. ::no Changing k only changes how forgiving Huber is about residual size. It does nothing about a week being unusual in its spend rather than its revenue, which is exactly the problem a high-leverage week creates, and no amount of adjusting the cutoff on residual size fixes a problem that lives in the predictor instead.

=== step === tryit
## Your turn: fit and read the weights on a new spike

Try the same move yourself on a fresh spike. Suppose the campaign runs one more week, week 31, spending an ordinary \$310, but its revenue is recorded at 95, or \$9,500, another spike like week 10's.

```r
# spend and revenue hold the original 30 weeks.
# Add week 31: spend of 31 and revenue forced to 95.
spend_ext <- c(spend, 31)
revenue_ext <- c(revenue, 95)

# Fit rlm() with Tukey's bisquare weights on the extended data,
# then print the new week's weight (the last value of $w).
# Two lines. Press Check when you have them.
```
::check {"regex": "rlm[(][\\s\\S]*psi\\.bisquare", "gate": true, "difficulty": "intermediate", "ok": "Right: the new week's weight comes back at 0. A revenue spike this size clears bisquare's cutoff of about 4.685 robust standard deviations easily, so it gets dropped from the fit entirely.", "no": "Fit rlm(revenue_ext ~ spend_ext, psi = psi.bisquare), store it, then read the last value of its $w with tail(., 1)."}
::solution
```r
# Fit with bisquare weights and read the new week's weight
rlm_ext <- rlm(revenue_ext ~ spend_ext, psi = psi.bisquare)
tail(rlm_ext$w, 1)
#> [1] 0
```

Zero, exactly as bisquare's cutoff predicts. A spike this size gets no weight in the line at all.

=== step === concept
## References

- Huber, P.J. (1964). Robust Estimation of a Location Parameter. Annals of Mathematical Statistics, 35(1), 73-101. [JSTOR](https://www.jstor.org/stable/2238020)
- Venables, W.N. & Ripley, B.D. (2002). Modern Applied Statistics with S, 4th edition. Springer. [Book site](https://www.stats.ox.ac.uk/pub/MASS4/)
- MASS package reference manual, the rlm() help page (psi.huber, psi.bisquare). [Documentation](https://stat.ethz.ch/R-manual/R-patched/library/MASS/html/rlm.html)
- Fox, J. & Weisberg, S. (2019). An R Companion to Applied Regression, 3rd edition. SAGE. [Companion site](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
- Rousseeuw, P.J. & Leroy, A.M. (1987). Robust Regression and Outlier Detection. Wiley.

=== step === complete
## What robust regression buys you, and what it doesn't

Look at what actually happened in the campaign's own numbers. OLS missed the true slope of 1.5 by about 0.09, landing at 1.41, pulled there by one revenue spike out of 30 weeks. Robust regression cut that miss by more than a third, to about 0.06, and did far better still on the intercept, missing by under one instead of by more than three and a half.

But the same tool, faced with a week that was unusual in its spend rather than its revenue, gave a slope of about 0.21, no better than plain OLS's 0.21 on that data. And it gave that troublesome week a weight of 1, treating it exactly like every ordinary week, precisely because the fit had already bent to make the week's own residual look ordinary.

So the point is not that robust regression always fixes a bad fit. It is that a week can go wrong in two different ways, in its outcome or in its position, and Huber or bisquare weighting alone only catches one of them. Knowing which one you are looking at is the real skill.
