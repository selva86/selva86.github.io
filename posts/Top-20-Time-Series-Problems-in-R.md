---
title: "Top 20 Time Series Problems to Solve in R"
slug: "Top-20-Time-Series-Problems-in-R"
description: "Twenty time series problems in R with base stats: ts objects, decomposition, ACF/PACF, differencing, naive and drift forecasts, and reading an ARIMA fit."
keywords: "time series problems in R, R time series practice, ts object R, ACF PACF R, ARIMA in R, forecasting exercises R"
mathjax: true
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Top 20 Time Series Problems"
sidebar_order: 145
fr_parent: "Time-Series-Analysis-With-R.html"
auto_link_terms: "time series problems|time series practice in r|ts object|acf and pacf|arima in r"
auto_link_case_sensitive: false
target_keyword: "time series problems in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Top 20 Time Series Problems to Solve in R

<p class="lead">Twenty hand-picked time series problems that take you from building a <code>ts</code> object to reading an ARIMA fit, using only base R and the stats package on the classic built-in series. Every problem states the exact expected output, ships two graded hints, and hides a fully worked solution with an explanation you can open when you are ready.</p>

Work top to bottom: the arc moves from indexing and calendars, through decomposition and autocorrelation, into differencing and stationarity, and finishes with hand-built forecasts and model diagnostics. Each answer is deterministic, so the numbers you produce should match the expected result line for line.

```r title="Run this once before any exercise"
# Every dataset (AirPassengers, nottem, lynx, LakeHuron, sunspots) and every
# function used below (ts, window, decompose, stl, acf, pacf, arima, Box.test)
# ships with base R and the stats package. No add-on packages are needed.
library(stats)
```

## Section 1. ts objects, indexing, and calendars (4 problems)

A time series in R is a numeric vector wearing a calendar. These first problems build that calendar, read it back, slice it, and roll it up to a coarser frequency.

### Exercise 1.1: Build a monthly ts object from a raw vector

**Task:** The numeric vector below holds 24 monthly passenger counts that begin in January 2021. Wrap it in a proper monthly time series by attaching a start of January 2021 and a frequency of 12, then save the finished series to `ex_1_1`.

**Expected result:**

```
     Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
2021 112 118 132 129 121 135 148 148 136 119 104 118
2022 115 126 141 135 125 149 170 170 158 133 114 140
```

**Difficulty:** Beginner

[HINTS]
A time series is a plain vector plus two pieces of calendar metadata: when it starts and how many observations make one cycle.
Use `ts(vals, start = c(2021, 1), frequency = 12)`; the `start` is a (year, period) pair.

```r title="Your turn"
vals <- c(112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118,
          115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114, 140)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vals <- c(112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118,
          115, 126, 141, 135, 125, 149, 170, 170, 158, 133, 114, 140)
ex_1_1 <- ts(vals, start = c(2021, 1), frequency = 12)
ex_1_1
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 2021 112 118 132 129 121 135 148 148 136 119 104 118
#> 2022 115 126 141 135 125 149 170 170 158 133 114 140
```

**Explanation:** `ts()` does not reshuffle your data; it only records that observation one lands in January 2021 and that 12 observations complete a year. That metadata is what lets `window()`, `aggregate()`, `decompose()`, and every model function reason about seasons. Set `frequency = 4` for quarterly data or `frequency = 7` for daily-with-weekly cycles.

</details>

### Exercise 1.2: Read start, end, and frequency off AirPassengers

**Task:** The built-in `AirPassengers` series records monthly airline totals. Without hard-coding any dates, extract its start, its end, and its frequency using the accessor functions and collect the three values into a named list saved to `ex_1_2`.

**Expected result:**

```
$start
[1] 1949    1

$end
[1] 1960   12

$frequency
[1] 12
```

**Difficulty:** Beginner

[HINTS]
Three accessor functions report a series' calendar; you should never need to type the years yourself.
Combine `start()`, `end()`, and `frequency()` inside `list(start = ..., end = ..., frequency = ...)`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- list(
  start = start(AirPassengers),
  end = end(AirPassengers),
  frequency = frequency(AirPassengers)
)
ex_1_2
#> $start
#> [1] 1949    1
#>
#> $end
#> [1] 1960   12
#>
#> $frequency
#> [1] 12
```

**Explanation:** `start()` and `end()` return a two-element vector of (year, period), so `1949 1` means January 1949 and `1960 12` means December 1960. Reading the calendar from the object rather than retyping it keeps code correct when the series is later trimmed or extended. `frequency()` returning 12 confirms monthly seasonality is available to seasonal models.

</details>

### Exercise 1.3: Slice out the last two years with window

**Task:** Analysts often inspect only the tail of a long series. Use `window()` to extract every month of 1959 and 1960 from `AirPassengers`, keeping the series structure intact, and save the 24-month slice to `ex_1_3`.

**Expected result:**

```
     Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
