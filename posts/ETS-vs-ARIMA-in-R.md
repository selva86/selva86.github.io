---
title: "ETS vs ARIMA in R: Which Forecasting Model Should You Use?"
slug: "ETS-vs-ARIMA-in-R"
description: "ETS vs ARIMA in R: see how each forecasting model works, why AICc cannot compare them, and how to pick the winner with a fair train and test accuracy check."
keywords: "ETS vs ARIMA, ets() vs auto.arima(), forecasting in R, exponential smoothing vs ARIMA, choose forecasting model, time series forecasting R, forecast package"
auto_link_terms: "ETS vs ARIMA|ARIMA vs ETS|ETS or ARIMA|ETS versus ARIMA|choosing between ETS and ARIMA|compare ETS and ARIMA|ETS and ARIMA comparison|which forecasting model to use|exponential smoothing vs ARIMA|forecast model comparison"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "FR-ets-2"
post_type: "FR"
fr_parent: "ETS-Models-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">ETS and ARIMA are the two workhorse forecasting model families in R, and both run in a single line with the <code>forecast</code> package. ETS builds a forecast from a series' structure (its level, trend, and seasonality), while ARIMA builds one from the correlations between a value and its own recent past. This guide shows how each works, why you must never compare them with AICc, and how a fair accuracy test picks the winner.</p>

## What is the core difference between ETS and ARIMA?

Give R a monthly time series and two single lines produce two finished forecasters. But which one should you trust? Before you can compare them, you need to see what each model is actually doing. Let's fit both to the same classic dataset, read off the models they choose, and then unpack why those two choices are so different.

We'll use `AirPassengers`, a dataset built into R: monthly totals of international airline passengers from 1949 to 1960. It has a clear upward trend and a strong yearly season (summer peaks, winter dips), so it is a perfect stress test for any forecaster. Both functions we use here, `ets()` and `auto.arima()`, live in the `forecast` package and pick their own model automatically.

```r title="Fit ETS and ARIMA in two lines"
library(forecast)

# AirPassengers: monthly airline passengers, 1949-1960 (built into R)
ets_fit   <- ets(AirPassengers)         # exponential smoothing, model auto-chosen
arima_fit <- auto.arima(AirPassengers)  # ARIMA, model auto-chosen

ets_fit$method        # the ETS model it settled on
#> [1] "ETS(M,Ad,M)"

arimaorder(arima_fit) # the ARIMA orders it settled on
#>         p         d         q         P         D         Q Frequency 
#>         2         1         1         0         1         0        12
```

Two lines, two very different answers. `ets()` returned a label made of letters, `ETS(M,Ad,M)`. `auto.arima()` returned a set of integer orders that read as `ARIMA(2,1,1)(0,1,0)[12]`. We will decode both labels in the next two sections. For now, the point is that they describe the same data in completely different languages.

Here is the intuition behind that difference. ETS looks at the series and asks "what is the current level, is it trending, and what is the seasonal pattern?" It then extrapolates that structure forward. ARIMA asks a different question: "after I remove the trend and season by differencing, how does each value relate to the values just before it?" It then models those leftover correlations. One works from the visible shape of the series; the other works from the correlations between each value and the ones just before it.

![ETS and ARIMA start from the same series but model it in opposite ways.](screenshots/ETS-vs-ARIMA-in-R-two-philosophies.webp)

*Figure 1: ETS and ARIMA start from the same series but model it in opposite ways.*

[KEY INSIGHT]
**Same data, two philosophies.** ETS models a series through its visible structure (level, trend, season), while ARIMA models it through the statistical correlations left after differencing. Neither is "more correct"; they simply describe the data differently.

**Try it:** Fit both models to `USAccDeaths` (monthly accidental deaths in the US, also built into R) and print the two model labels. Do the two functions agree on how seasonal the series is?

```r title="Your turn: fit both to USAccDeaths"
# Fit ETS and ARIMA to USAccDeaths, then read off each label
ex_ets   <- ets(USAccDeaths)
ex_arima <- auto.arima(USAccDeaths)

# your code here: print ex_ets$method and the ARIMA orders

#> Expected: an "ETS(...)" string and a set of ARIMA orders
```

