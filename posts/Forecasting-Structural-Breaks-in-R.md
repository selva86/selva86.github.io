---
title: "Forecasting Through Structural Breaks in R"
slug: "Forecasting-Structural-Breaks-in-R"
description: "Detect structural breaks in R with the changepoint and strucchange packages, then build forecasts that survive level shifts, trend changes, and regime shifts."
keywords: "structural breaks in R, forecasting structural breaks, changepoint detection in R, strucchange breakpoints, Bai-Perron test, change point PELT, regime shift forecasting, level shift time series"
auto_link_terms: "structural break|structural breaks|structural break in R|change point detection|changepoint detection|regime shift|level shift|trend break|Bai-Perron test|breakpoints()|cpt.meanvar()|forecasting through structural breaks|structural change"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-23"
curriculum_id: "TS2-11.6"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Structural Breaks"
sidebar_order: "62"
difficulty: "Advanced"
---

<p class="lead">A structural break is a moment when the rule that generates your data changes: the average may jump to a new level or a steady trend may suddenly bend. A forecast trained on the old rule then drifts wrong. This tutorial shows you how to spot a break in R and forecast right through it.</p>

## What is a structural break, and why does it wreck a forecast?

Almost every forecasting method assumes the future behaves like the past. That assumption quietly breaks the moment something structural changes: a competitor exits, a pricing policy flips, a pandemic starts, a product goes viral. Analysts call that moment a structural break, and if you feed a model history from both sides of it, the model splits the difference between the two regimes and describes neither well. Let's build a series with a break so you can see the problem before we fix it.

We simulate ten years of monthly sales. For the first 72 months the average sits near 100 units. Then, at month 73, it jumps permanently to 150, the kind of shift a new distribution deal would cause. We load the two packages, then build the series and plot it.

```r title="Simulate monthly sales with a level shift"
library(changepoint)
library(forecast)

set.seed(2026)
months  <- 1:120
regime  <- ifelse(months < 73, 100, 150)      # the average jumps at month 73
sales   <- regime + rnorm(120, mean = 0, sd = 6)
sales_ts <- ts(sales, frequency = 12, start = c(2016, 1))

plot(sales_ts, main = "Monthly sales with a structural break",
     ylab = "Units sold", col = "steelblue", lwd = 2)
abline(v = 2016 + 72/12, lty = 2, col = "red")

round(c(before = mean(sales[1:72]), after = mean(sales[73:120])), 1)
#> before  after
#>   99.2  149.7
```

The plot shows a flat band near 100 that suddenly steps up to a flat band near 150 at the red dashed line. The two numbers confirm it: the average was 99.2 before the break and 149.7 after. Nothing gradual happened, the level simply shifted. That single jump is the whole problem, and it comes in three flavours you will meet again and again.

![The three kinds of structural break a forecaster must handle.](screenshots/Forecasting-Structural-Breaks-in-R-break-types.webp)
*Figure 1: The three kinds of structural break a forecaster must handle.*

A break can move the **level** (the average jumps, like our sales), bend the **trend** (steady growth suddenly plateaus), or widen the **variance** (the series becomes noisier without changing its average). Our example is a level shift, the most common and the easiest to see. Now watch what a standard forecast does with it. We hold out the last 12 months as a test set, then forecast them using the simplest baseline there is: the average of all history.

```r title="Forecast with a full-history average"
train <- window(sales_ts, end = c(2024, 12))     # first 108 months
test  <- window(sales_ts, start = c(2025, 1))     # last 12 months, all post-break

fc_naive <- meanf(train, h = 12)                  # forecast = mean of every point

plot(fc_naive, main = "Full-history average forecast vs reality")
lines(test, col = "red", lwd = 2)

round(accuracy(fc_naive, test)[, c("RMSE", "MAE")], 2)
#>               RMSE   MAE
#> Training set 24.79 22.68
#> Test set     32.72 32.08
```

