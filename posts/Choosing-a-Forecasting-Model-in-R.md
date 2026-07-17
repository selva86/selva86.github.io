---
title: "Which Forecasting Model in R? A Decision Guide"
slug: "Choosing-a-Forecasting-Model-in-R"
description: "No single forecasting model wins everywhere. Match trend and seasonality to Holt, ETS, SARIMA, Prophet, VAR or neural nets, then let a backtest decide."
keywords: "which forecasting model in R, choosing a forecasting model, forecasting model selection R, ETS vs ARIMA in R, SARIMA vs ETS, R forecast package, time series model selection, rolling origin backtest"
auto_link_terms: "choosing a forecasting model|choose a forecasting model|which forecasting model|forecasting model selection|pick a forecasting model|forecasting decision guide|ETS vs ARIMA|ETS or ARIMA|ETS or SARIMA|model selection for time series|rolling origin backtest|seasonal naive baseline|forecasting model in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "DG3"
post_type: "FR"
fr_parent: "Time-Series-Objects-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">There is no forecasting model that wins on every series, so the honest answer to "which one should I use?" is a procedure rather than a name. Read your series for three features (does it trend, does it repeat on a calendar, does its swing grow), use those to draw up a shortlist of two or three candidates, then let a backtest pick the winner. This guide walks that procedure end to end on one real series, and the model that looks best after the first test is not the one that wins.</p>

## Which model should you try first?

Every guide to this question hands you a table of model names and leaves you to guess. Let's do the opposite and start with the answer, on real data, before any theory.

Our series for the whole post is `AirPassengers`, which ships with R: the number of international airline passengers, every month from January 1949 to December 1960, in thousands of people. It starts at 112 thousand passengers in January 1949 and ends at 432 thousand in December 1960. It is 144 monthly numbers, and it is the series every forecasting textbook reaches for because it has almost everything that makes forecasting interesting.

Here is the plan. We hide the last 24 months from every model, let each one learn from the first 120 months only, then ask each to forecast the 24 months it never saw and score it against what actually happened. The model whose forecasts land closest wins. Because this is a time series, the split is by *date*, not at random: we train on the past and test on the future, exactly as you would have to in real life.

The score is **RMSE**, the root mean squared error. Take each month's miss (actual passengers minus forecast passengers), square the misses so that overshoots and undershoots cannot cancel out, average the squares, then take the square root to get back to passenger units:

\\( \\text{RMSE} = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2} \\)

where \\( y_i \\) is what actually happened in month \\( i \\), \\( \\hat{y}_i \\) is what the model predicted for that month, and \\( n \\) is the number of months scored (24 here). An RMSE of 77 means the model was off by roughly 77 thousand passengers in a typical month. Lower is better.

Four candidates go in: a seasonal naive baseline, Holt's method, plus ETS and SARIMA. If those names mean nothing to you yet, good, that is the point. Watch what they score, then we will spend the rest of the post explaining what each one is and when it is the right call.

```r title="Four candidates, one honest test"
suppressMessages(library(forecast))

# Learn from Jan 1949 to Dec 1958; hide the last 24 months from every model.
# window() cuts a ts object by date, and c(1958, 12) reads "year 1958, month 12".
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
c(months_to_learn_from = length(train), months_held_back = length(test))
#> months_to_learn_from     months_held_back
#>                  120                   24

# snaive() and holt() hand back a forecast directly. ets() and auto.arima() hand
# back a fitted model, so forecast(model, h = 24) is what turns it into 24 months.
candidates <- list(
  "Seasonal naive"     = snaive(train, h = 24),
  "Holt (trend only)"  = holt(train, h = 24),
  "ETS (automatic)"    = forecast(ets(train), h = 24),
  "SARIMA (automatic)" = forecast(auto.arima(train), h = 24)
)

# Typical miss, in thousands of passengers, over the 24 months no model ever saw.
round(sapply(candidates, function(f) accuracy(f, test)["Test set", "RMSE"]), 1)
#>     Seasonal naive  Holt (trend only)    ETS (automatic) SARIMA (automatic)
#>               77.0              117.1               72.5               74.3
```

Read that table slowly, because three things in it are worth more than any model tutorial.

**ETS came first at 72.5.** SARIMA was a close second at 74.3. The gap between them is 1.8 thousand passengers, which on a series averaging around 400 thousand is nothing. Anyone who tells you ETS beats SARIMA on this data is over-reading a rounding error, and we will find out later that they are also wrong.

**Holt came last, at 117.1, and it is not close.** Holt is a perfectly good method. It is a bad *match* for this series, and it lost by 60% for one specific, findable reason that the next section will show you. This is the whole thesis of the post in one number: a model is not good or bad, it is matched or mismatched to what your series contains.

