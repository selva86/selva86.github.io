---
title: "Monitoring Forecast Models in Production With R"
slug: "Forecast-Monitoring-in-R"
description: "Monitor forecast models in production with R: track rolling accuracy and bias, check interval coverage, flag drift with a CUSUM alarm, and trigger retraining."
keywords: "forecast monitoring in R, monitoring forecast models, production forecasting, forecast accuracy monitoring, forecast drift detection, tracking signal, forecast bias, prediction interval coverage, retraining trigger, CUSUM control chart"
auto_link_terms: "forecast monitoring|monitoring forecast models|monitor forecasts in production|forecast model monitoring|tracking signal|forecast bias|forecast drift|concept drift|model drift|production monitoring|retraining trigger|rolling forecast accuracy|forecast degradation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-23"
curriculum_id: "TS2-13.2"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Forecast Monitoring"
sidebar_order: "65"
difficulty: "Intermediate"
---

<p class="lead">Monitoring a forecast model in production means checking, on a schedule, whether the forecasts it still produces stay accurate, unbiased, and well-calibrated as real values arrive, and raising an alert the moment they stop.</p>

Training a forecasting model is the easy part. The hard part starts the day it goes live and quietly begins to age. This tutorial builds a complete monitoring system in plain R, step by step, so you can catch a decaying model before it costs you a bad decision. We work entirely from a forecast log using base R plus a little dplyr, so everything runs in the code blocks below with nothing to install.

## Why do forecast models quietly rot after you deploy them?

A model that scored beautifully in testing can decay the moment it is live, and the scary part is that it keeps producing confident-looking numbers the whole time. The world shifts under it: a demand drop, a new competitor, a pricing change, a broken data feed. Seasonality moves. The forecasts drift further from reality every month, and because nothing crashes, nobody notices until a bad decision has already been made. Monitoring is the smoke detector that goes off first.

Let's make that concrete. In production you keep a **forecast log**: one row per period, storing the value the model predicted, its uncertainty interval, and later, the actual value that arrived. Here is such a log for a model that has been live for two years. We build it inline so the whole tutorial runs, but in practice these columns come straight from your pipeline's saved output.

```r title="Load the forecast log and check the latest month"
suppressPackageStartupMessages(library(dplyr))

# A forecast log your pipeline saved: 24 monthly rows.
# actual = the value that arrived; forecast = what the model predicted;
# lower/upper = the model's 80% prediction interval.
set.seed(176)
months      <- seq(as.Date("2024-01-01"), by = "month", length.out = 24)
signal      <- 1000 + 4 * (1:24) + 90 * sin(2 * pi * (1:24) / 12)
forecast_pt <- round(signal)
half80      <- round(qnorm(0.9) * 22)               # 80% interval half-width
shift       <- ifelse((1:24) >= 13, -70, 0)         # a demand drop the model never saw
actual      <- round(signal + rnorm(24, 0, 20) + shift)

log_tbl <- tibble(
  date     = months,
  actual   = actual,
  forecast = forecast_pt,
  lower    = forecast_pt - half80,
  upper    = forecast_pt + half80
)

tail(log_tbl, 4)
#> # A tibble: 4 × 5
#>   date       actual forecast lower upper
#>   <date>      <dbl>    <dbl> <dbl> <dbl>
#> 1 2025-09-01    922      994   966  1022
#> 2 2025-10-01    955     1010   982  1038
#> 3 2025-11-01    948     1047  1019  1075
#> 4 2025-12-01   1014     1096  1068  1124

# how far off was the latest forecast?
tail(log_tbl, 1)$actual - tail(log_tbl, 1)$forecast
#> [1] -82
```

Look at the last four rows. The model is calling for values near 1000 to 1096, but the actuals coming in are only 922 to 1014. The most recent forecast missed by 82 units, and every recent actual sits below its own lower bound. The model has clearly stopped tracking reality, yet on its own it would happily keep forecasting forever.

That gap is exactly what monitoring exists to catch. The rest of this tutorial turns this log into a set of automatic health checks. The whole process is a loop: score every forecast as actuals arrive, decide whether the model is still healthy, and either keep it or retrain.

![The monitoring loop: score every forecast as actuals arrive, then keep or retrain.](screenshots/Forecast-Monitoring-in-R-monitoring-loop.webp)
*Figure 1: The monitoring loop. Score every forecast as actuals arrive, then keep or retrain.*

One property of forecasting makes this loop special. You cannot score a forecast until the truth shows up, and for a 12-month-ahead forecast that can be a year away. So monitoring is retrospective: you match each forecast to the actual that eventually lands, then update your health metrics. That is why a saved log matters so much.

[KEY INSIGHT]
**A forecast log is the only artifact you need to monitor a model.** Every check in this tutorial works on the same four columns (actual, forecast, lower, upper), so the approach is model-agnostic: it does not care whether the numbers came from ARIMA, ETS, Prophet, or a gradient-booster.