Look at the forecast line in the plot: it sits at roughly 116, floating in empty space between the old regime and the new one. The red line of reality is up near 150, far above it. On the test set the error is large, a root mean squared error (RMSE, the typical size of a forecast miss) of 32.72 units. The forecast is bad not because the method is broken, but because it averaged the 72 pre-break months near "100" with the 36 post-break months near "150" in the training window and landed at a number that describes neither.

[KEY INSIGHT]
**A structural break splits your history into separate regimes, and old data can actively hurt.** Once the rule changes, observations from before the break describe a world that no longer exists. Blindly averaging across the break pulls every forecast toward a level that no longer applies.

That is the mistake this whole tutorial exists to prevent. But before you can forecast through a break, you have to know where it is. So the first job is detection.

**Try it:** Rebuild the series with a bigger jump, from 100 up to 190, keep the same 108-month training window, and forecast it with `meanf()`. Read off the single point forecast and notice how it again lands between the two levels.

```r title="Your turn: forecast a bigger level shift"
ex_regime <- ifelse(1:120 < 73, 100, 190)
ex_sales  <- ex_regime + rnorm(120, 0, 6)
ex_ts     <- ts(ex_sales, frequency = 12, start = c(2016, 1))
ex_train  <- window(ex_ts, end = c(2024, 12))
# your code here: forecast ex_train with meanf(h = 12) and read the point forecast
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bigger level shift solution"
ex_fc <- meanf(ex_train, h = 12)
round(ex_fc$mean[1], 1)
#> [1] 130.8
```

**Explanation:** The training window holds 72 months near 100 and 36 months near 190, so their average is about 130.8, a forecast stranded halfway between the two regimes. A larger break just makes the averaging error larger.

</details>

## How do you find where the break happened?

To forecast through a break you first have to locate it. "Eyeballing the chart" does not scale to hundreds of series and misses breaks that are real but subtle. Instead we let an algorithm scan the series and find the split point that best explains the data. The `changepoint` package does exactly this, and it runs directly in your browser here.

The core idea is simple. For every possible split point, the algorithm measures how much better the data is described by two segments (each with its own average and spread) instead of one. The split that gives the biggest improvement, after paying a penalty for added complexity, is the break. We use `cpt.meanvar()`, which allows both the mean and the variance to change across the break.

```r title="Detect the break with changepoint"
cp <- cpt.meanvar(as.numeric(sales), method = "PELT")

cat("Break detected at month:", cpts(cp), "\n")
#> Break detected at month: 72
round(param.est(cp)$mean, 1)
#> [1]  99.2 149.7
round(param.est(cp)$variance, 1)
#> [1] 30.4 46.5
```

The function found the break at month 72, exactly where we planted it. The `cpts()` helper returns the break location, and `param.est()` reports what each segment looks like: the average is 99.2 before the break and 149.7 after, matching the true regimes. The `method = "PELT"` argument names the search algorithm (Pruned Exact Linear Time), which finds the optimal split points quickly even on long series. In one call, you have turned "something changed around here" into a precise month.

![Match the detector to the kind of change you expect.](screenshots/Forecasting-Structural-Breaks-in-R-detector-choice.webp)
*Figure 2: Match the detector to the kind of change you expect.*

There is one trap worth naming, because it bites almost everyone the first time. The sister function `cpt.mean()` searches for shifts in the average while assuming the noise level is fixed and equal to one. Real data rarely obeys that, so it tends to chop the series into dozens of tiny false segments. Using `cpt.meanvar()`, which estimates the noise as it goes, avoids the problem and finds the single true break.

[WARNING]
**A mean-only search assumes the noise has variance one and will over-segment real data.** On this very series, cpt.mean() reports more than seventy spurious break points. Reach for cpt.meanvar() instead, which estimates the spread in each segment and recovers the single genuine break.

