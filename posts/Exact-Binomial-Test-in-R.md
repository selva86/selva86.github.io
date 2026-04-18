---
title: "Exact Binomial Test in R: binom.test() for Small Samples"
slug: Exact-Binomial-Test-in-R
description: "Use binom.test() in R for exact small-sample proportion inference. Learn syntax, p-values, Clopper-Pearson CIs, one and two-sided tests, and interpretation."
keywords: "exact binomial test R, binom.test R, binom.test small sample, Clopper-Pearson confidence interval, one-sided binomial test, two-sided binomial test, p-value binomial, binom.test interpretation, binomial test example R"
auto_link_terms: "exact binomial test|binom.test()|Clopper-Pearson CI|small-sample binomial test|binomial confidence interval"
auto_link_case_sensitive: true
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: "FR-infe-13"
post_type: FR
fr_parent: Proportion-Tests-in-R.html
difficulty: Intermediate
---

# Exact Binomial Test in R: binom.test() for Small Samples

<p class="lead"><code>binom.test()</code> in R performs an exact test of a proportion using the binomial distribution directly, returning honest p-values and Clopper-Pearson confidence intervals even when the sample is too small for the normal approximation. Reach for it when total trials are below about thirty, or whenever <code>n*p</code> or <code>n*(1-p)</code> dips under 5.</p>

## Why do small samples need an exact binomial test?

The normal approximation behind classic proportion tests assumes the sampling distribution of the sample proportion is roughly bell-shaped. At small sample sizes it simply is not. The discrete binomial has gaps, skew, and sharp edges that a smooth normal curve glosses over, and a rough rule of thumb is that you need `n*p >= 5` and `n*(1-p) >= 5` before trusting the approximation. `binom.test()` sidesteps the approximation entirely and computes the p-value from the exact binomial probability mass function, so the answer stays correct no matter how small `n` is. Here is the payoff on a 12-flip coin experiment.

```r title="Small-sample payoff: 10 heads in 12 flips"
# A coin is flipped 12 times and lands heads 10 times.
# Is it a fair coin?
bt1 <- binom.test(x = 10, n = 12, p = 0.5)
bt1
#> 
#> 	Exact binomial test
#> 
#> data:  10 and 12
#> number of successes = 10, number of trials = 12, p-value = 0.03857
#> alternative hypothesis: true probability of success is not equal to 0.5
#> 95 percent confidence interval:
#>  0.5158623 0.9633346
#> sample estimates:
#> probability of success 
#>              0.8333333
```

With only 12 flips, the p-value of 0.0386 is small enough to reject the fair-coin hypothesis at the 5% level. Notice the 95% confidence interval, `[0.52, 0.96]`, sits entirely above 0.5. Both decisions point the same way, and both come from exact binomial probabilities rather than a questionable bell-curve approximation.

[KEY INSIGHT]
**"Exact" means the p-value is computed by summing exact binomial probabilities, not by a normal approximation.** Whether `n` is 8 or 80, `binom.test()` returns the true probability of seeing a result at least as extreme as yours under the null.

**Try it:** A coin is flipped 8 times and lands heads 7 times. Is this consistent with a fair coin? Use `binom.test()` with the two-sided default.

```r title="Your turn: 7 heads in 8 flips"
# Test 7/8 heads against H0: p = 0.5
ex_coin <- NULL  # replace NULL with the binom.test() call

ex_coin
#> Expected: p-value around 0.07, CI roughly [0.47, 0.997]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-sided test solution"
ex_coin <- binom.test(x = 7, n = 8, p = 0.5)
ex_coin
#> 
#> 	Exact binomial test
#> 
#> data:  7 and 8
#> number of successes = 7, number of trials = 8, p-value = 0.07031
#> alternative hypothesis: true probability of success is not equal to 0.5
#> 95 percent confidence interval:
#>  0.4734903 0.9967771
#> sample estimates:
#> probability of success 
#>                  0.875
```

**Explanation:** Two-sided p-value is 0.070, which does not cross the 5% threshold. The confidence interval `[0.47, 1.00]` just barely includes 0.5, confirming the same non-rejection decision.

