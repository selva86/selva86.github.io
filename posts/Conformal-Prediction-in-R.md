---
title: "Conformal Prediction in R: Distribution-Free Forecast Intervals"
slug: "Conformal-Prediction-in-R"
description: "Build conformal prediction intervals in R from scratch, measure their real coverage on held-out data, and get honest forecast intervals ARIMA cannot promise."
keywords: "conformal prediction R, distribution-free prediction intervals, split conformal prediction, forecast intervals R, prediction interval coverage, nonconformity score, adaptive conformal inference, conformalForecast R"
auto_link_terms: "conformal prediction|conformal prediction interval|distribution-free prediction interval|split conformal prediction|nonconformity score|conformity score|calibration set|coverage guarantee|empirical coverage|adaptive conformal inference|rolling calibration window|conformalForecast|exchangeability"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "TS2-9.6"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Conformal Prediction"
sidebar_order: "43"
difficulty: "Intermediate"
---

<p class="lead">Conformal prediction builds a forecast interval out of the mistakes your model has already made. You let the model forecast data it never trained on, collect how far off it was, take a quantile of those errors, and use that number as your interval width. No bell curve, no assumption that the model is correctly specified, and it wraps around any forecasting method you like, including ones that have no interval theory at all. This page builds it from scratch in base R and the forecast package, then audits it against a real series where the textbook intervals are measurably wrong. Every number below was produced by running the code, not estimated.</p>

## Does a 95% prediction interval really contain the truth 95% of the time?

A prediction interval makes a specific, checkable promise: over many forecasts, the truth should land inside the interval 95% of the time. Almost nobody checks. We are going to check first and build second, because the size of the gap is what motivates everything else on this page.

The series is Australian monthly wine sales, which ships with the `forecast` package. It runs from January 1980 to August 1994 and it has the two properties that make forecasting interesting: a strong December spike every year, and a slow drift upward in overall volume.

```r title="Load the wine sales series"
library(forecast)
library(ggplot2)

sales <- wineind
c(observations = length(sales),
  start_year   = start(sales)[1],
  per_year     = frequency(sales))
#> observations   start_year     per_year 
#>          176         1980           12
```

176 monthly observations, twelve per year. Let us look at it before we model it.

```r title="Plot the wine sales series"
autoplot(sales) +
  labs(title = "Australian wine sales", x = "Year", y = "Bottles sold")
```

You can see the annual sawtooth and the upward drift. Now we fit a model. `ets()` picks an exponential smoothing model automatically, which means it works out for itself whether the trend and the seasonal pattern should be added on or multiplied in. It is a strong, standard choice for a series shaped like this one, and it hands back a prediction interval for free.

```r title="Forecast six months with a 95% interval"
fit <- ets(sales)
fc  <- forecast(fit, h = 6, level = 95)
fc
#>          Point Forecast    Lo 95    Hi 95
#> Sep 1994       24738.63 20464.04 29013.22
#> Oct 1994       26971.62 22302.93 31640.31
#> Nov 1994       31771.37 26262.11 37280.62
#> Dec 1994       37059.88 30622.19 43497.58
#> Jan 1995       16590.16 13703.17 19477.15
#> Feb 1995       21206.49 17509.65 24903.34
```

That is a normal, respectable forecast. September 1994 sales will be about 24,739 bottles, and the model is 95% confident the truth lies between 20,464 and 29,013.

Here is the walk-through. `ets(sales)` estimated the smoothing model, `forecast()` projected it six months forward, and `level = 95` asked for bounds wide enough to hold the truth 95% of the time. The interpretation is that if you plan on this, you should be surprised by an outcome outside those bounds roughly one month in twenty.

Should you be? We can find out, because we have fourteen years of history. The idea is simple: pretend we are standing at some point in the past, make a one-month-ahead forecast with a 95% interval, then step forward and see whether the real value landed inside. Do that at every possible point in the series and count.

```r title="Roll the model forward and record every forecast"
start_at <- 48                      # first forecast is made after four years of data
n        <- length(sales)
origins  <- start_at:(n - 1)        # every point we can forecast from
base     <- ets(subset(sales, end = start_at))

audit <- data.frame(origin = origins, actual = NA, point = NA, lo = NA, hi = NA)
for (k in seq_along(origins)) {
  i <- origins[k]
  f <- forecast(ets(subset(sales, end = i), model = base, use.initial.values = TRUE),
                h = 1, level = 95)
  audit$actual[k] <- sales[i + 1]
  audit$point[k]  <- as.numeric(f$mean)
  audit$lo[k]     <- as.numeric(f$lower)
  audit$hi[k]     <- as.numeric(f$upper)
}
audit$hit <- audit$actual >= audit$lo & audit$actual <= audit$hi
round(head(audit, 4), 1)
#>   origin actual   point      lo      hi hit
#> 1     48  17556 18472.8 16472.2 20473.3   1
#> 2     49  22077 20825.5 18576.9 23074.0   1
#> 3     50  25702 24042.3 21438.9 26645.6   1
#> 4     51  22214 24292.7 21640.6 26944.8   1
```

Read the loop from the inside out. `subset(sales, end = i)` gives the model only the history available at time `i`, so nothing from the future leaks in. `ets(..., model = base)` reuses the smoothing parameters we estimated once at the start and simply feeds them the new observations, and `use.initial.values = TRUE` keeps that first fit's starting level and seasonal figures too, so nothing at all is re-estimated inside the loop. `forecast(..., h = 1)` steps one month ahead, and the last line marks whether the real value fell between the bounds.

The first four forecasts all landed inside, which is what you want to see. The question is what happens across all 128 of them.

[WARNING]
**The whole audit is worthless if any future data reaches the model.** The guard here is `subset(sales, end = i)`, which hands the model history up to month `i` and nothing beyond. It is easy to lose that guard by scaling or differencing the full series before the loop, or by fitting on everything and then slicing predictions afterwards. Both mistakes make coverage look excellent and both are silent.

```r title="Count how often the interval was right"
round(c(forecasts_made = nrow(audit),
        times_covered  = sum(audit$hit),
        actual_rate    = mean(audit$hit),
        promised_rate  = 0.95), 3)
#> forecasts_made  times_covered    actual_rate  promised_rate 
#>        128.000        108.000          0.844          0.950
```

The model made 128 one-month-ahead forecasts and its 95% interval held the truth 108 times. That is 84.4%, not 95%. Instead of being blindsided once every twenty months, you would have been blindsided once every six and a half.

Nothing here is a trick. `ets()` chose its own model form, it saw only past data at every step, and the series is a well-behaved commercial time series with no crashes or missing values. The interval is simply narrower than reality.

[KEY INSIGHT]
**A confidence level is a promise, and coverage is the measurement.** The 95 in `level = 95` describes what the model's assumptions imply, not what the model achieved. Until you roll the model forward over held-out data and count, you have a label rather than a fact, and on this series the label was wrong by more than ten percentage points.

[NOTE]
**About the protocol used above.** We estimate the smoothing parameters once on the first 48 months and then only feed the fitted model new data, which is what production systems do between scheduled refits and what keeps this page fast. Re-estimating every parameter at every one of the 128 origins was also measured: 95% coverage moves from 84% to about 86%. Better, still not 95%, and the rest of this page is unchanged.

