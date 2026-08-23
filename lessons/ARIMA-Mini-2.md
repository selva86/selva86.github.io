---
title: "ARIMA from Zero Lesson 2: ACF and PACF: how to read the plots for ARIMA orders"
slug: "ARIMA-Mini-2"
description: "Read ACF and PACF plots the way a forecaster does: what one bar measures, why the dashed band decides, and how a cutoff hands you the p and q of an ARIMA."
keywords: "ACF and PACF, how to read ACF and PACF plots, ARIMA orders, partial autocorrelation, autocorrelation function, identify p and q, AR and MA order, correlogram"
mathjax: true
webr: true
date: "2026-08-24"
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
catalog_blurb: "How to read the two plots that give you an ARIMA order."
---

=== step === cover
::eyebrow ARIMA from Zero
## ACF and PACF: how to read the plots for ARIMA orders

Anand runs a coffee shop two streets from my office, and he worked something out on his own. A busy day at his place is usually followed by another busy day.

He is right about that. What he cannot tell me is how far back the pull runs. Does a heavy Monday still show up in Thursday's till, or has it worn off by Tuesday?

It is a fair question, and it is the exact question two plots were invented to answer.

The ACF and the PACF measure how strongly today's sales line up with one day ago, two days ago, three days ago, and so on down the line. Those correlations are what decide how many AR and MA terms a model needs. One tall bar at lag 1 and nothing after it is the series telling you that only yesterday matters.

We are going to read them on 150 days of Anand's cup sales, then on a shop that leans on two days instead of one, a shop driven by shocks, a counter whose trade drifts, and a shop that repeats itself every week. By the end you will recognise the shapes on sight.

Three things have to happen, in this order.

::widget process-flow {"steps":[{"title":"Make the series readable","sub":"a drifting series has to be differenced before either plot means anything"},{"title":"See which plot stops dead","sub":"one plot drops inside the band and stays; the other keeps fading"},{"title":"Count the bars outside","sub":"the count on the plot that stopped is the order you are after"}]}

Everything from here is doing exactly that, with real numbers on the screen.

=== step === concept
## The coffee shop series we are going to read

Let's build Anand's 150 days first, because every number that follows comes out of them.

Each day starts at 0.7 of the day before and adds that day's own fresh noise. The 180 is the shop's usual level, the 12 is how big an ordinary day-to-day surprise is, and the rounding is there because nobody sells two thirds of a cup.

Press Run.

```r
# Build 150 days of cup sales at Anand's shop and plot them
set.seed(11)
cups <- round(180 + arima.sim(list(ar = 0.7), n = 150, sd = 12))

cups[1:12]
#>  [1] 172 166 162 167 166 174 177 178 176 168 169 161

plot(cups, type = "l", col = "#1f7a55", lwd = 1.6,
     main = "Cups sold at Anand's shop, 150 days",
     xlab = "Day", ylab = "Cups sold")
```

Look at the line rather than the numbers. It does not bounce around 180 at random. It goes on runs: a stretch down in the 160s, then a climb, then a spell up near 200. That clustering is what Anand noticed from behind the counter.

And because we built the series ourselves, we already know the true answer: one day back, at 0.7. Everything from here is us recovering that fact from the numbers alone, so you can trust the method later on a series where nobody knows the answer.

=== step === concept
## What autocorrelation measures: today against yesterday

Let's start with the smallest version of Anand's question. Forget two days back and three days back for a moment, and ask only this: does a busy day tend to be followed by another busy day?

There are 150 days, so 149 pairs of yesterday and today. Every pair is a dot below, with yesterday's cups across and today's cups up.

::widget chart-plotter {"data":[{"x":172,"y":166},{"x":166,"y":162},{"x":162,"y":167},{"x":167,"y":166},{"x":166,"y":174},{"x":174,"y":177},{"x":177,"y":178},{"x":178,"y":176},{"x":176,"y":168},{"x":168,"y":169},{"x":169,"y":161},{"x":161,"y":153},{"x":153,"y":150},{"x":150,"y":167},{"x":167,"y":152},{"x":152,"y":150},{"x":150,"y":165},{"x":165,"y":167},{"x":167,"y":190},{"x":190,"y":179},{"x":179,"y":175},{"x":175,"y":157},{"x":157,"y":164},{"x":164,"y":180},{"x":180,"y":169},{"x":169,"y":183},{"x":183,"y":178},{"x":178,"y":152},{"x":152,"y":171},{"x":171,"y":183},{"x":183,"y":184},{"x":184,"y":193},{"x":193,"y":186},{"x":186,"y":174},{"x":174,"y":182},{"x":182,"y":183},{"x":183,"y":189},{"x":189,"y":184},{"x":184,"y":188},{"x":188,"y":204},{"x":204,"y":197},{"x":197,"y":182},{"x":182,"y":209},{"x":209,"y":199},{"x":199,"y":170},{"x":170,"y":179},{"x":179,"y":200},{"x":200,"y":184},{"x":184,"y":170},{"x":170,"y":166},{"x":166,"y":179},{"x":179,"y":185},{"x":185,"y":182},{"x":182,"y":172},{"x":172,"y":177},{"x":177,"y":192},{"x":192,"y":190},{"x":190,"y":179},{"x":179,"y":185},{"x":185,"y":170},{"x":170,"y":178},{"x":178,"y":178},{"x":178,"y":182},{"x":182,"y":174},{"x":174,"y":165},{"x":165,"y":197},{"x":197,"y":184},{"x":184,"y":168},{"x":168,"y":177},{"x":177,"y":168},{"x":168,"y":153},{"x":153,"y":176},{"x":176,"y":165},{"x":165,"y":181},{"x":181,"y":174},{"x":174,"y":182},{"x":182,"y":177},{"x":177,"y":194},{"x":194,"y":176},{"x":176,"y":194},{"x":194,"y":183},{"x":183,"y":177},{"x":177,"y":181},{"x":181,"y":188},{"x":188,"y":184},{"x":184,"y":158},{"x":158,"y":172},{"x":172,"y":180},{"x":180,"y":168},{"x":168,"y":187},{"x":187,"y":198},{"x":198,"y":203},{"x":203,"y":215},{"x":215,"y":210},{"x":210,"y":174},{"x":174,"y":175},{"x":175,"y":170},{"x":170,"y":168},{"x":168,"y":175},{"x":175,"y":176},{"x":176,"y":179},{"x":179,"y":209},{"x":209,"y":192},{"x":192,"y":203},{"x":203,"y":205},{"x":205,"y":195},{"x":195,"y":207},{"x":207,"y":215},{"x":215,"y":211},{"x":211,"y":217},{"x":217,"y":196},{"x":196,"y":189},{"x":189,"y":172},{"x":172,"y":178},{"x":178,"y":166},{"x":166,"y":164},{"x":164,"y":168},{"x":168,"y":167},{"x":167,"y":144},{"x":144,"y":151},{"x":151,"y":163},{"x":163,"y":150},{"x":150,"y":165},{"x":165,"y":151},{"x":151,"y":156},{"x":156,"y":162},{"x":162,"y":171},{"x":171,"y":178},{"x":178,"y":203},{"x":203,"y":192},{"x":192,"y":193},{"x":193,"y":170},{"x":170,"y":181},{"x":181,"y":186},{"x":186,"y":192},{"x":192,"y":177},{"x":177,"y":188},{"x":188,"y":206},{"x":206,"y":217},{"x":217,"y":197},{"x":197,"y":188},{"x":188,"y":186},{"x":186,"y":177},{"x":177,"y":185},{"x":185,"y":185},{"x":185,"y":168},{"x":168,"y":170},{"x":170,"y":156},{"x":156,"y":160}],"geoms":["point"],"x":"yesterday","y":"today"}

