---
title: "Exponential Smoothing in R: ses() and the Alpha Parameter"
slug: "Exponential-Smoothing-in-R"
description: "Master simple exponential smoothing in R with ses(): how alpha weights recent data, how ses() optimises alpha for you, and when SES beats naive forecasts."
keywords: "exponential smoothing in R, ses() function, simple exponential smoothing, alpha smoothing parameter, forecast package, SES forecasting, smoothing parameter, time series forecasting R"
auto_link_terms: "simple exponential smoothing | single exponential smoothing | ses() | ses() function | alpha smoothing parameter | smoothing parameter alpha | exponential smoothing in R | SES forecasting | ses() in R | alpha parameter"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.7"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Exponential Smoothing"
sidebar_order: 12
difficulty: "Intermediate"
---

<p class="lead">Simple exponential smoothing (SES) forecasts a flat future for a time series that has no trend and no seasonal pattern, by taking a weighted average of past values in which older observations count for less and less. The <code>ses()</code> function in R's forecast package fits the model and picks the best weighting for you.</p>

The one dial that controls everything is the smoothing parameter, alpha. This tutorial builds alpha up from a plain running average, shows exactly how `ses()` chooses its value, and gives you a clear rule for when simple exponential smoothing is the right tool. We use the built-in `Nile` series (annual river flow, no trend, no season) so nothing needs to be downloaded, and we stay in the tidy, well-tested forecast package throughout.

## What problem does simple exponential smoothing solve?

Imagine a measurement that wobbles around a slowly drifting level: monthly help-desk tickets, a lake's water level, a river's yearly flow. There is no upward march and no repeating seasonal shape, just a level that shifts a little over time. To forecast the next value you could copy the most recent observation, but that overreacts to random noise. You could use the average of the whole history, but that ignores the fact that recent data is more relevant. Simple exponential smoothing is the tunable middle ground between those two extremes.

Let's see it work before we unpack the theory. The block below loads the forecast package, fits SES to the Nile series, and asks for a five-year forecast.

```r title="Fit simple exponential smoothing to the Nile series"
library(forecast)

# Annual flow of the river Nile, 1871 to 1970: no trend, no season, just a level
fit <- ses(Nile, h = 5)
fit
#>      Point Forecast    Lo 80     Hi 80    Lo 95    Hi 95
#> 1971       805.3363 620.4959  990.1768 522.6473 1088.025
#> 1972       805.3363 614.9998  995.6729 514.2417 1096.431
#> 1973       805.3363 609.6580 1001.0147 506.0721 1104.601
#> 1974       805.3363 604.4582 1006.2145 498.1197 1112.553
#> 1975       805.3363 599.3896 1011.2830 490.3680 1120.305
```

Look at the `Point Forecast` column: every year is 805.3363, the exact same number. That is the signature of SES. It produces one best estimate of the current level and then holds it flat into the future. The four other columns are 80% and 95% prediction intervals (the plausible range around the forecast), and those do change, growing wider the further out you look.

A picture makes the flat forecast obvious. The `autoplot()` function draws the history and the forecast together.

```r title="Plot the flat SES forecast"
autoplot(fit) +
  ggplot2::ylab("Nile flow") +
  ggplot2::ggtitle("SES forecast holds the level flat")
```

The blue line is the point forecast, sitting flat at 805.3363, wrapped in shaded prediction bands that fan out with the horizon.

[KEY INSIGHT]
**The SES forecast is a single number carried forward.** SES estimates the current level of the series, then predicts that same level for every future step, so the point forecast is always a horizontal line.

**Try it:** Ask `ses()` for a 3-year forecast of the Nile series instead of 5, and confirm the point forecast does not change.

```r title="Your turn: forecast three years ahead"
# Change the horizon from 5 to 3
ex_fit <- ses(Nile, h = 5)
ex_fit
# Expected: 3 rows, each with Point Forecast 805.3363
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-year Nile forecast"
ex_fit <- ses(Nile, h = 3)
ex_fit
#>      Point Forecast    Lo 80     Hi 80    Lo 95    Hi 95
#> 1971       805.3363 620.4959  990.1768 522.6473 1088.025
#> 1972       805.3363 614.9998  995.6729 514.2417 1096.431
#> 1973       805.3363 609.6580 1001.0147 506.0721 1104.601
```

**Explanation:** Only the argument `h` (the horizon) changes. The point forecast stays at the estimated level, 805.3363, because SES has no trend to extend.

