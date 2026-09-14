---
title: "Exponential Smoothing ETS Lesson 1: Simple exponential smoothing"
catalog_blurb: "Forecast a series with no trend by weighting recent years more than old ones."
description: "Fit simple exponential smoothing to Algeria's exports with ETS() in fable: the weighted average, the level equation, alpha, and why the forecast is flat."
keywords: "simple exponential smoothing, exponential smoothing in R, ETS() fable, smoothing parameter alpha, SES forecast in R, level equation forecasting, weighted average forecast, ETS(A,N,N), tsibbledata global_economy"
post_type: "LESSON"
curriculum_id: "5.50.1"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-ets"
course_title: "Exponential Smoothing ETS"
course_lesson: "1"
course_total: "6"
course_landing: "Exponential-Smoothing-ETS-Course.html"
course_next: "Holt-Linear-Trend-and-Damped-Trend.html"
course_prev: ""
---

=== step === cover
## Simple exponential smoothing

Today let's understand simple exponential smoothing, a way to forecast a series that has no steady climb, fall, or repeating season, using nothing more than the series' own past values.

Take Algeria's exports of goods and services, recorded by the World Bank as a percent of the country's GDP, one value a year from 1960 to 2017. Here are all 58 years of it, plotted in order.

::widget chart-plotter {"data":[{"x":1960,"y":39.04},{"x":1961,"y":46.24},{"x":1962,"y":19.79},{"x":1963,"y":24.68},{"x":1964,"y":25.08},{"x":1965,"y":22.60},{"x":1966,"y":25.99},{"x":1967,"y":23.43},{"x":1968,"y":23.14},{"x":1969,"y":23.79},{"x":1970,"y":22.07},{"x":1971,"y":18.44},{"x":1972,"y":20.45},{"x":1973,"y":25.50},{"x":1974,"y":38.75},{"x":1975,"y":33.69},{"x":1976,"y":33.05},{"x":1977,"y":30.59},{"x":1978,"y":25.54},{"x":1979,"y":31.15},{"x":1980,"y":34.34},{"x":1981,"y":34.59},{"x":1982,"y":30.92},{"x":1983,"y":27.94},{"x":1984,"y":25.71},{"x":1985,"y":23.58},{"x":1986,"y":12.85},{"x":1987,"y":14.27},{"x":1988,"y":15.51},{"x":1989,"y":18.64},{"x":1990,"y":23.44},{"x":1991,"y":29.12},{"x":1992,"y":25.32},{"x":1993,"y":21.78},{"x":1994,"y":22.53},{"x":1995,"y":26.19},{"x":1996,"y":29.76},{"x":1997,"y":30.91},{"x":1998,"y":22.58},{"x":1999,"y":28.15},{"x":2000,"y":42.07},{"x":2001,"y":36.69},{"x":2002,"y":35.50},{"x":2003,"y":38.25},{"x":2004,"y":40.05},{"x":2005,"y":47.21},{"x":2006,"y":48.81},{"x":2007,"y":47.07},{"x":2008,"y":47.97},{"x":2009,"y":35.37},{"x":2010,"y":38.44},{"x":2011,"y":38.79},{"x":2012,"y":36.89},{"x":2013,"y":33.21},{"x":2014,"y":30.22},{"x":2015,"y":23.17},{"x":2016,"y":20.86},{"x":2017,"y":22.64}],"geoms":["line"],"x":"Year","y":"Exports (% of GDP)"}

Look at that shape. It swings between about 13 and 49 percent of GDP again and again across almost six decades, but it never settles into a steady rise or fall, and it never repeats a fixed calendar pattern. That is exactly the kind of series simple exponential smoothing forecasts.

=== step === concept
## The best guess when a series has no trend to follow

Suppose you had to guess next year's export percentage using nothing but these 58 years. Two answers come to mind immediately, and both are worth checking.

The first is to just repeat the last value, 22.64 from 2017. But that throws away every year before it, even though those 57 years still hold real information about how this series tends to move.

The second is to average all 58 years and use that number every time. That is wrong in a different way: it treats 1960 and 2017 as equally relevant to a forecast for 2018, when the recent years are clearly the better guide to what happens next.

Build Algeria's 58 years of exports as a tsibble, a tidyverse table indexed by time, then compute the two candidates side by side.