The cloud leans upward. The number in the corner of the chart is an ordinary Pearson correlation on those 149 pairs, r = 0.67, and nothing about it is special to time series. It is the same correlation you would compute between height and weight.

Here is the same thing without the picture.

```r
# Line up today's sales against yesterday's and correlate the 149 pairs
n         <- length(cups)
today     <- cups[2:n]
yesterday <- cups[1:(n - 1)]

round(cor(yesterday, today), 3)
#> [1] 0.669
```

That is autocorrelation in one sentence: an ordinary correlation between a series and a copy of itself shifted back a day. Shift the copy back two days and you get the lag-2 autocorrelation, and so on for every lag you care about.

The version R actually uses is written like this, where \(y_t\) is the sales on day \(t\), \(\bar{y}\) is the average over all 150 days, and \(k\) is how far back you shift the copy:

\[ r_k = \frac{\sum_{t=k+1}^{n} (y_t - \bar{y})(y_{t-k} - \bar{y})}{\sum_{t=1}^{n} (y_t - \bar{y})^2} \]

Put \(k = 1\) into that and run it beside `acf()`, which is the function that does the whole calculation for you.

```r
# Recompute the lag-1 value the way acf() does, centred on the whole series
cup_mean <- mean(cups)

round(sum((today - cup_mean) * (yesterday - cup_mean)) / sum((cups - cup_mean)^2), 3)
#> [1] 0.665

round(acf(cups, plot = FALSE)$acf[2], 3)
#> [1] 0.665
```

Both give 0.665, where `cor()` gave 0.669. The small gap is bookkeeping. `cor()` centres the 149 yesterdays on their own average and the 149 todays on theirs, then divides by their two separate spreads. `acf()` centres everything on the single average of all 150 days and divides by the single total. Same idea, and 0.665 is the version every ARIMA tool works from.

=== step === concept
## The whole ACF at once, and what the dashed lines mean

Doing that by hand for every lag would take the afternoon. `acf()` computes the whole set in one call and draws it.

```r
# Draw every lag at once for the cup sales and work out the band
acf(cups, main = "ACF of Anand's daily cup sales")

round(acf(cups, plot = FALSE)$acf[2:8], 3)
#> [1] 0.665 0.486 0.402 0.275 0.181 0.145 0.030

1.96 / sqrt(length(cups))
#> [1] 0.1600333
```

Every bar on that plot is one lag: 0.665 at lag 1, 0.486 at lag 2, 0.402 at lag 3, and onward. The bar standing at 1.000 on the far left is lag 0, a series correlated with itself, and it carries no information at all.

Now the part everyone squints at. The two dashed blue lines are not decoration. They mark the range inside which a bar is no different from the wiggle pure noise would give you, and they sit at plus and minus this:

\[ \frac{1.96}{\sqrt{n}} \]

Here \(n\) is the number of observations, so for 150 days the band is 0.160. That turns plot reading from a feeling into a comparison. Lags 1 through 5 all clear 0.160. Lag 6, at 0.145, is already inside it, and lag 7 is 0.030, which is nothing.

Look further right on that same plot and a few short bars poke past the lower line out around lags 18 to 20. The dashed lines are drawn where 95 out of every 100 bars of pure noise would sit, so on a plot this long a few strays outside are ordinary. Read the shape near the start, where the structure lives, and do not chase one small bar far out on the right.

So Anand gets a first answer. The pull is still measurable five days back, and it fades a little more each day. A heavy Monday really does show up faintly in Thursday's till.

[NOTE]
The band belongs to the series, not to the plot. With 150 days it sits at 0.160; with 40 days it widens to 0.310. The very same bar can count on one series and be noise on another, so always read a plot against its own band and never against a number you remember.

