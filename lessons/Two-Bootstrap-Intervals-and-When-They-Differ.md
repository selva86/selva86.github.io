---
title: "Estimation and the Bootstrap Lesson 5: Two bootstrap intervals, and when they differ"
catalog_blurb: "See a percentile interval and a BCa interval diverge, and which one to trust."
description: "Build a percentile bootstrap interval and a bias-corrected BCa interval from the same resamples, then check how often each one really covers the truth."
keywords: "bootstrap confidence interval, BCa, bias correction, acceleration, jackknife, percentile interval, coverage, R"
post_type: "LESSON"
curriculum_id: "4.20.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-estimation"
course_title: "Estimation and the Bootstrap"
course_lesson: "5"
course_total: "7"
course_landing: "Estimation-and-the-Bootstrap-Course.html"
course_next: "Estimating-Error-by-Leaving-One-Out.html"
course_prev: "How-Much-Information-a-Sample-Carries.html"
---

=== step === cover
## Two bootstrap intervals, and when they differ

Today let's take one bootstrap distribution and cut it at two different places, and see how much that choice actually moves the answer.

A small insurer has twelve claims filed this month, in dollars: 185, 205, 198, 220, 210, 192, 230, 178, 1850, 240, 202, 215. Eleven of them sit under $250. The twelfth, $1850, is nearly eight times the next largest claim in the batch.

The strip below stands for those twelve claims, one badge per claim, numbered in the order just listed. Press "Draw again" and watch which claims get picked more than once, and which get left out entirely, when R resamples all twelve with replacement.

::widget bootstrap-sample {"n": 12, "seed": 2026, "tail": "Claim 9 is the one at 1850 dollars. Whenever it lands twice or more in a draw, it pulls the mean of that resample well above the rest."}

Claim 9 is the badge to watch. Every draw either includes it, once or several times, or leaves it out completely, and that single difference changes everything about the resample it lands in.

=== step === concept
## Twelve claims, one mean, and the percentile bootstrap

The twelve claims and their mean come first, since every number after this builds on them.

```r
# Twelve claims, in dollars, and their sample mean
claims <- c(185, 205, 198, 220, 210, 192, 230, 178, 1850, 240, 202, 215)
mean(claims)
#> [1] 343.75
```

$343.75 is the sample mean, the one number that summarizes all twelve claims. It sits well above most of the individual claims, which cluster under $250, because the $1850 claim alone drags it up.

That one number came from this one month's twelve claims. A different month, a different twelve claims, a different mean. The bootstrap builds an interval around $343.75 without any formula for how far it could move, by resampling the twelve claims themselves.

```r
# Resample the 12 claims with replacement, recompute the mean, 2000 times
set.seed(2026)
boot_means <- replicate(2000, mean(sample(claims, 12, replace = TRUE)))
summary(boot_means)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>   190.3   210.2   342.7   348.5   476.2   899.1 
```

`sample(claims, 12, replace = TRUE)` draws twelve claims with replacement from the original twelve, the same mechanic the widget above just showed. `replicate(2000, ...)` does that, and recomputes the mean, 2000 times, and `boot_means` holds every one of those 2000 resampled means.

Look at the summary. The median resampled mean, 342.7, sits close to the original $343.75. But the mean of the 2000 resampled means, 348.5, sits a little higher than that median, and the top end reaches all the way to 899.1, far past the bottom end's 190.3. A distribution whose mean sits above its median, with a long reach on the high side and a short one on the low side, is right-skewed. That shape is not an accident. It is the $1850 claim, showing up zero, one, two or more times across the 2000 resamples, stretching the high side every time it repeats.

Those 2000 resampled means already contain a 95% interval, with no formula at all. Cut off the bottom 2.5% and the top 2.5%, and what is left in the middle is the interval.

```r
# Cut the bottom 2.5% and top 2.5% off the 2000 resampled means
pct_ci <- quantile(boot_means, c(0.025, 0.975))
pct_ci
#>     2.5%    97.5% 
#> 199.7500 623.0021 
```

$199.75 to $623.00. That is the percentile bootstrap interval for the mean claim amount, read straight off the 2000 resampled means with two calls to `quantile()`.

```r
# Plot the 2000 resampled means and mark where the percentile interval cuts
hist(boot_means, col = "grey85", border = "white",
     main = "2000 bootstrap means", xlab = "Bootstrap mean claim amount ($)")
abline(v = pct_ci, col = "firebrick", lwd = 2, lty = 2)
```

