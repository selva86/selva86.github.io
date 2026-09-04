---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not a 95% chance the true average sits inside it. Build intervals from samples of delivery times and count what the 95% counts."
keywords: "confidence intervals, what a confidence interval means, 95% confidence interval, confidence interval interpretation, coverage, standard error, confidence interval in R, bootstrap confidence interval"
mathjax: true
webr: true
date: "2026-09-04"
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

Today we are going to work out what the 95% in a confidence interval is actually counting.

Here is the setting. A pizza shop wants to know how long its deliveries take. Nobody is going to sit down and time all 5,000 orders from last quarter, so an analyst times 40 of them on one shift. The average comes to 27.30 minutes, and next to it goes a 95% confidence interval of 24.85 to 29.75 minutes.

The shop owner reads that line and takes it one of two ways. Either 95% of pizzas arrive between 24.85 and 29.75 minutes, or there is a 95% chance the shop's real average is somewhere in that stretch.

Both readings are wrong. The second one is wrong in a way that is genuinely hard to see. When researchers have been handed that same sentence and asked to judge it, they have accepted it about as often as first-year students did.

So we are not going to memorise a definition. We are going to build these intervals ourselves, over and over, from a shop whose true average delivery time we already know, and count what the 95% is counting.

::widget process-flow {"steps":[{"title":"Time 40 deliveries","sub":"build one interval for the average from that single sample"},{"title":"Do it again on fresh samples","sub":"another 40 deliveries, another interval, a hundred times over"},{"title":"Count the hits","sub":"how many of those intervals contain the true average of all 5,000 orders"}]}

That is the whole plan. Everything after this is carrying it out and reading the counts.

=== step === concept
## The 40 timed deliveries and the average we do not know

Two numbers matter here, so let's put both of them on the screen.

The first is the shop's true average delivery time across all 5,000 orders. In real work you never see this number, which is the entire reason confidence intervals exist. Here we build those 5,000 deliveries ourselves, so we can check every answer against the truth later on.

The second is the mean of the 40 deliveries timed today. That one you always see.

Press Run.

```r
# Build the quarter's 5,000 delivery times, then time 40 of them today
set.seed(42)
delivery_times <- round(6 + rgamma(5000, shape = 6, rate = 0.3))

set.seed(3)
today <- sample(delivery_times, 40)

c(true_average = mean(delivery_times), sample_mean = mean(today))
#> true_average  sample_mean
#>      25.9526      27.3000
```

`rgamma()` draws right-skewed numbers, which is what delivery times look like in practice: most orders land in the twenties, with a thin tail of slow ones behind them. `set.seed()` fixes the random draw, so your numbers match mine.

The shop's true average is 25.95 minutes. Today's 40 deliveries came to 27.30. So the sample mean is 1.35 minutes too high.

Now look at what the analyst actually holds.

```r
# Show the 40 timed deliveries with their mean marked
hist(today, breaks = 12, col = "grey85", border = "white",
     main = "40 deliveries timed today",
     xlab = "Delivery time in minutes")
abline(v = mean(today), col = "red", lwd = 3)
```

The 40 times run from 12 minutes to 48, piled up in the low twenties. The red line is 27.30, today's mean.

Nothing in that picture flags the 1.35-minute error. There is no warning sign to spot, because a sample that lands high looks exactly like a sample that lands low. So quoting 27.30 on its own overstates what the analyst knows. The truthful report is 27.30 plus or minus some amount, and a confidence interval is how that amount gets worked out.

To work it out, we first need to know how far the mean of 40 deliveries tends to stray from the truth.

=== step === concept
## The standard error: how much a sample mean moves

Today's 40 deliveries gave 27.30. Another 40 would have given something else. How much else is the question, and we can answer it exactly here because we have all 5,000 deliveries in hand.

Draw 40 of them, take the mean, and do that 2,000 times.

