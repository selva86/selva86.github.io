---
title: "How to choose ARIMA order (p, d, q): a practical guide"
slug: "ARIMA-Mini-3"
description: "Choose p, d and q for a real series in R: difference until the level holds steady, read the ACF and PACF for a shortlist, then let AICc settle the winner."
keywords: "how to choose ARIMA order, ARIMA p d q, ACF and PACF, ARIMA order selection in R, ndiffs, AICc, Ljung-Box test, identify ARIMA order"
mathjax: true
webr: true
date: "2026-09-06"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "3"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-2"
course_next: ""
curriculum_id: "0.0.17"
lesson_access: "windowed"
catalog_blurb: "How to pick the three numbers in ARIMA without guessing."
---

=== step === cover
## How to choose ARIMA order (p, d, q): a practical guide

Today we are going to choose an ARIMA order for a series of daily sales, from the raw numbers to a model you can defend in a meeting.

A coffee shop counts the cups it sells at the till. The record runs for 180 trading days, and over that stretch the count climbs from under 200 a day at the start to close to 300 by the end, with plenty of noise on the way up.

To forecast that series with ARIMA you have to supply three whole numbers, the p, the d and the q in ARIMA(p, d, q). Once those three are set, R estimates every coefficient and every forecast for you. So the whole job of fitting an ARIMA model really comes down to choosing three small integers.

Each number is settled a different way, and the three always run in the same order.

::widget process-flow {"steps":[{"title":"Difference the series","sub":"replace the counts by day to day changes until the level stops climbing, and that count is d"},{"title":"Read the two plots","sub":"the ACF and the PACF of those changes suggest values for p and q"},{"title":"Score the candidates","sub":"fit every order on the shortlist and compare their AICc scores"}]}

Those three boxes are what we are about to run on the coffee shop's numbers, one at a time.

=== step === concept
## 180 days of cups sold at a coffee shop

Everything from here runs on one series, so let us build it first.

The till gives one number per trading day: how many cups went out that day. There are 180 of them, one after another.

Press Run.

```r
# Build the coffee shop's 180 daily cup counts and look at the first ten days
library(forecast)

set.seed(101)
cups <- ts(round(180 + cumsum(rnorm(180, mean = 0.9, sd = 4)) + rnorm(180, sd = 7)))

head(as.numeric(cups), 10)
#>  [1] 186 176 182 187 189 184 192 193 197 211
range(cups)
#> [1] 176 304
```

`ts()` marks the vector as a time series, which is the shape the forecasting functions expect. `set.seed(101)` fixes the random draws so your numbers match mine.

The first ten days' counts run between 176 and 211, and across all 180 days the counts run from 176 up to 304. So the shop is busier at the end than it was at the start. Plotting the series makes that obvious.

```r
# Plot the daily cup counts across the 180 days
plot(cups, main = "Cups sold per day at one coffee shop",
     xlab = "Trading day", ylab = "Cups sold")
```

The line wanders up and down from one day to the next, but the level it wanders around keeps drifting upward.

That drift is the problem. The AR and MA parts of an ARIMA model, the ones that work off past values and past errors, assume the series is **stationary**, which means its average level and its amount of wobble stay roughly the same throughout. A series that climbs for 180 days fails on the first of those, and the plot shows it plainly: the values in the opening weeks and the values in the closing weeks do not overlap at all.

[NOTE]
Stationary describes the series, not the business. Trade can grow all it likes. What has to hold steady before an ARIMA fit is the level and the spread of the numbers being modelled.

=== step === concept
## Finding d: how many differences the series needs

The fix for a drifting level is **differencing**. Instead of modelling the counts themselves, you model the change from one day to the next.

