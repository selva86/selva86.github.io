---
title: "ETS Models in R: Error, Trend, and Seasonal Components"
slug: "ETS-Models-in-R"
description: "ETS models split a forecast into Error, Trend, and Seasonal parts. Learn the ETS taxonomy, fit ets() in R, and let AICc auto-select the best model for you."
keywords: "ETS models in R, ets() function, exponential smoothing state space, error trend seasonal, forecast package, AICc model selection, additive vs multiplicative, Holt-Winters, time series forecasting in R"
auto_link_terms: "ETS models|ETS model|ETS models in R|ETS framework|ETS taxonomy|error trend seasonal|exponential smoothing state space model|state space exponential smoothing|additive vs multiplicative seasonality|automatic forecasting with ETS"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.9"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "ETS Models"
sidebar_order: 11
difficulty: "Intermediate"
---

<p class="lead">An ETS model builds a forecast from three moving parts: the Error, the Trend, and the Seasonal pattern. That is where the name comes from, E, T, and S. Each part is switched to one of three settings, none, additive, or multiplicative, so a short code like <code>ETS(M,Ad,M)</code> describes the whole model. This one framework covers flat series, trending series, and seasonal business data. This post shows what each letter means, how to fit a model with <code>ets()</code> from the forecast package, how R picks the best one for you, and how to read the forecast it produces.</p>

## What does ETS stand for, and why does it matter?

Forecasting a monthly series by hand means juggling three questions at once. Where is the overall level heading? Is there a repeating seasonal shape? And how noisy is the data around that pattern? An ETS model answers all three at the same time, and R fits one in a single line.

ETS stands for **E**rror, **T**rend, and **S**easonal, the three components every ETS model is made of. The letters also nod to the method's origin, because ETS is the modern, statistically grounded form of exponential smoothing. We will use the `AirPassengers` series: 144 monthly totals of international airline passengers, in thousands, from January 1949 to December 1960. It ships with R, so you already have it. Press Run on the block below.

```r title="Fit an ETS model in one line"
suppressMessages(library(forecast))
# AirPassengers ships with R: 144 monthly airline passenger
# totals (thousands), Jan 1949 to Dec 1960.
fit <- ets(AirPassengers)
fit
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

The very first line is the payoff. `ETS(M,Ad,M)` is the model R chose on its own, without you telling it anything about the data. Read the three letters in order: **M** error, **Ad** trend, **M** seasonal. In plain English, R decided the noise is multiplicative, the trend is additive but damped (the `d`), and the seasonal swing is multiplicative. The rest of the printout lists the numbers that define this specific model, and we will unpack every one of them as we go.

For now, notice what just happened. One function call inspected a seasonal series and returned a complete, named forecasting model plus goodness-of-fit scores (`AIC`, `AICc`, `BIC`). That naming is the heart of ETS, and the diagram below shows the anatomy behind the three-letter code.

![An ETS model splits a series into Error, Trend, and Seasonal parts, then recombines them into a forecast.](screenshots/ETS-Models-in-R-anatomy.webp)

*Figure 1: An ETS model splits a series into Error, Trend, and Seasonal parts, then recombines them into a forecast.*

[KEY INSIGHT]
**ETS is one framework with three switches, and the code names the exact setting of each switch.** Instead of memorising separate methods for flat, trending, and seasonal data, you learn one system where a label like ETS(M,Ad,M) tells you precisely how the model treats error, trend, and season.

**Try it:** Fit an automatic ETS model to a different built-in series, `USAccDeaths` (monthly accidental deaths in the US, 1973 to 1978), and print just its three-letter code with `$method`.

```r title="Your turn: fit ETS to USAccDeaths"
# Goal: fit an automatic ETS model to USAccDeaths and read its code.
# Change the series below from AirPassengers to USAccDeaths.
ex_series <- AirPassengers   # <- swap this for USAccDeaths
ex_fit <- ets(ex_series)
ex_fit$method
#> Expected: the auto-selected code, e.g. "ETS(A,N,A)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="ETS on monthly accident deaths"
ex_fit <- ets(USAccDeaths)
ex_fit$method
#> [1] "ETS(A,N,A)"
```

**Explanation:** For `USAccDeaths`, R picks `ETS(A,N,A)`: additive error, no trend, additive seasonal. Unlike the airline data, this series has no long-run climb, so the trend slot is set to `N`.

</details>

## What do the three letters (E, T, S) actually mean?

Each of the three components can take one of a few settings, and the letter in the code tells you which. Here is the full menu.

- **Error (first letter):** `A` additive or `M` multiplicative. Additive error means the random wobble is roughly the same size all the way through. Multiplicative error means the wobble grows as the series climbs.
- **Trend (second letter):** `N` none, `A` additive (a straight-line trend), or `Ad` additive damped (a trend that flattens out over time). The little `d` marks damping.
- **Seasonal (third letter):** `N` none, `A` additive, or `M` multiplicative.

The one idea that trips up beginners is the difference between additive and multiplicative. It is worth slowing down for, because it decides two of the three letters. Additive means the seasonal swing (or the noise) stays a constant size no matter how high the series climbs. Multiplicative means the swing grows in proportion to the level: when the series doubles, the swing roughly doubles too.

You can see which one `AirPassengers` needs by measuring the size of the seasonal swing early and late in the record. The swing is just the gap between the busiest and quietest month of a year.

```r title="Measure the seasonal swing each year"
# Peak-to-trough gap within the first full year vs the last full year
first_year <- window(AirPassengers, start = c(1949, 1), end = c(1949, 12))
last_year  <- window(AirPassengers, start = c(1960, 1), end = c(1960, 12))
c(swing_1949 = max(first_year) - min(first_year),
  swing_1960 = max(last_year)  - min(last_year))
