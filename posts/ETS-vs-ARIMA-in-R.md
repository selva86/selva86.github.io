---
title: "ETS vs ARIMA in R: Which Forecasting Model Should You Use?"
slug: "ETS-vs-ARIMA-in-R"
description: "ETS vs ARIMA in R, settled on real data: what each family models, where they overlap exactly, why the default comparison is rigged, and how to run a fair test."
keywords: "ETS vs ARIMA in R, ARIMA or ETS, exponential smoothing vs ARIMA, auto.arima vs ets, forecasting model comparison R, tsCV R, ETS ARIMA equivalence, AICc model families"
auto_link_terms: "ETS versus ARIMA|ARIMA vs ETS|ARIMA versus ETS|compare ETS and ARIMA|ETS and ARIMA|exponential smoothing versus ARIMA|ARIMA equivalent|ARIMA twin|linear ETS models|comparing model families|AICc across families|rolling origin cross-validation|multiplicative seasonality|which forecasting family"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "FR-ets-2"
post_type: "FR"
fr_parent: "ETS-Models-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">ETS and ARIMA are the two workhorse families of statistical forecasting, and the honest answer to "which should I use?" is that neither wins everywhere, so you have to test. What makes that harder than it sounds is that the obvious test is rigged: comparing <code>ets()</code> against <code>auto.arima()</code> on their defaults compares two different amounts of help, not two families. This post fits both to one real series, shows exactly where the two families overlap (a large shared middle, which surprises most people), shows where each one wins outright, and ends with the backtest that settles it. Along the way the post's own opening answer gets overturned.</p>

## Which model wins on the airline data?

Our series for most of this post is the airline data that ships with R: `AirPassengers`, 144 monthly counts of international airline passengers in thousands, from January 1949 through December 1960. It trends upward and it repeats every 12 months, and the size of its seasonal swing grows as the airline grows, which makes it a fair fight for both families.

We will train both models on the first 120 months (through the end of 1958) and hold back the last 24 months (1959 and 1960) as an exam neither model gets to see. That split has to respect time: you always train on the past and test on the future, never on a random sample of rows, because a model that has seen 1960 while predicting 1959 has been handed the answer.

`ets()` searches the ETS family and keeps the model that fits best. `auto.arima()` does the same for the ARIMA family. Both are one line, and both pick their own model, so this is the comparison almost everybody actually runs.

```r title="Both families, same series, same exam"
suppressMessages(library(forecast))

air   <- AirPassengers
train <- window(air, end = c(1958, 12))    # 120 months the models may learn from
test  <- window(air, start = c(1959, 1))   # 24 months held back as the exam

fit_ets   <- ets(train)         # searches the ETS family, keeps its best
fit_arima <- auto.arima(train)  # searches the ARIMA family, keeps its best

fc_ets   <- forecast(fit_ets,   h = 24)    # predict the 24 held-back months
fc_arima <- forecast(fit_arima, h = 24)

# RMSE on the held-back months: average error, in thousands of passengers
round(accuracy(fc_ets,   test)["Test set", "RMSE"], 2)
#> [1] 72.55
round(accuracy(fc_arima, test)["Test set", "RMSE"], 2)
#> [1] 74.25
```

Read the last two numbers carefully, because they are the reason this post exists. RMSE is the root mean squared error: take each month's forecast, subtract what actually happened, square it, average over the 24 months, take the square root. It is in the same units as the data, so ETS was off by about 72,550 passengers per month on average and ARIMA by about 74,250. Lower is better, so ETS won by roughly 2%.

That is a real number honestly computed, and it is very close to worthless as an answer to the title's question. Two percent on one arbitrary split is noise. Worse, as the rest of this post shows, that comparison was not measuring what it appears to measure. By the last section we will run the same contest properly and ARIMA will win it, on this same series, by a much wider margin than 2%.

First, though, we need to know what these two things actually are.

## What is each family actually modelling?

Both models just produced numbers for the same 24 months, but they got there by thinking about the series in genuinely different ways. This is the one idea that makes everything else in the post make sense, so it is worth going slowly.

**ETS names the moving parts.** ETS stands for Error, Trend, Seasonal. It assumes your series is literally built out of those named components, and it keeps a running estimate of each one, updating them every month as new data arrives. The three letters in a model name say whether each component is absent (`N`), added on (`A`), or multiplied in (`M`). Our fit picked `ETS(M,Ad,M)`: multiplicative error, additive damped trend, multiplicative season. Let us look at the knobs it learned.

