---
title: "Estimation and the Bootstrap Lesson 6: Estimating error by leaving one out"
catalog_blurb: "Drop one observation at a time to see which one is driving your estimate."
description: "Build the jackknife by hand in R, recompute a statistic with one observation removed each time, and use the spread to find your most influential point."
keywords: "jackknife, leave-one-out resampling, standard error, bootstrap, influential observation, leverage, Cook's distance, R statistics"
post_type: "LESSON"
curriculum_id: "4.20.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-estimation"
course_title: "Estimation and the Bootstrap"
course_lesson: "6"
course_total: "7"
course_landing: "Estimation-and-the-Bootstrap-Course.html"
course_next: "Standard-Errors-for-Transformed-Estimates.html"
course_prev: "Two-Bootstrap-Intervals-and-When-They-Differ.html"
---

=== step === cover
## Estimating error by leaving one out

Today let's look at a way to measure a statistic's error without a formula for it at all: drop one observation, recompute the statistic, and do that once for every observation you have.

Nine calls hit an API during a load test, and their round-trip times, in milliseconds, were logged as they came back: 42, 39, 45, 41, 44, 40, 43, 42, 95. Eight of them sit between 39 and 45. The ninth, 95, came back after the server paused for garbage collection.

The strip below stands for those nine calls, one badge per call, numbered in the order just listed. Press "Draw again" and watch R resample all nine with replacement: some calls land more than once in a draw, and some get left out entirely.

::widget bootstrap-sample {"n": 9, "seed": 2026, "tail": "Call 9 is the one at 95 milliseconds, after a garbage collection pause. Whenever it lands twice or more in a draw, it pulls the mean of that resample well above the rest."}

That kind of random resampling is one way to measure how much a statistic can vary. Today's method is different. It removes exactly one call at a time, in a fixed order, with no randomness at all.

=== step === concept
## The jackknife: recompute the statistic, one observation short

The method you just watched pick calls at random has a name: the bootstrap. The jackknife works differently. Instead of resampling at random, it removes exactly one observation, recomputes the statistic on what is left, puts that observation back, and moves to the next one.

Do that once for every observation and you get as many recomputed values as you started with. For the nine response times, that means computing the mean nine times, each time with one call left out.

```r
# Nine API response times, and the leave-one-out mean after dropping each one
x <- c(42, 39, 45, 41, 44, 40, 43, 42, 95)
n <- length(x)
theta_hat <- mean(x)
round(theta_hat, 4)
theta_i <- sapply(1:n, function(i) mean(x[-i]))
theta_i
#> [1] 47.8889
#> [1] 48.625 49.000 48.250 48.750 48.375 48.875 48.500 48.625 42.000
```

`theta_hat`, the mean of all nine response times, is 47.8889. `theta_i` is built by `sapply(1:n, function(i) mean(x[-i]))`: for each position `i` from 1 to 9, it drops call `i` and averages the eight that are left.

Walk through the first entry by hand. Drop call 1, the 42 ms response, and average the remaining eight response times: 39, 45, 41, 44, 40, 43, 42, 95. That comes out to 48.625, the first number in `theta_i`. Doing that eight more times, once per call, produces the full set of nine values above.

Call those nine values the jackknife replicates of the mean: one number for every observation, each one the mean of the data with exactly that observation missing.

Notice the last entry, 42.000. That is what happens when you drop call 9, the 95 ms response: the remaining eight ordinary response times average to 42, well below theta_hat's 47.8889. Every other drop barely moves the mean at all. Hold on to that difference; it matters in a few steps.

=== step === concept
## Turning the replicates' spread into a standard error

Compute the jackknife standard error from the spread of those nine replicates, and set it beside the classical formula you already know, to see whether the two agree before trusting the jackknife on anything new.

```r
# The jackknife standard error from the replicates' spread, and the classical formula for comparison
theta_bar <- mean(theta_i)
se_jack <- sqrt((n - 1) / n * sum((theta_i - theta_bar)^2))
se_classical <- sd(x) / sqrt(n)
round(c(theta_bar = theta_bar, se_jack = se_jack, se_classical = se_classical), 4)
#>    theta_bar      se_jack se_classical 
#>      47.8889       5.9218       5.9218 
```

