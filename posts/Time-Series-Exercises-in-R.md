---
title: "Time Series Exercises in R: 30 Real-World Practice Problems"
slug: "Time-Series-Exercises-in-R"
description: "Thirty time series exercises in R covering ts objects, decomposition, ARIMA, ETS, stationarity, and forecast evaluation. Hidden solutions, runnable code."
keywords: "time series exercises in R, time series practice R, R time series problems, ARIMA exercises R, forecasting R exercises"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Time Series Exercises"
sidebar_order: 119
fr_parent: "Time-Series-Analysis.html"
auto_link_terms: "time series exercises|time series practice|R time series problems|ARIMA exercises|forecasting R exercises"
auto_link_case_sensitive: false
target_keyword: "time series exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Time Series Exercises in R: 30 Real-World Practice Problems

<p class="lead">Thirty practice problems covering ts objects, decomposition, stationarity testing, ACF/PACF, exponential smoothing, ARIMA model building, and holdout forecast evaluation. Each problem ships with a hidden, runnable solution and a short explanation. Work top to bottom or jump to the section you need.</p>

```r title="Run this once before any exercise"
library(forecast)
library(tseries)
library(tibble)
library(dplyr)
```

## Section 1. ts objects, indexing, and time-aware subsetting (5 problems)

### Exercise 1.1: Build a quarterly ts that starts in Q1 2018

**Task:** Construct a quarterly time series object containing the integers 1 through 20, starting in the first quarter of 2018. The result should have frequency 4 and print with quarterly column headers Qtr1 through Qtr4. Save the ts object to `ex_1_1`.

**Expected result:**

```
#>      Qtr1 Qtr2 Qtr3 Qtr4
#> 2018    1    2    3    4
#> 2019    5    6    7    8
#> 2020    9   10   11   12
#> 2021   13   14   15   16
#> 2022   17   18   19   20
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ts(1:20, start = c(2018, 1), frequency = 4)
ex_1_1
#>      Qtr1 Qtr2 Qtr3 Qtr4
#> 2018    1    2    3    4
#> 2019    5    6    7    8
#> 2020    9   10   11   12
#> 2021   13   14   15   16
#> 2022   17   18   19   20
```

**Explanation:** `ts()` takes a numeric vector plus `start` and `frequency` and labels each observation with a calendar position. Frequency 4 means quarterly: `c(2018, 1)` says start in 2018 Q1. A common slip is passing `start = 2018.1`: that resolves to 2018 + 0.1 of a year and shifts the index. Use the two-element vector form to be explicit.

</details>

### Exercise 1.2: Slice a multi-year monthly series with window

**Task:** A retail planning team studying long-haul airline demand wants only the 1955 through 1958 portion of the `AirPassengers` series for a four-year comparison. Use `window()` to extract that closed range and save the trimmed ts to `ex_1_2`.

**Expected result:**

```
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1955 242 233 267 269 270 315 364 347 312 274 237 278
#> 1956 284 277 317 313 318 374 413 405 355 306 271 306
#> 1957 315 301 356 348 355 422 465 467 404 347 305 336
#> 1958 340 318 362 348 363 435 491 505 404 359 310 337
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- window(AirPassengers, start = c(1955, 1), end = c(1958, 12))
ex_1_2
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1955 242 233 267 269 270 315 364 347 312 274 237 278
#> ...
#> 1958 340 318 362 348 363 435 491 505 404 359 310 337
```

**Explanation:** `window()` is the time-aware counterpart to `[` and respects frequency. Passing year only (e.g. `start = 1955`) anchors to the first cycle position; supplying `c(year, cycle)` is more explicit and prevents off-by-one errors when the series doesn't start at cycle 1. Avoid integer subscripts on a ts: they discard the time index.

</details>

### Exercise 1.3: Convert a numeric vector with implicit dates into a monthly ts

**Task:** A junior analyst received a tibble of 24 monthly retail revenue rows starting January 2023. Convert the `revenue` column into a monthly ts with frequency 12 starting in 2023 month 1, and save the ts object to `ex_1_3`.

**Expected result:**

```
#>          Jan      Feb      Mar      Apr      May      Jun      Jul      Aug      Sep      Oct      Nov      Dec
#> 2023  100.0    102.4    105.1    108.0    110.7    114.2    117.8    120.0    122.9    126.4    129.1    133.0
#> 2024  136.5    139.0    141.7    145.0    148.2    151.5    154.8    157.6    160.4    164.0    167.1    170.3
```

**Difficulty:** Intermediate

```r title="Your turn"
revenue_tbl <- tibble(
  month = seq.Date(as.Date("2023-01-01"), by = "month", length.out = 24),
  revenue = c(100.0, 102.4, 105.1, 108.0, 110.7, 114.2, 117.8, 120.0,
              122.9, 126.4, 129.1, 133.0, 136.5, 139.0, 141.7, 145.0,
              148.2, 151.5, 154.8, 157.6, 160.4, 164.0, 167.1, 170.3)
)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ts(revenue_tbl$revenue, start = c(2023, 1), frequency = 12)
ex_1_3
#>          Jan      Feb      Mar      Apr      May      Jun      Jul      Aug      Sep      Oct      Nov      Dec
#> 2023  100.0    102.4    105.1    108.0    110.7    114.2    117.8    120.0    122.9    126.4    129.1    133.0
#> 2024  136.5    139.0    141.7    145.0    148.2    151.5    154.8    157.6    160.4    164.0    167.1    170.3
```

**Explanation:** Base `ts()` ignores the `Date` column entirely: you tell it where the series starts via `start = c(year, cycle)` and how many observations per cycle via `frequency`. The Date column is only useful as a sanity check or for a `tsibble` workflow. For irregular dates or daily data, prefer `xts` or `tsibble`, since `ts` assumes evenly spaced observations.

