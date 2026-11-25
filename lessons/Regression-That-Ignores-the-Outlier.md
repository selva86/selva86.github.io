---
title: "Additive and Nonparametric Models Lesson 6: Regression that ignores the outlier"
catalog_blurb: "How Huber and bisquare loss stop one bad point from tilting a regression line."
description: "One bad data point can pull a regression's slope far from the truth. See why squared-error loss does that, then fix it with Huber and bisquare loss in R."
keywords: "robust regression, Huber loss, bisquare loss, Tukey biweight, iteratively reweighted least squares, IRLS, MASS::rlm, outliers, leverage, Cook's distance, R"
post_type: "LESSON"
curriculum_id: "4.100.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-additive"
course_title: "Additive and Nonparametric Models"
course_lesson: "6"
course_total: "6"
course_landing: "Additive-and-Nonparametric-Models-Course.html"
course_next: ""
course_prev: "Modeling-the-Median-and-the-Tails"
---

=== step === cover
## Regression that ignores the outlier

Today let's see why one bad data point can pull an ordinary regression line's slope away from the true relationship, and how to stop it, using one coffee chain's own weekly numbers.

This chain has fifteen coffee shops. Each one reported its customer visits for one week, in hundreds, and that week's revenue, in thousands of dollars. Visits ranged from 1.0 hundred to 8.0 hundred across the fifteen shops.

Here is all fifteen shops, plotted as visits against revenue.

::widget chart-plotter {"data":[{"x":1,"y":2.82},{"x":1.54,"y":3.98},{"x":2.08,"y":5.06},{"x":2.62,"y":4.97},{"x":3.15,"y":6.53},{"x":3.69,"y":7.19},{"x":4.23,"y":7.97},{"x":4.77,"y":9.35},{"x":5.31,"y":8.7},{"x":5.85,"y":10.95},{"x":6.38,"y":10.49},{"x":6.92,"y":11.01},{"x":7.46,"y":12.02},{"x":8,"y":13.35},{"x":7.2,"y":2}],"geoms":["point"],"x":"visits_hundreds","y":"revenue_thousands","code":{"point":"ggplot(df, aes(visits_hundreds, revenue_thousands)) +\n  geom_point()"}}

Fourteen of these points sit close to one rising line. But look at the point sitting apart from it: its visit count is unremarkable, right in the middle of the range, yet its revenue sits far below where that line says it should be.

=== step === concept
## Least squares and the pull of one point

Let's generate these same fifteen numbers in R, then fit a regression line through all of them, and again through just the fourteen shops that behaved normally.

```r
# Generate the fifteen coffee shops once, then fit OLS with and without shop 9's bad week
set.seed(3)
visits <- seq(1, 8, length.out = 14)
revenue <- 2 + 1.4 * visits + rnorm(14, 0, 0.6)
visits <- c(visits, 7.2)              # shop 9's visit count: 7.2 hundred
revenue <- c(revenue, 2.0)            # shop 9's revenue: only 2 thousand dollars

fit_all <- lm(revenue ~ visits)
fit_clean <- lm(revenue[-15] ~ visits[-15])

c(all_15_slope = round(unname(coef(fit_all)[2]), 2),
  clean_14_slope = round(unname(coef(fit_clean)[2]), 2),
  true_slope = 1.4)
#>   all_15_slope clean_14_slope     true_slope 
#>           1.06           1.41           1.40 
```

`lm()` fits what is called ordinary least squares, or OLS: of all the straight lines you could draw, it picks the one that makes the sum of each point's squared vertical distance from the line, its residual, as small as possible.

With all fifteen shops, including shop 9, that slope comes out at 1.06, well under the true slope of 1.4 used to generate the data. Drop just that one shop, and the slope on the remaining fourteen comes back to 1.41, almost exactly the true slope.

One shop out of fifteen pulled the slope down by about a quarter of its true value. The next question is why squared error lets one point do that much damage.

=== step === concept
## The cost of a residual under squared error

Let's see exactly how much shop 9's point costs the fit, compared to a typical shop's.

```r
# Compare shop 9's residual to a typical shop's, before and after squaring
resid_all <- residuals(fit_all)
typical_resid <- mean(abs(resid_all[-15]))

c(shop9_resid = round(unname(resid_all[15]), 2),
  typical_resid = round(typical_resid, 2),
  resid_ratio = round(abs(unname(resid_all[15])) / typical_resid, 1))
#>   shop9_resid typical_resid   resid_ratio 
#>         -8.44          0.90          9.40 

c(shop9_sq = round(unname(resid_all[15])^2, 1),
  typical_sq = round(typical_resid^2, 2),
  sq_ratio = round(unname(resid_all[15])^2 / typical_resid^2, 1))
#>   shop9_sq typical_sq   sq_ratio 
#>       71.3        0.8       88.9 
```