=== step === quiz
## Quick check: which bars on an ACF count?

Anand's ACF came back with 0.181 at lag 5 and 0.145 at lag 6, and the band for his 150 days is 0.160.

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Both count, because both are positive and the ACF is still on its way down at that point. ::no
- Neither counts, because both are tiny next to the 0.665 at lag 1. ::no
- Lag 5 counts and lag 6 does not, because 0.181 is outside the 0.160 band and 0.145 is inside it. ::ok That is the whole test. A bar is either in or out of its band, and nothing else about it matters: not its sign, not how it compares to lag 1, not whether the plot looks like it is still falling.
- You cannot say without more days, since 0.181 and 0.145 are too close to call. ::no The band is the only comparison being made. A bar outside it is a correlation worth taking seriously, a bar inside it is noise, and 0.160 is where that line sits for 150 days. Being close to the line does not make a bar undecidable, and being small next to lag 1 does not make it noise.

=== step === concept
## Why the ACF has a lag-2 bar when there is no two-day term

Something in that table should be bothering you.

We built these days from one instruction: today is 0.7 of yesterday plus a fresh surprise. There is no two-day term anywhere in that recipe. The day before yesterday never gets a vote. And yet the lag-2 bar came back at 0.486, well outside the band.

Here is where it comes from. Today leans on yesterday. Yesterday leaned on the day before. So the day before yesterday reaches today by going through yesterday, arriving at 0.7 of 0.7, which is 0.49.

Three days back it arrives at 0.7 of 0.7 of 0.7, which is 0.343.

In general, a series that carries \(\phi\) of the previous day has an autocorrelation of \(\phi^k\) at lag \(k\). Let's put that prediction next to what the shop actually did.

```r
# Compare the ACF of the sales against 0.7 raised to the power of the lag
data.frame(
  lag          = 1:5,
  passed_along = round(0.7^(1:5), 3),
  acf_of_cups  = round(acf(cups, plot = FALSE)$acf[2:6], 3)
)
#>   lag passed_along acf_of_cups
#> 1   1        0.700       0.665
#> 2   2        0.490       0.486
#> 3   3        0.343       0.402
#> 4   4        0.240       0.275
#> 5   5        0.168       0.181
```

The middle column is what pure relaying predicts. The right column is what the till actually recorded. They track each other lag for lag, and the small gaps are sampling wobble on 150 days.

[KEY INSIGHT]
The ACF cannot tell a direct link from a relayed one. It adds them together, which is why it fades geometrically instead of stopping, even when the recipe holds exactly one term. Anand's ACF clears the band for five lags in a row. The true answer is one.

That leaves an obvious question. Is there a way to ask about two days back while holding yesterday fixed? There is, and that is the whole reason the PACF exists.

=== step === concept
## What the PACF strips out, and how R computes it

The partial autocorrelation asks the same question with a condition attached. How much does the day before yesterday tell you about today, over and above what yesterday has already told you?

There is a familiar tool that answers exactly that, and it is regression. Put today on the left and both earlier days on the right:

\[ y_t = c + \alpha_1 y_{t-1} + \alpha_2 y_{t-2} + \varepsilon_t \]

In any regression, a coefficient is read holding the other predictors fixed. So \(\alpha_2\) is precisely what we want: the pull from two days back once yesterday has taken its share. That coefficient is the partial autocorrelation at lag 2. The same holds at any lag: regress today on every lag up to \(k\), and the coefficient on the \(k\)-th is the partial autocorrelation at lag \(k\).

That is not a rough description of what `pacf()` does. It is what the quantity is, so let's compute it both ways and compare.

```r
# Get the lag-2 partial two ways: from a regression, and from pacf()
lag_frame <- data.frame(
  today = cups[3:n],
  lag_1 = cups[2:(n - 1)],
  lag_2 = cups[1:(n - 2)]
)

round(coef(lm(today ~ lag_1 + lag_2, data = lag_frame)), 3)
#> (Intercept)       lag_1       lag_2 
#>      53.638       0.612       0.088 

round(pacf(cups, plot = FALSE)$acf[1:3], 3)
#> [1] 0.665 0.077 0.094
```

Read the two outputs together. The regression puts 0.088 on `lag_2`, and `pacf()` reports 0.077 at lag 2. It is the same quantity reached two different ways.

They are not identical, and the reason is worth a sentence. The regression can only use the 148 days that have two full days behind them, and it fits a free intercept. `pacf()` starts from the sample autocorrelations of all 150 days and runs a recursion that assumes one constant mean. Different bookkeeping, and on a real series the two land close.

Now read what the number says. It is 0.077 against a band of 0.160. Once yesterday is held fixed, the day before yesterday has nothing left to add. Almost the whole 0.486 that the ACF reported at lag 2 was yesterday's correlation being passed along.

=== step === tryit
## Your turn: get the lag-2 partial from a regression

Anand only kept the till rolls for the first 60 days of that run, and he wants to know whether the same verdict holds on a stretch that short.

The lag columns are lined up for you below. Fit the regression, read the coefficient on `lag_2`, and work out the band for 60 days.

```r
# The first 60 days at Anand's shop, lined up as today, yesterday and two days back
first_60 <- cups[1:60]

short_frame <- data.frame(
  today = first_60[3:60],
  lag_1 = first_60[2:59],
  lag_2 = first_60[1:58]
)

# Fit today on both lag columns and read the coefficient on lag_2.
# Then work out the band for 60 observations.
# Two lines. Press Check when you have them.
```
::check {"regex": "lm\\s*[(][^)]*lag_2", "gate": true, "difficulty": "intermediate", "ok": "Right. The lag_2 coefficient is -0.042 and the band for 60 days is 0.253, so it is nowhere close to counting. A quarter of the data, a band nearly twice as wide, and the same verdict: with yesterday in the model, two days back adds nothing.", "no": "Fit `lm(today ~ lag_1 + lag_2, data = short_frame)` and wrap it in `coef()` to see the three numbers. The one you want sits under lag_2. The band is `1.96 / sqrt(60)`."}
::solution
```r
# Fit the two-lag regression on the 60-day stretch and compare it with that stretch's band
round(coef(lm(today ~ lag_1 + lag_2, data = short_frame)), 3)
#> (Intercept)       lag_1       lag_2 
#>      74.218       0.623      -0.042 

round(1.96 / sqrt(60), 3)
#> [1] 0.253
```

