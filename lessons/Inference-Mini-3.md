---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not a 95% chance that the true average sits inside it. Build one by hand, then count coverage across 100 simulated evenings."
keywords: "confidence intervals, what does 95% confidence mean, confidence interval interpretation, confidence interval in R, t.test conf.int, coverage, bootstrap confidence interval"
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

Here is where you would run into one. A pizza chain puts a promise on its site: with 95% confidence, our average delivery time is somewhere between 22 and 30 minutes.

Ask around what that sentence means and you get two answers.

Most people say 95% of deliveries arrive between 22 and 30 minutes. The others say there is a 95% probability that the true average delivery time is between 22 and 30 minutes.

Both readings are wrong. The second one is wrong in a way that catches even people who report confidence intervals for a living.

So rather than memorise a definition, we are going to build the interval ourselves. We will simulate a pizza kitchen whose true average delivery time we get to set, take one evening of 20 orders from it, and work out the interval by hand from those 20 numbers. Then we run the same procedure on 100 more evenings and count how many of the 100 intervals contain the true average.

That count is the 95%.

::widget process-flow {"steps":[{"title":"Build one interval","sub":"from a single evening of 20 delivery times"},{"title":"Repeat it 100 times","sub":"100 more evenings, a fresh interval from each one"},{"title":"Count how many contain it","sub":"how many of the 100 intervals hold the true average"}]}

Those are the three moves, and the third one is where the 95% comes from.

=== step === concept
## The 20 delivery times, and the average we do not know

Every confidence interval starts with a sample. Ours is one evening at a single pizza kitchen: 20 orders, and how many minutes each one took to arrive.

In your job those 20 numbers would come out of the dispatch system. Here we simulate them instead, and there is a reason worth stating. Simulating lets us decide what the kitchen is truly like, and we set it to an average delivery time of 26 minutes with a standard deviation of 8 minutes around that. `rnorm(20, mean = 26, sd = 8)` then draws 20 delivery times from exactly that kitchen.

So we know the value the interval is meant to contain. That is what lets us check, later on, whether it did.

Press Run.

```r
# Simulate one evening of 20 delivery times, then summarise the evening
set.seed(196)
deliveries <- rnorm(20, mean = 26, sd = 8)

round(deliveries, 1)
#>  [1] 32.2 30.0 45.2 42.8 16.5 15.3 26.3 28.9 18.0 26.5 17.5 26.5 21.5 26.4 28.8
#> [16] 14.4 22.2 30.6 16.3 33.1

round(c(mean = mean(deliveries), sd = sd(deliveries)), 2)
#>  mean    sd
#> 25.96  8.57
```

`set.seed(196)` fixes the random draw, so your 20 numbers are my 20 numbers.

The evening's delivery times ran from 14.4 minutes at the quickest to 45.2 at the slowest, and the 20 times average out to 25.96 minutes. That average is called the **sample mean**, because it is the mean of the sample you happened to collect.

Notice it is not 26. The kitchen's true average is 26 by construction, and this evening's sample mean came in 0.04 minutes under it, purely because of which 20 orders happened to arrive.

Now run the same kitchen for a second evening and take that average too.

```r
# Draw a second evening from the same kitchen and compare the two sample means
set.seed(197)
night2 <- rnorm(20, mean = 26, sd = 8)

round(c(evening_1 = mean(deliveries), evening_2 = mean(night2)), 2)
#> evening_1 evening_2
#>     25.96     29.43
```

29.43 minutes. Nothing about the kitchen changed between the two evenings, and the sample mean still moved by three and a half minutes.

The number we actually want is the kitchen's long run average over every order it will ever deliver, which is called the **population mean**. We never get to see it. We get an evening at a time, and each evening hands back a sample mean that sits somewhere near it.

A confidence interval is how you report the estimate together with that wobble, instead of quoting 25.96 as if it were the answer.

=== step === concept
## How the interval is built: estimate, standard error, t multiplier

Every interval of this kind is a sample mean plus and minus a margin.

\[ \bar{x} \;\pm\; t_{n-1,\,0.975} \times \frac{s}{\sqrt{n}} \]

Three quantities go into it, and all three come out of the 20 delivery times you already have.

