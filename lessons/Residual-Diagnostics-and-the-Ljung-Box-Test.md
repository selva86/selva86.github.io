---
title: "Forecasting Toolbox Lesson 2: Residual diagnostics and the Ljung-Box test"
catalog_blurb: "Test whether a fitted model's residuals are really white noise."
description: "Learn the four properties healthy residuals must have, how to compute the Ljung-Box statistic by hand, and fix a model whose residuals still show structure."
keywords: "ljung-box test in r, gg_tsresiduals, residual diagnostics time series, white noise residuals, residual autocorrelation test, fable feasts r, ets model r, checking model residuals"
post_type: "LESSON"
curriculum_id: "5.30.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-toolbox"
course_title: "Forecasting Toolbox"
course_lesson: "2"
course_total: "6"
course_landing: "Forecasting-Toolbox-Course.html"
course_next: "Forecast-Distributions-and-Prediction-Intervals.html"
course_prev: "Fitted-Values-Residuals-and-Innovations.html"
---

=== step === cover
## Residual diagnostics and the Ljung-Box test

Today let's understand how to check whether a fitted model's residuals genuinely behave like noise, using a test called the Ljung-Box test.

Northfield Outdoor Supply sells hiking and camping gear, and its 60 months of revenue were fit with a random walk with drift, a simple model whose only rule is last month's revenue plus one steady step up. That model hands back a residual for every month it was trained on, the gap between what it predicted and what actually happened. Here are 59 of those residuals, one per month, plotted in the order they occurred.

::widget chart-plotter {"data":[{"x":2,"y":0.0065},{"x":3,"y":0.0494},{"x":4,"y":0.0920},{"x":5,"y":0.1575},{"x":6,"y":0.0681},{"x":7,"y":-0.0147},{"x":8,"y":-0.0513},{"x":9,"y":-0.1113},{"x":10,"y":-0.0788},{"x":11,"y":-0.1197},{"x":12,"y":0.0338},{"x":13,"y":-0.0090},{"x":14,"y":0.0038},{"x":15,"y":-0.1016},{"x":16,"y":0.2521},{"x":17,"y":0.0485},{"x":18,"y":0.1292},{"x":19,"y":-0.0812},{"x":20,"y":-0.0398},{"x":21,"y":0.0999},{"x":22,"y":-0.1265},{"x":23,"y":-0.0571},{"x":24,"y":-0.1372},{"x":25,"y":0.0022},{"x":26,"y":-0.0675},{"x":27,"y":0.1469},{"x":28,"y":0.1349},{"x":29,"y":-0.0505},{"x":30,"y":0.1562},{"x":31,"y":-0.0457},{"x":32,"y":0.0352},{"x":33,"y":-0.0677},{"x":34,"y":-0.0008},{"x":35,"y":-0.1796},{"x":36,"y":-0.0309},{"x":37,"y":-0.0319},{"x":38,"y":-0.0127},{"x":39,"y":0.0706},{"x":40,"y":0.1438},{"x":41,"y":0.0206},{"x":42,"y":0.1014},{"x":43,"y":0.0450},{"x":44,"y":0.0525},{"x":45,"y":-0.2180},{"x":46,"y":-0.0207},{"x":47,"y":-0.0853},{"x":48,"y":-0.0592},{"x":49,"y":-0.0315},{"x":50,"y":0.0929},{"x":51,"y":-0.0508},{"x":52,"y":0.0825},{"x":53,"y":0.0908},{"x":54,"y":0.0383},{"x":55,"y":0.0366},{"x":56,"y":-0.0597},{"x":57,"y":0.0563},{"x":58,"y":-0.1444},{"x":59,"y":-0.0339},{"x":60,"y":-0.1285}],"geoms":["point","line"],"x":"month","y":"residual"}

The line crosses zero again and again, so there's no obvious drift up or down. But look closely and it is not pure static either: there are stretches where it climbs for a few months running, then stretches where it dips. That kind of leftover pattern is exactly what separates residuals that are genuinely noise from residuals that still have something left to explain.

=== step === concept
## What gg_tsresiduals() shows you at a glance

Every fitted time series model hands back a residual for each time point it was trained on, the gap between what actually happened and what the model predicted for that same point. If a model has truly captured whatever pattern lives in a series, those residuals should have nothing left to explain, just noise. If a pattern is still hiding inside them, the model missed something, and that is exactly what this lesson teaches you to catch.

