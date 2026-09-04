---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not a 95% chance the true average sits inside it. Build 100 intervals from repeated samples and count what the 95% counts."
keywords: "confidence intervals, what confidence intervals mean, 95% confidence interval, confidence interval interpretation, coverage, confidence interval in R, prediction interval, bootstrap confidence interval"
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
catalog_blurb: "What the 95% in a confidence interval counts, and what it does not."
---

=== step === cover
::eyebrow Inference from Zero
## Confidence intervals: what they really mean

Today let's work out what the 95% in a confidence interval is actually counting.

A pizza shop records how long every delivery takes. You ask the owner how long an average delivery runs, and instead of one number you get a range: about 22 to 30 minutes, quoted at 95% confidence.

Two readings of that 95% come to mind straight away. One is that 95% of deliveries arrive somewhere between 22 and 30 minutes. The other is that there is a 95% chance the true average delivery time lies between 22 and 30 minutes.

Neither one is what the 95% says. The second is the one almost everybody carries around, including people who compute these intervals every week.

So we are not going to memorise a definition. We are going to build the intervals ourselves out of the delivery times, and count what the 95% counts. There are only three steps to it.

::widget process-flow {"steps":[{"title":"Draw one night","sub":"take 25 deliveries at random from the shop records"},{"title":"Build the interval","sub":"build a 95% confidence interval for the average"},{"title":"Repeat 100 times","sub":"count how many of them contain the true average"}]}

Everything from here is doing those three things and reading what comes back.

=== step === concept
## One night of deliveries, and its 95% interval

Start with the data, since every number that follows is computed from it.

The shop has 2,000 past deliveries on record, each one a time in minutes. We are going to treat those 2,000 records as the entire population of deliveries. A real shop never has that. It is the only reason we can check our answers later, because the average of all 2,000 records is the true average delivery time, and we know it.

Delivery times are skewed. Most land in the twenties and thirties, a few run past an hour, and none can be negative. `rgamma()` draws numbers with exactly that shape, so the records behave like real delivery times rather than a tidy bell curve.

Out of those records we take one night: 25 deliveries, drawn at random. Those 25 deliveries are all a real shop would ever get to see.

Press Run.

```r
# Build the shop records, draw one night of 25 deliveries, and build the interval for it
set.seed(7)
records   <- round(rgamma(2000, shape = 7, rate = 0.27), 1)   # 2,000 past deliveries, in minutes
true_mean <- mean(records)

set.seed(56)
night <- sample(records, 25)

round(c(true_average = true_mean, night_average = mean(night)), 2)
#>  true_average night_average
#>         25.92         26.02

t.test(night)$conf.int
#> [1] 22.07518 29.95682
#> attr(,"conf.level")
#> [1] 0.95
```

The true average delivery time is 25.92 minutes. The 25 deliveries we drew average 26.02 minutes, which is close, though nothing guaranteed that.

`t.test()` builds the interval for us. Its `conf.int` component holds the two bounds, 22.08 and 29.96 minutes, and the `conf.level` attribute printed under them confirms that 95% is the default.

So one night gives us two things. A single number, 26.02, which is our best guess at the average. And a range, 22.08 to 29.96, which is what we report when we want to be honest about how far off that guess could be.

=== step === concept
## What the interval is made of

Those two bounds did not come out of nowhere. Every confidence interval for a mean is built from the same three pieces, and it is worth assembling this one by hand once.

$$\bar{x} \pm t_{n-1,\ 0.975} \times \frac{s}{\sqrt{n}}$$

Reading it left to right:

1. The sample mean, 26.02 minutes, sits at the centre of the interval.
2. The standard error, written `s / sqrt(n)`, is the sample standard deviation divided by the square root of the sample size, and it measures how much the average of 25 deliveries moves around from night to night.
3. The critical value is the multiplier that decides how many standard errors wide the interval is, and this is where the 95% enters.

The critical value comes from the t distribution, which is the normal curve with heavier tails. We need those heavier tails because the spread `s` was estimated from the same 25 deliveries rather than known in advance, and the smaller the sample the more that estimate can be off. The degrees of freedom, `n - 1`, is 24 here, and that number is what picks which t curve the multiplier is read from.