Notice that the `lag_1` coefficient barely moved, 0.623 here against 0.612 on the full run, while the band went from 0.160 out to 0.253. Fewer observations do not change what the shop does. They only make you less sure about it.

=== step === concept
## The coffee shop PACF: one bar outside the band

We have the lag-2 partial. Let's get the whole set and draw it.

```r
# Draw the PACF of the cup sales and check every bar against the band
pacf(cups, main = "PACF of Anand's daily cup sales")

round(pacf(cups, plot = FALSE)$acf[1:8], 3)
#> [1]  0.665  0.077  0.094 -0.075 -0.026  0.032 -0.141  0.082
```

The band has not moved, because it belongs to the series and the series is the same 150 days: 0.160.

Lag 1 stands at 0.665, four times the band. Lag 2 is 0.077, lag 3 is 0.094, and the tallest thing after that is -0.141 at lag 7, which is still inside the line. That is one bar out, and nothing after it.

Say that back in Anand's language. Once you know yesterday, no earlier day adds anything you did not already have. Only yesterday matters.

And that settles the question he started with. The correlation reaches five days back, but the influence does not. Monday turns up in Thursday's till only because Monday shaped Tuesday and Tuesday shaped Wednesday.

=== step === concept
## Cutting off and tailing off: the two shapes you are looking for

Two words carry the whole method, so let's pin them down on the series you already know.

```r
# Put the two plots of the same 150 days side by side
old_par <- par(mfrow = c(1, 2))
acf(cups,  main = "ACF: tails off")
pacf(cups, main = "PACF: cuts off")
par(old_par)
```

A plot **tails off** when its bars shrink lag after lag, sinking toward the band and sometimes flipping sign on the way down. The ACF on the left does that: 0.665, 0.486, 0.402, 0.275, 0.181, and only then inside.

A plot **cuts off** when its bars drop inside the band after some lag and stay there. The PACF on the right does that: 0.665, then 0.077, and everything after it sitting inside the line.

Same 150 days, and two completely different pictures, because the two functions ask different questions. One adds up direct and relayed pull together, and the other reports only what is left after the shorter lags have had their turn.

[KEY INSIGHT]
Neither plot means much on its own. It is the pairing that names the process: one cuts off while the other tails off, and which one cuts off tells you which kind of term you need. Read the two side by side, every time.

=== step === concept
## How to read the AR order p from the PACF

An autoregressive process of order p, written AR(p), builds each day out of the last p days. Anand's shop is an AR(1): one day back, at 0.7.

Here is the rule, and the reason it has to be true. Regress today on p lags and every coefficient up to the p-th is real, because the recipe genuinely uses those days. Add a further lag beyond p and its coefficient has nothing left to explain, because the recipe stops there. The PACF is exactly that set of coefficients, so an AR(p) has a PACF that cuts off after lag p, while its ACF tails off through relaying.

Let's watch the rule count to two. Anand's cousin runs a place beside a college where the queue takes two days to clear, so today there carries 0.5 of yesterday and 0.3 of the day before.

```r
# Build a shop whose sales lean on the last two days, then read both plots
set.seed(21)
cups_two_day <- round(180 + arima.sim(list(ar = c(0.5, 0.3)), n = 300, sd = 12))

old_par <- par(mfrow = c(1, 2))
acf(cups_two_day,  main = "ACF: still tailing off")
pacf(cups_two_day, main = "PACF: two bars, then nothing")
par(old_par)

round(pacf(cups_two_day, plot = FALSE)$acf[1:6], 3)
#> [1]  0.664  0.321 -0.056 -0.029 -0.007  0.011

round(acf(cups_two_day, plot = FALSE)$acf[2:7], 3)
#> [1] 0.664 0.620 0.465 0.381 0.295 0.240

round(1.96 / sqrt(300), 3)
#> [1] 0.113
```

There are 300 days here, so the band tightens to 0.113. Lag 1 at 0.664 and lag 2 at 0.321 clear it comfortably. Lag 3 at -0.056 is inside, and everything after it is flat. The PACF cuts off after lag 2, so p = 2, which is exactly the recipe we handed it.

Meanwhile the ACF is doing what an ACF always does. Its first six values, 0.664, 0.620, 0.465, 0.381, 0.295 and 0.240, are a long geometric slide, and on the plot that slide stays above the band for many lags after those. Count bars there and you would put p in double figures.

[KEY INSIGHT]
p is the number of PACF bars outside the band before it drops inside and stays there. That number is the one you hand to a model as `order = c(p, 0, 0)`.

=== step === quiz
## Quick check: which plot carries the AR order?

The college shop's PACF ran 0.664, 0.321, -0.056, -0.029, -0.007, 0.011, and its ACF ran 0.664, 0.620, 0.465, 0.381, 0.295, 0.240. The band for 300 days is 0.113.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The ACF, and the answer is 6, since six of its bars sit outside the band. ::no
- The PACF, and the answer is 2, since two of its bars sit outside the band before it drops inside and stays there. ::ok Yes. The PACF is the plot that stopped, and where it stopped is p. The ACF is tailing off, so its bars were never going to stop, and counting them tells you nothing about the order.
- Whichever of the two has more bars outside the band, which here is the ACF. ::no
- Both of them, and you take the larger of the two counts. ::no The AR order lives in the PACF and only in the PACF. The ACF here is sliding down geometrically because each day's pull gets relayed forward, so it will always have more bars outside the band than there are terms in the recipe. More bars is not more order.

