---
title: "State Space Models and the Kalman Filter Lesson 3: Local level and local linear trend models"
catalog_blurb: "How a signal-to-noise ratio decides whether a fitted level tracks or copies your data."
description: "Fit a local level and a local linear trend model to airmiles, read the signal-to-noise ratio, name the ETS equivalents, and read the trend in a component plot."
keywords: "local level model, local linear trend model, StructTS, signal-to-noise ratio, ETS ANN AAN, fable ETS, Kalman filter, state space model in R, airmiles dataset, tsSmooth"
post_type: "LESSON"
curriculum_id: "5.80.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-statespace"
course_title: "State Space Models and the Kalman Filter"
course_lesson: "3"
course_total: "7"
course_landing: "State-Space-Models-and-the-Kalman-Filter-Course.html"
course_next: "Basic-Structural-Time-Series.html"
course_prev: "The-Kalman-Filter-and-Smoother.html"
---

=== step === cover
## Local level and local linear trend models

Today let's look at the two simplest state space models there are, the local level model and the local linear trend model, and see what changes the moment a real trend enters the picture.

The example is airmiles, a series that ships with R itself: US domestic airline revenue passenger miles, one number a year from 1937 to 1960. It opens at 412 million miles in 1937 and closes at 30,514 million in 1960, with no repeating seasonal pattern in it at all.

Here is the whole series, plotted exactly as it happened.

::widget chart-plotter {"data":[{"x":1937,"y":412},{"x":1938,"y":480},{"x":1939,"y":683},{"x":1940,"y":1052},{"x":1941,"y":1385},{"x":1942,"y":1418},{"x":1943,"y":1634},{"x":1944,"y":2178},{"x":1945,"y":3362},{"x":1946,"y":5948},{"x":1947,"y":6109},{"x":1948,"y":5981},{"x":1949,"y":6753},{"x":1950,"y":8003},{"x":1951,"y":10566},{"x":1952,"y":12528},{"x":1953,"y":14760},{"x":1954,"y":16769},{"x":1955,"y":19819},{"x":1956,"y":22362},{"x":1957,"y":25340},{"x":1958,"y":25343},{"x":1959,"y":29269},{"x":1960,"y":30514}],"geoms":["line"],"x":"year","y":"miles"}

That is not a gentle drift. Airline travel grew more than seventy times over across those 24 years, and every model in this lesson has to fit a climb that steep.

=== step === concept
## The local level model and what a real trend does to it

Start with the simpler of the two models. A local level model says a series is one hidden state, called the level and written \(\mu_t\), plus noise.

The level itself is not fixed. It moves from one year to the next by a random walk:

\[\mu_t = \mu_{t-1} + \eta_t, \quad \eta_t \sim N(0, Q)\]

\(\eta_t\) is a small random nudge applied every year, and \(Q\) is its variance: how big that nudge typically is. Whatever the level was last year, it carries over to this year plus one of these nudges.

What you actually observe is never the level directly. It is the level plus a separate noise term on top:

\[y_t = \mu_t + \epsilon_t, \quad \epsilon_t \sim N(0, H)\]

\(\epsilon_t\) is the observation noise: the part of each year's number that is measurement error, not a real change in the level. \(H\) is its variance.

Fit this to airmiles and see what R finds for \(Q\) and \(H\).

```r
# Fit the local level model to airmiles and look at its two variances
fit_level <- StructTS(airmiles, type = "level")
fit_level$coef
#>   level epsilon 
#> 3128881       0 
```

\(Q\), the level's own variance, comes out at 3,128,881: a big number, but airmiles itself ranges from 412 to 30,514, so a big number is expected. The real surprise is \(H\), the observation noise variance. It comes out at exactly 0.

Put the two together and you get what is called the signal-to-noise ratio, \(Q/H\): how much the hidden state itself moves, set against how noisy each single observation is. With \(H = 0\), that ratio is not just large, it is undefined, since nothing can be divided by zero.

