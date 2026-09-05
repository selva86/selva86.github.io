---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not the range 95% of your data falls in. Build 100 intervals from repeated samples and count how many catch the true mean."
keywords: "confidence intervals, what a confidence interval means, 95% confidence interval, confidence interval interpretation, coverage, confidence interval in R, t.test confidence interval, bootstrap confidence interval"
mathjax: true
webr: true
date: "2026-09-05"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "3"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-2"
course_next: ""
curriculum_id: "0.0.3"
lesson_access: "windowed"
catalog_blurb: "What the 95% in a confidence interval counts, and what it never claims."
---

=== step === cover
::eyebrow Inference from Zero
## Confidence intervals: what they really mean

Today let's work out what the 95% in a confidence interval is actually counting.

Say you run a pizza shop and you want to know how long a delivery takes on average. So you record the time from order to doorstep for 30 orders on one night.

Those 30 times average out at 26.57 minutes. Run them through R's one-sample t-test and you get a 95% confidence interval of 22.84 to 30.30 minutes.

Two readings of that 95% are common. The first is that 95% of deliveries take between 22.84 and 30.30 minutes. The second is that the shop's true average has a 95% probability of being in that range.

Both are wrong, and the second one is the reading almost everybody carries around, including people who report intervals for a living.

That 95% is a claim about a procedure rather than about your one interval, and a claim about a procedure is something you can check. So we will run that procedure over and over and count how often it works.

::widget process-flow {"steps":[{"title":"Simulate 30 delivery times","sub":"draw them from a population whose average we set to 26 minutes, so the true answer is known"},{"title":"Build a 95% interval from each of 100 nights","sub":"each night of 30 orders produces exactly one interval"},{"title":"Count the intervals containing 26","sub":"the share of them that contain the true average is what the 95% refers to"}]}

Those three moves are the whole check, and the count at the end is the definition we are after.

=== step === concept
## How to compute a confidence interval in R

Let's make the 30 delivery times first, because every number from here on comes out of them.

The times are simulated on purpose. `rnorm(30, mean = 26, sd = 10)` draws 30 values from a population whose average is exactly 26 minutes, and `round()` turns each one into whole minutes. Since we set that population average ourselves, we know the true answer while we work. Real data never gives you that.

Press Run.

```r
# Record one night of delivery times and get the 95% confidence interval for the average
set.seed(176)
deliveries <- round(rnorm(30, mean = 26, sd = 10))
deliveries
#>  [1] 11 26 31 16 34 34 16 30 33 22 28 37 35 25 53 11 36 17 25 33 25 33 11 20 32
#> [26] 33 17 37 10 26

c(mean = mean(deliveries), sd = sd(deliveries))
#>      mean        sd
#> 26.566667  9.992008

t.test(deliveries)
#>
#> 	One Sample t-test
#>
#> data:  deliveries
#> t = 14.563, df = 29, p-value = 7.186e-15
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  22.83559 30.29774
#> sample estimates:
#> mean of x
#>  26.56667
```

The night's times run from a 10 minute delivery to a 53 minute one. The 30 times average 26.57 minutes and their standard deviation is 9.99 minutes, which is how far individual deliveries typically sit from that average.

`t.test()` prints more than we asked for. The `t` and the `p-value` on that line are testing whether the average delivery time is zero minutes, which is not a question anybody has about pizza, so ignore them here.

The two lines that matter are the sample estimate at the bottom, 26.56667, and the interval above it, 22.83559 to 30.29774. Round them and you have 26.57 minutes with a 95% confidence interval of 22.84 to 30.30 minutes.

That interval is an estimate of the shop's average delivery time. It is not a summary of the 30 times we recorded, and telling those two apart is most of the work in this topic.

=== step === concept
## Where the two ends of the interval come from

Both ends come out of one formula, and it is worth building by hand once so nothing about it stays mysterious.

\[ \bar{x} \;\pm\; t_{0.975,\,n-1} \times \frac{s}{\sqrt{n}} \]

Read it left to right. Start at the sample average, then step out the same distance on either side. That distance is a critical value from the t distribution multiplied by the standard error of the mean.

The standard error is the sample standard deviation divided by the square root of the sample size. It measures how much the sample average itself moves from one night of 30 orders to the next, which is a completely different quantity from how much single deliveries vary. The critical value comes from the t distribution, which describes how far a sample average usually falls from the true average, counted in those standard errors.