```r
# Draw 2,000 fresh samples of 40 and collect the mean of each one
set.seed(5)
many_means <- replicate(2000, mean(sample(delivery_times, 40)))

hist(many_means, breaks = 40, col = "grey85", border = "white",
     main = "2,000 samples of 40, one mean each",
     xlab = "Sample mean in minutes")
abline(v = mean(delivery_times), col = "red", lwd = 3)

c(spread_of_the_means = sd(many_means),
  population_sd       = sd(delivery_times),
  sd_over_sqrt_n      = sd(delivery_times) / sqrt(40))
#> spread_of_the_means       population_sd      sd_over_sqrt_n
#>            1.321462            8.277515            1.308790
```

The 2,000 means run from 21.9 up to 30.9 minutes, in a tidy pile centred on the true average of 25.95. Today's 27.30 is an ordinary member of that pile, a little to the right of the middle.

Their standard deviation is 1.32 minutes. That number has a name: the **standard error** of the mean. It is the typical distance between a sample mean and the true average, and it is the single quantity every confidence interval is built from.

Now read the other two numbers. Individual deliveries scatter with a standard deviation of 8.28 minutes, and 8.28 divided by the square root of 40 comes to 1.31. The spread we measured by brute force and the number the formula gives are the same. That is what makes the formula worth having: you do not need 2,000 repeats to know how far a mean strays, because dividing by the square root of the sample size gets you there directly.

There is one catch, and it is the practical one. That formula needs the standard deviation of all 5,000 deliveries, and the analyst has 40. So the sample's own standard deviation stands in for it.

```r
# Compute the standard error from the 40 timed deliveries alone
se <- sd(today) / sqrt(40)

c(sample_sd = sd(today), se = se)
#> sample_sd        se
#>  7.656738  1.210637
```

The 40 deliveries have a standard deviation of 7.66, a little under the true 8.28, so the standard error comes out at 1.21 instead of 1.31. Close, and this one is computed entirely from numbers the analyst actually has.

[NOTE]
The standard error is not the spread of the deliveries. Deliveries scatter by about 8 minutes. The mean of 40 of them scatters by about 1.2 minutes. Averaging 40 numbers steadies the result, and the standard error measures exactly how much.

=== step === concept
## How to build a 95% interval from one sample

A confidence interval for a mean is the sample mean with a margin added on each side, and the margin is a multiple of the standard error.

\[ \bar{x} \pm t \times \frac{s}{\sqrt{n}} \]

There are three pieces, and we have two of them already. The sample mean is 27.30. The standard error, written here as the sample standard deviation over the square root of the sample size, is 1.21.

The third piece is the multiplier `t`, which sets how many standard errors wide to go. For 95%, you want a margin that leaves 2.5% of the spread hanging off each end, and `qt(0.975, df = 39)` gives exactly that cut-off. The `df` argument is the degrees of freedom, which for a single sample is the sample size minus one, so 39 here.

```r
# Build the 95% interval by hand from the mean, the standard error and t
t_star <- qt(0.975, df = 39)
margin <- t_star * se

c(t = t_star, margin = margin,
  lower = mean(today) - margin, upper = mean(today) + margin)
#>         t    margin     lower     upper
#>  2.022691  2.448744 24.851256 29.748744
```

So `t` is 2.0227, and the margin is 2.45 minutes. Take 2.45 off 27.30 and you get 24.85. Add it and you get 29.75.

You may have expected 1.96 there rather than 2.0227. The 1.96 multiplier is the right one when you know the population standard deviation. We do not know it, so we put the sample's own 7.66 in its place, and that swap adds a little uncertainty. The t multiplier is slightly wider to pay for it, and it widens further the smaller the sample gets.

In practice nobody computes this by hand, because `t.test()` does the same arithmetic.

```r
# Get the same interval straight from t.test()
today_ci <- t.test(today)$conf.int
round(as.numeric(today_ci), 2)
#> [1] 24.85 29.75
```

Same two numbers. Whichever route you take, the interval on the report is 24.85 to 29.75 minutes.

=== step === widget
## The interval for the average is not the range where deliveries land

