---
title: "ACF and PACF: how to read the plots for ARIMA orders"
slug: "ARIMA-Mini-2"
description: "Read ACF and PACF plots with confidence: what each bar measures, what the dashed band really means, and how the two shapes give you the ARIMA p and q."
keywords: "ACF and PACF, how to read ACF and PACF plots, ACF plot, PACF plot, autocorrelation, partial autocorrelation, ARIMA orders, identify p and q, acf in R, pacf in R"
mathjax: true
webr: true
date: "2026-09-05"
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
catalog_blurb: "How to read the two plots that give the AR and MA orders."
---

=== step === cover
## ACF and PACF: how to read the plots for ARIMA orders

Reading an ACF and a PACF plot is a skill you can pick up in one sitting, and today we will do exactly that, on a coffee shop's till log.

Here is where the question comes up. The shop has 120 days of cups sold on record. It runs at about 413 cups a day, from a quiet 344 to a busy 523, and the busy days arrive in runs rather than one at a time. Before you can forecast anything you have to settle one thing: does today's number depend only on yesterday's, or on the two or three days before that as well?

Both plots are built out of correlations, the ordinary correlation you already use, applied to the series and a shifted copy of itself. Shift the copy back by one day and you get the lag-1 correlation. Shift it back by two and you get the lag-2 one, and so on down the lags.

Those correlations are worth having because they set two of the three numbers in an ARIMA(p, d, q) model. An ARIMA model predicts each day's value from p of the values before it, the autoregressive or AR terms, and from q of its own past forecast errors, the moving average or MA terms. Picking p and q is a plot-reading job.

There are three steps to the reading, and they are the same on every series.

::widget process-flow {"steps":[{"title":"Plot the ACF and the PACF","sub":"the correlation of the series with its own past, at every lag"},{"title":"See which plot cuts off","sub":"one drops to the level of ordinary noise and stays there, the other fades gradually"},{"title":"Count the bars that clear that noise level","sub":"that count is the order: p from the PACF, q from the ACF"}]}

R does the first of those for you. The other two are rules you apply, not calls you make by eye.

=== step === concept
## The coffee shop's 120 days of cups sold

Start with the series itself.

The till log is a simulated one, built from a rule we get to choose. That is on purpose. When you know how a series was made, you can check every reading against the truth instead of hoping. The rule here is the simplest kind of dependence there is: each day's distance from the usual level is 0.7 of yesterday's distance plus a fresh random shock, and nothing else.

That is what `arima.sim(list(ar = 0.7), n = 120)` draws. Multiplying by 25 and adding 420 puts the numbers on the scale of a real till log, and `round()` turns them into whole cups.

```r
# Build the coffee shop's 120 days of cups sold, then plot them
set.seed(6)
cups <- as.numeric(round(420 + 25 * arima.sim(list(ar = 0.7), n = 120)))

head(cups, 8)
#> [1] 411 469 467 418 469 425 428 396

round(c(mean = mean(cups), lowest = min(cups), highest = max(cups)))
#>    mean  lowest highest 
#>     413     344     523 

plot.ts(cups, main = "Cups sold per day", xlab = "Day", ylab = "Cups sold")
```

`set.seed(6)` fixes the random draws, so your numbers match mine exactly.

Now look at the plot for a moment. The line wanders around a level near 413 and does not trend anywhere, but it does not jump about at random either. It climbs for a stretch, sits high, slides down, then stays low for a while. Those runs are the thing we are about to measure.

=== step === widget
## Autocorrelation is a correlation, measured at a lag

Autocorrelation is a plain correlation with one difference: both columns come out of the same series.

Line the till log up against itself, shifted back by a day. Day 2 pairs with day 1, day 3 with day 2, and so on to the end, which leaves 119 pairs. Then correlate the two columns exactly as you would correlate height against weight.

```r
# Pair every day with the day before it, then correlate the two columns
cups_today     <- cups[-1]     # days 2 to 120
cups_yesterday <- cups[-120]   # days 1 to 119

length(cups_today)
#> [1] 119

round(cor(cups_today, cups_yesterday), 3)
#> [1] 0.695
```

