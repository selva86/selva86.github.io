---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not a 95% chance the true value sits inside it. Build one from 20 delivery times, repeat the study 100 times, and count them."
keywords: "confidence intervals, what a confidence interval means, 95% confidence interval, confidence interval interpretation, confidence interval in R, standard error, bootstrap confidence interval, prediction interval"
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
## Confidence intervals: what they really mean

Today we are going to take the 95% in a confidence interval apart and find out exactly what it counts.

A pizza shop logs how long each delivery takes. Last night 20 orders went out, and from those 20 times the shop works out a range for its average delivery time: 22 to 30 minutes, at 95% confidence.

So what is the 95% attached to?

Ask around and you get two answers. One is that 95% of deliveries arrive between 22 and 30 minutes. The other is that there is a 95% chance the shop's true average sits somewhere in that range.

Both sound reasonable, and neither one is what the 95% says.

Here is the reading that is right. That 22 to 30 is a confidence interval, and if the shop ran last night's study again and again, 20 fresh deliveries each time, building a fresh interval from every run, about 95 in every 100 of those intervals would contain its true average delivery time. The 95% counts intervals. It says nothing about single deliveries, and nothing about the one interval the shop is holding.

That is a strange sentence to be handed. So rather than memorise it, we are going to build the interval ourselves out of those 20 delivery times, then run the shop's evening again and again and count what the intervals do.

There are only three moves in it.

::widget process-flow {"steps":[{"title":"Take one sample","sub":"20 delivery times from one evening"},{"title":"Compute the interval","sub":"the average plus and minus a margin"},{"title":"Repeat the study 100 times","sub":"count the intervals that contain the true average"}]}

That is the whole plan. Everything from here is doing it, and reading what comes out.

=== step === concept
## The 20 delivery times, and the average they estimate

Let's start with the data, because every number that follows is computed from it.

The shop records each delivery in whole minutes. Twenty orders went out last night, so there are 20 numbers.

Press Run.

```r
# Create the 20 delivery times from one evening and read their average and spread
set.seed(40)
delivery <- round(rnorm(20, mean = 27, sd = 8.5))

delivery
#>  [1] 31 31 20 20 24 16 15 42 25 16 26 17 34 23 31 35 31 30 41 18
mean(delivery)
#> [1] 26.3
sd(delivery)
#> [1] 8.246849
```

The quickest of the 20 took 15 minutes and the slowest 42, and the average of the whole set is 26.3 minutes. The standard deviation, 8.25 minutes, says how far a typical single delivery lands from that average.

A word about the line that made the data, since you can read it as well as I can. Those 20 times came out of `rnorm()`, drawn from a population whose average is 27 minutes. A real shop has no such line and no such 27, and every calculation we do on the shop's own data uses only the 20 numbers. We keep the 27 to one side because later it lets us check our answers against a truth the shop never sees.

Now here is the part everything else turns on. 26.3 is the average of one evening's 20 orders. It is not the shop's average delivery time.

The shop's average delivery time is a fixed number covering every delivery it has ever made and ever will make. Nobody at the shop has seen it, and nobody ever will. We will call it the true average, and its formal name is the population mean. What the shop has instead is 26.3, the sample average, computed from 20 orders that happened to go out last night.

Send out 20 different orders tonight and the sample average comes back as something else. That wobble is the reason an interval exists at all: 26.3 on its own says nothing about how far off it might be.

=== step === concept
## The standard error: how far the sample average lands from the true average

How far off can 26.3 be? To answer that we need the one thing no shop ever has, which is the true average itself.

We have it, because we built the data: a population with an average of 27 minutes and a standard deviation of 8.5. So let's use it while we can. Draw 2,000 fresh samples of 20 deliveries each from that population, and keep only the average of each sample.

```r
# Draw 2,000 fresh samples of 20 deliveries and keep the average of each
set.seed(2)
sample_means <- replicate(2000, mean(rnorm(20, mean = 27, sd = 8.5)))

hist(sample_means, breaks = 40, col = "grey85", border = "white",
     main = "2,000 samples of 20 deliveries, one average each",
     xlab = "Average delivery time of the sample (minutes)")
abline(v = 27, col = "red", lwd = 3)

sd(sample_means)
#> [1] 1.952129
```

