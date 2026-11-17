---
title: "Confidence Intervals and P-Values Lesson 3: Inference by simulation instead of formula"
catalog_blurb: "Test any statistic for significance by shuffling group labels thousands of times."
description: "A permutation test gives you a real p-value for any statistic, even one like the median with no formula, by shuffling group labels thousands of times."
keywords: "permutation test, simulation-based inference, shuffle test, randomization test, null distribution, p-value, median, trimmed mean, resampling, group labels, t-test, R"
post_type: "LESSON"
curriculum_id: "4.30.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-inference"
course_title: "Confidence Intervals and P-Values"
course_lesson: "3"
course_total: "6"
course_landing: "Confidence-Intervals-and-P-Values-Course.html"
course_next: "Checking-That-Your-Intervals-Actually-Cover.html"
course_prev: "What-a-P-Value-Is-and-Is-Not.html"
---

=== step === cover
## Inference by simulation instead of formula

Today let's look at a test where the usual formula already works, and then build a way to run that same test, and others like it, with no formula at all.

A checkout redesign went out to twenty customers: ten saw the classic checkout and ten saw a new one, and the time each person took to finish, in seconds, was recorded for all twenty. The ten classic times run from 38 to 45 seconds. The ten new-flow times mostly sit lower, in the high twenties and low thirties, except for one customer whose checkout stalled at 95 seconds.

Here is what those twenty checkout times look like, split by flow.

::widget chart-plotter {"data":[{"x":"Classic","y":38},{"x":"Classic","y":41},{"x":"Classic","y":44},{"x":"Classic","y":39},{"x":"Classic","y":42},{"x":"Classic","y":45},{"x":"Classic","y":40},{"x":"Classic","y":43},{"x":"Classic","y":41},{"x":"Classic","y":39},{"x":"New","y":30},{"x":"New","y":32},{"x":"New","y":29},{"x":"New","y":31},{"x":"New","y":33},{"x":"New","y":30},{"x":"New","y":28},{"x":"New","y":31},{"x":"New","y":32},{"x":"New","y":95}],"x":"flow","y":"seconds","geoms":["boxplot","histogram"],"code":{"boxplot":"ggplot(checkout, aes(flow, seconds)) +\n  geom_boxplot()","histogram":"ggplot(checkout, aes(seconds)) +\n  geom_histogram(bins = 8) +\n  facet_wrap(~flow)"}}

=== step === concept
## The average checkout time, and what the t-test says about it

Start with the most familiar comparison there is: the average time for each group.

```r
# The checkout times for each flow, and the gap between their means
classic <- c(38, 41, 44, 39, 42, 45, 40, 43, 41, 39)
new_flow <- c(30, 32, 29, 31, 33, 30, 28, 31, 32, 95)
checkout <- data.frame(flow = rep(c("Classic", "New"), each = 10), seconds = c(classic, new_flow))

mean(classic)
mean(new_flow)
mean(classic) - mean(new_flow)
#> [1] 41.2
#> [1] 37.1
#> [1] 4.1
```

The new flow's average is 4.1 seconds faster. That looks promising, but a gap between two averages can show up even when nothing real changed, just from which ten customers happened to land in which group. The standard way to check that is a two-sample t-test.

```r
# A two-sample t-test on the same two groups
t.test(classic, new_flow)
#>
#> 	Welch Two Sample t-test
#>
#> data:  classic and new_flow
#> t = 0.6316, df = 9.2288, p-value = 0.543
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -10.52938  18.72938
#> sample estimates:
#> mean of x mean of y
#>      41.2      37.1
```

The line that matters is p-value = 0.543. That p-value comes from a formula: it assumes the sampling distribution of a mean difference follows a known shape, the t-distribution, and reads off how far 4.1 seconds sits inside that shape. A p-value this large, far above the usual 0.05 cutoff, gives no reason to think the two flows really differ. So on the mean alone, nothing here shows the new checkout is actually faster.

=== step === concept
## The median shows a bigger gap, and there is no table for it

The mean is not the only way to summarize these two groups. Look at the median instead: the middle value once each group's ten times are sorted from smallest to largest.

```r
# The median checkout time for each flow, and the gap between them
median(classic)
median(new_flow)
median(classic) - median(new_flow)
#> [1] 41
#> [1] 31
#> [1] 10
```