</details>

## How does the alpha parameter control smoothing?

The heart of SES is a short update rule. Each time a new observation arrives, the model nudges its current estimate of the level partway toward that new value. How big the nudge is depends entirely on alpha. The rule reads: new level equals alpha times the new observation, plus (1 minus alpha) times the old level.

![Each new level is a weighted blend of the newest observation and the previous level.](screenshots/Exponential-Smoothing-in-R-smoothing-update.webp)

*Figure 1: Each new level is a weighted blend of the newest observation and the previous level.*

In symbols, writing the level at time $t$ as $\ell_t$:

$$\ell_t = \alpha\, y_t + (1 - \alpha)\,\ell_{t-1}$$

The forecast for any future step is simply the latest level:

$$\hat{y}_{t+h\,|\,t} = \ell_t$$

Alpha lives between 0 and 1, and it decides how much attention each update pays to the newest data point versus everything that came before. The clearest way to feel this is to run the update rule by hand on a tiny series. Below we smooth five numbers with a small alpha of 0.2, starting the level off at the first observation.

```r title="Smooth a tiny series by hand with alpha 0.2"
y <- c(10, 12, 9, 11, 13)
alpha <- 0.2
level <- numeric(length(y))
level[1] <- y[1]                       # start the level at the first value

for (t in 2:length(y)) {
  level[t] <- alpha * y[t] + (1 - alpha) * level[t - 1]
}
round(level, 3)
#> [1] 10.000 10.400 10.120 10.296 10.837
```

Walk through the second step to see the blend. The new observation is 12 and the old level is 10, so the update is `0.2 * 12 + 0.8 * 10 = 10.4`. With alpha only 0.2, the level barely moves toward the new 12; it stays close to the old level. That is a slow, heavily smoothed series that barely responds to single-point noise.

Now watch what a large alpha of 0.8 does to the very same numbers.

```r title="Same series with alpha 0.8 reacts faster"
alpha <- 0.8
level_fast <- numeric(length(y))
level_fast[1] <- y[1]

for (t in 2:length(y)) {
  level_fast[t] <- alpha * y[t] + (1 - alpha) * level_fast[t - 1]
}
round(level_fast, 3)
#> [1] 10.000 11.600  9.520 10.704 12.541
```

With alpha 0.8, the second step is `0.8 * 12 + 0.2 * 10 = 11.6`, jumping most of the way to the new value. The whole series now chases the data closely, tracking every bump. Compare the two results: alpha 0.2 ends near 10.8 while alpha 0.8 ends near 12.5, much closer to the final observation of 13. Same data and the same update rule produce very different behaviour, all set by one number.

[TIP]
**Start the level at the first observation for a hand calculation.** SES needs a starting level before the recursion can run. Setting it to the first data point (as we did here) is the simplest choice and is exactly what the forecast package calls the "simple" initialisation.

**Try it:** Smooth the same `y` vector with alpha = 0.5 and see where the level lands between the slow and fast versions.

```r title="Your turn: smooth with alpha 0.5"
ex_alpha <- 0.5
ex_level <- numeric(length(y))
ex_level[1] <- y[1]

for (t in 2:length(y)) {
  # your code here: blend the new observation with the old level
}
round(ex_level, 3)
# Expected: 10.00 11.00 10.00 10.50 11.75
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alpha 0.5 smoothing solution"
ex_alpha <- 0.5
ex_level <- numeric(length(y))
ex_level[1] <- y[1]

for (t in 2:length(y)) {
  ex_level[t] <- ex_alpha * y[t] + (1 - ex_alpha) * ex_level[t - 1]
}
round(ex_level, 3)
#> [1] 10.00 11.00 10.00 10.50 11.75
```

**Explanation:** With alpha 0.5 each update is a straight halfway split between the new observation and the old level, so the result sits neatly between the alpha 0.2 and alpha 0.8 outcomes.

</details>

## Why do older observations get less weight?

Unrolling the update rule reveals a useful fact: the forecast turns out to be a weighted average of every past observation, where the weights shrink geometrically as you go back in time. Expanding the equation gives:

$$\hat{y}_{T+1\,|\,T} = \alpha y_T + \alpha(1-\alpha) y_{T-1} + \alpha(1-\alpha)^2 y_{T-2} + \cdots$$