1. \( \bar{x} \) is the sample mean, 25.96 minutes. That is the estimate the interval is built around.
2. \( s / \sqrt{n} \) is the **standard error of the mean**. It is the sample standard deviation \( s \) divided by the square root of the sample size \( n \), and it says how far a sample mean typically lands from the population mean. Spread the delivery times out and it grows; take more orders and it shrinks.
3. \( t_{n-1,\,0.975} \) is the **t multiplier**, the number of standard errors you step out on each side. It comes from the t distribution, which is the bell-shaped curve to use when the spread \( s \) had to be estimated from the same small sample. Its shape is set by one number, the degrees of freedom, and here that is \( n - 1 = 19 \). We read it at 0.975 so that 2.5% is left over in each tail and 95% sits in the middle.

Let's compute all three from the delivery times.

```r
# Work out the three pieces of the margin from the 20 delivery times
n     <- length(deliveries)
xbar  <- mean(deliveries)
se    <- sd(deliveries) / sqrt(n)
tmult <- qt(0.975, df = n - 1)

round(c(xbar = xbar, se = se, t = tmult, margin = tmult * se), 3)
#>   xbar     se      t margin
#> 25.955  1.917  2.093  4.012
```

Read that left to right. The 20 times have a standard deviation of 8.57 minutes, so the standard error is 8.57 divided by the square root of 20, which is 1.917 minutes. `qt(0.975, df = 19)` gives 2.093. Multiply the two and the margin is 4.01 minutes.

Now put that margin either side of the sample mean.

```r
# The interval is the sample mean plus and minus that margin
round(c(lower = xbar - tmult * se, upper = xbar + tmult * se), 2)
#> lower upper
#> 21.94 29.97
```

21.94 to 29.97 minutes. That is the 95% confidence interval for this evening, and it is close enough to the chain's published 22 to 30 that you can see where a promise like that comes from.

You will rarely type all of that out, because `t.test()` does the same arithmetic and prints the result on the line that says `95 percent confidence interval`.

```r
# The same interval, straight out of t.test()
t.test(deliveries)
#>
#> 	One Sample t-test
#>
#> data:  deliveries
#> t = 13.54, df = 19, p-value = 3.287e-11
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  21.94316 29.96773
#> sample estimates:
#> mean of x
#>  25.95545
```

Same two numbers, 21.94 and 29.97. `t.test()` does nothing beyond the hand computation, which is worth knowing the day you have to defend that output in a meeting.

=== step === concept
## What the 95% is counting: 100 evenings, 100 intervals

We now have one interval from one evening. The 95% attached to it is not about that one interval at all, and this is the part to slow down on.

What we followed is a procedure: take 20 orders, compute the sample mean, add and subtract 2.093 standard errors. Run that procedure on a different evening's orders and you get a different interval, because you get a different sample mean and a different spread.

So run it 100 times. `replicate()` repeats the whole thing on 100 fresh evenings from the same kitchen and keeps the two endpoints from each one. Since we built the kitchen, we know its population mean is 26, so we can ask of every interval: does it contain 26?

```r
# Repeat the whole procedure on 100 simulated evenings and count the intervals containing 26
set.seed(1)
intervals <- replicate(100, t.test(rnorm(20, mean = 26, sd = 8))$conf.int)

covers <- intervals[1, ] <= 26 & intervals[2, ] >= 26
sum(covers)
#> [1] 96

which(!covers)
#> [1]  9 65 72 96
```

96 of the 100 intervals contain 26. Four of them do not, and they come from evenings 9, 65, 72 and 96.

Here they all are, one vertical segment per evening, with the population mean drawn as a horizontal line.

```r
# Plot the 100 intervals as vertical segments, with the four that miss 26 in red
plot(NULL, xlim = c(0, 101), ylim = range(intervals),
     xlab = "Simulated evening", ylab = "95% interval, minutes",
     main = "100 evenings, 100 intervals")
segments(1:100, intervals[1, ], 1:100, intervals[2, ],
         col = ifelse(covers, "grey60", "firebrick"), lwd = 2)
abline(h = 26, lwd = 2)
```

Every segment is a different interval, because every evening delivered a different 20 orders. Most of them straddle the line. Four red ones sit entirely above or below it and never touch 26.

That 96 out of 100 is the 95%. It is the share of intervals, over repeated samples, that contain the population mean. Run 100 evenings and 96 of the intervals contain 26; run 100,000 and the share settles on 0.95, because 95% is what the multiplier 2.093 was chosen to deliver.

[KEY INSIGHT]
The 95% is a property of the procedure, not of the interval sitting in front of you. It says that if you keep taking samples and keep building intervals this way, about 95 in every 100 of those intervals will contain the true value.

=== step === concept
## Is there a 95% chance the true average is inside your interval?

This is the reading almost everyone reaches for, so it is worth taking apart carefully.

