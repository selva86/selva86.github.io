---
title: "ACF and PACF: how to read the plots for ARIMA orders"
slug: "ARIMA-Mini-2"
catalog_blurb: "Work out p and q by reading the plots, not by guessing."
description: "A tall spike at lag one and then nothing is your data saying only yesterday matters. Read the ACF and PACF on real series until the patterns jump out."
keywords: "ACF and PACF, how to read ACF plot, PACF plot, ARIMA orders, choose p and q, autocorrelation, partial autocorrelation, correlogram, time series in R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.10"
lesson_access: "windowed"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "2"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-1"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 2 of 7
## ACF and PACF: how to read the plots for ARIMA orders

In part 1 we built Meera's coffee shop out of three pieces we chose ourselves, handed the result to R, and watched it recover the rules we had planted. That worked because we already knew the answer. On anybody else's sales figures nobody hands you the recipe, so the numbers have to give it up on their own.

Back to the shop, then, and to a question Meera could ask without knowing any statistics. She is sure that busy days come in runs. What she cannot tell you is how far back a run reaches. Does a good Monday still show up in Thursday's till, or has it worn off by Tuesday afternoon?

There is one chart that answers exactly that, and here it is for her shop.

::widget chart-plotter {"data":[{"x":1,"y":0.577},{"x":2,"y":0.380},{"x":3,"y":0.293},{"x":4,"y":0.167},{"x":5,"y":0.091},{"x":6,"y":0.094},{"x":7,"y":0.031},{"x":8,"y":0.035},{"x":9,"y":0.032},{"x":10,"y":0.040},{"x":11,"y":0.033},{"x":12,"y":0.006}],"geoms":["bar"],"x":"lag","y":"correlation"}

Twelve bars, one per lag. The first bar says how strongly today resembles yesterday, the second says how strongly today resembles the day before yesterday, and so on out to twelve days back. Read left to right it says: yesterday matters a lot, two days back matters a fair bit, three days back a little, and by the end of the week there is nothing left to find. That is the echo, measured.

The chart has a name, the ACF, and it has a partner called the PACF. Between them they tell you how many AR terms and how many MA terms your model needs, which is the part of ARIMA that part 1 deliberately handed you for free.

By the end of this lesson you will be able to:

- Say what the number on any one of those bars means, and work one out by hand
- Tell a bar that counts from a bar that is noise, using the plot's own dashed band
- Read the AR order p off one plot and the MA order q off the other, and say why they are not interchangeable
- See from an ACF that a series still needs differencing, and spot the tell of differencing once too often
- Recognise a weekly rhythm on sight
- Say when the plots cannot settle the question, and check your answer afterwards

**What you need first:** you can read a simple R script, so a variable, a vector and a `for` loop are familiar, plus part 1 of this course for AR, I, MA, shock, lag, differencing, and what it means for a series to be stationary: no drifting level, roughly steady spread. No statistics beyond that. Correlation, autocorrelation, partial autocorrelation and residual are all defined here as they turn up.

We rebuild Meera's shops from scratch on the next screen, so nothing carries over invisibly and every number below is one you can reproduce.

=== step === concept
::eyebrow Setting up
## Four shops, rebuilt from scratch

Everything here runs on the practice shops from part 1, so the first job is to build them again. Press Run on this block before any other, because every later block leans on what it makes.

```r
set.seed(11)
n <- 200
surprise <- round(rnorm(n, mean = 0, sd = 8))

plain <- 220 + surprise

steady <- numeric(n)
steady[1] <- 220
for (t in 2:n) {
  steady[t] <- round(220 + 0.6 * (steady[t - 1] - 220) + surprise[t])
}

echo <- numeric(n)
echo[1] <- 220 + surprise[1]
for (t in 2:n) {
  echo[t] <- round(220 + surprise[t] + 0.4 * surprise[t - 1])
}

head(steady, 8)
#> [1] 220 220 208 202 218 212 226 229
```

Three shops, all averaging 220 cups a day, all sharing the same two hundred daily surprises so that any difference between them comes from the rule and not from luck.

`plain` is the shop with no memory at all: every day is 220 cups plus that day's surprise, and yesterday has no say. `steady` is the sticky one, where sixty percent of yesterday's gap from the 220 average carries into today, which is an AR(1). `echo` is the shop where one unusual day leaves a trail, forty percent of yesterday's surprise showing up again today, which is an MA(1).

A fourth shop, the growing one from the cover chart of part 1, arrives later when we get to the letter I.

[NOTE]
If a block below ever complains that it cannot find `steady` or `surprise`, it means this setup block has not been run yet in this session. Run it and carry on.

=== step === concept
::eyebrow One lag at a time
## Pair each day with the day before it

Start with the simplest possible version of the question. Take the shop's numbers, and next to each day write down what the day before it sold. Here are the first eight days of the sticky shop with that column added, and a second one going two days back.

::widget table-transform {"code":"df %>% mutate(yesterday = lag(cups), two_days_ago = lag(cups, 2))","caption":"Each row now carries what happened one day earlier and two days earlier. Day 1 has nothing behind it, and day 2 has only one day behind it, so those cells are empty.","before":{"cols":["day","cups"],"rows":[[1,220],[2,220],[3,208],[4,202],[5,218],[6,212],[7,226],[8,229]]},"after":{"cols":["day","cups","yesterday","two_days_ago"],"rows":[[1,220,"NA","NA"],[2,220,220,"NA"],[3,208,220,220],[4,202,208,220],[5,218,202,208],[6,212,218,202],[7,226,212,218],[8,229,226,212]]}}

That shift has a name from part 1: a **lag**. The `yesterday` column is the series at lag 1, the `two_days_ago` column is the series at lag 2, and you can keep going as far back as you have days for.

Now measure how well two of those columns move together. **Correlation** is the one number for that job, running from 1 (they rise and fall in perfect step) through 0 (knowing one tells you nothing about the other) down to -1 (one rises exactly when the other falls). When you correlate a series with a lagged copy of itself, the result gets a longer name, **autocorrelation**, but it is the same measurement pointed at the same data twice.

Here is the recipe, written out for the autocorrelation at lag \( k \):

\( r_k = \dfrac{\sum_{t=k+1}^{n} (y_t - \bar{y})(y_{t-k} - \bar{y})}{\sum_{t=1}^{n} (y_t - \bar{y})^2} \)

Every symbol in plain words. \( y_t \) is the cups sold on day \( t \). \( \bar{y} \) (say "y bar") is the average of all the days. \( n \) is how many days there are, and \( k \) is how far back you are looking. The top line pairs each day with the day \( k \) steps earlier, measures how far each of the two sits from the average, and multiplies the pair together, so a pair that is high-and-high or low-and-low adds a positive amount and a mismatched pair subtracts. The bottom line is the total spread in the series, which turns the top line into a proportion rather than a quantity of cups.

=== step === concept
::eyebrow By hand, once
## Work one out on eight numbers

Formulas are easier to trust once you have run one yourself, so do the lag-1 autocorrelation on those eight days by hand before letting R near it.

```r
first8 <- head(steady, 8)
average <- mean(first8)
average
#> [1] 216.875

top <- sum((first8[2:8] - average) * (first8[1:7] - average))
bottom <- sum((first8 - average)^2)
round(top / bottom, 3)
#> [1] 0.275
```

`first8[2:8]` is days 2 through 8, and `first8[1:7]` is days 1 through 7, so multiplying them element by element pairs each day with the one before it, exactly like the two columns in the table. Both get the same average subtracted first, `average`, which is what the \( \bar{y} \) in the formula meant.

