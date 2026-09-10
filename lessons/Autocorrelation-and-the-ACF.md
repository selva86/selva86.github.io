---
title: "Time Series Foundations Lesson 6: Autocorrelation and the ACF"
catalog_blurb: "Tell trend, season, and pure noise apart by reading one ACF plot."
description: "Learn the ACF in R: compute autocorrelation by hand, read the significance band, and tell trend, seasonal, and white noise apart with the Ljung-Box test."
keywords: "autocorrelation, ACF in R, autocorrelation function, Ljung-Box test, feasts ACF, white noise, lag correlation, significance band, time series R"
post_type: "LESSON"
curriculum_id: "5.10.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ts-foundations"
course_title: "Time Series Foundations"
course_lesson: "6"
course_total: "8"
course_landing: "Time-Series-Foundations-Course.html"
course_next: "Train-and-Test-Splits-for-Temporal-Data.html"
course_prev: "Seasonal-Subseries-and-Lag-Plots.html"
---

=== step === cover
## Autocorrelation and the ACF

Today let's understand autocorrelation and the ACF, using simple and practical examples.

Here is the running example for the whole lesson: quarterly beer production in Australia, from 1992 Q1 to 2010 Q2, in megalitres (a megalitre is a million litres). That's 74 quarters, published by the Australian Bureau of Statistics.

::widget chart-plotter {"data":[{"x":1,"y":443},{"x":2,"y":410},{"x":3,"y":420},{"x":4,"y":532},{"x":5,"y":433},{"x":6,"y":421},{"x":7,"y":410},{"x":8,"y":512},{"x":9,"y":449},{"x":10,"y":381},{"x":11,"y":423},{"x":12,"y":531},{"x":13,"y":426},{"x":14,"y":408},{"x":15,"y":416},{"x":16,"y":520},{"x":17,"y":409},{"x":18,"y":398},{"x":19,"y":398},{"x":20,"y":507},{"x":21,"y":432},{"x":22,"y":398},{"x":23,"y":406},{"x":24,"y":526},{"x":25,"y":428},{"x":26,"y":397},{"x":27,"y":403},{"x":28,"y":517},{"x":29,"y":435},{"x":30,"y":383},{"x":31,"y":424},{"x":32,"y":521},{"x":33,"y":421},{"x":34,"y":402},{"x":35,"y":414},{"x":36,"y":500},{"x":37,"y":451},{"x":38,"y":380},{"x":39,"y":416},{"x":40,"y":492},{"x":41,"y":428},{"x":42,"y":408},{"x":43,"y":406},{"x":44,"y":506},{"x":45,"y":435},{"x":46,"y":380},{"x":47,"y":421},{"x":48,"y":490},{"x":49,"y":435},{"x":50,"y":390},{"x":51,"y":412},{"x":52,"y":454},{"x":53,"y":416},{"x":54,"y":403},{"x":55,"y":408},{"x":56,"y":482},{"x":57,"y":438},{"x":58,"y":386},{"x":59,"y":405},{"x":60,"y":491},{"x":61,"y":427},{"x":62,"y":383},{"x":63,"y":394},{"x":64,"y":473},{"x":65,"y":420},{"x":66,"y":390},{"x":67,"y":410},{"x":68,"y":488},{"x":69,"y":415},{"x":70,"y":398},{"x":71,"y":419},{"x":72,"y":488},{"x":73,"y":414},{"x":74,"y":374}],"geoms":["line"],"x":"quarter_num","y":"Beer"}

Look at the line. It rises and falls again and again, and it never quite settles at one level for long. That raises the question this whole lesson answers: does each quarter's value actually depend on the quarters that came before it, or is that rise and fall just noise with no memory at all?

=== step === concept
## What autocorrelation asks: does a value depend on its own past?

Build that same series properly, as a tsibble, and you can start asking sharper questions of it than a single line chart can answer.

A lag is just "how many periods back". Lag 1 means one quarter earlier, lag 2 means two quarters earlier, and so on.

Autocorrelation asks a very specific question using that idea: does the value at time \(t\) depend on the value some lag \(k\) periods earlier, at time \(t-k\)? And the way you check that is not new at all. You already know how to check whether two things move together: correlation. Autocorrelation is nothing more than the ordinary Pearson correlation you already know, computed between a series and its own lagged copy.

