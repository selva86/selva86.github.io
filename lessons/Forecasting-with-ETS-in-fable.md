---
title: "Exponential Smoothing ETS Lesson 6: How to forecast from a fitted ETS model, and check whether it beats the baselines"
catalog_blurb: "Turn a fitted ETS model into a forecast, then check it beats simple baselines."
description: "Forecast from a fitted ETS model with fable's forecast(), read its prediction interval two ways, check its residuals, and benchmark it against simple baselines."
keywords: "ETS forecast fable, fable forecast h, ETS prediction interval, generate bootstrap forecast R, ETS components autoplot, Ljung-Box test residuals, forecast accuracy MASE, benchmark forecast NAIVE SNAIVE drift, R time series forecasting"
post_type: "LESSON"
curriculum_id: "5.50.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-ets"
course_title: "Exponential Smoothing ETS"
course_lesson: "6"
course_total: "6"
course_landing: "Exponential-Smoothing-ETS-Course.html"
course_next: ""
course_prev: "Automatic-ETS-Model-Selection.html"
---

=== step === cover
## How to forecast from a fitted ETS model, and check whether it beats the baselines

Today let's turn a fitted ETS model into an actual forecast, and then check whether that forecast is any good.

Take Australia's quarterly natural gas production, measured in petajoules, from the first quarter of 1956 to the second quarter of 2010. That's 218 quarters of real production numbers. Output climbs across those five and a half decades, from single digits in the 1950s to well over 200 petajoules a quarter by 2010, and the swing between a quarter's low and high grows right along with it. Here is all 218 quarters of it, plotted in order.