0.695 is the lag-1 autocorrelation of the till log. A busy day really is followed by another busy day more often than not.

Here are those 119 pairs drawn out, with yesterday's cups along the bottom and today's up the side.

::widget chart-plotter {"x":"cups_yesterday","y":"cups_today","geoms":["point","histogram"],"data":[{"x":411,"y":469},{"x":469,"y":467},{"x":467,"y":418},{"x":418,"y":469},{"x":469,"y":425},{"x":425,"y":428},{"x":428,"y":396},{"x":396,"y":402},{"x":402,"y":467},{"x":467,"y":487},{"x":487,"y":453},{"x":453,"y":426},{"x":426,"y":437},{"x":437,"y":402},{"x":402,"y":381},{"x":381,"y":421},{"x":421,"y":417},{"x":417,"y":434},{"x":434,"y":470},{"x":470,"y":450},{"x":450,"y":401},{"x":401,"y":384},{"x":384,"y":384},{"x":384,"y":384},{"x":384,"y":391},{"x":391,"y":406},{"x":406,"y":391},{"x":391,"y":393},{"x":393,"y":447},{"x":447,"y":439},{"x":439,"y":438},{"x":438,"y":431},{"x":431,"y":439},{"x":439,"y":419},{"x":419,"y":451},{"x":451,"y":413},{"x":413,"y":442},{"x":442,"y":397},{"x":397,"y":365},{"x":365,"y":378},{"x":378,"y":394},{"x":394,"y":407},{"x":407,"y":425},{"x":425,"y":397},{"x":397,"y":364},{"x":364,"y":372},{"x":372,"y":392},{"x":392,"y":394},{"x":394,"y":379},{"x":379,"y":371},{"x":371,"y":400},{"x":400,"y":396},{"x":396,"y":392},{"x":392,"y":400},{"x":400,"y":391},{"x":391,"y":392},{"x":392,"y":383},{"x":383,"y":389},{"x":389,"y":426},{"x":426,"y":445},{"x":445,"y":469},{"x":469,"y":519},{"x":519,"y":488},{"x":488,"y":523},{"x":523,"y":492},{"x":492,"y":432},{"x":432,"y":394},{"x":394,"y":439},{"x":439,"y":427},{"x":427,"y":417},{"x":417,"y":399},{"x":399,"y":357},{"x":357,"y":386},{"x":386,"y":426},{"x":426,"y":447},{"x":447,"y":441},{"x":441,"y":393},{"x":393,"y":426},{"x":426,"y":406},{"x":406,"y":396},{"x":396,"y":376},{"x":376,"y":366},{"x":366,"y":384},{"x":384,"y":397},{"x":397,"y":379},{"x":379,"y":389},{"x":389,"y":393},{"x":393,"y":398},{"x":398,"y":418},{"x":418,"y":409},{"x":409,"y":389},{"x":389,"y":383},{"x":383,"y":372},{"x":372,"y":346},{"x":346,"y":396},{"x":396,"y":392},{"x":392,"y":416},{"x":416,"y":418},{"x":418,"y":433},{"x":433,"y":403},{"x":403,"y":429},{"x":429,"y":417},{"x":417,"y":423},{"x":423,"y":417},{"x":417,"y":407},{"x":407,"y":392},{"x":392,"y":397},{"x":397,"y":344},{"x":344,"y":389},{"x":389,"y":392},{"x":392,"y":359},{"x":359,"y":381},{"x":381,"y":416},{"x":416,"y":393},{"x":393,"y":413},{"x":413,"y":443},{"x":443,"y":453},{"x":453,"y":477},{"x":477,"y":486}]}

Every dot is one pair of consecutive days, and the cloud tilts upward. The r printed in its corner reads 0.69, which is the correlation we just computed, rounded to two decimals. Switch to the histogram and the yesterday column is redrawn on its own as a plain distribution of daily cups, with most days landing between 380 and 440 cups.

Now shift by two days instead of one. Day 3 pairs with day 1, day 4 with day 2, and 118 pairs are left.

