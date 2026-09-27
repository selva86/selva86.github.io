---
title: "Multivariate Time Series Lesson 6: Forecasting multiple related series"
slug: "Forecasting-Multiple-Related-Series"
description: "Turn a fitted VECM into 8-quarter forecasts with vec2var() and predict(), then test on rolling origins whether the system beats forecasting each series alone."
keywords: "forecasting multiple time series, VECM forecast, vec2var, predict, cointegration, Johansen test, rolling origin evaluation, RMSE, prediction intervals, vars package, R"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-multivariate"
course_title: "Multivariate Time Series"
course_lesson: "6"
course_total: "6"
course_landing: "Multivariate-Time-Series-Course.html"
course_prev: "Cointegration-and-the-VECM.html"
course_next: ""
curriculum_id: "5.110.6"
lesson_access: "pro"
catalog_blurb: "Find out when forecasting related series together beats forecasting each one alone."
---

=== step === cover
## Forecasting multiple related series

Today let's understand how to forecast three related series together, and how to check whether that is better than forecasting each one alone.

Let's say you are an analyst who has to forecast the next 8 quarters of Canadian employment (e), labour productivity (prod) and real wage (rw). You have 84 quarters of each, from 1980 Q1 to 2000 Q4, and all three series trend upward over that period.

The three series are related, so you can fit one model for the whole system and forecast all of them together. But a system model needs more machinery than a forecast of each series on its own. So the question is whether that extra machinery is worth its cost.

The answer has four parts.

::widget process-flow {"steps":[{"title":"Fit the system","sub":"Johansen test and error-correction fit"},{"title":"Convert with vec2var()","sub":"a form that can forecast"},{"title":"Forecast with predict()","sub":"8 quarters, 95% intervals"},{"title":"Compare with each series alone","sub":"27 rolling origins"}]}

That is the whole plan. Everything from here on fills in one of the four boxes, using these three series.

=== step === concept
## Three related series and what cointegration means

Let's start by looking at the data. The `Canada` data set in the `vars` package holds four quarterly series, and we use three of them: `e` is employment, `prod` is labour productivity and `rw` is the real wage. Each series is 100 times the natural log of an OECD series, so a change of 1 is close to a 1% change.

Press Run.

```r
# Load the three Canadian series, plot them and print their span and range
library(vars)
data(Canada)
x <- Canada[, c("e", "prod", "rw")]
plot(x, main = "Canadian employment, productivity and real wage")

dim(x)
#> [1] 84  3
start(x)
#> [1] 1980    1
end(x)
#> [1] 2000    4
round(rbind(min = apply(x, 2, min), max = apply(x, 2, max)), 1)
#>         e  prod    rw
#> min 928.6 401.3 386.1
#> max 961.8 418.0 470.0
```

The plot shows all three series climbing over the 84 quarters. The table gives the lowest and highest value of each: employment ranges from 928.6 to 961.8, productivity from 401.3 to 418.0, and the real wage from 386.1 to 470.0.

A series whose average level keeps moving like this is called **non-stationary**. It has no fixed level that it keeps returning to. A stationary series, in contrast, stays around one fixed level with a steady spread.

Now here is the idea behind this whole lesson. Three non-stationary series can still be tied together. A weighted sum of their levels is a number times e, plus a number times prod, plus a number times rw. If some weighted sum like that is stationary, the series are called **cointegrated**. Each series moves up and down without returning to a fixed level, but the weighted sum stays around one fixed level.

That tie is information about where each series goes next, and a forecast of one series on its own never uses it. The Johansen test is built to check for exactly this setup.

=== step === concept
## Counting the long-run relations with the Johansen trace test

The Johansen test counts how many stationary weighted sums exist among the series. Each one is called a **cointegrating relation**, and the count is the **rank**, written r. With r = 0 no weighted sum is stationary, and with r = 1 exactly one is.

The test is run with `ca.jo()` from the `urca` package, which `vars` loads for us. Four of its arguments matter here:

- `type = "trace"` uses the trace statistic, which tests the rank one row at a time.
- `K = 2` fits a VAR (vector autoregression) of order 2 in levels, meaning the series as recorded rather than as quarter-to-quarter changes. Each series is regressed on the last 2 quarters of all three series.
- `ecdet = "const"` puts a constant inside the long-run relation.
- `spec = "transitory"` builds the relation from the previous quarter's levels.

The code below stores each test statistic beside its 5% critical value.

```r
# Run the Johansen trace test and set each statistic beside its 5% critical value
j <- ca.jo(x, type = "trace", ecdet = "const", K = 2, spec = "transitory")
trace_table <- cbind(statistic = j@teststat, critical_5pct = j@cval[, "5pct"])
round(trace_table, 2)
#>          statistic critical_5pct
#> r <= 2 |      6.59          9.24
#> r <= 1 |     17.03         19.96
#> r = 0  |     71.89         34.91
```

Each row tests a null hypothesis about the rank, and a statistic above its critical value rejects it. We read the rows from the bottom, starting with r = 0.

The r = 0 row tests whether there are no cointegrating relations. Its statistic 71.89 is above the critical value 34.91, so we reject r = 0. The r <= 1 row tests whether there is at most 1 relation. Its statistic 17.03 is below 19.96, so we cannot reject it.