That gap is ten seconds, much bigger than the mean's 4.1 seconds, and it points the same way: the new flow looks faster. The one 95 second checkout barely moves the median, since the median only looks at the middle value and not how far the extremes sit. The mean gets pulled upward by that one outlier instead, which is part of why its own gap looked smaller.

But here is the problem. For the mean, a ready-made test exists: the t-test, built on a known fact about how a sample mean behaves, whatever shape the underlying data takes. For the median, no such shortcut exists. At a sample size of ten, no formula and no table says how big a median gap should typically be if the two groups are really the same.

=== step === concept
## The permutation idea: shuffle the labels, not the data

Here is the idea that gets around having no formula. If the checkout flow truly made no difference, then which 10 of the 20 recorded times happened to get called Classic, and which got called New, was arbitrary. Pool all 20 times together, shuffle them, and call the first ten shuffled values Classic and the last ten New. That is a random relabeling of the same 20 real times, and it shows what a median gap looks like when the label carries no real information.

```r
# Pool both groups' times, shuffle them, then split the shuffled list the same way
pooled <- c(classic, new_flow)
set.seed(1)
shuffled <- sample(pooled)

shuffled[1:10]
shuffled[11:20]
median(shuffled[1:10]) - median(shuffled[11:20])
#>  [1] 39 40 38 41 29 32 30 28 31 44
#>  [1] 31 42 41 30 45 33 32 39 95 43
#> [1] -5
```

Both the fast times and the one slow 95 second checkout can land on either side now, since the labels were reassigned at random. This particular shuffle happened to put more of the slower times on the first side, so its median gap comes out at -5, nowhere near the real 10. One shuffle like this is a single draw from what pure chance can produce, not nearly enough on its own to say anything.

=== step === concept
## Repeating the shuffle ten thousand times: the null distribution

One shuffle only shows one possible outcome under pure chance. To see the full range chance can produce, repeat the shuffle-and-recompute step thousands of times and store every result. The `replicate()` function does exactly that: run the code inside it a set number of times and collect each result into one vector.

```r
# Repeat the shuffle-and-recompute step 10,000 times, storing every result
set.seed(2026)
median_null <- replicate(10000, {
  shuffled <- sample(pooled)
  median(shuffled[1:10]) - median(shuffled[11:20])
})

sd(median_null)
sum(abs(median_null) >= 10)
#> [1] 5.610948
#> [1] 85
```

That vector, `median_null`, holds 10,000 median gaps, every one of them built from a random relabeling where the flow carried no real information. Together they spread out with a standard deviation of about 5.61 seconds. Only 85 of the 10,000 land at a gap of 10 seconds or more in either direction, the same size or bigger than the real 10 second gap between the two medians. In other words, a gap this large shows up only about 0.85% of the time by pure chance.

The widget below plays out that same 0.85% chance over and over on its own, one simulated shuffle at a time, so you can watch how rarely it actually lands.

::widget luck-simulator {"trials":1,"p":0.0085,"observed":1,"unit":"shuffles landing a median gap of 10 seconds or more"}

=== step === quiz
## Quick check: what a shuffle actually simulates

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- It reassigns which 10 of the 20 recorded times are called Classic and which are called New, using every one of the 20 real times exactly once. ::ok Right. Every real time gets used exactly once; only the label attached to it changes. That is why a label shuffle needs no new data, just a new assignment of the same 20 numbers.
- It draws 20 new times with replacement from the pooled 20, so some times can appear twice in a shuffle and others not at all. ::no
- It replaces each of the 20 recorded times with a freshly generated random number, so the checkout times themselves change from shuffle to shuffle. ::no A permutation shuffle never touches the 20 recorded times themselves, and it never draws a time twice or skips one, unlike sampling with replacement. It only reassigns which label sits on which time, keeping the set of 20 values exactly fixed.

=== step === concept
## Turning the shuffle count into a permutation p-value

85 out of 10,000 is already a rate, but it helps to turn it into a p-value using the exact formula a permutation test always uses.

```r
# Turn the shuffle count into an exact permutation p-value
observed_median_gap <- median(classic) - median(new_flow)
count <- sum(abs(median_null) >= abs(observed_median_gap))
p_value <- (1 + count) / (10000 + 1)

observed_median_gap
count
p_value
#> [1] 10
#> [1] 85
#> [1] 0.00859914
```