The most recent value gets weight $\alpha$, the one before it gets $\alpha(1-\alpha)$, the one before that $\alpha(1-\alpha)^2$, and so on. Each step further back multiplies the weight by another factor of $(1-\alpha)$, so the influence of old data fades away smoothly. That geometric fade is the "exponential" in exponential smoothing. Let's compute those weights directly for alpha 0.2.

```r title="Weights that SES puts on recent and older observations"
alpha <- 0.2
lags <- 0:6                            # 0 = most recent observation
weights <- alpha * (1 - alpha)^lags
round(weights, 4)
#> [1] 0.2000 0.1600 0.1280 0.1024 0.0819 0.0655 0.0524
```

The newest observation gets 0.2, the next 0.16, then 0.128, each about 80% of the one before. The weights trail off gently, so observations from many steps back still contribute a little. Because they form a geometric series, all the weights (out to infinity) sum to exactly 1, which is what makes the forecast a proper weighted average.

```r title="The weights add up to one"
sum(alpha * (1 - alpha)^(0:1000))
#> [1] 1
```

A larger alpha changes the character of that decay completely. Here are the weights for alpha 0.8.

```r title="A larger alpha forgets the past much faster"
round(0.8 * (1 - 0.8)^(0:6), 4)
#> [1] 0.8000 0.1600 0.0320 0.0064 0.0013 0.0003 0.0001
```

Now the newest point alone carries 80% of the weight, and by the third step back the weight is already down near zero. A high alpha has a short memory: it essentially forecasts from the last observation or two. A low alpha has a long memory, spreading its attention over many past values. Alpha is really a memory-length dial.

[KEY INSIGHT]
**Alpha sets how long the model remembers.** A small alpha spreads weight over many past observations (long memory, smooth forecast), while a large alpha concentrates weight on the latest points (short memory, reactive forecast).

**Try it:** Compute the weights for alpha = 0.5 and confirm each weight is exactly half the previous one.

```r title="Your turn: weights for alpha 0.5"
ex_alpha <- 0.5
# Build the weight vector for lags 0 to 6 using ex_alpha
ex_w <- rep(NA, 7)                     # replace with the weight formula
round(ex_w, 4)
# Expected: 0.5000 0.2500 0.1250 0.0625 0.0312 0.0156 0.0078
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alpha 0.5 weights solution"
ex_alpha <- 0.5
ex_w <- ex_alpha * (1 - ex_alpha)^(0:6)
round(ex_w, 4)
#> [1] 0.5000 0.2500 0.1250 0.0625 0.0312 0.0156 0.0078
```

**Explanation:** With alpha 0.5 the decay factor is `1 - 0.5 = 0.5`, so every weight is half of the one before it. The series halves at each step: 0.5, 0.25, 0.125, and so on.

</details>

## How does ses() choose the best alpha automatically?

You do not have to guess alpha. By default, `ses()` finds the value that makes the model fit the historical data as closely as possible. It measures fit with the sum of squared errors (SSE), the total of the squared gaps between each actual value and the model's one-step-ahead forecast of it:

$$\text{SSE} = \sum_{t=1}^{T} \left(y_t - \hat{y}_{t\,|\,t-1}\right)^2$$

The function searches for the alpha (and the starting level) that make SSE as small as possible. There is no tidy formula for the answer, so R uses numerical optimisation under the hood. You can read the chosen values straight off the fitted model.

```r title="Inspect the alpha and initial level ses() estimated"
fit$model
#> Simple exponential smoothing 
#> 
#> Call:
#> ses(y = Nile, h = 5)
#> 
#>   Smoothing parameters:
#>     alpha = 0.2457 
#> 
#>   Initial states:
#>     l = 1110.7341 
#> 
#>   sigma:  144.2318
#> 
#>      AIC     AICc      BIC 
#> 1458.781 1459.031 1466.597
```

The fit reports `alpha = 0.2457`, a fairly low value, which tells us the Nile level moves gently and rewards a long memory. It also estimates the initial level `l = 1110.7341` (the starting point of the recursion, which `ses()` optimises rather than fixing at the first observation) and `sigma`, the standard deviation of the residuals (the one-step-ahead forecast errors, the same gaps the SSE above squares and sums). The AIC, AICc, and BIC are model-comparison scores you can use to pit SES against other models.

To prove that alpha 0.2457 really is the SSE minimiser, we can rebuild the search by hand. The loop below tries a grid of alpha values, refits SES at each one, and records the SSE.