We stop at the first row we cannot reject. That leaves r = 1: one long-run relation among employment, productivity and the real wage.

=== step === concept
## The long-run relation and the adjustment coefficients

With r = 1 settled, `cajorls()` fits the model in its error-correction form, called a VECM (vector error correction model). It has one equation per series, and the quarterly change of that series sits on the left:

\[\Delta y_t = \alpha \, \mathrm{ECT}_{t-1} + \Gamma \, \Delta y_{t-1}\]

Here \(\Delta y_t\) holds the 3 quarterly changes, each one this quarter's level minus last quarter's, and \(\Gamma\) holds the coefficients on last quarter's changes. The **error-correction term**, ECT, is the stationary weighted sum found by the test, evaluated at last quarter's levels. And \(\alpha\) holds one coefficient per series, called the **adjustment coefficient**. It says how strongly the ECT feeds into that series' next change.

The code below prints the weights of the long-run relation, the adjustment coefficients and the ECT at the last quarter.

```r
# Fit the error-correction form with one long-run relation and read beta, alpha and the current ECT
cr <- cajorls(j, r = 1)
beta <- cr$beta[, 1]
alpha <- cr$rlm$coefficients["ect1", ]

last_obs <- c(x[nrow(x), ], constant = 1)
ect_now <- sum(beta * last_obs)

round(beta, 3)
#>     e.l1  prod.l1    rw.l1 constant
#>    1.000   -0.236   -0.558 -591.616
round(alpha, 3)
#>    e.d prod.d   rw.d
#>  0.012 -0.010  0.118
round(ect_now, 2)
#> [1] 9.75
round(alpha * ect_now, 2)
#>    e.d prod.d   rw.d
#>   0.12  -0.10   1.15
```

The weights in `beta` define the relation: \(e - 0.236\,prod - 0.558\,rw - 591.6\). Putting the 2000 Q4 levels into it, with the weights unrounded, gives an ECT of 9.75.

The adjustment coefficients are 0.012 for e, -0.010 for prod and 0.118 for rw. Multiplying each by the ECT gives the part of that series' next quarterly change that comes from the ECT: 0.12 for e, -0.10 for prod and 1.15 for rw.

So only the rw equation gets a large push from the ECT. Hold on to that 1.15, because it explains the results at the end of this lesson.

=== step === concept
## Rewriting the VECM as a level VAR with vec2var()

The object `ca.jo()` returns can be printed, summarised and plotted, but it has no forecasting method. The `predict()` function in `vars` works on equations written in levels, where each series this quarter is a constant plus weights on the last 2 quarters of all three series:

\[y_t = c + A_1 \, y_{t-1} + A_2 \, y_{t-2}\]

Here \(y_t\) holds the 3 levels in quarter t. `vec2var(j, r = 1)` rewrites the fitted VECM in that form and returns the matrices \(A_1\) and \(A_2\) and the constant \(c\). It changes the form of the model, not the fit, so both forms must give the same forecast.

Let's check that for one quarter ahead. The code below forecasts 2001 Q1 three ways: with the VECM equations by hand, with \(A_1\) and \(A_2\) by hand, and with `predict()`.

```r
# Forecast one quarter ahead three ways and compare them
v <- vec2var(j, r = 1)
one_step <- predict(v, n.ahead = 1)

# 1. The VECM equations: last level + alpha * ECT + terms on the last quarter's changes
gamma <- cr$rlm$coefficients[-1, ]
last_change <- x[nrow(x), ] - x[nrow(x) - 1, ]
short_run <- drop(t(gamma) %*% last_change)
vecm_by_hand <- x[nrow(x), ] + alpha * ect_now + short_run

# 2. The level VAR: A1 and A2 applied to the last two quarters, plus the constant
level_by_hand <- drop(v$A$A1 %*% x[nrow(x), ] + v$A$A2 %*% x[nrow(x) - 1, ] + v$deterministic[, 1])

# 3. predict() on the vec2var object
from_predict <- sapply(one_step$fcst, function(m) m[1, "fcst"])

round(rbind(vecm_by_hand, level_by_hand, from_predict), 2)
#>                    e   prod     rw
#> vecm_by_hand  962.23 417.13 470.48
#> level_by_hand 962.23 417.13 470.48
#> from_predict  962.23 417.13 470.48

# The rw forecast split into its three parts
round(c(last_level = unname(x[nrow(x), "rw"]), from_ect = unname(alpha["rw.d"] * ect_now),
        from_changes = unname(short_run["rw.d"])), 2)
#>   last_level     from_ect from_changes
#>       469.65         1.15        -0.32
```

All three rows agree to 2 decimals: 962.23 for e, 417.13 for prod and 470.48 for rw.

The last output splits the rw forecast into its parts. It starts from the last level, 469.65, adds 1.15 from alpha times the ECT and subtracts 0.32 from the terms on last quarter's changes. That gives 470.48.

=== step === concept
## Forecasting eight quarters with predict()

Now let's produce the forecast itself. The call `predict(v, n.ahead = 8, ci = 0.95)` runs the level equations forward: the forecast for 2001 Q1 feeds the forecast for 2001 Q2, and so on for 8 quarters. The horizon **h** is the number of quarters ahead, so h = 1 is 2001 Q1 and h = 8 is 2002 Q4. The argument `ci = 0.95` also asks for 95% intervals.

