---
title: "ACF and PACF: how to read the plots for ARIMA orders"
slug: "ARIMA-Mini-2"
description: "Read ACF and PACF plots the way a forecaster does. What every bar measures, which ones count, and how the two shapes hand you the p and q of an ARIMA."
keywords: "ACF and PACF, how to read an ACF plot, PACF plot, ARIMA orders, choosing p and q, autocorrelation, partial autocorrelation, autocorrelation in R, ARIMA order selection"
mathjax: false
webr: true
date: "2026-08-21"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "2"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-1"
course_next: ""
curriculum_id: "0.0.10"
lesson_access: "windowed"
catalog_blurb: "How to read the two plots that tell you an ARIMA model's orders."
---

=== step === cover
::eyebrow ARIMA from Zero
## ACF and PACF: how to read the plots for ARIMA orders

Let's say you run a coffee shop, and for months your daily sales have been telling you something plain. A busy day tends to be followed by another busy day.

You already believe that much. What you cannot tell just by looking is how far the echo reaches. Does a busy Monday still push Thursday up, or has it died out by Tuesday?

It is a fair question, and the answer is already sitting in the numbers you have.

Here is what it looks like. We took 120 trading days of cups sold, lined the series up against itself one day back, two days back, three and four, and then measured how tightly each pairing moves together.

::widget correlation-heatmap {"vars": ["today", "1 day back", "2 days back", "3 days back", "4 days back"], "matrix": [[1, 0.67, 0.43, 0.28, 0.14], [0.67, 1, 0.67, 0.43, 0.28], [0.43, 0.67, 1, 0.67, 0.43], [0.28, 0.43, 0.67, 1, 0.67], [0.14, 0.28, 0.43, 0.67, 1]]}

Read the top row. Today against yesterday comes out at 0.67. Against two days back it drops to 0.43, then 0.28, then 0.14. So the echo is real, and it fades as you walk backwards.

That row of numbers has a name. It is called the ACF. There is a second reading called the PACF, and it asks a sharper version of the same question: once you already know what yesterday did, does Monday still add anything of its own?

Those two answers are what hand you the AR and MA terms of an ARIMA model. So we are not going to memorise any rules here. We are going to build both readings out of the shop's own numbers, one at a time, until you can look at any pair of plots and say out loud what the data is asking for.

=== step === concept
## 120 days of cups sold at one coffee shop

Before we read a single bar, we need a series where you and I both already know the right answer. Otherwise every reading that follows is just a claim with nothing behind it.

So we are going to build the shop's 120 days on purpose, out of one rule said out loud. A normal day is 210 cups. Whatever gap yesterday had above or below 210, today keeps 0.7 of it, and then the day gets a fresh surprise on top: new faces, the weather, a delivery van parked across the door.

Written out, the rule is this: today = 210 + 0.7 times (yesterday minus 210) + a random nudge. Notice that nothing in it reaches further back than yesterday. That is going to matter a great deal in a few minutes.

Press Run to build the shop's 120 days and look at them.

```r
# Build 120 days of cups sold at the coffee shop and plot the series
set.seed(6)
cups <- numeric(120)
cups[1] <- 210

for (i in 2:120) {
  gap_yesterday <- cups[i - 1] - 210
  cups[i] <- 210 + 0.7 * gap_yesterday + rnorm(1, mean = 0, sd = 14)
}
cups <- round(cups)

head(cups, 8)
#> [1] 210 214 204 218 240 231 230 206

plot(cups, type = "l", col = "steelblue", lwd = 2,
     main = "Cups sold, 120 trading days",
     xlab = "Trading day", ylab = "Cups sold")
```

`set.seed(6)` pins the random nudges so your numbers come out the same as mine. The loop then walks the days one at a time, and `rnorm(1, mean = 0, sd = 14)` draws that day's surprise: nothing on average, but usually about 14 cups either side.

Now look at the line it drew. It moves between 169 and 268 cups without ever heading anywhere in particular. Busy days arrive in runs, and then the shop goes quiet for a stretch. Those runs are the echo we are after, and measuring them is the whole job.

=== step === concept
## How much does today look like yesterday?

Let's start with the simplest version of the question. How much does today look like yesterday?

There is nothing fancy in the answer. Write the 120 days out twice, slide the second copy down by one row, and now every day sits beside the day before it. You get 119 pairs, because day 1 has no day in front of it to pair with.

Then take the ordinary correlation of those two columns.

```r
# Pair every day with the day before it, then take the ordinary correlation
n <- length(cups)
today     <- cups[2:n]
yesterday <- cups[1:(n - 1)]

length(today)
#> [1] 119

round(cor(yesterday, today), 3)
#> [1] 0.663
```

`cor()` here is the same correlation you would run on height against weight. Nothing about time series changes what it means: 1 is a perfect straight-line link, and 0 is no link at all.

And the answer is 0.663. That is the lag-1 reading from the grid's top row, now built in front of you instead of handed to you. So a busy day really is followed by a busy day more often than not.