`qt(0.975, df = 24)` returns the point on that curve with 2.5% of the area above it. It is 0.975 and not 0.95 because a 95% interval leaves 2.5% out on each side.

```r
# Rebuild the same interval by hand from the mean, the critical value and the standard error
m <- mean(night)
s <- sd(night)
n <- length(night)

se     <- s / sqrt(n)
t_crit <- qt(0.975, df = n - 1)

round(c(mean = m, sd = s, se = se, t_crit = t_crit), 4)
#>    mean      sd      se  t_crit
#> 26.0160  9.5470  1.9094  2.0639

round(c(lower = m - t_crit * se, upper = m + t_crit * se), 3)
#>  lower  upper
#> 22.075 29.957
```

The 25 deliveries have a standard deviation of 9.547 minutes, so their average has a standard error of 9.547 divided by 5, which is 1.9094. Multiply that by 2.0639 and the half-width is 3.94 minutes. Take 3.94 off the mean and add it on, and you get 22.075 and 29.957, the same two numbers `t.test()` printed.

That 0.975 is the only place the 95% appears in the whole calculation. Ask for a higher level and the critical value grows.

```r
# Compare the critical value at 95% confidence against the one at 99%
round(c(t_at_95 = qt(0.975, df = n - 1), t_at_99 = qt(0.995, df = n - 1)), 4)
#> t_at_95 t_at_99
#>  2.0639  2.7969
```

The critical value is 2.7969 instead of 2.0639, applied to the same standard error, which makes the interval wider. In `t.test()` you ask for that with the `conf.level` argument.

[NOTE]
Older textbooks use 1.96 from the normal curve in place of the t critical value. At 25 deliveries that is 1.96 against 2.0639, an interval about 5% narrower than it should be, and one that contains the true average less than 95% of the time. `qt()` is right at every sample size, so default to it.

=== step === concept
## 100 nights, 100 intervals

One night gives you one interval, and one interval cannot tell you how often intervals like it are right. For that we need many nights.

So let's run the shop for 100 of them. Each night is 25 deliveries drawn from the records, exactly as before, and each night gets its own 95% interval built the same way. Because we know the true average is 25.92 minutes, we can check every one of the 100 intervals for one thing: does it contain 25.92?

```r
# Draw 100 separate nights and build a 95% interval from each one
set.seed(11)
cis <- replicate(100, t.test(sample(records, 25))$conf.int)
dim(cis)
#> [1]   2 100

covers <- cis[1, ] <= true_mean & cis[2, ] >= true_mean
sum(covers)
#> [1] 95

mean(covers)
#> [1] 0.95
```

`replicate()` runs the same draw-and-build 100 times and stacks the answers, so `cis` is a 2 by 100 matrix. The first row holds the 100 lower bounds and the second holds the 100 upper bounds.

`covers` compares each pair of bounds against 25.92, giving 100 answers of TRUE or FALSE, one per night. 95 of them are TRUE.

There it is. That count is the 95%.

=== step === concept
## Which of the 100 intervals miss the true average

A count is easy to nod along to. Let's draw all 100 intervals instead, one horizontal line each, with the true average running down the plot as a vertical line.

```r
# Plot the 100 intervals against the true average, with the misses in red
plot(range(cis), c(1, 100), type = "n",
     xlab = "Delivery time in minutes", ylab = "Night",
     main = "100 nights, 100 intervals")
segments(cis[1, ], 1:100, cis[2, ], 1:100,
         col = ifelse(covers, "grey65", "red"), lwd = 2)
abline(v = true_mean, lwd = 2)

which(!covers)
#> [1] 12 25 36 61 73
```

Every grey line crosses the vertical line, so every grey interval contains 25.92 minutes. The 5 red ones sit entirely to one side of it, and `which()` names them: nights 12, 25, 36, 61 and 73.

Now ask what was different about those 5 nights. Nothing was. They came from the same 2,000 records, the same random draw of 25 deliveries, the same `t.test()` call and the same formula. The only thing that varied from night to night was which 25 deliveries turned up.