```r title="Grid-search alpha by minimising squared error"
alphas <- seq(0.05, 0.60, by = 0.01)
sse <- sapply(alphas, function(a) sum(residuals(ses(Nile, alpha = a))^2))
best <- alphas[which.min(sse)]
best
#> [1] 0.25
```

The grid minimum lands at 0.25, right next to the 0.2457 that `ses()` reported. Our search steps in coarse jumps of 0.01, while `ses()` optimises alpha as a continuous number, which is why the two differ only in the third decimal. A quick plot of the SSE curve shows a clear valley at that alpha.

```r title="Plot the error curve against alpha"
plot(alphas, sse, type = "l", lwd = 2,
     xlab = "alpha", ylab = "Sum of squared errors")
abline(v = best, col = "red", lty = 2)
```

[NOTE]
**The manual grid and the automatic fit will not match to the last decimal.** Our loop only checks alpha in steps of 0.01, whereas ses() uses continuous optimisation, so expect the grid answer to sit one small step away from the exact value ses() reports.

**Try it:** Run the same grid search on the built-in `LakeHuron` series (annual lake level) and see which alpha it prefers.

```r title="Your turn: find the best alpha for LakeHuron"
ex_al <- seq(0.05, 0.99, by = 0.01)
# Compute the SSE for each alpha, then pick the minimiser
ex_sse <- sapply(ex_al, function(a) NA)   # replace NA with the SSE expression
ex_al[which.min(ex_sse)]
# Expected: an alpha very close to 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Best alpha for LakeHuron"
ex_al <- seq(0.05, 0.99, by = 0.01)
ex_sse <- sapply(ex_al, function(a) sum(residuals(ses(LakeHuron, alpha = a))^2))
ex_al[which.min(ex_sse)]
#> [1] 0.99
```

**Explanation:** LakeHuron is very persistent from one year to the next, so the best SES leans almost entirely on the most recent value. An alpha near 1 is a hint that SES is barely smoothing at all, a point we return to in the section on when to use SES.

</details>

## How do you read the forecast and its prediction intervals?

A forecast object carries two things worth reading: how well the model fit the past, and how uncertain it is about the future. The `accuracy()` function summarises the in-sample fit with a row of error metrics.

```r title="Summarise how well the model fit the history"
round(accuracy(fit), 2)
#>                  ME   RMSE    MAE   MPE  MAPE MASE ACF1
#> Training set -12.43 142.78 112.25 -3.66 12.95 0.84 0.13
```

The two you will use most are RMSE (root mean squared error, 142.78 here) and MAPE (mean absolute percentage error, 12.95, meaning the fitted values are off by about 13% on average). MASE below 1 means SES beats a naive one-step benchmark on the training data. These numbers describe fit, not future accuracy, but they are a useful first read.

Now the uncertainty. The point forecast is flat, but the prediction intervals are not. The block below forecasts ten years ahead and pulls out the upper 95% bound at each step.

```r title="Prediction intervals widen with the forecast horizon"
fit_h10 <- ses(Nile, h = 10)
round(as.numeric(fit_h10$upper[, "95%"]), 1)
#>  [1] 1088.0 1096.4 1104.6 1112.6 1120.3 1127.9 1135.3 1142.5 1149.6 1156.5
```

The upper bound climbs from 1088 at one year out to 1156 at ten years out. The point forecast never moves, but the model grows less certain the further ahead it looks, so the band around that flat line keeps widening. That widening is appropriate: SES estimates today's level, but it cannot rule out that the level will drift over the next decade.

[WARNING]
**A flat forecast is only trustworthy when the series has no trend.** If the data is clearly rising or falling, SES will still hand you a flat line, and it will be wrong in a very confident-looking way. Always check for trend before you trust the forecast.

**Try it:** Measure how much the 80% interval widens between the first and tenth forecast step.

```r title="Your turn: measure how fast the interval grows"
ex_fc <- ses(Nile, h = 10)
# 80% interval width = upper bound minus lower bound, at step 1 and step 10
w1  <- NA   # fill in for step 1
w10 <- NA   # fill in for step 10
round(c(h1 = w1, h10 = w10), 1)
# Expected: h1 clearly smaller than h10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Interval width at step 1 versus step 10"
ex_fc <- ses(Nile, h = 10)
w1  <- ex_fc$upper[1,  "80%"] - ex_fc$lower[1,  "80%"]
w10 <- ex_fc$upper[10, "80%"] - ex_fc$lower[10, "80%"]
round(c(h1 = w1, h10 = w10), 1)
#>  h1.80% h10.80% 
#>   369.7   459.2
```

