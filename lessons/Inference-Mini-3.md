---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not a 95% chance of anything. Build one yourself from 25 delivery times, then build 100 more, and count what the 95% counts."
keywords: "confidence interval, what a confidence interval means, 95% confidence interval, confidence interval interpretation, coverage, t.test in R, margin of error, standard error"
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
catalog_blurb: "What the 95% in a confidence interval counts, and what it does not."
---

=== step === cover
## Confidence intervals: what they really mean

Today let us take a confidence interval apart and find out what its percentage is actually counting.

A pizza shop near your office wanted to know how long its deliveries take. The manager timed 25 of them, did some arithmetic on those 25 numbers, and put a line on the delivery page: average delivery 22 to 30 minutes, 95% confidence.

The two numbers are the easy part. They come straight out of the 25 timings, and you will work them out yourself in a minute.

The 95% is where it gets slippery. Ask three people what it refers to and you get three answers: that 95% of pizzas land inside that window, that the true average has a 95% chance of sitting in there, or something vague about being 95% sure.

Every one of those puts the 95% on the wrong thing. What it counts is intervals, plural, and one interval on a delivery page is exactly the wrong place to see that.

So we are not going to memorise a definition. We are going to build the shop's interval from its 25 orders, then build 100 more from fresh samples of 25, and count.

::widget process-flow {"steps":[{"title":"Build one interval from 25 orders","sub":"from their average and how much they vary"},{"title":"Repeat the sampling 100 times","sub":"a fresh sample of 25 orders gives a fresh interval each time"},{"title":"Count how many contain the true average","sub":"that count is what the 95 percent refers to"}]}

Three steps, and the count in the last one is what the 95% refers to.

=== step === concept
## The 25 delivery times behind the claim

Let us set up the data first, because every number from here on comes out of it.

We need two things: the 25 orders the manager actually timed, and the true average delivery time of the shop. In real life you only ever get the first one. The whole reason confidence intervals exist is that the second one is unknown.

So we will simulate a full year for this shop, 5,000 deliveries, and then draw the manager's 25 orders out of those 5,000. That way we know the true average, and later we can check our intervals against it.

`rnorm(5000, mean = 27, sd = 9)` draws 5,000 delivery times from a normal distribution centred at 27 minutes with a standard deviation of 9 minutes, and `round(..., 1)` keeps them to one decimal, the way a delivery app would record them.

Press Run.

```r
# Build one shop's year of deliveries, then the 25 orders the manager timed
set.seed(1)
year <- round(rnorm(5000, mean = 27, sd = 9), 1)

set.seed(1128)
orders <- sample(year, 25)

round(c(year_average = mean(year), year_sd = sd(year)), 2)
#> year_average      year_sd
#>        26.97         9.24

round(c(orders_average = mean(orders), orders_sd = sd(orders)), 3)
#> orders_average      orders_sd
#>         26.008          9.735

range(orders)
#> [1]  7.8 53.3
```

`set.seed()` fixes the random number generator, so your numbers match mine exactly.

The true average of the year's 5,000 deliveries is 26.97 minutes. Hold on to that number, because it is what every interval we build is meant to contain, and it is the one number the manager never gets to see.

The 25 orders average 26.008 minutes, close to the true 26.97 but not equal to it. That gap is not a mistake. It is just what happens when you measure 25 deliveries instead of 5,000.

Notice also how spread out those 25 orders are. The fastest took 7.8 minutes and the slowest took 53.3, with a standard deviation of 9.735 minutes.

```r
# How the 25 measured orders are spread out
hist(orders, breaks = 10, col = "grey85", border = "white",
     main = "The 25 orders the manager timed",
     xlab = "Delivery time (minutes)")
abline(v = mean(orders), col = "red", lwd = 3)
```

The red line is the average of the 25, at 26.008 minutes. Individual deliveries land all over the place around it, and that spread is what we work with next.

=== step === concept
## How the 22 to 30 minute interval is built

A confidence interval for an average is the average plus and minus a half-width. So there is really only one thing to work out, and it comes from two pieces.

The first piece is the **standard error**. The 25 orders average 26.008 minutes, but a different 25 orders would have averaged something else. The standard error says how far that average typically moves from one sample of 25 to the next, and it is the standard deviation of the data divided by the square root of the sample size:

\[ SE = \frac{s}{\sqrt{n}} = \frac{9.735}{\sqrt{25}} = 1.947 \]