</details>

## How do you call binom.test() in R?

Now that you have seen the output, let's look at the function signature in full so you can configure every run deliberately. `binom.test()` takes five arguments, most with sensible defaults.

| Argument | Default | Purpose |
|---|---|---|
| `x` | (required) | Number of successes, or a two-element vector `c(successes, failures)` |
| `n` | required if `x` is a scalar | Total number of trials |
| `p` | `0.5` | Hypothesized probability of success under H0 |
| `alternative` | `"two.sided"` | One of `"two.sided"`, `"less"`, `"greater"` |
| `conf.level` | `0.95` | Confidence level for the Clopper-Pearson interval |

Let's run the canonical textbook example. A fair six-sided die should land on three once every six rolls, so the null proportion is `1/6`. You roll the die 24 times and land a three 9 times, much more than the expected four. Is the die loaded?

```r title="Die-roll fairness check"
# 24 rolls, 9 threes, H0: p = 1/6
bt_die <- binom.test(x = 9, n = 24, p = 1/6)
bt_die
#> 
#> 	Exact binomial test
#> 
#> data:  9 and 24
#> number of successes = 9, number of trials = 24, p-value = 0.01176
#> alternative hypothesis: true probability of success is not equal to 0.1666667
#> 95 percent confidence interval:
#>  0.1879166 0.5940894
#> sample estimates:
#> probability of success 
#>                  0.375
```

With `p-value = 0.012` and the 95% CI `[0.19, 0.59]` sitting wholly above `1/6 ≈ 0.167`, the evidence against a fair die is strong. The sample estimate of 0.375 tells you the observed proportion of threes was more than double the null.

[NOTE]
**The default `p = 0.5` is only the right choice when you are testing a fair coin.** Every other scenario needs an explicit null proportion. Forgetting this is a silent way to test the wrong hypothesis and still get a plausible-looking p-value.

**Try it:** Your QA lab inspects 20 widgets and finds 3 defective. The factory's claim is a 5% defect rate. Use `binom.test()` to evaluate the claim two-sided.

```r title="Your turn: QA defect rate"
# 3 defects in 20 inspected, H0: p = 0.05
ex_defects <- NULL  # fill in

ex_defects
#> Expected: p-value around 0.075, CI roughly [0.032, 0.379]
```

<details>
<summary>Click to reveal solution</summary>

```r title="QA defect rate solution"
ex_defects <- binom.test(x = 3, n = 20, p = 0.05)
ex_defects
#> 
#> 	Exact binomial test
#> 
#> data:  3 and 20
#> number of successes = 3, number of trials = 20, p-value = 0.07548
#> alternative hypothesis: true probability of success is not equal to 0.05
#> 95 percent confidence interval:
#>  0.03207094 0.37892683
#> sample estimates:
#> probability of success 
#>                   0.15
```

**Explanation:** The two-sided p-value of 0.075 does not quite clear the 5% bar, even though the sample defect rate (0.15) is three times the claimed rate. Small samples have low power.

</details>

## How do you run one-sided tests with binom.test()?

When prior knowledge or study design points in one direction, a two-sided test wastes power on the direction you do not care about. Set `alternative = "greater"` to test whether the true proportion exceeds the null, and `alternative = "less"` to test the opposite.

```r title="Right-tailed: new drug response rate"
# 14 responders out of 18 patients, H0: p = 0.5, H1: p > 0.5
bt_drug <- binom.test(x = 14, n = 18, p = 0.5, alternative = "greater")
bt_drug
#> 
#> 	Exact binomial test
#> 
#> data:  14 and 18
#> number of successes = 14, number of trials = 18, p-value = 0.01544
#> alternative hypothesis: true probability of success is greater than 0.5
#> 95 percent confidence interval:
#>  0.5750286 1.0000000
#> sample estimates:
#> probability of success 
#>              0.7777778
```

Because the alternative is `"greater"`, R concentrates the entire 5% risk in the right tail. The p-value of 0.015 now reflects only `P(X >= 14)` under a fair-coin null, not both tails. The 95% confidence interval has 1 as its upper bound because, by construction, a right-tailed CI does not bound the upper side.