The result holds one table per series in `p$fcst`. The code below prints the rows for h = 1, 4 and 8, and the ratio of the h = 8 interval half-width to the h = 1 one.

```r
# Forecast 8 quarters ahead with 95% intervals and print horizons 1, 4 and 8
p <- predict(v, n.ahead = 8, ci = 0.95)

horizons <- c(1, 4, 8)
lapply(p$fcst, function(m) {
  rows <- round(m[horizons, ], 2)
  rownames(rows) <- paste("h =", horizons)
  rows
})
#> $e
#>         fcst  lower  upper   CI
#> h = 1 962.23 961.49 962.98 0.75
#> h = 4 963.20 959.99 966.41 3.21
#> h = 8 964.17 957.55 970.80 6.62
#>
#> $prod
#>         fcst  lower  upper   CI
#> h = 1 417.13 415.80 418.47 1.34
#> h = 4 417.24 413.71 420.78 3.54
#> h = 8 417.37 411.70 423.04 5.67
#>
#> $rw
#>         fcst  lower  upper   CI
#> h = 1 470.48 469.02 471.94 1.46
#> h = 4 473.24 470.45 476.02 2.79
#> h = 8 476.76 473.24 480.27 3.52
#>

# How much wider is the interval at h = 8 than at h = 1?
round(sapply(p$fcst, function(m) m[8, "CI"] / m[1, "CI"]), 1)
#>    e.CI prod.CI   rw.CI
#>     8.9     4.2     2.4
```

Each table has four columns. `fcst` is the point forecast, `lower` and `upper` are the ends of the 95% interval, and `CI` is the half-width of that interval, which is `upper` minus `fcst`. An interval built this way should contain the actual value about 95 times in 100 forecasts.

The forecast for e rises from 962.23 at h = 1 to 964.17 at h = 8, while its half-width grows from 0.75 to 6.62. For rw the forecast rises from 470.48 to 476.76, and its half-width grows from 1.46 to 3.52.

Now look at the last output. From h = 1 to h = 8 the half-width grows 8.9 times for e, 4.2 times for prod and only 2.4 times for rw. So the half-width of the rw interval grows much more slowly than the others.

The fan chart draws the same forecasts after the history of each series.

```r
# Draw the forecast paths and their intervals as a fan chart
fanchart(p)
```

The shaded band grows with the horizon for each series, and it is much thinner for rw than for e and prod.

=== step === concept
## Evaluating forecasts with a rolling origin

A forecast that looks reasonable does not tell us whether the system is better than forecasting each series alone. For that we need to score forecasts against values that were not used to fit the model, and give every method the same forecasts to make.

A **rolling-origin evaluation** does that. The **origin** t is the last quarter used for fitting. We fit on quarters 1 to t, forecast quarters t + 1 to t + 8, and keep the error, which is the actual value minus the forecast. Then we move the origin forward by one quarter and repeat. With 84 quarters and a horizon of 8, the last origin that still leaves 8 quarters to test is t = 76. We start at t = 50 so that the first fit uses 50 quarters, which gives origins t = 50 to t = 76, or 27 origins.

The code below draws the 27 origins. The grey bar is the training window and the green bar is the 8-quarter test window.

```r
# Draw the 27 rolling origins: the training window and the 8-quarter test window of each
library(ggplot2)
origin_ids <- 50:76

windows <- rbind(
  data.frame(origin = origin_ids, start = 1, end = origin_ids, window = "training"),
  data.frame(origin = origin_ids, start = origin_ids + 1, end = origin_ids + 8, window = "test")
)

ggplot(windows, aes(x = start, xend = end, y = origin, yend = origin, colour = window)) +
  geom_segment(linewidth = 2) +
  scale_colour_manual(values = c(training = "grey60", test = "#1f7a55")) +
  labs(x = "quarter (1 = 1980 Q1)", y = "origin t")
```

At each origin we fit and forecast with three methods:

1. **system**: the chain of `ca.jo()`, `vec2var()` and `predict()`, redone in every window. The trace test is repeated in each window, so the code also records the rank it finds.
2. **alone**: for each series, an ARIMA(1,1,0) with drift from the `forecast` package. It models the quarterly change of one series as a constant plus a coefficient times the previous quarterly change. We use the same order for all three series, and each one is forecast without using the other two.
3. **VAR of changes**: a VAR of order 1 fitted to the quarterly changes of the three series, with the forecast changes added up onto the last level. It models the series jointly but has no error-correction term, so comparing it with the system shows what that term adds.

Every forecast is scored with the **RMSE**, the root mean squared error: square each error, average the squares over the 27 origins, then take the square root. We compute it for each horizon h and each series. It is in the units of the series, and since each series is 100 times a log, an RMSE of 1 is close to a 1% error.

The loop below runs the three methods at all 27 origins. It stores the errors and the interval half-widths in arrays with 3 dimensions: origin, horizon and series.