That is why the 95% cannot belong to any one of these intervals. It belongs to the procedure that produced all 100: draw a sample, build an interval this way, and 95 times in 100 the interval you get contains the true average.

[KEY INSIGHT]
This also fixes what a single interval is worth. You never find out whether yours is one of the 95 or one of the 5, so the only guarantee you carry into a decision is the hit rate of the method that produced it.

=== step === quiz
## Quick check: what does the 95% describe?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It is a fact about the 100 intervals we just built: 95 of those particular 100 happened to contain 25.92. ::no
- There is a 95% probability that the true average delivery time lies inside any interval you compute. ::no
- Across repeated nights, 95% of the intervals built this way contain the true average delivery time. ::ok Yes. The 95% belongs to the procedure. Run it on a fresh night and you get fresh bounds, and 95 times in 100 those bounds contain 25.92.
- 95% of a night's deliveries land inside the interval. ::no The 95% is not a fact about one interval, and it is not about the deliveries. It is a hit rate for the method across repeated samples: build an interval this way night after night, and 95% of them contain the true average. Our 100 nights came in at 95, which is the count to expect from the method. Run a different 100 and that count shifts a little, but the 95% does not.

=== step === concept
## Why the 95% does not attach to the interval you have

The reading almost everyone reaches for is this one: there is a 95% chance the true average delivery time is between 22.08 and 29.96 minutes.

Here is why that sentence cannot be true.

The true average delivery time is 25.92 minutes. It is a fixed number. It was 25.92 before we drew a single delivery and it will be 25.92 tomorrow. Our interval, 22.08 to 29.96, is fixed too now that we have computed it. So either 25.92 sits between those bounds or it does not, and in this case it does. There is no 95% left over to hand out.

You might object that we only know 25.92 because we invented the records. That is fair. But not knowing a number does not make the number random. It makes you uncertain, and those are two different things.

And the bounds on your screen give you no clue which case you are in.

```r
# Line up two nights whose interval contains the true average against one that misses
data.frame(
  night   = 11:13,
  lower   = round(cis[1, 11:13], 2),
  upper   = round(cis[2, 11:13], 2),
  covered = covers[11:13]
)
#>   night lower upper covered
#> 1    11 21.02 27.96    TRUE
#> 2    12 26.92 33.78   FALSE
#> 3    13 21.94 31.02    TRUE
```

Night 12's interval misses and its two neighbours do not. Cover the `covered` column and try to tell which is which from the bounds alone. You cannot. The miss is not wider, or noisier, or flagged in any way. It is an ordinary interval that landed in the wrong place.

So when a report gives the average delivery time as 22.08 to 29.96 minutes at 95% confidence, read that as a statement about the method. The interval came out of a procedure that is right 95% of the time, and that is the whole claim.

[NOTE]
There is an interval that does carry a probability about the true value, and it is called a credible interval. It comes from Bayesian statistics, which starts from different assumptions and answers a different question. A confidence interval is not one of those.

=== step === widget
## Confidence interval for the average, prediction interval for one delivery

The other common reading is friendlier and just as wrong: 95% of deliveries arrive between 22.08 and 29.96 minutes.

That one we can check directly. The 2,000 records are every delivery the shop has made, so let's count how many of them fall between those bounds, and while we are here, build the range that would hold a single delivery.

```r
# Compare the range for the average delivery against the range for one single delivery
half_ci <- t_crit * se                      # half-width for the average delivery time
half_pi <- t_crit * s * sqrt(1 + 1 / n)     # half-width for one more delivery

round(c(half_ci = half_ci, half_pi = half_pi), 2)
#> half_ci half_pi
#>    3.94   20.09

round(c(lower = m - half_pi, upper = m + half_pi), 2)
#> lower upper
#>  5.92 46.11

mean(records >= m - half_ci & records <= m + half_ci)
#> [1] 0.311
```

31.1% of deliveries land between 22.08 and 29.96 minutes. Not 95%.