**Try it:** Rerun the audit at `level = 80` instead of 95 and report the coverage you actually get. Reuse `base` and `origins` so you are not refitting anything new.

```r title="Your turn: audit the 80 percent interval"
ex_hit80 <- logical(length(origins))
for (k in seq_along(origins)) {
  i <- origins[k]
  # your code here: forecast one step at level 80 and record whether
  # sales[i + 1] fell inside the bounds
}

round(c(promised = 0.80, actual = mean(ex_hit80)), 3)
#> Expected: an "actual" well below 0.80
```

<details>
<summary>Click to reveal solution</summary>

```r title="Audit the 80 percent interval solution"
ex_hit80 <- logical(length(origins))
for (k in seq_along(origins)) {
  i <- origins[k]
  f <- forecast(ets(subset(sales, end = i), model = base, use.initial.values = TRUE),
                h = 1, level = 80)
  ex_hit80[k] <- sales[i + 1] >= as.numeric(f$lower) & sales[i + 1] <= as.numeric(f$upper)
}

round(c(promised = 0.80, actual = mean(ex_hit80)), 3)
#> promised   actual 
#>    0.800    0.602
```

**Explanation:** The 80% interval covers 60.2% of the time. Narrowing the interval did not just shrink coverage proportionally, it made the shortfall worse in relative terms, because the parametric bounds get their shape from the same distributional assumption at every level.

</details>

## What is a conformal prediction interval?

The parametric interval failed because it was derived rather than measured. `ets()` estimates one number for the size of a typical error, assumes errors follow a bell curve, and multiplies. If either half of that is wrong, the interval is wrong.

Conformal prediction throws the derivation away and measures instead. Its whole premise fits in one sentence: **the mistakes the model has already made are the best available forecast of the mistake it is about to make.** So you gather those mistakes and read the answer off them directly.

Let us see why the derived interval was too narrow. We can compare the width a bell curve implies against the errors that actually occurred.

```r title="Compare the bell curve against real errors"
audit$err <- audit$actual - audit$point

round(c(sd_of_errors     = sd(audit$err),
        gaussian_says_95 = 1.96 * sd(audit$err),
        real_95th_pct    = unname(quantile(abs(audit$err), 0.95)),
        worst_error      = max(abs(audit$err))), 1)
#>     sd_of_errors gaussian_says_95    real_95th_pct      worst_error 
#>           3178.4           6229.7           6593.2           9379.6
```

The walk-through: `audit$err` is how far the truth was from the point forecast each month, `sd()` measures their typical spread, and `1.96 * sd` is the textbook half-width of a 95% Gaussian interval. The last two lines ask the data directly how big the errors really got.

The interpretation is that the bell curve says 95% of errors should be within 6,230 bottles, but the real 95th percentile is 6,593, and the worst month was off by 9,380. The tails are fatter than a normal distribution allows. That is not unusual, it is the ordinary condition of real data, and it is exactly the assumption conformal prediction refuses to make.

### The recipe

Conformal prediction needs three ingredients.

1. **A calibration set.** A stretch of data the model was not trained on, where you know both the forecast and the truth.
2. **A conformity score.** A single number per calibration point saying how badly the model missed. For forecasting, the absolute error is the standard choice: $s_i = |y_i - \hat{y}_i|$.
3. **A quantile.** Sort the scores and take the one that sits above (1 - alpha) of them. That number, call it $\hat{q}$, becomes your interval half-width.

The interval for a new forecast is then just $\hat{y} \pm \hat{q}$.

![Split conformal prediction turns held-out errors into an interval width](screenshots/Conformal-Prediction-in-R-split-conformal-flow.webp)

*Figure 1: Split conformal prediction turns held-out errors into an interval width.*

Notice what is missing from that recipe: any statement about the shape of the error distribution. This is why the method is called distribution-free. It does not need errors to be normal, symmetric, or even continuous. It only needs the calibration errors to be drawn from the same pool as the future error, an assumption we will name in a later section and then show this series violating.

Here it is in code. We split the audit we already built: the first 60 forecasts become the calibration set, and the remaining 68 become the test set we score ourselves on.

```r title="Compute the conformal quantile"
calib  <- audit[1:60, ]
test   <- audit[61:nrow(audit), ]

scores <- abs(calib$err)                                  # conformity scores
alpha  <- 0.05                                            # we want 95% coverage
k_idx  <- ceiling((length(scores) + 1) * (1 - alpha))     # which sorted score to take
q_hat  <- sort(scores)[k_idx]

c(calibration_size = length(scores), rank_needed = k_idx, q_hat = round(q_hat, 1))
#> calibration_size      rank_needed            q_hat 
#>             60.0             58.0           5171.2
```

Line by line: `scores` is the size of each calibration miss regardless of direction. `alpha` is the error rate we are willing to accept, so 0.05 means we want to be right 95% of the time. `k_idx` works out which position in the sorted list we need, and `sort(scores)[k_idx]` reads it off. That is the entire algorithm. Four lines, no distribution assumed.

The interpretation: out of 60 calibration errors, the 58th smallest was 5,171 bottles. So 57 of the 60 past errors were smaller than that. We will use 5,171 as our half-width and see how it holds up on data neither the model nor the calibration ever saw.

```r title="Apply the conformal interval and score it"
test$c_lo  <- test$point - q_hat
test$c_hi  <- test$point + q_hat
test$c_hit <- test$actual >= test$c_lo & test$actual <= test$c_hi

round(c(ets_coverage       = mean(test$hit),
        ets_width          = mean(test$hi - test$lo),
        conformal_coverage = mean(test$c_hit),
        conformal_width    = 2 * q_hat), 3)
#>       ets_coverage          ets_width conformal_coverage    conformal_width 
#>              0.779           9120.242              0.853          10342.335
```

On the same 68 test months, the parametric interval covered 77.9% while the conformal interval covered 85.3%. Conformal bought that improvement by being wider, 10,342 bottles against 9,120, which is the honest trade: the extra width was not padding, it was uncertainty the parametric interval had been hiding.

But 85.3% is still not 95%. Hold that number. It is the most important result on this page and we will come back to it in two sections, because the reason it falls short is specific to time series and it has a specific fix.

[KEY INSIGHT]
**Conformal prediction replaces an assumption with a measurement.** A parametric interval asks "given my model is right and errors are normal, how wide should this be?" A conformal interval asks "how wrong have I actually been lately?" The first question can be answered from theory alone and is therefore only as good as the theory. The second requires held-out data and is therefore only as good as your data, which on any real series is the better bet.

**Try it:** Build an 80% conformal interval from the same calibration scores and measure its coverage on the test set. Remember that 80% coverage means `alpha` is 0.20.

```r title="Your turn: build an 80 percent conformal interval"
ex_q80 <- 0   # your code here: the conformal quantile of `scores` at alpha = 0.20

round(c(q80 = ex_q80, coverage = mean(abs(test$err) <= ex_q80)), 3)
#> Expected: a q80 near 2800 and a coverage well under 0.80
```