`theta_bar`, the average of the nine jackknife replicates themselves, comes out to 47.8889. That matches `theta_hat` from the last step exactly, which makes sense: averaging nine numbers that were each built by dropping one observation and re-averaging gets you back to the same overall mean.

`se_jack` reads the spread of those nine replicates around `theta_bar`: `sqrt((n - 1) / n * sum((theta_i - theta_bar)^2))`. The `(n - 1) / n` factor corrects for a real understatement.

Each `theta_i` only dropped one observation out of nine, so on its own its spread is smaller than how much the full mean would actually move under a genuinely new sample. Multiplying by `(n - 1) / n` scales that spread back up to the right size. The result is 5.9218.

Compare that to `se_classical`, the standard error formula you already know: `sd(x)` divided by the square root of `n`, also 5.9218. Two completely different routes, one built from nine recomputed means and one built from a single formula, land on exactly the same number. That agreement is the check worth having before using the jackknife for anything the classical formula cannot already handle.

=== step === widget
## Resampling the same nine calls at random, again

Here is that same random resampling again, on the same nine response times, so the contrast with the nine fixed replicates you just computed stays fresh.

::widget bootstrap-sample {"n": 9, "seed": 61, "tail": "Watch call 9, the 95 millisecond response. Some draws skip it completely, some pick it two or three times, and the mean of that resample moves a lot depending on which happens."}

Press "Draw again" a few times. Every draw looks a little different. Sometimes call 9 is missing altogether, sometimes it shows up two or three times, and the resample's mean moves depending on which happens.

Compare that to the nine `theta_i` values two steps back. There were exactly nine of them, the same nine every single time the code runs, because the jackknife removes one observation on purpose rather than leaving it to chance which ones get picked.

=== step === concept
## Setting the jackknife against the bootstrap, on the same data

Run an actual bootstrap on these same nine response times, and read its standard error beside the jackknife's from two steps back.

```r
# Bootstrap standard error of the mean, 2000 resamples of the same nine response times
set.seed(2026)
boot_means <- replicate(2000, mean(sample(x, 9, replace = TRUE)))
se_boot <- sd(boot_means)
round(c(se_jack = se_jack, se_boot = se_boot), 4)
#> se_jack se_boot 
#>  5.9218  5.7721 
```

`set.seed(2026)` fixes R's random number generator so the resamples are the same every time this code runs. `sample(x, 9, replace = TRUE)` draws nine calls with replacement from the nine response times, the same mechanic the widget just showed, and `replicate(2000, ...)` repeats that 2000 times, keeping the mean from each repeat. `sd(boot_means)` reads the spread of those 2000 means as `se_boot`: 5.7721.

That sits close to `se_jack`'s 5.9218, but it is not identical, and the reason is worth naming. The jackknife is exhaustive for the mean: there are only nine ways to drop one observation out of nine, so `theta_i` already covers every single one of them. The bootstrap is a random approximation. Its 2000 resamples only sample from the enormous number of ways nine calls can be drawn with replacement, so `se_boot` wobbles a little depending on the seed.

Run the bootstrap again with more resamples and `se_boot` would creep closer to 5.9218. Run the jackknife again on this same data and `se_jack` would not move at all, because there is nothing left in it to randomize.

=== step === concept
## Reading the replicates for the one observation driving the estimate

Those same nine `theta_i` values answer a second question too: which one call is really carrying the mean. Rank them by how far dropping each one moves the estimate.

```r
# Rank the jackknife replicates by how far each one moved the mean
delta <- round(abs(theta_i - theta_hat), 4)
data.frame(response_ms = x, theta_i = round(theta_i, 3), delta = delta)
#>   response_ms theta_i  delta
#> 1          42  48.625 0.7361
#> 2          39  49.000 1.1111
#> 3          45  48.250 0.3611
#> 4          41  48.750 0.8611
#> 5          44  48.375 0.4861
#> 6          40  48.875 0.9861
#> 7          43  48.500 0.6111
#> 8          42  48.625 0.7361
#> 9          95  42.000 5.8889
```

