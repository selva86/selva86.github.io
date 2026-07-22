---
title: "Time Series in R Exercises: 50 Real-World Practice Problems"
slug: "Time-Series-in-R-Exercises"
description: "Fifty time series in R exercises covering ts objects, decomposition, stationarity, ACF, ARIMA, smoothing and forecast backtesting. Hidden solutions included."
keywords: "time series in r exercises, R time series practice problems, ts object exercises R, ARIMA exercises R, forecast accuracy exercises R"
mathjax: false
webr: true
date: "2026-07-22"
post_type: "EX"
sidebar_title: "Time Series in R Exercises"
sidebar_order: 108
fr_parent: "Time-Series-Analysis-With-R.html"
auto_link_terms: "time series in r exercises|time series practice problems|ts object exercises|arima practice problems|forecast accuracy exercises"
auto_link_case_sensitive: false
target_keyword: "time series in r exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Time Series in R Exercises: 50 Real-World Practice Problems

<p class="lead">Fifty problems that walk the full forecasting workflow: building and slicing <code>ts</code> objects, aggregating and differencing, decomposing seasonality, testing stationarity, fitting exponential smoothing and ARIMA models, then measuring how well those models actually forecast. Every solution is hidden until you click, and every one runs.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(forecast)
library(tseries)
```

## Section 1. Building and inspecting ts objects (8 problems)

### Exercise 1.1: Build a quarterly ts that starts in Q1 2019

**Task:** Construct a quarterly time series object holding the integers 1 through 24, with the first observation falling in the first quarter of 2019. The printed object should show four quarterly columns and six year rows. Save it to `ex_1_1`.

**Expected result:**

```
#>      Qtr1 Qtr2 Qtr3 Qtr4
#> 2019    1    2    3    4
#> 2020    5    6    7    8
#> 2021    9   10   11   12
#> 2022   13   14   15   16
#> 2023   17   18   19   20
#> 2024   21   22   23   24
```

**Difficulty:** Beginner

[HINTS]
A plain numeric vector has no calendar attached. You need the constructor that bolts a start period and a periods-per-year count onto it.
Use `ts(1:24, start = c(2019, 1), frequency = 4)`; the `c(year, period)` pair sets the calendar origin.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ts(1:24, start = c(2019, 1), frequency = 4)
ex_1_1
#>      Qtr1 Qtr2 Qtr3 Qtr4
#> 2019    1    2    3    4
#> 2020    5    6    7    8
#> 2021    9   10   11   12
#> 2022   13   14   15   16
#> 2023   17   18   19   20
#> 2024   21   22   23   24
```

**Explanation:** `frequency` is the number of observations in one natural cycle, so 4 means quarterly and 12 means monthly. The `start` argument takes `c(year, period_within_year)`, not a date. Once R knows the frequency it prints the quarterly grid for free and every downstream function (`window`, `aggregate`, `decompose`) inherits that calendar. A common mistake is passing `start = 2019` alone, which silently assumes period 1 and works here but breaks the moment your series starts mid-year.

</details>

### Exercise 1.2: Start a monthly subscriber series in July 2021

**Task:** A subscription business has 12 months of subscriber counts beginning in July 2021: 1210, 1265, 1302, 1288, 1341, 1399, 1452, 1470, 1519, 1588, 1602, 1655. Turn them into a monthly time series that starts in the correct month and save it to `ex_1_2`.

**Expected result:**

```
#>       Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
#> 2021                               1210 1265 1302 1288 1341 1399
#> 2022 1452 1470 1519 1588 1602 1655
```

**Difficulty:** Beginner

[HINTS]
The series does not begin in January, so the first calendar row will be padded with blanks on the left.
Pass `start = c(2021, 7)` with `frequency = 12`; period 7 is July.

```r title="Your turn"
subs <- c(1210, 1265, 1302, 1288, 1341, 1399, 1452, 1470, 1519, 1588, 1602, 1655)

ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
subs <- c(1210, 1265, 1302, 1288, 1341, 1399, 1452, 1470, 1519, 1588, 1602, 1655)

ex_1_2 <- ts(subs, start = c(2021, 7), frequency = 12)
ex_1_2
#>       Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
#> 2021                               1210 1265 1302 1288 1341 1399
#> 2022 1452 1470 1519 1588 1602 1655
```

**Explanation:** The blanks in 2021 and 2022 are not missing values; the print method simply lays every series out on a full January-to-December grid, so partial first and last years look ragged. This is the single most common source of off-by-one bugs in R time series work: if you had written `start = c(2021, 1)`, every observation would sit six months early and your seasonal model would learn the wrong month effects. Check `start()` and `end()` after constructing anything.

</details>

### Exercise 1.3: Pull the calendar metadata out of AirPassengers

**Task:** Before modelling any series you inherit, you should know its shape. Extract the frequency, start year and period, end year and period, and the total number of observations from the built-in `AirPassengers` dataset into a single named numeric vector, and save it to `ex_1_3`.

**Expected result:**

```
#>         freq   start_year start_period     end_year   end_period            n
#>           12         1949            1         1960           12          144
```

**Difficulty:** Beginner

[HINTS]
There are dedicated accessor functions for the calendar attributes; two of them return a two-element vector rather than a single number.
Combine `frequency()`, `start()`, `end()` and `length()` with `c()`, indexing `start()` and `end()` with `[1]` and `[2]`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- c(freq = frequency(AirPassengers),
            start_year = start(AirPassengers)[1],
            start_period = start(AirPassengers)[2],
            end_year = end(AirPassengers)[1],
            end_period = end(AirPassengers)[2],
            n = length(AirPassengers))
ex_1_3
#>         freq   start_year start_period     end_year   end_period            n
#>           12         1949            1         1960           12          144
```

**Explanation:** `start()` and `end()` return `c(year, period)` pairs, which is why the `[1]` and `[2]` indexing is needed. The arithmetic should tie out: 12 years times 12 months is 144 observations, so there are no gaps. If `length()` disagrees with what the start and end dates imply, you have a ragged or irregular series and every seasonal method will misbehave. `tsp(AirPassengers)` gives the same information in one shot as `c(start_time, end_time, frequency)` in decimal years.

</details>

### Exercise 1.4: Slice three years out of a monthly series with window

**Task:** An analyst reviewing the mid-1950s only needs the months from January 1955 through December 1957 from the `AirPassengers` series. Extract that span while keeping the result a proper monthly time series, and save it to `ex_1_4`.

**Expected result:**

```
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1955 242 233 267 269 270 315 364 347 312 274 237 278
#> 1956 284 277 317 313 318 374 413 405 355 306 271 306
#> 1957 315 301 356 348 355 422 465 467 404 347 305 336
```

**Difficulty:** Beginner

[HINTS]
Ordinary bracket subsetting on a ts strips the calendar and hands you back a bare vector. You want the calendar-aware alternative.
Use `window(AirPassengers, start = c(1955, 1), end = c(1957, 12))`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- window(AirPassengers, start = c(1955, 1), end = c(1957, 12))
ex_1_4
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1955 242 233 267 269 270 315 364 347 312 274 237 278
#> 1956 284 277 317 313 318 374 413 405 355 306 271 306
#> 1957 315 301 356 348 355 422 465 467 404 347 305 336
```

**Explanation:** `AirPassengers[73:108]` returns the same 36 numbers but as a plain vector with no frequency, so `decompose()` and `forecast()` would then refuse to run or would treat the data as annual. `window()` preserves the `tsp` attribute, which is why the result still prints as a month grid. This is also the idiomatic way to carve a training set out of a series: `window(x, end = c(1958, 12))` for train, `window(x, start = c(1959, 1))` for test.

</details>

### Exercise 1.5: Turn a ts into a tidy year and month tibble

**Task:** To join atmospheric readings against other tables you first need them in rectangular form. Convert the built-in `co2` series into a tibble with an integer `year` column, an integer `month` column, and a numeric `ppm` column, then keep only the first 8 rows and save the result to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 8 x 3
#>    year month   ppm
#>   <int> <int> <dbl>
#> 1  1959     1  315.
#> 2  1959     2  316.
#> 3  1959     3  316.
#> 4  1959     4  318.
#> 5  1959     5  318.
#> 6  1959     6  318
#> 7  1959     7  316.
#> 8  1959     8  315.
```

**Difficulty:** Intermediate

[HINTS]
Two accessor functions decode a ts index: one returns the decimal time, the other returns the position inside the seasonal cycle.
`floor(time(co2))` gives the year and `cycle(co2)` gives the month number; wrap both in `as.integer()`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- tibble(year = as.integer(floor(time(co2))),
                 month = as.integer(cycle(co2)),
                 ppm = as.numeric(co2)) |>
  head(8)
ex_1_5
#> # A tibble: 8 x 3
#>    year month   ppm
#>   <int> <int> <dbl>
#> 1  1959     1  315.
#> 2  1959     2  316.
#> 3  1959     3  316.
#> 4  1959     4  318.
#> 5  1959     5  318.
#> 6  1959     6  318
#> 7  1959     7  316.
#> 8  1959     8  315.
```

**Explanation:** `time()` returns decimal years (1959.000, 1959.083, ...) so flooring it yields the calendar year, while `cycle()` returns the position within the cycle, which for a monthly series is the month number. `as.numeric()` on the series strips the ts attributes so the tibble stores plain doubles. Going ts to tibble like this is the standard bridge into dplyr and ggplot2 work; going back the other way is just `ts(df$ppm, start = c(1959, 1), frequency = 12)`.

</details>

### Exercise 1.6: Inspect the structure of a multivariate ts

**Task:** The `EuStockMarkets` dataset bundles four European indices into one multivariate series. Report its dimensions, its column names, its frequency, and its start position as a named list so a colleague can see the shape at a glance, and save that list to `ex_1_6`.

**Expected result:**

```
#> $dim
#> [1] 1860    4
#>
#> $series
#> [1] "DAX"  "SMI"  "CAC"  "FTSE"
#>
#> $freq
#> [1] 260
#>
#> $start
#> [1] 1991  130
```

**Difficulty:** Intermediate

[HINTS]
A multivariate series is a matrix that also carries ts attributes, so both matrix accessors and ts accessors apply to it.
Build a `list()` from `dim()`, `colnames()`, `frequency()` and `start()`.

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- list(dim = dim(EuStockMarkets),
               series = colnames(EuStockMarkets),
               freq = frequency(EuStockMarkets),
               start = start(EuStockMarkets))