::widget chart-plotter {"data":[{"x":1956.00,"y":5},{"x":1956.25,"y":6},{"x":1956.50,"y":7},{"x":1956.75,"y":6},{"x":1957.00,"y":5},{"x":1957.25,"y":7},{"x":1957.50,"y":7},{"x":1957.75,"y":6},{"x":1958.00,"y":5},{"x":1958.25,"y":7},{"x":1958.50,"y":8},{"x":1958.75,"y":6},{"x":1959.00,"y":5},{"x":1959.25,"y":7},{"x":1959.50,"y":8},{"x":1959.75,"y":6},{"x":1960.00,"y":6},{"x":1960.25,"y":8},{"x":1960.50,"y":8},{"x":1960.75,"y":7},{"x":1961.00,"y":6},{"x":1961.25,"y":7},{"x":1961.50,"y":8},{"x":1961.75,"y":6},{"x":1962.00,"y":6},{"x":1962.25,"y":8},{"x":1962.50,"y":8},{"x":1962.75,"y":7},{"x":1963.00,"y":6},{"x":1963.25,"y":8},{"x":1963.50,"y":9},{"x":1963.75,"y":7},{"x":1964.00,"y":6},{"x":1964.25,"y":8},{"x":1964.50,"y":9},{"x":1964.75,"y":7},{"x":1965.00,"y":6},{"x":1965.25,"y":8},{"x":1965.50,"y":9},{"x":1965.75,"y":7},{"x":1966.00,"y":6},{"x":1966.25,"y":8},{"x":1966.50,"y":10},{"x":1966.75,"y":7},{"x":1967.00,"y":6},{"x":1967.25,"y":9},{"x":1967.50,"y":10},{"x":1967.75,"y":7},{"x":1968.00,"y":6},{"x":1968.25,"y":9},{"x":1968.50,"y":11},{"x":1968.75,"y":8},{"x":1969.00,"y":7},{"x":1969.25,"y":10},{"x":1969.50,"y":13},{"x":1969.75,"y":11},{"x":1970.00,"y":12},{"x":1970.25,"y":18},{"x":1970.50,"y":23},{"x":1970.75,"y":20},{"x":1971.00,"y":19},{"x":1971.25,"y":23},{"x":1971.50,"y":28},{"x":1971.75,"y":24},{"x":1972.00,"y":24},{"x":1972.25,"y":34},{"x":1972.50,"y":40},{"x":1972.75,"y":35},{"x":1973.00,"y":34},{"x":1973.25,"y":41},{"x":1973.50,"y":48},{"x":1973.75,"y":39},{"x":1974.00,"y":38},{"x":1974.25,"y":48},{"x":1974.50,"y":52},{"x":1974.75,"y":43},{"x":1975.00,"y":39},{"x":1975.25,"y":49},{"x":1975.50,"y":55},{"x":1975.75,"y":47},{"x":1976.00,"y":44},{"x":1976.25,"y":58},{"x":1976.50,"y":65},{"x":1976.75,"y":54},{"x":1977.00,"y":49},{"x":1977.25,"y":64},{"x":1977.50,"y":74},{"x":1977.75,"y":58},{"x":1978.00,"y":56},{"x":1978.25,"y":71},{"x":1978.50,"y":78},{"x":1978.75,"y":65},{"x":1979.00,"y":59},{"x":1979.25,"y":74},{"x":1979.50,"y":88},{"x":1979.75,"y":71},{"x":1980.00,"y":68},{"x":1980.25,"y":91},{"x":1980.50,"y":103},{"x":1980.75,"y":83},{"x":1981.00,"y":88},{"x":1981.25,"y":110},{"x":1981.50,"y":120},{"x":1981.75,"y":101},{"x":1982.00,"y":93},{"x":1982.25,"y":116},{"x":1982.50,"y":127},{"x":1982.75,"y":98},{"x":1983.00,"y":92},{"x":1983.25,"y":118},{"x":1983.50,"y":124},{"x":1983.75,"y":104},{"x":1984.00,"y":97},{"x":1984.25,"y":116},{"x":1984.50,"y":130},{"x":1984.75,"y":111},{"x":1985.00,"y":103},{"x":1985.25,"y":120},{"x":1985.50,"y":132},{"x":1985.75,"y":107},{"x":1986.00,"y":98},{"x":1986.25,"y":127},{"x":1986.50,"y":137},{"x":1986.75,"y":112},{"x":1987.00,"y":106},{"x":1987.25,"y":130},{"x":1987.50,"y":158},{"x":1987.75,"y":123},{"x":1988.00,"y":116},{"x":1988.25,"y":137},{"x":1988.50,"y":157},{"x":1988.75,"y":125},{"x":1989.00,"y":117},{"x":1989.25,"y":149},{"x":1989.50,"y":175},{"x":1989.75,"y":139},{"x":1990.00,"y":125},{"x":1990.25,"y":152},{"x":1990.50,"y":161},{"x":1990.75,"y":123},{"x":1991.00,"y":111},{"x":1991.25,"y":141},{"x":1991.50,"y":160},{"x":1991.75,"y":125},{"x":1992.00,"y":117},{"x":1992.25,"y":151},{"x":1992.50,"y":175},{"x":1992.75,"y":129},{"x":1993.00,"y":116},{"x":1993.25,"y":149},{"x":1993.50,"y":163},{"x":1993.75,"y":138},{"x":1994.00,"y":127},{"x":1994.25,"y":159},{"x":1994.50,"y":184},{"x":1994.75,"y":147},{"x":1995.00,"y":131},{"x":1995.25,"y":167},{"x":1995.50,"y":181},{"x":1995.75,"y":145},{"x":1996.00,"y":133},{"x":1996.25,"y":162},{"x":1996.50,"y":184},{"x":1996.75,"y":146},{"x":1997.00,"y":135},{"x":1997.25,"y":171},{"x":1997.50,"y":183},{"x":1997.75,"y":151},{"x":1998.00,"y":141},{"x":1998.25,"y":174},{"x":1998.50,"y":191},{"x":1998.75,"y":157},{"x":1999.00,"y":145},{"x":1999.25,"y":182},{"x":1999.50,"y":198},{"x":1999.75,"y":165},{"x":2000.00,"y":164},{"x":2000.25,"y":199},{"x":2000.50,"y":213},{"x":2000.75,"y":173},{"x":2001.00,"y":177},{"x":2001.25,"y":205},{"x":2001.50,"y":218},{"x":2001.75,"y":185},{"x":2002.00,"y":166},{"x":2002.25,"y":204},{"x":2002.50,"y":228},{"x":2002.75,"y":186},{"x":2003.00,"y":172},{"x":2003.25,"y":204},{"x":2003.50,"y":232},{"x":2003.75,"y":188},{"x":2004.00,"y":173},{"x":2004.25,"y":215},{"x":2004.50,"y":227},{"x":2004.75,"y":190},{"x":2005.00,"y":170},{"x":2005.25,"y":206},{"x":2005.50,"y":221},{"x":2005.75,"y":180},{"x":2006.00,"y":171},{"x":2006.25,"y":224},{"x":2006.50,"y":233},{"x":2006.75,"y":192},{"x":2007.00,"y":187},{"x":2007.25,"y":234},{"x":2007.50,"y":245},{"x":2007.75,"y":205},{"x":2008.00,"y":194},{"x":2008.25,"y":229},{"x":2008.50,"y":249},{"x":2008.75,"y":203},{"x":2009.00,"y":196},{"x":2009.25,"y":238},{"x":2009.50,"y":252},{"x":2009.75,"y":210},{"x":2010.00,"y":205},{"x":2010.25,"y":236}],"geoms":["line"],"x":"Year","y":"Gas"}

