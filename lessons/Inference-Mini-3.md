---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "See what a 95 percent confidence interval really promises by building 100 of them from repeated samples and counting how many actually catch the true average."
keywords: "confidence interval, 95 percent confidence interval, confidence interval meaning, coverage probability, margin of error, standard error, t.test in R"
mathjax: true
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "3"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-2"
course_next: "Inference-Mini-4"
curriculum_id: "0.0.3"
lesson_access: "windowed"
catalog_blurb: "What a 95% confidence interval promises, and the two ways people misread it."
---

=== step === cover
## Confidence intervals: what they really mean

Rosa runs a small pizza shop and logs how long every delivery takes, in minutes. She pulls her last 40 orders and finds an average delivery time of 28.1 minutes.

An average alone does not say how sure she can be about it, so she runs a standard calculation on those 40 times. It hands back a range instead of one number: 25.2 to 31.1 minutes, at 95% confidence.

The table below is exactly what that calculation produced.

::widget styled-table {"cols": ["metric", "value"], "rows": [["orders in the batch (n)", "40"], ["mean delivery time (minutes)", "28.1"], ["standard deviation (minutes)", "9.2"], ["95% CI lower bound (minutes)", "25.2"], ["95% CI upper bound (minutes)", "31.1"]], "title": "40 delivery times, one batch", "note": "Computed by t.test() at 95% confidence."}

Every number in that table came out of one function call. What the 95% actually means, and what it does not, is what comes next.

=== step === concept
## What "95% confident" does not mean
::prose-only the correct reading is demonstrated concretely two steps ahead, in the coverage simulation

Look at Rosa's interval again: 25.2 to 31.1 minutes, at 95% confidence. Say that sentence out loud and two readings probably come to mind, and both of them are wrong.

The first is: "there is a 95% probability the true average delivery time is between 25.2 and 31.1." That statement describes something called a credible interval, a different calculation built on different assumptions than the one `t.test()` just ran. It is not what a 95% confidence interval means.

The second is: "95% of individual deliveries land between 25.2 and 31.1 minutes." That mixes up two different things. The interval is about the average delivery time, one number that describes all of Rosa's orders together, not about where any single delivery falls. Plenty of individual orders will land outside 25.2 to 31.1 even though the average is comfortably inside it.

So what does the 95% actually refer to? Instead of telling you, here is how to see it for yourself: build the same kind of interval a hundred times and watch what happens.

=== step === concept
## Sample mean vs. population mean
::prose-only vocabulary made concrete in the coverage simulation one step ahead

Before that experiment makes sense, two numbers need to stay separate in your head: the sample mean and the population mean.

The sample mean is 28.1, the average of the 40 orders Rosa happened to look at. Pull a different 40 orders from the same shop next week and you would get a different sample mean, maybe 27.6 or 28.9. It moves around because which 40 orders you happen to draw is partly down to chance.

The population mean is different. It is the fixed, true average delivery time across every order Rosa's shop will ever make, past, present and future. It does not move around, but Rosa can never observe it directly, she would have to time every delivery she will ever run.

A confidence interval is an estimate of that fixed, unknown population mean, built from one sample. Keeping the two means straight is what makes the simulation ahead make sense.

=== step === concept
## Simulating from a population with a known mean

Here is the trick that will make the 95% concrete: build a fake population where you, the person running the code, already know the true mean. Real data never gives you that, but a simulation can, and that is exactly what makes it useful for checking a claim like "95% confident."

Set up a population that behaves like Rosa's shop: delivery times that average 27 minutes with a standard deviation of 9 minutes, close to what her real 40 orders showed.

```r
# Define the population Rosa's delivery times are simulated from
true_mu    <- 27   # the true average delivery time, in minutes
true_sigma <- 9    # the true standard deviation, in minutes
n          <- 40   # orders per sample, matching Rosa's real batch
```

With `true_mu` fixed at 27, the plan is this: draw 100 separate samples of 40 orders each from this population, build a 95% confidence interval from every single one, and count how many of those 100 intervals actually contain 27. Whatever that count turns out to be is what "95%" is really describing.

=== step === concept
## Coverage: how often the interval contains the true mean

Time to run the experiment. `replicate()` repeats the same block of code over and over, 100 times here, and collects every result.

```r
# Draw 100 samples from Rosa's population and build a 95% CI from each
set.seed(2025)
experiments <- replicate(100, {
  one_sample <- rnorm(n, true_mu, true_sigma)
  t.test(one_sample)$conf.int
})

contains_mu <- experiments[1, ] <= true_mu & experiments[2, ] >= true_mu
coverage    <- mean(contains_mu)
coverage
#> [1] 0.94
```