<details>
<summary>Click to reveal solution</summary>

```r title="80 percent conformal interval solution"
ex_q80 <- sort(scores)[ceiling((length(scores) + 1) * (1 - 0.20))]

round(c(q80 = ex_q80, coverage = mean(abs(test$err) <= ex_q80)), 3)
#>      q80 coverage 
#> 2792.394    0.441
```

**Explanation:** The 80% conformal interval covered only 44.1%. The recipe is correct and the shortfall is real, which is a preview of the problem this page tackles in the exchangeability section: the calibration errors were systematically smaller than the errors that came later.

</details>

## Why does the calibration quantile need that +1 correction?

You may have looked at `ceiling((length(scores) + 1) * (1 - alpha))` and wondered why we did not simply write `quantile(scores, 0.95)`. This is the single most common bug in hand-rolled conformal code, and it is worth two minutes because it silently costs you coverage.

Here is the difference on our real scores.

```r title="Compare quantile() against the conformal rank"
round(c(quantile_function = unname(quantile(scores, 0.95)),
        conformal_rule    = q_hat), 1)
#> quantile_function    conformal_rule 
#>            4005.0            5171.2
```

The two answers differ by 29%. `quantile()` returns 4,005 and the conformal rule returns 5,171, from the exact same 60 numbers.

The reason is a counting argument. When you make a prediction for a new point, you have 60 calibration scores plus one unknown score for the point you are about to predict. That is 61 values, not 60. If all 61 are equally likely to land in any position when sorted, then the probability that the new one is not among the largest 5% requires you to reserve room for it. The rank you need is

$$k = \lceil (n + 1)(1 - \alpha) \rceil$$

Where:

- $n$ = the number of calibration scores you have
- $\alpha$ = the error rate you accept, so 0.05 for a 95% interval
- $\lceil \cdot \rceil$ = round up to the next whole number
- $k$ = the position in the sorted scores to read off

With $n = 60$ and $\alpha = 0.05$ that gives $\lceil 61 \times 0.95 \rceil = \lceil 57.95 \rceil = 58$, which is what the code computed. R's `quantile()` interpolates between the 57th and 58th values using a rule designed for estimating a population quantile, which is a different job and lands lower.

Does the correction actually matter? We can settle it with a simulation instead of an argument. We draw calibration scores and a new score from the identical heavy-tailed distribution, so the exchangeability assumption holds perfectly by construction, then check how often each rule covers.

```r title="Simulate both rules against a known target"
set.seed(2026)
m    <- 20        # a small calibration set, where the difference bites hardest
reps <- 20000
naive_hits <- conf_hits <- logical(reps)

for (r in 1:reps) {
  s   <- abs(rt(m, df = 3))      # 20 calibration scores
  new <- abs(rt(1, df = 3))      # the score we are trying to cover
  naive_hits[r] <- new <= quantile(s, 0.90)
  conf_hits[r]  <- new <= sort(s)[ceiling((m + 1) * 0.90)]
}

round(c(target = 0.90,
        quantile_function = mean(naive_hits),
        conformal_rule    = mean(conf_hits)), 4)
#>            target quantile_function    conformal_rule 
#>            0.9000            0.8640            0.9034
```

The walk-through: each of the 20,000 repetitions draws a fresh calibration set from a t-distribution with 3 degrees of freedom (heavy tails, like real forecast errors), draws one more value to stand in for the future, and asks both rules whether they would have covered it.

The interpretation is unambiguous. Against a 90% target, `quantile()` delivered 86.4% and the conformal rank delivered 90.3%. The conformal rule is very slightly conservative, which is exactly what the theory promises: coverage is guaranteed to be at least $1 - \alpha$, and at most $1 - \alpha + \frac{1}{n+1}$. With $n = 20$ that upper bound is 0.948 for a 90% target, and 0.9034 sits comfortably inside.

[WARNING]
**Using quantile() instead of the conformal rank silently under-covers.** The gap shrinks as the calibration set grows, so it is easy to miss in testing and then bite you in production where calibration windows are short. Write the rank formula once as a helper function and never type a bare quantile call in conformal code again.

**Try it:** For a 95% interval, some calibration sets are simply too small: the rule asks for a rank higher than the number of scores you have, which means no finite interval exists. Find the smallest calibration size that works.

```r title="Your turn: find the smallest usable calibration set"
ex_sizes <- sapply(15:25, function(m) FALSE)  # your code here: is the rank <= m?

data.frame(n_calib = 15:25, finite_interval = ex_sizes)
#> Expected: FALSE up to some size, then TRUE from there on
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smallest usable calibration set solution"
ex_sizes <- sapply(15:25, function(m) ceiling((m + 1) * 0.95) <= m)

data.frame(n_calib = 15:25, finite_interval = ex_sizes)
#>    n_calib finite_interval
#> 1       15           FALSE
#> 2       16           FALSE
#> 3       17           FALSE
#> 4       18           FALSE
#> 5       19            TRUE
#> 6       20            TRUE
#> 7       21            TRUE
#> 8       22            TRUE
#> 9       23            TRUE
#> 10      24            TRUE
#> 11      25            TRUE
```

**Explanation:** You need at least 19 calibration points for a 95% conformal interval, because $\lceil 20 \times 0.95 \rceil = 19$. Below that the rule asks for a rank you do not have, and the honest answer is an infinitely wide interval. In general you need $n \geq \frac{1}{\alpha} - 1$.

</details>

## Do all forecast horizons need the same interval?

So far we have only forecast one month ahead. Real forecasts run further, and the textbook says intervals must widen as the horizon grows, because uncertainty compounds. That is often true. It is not always true, and guessing is unnecessary when measuring is this cheap.

First, let us wrap the rank rule in a helper so we stop rewriting it, then collect errors at every horizon from 1 to 6 instead of just horizon 1.

```r title="Define conf_q and collect errors by horizon"
conf_q <- function(scores, alpha) {
  scores <- sort(scores)
  rank   <- ceiling((length(scores) + 1) * (1 - alpha))
  if (rank > length(scores)) Inf else scores[rank]
}

H     <- 6
og_h  <- start_at:(n - H)
err_h <- matrix(NA_real_, nrow = length(og_h), ncol = H,
                dimnames = list(NULL, paste0("h", 1:H)))

for (k in seq_along(og_h)) {
  i <- og_h[k]
  f <- forecast(ets(subset(sales, end = i), model = base, use.initial.values = TRUE), h = H)
  err_h[k, ] <- sales[(i + 1):(i + H)] - as.numeric(f$mean)
}
round(head(err_h, 3), 1)
#>          h1      h2      h3      h4      h5      h6
#> [1,] -916.8  1244.2  1657.4 -2068.3  2449.9 -1729.6
#> [2,] 1251.5  1670.0 -2051.4  2471.0 -1703.8  -989.3
#> [3,] 1659.7 -2066.8  2450.5 -1729.9 -1025.4  3702.0
```

The helper now returns `Inf` when the calibration set is too small, which turns a silent bug into a visible one. `err_h` is a matrix with one row per forecast origin and one column per horizon: row 1 holds the six errors made when forecasting from month 48, row 2 the six from month 49, and so on.

