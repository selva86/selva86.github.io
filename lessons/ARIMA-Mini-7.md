---
title: "ARIMA from Zero Lesson 7: Auto.arima: how it works and when to override it"
slug: "ARIMA-Mini-7"
description: "Auto.arima is not magic, it is a search. Follow every candidate it tries on a real server series, find the better model it skipped, and when to overrule it."
keywords: "auto.arima in R, how auto.arima works, auto.arima trace, auto.arima stepwise, override auto.arima, ARIMA model selection, AICc, forecast package R, Box-Cox lambda"
mathjax: true
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "7"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-6"
course_next: ""
curriculum_id: "0.0.46"
lesson_access: "windowed"
catalog_blurb: "How the automatic ARIMA search picks a model, and when to overrule it."
---

=== step === cover
::eyebrow ARIMA from Zero
## Auto.arima: how it works and when to override it

If you have ever forecast anything in R, you have probably typed `auto.arima()` and taken whatever came back. Most of us never look inside.

Here is the series we are going to hand it. A server has been logging how many users are connected, one reading every minute, for a hundred minutes. Feed that to `auto.arima()` and back comes `ARIMA(1,1,1)`.

Is that the right model? You cannot say yet, because you do not know how it got there.

The function is not magic. It is a search, and the search makes three moves.

::widget process-flow {"steps":[{"title":"Settle the differencing","sub":"a test picks d before any model is fitted"},{"title":"Try candidate models","sub":"walk from four starting orders to their neighbours"},{"title":"Keep the best score","sub":"the lowest AICc wins and the walk stops"}]}

Today we take that `ARIMA(1,1,1)` apart, watch every candidate the search tried, find the better model it never looked at, and practise one override you can defend.

=== step === concept
## What auto.arima printed, and where each part came from

Let's get the numbers on the table first, because everything that follows comes out of them.

`WWWusage` ships with R. It holds a hundred readings taken one minute apart, and each reading is the number of users connected to a server at that moment.

Press Run and you will see the first twelve readings, then the model the search settles on.

```r
# Fit an ARIMA model to the server traffic series without naming any orders
library(forecast)

head(WWWusage, 12)
#> Time Series:
#> Start = 1
#> End = 12
#> Frequency = 1
#>  [1] 88 84 85 85 84 85 83 85 88 89 91 99

fit <- auto.arima(WWWusage)
fit
#> Series: WWWusage
#> ARIMA(1,1,1)
#>
#> Coefficients:
#>          ar1     ma1
#>       0.6504  0.5256
#> s.e.  0.0842  0.0896
#>
#> sigma^2 = 9.995:  log likelihood = -254.15
#> AIC=514.3   AICc=514.55   BIC=522.08
```

That label, `ARIMA(1,1,1)`, looks like one decision. It is three, and they were made by three different pieces of machinery.

- The middle number, `d = 1`, is the number of times the series was differenced. A statistical test chose it, and the test ran before a single model was fitted.
- The outer two, `p = 1` and `q = 1`, are the autoregressive and moving average orders. A search over candidate models chose those.
- The coefficients underneath, `ar1` at 0.6504 and `ma1` at 0.5256, were estimated by fitting that one winning model to the data.

So when somebody asks why the model came out this way, there are three separate answers. Let's take them in the order the function does.

=== step === concept
## Where the d comes from: a test, not the search

The middle number never entered the search at all.

A series gets differenced when its level wanders instead of staying put. To decide how much wandering there is, `auto.arima()` runs a KPSS test, which asks one question: is this series stationary around a fixed level?

If the answer is no, the series is differenced once and the test runs again on the difference. It keeps going until the test stops objecting, and the number of differences it needed becomes `d`.

The function `ndiffs()` is that same routine on its own, so you can see the answer without fitting anything.

```r
# Ask how many differences the series needs, then look at it before and after
ndiffs(WWWusage)
#> [1] 1

par(mfrow = c(1, 2))
plot(WWWusage, ylab = "users connected", main = "The series as logged")
plot(diff(WWWusage), ylab = "change in users", main = "After one difference")
par(mfrow = c(1, 1))
```