**The dumbest candidate scored 77.0 and beat Holt comfortably.** "Seasonal naive" means: whatever happened in this month last year, predict exactly that again. No parameters. No fitting. It took less than a millisecond and it beat a real statistical method by 40 thousand passengers a month. Hold on to that, because it is the most useful thing in the table.

> **Note:** Never shuffle a time series into random train and test sets. The classic `sample()` split leaks the future into the training set: your model gets to see December 1959 while predicting June 1959, so it scores brilliantly on the test and then fails in production. For time series, the test set is always the *most recent* block, and `window()` is how you carve it.

## What is actually in your series?

Holt lost by 60%, and the reason is not subtle once you look. Before choosing any model, you read the series for three features. They are the entire input to the decision.

The first question is the seasonal period: does the series repeat on a fixed calendar cycle, and if so, how long is it? In R this is stored on the `ts` object itself, so you can just ask.

```r title="Question 1: does it repeat, and how often?"
# frequency = how many observations before the calendar pattern repeats.
# 12 = monthly data with a yearly cycle; 4 = quarterly; 1 = no seasonal cycle.
frequency(AirPassengers)
#> [1] 12

# The first 14 months, laid out as a calendar.
head(AirPassengers, 14)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1949 112 118 132 129 121 135 148 148 136 119 104 118
#> 1950 115 126
```

`frequency()` returned 12, meaning R considers this monthly data whose pattern repeats every 12 observations. Look at 1949 in the calendar view and you can see the cycle by eye: passengers climb from 112 in January to a summer peak of 148 in July and August, fall away to a low of 104 in November, then start over. That summer bulge is **seasonality**, a pattern tied to the calendar that repeats at a known period.

That is already enough to convict Holt. Holt's method models a level and a trend and nothing else. It has no way to represent "July is always high and November is always low", so it forecasts a smooth line straight through the middle of a series that swings by hundreds of thousands of passengers between July and November. Its RMSE of 117.1 is mostly the seasonal swing it structurally cannot see.

We can measure the seasonality instead of eyeballing it. `decompose()` pulls the repeating seasonal pattern out of the series and away from the underlying trend. Its `figure` element holds the 12 monthly seasonal indices it found.

```r title="Question 2: how big is the seasonal effect?"
# type = "multiplicative": treat the season as a percentage of the trend,
# so 1.227 means "about 23% above the trend line", not "+23 thousand".
dec <- decompose(AirPassengers, type = "multiplicative")
round(dec$figure, 3)
#>  [1] 0.910 0.884 1.007 0.976 0.981 1.113 1.227 1.220 1.060 0.922 0.801 0.899
```

Those twelve numbers are the seasonal indices, one per month starting at January. July's index is 1.227, so a typical July runs about 23% above the trend line for that part of the year. November's is 0.801, about 20% below. February's 0.884 and August's 1.220 tell the same story. The peak-to-trough spread is roughly 1.227 / 0.801, about 1.5x. A model that ignores a 50% swing is going to lose, which is exactly what Holt did.

The third question is the one people skip, and it decides more than they expect: **is the seasonal swing constant in size, or does it grow as the series grows?**

```r title="Question 3: is the swing growing?"
early <- window(AirPassengers, start = c(1949, 1), end = c(1951, 12))  # first 3 years
late  <- window(AirPassengers, start = c(1958, 1), end = c(1960, 12))  # last 3 years

# In absolute passengers, how far is the peak above the trough?
round(c(early_swing = max(early) - min(early), late_swing = max(late) - min(late)), 1)
#> early_swing  late_swing
#>          95         312

# As a ratio, is the peak still the same multiple of the trough?
round(c(early_ratio = max(early) / min(early), late_ratio = max(late) / min(late)), 2)
#> early_ratio  late_ratio
#>        1.91        2.01
```

This is the most informative pair of numbers in the post. In absolute terms the swing more than tripled, from 95 thousand passengers in the early years to 312 thousand in the late years. But as a *ratio* it barely moved: the peak was 1.91 times the trough early on and 2.01 times the trough at the end.

That is the signature of **multiplicative seasonality**. The season is not "add 95 thousand passengers in July", it is "multiply by about two in July". As the airline grew, the seasonal swing grew with it, in proportion. The alternative, **additive seasonality**, would show a roughly constant absolute swing and a shrinking ratio. Which one you have decides an argument inside both ETS and SARIMA later, and it is the difference between a model that fits the last three years and one that only fits the first three.

Those three answers narrow the field. Here is the full decision, with the branches we are not taking on this series included, because your next series will take one of them.

![Decision tree for choosing a forecasting model in R, branching on seasonality and cross-series effects and funnelling into a rolling-origin backtest](screenshots/Choosing-a-Forecasting-Model-in-R-decision-tree.webp)
*Figure 1: The decision. Start at the baseline, branch on what you found in your series, and notice that every path ends in the same place: a backtest. The tree narrows the field to a shortlist; it does not pick the winner.*

