---
title: "ARIMA: what AR, I, and MA actually mean"
slug: "ARIMA-Mini-1"
description: "Busy days follow busy days, a one-off rush still echoes, and sales creep upward. Those three things are the AR, the I and the MA in ARIMA. Work each one out."
keywords: "what AR I MA mean, ARIMA explained, ARIMA p d q, autoregressive term, moving average term, differencing, ARIMA in R, time series forecasting"
mathjax: true
webr: true
date: "2026-08-23"
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
catalog_blurb: "What each letter in ARIMA means, worked out on one coffee shop."
---

=== step === cover
::eyebrow ARIMA from Zero
## ARIMA: what AR, I, and MA actually mean

Let's say you run a small coffee shop, and at the end of every day you write down one number: cups sold. Nothing else, just the count.

After a few months of that, three things start to stand out.

Busy days tend to follow busy days. A good day does not empty out overnight, and the day after it usually comes in a little above normal too.

A one-off rush leaves a small bump behind it. A tour bus parks outside on Tuesday and you sell thirty extra cups, and on Wednesday you are still a few cups up, because a handful of those people came back.

And the shop is slowly growing. Nothing dramatic. The line just drifts upward month after month.

Those three sentences are the AR, the MA and the I in ARIMA. Here they are side by side, in the order we are going to work them out.

::widget process-flow {"steps":[{"title":"AR (autoregressive)","sub":"today leans on the cups sold over the last few days"},{"title":"I (integrated)","sub":"the slow climb is taken out by differencing once"},{"title":"MA (moving average)","sub":"the surprise from one day echoes into the next"}]}

ARIMA reads like alphabet soup until each letter is tied to something you have actually seen. So we are going to take one coffee shop's 120 days of sales and pull the three letters out of it ourselves, one at a time.

By the end, a label like ARIMA(2,1,1) will read like a plain sentence: today depends on the last two days, the trend was taken out once, and one day of random noise still echoes.

=== step === concept
## The 120 days of coffee sales we will work with

Our shop is called Bean Street, and here is its record: one row per day, one number per row, 120 days of it.

The counts are typed in as a plain vector, so everything we do from here is computed out of them in front of you. Press Run to load the numbers and draw the whole run.

```r
# Load Bean Street's 120 daily cup counts, plot the run and take its average
cups <- c(180, 182, 184, 186, 191, 194, 194, 194, 191, 189, 189, 188,
          185, 185, 188, 190, 192, 193, 195, 193, 194, 195, 201, 205,
          206, 206, 208, 213, 216, 221, 224, 228, 230, 230, 229, 227,
          222, 223, 223, 223, 222, 222, 221, 220, 219, 218, 214, 209,
          204, 204, 201, 200, 200, 200, 201, 199, 198, 198, 202, 207,
          211, 215, 216, 217, 218, 216, 217, 217, 215, 211, 209, 210,
          211, 212, 216, 218, 218, 220, 221, 220, 218, 217, 216, 217,
          218, 218, 217, 217, 218, 214, 215, 216, 221, 224, 228, 230,
          233, 234, 234, 236, 235, 233, 232, 232, 230, 228, 226, 219,
          216, 216, 216, 216, 213, 216, 215, 215, 217, 216, 218, 222)

plot(cups, type = "l", col = "steelblue", lwd = 2,
     main = "Bean Street: cups sold per day, 120 days",
     xlab = "Day", ylab = "Cups sold")

head(cups, 12)
#>  [1] 180 182 184 186 191 194 194 194 191 189 189 188

mean(cups)
#> [1] 212.05
```

Look at that line for a second before we do anything to it.

The shop opens the record at 180 cups a day and closes it at 222. In between it wanders: up to 236 on its best day, back down to 198 in a slow patch, then up again. Across the whole run the average sits just above 212 cups a day.

Two things are deliberately left out of these numbers. There is no weekend spike and no holiday. A weekly rhythm is a separate idea with machinery of its own, and mixing it in now would only blur the three letters we are here for.