```r
# Refit all three methods at each of the 27 origins and store the forecast errors and interval half-widths
library(forecast)
series <- c("e", "prod", "rw")
new_array <- function() {
  array(NA_real_, dim = c(27, 8, 3),
        dimnames = list(origin = origin_ids, horizon = 1:8, series = series))
}
err_sys <- new_array()
err_alone <- new_array()
err_diff <- new_array()
w_sys <- new_array()
w_alone <- new_array()
rank_found <- integer(27)

for (i in seq_along(origin_ids)) {
  origin <- origin_ids[i]
  train <- x[1:origin, ]
  actual <- x[(origin + 1):(origin + 8), ]

  # System: Johansen test, vec2var, predict
  j_t <- ca.jo(train, type = "trace", ecdet = "const", K = 2, spec = "transitory")
  # The rank is the number of rejections in a row, starting from r = 0
  rank_found[i] <- sum(cumprod(rev(j_t@teststat > j_t@cval[, "5pct"])))
  p_t <- predict(vec2var(j_t, r = 1), n.ahead = 8, ci = 0.95)

  # VAR of the quarterly changes, summed back onto the last level
  p_d <- predict(VAR(diff(train), p = 1), n.ahead = 8)

  for (s in series) {
    fc_sys <- p_t$fcst[[s]]
    err_sys[i, , s] <- actual[, s] - fc_sys[, "fcst"]
    w_sys[i, , s] <- fc_sys[, "CI"]

    # Each series alone: ARIMA(1,1,0) with drift
    fc_alone <- forecast(Arima(train[, s], order = c(1, 1, 0), include.drift = TRUE),
                         h = 8, level = 95)
    err_alone[i, , s] <- actual[, s] - fc_alone$mean
    w_alone[i, , s] <- fc_alone$upper[, 1] - fc_alone$mean

    path_diff <- train[origin, s] + cumsum(p_d$fcst[[s]][, "fcst"])
    err_diff[i, , s] <- actual[, s] - path_diff
  }
}

table(rank_found)
#> rank_found
#>  1
#> 27
```

Press Run and give it a moment, because it refits every method 27 times.

Look at `err_sys[11, 8, "rw"]`. It is the error of the system forecast for rw at h = 8, from the 11th origin, which is t = 60. The last output counts the rank found by the trace test in each window. The rank line in the loop counts rejections in a row: `rev()` puts the r = 0 row first, and `cumprod()` turns the first row we cannot reject, and every row after it, into 0, so the sum is the rank. It is r = 1 in all 27 windows, so fitting r = 1 in every window agrees with the test.

=== step === concept
## RMSE by horizon: which series does the system help?

The code below computes the RMSE of each method at h = 1, 4 and 8, and the ratio of the system RMSE to the alone RMSE at every horizon.

```r
# Compute RMSE by horizon for each method and the system-over-alone ratio
rmse <- function(err) sqrt(apply(err^2, c(2, 3), mean))
rmse_sys <- rmse(err_sys)
rmse_alone <- rmse(err_alone)
rmse_diff <- rmse(err_diff)
ratio <- rmse_sys / rmse_alone

list(system = round(rmse_sys[horizons, ], 2),
     alone = round(rmse_alone[horizons, ], 2),
     diff_var = round(rmse_diff[horizons, ], 2))
#> $system
#>        series
#> horizon    e prod   rw
#>       1 0.28 0.64 0.73
#>       4 1.14 1.82 1.52
#>       8 2.71 3.26 2.16
#>
#> $alone
#>        series
#> horizon    e prod   rw
#>       1 0.30 0.64 0.85
#>       4 1.07 1.77 3.06
#>       8 1.91 3.04 6.08
#>
#> $diff_var
#>        series
#> horizon    e prod   rw
#>       1 0.27 0.63 0.82
#>       4 0.90 1.67 2.80
#>       8 1.67 2.81 5.63
#>
round(ratio, 2)
#>        series
#> horizon    e prod   rw
#>       1 0.92 1.00 0.86
#>       2 0.89 1.01 0.71
#>       3 0.97 1.02 0.60
#>       4 1.06 1.03 0.49
#>       5 1.19 1.04 0.42
#>       6 1.30 1.05 0.38
#>       7 1.36 1.06 0.36
#>       8 1.42 1.07 0.36
```

Read the first two tables side by side. For e at h = 8 the system RMSE is 2.71 and the alone RMSE is 1.91. For prod it is 3.26 against 3.04. For rw it is 2.16 against 6.08.

The ratio is the system RMSE divided by the alone RMSE. A ratio below 1 means the system forecast has the smaller error, and a ratio above 1 means the alone forecast has. At h = 8 the ratios are 1.42 for e, 1.07 for prod and 0.36 for rw. So at 8 quarters ahead the system RMSE for rw is about a third of the alone RMSE, while for e and prod it is larger.

The third table separates two things. The VAR of changes models the three series jointly but has no error-correction term. At h = 8 its RMSE for rw is 5.63, hardly better than the 6.08 of rw alone. Adding the error-correction term brings it down to 2.16. So it is the long-run relation, not the joint modelling on its own, that helps rw.

=== step === widget
## Interval width and coverage of the 95% intervals

RMSE scores the point forecasts, but every forecast also comes with an interval. That interval should be narrow, and it should still contain the actual value about 95 times in 100. So we compare two things: the mean half-width of the intervals, and the **coverage**, which is the share of actual values that fall inside their interval. An actual value is inside when the absolute error is at most the half-width.

The code below computes both from the arrays the loop stored.