Below are those 119 pairs drawn out, with yesterday along the bottom and today up the side. Press Run this chart and it will build the real plot from them.

::widget chart-plotter {"data": [{"x":210,"y":214},{"x":214,"y":204},{"x":204,"y":218},{"x":218,"y":240},{"x":240,"y":231},{"x":231,"y":230},{"x":230,"y":206},{"x":206,"y":217},{"x":217,"y":216},{"x":216,"y":199},{"x":199,"y":227},{"x":227,"y":205},{"x":205,"y":216},{"x":216,"y":209},{"x":209,"y":201},{"x":201,"y":204},{"x":204,"y":230},{"x":230,"y":209},{"x":209,"y":205},{"x":205,"y":237},{"x":237,"y":236},{"x":236,"y":209},{"x":209,"y":237},{"x":237,"y":213},{"x":213,"y":214},{"x":214,"y":197},{"x":197,"y":200},{"x":200,"y":236},{"x":236,"y":248},{"x":248,"y":229},{"x":229,"y":214},{"x":214,"y":219},{"x":219,"y":200},{"x":200,"y":188},{"x":188,"y":211},{"x":211,"y":208},{"x":208,"y":218},{"x":218,"y":238},{"x":238,"y":227},{"x":227,"y":199},{"x":199,"y":190},{"x":190,"y":190},{"x":190,"y":190},{"x":190,"y":194},{"x":194,"y":202},{"x":202,"y":194},{"x":194,"y":195},{"x":195,"y":225},{"x":225,"y":221},{"x":221,"y":220},{"x":220,"y":216},{"x":216,"y":221},{"x":221,"y":209},{"x":209,"y":227},{"x":227,"y":206},{"x":206,"y":222},{"x":222,"y":197},{"x":197,"y":179},{"x":179,"y":187},{"x":187,"y":195},{"x":195,"y":203},{"x":203,"y":213},{"x":213,"y":197},{"x":197,"y":178},{"x":178,"y":183},{"x":183,"y":194},{"x":194,"y":196},{"x":196,"y":187},{"x":187,"y":183},{"x":183,"y":199},{"x":199,"y":197},{"x":197,"y":194},{"x":194,"y":199},{"x":199,"y":194},{"x":194,"y":194},{"x":194,"y":189},{"x":189,"y":193},{"x":193,"y":214},{"x":214,"y":224},{"x":224,"y":237},{"x":237,"y":266},{"x":266,"y":248},{"x":248,"y":268},{"x":268,"y":250},{"x":250,"y":217},{"x":217,"y":195},{"x":195,"y":220},{"x":220,"y":214},{"x":214,"y":208},{"x":208,"y":198},{"x":198,"y":175},{"x":175,"y":191},{"x":191,"y":213},{"x":213,"y":225},{"x":225,"y":222},{"x":222,"y":195},{"x":195,"y":213},{"x":213,"y":202},{"x":202,"y":196},{"x":196,"y":186},{"x":186,"y":180},{"x":180,"y":190},{"x":190,"y":197},{"x":197,"y":187},{"x":187,"y":193},{"x":193,"y":195},{"x":195,"y":197},{"x":197,"y":209},{"x":209,"y":204},{"x":204,"y":193},{"x":193,"y":189},{"x":189,"y":183},{"x":183,"y":169},{"x":169,"y":197},{"x":197,"y":195},{"x":195,"y":208},{"x":208,"y":209},{"x":209,"y":217},{"x":217,"y":201}], "geoms": ["point"], "x": "yesterday", "y": "today"}

The cloud of points tilts upward, and that same correlation is printed beside it. So this is what 0.663 actually looks like.

=== step === concept
## The echo at two, three and four days back is the ACF

Now let's push the same question further back. Slide the second copy down by two rows instead of one and you are pairing today with two days ago. Slide it by three, then four, then twenty. Each slide hands you one more correlation.

The size of the slide is called the lag. So lag 1 is yesterday, lag 2 is the day before that, and lag 20 is three working weeks ago.

That whole sequence of answers, one correlation per lag, is the autocorrelation function. Everybody calls it the ACF. You will never have to slide those columns by hand, because `acf()` does every lag in one go.

```r
# Get the correlation at every lag at once, first as numbers and then as a plot
acf(cups, plot = FALSE, lag.max = 4)
#> 
#> Autocorrelations of series 'cups', by lag
#> 
#>     0     1     2     3     4 
#> 1.000 0.663 0.430 0.276 0.139 

acf(cups, main = "ACF of cups sold")
```

Let's read that output. Lag 0 pairs the series with an unshifted copy of itself, so it is always 1.000 and it tells you nothing. Lag 1 is 0.663, which is the very number we built by hand a moment ago.

Now read the fade: 0.430, then 0.276, then 0.139. A busy day can still be heard four days later, and it gets fainter with every step back.

In the plot, each vertical bar is one of those numbers, with the lag along the bottom. The two dashed blue lines are the part everyone squints at, so let's pin down exactly what they are.