**Try it:** Compute the error for the very first month in the log, defined as the actual value minus the forecast.

```r title="Your turn: first month error"
# Replace NA with: the first actual minus the first forecast
ex_first_error <- NA
ex_first_error
#> Expected: -30
```

<details>
<summary>Click to reveal solution</summary>

```r title="First month error solution"
ex_first_error <- log_tbl$actual[1] - log_tbl$forecast[1]
ex_first_error
#> [1] -30
```

**Explanation:** In month one the actual was 1019 and the forecast was 1049, so the error is 1019 minus 1049, which is -30. A negative error means the model predicted more than actually happened.

</details>

## How do you measure whether the latest forecasts are still accurate?

Accuracy monitoring starts with one number per period: the **forecast error**, the actual minus the forecast. From that single column, every accuracy metric follows. Let's add three helper columns to the log so we can work with them: the raw error, its absolute value (how far off, ignoring direction), and the percentage error (the miss relative to the actual).

```r title="Compute the error for every month"
log_tbl <- log_tbl |>
  mutate(
    error     = actual - forecast,
    abs_error = abs(error),
    pct_error = round(100 * error / actual, 1)
  )

log_tbl |>
  select(date, actual, forecast, error, abs_error) |>
  slice(c(1:3, 22:24))
#> # A tibble: 6 × 5
#>   date       actual forecast error abs_error
#>   <date>      <dbl>    <dbl> <dbl>     <dbl>
#> 1 2024-01-01   1019     1049   -30        30
#> 2 2024-02-01   1086     1086     0         0
#> 3 2024-03-01   1113     1102    11        11
#> 4 2025-10-01    955     1010   -55        55
#> 5 2025-11-01    948     1047   -99        99
#> 6 2025-12-01   1014     1096   -82        82
```

The `slice(c(1:3, 22:24))` call shows the first three and last three months side by side. Early on, the absolute errors are tiny (30, 0, 11). By the end they are huge (55, 99, 82). The `pct_error` column is added here too; we will use it in the exercises. The story of degradation is already visible, but eyeballing a table does not scale, so let's summarize it into standard metrics.

Three metrics do most of the work. **MAE** (mean absolute error) is the average of the absolute errors, in the same units as your data. **RMSE** (root mean squared error) is similar but squares the errors first, so it punishes big misses harder. **MAPE** (mean absolute percentage error) expresses the miss as a percentage, which makes it easy to compare across series of different sizes.

If you build models with the `fable` package, you do not have to compute these by hand for a one-time check. Its `accuracy()` function returns them in a single call. Here it is on a short demonstration series, fitting an exponential smoothing model on a training window and scoring it on a 12-month holdout.

```r title="Get a one-time accuracy report with fable"
suppressPackageStartupMessages(library(fable))
suppressPackageStartupMessages(library(tsibble))

set.seed(11)
demo <- tibble(
  ym = yearmonth(seq(as.Date("2022-01-01"), by = "month", length.out = 36)),
  y  = as.numeric(1000 + 4 * (1:36) + 90 * sin(2 * pi * (1:36) / 12) + rnorm(36, 0, 20))
) |> as_tsibble(index = ym)

train <- demo |> filter(ym < yearmonth("2024 Jan"))
fit   <- train |> model(ets = ETS(y))
fc    <- fit |> forecast(h = 12)

accuracy(fc, demo) |> select(.model, MAE, RMSE, MASE)
#> # A tibble: 1 × 4
#>   .model   MAE  RMSE  MASE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 ets     55.0  59.9  1.18
```

One line gives you MAE, RMSE, and a fourth metric, **MASE** (mean absolute scaled error). MASE compares your model to a simple seasonal-naive baseline: below 1 means you beat the baseline, above 1 means you did worse. Here it is 1.18, a hair worse than naive on this sample. We come back to that benchmarking idea near the end.

[NOTE]
**The accuracy report is a single snapshot, taken once.** That is perfect for a pre-deployment backtest, but a model in production needs these numbers recomputed continuously as new actuals arrive. Monitoring is accuracy evaluation that never stops, and it works on your forecast log no matter which package produced the forecasts.

To watch accuracy over time rather than as one lump sum, use a **rolling window**: recompute MAE over only the most recent months, then slide the window forward. A trailing 6-month MAE reacts to recent behavior while smoothing out single-month noise. We write a tiny helper for it, because it is a pattern you will reuse for every rolling metric in this tutorial.

```r title="Track a rolling 6-month MAE"
roll_mean <- function(x, k) {
  sapply(seq_along(x), function(i) if (i < k) NA else mean(x[(i - k + 1):i]))
}

log_tbl <- log_tbl |>
  mutate(roll_mae = round(roll_mean(abs_error, 6), 1))

log_tbl |> select(date, abs_error, roll_mae) |> slice(seq(6, 24, 3))
#> # A tibble: 7 × 3
#>   date       abs_error roll_mae
#>   <date>         <dbl>    <dbl>
#> 1 2024-06-01        16     15.3
#> 2 2024-09-01        15     15.5
#> 3 2024-12-01        21     12.7
#> 4 2025-03-01        16     29.3
#> 5 2025-06-01        88     63.3
#> 6 2025-09-01        72     73  
#> 7 2025-12-01        82     72.7
```