Read 24.85 to 29.75 out loud and it sounds like a statement about pizzas: most of them turn up between roughly 25 and 30 minutes. It is not. It is a statement about one quantity, the shop's average, and the difference between the two is much larger than it looks.

Since we have all 5,000 deliveries, we can put the two ranges side by side.

```r
# Compare the interval for the average with where single deliveries land
round(as.numeric(today_ci), 2)
#> [1] 24.85 29.75

quantile(delivery_times, c(0.025, 0.975))
#>  2.5% 97.5%
#>    13    45
```

The middle 95% of individual deliveries runs from 13 minutes to 45, a stretch 32 minutes wide. The interval for the average is 4.9 minutes wide. One is more than six times the other.

That gap is the standard error at work. A single delivery carries the full 8.28-minute scatter of the shop's kitchen and the traffic outside it. The mean of 40 deliveries averages most of that scatter away, so it can be pinned down far more tightly than any one order can.

The two bands below are those two ranges. They are drawn on a regression example with its own built-in data rather than on the delivery times, so read the colours here and not the axis numbers. Green is the interval for the average, standing in for our 24.85 to 29.75. Orange is the range where a single new observation lands, standing in for our 13 to 45. Drag the sample size and watch which one moves.

::widget regression-intervals {}

Push the sample size up and the green band collapses onto the line, while the orange band barely narrows at all. Timing more deliveries pins down the average. It does not make any single delivery arrive faster or more predictably, so the range where one order lands stays roughly where it is no matter how much data you collect.

=== step === concept
## What the 95% counts: 100 samples, 100 intervals

We have one interval, 24.85 to 29.75, and a 95% stamped on it. The 95% is not a measurement taken from that interval. It is a count taken across many of them, so to see it we have to build many.

Take a fresh sample of 40, build its interval, and repeat 100 times. Then check each interval against the true average of 25.95.

```r
# Build 100 intervals from 100 fresh samples and count how many contain 25.95
true_avg <- mean(delivery_times)

set.seed(1)
ints     <- replicate(100, t.test(sample(delivery_times, 40))$conf.int)
contains <- ints[1, ] <= true_avg & ints[2, ] >= true_avg

sum(contains)
#> [1] 95

plot(c(min(ints), max(ints)), c(1, 100), type = "n",
     xlab = "Interval in minutes", ylab = "Sample number",
     main = "100 samples of 40, one interval each")
segments(ints[1, ], 1:100, ints[2, ], 1:100,
         col = ifelse(contains, "grey60", "red"), lwd = 2)
abline(v = true_avg, col = "blue", lwd = 2)
```

Every horizontal line is one interval, built from its own 40 deliveries. The blue vertical line is the true average, 25.95, and 95 of the intervals cross it. The other five sit entirely to one side and never touch it, and those are the red ones.

That is the 95%. It is the share of intervals, built this way from repeated samples, that contain the true value. The standard name for it is **coverage**.

A hundred repeats is a small count, so let's run it 2,000 times and take the share.

```r
# Repeat the same build 2,000 times and take the share that contain the true average
set.seed(31)
covered <- replicate(2000, {
  s      <- sample(delivery_times, 40)
  one_ci <- t.test(s)$conf.int
  one_ci[1] <= true_avg && one_ci[2] >= true_avg
})

mean(covered)
#> [1] 0.949
```

That comes to 0.949, near enough to the 0.95 the procedure is built for.

Now look again at the five red lines. Those five samples of 40 were unlucky: they happened to come in high or low, and the interval built around them landed clear of the truth. Nothing about them was visibly different. Each one came from an ordinary shift with ordinary numbers, and the analyst who drew it would have written up their interval with exactly the same confidence.

[KEY INSIGHT]
The 95% belongs to the procedure, not to any one interval. Time 40 deliveries, build an interval this way, and repeat: about 95 in every 100 of those intervals will contain the true average. Which five miss is not knowable in advance.

=== step === quiz
## Quick check: what does the 95% attach to?