=== step === concept
## What counts as a real spike and what is just wiggle

Here is the awkward part about correlations. If you took 120 days of pure noise, a shop with no memory at all, the bars would still not come out at zero. They would jitter around it.

So a bar being bigger than zero proves nothing on its own. What we need is a line that says: anything shorter than this is the jitter that noise hands you anyway.

That line is `1.96 / sqrt(n)`, where n is how many observations you have. It is where the dashed lines sit on every ACF and PACF plot that R draws for you.

```r
# Work out the band this series uses to separate a real spike from wiggle
round(c(band = 1.96 / sqrt(length(cups))), 3)
#>  band 
#> 0.179 
```

For our 120 days the band comes out at 0.179. A bar taller than 0.179, or lower than minus 0.179, counts as real. A bar inside it counts as nothing.

So let's go back and grade the ACF we just drew. Lag 1 at 0.663 is way outside. Lag 2 at 0.430 and lag 3 at 0.276 clear it too. Lag 4 at 0.139 does not, so we treat that one as noise.

Now run your eye all the way to the right of that plot, where one lone bar out near lag 20 dips just past the lower line. R draws twenty bars here, and the band is drawn so that roughly one bar in twenty strays past it by luck alone. So a single bar standing on its own a long way from lag 1, with nothing but noise on either side of it, is not a term to go and fit. The bars worth counting sit near the start and arrive in a run.

[NOTE]
The band moves with the length of the series, and it moves a lot. At 120 days it is 0.179. At 500 days it would be 0.088, so a bar of 0.13 would count there and it would not count here. Always read a plot against its own band, and never against a number you remember from another plot.

=== step === quiz
## Quick check: which bars actually count?

The shop's ACF reads 0.663 at lag 1, then 0.430, then 0.276, then 0.139, and the band for these 120 days is 0.179. Which bars count as real?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- All four, because every one of them is above zero. ::no
- Only lag 1, because it is by far the tallest bar on the plot. ::no
- Lags 1, 2 and 3, because 0.663, 0.430 and 0.276 all clear 0.179, and 0.139 does not. ::ok Exactly. Grading a bar is one comparison: is it outside this series' own band, or inside it? How tall it looks next to the other bars has nothing to do with it.
- None of them, because none of them reaches 1.000. ::no A bar counts when it falls outside the band for that series, which is 0.179 here. Being above zero is not enough, since noise alone produces bars above zero all the time. Being the tallest is not it either, and 1.000 only ever happens at lag 0, where the series is compared with itself.

=== step === concept
## Why the two-days-back bar is not what it looks like

The ACF says today and two days ago correlate at 0.430. It is tempting to read that as: the day before yesterday has a hold of its own on today.

Hold on, because there is a simpler explanation. Today leans on yesterday at 0.663. And yesterday leans on the day before it at 0.663 as well. So part of that two-day link may be no link at all, just yesterday passing the message along.

How much would the passing along on its own produce? Let's multiply the two together and see whether that accounts for the whole thing.

```r
# Compare the lag-2 echo that pure pass-through would give with the bar we measured
acf_cups <- acf(cups, plot = FALSE, lag.max = 2)$acf

round(c(passed_through_yesterday = acf_cups[2] * acf_cups[2],
        bar_we_actually_got      = acf_cups[3]), 3)
#> passed_through_yesterday      bar_we_actually_got 
#>                    0.439                    0.430 
```

`acf_cups[2]` is the lag-1 value and `acf_cups[3]` is lag 2, because the first slot in that vector holds lag 0.

Passing along on its own predicts 0.439. We measured 0.430. For our purposes those are the same number, which means the lag-2 bar is fully explained by the route through yesterday. There is nothing left over for a direct link.

So a tall ACF bar does not prove a direct connection at that lag, and the ACF has no way of telling the two apart. To separate them we need a different measurement.

=== step === concept
## Holding yesterday still to see what Monday adds

The fix is the one you would reach for in any regression. If you want to know what two days back is worth on its own, put both days into the same model and make them compete for the credit.

Then read the coefficient on two days back. It answers a precise question: with yesterday already accounted for, does the day before yesterday still move today?

So let's build the two shifted columns and fit it.

```r
# Fit today on yesterday and two days back, so each is judged with the other held still
lag1 <- c(NA, cups[1:119])
lag2 <- c(NA, NA, cups[1:118])

echo_fit <- lm(cups ~ lag1 + lag2)
round(summary(echo_fit)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   71.153     15.951   4.461    0.000
#> lag1           0.675      0.094   7.218    0.000
#> lag2          -0.018      0.094  -0.193    0.847
```

`lag1` is the cups column shifted down one row, padded with `NA` at the top because day 1 has no day before it. `lag2` is the same idea shifted down two. `lm()` drops the rows holding an `NA` on its own and fits the rest.

The last column, `Pr(>|t|)`, is the p-value: roughly, how ordinary this coefficient would look if the true one were zero. Small means the effect is hard to write off as luck. Large means we cannot tell it from zero.

