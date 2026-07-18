---
title: "Which Forecasting Model in R? A Decision Guide"
slug: "Choosing-a-Forecasting-Model-in-R"
description: "No single forecasting model wins everywhere. Match your trend and seasonality to Holt, ETS, SARIMA, Prophet, VAR or neural nets, then backtest to decide."
keywords: "which forecasting model in R, choosing a forecasting model, forecasting model selection R, ETS vs ARIMA in R, SARIMA vs ETS, R forecast package, time series model selection, rolling origin backtest"
auto_link_terms: "choosing a forecasting model|choose a forecasting model|which forecasting model|forecasting model selection|pick a forecasting model|forecasting decision guide|ETS vs ARIMA|ETS or SARIMA|model selection for time series|rolling origin backtest|seasonal naive baseline|forecasting model in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "DG3"
post_type: "FR"
fr_parent: "Time-Series-Objects-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">No single forecasting model wins everywhere. The right choice comes from reading your series' pattern, its trend, its seasonality and its autocorrelation, then shortlisting the models that fit that pattern and backtesting them against a simple baseline so the data, not the hype, picks the winner. This guide walks that process end to end in R, using base R plus the forecast package.</p>

## How do you choose a forecasting model in R?

Beginners often ask which model is "the best". That is the wrong question. A model that nails monthly retail sales can fall apart on daily website traffic, and the reverse is just as common. Instead of memorising a winner, you follow a short process: diagnose the pattern, shortlist a few models that suit it, add a naive baseline, then backtest and keep whatever forecasts best.

Here is that idea in action before we unpack it. We take `AirPassengers`, a classic monthly series of airline passengers from 1949 to 1960, hold out the last two years as a test set, and compare a dead-simple seasonal naive forecast against `auto.arima()`, which searches for a good ARIMA model on its own.

```r title="Baseline versus auto.arima on a held-out test set"
library(forecast)
air   <- AirPassengers
train <- window(air, end = c(1958, 12))
test  <- window(air, start = c(1959, 1))
h <- length(test)

rmse_snaive <- accuracy(snaive(train, h = h), test)["Test set", "RMSE"]
rmse_arima  <- accuracy(forecast(auto.arima(train), h = h), test)["Test set", "RMSE"]
round(c(seasonal_naive = rmse_snaive, auto_arima = rmse_arima), 1)
#> seasonal_naive     auto_arima 
#>           77.0           74.3 
```

Read the numbers. The seasonal naive forecast, which just repeats last year's value for the same month, lands a test-set error (RMSE, the typical size of a miss in passengers) of 77.0. The ARIMA model that searched dozens of candidates scores 74.3. That is an improvement of only about three percent. The lesson is not that ARIMA is bad. It is that "advanced" does not automatically mean "better", and the only way to know is to measure on data the model has never seen.

That measure-first mindset is the whole workflow, summarised below.

![The four-step model selection workflow](screenshots/Choosing-a-Forecasting-Model-in-R-workflow.webp)

*Figure 1: The four-step model selection workflow, diagnose then shortlist then baseline then backtest.*

[KEY INSIGHT]
**The baseline is the bar, not a formality.** A seasonal naive forecast costs one line of code and no assumptions, so any model you ship must beat it on held-out data. If it cannot, you have added complexity for nothing.

**Try it:** Move the split back so the test set is 1958 to 1960, then rerun the same two-model comparison. You will see the ranking can swing a lot with the split, which is exactly why one comparison is never enough.

```r title="Your turn: move the split back a year"
# Split AirPassengers so the last 36 months become the test set,
# then compare snaive() and auto.arima() by test-set RMSE, as above.
ex_train <- window(air, end = c(1957, 12))
ex_test  <- window(air, start = c(1958, 1))
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Earlier split comparison solution"
ex_train <- window(air, end = c(1957, 12))
ex_test  <- window(air, start = c(1958, 1))
ex_h <- length(ex_test)
round(c(
  seasonal_naive = accuracy(snaive(ex_train, h = ex_h), ex_test)["Test set", "RMSE"],
  auto_arima     = accuracy(forecast(auto.arima(ex_train), h = ex_h), ex_test)["Test set", "RMSE"]
), 1)
#> seasonal_naive     auto_arima 
#>           73.6           22.1 
```

**Explanation:** With this split, ARIMA (22.1) beats the baseline (73.6) by a wide margin, far wider than in the main example. The same data with a different split gives a different result. That instability is exactly why we backtest across many origins later instead of trusting one number.

