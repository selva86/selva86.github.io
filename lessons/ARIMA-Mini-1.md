---
title: "ARIMA: what AR, I, and MA actually mean"
slug: "ARIMA-Mini-1"
description: "Take ARIMA apart on 180 days of coffee sales in R: what the AR, I and MA terms each measure, and how to read any ARIMA(p, d, q) label as one plain sentence."
keywords: "what AR I and MA mean, ARIMA explained, ARIMA in R, autoregressive term, differencing, moving average term, ARIMA p d q, arima function"
mathjax: true
webr: true
date: "2026-09-04"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.4"
lesson_access: "windowed"
catalog_blurb: "What each letter in ARIMA does, and how to read any label."
---

=== step === cover
::eyebrow ARIMA from Zero
## ARIMA: what AR, I, and MA actually mean

Today we are going to take ARIMA apart one letter at a time and find out what each of them is doing.

Here is what we will work on. A coffee shop counts the cups it sells at the close of every day, and we have 180 of those daily counts. The first day sold 300 cups and the last one sold 403, so the shop has grown, though nothing about the way it grew was smooth.

Three separate things go on in a series like that, and ARIMA carries one letter for each of them.

The first is that the daily counts are not independent of each other. Whatever pushed sales up today, a cold spell or a busy week in the offices nearby, is usually still around tomorrow. That is the AR.

The second is that the level itself keeps moving. The shop sells more now than it did six months ago, so there is no fixed average for the counts to come back to. When that happens we stop modelling the count and model the day-to-day change instead. That is the I.

The third is that some days get a push nothing in the history could have predicted. A delivery van parks outside, a school group walks past, and the shop sells a good deal more than the days around it would suggest. Part of that push is still in the numbers the following day. That is the MA.

::widget process-flow {"steps":[{"title":"AR","sub":"each day leans on the days just before it"},{"title":"I","sub":"model the day-to-day change, not the level"},{"title":"MA","sub":"part of one random shock carries into today"}]}

Those three ideas are the whole model. From here we fit them one at a time on the shop's own sales, and read the numbers that come back.

=== step === concept
## The 180 days of coffee sales

Real sales data does not come with the true coefficients behind it. So we will build these 180 days ourselves from coefficients we pick, and then we can compare every fitted coefficient with the number that actually produced the data.

Each day gets its own random shock, drawn from a normal distribution with a standard deviation of 2.5 cups. That shock is the part of a day nothing else explains: the van outside, the school group, the rain.

The day-to-day change is then built from four pieces. It takes today's own shock, plus half of the previous change, plus 40 percent of the previous shock, plus a constant of 0.15 cups that nudges the level upward over time. Adding those changes onto a starting level of 300 gives the count of cups sold.

Press Run.

```r
# Build 180 days of coffee sales from known coefficients and plot them
set.seed(16)
shock  <- rnorm(180, 0, 2.5)     # the part of each day nothing else explains
change <- numeric(180)           # how much sales move from one day to the next

for (t in 2:180) {
  change[t] <- 0.15 + 0.5 * change[t - 1] + shock[t] + 0.4 * shock[t - 1]
}

cups <- round(300 + cumsum(change))   # cups sold on each of the 180 days

plot(cups, type = "l", col = "steelblue4", lwd = 2,
     main = "Cups sold per day at the coffee shop",
     xlab = "Day", ylab = "Cups sold")

c(day_1 = cups[1], day_180 = cups[180], average = round(mean(cups), 1))
#>   day_1 day_180 average
#>     300     403     367
```

The line climbs from 300 cups on day 1 to 403 on day 180 and averages 367 along the way. It does not climb steadily. There are runs of good days, dips that last a week or two, and no level the series is holding to.

Two numbers in that code are worth keeping hold of: the 0.5 on the previous change and the 0.4 on the previous shock. Those are the two numbers a fitted model should recover.

=== step === concept
## Today's sales against yesterday's sales