Read the `lag1` row: 0.675, with a p-value printed as 0.000. Yesterday matters, and 0.675 sits right next to the 0.7 we built into the shop.

Now read `lag2`: minus 0.018, with a p-value of 0.847. Once yesterday is held still, two days back adds nothing you could tell apart from zero. The whole of that 0.430 was the message being passed along, exactly as we suspected.

=== step === concept
## The bars you get when the echo is stripped out

That regression is exactly what a partial autocorrelation is, and `pacf()` runs it for you at every lag. At lag k it fits today on all the lags up to k, and then it reports only the coefficient on lag k itself.

Partial is the important word there. It means the part that belongs to this lag alone, after the shorter lags have taken their share. And the whole sequence of those answers is the PACF.

```r
# Ask what each lag adds on its own, once the shorter lags are held still
pacf(cups, plot = FALSE, lag.max = 6)
#> 
#> Partial autocorrelations of series 'cups', by lag
#> 
#>      1      2      3      4      5      6 
#>  0.663 -0.015 -0.006 -0.067  0.027  0.065 

pacf(cups, main = "PACF of cups sold")
```

Lag 1 reads 0.663, the same value the ACF gave, and that is no coincidence. At lag 1 there is nothing in between to strip out, so the two readings have to agree.

Now watch what happens after it. Minus 0.015, then minus 0.006, then minus 0.067, then 0.027, then 0.065. Every one of them is well inside the 0.179 band, and they stay inside all the way out to lag 20. The plot falls off a cliff after lag 1 and it never climbs back.

Notice also that the table starts at lag 1 rather than lag 0. That is because a series against an unshifted copy of itself has no shorter lag to hold still, so it has nothing left to tell you.

=== step === tryit
## Your turn: does three days back add anything?

You have watched two days back come up empty once yesterday was held still. Now let's check three.

A third shifted column is already built for you below. Put all three lags into one model, then read the row for `lag3`.

```r
# Add a third lag to the regression and see what it is worth on its own
lag3 <- c(NA, NA, NA, cups[1:117])

# Fit cups on lag1, lag2 and lag3, then print the coefficient table
# rounded to three places. Two lines. Press Check when you have them.
```
::check {"regex": "lm[(][^)]*lag3", "gate": true, "difficulty": "beginner", "ok": "Right. Three days back comes in at minus 0.006 with a p-value of 0.954, so it adds nothing at all once yesterday is in the model. Yesterday keeps 0.677 and holds the entire story on its own.", "no": "Put all three columns into one model and let them compete: `three_fit <- lm(cups ~ lag1 + lag2 + lag3)`, then `round(summary(three_fit)$coefficients, 3)`."}
::solution
```r
# Fit all three lags together and read the lag3 row
three_fit <- lm(cups ~ lag1 + lag2 + lag3)
round(summary(three_fit)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   71.401     17.406   4.102    0.000
#> lag1           0.677      0.094   7.176    0.000
#> lag2          -0.015      0.114  -0.132    0.896
#> lag3          -0.006      0.094  -0.058    0.954
```

Yesterday holds at 0.677. Two days back and three days back both sit at effectively zero, with p-values of 0.896 and 0.954. That is the same verdict `pacf()` gave us in one line, which is reassuring, because it means the function is running this very regression for you and not doing something mysterious.

=== step === quiz
## Quick check: the two lag-2 bars measure different things

The ACF put lag 2 at 0.430. The PACF put lag 2 at minus 0.015. Both are correct readings of the same 120 days. What is the difference between them?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- They measure the same quantity, so a gap that large means one of the two functions has gone wrong. ::no
- The ACF bar counts everything linking today to two days ago, including whatever travels through yesterday. The PACF bar counts only what two days back adds once yesterday is held still. ::ok That is it. One is the total link and the other is the direct link. Here the total was almost entirely made of the indirect route, which is why stripping that route out left nothing behind.
- The ACF bar is the raw correlation and the PACF bar is the same correlation with the mean subtracted first. ::no
- The PACF bar is always the smaller of the two, because partial means a fraction of the whole. ::no The ACF measures the total link between today and a day k back, indirect routes included. The PACF measures only the direct part, after the days in between are held still. Both of them use the mean, and neither is guaranteed to be the smaller one: a PACF bar can be bigger than its ACF twin, and it can come out negative while the ACF twin is positive.

=== step === concept
## Only yesterday matters, and that is p

Let's put the shop's two plots one above the other. Stacked like that, the pattern is impossible to miss.

```r
# Show both plots together: one trails away, the other cuts off
par(mfrow = c(2, 1), mar = c(4, 4, 3, 1))
acf(cups,  main = "ACF: it trails away")
pacf(cups, main = "PACF: one bar, then nothing")
par(mfrow = c(1, 1))
```

The ACF slides down slowly, 0.663 to 0.430 to 0.276 to 0.139, fading toward the band without ever stopping short. When bars shrink by degrees like that, we say the plot tails off.

