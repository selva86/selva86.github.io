---
title: "Confidence Intervals and P-Values Lesson 4: Checking that your intervals actually cover"
catalog_blurb: "Measure how often your interval recipe actually contains the truth, not just the label."
description: "A confidence interval's 95% is a claim about the recipe that built it, not about one interval. Simulate thousands of samples to check whether that holds."
keywords: "confidence interval, coverage, coverage probability, z interval, t interval, percentile bootstrap, skewed population, sample size, simulation, standard error, R"
post_type: "LESSON"
curriculum_id: "4.30.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-inference"
course_title: "Confidence Intervals and P-Values"
course_lesson: "4"
course_total: "6"
course_landing: "Confidence-Intervals-and-P-Values-Course.html"
course_next: "Standard-Errors-You-Can-Trust.html"
course_prev: "Inference-by-Simulation-Instead-of-Formula.html"
---

=== step === cover
## Checking that your intervals actually cover

Today let's check whether a 95% confidence interval actually covers the truth 95% of the time, the way its label says.

Picture a clinic's walk-in desk. Every patient's wait, in minutes, gets logged at the front desk. Most patients wait only a few minutes, but a few wait much longer, so the wait times are skewed, pulled hard to the right by that long tail. Across every patient who could ever walk through that door, the true average wait is 4 minutes.

In real work you would never know that true average ahead of time. Not knowing it is exactly why anyone reaches for a confidence interval in the first place. But to check whether a 95% interval's label is honest, this lesson needs to know the true answer before building anything.

Draw a small sample of 5 wait times, and build the usual 95% interval for the average wait from that one sample. Now repeat the whole thing 60 times over: 60 fresh samples of 5 wait times each, 60 intervals. If the 95% on the label means what it says, only about 3 of those 60 should miss the true average.

Here is what 60 of them actually look like, drawn from a population skewed the same way the clinic's wait times are.

::widget ci-coverage {"method":"z","parent":"skew","n":5}

50 of those 60 touch the true value marked on the chart. 10 miss it outright, and every single one was built the exact same honest way, with the exact same 95% formula. So what happened to the other 10? That is exactly what this lesson is about.

=== step === concept
## One sample, one interval, and no way to tell if it covers

Before asking why some of those sixty missed, build one confidence interval the usual way, using one real sample of the clinic's wait times, so there's something concrete on the page to ask the question about.

```r
# Draw one sample of 5 clinic wait times and build its 95% interval
set.seed(42)
clinic_sample5 <- rexp(5, rate = 0.25)
round(clinic_sample5, 2)

xbar <- mean(clinic_sample5)
se   <- sd(clinic_sample5) / sqrt(5)
ci   <- xbar + c(-1, 1) * qnorm(0.975) * se

round(c(xbar = xbar, se = se, lower = ci[1], upper = ci[2]), 2)
#> [1] 0.79 2.64 1.13 0.15 1.89
#>  xbar    se lower upper 
#>  1.32  0.43  0.47  2.17 
```

Five wait times came back: 0.79, 2.64, 1.13, 0.15, 1.89 minutes. `xbar`, the sample mean, is their average: 1.32 minutes. `se`, the standard error, is how much that average would move around if you kept drawing fresh samples of 5 and recomputing the mean each time: 0.43 here.

The interval itself is built the usual way: take the sample mean, then add and subtract a margin of error. That margin is `qnorm(0.975)`, the normal distribution's cutoff that leaves 2.5% in each tail, multiplied by the standard error. Because that margin comes from the normal distribution, this kind of interval is called a z interval, and its two ends, 0.47 and 2.17, are exactly `xbar` minus and plus that one margin.

Look at where that interval sits: 0.47 to 2.17. The true average wait is 4 minutes, and 4 is nowhere inside that range. This one interval, built the honest way with the correct formula, missed.

[NOTE]
In a real analysis you would never know the true average wait is 4 minutes; that is the whole reason you built the interval in the first place. So this particular miss would be completely invisible. Nothing about the interval itself, 0.47 to 2.17, looks any different from one that actually does contain the truth.

So this one interval cannot tell you whether its own recipe is trustworthy. It is a single outcome, and a single outcome of even an honest recipe is sometimes going to miss. What you need is not one interval, but a way to check the recipe itself.

=== step === concept
## Measuring a recipe instead of trusting its label

