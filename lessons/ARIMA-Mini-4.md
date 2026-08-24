---
title: "ARIMA diagnostics: the two checks before you trust a forecast"
slug: "ARIMA-Mini-4"
description: "A fitted ARIMA can look healthy and still miss the pattern that matters. Run the residual plot and the Ljung-Box test, then repair a model that fails both."
keywords: "ARIMA diagnostics, Ljung-Box test, residual diagnostics in R, white noise residuals, residual ACF, checking an ARIMA model, forecast residuals, Box.test fitdf"
mathjax: true
webr: true
date: "2026-08-24"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "4"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-3"
course_next: ""
curriculum_id: "0.0.18"
lesson_access: "windowed"
catalog_blurb: "The two checks that tell you whether a fitted model missed something."
---

=== step === cover
::eyebrow ARIMA from Zero
## ARIMA diagnostics: the two checks before you trust a forecast

Let's say you have just fitted an ARIMA model to eleven years of airline passenger counts, January 1949 through December 1959. The output comes back looking perfectly ordinary. It gives you coefficients, standard errors and an AIC, and it says nothing at all about what the model missed.

So how would you find out?

You look at what is left over. Take one month, subtract what the model predicted for that month from what actually happened, and keep the difference. Do that for every month and you have a column of leftovers, and that is the only place the model's mistakes ever show up.

The whole idea is this. If the model truly captured the pattern, those leftovers should look like pure static: no shape, no rhythm, nothing you could predict. If there is still a pattern sitting in them, the model missed something, and the forecasts will pay for it.

The good news is that finding out takes about a minute. There are two checks and you run them in this order.

::widget process-flow {"steps":[{"title":"Take the residuals","sub":"actual minus predicted, one number for every month"},{"title":"Look at them","sub":"a time plot and an autocorrelation plot, read by eye"},{"title":"Test them","sub":"one test pools every lag into a single p-value"}]}

The first one is an eyeball check and the second is a formal test called Ljung-Box. Between them they catch plenty of models that looked fine, and we are about to run both on a model that looked fine and was not.

=== step === concept
## The fitted model, and what its printout leaves out

Let's get the data and the model on the table first, because everything after this is measured against them.

`AirPassengers` is built into R: monthly totals of international airline passengers, in thousands, from January 1949 to December 1960. We fit on the 132 months up to the end of 1959 and hold 1960 back, unseen, so we can score the forecasts later against months that actually happened.

The order is ARIMA(2,1,1), which is two autoregressive terms, one difference, and one moving-average term. Press Run.

```r
# Fit a plain ARIMA(2,1,1) to the 1949 to 1959 passenger counts
library(forecast)

passengers_train <- window(AirPassengers, end = c(1959, 12))
passengers_1960  <- window(AirPassengers, start = c(1960, 1))

fit_plain <- Arima(passengers_train, order = c(2, 1, 1))
fit_plain
#> Series: passengers_train 
#> ARIMA(2,1,1) 
#> 
#> Coefficients:
#>          ar1      ar2      ma1
#>       1.0698  -0.4734  -0.8402
#> s.e.  0.0824   0.0782   0.0461
#> 
#> sigma^2 = 758.6:  log likelihood = -619.13
#> AIC=1246.26   AICc=1246.58   BIC=1257.76
```

Read that output and nothing jumps out as wrong. There are three coefficients, each one several times larger than its own standard error, so all three are doing real work. The AIC is 1246.26, and that number only means something when you hold it up against another model.

And that is exactly the problem with it. The output tells you what the model found. It cannot tell you what the model missed, because the model never saw that either.

=== step === concept
## What a residual actually is

A residual is a gap. Take one month, ask the model what it predicts for that month using only the months before it, and subtract that prediction from what actually happened. The number left over is the residual for that month.

Because each prediction looks only one month ahead, residuals are also called one-step-ahead forecast errors. There is one for every month the model was fitted on, so 132 of them here.

The function `residuals()` hands you all 132. Let's line the first six up beside the real counts and the model's predictions, so you can watch the subtraction happen.

```r
# Line up the first six months: what happened, what the model said, and the gap
res_plain <- residuals(fit_plain)

first_six <- data.frame(
  month     = c("Jan 1949", "Feb 1949", "Mar 1949", "Apr 1949", "May 1949", "Jun 1949"),
  actual    = as.numeric(passengers_train)[1:6],
  predicted = round(as.numeric(fitted(fit_plain))[1:6], 1),
  residual  = round(as.numeric(res_plain)[1:6], 1)
)
first_six
#>      month actual predicted residual
#> 1 Jan 1949    112     111.9      0.1
#> 2 Feb 1949    118     112.8      5.2
#> 3 Mar 1949    132     120.9     11.1
#> 4 Apr 1949    129     135.3     -6.3
#> 5 May 1949    121     124.0     -3.0
#> 6 Jun 1949    135     116.8     18.2
```