The `roll_mean()` helper averages the trailing `k` values and returns `NA` until it has enough history. Reading down the `roll_mae` column tells the whole story at a glance: the rolling MAE sits near 13 to 15 through 2024, then climbs to 29, 63, and finally 73 across 2025. The model's typical miss roughly quintupled.

That is your first monitoring signal. A rolling MAE that is trending sharply upward, and now sits far above its calm baseline, is the clearest evidence that a model has stopped working.

[KEY INSIGHT]
**A rolling window turns one accuracy score into a trend you can watch.** A single MAE tells you how good a model was on average. A rolling MAE tells you the direction it is heading, which is what you actually need to decide whether to act.

**Try it:** Recompute the rolling MAE with a 3-month window instead of 6, then read the value at the final month.

```r title="Your turn: 3-month rolling MAE"
# Change the window argument to 3, then read the last value.
ex_roll3 <- round(roll_mean(log_tbl$abs_error, 6), 1)   # <- edit the 6
tail(ex_roll3, 1)
#> Expected: 78.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="3-month rolling MAE solution"
ex_roll3 <- round(roll_mean(log_tbl$abs_error, 3), 1)
tail(ex_roll3, 1)
#> [1] 78.7
```

**Explanation:** A shorter window averages only the last three absolute errors (55, 99, 82), giving 78.7. Shorter windows react faster to change but are noisier; longer windows are steadier but slower to sound the alarm.

</details>

## Is the model consistently over- or under-forecasting?

Accuracy alone can hide a serious problem. A model can have a middling average error yet lean the same way every single month, always a little high or always a little low. That systematic lean is called **bias**, and it is dangerous because it compounds. Think of a clock that is always five minutes fast: individually each reading looks fine, but you keep showing up early.

Bias is just the **mean error** (not the mean absolute error). If the average error is near zero, the misses cancel out and the model is unbiased. If it drifts away from zero, the model has a consistent direction. The classic production tool for watching this is the **tracking signal**: the running sum of errors divided by the running mean absolute deviation. It answers "how many typical errors of accumulated bias have we piled up?"

```r title="Measure forecast bias with a tracking signal"
log_tbl <- log_tbl |>
  mutate(
    rsfe            = cumsum(error),                          # running sum of errors
    run_mad         = cumsum(abs_error) / seq_along(abs_error), # running mean abs deviation
    tracking_signal = round(rsfe / run_mad, 2)
  )

log_tbl |> select(date, error, rsfe, tracking_signal) |> slice(seq(6, 24, 3))
#> # A tibble: 7 × 4
#>   date       error  rsfe tracking_signal
#>   <date>     <dbl> <dbl>           <dbl>
#> 1 2024-06-01    16    -8           -0.52
#> 2 2024-09-01    15    -6           -0.4 
#> 3 2024-12-01    21    12            0.86
#> 4 2025-03-01   -16  -130           -6.29
#> 5 2025-06-01   -88  -368          -12.1 
#> 6 2025-09-01   -72  -568          -16.0 
#> 7 2025-12-01   -82  -804          -19.6 

# first month the tracking signal breaches the +/-4 limit
log_tbl$date[which(abs(log_tbl$tracking_signal) > 4)[1]]
#> [1] "2025-02-01"
```

`cumsum(error)` accumulates every error into a running total (the `rsfe`), and dividing by the running mean absolute deviation rescales it into "typical errors" of bias. Through 2024 the tracking signal hovers between -0.5 and 0.9: the positive and negative errors cancel, so no bias. From early 2025 it plunges to -6, -12, -16, and -20. The `which()` line pinpoints the first breach: February 2025.

The convention is to alarm when the tracking signal moves outside roughly plus or minus 4. Our signal blows past -4 in February 2025 and keeps falling. The persistently negative value tells you the direction, too: the model is over-forecasting, predicting more than reality delivers, month after month.

If you want the formula behind the number, here it is. Skip to the next section if you just want the code, the running sum is all you really need.

$$\text{Tracking signal}_t = \frac{\sum_{i=1}^{t} e_i}{\frac{1}{t}\sum_{i=1}^{t} \lvert e_i \rvert}$$

Where:

- $e_i = \text{actual}_i - \text{forecast}_i$, the error at period $i$
- the numerator is the running sum of errors, which grows when errors share a sign
- the denominator is the mean absolute deviation, the average size of a miss

[WARNING]
**Bias can hide inside a healthy-looking average error.** A model that alternates plus 50 and minus 50 has the same MAE as one that misses by minus 50 every time, but only the second is biased and dangerous. Always monitor the mean error alongside the mean absolute error.

