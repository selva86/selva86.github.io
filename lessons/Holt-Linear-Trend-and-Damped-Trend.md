---
title: "Exponential Smoothing ETS Lesson 2: Holt's linear trend and the damped trend"
catalog_blurb: "Add a trend to your forecast, then stop it from climbing forever."
description: "Add a trend to exponential smoothing with Holt's method in fable, see why undamped forecasts never level off, then add phi so it settles at a finite ceiling."
keywords: "Holt's linear trend, exponential smoothing, damped trend, beta smoothing parameter, phi damping parameter, ETS(A,A,N), ETS(A,Ad,N), fable forecast in R, time series trend forecasting, AirPassengers"
post_type: "LESSON"
curriculum_id: "5.50.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-ets"
course_title: "Exponential Smoothing ETS"
course_lesson: "2"
course_total: "6"
course_landing: "Exponential-Smoothing-ETS-Course.html"
course_next: "Holt-Winters-Seasonal-Methods.html"
course_prev: "Simple-Exponential-Smoothing.html"
---

=== step === cover
## Holt's linear trend and the damped trend

Today let's understand Holt's linear trend method, a way to forecast a series that keeps climbing year after year, not one that just sits flat.

Take the number of international airline passengers, counted every month from 1949 to 1960 and added up into 12 yearly totals, in thousands of passengers a year. Here is all 12 years of it, plotted in order.

::widget chart-plotter {"data":[{"x":1949,"y":1520},{"x":1950,"y":1676},{"x":1951,"y":2042},{"x":1952,"y":2364},{"x":1953,"y":2700},{"x":1954,"y":2867},{"x":1955,"y":3408},{"x":1956,"y":3939},{"x":1957,"y":4421},{"x":1958,"y":4572},{"x":1959,"y":5140},{"x":1960,"y":5714}],"geoms":["line"],"x":"Year","y":"Passengers"}

Look at that line. It climbs every single year, from 1520 thousand in 1949 to 5714 thousand in 1960, without a single year of falling back. That is exactly the shape Holt's linear trend method was built to forecast.

=== step === concept
## Why a flat forecast fails a series that keeps climbing

Every one of those 12 years rose over the year before it. So the natural next question is: what does the simplest forecasting method, one with no trend at all, do with a series shaped like this?

Build the 12 annual totals as a tsibble, fit a model with no trend, and forecast three years ahead.

```r
# Build 12 annual totals from the monthly AirPassengers series, then fit a model with no trend
library(fable)
library(tsibble)
library(dplyr)

annual <- tapply(as.numeric(AirPassengers), rep(1949:1960, each = 12), sum)
air <- tsibble(Year = 1949:1960, Passengers = as.numeric(annual), index = Year)

fit_ses <- air |>
  model(ETS(Passengers ~ error("A") + trend("N") + season("N")))

forecast(fit_ses, h = 3) |>
  as.data.frame() |>
  transmute(Year, forecast = round(.mean, 0))
#>   Year forecast
#> 1 1961     5714
#> 2 1962     5714
#> 3 1963     5714
```

The forecast for 1961, 1962 and 1963 is the same number three times over, 5714, the last year's total, repeated forever. Passengers had grown every single year for over a decade, and this model just throws that growth away.

That is simple exponential smoothing at work: it carries a level forward and nothing else, so once the last real number arrives, the forecast just repeats it. Holt's linear trend method, first described by Charles Holt in 1957, fixes exactly this. Alongside the level, it tracks a second smoothed number, the trend, that captures how much the series has been rising or falling, and carries that rise forward into the forecast too.

=== step === concept
## The trend component and the smoothing parameter beta

Holt's method keeps the same level equation simple exponential smoothing already uses, and adds a second one just for the trend.

\[
l_t = \alpha y_t + (1 - \alpha)(l_{t-1} + b_{t-1})
\]

\[
b_t = \beta (l_t - l_{t-1}) + (1 - \beta) b_{t-1}
\]

\(l_t\) is still the level, the model's best estimate of where the series sits after year \(t\). The one change from simple exponential smoothing is what it blends with the new observation, \(y_t\): instead of blending against last year's level alone, it blends against last year's level plus last year's trend, \(l_{t-1} + b_{t-1}\), since the trend is how far the level is already expected to have moved.

