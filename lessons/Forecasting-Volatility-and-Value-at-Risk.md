---
title: "Volatility Modeling with ARCH and GARCH Lesson 5: Forecasting volatility and Value at Risk"
slug: "Forecasting-Volatility-and-Value-at-Risk"
description: "Forecast GARCH(1,1) volatility several days ahead, turn it into a one-day 99% Value at Risk for a DAX position, and backtest it by counting exceedances in R."
keywords: "forecasting volatility, GARCH forecast, Value at Risk in R, VaR backtest, exceedances, Kupiec test, Student-t VaR, conditional variance, DAX returns"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-volatility"
course_title: "Volatility Modeling with ARCH and GARCH"
course_lesson: "5"
course_total: "6"
course_landing: "Volatility-Modeling-ARCH-and-GARCH-Course.html"
course_prev: "Fitting-GARCH-in-R.html"
course_next: "Multivariate-Volatility-DCC-GARCH.html"
curriculum_id: "5.100.5"
lesson_access: "pro"
catalog_blurb: "How to forecast volatility, turn it into Value at Risk and test the result."
---

=== step === cover
## Forecasting volatility and Value at Risk

Today let's learn how to put a number on the most a position can lose in one day, and how to check that the number holds up.

Say you hold a position worth 1,000,000 in a fund that tracks the DAX, the German stock index. Your risk manager asks a simple question: how much can this position lose tomorrow?

Nobody can answer that exactly. But there is a useful way to answer it: on 99 days out of 100, the loss stays below a certain amount. That amount is called the **Value at Risk**, or VaR.

The size of that amount depends on how volatile the market is going to be tomorrow. Volatility is how widely the daily returns spread around their average, so a high-volatility market gives a larger VaR and a low-volatility market gives a smaller one. That means we first need a forecast of volatility, and then a way to turn it into a VaR.

And a VaR that nobody has checked is only a claim. So the last stage is to test it on days that were not used to fit the model.

That gives three stages, and each one uses the result of the one before it.

::widget process-flow {"steps":[{"title":"Forecast","sub":"the variance for each day ahead"},{"title":"Convert","sub":"a variance forecast into a VaR"},{"title":"Backtest","sub":"count the days the loss went past the VaR, expect 1%"}]}

Each of the three boxes above is run on real DAX returns.

=== step === concept
## The DAX returns and the fitted GARCH(1,1) model

We start with the data. The `EuStockMarkets` dataset that comes with R holds the daily closing level of four European stock indices from 1991 to 1998, and the DAX is one of them.

What we model is not the closing level but the daily **log return** in percent: 100 times the change in the log of the closing level from one day to the next. For daily moves it is very close to the ordinary percentage change. That gives 1,859 returns.

We then split them in time order. The first 1,000 returns are used to fit the model. The last 859 are the **held-out days**: the fit does not use them, so they are the days we test the VaR on later.

Press Run.

```r
# Build the DAX log returns in percent and hold out the last 859 days
dax <- EuStockMarkets[, "DAX"]
ret <- diff(log(as.numeric(dax))) * 100
fit_ret <- ret[1:1000]
test_ret <- ret[1001:1859]

length(ret)
#> [1] 1859
round(c(mean = mean(ret), sd = sd(ret)), 4)
#>   mean     sd
#> 0.0652 1.0301
```

The mean daily return is 0.0652% and the standard deviation is 1.0301%. That standard deviation is one number for the whole period. But volatility does not stay at one level, and the model we fit next describes how it changes from day to day.

The model is a **GARCH(1,1)**. It says the variance of a day's return depends on what happened the day before. That variance is called the **conditional variance**, because it is the variance of the return given everything up to the previous day. Here is the model as a formula:

\[ \sigma_t^2 = \omega + \alpha\,\varepsilon_{t-1}^2 + \beta\,\sigma_{t-1}^2 \]

Read it from left to right:

- \(\sigma_t^2\) is the conditional variance of day t.
- \(\varepsilon_{t-1}\) is the demeaned return of the day before: that day's return minus the average return.
- \(\sigma_{t-1}^2\) is the conditional variance of the day before.
- \(\omega\), \(\alpha\) and \(\beta\) are the three coefficients the fit estimates. \(\omega\) is a constant, \(\alpha\) sets how strongly yesterday's squared demeaned return feeds in, and \(\beta\) sets how much of yesterday's variance carries over.

The function `garch()` in the `tseries` package fits this model. It has no equation for the mean, so it expects a series whose mean is zero. So we subtract the fit-sample mean from every return. We subtract the same number from the held-out returns too, because on those days the mean has to come from the fit sample as well.