Check the last row by hand. In June 1949, 135 thousand passengers flew and the model had called 116.8, so the residual is 135 minus 116.8, which is 18.2 thousand passengers the model did not see coming.

A positive residual means the month beat the model and a negative one means the month came in under it. That is all the sign means.

Everything from here on works on that last column.

=== step === concept
## White noise: the four traits your leftovers should have

On their own, 132 residuals are just numbers. To judge them you need a standard to compare against, and that standard has a name: white noise.

White noise is a series with no usable pattern in it at all. It has four traits, and every diagnostic you are about to run is really a test for one of them.

1. **Centred on zero.** The errors are not consistently high or consistently low, so the model is not leaning one way.
2. **Steady spread.** The errors are about as wide in the last year as in the first, not calm early and wild later.
3. **No correlation from one error to the next.** Knowing this month's error tells you nothing about next month's.
4. **Roughly bell shaped.** Most errors sit near zero and big ones are rare. This one is a bonus trait: you need it for honest prediction intervals, not for the forecast itself.

The third trait is the one that carries the most weight, and here is why. If today's error helps you predict tomorrow's, then there was information in the data that the model could have used and did not. Leftover correlation is leftover signal.

So let's see what the standard actually looks like. The top panel below is our residuals. The bottom panel is 132 draws from `rnorm()` with the same spread, which are white noise because we built them that way.

```r
# Put our residuals above 132 draws of genuine random noise
set.seed(1)
pure_noise <- rnorm(132, sd = sd(res_plain))

par(mfrow = c(2, 1), mar = c(4, 4, 3, 1))
plot(as.numeric(res_plain), type = "l", col = "steelblue",
     main = "Our residuals", xlab = "Month", ylab = "Passengers (thousands)")
abline(h = 0, col = "grey40", lty = 2)
plot(pure_noise, type = "l", col = "grey35",
     main = "Genuine white noise, same spread", xlab = "Month", ylab = "Passengers (thousands)")
abline(h = 0, col = "grey40", lty = 2)
par(mfrow = c(1, 1))
```

The bottom panel wanders around zero and never settles into anything. The top panel does not behave like that at all. So the job now is to say exactly how it differs, and what to do about it.

=== step === tryit
## Your turn: are these residuals centred, with a steady spread?

Two of the four traits take one line of arithmetic each, so start there.

`res_plain` holds the 132 residuals. Get their mean, which answers the first trait, and their standard deviation, which is the usual measure of spread and answers the second.