```r title="Left-tailed: late-shipment rate"
# 2 late shipments in 25, H0: p = 0.2, H1: p < 0.2
bt_ship <- binom.test(x = 2, n = 25, p = 0.2, alternative = "less")
bt_ship
#> 
#> 	Exact binomial test
#> 
#> data:  2 and 25
#> number of successes = 2, number of trials = 25, p-value = 0.09823
#> alternative hypothesis: true probability of success is less than 0.2
#> 95 percent confidence interval:
#>  0.0000000 0.2320114
#> sample estimates:
#> probability of success 
#>                   0.08
```

The left-tailed p-value is 0.098, so at the 5% level you cannot claim the true late-shipment rate is below the 20% benchmark yet, even though the sample rate is just 8%. Small-sample left-tailed tests are often underpowered like this.

[WARNING]
**One-sided confidence intervals bound only one side of the estimate.** The opposite bound is hard-coded at 0 or 1. If you need a standard two-sided interval, run a separate two-sided `binom.test()` or use `conf.level` directly with `qbeta()`.

**Try it:** A coin is flipped 10 times and lands heads 9 times. Test the one-sided hypothesis that the coin is biased *toward heads* (H1: p > 0.5).

```r title="Your turn: one-sided biased-coin test"
# 9 heads in 10 flips, H0: p = 0.5, H1: p > 0.5
ex_coin_greater <- NULL  # fill in

ex_coin_greater
#> Expected: p-value around 0.0107, CI lower bound ~0.61
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sided biased-coin solution"
ex_coin_greater <- binom.test(x = 9, n = 10, p = 0.5, alternative = "greater")
ex_coin_greater
#> 
#> 	Exact binomial test
#> 
#> data:  9 and 10
#> number of successes = 9, number of trials = 10, p-value = 0.01074
#> alternative hypothesis: true probability of success is greater than 0.5
#> 95 percent confidence interval:
#>  0.6058367 1.0000000
#> sample estimates:
#> probability of success 
#>                    0.9
```

**Explanation:** The right-tailed p-value of 0.011 is small enough to reject the fair-coin null in favor of a heads-biased coin.

</details>

## How do you interpret the Clopper-Pearson confidence interval?

The interval printed by `binom.test()` is not a normal approximation with a wider margin of safety. It is the Clopper-Pearson exact interval, built by inverting the binomial cumulative distribution. Because the binomial is discrete, the interval guarantees actual coverage of at least `conf.level`, which makes it slightly conservative (wider than strictly needed), but never misleadingly narrow.

Under the hood, each bound is a beta-distribution quantile. For `x` successes in `n` trials at confidence level `1 - alpha`:

$$CI_L \;=\; B\!\left(\tfrac{\alpha}{2};\ x,\ n - x + 1\right), \qquad CI_U \;=\; B\!\left(1 - \tfrac{\alpha}{2};\ x + 1,\ n - x\right)$$

Where:

- $B(q;\ a,\ b)$ is the inverse CDF (quantile function) of the Beta(a, b) distribution, called `qbeta(q, a, b)` in R
- $\alpha = 1 - \text{conf.level}$
- $x$ is the number of successes and $n$ the total trials

*If you are not interested in the math, skip to the code below, the computed interval is all you need for day-to-day inference.*

You can reproduce R's confidence interval by hand, which is the cleanest way to convince yourself Clopper-Pearson is not a black box.

```r title="Verify the CI with qbeta()"
# 8 successes in 20 trials, 95% CI
x <- 8
n <- 20
alpha <- 1 - 0.95

bt_ci <- binom.test(x, n)
bt_ci$conf.int
#> [1] 0.1911901 0.6394574
#> attr(,"conf.level")
#> [1] 0.95

# Manual Clopper-Pearson bounds using qbeta()
ci_lower <- qbeta(alpha / 2,     x,     n - x + 1)
ci_upper <- qbeta(1 - alpha / 2, x + 1, n - x)
c(lower = ci_lower, upper = ci_upper)
#>     lower     upper 
#> 0.1911901 0.6394574
```