Look at the left panel. The series starts in the eighties, climbs to 175, falls all the way back to the eighties, then climbs again to 228. There is no level it keeps returning to, which is exactly what the test is set up to detect.

The right panel is the minute-to-minute change, and it sits around zero the whole way, inside a band of roughly plus or minus fourteen users. One difference was enough.

[NOTE]
Because `d` is settled before the search starts, the search never revisits it. If you disagree with the differencing, no amount of searching will correct it. You have to say so yourself.

=== step === quiz
## Quick check: which number did a test choose?

The model on the page reads `ARIMA(1,1,1)`. One of those three numbers was decided before the search began. Which one, and what decided it?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- All three came out of the same search over candidate models. ::no
- The middle number, d = 1. A KPSS test fixed it before any model was fitted. ::ok That is it. The test differences the series until it stops wandering, and the count it lands on becomes d. The search inherits that number and works around it.
- The last number, q = 1, because the moving average term is the one that handles a wandering level. ::no
- None of them. The coefficients are estimated first, and d falls out of them. ::no Only the middle number came from a test. The outer two were chosen by a search over candidate models, and the coefficients were estimated last, after the winning model had already been picked. The order matters: differencing is settled first and never reopened.

=== step === concept
## What the search is scoring, and why it is AICc

Once `d` is settled, the search has to compare models, and comparing needs one number per model.

An information criterion gives it one. It takes the log likelihood, which measures how well the model reproduces the data, then charges a fee for every parameter the model spends. A model that fits better earns a lower score, and a model with more coefficients pays more for the privilege.

\[ \text{AIC} = -2 \log L + 2k \]

Here \(L\) is the likelihood of the fitted model and \(k\) is the number of estimated parameters, counting the coefficients and the error variance. Lower is better.

AIC turns out to be a little too generous when the data is short relative to the number of parameters, so `auto.arima()` uses the corrected version, AICc, which adds a penalty that grows as \(k\) approaches \(n\).

\[ \text{AICc} = \text{AIC} + \frac{2k(k+1)}{n - k - 1} \]

Both scores are already sitting inside the fitted model, along with the \(n\) and \(k\) they were built from.

```r
# Read the scores the fitted model carries, and the two counts behind them
c(AIC = fit$aic, AICc = fit$aicc, BIC = fit$bic)
#>      AIC     AICc      BIC
#> 514.2995 514.5521 522.0848

c(observations = fit$nobs, parameters = length(coef(fit)) + 1)
#> observations   parameters
#>           99            3
```

You can work the correction by hand from those two counts. There are 3 parameters, the `ar1` and `ma1` coefficients plus the error variance, and 99 observations, because differencing costs you the first reading of the hundred. So the correction is 2 times 3 times 4, divided by 99 minus 3 minus 1, which is 24 over 95, or 0.25. Add that to the AIC of 514.30 and you land on 514.55, the AICc printed above.

Two things about this score are worth holding on to.

Lower wins, and a gap of less than about 2 is not much of a gap, so two models that close are effectively tied.

And AICc only ever ranks models fitted to the same numbers. It says nothing about whether a model is any good on its own, which is going to matter a great deal once we start changing what the model is fitted to.

=== step === concept
## How the search walks, and the 18 models it tried

Now the search itself. With `d` fixed at 1, two numbers are still free, and you might reasonably expect the function to fit every combination up to some limit and keep the winner. By default it does not. It walks.

One word turns up in nearly every line of what follows, so let's have it now. A drift term is a constant the model adds at every step, which lets the forecast go on climbing or falling at a steady rate instead of levelling off. To the search it is simply one more thing to switch on or off, like an order to nudge.

Four rules describe the whole walk.

1. Fit four starting models: `ARIMA(2,1,2)`, `ARIMA(0,1,0)`, `ARIMA(1,1,0)` and `ARIMA(0,1,1)`, each with a drift term, plus the plain `ARIMA(0,1,0)` with drift turned off.
2. Take whichever of them scored lowest and fit only its close neighbours: nudge `p` by one, nudge `q` by one, nudge both, or flip the drift term on or off.
3. If a neighbour scores lower, move there and start again from the new model.
4. When no neighbour scores lower, stop. That model is the answer.