```r
# res_plain holds the 132 residuals from the fitted model.
# Trait one: is their mean near zero?
# Trait two: how wide is their spread?
# Two lines, one with mean() and one with sd().
# Press Check when you have them.
```
::check {"regex": "sd\\s*[(]\\s*res_plain\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "That is it. A mean of 6.04 sitting next to counts in the hundreds, and a spread of 26.54. Both of those look fine, which is precisely the trouble with them.", "no": "You want two summaries of the same vector. Put `round(mean(res_plain), 2)` on one line and `round(sd(res_plain), 2)` on the next."}
::solution
```r
# Check the first two white-noise traits, one number each
round(mean(res_plain), 2)
#> [1] 6.04
round(sd(res_plain), 2)
#> [1] 26.54
```

A mean of 6.04 against monthly counts in the hundreds is close enough to zero, so the first trait passes. The standard deviation is 26.54, and on its own that is neither good news nor bad news, it is simply how wide the errors are.

Now notice what those two numbers cannot do. Each one is a single summary of all eleven years at once, and collapsing eleven years into one number throws away the order the months came in.

A mean of 6.04 would read the same whether the errors were scattered at random or arranged in a neat repeating wave. One standard deviation cannot tell you the errors were small in 1949 and large in 1959. That is how a bad model gets away with it. It passes the checks that throw time away and fails the ones that keep it.

=== step === concept
## The first check: the residual time plot

The first check is the simplest thing you can do with a column of numbers. Put them in the order they happened, plot them, and look.

Three things are worth looking for, and any one of them is a fail:

- **Drift.** The residuals sit above zero for a long stretch and below it for another, which means there is a trend in the data that the model never absorbed.
- **A widening funnel.** The swings are narrow at the start and wide at the end, so the errors are growing along with the series.
- **A repeating hump.** The same shape comes back at the same interval, which means a cycle the model never learned.

Here are ours, with a dashed line at zero to read them against. Underneath the plot we measure the spread separately over the first five years and the last five.

```r
# Plot the residuals in time order and measure their spread in two eras
plot(res_plain, type = "l", col = "steelblue",
     main = "Residuals from ARIMA(2,1,1), 1949 to 1959",
     xlab = "Year", ylab = "Passengers (thousands)")
abline(h = 0, col = "grey40", lty = 2)

r <- as.numeric(res_plain)
c(first_five_years = round(sd(r[1:60]), 2),
  last_five_years  = round(sd(r[73:132]), 2))
#> first_five_years  last_five_years 
#>            15.32            34.67 
```

Two of the three are here. The line climbs above zero and drops below it in the same months every year, over and over. There is the repeating hump, a twelve-month cycle the model never learned.

And the swings widen. 15.32 against 34.67 says the errors in the last five years are more than twice as wide as in the first five, and there is the funnel. The airline more than doubled in size over those eleven years and the model's mistakes grew right along with it.

[NOTE]
The mean of 6.04 was never wrong. It was just averaging a series that runs above zero for part of every year and below it for the rest, and an average cannot see that.

=== step === concept
## Autocorrelation at lag 12, worked out by hand

Your eye says twelve months. Let's get a number for it.

An autocorrelation at lag 12 asks one question: how strongly does the residual series line up with itself when you slide it twelve months? Pair every month with the month a year earlier, and if a big residual in July 1955 tends to sit beside a big residual in July 1956, that number comes out large and positive.

The arithmetic has the same shape as an ordinary correlation, with one twist to it. Both halves of every pair are centred on the mean of the whole series, and the total is divided by the sum of squares of the whole series rather than of the two overlapping pieces. That is how `acf()` in R defines it, and it is why the number it gives is not quite what `cor()` on two sliced vectors would give.

\[ r_{12} = \frac{\sum_{t=13}^{n} (e_t - \bar{e})(e_{t-12} - \bar{e})}{\sum_{t=1}^{n} (e_t - \bar{e})^{2}} \]

Here \(e_t\) is the residual for month \(t\), \(\bar{e}\) is the mean of all 132 of them, and \(n\) is 132. The top line runs over the 120 pairs that survive once you slide the series by twelve. Let's do it in R.

```r
# Work out the lag-12 autocorrelation of the residuals by hand
n <- length(r)
centred <- r - mean(r)

numerator   <- sum(centred[13:n] * centred[1:(n - 12)])
denominator <- sum(centred^2)

round(numerator / denominator, 3)
#> [1] 0.781
```

0.781. Read it the way you would read any correlation, and it is a strong one: a big miss last July goes with a big miss this July, a small one with a small one, year after year.

That is not an error the model could have avoided by being luckier. It is a pattern, sitting in the leftovers, that a better model would have used.

=== step === concept
## The residual ACF and its noise band

Doing that by hand once is worth it. Doing it twenty-four times is not, and `acf()` gives you every lag in one go.

The plot it draws puts one vertical bar at each lag. Lag 1 is the correlation between neighbouring months, lag 12 is the one we just computed, and the plot runs out to lag 24, which is two years back.

The two dashed lines are what turn the picture into a decision. They sit at 1.96 divided by the square root of the number of residuals, which is the range a correlation from genuinely random data would stay inside about 95% of the time. A bar inside the band is noise. A bar outside it is not.

```r
# Draw the residual ACF and count the bars that break the noise band
acf(r, lag.max = 24, main = "Residual ACF, ARIMA(2,1,1)")

band <- 1.96 / sqrt(n)
bars <- acf(r, lag.max = 24, plot = FALSE)$acf[-1]

round(band, 3)
#> [1] 0.171
round(bars[c(12, 24)], 3)
#> [1] 0.781 0.620
sum(abs(bars) > band)
#> [1] 6
```

The band sits at 0.171. The bar at lag 12 reaches 0.781, more than four times the band, and the bar at lag 24 reaches 0.620. Six of the twenty-four bars break the band altogether.

The two tall ones are at twelve months and twenty-four months, which are the seasonal lags for monthly data. The residuals repeat every year, and then repeat again at two years, which is the same yearly cycle turning up a second time.

[KEY INSIGHT]
Every bar outside that band is forecastable structure the model left behind. A bar of 0.781 at lag 12 says you could predict most of this month's error from the error twelve months ago, and a model that lets you do that is not finished.

=== step === quiz
## Quick check: what the bar at lag 12 is telling you

The bar at lag 12 came out at 0.781 with the band at 0.171. What does that tall bar actually say?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- That the passenger counts have a yearly season, which was obvious from the raw series before any model was fitted. ::no
- That the model left a yearly rhythm behind in its errors, so there was a pattern available that it did not use. ::ok Exactly. The season was always in the data. What matters is that it is still in the leftovers after the model has had its turn, which means the model never used it.
- That the residuals are too large on average, so the model is leaning upward. ::no
- That twelve is the number of differences to apply next. ::no The ACF here is drawn on the residuals, not on the passenger counts. The raw series is seasonal and always was, so that on its own is not news, and a tall bar says nothing about the average size of the errors or about how much differencing to do. What it says is that the season survived the model and is still sitting in the errors.

=== step === concept
## The second check: the Ljung-Box test

Reading twenty-four bars and deciding how many are too many is a judgement call, and you would have to make it fresh for every model you fit. The second check replaces the whole thing with one number.

The Ljung-Box test asks a single pooled question: taken together, are the first few autocorrelations close enough to zero to be chance? It is called a portmanteau test, because it packs many lags into one statistic.

Like any test it starts from a null hypothesis, and this is the part that catches people out. The null here is that the residuals ARE white noise. So a small p-value rejects white noise and hands you the bad news. A large one means the test found nothing wrong, and that is the outcome you want.

That runs backwards to most tests you have used, where a small p-value is the result you wanted. Here you are hoping to fail to reject.

Besides the residuals themselves, the call takes three settings. `lag` says how many lags to pool, and for monthly data the usual choice is twice the seasonal period, so 24. `type` picks the version of the statistic. `fitdf` is how many terms the model estimated from this same data, three here. Why the test needs that number, and why it is three, is the next thing we work out.

```r
# Pool the first 24 residual autocorrelations into one test
Box.test(res_plain, lag = 24, type = "Ljung-Box", fitdf = 3)
#> 
#> 	Box-Ljung test
#> 
#> data:  res_plain
#> X-squared = 200.44, df = 21, p-value < 2.2e-16
```

The p-value comes back below 2.2e-16, which is R's way of printing a number too small to write out. There is no judgement call left to make. If these residuals really were white noise, a statistic this large would essentially never turn up.

[NOTE]
`type = "Ljung-Box"` matters. The default in `Box.test()` is the older Box-Pierce statistic, which is the same idea with weaker behaviour on short series. Ljung-Box is the one to ask for.

=== step === concept
## What Q* adds up, and how it turns into a p-value

One number just stood in for twenty-four, so let's open it up and see what went in.

The statistic is called Q*, and `Box.test()` prints it under the label X-squared. It squares each of the first h autocorrelations, weights the ones at longer lags a little more heavily, and adds them up.

\[ Q^{*} = n(n+2) \sum_{k=1}^{h} \frac{r_{k}^{2}}{n-k} \]

Here \(n\) is the number of residuals, \(h\) is how many lags you pool, and \(r_k\) is the residual autocorrelation at lag \(k\). Squaring is what stops a negative correlation cancelling a positive one, so every departure from zero counts, whichever way it points.

That total is then compared against a chi-squared distribution, which is the shape a sum of squared quantities takes when nothing is going on. The degrees of freedom are not h, though. You did not know the true model, you estimated it, and each estimated term uses up a little of the data's freedom to wiggle, so the count is h minus the number of terms the model estimated.

Our ARIMA(2,1,1) estimated three of them: two autoregressive terms and one moving-average term. The differencing does not count, because nothing was estimated for it. That is the 3 in `fitdf = 3`, and 24 minus 3 is the df of 21 the output showed.

```r
# Rebuild the Ljung-Box statistic and its p-value from the autocorrelations
lags  <- 1:24
Qstar <- n * (n + 2) * sum(bars[lags]^2 / (n - lags))
round(Qstar, 2)
#> [1] 200.44

degrees <- 24 - 3
pchisq(Qstar, df = degrees, lower.tail = FALSE)
#> [1] 2.961794e-31
```

There it is, 200.44, the same statistic the test reported, built out of nothing but the twenty-four bars you already had. Then `pchisq()` with `lower.tail = FALSE` gives the area to the right of it, which is the p-value.

That is the exact number the test reported as smaller than 2.2e-16: a decimal point followed by thirty zeros before the digits start. If the residuals had no pattern left in them, a Q* this large would be that rare.

=== step === tryit
## Your turn: run the test at 12 lags instead of 24

The lag you test at is a real decision, not a formality. Pool too few lags and a seasonal spike further out never enters the sum. Pool too many and one genuine signal gets watered down by a crowd of empty lags.

Ours had big bars at both lag 12 and lag 24, so pooling 24 caught the pair of them. Run the same test over 12 lags instead and see whether the verdict moves. The model estimated three terms either way.

```r
# res_plain holds the residuals from the ARIMA(2,1,1) model.
# Run the same Ljung-Box test, but pool 12 lags instead of 24.
# The model still estimated three terms.
# One line. Press Check when you have it.
```
::check {"regex": "Box[.]test[\\s\\S]*lag\\s*=\\s*12", "gate": true, "difficulty": "beginner", "ok": "Right. Q* falls to 118.08 on 9 degrees of freedom, and the p-value is still under 2.2e-16. Halving the lags changed the arithmetic and changed nothing about the answer.", "no": "Take the call you just ran and move one argument: `Box.test(res_plain, lag = 12, type = \"Ljung-Box\", fitdf = 3)`."}
::solution
```r
# Run the same test over 12 lags instead of 24
Box.test(res_plain, lag = 12, type = "Ljung-Box", fitdf = 3)
#> 
#> 	Box-Ljung test
#> 
#> data:  res_plain
#> X-squared = 118.08, df = 9, p-value < 2.2e-16
```

Q* drops from 200.44 to 118.08, which makes sense, because twelve fewer squared correlations are going into the sum. The degrees of freedom drop with it, from 21 to 9, since 12 minus the three estimated terms is 9.

The verdict does not move an inch. When a model misses something as loud as a whole season, you do not have to pick the lag carefully to catch it. Where the choice starts to matter is on borderline models, and the safe habit for monthly data is twice the seasonal period, so that the twelve-month and twenty-four-month bars are both in the pool.

=== step === widget
## What leftover autocorrelation costs a forecast

Our model fails both checks. Before we repair it, look at what failing costs you, because it is not what most people expect.

Drag the dial below. At every setting it fits a straight trend line to sixty points, a couple of thousand times over, and the setting is how strongly each error is correlated with the one before it. Watch the two lines as you move it.

::widget assumption-dial {"assumption": "autocorrelation"}

The line marked interval coverage is the share of all those studies whose 95% interval really did contain the true slope. It is supposed to sit at 95%, and as you push the dial to the right it falls away. The other line is R-squared, the fit statistic you would quote, and it holds up. If anything it climbs, because errors that move together in a smooth wave are easier to fit than errors that jump about.

That combination is the trap. The number you would look at to judge the model goes up while the number that says how far to trust it goes down.

Our own model does exactly this. Here is what it forecast for July 1960, with its 95% interval, next to the month that actually happened.

```r
# Ask the failing model for its July 1960 forecast and its 95% interval
fc_plain <- forecast(fit_plain, h = 12)

c(forecast = round(as.numeric(fc_plain$mean)[7], 1),
  lo95     = round(as.numeric(fc_plain$lower[7, 2]), 1),
  hi95     = round(as.numeric(fc_plain$upper[7, 2]), 1),
  actual   = as.numeric(passengers_1960)[7])
#> forecast     lo95     hi95   actual 
#>    430.6    319.8    541.5    622.0 
```

The model put July 1960 between 319.8 and 541.5 thousand passengers, and it attached 95% confidence to that range. July came in at 622. The month is not near the edge of the interval, it is more than 80 thousand passengers clear of the top of it.

=== step === concept
## The repair, and the same two checks again

A failing diagnostic is not a dead end. It is a to-do list, because each thing the time plot showed points straight at its own fix.

The twelve-month hump asks for a seasonal term. The model has a moving-average term that reaches back one month. What it needs is one that also reaches back a whole year, so that a July error can inform the following July. In R that is the `seasonal` argument, and `seasonal = c(0, 1, 1)` adds a seasonal difference and a seasonal moving-average term at the twelve-month period.

The widening swings ask for a log. Taking logs turns growth that multiplies into growth that adds: if the errors are roughly a fixed percentage of the level, then on the log scale they are roughly a fixed size, which is the steady spread we want. `lambda = 0` is how `Arima()` asks for a log, and it puts the forecasts back on the passenger scale for you afterwards.

Let's make both changes at once, then run both checks again on the new residuals.

```r
# Refit with a seasonal term and a log, then run both checks again
fit_season <- Arima(passengers_train, order = c(0, 1, 1),
                    seasonal = c(0, 1, 1), lambda = 0)
res_season <- residuals(fit_season)

acf(as.numeric(res_season), lag.max = 24, main = "Residual ACF, seasonal model")

new_bars <- acf(as.numeric(res_season), lag.max = 24, plot = FALSE)$acf[-1]
round(new_bars[c(12, 23)], 3)
#> [1] -0.042  0.193
sum(abs(new_bars) > band)
#> [1] 1

Box.test(res_season, lag = 24, type = "Ljung-Box", fitdf = 2)
#> 
#> 	Box-Ljung test
#> 
#> data:  res_season
#> X-squared = 21.011, df = 22, p-value = 0.5201
```

Lag 12 has gone from 0.781 to -0.042, which is well inside the band of 0.171. Six bars used to break the band. Now one does, at lag 23, and it barely gets out at 0.193. A band drawn to hold 95% of pure noise lets about one bar in twenty escape by chance, so one out of twenty-four is nothing to chase.

Notice that `fitdf` is 2 now, not 3. This model estimates two terms, one moving-average and one seasonal moving-average. The two differences are not estimated from the data at all, so they never count, and neither does the log, because we chose it rather than fitted it.

And the p-value is 0.5201. If these residuals were white noise, a statistic this big or bigger would show up in about half of all fits, which is as ordinary as a result gets. Both checks pass.

=== step === concept
## 1960, forecast against fact

A passing check is a promise about the future, not a measurement of it. That is why we held 1960 back, so we could take the measurement.

Neither model has seen a single month of 1960. Here is what each of them said, drawn against what actually happened, with the average size of the miss printed underneath.

```r
# Score both models against the twelve months of 1960 they never saw
fc_season <- forecast(fit_season, h = 12)
actual_1960 <- as.numeric(passengers_1960)

plot(actual_1960, type = "b", pch = 16, ylim = c(370, 660),
     main = "1960, forecast against fact",
     xlab = "Month of 1960", ylab = "Passengers (thousands)")
lines(as.numeric(fc_plain$mean), type = "b", pch = 1, col = "firebrick")
lines(as.numeric(fc_season$mean), type = "b", pch = 1, col = "steelblue")
legend("topleft", bty = "n", lty = 1, pch = c(16, 1, 1),
       col = c("black", "firebrick", "steelblue"),
       legend = c("What happened", "Failing model", "Repaired model"))

c(plain    = round(mean(abs(actual_1960 - as.numeric(fc_plain$mean))), 1),
  seasonal = round(mean(abs(actual_1960 - as.numeric(fc_season$mean))), 1))
#>    plain seasonal 
#>     65.2     13.3 
```

The failing model is the flat one. It sits between 430 and 451 thousand passengers for all twelve months, because a model with no seasonal term has no way of knowing that July is different from February. The repaired model rises and falls with the real year.

July is where it hurts. The failing model called 430.6 against an actual 622, so it was 191 thousand passengers short in a single month. The repaired model called 622.2 and missed by 0.2.

Across all twelve months, the average miss is 65.2 thousand passengers against 13.3. That gap is what the two checks were pointing at the whole time. The ACF said a year-long rhythm had been left behind, and this is the bill for it.

=== step === concept
## How to run both checks in one line

We did all of that in pieces so you could see what each piece does. In daily use there is one function that does the lot.

`checkresiduals()` draws the time plot, the ACF and a histogram of the residuals in a single figure, and prints the Ljung-Box test underneath. It reads the lag and the degrees of freedom off the model itself, so you do not have to remember either.

That last part is easy to take on trust, so let's test it. The second call below is the same test with the subtraction skipped, `fitdf = 0`, as though nothing had been estimated.

```r
# Run both checks in one call, then see what a wrong fitdf does to the p-value
checkresiduals(fit_season)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 21.011, df = 22, p-value = 0.5201
#> 
#> Model df: 2.   Total lags used: 24

Box.test(res_season, lag = 24, type = "Ljung-Box", fitdf = 0)
#> 
#> 	Box-Ljung test
#> 
#> data:  res_season
#> X-squared = 21.011, df = 24, p-value = 0.6381
```

The first result is exactly what we worked out by hand: Q* of 21.011 on 22 degrees of freedom and a p-value of 0.5201. The two extra lines spell out the choices it made for you, `Model df: 2` being the `fitdf` and `Total lags used: 24` being the lag. One cosmetic difference: `checkresiduals()` calls the statistic Q* while `Box.test()` calls the same number X-squared.

In the second result the statistic has not moved, because the statistic never depended on the degrees of freedom. Only the yardstick moved, to 24, and the p-value drifted from 0.5201 to 0.6381.

Here the model passes either way, so it looks harmless. It is not. Forgetting `fitdf` always makes the test more lenient, so the model it eventually lets through is the borderline one that should have gone back for work.

[TIP]
Let `checkresiduals()` pick the lag and the degrees of freedom, and reach for `Box.test()` only when you want to override them. The wrapper already knows your model's order and its seasonal period, which removes the most common way people end up quoting a wrong p-value.

=== step === concept
## What a passing p-value does not prove

The repaired model passed. Now be precise about what that buys you.

The Ljung-Box test looks for one thing: correlation between the errors at different lags. That is all it looks for. Anything else wrong with your residuals is invisible to it.

Here is a series built to make the point. Every value is an independent draw from `rnorm()`, so no value has any connection to the one before it. The only thing that changes is the spread, which climbs steadily from 4 at the start to 20 at the end.

```r
# Build a series with no correlation at all but a spread that keeps climbing
set.seed(1)
funnel_demo <- rnorm(132, sd = seq(4, 20, length.out = 132))

plot(funnel_demo, type = "l", col = "steelblue",
     main = "Independent draws with a growing spread",
     xlab = "Month", ylab = "Value")
abline(h = 0, col = "grey40", lty = 2)

Box.test(funnel_demo, lag = 24, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  funnel_demo
#> X-squared = 24.741, df = 24, p-value = 0.42
```

A p-value of 0.42. The test finds nothing wrong, and it is right not to, because there genuinely is no autocorrelation here, and autocorrelation is the only thing it was ever asked about.

Now look at the plot. The funnel is plain to see: quiet at the left, wild at the right. Residuals shaped like that will not break the point forecast, but they will wreck the prediction intervals, because one spread is being quoted for a series whose spread keeps changing.

[WARNING]
A large Ljung-Box p-value means the model left no correlation behind. It does not mean the model is right, and it says nothing at all about a spread that changes over time, which is why the time plot is never the check you skip.

=== step === quiz
## Practice: which of these models would you ship?

Four models, four diagnostic summaries. Which one would you forecast with?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Ljung-Box p = 0.31 and every bar inside the band, but the time plot fans out from narrow at the start to three times as wide at the end. ::no
- Ljung-Box p = 0.0004, one bar far outside the band at lag 12, and a hump repeating every twelve months in the time plot. ::no
- Ljung-Box p = 0.44, every bar inside the band, and a time plot that bounces around zero at a steady width from start to finish. ::ok Yes. Both checks agree and neither has anything to report, which is the only combination that clears a model to forecast with.
- Ljung-Box p = 0.68 and every bar inside the band, but the test was run with fitdf left at 0 on a model that estimated three terms. ::no Read the p-value, the ACF and the time plot together, because each one sees something the other two cannot. A fan in the time plot is a changing spread, which the test cannot detect, and a p-value of 0.0004 with a tall bar at lag 12 is a missed season. The last one may well turn out fine, but you cannot say so yet: with fitdf at 0 the test was run too leniently, so set fitdf to 3 and run it again before deciding.

=== step === quiz
## Practice: reading an ACF you have not seen before

A colleague hands you the residual ACF of a monthly model. One bar at lag 1 sits at 0.52, well outside the band. Every other bar out to lag 24, including lag 12 and lag 24, sits comfortably inside it, and the Ljung-Box test comes back at p = 0.002. What did the model miss?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A yearly season, so add a seasonal moving-average term at the twelve-month period. ::no
- Short memory: this month's error still predicts next month's, so an ordinary autoregressive or moving-average term is what it needs. ::ok That is the read. Lag 1 is this month against last month, so the leftover pattern is a one-month one, and the fix is an ordinary term rather than a seasonal one.
- Nothing worth fixing, because one bar out of twenty-four breaking the band is what chance alone produces. ::no
- A spread that changes over time, so take logs and refit. ::no Where the bar sits is the whole message. Lag 1 is this month against last month, so the miss is short memory rather than a season, and a seasonal term would be aimed at lag 12, which is already clean. One bar out of twenty-four can be chance, but not one this far out with the test at p = 0.002, and a log repairs a changing spread, which an ACF does not measure at all.

=== step === tryit
## Practice: diagnose a model end to end

One last one, and this is the whole loop in a single try.

Fit the seasonal model again with exactly the same orders, but leave the log out this time: no `lambda` argument at all. Then run both checks on it and decide whether you would ship it. Use 24 lags and `fitdf = 2`, since this model estimates the same two terms as the logged one.

```r
# passengers_train holds the 132 training months.
# Fit ARIMA(0,1,1) with seasonal = c(0, 1, 1) into fit_nolog, and no lambda.
# Then plot its residuals over time, measure their spread across the first
# five years and the last five, and run the Ljung-Box test at 24 lags with
# fitdf = 2. Press Check when you have it.
```
::check {"regex": "seasonal[\\s\\S]*fitdf\\s*=\\s*2", "gate": true, "difficulty": "intermediate", "ok": "Good. p = 0.0713 clears the 0.05 bar, but only just, and the spread still climbs from 8.49 to 11.05 across the eleven years. This is a model to look at twice rather than ship.", "no": "Fit it with `Arima(passengers_train, order = c(0, 1, 1), seasonal = c(0, 1, 1))` and no lambda, then test the residuals with `Box.test(residuals(fit_nolog), lag = 24, type = \"Ljung-Box\", fitdf = 2)`."}
::solution
```r
# Fit the seasonal model without the log, then run both checks on it
fit_nolog <- Arima(passengers_train, order = c(0, 1, 1), seasonal = c(0, 1, 1))
res_nolog <- as.numeric(residuals(fit_nolog))

plot(res_nolog, type = "l", col = "steelblue",
     main = "Residuals, seasonal model without the log",
     xlab = "Month", ylab = "Passengers (thousands)")
abline(h = 0, col = "grey40", lty = 2)

c(first_five_years = round(sd(res_nolog[1:60]), 2),
  last_five_years  = round(sd(res_nolog[73:132]), 2))
#> first_five_years  last_five_years 
#>             8.49            11.05 

Box.test(residuals(fit_nolog), lag = 24, type = "Ljung-Box", fitdf = 2)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(fit_nolog)
#> X-squared = 32.37, df = 22, p-value = 0.0713
```

The seasonal terms did most of the work, so the yearly rhythm is gone and the test comes back at 0.0713. Against the usual 0.05 bar that is a pass, but it is a pass by a hair, and the logged version scored 0.5201 on the very same series.

Then there is the part the test cannot see. The spread still climbs from 8.49 in the first five years to 11.05 in the last five, because without the log the errors keep growing with the airline. That is the second white-noise trait failing while the p-value looks acceptable.

So the verdict is: not yet. Put the log back and both numbers improve at once.

=== step === concept
## References

- [On a measure of lack of fit in time series models](https://doi.org/10.1093/biomet/65.2.297) - Ljung and Box (1978), Biometrika 65(2), 297-303. The paper the test and the Q* statistic come from.
- [Distribution of residual autocorrelations in autoregressive-integrated moving average time series models](https://doi.org/10.1080/01621459.1970.10481180) - Box and Pierce (1970), Journal of the American Statistical Association 65(332), 1509-1526. Where the degrees-of-freedom subtraction for estimated terms is derived.
- [Forecasting: Principles and Practice, section 5.4, Residual diagnostics](https://otexts.com/fpp3/diagnostics.html) - Hyndman and Athanasopoulos, 3rd edition. The workflow followed here.
- [Box-Pierce and Ljung-Box Tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/box.test.html) - R Core Team, the documentation for `Box.test()`, including the `fitdf` argument.
- [checkresiduals](https://pkg.robjhyndman.com/forecast/reference/checkresiduals.html) - Hyndman and colleagues, the forecast package reference for the one-line check.

=== step === complete
## Quick recap

You took a model that looked completely healthy, found what it had missed, repaired it, and then measured what the repair was worth against a year the model had never seen. Two checks did all of that.

- **Take the residuals.** Each one is the actual month minus what the model predicted for that same month, one step ahead. There were 132 of them.
- **Look at them.** The time plot showed a hump repeating every twelve months and swings that widened as the airline grew. The ACF put a number on the hump: 0.781 at lag 12, against a noise band of 0.171.
- **Test them.** Ljung-Box pooled all twenty-four autocorrelations into a single statistic, Q* of 200.44, with a p-value under 2.2e-16. Small is the bad news here, because the null it rejects is the good outcome.
- **Repair, then check again.** A seasonal term for the yearly hump and a log for the widening swings brought lag 12 to -0.042 and the p-value to 0.5201. The average miss across 1960 fell from 65.2 thousand passengers to 13.3.
- **Know what a pass does not buy.** The test looks for correlation and nothing else, so a series whose spread climbed from 4 to 20 passed it at p = 0.42.

So when someone asks whether a model is good enough to forecast with, the answer is not the AIC. It is this: there is nothing left in the residuals, and here are the plot and the p-value that say so.

It costs a minute, and it catches the models that look fine. Nice work getting through it.
