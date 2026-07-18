---
title: "Moving Averages in R: Simple, Weighted, and Exponential"
slug: "Moving-Averages-in-R"
description: "Learn to compute simple, weighted, and exponential moving averages in R. Smooth noisy time series, extract trends, and forecast with clear, runnable code."
keywords: "moving averages in R, simple moving average, weighted moving average, exponential moving average, rollmean, SMA EMA R, smoothing time series, moving average forecast"
auto_link_terms: "moving average|moving averages|simple moving average|weighted moving average|exponential moving average|moving average smoothing|rolling average|rolling mean|centered moving average|trailing moving average|moving average forecast|smooth a time series"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.6"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Moving Averages"
sidebar_order: 9
difficulty: "Intermediate"
---

<p class="lead">A moving average smooths a time series by replacing each point with the average of a small window of nearby values, so the underlying trend shows through the noise. This guide builds the three kinds you will actually meet, simple, weighted and exponential, from scratch in R, and shows when to reach for each.</p>

## What is a moving average, and why smooth a time series?

Real-world measurements wobble. Daily sales, river levels and sensor readings all jump from one step to the next, and those jumps hide the slower story underneath. A moving average is the simplest fix: slide a fixed-size window along the series and replace each point with the mean of the values inside that window. Here is the idea on ten noisy sales figures, smoothed with a three-point window.

```r title="Smooth a noisy series with a moving average"
sales <- c(10, 12, 9, 14, 11, 16, 13, 18, 15, 20)
library(zoo)
sma3 <- rollmean(sales, k = 3, fill = NA)
data.frame(sales, sma3)
#>    sales     sma3
#> 1     10       NA
#> 2     12 10.33333
#> 3      9 11.66667
#> 4     14 11.33333
#> 5     11 13.66667
#> 6     16 13.33333
#> 7     13 15.66667
#> 8     18 15.33333
#> 9     15 17.66667
#> 10    20       NA
```

The raw `sales` column zig-zags between 9 and 20. The `sma3` column is calmer: each smoothed value is the average of three neighbouring points, so single spikes get diluted. The `rollmean()` function from the `zoo` package did the sliding for us, and `fill = NA` marks the two ends where a full three-point window does not fit.

Nothing magic happened. To prove it, compute the second smoothed value by hand: it is just the mean of the first three sales.

```r title="Check one smoothed point by hand"
mean(sales[1:3])
#> [1] 10.33333
```

That matches `sma3[2]` exactly. A moving average is only ever this: pick a window size, average the values inside, then slide the window forward one step and repeat.

![A window sliding along a series, each window averaged into one point](screenshots/Moving-Averages-in-R-sliding-window.webp)

*Figure 1: A moving average slides a fixed window along the series, averaging each window into one smoothed point.*

Written as a formula, a simple moving average with window size $k$ is

$$\text{SMA}_t = \frac{x_{t-k+1} + x_{t-k+2} + \dots + x_t}{k}$$

where $x_t$ is the value at time $t$ and $k$ is how many points you average. If formulas are not your thing, skip it: the arithmetic in the code above is the whole idea.

[KEY INSIGHT]
**A moving average is just "average the last few points, then slide one step".** Everything else in this guide, the weights and the smoothing factor, only changes how much each point inside the window counts.

**Try it:** Smooth this short series with a 4-point trailing simple moving average and round the result to two decimals.

```r title="Your turn: a 4-point trailing average"
# Goal: average each point together with the three before it.
ex_series <- c(4, 8, 6, 10, 12, 9)
# Fill in the window size and the alignment, then round:
# ex_sma4 <- rollmean(ex_series, k = __, fill = NA, align = "____")
# round(ex_sma4, 2)      # target: NA NA NA 7.00 9.00 9.25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four-point trailing average solution"
ex_sma4 <- rollmean(ex_series, k = 4, fill = NA, align = "right")
round(ex_sma4, 2)
#> [1]   NA   NA   NA 7.00 9.00 9.25
```

