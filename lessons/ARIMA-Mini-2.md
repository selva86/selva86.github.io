---
title: "ACF and PACF: how to read the plots for ARIMA orders"
description: "Read ACF and PACF plots the way a forecaster does: which bars really count, what the PACF holds fixed, and how the two together hand you the p and q for ARIMA."
keywords: "ACF and PACF, ACF plot, PACF plot, autocorrelation, partial autocorrelation, ARIMA orders, identify p and q, acf in R, pacf in R, forecast package"
mathjax: true
webr: true
post_type: "LESSON"
curriculum_id: "0.0.10"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "2"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-1"
course_next: ""
lesson_access: "windowed"
catalog_blurb: "Read the two plots that reveal how many AR and MA terms you need."
date: "2026-08-19"
---

=== step === cover

## ACF and PACF: how to read the plots for ARIMA orders

Meera runs a coffee shop next to a college, and she has a hunch about her sales. It is the kind of hunch every shop owner has.

Busy days arrive in clumps.

A packed Monday tends to be followed by a packed Tuesday. A dead week stays dead right through to Friday. Nothing about that feels surprising, but Meera has never actually checked it.

So let's check it. Take 60 of her trading days. For each one, put yesterday's cups along the bottom and today's cups up the side, one dot per day. If busy days really do follow busy days, the cloud of dots should lean uphill.

::widget chart-plotter {"data":[{"x":216,"y":207},{"x":207,"y":201},{"x":201,"y":209},{"x":209,"y":206},{"x":206,"y":221},{"x":221,"y":225},{"x":225,"y":227},{"x":227,"y":224},{"x":224,"y":210},{"x":210,"y":212},{"x":212,"y":198},{"x":198,"y":185},{"x":185,"y":180},{"x":180,"y":209},{"x":209,"y":183},{"x":183,"y":180},{"x":180,"y":205},{"x":205,"y":209},{"x":209,"y":246},{"x":246,"y":229},{"x":229,"y":222},{"x":222,"y":192},{"x":192,"y":204},{"x":204,"y":229},{"x":229,"y":212},{"x":212,"y":235},{"x":235,"y":227},{"x":227,"y":184},{"x":184,"y":215},{"x":215,"y":234},{"x":234,"y":237},{"x":237,"y":251},{"x":251,"y":240},{"x":240,"y":221},{"x":221,"y":233},{"x":233,"y":236},{"x":236,"y":245},{"x":245,"y":237},{"x":237,"y":244},{"x":244,"y":269},{"x":269,"y":259},{"x":259,"y":233},{"x":233,"y":279},{"x":279,"y":262},{"x":262,"y":213},{"x":213,"y":229},{"x":229,"y":263},{"x":263,"y":237},{"x":237,"y":214},{"x":214,"y":206},{"x":206,"y":229},{"x":229,"y":238},{"x":238,"y":233},{"x":233,"y":217},{"x":217,"y":225},{"x":225,"y":249},{"x":249,"y":247},{"x":247,"y":228},{"x":228,"y":238},{"x":238,"y":214}],"geoms":["point"],"x":"yesterday","y":"today"}

It leans. The `r` in the corner is the correlation between the two columns, about 0.6 for the days on this chart, and that is a firm tilt for real sales data.

So today does look like yesterday, and Meera's hunch was right all along.

That was the easy question though. The harder one is the one Meera actually needs answered: how far back does the echo reach? Does a packed Monday still push Thursday, or has it worn off by Tuesday?

Two plots answer that. They are called the ACF and the PACF, and once you can read a pair of them you will be able to say out loud how many terms your model needs.

=== step === concept

## What are we actually looking at?

Meera's till exports one number per trading day, and that number is cups sold. That is the whole dataset. There are no prices in there, no weather and no promotions. It is just a count, taken once a day, for 180 days in a row.

We are going to build those 180 days right here rather than load a file, and there is a good reason for that. When you make the data yourself you know the rule it came from, so later, when the plots tell you something, you can check whether they are right.

```r
library(forecast)
library(ggplot2)

set.seed(11)
wobble <- arima.sim(model = list(ar = 0.7), n = 180)
cups   <- ts(round(230 + 20 * as.numeric(wobble)))

head(as.numeric(cups), 10)
#>  [1] 216 207 201 209 206 221 225 227 224 210

range(cups)
#> [1] 170 310
```

Let's go through it line by line. `set.seed(11)` fixes the random numbers, so your 180 days are identical to mine. `arima.sim()` generates a series that obeys a rule you choose, and the rule here, `ar = 0.7`, says each day starts from 0.7 of the day before and then gets a random nudge. That is Meera's hunch written as arithmetic. The next line shifts and stretches the result into something that looks like real cup counts, centred near 230, and `ts()` tells R that the order of these numbers matters.

She sells between 170 and 310 cups a day. Now look at them.