The same package detects breaks in variance, where the average holds steady but the series suddenly gets noisier. That matters for forecasting because it inflates your prediction intervals, not your point forecast. Here we build a series whose spread jumps at observation 80 and let `cpt.var()` find it.

```r title="Detect a variance break"
set.seed(99)
vol <- c(rnorm(80, mean = 20, sd = 2), rnorm(80, mean = 20, sd = 8))
cpv <- cpt.var(vol, method = "PELT")

cat("Variance break at:", cpts(cpv), "\n")
#> Variance break at: 82
round(param.est(cpv)$variance, 1)
#> [1]  3.3 66.1
```

The detector placed the variance break at observation 82 (the truth was 80) and estimated the spread as 3.3 in the calm first half against 66.1 in the turbulent second half. The average never moved, but the spread around it jumped sharply. Which detector you reach for depends on what kind of change you expect, and Figure 2 above is your cheat sheet.

[TIP]
**Use method AMOC when you expect a single break and PELT when there could be several.** AMOC (At Most One Change) is constrained to find the one most significant split, which is perfect for a known one-off event. PELT searches for any number of breaks, which suits long, messy histories.

**Try it:** The series below has two clear halves. Run `cpt.meanvar()` on it and read the break location with `cpts()`.

```r title="Your turn: find the break location"
ex_series <- c(rnorm(50, 5, 1), rnorm(50, 12, 1))
# your code here: run cpt.meanvar(ex_series, method = "AMOC") and read cpts()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Find the break location solution"
ex_cp <- cpt.meanvar(ex_series, method = "AMOC")
cpts(ex_cp)
#> [1] 50
```

**Explanation:** The series switches from an average of 5 to an average of 12 at observation 50, and `cpt.meanvar()` with `method = "AMOC"` returns that single split point.

</details>

## How do the classic tests confirm a structural break?

The `changepoint` approach answers "where is the break?" A second family, from econometrics, answers a slightly different question: "is there a break at all, and can I put a confidence interval and a p-value on it?" That family lives in the `strucchange` package. It is built on regression, so it also handles breaks in a trend, not just a level. These functions need a full R installation rather than the in-browser engine, so the blocks below are marked to run locally, but every result is real.

The workhorse is `breakpoints()`. We regress the series on a constant (`sales ~ 1`), which tells the function to look for shifts in the average, and it returns the split that minimises the total squared error, along with a confidence interval.

```r-static title="Estimate breakpoints with strucchange"
library(strucchange)

bp <- breakpoints(sales ~ 1)
bp$breakpoints
#> [1] 72
confint(bp)
#>   2.5 % breakpoints 97.5 %
#> 1    71          72     73
```

The estimate agrees with `changepoint` to the month: the break is at observation 72, and the 95% confidence interval is a tight window of months 71 to 73. That interval is genuinely useful, it tells you how sure you can be about the timing, which a point estimate alone never does. Regressing on `sales ~ trend` instead would hunt for a change in slope, the tool for a trend break, and the Bayesian Information Criterion picks how many breaks the data actually supports.

Sometimes you need a formal yes-or-no answer before you act. Two classic tests provide it. The supF test (also called the Quandt Likelihood Ratio) scans every candidate break date and reports the largest instability it finds, while the OLS-CUSUM test tracks the running sum of forecast errors and flags when it drifts too far from zero.

```r-static title="Test whether the break is significant"
qlr <- Fstats(sales ~ 1)
sctest(qlr)
#> 	supF test
#> data:  qlr
#> sup.F = 1962.8, p-value < 2.2e-16

ocus <- efp(sales ~ 1, type = "OLS-CUSUM")
sctest(ocus)
#> 	OLS-based CUSUM test
#> data:  ocus
#> S0 = 5.1904, p-value < 2.2e-16
```

Both tests return a p-value below 2.2e-16, far under any sensible threshold, so both reject the idea that the series is stable. The huge supF statistic of 1962.8 is the strength of the single most significant break; the CUSUM statistic of 5.19 confirms the running errors wander far from zero. In plain terms: yes, there is definitely a break, and you are safe to treat the series as two regimes.

