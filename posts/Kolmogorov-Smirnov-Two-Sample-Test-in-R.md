---
title: "Kolmogorov-Smirnov Two-Sample Test in R: Compare Two Distributions"
slug: Kolmogorov-Smirnov-Two-Sample-Test-in-R
description: "Use the Kolmogorov-Smirnov two-sample test in R with ks.test() to compare two distributions. Visualize ECDFs, interpret D and p-values, handle ties."
keywords: "kolmogorov-smirnov test r, ks.test, two sample ks test, compare distributions r, ecdf r, nonparametric test r, distribution comparison"
auto_link_terms: "Kolmogorov-Smirnov test|two-sample KS test|KS test in R|ks.test()|empirical CDF|ECDF"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: FR-nonp-3
post_type: FR
fr_parent: When-to-Use-Nonparametric-Tests-in-R.html
difficulty: Intermediate
---

# Kolmogorov-Smirnov Two-Sample Test in R: Compare Two Distributions

<p class="lead">The Kolmogorov-Smirnov two-sample test in R asks whether two samples were drawn from the same continuous distribution. Run it in one line with <code>ks.test(x, y)</code>: the function returns a D statistic (the largest gap between the two empirical CDFs) and a p-value testing the null hypothesis that both samples share a distribution.</p>

The KS test is *distribution-free*, which means it makes no assumption about normality, equal variance, or symmetry. That makes it the right tool when you suspect two groups differ in shape, not just in mean.

## How do you run a two-sample KS test in R?

You have two numeric vectors and you want to know whether they look like they came from the same population. The base-R function `ks.test()` answers that with one call. Generate one normal sample and one uniform sample, hand both to `ks.test()`, and read the verdict from D and the p-value.

```r title="Run the two-sample KS test"
set.seed(101)
x <- rnorm(60, mean = 0, sd = 1)
y <- runif(60, min = -1, max = 1)

ks.test(x, y)
#> 
#>  Asymptotic two-sample Kolmogorov-Smirnov test
#> 
#> data:  x and y
#> D = 0.31667, p-value = 0.005124
#> alternative hypothesis: two-sided
```

D is `0.317`: the empirical cumulative distribution functions of `x` and `y` disagree by 31.7 percentage points at their worst-case point. The p-value of `0.005` is well below the conventional 0.05 threshold, so we reject the null hypothesis that both samples come from the same distribution. That is the answer we expected: a Normal(0, 1) and a Uniform(-1, 1) really are different shapes, and the test sees it.

[TIP]
**Always set a seed before random data.** A line like `set.seed(101)` makes the simulated example reproducible, so your D and p-value match the ones in this post on every re-run.

**Try it:** Run a two-sample KS test on `ex_a` (a sample of 40 from a Normal(5, 1)) and `ex_b` (a sample of 40 from a Normal(5, 1.5)). Print the result.

```r title="Your turn: run ks.test on two samples"
set.seed(11)
ex_a <- rnorm(40, mean = 5, sd = 1.0)
ex_b <- rnorm(40, mean = 5, sd = 1.5)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Run KS on two normals with different sd"
set.seed(11)
ex_a <- rnorm(40, mean = 5, sd = 1.0)
ex_b <- rnorm(40, mean = 5, sd = 1.5)
ks.test(ex_a, ex_b)
#>  Asymptotic two-sample Kolmogorov-Smirnov test
#> 
#> data:  ex_a and ex_b
#> D = 0.225, p-value = 0.2477
```

**Explanation:** Same mean, different standard deviation. With only 40 points per group the test does not reach significance, but D = 0.225 hints that the spreads differ. Bigger samples would sharpen the verdict.

</details>

## What does the D statistic actually measure?

D is a geometric distance. It is the maximum vertical gap between the two empirical cumulative distribution functions (ECDFs) over all values of x. Symbolically:

$$D_{n,m} = \sup_{t} \; \big| F_{1,n}(t) - F_{2,m}(t) \big|$$

Where:

- $F_{1,n}(t)$ = the ECDF of the first sample, with $n$ observations
- $F_{2,m}(t)$ = the ECDF of the second sample, with $m$ observations
- $\sup_t$ = the largest value of the absolute gap, taken over every $t$ on the real line

You can compute D yourself in two lines: build each ECDF with `ecdf()`, evaluate them on the union of observed points, and take the largest absolute difference. The number you get must match the `D` printed by `ks.test()`.

```r title="Compute D manually with ecdf()"
F_x <- ecdf(x)
F_y <- ecdf(y)

all_vals <- sort(c(x, y))
D_manual <- max(abs(F_x(all_vals) - F_y(all_vals)))
D_manual
#> [1] 0.3166667
```