```r
autoplot(cups) +
  labs(title = "Meera's shop: cups sold per trading day",
       x = "Trading day", y = "Cups sold")
```

The line drifts up for a stretch, then drifts down for a stretch, and it keeps coming back to the middle. It never runs away and it never flattens out. That wandering around a fixed level is the shape we are about to measure.

=== step === concept

## What does "today looks like yesterday" measure?

There is nothing exotic about it. It is ordinary correlation, applied to the series and a copy of itself slid back by one day.

Slide it by hand and you can see there is no trick to it.

```r
today     <- as.numeric(cups)[-1]     # day 2 through day 180
yesterday <- as.numeric(cups)[-180]   # day 1 through day 179

length(today)
#> [1] 179

round(cor(today, yesterday), 3)
#> [1] 0.678
```

`[-1]` drops the first element and `[-180]` drops the last, which leaves two vectors of the same 179 days, lined up so that each position holds one day's cups next to the previous day's cups. Then `cor()` does what it always does.

That number, 0.678, is the **autocorrelation at lag 1**. The lag is how far you slid the copy. R will compute it for every lag at once.

```r
Acf(cups, plot = FALSE, lag.max = 1)
#>
#> Autocorrelations of series 'cups', by lag
#>
#>     0     1
#> 1.000 0.675
```

That lands a whisker away from the by-hand number, and it is worth knowing why. `cor()` divides by the 179 pairs it actually kept, while `Acf()` divides by all 180 days. It is the same idea with a different denominator, and nobody makes a decision on the third decimal anyway.

Lag 0 is the series against an unshifted copy of itself, so it is always exactly 1.000 and carries no information.

If you like it written out, the autocorrelation at lag \(k\) is

\[ r_k = \frac{\sum_{t=k+1}^{n} (y_t - \bar{y})(y_{t-k} - \bar{y})}{\sum_{t=1}^{n} (y_t - \bar{y})^2} \]

where \(y_t\) is cups sold on day \(t\), \(\bar{y}\) is the average across all the days, \(n\) is 180, and \(k\) is the lag. The top line adds up how the two slid copies move together; the bottom line scales it so the answer always lands between -1 and 1.

The ACF, the autocorrelation function, is nothing more than this \(r_k\) worked out for lag 1, lag 2, lag 3 and onward, and drawn as a row of bars.

=== step === concept

## How big does a bar have to be before it means anything?

Here is the whole ACF for Meera's first ten lags.

```r
Acf(cups, plot = FALSE, lag.max = 10)
#>
#> Autocorrelations of series 'cups', by lag
#>
#>      0      1      2      3      4      5      6      7      8      9     10
#>  1.000  0.675  0.486  0.383  0.258  0.175  0.135  0.044  0.029 -0.002  0.001
```

The bars come down steadily as the lag grows. But before you read anything into the small ones, there is a trap you should know about.

A series with no memory whatsoever, pure coin-flip noise, does not come out at exactly zero for every lag. You get small numbers that wobble around zero instead. So the real question is never "is this bar bigger than zero?" It is "is this bar bigger than the wobble?"

The wobble has a size, and it depends only on how many observations you have. For a series of \(n\) points, a bar counts as noise if it sits between

\[ -\frac{1.96}{\sqrt{n}} \quad \text{and} \quad +\frac{1.96}{\sqrt{n}} \]

A memoryless series stays inside that range about 19 times out of 20. Anything poking out is more than luck.

```r
1.96 / sqrt(length(cups))
#> [1] 0.1460898
```

So Meera's band is 0.146. Plot the ACF and R draws it for you.

```r
ggAcf(cups, lag.max = 10) +
  labs(title = "ACF of Meera's daily cups")
```

The two blue dashed lines are that band. Bars poking past them count, and bars inside them do not, no matter how tempting the pattern looks.

[WARNING]
Always read a plot against its own band, never against a number you remember. The band moves with the length of the series: 180 days gives 0.146, but 40 days gives 0.310, more than twice as tall. The same bar can be real on a long series and pure noise on a short one.

=== step === quiz

## Which bars are real?

Here is Meera's ACF written out as numbers, with her band at **0.146**.

| lag | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| ACF | 0.675 | 0.486 | 0.383 | 0.258 | 0.175 | 0.135 | 0.044 | 0.029 |

Which lags have bars that clear the band?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Lags 1 to 4. The 0.175 at lag 5 is too small to bother with. ::no Have another look at the band.
- Lags 1 to 5. The lag-5 bar at 0.175 is above 0.146, and the lag-6 bar at 0.135 is below it. ::ok Exactly. 0.175 clears 0.146 and 0.135 does not, so the run of real bars ends at lag 5. Notice how close those two are: reading that off a picture by eye would have been a coin toss, which is why the band is worth printing as a number.
- All eight of them, because each one is a real measured correlation. ::no Have another look at the band.
- None of them. A correlation has to be above 0.5 before it means anything. ::no Not that one. The only test is the band. Take each bar, ignore its sign, and ask whether it is bigger than 0.146. Lags 1 through 5 (0.675, 0.486, 0.383, 0.258, 0.175) all clear it. Lag 6 at 0.135 is the first one inside, and everything after it is smaller still. There is no size at which a correlation becomes important on its own, and there is no rule that all the bars count.

