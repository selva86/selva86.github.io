---
title: "Additive and Nonparametric Models Lesson 2: Generalized additive models, one smooth at a time"
catalog_blurb: "See how a GAM lets one predictor curve while the rest stays linear."
description: "Fit a GAM with mgcv on real attendance data, read each smooth term's effective degrees of freedom, and see what the automatic penalty buys over a fixed spline."
keywords: "GAM, generalized additive model, mgcv, smooth term, spline basis, effective degrees of freedom, partial effect, penalized regression, R"
post_type: "LESSON"
curriculum_id: "4.100.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-additive"
course_title: "Additive and Nonparametric Models"
course_lesson: "2"
course_total: "6"
course_landing: "Additive-and-Nonparametric-Models-Course.html"
course_next: "Choosing-How-Wiggly-Is-Too-Wiggly"
course_prev: "Smoothing-Without-Smoothing-Away-the-Signal"
---

=== step === cover
## Generalized additive models, one smooth at a time

Today let's understand how a generalized additive model lets one predictor bend into a curve, while every other predictor in the same model stays exactly the straight line it always was.

The running example for this lesson is FitZone, a gym chain that tracked its daily walk-in attendance for 250 days. Alongside attendance, FitZone also recorded that day's outdoor temperature, from 5 to 35 degrees Celsius, and that day's trial-pass discount, from 0 to 25 percent. The question this lesson answers is simple to ask: does attendance rise and fall with temperature in a straight line, or does it do something a straight line cannot describe?

Here are all 250 days, temperature on the x-axis and attendance on the y-axis.