Each of the 100 columns in `experiments` is one 95% confidence interval, built from its own random sample of 40 orders. `contains_mu` checks, interval by interval, whether the true mean of 27 falls between that interval's lower and upper bound. Averaging a column of `TRUE`/`FALSE` values gives the share that came out `TRUE`, so `coverage` is the fraction of the 100 intervals that actually caught 27.

That fraction came out at 0.94, 94 of the 100 intervals contained the true mean, and 6 of them missed it. Plot all 100 to see it directly.

```r
# Plot the 100 intervals, colouring each by whether it contains the true mean
library(ggplot2)

ci_df <- data.frame(
  experiment = 1:100,
  lower      = experiments[1, ],
  upper      = experiments[2, ],
  covers     = contains_mu
)

ggplot(ci_df, aes(x = experiment, ymin = lower, ymax = upper, colour = covers)) +
  geom_linerange() +
  geom_hline(yintercept = true_mu, linetype = "dashed") +
  scale_colour_manual(values = c(`TRUE` = "steelblue", `FALSE` = "firebrick")) +
  labs(x = "Sample #", y = "Delivery time (minutes)", colour = "Contains true mean?") +
  theme_minimal()
```

Each vertical line is one 95% interval, and the dashed horizontal line marks the true mean, 27. Most of the lines cross it, coloured blue. A handful sit off to one side and never touch it, coloured red, for example experiment 16 spans 27.0 to 32.8, sitting entirely above the true mean.

[KEY INSIGHT]
The 95% is not a property of any single interval. It is the success rate of the procedure, build a sample, run `t.test()`, repeat, measured across many repeats. This one run landed on 94 out of 100. Run it with a different seed, or with 100,000 repeats instead of 100, and the rate would settle in closer and closer to exactly 95%.

=== step === quiz
## Quick check: which statement is actually correct

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 95% probability the true mean is in Rosa's interval, 25.2 to 31.1. ::no
- 95% of individual deliveries land in 25.2 to 31.1 minutes. ::no Both of these describe something other than what you just measured. The 94-out-of-100 result is about how often the procedure catches the true mean across repeated samples, not a probability about this one interval or a claim about where individual orders land.
- If we repeated this sampling process many times, about 95% of the resulting intervals would contain the true mean. ::ok Exactly. That is the 94-out-of-100 result you just saw, and it is what "95% confident" is actually describing, the long-run success rate of the procedure, not a claim about one interval or about individual orders.

=== step === concept
## The anatomy of every confidence interval

Every one-sample confidence interval you will ever build, whatever the question, has the same three-part shape: a point estimate, plus or minus a critical value times a standard error.

\[
\bar{x} \pm t_{n-1,\,0.975} \cdot \frac{s}{\sqrt{n}}
\]

Here, \(\bar{x}\) is the sample mean, the point estimate. \(s\) is the sample standard deviation, and \(n\) is the sample size, so \(s / \sqrt{n}\) is the standard error of the mean, how much the sample mean itself is expected to wobble from sample to sample. \(t_{n-1,\,0.975}\) is a critical value pulled from the t-distribution, a multiplier that sets how wide the margin needs to be for 95% confidence.

Rebuild Rosa's original interval from scratch using only `mean()`, `sd()`, and `qt()`, to see that formula produce the same numbers `t.test()` gave you at the start.

```r
# Reconstruct the 95% CI for Rosa's original 40 orders, piece by piece
set.seed(2025)
sample1 <- rnorm(n, true_mu, true_sigma)

x_mean <- mean(sample1)
x_sd   <- sd(sample1)
x_n    <- length(sample1)

t_crit <- qt(0.975, df = x_n - 1)
se     <- x_sd / sqrt(x_n)
margin <- t_crit * se

manual_ci <- c(x_mean - margin, x_mean + margin)
manual_ci
#> [1] 25.20910 31.08657
```

`x_mean` comes out to 28.15, `x_sd` to 9.19, and dividing by the square root of 40 gives a standard error of about 1.45. `qt(0.975, df = 39)` returns 2.02, the critical value that leaves 2.5% of the t-distribution in each tail, so the two tails together hold the 5% left outside a 95% interval. Multiplying that critical value by the standard error gives a margin of about 2.94, and adding and subtracting it from the mean reproduces 25.2 to 31.1 exactly.

```r
# Confirm it matches t.test() directly
t.test(sample1)$conf.int
#> [1] 25.20910 31.08657
#> attr(,"conf.level")
#> [1] 0.95
```