An undefined, effectively infinite signal-to-noise ratio has one direct consequence for the fit. The Kalman filter's gain, the number that decides how much of each new observation gets folded into the updated level, locks at 1. A gain of 1 means every observation is folded in whole, with nothing held back. So the fitted level should equal the observed data exactly, year for year.

```r
# Check whether the fitted level really does equal the observed data
cor(as.numeric(airmiles), as.numeric(fitted(fit_level)))
#> [1] 1
```

Correlation of 1.000, not 0.999 or 0.99. Fit to a series with a trend this strong, the local level model does not smooth airmiles at all. It just copies it back.

=== step === concept
## The local linear trend model: a second hidden state for the slope

The local level model had nowhere to put a genuine trend except into the level's own variance \(Q\), and that is exactly what forced \(H\) down to 0. The local linear trend model gives it somewhere else to put that climb: a second hidden state, the slope, written \(\beta_t\).

The slope is itself a random walk, the same idea as the level:

\[\beta_t = \beta_{t-1} + \zeta_t, \quad \zeta_t \sim N(0, Q_{\beta})\]

And the level equation changes to use it. Instead of just carrying over plus a nudge, the level now moves by last period's slope, plus its own nudge:

\[\mu_t = \mu_{t-1} + \beta_{t-1} + \eta_t, \quad \eta_t \sim N(0, Q_{\mu})\]

The observation equation stays exactly as it was: \(y_t = \mu_t + \epsilon_t\), with \(\epsilon_t \sim N(0, H)\). Fit this version to the same series.

```r
# Fit the local linear trend model to airmiles and look at its three variances
fit_trend <- StructTS(airmiles, type = "trend")
fit_trend$coef
#>    level    slope  epsilon 
#> 309341.6 114247.5 197886.3 
```

There are three variances now instead of two, and \(H\), the observation noise, comes out at 197,886.3: no longer zero. Handing the trend to the slope state lets some of airmiles' year-to-year movement come out as noise instead of being forced into the level.

With a real \(H\) to divide by, there are now two finite signal-to-noise ratios instead of one undefined one. The level's ratio is 309,341.6 divided by 197,886.3, which is 1.56, and the slope's is 114,247.5 divided by 197,886.3, which is 0.58. Both are modest numbers, nowhere near infinite, and that is the first sign that this fitted level will not simply copy the data the way the local level model's did.

=== step === widget
## Does the fitted level copy the data, or smooth it?

Scatter the 24 observed values against the local level model's own fitted values, and see whether they land on the diagonal or scatter around it.

::widget chart-plotter {"data":[{"x":412,"y":412},{"x":480,"y":480},{"x":683,"y":683},{"x":1052,"y":1052},{"x":1385,"y":1385},{"x":1418,"y":1418},{"x":1634,"y":1634},{"x":2178,"y":2178},{"x":3362,"y":3362},{"x":5948,"y":5948},{"x":6109,"y":6109},{"x":5981,"y":5981},{"x":6753,"y":6753},{"x":8003,"y":8003},{"x":10566,"y":10566},{"x":12528,"y":12528},{"x":14760,"y":14760},{"x":16769,"y":16769},{"x":19819,"y":19819},{"x":22362,"y":22362},{"x":25340,"y":25340},{"x":25343,"y":25343},{"x":29269,"y":29269},{"x":30514,"y":30514}],"geoms":["point"],"x":"observed","y":"level_fitted"}

Every single point sits exactly on the diagonal, r = 1.000, since \(H = 0\) makes the local level model's fitted level a copy of the data. Now put the local linear trend model's fitted level next to the same observed values, and look for a year with a real gap.

```r
# Compare the local linear trend model's fitted level against the observed data
trend_fitted <- as.numeric(fitted(fit_trend)[, "level"])
compare <- data.frame(
  year = as.numeric(time(airmiles)),
  observed = as.numeric(airmiles),
  trend_fitted = round(trend_fitted, 1)
)
compare[compare$year == 1946, ]
#>    year observed trend_fitted
#> 10 1946     5948       5556.4

cor(as.numeric(airmiles), trend_fitted)
#> [1] 0.9998342
```