**Explanation:** The 80% band is about 370 units wide one year out and about 459 units wide ten years out. Uncertainty compounds with the horizon even though the point forecast stays put.

</details>

## When should you use SES (and when not)?

Simple exponential smoothing assumes the series has no trend and no seasonality. If either is present, SES is the wrong tool and its flat forecast will lag reality. The decision is short: check for a trend, then check for a season.

![SES fits only when the series has no trend and no seasonality.](screenshots/Exponential-Smoothing-in-R-method-decision.webp)

*Figure 2: SES fits only when the series has no trend and no seasonality.*

When there is a trend, Holt's method adds a slope term; when there is a season too, Holt-Winters adds a seasonal term. SES is the base case, the model for a level that only wanders. To see it fail on purpose, apply SES to an obviously rising series and watch the forecast flatten out.

```r title="SES ignores a clear upward trend"
set.seed(101)
trending <- ts(1:30 + rnorm(30, 0, 2))
autoplot(ses(trending, h = 10)) +
  ggplot2::ggtitle("SES flattens a trending series")
```

The data climbs steadily, but the SES forecast is a horizontal line at the last level, missing the trend entirely. That is the picture of a misapplied model.

On a genuine level series, though, SES earns its keep. Here we split the Nile data into a training period and a test period, then compare SES against two simple benchmarks: the naive forecast (carry the last value forward) and the mean forecast (predict the historical average). We score each by RMSE on the held-out test years.

```r title="Compare SES with naive and mean baselines"
train <- window(Nile, end = 1955)
test  <- window(Nile, start = 1956)
h <- length(test)

rmse <- function(f) accuracy(f, test)["Test set", "RMSE"]
round(c(
  ses   = rmse(ses(train,   h = h)),
  naive = rmse(naive(train, h = h)),
  mean  = rmse(meanf(train, h = h))
), 2)
#>    ses  naive   mean 
#> 124.33 129.21 131.54
```

SES wins with the lowest test RMSE (124.33), beating both the naive last-value forecast and the long-run mean. That is exactly the promise from the first section made concrete: SES sits between the two crude baselines and, on a level series, outperforms them both.

[TIP]
**An estimated alpha near 1 is a warning sign.** If ses() pushes alpha close to 1, the model is essentially copying the last observation, which usually means the series has structure (like a trend) that SES cannot capture. Treat it as a nudge to try Holt's method or ETS.

**Try it:** Fit SES to the `LakeHuron` series, read the estimated alpha, and decide whether SES is really smoothing the data.

```r title="Your turn: is SES a good fit for LakeHuron?"
ex_lh <- ses(LakeHuron, h = 5)
ex_lh$model$par["alpha"]
# Expected: alpha very close to 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="LakeHuron alpha diagnosis"
ex_lh <- ses(LakeHuron, h = 5)
ex_lh$model$par["alpha"]
#>     alpha 
#> 0.9998999
```

**Explanation:** Alpha is almost exactly 1, so SES is doing essentially no smoothing, it is just repeating the last value like a naive forecast. That is a sign LakeHuron carries year-to-year structure a richer model (such as an AR model or ETS) could exploit.

</details>

## Complete Example: forecasting New Haven temperature

Let's put every piece together on a fresh dataset. The built-in `nhtemp` series records the mean annual temperature in New Haven, Connecticut, from 1912 to 1971 in degrees Fahrenheit. It has no seasonal cycle (each value is already a yearly average) and only a faint drift, which makes it a natural fit for SES. We fit the model and read its parameters first.

```r title="Fit SES to New Haven annual temperature"
fit_nh <- ses(nhtemp, h = 5)
fit_nh$model
#> Simple exponential smoothing 
#> 
#> Call:
#> ses(y = nhtemp, h = 5)
#> 
#>   Smoothing parameters:
#>     alpha = 0.182 
#> 
#>   Initial states:
#>     l = 50.2755 
#> 
#>   sigma:  1.1455
#> 
#>      AIC     AICc      BIC 
#> 265.9298 266.3584 272.2129
```

The optimiser settles on `alpha = 0.182`, a moderate value that says recent years matter more than distant ones but no single year dominates. Now we check the fit and read the forecast.