The interval was never about single deliveries. It is a range for the average, and the average of 25 deliveries moves far less than the deliveries themselves do. Dividing by the square root of 25 is what shrank it.

The range that does hold a single delivery has its own name: the prediction interval. It uses the same critical value, but multiplies the spread of individual deliveries, `s`, instead of the spread of their average. Here that is a half-width of 20.09 minutes rather than 3.94, giving 5.92 to 46.11 minutes.

That gap between 3.94 and 20.09 does not close as you collect more data, and the widget below shows why. It uses its own dataset rather than the shop records: each dot is one observation, the line is the fitted average, the green band is the confidence band for that average, and the orange band is the prediction band for one new observation. Read green as the range for the average delivery time and orange as the range for a single delivery.

::widget regression-intervals {}

Drag the sample size. At n = 20 the readout gives a confidence half-width of 0.30 against a prediction half-width of 1.35. Push it to 300 and confidence drops to 0.08 while prediction is still sitting at 1.34.

More data pins down the average, and that is all it does. How much one delivery differs from the next is a fact about the deliveries, and no amount of extra data changes it.

[WARNING]
The two ranges answer two different questions, so which one to report depends on which question was asked. How long does an average delivery take? Confidence interval. How long might my delivery take? Prediction interval. Quoting the first when someone meant the second promises a precision that is not there, by a factor of five in this case.

=== step === concept
## How to build an interval by resampling one night

Counting misses across 100 nights is what showed us the meaning of the 95%. It is also something you can never do at work. You get one night of deliveries, and you do not know the true average, which is the whole reason you wanted an interval in the first place.

So here is a second way to build one, out of those 25 deliveries alone.

Take the night's 25 delivery times and draw 25 of them at random with replacement. Some deliveries get picked twice, some not at all. That resample is a plausible alternative night of deliveries, assembled from the data you already have. Do it 2,000 times, take the mean each time, and you end up with 2,000 plausible values for the average delivery time. Cut off the lowest 2.5% and the highest 2.5%, and what remains is your interval.

The strip below is the 25 deliveries of the night, one box each. Draw a resample and every box reports what happened to that delivery: picked once, picked more than once, or not picked at all, which the widget labels out-of-bag.

::widget bootstrap-sample {"n":25,"tail":"Those deliveries sat out this resample, and a different set sits out the next one."}

On the first draw 8 of the 25 sit out, which is 32%. Press Draw again and that number moves around, but it stays near a third every time. Each delivery has a 96% chance of being skipped on any one of the 25 picks, and 0.96 multiplied by itself 25 times is 0.36.

Now let's do the whole thing 2,000 times in R.

```r
# Build a 95% interval from the one night alone, by resampling it with replacement
set.seed(3)
boot_means <- replicate(2000, mean(sample(night, replace = TRUE)))

round(quantile(boot_means, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#> 22.37 29.49
```

The bootstrap gives 22.37 to 29.49 minutes, against 22.08 to 29.96 from the formula. They are close, and close for a reason: both describe the same wobble in the same 25 numbers, one through algebra and one by brute force.

This is the percentile bootstrap. It is most useful when the statistic you care about has no clean formula for its standard error, like a median or a trimmed mean.

What it does not do is change the reading. A 95% bootstrap interval still comes out of a procedure built to contain the true value 95% of the time across repeated samples. Resampling gets you the bounds by a different route, not a different kind of 95%.

=== step === quiz
## Quick check: reading a reported interval

The shop reports a 95% interval for its average delivery time two ways: 22.08 to 29.96 minutes from the formula, and 22.37 to 29.49 minutes from the bootstrap. Which sentence reads either of them correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 95% of the shop's deliveries arrive between 22.08 and 29.96 minutes. ::no
- There is a 95% probability that the true average delivery time is between 22.08 and 29.96 minutes. ::no
- If the night were repeated many times and an interval built from each, 95% of those intervals would contain the true average delivery time. ::ok That is the reading, and it holds for both sets of bounds. The numbers change, the sentence does not.
- The bootstrap interval does carry that 95% probability, because it was built by resampling the actual deliveries instead of from a formula. ::no Three of these put the 95% somewhere it does not live. It is not a share of deliveries, since only 31.1% of the records fall between 22.08 and 29.96. It is not a probability attached to bounds you have already computed either, whichever route produced them, and the bootstrap resamples the same 25 deliveries so it inherits the same reading. The 95% is the share of intervals that contain the true average when you build them again and again.

