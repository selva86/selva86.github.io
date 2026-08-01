---
title: "Forecast Evaluation Exercises in R: 50 Practice Problems"
slug: "Forecast-Evaluation-Exercises-in-R"
description: "Forecast accuracy exercises in R: 50 problems on MAE, RMSE, MAPE, MASE, train/test splits, accuracy(), residual diagnostics and rolling-origin CV."
keywords: "forecast accuracy exercises in r, forecast evaluation in R, MAE RMSE MAPE in R, MASE in R, accuracy() function, time series cross validation in R, tsCV exercises, forecast error"
mathjax: false
webr: true
date: "2026-07-22"
post_type: "EX"
sidebar_title: "Forecast Evaluation Exercises"
sidebar_order: 105
fr_parent: "Forecast-Accuracy-in-R.html"
auto_link_terms: "forecast evaluation exercises|forecast accuracy exercises|forecast error exercises|mase exercises in r|forecast evaluation practice"
auto_link_case_sensitive: false
target_keyword: "forecast accuracy exercises in r"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Forecast Evaluation Exercises in R: 50 Practice Problems

<p class="lead">Fifty problems on judging whether a forecast is any good: raw errors, MAE and RMSE, MAPE and MASE, honest train/test splits, the <code>accuracy()</code> function, benchmark comparisons, residual diagnostics, rolling-origin cross-validation and prediction-interval coverage. Every solution is hidden until you click reveal.</p>

Work top to bottom. Sections 5 to 7 reuse objects built earlier, so run each section's setup block before its exercises.

```r title="Run this once before any exercise"
library(forecast)
library(dplyr)

# Shared split used across the hub: train on 1949-1958, hold out 1959-1960
ap_train <- window(AirPassengers, end = c(1958, 12))
ap_test  <- window(AirPassengers, start = c(1959, 1))

# Helper reused in several exercises
rmse <- function(actual, forecast) sqrt(mean((actual - forecast)^2))
```

## Section 1. Forecast errors from first principles (7 problems)

Every accuracy metric is a summary of one vector: the forecast errors. Build that vector by hand first, then watch each metric squeeze it into a single number. These exercises use one small demand table.

```r title="Run this before Section 1"
weekly <- data.frame(
  week     = 1:8,
  actual   = c(120, 135, 128, 142, 150, 138, 161, 155),
  forecast = c(115, 140, 130, 138, 145, 145, 152, 158)
)
weekly
```

### Exercise 1.1: Compute raw forecast errors from actuals and predictions

**Task:** A demand planner has eight weeks of actual units sold alongside the forecast issued a week earlier, in the `weekly` data frame. Compute the forecast error for each week as actual minus forecast and save the result to `ex_1_1`.

**Expected result:**

```
#> [1]  5 -5 -2  4  5 -7  9 -3
```

**Difficulty:** Beginner

[HINTS]
The error is defined as what happened minus what you said would happen, computed one row at a time.
Subtract the two columns directly: R does the arithmetic element by element.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- weekly$actual - weekly$forecast
ex_1_1
#> [1]  5 -5 -2  4  5 -7  9 -3
```

**Explanation:** Forecast error is conventionally actual minus forecast, so a positive value means you under-forecast and a negative value means you over-forecast. Keeping that sign convention matters: reverse it and every bias diagnostic later in this hub flips direction. R subtracts the two columns element by element, so no loop is needed.

</details>

### Exercise 1.2: Measure forecast bias with the mean error

**Task:** The planner wants to know whether the forecast leans high or low on average across the eight weeks. Compute the mean of the errors you built in `ex_1_1` and save the result to `ex_1_2`.

**Expected result:**

```
#> [1] 0.75
```

**Difficulty:** Beginner

[HINTS]
Positive and negative errors should cancel here: that cancellation is exactly what makes this number a bias measure, not an accuracy measure.
Apply `mean()` to the error vector.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mean(ex_1_1)
ex_1_2
#> [1] 0.75
```

**Explanation:** Mean error (ME) measures bias, not accuracy. A value near zero says over- and under-forecasts roughly balance out, which is what you want, but a forecast that misses by +50 and -50 alternately also scores zero. That is why ME is always read next to MAE or RMSE, never alone.

</details>

### Exercise 1.3: Compute mean absolute error by hand

**Task:** Compute the mean absolute error of the weekly forecast by averaging the absolute values of the errors stored in `ex_1_1`, label it `MAE` and save the named result to `ex_1_3` so you can compare it with the bias number.

**Expected result:**

```
#> MAE 
#>   5 
```

**Difficulty:** Beginner

[HINTS]
Stripping the sign before averaging stops overshoots and undershoots from cancelling each other out.
Wrap the error vector in `abs()` before passing it to `mean()`, then name the value with `c(MAE = ...)`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- c(MAE = mean(abs(ex_1_1)))
ex_1_3
#> MAE 
#>   5 
```

**Explanation:** MAE reports the typical miss in the units of the series, here five units of demand per week. Compare it with the ME of 0.75 from the previous exercise: the forecast is nearly unbiased yet still off by five units a week, which is the standard reason to report both numbers together. Naming the value with `c(MAE = ...)` keeps the output self-labelling.

</details>

### Exercise 1.4: Compute root mean squared error by hand

**Task:** Compute the root mean squared error for the same eight weekly errors in `ex_1_1` by squaring, averaging, then taking the square root, and save the rounded result to `ex_1_4` for comparison against MAE.

**Expected result:**

```
#> [1] 5.4083
```

**Difficulty:** Intermediate

[HINTS]
Square first so that large misses count for more than proportionally, then undo the squaring at the very end to get back to the original units.
Compose `sqrt(mean(e^2))` where `e` is the error vector.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- round(sqrt(mean(ex_1_1^2)), 4)
ex_1_4
#> [1] 5.4083
```

**Explanation:** RMSE is always greater than or equal to MAE, and the gap widens as the errors become more uneven. Here RMSE is 5.41 against an MAE of 5, a small gap because no single week blows out. Optimising RMSE targets the conditional mean of the series, while optimising MAE targets the conditional median.

</details>

### Exercise 1.5: Convert absolute errors into percentage errors

**Task:** The planner reports to a stakeholder who thinks in percentages rather than units. Convert each of the eight errors in `ex_1_1` into a percentage of that week's actual demand, round to two decimals and save to `ex_1_5`.

**Expected result:**

```
#> [1]  4.17 -3.70 -1.56  2.82  3.33 -5.07  5.59 -1.94
```

**Difficulty:** Beginner

[HINTS]
A percentage error rescales each error by the size of the thing being forecast, so the denominator changes from row to row.
Compute `100 * error / actual`, then round with `round(x, 2)`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- round(100 * ex_1_1 / weekly$actual, 2)
ex_1_5
#> [1]  4.17 -3.70 -1.56  2.82  3.33 -5.07  5.59 -1.94
```

**Explanation:** Dividing by the actual makes errors comparable across weeks of different volume, which is why percentage errors travel well between products or regions. The catch appears whenever an actual is near zero: the denominator collapses and the percentage explodes. Exercise 3.2 puts a number on how badly that distorts the average.

</details>

### Exercise 1.6: Write a reusable error-summary function

**Task:** Rather than retyping three formulas every time, write a function `error_summary(actual, forecast)` that returns a named vector of ME, MAE and RMSE, call it on the `weekly` columns, round to four decimals and save to `ex_1_6`.

**Expected result:**

```
#>     ME    MAE   RMSE 
#> 0.7500 5.0000 5.4083 
```

**Difficulty:** Intermediate

[HINTS]
Compute the error vector once inside the function body, then build all three summaries from it.
Return `c(ME = ..., MAE = ..., RMSE = ...)` so the names come back attached to the values.

```r title="Your turn"
error_summary <- function(actual, forecast) {
  # your code here
}

ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
error_summary <- function(actual, forecast) {
  e <- actual - forecast
  c(ME = mean(e), MAE = mean(abs(e)), RMSE = sqrt(mean(e^2)))
}

