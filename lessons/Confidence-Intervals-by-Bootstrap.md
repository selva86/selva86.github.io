---
title: "Probability and Estimation Lesson 7: Confidence intervals by bootstrap"
catalog_blurb: "A 95% interval built by resampling alone, and what that 95% really means."
description: "Build a 95% bootstrap confidence interval for a median with no formula, resampling with replacement, and learn what that 95% promises, and where it fails."
keywords: "bootstrap, resampling, percentile interval, standard error, confidence interval, coverage, R"
post_type: "LESSON"
curriculum_id: "4.10.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-probability"
course_title: "Probability and Estimation, from the ground up"
course_lesson: "7"
course_total: "7"
course_landing: "Probability-and-Estimation-Course.html"
course_next: ""
course_prev: "Point-Estimates-and-the-Standard-Error.html"
---

=== step === cover
## Confidence intervals by bootstrap

Today let's find out how sure you can really be about a typical number, when the usual formula for its uncertainty does not even exist.

Mo runs a small coffee cart. One Saturday morning she timed how long each of 16 customers waited in line, in minutes: 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 9, 10, 11, 13, 19, 27. Two of those waits, 19 and 27 minutes, happened because the register jammed partway through the morning.

The typical wait, the median, works out to 7.5 minutes. But that number came from just 16 customers on just one Saturday. Mo wants to know how far off 7.5 could really be.

::widget null-distribution {"tails": 2, "label": "the median wait"}

Drag the marker above and watch the two shaded slices shrink or grow as it moves. That shrinking and growing, how much of a spread gets cut off at either end once you pick a point, is exactly the idea this lesson turns into a real interval for Mo's 7.5 minutes: cut a slice off each end and see what is left in the middle.

=== step === concept
## A statistic with no formula for its spread

For a mean, there is a direct formula for how much it would wobble from one sample to the next: the standard deviation of the data, divided by the square root of the sample size. That is the standard error, and once you know it, you already know roughly how far the mean could be off.

Mo's median does not come with that same shortcut. Compute all three numbers on her 16 wait times and see for yourself.

```r
# Compute the mean, median and spread of Mo's 16 wait times, then the mean's formula-based standard error
wait_times <- c(4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 9, 10, 11, 13, 19, 27)
mean(wait_times)
#> [1] 9.5
median(wait_times)
#> [1] 7.5
round(sd(wait_times), 2)
#> [1] 5.94
se_mean <- sd(wait_times) / sqrt(16)
round(se_mean, 2)
#> [1] 1.49
```

The mean, 9.5 minutes, sits well above the median, 7.5, because the two long waits from the register jam pull the mean up without moving the median at all. `sd(wait_times)` comes out to 5.94, the spread of the 16 wait times themselves. Divide that by the square root of 16 and you get 1.49 minutes: the mean's standard error, how much the mean of a fresh batch of 16 customers would typically wobble around.

Now try asking the same question about the median. Is there a line of algebra that turns Mo's 16 numbers into the median's standard error, the way `sd(wait_times) / sqrt(16)` just did for the mean?

There is not, not a clean one. The median only looks at whichever two numbers happen to sit in the middle once the data are sorted, and no simple formula describes how much that middle pair would move around from one batch of 16 customers to the next. Every number in the sample pulls on the mean, so a tidy formula falls out of that. The median only cares about ranking, and ranking does not reduce to a formula half as easily.

So if there is no formula, how does anyone put a number on how uncertain the median really is? That is what the bootstrap is for.

=== step === widget
## What one bootstrap resample looks like

Here is the idea, in one sentence: pretend Mo's 16 wait times are the whole population of customers, and draw a new sample of 16 from them, with replacement. "With replacement" means that once a wait time is drawn, it goes right back in, so the same value can be picked again.

Try it once in R.

```r
# Draw one resample of 16 wait times, with replacement, from Mo's original 16
set.seed(42)
one_resample <- sample(wait_times, 16, replace = TRUE)
one_resample
#>  [1]  4  6  4  8  8  6  5  8  4 27 19  7  7  6  8  6
median(one_resample)
#> [1] 6.5
```

`sample(wait_times, 16, replace = TRUE)` draws 16 values from `wait_times`, putting each one back before the next draw. Look at the result: 4 shows up three times, 8 shows up three times, and several of the original waits, like 9, 10, 11 and 13, do not show up at all. That is what "with replacement" buys you: some values repeat, some are left out, but the resample stays the same size as the original, 16.

The median of that one resample is 6.5 minutes, close to Mo's real 7.5 but not the same. Draw again and you would get a different mix of repeats and gaps, and a different median along with it.