Read the tree from the top. You always fit the baseline. Then the seasonal question splits the field: no seasonality and a drift sends you to Holt, no seasonality and a flat level sends you to simple exponential smoothing (`ses()`, a weighted average of the recent past that the next section unpacks), one regular seasonal period sends you to ETS and SARIMA, and a messy calendar (holidays, two cycles at once, gaps) is where Prophet earns its keep. If other series drive yours, you need VAR. If the pattern is nonlinear, a neural net is on the table. `AirPassengers` has one regular period and needs nothing but its own past, so it lands squarely on the ETS and SARIMA node. Note what that node says: fit both, do not choose yet.

## Why start with a naive baseline?

The seasonal naive forecast scored 77.0 and beat a real statistical method. That was not a fluke, and understanding why is what separates people who forecast well from people who collect model names.

Seasonal naive is one rule: **the forecast for next July is last July**. Formally, \\( \\hat{y}_{t+h} = y_{t+h-m(k+1)} \\), where \\( m \\) is the seasonal period (12 here), \\( h \\) is how far ahead you are forecasting, and \\( k \\) counts the whole extra years you have to step back to land on a month you have actually observed. For the first 12 months of our forecast that is just "the same month last year". For months 13 to 24 it is the same month *two* years back, because by then last year is itself a forecast and copying a guess would be circular. Nothing is estimated. Let's look at its errors in full.

```r title="The bar every model has to clear"
base_fc <- snaive(train, h = 24)

# RMSE: typical miss in thousands of passengers (squares the big misses).
# MAE:  typical miss, not squared, so one bad month hurts it less.
# MAPE: typical miss as a percentage of the actual value.
round(accuracy(base_fc, test)["Test set", c("RMSE", "MAE", "MAPE")], 2)
#>  RMSE   MAE  MAPE
#> 76.99 71.25 15.52
```

Copying last year forward gets you within about 15.5% of the truth on a series it knows nothing about. That number is your bar. Its value is that it converts a vague worry ("is my model any good?") into an answerable question ("does it beat 76.99?"). Holt, at 117.1, does not. That is a complete and sufficient reason to drop Holt, and we reached it without knowing anything about how Holt works internally.

The baseline also calibrates the prize. ETS scored 72.5 against the baseline's 77.0. All that machinery bought a 6% improvement. On this series that may well be worth having, but you should know it is 6% and not imagine it is 60%, and you only know that because you measured the floor.

> **Watch out:** If the baseline wins, that is a result, not an embarrassment. It usually means the series is close to a random walk with a seasonal pattern, and there is little signal left for a model to find. Shipping `snaive()` is then the correct engineering decision: it has no parameters to drift and anyone in the building can explain it in one sentence. The failure mode is not "my model barely beat the baseline", it is "I never checked."

## When is ETS the right call?

ETS is the family the tree pointed at, and its full name says what it does: **E**rror, **T**rend, **S**eason. It is exponential smoothing, and the idea underneath it is one you already use.

Suppose you want to forecast tomorrow from a history of daily numbers. Averaging all of history treats a value from three years ago as seriously as yesterday's, which is clearly wrong for anything that drifts. Using only yesterday throws away all the information in the rest. Exponential smoothing takes the middle: a weighted average where the weight decays as you go back in time.

That is simple exponential smoothing, and it is one line:

\\( \\hat{y}_{t+1} = \\alpha y_t + (1 - \\alpha)\\hat{y}_t \\)

The next forecast is a blend of what just happened (\\( y_t \\)) and what you previously expected (\\( \\hat{y}_t \\)), mixed by \\( \\alpha \\), a number between 0 and 1. An \\( \\alpha \\) near 1 means "trust the latest observation, forget the past fast". An \\( \\alpha \\) near 0 means "the past is stable, barely update". Unroll that recursion and the weight on an observation \\( k \\) steps back is \\( \\alpha(1-\\alpha)^k \\), which decays geometrically. That decay is the "exponential" in the name.

Holt's method adds a second such equation for the trend, so it tracks two things at once: a **level** \\( \\ell_t \\), meaning where the series sits right now once you look past the noise, and a **slope** \\( b_t \\), meaning how much it is climbing per month.

\\( \\ell_t = \\alpha y_t + (1 - \\alpha)(\\ell_{t-1} + b_{t-1}) \\)

\\( b_t = \\beta(\\ell_t - \\ell_{t-1}) + (1 - \\beta) b_{t-1} \\)

\\( \\hat{y}_{t+h} = \\ell_t + h\\,b_t \\)

with \\( \\beta \\) controlling how fast the slope updates. Add a third equation for the seasonal component, controlled by \\( \\gamma \\), and you have Holt-Winters. ETS is the modern generalisation: it writes down every sensible combination of error, trend, and season, each of which can be additive (A), multiplicative (M), or absent (N), plus a damped trend (Ad) that flattens long-horizon growth. Then `ets()` fits the plausible combinations and picks the one with the best AICc, a score that rewards fit and penalises extra parameters.