Each bar counts the samples whose average landed in that slice. The pile centres on the red line at 27, which is the reassuring part: sample averages do not lean high or low, they scatter around the true average.

The width of the pile is the interesting part. The standard deviation of those 2,000 averages is 1.95 minutes, so a typical sample average lands about 2 minutes away from 27. Some land within half a minute. A few are off by 5.

That spread has a name. The **standard error** is the standard deviation of the sample average across repeated samples, and 1.95 is what we just measured the slow way, by actually taking 2,000 samples.

You do not have to take 2,000 samples to get it. It is the population standard deviation divided by the square root of the sample size.

```r
# Get the same spread from the formula instead of from the simulation
8.5 / sqrt(20)           # the population sd over the square root of the sample size
#> [1] 1.900658

sd(delivery) / sqrt(20)  # the shop has no population sd, so its own sd stands in
#> [1] 1.844052
```

The formula gives 1.9007 where the simulation measured 1.9521. Both are estimates of the same quantity, and the gap between them is the ordinary wobble in measuring a spread from 2,000 numbers.

The second line is the one that works in real life. The shop does not know that 8.5, so it uses the standard deviation of its own 20 times, 8.25, and gets a standard error of 1.844 minutes. Every interval from here on is built on that number.

[NOTE]
The square root in the denominator is why data gets expensive. To halve the standard error you need 4 times as many deliveries, not twice as many.

=== step === concept
## Building the interval: the average plus and minus a margin

An interval is the sample average plus and minus a margin, and the margin is the standard error scaled up by a multiplier.

\[ \bar{x} \pm t_{0.975,\; n-1} \times \frac{s}{\sqrt{n}} \]

Reading it left to right: \( \bar{x} \) is the sample average, 26.3. The last piece, \( s / \sqrt{n} \), is the standard error, 1.844. The \( t \) in the middle is the multiplier, and it is where the 95% enters: 0.975 leaves 2.5% in each tail, so 95% sits between them.

```r
# Build the 95% interval by hand from the average, the multiplier and the standard error
se     <- sd(delivery) / sqrt(20)
t_crit <- qt(0.975, df = 19)
margin <- t_crit * se

round(c(se = se, t_crit = t_crit, margin = margin), 3)
#>     se t_crit margin
#>  1.844  2.093  3.860
round(c(lower = mean(delivery) - margin, upper = mean(delivery) + margin), 2)
#> lower upper
#> 22.44 30.16
```

So the margin is 3.86 minutes, and the interval runs from 22.44 to 30.16. Rounded off, that is the 22 to 30 the shop put on its dashboard.

You may have seen 1.96 used as the multiplier rather than 2.093. The 1.96 is correct when you know the population standard deviation. We do not know it, we estimated it from 20 delivery times, and that estimate carries error of its own. The **t distribution** widens the multiplier to pay for that. How much it widens depends on how many values went into the standard deviation, which enters as \( n - 1 = 19 \) and is called the degrees of freedom. Here the widening adds about 7% to the margin. The more data you have, the less widening it needs: `qt(0.975, 199)`, the multiplier you would use with 200 deliveries, is 1.972.

You will not normally type all that out. `t.test()` computes exactly the same formula.

```r
# Ask t.test() for the same interval
t.test(delivery)$conf.int
#> [1] 22.44036 30.15964
#> attr(,"conf.level")
#> [1] 0.95
```

Same two numbers. Nothing is hidden inside `t.test()`: it takes the average, the standard deviation and the sample size, and does the three lines we just did by hand.

=== step === concept
## 100 studies, 100 intervals: how many contain the true average?

We now have a way to build an interval from 20 delivery times. What we do not have yet is any check on that 95% label.

So let's test it. Keep the invented population, with its true average of 27 and its standard deviation of 8.5. Run the shop's evening 100 times over, and build a 95% interval from each of those 100 samples.

