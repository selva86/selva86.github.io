---
title: "ARIMA: what AR, I, and MA actually mean"
slug: "ARIMA-Mini-1"
description: "AR, I and MA stop looking like soup once you meet them in one coffee shop's daily sales. Build the series, measure each letter, read ARIMA(2,1,1) aloud."
keywords: "what ARIMA means, AR I MA explained, ARIMA in R, ARIMA p d q, autoregressive model, differencing a time series, moving average errors, forecast package"
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
catalog_blurb: "What each letter of ARIMA means, on one shop's daily sales."
---

=== step === cover
::eyebrow ARIMA from Zero
## ARIMA: what AR, I, and MA actually mean

A corner coffee shop has been open for two hundred days, and every evening the owner writes down one number: cups sold.

Look at that record for a while and you will notice three things about it, all true at the same time.

Busy days tend to follow busy days. A rush nobody planned for, say a school group that walked in at eleven, still leaves a small mark on the next morning. And underneath both of those, the shop is slowly growing.

Those three sentences are ARIMA. The first one is the AR, the growth is the I, and the echo of yesterday's rush is the MA.

::widget process-flow {"steps":[{"title":"Today leans on recent days","sub":"busy days follow busy days, and that pull is a number you can measure"},{"title":"The climb comes out first","sub":"the shop is growing, so we work with the change instead of the level"},{"title":"The surprise still echoes","sub":"what the model got wrong yesterday carries into today"}]}

By the end of today, ARIMA(2,1,1) will read like a plain sentence: today depends on the last two days, the trend was taken out once, and one day of random surprise still echoes.

We start by building the shop's two hundred days ourselves, so we know exactly what went into them. Then we go after the three letters, one at a time.

=== step === concept
## Two hundred days of cups sold at one coffee shop

Before we can take ARIMA apart, we need something to take it apart on.

We could load somebody's sales file, but then we would be guessing about what is hidden inside it, and we want to check whether the model finds what is really there. So let's build the shop's record ourselves, from a recipe we can read.

Here is that recipe in words. The code underneath is the same four things written in R.

1. The shop starts out selling about 150 cups a day.
2. Every day it grows a little, roughly 0.6 cups.
3. Every day gets its own surprise, drawn at random: weather, a delivery van, a school holiday.
4. Each day's move leans on the two moves before it, and carries 0.4 of yesterday's surprise into today.

Press Run.

```r
# Build 200 days of cups sold at one coffee shop and plot the record
set.seed(75)
shock <- rnorm(200, 0, 1.8)          # one unplanned surprise per day

wobble <- numeric(200)               # the day-to-day move, before the climb
wobble[1] <- shock[1]
wobble[2] <- 0.35 * wobble[1] + shock[2] + 0.4 * shock[1]
for (day in 3:200) {
  wobble[day] <- 0.35 * wobble[day - 1] + 0.15 * wobble[day - 2] +
                 shock[day] + 0.4 * shock[day - 1]
}

coffee <- ts(round(150 + cumsum(0.6 + wobble)))

head(as.numeric(coffee), 8)
#> [1] 149 150 148 147 149 153 156 159

plot(coffee, col = "#1f7a55", lwd = 2,
     main = "Cups sold per day at the coffee shop",
     xlab = "Day", ylab = "Cups sold")
```

`set.seed(75)` fixes which random surprises you get, so your numbers match mine. `ts()` marks the result as a time series, which is R's way of saying these numbers arrive in an order and that the order matters. The object is called `coffee`, and every block from here on uses it.

The first eight days went 149, 150, 148, 147, 149, 153, 156, 159 cups.

Now look at the plot. The line climbs from 149 cups on the first day to 277 on the last, and it climbs in a jagged, hesitant way rather than in a straight march. All three ideas from the recipe are sitting in that one line at once. Let's pull them apart, one letter at a time, starting with the pull.

=== step === widget
## Yesterday's cups against today's cups

"Busy days follow busy days" is a sentence. Let's turn it into a number.