ex_1_6
#> $dim
#> [1] 1860    4
#>
#> $series
#> [1] "DAX"  "SMI"  "CAC"  "FTSE"
#>
#> $freq
#> [1] 260
#>
#> $start
#> [1] 1991  130
```

**Explanation:** An `mts` object is stored as a matrix with a `tsp` attribute, which is why `dim()` and `colnames()` work alongside `frequency()`. The frequency of 260 encodes trading days per year rather than calendar days, a convention worth checking before you trust any seasonal method on financial data. To pull one index out and keep it a series, use `EuStockMarkets[, "DAX"]`, and to bind separate series back into an `mts`, use `ts.union()`, which aligns on the calendar and pads with `NA` instead of recycling.

</details>

### Exercise 1.7: Expose gaps in an irregular daily meter series

**Task:** A utility receives smart-meter reads only on the days a device successfully connects, so the daily log is irregular. Build the complete run of daily dates from the first to the last read, join the observed values onto it so that missing days appear as `NA`, and save the resulting tibble to `ex_1_7`.

**Expected result:**

```
#> # A tibble: 10 x 2
#>    date         kwh
#>    <date>     <dbl>
#>  1 2024-03-01   412
#>  2 2024-03-02   430
#>  3 2024-03-03    NA
#>  4 2024-03-04   455
#>  5 2024-03-05   448
#>  6 2024-03-06    NA
#>  7 2024-03-07    NA
#>  8 2024-03-08   470
#>  9 2024-03-09   462
#> 10 2024-03-10   481
```

**Difficulty:** Advanced

[HINTS]
The missing days are invisible because they are absent rows, not `NA` rows. First manufacture the calendar you wish you had, then attach the data to it.
`seq(min(date), max(date), by = "day")` builds the spine; a `left_join()` from the spine onto the reads fills the gaps with `NA`.

```r title="Your turn"
readings <- tibble(
  date = as.Date(c("2024-03-01","2024-03-02","2024-03-04","2024-03-05",
                   "2024-03-08","2024-03-09","2024-03-10")),
  kwh  = c(412, 430, 455, 448, 470, 462, 481)
)

ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
readings <- tibble(
  date = as.Date(c("2024-03-01","2024-03-02","2024-03-04","2024-03-05",
                   "2024-03-08","2024-03-09","2024-03-10")),
  kwh  = c(412, 430, 455, 448, 470, 462, 481)
)

full <- tibble(date = seq(min(readings$date), max(readings$date), by = "day"))
ex_1_7 <- full |> left_join(readings, by = "date")
ex_1_7
#> # A tibble: 10 x 2
#>    date         kwh
#>    <date>     <dbl>
#>  1 2024-03-01   412
#>  2 2024-03-02   430
#>  3 2024-03-03    NA
#>  4 2024-03-04   455
#>  5 2024-03-05   448
#>  6 2024-03-06    NA
#>  7 2024-03-07    NA
#>  8 2024-03-08   470
#>  9 2024-03-09   462
#> 10 2024-03-10   481
```

**Explanation:** A `ts` object has no dates, only a start and a fixed step, so it assumes every consecutive row is one period apart. Feeding these 7 rows straight into `ts(readings$kwh, frequency = 7)` would silently compress 10 calendar days into 7 slots and shift every later observation. Densifying against a complete date spine first is the only safe conversion path for irregular data. Once the gaps are explicit you can decide what to do with them: `zoo::na.approx()` to interpolate, `tidyr::fill()` to carry the last value forward, or leave the `NA` and use a model that tolerates it.

</details>

### Exercise 1.8: Audit a sensor log for duplicate and missing timestamps

**Task:** Before a sensor feed goes into a model, the platform team runs a data-quality audit on it. For the inline event log, report the row count, the number of distinct timestamps, how many rows are duplicates, and which minutes between 0 and 9 are absent, as a one-row tibble saved to `ex_1_8`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   n_rows n_unique_ts n_duplicate_ts missing_minutes
#>    <int>       <int>          <int> <chr>
#> 1     10           8              2 4, 8
```

**Difficulty:** Advanced

[HINTS]
Duplicates are the difference between how many rows you have and how many distinct stamps you have. Gaps are a set difference against the expected sequence.
`n_distinct()` counts unique stamps and `setdiff(0:9, events$ts_min)` returns the absent minutes; collapse them with `paste(..., collapse = ", ")`.

```r title="Your turn"
events <- tibble(
  ts_min = c(0, 1, 2, 2, 3, 5, 6, 6, 7, 9),
  hits   = c(120, 118, 131, 131, 127, 140, 138, 138, 145, 151)
)

ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- tibble(
  ts_min = c(0, 1, 2, 2, 3, 5, 6, 6, 7, 9),
  hits   = c(120, 118, 131, 131, 127, 140, 138, 138, 145, 151)
)

ex_1_8 <- tibble(
  n_rows = nrow(events),
  n_unique_ts = n_distinct(events$ts_min),
  n_duplicate_ts = nrow(events) - n_distinct(events$ts_min),
  missing_minutes = paste(setdiff(0:9, events$ts_min), collapse = ", ")
)
ex_1_8
#> # A tibble: 1 x 4
#>   n_rows n_unique_ts n_duplicate_ts missing_minutes
#>    <int>       <int>          <int> <chr>
#> 1     10           8              2 4, 8
```

**Explanation:** Duplicated timestamps and dropped intervals are the two failure modes that quietly corrupt every downstream lag, difference and seasonal index, because both shift observations into the wrong period. Doing the audit as a one-row summary means you can bind it across many feeds and monitor the counts over time. In production you would usually promote this to a hard assertion, for example `stopifnot(n_distinct(events$ts_min) == nrow(events))`, so a bad load fails loudly instead of producing a plausible but wrong forecast.

</details>

## Section 2. Aggregating, differencing, and transforming (8 problems)

### Exercise 2.1: Roll a monthly series up to annual totals

**Task:** A route planner wants annual passenger volume rather than the monthly detail, so collapse the `AirPassengers` series to one total per calendar year while keeping the result an annual time series. Save the aggregated series to `ex_2_1`.

**Expected result:**

```
#> Time Series:
#> Start = 1949
#> End = 1960
#> Frequency = 1
#>  [1] 1520 1676 2042 2364 2700 2867 3408 3939 4421 4572 5140 5714
```

**Difficulty:** Intermediate

[HINTS]
There is a ts method for the generic aggregation function; by default it collapses all the way down to frequency 1.
Call `aggregate(AirPassengers, FUN = sum)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- aggregate(AirPassengers, FUN = sum)
ex_2_1
#> Time Series:
#> Start = 1949
#> End = 1960
#> Frequency = 1
#>  [1] 1520 1676 2042 2364 2700 2867 3408 3939 4421 4572 5140 5714
```

**Explanation:** `aggregate.ts()` defaults to `nfrequency = 1`, which is why summing gives calendar-year totals and the result prints with `Frequency = 1`. Aggregation is not neutral: the annual series is smooth and trending because summing has destroyed the seasonal pattern entirely, which is exactly what you want for a capacity plan and exactly what you do not want if the question is about peak months. Note this only works cleanly because the series contains whole years; a partial final year would be summed as though it were complete.

</details>

### Exercise 2.2: Convert a monthly series to quarterly means

**Task:** Atmospheric reports are published quarterly, so average the monthly `co2` readings into quarterly means, then restrict the output to the three years from Q1 1959 through Q4 1961 so it fits on screen. Save the restricted quarterly series to `ex_2_2`.

**Expected result:**

```
#>          Qtr1     Qtr2     Qtr3     Qtr4
#> 1959 316.0767 317.8967 314.9067 314.4233
#> 1960 316.8333 319.3900 315.9167 314.8500
#> 1961 317.5500 319.7800 316.6267 315.9833
```

**Difficulty:** Intermediate

[HINTS]
The same aggregation function used for annual totals takes an argument that sets the target frequency instead of collapsing to 1.
`aggregate(co2, nfrequency = 4, FUN = mean)`, then trim it with `window()`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- window(aggregate(co2, nfrequency = 4, FUN = mean),
                 start = c(1959, 1), end = c(1961, 4))
ex_2_2
#>          Qtr1     Qtr2     Qtr3     Qtr4
#> 1959 316.0767 317.8967 314.9067 314.4233
#> 1960 316.8333 319.3900 315.9167 314.8500
#> 1961 317.5500 319.7800 316.6267 315.9833
```

**Explanation:** `nfrequency` must divide the original frequency evenly, so 12 to 4 and 12 to 1 are legal but 12 to 5 is not. Use `FUN = mean` for level-type quantities such as concentrations, prices or temperatures, and `FUN = sum` for flow-type quantities such as units sold or passengers carried. Mixing those up produces numbers that are wrong by a factor of three at quarterly resolution and are easy to miss because they still look plausible.

</details>

### Exercise 2.3: First-difference the Nile flow series

**Task:** Take the built-in `Nile` annual flow series and compute its first difference so that each value becomes the year-over-year change rather than the level, then keep the first 12 differences and save them to `ex_2_3`.

**Expected result:**

```
#> Time Series:
#> Start = 1872
#> End = 1883
#> Frequency = 1
#>  [1]   40 -197  247  -50    0 -347  417  140 -230 -145  -60  175
```

**Difficulty:** Beginner

[HINTS]
Differencing subtracts each observation from the one that follows it, and base R has a single function for it that works directly on a ts.
Use `diff(Nile)` and then `head(..., 12)`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- head(diff(Nile), 12)
ex_2_3
#> Time Series:
#> Start = 1872
#> End = 1883
#> Frequency = 1
#>  [1]   40 -197  247  -50    0 -347  417  140 -230 -145  -60  175
```

**Explanation:** Differencing costs you one observation, which is why the differenced series starts in 1872 while `Nile` starts in 1871. That bookkeeping matters when you line a differenced series up against a predictor: lengths no longer match and R will recycle rather than error. Differencing is the standard fix for a wandering mean, and the `d` in ARIMA(p, d, q) is literally the number of times `diff()` was applied before the model was fitted.

</details>

### Exercise 2.4: Stabilise variance with a log before differencing

**Task:** Airline traffic swings get wider as the series grows, so analysts log the series before differencing it. Apply a natural log to `AirPassengers`, take the first difference of the logged series to get approximate monthly growth rates, keep the first 12 values, and save them to `ex_2_4`.

**Expected result:**

```
#>              Jan         Feb         Mar         Apr         May         Jun
#> 1949              0.05218575  0.11211730 -0.02298952 -0.06402186  0.10948423
#> 1950 -0.02575250
#>              Jul         Aug         Sep         Oct         Nov         Dec
#> 1949  0.09193750  0.00000000 -0.08455739 -0.13353139 -0.13473259  0.12629373
#> 1950
```

**Difficulty:** Intermediate

[HINTS]
Order matters: the transform that tames the growing amplitude has to happen before the operation that removes the trend.
Compose them as `diff(log(AirPassengers))`, then take `head(..., 12)`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- head(diff(log(AirPassengers)), 12)
ex_2_4
#>              Jan         Feb         Mar         Apr         May         Jun
#> 1949              0.05218575  0.11211730 -0.02298952 -0.06402186  0.10948423
#> 1950 -0.02575250
#>              Jul         Aug         Sep         Oct         Nov         Dec
#> 1949  0.09193750  0.00000000 -0.08455739 -0.13353139 -0.13473259  0.12629373
#> 1950
```

**Explanation:** The difference of logs approximates a proportional change, so 0.0522 reads as roughly 5.2 percent growth from January to February 1949. That approximation stays close for changes under about 10 percent and drifts beyond it, where `exp(d) - 1` is the exact figure. Logging first is what turns a multiplicative seasonal pattern into an additive one, which is why the airline model in Section 5 is fitted to `log(AirPassengers)` rather than the raw counts. Logs require strictly positive data; for series containing zeros, `log1p()` or a Box-Cox transform is the usual substitute.

</details>

### Exercise 2.5: Compute month-over-month percentage change with lag

**Task:** A finance team reviewing the first eight months of revenue wants each month shown next to the previous month and the percentage change between them, rounded to two decimals. Add a `prev` column and a `mom_pct` column to the inline `sales` tibble and save the result to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 8 x 4
#>   month revenue  prev mom_pct
#>   <chr>   <dbl> <dbl>   <dbl>
#> 1 Jan     48200    NA   NA
#> 2 Feb     51300 48200    6.43
#> 3 Mar     49800 51300   -2.92
#> 4 Apr     55600 49800   11.6
#> 5 May     58100 55600    4.5
#> 6 Jun     57200 58100   -1.55
#> 7 Jul     61900 57200    8.22
#> 8 Aug     64500 61900    4.2
```