No coincidence: this is exactly the calculation `t.test()` runs internally. Knowing the three pieces, point estimate, critical value, standard error, is what lets you see why an interval has the width it does, instead of treating it as something a function just hands you.

=== step === widget
## Where the critical value comes from

The critical value, 2.02 for Rosa's data, is not a number someone picked. It comes directly from how much confidence you are asking for: a higher confidence level demands a smaller tail on each side of the distribution, and a smaller tail needs a cutoff point further out from the centre.

Drag the slider below and watch the shaded area shrink or grow. This particular widget draws a standard normal curve rather than Rosa's t-distribution, so treat the shape as the more familiar stand-in, but the relationship it shows is the same one that sets every critical value: ask for a smaller shaded tail, and the cutoff has to move further from zero.

::widget null-distribution {"tails": 2, "max": 3, "start": 1.96, "label": "critical value (z)"}

At 1.96 the two shaded tails together hold about 5% of the curve, the textbook cutoff for 95% confidence when the standard deviation is known exactly. Drag it down to 1.645 and the combined tails widen to about 10%, matching 90% confidence. Drag it up to 2.576 and they shrink to about 1%, matching 99% confidence.

But Rosa's case is not one where the standard deviation is known exactly. Her 9.19 is itself only an estimate, computed from the same 40 orders as everything else, and that extra uncertainty is why her actual multiplier comes from the t-distribution instead of the normal one in the widget. The t-distribution needs one more piece of information, its degrees of freedom, n minus 1, which for 40 orders is 39.

```r
# The exact multipliers for Rosa's data, at three confidence levels
t_crit_90 <- qt(0.95,  df = x_n - 1)
t_crit_95 <- qt(0.975, df = x_n - 1)
t_crit_99 <- qt(0.995, df = x_n - 1)

c(t_crit_90, t_crit_95, t_crit_99)
#> [1] 1.684875 2.022691 2.707913
```

These are the exact multipliers `t.test()` uses on Rosa's data: 1.685, 2.023, and 2.708 for 90%, 95%, and 99% confidence. Each is a touch bigger than the normal-curve version you just dragged to, 1.645, 1.96, and 2.576, because the t-distribution builds in the extra uncertainty of having estimated the standard deviation from only 40 orders. That gap between the t and normal values shrinks as the sample size grows, and with a few hundred orders instead of 40 it almost disappears.

=== step === widget
## Does a narrower interval mean a better guess?

Here is a natural question. If sample size can shrink an interval, does a narrower interval mean Rosa now has a better estimate of the true average?

The widget below uses a different setup, a fitted regression line instead of a single mean, but the same relationship it shows still applies: slide the sample size up and watch the green confidence band narrow around the line, while the orange band, which reflects how spread out individual points are rather than the line's own uncertainty, barely moves.

::widget regression-intervals {}

Rosa's case is a single mean, not a regression line, but the same relationship carries over directly. Compare a 95% interval built at three different sample sizes, all from the very same population as before.

```r
# Compare 95% CI width at three sample sizes, same population each time
sample_sizes <- c(10, 40, 160)
ci_widths <- numeric(length(sample_sizes))

for (i in seq_along(sample_sizes)) {
  set.seed(2025)
  one_draw <- rnorm(sample_sizes[i], true_mu, true_sigma)
  one_ci   <- t.test(one_draw)$conf.int
  ci_widths[i] <- one_ci[2] - one_ci[1]
}

ci_widths
#> [1] 6.451104 5.877474 2.767843
```

At 10 orders the interval spans about 6.45 minutes. At 40 orders, matching Rosa's real batch, it narrows to about 5.88. At 160 orders, four times the data, it narrows further to about 2.77. Each width comes from a single random draw at that sample size, so they will not land on a perfectly clean ratio, but the trend holds: more data buys a tighter interval.

Here is the part that is easy to miss. All three of those intervals are still 95% intervals, built the identical way, at the identical confidence level. Every one of them is right about 95% of the time in the long run, the exact coverage rate you measured earlier: 94 of 100. A narrower interval only tells you that this particular batch of data pinned the estimate down more precisely, not that the interval is somehow more reliable or more likely to be correct than a wider one built the same way.

[NOTE]
It's tempting to treat "narrower" as "better" the way it would be for, say, a shorter commute. A confidence interval does not work that way: width tracks how much data and variability went in, coverage tracks how the procedure behaves over repeated sampling, and the two move independently of each other.

=== step === quiz
## How to report a confidence interval correctly