The formula is p = (1 + count) / (B + 1), where count is 85, the number of shuffles that reached a gap this big, and B is 10,000, the number of shuffles run. The extra +1 on both sides counts the real, observed labeling itself as one more valid arrangement among the ones being considered, which is only fair since it really is one of the possible outcomes. That gives a permutation p-value of 0.0086: under pure chance, a median gap this size or bigger would turn up only about 9 times in every 1,000 shuffles. That is strong evidence the new checkout flow is typically faster, and it was found without ever needing a formula for how a median's sampling distribution behaves.

=== step === concept
## The same machinery, a different statistic: trimmed means

Here is the real payoff of building a test this way. The exact same shuffle-and-count routine works for any statistic at all, not just the median. Try it on a 10% trimmed mean: the average after the lowest 10% and highest 10% of each group's values are dropped, a statistic built specifically to ignore outliers like the 95 second checkout.

```r
# The same shuffle routine, with a 10% trimmed mean standing in for the median
set.seed(2026)
trim_null <- replicate(10000, {
  shuffled <- sample(pooled)
  mean(shuffled[1:10], trim = 0.1) - mean(shuffled[11:20], trim = 0.1)
})

observed_trim_gap <- mean(classic, trim = 0.1) - mean(new_flow, trim = 0.1)
count <- sum(abs(trim_null) >= abs(observed_trim_gap))
p_value <- (1 + count) / (10000 + 1)

observed_trim_gap
sd(trim_null)
count
p_value
#> [1] 10.125
#> [1] 3.122244
#> [1] 4
#> [1] 0.00049995
```

Nothing changed in this code except which statistic gets computed inside the shuffle. The observed trimmed-mean gap is 10.125 seconds, close to the median's 10 seconds, and the 10,000 shuffled gaps spread out tighter this time, with a standard deviation of about 3.12 seconds instead of 5.61. Only 4 of the 10,000 shuffles reach a gap that large, giving a permutation p-value of 0.0005, smaller still than the median's 0.0086.

=== step === concept
## Where the shuffle and the t-test agree, and where the formula required an assumption

Now point the same routine at the mean itself, the very statistic the t-test is built to check.

```r
# The same shuffle routine, pointed at the mean itself
set.seed(2026)
mean_null <- replicate(10000, {
  shuffled <- sample(pooled)
  mean(shuffled[1:10]) - mean(shuffled[11:20])
})

observed_mean_gap <- mean(classic) - mean(new_flow)
count <- sum(abs(mean_null) >= abs(observed_mean_gap))
p_value <- (1 + count) / (10000 + 1)

observed_mean_gap
sd(mean_null)
count
p_value
observed_mean_gap / sd(mean_null)
#> [1] 4.1
#> [1] 6.40323
#> [1] 7707
#> [1] 0.7707229
#> [1] 0.6403018
```

The permutation p-value here is 0.7707, close to the t-test's own value of 0.543. Both agree on the conclusion: nothing here shows the new checkout flow is actually faster on the mean alone. But the two numbers are not identical, and the gap between 0.7707 and 0.543 is worth explaining rather than shrugging off.

The t-test's p-value rests on an assumption: that the sampling distribution of the mean difference is close to a normal shape. With a sample of only ten per group, and one 95 second outlier dragging the new flow's values around, that assumption is a poor fit here, which is exactly why the t-test's p-value drifts away from the permutation test's. The permutation test never made that assumption in the first place, since it only ever works from what the data itself can produce by random relabeling, which is why its p-value holds up better on this particular dataset.

The last line above, `observed_mean_gap / sd(mean_null)`, standardizes the 4.1 second gap against how much the shuffled means actually spread out, giving 0.64. The widget below plots a standard normal curve with that same value, 0.64, as the slider's starting point.

::widget null-distribution {"tails":2,"start":0.64,"label":"observed mean gap, standardized"}

=== step === quiz
## Quick check: when the shuffle earns its keep

Of the three statistics covered so far, the mean, the median, and the 10% trimmed mean, which one actually had a ready-made, formula-based test available to check it?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Only the mean. The t-test gave it a formula-based p-value; the median and the 10% trimmed mean had no such formula, and the shuffle produced a p-value for all three anyway. ::ok Right. That gap is exactly the shuffle's advantage: it needs no formula for a statistic's sampling distribution, so a median or a trimmed mean gets the same treatment as a mean.
- None of the three. No summary statistic in this lesson has a known, formula-based sampling distribution. ::no
- All three. A formula-based test exists for the mean, the median, and the trimmed mean alike. ::no The mean has the t-test because of a known fact about how a sample mean behaves, whatever shape the data takes. The median and the 10% trimmed mean have no equivalent formula at a sample size of ten, which is exactly why this lesson reached for a shuffle instead.