The two dashed lines sit exactly at $199.75 and $623.00, the two numbers `quantile()` just handed back. Almost all of the 2000 resampled means pile up on the left of that picture, under $250, with a thin scatter of much bigger means stretching out to the right. The percentile interval cuts straight through that shape regardless of whether the shape is lopsided. It just takes whatever sits at the 2.5% and 97.5% marks.

=== step === widget
## Why the resampled means come out skewed

$1850 is nearly eight times the next largest claim, $240. That gap is the entire reason `boot_means` came out right-skewed.

A resample that draws the $1850 claim twice or three times pushes its mean well above $343.75. A resample that misses it completely has nowhere to go but down, sitting close to the eleven ordinary claims alone, somewhere near $205. Most resamples land somewhere in between, depending on how many times the one large claim happened to get picked.

::widget bootstrap-sample {"n": 12, "seed": 91, "tail": "Watch claim 9 across each draw. When it lands once it nudges the mean up a little, when it lands twice or more the mean jumps, and when it is missing the mean sits close to the eleven ordinary claims alone."}

Press "Draw again" a few times. Count how many times claim 9 shows up in each draw, and compare that against how far the rest of the strip is pulled. One repeat of an ordinary claim barely moves anything. One repeat of claim 9 moves the whole resample.

=== step === concept
## The bias correction z0: is the bootstrap centered on the mean?

The percentile interval above treats every resampled mean the same, with no regard for whether `boot_means` is centered on $343.75 or sitting off to one side. The bias-correction term, called z0, is the first of two numbers that checks that.

z0 starts from a simple count: of the 2000 resampled means, how many fall below the original mean, $343.75?

```r
# How many of the 2000 resampled means fall below the original mean?
below <- mean(boot_means < mean(claims))
below
#> [1] 0.5315
z0 <- qnorm(below)
z0
#> [1] 0.07904101
```

1063 of the 2000 resampled means, 53.15%, fall below $343.75. `qnorm()` turns that share into a position on the standard normal scale: z0 = 0.079.

If exactly half of `boot_means` sat below $343.75, z0 would come out at 0, meaning the bootstrap distribution needs no bias correction at all, since the original mean sits right at its middle. Here, slightly more than half sit below it, so z0 comes out slightly positive instead, but it is a small number, barely off zero.

That small size is worth sitting with. `boot_means` looked clearly skewed in the histogram above, long on the high side, short on the low side. Yet z0, the number meant to catch bias, comes out almost zero. The reason is specific to the mean as a statistic. Every resample draws from the same twelve claims with equal chance, so the long-run average of a resample's mean is exactly $343.75, no matter how lopsided those twelve claims are. The skew stretches the tail of `boot_means` a long way to the right, but it barely moves where the bulk of `boot_means` sits relative to $343.75. z0 reads that second thing, not the first.

=== step === concept
## The acceleration term a, found by leaving one claim out

z0 checks the bootstrap distribution's position. The second correction, called a, checks something different: how fast the spread of the mean would change if the true claim amount were different. It comes from the jackknife, a separate resampling idea from the bootstrap.

The jackknife is simple to build. Drop one claim, recompute the mean of the remaining eleven. Put that claim back, drop a different one, recompute again. Do that for each of the twelve claims in turn, and you get twelve leave-one-out means.

```r
# Drop each claim in turn and recompute the mean of the remaining 11
jack_means <- sapply(1:12, function(i) mean(claims[-i]))
jack_means
#>  [1] 358.1818 356.3636 357.0000 355.0000 355.9091 357.5455 354.0909 358.8182
#>  [9] 206.8182 353.1818 356.6364 355.4545
```

Eleven of those twelve numbers sit tightly together, between 353.18 and 358.82. Dropping any ordinary claim barely moves the mean, because the $1850 claim is still sitting in the remaining eleven, still pulling the mean up. But the ninth value, 206.8182, breaks that pattern completely. That is what is left once claim 9, the $1850 one, is the claim dropped: the mean of the eleven ordinary claims, on their own, with the large one gone. One leave-one-out mean sitting almost 150 dollars away from the other eleven is exactly what "one claim is carrying this estimate" looks like as a number.

The acceleration term a reads how lopsided those twelve leave-one-out means are.