One miss proves nothing by itself. Even an honest 95% recipe is allowed to miss sometimes, and the question is how often. To answer that for real, build the same recipe thousands of times against the clinic's known true average, and count how many of those intervals actually contain it.

```r
# Measure how often an interval recipe actually covers mu, over many repeated samples
coverage <- function(n, reps, method, mu = 4, rate = 0.25, B = 1000) {
  hits <- replicate(reps, {
    x <- rexp(n, rate = rate)
    xbar <- mean(x)
    se <- sd(x) / sqrt(n)
    if (method == "z") {
      lower <- xbar - qnorm(0.975) * se
      upper <- xbar + qnorm(0.975) * se
    } else if (method == "t") {
      lower <- xbar - qt(0.975, df = n - 1) * se
      upper <- xbar + qt(0.975, df = n - 1) * se
    } else if (method == "boot") {
      boot_means <- colMeans(matrix(sample(x, n * B, replace = TRUE), nrow = n))
      bounds <- quantile(boot_means, c(0.025, 0.975))
      lower <- bounds[1]
      upper <- bounds[2]
    }
    (mu >= lower) && (mu <= upper)
  })
  mean(hits)
}

set.seed(1)
round(coverage(5, 10000, "z"), 3)

set.seed(1)
round(coverage(80, 10000, "z"), 3)
#> [1] 0.809
#> [1] 0.935
```

`coverage()` repeats one recipe `reps` times. Each pass draws a fresh sample of size `n`, builds an interval the way `method` says to, and records `TRUE` in `hits` if the true value `mu` falls between that interval's `lower` and `upper` bound. `mean(hits)` at the end is simply the share of those passes that hit: the fraction of intervals that actually contained the truth.

That fraction has a name. It is the recipe's coverage: how often, across many repeated samples, the interval it builds actually contains the true value.

Run `coverage()` on the z recipe at n = 5, the same recipe and sample size as the single interval from a moment ago, and it covers only 80.9% of the time, not 95%. Push the sample size up to n = 80, and coverage climbs to 93.5%, better, but still short of the label.

[KEY INSIGHT]
A 95% on an interval's label is a claim about its recipe, not a fact you can take on faith. Coverage is how you check that claim: build the recipe many times against a truth you already know, and count the hits. The habit, not any single formula, is the real subject of this lesson.

=== step === widget
## Watching a recipe fail, sixty intervals at a time

The same kind of widget you saw at the very top lets you drive it yourself now: switch the recipe, the population, or the sample size, and watch the count move.

::widget ci-coverage {"method":"z","parent":"skew","n":5}

[NOTE]
The skewed population built into this widget has a true average of 1, not 4, just to keep its own numbers small. But an exponential distribution, the shape both this population and the clinic's wait times share, keeps the same skew at every scale: multiply every one of its values by 4, and the mean becomes 4, the margin of error multiplies by 4 too, and whether the true value sits inside the interval does not change. So a hit on the widget's population of mean 1 is a hit on the clinic's wait times of mean 4 as well, and the count below carries over exactly.

At the z recipe, skewed population, n = 5, the count reads 50 of 60: 83%, short of the 95% the label claims. Switch the top toggle to the bootstrap, keeping the same population and the same n = 5, and the count drops further, to 48 of 60: 80%, no better than z.

Both numbers came from the same sixty samples, just read back through two different recipes. Neither one reaches that 95% on a skewed population this small.

=== step === quiz
## Quick check: what does the 95% actually refer to?

Two intervals have missed so far, the one built by hand and the fifty-of-sixty on the widget just above. Which sentence says what that 95% actually means?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- If the recipe above were run many times on fresh samples, about 95% of the intervals it produced would contain the true value. ::ok Right. The 95% belongs to the recipe, run many times over, not to any one interval it happens to produce. That is exactly what the widget's sixty intervals, and the coverage() counts from a moment ago, were built to show.
- There is a 95% probability that this particular interval, 0.47 to 2.17, contains the true value. ::no
- A wider interval means more confidence that it contains the true value. ::no Both of these miss it. Once an interval's two endpoints are computed from one sample, they are fixed numbers, and the true value either sits between them or it does not, so there is no probability left to attach to that one interval. And width is not the same thing as coverage: a wider interval is not automatically a more trustworthy one, only checking its hit rate over many repeats, the way the widget and coverage() just did, tells you that.