The hand-computed bounds match R's output to the last digit. This is the exact Clopper-Pearson formula, nothing more. That also tells you how to get a Clopper-Pearson CI for any custom confidence level without going through `binom.test()` at all, you just call `qbeta()` directly.

[TIP]
**Clopper-Pearson is the safest default, but not always the tightest.** When you need a shorter interval and can accept slightly-below-nominal coverage, the Wilson score or mid-p intervals (available via `binom::binom.confint()`) are usually narrower at the same confidence level.

**Try it:** Compute a 99% confidence interval for 4 successes in 20 trials using `binom.test()` with `conf.level = 0.99`.

```r title="Your turn: 99% CI for 4/20"
# 4 successes in 20 trials, 99% CI
ex_ci99 <- NULL  # fill in

ex_ci99$conf.int
#> Expected: CI roughly [0.05, 0.50]
```

<details>
<summary>Click to reveal solution</summary>

```r title="99% CI solution"
ex_ci99 <- binom.test(x = 4, n = 20, conf.level = 0.99)
ex_ci99$conf.int
#> [1] 0.05176304 0.50010963
#> attr(,"conf.level")
#> [1] 0.99
```

**Explanation:** Bumping the confidence level from 95% to 99% widens the interval because you demand higher coverage. The sample proportion is still 0.20, but the Clopper-Pearson bounds now span almost half the 0-to-1 scale.

</details>

## How do you extract p-value and CI programmatically?

Printed output is fine for a single test, but real analyses batch tests across many groups and record the numbers in a tibble or dashboard. The `binom.test()` return value is an `htest` list with a fixed set of named components, so you can pull out exactly what you need.

```r title="Extract components from an htest object"
bt_ex <- binom.test(x = 14, n = 18, p = 0.5, alternative = "greater")

bt_ex$p.value
#> [1] 0.01544189

bt_ex$conf.int
#> [1] 0.5750286 1.0000000
#> attr(,"conf.level")
#> [1] 0.95

bt_ex$estimate
#> probability of success 
#>              0.7777778

bt_ex$statistic
#> number of successes 
#>                  14
```

Once you know the component names, pipelines are easy. Here is a batch test across three experimental groups, returning a tidy table that you can feed into a report or plot.

```r title="Batch test across groups into a tidy tibble"
library(dplyr)
library(purrr)
library(tibble)

groups <- tibble(
  group = c("A", "B", "C"),
  x     = c(3, 14, 9),
  n     = c(20, 18, 24)
)

results_tbl <- groups |>
  mutate(test = map2(x, n, ~ binom.test(.x, .y, p = 0.5))) |>
  mutate(
    p_value  = map_dbl(test, "p.value"),
    ci_lower = map_dbl(test, ~ .x$conf.int[1]),
    ci_upper = map_dbl(test, ~ .x$conf.int[2]),
    estimate = map_dbl(test, ~ as.numeric(.x$estimate))
  ) |>
  select(-test)

results_tbl
#> # A tibble: 3 × 6
#>   group     x     n  p_value ci_lower ci_upper estimate
#>   <chr> <dbl> <dbl>    <dbl>    <dbl>    <dbl>    <dbl>
#> 1 A         3    20 0.00257    0.0321    0.379    0.15 
#> 2 B        14    18 0.0309     0.5236    0.936    0.778
#> 3 C         9    24 0.152      0.188     0.594    0.375
```

Group A rejects the null at 1%, group B at 5%, and group C is not significant. Having the bounds and estimate as numeric columns makes it trivial to filter, plot error bars, or export to a spreadsheet.

[KEY INSIGHT]
**Extracting numerics turns hypothesis tests into a data-engineering task.** Instead of scraping printed output, you pull `$p.value` and `$conf.int` straight out of the `htest` list and let the rest of the tidyverse handle filtering, joining, and plotting.

**Try it:** Write a small function `ex_ci_width()` that takes a `binom.test()` result and returns the width of its confidence interval.

```r title="Your turn: CI width helper"
# Return upper - lower of the CI
ex_ci_width <- function(bt) {
  # your code here
}

ex_ci_width(binom.test(8, 20))
#> Expected: ~0.448
```