```r
# Fit the GARCH(1,1) to the first 1,000 days and read its three coefficients
suppressMessages(library(tseries))
mu <- mean(fit_ret)
e_fit <- fit_ret - mu
e_test <- test_ret - mu
round(mu, 4)
#> [1] 0.0214

fit <- garch(e_fit, order = c(1, 1), trace = FALSE)
round(cbind(estimate = coef(fit), std_error = sqrt(diag(vcov(fit)))), 4)
#>    estimate std_error
#> a0   0.1126    0.0255
#> a1   0.0550    0.0170
#> b1   0.8264    0.0394
```

`tseries` labels the three coefficients a0, a1 and b1, which are \(\omega\), \(\alpha\) and \(\beta\). The estimates are 0.1126, 0.0550 and 0.8264, and each one is more than 3 standard errors away from zero.

Two more numbers follow from the coefficients, and both matter later. The **persistence** is \(\alpha + \beta\): the closer it is to 1, the longer a jump in variance takes to fade. The **long-run variance** is \(\omega / (1 - \alpha - \beta)\): the average variance the model implies over a long stretch of days.

```r
# Name the coefficients and derive the persistence and the long-run variance
omega <- coef(fit)[["a0"]]
alpha <- coef(fit)[["a1"]]
beta <- coef(fit)[["b1"]]
persistence <- alpha + beta
long_run <- omega / (1 - persistence)

round(c(persistence = persistence, long_run_variance = long_run, long_run_sd = sqrt(long_run)), 4)
#>       persistence long_run_variance       long_run_sd
#>            0.8813            0.9493            0.9743
```

The persistence is 0.8813 and the long-run variance is 0.9493, which is a long-run standard deviation of 0.9743% a day.

So the fitted model gives one thing for every day: a conditional variance. That is the quantity we forecast.

=== step === concept
## How to compute tomorrow's variance by hand

Now let's use the fitted model to forecast. Suppose the 1,000 fit days have just finished and we want the variance for the first held-out day.

The variance equation needs two things from the day before, and we have both: the last fit day's demeaned return and its conditional variance. `garch()` stores the fitted standard deviation of each fit day in `fit$fitted.values`, so we read the last one and square it.

```r
# Compute the variance for the first held-out day by hand from the last fit-sample day
last_sd <- as.numeric(fit$fitted.values[1000, 1])
last_e <- e_fit[1000]
round(c(fitted_sd = last_sd, demeaned_return = last_e), 4)
#>       fitted_sd demeaned_return
#>          0.9360         -0.0214

variance_next <- omega + alpha * last_e^2 + beta * last_sd^2
round(c(variance = variance_next, sd = sqrt(variance_next)), 4)
#> variance       sd
#>   0.8367   0.9147
```

The last fit day had a fitted standard deviation of 0.9360, which is a variance of 0.8761, and a demeaned return of -0.0214. The DAX did not move on that day, so its demeaned return is just the mean with the sign flipped. The squared demeaned return is 0.0005, and putting it in the equation gives:

\[ 0.1126 + 0.0550 \times 0.0005 + 0.8264 \times 0.8761 \approx 0.837 \]

The code keeps every decimal of the coefficients, and it gives a variance of 0.8367, which is a standard deviation of 0.9147.

Given the fitted coefficients, that variance is exact: it comes from numbers we already have, and nothing random enters it. The return itself is still unknown, because the model gives the variance of the next return, not its value. All we can say is that the next return is spread around the mean with a standard deviation of 0.9147.

We will apply this update many times, so we wrap it in a function of the demeaned return and the variance of the day before.

```r
# Wrap the update in a function and check it against the hand computation
next_variance <- function(e, s2) omega + alpha * e^2 + beta * s2

next_variance(last_e, last_sd^2)
#> [1] 0.8366553
```

It returns 0.8367 again, so the function matches the hand computation. From here on `next_variance()` does this update for us.

=== step === concept
## What Value at Risk is and how to compute it from a variance forecast

We now have a variance for the next day. To turn it into a loss, we need one more idea: a quantile.

The **Value at Risk** (VaR) over one day at 99% is the loss that the position exceeds on only 1% of days. To find it, take the return that 1% of days fall below, which is the 1% quantile of the day's return, and read it as a loss. So the VaR is minus that quantile, times the position.

To get the quantile we need an assumption about how the day's return is spread. We take a Normal distribution with the mean \(\mu = 0.0214\) and the forecast standard deviation \(\sigma = 0.9147\). The 1% quantile of a Normal is then \(\mu + z\sigma\), where \(z\) is the 1% quantile of the standard Normal, which R gives as `qnorm(0.01)`. We call \(z\) the **multiplier**: it is how many standard deviations below the mean the 1% quantile sits.

The returns are in percent, so we divide by 100 before multiplying by the position:

\[ \text{VaR} = -(\mu + z\,\sigma) \times \frac{\text{position}}{100} \]

Here it is for the first held-out day, with a named object for each piece.