Start with the plainest version of the question: how much does one day's count tell you about the day after it?

Pair every count with the one that follows it, which gives 179 pairs, and take the correlation of those two columns. That is the lag-1 correlation, lag 1 meaning shifted along by one day.

```r
# Measure how strongly one day follows the day before it
plot(cups[-180], cups[-1], pch = 19, col = "steelblue4",
     main = "Today against yesterday, all 179 pairs",
     xlab = "Yesterday's cups", ylab = "Today's cups")

round(cor(cups[-1], cups[-180]), 3)
#> [1] 0.991

round(c(days_1_to_30 = mean(cups[1:30]), days_151_to_180 = mean(cups[151:180])), 1)
#>    days_1_to_30 days_151_to_180
#>           321.4           371.1
```

The points sit almost on a straight line, and 0.991 says the same thing. Read literally, it means yesterday's count all but determines today's, which would be a strange thing to believe about a coffee shop.

That is not what the number is measuring. Both columns climb over the 180 days, and the shared climb on its own makes any two neighbouring points look alike. The two 30-day averages show how big that climb is: 321.4 cups across the first 30 days against 371.1 across the last 30.

So the series has no fixed average, and a correlation taken on the levels mostly reports the trend the two columns share. Very little of the 0.991 is the day-to-day dependence we came for.

=== step === concept
## What differencing removes (the I in ARIMA)

The fix is to stop modelling the level. Model the amount the count moved since the day before, and the shared climb drops out.

Here are the first eight days of sales with that change worked out as a new column.

::widget table-transform {"code": "df %>% mutate(change = cups - lag(cups))", "caption": "Each row is that day minus the day before, and the first row has nothing to subtract from.", "before": {"cols": ["day", "cups"], "rows": [[1, 300], [2, 300], [3, 303], [4, 302], [5, 303], [6, 304], [7, 302], [8, 300]]}, "after": {"cols": ["day", "cups", "change"], "rows": [[1, 300, "NA"], [2, 300, 0], [3, 303, 3], [4, 302, -1], [5, 303, 1], [6, 304, 1], [7, 302, -2], [8, 300, -2]]}}

Day 1 has no day before it, so its change is NA. Day 2 sold the same 300 cups as day 1, which is a change of 0, and day 3 sold 303 against 300 the day before, a change of 3. Every row is that day minus the previous one, and nothing else.

Doing that to the whole series is one call to `diff()`.

```r
# Turn the daily counts into day-to-day changes and plot them
daily_change <- diff(cups)

plot(daily_change, type = "l", col = "steelblue4",
     main = "Day-to-day change in cups sold",
     xlab = "Day", ylab = "Change in cups")
abline(h = 0, col = "grey60", lwd = 2)

length(daily_change)
#> [1] 179

round(c(average = mean(daily_change), sd = sd(daily_change),
        smallest = min(daily_change), largest = max(daily_change)), 2)
#>  average       sd smallest  largest
#>     0.58     3.82    -9.00    11.00
```

There are 179 changes for 180 days, because the first day has nothing to subtract from. They average 0.58 cups with a standard deviation of 3.82, and the largest single moves are 9 cups down and 11 cups up.

The plot is the reason we did it. The changes wander around a level of about half a cup for the whole 180 days: the line holds that level from end to end instead of climbing, and the spread never widens. A series whose average and spread stay put like that is called stationary, and it is what ARIMA needs to work on.

Subtracting the previous value is called differencing, and d counts how many times you do it. Once was enough here, so d = 1. The I stands for integrated, which is the name for adding the changes back up when you want levels again.

=== step === widget
## Today's change against yesterday's change (the AR term)

With the trend out of the way, ask the same question of the changes: is a day that moved up followed by another day that moves up?

Below are the last 60 daily changes, one point per neighbouring pair, with yesterday's change across the bottom and today's change up the side. Move the two sliders to lay a line through the cloud, then press Snap to least squares to jump to the line that makes the squares as small as they go.