</details>

## What patterns should you look for in your data?

Before you shortlist any model, you need to know what your series actually does. Three features drive almost every choice: is there a **trend** (a long-run drift up or down), is there **seasonality** (a pattern that repeats on a fixed calendar period), and how much **autocorrelation** is left once you strip those out (how strongly recent values predict the next one).

The cleanest way to see trend and seasonality is to split the series into three parts with STL decomposition: a smooth trend, a repeating seasonal shape and a leftover remainder. We can then measure how dominant each part is. A strength score near 1 means that component explains almost all the variation, and a score near 0 means it is barely there.

```r title="Measure strength of trend and seasonality"
comp  <- stl(air, s.window = "periodic")$time.series
var_r <- var(comp[, "remainder"])
strength_trend  <- max(0, 1 - var_r / var(comp[, "trend"]    + comp[, "remainder"]))
strength_season <- max(0, 1 - var_r / var(comp[, "seasonal"] + comp[, "remainder"]))
round(c(trend = strength_trend, seasonal = strength_season), 2)
#>    trend seasonal 
#>     0.97     0.78 
```

Both scores are high. A trend strength of 0.97 says the upward drift is unmistakable, and a seasonal strength of 0.78 says the yearly wave is strong too. So `AirPassengers` has trend and seasonality together, which already rules out models that handle only one of them and points us toward the seasonal families.

[NOTE]
**Treat a strength around 0.6 or higher as strong.** These scores come from the same feature definitions used in the forecast literature, and they turn a vague "looks trendy" into a number you can compare across series.

The other question is how much you would have to difference the series to make it stationary, which is what ARIMA needs. Differencing means subtracting the previous value (or the value one season ago) so the level and the seasonal pattern stop drifting. The forecast package can count the differences for you.

```r title="How much differencing would ARIMA need"
c(first_diffs = ndiffs(air), seasonal_diffs = nsdiffs(air))
#>    first_diffs seasonal_diffs 
#>              1              1 
```

The answer is one ordinary difference to kill the trend and one seasonal difference to kill the yearly cycle. That is the classic signature of an airline-style series, and it is exactly what a seasonal ARIMA is built to absorb. If you want the formal hypothesis tests behind stationarity, see the guide on [testing stationarity in R](Test-Stationarity-in-R.html).

**Try it:** The built-in `nottem` series holds monthly temperatures at Nottingham from 1920 to 1939. Decompose it and compute the strength of seasonality with the same formula. You should land near 0.94, because temperature is almost pure season.

```r title="Your turn: seasonal strength of nottem"
# Decompose nottem with stl() and compute strength of seasonality,
# using the same var(remainder) / var(seasonal + remainder) idea.
ex_comp <- stl(nottem, s.window = "periodic")$time.series
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal strength of nottem solution"
ex_comp <- stl(nottem, s.window = "periodic")$time.series
ex_r <- var(ex_comp[, "remainder"])
round(max(0, 1 - ex_r / var(ex_comp[, "seasonal"] + ex_comp[, "remainder"])), 2)
#> [1] 0.94
```

**Explanation:** A seasonal strength of 0.94 with almost no trend tells you a seasonal model with a flat level, such as seasonal ETS, is the natural first pick for `nottem`.

</details>

## Which model matches which pattern?

Once you know the pattern, the shortlist almost writes itself. The decision tree below is the map: start by fitting a naive baseline, then branch on the pattern you found.

![A decision tree from data pattern to candidate model](screenshots/Choosing-a-Forecasting-Model-in-R-decision-tree.webp)

*Figure 2: A decision tree from your data's pattern to a candidate model.*

Each branch corresponds to a model family. Here is the same map as a lookup table, with the R function that fits each one.

| Data pattern | Model family | R function |
|---|---|---|
| Flat, no trend or season | Simple exponential smoothing | `ses()` |
| Trend, no season | Holt's linear or damped trend | `holt()` |
| Trend and one seasonal cycle | ETS or seasonal ARIMA | `ets()`, `auto.arima()` |
| Strong autocorrelation and season | Seasonal ARIMA (SARIMA) | `auto.arima()` |
| Multiple seasons or holidays | Prophet | `prophet::prophet()` |
| Several series that move together | Vector autoregression | `vars::VAR()` |
| Nonlinear cycles | Neural network autoregression | `nnetar()` |