Written with subscripts, autocorrelation at lag \(k\), called \(r_k\), is the correlation between \(y_t\) (the value now) and \(y_{t-k}\) (the value \(k\) periods earlier).

Here's the beer series built as a tsibble, with a new column holding each row's own lag-1 value next to it.

```r
# Build the quarterly beer tsibble and place each row next to its own lag-1 value
library(tsibble)
library(dplyr)

beer <- tsibble(
  Quarter = yearquarter("1992 Q1") + 0:73,
  Beer = c(443, 410, 420, 532, 433, 421, 410, 512, 449, 381, 423, 531, 426, 408, 416, 520,
           409, 398, 398, 507, 432, 398, 406, 526, 428, 397, 403, 517, 435, 383, 424, 521,
           421, 402, 414, 500, 451, 380, 416, 492, 428, 408, 406, 506, 435, 380, 421, 490,
           435, 390, 412, 454, 416, 403, 408, 482, 438, 386, 405, 491, 427, 383, 394, 473,
           420, 390, 410, 488, 415, 398, 419, 488, 414, 374),
  index = Quarter
)
beer <- beer |> mutate(Beer_lag1 = lag(Beer))

head(beer, 6)
#> # A tsibble: 6 x 3 [1Q]
#>   Quarter  Beer Beer_lag1
#>     <qtr> <dbl>     <dbl>
#> 1 1992 Q1   443        NA
#> 2 1992 Q2   410       443
#> 3 1992 Q3   420       410
#> 4 1992 Q4   532       420
#> 5 1993 Q1   433       532
#> 6 1993 Q2   421       433
```

Look at the `Beer_lag1` column. Row 2's value there, 443, is exactly row 1's `Beer` value. Every row's lag-1 column is just the row above its own `Beer` value, shifted down by one. The first row has nothing before it, so its lag is `NA` (not available).

That's all a lag is: the same series, copied and shifted down by \(k\) rows. Autocorrelation at lag \(k\) is just the correlation between the `Beer` column and this shifted copy.

=== step === concept
## The lag-k autocorrelation coefficient, computed by hand

You could hand `Beer` and `Beer_lag1` straight to R's `cor()` function and get something close to \(r_1\). That would work, roughly. But the actual formula behind ACF() is slightly more careful than that, and it's worth seeing why.

\[
r_k = \frac{\sum_{t=k+1}^{n}(y_t - \bar y)(y_{t-k} - \bar y)}{\sum_{t=1}^{n}(y_t - \bar y)^2}
\]

Here \(y_t\) is the value at time \(t\), \(\bar y\) is the mean of the whole series (all 74 quarters), and \(n\) is 74. The numerator multiplies each value's deviation from the mean by the deviation of the value \(k\) quarters earlier, and adds those products up over the \(n - k\) pairs that actually overlap once you shift by \(k\). The denominator, though, always sums the squared deviations over all \(n\) values, no matter what \(k\) is.

That fixed denominator is the detail worth noticing. It never changes as \(k\) changes, so \(r_1\), \(r_2\), all the way to \(r_{12}\), are divided by the exact same number. That's what makes different lags comparable to each other: every one of them is measured against the same total variance in the series, not each against its own private slice of it.

Compute \(r_1\) directly from that formula, on beer's full 74-quarter series, and compare it with what `cor()` gives when handed the two shifted vectors directly.

```r
# Compute r1 by hand from the formula, then compare with cor() on the two shifted vectors
y <- beer$Beer
n <- length(y)
ybar <- mean(y)

numerator   <- sum((y[2:n] - ybar) * (y[1:(n - 1)] - ybar))
denominator <- sum((y - ybar) ^ 2)
r1 <- numerator / denominator

r1_cor_naive <- cor(y[1:(n - 1)], y[2:n])

round(c(r1 = r1, r1_cor_naive = r1_cor_naive), 4)
#>           r1 r1_cor_naive 
#>      -0.1019      -0.1033 
```

`r1` comes out to -0.1019, which is what ACF() will report too, as you'll see in a moment. `r1_cor_naive` comes out slightly different, -0.1033. It isn't wrong exactly, it's just answering a subtly different question. `cor()` centres and scales each of the two vectors using only their own 73 values, not the full 74-quarter series. The ACF formula centres everything around the one mean of the whole series instead, and always divides by that same full-series sum of squares, which is exactly why ACF() can report every lag on one shared scale.