\(b_t\) is the trend itself, this year's best estimate of how much the level moves per year. It updates the same way the level does, a blend of two things: \(l_t - l_{t-1}\), how much the level actually just moved, and \(b_{t-1}\), last year's trend estimate. \(\beta\) is a number between 0 and 1, just like \(\alpha\), and it decides how much weight the fresh movement gets against the old trend estimate. A high \(\beta\) lets each year's move overwrite the trend almost completely. A low \(\beta\) keeps the trend close to wherever it started, barely reacting to new evidence in the level.

Once you have a year's level and its trend, the forecast one year ahead is simply \(l_t + b_t\): where the series sits now, plus how much further it is expected to move.

=== step === concept
## Fitting ETS(A,A,N) in fable and reading beta, l[0], b[0]

fable's `ETS()` names Holt's method with a second letter. `error("A")` stays additive, `trend("A")` now says yes, add a trend, and `season("N")` still says no season. Fit that on the same 12 years and read \(\alpha\), \(\beta\), and the two starting values, `l[0]` and `b[0]`, straight out of `report()`.

```r
# Fit Holt's linear trend, ETS(A,A,N): additive error, additive trend, no season
fit_holt <- air |>
  model(ETS(Passengers ~ error("A") + trend("A") + season("N")))

report(fit_holt)
#> Series: Passengers 
#> Model: ETS(A,A,N) 
#>   Smoothing parameters:
#>     alpha = 0.6539419 
#>     beta  = 0.0001000464 
#> 
#>   Initial states:
#>      l[0]     b[0]
#>  965.6566 386.2632
#> 
#>   sigma^2:  37164.84
#> 
#>      AIC     AICc      BIC 
#> 161.2307 171.2307 163.6553 
```

\(\alpha\) comes back at 0.654. \(\beta\) comes back at 0.0001, a number close enough to zero that it barely counts as reacting at all. `l[0]`, 965.66, and `b[0]`, 386.26, are the level and trend the model starts from, before 1949's real data has updated either one.

A \(\beta\) this close to zero says the fitted trend barely moves once fitting is done: whatever slope the model settles on early stays close to fixed for the rest of the series. See that for yourself next.

=== step === widget
## Turning the beta dial: what large and small values do

What \(\beta\) actually controls is easiest to see on a plain curve, away from these passenger counts for a moment.

::widget spline-smoother {}

This widget fits its own built-in curve, not the passenger totals, but the same trade-off applies to any smoothing parameter, including \(\beta\) here. Drag the slider from stiff to wiggly. A stiff line barely bends from one point to the next, the way a low \(\beta\) keeps the trend anchored to wherever it started and barely reacts to new evidence. A wiggly line bends sharply at every new point, the way a \(\beta\) near 1 lets the trend swing to match whatever the level just did.

See that same trade-off in this series' own numbers, by forcing \(\beta\) to 0.5 instead of leaving it to fit.

```r
# Force beta to 0.5 and compare the fitted slope path against the model's own near-frozen beta
fit_lo <- air |>
  model(ETS(Passengers ~ error("A") + trend("A", beta = 0.5) + season("N")))

slope_fitted <- components(fit_holt) |> as.data.frame() |> pull(slope)
slope_forced <- components(fit_lo) |> as.data.frame() |> pull(slope)

round(c(fitted_beta_min = min(slope_fitted), fitted_beta_max = max(slope_fitted),
        forced_beta_min = min(slope_forced), forced_beta_max = max(slope_forced)), 2)
#> fitted_beta_min fitted_beta_max forced_beta_min forced_beta_max 
#>          386.21          386.28          229.00          554.25 
```

With \(\beta\) left to fit, the slope barely moves. It stays between 386.21 and 386.28 across all 12 years, practically one fixed number. Force \(\beta\) to 0.5, and the slope swings between 229.00 and 554.25 year to year, reacting hard to whatever the level just did. This series' own fitted \(\beta\) says the climb has been steady enough that the model does not need to keep revising its estimate of how fast passengers are growing.

=== step === quiz
## Quick check: what beta changes

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Beta smooths the level while alpha smooths the trend, the roles reversed from what the equations show. ::no
- A high beta lets the trend react strongly to each new observation and swing between very different values from year to year; a low beta, like this series' own 0.0001, keeps the trend close to fixed once set. ::ok Right. That is exactly what the 0.5-versus-0.0001 comparison just showed: forcing beta to 0.5 swung the slope between 229.00 and 554.25 year to year, while this series' own fitted beta, 0.0001, kept it pinned between 386.21 and 386.28.
- A high beta flattens the forecast by damping the trend down toward zero. ::no
- Beta only matters for the first few fitted values and fades out on a longer series. ::no Beta and alpha each smooth their own component, alpha the level and beta the trend, and neither one damps a forecast down toward zero; that is phi's job, coming up next. Beta keeps working the same way at every point in the series, not just the first few.