**Try it:** Compute the model's mean error over the last 6 months (rows 19 to 24). A large negative value confirms it is over-forecasting.

```r title="Your turn: recent bias"
# Average the error over the last 6 months. Fix the row range.
ex_recent_bias <- mean(log_tbl$error[1:24])   # <- narrow this to the last 6 months
round(ex_recent_bias, 1)
#> Expected: -72.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Recent bias solution"
ex_recent_bias <- mean(log_tbl$error[19:24])
round(ex_recent_bias, 1)
#> [1] -72.7
```

**Explanation:** Over the final half-year the model's errors average -72.7, meaning it over-forecasts by about 73 units every month. A bias that large will wreck any decision built on top of it, such as inventory or staffing plans.

</details>

## How do you turn error tracking into an automatic alarm?

Charts and tracking signals are great when you watch one series. But production teams forecast hundreds or thousands of series, and no human is going to eyeball them all every morning. You need a rule that fires by itself. This is where **statistical process control** comes in, the same math factories use to catch a machine drifting out of spec.

The workhorse is the **CUSUM** chart (cumulative sum). It accumulates how far each error strays from a target, and it trips an alarm when that running sum crosses a decision limit. Two settings control it: a slack value `k` that lets small, normal wobbles pass without accumulating, and a limit `h` that defines "too far." Because a stale model here over-forecasts (negative errors), we track the downward-accumulating side.

Before running it, we calibrate on the calm early period: what does a normal error spread look like? We estimate that from the first six months and use it to standardize every later error, so the CUSUM speaks in units of typical error size.

```r title="Build a CUSUM alarm on the errors"
sigma0 <- sd(log_tbl$error[1:6])   # normal error spread, from the calm start
round(sigma0, 2)
#> [1] 19.45

k <- 0.5   # slack: ignore drifts smaller than half a typical error
h <- 4     # decision limit: alarm when the cumulative sum passes 4
d <- log_tbl$error / sigma0        # standardized errors (target is 0)

Slo <- numeric(24)
for (t in 2:24) {
  Slo[t] <- max(0, Slo[t - 1] - d[t] - k)
}
log_tbl$cusum_lo <- round(Slo, 2)

# first month the alarm trips
log_tbl$date[which(Slo > h)[1]]
#> [1] "2025-02-01"
```

The loop is the heart of it. Each month it takes the previous cumulative sum, subtracts the standardized error and the slack, and floors the result at zero so quiet periods reset toward zero instead of drifting. While errors are small and balanced, `Slo` stays near zero. Once the model starts over-forecasting, the negative errors feed it and it climbs fast, crossing the limit of 4 in February 2025.

That is the same month the tracking signal flagged, which is reassuring: two independent methods agree the break happened at the start of 2025. The difference is that the CUSUM is a single boolean rule you can run unattended across every series in your portfolio.

Here is the recursion in symbols, for the lower (over-forecasting) side:

$$S^{-}_t = \max\!\left(0,\; S^{-}_{t-1} - \frac{e_t - \mu_0}{\sigma_0} - k\right), \quad \text{alarm when } S^{-}_t > h$$

Where:

- $\mu_0$ is the target error, which is 0 for an unbiased model
- $\sigma_0$ is the calibrated normal error spread (here 19.45)
- $k$ is the slack (0.5) and $h$ is the decision limit (4)

A picture makes the alarm obvious. Plotting the cumulative sum against its limit shows exactly when the process left control.

```r title="Plot the CUSUM against its alarm limit"
suppressPackageStartupMessages(library(ggplot2))

ggplot(log_tbl, aes(date, cusum_lo)) +
  geom_line(colour = "#2b6cb0", linewidth = 0.9) +
  geom_hline(yintercept = h, linetype = "dashed", colour = "#c53030") +
  labs(
    title    = "Lower CUSUM of forecast errors",
    subtitle = "It crosses the dashed limit once the model starts over-forecasting",
    x = NULL, y = "CUSUM"
  ) +
  theme_minimal(base_size = 13)
```

The blue line hugs zero for the first year, then lifts off in early 2025 and shoots past the red limit, staying above it for the rest of the window. That sustained breach, not a single spike, is the signature of a real regime change rather than a one-off bad month.

[TIP]
**Sensible CUSUM defaults are k = 0.5 and h between 4 and 5.** With k at half a standard deviation and h at 4, the chart catches a sustained shift of about one standard deviation quickly while rarely firing on noise. Loosen h toward 5 if you get too many false alarms, tighten it toward 4 if real drifts slip through.

**Try it:** The `cusum_lo` column is already computed. Using a stricter limit of 6 instead of 4, find the first month the alarm trips.

```r title="Your turn: stricter alarm limit"
# Use a stricter limit of 6 (edit the 4).
ex_alarm6 <- log_tbl$date[which(log_tbl$cusum_lo > 4)[1]]   # <- change 4 to 6
ex_alarm6
#> Expected: "2025-04-01"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stricter alarm limit solution"
ex_alarm6 <- log_tbl$date[which(log_tbl$cusum_lo > 6)[1]]
ex_alarm6
#> [1] "2025-04-01"
```