Now take a conformal quantile down each column separately. Each horizon gets its own interval width.

```r title="Calibrate each horizon separately"
q_h <- apply(abs(err_h[1:60, ]), 2, conf_q, alpha = alpha)
round(q_h, 0)
#>   h1   h2   h3   h4   h5   h6 
#> 5171 5175 5143 5192 5163 5160
```

Flat. Forecasting six months ahead on this series is no harder than forecasting one month ahead. That is not a bug, and it tells you something real about wine sales: they are dominated by a stable annual pattern rather than by momentum. Knowing last month barely helps you predict this month beyond knowing which month it is, so losing that knowledge costs you almost nothing.

Compare against a series that behaves the other way. Airline passenger counts have genuine momentum, so losing track of the recent level compounds.

```r title="Contrast with a series that has momentum"
air_base <- ets(subset(AirPassengers, end = 48))
og_a     <- 48:(length(AirPassengers) - H)
err_a    <- matrix(NA_real_, nrow = length(og_a), ncol = H,
                   dimnames = list(NULL, paste0("h", 1:H)))

for (k in seq_along(og_a)) {
  i <- og_a[k]
  f <- forecast(ets(subset(AirPassengers, end = i), model = air_base,
                    use.initial.values = TRUE), h = H)
  err_a[k, ] <- AirPassengers[(i + 1):(i + H)] - as.numeric(f$mean)
}
round(apply(abs(err_a[1:60, ]), 2, conf_q, alpha = alpha), 1)
#>   h1   h2   h3   h4   h5   h6 
#> 35.2 46.9 53.2 58.8 61.6 62.7
```

The interpretation: on airline passengers the six-month interval is 78% wider than the one-month interval, while on wine sales it is the same. Two respectable seasonal series, two opposite answers. If you had assumed either pattern you would have been wrong about one of them.

[TIP]
**Calibrate every horizon separately by default.** It costs one extra `apply()` call and it is correct whether your errors grow with the horizon or not. Pooling all horizons into one set of scores only works when the widths happen to be flat, and you cannot know that without doing the per-horizon version first anyway.

**Try it:** Count how many of the six-month-ahead test errors are larger than the one-month interval half-width. If the widths are genuinely flat, this should be close to what you would expect by chance.

```r title="Your turn: count the six month errors above the one month width"
ex_over <- 0   # your code here: how many rows 61+ of err_h have |h6 error| > q_h["h1"]

c(exceeded = ex_over, out_of = nrow(err_h) - 60)
#> Expected: roughly one in six
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count six month errors above the one month width solution"
ex_over <- sum(abs(err_h[61:nrow(err_h), "h6"]) > q_h["h1"])

c(exceeded = ex_over, out_of = nrow(err_h) - 60)
#> exceeded   out_of 
#>       10       63
```

**Explanation:** 10 of 63 six-month errors exceeded the one-month width, about 16%. If the horizons truly behaved identically and the calibration were still valid we would expect around 5%, so this is a hint that something other than the horizon is inflating errors on the later part of the series. The next section identifies it.

</details>

## What is exchangeability, and why does a time series break it?

We now have two unexplained results. The 95% conformal interval covered 85.3% rather than 95%, and the 80% one covered 44.1%. The recipe was implemented correctly, so the assumption behind it must be failing. Time to name that assumption.

Conformal prediction needs the calibration scores and the future score to be **exchangeable**. In plain words: if you wrote all of them on cards and shuffled the deck, every ordering would be equally likely. Nothing about a value's position in the sequence tells you anything about its size.

That is a weaker requirement than the usual "independent and identically distributed", because exchangeable values are allowed to be correlated with each other. It is still a real requirement, and a time series violates it in the most obvious way possible: later values are systematically different from earlier ones. Let us confirm that is what is happening here by splitting our 128 errors into four consecutive blocks and looking at their typical size.

```r title="Check whether errors drift over time"
quarter <- cut(seq_len(nrow(audit)), 4, labels = c("first", "second", "third", "fourth"))
round(tapply(abs(audit$err), quarter, mean), 0)
#>  first second  third fourth 
#>   1424   2285   2903   3379
```

The walk-through: `cut()` chops the 128 forecasts into four consecutive blocks of 32, and `tapply()` reports the average absolute error inside each.

The interpretation is decisive. Errors in the final block are 2.4 times larger than in the first. Position in the sequence tells you a great deal about error size, so the cards are not shuffled and exchangeability is false. Our calibration set was the first 60 forecasts, the era when the model was at its most accurate, and we then used that era's quantile to build intervals for a later era where the model was much worse. Of course they were too narrow.

This is not a quirk of wine sales. The series grew, so its errors grew with it. Any series that trends, seasonally shifts, changes regime, or simply gets harder to predict will do the same thing.

[WARNING]
**The finite-sample coverage guarantee does not hold for time series as usually stated.** Papers and package documentation state it under exchangeability, and forecasting data is not exchangeable. Conformal prediction is still worth using, and it still beat the parametric interval above, but treat the guarantee as a target you have to actively maintain rather than a certificate you receive.

**Try it:** Quantify the drift more directly by comparing the first 30 forecasts against the last 30.

```r title="Your turn: compare early errors against late errors"
ex_drift <- c(first_30 = 0,   # your code here: mean absolute error of the first 30
              last_30  = 0)   # and of the last 30

round(ex_drift, 0)
#> Expected: the last 30 roughly double the first 30
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare early against late errors solution"
ex_drift <- c(first_30 = mean(abs(head(audit$err, 30))),
              last_30  = mean(abs(tail(audit$err, 30))))

round(ex_drift, 0)
#> first_30  last_30 
#>     1491     3461
```

**Explanation:** The model's typical miss grew from about 1,491 bottles to about 3,461. A calibration set drawn from the early period describes a level of accuracy the model no longer has.

</details>

## How do you keep coverage on target when the series keeps changing?

The diagnosis points straight at the cure. If old errors no longer describe the model's current accuracy, stop using old errors.

![Which calibration rule to use once the errors start drifting](screenshots/Conformal-Prediction-in-R-drift-fix.webp)

*Figure 2: Which calibration rule to use once the errors start drifting.*

### Fix one: a rolling calibration window

Instead of freezing the calibration set at the first 60 forecasts, recompute the quantile at every step from only the most recent `W` errors. The window slides forward with you, so when the model gets worse the interval widens automatically, and when it gets better the interval tightens.

```r title="Roll the calibration window forward"
W    <- 40
ncal <- 60
q_static <- conf_q(abs(audit$err[1:ncal]), alpha)

live <- data.frame(k = (ncal + 1):nrow(audit), static_hit = NA,
                   roll_hit = NA, roll_width = NA)
for (j in seq_len(nrow(live))) {
  k      <- live$k[j]
  q_roll <- conf_q(abs(audit$err[(k - W):(k - 1)]), alpha)   # last 40 errors only
  live$static_hit[j] <- abs(audit$err[k]) <= q_static
  live$roll_hit[j]   <- abs(audit$err[k]) <= q_roll
  live$roll_width[j] <- 2 * q_roll
}
round(c(static_coverage  = mean(live$static_hit),
        static_width     = 2 * q_static,
        rolling_coverage = mean(live$roll_hit),
        rolling_width    = mean(live$roll_width)), 3)
#>  static_coverage     static_width rolling_coverage    rolling_width 
#>            0.853        10342.335            0.971        16597.632
```