The trick is to stop looking at the line and start looking at pairs. Take every day and write it down next to the day before it. Day 2 goes with day 1, day 3 goes with day 2, and so on to the end, which gives us 199 pairs of cup counts.

Then plot yesterday along the bottom and today up the side. Sixty of those pairs are drawn below, spread evenly across the two hundred days so the dots do not sit on top of each other.

::widget chart-plotter {"data":[{"x":149,"y":150},{"x":147,"y":149},{"x":159,"y":159},{"x":160,"y":163},{"x":166,"y":171},{"x":178,"y":178},{"x":176,"y":175},{"x":175,"y":172},{"x":168,"y":167},{"x":165,"y":163},{"x":160,"y":161},{"x":159,"y":158},{"x":165,"y":169},{"x":182,"y":182},{"x":181,"y":181},{"x":178,"y":175},{"x":170,"y":173},{"x":172,"y":172},{"x":173,"y":172},{"x":172,"y":174},{"x":181,"y":184},{"x":189,"y":190},{"x":196,"y":202},{"x":204,"y":205},{"x":206,"y":207},{"x":210,"y":211},{"x":207,"y":208},{"x":221,"y":224},{"x":223,"y":221},{"x":218,"y":217},{"x":220,"y":220},{"x":217,"y":214},{"x":207,"y":204},{"x":205,"y":205},{"x":204,"y":208},{"x":217,"y":221},{"x":227,"y":229},{"x":231,"y":227},{"x":230,"y":232},{"x":233,"y":236},{"x":244,"y":247},{"x":246,"y":242},{"x":235,"y":234},{"x":231,"y":230},{"x":229,"y":230},{"x":231,"y":230},{"x":224,"y":223},{"x":219,"y":217},{"x":215,"y":214},{"x":209,"y":208},{"x":214,"y":214},{"x":213,"y":212},{"x":214,"y":214},{"x":218,"y":224},{"x":229,"y":234},{"x":249,"y":252},{"x":263,"y":270},{"x":276,"y":279},{"x":280,"y":278},{"x":277,"y":277}],"geoms":["point","histogram"],"x":"yesterday","y":"today","code":{"point":"ggplot(lag_pairs, aes(yesterday, today)) +\n  geom_point()","histogram":"ggplot(lag_pairs, aes(yesterday)) +\n  geom_histogram(bins = 10)"}}

Every dot lands on very nearly the same straight rising line. A 160 cup day is followed by a day near 160, a 240 cup day by a day near 240, all the way up. The chart works out the correlation of those sixty dots for you and prints it in the top corner, where it rounds off to r = 1.

Now press histogram. The pairing disappears and you get the plain spread of daily cup counts, with the order thrown away. All the stickiness we just saw is invisible in that picture, because a histogram does not care which day came first. And that order is the whole reason a series like this needs a model of its own.

Back to the number. Sixty dots was only for legibility, so let's use all 199 pairs and get the correlation exactly.

```r
# Pair every day with the day before it, then measure how tightly the two move together
yesterday <- head(as.numeric(coffee), -1)   # days 1 to 199
today     <- tail(as.numeric(coffee), -1)   # days 2 to 200

round(cor(yesterday, today), 4)
#> [1] 0.9972
```

0.9972, on a scale where 1 is a perfectly straight line. So knowing yesterday tells you almost everything about today.

Shifting a series back by one day like this is called taking a **lag**, so `yesterday` is the lag-1 version of the shop's sales and 0.9972 is the lag-1 correlation. You will see that word everywhere once you start reading about time series, and it means nothing more complicated than what we just did.

Do not trust that 0.9972 yet, though. Some of it is genuine stickiness and some of it is only the shop growing, and separating the two is the job of the middle letter. First, the letter that puts this pull to work.

=== step === concept
## Today is a slice of yesterday, plus a surprise

AR is short for **autoregressive**. Regressive, because it is a straight-line prediction of the kind you may have fitted before. Auto, because the thing doing the predicting is the series itself. There is no second variable anywhere in it. Sales predict sales.

Written out for one past day, the AR line looks like this:

\[ y_t = c + \phi \times y_{t-1} + e_t \]

Four symbols, and each one is something you can point at in the shop:

- \( y_t \) is today's cups, the number we want.
- \( y_{t-1} \) is yesterday's cups, the number we already have.
- \( \phi \), the Greek letter phi, is the share of yesterday that carries into today. This is the one to watch.
- \( c \) is a fixed amount the line adds every single day, and \( e_t \) is today's surprise, the part no formula could have known in advance.

Let's put real cup counts through it. Day 199 sold 277 cups, so we predict day 200 from it and then check our answer against what the shop really did. The two coefficients below are stand-ins I picked by hand so you can watch the arithmetic. R fits its own a little further down.

```r
# Predict day 200's cups from day 199, using stand-in AR(1) numbers
phi   <- 0.9      # share of yesterday that carries into today
const <- 28       # the fixed amount the line adds every day

cups <- as.numeric(coffee)
prediction <- const + phi * cups[199]

round(c(day_199 = cups[199], predicted_200 = prediction, actual_200 = cups[200]), 1)
#>       day_199 predicted_200    actual_200
#>         277.0         277.3         277.0
```

I named the fixed part `const` in the code because R already uses `c` for building vectors.

Follow the arithmetic through. Nine tenths of 277 is 249.3, then `const` adds its 28 on top, and the line lands on 277.3 against a real 277. So it was off by 0.3 of a cup, and that miss is \( e_t \). Every day of the record has one.

Notice how `phi` and `const` divide the work between them. Setting phi to 0.9 means the line carries ninety percent of yesterday forward, so `const` has to supply the other tenth. Twenty eight cups is roughly a tenth of 277, which is why the answer came out sensible. Hold on to that arrangement, because in a few minutes it falls apart in an interesting way.

=== step === quiz
## Quick check: what does a pull of 0.85 say about tomorrow?

Suppose you fit an AR line to a shop's daily sales and it comes back with phi = 0.85. Which reading of that number is right?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Tomorrow lands at 85% of today, so a 200 cup day is followed by a 170 cup day. ::no
- Most of today carries into tomorrow, so the series moves in slow patches and a busy stretch stays busy for a while. ::ok Exactly. A large phi is about stickiness, not about size. It says the level you are sitting at now takes a long time to fade away.
- The line gets tomorrow right 85% of the time. ::no
- The shop grows by 85% a day. ::no Phi is not an accuracy score, not a growth rate, and not the whole prediction on its own. It is the share of today that carries into tomorrow, and the constant puts the rest back, which is why a large phi means slow, sticky movement rather than a big jump.

=== step === concept
## What the p in ARIMA counts

Nothing says the line has to stop at yesterday. Monday's sales might owe something to Sunday and something to Saturday as well, and an AR line can reach back as far as you let it.

That reach is the letter **p**. All it counts is how many past days sit on the right hand side of the line. Reach back two days and each of them gets a coefficient of its own:

\[ y_t = c + \phi_1 \times y_{t-1} + \phi_2 \times y_{t-2} + e_t \]

Same shape as before, with one extra term. Here it is on the shop's last few days, again with stand-in numbers.

```r
# Predict day 200 from the two days before it, using stand-in AR(2) numbers
phi1 <- 0.6      # share of yesterday that carries into today
phi2 <- 0.3      # share of the day before yesterday

prediction2 <- const + phi1 * cups[199] + phi2 * cups[198]

round(c(day_198 = cups[198], day_199 = cups[199],
        predicted_200 = prediction2, actual_200 = cups[200]), 1)
#>       day_198       day_199 predicted_200    actual_200
#>         277.0         277.0         277.3         277.0
```

Days 198 and 199 both closed at 277 cups, so the two lags carry 0.6 and 0.3 of the same number, which comes to 166.2 and 83.1 cups. Together they carry the same nine tenths that one lag was carrying before, `const` still supplies the last tenth, and the prediction lands in the same place.