The shop reports an average of 27.30 minutes with a 95% confidence interval of 24.85 to 29.75. Which sentence says what the 95% means?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 95% of the deliveries this shop makes take between 24.85 and 29.75 minutes. ::no
- There is a 0.95 probability that the true average lies between 24.85 and 29.75. ::no
- Time 40 deliveries and build an interval this way over and over, and 95% of those intervals will contain the true average. ::ok That is it. It is a count taken across repeated samples, and you measured it: 95 of 100 intervals contained 25.95, and the share settled at 0.949 over 2,000 repeats.
- Whenever this interval gets printed in a report, it is correct 95% of the time. ::no Each of the three wrong answers pins the 95% to the wrong thing: to the deliveries, to the true average, or to the report. It belongs to the procedure that built the interval. Repeat that procedure on fresh samples of 40 and about 95 in every 100 intervals will contain the true average of 25.95.

=== step === concept
## What the 95% does not say about your one interval

The interval on your desk is 24.85 to 29.75, and in this shop we happen to know the true average is 25.95. So check the obvious thing about the interval you actually have.

```r
# Check whether the one interval we built contains the true average
c(lower = today_ci[1], upper = today_ci[2], true_average = true_avg)
#>        lower        upper true_average
#>     24.85126     29.74874     25.95260

today_ci[1] <= true_avg && today_ci[2] >= true_avg
#> [1] TRUE
```

TRUE. Not 0.95, not 95%. Had today's sample been one of the five unlucky ones, the same line would have printed FALSE. There is no third answer available.

That is why the probability reading fails. Once the sample is drawn and the arithmetic is done, the interval is two fixed numbers and the true average is one fixed number. One either sits inside the other or it does not. The randomness was all in the sampling, and the sampling is over. The 95% describes the method that produced the interval, not the interval sitting in front of you.

Which raises a fair question: is there any interval that does carry a probability about the true value? Yes, and it is a different object. A **credible interval**, from Bayesian statistics, is read as "given this data, there is a 95% probability the true average lies between these two numbers". That reading is available because the method treats the unknown average as a quantity with a distribution, which means you have to supply a prior, a statement of what you believed about delivery times before timing any. A confidence interval needs no prior, and it does not support that reading.

[WARNING]
A computed confidence interval either contains the true value or it does not. Writing "there is a 95% chance the average is between 24.85 and 29.75" attaches a Bayesian sentence to a frequentist calculation, which is the most common mistake made with these intervals.

=== step === concept
## What makes a confidence interval narrower

The width of the interval is twice the margin, so it is `2 * t * se`. Since the standard error divides by the square root of the sample size, the width does too.

Hold the sample standard deviation fixed at the 7.66 we measured, and vary only how many deliveries get timed.

```r
# Interval width at four sample sizes, holding the sample sd at 7.66
sample_sd <- sd(today)
sizes     <- c(10, 40, 160, 640)
widths    <- 2 * qt(0.975, sizes - 1) * sample_sd / sqrt(sizes)

data.frame(n = sizes, width_in_minutes = round(widths, 2))
#>     n width_in_minutes
#> 1  10            10.95
#> 2  40             4.90
#> 3 160             2.39
#> 4 640             1.19
```

At 10 deliveries the interval is almost 11 minutes wide, which tells the shop very little. At 40 it is 4.90. Then look at the pattern down the column: each row multiplies the sample size by 4 and roughly halves the width. Going from 40 to 160 means timing four times as many deliveries for twice the precision, and 160 to 640 does the same again. That ratio, four times the data for half the width, comes straight from the square root in the standard error, and it does not get any better at larger sample sizes.

The other knob is the confidence level itself, which changes the width and nothing else.