#> swing_1949 swing_1960
#>         44        232
```

The `window()` function slices out one year at a time. In 1949 the gap between the busiest and quietest month was 44 thousand passengers. By 1960 that same gap had grown to 232 thousand, more than five times larger. The seasonal pattern did not just sit there, it scaled up as air travel grew.

That is the fingerprint of multiplicative seasonality, and it is exactly why `ets()` set the seasonal letter to `M` for this series. If the swing had stayed near 44 both years, additive (`A`) would have been the right call. The diagram below sums up the choice.

![Additive seasonality keeps a constant swing; multiplicative seasonality grows with the level.](screenshots/ETS-Models-in-R-additive-vs-multiplicative.webp)

*Figure 2: Additive seasonality keeps a constant swing; multiplicative seasonality grows with the level.*

[WARNING]
**Multiplicative models need strictly positive data.** Because a multiplicative component multiplies the level, it is only defined when every value is above zero. If your series contains zeros or negatives (temperatures, profit and loss, differenced data), force an additive model or transform the series first, or ets() will refuse to fit.

**Try it:** Measure the seasonal swing for `USAccDeaths` in its first year (1973) and last year (1978). Does the swing grow a lot, or stay roughly steady? Use that to say whether the seasonality looks additive or multiplicative.

```r title="Your turn: swing in accident deaths"
# Fill in the end months so each window covers one full year.
ex_first <- window(USAccDeaths, start = c(1973, 1), end = c(1973, 12))
ex_last  <- window(USAccDeaths, start = c(1978, 1), end = c(1978, 12))
c(swing_1973 = max(ex_first) - min(ex_first),
  swing_1978 = max(ex_last)  - min(ex_last))
#> Expected: two similar numbers, so the seasonality looks additive
```

<details>
<summary>Click to reveal solution</summary>

```r title="Additive seasonality in USAccDeaths"
ex_first <- window(USAccDeaths, start = c(1973, 1), end = c(1973, 12))
ex_last  <- window(USAccDeaths, start = c(1978, 1), end = c(1978, 12))
c(swing_1973 = max(ex_first) - min(ex_first),
  swing_1978 = max(ex_last)  - min(ex_last))