::widget ols-fit {"points":[{"x":3,"y":1},{"x":1,"y":-4},{"x":-4,"y":-1},{"x":-1,"y":-3},{"x":-3,"y":-2},{"x":-2,"y":-1},{"x":-1,"y":0},{"x":0,"y":4},{"x":4,"y":4},{"x":4,"y":2},{"x":2,"y":1},{"x":1,"y":2},{"x":2,"y":1},{"x":1,"y":0},{"x":0,"y":-4},{"x":-4,"y":-4},{"x":-4,"y":-4},{"x":-4,"y":-3},{"x":-3,"y":-7},{"x":-7,"y":-9},{"x":-9,"y":-9},{"x":-9,"y":-7},{"x":-7,"y":-1},{"x":-1,"y":1},{"x":1,"y":-2},{"x":-2,"y":-1},{"x":-1,"y":0},{"x":0,"y":2},{"x":2,"y":3},{"x":3,"y":0},{"x":0,"y":-3},{"x":-3,"y":-3},{"x":-3,"y":-1},{"x":-1,"y":-3},{"x":-3,"y":-3},{"x":-3,"y":-2},{"x":-2,"y":-1},{"x":-1,"y":2},{"x":2,"y":1},{"x":1,"y":3},{"x":3,"y":1},{"x":1,"y":-2},{"x":-2,"y":1},{"x":1,"y":3},{"x":3,"y":7},{"x":7,"y":1},{"x":1,"y":1},{"x":1,"y":3},{"x":3,"y":2},{"x":2,"y":3},{"x":3,"y":7},{"x":7,"y":6},{"x":6,"y":3},{"x":3,"y":2},{"x":2,"y":0},{"x":0,"y":3},{"x":3,"y":9},{"x":9,"y":3},{"x":3,"y":-6}]}

The best line has a slope of 0.70 and an intercept of -0.13. Read that slope as a rule for tomorrow: a day whose change was 10 cups up is followed, on average, by a day about 7 cups up, and a day 4 cups down by one about 3 cups down.

That line is the AR term, and written out it looks like this.

\[ \Delta y_t = c + \phi \, \Delta y_{t-1} + \varepsilon_t \]

Here \(\Delta y_t\) is today's change and \(\Delta y_{t-1}\) is yesterday's, \(c\) is a constant, \(\varepsilon_t\) is the day's own new shock, and \(\phi\) is the slope you just fitted. \(\phi\) is called the AR coefficient, and AR is short for autoregressive, meaning the series is regressed on itself.

R fits the same line on all 180 days. The `order` argument holds the three ARIMA numbers as `c(p, d, q)`: how many previous changes, how many differences, how many past shocks. So `c(1, 1, 0)` asks for one previous change, one difference, and no shock term.

```r
# Fit one previous change on the whole series and read its coefficient
fit_ar <- arima(cups, order = c(1, 1, 0))
fit_ar
#>
#> Call:
#> arima(x = cups, order = c(1, 1, 0))
#>
#> Coefficients:
#>          ar1
#>       0.6968
#> s.e.  0.0536
#>
#> sigma^2 estimated as 7.67:  log likelihood = -436.66,  aic = 877.32
```

`ar1` is 0.6968, against the 0.6999 the hand-fitted line gave on the last 60 changes. They agree to two decimal places, and they are the same kind of quantity: an AR coefficient is a slope, fitted on the changes rather than on the levels. The `s.e.` line under it is the standard error of that estimate, 0.0536, so 0.6968 is pinned down fairly tightly.

There is no intercept in the output. Once a series has been differenced, `arima()` fits it without a constant, so the 0.15 cups of drift we built in is not estimated here.

=== step === quiz
## Quick check: what does an AR coefficient of 0.70 mean?