```r
# Rebuild the same interval by hand from the average, the critical value and the standard error
n      <- length(deliveries)
se     <- sd(deliveries) / sqrt(n)
tcrit  <- qt(0.975, df = n - 1)
margin <- tcrit * se

round(c(se = se, tcrit = tcrit, margin = margin), 4)
#>     se  tcrit margin
#> 1.8243 2.0452 3.7311

round(c(lower = mean(deliveries) - margin, upper = mean(deliveries) + margin), 3)
#>  lower  upper
#> 22.836 30.298
```

So the standard error is 1.8243 minutes. The sample average of 26.57 shifts by roughly that much from night to night, while single deliveries typically sit 9.99 minutes from it. Dividing by the square root of 30 is what separates the two.

`qt(0.975, df = 29)` returns 2.0452. That is how many standard errors you step out to cover the middle 95% of a t distribution with 29 degrees of freedom, and 29 is n minus 1 because the average was estimated from the same 30 numbers. Multiply by the standard error and the margin is 3.7311 minutes.

Move 3.7311 either side of 26.567 and you land on 22.836 and 30.298, which is exactly what `t.test()` printed.

Only one piece of that formula responds to the confidence level, and it is the critical value.

```r
# Ask the same 30 times for a 99% interval instead
qt(0.995, df = 29)
#> [1] 2.756386

as.numeric(t.test(deliveries, conf.level = 0.99)$conf.int)
#> [1] 21.53824 31.59509
```

At 99% the critical value climbs from 2.0452 to 2.7564, so the same 30 delivery times now give 21.54 to 31.60 minutes. Nothing about the recorded times changed. We asked for a procedure that succeeds more often, and the cost of that is a wider interval.

The other two pieces move for their own reasons. A noisier night's times raise `s` and widen the interval. More orders raise `n` and, through that square root, narrow it.

=== step === widget
## An interval for the average is not the range of single deliveries

Here is the misreading worth clearing up first. The interval 22.84 to 30.30 is not where delivery times land.

Let's count how many of the 30 recorded times actually fall inside it, and then find the range that does hold the middle 95% of them.

```r
# Count the recorded times inside the interval, then find the middle 95% of the times
ci <- t.test(deliveries)$conf.int

sum(deliveries >= ci[1] & deliveries <= ci[2])
#> [1] 7

quantile(deliveries, c(0.025, 0.975))
#>   2.5%  97.5%
#> 10.725 41.400
```

Only 7 of the 30 deliveries fall inside 22.84 to 30.30. The other 23 do not. The middle 95% of the recorded times runs from 10.7 to 41.4 minutes, more than four times as wide as the confidence interval. If the interval were a range for single deliveries, it would have to look like that second one.

So there are two ranges here answering two questions: where the average sits, and where one delivery sits. They also respond differently to collecting more data, and that difference is easiest to see by moving a slider.

The picture below carries its own x and y data rather than the delivery times. Read its y values as the delivery times and its green band as the interval for their average, the same object as 22.84 to 30.30. The orange band is the range where one new observation lands, the same object as 10.7 to 41.4. Drag the sample size and watch the two bands separate.

::widget regression-intervals {}

At n = 20 the widget reports a confidence half-width of plus or minus 0.30 and a prediction half-width of plus or minus 1.35. Push n up to 300 and the confidence half-width collapses to plus or minus 0.08 while the prediction half-width barely moves, sitting at plus or minus 1.34.

That collapse is the same square root of n that sits in the standard error. Order more pizzas and you pin down the average as tightly as you like. But you do nothing at all about how much one delivery differs from the next, because that spread belongs to the deliveries and not to your sample size.

[KEY INSIGHT]
A confidence interval is an interval for a population quantity, here the shop's average delivery time. The range where a single new delivery lands is a different interval. It is much wider, and no amount of extra data will shrink it to nothing.

=== step === quiz
## Quick check: what does 22.8 to 30.3 describe?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- 95% of deliveries take between 22.84 and 30.30 minutes. ::no
- It is the range that holds 95% of the 30 times we recorded that night. ::no
- It is a range of plausible values for the shop's average delivery time. ::ok That is the one. The interval estimates a single number, the shop's average delivery time, and 22.84 to 30.30 is the set of averages these 30 orders are consistent with.
- It runs from the fastest delivery of the night to the slowest. ::no Each of those reads the interval as a summary of the deliveries, and it is an estimate of their average instead. Only 7 of the 30 recorded times fall inside 22.84 to 30.30, the middle 95% of them runs from 10.7 to 41.4 minutes, and the night's fastest and slowest deliveries were 10 and 53 minutes.