`residuals(fit_all)` gives each shop's actual revenue minus what the line predicts for it. Shop 9's residual is -8.44: its real revenue sat 8.44 thousand dollars below the line's prediction, about 9.4 times the size of a typical shop's residual of 0.90.

Here is why that matters so much. `lm()` does not minimize the sum of residuals, it minimizes the sum of their squares. Square a residual 9.4 times the usual size and its cost in that sum is about 9.4 squared, roughly 89 times a typical shop's cost, not 9.4 times. The second block above shows exactly that: 71.3 against 0.80, a ratio of 88.9.

Squared error has no ceiling on that growth. A residual twice the usual size costs four times as much. One ten times the usual size costs about a hundred times as much.

Shop 9's residual is by far the single biggest term in that squared-error sum, so the least-squares fit moves toward reducing it, at the cost of fitting every other shop a little worse.

=== step === concept
## Two loss functions that stop growing

Let's write that squared-error cost as a function of the residual size, a loss function, and look at two others built so that growth does not run away.

Squared error costs a residual \(r\) exactly its square, with no limit on how large that can get.

\[
\rho_{\text{sq}}(r) = r^2
\]

Huber's loss behaves exactly like squared error up to a cutoff, \(k = 1.345\), then switches to growing only in a straight line.

\[
\rho_{\text{Huber}}(r) = \begin{cases} r^2 & |r| \le k \\ 2k|r| - k^2 & |r| > k \end{cases}
\]

Tukey's bisquare loss also behaves like squared error near zero, but past its own cutoff, \(c = 4.685\), it stops growing altogether and settles at a constant.

\[
\rho_{\text{bisquare}}(r) = \begin{cases} \dfrac{c^2}{6}\left[1 - \left(1 - \left(\dfrac{r}{c}\right)^2\right)^3\right] & |r| \le c \\[4pt] \dfrac{c^2}{6} & |r| > c \end{cases}
\]

A plot of all three against a range of residual sizes makes the difference easy to see.

```r
# Plot squared-error, Huber and bisquare loss across a range of residual sizes
resid_grid <- seq(-6, 6, length.out = 200)
k_huber <- 1.345
c_tukey <- 4.685
sq_loss <- resid_grid^2
huber_loss <- ifelse(abs(resid_grid) <= k_huber, resid_grid^2, 2 * k_huber * abs(resid_grid) - k_huber^2)
bisquare_loss <- ifelse(abs(resid_grid) <= c_tukey,
                         (c_tukey^2 / 6) * (1 - (1 - (resid_grid / c_tukey)^2)^3),
                         c_tukey^2 / 6)

plot(resid_grid, sq_loss, type = "l", lwd = 2, col = "black",
     xlab = "residual (r)", ylab = "loss", ylim = c(0, 40),
     main = "Three ways to cost a residual")
lines(resid_grid, huber_loss, lwd = 2, col = "steelblue")
lines(resid_grid, bisquare_loss, lwd = 2, col = "firebrick")
legend("top", legend = c("squared error", "Huber (k = 1.345)", "bisquare (c = 4.685)"),
       col = c("black", "steelblue", "firebrick"), lwd = 2, bty = "n")

# Cost shop 9's own residual (about 8.44) under each of the three loss functions
shop9_r <- abs(unname(resid_all[15]))
round(c(sq = shop9_r^2,
        huber = ifelse(shop9_r <= k_huber, shop9_r^2, 2 * k_huber * shop9_r - k_huber^2),
        bisquare = ifelse(shop9_r <= c_tukey, (c_tukey^2 / 6) * (1 - (1 - (shop9_r / c_tukey)^2)^3), c_tukey^2 / 6)), 1)
#>       sq    huber bisquare 
#>     71.3     20.9      3.7 
```

Shop 9's own residual, about 8.44, lands past both cutoffs. Squared error costs it about 71, Huber's loss costs it about 21 because it only grows in a straight line past \(k\), and bisquare's loss costs it only about 3.7, the flat plateau value \(c^2/6\), as if a residual of 8.44 cost the same as one of 5 or 50.

That plateau is the whole idea. Past a certain size, bisquare loss stays flat no matter how much worse a residual gets, while Huber's loss at least keeps growing more slowly.

=== step === widget
## Watching a robust fit snap back to the true slope