Look at how far apart a low quarter and a high quarter sit once you get to the 2000s, compared to how close together they were in the 1950s. In the steps ahead, you will take a model already fitted on exactly this series and turn it into a forecast, two different kinds of interval around that forecast, and a check on whether it actually beats the simple methods.

=== step === concept
## Fit the ETS model this lesson forecasts from

Fit `ETS()` on the whole Gas series, with no formula, so it searches out and picks all three letters itself.

```r
# Build the Gas series inline: Australia's quarterly natural gas production
# in petajoules, 1956 Q1 to 2010 Q2, 218 real quarters
library(fable)
library(fabletools)
library(tsibble)
library(dplyr)

gas <- tsibble(
  Quarter = yearquarter("1956 Q1") + 0:217,
  Gas = c(5,6,7,6,5,7,7,6,5,7,8,6,5,7,8,6,6,8,8,7,6,7,8,6,6,8,8,7,6,8,9,7,6,8,9,7,
          6,8,9,7,6,8,10,7,6,9,10,7,6,9,11,8,7,10,13,11,12,18,23,20,19,23,28,24,
          24,34,40,35,34,41,48,39,38,48,52,43,39,49,55,47,44,58,65,54,49,64,74,
          58,56,71,78,65,59,74,88,71,68,91,103,83,88,110,120,101,93,116,127,98,
          92,118,124,104,97,116,130,111,103,120,132,107,98,127,137,112,106,130,
          158,123,116,137,157,125,117,149,175,139,125,152,161,123,111,141,160,
          125,117,151,175,129,116,149,163,138,127,159,184,147,131,167,181,145,
          133,162,184,146,135,171,183,151,141,174,191,157,145,182,198,165,164,
          199,213,173,177,205,218,185,166,204,228,186,172,204,232,188,173,215,
          227,190,170,206,221,180,171,224,233,192,187,234,245,205,194,229,249,
          203,196,238,252,210,205,236),
  index = Quarter
)
gas_fit <- gas |> model(ETS(Gas))
report(gas_fit)
#> Series: Gas 
#> Model: ETS(M,A,M) 
#>   Smoothing parameters:
#>     alpha = 0.6528545 
#>     beta  = 0.1441675 
#>     gamma = 0.09784922 
#> 
#>   Initial states:
#>      l[0]       b[0]      s[0]    s[-1]    s[-2]     s[-3]
#>  5.945592 0.07062881 0.9309236 1.177883 1.074851 0.8163427
#> 
#>   sigma^2:  0.0032
#> 
#>      AIC     AICc      BIC 
#> 1680.929 1681.794 1711.389 
```

`ETS()` picked ETS(M,A,M): multiplicative error, additive trend, multiplicative season. alpha = 0.653 says the level updates fast on new data. beta = 0.144 says the trend updates more slowly. gamma = 0.098 says the seasonal pattern barely moves from one year to the next.

`gas_fit` is now the one object every later step forecasts from, plots, checks and benchmarks.

=== step === concept
## What forecast(h = ) actually returns

With `gas_fit` in hand, the next step is the whole point of fitting it: turning it into a forecast. In fable, that is one function call: `forecast()`, with `h` telling it how far out to go.