```r
# The acceleration term: how lopsided are the leave-one-out means?
a <- sum((mean(jack_means) - jack_means)^3) /
  (6 * (sum((mean(jack_means) - jack_means)^2))^1.5)
a
#> [1] 0.1446946
```

a comes out to 0.1447, a value clearly away from zero. An a near zero would say the twelve leave-one-out means are roughly symmetric around their own average. Here they are not: one of them, 206.8182, sits far to one side, and that single lopsided value is almost the whole reason a is as large as it is.

=== step === quiz
## Quick check: what z0 and a are each correcting

Two numbers now sit on the page: z0, which came out to 0.079, and a, which came out to 0.1447. They correct for two different things.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- z0 reads how far the share of resampled means below the original mean sits from one half, while a reads how lopsided the twelve leave-one-out means are, the jackknife's signal for how fast the spread would change with the true claim amount. ::ok Right. z0 only describes where this one bootstrap distribution of 2000 resampled means sits relative to the original mean, $343.75. a only describes how much the twelve leave-one-out means disagree with each other, driven here almost entirely by the one mean, 206.8182, that came from dropping the $1850 claim.
- z0 measures how biased the mean is as an estimator in general, not just the position of this one bootstrap distribution. ::no
- a corrects for having only twelve claims to work with, a small-sample problem. ::no Both miss what the two terms actually read. z0 only describes where this particular set of 2000 resampled means sits relative to the original mean, not some general property of the mean as an estimator; that is why it came out so close to zero even though the data is skewed. And a does not react to sample size directly. It reacts to how much the twelve leave-one-out means disagree with each other, which here comes almost entirely from the one claim that dominates the sum.

=== step === concept
## Assembling BCa: the adjusted percentiles, and the two compared

z0 and a do not touch `boot_means` itself. They change which two percentiles of `boot_means` get read off as the interval's ends, in place of the plain 2.5% and 97.5% used for the percentile interval.

```r
# Shift the two percentile cut points by the bias correction and the acceleration
a1 <- pnorm(z0 + (z0 - 1.96) / (1 - a * (z0 - 1.96)))
a2 <- pnorm(z0 + (z0 + 1.96) / (1 - a * (z0 + 1.96)))
a1
#> [1] 0.08083022
a2
#> [1] 0.998518
```

Instead of 0.025 and 0.975, the BCa recipe reads a1 = 0.0808 and a2 = 0.9985 off `boot_means`. Both adjusted percentiles sit higher than their plain counterparts, pushed up mostly by a, since z0 alone is too small to move them far.

```r
# Read the BCa interval off the same 2000 resampled means, at the shifted percentiles
bca_ci <- quantile(boot_means, c(a1, a2))
bca_ci
#> 8.083022%  99.8518% 
#>  203.0483  890.5908 
```

Set that beside the percentile interval built earlier in this lesson:

- Percentile: $199.75 to $623.00
- BCa: $203.05 to $890.59

The lower end barely moves, from $199.75 up to $203.05. The upper end moves a great deal, from $623.00 up to $890.59, an extra $267.59. That lopsided shift is exactly what reading the 99.85th percentile instead of the 97.5th buys you on a right-skewed distribution: the body of `boot_means` near the low end is dense, so moving from the 2.5th percentile to the 8.08th barely changes anything, but the long thin tail on the high end stretches a long way, so moving from the 97.5th percentile to the 99.85th reaches much further out.

```r
# Plot the resampled means again, this time marking both intervals
hist(boot_means, col = "grey85", border = "white",
     main = "2000 bootstrap means: percentile vs BCa", xlab = "Bootstrap mean claim amount ($)")
abline(v = pct_ci, col = "firebrick", lwd = 2, lty = 2)
abline(v = bca_ci, col = "steelblue", lwd = 2, lty = 3)
```

Four lines now cross the same histogram: the two red dashed percentile cuts, close to the middle of the pile, and the two blue dotted BCa cuts, pulled toward the long right tail. Both intervals come from the exact same 2000 resampled means. The only thing that differs is where each recipe decided to cut.

=== step === widget
## How often a 95% bootstrap interval actually covers the truth

Saying an interval is "95%" is a claim about how often the recipe that built it would catch the truth, run over and over. The widget below checks that claim directly, on its own built-in skewed population rather than the literal claims, since it shares the same right skew and the same small-sample problem.

