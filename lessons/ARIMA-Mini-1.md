---
title: "ARIMA: what AR, I, and MA actually mean"
slug: "ARIMA-Mini-1"
description: "AR, I and MA are three counts you can read off one coffee shop's daily sales. Build each one of them in R, then read an ARIMA order like an ordinary sentence."
keywords: "what AR I and MA mean, ARIMA explained, ARIMA in R, autoregressive term, moving average term, differencing a time series, ARIMA order p d q, arima function in R"
mathjax: false
webr: true
date: "2026-09-06"
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
catalog_blurb: "What each letter of ARIMA counts, and how to read an ARIMA order."
---

=== step === cover
## ARIMA: what AR, I, and MA actually mean

Today we are going to take ARIMA apart, one letter at a time, and see exactly what each letter counts.

Here is the series we will do it on. A coffee shop counted how many cups it sold on each of its first 120 trading days: 180 cups on day 1, and 473 on day 120. The shop recorded one number a day and nothing else.

::widget chart-plotter {"data":[{"x":1,"y":180},{"x":2,"y":181},{"x":3,"y":188},{"x":4,"y":186},{"x":5,"y":189},{"x":6,"y":191},{"x":7,"y":185},{"x":8,"y":181},{"x":9,"y":184},{"x":10,"y":192},{"x":11,"y":209},{"x":12,"y":224},{"x":13,"y":229},{"x":14,"y":241},{"x":15,"y":257},{"x":16,"y":258},{"x":17,"y":259},{"x":18,"y":265},{"x":19,"y":266},{"x":20,"y":273},{"x":21,"y":270},{"x":22,"y":263},{"x":23,"y":257},{"x":24,"y":263},{"x":25,"y":264},{"x":26,"y":272},{"x":27,"y":287},{"x":28,"y":304},{"x":29,"y":322},{"x":30,"y":336},{"x":31,"y":342},{"x":32,"y":346},{"x":33,"y":348},{"x":34,"y":344},{"x":35,"y":334},{"x":36,"y":328},{"x":37,"y":329},{"x":38,"y":331},{"x":39,"y":334},{"x":40,"y":335},{"x":41,"y":328},{"x":42,"y":333},{"x":43,"y":343},{"x":44,"y":346},{"x":45,"y":345},{"x":46,"y":344},{"x":47,"y":346},{"x":48,"y":351},{"x":49,"y":358},{"x":50,"y":364},{"x":51,"y":369},{"x":52,"y":377},{"x":53,"y":389},{"x":54,"y":404},{"x":55,"y":404},{"x":56,"y":405},{"x":57,"y":415},{"x":58,"y":416},{"x":59,"y":434},{"x":60,"y":448},{"x":61,"y":447},{"x":62,"y":443},{"x":63,"y":437},{"x":64,"y":424},{"x":65,"y":405},{"x":66,"y":388},{"x":67,"y":372},{"x":68,"y":356},{"x":69,"y":351},{"x":70,"y":346},{"x":71,"y":334},{"x":72,"y":324},{"x":73,"y":323},{"x":74,"y":324},{"x":75,"y":329},{"x":76,"y":335},{"x":77,"y":326},{"x":78,"y":312},{"x":79,"y":301},{"x":80,"y":299},{"x":81,"y":309},{"x":82,"y":325},{"x":83,"y":344},{"x":84,"y":356},{"x":85,"y":362},{"x":86,"y":366},{"x":87,"y":373},{"x":88,"y":379},{"x":89,"y":390},{"x":90,"y":386},{"x":91,"y":374},{"x":92,"y":370},{"x":93,"y":355},{"x":94,"y":344},{"x":95,"y":344},{"x":96,"y":337},{"x":97,"y":335},{"x":98,"y":340},{"x":99,"y":339},{"x":100,"y":347},{"x":101,"y":365},{"x":102,"y":383},{"x":103,"y":411},{"x":104,"y":437},{"x":105,"y":454},{"x":106,"y":461},{"x":107,"y":462},{"x":108,"y":460},{"x":109,"y":472},{"x":110,"y":492},{"x":111,"y":509},{"x":112,"y":521},{"x":113,"y":525},{"x":114,"y":522},{"x":115,"y":516},{"x":116,"y":510},{"x":117,"y":492},{"x":118,"y":472},{"x":119,"y":466},{"x":120,"y":473}],"geoms":["line"],"x":"day","y":"cups"}