1946 is observed at 5,948 but fitted at 5,556.4, a real gap of almost 400. The correlation across all 24 years drops to 0.9998, close to 1 but no longer exactly 1. That is what a finite signal-to-noise ratio does: the model still leans heavily on the data, but it also holds onto its own assumption about how smoothly the level and slope should move, so it no longer just copies every point back.

=== step === quiz
## Quick check: local level or local linear trend

A local level model fit to a series with a strong upward trend comes back with an observation noise variance of H = 0. What does that say about the fitted level?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Q/H drops to 0, so the fitted level ignores the data and stays completely flat. ::no
- H = 0 means the series was measured perfectly, with no real trend in it at all. ::no
- Q/H is effectively infinite, so the filter's gain locks at 1 and the fitted level copies every observed value exactly. ::ok Right. With no observation noise to weigh against the level's own movement, the model has nothing left to smooth away, so the fitted level lands exactly on the data, correlation 1.000.
- StructTS returns an error instead of a coefficient, since a variance cannot be exactly 0. ::no H = 0 is a legitimate coefficient, not a fitting failure: StructTS still returns real numbers, it is just that all of the series' movement gets assigned to the level's own variance Q and none of it to observation noise. That is what makes Q/H undefined, effectively infinite, and pins the filter's gain at 1, so the fitted level equals the raw data exactly.

=== step === concept
## Their ETS equivalents: ANN and AAN, fitted in fable

Both of these models already have names in a widely used framework called ETS. ETS names a model by three letters, Error, Trend and Season, each one saying how that piece enters the model.

ANN means additive error, no trend, no season. That is simple exponential smoothing, and it is exactly the local level model: one random-walking level, nothing else. AAN means additive error, additive trend, no season: Holt's linear trend, and exactly the local linear trend model, with its extra random-walking slope.

Fit both with the fable package, on airmiles built as a tsibble, a data frame that keeps track of which column is the time index.

```r
# Build the airmiles tsibble and fit both ETS(A,N,N) and ETS(A,A,N)
library(tsibble)
library(fable)

air_tsb <- tsibble(year = 1937:1960, value = as.numeric(airmiles), index = year)

m_ann <- air_tsb |> model(ETS(value ~ error("A") + trend("N") + season("N")))
m_aan <- air_tsb |> model(ETS(value ~ error("A") + trend("A") + season("N")))

report(m_ann)
#> Series: value 
#> Model: ETS(A,N,N) 
#>   Smoothing parameters:
#>     alpha = 0.9999 
#> 
#>   Initial states:
#>      l[0]
#>  415.8842
#> 
#>   sigma^2:  3271547
#> 
#>      AIC     AICc      BIC 
#> 440.2036 441.4036 443.7377 

report(m_aan)
#> Series: value 
#> Model: ETS(A,A,N) 
#>   Smoothing parameters:
#>     alpha = 0.8259343 
#>     beta  = 0.2951686 
#> 
#>   Initial states:
#>       l[0]    b[0]
#>  -786.1056 557.332
#> 
#>   sigma^2:  1285233
#> 
#>      AIC     AICc      BIC 
#> 419.4924 422.8257 425.3827 
```

ANN's alpha is 0.9999: almost 1, matching the Kalman gain locked at 1 when H came out at 0. Alpha is ETS's name for the same fraction the Kalman gain controls, how much of each new observation updates the level, so a gain locked at 1 and an alpha of 0.9999 are describing the same thing from two different angles.

AAN's alpha is 0.826 and its beta, the equivalent updating fraction for the slope, is 0.295. Both sit well below 1, in line with the finite signal-to-noise ratios computed earlier, 1.56 for the level and 0.58 for the slope. And AAN's AICc, 422.8, is well below ANN's 441.4. A lower AICc means a better fit once model complexity is accounted for, so AAN is not just a different model, it is decisively the better one for this series.