So you do not choose the letters. You let `ets()` choose them, then read them to learn what it decided your series was.

```r title="Let ETS pick its own letters, then read them"
fit_ets <- ets(train)
fit_ets
#> ETS(M,Ad,M)
#>
#> Call:
#> ets(y = train)
#>
#>   Smoothing parameters:
#>     alpha = 0.7459
#>     beta  = 0.0189
#>     gamma = 3e-04
#>     phi   = 0.9793
#>
#>   Initial states:
#>     l = 120.667
#>     b = 1.7375
#>     s = 0.8978 0.7964 0.919 1.0576 1.2072 1.218
#>            1.1113 0.9779 0.9838 1.0253 0.8973 0.9084
#>
#>   sigma:  0.0381
#>
#>      AIC     AICc      BIC
#> 1110.450 1117.222 1160.625
```

`ETS(M,Ad,M)` is the model it chose, and every letter is a finding about our data.

The first **M** is the error: multiplicative, so the noise scales with the level. Early months are wrong by a few thousand passengers, late months by tens of thousands, and the *percentage* error is what stays stable. The **Ad** is the trend: additive but damped. It still grows, but `phi = 0.9793` shrinks that growth the further out you go: each month ahead adds only 97.93% of the growth the month before it added. So the forecast bends toward flat instead of extrapolating 1950s growth forever. The last **M** is the season: multiplicative. That is `ets()` independently rediscovering exactly what we found by hand in the swing check, where the ratio held near 2 while the absolute gap tripled.

The smoothing parameters are just as readable. `alpha = 0.7459` is high: the level chases recent observations hard. `beta = 0.0189` is tiny: the slope is treated as nearly fixed, updated only glacially. `gamma = 3e-04` is essentially zero, which says the seasonal shape found in the early years was so stable that it never needed revising. That is a real, checkable statement about airline travel in the 1950s, and it came out of four lines of code.

This is where ETS stops, and it matters. ETS only knows about your series' own level, trend, and season. It cannot take an external driver (a price, a promotion, a competitor's launch) as an input. If you need that, you need a model with regressors, which is the door SARIMA and the tree's right-hand branches open.

## When is SARIMA the right call?

SARIMA came second at 74.3, a whisker behind ETS, and it gets to the same place by a completely different road. Where ETS asks "what are the level, trend, and season doing?", ARIMA asks one question: **how does this month relate to previous months, once I have removed the trend and the season?**

The removal step is the key, and it is called **differencing**. A stationary series is one whose behaviour does not depend on when you look: no trend, no seasonality, roughly constant variance. ARIMA needs stationarity, and `AirPassengers` is about as far from stationary as a series gets. Differencing is how you get there. Take a regular difference and instead of modelling passengers you model the *change* in passengers from last month, which kills a trend. Take a seasonal difference and you model the change from the same month last year, which kills a yearly season.

You do not have to guess how many of each you need. `ndiffs()` and `nsdiffs()` run statistical tests and tell you.

```r title="How much differencing does the series need?"
# ndiffs:  how many regular differences to remove the trend
# nsdiffs: how many seasonal differences to remove the yearly cycle
c(regular_differences = ndiffs(train), seasonal_differences = nsdiffs(train))
#>  regular_differences seasonal_differences
#>                    1                    1
```

One of each. That answer is the `d` and the `D` in the model's name. A SARIMA is written **ARIMA(p,d,q)(P,D,Q)[m]**: lowercase letters for the ordinary part, uppercase for the seasonal part, and `m` for the seasonal period. `p` is how many recent months feed into the forecast (the autoregressive order), `d` is the regular differencing we just found, `q` is how many recent forecast errors feed back in (the moving average order), and `P`, `D`, `Q` are the same three ideas one year apart. `auto.arima()` searches over those orders and returns the best by AICc.

```r title="Let the search find the orders"
fit_arima <- auto.arima(train)
fit_arima
#> Series: train
#> ARIMA(1,1,0)(0,1,0)[12]
#>
#> Coefficients:
#>           ar1
#>       -0.2397
#> s.e.   0.0935
#>
#> sigma^2 = 103.6:  log likelihood = -399.64
#> AIC=803.28   AICc=803.4   BIC=808.63
```

`ARIMA(1,1,0)(0,1,0)[12]` unpacks cleanly. The `[12]` is our monthly period. The `(0,1,0)` seasonal part is one seasonal difference and nothing else, which is precisely the seasonal naive rule ("compare to the same month last year") built in as the model's backbone. The `(1,1,0)` ordinary part is one regular difference plus one autoregressive term. So the whole model reads: *difference away the trend and the season, then explain what is left using last month's value alone.*