The only change inside the loop is which errors feed the quantile: `audit$err[(k - W):(k - 1)]` is always the 40 most recent misses as of the moment you forecast, and the slice stops one step short of `audit$err[k]`, the error you are trying to cover.

The interpretation is that coverage went from 85.3% to 97.1%, comfortably past the 95% target, and the price was width: 16,598 bottles against 10,342. That is uncomfortable, and it is also the truth. The static interval was not better, it was wrong. Once you insist on genuinely covering 95% of months on the later, harder part of this series, this is what it costs.

Notice the rolling version slightly overshoots. Forty recent errors is a small sample, so the quantile is jumpy and tends to land high. That is the second fix's job.

### Fix two: adaptive conformal inference

A rolling window reacts to changes in error size, but it never checks whether it is actually hitting the target. Adaptive conformal inference, introduced by Gibbs and Candes, adds that feedback loop. It keeps a working error rate $\alpha_t$ that moves after every observation:

$$\alpha_{t+1} = \alpha_t + \gamma \left( \alpha - \mathbb{1}\{ y_t \notin C_t \} \right)$$

Where:

- $\alpha_t$ = the error rate the algorithm is currently using to pick the quantile
- $\alpha$ = the error rate you actually want, 0.05 here
- $\gamma$ = the step size, controlling how sharply it reacts
- $\mathbb{1}\{ y_t \notin C_t \}$ = 1 if the last interval missed, 0 if it covered

Read it as a thermostat. After a miss the bracket becomes $\alpha - 1$, a large negative number, so $\alpha_t$ drops and the next interval widens. After a hit the bracket is $\alpha$, a small positive number, so $\alpha_t$ creeps up and the interval tightens. Over time the two forces balance at the target rate.

```r title="Run adaptive conformal inference"
gamma <- 0.05
a_t   <- alpha
aci   <- data.frame(k = live$k, hit = NA, width = NA, alpha_t = NA)

for (j in seq_len(nrow(aci))) {
  k     <- aci$k[j]
  a_use <- min(max(a_t, 0.001), 0.999)                       # keep alpha_t in range
  q_a   <- conf_q(abs(audit$err[(k - W):(k - 1)]), a_use)
  aci$hit[j]     <- abs(audit$err[k]) <= q_a
  aci$width[j]   <- 2 * q_a
  aci$alpha_t[j] <- a_t
  a_t <- a_t + gamma * (alpha - (1 - aci$hit[j]))             # the update rule
}
round(c(aci_coverage = mean(aci$hit), aci_width = mean(aci$width),
        alpha_start  = alpha,         alpha_end = a_t), 3)
#> aci_coverage    aci_width  alpha_start    alpha_end 
#>        0.956    15391.462        0.050        0.070
```

The walk-through: `a_use` clamps the working rate into a legal range so a long run of hits cannot push it past 1. Everything else is the rolling window from before, except that the alpha fed to `conf_q` now changes every step, and the final line applies the thermostat.

The interpretation is that adaptive conformal delivered 95.6% coverage, closer to the 95% target than the rolling window's 97.1%, and it did so with a narrower average interval: 15,391 against 16,598. Better coverage and less width at the same time, because every stretch of covered months raised the working alpha, which narrowed the next interval instead of leaving it too wide.

```r title="See how far the working alpha travelled"
round(range(aci$alpha_t), 4)
#> [1] 0.0400 0.1175
```

The working rate ranged from 0.040 up to 0.1175. Each covered month adds `gamma * alpha`, which is 0.0025, so a run of hits walks the rate up toward 0.12 and narrows the interval; each miss subtracts `gamma * (1 - alpha)`, which is 0.0475, nineteen times larger, so one miss undoes nineteen hits. You asked for 5% and internally the algorithm spent most of its time asking for something else, which is how it delivered 5% on the outside.

[KEY INSIGHT]
**Adaptive conformal trades a finite-sample guarantee for a long-run one, which is the better deal for a live series.** Classical split conformal promises exact coverage over data that never changes. Adaptive conformal promises that coverage converges to your target over time no matter how the series shifts, and a forecasting system that runs for years cares far more about the second promise than the first.

**Try it:** The window length is a real tuning knob. Try `W = 20` instead of 40 and see what a shorter memory does to coverage.

```r title="Your turn: try a 20 error window"
ex_w20 <- logical(nrow(audit) - ncal)
for (j in seq_along(ex_w20)) {
  k <- ncal + j
  # your code here: conformal quantile from the last 20 errors, then hit or miss
}

round(c(window = 20, coverage = mean(ex_w20)), 3)
#> Expected: coverage above the 0.95 target
```

<details>
<summary>Click to reveal solution</summary>

```r title="Twenty error window solution"
ex_w20 <- logical(nrow(audit) - ncal)
for (j in seq_along(ex_w20)) {
  k <- ncal + j
  ex_w20[j] <- abs(audit$err[k]) <= conf_q(abs(audit$err[(k - 20):(k - 1)]), alpha)
}

round(c(window = 20, coverage = mean(ex_w20)), 3)
#>   window coverage 
#>   20.000    0.985
```

**Explanation:** A 20-error window covers 98.5%, even further above target than the 40-error window. With only 20 scores the 95% conformal rank is the largest one, so the interval is set by the single worst recent miss. Short windows adapt faster but get noisier, which is exactly the pressure adaptive conformal relieves.

</details>

## How do you put an interval on a model that has no interval formula?

Everything so far has been an improvement on an interval that already existed. Now the case where conformal prediction is not an improvement but the only option available.

A random forest forecaster returns a number. That is all. There is no error term to be normal, no likelihood, no closed-form variance of the prediction. The same is true of gradient boosted trees, of nearest-neighbour forecasters, and of most machine learning methods people now point at time series. Conformal prediction never looks inside the model, only at the errors it made, so a missing variance formula costs it nothing.

To use a forest we first have to reshape the series into a table, since trees work on rows of features rather than on ordered observations. Each row gets the value we want to predict plus a few of its own past values as columns.

```r title="Reshape the series into a lag table"
suppressPackageStartupMessages(library(randomForest))

y <- as.numeric(sales)
lagged <- data.frame(y     = y,
                     lag1  = c(NA, head(y, -1)),
                     lag12 = c(rep(NA, 12), head(y, -12)),
                     lag13 = c(rep(NA, 13), head(y, -13)))
lagged <- lagged[complete.cases(lagged), ]

head(lagged, 3)
#>        y  lag1 lag12 lag13
#> 14 17977 15028 16733 15136
#> 15 20008 17977 20016 16733
#> 16 21354 20008 17708 20016
c(usable_rows = nrow(lagged))
#> usable_rows 
#>         163
```

Each row now says: here is a month's sales, here is last month, here is the same month a year ago, and here is the month before that a year ago. `complete.cases()` drops the first 13 rows where those lags do not exist yet, leaving 163 usable rows.