```r title="What ETS learned: one weight per component"
# alpha = level, beta = trend, gamma = season, phi = trend damping
round(fit_ets$par[c("alpha", "beta", "gamma", "phi")], 4)
#>  alpha   beta  gamma    phi
#> 0.7459 0.0189 0.0003 0.9793
```

Each of those is a smoothing weight between 0 and 1 that answers "when this month's data disagrees with my current estimate of this component, how far do I move?" Alpha is 0.7459, so the level chases recent data hard: each month the running level jumps about three quarters of the way toward the newest observation. Beta is 0.0189 and gamma is 0.0003, both nearly zero, which says the trend and the seasonal pattern are treated as almost fixed. The airline's December-is-busy pattern was stable across twelve years, so ETS learned to barely update it. Phi is 0.9793, a damping factor slightly below 1, which gently flattens the trend as the forecast reaches further out so growth is not extrapolated forever.

Those components are not an abstraction. ETS stores them, and you can read them off directly:

```r title="The components ETS is actually carrying"
# l = the level, b = the slope, for the last three months of training
tail(round(fit_ets$states[, c("l", "b")], 2), 3)
#>               l    b
#> Oct 1958 390.97 1.31
#> Nov 1958 390.00 1.22
#> Dec 1958 379.39 0.90
```

At the end of 1958 the model believed the airline's underlying level was about 379,000 passengers a month and growing by about 900 a month, with the seasonal pattern applied on top. That is a sentence you can say out loud to a manager, which is a real part of why people like ETS.

**ARIMA subtracts the structure, then models what is left.** ARIMA does not name a trend or a season. Instead it removes them by subtraction, a step called differencing, and then models whatever correlation survives. Differencing at lag 12 means replacing each month with the difference between it and the same month a year earlier, which cancels a repeating annual pattern. Differencing again at lag 1 removes what is left of the trend. Watch what that does.

```r title="What ARIMA does first: difference until the structure is gone"
d_season <- diff(train, lag = 12)   # this month minus the same month last year
d_both   <- diff(d_season)          # then remove what is left of the trend

# Differencing costs you observations: each one eats its own lag
c(original = length(train), after_both = length(d_both))
#>   original after_both
#>        120        107

# And it collapses the variation, because the trend and season are now gone
round(c(sd_original = sd(train), sd_differenced = sd(d_both)), 2)
#>    sd_original sd_differenced
#>          94.94          10.49
```