So p = 1 means the line looks back one day. p = 2 means it looks back two, each with its own coefficient. And p = 0 means it does not look back at all, which is a perfectly legal thing to say about a series with no memory in it.

=== step === tryit
## Your turn: predict day 201 from the last two days

The shop has just locked up on day 200. Both of the last two days closed at 277 cups, and `const`, `phi1` and `phi2` are still sitting in the session from a moment ago.

Write the AR(2) prediction for day 201.

```r
# const, phi1 and phi2 are already set to 28, 0.6 and 0.3.
# Day 199 sold 277 cups and day 200 sold 277 cups: cups[199] and cups[200].
# Write the AR(2) prediction for day 201: the constant, plus each of the
# two most recent days multiplied by its own coefficient.
# One line. Press Check when you have it.
```
::check {"regex": "(phi2\\s*[*]|[*]\\s*phi2)", "gate": true, "difficulty": "beginner", "ok": "That is it: 28 plus 0.6 of 277 plus 0.3 of 277 comes to 277.3 cups. Two past days, two coefficients, one constant, and nothing else in the line.", "no": "Each past day needs its own coefficient, and the most recent day gets phi1. Start from const, add phi1 times day 200, then add phi2 times day 199."}
::solution
```r
# Predict day 201 from the last two days using the AR(2) coefficients
const + phi1 * cups[200] + phi2 * cups[199]
#> [1] 277.3
```

=== step === concept
## The shop keeps growing, and that breaks the arithmetic

That stand-in `const` of 28 was doing quiet work, so let's ask where the 28 came from.

It came from the end of the record. Phi at 0.9 carries nine tenths of yesterday, so `const` has to supply the missing tenth, and at day 199 a tenth of 277 cups is about 28. Fine for day 199. Now try the same line back on the shop's first week, when it was selling about 149 cups a day. A tenth of 149 is 15, so `const` hands over 28 where 15 was wanted, and the line overshoots by thirteen cups a day, every day, for months.

One fixed constant cannot serve both ends of a record that keeps moving. Here is how far apart those two ends are.

```r
# Compare the shop's average day early on with its average day late on
first_50 <- mean(cups[1:50])
last_50  <- mean(cups[151:200])

round(c(first_50 = first_50, last_50 = last_50), 1)
#> first_50  last_50
#>    166.6    235.2

plot(coffee, col = "#c9ced8", lwd = 2,
     main = "The shop does not sit at one level",
     xlab = "Day", ylab = "Cups sold")
segments(1, first_50, 50, first_50, col = "#1f7a55", lwd = 4)
segments(151, last_50, 200, last_50, col = "#b5631a", lwd = 4)
```

The two short bars on the plot are those averages: 166.6 cups across the first fifty days and 235.2 across the last fifty. So a typical day at this shop is not one thing. It depends entirely on when you asked.

That property has a name. A series is **stationary** when its behaviour does not depend on when you look at it, that is, the same average level and the same size of wobble in the first fifty days as in the last fifty. The coffee shop is clearly not stationary, and the AR line we wrote a moment ago simply assumed it was.

[WARNING]
Fit an AR line straight onto a climbing series and it will look magnificent. However, it is mostly reporting the climb back to you rather than the day-to-day pull, and the 0.9972 we measured on the raw cup counts was inflated by exactly that.

=== step === concept
## Model the change, not the level

There is a way out, and it is the simplest idea in the whole model.

Stop asking how many cups the shop sold today. Ask how many more it sold than yesterday.

The level walks from 149 up to 277 over two hundred days, but the daily change never goes anywhere. It is roughly the same small step, up or down, on day 10 as on day 190. So subtract each day from the one after it and the climb has nowhere left to hide.

```r
# Turn the cup counts into day-to-day changes and plot them
daily_change <- diff(coffee)

head(as.numeric(daily_change), 8)
#> [1]  1 -2 -1  2  4  3  3  0

round(c(mean = mean(daily_change), sd = sd(daily_change)), 4)
#>   mean     sd
#> 0.6432 2.3991

plot(daily_change, col = "#2563a8", lwd = 1.5,
     main = "Change in cups sold from one day to the next",
     xlab = "Day", ylab = "Change in cups")
abline(h = mean(daily_change), col = "#b5631a", lwd = 2)
```