=== step === concept
## How an MA term works, and why the ACF cuts off at q

Not every series is built out of its own past values. Some are built out of their own past surprises, and those behave completely differently.

Picture a different shop. Every day something unplanned happens there: a coach party walks in, or it rains all afternoon. Call that day's unplanned part its shock.

At this shop a shock does not land and vanish. Roughly 0.8 of it spills into tomorrow, because the coach party comes back for a second round and yesterday's rained-off customers turn up today instead.

So today's sales are the usual 180, plus today's shock, plus 0.8 of yesterday's shock. Notice what is missing.

Nothing here looks at yesterday's sales. It looks at yesterday's surprise. That is a moving average term, written MA(1). In general an MA(q) day carries the last q days of shocks, and that q is the order you will read off the ACF, the way p is read off the PACF.

Let's build it from an explicit list of shocks, so you can see for yourself that no lag of sales is hiding anywhere.

```r
# Build days that carry today's surprise plus part of yesterday's
set.seed(31)
shock <- rnorm(151, 0, 10)

cups_shocks <- round(180 + shock[-1] + 0.8 * shock[-151])

0.8 / (1 + 0.8^2)
#> [1] 0.4878049

round(acf(cups_shocks, plot = FALSE)$acf[2:6], 3)
#> [1]  0.497  0.024 -0.020 -0.061  0.049
```

`shock[-1]` drops the first shock, so what is left is today's. `shock[-151]` drops the last, so lined up beside it, what is left is yesterday's. Every day is those two pieces and nothing else.

Now the mechanism, which is the clearest one in this whole business. Today and yesterday share a shock, because yesterday's surprise sits inside both of them. So they are correlated.

Today and the day before yesterday share nothing at all, because today holds the shocks from today and yesterday, while that day held the shocks from itself and the day before. No shared piece, no correlation, and the ACF has to be zero from lag 2 onward.

How big is the lag-1 correlation? Each day is one whole shock plus 0.8 of another, and the shared piece is worth 0.8 of a shock's variance out of the \(1 + 0.8^2\) that every day carries:

\[ r_1 = \frac{\theta}{1 + \theta^2} = \frac{0.8}{1 + 0.64} = 0.488 \]

The shop came back with 0.497. After that its ACF reads 0.024, -0.020, -0.061, all comfortably inside the 0.160 band for 150 days. The ACF cut off after lag 1, so q = 1.

And the PACF? Let's draw both and put the exact answer underneath.

```r
# Draw both plots for the shock-driven shop beside the exact values for this recipe
old_par <- par(mfrow = c(1, 2))
acf(cups_shocks,  main = "ACF: one bar, then nothing")
pacf(cups_shocks, main = "PACF: fading, sign flipping")
par(old_par)

round(pacf(cups_shocks, plot = FALSE)$acf[1:6], 3)
#> [1]  0.497 -0.297  0.164 -0.178  0.255 -0.172

round(ARMAacf(ma = 0.8, lag.max = 6, pacf = TRUE), 3)
#> [1]  0.488 -0.312  0.221 -0.165  0.127 -0.099
```

That last output does not come from the data at all. `ARMAacf()` computes what this recipe's PACF is in theory, with no sampling noise in it. Look at what it does: 0.488, then -0.312, then 0.221, alternating in sign, shrinking, and never actually reaching zero. That is a tail-off, and the sample PACF above it is doing the same thing with 150 days of wobble on top.

So the MA fingerprint is the mirror image of the AR one. The ACF cuts off at q, and the PACF tails off.

[WARNING]
Read the order off the plot that cuts off, never off the plot that tails off. p lives in the PACF, q lives in the ACF. Because the two signatures are mirror images of each other, it is easy to land on the wrong plot and start counting bars that were never going to stop.

=== step === tryit
## Your turn: read q from the ACF of a two-shock series

There is a third shop on a road with heavy passing trade, and there a surprise takes two days to work its way through instead of one.

Four hundred days are simulated for you below. Print the ACF values and this series' own band, then say what q is.

```r
# 400 days at a shop where a surprise takes two days to work through
set.seed(41)
cups_practice <- round(180 + arima.sim(list(ma = c(0.7, 0.5)), n = 400, sd = 12))

# Print the first six ACF values and the band for 400 observations.
# Then read q off them: the last lag still outside the band.
# Two lines. Press Check when you have them.
```
::check {"regex": "[^p]acf\\s*[(]\\s*cups_practice|^acf\\s*[(]\\s*cups_practice", "gate": true, "difficulty": "beginner", "ok": "That is it. Lag 1 at 0.613 and lag 2 at 0.296 clear the 0.098 band, lag 3 at 0.039 drops inside, and lags 4, 5 and 6 stay there with it. The ACF cuts off after lag 2, so q = 2, and a surprise on that road really does take two days to clear.", "no": "Ask for the values rather than the picture: `round(acf(cups_practice, plot = FALSE)$acf[2:7], 3)`. Then get the band with `1.96 / sqrt(400)` and count how many bars beat it."}
::solution
```r
# Read the ACF of the two-shock shop against its own band
round(acf(cups_practice, plot = FALSE)$acf[2:7], 3)
#> [1]  0.613  0.296  0.039  0.026  0.019 -0.026

round(1.96 / sqrt(400), 3)
#> [1] 0.098
```

