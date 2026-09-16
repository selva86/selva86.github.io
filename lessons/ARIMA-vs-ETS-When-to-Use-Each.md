---
title: "ARIMA and Seasonal ARIMA Lesson 6: Choosing between ARIMA and ETS"
catalog_blurb: "Why AICc can't compare ARIMA and ETS, and what to check instead."
description: "Fit ARIMA and ETS on the same series, see why their AICc scores cannot be compared, and use time-series cross-validation to find the more accurate forecaster."
keywords: "ARIMA vs ETS, AICc model comparison, time series cross-validation, rolling origin CV, MASE RMSSE, fable ETS ARIMA, ETS ARIMA equivalence, choosing a forecasting model, AirPassengers forecast"
post_type: "LESSON"
curriculum_id: "5.60.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-arima"
course_title: "ARIMA and Seasonal ARIMA"
course_lesson: "6"
course_total: "7"
course_landing: "ARIMA-and-Seasonal-ARIMA-Course.html"
course_next: "Automatic-and-Manual-ARIMA-Selection.html"
course_prev: "Seasonal-ARIMA-SARIMA.html"
---

=== step === cover
## Choosing between ARIMA and ETS

Today let's settle a question every forecaster runs into sooner or later: given the same series, do you reach for ARIMA or for ETS?

The running example is AirPassengers, a dataset built into R: the monthly count of international airline passengers, in thousands, from January 1949 through December 1960, 144 months in total. It climbs over the whole period, and the summer bump riding on top of that climb gets a little wider every year.

Here is the whole series, plotted month by month.

::widget chart-plotter {"data":[{"x":1,"y":112},{"x":2,"y":118},{"x":3,"y":132},{"x":4,"y":129},{"x":5,"y":121},{"x":6,"y":135},{"x":7,"y":148},{"x":8,"y":148},{"x":9,"y":136},{"x":10,"y":119},{"x":11,"y":104},{"x":12,"y":118},{"x":13,"y":115},{"x":14,"y":126},{"x":15,"y":141},{"x":16,"y":135},{"x":17,"y":125},{"x":18,"y":149},{"x":19,"y":170},{"x":20,"y":170},{"x":21,"y":158},{"x":22,"y":133},{"x":23,"y":114},{"x":24,"y":140},{"x":25,"y":145},{"x":26,"y":150},{"x":27,"y":178},{"x":28,"y":163},{"x":29,"y":172},{"x":30,"y":178},{"x":31,"y":199},{"x":32,"y":199},{"x":33,"y":184},{"x":34,"y":162},{"x":35,"y":146},{"x":36,"y":166},{"x":37,"y":171},{"x":38,"y":180},{"x":39,"y":193},{"x":40,"y":181},{"x":41,"y":183},{"x":42,"y":218},{"x":43,"y":230},{"x":44,"y":242},{"x":45,"y":209},{"x":46,"y":191},{"x":47,"y":172},{"x":48,"y":194},{"x":49,"y":196},{"x":50,"y":196},{"x":51,"y":236},{"x":52,"y":235},{"x":53,"y":229},{"x":54,"y":243},{"x":55,"y":264},{"x":56,"y":272},{"x":57,"y":237},{"x":58,"y":211},{"x":59,"y":180},{"x":60,"y":201},{"x":61,"y":204},{"x":62,"y":188},{"x":63,"y":235},{"x":64,"y":227},{"x":65,"y":234},{"x":66,"y":264},{"x":67,"y":302},{"x":68,"y":293},{"x":69,"y":259},{"x":70,"y":229},{"x":71,"y":203},{"x":72,"y":229},{"x":73,"y":242},{"x":74,"y":233},{"x":75,"y":267},{"x":76,"y":269},{"x":77,"y":270},{"x":78,"y":315},{"x":79,"y":364},{"x":80,"y":347},{"x":81,"y":312},{"x":82,"y":274},{"x":83,"y":237},{"x":84,"y":278},{"x":85,"y":284},{"x":86,"y":277},{"x":87,"y":317},{"x":88,"y":313},{"x":89,"y":318},{"x":90,"y":374},{"x":91,"y":413},{"x":92,"y":405},{"x":93,"y":355},{"x":94,"y":306},{"x":95,"y":271},{"x":96,"y":306},{"x":97,"y":315},{"x":98,"y":301},{"x":99,"y":356},{"x":100,"y":348},{"x":101,"y":355},{"x":102,"y":422},{"x":103,"y":465},{"x":104,"y":467},{"x":105,"y":404},{"x":106,"y":347},{"x":107,"y":305},{"x":108,"y":336},{"x":109,"y":340},{"x":110,"y":318},{"x":111,"y":362},{"x":112,"y":348},{"x":113,"y":363},{"x":114,"y":435},{"x":115,"y":491},{"x":116,"y":505},{"x":117,"y":404},{"x":118,"y":359},{"x":119,"y":310},{"x":120,"y":337},{"x":121,"y":360},{"x":122,"y":342},{"x":123,"y":406},{"x":124,"y":396},{"x":125,"y":420},{"x":126,"y":472},{"x":127,"y":548},{"x":128,"y":559},{"x":129,"y":463},{"x":130,"y":407},{"x":131,"y":362},{"x":132,"y":405},{"x":133,"y":417},{"x":134,"y":391},{"x":135,"y":419},{"x":136,"y":461},{"x":137,"y":472},{"x":138,"y":535},{"x":139,"y":622},{"x":140,"y":606},{"x":141,"y":508},{"x":142,"y":461},{"x":143,"y":390},{"x":144,"y":432}],"geoms":["line"],"x":"month","y":"passengers"}

