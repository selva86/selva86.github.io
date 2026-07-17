---
title: "Time Series Decomposition in R: STL vs Classical"
slug: "Time-Series-Decomposition-in-R"
description: "Decomposition splits a time series into trend, seasonal and remainder. Compare STL and classical decomposition in R on real data, and see which to use."
keywords: "time series decomposition in R, STL decomposition R, classical decomposition R, decompose in R, stl in R, seasonal adjustment R, trend seasonal remainder, additive vs multiplicative decomposition"
auto_link_terms: "time series decomposition|decompose a time series|decomposition|STL decomposition|classical decomposition|seasonal component|trend component|remainder component|seasonally adjusted|seasonal adjustment|additive decomposition|multiplicative decomposition|seasonal index|seasonal pattern"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.4"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Time Series Decomposition"
sidebar_order: 8
difficulty: "Intermediate"
---

<p class="lead">Time series decomposition splits a series into three parts you can study on their own: a slow-moving trend, a seasonal pattern that repeats every year, and a remainder that holds whatever is left over. R gives you two functions for the job. <code>decompose()</code> runs the classical method, a moving average plus one fixed seasonal shape. <code>stl()</code> runs the modern method, built on loess, which keeps a trend value at every month and can let the seasonal shape change from year to year. This post runs both on real data and shows exactly when to reach for each.</p>

The whole post works with `AirPassengers`, a series that ships with R. It holds 144 numbers: the monthly total of international airline passengers, in thousands, from January 1949 to December 1960. If you have never met a `ts` object (a series stamped with a start date and a `frequency`, here 12 months per year), the [Time Series Objects in R](Time-Series-Objects-in-R.html) post is the one-page primer. Everything else you need is defined as we go.

## Was July 1960 the airline's best month ever?

July 1960 is the busiest month in the record: 622, meaning 622,000 passengers. That single number is the 139th value in the series, `AirPassengers[139]`. A fair question is how much of that 622 was real growth (a decade of the airline getting bigger), how much was simply that people fly in July, and how much was neither. Decomposition answers exactly that, by splitting the 622 into a trend part, a seasonal part, and a remainder part.

Here is the split, before any explanation of how it is computed. `stl()` builds the decomposition; it works on an additive scale, so we hand it `log(AirPassengers)` and read the parts back as multipliers with `exp()`. The next section makes the log step precise; for now, watch what comes out.

```r title="Split the record month into its three parts"
# AirPassengers[139] is July 1960: 622 (thousand passengers),
# the largest month in the 1949 to 1960 record.
fit <- stl(log(AirPassengers), s.window = "periodic")

round(exp(fit$time.series[139, ]), 4)   # the trend, seasonal and remainder for July 1960
#>  seasonal     trend remainder
#>    1.2416  474.0762    1.0567
prod(exp(fit$time.series[139, ]))       # multiply the three parts back together
#> [1] 622
```

Read it as a product. The trend was at 474.08 (thousand): that is where a decade of growth had carried the underlying level by mid-1960. The seasonal multiplier for July is 1.2416, so being July lifts the level by about 24 percent. The remainder is 1.0567, a further 5.7 percent that neither the trend nor the season accounts for. Multiply them, `474.08 * 1.2416 * 1.0567`, and you are back to the 622 you started with. Most of the record was the trend; July added roughly a quarter on top; a small amount was left unexplained.

`fit$time.series` holds those three parts for every month, not just July. Plot the fitted object to see all four panels at once.

```r title="The whole decomposition in four panels"
plot(fit)   # top: the data; then trend, seasonal, remainder (all in log units)
```

You get four stacked panels sharing one time axis: the original (logged) series on top, then the trend climbing steadily, then the seasonal pattern repeating with the same summer peak every year, then the remainder wobbling around zero. The grey bars on the right of each panel show the relative scale, so you can see at a glance that the trend and seasonal parts are large and the remainder is small.

## Additive or multiplicative: which model fits?

Before trusting any decomposition you have to settle one choice: do the three parts **add** together or **multiply** together? Written out, the two models are

<p>Additive: \( y_t = T_t + S_t + R_t \)</p>
<p>Multiplicative: \( y_t = T_t \times S_t \times R_t \)</p>

where \( y_t \) is the observed value at month \( t \), \( T_t \) is the trend, \( S_t \) is the seasonal part, and \( R_t \) is the remainder. In the additive model the seasonal swing is a fixed **size** (say, always about 50 thousand above the trend in July). In the multiplicative model the swing is a fixed **percentage** (say, always about 24 percent above the trend), so the swing in passengers grows as the series grows.