1959 360 342 406 396 420 472 548 559 463 407 362 405
1960 417 391 419 461 472 535 622 606 508 461 390 432
```

**Difficulty:** Intermediate

[HINTS]
Ordinary bracket indexing drops the calendar; you want a slicer that keeps the series a proper ts.
Call `window(AirPassengers, start = c(1959, 1), end = c(1960, 12))`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- window(AirPassengers, start = c(1959, 1), end = c(1960, 12))
ex_1_3
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1959 360 342 406 396 420 472 548 559 463 407 362 405
#> 1960 417 391 419 461 472 535 622 606 508 461 390 432
```

**Explanation:** `window()` is the calendar-aware cousin of `[`. Passing `AirPassengers[133:144]` would return a bare numeric vector with no dates, breaking any later seasonal call; `window()` preserves the frequency and time index. A common mistake is forgetting that `end` is inclusive, so `c(1960, 12)` keeps December 1960 rather than stopping before it.

</details>

### Exercise 1.4: Roll monthly sunspots up to annual means

**Task:** The `sunspots` series is monthly, but the solar cycle is usually studied annually. Aggregate `sunspots` to one value per year using the yearly mean, then keep only the years 1949 through 1960 with `window()`, and save that 12-value annual series to `ex_1_4`.

**Expected result:**

```
Time Series:
Start = 1949 
End = 1960 
Frequency = 1 
 [1] 135.116667  83.925000  69.758333  31.408333  13.850000   4.408333
 [7]  37.950000 141.708333 189.850000 184.591667 158.750000 112.275000
```

**Difficulty:** Intermediate

[HINTS]
Changing the number of periods per year is a frequency change, and one base function does exactly that while applying a summary.
Use `aggregate(sunspots, nfrequency = 1, FUN = mean)` first, then `window()` the result to 1949 through 1960.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
annual_sun <- aggregate(sunspots, nfrequency = 1, FUN = mean)
ex_1_4 <- window(annual_sun, start = 1949, end = 1960)
ex_1_4
#> Time Series:
#> Start = 1949 
#> End = 1960 
#> Frequency = 1 
#>  [1] 135.116667  83.925000  69.758333  31.408333  13.850000   4.408333
#>  [7]  37.950000 141.708333 189.850000 184.591667 158.750000 112.275000
```

**Explanation:** `aggregate.ts()` with `nfrequency = 1` reduces 12 monthly points to a single annual point using `FUN`; switching to `FUN = sum` would give annual totals instead of averages. The result is a frequency-1 series, so it prints in the plain "Time Series" form rather than a month grid. This roll-up is the standard first move before studying the multi-year solar cycle.

</details>

## Section 2. Reading a decomposition (3 problems)

Decomposition splits a series into trend, a repeating seasonal shape, and what is left over. The next three problems extract each piece and decide between additive and multiplicative structure.

### Exercise 2.1: Extract the 12 monthly seasonal effects of nottem

**Task:** The `nottem` series holds 20 years of monthly average air temperatures at Nottingham, a textbook additive-seasonal series. Run a classical decomposition and pull out the vector of 12 monthly seasonal effects (the seasonal figure), saving those 12 numbers to `ex_2_1`.

**Expected result:**

```
 [1] -9.3393640 -9.8998904 -6.9466009 -2.7573465  3.4533991  8.9865132
 [7] 12.9672149 11.4591009  7.4001096  0.6547149 -6.6176535 -9.3601974
```

**Difficulty:** Beginner

[HINTS]
Classical decomposition estimates one repeating offset per month; that repeating block is stored ready-made on the result.
Call `decompose(nottem)` and read its `$figure` element, which holds the 12 seasonal offsets.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dec_n <- decompose(nottem)
ex_2_1 <- dec_n$figure
ex_2_1
#>  [1] -9.3393640 -9.8998904 -6.9466009 -2.7573465  3.4533991  8.9865132
#>  [7] 12.9672149 11.4591009  7.4001096  0.6547149 -6.6176535 -9.3601974
```