The PACF does the opposite. One bar at 0.663, and then everything is inside the band and stays there. When bars drop inside the band at some lag and never come back out, we say the plot cuts off, and this one cuts off after lag 1.

That pairing has a name. A series where today is built out of its own recent values is called autoregressive, written AR(p), and p is how many of its own past days it needs. The signature never varies: for an AR(p), the ACF tails off and the PACF cuts off at lag p.

Here the PACF cuts off after lag 1, so p = 1. And that is the truth, because we wrote the shop a rule that reaches back exactly one day.

So let's go back to the question the shop's numbers raised. Does a busy Monday still push Thursday? No, it does not. Monday pushes Tuesday, Tuesday pushes Wednesday, and that is the whole of the chain. The ACF made it look as though Monday reached Thursday directly, at 0.139. The PACF showed us that the message was only ever being handed along.

[KEY INSIGHT]
The AR order lives in the PACF, and you read it by counting: p is the last lag whose PACF bar stands outside the band before the plot collapses. The ACF is what tells you there is memory at all. The PACF is what tells you how deep it runs.

=== step === concept
## A second kind of memory: a day of buzz that fades tomorrow

Not every series remembers by leaning on its own past levels. And the other kind of memory changes which plot you read.

So picture a different stretch of the same shop. The local paper mentions you, or the weather turns, and that day gets a jolt. The jolt is not a level the shop settles into, it is a one-off event. But it does spill over, because whoever came in for the buzz brings a friend tomorrow, and after that it is spent.

So each day's cups are 210, plus today's surprise, plus 0.8 of yesterday's surprise. Now notice what is missing from that rule. Yesterday's cups are nowhere in it. Only yesterday's surprise carries over.

```r
# Build a stretch where each day carries today's surprise plus part of yesterday's
set.seed(3)
shock <- rnorm(121, mean = 0, sd = 14)
buzz  <- round(210 + shock[2:121] + 0.8 * shock[1:120])

head(buzz, 8)
#> [1] 195 210 197 200 213 212 227 205

plot(buzz, type = "l", col = "darkorange", lwd = 2,
     main = "Cups sold, the buzz stretch",
     xlab = "Trading day", ylab = "Cups sold")
```

`shock` holds 121 surprises. `shock[2:121]` is today's and `shock[1:120]` is yesterday's, lined up so that each day is paired with the surprise that came before it.

To the naked eye this line looks much the same as the first stretch, moving between 171 and 238 cups. Two completely different rules can produce series that look alike on a chart, and that is exactly why nobody judges this by eye.

=== step === concept
## When the ACF cuts and the PACF trails away, that is q

Let's run both readings on the buzz stretch and watch what happens to the two shapes.

```r
# Read both plots on the buzz stretch and watch the two shapes swap over
acf(buzz, plot = FALSE, lag.max = 5)
#> 
#> Autocorrelations of series 'buzz', by lag
#> 
#>     0     1     2     3     4     5 
#> 1.000 0.473 0.008 0.042 0.092 0.066 

pacf(buzz, plot = FALSE, lag.max = 5)
#> 
#> Partial autocorrelations of series 'buzz', by lag
#> 
#>      1      2      3      4      5 
#>  0.473 -0.279  0.237 -0.068  0.078 

par(mfrow = c(2, 1), mar = c(4, 4, 3, 1))
acf(buzz,  main = "ACF: one bar, then nothing")
pacf(buzz, main = "PACF: it trails away")
par(mfrow = c(1, 1))
```

The two shapes have traded places. The ACF has one bar at 0.473 and then 0.008, then 0.042, then 0.092, all of them straight inside the 0.179 band, and they stay inside all the way out to lag 20, where the biggest stray reaches only 0.134. So the ACF cuts off after lag 1.

The PACF is the one fading now, and it fades by alternating: 0.473, then minus 0.279, then 0.237, then minus 0.068. Bars that swing either side of zero while they shrink are still tailing off, because tailing off is about the gradual shrink and not about staying positive. One bar further out, at lag 6, pokes just past the band at minus 0.199, which is the sort of stray you get when you look at twenty bars at once.

A series built out of recent surprises rather than recent values is called a moving average, written MA(q), and q is how many surprises back it reaches. Its signature is the mirror image of the AR one: the ACF cuts off at lag q and the PACF tails off.

Our ACF cuts off after lag 1, so q = 1. And that is right again, because the rule we wrote carries exactly one day of surprise.

=== step === quiz
## Quick check: which plot carries which order?

Someone hands you a series whose ACF slides down gently over many lags, while its PACF has three tall bars outside the band and then collapses inside it. What can you read, and from where?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- p = 3, read off the PACF, because the PACF is the plot that cuts off here. ::ok Yes. The cutting plot is the one that carries an order, and a cutting PACF gives you p. The tailing ACF is your confirmation that this is an AR series, not a place to count bars.
- q = 3, read off the PACF, because three bars stand outside the band there. ::no
- p = 3, read off the ACF, because AR memory is what the ACF was built to show. ::no
- Nothing can be read, because the two plots disagree with each other. ::no The order always comes off the plot that CUTS OFF, never the one that trails away. A cutting PACF gives p, a cutting ACF gives q, and the two plots showing different shapes is the normal and useful case rather than a problem. Here the PACF cuts after three bars, so p = 3.