```r
# The same pairing, but two days apart
round(cor(cups[-(1:2)], cups[1:118]), 3)
#> [1] 0.46
```

0.46, weaker than the one-day link but still clearly there. So the autocorrelation at lag k is the correlation between the series and a copy of itself shifted back k days, and that is all it ever is.

=== step === widget
## The ACF at every lag, and what the dashed lines mean

Doing that pairing by hand at every lag would take all afternoon. `acf()` computes the whole set in one call.

```r
# Print the autocorrelation of the till log at every lag up to 8
acf(cups, lag.max = 8, plot = FALSE)
#> 
#> Autocorrelations of series 'cups', by lag
#> 
#>      0      1      2      3      4      5      6      7      8 
#>  1.000  0.681  0.440  0.271  0.112  0.029  0.017 -0.075 -0.066 
```

Read the lag-1 entry first: 0.681, where `cor()` gave 0.695. Both are the lag-1 autocorrelation of the same series. `cor()` centres each of its two columns on that column's own mean, while `acf()` centres everything on the mean of the whole series and divides by its total spread, which is the standard definition for a time series. The gap lands in the third decimal and it never changes a reading.

Lag 0 is always 1.000. A series matches itself perfectly when it is not shifted at all, so that entry tells you nothing, and on the plot it is the full-height bar at the far left.

Here are the same numbers as a plot.

```r
# Draw the ACF of the till log
acf(cups, lag.max = 20, main = "ACF of daily cups sold")
```

There is one bar per lag, and its height is the correlation at that lag. The two blue dashed lines are what make the plot readable at all, so let us work out where they come from. They sit at

\[ \pm \frac{1.96}{\sqrt{n}} \]

where n is the number of observations. For 120 days that works out at:

```r
# The height a bar has to clear before it counts
1.96 / sqrt(length(cups))
#> [1] 0.1789227
```

That formula is not arbitrary. If a series has no autocorrelation at all, the autocorrelations you compute from it still are not exactly zero; they scatter around zero with a standard error of 1 over the square root of n, which is 0.0913 here. And 1.96 standard errors is the width that holds 95% of a normal distribution. So a bar reaching 0.179 in either direction is one that pure noise produces only 5% of the time.

The curve below is that scatter, measured in standard errors, with the shaded tails showing how often noise alone reaches a given height or goes further. The slider starts at the lag-4 bar of the till log, 0.112, which works out at 1.2 standard errors.

::widget null-distribution {"tails": 2, "start": 1.25, "label": "bar height, in standard errors"}

The readout gives that shaded area as a p-value, which here is how often noise alone reaches the height you have set. H0 is the null hypothesis, the boring case where the series has no autocorrelation at this lag at all, and rejecting it means the bar is taller than noise can account for.

At 1.25 the shaded area reads 0.211. A bar that far out or further turns up in 21 of every 100 noise series, so 0.112 is telling you nothing. Drag right to 1.95 and the area falls to 0.051. One notch further, at 2.00, it reads 0.046 and the verdict flips, because you have crossed 1.96 standard errors, which is exactly where the dashed line is drawn.

[KEY INSIGHT]
A bar inside the band is not a small correlation. It is a correlation no larger than a series with no autocorrelation at all would produce, so there is nothing in it to model. Every reading from here on is one comparison: bar against band, in or out.

=== step === quiz
## Quick check: which bars count as real?

The lag-4 bar of the till log stands at 0.112. It is the correlation of the 116 pairs that sit four days apart, the same kind of pairing the scatter showed one day apart. How should you read it?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It is a moderate correlation, so what happened four days ago still carries real information about today. ::no
- It sits inside the 0.179 band, so it is no larger than a series with no autocorrelation at all would produce. ::ok Exactly. 0.112 is 1.2 standard errors, and the shaded area at that height was 0.211. There is nothing there to model.
- It shows that a busy day four days ago causes a busy day today, weakly. ::no
- It means the dependence in this series reaches four days back. ::no Compare the bar with the band before you do anything else. 0.112 sits inside 0.179, which is where noise puts bars 95 times out of 100, so it is not evidence of a real link, it says nothing about cause, and it does not stretch the dependence out to four days.