=== step === concept
## Why yesterday's cups predict today's cups

Let's start with the first of the three things you noticed at the shop: busy days follow busy days. That is easy to say and easy to believe. Now let's put a number on it.

Take the 120 days and pair each one with the day right before it. Day 2 pairs with day 1, day 3 pairs with day 2, and so on down to day 120 with day 119. That leaves 119 pairs, and every pair asks one small question: knowing yesterday, how close did today land?

Plot the pairs and measure how tightly they sit on a line.

```r
# Pair every day with the day before it and measure how closely the two move together
yesterday <- cups[1:119]
today     <- cups[2:120]

plot(yesterday, today, pch = 19, col = "steelblue",
     main = "Every day against the day before it",
     xlab = "Cups sold yesterday", ylab = "Cups sold today")

cor(yesterday, today)
#> [1] 0.9841258
```

The points sit almost exactly on a straight line, and the correlation comes back at 0.98.

That is about as high as correlations go in real data. Read literally, it says that if you tell me how many cups Bean Street sold yesterday, I can tell you very nearly how many it sold today.

And that is the first of the three letters.

=== step === concept
## The AR term and what its coefficient measures

AR stands for autoregressive, and the word is more literal than it looks. Regression means predicting one thing from another. Auto means self. So an autoregressive model predicts the series from the series: today's cups from yesterday's cups, out of the same single column of numbers.

The simplest version uses one previous day and is written AR(1). Here it is as an equation.

$$y_t = c + \phi\, y_{t-1} + \varepsilon_t$$

Reading it piece by piece:

- $y_t$ is today's cups, the number being predicted.
- $y_{t-1}$ is yesterday's cups.
- $\phi$ is the Greek letter phi, and it is the AR coefficient: the fraction of yesterday that carries into today. This is the one number the model has to learn.
- $c$ is a constant that sets the level the series sits around.
- $\varepsilon_t$ is today's random shock, the part nothing could have predicted.

So phi is what an AR term is really about. A phi near 1 means yesterday carries over almost completely and the series moves in long smooth runs. A phi near 0 means yesterday tells you nothing and the series jumps about.

Let's ask R for Bean Street's phi. The `Arima()` function from the forecast package fits the model, and its `order = c(1, 0, 0)` argument is the ARIMA label itself, typed as three numbers: one AR term, no differencing, no MA term. The fitted object is named after the label, so it stays easy to keep track of.

```r
# Fit an AR(1) model: predict each day's cups from the day before
library(forecast)

fit100 <- Arima(cups, order = c(1, 0, 0))
fit100
#> Series: cups
#> ARIMA(1,0,0) with non-zero mean
#>
#> Coefficients:
#>          ar1      mean
#>       0.9913  204.6599
#> s.e.  0.0096   15.3384
#>
#> sigma^2 = 6.049:  log likelihood = -279.29
#> AIC=564.58   AICc=564.79   BIC=572.94
```

The line to read is `ar1`, which is the fitted phi: 0.9913.

Taken at face value that says 99 percent of yesterday carries into today, which would make Bean Street's sales about as sticky as a series can get.

Hold on to that 0.9913. It is about to cause trouble.

=== step === quiz
## Quick check: what does an AR term look at?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The average of the last few days, smoothed into a single line. ::no
- Earlier values of the same series: one day back, two days back, and so on. ::ok That is it. An AR term has exactly one column to work with, the series itself, and all it does is reach backwards along it.
- Other things recorded on the same day, like the weather or the footfall on the street. ::no
- The errors the model made on earlier days. ::no An AR term only ever looks back at the series itself, at the actual values on earlier days. Not at other columns, not at a smoothed line, and not at past errors, which is a different letter with a different job.

=== step === concept
## Why the trend has to go, and what one difference does

A phi of 0.9913 should make you suspicious rather than pleased. Here is why.