**Difficulty:** Intermediate

[HINTS]
You need each row to see the value from the row above it, which is a shift operation rather than an aggregation.
`mutate(prev = lag(revenue), mom_pct = round(100 * (revenue - prev) / prev, 2))`.

```r title="Your turn"
sales <- tibble(
  month = month.abb[1:8],
  revenue = c(48200, 51300, 49800, 55600, 58100, 57200, 61900, 64500)
)

ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble(
  month = month.abb[1:8],
  revenue = c(48200, 51300, 49800, 55600, 58100, 57200, 61900, 64500)
)

ex_2_5 <- sales |>
  mutate(prev = lag(revenue),
         mom_pct = round(100 * (revenue - prev) / prev, 2))
ex_2_5
#> # A tibble: 8 x 4
#>   month revenue  prev mom_pct
#>   <chr>   <dbl> <dbl>   <dbl>
#> 1 Jan     48200    NA   NA
#> 2 Feb     51300 48200    6.43
#> 3 Mar     49800 51300   -2.92
#> 4 Apr     55600 49800   11.6
#> 5 May     58100 55600    4.5
#> 6 Jun     57200 58100   -1.55
#> 7 Jul     61900 57200    8.22
#> 8 Aug     64500 61900    4.2
```

**Explanation:** `dplyr::lag()` shifts values down one row and pads the top with `NA`, which is why January has no growth rate. Two traps are worth knowing. First, `stats::lag()` does something completely different: it shifts the ts index rather than the values, so loading dplyr after stats is what makes this code behave as expected. Second, `lag()` respects row order but not calendar gaps, so always `arrange()` by date first and confirm there are no missing periods, otherwise a skipped month silently becomes a two-month change.

</details>

### Exercise 2.6: Smooth a monthly series with a centred moving average

**Task:** A capacity planner wants the trend in `AirPassengers` without the monthly noise, so apply a centred 12-month moving average across the series, then show the first calendar year of the smoothed values rounded to two decimals. Save that windowed result to `ex_2_6`.

**Expected result:**

```
#>         Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct
#> 1949     NA     NA     NA     NA     NA 126.67 126.92 127.58 128.33 128.83
#>         Nov    Dec
#> 1949 129.17 130.33
```

**Difficulty:** Advanced

[HINTS]
A moving average is a linear filter with equal weights that sum to one, applied symmetrically around each point.
`stats::filter(AirPassengers, rep(1/12, 12), sides = 2)`, then round and `window()` to 1949.

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- window(round(stats::filter(AirPassengers, rep(1/12, 12), sides = 2), 2),
                 start = c(1949, 1), end = c(1949, 12))
ex_2_6
#>         Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct
#> 1949     NA     NA     NA     NA     NA 126.67 126.92 127.58 128.33 128.83
#>         Nov    Dec
#> 1949 129.17 130.33
```

**Explanation:** `sides = 2` centres the window on each observation, so five months at each end of the series have no full window and come back `NA`. That edge loss is unavoidable and is the reason a trailing moving average (`sides = 1`) is preferred for live dashboards: it costs no data at the recent end, at the price of lagging turning points by half the window. Note the qualifier `stats::` is needed because dplyr also exports a `filter()`, and calling the wrong one here throws a confusing error about an unused argument.

</details>

### Exercise 2.7: Remove seasonality with a 12-month seasonal difference

**Task:** Comparing each month against the same month a year earlier strips the annual seasonal pattern out of `AirPassengers`. Compute the seasonal difference at lag 12, keep the first 12 resulting values, and save them to `ex_2_7`.

**Expected result:**

```
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1950   3   8   9   6   4  14  22  22  22  14  10  22
```

**Difficulty:** Intermediate

[HINTS]
The same differencing function takes an argument controlling how far back it reaches, and one full seasonal cycle is the natural choice here.
Use `diff(AirPassengers, lag = 12)` and take `head(..., 12)`.

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- head(diff(AirPassengers, lag = 12), 12)
ex_2_7
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1950   3   8   9   6   4  14  22  22  22  14  10  22
```

**Explanation:** Because the lag equals the frequency, every value here compares a month to the same month in the prior year, so the entire seasonal shape cancels and what remains is year-over-year growth. Seasonal differencing costs a full cycle, hence the result starting in 1950. Note `diff(x, lag = 12)` differences once at lag 12, whereas `diff(x, differences = 12)` differences twelve times at lag 1; the argument names look similar and mixing them up destroys the series.

</details>

### Exercise 2.8: Rebase a series to an index of 100

**Task:** Reports often express a level series relative to its own starting point rather than in raw units. Rescale the `Nile` series so the first observation equals exactly 100 and every later value is that year as a percentage of the base, round to one decimal, keep the first 10 values, and save them to `ex_2_8`.

**Expected result:**

```
#> Time Series:
#> Start = 1871
#> End = 1880
#> Frequency = 1
#>  [1] 100.0 103.6  86.0 108.0 103.6 103.6  72.6 109.8 122.3 101.8
```

**Difficulty:** Intermediate

[HINTS]
Indexing is division by a single scalar, the base-period value, followed by multiplication by 100.
Divide by `as.numeric(Nile)[1]`; stripping the ts class off the divisor keeps the result a proper series.

```r title="Your turn"
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- head(round(100 * Nile / as.numeric(Nile)[1], 1), 10)
ex_2_8
#> Time Series:
#> Start = 1871
#> End = 1880
#> Frequency = 1
#>  [1] 100.0 103.6  86.0 108.0 103.6 103.6  72.6 109.8 122.3 101.8
```

**Explanation:** Rebasing makes series with different units comparable on one axis, which is why price indices, stock charts and benchmark comparisons nearly always use it. The `as.numeric()` matters: `Nile[1]` already returns a bare number here, but on a multivariate series the equivalent subsetting can drag ts attributes along and produce a length mismatch. Watch the base-period choice, because an unusually high or low first observation makes every subsequent value look permanently depressed or inflated; a common alternative is to divide by the mean of the first full cycle.

</details>

## Section 3. Decomposing seasonality and trend (8 problems)

### Exercise 3.1: Plot a monthly series with labelled axes

**Task:** Produce a line plot of the `AirPassengers` series with the title "Monthly airline passengers, 1949-1960", the x axis labelled "Year", the y axis labelled "Passengers (thousands)", drawn in steelblue at line width 2. Assign the plotting call to `ex_3_1` so the chart renders.

**Expected result:**

```
# A single line chart rising from about 100 in 1949 to about 600 in 1960,
# with a clear repeating annual wave whose peaks grow taller each year.
# Steelblue line, width 2, x axis in years, y axis in passengers.
```

**Difficulty:** Beginner

[HINTS]
A ts object has its own plotting method, so you do not need to build an x variable; the calendar is already attached.
Call `plot()` on the series and pass `main`, `xlab`, `ylab`, `col` and `lwd`.

```r title="Your turn"
ex_3_1 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- plot(AirPassengers,
               main = "Monthly airline passengers, 1949-1960",
               xlab = "Year",
               ylab = "Passengers (thousands)",
               col = "steelblue",
               lwd = 2)
#> A line chart rising from about 100 to about 600 with a repeating
#> annual wave whose amplitude grows over time.
```

**Explanation:** `plot()` dispatches to `plot.ts()` when handed a series, which is why the x axis comes out in calendar years without any effort. Read this chart before you fit anything: it shows an upward trend, a strong annual cycle, and crucially a seasonal swing that widens as the level rises. That widening is the visual signature of multiplicative seasonality, and it is the reason later exercises log the series first. Getting into the habit of plotting before modelling catches structural breaks and outliers that no automatic order-selection routine will flag for you.

</details>

### Exercise 3.2: Draw a seasonal subseries plot of monthly CO2

**Task:** A climatologist wants to see each calendar month's own path across the years rather than one continuous line, so draw a seasonal subseries plot of the `co2` series with the title "CO2 by calendar month" and the y axis labelled "ppm". Assign the plotting call to `ex_3_2`.

**Expected result:**

```
# Twelve short segments side by side, one per calendar month, each with a
# horizontal mean line. Every month trends upward across the years, and the
# May segment sits highest while the September segment sits lowest.
```

**Difficulty:** Intermediate

[HINTS]
There is a base graphics function built specifically to split a seasonal series into one panel per period of the cycle.
Use `monthplot(co2, main = ..., ylab = ...)`.

```r title="Your turn"
ex_3_2 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- monthplot(co2, main = "CO2 by calendar month", ylab = "ppm")
#> Twelve segments, one per month, each rising across years, with
#> horizontal month-mean reference lines.
```

**Explanation:** A standard time plot mixes trend and season together, so it is hard to tell whether the seasonal shape itself is changing. `monthplot()` separates them: the slope within each panel is the trend for that month, and the difference between the panel means is the seasonal effect. Here every month climbs at a similar rate, which says the seasonal pattern is stable and additive rather than growing, so `decompose(co2, type = "additive")` is the right choice. Despite the name, `monthplot()` works for any frequency, including quarterly and weekly series.

</details>

### Exercise 3.3: Compare month-of-year distributions with a boxplot

**Task:** To see how much month-to-month variation exists across the whole airline record, draw side-by-side boxplots of `AirPassengers` grouped by calendar month, with the three-letter month abbreviations as the x axis labels and the title "Passenger spread by month". Assign the call to `ex_3_3`.

**Expected result:**

```
# Twelve boxes labelled Jan through Dec. July and August sit highest with
# medians near 333 and 320, November lowest near 220, and the summer boxes
# are visibly taller, showing wider spread in peak months.
```

**Difficulty:** Intermediate

[HINTS]
A boxplot needs a grouping variable, and the position within the seasonal cycle is exactly that grouping.
`boxplot(as.numeric(AirPassengers) ~ cycle(AirPassengers), names = month.abb)`.

```r title="Your turn"
ex_3_3 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- boxplot(as.numeric(AirPassengers) ~ cycle(AirPassengers),
                  names = month.abb,
                  main = "Passenger spread by month",
                  xlab = "Month", ylab = "Passengers (thousands)")
#> Twelve boxes; July and August highest (medians 333 and 320),
#> November lowest (median 220), summer boxes noticeably taller.
```

**Explanation:** `cycle()` turns the ts index into a month factor, which is what makes the formula interface work here. The boxes do double duty: their centres trace the seasonal profile, and their heights reveal that the peak months vary far more in absolute terms than the quiet ones. That heteroscedasticity is a second argument for a log transform, since logging compresses the large values and makes the spread roughly equal across months. Be aware the trend inflates every box, so this view exaggerates spread compared with boxplots of a detrended series.

</details>

### Exercise 3.4: Extract the multiplicative seasonal index

**Task:** Decompose `AirPassengers` into trend, seasonal and remainder parts using a multiplicative model, then pull out the twelve seasonal factors and round them to four decimals. Save the vector of factors to `ex_3_4` so each month's typical multiplier is visible.

**Expected result:**

```
#>  [1] 0.9102 0.8836 1.0074 0.9759 0.9814 1.1128 1.2266 1.2199 1.0605 0.9218
#> [11] 0.8012 0.8988
```

**Difficulty:** Intermediate