```r
# Forecast 2 years ahead from the fitted model. Quarterly data, so h = "2 years" means 8 quarters
fc <- gas_fit |> forecast(h = "2 years")
print(fc, width = Inf)
#> # A fable: 8 x 4 [1Q]
#> # Key:     .model [1]
#>   .model   Quarter          Gas .mean
#>   <chr>      <qtr>       <dist> <dbl>
#> 1 ETS(Gas) 2010 Q3  N(259, 218)  259.
#> 2 ETS(Gas) 2010 Q4  N(214, 243)  214.
#> 3 ETS(Gas) 2011 Q1  N(201, 329)  201.
#> 4 ETS(Gas) 2011 Q2  N(242, 699)  242.
#> 5 ETS(Gas) 2011 Q3 N(263, 1210)  263.
#> 6 ETS(Gas) 2011 Q4 N(217, 1108)  217.
#> 7 ETS(Gas) 2012 Q1 N(204, 1279)  204.
#> 8 ETS(Gas) 2012 Q2 N(246, 2379)  246.
```

The result is called a fable: one row per future quarter, running from 2010 Q3 to 2012 Q2. The `.mean` column is the single point forecast for that quarter, the number you would quote if someone asked for one figure.

The `Gas` column still carries the series' own name, but it no longer holds plain numbers. It holds a distribution for each quarter, printed as `N(259, 218)`: a normal distribution with mean 259 and variance 218. That distribution is where every interval in this lesson comes from.

`autoplot()` reads that same fable and draws the point forecast path stretching on from the real series.

```r
# Extend the plotted series with the point-forecast path
fc |> autoplot(gas)
```

=== step === concept
## Confidence intervals and prediction intervals: the difference a forecast needs

Every one of those distributions in the `Gas` column is where a forecast's interval comes from. But before building one, it helps to be precise about which of two kinds of interval a forecast actually needs.

A **confidence interval** bounds the mean of a fitted line: how sure you are about the average value at a given point. A **prediction interval** bounds one new, individual value: where a single future observation could land. The prediction interval is always the wider of the two, because on top of the uncertainty about the mean, it also has to carry the actual noise around that mean.

A forecast is never about the average of many future quarters. It is about what one specific quarter, say 2010 Q3, will actually turn out to be. So a forecast always needs a prediction interval, never a confidence interval.

The widget below is not the gas series. It is a small made-up linear regression demo, but it shows exactly this distinction. Slide the sample size n up, and watch the green confidence band and the orange prediction band behave completely differently.

::widget regression-intervals {}

Push n up and the green confidence band collapses onto the line, because more data pins down the mean more precisely. The orange prediction band barely narrows, because a single new point still carries the same amount of noise no matter how much data you have. That's why `forecast(gas_fit, h = "2 years")` hands you the wider kind of interval: you are not trying to pin down the average gas production two years out, you are trying to bound one actual future quarter's number.

=== step === concept
## How ETS turns its state space form into a prediction interval

ETS builds its prediction interval straight out of its state space form. For every horizon `h` ahead, the model works out an estimated standard deviation, call it sigma_h, under the assumption that the model's innovations, its own one-step errors, are normally distributed. That sigma_h is what sets how wide the interval is at that horizon.

`hilo()` turns a fable's distribution column into named lower and upper bounds, at whatever levels you ask for. `unpack_hilo()` then spreads those bounds into their own plain numeric columns, so they print cleanly.

```r
# Show the point forecast plus the 80% and 95% prediction intervals, quarter by quarter
fc |> hilo(level = c(80, 95)) |>
  unpack_hilo(c("80%", "95%")) |>
  as_tibble() |>
  select(Quarter, .mean, `80%_lower`, `80%_upper`, `95%_lower`, `95%_upper`) |>
  mutate(`95%_width` = `95%_upper` - `95%_lower`)
#> # A tibble: 8 × 7
#>   Quarter .mean `80%_lower` `80%_upper` `95%_lower` `95%_upper` `95%_width`
#>     <qtr> <dbl>       <dbl>       <dbl>       <dbl>       <dbl>       <dbl>
#> 1 2010 Q3  259.        240.        278.        230.        288.        57.8
#> 2 2010 Q4  214.        194.        234.        183.        245.        61.1
#> 3 2011 Q1  201.        178.        224.        165.        237.        71.1
#> 4 2011 Q2  242.        208.        276.        190.        294.       104. 
#> 5 2011 Q3  263.        218.        307.        195.        331.       136. 
#> 6 2011 Q4  217.        174.        260.        152.        282.       130. 
#> 7 2012 Q1  204.        158.        250.        134.        274.       140. 
#> 8 2012 Q2  246.        183.        308.        150.        341.       191.
```