Look at that climb, and at the summer bump riding on top of it getting wider every year. That widening bump is going to matter a lot once we get to choosing between the two families.

=== step === concept
## Two different ways to model the same series

ETS and ARIMA both forecast a series, but they get there by completely different routes.

ETS smooths a level, a trend and a season directly on the series you actually observe. Each new month nudges the level a little, nudges the trend a little, and nudges the seasonal pattern a little, and the forecast just carries those smoothed pieces forward.

ARIMA works the other way around. It first differences the series, subtracting each value from an earlier one until what's left has no trend and no season, and then it models whatever autocorrelation is still sitting in that differenced series with AR (autoregressive) and MA (moving average) terms.

Fit both on AirPassengers and let each one search for its own best order automatically.

```r
# Build the AirPassengers tsibble and fit ETS and ARIMA with automatic model selection
library(fable)
library(tsibble)
library(dplyr)

ap <- as_tsibble(AirPassengers)
names(ap) <- c("month", "passengers")

fit <- ap |>
  model(
    ets = ETS(passengers),
    arima = ARIMA(passengers)
  )
fit
#> # A mable: 1 x 2
#>             ets                     arima
#>         <model>                   <model>
#> 1 <ETS(M,Ad,M)> <ARIMA(2,1,1)(0,1,0)[12]>
```

Read `ETS(M,Ad,M)` as: multiplicative error, damped additive trend, multiplicative season. Read `ARIMA(2,1,1)(0,1,0)[12]` as: 2 non-seasonal AR terms, one ordinary difference, one non-seasonal MA term, and one seasonal difference at lag 12 with no seasonal AR or MA terms.

Two different searches, over two different kinds of model, landed on two different answers for the same 144 months. Is that always going to happen, or do the two families sometimes agree?

=== step === concept
## The three exact ETS-ARIMA equivalences, and why this model has none

ETS models come in two flavors. In an additive one, the error, the trend and the season all add onto the level. In a multiplicative one, at least one of them multiplies the level instead.

AirPassengers needs multiplication. Its summer bump doesn't stay a fixed number of passengers every year, it grows as the level grows, and only multiplying the level by a seasonal factor can produce a bump that grows with it. That's exactly what the M and M in `ETS(M,Ad,M)` are doing: a multiplicative error and a multiplicative season.

ARIMA can't multiply like that. Every term in its equation, the AR terms that look at past values and the MA terms that look at past errors, gets added together with a fixed weight. There's no way to multiply two states together inside that kind of equation.

So whenever an ETS model stays purely additive, no trend at all, or an additive trend, or a damped additive trend, and no season, it turns out ARIMA can write the exact same forecasts using only addition. Three specific matches:

| ETS model | Exact ARIMA equivalent |
|---|---|
| Simple exponential smoothing, ETS(A,N,N) | ARIMA(0,1,1) |
| Holt's linear trend, ETS(A,A,N) | ARIMA(0,2,2) |
| Damped Holt's trend, ETS(A,Ad,N) | ARIMA(1,1,2) |