[NOTE]
**Use changepoint for fast in-browser detection, and strucchange when you need a confidence interval or a formal test for a trend break.** They usually agree on the location, as they do here; strucchange simply adds the statistical paperwork that regression gives you for free.

**Try it (run locally):** The `bp` object above stores the break index in `bp$breakpoints`. Convert that index into a calendar year and month, remembering the series starts in January 2016.

```r-static title="Your turn: convert the break index to a date"
# your code here: read bp$breakpoints, then compute the year and month.
# Hint: year = 2016 + (index - 1) %/% 12, month = (index - 1) %% 12 + 1
```

<details>
<summary>Click to reveal solution</summary>

```r-static title="Convert the break index solution"
brk_index <- bp$breakpoints
c(index = brk_index,
  year  = 2016 + (brk_index - 1) %/% 12,
  month = (brk_index - 1) %% 12 + 1)
#> index  year month
#>    72  2021    12
```

**Explanation:** Month 72 of a series that starts in January 2016 is December 2021, so the last stable month is December 2021 and the new regime begins in January 2022.

</details>

## How do you forecast through a structural break?

Now for the payoff. You have found the break; the question is how to forecast the future without letting the pre-break past pollute it. There are three practical strategies, and Figure 3 lays them out. Each one takes the detected break and turns it into a reliable forecast; they differ in how much data they keep and how much modelling they do.

![Three routes from a detected break to a reliable forecast.](screenshots/Forecasting-Structural-Breaks-in-R-forecast-strategy.webp)
*Figure 3: Three routes from a detected break to a reliable forecast.*

**Strategy 1: refit on the recent regime.** The simplest fix is also the most effective: detect the break, throw away everything before it, and fit your model on the current regime only. We detect the break inside the training data, keep the post-break months, and forecast from there.

```r title="Refit the model on the post-break regime"
cp_train <- cpt.meanvar(as.numeric(train), method = "AMOC")
brk_tr   <- cpts(cp_train)
cat("Break in training data at month:", brk_tr, "\n")
#> Break in training data at month: 72

# Month 72 is December 2021, so the new regime starts in January 2022:
post <- window(train, start = c(2022, 1))
fc_refit <- meanf(post, h = 12)

round(accuracy(fc_refit, test)[, c("RMSE", "MAE")], 2)
#>              RMSE  MAE
#> Training set 6.87 5.97
#> Test set     6.72 5.84
```

The test-set RMSE drops from 32.72 with the full history to 6.72 on the recent regime, a nearly fivefold improvement, from the exact same forecasting method. All we changed was the data we fed it. By fitting only the post-break months, the average settles at the true new level of about 150 instead of being dragged down by ancient history.

**Strategy 2: model the break with a step dummy.** Refitting throws data away, which stings when the post-break regime is short. A thriftier option keeps every observation but tells the model exactly when the level shifted, using a step variable that is 0 before the break and 1 after. We add it as an external regressor to an ARIMA model.

```r title="Model the break with a step dummy"
step <- as.numeric(seq_along(train) > brk_tr)   # 0 before the break, 1 after
fit_step <- Arima(train, order = c(0, 0, 0), xreg = step)
round(coef(fit_step), 1)
#> intercept      xreg
#>      99.2      51.0

fc_step <- forecast(fit_step, h = 12, xreg = rep(1, 12))
round(accuracy(fc_step, test)[, c("RMSE", "MAE")], 2)
#>              RMSE  MAE
#> Training set 6.00 4.87
#> Test set     6.72 5.84
```

The model reads the break perfectly. It estimates a baseline level of 99.2 and a step coefficient of 51.0, which recovers the true jump of about 50 units almost exactly. The test RMSE matches the refit approach at 6.72, but notice the training RMSE is lower (6.00 versus 6.87), because this model learned from all 108 months instead of just the recent 36. What that step regressor does is captured in one small equation.