The manual value `0.3167` matches the `D = 0.31667` printed earlier. That confirms the test statistic is nothing more exotic than a sup-norm distance between two staircase functions. No moments, no parametric assumptions, just a worst-case disagreement on the cumulative scale.

[KEY INSIGHT]
**D is the worst-case ECDF disagreement, not an average.** Two distributions can match almost everywhere yet still produce a large D if they diverge sharply in one region. That is why KS picks up tail differences and shape differences that mean-based tests miss.

**Try it:** Compute D manually for `ex_p` and `ex_q`. Confirm your value matches `ks.test(ex_p, ex_q)$statistic`.

```r title="Your turn: compute D from ECDFs"
set.seed(22)
ex_p <- rnorm(50)
ex_q <- rnorm(50, mean = 0.7)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual D matches ks.test()"
set.seed(22)
ex_p <- rnorm(50)
ex_q <- rnorm(50, mean = 0.7)

F_p <- ecdf(ex_p)
F_q <- ecdf(ex_q)
grid <- sort(c(ex_p, ex_q))
max(abs(F_p(grid) - F_q(grid)))
#> [1] 0.34

ks.test(ex_p, ex_q)$statistic
#>    D 
#> 0.34
```

**Explanation:** Both routes give D = 0.34. The shift in mean by 0.7 standard deviations creates a clear gap between the two ECDFs.

</details>

## How do you visualize the KS gap with ECDFs?

The D statistic is much easier to grasp when you can see it. Plot both ECDFs on one set of axes and the worst-case gap is the tallest vertical distance between the two staircases. Base R does this in three calls.

```r title="Plot both ECDFs on one chart"
plot(F_x, verticals = TRUE, do.points = FALSE,
     col = "steelblue", lwd = 2,
     main = "ECDFs of x (Normal) and y (Uniform)",
     xlab = "value", ylab = "F(value)")
plot(F_y, verticals = TRUE, do.points = FALSE,
     col = "tomato", lwd = 2, add = TRUE)
legend("bottomright", c("x ~ Normal(0, 1)", "y ~ Uniform(-1, 1)"),
       col = c("steelblue", "tomato"), lty = 1, lwd = 2, bty = "n")
```

The blue curve (Normal) starts rising sooner in the left tail and finishes later in the right tail. The red curve (Uniform) climbs in a single straight line between -1 and 1. Wherever the two staircases are farthest apart vertically is exactly the location of D. Drawing this plot is the fastest way to explain a KS result to a non-statistical audience.

**Try it:** Plot the ECDFs of `ex_n1` and `ex_n2` on the same chart, then run `ks.test()` on them. Eyeball the largest gap and check that it lines up with D.

```r title="Your turn: plot two ECDFs"
set.seed(33)
ex_n1 <- rnorm(80, mean = 0)
ex_n2 <- rnorm(80, mean = 1)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="ECDFs and KS for two shifted normals"
set.seed(33)
ex_n1 <- rnorm(80, mean = 0)
ex_n2 <- rnorm(80, mean = 1)

plot(ecdf(ex_n1), verticals = TRUE, do.points = FALSE,
     col = "steelblue", lwd = 2, main = "ECDFs", xlab = "value")
plot(ecdf(ex_n2), verticals = TRUE, do.points = FALSE,
     col = "tomato", lwd = 2, add = TRUE)

ks.test(ex_n1, ex_n2)$statistic
#>      D 
#> 0.4125
```

**Explanation:** A unit-shift between the two means produces a clear horizontal offset between the staircases. D = 0.41 sits right where the two curves are most pulled apart.

</details>

## How do you interpret D, the p-value, and the alternative argument?

A small p-value is not a finding of "the distributions are very different". It is a statement about the null hypothesis: the data we saw would be unusual if both samples really came from the same distribution. To build intuition, run the test on two samples that genuinely *do* share a distribution. The p-value should be large, and D should be small.

```r title="KS on samples from the same distribution"
set.seed(202)
a <- rnorm(80)
b <- rnorm(80)

ks.test(a, b)
#> 
#>  Asymptotic two-sample Kolmogorov-Smirnov test
#> 
#> data:  a and b
#> D = 0.1, p-value = 0.7869
```