The answer, 0.275, says the eight days lean slightly upward: a day above 216.875 was somewhat more likely to be followed by another day above it. Eight days is far too few to conclude anything, which is a point we will come back to with force, but the arithmetic is now visible rather than hidden.

R does the same thing for every lag in one call.

```r
acf(first8, plot = FALSE)
#> 
#> Autocorrelations of series 'first8', by lag
#> 
#>      0      1      2      3      4      5      6      7 
#>  1.000  0.275 -0.105 -0.212 -0.475 -0.164  0.116  0.066 
```

There is 0.275 at lag 1, the number we just built. `acf` stands for **autocorrelation function**, and the word function is doing real work: it is one number for every lag, not a single result.

Lag 0 is always exactly 1.000, on every series that has ever existed, because a series compared with an unshifted copy of itself is a perfect match. It carries no information, and most plots leave it out or ignore it.

=== step === concept
::eyebrow The picture
## The correlogram, and what R actually draws

Two hundred days give you a couple of hundred possible lags, and reading that many numbers off a table gets old fast, so the ACF is almost always looked at as a chart. Here are the numbers for the sticky shop, out to twelve lags.

```r
acf(steady, lag.max = 12, plot = FALSE)
#> 
#> Autocorrelations of series 'steady', by lag
#> 
#>     0     1     2     3     4     5     6     7     8     9    10    11    12 
#> 1.000 0.577 0.380 0.293 0.167 0.091 0.094 0.031 0.035 0.032 0.040 0.033 0.006 
```

Those are the twelve bars from the cover, now with their values printed underneath. Lag 1 is 0.577, lag 2 is 0.380, and by lag 7 we are down to 0.031.

Drop the `plot = FALSE` and R draws it for you. Press Run and the real chart appears, which is the thing you will meet in every book and every colleague's notebook, so it is worth seeing early.

```r
acf(steady, lag.max = 12, main = "Sticky shop: autocorrelation by lag")
```

Four things are worth naming on that picture. The horizontal axis is the lag, counting days back. The vertical axis is the correlation, and it can go below zero. Each vertical line is one bar, drawn from a zero line, so a tall bar is a strong relationship and a bar you can barely see is nothing much. And the tall bar at the far left is lag 0, the always-1.000 one, which is there only because base R includes it.

Then there are the two blue dashed lines, which is where most people's eyes glaze over. They deserve their own screen.

=== step === concept
::eyebrow The dashed lines
## The band that separates signal from wobble

Take the shop with no memory, `plain`, where by construction yesterday tells you nothing whatsoever. Its true autocorrelation at every lag is zero. So the measured ACF should be all zeros, and it is not.

```r
acf(plain, lag.max = 10, plot = FALSE)
#> 
#> Autocorrelations of series 'plain', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10 
#>  1.000 -0.059 -0.001  0.107  0.003 -0.036  0.082 -0.058  0.018 -0.002  0.029 
```

::widget chart-plotter {"data":[{"x":1,"y":-0.059},{"x":2,"y":-0.001},{"x":3,"y":0.107},{"x":4,"y":0.003},{"x":5,"y":-0.036},{"x":6,"y":0.082},{"x":7,"y":-0.058},{"x":8,"y":0.018},{"x":9,"y":-0.002},{"x":10,"y":0.029}],"geoms":["line"],"x":"lag","y":"correlation"}

Lag 3 comes out at 0.107 and lag 6 at 0.082, and neither means anything at all. Two hundred days is a finite pile of numbers, so any measurement taken off them lands near the truth rather than on it, and here the truth is zero. The values you see are the size of that wobble.

Statisticians worked out how big the wobble is. If a series really has no autocorrelation, the measured values scatter around zero with a typical size of about \( 1/\sqrt{n} \), where \( n \) is the number of observations. Widen that to the range which catches roughly nineteen out of twenty of them and you get

\( \pm \dfrac{1.96}{\sqrt{n}} \)

which is exactly where R puts the dashed lines. The 1.96 is the standard "nineteen times out of twenty" multiplier that turns a typical size into a range, and the \( \sqrt{n} \) underneath is why more days give you a tighter band: the more numbers you average over, the less the average can wander.

```r
1.96 / sqrt(200)
#> [1] 0.1385929
```

So for any of Meera's two-hundred-day shops the band sits at plus and minus 0.139. Every bar in that no-memory ACF, the 0.107 included, sits inside it. Nothing there is real, and the plot says so.

[KEY INSIGHT]
A bar poking out past the dashed line is worth reading. A bar inside the band is the plot telling you it found nothing, however tempting the little bump looks. Always compare against the band on the plot in front of you, never a number you remember from a different series.

=== step === quiz
::eyebrow Check yourself
## What one bar actually says

The sticky shop's ACF reported 0.380 at lag 2. Which sentence says what that number means?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- The shop sells about 38 percent as many cups today as it did two days ago
- About 38 percent of the days in the series are two days after a busy day
- Days two apart move together moderately: when one is above the shop average, the other tends to be above it too ::ok That is it. An autocorrelation is a correlation like any other, measured between the series and a copy of itself shifted back two days, and it describes how the two move relative to the shop average rather than how big either one is.
- The model would need 38 percent fewer terms if it looked two days back ::no All three of those read the bar as something it is not. It is not a ratio of cups, because a shop selling 38 percent of a 300-cup day would be having a catastrophe. It is not a count of days either, since nothing here is being counted. And it says nothing about the size of a model. It is one thing only: how strongly days two apart move together, measured against the shop average.

=== step === concept
::eyebrow The catch
## Twenty lags, twenty chances to be fooled

There is a trap hiding in that band, and it catches people constantly. The band is drawn so that a bar from a series with no real pattern stays inside it about nineteen times out of twenty. Look at twenty lags, and one crossing is roughly what pure luck produces.

You do not have to take that on faith. The block below makes five hundred completely random series, each two hundred numbers long with no pattern of any kind in them, counts how many of each one's twenty bars stray outside the band, and tallies the results.

```r
set.seed(5)
crossings <- replicate(500, {
  noise <- rnorm(200)
  bars <- acf(noise, lag.max = 20, plot = FALSE)$acf[-1]
  sum(abs(bars) > 1.96 / sqrt(200))
})
table(crossings)
#> crossings
#>   0   1   2   3   4   5 
#> 200 176  83  29  11   1 

mean(crossings)
#> [1] 0.956
```

::widget chart-plotter {"data":[{"x":0,"y":200},{"x":1,"y":176},{"x":2,"y":83},{"x":3,"y":29},{"x":4,"y":11},{"x":5,"y":1},{"x":6,"y":0}],"geoms":["bar"],"x":"bars_outside_the_band","y":"number_of_series"}

`rnorm(200)` draws two hundred numbers with no relationship between them, `$acf[-1]` throws away the always-1.000 lag-0 entry, and `abs(bars) > 1.96 / sqrt(200)` asks of each remaining bar whether it strayed outside the band in either direction. `replicate` repeats the whole thing five hundred times.

The tally is the lesson. Two hundred of the five hundred pattern-free series produced a clean plot, but 176 of them threw up one stray bar, 83 threw up two, and one managed five. The average is 0.956 crossings per series, near enough to the one in twenty that the band was designed for.

So a lone bar poking out at lag 9, with nothing around it and no reason to expect anything at lag 9, is far more likely to be luck than a discovery. What you are looking for is the first few lags, and a pattern that hangs together.

