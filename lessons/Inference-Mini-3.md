---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "Build a 95% confidence interval from 20 pizza deliveries, then count how many of 100 intervals catch the true average, and what the 95% really promises."
keywords: "confidence intervals, what confidence intervals mean, 95 percent confidence interval, confidence interval in R, t.test confidence interval, bootstrap confidence interval, coverage"
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
catalog_blurb: "What the 95% in a confidence interval actually counts."
---

=== step === cover
::eyebrow Inference from Zero
## Confidence intervals: what they really mean

Today let's work out what the 95% in a confidence interval is actually counting.

Say your local pizza shop, Marino's, prints this on its order page: we are 95% confident the average delivery takes between 22 and 30 minutes.

That claim is about one number, and the number is not your pizza. It is the average delivery time across every order the shop takes. Nobody knows it, including the shop. They timed a small batch of deliveries, got 22 to 30 out of them, and put 95% in front of it.

So what is the 95% attached to?

Two answers come up first. One says 95 out of every 100 pizzas arrive inside 22 to 30 minutes. The other says the true average lies in 22 to 30 with probability 0.95. Neither one is right, and both get repeated constantly.

Rather than memorise the correct sentence, we are going to build these intervals ourselves, in a shop whose true average delivery time is a number we can look up and check against.

::widget process-flow {"steps":[{"title":"Build one interval","sub":"take 20 delivery times and compute an interval for the average"},{"title":"Repeat the sampling","sub":"draw 100 more samples of 20 and build an interval from each"},{"title":"Count the hits","sub":"see how many of the 100 intervals contain the true average"}]}

That count is the answer. The rest is doing it, and then being careful about what the count does and does not say.

=== step === concept
## The 20 deliveries behind the claim

To check a claim about a true average, you need a month of deliveries whose average you can actually read off. So let's build one.

Marino's handles about 2,000 deliveries a month. Delivery times are not symmetric: there is a floor of a few minutes no matter what, most orders bunch up in the twenties, and now and then a driver hits a closed road and the trip runs long. `rgamma()` draws positive numbers with exactly that shape, stretched out to the right, and adding 12 puts a floor under them.

Those 2,000 times are the whole month's deliveries, so their average is the number the claim is about. The 20 that Marino's timed today are a `sample()` of them.

Press Run.

```r
# Simulate a month of deliveries at Marino's, then draw the 20 the claim came from
set.seed(4)
all_deliveries <- round(12 + rgamma(2000, shape = 4, scale = 3.8), 1)   # minutes

set.seed(52)
today <- sample(all_deliveries, 20)

sort(today)
#>  [1] 17.4 19.3 19.4 20.2 20.6 21.0 22.9 23.0 23.1 23.3 25.2 26.9 27.7 27.8 28.1
#> [16] 28.8 29.4 29.7 34.4 56.5

round(c(mean = mean(today), sd = sd(today)), 2)
#>  mean    sd 
#> 26.24  8.36
```

`set.seed()` fixes the random draw so your numbers match mine, and `sort()` is there only to make the 20 readable.

Most of today's deliveries sit between 19 and 30 minutes. One took 34.4 minutes and one took 56.5. That long one is not a data error. Slow trips happen, and one of them turning up in a batch of 20 is ordinary.

So the average of the 20 is 26.24 minutes and their standard deviation is 8.36 minutes. Those two numbers, plus the 20 in the sample size, are everything the shop has to work with.

=== step === concept
## How to build the interval by hand

An interval for an average always has the same three parts: where the sample average landed, how much a sample average bounces around, and how confident you want to be.

$$\bar{x} \pm t_{n-1,\,0.975} \times \frac{s}{\sqrt{n}}$$

Read it left to right. \(\bar{x}\) is the average of today's 20 deliveries, 26.24 minutes. \(s\) is their standard deviation, 8.36 minutes, and \(n\) is 20.

The piece \(s/\sqrt{n}\) is called the **standard error**. It is the standard deviation of the sample average itself, and it is much smaller than the standard deviation of a single delivery, because averaging 20 numbers cancels out most of the up and down.