::widget chart-plotter {"data":[{"x":13.3,"y":115.1},{"x":5,"y":69.5},{"x":20.3,"y":147.4},{"x":5.4,"y":78.5},{"x":6.9,"y":92.4},{"x":33.6,"y":84.5},{"x":7.6,"y":108.3},{"x":13.7,"y":76.8},{"x":31.4,"y":78.5},{"x":8.7,"y":96.4},{"x":10.3,"y":89.2},{"x":18.2,"y":101.7},{"x":32.2,"y":74.7},{"x":30.5,"y":69.2},{"x":27,"y":107.3},{"x":22.2,"y":110.6},{"x":19.5,"y":88.1},{"x":14.9,"y":92},{"x":9.7,"y":75.5},{"x":19.4,"y":121.1},{"x":11.1,"y":83.6},{"x":25.4,"y":113.7},{"x":15.9,"y":126},{"x":15.5,"y":125.9},{"x":6.9,"y":52.7},{"x":19.5,"y":139},{"x":17,"y":97.9},{"x":5.5,"y":67.1},{"x":8.8,"y":98.2},{"x":16.9,"y":108.3},{"x":20.1,"y":97.6},{"x":14.8,"y":109.7},{"x":17.4,"y":121.4},{"x":11.1,"y":99.4},{"x":29.4,"y":83.6},{"x":24.3,"y":135.3},{"x":13.3,"y":78.3},{"x":8.1,"y":109.1},{"x":12.7,"y":98.4},{"x":6.7,"y":71.2},{"x":12.4,"y":90.4},{"x":11.5,"y":84.1},{"x":19.8,"y":128.6},{"x":24.6,"y":107.7},{"x":14.9,"y":127},{"x":30.9,"y":117.9},{"x":24.1,"y":116.5},{"x":5.4,"y":67},{"x":20.9,"y":121.2},{"x":30,"y":87.4},{"x":20.1,"y":86.9},{"x":22.9,"y":110.1},{"x":17.8,"y":119},{"x":14.4,"y":122},{"x":11.7,"y":118.5},{"x":18.3,"y":118},{"x":17.4,"y":126.8},{"x":29.5,"y":88.2},{"x":9.9,"y":85.5},{"x":22.9,"y":125.4},{"x":9,"y":84.9},{"x":27.6,"y":89.4},{"x":10.2,"y":102.3},{"x":22.4,"y":115.5},{"x":27.5,"y":140.6},{"x":10.5,"y":76.3},{"x":6.7,"y":70},{"x":20,"y":107.3},{"x":10.8,"y":82.3},{"x":23.6,"y":139.5},{"x":25.6,"y":120.3},{"x":17.8,"y":93.9},{"x":17.8,"y":96.4},{"x":11.1,"y":110.9},{"x":33.2,"y":101.4},{"x":21.1,"y":96},{"x":13.1,"y":98.4},{"x":15,"y":117.1},{"x":15.9,"y":91.6},{"x":11.6,"y":78.2},{"x":6.5,"y":71.3},{"x":19.9,"y":99.5},{"x":20.2,"y":80.7},{"x":12.1,"y":111.9},{"x":29.4,"y":99.5},{"x":17.6,"y":134.9},{"x":10.7,"y":73.6},{"x":24.5,"y":88.6},{"x":29.4,"y":122.6},{"x":11.8,"y":87.7},{"x":16,"y":103.5},{"x":27.9,"y":124},{"x":5.4,"y":89.8},{"x":19.3,"y":120.7},{"x":29.3,"y":126.8},{"x":12.2,"y":99},{"x":28,"y":101.3},{"x":10.8,"y":84.3},{"x":22.6,"y":105.3},{"x":11.7,"y":76.4},{"x":28.6,"y":124.1},{"x":25.3,"y":133.5},{"x":17.3,"y":106.2},{"x":17.3,"y":127.9},{"x":11.2,"y":104.1},{"x":12.9,"y":84},{"x":25.7,"y":136.9},{"x":27.2,"y":124.8},{"x":21.9,"y":135.8},{"x":9.3,"y":83.8},{"x":26.2,"y":105.5},{"x":7.7,"y":80.1},{"x":18.1,"y":127.9},{"x":29.7,"y":91.6},{"x":25.1,"y":116.9},{"x":14.1,"y":83.2},{"x":32.9,"y":78.9},{"x":18.5,"y":129.8},{"x":20.7,"y":139.5},{"x":12.4,"y":76.8},{"x":10.9,"y":90.6},{"x":13.7,"y":103.1},{"x":34.7,"y":71},{"x":10.1,"y":74},{"x":18.6,"y":126.2},{"x":7.2,"y":83.6},{"x":5.8,"y":80.5},{"x":30.7,"y":65},{"x":26.1,"y":118},{"x":23.9,"y":116.2},{"x":33.6,"y":80},{"x":25.5,"y":116.1},{"x":11.4,"y":94.3},{"x":20.7,"y":137},{"x":9.2,"y":101.5},{"x":19.5,"y":143.1},{"x":13.1,"y":112.5},{"x":26.3,"y":118.5},{"x":28.2,"y":114.5},{"x":34.8,"y":82.8},{"x":25.2,"y":154.2},{"x":21.8,"y":142.1},{"x":18.5,"y":134.8},{"x":25.6,"y":144.6},{"x":11.7,"y":79},{"x":20.9,"y":113.4},{"x":22.7,"y":127.1},{"x":14.9,"y":105.9},{"x":31.1,"y":111.3},{"x":14.1,"y":87},{"x":21.9,"y":145.6},{"x":27.9,"y":109},{"x":12.4,"y":125.9},{"x":28,"y":80},{"x":25.2,"y":109.5},{"x":24.3,"y":117.1},{"x":9.3,"y":105.8},{"x":10.5,"y":68.1},{"x":24.7,"y":116.6},{"x":22,"y":124.9},{"x":19.2,"y":108.2},{"x":13.9,"y":86.6},{"x":23.7,"y":129.1},{"x":12.7,"y":93.4},{"x":13.2,"y":89.4},{"x":29.3,"y":85},{"x":10.5,"y":68.8},{"x":6.4,"y":87.2},{"x":34.6,"y":71.2},{"x":10.6,"y":81.2},{"x":13.2,"y":95.9},{"x":29.8,"y":121.2},{"x":7.9,"y":96.9},{"x":28.2,"y":107.7},{"x":25.8,"y":108.4},{"x":24.1,"y":125.2},{"x":10.9,"y":78.8},{"x":29.1,"y":96.8},{"x":7,"y":100.4},{"x":15.8,"y":130},{"x":31.6,"y":85.1},{"x":8.2,"y":111.9},{"x":9.6,"y":82.8},{"x":17,"y":90},{"x":29.8,"y":122.6},{"x":13.6,"y":94.4},{"x":13.8,"y":71.1},{"x":13.5,"y":83.9},{"x":25.9,"y":109.6},{"x":31.3,"y":86},{"x":15.9,"y":104.2},{"x":11.1,"y":101.9},{"x":32.2,"y":105.4},{"x":34.8,"y":90.5},{"x":8.8,"y":103},{"x":26.8,"y":123.5},{"x":32.6,"y":86.3},{"x":22.3,"y":138.7},{"x":13.2,"y":75.6},{"x":27.8,"y":92.9},{"x":14.9,"y":91.6},{"x":14,"y":101.1},{"x":22.9,"y":112.4},{"x":11.1,"y":90.7},{"x":26.7,"y":134.9},{"x":32.4,"y":109.7},{"x":18.6,"y":96.7},{"x":10.3,"y":87},{"x":5.6,"y":55.9},{"x":25.6,"y":120.3},{"x":26.6,"y":137.1},{"x":32.9,"y":92.5},{"x":25.6,"y":116.4},{"x":22.7,"y":118.8},{"x":9.7,"y":62},{"x":34.8,"y":67.1},{"x":31.9,"y":85.6},{"x":20.3,"y":93.4},{"x":31.1,"y":73.7},{"x":30.3,"y":88.5},{"x":29,"y":98.6},{"x":32.6,"y":92.5},{"x":33.4,"y":91.1},{"x":26.7,"y":132.1},{"x":25.2,"y":138.5},{"x":28,"y":108.9},{"x":5.3,"y":72.1},{"x":18.3,"y":128.1},{"x":19.1,"y":135},{"x":12.6,"y":88},{"x":14,"y":117},{"x":10.6,"y":83},{"x":15.1,"y":104.9},{"x":21.9,"y":133.1},{"x":23.6,"y":158.1},{"x":21.9,"y":131.7},{"x":19.6,"y":153},{"x":29.6,"y":81.8},{"x":21.3,"y":140.7},{"x":9.1,"y":87.8},{"x":34.8,"y":71.3},{"x":20.6,"y":120.3},{"x":12.8,"y":95.2},{"x":33.9,"y":85.3},{"x":31.6,"y":87.4},{"x":23.3,"y":117.5},{"x":27.8,"y":100.4},{"x":30.6,"y":118.3},{"x":17.6,"y":122.1},{"x":7.6,"y":122.4}],"geoms":["point"],"x":"temp_c","y":"attendance"}