The argument `trace = TRUE` prints every candidate as it is fitted, with the score it earned. This is the search out loud.

```r
# Print every candidate model the search fits, with the AICc it earned
trace_fit <- auto.arima(WWWusage, trace = TRUE)
#>
#>  ARIMA(2,1,2) with drift         : 519.4483
#>  ARIMA(0,1,0) with drift         : 627.7442
#>  ARIMA(1,1,0) with drift         : 531.1079
#>  ARIMA(0,1,1) with drift         : 548.4164
#>  ARIMA(0,1,0)                    : 631.0362
#>  ARIMA(1,1,2) with drift         : 518.2245
#>  ARIMA(0,1,2) with drift         : 520.4047
#>  ARIMA(1,1,1) with drift         : 516.0048
#>  ARIMA(2,1,1) with drift         : 518.2245
#>  ARIMA(2,1,0) with drift         : 523.7396
#>  ARIMA(1,1,1)                    : 514.5521
#>  ARIMA(0,1,1)                    : 549.9305
#>  ARIMA(1,1,0)                    : 529.3628
#>  ARIMA(2,1,1)                    : 516.717
#>  ARIMA(1,1,2)                    : 516.6774
#>  ARIMA(0,1,2)                    : 520.1275
#>  ARIMA(2,1,0)                    : 522.4308
#>  ARIMA(2,1,2)                    : 518.0056
#>
#>  Best model: ARIMA(1,1,1)
```

Read it from the top and the whole path is there.

The first five lines are the starting set, and `ARIMA(2,1,2)` with drift wins them at 519.45. The sixth line tries a neighbour of it, `ARIMA(1,1,2)` with drift, and gets 518.22, so the search moves there. The next two lines are neighbours of that one, and `ARIMA(1,1,1)` with drift comes in at 516.00, lower again, so it moves again.

Lines nine and ten check two more neighbours and find nothing better. Line eleven flips the drift off and gets 514.5521, the lowest so far, so the search moves one last time to plain `ARIMA(1,1,1)`.

That leaves lines twelve to eighteen, which are the seven remaining neighbours of `ARIMA(1,1,1)`. The best of them is `ARIMA(1,1,2)` at 516.68. Not one of them beats 514.55, so the walk has nowhere lower to go and it stops.

Eighteen fits in all, and the last seven only proved there was no way downhill from where it already stood.

[KEY INSIGHT]
The search never scores the whole grid. It follows a downhill path from a handful of starting points and halts as soon as every immediate neighbour is worse. What comes back is the best model it walked past, which is not the same thing as the best model that exists.

=== step === quiz
## Quick check: why did the search stop at ARIMA(1,1,1)?

Eighteen models were fitted and `ARIMA(1,1,1)` came out on top. What does the trace actually show about why the search stopped there?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It fitted every combination of p and q allowed by its limits, and ARIMA(1,1,1) beat all of them. ::no
- It used up a budget of eighteen fits and returned the best model it had by then. ::no
- Every model next door to ARIMA(1,1,1) scored higher, so the walk had nowhere lower to move. ::ok Exactly. Stopping means the neighbours are worse, not that the grid is exhausted. Anything more than one nudge off the path was never fitted at all.
- Its AICc of 514.55 fell below a fixed threshold that counts as a good enough fit. ::no The walk halts on a local best. Every model it fitted was either a starting model or one nudge away from the model it was standing on, and the last seven fits exist only to confirm that nothing next door was better. There is a ceiling on how many models it may try, 94 of them by default, but at eighteen fits the walk stopped nowhere near it. And there is no absolute score to clear either, because AICc has no meaningful zero.

=== step === concept
## The better model the walk never looked at

Two arguments turn the shortcuts off.

`stepwise = FALSE` replaces the walk with the full grid, so every allowed combination of orders gets fitted and scored. `approximation = FALSE` scores each candidate with the exact likelihood rather than a fast estimate.

On a series this short the approximation is already off by default, so here it is `stepwise = FALSE` doing the work on its own. The approximation switches itself on once a series runs past 150 readings, or is recorded more often than once a month, and on a series like that both shortcuts are worth turning off.

Let's run the full search on the same hundred readings and see what it finds.