```r
# Interval width at three confidence levels, on the same 40 deliveries
conf_levels <- c(0.80, 0.95, 0.99)
bounds      <- sapply(conf_levels, function(cl) t.test(today, conf.level = cl)$conf.int)

data.frame(confidence = conf_levels,
           lower = round(bounds[1, ], 2),
           upper = round(bounds[2, ], 2),
           width = round(bounds[2, ] - bounds[1, ], 2))
#>   confidence lower upper width
#> 1       0.80 25.72 28.88  3.16
#> 2       0.95 24.85 29.75  4.90
#> 3       0.99 24.02 30.58  6.56
```

It is the same 40 deliveries and the same estimate of 27.30 minutes, with three different widths. Asking for 99% coverage instead of 95% does not make the estimate better. It widens the interval from 4.90 minutes to 6.56 so that fewer intervals built this way miss the true average.

[TIP]
The two knobs do different jobs. Sample size narrows the interval for real, and the only way to turn that knob is to time more deliveries. Confidence level sets how widely you draw the interval around the 40 you already have, and 95% is a convention rather than a law.

=== step === widget
## Building a confidence interval without the formula

Everything so far ran through one formula. There is a second route that uses no formula at all, and on this data it lands in almost the same place.

The idea is to reuse the 40 deliveries in hand. Draw 40 of them **with replacement**, which means each pick comes from the full 40 every time, so some deliveries get picked twice or three times and others get left out entirely. That gives you a slightly different set of 40, and a slightly different mean. Do it 2,000 times and you have 2,000 means to work with.

The strip below is one such draw. Press Draw again to take another.

::widget bootstrap-sample {"n": 40, "seed": 5, "tail": "Each row here is one of the 40 timed deliveries, and the grey ones are the times this draw left out."}

Every draw picks 40 rows out of the same 40. Blue rows got picked more than once, green rows exactly once, and grey rows not at all. On average roughly 37 rows in every 100 get left out, and the note under the strip counts them for the draw you are looking at. The widget labels those grey ones out-of-bag, which is the standard name for the rows a resample leaves behind.

Now do that 2,000 times and keep the mean of each draw.

```r
# Resample the 40 timed deliveries 2,000 times and take the middle 95% of the means
set.seed(13)
boot_means <- replicate(2000, mean(sample(today, 40, replace = TRUE)))

hist(boot_means, breaks = 40, col = "grey85", border = "white",
     main = "2,000 resamples of the same 40 deliveries",
     xlab = "Resampled mean in minutes")

round(quantile(boot_means, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#> 24.98 29.60
```

Chop off the lowest 2.5% of those means and the highest 2.5%, and what remains runs from 24.98 to 29.60 minutes. The formula gave 24.85 to 29.75. The two agree to within a fifth of a minute, and this route never touched `t`, `qt()` or the number 39.

It is worth being clear about what resampling does. It draws no new deliveries. Every number in every resample was already among the 40, and no fresh information entered anywhere. What it measures is how much the mean of 40 wobbles when the 40 change, which is precisely the quantity the standard error estimates. The two routes agree because they are estimating the same thing.

[NOTE]
This is the **bootstrap**, and an interval built from the middle 95% of resampled means is a **percentile bootstrap interval**. It is the route to reach for when the formula is awkward: a statistic with no neat standard error, or a small skewed sample you would rather not push through a t interval.

=== step === quiz
## Quick check: reading a 95% interval correctly

You are writing one line about the 40 timed deliveries for the shop owner, who will read it and make decisions from it. Which line is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The average delivery takes 27.30 minutes, and there is a 95% probability the true average is between 24.85 and 29.75. ::no
- We timed 40 deliveries. The average came to 27.30 minutes, with a 95% confidence interval of 24.85 to 29.75 minutes. Intervals built this way contain the true average about 95% of the time. ::ok Right. It gives the estimate, gives the interval, and says what the 95% counts, without claiming a probability for this particular pair of numbers.
- The average delivery takes 27.30 minutes, and 95% of deliveries arrive between 24.85 and 29.75 minutes. ::no
- The interval should be reported as 24.98 to 29.60, because the resampled version does not depend on a formula. ::no The three wrong lines go astray in three different directions. The first hands the 95% to the true average as a probability, which a computed interval cannot carry. The second hands it to the deliveries, whose middle 95% actually runs from 13 to 45 minutes. The third treats one route as more correct than the other, when 24.85 to 29.75 and 24.98 to 29.60 are two estimates of the same thing and they agreed.