=== step === concept
## The PACF: the same correlation with the lags in between removed

The lag-2 autocorrelation has a problem, and the PACF exists to fix it.

Look at what the 0.440 is made of. Today's number depends on yesterday's, and yesterday's on the day before, so part of the two-day link is nothing but the one-day link applied twice. Put a number on that. The lag-1 autocorrelation is 0.6812, and squaring it gives 0.464, which is already a shade more than the 0.4396 actually measured at lag 2.

So how much of lag 2 is direct, over and above what came down that chain? At lag 2 the partial autocorrelation has a closed form:

\[ \frac{r_2 - r_1^2}{1 - r_1^2} \]

where `r1` and `r2` are the autocorrelations at lags 1 and 2, the same two values the code pulls out below. Run it on the unrounded numbers.

```r
# Work out the lag-2 partial autocorrelation by hand
acf_cups <- acf(cups, plot = FALSE)$acf
r1 <- acf_cups[2]                # lag-1 autocorrelation
r2 <- acf_cups[3]                # lag-2 autocorrelation

round(c(r1 = r1, r2 = r2), 4)
#>     r1     r2 
#> 0.6812 0.4396 

round((r2 - r1^2) / (1 - r1^2), 3)
#> [1] -0.046
```

Minus 0.046. Once the lag-1 route is taken out, nothing is left at lag 2, and that small negative value is just noise around zero.

`pacf()` does this at every lag. Past lag 2 there is no tidy formula, so R regresses the series on all k of its own lags and keeps the coefficient on the k-th one. It is the same idea carried further: the direct link at lag k, with every shorter lag held constant.

```r
# Print the partial autocorrelation of the till log at every lag up to 8
pacf(cups, lag.max = 8, plot = FALSE)
#> 
#> Partial autocorrelations of series 'cups', by lag
#> 
#>      1      2      3      4      5      6      7      8 
#>  0.681 -0.046 -0.020 -0.100  0.008  0.052 -0.164  0.088 
```

Lag 2 reads -0.046, the number we just worked out by hand. `pacf()` starts at lag 1, because the partial at lag 0 would always be 1 and there is nothing to strip out of it.

Against the same 0.179 band, only the lag-1 bar clears it. The closest any other bar comes is lag 7 at -0.164, and even that stays inside.

=== step === concept
## Cutting off, tailing off, and how the PACF gives you p

The whole method turns on two words, so let us define them properly.

A plot **cuts off** at some lag when every bar after it falls inside the band and stays inside for good. A plot **tails off** when no single lag ends it: each bar is a little smaller than the last, sometimes shrinking smoothly and sometimes alternating in sign as it shrinks.

The till log gives you one of each, out of the same 120 numbers. Draw them together.

```r
# Draw the ACF and the PACF of the till log side by side
par(mfrow = c(1, 2))
acf(cups, lag.max = 20, main = "ACF of cups")
pacf(cups, lag.max = 20, main = "PACF of cups")
par(mfrow = c(1, 1))
```

The ACF on the left runs 0.681, 0.440, 0.271, 0.112, 0.029. Each bar is smaller than the one before it, and the first to land inside the band is lag 4 at 0.112. Nothing cuts off; it just decays its way in. That is a tail off.

The PACF on the right goes 0.681, then -0.046, and it never leaves the band again. That is a cutoff, after lag 1.

Here is the rule those two shapes serve. An autoregressive process of order p, written AR(p), builds each value out of its own previous p values plus a fresh shock, which is exactly how the till log was made, with p = 1. An AR(p) series always gives a tailing ACF and a PACF that cuts off at lag p.

So you read p straight off the PACF: the last bar outside the band is your p. Here that is lag 1, so p = 1. And because the ACF never cuts off at all, there is no moving average term to add, which makes q = 0.