The chart also reports a Pearson's r of 0.24, barely any straight-line relationship at all. That does not mean temperature has no effect on attendance. It means whatever effect temperature has, a straight line through this scatter is not built to see it.

=== step === widget
## Where a straight line misses the bend

Before fitting anything on FitZone's own numbers, it helps to know what trouble looks like on a residual plot, since that is exactly what is about to turn up in temperature. A residual is the gap between what a model predicted and what actually happened: the real value minus the fitted value. Plotting every residual against its own fitted value is one of the simplest ways to check a straight-line model's work. If the line is doing its job, the residuals scatter evenly around zero with no pattern in them.

The widget below switches between three fits. Flip it from Healthy fit to Curve (missed nonlinearity) and watch the residuals stop scattering evenly and bend into a clear U instead.

::widget residual-plot {"start": "healthy"}

That U shape is the signature of a straight line trying to describe a bend. The line can only tilt one way across the whole range, so it ends up too high in some stretches and too low in others, and that leftover pattern shows up in the residuals instead of disappearing into noise.

FitZone's own numbers carry the same signature, just with real-world noise sitting on top of it. Fit a straight line through both predictors and look at its own residual plot below.

```r
# Fit a straight line through both predictors and look at its residuals
set.seed(11)
n <- 250
temp <- runif(n, 5, 35)
discount <- runif(n, 0, 25)
attendance <- 55 + 45 * exp(-(temp - 22)^2 / (2 * 7^2)) + 1.8 * discount + rnorm(n, 0, 9)
gym <- data.frame(temp, discount, attendance)

fit <- lm(attendance ~ temp + discount, data = gym)
round(coef(fit), 2)
plot(fit, which = 1)
#> (Intercept)        temp    discount 
#>       66.62        0.64        1.94 
```

A one-degree rise in temperature is worth 0.64 more attendees by this straight line's reckoning, and every extra percentage point of discount is worth 1.94 more. Those numbers describe one fixed tilt and nothing else: the same 0.64 per degree whether temperature sits near 5 or near 35.

Look at the smoothed red line the plot draws through the residuals. It dips a little below zero around the middle of the fitted range and climbs back above zero at the high end, the same bend the widget's Curve tab showed, just fainter, because real data always carries more noise on top of the pattern than a clean demo does.

=== step === concept
## A GAM is a linear model with one column swapped for a smooth

A generalized additive model, GAM for short, is built to fix exactly this kind of miss. In an ordinary linear model, every predictor gets one column and one coefficient: temperature's column gets multiplied by one number, discount's column gets multiplied by another, and the two products add up to the prediction. A GAM keeps that arrangement for a predictor that truly is a straight line, but for a predictor whose effect bends, like temperature here, it replaces that one column with several new columns built from it, flexible enough together to bend.