::widget ci-coverage {"method": "boot", "parent": "skew", "n": 10}

52 of the 60 intervals shown contain the true value, 87%. That already falls short of the 95% the percentile recipe claims, on a population with the same shape of problem as this lesson's twelve claims: a long right tail and only a handful of draws to work with.

=== step === concept
## The honest coverage check: neither interval is there at n = 10

The widget just checked the plain percentile recipe on its own population. Now check both recipes, percentile and BCa, on a population built from the claims themselves: the twelve claims, sampled with replacement, so the true mean is exactly $343.75 and the shape is exactly the one on this page. Draw a fresh sample, bootstrap it, build both intervals, check whether $343.75 falls inside each one. Repeat that 2000 times, at a sample size of 10, then again at 40.

```r
# Check coverage: how often does each recipe's interval actually contain 343.75?
coverage_check <- function(n, reps = 2000, B = 500, mu = 343.75) {
  pct_hits <- 0
  bca_hits <- 0
  for (i in 1:reps) {
    s <- sample(claims, n, replace = TRUE)
    xbar <- mean(s)

    idx <- matrix(sample.int(n, n * B, replace = TRUE), nrow = n)
    boot_i <- colMeans(matrix(s[idx], nrow = n))
    pct_i <- quantile(boot_i, c(0.025, 0.975))
    if (mu >= pct_i[1] && mu <= pct_i[2]) pct_hits <- pct_hits + 1

    jack_i <- (sum(s) - s) / (n - 1)
    a_i <- sum((mean(jack_i) - jack_i)^3) /
      (6 * (sum((mean(jack_i) - jack_i)^2))^1.5)
    p_below <- min(max(mean(boot_i < xbar), 1 / (B + 1)), B / (B + 1))
    z0_i <- qnorm(p_below)
    a1_i <- pnorm(z0_i + (z0_i - 1.96) / (1 - a_i * (z0_i - 1.96)))
    a2_i <- pnorm(z0_i + (z0_i + 1.96) / (1 - a_i * (z0_i + 1.96)))
    bca_i <- quantile(boot_i, c(min(max(a1_i, 0), 1), min(max(a2_i, 0), 1)))
    if (mu >= bca_i[1] && mu <= bca_i[2]) bca_hits <- bca_hits + 1
  }
  c(percentile = pct_hits / reps, bca = bca_hits / reps)
}

set.seed(2026)
cov_10 <- coverage_check(10)
cov_10 * 100
#> percentile        bca 
#>       54.9       52.9 

set.seed(2026)
cov_40 <- coverage_check(40)
cov_40 * 100
#> percentile        bca 
#>       86.3       95.0 
```

At n = 10, the percentile interval contains $343.75 only 54.9% of the time, and BCa does barely better at 52.9%. Both recipes claim 95%. Neither comes close.

The reason traces straight back to the one large claim. Drawing only 10 values with replacement from the twelve claims misses the $1850 claim entirely often enough to matter. When a sample happens to miss it completely, every resample built from that sample is also missing it, so the resampled means it produces, and every interval built from them, sit nowhere near $343.75. No bias correction and no acceleration term can fix an interval built from a sample that never saw the number that matters.

At n = 40, the picture changes, but not evenly. The percentile interval climbs to 86.3%, closer to 95% but still clearly short. BCa climbs further, to 95.0%, essentially matching its claim. Missing the $1850 claim entirely is rare by the time 40 draws are taken, so most samples now carry some information about it. The percentile interval still undercovers anyway, because cutting at the plain 2.5% and 97.5% ignores the skew in the shape in front of it. BCa's two corrections, modest as they looked earlier, turn out to be worth it here: they close the gap that the percentile interval leaves open.

=== step === quiz
## Quick check: reading the coverage honestly