```r
# Turn the one-day variance forecast into a 99% Value at Risk for a 1,000,000 position
pos <- 1000000
z <- qnorm(0.01)
sd_next <- sqrt(variance_next)

quantile_garch <- mu + z * sd_next
var99_garch <- -quantile_garch / 100 * pos

round(c(z = z, quantile_pct = quantile_garch), 4)
#>            z quantile_pct
#>      -2.3263      -2.1065
round(var99_garch)
#> [1] 21065
```

The multiplier is -2.3263, so the 1% quantile of the day's return is -2.1065%. On a position of 1,000,000 that is a one-day 99% VaR of 21,065. If the Normal assumption holds, the position loses more than 21,065 on 1% of days.

A simpler VaR ignores volatility altogether. It uses the standard deviation of the whole fit sample on every day.

```r
# The constant-variance VaR uses the fit-sample standard deviation on every day
sd_const <- sd(fit_ret)
var99_const <- -(mu + z * sd_const) / 100 * pos

round(sd_const, 4)
#> [1] 0.9691
round(c(garch = var99_garch, constant = var99_const))
#>    garch constant
#>    21065    22329
```

The fit-sample standard deviation is 0.9691, so the constant-variance VaR is 22,329 every day, whatever the market is doing. The GARCH VaR is lower for the first held-out day, 21,065, because that day's forecast standard deviation of 0.9147 is below 0.9691. On a day after a large fall it will be higher, and that is the point of forecasting the variance.

There are two terms we need for checking a VaR. The **nominal rate** is the share of days on which the VaR is supposed to be exceeded: 1% for a 99% VaR. An **exceedance** is a day on which the return falls below the threshold \(\mu + z\sigma\), which means the loss is larger than the VaR.

[KEY INSIGHT]
A one-day VaR is the size of the multiplier (2.3263 for a Normal) times the forecast standard deviation, minus the mean, times the position. Any change in the variance forecast passes straight through to the VaR.

=== step === concept
## Forecasting the variance several days ahead

So far we have forecast one day ahead. But a risk manager also asks about next week, and that needs the variance several days ahead. There is a problem: the equation for two days ahead needs the demeaned return of tomorrow, and that has not happened yet.

Call the last day with a known return day T, and let \(v_h\) be the variance forecast h days ahead. The way out is to replace the unknown squared demeaned return by its expected value. By definition, the conditional variance of a day is the expected squared demeaned return of that day. So the expected squared demeaned return of day T + 1 is the variance forecast for day T + 1, which is \(v_1\). Putting that in the equation gives the forecast for day T + 2:

\[ v_2 = \omega + \alpha\,v_1 + \beta\,v_1 = \omega + (\alpha + \beta)\,v_1 \]

The same substitution works for every later day, so each forecast comes from the one before it:

\[ v_h = \omega + (\alpha + \beta)\,v_{h-1} \]

Let \(\bar v = \omega / (1 - \alpha - \beta)\) be the long-run variance. Since \(\omega = \bar v\,(1 - \alpha - \beta)\), the recursion can be rewritten around \(\bar v\):

\[ v_h - \bar v = (\alpha + \beta)\,(v_{h-1} - \bar v) \]

That is the key. Each day, the gap between the forecast and the long-run variance is multiplied by the persistence, \(\alpha + \beta = 0.8813\). The gap shrinks every day, so the forecast moves towards the long-run variance: from above if it starts above, and from below if it starts below. After h - 1 days the gap has been multiplied by \((\alpha + \beta)^{h-1}\), which gives a closed form:

\[ v_h = \bar v + (\alpha + \beta)^{h-1}\,(v_1 - \bar v) \]

To try it we need a starting day, and we take the largest one-day fall in the held-out days. But first we need the variance forecast for every held-out day. So we run the held-out returns through `next_variance()` one day at a time. The coefficients stay fixed at their fit-sample values, and each day's forecast uses only the returns up to the day before.

```r
# Run the held-out returns through next_variance() to get a variance forecast for every held-out day
sigma2_test <- numeric(859)
sigma2_test[1] <- next_variance(last_e, last_sd^2)
for (day in 1:858) {
  sigma2_test[day + 1] <- next_variance(e_test[day], sigma2_test[day])
}

origin <- which.min(test_ret)
data.frame(day = origin, return_pct = round(test_ret[origin], 2), next_day_sd = round(sqrt(sigma2_test[origin + 1]), 4))
#>   day return_pct next_day_sd
#> 1 651      -6.01      1.9424
```

The largest fall is -6.01%, on held-out day 651. The forecast standard deviation for the day after it is 1.9424, about twice the long-run 0.9743.

The function `forecast_path()` below applies the recursion. It starts from the day 1 variance and runs it out to day 30.