The good news is that you rarely set the internal orders by hand. Both `ets()` and `auto.arima()` search their own model spaces and return the best fit by an information criterion, a score that balances how well a model fits the data against how many parameters it uses, so a slightly better fit does not win if it costs a lot of extra complexity. Watch `ets()` read `AirPassengers` and label the model itself.

```r title="Let ets() choose the model"
fit_ets <- ets(train)
fit_ets$method
#> [1] "ETS(M,Ad,M)"
```

The label `ETS(M,Ad,M)` is a compact description: multiplicative error, an additive damped trend and multiplicative seasonality. In plain terms, `ets()` noticed the trend and the growing seasonal swing on its own and encoded both. If you want to understand every letter in that code, the [ETS models in R](ETS-Models-in-R.html) guide breaks them down.

When a series drifts but never repeats, you drop the seasonal machinery and use Holt's method, which extends simple smoothing with a trend term. Here is a made-up sales series that climbs steadily with no season, so Holt is the right tool.

```r title="Holt's method for a trending, non-seasonal series"
set.seed(101)
sales <- ts(cumsum(rnorm(48, mean = 3, sd = 4)) + 120, frequency = 1)
round(as.numeric(holt(sales, h = 4)$mean), 1)
#> [1] 249.4 252.1 254.7 257.4
```

The series ends near 246, and Holt projects it forward to 249.4, then 252.1, 254.7 and 257.4, carrying the recent slope into the future. That is what a trend model buys you: a forecast that keeps climbing instead of flattening out.

[TIP]
**Let ets() and auto.arima() choose the orders before you hand-tune anything.** Their automatic search is a strong, hard-to-beat starting point, and tweaking parameters by hand rarely helps until you have confirmed the automatic model on a backtest.

**Try it:** Fit `ets()` to `USAccDeaths`, the monthly count of accidental deaths in the US from 1973 to 1978, and read off the model string. Predict the trend letter first: this series has a clear season but no lasting drift, so expect the trend component to be none.

```r title="Your turn: what does ets() pick for USAccDeaths"
# Fit ets() to USAccDeaths and print the chosen model string.
# The middle letter is the trend: N (none), A (additive) or Ad (damped).
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="ets() choice for USAccDeaths solution"
ex_ets <- ets(USAccDeaths)
ex_ets$method
#> [1] "ETS(A,N,A)"
```

**Explanation:** `ETS(A,N,A)` means additive error, no trend and additive seasonality. The `N` confirms the intuition: `ets()` found a stable level with a repeating seasonal shape and no long-run drift.

</details>

## How do you shortlist and compare candidates fairly?

Diagnosing the pattern narrows you to two or three candidates. Now you let them compete. The first, quick comparison is a single train and test split: fit each model on the training portion, forecast the horizon you held out, and score the forecasts. The forecast package's `accuracy()` reports several error measures at once.

```r title="Compare candidates on the test set"
models <- list(
  snaive = snaive(train, h = h),
  ets    = forecast(ets(train), h = h),
  arima  = forecast(auto.arima(train), h = h)
)
acc <- t(sapply(models, function(f) accuracy(f, test)["Test set", c("RMSE", "MAE", "MAPE")]))
round(acc, 2)
#>         RMSE   MAE  MAPE
#> snaive 76.99 71.25 15.52
#> ets    72.55 63.21 13.30
#> arima  74.25 68.58 14.93
```

Three columns, three verdicts that happen to agree. RMSE and MAE are both average miss sizes in passengers, so lower is better. MAPE is the average miss as a percentage of the actual value, which is handy for comparing across series on different scales. On all three, `ets` comes out ahead (RMSE 72.55) of both `arima` (74.25) and the `snaive` baseline (76.99). Notice this flips the quick pairwise result from the first section, where ARIMA looked slightly better: a different split, a different winner. That fragility is the whole reason we do not stop here.

If you enjoy the underlying definitions, here are the two error measures used above. Skip this box if you are not interested; the code already computed them for you.

$$\text{RMSE} = \sqrt{\frac{1}{h}\sum_{i=1}^{h}\left(y_i - \hat{y}_i\right)^2}$$

$$\text{MAPE} = \frac{100}{h}\sum_{i=1}^{h}\left|\frac{y_i - \hat{y}_i}{y_i}\right|$$

Where:

- $y_i$ is the actual value at step $i$
- $\hat{y}_i$ is the forecast for step $i$
- $h$ is the number of steps in the test set