=== step === concept
## Fitting the order you read and checking what is left over

Reading the order off the plots is only half the job. The other half is fitting it and then proving that nothing readable was left behind.

So let's fit the AR(1) we read off the shop's plots, and then run the ACF on whatever the model could not explain. Those leftovers are called the residuals: for each day, the cups that actually sold minus the cups the model expected.

```r
# Fit the AR(1) we read off the plots, then check what it could not explain
fit <- arima(cups, order = c(1, 0, 0))
fit
#> 
#> Call:
#> arima(x = cups, order = c(1, 0, 0))
#> 
#> Coefficients:
#>          ar1  intercept
#>       0.6580   207.6962
#> s.e.  0.0676     3.6008
#> 
#> sigma^2 estimated as 187.8:  log likelihood = -484.67,  aic = 975.35

leftover <- acf(residuals(fit), plot = FALSE, lag.max = 6)$acf[2:7]
names(leftover) <- paste0("lag", 1:6)
round(leftover, 3)
#>   lag1   lag2   lag3   lag4   lag5   lag6 
#>  0.017 -0.003  0.036 -0.061 -0.056  0.082 

Box.test(residuals(fit), lag = 10, type = "Ljung-Box", fitdf = 1)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(fit)
#> X-squared = 2.8156, df = 9, p-value = 0.9712
```

The three numbers in `order = c(1, 0, 0)` are p, d and q in that order, so this asks for one AR term, no differencing and no MA term. The fitted `ar1` comes back at 0.658, against the 0.7 we built into the shop.

Now comes the check that actually matters. Every one of those six bars sits well inside 0.179, the biggest being 0.082, so the model has taken the memory out and left plain noise behind. A tall bar out there would have meant a missing term.

The Ljung-Box test does that same check in one number instead of by eye. It asks whether the first ten residual bars, taken together, are bigger than noise alone would produce. `fitdf = 1` tells it that we spent one parameter estimating `ar1`, which is why it reports 9 degrees of freedom rather than 10.

A p-value of 0.971 says the leftovers cannot be told apart from noise. High is what you want here. Anything under 0.05 would be the test telling you that your model has left something readable on the table.

=== step === concept
## The four shapes and the model each one names

You have now watched both of the pure shapes turn up on real series. There are only four combinations in all, and the table below is the entire map.

| What the ACF does | What the PACF does | The model, and where the order comes from |
|---|---|---|
| Tails off | Cuts off after lag p | AR(p). Count the PACF bars outside the band. |
| Cuts off after lag q | Tails off | MA(q). Count the ACF bars outside the band. |
| Tails off | Tails off | ARMA(p, q). Neither plot names an order, so fit a few small candidates and compare. |
| Stays high, falls in a near-straight line | One big bar at lag 1 | Not readable yet. Difference the series first. |

The third row is the one that catches people out, so let's actually do it rather than talk about it. An ARMA is a series carrying both kinds of memory at once, a few of its own past days and a few of its own past surprises, and when both plots fade that is what you are looking at. There is nothing left to count. You fit two or three small candidates and let a score choose between them.

That score is the AIC. It rewards a model for fitting the data, and it charges that model for every extra term it carries. Lower is better. Here it is on the shop, comparing the model we read off the plots against one with an extra MA term bolted on.

```r
# Score the model we read off the plots against a bigger one
fit_ar1  <- arima(cups, order = c(1, 0, 0))
fit_arma <- arima(cups, order = c(1, 0, 1))

round(c(AR1 = AIC(fit_ar1), ARMA11 = AIC(fit_arma)), 2)
#>    AR1 ARMA11 
#> 975.35 977.31 
```

The AR(1) scores 975.35 and the ARMA(1,1) scores 977.31, so the simpler model wins. The extra term bought so little fit that the charge for carrying it came to more than the gain.

That is what the AIC is for. It is not there to replace reading the plots. It is there to settle the cases where the plots refuse to answer.

=== step === concept
## Bars that refuse to fall, and the trend hiding behind them

Now let's take one more stretch of the same shop, and this one breaks everything you have just learned. That is exactly why we are looking at it.

The shop went through a growth run. Word got round, and each day added a little on top of the day before and then kept it. Cups ran between a low of 174 and a high of 347 across the 120 days, and the line never comes back down to where it started.

```r
# Build the shop's growth stretch and read its ACF
set.seed(1)
grow <- round(180 + cumsum(rnorm(120, mean = 0.7, sd = 6)))

plot(grow, type = "l", col = "darkgreen", lwd = 2,
     main = "Cups sold, the growth stretch",
     xlab = "Trading day", ylab = "Cups sold")

grow_acf <- acf(grow, plot = FALSE, lag.max = 6)$acf[2:7]
names(grow_acf) <- paste0("lag", 1:6)
round(grow_acf, 3)
#>  lag1  lag2  lag3  lag4  lag5  lag6 
#> 0.970 0.939 0.907 0.878 0.849 0.819 

acf(grow, main = "ACF of the growth stretch")
```