That single `ar1` coefficient is -0.2397. Negative autoregression means the differenced series alternates: a month that jumped more than usual tends to be followed by a month that jumps less, a mild bounce-back. The standard error is 0.0935, so the coefficient is about 2.6 standard errors from zero and is really there rather than noise.

This is also where SARIMA does the one thing ETS refused to. Hand `auto.arima()` an `xreg` argument (a matrix of predictors, one row per month) and the model gains ordinary regression terms alongside the time-series machinery, so a price, a promotion, or a holiday flag can drive the forecast. You then supply those same predictors for the future when you call `forecast()`. That is the door the end of the last section pointed at.

> **Watch out:** You may have spotted that this model reports `AIC=803.28` while `ETS(M,Ad,M)` above reported `AIC 1110.450`, and concluded SARIMA wins by a mile. It does not, and the comparison is meaningless. **AIC and AICc cannot be compared between ETS and ARIMA models.** `auto.arima()` differenced the series, so it is scoring how well it explains 107 differenced values, while `ets()` is scoring all 120 original ones. The two numbers describe different quantities, so their scale says nothing about which model forecasts better. AICc is for choosing *within* a family, which is exactly what `ets()` and `auto.arima()` each used it for internally. To compare *across* families you need what we are doing anyway: error on data neither model saw.

Now put the two models side by side, because their disagreement is instructive. ETS and SARIMA looked at the same 120 months and produced descriptions that barely overlap. ETS said "multiplicative error, damped additive trend, multiplicative season, and here are four smoothing parameters". SARIMA said "difference it twice and regress on last month". They land within 1.8 thousand passengers of each other on the holdout. That is not a coincidence: the families overlap heavily (every ETS model has an ARIMA cousin, and vice versa for the linear ones), and on a well-behaved seasonal series they are two routes to the same signal.

Which explains why the tree's node says *fit both, do not choose yet*. There is no theory that tells you which of ETS or SARIMA wins on your data. There is only the test.

> **Note:** `auto.arima()` chose to difference rather than to model the growing swing directly. If you want ARIMA to handle multiplicative seasonality the way ETS did, pass `lambda = "auto"` to fit on a Box-Cox transformed scale, which turns a multiplying season into an adding one. `auto.arima(train, lambda = "auto")` is worth adding to your shortlist whenever the swing check shows a stable ratio.

## What about Prophet, VAR, and neural nets?

The tree has three branches we have not walked, and each exists because it solves something ETS and SARIMA genuinely cannot. Knowing when to leave the classical families is most of what a decision guide is for.

**A nonlinear pattern is the case for a neural net.** ETS and SARIMA are linear models: every forecast they make is a weighted sum of things that already happened, with the weights fitted from your data. If your series bends in ways a weighted sum cannot express, a neural net can fit it. `nnetar()` in the same `forecast` package fits a neural network autoregression, feeding lagged values of the series into a small hidden layer. It runs here, so we can add it to the bake-off.

```r title="A neural net on the same 120 months"
set.seed(2026)   # the net starts from random weights; the seed makes this repeatable
fit_nn <- nnetar(train)

# NNAR(p,P,k)[m]: p recent lags, P seasonal lags, k hidden nodes, m seasonal period.
fit_nn$method
#> [1] "NNAR(1,1,2)[12]"

round(accuracy(forecast(fit_nn, h = 24), test)["Test set", "RMSE"], 1)
#> [1] 29.8
```

That is not a typo. `NNAR(1,1,2)[12]`, a network with two hidden nodes fed by last month and the same month last year, scored 29.8 against ETS's 72.5. It more than halved the error of the best classical model, on the same held-back 24 months.

So should you reach for a neural net first? No, and the reasons are the honest part of this section.

It is stochastic. The net starts from random weights, so the answer moves when the seed moves: `set.seed(2026)` gives 29.8, and `set.seed(99)` gives 31.3. Two analysts running identical code get different numbers, which is a real problem in any setting where a forecast has to be reproduced or audited. It is also uninterpretable in a way the others are not. `ETS(M,Ad,M)` told us the season multiplies and the trend damps; `ARIMA(1,1,0)(0,1,0)[12]` told us there is a bounce-back after unusual months. `NNAR(1,1,2)[12]` tells you there are two hidden nodes. Nobody can bring that to a planning meeting. And a 24-month holdout is one sample: a flexible model that wins a single split is exactly the model most likely to have got lucky on it, which is the problem the last section exists to solve.

> **Watch out:** `nnetar()` averages 20 networks by default and still lands somewhere different for each seed. If you use it, always fix the seed, and report the spread across several seeds rather than the single number that flattered you.