A single split can still fool you, because it judges each model on one slice of history. The robust fix is time series cross-validation, also called a rolling-origin backtest: forecast one step from an early cutoff, roll the cutoff forward, forecast again, and repeat across the whole series. The forecast package wraps this in `tsCV()`.

```r title="Rolling-origin cross-validation with tsCV"
far_snaive <- function(x, h) snaive(x, h = h)
far_ets    <- function(x, h) forecast(ets(x), h = h)

e_snaive <- tsCV(air, far_snaive, h = 1)
e_ets    <- tsCV(air, far_ets,    h = 1)
round(c(snaive = sqrt(mean(e_snaive^2, na.rm = TRUE)),
        ets    = sqrt(mean(e_ets^2,    na.rm = TRUE))), 1)
#> snaive    ets 
#>   36.5   14.5 
```

Now the verdict is decisive and stable. Averaged over every origin in the series, the seasonal naive forecast is off by about 36.5 passengers one step ahead, while ETS is off by only 14.5. ETS more than halves the baseline error across the whole history, not just one lucky window, so it is the model you would actually deploy for `AirPassengers`.

[WARNING]
**One train-test split can crown the wrong model.** A model can look best on a single held-out window purely by chance, so confirm the shortlist with rolling-origin cross-validation before you trust the ranking.

**Try it:** Rerun `tsCV()` on the seasonal naive method, but forecast 12 months ahead instead of one step. Longer horizons are harder, so expect the RMSE to rise, landing near 37.

```r title="Your turn: rolling-origin error at a 12-month horizon"
# Re-run tsCV on snaive with h = 12, then report the RMSE
# as sqrt(mean(errors^2, na.rm = TRUE)).
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal naive rolling-origin RMSE at h = 12 solution"
ex_e <- tsCV(air, function(x, h) snaive(x, h = h), h = 12)
round(sqrt(mean(ex_e^2, na.rm = TRUE)), 1)
#> [1] 37.1
```

**Explanation:** At a 12-month horizon the seasonal naive RMSE is 37.1, close to its one-step value here because the yearly pattern is so regular. On messier series, the error would grow much faster with the horizon.

</details>

## When should you reach for Prophet, VAR, or neural nets?

ETS and ARIMA cover most single-series forecasting, but three situations pull you off that main path. Each maps to a branch on the right of the decision tree.

**Prophet** is worth reaching for when a single series has more than one seasonal cycle at once (say weekly and yearly), when holidays or promotions cause big one-off spikes, or when you have gaps and outliers you would rather not clean by hand. Prophet fits a curve made of a trend plus seasonal and holiday terms, and it exposes plain-language knobs that a non-specialist can tune. It is not part of the interactive runtime here, so you would run it locally with `library(prophet)`. If your series is a clean single season, Prophet usually offers no accuracy edge over ETS or SARIMA, so do not reach for it by default.

**Neural network autoregression** suits series whose ups and downs are nonlinear, meaning the jump to the next value is not a straight-line function of the recent past. The `nnetar()` function fits a small neural net that predicts each value from its own lags, and it runs right here. The `lynx` series, annual counts of trapped Canada lynx, has famously sharp, irregular boom-and-bust cycles that trip up linear models.

```r title="A neural network for nonlinear cycles"
set.seed(2015)
fit_nnar <- nnetar(lynx)
fit_nnar
#> Series: lynx 
#> Model:  NNAR(8,4) 
#> Call:   nnetar(y = lynx)
#> 
#> Average of 20 networks, each of which is
#> a 8-4-1 network with 41 weights
#> options were - linear output units 
#> 
#> sigma^2 estimated as 82661
```

The label `NNAR(8,4)` means the net uses the last 8 values as inputs and 4 nodes in a hidden layer, and it averages 20 such networks to steady the forecast. We set a seed first because the networks start from random weights, so the seed makes the result reproducible. Neural nets need plenty of history and offer little interpretability, so treat them as a specialist tool, not a default.

**Vector autoregression (VAR)** is the choice when you have several series that influence each other, and you want to forecast them jointly rather than one at a time. Interest rates, employment and output, for example, move together, so a model that lets each series depend on the recent past of all the others can beat separate univariate models. VAR lives in the `vars` package, which runs locally rather than in the browser. The block below picks a sensible lag order for Canada's macroeconomic series, where each criterion votes for how many lags to include.

```r-static title="Run locally: choose a VAR lag order"
# The vars package is not part of the browser runtime; run this in
# your own R session (install.packages("vars") first if needed).
library(vars)
data(Canada)
VARselect(Canada, lag.max = 6, type = "const")$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n) 
#>      3      2      2      3 
```