`cumsum()` adds each day's change onto the running total, so the level never comes back to where it started.

Now look at those bars: 0.970, then 0.939, then 0.907, then 0.878. They are barely moving. Drawn out, they make a slow ramp that walks down in a near-straight line instead of dropping away.

That shape is not memory. It is trend. Today is near 300 cups and so was last week, so of course the two correlate, because both of them are simply high. Counting bars here would tell you the shop remembers a month back, which is nonsense.

The repair is differencing. Instead of working with the cups themselves, you work with the daily change, which is today minus yesterday. How many times you have to do that is the d in ARIMA, sitting between p and q.

[WARNING]
A near-straight, slowly falling ACF means stop. Nothing on either plot is worth counting until the series has been differenced and the slow decay is gone. Difference once, look again, and only difference a second time if the ramp is still standing. Over-differencing has a tell of its own: the lag-1 bar swings strongly negative. Difference this growth stretch twice and it drops to minus 0.524, which is the signal to undo the last one.

=== step === quiz
## Quick check: name the model from its two plots

Both of the shop's readable stretches ran on 120 days, so both used a band of 0.179.

The first stretch gave an ACF of 0.663, 0.430, 0.276, 0.139 and a PACF of 0.663 followed by bars that all sat inside the band. The second gave an ACF of 0.473 followed by bars inside the band, and a PACF of 0.473, minus 0.279, 0.237. What are they?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The first is AR(1) and the second is MA(1). ::ok Exactly right. The first has a cutting PACF, so its order is a p, and it cuts after one bar. The second has a cutting ACF, so its order is a q, and it also cuts after one bar. The same depth of memory, two different kinds of it.
- The first is MA(1) and the second is AR(1). ::no
- Both are AR(1), because both have a tall lag-1 bar in the ACF. ::no
- The first is AR(3), because three of its ACF bars clear the 0.179 band. ::no Work through it one plot at a time. Find the plot that cuts off: in the first stretch that is the PACF, so the order is a p, and in the second it is the ACF, so the order is a q. Then count the bars outside 0.179 on the cutting plot only, which gives 1 in both cases. Counting the ACF bars of the first stretch is the classic slip, because those three bars are the tail rather than the order.

=== step === tryit
## Your turn: read the order of Lake Huron's water levels

Now let's try this on data that nobody staged for you. `LakeHuron` ships with R, and it holds the water level of Lake Huron in feet, measured once a year from 1875 to 1972, which is 98 numbers in all.

Read its order the way you just read the shop's. The band and the PACF plot are set up for you below. Count the bars standing outside the band, fit that AR order, and then check the leftovers with a Ljung-Box test.

```r
# Read the AR order of Lake Huron water levels, then fit what you read
round(1.96 / sqrt(length(LakeHuron)), 3)
pacf(LakeHuron, main = "PACF of Lake Huron water levels")

# Count the PACF bars standing outside that band before the plot collapses.
# That count is your p. Fit it and store the fit in huron_fit, using
# arima(LakeHuron, order = c(p, 0, 0)) with your number in place of p.
# Then run Box.test on residuals(huron_fit) with lag = 10, the Ljung-Box
# type, and fitdf set to your p. Press Check when you have the fit.
```
::check {"regex": "order\\s*=\\s*c[(]\\s*2\\s*,\\s*0\\s*,\\s*0", "gate": true, "difficulty": "advanced", "ok": "That is the reading. The PACF gives 0.832 at lag 1 and minus 0.267 at lag 2, both outside the 0.198 band, and lag 3 falls back inside at 0.131. So p = 2, and the AR(2) fit leaves residuals the Ljung-Box test scores at 0.653: nothing readable left behind.", "no": "Read the PACF against 0.198 and count how many bars stand outside it before the plot collapses. That count goes straight into the fit, as `huron_fit <- arima(LakeHuron, order = c(p, 0, 0))`."}
::solution
```r
# The PACF cuts off after lag 2, so fit an AR(2) and check what is left
pacf(LakeHuron, plot = FALSE, lag.max = 5)
#> 
#> Partial autocorrelations of series 'LakeHuron', by lag
#> 
#>      1      2      3      4      5 
#>  0.832 -0.267  0.131  0.034  0.062 

huron_fit <- arima(LakeHuron, order = c(2, 0, 0))
huron_fit
#> 
#> Call:
#> arima(x = LakeHuron, order = c(2, 0, 0))
#> 
#> Coefficients:
#>          ar1      ar2  intercept
#>       1.0436  -0.2495   579.0473
#> s.e.  0.0983   0.1008     0.3319
#> 
#> sigma^2 estimated as 0.4788:  log likelihood = -103.63,  aic = 215.27

Box.test(residuals(huron_fit), lag = 10, type = "Ljung-Box", fitdf = 2)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(huron_fit)
#> X-squared = 5.9457, df = 8, p-value = 0.6533
```