=== step === widget
## What a signal-to-noise ratio does to any fitted curve

This next widget carries its own curve and its own data, not airmiles. Its smoothness dial goes from few basis functions to many, and that dial stands in for exactly the same trade-off a state space model's own signal-to-noise ratio controls.

::widget spline-smoother {}

Turn the dial down, toward few basis functions, and the fitted curve barely bends: that is what a low, finite ratio does, the way the trend model's slope ratio of 0.58 kept the slope's own movement small. Turn it up, toward many basis functions, and the curve passes through every point: that is what the local level model's undefined ratio did earlier, pinning the gain at 1 so the fit chased the data exactly.

=== step === concept
## Reading the smoothed states as a component plot

`tsSmooth()` re-estimates the level and slope for every year using the whole series at once, not just the years that came before it, so even the earliest years get a well-informed estimate. Read off the slope it gives the local linear trend model at three points in the series.

```r
# Smooth the trend model's states and read the slope at three notable years
sm_trend <- tsSmooth(fit_trend)
years <- 1937:1960
slope_smoothed <- round(as.numeric(sm_trend[, "slope"]), 1)
data.frame(year = years, slope = slope_smoothed)[years %in% c(1937, 1954, 1960), ]
#>    year  slope
#> 1  1937  110.4
#> 18 1954 2373.5
#> 24 1960 2095.4
```

The slope starts small, 110.4 miles a year in 1937, climbs to a peak of 2,373.5 by 1954, then eases back down to 2,095.4 by 1960. It is not one number for the whole span, it is a path, moving year by year the way the level itself does.

Compare that against a single straight line fit to the same 24 points by ordinary least squares.

```r
# Fit a single straight line to the same series and read off its one fixed slope
ols <- lm(as.numeric(airmiles) ~ years)
round(coef(ols)["years"], 2)
#>   years 
#> 1350.28 
```

One number, 1,350.28 miles a year, for the entire span from 1937 to 1960. That is the difference "local" is naming. The local linear trend model's slope is local because it is allowed to change from year to year, while an ordinary least squares line's slope is global: fixed once, for every year at once.

```r
# Plot the smoothed level and slope over year, with the fixed OLS slope as a reference
library(ggplot2)

states <- data.frame(
  year = rep(years, 2),
  value = c(as.numeric(sm_trend[, "level"]), as.numeric(sm_trend[, "slope"])),
  state = rep(c("Smoothed level", "Smoothed slope"), each = length(years))
)
ols_ref <- data.frame(state = "Smoothed slope", value = as.numeric(coef(ols)["years"]))

ggplot(states, aes(x = year, y = value)) +
  geom_line(color = "steelblue", linewidth = 1) +
  geom_hline(
    data = ols_ref,
    aes(yintercept = value), linetype = "dashed", color = "firebrick"
  ) +
  facet_wrap(~state, ncol = 1, scales = "free_y") +
  labs(x = "Year", y = NULL,
       title = "Smoothed level and slope against airmiles' fixed OLS slope")
```

The bottom panel makes it visible: the blue smoothed slope rises and falls across the years, while the dashed red line, the OLS slope, cuts straight across at one fixed height. The state space model's slope moves with the data. The regression line's slope cannot.

=== step === quiz
## Quick check: reading the fitted models

AAN's fit gave alpha = 0.826 and beta = 0.295, both well below 1, while ANN's alpha came back at 0.9999. Which statement correctly places these two fits on the spline-smoother widget's stiff-to-flexible dial?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- ANN sits at the stiff end, because an alpha near 1 means the model updates very little from one year to the next. ::no
- AAN sits closer to the stiff end, because alpha and beta below 1 mean each year's new observation only partly updates the level and slope, the same way a lower signal-to-noise ratio holds a fitted curve closer to its past shape. ::ok Right. ANN's alpha of 0.9999 is the flexible end of the dial, chasing the data almost exactly, the same story as H = 0 gave earlier. AAN's smaller alpha and beta hold both its states stiffer, matching its lower, finite signal-to-noise ratios.
- Neither fit maps onto the dial, since the spline-smoother widget only illustrates models with one hidden state. ::no
- AAN sits at the flexible end, because a model with two states always updates faster than a model with one. ::no It is not the number of states that decides this, it is the size of the smoothing parameters. AAN's alpha (0.826) and beta (0.295) are both well below ANN's alpha (0.9999), so AAN updates more cautiously from year to year, closer to the stiff end of the same dial the widget's slider turns.