`ETS(M,Ad,M)`, the model fit on AirPassengers above, has a multiplicative error and a multiplicative season. It isn't on that list, and no amount of searching over p, d and q will ever put it there. A multiplicative structure simply has no linear ARIMA form to match.

=== step === concept
## Why AICc can't compare ETS and ARIMA

AICc is the usual way to compare models fitted to the same data: the lower it is, the better a model explains its own fit, once you've paid a penalty for every extra parameter.

\[ AICc = -2\log(L) + 2k + \frac{2k(k+1)}{n-k-1} \]

Here \(L\) is the likelihood, how probable the fitted model makes the data it actually saw, \(k\) is the number of parameters the model estimated, and \(n\) is the number of observations that likelihood was computed over.

Ask `report()` for both models' AICc.

```r
# Report each fitted model's parameters and AICc
report(fit |> select(ets))
report(fit |> select(arima))
#> Series: passengers 
#> Model: ETS(M,Ad,M) 
#>   Smoothing parameters:
#>     alpha = 0.7095519 
#>     beta  = 0.02040892 
#>     gamma = 0.0001004683 
#>     phi   = 0.9799999 
#> 
#>   Initial states:
#>      l[0]    b[0]      s[0]    s[-1]     s[-2]    s[-3]    s[-4]    s[-5]
#>  120.9939 1.77054 0.8944475 0.799322 0.9216596 1.059202 1.220301 1.231799
#>   s[-6]     s[-7]     s[-8]   s[-9]    s[-10]    s[-11]
#>  1.1105 0.9786128 0.9803821 1.01103 0.8868923 0.9058524
#> 
#>   sigma^2:  0.0015
#> 
#>      AIC     AICc      BIC 
#> 1395.166 1400.638 1448.623 
#> Series: passengers 
#> Model: ARIMA(2,1,1)(0,1,0)[12] 
#> 
#> Coefficients:
#>          ar1     ar2      ma1
#>       0.5960  0.2143  -0.9819
#> s.e.  0.0888  0.0880   0.0292
#> 
#> sigma^2 estimated as 132.3:  log likelihood=-504.92
#> AIC=1017.85   AICc=1018.17   BIC=1029.35
```

The lines above sigma^2 in the ETS report are its estimated starting level, trend and eleven monthly seasonal states, the machinery ETS carries internally. What matters here is `phi = 0.9799999`, call it 0.98, the damping parameter on the trend, and the AICc at the bottom of each report: 1400.638 for ETS, 1018.17 for ARIMA.

It's tempting to read that gap, nearly 400 points, as ARIMA fitting dramatically better. But look at what each AICc was actually computed over. ARIMA differenced the series once ordinarily and once seasonally at lag 12 before fitting, which removes 13 observations, so its likelihood runs on 144 - 13 = 131 effective values. ETS fits its state-space recursion directly on all 144 raw values, with no observations removed by differencing. The two numbers come from a different n and a different form of likelihood besides. AICc only ever compares models fitted to the exact same data with the exact same kind of likelihood, so these two numbers were never standing on the same scale, and lining them up head to head doesn't tell you which model forecasts better.

=== step === quiz
## Quick check: comparing the two AICc numbers

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- ARIMA's AICc is much lower, so it's simply the better model for AirPassengers. ::no
- ARIMA always overfits a series this size, which is why its AICc looks artificially small here. ::no
- The two AICc values aren't comparable: ARIMA's likelihood is computed on 131 differenced observations while ETS's is computed on the original 144, and the two likelihoods take a different form besides. ::ok Exactly. AICc only ever compares models fitted to the same data with the same kind of likelihood. Differencing changed both the sample size and the likelihood ARIMA was scored on, so the two numbers were never on the same scale to begin with.
- They can't be compared because ETS(M,Ad,M) has no exact ARIMA equivalent, the same fact from the last step. ::no That's a real fact about this pair of models, but it isn't why their AICc values can't be compared. Even two ETS models being compared to each other would have incomparable AICc if one of them were fitted on a differenced series. The problem is the sample size and likelihood form the score was computed over, not whether an equivalent exists.