`delta` measures the distance each `theta_i` sits from `theta_hat`, 47.8889. The bigger that gap, the more the mean changes when that one call goes missing.

Row 9, the 95 ms call, has a delta of 5.8889, far larger than any other row. Row 2, the 39 ms call, has the next largest delta at 1.1111, less than a fifth of row 9's. Every other call moves the mean by under one millisecond.

So the same nine numbers that gave a standard error three steps back also point straight at the observation driving the estimate: call 9, the 95 ms response after the garbage-collection pause. Drop it, and the mean of the remaining eight response times falls by almost six milliseconds. No other single call comes close.

=== step === widget
## Leverage and Cook's distance: the same influential point, now in a regression

The same idea, one observation dominating an estimate, shows up in a regression line too, under its own name: leverage.

::widget leverage-point {}

This widget fits a straight line through seven ordinary points and one point far to the right. Drag that far point's value up and down with the slider, and watch the fitted line pivot toward it, while the dashed line, fit without that point, barely moves. The readout below the chart reports Cook's distance, a single number that grows as that one point pulls the fitted line further from where it would sit without it.

Dragging that far point is the same act as dropping call 9 from the response times. Both ask the same question: how much does this one observation change the answer, just for a line's slope instead of a mean.

=== step === concept
## Why the median breaks the formula, and the extreme case that proves it

Run the exact same jackknife recipe, but on the median instead of the mean, and see what happens to the nine replicates.

```r
# Jackknife the median instead of the mean, on the same nine response times
theta_i_med <- sapply(1:n, function(i) median(x[-i]))
theta_i_med
se_jack_median <- sqrt((n - 1) / n * sum((theta_i_med - mean(theta_i_med))^2))
set.seed(2026)
boot_medians <- replicate(2000, median(sample(x, 9, replace = TRUE)))
se_boot_median <- sd(boot_medians)
round(c(se_jack_median = se_jack_median, se_boot_median = se_boot_median), 4)
#> [1] 42.5 42.5 42.0 42.5 42.0 42.5 42.0 42.5 42.0
#> se_jack_median se_boot_median 
#>         0.7027         2.2791 
```

Look closely at `theta_i_med`. It takes only two distinct values, 42.5 and 42, instead of nine different numbers the way the mean's `theta_i` did.

Dropping calls 1, 2, 4, 6 or 8 leaves the median at 42.5. Dropping calls 3, 5, 7 or 9 leaves it at 42. Which call gets dropped barely matters, as long as it sits on the same side of the middle of the sorted data.

Feed those nine replicates into the same `se_jack` formula from earlier and you get `se_jack_median`, 0.7027. But a real bootstrap on the median, 2000 resamples recomputing the median each time, gives `se_boot_median`, 2.2791, over three times larger. The two methods, which nearly agreed for the mean, now disagree by a factor of three.

Push the comparison further. Drop the 95 ms call out of the data entirely, and jackknife the median of what is left.

```r
# Drop the outlier call entirely, then jackknife the median of the 8 remaining response times
x8 <- x[-9]
x8
theta_i_med8 <- sapply(1:8, function(i) median(x8[-i]))
theta_i_med8
se_jack_median8 <- sqrt((8 - 1) / 8 * sum((theta_i_med8 - mean(theta_i_med8))^2))
set.seed(2026)
boot_medians8 <- replicate(2000, median(sample(x8, 8, replace = TRUE)))
se_boot_median8 <- sd(boot_medians8)
round(c(se_jack_median8 = se_jack_median8, se_boot_median8 = se_boot_median8), 4)
#> [1] 42 39 45 41 44 40 43 42
#> [1] 42 42 42 42 42 42 42 42
#> se_jack_median8 se_boot_median8 
#>          0.0000          0.8518 
```