[HINTS]
The classical decomposition function returns a list, and one of its elements holds a single seasonal value per period rather than one per observation.
`decompose(AirPassengers, type = "multiplicative")$figure`, wrapped in `round(..., 4)`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- round(decompose(AirPassengers, type = "multiplicative")$figure, 4)
ex_3_4
#>  [1] 0.9102 0.8836 1.0074 0.9759 0.9814 1.1128 1.2266 1.2199 1.0605 0.9218
#> [11] 0.8012 0.8988
```

**Explanation:** In a multiplicative decomposition the factors are ratios centred on 1, so 1.2266 for July means July traffic runs about 23 percent above the trend while 0.8012 for November runs about 20 percent below it. The `$seasonal` element repeats these twelve numbers across all 144 months; `$figure` is the compact one-cycle version. The factors are constant by construction, which is the main limitation of classical decomposition: if the seasonal shape genuinely evolves, use `stl()` with a finite `s.window` instead.

</details>

### Exercise 3.5: Read the STL components of the CO2 series

**Task:** Run an STL decomposition on the `co2` series with a periodic seasonal window, then take the first 6 rows of its component matrix rounded to four decimals so the seasonal, trend and remainder columns can be inspected side by side. Save that matrix to `ex_3_5`.

**Expected result:**

```
#>          seasonal    trend remainder
#> Jan 1959  -0.0610 315.1954    0.2856
#> Feb 1959   0.5946 315.3023    0.4131
#> Mar 1959   1.3290 315.4093   -0.2383
#> Apr 1959   2.4690 315.5147   -0.4237
#> May 1959   2.9570 315.6201   -0.4471
#> Jun 1959   2.3184 315.7194   -0.0378
```

**Difficulty:** Advanced

[HINTS]
STL stores its three components as columns of one matrix rather than as separate list elements.
`stl(co2, s.window = "periodic")$time.series`, then `round()` and `head(..., 6)`.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- head(round(stl(co2, s.window = "periodic")$time.series, 4), 6)
ex_3_5
#>          seasonal    trend remainder
#> Jan 1959  -0.0610 315.1954    0.2856
#> Feb 1959   0.5946 315.3023    0.4131
#> Mar 1959   1.3290 315.4093   -0.2383
#> Apr 1959   2.4690 315.5147   -0.4237
#> May 1959   2.9570 315.6201   -0.4471
#> Jun 1959   2.3184 315.7194   -0.0378
```

**Explanation:** STL fits trend and seasonality with repeated loess smoothing, which gives it two advantages over `decompose()`: it is robust to outliers, and it produces trend estimates right to the ends of the series instead of `NA` padding. `s.window = "periodic"` forces one fixed seasonal shape, equivalent in spirit to classical decomposition; setting it to an odd number such as 13 lets the shape drift slowly across the years. STL is additive only, so for a multiplicative series you decompose `log(x)` and exponentiate the components afterwards.

</details>

### Exercise 3.6: Seasonally adjust the airline series

**Task:** Statistical agencies publish seasonally adjusted figures so month-to-month moves are readable. Divide `AirPassengers` by its multiplicative seasonal component, round to one decimal, restrict the output to 1949 and 1950, and save that adjusted window to `ex_3_6`.

**Expected result:**

```
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1949 123.0 133.5 131.0 132.2 123.3 121.3 120.7 121.3 128.2 129.1 129.8 131.3
#> 1950 126.3 142.6 140.0 138.3 127.4 133.9 138.6 139.4 149.0 144.3 142.3 155.8
```

**Difficulty:** Advanced

[HINTS]
In a multiplicative model the observed value is trend times season times remainder, so removing the season is an arithmetic inverse, not a subtraction.
Compute `AirPassengers / decompose(AirPassengers, type = "multiplicative")$seasonal`.

```r title="Your turn"
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dec <- decompose(AirPassengers, type = "multiplicative")
ex_3_6 <- window(round(AirPassengers / dec$seasonal, 1),
                 start = c(1949, 1), end = c(1950, 12))
ex_3_6
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1949 123.0 133.5 131.0 132.2 123.3 121.3 120.7 121.3 128.2 129.1 129.8 131.3
#> 1950 126.3 142.6 140.0 138.3 127.4 133.9 138.6 139.4 149.0 144.3 142.3 155.8
```

**Explanation:** Compare the adjusted July 1949 figure of 120.7 with the raw 148: the summer spike was mostly the calendar, not underlying growth. Getting the arithmetic right is the whole exercise, since dividing an additive decomposition or subtracting a multiplicative one leaves a residual seasonal pattern that is easy to miss. Note the adjusted series is not smooth; it still carries the remainder, which is exactly right because seasonal adjustment removes the calendar effect and nothing else. Official agencies use X-13ARIMA-SEATS rather than this simple ratio, mainly to handle trading-day and holiday effects.

</details>

### Exercise 3.7: Show that the seasonal swing grows with the level

**Task:** To justify choosing a multiplicative model over an additive one, quantify how the annual peak-to-trough swing in `AirPassengers` changes over time. Produce a tibble with one row per year holding the yearly `peak`, `trough`, and their difference as `amplitude`, and save it to `ex_3_7`.

**Expected result:**

```
#> # A tibble: 12 x 4
#>     year  peak trough amplitude
#>    <int> <dbl>  <dbl>     <dbl>
#>  1  1949   148    104        44
#>  2  1950   170    114        56
#>  3  1951   199    145        54
#>  4  1952   242    171        71
#>  5  1953   272    180        92
#>  6  1954   302    188       114
#>  7  1955   364    233       131
#>  8  1956   413    271       142
#>  9  1957   467    301       166
#> 10  1958   505    310       195
#> 11  1959   559    342       217
#> 12  1960   622    390       232
```

**Difficulty:** Intermediate

[HINTS]
Get the series into a tibble with a year column first, then this becomes an ordinary grouped summary.
`floor(time(AirPassengers))` gives the year; then `group_by(year)` and `summarise(peak = max(pax), trough = min(pax), ...)`.

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- tibble(
  year = as.integer(floor(time(AirPassengers))),
  pax  = as.numeric(AirPassengers)
) |>
  group_by(year) |>
  summarise(peak = max(pax), trough = min(pax), amplitude = peak - trough,
            .groups = "drop")
ex_3_7
#> # A tibble: 12 x 4
#>     year  peak trough amplitude
#>    <int> <dbl>  <dbl>     <dbl>
#>  1  1949   148    104        44
#>  2  1950   170    114        56
#>  3  1951   199    145        54
#>  4  1952   242    171        71
#>  5  1953   272    180        92
#>  6  1954   302    188       114
#>  7  1955   364    233       131
#>  8  1956   413    271       142
#>  9  1957   467    301       166
#> 10  1958   505    310       195
#> 11  1959   559    342       217
#> 12  1960   622    390       232
```

**Explanation:** The amplitude climbs from 44 to 232 while the level roughly quadruples, so the swing grows in step with the level rather than staying constant. That is precisely the definition of multiplicative seasonality, and it rules out an additive decomposition, which assumes one fixed seasonal offset for every year. The practical consequence is that you either fit a multiplicative model or you log the series and fit an additive one, which are close to equivalent. As a quick check, the amplitude as a fraction of the yearly peak stays near 0.3 to 0.4 throughout, whereas a truly additive series would show that ratio shrinking.

</details>

### Exercise 3.8: Score trend and seasonal strength from STL components

**Task:** Feature-based forecasting pipelines summarise each series with numeric strength measures before choosing a model. Using an STL decomposition of `co2`, compute trend strength and seasonal strength as one minus the remainder variance divided by the variance of the remainder plus the relevant component, floored at zero and rounded to four decimals. Save the named pair to `ex_3_8`.

**Expected result:**

```
#>    trend_strength seasonal_strength
#>            0.9997            0.9841
```

**Difficulty:** Advanced

[HINTS]
Both measures follow the same shape: compare how much variance is left in the remainder against the variance of that remainder combined with the component being scored.
Use `var(cmp[, "remainder"]) / var(cmp[, "trend"] + cmp[, "remainder"])` inside `1 - ...`, wrapped in `max(0, ...)`.

```r title="Your turn"
ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cmp <- stl(co2, s.window = "periodic")$time.series
ex_3_8 <- round(c(
  trend_strength = max(0, 1 - var(cmp[, "remainder"]) /
                         var(cmp[, "trend"] + cmp[, "remainder"])),
  seasonal_strength = max(0, 1 - var(cmp[, "remainder"]) /
                            var(cmp[, "seasonal"] + cmp[, "remainder"]))
), 4)
ex_3_8
#>    trend_strength seasonal_strength
#>            0.9997            0.9841
```

**Explanation:** These are the strength measures from Hyndman and Athanasopoulos, and both live on a 0 to 1 scale where values near 1 mean the component dominates the noise. The `max(0, ...)` guard matters because on a series with no real trend the ratio can exceed 1 and produce a meaningless negative score. Reading the numbers here: `co2` is almost pure trend with a strong stable season, so a seasonal model is mandatory and a plain random walk would be badly wrong. At scale these features are what let an automated pipeline route thousands of series to the right model family without a human inspecting each plot.

</details>

## Section 4. Stationarity, autocorrelation, and unit roots (8 problems)

### Exercise 4.1: Read the autocorrelation function of the Nile series

**Task:** Compute the autocorrelations of the `Nile` series out to lag 10 without drawing a plot, so the numeric values can be inspected directly rather than eyeballed off a chart. Save the resulting acf object to `ex_4_1`.

**Expected result:**

```
#> Autocorrelations of series 'Nile', by lag
#>
#>     0     1     2     3     4     5     6     7     8     9    10
#> 1.000 0.498 0.385 0.328 0.239 0.228 0.227 0.222 0.300 0.142 0.090
```

**Difficulty:** Intermediate

[HINTS]
The autocorrelation function draws a plot by default; there is an argument that suppresses it and returns the numbers instead.
`acf(Nile, lag.max = 10, plot = FALSE)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- acf(Nile, lag.max = 10, plot = FALSE)
ex_4_1
#> Autocorrelations of series 'Nile', by lag
#>
#>     0     1     2     3     4     5     6     7     8     9    10
#> 1.000 0.498 0.385 0.328 0.239 0.228 0.227 0.222 0.300 0.142 0.090
```

**Explanation:** Lag 0 is always exactly 1 because a series correlates perfectly with itself. The pattern here decays gradually rather than cutting off sharply, which points at an autoregressive component rather than a moving average one. With 100 observations the approximate significance threshold is 2 divided by the square root of 100, so 0.20; on that basis lags 1 through 8 are meaningful and lags 9 and 10 are noise. Extract the raw numbers with `ex_4_1$acf` when you need them programmatically, and remember the ACF assumes stationarity, so a slowly decaying ACF often just means the series needs differencing first.

</details>

### Exercise 4.2: Identify AR order from a partial autocorrelation function

**Task:** The `WWWusage` series records internet connections per minute at a server. Compute its partial autocorrelations out to lag 8 with plotting turned off so the AR order can be read from the numbers, and save the result to `ex_4_2`.

**Expected result:**

```
#> Partial autocorrelations of series 'WWWusage', by lag
#>
#>      1      2      3      4      5      6      7      8
#>  0.960 -0.267 -0.154 -0.120 -0.072 -0.065 -0.084 -0.065
```

**Difficulty:** Intermediate

[HINTS]
Partial autocorrelation strips out the influence of the shorter lags, which is why it is the tool for reading autoregressive order.
`pacf(WWWusage, lag.max = 8, plot = FALSE)`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- pacf(WWWusage, lag.max = 8, plot = FALSE)
ex_4_2
#> Partial autocorrelations of series 'WWWusage', by lag
#>
#>      1      2      3      4      5      6      7      8
#>  0.960 -0.267 -0.154 -0.120 -0.072 -0.065 -0.084 -0.065
```