**Explanation:** `decompose()` estimates the trend with a centered moving average, subtracts it, then averages the detrended values within each calendar month to get one offset per month; those 12 offsets are the `$figure`. Negative values mark the cold months (January near -9.3) and positive values the warm ones (July near 13). Because the offsets sum to roughly zero, they add to, rather than scale, the trend, which is what "additive" means.

</details>

### Exercise 2.2: Pull the multiplicative trend of AirPassengers for 1950

**Task:** In `AirPassengers` the seasonal swings grow as the level rises, which signals multiplicative seasonality. Decompose the series with `type = "multiplicative"`, then use `window()` to return the estimated trend component for the 12 months of 1950, saving that slice to `ex_2_2`.

**Expected result:**

```
          Jan      Feb      Mar      Apr      May      Jun      Jul      Aug
1950 131.2500 133.0833 134.9167 136.4167 137.4167 138.7500 140.9167 143.1667
          Sep      Oct      Nov      Dec
1950 145.7083 148.4167 151.5417 154.7083
```

**Difficulty:** Intermediate

[HINTS]
First choose the decomposition type that matches seasonal swings that grow with the level, then slice the trend piece by calendar.
Decompose with `decompose(AirPassengers, type = "multiplicative")` and `window()` its `$trend` to 1950.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dec_ap <- decompose(AirPassengers, type = "multiplicative")
ex_2_2 <- window(dec_ap$trend, start = c(1950, 1), end = c(1950, 12))
ex_2_2
#>           Jan      Feb      Mar      Apr      May      Jun      Jul      Aug
#> 1950 131.2500 133.0833 134.9167 136.4167 137.4167 138.7500 140.9167 143.1667
#>           Sep      Oct      Nov      Dec
#> 1950 145.7083 148.4167 151.5417 154.7083
```

**Explanation:** With `type = "multiplicative"` the model is value = trend times seasonal times remainder, so the seasonal factors are ratios around 1 rather than additive offsets. The trend itself is still a centered moving average and is why the first and last six months of the whole series are `NA`; 1950 sits safely inside, so every month is defined. Choosing additive here would leave a fan-shaped pattern in the remainder, the classic tell that you picked the wrong type.

</details>

### Exercise 2.3: Get the STL seasonal component for the first year of nottem

**Task:** STL is a more flexible, loess-based decomposition. Fit `stl()` to `nottem` with a periodic seasonal window, then use `window()` to return the seasonal component for the 12 months of 1920, the first year of the series, and save it to `ex_2_3`.

**Expected result:**

```
            Jan        Feb        Mar        Apr        May        Jun
1920 -9.3471980 -9.8552496 -6.8533008 -2.7634710  3.5013569  8.9833032
            Jul        Aug        Sep        Oct        Nov        Dec
1920 12.8452501 11.4763813  7.4475114  0.4736899 -6.4301309 -9.4781423
```

**Difficulty:** Intermediate

[HINTS]
STL returns trend, seasonal, and remainder as columns of a multi-series table; you want the seasonal column for one year.
Fit `stl(nottem, s.window = "periodic")` and `window()` the `"seasonal"` column of its `$time.series`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_stl <- stl(nottem, s.window = "periodic")
ex_2_3 <- window(fit_stl$time.series[, "seasonal"], start = c(1920, 1), end = c(1920, 12))
ex_2_3
#>             Jan        Feb        Mar        Apr        May        Jun
#> 1920 -9.3471980 -9.8552496 -6.8533008 -2.7634710  3.5013569  8.9833032
#>             Jul        Aug        Sep        Oct        Nov        Dec
#> 1920 12.8452501 11.4763813  7.4475114  0.4736899 -6.4301309 -9.4781423
```

**Explanation:** `stl()` stores its three components as columns of a multivariate time series in `$time.series`, so you index the `"seasonal"` column before slicing. With `s.window = "periodic"` the seasonal shape is forced to repeat identically every year, which is why 1920's figures nearly match the classical offsets from Exercise 2.1. Using a finite `s.window` instead would let the seasonal pattern drift slowly across the two decades.

</details>

## Section 3. Autocorrelation: ACF and PACF (3 problems)