```r
# Search the full grid with exact likelihoods instead of the default shortcuts
fit_full <- auto.arima(WWWusage, stepwise = FALSE, approximation = FALSE)
fit_full
#> Series: WWWusage
#> ARIMA(3,1,0)
#>
#> Coefficients:
#>          ar1      ar2     ar3
#>       1.1513  -0.6612  0.3407
#> s.e.  0.0950   0.1353  0.0941
#>
#> sigma^2 = 9.656:  log likelihood = -252
#> AIC=511.99   AICc=512.42   BIC=522.37

c(default = fit$aicc, full_search = fit_full$aicc)
#>     default full_search
#>    514.5521    512.4195
```

`ARIMA(3,1,0)`, at 512.42 against the default's 514.55. Now go back through the eighteen lines the walk printed and look for it.

It is not there. `ARIMA(2,1,0)` was fitted, at 522.43, but it never became the best model, so the walk never expanded it. And `ARIMA(3,1,0)` sits one nudge past `ARIMA(2,1,0)`, which puts the better model two moves off the path. Two moves off the path is the same as invisible.

Once you know the orders you want, you can fit them by name and skip the searching altogether.

```r
# Refit that winning model by naming its orders yourself
fit_by_hand <- Arima(WWWusage, order = c(3, 1, 0))
fit_by_hand$aicc
#> [1] 512.4195
```

Note the capital A. `Arima()` fits exactly the orders you hand it and searches for nothing. It is the tool behind every override worth making: when you disagree with the search, you stop asking it and you tell it.

[NOTE]
The full search costs real time, because it fits dozens of models instead of eighteen. On one series that is a second or two. On ten thousand series it is the difference between a job that finishes overnight and one that does not, which is precisely why the walk is the default.

=== step === tryit
## Your turn: score the orders the walk skipped

The walk fitted `ARIMA(1,1,0)` and `ARIMA(2,1,0)` and then left that whole column alone. Fit `ARIMA(p,1,0)` yourself for `p` equal to 1, 2, 3 and 4, and print the AICc of each one.

```r
# Fit ARIMA(p,1,0) for p = 1 to 4 and collect the AICc of each.
# Arima(WWWusage, order = c(p, 1, 0)) fits one of them, and the
# score you want is the $aicc element of the result.
# Two lines is enough. Press Check when you have it.
```
::check {"regex": "Arima[(][\\s\\S]*aicc", "gate": true, "difficulty": "intermediate", "ok": "Right: 529.36, 522.43, 512.42 and 514.57. The two the walk saw were the two worst of the four, and the best one in the column sat a single nudge past where it stopped.", "no": "Loop over the four values and pull the score out of each fit: sapply(1:4, function(p) Arima(WWWusage, order = c(p, 1, 0))$aicc), then wrap that in a data.frame so you can read it."}
::solution
```r
# Fit ARIMA(p,1,0) for p = 1 to 4 and put the four scores in a table
aicc_scores <- sapply(1:4, function(p) Arima(WWWusage, order = c(p, 1, 0))$aicc)

data.frame(p = 1:4, AICc = round(aicc_scores, 2))
#>   p   AICc
#> 1 1 529.36
#> 2 2 522.43
#> 3 3 512.42
#> 4 4 514.57
```

The score falls all the way to `p = 3` and then turns back up. The walk stopped reading at `p = 2`, one row short of the bottom.

=== step === concept
## Seasonal data that came back with no seasonal terms

That is the search working as designed. Now let's look at the symptoms worth catching, starting with the one you will meet most often: a monthly series that comes back with no seasonal terms at all.

The cause fits in one sentence. The search can only fit seasonal terms if the series tells it how long a season is.

`AirPassengers` is 144 monthly counts of international airline passengers, in thousands, from 1949 through 1960. Let's fit those same 144 numbers twice, once stripped of their calendar and once with it.