**Explanation:** The PACF measures the correlation at each lag after removing everything the shorter lags already explain, so an AR(p) process shows large partial autocorrelations up to lag p and near-zero values after. Here lag 1 at 0.960 and lag 2 at -0.267 stand out against the 0.20 threshold while the rest fade, suggesting an AR(2) on the raw scale. The near-1.0 first partial is also a classic unit-root signature, which is why `auto.arima()` ends up differencing this series in Exercise 5.6. PACF starts at lag 1, unlike the ACF, because the lag-0 partial is undefined.

</details>

### Exercise 4.3: Test for autocorrelation with a Ljung-Box test

**Task:** Formally test whether the `Nile` series contains any autocorrelation at all rather than judging by eye, using a Ljung-Box portmanteau test over the first 10 lags. Save the resulting htest object to `ex_4_3` and read off the p-value.

**Expected result:**

```
#> 	Box-Ljung test
#>
#> data:  Nile
#> X-squared = 88.127, df = 10, p-value = 1.255e-14
```

**Difficulty:** Intermediate

[HINTS]
There is a single base R function for portmanteau tests, with an argument that switches between the two standard variants.
`Box.test(Nile, lag = 10, type = "Ljung-Box")`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- Box.test(Nile, lag = 10, type = "Ljung-Box")
ex_4_3
#> 	Box-Ljung test
#>
#> data:  Nile
#> X-squared = 88.127, df = 10, p-value = 1.255e-14
```

**Explanation:** The null hypothesis is that the first 10 autocorrelations are jointly zero, meaning the series is white noise. A p-value of 1.255e-14 rejects that decisively, confirming there is real structure worth modelling. Always pick `type = "Ljung-Box"` over the default Box-Pierce, since it has better small-sample behaviour. The same test is the workhorse for residual diagnostics later, but there you must pass `fitdf` equal to the number of estimated ARMA coefficients so the degrees of freedom account for the fitting, as Exercise 6.7 does.

</details>

### Exercise 4.4: Run an augmented Dickey-Fuller test for a unit root

**Task:** Before differencing anything, test whether the `WWWusage` connection series is already stationary by running an augmented Dickey-Fuller test on the raw levels. Save the test object to `ex_4_4` and note which hypothesis the p-value supports.

**Expected result:**

```
#> 	Augmented Dickey-Fuller Test
#>
#> data:  WWWusage
#> Dickey-Fuller = -2.6421, Lag order = 4, p-value = 0.3107
#> alternative hypothesis: stationary
```

**Difficulty:** Intermediate

[HINTS]
The test lives in the tseries package and its name is an abbreviation of the test itself.
Call `adf.test(WWWusage)`; the alternative hypothesis, not the null, is stationarity.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- adf.test(WWWusage)
ex_4_4
#> 	Augmented Dickey-Fuller Test
#>
#> data:  WWWusage
#> Dickey-Fuller = -2.6421, Lag order = 4, p-value = 0.3107
#> alternative hypothesis: stationary
```

**Explanation:** The direction of this test trips people up constantly. The null is that a unit root is present, so the series is non-stationary, and the alternative is stationarity. A p-value of 0.3107 therefore fails to reject non-stationarity, and the series needs differencing. Failing to reject is not proof of a unit root, only absence of evidence against it, which is why practitioners pair ADF with a KPSS test that flips the hypotheses. Exercise 4.6 shows that a single difference is still not enough here, a result you would never guess from the level plot alone.

</details>

### Exercise 4.5: Ask forecast how many differences a series needs

**Task:** Rather than deciding by hand, have the forecast package recommend how many ordinary differences and how many seasonal differences `AirPassengers` requires to become stationary. Combine both recommendations into one named vector and save it to `ex_4_5`.

**Expected result:**

```
#>  ndiffs nsdiffs
#>       1       1
```

**Difficulty:** Intermediate

[HINTS]
The forecast package has two sibling helpers, one for ordinary differencing and one for seasonal differencing, both returning a single integer.
`c(ndiffs = ndiffs(AirPassengers), nsdiffs = nsdiffs(AirPassengers))`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- c(ndiffs = ndiffs(AirPassengers), nsdiffs = nsdiffs(AirPassengers))
ex_4_5
#>  ndiffs nsdiffs
#>       1       1
```

**Explanation:** `ndiffs()` repeatedly applies a unit-root test until it stops rejecting, and `nsdiffs()` does the seasonal equivalent using a seasonal strength measure. The answer of one each is exactly the airline model specification, ARIMA(0,1,1)(0,1,1) with period 12, fitted in Exercise 5.7. Order matters in practice: take the seasonal difference first, then re-test, because removing seasonality sometimes removes the apparent trend as well and saves you an unnecessary ordinary difference. Over-differencing is a real cost, inflating variance and forcing spurious moving-average terms into the model.

</details>

### Exercise 4.6: Difference until the ADF test rejects, and count the rounds

**Task:** Write a loop that keeps differencing the `WWWusage` series until an augmented Dickey-Fuller test returns a p-value at or below 0.05, capping the loop at five rounds. Report how many differences were needed and the final p-value as a named vector saved to `ex_4_6`.

**Expected result:**

```
#> n_differences         adf_p
#>          2.00          0.01
```

**Difficulty:** Advanced

[HINTS]
This is a while loop whose condition re-runs the test on the current version of the series and whose body replaces that series with its difference.
Guard the loop with a counter, and wrap the test in `suppressWarnings()` because it warns when the p-value hits the table boundary.

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- WWWusage
n <- 0
while (suppressWarnings(adf.test(x)$p.value) > 0.05 && n < 5) {
  x <- diff(x)
  n <- n + 1
}
ex_4_6 <- c(n_differences = n,
            adf_p = round(suppressWarnings(adf.test(x)$p.value), 4))
ex_4_6
#> n_differences         adf_p
#>          2.00          0.01
```

**Explanation:** Two differences are required, not the one that most people assume from the plot, which is the practical lesson here. The counter cap is not decoration: without it, a series that never rejects sends the loop differencing until the vector is empty and R throws an obscure error deep inside the test. The 0.01 p-value is a floor, not an exact figure, because `adf.test()` interpolates from a printed table and warns when the statistic falls outside it. In production `ndiffs()` is preferable since it applies the same logic with better defaults, but writing the loop once makes clear what the helper is actually doing.

</details>

### Exercise 4.7: Cross-check stationarity with a KPSS test

**Task:** Because ADF and KPSS reverse each other's hypotheses, run a KPSS test for level stationarity on the `WWWusage` series to see whether it agrees with the ADF result from Exercise 4.4. Save the test object to `ex_4_7` and compare the conclusions.

**Expected result:**

```
#> 	KPSS Test for Level Stationarity
#>
#> data:  WWWusage
#> KPSS Level = 0.45424, Truncation lag parameter = 4, p-value = 0.05377
```

**Difficulty:** Advanced

[HINTS]
The complementary test also lives in tseries and takes an argument choosing between level stationarity and trend stationarity.
`kpss.test(WWWusage, null = "Level")`.

```r title="Your turn"
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_7 <- kpss.test(WWWusage, null = "Level")
ex_4_7
#> 	KPSS Test for Level Stationarity
#>
#> data:  WWWusage
#> KPSS Level = 0.45424, Truncation lag parameter = 4, p-value = 0.05377
```

**Explanation:** KPSS reverses ADF: here the null is stationarity and a small p-value is evidence against it. At 0.054 the test sits right on the 5 percent line, so it barely fails to reject, while ADF failed to reject non-stationarity. Both point the same direction, towards a series that is not comfortably stationary, but neither is emphatic, which is normal for 100 observations. Use `null = "Trend"` when you suspect the series is stationary around a deterministic trend rather than a fixed level, since the two variants can easily disagree on a trending series.

</details>

### Exercise 4.8: Confirm that simulated white noise shows no autocorrelation

**Task:** Generate 120 monthly observations of standard normal white noise using `set.seed(42)`, then run a Ljung-Box test over 12 lags to confirm the test correctly finds no structure. Save the test object to `ex_4_8` and compare its p-value with the Nile result from Exercise 4.3.

**Expected result:**

```
#> 	Box-Ljung test
#>
#> data:  wn
#> X-squared = 8.8237, df = 12, p-value = 0.7179
```

**Difficulty:** Beginner

[HINTS]
Set the seed before drawing so the result is reproducible, then wrap the draws in a monthly series before testing.
`rnorm(120)` inside `ts(..., frequency = 12, start = c(2015, 1))`, then `Box.test(wn, lag = 12, type = "Ljung-Box")`.

```r title="Your turn"
set.seed(42)

ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
wn <- ts(rnorm(120, mean = 0, sd = 1), frequency = 12, start = c(2015, 1))

ex_4_8 <- Box.test(wn, lag = 12, type = "Ljung-Box")
ex_4_8
#> 	Box-Ljung test
#>
#> data:  wn
#> X-squared = 8.8237, df = 12, p-value = 0.7179
```

**Explanation:** A p-value of 0.72 means there is no evidence of autocorrelation, which is the correct answer since the data really were drawn independently. Running a test against data whose truth you already know is the fastest way to calibrate your reading of it: compare 0.72 here with 1.255e-14 for `Nile` and the contrast is unmistakable. `set.seed()` is what makes the numbers reproducible, and without it every run gives a different statistic. This white-noise pattern is also the target for model residuals: a good model leaves behind something that looks exactly like this.

</details>

## Section 5. Exponential smoothing and ARIMA models (9 problems)

### Exercise 5.1: Fit simple exponential smoothing to the Nile series

**Task:** Fit simple exponential smoothing to the `Nile` series by disabling both the trend and the seasonal components of the Holt-Winters function, so only the level is smoothed. Save the fitted model to `ex_5_1` and read off the estimated alpha.

**Expected result:**

```
#> Holt-Winters exponential smoothing without trend and without seasonal component.
#>
#> Call:
#> HoltWinters(x = Nile, beta = FALSE, gamma = FALSE)
#>
#> Smoothing parameters:
#>  alpha: 0.2465579
#>  beta : FALSE
#>  gamma: FALSE
#>
#> Coefficients:
#>       [,1]
#> a 805.0389
```

**Difficulty:** Intermediate