The multiplier \(t_{n-1,\,0.975}\) says how many standard errors to step out on each side. It comes from the t distribution rather than the normal one, because \(s\) was estimated from the same 20 numbers and that leaves a little extra uncertainty to pay for. The t distribution has the same bell shape as the normal curve with heavier tails, so it steps out a little further. How much further depends on the sample size through \(n - 1\), which is 19 here and is called the degrees of freedom.

```r
# Build the 95% confidence interval for the average delivery time by hand
n          <- length(today)
se         <- sd(today) / sqrt(n)      # standard error of the average
t_mult     <- qt(0.975, df = n - 1)    # the 95% multiplier at 19 degrees of freedom
half_width <- t_mult * se

round(c(se = se, t_mult = t_mult, half_width = half_width), 3)
#>         se     t_mult half_width 
#>      1.870      2.093      3.915 

round(c(lower = mean(today) - half_width, upper = mean(today) + half_width), 2)
#> lower upper 
#> 22.32 30.15
```

`qt(0.975, df = 19)` is the point on the t distribution with 2.5% of the curve to its right. Leave 2.5% out on each side and 95% stays in the middle, which is where the 95% enters the arithmetic.

So the standard error is 1.87 minutes, the multiplier is 2.093, and the two multiply out to a half width of 3.91 minutes. Put that on either side of 26.24 and you land on 22.32 to 30.15.

R has this formula built in, and `t.test()` hands back the same pair.

```r
# Get the same interval straight from the built-in one-sample t test
t.test(today)$conf.int
#> [1] 22.32033 30.14967
#> attr(,"conf.level")
#> [1] 0.95
```

It gives the same two numbers, because it runs the same formula on the same 20 deliveries. Rounded off, that is 22 to 30 minutes, the line on Marino's order page.

[NOTE]
The interval sits symmetrically around 26.24 by construction, so its midpoint tells you nothing you did not already know from `mean(today)`. Everything a confidence interval adds is in its width.

=== step === concept
## Do 95 out of 100 intervals contain the true average?

22.32 to 30.15 came out of one batch of 20 deliveries, and it carries a 95% on the front. To check a claim like that you need the number the interval is meant to contain, and here we have it: the month's 2,000 delivery times are sitting in `all_deliveries`, so the true average is one line of code away.

Here is the check. Draw another 20 deliveries out of the month's 2,000, build the interval from them exactly as before, and record whether it contains the true average. Then do that 100 times. `replicate()` runs the same draw over and over and keeps the result of each one, so `intervals` comes back as a 2 by 100 matrix of lower and upper bounds.

```r
# The month's true average, then 100 intervals from 100 fresh samples of 20
true_avg <- mean(all_deliveries)
round(true_avg, 2)
#> [1] 27.18

set.seed(7)
intervals <- replicate(100, t.test(sample(all_deliveries, 20))$conf.int)
covers <- intervals[1, ] <= true_avg & intervals[2, ] >= true_avg
sum(covers)
#> [1] 94
```

The true average across the month is 27.18 minutes, and 94 of the 100 intervals contain it. Let's look at all 100 at once.

```r
# Draw the 100 intervals as horizontal segments, with the misses in red
plot(NULL, xlim = range(intervals), ylim = c(1, 100),
     xlab = "95% interval for the average delivery time (minutes)",
     ylab = "Sample number",
     main = "100 samples of 20 deliveries, one interval each")
segments(intervals[1, ], 1:100, intervals[2, ], 1:100,
         col = ifelse(covers, "grey70", "red"), lwd = 2)
abline(v = true_avg, lwd = 3)
```

Every grey bar is one interval that contains 27.18. The six red ones do not. The black vertical line is the true average, and it never moves, because it belongs to the whole month's deliveries, not to any one sample.

That is the 95%. It is a hit rate over repeated sampling: build intervals this way again and again, and about 95 in every 100 will contain the number you are after. We got 94, which is what 95% looks like in a run of 100.

Notice the conditions this ran under. The formula is derived for data that follows a normal distribution, and delivery times at Marino's are visibly not normal, with that long right tail. The count still came out at 94, because the formula rests on the behaviour of the sample average rather than of single deliveries, and an average of 20 numbers is far more symmetric than the 20 numbers themselves.