```r
# Repeat the evening 100 times and build a 95% interval from each sample
set.seed(22)
intervals <- replicate(100, t.test(rnorm(20, mean = 27, sd = 8.5))$conf.int[1:2])
covers <- intervals[1, ] <= 27 & intervals[2, ] >= 27

plot(range(intervals), c(1, 100), type = "n",
     main = "100 studies, 100 intervals",
     xlab = "95% interval for the average delivery time (minutes)",
     ylab = "Study number")
segments(intervals[1, ], 1:100, intervals[2, ], 1:100,
         col = ifelse(covers, "grey65", "red"), lwd = 2)
abline(v = 27, lwd = 2)

sum(covers)
#> [1] 95
```

Every horizontal segment is one study's interval. The vertical line is 27, the true average, which we know only because we invented it. The red segments are the ones that do not reach it.

Count them: 95 of the 100 intervals contain 27, and 5 miss.

That count is the 95%. It is not a property of any single segment on that plot. It is the share of segments that cover the line when you build them this way, over and over, from fresh samples.

The count is not exactly 95 every time. Another 100 studies from a different seed give 92, or 97, the way 100 coin flips rarely land on exactly 50 heads. Keep running studies and the share settles on 95%.

[KEY INSIGHT]
The 95% is a property of the procedure, not of the answer. Follow the same procedure on fresh samples forever and 95% of the intervals you produce will contain the true average.

=== step === quiz
## Quick check: what is the 95% counting?

The shop's interval and the 100 intervals plotted above all came out of the same procedure. Which sentence says what the 95% on that procedure counts?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- About 95% of the shop's deliveries arrive inside the interval. ::no
- If the study were repeated many times, about 95% of the intervals built this way would contain the true average. ::ok That is it. The 95 grey segments out of 100 are that sentence, drawn. The count is about the pile of intervals, never about any one of them.
- There is a 95% probability that the true average lies inside the interval the shop computed. ::no
- About 95% of the averages from future studies would land inside the shop's interval. ::no Three of these four attach the 95% to something it never described: the deliveries, the shop's one interval, or the averages of future studies. The 95% counts intervals, and it counts them across repeated samples. Run the study 100 times, build 100 intervals, and about 95 of them contain the true average.

=== step === concept
## Why "a 95% chance the true average is in this interval" is wrong

The most common thing people say about an interval is that there is a 95% chance the true average lies inside it. That one is worth taking apart properly rather than just marking wrong.

The 100 studies are still in memory, so let's print six of them. Studies 57 to 62 happen to include one of the 5 misses.

```r
# Print studies 57 to 62 with their interval and whether it contains 27
data.frame(
  study       = 57:62,
  lower       = round(intervals[1, 57:62], 2),
  upper       = round(intervals[2, 57:62], 2),
  contains_27 = covers[57:62]
)
#>   study lower upper contains_27
#> 1    57 21.77 30.52        TRUE
#> 2    58 23.96 32.48        TRUE
#> 3    59 20.91 29.38        TRUE
#> 4    60 27.16 35.27       FALSE
#> 5    61 22.14 29.55        TRUE
#> 6    62 23.01 31.32        TRUE
```

Now apply the popular reading to study 60: what is the probability that 27 lies between 27.16 and 35.27? It is 0. Not 5%. Both numbers are printed right there and 27 is below the lower one.

Apply it to study 59, which runs from 20.91 to 29.38, and the probability is 1. Every row in that table is settled. The `contains_27` column holds no 0.95 anywhere, only TRUE and FALSE.

The randomness was real, but it happened one move earlier, when the 20 deliveries were sampled. Before you draw the sample, there is a 95% probability that the interval you are about to build will contain the true average. Once the sample is drawn and the two numbers are printed, that probability no longer applies, and what is left is a pair of numbers that either bracket the true average or do not.

That is exactly the position the shop is in. Its interval, 22.44 to 30.16, is one row of that table with the last column hidden.

[KEY INSIGHT]
Say "95% of intervals built this way contain the true average", not "there is a 95% chance the true average is in this one". The first describes the procedure, which is where the 95% comes from. The second describes a result that is already decided.

=== step === widget
## The interval for the average is not the range the deliveries fall in

Now let's look at the other popular reading, that 95% of deliveries land between 22.44 and 30.16. This one we can settle by counting, because all 20 delivery times are still here.