Suppose phi were exactly 1. The equation would reduce to today equals yesterday plus a shock, with nothing pulling the series back toward any particular level. A series like that has no home to return to. It simply wanders off wherever the shocks push it, and Bean Street's fitted 0.9913 sits a hair away from exactly that.

And look at what the correlation was really picking up. Both columns of our pairing, yesterday and today, are creeping upward across the same 120 days. Two numbers that both climb will correlate strongly whether or not either one remembers the other at all. So a good part of that 0.98 is the climb rather than the stickiness.

Before we can ask an honest question about memory, the climb has to come out.

The move that takes it out is called differencing, and it is as simple as it sounds. Instead of the level, work with the change:

$$y'_t = y_t - y_{t-1}$$

That is, you replace "the shop sold 194 cups today" with "the shop sold 3 more cups than yesterday". One row goes missing, because day 1 has no day before it, so 120 levels become 119 changes.

The I in ARIMA stands for integrated, and d is the count of how many times you take that difference. Once is by far the most common, and once is what Bean Street needs, so d = 1.

Press Run, then press Show what changed, and watch the new column arrive on the first few days.

::widget table-transform {"code":"df %>% mutate(change = cups - lag(cups))","caption":"Every day now carries the change from the day before. Day 1 has no day before it, so its change is NA.","before":{"cols":["day","cups"],"rows":[[1,180],[2,182],[3,184],[4,186],[5,191],[6,194],[7,194],[8,194]]},"after":{"cols":["day","cups","change"],"rows":[[1,180,"NA"],[2,182,2],[3,184,2],[4,186,2],[5,191,5],[6,194,3],[7,194,0],[8,194,0]]}}

The cups column itself never moves. All that happens is that a second column appears beside it, and from here on that second column is the one we ask our questions of.

=== step === concept
## Where the growth went after differencing

So what do those 119 changes look like? The `diff()` function computes them in one call.

```r
# Turn the 120 daily levels into 119 day-to-day changes and look at them
changes <- diff(cups)

plot(changes, type = "h", col = "steelblue",
     main = "Bean Street: change in cups from one day to the next",
     xlab = "Day", ylab = "Change in cups")
abline(h = 0, col = "grey40")

mean(changes)
#> [1] 0.3529412
```

That picture is nothing like the raw line. There is no climb left in it. The bars flick above and below zero and stay in much the same band from the first day to the last, which is exactly what differencing was for.

The growth did not vanish, though. It got squeezed into the single number printed underneath: on an average day Bean Street sells about 0.35 cups more than the day before. Multiply that by the 119 changes and you get the 42 extra cups the shop picked up between day 1 and day 120.

So the trend has stopped being a slope across a chart and become one steady quantity. When we fit the full model, R will report that quantity under the name `drift`.

=== step === quiz
## Quick check: what changes when d = 1?

Bean Street has been differenced once, so the model now works on `changes` rather than on `cups`. What is it predicting now?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- How many cups the shop sells today. ::no
- How many more cups the shop sells today than it sold yesterday. ::ok Exactly. Differencing swaps the question, and every AR and MA term after it is answering the new one.
- How many cups the shop sells in an average week. ::no
- Whether today's count sits above or below the long run average. ::no Differencing does not summarise the series and it does not compare today with an average. It replaces each level with the step up or down from the day before, so the model stops predicting how many and starts predicting how many more.

=== step === concept
## The AR relationship once the trend is gone

Now the memory question can be asked honestly. Take the 119 changes and pair each one with the change on the day before it, the same pairing as before, run on the new column instead of the old one.

```r
# Pair each day's change with the previous day's change and correlate them
change_yesterday <- changes[1:118]
change_today     <- changes[2:119]

cor(change_yesterday, change_today)
#> [1] 0.5532371
```

It comes back at 0.55, where the raw levels gave 0.98.