```r
# Forecast the variance 1 to 30 days ahead from a starting variance, by the recursion
forecast_path <- function(variance_1, horizon = 30) {
  path <- numeric(horizon)
  path[1] <- variance_1
  for (h in 2:horizon) {
    path[h] <- omega + persistence * path[h - 1]
  }
  path
}

variance_path <- forecast_path(sigma2_test[origin + 1])
sd_path <- sqrt(variance_path)
round(sd_path[c(1, 5, 10, 30)], 4)
#> [1] 1.9424 1.6288 1.3621 1.0108
```

The forecast standard deviation is 1.9424 on day 1, 1.6288 on day 5, 1.3621 on day 10 and 1.0108 on day 30. It moves towards 0.9743, but it has not reached it after 30 days.

The closed form gives the same 30 forecasts in one line, with no loop. `all.equal()` confirms that they match.

```r
# The closed form gives the same 30 forecasts without a loop
h <- 1:30
variance_closed <- long_run + persistence^(h - 1) * (variance_path[1] - long_run)

all.equal(variance_path, variance_closed)
#> [1] TRUE
```

The move towards the long-run variance also works from below. Here we start from the held-out day with the lowest variance forecast, day 165. Its path begins with the forecast for the day after it, and we put that path next to the path after the fall.

```r
# Compare the path after the fall with a path that starts on the calmest day
calm <- which.min(sigma2_test)
sd_calm <- sqrt(forecast_path(sigma2_test[calm + 1]))

data.frame(
  days_ahead = c(1, 5, 10, 30),
  after_fall = round(sd_path[c(1, 5, 10, 30)], 4),
  after_calm_day = round(sd_calm[c(1, 5, 10, 30)], 4),
  long_run_sd = round(sqrt(long_run), 4)
)
#>   days_ahead after_fall after_calm_day long_run_sd
#> 1          1     1.9424         0.9440      0.9743
#> 2          5     1.6288         0.9562      0.9743
#> 3         10     1.3621         0.9647      0.9743
#> 4         30     1.0108         0.9736      0.9743
```

After the fall the forecast standard deviation comes down from 1.9424 to 1.0108. After the calm day it goes up from 0.9440 to 0.9736. Both paths head to 0.9743.

How fast the gap closes depends only on the persistence. The **half-life** is the number of days the gap takes to halve, and it equals log(0.5) / log(0.8813).

```r
# How many days does it take the gap to the long-run variance to halve?
half_life <- log(0.5) / log(persistence)
round(c(half_life = half_life, gap_left_after_5_days = persistence^5), 2)
#>             half_life gap_left_after_5_days
#>                  5.49                  0.53
```

The half-life is 5.49 days, and after 5 days 53% of the gap is left.

[KEY INSIGHT]
A GARCH forecast does not stay at today's level of volatility. It moves towards the long-run variance at a speed set by \(\alpha + \beta\), so a large fall raises the forecast for several weeks, not for a single day.

=== step === widget
## The forecast standard deviation over 30 days after the -6.01% fall

The chart below plots the 30 forecast standard deviations after the -6.01% fall, with a dashed line at the long-run standard deviation of 0.9743. You can switch between line, point and bar, and Run draws the chart with ggplot2.

::widget chart-plotter {"data":[{"x":1,"y":1.9424},{"x":2,"y":1.8541},{"x":3,"y":1.7727},{"x":4,"y":1.6977},{"x":5,"y":1.6288},{"x":6,"y":1.5655},{"x":7,"y":1.5075},{"x":8,"y":1.4545},{"x":9,"y":1.4061},{"x":10,"y":1.3621},{"x":11,"y":1.322},{"x":12,"y":1.2857},{"x":13,"y":1.2528},{"x":14,"y":1.2231},{"x":15,"y":1.1963},{"x":16,"y":1.1722},{"x":17,"y":1.1505},{"x":18,"y":1.131},{"x":19,"y":1.1136},{"x":20,"y":1.098},{"x":21,"y":1.084},{"x":22,"y":1.0716},{"x":23,"y":1.0605},{"x":24,"y":1.0507},{"x":25,"y":1.0419},{"x":26,"y":1.0341},{"x":27,"y":1.0272},{"x":28,"y":1.0211},{"x":29,"y":1.0156},{"x":30,"y":1.0108}],"geoms":["line","point","bar"],"x":"days_ahead","y":"forecast_sd","code":{"line":"ggplot(df, aes(days_ahead, forecast_sd)) +\n  geom_line() +\n  geom_hline(yintercept = 0.9743, linetype = \"dashed\")","point":"ggplot(df, aes(days_ahead, forecast_sd)) +\n  geom_point() +\n  geom_hline(yintercept = 0.9743, linetype = \"dashed\")","bar":"ggplot(df, aes(factor(days_ahead), forecast_sd)) +\n  geom_col() +\n  geom_hline(yintercept = 0.9743, linetype = \"dashed\")"}}