```r
# Count the recorded times inside the interval, then build the interval for one more delivery
ci <- t.test(delivery)$conf.int[1:2]
sum(delivery >= ci[1] & delivery <= ci[2])
#> [1] 5

pred_margin <- qt(0.975, df = 19) * sd(delivery) * sqrt(1 + 1 / 20)
round(c(lower = mean(delivery) - pred_margin, upper = mean(delivery) + pred_margin), 2)
#> lower upper
#>  8.61 43.99
```

5 of the 20 recorded times fall inside the interval. If the 95% were about deliveries, that number would have been 19. The interval was never a statement about individual delivery times, only about where the average sits.

If the range a single next delivery could land in is what you want, that is a **prediction interval**, and it needs a different formula. It carries two sources of variation instead of one: the uncertainty about the average, and the delivery-to-delivery spread, which no amount of extra data removes. That second piece is the `1 +` inside the square root above, and it takes the range out to 8.61 to 43.99 minutes, about 4.5 times wider than the interval for the average.

The two intervals also behave differently as data piles up. The chart below shows how, on its own built-in data: a fitted line through a scatter rather than a single average. Read the green confidence band as the interval for the average, and the orange prediction band as the range for one new value. Drag the sample size.

::widget regression-intervals {}

Push n from 20 up to 300 and the green band collapses onto the line, its half-width falling to roughly a quarter of what it was. The orange band barely moves.

More deliveries pin down the average. They do nothing at all about how much one delivery time varies from the next.

=== step === widget
## Building the interval by resampling the 20 deliveries

Everything so far leaned on a population we invented, with its true average of 27 and its standard deviation of 8.5. A real shop has none of that. It has 20 numbers.

There is a way to get an interval out of those 20 numbers with no formula for the standard error at all. Treat the 20 recorded times as a stand-in for the population, and draw a fresh sample of 20 from them **with replacement**. Some times get picked twice, some do not get picked at all. That is a **bootstrap resample**.

The strip below draws one resample from the 20 rows so you can see which times get duplicated and which drop out. Press Draw again a few times.

::widget bootstrap-sample {"n": 20, "seed": 5, "tail": "The grey ones are the deliveries this resample left out; draw again and a different set drops out."}

About 7 of the 20 sit out any given draw, and a few others turn up twice. Each resample is therefore a slightly different evening's data, built entirely out of times the shop actually recorded.

Do that 10,000 times, take the average of each resample, and the middle 95% of those 10,000 averages is the interval.

```r
# Resample the 20 delivery times 10,000 times and take the middle 95% of the averages
set.seed(7)
boot_means <- replicate(10000, mean(sample(delivery, replace = TRUE)))

quantile(boot_means, c(0.025, 0.975))
#>  2.5% 97.5%
#> 22.90 29.95
sd(boot_means)
#> [1] 1.80845
```

The resampled interval runs from 22.90 to 29.95, against 22.44 to 30.16 from the formula. Two constructions that share nothing but the 20 delivery times agree to within half a minute at each end.

The last line is worth a look too. The standard deviation of the 10,000 resample averages is 1.808, against the standard error of 1.844 that came out of `sd(delivery) / sqrt(20)`. The resampling arrives at the same quantity by shuffling data rather than by algebra.

That is what makes it useful. The t formula needs the sample average to be roughly normally distributed, and it needs a standard error you can write down. Resampling needs neither, so it still works for a median, a trimmed mean or a ratio, where the algebra runs out.

=== step === quiz
## Quick check: which reading of 22.4 to 30.2 is right?

The shop wants one sentence for its dashboard, next to the 22 to 30. Which one is true?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- About 95% of our deliveries take between 22 and 30 minutes. ::no
- There is a 95% probability that our true average delivery time is between 22 and 30 minutes. ::no
- If we repeated last night's study many times, about 95% of the intervals we built would contain our true average delivery time. ::ok Right, and it is the only one of the four that describes the procedure rather than the answer. It is also the only one the 95 grey segments out of 100 actually demonstrate.
- Our true average delivery time is 26.3 minutes. ::no The first option is refuted by the data itself: only 5 of the 20 recorded times fall inside 22.44 to 30.16, because the interval is about the average, not about single deliveries. The second attaches a probability to two numbers that are already printed and already right or wrong. The last drops the uncertainty altogether, because 26.3 is one evening's estimate of the true average, not the true average.

=== step === tryit
## Your turn: what does a 99% interval change?