<details>
<summary>Click to reveal solution</summary>

```r title="USAccDeaths labels solution"
ex_ets$method
#> [1] "ETS(A,N,A)"

arimaorder(ex_arima)
#>         p         d         q         P         D         Q Frequency 
#>         0         1         1         0         1         1        12
```

**Explanation:** ETS chose `ETS(A,N,A)`: additive error, no trend, additive season. ARIMA chose `ARIMA(0,1,1)(0,1,1)[12]`. Both detected the yearly season (the `A` in ETS, the seasonal `(0,1,1)[12]` in ARIMA), but they encoded it in their own ways.

</details>

## How does ETS model a time series?

ETS stands for **E**rror, **T**rend, **S**easonal, the three ingredients it uses to build a forecast. The label `ETS(M,Ad,M)` is just those three ingredients described one at a time: the error is **M**ultiplicative, the trend is **A**dditive and **d**amped, and the season is **M**ultiplicative. Each slot can be `A` (additive), `M` (multiplicative), or `N` (none), which is how one function covers dozens of model shapes.

What does "multiplicative" mean here? It means the seasonal swings and the error grow in proportion to the level of the series. Look at `AirPassengers` and you can see it: the summer peaks in 1960 are much taller than the peaks in 1949, because the whole series is bigger. A multiplicative season captures that "swings scale with size" behaviour, which additive models cannot.

The engine underneath ETS is exponential smoothing. Its simplest form updates a running estimate of the level after every new observation:

$$\ell_t = \alpha \, y_t + (1 - \alpha)\, \ell_{t-1}$$