#> swing_1973 swing_1978
#>       3211       3592
```

**Explanation:** The swing moves from 3211 to 3592, only a modest change while the additive pattern holds roughly constant. That is why `ets()` chose `A` (additive) for the seasonal component of this series, not `M`.

</details>

## How many ETS models are there?

Once you know the menu for each letter, counting the models is simple multiplication. The error has 2 settings and the season has 3. The trend has 5: the three you met above (none, additive, additive damped) plus two multiplicative-trend forms (multiplicative and multiplicative damped) that complete the taxonomy but rarely get used. That gives 2 times 5 times 3, which is **30 possible ETS models**.

You do not need to memorise all 30. A handful are famous methods you may already have met under other names, and ETS is simply the umbrella that contains them. The table below lists the ones you will actually see.

| ETS code | Error, Trend, Season | Common name |
|---|---|---|
| ETS(A,N,N) | additive, none, none | Simple exponential smoothing (SES) |
| ETS(A,A,N) | additive, additive, none | Holt's linear trend |
| ETS(A,Ad,N) | additive, damped, none | Damped trend method |
| ETS(A,A,A) | additive, additive, additive | Additive Holt-Winters |
| ETS(M,A,M) | multiplicative, additive, multiplicative | Multiplicative Holt-Winters |
| ETS(M,Ad,M) | multiplicative, damped, multiplicative | Damped multiplicative Holt-Winters |

Reading the table top to bottom, the models get richer: no trend and no season at the top, then a trend, then a full seasonal pattern at the bottom. The model `ets()` chose for the airline data, `ETS(M,Ad,M)`, is the last row, a seasonal method with a gently flattening trend.

You can build any named method by hand by passing its code to the `model` argument. Here is additive Holt-Winters, `ETS(A,A,A)`, fitted to the airline series.

```r title="Force additive Holt-Winters"
aaa_fit <- ets(AirPassengers, model = "AAA")
aaa_fit
#> ETS(A,A,A)
#>
#> Call:
#> ets(y = AirPassengers, model = "AAA")
#>
#>   Smoothing parameters:
#>     alpha = 0.9935
#>     beta  = 2e-04
#>     gamma = 6e-04
#>
#>   Initial states:
#>     l = 120.9608
#>     b = 1.3934
#>     s = -29.1816 -54.3842 -20.7169 15.0727 65.1554 66.1846
#>            33.5822 -4.232 -8.0946 -3.8205 -34.3364 -25.2288
#>
#>   sigma:  18.0471
#>
#>      AIC     AICc      BIC
#> 1565.872 1570.729 1616.359
```

By passing `model = "AAA"` you overruled the automatic search and forced an additive model. Notice the seasonal `s` values are now plain numbers that add to the level (like `-29.18` and `66.18`), whereas the multiplicative fit in section 1 had seasonal factors near 1 that multiply the level (like `0.89` and `1.23`). That is additive versus multiplicative made concrete.

Also compare the two `sigma` values: 18.05 here versus 0.0392 for the multiplicative fit. They are on different scales (one is in passengers, one is a proportion), so you cannot compare them directly, which is exactly why we need a fair score to choose between models. We build that score in a later section.

[NOTE]
**In practice ets() searches fewer than 30 models.** By default it skips the multiplicative-trend models, because a trend that multiplies can explode over long horizons, and it drops a few others that are numerically unstable. So the automatic search usually chooses among roughly 15 to 18 candidates, not the full 30.

**Try it:** Force multiplicative Holt-Winters, `ETS(M,A,M)`, on the airline series and confirm the code with `$method`. Pass `damped = FALSE` so R keeps the plain (undamped) trend you asked for.

```r title="Your turn: force multiplicative Holt-Winters"
# Set model to the three-letter code for multiplicative Holt-Winters.
ex_mam <- ets(AirPassengers, model = "ANN", damped = FALSE)  # <- fix the code
ex_mam$method
#> Expected: "ETS(M,A,M)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Multiplicative Holt-Winters code"
ex_mam <- ets(AirPassengers, model = "MAM", damped = FALSE)
ex_mam$method
#> [1] "ETS(M,A,M)"
```

**Explanation:** `model = "MAM"` requests multiplicative error, additive trend, multiplicative season. Adding `damped = FALSE` stops R from quietly testing a damped version, so you get the exact `ETS(M,A,M)` you asked for.

</details>

## How do you fit an ETS model with ets() in R?

You have already used `ets()` twice, so here is the whole picture of how it works. Called with just a series, `ets(y)` searches the candidate models and returns the best one. Called with `model = "XYZ"`, it fits exactly the model you name. There is also a wildcard: the letter `Z` means "choose this component for me". So `ets(y, model = "ZZZ")` is the same as the fully automatic call, and `ets(y, model = "ZAZ")` would fix the trend to additive while auto-selecting the error and season.

To see everything a fitted model holds, wrap it in `summary()`. It repeats the model description from section 1 and adds a row of accuracy scores at the bottom.

```r title="Read the full model summary"
summary(fit)
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
#>
#> Training set error measures:
#>                    ME     RMSE      MAE       MPE     MAPE      MASE       ACF1
#> Training set 1.567359 10.74726 7.791605 0.4357799 2.857917 0.2432573 0.03945056
```

Read the summary in four blocks. First, the **model line** `ETS(M,Ad,M)` names the chosen model. Second, the **smoothing parameters** (`alpha`, `beta`, `gamma`, `phi`) control how quickly each component reacts to new data, and they get their own section next. Third, the **initial states** (`l`, `b`, `s`) are the model's best guess at the level, trend, and twelve seasonal factors at the very start of the series in 1949.

Fourth come the scores. `sigma` is the model's noise size, and `AIC`, `AICc`, and `BIC` measure fit while penalising complexity (lower is better). The final row is the **training set error measures**, the model's accuracy on the data it learned from. The most readable of these is `MAPE`, the mean absolute percentage error: 2.86 means the fitted values sit within about 2.9 percent of the actual passenger counts on average, which is a tight fit.

[TIP]
**Let ets() choose unless you have a reason not to.** The automatic search almost always matches or beats a model you pick by hand, and it is one keystroke. Force a specific model only to test a hypothesis, to keep a component fixed for comparison, or when domain knowledge tells you the data-driven pick is wrong.

**Try it:** Pull the level smoothing parameter, `alpha`, out of the fitted model. The parameters live in `fit$par`, a named vector, so you can index it by name.

```r title="Your turn: pull out alpha"
# Index fit$par by the name of the level parameter.
round(fit$par["gamma"], 4)   # <- change "gamma" to the level parameter
#> Expected: alpha, about 0.71
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract the level smoothing weight"
round(fit$par["alpha"], 4)
#>  alpha
#> 0.7096
```

**Explanation:** `fit$par` holds every estimated number by name, so `fit$par["alpha"]` returns the level parameter, 0.7096. The next section explains what that value tells you.

</details>

## What do the smoothing parameters (alpha, beta, gamma, phi) mean?

Every ETS model keeps a running estimate of the level, the trend, and the seasonal factors, and updates them each time a new observation arrives. The smoothing parameters decide how big each update is. There are four of them, and each one belongs to a specific component.

- **alpha** controls the **level**: how fast the baseline adapts to new data.
- **beta** controls the **trend**: how fast the slope adapts.
- **gamma** controls the **season**: how fast the seasonal shape adapts.
- **phi** is the **damping** factor: how quickly the trend flattens toward the horizon.

Every smoothing parameter sits between 0 and 1. A value near 0 means the component barely reacts to the newest point, so it stays smooth and stable. A value near 1 means it chases the latest observation hard, so it is quick to change but jumpier. Let us read the four values from the airline fit.

```r title="Show the smoothing parameters"
round(fit$par[c("alpha", "beta", "gamma", "phi")], 4)
#>  alpha   beta  gamma    phi
#> 0.7096 0.0204 0.0001 0.9800
```

The story these four numbers tell is clear once you know the scale. `alpha` is 0.71, fairly high, so the level tracks recent passenger counts closely. `beta` is 0.02 and `gamma` is 0.0001, both almost zero, so the trend slope and the seasonal shape are treated as nearly fixed: they were set early and barely drift. `phi` is 0.98, just under 1, so the trend is damped only gently and keeps most of its slope into the future.

If you want the single equation behind the level update, the simplest ETS model, simple exponential smoothing (SES), makes it concrete. Its forecast is the latest level, and the level is updated like this.

$$\ell_t = \alpha \, y_t + (1 - \alpha)\, \ell_{t-1}$$

Where:

- $\ell_t$ = the updated level after seeing the newest value
- $y_t$ = the newest observed value
- $\ell_{t-1}$ = the previous level
- $\alpha$ = the level smoothing parameter, between 0 and 1

Read it as a weighted average: the new level is a blend of the newest observation and the old level, and `alpha` sets the mix. At `alpha = 0.71`, the newest point gets 71 percent of the weight and history gets 29 percent. Trend, season, and damping each add one more update equation of the same shape, which is all a full ETS model really is. If you are not interested in the equation, skip it, because the value of `alpha` alone already tells you how reactive the level is.

[KEY INSIGHT]
**Smoothing parameters are learning rates, not magic numbers.** Near 0 means "trust the established pattern and barely react", near 1 means "chase the newest observation". Reading alpha, beta, gamma, and phi tells you at a glance which parts of the model R considers stable and which it lets move.

**Try it:** Extract the seasonal smoothing parameter, `gamma`, from the fit and round it to 4 places. Given its size, decide whether the seasonal shape is nearly fixed or fast-changing.

```r title="Your turn: read the seasonal weight"
# Change the name below to the seasonal smoothing parameter.
round(fit$par["beta"], 4)   # <- swap "beta" for the seasonal one
#> Expected: gamma, about 0.0001 (so the season is nearly fixed)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract the seasonal smoothing weight"
round(fit$par["gamma"], 4)
#> gamma
#> 1e-04
```

**Explanation:** `gamma` is 0.0001, so close to zero that the twelve seasonal factors set in 1949 barely change across the whole series. The airline's seasonal shape is stable, even as its overall level climbs.

</details>

## How does ets() choose the best model automatically?

When you call `ets(AirPassengers)` with no model, R fits many candidates and needs a fair way to crown a winner. It cannot just pick the model with the smallest errors, because a more complex model can always hug the training data more tightly and then forecast badly. The fix is an information criterion that rewards good fit but charges a penalty for each extra parameter.

R uses the **AICc**, a small-sample-corrected version of the Akaike Information Criterion. Lower is better. It balances how well the model fits against how many parameters it spends, so it favours a model that explains the data without overfitting. The picture below shows the loop.

![How ets() scores every candidate model with AICc and keeps the lowest.](screenshots/ETS-Models-in-R-auto-selection.webp)

*Figure 3: How ets() scores every candidate model with AICc and keeps the lowest.*

You can reproduce the contest by hand. Fit a few named models, read the `aicc` value out of each, and sort them. The automatic pick should land at the top.

```r title="Compare models by AICc"
model_aicc <- c(
  auto = fit$aicc,
  MAM  = ets(AirPassengers, model = "MAM", damped = FALSE)$aicc,
  AAA  = ets(AirPassengers, model = "AAA", damped = FALSE)$aicc,
  ANN  = ets(AirPassengers, model = "ANN")$aicc)