Read the values off the chart. The forecast standard deviation is 1.94 on day 1, 1.63 on day 5, 1.36 on day 10, 1.10 on day 20 and 1.01 on day 30.

It is still above the dashed line after a month. So the forecast does not drop back to the long-run level after one day. It comes down a little less each day, the way the recursion says it should.

=== step === widget
## Why a VaR moves when the volatility moves

A VaR comes from a quantile, and a quantile moves when the spread of the data moves. The widget below shows this on its own data, not on the DAX returns: income against years of experience, where the spread of income grows with experience. In the same way, the spread of a day's return grows when the forecast standard deviation rises.

Switch between the 10th percentile, the median and the 90th percentile.

::widget quantile-lines {}

The 10th percentile line has slope 1.0, the median line has slope 2.2 and the 90th percentile line has slope 3.4. As experience rises the spread grows, so the lower percentile line falls further below the median line and the upper one rises further above it.

The 1% quantile of a day's return behaves like the 10th percentile line. When the forecast standard deviation is larger, the 1% quantile sits further below the mean. It is always z = -2.3263 forecast standard deviations from the mean, so the VaR is 2.3263 times the forecast standard deviation, minus the mean, times the position over 100. For every extra point of forecast standard deviation, the VaR rises by 23,263.

The code below prints the VaR on days 1, 5 and 10 after the -6.01% fall, using the forecast standard deviations in `sd_path`.

```r
# The 99% VaR on days 1, 5 and 10 after the fall is a multiple of that day's forecast sd
var99_path <- -(mu + z * sd_path) / 100 * pos
round(var99_path[c(1, 5, 10)])
#> [1] 44972 37677 31473
```

The VaR is 44,972 on day 1 after the fall, against 21,065 on the first held-out day. It comes down to 37,677 on day 5 and 31,473 on day 10, as the forecast standard deviation comes down.

=== step === quiz
## Quick check: the 99% VaR five days after a large fall

Take the position of 1,000,000, the mean return 0.0214 and the multiplier z = -2.3263. After the -6.01% fall, the forecast standard deviation is 1.94 for day 1 and 1.63 for day 5. What is the one-day 99% VaR for day 5?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- About 45,000, the same as day 1, because the multiplier does not change. ::no
- About 37,700, lower than day 1, because the forecast standard deviation has moved towards the long-run level. ::ok Yes. For day 5 the VaR uses the day 5 forecast standard deviation: the mean 0.0214 minus 2.3263 times 1.63, read as a loss on 1,000,000, is about 37,700. On day 1 it was about 45,000. The multiplier is fixed, but the standard deviation it multiplies is not.
- Higher than day 1, because uncertainty grows the further ahead we look. ::no
- About 22,500, the long-run level, because a fall only affects the day after it. ::no Each VaR here is the loss for one single day, and it uses that day's own forecast standard deviation. After a large fall the forecast standard deviation starts at 1.94 and moves towards the long-run 0.9743, so the VaR falls with it. It does not stay fixed, it does not grow with the number of days ahead, and it does not return to the long-run level after one day.

=== step === concept
## How to backtest a VaR by counting exceedances

A VaR is a claim about the future, so the next question is whether it holds. To **backtest** it, we compare the VaR with returns that the model was not fitted on: the 859 held-out days.

For each held-out day, the VaR threshold as a return is \(\mu + z\sigma\), with \(\sigma\) taken from that day's variance forecast in `sigma2_test`. A day is an exceedance when its return falls below its threshold.

If the VaR is right, every day has a 1% chance of being an exceedance. So the number of exceedances in 859 days follows a Binomial distribution with 859 trials and probability 0.01, and its expected value is 859 times 0.01, which is 8.59. A count far from 8.59 means the VaR is wrong. The function `binom.test()` measures how far: its p-value is the probability, if the true exceedance rate were 1%, of a count at least as unlikely as the one we saw.

We count the exceedances for two VaRs, the constant-variance one and the GARCH one, both with the Normal multiplier.

```r
# Count the 99% VaR exceedances over the 859 held-out days, GARCH against constant variance
exceed_garch <- test_ret < mu + z * sqrt(sigma2_test)
exceed_const <- test_ret < mu + z * sd_const

859 * 0.01
#> [1] 8.59
counts <- data.frame(
  model = c("Constant variance", "GARCH, Normal"),
  exceedances = c(sum(exceed_const), sum(exceed_garch)),
  rate_pct = round(100 * c(mean(exceed_const), mean(exceed_garch)), 2),
  p_value = signif(c(binom.test(sum(exceed_const), 859, 0.01)$p.value,
                     binom.test(sum(exceed_garch), 859, 0.01)$p.value), 2)
)
counts
#>               model exceedances rate_pct p_value
#> 1 Constant variance          24     2.79 0.00001
#> 2     GARCH, Normal          18     2.10 0.00490
```