=== step === concept
## The forecast equation: why an undamped trend has no ceiling

Once the level and trend stop updating, at the very last real year, forecasting further ahead is just repeating the same step over and over.

\[
\hat{y}_{T+h|T} = l_T + h b_T
\]

\(l_T\) and \(b_T\) are the level and trend at the last real year, 1960 here. Each step ahead adds one more copy of \(b_T\): one year ahead adds it once, two years ahead adds it twice, and \(h\) years ahead adds it \(h\) times. Nothing in this formula ever stops adding it.

Read off this series' own \(l_T\) and \(b_T\), then unroll the forecast for three horizons: 15, 100 and 500 years past 1960.

```r
# Read off the level and slope at the end of the series, then unroll the forecast for three horizons
last_state <- components(fit_holt) |> as.data.frame() |> tail(1)
l_T <- last_state$level
b_T <- last_state$slope

h <- c(15, 100, 500)
data.frame(h = h, year = 1960 + h, forecast = round(l_T + h * b_T, 0))
#>     h year forecast
#> 1  15 1975    11429
#> 2 100 2060    44262
#> 3 500 2460   198769
```

By 1975, just 15 years out, the forecast has already reached 11,429 thousand passengers, roughly double the actual 1960 total. By 2060, 100 years out, it reaches 44,262. By 2460, 500 years out, it reaches 198,769. Doubling \(h\) roughly doubles how far the forecast has travelled from \(l_T\), and nothing in the formula ever slows that down. That is obviously not a forecast anyone would act on, but the formula itself never signals that anything has gone wrong.

=== step === concept
## The damping parameter phi and its usual range

The fix is to stop trusting the trend to keep going at full strength forever. The damped trend multiplies the carried-over trend by one more number, \(\phi\), each time the trend updates.

\[
b_t = \beta (l_t - l_{t-1}) + (1 - \beta) \phi b_{t-1}
\]

\(\phi\) sits between 0 and 1, same as \(\alpha\) and \(\beta\), but it plays a different role: it shrinks how much of last period's trend survives into this period's, a little more each time the trend updates. fable keeps \(\phi\) between 0.8 and 0.98 in practice. Below 0.8 the damping is so strong the trend barely survives one step, and near 1 it is close enough to undamped that there is little point using it.

Unroll that recursion the same way as before, and the \(h\)-step forecast becomes \(l_T + (\phi + \phi^2 + \cdots + \phi^h) b_T\). Each added term is smaller than the one before it, by a factor of \(\phi\) every time, so as \(h\) grows this geometric sum settles at a fixed number, \(\phi/(1-\phi)\), instead of growing forever.

Fit `ETS(A,Ad,N)`, the damped version, on the same 12 years and read its `report()`.

```r
# Fit the damped trend, ETS(A,Ad,N): the carried slope is multiplied by phi each step
fit_damped <- air |>
  model(ETS(Passengers ~ error("A") + trend("Ad") + season("N")))

report(fit_damped)
#> Series: Passengers 
#> Model: ETS(A,Ad,N) 
#>   Smoothing parameters:
#>     alpha = 0.9534238 
#>     beta  = 0.0001001844 
#>     phi   = 0.98 
#> 
#>   Initial states:
#>      l[0]     b[0]
#>  968.8605 425.0025
#> 
#>   sigma^2:  50905.43
#> 
#>      AIC     AICc      BIC 
#> 165.4036 182.2036 168.3131 
```

\(\phi\) comes back at 0.98. \(l_T\) and \(b_T\), the level and trend at 1960, come out at 5702.32 and 333.54, close to the undamped model's own numbers but not identical, since fitting now searches over \(\phi\) too.

Multiply \(b_T\) by \(\phi/(1-\phi)\) and add it to \(l_T\), then compare the damped forecast at \(h = 500\) against the undamped forecast from the last step, at the same horizon.