Three separate things are going on in that line, and each one is a letter in ARIMA.

The first is easy to spot: the line ends far above where it starts, so the level keeps climbing. The second is that the line walks rather than jumps, so most days sit close to the day before them. The third takes a little more looking. Every so often one day pulls clear of its neighbours, and the day after it has not come all the way back.

That climb is the I. The walk from one day to the next is the AR. The day that has not come all the way back is the MA. ARIMA is a count of those three things and nothing else.

The climb is the easiest of the three to pin down, so we start there.

=== step === concept
## The I: differencing the climb out of daily sales

Let's start with the data, because everything we measure from here comes out of these 120 numbers.

The series is simulated, so we know exactly what went into it: a small daily drift, a share of the last two days of movement, and a random amount on top of each day. Each of those pieces has its own name in ARIMA.

Press Run.

```r
# Build 120 days of daily cups sold at the coffee shop
set.seed(16)
daily_error <- round(rnorm(120, 0, 6), 1)

daily_change <- numeric(120)
daily_change[1] <- 0
daily_change[2] <- 0.30 + 0.35 * daily_change[1] +
                   daily_error[2] + 0.6 * daily_error[1]
for (t in 3:120) {
  daily_change[t] <- 0.30 + 0.35 * daily_change[t - 1] +
                     0.20 * daily_change[t - 2] +
                     daily_error[t] + 0.6 * daily_error[t - 1]
}

cups <- round(180 + cumsum(daily_change))

head(cups, 8)
#> [1] 180 181 188 186 189 191 185 181
c(day_1 = cups[1], day_120 = cups[120], busiest = max(cups))
#>   day_1 day_120 busiest
#>     180     473     525
```

`cups` holds one number per trading day. `cumsum()` is the line that turns those daily changes into levels: day 1 sits at 180, and every day after it adds its own change to the day before. The shop sold 180 cups on day 1, 473 on day 120, and 525 on its busiest day.

Now here is the problem that creates. A forecasting model needs the series to behave the same way at the end as it did at the start: roughly the same average level, and roughly the same amount of wobble around it. A series like that is called **stationary**, and this one is clearly not, because the average level at the end is more than twice the average level at the start.

Watch what that does to the most obvious measurement you could take.

```r
# Measure how close each day is to the day before it
n_days <- length(cups)
round(cor(cups[-1], cups[-n_days]), 3)
#> [1] 0.993
```

`cups[-1]` drops the first day and `cups[-n_days]` drops the last, so the two vectors line up as today against yesterday. The correlation between them is 0.993, which looks enormous.

It is not worth much, though. Any series that moves in small steps gives you a number like that. A day at 470 is followed by a day near 470 for the plain reason that the shop's sales climbed there gradually, one small step at a time. Most of the 0.993 is that climb and not any real memory in the day-to-day trading.

So we take the climb out. Instead of modelling the level, we model the change from one day to the next. Subtracting each day from the one after it is called **differencing**, and `diff()` does it in one call.

```r
# Difference the series once and describe the daily changes it leaves
change <- diff(cups)

length(change)
#> [1] 119
round(mean(change), 1)
#> [1] 2.5
round(sd(change), 1)
#> [1] 9.9
```

That leaves 119 changes out of 120 days. Differencing costs you the first day, because day 1 has no day before it to subtract from.

The changes average 2.5 cups up, with a spread of 9.9 cups either side of that, and those two numbers hold all the way along instead of drifting. That is the stationary series the model needs.

Doing this once is what **d = 1** means. The **I** stands for integrated, which is the name for the step back the other way: adding the changes up again at the end, so a forecast comes out in cups sold rather than in changes.

Here are the first six days going through it. Run the block to see the change column appear, then press Show what changed to see which row differencing costs you.