That drop is the whole point of the exercise. Roughly half of what looked like memory was the shared climb. What survives the differencing is the real thing: a day whose change was positive is more often than not followed by another positive change, though you could never call tomorrow from yesterday alone.

Here are those 118 pairs plotted, with the correlation computed from the points on screen.

::widget chart-plotter {"data":[{"x":2,"y":2},{"x":2,"y":2},{"x":2,"y":5},{"x":5,"y":3},{"x":3,"y":0},{"x":0,"y":0},{"x":0,"y":-3},{"x":-3,"y":-2},{"x":-2,"y":0},{"x":0,"y":-1},{"x":-1,"y":-3},{"x":-3,"y":0},{"x":0,"y":3},{"x":3,"y":2},{"x":2,"y":2},{"x":2,"y":1},{"x":1,"y":2},{"x":2,"y":-2},{"x":-2,"y":1},{"x":1,"y":1},{"x":1,"y":6},{"x":6,"y":4},{"x":4,"y":1},{"x":1,"y":0},{"x":0,"y":2},{"x":2,"y":5},{"x":5,"y":3},{"x":3,"y":5},{"x":5,"y":3},{"x":3,"y":4},{"x":4,"y":2},{"x":2,"y":0},{"x":0,"y":-1},{"x":-1,"y":-2},{"x":-2,"y":-5},{"x":-5,"y":1},{"x":1,"y":0},{"x":0,"y":0},{"x":0,"y":-1},{"x":-1,"y":0},{"x":0,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-4},{"x":-4,"y":-5},{"x":-5,"y":-5},{"x":-5,"y":0},{"x":0,"y":-3},{"x":-3,"y":-1},{"x":-1,"y":0},{"x":0,"y":0},{"x":0,"y":1},{"x":1,"y":-2},{"x":-2,"y":-1},{"x":-1,"y":0},{"x":0,"y":4},{"x":4,"y":5},{"x":5,"y":4},{"x":4,"y":4},{"x":4,"y":1},{"x":1,"y":1},{"x":1,"y":1},{"x":1,"y":-2},{"x":-2,"y":1},{"x":1,"y":0},{"x":0,"y":-2},{"x":-2,"y":-4},{"x":-4,"y":-2},{"x":-2,"y":1},{"x":1,"y":1},{"x":1,"y":1},{"x":1,"y":4},{"x":4,"y":2},{"x":2,"y":0},{"x":0,"y":2},{"x":2,"y":1},{"x":1,"y":-1},{"x":-1,"y":-2},{"x":-2,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":1},{"x":1,"y":1},{"x":1,"y":0},{"x":0,"y":-1},{"x":-1,"y":0},{"x":0,"y":1},{"x":1,"y":-4},{"x":-4,"y":1},{"x":1,"y":1},{"x":1,"y":5},{"x":5,"y":3},{"x":3,"y":4},{"x":4,"y":2},{"x":2,"y":3},{"x":3,"y":1},{"x":1,"y":0},{"x":0,"y":2},{"x":2,"y":-1},{"x":-1,"y":-2},{"x":-2,"y":-1},{"x":-1,"y":0},{"x":0,"y":-2},{"x":-2,"y":-2},{"x":-2,"y":-2},{"x":-2,"y":-7},{"x":-7,"y":-3},{"x":-3,"y":0},{"x":0,"y":0},{"x":0,"y":0},{"x":0,"y":-3},{"x":-3,"y":3},{"x":3,"y":-1},{"x":-1,"y":0},{"x":0,"y":2},{"x":2,"y":-1},{"x":-1,"y":2},{"x":2,"y":4}],"geoms":["point"],"x":"change_yesterday","y":"change_today"}

The cloud leans upward, and that lean is the 0.55 you just computed. It is a lean and not a line, and an honest AR relationship usually looks about like this.

Which brings us to p. The p in the label is simply how many of those earlier changes the model is allowed to use.

A p of 1 uses yesterday's change. A p of 2 uses yesterday's and the one before that. That is the entire job of the first number in the label.

=== step === tryit
## Your turn: how strong is the two-day link in the changes?

If yesterday's change carries something about today's, does the change from two days ago carry anything?

Let's find out. The pairing you just ran took `changes[1:118]` against `changes[2:119]`, which lines every change up with the one directly before it. Slide the second slice along by one more day and you are comparing each change with the change from two days earlier instead.

Write those two lines and correlate them.

```r
# Correlate each day's change with the change from two days before
# The one-day version was: cor(changes[1:118], changes[2:119])
# Slide it along by one more day, then press Check.
```
::check {"regex": "changes[[]3:119", "gate": true, "difficulty": "beginner", "ok": "It comes back at 0.373. Weaker than the 0.553 at one day back, and still clearly there, which is the case for letting this shop have two AR terms rather than one.", "no": "Keep the same shape and move the window along: the first slice runs `changes[1:117]` and the second runs `changes[3:119]`. Put both of them inside `cor()`."}
::solution
```r
# Correlate each day's change with the change from two days before
two_days_back <- changes[1:117]
today_change  <- changes[3:119]

cor(two_days_back, today_change)
#> [1] 0.3731098
```

Two days back still carries something, one day back carries more, and the link fades the further back you reach. A p of 2 is what that pattern looks like once it is written into a model.

=== step === concept
## The MA term: how yesterday's rush echoes into today

Back to the second thing you noticed at the shop: a one-off rush leaves a bump behind it.

First, the word for the rush. A shock is the part of a day that nothing in the model saw coming. If everything the model knows about Bean Street says today should land at 210 cups and it lands at 240, then 30 of those cups are a shock.

It could have been a tour bus, a street festival, or a rainy afternoon that pushed people indoors. The model has no idea which of those it was, only that 30 cups turned up unannounced.

And nobody hands the model those surprises either. When R fits an ARIMA to real data it works the shocks out for itself, as the gap between what the model predicted for each day and what the shop actually sold.

MA stands for moving average, and what it actually does is carry a fraction of yesterday's shock into today. As an equation:

$$y_t = c + \varepsilon_t + \theta\, \varepsilon_{t-1}$$

- $\varepsilon_t$ is today's shock, the surprise arriving today.
- $\varepsilon_{t-1}$ is yesterday's shock, the surprise that arrived yesterday.
- $\theta$ is the Greek letter theta, and it is the MA coefficient: the fraction of yesterday's surprise still showing in today's number.
- $c$ is the level the series sits at when nothing surprising happens.

And q counts how many past shocks get carried. A q of 1 carries yesterday's. A q of 2 carries yesterday's and the one before that.

Watch it happen on ten made-up Bean Street days. Nine of them are ordinary, day 4 gets the tour bus, and theta is set to 0.3.

```r
# Build ten days with one surprise rush, and let 0.3 of it echo into the next day
shocks <- c(0, 0, 0, 30, 0, 0, 0, 0, 0, 0)
yesterdays_shock <- c(0, shocks[1:9])

echoed <- 210 + shocks + 0.3 * yesterdays_shock
echoed
#>  [1] 210 210 210 240 219 210 210 210 210 210

plot(echoed, type = "b", pch = 19, col = "steelblue", ylim = c(200, 245),
     main = "One rush on day 4, and the echo it leaves on day 5",
     xlab = "Day", ylab = "Cups sold")
abline(h = 210, col = "grey60", lty = 2)
```

Day 4 is the tour bus: 210 plus the full 30, so 240 cups.

Day 5 is the letter we are after. Nothing happens on day 5, no bus, no festival, no shock of its own, and the shop still sells 219 cups. That is nine above normal, purely because 0.3 of yesterday's 30 is still sitting in the number.

By day 6 the echo has gone completely, because a q of 1 carries exactly one day of surprise and not a day more. That is the whole mechanism: a shock lands, part of it repeats once, and then it is done.

=== step === concept
## Why MA is not a moving average

That name causes more confusion than any other word in ARIMA, so let's deal with it head on.

When most people say moving average they mean smoothing: slide a window along the series, average the values inside it, and draw the tidier line that comes out. Here is that done seven days wide over Bean Street's raw counts.

```r
# Draw a 7-day rolling average on top of the raw daily cups
smoothed <- stats::filter(cups, rep(1/7, 7))

plot(cups, type = "l", col = "grey70", lwd = 2,
     main = "A 7-day rolling average over the daily cups",
     xlab = "Day", ylab = "Cups sold")
lines(smoothed, col = "firebrick", lwd = 2)
```

The red line is a rolling average, and it is built out of the counts themselves. Each red point is the mean of seven grey ones. Nothing is being predicted and nothing is being learned, it is simply a calmer drawing of the same series.

The MA term in ARIMA does none of that. It never averages the counts and it never smooths anything. It works on the shocks, the leftover surprises, and it feeds a fraction of the last one back into today.

[WARNING]
A rolling average is computed from the values of the series. An MA term is computed from the errors. If a smoothed line is what you picture when you read q, you are picturing the wrong thing entirely.

The two ideas share a name and nothing else. Read the MA in ARIMA as "the last surprise still echoes" and the confusion does not come back.

=== step === quiz
## Quick check: which one does the MA term use?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The cup counts on the previous few days. ::no
- The rolling average of the previous few days. ::no
- The surprises from the previous few days, the parts nothing predicted. ::ok Right. The MA term reaches back for the errors and never for the values, which is why the day after the tour bus came in nine cups high with nothing happening on it at all.
- The difference between today's count and yesterday's. ::no Only one of these is an error. Past counts belong to the AR term, a rolling average belongs to smoothing and has no place in the model, and the difference between two days is what the I term produces. The MA term carries forward the part of a day that nobody saw coming.

=== step === concept
## How to read ARIMA(p, d, q) as a sentence

Every piece is on the table now, so here is the label itself.

ARIMA(p, d, q) is three numbers in a fixed order, and each of them fills the same slot in the same sentence every time.

| Letter | Number | What it counts | The slot it fills |
|---|---|---|---|
| AR | p | how many earlier days go in | today depends on the last p days |
| I | d | how many times you difference | the trend was taken out d times |
| MA | q | how many past shocks are carried | q days of random noise still echo |

Read straight across, the template is this: today depends on the last p days, the trend was taken out d times, and q days of random noise still echo.

Now fill in Bean Street's own numbers, ARIMA(2,1,1):

**today depends on the last two days, the trend was taken out once, and one day of random noise still echoes.**

That is the sentence we were after, and every part of it is now something you have watched work.

Here are a few more, read the same way:

- ARIMA(1,0,0) says today depends on yesterday alone, nothing was differenced, and no shock is carried. A pure AR(1), which is the model we fitted first.
- ARIMA(0,0,1) says today leans on no earlier day at all, nothing was differenced, and yesterday's surprise echoes once. A pure MA(1).
- ARIMA(0,1,0) says nothing survives except a single difference. Today's change is pure noise, which is the textbook random walk.

=== step === concept
## Fitting ARIMA(2,1,1) to the coffee shop

Time to fit all three letters at once to the shop's own 120 days and see what comes back.

The `order = c(2, 1, 1)` argument is the label typed out, in the same p, d, q order as always. The `include.drift = TRUE` argument asks R to also estimate that steady climb we squeezed into one number.

```r
# Fit ARIMA(2,1,1) with drift to Bean Street's 120 days
fit211 <- Arima(cups, order = c(2, 1, 1), include.drift = TRUE)
fit211
#> Series: cups
#> ARIMA(2,1,1) with drift
#>
#> Coefficients:
#>          ar1     ar2     ma1   drift
#>       0.2537  0.2370  0.2494  0.4222
#> s.e.  0.7516  0.4113  0.7674  0.4450
#>
#> sigma^2 = 4.149:  log likelihood = -251.67
#> AIC=513.35   AICc=513.88   BIC=527.24
```

Four numbers, and each one belongs to a letter you have already met.

- `ar1` at 0.2537 and `ar2` at 0.2370 are the two AR coefficients, p = 2 of them. Both are phi, one for the previous day and one for the day before that.
- `ma1` at 0.2494 is theta, the single MA coefficient, q = 1 of it. About a quarter of yesterday's surprise is still showing up today.
- `drift` at 0.4222 is the steady climb, measured in cups per day. It is the model's own estimate of the growth that showed up as an average change of 0.35 a few minutes ago, and the two differ a little because the model works the climb out alongside the AR and MA terms instead of on its own.

The lines underneath, from `sigma^2` down to the AIC and BIC scores, say how well the whole model fits the 120 days. They matter when you are choosing between competing models, and they have nothing to say about what the letters mean.

The d never gets a coefficient of its own, and that is worth noticing. Differencing is not something the model estimates, it is something done to the data before any estimating starts, which is why the 1 in the middle of the label has no row in that table.

[NOTE]
Look at the `s.e.` row underneath, which gives the standard error of each estimate. For `ar1` it reads 0.7516 against an estimate of 0.2537, so this fit is nowhere near certain that the AR terms are where the credit belongs. AR and MA terms can describe overlapping behaviour and trade off against each other, which leaves the individual coefficients loose. Reading a label is one job, and trusting every number inside it is a different one.

=== step === concept
## After differencing, AR and MA act on the changes
::prose-only the correction is a single word in a sentence the reader has already built, and the numbers it corrects sit on the fit printed just above

There is one word in that sentence doing the wrong job, and it is the most commonly missed thing about the whole label. The word is days.

When d is 0, the AR and MA terms work on the values themselves, and today depends on the last two days exactly as the sentence claims. Once d is 1, the model has stopped looking at cups altogether. It is looking at the changes.

So `ar1` and `ar2` in Bean Street's fit do not multiply the last two counts. They multiply the last two changes. And `ma1` does not adjust the count either, it adjusts the change.

The honest reading of ARIMA(2,1,1) goes like this: today's change depends on the last two changes, plus about a quarter of yesterday's surprise, plus a steady 0.42 cups of growth.

The cups come back at the end, rebuilt by adding that predicted change onto yesterday's actual count. That final addition is where the word integrated comes from. Differencing takes the series apart into steps, and adding the steps back up puts it together again.

Get that one word right and the label stops being a formula and starts being a description of the shop.

=== step === quiz
## Quick check: reading a label you have not seen

Somebody hands you a model written ARIMA(0,2,3). Which sentence reads it correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Today depends on nothing whatsoever, so the model is empty. ::no
- Today's change depends on the last two days, and three shocks are carried. ::no
- No earlier values go in at all, the series was differenced twice, and three days of surprise still echo. ::ok Yes, and you read it straight off the order: p first, then d, then q. A p of 0 is perfectly normal; it only means everything the model has to work with is surprises.
- Two earlier days go in, three differences were taken, and no shocks are carried. ::no The three numbers always arrive in the same order: p, then d, then q. So 0, 2, 3 means no AR terms at all, two rounds of differencing, and three past shocks carried forward. A p of 0 does not make the model empty, it leaves the AR slot unused.

=== step === quiz
## Quick check: which letter would you change?

You difference a series once and plot the changes, and the changes themselves are still drifting steadily upward from one end of the chart to the other. Which number in the label would you raise?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- p, so that more earlier days go into the prediction. ::no
- d, and difference the changes a second time. ::ok Right. A trend that survives one difference is the signature of a d that is too low, and differencing the changes takes it to d = 2.
- q, so that more past shocks are carried. ::no
- All three at once, since the model is clearly too small. ::no A leftover trend is a d problem and nothing else. AR and MA terms both describe how a series wobbles around its level, so no quantity of them will take a slope out. Difference the changes once more and d becomes 2, which is as far as ordinary series ever need to go.

=== step === tryit
## Your turn: fit ARIMA(0,1,1) and read what it says

One last fit, and this time the letters are yours to choose.

Drop both AR terms and keep everything else: no earlier changes, one difference, one day of echo, and the steady climb. That is ARIMA(0,1,1) with drift.

The `cups` vector and `Arima()` are both still loaded, so it is a one-argument change from the fit you have just seen. Write it and press Check.

```r
# Fit the shop with no AR terms, one difference and one shock carried
# The last fit used order = c(2, 1, 1).
# Change the order, keep include.drift = TRUE, then press Check.
```
::check {"regex": "order\\s*=\\s*c[(]0,\\s*1,\\s*1[)]", "gate": true, "difficulty": "intermediate", "ok": "That returns `ma1` at 0.4190 and `drift` at 0.3656, and the sentence it makes is a short one: today's change is a steady 0.37 cups of growth plus about two fifths of yesterday's surprise, and nothing else at all.", "no": "Only the first number in the order moves. Keep `Arima(cups, ...)` and `include.drift = TRUE`, and write the order as `c(0, 1, 1)`."}
::solution
```r
# Fit ARIMA(0,1,1) with drift: no AR terms, one difference, one shock carried
fit011 <- Arima(cups, order = c(0, 1, 1), include.drift = TRUE)
fit011
#> Series: cups
#> ARIMA(0,1,1) with drift
#>
#> Coefficients:
#>          ma1   drift
#>       0.4190  0.3656
#> s.e.  0.0684  0.2769
#>
#> sigma^2 = 4.631:  log likelihood = -259.13
#> AIC=524.27   AICc=524.48   BIC=532.61
```

Look at the standard errors this time. `ma1` comes back at 0.4190 with a standard error of 0.0684, a far tighter estimate than any single coefficient in the four-term fit. With fewer terms in the model, there is less for them to fight over.

=== step === concept
## References

- [Forecasting: Principles and Practice, chapter 9](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos (3rd edition). The standard free reference for the notation, the backshift form of the equations, and how p, d and q are chosen in practice.
- [Time Series Analysis: Forecasting and Control](https://doi.org/10.1002/9781118619193) - Box, Jenkins and Reinsel (4th edition, Wiley 2008). The book the ARIMA notation comes from, including the original identify, estimate and check procedure.
- [Time Series Analysis and Its Applications](https://doi.org/10.1007/978-3-319-52452-8) - Shumway and Stoffer (4th edition, Springer 2017), chapter 3. A fuller mathematical treatment of AR, MA and ARIMA models, worked with R examples.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). How the fitting and the automatic order search are actually implemented.
- [Arima function reference](https://pkg.robjhyndman.com/forecast/reference/Arima.html) - the documentation for the function used throughout, including what `include.drift` does.

=== step === complete
## Quick recap

You took one coffee shop's daily cup counts and pulled all three letters out of them yourself. Here they are together:

- AR is memory of values, and p counts how many earlier days go in. Bean Street's changes correlated at 0.553 one day back and 0.373 two days back, which is what a p of 2 is for.
- I is trend removal, and d counts the differences. One difference turned 120 daily levels into 119 daily changes, and turned a rising line into a steady 0.35 cups a day.
- MA is memory of surprises, and q counts how many past shocks are carried. A 30 cup rush with theta at 0.3 left 9 cups behind on the following day and nothing at all after that.

Fitted to the shop's own numbers, ARIMA(2,1,1) with drift reads out as one sentence: today's change depends on the last two changes, plus about a quarter of yesterday's surprise, plus a steady 0.42 cups of growth a day.

The obvious question left over is where the 2, the 1 and the 1 came from, because so far they were simply handed to you. The series itself will tell you that, through two plots that read the memory in it directly.

Well done for getting through this one.