You can tell the two apart by eye, and with one line of code. If the size of the yearly up-and-down grows as the overall level rises, the series is multiplicative. Measure the swing directly as the gap between the busiest and quietest month within each year: `tapply()` splits the passenger counts into one group per calendar year and applies `max(x) - min(x)` to each group.

```r title="Does the seasonal swing grow with the level?"
year  <- floor(time(AirPassengers))                       # the calendar year of each month
swing <- tapply(AirPassengers, year, function(x) max(x) - min(x))

swing[c("1949", "1954", "1960")]        # within-year peak-to-trough, three sample years
#> 1949 1954 1960
#>   44  114  232
```

In 1949 the gap between the biggest and smallest month was 44 thousand passengers. By 1960 the same gap was 232 thousand, more than five times wider, even though the shape of the year (summer high, winter low) never changed. A swing that grows with the level is the signature of a multiplicative series, so `AirPassengers` is multiplicative.

That is why the opening block took a `log()`. Logging turns a product into a sum:

<p>\( \log y_t = \log T_t + \log S_t + \log R_t \)</p>

so a multiplicative series becomes additive once you take logs. Any additive method, including `stl()`, then fits it correctly, and `exp()` converts the additive log-parts back into the multipliers we read earlier. The classical `decompose()` function has a multiplicative mode built in, so you can also ask for the seasonal effect directly as a set of monthly multipliers.

```r title="The seasonal effect as monthly multipliers"
decomp_m <- decompose(AirPassengers, type = "multiplicative")

round(decomp_m$figure, 2)               # one multiplier per month, January to December
#> [1] 0.91 0.88 1.01 0.98 0.98 1.11 1.23 1.22 1.06 0.92 0.80 0.90
```

Reading left to right, January is 0.91 (9 percent below the yearly trend), the July value (7th) is 1.23 (23 percent above, matching the 1.2416 from `stl()`), and November (11th) is 0.80 (20 percent below). Those twelve numbers are the seasonal shape.

![Diagram showing the record month 622 for July 1960 split into a trend of 474.08, a seasonal multiplier of 1.2416 and a remainder of 1.0567 that multiply back to 622, with a note that taking logs turns the multiplicative model into an additive one.](screenshots/Time-Series-Decomposition-in-R-anatomy.webp)

*The three parts of one observed value, and why logging lets an additive method fit a multiplicative series.*

## How does classical decomposition work, and where does it break?

`decompose()` is worth understanding step by step, because its two weaknesses fall straight out of how it is built. It runs four steps.

1. **Estimate the trend** with a centred moving average over a full year.
2. **Detrend** by dividing the data by the trend (or subtracting, if additive).
3. **Build one seasonal figure** by averaging all the Januarys together, all the Februarys together, and so on.
4. **Take the remainder** as whatever the trend and season do not explain.

The one step that looks like a black box is the first. For monthly data the trend is a 2x12 centred moving average: average each month with the eleven months around it, but give the two end months half weight so the twelve-month window sits centred on a single month. In symbols,

<p>\( \hat T_t = \dfrac{\tfrac{1}{2} y_{t-6} + y_{t-5} + \cdots + y_{t+5} + \tfrac{1}{2} y_{t+6}}{12}. \)</p>

You can reproduce it by hand with `stats::filter()` and check it against what `decompose()` returned.

```r title="Rebuild the classical trend by hand"
decomp <- decompose(AirPassengers)              # additive model, the default
w <- c(0.5, rep(1, 11), 0.5) / 12               # the 2x12 centred moving-average weights
trend_manual <- stats::filter(AirPassengers, w, sides = 2)

data.frame(manual    = round(as.numeric(trend_manual), 1),
           decompose = round(as.numeric(decomp$trend), 1))[5:9, ]
#>   manual decompose
#> 5     NA        NA
#> 6     NA        NA
#> 7  126.8     126.8
#> 8  127.2     127.2
#> 9  128.0     128.0
```

From month 7 on, the two columns agree to the decimal: `decompose()`'s trend is exactly that moving average, nothing hidden. The moving average also explains the `NA`s. The window needs six months on each side of the month it is centred on, and the first month of the series has nothing to its left, so no trend can be computed there. The same is true at the very end. That is limit one, and it is easy to see directly.