=== step === widget
## Setting up a fair comparison: rolling-origin cross-validation

A single AICc, computed once on the whole series, only ever grades a model against the data it was allowed to see. A fairer test forecasts real months a model never touched, then checks that forecast against what actually happened.

That's what rolling-origin cross-validation does. Instead of fitting once, fit the model several times, each time on a longer stretch of the series from the start, and each time forecast the next twelve months. Score every one of those forecasts against the real values, then pool the scores. Both ETS and ARIMA get judged the same way this time: on forecasts of real, held-out months, never on their own likelihood.

Step through the folds below to see the general shape of it: k folds, each one taking a turn as the held-out test, feeding into one CV mean at the end.

::widget cv-folds {"k":5}

The rows above are a generic stand-in, not AirPassengers itself. On AirPassengers the five folds are five growing training windows, not five rotating slices: the first trains on 84 months and forecasts the next 12, the second trains on 96 months and forecasts the next 12 after that, and so on up to a fifth window of 132 months. Build that directly on the real series.

```r
# Build 5 rolling-origin training windows on AirPassengers, each forecasting the next 12 months
ap_cv <- ap |>
  stretch_tsibble(.init = 84, .step = 12) |>
  filter(.id <= 5)

ap_cv |>
  as_tibble() |>
  count(.id)
#> # A tibble: 5 × 2
#>     .id     n
#>   <int> <int>
#> 1     1    84
#> 2     2    96
#> 3     3   108
#> 4     4   120
#> 5     5   132
```

Column `n` is the training size for that fold: 84 months for fold 1, growing by 12 each time up to 132 for fold 5. Every fold still forecasts exactly 12 months ahead, so the five folds together cover 1956 through 1960, five full years neither model was allowed to see while fitting.

=== step === concept
## Reading the cross-validation accuracy table

Fit both models on each of the five training windows, forecast 12 months ahead from each one, and score every forecast against the real values that actually came next.

```r
# Fit both models on each of the 5 training windows, forecast 12 months ahead, and pool the accuracy
fit_cv <- ap_cv |>
  model(
    ets = ETS(passengers),
    arima = ARIMA(passengers)
  )

fc_cv <- fit_cv |> forecast(h = 12)

fc_cv |>
  accuracy(ap, measures = list(mase = MASE, rmsse = RMSSE))
#> # A tibble: 2 × 4
#>   .model .type  mase rmsse
#>   <chr>  <chr> <dbl> <dbl>
#> 1 arima  Test  0.627 0.659
#> 2 ets    Test  0.770 0.884
```

MASE (mean absolute scaled error) and RMSSE (root mean squared scaled error) both score a forecast against a naive benchmark that just repeats the last season: a value under 1 beats naive, and lower is better. Pooled across all five folds, ARIMA lands at 0.627 MASE and 0.659 RMSSE against ETS's 0.770 and 0.884. Both models beat naive, but ARIMA's forecasts sat closer to the real held-out months across the five folds combined.

A pooled number can still hide which folds actually decided it. Break the same comparison down fold by fold.

```r
# Break the same comparison down fold by fold, to see where each model wins or loses
fc_cv |>
  accuracy(ap, by = c(".model", ".id"), measures = list(mase = MASE, rmsse = RMSSE))
#> # A tibble: 10 × 5
#>    .model   .id .type  mase rmsse
#>    <chr>  <int> <chr> <dbl> <dbl>
#>  1 arima      1 Test  0.657 0.697
#>  2 arima      2 Test  0.414 0.483
#>  3 arima      3 Test  0.635 0.633
#>  4 arima      4 Test  1.11  1.02 
#>  5 arima      5 Test  0.489 0.536
#>  6 ets        1 Test  0.517 0.556
#>  7 ets        2 Test  0.674 0.745
#>  8 ets        3 Test  0.567 0.628
#>  9 ets        4 Test  1.52  1.56 
#> 10 ets        5 Test  0.749 0.793
```

Fold by fold, ARIMA wins three of the five: folds 2, 4 and 5, forecasting 1957, 1959 and 1960. ETS takes folds 1 and 3, forecasting 1956 and 1958. The widest gap of all five belongs to fold 4, the fold that forecasts 1959: MASE 1.11 for ARIMA against 1.52 for ETS. That's the same year worth a closer look, and it ties straight back to ETS's damping parameter, `phi = 0.98`: ETS's trend is damped, so its forecast growth tapers off the further out it runs, while 1959 turned out to be a year where the real series kept accelerating past what that damping allowed for.