You have now seen enough to separate a correct write-up of Rosa's interval from a wrong one.

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- We are 95% confident the true average delivery time is between 25.2 and 31.1 minutes. ::ok Right. That sentence describes the long-run behaviour of the procedure, not a probability about this one fixed interval, and it makes no claim about width being tied to reliability.
- There is a 95% probability the true average delivery time is between 25.2 and 31.1 minutes. ::no
- A narrower 95% interval is more likely to contain the true average than a wider one. ::no Both of these claim something a confidence interval cannot support. Putting a probability on this one already-computed interval mixes up the frequentist calculation t.test() ran with a different, Bayesian kind of statement, and a narrower interval is not more reliable, it is still right about 95% of the time in the long run, exactly like a wider one built at the same confidence level.

=== step === tryit
## Closing try-it: build your own interval

Rosa logs a third batch of 40 orders. This time, build the interval yourself, at a different confidence level: 90% instead of 95%.

```r
# Set up a third batch of 40 orders, and the three pieces a 90% interval needs
set.seed(7071)
sample3 <- rnorm(n, true_mu, true_sigma)

x3_mean  <- mean(sample3)
x3_sd    <- sd(sample3)
x3_n     <- length(sample3)
t_crit90 <- qt(0.95, df = x3_n - 1)   # 90% confidence leaves 5% in each tail
se3      <- x3_sd / sqrt(x3_n)

c(mean = x3_mean, sd = x3_sd, t_crit90 = t_crit90, se = se3)
#>      mean        sd  t_crit90        se 
#> 24.935912  9.547649  1.684875  1.509616 
```

Now combine those three pieces into the interval yourself, the same way you did earlier: the mean, plus and minus the critical value times the standard error.

```r
# x3_mean, t_crit90 and se3 are ready above.
# Combine them into a 90% confidence interval: the mean, plus
# and minus the critical value times the standard error.
# One line. Press Check when you have it.
```
::check {"regex": "t_crit90\\s*\\*\\s*se3", "gate": true, "difficulty": "intermediate", "ok": "That is the 90% interval, about 22.4 to 27.5 minutes. It is narrower than a 95% interval on the same data, because you accepted a lower success rate in exchange for a tighter range.", "no": "Combine the three pieces the same way you did earlier: the mean, plus and minus the critical value times the standard error. manual_ci90 <- c(x3_mean - t_crit90 * se3, x3_mean + t_crit90 * se3)"}
::solution
```r
# Combine the mean, critical value and standard error into the interval
manual_ci90 <- c(x3_mean - t_crit90 * se3, x3_mean + t_crit90 * se3)
manual_ci90
#> [1] 22.39240 27.47943
```

That is 22.4 to 27.5 minutes, a width of 5.09. Compare it with the same batch at 95% confidence:

```r
# Compare with the standard 95% interval for the same batch
t.test(sample3)$conf.int
#> [1] 21.88243 27.98940
#> attr(,"conf.level")
#> [1] 0.95
```

The interval comes out 6.11 minutes wide at 95% confidence, against 5.09 at 90%. Less confidence buys a narrower interval, the same trade-off you saw earlier with sample size, just running in the other direction this time.

=== step === concept
## References
::prose-only source list, nothing new to visualize

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman, J. (1937), Philosophical Transactions of the Royal Society A, 236(767). The paper that first defined a confidence interval this way, in terms of repeated sampling.
- [The Fallacy of Placing Confidence in Confidence Intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review, 23(1).
- [OpenIntro Statistics](https://www.openintro.org/book/os/) - Diez, Barr and Cetinkaya-Rundel, the chapter on confidence intervals for a mean.
- [t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) and [confint](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/confint.html) - the R documentation for the two functions used throughout.
- Casella, G., and Berger, R. L. (2002). Statistical Inference (2nd ed.), chapter 9.

=== step === complete
## What you can say now
::prose-only closing recap, nothing new to visualize

Rosa's original interval was 25.2 to 31.1 minutes, at 95% confidence. You now know exactly what that 95% means: build the same kind of interval from 100 different samples of her orders, and about 95 of them, 94 in the run you actually did, will contain the true average delivery time. It says nothing about the probability of this one interval, and nothing about where individual deliveries land.

You also rebuilt that interval by hand, as a point estimate plus or minus a critical value times a standard error, and saw each piece move on its own: sample size and confidence level change the width, but neither one changes the 95% success rate baked into the procedure itself.

The next time a report, a paper, or a colleague hands you a confidence interval, you will know precisely what its stated confidence level is claiming, and just as usefully, what it is not.