=== step === quiz
::eyebrow Check yourself
## In or out

You are looking at the ACF of a series with 100 observations. The bar at lag 1 is 0.31, and the bar at lag 11 is 0.21. What do you make of them?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both count, because both are well above zero
- The band here is 0.196, so both clear it, but only the lag-1 bar is worth acting on: an isolated bar out at lag 11 with nothing near it is what chance produces ::ok Exactly the right pair of moves. First compute the band for this series rather than reusing one from another, which gives 1.96 divided by the square root of 100, so 0.196. Then weigh the two bars differently, because a bar at lag 1 sits where a real memory would show up, while a lone bar way out at lag 11 is the kind of thing roughly one series in twenty throws up for free.
- Neither counts, since the band for 100 observations is 0.196 and both bars are below it
- The lag-11 bar is the important one, because a relationship that survives eleven days must be a strong one ::no Work the band out first: 1.96 divided by the square root of 100 is 0.196, and both bars are above that, so it is not true that neither counts. Being outside the band is not the end of the reading though. Surviving to lag 11 with nothing at lags 2 through 10 is not evidence of a strong memory, it is the isolated stray bar that pure chance hands out about one series in twenty.

=== step === tryit
::eyebrow Your turn
## The band for a shorter series

Meera opens a second branch and has been counting cups there for only 60 days. Before reading anything off its ACF you need to know where that plot's dashed lines sit.

The band is 1.96 divided by the square root of the number of observations. Fill in the blank, then press Check.

```r
1.96 / sqrt(____)
```
::check {"regex":"1\\.96\\s*/\\s*sqrt\\s*\\(\\s*60\\s*\\)","gate":true,"difficulty":"beginner","ok":"About 0.253, nearly twice as wide as the 0.139 band for a two-hundred-day shop. Fewer days means more wobble, so a bar has to be much taller before it means anything. A lag-1 bar of 0.20 would be a real finding at the main shop and nothing at all at the new branch.","no":"You want the number of observations under the square root, and the new branch has 60 days of numbers. So it is 1.96 divided by the square root of 60."}
::solution
```r
1.96 / sqrt(60)
#> [1] 0.2530349
```

=== step === concept
::eyebrow The AR fingerprint
## Why an AR shop fades instead of stopping

Now put the tool to work on a shop whose rule we know. The sticky shop keeps sixty percent of yesterday's gap from average, and nothing else. So what should its ACF look like?

Follow one busy day through. Tuesday finishes 10 cups above average. Wednesday inherits sixty percent of that, so 6 cups. Thursday inherits sixty percent of Wednesday's 6, so 3.6. Friday gets 2.16. The influence never stops, it just gets multiplied by 0.6 again at every step, which means the autocorrelation at lag \( k \) should be \( \phi \) multiplied by itself \( k \) times:

\( \rho_k = \phi^{k} \)

where \( \phi \) (phi) is the AR coefficient from part 1, 0.6 here, and \( \rho_k \) (rho) is the true autocorrelation at lag \( k \). Work out what that predicts.

```r
round(0.6^(1:6), 3)
#> [1] 0.600 0.360 0.216 0.130 0.078 0.047
```

Now compare with what the shop's two hundred days actually produced: 0.577, 0.380, 0.293, 0.167, 0.091, 0.094. The first two are near enough exact, 0.577 against a predicted 0.600 and 0.380 against 0.360. Further out the measured values run a little high, 0.293 where the formula says 0.216, which is what happens when both the pattern and the noise are being estimated off the same fixed pile of two hundred days: the smaller the true value, the larger the wobble looks next to it.

::widget chart-plotter {"data":[{"x":1,"y":0.577},{"x":2,"y":0.380},{"x":3,"y":0.293},{"x":4,"y":0.167},{"x":5,"y":0.091},{"x":6,"y":0.094},{"x":7,"y":0.031},{"x":8,"y":0.035},{"x":9,"y":0.032},{"x":10,"y":0.040},{"x":11,"y":0.033},{"x":12,"y":0.006}],"geoms":["bar"],"x":"lag","y":"correlation"}

That shape has a name you will hear constantly: the ACF **tails off**. It gets smaller lag after lag, sinks under the 0.139 band around lag 5, and never snaps to zero at any particular point. Every AR series does this, whatever its order, which is both the good news and the bad news.

The good news is that a tailing-off ACF tells you there is an AR part in there. The bad news is that it says nothing about how many AR terms you need, which is what the next screen is for.

=== step === concept
::eyebrow The problem
## The ACF cannot count AR terms

Here is the difficulty, and it is worth sitting with because the PACF exists purely to solve it.

The sticky shop only ever looks one day back. That is the whole rule. Yet its ACF at lag 2 came out at 0.380, a solid number well outside the band, and lags 3 and 4 are outside it too. Count bars on the ACF and you would make it four AR terms, when the shop was built with one.

::widget process-flow {"steps":[{"title":"Monday","sub":"finishes 10 cups above average"},{"title":"Tuesday","sub":"inherits 6 of them, because it looks at Monday"},{"title":"Wednesday","sub":"inherits 3.6, because it looks at Tuesday"}]}

Wednesday never looks at Monday. But Wednesday looks at Tuesday, and Tuesday was carrying Monday's good day, so Monday reaches Wednesday second hand. The lag-2 correlation is real, and it is entirely inherited.

You can check that it really is second hand rather than direct. If the whole of the lag-2 relationship arrives through the middle day, then it should come out at roughly the lag-1 relationship multiplied by itself, because the link has to survive two handovers instead of one.

```r
acf1 <- acf(steady, lag.max = 1, plot = FALSE)$acf[2]
round(acf1, 3)
#> [1] 0.577

round(acf1 * acf1, 3)
#> [1] 0.332
```

Squaring the lag-1 value predicts 0.332 for lag 2, against a measured 0.380. Close enough, given that both are estimates from the same two hundred days, to say that nothing extra is happening at lag 2 beyond what came through Tuesday.

So the question we actually want answered is not "does two days back correlate with today", because it always will if yesterday does. It is: **once you already know yesterday, does two days back tell you anything more?**

=== step === concept
::eyebrow The PACF idea
## Take yesterday out of both, then look

The trick for answering that is one of the neatest ideas in statistics, and it works like this.

If you want to know what two-days-ago tells you *beyond* yesterday, first use yesterday to make the best guess you can of today. Whatever is left over after that guess is the part of today that yesterday could not account for. Then do exactly the same thing to the two-days-ago column, using yesterday to guess it too, and keep the leftover. Now correlate the two leftovers. Yesterday cannot be responsible for any of what remains, because it has been used up on both sides.

Watch it on real days. The guess column below comes from a straight line fitted through today against yesterday, and the leftover is what that line missed by.

::widget table-transform {"code":"df %>% mutate(guess = 92.27 + 0.5806 * yesterday, leftover_today = today - guess)","caption":"The guess uses yesterday and nothing else. The leftover is the part of today that yesterday could not explain, which is what we are going to correlate.","before":{"cols":["day","today","yesterday"],"rows":[[3,208,220],[4,202,208],[5,218,202],[6,212,218],[7,226,212],[8,229,226]]},"after":{"cols":["day","today","yesterday","guess","leftover_today"],"rows":[[3,208,220,220.0,-12.0],[4,202,208,213.0,-11.0],[5,218,202,209.6,8.4],[6,212,218,218.8,-6.8],[7,226,212,215.4,10.6],[8,229,226,223.5,5.5]]}}