So a 25-order average wobbles by about 1.9 minutes. That is small compared with the 9.735 minute spread of individual deliveries, and it should be: averaging 25 numbers smooths a lot of that spread away.

The second piece is the **multiplier**, which sets how many standard errors wide the interval is. For 95% we want to leave 2.5% in each tail, and we take that cut-off from the t distribution rather than the normal one, because we estimated the spread from the same 25 orders instead of knowing it. The t distribution is slightly wider to pay for that, and it gets wider the less data you have, which is what its **degrees of freedom** track: here n minus 1, so 24.

Put them together and you get the whole formula.

\[ \bar{x} \pm t_{0.975,\,n-1} \times \frac{s}{\sqrt{n}} \]

```r
# Build the 95 percent interval for the average from three numbers
std_error  <- sd(orders) / sqrt(25)
multiplier <- qt(0.975, df = 24)
half_width <- multiplier * std_error

round(c(std_error = std_error, multiplier = multiplier, half_width = half_width), 3)
#>  std_error multiplier half_width
#>      1.947      2.064      4.018

round(c(lower = mean(orders) - half_width, upper = mean(orders) + half_width), 2)
#> lower upper
#> 21.99 30.03
```

`qt(0.975, df = 24)` is the value that cuts off the top 2.5% of the t distribution on 24 degrees of freedom, and it comes out at 2.064. Had we known the true spread, we would have used 1.96 instead. The extra 0.104 is the price of estimating the spread from 25 numbers.

So the half-width is 2.064 times 1.947, which is 4.018 minutes, and the interval runs from 21.99 to 30.03. Round those and you have the shop's 22 to 30 minutes.

You will almost never type those three lines in practice, because `t.test()` does all of it for you.

```r
# The same two numbers from the built-in one-sample t-test
t.test(orders)
#>
#> 	One Sample t-test
#>
#> data:  orders
#> t = 13.358, df = 24, p-value = 1.316e-12
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  21.98974 30.02626
#> sample estimates:
#> mean of x
#>    26.008
```

The line to read is `95 percent confidence interval: 21.98974 30.02626`. Same two numbers, and now you know exactly where each of them came from.

=== step === widget
## Rebuilding the interval by resampling the same 25 orders

The formula gave us a half-width of 4.018 minutes. Before we ask what the 95% means, it is worth seeing that the same interval falls out of the 25 orders on its own, with no formula involved.

The method is called the **bootstrap**. You put the 25 measured orders in a bag, pull one out, write it down, put it back, and repeat 25 times. Because you put each one back, some orders get picked twice and others get missed entirely, so you end up with a new set of 25 that is a slightly different version of the original.

Each chip below is one of the 25 orders. Press Draw again a few times and watch which ones get picked more than once and which get left out.

::widget bootstrap-sample {"n": 25, "tail": "Those greyed orders were left out of this resample, so this average was built without them."}

The greyed chips are the orders left out of this particular draw, and they have a standard name: **out-of-bag**. Around 9 of the 25 sit out on a typical draw, and a different 9 sit out on the next one. That is exactly the variation we want, because each resample is a small stand-in for going back out and measuring 25 fresh deliveries.

Now do that 5,000 times and take the average each time.

```r
# Rebuild the interval by resampling the 25 measured orders themselves
set.seed(21)
boot_averages <- replicate(5000, mean(sample(orders, 25, replace = TRUE)))

round(sd(boot_averages), 3)
#> [1] 1.895

round(quantile(boot_averages, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#> 22.38 29.75
```

`sample(orders, 25, replace = TRUE)` is the bag, and `replace = TRUE` is the putting back. Look at the two results.

The 5,000 resampled averages have a standard deviation of 1.895 minutes. The formula predicted 1.947. Those are the same quantity computed two completely different ways, and they differ by about 0.05 minutes.

And the middle 95% of the resampled averages runs from 22.38 to 29.75, against 21.99 to 30.03 from the formula. Close enough that you can see they are measuring the same thing.

```r
# Where the 5,000 resampled averages landed
hist(boot_averages, breaks = 40, col = "grey85", border = "white",
     main = "5,000 averages from resampling the same 25 orders",
     xlab = "Average delivery time (minutes)")
abline(v = mean(orders), col = "red", lwd = 3)
```

The pile is centred on 26.008, the average of the original 25, and almost all of it sits between about 22 and 30. The interval is nothing more than the range this pile covers.

=== step === concept
## What the 95% is actually counting

Everything so far used one sample of 25 orders. The 95% is not about that sample. It is about what happens when you do the whole thing again and again.