[KEY INSIGHT]
The 95% is a property of the procedure, not of the interval the procedure produced. Run the procedure many times and about 95 in 100 of its intervals contain the true average.

=== step === quiz
## Quick check: what is the 95% counting?

Marino's builds an interval from 20 timed deliveries and calls it a 95% confidence interval. Which sentence says what that 95% counts?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- 95 out of every 100 deliveries arrive inside 22 to 30 minutes. ::no
- Of many intervals built this way from fresh samples, about 95 in 100 contain the true average. ::ok Yes. It is a hit rate over repeated sampling, which is exactly why we could count it: 94 of our 100 intervals contained 27.18.
- There is a 95% probability that the true average lies inside 22 to 30 minutes. ::no
- The average of the 20 timed deliveries is within 95% of the true average. ::no Only one of these counts something you could go and check. The 95% is the share of intervals, across repeated samples, that contain the true average. It says nothing about where single deliveries land, it puts no probability on a fixed number, and it is not a percentage distance between two averages.

=== step === concept
## The true average is fixed, the interval is what moves

The reading that survives longest is the probability one: there is a 95% chance the true average is inside 22.32 to 30.15. It is worth seeing exactly where that breaks.

Two things went into each of those 100 intervals. One was the true average, 27.18, which was the same number every time. The other was 20 delivery times, which were different every time. Only one of the two moves, and it is not the truth.

So take an interval that missed. Here are all six of them.

```r
# List the intervals that missed the true average of 27.18 minutes
missed <- t(intervals[, !covers])
colnames(missed) <- c("lower", "upper")
round(missed, 2)
#>      lower upper
#> [1,] 21.63 26.79
#> [2,] 21.95 26.70
#> [3,] 27.40 35.83
#> [4,] 22.61 26.86
#> [5,] 21.61 26.55
#> [6,] 20.38 26.22
```

Look at the fifth row, 21.61 to 26.55, and ask what the probability is that 27.18 sits inside it. There is nothing left to be uncertain about. 27.18 is larger than 26.55, so the answer is 0, not 0.05. Five of the six misses fell short of 27.18 like this one, and the third, 27.40 to 35.83, sat above it.

Run the same question on an interval that hit and the answer is 1. Every interval you compute is one or the other. You simply cannot tell which, because in real work there is no `true_avg` to print.

That is why the 95% has to attach to the procedure. Before the sample is drawn, 95% is the chance that the interval you are about to build will contain the true average. Once it is drawn, the interval is two numbers on your screen and the truth is wherever it always was.

[WARNING]
"There is a 95% probability the average is between 22.32 and 30.15" is the sentence to keep out of your write-up. Say you are 95% confident, and mean by it that the procedure behind the interval contains the true average 95% of the time.

=== step === concept
## An interval for the average is not the range of delivery times

Now for the reading that costs Marino's customers. The shop could put 22 to 30 minutes on the order page and let people take it as a promise about their own pizza. Let's count how many pizzas that promise would actually cover.

```r
# Compare the interval for the average against the spread of single delivery times
share_inside <- mean(all_deliveries >= 22.32 & all_deliveries <= 30.15)
round(100 * share_inside, 1)
#> [1] 40.2

middle_95 <- quantile(all_deliveries, c(0.025, 0.975))
round(middle_95, 1)
#>  2.5% 97.5% 
#>  16.2  44.7
```

Only 40.2% of the month's deliveries landed between 22.32 and 30.15 minutes. Three pizzas in five arrive outside that window, some quicker and some slower, so a customer who read it as a promise about their own order would be wrong most nights.

If you want a window that really does hold 95% of single deliveries, `quantile()` gives it directly: 16.2 to 44.7 minutes. That window is 28.5 minutes wide, against 7.8 minutes for the confidence interval.

```r
# Draw both windows on the month's delivery times
hist(all_deliveries, breaks = 40, col = "grey85", border = "white",
     main = "All 2,000 deliveries at Marino's",
     xlab = "Delivery time (minutes)")
abline(v = c(22.32, 30.15), col = "red", lwd = 3)
abline(v = middle_95, col = "blue", lwd = 2, lty = 2)
```