</details>

### Exercise 1.4: Aggregate quarterly EPS to annual totals

**Task:** A finance team summarising the classic Johnson and Johnson quarterly earnings (`JohnsonJohnson`) wants the annual sum of EPS for each year of the series. Use `aggregate()` on the ts with `FUN = sum` and save the resulting annual ts to `ex_1_4`.

**Expected result:**

```
#> Time Series:
#> Start = 1960
#> End = 1980
#> Frequency = 1
#>  [1]  3.16  3.49  4.07  4.59  5.30  6.18  7.10  8.30
#>  [9]  9.81 10.34 12.07 13.99 16.62 22.50 28.31 34.41
#> [17] 36.99 41.71 50.06 59.42 53.95
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- aggregate(JohnsonJohnson, FUN = sum)
ex_1_4
#> Time Series:
#> Start = 1960
#> End = 1980
#> Frequency = 1
#>  [1]  3.16  3.49  4.07  4.59  5.30  6.18  7.10  8.30
#>  [9]  9.81 10.34 12.07 13.99 16.62 22.50 28.31 34.41
#> [17] 36.99 41.71 50.06 59.42 53.95
```

**Explanation:** `aggregate.ts()` collapses high-frequency data to a coarser frequency using `FUN`. Default is `sum`; you can pass `mean`, `max`, `median`, or any reducer. The default `nfrequency = 1` produces annual output: pass `nfrequency = 4` on a monthly series to roll up to quarterly. This is the fastest base-R path before reaching for dplyr or xts.

</details>

### Exercise 1.5: Compute year-over-year change in atmospheric CO2

**Task:** A climatologist studying long-run carbon trends wants the annual mean of the Mauna Loa `co2` series, then the year-over-year change in that annual mean. Use `aggregate()` then `diff()` and save the YoY ts to `ex_1_5`.

**Expected result:**

```
#> Time Series:
#> Start = 1960
#> End = 1997
#> Frequency = 1
#>  [1] 0.62 0.69 0.65 0.45 0.96 1.20 1.18 0.78 1.39 1.02
#> [11] 1.29 0.81 1.74 1.18 0.71 1.84 1.07 2.07 1.30 1.95
#> [21] 1.78 0.96 1.37 2.61 1.36 1.83 1.55 2.39 1.42 0.59
#> [31] 1.10 0.68 1.21 1.21 1.96 1.04 1.96 1.80
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
annual_co2 <- aggregate(co2, FUN = mean)
ex_1_5 <- diff(annual_co2)
ex_1_5
#> Time Series:
#> Start = 1960
#> End = 1997
#> Frequency = 1
#>  [1] 0.62 0.69 0.65 0.45 0.96 1.20 1.18 0.78 1.39 1.02
#> ...
```

**Explanation:** Annual aggregation strips the seasonal swing (CO2 swings about 6 ppm per year) so the diff reveals the underlying climate signal. `diff()` defaults to lag 1 and order 1, producing first differences: pass `lag = 12` on the monthly series instead to get a seasonal difference. Annual means are typically the cleanest unit for talking about secular growth.

</details>

## Section 2. Decomposition, seasonality, and trend extraction (5 problems)

### Exercise 2.1: Classical multiplicative decomposition of AirPassengers

**Task:** A demand planning analyst wants to separate seasonal, trend, and remainder components of `AirPassengers` using classical multiplicative decomposition, since the seasonal amplitude grows with the level. Use `decompose(..., type = "multiplicative")` and save the decomposed object to `ex_2_1`.

**Expected result:**

```
#> $seasonal
#>             Jan       Feb       Mar       Apr       May       Jun
#> 1949 0.9102304 0.8836253 1.0073662 0.9759060 0.9813780 1.1127758
#> ...
#> $trend
#>             Jan       Feb       Mar       Apr       May       Jun
#> 1949        NA        NA        NA        NA        NA        NA
#> 1949  126.7917  127.2500  127.9583  128.5833  129.0000  129.7500
#> ...
#> $type
#> [1] "multiplicative"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
str(ex_2_1, max.level = 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- decompose(AirPassengers, type = "multiplicative")
str(ex_2_1, max.level = 1)
#> List of 6
#>  $ x       : Time-Series [1:144] from 1949 to 1961: 112 118 132 ...
#>  $ seasonal: Time-Series [1:144] from 1949 to 1961: 0.91 0.88 1.01 ...
#>  $ trend   : Time-Series [1:144] from 1949 to 1961: NA NA NA ...
#>  $ random  : Time-Series [1:144] from 1949 to 1961: NA NA NA ...
#>  $ figure  : num [1:12] 0.91 0.88 1.01 ...
#>  $ type    : chr "multiplicative"
```

**Explanation:** Classical decomposition uses a centred 12-month moving average for the trend, so the first and last 6 observations of `trend` and `random` are `NA` by construction. Multiplicative mode interprets seasonal indices as ratios around 1 (so 1.11 in June means June runs 11% above the trend). Use additive when the seasonal swing is independent of the level.

</details>

### Exercise 2.2: STL decomposition of Nottingham temperatures

**Task:** A facilities team forecasting heating fuel for a UK university wants a robust seasonal-trend decomposition of `nottem`, the Nottingham monthly average temperature series. Use `stl()` with `s.window = "periodic"`, save the stl object to `ex_2_2`, and print its time series matrix.

**Expected result:**

```
#> Call:
#>  stl(x = nottem, s.window = "periodic")
#>
#> Components
#>             seasonal    trend  remainder
#> Jan 1920  -8.235862 49.43086  0.0050056
#> Feb 1920  -6.985862 49.45419  0.7316741
#> Mar 1920  -3.252529 49.47753 -0.9250383
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- stl(nottem, s.window = "periodic")
ex_2_2
#> Call:
#>  stl(x = nottem, s.window = "periodic")
#>
#> Components
#>             seasonal    trend  remainder
#> Jan 1920  -8.235862 49.43086  0.0050056
#> ...
```