```r
# Read off phi and the damped level/slope, then compare the damped ceiling to the undamped forecast at h = 500
phi <- coef(fit_damped) |> filter(term == "phi") |> pull(estimate)
last_damped <- components(fit_damped) |> as.data.frame() |> tail(1)
l_T_d <- last_damped$level
b_T_d <- last_damped$slope

ceiling_500 <- l_T_d + b_T_d * phi / (1 - phi)
damped_h500 <- as.data.frame(forecast(fit_damped, h = 500))$.mean[500]
undamped_h500 <- as.data.frame(forecast(fit_holt, h = 500))$.mean[500]

data.frame(phi = phi,
           ceiling = round(ceiling_500, 0),
           damped_at_h500 = round(damped_h500, 0),
           undamped_at_h500 = round(undamped_h500, 0))
#>    phi ceiling damped_at_h500 undamped_at_h500
#> 1 0.98   22046          22045           198769
```

22,046 is the ceiling this forecast approaches and never crosses. By \(h = 500\), the damped forecast has already reached 22,045, a hair under its own ceiling, while the undamped forecast from the last step is still climbing, past 198,769 by that same year.

=== step === widget
## Comparing the three: SES, Holt, and the damped trend

Put all three methods on the same 12 years and forecast the same 15 years ahead, out to 1975, and the difference between them is easy to see.

::widget chart-plotter {"data":[{"x":1949,"y":1520,"fill":"Historical"},{"x":1950,"y":1676,"fill":"Historical"},{"x":1951,"y":2042,"fill":"Historical"},{"x":1952,"y":2364,"fill":"Historical"},{"x":1953,"y":2700,"fill":"Historical"},{"x":1954,"y":2867,"fill":"Historical"},{"x":1955,"y":3408,"fill":"Historical"},{"x":1956,"y":3939,"fill":"Historical"},{"x":1957,"y":4421,"fill":"Historical"},{"x":1958,"y":4572,"fill":"Historical"},{"x":1959,"y":5140,"fill":"Historical"},{"x":1960,"y":5714,"fill":"Historical"},{"x":1961,"y":5714,"fill":"SES"},{"x":1962,"y":5714,"fill":"SES"},{"x":1963,"y":5714,"fill":"SES"},{"x":1964,"y":5714,"fill":"SES"},{"x":1965,"y":5714,"fill":"SES"},{"x":1966,"y":5714,"fill":"SES"},{"x":1967,"y":5714,"fill":"SES"},{"x":1968,"y":5714,"fill":"SES"},{"x":1969,"y":5714,"fill":"SES"},{"x":1970,"y":5714,"fill":"SES"},{"x":1971,"y":5714,"fill":"SES"},{"x":1972,"y":5714,"fill":"SES"},{"x":1973,"y":5714,"fill":"SES"},{"x":1974,"y":5714,"fill":"SES"},{"x":1975,"y":5714,"fill":"SES"},{"x":1961,"y":6021.07,"fill":"Holt"},{"x":1962,"y":6407.33,"fill":"Holt"},{"x":1963,"y":6793.60,"fill":"Holt"},{"x":1964,"y":7179.87,"fill":"Holt"},{"x":1965,"y":7566.14,"fill":"Holt"},{"x":1966,"y":7952.41,"fill":"Holt"},{"x":1967,"y":8338.68,"fill":"Holt"},{"x":1968,"y":8724.94,"fill":"Holt"},{"x":1969,"y":9111.21,"fill":"Holt"},{"x":1970,"y":9497.48,"fill":"Holt"},{"x":1971,"y":9883.75,"fill":"Holt"},{"x":1972,"y":10270.02,"fill":"Holt"},{"x":1973,"y":10656.29,"fill":"Holt"},{"x":1974,"y":11042.56,"fill":"Holt"},{"x":1975,"y":11428.82,"fill":"Holt"},{"x":1961,"y":6029.19,"fill":"Damped"},{"x":1962,"y":6349.52,"fill":"Damped"},{"x":1963,"y":6663.44,"fill":"Damped"},{"x":1964,"y":6971.08,"fill":"Damped"},{"x":1965,"y":7272.57,"fill":"Damped"},{"x":1966,"y":7568.03,"fill":"Damped"},{"x":1967,"y":7857.58,"fill":"Damped"},{"x":1968,"y":8141.35,"fill":"Damped"},{"x":1969,"y":8419.43,"fill":"Damped"},{"x":1970,"y":8691.95,"fill":"Damped"},{"x":1971,"y":8959.03,"fill":"Damped"},{"x":1972,"y":9220.76,"fill":"Damped"},{"x":1973,"y":9477.25,"fill":"Damped"},{"x":1974,"y":9728.62,"fill":"Damped"},{"x":1975,"y":9974.96,"fill":"Damped"}],"geoms":["line"],"x":"Year","y":"Passengers","code":{"line":"ggplot(air_fc, aes(Year, Passengers, color = series)) +\n  geom_line()"}}