**Several series that drive each other is the case for VAR.** Every model so far forecasts one series from its own past. Sometimes that is wrong: road casualties and distance driven move together, and each carries information about the other. A vector autoregression models them jointly, letting every series depend on the recent past of every series, including itself. The `vars` package does it, but it is not part of the browser's package set, so this one is for your local R.

```r-static title="A VAR on two series that move together (run this locally)"
# install.packages("vars")
library(vars)

# Seatbelts, built into R: monthly UK road figures, Jan 1969 to Dec 1984.
# "drivers" = car drivers killed OR seriously injured (roughly 1,700 a month);
# "kms"     = distance driven. "ksi" is the standard road-safety shorthand.
uk <- cbind(ksi = as.numeric(Seatbelts[, "drivers"]),
            kms = as.numeric(Seatbelts[, "kms"]))

# p = 2: let each series depend on the last 2 months of BOTH series.
var_fit <- VAR(uk, p = 2, type = "const")
round(coef(var_fit)$ksi[, 1], 3)
#>  ksi.l1  kms.l1  ksi.l2  kms.l2   const
#>   0.733  -0.047  -0.141   0.044 726.774

round(predict(var_fit, n.ahead = 3)$fcst$ksi[, 1:3], 1)
#>        fcst  lower  upper
#> [1,] 1741.7 1350.7 2132.7
#> [2,] 1747.8 1246.7 2248.8
#> [3,] 1747.9 1202.6 2293.1
```

Read the coefficient row for `ksi`. `ksi.l1 = 0.733` says most of this month's casualties are explained by last month's. `kms.l1 = -0.047` is the cross-effect that a single-series model cannot represent at all: months with more distance driven are followed by slightly *fewer* casualties, once last month's casualties are accounted for. Treat that as a correlation worth investigating rather than a safety claim to trust on sight. The structural point is what matters here: that number can only exist because we let the two series talk to each other, and no single-series model has anywhere to put it. The forecast then gives both series' futures at once, three months ahead, with intervals.

**A messy calendar is the case for Prophet.** ETS and SARIMA both assume one regular seasonal period, fixed and known: `frequency()` returns 12 and that is that. Real business data often breaks that assumption. Daily retail sales have a weekly cycle *and* a yearly cycle at the same time. Moving holidays (Easter, Ramadan, Diwali) land on different dates each year. Series have gaps and level shifts from a website redesign. Prophet was built for exactly this: it fits trend, multiple seasonalities, and a holiday list as separate additive pieces, and it tolerates missing days. It needs a Stan compiler, so it also lives on your local machine rather than in this page.

```r-static title="Where Prophet earns its keep (run this locally)"
# install.packages("prophet")
# library(prophet)
#
# Prophet wants a data frame with a date column `ds` and a value column `y`.
# df <- data.frame(ds = seq(as.Date("2020-01-01"), by = "day", length.out = 1200),
#                  y  = daily_sales)
#
# Two seasonal periods at once, plus a holiday calendar. This is the part
# ETS and SARIMA cannot express:
# m <- prophet(df,
#              weekly.seasonality = TRUE,
#              yearly.seasonality = TRUE,
#              holidays = make_holidays_df(2020:2023, "IN"))
#
# future <- make_future_dataframe(m, periods = 90)
# fc <- predict(m, future)   # yhat, plus one column per component
```

We are not showing output for that block because we are not running it, and inventing numbers would defeat the point of the whole post. The shape is what matters: you hand Prophet a data frame of dates and values, name the seasonalities you believe exist, and hand it a holiday calendar. On a monthly series like `AirPassengers`, with one clean yearly cycle and no holidays, Prophet has nothing to offer that ETS does not do better and faster. Reach for it when your calendar is messy, not because it is newer.

## How do you let the data decide?

We have a shortlist and a verdict: ETS 72.5, SARIMA 74.3. Before you ship ETS, notice what that verdict actually rests on. **One split.** One arbitrary choice of "hide the last 24 months". Twenty-four numbers.

A single train/test split is a sample of size one. If 1959 happened to suit ETS's damped trend slightly better than SARIMA's differencing, ETS wins the split and you never find out it was luck. The fix is to stop asking one question and ask several: roll the origin. Train on everything before 1957 and forecast 1957. Then train on everything before 1958 and forecast 1958. Then 1959, then 1960. Four independent tests instead of one, each honouring the past-predicts-future rule.