```r title="The classical trend is undefined at both ends"
head(decomp$trend, 8)     # first year: no trend for the first six months
tail(decomp$trend, 8)     # last year: no trend for the last six months
#>           Jan      Feb      Mar      Apr      May      Jun      Jul      Aug
#> 1949       NA       NA       NA       NA       NA       NA 126.7917 127.2500
#>           May      Jun      Jul      Aug      Sep      Oct      Nov      Dec
#> 1960 472.7500 475.0417       NA       NA       NA       NA       NA       NA
```

The trend is missing for the first six and last six months. Those missing values are exactly why the opening section used `stl()` rather than `decompose()` to split July 1960: the classical method has no trend value there at all, because July 1960 is inside the last six months.

The second limit comes from step 3. The seasonal figure is one set of twelve numbers, reused for every year, so a given month gets an identical seasonal effect in 1949 and in 1960.

```r title="Every year gets the exact same seasonal figure"
c(Jul1949 = decomp$seasonal[7], Jul1960 = decomp$seasonal[139])
#>  Jul1949  Jul1960
#> 63.83081 63.83081
identical(decomp$seasonal[7], decomp$seasonal[139])
#> [1] TRUE
```

July 1949 and July 1960 are handed the same additive effect, +63.83 thousand, down to the last digit. If the seasonal pattern actually strengthened over the decade, classical decomposition cannot show it, because by construction the season is frozen. The centred moving average is covered on its own in [Moving Averages in R](Moving-Averages-in-R.html); here it is enough to know it is what produces the trend and the two `NA` ends.

![Diagram of the four steps of classical decomposition: a 2x12 centred moving average for the trend which costs six months at each end, detrending, one reused seasonal index that cannot change across years, and the remainder.](screenshots/Time-Series-Decomposition-in-R-classical-steps.webp)

*The four steps of `decompose()`. The two side-costs, missing ends and a frozen season, are consequences of steps 1 and 3.*

## What does STL do differently?

STL stands for "Seasonal and Trend decomposition using Loess". Instead of one moving average and one averaged seasonal figure, it estimates both the trend and the season with **loess**, a smoother that fits a small local regression line through each neighbourhood of points and slides that window along. Two properties follow from that design, and both fix a classical limit. First, loess extends all the way to the edges of the data, so STL returns a trend at every month with no `NA` ends. Second, STL estimates the seasonal shape from a controllable number of years, so it can let that shape change.

The `fit` object from section 1 is already an STL decomposition. Look inside it.

```r title="Inside the STL object: three columns"
head(round(fit$time.series, 3))   # fit is the stl() result from section 1, in log units
#>          seasonal trend remainder
#> Jan 1949   -0.092 4.829    -0.019
#> Feb 1949   -0.114 4.830     0.054
#> Mar 1949    0.016 4.831     0.036
#> Apr 1949   -0.014 4.833     0.040
#> May 1949   -0.015 4.835    -0.025
#> Jun 1949    0.110 4.838    -0.043
```

The three columns are the seasonal, trend and remainder, in log units because we fitted the log of the data. STL is additive only, which is the reason for the log: on the log scale a multiplicative series is additive, so the additive method is the correct one, and `exp()` reads any component back as a multiplier. Now check the ends, where classical was undefined.

```r title="STL keeps a trend at the final months"
round(tail(fit$time.series[, "trend"]), 3)    # last six months, in log units
#>        Jul   Aug   Sep   Oct   Nov   Dec
#> 1960 6.161 6.170 6.179 6.188 6.196 6.205
```

There is a trend value for every one of the last six months. The July 1960 entry, 6.161, is `log(474.08)`: exponentiate it and you get the 474.08 that section 1 used for the record month, the value classical decomposition could not supply. STL also takes a `robust = TRUE` argument that downweights one-off spikes so they do not distort the trend or season; the FAQ says when to switch it on.

## Can the seasonal pattern change over time?

This is the one idea that most separates the two methods. With STL, the argument `s.window` sets how many years of data are used to estimate the seasonal value for each month. Pass `"periodic"` and the seasonal shape is held identical for every year, exactly like classical. Pass a small odd number and the shape is free to drift from year to year. Watch July's multiplier under each setting.