**Explanation:** A higher limit needs more accumulated evidence, so the alarm fires two months later, in April 2025 instead of February. That is the core trade-off in any alarm: a stricter limit means fewer false alarms but slower detection.

</details>

## Are the prediction intervals still trustworthy?

So far we have judged the point forecast, the single predicted number. But a good forecast also comes with an interval that says how uncertain it is, and that interval can rot independently. An 80% prediction interval makes a promise: about 80% of the time, the actual value should land inside it. Checking whether it keeps that promise is called measuring **coverage**.

Coverage is simple to compute: mark each month as a hit if the actual fell between the lower and upper bounds, then average those hits. Do it on a rolling window and you can watch calibration drift just like accuracy.

```r title="Check prediction interval coverage"
log_tbl <- log_tbl |>
  mutate(
    in_interval = actual >= lower & actual <= upper,
    roll_cov    = round(roll_mean(in_interval, 6), 2)
  )

# overall share of actuals that landed inside the 80% interval
round(mean(log_tbl$in_interval), 2)
#> [1] 0.5

log_tbl |> select(date, in_interval, roll_cov) |> slice(seq(6, 24, 3))
#> # A tibble: 7 × 3
#>   date       in_interval roll_cov
#>   <date>     <lgl>          <dbl>
#> 1 2024-06-01 TRUE            0.83
#> 2 2024-09-01 TRUE            1   
#> 3 2024-12-01 TRUE            1   
#> 4 2025-03-01 TRUE            0.67
#> 5 2025-06-01 FALSE           0.17
#> 6 2025-09-01 FALSE           0   
#> 7 2025-12-01 FALSE           0   
```

The `in_interval` column is a simple TRUE/FALSE test, and averaging it gives the coverage rate. Overall coverage across the two years is 0.50, but the rolling column shows that average is misleading. Through 2024 the rolling coverage sits near 0.83 to 1.0, close to or above the 80% target. Across 2025 it collapses to 0.17, then 0, and stays there.

That collapse is a distinct failure from the rising MAE. It says the model's intervals have become dangerously overconfident: they promise to contain the truth 80% of the time but now contain it almost never. Anyone using those intervals for risk planning, safety stock, or capacity, is being told the future is far more certain than it is.

[NOTE]
**Coverage measures calibration, which is separate from point accuracy.** A model can have decent point accuracy but intervals that are too narrow, or good coverage with a biased center. Because they fail independently, monitor coverage as its own signal rather than assuming a good MAE implies trustworthy intervals.

**Try it:** What fraction of actuals fell inside the interval during the second year only (rows 13 to 24)?

```r title="Your turn: second-year coverage"
# Average the in_interval flag over the second year.
ex_cov2 <- mean(log_tbl$in_interval)   # <- restrict to rows 13:24
round(ex_cov2, 2)
#> Expected: 0.08
```

<details>
<summary>Click to reveal solution</summary>

```r title="Second-year coverage solution"
ex_cov2 <- mean(log_tbl$in_interval[13:24])
round(ex_cov2, 2)
#> [1] 0.08
```

**Explanation:** In the second year only 8% of actuals landed inside an interval that was supposed to hold 80%. An interval that overconfident is worse than no interval at all, because it invites false confidence.

</details>

## When should you actually retrain the model?

Every signal so far points to the same thing: something is wrong. But "wrong" is not the same as "retrain now," and retraining on every wobble is its own mistake: it is expensive, it can chase noise, and a fresh model is not automatically better. You need a principled bar. The cleanest one is to ask a blunt question: is the model still beating a dumb baseline?

The baseline for seasonal data is **seasonal naive**: just predict what happened one full season ago. If your sophisticated model cannot beat "same month last year" on recent data, it has lost its edge. We measure that with a **relative MAE**: the model's recent MAE divided by the baseline's. Below 1 means the model still wins, above 1 means a naive rule would serve you better.

```r title="Compare the model against a seasonal-naive benchmark"
# seasonal naive: the actual from 12 months earlier
snaive   <- c(rep(NA, 12), log_tbl$actual[1:12])
naive_ae <- abs(log_tbl$actual - snaive)

# model error vs naive error over the most recent year
rel_mae  <- mean(log_tbl$abs_error[13:24]) / mean(naive_ae[13:24])
round(rel_mae, 2)
#> [1] 2.36
```

We build the seasonal-naive forecast by shifting the actuals forward 12 months, then compare average absolute errors over the second year. The relative MAE is 2.36, meaning the deployed model is now about two and a third times worse than simply repeating last year's value. When a model loses to seasonal naive that badly, retraining is no longer optional.

Rather than lean on any single signal, combine them. Each check we built catches a different failure mode, so a combined trigger fires when any of them crosses its line. We assemble them into one named vector so the verdict is auditable.