=== step === tryit
## Your turn: coverage at 90%

Over 2,000 samples, the 95% procedure covered the true average 0.949 of the time. A 90% interval should cover it less often. The question is whether it misses by exactly the amount the level states.

Only the multiplier changes. For 90% you want 5% hanging off each end rather than 2.5%, so the cut-off is `qt(0.95, 39)` instead of `qt(0.975, 39)`.

Build each 90% interval by hand inside the loop, return whether it contains `true_avg`, and print the share that did.

```r
# delivery_times holds all 5,000 deliveries and true_avg is their average, 25.95.
# Draw 2,000 samples of 40. In each one build a 90% interval by hand from the
# sample mean, the standard error and qt(0.95, 39), then return whether that
# interval contains true_avg. Fill the two blanks and print the share that did.
set.seed(50)
hits <- replicate(2000, {
  s <- sample(delivery_times, 40)
  ____
})
____
```
::check {"regex": "qt[(]\\s*0\\.95\\s*,[\\s\\S]*mean[(]\\s*hits", "gate": true, "difficulty": "intermediate", "ok": "0.894, which is close to 0.90 and clearly below the 0.949 you measured at 95%. A narrower interval misses more often, and by about the amount the level states.", "no": "The interval takes two lines. First the bounds: bound <- mean(s) + c(-1, 1) * qt(0.95, 39) * sd(s) / sqrt(40). Then the containment check to return: bound[1] <= true_avg && bound[2] >= true_avg. Finish outside the loop with mean(hits)."}
::solution
```r
# Measure the coverage of 2,000 hand-built 90% intervals
set.seed(50)
hits <- replicate(2000, {
  s     <- sample(delivery_times, 40)
  bound <- mean(s) + c(-1, 1) * qt(0.95, 39) * sd(s) / sqrt(40)
  bound[1] <= true_avg && bound[2] >= true_avg
})

mean(hits)
#> [1] 0.894
```

0.894, against the 0.949 measured at 95%. Drop the confidence level and you get a narrower interval, and you pay for it by missing the true average roughly twice as often. Neither setting is more correct than the other. They are two different choices about how often you are willing to be wrong.

=== step === concept
## References

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defined confidence in terms of long-run coverage in the first place.
- [Robust misinterpretation of confidence intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21, 1157-1164. Students and working researchers endorse the false readings at much the same rate.
- [The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23, 103-123. The three fallacies laid out one at a time, including the probability reading.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Twenty-five misreadings, catalogued and corrected.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You built confidence intervals from scratch, ran the procedure 2,000 times, and counted what the 95% actually counts. The short version:

- The shop's true average across all 5,000 deliveries is 25.95 minutes. The 40 timed today gave 27.30, off by 1.35, and nothing in the sample gave that away.
- The standard error, 1.21 minutes here, is how far the mean of 40 typically strays. The interval is the sample mean plus and minus about two of them, giving 24.85 to 29.75.
- That interval is for the average. The middle 95% of single deliveries runs from 13 to 45 minutes, more than six times wider.
- The 95% is coverage, measured across repeated samples: 95 of your 100 intervals contained 25.95, and 0.949 of 2,000 did.
- For the one interval you computed, containment came back TRUE. It is TRUE or FALSE, never 0.95.
- Four times the data roughly halves the width. A higher confidence level widens the interval and leaves the estimate alone.
- Resampling the same 40 deliveries gave 24.98 to 29.60 without using the formula at all.

So when someone asks what the 95% means, you can hand them the honest sentence:

"If we timed 40 deliveries again and again and built an interval each time, about 95 in every 100 of those intervals would contain the shop's true average. This is one of them, or it is one of the five that miss."

Very few people can say that correctly. You can now say it and show the count that proves it. Well done getting through this one.