This widget carries the exact same fourteen honest shops and the same shop 9 you have been using, drawn from the same formula with the same seed. Toggle between OLS, Huber and Tukey and watch shop 9's weight fall and the fitted slope move back toward the true 1.4.

::widget robust-weights {}

Switch to OLS and the slope sits at 1.06, with every shop, including shop 9, carrying a weight of 1. Switch to Huber and the slope moves to about 1.37, while shop 9's weight falls to about 0.08. Switch to Tukey's bisquare and the slope lands at about 1.40, almost exactly the true value, with shop 9's weight falling all the way to 0.

So the two robust methods do not just fit a better-looking line. Based on the size of shop 9's residual, each one cuts its weight down from the full 1 that OLS gives it, Huber partway, bisquare all the way to zero.

=== step === quiz
## Quick check: how the three losses treat a big residual

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Squared error keeps climbing without any limit, Huber's loss flattens to linear growth past its cutoff, and bisquare's loss flattens to a constant past its own cutoff, which is why bisquare alone can give a residual a weight of exactly zero. ::ok Exactly. Squared error never stops punishing a bigger residual, Huber slows that punishment to a straight line, and bisquare caps it outright, which is the only one of the three that can zero out a residual's influence completely.
- Huber's loss gives any residual past its cutoff \(k\) a weight of exactly zero, the same as bisquare. ::no Huber's loss keeps growing past \(k\), just in a straight line instead of a curve. A straight-line loss still gives a residual some weight, just a shrinking one.
- Bisquare's loss can only ever shrink a residual's weight partway, never all the way to zero. ::no Past its cutoff \(c\), bisquare's loss is a flat constant, so a residual out there adds nothing further to the fit. That flat plateau is exactly what lets bisquare assign a weight of zero.
- Ordinary least squares already down-weights an unusually large residual somewhat, before Huber or bisquare are even applied. ::no None of that is quite right: squared error gives every residual full weight no matter its size, Huber's loss slows the growth to a straight line past its cutoff but never reaches zero weight, and only bisquare's loss flattens all the way to a constant, which is what lets it assign a weight of exactly zero. Ordinary least squares has no built-in down-weighting at all.

=== step === concept
## Iteratively reweighted least squares, worked by hand

Let's see exactly how a robust fit arrives at those weights, by doing it ourselves one round at a time.

IRLS stands for iteratively reweighted least squares. It starts every shop at a weight of 1, fits an ordinary least squares line with those weights, looks at the residuals that fit leaves behind, turns each residual into a new weight, and refits. Repeat that a few times and the weights settle down.

To turn a residual into a weight, IRLS first needs a sense of scale: how big is a typical residual on this round's fit? A common choice is the median absolute residual, multiplied by 1.4826, a constant that makes this measure line up with the usual standard deviation when the data behave well. Call this the robust scale. Divide each residual by the robust scale, and if the result sits within the Huber cutoff \(k = 1.345\), that shop keeps a weight of 1; past the cutoff, its weight drops to \(k\) divided by the size of that standardized residual.

Let's run four rounds of this on the fifteen coffee shops, and watch shop 9's weight fall while shop 7, an ordinary shop, keeps its weight near 1.

```r
# Four rounds of fit, weigh, refit: watch shop 9's weight fall while a typical shop's stays near 1
w <- rep(1, 15)
k_huber <- 1.345
shop9_weights <- numeric(4)
typical_weights <- numeric(4)

for (iter in 1:4) {
  X <- cbind(1, visits)
  fit_beta <- solve(t(X) %*% diag(w) %*% X, t(X) %*% diag(w) %*% revenue)
  resid <- revenue - as.vector(X %*% fit_beta)
  robust_scale <- median(abs(resid)) * 1.4826
  u <- resid / robust_scale
  w <- ifelse(abs(u) <= k_huber, 1, k_huber / abs(u))
  shop9_weights[iter] <- w[15]
  typical_weights[iter] <- w[7]
}

rbind(shop9 = round(shop9_weights, 3), typical_shop7 = round(typical_weights, 3))
#>                [,1]  [,2]  [,3]  [,4]
#> shop9         0.205 0.066 0.076 0.081
#> typical_shop7 1.000 1.000 1.000 1.000

round(setNames(as.vector(fit_beta), c("intercept", "slope")), 3)
#> intercept     slope 
#>     1.906     1.373 
```

Shop 9's weight falls hard after the very first round, from 1 down to about 0.21, dips to 0.07, then settles near 0.08. Shop 7 keeps its full weight of 1 throughout every round, since its residual never came close to the cutoff. After four rounds the fit's slope sits at 1.373, close to the true 1.4, with an intercept of 1.906.