**Explanation:** `align = "right"` tells `rollmean()` to end each window at the current point, so the first full 4-point window covers positions 1 to 4. The first three values are `NA` because a full window does not exist yet.

</details>

## How do you compute a simple moving average in R?

You just met `rollmean()`, but base R can do the same job, and one detail matters a lot: where the window sits relative to the point it produces. Let's cover both.

Base R ships `stats::filter()`, which multiplies each window by a set of coefficients. Give it `k` copies of `1/k` and `sides = 2` (a window centred on each point), and you get the same simple moving average.

```r title="Compute the same average with base R"
sma3_base <- as.numeric(stats::filter(sales, rep(1/3, 3), sides = 2))
round(sma3_base, 3)
#>  [1]     NA 10.333 11.667 11.333 13.667 13.333 15.667 15.333 17.667     NA
```

These are the same numbers as the very first block. Two tools, one result, which is reassuring: the moving average is a fixed recipe, not a package-specific trick.

[WARNING]
**The name filter() is shared by two packages.** If you load `dplyr`, its row-filtering `filter()` hides the time-series `stats::filter()`, and you get a confusing error. Write `stats::filter()` in full whenever you mean the moving-average version.

The word "centred" above is the detail that matters. A window can sit in three places relative to the point it fills: ending at it (trailing, `align = "right"`), centred on it (`align = "center"`), or starting at it (`align = "left"`). Trailing and centred are the two you will use, and they answer different questions.

```r title="Trailing versus centered alignment"
trailing <- rollmean(sales, k = 3, fill = NA, align = "right")
centered <- rollmean(sales, k = 3, fill = NA, align = "center")
data.frame(sales, trailing, centered)
#>    sales trailing centered
#> 1     10       NA       NA
#> 2     12       NA 10.33333
#> 3      9 10.33333 11.66667
#> 4     14 11.66667 11.33333
#> 5     11 11.33333 13.66667
#> 6     16 13.66667 13.33333
#> 7     13 13.33333 15.66667
#> 8     18 15.66667 15.33333
#> 9     15 15.33333 17.66667
#> 10    20 17.66667       NA
```

The two columns hold identical numbers, just shifted by one row. The trailing average only ever looks backward, so it is what you use for real-time monitoring and forecasting. The centred average sits symmetrically over each point, which lines the smoothed line up with the raw data, so it is what you use to reveal a trend. Because centred windows need points on both sides, they leave gaps at both ends; trailing windows only leave a gap at the start.

Centred smoothing shines on data with a repeating cycle. The built-in `AirPassengers` series counts monthly airline passengers from 1949 to 1960, and it climbs every year while swinging up and down within each year. A 12-month centred average spans exactly one year, so the seasonal swings cancel and the underlying growth trend is left behind.

```r title="Extract the trend from AirPassengers"
ap_trend <- rollmean(AirPassengers, k = 12, fill = NA, align = "center")
head(data.frame(passengers = as.numeric(AirPassengers),
                trend = round(as.numeric(ap_trend), 1)), 10)
#>    passengers trend
#> 1         112    NA
#> 2         118    NA
#> 3         132    NA
#> 4         129    NA
#> 5         121    NA
#> 6         135 126.7
#> 7         148 126.9
#> 8         148 127.6
#> 9         136 128.3
#> 10        119 128.8
```

The `passengers` column bounces between 112 and 148 in the first year, but the `trend` column barely moves, creeping from 126.7 to 128.8. That is the yearly cycle averaged away, leaving only the slow rise. A picture makes it obvious, so let's plot the raw series with its trend on top.

```r title="Plot the series with its moving-average trend"
library(ggplot2)
ap_df <- data.frame(
  month = as.numeric(time(AirPassengers)),
  passengers = as.numeric(AirPassengers),
  trend = as.numeric(ap_trend)
)
ggplot(ap_df, aes(month)) +
  geom_line(aes(y = passengers), colour = "grey70") +
  geom_line(aes(y = trend), colour = "#4f46e5", linewidth = 1) +
  labs(title = "AirPassengers with a 12-month moving average",
       x = "Year", y = "Passengers (thousands)") +
  theme_minimal()
```