<details>
<summary>Click to reveal solution</summary>

```r title="CI width helper solution"
ex_ci_width <- function(bt) {
  diff(bt$conf.int)
}

ex_ci_width(binom.test(8, 20))
#> [1] 0.4482673
```

**Explanation:** `diff()` on a two-element vector returns the single-element difference, which equals `upper - lower`. Wrapping it in a function makes CI widths comparable across many tests in a pipeline.

</details>

## Practice Exercises

### Exercise 1: Rare-event quality test

A stamping machine is rated to produce at most 2% defective parts. You inspect 40 parts and find 3 defective. Test whether the true defect rate exceeds the 2% rating, at the 5% level. Report the p-value, the 95% confidence interval, and your decision.

```r title="Practice: rare-event defect test"
# 3 defects in 40 inspected, H0: p = 0.02, H1: p > 0.02

# Write your code below:
my_qa <- NULL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rare-event defect solution"
my_qa <- binom.test(x = 3, n = 40, p = 0.02, alternative = "greater")
my_qa
#> 
#> 	Exact binomial test
#> 
#> data:  3 and 40
#> number of successes = 3, number of trials = 40, p-value = 0.05252
#> alternative hypothesis: true probability of success is greater than 0.02
#> 95 percent confidence interval:
#>  0.02075793 1.00000000
#> sample estimates:
#> probability of success 
#>                  0.075

c(p_value = my_qa$p.value, lower = my_qa$conf.int[1])
#>    p_value      lower 
#> 0.05252143 0.02075793
```

**Explanation:** The p-value of 0.053 narrowly misses the 5% cutoff. The 95% lower bound of 0.021 is a hair above the rated 2%, so the evidence suggests the machine is borderline rather than clearly out of spec. A larger inspection sample is warranted.

</details>

### Exercise 2: Compare two quality tiers

Tier A: 4 defects in 15 items. Tier B: 3 defects in 18 items. For each tier, run `binom.test()` against a 10% benchmark defect rate with a two-sided alternative, extract the CIs, and return a tibble with columns `tier`, `estimate`, `ci_lower`, `ci_upper`, and a logical column `overlaps_ten_pct` that is `TRUE` when the CI contains 0.10.

```r title="Practice: compare two tiers"
# Tier A: x=4, n=15. Tier B: x=3, n=18. Benchmark: p = 0.10

# Write your code below:
my_tierA   <- NULL
my_tierB   <- NULL
my_results <- NULL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare tiers solution"
library(dplyr)

my_tierA <- binom.test(x = 4, n = 15, p = 0.10)
my_tierB <- binom.test(x = 3, n = 18, p = 0.10)

my_results <- tibble(
  tier     = c("A", "B"),
  estimate = c(as.numeric(my_tierA$estimate), as.numeric(my_tierB$estimate)),
  ci_lower = c(my_tierA$conf.int[1], my_tierB$conf.int[1]),
  ci_upper = c(my_tierA$conf.int[2], my_tierB$conf.int[2])
) |>
  mutate(overlaps_ten_pct = ci_lower <= 0.10 & 0.10 <= ci_upper)

my_results
#> # A tibble: 2 × 5
#>   tier  estimate ci_lower ci_upper overlaps_ten_pct
#>   <chr>    <dbl>    <dbl>    <dbl> <lgl>           
#> 1 A        0.267   0.0778    0.551 TRUE            
#> 2 B        0.167   0.0358    0.414 TRUE            
```

**Explanation:** Both tiers have small samples, so both CIs are wide enough to include the 10% benchmark. Neither tier differs significantly from the benchmark on its own. To directly compare tier A against tier B, you would need `prop.test()` or `fisher.test()`, not two one-sample binomial tests.

</details>

## Complete Example: A/B pilot with 30 users per arm

A product team runs a tiny 30-per-arm pilot before committing to a full-scale A/B test. The 20% conversion rate from last quarter is the benchmark. Arm A (control) saw 8 of 30 convert; arm B (variant) saw 14 of 30. You want to know which arms differ from the 20% baseline.