[NOTE]
With 20 lags on a plot, about one bar in 20 pokes outside the band by chance alone. An isolated bar sitting out on its own with quiet bars either side is a chance spike, not an order. The cutoff you want is the last bar of an unbroken run starting at lag 1.

=== step === concept
## How to read the MA order q off the ACF

The same business runs a kiosk at the station, and its 120 days of sales behave differently.

The kiosk series is built from a moving average rule: each day's distance from its usual level is a fresh shock plus 0.8 of yesterday's shock. A shock here is the part of a day's sales that its own past could not have predicted, which is the forecast error for that day. Nothing carries over from yesterday's sales, only from yesterday's shock.

```r
# Build the station kiosk series from a moving average rule
set.seed(12)
kiosk <- as.numeric(round(96 + 11 * arima.sim(list(ma = 0.8), n = 120)))

head(kiosk, 6)
#> [1] 100  99  77  66  75  90
```

The kiosk series is the same length as the till log, so the band is the same 0.179. Draw both plots.

```r
# Draw the ACF and the PACF of the kiosk
par(mfrow = c(1, 2))
acf(kiosk, lag.max = 20, main = "ACF of kiosk")
pacf(kiosk, lag.max = 20, main = "PACF of kiosk")
par(mfrow = c(1, 1))
```

The shapes have swapped sides. Read them as numbers to be sure.

```r
# Read the two kiosk shapes as numbers
acf(kiosk, lag.max = 4, plot = FALSE)
#> 
#> Autocorrelations of series 'kiosk', by lag
#> 
#>     0     1     2     3     4 
#> 1.000 0.505 0.047 0.022 0.007 

pacf(kiosk, lag.max = 4, plot = FALSE)
#> 
#> Partial autocorrelations of series 'kiosk', by lag
#> 
#>      1      2      3      4 
#>  0.505 -0.280  0.195 -0.134 
```

The ACF is 0.505 at lag 1, then 0.047, 0.022 and 0.007, all well inside 0.179. It cuts off after lag 1. A few bars much further out do cross the band, the tallest of them -0.241 at lag 12, but nine quiet bars separate them from lag 1, so those are the chance spikes rather than a run of dependence.

The PACF does not. It runs 0.505, -0.280, 0.195, -0.134, flipping sign and easing down rather than dropping, and three of those bars are outside the band. Put the two descents side by side: the ACF falls from 0.505 to 0.047 in a single step, to about a tenth of its height, while the PACF takes four lags to work its way inside. Gradual is a tail off, and counting bars on it would give you p = 3 for a series built with no autoregressive term at all.

A moving average process of order q, written MA(q), builds each value from the last q shocks. Its pattern is the mirror image of the AR one: the ACF cuts off at lag q, and the PACF tails off. The kiosk ACF cuts off after lag 1, so q = 1 and p = 0.

[WARNING]
Read p on the PACF and q on the ACF, and never swap them. The two patterns are mirror images of each other, so the plot with the most bars outside the band is often the wrong one to count, exactly as the kiosk PACF just showed. Settle which plot cuts off first, and only then start counting.

=== step === concept
## What if both plots tail off?

Real series are not always one thing or the other.

The airport branch's series has both kinds of behaviour built into it: an autoregressive term carrying 0.6 of yesterday's distance from the usual level, and a moving average term carrying 0.5 of yesterday's shock. It also runs for 180 days rather than 120, which moves the band.

```r
# Build the airport branch series, which carries both kinds of term
set.seed(99)
airport <- as.numeric(round(310 + 20 * arima.sim(list(ar = 0.6, ma = 0.5), n = 180)))

# 180 days, so the band is not the 0.179 we have been using
1.96 / sqrt(length(airport))
#> [1] 0.1460898
```

Always work the band out from the series in front of you. More observations narrow it, because a longer series estimates its correlations more precisely.

```r
# Draw both plots for the airport branch
par(mfrow = c(1, 2))
acf(airport, lag.max = 20, main = "ACF of airport")
pacf(airport, lag.max = 20, main = "PACF of airport")
par(mfrow = c(1, 1))
```