```r title="Combine every signal into one retraining trigger"
signals <- c(
  accuracy_up     = tail(log_tbl$roll_mae, 1) > 2 * min(log_tbl$roll_mae, na.rm = TRUE),
  bias_breach     = any(abs(log_tbl$tracking_signal) > 4, na.rm = TRUE),
  cusum_alarm     = any(log_tbl$cusum_lo > 4),
  low_coverage    = tail(log_tbl$roll_cov, 1) < 0.6,
  beaten_by_naive = rel_mae > 1
)
signals
#>     accuracy_up     bias_breach     cusum_alarm    low_coverage beaten_by_naive 
#>            TRUE            TRUE            TRUE            TRUE            TRUE 

any(signals)
#> [1] TRUE
```

Each element is a plain yes/no test: has the rolling MAE at least doubled from its best, did the tracking signal breach 4, did the CUSUM alarm, has coverage fallen below 0.6, is the model beaten by naive. Every one is TRUE, so `any(signals)` returns TRUE and the trigger fires. Keeping the individual flags visible matters, because the vector tells you not just that you should retrain but why.

![Four independent health checks feed one retraining decision.](screenshots/Forecast-Monitoring-in-R-four-signals.webp)
*Figure 2: Four independent health checks feed one retraining decision.*

[TIP]
**Retrain on a confirmed trigger, not on a single bad month.** Combine a fast signal (CUSUM or tracking signal) with a slow one (relative MAE over a full season) and require the problem to persist. Pair that with a time-based cadence, say a scheduled refit every quarter, so drift never goes unaddressed even when no alarm has fired yet.

**Try it:** Add a rule that flags when the most recent rolling coverage drops below 0.5. Does it fire?

```r title="Your turn: add a coverage rule"
# Flag when the latest rolling coverage is below 0.5.
ex_cov_rule <- tail(log_tbl$roll_cov, 1) < 0   # <- change 0 to 0.5
ex_cov_rule
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Coverage rule solution"
ex_cov_rule <- tail(log_tbl$roll_cov, 1) < 0.5
ex_cov_rule
#> [1] TRUE
```

**Explanation:** The latest rolling coverage is 0, which is below 0.5, so the rule returns TRUE. You could drop this straight into the `signals` vector as one more independent check.

</details>

## Putting it together: a reusable monitoring function

Scattered snippets are fine for learning, but production wants one function you can call on any forecast log and schedule to run automatically. Let's fold every check into `monitor_forecasts()`. It takes the four log columns and returns a tidy report: one row per period, with the rolling accuracy, coverage, bias, and CUSUM, plus a `status` column that reads ALERT the moment either the tracking signal or the CUSUM crosses its limit.

```r title="Wrap the checks into one monitoring function"
monitor_forecasts <- function(actual, forecast, lower, upper,
                              window = 6, k = 0.5, h = 4) {
  n         <- length(actual)
  error     <- actual - forecast
  abs_error <- abs(error)
  in_pi     <- actual >= lower & actual <= upper
  ts_sig    <- cumsum(error) / (cumsum(abs_error) / seq_len(n))
  sigma0    <- sd(error[seq_len(window)])
  d         <- error / sigma0
  Slo       <- numeric(n)
  for (t in 2:n) Slo[t] <- max(0, Slo[t - 1] - d[t] - k)

  tibble(
    period   = seq_len(n),
    error    = error,
    roll_mae = round(roll_mean(abs_error, window), 1),
    coverage = round(roll_mean(in_pi, window), 2),
    tracking = round(ts_sig, 2),
    cusum    = round(Slo, 2),
    status   = ifelse(Slo > h | abs(ts_sig) > 4, "ALERT", "ok")
  )
}

report <- monitor_forecasts(log_tbl$actual, log_tbl$forecast,
                            log_tbl$lower, log_tbl$upper)
tail(report, 8)
#> # A tibble: 8 × 7
#>   period error roll_mae coverage tracking cusum status
#>    <int> <dbl>    <dbl>    <dbl>    <dbl> <dbl> <chr> 
#> 1     17   -51     52.2     0.33    -10.4  12.5 ALERT 
#> 2     18   -88     63.3     0.17    -12.1  16.5 ALERT 
#> 3     19   -72     66.5     0.17    -13.5  19.7 ALERT 
#> 4     20   -56     63.7     0.17    -14.7  22.1 ALERT 
#> 5     21   -72     73       0       -16.0  25.3 ALERT 
#> 6     22   -55     65.7     0       -17.1  27.6 ALERT 
#> 7     23   -99     73.7     0       -18.4  32.2 ALERT 
#> 8     24   -82     72.7     0       -19.6  36.0 ALERT 
```

The function just packages the exact calculations from earlier sections into one place, so the report reproduces every number we found: rolling MAE in the 50s to 70s, coverage collapsed to near zero, tracking signal past -10, and CUSUM climbing well beyond the limit. Every one of the final eight months carries an ALERT.