```r
# Fit the same monthly numbers twice: once as plain numbers, once as monthly data
air_flat <- ts(as.numeric(AirPassengers))

c(flat = frequency(air_flat), monthly = frequency(AirPassengers))
#>    flat monthly
#>       1      12

auto.arima(air_flat)
#> Series: air_flat
#> ARIMA(4,1,2) with drift
#>
#> Coefficients:
#>          ar1     ar2      ar3      ar4      ma1      ma2   drift
#>       0.2243  0.3689  -0.2567  -0.2391  -0.0971  -0.8519  2.6809
#> s.e.  0.1047  0.1147   0.0985   0.0919   0.0866   0.0877  0.1711
#>
#> sigma^2 = 706.3:  log likelihood = -670.07
#> AIC=1356.15   AICc=1357.22   BIC=1379.85

auto.arima(AirPassengers)
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

Both calls got the identical 144 numbers in the identical order. The only difference is that `air_flat` was built with `ts()` and no `frequency` argument, so its frequency is 1 and nothing in the object records that the readings are monthly.

Look at what that costs. The first fit came back `ARIMA(4,1,2) with drift`, seven parameters spent trying to reproduce a yearly cycle one month at a time, at an AICc of 1357.22.

The second came back `ARIMA(2,1,1)(0,1,0)[12]`. That second bracket is the seasonal part and the `[12]` is the season length, and it did the job with three parameters at 1018.17.

The fix is to rebuild the series with its calendar attached.

```r
# Rebuild the same numbers as a monthly series starting in January 1949
air_fixed <- ts(as.numeric(AirPassengers), frequency = 12, start = c(1949, 1))

frequency(air_fixed)
#> [1] 12
```

A column of numbers read out of a spreadsheet starts life at frequency 1 unless you say otherwise, which is how this happens to people. So when a monthly or quarterly series comes back with no second bracket, check `frequency()` before you change anything else.

=== step === quiz
## Quick check: a monthly series with no seasonal terms

You fit a monthly series of store visits and get back `ARIMA(3,1,2) with drift`. There is no seasonal bracket, even though the December spike is plain in the data. What do you check first?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Difference the series a second time, since one difference clearly did not remove the yearly pattern. ::no
- Run frequency() on the series. If it reads 1, the series never told the search that a season is twelve months long. ::ok Yes. A series built from a bare vector has frequency 1, and with no season length there are no seasonal terms to fit. Rebuild it with ts(x, frequency = 12) and refit.
- Force the seasonal part on by refitting with seasonal = TRUE. ::no
- Raise the seasonal order limits so the search is allowed to reach further. ::no Nothing about the search is broken here, so nothing about the search is worth changing. Extra differencing, a seasonal switch and higher order limits all assume the function knows the readings are monthly. It only knows that if frequency() says so.

=== step === concept
## When the swings grow with the level

The second symptom is one you can spot before you fit anything: swings that get bigger as the series climbs.

ARIMA assumes the wobble stays roughly one size from start to finish. When the airline series doubles, its yearly swings double too, and the model ends up splitting the difference between small early wobbles and large late ones.

A Box-Cox transform evens that out. It replaces each value \(y\) with \((y^\lambda - 1) / \lambda\), or with \(\log y\) when \(\lambda\) is 0, and \(\lambda\) is picked so the swings come out the same size all the way along. Setting `lambda = "auto"` lets the function estimate it from the series.

```r
# Plot the airline series, then fit it with and without a variance transform
plot(AirPassengers, ylab = "passengers (thousands)",
     main = "Monthly airline passengers, 1949 to 1960")

fit_air    <- auto.arima(AirPassengers)
fit_air_bc <- auto.arima(AirPassengers, lambda = "auto")

cat("default    :", as.character(fit_air), "\n")
cat("transformed:", as.character(fit_air_bc), "\n")
cat("lambda     :", round(fit_air_bc$lambda, 3), "\n")
#> default    : ARIMA(2,1,1)(0,1,0)[12]
#> transformed: ARIMA(0,1,1)(0,1,1)[12]
#> lambda     : -0.295