[HINTS]
The general smoothing function has one switch per component, and setting a switch to `FALSE` removes that component entirely.
`HoltWinters(Nile, beta = FALSE, gamma = FALSE)`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- HoltWinters(Nile, beta = FALSE, gamma = FALSE)
ex_5_1
#> Holt-Winters exponential smoothing without trend and without seasonal component.
#>
#> Call:
#> HoltWinters(x = Nile, beta = FALSE, gamma = FALSE)
#>
#> Smoothing parameters:
#>  alpha: 0.2465579
#>  beta : FALSE
#>  gamma: FALSE
#>
#> Coefficients:
#>       [,1]
#> a 805.0389
```

**Explanation:** Alpha controls how fast the level adapts. At 0.247 the model puts about a quarter of the weight on the newest observation and spreads the rest geometrically backwards, so the level responds to change but is not whipsawed by a single unusual flood year. Alpha near 1 would reduce the model to a naive last-value forecast, and near 0 would freeze it at the long-run mean. The single coefficient `a` of 805 is the final level estimate, and because there is no trend term, every future forecast from this model is that same flat 805.

</details>

### Exercise 5.2: Fit Holt's linear trend method to server usage

**Task:** The `WWWusage` series trends but has no seasonal cycle, so fit Holt's linear trend method to it by disabling only the seasonal component of the Holt-Winters function. Save the fitted model to `ex_5_2` and inspect the level and slope coefficients.

**Expected result:**

```
#> Holt-Winters exponential smoothing with trend and without seasonal component.
#>
#> Call:
#> HoltWinters(x = WWWusage, gamma = FALSE)
#>
#> Smoothing parameters:
#>  alpha: 1
#>  beta : 1
#>  gamma: FALSE
#>
#> Coefficients:
#>   [,1]
#> a  220
#> b   -2
```

**Difficulty:** Intermediate

[HINTS]
Holt's method keeps the level and the trend but drops the season, so exactly one component switch needs turning off.
`HoltWinters(WWWusage, gamma = FALSE)`; leave `beta` at its default so the trend is estimated.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- HoltWinters(WWWusage, gamma = FALSE)
ex_5_2
#> Holt-Winters exponential smoothing with trend and without seasonal component.
#>
#> Call:
#> HoltWinters(x = WWWusage, gamma = FALSE)
#>
#> Smoothing parameters:
#>  alpha: 1
#>  beta : 1
#>  gamma: FALSE
#>
#> Coefficients:
#>   [,1]
#> a  220
#> b   -2
```

**Explanation:** Both alpha and beta optimise to exactly 1, which is worth pausing on: the model has decided to put all weight on the most recent observation and the most recent slope, so it behaves like a random walk with drift. That happens when a series is dominated by a stochastic trend, and it is a signal to compare against an ARIMA fit rather than accept the smoothing model blindly. The `b` coefficient of -2 means the model expects a two-unit decline per period, so a 10-step forecast extrapolates 20 units below the current level of 220. Damping that extrapolation with `forecast::holt(x, damped = TRUE)` is usually safer over long horizons.

</details>

### Exercise 5.3: Fit multiplicative Holt-Winters to the airline series

**Task:** Fit a full Holt-Winters model with multiplicative seasonality to `AirPassengers`, then collect the three optimised smoothing parameters together with the model's sum of squared errors into one named vector rounded to four decimals. Save that vector to `ex_5_3`.

**Expected result:**

```
#>      alpha       beta      gamma        SSE
#>     0.2756     0.0327     0.8707 16570.7779
```

**Difficulty:** Advanced

[HINTS]
The fitted object stores each smoothing parameter as a separate element, and they carry names that will be pasted onto yours unless you strip them.
Wrap each with `as.numeric()` inside `c()`, and pull the error total from the `SSE` element.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
hw <- HoltWinters(AirPassengers, seasonal = "multiplicative")
ex_5_3 <- round(c(alpha = as.numeric(hw$alpha),
                  beta  = as.numeric(hw$beta),
                  gamma = as.numeric(hw$gamma),
                  SSE   = hw$SSE), 4)
ex_5_3
#>      alpha       beta      gamma        SSE
#>     0.2756     0.0327     0.8707 16570.7779
```

**Explanation:** Each parameter tells a different story. Alpha at 0.28 means the level updates moderately, beta at 0.03 means the trend is treated as almost fixed and changes only very slowly, and gamma at 0.87 means the seasonal factors are re-learned aggressively from each new year. That combination describes a series with a steady growth path and an evolving seasonal shape. `seasonal = "multiplicative"` is essential here, since the additive variant would force one fixed seasonal offset onto a swing that quadruples over the record. SSE is only comparable between models fitted to the same data on the same scale, so never compare it against a fit on `log(AirPassengers)`.

</details>

### Exercise 5.4: Let ets choose an error, trend, and season specification

**Task:** Instead of picking the smoothing form yourself, let the forecast package select among the exponential smoothing family automatically for `AirPassengers` by information criterion. Save the fitted model to `ex_5_4` and read the three-letter specification it chose.

**Expected result:**

```
#> ETS(M,Ad,M)
#>
#> Call:
#> ets(y = AirPassengers)
#>
#>   Smoothing parameters:
#>     alpha = 0.7096
#>     beta  = 0.0204
#>     gamma = 1e-04
#>     phi   = 0.98
#>
#>   Initial states:
#>     l = 120.9939
#>     b = 1.7705
#>     s = 0.8944 0.7993 0.9217 1.0592 1.2203 1.2318
#>            1.1105 0.9786 0.9804 1.011 0.8869 0.9059
#>
#>   sigma:  0.0392
#>
#>      AIC     AICc      BIC
#> 1395.166 1400.638 1448.623
```

**Difficulty:** Intermediate

[HINTS]
One function in the forecast package searches the whole exponential smoothing family and returns the best fit by corrected AIC.
Call `ets(AirPassengers)` with no other arguments.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- ets(AirPassengers)
ex_5_4
#> ETS(M,Ad,M)
#>
#> Call:
#> ets(y = AirPassengers)
#>
#>   Smoothing parameters:
#>     alpha = 0.7096
#>     beta  = 0.0204
#>     gamma = 1e-04
#>     phi   = 0.98
#>
#>   Initial states:
#>     l = 120.9939
#>     b = 1.7705
#>     s = 0.8944 0.7993 0.9217 1.0592 1.2203 1.2318
#>            1.1105 0.9786 0.9804 1.011 0.8869 0.9059
#>
#>   sigma:  0.0392
#>
#>      AIC     AICc      BIC
#> 1395.166 1400.638 1448.623
```

**Explanation:** The three letters are error, trend and season, so ETS(M,Ad,M) means multiplicative errors, an additive damped trend, and multiplicative seasonality. The damping is why `phi` appears at 0.98, shrinking the extrapolated trend slightly at each step so long-horizon forecasts flatten instead of running away. Note gamma at 1e-04, effectively zero, meaning the seasonal shape is held fixed, which is the opposite of what Holt-Winters concluded in Exercise 5.3; the two routines optimise different likelihoods and often disagree. `ets()` selects by AICc, so its scores are comparable across ETS specifications but not against an ARIMA fitted to a transformed series.

</details>

### Exercise 5.5: Fit an ARIMA(1,1,1) to the Nile series

**Task:** Fit an ARIMA model to the `Nile` series with one autoregressive term, one order of differencing, and one moving-average term, then read the coefficient estimates and their standard errors. Save the fitted model to `ex_5_5`.

**Expected result:**

```
#> Call:
#> arima(x = Nile, order = c(1, 1, 1))
#>
#> Coefficients:
#>          ar1      ma1
#>       0.2544  -0.8741
#> s.e.  0.1194   0.0605
#>
#> sigma^2 estimated as 19769:  log likelihood = -630.63,  aic = 1267.25
```

**Difficulty:** Intermediate

[HINTS]
The base R modelling function takes the three orders as a single vector argument in the conventional p, d, q sequence.
`arima(Nile, order = c(1, 1, 1))`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- arima(Nile, order = c(1, 1, 1))
ex_5_5
#> Call:
#> arima(x = Nile, order = c(1, 1, 1))
#>
#> Coefficients:
#>          ar1      ma1
#>       0.2544  -0.8741
#> s.e.  0.1194   0.0605
#>
#> sigma^2 estimated as 19769:  log likelihood = -630.63,  aic = 1267.25
```

**Explanation:** Judge each coefficient against roughly twice its standard error. The moving-average term at -0.8741 with a standard error of 0.0605 is unambiguously significant, while the autoregressive term at 0.2544 against 0.1194 is only about two standard errors out and is therefore borderline. That is a hint the simpler ARIMA(0,1,1) may fit nearly as well, which Exercise 5.8 confirms by comparing AIC across candidate orders. Because `d = 1`, no intercept is reported: differencing removes the mean, and R suppresses the constant unless you ask for drift.

</details>

### Exercise 5.6: Let auto.arima search the order space

**Task:** Rather than trying orders by hand, run the forecast package's stepwise search over p, d and q for the `WWWusage` series and let it select by corrected AIC. Save the selected model to `ex_5_6` and compare the chosen differencing order with the two rounds found in Exercise 4.6.

**Expected result:**

```
#> Series: WWWusage
#> ARIMA(1,1,1)
#>
#> Coefficients:
#>          ar1     ma1
#>       0.6504  0.5256
#> s.e.  0.0842  0.0896
#>
#> sigma^2 = 9.995:  log likelihood = -254.15
#> AIC=514.3   AICc=514.55   BIC=522.08
```

**Difficulty:** Intermediate

[HINTS]
One forecast package function runs a stepwise search over candidate orders and returns the winner already fitted.
Call `auto.arima(WWWusage)` with no other arguments.

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- auto.arima(WWWusage)
ex_5_6
#> Series: WWWusage
#> ARIMA(1,1,1)
#>
#> Coefficients:
#>          ar1     ma1
#>       0.6504  0.5256
#> s.e.  0.0842  0.0896
#>
#> sigma^2 = 9.995:  log likelihood = -254.15
#> AIC=514.3   AICc=514.55   BIC=522.08
```

**Explanation:** The search settles on one difference, not the two the ADF loop demanded, because `auto.arima()` picks `d` with a KPSS-based rule and then lets the ARMA terms absorb whatever non-stationarity is left. Disagreement between a mechanical differencing loop and the automatic selector is normal, and the AICc is what arbitrates. Two cautions. The default `stepwise = TRUE` explores only part of the order space, so `auto.arima(x, stepwise = FALSE, approximation = FALSE)` is worth running when accuracy matters more than speed. And models with different `d` are fitted to different data, so their AIC values are not comparable across differencing orders.

</details>

### Exercise 5.7: Fit the classic airline model to logged passenger counts

**Task:** Reproduce the Box-Jenkins airline model by fitting an ARIMA with one non-seasonal moving-average term and one seasonal moving-average term, both with one order of differencing at period 12, to the natural log of `AirPassengers`. Save the fitted model to `ex_5_7`.

**Expected result:**

```
#> Call:
#> arima(x = log(AirPassengers), order = c(0, 1, 1), seasonal = list(order = c(0,
#>     1, 1), period = 12))
#>
#> Coefficients:
#>           ma1     sma1
#>       -0.4018  -0.5569
#> s.e.   0.0896   0.0731
#>
#> sigma^2 estimated as 0.001348:  log likelihood = 244.7,  aic = -483.4
```

**Difficulty:** Advanced

[HINTS]
Seasonal orders go in a separate argument as a list holding their own p, d, q vector plus the length of the seasonal cycle.
`arima(log(AirPassengers), order = c(0,1,1), seasonal = list(order = c(0,1,1), period = 12))`.

```r title="Your turn"
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- arima(log(AirPassengers), order = c(0, 1, 1),
                seasonal = list(order = c(0, 1, 1), period = 12))
ex_5_7
#> Call:
#> arima(x = log(AirPassengers), order = c(0, 1, 1), seasonal = list(order = c(0,
#>     1, 1), period = 12))
#>
#> Coefficients:
#>           ma1     sma1
#>       -0.4018  -0.5569
#> s.e.   0.0896   0.0731
#>
#> sigma^2 estimated as 0.001348:  log likelihood = 244.7,  aic = -483.4
```