::widget table-transform {"code": "df %>% mutate(change = cups - lag(cups)) %>% filter(!is.na(change))", "caption": "Day 1 has no day before it to subtract from, so six days of levels become five changes.", "before": {"cols": ["day", "cups"], "rows": [[1, 180], [2, 181], [3, 188], [4, 186], [5, 189], [6, 191]]}, "after": {"cols": ["day", "cups"], "rows": [[2, 181], [3, 188], [4, 186], [5, 189], [6, 191]]}}

And here is the whole differenced series.

```r
# Plot the 119 daily changes to check that no climb is left
plot(change, type = "l", col = "grey40",
     main = "Daily change in cups sold, after differencing once",
     xlab = "Day", ylab = "Change in cups")
abline(h = 0, col = "red", lwd = 2)
```

The line crosses the red zero line over and over instead of wandering off in one direction. Nothing is left in here that a steady climb would explain. Whatever pattern does survive is real day-to-day memory, and the other two letters are what pick it up.

=== step === concept
## The AR: how much of yesterday's change carries into today

The differenced series has no climb in it, so anything left in it is memory. Let's measure how much.

Pair each day's change with the change on the day before it. Day 2 changed by 1 cup and day 3 changed by 7, so that is one pair: yesterday 1, today 7. Doing that all the way along gives 118 pairs, and here they are.