The two red lines are the confidence interval for the average. The two dashed blue lines hold the middle 95% of single deliveries. They answer different questions, and the red pair is much narrower because an average of 20 numbers is a far steadier quantity than one delivery.

[NOTE]
Raising the confidence level does not close that gap. A 99% interval for the average is still an interval for the average: it grows a little and stays nowhere near 16.2 to 44.7. The two quantities are different, not differently confident.

=== step === widget
## What more data narrows, and what it does not

The interval came out 7.8 minutes wide because it was built from 20 deliveries. Marino's could time more of them. Here is what that buys, holding the standard deviation at the 8.36 minutes we measured.

```r
# Half-width of the 95% interval as the shop logs more deliveries
sizes       <- c(20, 80, 320)
half_widths <- qt(0.975, df = sizes - 1) * sd(today) / sqrt(sizes)

data.frame(deliveries = sizes, half_width = round(half_widths, 2))
#>   deliveries half_width
#> 1         20       3.91
#> 2         80       1.86
#> 3        320       0.92
```

Four times the deliveries roughly halves the half width: 3.91 minutes at 20, 1.86 at 80, 0.92 at 320. That comes straight from the \(\sqrt{n}\) sitting in the denominator, and it is why precision gets expensive. Halving the width costs you four times the data.

Now for the part that does not move. The chart below uses its own small dataset rather than Marino's deliveries, and it fits a line through it instead of taking a single average, but its two bands are exactly the pair we are separating. The green band is the interval for the average. The orange band is where one new observation would land, which for Marino's means one delivery.

::widget regression-intervals {}

Drag the sample size. At n = 20 the readout gives a half width of 0.30 for the green band and 1.35 for the orange one. Push the slider to 300 and the green band collapses to 0.08, while the orange band reads 1.34, which is essentially where it started.

That is the whole story of what more data does. It pins down the average. It does nothing to how much one delivery differs from the next, because that variation is a fact about the shop's deliveries, not about your sample size.

=== step === concept
## How to build the interval by resampling

The formula came with a multiplier from a named distribution. There is a second way to get an interval, and it needs neither.

The idea is this. Today's 20 delivery times are the only picture you have of every delivery the shop makes, so treat those 20 as if they were all of them. Draw 20 times out of those 20 with replacement, meaning a time can be picked twice while another is left out entirely. That gives you a new batch of 20 that looks like the original without being identical to it. Take its average, and repeat.

::widget bootstrap-sample {"n": 20, "tail": "Those times sat out this draw, and some of the others got picked more than once."}

Each box is one of the 20 delivery times, and the readout calls the left-out ones out-of-bag, which is just the name for the times a draw did not pick. The first draw leaves 6 of the 20 out and picks 4 of them more than once. Press Draw again and a different set sits out, usually somewhere around 7 of the 20.

That is one resample. The interval comes from 10,000 of them.

```r
# Rebuild the interval by resampling today's 20 delivery times, with no formula
set.seed(3)
boot_means <- replicate(10000, mean(sample(today, 20, replace = TRUE)))

round(quantile(boot_means, c(0.025, 0.975)), 2)
#>  2.5% 97.5% 
#> 23.22 30.25 

hist(boot_means, breaks = 40, col = "grey85", border = "white",
     main = "10,000 averages, each from one resample of the 20",
     xlab = "Average delivery time (minutes)")
abline(v = quantile(boot_means, c(0.025, 0.975)), col = "red", lwd = 3)
```

`sample(today, 20, replace = TRUE)` is the draw, `mean()` collapses it to one number, and `replicate()` does that pair 10,000 times. The grey pile is those 10,000 averages, and it is the picture of how much an average of 20 deliveries bounces around. `quantile()` then cuts off the lowest 2.5% and the highest 2.5%, and the red lines mark what is left: 23.22 to 30.25 minutes.

This method is called the **bootstrap**. Set its answer against the by-hand interval, 22.32 to 30.15, and the two agree to within a minute at each end, out of completely different arithmetic.

The bootstrap matters most when there is no formula to reach for. A median, a 90th percentile, a ratio of two numbers: you can resample and take quantiles for any of them, the same way we just did.

=== step === quiz
## Quick check: what changes when the shop logs more deliveries?