`x8` holds the eight ordinary response times, with call 9 removed before any jackknifing starts. `theta_i_med8` drops one of those eight at a time and recomputes the median of the remaining seven. Every single one of those eight leave-one-out medians comes out to exactly 42, not close to 42, equal to it, to every decimal place R prints.

Feed eight identical replicates into `se_jack`, and the summed squared deviation from their own mean is zero, because there is no deviation to sum: `se_jack_median8` is exactly 0.0000. A real bootstrap on the same eight values disagrees. `se_boot_median8`, from 2000 resamples of `x8`, comes out to 0.8518, a real, nonzero spread.

Here is why the two formulas split so badly. The mean responds to every observation by some amount: drop any one of the nine response times and the mean shifts, by a different amount each time, which is exactly what let `theta_i` take nine distinct values.

The median only responds to which side of the middle an observation sits on. Drop one that is not near the middle at all, and the median does not move even a little. Eight response times where every single drop leaves the same median behind is the most extreme version of that: no two of the eight replicates ever differed, so the spread the jackknife formula depends on was never there to measure.

[KEY INSIGHT]
A jackknife standard error of exactly zero is not proof that a statistic has no error. It is a sign that this particular way of perturbing the data, dropping one observation at a time, never moved the statistic at all. The median's true sampling error is real, 0.8518 by the bootstrap's measure; the jackknife simply had nothing left to read it from.

=== step === quiz
## Quick check: why the jackknife failed on the median

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The median moves by a fixed jump or not at all when one observation is dropped, instead of moving smoothly in proportion to how unusual the dropped observation is, and the jackknife's formula assumes smooth movement. ::ok Exactly. The nine leave-one-out means took nine different values because the mean responds to every observation by some amount. The nine leave-one-out medians took only two values, and on the eight ordinary response times every one of the eight came out identical, so the spread the formula reads as error was never really there.
- The sample was too small for the jackknife to work on the median. ::no The mean's jackknife ran on the very same nine and eight response times and matched the classical formula exactly both times, so sample size was not what broke the median's case.
- The jackknife calculation has random noise in it, so re-running it would give a different answer. ::no The jackknife drops the same observations in the same order every time; it is deterministic, unlike the bootstrap seen in the last step. Re-running se_jack_median8 would give exactly 0 again, not a different number.

=== step === quiz
## Quick check: deciding whether to trust a jackknife standard error

Put the mean and the median side by side. For the mean, se_jack matched se_classical exactly at 5.9218, and the nine leave-one-out replicates took nine different values. For the median, se_jack_median started at 0.7027 against a 2.2791 bootstrap, then on the eight ordinary response times dropped to exactly 0 while the bootstrap still read 0.8518.

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Whether the jackknife is trustworthy depends on whether the statistic moves smoothly when one observation is dropped, which you can check by counting how many distinct values the leave-one-out replicates actually take, the way the mean's nine and the median's one or two just did. ::ok Exactly. Nine distinct replicates, like the mean gave, is the smooth case the jackknife's formula was built for. One or two distinct replicates, like the median gave, is the sign to reach for a bootstrap instead.
- A bigger sample always fixes the jackknife's standard error. ::no The eight-point case was smaller than the nine-point case and broke harder, falling all the way to zero, so a bigger sample is not what decides this.
- Whichever method, jackknife or bootstrap, gives the smaller number is the more accurate one. ::no For the mean, the two nearly agreed, so neither was obviously the smaller winner. For the median, the jackknife's smaller number, 0.7027 and then 0, was the wrong one both times, not the better one.

=== step === tryit
## Your turn: jackknife a new statistic and find its influential point

A small delivery service logs the time, in minutes, for its last seven orders: 12, 11, 13, 12, 14, 11, 40. One order took far longer than the rest. Jackknife the mean of these seven delivery times the same way you jackknifed the response times, then find which order is most responsible for that mean.