\[ y'_t = y_t - y_{t-1} \]

Here \(y_t\) is today's count, \(y_{t-1}\) is yesterday's, and \(y'_t\) is the change between them. The d in ARIMA(p, d, q) is simply how many times you apply that.

The table below does it on the shop's first six days. Press Show what changed to see what differencing costs you, then press Run to see the changes themselves.

::widget table-transform {"code":"diff(df[[\"cups\"]])","caption":"Differencing pairs each day with the one before it, so six counts leave five changes and day 1 has nothing to subtract from.","before":{"cols":["day","cups"],"rows":[[1,186],[2,176],[3,182],[4,187],[5,189],[6,184]]},"after":{"cols":["day","cups"],"rows":[[2,176],[3,182],[4,187],[5,189],[6,184]]}}

Six counts leave five changes: -10, 6, 5, 2, -5. Over the whole series that is 180 counts and 179 changes.

```r
# Replace the counts by the day to day changes and check how many are left
daily_change <- diff(cups)

length(daily_change)
#> [1] 179
round(mean(daily_change), 2)
#> [1] 0.56
```

That is 179 changes, averaging 0.56 cups a day. Now plot them.

```r
# Plot the daily changes around zero
plot(daily_change, main = "Day to day change in cups sold",
     xlab = "Trading day", ylab = "Change in cups")
abline(h = 0, col = "grey50")
```

The climb is gone. The changes sit in a band around zero, and the band is about as wide at day 170 as it is at day 10. That is what a stationary series looks like.

One difference was enough, and `ndiffs()` agrees. It runs a stationarity test repeatedly and returns the number of differences the series needs.

```r
# Ask how many differences this series needs
ndiffs(cups)
#> [1] 1
```

So d = 1. Every plot from here on is read on `daily_change`, never on `cups`.

[WARNING]
Difference the fewest times that works. A second difference on a series that only needed one injects negative correlation the data never had, and that fake correlation turns up in the ACF and the PACF.

=== step === concept
## What the ACF and PACF measure, and which bars count

Two plots do the rest of the work, and both of them are read on `daily_change`.

The **ACF**, short for autocorrelation function, gives the correlation between the series and a copy of itself shifted k days back. At lag 2 that means: on days when the change was large, was the change two days earlier also large?

The **PACF**, the partial autocorrelation function, measures the same thing but holds the shorter lags out of it. At lag 2 it reports the link between a day and the one two days back after the day in between has been accounted for. It shows the direct link only, and that is why the two plots tell you different things.

Here are the first few values of each.

```r
# Print the ACF and the PACF of the daily changes for the first few lags
round(Acf(daily_change, plot = FALSE)$acf[1:6], 3)
#> [1]  1.000 -0.460  0.046 -0.001 -0.072  0.073
round(Pacf(daily_change, plot = FALSE)$acf[1:6], 3)
#> [1] -0.460 -0.210 -0.095 -0.140 -0.035 -0.063
```

The two lines start at different lags, so read them carefully. The ACF begins at lag 0, and its first value is always 1.000, because any series is perfectly correlated with itself. So the ACF at lag 1 is -0.460 and at lag 5 it is 0.073. The PACF has no lag 0 term at all, so it begins at lag 1: -0.460, then -0.210, -0.095, -0.140.

The same numbers drawn as bars:

```r
# Draw the two plots with their noise bands
par(mfrow = c(2, 1), mar = c(4, 4, 2.5, 1))
Acf(daily_change, main = "ACF of the daily changes")
Pacf(daily_change, main = "PACF of the daily changes")
par(mfrow = c(1, 1))
```

Both plots come with a pair of dashed blue lines. That is the noise band, and it decides which bars you are allowed to read.

Here is where it comes from. If a series has no correlation at all at lag k, its sample bar at that lag still does not come out at exactly zero. It varies from sample to sample, with a standard error of \(1/\sqrt{n}\). Take 1.96 of those standard errors on each side and you get the range a pure noise bar stays inside 95% of the time.

\[ \pm \frac{1.96}{\sqrt{n}} \]

```r
# Work out the noise band, then size the three largest bars against it
n <- length(daily_change)
acf_vals  <- Acf(daily_change, plot = FALSE)$acf
pacf_vals <- Pacf(daily_change, plot = FALSE)$acf
one_se <- 1 / sqrt(n)

round(c(one_standard_error = one_se, band = 1.96 * one_se), 3)
#> one_standard_error               band
#>              0.075              0.146
round(c(acf_lag1  = acf_vals[2],
        pacf_lag2 = pacf_vals[2],
        pacf_lag3 = pacf_vals[3]) / one_se, 2)
#>  acf_lag1 pacf_lag2 pacf_lag3
#>     -6.15     -2.80     -1.28
```

With 179 changes one standard error is 0.075, so the band sits at plus or minus 0.146. The second line rewrites three of the bars in those units. The lag-1 ACF is 6.15 standard errors from zero, the lag-2 PACF is 2.80, and the lag-3 PACF is 1.28, against a cutoff of 1.96.

The curve below is the distribution of a single bar in a series that has no correlation at that lag. It is a standard normal curve, and it fits every lag of our series because the slider is in standard errors, not in cups. Slide it to the size of a bar and the shaded area is the share of pure noise bars that reach that far or further, which is the p-value for that bar being zero. It opens at 2.80, the lag-2 PACF.

::widget null-distribution {"tails":2,"max":7,"start":2.8,"label":"bar size in standard errors"}

Drag it down to 1.95 and the p-value reads 0.051, just short of the 0.05 mark. Nudge it up to 2.00 and it reads 0.046. The 1.96 cutoff is exactly that crossing point: a bar inside the band is one that noise alone produces often enough that you cannot call it real.

Now try our own three numbers on it. At 2.80 the p-value is 0.005, so the lag-2 PACF is a genuine bar. Push the slider to 6.15 and the shaded area collapses to 0.000, which is the lag-1 ACF. Pull it back to 1.30, close to the lag-3 PACF, and the p-value climbs to 0.194: about one noise bar in five reaches that far, so it counts as zero.

=== step === quiz
## Quick check: why the plots are read on the daily changes

Suppose you had skipped the differencing and run the ACF on `cups` itself, the raw counts.

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Nothing much would change, because differencing only shrinks the numbers and makes them easier to read. ::no
- The lag-2 value of 0.046 would count as a real bar, because it is not exactly zero. ::no
- Almost every bar would come out large and positive, because a climbing level makes any day resemble the days near it, so the pattern worth reading only shows up in the daily changes. ::ok Exactly. On a climbing series the ACF measures the climb: its first ten bars run 0.952, 0.933, 0.912 and on down, all miles outside the 0.146 band. Differencing removes the level first, and only then do the bars say something about p and q.
- The ACF of the raw counts gives q directly, so differencing is only there to help the fit converge. ::no The ACF of a climbing series is dominated by the climb, so nearly every bar clears the band and nothing about p or q can be read off it. Differencing is what makes the two plots readable in the first place. And 0.046 sits well inside the 0.146 band, which is precisely what "counts as zero" means.

=== step === concept
## Cuts off or tails off: reading p and q from the two plots

Two phrases carry the whole procedure.

A plot **cuts off** after lag k when its bars clear the band up to lag k, then drop inside it and stay there. A plot **tails off** when its bars shrink gradually over several lags with no clean break anywhere.

Line the bars up against the band and see which is doing which.

```r
# Line up every bar against the 0.146 band
data.frame(lag  = 1:5,
           acf  = round(acf_vals[2:6], 3),
           pacf = round(pacf_vals[1:5], 3),
           band = 0.146)
#>   lag    acf   pacf  band
#> 1   1 -0.460 -0.460 0.146
#> 2   2  0.046 -0.210 0.146
#> 3   3 -0.001 -0.095 0.146
#> 4   4 -0.072 -0.140 0.146
#> 5   5  0.073 -0.035 0.146
```

The ACF column clears the band at lag 1 with -0.460 and then collapses: 0.046, -0.001, -0.072, 0.073, every one of them comfortably inside 0.146. That is a cut off after lag 1.

The PACF column behaves differently. It starts at -0.460, then -0.210, -0.095, -0.140, -0.035. It shrinks, but it takes its time about it and never drops off a cliff. That is a tail.

Those two behaviours are what name the model.

| ACF | PACF | The model it points to |
|---|---|---|
| Tails off | Cuts off after lag p | AR(p), where a value depends on its own p previous values |
| Cuts off after lag q | Tails off | MA(q), where a value depends on the q previous forecast errors |
| Tails off | Tails off | A mixed ARMA, which the plots cannot pin down on their own |

An ACF that cuts off after lag 1 with a PACF that tails off is the middle row. So q = 1 and p = 0, which together with the d we already settled gives ARIMA(0, 1, 1).

[TIP]
Real plots are messier than the rules used to read them, and this PACF is a fair example: two of its bars clear the band before it fades away. So take a shortlist out of the plots rather than a verdict. Alongside ARIMA(0,1,1) it is worth carrying ARIMA(1,1,1), ARIMA(1,1,0) and ARIMA(2,1,1), the nearby orders that a slightly different eye would have picked.

=== step === concept
## Fitting the shortlist and comparing AICc

All four candidate orders sit at d = 1 and are fitted to the same 180 counts. **AICc** scores each fit against the number of coefficients it spent, and lower is better.

```r
# Fit the four candidate orders and print their AICc scores
c("ARIMA(0,1,1)" = Arima(cups, order = c(0, 1, 1))$aicc,
  "ARIMA(1,1,1)" = Arima(cups, order = c(1, 1, 1))$aicc,
  "ARIMA(1,1,0)" = Arima(cups, order = c(1, 1, 0))$aicc,
  "ARIMA(2,1,1)" = Arima(cups, order = c(2, 1, 1))$aicc)
#> ARIMA(0,1,1) ARIMA(1,1,1) ARIMA(1,1,0) ARIMA(2,1,1)
#>     1299.526     1301.281     1309.552     1303.243
```

`Arima()` fits one order to the series, `order = c(p, d, q)` is where the three integers go, and `$aicc` pulls that fit's score back out.

ARIMA(0,1,1) wins at 1299.53, which is the order the two plots pointed at. ARIMA(1,1,1) comes second at 1301.28, then ARIMA(2,1,1) at 1303.24, and ARIMA(1,1,0) is last at 1309.55.

Why does the score need a penalty at all? Because an extra coefficient can only improve the fit on the data you already have. Nothing on the fit side ever stops you adding terms, so the penalty is what stops the count growing: a new term has to earn more fit than it costs. ARIMA(1,1,1) spends two coefficients where ARIMA(0,1,1) spends one, and the extra one does not pay for itself.

The gap between the top two is about 1.75 points. A widely used rule of thumb treats models within roughly 2 AICc points as indistinguishable, so that is a second reason to keep the one with fewer coefficients.

[WARNING]
Only compare AICc across models fitted at the same d. Differencing changes what is being modelled, so the AICc of an ARIMA(0,1,1) and the AICc of an ARIMA(2,0,0) are computed on different data and the comparison means nothing. Settle d first, then score orders inside it.

=== step === concept
## Confirming the order with a residual white-noise check

Fit the winner on its own and look at what it estimated.

```r
# Fit the winning order and read its one coefficient
fit <- Arima(cups, order = c(0, 1, 1))
fit
#> Series: cups
#> ARIMA(0,1,1)
#>
#> Coefficients:
#>           ma1
#>       -0.5631
#> s.e.   0.0601
#>
#> sigma^2 = 81.68:  log likelihood = -647.73
#> AIC=1299.46   AICc=1299.53   BIC=1305.83
```

The fit has one coefficient, `ma1`, estimated at -0.5631 with a standard error of 0.0601. That puts it 9.37 standard errors from zero, so the term is doing real work.

Now comes the check that decides the whole thing. The **residuals** are the one-step errors: for each day, what the till actually recorded minus what the fitted model predicted. If the order is right there is nothing usable left in them, and the error on one day tells you nothing about the error on the next.

The Ljung-Box test puts a number on that. It pools the residual autocorrelations up to a chosen lag into a single statistic.

```r
# Test whether any pattern is left in the residuals
res <- residuals(fit)
Box.test(res, lag = 10, fitdf = 1, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  res
#> X-squared = 3.8861, df = 9, p-value = 0.9187
```

`lag = 10` pools the first ten residual autocorrelations. `fitdf = 1` tells the test how many coefficients were estimated, which is one here, and it subtracts them from the degrees of freedom. That is why the output reports 9 rather than 10.

The null hypothesis is that the residuals are pure noise, so a large p-value is the pass. At 0.9187 there is nothing to reject. Their own ACF says the same thing.

```r
# Plot the ACF of the residuals
Acf(res, main = "ACF of the residuals from ARIMA(0,1,1)")
```

Every bar sits inside the band, the tallest of them reaching about 0.10 against a band of 0.146.

As a cross-check, `auto.arima()` searches a grid of orders and returns the best one it finds by AICc.

```r
# Let auto.arima() search the orders on its own
auto.arima(cups)
#> Series: cups
#> ARIMA(0,1,1) with drift
#>
#> Coefficients:
#>           ma1   drift
#>       -0.6057  0.6210
#> s.e.   0.0613  0.2642
#>
#> sigma^2 = 79.89:  log likelihood = -645.28
#> AIC=1296.56   AICc=1296.7   BIC=1306.12
```

The same three integers, ARIMA(0,1,1). It adds one thing we did not, a `drift` term of 0.6210, which is the steady climb of about 0.62 cups a day. That is the same climb the average of the daily changes showed at 0.56, estimated here alongside `ma1` instead of on its own. Its AICc of 1296.7 beats our 1299.53, and the two scores are comparable because both fits sit at d = 1, so writing the climb in as a term does pay for itself. The three integers are unchanged either way.

=== step === quiz
## Quick check: which order do the ACF and PACF suggest?

On `daily_change`, the ACF clears the 0.146 band at lag 1 only, with -0.460, and then reads 0.046, -0.001, -0.072 and 0.073. The PACF runs -0.460, -0.210, -0.095, -0.140 and -0.035, shrinking without a clean break. Which order does that pair point to?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- ARIMA(1,1,0), because the one tall bar at lag 1 in the ACF is a single autoregressive term. ::no
- ARIMA(0,1,1), because the ACF cuts off after lag 1 while the PACF tails off, and one difference was already needed. ::ok Right. An ACF that cuts off after lag q with a tailing PACF is the MA(q) pattern, so q = 1 and p = 0. AICc backs it up at 1299.53, the lowest of the four candidates.
- ARIMA(2,1,1), because the PACF has two bars outside the band before it fades. ::no
- ARIMA(1,1,1), because both plots have a big bar at lag 1, so the model needs one term of each. ::no The ACF gives q and the PACF gives p, and the plot that CUTS OFF is the one that names its number. Here the ACF cuts off after lag 1 while the PACF tails off, which is MA(1): q = 1, p = 0. A tail is not a count of significant bars, so two PACF bars outside the band do not make p = 2, and a big lag-1 bar in both plots does not mean one term of each.

=== step === tryit
## Your turn: score one more candidate against the winner

ARIMA(0,1,1) won on AICc at 1299.53, using one coefficient. The obvious next candidate is one more moving average term, ARIMA(0,1,2).

Fit it on `cups`, print its AICc, and run the same residual test with `fitdf = 2`, since this fit estimates two coefficients.

```r
# Goal: fit ARIMA(0,1,2) on cups and print its AICc.
# Then run Box.test on its residuals with lag = 10 and fitdf = 2.
# The score to beat is 1299.53. Press Check when you have it.
```
::check {"regex": "order\\s*=\\s*c[(]\\s*0\\s*,\\s*1\\s*,\\s*2\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "That is it. ARIMA(0,1,2) scores 1301.31 against 1299.53, so the second term costs 1.78 points and buys nothing: ma2 comes out at 0.0391 with a standard error of 0.0738, which does not even reach one standard error. Its Ljung-Box p-value of 0.8627 is a pass too, and that is the part worth thinking about.", "no": "Take the fitting line from the shortlist and move the last number: Arima(cups, order = c(0, 1, 2)). Then read its aicc, and pass its residuals to Box.test with lag = 10 and fitdf = 2."}
::solution
```r
# Fit the extra moving average term, score it, and test its residuals
fit2 <- Arima(cups, order = c(0, 1, 2))
fit2
#> Series: cups
#> ARIMA(0,1,2)
#>
#> Coefficients:
#>           ma1     ma2
#>       -0.5838  0.0391
#> s.e.   0.0737  0.0738
#>
#> sigma^2 = 82.01:  log likelihood = -647.59
#> AIC=1301.18   AICc=1301.31   BIC=1310.74
fit2$aicc
#> [1] 1301.314
Box.test(residuals(fit2), lag = 10, fitdf = 2, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  residuals(fit2)
#> X-squared = 3.938, df = 8, p-value = 0.8627
```

Both orders pass the residual test, and that is the thing to take away. Ljung-Box is a pass or a fail, not a ranking. It can tell you an order is not wrong; it can never tell you an order is the best one available.

So when two models both leave clean residuals, AICc and the coefficient count are what separate them. Here they both point back at ARIMA(0,1,1).

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition, chapter 9](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos. Sections 9.5 and 9.7 cover non-seasonal ARIMA and the order selection procedure followed here.
- [Time Series Analysis: Forecasting and Control](https://doi.org/10.1002/9781118619193) - Box, Jenkins and Reinsel, Wiley Series in Probability and Statistics. Chapter 6, Model Identification, is the original source of the cuts off and tails off rules.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). What auto.arima() searches, and how it scores what it finds.
- [On a Measure of Lack of Fit in Time Series Models](https://doi.org/10.1093/biomet/65.2.297) - Ljung and Box (1978), Biometrika 65(2), 297 to 303. The residual test used above.
- [Auto- and Cross-Covariance and -Correlation Function Estimation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - R Core Team. The documentation behind acf() and pacf(), including the band drawn on the plots.

=== step === complete
## Quick recap

You started with 180 daily cup counts and finished with an ARIMA(0,1,1) you can justify line by line. The routine that got you there:

- **d = 1.** The counts climbed, one difference flattened them, and `ndiffs()` agreed.
- **q = 1.** The ACF of the daily changes cleared the 0.146 band at lag 1, with -0.460, and nowhere else.
- **p = 0.** The PACF shrank gradually instead of cutting off, so there is no autoregressive term to add.
- **The shortlist.** Four orders at the same d, and AICc picked ARIMA(0,1,1) at 1299.53 over ARIMA(1,1,1) at 1301.28.
- **The confirmation.** Ljung-Box on the residuals gave p = 0.9187, so nothing usable was left behind.

The order those run in matters as much as the rules themselves. The two plots narrow the field to two or three candidates, and AICc plus the residual check settle which one you keep.

Now run the same three steps on a series of your own. Any daily count you have to hand will do: difference until the level holds steady, read the ACF and the PACF, then score the shortlist.