```r
# Build Algeria's 58 years of exports as a tsibble, then compare the last value against the plain average
library(tsibble)
library(tsibbledata)
library(dplyr)
library(fable)
library(fabletools)

alg <- tsibbledata::global_economy |>
  filter(Country == "Algeria") |>
  select(Country, Year, Exports)

last_value <- alg$Exports[alg$Year == 2017]
plain_average <- mean(alg$Exports)

round(c(last_value = last_value, plain_average = plain_average), 2)
#>    last_value plain_average 
#>         22.64         29.56 
```

The two candidates sit far apart, and neither one uses the data well. Simple exponential smoothing sits between them: it uses every one of the 58 years, but it does not weigh them all the same. Recent years count for more, and older years count for less.

=== step === concept
## The weighted-average view: weights that fade geometrically

There is another way to picture what simple exponential smoothing does: write the forecast out as one weighted average of every year that came before it.

\[
\hat{y}_{T+1|T} = \alpha y_T + \alpha(1-\alpha) y_{T-1} + \alpha(1-\alpha)^2 y_{T-2} + \cdots
\]

Here \(\alpha\) is the smoothing parameter, a number between 0 and 1 that the model fits to the data. It sets how fast the weight on each year fades as you move back in time: the most recent year, \(y_T\), gets weight \(\alpha\); the year before it gets weight \(\alpha(1-\alpha)\); the year before that gets \(\alpha(1-\alpha)^2\), and so on, each weight a little smaller than the one before it.

This series' own \(\alpha\), fit formally in a moment, comes out to 0.8399875. Plug that into the weights and see how fast they fall off.

```r
# Compute the weights alpha*(1-alpha)^j for the four most recent years, and their running sum
alpha <- 0.8399875

j <- 0:3
weights <- alpha * (1 - alpha)^j
cumulative <- cumsum(weights)

data.frame(years_back = j, weight = round(weights, 4), cumulative = round(cumulative, 4))
#>   years_back weight cumulative
#> 1          0 0.8400     0.8400
#> 2          1 0.1344     0.9744
#> 3          2 0.0215     0.9959
#> 4          3 0.0034     0.9993
```

The most recent year alone gets 84% of the total weight. Add the year before it and you are already at 97.44%. Add up just the four most recent years and you reach 99.93% of the total; every year before that contributes barely a rounding error.

Because \(\alpha\) is close to 1 for this series, its forecast leans almost entirely on the last one or two years and barely remembers the rest of its 58-year history. A smaller \(\alpha\) would make these same weights fade more slowly, spreading credit across many more years instead.

=== step === concept
## The level equation: one step of the recursion by hand

Adding up an infinite weighted sum by hand is not how software actually computes a simple exponential smoothing forecast. There is a shortcut: the same numbers come out of a recursion instead, a formula that reuses its own previous output as the input to the next one.

\[
l_t = \alpha y_t + (1 - \alpha) l_{t-1}
\]

\(l_t\) is called the level: the model's best estimate of where the series sits, updated after seeing year \(t\)'s real value. \(l_{t-1}\) is last year's level, and \(y_t\) is this year's observation. Each new level blends the two, \(\alpha\)'s share of the new observation and \((1-\alpha)\)'s share of the old level. Once you have a year's level, the forecast for the following year is just that level; that is the whole model.

Every recursion needs a starting point before the first real year, called `l[0]`, the level's value before any data arrives. This series' own `l[0]`, fit at the same time as \(\alpha\), is 39.539.

Starting from `l[0]` = 39.539, work out the level after 1960 and after 1961 by hand.

```r
# Update the level by hand for 1960 and 1961, starting from l[0] and this series' fitted alpha
alpha <- 0.8399875
l0 <- 39.539

y_1960 <- alg$Exports[alg$Year == 1960]
y_1961 <- alg$Exports[alg$Year == 1961]

l_1960 <- alpha * y_1960 + (1 - alpha) * l0
l_1961 <- alpha * y_1961 + (1 - alpha) * l_1960

round(c(y_1960 = y_1960, l_1960 = l_1960, y_1961 = y_1961, l_1961 = l_1961), 2)
#> y_1960 l_1960 y_1961 l_1961 
#>  39.04  39.12  46.24  45.10 
```

The level after 1960, 39.12, sits close to `l[0]`, 39.539, because that year's observation, 39.04, was itself already close to 39.539, so blending the two barely moves it. The level after 1961 tells a clearer story: the observation jumps to 46.24, and because \(\alpha\) is high, the new level, 45.10, follows that jump most of the way, leaving only a small trace of the old level, 39.12.