c(default = fit_air$aicc, transformed = fit_air_bc$aicc)
#>     default transformed
#>   1018.1652   -896.9901
```

The plot shows the widening plainly. In the early years the yearly cycle lifts the series twenty or thirty thousand passengers above its level for that year and drops it about as far below. By the end of the run the same shaped cycle is swinging it more than a hundred either way.

The transform changed the model the search landed on, and not by a little. The seasonal bracket went from `(0,1,0)` to `(0,1,1)`, which says the transformed series was regular enough for a seasonal moving average term to earn its keep.

Then look at the two scores. 1018.17 against -896.99 reads like the transformed model wins by a mile.

Except it is not a comparison you are allowed to make. AICc is computed from the likelihood of the numbers the model was actually fitted to, and the second model was fitted to Box-Cox transformed values on a completely different scale.

[WARNING]
Two AICc values can be ranked only when both models were fitted to the same numbers. A Box-Cox transform changes the numbers, so it voids the comparison. So does changing `d`, which changes how many numbers there are.

=== step === concept
## The only test that settles it: hold back the last two years

If the score cannot tell you whether the transform helped, something else has to. That something is months neither model has seen.

Fit both on the data through the end of 1958, forecast the 24 months of 1959 and 1960, and compare the two forecasts against what actually happened. The function `accuracy()` does the comparing.

```r
# Fit both models on data through 1958 and score them on the two years held back
air_train <- window(AirPassengers, end = c(1958, 12))
air_test  <- window(AirPassengers, start = c(1959, 1))

fc_air    <- forecast(auto.arima(air_train), h = 24)
fc_air_bc <- forecast(auto.arima(air_train, lambda = "auto"), h = 24)

round(accuracy(fc_air, air_test), 2)
#>                 ME  RMSE   MAE   MPE  MAPE MASE ACF1 Theil's U
#> Training set -0.02  9.57  7.12 -0.03  2.90 0.25 0.01        NA
#> Test set     68.58 74.25 68.58 14.93 14.93 2.40 0.72      1.46

round(c(default     = accuracy(fc_air,    air_test)["Test set", "RMSE"],
        transformed = accuracy(fc_air_bc, air_test)["Test set", "RMSE"]), 2)
#>     default transformed
#>       74.25       32.25
```

The `accuracy()` output has two rows and they mean different things. The training row is the error on the 120 months the model was fitted to, where a good fit is expected and proves nothing. The test row is the error on the 24 months the model never saw, and that is the row that decides.

Read across the test row of the default fit. RMSE is 74.25, the typical size of a miss in thousands of passengers. ME is 68.58, and because ME keeps its sign, a large positive value says the model was under-forecasting almost every month rather than missing in both directions.

Now the pair at the bottom. The default model misses by 74.25 on average and the transformed one by 32.25, so the transform cuts the error to well under half. It earned its place, and it earned it on evidence the AICc pair could never have given you.

[KEY INSIGHT]
When two models are fitted to the same numbers, AICc ranks them. When they are not, hold data back and compare the forecasts on it. That is the only comparison that survives a change of scale or a change of `d`.

=== step === concept
## So when should you override, and what does a guess cost?

Overriding is not something you do because a model looks odd. It is something you do for a reason you can say out loud. Four of them earn their place.

| The situation | What you do | Why the search cannot do it for you |
|---|---|---|
| No seasonal bracket on data you know is seasonal | Rebuild the series with `ts(x, frequency = 12)` and refit | The season length is read off the series and never questioned |
| The swings widen as the level climbs | Refit with `lambda = "auto"` | Nothing in the score penalises swings that change size |
| One series matters enough to be worth the compute | Refit with `stepwise = FALSE, approximation = FALSE` | The walk stops at a local best by design |
| A holdout test says another order forecasts better | Fit that order by name with `Arima(x, order = c(p, d, q))` | AICc scores the fit on data the model saw, never the forecast on data it did not |

Every row names a reason. Now here is an override with no reason behind it. Suppose a model without differencing simply feels tidier, so you force `d = 0` on the server series and move on.

```r
# Force the differencing to zero and compare the forecast with the default
fit_d0 <- auto.arima(WWWusage, d = 0)
fit_d0
#> Series: WWWusage
#> ARIMA(2,0,2) with non-zero mean
#>
#> Coefficients:
#>          ar1      ar2     ma1      ma2      mean
#>       1.9280  -0.9451  0.0232  -0.4522  138.0786
#> s.e.  0.0704   0.0698  0.1831   0.1729   10.2090
#>
#> sigma^2 = 9.762:  log likelihood = -256.78
#> AIC=525.57   AICc=526.47   BIC=541.2