`diff()` does the subtraction for the whole series in one go. Day 2 sold one cup more than day 1, day 3 sold two fewer than day 2, day 4 one fewer again, and so on down the record. Two hundred cup counts become 199 changes.

Now look at what this plot does that the first one could not. The climb has gone. The changes hug one flat orange line the whole way across, at an average of 0.6432 cups, and a day's move is much the same size on day 190 as it was on day 10. There is no drift left in them to trip a model up. That is what stationary looks like.

Subtracting yesterday from today is called **differencing**, and **d** counts how many times you do it. We did it once, so d = 1. d = 0 means the series was flat enough to leave alone. d = 2 means differencing the differences, which some stubborn series need and this one does not.

The I in ARIMA stands for **integrated**, which is an odd name for something so simple. Differencing breaks the series down into changes, and integrating adds those changes back up to get to cups again. The model does its thinking on the changes, and puts the levels back for you when it forecasts.

[KEY INSIGHT]
d is not a way of throwing data away. It changes the question. Instead of how many cups a day, the model is asked how many more than the day before, and that second question has the same answer at both ends of the record.

=== step === quiz
## Quick check: what does d = 1 change?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It smooths the series, replacing each day with an average of the days around it. ::no
- It throws the cup levels away for good, so the model can only ever talk in changes. ::no
- It changes the question the model answers: not how many cups today, but how many more than yesterday. ::ok Right. The wobble is untouched, the climb is the only thing that leaves, and one description now fits both ends of the record instead of a different one at each end.
- It takes the growth out of the shop, so the trend no longer exists in the data. ::no Differencing changes the question, not the shop and not the noise. The wobble is exactly as big as it was, the growth is still sitting there in the average change of 0.6432 cups a day, and the levels come straight back the moment the model forecasts in cups.

=== step === concept
## The pull is still there once the climb is gone

Now we can ask the honest version of the earlier question. Not "do busy days follow busy days", which the climb answers for free, but "do big moves follow big moves?"

Same pairing as before, run on the changes this time.

```r
# Measure the pull between one day's change and the next day's change
change_yesterday <- head(as.numeric(daily_change), -1)
change_today     <- tail(as.numeric(daily_change), -1)

round(cor(change_yesterday, change_today), 4)
#> [1] 0.6898
```

0.6898. That is a long way below the 0.9972 the raw cup counts gave us, and it is worth far more. Most of that 0.9972 was the climb turning up twice, once in yesterday and once in today. What survives the differencing, 0.6898, is real day-to-day stickiness. A day that jumps tends to be followed by another day that jumps the same way.

That is the AR part and the I part standing side by side. So let's hand both of them to R and let it fit the coefficients properly, instead of us guessing at them.

```r
# Fit one past day and one round of differencing, and read the coefficients back
library(forecast)

fit_ar <- Arima(coffee, order = c(1, 1, 0), include.drift = TRUE)
fit_ar
#> Series: coffee
#> ARIMA(1,1,0) with drift
#>
#> Coefficients:
#>          ar1   drift
#>       0.6865  0.6401
#> s.e.  0.0510  0.3876
#>
#> sigma^2 = 3.033:  log likelihood = -392.08
#> AIC=790.16   AICc=790.28   BIC=800.04
```

`Arima()` comes from the forecast package, and `order = c(1, 1, 0)` is (p, d, q) written in that fixed order: one past day, one round of differencing, and no past surprises yet. `include.drift = TRUE` tells the model the shop is allowed to keep climbing.

Two numbers in that output are ours. `ar1` is 0.6865, which is the phi we were guessing at earlier, now fitted, and it sits right beside the 0.6898 we measured by hand. `drift` is 0.6401, the steady climb per day, right beside the average change of 0.6432. Nothing surprising happened, and that is exactly the point. R found the same two things we found, without being told about either of them.