Constant variance has 24 exceedances, which is 2.79% of the days, with p = 0.00001. GARCH with the Normal multiplier has 18, which is 2.10%, with p = 0.0049. Both counts are above the 8.59 we expect. GARCH is closer to it, but a count of 18 would still be rare if the true rate were 1%.

The plot shows the held-out returns with both thresholds, and marks the GARCH exceedances.

```r
# Plot the held-out returns with both VaR thresholds and mark the GARCH exceedances
library(ggplot2)
plot_data <- data.frame(
  day = 1:859,
  return_pct = test_ret,
  garch_threshold = mu + z * sqrt(sigma2_test)
)
exceed_points <- plot_data[exceed_garch, ]

ggplot(plot_data, aes(day, return_pct)) +
  geom_point(colour = "grey60", size = 0.8) +
  geom_line(aes(y = garch_threshold), colour = "#1f7a55") +
  geom_hline(yintercept = mu + z * sd_const, linetype = "dashed") +
  geom_point(data = exceed_points, colour = "#c0392b", size = 2) +
  labs(x = "Held-out day", y = "Return (%)")
```

The grey dots are the held-out returns. The dashed line is the constant-variance threshold, flat at -2.23. The green line is the GARCH threshold: it drops when the forecast standard deviation rises and comes back up when it falls. The red dots are the 18 GARCH exceedances.

The constant-variance threshold cannot move, so its exceedances bunch up when the market is turbulent. Let's count the exceedances in held-out days 590 to 700, and average the forecast standard deviation inside and outside that stretch.

```r
# Count the exceedances in held-out days 590 to 700 and average the forecast sd inside and outside that stretch
stretch <- 590:700
c(constant = sum(exceed_const[stretch]), garch = sum(exceed_garch[stretch]))
#> constant    garch
#>       14        6
round(c(inside = mean(sqrt(sigma2_test[stretch])), outside = mean(sqrt(sigma2_test[-stretch]))), 2)
#>  inside outside
#>    1.28    0.96
```

The average forecast standard deviation in those 111 days is 1.28, against 0.96 on the other days. 14 of the 24 constant-variance exceedances fall in that stretch, against 6 of the 18 GARCH exceedances.

Risk reports often use the **Kupiec test** in place of `binom.test()`. It asks the same question through a likelihood ratio: it compares how likely the observed count is at the nominal rate with how likely it is at the observed rate.

```r
# The Kupiec test asks the same question through a likelihood ratio
kupiec_p <- function(x, n, p) {
  phat <- x / n
  lr <- -2 * ((n - x) * log(1 - p) + x * log(p) - (n - x) * log(1 - phat) - x * log(phat))
  pchisq(lr, df = 1, lower.tail = FALSE)
}

signif(c(constant = kupiec_p(sum(exceed_const), 859, 0.01), garch = kupiec_p(sum(exceed_garch), 859, 0.01)), 2)
#> constant    garch
#>  1.5e-05  4.9e-03
```

It gives similar p-values: 1.5e-05 for constant variance and 0.0049 for GARCH.

So GARCH is closer to 8.59 than constant variance, but 18 is still about twice the expected count. The variance forecast already moves with volatility. What we have not looked at yet is the multiplier.

=== step === concept
## How a Student-t multiplier changes the backtest

The multiplier -2.3263 comes from the Normal distribution. It assumes that a day's return, divided by that day's standard deviation, follows a standard Normal. We can check this on the fit sample.

The **standardised residual** of a day is its demeaned return divided by its fitted standard deviation, and `residuals(fit)` gives these. The first fit day has no fitted variance, so we drop it and keep 999 values.

If the model with Normal errors were right, they would look like draws from a standard Normal. One way to check the tails is the **excess kurtosis**: the kurtosis minus 3. The kurtosis is the average fourth power of the values after standardising them, and a Normal has kurtosis 3. So a Normal has excess kurtosis 0, and a positive value means heavier tails than a Normal.

```r
# Standardise the fit-sample residuals and measure how heavy their tails are
z_fit <- residuals(fit)[-1]
excess_kurtosis <- function(x) mean((x - mean(x))^4) / mean((x - mean(x))^2)^2 - 3

round(c(excess_kurtosis = excess_kurtosis(z_fit), smallest = min(z_fit)), 1)
#> excess_kurtosis        smallest
#>            16.1           -11.1
```

The excess kurtosis is 16.1, far above 0, and the smallest standardised residual is -11.1, a fall of 11.1 standard deviations. A Normal distribution would almost never produce that. So the tails of these residuals are much heavier than the tails the Normal multiplier assumes.