$$y_t = \beta_0 + \beta_1 D_t + \varepsilon_t$$

Where:
- $y_t$ = the observed value at time $t$
- $\beta_0$ = the baseline level before the break
- $D_t$ = the step dummy, equal to 0 before the break and 1 after
- $\beta_1$ = the size of the level shift (here about 51)
- $\varepsilon_t$ = the remaining noise

If you are not interested in the algebra, skip it: the code already showed that $\beta_1$ lands on the true shift. To forecast, you simply set the dummy to 1 for every future month, since the future lives in the post-break world.

[KEY INSIGHT]
**Refitting buys a clean regime by discarding data; a step dummy keeps every point but must be told when the break happened.** Choose refitting when you have plenty of recent data and want zero fuss, and choose the step dummy when the post-break regime is short and you cannot afford to throw history away.

**Strategy 3: prefer break-robust models and watch your intervals.** Some models absorb a level shift better than others. An adaptive model like exponential smoothing (ETS) keeps re-estimating the current level, so after a jump it quickly re-anchors and its point forecast survives. The hidden cost is the prediction interval: the break inflates the model's estimate of the noise, so its intervals balloon. Compare the same model fit on all history versus the recent regime.

```r title="Compare robust models and interval widths"
fc_ets      <- forecast(ets(train), h = 12)   # adaptive model on ALL history
fc_ets_post <- forecast(ets(post),  h = 12)   # same model on the recent regime

round(c(full_RMSE = accuracy(fc_ets, test)["Test set", "RMSE"],
        post_RMSE = accuracy(fc_ets_post, test)["Test set", "RMSE"]), 2)
#> full_RMSE post_RMSE
#>      7.79      6.72

pi_full <- as.numeric(fc_ets$upper[1, 2]      - fc_ets$lower[1, 2])
pi_post <- as.numeric(fc_ets_post$upper[1, 2] - fc_ets_post$lower[1, 2])
round(c(full_PI_width = pi_full, post_PI_width = pi_post), 1)
#> full_PI_width post_PI_width
#>          36.2          27.7
```

The point forecasts are close (RMSE 7.79 versus 6.72), confirming that ETS re-anchored to the new level on its own. But the 95% prediction interval is 36.2 units wide on the full history and only 27.7 units wide on the clean regime. The break inflated the full-history model's estimate of the noise, so its intervals are wider than the recent regime warrants. For a trend break rather than a level shift, the robust choice is a damped trend, which stops the model extrapolating a slope that no longer holds.

**Try it:** Fit an ETS model on the post-break window `post` and read its test-set RMSE, confirming it matches the refit result.

```r title="Your turn: forecast the recent regime with ETS"
# your code here: build forecast(ets(post), h = 12) and read its Test set RMSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="ETS on the recent regime solution"
ex_ets <- forecast(ets(post), h = 12)
round(accuracy(ex_ets, test)["Test set", "RMSE"], 2)
#> [1] 6.72
```

**Explanation:** Fitting ETS on the clean post-break regime gives a test RMSE of 6.72, the same as the naive refit, because once the old regime is gone there is little left to model beyond the new level.

</details>

## Which detector and forecasting strategy should you pick?

You now have a toolbox. The trick is matching the tool to the break. The table below is the decision guide: identify the kind of change, pick the detector, then pick the forecasting move.

| Break is in the | Looks like | Detect with | Forecast with |
|---|---|---|---|
| Level | The average jumps to a new plateau | cpt.meanvar() or breakpoints(y ~ 1) | Refit on the regime, or a step dummy |
| Trend | Growth speeds up, slows, or reverses | breakpoints(y ~ trend) | Refit, or a damped trend |
| Variance | Same average, suddenly noisier | cpt.var() | Keep the model, widen the intervals |

