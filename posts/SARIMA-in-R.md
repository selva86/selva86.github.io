---
title: "SARIMA in R: How to Fit Seasonal ARIMA Models"
slug: "SARIMA-in-R"
description: "Learn seasonal ARIMA (SARIMA) in R: what the (P,D,Q)[m] terms mean, how seasonal differencing works, and how to fit and forecast with Arima() and auto.arima()."
keywords: "SARIMA in R, seasonal ARIMA, auto.arima seasonal, Arima function R, P D Q seasonal, seasonal differencing, AirPassengers forecast, time series forecasting, seasonal period"
auto_link_terms: "SARIMA|seasonal ARIMA|seasonal ARIMA model|SARIMA model|SARIMA in R|seasonal ARIMA in R|seasonal differencing|seasonal AR|seasonal MA|seasonal order|(P,D,Q)|airline model"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.14"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "SARIMA Models"
sidebar_order: 15
difficulty: "Intermediate"
---

<p class="lead">SARIMA (Seasonal ARIMA) is an ARIMA model with an extra set of terms that repeat every season, written ARIMA(p, d, q)(P, D, Q)[m]. The lowercase part handles short-term structure; the uppercase part handles the pattern that returns every <code>m</code> steps (m = 12 for monthly data). In R you fit one with <code>Arima()</code> or <code>auto.arima()</code> from the forecast package.</p>

## What is a SARIMA model, and how does it extend ARIMA?

Sales jump every December. Temperatures climb every summer. Electricity demand peaks every weekday evening. A huge share of real time series repeat on a fixed calendar, and a plain ARIMA model cannot see that repeat. SARIMA fixes this by adding a second set of ARIMA terms that work at the seasonal lag instead of the neighbouring one. The fastest way to see it is to point R at a famously seasonal series and let it pick a model on its own.

We will use the built-in `AirPassengers` series: monthly totals of international airline passengers from 1949 to 1960. Let's load the forecast package and ask `auto.arima()` to choose a model.