fc_www    <- forecast(fit, h = 60)
fc_www_d0 <- forecast(fit_d0, h = 60)

par(mfrow = c(1, 2))
plot(fc_www,    main = "Default: ARIMA(1,1,1)")
plot(fc_www_d0, main = "Forced d = 0: ARIMA(2,0,2)")
par(mfrow = c(1, 1))

round(c(default = fc_www$mean[20], forced_d0 = fc_www_d0$mean[20]), 1)
#>   default forced_d0
#>     216.8      95.4
```

The series ends at 220 users. Twenty minutes out, the default model still forecasts 216.8 and the forced one forecasts 95.4, less than half the traffic.

The reason is printed right there in the fit. With `d = 0` the model has to be stationary around a fixed level, and it estimated that level at 138.08 users, close to the average of the whole hundred minutes.

A stationary model's forecast has to come back to its own mean. So from 220 it turns and heads for 138, and the two autoregressive terms make it swing past and settle from the other side. The right panel shows the whole journey.

Now compare the two AICc values, 514.55 for the default and 526.47 for the forced fit.

```r
# Line up the two scores that look comparable and are not
c(default = fit$aicc, forced_d0 = fit_d0$aicc)
#>   default forced_d0
#>  514.5521  526.4718
```

The default is lower, so the score happens to point the right way. That is luck, not evidence. One model was fitted to 99 differences and the other to 100 raw readings, so the two likelihoods came from different data and there is no shared yardstick between them. Had the forced fit come back with the lower number, it would have meant nothing at all.

[WARNING]
An override you cannot give a reason for is a guess, and the score will not catch it. The moment you change `d` or apply a transform, AICc stops being a referee, and only a forecast on held-out data can tell you what the change did.

=== step === quiz
## Quick check: AICc 1018 against AICc -897

The airline series scored 1018.17 fitted as it came and -896.99 fitted with `lambda = "auto"`. Which reading of that pair is right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The transformed model scores far lower, so it is far better by a wide margin. ::no
- A gap that size cannot be real, so one of the two fits must have failed. ::no
- The two scores were computed from different numbers, so this pair says nothing about which model is better. ::ok Exactly right. The transform rescales the series, the likelihood is computed on the rescaled values, and a score built from different data is not on the same axis. The holdout forecast is what settled it.
- AICc cannot be negative, so -896.99 has to be a bug. ::no A negative AICc is perfectly ordinary, because the log likelihood of small numbers can be large and positive. The real problem is the comparison itself. One score came from raw passenger counts and the other from Box-Cox transformed values, and two likelihoods computed on different data cannot be ranked against each other, whichever way they happen to fall.

=== step === tryit
## Your turn: does a transform earn its place here?

The airline series needed a transform. That does not mean every series does, so the only way to know is to test it.

`USAccDeaths` ships with R and holds 72 monthly counts of accidental deaths in the United States, from 1973 through 1978, with a clear yearly cycle. Run the same holdout comparison on it: train both models on everything through the end of 1977, forecast the twelve months of 1978, and compare their test-set RMSE.

```r
# Cut USAccDeaths at the end of 1977 with window(), fit auto.arima()
# twice on the training piece (plain, then with lambda = "auto"),
# forecast 12 months ahead, and read the Test set RMSE out of accuracy().
# Press Check when you have it.
```
::check {"regex": "accuracy[(][\\s\\S]*RMSE", "gate": true, "difficulty": "intermediate", "ok": "There it is: 288.83 without the transform and 294.36 with it. The transform makes this one slightly worse, which is the whole point. You test it on held-out months, you do not assume it.", "no": "Cut the series with window(USAccDeaths, end = c(1977, 12)) and window(USAccDeaths, start = c(1978, 1)), fit both models on the training piece, forecast 12 months, then pull the Test set RMSE row out of accuracy(fc, deaths_test)."}
::solution
```r
# Train both models on data through 1977 and compare their error on 1978
deaths_train <- window(USAccDeaths, end = c(1977, 12))
deaths_test  <- window(USAccDeaths, start = c(1978, 1))