Day 5 is a good one to follow. Yesterday sold 202, which is below average, so the line guessed a below-average 209.6 for today. Today actually sold 218. The 8.4 cup difference is the leftover: the part of day 5 that had nothing to do with day 4.

Do that to both columns and correlate the leftovers, and you have the **partial autocorrelation** at lag 2. Partial, because it is the part of the relationship that belongs to two-days-ago alone.

```r
today <- steady[3:n]
yesterday <- steady[2:(n - 1)]
two_days_ago <- steady[1:(n - 2)]

round(coef(lm(today ~ yesterday)), 4)
#> (Intercept)   yesterday 
#>     92.2654      0.5806 

leftover_today <- residuals(lm(today ~ yesterday))
leftover_two <- residuals(lm(two_days_ago ~ yesterday))

round(cor(leftover_two, leftover_today), 4)
#> [1] 0.0708
```

`lm` fits a straight line, in this case today against yesterday, and `residuals` hands back the leftovers we just walked through by hand: the misses, one per day. The coefficient 0.5806 is the slope of that line, and it is the AR coefficient of part 1 turning up again, close to the 0.5777 that `arima()` reported there because the two are different routes to the same quantity.

The answer is 0.0708. Once yesterday is accounted for, two days ago adds essentially nothing, which is exactly right for a shop whose rule only ever looks one day back.

=== step === concept
::eyebrow The second plot
## The PACF of an AR shop cuts off

R computes that for every lag at once, and calls the whole set the **partial autocorrelation function**, or PACF.

```r
pacf(steady, lag.max = 10, plot = FALSE)
#> 
#> Partial autocorrelations of series 'steady', by lag
#> 
#>      1      2      3      4      5      6      7      8      9     10 
#>  0.577  0.071  0.073 -0.065 -0.019  0.060 -0.059  0.043 -0.007  0.036 
```

There is 0.071 at lag 2, the number we just built by hand out of two straight lines and a correlation. R gets there by a faster route than fitting lines, so the two agree to three decimals rather than matching digit for digit, but they are measuring the same thing.

::widget chart-plotter {"data":[{"x":1,"y":0.577},{"x":2,"y":0.071},{"x":3,"y":0.073},{"x":4,"y":-0.065},{"x":5,"y":-0.019},{"x":6,"y":0.060},{"x":7,"y":-0.059},{"x":8,"y":0.043},{"x":9,"y":-0.007},{"x":10,"y":0.036}],"geoms":["line"],"x":"lag","y":"partial_correlation"}

Compare that with the ACF a few screens back and the difference is dramatic. The ACF slid downhill for four lags before sinking into the band. The PACF has one value at lag 1 and then falls off a cliff: 0.577, then 0.071, and everything after it is stuck in the noise floor, comfortably inside the 0.139 band.

That abrupt drop is called a **cutoff**, and the lag where it happens is the number you have been looking for. One bar outside the band means one AR term, so p equals 1, which is precisely how the shop was built.

Press Run to see it drawn, dashed band and all. Notice that base R starts the PACF at lag 1, because there is no such thing as a partial autocorrelation at lag 0.

```r
pacf(steady, lag.max = 12, main = "Sticky shop: partial autocorrelation by lag")
```

[KEY INSIGHT]
The ACF of an AR series tails off, and its PACF cuts off at lag p. So when you want p, you read the PACF and count the bars that clear the band before the cliff.

=== step === quiz
::eyebrow Check yourself
## Reading p

A colleague sends you the PACF of a stationary series, 300 observations long. Lags 1 and 2 are 0.71 and 0.34, lag 3 is 0.06, and lags 4 through 12 all sit between -0.09 and 0.08. The band is 0.113. What is p?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- p is 12, because that is how many lags were checked
- p is 2, because the last bar clearly outside the band is lag 2 and everything after it is inside ::ok Right. Two bars clear the 0.113 band, then lag 3 drops to 0.06 and stays down, so the cutoff is at lag 2 and the series wants two AR terms. Whether the model should keep both is a separate question, but as a reading of the plot, p is 2.
- p is 3, because you count up to and including the first bar that falls inside the band
- p cannot be read from a PACF, only from an ACF ::no The count is of bars outside the band before the cutoff, which is two of them here. Lag 12 is just how far the plot was drawn and has nothing to do with the order, and lag 3 is inside the band so it is not part of the count. And it is the PACF, not the ACF, that gives you p: the ACF of an AR series tails off gradually and would let you count almost any number you liked.

=== step === concept
::eyebrow The MA fingerprint
## An MA shop stops dead instead of fading

Now the other shop. In `echo`, today is 220 cups plus today's surprise plus forty percent of yesterday's surprise, and that is the whole rule.

Ask the same question we asked of the AR shop. Today and yesterday share something, because yesterday's surprise appears in both of them: it is the main event for yesterday and the forty percent trail for today. So they should correlate. But today and the day before yesterday share nothing at all. Today's formula reaches back exactly one day, so by the time you are two days apart the two days have no ingredient in common.

::widget process-flow {"steps":[{"title":"Days one apart","sub":"both contain the surprise from the earlier day, so they correlate"},{"title":"Days two apart","sub":"no surprise appears in both formulas, so nothing is left to correlate"},{"title":"Days further apart","sub":"the same, all the way out"}]}

That prediction is sharp, and it is what the ACF shows.

```r
acf(echo, lag.max = 10, plot = FALSE)
#> 
#> Autocorrelations of series 'echo', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10 
#>  1.000  0.299  0.020  0.116  0.027 -0.014  0.051 -0.025  0.000  0.015  0.040 
```

::widget chart-plotter {"data":[{"x":1,"y":0.299},{"x":2,"y":0.020},{"x":3,"y":0.116},{"x":4,"y":0.027},{"x":5,"y":-0.014},{"x":6,"y":0.051},{"x":7,"y":-0.025},{"x":8,"y":0.000},{"x":9,"y":0.015},{"x":10,"y":0.040}],"geoms":["line"],"x":"lag","y":"correlation"}

One value outside the band at lag 1, then a floor. Lag 2 falls all the way to 0.020, and although lag 3 is the tallest of the survivors at 0.116, it is still inside the 0.139 band and so is everything behind it. No gradual slide, no fading, just a drop. The ACF **cuts off** after lag 1, and that cutoff lag is q, the number of MA terms, which is 1 exactly as we built it.

There is even a formula for how tall that single bar should be. For an MA(1) with coefficient \( \theta \) (theta), the true lag-1 autocorrelation is

\( \rho_1 = \dfrac{\theta}{1 + \theta^{2}} \)

which for \( \theta = 0.4 \) works out at 0.4 divided by 1.16, or 0.345. We measured 0.299 off two hundred days, which is the usual finite-sample gap. Worth noticing that the bar is 0.345 rather than 0.4: the MA coefficient and the correlation it produces are related but they are not the same number, so never read a coefficient straight off a bar height.

=== step === concept
::eyebrow The mirror image
## And its PACF refuses to stop

The AR shop had a tailing ACF and a cutting PACF. The MA shop is the mirror: its ACF cuts, and its PACF tails off.

The reason is worth a sentence, because it sounds like a paradox. Today contains a piece of yesterday's surprise. Yesterday contains a piece of the surprise before that. So even though today's formula never mentions two days ago, today is built out of a shock that yesterday also carried, and yesterday was built out of one the day before carried, and the chain leaves a faint direct trace at every lag, shrinking and flipping sign as it goes.