One distribution with heavier tails is the **Student-t**. Its tail weight is set by its degrees of freedom \(\nu\): the smaller \(\nu\) is, the heavier the tails, and as \(\nu\) grows it turns into the Normal. A t with \(\nu\) degrees of freedom has variance \(\nu / (\nu - 2)\), not 1. The conditional variance already carries the scale of each day, so the standardised residuals should have variance 1, and we rescale the t to match. That changes its 1% multiplier to:

\[ z_t = q_t(0.01,\ \nu)\,\sqrt{\frac{\nu - 2}{\nu}} \]

Here \(q_t(0.01, \nu)\) is the 1% quantile of a t with \(\nu\) degrees of freedom, which R gives as `qt(0.01, nu)`.

We do not know \(\nu\), so we estimate it by maximum likelihood: we look for the \(\nu\) that makes the 999 standardised residuals most likely under the unit-variance t. The function `optimize()` searches a range of values for the one with the smallest negative log-likelihood.

```r
# Estimate the degrees of freedom of a unit-variance Student-t by maximum likelihood
neg_loglik <- function(nu) {
  scale <- sqrt((nu - 2) / nu)
  -sum(dt(z_fit / scale, df = nu, log = TRUE) - log(scale))
}

nu_hat <- optimize(neg_loglik, interval = c(2.1, 50))$minimum
z_t <- qt(0.01, nu_hat) * sqrt((nu_hat - 2) / nu_hat)

round(nu_hat, 2)
#> [1] 4.78
round(c(normal = z, student_t = z_t), 3)
#>    normal student_t
#>    -2.326    -2.616
```

The estimate is \(\nu = 4.78\). The 1% multiplier is -2.616 against -2.326 for the Normal, so the threshold moves further from the mean.

Now we rerun the backtest with the Student-t multiplier. We also run both multipliers at the 5% level for comparison, where the multiplier is -1.645 for the Normal and -1.553 for the t.

```r
# Compare the Normal and Student-t multipliers by their exceedance counts at 1% and 5%
z5 <- qnorm(0.05)
z5_t <- qt(0.05, nu_hat) * sqrt((nu_hat - 2) / nu_hat)
round(c(normal = z5, student_t = z5_t), 3)
#>    normal student_t
#>    -1.645    -1.553

count_exceed <- function(multiplier) sum(test_ret < mu + multiplier * sqrt(sigma2_test))

backtest <- data.frame(
  level = c("1%", "1%", "5%", "5%"),
  multiplier = c("Normal", "Student-t", "Normal", "Student-t"),
  exceedances = c(count_exceed(z), count_exceed(z_t), count_exceed(z5), count_exceed(z5_t)),
  expected = c(8.59, 8.59, 42.95, 42.95)
)
backtest$p_value <- signif(mapply(function(x, p) binom.test(x, 859, p)$p.value,
                                  backtest$exceedances, c(0.01, 0.01, 0.05, 0.05)), 2)
backtest
#>   level multiplier exceedances expected p_value
#> 1    1%     Normal          18     8.59  0.0049
#> 2    1%  Student-t          10     8.59  0.6000
#> 3    5%     Normal          47    42.95  0.5300
#> 4    5%  Student-t          52    42.95  0.1600
```

At 1%, the Normal multiplier gives 18 exceedances against 8.59 expected (p = 0.0049). The t multiplier gives 10 (p = 0.60), which is close to what a correct 99% VaR should give. A multiplier closer to zero puts the threshold closer to the mean, so more days fall below it, and that is what happened with the Normal.

At 5% the picture is different. The counts are 47 and 52 against 42.95 expected, and neither is far from it (p = 0.53 and 0.16). The t multiplier is closer to zero than the Normal one at 5%, so it gives more exceedances there. The two multipliers differ most far out in the tail, which is where a 99% VaR sits.

In currency units, here is the one-day 99% VaR for the first held-out day from each multiplier.

```r
# Compare the one-day 99% VaR under the two multipliers
var99_t <- -(mu + z_t * sd_next) / 100 * pos

round(c(normal = var99_garch, student_t = var99_t))
#>    normal student_t
#>     21065     23715
round(100 * (1 - var99_garch / var99_t))
#> [1] 11
```

The t multiplier gives 23,715 against 21,065 for the Normal, so the Normal VaR is about 11% lower.

[NOTE]
Two cautions. 859 days is a short test for a 1% level: the expected count is only 8.59, so the difference between 18 and 10 rests on a handful of days. And \(\nu = 4.78\) is estimated from 999 residuals, one of which is -11.1, and a single value that extreme pulls on the estimate. So read the backtest as evidence, not as proof.

=== step === quiz
## Quick check: what an exceedance count says