To make this repeatable, wrap the common case in a tiny helper. It runs the single-break detector, returns the break month, and reports the average in each regime so you can see the size of the shift at a glance.

```r title="A reusable break diagnostic"
diagnose_break <- function(y) {
  cp <- cpt.meanvar(as.numeric(y), method = "AMOC")
  b  <- cpts(cp)
  list(break_at = b, means = round(param.est(cp)$mean, 1))
}

diagnose_break(sales)
#> $break_at
#> [1] 72
#>
#> $means
#> [1]  99.2 149.7
```

The helper reports the break at month 72 and the two regime averages, 99.2 and 149.7. With the shift size in hand (about 50 units on a base of 100, a big move), you would confidently refit on the recent regime. A tiny shift, by contrast, might not be worth acting on at all, which is the judgement the next callout is about.

[WARNING]
**Do not discard pre-break data when the break is small or the recent regime is tiny.** If the shift is minor or you only have a handful of post-break points, refitting can leave you with too little data to estimate anything stable. Prefer a step dummy there, which keeps the full sample while still accounting for the change.

**Try it:** Run the `diagnose_break()` helper on the mystery series below, read the break location and the two regime averages, and decide which forecasting strategy fits.

```r title="Your turn: diagnose a mystery series"
set.seed(5)
ex_mystery <- ifelse(1:80 < 41, 30, 55) + rnorm(80, 0, 3)
# your code here: call diagnose_break(ex_mystery)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Diagnose a mystery series solution"
diagnose_break(ex_mystery)
#> $break_at
#> [1] 40
#>
#> $means
#> [1] 30.2 54.8
```

**Explanation:** The helper finds a break at observation 40 with the average moving from 30.2 to 54.8, a large level shift, so refitting on the post-break regime (or a step dummy) is the right call.

</details>

## Complete Example: forecasting website traffic after a launch

Let's put every piece together on a fresh, realistic problem. A website runs steady at about 1,200 daily sessions, then a marketing launch on day 60 lifts it permanently to around 1,750. We have 180 days of history and want to forecast the next three weeks. First we detect the break.

```r title="Detect the launch effect in traffic data"
set.seed(7)
day     <- 1:180
launch  <- 60
base    <- ifelse(day < launch, 1200, 1750)
traffic <- round(base + rnorm(180, mean = 0, sd = 90))

traffic_cp <- cpt.meanvar(traffic, method = "AMOC")
cat("Detected launch effect at day:", cpts(traffic_cp), "\n")
#> Detected launch effect at day: 59
round(param.est(traffic_cp)$mean, 0)
#> [1] 1221 1758
```

The detector pins the break to day 59, one day before the true launch, and estimates the two levels as 1,221 and 1,758 sessions, both spot on. Now we forecast the final 21 days three ways: with the full history, with a refit on the post-break regime, and with a step dummy, then compare their errors on the held-out test set.

```r title="Compare three forecasts on a hold-out"
tr_train <- traffic[1:159]
tr_test  <- traffic[160:180]

b <- cpts(cpt.meanvar(tr_train, method = "AMOC"))
tr_post  <- ts(tr_train[(b + 1):length(tr_train)], frequency = 7)
fc_refit_tr <- meanf(tr_post, h = 21)

step_tr <- as.numeric(seq_along(tr_train) > b)
fit_tr  <- Arima(ts(tr_train, frequency = 7), order = c(0, 0, 0), xreg = step_tr)
fc_step_tr <- forecast(fit_tr, h = 21, xreg = rep(1, 21))

full_fc <- meanf(ts(tr_train, frequency = 7), h = 21)

round(c(full_history = accuracy(full_fc, tr_test)["Test set", "RMSE"],
        refit_regime = accuracy(fc_refit_tr, tr_test)["Test set", "RMSE"],
        step_dummy   = accuracy(fc_step_tr, tr_test)["Test set", "RMSE"]), 1)
#> full_history refit_regime   step_dummy
#>        215.3         83.2         83.2
```