augment() is the function that hands back a fitted model's residuals as three new columns next to the original data. .fitted is the model's prediction for that point. .resid is the plain miss, the real value minus .fitted, on the original scale.

.innov is the same miss, but measured on whatever scale the model actually fit, here the logged revenue scale, since fit_full was fit to log(revenue). Every check in this lesson runs on .innov.

Rebuild Northfield Outdoor Supply's 60 months of revenue, fit the same random walk with drift model, and hand the fitted model straight to gg_tsresiduals(), which draws three panels from .innov in one single call.

```r
# Rebuild Northfield's revenue, fit a random walk with drift, and draw its residual diagnostics
library(tsibble)
library(fable)
library(fabletools)
library(feasts)

set.seed(2024)
month <- yearmonth("2020 Jan") + 0:59
level <- 40000 + 480 * (0:59)
season <- 1 + 0.18 * sin(2 * pi * (((0:59) %% 12) - 3) / 12)
noise <- exp(rnorm(60, 0, 0.05))
revenue <- round(level * season * noise)

sales <- tsibble(month = month, revenue = revenue, index = month)
fit_full <- model(sales, drift = RW(log(revenue) ~ drift()))
aug_full <- augment(fit_full)

gg_tsresiduals(fit_full)
```

The top panel plots .innov against month, in the order the months occurred. The bottom-left panel is the ACF of .innov, one bar per lag. The bottom-right panel is a histogram of .innov's values. Together, those three panels are the fastest way to eyeball whether a model's residuals look like plain noise or still carry a pattern.

=== step === concept
## The four properties of a healthy residual series

A residual series only earns the label healthy when it satisfies four separate properties at once. Miss any one of them, and there is still something in the data the model did not capture.

1. **Uncorrelated.** Knowing one residual should tell you nothing about the next one. This is the property the rest of this lesson is built around, and it gets its own close look starting next step.
2. **Zero mean.** The residuals should average out to about zero. If they did not, a model that just shifted every forecast by one constant amount would do better, which means the current model is leaving an easy improvement on the table.
3. **Constant variance.** The spread of the residuals should stay roughly the same from the start of the series to the end. If it grows or shrinks over time, prediction intervals built from one overall variance end up too narrow in some periods and too wide in others.
4. **Roughly normal.** The residuals should look bell-shaped. This one matters less for the point forecast itself and more for the prediction intervals built around it: a badly non-normal residual distribution means those intervals cannot be trusted even when the point forecast is fine.

fit_full's own residuals back up three of these four right away.

```r
# Check zero mean, constant variance and normality on fit_full's residuals
innov <- aug_full$.innov[!is.na(aug_full$.innov)]

round(mean(innov), 4)
#> [1] 0

n_half <- length(innov) %/% 2
round(sd(innov[1:n_half]), 3)
#> [1] 0.102
round(sd(innov[(n_half + 1):length(innov)]), 3)
#> [1] 0.086

shapiro.test(innov)
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  innov
#> W = 0.99239, p-value = 0.9731
```

The mean rounds to 0. The first half of the series has a standard deviation of 0.102 against 0.086 for the second half, close enough that the spread is not visibly growing or shrinking. And the Shapiro-Wilk test, whose null hypothesis is that the data came from a normal distribution, returns a p-value of 0.973, nowhere near small enough to reject that null. Zero mean, constant variance and roughly normal all check out.

That leaves uncorrelated, and no amount of staring at a time plot answers that one. Here is what a variance violation and a missed-pattern violation actually look like, on a generic example that has nothing to do with Northfield.

::widget residual-plot {"start":"healthy"}

Toggle to Funnel, and the spread of points fans out as the fitted value grows: bigger predictions come with bigger misses, which is exactly what breaks constant variance. Toggle to Curve, and the residuals bend into a clear U shape instead of scattering flat: the straight-line model left a pattern on the table that one extra term would have caught. Neither shape is fit_full's own problem: its residuals already passed all three of the properties checked above. Its actual problem is the fourth one.

=== step === concept
## Checking whether residuals are uncorrelated: the ACF by hand