```r
# Compare interval half-width at h = 8 and the share of actual values inside the 95% intervals
half_width_h8 <- rbind(system = colMeans(w_sys[, 8, ]), alone = colMeans(w_alone[, 8, ]))
round(half_width_h8, 2)
#>           e prod   rw
#> system 7.13 5.49 3.39
#> alone  6.76 5.27 8.34

inside_sys <- abs(err_sys) <= w_sys
inside_alone <- abs(err_alone) <= w_alone
coverage <- rbind(system = apply(inside_sys, 3, mean), alone = apply(inside_alone, 3, mean))
round(100 * coverage, 1)
#>          e prod   rw
#> system 100 93.1 94.9
#> alone  100 92.6 97.7
```

At h = 8 the mean half-width for rw drops from 8.34 alone to 3.39 with the system. For e it goes the other way, from 6.76 to 7.13, and for prod from 5.27 to 5.49.

Coverage is pooled over h = 1 to 8 and the 27 origins, which is 216 forecasts per series. Those forecasts overlap, because neighbouring origins share most of their data, so read the percentages as about 95% and not as exact figures. The system intervals for rw cover 94.9% of the actual values, close to the 95% they are built for. The rw alone intervals cover 97.7%, which is above 95%, so those intervals are wider than 95% requires. For e both methods cover 100%, and for prod they cover 93.1% and 92.6%.

The widget below shows the 27 half-widths at h = 8, one per origin, for each series and method. It carries the 162 half-widths from the arrays above: 27 origins, 3 series and 2 methods. Each label names the series first and the method second.