Marino's starts timing every delivery and ends up with 320 of them instead of 20. Deliveries themselves carry on as before. What happens?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Single deliveries start landing closer to 26 minutes, so the interval covers more of them. ::no
- The confidence level climbs above 95%, because more data means more confidence. ::no
- The interval for the average narrows to about plus or minus 0.92 minutes, and the spread of single deliveries is unchanged. ::ok Right. More data pins down the average and leaves single deliveries alone, which is why the green band collapsed while the orange one held its width.
- The true average shifts toward the middle of the new interval. ::no More data changes one thing only, which is how precisely you have pinned down the average. It does not make deliveries more alike, it does not raise the confidence level (you pick that yourself), and it cannot move the true average, which was fixed before anybody timed anything.

=== step === tryit
## Your turn: build the 99% interval

`boot_means` still holds the 10,000 resampled averages. The 95% interval came from cutting 2.5% off each end of them. A 99% interval cuts 0.5% off each end instead. Read those two points off `boot_means` and see what the extra confidence costs you in width.

```r
# boot_means holds 10,000 averages, in minutes, each one from a resample
# of today's 20 delivery times.
# Cut 0.5% off each end instead of 2.5% to get the 99% interval.
# One line. Press Check when you have it.
```
::check {"regex": "quantile[(]\\s*boot_means\\s*,[\\s\\S]*0?[.]005[\\s\\S]*0?[.]995", "gate": true, "difficulty": "beginner", "ok": "That gives 22.49 to 31.95 minutes, a width of 9.46 against 7.03 for the 95% interval from these same resampled averages. Same 20 deliveries, more confidence, wider answer.", "no": "Same call as the 95% version with the two cut points moved outwards: quantile(boot_means, c(0.005, 0.995))."}
::solution
```r
# Read the 0.5% and 99.5% points of the 10,000 resampled averages
round(quantile(boot_means, c(0.005, 0.995)), 2)
#>  0.5% 99.5% 
#> 22.49 31.95 

round(unname(diff(quantile(boot_means, c(0.005, 0.995)))), 2)
#> [1] 9.46
```

Confidence and width trade against each other on a fixed batch of data. Ask to be right 99 times in 100 instead of 95 and the interval has to grow from 7.03 minutes to 9.46 to pay for it. The only way to buy the width back is to time more deliveries.

=== step === concept
## References

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defines a confidence interval by its coverage over repeated sampling.
- [The Fallacy of Placing Confidence in Confidence Intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23, 103-123. Why the probability reading fails, worked through in detail.
- [Robust Misinterpretation of Confidence Intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21, 1157-1164. Students and researchers endorsing false statements about a 95% interval.
- [What Teachers Should Know About the Bootstrap](https://doi.org/10.1080/00031305.2015.1089789) - Hesterberg (2015), The American Statistician 69(4), 371-386. Where resampling intervals work well and where they do not.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()`.

=== step === complete
## Quick recap

You built confidence intervals two ways and then counted what the number on the front of them is actually counting. To summarise:

- The 95% is a hit rate over repeated sampling. Build the interval again and again from fresh samples and about 95 in 100 of them contain the true average. Yours contained it 94 times out of 100.
- It is not a probability about the interval in front of you. The true average was 27.18 the whole time, so 21.61 to 26.55 contains it with probability 0, not 0.05.
- It is not the range of single delivery times. Only 40.2% of the month's pizzas arrived inside 22.32 to 30.15, while the middle 95% of them ran from 16.2 to 44.7 minutes.
- More data narrows the interval for the average and leaves the spread of deliveries where it is. The half width fell from 3.91 minutes at 20 deliveries to 0.92 at 320.
- Resampling those 20 deliveries 10,000 times gave 23.22 to 30.25, within a minute of the formula at both ends and needing no formula at all.

So when somebody points at Marino's order page and asks what the 95% means:

"If the shop kept timing fresh batches of deliveries and building an interval from each batch, about 95 in 100 of those intervals would contain the shop's true average delivery time. This is one of them."

That sentence is longer than the one on the order page, and it is the one you can defend in a meeting. Congratulations, you made it through. Have a great day!
