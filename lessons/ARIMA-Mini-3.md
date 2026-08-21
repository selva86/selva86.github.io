---
title: "How to choose ARIMA order (p, d, q): a practical guide"
slug: "ARIMA-Mini-3"
description: "Choose the p, d and q of an ARIMA on a real series: flatten the climb, read the ACF and PACF plots, shortlist two or three orders, then let AICc settle it."
keywords: "how to choose ARIMA order, ARIMA p d q, choosing p and q, ACF and PACF, order of differencing, ndiffs, AICc, Ljung-Box test, ARIMA order selection in R"
mathjax: true
webr: true
date: "2026-08-21"
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
catalog_blurb: "How to settle the three numbers in an ARIMA on a real series."
---

=== step === cover
::eyebrow ARIMA from Zero
## How to choose ARIMA order (p, d, q): a practical guide

A coffee shop keeps a note of how many cups it sells each day. On its first trading day of the year it sold 284 cups, and on its 180th it sold 387. In between the number climbs, slips back, and climbs again.

The owner wants a forecast for next week and you have decided to fit an ARIMA, which means you have to hand R three numbers: p, d and q.

That is the whole decision. Once those three integers are set, R works out every coefficient and every forecast on its own.

So how do you pick them?

You do not guess, and you do not sit there trying every combination until one of them looks good. There is a rhythm to it, and it is only three moves long.

::widget process-flow {"steps":[{"title":"Flatten the climb","sub":"model the change from one day to the next, not the running total"},{"title":"Read the two plots","sub":"how many days of echo does the flattened series still carry?"},{"title":"Score the shortlist","sub":"fit the two or three orders the plots suggest, let a fair score pick"}]}

Then one last check tells you whether to trust what came out. We are going to run that whole loop on the shop's own 180 days, and by the end you will have an order you can say out loud and defend.

=== step === concept
## What 180 days of coffee sales look like

Before any of those moves, let's look at the series itself. Here are the shop's daily cup counts, built from scratch so that every line of it runs for you.

The code below makes 180 trading days that behave the way a small shop does, with a slow upward drift and the ordinary day to day wobble sitting on top of it. Press Run.

```r
# Build the coffee shop's 180 trading days of sales and draw the line
set.seed(4)
cups <- round(280 + cumsum(arima.sim(list(ar = 0.55), n = 180, sd = 3) + 0.7))

c(day_1 = cups[1], day_180 = cups[180], days = length(cups))
#>   day_1 day_180    days
#>     284     387     180

plot(cups, type = "l", lwd = 2, col = "#1f7a55",
     main = "Cups sold per day at one coffee shop",
     xlab = "Trading day", ylab = "Cups sold")
```

Here is what each piece of that code did. `arima.sim()` makes a series that carries an echo, where each value is partly a copy of the one before it. `cumsum()` adds every day's move onto the day before, so the totals accumulate. The `+ 0.7` gives the shop a little growth each day, and `round()` keeps the counts whole, because nobody sells 293.4 cups.

Now look at the line itself. It ends higher than it starts, 387 against 284, and it never sits still on the way. That climb is the first thing standing between you and an ARIMA order.

=== step === concept
## What p, d and q each control
::prose-only the three definitions are earned one at a time over the moves that follow, each against the shop's own line

ARIMA(p, d, q) is three numbers written in a row, and each one answers a different question about the line you just drew.

**d is how many times you subtract yesterday from today.** The shop's sales climb, so its raw numbers are not comparable across the year: 320 cups is an ordinary day at the start of the record and a poor one at the end. Subtract yesterday from today and the running total becomes the daily change, and the climb goes away.

**p is how many past days the model leans on directly.** It is called the autoregressive order. If today's change tends to resemble yesterday's change, the model can use yesterday as a predictor. p = 1 means it uses the single day before, p = 2 means the two days before, and p = 0 means it uses none of them.

**q is how many past surprises the model still carries.** It is called the moving-average order. A surprise is the part of a day the model got wrong: it expected 340 cups and 352 walked in, so the surprise was plus 12. q = 1 means yesterday's surprise still nudges today's prediction.

So that is three numbers and three questions. The rest of the work is answering them one at a time, and the shop's own data is what does the talking.

=== step === concept
## Why the climb has to come out first

The AR and MA pieces of an ARIMA both assume the series is **stationary**. The word sounds heavier than it is. A stationary series has a level that stays put and a wobble that stays about the same size, so a stretch taken from the start looks much like a stretch taken from the end.

The shop fails the first half of that. Rather than argue about it, let's measure it. Average the first twenty trading days, average the last twenty, and see whether the two come out the same.