```r
# Read both airport shapes as numbers
acf(airport, lag.max = 5, plot = FALSE)
#> 
#> Autocorrelations of series 'airport', by lag
#> 
#>     0     1     2     3     4     5 
#> 1.000 0.777 0.462 0.289 0.192 0.118 

pacf(airport, lag.max = 5, plot = FALSE)
#> 
#> Partial autocorrelations of series 'airport', by lag
#> 
#>      1      2      3      4      5 
#>  0.777 -0.359  0.232 -0.118  0.035 
```

The ACF fades 0.777, 0.462, 0.289, 0.192, 0.118 and only reaches the band at lag 5. The PACF fades too, 0.777, -0.359, 0.232, -0.118, 0.035, flipping sign as it goes. Its first three bars are outside the band, but they shrink steadily on their way in rather than dropping in all at once, so that is a fade and not a cutoff at lag 3. Neither plot cuts off.

That is a real answer, not a failure to read the plots. Gradual decay in both plots says the series needs an AR term and an MA term together, and that the plots cannot tell you how many of each. What you do then is fit a few small combinations of p and q and compare the fits, rather than counting bars at all.

=== step === concept
## When the ACF hardly decays, difference first

There is one more shape to recognise, and it is the one that stops you before you start.

The business opened a new branch, and its daily cups have been climbing since it opened.

```r
# Build the new branch series and print how slowly its ACF decays
set.seed(3)
newbranch <- as.numeric(round(60 + cumsum(rnorm(120, 0.9, 6))))

c(day1 = newbranch[1], day120 = newbranch[120])
#>   day1 day120 
#>     55    182 

acf(newbranch, lag.max = 5, plot = FALSE)
#> 
#> Autocorrelations of series 'newbranch', by lag
#> 
#>     0     1     2     3     4     5 
#> 1.000 0.977 0.953 0.930 0.906 0.882 
```

0.977, 0.953, 0.930, 0.906, 0.882. That is not a fade, it is a slope, and it would carry on like that for another twenty lags.

Read it for what it is. The branch's sales have no fixed level to return to: they start at 55 cups and end at 182. Any two days near each other sit on the same part of the climb, so their counts correlate strongly however far apart they are. The dependence is not reaching five days back; the level is drifting.

An ACF that decays this slowly means p and q cannot be read yet. A series that drifts like this is called non-stationary, and the fix is to difference it, which means working with the daily change instead of the daily level. The number of differences it takes is the d in ARIMA(p, d, q).

```r
# Take the daily change, then read the ACF of that
d_branch <- diff(newbranch)

acf(d_branch, lag.max = 4, plot = FALSE)
#> 
#> Autocorrelations of series 'd_branch', by lag
#> 
#>      0      1      2      3      4 
#>  1.000 -0.007  0.008  0.028  0.030 
```

One difference and the slope is gone. Every bar it prints sits a rounding error away from zero.

There is a trap on the other side too. Difference a series that has already settled and you put a correlation into it that was never there.

```r
# Difference one time too many and look at lag 1
round(acf(diff(d_branch), lag.max = 2, plot = FALSE)$acf[2], 3)
#> [1] -0.506
```

[WARNING]
A lag-1 autocorrelation near -0.5 means one difference too many. Differencing noise produces that value by construction: each change shares a term with the next change, and it enters with the opposite sign. One difference is usually all you need, and you take a second one only if the slow slide is still in the ACF.

=== step === quiz
## Quick check: name the orders from the two plots

The till log and the kiosk are both 120 days long, so both are read against the same 0.179 band. The till log has one PACF bar outside the band and an ACF that fades gradually. The kiosk has one ACF bar outside the band and a PACF that fades. What are p and q for each?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Till log p = 1 and q = 0; kiosk p = 0 and q = 1. ::ok That is the whole method in one line. The plot that cuts off names the order, and which of the two plots it is decides whether that order is p or q.
- Till log p = 0 and q = 1; kiosk p = 1 and q = 0. ::no
- Both series have p = 1 and q = 0, since each has one bar standing outside the band. ::no
- Neither can be read, because one plot fades gradually in each pair. ::no A fading plot is not a problem, it is half the pattern. You want exactly one plot cutting off and one tailing off, and then you count on the one that cuts off: the PACF gives p, the ACF gives q. Both fading at once is the only case where no order can be read.