The rest of the block you can leave alone today. The `s.e.` line says how much each coefficient might have wobbled if the shop had sold slightly different numbers, and the scores along the bottom are for weighing one fitted model against another.

Notice what is missing too. There is no constant in that output, because on a differenced series the fixed part is the drift. So the awkward 28 has solved itself.

=== step === concept
## What counts as a surprise?

MA is the letter people find slippery, and it is slippery for one reason. It is built out of something that is not in the data at all, which is the model's own mistakes. So before we go anywhere near the formula, let's get those mistakes onto the page as numbers.

A surprise, also called a **shock** or an **error**, is the gap between what the model expected for a day and what the shop actually sold. `fitted()` gives us the expectations and `residuals()` gives us the leftovers.

```r
# Line up what the model expected each day against what the shop actually sold
expected <- round(as.numeric(fitted(fit_ar)), 1)
sold     <- as.numeric(coffee)
surprise <- round(as.numeric(residuals(fit_ar)), 1)

data.frame(day = 1:200, expected, sold, surprise)[2:7, ]
#>   day expected sold surprise
#> 2   2    149.7  150      0.3
#> 3   3    150.9  148     -2.9
#> 4   4    146.8  147      0.2
#> 5   5    146.5  149      2.5
#> 6   6    150.6  153      2.4
#> 7   7    155.9  156      0.1
```

Read the last column. On day 2 the model expected 149.7 cups and 150 went out, so that day held a surprise of 0.3 cups, which is nothing at all. Day 3 is the interesting one. The model expected 150.9 and only 148 cups were sold, a shortfall of 2.9. Something happened that day, rain or a broken grinder or a quiet street, and no amount of studying day 2 could have warned you about it.

These are the \( e_t \) from the AR line, one for every day of the record. They are positive when the shop beat the model and negative when it fell short, and they average out to almost exactly nothing across the two hundred days, which is what you want from something that is meant to be pure surprise.

The question that gives us the third letter is this. When a day like day 3 goes badly, is day 3 finished?

=== step === concept
## Yesterday's surprise still echoes today

Think about what a real surprise does to a real shop.

A school group walks in on Tuesday and the day runs well above anything the model expected. Then Wednesday is not a normal Wednesday either. Two of the teachers come back, the staff over-brewed and pushed the extra cups, and somebody told a friend. The event is over, but its effect is not.

That leftover is what the MA part carries, and for one past surprise the line looks like this:

\[ y_t = c + e_t + \theta \times e_{t-1} \]

\( e_t \) is today's own surprise and \( e_{t-1} \) is yesterday's, the one we just read off the residuals. \( \theta \), the Greek letter theta, is the share of yesterday's surprise that is still showing up in today's number. And **q** counts how many past surprises get carried. So q = 1 carries yesterday's, q = 2 carries yesterday's and the one before that, and q = 0 carries none.

[WARNING]
Moving average here has nothing to do with the moving average that smooths a chart, the one that replaces each day with the average of the days around it. The MA in ARIMA is a weighted sum of past forecast errors, and the sales figures themselves are never averaged. The two ideas collide on a name and have nothing else in common.

Let's add one past surprise to the fit we already have and watch what changes.

```r
# Add one past surprise to the model and compare it with the AR only fit
fit_ma <- Arima(coffee, order = c(1, 1, 1), include.drift = TRUE)
fit_ma
#> Series: coffee
#> ARIMA(1,1,1) with drift
#>
#> Coefficients:
#>          ar1     ma1   drift
#>       0.5938  0.1767  0.6449
#> s.e.  0.0856  0.1106  0.3509
#>
#> sigma^2 = 3.013:  log likelihood = -390.93
#> AIC=789.87   AICc=790.08   BIC=803.04
```

`ma1` is 0.1767. That is theta, fitted, and it is the share of each day's surprise that gets carried into the next day's prediction.

Now compare the rest against the earlier fit and you can watch the terms rearrange themselves. `ar1` dropped from 0.6865 to 0.5938, because two terms are now sharing work that the AR term was doing on its own. `drift` barely moved, from 0.6401 to 0.6449, because a steady climb is not the sort of thing an error term can explain away.