=== step === concept
## 100 nights, 100 intervals: how many contain 26 minutes

Now we can go after the 95% itself.

The claim attaches to the procedure that produced 22.84 to 30.30, not to that one interval. So run the procedure again. And again. One night gives 30 orders, 30 orders give one interval, and because we set the population average to 26 minutes ourselves, we can look at each interval and ask a plain yes or no question: is 26 inside it?

`replicate()` runs the whole thing 100 times and keeps the two ends from each night.

```r
# Build one 95% interval from each of 100 simulated nights and count how many contain 26
set.seed(1)
nights <- replicate(100, t.test(round(rnorm(30, mean = 26, sd = 10)))$conf.int)
caught <- nights[1, ] <= 26 & nights[2, ] >= 26

sum(caught)
#> [1] 95

mean(nights[2, ] - nights[1, ])
#> [1] 7.673427
```

95 of the 100 intervals contain 26 minutes. Five do not. Their average width is 7.67 minutes, close to the 7.46 minute width of the interval we built from the recorded times.

Here are all 100 of them at once.

```r
# Draw the 100 intervals with the true average marked and the misses in red
plot(NULL, xlim = range(nights), ylim = c(1, 100),
     xlab = "95% interval for the average delivery time (minutes)",
     ylab = "Night",
     main = "100 nights, one 95% interval from each")
segments(nights[1, ], 1:100, nights[2, ], 1:100,
         col = ifelse(caught, "grey70", "red"), lwd = 2)
abline(v = 26, lwd = 2, lty = 2)
```

Every horizontal line is one night's interval and the dashed vertical line is the true average, 26 minutes. The lines sit at different places because each night's 30 orders are different, which moves the sample average left or right, and each night's spread is different, which makes the line longer or shorter. Five lines are red because they finish before the dashed line or start after it.

A count of 95 out of 100 could itself be a fluke, so let's run 2,000 nights.

```r
# Repeat the same procedure over 2,000 nights and read the share that contain 26
set.seed(1)
big <- replicate(2000, t.test(round(rnorm(30, mean = 26, sd = 10)))$conf.int)

mean(big[1, ] <= 26 & big[2, ] >= 26)
#> [1] 0.9475

mean(big[2, ] - big[1, ])
#> [1] 7.438035
```

Over 2,000 nights, 0.9475 of the intervals contained 26 minutes. That number is the 95%. It is the share of intervals, built this way from repeated samples, that contain the true average.

[KEY INSIGHT]
The 95% is a hit rate of the procedure, not a property of any one interval it produces. Run it on fresh samples over and over and about 95 in every 100 intervals will contain the true value. That share is called the coverage.

=== step === concept
## Why no probability attaches to the interval you computed

That leaves the five intervals that missed, and they are the ones worth looking at closely.

```r
# List the intervals that missed 26 and which side of it each one fell on
missed <- which(!caught)

data.frame(
  night = missed,
  lower = round(nights[1, missed], 2),
  upper = round(nights[2, missed], 2),
  side  = ifelse(nights[2, missed] < 26, "below 26", "above 26")
)
#>   night lower upper     side
#> 1    22 17.84 25.69 below 26
#> 2    48 29.06 35.74 above 26
#> 3    61 27.03 32.97 above 26
#> 4    64 18.34 25.46 below 26
#> 5    84 18.38 24.95 below 26
```

Nights 22, 64 and 84 produced intervals lying entirely below 26 minutes, and nights 48 and 61 produced intervals lying entirely above it. Take night 84, at 18.38 to 24.95. There is no sense in which that interval contains 26 minutes with probability 0.95. It simply does not contain 26.

Two things are in play here and only one of them is random. The true average is pinned at 26 minutes for all 100 nights. What moves is the sample, and therefore the interval built from it. So the moment you compute an interval, the sampling is already done: yours either contains the true average or it does not, and you do not get told which.

This is why "there is a 95% probability the shop's average is between 22.84 and 30.30" is the wrong sentence. It puts the randomness on the average, as though the average were the thing that changes from night to night. The 95% belongs to the procedure that produced the interval.