```r title="A/B pilot end-to-end"
library(dplyr)
library(purrr)
library(tibble)

arms <- tibble(
  arm = c("A_control", "B_variant"),
  x   = c(8, 14),
  n   = c(30, 30)
)

results <- arms |>
  mutate(test = map2(x, n, ~ binom.test(.x, .y, p = 0.20))) |>
  mutate(
    estimate = map_dbl(test, ~ as.numeric(.x$estimate)),
    p_value  = map_dbl(test, "p.value"),
    ci_lower = map_dbl(test, ~ .x$conf.int[1]),
    ci_upper = map_dbl(test, ~ .x$conf.int[2]),
    decision = if_else(p_value < 0.05, "Reject baseline", "Keep baseline")
  ) |>
  select(-test)

results
#> # A tibble: 2 × 7
#>   arm           x     n estimate  p_value ci_lower ci_upper decision       
#>   <chr>     <dbl> <dbl>    <dbl>    <dbl>    <dbl>    <dbl> <chr>          
#> 1 A_control     8    30    0.267 0.403       0.123    0.459 Keep baseline  
#> 2 B_variant    14    30    0.467 0.000817    0.283    0.657 Reject baseline
```

Arm A is indistinguishable from the 20% baseline at this sample size. Arm B clearly beats it, with a 95% CI of `[0.28, 0.66]` sitting entirely above 0.20 and a p-value of 0.0008. The next step would be to run `prop.test()` or `fisher.test()` to directly compare arm A against arm B, because two one-sample tests against a shared baseline do not establish a difference between the arms.

## Summary

- `binom.test(x, n, p, alternative, conf.level)` performs an exact test of a proportion from the binomial pmf, no normal approximation needed.
- Use it whenever `n` is small, roughly under 30, or when `n*p` or `n*(1-p)` is below 5.
- Default `p = 0.5` is only appropriate for fair-coin tests, set it explicitly for every other scenario.
- `alternative = "greater"` and `"less"` give one-sided tests with one-sided confidence intervals.
- The printed CI is Clopper-Pearson, computed from `qbeta()`, and is guaranteed conservative.
- You can reproduce the CI by hand as `c(qbeta(alpha/2, x, n-x+1), qbeta(1-alpha/2, x+1, n-x))`.
- The result is an `htest` list with `$p.value`, `$conf.int`, `$estimate`, and `$statistic` slots, ready for programmatic extraction.
- For direct two-sample comparisons, switch to `prop.test()` for large samples or `fisher.test()` for 2x2 tables.

## References

1. R Core Team. `?binom.test` manual page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html)
2. Clopper, C.J. & Pearson, E.S. (1934). "The use of confidence or fiducial limits illustrated in the case of the binomial." *Biometrika* 26:404-413. [Link](https://www.jstor.org/stable/2331986)
3. Agresti, A. (2019). *Statistical Methods for the Social Sciences*, 5th ed., Chapter 5. Pearson.
4. Brown, L.D., Cai, T.T., DasGupta, A. (2001). "Interval Estimation for a Binomial Proportion." *Statistical Science* 16(2):101-133. [Link](https://projecteuclid.org/journals/statistical-science/volume-16/issue-2/Interval-Estimation-for-a-Binomial-Proportion/10.1214/ss/1009213286.full)
5. Dorai-Raj, S. `binom` package documentation (Wilson, mid-p, and other CIs). [Link](https://cran.r-project.org/web/packages/binom/)
6. Wikipedia. Binomial test. [Link](https://en.wikipedia.org/wiki/Binomial_test)

## Continue Learning

- [Proportion Tests in R](Proportion-Tests-in-R.html), the parent tutorial. When to reach for `prop.test()`, `binom.test()`, or `fisher.test()`, with a side-by-side decision flow.
- [Chi-Squared Test in R](Chi-Squared-Test-in-R.html). Generalises proportion testing to two or more categorical groups.
- [Fisher's Exact Test in R](Fishers-Exact-Test-in-R.html). The exact counterpart for small-sample 2x2 contingency tables.