Look back at the 100 intervals. Each interval either contains 26 or it does not, and once the sample is in hand there is nothing random left to attach a probability to. The population mean is 26 the whole time and it never moves. The interval is the part that moved.

Print the first 12 intervals and check them one at a time.

```r
# List the first 12 evenings with their interval and whether it contains 26
data.frame(evening = 1:12,
           lower   = round(intervals[1, 1:12], 1),
           upper   = round(intervals[2, 1:12], 1),
           covers  = covers[1:12])
#>    evening lower upper covers
#> 1        1  24.1  30.9   TRUE
#> 2        2  22.7  29.2   TRUE
#> 3        3  24.1  30.1   TRUE
#> 4        4  22.9  30.7   TRUE
#> 5        5  23.5  30.4   TRUE
#> 6        6  23.9  30.0   TRUE
#> 7        7  21.8  26.8   TRUE
#> 8        8  18.3  27.2   TRUE
#> 9        9  26.2  33.5  FALSE
#> 10      10  21.3  28.1   TRUE
#> 11      11  23.9  32.4   TRUE
#> 12      12  19.2  27.1   TRUE
```

Take the interval from evening 9, which runs from 26.2 to 33.5 minutes. Is there a 95% chance that 26 is inside it? No. 26 sits below 26.2, so the answer is a flat no, and every other row is the same kind of answer: the covers column is TRUE or FALSE, never 0.95.

The catch is that in real work you cannot see that column. You have one interval, the true value is unknown, and nothing tells you whether you are holding one of the 96 or one of the 4. The 95% describes how often the procedure works, and that rate is all you have to go on. It does not turn into a probability about the one interval you computed.

There is a genuine interval that does carry a probability about the unknown average. It is called a **credible interval**, it comes out of Bayesian statistics, and building one means supplying a prior distribution for the average before you look at the data and then updating that prior with the 20 delivery times. That is a different calculation with a different input. No prior went into the interval we built, so it does not support a claim of that kind.

[WARNING]
"There is a 95% probability the true average is between 21.94 and 29.97" is the sentence to strike from your write-ups. The true average is fixed. The interval is what varies from sample to sample, and the 95% lives entirely in that variation.

=== step === widget
## The interval covers the average, not your next delivery

The other common reading is the one about the deliveries themselves: 95% of orders arrive between 21.94 and 29.97 minutes. The 20 orders are right here, so we can simply count them.

```r
# Count how many of the 20 recorded delivery times fall inside the interval for the average
ci     <- t.test(deliveries)$conf.int
inside <- deliveries >= ci[1] & deliveries <= ci[2]

sum(inside)
#> [1] 7
```

7 of the 20. Roughly a third of the evening's orders landed inside an interval that is supposed to be 95% something, which tells you it was never about individual orders.

It is an interval for the average of the orders. Averaging 20 delivery times cancels much of the variation between them, so the average is pinned down far more tightly than any single order ever is. The range where one new order might land is a different quantity with its own name, the **prediction interval**, and it has to carry the full spread of the data rather than the spread of an average.

The widget below draws both at once. It runs on its own built in scatter, a straight line fitted through a cloud of points, rather than on the delivery times. Read the green band around that line as the interval for the average and the orange band as the range where one new observation would land. The half widths it reports are in the scatter's own units, not in minutes.

::widget regression-intervals {}

At n = 20 the readout under the chart gives the green band a half width of 0.30 at the middle of the fitted line, against 1.35 for the orange one. Drag the slider up to 300 and watch what each one does. The green half width collapses to 0.08, because a bigger sample pins the average down. The orange one ends up at 1.34, which is essentially where it started.

That gap is the whole point. More orders tell you more about the average. They tell you nothing new about how much one delivery differs from the next, because that spread belongs to the kitchen and not to your sample size.

=== step === quiz
## Quick check: what the 95% is counting

The interval from the evening of 20 orders is 21.94 to 29.97 minutes. Which sentence says what the 95% is counting?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- About 95% of delivery times fall between 21.94 and 29.97 minutes. ::no
- There is a 95% probability that the true average delivery time is between 21.94 and 29.97 minutes. ::no
- Rebuild this interval on fresh evenings, and about 95% of those intervals would contain the true average delivery time. ::ok That is the one. The 95% counts intervals across repeated samples, which is exactly what the 100 intervals showed when 96 of them contained 26.
- The sample mean is within 0.95 minutes of the true average delivery time. ::no Three of these four put the 95% in the wrong place. It is not a share of delivery times, since only 7 of the 20 orders fell inside this interval. It is not a probability about the true average, which is fixed and either is or is not inside. And it is not a distance in minutes. It is the share of intervals, built this way over repeated samples, that contain the true average.