The fitted model gave an AR coefficient of 0.70 on the day-to-day changes. Which sentence says what that predicts?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Seventy percent of the cups sold today were carried over from yesterday. ::no
- A day whose change was 10 cups up is followed by a day about 7 cups up, plus whatever new shock that day brings. ::ok That is it. The coefficient multiplies the previous change, so 0.70 times 10 cups up gives about 7 cups up, and the day still gets its own shock on top.
- Sales grow by about 0.70 cups a day. ::no
- About 70 percent of the days in the series are up days. ::no The AR coefficient is a slope on the changes, and it is neither a share of the level, a growth rate, nor a count of up days. It multiplies yesterday's change to predict today's, which is why differencing had to come first: 0.70 of yesterday's 300 cups would be a nonsense prediction.

=== step === concept
## What the AR fit leaves in the residuals (the MA term)

Fit any model and it leaves residuals behind, one per day: the change that actually happened minus the change the model predicted. If the AR term had accounted for all the dependence between neighbouring days, there would be nothing left in those residuals for a second term to explain.

Measure them the same way we measured the raw changes.

```r
# Compare the leftover dependence in the AR residuals with the raw changes
ar_resid <- residuals(fit_ar)

round(cor(ar_resid[-1], ar_resid[-180]), 3)
#> [1] 0.159

round(cor(daily_change[-1], daily_change[-179]), 3)
#> [1] 0.689
```

The raw changes carried a lag-1 correlation of 0.689. The residuals of the fitted model still carry 0.159. So most of the dependence has been accounted for and a little of it has not.

Why any is left is worth seeing, because it is the whole case for the third letter. Take a single day that got a 10-cup shock and follow that shock forward.

An AR coefficient of 0.5 puts half of today's change into tomorrow, half of that into the day after, and so on: 10, then 5, then 2.5, then 1.25. It shrinks every day and never quite arrives at zero.

An MA coefficient of 0.4 does something else. The shock is carried into the next day at 4 cups and then it is finished: 10, 4, 0, 0.

```r
# Follow one 10-cup shock forward under an AR term and under an MA term
ar_impulse <- 10 * 0.5^(0:8)         # AR coefficient 0.5: half carries on each day
ma_impulse <- c(10, 4, rep(0, 7))    # MA coefficient 0.4: carried once, then gone

plot(0:8, ar_impulse, type = "b", pch = 19, col = "steelblue4", lwd = 2,
     ylim = c(0, 11),
     main = "One 10-cup shock, followed for eight days",
     xlab = "Days after the shock", ylab = "Cups carried into that day")
lines(0:8, ma_impulse, type = "b", pch = 19, col = "darkorange", lwd = 2)
legend("topright", c("AR term, coefficient 0.5", "MA term, coefficient 0.4"),
       col = c("steelblue4", "darkorange"), lwd = 2, bty = "n")

round(rbind(AR = ar_impulse, MA = ma_impulse), 2)
#>    [,1] [,2] [,3] [,4] [,5] [,6] [,7] [,8] [,9]
#> AR   10    5  2.5 1.25 0.62 0.31 0.16 0.08 0.04
#> MA   10    4  0.0 0.00 0.00 0.00 0.00 0.00 0.00
```

The blue line is what an AR term can produce and the orange line is what an MA term produces. No AR coefficient gives you the orange line, because an AR term multiplies by the same fraction over and over: it can fade to almost nothing, but it never stops. A shock that counts for exactly one day and then finishes needs a term of its own, and that term is written like this.

\[ \Delta y_t = c + \varepsilon_t + \theta \, \varepsilon_{t-1} \]

\(\varepsilon_{t-1}\) is yesterday's shock and \(\theta\) is the MA coefficient, the share of that shock carried into today. q counts how many past shocks the model keeps.

[WARNING]
MA stands for moving average, and the name is a trap. This is not the moving average that smooths a line by averaging neighbouring points. An MA term is a weighted sum of past shocks, and it smooths nothing.