That slope, 1.373, is exactly what `MASS::rlm()` finds too when it uses Huber's weight function. That is no coincidence: `rlm()` runs this same loop, just with more care about when to stop.

=== step === concept
## Robust and ordinary fits, with and without the bad week

Let's compare `lm()` and `MASS::rlm()` side by side, both on the data with shop 9 and on the fourteen clean shops alone, to see the entire trade a robust fit makes.

```r
# Compare lm() and rlm() on the data with shop 9, and again on the fourteen clean shops
library(MASS)
rlm_all <- rlm(revenue ~ visits, psi = psi.bisquare)
rlm_clean <- rlm(revenue[-15] ~ visits[-15], psi = psi.bisquare)

comparison <- rbind(
  lm_with_shop9  = coef(fit_all),
  rlm_with_shop9 = coef(rlm_all),
  lm_clean_14    = coef(fit_clean),
  rlm_clean_14   = coef(rlm_clean)
)
colnames(comparison) <- c("intercept", "slope")
round(comparison, 3)
#>                intercept slope
#> lm_with_shop9      2.778 1.065
#> rlm_with_shop9     1.831 1.404
#> lm_clean_14        1.826 1.410
#> rlm_clean_14       1.832 1.404
```

Read the four rows as two separate comparisons. With shop 9 in the data, `lm()` lands at a slope of 1.065, while `rlm()` with Tukey's bisquare weight lands at 1.404, almost exactly the true 1.4: the robust fit simply does not let shop 9 drag it down.

Now look at the fourteen clean shops alone, where there is no bad point to protect against. `lm()` gives 1.410 and `rlm()` gives 1.404: the two agree to two decimal places.

That is the whole trade a robust fit makes. When a genuine outlier is in the data, it saves you from a slope that is off by about a quarter. When there is no outlier, it costs you a difference of about 0.006 in the slope, which is nothing. That asymmetry, a large gain against almost no cost, is why a robust loss is worth using even when you are not sure an outlier is lurking.

=== step === widget
## Leverage: a danger robust weighting does not fix

This next widget uses its own small dataset: seven points following a clean rising trend, plus one more point you can drag, sitting far out on the x-axis. Think of that draggable point as standing in for a shop with an unusually high weekly visit count, rather than shop 9's problem of a wrong revenue reading.

Drag its value up and down and watch the fitted line swing.

::widget leverage-point {}

A point like this has high leverage: it sits far from the other points on the x-axis, here the visit count, so any straight line fit to the data has to pass close to it just to keep the squared error small near that point. Wherever you drag it, including a value that looks perfectly consistent with some other line, the fit swings toward it, because its leverage comes from where it sits on x, not from how wrong its y value is.

Shop 9 had an ordinary visit count, 7.2 hundred, right in the typical range. Its problem was a revenue value that disagreed with the trend, which is exactly what Huber's and Tukey's weighting corrects. This widget's point has the opposite shape of problem: an extreme x value, which weighting by residual size does nothing about, because a y value consistent with the line it pulled toward can still carry a small residual and a weight near 1.

The widget's own code, below the chart, fits the line with and without that point and prints Cook's distance for each row, a standard number that measures how much removing one point would change the fitted coefficients. A large Cook's distance flags exactly this kind of danger.

=== step === concept
## What a robust fit protects you from, and what it does not

Let's put the two questions side by side, since every point in a regression deserves both of them.

The first question is about the outcome: does this point's y value disagree with what the rest of the data says the trend should be? Shop 9 failed that question. Its revenue, 2 thousand dollars, sat 8.44 thousand dollars below what its ordinary visit count predicted, and Huber's and Tukey's weighting both answer that question directly, by shrinking the influence of a residual once it gets unusually large.

The second question is about the predictor: does this point sit unusually far out on x, compared to the rest of the data? The widget's draggable point failed that question, sitting at x = 13 while the rest of its points sat between 1 and 7. Down-weighting by residual size does not answer this question, because a point with high leverage can still end up with a small residual, simply by pulling the fitted line toward itself.

So a point can fail one question, the other, both, or neither, and the two failures call for different responses. A residual problem calls for a robust loss. A leverage problem calls for looking at the point directly, checking where its x value came from, before deciding what to do with it. Neither failure is a reason to delete a point without first checking why it looks the way it does.

=== step === quiz
## Quick check: a point that's far out, not just off the line