So let us do exactly that. We will go back to the year of 5,000 deliveries, draw 100 fresh samples of 25 orders, build a 95% interval from each one, and then check each interval against the true average of 26.97 minutes.

```r
# Draw 100 fresh samples of 25 orders and build an interval from each
true_average <- mean(year)

set.seed(7)
samples <- replicate(100, sample(year, 25))
many <- apply(samples, 2, function(s) t.test(s)$conf.int)

covers <- many[1, ] <= true_average & many[2, ] >= true_average
sum(covers)
#> [1] 96
```

`many` holds 100 intervals, one per column, with the lower end in row 1 and the upper end in row 2. `covers` runs the same check on each one: is 26.97 between the two ends?

96 of the 100 intervals contain the true average. 4 do not.

```r
# Draw the 100 intervals against the true average
plot(range(many), c(1, 100), type = "n",
     main = "100 intervals, each from its own sample of 25 orders",
     xlab = "Delivery time (minutes)", ylab = "Sample number")
segments(many[1, ], 1:100, many[2, ], 1:100,
         col = ifelse(covers, "grey60", "red"), lwd = 2)
abline(v = true_average, lwd = 3)
```

Each horizontal line is one interval, built from its own 25 orders. The vertical line is the true average at 26.97 minutes. Grey lines cross it and red lines do not.

That count, 96 out of 100, is the whole meaning of the 95%.

[KEY INSIGHT]
The 95% is a property of the procedure, not of any single interval. Build intervals this way from repeated samples and about 95 in every 100 of them will contain the true average. Our 100 gave 96.

Notice what the picture does not show. The intervals move around, sliding left and right depending on which 25 orders turned up, while the true average stays put at 26.97. That is the right way round: the average of the shop's deliveries is a fixed fact about the shop, and the interval is the thing that varies.

=== step === quiz
## Quick check: what does the 95% count?

The shop reports a 95% confidence interval of 22 to 30 minutes for its average delivery time. Which sentence reads that 95% correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 95% of deliveries from this shop take between 22 and 30 minutes. ::no
- There is a 95% probability that the true average delivery time lies between 22 and 30 minutes. ::no
- Of every 100 intervals built this way from fresh samples of 25 orders, about 95 contain the true average. 96 of ours did. ::ok Exactly. The 95% counts intervals across repeated samples, which is why we had to build 100 of them to see it at all.
- The next sample of 25 orders would average between 22 and 30 minutes about 95% of the time. ::no The three wrong readings all put the 95% on something other than the intervals. Two of them put the 95% on deliveries or on future averages, and the third puts it on the truth. The width came from one thing only: the 1.9 minutes that a 25-order average moves from sample to sample.

=== step === concept
## Is there a 95% chance the true average is between 22 and 30?

This is the reading almost everyone gives, so it deserves a straight answer. The answer is no, and the reason is short.

The true average delivery time is 26.97 minutes. It is a fixed number. It was fixed before the manager timed a single delivery, and it does not move when we compute something.

Our interval, 21.99 to 30.03, is also a pair of fixed numbers. Either 26.97 sits between them or it does not, and in our case it does. There is no chance left to talk about, the way there is no chance involved in whether 7 is between 5 and 9.

The uncertainty was real, but it was in the sampling. Before the manager drew those 25 orders, the interval about to be built had a 95% chance of containing the true average. After the draw, the interval is what it is.

Here is what makes that concrete: 4 of our 100 intervals missed, and there was nothing on their surface to tell you so.

```r
# The intervals that missed, and the sample behind the first of them
which(!covers)
#> [1] 25 68 69 81

round(t(many[, !covers]), 2)
#>       [,1]  [,2]
#> [1,] 18.58 26.22
#> [2,] 27.48 33.69
#> [3,] 17.90 26.90
#> [4,] 27.07 34.17

round(c(average = mean(samples[, 25]), sd = sd(samples[, 25])), 2)
#> average      sd
#>   22.40    9.25
```

Samples 25, 68, 69 and 81 produced intervals that do not contain 26.97. Sample 25 gave 18.58 to 26.22, which stops 0.75 minutes short.

Look at the sample behind it. Its 25 orders vary by 9.25 minutes, which is right on the spread of the year's deliveries, 9.24, so nothing is odd about the data. The average simply came out at 22.40 instead of somewhere near 27, and that was enough to drag the whole interval below the true value.