The grey line is the jagged monthly count; the purple line is the smooth trend the moving average pulled out. This trend line is exactly the first ingredient in classical time series decomposition, so a moving average is not just a chart cosmetic, it is a modelling building block.

[NOTE]
**A 12-term average sits half a step off-center.** Because 12 is even, a window cannot land exactly on one month, so analysts often average two 12-term averages (a "2x12-MA") for a perfectly centred trend. Our single average is close enough to see the shape; the exact method belongs to time series decomposition. For very large series, `data.table::frollmean()` computes the same trailing average far faster.

**Try it:** Compute a 6-month trailing simple moving average of `AirPassengers` and read off the smoothed values for months 6 through 8.

```r title="Your turn: a 6-month trailing average"
# Goal: a trailing (backward-looking) 6-month average.
# Fill in the window size and alignment:
# ex_ap6 <- rollmean(AirPassengers, k = __, fill = NA, align = "____")
# round(as.numeric(ex_ap6)[6:8], 2)     # target: 124.5 130.5 135.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Six-month trailing average solution"
ex_ap6 <- rollmean(AirPassengers, k = 6, fill = NA, align = "right")
round(as.numeric(ex_ap6)[6:8], 2)
#> [1] 124.5 130.5 135.5
```

**Explanation:** With `k = 6` and `align = "right"`, the first complete window ends at month 6, so months 1 through 5 are `NA` and month 6 is the first real value.

</details>

## What is a weighted moving average, and when is it better?

A simple moving average treats every point in the window as equally important. Often that is wrong: in sales, prices or demand, what happened yesterday usually tells you more than what happened a week ago. A weighted moving average fixes this by giving each position in the window its own weight, with the most recent point counting the most.

The usual choice is linear weights: 1 for the oldest point in the window, 2 for the next, up to $k$ for the newest, all divided by their total so they add up to 1.

$$\text{WMA}_t = w_1 x_{t-k+1} + w_2 x_{t-k+2} + \dots + w_k x_t, \qquad \sum_{i=1}^{k} w_i = 1$$

Let's compute one window by hand first. For a three-point window the weights are 1, 2 and 3 over 6, and we apply them to the first three sales figures.

```r title="Weight a single window by hand"
w <- c(1, 2, 3) / 6
sum(sales[1:3] * w)
#> [1] 10.16667
```

The newest of the three points, `sales[3] = 9`, gets weight 3/6, so the answer of 10.17 is pulled toward that recent dip, lower than the simple average of 10.33 you saw earlier. That is the whole point of weighting: recent moves show up faster. Now slide those weights along the entire series with `rollapply()`, which hands each window to a function of your choice.

```r title="Apply a weighted average across the series"
wma <- rollapply(sales, width = 3, FUN = function(v) sum(v * w),
                 fill = NA, align = "right")
data.frame(sales, wma)
#>    sales      wma
#> 1     10       NA
#> 2     12       NA
#> 3      9 10.16667
#> 4     14 12.00000
#> 5     11 11.66667
#> 6     16 14.00000
#> 7     13 13.66667
#> 8     18 16.00000
#> 9     15 15.66667
#> 10    20 18.00000
```

Each row is the weighted sum of the three most recent sales, with the newest weighted heaviest. Compare row 4: the simple average was 11.67, but the weighted average is 12.00 because it leans on the recent jump to 14. The weighted line hugs the latest data more tightly than the simple line does.

[TIP]
**Make your weights add up to 1.** If they sum to anything else, the smoothed line drifts above or below the data. Dividing by the total, as in `(1:k)/sum(1:k)`, keeps the average on the same scale as the series.

**Try it:** Build a 4-point weighted moving average of `ex_series` where the newest point counts four times as much as the oldest.