**Explanation:** This is the model Box and Jenkins built this dataset around, and it remains a strong baseline for seasonal series decades later. Each piece does one job: the log makes the widening seasonal swing additive, the ordinary difference removes the trend, the seasonal difference removes the annual pattern, and the two moving-average terms mop up what is left. Both coefficients are comfortably more than twice their standard errors, so neither is redundant. Note the sigma-squared of 0.001348 is on the log scale, which is why the AIC is negative and cannot be compared with a model fitted to raw counts.

</details>

### Exercise 5.8: Rank candidate ARIMA orders by AIC

**Task:** Compare five candidate ARIMA specifications for the `Nile` series, namely (0,1,0), (1,1,0), (0,1,1), (1,1,1) and (2,1,1), by fitting each and recording its AIC rounded to two decimals. Return a data frame sorted best first and save it to `ex_5_8`.

**Expected result:**

```
#>     order     aic
#> 4 (1,1,1) 1267.25
#> 5 (2,1,1) 1268.90
#> 3 (0,1,1) 1269.09
#> 2 (1,1,0) 1281.48
#> 1 (0,1,0) 1296.70
```

**Difficulty:** Advanced

[HINTS]
Store the candidate orders in a list, then apply the fitting and scoring step across that list rather than writing five separate fits.
`sapply(orders, function(o) AIC(arima(Nile, order = o)))`, then sort the resulting data frame with `order()`.

```r title="Your turn"
orders <- list(c(0,1,0), c(1,1,0), c(0,1,1), c(1,1,1), c(2,1,1))

ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders <- list(c(0,1,0), c(1,1,0), c(0,1,1), c(1,1,1), c(2,1,1))

ex_5_8 <- data.frame(
  order = sapply(orders, function(o) paste0("(", paste(o, collapse = ","), ")")),
  aic = round(sapply(orders, function(o) AIC(arima(Nile, order = o))), 2)
)
ex_5_8 <- ex_5_8[order(ex_5_8$aic), ]
ex_5_8
#>     order     aic
#> 4 (1,1,1) 1267.25
#> 5 (2,1,1) 1268.90
#> 3 (0,1,1) 1269.09
#> 2 (1,1,0) 1281.48
#> 1 (0,1,0) 1296.70
```

**Explanation:** The top three are separated by under two AIC points, which is well inside the range where the differences are not meaningful, so the parsimonious ARIMA(0,1,1) is the sensible pick over the nominally best ARIMA(1,1,1). A gap of roughly 2 is negligible, 4 to 7 is moderate evidence, and above 10 is decisive. Note the row names survive the sort, which is why the index column runs 4, 5, 3, 2, 1 and doubles as a record of the original ordering. This comparison is only valid because every candidate uses `d = 1` and is therefore fitted to identical data.

</details>

### Exercise 5.9: Model a level shift with an ARIMA regressor

**Task:** Nile flows drop sharply after the Aswan dam was completed around 1898. Fit an ARIMA(1,0,0) to the `Nile` series with an external step regressor that is 0 before 1898 and 1 from then on, and save the fitted model to `ex_5_9` so the size of the shift can be read off.

**Expected result:**

```
#> Call:
#> arima(x = Nile, order = c(1, 0, 0), xreg = step)
#>
#> Coefficients:
#>          ar1  intercept       step
#>       0.1326  1095.7685  -241.8568
#> s.e.  0.0992    28.2131    33.0115
#>
#> sigma^2 estimated as 16297:  log likelihood = -626.84,  aic = 1261.68
```

**Difficulty:** Advanced

[HINTS]
A level shift is just a dummy variable passed alongside the series, so the model estimates a coefficient for it like any regression.
Build `ts(c(rep(0, 27), rep(1, 73)), start = start(Nile))` and pass it as the `xreg` argument.

```r title="Your turn"
step <- ts(c(rep(0, 27), rep(1, 73)), start = start(Nile), frequency = 1)

ex_5_9 <- # your code here
ex_5_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
step <- ts(c(rep(0, 27), rep(1, 73)), start = start(Nile), frequency = 1)

ex_5_9 <- arima(Nile, order = c(1, 0, 0), xreg = step)
ex_5_9
#> Call:
#> arima(x = Nile, order = c(1, 0, 0), xreg = step)
#>
#> Coefficients:
#>          ar1  intercept       step
#>       0.1326  1095.7685  -241.8568
#> s.e.  0.0992    28.2131    33.0115
#>
#> sigma^2 estimated as 16297:  log likelihood = -626.84,  aic = 1261.68
```

**Explanation:** This is regression with ARIMA errors: the step coefficient of -241.9, with a standard error of 33.0, estimates a drop of roughly 242 flow units after 1898 while the AR(1) term absorbs the remaining serial correlation. Modelling the break explicitly beats differencing it away, because you keep an interpretable estimate of the shift and you can quote its uncertainty. Compare the AIC of 1261.68 here with 1267.25 for ARIMA(1,1,1) in Exercise 5.5: the intervention model wins even after paying for an extra parameter. To forecast from this model you must supply future values of the regressor via `newxreg`, which for a permanent step is simply a run of 1s.

</details>

## Section 6. Forecasting, accuracy, and backtesting (9 problems)

### Exercise 6.1: Forecast twelve months and return to the original scale

**Task:** Using the airline model fitted to the log of `AirPassengers`, produce point forecasts for the twelve months of 1961, exponentiate them back to passenger counts, and round to one decimal. Save the resulting monthly series to `ex_6_1`.

**Expected result:**

```
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 450.4 425.7 479.0 492.4 509.1 583.3 670.0 667.1 558.2 497.2 429.9 477.2
```

**Difficulty:** Intermediate

[HINTS]
The forecast object stores its point predictions in a dedicated element that is itself a proper time series.
Take `forecast(fit, h = 12)$mean` and wrap it in `exp()` before rounding.

```r title="Your turn"
fit <- arima(log(AirPassengers), order = c(0,1,1),
             seasonal = list(order = c(0,1,1), period = 12))

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- arima(log(AirPassengers), order = c(0,1,1),
             seasonal = list(order = c(0,1,1), period = 12))

ex_6_1 <- round(exp(forecast(fit, h = 12)$mean), 1)
ex_6_1
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 450.4 425.7 479.0 492.4 509.1 583.3 670.0 667.1 558.2 497.2 429.9 477.2
```

**Explanation:** The seasonal shape survives the round trip, with July and August forecast highest and November lowest, exactly as the historical pattern implies. The `$mean` element already carries the right calendar, so the exponentiated result prints as 1961 without any manual index work. One subtlety: exponentiating a forecast made on the log scale gives the median of the predicted distribution rather than the mean, so these numbers are slightly conservative as expectations. Exercise 6.9 shows the bias adjustment that converts them, and `forecast(fit, h = 12, lambda = 0)` applies the whole transform automatically.

</details>

### Exercise 6.2: Watch prediction intervals widen with the horizon

**Task:** Forecast six steps ahead from an automatically selected ARIMA on `WWWusage`, then build a data frame holding the horizon, the point forecast, the 95 percent lower and upper bounds, and the interval width, each rounded to two decimals. Save it to `ex_6_2`.

**Expected result:**

```
#>   h  point   lo95   hi95 width
#> 1 1 218.88 212.68 225.08 12.39
#> 2 2 218.15 203.31 232.99 29.68
#> 3 3 217.68 194.18 241.18 47.00
#> 4 4 217.37 185.65 249.09 63.44
#> 5 5 217.17 177.81 256.53 78.73
#> 6 6 217.04 170.61 263.47 92.85
```

**Difficulty:** Intermediate

[HINTS]
A forecast object keeps its interval bounds in two matrices, one per side, with a column for each requested confidence level.
Index them as `f$lower[, "95%"]` and `f$upper[, "95%"]`, and take the width as their difference.

```r title="Your turn"
f <- forecast(auto.arima(WWWusage), h = 6)

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- forecast(auto.arima(WWWusage), h = 6)

ex_6_2 <- data.frame(
  h = 1:6,
  point = round(as.numeric(f$mean), 2),
  lo95 = round(as.numeric(f$lower[, "95%"]), 2),
  hi95 = round(as.numeric(f$upper[, "95%"]), 2),
  width = round(as.numeric(f$upper[, "95%"] - f$lower[, "95%"]), 2)
)
ex_6_2
#>   h  point   lo95   hi95 width
#> 1 1 218.88 212.68 225.08 12.39
#> 2 2 218.15 203.31 232.99 29.68
#> 3 3 217.68 194.18 241.18 47.00
#> 4 4 217.37 185.65 249.09 63.44
#> 5 5 217.17 177.81 256.53 78.73
#> 6 6 217.04 170.61 263.47 92.85
```

**Explanation:** The point forecasts barely move, from 218.9 down to 217.0, while the interval width grows more than sevenfold from 12.4 to 92.9. That contrast is the real message of any forecast: the central path looks confident, but the honest uncertainty compounds with every step because each future error accumulates on top of the last. Reporting only the point forecast hides this entirely. Remember these intervals assume the model is correct and the residuals are normal, so in practice they are usually too narrow; `forecast(f, bootstrap = TRUE)` relaxes the normality assumption at least.

</details>

### Exercise 6.3: Split a series into train and test with window

**Task:** Set up an honest backtest of `AirPassengers` by holding out the final two years: build a training series ending in December 1958 and a test series starting in January 1959, then report their lengths and boundary years as one named vector saved to `ex_6_3`.

**Expected result:**

```
#>         train_n          test_n  train_end_year test_start_year
#>             120              24            1958            1959
```

**Difficulty:** Beginner

[HINTS]
Splitting a time series is never random; the training set must be the earlier block and the test set the later one.
Use `window(x, end = c(1958, 12))` and `window(x, start = c(1959, 1))`, then report `length()`, `end()[1]` and `start()[1]`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

ex_6_3 <- c(train_n = length(train), test_n = length(test),
            train_end_year = end(train)[1], test_start_year = start(test)[1])
ex_6_3
#>         train_n          test_n  train_end_year test_start_year
#>             120              24            1958            1959
```

**Explanation:** Randomly sampling rows the way you would for cross-sectional data leaks the future into the training set and produces accuracy numbers that cannot be reproduced in production. A chronological split is the minimum defence. Two rules of thumb: the test set should be at least as long as the horizon you actually forecast, and for seasonal data it should span whole cycles, which is why 24 months rather than 20 is the right choice here. The lengths tying out to 120 plus 24 equals 144 confirms the split neither dropped nor duplicated a month.

</details>

### Exercise 6.4: Score holdout forecasts with the accuracy function

**Task:** Fit the airline model to the logged training series ending in 1958, forecast 24 months, exponentiate back to counts, then score those forecasts against the held-out 1959 to 1960 actuals with the forecast package's accuracy function, rounded to four decimals. Save the score table to `ex_6_4`.

**Expected result:**

```
#>               ME    RMSE     MAE    MPE   MAPE   ACF1 Theil's U
#> Test set 39.4473 43.1837 39.4473 8.5163 8.5163 0.4636     0.843
```

**Difficulty:** Advanced

[HINTS]
The scoring function compares a forecast against a vector of actuals and returns one row of standard error measures.
Call `accuracy(fc, test)` where `fc` is the back-transformed point forecast series.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

fit2 <- arima(log(train), order = c(0,1,1),
              seasonal = list(order = c(0,1,1), period = 12))
fc <- exp(forecast(fit2, h = 24)$mean)

ex_6_4 <- round(accuracy(fc, test), 4)
ex_6_4
#>               ME    RMSE     MAE    MPE   MAPE   ACF1 Theil's U
#> Test set 39.4473 43.1837 39.4473 8.5163 8.5163 0.4636     0.843
```