=== step === tryit
## Your turn: fit a local linear trend model yourself

`practice_series` is a short trended vector, already in this page's session. Fit a local level model to it first, the same StructTS() call used earlier in this lesson.

```r
# Build a short trended practice series and fit a local level model to it
practice_series <- c(120, 135, 158, 190, 210, 225, 260, 290, 305, 340, 365, 390)
fit_practice <- StructTS(practice_series, type = "level")
fit_practice$coef
#>    level  epsilon 
#> 657.0904   0.0000 
```

Same story as airmiles: a single hidden state with nowhere to put the climb except its own variance, so H comes out at 0 again. Now edit the call below to fit a local linear trend model instead, and print its three coefficients.

```r
# Edit type = "level" to type = "trend" below, then print the three coefficients.
# One line changed. Press Check when you have it.
fit_practice <- StructTS(practice_series, type = "level")
fit_practice$coef
```
::check {"regex": "type\\s*=\\s*[\"']trend[\"']", "gate": true, "difficulty": "intermediate", "ok": "Right: level = 51.16, slope = 55.79, epsilon = 0. Giving this short series a slope state to carry its climb works exactly the way it did for airmiles.", "no": "Change the type argument from \"level\" to \"trend\" inside StructTS(practice_series, type = ...), then print fit_practice$coef again."}
::solution
```r
# Fit the local linear trend model to practice_series and print its three coefficients
fit_practice <- StructTS(practice_series, type = "trend")
fit_practice$coef
#>    level    slope  epsilon 
#> 51.15666 55.78895  0.00000 
```

=== step === concept
## References

- Harvey, A.C. (1989), *Forecasting, Structural Time Series Models and the Kalman Filter*, Cambridge University Press. Defines the local level and local linear trend models.
- Durbin, J. and Koopman, S.J. (2001), *Time Series Analysis by State Space Methods*, Oxford University Press. Covers maximum likelihood estimation of both models' variances.
- [Forecasting: Principles and Practice, chapter 8: Exponential smoothing](https://otexts.com/fpp3/ets.html) - Hyndman, R.J. and Athanasopoulos, G. (3rd ed., OTexts). Explains the ANN and AAN naming and their state space form.
- [R documentation for `StructTS`](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/StructTS.html) (stats package). Documents the `type = "level"` and `type = "trend"` fits and the coefficient names used in this lesson.
- [R documentation for `fable::ETS()`](https://fable.tidyverts.org/reference/ETS.html) (fable package). Documents the model formula syntax and the alpha and beta smoothing parameters this lesson reads off.

=== step === complete
## What you can do now

You can now tell a local level model from a local linear trend model by what each one assumes about its hidden state, one random-walking level against a level plus its own random-walking slope. And you can read a StructTS fit's signal-to-noise ratio, Q over H, to see what that assumption does to the fitted level: airmiles forced H to 0 under a single state, then freed it to a real 197,886.3 once a slope state took over the climb.

You can also name each model's ETS equivalent, ANN for the local level model and AAN for the local linear trend model, fit both with fable, and read off alpha and beta as the same updating fractions the Kalman gain and the signal-to-noise ratio already described.

And you can read a component plot's smoothed slope against a fixed OLS slope, and say exactly why the word local belongs to the state space version: its slope moves year by year, the OLS line's does not.

Next, you will meet a model that goes further still: level, slope, a seasonal component and an irregular term, all as separate states in one basic structural time series model.