=== step === concept

## How far back does the echo really reach?

Meera now knows a busy day follows a busy day. Her actual question was different: does Monday still reach Thursday?

The ACF has an answer at lag 2, and it is a big one. Be careful what you conclude from it.

```r
v <- as.numeric(cups)
n <- length(v)

round(cor(v[3:n], v[1:(n - 2)]), 3)    # today against two days back
#> [1] 0.503

round(0.675 * 0.675, 3)                # yesterday's link, handed down one more day
#> [1] 0.456
```

Look at those two numbers together. Today leans on yesterday by 0.675, and yesterday leans on the day before it by the same 0.675. So even if two days back had no direct effect on today at all, today would still carry roughly 0.675 times 0.675, which is 0.456, of a connection to it, purely passed down the chain.

The measured lag-2 correlation is 0.503. Almost all of it is secondhand.

::widget correlation-heatmap {"vars":["today","back 1","back 2","back 3"],"matrix":[[1,0.68,0.49,0.38],[0.68,1,0.68,0.49],[0.49,0.68,1,0.68],[0.38,0.49,0.68,1]]}

Every pair of days the same distance apart carries the same correlation, which is why the grid comes out striped. Read the top row: today against yesterday 0.68, against two days back 0.49, against three days back 0.38. Those numbers shrink as you go, but they shrink because the chain gets longer, not because three separate forces are at work.

That leaves the obvious question hanging. Is there any *direct* link past yesterday at all? To answer that, we need a way to hold the days in between still.

=== step === concept

## What does the PACF hold fixed?

That is exactly the job of the partial autocorrelation.

The **partial autocorrelation at lag k** is the correlation between today and k days ago after the days in between have been held fixed. Held fixed means: whatever those middle days already explain about today, take it out first, and measure only what is left over.

Think of heights in a family. Grandparents and grandchildren are correlated, but most of that runs through the parents. Once you already know how tall the parents are, how much does knowing the grandparents add? Usually it adds very little. We are asking the same question here, only about days instead of people.

```r
Pacf(cups, plot = FALSE, lag.max = 8)
#>
#> Partial autocorrelations of series 'cups', by lag
#>
#>      1      2      3      4      5      6      7      8
#>  0.675  0.056  0.066 -0.066 -0.005  0.023 -0.101  0.051
```

There is one tall bar at lag 1 and then nothing after it. Every value from lag 2 onward sits inside the 0.146 band. Draw it and the contrast with the ACF is hard to miss.

```r
ggPacf(cups, lag.max = 10) +
  labs(title = "PACF of Meera's daily cups")
```

Say the result out loud, because it is Meera's answer: once you know yesterday, nothing else about the past week tells you anything new about today. Monday does not reach Thursday directly. Monday reaches Tuesday, Tuesday reaches Wednesday, Wednesday reaches Thursday, and that chain is the entire story.

=== step === concept

## Can I watch the middle day being removed?

You can, with a regression. Line up each day beside its three predecessors first.

```r
lagged <- data.frame(
  today      = v[4:n],
  yest       = v[3:(n - 1)],
  two_back   = v[2:(n - 2)],
  three_back = v[1:(n - 3)]
)

nrow(lagged)
#> [1] 177

round(cor(lagged$today, lagged$two_back), 3)
#> [1] 0.501
```

Each row is one day with the three days before it. The first three days of the series get dropped, because they do not have three days before them, which leaves 177 rows.

Taken on its own, `two_back` looks strong, with a correlation of 0.501 with today. Now ask the sharper question. Given yesterday, does two days back add anything?

```r
two_lag_fit <- lm(today ~ yest + two_back, data = lagged)
round(coef(summary(two_lag_fit)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   69.001     14.308   4.823    0.000
#> yest           0.620      0.076   8.189    0.000
#> two_back       0.083      0.078   1.068    0.287
```

Read the `two_back` row. The estimate is 0.083 with a standard error of 0.078, so it is barely one standard error away from zero, and the p-value of 0.287 means a coefficient that size turns up easily by chance. Once yesterday is in the model, two days back adds nothing you could tell apart from noise.

A correlation of 0.501 collapsed to 0.083, and all it took was putting yesterday into the model beside it.

That is the PACF, done the long way. R's `Pacf()` reported 0.056 at lag 2 while this regression reports 0.083. The two follow slightly different recipes (`Pacf()` works from the autocorrelations, the regression works from the rows), so on 180 days they land a few hundredths apart. Both are far inside the 0.146 band, and that is the part that decides the answer.

=== step === tryit

## Does Monday still reach Thursday?