=== step === quiz
## Quick check: is the MA part smoothing the line?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes. It replaces each day with an average of the days around it, which is where the name comes from. ::no
- No. It adds a share of yesterday's forecast error to today's prediction, and the sales figures themselves are never averaged. ::ok Exactly. The two ideas share a name and nothing else. The MA term works on the model's own mistakes, which is why you cannot spot it by staring at the raw series.
- Yes. It averages the last q days of sales before the AR part gets to see them. ::no
- No. It strips the trend out, and that is what makes the fitted line look smoother. ::no Nothing in an MA term touches the sales figures. It picks up errors the model has already made, like that shortfall of 2.9 cups on day 3, and carries a share of them into the next day's prediction. Taking the trend out is the job of d, and smoothing a chart is a different tool altogether.

=== step === concept
## Reading ARIMA(2,1,1) out loud

Every piece is on the table now, so let's put the label back together.

| Letter | Order | What it counts | The shop's version |
|---|---|---|---|
| AR | p | past days the line leans on | today leans on the last two days |
| I | d | rounds of differencing | the climb was taken out once |
| MA | q | past surprises carried forward | one day of surprise still echoes |

So that is two past days, one round of differencing and one past surprise, which R writes as `order = c(2, 1, 1)`. Here it is on the shop's own sales.

```r
# Fit two past days, one round of differencing and one past surprise
fit_full <- Arima(coffee, order = c(2, 1, 1), include.drift = TRUE)
fit_full
#> Series: coffee
#> ARIMA(2,1,1) with drift
#>
#> Coefficients:
#>          ar1     ar2     ma1   drift
#>       0.3891  0.1476  0.3776  0.6442
#> s.e.  0.3043  0.2218  0.2909  0.3596
#>
#> sigma^2 = 3.022:  log likelihood = -390.72
#> AIC=791.45   AICc=791.76   BIC=807.91
```

Now hold those four numbers up against the recipe we built the shop from at the very beginning.

We told the series to lean 0.35 on the day before and 0.15 on the day before that, to carry 0.4 of yesterday's surprise into today, and to climb 0.6 cups a day. R was never shown any of that. It saw two hundred cup counts and came back with 0.3891, 0.1476, 0.3776 and 0.6442.

It found the recipe.

So read the label out loud, left to right: ARIMA(2,1,1) with drift. Today depends on the last two days. The trend was taken out once. One day of random surprise still echoes. And underneath all of it, the shop grows by about 0.64 cups a day.

That is the whole thing. It is not soup. It is three plain observations about a coffee shop, written down as three numbers.

=== step === quiz
## Quick check: which label matches the shop?

A friend runs a coffee shop across town and describes their sales to you over the phone. The numbers drift steadily upward, today leans on the three days before it, and nothing of yesterday's forecast error is carried forward. So which label is their shop?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- ARIMA(0, 1, 3) ::no
- ARIMA(3, 1, 0) ::ok Yes. Three past days puts a 3 in the first slot, the upward drift needs one round of differencing for the middle slot, and carrying no past errors puts a 0 at the end.
- ARIMA(1, 3, 0) ::no
- ARIMA(3, 0, 1) ::no Read the label strictly left to right as (p, d, q): past days, then rounds of differencing, then past surprises. Three past days makes p = 3. A series that drifts upward has to be differenced, so d = 1. Carrying no forecast errors makes q = 0.

=== step === tryit
## Your turn: fit one past day and one past surprise

`coffee` is still in the session and the forecast package is loaded.

Fit a model that leans on one past day and carries one past surprise, on a shop that is still climbing. Then read the label R prints back at the top.