Read the `95%_width` column: it grows from 57.8 in the very first forecast quarter to 191 in the last one, more than tripling over the two years. Gas production has a seasonal pattern layered on top of its trend, so that growth is not perfectly one quarter beating the last: the width at 2011 Q4 actually dips a little below the quarter before it. But the overall direction across the 8 quarters is unmistakable: the further out ETS forecasts, the less it knows, and each extra quarter compounds one more step of uncertainty on top of the last.

=== step === concept
## The simulation alternative: bootstrapping future paths from the fitted model

The interval you just read came from a formula that assumes normally distributed innovations. `generate()` gives you a way to check that assumption instead of trusting it: it draws entire simulated future paths from the fitted model, and you can measure their spread directly.

With `bootstrap = TRUE`, `generate()` builds each path by resampling gas_fit's own residuals, over and over, instead of drawing from a normal distribution. Whatever shape those residuals actually have, good or bad, the simulation carries it forward.

```r
# Simulate 1000 possible future paths by bootstrapping the model's own residuals
set.seed(2024)
sim <- gas_fit |> generate(h = "2 years", times = 1000, bootstrap = TRUE)
sim
#> # A tsibble: 8,000 x 4 [1Q]
#> # Key:       .model, .rep [1,000]
#>   .model   Quarter .rep   .sim
#>   <chr>      <qtr> <chr> <dbl>
#> 1 ETS(Gas) 2010 Q3 1      267.
#> 2 ETS(Gas) 2010 Q4 1      210.
#> 3 ETS(Gas) 2011 Q1 1      187.
#> 4 ETS(Gas) 2011 Q2 1      228.
#> 5 ETS(Gas) 2011 Q3 1      249.
#> 6 ETS(Gas) 2011 Q4 1      201.
#> # ℹ 7,994 more rows
```

`sim` holds 1,000 separate 8-quarter paths, 8,000 rows in total. Take the middle 95% of the 1,000 simulated values at the final quarter, 2012 Q2, and compare it with the analytic interval from the same quarter in the table above.

```r
# Middle 95% of the 1000 simulated values at the final quarter, 2012 Q2
sim |>
  filter(Quarter == max(Quarter)) |>
  pull(.sim) |>
  quantile(c(0.025, 0.975))
#>     2.5%    97.5% 
#> 164.4667 349.3536 
```

The bootstrap interval at that quarter runs from about 164 to 349. The analytic one from the table above ran from 150 to 341. They land close to each other, close enough that either one would lead you to roughly the same conclusion about how uncertain that far-out quarter really is.

Now look at a handful of the simulated paths against the point forecast.

```r
# Draw 5 of the 1000 simulated paths over the point forecast
library(ggplot2)
gas |>
  filter_index("2005 Q1" ~ .) |>
  ggplot(aes(x = Quarter, y = Gas)) +
  geom_line() +
  geom_line(data = sim |> filter(.rep %in% c("1", "2", "3", "4", "5")),
            aes(y = .sim, colour = .rep)) +
  labs(y = "Gas production (petajoules)") +
  guides(colour = "none")
```

Each coloured line is one complete guess at how the next 8 quarters could unfold, all starting from the same fitted model, all fanning out a little differently because each one resampled the residuals in a different order.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The analytic interval from the state space form, since it is built straight from the fitted model's own parameters. ::no It is exactly the opposite: the analytic interval comes from a formula that assumes the model's innovations are normally distributed.
- The simulated interval from generate(), since it resamples the model's own past residuals instead of assuming any particular shape for them. ::ok Right. Bootstrapping draws real leftover residuals over and over, whatever shape they actually have, instead of assuming they are normal.
- Neither needs it, both intervals assume the residuals are normally distributed. ::no Only the analytic one makes that assumption. The whole point of bootstrapping the residuals is to avoid it.