There is an interval that carries a probability like that, and it is a different object. A **credible interval** is computed from the data together with a prior distribution over the average, which is what you took that average to be before you collected any data. It answers "given what I saw, where is the average", while a confidence interval answers "how often does this procedure catch the truth". People reach for the credible interval's reading while holding a confidence interval, and that swap is the whole misunderstanding.

=== step === widget
## Building the same interval by resampling

There is a second route to an interval for the average, and it needs nothing but the 30 times you already have.

The idea is to imitate those 100 nights without going back to the shop. Draw 30 times at random from your 30, with replacement, so some get picked twice and some are left out. That is one resample, and it stands in for one more night.

Take the average of that resample, then do the whole thing 2,000 times. The 2,000 averages show you how much the sample average moves around, which is precisely what the interval needs.

The strip below is one such draw from the 30 recorded times. Press Draw again to take another.

::widget bootstrap-sample {"n": 30, "seed": 7, "tail": "The grey cells are the times this draw left out, and the next draw leaves out a different set."}

The widget calls the left-out rows out-of-bag, and the first draw has 12 of them: 12 delivery times that this resample never picked. The blue cells are times picked more than once to make up the shortfall.

Every draw leaves out roughly a third of the times, and that is not a defect. Reproducing the night's times is not the goal. Seeing how much the average moves when the sample changes is the goal.

Now run 2,000 of those draws and take the middle 95% of the averages they produce.

```r
# Resample the 30 recorded times 2,000 times and read the interval off the percentiles
set.seed(7)
boot_means <- replicate(2000, mean(sample(deliveries, size = 30, replace = TRUE)))

quantile(boot_means, c(0.025, 0.975))
#>     2.5%    97.5%
#> 23.00000 30.03333
```

Resampling gives 23.00 to 30.03 minutes. `t.test()` gave 22.84 to 30.30. The two agree to within about 0.3 of a minute at each end, and they agree because they are built out of the same thing: how much the sample average varies from sample to sample. The formula gets there through the t distribution, the resampling gets there by brute force.

This method is called the **percentile bootstrap**. Resample the data, recompute the statistic each time, and read the interval straight off the percentiles of the results. It is the method to reach for when the statistic is a median or a ratio or anything else with no tidy formula behind it.

=== step === concept
## How to report the interval, and how not to

So what do you actually write in the report?

Lead with the estimate, then the interval, which is what says how loose that estimate is.

```r
# Print the estimate, the interval and its width together
ci <- t.test(deliveries)$conf.int

cat(sprintf("average delivery time : %.2f minutes\n", mean(deliveries)))
cat(sprintf("95%% interval          : %.2f to %.2f minutes\n", ci[1], ci[2]))
cat(sprintf("width                 : %.2f minutes\n", ci[2] - ci[1]))
#> average delivery time : 26.57 minutes
#> 95% interval          : 22.84 to 30.30 minutes
#> width                 : 7.46 minutes
```

Say it like this: the average delivery time is estimated at 26.57 minutes, with a 95% confidence interval of 22.84 to 30.30 minutes. That sentence claims no probability and says nothing about single deliveries. It gives the estimate, and then the range of averages the data are consistent with.

The width matters as much as the two ends. 7.46 minutes is wide. If somebody in the room wants the shop to advertise delivery in under 30 minutes, the interval reaches 30.30, so these 30 orders do not settle whether the average is under 30.

| Say this | Not this |
|---|---|
| The average delivery time is estimated at 26.57 minutes, 95% interval 22.84 to 30.30. | There is a 95% probability the average is between 22.84 and 30.30 minutes. |
| About 95 in 100 intervals built this way contain the true average. | 95% of deliveries take between 22.84 and 30.30 minutes. |
| Two methods on these 30 times gave 22.84 to 30.30 and 23.00 to 30.03. | The narrower interval is the more accurate one. |

[TIP]
Give the width alongside the two ends. It is the fastest way to tell your reader whether the sample was big enough to bet on, and 30 orders were not.