With `echo` that trace is genuinely hard to see, because a forty percent trail is a quiet signal. Turn the echo up to eighty percent and the same fingerprint gets loud enough to read.

```r
loud <- numeric(n)
loud[1] <- 220 + surprise[1]
for (t in 2:n) {
  loud[t] <- round(220 + surprise[t] + 0.8 * surprise[t - 1])
}

pacf(loud, lag.max = 10, plot = FALSE)
#> 
#> Partial autocorrelations of series 'loud', by lag
#> 
#>      1      2      3      4      5      6      7      8      9     10 
#>  0.455 -0.226  0.267 -0.220  0.177 -0.108  0.052 -0.030  0.042  0.028 
```

::widget chart-plotter {"data":[{"x":1,"y":0.455},{"x":2,"y":-0.226},{"x":3,"y":0.267},{"x":4,"y":-0.220},{"x":5,"y":0.177},{"x":6,"y":-0.108},{"x":7,"y":0.052},{"x":8,"y":-0.030},{"x":9,"y":0.042},{"x":10,"y":0.028}],"geoms":["line"],"x":"lag","y":"partial_correlation"}

Positive, negative, positive, negative, shrinking as it goes: 0.455, then -0.226, then 0.267, then -0.220, and only settling into the noise floor around lag 6. Nothing about that is a cutoff. It zigzags its way down, which is one of the shapes a tail-off comes in.

[WARNING]
A tail-off does not have to be a smooth slide. It can alternate sign like this one, or wobble, or take a while to get going. What makes it a tail-off is that the bars shrink gradually and never fall off a cliff at one particular lag. That is the contrast you are reading, not the exact path.

Meanwhile the ACF of the loud shop still cuts off after lag 1, at 0.455 with everything after it inside the band, because the rule still reaches back exactly one day however loud the echo is.

=== step === tryit
::eyebrow Your turn
## Read q off the echo shop

You have the echo shop's numbers in `echo`. Print its autocorrelations out to six lags, so you can see the single bar and the floor behind it.

The function takes the series first, then `lag.max` for how far back to go, and `plot = FALSE` to get numbers instead of a picture. Fill in the blank and press Check.

```r
acf(____, lag.max = 6, plot = FALSE)
```
::check {"regex":"acf\\s*\\(\\s*echo\\s*,","gate":true,"difficulty":"beginner","ok":"Lag 1 is 0.299, out past the 0.139 band, and lags 2 through 6 are 0.020, 0.116, 0.027, -0.014 and 0.051, all inside it. One bar out and then a floor, so the ACF cuts off after lag 1 and q is 1. That is the shop we built with a one-day echo.","no":"The series you want is echo, and it goes in first, before lag.max. So the call reads acf of echo, comma, lag.max equals 6, comma, plot equals FALSE."}
::solution
```r
acf(echo, lag.max = 6, plot = FALSE)
#> 
#> Autocorrelations of series 'echo', by lag
#> 
#>      0      1      2      3      4      5      6 
#>  1.000  0.299  0.020  0.116  0.027 -0.014  0.051 
```

=== step === concept
::eyebrow The whole method
## Four fingerprints, one table

Everything so far collapses into a single table, and this table is the reason the two plots are always shown together. Neither one means much alone; it is the pair that names the process.

| What the ACF does | What the PACF does | What it is | What you read |
|---|---|---|---|
| tails off gradually | cuts off after lag p | AR(p) | p, off the PACF |
| cuts off after lag q | tails off gradually | MA(q) | q, off the ACF |
| tails off gradually | tails off gradually | a mix of both | neither, directly |
| nothing outside the band | nothing outside the band | no memory at all | p and q are both 0 |

The last row is the one people forget exists. The no-memory shop had no bar outside the band on either plot, and that is a finding, not a failure: it says the series has nothing for AR or MA terms to describe, and any model beyond the average would be fitting noise.

Here is the order to do it in.

::widget process-flow {"steps":[{"title":"1. Make it stationary first","sub":"a trending series has to be differenced before either plot means anything"},{"title":"2. Draw both plots and find the band","sub":"1.96 divided by the square root of the number of observations"},{"title":"3. Match the pair against the table","sub":"one cutting and one tailing names the model and the lag gives the order"}]}

Step 1 is not optional, and it is the subject of the next few screens.

=== step === quiz
::eyebrow Check yourself
## Name that process

A stationary series of 250 days gives you an ACF where lags 1 and 2 stand well outside the band and lags 3 onwards are all inside it, and a PACF whose bars shrink gradually over about six lags, alternating between positive and negative. What is it?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- AR(2), because two bars stand outside the band
- AR(6), because the PACF stays busy for six lags
- MA(2): the ACF is the plot that cuts off, and it cuts after lag 2 ::ok Correct. Match the pair rather than either plot alone. The cutting plot here is the ACF, which points at MA, and it cuts after lag 2, so q is 2. The alternating shrink in the PACF is a tail-off, and an alternating tail-off is a shape you have already seen, on the loud echo shop.
- A mix of AR and MA, since both plots have several bars outside the band ::no The reading depends on which plot cuts and which one tails. Here the ACF is the one that stops dead after lag 2, and a cutting ACF always points to MA with q equal to the cutoff lag. Counting bars on the PACF would give you an AR order, but this PACF is not cutting off, it is shrinking gradually, and a gradual shrink is not a cutoff no matter how many bars are involved. A mix would need both plots tailing off, with neither one stopping.

=== step === concept
::eyebrow The letter I
## An ACF that will not come down

Time for the fourth shop, the growing one from the cover of part 1. The loop below builds the day-to-day changes rather than the daily totals, and `cumsum` adds those changes up as it goes, so a small upward drift compounds into a shop that doubles over the two hundred days. Build it, and look at its ACF.

```r
set.seed(72)
wobble <- rnorm(n, mean = 0, sd = 8)

change <- numeric(n)
change[1] <- 1.2
for (t in 2:n) {
  change[t] <- 1.2 + 0.4 * (change[t - 1] - 1.2) + wobble[t] + 0.3 * wobble[t - 1]
}

cups <- round(220 + cumsum(change))

acf(cups, lag.max = 12, plot = FALSE)
#> 
#> Autocorrelations of series 'cups', by lag
#> 
#>     0     1     2     3     4     5     6     7     8     9    10    11    12 
#> 1.000 0.983 0.963 0.941 0.919 0.898 0.878 0.860 0.843 0.825 0.807 0.789 0.772 
```

::widget chart-plotter {"data":[{"x":1,"y":0.983},{"x":2,"y":0.963},{"x":3,"y":0.941},{"x":4,"y":0.919},{"x":5,"y":0.898},{"x":6,"y":0.878},{"x":7,"y":0.860},{"x":8,"y":0.843},{"x":9,"y":0.825},{"x":10,"y":0.807},{"x":11,"y":0.789},{"x":12,"y":0.772}],"geoms":["bar"],"x":"lag","y":"correlation"}

Twelve bars, every one of them enormous, and the whole thing coming down in an almost perfectly straight line rather than a curve. This is the single most recognisable shape in the whole subject, and it does not mean the shop has a twelve day memory.

It means the shop grew. Part 1 showed why: the shop averaged 292 cups a day over its first thirty days and 591 over its last thirty, so any two days in the same fortnight are bound to be similar, and the correlation is picking up the trend rather than any memory. Compare the shape with the sticky shop's ACF, which was down inside the band by lag 5. This one is still at 0.772 after twelve days, and it would still be high after thirty.