fit_plain  <- auto.arima(deaths_train)
fit_boxcox <- auto.arima(deaths_train, lambda = "auto")

cat("default    :", as.character(fit_plain), "\n")
cat("transformed:", as.character(fit_boxcox), "\n")
#> default    : ARIMA(0,1,1)(0,1,1)[12]
#> transformed: ARIMA(0,1,1)(0,1,1)[12]

round(c(default     = accuracy(forecast(fit_plain,  h = 12), deaths_test)["Test set", "RMSE"],
        transformed = accuracy(forecast(fit_boxcox, h = 12), deaths_test)["Test set", "RMSE"]), 2)
#>     default transformed
#>      288.83      294.36
```

Both searches landed on exactly the same orders, so the transform was the only difference between the two forecasts, and it cost about five and a half units of RMSE. This series already swings by about the same amount every year, so there was nothing for the transform to even out.

=== step === quiz
## Quick check: which two arguments turn the shortcuts off?

You have one series that matters more than the rest, and you want the search to score every model rather than walk to the nearest good one. Which pair do you pass?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- `ic = "bic", allowdrift = FALSE` ::no
- `lambda = "auto", biasadj = TRUE` ::no
- `stepwise = FALSE, approximation = FALSE` ::ok That is the pair. The first replaces the walk with the full grid and the second scores every candidate with the exact likelihood instead of a fast estimate. It is slower on purpose, which is why it is not the default.
- `max.p = 10, max.q = 10` ::no Only one pair changes how the search moves. Switching the criterion, adding a transform or raising the order limits all leave the walk exactly as it was: it still starts from four models, still moves only to a neighbour, and still stops the moment nothing next door is better. A wider grid it never visits does not help.

=== step === concept
## References

- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The paper that defines the stepwise search, its four starting models and the neighbour rule traced here.
- [Forecasting: Principles and Practice, Section 9.7, ARIMA modelling in R](https://otexts.com/fpp3/arima-r.html) - Hyndman and Athanasopoulos (3rd ed). The reference walkthrough of what the function does on every call.
- [Forecasting: Principles and Practice, Section 9.1, Stationarity and differencing](https://otexts.com/fpp3/stationarity.html) - Hyndman and Athanasopoulos (3rd ed). Where `d` comes from, and why a test rather than a search decides it.
- [Regression and time series model selection in small samples](https://doi.org/10.1093/biomet/76.2.297) - Hurvich and Tsai (1989), Biometrika 76(2), 297-307. The small-sample correction that makes the default score AICc rather than AIC.
- [The auto.arima() reference page](https://pkg.robjhyndman.com/forecast/reference/auto.arima.html) - the forecast package documentation, with every argument named here and its default.

=== step === complete
## Quick recap

You opened the box. `auto.arima()` runs a KPSS test to settle `d`, then walks from four starting models to their neighbours, scoring each one with AICc, and stops the moment nothing next door is lower. Everything it returns follows from those three moves.

- The three numbers in `ARIMA(1,1,1)` have three different sources: a test chose `d`, a search chose `p` and `q`, and fitting chose the coefficients.
- The walk is a local search. It fitted 18 models on the server series and never reached `ARIMA(3,1,0)`, which scores 512.42 against the default's 514.55.
- `stepwise = FALSE, approximation = FALSE` searches the full grid, and `Arima(x, order = c(p, d, q))` fits an order you name yourself.
- A monthly series with no seasonal bracket is almost always a `frequency()` problem, not a modelling one.
- AICc ranks models only when they were fitted to the same numbers. Change `d` or add a transform and the scores stop being comparable.
- Held-out data settles what the score cannot. The transform cut the airline error from 74.25 to 32.25 and made the accidental-death forecast slightly worse, and only the holdout could tell those two apart.

So when somebody asks whether you trust the model the function handed you, you have a real answer:

"It ran a test to pick the differencing, then walked to the best model in its own neighbourhood. I checked the frequency, I checked the swings, and I compared it against my own orders on months it had never seen."

You can read that print-out now, question it, and overrule it when you have a reason you can say out loud. That is a good deal more than most people ever ask of the function. Enjoy the forecasting.