=== step === concept
## Why the t interval and the bootstrap do not fully rescue skew

z was not the only recipe available. Run the same `coverage()` function on the t interval and on the percentile bootstrap, at the same n = 5, and compare all three side by side.

```r
# Compare the z, t and bootstrap recipes at n = 5, using the same coverage() function
set.seed(1)
z_n5 <- coverage(5, 10000, "z")

set.seed(2)
t_n5 <- coverage(5, 10000, "t")

set.seed(3)
boot_n5 <- coverage(5, 2000, "boot")

round(c(z = z_n5, t = t_n5, boot = boot_n5), 3)
#>     z     t  boot 
#> 0.809 0.882 0.772 
```

The t interval uses the same recipe as z, but its margin comes from the t-distribution instead of the normal, a slightly wider cutoff that pays for estimating the standard error from the sample itself rather than knowing it in advance. The percentile bootstrap works differently again: resample the one sample with replacement 1,000 times, recompute the mean on each resample, and take the middle 95% of those 1,000 resampled means as the interval.

Read the three numbers. The t interval reaches 88.2%, better than z's 80.9%, since its wider margin genuinely helps. But the percentile bootstrap covers only 77.2%, worse than z, not better.

Why does the bootstrap do worse here? It only ever resamples the five points already in hand. Five points drawn from a population with a long right tail rarely include enough of that tail to represent it, so resampling just those five cannot rebuild a shape they never fully captured in the first place.

[KEY INSIGHT]
Fixing one broken assumption does not fix an unrelated one. The t interval's wider margin solves the problem of not knowing the standard error in advance; it was never built to solve skew, and it only partly does by accident. The bootstrap has its own separate weakness on a skewed population this small, and neither recipe closes the gap to 95% on its own.

=== step === widget
## Watching coverage climb back toward 95% as the sample grows

Every number so far used a sample of only 5. Does growing the sample fix the shortfall? Run the z recipe's `coverage()` at five different sample sizes and plot the result.

::widget chart-plotter {"data":[{"x":5,"y":0.809,"fill":"z interval"},{"x":10,"y":0.869,"fill":"z interval"},{"x":20,"y":0.905,"fill":"z interval"},{"x":40,"y":0.928,"fill":"z interval"},{"x":80,"y":0.935,"fill":"z interval"}],"x":"n","y":"coverage","geoms":["point","line"]}

At n = 5 the z recipe covers 80.9% of the time. At n = 10 it reaches 86.9%. At n = 20 it is 90.5%, at n = 40 it is 92.8%, and at n = 80 it reaches 93.5%, each number from `coverage()` run 10,000 times at that sample size.

The climb is real. But look at where it stops: even at n = 80, a sample size most practitioners would call plenty, coverage still has not reached the 95% on the label.

That is because the normal approximation behind the z interval improves gradually as the sample grows, not all at once at some fixed size. A skewed population fades toward looking normal slowly, so the fix is slow too, and "large enough" turns out to depend on exactly how skewed the population is, not on one round number everyone can rely on.

=== step === quiz
## Quick check: reading a coverage result like a practitioner

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- n = 80 is always enough, since the Central Limit Theorem guarantees the sampling distribution of the mean is close to normal by then. ::no
- At n = 80 the z interval still covers only 93.5%, so check coverage on data shaped like your own population instead of assuming any one sample size is automatically safe. ::ok Right. The climb from 80.9% at n = 5 to 93.5% at n = 80 is genuine progress, but it was still short of 95% at the largest size this lesson tried. That is exactly why checking coverage on data shaped like your own population beats assuming a round sample size is automatically enough.
- The 1.5-point gap between 93.5% and 95% means there is an arithmetic error somewhere in the coverage() function. ::no Both of these miss it. The Central Limit Theorem does make the z interval's coverage improve as n grows, but how fast it improves depends on how skewed the population is, so no single sample size is "always enough" for every population. And the gap is not an arithmetic error: every number above came from running the same honest recipe 10,000 times; the shortfall is the recipe meeting a population shape it was not built for, not a mistake in the counting.

=== step === tryit
## Your turn: measure a recipe's coverage yourself

`coverage()` has now shown you the z recipe, the t recipe and the bootstrap, each at n = 5. Here is a simplified version of it, built just for the bootstrap, at a new sample size, n = 10, with one line left as a placeholder: the same hit test `coverage()` has used every time so far.