So the 0.159 left in the AR residuals is the one-day shock effect. An AR term has no way of producing it, so it stays behind.

=== step === concept
## Fitting both terms at once

Ask for one previous change and one past shock together and the order becomes `c(1, 1, 1)`.

```r
# Fit one previous change and one past shock together, then check the leftovers
fit_both <- arima(cups, order = c(1, 1, 1))
fit_both
#>
#> Call:
#> arima(x = cups, order = c(1, 1, 1))
#>
#> Coefficients:
#>          ar1     ma1
#>       0.4965  0.4114
#> s.e.  0.0912  0.1019
#>
#> sigma^2 estimated as 7.158:  log likelihood = -430.56,  aic = 867.13

both_resid <- residuals(fit_both)
round(cor(both_resid[-1], both_resid[-180]), 3)
#> [1] -0.016
```

`ar1` is 0.4965 and `ma1` is 0.4114, against the 0.5 and the 0.4 the series was built from. Both sit within about a hundredth of the number that produced them.

Look at what happened to `ar1`. Fitted on its own it came out at 0.6968, and with an MA term beside it, it drops to 0.4965. The single AR term had been doing two jobs at once: carrying the real 0.5 of the previous change, and absorbing the one-day shock effect. Give the model a term for each job and each coefficient settles on the number it belongs to.

The leftover correlation drops as well, from 0.159 to -0.016. On 179 changes, chance alone moves a correlation like that by about 1 over the square root of 179, which is roughly 0.07, so -0.016 is nothing at all, while 0.159 was well outside that band.

[KEY INSIGHT]
An AR term and an MA term are not two ways of saying the same thing. AR carries a fraction of the previous change forward and keeps on doing it, fading but never stopping. MA carries a fraction of one past shock and then stops dead. A series with both in it needs both fitted, because fitting one alone pushes the other one's work onto it.

Putting the two fitted numbers in gives this series its own equation.

\[ \Delta y_t = 0.4965 \, \Delta y_{t-1} + \varepsilon_t + 0.4114 \, \varepsilon_{t-1} \]

=== step === concept
## How to read ARIMA(p, d, q) as a sentence

p, d and q are counts, and that is all they are.

- p is how many previous changes the model uses.
- d is how many times the series was differenced.
- q is how many past shocks the model carries.

The 180 days of cups sold came out as ARIMA(1, 1, 1), which breaks into these three pieces.

::widget process-flow {"steps":[{"title":"d = 1, differenced once","sub":"the model works on the day-to-day change"},{"title":"p = 1, one previous change","sub":"the fitted ar1 gives it a weight of 0.50"},{"title":"q = 1, one past shock","sub":"the fitted ma1 gives it a weight of 0.41"}]}

Said out loud, that is one sentence about the data: the counts were differenced once, so the model works on the day-to-day change; that change is built from one previous change, weighted 0.50; and one past shock is carried into it, weighted 0.41.

Every other label reads the same way, with only the counts moving. ARIMA(2, 1, 1) builds today's change from the two changes before it instead of one. ARIMA(0, 1, 1) drops the previous change and keeps the shock. ARIMA(1, 0, 0) is not differenced at all, so it is fitted on the counts themselves, and today's count leans on yesterday's count.

=== step === quiz
## Quick check: what does ARIMA(2,1,1) mean?

A colleague sends you a model of the shop's daily sales labelled ARIMA(2, 1, 1). Which sentence describes it?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The counts were differenced twice, and the model uses one previous change. ::no
- The model averages the last two days to smooth the series, after differencing it once. ::no
- The counts were differenced once, today's change is built from the two changes before it, and one past shock is carried into it. ::ok Exactly. Read the numbers in the order p, d, q and each one is a count: two previous changes, one difference, one past shock.
- The model forecasts two days ahead, using one difference and one past shock. ::no The first number is p, the count of previous changes, not the number of differences and not a forecast horizon. And the MA term is a past shock carried forward, never an average of the last few days.