The autocorrelation function measures how a series relates to its own past. Its shape, and the shape of the partial version, is how you diagnose memory and pick model orders.

### Exercise 3.1: Compute the ACF of LakeHuron to lag 5

**Task:** The `LakeHuron` series is the annual lake level from 1875 to 1972. Compute its autocorrelation function out to lag 5 without drawing a plot, and save the returned acf object to `ex_3_1` so its lag-by-lag correlations print.

**Expected result:**

```

Autocorrelations of series 'LakeHuron', by lag

    0     1     2     3     4     5 
1.000 0.832 0.610 0.458 0.371 0.326 
```

**Difficulty:** Intermediate

[HINTS]
You want the numbers behind the correlogram, not the chart, so suppress the graphic and keep the returned object.
Call `acf(LakeHuron, lag.max = 5, plot = FALSE)`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- acf(LakeHuron, lag.max = 5, plot = FALSE)
ex_3_1
#> 
#> Autocorrelations of series 'LakeHuron', by lag
#> 
#>     0     1     2     3     4     5 
#> 1.000 0.832 0.610 0.458 0.371 0.326 
```

**Explanation:** The sample autocorrelation at lag $k$ is $r_k = \dfrac{\sum_{t=k+1}^{n}(y_t-\bar y)(y_{t-k}-\bar y)}{\sum_{t=1}^{n}(y_t-\bar y)^2}$, and lag 0 is always 1 because a series correlates perfectly with itself. The slow, smooth decay from 0.83 downward is the signature of a series with persistent memory, typical of an autoregressive process. Setting `plot = FALSE` returns the object so you can read or test the values instead of eyeballing a chart.

</details>

### Exercise 3.2: Read the PACF of LakeHuron to spot AR order

**Task:** The partial autocorrelation function strips out the influence of shorter lags, making it the tool for choosing an autoregressive order. Compute the PACF of `LakeHuron` out to lag 5 without plotting, and save the object to `ex_3_2`.

**Expected result:**

```

Partial autocorrelations of series 'LakeHuron', by lag

     1      2      3      4      5 
 0.832 -0.267  0.131  0.034  0.062 
```

**Difficulty:** Intermediate

[HINTS]
The partial version answers "what does lag k add once lags 1 to k-1 are accounted for", and it starts at lag 1.
Call `pacf(LakeHuron, lag.max = 5, plot = FALSE)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- pacf(LakeHuron, lag.max = 5, plot = FALSE)
ex_3_2
#> 
#> Partial autocorrelations of series 'LakeHuron', by lag
#> 
#>      1      2      3      4      5 
#>  0.832 -0.267  0.131  0.034  0.062 
```

**Explanation:** The PACF at lag 2 is large and negative (-0.27) while lags 3 and beyond hover near zero, so the partial autocorrelations effectively cut off after lag 2. That pattern (ACF tailing off, PACF cutting off at lag 2) is the classic fingerprint of an AR(2) process, which is exactly the model you will fit in Section 6. Unlike the ACF, the PACF has no lag-0 entry because a value's partial correlation with itself is not defined.

</details>

### Exercise 3.3: Reveal the lynx cycle with a longer ACF

**Task:** The `lynx` series counts annual Canadian lynx trappings and is famous for its roughly ten-year cycle. Compute its autocorrelation function out to lag 12 without plotting, save the object to `ex_3_3`, and watch the correlations swing negative near lag 5 and back positive near lag 10.

**Expected result:**

```

Autocorrelations of series 'lynx', by lag

     0      1      2      3      4      5      6      7      8      9     10 
 1.000  0.711  0.214 -0.189 -0.433 -0.502 -0.400 -0.148  0.218  0.501  0.514 
    11     12 
 0.283 -0.029 
```

**Difficulty:** Advanced

[HINTS]
A repeating cycle leaves a wave in the autocorrelations, so you must look out far enough to see a full period.
Call `acf(lynx, lag.max = 12, plot = FALSE)` and trace the sign changes.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- acf(lynx, lag.max = 12, plot = FALSE)
ex_3_3
#> 
#> Autocorrelations of series 'lynx', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10 
#>  1.000  0.711  0.214 -0.189 -0.433 -0.502 -0.400 -0.148  0.218  0.501  0.514 
#>     11     12 
#>  0.283 -0.029 
```