=== step === concept
## Reading the fitted states with components() and autoplot()

`gas_fit` did not just produce a forecast, it also kept track of the level, trend and season paths that explain the historical data. `components()` pulls those out as their own columns, one row per historical quarter.

```r
# Break the fitted model into its level, trend and season paths
comp <- components(gas_fit)
comp
#> # A dable: 222 x 7 [1Q]
#> # Key:     .model [1]
#> # :        Gas = (lag(level, 1) + lag(slope, 1)) * lag(season, 4) * (1 +
#> #   remainder)
#>    .model   Quarter   Gas level    slope season remainder
#>    <chr>      <qtr> <dbl> <dbl>    <dbl>  <dbl>     <dbl>
#>  1 ETS(Gas) 1955 Q1    NA NA    NA        0.816   NA     
#>  2 ETS(Gas) 1955 Q2    NA NA    NA        1.07    NA     
#>  3 ETS(Gas) 1955 Q3    NA NA    NA        1.18    NA     
#>  4 ETS(Gas) 1955 Q4    NA  5.95  0.0706   0.931   NA     
#>  5 ETS(Gas) 1956 Q1     5  6.09  0.0863   0.818    0.0181
#>  6 ETS(Gas) 1956 Q2     6  5.79  0.00105  1.06    -0.0958
#>  7 ETS(Gas) 1956 Q3     7  5.89  0.0233   1.18     0.0267
#>  8 ETS(Gas) 1956 Q4     6  6.26  0.100    0.939    0.0901
#>  9 ETS(Gas) 1957 Q1     5  6.20  0.0646   0.815   -0.0387
#> 10 ETS(Gas) 1957 Q2     7  6.47  0.109    1.07     0.0495
#> # ℹ 212 more rows
```

The formula in the comment tells you exactly how these columns combine: each Gas value is last quarter's level plus last quarter's slope, multiplied by the matching quarter's season factor from a year earlier, then nudged by the remainder. `autoplot()` stacks all of it into one picture.

```r
# Stack the level, trend and season paths into one plot
comp |> autoplot()
```

The level climbs for the whole five and a half decades, matching the rising trend you saw in the cover chart. The slope (labelled trend in the plot) sits close to flat throughout, since beta = 0.144 lets it move but only slowly. The season factors repeat the same shape every four quarters, values like 0.816 and 1.18 that never drift far from 1: they don't grow on their own. It's multiplying those steady season factors against the ever-rising level that produces the widening swing you saw back in the cover chart.

=== step === concept
## Checking whether the residuals behave like noise

A forecast is only as trustworthy as the residuals behind it. A healthy set of residuals should average out near 0, show no leftover pattern over time, and carry no significant autocorrelation. `gg_tsresiduals()` draws a residual time plot, its ACF, and a histogram together, so you can check the first two by eye.

```r
# Look at the residual diagnostics: time plot, ACF, and histogram together
library(feasts)
gg_tsresiduals(gas_fit)
```

For the mean and the autocorrelation, pull the actual numbers instead of relying on the eye alone.

```r
# Check the mean of the innovation residuals, and test for autocorrelation at lag 8, the seasonal period
resid_aug <- augment(gas_fit)
mean(resid_aug$.innov, na.rm = TRUE)
#> [1] 0.005015235

lb <- resid_aug |> features(.innov, ljung_box, lag = 8)
lb
#> # A tibble: 1 × 3
#>   .model   lb_stat lb_pvalue
#>   <chr>      <dbl>     <dbl>
#> 1 ETS(Gas)    33.2 0.0000567
```

The mean residual is 0.005, close enough to 0 to count as no leftover bias. The Ljung-Box p-value, though, is 0.0000567, far below the usual 0.05 cutoff. That means the test does find real autocorrelation left in the residuals: strictly speaking, they are not pure noise.