::widget chart-plotter {"data":[{"x":1,"y":7},{"x":7,"y":-2},{"x":-2,"y":3},{"x":3,"y":2},{"x":2,"y":-6},{"x":-6,"y":-4},{"x":-4,"y":3},{"x":3,"y":8},{"x":8,"y":17},{"x":17,"y":15},{"x":15,"y":5},{"x":5,"y":12},{"x":12,"y":16},{"x":16,"y":1},{"x":1,"y":1},{"x":1,"y":6},{"x":6,"y":1},{"x":1,"y":7},{"x":7,"y":-3},{"x":-3,"y":-7},{"x":-7,"y":-6},{"x":-6,"y":6},{"x":6,"y":1},{"x":1,"y":8},{"x":8,"y":15},{"x":15,"y":17},{"x":17,"y":18},{"x":18,"y":14},{"x":14,"y":6},{"x":6,"y":4},{"x":4,"y":2},{"x":2,"y":-4},{"x":-4,"y":-10},{"x":-10,"y":-6},{"x":-6,"y":1},{"x":1,"y":2},{"x":2,"y":3},{"x":3,"y":1},{"x":1,"y":-7},{"x":-7,"y":5},{"x":5,"y":10},{"x":10,"y":3},{"x":3,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":2},{"x":2,"y":5},{"x":5,"y":7},{"x":7,"y":6},{"x":6,"y":5},{"x":5,"y":8},{"x":8,"y":12},{"x":12,"y":15},{"x":15,"y":0},{"x":0,"y":1},{"x":1,"y":10},{"x":10,"y":1},{"x":1,"y":18},{"x":18,"y":14},{"x":14,"y":-1},{"x":-1,"y":-4},{"x":-4,"y":-6},{"x":-6,"y":-13},{"x":-13,"y":-19},{"x":-19,"y":-17},{"x":-17,"y":-16},{"x":-16,"y":-16},{"x":-16,"y":-5},{"x":-5,"y":-5},{"x":-5,"y":-12},{"x":-12,"y":-10},{"x":-10,"y":-1},{"x":-1,"y":1},{"x":1,"y":5},{"x":5,"y":6},{"x":6,"y":-9},{"x":-9,"y":-14},{"x":-14,"y":-11},{"x":-11,"y":-2},{"x":-2,"y":10},{"x":10,"y":16},{"x":16,"y":19},{"x":19,"y":12},{"x":12,"y":6},{"x":6,"y":4},{"x":4,"y":7},{"x":7,"y":6},{"x":6,"y":11},{"x":11,"y":-4},{"x":-4,"y":-12},{"x":-12,"y":-4},{"x":-4,"y":-15},{"x":-15,"y":-11},{"x":-11,"y":0},{"x":0,"y":-7},{"x":-7,"y":-2},{"x":-2,"y":5},{"x":5,"y":-1},{"x":-1,"y":8},{"x":8,"y":18},{"x":18,"y":18},{"x":18,"y":28},{"x":28,"y":26},{"x":26,"y":17},{"x":17,"y":7},{"x":7,"y":1},{"x":1,"y":-2},{"x":-2,"y":12},{"x":12,"y":20},{"x":20,"y":17},{"x":17,"y":12},{"x":12,"y":4},{"x":4,"y":-3},{"x":-3,"y":-6},{"x":-6,"y":-6},{"x":-6,"y":-18},{"x":-18,"y":-20},{"x":-20,"y":-6},{"x":-6,"y":7}],"geoms":["point"],"x":"yesterday","y":"today"}

The cloud leans up to the right, and the widget prints the size of that lean in the corner: r = 0.74. Days that follow a rise tend to rise again, and days that follow a drop tend to drop again.

That lean is the AR part. To turn it into a weight, regress today's change on yesterday's.

```r
# Line up each change against the change before it and fit the weight
n_change <- length(change)
today <- change[-1]
yesterday <- change[-n_change]

ar_fit <- lm(today ~ yesterday)
round(coef(ar_fit), 3)
#> (Intercept)   yesterday
#>       0.675       0.742
```

Read the second number as a weight: `change_today = 0.675 + 0.742 * change_yesterday`, plus whatever is new that day. About three quarters of yesterday's movement is still in today's.

The size of that weight is the whole story of an AR term. A weight near 1 would mean almost all of yesterday's movement carries into today. A weight near 0 would mean every day starts fresh.

That was one past value. Does anything survive two days back? Same measurement, one day further out.

```r
# Check how much of the change two days back is still there
two_days_back <- change[1:(n_change - 2)]
round(cor(change[-(1:2)], two_days_back), 3)
#> [1] 0.459
```

Two days back it reads 0.459, weaker than 0.742 but nowhere near nothing. Careful what you read into that, though. Yesterday's change already pulled about three quarters of the day before it into itself, so part of that 0.459 is one weight passed along twice rather than a second, separate helping of memory. Telling those two apart takes a plot we are not building today.

What is not in doubt is that a model can keep more than one past value, and **p** is that count: how many past values it keeps, each with its own weight. p = 1 keeps yesterday. p = 2 keeps yesterday and the day before, and fits a separate weight for each. AR is short for autoregressive, which is the idea in one word, since what we just did was regress the series on itself.

=== step === quiz
## Quick check: what the 0.993 and the 0.742 each measure

The raw cups correlated 0.993 with the previous day. After differencing, the changes correlate 0.742 with the previous change. Which reading of those two numbers is right?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Differencing wiped out most of the memory: 0.993 fell to 0.742, so about a quarter of it was lost on the way. ::no
- Most of the 0.993 was the climb. Once the climb is differenced out, 0.742 is the memory that was really in the daily trading. ::ok Exactly. The two numbers describe two different series, so one is not a shrunken version of the other.
- The 0.993 already shows very strong memory, so this series does not need differencing at all. ::no
- The 0.742 is small enough that the daily changes are close to random noise now. ::no Careful: 0.993 and 0.742 come from two different series, so the drop between them is not a loss of anything. The 0.993 came from the levels, where a day near 470 follows a day near 470 simply because the shop's sales climbed there gradually. The 0.742 came from the changes with that climb removed, and a correlation that size is a long way from noise.

=== step === concept
## The MA: how much of yesterday's error carries into today

An AR term carries past values forward. The other letter carries something quite different.

Start with what it carries. A **forecast error** is the gap between what a model predicted for a day and what the shop actually sold that day. It is the part of a day's sales that nothing could have seen coming: a coach party that walked in, a downpour that kept everyone home.

The series we built has 120 of those in it, one per day, sitting in `daily_error`. They were drawn independently of each other, so on their own they should carry no memory at all. Let's confirm that before we change it.

```r
# Check whether the daily errors carry any memory of their own
round(cor(daily_error[-1], daily_error[-120]), 3)
#> [1] 0.036
```

The correlation is 0.036, which is nothing. Yesterday's error tells you nothing about today's, and that is exactly what an error is supposed to be.

Now add a share of yesterday's error into each day: 0.6 of it, on top of the day's own error. `c(0, head(daily_error, -1))` is the error vector shifted one day forward, with a 0 in front for the day that has no yesterday.

```r
# Add 0.6 of yesterday's error into each day, then measure and plot what that does
ma_series <- daily_error + 0.6 * c(0, head(daily_error, -1))

n_error <- length(ma_series)
round(c(lag_1 = cor(ma_series[-1], ma_series[-n_error]),
        lag_2 = cor(ma_series[-(1:2)], ma_series[1:(n_error - 2)])), 3)
#> lag_1 lag_2
#> 0.462 0.061

plot(ma_series, type = "l", col = "grey40",
     main = "Today's error plus 0.6 of yesterday's error",
     xlab = "Day", ylab = "Cups above or below normal")
abline(h = 0, col = "red", lwd = 2)
```

One day apart, the correlation went from 0.036 to 0.462. Two days apart it reads 0.061, which is back to nothing.

That is how an MA term shows up in a series. We kept one past error, so neighbouring days are linked and days two apart are not. The memory is exactly as deep as the number of errors kept, and then it is over.

**q** is that count: how many past forecast errors the model keeps, each with its own weight. We kept one here, so q = 1.

So AR carries past values and MA carries past errors. Written down they look similar. What they do to a series is not similar at all.

=== step === concept
## How AR memory and MA memory differ after one unusual day

Take the same shop over a quiet 15-day stretch, with one festival on day 5 that brings in 60 extra cups. Nothing else happens in those 15 days.

Under an AR term, those 60 cups go into day 5's value, and day 6 is built from day 5's value, so a share of the 60 is passed along. Then a share of that share goes into day 7, and so on. Under an MA term, the 60 cups are a forecast error, and only the last q errors are kept at all. With q = 1 there is exactly one day of carry, and after that the term has nothing left to pass on.

Here are those 60 extra cups sent through both, using the same two weights that built the shop's series back at the start: 0.35 on the AR side, 0.6 on the MA side.

```r
# Send one festival day of 60 extra cups through an AR term and an MA term
shock <- rep(0, 15)
shock[5] <- 60

ar_effect <- numeric(15)
ar_effect[1] <- shock[1]
for (t in 2:15) {
  ar_effect[t] <- 0.35 * ar_effect[t - 1] + shock[t]
}

ma_effect <- shock + 0.6 * c(0, head(shock, -1))

data.frame(day     = 5:9,
           ar_term = round(ar_effect[5:9], 2),
           ma_term = round(ma_effect[5:9], 2))
#>   day ar_term ma_term
#> 1   5   60.00      60
#> 2   6   21.00      36
#> 3   7    7.35       0
#> 4   8    2.57       0
#> 5   9    0.90       0
```

Read the AR column down: 60, then 21, then 7.35, then 2.57, then 0.9. Each day keeps 0.35 of the day before, so the festival's 60 cups shrink by the same fraction every day and, strictly speaking, never reach zero. They only get too small to matter.

Now read the MA column: 60, then 36, then nothing. The 36 is 0.6 of 60, the single error the term keeps. By day 7, day 5's error has fallen out of the window and the festival's 60 cups are gone completely.

Here are the two fades drawn together.

```r
# Plot both fades so the difference is visible day by day
plot(1:15, ar_effect, type = "b", pch = 16, col = "#1f7a55", ylim = c(0, 62),
     main = "One festival day of 60 cups, under AR and under MA",
     xlab = "Day", ylab = "Extra cups still showing")
lines(1:15, ma_effect, type = "b", pch = 17, col = "#b5631a")
legend("topright", legend = c("AR term, weight 0.35", "MA term, weight 0.6"),
       col = c("#1f7a55", "#b5631a"), pch = c(16, 17), bty = "n")
```

[KEY INSIGHT]
AR memory fades. MA memory stops. That single difference is why p and q are two separate questions and not one.

[WARNING]
The moving average in MA is not the moving average you already know. Smoothing a series by averaging neighbouring data points is a different operation that happens to share the name. An MA term is a weighted sum of past forecast errors, and cups sold never enter it.

=== step === concept
## How to read an ARIMA(p, d, q) order

An ARIMA order is three counts, always written in the same three places.

- **p** is how many past values are kept, each with its own weight. That is the AR part.
- **d** is how many times the series is differenced. That is the I part.
- **q** is how many past forecast errors are kept, each with its own weight. That is the MA part.

The sequence matters here. The differencing happens first, even though the I sits in the middle of the name. The series is differenced, and the AR and MA terms then work on the differenced series, never on the raw levels.

So ARIMA(2, 1, 1) on the shop's daily sales is three instructions in this order.

::widget process-flow {"steps": [{"title": "d = 1", "sub": "difference once, so we model changes"}, {"title": "p = 2", "sub": "keep the last two changes, each with a weight"}, {"title": "q = 1", "sub": "keep one past forecast error, with a weight"}]}

Said out loud: difference the cups once, build today's change out of the last two changes, and add a weighted share of the error the model made yesterday.

Every other ARIMA order is those same three slots with different counts in them.

| Order | What it says |
|---|---|
| ARIMA(0, 1, 0) | Difference once, keep no memory at all. Today's change is pure error. This one has a name of its own: a random walk. |
| ARIMA(1, 0, 0) | No differencing, one past value, no past errors. A plain AR model of order 1. |
| ARIMA(0, 0, 1) | No differencing, no past values, one past error. A plain MA model of order 1. |
| ARIMA(2, 1, 1) | Difference once, two past changes, one past error. The one spelled out above. |

Reading an order is now just reading three numbers off in the right places.

=== step === concept
## Fitting ARIMA(2, 1, 1) in R and reading the coefficients

`arima()` takes the series and the order, and fits all three terms together.

```r
# Fit ARIMA(2, 1, 1) to the 120 days of cups sold
fit <- arima(cups, order = c(2, 1, 1))
fit
#>
#> Call:
#> arima(x = cups, order = c(2, 1, 1))
#>
#> Coefficients:
#>          ar1     ar2     ma1
#>       0.2471  0.2847  0.7487
#> s.e.  0.1519  0.1388  0.1102
#>
#> sigma^2 estimated as 39.88:  log likelihood = -388.74,  aic = 785.49
```

Notice what we passed in. `cups` is the raw levels, not `change`, because the d = 1 inside the order tells `arima()` to do the differencing itself.

Three coefficients came back, one per term.

- `ar1` is 0.2471, the weight on yesterday's change.
- `ar2` is 0.2847, the weight on the change the day before that.
- `ma1` is 0.7487, the weight on yesterday's forecast error.

The `s.e.` row underneath is the standard error of each weight, which says how precisely 120 days of trading pin that weight down. `sigma^2` is 39.88, the estimated variance of what is left over once all three terms have been fitted: the part of each day's change that none of them accounts for.

One number deserves a second look. On its own, yesterday's change carried a weight of 0.742. Fitted alongside the other two terms, `ar1` is only 0.2471. Nothing shrank, though.

When three terms are fitted together, each weight measures only what the other two do not already cover, and here the error term at 0.7487 is covering a good deal of it.

One last thing worth doing, since we built this series ourselves and know what went into it. The build put 0.35 and 0.20 on the two past changes and 0.6 on the past error. The fit came back with 0.2471, 0.2847 and 0.7487, and every one of those sits inside one and a half standard errors of the number that made it. That is what 120 days buys you: close to the weights behind a series, not exactly onto them.

=== step === quiz
## Quick check: what the fitted ma1 of 0.7487 weights

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The average number of cups sold over the last two days. ::no
- The number of cups sold yesterday. ::no
- The part of yesterday's change the model did not predict, which is yesterday's forecast error. ::ok Right. An MA weight always multiplies an error, never a value. The model predicted a change for yesterday, the actual change came out somewhere else, and 0.7487 of that gap is carried into today.
- The size of the climb that differencing removed. ::no Two of these describe cups sold and one describes the climb, and an MA weight touches neither. The AR weights, `ar1` and `ar2`, are the ones that multiply past changes; the climb was taken out by d = 1 before any weight was fitted at all. `ma1` multiplies a forecast error, which is the gap between what the model predicted for a day and what the shop actually sold.

=== step === tryit
## Your turn: fit the same series with no AR and no MA

`cups` still holds the 120 days of daily sales, and `fit` holds the ARIMA(2, 1, 1) we just fitted, with its `sigma^2` of 39.88.

Fit the same series with the differencing kept but no memory at all: no past values and no past errors. Then compare the two leftover variances to see what those three terms were worth.

```r
# cups holds the 120 days of daily cups sold.
# Fit it with the differencing kept but no memory of any kind:
# no past values and no past errors.
# One call to arima(). Press Check when you have it.
```
::check {"regex": "order\\s*=\\s*c[(]\\s*0\\s*,\\s*1\\s*,\\s*0\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "That is the one. ARIMA(0, 1, 0) leaves sigma^2 at 103.5 against 39.88 for ARIMA(2, 1, 1), so the two AR terms and the one MA term cut the leftover variance by about 60 percent.", "no": "Keep cups and keep the differencing, then set both memory counts to zero: arima(cups, order = c(0, 1, 0))."}
::solution
```r
# Fit the same series with differencing only, no AR and no MA terms
plain <- arima(cups, order = c(0, 1, 0))
plain
#>
#> Call:
#> arima(x = cups, order = c(0, 1, 0))
#>
#>
#> sigma^2 estimated as 103.5:  log likelihood = -444.88,  aic = 891.76
round(c(with_terms = fit$sigma2, no_terms = plain$sigma2), 2)
#> with_terms   no_terms
#>      39.88     103.45
```

With no memory of any kind, every day's change is treated as pure error, and the leftover variance is 103.45. Add two past changes and one past error and it drops to 39.88. That fall is the size of what p and q were carrying.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition, chapter 9](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos. The standard free reference for what p, d and q are and how each one is chosen.
- [Time Series Analysis and Its Applications](https://www.stat.pitt.edu/stoffer/tsa4/) - Shumway and Stoffer (4th edition, Springer 2017), chapter 3. ARIMA models with the algebra written out in full.
- [ARIMA modelling of time series](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html) - R Core Team, the documentation for `arima()`: what the `order` argument means and what the printed coefficients are.
- **Time Series Analysis: Forecasting and Control**, 5th edition - Box, Jenkins, Reinsel and Ljung (Wiley, 2015). The book the method comes from, and still the reference for how the AR and MA terms fit together.

=== step === complete
## Quick recap

You built each letter of ARIMA out of one coffee shop's daily sales, and then fitted all three together. To summarise:

- The shop's daily sales kept climbing, which is why the raw cups correlated 0.993 with the previous day. One round of differencing took that climb out, and that is d = 1.
- An AR term weights p past values. Regressed on its own past one day back, this series gave a weight of 0.742, so about three quarters of yesterday's movement was still in today's.
- An MA term weights q past forecast errors. Adding 0.6 of yesterday's error to each day took the one-day correlation from 0.036 to 0.462, and left the two-day correlation at 0.061.
- One unusual day fades under AR and stops dead under MA: 60, 21, 7.35, 2.57, 0.9 against 60, 36, 0.
- Fitted together on the shop, ARIMA(2, 1, 1) gave weights of 0.2471, 0.2847 and 0.7487, and cut the leftover variance from 103.45 to 39.88.

So when someone writes ARIMA(2, 1, 1) on a whiteboard, you can say what each number does: one round of differencing, two past changes with a weight each, and one past forecast error with a weight of its own.

What we have not done is work those counts out on a series where nobody hands them to you. Choosing p and q off a series is its own job, with its own plots, and a topic for another day. Nice work getting this far.