[KEY INSIGHT]
An ACF that starts near 1 and comes down slowly in a straight line is not a long memory. It is a series that has not been differenced yet, and until you difference it neither plot can tell you anything about p or q.

So do what part 1 said: work with the daily changes instead of the daily totals.

=== step === concept
::eyebrow After differencing
## Two plots, and an honest shortlist

`diff(cups)` turns the levels into day-to-day changes, and that series is stationary, meaning it has no drifting level and roughly steady spread. Now the plots are allowed to speak.

```r
acf(diff(cups), lag.max = 10, plot = FALSE)
#> 
#> Autocorrelations of series 'diff(cups)', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10 
#>  1.000  0.579  0.194  0.015 -0.045 -0.118 -0.074  0.070  0.119 -0.014 -0.160 
```

::widget chart-plotter {"data":[{"x":1,"y":0.579},{"x":2,"y":0.194},{"x":3,"y":0.015},{"x":4,"y":-0.045},{"x":5,"y":-0.118},{"x":6,"y":-0.074},{"x":7,"y":0.070},{"x":8,"y":0.119},{"x":9,"y":-0.014},{"x":10,"y":-0.160}],"geoms":["line"],"x":"lag","y":"correlation"}

Completely different from the levels. The band for 199 changes is 0.139, so lags 1 and 2 clear it, lag 3 is 0.015, and after that we are in the floor apart from a -0.160 at lag 10 which is the kind of isolated stray we already know to leave alone.

Now the partner plot.

```r
pacf(diff(cups), lag.max = 10, plot = FALSE)
#> 
#> Partial autocorrelations of series 'diff(cups)', by lag
#> 
#>      1      2      3      4      5      6      7      8      9     10 
#>  0.579 -0.214  0.005 -0.027 -0.113  0.088  0.125 -0.020 -0.160 -0.113 
```

::widget chart-plotter {"data":[{"x":1,"y":0.579},{"x":2,"y":-0.214},{"x":3,"y":0.005},{"x":4,"y":-0.027},{"x":5,"y":-0.113},{"x":6,"y":0.088},{"x":7,"y":0.125},{"x":8,"y":-0.020},{"x":9,"y":-0.160},{"x":10,"y":-0.113}],"geoms":["line"],"x":"lag","y":"partial_correlation"}

Two bars out, then a floor. Again.

So which is it? The ACF looks like it cuts after 2, which says MA(2). The PACF looks like it cuts after 2, which says AR(2). Both cannot be right, and this is what real data does rather than a flaw in the method. When a series has both an AR part and an MA part, neither plot gets a clean cutoff, and what you are left with is a shortlist.

We happen to know the truth here, because part 1 built this shop with one AR term and one MA term on the changes, an ARIMA(1,1,1). Fit the three candidates the plots suggested and score them.

```r
round(c(AR2 = arima(cups, order = c(2, 1, 0))$aic,
        MA2 = arima(cups, order = c(0, 1, 2))$aic,
        ARMA11 = arima(cups, order = c(1, 1, 1))$aic), 2)
#>     AR2     MA2  ARMA11 
#> 1404.72 1403.91 1405.22 
```

AIC is a score for comparing models where lower is better, and it will get its own lesson. Look at how close those three are: 1.3 points apart across all of them, which is a tie by any reasonable standard. The true model came third by a hair.

That is not a defeat, it is the honest state of affairs. The plots did their job by narrowing hundreds of possible orders down to three sensible ones, all of which describe this shop about equally well. Part 3 is about choosing between a shortlist like that, and about how little it usually matters which of a near-tie you pick.

=== step === concept
::eyebrow Differencing too far
## The tell that you differenced once too often

Part 1 warned that differencing is not a safety dial. The ACF is where that warning becomes visible, and it is a shape you should be able to spot in a second.

Take the shop with no memory and no trend, which needs no differencing at all, and difference it anyway.

```r
acf(diff(plain), lag.max = 8, plot = FALSE)
#> 
#> Autocorrelations of series 'diff(plain)', by lag
#> 
#>      0      1      2      3      4      5      6      7      8 
#>  1.000 -0.526 -0.022  0.093 -0.029 -0.072  0.126 -0.105  0.048 
```

::widget chart-plotter {"data":[{"x":1,"y":-0.526},{"x":2,"y":-0.022},{"x":3,"y":0.093},{"x":4,"y":-0.029},{"x":5,"y":-0.072},{"x":6,"y":0.126},{"x":7,"y":-0.105},{"x":8,"y":0.048}],"geoms":["line"],"x":"lag","y":"correlation"}

The original series had a lag-1 autocorrelation of -0.059, which is nothing. Its differences have -0.526, a strong negative relationship, and there was nothing in the shop that could have produced it.

The arithmetic produced it. Today's change is today minus yesterday, and tomorrow's change is tomorrow minus today, so today's number appears in both, with a plus sign in one and a minus in the other. A big jump up is therefore followed by a move back down, by construction rather than by business. Differencing something that was already stationary manufactures that pattern every time.

[WARNING]
A large negative bar at lag 1, roughly -0.5 or beyond, with the rest of the plot quiet, means you have differenced once too often. Undo the last difference. It is a much better signal than staring at the series and wondering whether the trend is really gone.

=== step === quiz
::eyebrow Check yourself
## One difference too many

You difference a sales series once, the slow straight decay in its ACF disappears, and things look healthy. You difference it a second time to be safe, and the new ACF has a single bar at lag 1 of -0.54 with everything else inside the band. What happened?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The second difference was one too many, and that big negative lag-1 bar is the arithmetic of differencing rather than anything in the sales ::ok Exactly. The first difference had already done the job. Differencing an already-stationary series puts each value into two consecutive changes with opposite signs, which forces neighbouring changes to lean against each other, and about -0.5 at lag 1 is what that looks like. Go back to the single difference.
- The series is an MA(1), since the ACF cuts off after lag 1
- The second difference worked, and the negative bar shows the trend was finally removed
- Nothing is wrong, because a negative autocorrelation is just a correlation with the sign flipped ::no The shape does technically cut off after lag 1, but reading it as a genuine MA(1) misses where it came from: the pattern was created by the second difference, not found in the sales. Nor is a big negative bar a sign that a trend has been removed, since the first difference had already flattened the series. And treating the sign as cosmetic misses the point entirely, because a strong negative bar at lag 1 after differencing is the specific fingerprint of overdoing it.

=== step === concept
::eyebrow Calendars
## A spike that keeps coming back

One more shape, and on real business data it is an easy one to walk straight past.

Suppose Meera's shop has no memory from day to day, but Saturdays are always her best day and Sundays her worst, week in and week out. Build that: take the no-memory shop and add a fixed pattern that repeats every seven days.

```r
weekday <- c(-9, -4, -1, 2, 6, 18, -12)
weekly <- plain + weekday[(seq_len(n) - 1) %% 7 + 1]
head(weekly, 14)
#>  [1] 206 216 207 211 235 231 219 216 216 211 215 223 226 206
```

Day 1 is a Monday, so `weekday` runs Monday to Sunday: Mondays run 9 cups below the shop average, Saturdays 18 above, Sundays 12 below. The `%%` operator gives the remainder after dividing, so `(seq_len(n) - 1) %% 7 + 1` counts 1, 2, 3, 4, 5, 6, 7, 1, 2, 3 and onwards forever, which is what picks the right weekday for every day of the two hundred.

Now the ACF.