Now train the forest on the first 48 rows and let it predict everything after.

```r title="Fit the forest and collect its errors"
set.seed(2026)
rf <- randomForest(y ~ lag1 + lag12 + lag13, data = lagged[1:48, ], ntree = 500)

rf_live <- lagged[49:nrow(lagged), ]
rf_live$point <- as.numeric(predict(rf, rf_live))
rf_live$err   <- rf_live$y - rf_live$point

round(head(rf_live[, c("y", "point", "err")], 4), 1)
#>        y   point     err
#> 62 21845 21712.7   132.3
#> 63 26488 26640.6  -152.6
#> 64 22394 24094.6 -1700.6
#> 65 28057 27219.7   837.3
```

`predict(rf, rf_live)` gives one number per month and nothing else. There is no `$lower` or `$upper` to ask for, because the forest has no theory of its own uncertainty. Everything we need is in the `err` column.

The conformal step is now literally identical to the one we ran on ETS. That is the point.

```r title="Wrap a conformal interval around the forest"
rf_idx <- (W + 1):nrow(rf_live)
rf_out <- data.frame(row = rf_idx, hit = NA, width = NA)

for (j in seq_along(rf_idx)) {
  k <- rf_idx[j]
  q <- conf_q(abs(rf_live$err[(k - W):(k - 1)]), alpha)
  rf_out$hit[j]   <- abs(rf_live$err[k]) <= q
  rf_out$width[j] <- 2 * q
}
c(forest_mae      = round(mean(abs(rf_live$err)), 1),
  forest_coverage = round(mean(rf_out$hit), 3),
  forest_width    = round(mean(rf_out$width), 0))
#>      forest_mae forest_coverage    forest_width 
#>         2647.30            0.96        21528.00
```

The interpretation: a model that offered no interval at all now has one covering 96.0% of months, from twelve lines of code that never once referenced how the forest works. Swap `randomForest` for any other point forecaster and not a single line of the conformal step changes.

Look at the width, though: 21,528 bottles against ETS's 16,598 under the identical procedure. The forest's average miss is 2,647 bottles while ETS's is 2,498 across its full audit, so the forest is genuinely the weaker model here, and the wider interval is a direct reading of that.

[KEY INSIGHT]
**Conformal prediction does not improve a weak model, it reports honestly on how weak it is.** A wide conformal interval is not a failure of the method, it is the method working: it measured your model against held-out data, and the held-out data says the model is imprecise. If you want a narrower interval, the only legitimate route is a better point forecast.

**Try it:** Confirm the comparison for yourself. Compute the ETS model's mean absolute error across its full audit and check it against the forest's 2,647.

```r title="Your turn: compare the two models mean absolute error"
ex_mae <- c(ets_mae = 0,      # your code here
            forest_mae = round(mean(abs(rf_live$err)), 1))

round(ex_mae, 1)
#> Expected: the ETS error slightly smaller than the forest error
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare mean absolute error solution"
ex_mae <- c(ets_mae    = mean(abs(audit$err)),
            forest_mae = mean(abs(rf_live$err)))

round(ex_mae, 1)
#>    ets_mae forest_mae 
#>     2497.7     2647.3
```

**Explanation:** ETS is about 6% more accurate on average, and its conformal interval is about 23% narrower. The gap in interval width is larger than the gap in average error because the conformal quantile responds to the worst recent misses, not to the average, and the forest's bad months are worse.

</details>

## How do you run conformal prediction with the conformalForecast package?

Building it by hand was the point of this page, because you now know exactly what every number means and where it can fail. For production work there is a package: `conformalForecast` by Xiaoqian Wang and Rob Hyndman, which implements classical conformal prediction, adaptive conformal prediction, conformal PID control, and the autocorrelated multistep method from their 2024 paper.

It is not available in this page's in-browser R, so run the block below in your own R session after `install.packages("conformalForecast")`. The output shown is real, captured from a local run against the same wine series.

```r-static title="Run split conformal with conformalForecast"
library(conformalForecast)
library(forecast)

sales <- wineind
etsfun <- function(x, h, level) forecast(ets(x), h = h, level = level)

fc <- cvforecast(sales, forecastfun = etsfun, h = 6, level = 95,
                 forward = TRUE, initial = 48, window = NULL)

scpfc <- scp(fc, symmetric = TRUE, ncal = 60, rolling = TRUE)
coverage(scpfc, level = 95)
#>       h=1       h=2       h=3       h=4       h=5       h=6 
#> 0.9411765 0.9393939 0.9218750 0.9516129 0.9333333 0.9482759

width(scpfc, level = 95)
#> Mean width:
#>      h=1      h=2      h=3      h=4      h=5      h=6 
#> 13793.47 13863.18 14139.54 14735.21 14291.46 14539.26
```

Three functions do the work. `cvforecast()` runs the rolling-origin loop we wrote by hand, calling your forecasting function at every origin. `scp()` performs split conformal prediction, where `ncal = 60` sets the calibration size and `rolling = TRUE` switches on the sliding window we built in the previous section. `coverage()` and `width()` then score the result.

The interpretation matters as a cross-check: the package reports 92% to 95% coverage at widths near 14,000, and our hand-rolled rolling window reported 97.1% at 16,598. Same ballpark, and the differences are explained by details we now understand, mainly that `scp()` recalibrates on a rolling basis from the first available origin rather than from a fixed cutoff. Because you built the method yourself, a discrepancy like that is a question you can answer instead of a black box you have to trust.

[NOTE]
**The package adds methods we did not build.** Beyond `scp()`, it offers `acp()` for adaptive conformal prediction, `pid()` for conformal PID control, and the autocorrelated multistep method that exploits a specific fact about forecast errors: optimal h-step errors are serially correlated up to lag h-1, so multistep intervals can be sharpened by modelling that correlation instead of ignoring it.

**Try it:** The package asks you to choose `ncal`. Use the rank rule to find the smallest calibration window that can produce a finite 95% interval from real error data, so you know the floor before you tune.

```r title="Your turn: find the smallest workable window"
ex_win <- rep(FALSE, length(10:25))   # your code here: is conf_q finite at each window?

data.frame(window = 10:25, finite = ex_win)
#> Expected: FALSE up to the floor, TRUE from there on
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smallest workable window solution"
ex_win <- sapply(10:25, function(w) is.finite(conf_q(abs(audit$err[1:w]), 0.05)))

min((10:25)[ex_win])
#> [1] 19
```

**Explanation:** 19, matching the algebra from the earlier section. Anything smaller and `conf_q()` returns `Inf`, which is the honest answer: with fewer than 19 held-out errors there is no finite 95% interval that the rank rule will vouch for. Set `ncal` well above the floor so the quantile is not pinned to your single worst observation.

</details>

## Complete Example: a reusable conformal_forecast() function

Here is everything on this page collapsed into one function you can point at any series and any point forecaster. It runs the rolling-origin audit, calibrates on the most recent errors at every horizon, and returns a forecast table with honest bounds.