```r title="Roll the origin: four tests instead of one"
origins <- c(1957, 1958, 1959, 1960)

# For one model, score it on each year in turn, training only on what came before.
rmse_for <- function(fit_fn) {
  sapply(origins, function(yr) {
    tr <- window(AirPassengers, end = c(yr - 1, 12))                # the past
    te <- window(AirPassengers, start = c(yr, 1), end = c(yr, 12))  # that year
    fc <- fit_fn(tr)
    sqrt(mean((as.numeric(te) - as.numeric(fc$mean))^2))
  })
}

backtest <- rbind(
  "Seasonal naive"     = rmse_for(function(tr) snaive(tr, h = 12)),
  "Holt (trend only)"  = rmse_for(function(tr) holt(tr, h = 12)),
  "ETS (automatic)"    = rmse_for(function(tr) forecast(ets(tr), h = 12)),
  "SARIMA (automatic)" = rmse_for(function(tr) forecast(auto.arima(tr), h = 12))
)
colnames(backtest) <- origins
round(backtest, 1)
#>                    1957 1958  1959 1960
#> Seasonal naive     41.5 17.0  49.3 50.7
#> Holt (trend only)  75.3 69.2 103.3 93.3
#> ETS (automatic)    24.4 21.3  50.8 27.4
#> SARIMA (automatic) 15.8 21.5  47.5 23.9

round(rowMeans(backtest), 1)
#>     Seasonal naive  Holt (trend only)    ETS (automatic) SARIMA (automatic)
#>               39.6               85.3               31.0               27.2
```

**The verdict flipped.** Averaged over four origins, SARIMA wins at 27.2 and ETS is second at 31.0. The single holdout in the first section said the opposite. Look along the rows to see why: SARIMA beat ETS in 1957 (15.8 against 24.4), in 1959 (47.5 against 50.8), and in 1960 (23.9 against 27.4). It lost only in 1958, by 0.2.

Now look harder at the 1959 column, because it settles the argument. That origin trains on everything up to Dec 1958, which is precisely the training set the first section used, and it forecasts 1959, which is precisely the first half of that section's 24-month test. SARIMA won it, 47.5 against 50.8. So ETS did not win the first test by being better in 1959: it *lost* 1959. Its win came entirely from 1960, the second year of a forecast made two years out from a single origin. The far end of one long forecast from one origin is the flimsiest evidence in forecasting, and it was the only thing holding ETS up.

That is a genuine, reproducible reversal produced by nothing but asking the question four times instead of once, and it is why the tree funnels every branch into a backtest. Notice also what did not change: Holt is last in all four years, and the baseline is beaten by both real models in all four. The rankings that were robust stayed robust; the one that was within noise flipped. That is exactly the information a single split hides from you.

One detail to match to your own problem: this loop scores 12 months ahead, while the first section scored 24. A model can be better at one horizon and worse at another, so roll the origin at the horizon you actually forecast at, by widening the test window and passing `h = 24`. On this series that changes the numbers but not the answer: SARIMA still finishes in front.