[WARNING]
You cannot tell your interval apart from those 4. The manager who drew sample 25 got a perfectly ordinary looking set of 25 deliveries and a perfectly ordinary looking interval, and it was wrong. The 95% tells you how often the method works, never whether it worked this time.

=== step === widget
## Does the interval say where the next delivery lands?

Here is the other half of the confusion. Our interval, 21.99 to 30.03, describes the shop's **average** delivery time. It says nothing about how long your pizza will take.

Those are two different questions and they have two different widths. The picture below shows both at once. It runs on its own built-in scatter of 20 points rather than the delivery data, with a straight line fitted through them and a band drawn either side. The two bands map onto our example: the green one is the interval for the average, and the wider orange one is the range a single new observation falls in.

::widget regression-intervals {}

Drag the sample size slider from 8 up to 300. The green band collapses onto the line while the orange band barely narrows at all, and the readout under the chart prints both half-widths as you move. That is the whole distinction in one picture: more data pins down an average, and more data does not make individual deliveries arrive closer together.

Now let us work out the same two numbers for the pizza shop.

```r
# The range one single delivery falls in, beside the interval for the average
one_delivery <- qt(0.975, df = 24) * sd(orders) * sqrt(1 + 1 / 25)

round(c(lower = mean(orders) - one_delivery, upper = mean(orders) + one_delivery), 1)
#> lower upper
#>   5.5  46.5

round(quantile(year, c(0.025, 0.975)), 1)
#>  2.5% 97.5%
#>   8.5  45.2
```

The first line uses the spread of individual deliveries, 9.735 minutes, instead of the standard error of 1.947. That one change takes the range from 8 minutes wide to 41 minutes wide: a single delivery falls between 5.5 and 46.5 minutes 95% of the time.

The second line is the reality check. Across the shop's whole year, the middle 95% of actual delivery times ran from 8.5 to 45.2 minutes, which is the same story: a pizza that takes 40 minutes is not evidence against a 22 to 30 minute interval, because that interval was never about your pizza.

[NOTE]
An interval for the average narrows as you measure more orders. The range that single deliveries fall in does not, because it is set by how much deliveries genuinely vary, and measuring more of them does not change that.

=== step === concept
## What the confidence level and the sample size each change

Two things control how wide your interval comes out, and they work differently. Let us measure both.

First the confidence level. Repeat the whole coverage count at 80%, 95% and 99%, with 2,000 samples this time, and record two things per level: how often the interval contained the true average, and how wide it was on average.

```r
# Coverage and mean width at three confidence levels, 2,000 samples of 25 each
set.seed(99)
by_level <- t(sapply(c(0.80, 0.95, 0.99), function(lvl) {
  out <- replicate(2000, {
    s  <- sample(year, 25)
    ci <- t.test(s, conf.level = lvl)$conf.int
    c(ci[1] <= true_average && ci[2] >= true_average, ci[2] - ci[1])
  })
  c(coverage = mean(out[1, ]), mean_width = mean(out[2, ]))
}))

data.frame(level = c(0.80, 0.95, 0.99), round(by_level, 3))
#>   level coverage mean_width
#> 1  0.80    0.812      4.825
#> 2  0.95    0.948      7.582
#> 3  0.99    0.984     10.224
```

Read the coverage column first. At each level the intervals contained the true average about as often as the level says: 0.812 against 0.80, 0.948 against 0.95, 0.984 against 0.99. The confidence level is a target, and the procedure hits it.

Now read the width column. Buying that extra coverage costs width, and it costs a lot of it. Going from 80% to 99% coverage more than doubles the average interval, from 4.825 minutes to 10.224.

The sample size works the other way round. Measuring more orders narrows the interval without touching the confidence level at all, but it narrows it slowly, because the standard error divides by the square root of n.

```r
# Half-width of a 95 percent interval as the number of measured orders grows
half_width_at <- function(n) qt(0.975, df = n - 1) * sd(orders) / sqrt(n)

round(sapply(c(25, 100, 400), half_width_at), 2)
#> [1] 4.02 1.93 0.96
```

Keeping the confidence at 95% and the spread at 9.735 minutes, 25 orders give a half-width of 4.02 minutes, 100 orders give 1.93, and 400 orders give 0.96.

Notice the pattern: to halve the half-width you have to measure about 4 times as many orders. That square root is why "just collect more data" gets expensive fast.

=== step === quiz
## Quick check: reading a narrower interval