```r title="Fit a seasonal model automatically"
library(forecast)
library(ggplot2)
air_fit <- auto.arima(AirPassengers)
air_fit
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

Look at the model label: `ARIMA(2,1,1)(0,1,0)[12]`. That second bracket of numbers is new. A plain ARIMA gives you three numbers; a SARIMA gives you seven. R detected that this series is monthly, added a seasonal piece, and even chose to difference it once at the seasonal lag (the `1` in the middle of `(0,1,0)`). By the end of this tutorial you will be able to read every number in that label and fit a model like it yourself.

If ARIMA on its own is still fuzzy, here is the one-line recap: an ARIMA(p, d, q) model predicts each value from its own recent values (the AR part, order `p`), works with changes instead of raw levels to remove trend (the I part, order `d`), and learns from its own recent forecast errors (the MA part, order `q`). Our [ARIMA in R tutorial](ARIMA-in-R.html) walks through those three ideas from scratch if you want a refresher.

SARIMA keeps all of that and adds three matching seasonal numbers plus the season length. Here is what all seven mean.

| Part | Symbol | Name | What it captures |
|---|---|---|---|
| Non-seasonal | p, d, q | AR, I, MA | Month-to-month structure, same as ARIMA |
| Seasonal | P, D, Q | Seasonal AR, I, MA | The pattern that returns every season |
| Period | m | Season length | Steps in one full cycle (12 for monthly) |

The diagram below shows how the label splits into those three groups.

![The SARIMA label splitting into non-seasonal, seasonal, and period parts](screenshots/SARIMA-in-R-notation.webp)
*Figure 1: The SARIMA label splits into a non-seasonal part, a seasonal part, and the period m.*

How did R know the season was 12 steps long? Because `AirPassengers` is stored as a monthly time series, and R reads its frequency directly.

```r title="Check the series frequency and first year"
frequency(AirPassengers)
head(AirPassengers, 12)
#> [1] 12
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1949 112 118 132 129 121 135 148 148 136 119 104 118
```

The first line confirms the season is 12 observations long. The second shows the first twelve months of 1949, and you can already spot the shape: a rise into the summer, a dip in the autumn. That yearly rhythm repeats for every one of the twelve years in the data, and capturing it is exactly what the seasonal terms are for.

[KEY INSIGHT]
**A SARIMA model is just ARIMA applied twice, once across neighbouring steps and once across seasons.** Everything you already know about p, d, and q carries straight over to P, D, and Q. The only new idea is that the seasonal terms reach back a whole season (m steps) instead of a single step.

**Try it:** Fit an automatic model to the built-in `USAccDeaths` series (monthly accidental deaths in the US) and read off its `(P, D, Q)[m]` seasonal orders.

```r title="Your turn: read the seasonal orders"
# Goal: fit an automatic model to the monthly USAccDeaths series
# and read its ARIMA(p,d,q)(P,D,Q)[m] label.
# Swap AirPassengers for USAccDeaths, then run.
ex_series <- AirPassengers   # change to USAccDeaths
auto.arima(ex_series)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Automatic SARIMA on USAccDeaths"
auto.arima(USAccDeaths)
#> Series: USAccDeaths 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4303  -0.5528
#> s.e.   0.1228   0.1784
#> 
#> sigma^2 = 102860:  log likelihood = -425.44
#> AIC=856.88   AICc=857.32   BIC=863.11
```

**Explanation:** R picks `ARIMA(0,1,1)(0,1,1)[12]`. The seasonal orders are `P = 0`, `D = 1`, `Q = 1`, and the period is 12. That `(0,1,1)[12]` seasonal part is so common it has a nickname you will meet later: the airline model.

</details>

## Why does plain ARIMA fail on seasonal data?

Before adding seasonal terms, it helps to see what goes wrong without them. First, let's make the seasonal pattern concrete by averaging every January together, every February together, and so on. If the series is truly seasonal, those monthly averages will differ a lot.

```r title="Average passengers by calendar month"
round(tapply(AirPassengers, cycle(AirPassengers), mean))
#>   1   2   3   4   5   6   7   8   9  10  11  12 
#> 242 235 270 267 272 312 351 351 302 267 233 262 
```

The numbers tell the story. July and August average 351 passengers, while November averages 233. That is a swing of about 50% driven purely by the month of the year. Any model that ignores the calendar is throwing away one of the strongest signals in the data.

Now let's fit an ARIMA model that is forbidden from using seasonal terms, by passing `seasonal = FALSE`, and see how it copes.

```r title="Fit ARIMA with seasonal terms switched off"
plain_fit <- auto.arima(AirPassengers, seasonal = FALSE)
plain_fit
#> Series: AirPassengers 
#> ARIMA(4,1,2) with drift 
#> 
#> Coefficients:
#>          ar1     ar2      ar3      ar4      ma1      ma2   drift
#>       0.2243  0.3689  -0.2567  -0.2391  -0.0971  -0.8519  2.6809
#> s.e.  0.1047  0.1147   0.0985   0.0919   0.0866   0.0877  0.1711
#> 
#> sigma^2 = 706.3:  log likelihood = -670.07
#> AIC=1356.15   AICc=1357.22   BIC=1379.85
```

R uses four AR terms and two MA terms to approximate the yearly cycle with short-term memory. Notice `sigma^2 = 706.3` here versus `132.3` for the seasonal model in the first section. The error variance is more than five times larger. The non-seasonal model uses far more terms and still fits far worse.

The clearest proof of failure is in the residuals, which are the leftover errors after the model has done its best. A good model leaves residuals that look like random noise. If the residuals still carry a yearly pattern, the model missed the season. The Ljung-Box test checks exactly this: a small p-value means significant leftover structure.

```r title="Test the leftover residuals at the seasonal lag"
Box.test(residuals(plain_fit), lag = 12, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(plain_fit)
#> X-squared = 92.469, df = 12, p-value = 1.643e-14
```

The p-value is `1.643e-14`, which is essentially zero. That tiny number is strong evidence that the residuals still contain a clear pattern at the yearly lag. The non-seasonal model removed the trend but left the entire seasonal signal behind, which means its forecasts will miss every summer peak and every winter trough.

[WARNING]
**A non-seasonal model on seasonal data leaves the season stranded in the residuals.** The fit will look plausible on a quick glance, but every forecast will be systematically wrong at the same months each year. Always check residuals at the seasonal lag before trusting a model.

**Try it:** Average the `USAccDeaths` series by calendar month to reveal its seasonal shape. Which months are highest?

```r title="Your turn: find the seasonal shape"
# Goal: average USAccDeaths by calendar month to see its shape.
# Swap AirPassengers for USAccDeaths, then run.
ex_series <- AirPassengers   # change to USAccDeaths
round(tapply(ex_series, cycle(ex_series), mean))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Monthly averages of USAccDeaths"
round(tapply(USAccDeaths, cycle(USAccDeaths), mean))
#>     1     2     3     4     5     6     7     8     9    10    11    12 
#>  8044  7284  8062  8275  9124  9595 10453  9749  8700  8990  8467  8721 
```

**Explanation:** July (month 7) is the deadliest with about 10,453 deaths, and February (month 2) is the lowest at about 7,284. The summer peak is a clear seasonal signal that a good model must capture.

</details>

## What do the seasonal terms (P, D, Q)[m] mean?

The seasonal terms are the non-seasonal ones with a longer reach. Where p, d, and q look back one step, P, D, and Q look back one whole season. Let's take them one at a time, starting with the period that ties them together.

**m is the season length**, the number of steps in one full cycle. It is monthly data's 12, quarterly data's 4, and daily-with-weekly-pattern data's 7. You do not estimate `m`; you know it from the calendar and R usually reads it from the series frequency.

**D is the number of seasonal differences.** A seasonal difference replaces each value with the change from one season ago: this July minus last July, this August minus last August. That single operation cancels a stable yearly pattern, because the summer bump appears in both the current value and the value twelve months back, so subtracting removes it. Let's watch it work. The `nsdiffs()` function tells you how many seasonal differences a series needs, and `ndiffs()` does the same for ordinary differences.

```r title="Ask R how much differencing is needed"
ndiffs(AirPassengers)
nsdiffs(AirPassengers)
#> [1] 1
#> [1] 1
```

R recommends one ordinary difference (`d = 1`) to remove the upward trend and one seasonal difference (`D = 1`) to remove the yearly cycle. Let's confirm the seasonal difference actually does its job by applying it and re-checking.

```r title="One seasonal difference removes the season"
air_sdiff <- diff(AirPassengers, lag = 12)
nsdiffs(air_sdiff)
#> [1] 0
```

After one seasonal difference (`lag = 12` means subtract the value twelve months ago), `nsdiffs()` returns `0`. The seasonality is gone, which is exactly what `D = 1` buys you inside a SARIMA model.

**P is the seasonal AR order** and **Q is the seasonal MA order.** They are the AR and MA ideas aimed at the seasonal lag. A seasonal AR term of order 1 says this July leans on last July's value. A seasonal MA term of order 1 says this July leans on last July's forecast error. Just like their lowercase cousins, you rarely need more than one or two of each.

[NOTE]
**You must know the season length before modelling; R cannot invent it.** For the built-in monthly and quarterly datasets, the frequency is already stored, so `m` is set automatically. For data you import yourself, set it when you build the series, for example `ts(x, frequency = 12)` for monthly data.

**Try it:** Find the seasonal period of the `UKgas` series (quarterly UK gas consumption). What value of `m` would a SARIMA model use for it?

```r title="Your turn: find the seasonal period"
# Goal: how many observations are in one cycle of UKgas?
# Replace AirPassengers with UKgas, then run.
frequency(AirPassengers)   # change AirPassengers to UKgas
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal period of UKgas"
frequency(UKgas)
#> [1] 4
```

**Explanation:** `UKgas` is quarterly, so it has 4 observations per cycle and a SARIMA model would use `m = 4`. The seasonal terms would then reach back 4 quarters (one year) instead of 12 months.

</details>

## How do you find the right seasonal orders from ACF and PACF?

You have two families of numbers to pin down: the differencing orders (`d` and `D`) and the term orders (`p`, `q`, `P`, `Q`). Differencing comes first, because you can only read the term orders off a stationary series, one whose statistical behaviour no longer drifts over time.

One quick preparation step matters for `AirPassengers`: the seasonal swings grow larger as the level rises. Taking a logarithm first stabilises that spread, turning a widening fan into an even band, which makes the model fit better. Let's find the differencing counts on the logged series.

```r title="Differencing counts on the log series"
lair <- log(AirPassengers)
ndiffs(lair)
nsdiffs(lair)
#> [1] 1
#> [1] 1
```

So we need one ordinary difference and one seasonal difference, the same `d = 1, D = 1` as before. Now apply both and inspect the autocorrelation plots. The autocorrelation function (ACF) measures how each value correlates with values at earlier lags; the partial autocorrelation function (PACF) does the same after removing the effect of the lags in between. `ggtsdisplay()` shows the differenced series alongside both plots at once.

```r title="Plot ACF and PACF of the differenced series"
ggtsdisplay(diff(diff(lair, 12)), main = "After one ordinary and one seasonal difference")
```

Running that draws three panels. The differenced series at the top now hovers around a flat zero line with no drift and no obvious yearly wave, which confirms it is stationary. The ACF and PACF below it are where you read the seasonal orders, and there is a simple rule for that.

Look only at the seasonal lags, the multiples of 12 (lag 12, 24, 36). Ignore everything in between when deciding the seasonal orders. Then apply the same logic you use for non-seasonal terms, just at those seasonal positions.

- A single spike in the **ACF** at lag 12 that then dies away, paired with a slow decay in the PACF at seasonal lags, points to a **seasonal MA** term (`Q = 1`).
- A single spike in the **PACF** at lag 12, paired with a slow decay in the ACF at seasonal lags, points to a **seasonal AR** term (`P = 1`).

For the logged `AirPassengers`, the ACF shows one clean negative spike at lag 12 and the PACF tapers off across the seasonal lags, which is the signature of a seasonal MA term. That is `Q = 1`. The diagram below captures the rule so you can reuse it on any series.

![Reading seasonal AR versus seasonal MA from the ACF and PACF](screenshots/SARIMA-in-R-acf-pacf-rules.webp)
*Figure 2: Reading seasonal AR versus seasonal MA from the ACF and PACF at seasonal lags.*

[TIP]
**Let R choose the differencing, then confirm with the plots.** The `ndiffs()` and `nsdiffs()` functions use formal unit-root tests to pick `d` and `D`, which is more reliable than eyeballing. Use the ACF and PACF to sanity-check the result and to read the term orders, not to guess the differencing.

**Try it:** Take one seasonal difference of `USAccDeaths` and confirm `nsdiffs()` drops to 0, proving one seasonal difference is enough.

```r title="Your turn: confirm one seasonal difference is enough"
# Goal: seasonally difference USAccDeaths, then check nsdiffs() is 0.
# Fill in the seasonal lag (the number of months in a year).
ex_sd <- diff(USAccDeaths, lag = 1)   # change 1 to the seasonal lag
nsdiffs(ex_sd)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal difference of USAccDeaths"
ex_sd <- diff(USAccDeaths, lag = 12)
nsdiffs(ex_sd)
#> [1] 0
```

**Explanation:** With `lag = 12` the seasonal difference cancels the yearly cycle, so `nsdiffs()` returns `0`. One seasonal difference is enough, which means `D = 1` for this series.

</details>

## How do you fit a SARIMA model in R with auto.arima() and Arima()?

You now have all the orders for `AirPassengers`: `d = 1, D = 1, Q = 1`, and the classic choice for this data adds one non-seasonal MA term (`q = 1`) too. That gives `ARIMA(0,1,1)(0,1,1)[12]`, the model so famous for this series that it is known as the airline model. Let's fit it by hand with `Arima()`.

The `Arima()` function takes the non-seasonal orders in `order = c(p, d, q)` and the seasonal orders in `seasonal = list(order = c(P, D, Q), period = m)`. The `lambda = 0` argument tells R to fit on the log scale for us and back-transform automatically, so we do not have to log the data by hand.

```r title="Fit the airline model by hand"
airline_fit <- Arima(AirPassengers,
                     order = c(0, 1, 1),
                     seasonal = list(order = c(0, 1, 1), period = 12),
                     lambda = 0)
airline_fit
#> Series: AirPassengers 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> Box Cox transformation: lambda= 0 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4018  -0.5569
#> s.e.   0.0896   0.0731
#> 
#> sigma^2 = 0.001371:  log likelihood = 244.7
#> AIC=-483.4   AICc=-483.21   BIC=-474.77
```

The model has two coefficients. `ma1 = -0.4018` is the ordinary moving-average term, correcting each month using last month's error. `sma1 = -0.5569` is the seasonal moving-average term, correcting each month using the error from twelve months ago. Those two numbers, plus the two differences, are the whole model.

Now here is the satisfying part. Watch what `auto.arima()` picks when we give it the same log transform and let it search freely.

```r title="Let auto.arima search on the log scale"
auto_fit <- auto.arima(AirPassengers, lambda = 0)
auto_fit
#> Series: AirPassengers 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> Box Cox transformation: lambda= 0 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4018  -0.5569
#> s.e.   0.0896   0.0731
#> 
#> sigma^2 = 0.001371:  log likelihood = 244.7
#> AIC=-483.4   AICc=-483.21   BIC=-474.77
```

It lands on exactly the same model, the airline model, coefficient for coefficient. Your hand-reasoning from the ACF and PACF and R's automatic search agree. We can confirm they score identically by comparing their AICc, an information criterion where lower means a better trade-off between fit and complexity.

```r title="Compare the two models by AICc"
round(c(airline = airline_fit$aicc, auto = auto_fit$aicc), 2)
#> airline    auto 
#> -483.21 -483.21 
```

Identical scores, because they are the same model. This is the ideal outcome: you understand why the model has the terms it does, and you have an automatic tool that reproduces your reasoning and scales to series you have not studied by hand.

Here is how the airline model looks as an equation, now that you have seen its coefficients. Each factor below is one of the four things we chose. If formulas are not your thing, skip to the next section; the code above is all you need to fit the model.

$$(1 - B)(1 - B^{12})\, y_t = (1 + \theta_1 B)(1 + \Theta_1 B^{12})\, \varepsilon_t$$

Where:
- $B$ = the backshift operator, which steps back one period, so $B\,y_t = y_{t-1}$ and $B^{12} y_t = y_{t-12}$
- $(1 - B)$ = one ordinary difference, the `d = 1` part
- $(1 - B^{12})$ = one seasonal difference, the `D = 1` part
- $\theta_1$ = the non-seasonal MA coefficient, the `ma1` above
- $\Theta_1$ = the seasonal MA coefficient, the `sma1` above
- $\varepsilon_t$ = the unpredictable error at time $t$

[NOTE]
**AICc only compares models fitted to the same data and the same transform.** Both models above use `lambda = 0`, so their scores are comparable. Never compare an AICc from a logged fit against one from an unlogged fit; the numbers live on different scales.

**Try it:** Fit the airline model `ARIMA(0,1,1)(0,1,1)[12]` to `USAccDeaths` by hand with `Arima()` and confirm it matches the model `auto.arima()` chose in the first section.

```r title="Your turn: fit the airline model by hand"
# Goal: fit ARIMA(0,1,1)(0,1,1)[12] to USAccDeaths with Arima().
# Fill in the seasonal order c(P, D, Q).
ex_air <- Arima(USAccDeaths, order = c(0, 1, 1),
                seasonal = c(0, 0, 0))   # change to c(0, 1, 1)
ex_air
```

<details>
<summary>Click to reveal solution</summary>

```r title="Airline model on USAccDeaths"
ex_air <- Arima(USAccDeaths, order = c(0, 1, 1), seasonal = c(0, 1, 1))
ex_air
#> Series: USAccDeaths 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4303  -0.5528
#> s.e.   0.1228   0.1784
#> 
#> sigma^2 = 102860:  log likelihood = -425.44
#> AIC=856.88   AICc=857.32   BIC=863.11
```

**Explanation:** The `seasonal = c(0, 1, 1)` shorthand fills in `(P, D, Q)` and R reads the period from the series. The coefficients match `auto.arima(USAccDeaths)` from the first exercise exactly, because it is the same model.

</details>

## How do you check the model and forecast the future?

Fitting a model is only half the job. Before you forecast, you have to confirm the model is adequate, and the check is the same one we used to condemn the plain ARIMA earlier: the residuals should look like random noise with nothing left over. The `checkresiduals()` function runs a Ljung-Box test and draws the residual diagnostics in one call.

```r title="Check the airline model residuals"
checkresiduals(airline_fit)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 26.446, df = 22, p-value = 0.233
#> 
#> Model df: 2.   Total lags used: 24
```

The p-value is `0.233`, comfortably above `0.05`. Unlike the tiny p-value from the plain model, this one says we cannot reject the idea that the residuals are pure noise. The plot that accompanies this output shows residuals bouncing around zero, an ACF with no spikes poking past the blue bounds, and a roughly bell-shaped histogram. The model has captured the structure and left only randomness behind, so it is safe to forecast with.

Now for the payoff. The `forecast()` function projects the model forward; here we ask for 24 months, two full years ahead, and plot the result with `autoplot()`.

```r title="Forecast two years ahead and plot"
air_fc <- forecast(airline_fit, h = 24)
autoplot(air_fc)
```

The plot shows the historical series in one colour, the forecast continuing its upward trend, and a shaded fan around the forecast that widens as we look further out. That widening fan reflects growing uncertainty: the further ahead you predict, the wider the interval around the forecast. Notice the forecast keeps the seasonal shape, peaking each summer and dipping each winter, which is the whole reason we used a SARIMA model. Let's print the point forecasts to see the actual numbers.

```r title="Show the point forecasts by month"
round(air_fc$mean)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1961 450 426 479 492 509 583 670 667 558 497 430 477
#> 1962 496 469 527 542 560 642 738 734 615 547 473 525
```

Read across 1961: the model predicts the familiar summer peak (670 in July) and winter lull (426 in February), and read down and you see 1962 sitting higher than 1961, because the model also carried the long-run growth trend forward. Seasonality and trend, both projected in one model.

[KEY INSIGHT]
**A trustworthy SARIMA leaves residuals that look like white noise.** If `checkresiduals()` returns a small p-value or shows a spike at the seasonal lag, the model is still missing structure, and the usual fix is to add a seasonal AR or seasonal MA term and refit. A clean residual check is your green light to forecast.

**Try it:** Forecast the next 12 months of `USAccDeaths` using the airline model and print the point forecasts.

```r title="Your turn: forecast the next year of USAccDeaths"
# Goal: fit the airline model to USAccDeaths and forecast 12 months.
ex_air2 <- Arima(USAccDeaths, order = c(0, 1, 1), seasonal = c(0, 1, 1))
ex_fc2 <- forecast(ex_air2, h = 6)   # change 6 to 12
round(ex_fc2$mean)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Twelve-month forecast for USAccDeaths"
ex_air2 <- Arima(USAccDeaths, order = c(0, 1, 1), seasonal = c(0, 1, 1))
ex_fc2 <- forecast(ex_air2, h = 12)
round(ex_fc2$mean)
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1979  8336  7532  8315  8617  9489  9860 10907 10087  9165  9384  8885  9377
```

**Explanation:** The forecast for 1979 mirrors the historical shape, peaking in July (10,907) and dipping in February (7,532). The SARIMA model projected the seasonal pattern one year forward.

</details>

## Complete Example: Forecast airline passengers and measure the error

Let's put every step together on a real forecasting task and, crucially, measure how good the forecast actually is. The honest way to do that is to hide the last stretch of data, train the model on the rest, forecast the hidden part, and compare. We will train on everything through the end of 1958 and hold out 1959 and 1960 as a test set.

```r title="Split into training and test sets"
bt_train <- window(AirPassengers, end = c(1958, 12))
bt_test  <- window(AirPassengers, start = c(1959, 1))
```

The `window()` function slices a time series by date. With the split in place, we fit the airline model on the training data only, forecast 24 months to cover the test period, and score the result with `accuracy()`, which reports error metrics on both the training and test sets.

```r title="Fit, forecast, and score against the held-out years"
bt_model <- Arima(bt_train, order = c(0, 1, 1), seasonal = c(0, 1, 1), lambda = 0)
bt_fc    <- forecast(bt_model, h = 24)
round(accuracy(bt_fc, bt_test), 3)
#>                  ME   RMSE    MAE    MPE  MAPE  MASE  ACF1 Theil's U
#> Training set -0.237  8.835  6.517 -0.075 2.638 0.228 0.042        NA
#> Test set     39.447 43.184 39.447  8.516 8.516 1.381 0.464     0.843
```

Focus on the `MAPE` column, the mean absolute percentage error. On the held-out years the model is off by about 8.5% on average, forecasting two full years into the future it had never seen. The `Test set` error is larger than the `Training set` error of 2.6%, which is completely normal: a model always looks better on data it learned from than on data it must predict. An 8.5% error two years out on a genuinely seasonal series is a strong result.

For peace of mind, let's confirm the automatic search would have reached the same model on the training data.

```r title="Confirm auto.arima agrees on the training data"
auto.arima(bt_train, lambda = 0)
#> Series: bt_train 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> Box Cox transformation: lambda= 0 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.3424  -0.5405
#> s.e.   0.1009   0.0877
#> 
#> sigma^2 = 0.001432:  log likelihood = 197.51
#> AIC=-389.02   AICc=-388.78   BIC=-381
```

Same `ARIMA(0,1,1)(0,1,1)[12]` structure, with coefficients estimated from the shorter training window. That is the full SARIMA workflow start to finish: spot the season, difference it away, read or search for the orders, fit, check residuals, forecast, and measure the error.

## Frequently Asked Questions

**What is the difference between (p, d, q) and (P, D, Q)?** They are the same three ideas at two different reaches. The lowercase `(p, d, q)` act on neighbouring steps: `p` looks back one step, `d` differences one step, `q` uses the last step's error. The uppercase `(P, D, Q)` do the identical jobs but reach back one whole season of `m` steps: for monthly data that is 12 months, so `P` looks back to the same month last year.

**Do I need both a regular difference and a seasonal difference?** Often yes, and they remove different things. A regular difference (`d = 1`) removes a trend that carries over month to month; a seasonal difference (`D = 1`) removes a pattern that repeats every year. `AirPassengers` has both a rising trend and a yearly cycle, so it needs `d = 1` and `D = 1`. Use `ndiffs()` for `d` and `nsdiffs()` for `D`, and rarely will either go above 1.

**How do I set the season length m for my own data?** R only reads `m` automatically when the series already carries a frequency, as the built-in datasets do. For data you import, set it when you build the series with `ts()`, for example `ts(x, frequency = 12)` for monthly data or `ts(x, frequency = 4)` for quarterly. If you leave the frequency at 1, R treats the data as non-seasonal and `auto.arima()` will never add seasonal terms.

**When should I log the data before fitting a SARIMA model?** Log the series when the seasonal swings grow wider as the level rises, as they do for `AirPassengers`. The `lambda = 0` argument does this for you: it fits on the log scale and back-transforms the forecast automatically, so you never work with logged numbers by hand. If the swings stay a roughly constant size over time, you do not need it.

**auto.arima() did not add any seasonal terms. What went wrong?** The most common cause is that the series does not carry a frequency above 1, so R has no season length to work with. Check `frequency(your_series)`; if it returns 1, rebuild the series with the correct `frequency` and refit. It is also worth setting `stepwise = FALSE` and `approximation = FALSE`, which make `auto.arima()` search more thoroughly at the cost of speed.

## Practice Exercises

These capstone exercises combine several steps from the tutorial. Each uses its own variable names so it will not collide with the code above. Try each one before opening the solution.

### Exercise 1: Fit automatically and prove the residuals are clean

Fit an automatic seasonal model to `USAccDeaths`, then run a Ljung-Box test on its residuals at lag 24. Decide whether the residuals look like white noise.

```r title="Exercise 1 starter: fit and test residuals"
# 1. Fit an automatic model to USAccDeaths.
# 2. Run Box.test() on its residuals, lag = 24, type = "Ljung-Box".
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Fit and check for white noise"
c1_fit <- auto.arima(USAccDeaths)
c1_fit
#> Series: USAccDeaths 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4303  -0.5528
#> s.e.   0.1228   0.1784
#> 
#> sigma^2 = 102860:  log likelihood = -425.44
#> AIC=856.88   AICc=857.32   BIC=863.11
Box.test(residuals(c1_fit), lag = 24, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(c1_fit)
#> X-squared = 26.094, df = 24, p-value = 0.3484
```

**Explanation:** The p-value of `0.3484` is well above `0.05`, so we cannot reject white noise. The airline model captured the structure in `USAccDeaths`, leaving only random residuals, so it is safe to forecast with.

</details>

### Exercise 2: Backtest the model on held-out data

Split `USAccDeaths` so the training set runs through December 1977 and the test set is all of 1978. Fit the airline model on the training set, forecast 12 months, and report the test-set RMSE and MAPE with `accuracy()`.

```r title="Exercise 2 starter: split, fit, forecast, score"
# 1. train = USAccDeaths through Dec 1977; test = 1978.
# 2. Fit ARIMA(0,1,1)(0,1,1)[12] on the training set.
# 3. Forecast 12 months and compare to the test set with accuracy().
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Backtest the airline model on USAccDeaths"
c2_train <- window(USAccDeaths, end = c(1977, 12))
c2_test  <- window(USAccDeaths, start = c(1978, 1))
c2_model <- Arima(c2_train, order = c(0, 1, 1), seasonal = c(0, 1, 1))
c2_fc    <- forecast(c2_model, h = 12)
round(accuracy(c2_fc, c2_test), 3)
#>                  ME    RMSE     MAE   MPE  MAPE  MASE   ACF1 Theil's U
#> Training set 57.393 298.784 207.693 0.670 2.432 0.431 -0.032        NA
#> Test set     52.764 288.828 231.610 0.385 2.717 0.481  0.540     0.399
```

**Explanation:** The test-set RMSE is about 289 deaths and the MAPE is 2.72%, so the model predicts the unseen year to within about 3% on average. The low test error confirms the airline model generalises well to this series.

</details>

### Exercise 3: Prove that the seasonal terms actually help

Fit two automatic models to `USAccDeaths`, one with `seasonal = FALSE` and one with `seasonal = TRUE`, then compare their AICc values. Does the seasonal model win?

```r title="Exercise 3 starter: does the season help?"
# 1. Fit auto.arima with seasonal = FALSE, and again with seasonal = TRUE.
# 2. Compare their AICc values ($aicc). Lower is better.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal versus non-seasonal AICc"
c3_ns <- auto.arima(USAccDeaths, seasonal = FALSE)
c3_s  <- auto.arima(USAccDeaths, seasonal = TRUE)
round(c(nonseasonal = c3_ns$aicc, seasonal = c3_s$aicc), 2)
#> nonseasonal    seasonal 
#>     1141.70      857.32 
```

**Explanation:** The seasonal model scores `857.32` against the non-seasonal model's `1141.70`. Lower AICc is better, so the seasonal model wins by a wide margin, which is the numerical proof that the `(P, D, Q)` terms earn their place.

</details>

## Summary

SARIMA extends ARIMA with a matching set of terms that operate one full season back instead of one step back. You spot the season, difference it away, read or search for the orders, fit with `Arima()` or `auto.arima()`, check the residuals, and forecast. The diagram below recaps that flow.

![The six-step SARIMA workflow from plotting to forecasting](screenshots/SARIMA-in-R-workflow.webp)
*Figure 3: The six-step SARIMA workflow from plot to forecast.*

Here is every SARIMA term in one place, with the R argument that controls it.

| Term | Meaning | Set in R with |
|---|---|---|
| p, d, q | Non-seasonal AR, differencing, MA | `order = c(p, d, q)` |
| P, D, Q | Seasonal AR, differencing, MA | `seasonal = c(P, D, Q)` |
| m | Season length (12 monthly, 4 quarterly) | Read from the series frequency |
| lambda = 0 | Fit on the log scale to stabilise variance | `lambda = 0` |

The key takeaways to carry forward:

- **Seasonal data needs seasonal terms.** A plain ARIMA leaves the yearly pattern stranded in the residuals, and a Ljung-Box test at the seasonal lag will expose it.
- **D removes the season, P and Q model what remains.** One seasonal difference usually flattens a stable yearly cycle; then one seasonal AR or MA term captures the leftover seasonal correlation.
- **Read only the seasonal lags when picking P and Q.** An ACF spike at lag m points to seasonal MA; a PACF spike at lag m points to seasonal AR.
- **auto.arima() is a reliable default,** and when you understand the orders yourself, its output stops being a black box and becomes a confirmation.

## References

1. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (2nd ed), Section 8.9: Seasonal ARIMA models. [Link](https://otexts.com/fpp2/seasonal-arima.html)
2. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (3rd ed), Section 9.9: Seasonal ARIMA models. [Link](https://otexts.com/fpp3/seasonal-arima.html)
3. Hyndman, R.J. - forecast package: `Arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/Arima.html)
4. Hyndman, R.J. - forecast package: `auto.arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/auto.arima.html)
5. Box, G.E.P., Jenkins, G.M., Reinsel, G.C. & Ljung, G.M. - *Time Series Analysis: Forecasting and Control*, 5th Edition. Wiley (2015). The origin of the airline model.
6. R Core Team - `stats::arima` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html)
7. Nau, R. - *Seasonal ARIMA models* (Duke University). [Link](https://people.duke.edu/~rnau/seasarim.htm)

## Continue Learning

- [ARIMA in R: What AR, I, and MA Mean and How to Fit One](ARIMA-in-R.html) - the non-seasonal foundation that SARIMA builds on, explained from scratch.
- [How to Choose ARIMA Order in R](How-to-Choose-ARIMA-Order-in-R.html) - a deeper guide to reading ACF and PACF plots to pick p, d, and q.
- [ARIMA Diagnostics in R](ARIMA-Diagnostics-in-R.html) - how to interpret residual checks like the Ljung-Box test and fix a model that fails them.