round(sort(model_aicc), 2)
#>    auto     MAM     AAA     ANN
#> 1400.64 1403.66 1570.73 1733.96
```

Sorted smallest first, the winner is `auto` at 1400.64, the `ETS(M,Ad,M)` model R selected. The plain multiplicative Holt-Winters (`MAM`) is a close second at 1403.66, so the gentle damping bought only a small improvement. Additive Holt-Winters (`AAA`) trails at 1570.73, and simple exponential smoothing (`ANN`), which ignores trend and season entirely, is far behind at 1733.96. The gap of more than 300 AICc points between `ANN` and the rest is the numeric proof that this series truly needs its seasonal component.

[WARNING]
**AIC and AICc only compare models fitted to the same series.** The scores are relative, not absolute, so a value of 1400 is meaningless on its own. Never compare AICc across different datasets, and do not compare an ETS model's AICc against an ARIMA model's, because they are computed on different likelihood scales.

**Try it:** Compare the automatic model's AICc against a no-trend, no-season multiplicative model, `MNN`. The auto model should score much lower.

```r title="Your turn: compare against no-trend"
# Fit MNN (multiplicative error, no trend, no season) and read its aicc.
round(c(auto = fit$aicc,
        MNN  = ets(AirPassengers, model = "ANN")$aicc), 2)  # <- change ANN to MNN