The shop decides to time 100 orders instead of 25. The half-width of its 95% interval drops from 4.02 minutes to 1.93. Which reading of the narrower interval is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Deliveries from the shop are more consistent now, so individual pizzas arrive closer to the average. ::no
- The average is pinned down more precisely, about 95 in 100 such intervals still contain the true average, and the range a single delivery falls in has not moved. ::ok Right on all three counts. More orders sharpen the estimate of the average, they do not change the confidence level, and they do not make deliveries any less variable.
- A narrower interval is more likely to contain the true average than a wide one. ::no
- A 99% interval built on the same 100 orders would be narrower still. ::no Each wrong option changes the wrong quantity. Measuring more orders shrinks the standard error, so the interval for the average narrows; it leaves the spread of individual deliveries alone, it leaves the 95% coverage alone, and raising the confidence level to 99% widens an interval rather than narrowing it.

=== step === tryit
## Your turn: build the 99% interval from the same 25 orders

`orders` still holds the 25 delivery times. Build the 99% confidence interval for the average two ways: by hand, and with `t.test()`.

By hand, the multiplier now has to leave 0.5% in each tail instead of 2.5%, so it is `qt(0.995, df = 24)`. Multiply it by the standard error to get the half-width, then put it either side of `mean(orders)`. Then confirm both ends with `t.test()` using the `conf.level` argument.

```r
# orders holds the 25 delivery times the manager measured.
# Build the 99 percent interval by hand: the multiplier from qt(),
# then the half-width, then the two ends around mean(orders).
# Then get the same two numbers from t.test() with conf.level set to 0.99.
# Press Check when you have it.
```
::check {"regex": "conf[.]level\\s*=\\s*0?[.]99", "gate": true, "difficulty": "beginner", "ok": "That gives 20.56 to 31.45. The 99 percent interval is 10.89 minutes wide against the 95 percent interval's 8.04, so you pay 2.85 extra minutes of width for a procedure that misses 1 sample in 100 instead of 5.", "no": "Two pieces. The multiplier is `qt(0.995, df = 24)`, because 99 percent leaves 0.5 percent in each tail. Then run `t.test(orders, conf.level = 0.99)` and check that the two ends match."}
::solution
```r
# The 99 percent interval by hand and from t.test()
multiplier99 <- qt(0.995, df = 24)
half_width99 <- multiplier99 * sd(orders) / sqrt(25)

round(c(multiplier = multiplier99, half_width = half_width99), 3)
#> multiplier half_width
#>      2.797      5.445

round(c(lower = mean(orders) - half_width99, upper = mean(orders) + half_width99), 2)
#> lower upper
#> 20.56 31.45

t.test(orders, conf.level = 0.99)$conf.int
#> [1] 20.56256 31.45344
#> attr(,"conf.level")
#> [1] 0.99
```

The multiplier went from 2.064 to 2.797 and nothing else changed, which is the only lever the confidence level has.

=== step === concept
## References

- [The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23, 103-123. Takes apart the "95% chance the true value is in here" reading in detail.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Numbers 19 to 25 are the confidence interval misreadings, catalogued and corrected one by one.
- [Inference by eye: confidence intervals and how to read pictures of data](https://doi.org/10.1037/0003-066X.60.2.170) - Cumming and Finch (2005), American Psychologist 60(2), 170-180. How to read intervals off a plot, including the coverage picture we drew.
- [One sample and two sample t-tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You built a confidence interval from scratch, then built 100 more to find out what its percentage counts. To summarise:

- The interval is the sample average plus and minus a half-width. From the 25 orders: 26.008 plus and minus 2.064 times 1.947, which is 21.99 to 30.03 minutes.
- The 95% counts intervals across repeated samples. 96 of our 100 intervals contained the true average of 26.97, and 4 missed.
- There is no probability attached to the interval in front of you. The true average is a fixed number, so 21.99 to 30.03 either contains it or does not, and you never get to know which.
- It is an interval for the average, not for one delivery. Single deliveries at this shop ran from 8.5 to 45.2 minutes across the year.
- The confidence level and the sample size set the width. Raising the level from 80% to 99% widened the average interval from 4.83 to 10.22 minutes, and going from 25 orders to 100 roughly halved the half-width.

So when someone shows you 22 to 30 minutes and asks what the 95% means:

"If the shop kept timing fresh batches of 25 orders and building an interval from each, about 95 in every 100 of those intervals would contain the true average delivery time."

That is the sentence. And the next time one of these turns up on a slide, you will know it describes how the interval was built, not where the true average happens to sit.