D = 0.10 and p = 0.79: nothing surprising, the test correctly fails to reject. By default `ks.test()` runs a two-sided test, asking whether the two ECDFs differ in *either* direction. If you have a directional hypothesis, set `alternative = "less"` or `"greater"`. Note that `"less"` means the CDF of `x` lies *below* the CDF of `y`, which (because lower CDF means higher values) actually corresponds to `x` tending to be *larger* than `y`. The wording is famous for tripping people up.

```r title="One-sided KS test"
ks.test(x, y, alternative = "less")$p.value
#> [1] 0.002562
```

[NOTE]
**KS power is highest in the middle of the distribution, weakest in the tails.** The ECDF is forced to start at 0 and end at 1, which pins both curves together at the extremes. If your real difference lives in the far tails, consider Anderson-Darling (`kSamples::ad.test()`) instead.

**Try it:** Below is the output from a KS test. Decide whether to reject the null at the 0.05 level, and explain in one sentence what the result means.

```r title="Your turn: read this output"
# Suppose ks.test(group_A, group_B) printed:
#
#  Asymptotic two-sample Kolmogorov-Smirnov test
# 
# data:  group_A and group_B
# D = 0.42, p-value = 0.0008
# alternative hypothesis: two-sided

# your answer here
```

<details>
<summary>Click to reveal solution</summary>

**Decision:** Reject the null hypothesis. The p-value (0.0008) is well below 0.05, and D = 0.42 says the two ECDFs disagree by 42 percentage points at their worst-case point.

**Plain-English meaning:** The samples are very unlikely to have come from the same distribution. They differ in location, in spread, in shape, or some combination of the three. To find out *which*, plot the ECDFs and look at where the gap opens up.

</details>

## Why does ks.test() warn about ties, and what should you do?

The exact KS distribution assumes a continuous underlying variable, which means the chance of two observations being identical is zero. Real data often violates this: counts, Likert scores, and rounded measurements all repeat. When `ks.test()` sees ties it falls back to an asymptotic p-value and prints a warning so you don't miss it.

```r title="Discrete data triggers a ties warning"
set.seed(303)
g1 <- sample(1:10, 40, replace = TRUE)
g2 <- sample(1:10, 40, replace = TRUE)

ks.test(g1, g2)
#> Warning in ks.test.default(g1, g2): p-value will be approximate in
#>   the presence of ties
#> 
#>  Asymptotic two-sample Kolmogorov-Smirnov test
#> 
#> data:  g1 and g2
#> D = 0.225, p-value = 0.2629
```

The result is still usable, but the p-value is approximate. The simplest fix is `jitter()`: add tiny random noise to every observation, just enough to break exact ties without distorting the underlying distribution.

```r title="Jitter to break exact ties"
set.seed(303)
ks.test(jitter(g1), jitter(g2))$p.value
#> [1] 0.262901
```

The two p-values differ in the fourth decimal place, which is exactly the magnitude of approximation error. For genuinely discrete data, the `dgof` package (an extension by Arnold and Emerson) provides an exact KS test that handles ties properly. Reach for it when ties dominate your sample.

[WARNING]
**Don't ignore the ties warning.** Reporting the p-value to four decimal places when ties were present is over-precision. State that you applied jitter or used `dgof::ks.test()`, and report the p-value to at most three significant digits.

**Try it:** Apply `jitter()` to `ex_t1` and `ex_t2` to remove the ties, then run a KS test on the jittered vectors. Compare the p-value to the un-jittered version.

```r title="Your turn: handle ties with jitter"
set.seed(44)
ex_t1 <- sample(1:5, 30, replace = TRUE)
ex_t2 <- sample(1:7, 30, replace = TRUE)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Jitter then test"
set.seed(44)
ex_t1 <- sample(1:5, 30, replace = TRUE)
ex_t2 <- sample(1:7, 30, replace = TRUE)

ks.test(ex_t1, ex_t2)$p.value          # warning: ties
#> [1] 0.0150447
ks.test(jitter(ex_t1), jitter(ex_t2))$p.value
#> [1] 0.01469089
```

**Explanation:** Jittering smooths over the discrete grid without changing the underlying ECDFs by more than a hair. Both p-values agree to three decimal places, and the warning disappears.

</details>

## When should you use the KS test instead of a t-test or Mann-Whitney?

A t-test compares means. The Mann-Whitney U test compares ranks (loosely, "is one group typically larger?"). Both are powerful when the difference between groups lives in *location*. The KS test is the right tool when the difference is in *shape*: the two groups have the same center but different spread, or one group is more skewed than the other. To see this, simulate two zero-mean Normals with very different standard deviations.