=== step === concept
## ACF() computes every lag at once, and where its significance band comes from

Computing \(r_1\) by hand once is useful, so you know exactly what the number means. But nobody recomputes \(r_2\) through \(r_{12}\) this way by hand every time. R's feasts package has a function, `ACF()`, that does the same computation at every lag in one call.

Run it on the beer tsibble out to lag 12, three full years of quarters.

```r
# Compute the autocorrelation at every lag from 1 to 12
library(feasts)

beer_acf <- beer |> ACF(Beer, lag_max = 12)
round(beer_acf$acf, 3)
#>  [1] -0.102 -0.657 -0.060  0.869 -0.089 -0.635 -0.054  0.832 -0.108 -0.574
#> [11] -0.055  0.774
```

The first value, -0.102, matches \(r_1\) computed by hand a moment ago. `ACF()` repeats that exact computation at every lag from 1 to 12, all divided by the same fixed denominator.

Twelve numbers on their own don't tell you much, though. Which of them count as real dependence, and which are just noise wandering around zero? For that you need a threshold, called the significance band.

If a series really were white noise, with no dependence on its own past at all, its sample autocorrelation at any lag would still wander a little away from zero just by chance, even though the true autocorrelation is exactly zero. The band \(\pm 2/\sqrt{n}\) marks the region that wandering would rarely leave, about 95% of the time, if the series truly had no autocorrelation. Here \(n\) is the number of observations, 74.

Compute that band for the 74-quarter beer series.

```r
# Compute the +-2/sqrt(n) significance band for n = 74
round(2 / sqrt(nrow(beer)), 4)
#> [1] 0.2325
```

So any \(|r_k|\) bigger than 0.2325 sits outside where pure noise would typically land, and is worth treating as real dependence rather than chance.

Chart all twelve lags as bars, coloured by whether each one falls inside or outside that band.

::widget chart-plotter {"data":[{"x":1,"y":-0.102,"fill":"inside band"},{"x":2,"y":-0.657,"fill":"outside band"},{"x":3,"y":-0.060,"fill":"inside band"},{"x":4,"y":0.869,"fill":"outside band"},{"x":5,"y":-0.089,"fill":"inside band"},{"x":6,"y":-0.635,"fill":"outside band"},{"x":7,"y":-0.054,"fill":"inside band"},{"x":8,"y":0.832,"fill":"outside band"},{"x":9,"y":-0.108,"fill":"inside band"},{"x":10,"y":-0.574,"fill":"outside band"},{"x":11,"y":-0.055,"fill":"inside band"},{"x":12,"y":0.774,"fill":"outside band"}],"geoms":["bar"],"x":"lag","y":"acf"}

Six of the twelve lags, every even one, land outside the band. Something is clearly going on in this series beyond pure chance. What that pattern actually means is exactly where the next few steps go.

=== step === quiz
## Quick check: does the hand-computed r_1 match ACF(), and is it real?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- -0.102 matches ACF()'s r_1, but since it is negative it counts as real dependence, not noise. ::no
- -0.102 matches ACF()'s r_1, and since it sits well inside the +-0.2325 band, it reads as noise, not real dependence. ::ok Right. The by-hand r1 (-0.1019) rounds to the same -0.102 ACF() reports, because both divide by the fixed whole-series sum of squares. And since |-0.102| is well under the 0.2325 band for n = 74, it is consistent with noise, not real dependence.
- -0.102 matches ACF()'s r_1, and since any nonzero correlation counts as dependence, it is real. ::no
- Computing cor() directly on the two shifted vectors gives -0.103, not -0.102, so the by-hand formula must be wrong somewhere. ::no Both numbers are correct, they just answer slightly different questions. The ACF formula divides by the sum of squared deviations of the whole series, so every lag shares one fixed denominator and stays comparable to every other lag. cor() instead centres and scales using only the two shifted vectors' own 73 values. Either way, -0.102 sits well inside the +-0.2325 band for n = 74, so it reads as noise, not real dependence.

=== step === concept
## A slow, one-way decay: what trend looks like in an ACF

Beer's ACF, so far, is just one shape. To learn to read ACF shapes in general, it helps to see a very different one next to it.