ex_1_6 <- round(error_summary(weekly$actual, weekly$forecast), 4)
ex_1_6
#>     ME    MAE   RMSE 
#> 0.7500 5.0000 5.4083 
```

**Explanation:** Naming the elements inside `c()` gives you a self-documenting result you can index by name later, as in `ex_1_6[["RMSE"]]`. Computing `e` once avoids recomputing the subtraction three times, and the same skeleton extends cleanly to MAPE or MASE. The `forecast` package ships `accuracy()` for exactly this job, covered in Section 4.

</details>

### Exercise 1.7: Show how RMSE punishes a single large miss

**Task:** Compare two eight-period error vectors with identical MAE: `e_spread` misses by three every period, while `e_spike` is perfect except for one miss of 24. Build a data frame of MAE and RMSE for both and save it to `ex_1_7`.

**Expected result:**

```
#>   series MAE  RMSE
#> 1 spread   3 3.000
#> 2  spike   3 8.485
```

**Difficulty:** Intermediate

[HINTS]
Both vectors are engineered to have the same average absolute miss, so any difference in the second metric comes from how the errors are distributed.
Build the frame with `data.frame(series = ..., MAE = ..., RMSE = ...)` and compute each metric with `mean(abs(x))` and `sqrt(mean(x^2))`.

```r title="Run this before the exercise"
e_spread <- c(3, -3, 3, -3, 3, -3, 3, -3)
e_spike  <- c(0, 0, 0, 0, 0, 0, 0, -24)
```

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- data.frame(
  series = c("spread", "spike"),
  MAE    = c(mean(abs(e_spread)), mean(abs(e_spike))),
  RMSE   = round(c(sqrt(mean(e_spread^2)), sqrt(mean(e_spike^2))), 3)
)
ex_1_7
#>   series MAE  RMSE
#> 1 spread   3 3.000
#> 2  spike   3 8.485
```

**Explanation:** Identical MAE, RMSE nearly triple. Squaring gives the lone 24-unit miss enormous weight, so RMSE is the metric to choose when one catastrophic error costs far more than several small ones, such as a stockout. When all misses cost the same per unit, MAE is the honest summary and RMSE will mislead you.

</details>

## Section 2. Scale-dependent metrics on real series (7 problems)

MAE and RMSE speak in the units of the series, which makes them easy to explain and impossible to compare across series. These exercises use the Nile flow record, the `WWWusage` internet-traffic series and the AirPassengers split from the setup block.

```r title="Run this before Section 2"
nile_train <- window(Nile, end = 1960)
nile_test  <- window(Nile, start = 1961)

www_train <- window(WWWusage, end = 80)
www_test  <- window(WWWusage, start = 81)
```

### Exercise 2.1: Score a naive forecast of Nile flow on held-out years

**Task:** A hydrologist holds out the last ten years of the `Nile` annual flow record. Forecast those ten years with the naive method fitted on `nile_train`, compute the mean absolute error against `nile_test` and save the rounded value to `ex_2_1`.

**Expected result:**

```
#> [1] 128
```

**Difficulty:** Beginner

[HINTS]
The naive method carries the last observed value forward, so every one of the ten forecasts is the same number.
Call `naive(nile_train, h = 10)` and compare its `$mean` component against `nile_test`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fc_nile <- naive(nile_train, h = 10)
ex_2_1 <- round(mean(abs(nile_test - fc_nile$mean)), 3)
ex_2_1
#> [1] 128
```

**Explanation:** The `$mean` element of a forecast object holds the point forecasts as a `ts` aligned to the test period, so subtracting `nile_test` matches observations to forecasts by date automatically. An MAE of 128 is meaningless on its own; it only becomes interpretable next to the series level of roughly 900, or next to a rival method.

</details>

### Exercise 2.2: Compare the mean method against naive on internet traffic

**Task:** Using the `WWWusage` split, forecast the final 20 periods with both the mean method and the naive method, compute the RMSE of each against `www_test` and save both values in one named vector called `ex_2_2`.

**Expected result:**

```
#>  mean_method naive_method 
#>       69.442       82.817 
```

**Difficulty:** Intermediate

[HINTS]
One method predicts the historical average forever, the other predicts the most recent value forever: they will disagree sharply on a trending series.
Use `meanf()` and `naive()` with `h = 20`, and score each with the `rmse()` helper from the setup block.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- round(c(
  mean_method  = rmse(www_test, meanf(www_train, h = 20)$mean),
  naive_method = rmse(www_test, naive(www_train, h = 20)$mean)
), 3)
ex_2_2
#>  mean_method naive_method 
#>       69.442       82.817 
```

**Explanation:** The mean method wins here, which is a useful surprise: `WWWusage` rises then falls back, so the long-run average lands closer than the last observed value. Never assume naive is the strongest baseline. Running both costs one extra line and occasionally saves you from shipping a model that loses to an average.

</details>

### Exercise 2.3: Test whether adding drift improves the Nile forecast

**Task:** A drift forecast extends the average historical slope forward instead of holding flat. Compute the test RMSE of both the naive and the drift method on `nile_test` over the ten-year horizon and save the pair to `ex_2_3`.

**Expected result:**

```
#>   naive   drift 
#> 152.954 155.374 
```

**Difficulty:** Intermediate

[HINTS]
Drift is the random walk with a slope estimated from the first and last training observations, so it only helps when the series genuinely trends.
Use `rwf(nile_train, h = 10, drift = TRUE)` alongside `naive(nile_train, h = 10)`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- round(c(
  naive = rmse(nile_test, naive(nile_train, h = 10)$mean),
  drift = rmse(nile_test, rwf(nile_train, h = 10, drift = TRUE)$mean)
), 3)
ex_2_3
#>   naive   drift 
#> 152.954 155.374 
```

**Explanation:** Drift is slightly worse, so the extra parameter bought nothing. The Nile record has a level shift around 1900 rather than a steady trend, and drift fitted over the whole history extrapolates a slope that is not really there. Added flexibility must earn its keep on held-out data, not on the training fit.

</details>

### Exercise 2.4: Score a seasonal naive forecast of air passengers

**Task:** Using `ap_train` and `ap_test` from the setup block, forecast 24 months ahead with the seasonal naive method, then compute both MAE and RMSE against the test window and save them as a named vector `ex_2_4`.

**Expected result:**

```
#>    MAE   RMSE 
#> 71.250 76.995 
```

**Difficulty:** Intermediate

[HINTS]
Seasonal naive repeats the value from the same month one year earlier, which is the right baseline for a monthly series with a strong annual cycle.
Call `snaive(ap_train, h = 24)` and score its `$mean` with `mean(abs(...))` and the `rmse()` helper.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fc_sn <- snaive(ap_train, h = 24)
ex_2_4 <- round(c(
  MAE  = mean(abs(ap_test - fc_sn$mean)),
  RMSE = rmse(ap_test, fc_sn$mean)
), 3)
ex_2_4
#>    MAE   RMSE 
#> 71.250 76.995 
```

**Explanation:** RMSE exceeds MAE by about 8 percent, a modest gap saying no single month blows out. Seasonal naive is the benchmark every serious model on this series must beat, because it captures the annual cycle for free. Note that it ignores the upward trend entirely, which is why the errors grow with horizon in Exercise 2.6.

</details>

### Exercise 2.5: Show that MAE cannot be compared across two series

**Task:** Compute the naive-method MAE on the Nile test window and on the `WWWusage` test window, put both in one named vector `ex_2_5`, and notice that the smaller number does not mean the better forecast.

**Expected result:**

```
#> nile_MAE  www_MAE 
#>    128.0     76.2 
```

**Difficulty:** Beginner