```r
acf(weekly, lag.max = 8, plot = FALSE)
#> 
#> Autocorrelations of series 'weekly', by lag
#> 
#>      0      1      2      3      4      5      6      7      8 
#>  1.000  0.007 -0.120 -0.142 -0.179 -0.134  0.059  0.512  0.042 
```

::widget chart-plotter {"data":[{"x":1,"y":0.007},{"x":2,"y":-0.120},{"x":3,"y":-0.142},{"x":4,"y":-0.179},{"x":5,"y":-0.134},{"x":6,"y":0.059},{"x":7,"y":0.512},{"x":8,"y":0.042},{"x":9,"y":-0.123},{"x":10,"y":-0.171},{"x":11,"y":-0.157},{"x":12,"y":-0.105},{"x":13,"y":0.015},{"x":14,"y":0.517},{"x":15,"y":0.022},{"x":16,"y":-0.091}],"geoms":["line"],"x":"lag","y":"correlation"}

Lag 1 is 0.007, which is nothing, exactly as it should be for a shop with no day-to-day memory. Lags 2 through 5 sag gently negative, dipping to -0.179. Then lag 7 jumps to 0.512, clear of everything around it. And if you look further, lag 14 does it again, which is the fifteenth number `acf()` hands back because that vector starts at lag 0.

```r
round(acf(weekly, lag.max = 14, plot = FALSE)$acf[15], 3)
#> [1] 0.517
```

That is a **seasonal spike**, where seasonal in time series language means any repeating calendar rhythm, not just summer and winter. A daily series that repeats weekly spikes at 7, 14 and 21. Monthly sales that repeat yearly spike at 12 and 24. Hourly traffic that repeats daily spikes at 24.

The reason is simple once you see it. Today is a Wednesday and seven days ago was also a Wednesday, so the two share the whole weekday effect. Three days ago was a Sunday, which is as different from a Wednesday as this shop gets, and that mismatch is what pushes the middle lags gently negative.

None of this can be fixed by raising p. An AR term at lag 1, 2 or 3 looks at the wrong days. What you need is a term that reaches back exactly 7, which is what seasonal ARIMA adds, written with a second bracket carrying its own p, d and q plus the season length. The important skill here is recognising the shape, because fitting an ordinary ARIMA to a series with a spike at lag 7 leaves the biggest pattern in the data completely unmodelled and you will never find out from the model summary.

=== step === quiz
::eyebrow Check yourself
## A spike at lag 12

You are handed monthly sales for a garden centre, five years of numbers, already differenced once so the ACF no longer decays slowly. What is left is a quiet plot with one clear spike at lag 12 and another at lag 24. What does that tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The series needs 12 AR terms, one for each month of memory
- There is a yearly rhythm: each month resembles the same month a year earlier, which needs a seasonal term rather than more ordinary ones ::ok Right, and the repeat at 24 confirms it. Monthly data repeating once a year lines up at lag 12, then again at 24, then 36. An ordinary ARIMA cannot see that, because its terms reach back one, two or three months, so this needs the seasonal version.
- It should be differenced again until the lag-12 spike goes away
- The lag-12 spike is an isolated bar, so it is the kind of chance crossing to ignore ::no Twelve AR terms would be an expensive way to reach back a year and would spend eleven parameters on months nobody cares about. Differencing again will not help either, because the problem is not a trend, and over-differencing brings its own damage. And the spike is not chance: a bar at exactly the calendar period, repeating at twice the period, is the definition of a pattern that hangs together.

=== step === concept
::eyebrow Being honest about it
## Where reading the plots runs out

The two plots are a genuinely good tool and they are not an oracle. Six things they cannot do, worth knowing before you rely on them.

- **They give a shortlist, not an answer.** You saw it on Meera's own shop: the ACF said MA(2), the PACF said AR(2), the truth was ARIMA(1,1,1), and all three fitted about equally well. When both plots tail off, stop counting bars and start comparing candidate models.
- **They are noisy.** Five hundred pattern-free series produced 0.956 stray bars each on average. On any real plot, expect roughly one crossing in twenty to be luck, and treat isolated far-out bars accordingly.
- **They need a lot of days.** The band is 1.96 divided by the square root of the number of observations, so 50 days gives you a band of 0.277 and only a fairly strong pattern will clear it. On a short series, absence of evidence really is not evidence of absence.
- **They demand stationarity first.** Read them on a trending series and you get the slow straight decay and nothing else, whatever AR or MA structure is hiding underneath.
- **They say nothing about outside causes.** A price cut, a competitor opening, a fortnight of rain: none of that shows up as a shape on either plot, and no order you read off them will capture it.
- **They cannot tell you whether the model fits.** Reading p and q is choosing a candidate. Checking it is a separate job, and it is the next screen.

None of that makes the plots optional. Starting from an informed shortlist of two or three orders beats searching blindly, and the shapes tell you things a search never will: that the series needs differencing, that there is a weekly rhythm, that there is nothing there at all.

=== step === concept
::eyebrow Closing the loop
## Fit it, then look at what is left over

Here is the move that turns a reading into a decision, and it uses the same plot you have been reading all lesson.

Fit your chosen model. Whatever it fails to explain comes out as the **residuals**: one number per day, the gap between what the model predicted and what actually happened. If the model has captured all the structure, those leftovers should have no pattern in them at all, which means their ACF should be empty.

The sticky shop's PACF said AR(1), so fit that and look.

```r
fit <- arima(steady, order = c(1, 0, 0))

acf(residuals(fit), lag.max = 10, plot = FALSE)
#> 
#> Autocorrelations of series 'residuals(fit)', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10 
#>  1.000 -0.038  0.007  0.107  0.010 -0.033  0.084 -0.049  0.020 -0.004  0.025 
```

::widget chart-plotter {"data":[{"x":1,"y":-0.038},{"x":2,"y":0.007},{"x":3,"y":0.107},{"x":4,"y":0.010},{"x":5,"y":-0.033},{"x":6,"y":0.084},{"x":7,"y":-0.049},{"x":8,"y":0.020},{"x":9,"y":-0.004},{"x":10,"y":0.025}],"geoms":["line"],"x":"lag","y":"correlation"}

Every bar inside the 0.139 band. The stickiness that filled the original ACF is gone, absorbed by the one AR term, and what remains is the daily surprise, which is unpredictable by definition. That is what a passed check looks like.

Now deliberately fit the wrong thing. Give the sticky shop an MA(1), which describes a one-day trail instead of a persistent pull, and watch the leftovers complain.

```r
bad <- arima(steady, order = c(0, 0, 1))

acf(residuals(bad), lag.max = 10, plot = FALSE)
#> 
#> Autocorrelations of series 'residuals(bad)', by lag
#> 
#>      0      1      2      3      4      5      6      7      8      9     10 
#>  1.000  0.130  0.308  0.156  0.124  0.016  0.109 -0.026  0.050  0.001  0.036 
```

0.308 at lag 2 and 0.156 at lag 3 are both outside the 0.139 band, and lags 1 and 4 are pressed right up against it at 0.130 and 0.124. The first six bars are positive without exception, which is a run of leftovers all leaning the same way, and the passed check above has nothing like it. The MA term mopped up lag 1 tolerably and then had nothing left for the long fading tail an AR shop produces, so that tail is still sitting in the leftovers waiting to be modelled.

Rather than eyeballing ten bars, you can put a number on the whole plot at once.