```r title="Your turn: a 4-point weighted average"
# Goal: linear weights 1, 2, 3, 4 that sum to 1, newest heaviest.
ex_series <- c(4, 8, 6, 10, 12, 9)
# Build the weights and apply them with rollapply:
# ex_w <- (1:4) / sum(1:4)
# ex_wma <- rollapply(ex_series, 4, function(v) sum(v * ex_w), fill = NA, align = "right")
# round(ex_wma, 2)      # target: NA NA NA 7.8 9.8 9.8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four-point weighted average solution"
ex_w <- (1:4) / sum(1:4)
ex_wma <- rollapply(ex_series, 4, function(v) sum(v * ex_w),
                    fill = NA, align = "right")
round(ex_wma, 2)
#> [1]  NA  NA  NA 7.8 9.8 9.8
```

**Explanation:** The weights `(1:4)/sum(1:4)` are 0.1, 0.2, 0.3 and 0.4. Multiplying each window by these and summing gives an average that leans hardest on the most recent value.

</details>

## What is an exponential moving average (EMA)?

A weighted moving average uses only the last $k$ points, and gives no weight at all to anything before that window. An exponential moving average takes the idea further: it keeps a running estimate that blends today's value with everything that came before, so old data fades away smoothly instead of being cut off.

The recipe is a single line you apply over and over. Each new average is a blend of the new value and the previous average, controlled by one number, the smoothing factor $\alpha$ (alpha), between 0 and 1.

$$\text{EMA}_t = \alpha\, x_t + (1 - \alpha)\,\text{EMA}_{t-1}$$