**Explanation:** A purely damped decay means memory only; an oscillating ACF means periodicity. Here the correlation troughs around lag 5 (values near a decade apart move together, values half a decade apart move oppositely) and peaks again near lags 9 and 10, pinning the cycle length at about ten years. A short `lag.max` of 5 would show only the descent and hide the periodicity, which is why longer horizons matter for cyclic wildlife and economic series.

</details>

## Section 4. Differencing and stationarity (3 problems)

Most models assume a stationary series: stable mean and variance, no trend or seasonal drift. Differencing and transforms are how you get there, and a quick check tells you whether you have arrived.

### Exercise 4.1: Compare raw and log first-difference variability

**Task:** `AirPassengers` grows and its month-to-month jumps grow with it, so a log transform should stabilize the spread. Take the first difference of the raw series and of the logged series, then compare their standard deviations by saving both, named `raw_sd` and `log_sd`, into the vector `ex_4_1`.

**Expected result:**

```
    raw_sd     log_sd 
33.7542815  0.1065561 
```

**Difficulty:** Intermediate

[HINTS]
Variance that scales with the level is tamed by a log before differencing, not by differencing alone.
Compute `sd(diff(AirPassengers))` and `sd(diff(log(AirPassengers)))` and combine them with `c(raw_sd = ..., log_sd = ...)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw_diff <- diff(AirPassengers)
log_diff <- diff(log(AirPassengers))
ex_4_1 <- c(raw_sd = sd(raw_diff), log_sd = sd(log_diff))
ex_4_1
#>     raw_sd     log_sd 
#> 33.7542815  0.1065561 
```

**Explanation:** First differencing computes $\nabla y_t = y_t - y_{t-1}$, which removes a trend but does nothing about a spread that widens over time. The two standard deviations are not directly comparable in scale, but the point is that on the log series each difference is an approximate percentage change, so its size no longer depends on the current level. Taking `log()` before differencing is the standard recipe for multiplicative series and is exactly what a log-ARIMA does under the hood.

</details>

### Exercise 4.2: Seasonally then regularly difference AirPassengers

**Task:** A series with both trend and seasonality often needs two differences: a seasonal one at lag 12 and then a regular one at lag 1. Apply a lag-12 difference to `log(AirPassengers)`, difference that result again at lag 1, and report the mean, variance, and length of the doubly differenced series as a named vector saved to `ex_4_2`.

**Expected result:**

```
        mean          var            n 
2.908799e-04 2.102066e-03 1.310000e+02 
```

**Difficulty:** Intermediate

[HINTS]
Removing an annual pattern needs a difference at the seasonal lag; removing what trend remains needs a further lag-1 difference.
Chain `diff(log(AirPassengers), lag = 12)` into another `diff(...)`, then summarise with `mean()`, `var()`, and `length()`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d1 <- diff(log(AirPassengers), lag = 12)
d2 <- diff(d1)
ex_4_2 <- c(mean = mean(d2), var = var(d2), n = length(d2))
ex_4_2
#>         mean          var            n 
#> 2.908799e-04 2.102066e-03 1.310000e+02 
```

**Explanation:** The seasonal difference $\nabla_{12} y_t = y_t - y_{t-12}$ subtracts each month from the same month a year earlier, cancelling the repeating pattern; the extra $\nabla$ then removes the leftover trend. Each difference costs observations, so 144 monthly points fall to 131 (12 lost to the seasonal lag, 1 more to the regular lag). The near-zero mean and small stable variance are the hallmarks of a series ready for an ARIMA model, and this exact recipe underlies the "airline model" ARIMA(0,1,1)(0,1,1).

</details>

### Exercise 4.3: Stationarity heuristic by splitting LakeHuron in half

**Task:** A fast, rough stationarity check asks whether the mean is stable across the record. Split `LakeHuron` into its first and second halves, run a two-sample t-test on the two level samples, and save a named vector of the two half-means and the test p-value (`mean_first`, `mean_second`, `p_value`) to `ex_4_3`.

**Expected result:**

```
  mean_first  mean_second      p_value 