=== step === tryit
## Your turn: read the order of the differenced series

`d_branch` holds the 119 daily changes of the new branch. Its ACF was flat at the first four lags, but you have not seen its PACF yet, and 119 values is not 120, so the band has moved.

Work out the band for a series this length, print both plots as numbers, then name p and q.

```r
# d_branch holds the 119 daily changes of the new branch series.
# Work out the band for a series of that length, then print the ACF
# and the PACF as numbers and decide what p and q are.
# Three lines. Press Check when you have them.
```
::check {"regex": "acf[(] *d_branch", "gate": true, "difficulty": "beginner", "ok": "Right: the band is 0.180 for 119 values, and every bar in both plots sits inside it. So p = 0 and q = 0, and the one difference took out everything there was to model.", "no": "Three lines. Start with `1.96 / sqrt(length(d_branch))` for the band, then `acf(d_branch, lag.max = 4, plot = FALSE)`, then the same line with `pacf()` in place of `acf()`."}
::solution
```r
# The band for 119 values, then both plots as numbers
1.96 / sqrt(length(d_branch))
#> [1] 0.1796729

acf(d_branch, lag.max = 4, plot = FALSE)
#> 
#> Autocorrelations of series 'd_branch', by lag
#> 
#>      0      1      2      3      4 
#>  1.000 -0.007  0.008  0.028  0.030 

pacf(d_branch, lag.max = 4, plot = FALSE)
#> 
#> Partial autocorrelations of series 'd_branch', by lag
#> 
#>      1      2      3      4 
#> -0.007  0.008  0.028  0.031 
```

The band is 0.180, and every bar in both plots sits inside it. Neither plot has anything to cut off, so p = 0 and q = 0. The single difference took out all the structure there was, and what is left is noise.

=== step === concept
## References

- [Forecasting: Principles and Practice, section 2.8 Autocorrelation](https://otexts.com/fpp3/acf.html) - Hyndman and Athanasopoulos, 3rd edition. The definition of the autocorrelation function and of the significance band, with worked examples.
- [Forecasting: Principles and Practice, section 9.5 Non-seasonal ARIMA models](https://otexts.com/fpp3/non-seasonal-arima.html) - Hyndman and Athanasopoulos, 3rd edition. The cutoff and tail-off rules for reading p and q, including when they do not apply.
- [Identifying the orders of AR and MA terms in an ARIMA model](https://people.duke.edu/~rnau/411arim3.htm) - Robert Nau, Duke University. A practitioner checklist for order identification, including under and over differencing.
- [acf and pacf, the stats package reference](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - R Core Team. What the two functions compute, and the arguments used here.
- [Time Series Analysis: Forecasting and Control, 5th edition](https://www.wiley.com/en-us/9781118675021) - Box, Jenkins, Reinsel and Ljung, Wiley 2015. Chapter 6 is where the identification method comes from.

=== step === complete
## Quick recap

You read four series today, and never once judged a bar by eye. To summarise:

- A bar in either plot is a correlation between the series and its own past at that lag. The ACF measures it directly, and the PACF measures it with the shorter lags taken out.
- The dashed band is 1.96 divided by the square root of the number of observations: 0.179 for 120 days, 0.180 for 119. Work it out for every series, and treat any bar inside it as noise.
- p comes off the PACF and q comes off the ACF, and the order is the last bar outside the band on whichever plot cuts off. The till log gave p = 1 and q = 0; the kiosk gave p = 0 and q = 1.
- When both plots fade gradually, no order can be read from them, and you fit a few small combinations and compare the fits instead.
- When the ACF barely decays, difference the series and read the plots again. Stop as soon as the slope is gone, because a lag-1 bar near -0.5 means you went one difference too far.

So the next time a pair of these plots lands in front of you, you have a rule for every shape they can take, rather than an opinion.