Two bars clear the 0.198 band, at 0.832 and minus 0.267, and the third drops back inside at 0.131. So p = 2, and `arima()` returns an `ar1` of 1.044 and an `ar2` of minus 0.250. The water level leans on the two years before it, and that is a real physical memory rather than one we invented.

One residual bar, out at lag 9, reads 0.200 against a band of 0.198. Judge that by eye and you might start bolting on extra terms to chase it. The Ljung-Box test weighs all ten leftover bars together and scores 0.653, and that is the number to trust here, because across twenty bars one of them grazing the line is exactly what luck produces.

=== step === tryit
## Your turn: the shop's growth stretch, read properly

The growth run is still sitting in `grow`, and we left it unreadable. So let's fix it, and then say what is left.

Difference it once, draw the ACF of the differenced series, and read the bars against the band for that differenced series rather than the band for the original one.

```r
# The growth stretch needs differencing before any bar on it is worth reading
# grow holds the shop's 120 growth days.
# Difference it once and store that in grow_diff, then draw acf(grow_diff).
# Print the band for grow_diff too, since differencing costs you a day.
# Press Check when you have it.
```
::check {"regex": "diff[(]\\s*grow", "gate": true, "difficulty": "intermediate", "ok": "That is it. One difference and the ramp is gone: every bar now sits inside 0.18, and the biggest of the six printed only reaches minus 0.128. So d = 1, with no p and no q left to find, because a growth run made of random daily steps leaves pure noise behind once you take the daily change.", "no": "Work with the daily change instead of the level: `grow_diff <- diff(grow)`, then `acf(grow_diff)`."}
::solution
```r
# Difference once, then re-read the ACF against the differenced series own band
grow_diff <- diff(grow)

round(1.96 / sqrt(length(grow_diff)), 3)
#> [1] 0.18

acf(grow_diff, main = "ACF after one difference")

diff_acf <- acf(grow_diff, plot = FALSE, lag.max = 6)$acf[2:7]
names(diff_acf) <- paste0("lag", 1:6)
round(diff_acf, 3)
#>   lag1   lag2   lag3   lag4   lag5   lag6 
#> -0.029  0.023 -0.062 -0.054 -0.128 -0.109 
```

`diff()` hands back 119 numbers instead of 120, because the first day has nothing to subtract from, and that is why the band widens a little to 0.18.

And the ramp is gone. Every bar is inside the band, nothing cuts off and nothing tails off, so there is no p and no q left to read here. The growth stretch is ARIMA(0,1,0): difference it once and you are done.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition, section 2.8 Autocorrelation](https://otexts.com/fpp3/acf.html) - Hyndman and Athanasopoulos. What an autocorrelation is, and how the correlogram is drawn.
- [Forecasting: Principles and Practice, 3rd edition, section 9.5 Non-seasonal ARIMA models](https://otexts.com/fpp3/non-seasonal-arima.html) - Hyndman and Athanasopoulos. The ACF and PACF signatures used to choose p and q.
- [NIST/SEMATECH e-Handbook of Statistical Methods, 6.4.4.6 Box-Jenkins model identification](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc4463.htm) - the cutoff versus tail-off identification table, written out as a procedure.
- [Auto- and cross-covariance and correlation function estimation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - R Core Team, the documentation for `acf()` and `pacf()`, including the confidence band.

=== step === complete
## What the shop's two plots say, and how to say it out loud

You started with a hunch from the shop's daily numbers, and you finished with two plots you can read on any series. To pull it all together:

- Every bar on either plot is an ordinary correlation between the series and its own past. The ACF measures the total link at that lag, indirect routes included. The PACF measures only what that lag adds once the shorter ones are held still.
- A bar counts when it falls outside that series' own band, `1.96 / sqrt(n)`. For the shop's 120 days that was 0.179, and for Lake Huron's 98 years it was 0.198.
- The order always comes off the plot that cuts off. A cutting PACF gives you p, with the ACF tailing off beside it. A cutting ACF gives you q, with the PACF tailing off beside it.
- When both plots tail off, stop counting and let AIC pick between a few small candidates. When the ACF stays high and slides down in a near-straight line, difference the series first and read it again.
- Fitting the order is not the end of it. Run the ACF on the residuals and a Ljung-Box test over the first ten bars, and only believe the model if the leftovers look like noise.

So whenever somebody puts a pair of plots in front of you, here is the sentence to say:

"The ACF trails away and the PACF has one bar outside the band, so this is an AR(1). Today leans on yesterday and nothing further back, and once I fit it the leftovers are noise."

And that is also the shop's answer to the question we opened with. A busy Monday reaches Tuesday, and no further.

Fitting a full ARIMA model end to end, and judging whether it is any good, is a topic for another day. Congratulations, you made it through. Have a great day!