Two shocks in a day means two days apart can still share something, while three days apart share nothing. So the ACF has bars at lags 1 and 2 and then falls off a cliff. It is the same mechanism as before with the window opened one day wider.

=== step === concept
## What to do when both plots tail off

Real trade is rarely one pure mechanism. A shop can have both things going on: sales that lean on yesterday's sales, and shocks that spill into the next day. That is an ARMA, and its two plots are much harder to read.

```r
# Build a shop with both an AR and an MA part, then read both plots against the exact values
set.seed(51)
cups_mixed <- round(180 + arima.sim(list(ar = 0.6, ma = 0.4), n = 400, sd = 12))

round(acf(cups_mixed, plot = FALSE)$acf[2:6], 3)
#> [1]  0.722  0.383  0.169  0.046 -0.018

round(pacf(cups_mixed, plot = FALSE)$acf[1:5], 3)
#> [1]  0.722 -0.289  0.047 -0.044 -0.013

round(ARMAacf(ar = 0.6, ma = 0.4, lag.max = 6)[-1], 3)
#>     1     2     3     4     5     6 
#> 0.756 0.454 0.272 0.163 0.098 0.059 

round(ARMAacf(ar = 0.6, ma = 0.4, lag.max = 6, pacf = TRUE), 3)
#> [1]  0.756 -0.276  0.109 -0.043  0.017 -0.007
```

Try reading the first two outputs the way we have been reading. The band for 400 days is 0.098. The ACF drops inside it after lag 3, so it looks like a cutoff at 3, giving q = 3. The PACF drops inside after lag 2, so it looks like a cutoff at 2, giving p = 2.

Both readings cannot be right. The whole method rests on one plot cutting off while the other tails off, so when both appear to stop and disagree about where, the shape is telling you something else.

The last two outputs are what is really underneath. Those are the exact functions for this recipe, computed straight from the coefficients with no sampling noise in them. Neither one stops.

Both shrink toward zero forever and never arrive. What looked like a stop at 3 and a stop at 2 was the true curves sinking under the band at slightly different lags, plus 400 days of luck.

Here is the contrast that matters, with Anand's shop underneath for comparison.

```r
# Put the mixed shop's two plots above Anand's, where one plot does stop
old_par <- par(mfrow = c(2, 2))
acf(cups_mixed,  main = "Mixed shop: ACF")
pacf(cups_mixed, main = "Mixed shop: PACF")
acf(cups,        main = "Anand's shop: ACF")
pacf(cups,       main = "Anand's shop: PACF")
par(old_par)
```

Compare the two PACF panels. Anand's drops off a cliff after one bar and then lies flat across the rest of the plot. The mixed shop's slides down slowly and keeps wandering near the line. A real stop against a slow slide is the difference you are looking for, and it is much easier to see in the picture than in a table of numbers.

[NOTE]
When both plots tail off, they have still done their job: they have told you the series needs both kinds of term. What they cannot do is number them. At that point p and q stop being things you read off a plot and become things you fit and compare.

=== step === concept
## When the ACF barely decays: difference first

Everything so far assumed the shop has a settled level to come back to. Not every series does.

Anand opened a second counter inside an office block, and its trade has drifted ever since. There is no fixed level, just a slow wander up and down over 200 days.

```r
# A drifting counter: read the ACF raw, then after one difference and after two
set.seed(61)
cups_growing <- round(180 + cumsum(rnorm(200, 0, 6)))

old_par <- par(mfrow = c(1, 3))
acf(cups_growing,             main = "Raw: barely decays")
acf(diff(cups_growing),       main = "One difference")
acf(diff(diff(cups_growing)), main = "Two differences")
par(old_par)

round(acf(cups_growing, plot = FALSE)$acf[2:6], 3)
#> [1] 0.967 0.934 0.905 0.885 0.866

round(acf(diff(cups_growing), plot = FALSE)$acf[2:5], 3)
#> [1]  0.017 -0.093 -0.124  0.003

round(acf(diff(diff(cups_growing)), plot = FALSE)$acf[2:5], 3)
#> [1] -0.445 -0.040 -0.081  0.044
```

The raw ACF is unmistakable. It reads 0.967, 0.934, 0.905, 0.885, 0.866, sliding down in nearly a straight line and still enormous many lags out. That is not a busy-day echo. It is a series with no level to return to, so two days far apart look similar because the whole line moved together between them.

`diff()` replaces each day with the change since the day before, and the number of times you do that is the d in ARIMA. One difference and the picture collapses: 0.017, -0.093, -0.124, all inside the band, which sits at 0.139 here. The changes are readable even though the level never was.

Now the trap, which is the third output. Difference it a second time, which is easy to do out of caution, and lag 1 turns into -0.445.

[WARNING]
A large negative bar at lag 1 after differencing, somewhere near -0.5, means you differenced one time too many. More differencing is not the safer choice. It puts a correlation into the data that was never in the shop, and you then spend a model term explaining your own arithmetic.

Difference until the slow slide is gone, and then stop.

=== step === concept
## Weekly cycles: the spike at lag 7

There is one more shape worth recognising on sight, and it is not p or q at all.

Anand's main shop trades on a calendar. Saturdays are heavy, Sundays are dead, and that pattern comes round every seven days regardless of what happened yesterday.

```r
# Build a shop with a fixed weekly pattern and read its ACF out to three weeks
set.seed(71)
weekday_lift <- c(-25, -18, -10, 5, 30, 45, -27)
cups_weekly  <- round(180 + rep(weekday_lift, times = 21) + rnorm(147, 0, 8))

acf(cups_weekly, lag.max = 21, main = "ACF of a shop with a weekly pattern")

round(acf(cups_weekly, lag.max = 21, plot = FALSE)$acf[c(2, 3, 4, 8, 15, 22)], 3)
#> [1]  0.310 -0.266 -0.457  0.864  0.809  0.775

round(1.96 / sqrt(147), 3)
#> [1] 0.162
```