Here's a second real series: Australia's annual GDP, from 1960 to 2017, 58 years, measured in billions of dollars, originally published in `tsibbledata`'s `global_economy` dataset. Unlike beer, GDP has no season. It rises for most of the run, from 18.6 billion in 1960 up to a peak of 1,573.7 billion in 2013, before easing back to 1,323.4 billion by 2017.

Build the GDP tsibble and compute its ACF out to lag 10.

```r
# Build Australia's annual GDP tsibble and compute its ACF through lag 10
aus_gdp <- tsibble(
  Year = 1960:2017,
  GDP_b = c(18.6, 19.6, 19.9, 21.5, 23.8, 25.9, 27.3, 30.4, 32.7, 36.6, 41.3, 45.1, 52, 63.7,
            88.8, 97.1, 104.9, 110.2, 118.3, 134.7, 149.7, 176.6, 193.7, 177, 193.2, 180.2,
            182, 189, 235.7, 299.3, 310.8, 325.4, 324.9, 311.5, 322.2, 367.2, 400.3, 434.6,
            398.9, 388.4, 415, 378.2, 394.5, 466.3, 611.9, 692.6, 745.5, 852, 1052.6, 926.4,
            1144.3, 1394.3, 1543.4, 1573.7, 1465, 1349, 1208, 1323.4),
  index = Year
)

gdp_acf <- aus_gdp |> ACF(GDP_b, lag_max = 10)
data.frame(lag = 1:10, acf = round(gdp_acf$acf, 3))
#>    lag   acf
#> 1    1 0.945
#> 2    2 0.889
#> 3    3 0.818
#> 4    4 0.736
#> 5    5 0.643
#> 6    6 0.551
#> 7    7 0.467
#> 8    8 0.396
#> 9    9 0.340
#> 10  10 0.274

round(2 / sqrt(nrow(aus_gdp)), 4)
#> [1] 0.2626
```

Look at the shape of that column. It starts high, 0.945 at lag 1, and falls smoothly, lag after lag, all the way down to 0.274 at lag 10. It never dips to zero, never goes negative, and never bounces back up. It just fades, steadily, in one direction.

That shape is the signature of a trend. A trending series carries its level from one year almost unchanged into the next: if GDP was high last year, it is very likely to still be high this year, and only a little less certain to still be high 10 years from now. Nearby values stay strongly correlated, and that correlation only fades slowly as the gap between them grows.

=== step === concept
## A repeating peak and trough: what seasonality looks like in an ACF
::prose-only reads the twelve ACF bars already rendered two steps back, no new chart needed

GDP's ACF fades in one direction. Beer's ACF, from a few steps back, does something completely different.

Look back at those twelve numbers: -0.102, -0.657, -0.060, 0.869, -0.089, -0.635, -0.054, 0.832, -0.108, -0.574, -0.055, 0.774.

Notice the pattern in where the big numbers land. The peaks, the largest positive values, sit at lags 4, 8 and 12: 0.869, 0.832 and 0.774. The troughs, the largest negative values, sit at lags 2, 6 and 10: -0.657, -0.635 and -0.574. Both sets are spaced exactly 4 lags apart.

That spacing is not a coincidence. Beer production is measured quarterly, and 4 quarters make one year. A quarter's value stays close to the same quarter a year earlier (lag 4, lag 8, lag 12: strong positive correlation) and sits furthest from the opposite quarter two quarters away (lag 2, lag 6, lag 10: strong negative correlation), because a quarter that runs high every year sits opposite a quarter that tends to run low.

A repeating peak-and-trough pattern like this, spaced at a fixed number of lags, is the signature of seasonality. The spacing itself tells you the season length: beer repeats every 4 lags, so its season is 4 quarters, one year.

=== step === concept
## White noise: the shape when nothing is left to explain

You've now seen two real shapes: a slow one-way decay (trend) and a repeating peak-and-trough (seasonality). There's a third shape worth knowing, and it's the most important one of all, because it's the shape every other ACF gets compared against.

White noise is a series where every value is drawn independently, with nothing about one value telling you anything about the next: no trend, no season, no memory of any kind.

Simulate 100 independent values and compute their ACF out to lag 12, to see what pure independence looks like in practice.