The verdict is stark. The full-history forecast misses by an RMSE of 215.3 sessions, because it averages the quiet pre-launch weeks with the busy post-launch ones. Both break-aware strategies cut that error to 83.2, more than a twofold improvement, by forecasting from the world that actually exists now. This is the entire workflow in miniature: detect the break, then either refit on the recent regime or model the break explicitly, and never let stale history set your baseline.

[TIP]
**Always validate a break-aware forecast on a hold-out sample.** Comparing full-history, refit, and step-dummy forecasts on the same test set, as we did here, turns "I think dropping old data helps" into a measured RMSE improvement you can defend.

## Practice Exercises

These two exercises combine detection and forecasting. Each uses its own variables so nothing clashes with the tutorial code above, and every expected number is shown so you can check your work.

### Exercise 1: Detect a break and beat the full-history forecast

A series of 96 months holds at an average of 40 until month 60, then jumps to 65. Detect the break in the first 84 months, refit `meanf()` on the post-break regime, and compare its test-set RMSE (on the last 12 months) against a full-history forecast. You should find the refit forecast is dramatically better.

```r title="Exercise 1 starter"
set.seed(321)
my_sales <- ifelse(1:96 < 61, 40, 65) + rnorm(96, 0, 4)
my_ts    <- ts(my_sales, frequency = 12)
my_train <- ts(my_sales[1:84], frequency = 12)
my_test  <- my_sales[85:96]
# your code here: detect the break with cpt.meanvar(method = "AMOC"),
# refit meanf() on the post-break months, and compare Test RMSE to a full-history meanf()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_b    <- cpts(cpt.meanvar(as.numeric(my_train), method = "AMOC"))
my_post <- ts(my_sales[(my_b + 1):84], frequency = 12)
my_refit <- meanf(my_post, h = 12)
my_full  <- meanf(my_train, h = 12)

round(c(break_at   = my_b,
        full_RMSE  = accuracy(my_full,  my_test)["Test set", "RMSE"],
        refit_RMSE = accuracy(my_refit, my_test)["Test set", "RMSE"]), 2)
#>   break_at  full_RMSE refit_RMSE
#>      60.00      17.21       4.84
```

**Explanation:** The detector finds the break at month 60. Refitting on the post-break regime cuts the test RMSE from 17.21 to 4.84, because the forecast now sits at the true new level of 65 instead of averaging in the old level of 40.

</details>

### Exercise 2: Recover the size of a level shift with a step dummy

A series of 100 observations shifts up by 15 units at observation 51. Without discarding any data, fit an ARIMA model with a step dummy, recover the estimated shift from the coefficients, and forecast 12 steps ahead. The step coefficient should land near 15 and the forecast near 35.

```r title="Exercise 2 starter"
set.seed(654)
my_y2   <- ifelse(1:100 < 51, 20, 35) + rnorm(100, 0, 3)
my_step <- as.numeric(1:100 >= 51)
# your code here: fit Arima(my_y2, order = c(0,0,0), xreg = my_step),
# read coef(), then forecast 12 steps with xreg = rep(1, 12)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fit <- Arima(my_y2, order = c(0, 0, 0), xreg = my_step)
round(coef(my_fit), 1)
#> intercept      xreg
#>      19.9      14.5

my_fc  <- forecast(my_fit, h = 12, xreg = rep(1, 12))
round(my_fc$mean[1], 1)
#> [1] 34.4
```

**Explanation:** The model estimates a baseline of 19.9 and a step of 14.5, recovering the true shift of 15 without throwing away a single observation. Setting the dummy to 1 for the future gives a forecast of 34.4, right at the new regime level.

</details>

## Frequently Asked Questions

**What is the difference between a structural break and an outlier?**
An outlier is a single unusual point that the series returns from immediately. A structural break is a permanent change in the rule generating the data: after it, the new behaviour continues. Detect outliers with spike-focused methods; treat breaks by re-scoping your training data or modelling the shift.

