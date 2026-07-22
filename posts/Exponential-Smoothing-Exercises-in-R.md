---
title: "Exponential Smoothing Exercises in R: 50 Practice Problems"
slug: "Exponential-Smoothing-Exercises-in-R"
description: "Fifty exponential smoothing exercises in R covering SES, Holt's trend, Holt-Winters seasonality, ETS selection, residual checks and backtesting. Hidden solutions."
keywords: "exponential smoothing exercises, exponential smoothing in R practice, Holt-Winters exercises R, ETS model exercises R, ses holt hw R problems"
mathjax: true
webr: true
date: "2026-07-22"
post_type: "EX"
sidebar_title: "Exponential Smoothing Exercises"
sidebar_order: 104
fr_parent: "Exponential-Smoothing-in-R.html"
auto_link_terms: "exponential smoothing exercises|exponential smoothing practice|holt-winters exercises|ets model exercises|holt's method exercises"
auto_link_case_sensitive: false
target_keyword: "exponential smoothing exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Exponential Smoothing Exercises in R: 50 Practice Problems

<p class="lead">Fifty practice problems on exponential smoothing in R: simple exponential smoothing, Holt's trend, damped trend, Holt-Winters seasonality, the ETS model space, residual diagnostics, prediction intervals and backtesting. Every problem ships with a hidden runnable solution and a short explanation of why it works.</p>

```r title="Run this once before any exercise"
library(forecast)
library(tibble)
library(dplyr)
```

## Section 1. Simple exponential smoothing and the level equation (8 problems)

### Exercise 1.1: Fit simple exponential smoothing to the Nile series

**Task:** The built-in `Nile` series records the annual flow of the river Nile from 1871 to 1970. Fit simple exponential smoothing with `ses()` and forecast five years ahead, then print the point forecasts. Save the forecast object to `ex_1_1`.

**Expected result:**

```
#> Time Series:
#> Start = 1971
#> End = 1975
#> Frequency = 1
#> [1] 805.3363 805.3363 805.3363 805.3363 805.3363
```

**Difficulty:** Beginner

[HINTS]
Simple exponential smoothing tracks a level and nothing else, so its forecast for every future period is the same number.
Call `ses(Nile, h = 5)` and print the `$mean` component of the result.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1$mean
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ses(Nile, h = 5)
ex_1_1$mean
#> Time Series:
#> Start = 1971
#> End = 1975
#> Frequency = 1
#> [1] 805.3363 805.3363 805.3363 805.3363 805.3363
```

**Explanation:** SES has one state, the level, and no trend or seasonal term, so every forecast horizon inherits the same final level estimate. That flat line is a feature, not a bug: it is the right answer when a series wanders around a slowly drifting mean with no persistent direction. If your series clearly trends, the flat forecast is your signal to move up to `holt()`.

</details>

### Exercise 1.2: Read the optimized smoothing parameter alpha out of the fit

**Task:** Refit simple exponential smoothing on `Nile` and pull the estimated smoothing parameter $\alpha$ out of the fitted model, rounded to four decimals. Report it as a named numeric value and save it to `ex_1_2`.

**Expected result:**

```
#>  alpha
#> 0.2457
```

**Difficulty:** Beginner

[HINTS]
The `ses()` return value carries the fitted model object inside it, and the estimated parameters live in that model.
Look at `fit$model$par` and subset the `"alpha"` element, then wrap it in `round()`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- round(ses(Nile, h = 5)$model$par["alpha"], 4)
ex_1_2
#>  alpha
#> 0.2457
```

**Explanation:** `ses()` returns a forecast object whose `$model` slot is a fitted `ets` object, and `$par` holds every estimated parameter including the initial state. An alpha near 0.25 means each new observation shifts the level by only a quarter of its surprise, so the fit is fairly smooth. Alpha near 1 would make the model chase the latest value like a naive forecast.

</details>

### Exercise 1.3: Compare the sum of squared errors for two alpha values

**Task:** Fit `ses()` on `Nile` twice, once letting R optimize alpha and once forcing `alpha = 0.2` with `initial = "simple"`. Compute the sum of squared residuals for each fit and compare them in a named vector rounded to one decimal. Save it to `ex_1_3`.

**Expected result:**

```
#>   optimal alpha_0.2
#>   2038674   2043112
```

**Difficulty:** Intermediate

[HINTS]
The optimizer is minimizing exactly one quantity, so recompute that quantity yourself from the one-step-ahead errors of each fit.
Pass `alpha = 0.2, initial = "simple"` to the second `ses()` call, then use `sum(residuals(fit)^2)` on both.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_opt  <- ses(Nile, h = 1)
fit_slow <- ses(Nile, h = 1, alpha = 0.2, initial = "simple")

ex_1_3 <- c(optimal   = round(sum(residuals(fit_opt)^2), 1),
            alpha_0.2 = round(sum(residuals(fit_slow)^2), 1))
ex_1_3
#>   optimal alpha_0.2
#>   2038674   2043112
```

**Explanation:** The optimal fit must have the smaller error sum, because that is the objective the optimizer minimizes. The gap here is tiny, roughly 0.2 percent, which tells you the SSE surface is flat near the optimum: a range of alpha values fits this series almost equally well. That flatness is common with short annual series and is a good reason not to over-interpret the exact alpha.

</details>

### Exercise 1.4: Rebuild the SES forecast by hand with a recursion

**Task:** Using the alpha and the initial level from the fitted `ses()` model on `Nile`, loop over every observation applying the level update $\ell_t = \alpha y_t + (1 - \alpha)\ell_{t-1}$ and confirm the final level matches the package forecast. Save the hand-computed value rounded to four decimals to `ex_1_4`.

**Expected result:**

```
#> [1] 805.3363
```

**Difficulty:** Advanced

[HINTS]
The forecast from SES is nothing more than the last level, so if you can reproduce the level path you can reproduce the forecast.
Seed the loop with `fit$model$states[1, 1]` and update `level <- alpha * y + (1 - alpha) * level` for each element of `Nile`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit   <- ses(Nile, h = 1)
alpha <- fit$model$par["alpha"]
level <- fit$model$states[1, 1]

for (y in as.numeric(Nile)) {
  level <- alpha * y + (1 - alpha) * level
}

ex_1_4 <- round(as.numeric(level), 4)
ex_1_4
#> [1] 805.3363

round(as.numeric(fit$mean[1]), 4)
#> [1] 805.3363
```

**Explanation:** Writing the recursion yourself proves there is no magic in `ses()`: it estimates two numbers, an initial level and alpha, then runs this one-line update through the data. The row `states[1, ]` is the pre-sample state $\ell_0$, not the first fitted level, which is why the loop starts there. Getting the same answer as the package is the cleanest possible check that you understand the model.

</details>

### Exercise 1.5: Show how the weight on past observations decays

**Task:** For a smoothing parameter of 0.3, compute the weights $\alpha(1-\alpha)^j$ that SES places on the most recent observation and the five before it, rounded to five decimals. Save the six weights to `ex_1_5`.

**Expected result:**

```
#> [1] 0.30000 0.21000 0.14700 0.10290 0.07203 0.05042
```

**Difficulty:** Beginner

[HINTS]
The weights form a geometric sequence, so you only need to raise one quantity to the powers 0 through 5.
Evaluate `0.3 * (1 - 0.3)^(0:5)` and round the result.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- 0.3
ex_1_5 <- round(a * (1 - a)^(0:5), 5)
ex_1_5
#> [1] 0.30000 0.21000 0.14700 0.10290 0.07203 0.05042

round(sum(a * (1 - a)^(0:19)), 4)
#> [1] 0.9992
```

**Explanation:** This is why the method is called exponential smoothing: the weights decline geometrically, so the observation from six periods ago counts about a sixth as much as today's. The weights sum to one in the limit, and after 20 terms they already account for 99.9 percent of the total. A smaller alpha stretches this decay out and produces a smoother, more sluggish level.

</details>

### Exercise 1.6: Extract the estimated initial level of the state path

**Task:** Fit `ses()` to `Nile` and pull out the estimated initial level, the value the state path starts from before it sees any data, rounded to three decimals. Save the number to `ex_1_6` and inspect the first three rows of the state matrix.

**Expected result:**

```
#>        l
#> 1110.734
```

**Difficulty:** Intermediate

[HINTS]
Exponential smoothing needs somewhere to start, and that starting point is estimated alongside alpha rather than assumed.
The fitted model carries a `states` matrix whose first row is the pre-sample state, so index `states[1, "l"]`.

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- ses(Nile, h = 1)$model
ex_1_6 <- round(m$states[1, "l"], 3)
ex_1_6
#>        l
#> 1110.734

head(m$states, 3)
#>             l
#> [1,] 1110.734
#> [2,] 1113.010
#> [3,] 1124.554
```

**Explanation:** By default `ses()` estimates $\ell_0$ jointly with alpha by maximum likelihood, which is why the `states` matrix has one more row than the series has observations. Passing `initial = "simple"` instead fixes $\ell_0$ at the first observation and estimates only alpha. On short series the choice matters, because a badly placed starting level takes many periods to wash out.

</details>

### Exercise 1.7: Watch SES collapse into a naive forecast on a trending series

**Task:** Fit simple exponential smoothing to `WWWusage`, the number of users connected to an internet server per minute, forecast eight periods ahead, and inspect both the forecasts and the fitted alpha. Save the forecast object to `ex_1_7`.