```r
# Simulate 100 independent values and compute their ACF through lag 12
set.seed(123)
wn <- tsibble(idx = 1:100, value = rnorm(100), index = idx)

wn_acf <- wn |> ACF(value, lag_max = 12)
data.frame(lag = 1:12, acf = round(wn_acf$acf, 3))
#>    lag    acf
#> 1    1 -0.026
#> 2    2 -0.113
#> 3    3  0.149
#> 4    4 -0.094
#> 5    5 -0.013
#> 6    6  0.029
#> 7    7  0.013
#> 8    8 -0.025
#> 9    9 -0.076
#> 10  10 -0.027
#> 11  11  0.095
#> 12  12 -0.184

round(2 / sqrt(100), 4)
#> [1] 0.2
```

Every one of those twelve values sits between -0.184 and 0.149, well inside the \(\pm 0.2\) band for \(n = 100\). None of them show anything a trend or a season would produce: no steady one-way decay, no repeating spacing, just small numbers scattered on both sides of zero with no pattern.

That's what white noise looks like on an ACF: every bar inside the band, no shape to read at all. It's the reference point. When you look at a real series' ACF and ask whether anything is going on, this all-inside-the-band shape is the "no" answer you're comparing it against.

=== step === concept
## The Ljung-Box test: one number for "is this white noise overall?"

So far you've been reading ACF shapes by eye: does it decay steadily, does it repeat at a fixed spacing, does it sit inside the band everywhere. That works, but eyeballing twelve bars isn't a decision procedure. Sometimes you want one number that says, across several lags at once, whether a series behaves like white noise or not.

That number comes from the Ljung-Box test. It combines the squared autocorrelations from several lags into a single statistic, and tests the null hypothesis that the series is white noise up to that many lags. A small p-value means the series is not behaving like white noise: there's real dependence in there somewhere among those lags.

Run the Ljung-Box test at lag 8 on beer and on the simulated white-noise series from the last step, side by side.

```r
# Run the Ljung-Box test on beer and on the simulated white-noise series
library(fabletools)

beer_lb <- features(beer, Beer, ljung_box, lag = 8)
wn_lb   <- features(wn, value, ljung_box, lag = 8)

data.frame(series = c("beer", "white noise"),
           lb_stat = round(c(beer_lb$lb_stat, wn_lb$lb_stat), 3),
           lb_pvalue = round(c(beer_lb$lb_pvalue, wn_lb$lb_pvalue), 4))
#>        series lb_stat lb_pvalue
#> 1        beer 188.649    0.0000
#> 2 white noise   4.870    0.7714
```

Beer's Ljung-Box statistic comes out at 189, with a p-value that rounds to zero. That rejects the null hypothesis: beer is definitely not white noise, matching everything you already saw in its ACF, the strong seasonal peaks and troughs.

The simulated white-noise series gives a Ljung-Box statistic of 4.87, with p = 0.771. That p-value is nowhere near small, so there's no reason to reject the null here: this series behaves exactly like what it is, white noise, which also matches its ACF, every bar inside the band.

One number, one clean verdict, instead of eyeballing twelve bars each time.

=== step === widget
## Why it matters: what ignoring autocorrelation does to your intervals

Everything so far has been about spotting autocorrelation. Here's why it's worth spotting in the first place.

Ordinary regression and most standard confidence intervals assume the errors are independent of each other, one observation carrying no information about the next. Autocorrelation breaks that assumption directly: when errors are correlated with their own past, your data does not carry as much independent information as its raw count suggests.

The widget below runs that idea as an experiment. It fits many regressions on data built with a chosen amount of autocorrelation between the errors, and measures two things every time it runs: how often the model's 95% interval actually contains the true value, called coverage, and how good the fit looks, R-squared. It uses a fresh simulated regression, not the beer series itself, but the same coverage problem applies to any time series with real autocorrelation left in its errors, beer included.

::widget assumption-dial {"assumption": "autocorrelation"}

Drag the dial from independent to severe. Coverage, the share of intervals that actually contain the truth, collapses well below the nominal 95% as the errors become more strongly autocorrelated. Now watch R-squared while you do it: it does not get worse. If anything, it rises, because a smooth, slowly-drifting error series happens to flatter the fit at the exact same time it's destroying the interval.

That is the whole reason the checks from the last several steps matter. A model can look just as good, or even better, by its fit statistic, while the confidence interval built around it has become worthless. ACF and Ljung-Box are how you catch that before you trust an interval you shouldn't.