Where:
- $\ell_t$ = the smoothed level at time $t$ (the model's current sense of "where the series is")
- $y_t$ = the actual value observed at time $t$
- $\ell_{t-1}$ = the previous level estimate
- $\alpha$ = the smoothing weight, between 0 and 1

The single idea to take away: $\alpha$ decides how much the newest observation matters. A high $\alpha$ trusts recent data and reacts fast; a low $\alpha$ leans on the past and stays smooth. Trend and season have their own smoothing weights, $\beta$ and $\gamma$. If the equation is not your thing, skip it, the printed parameters below tell the same story.

Let's print the fitted model to see those weights R estimated.

```r title="Read the fitted ETS parameters"
ets_fit
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

Read the smoothing parameters top to bottom. `alpha = 0.7096` is fairly high, so the level tracks recent months closely. `beta = 0.0204` is tiny, meaning the trend changes very slowly and steadily. `gamma = 1e-04` is almost zero, which says the seasonal shape is stable year to year and barely needs updating. The `Initial states` block holds the starting level `l`, starting trend `b`, and the twelve seasonal factors `s` (one per month). At the bottom sit the information criteria, including `AICc`, which we return to shortly.

There is a fourth parameter, `phi = 0.98`. That is the damping factor, the `d` in `Ad`.

[NOTE]
**A damped trend flattens long-range growth.** The `phi` parameter (here 0.98) gently pulls the trend toward flat as the forecast horizon grows, so ETS does not extrapolate a straight line forever. This usually produces more realistic long-term forecasts than an undamped trend.

**Try it:** Fit `ets()` to `austres` (quarterly Australian resident numbers) and read off its three-letter label. Which trend and season types did it pick?

```r title="Your turn: read austres ETS letters"
ex_fit <- ets(austres)

# your code here: print the model label

#> Expected: an "ETS(?,?,?)" label
```

<details>
<summary>Click to reveal solution</summary>

```r title="austres ETS letters solution"
ex_fit$method
#> [1] "ETS(M,Ad,A)"
```

**Explanation:** `ETS(M,Ad,A)` means a multiplicative error, an additive damped trend, and an additive season. The `Ad` again signals a damped trend, and this time the season is additive rather than multiplicative.

</details>

## How does ARIMA model a time series?

ARIMA describes a series through its own past values instead of through visible structure. Its label has three numbers for the non-seasonal part and three more for the seasonal part: `ARIMA(p,d,q)(P,D,Q)[m]`. Here is what each letter counts, using our fitted `ARIMA(2,1,1)(0,1,0)[12]`:

- **p** (here 2): autoregressive terms, how many recent values feed into the prediction.
- **d** (here 1): how many times the series is differenced to remove trend.
- **q** (here 1): moving-average terms, how many recent forecast errors feed in.
- **P, D, Q** (here 0, 1, 0): the same three ideas applied to the seasonal pattern.
- **m** (here 12): the season length, twelve months for monthly data.

The middle letter, the "I" for **I**ntegrated, is the key to ARIMA. Differencing means replacing each value with the change from the value before it. Do that once and a rising trend flattens out. `d = 1` here means one round of ordinary differencing, and `D = 1` means one round of seasonal differencing (each month minus the same month last year). ARIMA needs the series to be **stationary** first: no trend, no season, and a roughly constant mean and spread over time. Differencing is how it gets there.

Let's print the full fitted ARIMA to see its estimated coefficients.

```r title="Read the fitted ARIMA coefficients"
arima_fit
#> Series: AirPassengers 
#> ARIMA(2,1,1)(0,1,0)[12] 
#> 
#> Coefficients:
#>          ar1     ar2      ma1
#>       0.5960  0.2143  -0.9819
#> s.e.  0.0888  0.0880   0.0292
#> 
#> sigma^2 = 132.3:  log likelihood = -504.92
#> AIC=1017.85   AICc=1018.17   BIC=1029.35
```

The `Coefficients` block lists the estimated weights: two autoregressive terms (`ar1`, `ar2`) and one moving-average term (`ma1`), each with a standard error underneath. `sigma^2` is the estimated variance of the model's one-step errors, and the bottom row shows the information criteria. Notice there is no `alpha` or `gamma` here; ARIMA speaks entirely in AR and MA coefficients, not in smoothing weights. That is the same series as before, described in a totally different vocabulary.

[WARNING]
**Let ARIMA do the differencing; do not detrend by hand first.** The `d` and `D` orders are ARIMA's built-in way of handling trend and season. If you manually difference or remove the trend before calling `auto.arima()`, you can double-difference the series and get worse forecasts. Feed it the raw series.

**Try it:** How much differencing does `AirPassengers` actually need? Use `ndiffs()` for ordinary differencing and `nsdiffs()` for seasonal differencing to check.

```r title="Your turn: count the differences AirPassengers needs"
# your code here: call ndiffs() and nsdiffs() on AirPassengers

#> Expected: two small whole numbers
```

<details>
<summary>Click to reveal solution</summary>

```r title="ndiffs and nsdiffs solution"
ndiffs(AirPassengers)   # ordinary differences suggested
#> [1] 1

nsdiffs(AirPassengers)  # seasonal differences suggested
#> [1] 1
```

**Explanation:** Both return 1, which matches the `d = 1` and `D = 1` that `auto.arima()` chose. These helper functions run statistical tests to decide how much differencing makes the series stationary, and `auto.arima()` calls them internally.

</details>

## Why can't you compare ETS and ARIMA with AICc?

Here is the trap that catches almost everyone. Both models print an `AICc` value, and lower AICc means a better model, so it feels obvious to fit both, compare the two AICc scores, and keep the smaller one. That reasoning is wrong, and it will steer you to the worse forecaster.

Let's look at the two numbers side by side.

```r title="Two AICc scores that look comparable but are not"
ets_fit$aicc     # ETS in-sample AICc
#> [1] 1400.638

arima_fit$aicc   # ARIMA in-sample AICc
#> [1] 1018.165
```

By this logic ARIMA (1018) crushes ETS (1401), so you would throw ETS away without a second thought. Do not. These two numbers are not measured on the same ruler.

AICc is built from each model's likelihood (a measure of how well the model fits the data it was trained on), and the two families compute that likelihood in different ways. Our ETS model uses multiplicative errors, so its likelihood is defined on the relative scale of the data. The ARIMA model works on the differenced series, so its likelihood is defined on that transformed scale. Comparing the two AICc values is like comparing a temperature in Celsius to one in Fahrenheit by their raw numbers. AICc is genuinely useful, but only for ranking models inside one family: ETS against other ETS models, or ARIMA against other ARIMA models.

[KEY INSIGHT]
**AICc ranks within a family, never across families.** Use AICc to choose among ETS models, or among ARIMA models, but never to decide ETS versus ARIMA. The two likelihoods live on different scales, so the comparison is meaningless.

**Try it:** Put both AICc values into a single named vector so they are easy to read together, rounded to one decimal place. (This is only to display them, not to pick a winner.)

```r title="Your turn: show both AICc side by side"
# your code here: build a named vector of the two AICc values, rounded to 1 dp

#> Expected: a named vector with ETS and ARIMA labels
```

<details>
<summary>Click to reveal solution</summary>

```r title="Named AICc vector solution"
round(c(ETS = ets_fit$aicc, ARIMA = arima_fit$aicc), 1)
#>    ETS  ARIMA 
#> 1400.6 1018.2
```

**Explanation:** The vector displays both scores clearly, but remember the whole point: their difference tells you nothing about which model forecasts better. For that we need the next section.

</details>

## How do you fairly compare ETS and ARIMA in R?

If AICc cannot referee this match, what can? The answer is the same test you would trust for any forecaster: hide the most recent part of the series, forecast it, and measure the error against the values the model never saw. This is a train and test split, and it is the fair comparison every serious forecaster uses.

We'll train both models on `AirPassengers` up to the end of 1958, then ask each to forecast the final two years, 1959 and 1960, which they were never shown. The `window()` function slices a time series by date.

```r title="Hold out the last two years and score both models"
train <- window(AirPassengers, end = c(1958, 12))    # fit on 1949-1958
test  <- window(AirPassengers, start = c(1959, 1))   # judge on 1959-1960

ets_fc   <- forecast(ets(train),        h = length(test))
arima_fc <- forecast(auto.arima(train), h = length(test))

# Test-set accuracy: error on data neither model saw
round(accuracy(ets_fc,   test)["Test set", c("RMSE", "MAE", "MAPE", "MASE")], 2)
#>  RMSE   MAE  MAPE  MASE 
#> 72.55 63.21 13.30  2.21

round(accuracy(arima_fc, test)["Test set", c("RMSE", "MAE", "MAPE", "MASE")], 2)
#>  RMSE   MAE  MAPE  MASE 
#> 74.25 68.58 14.93  2.40
```

Now the comparison is honest, because both models are judged on the exact same unseen data. Here is what each column means in plain terms:

- **RMSE** (root mean squared error): typical error size in passengers, punishing big misses harder. Lower is better.
- **MAE** (mean absolute error): average error size in passengers. Lower is better.
- **MAPE** (mean absolute percentage error): average error as a percentage of the actual value. Lower is better.
- **MASE** (mean absolute scaled error): error scaled against a naive seasonal forecast, so it carries no units. Lower is better.

On every single metric, ETS wins: lower RMSE (72.55 versus 74.25), lower MAE, lower MAPE, and lower MASE. Remember that ARIMA had the far better AICc? On the data that actually matters, the held-out future, ETS is the better forecaster here. That is exactly why AICc could not be trusted to choose between them.

A picture makes the difference concrete. Let's plot both forecasts against the real 1959-1960 values.

```r title="Plot both forecasts against the real values"
plot(AirPassengers, xlim = c(1957, 1961),
     main = "ETS vs ARIMA forecasts on held-out data", ylab = "Passengers")
lines(ets_fc$mean,   col = "blue", lwd = 2)
lines(arima_fc$mean, col = "red",  lwd = 2)
legend("topleft", legend = c("Actual", "ETS", "ARIMA"),
       col = c("black", "blue", "red"), lwd = 2, bty = "n")
```

The chart (which draws when you run the block) shows both coloured forecast lines tracking the black actual series, with ETS staying a little closer through the seasonal peaks. Seeing the forecasts overlaid is often more convincing than any single error number.

[NOTE]
**One holdout is good; rolling holdouts are better.** A single train and test split can be lucky or unlucky depending on where you cut. The `tsCV()` function in the `forecast` package repeats this holdout across many cut points and averages the errors, giving a sturdier verdict. It is slower because it refits the model many times, so start with a single split and graduate to `tsCV()` when the decision is important.

[KEY INSIGHT]
**Out-of-sample accuracy is the only fair judge across model families.** Because ETS and ARIMA speak different statistical languages, the one thing that compares cleanly is how close each forecast lands to real future values. RMSE, MAE, and MASE on held-out data give you that.

**Try it:** Add a baseline. Seasonal naive (`snaive()`) just repeats last year's value for each month. Score it on the same test set and compare its MASE to the two models above. Did ETS and ARIMA earn their complexity?

```r title="Your turn: score a seasonal-naive baseline"
ex_sn <- snaive(train, h = length(test))

# your code here: print the Test-set RMSE, MAE, and MASE for ex_sn

#> Expected: three numbers to compare against ETS and ARIMA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal-naive baseline solution"
round(accuracy(ex_sn, test)["Test set", c("RMSE", "MAE", "MASE")], 2)
#>  RMSE   MAE  MASE 
#> 76.99 71.25  2.49
```

**Explanation:** Seasonal naive scores RMSE 76.99 and MASE 2.49, worse than both ETS (2.21) and ARIMA (2.40). So both real models beat the "just repeat last year" baseline on this holdout, with ETS the strongest of the three.

</details>

## When should you use ETS vs ARIMA?

You now have the honest workflow: fit both, and let a holdout decide. But you often want a starting instinct before running the test. This table sums up where each family tends to shine.

| Consideration | ETS | ARIMA |
|---|---|---|
| What it models | Level, trend, season directly | Autocorrelation after differencing |
| Stationarity needed | No | Yes (differencing handles it) |
| Multiplicative seasonality | Handles it natively | Needs a log or Box-Cox transform first |
| Extra predictors (regressors) | Not supported | Supported via the `xreg` argument |
| Auto-selection function | `ets()` | `auto.arima()` |
| Reads most naturally when | The series has clear trend and season | The series is driven by its own recent history |

A widespread myth says ARIMA is the more general, more powerful family, so it must be the safer default. It is not true. As the diagram below and the numbers above both show, the right choice depends on the series, not on a ranking.

![A quick heuristic for which model to reach for first.](screenshots/ETS-vs-ARIMA-in-R-decision-flow.webp)

*Figure 2: A quick heuristic for which model to reach for first.*

The two families genuinely overlap, though. Some simple ETS models are exactly equal to specific ARIMA models, which is why they often forecast alike. These equivalences come from the forecasting textbook by Hyndman and Athanasopoulos:

| ETS model | Equivalent ARIMA model |
|---|---|
| ETS(A,N,N) | ARIMA(0,1,1) |
| ETS(A,A,N) | ARIMA(0,2,2) |
| ETS(A,Ad,N) | ARIMA(1,1,2) |

But the overlap is only partial. Multiplicative ETS models, like the `ETS(M,Ad,M)` we fit, have no ARIMA equivalent at all. And many stationary ARIMA models have no ETS equivalent, because every ETS model is non-stationary by design. Neither family contains the other, which is the real reason you should try both.

One practical move often beats picking a single winner: average the two forecasts. Let's average the ETS and ARIMA predictions on our `AirPassengers` holdout and score the blend.

```r title="Average the two forecasts and score the blend"
combo <- (ets_fc$mean + arima_fc$mean) / 2   # simple average of both forecasts

round(accuracy(combo, test)["Test set", c("RMSE", "MAE", "MAPE")], 2)
#>  RMSE   MAE  MAPE 
#> 72.70 65.89 14.12
```

The blended RMSE is 72.70, sitting between ETS (72.55) and ARIMA (74.25). On this particular series the average did not beat ETS alone, which is an honest and useful lesson: averaging often helps, but it is not a guaranteed free win. You still have to measure it on held-out data, exactly as with any single model.

[TIP]
**When in doubt, fit both and let the test set decide.** The whole comparison collapses to one habit: run `ets()` and `auto.arima()`, forecast a holdout, and compare RMSE or MASE. It costs two extra lines and removes all the guesswork about which family "should" win.

**Try it:** Turn the decision into two lines of code. Use the models already fit above (`ets_fc` and `arima_fc`) and print each one's test MASE next to its name so the winner is obvious at a glance.

```r title="Your turn: show the winner by MASE"
# your code here: build a named vector of ETS test MASE and ARIMA test MASE

#> Expected: two MASE values, one per model
```

<details>
<summary>Click to reveal solution</summary>

```r title="Winner by MASE solution"
round(c(ETS   = accuracy(ets_fc,   test)["Test set", "MASE"],
        ARIMA = accuracy(arima_fc, test)["Test set", "MASE"]), 3)
#>   ETS ARIMA 
#> 2.212 2.400
```

**Explanation:** ETS has the lower MASE (2.21 versus 2.40), so it is the winner on this holdout. Wrapping it in a named vector makes the comparison readable in one line.

</details>

## Practice Exercises

These pull together everything above: you fit both families, hold out the most recent data, then score them on real out-of-sample error. Use fresh variable names so you do not overwrite the tutorial objects.

### Exercise 1: Judge both models on a new series

Repeat the fair comparison on `USAccDeaths`. Train both `ets()` and `auto.arima()` on all data up to the end of 1977, forecast the twelve months of 1978, and print each model's test-set RMSE. Which family wins on this series?

```r title="Exercise 1 starter"
# Hint: use window() to split, forecast() to predict,
# and accuracy(fc, test)["Test set", "RMSE"] to score.
ud_train <- window(USAccDeaths, end = c(1977, 12))
ud_test  <- window(USAccDeaths, start = c(1978, 1))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ud_ets   <- forecast(ets(ud_train),        h = length(ud_test))
ud_arima <- forecast(auto.arima(ud_train), h = length(ud_test))

round(c(ETS   = accuracy(ud_ets,   ud_test)["Test set", "RMSE"],
        ARIMA = accuracy(ud_arima, ud_test)["Test set", "RMSE"]), 2)
#>    ETS  ARIMA 
#> 289.62 288.83
```

**Explanation:** Here ARIMA edges out ETS (RMSE 288.83 versus 289.62), the opposite of the AirPassengers result. That is the whole point of testing: the winner changes with the data, so you must check, never assume.

</details>

### Exercise 2: Write a reusable model picker

Write a function `pick_model(y, h)` that takes any time series `y` and a horizon `h`, holds out the last `h` observations, fits both families on the rest, and returns a small data frame of each model's test MASE. Run it on `AirPassengers` with `h = 24`.

```r title="Exercise 2 starter"
# Hint: head(y, length(y) - h) is the training set,
# tail(y, h) is the test set.
pick_model <- function(y, h) {
  # Write your code below:

}

# pick_model(AirPassengers, 24)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
pick_model <- function(y, h) {
  tr <- head(y, length(y) - h)
  te <- tail(y, h)
  e  <- accuracy(forecast(ets(tr),        h = h), te)["Test set", "MASE"]
  a  <- accuracy(forecast(auto.arima(tr), h = h), te)["Test set", "MASE"]
  data.frame(model = c("ETS", "ARIMA"), test_MASE = round(c(e, a), 3))
}

pick_model(AirPassengers, 24)
#>   model test_MASE
#> 1   ETS     2.212
#> 2 ARIMA     2.400
```

**Explanation:** The function bundles the whole fair-comparison recipe into one reusable call. Point it at any series and horizon and it returns the head-to-head MASE, so you never have to eyeball two model printouts again.

</details>

### Exercise 3: Test whether averaging beats both

Using `USAccDeaths` from Exercise 1, average the ETS and ARIMA forecasts and compare the blend's test RMSE against each single model. Does the average win here?

```r title="Exercise 3 starter"
# Hint: ud_ets$mean and ud_arima$mean are the two forecast vectors.
# Reuse ud_ets, ud_arima, and ud_test from Exercise 1.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ud_combo <- (ud_ets$mean + ud_arima$mean) / 2

round(c(ETS   = accuracy(ud_ets,   ud_test)["Test set", "RMSE"],
        ARIMA = accuracy(ud_arima, ud_test)["Test set", "RMSE"],
        COMBO = accuracy(ud_combo, ud_test)[1, "RMSE"]), 2)
#>    ETS  ARIMA  COMBO 
#> 289.62 288.83 283.84
```

**Explanation:** This time the average wins outright: RMSE 283.84, lower than both ETS (289.62) and ARIMA (288.83). Blending two decent-but-different forecasts often cancels their opposing errors, which is why forecast averaging is a favourite trick in practice. As always, the holdout proves it rather than assumes it.

</details>

## Frequently Asked Questions

**Should I always use ETS instead of ARIMA because it won here?**
No. ETS was the better forecaster on `AirPassengers`, but ARIMA won on `USAccDeaths` in Exercise 1. There is no family that is better in general, so the honest habit is to fit both and let a holdout decide for the series in front of you.

**Can I use ETS or ARIMA if my series has no seasonality?**
Yes, both handle non-seasonal data. On a series with no repeating yearly pattern, `ets()` returns `N` in its seasonal slot (for example `ETS(A,A,N)`), and `auto.arima()` simply leaves the seasonal orders at zero. You call the two functions exactly the same way you did above.

**My data has an extra predictor like price or temperature. Which model takes it?**
ARIMA does, through the `xreg` argument of `auto.arima()`, which lets you add outside variables alongside the series' own past. Plain `ets()` has no equivalent, so when an outside predictor matters to your forecast, ARIMA is the family that can use it.

**How much history does ARIMA need before it will difference the season?**
Seasonal differencing (`D = 1`) needs at least two full seasonal cycles to estimate, so roughly two years of monthly data or two years of quarterly data at a minimum. On a shorter series `auto.arima()` will usually leave `D` at zero because there is not enough repetition to measure a stable season.

**Why did `auto.arima()` pick a model that lost my test-set comparison?**
`auto.arima()` chooses the model with the lowest in-sample AICc, which rewards fit on the training data, not accuracy on future data it has never seen. Those two goals often agree, but not always, which is exactly why you still run a train and test holdout before trusting a model.

## Summary

ETS and ARIMA are two different languages for describing the same time series, and the only fair way to choose between them is an out-of-sample accuracy test.

| Dimension | ETS | ARIMA |
|---|---|---|
| Core idea | Smooth the level, trend, and season | Model autocorrelation after differencing |
| R function | `ets()` | `auto.arima()` |
| Needs stationarity | No | Yes (via the `d` and `D` differencing orders) |
| Extra predictors | No | Yes (`xreg`) |
| Compare models with AICc | Within ETS only | Within ARIMA only |
| Compare ETS vs ARIMA | Never with AICc; use a train and test holdout | Same: use held-out RMSE, MAE, or MASE |

Key takeaways:

- **Fit both, it is cheap.** `ets()` and `auto.arima()` each take one line and choose their own model.
- **Never compare their AICc.** The two likelihoods live on different scales, so a lower AICc across families means nothing.
- **Judge on held-out data.** Split the series, forecast the tail, and compare RMSE or MASE on the part neither model saw.
- **The winner is data-dependent.** ETS won on `AirPassengers`; ARIMA won on `USAccDeaths`. Test every time.
- **Consider averaging.** Blending the two forecasts sometimes beats either alone, but confirm it on a holdout.

## References

1. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Section 9.10: ARIMA vs ETS. [Link](https://otexts.com/fpp3/arima-ets.html)
2. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Chapter 8: Exponential smoothing. [Link](https://otexts.com/fpp3/expsmooth.html)
3. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Chapter 9: ARIMA models. [Link](https://otexts.com/fpp3/arima.html)
4. Hyndman, R.J. et al. - *Forecasting with Exponential Smoothing: The State Space Approach*. Springer (2008). [Link](https://robjhyndman.com/expsmooth/)
5. Hyndman, R.J. - forecast package reference (`ets`, `auto.arima`, `accuracy`, `tsCV`). CRAN. [Link](https://pkg.robjhyndman.com/forecast/reference/index.html)
6. R Core Team - R datasets documentation (`AirPassengers`, `USAccDeaths`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/00Index.html)

## Continue Learning

- [ETS Models in R: Error, Trend, and Seasonal Components](ETS-Models-in-R.html) - the full ETS letter system and how `ets()` chooses each component.
- [Exponential Smoothing in R: ses() and the Alpha Parameter](Exponential-Smoothing-in-R.html) - the smoothing engine underneath ETS, one parameter at a time.
- [Choosing a Forecasting Model in R](Choosing-a-Forecasting-Model-in-R.html) - the broader workflow for picking among all the common forecasting methods.