```r
# Compare the shop's average level early on with its average level at the end
early <- mean(cups[1:20])
late  <- mean(cups[161:180])

round(c(first_20_days = early, last_20_days = late), 1)
#> first_20_days  last_20_days
#>         315.9         386.0

plot(cups, type = "l", col = "grey65",
     main = "The shop's level does not stay put",
     xlab = "Trading day", ylab = "Cups sold")
segments(1, early, 20, early, col = "#b5631a", lwd = 4)
segments(161, late, 180, late, col = "#b5631a", lwd = 4)
```

The two orange bars sit about seventy cups apart. Whatever the model learns about a typical day in the first month is wrong by the last month, because the shop moved underneath it.

So the level has to come out before anything else happens. Otherwise every pattern you go looking for is buried under the climb.

=== step === concept
## Sales today minus sales yesterday

The fix has only one moving part. Instead of modelling how many cups the shop sold, we model how many more or fewer it sold than the day before.

\[ y'_t = y_t - y_{t-1} \]

Read that as: the change on day \(t\) is day \(t\)'s cups minus the previous day's cups. The operation is called **differencing**, and d in ARIMA(p, d, q) is simply how many times you apply it.

In R it is one function, `diff()`. Watch what it does to the line.

```r
# Turn the daily totals into the change from one day to the next
daily_change <- diff(cups)

round(c(days = length(daily_change), average = mean(daily_change), spread = sd(daily_change)), 2)
#>    days average  spread
#>  179.00    0.58    3.22

plot(daily_change, type = "l", col = "#1f7a55",
     main = "Change in cups sold from one day to the next",
     xlab = "Trading day", ylab = "Change in cups")
abline(h = 0, col = "#b5631a", lwd = 2)
```

Three things in that output are worth pausing on.

1. There are 179 values, not 180. The first day has no day before it, so it has no change.
2. The average change is 0.58 cups. That is the shop's growth, still here, only now it is stated as a small daily number instead of a rising line.
3. The line crosses the orange zero mark all the way along, from the earliest days to the last ones. There is no climb left in it.

That is d = 1. One pass of subtraction, and the shop's level stopped moving.

=== step === concept
## How many differences the shop's sales need

Eyeballing a plot is a fine start. However, it is not something you can put in a report, and two lines of R settle it properly.

The first is the **KPSS test**. Its starting assumption is that the series IS stationary, so a small p-value is evidence against that assumption, and a large one lets it stand. Let's run it on the raw totals first.

```r
# Test whether the raw daily totals sit at a steady level
suppressMessages(library(tseries))
kpss.test(cups)
#>
#> 	KPSS Test for Level Stationarity
#>
#> data:  cups
#> KPSS Level = 2.4221, Truncation lag parameter = 4, p-value = 0.01
```

The p-value is 0.01, which is the smallest figure this test reports, and R adds a note underneath saying the real value is smaller still. The raw totals are not stationary, exactly as the two orange bars showed. Now let's run the same test on the daily changes.

```r
# Test whether the daily changes sit at a steady level
kpss.test(daily_change)
#>
#> 	KPSS Test for Level Stationarity
#>
#> data:  daily_change
#> KPSS Level = 0.38135, Truncation lag parameter = 4, p-value = 0.0852
```

The p-value comes back at 0.0852, which sits well above 0.05, so there is no case against stationarity any more. One difference did the job.

If you would rather not read two tests every time, the forecast package runs that search for you and hands back the number.

```r
# Ask the forecast package how many differences this series needs
suppressMessages(library(forecast))
ndiffs(cups)
#> [1] 1
```

It comes back with one. So d = 1, and every reading from here on happens on `daily_change` and never on the raw totals.

[WARNING]
The KPSS starting assumption is that the series is already stationary, which is the opposite of what most tests assume. A small p-value here means "difference it" and a large one means "leave it alone". Read it the other way round and you will difference a series that never needed it.

=== step === concept
## Why you stop at one difference

If one difference flattened the shop, would two flatten it further?

No, and this is the trap that catches people. Differencing a series that is already flat does not clean it up. It scrambles it, and it leaves a very recognisable mark behind.

The number to watch is the lag-1 echo: how strongly one day's change resembles the day before it. It runs from minus 1 to plus 1. Zero is no resemblance at all, plus 1 is a perfect copy, and a minus reading means the resemblance runs backwards, an up day tending to be followed by a down day. Here is the shop's series differenced a second time, with the spread and the lag-1 echo of both versions side by side.

```r
# Difference a second time and compare the spread and the lag-1 echo
twice_changed <- diff(daily_change)

round(c(spread_after_one = sd(daily_change), spread_after_two = sd(twice_changed)), 2)
#> spread_after_one spread_after_two
#>             3.22             3.30

round(c(lag1_after_one = acf(daily_change, plot = FALSE)$acf[2],
        lag1_after_two = acf(twice_changed, plot = FALSE)$acf[2]), 3)
#> lag1_after_one lag1_after_two
#>          0.477         -0.300
```

Two things came back, and both of them are bad news.

The spread went up, from 3.22 cups to 3.30. A difference you did not need adds noise instead of removing it.

And the lag-1 echo flipped from plus 0.477 to minus 0.300. That negative value is not something the shop does. Subtracting twice makes every value carry the previous value's subtraction with the sign reversed, which stitches an artificial down-up-down pattern into the data.

Let's draw it once, so the shape sticks.

```r
# Draw the echo pattern that a second difference invents
acf(twice_changed, main = "Echoes after differencing twice")
```

The tall bar hanging below the line at lag 1 is the signature of over-differencing. If you ever see it, take a difference back out.

[KEY INSIGHT]
Difference the fewest times that flattens the series, then stop. One too many inflates the spread and plants a strong negative echo at lag 1, and you spend the rest of the job modelling damage you caused yourself.

=== step === quiz
## Quick check: how do you know one difference was enough?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Because differencing deleted the shop's growth from the data, so the growth can no longer affect the model. ::no
- Because the changes have a smaller spread than the raw totals, and a smaller spread is what stationary means. ::no
- Because the changes sit at a steady level, with a KPSS p-value of 0.0852, and a second difference only widened the spread and planted a negative echo. ::ok Exactly. Differencing is not deletion, it is a change of subject: you model the daily change instead of the running total, and the growth survives as an average change of 0.58 cups. One difference is enough the moment the changes hold still, and the second one made things worse on both counts.
- Because the KPSS test on the raw totals came back at 0.01, and any p-value under 0.05 confirms that the differencing worked. ::no A KPSS p-value of 0.01 on the raw totals says those totals are not stationary. That is the reason to difference, not proof that differencing succeeded. The proof lives on the changes: 0.0852 there, and a second difference that pushed the spread from 3.22 up to 3.30 and flipped the lag-1 echo to minus 0.300.

=== step === concept
## What the bars on an ACF and a PACF measure

Now the flattened series has to tell you how much memory it has. Two plots do that, and they measure two different things.

The **ACF**, short for autocorrelation function, asks: how much does a day resemble the day k days before it? Slide the series back by one day, correlate it with itself, and that is the bar at lag 1. Slide it back two days and you get the bar at lag 2.

The **PACF**, short for partial autocorrelation function, asks a stricter question: how much does a day resemble the day k days back once the days in between are held still? Monday can look like Saturday purely because both look like Sunday. The ACF counts that borrowed resemblance, and the PACF strips it out and reports only what lag k adds on its own.

The numbers make the difference obvious. Here are both readings for the shop's daily changes, at lags 1 through 8.

```r
# Print the first eight ACF and PACF values of the shop's daily change
round(acf(daily_change, plot = FALSE)$acf[2:9], 3)
#> [1]  0.477  0.267  0.133  0.171  0.143  0.111  0.025 -0.063

round(pacf(daily_change, plot = FALSE)$acf[1:8], 3)
#> [1]  0.477  0.051 -0.016  0.134  0.020  0.006 -0.056 -0.100
```

Both start at 0.477, because at lag 1 there is nothing in between to hold still, so the two questions are the same question.

They part company immediately afterwards. The ACF at lag 2 is 0.267, which is a real resemblance. The PACF at lag 2 is 0.051, which is nothing at all. So the shop's two-day resemblance is entirely borrowed: today looks like the day before yesterday only because both of them look like yesterday.

Here are the same two readings as pictures, which is how you will usually meet them.

```r
# Draw the two readings of the daily change side by side
par(mfrow = c(1, 2))
acf(daily_change, main = "ACF of the daily change")
pacf(daily_change, main = "PACF of the daily change")
par(mfrow = c(1, 1))
```

The ACF starts tall and shrinks away over several lags. The PACF has one tall bar and then collapses. Hold that picture, because it is the whole of the next move.

[NOTE]
R's `acf()` output starts at lag 0, where a series is perfectly correlated with itself and the value is always 1, which is why the code above asks for elements 2 to 9. `pacf()` has no lag 0 at all, so its first element already is lag 1.

=== step === widget
## When is a bar big enough to count?

Both of those plots came with a pair of dashed blue lines across them. Those are not decoration. They mark the range where a bar is small enough to be plain noise.

The band sits at

\[ \pm \frac{1.96}{\sqrt{n}} \]

where n is how many values you have. The formula is not arbitrary. If a series had no memory whatsoever, its bars would still not land exactly on zero, they would scatter around it, and 95 out of every 100 would land inside \(\pm 1.96/\sqrt{n}\). So a bar outside the band is one that pure noise produces about 5 times in 100.

The shop has 179 daily changes. Here is its band, and how far its tallest bar sits outside it.

```r
# Work out the band for this series, and how far its tallest bar sits outside it
n_changes <- length(daily_change)
band <- 1.96 / sqrt(n_changes)

round(band, 3)
#> [1] 0.146

round(pacf(daily_change, plot = FALSE)$acf[1] * sqrt(n_changes), 1)
#> [1] 6.4
```

So any bar bigger than 0.146 counts, and the shop's lag-1 bar of 0.477 sits 6.4 noise widths out from zero.

The curve below is what noise alone would produce. Drag the slider, and the shaded area is the share of pure-noise bars that reach at least that far out.

::widget null-distribution {"tails": 2, "start": 1.96, "max": 6.5, "label": "how far the bar sits from zero, in noise widths"}

Start where it opens, at 1.96, and the shaded share reads 0.050. That is the band: the exact spot where a noise bar becomes a 1-in-20 event. Now drag it out to 6.4, where the shop's lag-1 bar actually sits, and the shaded area vanishes. Noise does not make bars that tall.

The readout calls that shaded share a p-value, which is the usual name for the chance that noise alone gets this far out, and the H0 it names alongside is the no-memory story you are testing against.

[TIP]
A longer series gets a narrower band, because \(\sqrt{n}\) grows. With 179 days a bar has to clear 0.146, and with 1,000 days it only has to clear 0.062. The same real pattern is easier to see once you have collected more of it.

=== step === tryit
## Your turn: count the bars that clear the band

The band for the shop's daily changes is 0.146, and the PACF's first eight values are sitting in `pacf_values` below. Count how many of the eight fall outside the band, remembering that a bar can stick out downwards as well as upwards.

```r
# The shop's first eight PACF values, and the band that decides which of them count.
# Count how many of the eight sit outside that band, in either direction.
# One line. Press Check when you have it.
pacf_values <- pacf(daily_change, plot = FALSE)$acf[1:8]
band <- 1.96 / sqrt(length(daily_change))
```
::check {"regex": "sum\\s*[(]\\s*abs\\s*[(]\\s*pacf_values", "gate": true, "difficulty": "beginner", "ok": "Right, exactly one. The lag-1 bar of 0.477 clears 0.146 and nothing else comes close, so the PACF has a single bar that counts.", "no": "Take the size of each bar with abs() so that a downward bar counts too, compare those sizes against band, and add up the TRUEs: sum(abs(pacf_values) > band)."}
::solution
```r
# Count the PACF bars that clear the band
sum(abs(pacf_values) > band)
#> [1] 1
```

`abs()` throws the sign away, so a bar at minus 0.30 counts as 0.30. Comparing the whole vector against `band` gives eight TRUE or FALSE answers, and `sum()` counts the TRUEs because R treats TRUE as 1.

=== step === concept
## Cuts off, or tails off

Two phrases turn those plots into numbers, and the rest of order selection rests on them.

A plot **cuts off after lag k** when its bars sit outside the band up to lag k and then drop inside it and stay there. The break is abrupt, and you can point at the exact lag where it happens.

A plot **tails off** when its bars shrink towards zero gradually across many lags, sometimes flipping sign along the way, with no clean break anywhere.

Put the two plots together and there are only three cases to know.

| ACF | PACF | What the pair is asking for |
|---|---|---|
| Tails off gradually | Cuts off after lag p | AR(p): p autoregressive terms, no MA terms |
| Cuts off after lag q | Tails off gradually | MA(q): q moving-average terms, no AR terms |
| Tails off gradually | Tails off gradually | A mix of the two, so shortlist a few orders and score them |

The pairing is the part people get backwards, so here is why it runs that way. An AR model says today depends directly on the p days before it. Hold those p days still and there is nothing left to add, so the PACF, which is the plot that holds the days in between still, drops to nothing right after lag p. The influence itself keeps passing down the chain day by day, so the ACF fades out slowly instead of stopping.

An MA model works the other way round. Today carries the last q surprises and nothing older, so the plain resemblance dies immediately after lag q and the ACF cuts. The PACF, forever subtracting off the intervening days, is the one left trailing away.

[TIP]
The letters help. The **P**ACF pairs with **p**. The other one, the ACF, pairs with q. That mnemonic has rescued more order readings than any amount of theory.

=== step === quiz
## Quick check: which plot hands you p?

A flattened series has an ACF that fades away slowly across eight lags, and a PACF with two bars outside the band and nothing after that. What order is that pair asking for?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- q = 2, because two bars stick out and the moving-average order is the one that counts sticking-out bars. ::no
- p = 2 and q = 0, because the PACF is the plot that cuts off, and it cuts after lag 2. ::ok That is the AR fingerprint. A PACF cutting after lag 2 says today leans directly on the two days before it, and the slowly fading ACF is that influence passing down the chain rather than a second pattern.
- p = 0 and q = 8, because the ACF stays outside the band for eight lags. ::no
- Neither, because you cannot read an order off plots until you have fitted something. ::no The PACF is the plot that pairs with p, and a clean cutoff after lag 2 in the PACF, with a gradually fading ACF beside it, is the AR(2) fingerprint. Counting bars on the wrong plot is the classic slip: an ACF fading slowly is one pattern being passed along, not eight separate ones.

=== step === concept
## What the shop's two plots are asking for
::prose-only the two readings being interpreted here are the ACF and PACF values already printed on the page

Let's take the rule back to the coffee shop.

The shop's PACF read 0.477 at lag 1, then 0.051, minus 0.016, 0.134, and smaller still after that. Against a band of 0.146, exactly one bar counts. That is a cutoff after lag 1.

Its ACF read 0.477, 0.267, 0.133, 0.171, 0.143, 0.111 and on down. You could be tempted to call that a cutoff after lag 2, because 0.133 at lag 3 drops inside the band of 0.146.

It is not a cutoff. A cutoff drops inside the band and stays inside, and this one pops back out to 0.171 at lag 4 before fading away for good. Bars that sink towards zero while wobbling on the way down are a tail.

The PACF cuts after lag 1 and the ACF tails beside it, so the rule calls it AR(1). Add the one difference that flattened the series in the first place, and the shortlist opens with **ARIMA(1, 1, 0)**.

One candidate is not a decision, though. Real plots are never as tidy as the rule imagines, and you just saw how one wobble can invite a second reading. So take the neighbours along too: ARIMA(1, 1, 1), which adds one surprise term, and ARIMA(2, 1, 0), which leans on two days instead of one.

That gives you three candidates, all of them sharing the same d. Something has to choose between them, and it will not be your eyes.

=== step === concept
## AICc: the fit, minus a fee for every extra term

Any model fits better once you add terms to it. Give ARIMA enough of them and it will trace your data perfectly and forecast nothing useful, because it has memorised the noise along with the pattern.

**AICc** is the score that stops that happening. It measures how well a model fits, then charges a fee for every coefficient the model used, with an extra loading when the series is short. Lower is better, the units mean nothing on their own, and only the gaps between models matter.

Two rules come with it.

1. A gap under about 2 points is a tie. When two models land that close, take the one with fewer terms.
2. Only compare models that share the same d. Differencing changes what the model is being fitted to, so scores from different d values are measured on different things.

Here are the three candidates the shop's plots produced, plus a fourth: ARIMA(0, 1, 0), which differences once and then does nothing at all.

Watch what gets handed to `Arima()`: the raw `cups`, not `daily_change`. The d sitting in the middle of the order is itself the instruction to difference, so the function takes that pass of subtraction on for you. You read the plots on the flattened series and you fit on the totals.

```r
# Score the shortlist and the do-nothing baseline, where lower is better
fit_110 <- Arima(cups, order = c(1, 1, 0))
fit_111 <- Arima(cups, order = c(1, 1, 1))
fit_210 <- Arima(cups, order = c(2, 1, 0))
fit_010 <- Arima(cups, order = c(0, 1, 0))

round(c("ARIMA(1,1,0)" = fit_110$aicc,
        "ARIMA(1,1,1)" = fit_111$aicc,
        "ARIMA(2,1,0)" = fit_210$aicc,
        "ARIMA(0,1,0)" = fit_010$aicc), 2)
#> ARIMA(1,1,0) ARIMA(1,1,1) ARIMA(2,1,0) ARIMA(0,1,0)
#>       886.00       887.36       887.38       933.50
```

Read the first three together. They land at 886.00, 887.36 and 887.38, a spread of 1.38 points across the lot. By the two-point rule they are tied, so the tie-break is simplicity, and ARIMA(1, 1, 0) is both the simplest and the lowest. It wins twice over.

Now read the fourth. Doing nothing after the difference costs 47.5 points. The single AR term that the PACF pointed at is not a rounding detail, it is carrying nearly everything the model knows.

[WARNING]
An AICc of 886.00 is neither good nor bad. Fit the same three orders to a different shop and every one of those numbers changes. The score only ever answers "which of these, on this series", never "is this model any good", and the check that answers the second question comes next.

=== step === concept
## Do the leftovers look like noise?

A score picks a winner out of a list. It cannot tell you whether the winner actually explained the shop, and for that there is a better question: what did the model fail to explain?

Every day, a fitted model makes a one-step prediction and misses by some amount. Those misses are the **residuals**, the leftovers. If the model caught every pattern in the data, the leftovers are pure noise, with no echo from one day to the next and nothing left to predict. If a pattern is still sitting in them, the model missed it and you can do better.

So let's run the same ACF you already know on the leftovers, and hope to see nothing.

```r
# Look at what ARIMA(1,1,0) could not explain
acf(residuals(fit_110), main = "Leftovers from ARIMA(1,1,0)")
```

Every bar sits inside the band the whole way along, apart from the one at lag 0, which is always 1. There is nothing left to pick up.

An eye can miss a small pattern spread thinly over many lags, so there is a test that pools all of them into one number. The **Ljung-Box test** takes the first ten lags together and asks how likely leftovers this correlated would be if the model had caught everything. A large p-value is the good news here.

```r
# Test the leftovers of ARIMA(1,1,0) across the first ten lags at once
Box.test(residuals(fit_110), lag = 10, type = "Ljung-Box", fitdf = 1)
#>
#> 	Box-Ljung test
#>
#> data:  residuals(fit_110)
#> X-squared = 7.0866, df = 9, p-value = 0.6281
```

The p-value comes back at 0.6281, which is comfortably large. There is no evidence of structure left over, so ARIMA(1, 1, 0) is confirmed rather than merely preferred.

`fitdf = 1` tells the test that one coefficient was estimated, which is why it reports 9 degrees of freedom instead of 10. Set it to the number of AR and MA terms in whichever model you fitted.

[KEY INSIGHT]
The leftovers test is the one that can fail you. AICc only ranks the models you happened to try, so the winner of a bad shortlist is still bad. Leftovers that still carry an echo say the answer was never on your list, and you go back to the two plots.

=== step === tryit
## Your turn: what does the lazy model leave behind?

`fit_010` is ARIMA(0, 1, 0): difference once, then nothing. It came last on AICc, and a score on its own never tells you how badly. Read its AICc, then run the same leftovers test on it. Because it estimated no coefficients at all, use `fitdf = 0`.

```r
# fit_010 is the model that differences once and stops there.
# Print its AICc rounded to 2 places, then run the Ljung-Box test
# on its leftovers over the first ten lags with fitdf = 0.
# Two lines. Press Check when you have them.
```
::check {"regex": "Box\\.test\\s*[(]\\s*residuals\\s*[(]\\s*fit_010", "gate": true, "difficulty": "beginner", "ok": "There it is: a p-value of 1.46e-11, which written out is 0.0000000000146. The leftovers of the do-nothing model are packed with structure, and that structure is precisely the AR(1) memory the PACF pointed at.", "no": "Two lines. First round(fit_010$aicc, 2) for the score, then the same Box.test call as before with fit_010 in place of fit_110 and fitdf = 0."}
::solution
```r
# Score the do-nothing model and test what it left behind
round(fit_010$aicc, 2)
#> [1] 933.5

Box.test(residuals(fit_010), lag = 10, type = "Ljung-Box", fitdf = 0)
#>
#> 	Box-Ljung test
#>
#> data:  residuals(fit_010)
#> X-squared = 72.494, df = 10, p-value = 1.46e-11
```

Put the two verdicts side by side. ARIMA(1, 1, 0) left behind a p-value of 0.6281, and ARIMA(0, 1, 0) left behind 1.46e-11, which is R's shorthand for 0.0000000000146. One model is finished, and the other still has a whole pattern sitting in its errors.

=== step === concept
## What the automatic search adds, and when to overrule it

Everything so far can be done in a single line. The forecast package runs its own search across orders, scoring each one the way you just did, and hands back the winner.

```r
# Let the automatic search pick an order and see whether it agrees
auto_fit <- auto.arima(cups)
auto_fit
#> Series: cups
#> ARIMA(1,1,0)
#>
#> Coefficients:
#>          ar1
#>       0.4907
#> s.e.  0.0648
#>
#> sigma^2 = 8.111:  log likelihood = -440.96
#> AIC=885.93   AICc=886   BIC=892.3
```

It came back with the same order you read off the plots, ARIMA(1, 1, 0). The label under `Series: cups` is the answer, and `ar1 = 0.4907` is the coefficient it estimated, which says about 49% of yesterday's change carries into today. The code that built this shop used 0.55, so the estimate lands a shade under the truth. On 180 days, that is about as close as you should expect to get.

So why do the reading by hand at all?

Because that search is a shortlist competition too, and it can only hand you an order it thought to try. Three situations call for your own answer.

1. **The leftovers fail.** The search optimises the score and never checks what the model left behind. A model can win on AICc and still leave an echo in its errors, and that check is yours to run.
2. **The search skips candidates.** By default it walks the order space a move at a time rather than trying everything, so a good order two moves away can be missed. Reading the plots tells you which orders deserve a look regardless.
3. **You know something the data cannot show.** A shop that moved premises halfway through the record has a break in it, not a pattern, and no amount of searching will tell you that. You will.

[NOTE]
When the automatic answer and your own reading disagree, do not simply take the lower score. Fit both, run the leftovers test on both, and choose the one whose errors look most like noise. If they both pass, take the simpler one.

=== step === quiz
## Quick check: reading a fresh pair of plots

A bakery hands you 240 days of loaf sales. The raw totals climb, and `ndiffs()` returns 1. On the differenced series the ACF reads 0.52, 0.31, 0.04, minus 0.02 and smaller after that, while the PACF reads 0.52, 0.06, minus 0.21, 0.11, minus 0.09 and keeps wobbling down. The band is 0.127. What order is that pair asking for?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- ARIMA(2, 1, 0), because two bars clear the band before the run of small ones begins. ::no
- ARIMA(2, 0, 2), because both plots have two bars outside the band and the series needed no differencing. ::no
- ARIMA(0, 1, 1), because the first ACF bar is the only one that really matters. ::no
- ARIMA(0, 1, 2), because the ACF cuts off after lag 2 while the PACF trails away, and one difference was needed. ::ok Exactly. 0.52 and 0.31 both clear the band of 0.127, then 0.04 drops inside it and stays there, which is a cutoff after lag 2. The PACF keeps throwing up bars around and past the band while flipping sign, which is a tail. ACF cuts with PACF tailing is MA, so q = 2 and p = 0, and ndiffs already gave d = 1.
- ARIMA(1, 1, 1), because both plots have a tall first bar. ::no The ACF is the plot that cuts here: 0.52, 0.31, then 0.04 and inside the band for good. The PACF wobbles down through minus 0.21 and 0.11 with no clean break, which is a tail rather than a cutoff. A cutting ACF beside a tailing PACF is the MA fingerprint, and the cut lands after lag 2.

=== step === quiz
## Quick check: two orders, one point apart

You fit two orders to the same series, both with d = 1. ARIMA(2, 1, 1) scores 612.4 on AICc and its leftovers return a Ljung-Box p-value of 0.004. ARIMA(1, 1, 0) scores 613.5 and its leftovers return 0.71. Which do you ship?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- ARIMA(2, 1, 1), because it has the lower AICc and lower always wins. ::no
- ARIMA(2, 1, 1), because it has more terms, so it must be capturing more of the series. ::no
- ARIMA(1, 1, 0), because its leftovers pass while the rival's leftovers still carry structure, and 1.1 points of AICc is a tie anyway. ::ok Both halves matter. A 1.1-point gap sits inside the two-point rule, so the scores are saying the same thing and the tie-break is simplicity. Then the leftovers settle it outright: 0.004 says ARIMA(2, 1, 1) missed a pattern that is still sitting in its errors, and no score rescues that.
- Neither, because AICc and the leftovers test disagree, so both models are unusable. ::no The two checks are not rivals. AICc ranks the models you tried, and a 1.1-point gap means it is not really ranking them at all, it is calling them tied. The leftovers test is the one carrying a verdict: 0.004 means structure remains in the errors of ARIMA(2, 1, 1), while 0.71 means ARIMA(1, 1, 0) left nothing behind.

=== step === tryit
## Your turn: choose the order for the second branch

The shop opened a second branch, and it has 150 trading days on the books, with 196 cups on its first day and 299 on its last. Run the whole loop on it.

Difference it once into `branch2_change`, print the band along with the first six ACF values and the first six PACF values of that differenced series, then read the pair. Which of the two cuts off, and after which lag?

```r
# The second branch: 150 trading days of cups sold, climbing like the first shop.
# Build branch2_change with diff(), print 1.96 / sqrt(n) for the band,
# then print the first six ACF and the first six PACF values of the change.
# Press Check when the two readings are on screen.
set.seed(14)
branch2 <- round(190 + cumsum(arima.sim(list(ma = 0.7), n = 150, sd = 4) + 0.5))
```
::check {"regex": "pacf\\s*[(]\\s*branch2_change", "gate": true, "difficulty": "intermediate", "ok": "Now read what came back. The ACF gives 0.465 and then minus 0.001, minus 0.064 and smaller, all inside the band of 0.161, so it cuts off after lag 1. The PACF gives 0.465, minus 0.278, 0.091, minus 0.043, flipping sign and shrinking with no break, which is a tail. ACF cuts with PACF tailing is MA, so this branch reads as ARIMA(0, 1, 1).", "no": "Four printed lines. branch2_change is diff(branch2); the band is round(1.96 / sqrt(length(branch2_change)), 3); the readings are round(acf(branch2_change, plot = FALSE)$acf[2:7], 3) and round(pacf(branch2_change, plot = FALSE)$acf[1:6], 3)."}
::solution
```r
# Difference the second branch, read both plots, then score two candidate orders
branch2_change <- diff(branch2)

round(1.96 / sqrt(length(branch2_change)), 3)
#> [1] 0.161

round(acf(branch2_change, plot = FALSE)$acf[2:7], 3)
#> [1]  0.465 -0.001 -0.064 -0.027  0.030  0.007

round(pacf(branch2_change, plot = FALSE)$acf[1:6], 3)
#> [1]  0.465 -0.278  0.091 -0.043  0.063 -0.058

round(c("ARIMA(0,1,1)" = Arima(branch2, order = c(0, 1, 1))$aicc,
        "ARIMA(1,1,0)" = Arima(branch2, order = c(1, 1, 0))$aicc), 2)
#> ARIMA(0,1,1) ARIMA(1,1,0)
#>       836.51       849.29
```

Notice that the PACF's second bar does clear the band, at minus 0.278. That is not a cutoff, it is the alternating decay an MA series always shows on its PACF, and the ACF dropping to minus 0.001 straight after lag 1 is the clean reading that settles the pair.

The reading said MA(1) and the score agrees: ARIMA(0, 1, 1) beats the AR alternative by 12.8 points, far outside the two-point tie. The first shop leaned on its own past days and this branch carries its surprises instead, which is the same procedure landing on a genuinely different answer.

=== step === concept
## References

- Box, Jenkins, Reinsel and Ljung (2015), Time Series Analysis: Forecasting and Control, 5th edition, Wiley. The book that set out the identify, estimate and check procedure followed here.
- [Forecasting: Principles and Practice, chapter 9](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos, 3rd edition. Non-seasonal ARIMA and order selection, with the ACF and PACF reading rules laid out.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The AICc search behind the automatic order pick.
- [On a Measure of Lack of Fit in Time Series Models](https://doi.org/10.1093/biomet/65.2.297) - Ljung and Box (1978), Biometrika 65(2), 297 to 303. The leftovers test.
- [Testing the Null Hypothesis of Stationarity Against the Alternative of a Unit Root](https://doi.org/10.1016/0304-4076%2892%2990104-Y) - Kwiatkowski, Phillips, Schmidt and Shin (1992), Journal of Econometrics 54, 159 to 178. The stationarity test used to settle d.

=== step === complete
## The order you chose, and how to say it out loud

You started with 180 days of cup counts and finished with three integers you can defend. Here is the whole loop in five lines.

- The shop's level moved, from about 316 cups a day early on to 386 late on, so the raw totals could not be modelled directly.
- One difference flattened it. KPSS on the changes came back at 0.0852 and `ndiffs()` said 1, so d = 1. A second difference widened the spread and planted a negative echo, which is the sign that you went one too far.
- The PACF cut off after lag 1 and the ACF faded away beside it. A PACF that cuts with an ACF that tails is AR, so the shortlist opened at ARIMA(1, 1, 0), with ARIMA(1, 1, 1) and ARIMA(2, 1, 0) alongside it.
- AICc put those three at 886.00, 887.36 and 887.38, a tie by the two-point rule, and a tie goes to the simplest. Differencing and then doing nothing scored 933.50.
- The leftovers of ARIMA(1, 1, 0) returned a Ljung-Box p-value of 0.6281, so nothing was left unexplained and the order was confirmed.

And when somebody asks what you fitted:

"The shop's sales climb, so I modelled the daily change instead of the total. That change leans on the day before it and nothing further back, which makes it ARIMA(1, 1, 0). Three near-identical models scored within 1.4 points of each other, I took the simplest, and its errors came back as noise."

That is the whole job. Flatten, read, score, and then check what is left over. It is the same four moves, whatever series lands on your desk next. Nice work getting through it.