=== step === tryit
## Your turn: fit the MA term on its own

`cups` still holds the 180 days of coffee sales. Fit a model with no previous change and one past shock, which is `order = c(0, 1, 1)`, and read off its `ma1`. Then take that model's residuals and measure their lag-1 correlation, and see how it compares with the 0.159 the AR-only fit left behind.

```r
# cups holds the 180 daily counts of cups sold.
# Fit no previous change and one past shock: order = c(0, 1, 1).
# Then take the residuals of that fit and measure their lag-1 correlation.
# Three lines. Press Check when you have them.
```
::check {"regex": "order\\s*=\\s*c[(]\\s*0\\s*,\\s*1\\s*,\\s*1\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: ma1 comes out at 0.6996, and the residuals it leaves carry a lag-1 correlation of 0.23. That is larger than the 0.159 the AR-only fit left, so neither letter on its own accounts for the dependence in the changes.", "no": "Pass the order straight in: arima(cups, order = c(0, 1, 1)). Then call residuals() on that fit, and cor() of it against itself shifted along by one day."}
::solution
```r
# Fit one past shock with no previous change, and measure what it leaves behind
fit_ma <- arima(cups, order = c(0, 1, 1))
fit_ma
#>
#> Call:
#> arima(x = cups, order = c(0, 1, 1))
#>
#> Coefficients:
#>          ma1
#>       0.6996
#> s.e.  0.0433
#>
#> sigma^2 estimated as 8.188:  log likelihood = -442.51,  aic = 889.03

ma_resid <- residuals(fit_ma)
round(cor(ma_resid[-1], ma_resid[-180]), 3)
#> [1] 0.23
```

Each letter on its own leaves dependence behind: 0.159 for the AR term and 0.23 for the MA term, against -0.016 when the two are fitted together. And notice that `ma1` came back at 0.6996 rather than the 0.4 the series was built from, because with no AR term beside it the MA term is the only thing in the model that can carry any dependence at all.

=== step === concept
## References

- [Forecasting: Principles and Practice, chapter 9](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos, 3rd edition. The free standard treatment of ARIMA, from stationarity and differencing through to the full non-seasonal model.
- [Time Series Analysis: Forecasting and Control](https://doi.org/10.1002/9781118619193) - Box, Jenkins and Reinsel (2008), Wiley. The book the method is named after, and the source of the model-building procedure people still follow.
- [Time Series Analysis and Its Applications](https://doi.org/10.1007/978-3-319-52452-8) - Shumway and Stoffer, 4th edition, Springer. Chapter 3 works through the algebra of AR and MA models and how the two relate.
- [ARIMA Modelling of Time Series](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html) - R Core Team, the documentation for `arima()`, including what the `order` argument accepts and why no constant is fitted after differencing.

=== step === complete
## Quick recap

You took a series apart and built each letter of ARIMA out of the data.

- The raw counts had a lag-1 correlation of 0.991, and nearly all of it was the shared climb rather than any day-to-day dependence.
- One difference turned 180 daily counts into 179 daily changes, averaging 0.58 cups and holding a steady level. That is d = 1.
- An AR coefficient is the slope of today's change on yesterday's change. Fitted by hand on the last 60 changes it was 0.70, and `arima()` gave 0.6968 on all 180.
- The AR term on its own left a lag-1 correlation of 0.159 in its residuals, because it cannot produce a shock that counts for one day and then stops.
- With both terms fitted, `ar1` was 0.4965 and `ma1` was 0.4114, near the 0.5 and 0.4 the series was built from, and the leftover correlation fell to -0.016.

So the next time a label like ARIMA(2, 1, 1) turns up in a report, you know what it says about the data: differenced once, today's change built from the two changes before it, one past shock still carried.

What we have not done is choose those three counts. Here you were told which orders to fit, and reading them off a series nobody has labelled for you is the next thing worth seeing.