The widget below does exactly that, over and over, at the press of a button.

::widget bootstrap-sample {"n": 16, "tail": "The 16 wait times, reshuffled with repeats and gaps, same as the resample above."}

Press "Draw again" a few times. Each press builds a fresh resample of 16, with its own repeats and its own gaps, the same mechanic as the resample above.

=== step === concept
## Doing it two thousand times: the bootstrap distribution

One resample gave one median, 6.5. That is not enough to say anything about how much the median really wobbles. So repeat the whole thing, draw a resample and compute its median, 2000 times, and look at what comes back.

```r
# Resample with replacement and recompute the median, 2000 times
set.seed(42)
boot_medians <- replicate(2000, median(sample(wait_times, 16, replace = TRUE)))
summary(boot_medians)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>   5.000   7.000   7.500   7.667   8.000  13.000 
length(unique(boot_medians))
#> [1] 16
```

`replicate(2000, ...)` runs the exact same resample-and-median routine 2000 times and stores every result. Those 2000 medians, called the bootstrap distribution of the median, run from 5 minutes up to 13, averaging 7.667.

Notice something else: `length(unique(boot_medians))` comes back as only 16. Even across 2000 resamples, the median only ever lands on 16 distinct values. That happens because Mo only has 16 wait times to draw from in the first place, so there are only so many different middle pairs a resample of 16 can produce. A bigger original sample would spread the bootstrap medians across more distinct values.

The bootstrap distribution is the whole point of this exercise. It stands in for the thing you actually want, which is how the median would vary if Mo could run her Saturday morning over and over with fresh customers. She cannot do that for real. The bootstrap distribution is the closest thing you can build instead, out of the one Saturday she actually has.

=== step === concept
## The percentile interval, built by hand

Those 2000 bootstrap medians already contain everything needed for a 95% confidence interval, with no formula at all. Cut off the bottom 2.5% and the top 2.5% of the 2000 values, and what is left in the middle is the interval.

```r
# Read the 95% percentile interval straight off the 2000 bootstrap medians
quantile(boot_medians, c(0.025, 0.975))
#>  2.5% 97.5% 
#>     6    10 
```

`quantile(boot_medians, c(0.025, 0.975))` finds the two values that cut the bottom 2.5% and the top 2.5% off the 2000 bootstrap medians. That gives 6 and 10 minutes: Mo's 95% percentile bootstrap confidence interval for the median wait.

Notice what did not happen. There was no formula like `sd(wait_times) / sqrt(16)` anywhere in that calculation. The two ends of the interval are nothing but two percentiles that were already sitting inside the 2000 resampled medians you just built. Any statistic you can compute, you can bootstrap the same way: resample, recompute, read off the percentiles.

Each of those 2000 resamples behind `boot_medians` is built exactly like the one resample from a moment ago. Which of these best describes it?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- 16 wait times drawn with replacement from Mo's original 16, so some repeat and some are left out, every time the same size as the original sample. ::ok Right. Every one of the 2000 resamples behind boot_medians is built exactly like the single resample from earlier: 16 draws, with replacement, from the same 16 original wait times.
- The original 16 wait times, just shuffled into a different order, with no repeats and nothing left out. ::no
- A smaller sample, say 8 wait times, drawn with replacement from the original 16. ::no Every resample behind boot_medians is the same size as Mo's original sample, 16, and it is drawn WITH replacement, so some wait times repeat and some get left out. Shuffling without replacement, or drawing a smaller sample, is not what the bootstrap does.

=== step === concept
## Why cutting two tails gives 95%

Plot all 2000 bootstrap medians and mark where the interval's two ends sit.

```r
# Plot the 2000 bootstrap medians and mark the percentile interval's two ends
hist(boot_medians, col = "grey85", border = "white",
     main = "2000 bootstrap medians", xlab = "Bootstrap median wait (minutes)")
abline(v = c(6, 10), col = "firebrick", lwd = 2, lty = 2)
```

The two dashed lines sit at 6 and 10, the exact numbers `quantile()` just handed back. `quantile(boot_medians, 0.025)` is defined to leave close to 2.5% of the 2000 medians at or below it, and `quantile(boot_medians, 0.975)` is defined to leave close to 2.5% at or above it. Whatever sits between those two lines, by construction, is close to the middle 95%.

That is the entire trick behind a 95% bootstrap interval. It is never built from how far the median typically moves. It is built entirely from where the 2.5% and 97.5% marks of the 2000 resampled medians fall, read straight off the numbers.

=== step === concept
## Reading a standard error off the same numbers