The flat SES line never leaves 5714. The undamped Holt line keeps climbing at the same steady rate, reaching 11,429 by 1975. The damped line climbs too, but at a shrinking rate: it reaches 9975 by 1975, about 87% of Holt's undamped forecast, and its climb is already visibly slowing as it nears its own ceiling.

=== step === quiz
## Quick check: reading the three forecasts

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- phi = 1 means the trend is fully damped down to nothing. ::no
- The undamped Holt forecast adds the same 386.27 every single year forever, with no long-run ceiling, while the damped forecast's added amount shrinks by a factor of phi each year and settles near a fixed ceiling, about 22,046 here. ::ok Right. That is the whole difference between the two: one keeps adding the same amount forever, the other adds a shrinking amount that settles at a ceiling.
- phi's usual range is closer to 0.1 to 0.3. ::no
- A damped forecast eventually turns around and declines back toward the level it started from. ::no phi near 1 is closest to undamped, not phi = 1 fully damped to nothing; fable's usual range for phi is 0.8 to 0.98, not 0.1 to 0.3; and a damped forecast never turns around, it approaches its ceiling from below and stays there.

=== step === tryit
## Your turn: fit the damped trend and forecast

`air` still holds the 12-year tsibble from earlier in this lesson. Fit `ETS(Passengers ~ error("A") + trend("Ad") + season("N"))` on it and forecast 15 years ahead.

```r
# air still holds the 12-year tsibble from earlier in this lesson.
# Fit ETS(Passengers ~ error("A") + trend("Ad") + season("N")) on air,
# then forecast 15 years ahead and look at where the forecast lands by 1975.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*ETS[(])(?=[\\s\\S]*forecast[(])[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "Right: the forecast reaches 9975 by 1975, well under Holt's undamped 11,429 at the same year, and closing in on the 22,046 ceiling from step 8.", "no": "Two calls: fit <- air |> model(ETS(Passengers ~ error(\"A\") + trend(\"Ad\") + season(\"N\"))) to fit, then forecast(fit, h = 15) to forecast."}
::solution
```r
# Fit the damped trend, ETS(A,Ad,N), on air, then forecast 15 years ahead
fit_damped <- air |>
  model(ETS(Passengers ~ error("A") + trend("Ad") + season("N")))

forecast(fit_damped, h = 15) |>
  as.data.frame() |>
  transmute(Year, forecast = round(.mean, 0)) |>
  tail(3)
#>    Year forecast
#> 13 1973     9477
#> 14 1974     9729
#> 15 1975     9975
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 8.2, Holt's linear trend method](https://otexts.com/fpp3/holt.html) - Hyndman and Athanasopoulos (3rd ed.).
- [Forecasting trends in time series](https://doi.org/10.1287/mnsc.31.10.1237) - Gardner, E.S. and McKenzie, E. (1985), Management Science, 31(10), 1237-1246. The paper that introduced the damped trend and phi.
- [Forecasting seasonals and trends by exponentially weighted moving averages](https://doi.org/10.1016/j.ijforecast.2003.09.015) - Holt, C.E. (1957), reprinted (2004) in International Journal of Forecasting, 20(1), 5-10.
- [Exponential smoothing: the state of the art, Part II](https://doi.org/10.1016/j.ijforecast.2006.03.005) - Gardner, E.S. (2006), International Journal of Forecasting, 22(4), 637-666.
- [fable package reference documentation for ETS()](https://fable.tidyverts.org/reference/ETS.html)

=== step === complete
## What Holt's linear trend gives you

You can now write Holt's two recursion equations, the level blending each new observation against the last level plus the last trend, and the trend blending each fresh move against its own past value, and explain what beta controls in that second equation.

You have also seen why an undamped trend forecast has no ceiling: it adds the same `b_T` every future year forever, reaching 198,769 by year 500. Adding phi fixes that by shrinking each added step by a further factor of phi, so the forecast settles at a finite ceiling instead, 22,046 here.

And you can fit `ETS(Passengers ~ error("A") + trend("A") + season("N"))` and its damped twin, `trend("Ad")`, in fable yourself, alongside a plain `ETS(A,N,N)`, forecast from each, and read the size of the gap between them at a long horizon.

The next part in this course adds a third smoothed component, the season, so Holt's method can also follow a repeating calendar pattern.