[NOTE]
This is not a contradiction with ETS being a good model. With 218 quarters of data, the Ljung-Box test has enough power to flag even a small amount of leftover structure, structure too faint to matter much for the forecast itself. A model can still be the most accurate one available and fail this test at the same time. What it tells you is that gas_fit has not squeezed out every last drop of pattern, not that its forecasts are worthless.

=== step === concept
## Setting up a held-out test window and three benchmark methods

`forecast(gas_fit, h = "2 years")` reaches past 2010 Q2, the last real quarter on record, into territory nobody has measured yet. There is nothing to check it against.

To actually score a forecast, you need quarters whose real values are already known but were held back from fitting. `filter_index()` splits the series that way: the last 8 real quarters become `gas_test`, and everything before that becomes `gas_train`.

```r
# Hold out the last 8 real quarters as gas_test, keep the rest as gas_train
gas_train <- gas |> filter_index(. ~ "2008 Q2")
gas_test <- gas |> filter_index("2008 Q3" ~ .)
gas_test
#> # A tsibble: 8 x 2 [1Q]
#>   Quarter   Gas
#>     <qtr> <dbl>
#> 1 2008 Q3   249
#> 2 2008 Q4   203
#> 3 2009 Q1   196
#> 4 2009 Q2   238
#> 5 2009 Q3   252
#> 6 2009 Q4   210
#> 7 2010 Q1   205
#> 8 2010 Q2   236
```

`gas_train` holds the first 210 quarters. `gas_test` holds these last 8, from 2008 Q3 to 2010 Q2, plotted below.

::widget chart-plotter {"data":[{"x":2008.50,"y":249},{"x":2008.75,"y":203},{"x":2009.00,"y":196},{"x":2009.25,"y":238},{"x":2009.50,"y":252},{"x":2009.75,"y":210},{"x":2010.00,"y":205},{"x":2010.25,"y":236}],"geoms":["line","bar"],"x":"Year","y":"Gas"}

The next step fits ETS, plus three simple benchmarks, on `gas_train` alone, and forecasts exactly these 8 quarters so every method can be judged against what actually happened.

=== step === concept
## Benchmarking the ETS forecast against the baselines with accuracy()

A forecasting model earns its keep only if it beats a simple method. If it can't do better than a plain benchmark, the simple method is doing just as well for a fraction of the effort. Fit ETS alongside three of those simple benchmarks, all on `gas_train` only.

```r
# Fit ETS plus three simple benchmarks on the training quarters only
fits <- gas_train |> model(
  ETS = ETS(Gas),
  NAIVE = NAIVE(Gas),
  SNAIVE = SNAIVE(Gas),
  Drift = RW(Gas ~ drift())
)
fits
#> # A mable: 1 x 4
#>            ETS   NAIVE   SNAIVE         Drift
#>        <model> <model>  <model>       <model>
#> 1 <ETS(M,A,M)> <NAIVE> <SNAIVE> <RW w/ drift>
```

`NAIVE` just repeats the last training value forever. `SNAIVE` repeats the value from the same quarter one year back. `Drift`, fit here as `RW(Gas ~ drift())`, is a naive forecast with a straight-line trend added on. Forecast all four 8 quarters ahead, then score them against `gas_test` with `accuracy()`.

```r
# Score every method's forecast against the real held-out quarters. RMSE and MASE, smallest first
fcs <- fits |> forecast(h = 8)

accuracy(fcs, gas) |>
  select(.model, .type, RMSE, MASE) |>
  arrange(RMSE)
#> # A tibble: 4 × 4
#>   .model .type  RMSE  MASE
#>   <chr>  <chr> <dbl> <dbl>
#> 1 ETS    Test   4.58 0.739
#> 2 SNAIVE Test   6.60 1.05 
#> 3 NAIVE  Test  21.7  3.59 
#> 4 Drift  Test  23.6  3.66
```

RMSE is the plain root-mean-squared error, in petajoules, and ETS's 4.58 is by far the smallest. MASE scales that error against a naive one-step forecast's average error on the training data: a MASE under 1 means the method beat that plain benchmark, over 1 means it lost to it. ETS comes in at 0.739, comfortably under 1. SNAIVE, at 1.05, is a close second but just barely loses to the benchmark. NAIVE and Drift, at 3.59 and 3.66, are far behind. On this held-out window, ETS clearly wins.