Three objects are still in memory: `intervals`, the 100 studies at 95%; `delivery`, the shop's 20 times; and `boot_means`, the 10,000 resample averages.

Raise the confidence level to 99% in all three places. Rebuild the 100 studies with `conf.level = 0.99` and count how many contain 27. Rebuild the shop's own interval at 99%. Then take the 0.5th and 99.5th percentiles of `boot_means` in place of the 2.5th and 97.5th.

Watch two things as you go: how many studies now cover 27, and what happens to the width.

```r
# Rebuild the 100 studies, the shop's interval and the percentile interval at 99%
# intervals holds the 100 studies at 95%, delivery holds the 20 times,
# and boot_means holds the 10,000 resample averages.
# Keep set.seed(22) so the 100 studies are the same ones as before.
# Press Check when you have all three.
```
::check {"regex": "conf\\.level\\s*=\\s*0?\\.99", "gate": true, "difficulty": "intermediate", "ok": "Yes. 99 of the 100 studies now contain 27, up from 95. The shop's interval widens from 22.44 to 30.16 out to 21.02 to 31.58, and the resampled one from 22.90 to 29.95 out to 21.95 to 31.10. Higher coverage is paid for in width, always.", "no": "Pass conf.level = 0.99 to t.test() in both places, and swap c(0.025, 0.975) for c(0.005, 0.995) in the quantile() call."}
::solution
```r
# Raise both constructions to 99% and read the coverage and the width together
set.seed(22)
intervals99 <- replicate(100, t.test(rnorm(20, mean = 27, sd = 8.5),
                                     conf.level = 0.99)$conf.int[1:2])
sum(intervals99[1, ] <= 27 & intervals99[2, ] >= 27)
#> [1] 99

t.test(delivery, conf.level = 0.99)$conf.int[1:2]
#> [1] 21.02429 31.57571

quantile(boot_means, c(0.005, 0.995))
#>     0.5%    99.5%
#> 21.95000 31.10025
```

Coverage went from 95 of 100 to 99 of 100, and the shop's margin grew from 3.86 minutes to 5.28.

Notice how differently the same change works in the two constructions. In the t interval, 99% is a bigger multiplier: `qt(0.995, 19)` is 2.861 where `qt(0.975, 19)` was 2.093. In the resampling, 99% is just a wider pair of percentiles off the same 10,000 averages. One lever moves two different mechanisms, and both buy coverage with width.

Push the level all the way to 100% and the interval stretches from minus infinity to plus infinity. It contains the true average every single time, and it tells the shop nothing. The 99% move here is a small version of that same trade.

=== step === concept
## References

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defined the confidence interval, with the repeated-sampling reading built into the definition.
- [The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23(1), 103-123. Takes apart the "95% chance the true value is in here" reading in full.
- [Robust misinterpretation of confidence intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21(5), 1157-1164. 120 researchers and 442 students were handed six statements about one interval, all six false, and both groups endorsed more than three on average.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Misinterpretations 19 to 23 are the confidence-interval ones, each stated and then corrected.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You built a confidence interval from 20 delivery times by hand, then checked its label by running the study 100 times and counting. What came out of that:

- The interval is the sample average plus and minus a margin: 26.3 plus or minus 3.86 minutes, giving 22.44 to 30.16. The margin is the standard error, 1.844, times the t multiplier, 2.093.
- The 95% is a count of intervals across repeated samples. You counted 95 of 100 covering the true average of 27.
- One computed interval carries no probability of its own. Study 60 ran from 27.16 to 35.27 and missed 27 outright, and no row of that table was ever 95% anything.
- The interval is about the average, not about single deliveries. Only 5 of the 20 recorded times fall inside it, while the range for one delivery runs from 8.61 to 43.99.
- Resampling the 20 times 10,000 times gave 22.90 to 29.95, within half a minute of the formula at both ends, with no standard error formula anywhere in it.
- Raising the level to 99% lifted coverage to 99 of 100 and widened the shop's interval to 21.02 to 31.58. Coverage costs width.

So when someone asks what the 22 to 30 means:

"If the shop repeated last night's study many times, about 95% of the intervals built this way would contain its true average delivery time."

That is the sentence, and you have now watched every word of it get counted out. Nicely done.