=== step === quiz
## Quick check: which reading of 22.8 to 30.3 is right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 95% of deliveries take between 22.84 and 30.30 minutes. ::no
- There is a 95% chance the shop's average delivery time is between 22.84 and 30.30 minutes. ::no
- About 95 in 100 intervals built this way contain the true average, and this one either contains it or it does not. ::ok Exactly. The count runs over intervals, not over deliveries and not over possible true averages, and your particular interval was settled the moment you computed it.
- The resampled interval, 23.00 to 30.03, is narrower, so it is the more accurate of the two. ::no Three separate slips are on offer here. Only 7 of the 30 recorded times fall inside 22.84 to 30.30, so it is no summary of the deliveries. The true average is fixed at 26 minutes, so no probability attaches to where it sits, which is why 5 of the 100 intervals missed it outright. And narrower does not mean more accurate: 23.00 to 30.03 and 22.84 to 30.30 came off the same 30 times by two routes.

=== step === tryit
## Your turn: how often does an 80% interval contain 26?

The 100 nights gave 95 intervals containing 26 minutes at the 95% level, with a mean width of 7.67 minutes. But 95% is only a convention, and `t.test()` takes `conf.level` as an argument.

Rebuild those same 100 nights at the 80% level. Count how many of the intervals contain 26 minutes, and work out their mean width so you can compare it against 7.67.

```r
# Build 100 nights of intervals at the 80% confidence level,
# then count how many contain 26 and find their mean width.
# Start from set.seed(1) so your 100 nights match mine.
# Press Check when you have it.
```
::check {"regex": "conf[.]level\\s*=\\s*0?[.]8", "gate": true, "difficulty": "beginner", "ok": "Right: 82 of the 100 intervals contain 26 minutes, at a mean width of 4.92 minutes against 7.67 at the 95% level. Asking for a narrower interval is the same as asking for a procedure that misses more often.", "no": "Pass the level straight to the test inside the replicate call: t.test(round(rnorm(30, mean = 26, sd = 10)), conf.level = 0.80)$conf.int. Then count with sum on the same two comparisons you used before."}
::solution
```r
# Rerun the 100 nights at the 80% confidence level and count the intervals containing 26
set.seed(1)
nights80 <- replicate(100, t.test(round(rnorm(30, mean = 26, sd = 10)), conf.level = 0.80)$conf.int)

sum(nights80[1, ] <= 26 & nights80[2, ] >= 26)
#> [1] 82

mean(nights80[2, ] - nights80[1, ])
#> [1] 4.920323
```

That is 82 in 100 against 95 in 100, and the mean width drops from 7.67 minutes to 4.92. Push the level the other way and the trade reverses: the interval gets wider and the procedure misses less often. The level you choose is the hit rate you are asking for, and the width is what it costs you.

=== step === concept
## References

- [Outline of a theory of statistical estimation based on the classical theory of probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defines the confidence interval by its coverage, as a property of the procedure.
- [The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23, 103-123. Works through why a computed interval carries no probability, and where credible intervals differ.
- [Robust misinterpretation of confidence intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21, 1157-1164. Students and researchers alike endorse the same wrong readings, at similar rates.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Its second half catalogues the confidence-interval misreadings one at a time.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You built an interval for an average three different ways and then checked, by counting, what its 95% actually refers to. To summarize:

- A 95% confidence interval for a mean is the sample average plus or minus a t critical value times the standard error. For the 30 delivery times that is 26.567 plus or minus 3.731, giving 22.84 to 30.30 minutes.
- It estimates the average, not the deliveries. Only 7 of the 30 recorded times fall inside it, while the middle 95% of those times runs from 10.7 to 41.4 minutes.
- The 95% is the coverage of the procedure. Across 100 simulated nights, 95 intervals contained the true average of 26 minutes and 5 missed it. Across 2,000 nights the share came to 0.9475.
- Your own interval carries no probability. The true average is fixed and the interval is the thing that moves, so a computed interval either contains it or does not.
- Resampling the same 30 times 2,000 times gave 23.00 to 30.03, within 0.3 of a minute of the formula at each end.
- A narrower interval is not a better one. Dropping to the 80% level cut the mean width from 7.67 to 4.92 minutes and cut the hit rate to 82 in 100.

So when somebody asks what your interval means, you have a sentence ready:

"The average delivery time is estimated at 26.57 minutes, with a 95% interval of 22.84 to 30.30. About 95 in 100 intervals built this way contain the true average."

Next time you meet a confidence interval in somebody else's report, you will know which count that 95% came from, and which two sentences not to say about it. Nicely done!
