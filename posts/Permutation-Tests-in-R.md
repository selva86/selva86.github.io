---
title: "Permutation Tests in R: Exact p-Values via Randomization"
slug: "Permutation-Tests-in-R"
description: "Run permutation tests in R to compute exact p-values by randomization, covering two-sample, paired, and correlation tests with coin and base R examples."
keywords: "permutation test in R, exact p-value, randomization test, coin package R, oneway_test, independence_test, Fisher-Pitman test, Monte Carlo p-value, non-parametric test"
auto_link_terms: "permutation test|permutation tests|randomization test|exact p-value|Monte Carlo p-value|Fisher-Pitman test|oneway_test|independence_test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-10"
post_type: "FR"
fr_parent: "Bootstrap-Confidence-Intervals-in-R.html"
difficulty: "Intermediate"
---

# Permutation Tests in R: Exact p-Values via Randomization

<p class="lead">Permutation tests compute exact p-values by shuffling your observed data under the null hypothesis and counting how often you see a test statistic as extreme as the real one. You get a valid p-value without assuming normality, constant variance, or large samples.</p>

## How does a permutation test produce an exact p-value?

Classical tests like the t-test assume a specific sampling distribution for your statistic. Permutation tests throw that assumption away. If the null hypothesis is true, the group labels carry no information, so shuffling them should produce results just like the one you observed. You shuffle many times, collect the test statistic each time, and ask what fraction of those shuffled statistics are at least as extreme as your original.

Let's make this concrete with the `mtcars` dataset. We want to test whether automatic and manual cars differ in miles-per-gallon. Our test statistic is the absolute difference in group means.

```r title="Payoff: two-sample permutation test on mtcars"
# Observed difference in means between manual (am=1) and automatic (am=0)
obs_diff <- mean(mtcars$mpg[mtcars$am == 1]) - mean(mtcars$mpg[mtcars$am == 0])

set.seed(2026)
B <- 10000
perm_diffs <- replicate(B, {
  shuffled <- sample(mtcars$am)
  mean(mtcars$mpg[shuffled == 1]) - mean(mtcars$mpg[shuffled == 0])
})

# Two-sided p-value with the +1 correction
p_val <- (1 + sum(abs(perm_diffs) >= abs(obs_diff))) / (B + 1)

c(observed = obs_diff, p_value = p_val)
#>  observed   p_value
#> 7.2449393 0.0002000
```

The observed gap is 7.24 mpg. Across 10,000 shuffles, only a handful produced a gap that large or larger, so the p-value lands near 0.0002. That's strong evidence the null (no transmission effect) is wrong, and we got there without invoking the Central Limit Theorem or Welch's adjustment.

The p-value formula is:

$$p = \frac{1 + \#\{|T^{(b)}| \geq |T_{\text{obs}}|\}}{B + 1}$$

Where:
- $T_{\text{obs}}$ is the statistic on the real data
- $T^{(b)}$ is the statistic on the $b$-th shuffle, for $b = 1, \dots, B$
- The $+1$ in both numerator and denominator counts the observed data as one valid permutation and keeps the p-value from ever being exactly zero.

![Permutation test algorithm flow](screenshots/Permutation-Tests-in-R-algorithm-flow.webp)
*Figure 1: The permutation test loop: shuffle labels, recompute the statistic, repeat, then read the p-value off the collected values.*

[KEY INSIGHT]
**"Exact" means the null distribution itself is generated from the data, not approximated.** When you enumerate every possible shuffle, the resulting p-value has no approximation error from a normality or large-sample assumption. The only randomness is sampling error in the original data, which every test faces.

**Try it:** Change the test above to a one-sided alternative, manual cars get *better* mileage than automatic. You only count shuffles where the signed difference is at least as large as the observed positive gap.

```r title="Your turn: one-sided p-value"
# Use obs_diff and perm_diffs from the block above
ex_one_sided_p <- # your code here

ex_one_sided_p
#> Expected: roughly half of the two-sided p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sided permutation p-value solution"
ex_one_sided_p <- (1 + sum(perm_diffs >= obs_diff)) / (B + 1)
ex_one_sided_p
#> [1] 0.0001
```

**Explanation:** Drop the `abs()` and compare signed statistics. Since the observed difference is positive and the null distribution is roughly symmetric around zero, the one-sided p-value is about half of the two-sided one.

</details>

## When should you reach for a permutation test instead of a t-test?

The t-test is fast and powerful when its assumptions hold. When they don't, its p-values can mislead, sometimes dramatically. Permutation tests replace those assumptions with a single, weaker one: *exchangeability* under the null, meaning the joint distribution of the data doesn't change when you relabel observations.

Reach for a permutation test when any of these are true:
1. Sample size is small (roughly $n < 30$) and the data look skewed or have outliers.
2. The measurement is ordinal, or the statistic isn't a mean (median, trimmed mean, ratio, correlation).
3. You need a test for a custom statistic with no standard distribution theory.

Let's compare a t-test and a permutation test on a small, skewed sample where the t-test starts to creak.

```r title="t-test vs permutation on skewed data"
set.seed(42)
skew_x <- rlnorm(8, meanlog = 0,   sdlog = 1)  # log-normal, right-skewed
skew_y <- rlnorm(8, meanlog = 0.8, sdlog = 1)

# Welch's t-test
tt <- t.test(skew_y, skew_x)
round(tt$p.value, 4)
#> [1] 0.1027

# Permutation test on the mean difference
combined <- c(skew_x, skew_y)
obs_d    <- mean(skew_y) - mean(skew_x)
set.seed(7)
perm_ds  <- replicate(10000, {
  idx <- sample(length(combined), length(skew_x))
  mean(combined[-idx]) - mean(combined[idx])
})
perm_p <- (1 + sum(abs(perm_ds) >= abs(obs_d))) / (10000 + 1)
round(perm_p, 4)
#> [1] 0.0676
```

The t-test reports p = 0.10, which most analysts would call "not significant." The permutation test reports p = 0.07, closer to the edge and arguably more trustworthy given the skew. Neither tells you to pop champagne, but the permutation version isn't penalised for violating normality because it never assumed it.

[NOTE]
**Permutation tests still need exchangeability, not full independence.** Exchangeability lets you shuffle labels without changing the joint distribution under the null. Paired data or time series usually break this, so you shuffle within the appropriate block (within pairs, within strata) rather than across the whole dataset.

**Try it:** Re-run the comparison above with `n = 80` per group instead of 8. With more data, the Central Limit Theorem kicks in and both methods should agree.

```r title="Your turn: same test at larger n"
set.seed(42)
ex_x <- rlnorm(80, meanlog = 0,   sdlog = 1)
ex_y <- rlnorm(80, meanlog = 0.8, sdlog = 1)

ex_t_p <- # your code: t-test p-value
ex_perm_p <- # your code: permutation p-value with B = 10000

c(t = ex_t_p, perm = ex_perm_p)
#> Expected: both p-values very small and close to each other
```

<details>
<summary>Click to reveal solution</summary>

```r title="Larger-n comparison solution"
ex_t_p <- t.test(ex_y, ex_x)$p.value

ex_combined <- c(ex_x, ex_y)
ex_obs_d    <- mean(ex_y) - mean(ex_x)
set.seed(11)
ex_perm_ds  <- replicate(10000, {
  idx <- sample(length(ex_combined), length(ex_x))
  mean(ex_combined[-idx]) - mean(ex_combined[idx])
})
ex_perm_p <- (1 + sum(abs(ex_perm_ds) >= abs(ex_obs_d))) / 10001

round(c(t = ex_t_p, perm = ex_perm_p), 5)
#>       t    perm 
#> 0.00012 0.00010
```

**Explanation:** With 80 observations per group, both p-values are tiny and agree to three decimals. The t-test's distributional assumption is effectively met by the large-$n$ CLT, so the two approaches converge.

</details>

## How do you run permutation tests with the coin package?

Writing the shuffle loop by hand is great for understanding. For production, the `coin` package is the reference implementation. It provides a unified permutation framework across two-sample, k-sample, paired, correlation, and contingency-table tests, with three ways to compute the null distribution: `"exact"`, `"approximate"` (Monte Carlo), and `"asymptotic"` (closed-form approximation).

The core two-sample function is `oneway_test()`, which implements the Fisher-Pitman permutation test.

```r title="Exact Fisher-Pitman test on a small subset"
library(coin)

# Use a small subset so exact enumeration is feasible
small_mtcars <- mtcars[1:10, ]
small_mtcars$am <- factor(small_mtcars$am)

exact_test <- oneway_test(mpg ~ am, data = small_mtcars,
                          distribution = "exact")
exact_test
#>
#> 	Exact Two-Sample Fisher-Pitman Permutation Test
#>
#> data:  mpg by am (0, 1)
#> Z = -0.91287, p-value = 0.4
#> alternative hypothesis: true mu is not equal to 0
```

On this 10-row subset, the exact p-value is 0.40. `coin` enumerates every one of the $\binom{10}{4} = 210$ possible label assignments (there are 4 manuals and 6 automatics in the subset), computes the standardised statistic for each, and returns the exact proportion that are at least as extreme as the observed one.

For the full 32-row dataset, exact enumeration would need to check $\binom{32}{13}$ shuffles, around 350 million. That's feasible but slow. The pragmatic option is Monte Carlo via `approximate()`.

```r title="Monte Carlo approximation on the full dataset"
set.seed(2026)
approx_test <- oneway_test(
  mpg ~ factor(am), data = mtcars,
  distribution = approximate(nresample = 10000)
)
approx_test
#>
#> 	Approximative Two-Sample Fisher-Pitman Permutation Test
#>
#> data:  mpg by factor(am) (0, 1)
#> Z = -4.1061, p-value < 1e-04
#> alternative hypothesis: true mu is not equal to 0
```

`nresample = 10000` takes 10,000 random shuffles and returns a p-value with a Monte Carlo standard error around $\sqrt{p(1-p)/B}$. At this effect size the reported value is "< 1e-04", matching the manual loop we ran at the top of this post.

[TIP]
**Use `"exact"` when n is small, `"approximate"` for medium n, and `"asymptotic"` only when you trust the large-sample approximation.** The asymptotic option skips randomisation entirely and uses the limiting normal distribution of the standardised statistic. It's fast but loses the headline benefit of a permutation test on small samples.

**Try it:** Run an approximate permutation test comparing `mpg` across the three-level `cyl` factor (4, 6, 8 cylinders). `oneway_test()` handles k-sample comparisons automatically.

```r title="Your turn: k-sample permutation"
# Hint: same function, different grouping variable
ex_k_test <- # your code here
ex_k_test
#> Expected: highly significant p-value (< 0.001)
```

<details>
<summary>Click to reveal solution</summary>

```r title="k-sample Fisher-Pitman solution"
set.seed(99)
ex_k_test <- oneway_test(
  mpg ~ factor(cyl), data = mtcars,
  distribution = approximate(nresample = 10000)
)
ex_k_test
#>
#> 	Approximative K-Sample Fisher-Pitman Permutation Test
#>
#> data:  mpg by factor(cyl) (4, 6, 8)
#> chi-squared = 25.923, p-value < 1e-04
```

**Explanation:** The same `oneway_test()` call works across more than two groups, returning a chi-squared-style statistic. With three cylinder classes this is the permutation analogue of a one-way ANOVA.

</details>

## How do you test paired data and correlations via permutation?

The shuffle strategy changes with the design. For paired data, you don't reshuffle freely across all observations, that would break the pairing. You only flip the sign of each within-pair difference, because under the null "no treatment effect" the sign of each paired difference is a fair coin flip.

The built-in `sleep` dataset records the extra hours of sleep for 10 patients under two drugs. Each patient appears twice. Let's test whether group 2 beats group 1.

```r title="Paired permutation on the sleep dataset"
# sleep is long-format with columns extra, group, ID
sleep_diff <- sleep$extra[sleep$group == 2] - sleep$extra[sleep$group == 1]
sleep_diff
#>  [1] 1.2 2.4 1.3 1.3 0.0 1.0 1.8 0.8 4.6 1.4

obs_mean_diff <- mean(sleep_diff)

set.seed(2026)
paired_perms <- replicate(10000, {
  signs <- sample(c(-1, 1), length(sleep_diff), replace = TRUE)
  mean(signs * sleep_diff)
})

paired_p <- (1 + sum(abs(paired_perms) >= abs(obs_mean_diff))) / 10001
c(obs = obs_mean_diff, p_value = paired_p)
#>       obs   p_value
#> 1.5800000 0.0046995
```

The mean within-subject difference is 1.58 hours, and the permutation p-value is 0.005. Under the null, we randomly flipped the sign of each of the 10 differences and computed the mean; only about 50 of 10,000 such resamples produced an average at least as extreme as 1.58 in absolute value. The paired t-test gives a similar p-value here, but the permutation version survives if those per-subject differences were skewed or had outliers.

For correlation, the shuffle is different again. You permute *one* of the two variables while keeping the other fixed. That destroys the pairing between them, which is exactly what "no correlation" means.

```r title="Correlation permutation on iris"
x <- iris$Sepal.Length
y <- iris$Petal.Length

corr_obs <- cor(x, y)

set.seed(2026)
corr_perms <- replicate(10000, cor(x, sample(y)))
corr_p <- (1 + sum(abs(corr_perms) >= abs(corr_obs))) / 10001

c(observed_cor = corr_obs, p_value = corr_p)
#> observed_cor      p_value
#>    0.8717538    0.0001000
```

The observed Pearson correlation is 0.87. Across 10,000 random pairings (one vector shuffled, the other fixed), not a single permutation produced a correlation that extreme, so the p-value comes out at the minimum possible value of $1 / (B + 1) \approx 0.0001$.

[WARNING]
**Don't shuffle both vectors independently, you only need to break the link.** If you call `sample()` on both `x` and `y`, the null distribution stays the same but you double the computational cost and introduce extra simulation noise. Shuffle one side only.

**Try it:** Compute a permutation p-value for the *Spearman* rank correlation between `iris$Sepal.Length` and `iris$Petal.Width`. The only change is the `method` argument.

```r title="Your turn: Spearman permutation p-value"
ex_x <- iris$Sepal.Length
ex_y <- iris$Petal.Width

ex_corr_obs <- # your code: Spearman correlation
ex_corr_p   <- # your code: permutation p-value with B = 10000

c(rho = ex_corr_obs, p = ex_corr_p)
#> Expected: high rho, p-value at the floor (~0.0001)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spearman permutation solution"
ex_corr_obs <- cor(ex_x, ex_y, method = "spearman")
set.seed(2026)
ex_corr_perms <- replicate(10000, cor(ex_x, sample(ex_y), method = "spearman"))
ex_corr_p <- (1 + sum(abs(ex_corr_perms) >= abs(ex_corr_obs))) / 10001

round(c(rho = ex_corr_obs, p = ex_corr_p), 5)
#>     rho       p 
#> 0.83776 0.00010
```

**Explanation:** Pass `method = "spearman"` to `cor()` in both the observed and permuted calls. Sepal length and petal width are strongly rank-correlated, so the p-value bottoms out.

</details>

## What if exact enumeration is infeasible?

Exact tests enumerate every possible label assignment. The count grows as $\binom{n_1 + n_2}{n_1}$ for a two-sample test, which explodes fast.

```r title="How quickly the number of shuffles explodes"
ns <- c(10, 20, 30, 40, 50)
data.frame(
  total_n = ns,
  shuffles_each_group_half = choose(ns, ns / 2)
)
#>   total_n shuffles_each_group_half
#> 1      10                      252
#> 2      20                   184756
#> 3      30                155117520
#> 4      40             137846528820
#> 5      50          126410606437752
```

By $n = 30$ you're already at 155 million shuffles, where `coin`'s `"exact"` method starts to feel slow. By $n = 50$ you're well past 100 trillion and exact enumeration is off the table. Monte Carlo approximation sidesteps this by drawing $B$ random shuffles instead.

![Exact vs Monte Carlo decision](screenshots/Permutation-Tests-in-R-exact-vs-mc.webp)
*Figure 2: Choosing between exact enumeration and Monte Carlo approximation as sample size grows.*

How many shuffles is enough? Since the p-value is a proportion, its Monte Carlo standard error is:

$$\text{SE}(\hat p) \approx \sqrt{\frac{p(1-p)}{B}}$$

At $p = 0.05$ and $B = 10{,}000$, the SE is about 0.0022, so a reported p-value of 0.050 sits in a ±0.005 margin. That's tight enough to distinguish 0.04 from 0.06.

```r title="Monte Carlo precision across B"
# Fresh small demo; B shown as a knob.
set.seed(2026)
x <- rnorm(40, mean = 0.3)
y <- rnorm(40, mean = 0.0)
obs <- mean(x) - mean(y)
pool <- c(x, y)

Bs <- c(1000, 10000, 100000)
p_hats <- sapply(Bs, function(B) {
  ds <- replicate(B, {
    idx <- sample(length(pool), length(x))
    mean(pool[idx]) - mean(pool[-idx])
  })
  (1 + sum(abs(ds) >= abs(obs))) / (B + 1)
})

data.frame(B = Bs, p_hat = round(p_hats, 5),
           se = round(sqrt(p_hats * (1 - p_hats) / Bs), 5))
#>        B   p_hat      se
#> 1   1000 0.07193 0.00817
#> 2  10000 0.07989 0.00271
#> 3 100000 0.08006 0.00086
```

Ten thousand shuffles already nail the p-value to two decimals. A hundred thousand is overkill for most reports but cheap to run.

[TIP]
**B = 10,000 is the sweet spot for published results.** It gives a Monte Carlo SE near 0.002 at typical p-values, matches what the `coin` package uses by default, and runs in under a second on modern hardware for simple statistics.

**Try it:** Estimate the Monte Carlo SE for a reported p-value of 0.02 at `B = 5000`. Use the formula above.

```r title="Your turn: Monte Carlo SE"
ex_p <- 0.02
ex_B <- 5000
ex_se <- # your code here
ex_se
#> Expected: about 0.002
```

<details>
<summary>Click to reveal solution</summary>

```r title="Monte Carlo SE solution"
ex_p <- 0.02
ex_B <- 5000
ex_se <- sqrt(ex_p * (1 - ex_p) / ex_B)
round(ex_se, 5)
#> [1] 0.00198
```

**Explanation:** At B = 5000 and p = 0.02, the SE is about 0.002, so 95% of Monte Carlo runs will land within ±0.004 of the true permutation p-value. Doubling B to 10,000 cuts that to roughly ±0.003.

</details>

## How does a permutation test differ from the bootstrap?

Permutation tests and the bootstrap both resample your data, so they're easy to confuse. They answer different questions.

- **Permutation test** shuffles labels under the null hypothesis to produce a p-value. It asks: *how surprising is this statistic if the null is true?*
- **Bootstrap** resamples observations with replacement from the observed data to build a sampling distribution for a statistic. It asks: *what's the uncertainty around this estimate?*

Same data, different questions. You might run both in the same analysis, a permutation test for significance, a bootstrap for the confidence interval around the effect size.

```r title="Permutation p-value and bootstrap CI side by side"
library(boot)

a <- mtcars$mpg[mtcars$am == 1]
b <- mtcars$mpg[mtcars$am == 0]
obs_diff_ab <- mean(a) - mean(b)

# Permutation p-value for difference in means
pooled <- c(a, b)
set.seed(1)
perm_ab <- replicate(10000, {
  idx <- sample(length(pooled), length(a))
  mean(pooled[idx]) - mean(pooled[-idx])
})
perm_p_ab <- (1 + sum(abs(perm_ab) >= abs(obs_diff_ab))) / 10001

# Bootstrap 95% CI for the same difference in means
boot_stat <- function(d, i) {
  resampled <- d[i, ]
  mean(resampled$mpg[resampled$am == 1]) -
    mean(resampled$mpg[resampled$am == 0])
}
set.seed(1)
boot_out <- boot(mtcars, boot_stat, R = 2000)
boot_ci  <- boot.ci(boot_out, type = "perc")$percent[4:5]

list(
  observed_diff = obs_diff_ab,
  permutation_p = perm_p_ab,
  bootstrap_95_CI = boot_ci
)
#> $observed_diff
#> [1] 7.244939
#>
#> $permutation_p
#> [1] 2e-04
#>
#> $bootstrap_95_CI
#> [1] 3.207107 11.280909
```

Manual cars average 7.2 mpg higher (p = 0.0002, bootstrap 95% CI 3.2 to 11.3). The permutation test tells you this difference is very unlikely under the null of no effect; the bootstrap tells you the effect is somewhere between 3 and 11 mpg. Different verbs, different outputs, complementary insights.

[NOTE]
**Pair them in reports.** A common best practice is to lead with the point estimate + bootstrap CI (so readers see the effect size and its uncertainty) and report the permutation p-value alongside (so readers see the test of significance). For the full toolkit on CIs, see the parent post on [bootstrap confidence intervals](Bootstrap-Confidence-Intervals-in-R.html).

**Try it:** Match each scenario to the right tool. The solution explains why.

```r title="Your turn: pick permutation or bootstrap"
# Scenario A: "What's the 95% CI for the median income in this sample?"
# Scenario B: "Does the new ad design convert better than the old one?"
# Scenario C: "How precise is my estimate of the Spearman correlation?"
# Scenario D: "Is this observed correlation different from zero?"

# For each scenario, is the right tool a permutation test or a bootstrap?
```

<details>
<summary>Click to reveal solution</summary>

- **A: Bootstrap.** You want a confidence interval for an estimate, not a test. Resample with replacement, recompute the median, collect 2.5th / 97.5th percentiles.
- **B: Permutation test.** You want a p-value for "no effect of design." Shuffle the design labels, recompute the conversion gap, count extremes.
- **C: Bootstrap.** Again a precision/uncertainty question. Permutation would give you a p-value, not a standard error.
- **D: Permutation test.** You want a hypothesis test for zero correlation. Permute one of the two vectors to destroy the link under the null.

**Rule of thumb:** CI / standard error → bootstrap. p-value / hypothesis test → permutation.

</details>

## Practice Exercises

### Exercise 1: Build a generic permutation test function

Write a function `my_perm_p(x, y, B = 10000)` that returns the two-sided permutation p-value for `mean(y) - mean(x)`. Use only base R. Test it on `mtcars$mpg` split by `am`.

```r title="Exercise 1 starter"
# Hint: combine the vectors, shuffle the group assignment, compute the diff each time.

my_perm_p <- function(x, y, B = 10000) {
  # Write your code here
}

# Test:
set.seed(2026)
my_perm_p(mtcars$mpg[mtcars$am == 0], mtcars$mpg[mtcars$am == 1])
#> Expected: p-value near 0.0002
```

<details>
<summary>Click to reveal solution</summary>

```r title="Generic permutation function solution"
my_perm_p <- function(x, y, B = 10000) {
  obs <- mean(y) - mean(x)
  pool <- c(x, y)
  n_x  <- length(x)
  perm_stats <- replicate(B, {
    idx <- sample(length(pool), n_x)
    mean(pool[-idx]) - mean(pool[idx])
  })
  (1 + sum(abs(perm_stats) >= abs(obs))) / (B + 1)
}

set.seed(2026)
my_perm_p(mtcars$mpg[mtcars$am == 0], mtcars$mpg[mtcars$am == 1])
#> [1] 2e-04
```

**Explanation:** The function pools the two samples, draws a random subset of size `length(x)` as the "new x" group, and computes the shuffled mean difference. The `+1` correction in numerator and denominator keeps the p-value bounded away from zero.

</details>

### Exercise 2: Permutation test for a difference in medians

Medians have no simple standard-error formula, which makes them a natural fit for permutation tests. Write code that tests whether `iris$Sepal.Length` differs in *median* between the `setosa` and `versicolor` species.

```r title="Exercise 2 starter"
# Hint: same shuffle machinery, but compute median(x) - median(y) each time.

setosa_sl <- iris$Sepal.Length[iris$Species == "setosa"]
versi_sl  <- iris$Sepal.Length[iris$Species == "versicolor"]

my_median_diff <- # your code: observed median difference
my_median_p    <- # your code: permutation p-value, B = 10000

c(diff = my_median_diff, p = my_median_p)
#> Expected: large, negative median difference, p-value at floor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Median permutation solution"
setosa_sl <- iris$Sepal.Length[iris$Species == "setosa"]
versi_sl  <- iris$Sepal.Length[iris$Species == "versicolor"]

my_median_diff <- median(setosa_sl) - median(versi_sl)
pool_sl        <- c(setosa_sl, versi_sl)
set.seed(2026)
med_perms <- replicate(10000, {
  idx <- sample(length(pool_sl), length(setosa_sl))
  median(pool_sl[idx]) - median(pool_sl[-idx])
})
my_median_p <- (1 + sum(abs(med_perms) >= abs(my_median_diff))) / 10001

c(diff = my_median_diff, p = my_median_p)
#>      diff         p 
#> -0.800000  0.000100
```

**Explanation:** Replace `mean` with `median` in the statistic and you have a permutation test for median differences, no asymptotic theory required. Setosa sepals are about 0.8 cm shorter in median than versicolor sepals.

</details>

### Exercise 3: Spearman correlation permutation with coin

Use the `coin` package's `spearman_test()` function (which internally uses permutation machinery) to test the Spearman correlation between `mtcars$hp` and `mtcars$mpg`. Use 10,000 approximate resamples.

```r title="Exercise 3 starter"
# Hint: spearman_test(y ~ x, data = ..., distribution = approximate(nresample = ...))

my_spearman_result <- # your code here
my_spearman_result
#> Expected: strong negative association, p-value at the floor
```

<details>
<summary>Click to reveal solution</summary>

```r title="coin Spearman permutation solution"
set.seed(2026)
my_spearman_result <- spearman_test(
  mpg ~ hp, data = mtcars,
  distribution = approximate(nresample = 10000)
)
my_spearman_result
#>
#> 	Approximative Spearman Correlation Test
#>
#> data:  mpg by hp
#> Z = -4.7691, p-value < 1e-04
#> alternative hypothesis: true rho is not equal to 0
```

**Explanation:** `spearman_test()` wraps the permutation machinery around ranked data. Higher horsepower means lower mpg, with a Z of -4.8 and a Monte Carlo p-value below 1 in 10,000.

</details>

## Complete Example

Let's run a full permutation analysis on the `chickwts` dataset. It records chick weights by feed type. We'll compare just two feeds, casein and sunflower, and produce both an exact permutation test and a manual Monte Carlo check.

```r title="Full permutation analysis on chickwts"
ck_sub <- subset(chickwts, feed %in% c("casein", "sunflower"))
ck_sub$feed <- droplevels(ck_sub$feed)
table(ck_sub$feed)
#>
#>    casein sunflower 
#>        12        12

# Exact Fisher-Pitman test via coin
set.seed(2026)
ck_test <- oneway_test(weight ~ feed, data = ck_sub,
                       distribution = "exact")
ck_test
#>
#> 	Exact Two-Sample Fisher-Pitman Permutation Test
#>
#> data:  weight by feed (casein, sunflower)
#> Z = -0.20449, p-value = 0.8527
#> alternative hypothesis: true mu is not equal to 0

# Manual Monte Carlo check for sanity
set.seed(2026)
ck_x <- ck_sub$weight[ck_sub$feed == "casein"]
ck_y <- ck_sub$weight[ck_sub$feed == "sunflower"]
ck_pool <- c(ck_x, ck_y)
ck_obs  <- mean(ck_y) - mean(ck_x)
ck_ds <- replicate(10000, {
  idx <- sample(length(ck_pool), length(ck_x))
  mean(ck_pool[-idx]) - mean(ck_pool[idx])
})
ck_manual_p <- (1 + sum(abs(ck_ds) >= abs(ck_obs))) / 10001
round(ck_manual_p, 4)
#> [1] 0.8517
```

The exact test reports p = 0.85, and the manual Monte Carlo check reports p = 0.85. Despite a small visual gap between casein and sunflower means, there's no evidence the two feeds differ in chick weight at week six. The two approaches agree to three decimals, a useful sanity check that your hand-rolled code matches a trusted implementation.

## Summary

| Test | Statistic | When to use | Base R approach | coin function |
|---|---|---|---|---|
| Two-sample location | Mean difference | Compare two independent groups | `replicate(B, sample(...))` | `oneway_test()` |
| k-sample location | F-like / chi-squared | Compare 3+ groups | Manual with `replicate()` | `oneway_test()` |
| Paired location | Mean of paired diffs | Pre/post, matched pairs | Sign-flip `replicate()` | `wilcoxsign_test()` |
| Correlation | Pearson or Spearman | Test association | `replicate(B, cor(x, sample(y)))` | `spearman_test()` |
| General independence | Generic | Any relation between two variables | Custom | `independence_test()` |

Key takeaways:
1. Permutation tests give exact p-values with no distributional assumption, only exchangeability under the null.
2. Use `"exact"` when $n$ is small (say, $n \leq 20$), `"approximate"` for medium $n$, and `"asymptotic"` only when the large-$n$ approximation is clearly safe.
3. The $+1$ correction in numerator and denominator prevents p-values of exactly zero and keeps reported values valid under Monte Carlo sampling.
4. Permutation answers "is there an effect?" while the bootstrap answers "how big is the effect?". Use both in a single analysis where appropriate.
5. The `coin` package covers most common tests; falling back to a hand-rolled `replicate()` loop is fine for custom statistics.

## References

1. Hothorn, T., Hornik, K., van de Wiel, M. A., & Zeileis, A. *A Lego System for Conditional Inference*, American Statistician 60(3): 257-263 (2006). [Link](https://www.jstatsoft.org/article/view/v028i08)
2. coin package vignette. *Implementing a Class of Permutation Tests: The coin Package*. Torsten Hothorn, CRAN (2021). [Link](https://cran.r-project.org/web/packages/coin/vignettes/Implementation.pdf)
3. Good, P. *Permutation, Parametric, and Bootstrap Tests of Hypotheses*, 3rd Edition. Springer (2005). Chapters 2-4.
4. Phipson, B. & Smyth, G. K. *Permutation p-values should never be zero: calculating exact p-values when permutations are randomly drawn*. Statistical Applications in Genetics and Molecular Biology 9(1) (2010). [Link](https://pubmed.ncbi.nlm.nih.gov/21044043/)
5. Ernst, M. D. *Permutation Methods: A Basis for Exact Inference*. Statistical Science 19(4): 676-685 (2004). [Link](https://projecteuclid.org/journals/statistical-science/volume-19/issue-4/Permutation-Methods--A-Basis-for-Exact-Inference/10.1214/088342304000000396.full)
6. Mangiafico, S. *Summary and Analysis of Extension Program Evaluation in R*. Chapter K: Permutation Tests. [Link](https://rcompanion.org/handbook/K_01.html)
7. R Core Team. Documentation for `sample()` and `replicate()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html)

## Continue Learning

- [Bootstrap CIs in R: Distribution-Free Confidence Intervals for Any Statistic](Bootstrap-Confidence-Intervals-in-R.html): the companion technique, resample with replacement to quantify uncertainty around any statistic.
- [t-Tests in R: One-Sample, Two-Sample, and Paired](t-Tests-in-R.html): the parametric alternative when normality holds and you want fast, closed-form p-values.
- [Wilcoxon, Mann-Whitney and Kruskal-Wallis Tests in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html): rank-based non-parametric tests that are themselves special cases of the permutation framework.