5.797035e+02 5.783047e+02 1.822892e-08 
```

**Difficulty:** Advanced

[HINTS]
If the average level of the first half differs sharply from the second, the mean is drifting and the series is not stationary.
Slice with integer indexing around `length(LakeHuron) %/% 2`, then feed both halves to `t.test()` and read `$estimate` and `$p.value`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- length(LakeHuron)
first_half  <- LakeHuron[1:(n %/% 2)]
second_half <- LakeHuron[(n %/% 2 + 1):n]
tt <- t.test(first_half, second_half)
ex_4_3 <- c(mean_first = unname(tt$estimate[1]),
            mean_second = unname(tt$estimate[2]),
            p_value = tt$p.value)
ex_4_3
#>   mean_first  mean_second      p_value 
#> 5.797035e+02 5.783047e+02 1.822892e-08 
```

**Explanation:** The two half-means differ by only about 1.4 feet, yet the p-value is roughly 1.8e-08, so the difference is overwhelmingly significant and the mean level is drifting downward: a red flag for stationarity. Treat this as a screening heuristic, not a formal test, because the t-test assumes independent samples while consecutive lake levels are strongly autocorrelated. It is a fast sanity check that motivates the formal unit-root tests you would reach for next.

</details>

## Section 5. Simple forecasts and accuracy (4 problems)

Before any fancy model, you need honest benchmarks. These problems build naive, seasonal-naive, and drift forecasts by hand on a hold-out set and score them, so any later model has a bar to clear.

### Exercise 5.1: Split AirPassengers into train and test

**Task:** Honest forecasting needs a hold-out. Split `AirPassengers` into a training series ending in December 1958 and a test series covering January 1959 onward, then save a named vector giving the two lengths (`train_n`, `test_n`) to `ex_5_1`.

**Expected result:**

```
train_n  test_n 
    120      24 
```

**Difficulty:** Intermediate

[HINTS]
A time-ordered split keeps the past for training and the most recent block for testing, never a random sample.
Use `window(..., end = c(1958, 12))` for train and `window(..., start = c(1959, 1))` for test, then `length()` each.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
ex_5_1 <- c(train_n = length(train), test_n = length(test))
ex_5_1
#> train_n  test_n 
#>     120      24 
```

**Explanation:** Time series validation must respect order: shuffling rows would leak future information into training and inflate accuracy. Ending the training set at December 1958 leaves the final two years (24 months) as a clean test window, a common 2-year holdout for monthly data. Every forecast in this section is built only from `train` and scored only against `test`, which is what makes the comparison fair.

</details>

### Exercise 5.2: Naive forecast and its RMSE

**Task:** The naive forecast carries the last observed value forward unchanged. Using the December 1958 training value as a flat prediction for all 24 test months, compute the root mean squared error against the actual test values and save a named vector of the forecast value and its RMSE (`forecast`, `rmse`) to `ex_5_2`.

**Expected result:**

```
forecast     rmse 
 337.000  137.329 
```

**Difficulty:** Intermediate

[HINTS]
A naive forecast is a single number, the most recent training observation, repeated across the whole horizon.
Build `rep(tail(train, 1), length(test))`, then RMSE is `sqrt(mean((test - forecast)^2))`.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
naive_fc <- rep(tail(train, 1), length(test))
rmse_naive <- sqrt(mean((test - naive_fc)^2))
ex_5_2 <- c(forecast = as.numeric(tail(train, 1)), rmse = rmse_naive)
ex_5_2
#> forecast     rmse 
#>  337.000  137.329 
```

**Explanation:** The naive method predicts 337 (December 1958) for every month of 1959 and 1960, ignoring both the upward trend and the summer peaks, so an RMSE near 137 passengers is large. It is deliberately simplistic, and its value is as a benchmark: any real model must beat it clearly to justify its complexity. Because `AirPassengers` is strongly seasonal, the next method, which reuses a whole year, should do far better.

</details>

### Exercise 5.3: Seasonal naive forecast and its RMSE

**Task:** For seasonal data the seasonal naive forecast repeats the last full observed year. Take the 12 monthly values of 1958 from the training set, tile them across the 24-month test horizon, and compute the RMSE against the actual test values, saving it as the named element `rmse_snaive` in `ex_5_3`.

**Expected result:**

```
rmse_snaive 
   76.99459 
```

**Difficulty:** Intermediate