=== step === concept
## Fitting SES with ETS() in fable

Simple exponential smoothing is commonly abbreviated SES, and fable's function for fitting it, along with every other member of the exponential smoothing family, is `ETS()`. The three arguments name the model's three parts: `error("A")` picks an additive error, `trend("N")` says there is no trend component, and `season("N")` says there is no seasonal component. Simple exponential smoothing is exactly this combination, a level with no trend and no season, which fable's `report()` calls ETS(A,N,N).

Fit that exact model to Algeria's 58 years and read its two fitted numbers, \(\alpha\) and `l[0]`, straight out of `report()`.

```r
# Fit ETS(A,N,N): additive error, no trend, no season - fable's name for simple exponential smoothing
fit <- alg |>
  model(ETS(Exports ~ error("A") + trend("N") + season("N")))

report(fit)
#> Series: Exports 
#> Model: ETS(A,N,N) 
#>   Smoothing parameters:
#>     alpha = 0.8399875 
#> 
#>   Initial states:
#>    l[0]
#>  39.539
#> 
#>   sigma^2:  35.6301
#> 
#>      AIC     AICc      BIC 
#> 446.7154 447.1599 452.8968 
```

`alpha` comes back as 0.8399875 and `l[0]` as 39.539, the exact numbers the hand computation already used. `model()` searches over every possible \(\alpha\) and `l[0]` and settles on the pair whose one-step-ahead forecasts track the real 58 years most closely; `report()` is just reading those two numbers back out.

Because `l[0]` is the very first level, before any real year has updated it, the model's very first fitted value, for 1960, is just `l[0]` itself.

```r
# Read off the first fitted value: it should just equal l[0], since no year has updated the level yet
augment(fit) |>
  as.data.frame() |>
  transmute(Year, Exports = round(Exports, 2), fitted = round(.fitted, 2), resid = round(.resid, 2)) |>
  head(1)
#>   Year Exports fitted resid
#> 1 1960   39.04  39.54  -0.5
```

The fitted value for 1960, 39.54, is `l[0]` rounded, and the residual, -0.5, is just 39.04 minus 39.54: the model's one honest miss before it has seen anything real to update on. Three ways of looking at the same model now agree with each other: the weighted average, the level recursion computed by hand, and this real fit all land on \(\alpha\) = 0.84 and the same fitted numbers. That is simple exponential smoothing: one smoothing parameter, one running level, fit by search instead of guesswork.

=== step === widget
## Turning the alpha dial: what large and small values do

What \(\alpha\) actually controls is easiest to see on a plain curve, away from Algeria's numbers for a moment.

::widget spline-smoother {}

This widget fits its own built-in curve, not Algeria's exports, but the same trade-off applies to any smoothing parameter, including \(\alpha\) here. Drag the slider from stiff to wiggly. A stiff line changes very little from one point to the next, the way a low \(\alpha\) keeps the level anchored to old history and barely reacts to a new observation. A wiggly line chases every bump in the data, the way an \(\alpha\) near 1 lets the level jump almost all the way to whatever value just arrived.

See that difference in real numbers by fitting this same series twice, once with \(\alpha\) forced down to 0.2 instead of left to search.

```r
# Compare the level ETS() actually fits (alpha = 0.84) against a level forced to update slowly (alpha = 0.2)
fit_lo <- alg |>
  model(ETS(Exports ~ error("A") + trend("N", alpha = 0.2) + season("N")))

level_2017_fitted_alpha <- components(fit) |>
  as.data.frame() |>
  filter(Year == 2017) |>
  pull(level)

level_2017_fixed_alpha <- components(fit_lo) |>
  as.data.frame() |>
  filter(Year == 2017) |>
  pull(level)

l0_fixed_alpha <- coef(fit_lo)$estimate[coef(fit_lo)$term == "l[0]"]

round(c(l0_fixed_alpha = l0_fixed_alpha,
        level_2017_fixed_alpha = level_2017_fixed_alpha,
        level_2017_fitted_alpha = level_2017_fitted_alpha), 2)
#>          l0_fixed_alpha  level_2017_fixed_alpha level_2017_fitted_alpha 
#>                   30.32                   29.57                   22.44 
```

[NOTE]
`alpha` sits inside `trend()` in that code, not `error()`, even though this model has no trend at all. That is just where fable's `ETS()` syntax happens to expose the level's smoothing parameter.