The standard deviation fell from 94.94 to 10.49. Almost all the movement in the airline data was trend and season, and differencing subtracted it away, leaving a flat, choppy series that hovers around zero. That leftover series is what ARIMA models, using AR terms (this month relates to previous months) and MA terms (this month relates to previous months' forecast errors).

Notice the other number in that output, because it comes back to bite in a later section: differencing threw away 13 of the 120 observations. ARIMA is now working with 107.

![Two routes from one series to a forecast, with the ETS route naming level, trend and season while the ARIMA route differences the series and models the leftover autocorrelation](screenshots/ETS-vs-ARIMA-in-R-model-space.webp)
*Figure 1: The same series, two routes. ETS names the components and updates them; ARIMA differences the structure away and models the correlation that remains. The bottom panel is the part most comparisons miss: the two model spaces share a large middle, and each keeps a region the other cannot reach.*

> **The one-sentence version:** ETS asks "what are the parts, and how fast does each one move?" ARIMA asks "once I subtract the obvious structure, what is still predictable from the past?"

## Where do the two families overlap?

Here is the fact that reframes the whole comparison, and it is the reason the two families so often produce nearly identical forecasts: they are not rival philosophies with nothing in common. **Every linear ETS model is exactly equivalent to some ARIMA model.** Not similar, not close. The same model, written in different notation.

The simplest case is simple exponential smoothing, ETS(A,N,N): additive error, no trend, no season. Its rule for updating the level is

\[ \ell_t = \alpha y_t + (1 - \alpha)\ell_{t-1} \]

where \(\ell_t\) is the level after seeing month \(t\), \(y_t\) is the observation in month \(t\), and \(\alpha\) is the smoothing weight between 0 and 1. The new level is a blend of the newest observation and the old level, and \(\alpha\) sets the mix.

Its ARIMA twin is ARIMA(0,1,1). The three numbers in an ARIMA name always sit in the same order, ARIMA(p, d, q): `p` counts the AR terms (how many past values it leans on), `d` counts how many times it differences, and `q` counts the MA terms (how many past errors it leans on). So ARIMA(0,1,1) reads: no AR terms, difference once, one MA term. Written out,

\[ y_t = y_{t-1} + \varepsilon_t + \theta_1 \varepsilon_{t-1} \]

where \(\varepsilon_t\) is this month's unpredictable shock, \(\varepsilon_{t-1}\) was last month's, and \(\theta_1\) is the weight on it. Two different stories. The algebra says they are the same model whenever

\[ \theta_1 = \alpha - 1 \]

We can check that claim rather than believe it. The airline data cannot show this, because it has a trend and a season and simple exponential smoothing models neither, so we borrow a series that is pure level: `Nile`, the annual flow of the Nile river at Aswan from 1871 to 1970, 100 measurements that wander around a level with no trend and no season.

```r title="The equivalence, checked on the Nile"
ses_fit <- ets(Nile, model = "ANN")         # simple exponential smoothing
ari_fit <- Arima(Nile, order = c(0, 1, 1))  # its claimed ARIMA twin

# What SES learned
round(as.numeric(ses_fit$par["alpha"]), 4)
#> [1] 0.2455

# What the algebra says the ARIMA twin's theta1 should be: alpha - 1
round(as.numeric(ses_fit$par["alpha"]) - 1, 4)
#> [1] -0.7545

# What the ARIMA actually estimated
round(as.numeric(coef(ari_fit)["ma1"]), 4)
#> [1] -0.7329
```

The prediction was -0.7545 and ARIMA independently landed on -0.7329. Those agree to about two hundredths, which is the equivalence showing up in real estimates. They are not bit-identical, and the reason is worth knowing: the two functions handle the very start of the series differently. `ets()` treats the initial level as one more parameter to estimate, while `Arima()` handles the start through the likelihood of the differenced series. Same model, slightly different accounting at the boundary, so slightly different numbers from finite data.

The equivalence shows up in the forecasts too. Both models should produce a flat line, because neither has a trend to extend:

```r title="Both twins forecast a flat line"
round(as.numeric(forecast(ses_fit, h = 3)$mean), 2)
#> [1] 805.38 805.38 805.38
round(as.numeric(forecast(ari_fit, h = 3)$mean), 2)
#> [1] 798.37 798.37 798.37
```

Flat in both cases, seven units apart out of about 800, which is a difference of under 1%.

Simple exponential smoothing is not a special case. Here is the map of the shared middle.

Two of the rows carry a second bracket, so decode it now, because it comes back in the next section. A seasonal ARIMA is written ARIMA(p,d,q)(P,D,Q)[m]. The first triple does its work at lag 1, one month against the month before. The capital-letter triple does the identical job at lag `m`, the length of the season. For monthly data `m` is 12, so (0,1,0)[12] means "difference each month against the same month a year earlier, and add nothing else on top".

| ETS model | Meaning | ARIMA twin |
|---|---|---|
| ETS(A,N,N) | level only | ARIMA(0,1,1) |
| ETS(A,A,N) | level plus trend | ARIMA(0,2,2) |
| ETS(A,Ad,N) | level plus damped trend | ARIMA(1,1,2) |
| ETS(A,N,A) | level plus season | ARIMA(0,1,m)(0,1,0) with m periods |
| ETS(A,A,A) | level, trend and season, all additive | ARIMA(0,1,m+1)(0,1,0) with m periods |
| ETS(M,...) | any multiplicative model | **no ARIMA twin exists** |

Read the last row, because it is where the two families genuinely part company. Every **additive** ETS model lives inside the ARIMA family. The **multiplicative** ones do not, because they are non-linear: they multiply the components rather than adding them, and ARIMA has no way to express that. The arrow only points one way, too. ARIMA's AR terms let it describe behaviour that no ETS model can, which we will see in a moment.

> **Watch out:** "Linear ETS is a subset of ARIMA" does not mean ARIMA is simply better. The ETS family is the smaller, more constrained space, and constraint is exactly what stops a model from chasing noise on a short series. Further down, "When does ETS win outright?" is a case where the smaller family wins precisely because it is smaller.

## Why did the two disagree on the airline data, then?

If the two families share so much, why did the opening contest show them landing 2% apart, and why is the airline model going to move much further than that? The answer is not really about ETS and ARIMA. It is about the one thing `auto.arima()` did not do for us.

The airline's seasonal swing **grows with the airline**. In 1949 the airline's busiest month carried 148,000 passengers and its quietest 104,000, a gap of 44,000. By 1960 the same two months were 622,000 and 390,000, a gap of 232,000. The gap more than quintupled while the airline itself roughly quadrupled, so the season is not a fixed number of passengers added on every July. It is a percentage, multiplied in. ETS handled that without being asked: its search space contains multiplicative models, and it chose one, `ETS(M,Ad,M)`, with an `M` in the seasonal slot.

ARIMA has no multiplicative seasonal model to choose. Its only route to that shape is a transform you have to ask for: take logs first, because on a log scale a percentage swing becomes a constant additive swing. `lambda = 0` tells `forecast` to model \(\log(y)\) and then convert the forecasts back to passengers automatically.

```r title="The same ARIMA search, now allowed to work on the log scale"
fit_arima_log <- auto.arima(train, lambda = 0)   # lambda = 0 means: model log(y)
fit_arima_log
#> Series: train
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

That model, ARIMA(0,1,1)(0,1,1)[12] on the log scale, is famous enough to have a name: the airline model, from Box and Jenkins, who used this exact dataset. Notice what changed. Without the log, `auto.arima()` had picked ARIMA(1,1,0)(0,1,0)[12], a model with no seasonal MA term at all, because on the raw scale the growing swing does not look like a clean repeating pattern. One transform, and the search finds a genuinely different and much better model. Now score it on the same held-back 24 months.

```r title="Scoring the log ARIMA on the same exam"
fc_arima_log <- forecast(fit_arima_log, h = 24)
round(accuracy(fc_arima_log, test)["Test set", "RMSE"], 2)
#> [1] 43.18
```

43.18, against ETS's 72.55. ARIMA did not merely close a 2% gap, it cut the error by 40% and beat ETS decisively. Nothing about the ARIMA family changed between that opening contest and now. All that changed is that we let it see the data on the right scale.

> **This is the trap the whole post is built around.** `ets()` versus `auto.arima()` on defaults is not a comparison of two families. It is a comparison of two search spaces given unequal help, because `ets()` searches over multiplicative structure automatically and `auto.arima()` waits to be handed a transform. If you compare them out of the box on any series whose swing grows, you have not learned which family suits your data. You have learned which function has better defaults for it, which is a different question with a misleading answer.

If you would rather not think about transforms at all, pass `lambda = "auto"` and `forecast` will estimate a Box-Cox parameter for you. The important habit is simply to ask, every time, whether the variation in your series grows with its level, and if it does, to make sure ARIMA is working on a scale where that growth has been flattened out.

## Why can't you just compare AICc?

Both objects report an AICc, and it is tempting to just read them off and take the smaller one. AICc is a model-selection score that measures fit while penalising extra parameters: lower means a better trade of accuracy against complexity. Inside one family it is exactly the right tool, and it is how both `ets()` and `auto.arima()` chose their own models. Across the two families it is meaningless. Here is why, in numbers.

```r title="Three AICc values that cannot be compared"
round(c(ETS = fit_ets$aicc, ARIMA = fit_arima$aicc, ARIMA_log = fit_arima_log$aicc), 2)
#>       ETS     ARIMA ARIMA_log
#>   1117.22    803.40   -388.78

# The number of observations each likelihood was computed on
c(ETS = nobs(fit_ets), ARIMA = nobs(fit_arima))
#>   ETS ARIMA
#>   120   107
```

Taken at face value those numbers say ARIMA beats ETS by 314 points, and the log ARIMA beats everything by 1,192 points, which would be an overwhelming margin. Both readings are wrong, for two separate reasons.

**The two likelihoods are computed on different data.** ETS modelled all 120 training months. The ARIMA differenced first, so its likelihood covers the 107 differenced values, as that `nobs` line shows. A likelihood over 107 numbers is not comparable with a likelihood over 120 numbers; there is simply less data in the first sum. This is not a subtlety you can wave away with a correction factor, and it is why AICc across a differencing boundary is not defined.

**The log ARIMA's likelihood is on a different scale entirely.** Its AICc of -388.78 was computed on \(\log(y)\). The training months run from 104 to 505 passengers, but their logs run from 4.64 to 6.22, so the whole series has been squeezed into a range under two units wide. Densities on that squashed scale are numerically larger, so the log-likelihood is larger and the AICc is dramatically lower. Take logs of any series and its AICc drops, whether or not the model got any better. That -388.78 says nothing about forecast quality. It is a unit change wearing a score's clothing.

Look back at what actually happened out of sample and the point lands hard. The plain ARIMA has an AICc of 803.40, far "better" than ETS's 1117.22, and yet it lost the held-back test, 74.25 to 72.55. The score and the result disagree because the score was never a valid comparison in the first place.

> **The rule:** use AICc to choose within a family, never between families, and never across a transform. To compare across families there is exactly one honest instrument, and it is out-of-sample error on identical data at identical scale, which is what the last section builds.

## When does ARIMA win outright?

The equivalence table promised that ARIMA can express things no ETS model can. The clearest case is a series that repeats without repeating on the calendar.

ETS's seasonal component is locked to a fixed, known period: 12 for monthly data, 4 for quarterly, and it must be told what that period is. It has no way to represent a rhythm of "roughly every ten years, give or take". ARIMA's AR terms have no such restriction, because an AR term just says this value relates to earlier values, and two AR terms together can produce a cycle of any length the data implies.

For this we need a cyclic series, and R ships a classic one: `lynx`, the annual number of Canadian lynx trapped in the Mackenzie River district from 1821 to 1934. Lynx numbers boom and crash on a roughly 10-year predator-prey cycle. That cycle is real and strongly predictable, but it is not a calendar season: it drifts, and annual data has a frequency of 1, so there is no seasonal slot for ETS to put it in.

```r title="A cycle that is not a calendar season"
ltrain <- window(lynx, end = 1920)     # 100 years to learn from
ltest  <- window(lynx, start = 1921)   # the last 14 years held back

lynx_ets   <- ets(ltrain)
lynx_arima <- auto.arima(ltrain)

lynx_ets$method
#> [1] "ETS(M,A,N)"

lynx_arima
#> Series: ltrain
#> ARIMA(2,0,2) with non-zero mean
#>
#> Coefficients:
#>          ar1      ar2      ma1      ma2       mean
#>       1.3293  -0.6588  -0.2041  -0.2517  1540.3906
#> s.e.  0.1088   0.0880   0.1383   0.1202   150.1746
#>
#> sigma^2 = 846776:  log likelihood = -822.64
#> AIC=1657.28   AICc=1658.19   BIC=1672.91
```

Look at what each family reached for. ETS picked `ETS(M,A,N)`: level and trend, and an `N` in the seasonal slot, meaning it gave up on the cycle entirely. It has no mechanism for it. ARIMA picked ARIMA(2,0,2), and those two AR terms with coefficients 1.3293 and -0.6588 are precisely what generates an oscillation: a positive weight on last year pushing the value up, a negative weight on the year before pulling it back down, which together produce a wave. Now score them.

```r title="ARIMA models the cycle, ETS cannot"
round(accuracy(forecast(lynx_ets,   h = 14), ltest)["Test set", "RMSE"], 1)
#> [1] 1819.3
round(accuracy(forecast(lynx_arima, h = 14), ltest)["Test set", "RMSE"], 1)
#> [1] 933.7
```

ARIMA's error is 933.7 against ETS's 1819.3. It is not 5% better, it is roughly twice as accurate, and no tuning of the ETS model would close that gap, because the gap is structural. ETS's forecast for the lynx is essentially a flat line through the middle of a wave, and a flat line through a wave is wrong half the time by the amplitude of the wave.

**So: if your series has cycles that are not tied to the calendar, ARIMA can model them and ETS cannot.** Economic series with irregular business cycles are the common real-world case.

## When does ETS win outright?

Turn it around. ETS's model space is smaller and more constrained, and that sounds like a pure disadvantage until you have a short series. A constrained model cannot chase noise as far. `auto.arima()` is searching a much larger space, and on a short series that search has enough freedom to find patterns that are not really there.

`USAccDeaths` is a good test: monthly accidental deaths in the United States from 1973 to 1978. That is 72 observations, six years, a short seasonal series of the kind that turns up constantly in real work. Its seasonal swing is roughly constant rather than growing, so no transform is needed and both families get a genuinely equal shot.

```r title="A short, additive seasonal series"
usa_ets   <- ets(USAccDeaths)
usa_arima <- auto.arima(USAccDeaths)

usa_ets$method
#> [1] "ETS(A,N,A)"

usa_arima
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

Both picked something sensible, and both picked something additive, which confirms that no transform is needed here and neither family is being handicapped. But they did not pick the same model. Our table says `ETS(A,N,A)`, level plus additive season, has the exact twin ARIMA(0,1,12)(0,1,0)[12], and that is emphatically not what `auto.arima()` chose: it went to the airline model instead. So the two families really are offering different models this time, and the test gets to decide between them. Rather than trust a single split on only 72 points, we score them the honest way, by repeatedly training on a growing history and forecasting the next 12 months.

```r title="A fair test on a short series"
# Fix each model's form so we test the models, not the two search algorithms
g_ets <- function(y, h) forecast(ets(y, model = "ANA"), h = h)
g_ari <- function(y, h) forecast(Arima(y, order = c(0, 1, 1), seasonal = c(0, 1, 1)), h = h)

# Train on the first 36 months, forecast 12; step forward one month; repeat
e_usa_ets <- tsCV(USAccDeaths, g_ets, h = 12, initial = 36)
e_usa_ari <- tsCV(USAccDeaths, g_ari, h = 12, initial = 36)

round(c(ETS = sqrt(mean(e_usa_ets^2, na.rm = TRUE)),
        ARIMA = sqrt(mean(e_usa_ari^2, na.rm = TRUE))), 1)
#>   ETS ARIMA
#> 363.6 420.3
```

ETS at 363.6 against ARIMA at 420.3, a 13% win for ETS, averaged over every origin rather than resting on one lucky split. Same scale, no transform in play, both families fitting their natural model for this shape. This is ETS winning a fair fight, and the reason is the thing that looked like a weakness: with only 72 observations, the smaller family generalises better.

**So: on short seasonal series, ETS's constrained model space is an advantage, not a limitation.**

## So how do you actually decide?

We now have two contradictory results on the airline data. The opening contest said ETS by 2%. The transform section said the log ARIMA by 40%. Both were single splits at a single origin, and a single split is one sample of one number. The fix is to stop asking "who won on 1959 to 1960?" and start asking "who wins on average, across every origin in the series?"

That is time series cross-validation, also called a rolling-origin backtest. Train on the first 72 months, forecast the next 12, record the errors. Move the origin forward one month and repeat, all the way to the end of the data. You end up with errors from 71 separate forecasting exercises rather than one, and the noise averages out.

Two rules make it a fair test rather than a rerun of the opening trap. First, every model is evaluated **on the same scale**, in passengers: `lambda = 0` transforms internally and back-transforms the forecasts, so its errors are in passengers like everyone else's. Second, we fix each model's form to the one its family already picked, rather than re-running the full search at all 71 origins. That tests the three models we have actually been discussing against each other, and it runs in seconds instead of minutes.

So the three contenders are exactly the ones from earlier in this post: `ETS(M,Ad,M)`, the model `ets()` chose; ARIMA(1,1,0)(0,1,0)[12], the model `auto.arima()` chose on the raw scale; and ARIMA(0,1,1)(0,1,1)[12] on logs, the airline model it found once we handed it the transform.

```r title="The test that settles it: 71 origins, one scale"
f_ets <- function(y, h) forecast(ets(y, model = "MAM", damped = TRUE), h = h)
f_ari <- function(y, h) forecast(Arima(y, order = c(1, 1, 0), seasonal = c(0, 1, 0)), h = h)
f_log <- function(y, h) forecast(Arima(y, order = c(0, 1, 1), seasonal = c(0, 1, 1),
                                       lambda = 0), h = h)

cv_ets <- tsCV(air, f_ets, h = 12, initial = 72)
cv_ari <- tsCV(air, f_ari, h = 12, initial = 72)
cv_log <- tsCV(air, f_log, h = 12, initial = 72)

# How many forecast origins did we just average over?
sum(!is.na(cv_ets[, 1]))
#> [1] 71

round(c(ETS = sqrt(mean(cv_ets^2, na.rm = TRUE)),
        ARIMA = sqrt(mean(cv_ari^2, na.rm = TRUE)),
        ARIMA_log = sqrt(mean(cv_log^2, na.rm = TRUE))), 2)
#>       ETS     ARIMA ARIMA_log
#>     28.51     21.08     18.77
```

There is the answer, and it is the opposite of the one this post opened with. Averaged over 71 origins, ETS scores 28.51, the plain ARIMA 21.08, and the log ARIMA 18.77. ARIMA wins on the airline data, and the log ARIMA wins by 34% over ETS.

Look hard at the middle number, because it is the one that indicts the opening section. That is the *same* ARIMA(1,1,0)(0,1,0)[12] that lost the first contest 74.25 to 72.55, with no transform and no help added. Given 71 origins instead of one, it does not merely catch up, it beats ETS by 26%. Nothing about either model changed. Only the quality of the test did, and the first test had been reporting noise.

That is the honest shape of this question. On the airline data ARIMA wins. On `USAccDeaths` ETS wins. On the lynx it is not close and ARIMA wins structurally. There is no family that is simply better, and the only way to know is to run the backtest on your own series.

The procedure, then:

1. **Look at your series first.** Does its swing grow as the level grows? If so, ARIMA needs a log or a Box-Cox transform to compete at all, and ETS does not.
2. **Let each family pick its own model** with `ets()` and `auto.arima()`, using `lambda = 0` or `lambda = "auto"` on the ARIMA side when step 1 says so.
3. **Never compare their AICc.** Use it only inside a family.
4. **Run `tsCV()` on both, same horizon, same scale**, and average the errors over every origin.
5. **Take the winner, and expect it to be a close call** on well-behaved seasonal data, because of that large shared middle. When the margin is small, prefer the model you can explain.

## FAQ

**Is ETS the same as exponential smoothing?**
Effectively yes. ETS is the modern state-space framework that contains the classic exponential smoothing methods and adds a proper statistical model behind them, which is what lets it produce prediction intervals and select models by AICc. Simple exponential smoothing is ETS(A,N,N), Holt's linear trend is ETS(A,A,N), and Holt-Winters is ETS(A,A,A) or ETS(M,A,M). See [Exponential Smoothing in R](Exponential-Smoothing-in-R.html) for the mechanics, and [ETS Models in R](ETS-Models-in-R.html) for the full 30-model taxonomy.

**Do I need to make my series stationary before using ETS?**
No. Stationarity is an ARIMA concern, and `auto.arima()` handles it for you by choosing the differencing orders itself. ETS has no stationarity requirement at all, because it models the trend and season directly rather than removing them. You still need to think about whether the variance grows with the level, which affects both families, though only ARIMA needs you to fix it by hand. [Test Stationarity in R](Test-Stationarity-in-R.html) covers the tests if you want them.

**Why did `auto.arima()` pick a worse model than `ets()` at first?**
Because it was not given the log transform. On the raw airline data the growing seasonal swing is not a clean repeating pattern, so the search found no seasonal MA term worth keeping and settled for ARIMA(1,1,0)(0,1,0)[12]. Adding `lambda = 0` let it find the airline model and cut the test error from 74.25 to 43.18. This is the single most common way an ETS-versus-ARIMA comparison gets rigged without anyone intending it.

**Can I just average the two forecasts?**
Often yes, and it is an underrated move. Averaging forecasts from models that make different errors usually beats both, and ETS and ARIMA make satisfyingly different errors on the parts where they differ. `(fc_ets$mean + fc_arima_log$mean) / 2` is a legitimate forecast. Test the average with `tsCV()` the same way you would test any other candidate rather than assuming it helps.

**Which one gives better prediction intervals?**
Both give real ones, and neither is reliably better. Both tend to be too narrow in practice, because both compute intervals assuming the model form is correct and the parameters are known exactly, and neither of those is true. If intervals matter to your decision, check their empirical coverage on held-back data instead of trusting the nominal 95%.

**What about fable, Prophet, or the machine learning options?**
`fable` is the modern successor to `forecast` by the same author, with the same ETS and ARIMA models behind a tidier interface, so everything in this post transfers directly. Prophet, gradient boosting and neural networks are worth trying once you have a baseline, but they are a different conversation. [Choosing a Forecasting Model in R](Choosing-a-Forecasting-Model-in-R.html) covers the wider field.

## Summary

| Question | Answer |
|---|---|
| What does ETS model? | Named components (level, trend, season) that update each period by a smoothing weight |
| What does ARIMA model? | The autocorrelation left over after differencing the structure away |
| Do they overlap? | Heavily. Every **linear** ETS model has an exact ARIMA twin, such as SES = ARIMA(0,1,1) with \(\theta_1 = \alpha - 1\) |
| What can ETS do that ARIMA cannot? | Multiplicative error and season, natively and automatically, with no transform |
| What can ARIMA do that ETS cannot? | Cycles that are not calendar seasons, via AR terms (lynx: 933.7 vs 1819.3) |
| Can I compare their AICc? | No. Differencing changes the observation count (120 vs 107) and a log changes the scale |
| How do I decide? | `tsCV()` on both, same horizon, same scale, averaged over every origin |
| Who won on the airline data? | Log ARIMA at 18.77, plain ARIMA at 21.08, ETS at 28.51, over 71 origins |
| Who won on `USAccDeaths`? | ETS at 363.6 against ARIMA at 420.3, because short series reward a constrained family |

The takeaway is a habit rather than a winner. When someone tells you ETS beats ARIMA or the reverse, ask three things: on what series, on what scale, and over how many origins. This post's own opening answer, ETS by 2%, failed all three tests and reversed once we ran a real one.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., section 9.10, "ARIMA vs ETS". [otexts.com/fpp3/arima-ets.html](https://otexts.com/fpp3/arima-ets.html). The canonical short treatment of this exact question, including the equivalence table.
2. Hyndman & Athanasopoulos, *FPP3* chapter 8, "Exponential smoothing". [otexts.com/fpp3/expsmooth.html](https://otexts.com/fpp3/expsmooth.html). Where the ETS state-space equations and the 30-model taxonomy are derived.
3. Hyndman & Athanasopoulos, *FPP3* chapter 9, "ARIMA models". [otexts.com/fpp3/arima.html](https://otexts.com/fpp3/arima.html). Differencing, AR and MA terms, and how `auto.arima()` searches.
4. Hyndman & Athanasopoulos, *FPP3* section 5.10, "Time series cross-validation". [otexts.com/fpp3/tscv.html](https://otexts.com/fpp3/tscv.html). The rolling-origin backtest that this post's closing test is built on.
5. Hyndman, R. J. & Khandakar, Y. "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software* 27(3), 2008. [jstatsoft.org/article/view/v027i03](https://www.jstatsoft.org/article/view/v027i03). The paper describing both algorithms you called in this post.
6. Hyndman, R. J., Koehler, A. B., Snyder, R. D. & Grose, S. "A state space framework for automatic forecasting using exponential smoothing methods." *International Journal of Forecasting* 18(3), 2002. [robjhyndman.com/papers/hksg.pdf](https://robjhyndman.com/papers/hksg.pdf). The paper that put ETS on a formal statistical footing.
7. `forecast` package documentation on CRAN. [cran.r-project.org/package=forecast](https://cran.r-project.org/package=forecast). Reference manual and vignettes for `ets()`, `auto.arima()` and `tsCV()`.
8. `tsCV()` function reference. [pkg.robjhyndman.com/forecast/reference/tsCV.html](https://pkg.robjhyndman.com/forecast/reference/tsCV.html). Arguments, the `initial` and `window` options, and worked examples.

## Continue Learning

- [ETS Models in R](ETS-Models-in-R.html), the parent post, decodes all three letters and fits every one of the 30 models. Read it if `ETS(M,Ad,M)` still feels like a code rather than a description.
- [Exponential Smoothing in R](Exponential-Smoothing-in-R.html) builds the SES recursion by hand, which is the model whose ARIMA twin we verified on the Nile.
- [Test Stationarity in R](Test-Stationarity-in-R.html) covers the stationarity question that only the ARIMA side of this comparison has to answer.
- [Choosing a Forecasting Model in R](Choosing-a-Forecasting-Model-in-R.html) widens the field past these two families to Prophet, VAR and the rest, using the same backtest-decides logic.