```r title="Check the fit and forecast five years ahead"
round(accuracy(fit_nh), 3)
#>                 ME  RMSE   MAE   MPE  MAPE  MASE   ACF1
#> Training set 0.146 1.126 0.895 0.242 1.749 0.751 -0.007
fit_nh
#>      Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 1972       51.87046 50.40241 53.33850 49.62528 54.11564
#> 1973       51.87046 50.37830 53.36262 49.58839 54.15252
#> 1974       51.87046 50.35456 53.38635 49.55210 54.18882
#> 1975       51.87046 50.33120 53.40972 49.51636 54.22455
#> 1976       51.87046 50.30818 53.43273 49.48116 54.25975
```

The MAPE of 1.749 says the fitted temperatures are within about 1.7% of the actual values, an excellent fit for this smooth series. The forecast holds flat at 51.87 degrees, with a 95% interval of roughly 49.6 to 54.1 in the first year that widens slightly each year after. A quick plot rounds off the workflow.

```r title="Plot the New Haven temperature forecast"
autoplot(fit_nh) +
  ggplot2::ylab("Mean annual temperature (F)") +
  ggplot2::ggtitle("SES forecast of New Haven temperature")
```

That is the full loop: fit, inspect alpha, check accuracy, read the forecast and its intervals, and plot the result.

## Practice Exercises

These capstone problems combine the ideas above. Each uses fresh variable names so nothing you ran earlier gets overwritten. Try them before opening the solutions.

### Exercise 1: Forecast the discoveries series

The built-in `discoveries` series counts great scientific discoveries per year from 1860 to 1959. Fit SES with a 4-year horizon, report the alpha that `ses()` chooses, and read off the point forecast.

```r title="Exercise 1: fit and read the forecast"
# Fit ses() to discoveries with h = 4
# Then extract the alpha and the point forecast

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_fit <- ses(discoveries, h = 4)
round(as.numeric(my_fit$model$par["alpha"]), 4)
#> [1] 0.1756
round(as.numeric(my_fit$mean), 3)
#> [1] 1.142 1.142 1.142 1.142
```

**Explanation:** The optimiser picks alpha 0.1756, a low value, so the forecast leans on many past years. As always the point forecast is flat, here about 1.142 discoveries per year.

</details>

### Exercise 2: Rebuild the final level by hand

Show that the SES forecast really is the last level from the recursion. Fit SES to `nhtemp`, pull out the estimated alpha and initial level, run the update rule yourself over the whole series, and confirm your final level equals the point forecast.

```r title="Exercise 2: reconstruct the level"
# 1. Fit ses(nhtemp) and extract par["alpha"] and par["l"]
# 2. Run the recursion level[t] = alpha*y[t] + (1-alpha)*level[t-1]
# 3. Compare tail(level, 1) with the point forecast

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fit_nh <- ses(nhtemp, h = 1)
my_a  <- my_fit_nh$model$par["alpha"]
my_l0 <- my_fit_nh$model$par["l"]
my_y  <- as.numeric(nhtemp)

my_lev <- numeric(length(my_y))
my_lev[1] <- my_a * my_y[1] + (1 - my_a) * my_l0
for (t in 2:length(my_y)) {
  my_lev[t] <- my_a * my_y[t] + (1 - my_a) * my_lev[t - 1]
}

round(tail(my_lev, 1), 4)
#> [1] 51.8705
round(as.numeric(my_fit_nh$mean[1]), 4)
#> [1] 51.8705
```

**Explanation:** Starting from the optimised initial level `l` and applying the update rule with the optimised alpha reproduces the forecast exactly (51.8705). The point forecast is nothing more than the final smoothed level.

</details>

### Exercise 3: Does SES beat a naive forecast on the Nile?

Split the Nile series into a training set (up to 1955) and a test set (1956 onward). Fit SES and a naive forecast on the training set, then compare their RMSE on the test set. Which one would you trust?

```r title="Exercise 3: train, test, compare"
# 1. window() the Nile series into train (end 1955) and test (start 1956)
# 2. Forecast the test length with ses() and naive()
# 3. Compare accuracy(..., test)["Test set", "RMSE"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_train <- window(Nile, end = 1955)
my_test  <- window(Nile, start = 1956)
my_h <- length(my_test)

round(c(
  ses   = accuracy(ses(my_train,   h = my_h), my_test)["Test set", "RMSE"],
  naive = accuracy(naive(my_train, h = my_h), my_test)["Test set", "RMSE"]
), 2)
#>    ses  naive 
#> 124.33 129.21
```