Now the payoff. A monitoring system should tell you not just that a model failed, but exactly when the failure began. Two short lines extract that.

```r title="Find the first alert and the retraining verdict"
# first month the monitor fired, and whether to retrain at all
report$period[report$status == "ALERT"][1]
#> [1] 14

any(report$status == "ALERT")
#> [1] TRUE
```

The monitor first raised an ALERT at period 14, February 2025, and `any()` confirms the model needs attention. In a real pipeline you would run `monitor_forecasts()` on a schedule (a cron job, an Airflow task, or a step in your batch-forecasting run) and route any ALERT to a dashboard or a message to the on-call analyst. The whole system is now one function call away.

[KEY INSIGHT]
**Good monitoring pinpoints when a model broke, not just that it broke.** Knowing the failure started in February 2025 lets you investigate what changed then, choose the right training window for the refit, and measure how long you were shipping bad forecasts before you caught it.

**Try it:** Re-run the monitor with a shorter 3-month window, then read the final row's rolling MAE.

```r title="Your turn: monitor with a 3-month window"
# Re-run with a shorter 3-month window, then read the final roll_mae.
ex_report3 <- monitor_forecasts(log_tbl$actual, log_tbl$forecast,
                                log_tbl$lower, log_tbl$upper, window = 6)   # <- change 6 to 3
tail(ex_report3, 1)$roll_mae
#> Expected: 78.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Monitor with a 3-month window solution"
ex_report3 <- monitor_forecasts(log_tbl$actual, log_tbl$forecast,
                                log_tbl$lower, log_tbl$upper, window = 3)
tail(ex_report3, 1)$roll_mae
#> [1] 78.7
```

**Explanation:** With a 3-month window the final rolling MAE is 78.7 instead of 72.7, because a shorter window weights the most recent, largest misses more heavily. The function stayed the same; you only changed one argument.

</details>

## Practice Exercises

These combine several ideas from the tutorial. Each runs in the same session as the code above, so `log_tbl`, `roll_mean()`, `sigma0`, and `report` are all available. Distinct variable names keep your work from overwriting the tutorial state.

### Exercise 1: Add a rolling percentage-error monitor

Using the `pct_error` column already in `log_tbl`, build a rolling 6-month MAPE column named `roll_mape`, then count how many months exceed a 5% threshold. Show the value at months 6, 12, 18, and 24.

```r title="Exercise 1: rolling MAPE"
# Hint: take abs(pct_error), then reuse roll_mean() with a window of 6.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Rolling MAPE solution"
my_mape <- log_tbl |>
  mutate(abs_pct   = abs(pct_error),
         roll_mape = round(roll_mean(abs_pct, 6), 2))

my_mape |> select(date, roll_mape) |> slice(seq(6, 24, 6))
#> # A tibble: 4 × 2
#>   date       roll_mape
#>   <date>         <dbl>
#> 1 2024-06-01      1.45
#> 2 2024-12-01      1.28
#> 3 2025-06-01      6.1 
#> 4 2025-12-01      7.58

sum(my_mape$roll_mape > 5, na.rm = TRUE)
#> [1] 7
```

**Explanation:** Rolling MAPE stays near 1.3% while the model is healthy, then climbs above 6% once it decays. Seven months breach the 5% line, all in the degraded stretch. MAPE is handy for reporting to non-technical stakeholders because a percentage needs no units.

</details>

### Exercise 2: Watch the other side with an upper CUSUM

Our CUSUM only watched for over-forecasting. Build the upper-side CUSUM that would catch **under-forecasting** (errors drifting positive), using the same `sigma0` and slack `k = 0.5`. Report its maximum value and whether it ever alarms.

```r title="Exercise 2: upper-side CUSUM"
# Hint: the recursion is max(0, prev + d[t] - 0.5), where d = error / sigma0.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Upper-side CUSUM solution"
Shi  <- numeric(24)
d_up <- log_tbl$error / sigma0
for (t in 2:24) Shi[t] <- max(0, Shi[t - 1] + d_up[t] - 0.5)

round(max(Shi), 2)
#> [1] 0.59
any(Shi > 4)
#> [1] FALSE
```

**Explanation:** The upper CUSUM peaks at 0.59 and never approaches the limit of 4, correctly reporting no under-forecasting. In production you run both sides at once, so a drift in either direction is caught.

</details>

### Exercise 3: Report the first alerting date

Write a function `first_alert(report, dates)` that returns the calendar date of the first ALERT in a monitoring report, or `NA` if the model was healthy throughout. Run it on `report` with `log_tbl$date`.

```r title="Exercise 3: first alerting date"
# Hint: find which(report$status == "ALERT")[1], then index into dates.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="First alerting date solution"
first_alert <- function(report, dates) {
  hit <- which(report$status == "ALERT")[1]
  if (is.na(hit)) return(NA)
  dates[hit]
}

first_alert(report, log_tbl$date)
#> [1] "2025-02-01"
```