The same 2000 bootstrap medians also hand you a standard error, with the same no-formula approach. A standard error is just a standard deviation of a statistic's own distribution across samples, and the bootstrap distribution is exactly that, built directly rather than derived.

```r
# The median's bootstrap standard error: the spread of the 2000 resampled medians themselves
round(sd(boot_medians), 2)
#> [1] 0.93
```

0.93 minutes is the median's bootstrap standard error. Compare it with the mean's formula-based standard error from earlier, 1.49 minutes. Both numbers measure the same kind of thing, how much a statistic would wobble from one batch of 16 customers to the next, for two different statistics. The mean's came out of an algebra formula. The median's came from literally measuring how much 2000 resampled medians actually spread out.

=== step === concept
## What 95% confidence actually means

Here is the question that actually matters: when you call 6 to 10 minutes "the 95% interval," what exactly does that 95% describe?

It is tempting to read it as "there is a 95% chance the shop's real median wait is somewhere between 6 and 10." That is not quite right. Mo's real median wait, across every customer she will ever see, is some fixed number. It does not move around, and it is not sitting there with some probability of being inside 6 to 10 and some probability of being outside. Either it is in that range, or it is not.

What 95% actually describes is the procedure: resample, recompute, cut off the two tails. Run that same procedure on sample after sample, and about 95% of the intervals it produces will contain the true value. It is a property of running the recipe again and again, not a probability about the one interval already sitting in front of you.

Check that directly. Build a population of customers whose true median wait is known, 7.16 minutes. Draw 200 separate Saturdays of 16 customers from it, build a percentile bootstrap interval for each Saturday, and count how many of those 200 intervals actually contain 7.16.

```r
# Simulate 200 Saturdays from a population with a known true median, and count how many
# bootstrap intervals contain it
set.seed(123)
true_median <- 3 + log(2) * 6
hits <- 0
for (i in 1:200) {
  sample_k <- 3 + rexp(16, rate = 1 / 6)
  boot_k <- replicate(999, median(sample(sample_k, 16, replace = TRUE)))
  ci_k <- quantile(boot_k, c(0.025, 0.975))
  if (true_median >= ci_k[1] && true_median <= ci_k[2]) {
    hits <- hits + 1
  }
}
round(true_median, 2)
#> [1] 7.16
hits
#> [1] 187
```

`true_median` is fixed at 7.16 minutes on purpose, so every one of the 200 simulated Saturdays can be checked against the same known answer. Each pass through the loop draws a fresh sample of 16 customers from that population, bootstraps 999 resamples from it, and builds a percentile interval the same way you built one for Mo's real data.

187 of the 200 intervals actually contain 7.16, which is 93.5%. That is close to 95% but not exactly on it, because 93.5% itself only comes from 200 trials, and 200 trials have their own wobble around whatever the true long-run rate really is. Run a different 200 Saturdays and you would get a different count, maybe 184, maybe 191, scattered around the same neighborhood.

That is the whole meaning of 95%. It is not a statement about Mo's one Saturday. It is a statement about what happens when resample, recompute and cut-the-tails gets run over and over, on sample after sample. On any one of those samples, including Mo's real Saturday, the interval either caught the true median or it did not, and there is no way to know which from the data alone.

=== step === widget
## Where the bootstrap undercovers

The bootstrap is not magic. It can badly undercover, meaning fewer than 95% of its intervals actually contain the truth, and the easiest way to see it is with a small sample and the wrong kind of statistic.

On a slower Tuesday, the same cart only saw 5 customers, with wait times of 2, 3, 4, 5 and 20 minutes. Bootstrap not the median this time, but the maximum.

```r
# Resample Tuesday's 5 wait times with replacement, and bootstrap the maximum 2000 times
small_sample <- c(2, 3, 4, 5, 20)
set.seed(42)
boot_max <- replicate(2000, max(sample(small_sample, 5, replace = TRUE)))
quantile(boot_max, c(0.025, 0.975))
#>  2.5% 97.5% 
#>     4    20 
sum(boot_max == 20)
#> [1] 1306
```

The percentile interval comes out as 4 to 20 minutes. Look closely at that upper end: it is capped at exactly 20, the largest wait time Tuesday actually had. And 20 shows up in 1306 of the 2000 resamples, 65.3% of them, because resampling with replacement from only 5 numbers can never produce a value bigger than the biggest one already in hand.

If the shop's real longest wait, on an ordinary Tuesday with more customers, is actually higher than 20, say 30 minutes, this interval could never catch it. Not because of bad luck, but because the maximum of a resample can never exceed the maximum of the original sample. No amount of bootstrapping fixes that.

::widget bootstrap-sample {"n": 5, "tail": "Only five distinct waits to draw from. Twenty comes back in most resamples; nothing goes higher."}