**Explanation:** SES posts a lower test RMSE (124.33) than the naive forecast (129.21), so on this level series the smoothed forecast generalises better than simply repeating the last value.

</details>

## Frequently Asked Questions

### What is the difference between SES and a moving average?

A moving average gives every observation in its window the same weight and ignores everything outside the window. Simple exponential smoothing keeps all of history but weights it, so recent values matter more and old values fade smoothly. That gentle fade is why SES usually reacts to change faster than a moving average of comparable smoothness.

### What alpha value should I choose?

In almost every case, let `ses()` choose it for you by minimising the sum of squared errors. If you must set it by hand, low values (0.1 to 0.3) suit noisy series where you want a stable, smooth forecast, and higher values suit series where recent observations really do carry the most information. An estimated alpha near 1 is a signal that SES may be too simple for the data.

### Can SES forecast data with a trend or seasonality?

No. Simple exponential smoothing models a level only, so it will flatten any trend and ignore any season. For a trending series use Holt's method, and for a seasonal series use Holt-Winters or let `ets()` pick the right components automatically.

### Why is the SES forecast a flat line?

Because SES tracks a single quantity, the current level, and its forecast for every future step is that same level. With no trend term to add a slope and no seasonal term to add a cycle, the point forecast has nowhere to go, so it stays flat while only the prediction intervals widen.

### How is ses() related to HoltWinters() and ets()?

All three fit exponential smoothing models. Base R's `HoltWinters()` can do simple smoothing too but minimises one-step errors slightly differently and lacks the tidy forecast object. The forecast package's `ses()` is a friendly wrapper around `ets()` restricted to the level-only model (known as ETS(A,N,N), meaning additive error, no trend, no season). Use `ses()` for clarity when you specifically want simple exponential smoothing, and `ets()` when you want the software to compare model forms for you.

## Summary

Simple exponential smoothing is the base model of the exponential smoothing family: one level, one parameter, a flat forecast. Everything flows from the alpha smoothing parameter.

![The moving parts of simple exponential smoothing in R.](screenshots/Exponential-Smoothing-in-R-overview-mindmap.webp)

*Figure 3: The moving parts of simple exponential smoothing in R.*

| Idea | What to remember |
|---|---|
| The model | Each level is `alpha * new value + (1 - alpha) * old level`; the forecast is the latest level |
| Alpha | Between 0 and 1; near 0 means slow and smooth (long memory), near 1 means reactive (short memory) |
| Weights | Past observations get geometrically decaying weight `alpha * (1 - alpha)^j`, summing to 1 |
| ses() | Picks alpha and the initial level by minimising the sum of squared errors |
| The forecast | A flat point forecast with prediction intervals that widen over the horizon |
| When to use it | Only for series with no trend and no seasonality; an alpha near 1 hints the method is too simple |

The `ses()` function packages all of this into one call: it fits the level, optimises alpha, and returns a forecast with prediction intervals that widen with the horizon. Reach for it whenever you have a series that drifts around a level without marching up or cycling through seasons.

## References

1. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 2nd edition, Section 7.1: Simple exponential smoothing. [Link](https://otexts.com/fpp2/ses.html)
2. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition, Section 8.1: Simple exponential smoothing. [Link](https://otexts.com/fpp3/ses.html)
3. Hyndman, R.J. et al. forecast package documentation, `ses()` and `ets()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/ses.html)
4. forecast package on CRAN. [Link](https://cran.r-project.org/package=forecast)
5. NIST/SEMATECH *e-Handbook of Statistical Methods*, Section 6.4.3.1: Single Exponential Smoothing. [Link](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc431.htm)
6. R Core Team. `Nile` and `nhtemp` datasets, R datasets package documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/Nile.html)

## Continue Learning

- [ETS Models in R](ETS-Models-in-R.html): the `ets()` function generalises SES, adding trend and seasonality and picking the best model form automatically.
- [Holt-Winters in R](Holt-Winters-in-R.html): extend smoothing to series that have both a trend and a repeating seasonal cycle.
- [Moving Averages in R](Moving-Averages-in-R.html): the equal-weight cousin of exponential smoothing, and a good contrast for understanding why weighting recent data helps.