Those new columns come from something called a spline basis. Run the small example below to see one predictor, ten values running from 1 to 10, turn into three separate columns.

```r
# Turn one toy predictor column into three spline-basis columns
library(splines)
toy_x <- 1:10
basis <- ns(toy_x, df = 3)
round(matrix(as.numeric(basis), nrow = 10, dimnames = list(NULL, c("basis1", "basis2", "basis3"))), 2)
#>       basis1 basis2 basis3
#>  [1,]   0.00   0.00   0.00
#>  [2,]  -0.08   0.25  -0.16
#>  [3,]  -0.10   0.44  -0.30
#>  [4,]  -0.01   0.54  -0.36
#>  [5,]   0.20   0.52  -0.34
#>  [6,]   0.43   0.43  -0.23
#>  [7,]   0.55   0.34  -0.06
#>  [8,]   0.46   0.32   0.17
#>  [9,]   0.20   0.36   0.43
#> [10,]  -0.14   0.43   0.71
```

One column of ten numbers became three columns of ten numbers. Each basis column is its own curve-shaped function of toy_x, and weighting the three of them by their own coefficients, then adding the results, is how a smooth, bending curve gets built out of ordinary addition.

For this gym data, swapping just temperature's column for a spline basis would write the model's formula as `attendance ~ s(temp) + discount`. The `s()` is mgcv's way of saying "replace this column with its own spline basis": discount keeps its single coefficient exactly as it was in the plain straight-line model, and temperature's single column turns into several, the same way toy_x's column just did.

=== step === widget
## What the penalty buys, and the number it reports

Turning one column into several solves one problem and creates another. Left alone, several basis columns could bend as wildly as they like, chasing every noisy wiggle in the data instead of the real pattern underneath it. So mgcv adds a wiggliness penalty: a built-in cost for bending, paid out of the fit's own accuracy, so the model only buys as much curve as is actually worth it.

The number that reports how much curve a term actually bought is called its effective degrees of freedom, edf for short. An edf close to 1 means the penalty settled on something that is, in practice, a straight line. An edf well above 1 means the penalty decided the extra bend was worth keeping, and the term carries real curvature.

The widget below fits that same idea on its own small built-in example, a wavy curve with noise added, not FitZone's own numbers. Its x-axis plays the same role as temperature here, and its y-axis plays the same role as attendance, just on a smaller, cleaner example built only to show the sweep.

::widget spline-smoother {}

Drag the smoothness slider, labelled basis size k, from 2 toward 30. Near the low end the fitted curve barely bends at all and misses the true wavy shape under it. Near the high end it bends enough to chase individual noisy points instead of the shape they came from.

Somewhere in between, the fit tracks the true curve without chasing its noise, and that middle ground is what the penalty is built to find on its own. The widget's own code behind that curve is `gam(y ~ s(x, k = 20))`, and `summary(g)$s.table` is exactly where edf shows up for a fit like that one.

=== step === concept
## Fitting the real GAM on attendance

Here is that same fit, on FitZone's real 250 days, with both temperature and discount written as smooth terms.

```r
# Fit a GAM that lets both temperature and discount bend if the data wants them to
suppressMessages(library(mgcv))
g <- gam(attendance ~ s(temp) + s(discount), data = gym)
summary(g)$s.table
#>                  edf   Ref.df         F p-value
#> s(temp)     4.847193 5.918779  94.34558       0
#> s(discount) 1.344955 1.610168 275.53321       0
```

Temperature's edf, 4.85, sits well above 1. The penalty decided temperature's bend was real and worth keeping, close to five effective degrees of curve. Discount's edf, 1.34, sits close to 1: once temperature's curve is accounted for, the penalty is telling you discount's own effect is practically a straight line, the same conclusion the plain straight line's coefficient of 1.94 per percentage point already pointed to.

Both p-values print as 0, too small for R to show at this many decimal places, not literally zero. That only says both terms matter at all. It says nothing about shape, which is exactly what edf is for.

=== step === quiz
## Quick check: reading edf