=== step === widget
## Seeing the winner against the real held-out months

Plot the real 1959 counts next to both models' fold-4 forecasts for the same 12 months, to see what those MASE numbers actually look like.

::widget chart-plotter {"data":[{"x":1,"y":360,"fill":"Actual"},{"x":2,"y":342,"fill":"Actual"},{"x":3,"y":406,"fill":"Actual"},{"x":4,"y":396,"fill":"Actual"},{"x":5,"y":420,"fill":"Actual"},{"x":6,"y":472,"fill":"Actual"},{"x":7,"y":548,"fill":"Actual"},{"x":8,"y":559,"fill":"Actual"},{"x":9,"y":463,"fill":"Actual"},{"x":10,"y":407,"fill":"Actual"},{"x":11,"y":362,"fill":"Actual"},{"x":12,"y":405,"fill":"Actual"},{"x":1,"y":345.7,"fill":"ARIMA forecast"},{"x":2,"y":326.3,"fill":"ARIMA forecast"},{"x":3,"y":372.8,"fill":"ARIMA forecast"},{"x":4,"y":360.9,"fill":"ARIMA forecast"},{"x":5,"y":377.7,"fill":"ARIMA forecast"},{"x":6,"y":451.3,"fill":"ARIMA forecast"},{"x":7,"y":508.6,"fill":"ARIMA forecast"},{"x":8,"y":523.7,"fill":"ARIMA forecast"},{"x":9,"y":423.7,"fill":"ARIMA forecast"},{"x":10,"y":379.6,"fill":"ARIMA forecast"},{"x":11,"y":331.3,"fill":"ARIMA forecast"},{"x":12,"y":358.9,"fill":"ARIMA forecast"},{"x":1,"y":345.5,"fill":"ETS forecast"},{"x":2,"y":342.0,"fill":"ETS forecast"},{"x":3,"y":391.7,"fill":"ETS forecast"},{"x":4,"y":376.7,"fill":"ETS forecast"},{"x":5,"y":375.2,"fill":"ETS forecast"},{"x":6,"y":427.3,"fill":"ETS forecast"},{"x":7,"y":469.3,"fill":"ETS forecast"},{"x":8,"y":466.1,"fill":"ETS forecast"},{"x":9,"y":409.1,"fill":"ETS forecast"},{"x":10,"y":356.2,"fill":"ETS forecast"},{"x":11,"y":309.3,"fill":"ETS forecast"},{"x":12,"y":349.3,"fill":"ETS forecast"}],"geoms":["line","point"],"x":"Month of 1959","y":"Passengers (thousands)"}

ARIMA's line sits closer to the actual counts through the summer peak, July and August, than ETS's does. ETS's forecast stays lower across those same two months, never quite catching up to how far the real series climbed. That gap between the two forecast lines and the real counts is exactly what fold 4's MASE numbers already said: 1.11 for ARIMA against 1.52 for ETS.

=== step === concept
## The practical rules of thumb for choosing

Put together, this AirPassengers comparison points to a short list of things worth checking before you fit either model.

1. A season whose swings grow with the level, the way AirPassengers' summer bump does, favors ETS's multiplicative components. ARIMA can only add, so it has to reach that same shape indirectly, through differencing and extra AR or MA terms.
2. A series that needs several differences, or shows long-range autocorrelation that takes many AR or MA terms to explain, favors ARIMA, since that's exactly the structure its differencing and lag terms are built to capture.
3. A short series favors ETS, since its search space is smaller and there's less history for ARIMA's extra parameters to overfit.
4. Wanting to read off a level, a trend and a season directly, the way `report()` did for ETS(M,Ad,M) above, favors ETS. ARIMA's coefficients describe autocorrelation, not a level or a trend you can point at directly.
5. When none of that settles it, run a rolling-origin cross-validation and compare MASE or RMSSE. Never compare AICc across the two families.

=== step === quiz
## Quick check: choosing ARIMA or ETS