With \(\alpha\) pinned to 0.2, the starting level comes out at 30.32, and by 2017 the level has only crept down to 29.57, nowhere near the real recent fall to 20.86 and 22.64. This series' own fitted \(\alpha\), 0.84, gets there: its 2017 level lands at 22.44, tracking that fall closely.

=== step === quiz
## Quick check: what alpha changes

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A high alpha, near 1, smooths the series more heavily by damping down each new observation's influence. ::no
- A high alpha, near 1, makes the level react strongly to the newest observation and keeps almost no memory of older years; a low alpha, near 0, updates the level by only a small amount each period. ::ok Right. That's exactly what the 0.2-versus-0.84 comparison just showed: alpha 0.2 crept from 30.32 only down to 29.57 by 2017, while this series' own alpha, 0.84, reached 22.44, tracking the real fall in exports.
- alpha only changes the fitted values for the past years; it has no effect on the forecast. ::no
- A higher alpha always fits the data better, so it should always be pushed as close to 1 as possible. ::no alpha is fit by search precisely because a higher value is not automatically better: it trades off how fast the level reacts against how much noise it absorbs. This series happens to fit best with alpha near 0.84, but that is a property of this particular series, not a rule to always push alpha toward 1.

=== step === concept
## Why the forecast is flat beyond the last data point

Once the model has a level for every one of the 58 years, forecasting the future comes down to one rule.

\[
\hat{y}_{T+h|T} = l_T \quad \text{for every } h = 1, 2, 3, \ldots
\]

\(l_T\) is the level after the last real observation, 2017's level. The forecast for every future year, \(h\) steps past 2017, is just that one number, no matter how far out \(h\) reaches. Nothing in the model updates \(l_T\) once the data runs out: the level equation only fires when a new observation arrives, and `trend("N")` means there is no slope term sitting underneath the level to keep pushing it up or down on its own.

Forecast five years past 2017 and check that the forecast actually repeats the same number five times.

```r
# Forecast five years past the data and check that the forecast repeats one number
forecast(fit, h = 5) |>
  as.data.frame() |>
  transmute(Year, forecast = round(.mean, 2))
#>   Year forecast
#> 1 2018    22.44
#> 2 2019    22.44
#> 3 2020    22.44
#> 4 2021    22.44
#> 5 2022    22.44
```

All five years get 22.44, the same number as 2017's fitted level. Whether \(h\) is 1 or 5 makes no difference: with no trend to keep moving the level along, the best guess for every future year is exactly where the level stood at the end of the real data.

=== step === widget
## The level path the model actually estimated

This is the same 58 years from the very first chart, but now plotted as the model's estimated level instead of the raw data itself.

::widget chart-plotter {"data":[{"x":1960,"y":39.12},{"x":1961,"y":45.10},{"x":1962,"y":23.84},{"x":1963,"y":24.55},{"x":1964,"y":25.00},{"x":1965,"y":22.99},{"x":1966,"y":25.51},{"x":1967,"y":23.77},{"x":1968,"y":23.24},{"x":1969,"y":23.70},{"x":1970,"y":22.33},{"x":1971,"y":19.07},{"x":1972,"y":20.23},{"x":1973,"y":24.66},{"x":1974,"y":36.49},{"x":1975,"y":34.14},{"x":1976,"y":33.23},{"x":1977,"y":31.01},{"x":1978,"y":26.41},{"x":1979,"y":30.39},{"x":1980,"y":33.71},{"x":1981,"y":34.45},{"x":1982,"y":31.49},{"x":1983,"y":28.51},{"x":1984,"y":26.16},{"x":1985,"y":24.00},{"x":1986,"y":14.64},{"x":1987,"y":14.33},{"x":1988,"y":15.32},{"x":1989,"y":18.11},{"x":1990,"y":22.59},{"x":1991,"y":28.07},{"x":1992,"y":25.76},{"x":1993,"y":22.42},{"x":1994,"y":22.51},{"x":1995,"y":25.61},{"x":1996,"y":29.10},{"x":1997,"y":30.62},{"x":1998,"y":23.86},{"x":1999,"y":27.46},{"x":2000,"y":39.73},{"x":2001,"y":37.18},{"x":2002,"y":35.77},{"x":2003,"y":37.85},{"x":2004,"y":39.70},{"x":2005,"y":46.00},{"x":2006,"y":48.36},{"x":2007,"y":47.28},{"x":2008,"y":47.86},{"x":2009,"y":37.37},{"x":2010,"y":38.27},{"x":2011,"y":38.70},{"x":2012,"y":37.18},{"x":2013,"y":33.85},{"x":2014,"y":30.80},{"x":2015,"y":24.39},{"x":2016,"y":21.43},{"x":2017,"y":22.44}],"geoms":["point","line"],"x":"Year","y":"Level (% of GDP)"}