`weekday_lift` is the shop's week running Monday to Sunday: 25 cups down on a Monday, 45 up on a Saturday, 27 down on a Sunday. `rep()` repeats that week 21 times, and the noise on top is an ordinary daily wobble.

The six printed values are lags 1, 2, 3, then 7, 14 and 21. Lag 7 stands at 0.864, lag 14 at 0.809 and lag 21 at 0.775: three towers, one per week, all far above the 0.162 band. In between them lag 3 sits at -0.457, because three days after a Saturday is a Tuesday, and a Tuesday is about as quiet as a Saturday is busy.

Tall bars at multiples of the period, with quiet or negative lags between them, is seasonality. The answer to it is not a larger p. It is a seasonal term, which applies this same cutoff-and-tail-off reading at lags 7, 14 and 21 instead of at 1, 2 and 3.

=== step === concept
## The whole read, from raw series to a confirmed model

Let's put the whole thing together on the series we started with and get Anand an actual model.

The read goes in this order:

1. The ACF slides down gradually rather than clinging near 1, so the shop has a settled level and needs no differencing. That fixes d = 0.
2. The PACF has one bar outside the band and nothing after it. It cuts off at lag 1, so p = 1.
3. The ACF tails off rather than cutting off, so there is no MA order to read. That leaves q = 0.

Those three numbers are the order of an ARIMA model, always written in that sequence as (p, d, q). Anand's is (1, 0, 0), and `Arima()` takes exactly that vector.

```r
# Fit the order the plots gave us
library(forecast)

fit <- Arima(cups, order = c(1, 0, 0))
fit
#> Series: cups 
#> ARIMA(1,0,0) with non-zero mean 
#> 
#> Coefficients:
#>          ar1      mean
#>       0.6685  178.5999
#> s.e.  0.0605    2.7852
#> 
#> sigma^2 = 132.9:  log likelihood = -578.87
#> AIC=1163.74   AICc=1163.9   BIC=1172.77
```

The `ar1` coefficient came back at 0.6685, against the 0.7 we built the shop with. Its standard error is 0.0605, so the estimate sits eleven standard errors clear of zero, which is about as far from an accident as a coefficient gets. The mean, 178.6, is the shop's ordinary day.

A model that fits is not yet a model you trust. The last question is whether anything readable is left over. If the model caught all the structure, whatever it could not explain should be plain noise, with an ACF that stays inside its band.

```r
# Check whether anything readable is left in what the model could not explain
checkresiduals(fit)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(1,0,0) with non-zero mean
#> Q* = 9.0462, df = 9, p-value = 0.433
#> 
#> Model df: 1.   Total lags used: 10
```

The plot shows what the model missed day by day, the ACF of those misses, and how they are spread out. Every bar on that residual ACF sits inside the band.

The Ljung-Box test puts a number on the same thing. It asks one question: taken all together, are those residual autocorrelations indistinguishable from zero? A large p-value is the good outcome here, and 0.433 says there is no evidence of anything left behind. The order we read off the PACF holds up.

[KEY INSIGHT]
The plots hand you a candidate, not a verdict. Fit it, then look at the residuals. If a residual bar pokes outside the band, or the Ljung-Box p-value comes in small, raise p or q by one and fit again.

=== step === quiz
## Quick check: name the process from its two plots

Anand sends over 300 days from a branch and tells you nothing about how it behaves. Here are both of its plots as numbers.

```r
# An unlabelled branch: print both plots' values and the band
set.seed(81)
cups_quiz <- round(180 + arima.sim(list(ma = 0.7), n = 300, sd = 12))

round(acf(cups_quiz, plot = FALSE)$acf[2:6], 3)
#> [1]  0.430 -0.056  0.015  0.073  0.033

round(pacf(cups_quiz, plot = FALSE)$acf[1:5], 3)
#> [1]  0.430 -0.296  0.233 -0.086  0.065

round(1.96 / sqrt(300), 3)
#> [1] 0.113
```

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- An AR(1), because the PACF has a big bar at lag 1, so p = 1. ::no
- An MA(1), because the ACF cuts off after lag 1 while the PACF keeps going with alternating signs, so q = 1. ::ok Exactly. The ACF is the plot that stopped, so the order it carries is q, and one bar outside the band makes it q = 1. The PACF running 0.430, -0.296, 0.233, -0.086 is a textbook tail-off: shrinking and flipping sign, never settling.
- An AR(3), because three PACF bars beat the 0.113 band, so p = 3. ::no
- A mixed process needing both terms, since both plots have bars outside the band. ::no Look at which plot actually stops. The ACF goes 0.430 and then -0.056, 0.015, 0.073, all inside the 0.113 band and staying there, which is a clean cutoff after lag 1. The PACF goes 0.430, -0.296, 0.233, -0.086, shrinking and flipping sign without ever settling down, which is a tail-off. A cutoff in the ACF means the order is q, and one bar means q = 1.

=== step === tryit
## Your turn: read the orders for a series you have not seen

This last one is the whole loop, on a branch nobody has told you anything about. There are three hundred days here, and this one does not sit still.

Work in this order: look at the ACF of the raw series, difference it if the slide is too slow to read, take p off the PACF of what is left, then fit that order and confirm it.