Here is temperature's and discount's row from that table again: temperature's edf is 4.85, discount's is 1.34. Based only on those two numbers, which term is the penalty telling you behaves like a straight line?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Discount, because its edf of 1.34 sits close to one, while temperature's edf of 4.85 is well above one. ::ok Right. An edf near one says the penalty found a term that already behaves like a straight line. Temperature's edf of 4.85 says the opposite: real curvature that was worth keeping.
- Discount, because it has the larger F-statistic, 275.53 versus temperature's 94.35. ::no
- Temperature, because its p-value prints as 0, the same as discount's. ::no
- Neither one, since both p-values print as 0. ::no Both terms matter: a p-value near zero only says a term is not flat at zero, not that it carries real curvature. Edf is the number that tells shape apart. Close to one means practically a line, like discount's 1.34. Well above one means real bend, like temperature's 4.85.

=== step === widget
## Each smooth on its own partial-effect axis

With two predictors in the model, "the effect of temperature on attendance" needs its own picture, separate from discount's effect. The usual way to draw one predictor's effect on its own is to sweep that predictor across its range, hold every other predictor fixed, predict attendance at each point on the sweep, and plot the result. That sweep is called a partial-dependence plot, or here, since each term in a GAM already owns its own piece of the prediction, a partial-effect plot.

The widget below shows that idea on a generic example, not FitZone's own numbers. Each faint line is one row's prediction as a feature sweeps across its range, holding that row's other feature fixed: that is called an ICE curve. The bold line is their average, the partial-dependence curve itself.

::widget pdp-curve {}

Notice how the faint lines fan apart instead of running parallel to each other. That fanning is what it looks like when the swept feature's effect depends on another feature, an interaction: the bold average line is still correct on average, but no single row's own curve looks quite like it.

The fitted GAM here has no such interaction to worry about. Its formula, `attendance ~ s(temp) + s(discount)`, is a plain sum of two smooths with nothing connecting them. So temperature's and discount's effects never depend on each other, and each term's own partial-effect plot already shows its whole contribution, with nothing left over that averaging could hide.

```r
# Read each smooth term's own partial-effect curve from the fitted GAM
library(mgcv)
pd <- plot(g, select = 1)   # temperature's partial effect
plot(g, select = 2)         # discount's partial effect

round(range(pd[[1]]$fit), 1)
round(range(pd[[2]]$fit), 1)
#> [1] -25.5  19.1
#> [1] -21.0  22.8
```

Temperature's partial effect runs from about -25.5 up to a peak of 19.1 and back down: a hump, peaking near 22 degrees. Discount's partial effect runs from about -21.0 to 22.8 in close to a straight line across its whole range, matching an edf of 1.34.

=== step === concept
## Comparing the GAM to a fixed-basis spline lm()

A GAM's penalty is not the only way to fit a bending curve. You could instead pick a spline basis by hand, decide how many degrees of freedom to give it, and fit it with an ordinary lm(). Here is temperature's curve fit that way, at 4 degrees of freedom, laid over the GAM's own temperature curve.

```r
# Overlay the GAM's temperature curve against a fixed four-degree spline lm() fit
library(mgcv)
library(splines)
fit_ns <- lm(attendance ~ ns(temp, df = 4) + discount, data = gym)

grid_temp <- seq(5, 35, length.out = 100)
mean_discount <- mean(gym$discount)
pred_ns  <- predict(fit_ns, newdata = data.frame(temp = grid_temp, discount = mean_discount))
pred_gam <- predict(g, newdata = data.frame(temp = grid_temp, discount = mean_discount), type = "terms")[, "s(temp)"]

curves <- data.frame(temp = grid_temp, ns_curve = pred_ns - mean(pred_ns), gam_curve = pred_gam)

library(ggplot2)
ggplot(curves, aes(temp)) +
  geom_line(aes(y = ns_curve), color = "#c05621", linewidth = 1) +
  geom_line(aes(y = gam_curve), color = "#2b6cb0", linewidth = 1, linetype = "dashed")

round(max(abs(curves$ns_curve - curves$gam_curve)), 1)
#> [1] 2.9
```

The two curves track each other closely: the largest gap between them, at any point along the sweep, is 2.9 attendees, small next to attendance's own scatter. At 4 degrees of freedom, the fixed-basis spline and the GAM's own penalized smooth are close to the same curve.

Here is what is different between them, though. Picking `df = 4` for the fixed-basis spline was a guess: nothing in `lm()` checked whether 4 was too few, too many, or just right. The GAM's `s(temp)` started from a basis size of 10, and the penalty itself decided that 4.85 of those 10 were worth spending, without anyone choosing that number by hand. The penalty is not buying a better-looking curve here, the two are nearly identical, it is buying one fewer number you have to guess at.

=== step === quiz
## Closing check: three fits, one dataset