Here is Meera's question again, this time in code.

The `lagged` frame already carries a `three_back` column, sitting unused. Put it in the model. If Monday really does reach Thursday directly, the `three_back` row will show a coefficient that stands clear of its own standard error.

```r
# Add three_back to the formula, then read its row.
round(coef(summary(lm(today ~ yest + two_back, data = lagged))), 3)
```

::check {"regex": "[+]\\s*three_back", "gate": true, "difficulty": "intermediate", "ok": "That is it. The `three_back` row comes back at 0.082 with a standard error of 0.078 and a p-value of 0.292, which is nothing at all. Monday does not reach Thursday directly.", "no": "Not yet. Keep the model exactly as it is and add one more term to the formula with a plus sign, so the line reads `today ~ yest + two_back + three_back`."}

::solution

```r
three_lag_fit <- lm(today ~ yest + two_back + three_back, data = lagged)
round(coef(summary(three_lag_fit)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   62.908     15.422   4.079    0.000
#> yest           0.614      0.076   8.070    0.000
#> two_back       0.034      0.090   0.376    0.707
#> three_back     0.082      0.078   1.057    0.292
```

Neither `two_back` (0.034) nor `three_back` (0.082) stands clear of its own standard error, and `yest` hardly moved at all, going from 0.620 to 0.614. Yesterday is doing all the work.

That is the same verdict the PACF gave in one line, and it is why nobody runs these regressions by hand in practice. You read the plot instead.

=== step === concept

## What is an AR process, in shop terms?

Meera's shop has a name for its behaviour. It is **autoregressive**, usually written AR(p): today is built out of the last p days, plus a fresh surprise.

\[ y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \cdots + \phi_p y_{t-p} + \varepsilon_t \]

Let's put every symbol into plain words. \(y_t\) is today's cups and \(y_{t-1}\) is yesterday's. \(c\) is a constant that sets the level the shop hovers around. Each \(\phi\) (phi) is the weight on one past day. \(\varepsilon_t\) (epsilon) is today's random surprise, the part no past day could have told you. And \(p\) is simply how many past days appear in the recipe.

Meera's series was built with \(p = 1\) and \(\phi_1 = 0.7\), which is the `ar = 0.7` you typed at the start.

Now comes the useful part. An AR process leaves a fixed fingerprint on the two plots, and both halves of it follow from what you have already seen.

- **The PACF cuts off at lag p.** The recipe only reaches back p days, so past that point there are no direct links left to find. Every bar after p is measuring a connection that does not exist.
- **The ACF tails off.** The indirect chain keeps running. Today leans on yesterday, yesterday leans on the day before, so a shrinking echo reaches every lag.

Put both panels on one screen and you can see the whole fingerprint at once.

```r
ggtsdisplay(cups, main = "Meera's shop: series, ACF, PACF")
```

The series is on top, the ACF is bottom left, the PACF is bottom right. One fades, the other stops dead after a single bar. It is the same data in both panels, and the two shapes are opposites.

=== step === quiz

## What is p here?

Here is Meera's PACF written out as numbers, with her band still at **0.146**.

| lag | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| PACF | 0.675 | 0.056 | 0.066 | -0.066 | -0.005 | 0.023 | -0.101 | 0.051 |

What is p?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- p = 5, because five bars on her ACF stood outside the band. ::no Check which of the two plots carries p.
- p = 8, one term for every lag in the table. ::no Check which of the two plots carries p.
- p = 1. Only the lag-1 bar clears the band, and every bar after it sits inside. ::ok Right, and it matches the `ar = 0.7` the series was built from, which is the reassuring part. One direct link, to yesterday, and nothing beyond it.
- You cannot read p from a PACF. You have to fit models and compare them. ::no Not that one. p comes off the PACF, and you get it by counting how many bars stand outside the band before the plot collapses inside it. Here that is one bar, 0.675 at lag 1, since 0.056 onward all sit well within 0.146. The five bars on the ACF are the fading echo, not five separate terms, and fitting a grid of models is what you do when neither plot cuts off, not when one of them cuts this cleanly.

=== step === concept

## What if the shop runs on one-off events instead?

It is the same street and the same shop, but what drives the sales is completely different. Imagine Meera's cups are not driven by yesterday's number at all. They are driven by events: a downpour that keeps everyone indoors, a campus fest that empties the street, a free-samples morning that packs it. Each event is a one-off surprise, and its effect lingers for a couple of days before dying out.

That is a **moving-average** process, written MA(q). Today's cups are the usual level, plus today's surprise, plus a share of the last q surprises.

\[ y_t = c + \varepsilon_t + \theta_1 \varepsilon_{t-1} + \theta_2 \varepsilon_{t-2} + \cdots + \theta_q \varepsilon_{t-q} \]

Again, let's put it in plain words. Each \(\varepsilon\) is the surprise on one particular day. Each \(\theta\) (theta) says how much of an old surprise is still hanging around. \(q\) is how many days back the surprises reach.