=== step === tryit
## Your turn: rebuild the 100 nights at 99%

The 100 intervals are still in `cis`, built at 95% confidence, and 5 of them missed 25.92 minutes.

Suppose the shop wants to be surer than that. Rebuild the same 100 intervals with `conf.level = 0.99`, count how many of the new intervals contain `true_mean`, name the ones that still miss, and put the mean width of the new intervals beside the mean width of the old ones.

```r
# records, true_mean and cis are all still here.
# Rebuild the 100 nights with conf.level = 0.99 inside t.test(),
# then count the covers, name the misses, and put the two mean
# widths side by side.
# Press Check when you have it.
```
::check {"regex": "conf[.]level\\s*=\\s*0?[.]99", "gate": true, "difficulty": "beginner", "ok": "Right: 98 of the 100 contain the true average now, the misses drop from 5 to 2, and the mean width grows from 8.05 to 10.91 minutes. Higher confidence is bought with width.", "no": "Same 100 nights, one extra argument: t.test(sample(records, 25), conf.level = 0.99) inside the replicate() call."}
::solution
```r
# Rebuild the same 100 nights at 99% confidence and compare them against the 95% run
set.seed(11)
cis99 <- replicate(100, t.test(sample(records, 25), conf.level = 0.99)$conf.int)

covers99 <- cis99[1, ] <= true_mean & cis99[2, ] >= true_mean
sum(covers99)
#> [1] 98

which(!covers99)
#> [1] 61 73

round(c(width_99 = mean(cis99[2, ] - cis99[1, ]),
        width_95 = mean(cis[2, ] - cis[1, ])), 2)
#> width_99 width_95
#>    10.91     8.05
```

Now 98 of the 100 intervals contain the true average rather than 95, and the 2 that still miss, nights 61 and 73, were already among the 5 that missed before. Nothing about the shop changed. We asked for intervals wide enough to be wrong less often, and paid 2.86 minutes of average width for it.

=== step === concept
## References

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defined a confidence interval by its coverage across repeated samples.
- [The Fallacy of Placing Confidence in Confidence Intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23(1), 103-123. Why the probability reading is so hard to shake, and what a credible interval does instead.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. The confidence-interval misreadings, catalogued and corrected one at a time.
- [Confidence intervals and replication: where will the next mean fall?](https://doi.org/10.1037/1082-989X.11.3.217) - Cumming and Maillardet (2006), Psychological Methods 11(3), 217-227. How often the mean of a repeat study lands inside the first study's 95% interval, which is not 95%.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You built a confidence interval by hand, then built 100 more and checked every one of them against the truth. Pulling it together:

- One night of 25 deliveries gave a 95% interval of 22.08 to 29.96 minutes, which is the sample mean 26.02 plus and minus a half-width of 3.94.
- Build one interval from each of 100 nights and 95 of them contained the true average, 25.92 minutes. That count is what the 95% names.
- 5 of them missed, at nights 12, 25, 36, 61 and 73, and nothing in their bounds gave them away.
- The interval is for the average, not for one delivery. Only 31.1% of the shop's deliveries fall between 22.08 and 29.96, and the range that holds a single delivery runs from 5.92 to 46.11 minutes.
- Asking for 99% instead of 95% cut the misses from 5 to 2 and widened the average interval from 8.05 to 10.91 minutes.

So when someone puts a 95% confidence interval in front of you, here is the sentence to say back:

"If we collected the data again and again and built an interval each time, 95% of those intervals would contain the true value. This is one of them, and the bounds cannot tell us whether it is one of the 95 or one of the 5."

That is a smaller claim than most people think they are making, and it is the one the arithmetic supports. Congratulations, you made it through.