The ci-coverage widget earlier in this lesson ran the plain percentile recipe on its own skewed population at n = 10, and 52 of its 60 intervals contained the truth, 87%. The coverage check just above measured both recipes on the claims-shaped population: at n = 10, the percentile interval hit 54.9% and BCa hit 52.9%; at n = 40, the percentile interval reached 86.3% and BCa reached 95.0%. Which statement reads those numbers correctly?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- BCa corrects where the bootstrap distribution is centered and how its spread responds to the data, but at a small sample, n = 10, it still falls well short of the 95% it claims, just like the percentile interval does. ::ok Exactly. 52.9% at n = 10 is nowhere near 95%, even with both corrections applied. The corrections closed most of the gap by n = 40, where BCa reached 95.0% while the percentile interval was still stuck at 86.3%, but neither recipe is reliable yet at n = 10.
- BCa always hits exactly 95% coverage, which is the whole point of adding the two corrections. ::no
- The percentile interval's real problem is that it comes out too wide. ::no Neither distractor survives the numbers on the page. BCa's 52.9% at n = 10 is nowhere close to "always 95%". And the percentile interval is not too wide, it is too narrow: $423.25 wide against BCa's $687.54. Its failure is in where it sits, not in how wide it is.

=== step === tryit
## Your turn: adjust a percentile for bias and acceleration

A different estimate came with its own 8 bootstrap replicate values: 18, 19, 20, 21, 21, 22, 23, 35. The original estimate itself was 20, and its acceleration term, computed separately, is a = 0.1. Compute z0 the same way as the claims above, then the BCa-adjusted lower percentile a1 the same way.

```r
# Eight bootstrap replicate values for a different estimate, and its given acceleration
new_boot <- c(18, 19, 20, 21, 21, 22, 23, 35)
estimate <- 20
a <- 0.1

# Write the bias correction z0, the same recipe used on the claims above

# Write the BCa-adjusted lower percentile a1, the same recipe used on the claims above

```
::check {"regex": "qnorm[(]\\s*mean[(][^)]*<[^)]*[)]\\s*[)][\\s\\S]*pnorm[(][\\s\\S]*z0[\\s\\S]*a[\\s\\S]*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. z0 comes out negative, -0.6745, since only 2 of the 8 values sit below the estimate, 20. Pushed through the acceleration a = 0.1, the lower cut moves from the plain 2.5th percentile all the way down to the 0.29th, a1 = 0.0029.", "no": "Reuse the two recipes already on the page: z0 <- qnorm(mean(new_boot < estimate)), then a1 <- pnorm(z0 + (z0 - 1.96) / (1 - a * (z0 - 1.96)))."}
::solution
```r
# The bias correction and the BCa-adjusted lower percentile for the new estimate
z0 <- qnorm(mean(new_boot < estimate))
z0
#> [1] -0.6744898
a1 <- pnorm(z0 + (z0 - 1.96) / (1 - a * (z0 - 1.96)))
a1
#> [1] 0.002893193
```

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Better Bootstrap Confidence Intervals](https://doi.org/10.1080/01621459.1987.10478410) - Efron (1987), Journal of the American Statistical Association 82(397), 171-185. The paper that introduced the bias-correction term z0 and the acceleration term a computed by hand in this lesson.
- [An Introduction to the Bootstrap](https://doi.org/10.1201/9780429246593) - Efron and Tibshirani (1993), Chapman and Hall/CRC. Works through the BCa interval end to end, with the same jackknife-based acceleration term used here.
- [Bootstrap Confidence Intervals](https://doi.org/10.1214/ss/1032280214) - DiCiccio and Efron (1996), Statistical Science 11(3), 189-228. Compares BCa against the other bootstrap interval recipes, including the plain percentile interval built earlier in this lesson.
- [Bootstrap Methods and Their Application](https://statwww.epfl.ch/davison/BMA) - Davison and Hinkley (1997), Cambridge University Press. The repeated-sampling coverage check used in this lesson follows the same logic this book builds throughout.

=== step === complete
## What two bootstrap intervals from the same resamples teach

One claim out of twelve, $1850, was the whole story. It skewed `boot_means` right from the start, it barely moved the bias-correction term z0 because resampling a mean is close to bias-free by construction, and it dominated the acceleration term a through one lopsided leave-one-out mean, 206.8182, once it was the claim left out. Those two corrections together moved the BCa interval, $203.05 to $890.59, well past the plain percentile interval, $199.75 to $623.00, mostly by reaching further into the long right tail.

The coverage check kept that honest. At a sample of 10, neither recipe came anywhere near the 95% it claims, 54.9% for percentile and 52.9% for BCa. The corrections only started making a real difference once the sample grew to 40, where BCa closed almost all of the gap and the plain percentile interval did not.

The next lesson takes the leave-one-out computation built here for the acceleration term and turns it into a method of its own: the jackknife, used on its own terms rather than as one ingredient inside BCa.