Notice the difference from before, because it is the whole distinction. An AR recipe reaches back to past **values** of cups. An MA recipe reaches back to past **surprises** instead. Meera never gets to see the surprises. She only ever sees the cups.

```r
set.seed(14)
jolt       <- arima.sim(model = list(ma = c(0.7, 0.4)), n = 180)
shock_cups <- ts(round(230 + 20 * as.numeric(jolt)))

range(shock_cups)
#> [1] 169 303

autoplot(shock_cups) +
  labs(title = "The same shop, driven by one-off events",
       x = "Trading day", y = "Cups sold")
```

This one was built with \(q = 2\), so today carries today's event, 0.7 of yesterday's, and 0.4 of the one before that. She sells between 169 and 303 cups a day, the line wanders, and the level sits roughly where it did before. To the naked eye it could be the same shop.

The two plots will show you the difference.

=== step === concept

## Why do the two plots swap roles?

Start with the ACF.

```r
Acf(shock_cups, plot = FALSE, lag.max = 8)
#>
#> Autocorrelations of series 'shock_cups', by lag
#>
#>      0      1      2      3      4      5      6      7      8
#>  1.000  0.598  0.292  0.008 -0.019 -0.031 -0.033 -0.018  0.026
```

0.598, then 0.292, then 0.008. That is not a fade. That is a cliff.

The reason is worth a moment, because it is a clean piece of logic. Two days can only be correlated if they share a surprise. Today carries the surprises from today, yesterday, and the day before. Three days ago carries the surprises from three, four and five days ago. Those two lists have nothing in common at all. No shared surprise means no correlation, and not merely a small correlation but zero, by construction.

That is what **cuts off** means, and it happens at exactly q.

Now let's look at the PACF of the very same series.

```r
Pacf(shock_cups, plot = FALSE, lag.max = 8)
#>
#> Partial autocorrelations of series 'shock_cups', by lag
#>
#>      1      2      3      4      5      6      7      8
#>  0.598 -0.102 -0.195  0.139 -0.032 -0.063  0.055  0.049
```

0.598, then -0.102, then -0.195, then 0.139. There is no clean stop anywhere. It dwindles, flipping sign as it goes, and the bar at lag 3 is still outside the 0.146 band. That fading, alternating pattern is how a moving-average process shows up on a PACF, and it is exactly why you must not count bars on it.

```r
ggtsdisplay(shock_cups, main = "Event-driven shop: series, ACF, PACF")
```

[KEY INSIGHT]
The two plots are one fingerprint, not two separate readings. The plot that cuts off gives you the order, and the plot that only fades confirms it. For an AR series the PACF cuts and the ACF fades. For an MA series it is the other way round. Look at both before you count anything on either.

=== step === tryit

## What is q here?

There are two decisions to make here, and they come in order. First which plot, then how many bars.

The block below prints the wrong plot on purpose. Fix it, keep `lag.max = 8`, and read q off the result. The band is the same 0.146 as before, since this series is 180 days too.

```r
# This prints the PACF. For q you need the other one.
Pacf(shock_cups, plot = FALSE, lag.max = 8)
```

::check {"regex": "Acf\\s*[(]\\s*shock_cups", "gate": true, "difficulty": "intermediate", "ok": "Right plot. It gives 0.598 at lag 1, 0.292 at lag 2, then 0.008 at lag 3. Two bars clear 0.146 and the third falls off a cliff, so q = 2.", "no": "Not yet. `Pacf()` gives you p, and you are after q. Swap it for `Acf()` on the same series, keep `plot = FALSE` and `lag.max = 8`, then count the bars above 0.146 before the drop."}

::solution

```r
Acf(shock_cups, plot = FALSE, lag.max = 8)
#>
#> Autocorrelations of series 'shock_cups', by lag
#>
#>      0      1      2      3      4      5      6      7      8
#>  1.000  0.598  0.292  0.008 -0.019 -0.031 -0.033 -0.018  0.026

1.96 / sqrt(length(shock_cups))
#> [1] 0.1460898
```

Two bars outside the band, then a cliff, so q = 2. Which is exactly the `ma = c(0.7, 0.4)` the series was built from: two lingering surprises, and the plot found both.

=== step === concept

## What if both plots tail off?

Real series are rarely as tidy as either shop so far. Suppose both mechanisms run at once: yesterday's crowd genuinely pulls today's crowd along, *and* one-off events still linger for a day or two. Here is 400 days of that.

```r
set.seed(37)
mixed     <- arima.sim(model = list(ar = 0.6, ma = 0.4), n = 400)
both_cups <- ts(round(230 + 20 * as.numeric(mixed)))

ggtsdisplay(both_cups, main = "Both forces at once: neither plot cuts off")
```

Neither panel snaps shut this time. Both of them simply fade away, and that is itself the answer: you need both kinds of term, and the plots are not going to tell you how many of each.