Where:
- $x_t$ = the new value at time $t$
- $\text{EMA}_{t-1}$ = the previous average (yesterday's estimate)
- $\alpha$ = the smoothing factor; larger means more weight on the newest value, so a faster reaction

The clearest way to see this is to build it with a loop, seeding the first average with the first data point.

```r title="Build an exponential average with a loop"
alpha <- 0.5
ema <- numeric(length(sales))
ema[1] <- sales[1]
for (t in 2:length(sales)) {
  ema[t] <- alpha * sales[t] + (1 - alpha) * ema[t - 1]
}
round(ema, 3)
#>  [1] 10.000 11.000 10.000 12.000 11.500 13.750 13.375 15.688 15.344 17.672
```

Read the second value: `0.5 * 12 + 0.5 * 10 = 11`. The third: `0.5 * 9 + 0.5 * 11 = 10`. Every step is half the new point plus half of where you already were. With `alpha = 0.5` the average reacts quickly; a smaller alpha would weight past values more heavily and move more slowly.

Loops are fine, but R has a tidier way. `Reduce()` carries a running result forward through a vector, which is exactly the EMA pattern, and `accumulate = TRUE` keeps every intermediate value.

```r title="The same average without a loop"
ema_vec <- Reduce(function(prev, x) alpha * x + (1 - alpha) * prev,
                  sales[-1], accumulate = TRUE, init = sales[1])
round(ema_vec, 3)
#>  [1] 10.000 11.000 10.000 12.000 11.500 13.750 13.375 15.688 15.344 17.672
```

Identical to the loop, in one expression. Use whichever reads more clearly to you.

One question remains: how do you pick $\alpha$? In finance and forecasting people usually think in terms of a span $n$, roughly "how many points of memory I want", and convert it with $\alpha = 2/(n+1)$. A 5-point span, for example, gives an alpha of one third.

```r title="Turn a span into a smoothing factor"
n <- 5
alpha_n <- 2 / (n + 1)
alpha_n
#> [1] 0.3333333
```

[KEY INSIGHT]
**An exponential moving average never fully forgets.** Each old value keeps a small, exponentially shrinking share of the result, which is why a single number, the smoothing factor alpha, can summarise the entire past.

**Try it:** Apply an EMA with `alpha = 0.5` to the vector `c(2, 4, 6, 8)`, seeding with the first value.

```r title="Your turn: an exponential average by hand"
# Goal: blend each value with the running average using alpha = 0.5.
ex_vec <- c(2, 4, 6, 8)
# Use Reduce to carry the average forward:
# ex_ema <- Reduce(function(prev, x) 0.5 * x + 0.5 * prev,
#                  ex_vec[-1], accumulate = TRUE, init = ex_vec[1])
# ex_ema      # target: 2.00 3.00 4.50 6.25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential average by hand solution"
ex_ema <- Reduce(function(prev, x) 0.5 * x + 0.5 * prev,
                 ex_vec[-1], accumulate = TRUE, init = ex_vec[1])
ex_ema
#> [1] 2.00 3.00 4.50 6.25
```

**Explanation:** Seeded at 2, each step averages the new value with the running total: `0.5*4 + 0.5*2 = 3`, then `0.5*6 + 0.5*3 = 4.5`, then `0.5*8 + 0.5*4.5 = 6.25`.

</details>

## How do simple, weighted and exponential moving averages compare?

You now have all three. They differ in exactly one way: how much weight each point inside the window carries. A simple average spreads weight evenly, a weighted average ramps it up linearly toward the newest point, and an exponential average lets it decay smoothly so even the oldest points keep a small, non-zero weight.

![Three panels showing equal, linear and decaying weights for the three averages](screenshots/Moving-Averages-in-R-weight-schemes.webp)

*Figure 2: The three averages differ only in how they weight points inside the window.*

Put them next to each other on the `sales` series and the difference in responsiveness shows up in the numbers.

```r title="Compare the three averages side by side"
compare <- data.frame(
  sales,
  sma = round(rollmean(sales, 3, fill = NA, align = "right"), 2),
  wma = round(wma, 2),
  ema = round(ema, 2)
)
compare
#>    sales   sma   wma   ema
#> 1     10    NA    NA 10.00
#> 2     12    NA    NA 11.00
#> 3      9 10.33 10.17 10.00
#> 4     14 11.67 12.00 12.00
#> 5     11 11.33 11.67 11.50
#> 6     16 13.67 14.00 13.75
#> 7     13 13.33 13.67 13.38
#> 8     18 15.67 16.00 15.69
#> 9     15 15.33 15.67 15.34
#> 10    20 17.67 18.00 17.67
```

Notice two things. The EMA has values in rows 1 and 2 where the others are `NA`, because it never waits for a full window, it starts from the first point. And when sales jump, the weighted and exponential columns move toward the new level a step ahead of the simple column. Here is the same comparison as a reference table.

| Average | Weights across the window | Reacts to change | Best for |
|---|---|---|---|
| Simple (SMA) | Equal | Slowest | A steady trend that is easy to explain |
| Weighted (WMA) | Rise linearly to the newest | Medium | When recent points matter but memory is finite |
| Exponential (EMA) | Decay smoothly, never zero | Fastest | Streaming data that needs a quick response |

The one knob you always tune is the amount of smoothing: the window size $k$ for simple and weighted averages, or the smoothing factor $\alpha$ for the exponential one. There is no free lunch here.

[KEY INSIGHT]
**Smoothness and responsiveness pull in opposite directions.** A bigger window or a smaller smoothing factor cancels more noise but reacts more slowly, so the smoothed peak lands after the real one. The right amount of smoothing matches how fast your signal actually moves.

**Try it:** This series repeats every 7 steps. Smooth out the weekly cycle with a centred window that spans one full period.

```r title="Your turn: match the window to the period"
# Goal: a centred average whose window equals the period of 7.
ex_week <- c(20, 22, 19, 25, 30, 15, 10, 21, 23, 20, 26, 31, 16, 11)
# Pick the window size and alignment, then read the smoothed middle:
# ex_week_ma <- rollmean(ex_week, k = __, fill = NA, align = "center")
# round(as.numeric(ex_week_ma)[4:11], 2)   # target: 20.14 20.29 ... 21.14
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weekly-period smoothing solution"
ex_week_ma <- rollmean(ex_week, k = 7, fill = NA, align = "center")
round(as.numeric(ex_week_ma)[4:11], 2)
#> [1] 20.14 20.29 20.43 20.57 20.71 20.86 21.00 21.14
```

**Explanation:** A window of 7, the length of the cycle, averages one full period at every point, so the weekly ups and downs cancel and only the gentle drift (around 20 to 21) survives. The first three and last three positions are `NA` because a centred 7-window needs three points on each side. Matching the window to the seasonal period is the standard trick for exposing a trend.

</details>

## How do you forecast with a moving average?

Smoothing looks backward, but you can also use a moving average to guess the next value. The simplest forecast is a flat one: predict that the next observation will equal the average of the last few. Because a forecast can only use data you already have, you must use a trailing (backward-looking) window.

```r title="Forecast the next value with a trailing average"
last_k <- tail(sales, 3)
forecast_next <- mean(last_k)
forecast_next
#> [1] 17.66667
```

The last three sales were 18, 15 and 20, so the moving-average forecast for the next period is their mean, 17.67. To forecast several steps ahead with this simple method, you just repeat that same number, since you have no new data to update it with.

[WARNING]
**Never forecast with a centered average.** A centred window borrows values from both sides of each point, including the future, so it cannot even be computed at the final observation. Any forecast that used it would be relying on values from after the point being predicted. Always forecast with a trailing average.

A flat moving-average forecast is a baseline, not a finished model, because it ignores trend and seasonality. The exponential moving average is the seed of a better family: add trend and seasonal terms to it and you get exponential smoothing (ETS), and a different lens gives you ARIMA. Both are covered in the forecasting tutorials linked at the end.

**Try it:** Make a 3-step-ahead flat forecast for this series using the mean of its last three values.

```r title="Your turn: a flat moving-average forecast"
# Goal: forecast the next 3 periods as the mean of the last 3 observations.
ex_fc <- c(50, 52, 48, 55, 60)
# ex_forecast <- mean(tail(ex_fc, 3))
# round(rep(ex_forecast, 3), 2)     # target: 54.33 54.33 54.33
```

<details>
<summary>Click to reveal solution</summary>

```r title="Flat moving-average forecast solution"
ex_forecast <- mean(tail(ex_fc, 3))
round(rep(ex_forecast, 3), 2)
#> [1] 54.33 54.33 54.33
```

**Explanation:** The last three values are 48, 55 and 60, averaging to 54.33. With no new information arriving, the flat forecast repeats that number for every future step.

</details>

## Complete example: smoothing and forecasting the Nile

Let's put all three averages to work on a fresh dataset. The built-in `Nile` series records the annual flow of the river Nile from 1871 to 1970, and it is noisy with a gentle downward shift, a good test for smoothing. We compute a 5-year simple, weighted and exponential average in one place.

```r title="Smooth the Nile with all three averages"
data(Nile)
k <- 5
nile_flow <- as.numeric(Nile)
nile_sma <- rollmean(Nile, k, fill = NA, align = "center")
wk <- (1:k) / sum(1:k)
nile_wma <- rollapply(Nile, k, function(v) sum(v * wk), fill = NA, align = "right")
a <- 2 / (k + 1)
nile_ema <- Reduce(function(prev, x) a * x + (1 - a) * prev,
                   nile_flow[-1], accumulate = TRUE, init = nile_flow[1])
data.frame(
  year = 1871:1880,
  flow = nile_flow[1:10],
  sma  = round(as.numeric(nile_sma)[1:10], 1),
  wma  = round(as.numeric(nile_wma)[1:10], 1),
  ema  = round(nile_ema[1:10], 1)
)
#>    year flow    sma    wma    ema
#> 1  1871 1120     NA     NA 1120.0
#> 2  1872 1160     NA     NA 1133.3
#> 3  1873  963 1122.6     NA 1076.6
#> 4  1874 1210 1130.6     NA 1121.0
#> 5  1875 1160 1061.2 1131.3 1134.0
#> 6  1876 1160 1114.6 1143.7 1142.7
#> 7  1877  813 1146.6 1037.9 1032.8
#> 8  1878 1230 1142.6 1094.1 1098.5
#> 9  1879 1370 1109.6 1179.3 1189.0
#> 10 1880 1140 1134.0 1177.1 1172.7
```

Look at 1877, when flow crashed to 813. The centred simple average barely notices (1146.6, because it also averages in the high neighbours on both sides), while the trailing weighted and exponential averages drop hard (1037.9 and 1032.8) because they weight that recent low heavily. Plotting all three against the raw flow makes the difference in how they respond clear.

```r title="Plot the Nile with all three averages"
library(tidyr)
nile_df <- data.frame(
  year = 1871:1970,
  flow = nile_flow,
  sma  = as.numeric(nile_sma),
  wma  = as.numeric(nile_wma),
  ema  = nile_ema
)
nile_long <- pivot_longer(nile_df, c(sma, wma, ema),
                          names_to = "method", values_to = "value")
ggplot(nile_df, aes(year)) +
  geom_line(aes(y = flow), colour = "grey75") +
  geom_line(data = nile_long, aes(year, value, colour = method),
            linewidth = 0.9) +
  labs(title = "Nile flow with three moving averages",
       x = "Year", y = "Annual flow") +
  theme_minimal()
```

Finally, a one-step-ahead flat forecast for 1971 is just the mean of the last 5 observed years.

```r title="One-step-ahead forecast for the Nile"
tail_k <- tail(nile_flow, k)
round(mean(tail_k), 1)
#> [1] 767.4
```

That single number, 767.4, is the plainest possible forecast. It sets the baseline that any real forecasting model has to beat.

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution.

### Exercise 1: SMA versus EMA on a price series

Compute a 4-point trailing simple moving average and a matching exponential moving average (span 4, so `alpha = 2/(4+1)`) on the price series below, then compare their final values. Which one sits closer to the latest price of 115?

```r title="Exercise 1: SMA versus EMA on a price series"
# Compare a 4-point SMA with a span-4 EMA on this price series.
my_prices <- c(100, 102, 101, 105, 107, 106, 110, 112, 111, 115)
# Compute both, then print each one's last value.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_sma <- rollmean(my_prices, k = 4, fill = NA, align = "right")
my_a <- 2 / (4 + 1)
my_ema <- Reduce(function(prev, x) my_a * x + (1 - my_a) * prev,
                 my_prices[-1], accumulate = TRUE, init = my_prices[1])
cat("SMA last:", round(tail(my_sma, 1), 3), "\n")
cat("EMA last:", round(tail(my_ema, 1), 3), "\n")
#> SMA last: 112
#> EMA last: 111.879
```

**Explanation:** Both land near 112, but the EMA (111.879) tracks the recent climb a touch more tightly because its weights favour the newest prices. On a faster-moving series the gap would be larger.

</details>

### Exercise 2: a moving-average crossover

A classic trading signal is the "golden cross", where a short-window average rises above a long-window average. Compute a 3-point and a 6-point trailing simple moving average of `my_series`, then find the first index where the short average crosses above the long one.

```r title="Exercise 2: a moving-average crossover"
# Find where a short average first rises above a long average.
my_series <- c(30, 28, 26, 24, 22, 20, 19, 21, 24, 27, 30, 33, 35, 36, 38)
# Compute both trailing SMAs, then detect the upward crossing.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
short_ma <- rollmean(my_series, k = 3, fill = NA, align = "right")
long_ma  <- rollmean(my_series, k = 6, fill = NA, align = "right")
signal <- short_ma - long_ma
prev <- c(NA, head(signal, -1))
cross_up <- which(prev <= 0 & signal > 0)
cross_up
#> [1] 10
```

**Explanation:** `signal` is positive when the short average is above the long one. Comparing each value with the one before it (`prev`) finds the moment the signal turns from non-positive to positive, which happens at index 10, just as the series recovers from its dip.

</details>

### Exercise 3: one function, three averages

Write a single function `moving_average(x, k, type)` that returns a simple, weighted, or exponential moving average depending on `type`. Test it on the `sales` vector from the top of the tutorial.

```r title="Exercise 3: one function, three averages"
# Write moving_average(x, k, type) returning "simple", "weighted",
# or "exponential", then test it on sales.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
moving_average <- function(x, k, type = c("simple", "weighted", "exponential")) {
  type <- match.arg(type)
  if (type == "simple") {
    rollmean(x, k, fill = NA, align = "right")
  } else if (type == "weighted") {
    wts <- (1:k) / sum(1:k)
    rollapply(x, k, function(v) sum(v * wts), fill = NA, align = "right")
  } else {
    a <- 2 / (k + 1)
    Reduce(function(prev, val) a * val + (1 - a) * prev,
           x[-1], accumulate = TRUE, init = x[1])
  }
}
round(moving_average(sales, 3, "weighted"), 2)
#>  [1]    NA    NA 10.17 12.00 11.67 14.00 13.67 16.00 15.67 18.00
```

**Explanation:** `match.arg()` lets the caller pass just `"simple"`, `"weighted"` or `"exponential"` and picks the matching branch. Each branch reuses the exact code from the tutorial, so one function now covers all three averages.

</details>

## Frequently asked questions

### Is a moving average the same as a rolling average?

Yes. "Rolling average", "running average" and "moving average" all name the same idea: a mean taken over a window that slides along the series. R packages tend to use the "roll" spelling, as in `rollmean()` and `rollapply()`.

### Should I use a centred or a trailing moving average?

Use a centred average when you want to see a trend, because it lines up symmetrically with the data. Use a trailing average when the value must be available in real time or you plan to forecast, because it never looks into the future.

### How do I choose the window size or smoothing factor?

Start from the structure of your data. If it has a repeating cycle, set the window to one full period. Otherwise pick the smallest window (or largest alpha) that still calms the noise, since more smoothing always adds more lag.

### Can a moving average predict future values?

It can give a simple baseline forecast: the mean of the last few points, repeated forward. It ignores trend and seasonality, so treat it as the number a real model like exponential smoothing or ARIMA has to beat.

## Summary

A moving average smooths a series by averaging a sliding window; the three types differ only in how they weight the points inside that window.

| Method | R call | One-line idea |
|---|---|---|
| Simple (SMA) | `rollmean(x, k)` | plain mean of the last k points, equal weights |
| Weighted (WMA) | `rollapply(x, k, weighted sum)` | linear weights, recent points count more |
| Exponential (EMA) | `Reduce()` or `stats::filter()` | recursive blend, weights shrink but never reach zero |

Key things to carry away:

- Use a **centred** average to reveal a trend and a **trailing** average to forecast; never forecast with a centred window.
- Match the window to the cycle: a window equal to the seasonal period averages the season away.
- More smoothing means more lag, so pick the smallest window or largest alpha that still calms the noise enough.
- `fill = NA` marks the edges where a full window does not fit; centred windows leave gaps at both ends.

![A mind map of the three moving averages and their uses](screenshots/Moving-Averages-in-R-overview-mindmap.webp)

*Figure 3: The moving-average toolkit at a glance: three methods, three uses.*

## References

1. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (3rd ed.), Moving Averages. [Link](https://otexts.com/fpp3/moving-averages.html)
2. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (3rd ed.), Classical Decomposition. [Link](https://otexts.com/fpp3/classical-decomposition.html)
3. zoo package on CRAN - rolling window functions including `rollmean` and `rollapply`. [Link](https://cran.r-project.org/package=zoo)
4. zoo reference - `rollmean()` documentation. [Link](https://rdrr.io/cran/zoo/man/rollmean.html)
5. R stats reference - `filter()` for linear filtering of time series. [Link](https://rdrr.io/r/stats/filter.html)
6. Wikipedia - Moving average (simple, weighted and exponential definitions). [Link](https://en.wikipedia.org/wiki/Moving_average)
7. NIST/SEMATECH e-Handbook of Statistical Methods - EWMA control charts. [Link](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc324.htm)

## Continue Learning

- [Time Series Decomposition in R: STL vs Classical](Time-Series-Decomposition-in-R.html) - the moving-average trend you built here is the first step of classical decomposition.
- [Test Stationarity in R: ADF, KPSS, and Differencing](Test-Stationarity-in-R.html) - after smoothing out a trend, check whether what remains is stationary enough to model.
- [Time Series Objects in R: ts, xts, zoo, or tsibble?](Time-Series-Objects-in-R.html) - understand the `ts` and `zoo` objects that these moving-average functions consume and return.