Toggle between line and point. The level path moves far more gently than the raw series did at the start: it dips to 21.43 by 2016 and closes at 22.44 in 2017, the same number the forecast repeats for every year after it.

That flatter path is simple exponential smoothing's whole job: turn a series that jumps around across more than 30 percentage points into one slow-moving number you can actually forecast from.

=== step === quiz
## Quiz: reading the fitted level and its forecast

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The plain 58-year average, 29.56. ::no
- A different number every year, continuing to move the way the fitted level did from 1960 to 2017. ::no
- 22.44 for every year from 2018 through 2022, the fitted level at 2017, because trend("N") leaves nothing to keep moving it. ::ok Right. Once 2017's real observation updates the level one last time, trend("N") leaves nothing to keep moving it, so every year after just repeats that same level, 22.44.
- The raw 2017 observation, 22.64, since the newest year should matter most. ::no None of the level's changes across 1960 to 2017 continue once the real data stops. The forecast is not the plain average, not a moving number, and not the raw 2017 observation either: it is the fitted level at 2017, 22.44, held flat for every year after it.

=== step === tryit
## Your turn: fit SES and read its forecast

`alg` still holds all 58 years of Algeria's exports from earlier in this lesson. Fit the same ETS(A,N,N) model on it and forecast 5 years ahead.

```r
# alg still holds Algeria's 58 years of exports from earlier in this lesson.
# Fit ETS(Exports ~ error("A") + trend("N") + season("N")) on alg,
# then forecast 5 years ahead and look at the repeated value.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*ETS[(])(?=[\\s\\S]*forecast[(])[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "Right: the forecast repeats 22.44 for every year from 2018 through 2022, the same fitted level 2017 ended on.", "no": "Two calls: fit <- alg |> model(ETS(Exports ~ error(\"A\") + trend(\"N\") + season(\"N\"))) to fit, then forecast(fit, h = 5) to forecast."}
::solution
```r
# Fit ETS(A,N,N) on alg, then forecast five years ahead
fit <- alg |>
  model(ETS(Exports ~ error("A") + trend("N") + season("N")))

forecast(fit, h = 5) |>
  as.data.frame() |>
  transmute(Year, forecast = round(.mean, 2))
#>   Year forecast
#> 1 2018    22.44
#> 2 2019    22.44
#> 3 2020    22.44
#> 4 2021    22.44
#> 5 2022    22.44
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 8.1, Simple exponential smoothing](https://otexts.com/fpp3/ses.html) - Hyndman and Athanasopoulos (3rd ed.), the source for the weighted-average and recursive forms used in this lesson.
- [Forecasting seasonals and trends by exponentially weighted moving averages](https://doi.org/10.1016/j.ijforecast.2003.09.015) - Holt, C.E. (1957), reprinted (2004) in International Journal of Forecasting, 20(1), 5-10.
- [A state space framework for automatic forecasting using exponential smoothing methods](https://doi.org/10.1016/S0169-2070(01)00110-8) - Hyndman, Koehler, Snyder and Grose (2002), International Journal of Forecasting, 18(3), 439-454.
- [fable package reference documentation for ETS()](https://fable.tidyverts.org/reference/ETS.html)
- [tsibbledata package reference documentation for global_economy](https://tsibbledata.tidyverts.org/reference/global_economy.html) - the World Bank national accounts data used throughout this lesson.

=== step === complete
## What simple exponential smoothing gives you

You can now write simple exponential smoothing as a weighted average of every past value, its weights fading by \((1-\alpha)\) each step back, and explain what a high or low alpha does to that fade.

You can also compute the same forecast a second way, one running update, \(l_t = \alpha y_t + (1-\alpha) l_{t-1}\), and read a fitted level and its consequence straight off real `ETS()` output.

And you can fit `ETS(Exports ~ error("A") + trend("N") + season("N"))` in fable yourself and forecast from it, knowing why that forecast stays exactly flat: no trend term means nothing keeps pushing the level once the real data stops.

The next part in this course adds a trend component to the model, so that flat forecast starts moving again.