```r
# Finish the hit test: replace NA with TRUE when mu sits between the interval's lower and upper bound
coverage <- function(n, reps, mu = 4, rate = 0.25, B = 1000) {
  hits <- replicate(reps, {
    x <- rexp(n, rate = rate)
    boot_means <- colMeans(matrix(sample(x, n * B, replace = TRUE), nrow = n))
    bounds <- quantile(boot_means, c(0.025, 0.975))
    lower <- bounds[1]
    upper <- bounds[2]
    NA
  })
  mean(hits)
}

set.seed(4)
round(coverage(10, 2000), 3)
```
::check {"regex": "mu\\s*>=\\s*lower\\s*[)]?\\s*&&\\s*[(]?\\s*mu\\s*<=\\s*upper", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.854. Better than the percentile bootstrap's 77.2% at n = 5, and for the same reason the z and t recipes improved: more data pins the sample closer to the true shape it was drawn from.", "no": "Replace NA with the same hit test coverage() has used every time so far: mu >= lower and mu <= upper, joined with &&."}
::solution
```r
# Percentile-bootstrap coverage at n = 10, hit test filled in
coverage <- function(n, reps, mu = 4, rate = 0.25, B = 1000) {
  hits <- replicate(reps, {
    x <- rexp(n, rate = rate)
    boot_means <- colMeans(matrix(sample(x, n * B, replace = TRUE), nrow = n))
    bounds <- quantile(boot_means, c(0.025, 0.975))
    lower <- bounds[1]
    upper <- bounds[2]
    mu >= lower && mu <= upper
  })
  mean(hits)
}

set.seed(4)
round(coverage(10, 2000), 3)
#> [1] 0.854
```

0.854: better than the 77.2% the same bootstrap recipe covered at n = 5. Ten points from a skewed population still carry more of its long right tail than five do, so the resampled intervals land closer to where the truth actually sits, the same reason growing the sample helped the z and t recipes earlier.

=== step === concept
::prose-only the sources are text, not a visual
## References

- [What teachers should know about the bootstrap: resampling in the undergraduate statistics curriculum](https://doi.org/10.1080/00031305.2015.1089789). Hesterberg, T. (2015), The American Statistician, 69(4), 371-386. Treats coverage as the standard way to judge whether an interval recipe, bootstrap or otherwise, is actually trustworthy.
- [An Introduction to the Bootstrap](https://doi.org/10.1201/9780429246593). Efron, B. and Tibshirani, R. (1993), Chapman and Hall/CRC. The percentile interval checked for coverage throughout this lesson comes from here.
- [Bootstrap Confidence Intervals](https://doi.org/10.1214/ss/1032280214). DiCiccio, T. and Efron, B. (1996), Statistical Science, 11(3), 189-228. Compares the percentile interval against other bootstrap recipes built to correct for exactly the kind of shortfall measured in this lesson.
- [All of Statistics](https://doi.org/10.1007/978-0-387-21736-9). Wasserman, L. (2004), Springer, Chapter 6 (confidence intervals) and Chapter 8 (the bootstrap). The formal treatment behind every recipe compared here.

=== step === complete
## The habit, and what to do with it

Every coverage check in this lesson used the same three ingredients: a recipe for building an interval, a population with a known true value to simulate from, and a count of how often the interval actually contained that value over many repeats.

Run those three ingredients on the clinic's wait times, and here is what came back. The z recipe covered only 80.9% of the time at a sample of 5, far short of its 95% label. The t recipe helped a little, reaching 88.2%, because it only pays for not knowing the standard error in advance, a separate problem from skew. The percentile bootstrap did no better, at 77.2%, because five points from a long right tail rarely carry enough of that tail to rebuild it by resampling. Growing the sample helped the most of all, climbing the z recipe to 93.5% at n = 80, and even that fell short of 95%.

One rule falls out of all four numbers. A skewed population hurts a small sample's coverage more than switching to any single textbook recipe fixes, and the bootstrap is not an automatic cure for it. The only way to know whether a particular recipe is trustworthy on data shaped like yours is the one used throughout this lesson: build it, run it against a known truth thousands of times, and count the hits.

The next lesson in this course looks at what to do when the standard error itself, not just the interval recipe, cannot be trusted.