So stop counting bars, fit a few candidates instead, and compare them.

```r
fit_arma11 <- Arima(both_cups, order = c(1, 0, 1))
fit_ar2    <- Arima(both_cups, order = c(2, 0, 0))
fit_ma2    <- Arima(both_cups, order = c(0, 0, 2))

round(c(ARMA_1_0_1 = fit_arma11$aicc,
        AR_2_0_0   = fit_ar2$aicc,
        MA_0_0_2   = fit_ma2$aicc), 2)
#> ARMA_1_0_1   AR_2_0_0   MA_0_0_2
#>    3589.24    3598.98    3632.95
```

The `order` argument is always `c(p, d, q)`: AR terms, differences, MA terms, in that order. So `c(1, 0, 1)` means one AR term and one MA term.

AICc is a score that rewards fit and charges a fee for every extra term, so the lowest number wins. Here that is the one-of-each model at 3589.24, which is what we built.

Do not read too much into the size of that win, though. Ten points of AICc is a preference, not a proof. On mixed series several orders often fit almost equally well, and the winner can flip on a different stretch of data. That is precisely why you always check the residuals before you trust an order.

=== step === concept

## The one shape that means "do not read this yet"

Everything so far has assumed that the series settles, which means it wanders but keeps returning to a stable level. When it does not, every rule above breaks down, and the ACF is what warns you.

Picture Meera's very first year, when the shop was still being discovered and sales climbed month after month.

```r
set.seed(80)
trend_cups <- ts(round(150 + cumsum(rnorm(180, mean = 0.6, sd = 5))))

range(trend_cups)
#> [1] 147 252

autoplot(trend_cups) +
  labs(title = "The shop's first year: still climbing",
       x = "Trading day", y = "Cups sold")
```

She went from about 150 cups a day to about 250. There is no fixed level for this series to come back to, and the ACF shows that plainly.

```r
Acf(trend_cups, plot = FALSE, lag.max = 6)
#>
#> Autocorrelations of series 'trend_cups', by lag
#>
#>     0     1     2     3     4     5     6
#> 1.000 0.965 0.933 0.901 0.872 0.844 0.815
```

The numbers go 0.965, then 0.933, then 0.901, then 0.872, which is a long, slow, almost straight slide. Nothing cuts off and nothing really fades, because a day six weeks ago is still a good guide to where the level sits now. That shape means one thing only: this series has not settled, so do not try to read p and q off it yet.

The fix is to **difference** it, which means replacing each day with the change from the day before. `diff()` does that in one word.

```r
head(as.numeric(trend_cups), 5)
#> [1] 150 154 156 159 161

head(as.numeric(diff(trend_cups)), 4)
#> [1] 4 2 3 2
```

Her first five days were 150, 154, 156, 159, 161 cups. The changes between them are 4, 2, 3, 2. That shorter list of changes is the series we read from now on.

```r
Acf(diff(trend_cups), plot = FALSE, lag.max = 6)
#>
#> Autocorrelations of series 'diff(trend_cups)', by lag
#>
#>      0      1      2      3      4      5      6
#>  1.000  0.025 -0.061 -0.019 -0.046  0.014  0.035
```

Every bar from lag 1 on is now inside the band, the largest being 0.061. The day-to-day change has no memory at all, which for a steadily growing series is exactly right. One difference was enough, and that count, the number of times you differenced, is the **d** in ARIMA(p, d, q). From there you read the ACF and PACF of the differenced series for p and q.

You also need to know when to stop.

```r
Acf(diff(diff(trend_cups)), plot = FALSE, lag.max = 3)
#>
#> Autocorrelations of series 'diff(diff(trend_cups))', by lag
#>
#>      0      1      2      3
#>  1.000 -0.453 -0.068  0.036
```

[WARNING]
Difference the smallest number of times that removes the slow slide, and no more. This series was already settled after one difference. Differencing it a second time pushed the lag-1 autocorrelation to -0.453, a strong negative spike that simply was not there before. That spike is the classic signature of over-differencing: you have added structure rather than removed it. When you see it, undo the last difference.

=== step === concept

## The whole map on one page

You have now met all four shapes, so here they are together.

| What you see | What it means | Order to try |
|---|---|---|
| ACF fades, PACF cuts off after lag p | autoregressive | ARIMA(p, 0, 0) |
| ACF cuts off after lag q, PACF fades | moving average | ARIMA(0, 0, q) |
| Both fade, neither cuts off | both forces at once | try ARIMA(1, 0, 1) and its neighbours, compare AICc |
| ACF slides down slowly and stays high | not settled yet | difference once, then read it again |

And here are the four series side by side, with the first four bars of each plot and each series' own band.