=== step === concept
## What makes a confidence interval wide or narrow

An interval is only useful if it is tight enough to act on. 21.94 to 29.97 is eight minutes wide, which is a lot when the decision in front of you is whether to promise 30 minutes.

The formula says exactly what that width is made of, because the width is twice the margin.

\[ \text{width} \;=\; 2 \times t_{n-1,\,0.975} \times \frac{s}{\sqrt{n}} \]

Two things you control sit in there. The sample size \( n \) is under the square root, and the confidence level sets the t multiplier. The spread \( s \) is the kitchen's own variability, which you can only change by changing the kitchen.

Take more orders first, holding the spread at the 8.57 minutes from this evening's orders.

```r
# Interval width at three sample sizes, holding the spread at this evening's value
ns     <- c(20, 80, 320)
widths <- 2 * qt(0.975, df = ns - 1) * sd(deliveries) / sqrt(ns)

round(setNames(widths, paste0("n = ", ns)), 2)
#>  n = 20  n = 80 n = 320
#>    8.02    3.82    1.89
```

8.02 minutes at 20 orders, 3.82 at 80, 1.89 at 320. Each time we quadruple the orders the width roughly halves, which is the square root in the denominator doing its work. Halving the width costs four times the data, so it is worth pricing before you promise anyone a tighter number.

The other knob is the confidence level, and it pushes the other way.

```r
# The same 20 delivery times at a 99% confidence level
round(as.numeric(t.test(deliveries, conf.level = 0.99)$conf.int), 2)
#> [1] 20.47 31.44
```

The same 20 delivery times now give 20.47 to 31.44, nearly 11 minutes wide against the 8 we had. Nothing about the data changed. Asking to be right more often makes `qt()` return a bigger multiplier, and a bigger multiplier means a longer margin on both sides.

That is the trade to keep straight. More orders buy you a narrower interval at the same 95% coverage. A higher confidence level buys you higher coverage and pays for it in width.

=== step === widget
## How to build the interval by resampling instead of the formula

Everything so far has leaned on `s / sqrt(n)`, the standard error of the mean. The mean happens to have that tidy formula. Most statistics you might want an interval for do not, and for a median, a trimmed mean or a correlation there is nothing this simple to reach for.

So here is the other way to get an interval, and it needs no formula at all.

The reason we could count coverage earlier is that we could keep going back to the kitchen for fresh evenings. In real work you get one evening. But you can imitate a fresh evening by drawing 20 orders with replacement from the 20 you already have. Some orders get picked twice, some get left out, and the result is a new set of 20 that differs from yours in the same sort of way a real second evening would. This is called a **bootstrap resample**.

Press Draw again a few times to watch one resample of the 20 orders at a time.

::widget bootstrap-sample {"n": 20, "seed": 4, "tail": "The grey orders were left out of this resample, so every resampled average is built from a different mix of the same 20 delivery times."}

The first draw leaves 6 of the 20 orders out and picks 5 of them more than once. Those left out orders are marked OOB in the strip, short for out of bag, which is the standard name for the rows a resample did not pick. Draw again and a different set sits out.

That variation is the point. Each resample gives a slightly different average, and the spread of those averages tells you how much a sample mean moves around.

Do it 2000 times and compare that spread against the formula.

```r
# Resample the 20 delivery times 2000 times and take the average of each resample
set.seed(21)
boot_means <- replicate(2000, mean(sample(deliveries, replace = TRUE)))

round(c(bootstrap_sd = sd(boot_means), formula_se = sd(deliveries) / sqrt(20)), 3)
#> bootstrap_sd   formula_se
#>        1.903        1.917
```

The 2000 resampled averages have a standard deviation of 1.903 minutes. The formula said 1.917. They agree because they are measuring the same thing, and only one of them needed a derivation.

For the interval itself, take the middle 95% of those 2000 averages directly.

```r
# The middle 95% of the 2000 resampled averages, which is the percentile bootstrap interval
round(quantile(boot_means, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#> 22.44 29.79
```

22.44 to 29.79 minutes, against 21.94 to 29.97 from `t.test()`. Two different routes to nearly the same interval, and this one is called the **percentile bootstrap**.

Its 95% means what the t interval's 95% means: repeat the sampling and about 95% of the intervals built this way contain the true value. What you gain is that `mean` in that `replicate()` line can be swapped for almost any function you like.

=== step === quiz
## Quick check: an interval for the median delivery time