The four selection criteria suggest two or three lags, and you would fit `VAR(Canada, p = 2)` from there. The takeaway is not the exact number but the shape of the decision: when series move together, model them together.

[NOTE]
**Prophet and VAR are not in the browser runtime, so their blocks are marked to run locally.** Install them once with `install.packages()` and the code runs unchanged in RStudio or any local R session.

**Try it:** Fit `nnetar()` to `sunspot.year`, the yearly sunspot counts, a textbook nonlinear cycle. Set a seed first, then read the NNAR order it selects. You should see a slightly larger net than the lynx example.

```r title="Your turn: a neural net for sunspots"
# Set a seed, fit nnetar() to sunspot.year, and print the model
# string with $method to read the NNAR order.
set.seed(7)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Neural net order for sunspots solution"
set.seed(7)
ex_nn <- nnetar(sunspot.year)
ex_nn$method
#> [1] "NNAR(9,5)"
```

**Explanation:** `NNAR(9,5)` uses the last 9 years as inputs and 5 hidden nodes, a bigger net than lynx because the sunspot cycle is longer and more intricate.

</details>

## Practice Exercises

These pull the whole workflow together. Each solution runs in the same session, so the earlier objects and libraries are still loaded.

### Exercise 1: Pick a model for USAccDeaths

Hold out the last 12 months of `USAccDeaths` as a test set. Fit `snaive()`, `ets()` and `auto.arima()` on the rest, then compare their test-set RMSE and decide which to ship.

```r title="Exercise 1 starter: pick a model for USAccDeaths"
# Split off the last 12 months, fit the three models on the training
# portion, and compare accuracy(...)["Test set", "RMSE"] for each.
my_train <- window(USAccDeaths, end = c(1977, 12))
my_test  <- window(USAccDeaths, start = c(1978, 1))
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_train <- window(USAccDeaths, end = c(1977, 12))
my_test  <- window(USAccDeaths, start = c(1978, 1))
h12 <- length(my_test)
round(c(
  snaive = accuracy(snaive(my_train, h = h12), my_test)["Test set", "RMSE"],
  ets    = accuracy(forecast(ets(my_train), h = h12), my_test)["Test set", "RMSE"],
  arima  = accuracy(forecast(auto.arima(my_train), h = h12), my_test)["Test set", "RMSE"]
), 1)
#> snaive    ets  arima 
#>  341.2  289.6  288.8 
```

**Explanation:** ARIMA (288.8) and ETS (289.6) are neck and neck and both clear the seasonal naive baseline (341.2). With the two close, you would confirm the pick with `tsCV()` before deciding.

</details>

### Exercise 2: Diagnose co2 and name the family

The `co2` series is the monthly Mauna Loa carbon dioxide reading. Decompose it, compute the strength of trend and of seasonality, then use the decision tree to name the model family those numbers point to.

```r title="Exercise 2 starter: diagnose co2"
# Decompose co2 with stl(), then compute strength of trend and
# strength of seasonality, as in the diagnosis section.
my_comp <- stl(co2, s.window = "periodic")$time.series
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_comp <- stl(co2, s.window = "periodic")$time.series
my_r <- var(my_comp[, "remainder"])
round(c(
  trend    = max(0, 1 - my_r / var(my_comp[, "trend"]    + my_comp[, "remainder"])),
  seasonal = max(0, 1 - my_r / var(my_comp[, "seasonal"] + my_comp[, "remainder"]))
), 2)
#>    trend seasonal 
#>     1.00     0.98 
```

**Explanation:** Trend strength 1.00 and seasonal strength 0.98 mean strong trend with strong season, which is the "trend and one seasonal cycle" branch: fit ETS and seasonal ARIMA, then backtest.

</details>

### Exercise 3: Write a reusable backtest helper

Turn the train-test comparison into a function `test_rmse(y, h)` that holds out the last `h` points of any series `y`, fits `snaive()` and `ets()` on the rest, and returns both test-set RMSEs. Then call it on `USAccDeaths` with `h = 12`.

```r title="Exercise 3 starter: a reusable backtest helper"
# Fill in the body: split y into head (train) and tail (test) of
# length h, fit both models, return a named vector of test RMSEs.
test_rmse <- function(y, h) {
  # your code here
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
test_rmse <- function(y, h) {
  tr <- head(y, length(y) - h)
  te <- tail(y, h)
  c(snaive = accuracy(snaive(tr, h = h), te)["Test set", "RMSE"],
    ets    = accuracy(forecast(ets(tr), h = h), te)["Test set", "RMSE"])
}
round(test_rmse(USAccDeaths, 12), 1)
#> snaive    ets 
#>  341.2  289.6 
```