```r
fingerprint <- function(x) {
  band <- 1.96 / sqrt(length(x))
  a <- as.numeric(Acf(x, plot = FALSE, lag.max = 4)$acf)[-1]
  p <- as.numeric(Pacf(x, plot = FALSE, lag.max = 4)$acf)
  round(c(a, p, band), 2)
}

readings <- rbind(cups       = fingerprint(cups),
                  shock_cups = fingerprint(shock_cups),
                  both_cups  = fingerprint(both_cups),
                  trend_cups = fingerprint(trend_cups))
colnames(readings) <- c("acf1", "acf2", "acf3", "acf4",
                        "pacf1", "pacf2", "pacf3", "pacf4", "band")
readings
#>            acf1 acf2 acf3  acf4 pacf1 pacf2 pacf3 pacf4 band
#> cups       0.67 0.49 0.38  0.26  0.67  0.06  0.07 -0.07 0.15
#> shock_cups 0.60 0.29 0.01 -0.02  0.60 -0.10 -0.19  0.14 0.15
#> both_cups  0.78 0.53 0.41  0.31  0.78 -0.18  0.18 -0.09 0.10
#> trend_cups 0.97 0.93 0.90  0.87  0.97  0.01  0.01  0.01 0.15
```

Read it row by row and every fingerprint is visible in the numbers.

- `cups`: the ACF fades from 0.67 down to 0.26 with every bar above the band, while the PACF has one bar at 0.67 and then 0.06, 0.07, -0.07. That one is autoregressive, and p = 1.
- `shock_cups`: the ACF gives 0.60 and 0.29 and then 0.01, a dead stop, while the PACF dwindles and flips sign. That one is a moving average, and q = 2.
- `both_cups`: the ACF fades from 0.78 to 0.31 with every bar still above its 0.10 band, and the PACF dwindles while flipping sign rather than dropping dead. Neither one stops, so both forces are running at once.
- `trend_cups`: the ACF is still at 0.87 by lag 4 and barely moving. It has not settled, so difference it first.

The band column is worth one more look. It reads 0.15 for the three 180-day series and 0.10 for the 400-day one, which is the earlier point in one line: the longer the series, the tighter the band, and the smaller a bar can be and still count. (Those are the same bands as before, just rounded to two places by this table.)

=== step === quiz

## Name the model from the fingerprint

A shop in another town hands you 200 weeks of takings. The series wanders around a steady level, with no climb and no drift. Its ACF has bars at lags 1, 2 and 3 outside the band, and every bar from lag 4 on sits inside. Its PACF fades away slowly over about eight lags, flipping sign as it goes.

What should you fit?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- ARIMA(3, 0, 0). Three bars stand outside the band, so p = 3. ::no Check which of the two plots actually cuts off.
- ARIMA(0, 0, 3). The ACF is the plot that cuts off, and it cuts after lag 3, so q = 3 and there are no AR terms. ::ok Exactly right, and in exactly the right order: settled, so d = 0; the ACF is the one that stops dead, so the number you read off it is q; three bars before the stop, so q = 3.
- ARIMA(3, 0, 3), since both plots clearly have something to say. ::no Check which of the two plots actually cuts off.
- Nothing yet. Difference the series first, then read the plots again. ::no Not that one. Work it in order. The series wanders around a steady level and its ACF does not slide down slowly, so it has already settled and no differencing is needed. Then find the plot that *cuts off*: here that is the ACF, stopping after lag 3, while the PACF merely fades. A cutting ACF gives you q, so the answer is q = 3 with no AR terms, which is ARIMA(0, 0, 3).

=== step === concept

## The loop, on data nobody simulated

Every series so far was one we built ourselves, so we always had the answer in our pocket. Now let's do it once on data where nobody has the answer.

Here is the whole reading, written down as a loop.

::widget process-flow {"steps":[{"title":"Plot the series","sub":"does it keep returning to a level, or does it wander off"},{"title":"Difference if it drifts","sub":"a slow, near-straight ACF means difference once, then look again"},{"title":"Read the PACF for p","sub":"count the bars outside the band before it cuts off"},{"title":"Read the ACF for q","sub":"count the bars outside the band before it cuts off"},{"title":"Fit it, then check the leftovers","sub":"if the residuals are noise, the order is right"}]}

`LakeHuron` ships with R: the water level of Lake Huron in feet, measured once a year from 1875 to 1972. That gives you ninety-eight numbers, with nobody's rule behind them and nothing simulated.

Let's take the first two moves of that loop. Plot the series, and ask whether it settles.

```r
ggtsdisplay(LakeHuron, main = "Lake Huron water level, 1875 to 1972")
```

The level drifts about but keeps coming back to a band around 579 feet, and its ACF comes down fast at first before flattening out low. That is a fade, not the near-flat slide you saw on Meera's first year, so the lake has settled and d = 0.

The ACF fades and the PACF stops early, which is the autoregressive fingerprint. So p comes off the PACF.