**How much post-break data do I need before I can trust a refit?**
Enough to estimate your model. A plain level model needs only a handful of points, while a seasonal model needs at least a full cycle or two. If the post-break regime is too short, keep the full sample and use a step dummy instead of refitting.

**Can I just forecast without detecting the break?**
Sometimes. Adaptive models such as ETS and differenced ARIMA partly absorb a level shift on their own, so the point forecast may survive. But they inflate their prediction intervals and mishandle trend breaks, so explicit detection plus a refit or step dummy is safer and more accurate.

**Does differencing or auto.arima fix structural breaks automatically?**
Only partly. Differencing turns a one-time level shift into a single spike in the differenced series, which localises the damage but does not remove it, and it does nothing for a trend or variance break. Detecting the break and acting on it is more reliable than hoping the model absorbs it on its own.

**changepoint or strucchange, which should I use?**
Use `changepoint` for fast, general detection of shifts in mean or variance, especially across many series. Use `strucchange` when you want confidence intervals, a formal significance test, or detection of a break in a regression relationship such as a trend. They usually agree on the location.

## Summary

Structural breaks are the reason a perfectly reasonable forecast can be badly wrong: the model is describing a past that no longer applies. The fix is a two-step discipline, detect the break, then forecast from the current regime.

| Concept | Tool in R | Takeaway |
|---|---|---|
| See the break | plot() plus regime means | A level shift, trend bend, or variance jump splits history into regimes |
| Locate the break | cpt.meanvar(), cpt.var() | changepoint pins the break month in one call, in your browser |
| Confirm the break | breakpoints(), sctest() | strucchange adds confidence intervals and a formal p-value |
| Refit on the regime | window() plus meanf()/ets() | Dropping pre-break data cut our RMSE nearly fivefold |
| Model the break | Arima(xreg = step) | A step dummy keeps all data and recovers the shift size |
| Robust forecasting | ets(), damped trend | Adaptive models survive the point forecast but widen their intervals |

The through-line: never let data from before a break set your baseline. Detect it, then either refit on the recent regime or tell the model exactly when the world changed.

## References

1. Killick, R. & Eckley, I. A. - *changepoint: An R Package for Changepoint Analysis*. Journal of Statistical Software, 58(3), 2014. [Link](https://www.jstatsoft.org/article/view/v058i03)
2. Zeileis, A., Leisch, F., Hornik, K. & Kleiber, C. - *strucchange: Testing for Structural Change in Linear Regression Models*. Journal of Statistical Software, 7(2), 2002. [Link](https://www.jstatsoft.org/article/view/v007i02)
3. Hyndman, R. J. & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. OTexts, 2021. [Link](https://otexts.com/fpp3/)
4. changepoint package reference. Comprehensive R Archive Network. [Link](https://cran.r-project.org/web/packages/changepoint/index.html)
5. strucchange package reference. Comprehensive R Archive Network. [Link](https://cran.r-project.org/web/packages/strucchange/index.html)
6. strucchange reference manual (PDF). Comprehensive R Archive Network. [Link](https://cran.r-project.org/web/packages/strucchange/strucchange.pdf)
7. Hyndman, R. J. - *forecast: Arima() function reference*. [Link](https://pkg.robjhyndman.com/forecast/reference/Arima.html)

## Continue Learning

- [Choosing a Forecasting Model in R](Choosing-a-Forecasting-Model-in-R.html) - how to compare competing forecasts on a hold-out set, the exact method used to grade our three strategies.
- [Measuring an Intervention's Effect with CausalImpact in R](CausalImpact-in-R.html) - when the break is a known event you caused, estimate how big its effect really was.
- [Forecasting Very Short (and Very Long) Time Series in R](Forecasting-Short-Time-Series-in-R.html) - the recent-window idea behind refitting on a regime, generalised to any long series.