::widget chart-plotter {"data":[{"x":50,"y":7.69,"fill":"e system"},{"x":51,"y":7.61,"fill":"e system"},{"x":52,"y":7.53,"fill":"e system"},{"x":53,"y":7.49,"fill":"e system"},{"x":54,"y":7.40,"fill":"e system"},{"x":55,"y":7.33,"fill":"e system"},{"x":56,"y":7.29,"fill":"e system"},{"x":57,"y":7.27,"fill":"e system"},{"x":58,"y":7.40,"fill":"e system"},{"x":59,"y":7.45,"fill":"e system"},{"x":60,"y":7.29,"fill":"e system"},{"x":61,"y":7.19,"fill":"e system"},{"x":62,"y":7.10,"fill":"e system"},{"x":63,"y":7.03,"fill":"e system"},{"x":64,"y":7.00,"fill":"e system"},{"x":65,"y":6.93,"fill":"e system"},{"x":66,"y":6.87,"fill":"e system"},{"x":67,"y":6.85,"fill":"e system"},{"x":68,"y":6.78,"fill":"e system"},{"x":69,"y":6.87,"fill":"e system"},{"x":70,"y":6.85,"fill":"e system"},{"x":71,"y":7.02,"fill":"e system"},{"x":72,"y":6.90,"fill":"e system"},{"x":73,"y":6.82,"fill":"e system"},{"x":74,"y":6.81,"fill":"e system"},{"x":75,"y":6.84,"fill":"e system"},{"x":76,"y":6.92,"fill":"e system"},{"x":50,"y":7.43,"fill":"e alone"},{"x":51,"y":7.36,"fill":"e alone"},{"x":52,"y":7.27,"fill":"e alone"},{"x":53,"y":7.20,"fill":"e alone"},{"x":54,"y":7.14,"fill":"e alone"},{"x":55,"y":7.05,"fill":"e alone"},{"x":56,"y":6.99,"fill":"e alone"},{"x":57,"y":6.93,"fill":"e alone"},{"x":58,"y":6.93,"fill":"e alone"},{"x":59,"y":6.98,"fill":"e alone"},{"x":60,"y":6.90,"fill":"e alone"},{"x":61,"y":6.82,"fill":"e alone"},{"x":62,"y":6.81,"fill":"e alone"},{"x":63,"y":6.71,"fill":"e alone"},{"x":64,"y":6.66,"fill":"e alone"},{"x":65,"y":6.60,"fill":"e alone"},{"x":66,"y":6.56,"fill":"e alone"},{"x":67,"y":6.52,"fill":"e alone"},{"x":68,"y":6.48,"fill":"e alone"},{"x":69,"y":6.48,"fill":"e alone"},{"x":70,"y":6.44,"fill":"e alone"},{"x":71,"y":6.49,"fill":"e alone"},{"x":72,"y":6.38,"fill":"e alone"},{"x":73,"y":6.33,"fill":"e alone"},{"x":74,"y":6.32,"fill":"e alone"},{"x":75,"y":6.31,"fill":"e alone"},{"x":76,"y":6.28,"fill":"e alone"},{"x":50,"y":5.31,"fill":"prod system"},{"x":51,"y":5.29,"fill":"prod system"},{"x":52,"y":5.25,"fill":"prod system"},{"x":53,"y":5.20,"fill":"prod system"},{"x":54,"y":5.29,"fill":"prod system"},{"x":55,"y":5.17,"fill":"prod system"},{"x":56,"y":5.14,"fill":"prod system"},{"x":57,"y":5.56,"fill":"prod system"},{"x":58,"y":5.81,"fill":"prod system"},{"x":59,"y":5.87,"fill":"prod system"},{"x":60,"y":5.76,"fill":"prod system"},{"x":61,"y":5.69,"fill":"prod system"},{"x":62,"y":5.65,"fill":"prod system"},{"x":63,"y":5.61,"fill":"prod system"},{"x":64,"y":5.59,"fill":"prod system"},{"x":65,"y":5.52,"fill":"prod system"},{"x":66,"y":5.46,"fill":"prod system"},{"x":67,"y":5.58,"fill":"prod system"},{"x":68,"y":5.62,"fill":"prod system"},{"x":69,"y":5.57,"fill":"prod system"},{"x":70,"y":5.52,"fill":"prod system"},{"x":71,"y":5.50,"fill":"prod system"},{"x":72,"y":5.54,"fill":"prod system"},{"x":73,"y":5.46,"fill":"prod system"},{"x":74,"y":5.42,"fill":"prod system"},{"x":75,"y":5.44,"fill":"prod system"},{"x":76,"y":5.42,"fill":"prod system"},{"x":50,"y":5.25,"fill":"prod alone"},{"x":51,"y":5.24,"fill":"prod alone"},{"x":52,"y":5.19,"fill":"prod alone"},{"x":53,"y":5.14,"fill":"prod alone"},{"x":54,"y":5.19,"fill":"prod alone"},{"x":55,"y":5.04,"fill":"prod alone"},{"x":56,"y":4.99,"fill":"prod alone"},{"x":57,"y":5.33,"fill":"prod alone"},{"x":58,"y":5.52,"fill":"prod alone"},{"x":59,"y":5.55,"fill":"prod alone"},{"x":60,"y":5.49,"fill":"prod alone"},{"x":61,"y":5.44,"fill":"prod alone"},{"x":62,"y":5.39,"fill":"prod alone"},{"x":63,"y":5.35,"fill":"prod alone"},{"x":64,"y":5.32,"fill":"prod alone"},{"x":65,"y":5.28,"fill":"prod alone"},{"x":66,"y":5.22,"fill":"prod alone"},{"x":67,"y":5.30,"fill":"prod alone"},{"x":68,"y":5.37,"fill":"prod alone"},{"x":69,"y":5.29,"fill":"prod alone"},{"x":70,"y":5.26,"fill":"prod alone"},{"x":71,"y":5.22,"fill":"prod alone"},{"x":72,"y":5.20,"fill":"prod alone"},{"x":73,"y":5.15,"fill":"prod alone"},{"x":74,"y":5.16,"fill":"prod alone"},{"x":75,"y":5.22,"fill":"prod alone"},{"x":76,"y":5.13,"fill":"prod alone"},{"x":50,"y":3.59,"fill":"rw system"},{"x":51,"y":3.57,"fill":"rw system"},{"x":52,"y":3.56,"fill":"rw system"},{"x":53,"y":3.72,"fill":"rw system"},{"x":54,"y":3.59,"fill":"rw system"},{"x":55,"y":3.54,"fill":"rw system"},{"x":56,"y":3.49,"fill":"rw system"},{"x":57,"y":3.44,"fill":"rw system"},{"x":58,"y":3.37,"fill":"rw system"},{"x":59,"y":3.31,"fill":"rw system"},{"x":60,"y":3.30,"fill":"rw system"},{"x":61,"y":3.27,"fill":"rw system"},{"x":62,"y":3.24,"fill":"rw system"},{"x":63,"y":3.22,"fill":"rw system"},{"x":64,"y":3.19,"fill":"rw system"},{"x":65,"y":3.16,"fill":"rw system"},{"x":66,"y":3.20,"fill":"rw system"},{"x":67,"y":3.38,"fill":"rw system"},{"x":68,"y":3.33,"fill":"rw system"},{"x":69,"y":3.34,"fill":"rw system"},{"x":70,"y":3.33,"fill":"rw system"},{"x":71,"y":3.37,"fill":"rw system"},{"x":72,"y":3.35,"fill":"rw system"},{"x":73,"y":3.39,"fill":"rw system"},{"x":74,"y":3.38,"fill":"rw system"},{"x":75,"y":3.44,"fill":"rw system"},{"x":76,"y":3.51,"fill":"rw system"},{"x":50,"y":8.09,"fill":"rw alone"},{"x":51,"y":8.11,"fill":"rw alone"},{"x":52,"y":8.11,"fill":"rw alone"},{"x":53,"y":8.03,"fill":"rw alone"},{"x":54,"y":8.09,"fill":"rw alone"},{"x":55,"y":8.14,"fill":"rw alone"},{"x":56,"y":8.37,"fill":"rw alone"},{"x":57,"y":8.18,"fill":"rw alone"},{"x":58,"y":8.19,"fill":"rw alone"},{"x":59,"y":8.29,"fill":"rw alone"},{"x":60,"y":8.28,"fill":"rw alone"},{"x":61,"y":8.39,"fill":"rw alone"},{"x":62,"y":8.41,"fill":"rw alone"},{"x":63,"y":8.32,"fill":"rw alone"},{"x":64,"y":8.33,"fill":"rw alone"},{"x":65,"y":8.41,"fill":"rw alone"},{"x":66,"y":8.25,"fill":"rw alone"},{"x":67,"y":8.23,"fill":"rw alone"},{"x":68,"y":8.14,"fill":"rw alone"},{"x":69,"y":8.46,"fill":"rw alone"},{"x":70,"y":8.59,"fill":"rw alone"},{"x":71,"y":8.85,"fill":"rw alone"},{"x":72,"y":8.57,"fill":"rw alone"},{"x":73,"y":8.49,"fill":"rw alone"},{"x":74,"y":8.46,"fill":"rw alone"},{"x":75,"y":8.73,"fill":"rw alone"},{"x":76,"y":8.69,"fill":"rw alone"}],"geoms":["boxplot","point"],"x":"origin","y":"half_width","code":{"boxplot":"ggplot(df, aes(group, half_width)) + geom_boxplot()","point":"ggplot(df, aes(origin, half_width, colour = group)) + geom_point()"}}