The one property left to check is whether the residuals are uncorrelated: does knowing one residual tell you anything about the next one, or about the one five months later?

The ACF, short for autocorrelation function, answers that lag by lag. Lag 1 correlates every residual with the residual right before it. Lag 2 correlates every residual with the one two months before it, and so on up to however many lags you choose to test. A model whose residuals are pure noise should show ACF values close to zero at every lag, since nothing about one residual should predict another.

Close to zero is not the same as exactly zero, though. Even genuine noise produces small nonzero correlations by chance alone, so the ACF needs a significance band, roughly plus or minus 1.96 divided by the square root of n, and any bar that crosses it is a lag where the correlation is too large to explain away as sampling noise.

Compute the ACF of fit_full's 59 non-NA .innov values for lags 1 through 10, and compare each one against the band.

```r
# Compute the ACF of fit_full's residuals for lags 1 through 10
acf_vals <- acf(innov, lag.max = 10, plot = FALSE)$acf[-1]
round(acf_vals, 3)
#>  [1]  0.083  0.309 -0.129 -0.088 -0.378 -0.376 -0.265 -0.363  0.072  0.112

# The significance band for 59 residuals
band <- 1.96 / sqrt(length(innov))
round(band, 3)
#> [1] 0.255
```

Five of those ten bars cross plus or minus 0.255: lag 2 at 0.309, and lags 5 through 8 at -0.378, -0.376, -0.265 and -0.363. That is not one stray bar you could wave away as noise, it's half of the lags tested. Eyeballing each bar one at a time works, but it does not give you a single number to report or a single yes-or-no answer, which is exactly what the next step builds.

=== step === concept
## The Ljung-Box statistic and its degrees of freedom

Reading five separate ACF bars one at a time and judging each against a band is a lot of small individual decisions, and every single one of them has roughly a 5% chance of crossing the band by pure chance even when the residuals really are noise. Test ten lags and you are likely to see a false alarm somewhere just from that. The Ljung-Box test solves this by folding every lag into one single statistic and testing them all at once.

The formula is:

$$Q = n(n + 2) \sum_{k=1}^{h} \frac{\rho_k^2}{n - k}$$

`n` is the number of residuals, 59 here, and `h` is the number of lags being tested, 10 here. Each term inside the sum takes one ACF value, squares it, and divides by `n` minus that lag's number, then all `h` of those terms are added up and scaled by `n(n + 2)` to give `Q`. A residual series with nothing but noise in it keeps every ACF value small, so `Q` stays small. A residual series with real autocorrelation, like fit_full's, pushes some ACF values up, and `Q` grows right along with them.

Compute it by hand from the ACF values in the last step, then check it against fabletools' own ljung_box() function.

```r
# Fold the first 10 ACF values into one Ljung-Box statistic by hand
n <- length(innov)
h <- 10
Q <- n * (n + 2) * sum(acf_vals[1:h]^2 / (n - (1:h)))
round(Q, 2)
#> [1] 42.64

# Compare with fabletools' own calculation
features(aug_full, .innov, ljung_box, lag = 10, dof = 0)
#> # A tibble: 1 × 3
#>   .model lb_stat  lb_pvalue
#>   <chr>    <dbl>      <dbl>
#> 1 drift     42.6 0.00000576
```

The hand calculation, 42.64, lands right on top of features()'s own lb_stat, 42.6. lb_pvalue is 0.00000576, close to zero: if fit_full's residuals were genuinely white noise, a Q this large would turn up only about six times in every million tries.

That lag = 10 argument sets `h`. The dof = 0 argument sets K, the number of parameters the model already estimated before you got these residuals, and the test's degrees of freedom are `h - K`. For a benchmark method or a drift model like fit_full, K is conventionally taken as 0, so df = 10 - 0 = 10. An ARIMA(p,d,q) model would instead set K = p + q, the count of its own AR and MA coefficients, since fitting more coefficients already accounts for some of the autocorrelation the test would otherwise flag.

=== step === widget
## Where a test statistic falls under the null

The Ljung-Box statistic follows a chi-squared distribution with 10 degrees of freedom whenever the null hypothesis, no autocorrelation left in the residuals, is actually true. That distribution is not symmetric like the one in the widget below: it is right-skewed, stretched out toward large values, which makes sense since Q is built from squared terms and can never go negative.