```r
# 300 days from a branch Anand has just taken over
library(forecast)

set.seed(91)
cups_mystery <- 180 + cumsum(arima.sim(list(ar = 0.6), n = 300))

# 1. Read the ACF of cups_mystery. Does it decay, or does it barely move?
# 2. Read the PACF of diff(cups_mystery) against the band for 299 changes.
# 3. Fit the order you read with Arima(), then run checkresiduals() on the fit.
# Press Check when you have the fit.
```
::check {"regex": "order\\s*=\\s*c[(]\\s*1\\s*,\\s*1\\s*,\\s*0", "gate": true, "difficulty": "intermediate", "ok": "That is the full loop. The raw ACF barely moves off 1 (0.985, 0.967, 0.948), so one difference is needed and d = 1. The PACF of the differences has a single bar at 0.546 and nothing else standing up beside it, so p = 1 and q = 0. ARIMA(1,1,0) fits an ar1 of 0.557, and the Ljung-Box p-value of 0.599 says nothing readable is left.", "no": "Start with `round(acf(cups_mystery, plot = FALSE)$acf[2:7], 3)`. If those barely move off 1, difference once and read `pacf(diff(cups_mystery), plot = FALSE)` against `1.96 / sqrt(299)`. One bar outside means p = 1, and with one difference the order you want is `c(1, 1, 0)`."}
::solution
```r
# Difference once, read p from the PACF, then fit that order and confirm it
round(acf(cups_mystery, plot = FALSE)$acf[2:7], 3)
#> [1] 0.985 0.967 0.948 0.929 0.909 0.889

round(pacf(diff(cups_mystery), plot = FALSE)$acf[1:6], 3)
#> [1]  0.546  0.022 -0.009  0.031 -0.072 -0.068

round(1.96 / sqrt(299), 3)
#> [1] 0.113

fit_mystery <- Arima(cups_mystery, order = c(1, 1, 0))
fit_mystery
#> Series: cups_mystery 
#> ARIMA(1,1,0) 
#> 
#> Coefficients:
#>          ar1
#>       0.5570
#> s.e.  0.0479
#> 
#> sigma^2 = 1.124:  log likelihood = -441.46
#> AIC=886.93   AICc=886.97   BIC=894.33

checkresiduals(fit_mystery)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(1,1,0)
#> Q* = 7.3681, df = 9, p-value = 0.5989
#> 
#> Model df: 1.   Total lags used: 10
```

Notice that the d you found never showed up as a bar on any plot. It came out of the shape of the raw ACF, and only once it was applied did the PACF underneath become readable at all.

=== step === quiz
## Quick check: what does a strong negative bar at lag 1 mean?

Two very different series can both show a tall negative bar at lag 1 of the ACF. One of them is telling you about the shop. The other is telling you about something you did to the data.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It always means an MA(1) term with a negative coefficient, so set q = 1 and carry on. ::no
- It always means the series was differenced one time too many, so undo the last difference. ::no
- It could be either, and what settles it is when the bar showed up: if it appeared only after a second difference it is over-differencing, and if it was already there on the raw series it is a real MA(1). ::ok Exactly right. The office counter needed one difference, and only when a second one went on top did its lag 1 drop to -0.445. The shock-driven shop had a lag-1 bar of 0.497 with no differencing at all, and that one was genuine. Same shape on the plot, two different causes, and the history of the series is what separates them.
- It means the series is seasonal, since negative bars come from a repeating calendar pattern. ::no A bar on a plot has no memory of how the series got there, so no single reading of it is always right. The two causes are over-differencing and a genuine negative MA term, and you tell them apart by asking what you did to the series first. Seasonality is a different signature altogether: tall bars at multiples of the period, not one negative bar at lag 1.

=== step === concept
## References

- [Forecasting: Principles and Practice, Section 9.5, Non-seasonal ARIMA models](https://otexts.com/fpp3/non-seasonal-arima.html) - Hyndman and Athanasopoulos, 3rd edition. Where reading p off a PACF cutoff and q off an ACF cutoff is set out, together with the warning about mixed processes.
- [Forecasting: Principles and Practice, Section 2.8, Autocorrelation](https://otexts.com/fpp3/acf.html) - Hyndman and Athanasopoulos, 3rd edition. The autocorrelation definition and the band drawn on every correlogram.
- [Time Series Analysis: Forecasting and Control](https://doi.org/10.1002/9781118619193) - Box, Jenkins and Reinsel, Wiley, 4th edition (2008). The identification stage this whole method comes from.
- [Time Series Analysis and Its Applications, Chapter 3](https://doi.org/10.1007/978-3-319-52452-8) - Shumway and Stoffer, 4th edition (2017). The partial autocorrelation defined as the regression coefficient we reproduced with `lm()`.
- [Auto- and Cross- Covariance and -Correlation Function Estimation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - R Core Team. What `acf()` and `pacf()` compute, and where the dashed lines are drawn.

=== step === complete
## Quick recap

You started with a question Anand asked from behind his counter, and you can now answer it with a number.

Five shapes cover almost everything you will meet:

- **ACF tails off, PACF cuts off after lag p.** An AR(p). Read p from the PACF. Anand's gave one bar, so p = 1.
- **ACF cuts off after lag q, PACF tails off.** An MA(q). Read q from the ACF. The shock-driven shop gave one bar, so q = 1.
- **Both tail off.** Both kinds of term are needed, and the plots cannot number them. Fit a few small candidates and compare.
- **ACF barely decays, sliding down from near 1.** Difference once and read the differenced series. A big negative bar at lag 1 afterwards means one difference too many.
- **Tall bars at lag 7, 14 and 21.** A calendar pattern, which asks for a seasonal term rather than a larger p.

Underneath all five sits the same band, 1.96 divided by the square root of the number of observations, computed for the series in front of you and never remembered from another plot.

So what does Anand get? His ACF fades over five days, but his PACF has one bar and then nothing at all. Only yesterday matters. That makes p = 1, and the fitted ARIMA(1,0,0) came back at 0.6685 with residuals the Ljung-Box test could find no fault with.

That is the whole method. Now go and read a correlogram of your own. You will find that you can.