Start with the boxplot. Each box holds the middle half of the 27 half-widths for one series and method. The rw system box sits far below the rw alone box, while the e and prod pairs sit close together, with the system box slightly higher.

Switch to point and each dot is one origin. The r the preview prints there is the correlation of origin with half-width across all six groups mixed together, so ignore it. Press Run to draw the same chart with ggplot2 from the code shown.

=== step === widget
## When does the system forecast beat each series alone?

The ratio depends on the horizon, so the widget below plots the 24 ratios from the table above, for h = 1 to 8 and each series. In the one-chart view the preview draws every point in one colour, and in the facet view each panel has its own y axis, so read the axis numbers rather than the heights. Press Run for the version coloured by series on one shared scale.

::widget facet-grid {"data":[{"x":1,"y":0.92,"facet":"e"},{"x":2,"y":0.89,"facet":"e"},{"x":3,"y":0.97,"facet":"e"},{"x":4,"y":1.06,"facet":"e"},{"x":5,"y":1.19,"facet":"e"},{"x":6,"y":1.30,"facet":"e"},{"x":7,"y":1.36,"facet":"e"},{"x":8,"y":1.42,"facet":"e"},{"x":1,"y":1.00,"facet":"prod"},{"x":2,"y":1.01,"facet":"prod"},{"x":3,"y":1.02,"facet":"prod"},{"x":4,"y":1.03,"facet":"prod"},{"x":5,"y":1.04,"facet":"prod"},{"x":6,"y":1.05,"facet":"prod"},{"x":7,"y":1.06,"facet":"prod"},{"x":8,"y":1.07,"facet":"prod"},{"x":1,"y":0.86,"facet":"rw"},{"x":2,"y":0.71,"facet":"rw"},{"x":3,"y":0.60,"facet":"rw"},{"x":4,"y":0.49,"facet":"rw"},{"x":5,"y":0.42,"facet":"rw"},{"x":6,"y":0.38,"facet":"rw"},{"x":7,"y":0.36,"facet":"rw"},{"x":8,"y":0.36,"facet":"rw"}],"geom":"point","x":"horizon","y":"ratio","facetVar":"series"}

For rw the ratio falls from 0.86 at h = 1 to 0.36 at h = 8, so the gain from the system grows with the horizon. For e the ratio is below 1 up to h = 3 (0.92, 0.89, 0.97) and above 1 from h = 4 (1.06), reaching 1.42 at h = 8. For prod the ratio stays between 1.00 and 1.07, so the system is no better than forecasting prod alone.

The interval widths tell the same story. At h = 8 the system intervals are narrower only for rw, at 3.39 against 8.34. For e and prod they are slightly wider than the alone intervals.

Now bring back alpha. The rw equation has an adjustment coefficient of 0.118 against 0.012 for e, so at 2000 Q4 the ECT adds 1.15 to the next rw change and only 0.12 to the next e change. The series where the ECT carries weight is the series where the system forecast gains. For e and prod the VAR of changes has the smallest RMSE at h = 8 (1.67 and 2.81), so for those two the error-correction term is not what helps.

Before you rely on the system for a series, check three things:

1. The trace test finds r of at least 1 in every window, as the rank table showed.
2. The series has a large alpha, as rw does with 0.118 and e does not with 0.012.
3. The rolling-origin ratio is below 1 at the horizons you care about.

The 27 origins overlap heavily, so treat these ratios as a snapshot of this data and not as a ranking of methods.

=== step === quiz
## Quick check: is the system forecast better for all three series?

A colleague looks at the Johansen result and says: "The series are cointegrated, so the system forecast beats forecasting each series alone, for all three." Which reply matches the rolling-origin results?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Yes. Adding more series to a model always lowers the forecast error, so the system is better for e, prod and rw. ::no
- No. For rw the gain from the system is biggest at h = 1 and fades as the horizon grows. ::no
- No. Only rw gains: at h = 8 its RMSE ratio is 0.36, while e is 1.42 and prod is 1.07. That matches alpha, 0.118 for rw against 0.012 for e. ::ok Right. Cointegration says a long-run relation exists, but how much it moves each series depends on that series' own adjustment coefficient. Only rw has a large one, 0.118 against 0.012 for e, so at 2000 Q4 the ECT moves the next rw change by 1.15 and the next e change by 0.12. And only rw has a ratio below 1 at h = 8.
- No, but the system intervals are narrower for all three series, so it is still the safer forecast. ::no The rolling-origin results say otherwise. The RMSE ratio at h = 8 is below 1 for rw only (0.36), while e is 1.42 and prod is 1.07. The system intervals at h = 8 are narrower only for rw, at 3.39 against 8.34, and slightly wider for e (7.13 against 6.76) and prod (5.49 against 5.27). And for rw the gain grows with the horizon, from 0.86 at h = 1 to 0.36 at h = 8.