The chain now wants a 95% interval for the **median** delivery time rather than the average, and you still have only the 20 orders from that evening. Which construction gives you one?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Run `t.test(deliveries)` and report the interval it prints. ::no
- Resample the 20 orders with replacement 2000 times, take the median of each resample, and use the 2.5% and 97.5% quantiles of those medians. ::ok Exactly. Swapping `mean` for `median` inside the resampling loop is the whole change, and the 95% still means coverage across repeated samples.
- Report the middle 95% of the 20 recorded delivery times. ::no
- Report the sample median plus and minus the 4.01 minute margin. ::no The median has no standard error formula, so `t.test()` and the 4.01 minute margin are both built for a different statistic and neither transfers. The middle 95% of the recorded times is a different thing again, since it describes where single orders land rather than where the median sits. Resampling is what still works here.

=== step === tryit
## Your turn: rebuild the 100 intervals at 99%

The 100 intervals were built at 95% confidence and 96 of them contained 26. Rebuild them from those same 100 evenings at 99% confidence, then count how many contain 26 this time.

`intervals` is still in the session holding the 95% version, so you can compare the average width of the two afterwards.

```r
# Rebuild the same 100 evenings at 99% confidence, then count the intervals containing 26.
# Start from set.seed(1) so the evenings are the same ones as before,
# and pass conf.level = 0.99 to t.test() inside replicate().
# Press Check when you have it.
```
::check {"regex": "conf[.]level\\s*=\\s*0?[.]99", "gate": true, "difficulty": "beginner", "ok": "Right: 99 of the 100 intervals now contain 26, up from 96, and the average width goes from 7.67 minutes to 10.49. The level you ask for is the coverage you get, and width is what pays for it.", "no": "Take the replicate() line that built the 100 intervals and add one argument: t.test(rnorm(20, mean = 26, sd = 8), conf.level = 0.99)."}
::solution
```r
# Rebuild the 100 evenings at 99% confidence and count the intervals that contain 26
set.seed(1)
intervals99 <- replicate(100, t.test(rnorm(20, mean = 26, sd = 8), conf.level = 0.99)$conf.int)

covers99 <- intervals99[1, ] <= 26 & intervals99[2, ] >= 26
sum(covers99)
#> [1] 99

round(c(width_99 = mean(intervals99[2, ] - intervals99[1, ]),
        width_95 = mean(intervals[2, ] - intervals[1, ])), 2)
#> width_99 width_95
#>    10.49     7.67
```

99 of 100 against 96 of 100, and the intervals are about 2.8 minutes wider on average. The confidence level is the coverage you ask the procedure for, and the extra width is what it costs.

=== step === concept
## References

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defined confidence intervals by their coverage over repeated samples.
- [The Fallacy of Placing Confidence in Confidence Intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23, 103-123. Why the probability reading fails, worked through several examples.
- [Robust Misinterpretation of Confidence Intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21, 1157-1164. Students and researchers alike endorsing the false readings.
- [What Teachers Should Know About the Bootstrap](https://doi.org/10.1080/00031305.2015.1089789) - Hesterberg (2015), The American Statistician 69(4), 371-386. The percentile bootstrap, and when resampling is the honest option.
- [Student's t-Test documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team. The reference for `conf.level` and the `conf.int` that `t.test()` returns.

=== step === complete
## Quick recap

You built a confidence interval from 20 delivery times by hand, then found out what its 95% counts by running the same procedure 100 more times.

- The interval is the sample mean plus and minus a margin: 25.96 give or take 4.01 minutes, which is 21.94 to 29.97.
- The 95% counts intervals. It is not a share of deliveries and not a probability. Across 100 simulated evenings, 96 of the intervals contained the true average of 26.
- Your one interval either contains the true average or it does not. The interval from evening 9 ran from 26.2 to 33.5 and simply missed. A probability about the unknown average is a credible interval, which needs a prior.
- The interval is for the average, not a range for single orders. Only 7 of the 20 delivery times fell inside it.
- Four times the orders halves the width. A higher confidence level raises coverage and widens the interval, and at 99% the same evening's interval ran from 20.47 to 31.44.
- When a statistic has no standard error formula, resample the data instead. The percentile bootstrap gave 22.44 to 29.79 for the same average.

So when someone asks what the 95% means, here is the sentence to say:

"If we rebuilt this interval every evening, about 95 in 100 of those intervals would contain the true average delivery time. This is one of them, and we cannot tell which."

Very few people can say that correctly, and now you are one of them. Nicely done.