**Explanation:** The function finds the first ALERT row, returns its date, and guards against a clean report by returning `NA` when there is no alert. Turning a monitor into a single actionable date like this is what makes it useful on a dashboard.

</details>

## Frequently Asked Questions

### How often should I run forecast monitoring?

Tie the cadence to how often new actuals arrive. For a monthly series you recompute the checks each month as the new actual lands; for daily data you run them daily. Because a forecast can only be scored once its actual shows up, monitoring naturally runs on the same clock as your data. It is still worth pairing that with a scheduled review, say once a quarter, so a slow drift never goes unnoticed during a quiet stretch.

### What is the difference between a tracking signal and a CUSUM chart?

Both watch accumulated bias, but they are tuned differently. The tracking signal divides the running sum of errors by the average size of a miss and alarms outside about plus or minus 4, which makes it easy to read at a glance. The CUSUM standardizes each error, adds a slack term so small wobbles do not build up, and floors at zero, which makes it quicker to catch a small sustained shift and simple to run unattended across many series. On a large break the two agree, as both flagged February 2025 in this tutorial.

### My CUSUM fires too many false alarms. What should I change?

Raise the decision limit `h` toward 5, or widen the slack `k` so more of the normal error spread is ignored before the sum starts to climb. A subtler cause is a badly calibrated `sigma0`: if you estimate the normal spread from a stretch that was already drifting, every later error looks small and the chart turns jumpy or numb. Re-estimate `sigma0` from a genuinely stable period of history.

### Can I monitor a model that outputs only point forecasts, with no intervals?

Yes. Every check except coverage reads only the actual and forecast columns, so rolling accuracy, the tracking signal, the CUSUM, and the seasonal-naive benchmark all keep working. Coverage is the single signal that needs the lower and upper bounds, so a point-only pipeline just drops it. If your model can produce intervals, keep coverage, because it catches an overconfidence failure that the point-error checks miss.

### Does this work for machine-learning forecasts, not just ARIMA or ETS?

Yes, and that is the reason everything runs off a forecast log. Each check reads only the actual, forecast, lower, and upper columns, so it does not care whether those numbers came from ETS, Prophet, or a gradient-boosted model. Monitoring built this way stays model-agnostic by construction.

## Summary

Monitoring turns a deployed forecast model from a black box you hope still works into a system that tells you the moment it stops. Everything runs off one forecast log of actuals, forecasts, and intervals, and each check catches a different failure mode.

| Check | R measure | Red flag |
|---|---|---|
| Accuracy | Rolling MAE, RMSE, MAPE | Rolling error trending sharply up |
| Bias | Mean error, tracking signal | Tracking signal outside plus or minus 4 |
| Alerting | CUSUM control chart | Cumulative sum crosses the limit h |
| Calibration | Interval coverage rate | Coverage far below the interval's promise |
| Benchmark | Relative MAE vs seasonal naive | Ratio above 1 (beaten by naive) |
| Decision | Combined trigger + `monitor_forecasts()` | Any signal fires; then retrain |

The most important habit is to watch these continuously, not once. A single backtest tells you a model was good on the day you built it. Monitoring tells you whether it is still good today.

![The forecast monitoring toolkit at a glance.](screenshots/Forecast-Monitoring-in-R-overview-mindmap.webp)
*Figure 3: The forecast monitoring toolkit at a glance.*

## References

1. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice* (3rd ed.), Chapter 5: Evaluating forecast accuracy. [Link](https://otexts.com/fpp3/accuracy.html)
2. fabletools documentation. `accuracy()`: Evaluate accuracy of a forecast or model. [Link](https://fabletools.tidyverts.org/reference/accuracy.html)
3. O'Hara-Wild, M., Hyndman, R.J. et al. *Tidy forecasting principles*, Forecast evaluation. [Link](https://tidyverts.github.io/tidy-forecasting-principles/accuracy.html)
4. NIST/SEMATECH *e-Handbook of Statistical Methods*, CUSUM control charts. [Link](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc323.htm)
5. Gardner, E.S. (1983). Automatic monitoring of forecast errors. *Journal of Forecasting*, 2(1). [Link](https://onlinelibrary.wiley.com/doi/10.1002/for.3980020103)
6. Arthur.ai. Detecting unexpected drift in time series features. [Link](https://www.arthur.ai/blog/detecting-unexpected-drift-in-time-series-features)
7. Hyndman, R.J. *forecast* package reference. [Link](https://pkg.robjhyndman.com/forecast/)

## Continue Learning

- [Forecast Accuracy in R](Forecast-Accuracy-in-R.html) - the full set of point and scaled error metrics, and how to interpret each one.
- [Backtesting Forecasts in R](Backtesting-Forecasts-in-R.html) - evaluate a model on rolling origins before you deploy, the pre-production companion to monitoring.
- [Batch Forecasting in R](Batch-Forecasting-in-R.html) - forecast hundreds of series at once, the natural place to bolt on the monitoring function from this tutorial.