```r
Acf(LakeHuron, plot = FALSE, lag.max = 8)
#>
#> Autocorrelations of series 'LakeHuron', by lag
#>
#>     0     1     2     3     4     5     6     7     8
#> 1.000 0.832 0.610 0.458 0.371 0.326 0.285 0.265 0.264

Pacf(LakeHuron, plot = FALSE, lag.max = 8)
#>
#> Partial autocorrelations of series 'LakeHuron', by lag
#>
#>      1      2      3      4      5      6      7      8
#>  0.832 -0.267  0.131  0.034  0.062 -0.021  0.092  0.045

1.96 / sqrt(length(LakeHuron))
#> [1] 0.1979899
```

Ninety-eight observations give a band of 0.198, much wider than Meera's 0.146, exactly as you would expect from a shorter series. On the PACF, lag 1 (0.832) and lag 2 (-0.267) clear it, and lag 3 (0.131) is inside. So the PACF cuts off after lag 2.

That makes p = 2, d = 0, q = 0, and the candidate is ARIMA(2, 0, 0).

=== step === concept

## Is the model actually finished?

A model that fits is not yet a model you trust. Fit the candidate first.

```r
lake_fit <- Arima(LakeHuron, order = c(2, 0, 0))
lake_fit
#> Series: LakeHuron
#> ARIMA(2,0,0) with non-zero mean
#>
#> Coefficients:
#>          ar1      ar2      mean
#>       1.0436  -0.2495  579.0473
#> s.e.  0.0983   0.1008    0.3319
#>
#> sigma^2 = 0.4939:  log likelihood = -103.63
#> AIC=215.27   AICc=215.7   BIC=225.61
```

Both AR terms are worth having. `ar1` is 1.0436 against a standard error of 0.0983, and `ar2` is -0.2495 against 0.1008, so each one is several standard errors clear of zero. The `mean` of 579.05 is the level the lake keeps returning to.

Now comes the real test, and it rests on the same idea as everything else here. If the model captured all the structure, whatever is left over should have no pattern in it at all. So run the ACF on the leftovers.

```r
checkresiduals(lake_fit)
#>
#> 	Ljung-Box test
#>
#> data:  Residuals from ARIMA(2,0,0) with non-zero mean
#> Q* = 5.9457, df = 8, p-value = 0.6533
#>
#> Model df: 2.   Total lags used: 10
```

Three panels appear: the residuals over time, their ACF, and their spread. The residual ACF is the one that matters, and every bar sitting inside the band means there is no structure left to model.

The printed test is the **Ljung-Box test**, and the question behind it is a single one: taken all together, could those residual correlations just be chance? The p-value is 0.6533, comfortably above 0.05, so the answer is yes, they easily could. A large p-value is the good outcome here, which catches people out the first time they see it.

So the answer is ARIMA(2, 0, 0), read straight off the PACF of a series nobody simulated, and now confirmed.

[KEY INSIGHT]
The plots give you a candidate quickly, and the residuals give you the verdict on it. If the residual ACF still has bars outside the band, or the Ljung-Box p-value is small, raise p or q by one and fit again.

=== step === concept

## References

Here is where these rules come from, if you want to read further.

- [Forecasting: Principles and Practice, 3rd edition, section 9.5, Non-seasonal ARIMA models](https://otexts.com/fpp3/non-seasonal-arima.html) by Rob Hyndman and George Athanasopoulos: the ACF and PACF order rules, and their limits.
- [Forecasting: Principles and Practice, 3rd edition, section 2.8, Autocorrelation](https://otexts.com/fpp3/acf.html): what the bars measure, before any modelling.
- [NIST/SEMATECH e-Handbook of Statistical Methods, section 6.4.4.6, Box-Jenkins Model Identification](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc446.htm): the identification procedure in its original form.
- [Time Series Analysis and Its Applications, 4th edition](https://link.springer.com/book/10.1007/978-3-319-52452-8) by Robert Shumway and David Stoffer: the behaviour table for AR, MA and mixed processes.
- [The R help page for stats::acf and stats::pacf](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html): exactly what R computes, and how it draws the band.

=== step === complete

## What you can do now

You started with a shop owner's hunch and finished with a fitted model on a real lake.

Along the way you picked up a handful of skills, and each one works on its own:

- Say what a single ACF bar measures: the correlation between the series and a copy of itself slid back k days.
- Judge any bar against its own band, \(1.96/\sqrt{n}\), instead of against a number you remember.
- Explain what the PACF holds fixed, and why a direct link can stop at lag 1 while the echo carries on for five.
- Read p off the PACF and q off the ACF, and know which plot to look at first.
- Recognise the two shapes that mean stop counting: both plots fading (fit a small grid and compare AICc) and an ACF sliding down slowly (difference once, then read it again).
- Confirm the choice with the residual ACF and the Ljung-Box test, rather than trusting the plots alone.

If you keep one line from all of this, keep this one.

**PACF for p, ACF for q, residuals for the verdict.**