> **Watch out:** Do not compare these numbers to the ones in the first section. The backtest averages over years when the airline was smaller, so its errors are on a different scale (SARIMA's 27.2 here is not "better than" its 74.3 there). RMSE is only comparable *within* one evaluation, between models scored on the same months. Compare the ranking, never the level.

So the answer for `AirPassengers` is SARIMA, by about 12% over ETS, with both comfortably beating the baseline's 39.6. Note how little of that answer came from theory and how much came from measurement. The features told us Holt was hopeless and put ETS and SARIMA on the shortlist. The backtest picked between them, and it overruled our first attempt at doing so.

## FAQ

**Is there a single best forecasting model?**
No, and the M-competitions have been making that point with real data for forty years. What wins is a procedure: fit a naive baseline, shortlist two or three models that match the features your series actually has, and backtest them over several origins. The M4 competition's most striking finding was that combinations of simple methods beat most sophisticated single models, and that many machine learning methods failed to beat the classical statistical ones.

**Should I just use `auto.arima()` and be done?**
It is a reasonable default for a seasonal series, and it came first in our backtest. But it is a search over ARIMA models only, so it can only ever return an ARIMA. On our data it lost the first test to `ets()` and won the second by 12%, which is a thin enough margin that on your series the answer could easily go the other way. Fitting both costs you two lines.

**What if my series is too short to hold back a test set?**
With fewer than about two full seasonal cycles you cannot reliably estimate seasonality at all, let alone validate it. Under roughly 24 monthly points, use `snaive()` or `ses()`, keep the horizon short, and be explicit that you are extrapolating on thin evidence. If you have a few short related series, a VAR or a hierarchical approach can pool their information; a single 15-point series simply cannot support a seasonal model.

**Why did the neural net win the first test but not get recommended?**
Because it won one split, and one split is a sample of size one. Flexible models are the most likely to win a single split by luck, which is exactly why the backtest exists. It is also stochastic (29.8 at one seed, 31.3 at another) and it tells you nothing about your series. If you do use it, fix the seed and backtest it across origins like everything else.

**What is the difference between ETS and SARIMA in one sentence?**
ETS describes a series as a level, a trend, and a season that get smoothly updated as new data arrives, while SARIMA differences the trend and season away and then models how each observation relates to previous ones. They overlap heavily in practice, which is why you fit both and let the backtest choose.

**Is there a shortcut for the rolling-origin loop?**
Yes. `tsCV()` in the `forecast` package does it for every possible origin, not just the four we chose: `tsCV(AirPassengers, function(y, h) forecast(ets(y), h = h), h = 12)` returns a matrix of errors you can square, average, and square-root. It refits the model at every origin, so it is much slower (about a minute on this series). Use the explicit loop when you want a handful of realistic origins and speed; use `tsCV()` when you want thoroughness.

## Summary

The choice is a procedure, not a name. Read the features, shortlist from the tree, backtest the shortlist.

| Question about your series | Answer | Where to look |
|---|---|---|
| Does it repeat on a fixed calendar period? | No, and it drifts: **Holt**. No, and it is flat: **`ses()`** | `frequency()`, a calendar view of the data |
| Does it repeat on one regular period? | Yes: **ETS and SARIMA**, fit both | `frequency()`, `decompose()$figure` |
| Is the seasonal swing growing with the level? | Yes: multiplicative, so **ETS(M,.,M)** or `auto.arima(lambda = "auto")` | peak-to-trough ratio, early years against late |
| Is the calendar messy (holidays, two cycles, gaps)? | Yes: **Prophet** | your domain, not a function |
| Do other series drive this one? | Yes: **VAR** | your domain, plus `vars::VAR()` |
| Is the pattern nonlinear? | Maybe: **`nnetar()`**, with a fixed seed and healthy suspicion | backtest it against the classical models |
| Which shortlisted model actually wins? | Whichever has the lowest error over **several rolling origins** | the loop in the last section, or `tsCV()` |

On `AirPassengers` that procedure ran as follows. The features said monthly seasonality with a peak-to-trough ratio near 2 that stayed near 2 while the absolute swing tripled, which is multiplicative seasonality on a damped trend. That killed Holt (117.1, worse than doing nothing clever) and shortlisted ETS and SARIMA. The single holdout said ETS by a hair. The four-origin backtest reversed it and said SARIMA, 27.2 against 31.0, and it did so consistently in three years out of four. The baseline that we were tempted to skip turned out to be the thing that made every one of those numbers mean something.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed. The standard free text for everything in this post, by the author of the `forecast` package: [otexts.com/fpp3](https://otexts.com/fpp3/).
2. Hyndman & Athanasopoulos, chapter 8, *Exponential smoothing*. Derives the ETS taxonomy and explains what each of the (E,T,S) letters does: [otexts.com/fpp3/expsmooth.html](https://otexts.com/fpp3/expsmooth.html).
3. Hyndman & Athanasopoulos, chapter 9, *ARIMA models*. Covers differencing, stationarity, and how `auto.arima()` searches the orders: [otexts.com/fpp3/arima.html](https://otexts.com/fpp3/arima.html).
4. Hyndman & Athanasopoulos, section 5.8, *Evaluating point forecast accuracy*. The reference for RMSE, MAE, MAPE and the rolling-origin idea, including `tsCV()`: [otexts.com/fpp3/accuracy.html](https://otexts.com/fpp3/accuracy.html).
5. Hyndman, R. J. & Khandakar, Y. "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software* 27(3), 2008. The paper describing the `ets()` and `auto.arima()` algorithms this post leans on: [jstatsoft.org/article/view/v027i03](https://www.jstatsoft.org/article/view/v027i03).
6. `forecast` package reference. Function-level docs for `snaive()`, `holt()`, `ets()`, `auto.arima()`, `nnetar()`, `accuracy()`, and `tsCV()`: [pkg.robjhyndman.com/forecast](https://pkg.robjhyndman.com/forecast/).
7. `vars` package on CRAN. The vignette works through VAR order selection, diagnostics, and impulse response functions: [cran.r-project.org/package=vars](https://cran.r-project.org/package=vars).
8. Prophet documentation, Meta. Read the "Seasonality, Holiday Effects, And Regressors" page to see the cases that motivate leaving ETS and SARIMA behind: [facebook.github.io/prophet](https://facebook.github.io/prophet/).

## Continue Learning

- [Time Series Objects in R](Time-Series-Objects-in-R.html) explains the `ts` object that `frequency()` and `window()` read, and when to reach for `xts` or `tsibble` instead. Start here if the `window(AirPassengers, end = c(1958, 12))` calls felt like magic.
- [Test Stationarity in R](Test-Stationarity-in-R.html) goes under `ndiffs()` and `nsdiffs()`, showing the ADF and KPSS tests they run and how to read their disagreements.
- [ACF and PACF in R](ACF-and-PACF-in-R.html) is how you read ARIMA orders off a plot instead of delegating to `auto.arima()`, which is worth doing at least once so the `(1,1,0)(0,1,0)[12]` output stops being a black box.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) picks up where our `decompose()` call left off, and covers STL, the more flexible tool for pulling trend and season apart.