**Expected result:**

```
#> [1] 220.0002 220.0002 220.0002 220.0002 220.0002 220.0002 220.0002 220.0002
#>  alpha
#> 0.9999
```

**Difficulty:** Intermediate

[HINTS]
When a series has momentum, a level-only model can only keep up by trusting the newest observation almost completely.
Fit `ses(WWWusage, h = 8)` and print both `$mean` and `round(fit$model$par["alpha"], 4)`.

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7$mean
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- ses(WWWusage, h = 8)
as.numeric(ex_1_7$mean)
#> [1] 220.0002 220.0002 220.0002 220.0002 220.0002 220.0002 220.0002 220.0002

round(ex_1_7$model$par["alpha"], 4)
#>  alpha
#> 0.9999
```

**Explanation:** Alpha is pinned at its upper bound, so the level equation reduces to $\ell_t \approx y_t$ and the forecast is essentially the last observed value. That is the naive forecast wearing a disguise. An alpha of 1 is a diagnostic, not a result: it says the level-only model has no way to express the trend it can see, and you should fit `holt()` instead.

</details>

### Exercise 1.8: Forecast a stable support-ticket volume for the next four weeks

**Task:** A support team lead needs a simple baseline for weekly ticket volume, which has bounced around a stable level for 16 weeks. Fit `ses()` to the inline series below, forecast four weeks ahead, and report the point forecasts plus the fitted alpha. Save the forecast object to `ex_1_8`.

**Expected result:**

```
#> [1] 488.31 488.31 488.31 488.31
#> alpha
#> 1e-04
#>   RMSE    MAE
#> 13.770 11.563
```

**Difficulty:** Intermediate

[HINTS]
When a series is pure noise around a fixed mean, the best level estimate uses all the history rather than just the recent past.
Build the `ts`, call `ses(tickets, h = 4)`, and read alpha from `fit$model$par`.

```r title="Your turn"
tickets <- ts(c(482, 465, 501, 478, 490, 470, 512, 495, 486, 503, 477, 492,
                499, 468, 507, 488))

ex_1_8 <- # your code here
ex_1_8$mean
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tickets <- ts(c(482, 465, 501, 478, 490, 470, 512, 495, 486, 503, 477, 492,
                499, 468, 507, 488))

ex_1_8 <- ses(tickets, h = 4)
as.numeric(ex_1_8$mean)
#> [1] 488.31 488.31 488.31 488.31

round(ex_1_8$model$par["alpha"], 4)
#> alpha
#> 1e-04