[HINTS]
Instead of one number, a seasonal naive forecast repeats the most recent complete cycle across the horizon.
Grab `window(train, start = c(1958, 1))`, tile it with `rep(..., length.out = length(test))`, then take the RMSE.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
last_year <- window(train, start = c(1958, 1))
snaive_fc <- rep(as.numeric(last_year), length.out = length(test))
rmse_snaive <- sqrt(mean((test - snaive_fc)^2))
ex_5_3 <- c(rmse_snaive = rmse_snaive)
ex_5_3
#> rmse_snaive 
#>    76.99459 
```

**Explanation:** By repeating 1958's seasonal shape, the seasonal naive forecast captures the summer peaks and winter troughs the plain naive method missed, roughly halving the RMSE from 137 to 77. It still ignores the ongoing growth trend, which is why it is not perfect and why a drift or ARIMA model can improve further. For seasonal series this method, not the plain naive, is the benchmark to beat.

</details>

### Exercise 5.4: Accuracy table across naive, seasonal naive, and drift

**Task:** Put the benchmarks side by side. Forecast the 24 test months of `AirPassengers` three ways (naive, seasonal naive, and the drift method, which extends the average slope of the training series), compute RMSE and MAE for each, and save a three-row data frame with columns `method`, `RMSE`, and `MAE` to `ex_5_4`.

**Expected result:**

```
  method      RMSE       MAE
1  naive 137.32898 115.25000
2 snaive  76.99459  71.25000
3  drift 115.70350  91.61555
```

**Difficulty:** Advanced

[HINTS]
The drift slope is the total change from first to last training point divided by the number of steps between them.
Reuse the naive and seasonal naive forecasts, add `drift_fc = last + slope * (1:h)`, then assemble a `data.frame` of RMSE and MAE.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
h  <- length(test)
nn <- length(train)

naive_fc  <- rep(tail(train, 1), h)
snaive_fc <- rep(as.numeric(window(train, start = c(1958, 1))), length.out = h)
slope <- (as.numeric(tail(train, 1)) - train[1]) / (nn - 1)
drift_fc <- as.numeric(tail(train, 1)) + slope * (1:h)

rmse <- function(a, f) sqrt(mean((a - f)^2))
mae  <- function(a, f) mean(abs(a - f))

ex_5_4 <- data.frame(
  method = c("naive", "snaive", "drift"),
  RMSE = c(rmse(test, naive_fc), rmse(test, snaive_fc), rmse(test, drift_fc)),
  MAE  = c(mae(test, naive_fc),  mae(test, snaive_fc),  mae(test, drift_fc))
)
ex_5_4
#>   method      RMSE       MAE
#> 1  naive 137.32898 115.25000
#> 2 snaive  76.99459  71.25000
#> 3  drift 115.70350  91.61555
```

**Explanation:** RMSE $=\sqrt{\tfrac{1}{h}\sum_{t}(y_t-\hat y_t)^2}$ squares errors so it punishes large misses harder than MAE, the mean absolute error; reporting both guards against one metric flattering a model. Seasonal naive wins here on both scores because seasonality dominates this series, while drift beats plain naive by following the trend but cannot capture the seasonal swings. A table like this is the honest scorecard every candidate model, including the ARIMA in the next section, has to beat.

</details>

## Section 6. Reading an ARIMA fit (3 problems)

An ARIMA model is only useful if you can read its output: the coefficients, the information criteria that compare models, and the residual checks that tell you whether anything is left unexplained.

### Exercise 6.1: Fit an AR(2) to LakeHuron and read the output

**Task:** The ACF and PACF in Section 3 pointed to an AR(2) for `LakeHuron`. Fit that model with `arima()` using order `c(2, 0, 0)`, save the fitted model to `ex_6_1`, and print it so its coefficients, standard errors, and AIC are visible.

**Expected result:**

```
Call:
arima(x = LakeHuron, order = c(2, 0, 0))

Coefficients:
         ar1      ar2  intercept
      1.0436  -0.2495   579.0473
s.e.  0.0983   0.1008     0.3319

sigma^2 estimated as 0.4788:  log likelihood = -103.63,  aic = 215.27
```

**Difficulty:** Intermediate