```r title="KS catches a shape difference Mann-Whitney misses"
set.seed(404)
narrow <- rnorm(120, mean = 0, sd = 0.5)
wide   <- rnorm(120, mean = 0, sd = 2.0)

ks.test(narrow, wide)$p.value
#> [1] 0.0001145

wilcox.test(narrow, wide)$p.value
#> [1] 0.876177
```

The KS p-value flags the difference at p = 0.0001. Mann-Whitney shrugs (p = 0.88) because its rank-sum machinery is dominated by the centers, and both centers are zero. If you only ran `wilcox.test()` you would conclude the groups are equivalent, missing a four-fold difference in variance entirely.

[KEY INSIGHT]
**KS detects shape, not just location.** Use it when "are these populations the same?" is a more interesting question than "do they have the same mean?". Variance shifts, skewness changes, and bimodality all show up as ECDF gaps that the KS test will catch.

**Try it:** Two samples `ex_s1` and `ex_s2` are given. Run both `ks.test()` and `wilcox.test()` on them. Which test rejects, and why?

```r title="Your turn: KS vs Mann-Whitney"
set.seed(55)
ex_s1 <- rnorm(150, mean = 0, sd = 1)
ex_s2 <- c(rnorm(75, mean = -2, sd = 0.5),
           rnorm(75, mean =  2, sd = 0.5))

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bimodal vs unimodal: KS sees it"
set.seed(55)
ex_s1 <- rnorm(150, mean = 0, sd = 1)
ex_s2 <- c(rnorm(75, mean = -2, sd = 0.5),
           rnorm(75, mean =  2, sd = 0.5))

ks.test(ex_s1, ex_s2)$p.value
#> [1] 4.10e-08
wilcox.test(ex_s1, ex_s2)$p.value
#> [1] 0.7913
```

**Explanation:** Both samples have a center of zero, so Mann-Whitney sees no difference in ranks. But `ex_s2` is bimodal, with mass piled near -2 and +2, while `ex_s1` is a single Gaussian bump. The ECDFs disagree dramatically in the middle, and the KS test catches the shape difference at p = 4e-08.

</details>

## Practice Exercises

### Exercise 1: A/B test on session durations

You ran an A/B test and recorded session durations (in minutes) for each variant. Variant A is the control, variant B is the new layout. Use a two-sample KS test to decide whether the two variants produce sessions from the same distribution. Save the test object to `my_ks1` and print D and the p-value.

```r title="Capstone: A/B session durations"
set.seed(2026)
session_a <- rexp(200, rate = 1 / 3.0)   # control: mean 3 min
session_b <- rexp(200, rate = 1 / 3.6)   # variant: mean 3.6 min

# Hint: ks.test() returns an object with $statistic and $p.value

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: KS on A/B session durations"
set.seed(2026)
session_a <- rexp(200, rate = 1 / 3.0)
session_b <- rexp(200, rate = 1 / 3.6)

my_ks1 <- ks.test(session_a, session_b)
my_ks1$statistic
#>     D 
#> 0.115
my_ks1$p.value
#> [1] 0.1390815
```

**Explanation:** D = 0.115 and p = 0.14, so we fail to reject the null at the 0.05 level. The exponential distributions differ in mean by 20%, but with 200 sessions per arm the KS test does not yet have enough evidence to flag the difference. Either collect more data or report the result honestly as "no significant distributional change detected at this sample size".

</details>

### Exercise 2: Detect train-test distribution drift

A model was trained on `train_x` (last quarter's customer ages) and now scores on `test_x` (this quarter's). Use a KS test to check whether the input distribution has drifted. Save the result to `my_ks2`. If the test rejects, plot both ECDFs on one chart so you can see where the drift lives.

```r title="Capstone: train-test drift check"
set.seed(7)
train_x <- rnorm(500, mean = 35, sd = 8)
test_x  <- rnorm(500, mean = 38, sd = 9)

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: KS as a drift detector"
set.seed(7)
train_x <- rnorm(500, mean = 35, sd = 8)
test_x  <- rnorm(500, mean = 38, sd = 9)

my_ks2 <- ks.test(train_x, test_x)
my_ks2
#>  Asymptotic two-sample Kolmogorov-Smirnov test
#> 
#> data:  train_x and test_x
#> D = 0.158, p-value = 1.118e-05
#> alternative hypothesis: two-sided

plot(ecdf(train_x), verticals = TRUE, do.points = FALSE,
     col = "steelblue", lwd = 2, main = "Train vs test ECDFs",
     xlab = "age")
plot(ecdf(test_x), verticals = TRUE, do.points = FALSE,
     col = "tomato", lwd = 2, add = TRUE)
legend("bottomright", c("train", "test"),
       col = c("steelblue", "tomato"), lty = 1, lwd = 2, bty = "n")
```