```r
# times holds 7 delivery times, in minutes, for the service's last 7 orders
times <- c(12, 11, 13, 12, 14, 11, 40)

# Write the three lines below, reusing the recipes from earlier steps:
# theta_i     <- the jackknife replicates of the mean of times
# se_jack     <- the jackknife standard error, from theta_i
# influential <- which position moves the mean the most when dropped
```
::check {"regex": "sapply[(][\\s\\S]*?mean[(][\\s\\S]*?\\x5B-i\\x5D[\\s\\S]*?sqrt[(][\\s\\S]*?sum[(][\\s\\S]*?(which\\.max|abs)", "gate": true, "difficulty": "intermediate", "ok": "Right: dropping the 40-minute order moves the mean by about 3.98, more than four times further than any other drop, so that order is carrying this mean the same way call 9 carried the response-time mean.", "no": "Reuse the recipe from two steps back for theta_i: sapply over 1:length(times), dropping index i with the -i index inside mean(), then mean() on the rest. Reuse the recipe from three steps back for se_jack: sqrt of (n-1)/n times the summed squared deviations from the mean of the replicates themselves. Then rank with which.max(abs(theta_i - mean(times)))."}
::solution
```r
# Jackknife the mean of the 7 delivery times and find the influential order
m <- length(times)
theta_i <- sapply(1:m, function(i) mean(times[-i]))
theta_i
#> [1] 16.83333 17.00000 16.66667 16.83333 16.50000 17.00000 12.16667
se_jack <- sqrt((m - 1) / m * sum((theta_i - mean(theta_i))^2))
round(se_jack, 4)
#> [1] 3.9966
which.max(abs(theta_i - mean(times)))
#> [1] 7
```

Position 7, the 40-minute order, is the one `which.max` names. Dropping it moves the mean from 16.1429 down to 12.1667, a swing of almost 4 minutes, more than four times further than dropping any of the six ordinary deliveries. That is the same diagnosis call 9 got in the response-time data, just read off a different running example.

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Notes on Bias in Estimation](https://doi.org/10.2307/2332914) - Quenouille, M.H. (1956), *Biometrika*, 43(3-4), 353-360. The paper that introduced dropping one observation at a time to estimate and correct bias.
- Tukey, J.W. (1958). Bias and Confidence in Not-quite Large Samples. *Annals of Mathematical Statistics*, 29(2), 614. Named the method the jackknife, and extended it from correcting bias to estimating a standard error.
- [The Jackknife - A Review](https://doi.org/10.1093/biomet/61.1.1) - Miller, R.G. (1974), *Biometrika*, 61(1), 1-15. Works out exactly which statistics the jackknife's standard error can be trusted for, and which it cannot.
- [An Introduction to the Bootstrap](https://doi.org/10.1201/9780429246593) - Efron, B. and Tibshirani, R.J. (1993), Chapman and Hall/CRC. Sets the jackknife and the bootstrap side by side and compares what each one costs and delivers.

=== step === complete
## Quick recap

- The jackknife drops one observation at a time and recomputes the statistic. Nine response times gave nine leave-one-out means, `theta_i`.
- Their spread, read through `se_jack = sqrt((n - 1) / n * sum((theta_i - theta_bar)^2))`, gave 5.9218, matching the classical formula `sd(x) / sqrt(n)` exactly.
- The same nine numbers, ranked by how far each one moved the mean, also found the influential observation: dropping the 95 ms call moved the mean by 5.8889, over five times further than any other drop.
- Run on the median instead, the jackknife broke. Its leave-one-out replicates took only two distinct values on the nine response times, and on the eight ordinary ones every single replicate was 42, reporting a standard error of exactly zero while the bootstrap still measured 0.8518.
- Whether to trust a jackknife standard error comes down to one check: how many distinct values the leave-one-out replicates actually take. Many distinct values, the way the mean's nine did, means the statistic moves smoothly and the jackknife can be trusted. One or two, the way the median's did, means it cannot.

Next time one observation looks like it might be carrying your estimate, you have a way to check it directly: drop it, recompute, and read the numbers that come back.