```r
# coffee holds the shop's 200 daily cup counts.
# Fit a model that uses ONE past day, ONE round of differencing and ONE
# past surprise, and let it keep the climb with include.drift = TRUE.
# One line, of the shape Arima(coffee, order = c(?, ?, ?), include.drift = TRUE)
# Press Check when you have it.
```
::check {"regex": "order\\s*=\\s*c\\s*[(]\\s*1\\s*,\\s*1\\s*,\\s*1\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. R prints ARIMA(1,1,1) with drift and hands back ar1 0.5938, ma1 0.1767 and drift 0.6449. That is the same model we fitted a few minutes ago, so you can check every coefficient against it.", "no": "The three slots go in the order p, d, q. One past day makes p = 1, the shop is still climbing so it needs d = 1, and one past surprise makes q = 1."}
::solution
```r
# Fit one past day, one round of differencing and one past surprise
Arima(coffee, order = c(1, 1, 1), include.drift = TRUE)
#> Series: coffee
#> ARIMA(1,1,1) with drift
#>
#> Coefficients:
#>          ar1     ma1   drift
#>       0.5938  0.1767  0.6449
#> s.e.  0.0856  0.1106  0.3509
#>
#> sigma^2 = 3.013:  log likelihood = -390.93
#> AIC=789.87   AICc=790.08   BIC=803.04
```

=== step === tryit
## Your turn: how much of a day's movement is the climb?

`daily_change` holds the 199 day-to-day changes in cups sold.

The shop grew by 128 cups across the record, which sounds like a lot. Work out the average daily change and the typical size of one day's move, then see which of the two is bigger.

```r
# daily_change holds the 199 day-to-day changes in cups sold.
# Print the average change and the typical size of a change,
# which is its standard deviation, rounded to two decimals.
# Two numbers. Press Check when you have them.
```
::check {"regex": "sd\\s*[(]\\s*daily_change", "gate": true, "difficulty": "beginner", "ok": "0.64 cups of climb against a typical swing of 2.40 cups. On any single day the growth is buried, because the noise is nearly four times bigger. Yet those 199 tiny steps add up to exactly the 128 cups that carried the shop from 149 to 277, which is why a trend you cannot see in a day still has to come out before you model anything.", "no": "Two calls on the same object: mean(daily_change) for the average change, and sd(daily_change) for the typical size of one. Put both of them inside round(..., 2)."}
::solution
```r
# Compare the average daily climb with the typical size of a day's move
round(c(average_change = mean(daily_change), typical_swing = sd(daily_change)), 2)
#> average_change  typical_swing
#>           0.64           2.40
```

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition, chapter 9](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos. The clearest free treatment of ARIMA there is, written by the author of the forecast package.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). How `Arima()` and its automatic cousin choose and fit a model.
- [Time Series Analysis: Forecasting and Control, 5th edition](https://www.wiley.com/en-us/Time+Series+Analysis%3A+Forecasting+and+Control%2C+5th+Edition-p-9781118675021) - Box, Jenkins, Reinsel and Ljung, Wiley 2015. The original Box and Jenkins treatment, still the reference text for AR, I and MA.
- [Time Series Analysis and Its Applications, 4th edition, chapter 3](https://doi.org/10.1007/978-3-319-52452-8) - Shumway and Stoffer, Springer 2017. A more mathematical companion, with the ARMA theory worked out in full.

=== step === complete
## Quick recap

You took a coffee shop's two hundred days apart and found all three letters sitting inside it.

- **AR** is the pull. Today leans on recent days, and p counts how many. Once the climb was out of the way, the shop's own pull came back at 0.6865.
- **I** is the climb. Differencing turns cup counts into day-to-day changes, and d counts how many times you do it. One round was enough here.
- **MA** is the echo. A share of yesterday's forecast error rides into today's prediction, and q counts how many past errors get carried.
- Put together, ARIMA(2,1,1) with drift on the shop's sales gave back 0.3891, 0.1476, 0.3776 and 0.6442, which is very nearly the recipe we poured in before R saw a single number.

So the next time somebody writes ARIMA(2,1,1) on a whiteboard, you can say it out loud: today depends on the last two days, the trend was taken out once, and one day of random surprise still echoes.

What we have not touched is how you pick those three numbers when nobody hands them to you, and that is a job for another day.