Press "Draw again" a few times here. With only 5 original waits to choose from, 20 reappears constantly, and nothing in any resample can ever beat it. That is exactly the mechanism behind the capped interval above: a small sample, bootstrapped for a statistic like the maximum, badly undercovers because the resampling process is boxed in by what the original sample happened to contain.

=== step === quiz
## Quick check: the interval's meaning against the coverage number

187 of 200 simulated intervals caught the true median, 93.5%, and Tuesday's bootstrap interval for the maximum came up capped at 20, short of whatever the shop's real longest wait might be. What do those two results actually show?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- 95% describes how often the procedure catches the truth across many samples, not the chance that one particular interval is right, and the bootstrap can badly undercover for a statistic like a maximum drawn from a small sample. ::ok Right. 93.5% is how often resample, recompute and cut-the-tails caught the truth across 200 tries, which is what 95% actually promises. And the maximum on Tuesday's 5 wait times shows exactly where that promise can fail: a small sample boxes the resampled statistic in.
- There was a 95% chance that each of the 200 intervals contained the true median, and the maximum's interval only came up short because of bad luck in that one Tuesday sample. ::no
- Both results describe the same thing: a percentile interval always reaches close to 95% coverage, no matter which statistic or sample size built it. ::no Neither reading holds up. 95% is never a probability attached to one already-built interval, it is a rate measured across many. And the maximum's interval on Tuesday did not fall short from bad luck: a resample drawn from only 5 numbers can never beat the largest one already there, so that interval is capped on principle, not by chance.

=== step === tryit
## Your turn: build a percentile interval for a new sample

A different coffee cart down the street shares its own wait times, in minutes: 3, 4, 4, 5, 6, 6, 7, 9, 10, 15. Build the resample-and-recompute the same way as before, then write the one line that reads the 95% percentile interval off the result.

```r
# A different coffee cart's wait times, in minutes
new_waits <- c(3, 4, 4, 5, 6, 6, 7, 9, 10, 15)

# Resample with replacement and recompute the median, 2000 times
set.seed(7)
boot_new <- replicate(2000, median(sample(new_waits, length(new_waits), replace = TRUE)))

# Write the line that reads the 95% percentile interval off boot_new:

```
::check {"regex": "quantile[(]\\s*boot_new\\s*,\\s*c[(]\\s*0.025\\s*,\\s*0.975\\s*[)]\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: 4 to 9 minutes. The same quantile() line from earlier, pointed at a new cart's bootstrap medians, reads its own 95% percentile interval straight off.", "no": "Reuse the quantile line from earlier in this lesson, pointed at boot_new instead: quantile(boot_new, c(0.025, 0.975))"}
::solution
```r
# The 95% percentile interval for the new cart's median wait
quantile(boot_new, c(0.025, 0.975))
#>  2.5% 97.5% 
#>     4     9 
```

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Efron, B. (1979). Bootstrap methods: another look at the jackknife](https://doi.org/10.1214/aos/1176344552). *Annals of Statistics*, 7(1), 1-26.
- [Efron, B. and Tibshirani, R. (1993). An Introduction to the Bootstrap](https://www.routledge.com/product/isbn/9780412042317). Chapman and Hall/CRC.
- [Davison, A.C. and Hinkley, D.V. (1997). Bootstrap Methods and Their Application](https://www.cambridge.org/core/books/bootstrap-methods-and-their-application/ED2FD043579F27952363566DC09CBD6A). Cambridge University Press.
- [R documentation for sample(), replicate() and quantile()](https://search.r-project.org/R/refmans/base/html/sample.html)
- [Canty, A. and Ripley, B. boot: Bootstrap R (S-Plus) Functions](https://cran.r-project.org/package=boot)

=== step === complete
## The bootstrap in three lines

Mo's 16 wait times turned into a recipe that works on almost any statistic:

- Resample the original data with replacement, same size as the original.
- Recompute the statistic on that resample, and repeat it 2000 times or more.
- Read the interval straight off the percentiles of those resampled values, no formula required.

That same recipe handed Mo both a 95% interval for her median, 6 to 10 minutes, and a standard error, 0.93 minutes, with no algebra anywhere.

But 95% describes the recipe run over and over, not any one interval it produces, and the recipe can fail. A small sample bootstrapping a statistic like a maximum gets boxed in by whatever happened to be in that one sample, and no number of resamples fixes that.

The percentile interval you built here is also not the only version of a bootstrap interval. Other versions correct for a resampled distribution that is skewed rather than symmetric. Whichever version you reach for, check its actual coverage rather than assuming the label on it is right.