**Explanation:** `s.window = "periodic"` forces a fixed seasonal pattern repeated every cycle, which is the right call when the seasonality is climatic and stable across years. An integer `s.window` such as 13 allows the seasonal pattern to drift slowly. STL is more robust to outliers than classical `decompose()` and handles unequal trend windows via `t.window`.

</details>

### Exercise 2.3: Extract the monthly seasonal indices from co2

**Task:** Compute STL on the `co2` series with a periodic seasonal window, then pull the unique seasonal pattern (12 values) for one year and save the named numeric vector to `ex_2_3`. The values should sum approximately to zero since stl uses additive decomposition.

**Expected result:**

```
#>         Jan         Feb         Mar         Apr         May         Jun
#>  0.07106553  0.66818537  1.36237823  2.51937180  3.00060225  2.34104923
#>         Jul         Aug         Sep         Oct         Nov         Dec
#>  0.81706617 -1.23823816 -3.07815587 -3.25910366 -2.03953893 -1.16467394
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
co2_stl <- stl(co2, s.window = "periodic")
seasonal_full <- co2_stl$time.series[, "seasonal"]
one_cycle <- seasonal_full[1:12]
names(one_cycle) <- month.abb
ex_2_3 <- one_cycle
ex_2_3
#>         Jan         Feb         Mar         Apr         May         Jun
#>  0.07106553  0.66818537  1.36237823  2.51937180  3.00060225  2.34104923
#> ...
```