=== step === quiz
## Quick check: matching an ACF shape to what it means

Here's an ACF from a series you haven't seen yet: it decays smoothly toward zero across many lags, and it never once crosses into negative territory.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Seasonality: the ACF is repeating peaks and troughs at a fixed spacing. ::no
- White noise: every lag sits inside the significance band. ::no
- Trend: the series carries its level over almost unchanged from each period to the next, so the correlation only fades slowly and never crosses zero. ::ok Right. A smooth, one-directional decay that never dips negative and fades out only gradually, the shape Australia's GDP ACF showed, is a trend signature.
- It can't be told apart from white noise without running the Ljung-Box test. ::no A smooth, one-directional decay that never crosses into negative territory and fades out only gradually, like Australia's GDP ACF, is a trend: each period's level carries over almost unchanged from the one before it. Seasonality instead shows regularly spaced peaks and troughs, the way beer's ACF peaks every 4th lag. White noise shows every lag sitting inside the band, with no pattern to read at all. All three are visible by eye, no test required.

=== step === tryit
## Your turn: test a series for leftover autocorrelation

`aus_gdp`, the GDP tsibble from a few steps back, is still sitting in your session. Its ACF decayed slowly and never crossed zero, the trend shape. Now put a number on that: run the Ljung-Box test on it at lag 8, the same way you just saw done for beer and the white-noise series, and see whether it agrees with what the ACF already showed.

```r
# Test Australia's GDP series for leftover autocorrelation with the Ljung-Box test
# Call features() on aus_gdp, testing GDP_b with ljung_box at lag = 8
```
::check {"regex": "(?=[\\s\\S]*features[(])(?=[\\s\\S]*ljung_box)", "gate": true, "difficulty": "intermediate", "ok": "Right: lb_stat comes out at 254, with a p-value that rounds to zero, so the test rejects white noise for GDP too, matching that slow, never-crosses-zero ACF decay from a few steps back. And it ties back to the widget from two steps ago: if you fit a confidence interval to this series without accounting for that autocorrelation, its real coverage could sit well below the nominal 95% level, even though nothing about the fit itself would look wrong.", "no": "Call features() on aus_gdp, testing the GDP_b column with the ljung_box feature, at lag = 8: features(aus_gdp, GDP_b, ljung_box, lag = 8)."}
::solution
```r
# Test Australia's GDP series for leftover autocorrelation with the Ljung-Box test
features(aus_gdp, GDP_b, ljung_box, lag = 8)
#> # A tibble: 1 × 2
#>   lb_stat lb_pvalue
#>     <dbl>     <dbl>
#> 1    254.         0
```

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos, the free online textbook. Sections 2.8 and 2.9 cover the ACF and white noise; section 5.4 covers the Ljung-Box test used in this lesson.
- [feasts package reference](https://pkg.robjhyndman.com/feasts/) - documentation for ACF() and the ljung_box feature used inside features().
- Ljung, G.M. and Box, G.E.P., "On a Measure of Lack of Fit in Time Series Models", Biometrika (1978) - the paper the Ljung-Box test comes from.
- Australian Bureau of Statistics, catalogue 8301.0.55.001, table 1 - the source of the beer production series used throughout this lesson.
- [tsibbledata package reference](https://cran.r-project.org/package=tsibbledata) - documentation for the global_economy dataset behind Australia's GDP series.

=== step === complete
## Quick recap

- \(r_k\), the autocorrelation at lag \(k\), is the ordinary Pearson correlation of a series with its own lag-k self, computed from one fixed-denominator formula and reproduced exactly by ACF().
- The band \(\pm 2/\sqrt{n}\) marks which lags are real and which are noise. Beer's \(r_1\) sits inside it; six of its twelve lags sit outside.
- A smooth, one-directional decay in the ACF means trend, the shape GDP showed. A repeating peak-and-trough spaced at a fixed number of lags means seasonality, the shape beer showed, spaced at 4. Every bar inside the band means white noise, the shape the simulated series showed.
- The Ljung-Box test turns that whole shape into one p-value: close to zero rejects white noise, and nowhere near zero fails to reject it.
- A real, undetected autocorrelation does not make a model's fit look worse. It quietly breaks the confidence interval's coverage instead, while the fit statistic can even look a little better than it should.