[HINTS]
One series is measured in hundreds of millions of cubic metres, the other in tens of users, so their errors live on different scales.
Compute `mean(abs(actual - forecast))` once per series and combine the two with a named `c()`.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- round(c(
  nile_MAE = mean(abs(nile_test - naive(nile_train, h = 10)$mean)),
  www_MAE  = mean(abs(www_test - naive(www_train, h = 20)$mean))
), 3)
ex_2_5
#> nile_MAE  www_MAE 
#>    128.0     76.2 
```

**Explanation:** The `WWWusage` MAE is smaller in absolute terms, yet relative to a series that sits around 200 it is a far worse miss than 128 on a series that sits around 900. Scale-dependent metrics compare models on one series only. Section 3 introduces MAPE and MASE, which are built to cross that boundary.

</details>

### Exercise 2.6: Break the seasonal naive error down by forecast horizon

**Task:** Forecast accuracy usually decays as the horizon lengthens. Build a data frame with one row per horizon from 1 to 24 holding the absolute error of the seasonal naive forecast at that horizon, save it to `ex_2_6` and print the first six rows.

**Expected result:**

```
#>   h abs_error
#> 1 1        20
#> 2 2        24
#> 3 3        44
#> 4 4        48
#> 5 5        57
#> 6 6        37
```

**Difficulty:** Advanced

[HINTS]
The forecast object already stores the 24 point forecasts in the order they occur, so horizon is just the position in that vector.
Build `data.frame(h = 1:24, abs_error = round(as.numeric(abs(ap_test - fc_sn$mean)), 1))`.

```r title="Your turn"
ex_2_6 <- # your code here
head(ex_2_6, 6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- data.frame(
  h         = 1:24,
  abs_error = round(as.numeric(abs(ap_test - fc_sn$mean)), 1)
)
head(ex_2_6, 6)
#>   h abs_error
#> 1 1        20
#> 2 2        24
#> 3 3        44
#> 4 4        48
#> 5 5        57
#> 6 6        37
```

**Explanation:** `as.numeric()` strips the time-series attributes so the result is a plain column rather than a `ts` that `data.frame()` would mangle. A single average MAE hides this profile entirely: a model that is excellent one month out and hopeless at twelve can post the same headline number as a mediocre but stable one.

</details>

### Exercise 2.7: Find the horizons where the forecast fails worst

**Task:** From the per-horizon table in `ex_2_6`, identify the five horizons with the largest absolute error by sorting in descending order and keeping the top rows, then save that ranked slice to `ex_2_7`.

**Expected result:**

```
#>    h abs_error
#> 1 19       131
#> 2 16       113
#> 3 17       109
#> 4 21       104
#> 5 22       102
```

**Difficulty:** Intermediate

[HINTS]
You want the rows ordered from worst to best, then cut off after the first handful.
Chain `arrange(desc(abs_error))` into `head(5)`.

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- ex_2_6 |>
  arrange(desc(abs_error)) |>
  head(5)
ex_2_7
#>    h abs_error
#> 1 19       131
#> 2 16       113
#> 3 17       109
#> 4 21       104
#> 5 22       102
```

**Explanation:** Every one of the worst five horizons sits in the second forecast year, which is the fingerprint of a method that ignores trend: seasonal naive repeats 1958 twice while traffic keeps climbing. Diagnosing failure by horizon tells you what to fix, whereas a single MAE only tells you that something is wrong.

</details>

## Section 3. Percentage and scaled errors (7 problems)

Percentage errors let you compare across series, and they misbehave whenever the actuals approach zero. Scaled errors fix that by dividing by an in-sample benchmark instead of by the actual. These exercises build both by hand before trusting any package.

### Exercise 3.1: Compute MAPE for the seasonal naive forecast by hand

**Task:** Compute the mean absolute percentage error of the seasonal naive forecast `fc_sn` against `ap_test`, using each month's own actual as the denominator, then round to three decimals and save the result to `ex_3_1`.

**Expected result:**

```
#> [1] 15.523
```

**Difficulty:** Intermediate

[HINTS]
Convert each error to a percentage of that period's actual first, take absolute values, and only then average.
Compute `mean(100 * abs((actual - forecast) / actual))`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- round(mean(100 * abs((ap_test - fc_sn$mean) / ap_test)), 3)
ex_3_1
#> [1] 15.523
```

**Explanation:** The forecast is off by about 15.5 percent on average, a statement any stakeholder understands without knowing the series scale. Take the absolute value of the ratio, not of the numerator alone, or negative actuals would silently flip signs. Exercise 4.2 confirms this figure against the MAPE column of `accuracy()`.

</details>

### Exercise 3.2: Show how MAPE explodes when actuals approach zero

**Task:** A near-zero actual makes the percentage-error denominator collapse. Using the `small` data frame, add a `pct_error` column holding the absolute percentage error per row, save the result to `ex_3_2` and print the overall MAPE.

**Expected result:**

```
#>   actual forecast pct_error
#> 1    0.5        2     300.0
#> 2    2.0        3      50.0
#> 3   10.0       11      10.0
#> 4   25.0       24       4.0
#> 5   40.0       41       2.5
#> MAPE: 73.3
```

**Difficulty:** Advanced

[HINTS]
Look at the first row before computing anything: a miss of 1.5 units against an actual of 0.5 is a huge percentage even though the absolute miss is tiny.
Use `mutate(pct_error = round(100 * abs(actual - forecast) / actual, 1))`, then `mean()` that column.

```r title="Run this before the exercise"
small <- data.frame(
  actual   = c(0.5, 2, 10, 25, 40),
  forecast = c(2.0, 3, 11, 24, 41)
)
```

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- small |>
  mutate(pct_error = round(100 * abs(actual - forecast) / actual, 1))
ex_3_2
#>   actual forecast pct_error
#> 1    0.5        2     300.0
#> 2    2.0        3      50.0
#> 3   10.0       11      10.0
#> 4   25.0       24       4.0
#> 5   40.0       41       2.5
cat("MAPE:", round(mean(ex_3_2$pct_error), 1), "\n")
#> MAPE: 73.3
```

**Explanation:** Four of the five rows are forecast to within 10 percent, yet the reported MAPE is 73.3 because one row with an actual of 0.5 contributes 300. This is why MAPE is dangerous for intermittent demand, new products or any series that can dip near zero. Use MASE or a scaled error there instead.

</details>

### Exercise 3.3: Compute symmetric MAPE on the same awkward data

**Task:** Symmetric MAPE divides by the average of the actual and the forecast rather than by the actual alone. Compute sMAPE on the `small` data frame, round to two decimals and save the result to `ex_3_3` for comparison with the 73.3 you just saw.

**Expected result:**

```
#> [1] 35.21
```

**Difficulty:** Advanced

[HINTS]
Making the denominator depend on both numbers stops a tiny actual from dominating, because the forecast props the denominator up.
Compute `mean(200 * abs(actual - forecast) / (abs(actual) + abs(forecast)))`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- round(mean(200 * abs(small$actual - small$forecast) /
                       (abs(small$actual) + abs(small$forecast))), 2)
ex_3_3
#> [1] 35.21
```

**Explanation:** sMAPE halves the damage, 35.2 against 73.3, because the forecast of 2 keeps the first denominator away from zero. The 200 in the numerator is not a typo: dividing by the sum rather than the mean of the two values needs a factor of two to stay on a percentage scale. sMAPE is still unstable when both values approach zero, and it is not truly symmetric, so treat it as a patch rather than a cure.

</details>

### Exercise 3.4: Compute MASE for the Nile forecast with a naive scaling term

**Task:** MASE divides the test MAE by the in-sample mean absolute change of a naive forecast. Compute that scaling term on `nile_train`, divide the naive test MAE by it and save the rounded value to `ex_3_4`.

**Expected result:**

```
#> [1] 0.968
```

**Difficulty:** Advanced

[HINTS]
The denominator is how badly a one-step naive forecast would have done inside the training period, which is the yardstick everything is measured against.
Compute `mean(abs(diff(nile_train)))` for the scale, then divide the test MAE by it.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scale_nile <- mean(abs(diff(nile_train)))
ex_3_4 <- round(mean(abs(nile_test - naive(nile_train, h = 10)$mean)) / scale_nile, 3)
ex_3_4
#> [1] 0.968
```

**Explanation:** A MASE just under 1 means the ten-year-ahead naive forecast is marginally better than a one-step naive forecast was in training, which is close to a coin flip. The `diff()` call gives period-to-period changes, and averaging their absolute values gives the natural difficulty scale of the series. MASE has no zero-denominator problem unless the series never changes.

</details>

### Exercise 3.5: Compute seasonal MASE for the air passenger forecast

**Task:** For seasonal data the MASE denominator uses the seasonal naive method instead. Compute the mean absolute twelve-month difference of `ap_train`, divide the seasonal naive test MAE by it, and save the rounded value to `ex_3_5`.

**Expected result:**

```
#> [1] 2.494
```

**Difficulty:** Advanced

[HINTS]
The right yardstick for monthly seasonal data is how far the series moves from one year to the same month next year.
Pass `lag = 12` to `diff()` when building the scaling term.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scale_ap <- mean(abs(diff(ap_train, lag = 12)))
ex_3_5 <- round(mean(abs(ap_test - fc_sn$mean)) / scale_ap, 3)
ex_3_5
#> [1] 2.494
```

**Explanation:** A MASE of 2.49 says the 24-month-ahead forecast is roughly two and a half times worse than an in-sample one-step seasonal naive forecast, which is expected given the long horizon. Getting the lag wrong is the classic MASE bug: using `lag = 1` on seasonal data produces a much smaller denominator and a flatteringly inflated score.

</details>

### Exercise 3.6: Compare two models on a common MASE scale

**Task:** Fit an ETS model to `ap_train`, forecast 24 months, then build a two-row data frame comparing the MASE of the seasonal naive and ETS forecasts against `ap_test` using the shared `scale_ap` denominator, saved as `ex_3_6`.

**Expected result:**

```
#>    model  MASE
#> 1 snaive 2.494
#> 2    ets 2.212
```

**Difficulty:** Intermediate

[HINTS]
Both models must be divided by the same scaling term, or the comparison is meaningless.
Fit with `ets(ap_train)`, forecast with `forecast(fit, h = 24)`, then divide each test MAE by `scale_ap`.

```r title="Your turn"
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_ets <- ets(ap_train)
fc_ets  <- forecast(fit_ets, h = 24)

ex_3_6 <- data.frame(
  model = c("snaive", "ets"),
  MASE  = round(c(mean(abs(ap_test - fc_sn$mean)),
                  mean(abs(ap_test - fc_ets$mean))) / scale_ap, 3)
)
ex_3_6
#>    model  MASE
#> 1 snaive 2.494
#> 2    ets 2.212
```

**Explanation:** ETS beats the benchmark by roughly 11 percent on MASE. Because the denominator is a property of the training data rather than of any model, MASE values are comparable across models on this series and across series in a portfolio, which is why forecasting competitions favour it. `ets()` here selects a multiplicative error, damped trend and multiplicative seasonality specification automatically.

</details>

### Exercise 3.7: Screen a series for values that make MAPE undefined

**Task:** Before reporting MAPE on a new series, audit it for zeros and negatives. Given the `audit` vector, count how many values are exactly zero, how many are negative, and flag whether MAPE is safe, saving all three to `ex_3_7`.

**Expected result:**

```
#>     n_zero n_negative  mape_safe 
#>          2          1          0 
```

**Difficulty:** Intermediate

[HINTS]
A zero actual makes the percentage error infinite and a negative actual makes it change sign, so both must be caught before the metric is computed.
Use `sum(x == 0)`, `sum(x < 0)` and `as.numeric(all(x > 0))` inside a named `c()`.

```r title="Run this before the exercise"
audit <- c(120, 0, 85, -15, 200, 0)
```

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- c(
  n_zero     = sum(audit == 0),
  n_negative = sum(audit < 0),
  mape_safe  = as.numeric(all(audit > 0))
)
ex_3_7
#>     n_zero n_negative  mape_safe 
#>          2          1          0 
```

**Explanation:** Two zeros and one negative mean MAPE is not usable, and the flag comes back 0. R will happily return `Inf` for the zero rows and a misleading finite number for the negative one rather than erroring, so this check has to be explicit. When it fails, switch to MASE or to a scale-dependent metric reported alongside the series mean.

</details>

## Section 4. Train/test splits and the accuracy() function (8 problems)

Everything so far was computed by hand so the formulas are no longer a black box. The `accuracy()` function in the forecast package returns all of them at once, in two rows: one for training fit, one for held-out data. The gap between those rows is the single most useful number in this hub.

### Exercise 4.1: Split a monthly series into training and test windows

**Task:** An atmospheric scientist wants to hold out the last four years of the `co2` record. Split the series at the end of 1993 using `window()`, then save the lengths of the two pieces as a named vector `ex_4_1`.

**Expected result:**

```
#> train  test 
#>   420    48 
```

**Difficulty:** Beginner

[HINTS]
A time-series split must respect chronology: the test set is always the tail, never a random sample.
Use `window(co2, end = c(1993, 12))` and `window(co2, start = c(1994, 1))`, then `length()` each.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
co2_train <- window(co2, end = c(1993, 12))
co2_test  <- window(co2, start = c(1994, 1))

ex_4_1 <- c(train = length(co2_train), test = length(co2_test))
ex_4_1
#> train  test 
#>   420    48 
```

**Explanation:** `window()` subsets by calendar time rather than by position, so the `c(year, month)` pairs are readable and the resulting objects keep their frequency and start date. Random train/test splits, standard in cross-sectional machine learning, leak future information into training here and produce accuracy figures that collapse in production.

</details>

### Exercise 4.2: Read the full accuracy table for a seasonal naive forecast

**Task:** Call `accuracy()` on the seasonal naive forecast `fc_sn` with `ap_test` supplied as the held-out data, round the resulting matrix to three decimals and save it to `ex_4_2` so you can read the training and test rows side by side.

**Expected result:**

```
#>                  ME   RMSE    MAE    MPE   MAPE  MASE  ACF1 Theil's U
#> Training set 28.259 32.506 28.574 11.258 11.410 1.000 0.766        NA
#> Test set     71.250 76.995 71.250 15.523 15.523 2.494 0.728      1.52
```

**Difficulty:** Intermediate

[HINTS]
Passing the actual future values as the second argument is what unlocks the second row of the table.
Call `accuracy(fc_sn, ap_test)` and wrap it in `round(x, 3)`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- round(accuracy(fc_sn, ap_test), 3)
ex_4_2
#>                  ME   RMSE    MAE    MPE   MAPE  MASE  ACF1 Theil's U
#> Training set 28.259 32.506 28.574 11.258 11.410 1.000 0.766        NA
#> Test set     71.250 76.995 71.250 15.523 15.523 2.494 0.728      1.52
```

**Explanation:** The test MAPE of 15.523 and MASE of 2.494 match what you computed by hand in Exercises 3.1 and 3.5, confirming the formulas. Training MASE is exactly 1.000 because the seasonal naive method is its own scaling benchmark. Call `accuracy()` with only the forecast object and you get the training row alone, which is not evidence of anything.

</details>

### Exercise 4.3: Pull a single metric out of the accuracy matrix

**Task:** Reporting pipelines usually need one number, not a matrix. Extract just the test-set RMSE from the accuracy table of `fc_sn` against `ap_test` by indexing with row and column names, then save the rounded value to `ex_4_3`.

**Expected result:**

```
#> [1] 76.995
```

**Difficulty:** Beginner

[HINTS]
The object returned by the accuracy call is a matrix whose rows and columns both carry names you can index with.
Index it as `acc["Test set", "RMSE"]`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- round(accuracy(fc_sn, ap_test)["Test set", "RMSE"], 3)
ex_4_3
#> [1] 76.995
```

**Explanation:** Name-based indexing survives changes in column order, whereas `acc[2, 2]` breaks silently if a future package version inserts a metric. This one-liner is the building block for the comparison tables in Exercise 4.7 and Section 5, where the same extraction runs once per model.

</details>

### Exercise 4.4: Quantify the gap between training and test error

**Task:** Compare how the seasonal naive method scores on data it was built from against data it has never seen. Build a named vector holding the training RMSE, the test RMSE and their ratio, and save it to `ex_4_4`.

**Expected result:**

```
#> train_RMSE  test_RMSE      ratio 
#>     32.506     76.995      2.369 
```

**Difficulty:** Intermediate

[HINTS]
Store the accuracy matrix once in a variable, then pull both rows from it rather than recomputing.
Divide the test RMSE by the training RMSE to get the ratio, and combine all three with a named `c()`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
acc <- accuracy(fc_sn, ap_test)
ex_4_4 <- round(c(
  train_RMSE = acc["Training set", "RMSE"],
  test_RMSE  = acc["Test set", "RMSE"],
  ratio      = acc["Test set", "RMSE"] / acc["Training set", "RMSE"]
), 3)
ex_4_4
#> train_RMSE  test_RMSE      ratio 
#>     32.506     76.995      2.369 
```

**Explanation:** Test error is 2.4 times training error. For a method with zero fitted parameters that gap is not overfitting: it is the cost of forecasting up to 24 months ahead when the training row measures one-step-ahead fit. Comparing a multi-step test row against a one-step training row is the most common misreading of this table.

</details>

### Exercise 4.5: Score an ETS model on the same held-out window

**Task:** Using the ETS fit built in Exercise 3.6, produce the full accuracy table of `fc_ets` against `ap_test`, round it to three decimals and save it to `ex_4_5` so it can be compared row by row with the seasonal naive table.

**Expected result:**

```
#>                  ME   RMSE    MAE    MPE   MAPE  MASE  ACF1 Theil's U
#> Training set  1.208  8.898  6.654  0.394  2.777 0.233 0.119        NA
#> Test set     63.211 72.548 63.213 13.303 13.303 2.212 0.746     1.357
```

**Difficulty:** Intermediate

[HINTS]
The call is identical to the one you used for the benchmark: only the forecast object changes.
Pass `fc_ets` and `ap_test` to `accuracy()` and round to three decimals.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- round(accuracy(fc_ets, ap_test), 3)
ex_4_5
#>                  ME   RMSE    MAE    MPE   MAPE  MASE  ACF1 Theil's U
#> Training set  1.208  8.898  6.654  0.394  2.777 0.233 0.119        NA
#> Test set     63.211 72.548 63.213 13.303 13.303 2.212 0.746     1.357
```

**Explanation:** Training RMSE drops from 32.5 to 8.9 while test RMSE only improves from 77.0 to 72.5. A fitted model always looks dramatically better in-sample because it optimised that fit; the honest improvement is the 6 percent on the test row. Theil's U below 1 would mean beating the naive benchmark, and at 1.357 this forecast does not.

</details>

### Exercise 4.6: Score an automatically selected ARIMA model

**Task:** Fit an ARIMA model to `ap_train` with automatic order selection, forecast 24 months ahead, then save the rounded accuracy table against `ap_test` to `ex_4_6` and note which specification was chosen.

**Expected result:**

```
#>                  ME   RMSE    MAE    MPE   MAPE  MASE  ACF1 Theil's U
#> Training set -0.016  9.568  7.120 -0.033  2.902 0.249 0.008        NA
#> Test set     68.577 74.252 68.577 14.928 14.928 2.400 0.718     1.465
```

**Difficulty:** Advanced

[HINTS]
Order selection can be delegated: one function searches over p, d, q and their seasonal counterparts using an information criterion.
Use `auto.arima(ap_train)`, then `forecast(fit, h = 24)` before calling `accuracy()`.

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_ar <- auto.arima(ap_train)
fc_ar  <- forecast(fit_ar, h = 24)

ex_4_6 <- round(accuracy(fc_ar, ap_test), 3)
ex_4_6
#>                  ME   RMSE    MAE    MPE   MAPE  MASE  ACF1 Theil's U
#> Training set -0.016  9.568  7.120 -0.033  2.902 0.249 0.008        NA
#> Test set     68.577 74.252 68.577 14.928 14.928 2.400 0.718     1.465
```

**Explanation:** The search lands on ARIMA(1,1,0)(0,1,0)[12], which differences once at lag 1 and once at lag 12. Training ACF1 of 0.008 means the residuals are essentially uncorrelated, a good sign that Section 6 tests formally. Note the model selection used AICc on training data only, so the test row remains a fair evaluation.

</details>

### Exercise 4.7: Build a three-model comparison table from the test rows

**Task:** Stakeholders want one table, not three matrices. Write a helper that pulls the test-set RMSE, MAE and MAPE for a forecast object, apply it to the seasonal naive, ETS and ARIMA forecasts, and bind the rows into `ex_4_7`.

**Expected result:**

```
#>    model  RMSE   MAE  MAPE
#> 1 snaive 76.99 71.25 15.52
#> 2    ets 72.55 63.21 13.30
#> 3  arima 74.25 68.58 14.93
```

**Difficulty:** Advanced

[HINTS]
Write the extraction once as a function taking the forecast object and a label, then call it three times.
Grab the whole test row with `accuracy(fc, ap_test)["Test set", ]` and stack results with `bind_rows()`.

```r title="Your turn"
test_row <- function(fc, label) {
  # your code here
}

ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_row <- function(fc, label) {
  a <- accuracy(fc, ap_test)["Test set", ]
  data.frame(model = label,
             RMSE = round(a[["RMSE"]], 2),
             MAE  = round(a[["MAE"]],  2),
             MAPE = round(a[["MAPE"]], 2))
}

ex_4_7 <- bind_rows(test_row(fc_sn,  "snaive"),
                    test_row(fc_ets, "ets"),
                    test_row(fc_ar,  "arima"))
ex_4_7
#>    model  RMSE   MAE  MAPE
#> 1 snaive 76.99 71.25 15.52
#> 2    ets 72.55 63.21 13.30
#> 3  arima 74.25 68.58 14.93
```

**Explanation:** Extracting the test row returns a named numeric vector, so `a[["RMSE"]]` gives a bare number rather than a one-element vector with a stray name. All three metrics agree on the ranking here, which is reassuring; when they disagree, the metric that matches the cost of being wrong in your business is the one that decides.

</details>

### Exercise 4.8: Verify that the split leaks no future data into training

**Task:** Before trusting any test score, prove the two windows do not overlap. Build a named vector holding the last training time, the first test time and a 1 or 0 flag for whether training ends strictly before testing begins, saved to `ex_4_8`.

**Expected result:**

```
#>  train_end test_start no_overlap 
#>   1958.917   1959.000      1.000 
```

**Difficulty:** Intermediate

[HINTS]
Every `ts` object carries its own timestamps, so the check is a comparison of two dates rather than of two row counts.
Use `max(time(ap_train))` and `min(time(ap_test))`, and coerce the comparison with `as.numeric()`.

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- round(c(
  train_end  = as.numeric(max(time(ap_train))),
  test_start = as.numeric(min(time(ap_test))),
  no_overlap = as.numeric(max(time(ap_train)) < min(time(ap_test)))
), 3)
ex_4_8
#>  train_end test_start no_overlap 
#>   1958.917   1959.000      1.000 
```

**Explanation:** December 1958 prints as 1958.917 because `time()` expresses months as fractions of a year, eleven twelfths being 0.917. The flag of 1 confirms a clean boundary. An off-by-one `window()` call that repeats December in both sets inflates test scores in a way no metric will ever reveal on its own, so this assertion belongs in any automated pipeline.

</details>

## Section 5. Benchmarks, baselines, and model choice (7 problems)

An accuracy number means nothing until it beats something. This section builds a benchmark suite, ranks models against it, and shows why an information criterion computed on training data is not a substitute for a test score.

```r title="Run this before Section 5"
fc_sn   <- snaive(ap_train, h = 24)
fit_ets <- ets(ap_train)
fc_ets  <- forecast(fit_ets, h = 24)
fit_ar  <- auto.arima(ap_train)
fc_ar   <- forecast(fit_ar, h = 24)
scale_ap <- mean(abs(diff(ap_train, lag = 12)))
```

### Exercise 5.1: Build a four-method benchmark table

**Task:** Forecast `ap_test` with the naive, seasonal naive, mean and drift methods, then build a data frame holding the test RMSE and MAE of each so you know the bar any real model must clear, saved as `ex_5_1`.

**Expected result:**

```
#>   method   RMSE    MAE
#> 1  naive 137.33 115.25
#> 2 snaive  76.99  71.25
#> 3   mean 219.44 206.34
#> 4  drift 115.70  91.62
```

**Difficulty:** Advanced

[HINTS]
Put the four forecast objects in a list so you can score them all with one pass instead of four copy-pasted blocks.
Build with `list(naive = naive(...), snaive = ..., mean = meanf(...), drift = rwf(..., drift = TRUE))` and apply the metrics using `sapply()`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bench <- list(
  naive  = naive(ap_train, h = 24),
  snaive = fc_sn,
  mean   = meanf(ap_train, h = 24),
  drift  = rwf(ap_train, h = 24, drift = TRUE)
)

ex_5_1 <- data.frame(
  method = names(bench),
  RMSE   = round(as.numeric(sapply(bench, function(f) rmse(ap_test, f$mean))), 2),
  MAE    = round(as.numeric(sapply(bench, function(f) mean(abs(ap_test - f$mean)))), 2)
)
ex_5_1
#>   method   RMSE    MAE
#> 1  naive 137.33 115.25
#> 2 snaive  76.99  71.25
#> 3   mean 219.44 206.34
#> 4  drift 115.70  91.62
```

**Explanation:** The spread is enormous: the mean method is nearly three times worse than seasonal naive, because averaging a strongly trending series produces a forecast below every future value. Wrapping `sapply()` in `as.numeric()` drops the inherited names so the data frame gets clean row numbers instead of duplicated labels.

</details>

### Exercise 5.2: Select the winning benchmark programmatically

**Task:** Rather than eyeballing the table, pick the method with the lowest RMSE from `ex_5_1` by locating the minimum position and using it to index the method column, saving the winning name to `ex_5_2`.

**Expected result:**

```
#> [1] "snaive"
```

**Difficulty:** Intermediate

[HINTS]
You need the position of the smallest value, not the smallest value itself.
Use `which.min()` on the RMSE column and index the method column with the result.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ex_5_1$method[which.min(ex_5_1$RMSE)]
ex_5_2
#> [1] "snaive"
```

**Explanation:** `which.min()` returns the index of the first minimum, so ties resolve to the earliest row rather than erroring. Automating the choice matters when the same script runs across hundreds of series in a nightly job, where no human is available to read a table. Swap the column name to rank on MAE or MASE instead.

</details>

### Exercise 5.3: Compare ETS against ARIMA on held-out RMSE

**Task:** Build a two-row data frame comparing the test RMSE of the ETS and ARIMA forecasts against `ap_test`, save it to `ex_5_3`, and treat the smaller number as the better model for this series and horizon.

**Expected result:**

```
#>   model  RMSE
#> 1   ets 72.55
#> 2 arima 74.25
```

**Difficulty:** Advanced

[HINTS]
Both fitted objects and their forecasts already exist from the section setup, so only the scoring remains.
Score each with the `rmse()` helper against `ap_test` and assemble with `data.frame()`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- data.frame(
  model = c("ets", "arima"),
  RMSE  = round(c(rmse(ap_test, fc_ets$mean), rmse(ap_test, fc_ar$mean)), 2)
)
ex_5_3
#>   model  RMSE
#> 1   ets 72.55
#> 2 arima 74.25
```

**Explanation:** ETS edges ARIMA by about 2 percent, which is well inside the noise you would expect from a single 24-month test window. A margin this thin is not a reason to declare a permanent winner; the rolling-origin evaluation in Section 7 averages over many origins and gives a far more stable verdict.

</details>

### Exercise 5.4: Show that a lower AICc does not guarantee a lower test error

**Task:** Fit two explicitly specified ETS models to `ap_train`, one fully additive and one with multiplicative seasonality, then tabulate each model's AICc alongside its test RMSE and save the comparison to `ex_5_4`.

**Expected result:**

```
#>   model   AICc test_RMSE
#> 1   AAA 1247.9     91.22
#> 2   MAM 1117.2     72.55
```

**Difficulty:** Advanced

[HINTS]
An information criterion scores in-sample likelihood with a penalty for parameters, so it never sees the test window at all.
Fit with `ets(ap_train, model = "AAA")` and `ets(ap_train, model = "MAM")`, read `fit$aicc`, and score forecasts separately.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_aaa <- ets(ap_train, model = "AAA")
fit_mam <- ets(ap_train, model = "MAM")

ex_5_4 <- data.frame(
  model     = c("AAA", "MAM"),
  AICc      = round(c(fit_aaa$aicc, fit_mam$aicc), 1),
  test_RMSE = round(c(rmse(ap_test, forecast(fit_aaa, h = 24)$mean),
                      rmse(ap_test, forecast(fit_mam, h = 24)$mean)), 2)
)
ex_5_4
#>   model   AICc test_RMSE
#> 1   AAA 1247.9     91.22
#> 2   MAM 1117.2     72.55
```

**Explanation:** Here AICc and test RMSE happen to agree, both favouring multiplicative seasonality, which is the right answer for a series whose seasonal swings grow with its level. They agree because the model families are comparable and the sample is honest; AICc is only valid within one model class fitted to identical data, so it can never be used to compare an ETS against an ARIMA on differenced data.

</details>

### Exercise 5.5: Test whether averaging two forecasts beats both

**Task:** Combine the ETS and ARIMA point forecasts by simple averaging, then compute the test RMSE of the ETS forecast, the ARIMA forecast and the combination, saving all three in one named vector `ex_5_5`.

**Expected result:**

```
#>   ets arima combo 
#> 72.55 74.25 72.70 
```

**Difficulty:** Advanced

[HINTS]
A combination forecast is often more accurate than its members because their errors are partly independent and cancel.
Average the two `$mean` components with `(a + b) / 2`, then score all three with `rmse()`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
combo <- (fc_ets$mean + fc_ar$mean) / 2

ex_5_5 <- round(c(
  ets   = rmse(ap_test, fc_ets$mean),
  arima = rmse(ap_test, fc_ar$mean),
  combo = rmse(ap_test, combo)
), 2)
ex_5_5
#>   ets arima combo 
#> 72.55 74.25 72.70 
```

**Explanation:** The average lands between the two members rather than beating both, which happens when the models make highly correlated errors: both under-forecast the same climbing trend, so averaging cannot cancel anything. Combinations pay off when the members fail in different directions, and checking that empirically takes exactly the three lines above.

</details>

### Exercise 5.6: Express model gain as a skill score against the benchmark

**Task:** Convert the ARIMA test RMSE into a percentage improvement over the seasonal naive benchmark, where a positive value means the model beat the benchmark, and save the rounded skill score to `ex_5_6`.

**Expected result:**

```
#> [1] 3.6
```

**Difficulty:** Intermediate

[HINTS]
A skill score turns two error numbers into one relative statement, so the benchmark belongs in the denominator.
Compute `100 * (1 - model_rmse / benchmark_rmse)`.

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- round(100 * (1 - rmse(ap_test, fc_ar$mean) / rmse(ap_test, fc_sn$mean)), 1)
ex_5_6
#> [1] 3.6
```

**Explanation:** A 3.6 percent gain is honest but small, and it is the number worth quoting to a stakeholder because it answers "compared to what". Skill scores are bounded above by 100 and unbounded below, so a model twice as bad as the benchmark scores minus 100. Always state which benchmark was used, since the score is meaningless without it.

</details>

### Exercise 5.7: Rank every benchmark method into a report-ready table

**Task:** Sort the benchmark table `ex_5_1` from best to worst RMSE and attach a rank column so the output can be pasted straight into a report, saving the ranked frame to `ex_5_7`.

**Expected result:**

```
#>   method   RMSE    MAE rank
#> 1 snaive  76.99  71.25    1
#> 2  drift 115.70  91.62    2
#> 3  naive 137.33 115.25    3
#> 4   mean 219.44 206.34    4
```

**Difficulty:** Intermediate

[HINTS]
Sort first, then number the rows in their new order, so the rank reflects the sorted position.
Chain `arrange(RMSE)` into `mutate(rank = row_number())`.

```r title="Your turn"
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- ex_5_1 |>
  arrange(RMSE) |>
  mutate(rank = row_number())
ex_5_7
#>   method   RMSE    MAE rank
#> 1 snaive  76.99  71.25    1
#> 2  drift 115.70  91.62    2
#> 3  naive 137.33 115.25    3
#> 4   mean 219.44 206.34    4
```

**Explanation:** Order matters in the pipe: calling `mutate()` before `arrange()` would number the rows in their original order and produce a scrambled rank column. `row_number()` needs no arguments inside `mutate()` because it reads the current row position. Note that the MAE column happens to agree with the RMSE ranking here, which is not guaranteed.

</details>

## Section 6. Residual diagnostics and forecast bias (7 problems)

Test-set metrics tell you how large the misses are. Residual diagnostics tell you whether the misses still contain exploitable structure, which is the difference between a model that is merely imperfect and one that is leaving information on the table.

### Exercise 6.1: Check the ARIMA residuals for mean bias

**Task:** Extract the residuals from the fitted ARIMA model `fit_ar` and compute their mean and standard deviation, saving both to `ex_6_1`, since a well-behaved residual series should be centred on zero.

**Expected result:**

```
#> mean_residual   sd_residual 
#>       -0.0161        9.6081 
```

**Difficulty:** Beginner

[HINTS]
Residuals are the one-step-ahead training errors, and their average is the in-sample bias.
Use `residuals(fit_ar)` and summarise with `mean()` and `sd()`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- residuals(fit_ar)
ex_6_1 <- round(c(mean_residual = mean(res), sd_residual = sd(res)), 4)
ex_6_1
#> mean_residual   sd_residual 
#>       -0.0161        9.6081 
```

**Explanation:** A mean of -0.016 against a standard deviation of 9.6 is effectively zero, so the fit carries no in-sample bias. A clearly nonzero mean would mean the forecasts can be improved for free by adding a constant. Note these are in-sample one-step residuals, not the multi-step test errors examined in Exercise 6.5, and the two often tell different stories.

</details>

### Exercise 6.2: Test residual autocorrelation with a Ljung-Box test

**Task:** Run a Ljung-Box test on the ARIMA residuals over 24 lags, adjusting the degrees of freedom for the single estimated coefficient, and save the test object to `ex_6_2` so the p-value can be read directly.

**Expected result:**

```
#> 	Box-Ljung test
#> 
#> data:  res
#> X-squared = 32.841, df = 23, p-value = 0.08388
```

**Difficulty:** Intermediate

[HINTS]
The null hypothesis is that the residuals are independent, so a large p-value is the outcome you want here.
Call `Box.test(res, lag = 24, type = "Ljung-Box", fitdf = 1)`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- Box.test(res, lag = 24, type = "Ljung-Box", fitdf = 1)
ex_6_2
#> 	Box-Ljung test
#> 
#> data:  res
#> X-squared = 32.841, df = 23, p-value = 0.08388
```

**Explanation:** With p above 0.05 you do not reject independence, so the residuals pass as white noise at the usual threshold, though 0.084 is close enough to be worth watching. The `fitdf` argument subtracts the number of estimated coefficients from the degrees of freedom: skip it and the test becomes too permissive because it credits the model with fitting for free.

</details>

### Exercise 6.3: Read the first six residual autocorrelations

**Task:** Compute the autocorrelation of the ARIMA residuals at lags 1 through 6, dropping the trivial lag-zero value of 1, and save the rounded vector to `ex_6_3` so individual problem lags become visible.

**Expected result:**

```
#> [1]  0.008  0.007 -0.174 -0.105  0.039  0.006
```

**Difficulty:** Intermediate

[HINTS]
The correlation of a series with itself at lag zero is always 1 and carries no information, so it should be removed.
Use `Acf(res, lag.max = 6, plot = FALSE)$acf`, coerce with `as.numeric()` and drop the first element with `[-1]`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- round(as.numeric(Acf(res, lag.max = 6, plot = FALSE)$acf)[-1], 3)
ex_6_3
#> [1]  0.008  0.007 -0.174 -0.105  0.039  0.006
```

**Explanation:** Lag 3 at -0.174 is the largest, close to the approximate significance bound of 2 divided by the square root of 120, which is about 0.18. The Ljung-Box test in the previous exercise pools all lags into one verdict, while this vector shows exactly where the structure sits, which is what you need to decide whether adding an MA term is worth trying.

</details>

### Exercise 6.4: Summarise the spread of the residual distribution

**Task:** Prediction intervals assume a residual spread, so quantify it directly: compute the standard deviation of the ARIMA residuals plus their 2.5th and 97.5th percentiles, and save all three to `ex_6_4`.

**Expected result:**

```
#> sd_resid     q025     q975 
#>    9.608  -15.139   19.160 
```

**Difficulty:** Intermediate

[HINTS]
An empirical interval built from percentiles makes no normality assumption, unlike one built from the standard deviation alone.
Use `quantile(res, 0.025, names = FALSE)` and its 0.975 counterpart alongside `sd()`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- round(c(
  sd_resid = sd(res),
  q025     = quantile(res, 0.025, names = FALSE),
  q975     = quantile(res, 0.975, names = FALSE)
), 3)
ex_6_4
#> sd_resid     q025     q975 
#>    9.608  -15.139   19.160 
```

**Explanation:** A symmetric normal interval would put the two percentiles near plus and minus 18.8, so the empirical interval is noticeably lopsided: shorter on the downside, longer on the upside. That right skew is typical of a series with multiplicative growth and it warns that normal-theory prediction intervals will misstate risk, which Exercise 7.4 confirms with coverage.

</details>

### Exercise 6.5: Detect systematic bias in the test-set errors

**Task:** Compute the mean test error of the ARIMA forecast against `ap_test` together with the share of test periods where the actual exceeded the forecast, saving both to `ex_6_5` as a bias diagnostic on held-out data.

**Expected result:**

```
#>     mean_error share_positive 
#>         68.577          1.000 
```

**Difficulty:** Intermediate

[HINTS]
If a forecast is unbiased, roughly half its errors should fall on each side of zero.
Compute `mean(e)` and `mean(e > 0)` where `e` is the vector of test errors.

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
err_test <- as.numeric(ap_test - fc_ar$mean)
ex_6_5 <- round(c(
  mean_error     = mean(err_test),
  share_positive = mean(err_test > 0)
), 3)
ex_6_5
#>     mean_error share_positive 
#>         68.577          1.000 
```

**Explanation:** Every single one of the 24 test errors is positive, so the model under-forecasts the entire held-out period. Contrast this with the near-zero in-sample residual mean from Exercise 6.1: the model fits history without bias yet extrapolates a trend that is too shallow. Only out-of-sample errors expose that failure mode.

</details>

### Exercise 6.6: Compare bias between the ARIMA and benchmark forecasts

**Task:** Build a two-row data frame holding the mean test error and the share of positive errors for both the ARIMA and the seasonal naive forecast, saving it to `ex_6_6` to see whether the bias is model-specific or shared.

**Expected result:**

```
#>    model mean_error share_positive
#> 1  arima      68.58              1
#> 2 snaive      71.25              1
```

**Difficulty:** Intermediate

[HINTS]
If two structurally different models fail in the same direction, the cause is probably in the data rather than in either model.
Compute the error vectors separately, then assemble with `data.frame()` and round.

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
err_sn <- as.numeric(ap_test - fc_sn$mean)

ex_6_6 <- data.frame(
  model          = c("arima", "snaive"),
  mean_error     = round(c(mean(err_test), mean(err_sn)), 2),
  share_positive = round(c(mean(err_test > 0), mean(err_sn > 0)), 3)
)
ex_6_6
#>    model mean_error share_positive
#> 1  arima      68.58              1
#> 2 snaive      71.25              1
```

**Explanation:** Both models under-forecast every single test month, so the problem is the data rather than the model class: air travel accelerated in 1959 and 1960 beyond anything in the training window. When every candidate is biased in the same direction, look for a regime change or a missing driver rather than tuning parameters.

</details>

### Exercise 6.7: Compare in-sample residual spread against test RMSE

**Task:** Divide the test RMSE of the ARIMA forecast by the standard deviation of its in-sample residuals to see how far reality drifts from what the fit implied, saving the two inputs and the ratio to `ex_6_7`.

**Expected result:**

```
#>  resid_sd test_rmse     ratio 
#>     9.608    74.252     7.728 
```

**Difficulty:** Advanced

[HINTS]
One number describes one-step-ahead errors inside the sample, the other describes errors up to 24 steps ahead outside it.
Divide the test RMSE by `sd(res)` and combine all three values with a named `c()`.

```r title="Your turn"
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- round(c(
  resid_sd  = sd(res),
  test_rmse = rmse(ap_test, fc_ar$mean),
  ratio     = rmse(ap_test, fc_ar$mean) / sd(res)
), 3)
ex_6_7
#>  resid_sd test_rmse     ratio 
#>     9.608    74.252     7.728 
```

**Explanation:** Test error is nearly eight times the residual spread. Some of that gap is legitimate, because uncertainty compounds with horizon, but a factor of eight also reflects the systematic bias found in Exercise 6.5. Quoting residual standard deviation as though it were forecast accuracy is the most common way a forecast gets oversold internally.

</details>

## Section 7. Rolling-origin evaluation and interval quality (7 problems)

A single train/test split gives you one number from one arbitrary cut point. Rolling-origin cross-validation re-forecasts from many origins and averages, which is far more stable. This section closes with prediction intervals, where being right on average is not enough.

### Exercise 7.1: Run one-step rolling-origin cross-validation on the Nile series

**Task:** Use time-series cross-validation to generate one-step-ahead naive forecast errors across the whole `Nile` record, then compute the RMSE of those errors ignoring the leading missing values and save it to `ex_7_1`.

**Expected result:**

```
#> [1] 168.128
```

**Difficulty:** Advanced

[HINTS]
The idea is to refit at every possible origin and keep only the error made one step past that origin.
Call `tsCV(Nile, rwf, h = 1)` and summarise the returned errors with `sqrt(mean(e^2, na.rm = TRUE))`.

```r title="Your turn"
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
e_cv <- tsCV(Nile, rwf, h = 1)
ex_7_1 <- round(sqrt(mean(e_cv^2, na.rm = TRUE)), 3)
ex_7_1
#> [1] 168.128
```

**Explanation:** `tsCV()` returns a series of errors aligned to the time the forecast was made, with `NA` at the start where too little history exists, so `na.rm = TRUE` is mandatory. Averaging over roughly a hundred origins instead of one makes this estimate far less sensitive to where you happened to cut the series.

</details>

### Exercise 7.2: Measure how cross-validated error grows with horizon

**Task:** Run cross-validation on `AirPassengers` with the seasonal naive method for horizons 1 through 12, then compute the RMSE at each horizon from the returned error matrix and save the twelve values to `ex_7_2`.

**Expected result:**

```
#>   h=1   h=2   h=3   h=4   h=5   h=6   h=7   h=8   h=9  h=10  h=11  h=12 
#> 36.45 36.59 36.72 36.86 37.00 37.13 37.22 37.32 37.42 37.55 37.70 37.80 
```

**Difficulty:** Advanced

[HINTS]
With a horizon above 1 the result is a matrix, one column per horizon, so summarise down the columns rather than over everything.
Pass a wrapper `function(x, h) snaive(x, h = h)` to `tsCV()` and use `sqrt(colMeans(e^2, na.rm = TRUE))`.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sn_fun <- function(x, h) snaive(x, h = h)
e_cv2  <- tsCV(AirPassengers, sn_fun, h = 12)

ex_7_2 <- round(sqrt(colMeans(e_cv2^2, na.rm = TRUE)), 2)
ex_7_2
#>   h=1   h=2   h=3   h=4   h=5   h=6   h=7   h=8   h=9  h=10  h=11  h=12 
#> 36.45 36.59 36.72 36.86 37.00 37.13 37.22 37.32 37.42 37.55 37.70 37.80 
```

**Explanation:** Error climbs gently from 36.45 at one month to 37.80 at twelve, a much flatter profile than the single-split result in Exercise 2.6 because averaging over many origins washes out the peculiarities of 1959 and 1960. `tsCV()` needs a function of exactly `(x, h)`, which is why the wrapper exists rather than passing `snaive` bare.

</details>

### Exercise 7.3: Build an expanding-window evaluation loop by hand

**Task:** Reproduce what `tsCV()` automates: loop over origins from observation 60 to the second-to-last of the `Nile` series, forecast one step with the drift-free random walk, collect the errors and save the count and RMSE to `ex_7_3`.

**Expected result:**

```
#>       n    RMSE 
#>  40.000 136.378 
```

**Difficulty:** Advanced

[HINTS]
At each origin the training window grows by one observation and the forecast is scored against the very next value.
Inside the loop build `ts(Nile[1:i], start = 1871)`, forecast with `rwf(tr, h = 1)$mean[1]` and accumulate the errors.

```r title="Your turn"
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
errs <- numeric(0)
for (i in 60:(length(Nile) - 1)) {
  tr   <- ts(Nile[1:i], start = 1871)
  errs <- c(errs, Nile[i + 1] - rwf(tr, h = 1)$mean[1])
}

ex_7_3 <- round(c(n = length(errs), RMSE = sqrt(mean(errs^2))), 3)
ex_7_3
#>       n    RMSE 
#>  40.000 136.378 
```

**Explanation:** Forty origins produce an RMSE of 136.4, lower than the 168.1 from Exercise 7.1 because starting at observation 60 skips the volatile pre-1900 era entirely. Which origins you include changes the answer, so state the evaluation window whenever you quote a cross-validated number. Growing a vector with `c()` is fine at this size but preallocate for long series.

</details>

### Exercise 7.4: Measure the empirical coverage of a 95 percent interval

**Task:** Forecast 24 months from the ARIMA fit with a 95 percent prediction interval, then compute the share of test observations that actually fall inside the interval and save that coverage to `ex_7_4`.

**Expected result:**

```
#> [1] 0.542
```

**Difficulty:** Advanced

[HINTS]
Coverage is a proportion of hits, so the comparison produces a logical vector whose mean is the answer.
Use `forecast(fit_ar, h = 24, level = 95)` and test `actual >= fc$lower[, 1] & actual <= fc$upper[, 1]`.

```r title="Your turn"
ex_7_4 <- # your code here
ex_7_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fc95 <- forecast(fit_ar, h = 24, level = 95)
ex_7_4 <- round(mean(ap_test >= fc95$lower[, 1] & ap_test <= fc95$upper[, 1]), 3)
ex_7_4
#> [1] 0.542
```

**Explanation:** An interval advertised at 95 percent captures only 54 percent of the actuals, so it is badly overconfident. `$lower` and `$upper` are matrices with one column per requested level, hence the `[, 1]`. Under-coverage this severe usually traces back to the same shallow trend that produced the one-sided bias in Exercise 6.5.

</details>

### Exercise 7.5: Quantify interval sharpness as average width

**Task:** Coverage alone can be gamed by making intervals enormously wide, so measure sharpness too: compute the mean width of the 95 percent interval across the 24 test months and save the rounded value to `ex_7_5`.

**Expected result:**

```
#> [1] 140.11
```

**Difficulty:** Beginner

[HINTS]
Width is simply the distance between the two interval bounds at each horizon.
Subtract the lower column from the upper column and take `mean()`.

```r title="Your turn"
ex_7_5 <- # your code here
ex_7_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_5 <- round(mean(fc95$upper[, 1] - fc95$lower[, 1]), 2)
ex_7_5
#> [1] 140.11
```

**Explanation:** An average width of 140 passengers is wide relative to a series averaging around 450, and it still fails to cover. Coverage and sharpness must always be read together: a useless interval spanning zero to infinity has perfect coverage, and a razor-thin one has none. Good intervals hit their nominal rate with the smallest width that achieves it.

</details>

### Exercise 7.6: Compare coverage and width at two confidence levels

**Task:** Produce a forecast carrying both 80 and 95 percent intervals, then build a data frame reporting the empirical coverage and mean width at each level, saving the result to `ex_7_6` as an interval-quality summary.

**Expected result:**

```
#>   level coverage mean_width
#> 1    80    0.042       91.6
#> 2    95    0.542      140.1
```

**Difficulty:** Intermediate

[HINTS]
Requesting two levels returns two columns in each bound matrix, indexed in the order you asked for them.
Call `forecast(fit_ar, h = 24, level = c(80, 95))` and compute coverage separately for column 1 and column 2.

```r title="Your turn"
ex_7_6 <- # your code here
ex_7_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fc2 <- forecast(fit_ar, h = 24, level = c(80, 95))

ex_7_6 <- data.frame(
  level    = c(80, 95),
  coverage = round(c(mean(ap_test >= fc2$lower[, 1] & ap_test <= fc2$upper[, 1]),
                     mean(ap_test >= fc2$lower[, 2] & ap_test <= fc2$upper[, 2])), 3),
  mean_width = round(c(mean(fc2$upper[, 1] - fc2$lower[, 1]),
                       mean(fc2$upper[, 2] - fc2$lower[, 2])), 1)
)
ex_7_6
#>   level coverage mean_width
#> 1    80    0.042       91.6
#> 2    95    0.542      140.1
```

**Explanation:** The 80 percent interval catches 4 percent of observations and the 95 percent interval catches 54 percent, so both are far too narrow and the failure worsens as the level tightens. Because every test error is positive, the actuals sit above the upper bound almost everywhere, which is a bias problem showing up as a coverage problem.

</details>

### Exercise 7.7: Assemble the final model-evaluation report

**Task:** Write a helper that computes RMSE, MAE, MAPE and MASE for a forecast object against `ap_test`, apply it to the seasonal naive, ETS and ARIMA forecasts, sort by RMSE and save the report table to `ex_7_7`.

**Expected result:**

```
#>    model  RMSE   MAE  MAPE  MASE
#> 1    ets 72.55 63.21 13.30 2.212
#> 2  arima 74.25 68.58 14.93 2.400
#> 3 snaive 76.99 71.25 15.52 2.494
```

**Difficulty:** Advanced

[HINTS]
Compute the error vector once inside the helper and derive all four metrics from it plus the shared scaling term.
Return a one-row `data.frame()` per model, stack with `bind_rows()` and finish with `arrange(RMSE)`.

```r title="Your turn"
report_row <- function(fc, label) {
  # your code here
}

ex_7_7 <- # your code here
ex_7_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
report_row <- function(fc, label) {
  e <- as.numeric(ap_test - fc$mean)
  data.frame(
    model = label,
    RMSE  = round(sqrt(mean(e^2)), 2),
    MAE   = round(mean(abs(e)), 2),
    MAPE  = round(mean(100 * abs(e / ap_test)), 2),
    MASE  = round(mean(abs(e)) / scale_ap, 3)
  )
}

ex_7_7 <- bind_rows(report_row(fc_sn,  "snaive"),
                    report_row(fc_ets, "ets"),
                    report_row(fc_ar,  "arima")) |>
  arrange(RMSE)
ex_7_7
#>    model  RMSE   MAE  MAPE  MASE
#> 1    ets 72.55 63.21 13.30 2.212
#> 2  arima 74.25 68.58 14.93 2.400
#> 3 snaive 76.99 71.25 15.52 2.494
```

**Explanation:** All four metrics rank the models identically, which is the comfortable case; when they disagree, decide in advance which one matches the cost of being wrong rather than picking the flattering one afterwards. Reusing `scale_ap` across every row is what makes the MASE column comparable. Note that even the winner is biased and under-covered, so this table alone is not a green light to ship.

</details>

## What to do next

- [ARIMA Exercises in R](ARIMA-Exercises-in-R.html) puts the models you were scoring here under the microscope: stationarity, order selection and diagnostics.
- [Time Series Exercises in R](Time-Series-Exercises-in-R.html) covers the groundwork, `ts` objects, decomposition and seasonality, if the splits and windows felt shaky.
- [Forecast Accuracy in R](Forecast-Accuracy-in-R.html) is the companion tutorial explaining what each metric means before you practise it.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) drills the grouping and summarising verbs used to build every report table in Sections 4 to 7.