#> Expected: auto near 1400.64, MNN much higher
```

<details>
<summary>Click to reveal solution</summary>

```r title="AICc auto versus flat model"
round(c(auto = fit$aicc,
        MNN  = ets(AirPassengers, model = "MNN")$aicc), 2)
#>    auto     MNN
#> 1400.64 1674.07
```

**Explanation:** `MNN` has no trend and no season, so it scores 1674.07, far worse than the auto model's 1400.64. AICc confirms what your eyes already suspect: a flat model cannot describe a climbing, seasonal series.

</details>

## How do you forecast and read the prediction intervals?

Fitting a model is only half the job. To forecast, pass the fitted model to `forecast()` and say how many steps ahead you want with `h`. For monthly data, `h = 12` means the next twelve months.

```r title="Forecast the next twelve months"
fc <- forecast(fit, h = 12)
fc
#>          Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> Jan 1961       441.8018 419.6256 463.9780 407.8863 475.7174
#> Feb 1961       434.1186 407.1668 461.0704 392.8994 475.3379
#> Mar 1961       496.6300 460.6291 532.6310 441.5714 551.6887
#> Apr 1961       483.2375 443.6210 522.8539 422.6493 543.8256
#> May 1961       483.9914 440.0236 527.9591 416.7484 551.2343
#> Jun 1961       551.0244 496.3368 605.7120 467.3869 634.6619
#> Jul 1961       613.1797 547.3865 678.9728 512.5577 713.8016
#> Aug 1961       609.3648 539.2447 679.4850 502.1253 716.6044
#> Sep 1961       530.5408 465.4872 595.5944 431.0500 630.0317
#> Oct 1961       463.0332 402.8496 523.2168 370.9904 555.0761
#> Nov 1961       402.7478 347.4995 457.9961 318.2528 487.2428
#> Dec 1961       451.9694 386.7750 517.1638 352.2631 551.6756
```

Each row is one month. The `Point Forecast` is the model's single best guess, so it expects about 442 thousand passengers in January 1961, rising to a summer peak of 613 thousand in July. Notice the forecast is not a smooth line, it carries the seasonal shape forward: summers high, winters low, exactly the pattern the model learned.

The four remaining columns are **prediction intervals**, the model's honest statement of uncertainty. `Lo 80` and `Hi 80` bracket the range the model is 80 percent sure the actual value will fall in, and `Lo 95` to `Hi 95` is the wider, more cautious 95 percent range. For July 1961 the 95 percent interval runs from 513 to 714, so the model is confident July will be busy but cannot pin the exact number.

Two things make these intervals move. They widen the further out you forecast, because uncertainty compounds with distance, and because this is a multiplicative model, they also widen where the level and the seasonal factor are high. That is why the July interval is far wider than the January one. Point forecasts alone hide this, which is why you should always look at the intervals.

Before trusting any forecast, measure how well the model fit the history and whether it left any pattern behind. Two functions do this. `accuracy()` prints the error scores, and `checkresiduals()` tests whether the residuals still contain signal.

```r title="Measure in-sample accuracy"
round(accuracy(fit), 3)
#>                 ME   RMSE   MAE   MPE  MAPE  MASE  ACF1
#> Training set 1.567 10.747 7.792 0.436 2.858 0.243 0.039
```

These are the same training-set error measures the summary printed back in section 4; `accuracy()` is just the dedicated function for them. Alongside the `MAPE` of 2.858 (the roughly 2.9 percent average error from before), read the `RMSE` of 10.75, which puts the typical error in raw units: around 11 thousand passengers. Both are small relative to a series that ranges from 100 to over 600, so the fit is strong.

```r title="Check the residuals"
checkresiduals(fit)
#>
#> 	Ljung-Box test
#>
#> data:  Residuals from ETS(M,Ad,M)
#> Q* = 51.341, df = 24, p-value = 0.0009527
#>
#> Model df: 0.   Total lags used: 24
```

`checkresiduals()` runs a **Ljung-Box test**, whose null hypothesis is that the residuals are pure noise with no leftover pattern. The p-value here is 0.00095, well below 0.05, so we reject that null: some structure remains in the residuals. Running the block also draws the residual diagnostic plots in the panel below the code. In practice `ETS(M,Ad,M)` is still an excellent, widely used fit for this series, and the failed test is a reminder that even a good model rarely captures a real series perfectly.

[TIP]
**A low error with autocorrelated residuals means you left signal on the table.** Accuracy scores and residual checks answer different questions. Accuracy asks how close the fit was, residual checks ask whether any pattern is still unexplained. Read both before you ship a forecast.

**Try it:** Forecast the next twelve months and read off the single point forecast for the first month, January 1961. The point forecasts live in `fc$mean`.

```r title="Your turn: read the first forecast"
# The forecast means are in fc$mean; pull out the first one.
ex_fc <- forecast(fit, h = 12)
round(ex_fc$mean[3], 1)   # <- change the index to the first month
#> Expected: about 441.8
```

<details>
<summary>Click to reveal solution</summary>

```r title="First point forecast value"
ex_fc <- forecast(fit, h = 12)
round(ex_fc$mean[1], 1)
#> [1] 441.8
```

**Explanation:** `fc$mean` is the vector of point forecasts, so `fc$mean[1]` is the first, January 1961, at 441.8 thousand passengers. It matches the top row of the forecast table above.

</details>

## When should you use ETS instead of ARIMA?

ETS is not the only forecasting framework in R. Its main rival is ARIMA, and the two think about a series in different ways. ETS models the level, trend, and season directly. ARIMA models the correlation between a value and its own past values. The table below is a quick guide to which fits your problem.

| Question | ETS | ARIMA |
|---|---|---|
| What it models | Level, trend, and season directly | Correlation with past values |
| Handles seasonality | Yes, additive or multiplicative | Yes, via seasonal terms |
| Needs a stationary series | No | Yes, usually after differencing |
| External predictors | Not supported | Supported (dynamic regression) |
| Always gives a sensible forecast | Yes | Can misbehave if mis-specified |

Reach for ETS when a series has a clear trend and a repeating seasonal shape, which covers most business data like sales, demand, and web traffic. It needs no differencing, and it always returns a stable forecast. Reach for ARIMA when the interesting structure is autocorrelation, or when you need to include external predictors, which plain ETS cannot do.

ETS has real limits worth knowing. It handles only one seasonal period, so it cannot model data with both a weekly and a yearly cycle. It takes no external regressors. And its multiplicative forms need strictly positive data. When you hit those walls, dynamic regression or a model like TBATS takes over.

The forecast package's `ets()` is the classic interface, but the modern tidyverts stack offers the same model through the `fable` package's `ETS()` function. It uses tsibble data and pipes, and it selects the identical `ETS(M,Ad,M)` with the same parameters. Run this one locally in RStudio, because the fable stack is not available in the in-browser runtime here.

```r-static title="Fit ETS with the fable package"
library(fable)
library(tsibble)
library(dplyr)