=== step === tryit
## Your turn: permutation-test a difference in spread

Everything built so far reused the same shuffle: pool the two groups, shuffle the pooled values, split the shuffle into two tens, and recompute one statistic on each side. Try it on a statistic not used yet: the difference in standard deviation between the two groups, a measure of spread rather than of a typical value.

```r
# This permutation test currently checks a difference in medians.
# Edit the stat() function so it checks a difference in standard
# deviations instead, then run it.
stat <- function(x) median(x)

set.seed(2026)
stat_null <- replicate(10000, {
  shuffled <- sample(pooled)
  stat(shuffled[1:10]) - stat(shuffled[11:20])
})

observed_gap <- stat(classic) - stat(new_flow)
count <- sum(abs(stat_null) >= abs(observed_gap))
p_value <- (1 + count) / (10000 + 1)

observed_gap
count
p_value
```
::check {"regex": "stat\\s*<-\\s*function\\s*[(]x[)]\\s*sd[(]x[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. Swap the statistic and the whole routine, the shuffle, the replicate, the count, carries over untouched: a difference in spread comes back with a permutation p-value of about 0.0001, the smallest of any statistic in this lesson, because the one 95 second outlier makes the two groups' spreads almost impossible to match by chance alone.", "no": "The routine only needs one change: what stat() computes. Swap median(x) for sd(x) inside the function, and leave the replicate() block and the rest of the code exactly as it is."}
::solution
```r
# Permutation test on the difference in standard deviations
stat <- function(x) sd(x)

set.seed(2026)
stat_null <- replicate(10000, {
  shuffled <- sample(pooled)
  stat(shuffled[1:10]) - stat(shuffled[11:20])
})

observed_gap <- stat(classic) - stat(new_flow)
count <- sum(abs(stat_null) >= abs(observed_gap))
p_value <- (1 + count) / (10000 + 1)

observed_gap
#> [1] -18.09877
count
#> [1] 0
p_value
#> [1] 9.999e-05
```

The classic flow's standard deviation is smaller than the new flow's by 18.1 seconds, almost entirely because of that one 95 second checkout. Not one of the 10,000 shuffles reproduces a spread gap that large, so the permutation p-value lands at 0.0001, the smallest of any statistic tried in this lesson.

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Good, P. I. (2005). Permutation, Parametric, and Bootstrap Tests of Hypotheses (3rd ed.)](https://doi.org/10.1007/b138696). Springer. The standard methodological reference for permutation testing.
- [Ernst, M. D. (2004). Permutation methods: a basis for exact inference](https://doi.org/10.1214/088342304000000396). Statistical Science, 19(4), 676-685. On why and when a permutation test is exact.
- [Ludbrook, J. and Dudley, H. (1998). Why permutation tests are superior to t and F tests in biomedical research](https://doi.org/10.1080/00031305.1998.10480551). The American Statistician, 52(2), 127-132. The direct comparison this lesson's closing steps echo.
- [Hesterberg, T. C. (2015). What teachers should know about the bootstrap: resampling in the undergraduate statistics curriculum](https://doi.org/10.1080/00031305.2015.1089789). The American Statistician, 69(4), 371-386. Covers the shuffle-based logic behind both permutation and bootstrap methods.

=== step === complete
## What the shuffle buys you that a formula cannot

Three permutation p-values came out of this lesson, every one of them from the identical shuffle-and-count routine with only the statistic changed. The median gap of 10 seconds came back with a permutation p-value of 0.0086. The 10% trimmed mean gap of 10.125 seconds came back at 0.0005. The mean gap of 4.1 seconds came back at 0.7707, close to the t-test's own 0.543, which is the one case where a formula-based test was available to check the work.

That is the whole payoff. A median and a trimmed mean have no textbook formula for their sampling distribution at a sample size this small, and the t-test cannot be borrowed for them either, since it was built specifically for a mean. The shuffle needed none of that. It only ever worked from what the data itself can produce when the group label carries no real information, and it gave back that answer the same way no matter which statistic sat inside it.