```r title="A reusable conformal forecast function"
conformal_forecast <- function(y, model_fun, h = 1, alpha = 0.05,
                               start_at = 48, window = 40) {
  og   <- start_at:(length(y) - h)
  errs <- matrix(NA_real_, nrow = length(og), ncol = h)

  for (k in seq_along(og)) {                       # rolling-origin audit
    i <- og[k]
    errs[k, ] <- y[(i + 1):(i + h)] - model_fun(subset(y, end = i), h)
  }

  q     <- apply(abs(tail(errs, window)), 2, conf_q, alpha = alpha)  # recent errors only
  point <- model_fun(y, h)                                           # the real forecast

  data.frame(horizon = 1:h,
             point = round(point, 0),
             lower = round(point - q, 0),
             upper = round(point + q, 0),
             width = round(2 * q, 0))
}

base48 <- ets(subset(wineind, end = 48))
ets_frozen <- function(x, h)
  as.numeric(forecast(ets(x, model = base48, use.initial.values = TRUE), h = h)$mean)

conformal_forecast(wineind, ets_frozen, h = 6, alpha = 0.05)
#>   horizon point lower upper width
#> 1       1 25040 17711 32370 14660
#> 2       2 25617 18257 32978 14721
#> 3       3 31456 24045 38867 14822
#> 4       4 35029 27553 42505 14953
#> 5       5 19045 11616 26474 14858
#> 6       6 21560 13981 29138 15157
```

The `model_fun` argument is the whole design. It takes a series and a horizon and returns point forecasts, which means the forest from two sections ago, an ARIMA, a seasonal naive benchmark, or your own function all drop in without touching the conformal machinery. `tail(errs, window)` keeps only the most recent errors so the calibration stays current, and `apply(..., 2, conf_q)` calibrates each horizon on its own column.

[TIP]
**Keep the point forecaster behind a one-line adapter.** Anything that accepts a series and a horizon and returns a numeric vector of that length will work here, so switching from ETS to `auto.arima`, to `snaive`, or to the random forest is a change to `ets_frozen` alone. Keeping that boundary clean is what lets you swap models without ever revalidating the interval code.

Compare these bounds to the ETS output we started with. Back then the model claimed September 1994 would land between 20,464 and 29,013, a span of 8,549 bottles. The conformal version says between 17,711 and 32,370, a span of 14,660. That is the same forecast with the uncertainty told straight.

## Practice Exercises

### Exercise 1: Build a rolling 80% conformal interval end to end

Earlier the static 80% conformal interval covered only 44.1%. Rebuild it with a rolling 40-error window over the same test period (rows 61 onward of `audit`) and report the coverage and mean width. Use `my_` prefixed variables so you do not overwrite anything above.

```r title="Exercise 1 starter"
# Hint: same loop as the rolling-window section, but alpha = 0.20
my_alpha <- 0.20
my_W     <- 40
my_start <- 61

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Rolling 80 percent interval solution"
my_hits   <- logical(nrow(audit) - my_start + 1)
my_widths <- numeric(length(my_hits))

for (j in seq_along(my_hits)) {
  k    <- my_start + j - 1
  my_q <- conf_q(abs(audit$err[(k - my_W):(k - 1)]), my_alpha)
  my_hits[j]   <- abs(audit$err[k]) <= my_q
  my_widths[j] <- 2 * my_q
}

round(c(target = 0.80, coverage = mean(my_hits), mean_width = mean(my_widths)), 3)
#>     target   coverage mean_width 
#>      0.800      0.735   7966.192
```

**Explanation:** The rolling window lifts coverage from 44.1% to 73.5%, a huge repair, but it still falls short of 80%. Lower confidence levels are harder to hit with a sliding window because they depend on the middle of the error distribution, which moves around more than the tail does. This is a case for adaptive conformal inference rather than a longer window.

</details>

### Exercise 2: Diagnose a rolling window that under-covers

Apply per-horizon rolling conformal prediction to `AirPassengers` for horizons 1 to 3 at 95%, using the `err_a` matrix already in memory. Measure coverage with `W = 40`, then again with `W = 20`, and explain which wins and why.

```r title="Exercise 2 starter"
# Hint: for each horizon column, loop over rows (W+1):nrow(err_a) and use
# conf_q on the previous W absolute errors in that same column

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Window comparison on AirPassengers solution"
for (my_Wv in c(20, 40)) {
  my_rows <- (my_Wv + 1):nrow(err_a)
  my_cv <- sapply(1:3, function(hh)
    mean(sapply(my_rows, function(k)
      abs(err_a[k, hh]) <= conf_q(abs(err_a[(k - my_Wv):(k - 1), hh]), 0.05))))
  cat("W =", my_Wv, " coverage:", round(my_cv, 3), "\n")
}
#> W = 20  coverage: 0.915 0.915 0.901 
#> W = 40  coverage: 0.863 0.784 0.824
```

**Explanation:** The shorter window wins clearly, about 91% against 78% to 86%. Airline passenger volumes roughly tripled over the sample, so the model's errors grow fast, and a 40-month memory is still full of errors from a much smaller airline industry. On a rapidly drifting series a short window is not noisier in any way that matters, it is simply more current. Neither window reaches 95%, which tells you the frozen model itself needs refitting.

</details>

### Exercise 3: Give the interval two different sides

Every interval so far has been symmetric, using a single quantile of absolute errors. That is wasteful when a model misses harder in one direction than the other. Build an asymmetric 90% interval that calibrates the upper and lower offsets separately from the signed errors, using a rolling 40-error window, and compare its coverage and width to the symmetric version.

```r title="Exercise 3 starter"
# Hint: for a two-sided (1 - alpha) interval, spend alpha/2 on each side.
# Upper offset: conf_q(e, alpha/2) on the signed errors.
# Lower offset: conf_q(-e, alpha/2) on the negated signed errors.
my_alpha <- 0.10
my_W     <- 40

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Asymmetric conformal interval solution"
my_rows <- (my_W + 1):nrow(audit)
my_sym_hit <- my_asym_hit <- logical(length(my_rows))
my_sym_w   <- my_asym_w   <- numeric(length(my_rows))

for (j in seq_along(my_rows)) {
  k  <- my_rows[j]
  my_e <- audit$err[(k - my_W):(k - 1)]
  my_qs <- conf_q(abs(my_e), my_alpha)              # symmetric
  my_qu <- conf_q(my_e, my_alpha / 2)               # upper side
  my_qd <- conf_q(-my_e, my_alpha / 2)              # lower side
  my_sym_hit[j]  <- abs(audit$err[k]) <= my_qs
  my_sym_w[j]    <- 2 * my_qs
  my_asym_hit[j] <- audit$err[k] <= my_qu && audit$err[k] >= -my_qd
  my_asym_w[j]   <- my_qu + my_qd
}

round(c(symmetric_coverage  = mean(my_sym_hit),  symmetric_width  = mean(my_sym_w),
        asymmetric_coverage = mean(my_asym_hit), asymmetric_width = mean(my_asym_w)), 3)
#>  symmetric_coverage     symmetric_width asymmetric_coverage    asymmetric_width 
#>               0.864           10250.517               0.898           10785.130
```