A 99% VaR is backtested on 859 held-out days. It has 18 exceedances, which is 2.1% of the days, and `binom.test()` gives p = 0.005. What does this tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The rate is 2.1%, only about one point above 1%, so the VaR is fine. ::no
- The VaR is too cautious, since it was breached so often. ::no
- The VaR is too low: the multiplier or the variance forecast is too small. ::ok Yes. A 99% VaR should be exceeded on about 1% of days, which is 8.59 days out of 859. Exceedances on 2.1% of days mean the threshold sits too close to the mean, and p = 0.005 says a count of 18 would be rare if the true rate were 1%.
- p = 0.005 means there is a 0.5% probability that the VaR is right. ::no A 99% VaR should be exceeded on about 1% of days, so 2.1% means the VaR understates the loss. The p-value only says how rare a count of 18 would be if the true exceedance rate were 1%. It is not the probability that the VaR is right.

=== step === tryit
## Your turn: backtest a 97.5% VaR

A 97.5% VaR is exceeded on 2.5% of days, so its nominal rate is 2.5% and its multiplier comes from a different quantile of the standard Normal. `test_ret`, `sigma2_test` and `mu` are still in your session. Count the held-out days on which the return falls below the 97.5% VaR threshold, using the Normal multiplier.

```r
# Count the held-out days below the 97.5% VaR threshold
# test_ret holds the 859 held-out returns, sigma2_test the 859 variance forecasts,
# and mu the fit-sample mean.
# Build the threshold for each day, then count the days whose return is below it.
# One line. Press Check when you have it.
```
::check {"regex": "qnorm[(]0?\\.025[)]", "gate": true, "difficulty": "intermediate", "ok": "Yes: 32 exceedances against 21.475 expected, a binomial p-value of 0.028. The Normal multiplier gives too many exceedances at 97.5% as well, though the excess is smaller than at 99%.", "no": "The 97.5% VaR is exceeded on 2.5% of days, so the multiplier is the 2.5% quantile of the standard Normal, qnorm(0.025). Build the threshold as mu plus that multiplier times sqrt(sigma2_test), then use sum() on the comparison of test_ret with the threshold."}
::solution
```r
# Count the exceedances of the 97.5% VaR over the 859 held-out days
sum(test_ret < mu + qnorm(0.025) * sqrt(sigma2_test))
#> [1] 32
859 * 0.025
#> [1] 21.475
signif(binom.test(32, 859, 0.025)$p.value, 2)
#> [1] 0.028
```

The 97.5% VaR was exceeded on 32 days, which is 3.7% of the held-out days, against 21.475 expected. So the Normal multiplier understates the tail at 97.5% too. Two things changed from the 99% backtest: the multiplier and the nominal rate.

=== step === concept
## References

- [Generalized autoregressive conditional heteroskedasticity](https://doi.org/10.1016/0304-4076(86)90063-1) - Bollerslev (1986), Journal of Econometrics 31(3), 307-327. The paper that introduced the GARCH model.
- [Techniques for verifying the accuracy of risk measurement models](https://doi.org/10.3905/jod.1995.407942) - Kupiec (1995), The Journal of Derivatives 3(2), 73-84. The proportion-of-failures test used to backtest a VaR.
- [Analysis of Financial Time Series, 3rd edition](https://doi.org/10.1002/9780470644560) - Tsay (2010), Wiley. The chapters on GARCH forecasting and Value at Risk.
- [Value at Risk: The New Benchmark for Managing Financial Risk, 3rd edition](https://www.worldcat.org/isbn/9780071464956) - Jorion (2007), McGraw-Hill.
- [tseries: Time Series Analysis and Computational Finance](https://cran.r-project.org/package=tseries) - Trapletti and Hornik, CRAN package documentation for `garch()`.

=== step === complete
## Quick recap

You forecast the variance of DAX returns from a GARCH(1,1), turned it into a one-day VaR for a position of 1,000,000, and backtested it on 859 days that were not used to fit the model. To summarize:

- Variance forecasts move towards the long-run variance, a standard deviation of 0.9743. After the -6.01% fall the forecast standard deviation is 1.94 on day 1 and 1.01 on day 30, and the gap to the long-run variance halves every 5.5 days.
- A one-day VaR is the size of the multiplier times the forecast standard deviation, minus the mean, times the position. It is 21,065 on the first held-out day and 44,972 on day 1 after the fall.
- A backtest counts the exceedances against the nominal rate. In 859 days a 99% VaR should have 8.59: constant variance has 24, GARCH with a Normal multiplier has 18, and GARCH with a Student-t multiplier has 10.
- A multiplier that is too close to zero puts the threshold too close to the mean, so the exceedance count comes out too high.

So when someone asks how much a position can lose in a day, you can give a number, say what it depends on, and show how it did on days the model had not seen.

The next part covers two return series whose correlation also changes over time.