# Convert the built-in ts into a tsibble, then let ETS() auto-select
air <- as_tsibble(AirPassengers)
fit_fable <- air |>
  model(ets = ETS(value))
fit_fable
#> # A mable: 1 x 1
#>             ets
#>         <model>
#> 1 <ETS(M,Ad,M)>
```

Calling `report(fit_fable)` on that fit prints the same smoothing parameters and the same AICc (1400.64) you saw from `forecast::ets()`, so the two packages agree exactly. Use whichever fits your workflow: `forecast` for the compact classic interface, `fable` if you already work in the tidyverse.

[NOTE]
**ets() covers one seasonal period and no external regressors.** For multiple seasonalities (say hourly data with daily and weekly cycles) or for adding predictors like price or holidays, step up to dynamic regression with ARIMA errors, or to TBATS for complex seasonality. ETS is the right first tool, not the only one.

**Try it:** Confirm the `Z` wildcard. Fit `ets()` with `model = "ZZZ"`, which asks R to auto-select all three components, and check that its code matches the fully automatic fit from section 1.

```r title="Your turn: let every letter auto-select"
# Z means auto-select. Set all three letters to Z.
round_trip <- ets(AirPassengers, model = "ANN")   # <- change ANN to ZZZ
round_trip$method
#> Expected: "ETS(M,Ad,M)", same as the automatic fit
```

<details>
<summary>Click to reveal solution</summary>

```r title="The ZZZ shortcut matches auto"
round_trip <- ets(AirPassengers, model = "ZZZ")
round_trip$method
#> [1] "ETS(M,Ad,M)"
```

**Explanation:** `Z` tells R to choose that component itself, so `ZZZ` is identical to calling `ets()` with no model at all. Both return `ETS(M,Ad,M)`, confirming the automatic search is exactly the `ZZZ` case.

</details>

## Complete Example: forecasting monthly deaths end to end

Let us run the whole workflow once on a fresh series, the way you would in real work: fit on the past, forecast the future you have not seen, and grade the forecast against what actually happened. We will use `USAccDeaths` and hold out its final year to test on.

The steps are: split the series into a training part (1973 to 1977) and a test part (all of 1978), let `ets()` pick and fit a model on the training part only, forecast the twelve months of 1978, then compare those forecasts to the real 1978 values with `accuracy()`.

```r title="Forecast monthly deaths end to end"
# 1. Split: train on 1973-1977, hold out 1978 as an honest test
train <- window(USAccDeaths, end = c(1977, 12))
test  <- window(USAccDeaths, start = c(1978, 1))

# 2. Fit an automatic ETS model on the training data only
ue_fit <- ets(train)
ue_fit$method
#> [1] "ETS(M,N,M)"