**Explanation:** Read the diagnostics, not just the headline error. The mean error of 39.4 equals the mean absolute error exactly, which means every single forecast came in below the actual: the model is systematically under-predicting, not making random mistakes. The ACF1 of 0.46 confirms the errors are serially correlated rather than independent. Both symptoms trace back to the median-versus-mean issue from Exercise 6.1 plus genuine acceleration in 1959 to 1960 that the training window never saw. Theil's U below 1 still says the model beats a naive forecast, and RMSE punishes large misses harder than MAE, which is why it exceeds MAE here.

</details>

### Exercise 6.5: Benchmark naive against seasonal naive

**Task:** Before trusting any model you should beat the obvious baselines, so forecast the 1959 to 1960 holdout with both the naive method and the seasonal naive method, and compare their test-set RMSE, MAE and MAPE in one rounded matrix saved to `ex_6_5`.

**Expected result:**

```
#>           RMSE    MAE   MAPE
#> naive  137.329 115.25 23.577
#> snaive  76.995  71.25 15.523
```

**Difficulty:** Intermediate

[HINTS]
Both baselines are one-line functions in the forecast package, and the scoring function returns a training row and a test row that you must select from.
Bind `accuracy(naive(train, h = 24), test)["Test set", ...]` and the `snaive()` equivalent with `rbind()`.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

ex_6_5 <- round(rbind(
  naive  = accuracy(naive(train, h = 24), test)["Test set", c("RMSE","MAE","MAPE")],
  snaive = accuracy(snaive(train, h = 24), test)["Test set", c("RMSE","MAE","MAPE")]
), 3)
ex_6_5
#>           RMSE    MAE   MAPE
#> naive  137.329 115.25 23.577
#> snaive  76.995  71.25 15.523
```

**Explanation:** The naive method repeats the last observed value forever and the seasonal naive repeats the value from the same month last year, which is why the seasonal version nearly halves every error measure on a strongly seasonal series. These numbers give the airline model from Exercise 6.4, at RMSE 43.2, a meaningful reference point: it beats seasonal naive by about 44 percent, so the extra complexity earns its keep. Any model that cannot beat `snaive()` on seasonal data should be discarded, and quoting a MAPE with no baseline beside it tells a stakeholder nothing about whether the forecast is good.

</details>

### Exercise 6.6: Compute MAPE by hand and reconcile it

**Task:** Verify the forecast package's headline percentage error by computing the mean absolute percentage error yourself from the 24 holdout actuals and the exponentiated airline-model forecasts, rounded to three decimals. Save the single number to `ex_6_6` and check it against Exercise 6.4.

**Expected result:**

```
#> [1] 8.516
```

**Difficulty:** Intermediate

[HINTS]
The measure is the average of the absolute errors expressed as a fraction of the actual value, then scaled to a percentage.
`mean(abs((actual - forecast) / actual)) * 100`, with both inputs coerced by `as.numeric()`.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
fit2 <- arima(log(train), order = c(0,1,1),
              seasonal = list(order = c(0,1,1), period = 12))
fc <- exp(forecast(fit2, h = 24)$mean)

ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
fit2 <- arima(log(train), order = c(0,1,1),
              seasonal = list(order = c(0,1,1), period = 12))
fc <- exp(forecast(fit2, h = 24)$mean)

ex_6_6 <- round(mean(abs((as.numeric(test) - as.numeric(fc)) / as.numeric(test))) * 100, 3)
ex_6_6
#> [1] 8.516
```

**Explanation:** The result matches the MAPE column in Exercise 6.4 to three decimals, which is the point: knowing the formula means you can compute the measure on any two vectors without a forecast object, and you can spot when a reported figure has been computed differently. MAPE has two well-known weaknesses. It is undefined when an actual is zero, and it penalises over-prediction more heavily than under-prediction because the denominator is the actual, which makes it a poor choice for intermittent demand. MASE, available in the same `accuracy()` output when a training series is supplied, avoids both problems by scaling against a naive benchmark.

</details>

### Exercise 6.7: Check that model residuals look like white noise

**Task:** A model is only trustworthy if it has extracted all the structure, so run a Ljung-Box test over 24 lags on the residuals of the airline model fitted to the logged 1949 to 1958 training window, adjusting the degrees of freedom for the two estimated coefficients. Save the test to `ex_6_7`.

**Expected result:**

```
#> 	Box-Ljung test
#>
#> data:  res
#> X-squared = 20.34, df = 22, p-value = 0.5618
```

**Difficulty:** Advanced

[HINTS]
Residual tests must pay for the parameters the model already estimated, and the portmanteau test has an argument for exactly that.
`Box.test(residuals(fit2), lag = 24, fitdf = 2, type = "Ljung-Box")`.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
fit2 <- arima(log(train), order = c(0,1,1),
              seasonal = list(order = c(0,1,1), period = 12))
res <- residuals(fit2)

ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
fit2 <- arima(log(train), order = c(0,1,1),
              seasonal = list(order = c(0,1,1), period = 12))
res <- residuals(fit2)

ex_6_7 <- Box.test(res, lag = 24, fitdf = 2, type = "Ljung-Box")
ex_6_7
#> 	Box-Ljung test
#>
#> data:  res
#> X-squared = 20.34, df = 22, p-value = 0.5618
```

**Explanation:** Here failing to reject is the good outcome: a p-value of 0.56 says the residuals are indistinguishable from white noise, so the model has left no systematic pattern behind. The `fitdf = 2` is what drops the degrees of freedom from 24 to 22, accounting for the `ma1` and `sma1` coefficients; omitting it inflates the degrees of freedom and makes the test too lenient. Note the contrast with Exercise 6.4, where the holdout errors were clearly autocorrelated. Clean in-sample residuals plus dirty out-of-sample errors is the classic signature of a structural change after the training window, not of a badly specified model.

</details>

### Exercise 6.8: Backtest with rolling-origin cross-validation

**Task:** One holdout is a single sample of model performance, so run rolling-origin cross-validation on the `Nile` series with an ARIMA(1,1,1) refitted at each origin and a one-step horizon. Report the number of usable errors together with the RMSE and MAE across all origins as a named vector saved to `ex_6_8`.

**Expected result:**

```
#> n_errors     rmse      mae
#>   96.000  146.420  117.939
```

**Difficulty:** Advanced

[HINTS]
The forecast package has a cross-validation function that takes a forecasting function of the series and the horizon, and returns a series of errors.
Define `far_arima <- function(x, h) forecast(arima(x, order = c(1,1,1)), h = h)` and pass it to `tsCV(Nile, far_arima, h = 1)`.

```r title="Your turn"
far_arima <- function(x, h) forecast(arima(x, order = c(1,1,1)), h = h)

ex_6_8 <- # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
far_arima <- function(x, h) forecast(arima(x, order = c(1,1,1)), h = h)
e <- tsCV(Nile, far_arima, h = 1)

ex_6_8 <- c(n_errors = sum(!is.na(e)),
            rmse = round(sqrt(mean(e^2, na.rm = TRUE)), 3),
            mae = round(mean(abs(e), na.rm = TRUE), 3))
ex_6_8
#> n_errors     rmse      mae
#>   96.000  146.420  117.939
```

**Explanation:** `tsCV()` walks an expanding window forward through the series: it fits on everything up to time t, forecasts t plus 1, records the error, then moves on. That yields 96 out-of-sample errors from 100 observations rather than the single holdout of Exercise 6.4, so the resulting RMSE is a far more stable estimate. The early `NA` values appear because the first few windows are too short to fit an ARIMA. The cost is compute, since the model is refitted at every origin, which is why `tsCV()` is slow on long series and is usually run with a wrapper that reuses fitted coefficients instead.

</details>

### Exercise 6.9: Bias-adjust log forecasts back to the original scale

**Task:** Exponentiating a log-scale forecast returns the median rather than the mean, so build a data frame for the first six months of 1961 holding the plain exponentiated forecast, the bias-adjusted mean, and the exponentiated 95 percent bounds, all rounded to one decimal. Save it to `ex_6_9`.

**Expected result:**

```
#>      month naive_exp bias_adj  lo95  hi95
#> 1 Jan 1961     450.4    450.7 419.1 484.0
#> 2 Feb 1961     425.7    426.0 391.5 463.0
#> 3 Mar 1961     479.0    479.3 435.9 526.4
#> 4 Apr 1961     492.4    492.7 443.9 546.2
#> 5 May 1961     509.1    509.4 455.0 569.5
#> 6 Jun 1961     583.3    583.7 517.3 657.8
```

**Difficulty:** Advanced

[HINTS]
The correction multiplies the exponentiated point forecast by one plus half the residual variance of the fitted model.
`exp(mean) * (1 + f3$model$sigma2 / 2)`; the interval bounds need no adjustment, only `exp()`.

```r title="Your turn"
fit3 <- arima(log(AirPassengers), order = c(0,1,1),
              seasonal = list(order = c(0,1,1), period = 12))
f3 <- forecast(fit3, h = 6, level = 95)

ex_6_9 <- # your code here
ex_6_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit3 <- arima(log(AirPassengers), order = c(0,1,1),
              seasonal = list(order = c(0,1,1), period = 12))
f3 <- forecast(fit3, h = 6, level = 95)

ex_6_9 <- data.frame(
  month = c("Jan 1961","Feb 1961","Mar 1961","Apr 1961","May 1961","Jun 1961"),
  naive_exp = round(exp(as.numeric(f3$mean)), 1),
  bias_adj = round(exp(as.numeric(f3$mean)) * (1 + f3$model$sigma2 / 2), 1),
  lo95 = round(exp(as.numeric(f3$lower)), 1),
  hi95 = round(exp(as.numeric(f3$upper)), 1)
)
ex_6_9
#>      month naive_exp bias_adj  lo95  hi95
#> 1 Jan 1961     450.4    450.7 419.1 484.0
#> 2 Feb 1961     425.7    426.0 391.5 463.0
#> 3 Mar 1961     479.0    479.3 435.9 526.4
#> 4 Apr 1961     492.4    492.7 443.9 546.2
#> 5 May 1961     509.1    509.4 455.0 569.5
#> 6 Jun 1961     583.3    583.7 517.3 657.8
```

**Explanation:** The adjustment is tiny here, about 0.07 percent, because the residual variance on the log scale is only 0.00135; on a noisier series it can move the forecast by several percent and matters a great deal when the forecasts are summed into a budget. The correction applies to the point forecast alone: quantiles are preserved under a monotone transform, so exponentiating the bounds is already exact and adjusting them would be wrong. In everyday work `forecast(fit, h = 6, lambda = 0, biasadj = TRUE)` does the whole log-and-back round trip for you, and `lambda = "auto"` picks a Box-Cox power instead of forcing a log.

</details>

## What to do next

- [Time Series Analysis in R](Time-Series-Analysis-With-R.html): the companion tutorial covering the concepts these problems drill, from ts objects through ARIMA and forecast evaluation.
- [Time Series Exercises in R](Time-Series-Exercises-in-R.html): a shorter 30-problem set on the same syllabus, useful as a warm-up or a second pass.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): regression with ARIMA errors and trend models build directly on these fundamentals.
- [EDA Exercises in R](EDA-Exercises-in-R.html): the plotting and summarising habits that should come before any forecasting model.