[HINTS]
An AR(2) has two autoregressive terms, no differencing, and no moving-average terms, which is exactly what the order triple encodes.
Call `arima(LakeHuron, order = c(2, 0, 0))` and print the returned model.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- arima(LakeHuron, order = c(2, 0, 0))
ex_6_1
#> 
#> Call:
#> arima(x = LakeHuron, order = c(2, 0, 0))
#> 
#> Coefficients:
#>          ar1      ar2  intercept
#>       1.0436  -0.2495   579.0473
#> s.e.  0.0983   0.1008     0.3319
#> 
#> sigma^2 estimated as 0.4788:  log likelihood = -103.63,  aic = 215.27
```

**Explanation:** The fitted model is $y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \varepsilon_t$, with $\phi_1 = 1.04$, $\phi_2 = -0.25$, and the "intercept" 579.05 being the estimated mean level, not a regression constant. Divide each coefficient by its standard error to gauge significance: both ar terms are several standard errors from zero, so both matter. The `sigma^2`, log likelihood, and AIC summarise fit quality and are the numbers you compare against a rival model in the next problem.

</details>

### Exercise 6.2: Compare AR(1) and AR(2) by AIC

**Task:** Model selection needs a yardstick. Fit both an AR(1) and an AR(2) to `LakeHuron`, extract each model's AIC, and save a named vector (`aic_ar1`, `aic_ar2`) to `ex_6_2` so the lower, better value is easy to spot.

**Expected result:**

```
 aic_ar1  aic_ar2 
219.1959 215.2664 
```

**Difficulty:** Advanced

[HINTS]
Information criteria let you compare non-nested candidates on the same series, and lower is better.
Fit `arima(LakeHuron, order = c(1, 0, 0))` and `c(2, 0, 0)`, then pull each `AIC(...)` into a named vector.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1 <- arima(LakeHuron, order = c(1, 0, 0))
m2 <- arima(LakeHuron, order = c(2, 0, 0))
ex_6_2 <- c(aic_ar1 = AIC(m1), aic_ar2 = AIC(m2))
ex_6_2
#>  aic_ar1  aic_ar2 
#> 219.1959 215.2664 
```

**Explanation:** AIC trades goodness of fit against the number of parameters, so a lower value means a better balance, not merely a closer fit. The AR(2) scores about 215.3 versus 219.2 for the AR(1), and a gap of roughly 4 is meaningful evidence in favour of the second autoregressive term, matching the PACF signal from Exercise 3.2. Because AIC is only comparable across models fit to the same data, never compare it between the raw and a differenced or transformed series.

</details>

### Exercise 6.3: Check the AR(2) residuals for leftover autocorrelation

**Task:** A good model leaves white-noise residuals. Refit the AR(2) to `LakeHuron`, run a Box-Ljung test on its residuals at lag 10 with `fitdf = 2` to account for the two estimated ar parameters, and save a named vector of the test statistic, its degrees of freedom, and its p-value (`statistic`, `df`, `p_value`) to `ex_6_3`.

**Expected result:**

```
statistic        df   p_value 
 5.945712  8.000000  0.653313 
```

**Difficulty:** Advanced

[HINTS]
A residual test asks whether any autocorrelation survives; a large p-value means the leftovers look like white noise.
Run `Box.test(residuals(fit), lag = 10, type = "Ljung-Box", fitdf = 2)` and read `$statistic`, `$parameter`, and `$p.value`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- arima(LakeHuron, order = c(2, 0, 0))
bt <- Box.test(residuals(fit), lag = 10, type = "Ljung-Box", fitdf = 2)
ex_6_3 <- c(statistic = unname(bt$statistic),
            df = unname(bt$parameter),
            p_value = bt$p.value)
ex_6_3
#> statistic        df   p_value 
#>  5.945712  8.000000  0.653313 
```

**Explanation:** The Box-Ljung test pools autocorrelation across the first 10 residual lags into one chi-squared statistic; `fitdf = 2` subtracts the two estimated ar parameters so the degrees of freedom fall to 8. A p-value of 0.65 is far above any usual threshold, so you fail to reject the null of no residual autocorrelation: the AR(2) has captured the structure and the leftovers resemble white noise. A small p-value here would instead signal an under-fit model that needs more terms.

</details>

## What to do next

You have moved from calendars to a diagnosed ARIMA fit. Keep the momentum with these related practice sets:

- [Time Series Exercises in R](Time-Series-Exercises-in-R.html): a broader 30-problem hub spanning decomposition, ETS, ARIMA, and forecast evaluation.
- [ARIMA Exercises in R](ARIMA-Exercises-in-R.html): drill model identification, fitting, and forecasting in more depth.
- [Correlation Exercises in R](Correlation-Exercises-in-R.html): sharpen the correlation intuition that underpins the ACF and PACF.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): connect trend estimation and residual diagnostics to the regression toolkit.