But every hypothesis test shares the same general mechanic no matter which distribution sits underneath it: compute a statistic under a null hypothesis of nothing going on, then check how far into the tail that statistic falls. A statistic deep in the tail is rare under the null, so it counts as evidence against it. A statistic near the center is unremarkable, exactly what you would expect even if the null were true.

The widget below shows that same mechanic on a generic, symmetric distribution instead of Northfield's own chi-squared(10).

::widget null-distribution {"tails":1,"label":"observed statistic"}

Drag the slider and watch the shaded tail, the p-value, shrink as the statistic moves further from the center. Northfield's real Q was 42.64 against the chi-squared(10) distribution, and its tail area worked out to p = 0.00000576, nowhere near the middle of that distribution's typical range. It sits buried deep in the tail, which is exactly the far-out, tiny-p-value situation the slider above illustrates in miniature.

=== step === quiz
## Quick check: reading a Ljung-Box p-value

fit_full's residuals gave a Ljung-Box statistic of Q = 42.64 on 10 degrees of freedom, with p = 0.00000576.

What does that say about fit_full's residuals?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The residuals carry far more autocorrelation than white noise would, evidence against the null hypothesis that they are uncorrelated. ::ok Right. Q = 42.64 sits so far into the chi-squared tail that a p-value this small, 0.00000576, would show up almost never if the residuals were truly white noise. Rejecting the null here means fit_full's residuals still carry structure the model did not capture.
- It means fit_full's forecasts must be off by about 42 units on average. ::no
- It means the residuals fail a normality check. ::no
- It means the drift coefficient itself is not statistically significant. ::no None of those are what the Ljung-Box test checks. It says nothing about the size of a forecast error, nothing about whether the residuals look normal (that is Shapiro-Wilk's job), and nothing about any one coefficient's significance. It only tests whether the residuals, taken together across the first h lags, are uncorrelated, and a p-value this tiny means they are not.

=== step === concept
## Why the check failed, and how to fix it

Go back to the lags that crossed the significance band in the ACF: 2, 5, 6, 7 and 8. Lags 5 through 8 are the ones worth explaining, since they sit roughly half a year apart on Northfield's 12-month cycle, which is the signature of a seasonal pattern fit_full has no term for.

fit_full is a random walk with drift. It models one thing only: a steady month-to-month step up in revenue. Northfield's revenue, though, carries a real within-year seasonal pattern on top of that trend, months that consistently run higher or lower than the trend alone would predict. fit_full has no way to represent that pattern, so instead of being absorbed into the fitted line, it leaks straight into the residuals, showing up as exactly the correlation the ACF and the Ljung-Box test both flagged.

The fix is to give the model the structure it is missing. Northfield's revenue needs a trend and a season, so refit it with ETS(A,A,A), an exponential smoothing model with three additive components: error, trend and season.

Refit and run the same Ljung-Box check on the new residuals.

```r
# Refit with trend AND season instead of drift only
fit_ets <- model(sales, ets = ETS(revenue ~ error("A") + trend("A") + season("A")))
aug_ets <- augment(fit_ets)

# Run the same Ljung-Box check on the new residuals
features(aug_ets, .innov, ljung_box, lag = 10, dof = 0)
#> # A tibble: 1 × 3
#>   .model lb_stat lb_pvalue
#>   <chr>    <dbl>     <dbl>
#> 1 ets       9.28     0.506
```

lb_stat drops from 42.6 all the way down to 9.28, and lb_pvalue jumps from 0.00000576 to 0.506, comfortably above the usual 0.05 cutoff. That is a pass: there is no longer evidence that the residuals are anything other than noise.

Giving the model the seasonal structure it was missing is what fixed the check, not some unrelated tweak. A model that captured even less structure than fit_full, one that ignored the trend as well as the season, would fail this same check even worse.

=== step === quiz
## Quick check: reading the four properties together

Picture a different fitted model's gg_tsresiduals() output. Its top panel is centered on zero with an even spread from the first month to the last, and its histogram looks roughly bell-shaped. But several of its ACF bars cross the significance band, and a Ljung-Box test on the same residuals returns p = 0.01.

Which of the four properties does this model's residuals fail?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Zero mean. ::no
- Constant variance. ::no
- Uncorrelated. ::ok Right. The time plot and histogram already cover zero mean, constant variance and roughly normal, and all three look fine here. The ACF bars crossing the band and a Ljung-Box p of 0.01 both say the same thing instead: the residuals are still correlated with each other, the one property a time plot and a histogram cannot show you.
- Roughly normal. ::no None of the other three properties are what the ACF and the Ljung-Box test check. A centered, even-spread time plot already tells you the mean is about zero and the variance is constant, and a bell-shaped histogram already tells you the residuals are close to normal. What neither picture can show is whether one residual predicts the next one, which is exactly what the ACF bars and a Ljung-Box p-value of 0.01 are flagging: the residuals are correlated, not independent noise.

=== step === tryit
## Your turn: run the check on a different model

fit_full was not the only model you could fit to Northfield's revenue. A MEAN model forecasts every month with the overall average revenue and nothing else, no trend, no season. It has already been fit and augmented below as avg and aug_mean.

```r
# A MEAN model: forecast every month with the overall average revenue, no trend or season
avg <- model(sales, avg = MEAN(revenue))
aug_mean <- augment(avg)
```

Run the same Ljung-Box check on aug_mean's .innov column that you ran on fit_full's, 10 lags, dof = 0.

```r
# aug_mean holds the MEAN model's residuals.
# Call features() on aug_mean, testing .innov with the Ljung-Box test,
# lag = 10, dof = 0, exactly like you did for fit_full.
```
::check {"regex": "features[(]\\s*aug_mean\\s*,\\s*[.]innov\\s*,\\s*ljung_box", "gate": true, "difficulty": "intermediate", "ok": "Right. lb_stat comes out at 139 and lb_pvalue rounds all the way to 0, both far more extreme than fit_full's 42.6 and 0.00000576. A MEAN model ignores the trend and the season completely, so nearly all of that missing structure ends up sitting in its residuals instead, and the Ljung-Box test catches every bit of it.", "no": "Call features() the same way you did for fit_full: features(aug_mean, .innov, ljung_box, lag = 10, dof = 0)."}
::solution
```r
# Run the Ljung-Box test on the MEAN model's residuals
features(aug_mean, .innov, ljung_box, lag = 10, dof = 0)
#> # A tibble: 1 × 3
#>   .model lb_stat lb_pvalue
#>   <chr>    <dbl>     <dbl>
#> 1 avg       139.         0
```

Compare that to fit_full's 42.6 or the ETS refit's 9.28: the MEAN model comes out far worse than either, exactly what you would expect from a model that assumes revenue never moves at all.

=== step === concept
## References

- [Forecasting: Principles and Practice, section 5.4, Residual diagnostics](https://otexts.com/fpp3/diagnostics.html) - Hyndman and Athanasopoulos (3rd edition), the source for the four residual properties and gg_tsresiduals().
- [On a measure of lack of fit in time series models](https://doi.org/10.1093/biomet/65.2.297) - Ljung and Box (1978), Biometrika 65(2), 297-303, the paper that introduced the Ljung-Box statistic.
- [feasts: gg_tsresiduals() reference](https://feasts.tidyverts.org/reference/gg_tsresiduals.html) - the function used in this lesson to draw the three residual panels.
- [feasts: ljung_box() reference](https://feasts.tidyverts.org/reference/ljung_box.html) - the function this lesson's hand calculation was checked against.
- [fabletools: features() reference](https://fabletools.tidyverts.org/reference/features.html) - the function that runs ljung_box() over a fitted model's residuals.

=== step === complete
## What you can do now

You now have a complete answer to the question this lesson opened with: does a fitted model's residuals actually behave like noise?

- gg_tsresiduals() draws three panels from a model's .innov residuals in one call: a time plot, an ACF, and a histogram.
- A healthy residual series satisfies four properties at once: uncorrelated, zero mean, constant variance, and roughly normal.
- The Ljung-Box statistic folds every ACF bar across h lags into one number, and its p-value tells you whether the residuals, taken together, are more correlated than pure noise would be.
- fit_full failed that check because it only modeled the trend in Northfield's revenue and missed the seasonal pattern; refitting with ETS(A,A,A), which adds trend and season, passed.

Once a model's residuals pass this check, you can trust their spread enough to build honest ranges around a forecast, not just a single point number.