Three different fits have now gone through temperature in this lesson: the plain `lm(attendance ~ temp + discount)`, the fixed-basis `lm(attendance ~ ns(temp, df = 4) + discount)`, and the GAM, `gam(attendance ~ s(temp) + s(discount))`. Which of the three chooses its own smoothness, without anyone telling it a fixed number?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The plain lm(), since a straight line is the simplest of the three to fit. ::no
- The fixed-basis spline lm(), since ns() already builds a curve out of several columns. ::no
- The GAM, since its penalty settled on each term's effective degrees of freedom on its own, without anyone telling it a fixed number. ::ok Right. The plain lm() never bends at all, and the fixed-basis spline bends only as much as the degrees of freedom someone hands it, 4 in this lesson's comparison. Only the GAM's penalty looked at the data and decided how much curve each term deserved, landing at an edf of about 4.85 for temperature and 1.34 for discount, without being told either number.
- All three, since every one of them ends up fitting some kind of curve to the temperature column. ::no Only the GAM chooses its own smoothness. The plain lm() can only ever draw a straight line through temperature, however curved the truth is. The fixed-basis spline can bend, but only as far as the degrees of freedom someone chose by hand. The GAM is the only one of the three whose penalty looked at the data and picked the amount of curve on its own.

=== step === tryit
## Your turn: raise the basis size, watch edf respond

A smooth term's basis size, k, caps how many basis columns it is built from, and the model always drops one of those to avoid double-counting the overall intercept, so a k of 3 really only leaves 2 to spend. Capped that tightly, temperature's smooth cannot climb past an edf of 2, nowhere near the roughly 4.85 the real hump needs.

Raise the basis size below to something comfortably larger, then check that edf climbs back toward its true value and the fitted curve recovers the hump.

```r
# Change the basis size below, then check how edf responds
library(mgcv)
g_fix <- gam(attendance ~ s(temp, k = ____) + s(discount), data = gym)
round(summary(g_fix)$s.table[, 1:2], 2)
```
::check {"regex": "k\\s*=\\s*(8|9|1[0-9]|20)\\b", "gate": true, "difficulty": "intermediate", "ok": "Right: raising the cap lets temperature's edf climb to about 4.85, close to what the uncapped fit found, and the fitted curve recovers the hump peaking near 22 degrees.", "no": "Replace the blank with a bigger basis size, something like 10, the same ceiling g already used: s(temp, k = 10)."}
::solution
```r
# Raise the temperature smooth's basis size and watch edf and the curve respond
library(mgcv)
g_fix <- gam(attendance ~ s(temp, k = 10) + s(discount), data = gym)
round(summary(g_fix)$s.table[, 1:2], 2)
#>              edf Ref.df
#> s(temp)     4.85   5.92
#> s(discount) 1.34   1.61
```

=== step === concept
## References

- Hastie, T.J. and Tibshirani, R.J. (1990). Generalized Additive Models. Chapman & Hall. The book that introduced the additive model this lesson fits, written by the statisticians who named it.
- [Generalized Additive Models: An Introduction with R](https://www.routledge.com/products/9781498728331) - Wood, S.N. (2017), 2nd edition, CRC Press. Written by the author of the mgcv package used throughout this lesson, including the penalty and the edf it reports.
- [Thin Plate Regression Splines](https://doi.org/10.1111/1467-9868.00374) - Wood, S.N. (2003), Journal of the Royal Statistical Society B, 65(1), 95-114. The paper behind the default spline basis mgcv builds for a term like s(temp).
- [The Elements of Statistical Learning](https://link.springer.com/book/9780387848570) - Hastie, T., Tibshirani, R. and Friedman, J. (2009), 2nd edition, Springer. Chapter 9 places generalized additive models among the other ways to let a predictor bend.

=== step === complete
## What swapping one column for a smooth buys you

FitZone's attendance against temperature was never a straight line. It was a hump, rising to a peak near 22 degrees and falling away on both sides, and a plain lm() could only tilt one way across the whole range and miss it.

A GAM fixed that by swapping temperature's single column for a spline basis, several columns instead of one, flexible enough together to bend. The penalty that comes with it decided how much of that flexibility was actually worth keeping, on its own: an edf of 4.85 for temperature's real curve, and 1.34 for discount's effect, which turned out to be close to a straight line all along.

The fixed-basis spline lm() landed on almost the same curve, but only because 4 degrees of freedom happened to be picked by hand. The GAM needed no such guess; its penalty earned that number from the data.

Choosing smoothness by a criterion instead of by eye is the next thing worth understanding.