```r title="Let the seasonal shape drift, or hold it fixed"
periodic <- fit$time.series[, "seasonal"]                        # s.window = "periodic" (section 1)
evolving <- stl(log(AirPassengers), s.window = 13)$time.series[, "seasonal"]

round(exp(evolving[cycle(evolving) == 7]), 3)   # July multiplier, 1949 to 1960: free to drift
round(exp(periodic[cycle(periodic) == 7]), 3)   # July multiplier, 1949 to 1960: held fixed
#> [1] 1.209 1.212 1.214 1.218 1.223 1.235 1.247 1.256 1.265 1.268 1.271 1.273
#> [1] 1.242 1.242 1.242 1.242 1.242 1.242 1.242 1.242 1.242 1.242 1.242 1.242
```

`cycle()` returns each month's position in the year (1 for January up to 12 for December), so `cycle(...) == 7` selects the twelve Julys. With `s.window = 13`, July's premium rises steadily from 1.209 in 1949 to 1.273 in 1960: air travel became a little more summer-heavy over the decade, and STL records that. With `"periodic"`, every July is pinned to 1.242, the same frozen behaviour classical gives you. A smaller `s.window` lets the season adapt faster; a larger one, or `"periodic"`, keeps it steadier. When you are unsure, start with `"periodic"` and only lower it if a seasonal plot shows the shape genuinely changing.

## How do you seasonally adjust a series?

Seasonal adjustment means removing the seasonal component so the trend and any real month-to-month movement are not hidden behind the yearly saw-tooth. It is the reason unemployment and retail-sales figures are reported "seasonally adjusted": nobody wants a December retail spike reported as economic growth. With the decomposition in hand, adjustment is one subtraction on the log scale, then `exp()` back to passengers.

```r title="Seasonally adjust: remove the seasonal component"
adjusted <- exp(log(AirPassengers) - fit$time.series[, "seasonal"])   # take the season out

round(window(cbind(observed = AirPassengers, adjusted = adjusted), c(1949, 7), c(1949, 12)), 1)
#>          observed adjusted
#> Jul 1949      148    119.2
#> Aug 1949      148    120.0
#> Sep 1949      136    127.1
#> Oct 1949      119    127.7
#> Nov 1949      104    128.8
#> Dec 1949      118    130.5
```

`window()` here just slices the two series down to the second half of 1949 so the table is short enough to read. July and August 1949 were the summer peaks at 148, and adjustment pulls them down to about 119 and 120, because a large part of 148 was just the season. November, a low month at 104, is pushed up to 128.8. The adjusted column no longer swings with the calendar; it rises gently from 119 to 130 across the half-year, which is the underlying level once July-ness and November-ness are taken out. Plotting the two makes the effect obvious.

```r title="Observed versus seasonally adjusted"
ts.plot(AirPassengers, adjusted, col = c("grey60", "firebrick"), lwd = c(1, 2),
        ylab = "passengers (thousands)")
legend("topleft", c("observed", "seasonally adjusted"),
       col = c("grey60", "firebrick"), lwd = c(1, 2), bty = "n")
```

The grey observed line keeps its yearly teeth; the red adjusted line follows the same overall climb but the teeth are gone, leaving a smooth rising level. If you use the `forecast` package, `seasadj(fit)` does this same subtraction for you in one call.

## STL vs classical: which should you use?

Everything above points to a short decision. Each row below rests on something already shown, not a new claim.

| Your situation | Reach for | Why (shown earlier) |
|---|---|---|
| You need the trend at the most recent months | `stl()` | the classical trend is `NA` in the last six months |
| The seasonal shape has changed over the years | `stl()` with a numeric `s.window` | classical reuses one frozen seasonal figure for every year |
| The series has spikes, strikes or one-off shocks | `stl(robust = TRUE)` | otherwise an outlier leaks into every year's seasonal figure |
| You want something simple and transparent | `decompose()` | four legible steps you can rebuild by hand |
| You need trading-day or Easter calendar effects | X-13ARIMA-SEATS (the `seasonal` package) | calendar effects need a dedicated model neither function has |

For most modern work `stl()` is the safe default, and `decompose()` remains the clearest way to learn what a decomposition is. The full path is below.

![Decision flowchart for choosing a decomposition method: use stl when you need the recent trend or the season has changed, stl with robust for shocks, X-13ARIMA-SEATS for calendar effects, and decompose otherwise.](screenshots/Time-Series-Decomposition-in-R-choose.webp)

*Choosing a method. `stl()` covers the common cases; `decompose()` is the teaching tool; specialist calendar effects need X-13ARIMA-SEATS.*