A colleague sees ETS's AICc of 1400 against ARIMA's 1018 and wants to always use ARIMA from now on. What do you tell them?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Agree. A lower AICc always means the better forecaster, so ARIMA should be the automatic pick here. ::no
- ETS's AICc must be a bug somewhere in `report()`, since no model should score 400 points worse. ::no
- The two numbers were never on the same footing, so point at the cross-validated MASE and RMSSE instead. On AirPassengers those did favor ARIMA too, 0.627 against 0.770, but that's a fair test, not a coincidence of scale. ::ok Exactly. ARIMA happening to win the fair test here doesn't make AICc a shortcut to the same answer. The AICc gap came from a different sample size and a different likelihood form, and only the cross-validated forecast error settles which model actually forecasts better.
- Convert both AICc values to BIC first, then compare those instead. ::no BIC has the same problem AICc does: it's still built from a likelihood computed over however many observations each model was actually fitted on. Switching the penalty term doesn't fix a mismatched sample size or a different likelihood form underneath it.

=== step === tryit
## Your turn: score a second accuracy measure

`fc_cv` and `ap` still hold the five folds' forecasts and the real series from the cross-validation above. `MASE` and `RMSSE` are already in the measures list. Add `MAE` (mean absolute error) to that same list, then read off which model comes out lower.

```r
# Edit the measures list below to also score MAE, then press Check
fc_cv |>
  accuracy(ap, measures = list(mase = MASE, rmsse = RMSSE))
```
::check {"regex": "mae\\s*=\\s*MAE", "gate": true, "difficulty": "beginner", "ok": "Right: ARIMA's MAE comes out at 19.1 against ETS's 23.4, the same ordering MASE and RMSSE already gave.", "no": "Add a third entry to the measures list, the same way mase and rmsse are already written: mae = MAE."}
::solution
```r
# Add mae = MAE to the measures list and score all three at once
fc_cv |>
  accuracy(ap, measures = list(mase = MASE, rmsse = RMSSE, mae = MAE))
#> # A tibble: 2 × 5
#>   .model .type  mase rmsse   mae
#>   <chr>  <chr> <dbl> <dbl> <dbl>
#> 1 arima  Test  0.627 0.659  19.1
#> 2 ets    Test  0.770 0.884  23.4
```

Same ordering as MASE and RMSSE: ARIMA's average forecast error, 19.1 thousand passengers a month, comes in lower than ETS's 23.4. Three different accuracy measures, one consistent answer.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.), the ETS-ARIMA equivalence and model-selection chapters](https://otexts.com/fpp3) - Hyndman and Athanasopoulos, the free online textbook this lesson's structure follows.
- Forecasting with Exponential Smoothing: The State Space Approach - Hyndman, Koehler, Ord and Snyder, Springer, 2008, the state-space formulation behind ETS and its ARIMA equivalences.
- [Hyndman, R.J. and Khandakar, Y. (2008), "Automatic Time Series Forecasting: The forecast Package for R"](https://doi.org/10.18637/jss.v027.i03) - Journal of Statistical Software, 27(3), the automatic search behind both `ETS()` and `ARIMA()`.
- [fable package documentation](https://pkg.robjhyndman.com/fable) - reference for `model()`, `accuracy()` and `stretch_tsibble()`, the functions used throughout this lesson.
- Time Series Analysis: Forecasting and Control - Box, Jenkins, Reinsel and Ljung, Wiley, the classical ARIMA reference.

=== step === complete
## What decides ARIMA versus ETS

You fit both families on the same series and got two different answers, ETS(M,Ad,M) and ARIMA(2,1,1)(0,1,0)[12], because AirPassengers' growing seasonal swing only a multiplicative model can reach directly.

Their AICc values, 1400.638 against 1018.17, looked like a landslide but weren't comparable at all: the sample sizes differed after differencing, and so did the likelihood forms. The honest test was rolling-origin cross-validation, forecasting real held-out months and scoring against what actually happened, and on AirPassengers that settled the question in ARIMA's favor, MASE 0.627 against 0.770, RMSSE 0.659 against 0.884.

Match the series to the rules of thumb first, additive or multiplicative season, short or long history, how many differences it needs. When that doesn't settle it, cross-validate. Never compare AICc across the two families.

Next, we'll open up ARIMA's own automatic search and see exactly what it tries before it settles on an order.