**Explanation:** D = 0.16 and p = 1e-05. The test rejects the null with high confidence, so the input distribution really has drifted. The ECDF plot shows the test cohort is shifted right (older) and slightly more spread, which is exactly how the data was generated. In production this is a strong signal to retrain or recalibrate the model.

</details>

## Complete Example

A clinic recorded recovery times (in days) for two cohorts: a placebo arm and an active-treatment arm. The team wants to know whether the two recovery-time distributions are the same, without committing to a t-test that assumes normality. Run the full KS workflow: simulate the data, run the test, plot the ECDFs, and report a one-paragraph conclusion.

```r title="End-to-end KS workflow on patient recovery times"
set.seed(91)
placebo   <- rgamma(80, shape = 4, rate = 0.5)   # mean ~ 8 days
treatment <- rgamma(80, shape = 4, rate = 0.7)   # mean ~ 5.7 days

ks_full <- ks.test(placebo, treatment)
ks_full
#>  Asymptotic two-sample Kolmogorov-Smirnov test
#> 
#> data:  placebo and treatment
#> D = 0.2625, p-value = 0.007085
#> alternative hypothesis: two-sided

plot(ecdf(placebo), verticals = TRUE, do.points = FALSE,
     col = "steelblue", lwd = 2,
     main = "Recovery times: placebo vs treatment",
     xlab = "days to recovery")
plot(ecdf(treatment), verticals = TRUE, do.points = FALSE,
     col = "tomato", lwd = 2, add = TRUE)
legend("bottomright", c("placebo", "treatment"),
       col = c("steelblue", "tomato"), lty = 1, lwd = 2, bty = "n")
```

**Conclusion to report:** D = 0.26 and p = 0.007. The KS test rejects the null hypothesis that placebo and treatment recovery times share a distribution. The ECDF plot shows the treatment curve climbs faster: at any recovery cut-off (say, 7 days), a larger fraction of treated patients have recovered. The clinical takeaway is that the distributions differ in a direction that favors the treatment, with a worst-case ECDF gap of 26 percentage points.

[TIP]
**Always report D alongside the p-value.** D itself works as a rough effect-size indicator (0 = identical samples, 1 = no overlap at all). A statistically significant result with D = 0.04 may not be practically interesting; D = 0.30 usually is.

## Summary

| Concept | What to remember |
|---|---|
| What KS tests | Whether two samples come from the same continuous distribution |
| Test statistic D | The largest vertical gap between the two ECDFs |
| Null hypothesis | Both samples are drawn from the same distribution |
| Reject when | The p-value is below your alpha (typically 0.05) |
| Best at detecting | Differences in shape, not just location |
| Weakest at detecting | Differences in the far tails |
| Ties | Trigger a warning; jitter the data or use `dgof::ks.test()` |
| Companion plot | Two ECDFs on one chart, with the worst-case gap visible |

## References

1. R Core Team. *ks.test() reference, stats package*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/ks.test.html)
2. Massey, F. J. (1951). The Kolmogorov-Smirnov Test for Goodness of Fit. *Journal of the American Statistical Association*, 46(253), 68-78. [Link](https://www.jstor.org/stable/2280095)
3. Conover, W. J. (1999). *Practical Nonparametric Statistics* (3rd ed.). Wiley. Chapter 6: The Kolmogorov-Smirnov Tests.
4. Hollander, M., Wolfe, D. A., and Chicken, E. (2014). *Nonparametric Statistical Methods* (3rd ed.). Wiley. Chapter 5.
5. Arnold, T. B., and Emerson, J. W. *dgof: Discrete Goodness-of-Fit Tests*. CRAN. [Link](https://cran.r-project.org/package=dgof)
6. *Kolmogorov-Smirnov test*. Wikipedia. [Link](https://en.wikipedia.org/wiki/Kolmogorov%E2%80%93Smirnov_test)

## Continue Learning

- [When to Use Nonparametric Tests in R: Decision Guide with Flowchart](When-to-Use-Nonparametric-Tests-in-R.html), the parent post that places the KS test alongside Wilcoxon, Kruskal-Wallis, and friends.
- [Mann-Whitney U Test in R](Mann-Whitney-U-Test-in-R.html), the rank-based companion test for comparing two independent groups by location.
- [Normality and Variance Tests in R](Normality-and-Variance-Tests-in-R.html), for the related question of whether a single sample is normally distributed.