# 3. Forecast the 12 months we held out, then grade against reality
ue_fc <- forecast(ue_fit, h = 12)
round(accuracy(ue_fc, test), 3)
#>                   ME    RMSE     MAE    MPE  MAPE  MASE   ACF1 Theil's U
#> Training set -13.937 273.056 213.889 -0.227 2.459 0.444 -0.010        NA
#> Test set     100.364 289.621 230.751  0.904 2.660 0.479  0.464     0.407
```

On the training years R chose `ETS(M,N,M)`: multiplicative error, no trend, multiplicative season, a sensible read of a series that cycles hard but has little long-run drift. The `accuracy()` call now prints two rows because we gave it the held-out `test` data. The `Training set` row is the fit on data the model learned from, and the `Test set` row is the real prize: how the forecast did on the twelve months it never saw.

The test-set `MAPE` is 2.660, meaning the forecast for unseen 1978 came within about 2.7 percent of the actual monthly deaths. That it barely rose from the training `MAPE` of 2.459 is the sign of a healthy model: it generalised to new data instead of memorising the past. This split-fit-forecast-grade loop is how you should evaluate any forecast before you rely on it.

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution. They use fresh variable names so they will not disturb the `fit` object from earlier.

### Exercise 1: Fit and forecast additive Holt-Winters

Fit an additive Holt-Winters model, `ETS(A,A,A)`, to the full `USAccDeaths` series, then forecast the next twelve months and print the point forecasts rounded to one decimal. Save the model to `my_fit`.

```r title="Your turn: forecast accident deaths"
# Hint: use ets(..., model = "AAA"), then forecast(..., h = 12)$mean

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Additive Holt-Winters forecast"
my_fit <- ets(USAccDeaths, model = "AAA")
my_fc  <- forecast(my_fit, h = 12)
round(my_fc$mean, 1)
#>         Jan     Feb     Mar     Apr     May     Jun     Jul     Aug     Sep
#> 1979  8152.0  7540.8  8321.3  8545.4  9397.7  9816.8 10734.0 10039.1  8973.0
#>         Oct     Nov     Dec
#> 1979  9313.6  8787.2  9049.9
```

**Explanation:** Forcing `model = "AAA"` gives additive Holt-Winters. The forecast carries the additive seasonal shape into 1979, peaking in July at 10734 and dipping in February at 7541, mirroring the yearly cycle in the data.

</details>

### Exercise 2: Prove multiplicative beats additive here

For the airline series, fit both multiplicative Holt-Winters (`MAM`) and additive Holt-Winters (`AAA`) with `damped = FALSE`, read the AICc from each, and print them together. Which error type does AICc prefer for this series?

```r title="Your turn: multiplicative vs additive"
# Hint: build ets(..., model = "MAM", damped = FALSE) and the AAA version,
# then read $aicc from each into a named vector.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare error types by AICc"
my_mult <- ets(AirPassengers, model = "MAM", damped = FALSE)
my_add  <- ets(AirPassengers, model = "AAA", damped = FALSE)
round(c(MAM_mult = my_mult$aicc, AAA_add = my_add$aicc), 2)
#> MAM_mult  AAA_add
#>  1403.66  1570.73
```

**Explanation:** Multiplicative Holt-Winters scores 1403.66 against additive's 1570.73, a gap of 167 AICc points in favour of multiplicative. This is the numeric version of the growing-swing pattern you measured in section 2: because the airline's seasonal swing scales with its level, a multiplicative model fits far better.

</details>

### Exercise 3: Let a train and test split pick the model

Split the airline series into a training set through 1958 and a test set from 1959 on. Fit an automatic ETS model and a forced additive model (`AAA`) on the training set, forecast the test period from each, and compare their test-set RMSE. Which generalises better?

```r title="Your turn: pick a model by test error"
# Hint: window() to split, ets() twice, forecast() over length(te),
# then accuracy(fc, te)["Test set", "RMSE"] for each.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Train and test to choose a model"
tr <- window(AirPassengers, end = c(1958, 12))
te <- window(AirPassengers, start = c(1959, 1))
m_auto <- ets(tr)
m_add  <- ets(tr, model = "AAA")
rmse_auto <- accuracy(forecast(m_auto, h = length(te)), te)["Test set", "RMSE"]
rmse_add  <- accuracy(forecast(m_add,  h = length(te)), te)["Test set", "RMSE"]
round(c(auto = rmse_auto, AAA = rmse_add), 2)
#>  auto   AAA
#> 72.55 91.22
```

**Explanation:** On the held-out 1959 to 1960 data, the automatic model (again `ETS(M,Ad,M)`) has a test RMSE of 72.55 versus 91.22 for the forced additive model. The multiplicative, damped model does not just fit the past better, it forecasts the unseen future more accurately too.

</details>

## Frequently Asked Questions

### What is the difference between ETS and Holt-Winters?

Holt-Winters is not a separate framework, it is one family inside ETS: the models that carry a seasonal component. Additive Holt-Winters is `ETS(A,A,A)` and multiplicative Holt-Winters is `ETS(M,A,M)`. ETS is the wider umbrella that also covers simple exponential smoothing, Holt's linear trend, and the damped-trend variants, all under a single naming scheme.

### Do I need to make my series stationary or difference it first?

No. Unlike ARIMA, ETS models the level, trend, and season directly, so it needs no differencing and no stationarity check. Pass the raw `ts` object straight to `ets()` and it fits.

### Why did ets() choose a multiplicative model for my data?

It chooses multiplicative when the seasonal swing (or the noise) grows as the series climbs, the way the airline swing grew from 44 in 1949 to 232 in 1960. If your swing stays roughly constant as the level rises, `ets()` picks an additive model instead. AICc makes the final call by scoring the candidate models against each other.

### Can ETS handle more than one seasonal cycle?

No. `ets()` models a single seasonal period, so it cannot capture both a daily and a weekly cycle in hourly data at once. For multiple seasonalities reach for TBATS, or for dynamic regression with ARIMA errors when you also need external predictors.

### What does the little "d" in ETS(M,Ad,M) mean?

The `d` marks a damped trend. A plain additive trend (`A`) keeps its full slope into every future step, while a damped additive trend (`Ad`) flattens that slope the further out you forecast, controlled by the `phi` parameter. Damping keeps long-horizon forecasts from climbing to unrealistic values.

## Summary

ETS gives you one clean framework for forecasting: pick a setting for the Error, the Trend, and the Seasonal component, and a short code names the whole model. The `ets()` function does the picking for you and returns a model you can read, forecast, and check. The workflow below is the loop to remember.

![The end-to-end ETS forecasting workflow, from plot to residual check.](screenshots/ETS-Models-in-R-workflow.webp)

*Figure 4: The end-to-end ETS forecasting workflow, from plot to residual check.*

| Idea | What to remember |
|---|---|
| The name | ETS is Error, Trend, Seasonal, the state-space form of exponential smoothing |
| The code | Three letters, like ETS(M,Ad,M): error, trend, season, each set to N, A, or M (Ad means damped) |
| Additive vs multiplicative | Additive keeps a constant swing, multiplicative grows the swing with the level |
| The taxonomy | 2 x 5 x 3 = 30 models in theory; ets() searches a stable subset of about 15 to 18 |
| Fitting | ets(y) auto-selects; ets(y, model = "AAA") forces a model; Z means auto |
| Parameters | alpha, beta, gamma, phi are learning rates from 0 (stable) to 1 (reactive) |
| Selection | ets() minimises AICc, which rewards fit and penalises complexity |
| Forecasting | forecast(fit, h) gives point forecasts plus 80 and 95 percent prediction intervals |
| Checking | accuracy() scores the fit; checkresiduals() tests for leftover pattern |
| Limits | One seasonal period, no external predictors, positive data for multiplicative models |

With those pieces you can fit an ETS model, explain exactly what it assumes about your series, and produce a forecast with honest uncertainty bands, all in a handful of lines.

## References

1. Hyndman, R.J., & Athanasopoulos, G. (2021). *Forecasting: Principles and Practice*, 3rd edition, Chapter 8: Exponential smoothing. OTexts. [Link](https://otexts.com/fpp3/expsmooth.html) - the canonical free textbook treatment, with the full state-space equations behind ETS.
2. Hyndman, R.J., & Athanasopoulos, G. Innovations state space models for exponential smoothing (FPP3 section 8.5). [Link](https://otexts.com/fpp3/ets.html) - spells out the innovations state-space form and the ETS(Error,Trend,Season) taxonomy this post summarises.
3. forecast package reference: the `ets()` function. [Link](https://pkg.robjhyndman.com/forecast/reference/ets.html) - the argument-by-argument reference for every `ets()` option, including `model` and `damped`.
4. Hyndman, R.J., Koehler, A.B., Snyder, R.D., & Grose, S. (2002). A state space framework for automatic forecasting using exponential smoothing methods. *International Journal of Forecasting*, 18(3), 439-454. [Link](https://robjhyndman.com/papers/hksg.pdf) - the original paper defining the framework that ets() automates.
5. Hyndman, R.J., & Khandakar, Y. (2008). Automatic time series forecasting: the forecast package for R. *Journal of Statistical Software*, 27(3). [Link](https://www.jstatsoft.org/article/view/v027i03) - explains the automatic AICc model-selection algorithm ets() runs under the hood.
6. fable package: the `ETS()` function reference. [Link](https://fable.tidyverts.org/reference/ETS.html) - the tidyverts equivalent shown in the last section, for tidyverse workflows.

## Continue Learning

- [Exponential Smoothing in R](Exponential-Smoothing-in-R.html): the smoothing ideas that ETS formalises, from simple to Holt's method, with the update equations spelled out.
- [Holt-Winters in R](Holt-Winters-in-R.html): a deeper look at the seasonal methods that ETS(A,A,A) and ETS(M,A,M) generalise.
- [Time Series Forecasting in R](Time-Series-Forecasting-With-R.html): where ETS fits among the other forecasting tools, including ARIMA and how to compare them fairly.