```r
box_good <- Box.test(residuals(fit), lag = 10, type = "Ljung-Box", fitdf = 1)
box_bad <- Box.test(residuals(bad), lag = 10, type = "Ljung-Box", fitdf = 1)

round(box_good$p.value, 4)
#> [1] 0.8251

signif(box_bad$p.value, 2)
#> [1] 7.5e-05
```

The Ljung-Box test asks one question: taking the first ten bars together, is there more pattern here than a set of pattern-free leftovers would produce? The p-value is the answer, and a small one means "yes, more than luck would give you". The good model scores 0.8251, which is a comfortable pass, and the wrong one scores 0.000075, which is a loud failure. The `fitdf = 1` says that one coefficient was estimated from this same data rather than known in advance, so the test discounts one of the ten bars accordingly.

[KEY INSIGHT]
An empty residual ACF does not prove the model is right. It says nothing is obviously left over, which is a much weaker and much more honest claim. A residual ACF with bars in it, on the other hand, is a definite no.

=== step === quiz
::eyebrow Check yourself
## Reading the leftovers

You fit an ARIMA to two years of daily orders. The residual ACF is quiet everywhere except a clear spike at lag 7. What is the most sensible next move?

::quiz {"correct":4,"gate":true,"difficulty":"advanced"}
- Accept the model, because a single bar out of many is the sort of chance crossing to ignore
- Difference the series again, since something is clearly left in it
- Raise p to 7 until the lag-7 bar comes inside the band ::no A spike at exactly 7 on daily data is the one bar you should not write off as chance, because it lands where a weekly rhythm lands. Differencing again attacks a trend that is not the problem and brings the over-differencing damage with it. And raising p to 7 would spend six parameters on lags nobody expects anything from, just to reach the one that matters.
- Add a seasonal term at lag 7, because a weekly rhythm is exactly what the model has failed to capture ::ok Right. A residual spike at precisely the calendar period is not a stray, it is the biggest pattern in the data still sitting unmodelled, and the fix is a term that reaches back a week rather than more terms that reach back a day or two.

=== step === concept
::eyebrow One more shop
## The rival across the road

A rival cafe has opened across the road, and Meera has been counting the cups going out of its door for two hundred days too. The loop below builds those days, and it does plant a known rule, which is deliberate: this is the last series in the course where you get to check your reading against the answer key. Do the reading first and look at the loop afterwards.

```r
set.seed(6)
rshock <- rnorm(n, mean = 0, sd = 9)
rival <- numeric(n)
rival[1] <- 180
rival[2] <- 180
for (t in 3:n) {
  rival[t] <- round(180 + 0.5 * (rival[t - 1] - 180) + 0.3 * (rival[t - 2] - 180) + rshock[t])
}

head(rival, 12)
#>  [1] 180 180 188 200 193 196 180 191 186 177 196 176
```

It hovers around 180 cups with no trend to speak of, so there is nothing to difference and both plots can be read straight away. Start with the ACF.

```r
acf(rival, lag.max = 10, plot = FALSE)
#> 
#> Autocorrelations of series 'rival', by lag
#> 
#>     0     1     2     3     4     5     6     7     8     9    10 
#> 1.000 0.634 0.561 0.423 0.300 0.220 0.208 0.128 0.081 0.066 0.027 
```

::widget chart-plotter {"data":[{"x":1,"y":0.634},{"x":2,"y":0.561},{"x":3,"y":0.423},{"x":4,"y":0.300},{"x":5,"y":0.220},{"x":6,"y":0.208},{"x":7,"y":0.128},{"x":8,"y":0.081},{"x":9,"y":0.066},{"x":10,"y":0.027}],"geoms":["bar"],"x":"lag","y":"correlation"}

A smooth slide from 0.634 down to nothing over about seven lags, with no cliff anywhere. That is a tail-off, so by the table this is not an MA series, and the ACF has told you everything it is going to.

The order has to come off the other plot.

=== step === tryit
::eyebrow Your turn
## Read the rival cold

Print the rival's partial autocorrelations out to eight lags, then read p off them against the 0.139 band for a two-hundred-day series. Fill in the blank and press Check.

```r
pacf(____, lag.max = 8, plot = FALSE)
```
::check {"regex":"pacf\\s*\\(\\s*rival\\s*,","gate":true,"difficulty":"intermediate","ok":"The PACF reads 0.634, 0.265, then -0.012, -0.076, -0.017, 0.100, -0.054, -0.059. Two bars clear the 0.139 band, the third drops to -0.012, and nothing recovers after it. So the cutoff is at lag 2, p is 2, and with a tailing ACF that makes the rival an AR(2). Now check the answer key: the loop leaned on the last two days with weights 0.5 and 0.3, and fitting arima(rival, order = c(2, 0, 0)) returns ar1 = 0.4630 and ar2 = 0.2638.","no":"Same shape as the acf call in the previous screen, with pacf in place of acf and rival as the series. So it reads pacf of rival, comma, lag.max equals 8, comma, plot equals FALSE."}
::solution
```r
pacf(rival, lag.max = 8, plot = FALSE)
#> 
#> Partial autocorrelations of series 'rival', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.634  0.265 -0.012 -0.076 -0.017  0.100 -0.054 -0.059 
```

=== step === concept
::eyebrow Go deeper
## References

Four places worth your time if you want to push past what this lesson covers.

- [Forecasting: Principles and Practice, section 9.5 on non-seasonal ARIMA](https://otexts.com/fpp3/non-seasonal-arima.html) - Hyndman and Athanasopoulos, free online. The ACF and PACF ordering rules in their formal form, with the caveats about when they apply.
- [R documentation for acf() and pacf()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - the functions you ran, including what `demean` does and how the confidence band is computed.
- [Robert Nau, identifying the orders of an ARIMA model, Duke University](https://people.duke.edu/~rnau/411arim2.htm) - decades of teaching this to business students, and the best plain-language rules of thumb anywhere for reading the two plots together.
- [NIST/SEMATECH e-Handbook, autocorrelation plot](https://www.itl.nist.gov/div898/handbook/eda/section3/autocopl.htm) - the short, precise engineering-handbook version, useful when you want a definition rather than an explanation.

=== step === complete
## Part 2 complete

You started with Meera wondering how far back a busy run reaches, and you can now measure it. An autocorrelation is an ordinary correlation between a series and a shifted copy of itself, one number per lag, and the whole set of them is the ACF. The dashed band at 1.96 divided by the square root of the number of observations is the line between a bar worth reading and the wobble any finite pile of numbers produces, and with twenty lags on a plot, roughly one crossing is luck.

The two plots work as a pair. An AR series has a tailing ACF and a PACF that cuts off at p, because the PACF strips out what the days in between already explain. An MA series is the mirror: its ACF cuts off at q and its PACF tails off, sometimes flipping sign as it goes. A series that has not been differenced shows a slow straight decay that means nothing except "difference me", and a series differenced once too often shows a large negative bar at lag 1. A spike at lag 7 on daily data is a calendar, not a memory.

You also saw the method fail honestly. Meera's own differenced series had two bars out on both plots, three sensible candidate orders, and an AIC spread of 1.3 points between them, with the true model finishing third. The plots narrowed hundreds of possibilities to three, which is what they are for, and then handed the decision on.

That decision is part 3, "How to choose ARIMA order (p, d, q): a practical guide", where AIC stops being a number at the bottom of the output and becomes the thing doing the choosing. The residual check you just ran comes back in part 4, where it turns into a proper set of diagnostics that a model has to pass before anyone is allowed to forecast with it.