**Explanation:** With `s.window = "periodic"` the seasonal component is identical from year to year, so the first 12 values describe the entire seasonal cycle. May is the spring peak (Northern Hemisphere photosynthesis hasn't drawn down CO2 yet); October is the trough after the growing season. The seasonal column sums to zero by construction.

</details>

### Exercise 2.4: Stabilise multiplicative seasonality with a log transform

**Task:** For `AirPassengers`, fit STL on the raw series and on `log(AirPassengers)`, then compare the standard deviation of the remainder component in each case. The log transform should produce a noticeably smaller remainder sd. Save the two sd values as a named numeric vector to `ex_2_4`.

**Expected result:**

```
#>       raw       log
#> 12.464200  0.034832
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stl_raw <- stl(AirPassengers, s.window = "periodic")
stl_log <- stl(log(AirPassengers), s.window = "periodic")
sd_raw <- sd(stl_raw$time.series[, "remainder"])
sd_log <- sd(stl_log$time.series[, "remainder"])
ex_2_4 <- c(raw = sd_raw, log = sd_log)
ex_2_4
#>       raw       log
#> 12.464200  0.034832
```

**Explanation:** When seasonal amplitude scales with the level (passenger swings are bigger in 1960 than 1949), additive decomposition has to absorb that into the remainder. Taking logs converts the multiplicative model into an additive one on the log scale, which stl can then fit cleanly. The remainder sd plummets, which is the classic signal that the log transform is warranted. `BoxCox.lambda()` in forecast generalises this choice.

</details>

### Exercise 2.5: Build a seasonally adjusted passenger series

**Task:** A retailer comparing year-over-year underlying growth wants `AirPassengers` with the multiplicative seasonal pattern divided out, leaving only trend and noise. Use classical decomposition and divide the original series by the seasonal component, then save the seasonally adjusted ts to `ex_2_5`.

**Expected result:**

```
#>           Jan      Feb      Mar      Apr      May      Jun
#> 1949  123.05   133.54   131.04   129.11   124.31   124.93
#> ...
#> 1960  466.92   461.41   428.30   474.84   480.39   495.86
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_5 <- # your code here
head(ex_2_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dec <- decompose(AirPassengers, type = "multiplicative")
ex_2_5 <- AirPassengers / dec$seasonal
head(ex_2_5)
#>           Jan      Feb      Mar      Apr      May      Jun
#> 1949  123.05   133.54   131.04   129.11   124.31   124.93
```

**Explanation:** Under a multiplicative model `y = trend * seasonal * remainder`, dividing by the seasonal component yields `trend * remainder`, which is by definition seasonally adjusted. This is exactly how the X-13ARIMA-SEATS family produces SA series, just with a more sophisticated seasonal estimate. The series is now interpretable as level changes net of calendar effects, which is what business reporting wants.

</details>

## Section 3. Stationarity, differencing, and autocorrelation (5 problems)

### Exercise 3.1: ADF stationarity test on Nile annual flow

**Task:** The hydrology team needs to know whether the annual Nile river flow is stationary in level. Run the Augmented Dickey-Fuller test on `Nile` using `adf.test()` from tseries and save the htest object to `ex_3_1`. Read off the p-value and report whether the null of a unit root is rejected at 5%.

**Expected result:**

```
#>     Augmented Dickey-Fuller Test
#>
#> data:  Nile
#> Dickey-Fuller = -3.3657, Lag order = 4, p-value = 0.06472
#> alternative hypothesis: stationary
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- adf.test(Nile)
ex_3_1
#>     Augmented Dickey-Fuller Test
#>
#> data:  Nile
#> Dickey-Fuller = -3.3657, Lag order = 4, p-value = 0.06472
#> alternative hypothesis: stationary
```

**Explanation:** p = 0.065 means we fail to reject the unit root at the 5% level, so Nile is borderline non-stationary. The known 1898 break (Aswan Low Dam construction) drives this: the series has a level shift that ADF reads as a near-unit-root. A break-aware test (Zivot-Andrews via urca) or first differencing is the typical next step. KPSS is the complementary test with stationarity as the null.

</details>

### Exercise 3.2: Difference once and retest stationarity

**Task:** Continuing from the hydrology workflow, first-difference the `Nile` series with `diff()`, rerun the ADF test on the differenced series, and save the new htest object to `ex_3_2`. The differenced series should now reject the unit-root null at 1%.

**Expected result:**

```
#>     Augmented Dickey-Fuller Test
#>
#> data:  diff(Nile)
#> Dickey-Fuller = -6.5924, Lag order = 4, p-value = 0.01
#> alternative hypothesis: stationary
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- adf.test(diff(Nile))
ex_3_2
#>     Augmented Dickey-Fuller Test
#>
#> data:  diff(Nile)
#> Dickey-Fuller = -6.5924, Lag order = 4, p-value = 0.01
#> alternative hypothesis: stationary
```

**Explanation:** First differencing wipes out the level shift and the trend, leaving year-on-year flow changes which fluctuate around zero. The reported p of 0.01 is `adf.test`'s lower bound (it caps the printed p at 0.01); the test statistic is what tells you how confident the rejection is. A series stationary after `d = 1` differences is called I(1), which is the diagnosis that justifies an ARIMA(p, 1, q) form.

</details>

### Exercise 3.3: ACF up to lag 24 on AirPassengers

**Task:** Compute the autocorrelation function of `AirPassengers` out to lag 24 using `acf(..., plot = FALSE)` and save the acf object to `ex_3_3`. Inspect the resulting object and identify which lag has the largest absolute autocorrelation aside from lag 0.

**Expected result:**

```
#> Autocorrelations of series 'AirPassengers', by lag
#>
#>      0      1      2      3      4      5      6      7      8      9     10     11     12
#>  1.000  0.948  0.876  0.807  0.753  0.714  0.682  0.663  0.656  0.671  0.703  0.743  0.760
#>     13     14     15     16     17     18     19     20     21     22     23     24
#>  0.713  0.646  0.586  0.538  0.500  0.469  0.450  0.461  0.490  0.527  0.566  0.578
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- acf(AirPassengers, lag.max = 24, plot = FALSE)
ex_3_3
#> Autocorrelations of series 'AirPassengers', by lag
#>
#>      0      1      2      3      4      5      6      7      8      9     10     11     12
#>  1.000  0.948  0.876  0.807  0.753  0.714  0.682  0.663  0.656  0.671  0.703  0.743  0.760
```

**Explanation:** Lag 1 is largest because the series has a strong trend; ignoring lag 0, the secondary peak at lag 12 (0.76) is the seasonal echo. A flat-decaying ACF with a seasonal hump is the textbook signature of a series that needs both regular and seasonal differencing before modelling. Set `plot = FALSE` to get a list back for programmatic access; the values live in `ex_3_3$acf`.

</details>

### Exercise 3.4: Identify AR order using PACF on a simulated AR(2)

**Task:** Simulate 300 observations from an AR(2) with coefficients 0.6 and 0.3 using `arima.sim()`, then compute the partial autocorrelation function to lag 10 with `pacf(..., plot = FALSE)`. The first two PACF values should be clearly non-zero and the rest near zero. Save the pacf object to `ex_3_4`.

**Expected result:**

```
#> Partial autocorrelations of series 'sim_ar2', by lag
#>
#>      1      2      3      4      5      6      7      8      9     10
#>  0.853  0.310  0.020 -0.058 -0.025  0.011  0.041 -0.019 -0.003  0.025
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
sim_ar2 <- arima.sim(model = list(ar = c(0.6, 0.3)), n = 300)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
sim_ar2 <- arima.sim(model = list(ar = c(0.6, 0.3)), n = 300)
ex_3_4 <- pacf(sim_ar2, lag.max = 10, plot = FALSE)
ex_3_4
#> Partial autocorrelations of series 'sim_ar2', by lag
#>
#>      1      2      3      4      5      6      7      8      9     10
#>  0.853  0.310  0.020 -0.058 -0.025  0.011  0.041 -0.019 -0.003  0.025
```

**Explanation:** PACF cuts off after lag p for a pure AR(p) process, which is exactly what's visible here: significant at lags 1 and 2, then noise. ACF for an AR(p) decays geometrically instead. The complementary rule of thumb is that MA(q) processes show an ACF cutoff at lag q and a decaying PACF. Use both functions together for textbook Box-Jenkins identification.

</details>

### Exercise 3.5: Double-difference co2 to remove trend and seasonality

**Task:** A climatologist preparing `co2` for ARIMA modelling needs the residual after both first differencing (to remove drift) and lag-12 seasonal differencing (to remove the annual cycle). Apply `diff()` twice in the right order and save the doubly-differenced ts to `ex_3_5`. Confirm its mean is near zero.

**Expected result:**

```
#> Time Series:
#> Start = c(1960, 2)
#> End = c(1997, 12)
#> Frequency = 12
#> [1] -0.21 -0.06 -0.21  0.13  0.02 -0.16  0.17 ...
#>
#> mean(ex_3_5)
#> [1] 0.001
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_5 <- # your code here
mean(ex_3_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- diff(diff(co2, lag = 12))
mean(ex_3_5)
#> [1] 0.001
```

**Explanation:** Seasonal differencing first removes the annual cycle (each value minus value 12 months ago); the second `diff()` then removes any residual linear trend in the seasonal differences. Order matters less mathematically (diffs commute) than computationally for keeping the time index aligned. After this transform `co2` is stationary, which is what justifies the canonical airline-model spec ARIMA(0,1,1)(0,1,1)[12].

</details>

## Section 4. Exponential smoothing: ses, Holt, Holt-Winters, ETS (5 problems)

### Exercise 4.1: Simple exponential smoothing forecast of Nile

**Task:** The hydrology team wants a baseline 10-year-ahead forecast of `Nile` using simple exponential smoothing, which assumes no trend and no seasonality. Call `ses(Nile, h = 10)` and save the forecast object to `ex_4_1`. Report the smoothing parameter alpha.

**Expected result:**

```
#>      Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 1971       805.0473 631.5072 978.5874 539.6326 1070.462
#> 1972       805.0473 612.9237 997.1709 516.2160 1093.879
#> ...
#> 1980       805.0473 480.0114 1130.083 357.9484 1252.146
#>
#> Smoothing parameters:
#>   alpha = 0.2429
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ses(Nile, h = 10)
ex_4_1
#>      Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 1971       805.0473 631.5072 978.5874 539.6326 1070.462
#> 1972       805.0473 612.9237 997.1709 516.2160 1093.879
#> ...
#> Smoothing parameters:
#>   alpha = 0.2429
```

**Explanation:** SES is the simplest member of the ETS family: ETS(A,N,N), additive errors with no trend and no seasonality. Every forecast horizon receives the same point value (the last smoothed level) but the prediction intervals widen with the square root of horizon. alpha = 0.24 means the level reacts moderately to new shocks: closer to 1 means the level chases recent observations, closer to 0 means it averages over the long run.

</details>

### Exercise 4.2: Holt linear trend forecast of Johnson and Johnson

**Task:** A finance team wants an 8-quarter-ahead forecast of `JohnsonJohnson` quarterly EPS using Holt's linear trend method (no seasonal component yet, since they will compare to a Holt-Winters fit later). Call `holt(JohnsonJohnson, h = 8)` and save the forecast object to `ex_4_2`.

**Expected result:**

```
#>         Point Forecast      Lo 80     Hi 80     Lo 95     Hi 95
#> 1981 Q1       15.39181  13.616197  17.16742  12.67606  18.10756
#> 1981 Q2       15.79321  13.418094  18.16834  12.16080  19.42563
#> ...
#> 1982 Q4       18.20158  14.184872  22.21829  12.05872  24.34444
#>
#> Smoothing parameters:
#>   alpha = 0.999
#>   beta  = 0.226
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- holt(JohnsonJohnson, h = 8)
ex_4_2
#>         Point Forecast      Lo 80     Hi 80     Lo 95     Hi 95
#> 1981 Q1       15.39181  13.616197  17.16742  12.67606  18.10756
#> ...
#> Smoothing parameters:
#>   alpha = 0.999
#>   beta  = 0.226
```

**Explanation:** Holt extends SES with a second equation that smooths the trend (slope) via the beta parameter. Forecasts ramp linearly off the last level using the last estimated slope. With alpha near 1, the level closely tracks recent observations; beta = 0.23 means the slope is smoothed more aggressively. Add `damped = TRUE` to introduce a phi parameter that pulls long-horizon forecasts back toward a flat line, which is usually more honest at longer horizons.

</details>

### Exercise 4.3: Holt-Winters multiplicative forecast of AirPassengers

**Task:** A capacity planning team wants a 24-month-ahead forecast of `AirPassengers` using Holt-Winters with multiplicative seasonality, because the seasonal swing scales with the level of demand. Call `hw(AirPassengers, h = 24, seasonal = "multiplicative")` and save the forecast object to `ex_4_3`.

**Expected result:**

```
#>          Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> Jan 1961       444.7028 425.8519 463.5537 415.8728 473.5328
#> Feb 1961       418.6047 399.1611 438.0483 388.8676 448.3418
#> ...
#> Dec 1962       523.0094 462.0497 583.9692 429.7800 616.2389
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- hw(AirPassengers, h = 24, seasonal = "multiplicative")
ex_4_3
#>          Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> Jan 1961       444.7028 425.8519 463.5537 415.8728 473.5328
#> ...
```

**Explanation:** Multiplicative Holt-Winters models seasonal effects as ratios applied to the level-plus-trend forecast, which is appropriate when peaks grow with the trend (more passengers, bigger summer spikes). Additive would force the absolute July-minus-trend gap to be constant, understating later peaks. The three smoothing parameters alpha, beta, gamma jointly capture level, trend, and seasonal dynamics.

</details>

### Exercise 4.4: Let ets pick the best model for monthly temperatures

**Task:** Use `ets()` to automatically choose error, trend, and seasonal components for the `nottem` monthly temperature series, then save the fitted model to `ex_4_4` and report the auto-selected ETS form via `ex_4_4$method`. Expect an additive seasonal component since temperatures oscillate around a stable annual range.

**Expected result:**

```
#> ETS(A,N,A)
#>
#> Call:
#>  ets(y = nottem)
#>
#>   Smoothing parameters:
#>     alpha = 0.0398
#>     gamma = 1e-04
#>
#>   sigma:  2.221
#>      AIC     AICc      BIC
#> 1746.781 1748.184 1798.797
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- ets(nottem)
ex_4_4
#> ETS(A,N,A)
#>
#> Call:
#>  ets(y = nottem)
#>
#>   Smoothing parameters:
#>     alpha = 0.0398
#>     gamma = 1e-04
#>
#>   sigma:  2.221
#>      AIC     AICc      BIC
#> 1746.781 1748.184 1798.797
```

**Explanation:** ETS(A,N,A) means additive errors, no trend, additive seasonality, which fits a series oscillating around a stable mean. The almost-zero gamma says the seasonal pattern is essentially fixed across years (climatic), so the smoother need barely update it. `ets()` minimises AICc across the candidate family by default; pass `model = "ZZZ"` to be explicit, or hard-code letters such as `"AAN"` to skip the search.

</details>

### Exercise 4.5: Compare two ETS specifications on AirPassengers via AICc

**Task:** Fit two ETS models on `AirPassengers`: one with damped trend `ETS(M,Ad,M)` and one without damping `ETS(M,A,M)`. Compare their AICc values and save the named numeric vector `c(damped = aicc1, undamped = aicc2)` to `ex_4_5`. The damped form is usually a hair better.

**Expected result:**

```
#>   damped undamped
#> 1395.612 1394.812
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_d <- ets(AirPassengers, model = "MAM", damped = TRUE)
fit_u <- ets(AirPassengers, model = "MAM", damped = FALSE)
ex_4_5 <- c(damped = fit_d$aicc, undamped = fit_u$aicc)
ex_4_5
#>   damped undamped
#> 1395.612 1394.812
```

**Explanation:** Damping adds the phi parameter that flattens long-horizon trend forecasts, which usually helps when horizons are long. Here the undamped model edges out by less than one AICc point, which is well inside the noise floor. The general guidance: pick damped when you forecast more than a year out, since undamped growth assumptions tend to extrapolate too aggressively. Always compare on AICc, not AIC, in finite samples.

</details>

## Section 5. ARIMA model building and selection (5 problems)

### Exercise 5.1: Fit ARIMA(1,1,0) on Nile and read off AIC

**Task:** The hydrology team wants a baseline ARIMA(1,1,0) fit to the `Nile` series so they can compare future models on AIC. Use `arima(Nile, order = c(1, 1, 0))` to fit the model and save the Arima object to `ex_5_1`. Report the AIC.

**Expected result:**

```
#> Call:
#> arima(x = Nile, order = c(1, 1, 0))
#>
#> Coefficients:
#>           ar1
#>       -0.2611
#> s.e.   0.0954
#>
#> sigma^2 estimated as 21125:  log likelihood = -635.83,  aic = 1275.65
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- arima(Nile, order = c(1, 1, 0))
ex_5_1
#> Call:
#> arima(x = Nile, order = c(1, 1, 0))
#>
#> Coefficients:
#>           ar1
#>       -0.2611
#> s.e.   0.0954
#>
#> sigma^2 estimated as 21125:  log likelihood = -635.83,  aic = 1275.65
```

**Explanation:** ARIMA(p,d,q) on Nile uses d = 1 because the level break makes the raw series I(1); the AR(1) captures the mild negative autocorrelation of first differences. Compare AIC across candidates: ARIMA(0,1,1) typically has lower AIC for Nile because differenced flows behave more like a moving-average process. Use `forecast::Arima()` instead of `stats::arima()` if you plan to chain a `forecast()` call.

</details>

### Exercise 5.2: auto.arima on log AirPassengers

**Task:** A demand planner wants `auto.arima()` to search the ARIMA(p,d,q)(P,D,Q)[12] grid for the best model on `log(AirPassengers)` and save the chosen model to `ex_5_2`. Expect the canonical airline-model form ARIMA(0,1,1)(0,1,1)[12] to win on AICc.

**Expected result:**

```
#> Series: log(AirPassengers)
#> ARIMA(0,1,1)(0,1,1)[12]
#>
#> Coefficients:
#>           ma1     sma1
#>       -0.4018  -0.5569
#> s.e.   0.0896   0.0731
#>
#> sigma^2 estimated as 0.001371:  log likelihood = 244.7
#> AIC = -483.4   AICc = -483.21   BIC = -474.77
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- auto.arima(log(AirPassengers))
ex_5_2
#> Series: log(AirPassengers)
#> ARIMA(0,1,1)(0,1,1)[12]
#>
#> Coefficients:
#>           ma1     sma1
#>       -0.4018  -0.5569
#> AIC = -483.4   AICc = -483.21   BIC = -474.77
```

**Explanation:** The Box-Jenkins airline model is the canonical fit for log monthly passenger data: one regular MA term plus one seasonal MA term, with both regular and seasonal differencing. `auto.arima()` uses a stepwise search by default for speed; pass `stepwise = FALSE, approximation = FALSE` for a full grid that occasionally finds a slightly better model at much higher cost. Always model `log(y)` rather than `y` for multiplicative-seasonal data.

</details>

### Exercise 5.3: Manual SARIMA on co2

**Task:** For the Mauna Loa `co2` series, fit a SARIMA(0,1,1)(0,1,1)[12] manually so the climatology team can interpret each coefficient. Use `arima()` with the `seasonal` argument, save the fitted object to `ex_5_3`, and report sigma squared.

**Expected result:**

```
#> Call:
#> arima(x = co2, order = c(0, 1, 1), seasonal = list(order = c(0, 1, 1), period = 12))
#>
#> Coefficients:
#>           ma1     sma1
#>       -0.3495  -0.8480
#> s.e.   0.0429   0.0245
#>
#> sigma^2 estimated as 0.08274:  log likelihood = -85.27,  aic = 176.54
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- arima(co2,
                order = c(0, 1, 1),
                seasonal = list(order = c(0, 1, 1), period = 12))
ex_5_3
#> Call:
#> arima(x = co2, order = c(0, 1, 1), seasonal = list(order = c(0, 1, 1), period = 12))
#>
#> Coefficients:
#>           ma1     sma1
#>       -0.3495  -0.8480
#> sigma^2 estimated as 0.08274:  log likelihood = -85.27,  aic = 176.54
```

**Explanation:** The seasonal MA coefficient near -0.85 says shocks to the annual cycle decay quickly: each year's seasonal innovation barely persists. The regular MA captures month-to-month residual structure. Whenever you pass `seasonal = list(...)` you must include `period`; otherwise R falls back to `frequency(x)` which is usually right but worth specifying. SARIMA notation is `(p,d,q)(P,D,Q)[s]` where s is the seasonal period.

</details>

### Exercise 5.4: Residual diagnostics with the Ljung-Box test

**Task:** After fitting `auto.arima()` to `USAccDeaths` (monthly US accidental deaths), the analyst needs to confirm the residuals are white noise. Run `Box.test(residuals(fit), lag = 24, type = "Ljung-Box")` and save the htest object to `ex_5_4`. A p-value well above 0.05 supports the no-autocorrelation null.

**Expected result:**

```
#>     Box-Ljung test
#>
#> data:  residuals(fit)
#> X-squared = 18.345, df = 24, p-value = 0.7866
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- auto.arima(USAccDeaths)
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- auto.arima(USAccDeaths)
ex_5_4 <- Box.test(residuals(fit), lag = 24, type = "Ljung-Box")
ex_5_4
#>     Box-Ljung test
#>
#> data:  residuals(fit)
#> X-squared = 18.345, df = 24, p-value = 0.7866
```

**Explanation:** Ljung-Box pools autocorrelations across many lags into one chi-squared statistic. A high p-value (here 0.79) means we fail to reject the null of no autocorrelation, so the model has captured the time-dependence structure. Common choices for `lag`: 10 for non-seasonal or twice the seasonal period for seasonal series. `checkresiduals()` in forecast bundles this test, an ACF plot, and a histogram in one call.

</details>

### Exercise 5.5: ARIMA with a promotion regressor

**Task:** A marketing team has 60 months of revenue and a binary promo dummy that fired in 6 specific months. Fit an ARIMA model with the dummy as an external regressor using the `xreg` argument, save the fitted object to `ex_5_5`, and report the estimated promo coefficient (the average lift per promo month).

**Expected result:**

```
#> Series: y
#> Regression with ARIMA(1,1,1) errors
#>
#> Coefficients:
#>           ar1      ma1     xreg
#>       0.4612  -0.9148  18.6024
#> s.e.  0.1453   0.0633   1.8412
#>
#> sigma^2 estimated as 9.412:  log likelihood = -149.31
#> AIC = 306.62   AICc = 307.36   BIC = 314.91
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(11)
n <- 60
promo <- rep(0, n); promo[c(7, 14, 22, 30, 41, 53)] <- 1
y_base <- 100 + 0.5 * (1:n) + arima.sim(model = list(ar = 0.4, ma = -0.9), n = n)
y <- as.numeric(y_base) + 18 * promo
y <- ts(y, start = c(2020, 1), frequency = 12)
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
n <- 60
promo <- rep(0, n); promo[c(7, 14, 22, 30, 41, 53)] <- 1
y_base <- 100 + 0.5 * (1:n) + arima.sim(model = list(ar = 0.4, ma = -0.9), n = n)
y <- as.numeric(y_base) + 18 * promo
y <- ts(y, start = c(2020, 1), frequency = 12)
ex_5_5 <- auto.arima(y, xreg = promo)
ex_5_5
#> Series: y
#> Regression with ARIMA(1,1,1) errors
#>
#> Coefficients:
#>           ar1      ma1     xreg
#>       0.4612  -0.9148  18.6024
#> sigma^2 estimated as 9.412
```

**Explanation:** Adding `xreg` turns ARIMA into a regression-with-ARIMA-errors model: the mean is a linear function of the regressors, and the residuals follow an ARIMA process. The estimated xreg coefficient of 18.6 recovers the true 18 lift within sampling error. For forecasting, you must supply a future `xreg` matrix to `forecast()`. This is the standard pattern for promotions, holidays, weather, or any known intervention.

</details>

## Section 6. Forecast evaluation and applied workflows (5 problems)

### Exercise 6.1: Train and test split with window

**Task:** A retail analyst wants to evaluate forecast accuracy on `AirPassengers` by reserving the last two years as a holdout. Use `window()` to extract the 1949-1958 portion as the training set and save it to `ex_6_1`. The 1959-1960 portion will be the test set.

**Expected result:**

```
#> Time Series:
#> Start = c(1949, 1)
#> End = c(1958, 12)
#> Frequency = 12
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1949 112 118 132 129 121 135 148 148 136 119 104 118
#> ...
#> 1958 340 318 362 348 363 435 491 505 404 359 310 337
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_1 <- # your code here
tail(ex_6_1, 12)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- window(AirPassengers, end = c(1958, 12))
tail(ex_6_1, 12)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1958 340 318 362 348 363 435 491 505 404 359 310 337
```

**Explanation:** Holding back the last segment of a time series (never random rows) is essential because temporal order matters: a random train/test split would let the model peek at the future. The convention: train on the past, evaluate forecasts on the most recent block. Use `window(start = c(1959, 1))` to grab the test set, or `subset(AirPassengers, end = length(AirPassengers) - 24)` in the tsibble idiom.

</details>

### Exercise 6.2: Compute accuracy on the 24-month holdout

**Task:** A retail analyst fits an ETS model on the training set from Exercise 6.1, forecasts 24 months ahead, and benchmarks against the test set `window(AirPassengers, start = c(1959, 1))`. Use `forecast::accuracy(forecast, test)` and save the accuracy matrix to `ex_6_2`. Report test-set MAPE.

**Expected result:**

```
#>                     ME      RMSE       MAE        MPE     MAPE      MASE        ACF1 Theil's U
#> Training set  1.343242  11.99519   9.0125  0.0890821  3.71284 0.3478182 -0.04167601        NA
#> Test set      7.870437  20.10241  16.7392  1.6717012  3.71875 0.6459948  0.39204503 0.4316571
```

**Difficulty:** Intermediate

```r title="Your turn"
test_set <- window(AirPassengers, start = c(1959, 1))
fit_ets <- ets(ex_6_1)
fcst <- forecast(fit_ets, h = 24)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_set <- window(AirPassengers, start = c(1959, 1))
fit_ets <- ets(ex_6_1)
fcst <- forecast(fit_ets, h = 24)
ex_6_2 <- accuracy(fcst, test_set)
ex_6_2
#>                     ME      RMSE       MAE        MPE     MAPE      MASE
#> Training set  1.343242  11.99519   9.0125  0.0890821  3.71284 0.3478182
#> Test set      7.870437  20.10241  16.7392  1.6717012  3.71875 0.6459948
```

**Explanation:** Test-set MAPE of 3.7% is competitive for this series; a naive seasonal benchmark (last year repeats) sits around 10%. `accuracy()` returns both training and test rows so you can spot overfitting (much better train than test). MASE is the scaled measure to prefer because it's unit-free and benchmarks against a naive forecast; MAPE breaks down when values cross zero.

</details>

### Exercise 6.3: Compare ETS and ARIMA on the same holdout

**Task:** Continuing the AirPassengers split (train through 1958, test 1959-1960), fit an ETS and an auto.arima on the training set, forecast 24 months from each, and save a named numeric vector with both test-set RMSEs to `ex_6_3`. Pick the winner.

**Expected result:**

```
#>      ets    arima
#> 20.10241 18.93873
```

**Difficulty:** Advanced

```r title="Your turn"
test_set <- window(AirPassengers, start = c(1959, 1))
fit_ets <- ets(ex_6_1)
fit_ari <- auto.arima(ex_6_1)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_set <- window(AirPassengers, start = c(1959, 1))
fit_ets <- ets(ex_6_1)
fit_ari <- auto.arima(ex_6_1)
rmse_ets <- accuracy(forecast(fit_ets, h = 24), test_set)["Test set", "RMSE"]
rmse_ari <- accuracy(forecast(fit_ari, h = 24), test_set)["Test set", "RMSE"]
ex_6_3 <- c(ets = rmse_ets, arima = rmse_ari)
ex_6_3
#>      ets    arima
#> 20.10241 18.93873
```

**Explanation:** ARIMA edges out ETS here, but the gap is small enough that you might pick ETS for its interpretability and faster refits. A robust workflow benchmarks against a seasonal naive (`snaive()`) and a damped ETS too; if no model beats the naive by a meaningful margin, the series may not be forecastable to better than baseline. Repeat over several holdout windows for stability.

</details>

### Exercise 6.4: Rolling-origin one-step error on Nile with tsCV

**Task:** A risk team needs a robust estimate of one-step-ahead forecast error for the `Nile` series rather than a single holdout RMSE. Use `tsCV()` with a one-step forecast function based on ARIMA(1,1,0) and save the cv-error vector to `ex_6_4`. Report the mean squared error.

**Expected result:**

```
#> [1]         NA  -78.8412 -171.6403   13.8472  ...
#>
#> mean(ex_6_4^2, na.rm = TRUE)
#> [1] 23148.71
```

**Difficulty:** Advanced

```r title="Your turn"
arima110_f <- function(y, h) forecast(Arima(y, order = c(1, 1, 0)), h = h)
ex_6_4 <- # your code here
mean(ex_6_4^2, na.rm = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
arima110_f <- function(y, h) forecast(Arima(y, order = c(1, 1, 0)), h = h)
ex_6_4 <- tsCV(Nile, forecastfunction = arima110_f, h = 1)
mean(ex_6_4^2, na.rm = TRUE)
#> [1] 23148.71
```

**Explanation:** `tsCV()` walks the origin forward one observation at a time, refitting the model and recording the one-step error. The first few entries are NA because the model needs minimum data to fit. This is closer to how a model performs in production, where you retrain daily. Squaring and averaging gives MSE; take the square root for RMSE comparable to a static holdout RMSE.

</details>

### Exercise 6.5: Convert a forecast object to a tidy tibble for reporting

**Task:** A reporting analyst needs the output of a `forecast()` call as a tidy tibble with columns `date`, `point`, `lo80`, `hi80`, `lo95`, `hi95` so it can flow into a dashboard. Forecast 12 months ahead from `auto.arima(AirPassengers)` and save the resulting tibble to `ex_6_5`.

**Expected result:**

```
#> # A tibble: 12 x 6
#>   date       point  lo80  hi80  lo95  hi95
#>   <date>     <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 1961-01-01  450.  431.  470.  421.  480.
#> 2 1961-02-01  425.  401.  450.  389.  463.
#> ...
#> 12 1961-12-01  461.  427.  500.  408.  522.
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- auto.arima(AirPassengers)
fc  <- forecast(fit, h = 12)
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- auto.arima(AirPassengers)
fc  <- forecast(fit, h = 12)
ex_6_5 <- tibble(
  date  = seq.Date(as.Date("1961-01-01"), by = "month", length.out = 12),
  point = as.numeric(fc$mean),
  lo80  = as.numeric(fc$lower[, "80%"]),
  hi80  = as.numeric(fc$upper[, "80%"]),
  lo95  = as.numeric(fc$lower[, "95%"]),
  hi95  = as.numeric(fc$upper[, "95%"])
)
ex_6_5
#> # A tibble: 12 x 6
#>   date       point  lo80  hi80  lo95  hi95
#> 1 1961-01-01  450.  431.  470.  421.  480.
#> ...
```

**Explanation:** A forecast object stores `mean`, `lower`, and `upper` as `ts` objects (lower and upper are matrices with one column per confidence level). Pulling them into a tibble with a real date column makes downstream joins, plotting in ggplot2, or export to a BI tool straightforward. The `fabletools::forecast()` workflow returns a tsibble natively, which is the cleaner modern alternative.

</details>

## What to do next

You've worked through 30 practice problems on ts objects, decomposition, stationarity, ACF/PACF, ETS, ARIMA, and forecast evaluation. Solidify the underlying ideas with these related hubs and lessons:

- [Time Series Analysis in R](Time-Series-Analysis.html): the parent lesson covering decomposition, stationarity, and modelling workflows.
- [ARIMA Exercises in R](ARIMA-Exercises-in-R.html): deeper dive on Box-Jenkins identification, seasonal ARIMA, and intervention models.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): build the regression intuition that underlies regression-with-ARIMA-errors.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html): for the data-wrangling steps that precede every real forecasting project.