Decomposition is how you look at a series. When your next step is a model such as ARIMA that requires the trend and season **removed** rather than displayed, differencing is the usual tool, and [Test Stationarity in R](Test-Stationarity-in-R.html) covers how to decide how much of it you need. For the plots that reveal trend and seasonality in the first place, see [Visualize Time Series in R](Visualize-Time-Series-in-R.html).

## Frequently asked questions

**Why is my trend column full of `NA` values?** `decompose()` estimates the trend with a centred moving average, and the first and last six months of monthly data have no full window around them, so the trend is `NA` there. It is not an error. If you need a trend at the ends, use `stl()`, whose loess reaches the edges of the data.

**Why does `stl()` only do additive decomposition?** Loess adds a smooth curve to a series and has no multiplicative mode. For a multiplicative series (one whose swing grows with the level) you decompose `log(y)` instead: logs turn products into sums, so an additive fit on the log is a multiplicative fit on the original. Read the components back with `exp()` to see them as multipliers.

**What number should `s.window` be?** It sets how many years STL uses to estimate each month's seasonal value. `"periodic"` holds the seasonal shape identical for all years; a small odd number such as 7, 11 or 13 lets it drift, with smaller values drifting faster. A sensible default is `"periodic"`, lowered only if the seasonal shape is visibly changing over time.

**When do I need `robust = TRUE`?** Turn it on when the series has one-off shocks, such as a strike or a data glitch, that you do not want to bend the trend or contaminate the seasonal figure. The robust option downweights those outliers so they land in the remainder instead of leaking into the other components.

**Does a large remainder mean the decomposition failed?** No. The remainder is only what the trend and season do not account for, so a noisy series will always leave a bigger remainder than a smooth one, and that is expected, not an error. What matters is whether the remainder still holds visible pattern: if you plot it and see leftover trend or a repeating seasonal shape, the model is wrong (often additive where it should be multiplicative, or a seasonal window that is too rigid). A remainder that looks like patternless scatter, even a sizeable one, is exactly what you want.

**Does decomposition need a stationary series?** No. Decomposition is how you see the trend and seasonality; a stationarity test and differencing are how you remove them for a model like ARIMA. They are complementary steps, not alternatives.

**Can I decompose data with more than one seasonal period?** Base `stl()` handles a single seasonal period. For data with several cycles at once, such as hourly readings that repeat both daily and weekly, use `forecast::mstl()` or a `tsibble` with `feasts::STL()`, specifying a window for each period.

## Summary

| Point | What to remember |
|---|---|
| The three parts | An observed value is a trend, a seasonal part and a remainder, combined additively (`y = T + S + R`) or multiplicatively (`y = T x S x R`). |
| Choosing the model | If the seasonal swing grows with the level, the series is multiplicative; decompose `log(y)` and read the parts back with `exp()`. |
| `decompose()` | Classical: a 2x12 moving-average trend and one frozen seasonal figure. Simple and transparent, but the trend is `NA` at both ends and the season cannot change. |
| `stl()` | Loess-based: a trend at every month and a seasonal shape that `s.window` can hold fixed (`"periodic"`) or let drift (a numeric span). Additive only, so log a multiplicative series first. |
| Seasonal adjustment | Subtract the seasonal component (`exp(log(y) - seasonal)`) to see the underlying level without the yearly saw-tooth. |
| Default choice | Reach for `stl()` in practice; keep `decompose()` for learning and for perfectly simple, stable seasonality. |

## References

1. Hyndman, R.J. & Athanasopoulos, G., *Forecasting: Principles and Practice* (3rd ed.), [Time series components](https://otexts.com/fpp3/decomposition.html). The clearest free treatment of the trend/seasonal/remainder model.
2. Hyndman & Athanasopoulos, [STL decomposition](https://otexts.com/fpp3/stl.html). What loess is doing and how to choose the STL windows.
3. Hyndman & Athanasopoulos, [Classical decomposition](https://otexts.com/fpp3/classical-decomposition.html). The moving-average method behind `decompose()`, and its known drawbacks.
4. R documentation, [`stl()`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/stl.html). Every argument, including `s.window`, `t.window` and `robust`.
5. R documentation, [`decompose()`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/decompose.html). The exact four-step classical algorithm used above.
6. R documentation, [`AirPassengers`](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/AirPassengers.html). The dataset used throughout this post.
7. Wikipedia, [Decomposition of time series](https://en.wikipedia.org/wiki/Decomposition_of_time_series). A concise overview of additive and multiplicative models and their history.