round(accuracy(ex_1_8)[, c("RMSE", "MAE")], 3)
#>   RMSE    MAE
#> 13.770 11.563
```

**Explanation:** Alpha collapses to its lower bound, which turns the level into an equally weighted average of the whole history. That is exactly right for a series with no drift: averaging 16 weeks beats chasing last week's noise. Alpha near 0 and alpha near 1 are the two informative extremes, and here the low value is telling you the series has no memory worth tracking.

</details>

## Section 2. Adding trend: Holt's linear and damped methods (8 problems)

### Exercise 2.1: Forecast ten periods ahead with Holt's linear trend method

**Task:** Fit Holt's linear trend method to `WWWusage` with `holt()` and forecast ten periods ahead, then print the point forecasts rounded to two decimals. Save the forecast object to `ex_2_1` and note whether the path rises or falls.

**Expected result:**

```
#>  [1] 218 216 214 212 210 208 206 204 202 200
```

**Difficulty:** Beginner

[HINTS]
Holt's method adds a second state, a slope, so the forecast becomes a straight line rather than a flat one.
Call `holt(WWWusage, h = 10)` and round `$mean`.

```r title="Your turn"
ex_2_1 <- # your code here
round(ex_2_1$mean, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- holt(WWWusage, h = 10)
round(as.numeric(ex_2_1$mean), 2)
#>  [1] 218 216 214 212 210 208 206 204 202 200
```

**Explanation:** The forecast is $\ell_T + h b_T$, a straight line extrapolating the final level and slope. `WWWusage` was falling at the end of the sample, so the line slopes down by two users per minute per period. This is the method's biggest risk: nothing stops that line, so a long horizon can produce forecasts far outside anything the series has ever done.

</details>

### Exercise 2.2: Inspect all four parameters of a Holt fit

**Task:** Take the Holt fit on `WWWusage` from the previous exercise and print every estimated parameter, the two smoothing parameters and the two initial states, rounded to four decimals. Save the rounded vector to `ex_2_2`.

**Expected result:**

```
#>   alpha    beta       l       b
#>  0.9999  0.9999 85.0834  3.1017
```

**Difficulty:** Beginner

[HINTS]
A trend model estimates two smoothing weights and two starting values, and they all live in the same place.
Print `round(fit$model$par, 4)`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- round(holt(WWWusage, h = 10)$model$par, 4)
ex_2_2
#>   alpha    beta       l       b
#>  0.9999  0.9999 85.0834  3.1017
```

**Explanation:** Alpha weights new information into the level and beta weights it into the slope. Both sit at their upper bound here, meaning the slope is re-estimated almost entirely from the most recent change, which makes the trend jumpy. Beta near 0 would give you an almost fixed slope estimated across the whole sample. Note beta in the `forecast` package is the $\beta^*$ of the standard textbook parameterisation.

</details>

### Exercise 2.3: Damp the trend and read the damping parameter

**Task:** Refit `WWWusage` with `holt(damped = TRUE)` for ten periods ahead, print the point forecasts rounded to two decimals, and extract the damping parameter phi rounded to four decimals. Save the forecast object to `ex_2_3`.

**Expected result:**

```
#>  [1] 218.37 217.04 215.95 215.07 214.35 213.76 213.28 212.89 212.57 212.31
#>    phi
#> 0.8149
```

**Difficulty:** Intermediate

[HINTS]
There is an argument that shrinks each successive step of the trend so the forecast path flattens out instead of running away.
Pass `damped = TRUE` to `holt()` and read `fit$model$par["phi"]`.

```r title="Your turn"
ex_2_3 <- # your code here
round(ex_2_3$mean, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- holt(WWWusage, damped = TRUE, h = 10)
round(as.numeric(ex_2_3$mean), 2)
#>  [1] 218.37 217.04 215.95 215.07 214.35 213.76 213.28 212.89 212.57 212.31

round(ex_2_3$model$par["phi"], 4)
#>    phi
#> 0.8149
```

**Explanation:** With damping the forecast becomes $\ell_T + (\phi + \phi^2 + \dots + \phi^h) b_T$, so each extra step contributes less than the one before. With $\phi = 0.81$ the increments shrink by about 19 percent per period and the path converges to an asymptote. Damped trend is the default recommendation for automated forecasting because it rarely blows up on long horizons.

</details>

### Exercise 2.4: Compare linear and damped trends at a 30-step horizon

**Task:** Forecast `WWWusage` 30 periods ahead with both plain Holt and damped Holt, then compare the final forecast value from each method in a named vector rounded to two decimals. Save the comparison to `ex_2_4`.

**Expected result:**

```
#> linear damped
#> 159.99 211.19
```

**Difficulty:** Intermediate

[HINTS]
The two methods barely differ over a few steps, so push the horizon out until the difference becomes obvious.
Build both forecasts with `h = 30` and compare `tail(fc$mean, 1)` from each.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
l30 <- holt(WWWusage, h = 30)$mean
d30 <- holt(WWWusage, damped = TRUE, h = 30)$mean

ex_2_4 <- c(linear = round(as.numeric(tail(l30, 1)), 2),
            damped = round(as.numeric(tail(d30, 1)), 2))
ex_2_4
#> linear damped
#> 159.99 211.19
```

**Explanation:** After 30 steps the undamped line has fallen 60 units while the damped path has flattened out near 211. The gap grows linearly with the horizon, which is why damping matters most for long-range planning and hardly at all for one-step forecasting. If a stakeholder needs a 12 month view, this single comparison usually settles the choice.

</details>

### Exercise 2.5: Let AICc choose between the damped and undamped trend

**Task:** Fit `ets()` on `WWWusage` twice, once with model `"AAN"` and `damped = FALSE` and once with `damped = TRUE`, then compare their AICc values in a named vector rounded to two decimals. Save the comparison to `ex_2_5`.

**Expected result:**

```
#>    AAN   AAdN
#> 729.33 718.63
```

**Difficulty:** Intermediate

[HINTS]
Damping costs one extra parameter, so the question is whether the fit improves by more than that penalty.
Fit both with `ets(WWWusage, model = "AAN", damped = ...)` and compare the `$aicc` element.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a1 <- ets(WWWusage, model = "AAN", damped = FALSE)
a2 <- ets(WWWusage, model = "AAN", damped = TRUE)

ex_2_5 <- c(AAN = round(a1$aicc, 2), AAdN = round(a2$aicc, 2))
ex_2_5
#>    AAN   AAdN
#> 729.33 718.63
```

**Explanation:** Lower AICc wins, so the damped model is preferred by about 10.7 units, which is a decisive margin. AICc penalises the extra phi parameter and the damped fit still comes out ahead, meaning the improvement in likelihood is real rather than a reward for flexibility. Note that AICc is only comparable across models fitted to the same data on the same scale.

</details>

### Exercise 2.6: Verify the Holt forecast equals level plus h times slope

**Task:** Fit `holt()` on `WWWusage` with a five-step horizon, extract the final level and slope from the state matrix, and confirm by hand that the fifth forecast equals level plus five times slope. Save the four numbers as a named vector rounded to three decimals in `ex_2_6`.

**Expected result:**

```
#>       level       slope   h5_manual h5_forecast
#>     220.000      -2.000     209.998     209.998
```

**Difficulty:** Advanced

[HINTS]
The forecast equation for Holt's method is a straight line built entirely from the two states at the end of the sample.
Take `tail(fit$model$states, 1)` and combine its `"l"` and `"b"` columns, then compare with `fit$mean[5]`.

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit26 <- holt(WWWusage, h = 5)
st <- tail(fit26$model$states, 1)

ex_2_6 <- round(c(level       = unname(st[, "l"]),
                  slope       = unname(st[, "b"]),
                  h5_manual   = unname(st[, "l"] + 5 * st[, "b"]),
                  h5_forecast = as.numeric(fit26$mean[5])), 3)
ex_2_6
#>       level       slope   h5_manual h5_forecast
#>     220.000      -2.000     209.998     209.998
```

**Explanation:** The `states` matrix is the whole model laid out in the open, and its last row is everything the forecast function needs. Matching the package output by hand confirms that a Holt forecast contains no information beyond those two numbers. The tiny gap in the third decimal comes from rounding the states, not from a different formula.

</details>

### Exercise 2.7: Rebuild Holt's two-equation recursion from scratch

**Task:** Using the alpha, beta and initial states from a Holt fit on `WWWusage`, run both update equations across the full series in a loop and confirm the resulting one-step forecast matches the package. Save the two values as a named vector rounded to three decimals in `ex_2_7`.

**Expected result:**

```
#>  manual    holt
#> 217.999 217.999
```

**Difficulty:** Advanced

[HINTS]
Two states means two update lines inside the loop, and the level update has to use the previous level plus the previous slope.
Update `level <- alpha * y + (1 - alpha) * (level_prev + b)` then `b <- beta * (level - level_prev) + (1 - beta) * b`.

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f   <- holt(WWWusage, h = 1)
al  <- f$model$par["alpha"]
be  <- f$model$par["beta"]
lev <- f$model$states[1, "l"]
b   <- f$model$states[1, "b"]

for (y in as.numeric(WWWusage)) {
  lprev <- lev
  lev   <- al * y + (1 - al) * (lprev + b)
  b     <- be * (lev - lprev) + (1 - be) * b
}

ex_2_7 <- round(c(manual = as.numeric(lev + b),
                  holt   = as.numeric(f$mean[1])), 3)
ex_2_7
#>  manual    holt
#> 217.999 217.999
```

**Explanation:** The order matters: the slope update needs the change in level, so the level must be updated first and the previous value stored. Getting these two lines in the wrong order is the classic bug when people implement Holt by hand. Notice the level equation smooths towards `level_prev + b`, the one-step forecast, not towards `level_prev` as in SES.

</details>

### Exercise 2.8: Produce a damped six-month subscriber forecast for a growth review

**Task:** A SaaS growth team has 16 months of subscriber counts and wants a deliberately conservative six-month projection for a board review. Fit a damped Holt model to the inline series below, forecast six months, and report the point forecasts plus the fitted parameters. Save the forecast object to `ex_2_8`.

**Expected result:**

```
#> [1] 3581.5 3707.8 3831.5 3952.8 4071.6 4188.1
#>  alpha   beta    phi
#> 0.8846 0.0001 0.9800
```

**Difficulty:** Intermediate

[HINTS]
A board projection should not assume the current growth rate continues untouched forever, so pick the trend variant that flattens.
Fit `holt(subs, damped = TRUE, h = 6)` and read `fit$model$par` for alpha, beta and phi.

```r title="Your turn"
subs <- ts(c(1200, 1310, 1445, 1602, 1748, 1930, 2088, 2265, 2402, 2571,
             2710, 2884, 3012, 3190, 3301, 3455),
           start = c(2024, 1), frequency = 12)

ex_2_8 <- # your code here
round(ex_2_8$mean, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
subs <- ts(c(1200, 1310, 1445, 1602, 1748, 1930, 2088, 2265, 2402, 2571,
             2710, 2884, 3012, 3190, 3301, 3455),
           start = c(2024, 1), frequency = 12)

ex_2_8 <- holt(subs, damped = TRUE, h = 6)
round(as.numeric(ex_2_8$mean), 1)
#> [1] 3581.5 3707.8 3831.5 3952.8 4071.6 4188.1

round(ex_2_8$model$par[c("alpha", "beta", "phi")], 4)
#>  alpha   beta    phi
#> 0.8846 0.0001 0.9800
```

**Explanation:** Beta at its lower bound means the slope is treated as near constant, estimated across all 16 months instead of from the last few. Phi at 0.98 is the upper bound `forecast` allows, so the damping is mild and the six-month path still rises steadily. Reporting these three parameters alongside the numbers is what makes the projection defensible in a review.

</details>

## Section 3. Adding seasonality: Holt-Winters (9 problems)

### Exercise 3.1: Forecast a year of monthly CO2 with additive Holt-Winters

**Task:** The `co2` series holds monthly atmospheric CO2 concentrations at Mauna Loa, a smooth upward trend with a steady seasonal swing. Fit additive Holt-Winters with `hw()` and forecast 12 months, then print the point forecasts rounded to two decimals. Save the forecast object to `ex_3_1`.

**Expected result:**

```
#>         Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
#> 1998 365.15 365.96 366.77 368.12 368.64 367.92 366.42 364.35 362.57 362.81 364.27 365.67
```

**Difficulty:** Beginner

[HINTS]
The seasonal swing in this series has roughly the same size every year regardless of the level, which tells you which seasonal form to use.
Call `hw(co2, seasonal = "additive", h = 12)` and round `$mean`.

```r title="Your turn"
ex_3_1 <- # your code here
round(ex_3_1$mean, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- hw(co2, seasonal = "additive", h = 12)
round(ex_3_1$mean, 2)
#>         Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
#> 1998 365.15 365.96 366.77 368.12 368.64 367.92 366.42 364.35 362.57 362.81 364.27 365.67
```

**Explanation:** Holt-Winters adds a third state, a vector of seasonal terms, one per period of the seasonal cycle. Additive seasonality adds a fixed number of ppm to each month, which suits `co2` because the May peak sits about the same distance above trend every year. The forecast keeps rising because the trend state carries on while the seasonal pattern repeats.

</details>

### Exercise 3.2: Forecast air passengers with multiplicative Holt-Winters

**Task:** The `AirPassengers` series shows monthly airline passengers from 1949 to 1960, with seasonal swings that grow as the series grows. Fit multiplicative Holt-Winters and forecast 12 months ahead, printing the point forecasts rounded to one decimal. Save the forecast object to `ex_3_2`.

**Expected result:**

```
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 445.9 418.9 466.4 496.1 507.1 575.6 666.7 658.5 550.1 491.7 418.8 463.7
```

**Difficulty:** Beginner

[HINTS]
When the peaks and troughs widen as the level climbs, the seasonal effect is proportional rather than a fixed amount.
Call `hw(AirPassengers, seasonal = "multiplicative", h = 12)`.

```r title="Your turn"
ex_3_2 <- # your code here
round(ex_3_2$mean, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- hw(AirPassengers, seasonal = "multiplicative", h = 12)
round(ex_3_2$mean, 1)
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 445.9 418.9 466.4 496.1 507.1 575.6 666.7 658.5 550.1 491.7 418.8 463.7
```

**Explanation:** Multiplicative seasonality multiplies the level by a factor per month, so a July index of about 1.16 means July runs 16 percent above the deseasonalized level whatever that level is. Fitting an additive model here would understate the summer peak in later years and overstate it in the early ones. The visual test is simple: fan-shaped seasonal swings mean multiplicative.

</details>

### Exercise 3.3: Score additive against multiplicative seasonality on the same series

**Task:** Fit both additive and multiplicative Holt-Winters to `AirPassengers`, then compare their AICc values and their training-set RMSE side by side in named vectors rounded appropriately. Save the AICc comparison to `ex_3_3`.

**Expected result:**

```
#>       additive multiplicative
#>        1570.73        1410.51
#>    add   mult
#> 17.015 10.633
```

**Difficulty:** Intermediate

[HINTS]
Do not trust the eye alone: fit both seasonal forms and let an information criterion and an error measure agree or disagree.
Compare `fit$model$aicc` for each, then `accuracy(fit)[, "RMSE"]`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ha <- hw(AirPassengers, seasonal = "additive", h = 12)
hm <- hw(AirPassengers, seasonal = "multiplicative", h = 12)

ex_3_3 <- round(c(additive = ha$model$aicc, multiplicative = hm$model$aicc), 2)
ex_3_3
#>       additive multiplicative
#>        1570.73        1410.51

round(c(add = accuracy(ha)[, "RMSE"], mult = accuracy(hm)[, "RMSE"]), 3)
#>    add   mult
#> 17.015 10.633
```

**Explanation:** Both measures point the same way and the margin is enormous: 160 AICc units and a 37 percent cut in RMSE. AICc and training RMSE do not always agree, because AICc penalises parameters while RMSE does not, so when they do agree you can stop worrying. Both models have the same parameter count here, which makes the AICc comparison a pure likelihood comparison.

</details>

### Exercise 3.4: Reproduce multiplicative seasonality with logs and an additive model

**Task:** Fit additive Holt-Winters to `log(AirPassengers)`, back-transform the 12 forecasts with `exp()`, and compare them against the multiplicative forecasts from Exercise 3.2. Save the back-transformed forecasts rounded to one decimal to `ex_3_4`.

**Expected result:**

```
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 450.0 442.5 511.1 502.0 506.1 578.1 645.7 645.9 562.5 496.6 435.4 494.1
#> multiplicative fit, for comparison:
#>  [1] 445.9 418.9 466.4 496.1 507.1 575.6 666.7 658.5 550.1 491.7 418.8 463.7
```

**Difficulty:** Advanced

[HINTS]
Taking logs turns proportional effects into constant ones, which is why a log transform and multiplicative seasonality are close relatives.
Fit `hw(log(AirPassengers), seasonal = "additive", h = 12)` and apply `exp()` to `$mean`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
hl <- hw(log(AirPassengers), seasonal = "additive", h = 12)
ex_3_4 <- round(exp(hl$mean), 1)
ex_3_4
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 450.0 442.5 511.1 502.0 506.1 578.1 645.7 645.9 562.5 496.6 435.4 494.1

round(as.numeric(hm$mean), 1)
#>  [1] 445.9 418.9 466.4 496.1 507.1 575.6 666.7 658.5 550.1 491.7 418.8 463.7
```

**Explanation:** The two approaches are close but not identical, and the reason is the error term. Log-additive assumes additive errors on the log scale, which is multiplicative error on the original scale, while `hw(seasonal = "multiplicative")` keeps additive errors on the original scale. Back-transforming with `exp()` also returns the median rather than the mean, which biases the point forecast slightly low unless you apply a bias adjustment.

</details>

### Exercise 3.5: Read the twelve seasonal indices out of a fitted model

**Task:** Extract the final row of seasonal states from the multiplicative Holt-Winters fit on `AirPassengers`, name the values `s1` through `s12`, and round to three decimals. Save the named vector to `ex_3_5` and identify which index is largest.

**Expected result:**

```
#>    s1    s2    s3    s4    s5    s6    s7    s8    s9   s10   s11   s12
#> 0.901 0.819 0.967 1.088 1.310 1.334 1.158 1.027 1.010 0.956 0.863 0.925
```

**Difficulty:** Intermediate

[HINTS]
The seasonal terms are stored alongside the level and slope in the same state matrix you have already been indexing.
Take `tail(fit$model$states, 1)` and subset the columns named by `paste0("s", 1:12)`.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
st <- tail(hm$model$states, 1)
ex_3_5 <- setNames(round(as.numeric(st[, paste0("s", 1:12)]), 3),
                   paste0("s", 1:12))
ex_3_5
#>    s1    s2    s3    s4    s5    s6    s7    s8    s9   s10   s11   s12
#> 0.901 0.819 0.967 1.088 1.310 1.334 1.158 1.027 1.010 0.956 0.863 0.925
```

**Explanation:** Indices above 1 mark months that run above the deseasonalized level and indices below 1 mark months that run below it. Read them in reverse chronological order: `s1` is the most recent month in the cycle, not January. That indexing convention trips up almost everyone the first time, so always check against a month you know is a peak before labelling a chart with these numbers.

</details>

### Exercise 3.6: Compare the base R HoltWinters function with hw

**Task:** Fit `HoltWinters()` from base stats to `AirPassengers` with multiplicative seasonality, then extract the final level and slope coefficients along with the three smoothing parameters. Save the coefficient pair rounded to three decimals to `ex_3_6`.

**Expected result:**

```
#>       a       b
#> 469.323   3.022
#> alpha.alpha   beta.beta gamma.gamma
#>      0.2756      0.0327      0.8707
```

**Difficulty:** Intermediate

[HINTS]
Base R ships its own Holt-Winters implementation that minimises squared errors rather than fitting a state space likelihood.
Use `HoltWinters(AirPassengers, seasonal = "multiplicative")` and pull `coef(fit)[c("a", "b")]`.

```r title="Your turn"
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
hwb <- HoltWinters(AirPassengers, seasonal = "multiplicative")
ex_3_6 <- round(coef(hwb)[c("a", "b")], 3)
ex_3_6
#>       a       b
#> 469.323   3.022

round(c(alpha = hwb$alpha, beta = hwb$beta, gamma = hwb$gamma), 4)
#> alpha.alpha   beta.beta gamma.gamma
#>      0.2756      0.0327      0.8707
```

**Explanation:** `HoltWinters()` initialises its states from a decomposition of the first few cycles and optimises squared error, while `hw()` estimates initial states and parameters jointly by maximum likelihood in a state space framework. The parameter estimates differ as a result. Prefer `hw()` or `ets()` in new work: only the state space version gives you AICc for model selection and analytic prediction intervals.

</details>

### Exercise 3.7: Test whether damping helps a seasonal model

**Task:** Fit multiplicative Holt-Winters on `AirPassengers` with `damped = TRUE`, then compare its AICc against the undamped fit and report phi alongside both values. Save the three numbers rounded to three decimals as a named vector in `ex_3_7`.

**Expected result:**

```
#>         phi aicc_damped  aicc_plain
#>       0.980    1424.773    1410.511
```

**Difficulty:** Intermediate

[HINTS]
Damping is not automatically an improvement, so fit it and let the information criterion referee.
Pass `damped = TRUE` to `hw()` and compare `$model$aicc` against the undamped fit from Exercise 3.3.

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
hd <- hw(AirPassengers, seasonal = "multiplicative", damped = TRUE, h = 12)

ex_3_7 <- round(c(phi         = unname(hd$model$par["phi"]),
                  aicc_damped = hd$model$aicc,
                  aicc_plain  = hm$model$aicc), 3)
ex_3_7
#>         phi aicc_damped  aicc_plain
#>       0.980    1424.773    1410.511
```

**Explanation:** Here damping loses by 14 AICc units, so the extra parameter does not earn its keep. Phi sits at the 0.98 ceiling that `forecast` imposes, another sign the data wants no damping at all: the trend in `AirPassengers` is genuine and persistent. Always fit both rather than assuming damped trend is the safer default on every series.

</details>

### Exercise 3.8: Fit Holt-Winters to a quarterly series and confirm the seasonal period

**Task:** Build a quarterly `ts` from the 16 values below starting in Q1 2021, fit additive Holt-Winters, forecast four quarters, and confirm the series frequency is 4. Save the forecast object to `ex_3_8`.

**Expected result:**

```
#>        Qtr1   Qtr2   Qtr3   Qtr4
#> 2025 118.58 137.81 131.05 176.05
#> [1] 4
```

**Difficulty:** Intermediate

[HINTS]
Seasonal exponential smoothing reads the length of the seasonal cycle from the series object, not from an argument you pass.
Set `frequency = 4` in `ts()` then call `hw(q, seasonal = "additive", h = 4)`.

```r title="Your turn"
q <- ts(c(88, 102, 96, 131, 94, 111, 104, 142, 101, 119, 112, 154,
          109, 128, 121, 166), start = c(2021, 1), frequency = 4)

ex_3_8 <- # your code here
round(ex_3_8$mean, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
q <- ts(c(88, 102, 96, 131, 94, 111, 104, 142, 101, 119, 112, 154,
          109, 128, 121, 166), start = c(2021, 1), frequency = 4)

ex_3_8 <- hw(q, seasonal = "additive", h = 4)
round(ex_3_8$mean, 2)
#>        Qtr1   Qtr2   Qtr3   Qtr4
#> 2025 118.58 137.81 131.05 176.05

frequency(q)
#> [1] 4
```

**Explanation:** If you forget `frequency = 4` the series is treated as non-seasonal and `hw()` stops with an error about the data not being seasonal. Four years of quarterly data is also close to the practical minimum: seasonal exponential smoothing needs at least two full cycles to estimate the seasonal states, and more cycles make those estimates far steadier.

</details>

### Exercise 3.9: Build a four-quarter retail forecast with the seasonal states reported

**Task:** A retail planner needs next year's quarterly revenue for a category whose Q4 spike scales with the level. Fit multiplicative Holt-Winters to the inline series below, forecast four quarters, and report the final level, slope and seasonal indices. Save the forecast object to `ex_3_9`.

**Expected result:**

```
#> [1] 275.6 262.5 306.9 408.8
#>   level   slope
#> 301.998   4.874
#>    s1    s2    s3    s4
#> 1.272 0.969 0.842 0.898
```

**Difficulty:** Advanced

[HINTS]
A planner needs both the numbers and the reason behind them, so extract the states as well as the point forecasts.
Fit `hw(sales, seasonal = "multiplicative", h = 4)` then read `tail(fit$model$states, 1)`.

```r title="Your turn"
sales <- ts(c(210, 198, 232, 305, 224, 214, 250, 331, 241, 228, 268, 358,
              258, 246, 288, 384), start = c(2021, 1), frequency = 4)

ex_3_9 <- # your code here
round(ex_3_9$mean, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- ts(c(210, 198, 232, 305, 224, 214, 250, 331, 241, 228, 268, 358,
              258, 246, 288, 384), start = c(2021, 1), frequency = 4)

ex_3_9 <- hw(sales, seasonal = "multiplicative", h = 4)
round(as.numeric(ex_3_9$mean), 1)
#> [1] 275.6 262.5 306.9 408.8

s39 <- tail(ex_3_9$model$states, 1)
round(setNames(as.numeric(s39[, c("l", "b")]), c("level", "slope")), 3)
#>   level   slope
#> 301.998   4.874

round(setNames(as.numeric(s39[, paste0("s", 1:4)]), paste0("s", 1:4)), 3)
#>    s1    s2    s3    s4
#> 1.272 0.969 0.842 0.898
```

**Explanation:** The states tell the planner the story behind the numbers: an underlying level near 302 growing about 4.9 per quarter, with the most recent quarter in the cycle running 27 percent above that level. Reading `s1` as Q4 rather than Q1 is what makes the interpretation correct. The planner can now stress test the forecast by asking what happens if the Q4 uplift softens to 1.15.

</details>

## Section 4. The ETS framework and automatic model selection (9 problems)

### Exercise 4.1: Let ets pick the model for AirPassengers and read the label

**Task:** Fit `ets()` to `AirPassengers` with no model specified so the search picks the best form, then print the chosen method label and its AICc rounded to two decimals. Save the fitted model to `ex_4_1`.

**Expected result:**

```
#> [1] "ETS(M,Ad,M)"
#> [1] 1400.64
```

**Difficulty:** Beginner

[HINTS]
The three letters in an ETS label describe the error, the trend and the seasonal component in that order.
Call `ets(AirPassengers)` then print `fit$method` and `round(fit$aicc, 2)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1$method
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ets(AirPassengers)
ex_4_1$method
#> [1] "ETS(M,Ad,M)"

round(ex_4_1$aicc, 2)
#> [1] 1400.64
```

**Explanation:** Read the label as error Multiplicative, trend Additive damped, seasonal Multiplicative. Multiplicative error means the noise scales with the level, which is exactly what airline data does. `ets()` fits every admissible combination and keeps the lowest AICc, so the label is a summary of a search, not an assumption you imposed. Always print the label before you trust the forecast.

</details>

### Exercise 4.2: Force a fully additive model and pay the AICc price

**Task:** Fit `ets()` on `AirPassengers` with `model = "AAA"` and `damped = FALSE`, then compare its AICc against the automatically selected model from Exercise 4.1 in a named vector. Save the comparison to `ex_4_2`.

**Expected result:**

```
#> aicc_AAA aicc_auto
#>  1570.73   1400.64
```

**Difficulty:** Intermediate

[HINTS]
You can override the search by naming the three components yourself, which is useful for testing a hypothesis about the data.
Pass `model = "AAA", damped = FALSE` and compare `$aicc` with the automatic fit.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_aaa <- ets(AirPassengers, model = "AAA", damped = FALSE)

ex_4_2 <- round(c(aicc_AAA = fit_aaa$aicc, aicc_auto = ex_4_1$aicc), 2)
ex_4_2
#> aicc_AAA aicc_auto
#>  1570.73   1400.64
```

**Explanation:** The forced additive model is 170 AICc units worse, a gap so large that no reasonable tolerance would call them competitive. Rules of thumb put a difference above 10 in decisive territory. Forcing a model is still worth doing when you have a strong reason, for example when a downstream system requires additive components, but you should know what it costs.

</details>

### Exercise 4.3: Rank four candidate ETS specifications by AICc

**Task:** Fit `ets()` on `AirPassengers` for the four model strings "ANA", "AAA", "MAM" and "MNM" with damping switched off, collect their AICc values, and sort them from best to worst. Save the sorted named vector rounded to two decimals to `ex_4_3`.

**Expected result:**

```
#>     MAM     MNM     ANA     AAA
#> 1403.66 1465.06 1568.61 1570.73
```

**Difficulty:** Intermediate

[HINTS]
Loop over the model strings and pull the same scalar from each fit, then sort the result so the ranking is obvious.
Use `sapply(cands, function(m) ets(AirPassengers, model = m, damped = FALSE)$aicc)` and wrap it in `sort()`.

```r title="Your turn"
cands <- c("ANA", "AAA", "MAM", "MNM")

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cands <- c("ANA", "AAA", "MAM", "MNM")
res <- sapply(cands, function(m) ets(AirPassengers, model = m, damped = FALSE)$aicc)

ex_4_3 <- round(sort(res), 2)
ex_4_3
#>     MAM     MNM     ANA     AAA
#> 1403.66 1465.06 1568.61 1570.73
```

**Explanation:** The ranking separates cleanly into multiplicative seasonal models on top and additive seasonal models at the bottom, which confirms the seasonal form matters far more here than the trend does. Note that MNM, with no trend at all, still beats both additive seasonal models. When you are unsure which component to fix first, a small grid like this answers it in one line.

</details>

### Exercise 4.4: Confirm that ets reduces to simple exponential smoothing on Nile

**Task:** Fit `ets()` to `Nile` with no model specified, print the chosen method label, and print the estimated parameters rounded to four decimals. Save the fitted model to `ex_4_4` and compare the alpha with the `ses()` fit from Section 1.

**Expected result:**

```
#> [1] "ETS(M,N,N)"
#>     alpha         l
#>    0.1514 1087.7718
```

**Difficulty:** Intermediate

[HINTS]
A series with no trend and no seasonality should leave the search choosing a model with only one state.
Fit `ets(Nile)` and print `fit$method` and `round(fit$par, 4)`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4$method
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- ets(Nile)
ex_4_4$method
#> [1] "ETS(M,N,N)"

round(ex_4_4$par, 4)
#>     alpha         l
#>    0.1514 1087.7718
```

**Explanation:** The search picks N for trend and N for seasonal, so this is simple exponential smoothing with a multiplicative error. `ses()` by default fits ETS(A,N,N), the additive-error version, which is why its alpha of 0.2457 differs from the 0.1514 here. Same forecast function, different noise assumption: the point forecasts stay flat either way but the prediction intervals do not.

</details>

### Exercise 4.5: Break an ETS label into its component vector

**Task:** Extract the `components` element from the automatically selected `ets()` fit on `AirPassengers` and inspect the four entries: error type, trend type, seasonal type and whether damping is used. Save the character vector to `ex_4_5`.

**Expected result:**

```
#> [1] "M"    "A"    "M"    "TRUE"
```

**Difficulty:** Beginner

[HINTS]
The letters in the printed method string are also stored as a plain vector you can index programmatically.
Print `ets(AirPassengers)$components`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- ets(AirPassengers)$components
ex_4_5
#> [1] "M"    "A"    "M"    "TRUE"
```

**Explanation:** Parsing the method string with regular expressions is fragile, so use `$components` whenever code needs to branch on the selected form, for instance to decide whether a back-transformation is required. The fourth element is the damping flag stored as a character, so compare it with `"TRUE"` rather than the logical value. This is the safe way to log model choices across a batch of series.

</details>

### Exercise 4.6: Let the search choose the trend form for a non-seasonal series

**Task:** Fit `ets()` on `WWWusage` with no model specified, print the chosen label, and print the estimated parameters rounded to four decimals so you can see which trend form won. Save the fitted model to `ex_4_6`.

**Expected result:**

```
#> [1] "ETS(A,Ad,N)"
#>   alpha    beta     phi       l       b
#>  0.9999  0.9966  0.8150 90.3518 -0.0173
```

**Difficulty:** Intermediate

[HINTS]
The search space includes damped trend variants, so the label will tell you whether damping was worth the extra parameter here.
Fit `ets(WWWusage)` and print `fit$method` and `round(fit$par, 4)`.

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6$method
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- ets(WWWusage)
ex_4_6$method
#> [1] "ETS(A,Ad,N)"

round(ex_4_6$par, 4)
#>   alpha    beta     phi       l       b
#>  0.9999  0.9966  0.8150 90.3518 -0.0173
```

**Explanation:** The search reaches the same conclusion the manual AICc comparison in Exercise 2.5 reached: damped trend wins. This is the argument for using `ets()` as the default entry point rather than hand-picking between `ses()`, `holt()` and `hw()`. Those three functions are convenience wrappers around fixed corners of the same model space that `ets()` searches for you.

</details>

### Exercise 4.7: Fit an additive ETS on a Box-Cox transformed scale

**Task:** Estimate a Box-Cox lambda for `AirPassengers` with `BoxCox.lambda()`, fit `ets()` with that lambda and `additive.only = TRUE`, then report the chosen label, the AICc and the training RMSE. Save the lambda rounded to four decimals to `ex_4_7`.

**Expected result:**

```
#> [1] -0.2947
#> [1] "ETS(A,A,A)"
#> [1] -659.57
#> [1] 10.375
```

**Difficulty:** Advanced

[HINTS]
A variance-stabilising transform can let a purely additive model handle data that otherwise demands multiplicative components.
Compute `lam <- BoxCox.lambda(AirPassengers)` then pass `lambda = lam, additive.only = TRUE` to `ets()`.

```r title="Your turn"
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_7 <- round(BoxCox.lambda(AirPassengers), 4)
ex_4_7
#> [1] -0.2947

e_lam <- ets(AirPassengers, lambda = ex_4_7, additive.only = TRUE)
e_lam$method
#> [1] "ETS(A,A,A)"

round(e_lam$aicc, 2)
#> [1] -659.57

round(accuracy(e_lam)[, "RMSE"], 3)
#> [1] 10.375
```

**Explanation:** The transform stabilises the variance, so an additive model now fits about as well as the multiplicative one did, with an RMSE of 10.4 against 10.7. The AICc is negative and cannot be compared with the untransformed models, because the likelihood is computed on a different scale. That is the classic trap: only compare AICc across models fitted to the identically transformed data.

</details>

### Exercise 4.8: Report training-set accuracy for the selected model

**Task:** Compute training-set RMSE, MAE and MAPE for the automatically selected `ets()` model on `AirPassengers` using `accuracy()`, rounded to three decimals. Save the named vector to `ex_4_8`.

**Expected result:**

```
#>   RMSE    MAE   MAPE
#> 10.747  7.792  2.858
```

**Difficulty:** Beginner

[HINTS]
There is one function that computes every standard error measure at once from a fitted model or a forecast object.
Call `accuracy(ets(AirPassengers))` and subset the three columns you need.

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- round(accuracy(ets(AirPassengers))[, c("RMSE", "MAE", "MAPE")], 3)
ex_4_8
#>   RMSE    MAE   MAPE
#> 10.747  7.792  2.858
```

**Explanation:** These are in-sample one-step errors, so they flatter the model: it saw every observation while fitting. A MAPE of 2.9 percent looks excellent, but the honest number comes from a holdout, which Section 6 covers. Use training accuracy to compare models on the same data, never to promise a stakeholder how a forecast will perform next quarter.

</details>

### Exercise 4.9: Produce six-month forecasts with a 95 percent interval

**Task:** Forecast six months ahead from the automatically selected `ets()` model on `AirPassengers`, then print the point forecasts along with the lower and upper 95 percent interval bounds, all rounded to one decimal. Save the forecast object to `ex_4_9`.

**Expected result:**

```
#> [1] 441.8 434.1 496.6 483.2 484.0 551.0
#> [1] 407.9 392.9 441.6 422.6 416.7 467.4
#> [1] 475.7 475.3 551.7 543.8 551.2 634.7
```

**Difficulty:** Intermediate

[HINTS]
A forecast object stores the point forecasts and the interval bounds in separate components, with one column per confidence level.
Call `forecast(fit, h = 6)` and read `$mean`, `$lower[, 2]` and `$upper[, 2]` for the 95 percent level.

```r title="Your turn"
ex_4_9 <- # your code here
round(ex_4_9$mean, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_9 <- forecast(ets(AirPassengers), h = 6)

round(as.numeric(ex_4_9$mean), 1)
#> [1] 441.8 434.1 496.6 483.2 484.0 551.0

round(as.numeric(ex_4_9$lower[, 2]), 1)
#> [1] 407.9 392.9 441.6 422.6 416.7 467.4

round(as.numeric(ex_4_9$upper[, 2]), 1)
#> [1] 475.7 475.3 551.7 543.8 551.2 634.7
```

**Explanation:** By default `forecast()` returns two levels, 80 and 95 percent, so column 1 is the 80 percent bound and column 2 is the 95 percent bound. Getting that column order backwards is a common reporting error that quietly narrows every published interval. Pass `level = 95` if you only want one, and the object will then have a single column.

</details>

## Section 5. Residuals, prediction intervals, and model checking (8 problems)

### Exercise 5.1: Run a Ljung-Box test on the residuals of the fitted model

**Task:** Fit `ets()` to `AirPassengers` and run `checkresiduals()` with `plot = FALSE` to get a Ljung-Box portmanteau test on the residuals. Save the test object to `ex_5_1` and read off the p-value.

**Expected result:**

```
#> 	Ljung-Box test
#>
#> data:  Residuals from ETS(M,Ad,M)
#> Q* = 51.341, df = 24, p-value = 0.0009527
#>
#> Model df: 0.   Total lags used: 24
```

**Difficulty:** Intermediate

[HINTS]
A well specified model should leave residuals with no remaining autocorrelation, and there is a standard test for exactly that.
Call `checkresiduals(fit, plot = FALSE)` and store the returned test object.

```r title="Your turn"
fit_ap <- ets(AirPassengers)

ex_5_1 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_ap <- ets(AirPassengers)
ex_5_1 <- checkresiduals(fit_ap, plot = FALSE)
#> 	Ljung-Box test
#>
#> data:  Residuals from ETS(M,Ad,M)
#> Q* = 51.341, df = 24, p-value = 0.0009527
#>
#> Model df: 0.   Total lags used: 24
```

**Explanation:** The null hypothesis is that the residuals are independent, and a p-value of 0.001 rejects it. Some structure remains that the model has not captured, which is common with `AirPassengers` because its seasonal shape shifts slightly over the decade. A failed test does not make the forecast useless: it warns that the prediction intervals are probably too narrow.

</details>

### Exercise 5.2: Inspect the first four residual autocorrelations

**Task:** Take the residuals from the fitted `ets()` model on `AirPassengers` and compute the autocorrelations at lags 1 through 4 with `acf()`, rounded to three decimals. Save the four values to `ex_5_2`.

**Expected result:**

```
#> [1]  0.049  0.008 -0.120 -0.229
```

**Difficulty:** Intermediate

[HINTS]
The autocorrelation function returns lag zero first, which is always exactly 1 and tells you nothing.
Use `acf(residuals(fit), lag.max = 4, plot = FALSE)$acf` and drop the first element.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
r <- residuals(fit_ap)
ex_5_2 <- round(acf(r, lag.max = 4, plot = FALSE)$acf[2:5], 3)
ex_5_2
#> [1]  0.049  0.008 -0.120 -0.229
```

**Explanation:** With 144 observations the rough significance bound is $2/\sqrt{144} = 0.167$, so the lag-4 value of -0.229 is clearly outside it while the first two are not. That single spike is what drove the Ljung-Box rejection in the previous exercise. Reading the individual lags tells you where the leftover structure sits, which a single portmanteau p-value hides.

</details>

### Exercise 5.3: Measure how fast the prediction interval widens with horizon

**Task:** Forecast 12 months ahead from the fitted `ets()` model on `AirPassengers` at the 95 percent level, then compute the interval width at horizons 1, 6 and 12 along with the ratio of the widest to the narrowest. Save the four numbers to `ex_5_3`.

**Expected result:**

```
#>     h1     h6    h12  ratio
#>  67.83 167.28 199.41   2.94
```

**Difficulty:** Intermediate

[HINTS]
Uncertainty compounds with each step ahead, so subtract the lower bound from the upper bound at several horizons and compare.
Compute `fc$upper[, 1] - fc$lower[, 1]` after forecasting with `level = 95`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fc <- forecast(fit_ap, h = 12, level = 95)
w  <- fc$upper[, 1] - fc$lower[, 1]

ex_5_3 <- round(c(h1 = w[1], h6 = w[6], h12 = w[12], ratio = w[12] / w[1]), 2)
ex_5_3
#>     h1     h6    h12  ratio
#>  67.83 167.28 199.41   2.94
```

**Explanation:** The interval nearly triples over a year, which is the honest cost of forecasting further out. Because this is a multiplicative model, the width also tracks the seasonal level, so it does not grow perfectly smoothly: high-season months carry wider intervals than low-season ones. A single point forecast without this context invites false confidence.

</details>

### Exercise 5.4: Reconstruct the SES prediction interval from the variance formula

**Task:** Fit `ses()` on `Nile` with a four-step horizon at the 95 percent level, then rebuild the upper bound by hand using $\hat{y} + z\,\sigma\sqrt{1 + (h-1)\alpha^2}$ and compare against the package bounds. Save the comparison data frame to `ex_5_4`.

**Expected result:**

```
#>   h manual_upper ses_upper
#> 1 1      1088.03   1088.03
#> 2 2      1096.43   1096.43
#> 3 3      1104.60   1104.60
#> 4 4      1112.55   1112.55
```

**Difficulty:** Advanced

[HINTS]
The forecast variance for simple exponential smoothing grows in a closed form that depends only on sigma, alpha and the horizon.
Take `sigma <- sqrt(fit$model$sigma2)` and multiply `qnorm(0.975) * sigma * sqrt(1 + (h - 1) * alpha^2)`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f     <- ses(Nile, h = 4, level = 95)
alpha <- f$model$par["alpha"]
sigma <- sqrt(f$model$sigma2)
h     <- 1:4

manual <- as.numeric(f$mean) + qnorm(0.975) * sigma * sqrt(1 + (h - 1) * alpha^2)

ex_5_4 <- round(data.frame(h = h,
                           manual_upper = manual,
                           ses_upper    = as.numeric(f$upper[, 1])), 2)
ex_5_4
#>   h manual_upper ses_upper
#> 1 1      1088.03   1088.03
#> 2 2      1096.43   1096.43
#> 3 3      1104.60   1104.60
#> 4 4      1112.55   1112.55
```

**Explanation:** The interval widens slowly here because alpha is only 0.25, so $(h-1)\alpha^2$ adds about 0.06 of extra variance per step. With alpha near 1 the same formula would widen almost like a random walk. Using `qnorm(0.975)` rather than 1.96 matters at the second decimal, and mismatches at that level are usually this rounding rather than a wrong formula.

</details>

### Exercise 5.5: Report both the 50 and 95 percent interval bounds

**Task:** Forecast three months ahead from the fitted `ets()` model on `AirPassengers` requesting both the 50 and 95 percent levels, then print the lower and upper bound matrices rounded to one decimal. Save the forecast object to `ex_5_5`.

**Expected result:**

```
#>            50%   95%
#> Jan 1961 430.1 407.9
#> Feb 1961 419.9 392.9
#> Mar 1961 477.7 441.6
#>            50%   95%
#> Jan 1961 453.5 475.7
#> Feb 1961 448.3 475.3
#> Mar 1961 515.6 551.7
```

**Difficulty:** Intermediate

[HINTS]
The confidence levels you want are an argument to the forecast function, and each level becomes its own column in the bound matrices.
Pass `level = c(50, 95)` to `forecast()` and print `$lower` and `$upper`.

```r title="Your turn"
ex_5_5 <- # your code here
round(ex_5_5$lower, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- forecast(fit_ap, h = 3, level = c(50, 95))

round(ex_5_5$lower, 1)
#>            50%   95%
#> Jan 1961 430.1 407.9
#> Feb 1961 419.9 392.9
#> Mar 1961 477.7 441.6

round(ex_5_5$upper, 1)
#>            50%   95%
#> Jan 1961 453.5 475.7
#> Feb 1961 448.3 475.3
#> Mar 1961 515.6 551.7
```

**Explanation:** A 50 percent interval is the range the outcome falls inside half the time, which many stakeholders find easier to reason about than a 95 percent band that looks alarmingly wide. Showing both is good practice for a planning document: the inner band frames the base case and the outer band frames the risk. Column names carry the level, so you can subset by `"95%"` rather than by position.

</details>

### Exercise 5.6: Distinguish innovation residuals from response residuals

**Task:** For the multiplicative-error `ets()` fit on `AirPassengers`, print the first four innovation residuals and the first four response residuals, then compare their standard deviations. Save the innovation residual vector to `ex_5_6`.

**Expected result:**

```
#> [1]  0.0074  0.0636 -0.0153 -0.0100
#> [1]  0.8256  7.0547 -2.0443 -1.3058
#> sd_inn  sd_res
#> 0.0365 10.6695
```

**Difficulty:** Advanced

[HINTS]
With a multiplicative error the model works in relative terms, so its natural residual is not measured in passengers.
Call `residuals(fit, type = "innovation")` and `residuals(fit, type = "response")` and compare.

```r title="Your turn"
ex_5_6 <- # your code here
head(round(as.numeric(ex_5_6), 4), 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- residuals(fit_ap, type = "innovation")

head(round(as.numeric(ex_5_6), 4), 4)
#> [1]  0.0074  0.0636 -0.0153 -0.0100

head(round(as.numeric(residuals(fit_ap, type = "response")), 4), 4)
#> [1]  0.8256  7.0547 -2.0443 -1.3058

round(c(sd_inn = sd(residuals(fit_ap, type = "innovation")),
        sd_res = sd(residuals(fit_ap, type = "response"))), 4)
#> sd_inn  sd_res
#> 0.0365 10.6695
```

**Explanation:** Innovation residuals are the relative errors the multiplicative model actually assumes to be white noise, so a value of 0.064 means the observation came in 6.4 percent above the one-step forecast. Response residuals are in passengers and grow with the level. Diagnostic tests belong on the innovation residuals, but accuracy reporting belongs on the response scale, and `residuals()` defaults to innovation.

</details>

### Exercise 5.7: Test the residuals for normality before trusting the intervals

**Task:** Run a Shapiro-Wilk test on the innovation residuals of the `ets()` fit on `AirPassengers` and report the test statistic and the p-value, each rounded to four decimals. Save the test object to `ex_5_7`.

**Expected result:**

```
#>      W
#> 0.9909
#> [1] 0.4836
```

**Difficulty:** Intermediate

[HINTS]
The analytic prediction intervals assume a particular residual distribution, and there is a standard base R test for it.
Call `shapiro.test(residuals(fit))` and print `$statistic` and `$p.value`.

```r title="Your turn"
ex_5_7 <- # your code here
round(ex_5_7$statistic, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- shapiro.test(residuals(fit_ap))

round(ex_5_7$statistic, 4)
#>      W
#> 0.9909

round(ex_5_7$p.value, 4)
#> [1] 0.4836
```

**Explanation:** A p-value of 0.48 gives no evidence against normality, so the analytic intervals rest on a reasonable assumption here. When this test fails, switch to bootstrapped intervals with `forecast(fit, bootstrap = TRUE)`, which resamples the observed residuals instead of assuming a shape. Note that normality matters for the intervals only: the point forecasts do not depend on it.

</details>

### Exercise 5.8: Measure whether the 95 percent interval actually covers a holdout

**Task:** Split `AirPassengers` into a training set through 1958 and a 24-month test set, fit `ets()` on the training set, and count how many test observations fall inside the 95 percent interval. Save the counts and the coverage percentage to `ex_5_8`.

**Expected result:**

```
#> covered   total     pct
#>    21.0    24.0    87.5
```

**Difficulty:** Advanced

[HINTS]
Nominal coverage is a promise, and the only way to check it is to hold out data the model never saw.
Use `window()` to split, then compare `test` against `fc$lower[, 1]` and `fc$upper[, 1]` elementwise.

```r title="Your turn"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

fc8    <- forecast(ets(train), h = length(test), level = 95)
inside <- test >= fc8$lower[, 1] & test <= fc8$upper[, 1]

ex_5_8 <- c(covered = sum(inside), total = length(test),
            pct = round(100 * mean(inside), 1))
ex_5_8
#> covered   total     pct
#>    21.0    24.0    87.5
```

**Explanation:** Actual coverage of 87.5 percent falls short of the nominal 95 percent, the usual finding: analytic intervals ignore the uncertainty in the estimated parameters, so they run too narrow. Three misses out of 24 is a small sample, so treat this as a warning rather than a measurement. If a plan depends on the tail, widen the intervals by bootstrapping or hold back more data.

</details>

## Section 6. Backtesting, cross-validation, and forecast workflows (8 problems)

### Exercise 6.1: Score a holdout forecast with RMSE, MAE and MAPE

**Task:** Using the 1949 to 1958 training split of `AirPassengers`, fit `ets()`, forecast 24 months, and compute test-set RMSE, MAE and MAPE with `accuracy()`, rounded to three decimals. Save the named vector to `ex_6_1`.

**Expected result:**

```
#>   RMSE    MAE   MAPE
#> 72.548 63.213 13.303
```

**Difficulty:** Beginner

[HINTS]
Passing the true future values as a second argument makes the accuracy function report a test row alongside the training row.
Call `accuracy(fc, test)` and subset the `"Test set"` row.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fc1 <- forecast(ets(train), h = 24)

ex_6_1 <- round(accuracy(fc1, test)["Test set", c("RMSE", "MAE", "MAPE")], 3)
ex_6_1
#>   RMSE    MAE   MAPE
#> 72.548 63.213 13.303
```

**Explanation:** The test MAPE of 13.3 percent dwarfs the 2.9 percent training MAPE from Exercise 4.8, which is the whole reason holdouts exist. RMSE punishes large misses more than MAE does, so a gap between them signals a few bad months rather than uniform drift. MAPE is scale free and easy to explain, but it breaks down on series that pass near zero.

</details>

### Exercise 6.2: Compare the model against a seasonal naive benchmark with MASE

**Task:** Compute test-set MASE for the `ets()` holdout forecast and for a `snaive()` forecast over the same 24 months, then compare the two in a named vector rounded to three decimals. Save it to `ex_6_2`.

**Expected result:**

```
#>    ets snaive
#>  2.212  2.494
```

**Difficulty:** Intermediate

[HINTS]
A scaled error measure only means something next to a benchmark, so fit the simplest seasonal rule and score it the same way.
Build `snaive(train, h = 24)` and read the `"MASE"` column from `accuracy()` for both.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sn <- snaive(train, h = 24)

ex_6_2 <- round(c(ets    = accuracy(fc1, test)["Test set", "MASE"],
                  snaive = accuracy(sn, test)["Test set", "MASE"]), 3)
ex_6_2
#>    ets snaive
#>  2.212  2.494
```

**Explanation:** MASE scales errors by the average one-step seasonal naive error on the training data, so a value above 1 means the forecast is worse than that naive rule was in sample. Both models exceed 1 here because the test period grew faster than the training period did. The comparison that matters is relative: ETS beats seasonal naive by about 11 percent, a real but modest edge.

</details>

### Exercise 6.3: Cross-validate simple exponential smoothing against two benchmarks

**Task:** Use `tsCV()` with a one-step horizon to compute rolling-origin RMSE on `Nile` for `ses()`, `naive()` and `meanf()`, then compare the three numbers rounded to two decimals. Save the SES value to `ex_6_3`.

**Expected result:**

```
#> [1] 144.96
#> [1] 168.13
#> [1] 172.46
```

**Difficulty:** Advanced

[HINTS]
Cross-validation for time series refits the model at every origin, so you must pass a function that takes the data and a horizon.
Define `f <- function(x, h) ses(x, h = h)` then `sqrt(mean(tsCV(Nile, f, h = 1)^2, na.rm = TRUE))`.

```r title="Your turn"
f_ses <- function(x, h) ses(x, h = h)

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f_ses   <- function(x, h) ses(x, h = h)
f_naive <- function(x, h) naive(x, h = h)
f_mean  <- function(x, h) meanf(x, h = h)

ex_6_3 <- round(sqrt(mean(tsCV(Nile, f_ses, h = 1)^2, na.rm = TRUE)), 2)
ex_6_3
#> [1] 144.96

round(sqrt(mean(tsCV(Nile, f_naive, h = 1)^2, na.rm = TRUE)), 2)
#> [1] 168.13

round(sqrt(mean(tsCV(Nile, f_mean, h = 1)^2, na.rm = TRUE)), 2)
#> [1] 172.46
```

**Explanation:** SES sits between the two extremes it interpolates and beats both: the naive forecast reacts to every wobble, the mean forecast reacts to nothing, and SES tunes the balance through alpha. `tsCV()` returns a series of errors with `NA` where there was not enough history, hence `na.rm = TRUE`. This is a far more honest comparison than a single fixed split, because every observation gets forecast once.

</details>

### Exercise 6.4: Cross-validate three trend variants on the same series

**Task:** Compute one-step rolling-origin RMSE on `WWWusage` for `ses()`, plain `holt()` and damped `holt()` using `tsCV()`, then compare the three values in a named vector rounded to three decimals. Save the comparison to `ex_6_4`.

**Expected result:**

```
#>    ses   holt damped
#>  5.812  3.784  3.588
```

**Difficulty:** Advanced

[HINTS]
Wrap each method in its own small function so `tsCV()` can refit it at every origin, then score all three the same way.
Write three functions of the form `function(x, h) holt(x, damped = TRUE, h = h)` and reuse the RMSE line.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f1 <- function(x, h) ses(x, h = h)
f2 <- function(x, h) holt(x, h = h)
f3 <- function(x, h) holt(x, damped = TRUE, h = h)

ex_6_4 <- round(c(
  ses    = sqrt(mean(tsCV(WWWusage, f1, h = 1)^2, na.rm = TRUE)),
  holt   = sqrt(mean(tsCV(WWWusage, f2, h = 1)^2, na.rm = TRUE)),
  damped = sqrt(mean(tsCV(WWWusage, f3, h = 1)^2, na.rm = TRUE))), 3)
ex_6_4
#>    ses   holt damped
#>  5.812  3.784  3.588
```

**Explanation:** The ranking matches what AICc said in Exercise 2.5, which is reassuring: two independent criteria, one penalised likelihood and one out-of-sample error, pick the same model. Adding a trend cuts the error by a third and damping shaves a little more. When AICc and cross-validation disagree, trust cross-validation, because it measures the thing you actually care about.

</details>

### Exercise 6.5: Put exponential smoothing head to head with ARIMA

**Task:** Fit `auto.arima()` to the `AirPassengers` training split, forecast the same 24 months, and compare its test RMSE against the `ets()` forecast in a named vector rounded to three decimals. Save the comparison to `ex_6_5`.

**Expected result:**

```
#>    ets  arima
#> 72.548 74.252
#> Series: train
#> ARIMA(1,1,0)(0,1,0)[12]
```

**Difficulty:** Intermediate

[HINTS]
The two model families are not nested and cannot be compared by AICc, so score them both on the same holdout instead.
Fit `auto.arima(train)`, forecast `h = 24`, and compare the `"Test set"` RMSE from `accuracy()`.

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fa <- forecast(auto.arima(train), h = 24)

ex_6_5 <- round(c(ets   = accuracy(fc1, test)["Test set", "RMSE"],
                  arima = accuracy(fa,  test)["Test set", "RMSE"]), 3)
ex_6_5
#>    ets  arima
#> 72.548 74.252

auto.arima(train)
#> Series: train
#> ARIMA(1,1,0)(0,1,0)[12]
```

**Explanation:** ETS wins by about 2 percent, which is close enough that either model is defensible on this series. The important discipline is that AICc from `ets()` and AICc from `auto.arima()` are not comparable, because the likelihoods are computed on differently differenced data. A holdout or `tsCV()` is the only fair referee between the two families.

</details>

### Exercise 6.6: Test whether averaging two forecasts beats either one

**Task:** Average the ETS and ARIMA point forecasts for the 24-month holdout, score the combination against the test set, and compare all three RMSE values in a named vector rounded to three decimals. Save the comparison to `ex_6_6`.

**Expected result:**

```
#>    ets  arima  combo
#> 72.548 74.252 72.704
```

**Difficulty:** Intermediate

[HINTS]
A simple mean of two point-forecast series is often more robust than either, so build it and score it exactly like a model.
Compute `(fc1$mean + fa$mean) / 2` and pass that vector straight to `accuracy()` with the test set.

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
comb <- (fc1$mean + fa$mean) / 2

ex_6_6 <- round(c(ets   = accuracy(fc1,  test)["Test set", "RMSE"],
                  arima = accuracy(fa,   test)["Test set", "RMSE"],
                  combo = accuracy(comb, test)["Test set", "RMSE"]), 3)
ex_6_6
#>    ets  arima  combo
#> 72.548 74.252 72.704
```

**Explanation:** The combination lands between the two, slightly worse than the better model and better than the worse one, which is what happens when both models make errors in the same direction. Averaging pays off when errors are less correlated, and its real value is insurance: you avoid betting everything on the model that happened to win the last backtest. Note `accuracy()` accepts a bare `ts` of point forecasts, so no interval is produced for the combination.

</details>

### Exercise 6.7: Assemble a model comparison table for a weekly report

**Task:** A reporting analyst has to circulate one table ranking the ETS, ARIMA and seasonal naive forecasts on the `AirPassengers` holdout. Build a tibble with model name, RMSE, MAE and MAPE rounded to two decimals, sorted best first. Save it to `ex_6_7`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   model   RMSE   MAE  MAPE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 ets     72.6  63.2  13.3
#> 2 arima   74.2  68.6  14.9
#> 3 snaive  77.0  71.2  15.5
```

**Difficulty:** Advanced

[HINTS]
Collect the forecast objects into a named list first, then pull the same accuracy row from each one rather than repeating code.
Use `sapply(mods, function(f) accuracy(f, test)["Test set", "RMSE"])` inside `tibble()`, then `arrange(RMSE)`.

```r title="Your turn"
mods <- list(ets = fc1, arima = fa, snaive = sn)

ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mods <- list(ets = fc1, arima = fa, snaive = sn)

ex_6_7 <- tibble(
  model = names(mods),
  RMSE  = sapply(mods, function(f) accuracy(f, test)["Test set", "RMSE"]),
  MAE   = sapply(mods, function(f) accuracy(f, test)["Test set", "MAE"]),
  MAPE  = sapply(mods, function(f) accuracy(f, test)["Test set", "MAPE"])
) |>
  mutate(across(where(is.numeric), function(x) round(x, 2))) |>
  arrange(RMSE)

ex_6_7
#> # A tibble: 3 x 4
#>   model   RMSE   MAE  MAPE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 ets     72.6  63.2  13.3
#> 2 arima   74.2  68.6  14.9
#> 3 snaive  77.0  71.2  15.5
```

**Explanation:** Naming the list once and mapping over it keeps the code honest: every model is scored on the same test window with the same function, so nobody can accuse the table of a rigged comparison. All three measures rank the models identically here, which is the easy case. When they disagree, say so in the report and name the measure you optimised.

</details>

### Exercise 6.8: Catch the data-quality problem that breaks a multiplicative model

**Task:** A monthly feed arrives with one month recorded as zero after an outage. Build a summary tibble reporting how many values are non-positive, the index of the first one, and whether a multiplicative model can be fitted at all. Save the tibble to `ex_6_8`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   n_nonpositive first_bad_index can_use_multiplicative
#>           <int>           <int> <lgl>
#> 1             1               3 FALSE
#> [1] "Inappropriate model for data with negative or zero values"
```

**Difficulty:** Intermediate

[HINTS]
Multiplicative components divide by the level, so a single zero or negative value makes the whole model undefined.
Count `sum(x <= 0)`, find `which(x <= 0)[1]`, and wrap the `ets(bad, model = "MNN")` call in `tryCatch()`.

```r title="Your turn"
bad <- ts(c(120, 135, 0, 141, 150, 162, 155, 170, 168, 181, 176, 190),
          start = c(2024, 1), frequency = 12)

ex_6_8 <- # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bad <- ts(c(120, 135, 0, 141, 150, 162, 155, 170, 168, 181, 176, 190),
          start = c(2024, 1), frequency = 12)

ex_6_8 <- tibble(
  n_nonpositive          = sum(bad <= 0),
  first_bad_index        = which(bad <= 0)[1],
  can_use_multiplicative = all(bad > 0)
)
ex_6_8
#> # A tibble: 1 x 3
#>   n_nonpositive first_bad_index can_use_multiplicative
#>           <int>           <int> <lgl>
#> 1             1               3 FALSE

tryCatch({ets(bad, model = "MNN"); "fitted"}, error = function(e) conditionMessage(e))
#> [1] "Inappropriate model for data with negative or zero values"
```

**Explanation:** Running this check before fitting turns a cryptic error into a data problem you can act on: treat the outage month as missing and interpolate it, or fall back to an additive model. Never quietly replace the zero with a small number, because that inflates the estimated growth rate afterwards. The same guard belongs in any automated pipeline that lets `ets()` choose the model.

</details>

## What to do next

- [Exponential Smoothing in R](Exponential-Smoothing-in-R.html) is the parent tutorial for these problems, covering the level equation and alpha in detail.
- [ETS Models in R](ETS-Models-in-R.html) walks through the full ETS taxonomy and how the automatic search chooses among the 30 model forms.
- [Holt-Winters in R](Holt-Winters-in-R.html) goes deeper on seasonal exponential smoothing and the additive versus multiplicative decision.
- [Time Series Exercises in R](Time-Series-Exercises-in-R.html) covers the wider forecasting toolkit: ts objects, decomposition, stationarity and ARIMA.