Shop 20 reports 14.5 hundred visits in one week, nearly double the highest visit count among the other fifteen shops, and a revenue of 22.3 thousand dollars, a value that sits almost exactly where the true relationship, revenue = 2 + 1.4 times visits, says it should. Which of these is true of shop 20?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Shop 20's revenue disagrees with the trend, so Huber's or Tukey's weighting would shrink its influence, the same as shop 9. ::no Shop 20's revenue agrees with the true relationship almost exactly, so its residual is small. A small residual gets full weight under Huber's or Tukey's loss, same as any ordinary point.
- Shop 20's visit count is far outside the range the other shops sit in, which gives it high leverage. Because its residual is small, Huber's and Tukey's weighting both leave its weight near 1, so neither one would catch the danger it poses. ::ok Correct. This is exactly the leverage problem from the widget: an extreme x value, paired with a y value that happens to look consistent, slips past any weighting scheme built on residual size alone.
- Shop 20 is a residual problem and a leverage problem at once, so it needs both a robust loss and a leverage check. ::no Shop 20's revenue already agrees with the trend, so robust weighting has nothing to shrink here. Its danger is leverage alone, which weighting does not address.
- Shop 20 needs no special handling, since Huber's and Tukey's weighting both give it a weight near 1. ::no A weight near 1 only means weighting did not flag it, not that it is safe. Shop 20's visit count is still extreme enough to let it swing the fitted line hard if its revenue were ever slightly off, which is exactly the leverage danger the widget showed.

=== step === tryit
## Your turn: refit with Huber's weight function

The code below fits a robust regression with Tukey's bisquare weight function and prints shop 9's weight and the fitted slope. Change `psi.bisquare` to `psi.huber`, then compare what you get.

```r
# Fit a robust regression with Tukey's bisquare weight, then read off shop 9's weight
library(MASS)
rlm_fit <- rlm(revenue ~ visits, psi = psi.bisquare)
round(rlm_fit$w[15], 3)                       # shop 9's weight under this psi function
#> [1] 0
round(coef(rlm_fit)[["visits"]], 3)           # the fitted slope under this psi function
#> [1] 1.404
```
::check {"regex": "psi[.]huber", "gate": true, "difficulty": "beginner", "ok": "Right: under psi.huber, shop 9's weight is about 0.083, not 0, and the slope moves to about 1.373. Huber still lets shop 9 pull a little, where bisquare rejected it outright.", "no": "Change psi.bisquare to psi.huber in the rlm() call above, then press Check."}
::solution
```r
# Refit with Huber's weight function instead, and compare shop 9's weight and the slope
library(MASS)
rlm_fit <- rlm(revenue ~ visits, psi = psi.huber)
round(rlm_fit$w[15], 3)                       # shop 9's weight under Huber
#> [1] 0.083
round(coef(rlm_fit)[["visits"]], 3)           # the fitted slope under Huber
#> [1] 1.373
```

=== step === concept
## References

- [Robust Estimation of a Location Parameter](https://doi.org/10.1214/aoms/1177703732) - Huber (1964), Annals of Mathematical Statistics 35(1), 73-101. The paper behind Huber's loss and its weight function.
- [The Fitting of Power Series, Meaning Polynomials, Illustrated on Band-Spectroscopic Data](https://doi.org/10.2307/1267936) - Beaton and Tukey (1974), Technometrics 16(2), 147-185. Introduces the biweight, or bisquare, weight function.
- [The MASS package](https://cran.r-project.org/package=MASS) - Venables and Ripley, Modern Applied Statistics with S, 4th ed. (Springer, 2002). The source of `rlm()` and its `psi` functions.
- [An R Companion to Applied Regression, 3rd ed.](https://www.john-fox.ca/Companion/) - Fox and Weisberg (Sage, 2019). Chapter on robust regression.
- [Robust Regression and Outlier Detection](https://en.wikipedia.org/wiki/Robust_Regression_and_Outlier_Detection) - Rousseeuw and Leroy (Wiley, 1987).

=== step === complete
## Robust loss, and the leverage problem it does not solve

Ordinary least squares minimizes the sum of squared residuals, and that one choice is exactly what let shop 9 drag the fitted slope down to 1.06 from a true value of 1.4. A residual ten times the usual size costs about a hundred times as much under squared error, with no limit on how large that cost can grow.

Huber's loss and Tukey's bisquare loss both cap that growth, one flattening to a straight line past a cutoff, the other flattening to a constant. Run either one through iteratively reweighted least squares, and a genuine outlier like shop 9 gets its influence shrunk automatically, at almost no cost on data that has no outlier at all.

But a robust loss only answers one question: does this point's outcome disagree with the trend? A point with an extreme predictor value can still slip through with a small residual and a weight near 1, which is the leverage problem the second widget showed. So treat a bad residual and a bad leverage point as two separate dangers, each needing its own check, and never delete a point just because it caught your eye.