**Explanation:** The asymmetric interval hits 89.8% against a 90% target while the symmetric one manages 86.4%, and it costs only 5% extra width. Splitting the budget lets each side find its own quantile, so a model that overshoots and undershoots by different amounts gets bounds that reflect that. The cost is that each side now calibrates on half the error budget, so you need a larger window before the tails are estimated reliably.

</details>

## Frequently Asked Questions

### Does conformal prediction work with ARIMA, Prophet, or a neural network?

Yes, and nothing in the recipe changes. The method needs a column of held-out errors and nothing else, so any function that takes a series and a horizon and returns numbers drops into the `model_fun` slot of `conformal_forecast()`. The random forest section is the proof: the same dozen lines wrapped an interval around a model that has no interval theory of its own.

### How many calibration errors do I actually need?

For a 95% interval the hard floor is 19, because the rank rule asks for a sorted position that has to exist: with 19 scores it asks for the 19th, and with 18 it asks for a 19th that is not there. Sitting at the floor is a bad idea anyway, because the interval is then set by your single largest calibration error and jumps around whenever that error changes. Aim for several times the floor, and on a drifting series prefer a rolling window of roughly 40 recent errors to a long fixed one.

### Is this the same as a bootstrap prediction interval?

No. A bootstrap interval resamples past residuals and simulates many possible futures through the model, so it still relies on the model being right about how errors propagate forward. Conformal prediction skips the simulation and reads a quantile straight off the errors the model actually made. Both deserve the rolling-origin audit from the first section, because only the audit tells you which one covers on your series.

### Does conformal prediction make my forecast more accurate?

No. The point forecast is untouched, and only the interval around it changes. If the interval comes out wider than you expected, that is a measurement of the model you already had rather than a penalty the method imposes, and the only way to narrow it honestly is a better point forecast.

### Why is my conformal interval the same width for every future month?

Because the absolute error score gives every future point the same treatment: one quantile, one half-width. That is reasonable when the model is equally accurate everywhere in the series, and wrong when it is not, for example if December is always harder to forecast than July. The two standard repairs are to divide each error by a predicted scale before taking the quantile, or to calibrate around a quantile regression instead, which is the conformalized quantile regression of Romano and colleagues listed in the references.

### My coverage is still below target. What should I check first?

Drift, because it is the usual cause. Split the errors into consecutive blocks and compare their averages, exactly as the exchangeability section does; if the later blocks are larger, a fixed calibration set is describing an accuracy the model no longer has, and a rolling window plus the adaptive alpha update recovers most of the gap. If the blocks look similar, check that your calibration set is comfortably above the floor and that you used the rank rule rather than `quantile()`.

## Summary

![The four decisions behind every conformal forecast interval](screenshots/Conformal-Prediction-in-R-overview.webp)

*Figure 3: The four decisions behind every conformal forecast interval.*

Every number below was measured on the wine sales series. The first four rows share the same ETS model and the same 68 held-out months, so they compare directly. The forest row uses a different model over a slightly longer span of months, so read it as a demonstration that the method attaches to anything, not as a like-for-like contest.

| Method | What it fixes | Measured coverage | Mean width |
|---|---|---|---|
| ETS parametric interval | Nothing, it is the baseline | 0.779 | 9,120 |
| Split conformal, fixed calibration | Drops the normality assumption | 0.853 | 10,342 |
| Rolling calibration window | Drops the stale-calibration problem | 0.971 | 16,598 |
| Adaptive conformal inference | Steers coverage back to target | 0.956 | 15,391 |
| Conformal around a random forest | Gives an interval to a model that had none | 0.960 | 21,528 |

The takeaways worth keeping:

1. **Audit before you trust.** A nominal 95% interval covered 84% of months on an ordinary commercial series with a sensible model. One rolling-origin loop tells you where you stand.
2. **The recipe is four lines.** Held-out absolute errors, sort, take rank $\lceil (n+1)(1-\alpha) \rceil$, add and subtract. There is nothing else to it.
3. **Use the rank, never `quantile()`.** The interpolating version under-covered by nearly four points in a controlled simulation, and the gap is worst exactly when calibration sets are small.
4. **Measure whether your errors grow with the horizon.** From one month ahead to six, they grew 78% on airline passengers and stayed flat on wine sales. Calibrating per horizon is right either way.
5. **Exchangeability is what breaks on time series.** Errors on this series grew 2.4 times from the first quarter of the sample to the last, which is why fixed-calibration conformal reached only 85%.
6. **A rolling window plus adaptive alpha is the working recipe.** Together they delivered 95.6% coverage at a narrower width than the rolling window alone.
7. **Conformal is the only interval available for most machine learning forecasters.** It attaches to any point forecast, and when the model is weak it tells you so with a wider interval rather than hiding it.

## References

1. Vovk, V., Gammerman, A., & Shafer, G. *Algorithmic Learning in a Random World*, 2nd Edition. Springer (2022). The foundational text on conformal prediction. [Link](https://link.springer.com/book/10.1007/978-3-031-06649-8)
2. Shafer, G., & Vovk, V. A Tutorial on Conformal Prediction. *Journal of Machine Learning Research*, 9, 371-421 (2008). [Link](https://jmlr.csail.mit.edu/papers/volume9/shafer08a/shafer08a.pdf)
3. Lei, J., G'Sell, M., Rinaldo, A., Tibshirani, R. J., & Wasserman, L. Distribution-Free Predictive Inference for Regression. *Journal of the American Statistical Association*, 113(523), 1094-1111 (2018). The split conformal method used throughout this page. [Link](https://arxiv.org/abs/1604.04173)
4. Gibbs, I., & Candes, E. Adaptive Conformal Inference Under Distribution Shift. *NeurIPS* (2021). The source of the alpha update rule in the adaptive section. [Link](https://arxiv.org/abs/2106.00170)
5. Wang, X., & Hyndman, R. J. Online conformal inference for multi-step time series forecasting. arXiv:2410.13115 (2024). Establishes that optimal h-step errors are serially correlated up to lag h-1, and introduces the AcMCP method. [Link](https://arxiv.org/abs/2410.13115)
6. conformalForecast: Conformal Prediction Methods for Multistep-Ahead Time Series Forecasting. CRAN package documentation. [Link](https://cran.r-project.org/package=conformalForecast)
7. Romano, Y., Patterson, E., & Candes, E. Conformalized Quantile Regression. *NeurIPS* (2019). How to make conformal interval widths vary with the input rather than staying constant. [Link](https://arxiv.org/abs/1905.03222)
8. Hyndman, R. J., & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd Edition. OTexts (2021). Chapter 5.5 covers parametric prediction intervals and the assumptions this page tests. [Link](https://otexts.com/fpp3/prediction-intervals.html)

## Continue Learning

- [Gradient Boosting for Time Series in R](XGBoost-Forecasting-in-R.html) builds the boosted-tree forecaster that most needs a conformal interval, since it returns a point forecast and nothing else.
- [Global Forecasting Models in R](Global-Forecasting-Models-in-R.html) trains one model across many series at once, which gives you a much larger pool of calibration errors to conformalize with.
- [Feature Engineering for Forecasting in R](Feature-Engineering-for-Forecasting-in-R.html) goes deeper on the lag table we built for the random forest, including rolling statistics and calendar features.