=== step === tryit
## Your turn: refit on 60 quarters and check the 8-quarter-ahead error

Suppose the origin is quarter 60 instead of 2000 Q4. The code below already fits the Johansen test on the first 60 quarters and stores it in `j60`. Convert it with `vec2var()`, forecast 8 quarters ahead with `predict()`, and take the rw forecast at h = 8. Then subtract that forecast from the actual rw value 8 quarters after quarter 60, which gives the error.

```r
# Fit the system on quarters 1 to 60, then find the 8-quarter-ahead error for rw
# j60 below is the Johansen fit on the first 60 quarters.
# Convert it, forecast 8 quarters ahead with 95% intervals, and take the rw
# forecast at the last horizon.
# Then get the error: the actual rw value 8 quarters after quarter 60 minus that forecast.
# Press Check when you have it.
j60 <- ca.jo(x[1:60, ], type = "trace", ecdet = "const", K = 2, spec = "transitory")
```
::check {"regex": "(?=[\\s\\S]*vec2var)(?=[\\s\\S]*predict)(?=[\\s\\S]*n[.]ahead\\s*=\\s*8)(?=[\\s\\S]*x\\[\\s*(68|60\\s*[+]\\s*8))", "gate": true, "difficulty": "intermediate", "ok": "Yes: the system forecast for rw at h = 8 is 462.94 and the actual value is 465.07, so the error is 2.13. Quarter 60 is the 11th origin, so this is the same number the rolling-origin loop stored for that origin.", "no": "Convert with `vec2var(j60, r = 1)`, then forecast with `predict(v60, n.ahead = 8)`. The rw forecast at h = 8 is row 8 of the rw table in the fcst list, and the actual value is quarter 60 + 8 = 68 of `x`."}
::solution
```r
# Refit the system on quarters 1 to 60 and find the 8-quarter-ahead error for rw
j60 <- ca.jo(x[1:60, ], type = "trace", ecdet = "const", K = 2, spec = "transitory")
v60 <- vec2var(j60, r = 1)
p60 <- predict(v60, n.ahead = 8, ci = 0.95)

forecast_h8 <- unname(p60$fcst$rw[8, "fcst"])
actual_h8 <- unname(x[68, "rw"])
round(c(forecast = forecast_h8, actual = actual_h8, error = actual_h8 - forecast_h8), 2)
#> forecast   actual    error
#>   462.94   465.07     2.13
round(c(err_sys = err_sys[11, 8, "rw"], err_alone = err_alone[11, 8, "rw"]), 2)
#>   err_sys err_alone
#>      2.13     -4.18
```

The error 2.13 matches `err_sys[11, 8, "rw"]`, the value the rolling-origin loop stored for the 11th origin. The alone forecast at the same origin misses by -4.18, so at this origin the system forecast of rw is the closer one.

=== step === concept
## References

- [Estimation and hypothesis testing of cointegration vectors in Gaussian vector autoregressive models](https://doi.org/10.2307/2938278) - Johansen (1991), Econometrica 59(6), 1551-1580. The paper behind the Johansen procedure that `ca.jo()` implements.
- [VAR, SVAR and SVEC Models: Implementation Within R Package vars](https://doi.org/10.18637/jss.v027.i04) - Pfaff (2008), Journal of Statistical Software 27(4), 1-32. The `vars` package: estimating, testing and forecasting VAR models in R.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos (2021), OTexts. Time series cross-validation and vector autoregressions.
- [Forecasting in cointegrated systems](https://doi.org/10.1002/jae.3950100204) - Clements and Hendry (1995), Journal of Applied Econometrics 10(2), 127-146.
- [Cointegration and long-horizon forecasting](https://doi.org/10.1080/07350015.1998.10524784) - Christoffersen and Diebold (1998), Journal of Business and Economic Statistics 16(4), 450-456.

=== step === complete
## Quick recap

You took a fitted Johansen system, turned it into 8-quarter forecasts, and tested it against forecasting each series alone. To summarize:

- The Johansen trace test found r = 1: one long-run relation among employment, productivity and the real wage. `cajorls()` gave the adjustment coefficients, 0.012 for e, -0.010 for prod and 0.118 for rw.
- `vec2var()` rewrites the fitted VECM as a level VAR, and `predict(n.ahead = 8)` then returns forecasts with 95% intervals. The interval half-width for e grows from 0.75 at h = 1 to 6.62 at h = 8.
- A rolling-origin evaluation gives every method the same forecasts to make: 27 origins, 8 quarters each. The system, the alone forecast and the VAR of changes were all scored on it.
- At h = 8 the RMSE ratio, system over alone, is 0.36 for rw, 1.07 for prod and 1.42 for e. Only rw also has narrower intervals at h = 8, 3.39 against 8.34.
- The system is worth its cost for a series when r is at least 1 in every window, its alpha is large, and its rolling-origin ratio is below 1 at the horizons you need. Otherwise forecast that series alone.

So, whenever someone asks whether a system model is worth it:

"It depends on the series. Here it cut the rw error at 8 quarters ahead to 0.36 of the alone forecast, and it did not help employment."

Now you can check that for any set of related series you forecast. Congratulations! You made it through.