=== step === quiz
## Quick check: reading the accuracy table

Suppose a different method, on this same test window, came back with a MASE of 1.2. What does that number tell you?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Its average forecast error is 1.2 times the size of a naive one-step benchmark's average error on the training data, so it did worse than that benchmark. ::ok Exactly. MASE is a ratio against a naive one-step benchmark: under 1 beats it, over 1 loses to it.
- Its forecasts are about 1.2 percent worse than the benchmark's. ::no That confuses a ratio with a percentage. A MASE of 1.2 means 1.2 times the benchmark's error, not 1.2 percent worse.
- MASE cannot be compared across different forecasting methods, so the number alone tells you nothing. ::no MASE exists precisely so it can be compared, across methods and across series, since it is always scaled against the same kind of naive one-step benchmark.

=== step === tryit
## Your turn: read a fitted ETS model's residuals and its accuracy

Both numbers you need are already on the page: the Ljung-Box p-value for `gas_fit`'s residuals, and the accuracy table from the step before last.

```r
# Two numbers are already on the page: the Ljung-Box p-value for gas_fit's
# residuals, and the accuracy table benchmarking ETS against the baselines.
lb_pvalue <- 0.0000567
accuracy_table <- data.frame(
  model = c("ETS", "SNAIVE", "NAIVE", "Drift"),
  MASE  = c(0.739, 1.05, 3.59, 3.66)
)
print(lb_pvalue)
print(accuracy_table)

# Your turn: replace the blanks below with the right answer, then press Check.
# residuals_look_like_noise <- "___"   (use "yes" or "no")
# lowest_mase_model <- "___"           (use the model name)
```
::check {"regex": "(?=[\\s\\S]*residuals_look_like_noise\\s*<-\\s*\"no\")(?=[\\s\\S]*lowest_mase_model\\s*<-\\s*\"ETS\")", "gate": true, "difficulty": "beginner", "ok": "Right on both counts. A p-value of 0.0000567 is far below 0.05, so the residuals do carry some real autocorrelation, and ETS's 0.739 is the lowest MASE in the table.", "no": "Look at the two numbers already printed above: is 0.0000567 above or below the usual 0.05 cutoff, and which model in accuracy_table has the smallest MASE?"}
::solution
```r
# Fill in both answers using the numbers already printed above
residuals_look_like_noise <- "no"
lowest_mase_model <- "ETS"
```

=== step === concept
## References
::prose-only a references list, nothing left to visualize

- [Forecasting: Principles and Practice, chapter 8: Exponential smoothing](https://otexts.com/fpp3/expsmooth.html) - Hyndman, R.J. & Athanasopoulos, G. (3rd ed., OTexts, 2021).
- [Forecasting with Exponential Smoothing: The State Space Approach](https://doi.org/10.1007/978-3-540-71918-2) - Hyndman, R.J., Koehler, A.B., Ord, J.K. & Snyder, R.D. (Springer, 2008).
- [fable package reference documentation](https://cran.r-project.org/package=fable) - ETS(), forecast(), generate(), components().
- [tsibbledata package reference documentation](https://cran.r-project.org/package=tsibbledata) - the aus_production dataset this lesson's numbers come from.
- [Another look at measures of forecast accuracy](https://doi.org/10.1016/j.ijforecast.2006.03.001) - Hyndman, R.J. & Koehler, A.B., International Journal of Forecasting 22(4), 2006.

=== step === complete
## Quick recap

You took a fitted ETS model all the way to a checked, benchmarked forecast. Fit the model once, then call `forecast(h = )` to get a point forecast and a distribution for every future quarter. Read the interval around that point forecast two ways: analytically from the state space form, or by bootstrapping simulated paths with `generate()`, and saw them land close together. `components()` showed you the level, trend and season paths behind the forecast, and the Ljung-Box test gave you an honest read on whether the residuals still carry pattern. Last, you held out real quarters, fit ETS next to three simple benchmarks, and let `accuracy()` say which one actually won.

That's the whole workflow: fit, forecast, check the interval, check the residuals, and never trust a model over a simple baseline until `accuracy()` says it beats it.