**Explanation:** Wrapping the split in a function lets you rerun the same fair comparison on any series with one call, which is how you keep model selection consistent across a whole project.

</details>

## Frequently Asked Questions

### What is the single best forecasting model in R?

There is not one. The "no free lunch" idea applies squarely to forecasting: a model that wins on one series can lose on another. The reliable move is to shortlist by pattern and let a backtest decide, which is why `ets()` and `auto.arima()` plus a naive baseline are such a common starting trio.

### Should I use ETS or ARIMA?

Try both and compare. They overlap but are not identical: some ETS models have no ARIMA equivalent and vice versa. On strongly seasonal data they often finish close, so a rolling-origin backtest usually settles it. The [ETS vs ARIMA in R](ETS-vs-ARIMA-in-R.html) guide runs that head-to-head in detail.

### Do I need to make my series stationary first?

Only for ARIMA, and even then `auto.arima()` handles the differencing for you after `ndiffs()` and `nsdiffs()` estimate how much is needed. ETS, Holt and Prophet do not require stationarity, so this is an ARIMA-specific step rather than a universal one.

### How much data do I need before a fancy model is worth it?

Rough guidance: you want at least a few full seasonal cycles, so two to three years of monthly data at a minimum before seasonal models are stable. With only a handful of points, a naive or simple smoothing forecast is often the honest choice, and neural nets in particular need long histories.

### Is Prophet always the right pick for business forecasting?

No. Prophet shines with multiple seasonalities, holiday effects and messy gaps, but on a clean single-season series it rarely beats ETS or SARIMA. Reach for it when its specific strengths match your data, not by default.

### How many models should I compare?

Two or three that fit the diagnosed pattern, plus a baseline. Testing more than that risks picking a winner by chance, so keep the shortlist small and judge it with cross-validation rather than a single split.

## Summary

Choosing a forecasting model is a repeatable process, not a lookup of the "best" algorithm. Diagnose the pattern, shortlist the models that fit it, keep a naive baseline as the bar, then backtest and deploy whatever forecasts best on data it has not seen.

| Data pattern | Start with | Confirm by |
|---|---|---|
| Flat level | `ses()` | Beat `naive()` on a backtest |
| Trend, no season | `holt()` | Backtest damped vs linear trend |
| Trend and season | `ets()`, `auto.arima()` | Rolling-origin `tsCV()` |
| Multiple seasons or holidays | Prophet (local) | Compare to ETS or SARIMA |
| Several linked series | `vars::VAR()` (local) | Compare to per-series models |
| Nonlinear cycles | `nnetar()` | Backtest against a linear model |

The four-step checklist to keep on hand:

1. **Diagnose** trend, seasonality and leftover autocorrelation with `stl()`, `ndiffs()` and `nsdiffs()`.
2. **Shortlist** two or three models from the decision tree that match the pattern.
3. **Baseline** every candidate against `snaive()` or `naive()`.
4. **Backtest** with `tsCV()` and keep the model with the lowest rolling-origin error.

## References

1. Hyndman, R.J. and Athanasopoulos, G. Forecasting: Principles and Practice (3rd ed). [Link](https://otexts.com/fpp3/)
2. Hyndman and Athanasopoulos. Time series cross-validation, FPP3. [Link](https://otexts.com/fpp3/tscv.html)
3. Hyndman, R.J. forecast package reference. [Link](https://pkg.robjhyndman.com/forecast/)
4. forecast package on CRAN. [Link](https://cran.r-project.org/package=forecast)
5. fable package documentation. [Link](https://fable.tidyverts.org/)
6. Prophet documentation, Meta. [Link](https://facebook.github.io/prophet/)
7. vars package on CRAN. [Link](https://cran.r-project.org/package=vars)

## Continue Learning

- [ETS vs ARIMA in R](ETS-vs-ARIMA-in-R.html): the head-to-head comparison of the two workhorse families, run on real data.
- [ETS Models in R](ETS-Models-in-R.html): what every letter in a label like `ETS(M,Ad,M)` means and how `ets()` chooses.
- [Test Stationarity in R](Test-Stationarity-in-R.html): the formal tests behind the differencing that ARIMA relies on.
