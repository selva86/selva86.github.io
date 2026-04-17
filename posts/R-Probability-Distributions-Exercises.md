---
title: "R Probability Distributions Exercises: 12 dnorm/pnorm/qnorm Problems, Solved Step-by-Step)"
slug: R-Probability-Distributions-Exercises
description: "Practice R probability distributions with 12 dnorm, pnorm, and qnorm problems. Each exercise has a starter, click-to-reveal solution, and clear explanation."
keywords: "R probability distributions exercises, dnorm pnorm qnorm, R normal distribution practice, dbinom pbinom, dpois ppois, qt qchisq, R critical values, R quantile function"
auto_link_terms: "R probability distributions exercises|dnorm pnorm qnorm exercises|R distribution practice problems|R normal distribution exercises|R binomial distribution practice|R Poisson distribution exercises|qnorm critical values|pnorm probability calculation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: E4.2
post_type: EX
sidebar_title: "R Probability Distributions (12 problems)"
fr_parent: Normal-t-F-and-Chi-Squared-Distributions-in-R.html
difficulty: Intermediate
---

# R Probability Distributions Exercises: 12 dnorm/pnorm/qnorm Problems, Solved Step-by-Step)

<p class="lead">R's d/p/q/r convention, `dnorm`, `pnorm`, `qnorm`, `rnorm`, lets you pull a density, a cumulative probability, a quantile, or a random sample from any distribution using one naming pattern. This 12-problem set drills that convention across the normal, binomial, Poisson, t, and chi-squared distributions, with a starter, click-to-reveal solution, and plain-language explanation for every problem.</p>

## How do `d`, `p`, `q`, and `r` prefixes work in R distributions?

Every distribution in R ships with four functions that share a prefix-plus-name pattern: `d` for density, `p` for the cumulative probability, `q` for the quantile (inverse of `p`), and `r` for random samples. Swap the name, `norm`, `binom`, `pois`, `t`, `chisq`, and the same four prefixes work. That single idea powers every problem below. Watch all four act on one example: adult male heights, modelled as normal with mean 69 inches and standard deviation 3 inches.

```r
mu    <- 69
sigma <- 3

# Density at height = 70 inches
dnorm(70, mu, sigma)
#> [1] 0.1258

# Cumulative: P(height <= 75)
pnorm(75, mu, sigma)
#> [1] 0.9772

# Quantile: 95th percentile of heights
qnorm(0.95, mu, sigma)
#> [1] 73.9346

# Random: 5 simulated heights
set.seed(42)
rnorm(5, mu, sigma)
#> [1] 73.11 67.31 70.09 70.90 70.21
```

The density `0.1258` is the height of the bell curve at 70 inches, not a probability (it's a rate per inch). The cumulative `0.9772` says 97.72% of men are 75 inches or shorter. The 95th percentile `73.93` is the height below which 95% of men fall. The five random draws simulate men pulled at random from the same bell curve. Same four prefixes, they work on every distribution R knows.

[KEY INSIGHT]
**Memorise the prefixes once and you've memorised every distribution.** `d` = density (or mass, for discrete), `p` = cumulative probability up to a value, `q` = the value at a given cumulative probability, `r` = random sample. The distribution name follows: `norm`, `binom`, `pois`, `t`, `chisq`, and dozens more.

### Problem 1: Density value from `dnorm`

**Try it:** For the same height distribution N(69, 3), compute the density at 72 inches using `dnorm()`. Store the result in `p1_density`.

```r
# Problem 1: dnorm at x = 72, mu = 69, sigma = 3
p1_density <- # your code here
p1_density
#> Expected: roughly 0.0807
```

<details>
<summary>Click to reveal solution</summary>

```r
p1_density <- dnorm(72, mean = 69, sd = 3)
p1_density
#> [1] 0.0807
```

**Explanation:** `dnorm(x, mean, sd)` returns the value of the probability density function at `x`. `0.0807` is the curve's height at 72 inches, a density, not a probability. To turn a density into a probability you integrate it over an interval, which is exactly what `pnorm()` does in the next problem.

</details>

### Problem 2: Cumulative probability from `pnorm`

**Try it:** What fraction of men are 75 inches or shorter on the same N(69, 3) distribution? Store the answer in `p2_prob`.

```r
# Problem 2: P(height <= 75)
p2_prob <- # your code here
p2_prob
#> Expected: roughly 0.9772
```

<details>
<summary>Click to reveal solution</summary>

```r
p2_prob <- pnorm(75, mean = 69, sd = 3)
p2_prob
#> [1] 0.9772
```

**Explanation:** `pnorm(q, mean, sd)` is the cumulative distribution function, the area under the bell curve to the left of `q`. `0.9772` says 97.72% of men are 75 inches or shorter, which means 75 sits at about 2 standard deviations above the mean (the classic "68-95-99.7 rule" again).

</details>

### Problem 3: Quantile from `qnorm`

**Try it:** Find the 90th percentile of heights on N(69, 3), the height below which 90% of men fall. Store it in `p3_quantile`.

```r
# Problem 3: 90th percentile of N(69, 3)
p3_quantile <- # your code here
p3_quantile
#> Expected: roughly 72.84
```

<details>
<summary>Click to reveal solution</summary>

```r
p3_quantile <- qnorm(0.90, mean = 69, sd = 3)
p3_quantile
#> [1] 72.8446
```

**Explanation:** `qnorm(p, mean, sd)` is the inverse of `pnorm()`, give it a cumulative probability and it returns the x-value. `pnorm(72.8446, 69, 3)` would give you back `0.90`. The q-functions are how you translate percentile language ("top 10%", "bottom quartile") into actual numbers.

</details>

## How do I compute probabilities for non-standard normal distributions?

Most real distributions aren't standard normal, they have their own mean and spread. The same `pnorm()` handles them with no extra work; you just pass `mean` and `sd`. For a range like "between 600 and 700", subtract two `pnorm()` calls. For upper tails like "at least 45 minutes", use `lower.tail = FALSE`, it's more numerically stable than `1 - pnorm(...)` when you're far out in the tail. Here's the between-pattern on SAT scores modelled as N(500, 100).

```r
# SAT scores: N(500, 100). What fraction scored between 600 and 700?
sat_between <- pnorm(700, 500, 100) - pnorm(600, 500, 100)
sat_between
#> [1] 0.1359
```

`pnorm(700, 500, 100)` gives the area to the left of 700 (≈ 0.9772), and `pnorm(600, 500, 100)` gives the area to the left of 600 (≈ 0.8413). Subtract and you get the strip between them: **13.59%** of test-takers scored in that range. The same subtract-two-pnorms pattern works for any "between a and b" question on any distribution that has a cumulative function.

[TIP]
**Use `lower.tail = FALSE` for upper-tail probabilities, not `1 - pnorm(...)`.** In the far right tail `1 - pnorm(x)` can round to zero because of floating-point subtraction, while `pnorm(x, lower.tail = FALSE)` computes the tail directly and stays accurate. Habit counts, always reach for `lower.tail = FALSE`.

### Problem 4: Between two values on a normal distribution

**Try it:** IQ scores are modelled as N(100, 15). What fraction of people have IQs between 90 and 110? Store the answer in `p4_prob`.

```r
# Problem 4: P(90 <= IQ <= 110) on N(100, 15)
p4_prob <- # your code here
p4_prob
#> Expected: roughly 0.4950
```

<details>
<summary>Click to reveal solution</summary>

```r
p4_prob <- pnorm(110, 100, 15) - pnorm(90, 100, 15)
p4_prob
#> [1] 0.4950
```

**Explanation:** 90 and 110 sit symmetrically around the mean of 100, each about two-thirds of a standard deviation away. Just under half the population (≈ 49.5%) falls in that band. The "68-95-99.7 rule" applies at exact integer multiples of σ; for fractional multiples you let R do the integration.

</details>

### Problem 5: Upper tail with `lower.tail = FALSE`

**Try it:** Commute times are modelled as N(35, 8) minutes. What fraction of commutes last longer than 45 minutes? Use `lower.tail = FALSE`. Store the answer in `p5_prob`.

```r
# Problem 5: P(commute > 45) on N(35, 8) using lower.tail = FALSE
p5_prob <- # your code here
p5_prob
#> Expected: roughly 0.1056
```

<details>
<summary>Click to reveal solution</summary>

```r
p5_prob <- pnorm(45, mean = 35, sd = 8, lower.tail = FALSE)
p5_prob
#> [1] 0.1056
```

**Explanation:** 45 minutes sits 1.25 standard deviations above the mean of 35. `lower.tail = FALSE` flips `pnorm` from "area to the left" to "area to the right", giving the upper-tail probability directly. Roughly 10.56% of commutes run longer than 45 minutes.

</details>

### Problem 6: Finding the top-5% threshold with `qnorm`

**Try it:** For the same commute distribution N(35, 8), find the commute duration above which only the slowest 5% of commutes fall. Store the answer in `p6_threshold`.

```r
# Problem 6: threshold T such that P(commute > T) = 0.05
p6_threshold <- # your code here
p6_threshold
#> Expected: roughly 48.16
```

<details>
<summary>Click to reveal solution</summary>

```r
p6_threshold <- qnorm(0.95, mean = 35, sd = 8)
p6_threshold
#> [1] 48.1588
```

**Explanation:** "Top 5%" means "above the 95th percentile". `qnorm(0.95, ...)` returns the value below which 95% of commutes fall, and therefore above which the remaining 5% fall. You could equivalently write `qnorm(0.05, 35, 8, lower.tail = FALSE)`; both return the same 48.16 minutes.

</details>

## How do I compute binomial probabilities with `dbinom` and `pbinom`?

The binomial distribution models the count of successes in a fixed number of independent trials, each with the same success probability. The R parameters are `size` (number of trials) and `prob` (success probability). Because the counts are discrete, `dbinom` returns an actual probability, `P(X = k)`, not a density. `pbinom(k, ...)` returns `P(X ≤ k)`, inclusive of `k`. Here's a basketball free-throw example with ten attempts at 70% accuracy.

```r
# 10 free throws, p = 0.7
# P(exactly 8 made) and P(at most 5 made)
ft_exact8   <- dbinom(8, size = 10, prob = 0.7)
ft_atmost5  <- pbinom(5, size = 10, prob = 0.7)

c(ft_exact8, ft_atmost5)
#> [1] 0.2335 0.1503
```

`dbinom(8, 10, 0.7)` gives the exact probability of making exactly 8 of 10 shots: **23.35%**. `pbinom(5, 10, 0.7)` gives the probability of making 5 or fewer: **15.03%**. Notice how the "at most 5" is much less likely than "exactly 8", because 7 is the expected number of makes, counts below the mean quickly become rare. The same `dbinom`/`pbinom` pair works for A/B test conversions, defective-rate sampling, and any other success-count setting.

[NOTE]
**`pbinom(k, ...)` is `P(X ≤ k)`, not `P(X < k)`.** It includes `k` itself. For strict inequality you need `pbinom(k - 1, ...)`. This trips people up because the continuous `pnorm()` doesn't have this ambiguity, with continuous distributions `P(X = k) = 0`, so `≤` and `<` agree. With discrete distributions they don't.

### Problem 7: Exact count with `dbinom`

**Try it:** A fair coin is tossed 10 times. What is the probability of exactly 3 heads? Store the answer in `p7_prob`.

```r
# Problem 7: P(exactly 3 heads in 10 tosses)
p7_prob <- # your code here
p7_prob
#> Expected: roughly 0.1172
```

<details>
<summary>Click to reveal solution</summary>

```r
p7_prob <- dbinom(3, size = 10, prob = 0.5)
p7_prob
#> [1] 0.1172
```

**Explanation:** There are $\binom{10}{3} = 120$ ways to get exactly 3 heads out of 10 tosses, and each specific sequence has probability $0.5^{10} = 1/1024$. Multiply: $120/1024 = 0.1172$. `dbinom()` does that arithmetic for you and generalises to any `prob`, not just 0.5.

</details>

### Problem 8: Cumulative count with `pbinom`

**Try it:** A factory produces widgets with a 10% defective rate. In a batch of 20, what is the probability of finding 4 or fewer defectives? Store the answer in `p8_prob`.

```r
# Problem 8: P(at most 4 defectives in batch of 20, p = 0.10)
p8_prob <- # your code here
p8_prob
#> Expected: roughly 0.9568
```

<details>
<summary>Click to reveal solution</summary>

```r
p8_prob <- pbinom(4, size = 20, prob = 0.10)
p8_prob
#> [1] 0.9568
```

**Explanation:** With a 10% defective rate, the expected number of defectives in 20 widgets is just 2, so seeing 4 or fewer is very likely, about 95.68%. The remaining 4.32% is the probability of seeing 5 or more defectives. This is the building block of acceptance-sampling plans in quality control.

</details>

## How do I model rare events with the Poisson distribution?

The Poisson distribution models counts of events that occur independently at a known average rate per unit time (or area, or volume). Its single parameter `lambda` is both the mean and the variance. R uses `dpois` for exact counts and `ppois` for cumulative. Here's a call-centre example at 12 calls per hour.

```r
# Call centre: lambda = 12 calls/hour
# P(exactly 15 calls) and P(more than 20 calls)
cc_exact15    <- dpois(15, lambda = 12)
cc_morethan20 <- ppois(20, lambda = 12, lower.tail = FALSE)

c(cc_exact15, cc_morethan20)
#> [1] 0.0724 0.0116
```

`dpois(15, 12)` tells us that in any given hour there's a **7.24%** chance of exactly 15 calls, plausible but above the mean of 12. `ppois(20, 12, lower.tail = FALSE)` gives the probability of a burst: more than 20 calls in an hour, about **1.16%**. The same pattern handles defect counts per production shift, goals per football match, or cosmic rays per square centimetre per second, anywhere events arrive at a steady average rate.

### Problem 9: Exact count with `dpois`

**Try it:** You receive on average 3 work emails per hour. Assuming a Poisson arrival process, what is the probability of receiving exactly 4 emails in the next hour? Store the answer in `p9_prob`.

```r
# Problem 9: P(exactly 4 emails) when lambda = 3
p9_prob <- # your code here
p9_prob
#> Expected: roughly 0.1680
```

<details>
<summary>Click to reveal solution</summary>

```r
p9_prob <- dpois(4, lambda = 3)
p9_prob
#> [1] 0.1680
```

**Explanation:** Plugging into the Poisson pmf $P(X = k) = e^{-\lambda} \lambda^k / k!$ gives $e^{-3} \cdot 3^4 / 24 \approx 0.168$. R spares you the arithmetic. Note that 4 is just above the mean of 3, so this probability is near the peak of the distribution.

</details>

### Problem 10: Upper tail with `ppois` and `lower.tail = FALSE`

**Try it:** A town records on average 5 traffic accidents per week. What is the probability of more than 7 accidents in any given week? Store the answer in `p10_prob`.

```r
# Problem 10: P(X > 7) when lambda = 5, using lower.tail = FALSE
p10_prob <- # your code here
p10_prob
#> Expected: roughly 0.1334
```

<details>
<summary>Click to reveal solution</summary>

```r
p10_prob <- ppois(7, lambda = 5, lower.tail = FALSE)
p10_prob
#> [1] 0.1334
```

**Explanation:** `ppois(7, 5)` would give `P(X ≤ 7) ≈ 0.8666`. Flipping to `lower.tail = FALSE` gives the complement directly: `P(X > 7) ≈ 0.1334`, roughly a 1-in-7.5 chance of a bad week. That's the number an insurer or a public-health analyst plans against.

</details>

## How do I find critical values for t and chi-squared distributions?

Hypothesis tests and confidence intervals need *critical values*, cutoffs that separate the typical from the extreme under a null distribution. The q-functions return them directly. `qt(p, df)` gives t critical values for any degrees of freedom, and `qchisq(p, df)` does the same for chi-squared. For a two-sided CI at confidence level `level`, pass `(1 + level) / 2` as the probability, you want the tail `(1 - level)/2` on *each* side.

```r
# t critical for two-sided 95% CI, df = 24
t_crit_95     <- qt(0.975, df = 24)

# chi-squared critical for alpha = 0.05 (upper tail), df = 10
chisq_crit_05 <- qchisq(0.95, df = 10)

c(t_crit_95, chisq_crit_05)
#> [1]  2.0639 18.3070
```

The t critical `2.0639` says: a 95% CI on a mean with 24 degrees of freedom extends 2.0639 standard errors either side of the sample mean. The chi-squared critical `18.307` is the right-tail cutoff, any chi-squared statistic above it rejects at α = 0.05 in a one-sided test. These two q-calls replace a lookup table and generalise to any df.

[WARNING]
**q-functions return lower-tail quantiles by default.** For a two-sided CI at 95% confidence, use `qt(0.975, df)`, *not* `qt(0.95, df)`. The probability you pass is the cumulative area to the left, so you want `(1 + 0.95)/2 = 0.975` to leave 2.5% in each tail. Getting this off-by-one wrong silently builds too-narrow intervals.

### Problem 11: t critical value for a 99% CI

**Try it:** Find the t critical value for a two-sided 99% confidence interval with 15 degrees of freedom. Store it in `p11_crit`.

```r
# Problem 11: t critical for two-sided 99% CI, df = 15
p11_crit <- # your code here
p11_crit
#> Expected: roughly 2.9467
```

<details>
<summary>Click to reveal solution</summary>

```r
p11_crit <- qt(0.995, df = 15)
p11_crit
#> [1] 2.9467
```

**Explanation:** For 99% confidence, leave 0.5% in each tail, so pass `(1 + 0.99)/2 = 0.995` to `qt()`. A 99% CI is wider than the 95% CI at the same df (2.95 vs 2.13), which is the cost of buying more confidence. The t critical also grows as df shrinks, reflecting the extra uncertainty of small samples.

</details>

### Problem 12: Chi-squared critical value for α = 0.01

**Try it:** Find the chi-squared critical value for an upper-tail test at α = 0.01 with 8 degrees of freedom. Store it in `p12_crit`.

```r
# Problem 12: chi-squared critical for alpha = 0.01, df = 8
p12_crit <- # your code here
p12_crit
#> Expected: roughly 20.0902
```

<details>
<summary>Click to reveal solution</summary>

```r
p12_crit <- qchisq(0.99, df = 8)
p12_crit
#> [1] 20.0902
```

**Explanation:** Chi-squared tests (goodness-of-fit, independence, variance) are one-sided, large values reject. For α = 0.01 you want the 99th percentile of the chi-squared distribution with 8 df, which `qchisq(0.99, 8)` returns as 20.09. Any observed statistic above 20.09 rejects the null at the 1% level.

</details>

## Practice Exercises

These two capstone problems combine multiple concepts from the tutorial above. Solve them end-to-end before revealing the answer.

### Exercise 1: Build a 95% confidence interval for a sample mean

Simulate 30 observations from N(50, 10) with `set.seed(2026)`. Compute a 95% confidence interval for the mean using the sample mean, sample standard deviation, and a t critical value. Store the lower and upper bounds in `cap1_ci` as a numeric vector of length 2.

```r
# Capstone 1: 95% CI for a sample mean
set.seed(2026)
cap1_sample <- rnorm(30, mean = 50, sd = 10)
# Hint: use mean(), sd(), qt(), and length()

cap1_ci <- # your code here
cap1_ci
#> Expected: roughly c(46.4, 53.3)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
cap1_sample <- rnorm(30, mean = 50, sd = 10)

cap1_mean <- mean(cap1_sample)
cap1_se   <- sd(cap1_sample) / sqrt(length(cap1_sample))
cap1_crit <- qt(0.975, df = length(cap1_sample) - 1)

cap1_ci <- c(cap1_mean - cap1_crit * cap1_se,
             cap1_mean + cap1_crit * cap1_se)
cap1_ci
#> [1] 46.3839 53.2661
```

**Explanation:** The formula is $\bar{x} \pm t_{0.975, n-1} \cdot s/\sqrt{n}$. Three R ingredients: `mean()` for the centre, `sd()/sqrt(n)` for the standard error, and `qt(0.975, n-1)` for the t critical value. The simulated mean drifts slightly from 50 (the true mean) and the CI covers it, which it should, 95% of the time.

</details>

### Exercise 2: Power of a one-sided z-test

Consider a one-sided z-test of $H_0: \mu = 100$ vs $H_1: \mu > 100$ with $\sigma = 15$ (known), $n = 25$, and $\alpha = 0.05$. Compute the power of the test when the true mean is $\mu = 104$. Store the answer in `cap2_power`.

The recipe:
1. Find the rejection threshold $\bar{x}^{*}$ on the sample-mean scale under $H_0$ using `qnorm()`.
2. Compute the probability that the sample mean exceeds $\bar{x}^{*}$ under $H_1$ using `pnorm(..., lower.tail = FALSE)`.

```r
# Capstone 2: power of a one-sided z-test
sigma <- 15
n     <- 25
mu0   <- 100
mu1   <- 104
alpha <- 0.05

cap2_power <- # your code here
cap2_power
#> Expected: roughly 0.3777
```

<details>
<summary>Click to reveal solution</summary>

```r
sigma <- 15
n     <- 25
mu0   <- 100
mu1   <- 104
alpha <- 0.05

se           <- sigma / sqrt(n)
x_crit       <- qnorm(1 - alpha, mean = mu0, sd = se)
cap2_power   <- pnorm(x_crit, mean = mu1, sd = se, lower.tail = FALSE)
cap2_power
#> [1] 0.3777
```

**Explanation:** The standard error of the sample mean is $\sigma/\sqrt{n} = 3$. Under $H_0$, we reject when the sample mean exceeds `qnorm(0.95, 100, 3) ≈ 104.93`. Under $H_1$ ($\mu = 104$), the probability of exceeding 104.93 is `pnorm(104.93, 104, 3, lower.tail = FALSE) ≈ 0.3777`. So the test has only a **38% chance** of detecting the real 4-unit effect with n = 25, an argument for a larger sample size.

</details>

## Complete Example

End-to-end scenario combining three of the skills from this tutorial. A factory produces bolts whose diameters are normally distributed with mean 10 mm and standard deviation 0.1 mm. The spec window is 9.8–10.2 mm. Management asks three questions: (a) what fraction of bolts are in-spec, (b) if we sample 50 bolts, what's the probability that none are out of spec, and (c) at what diameter does the upper 1% of bolts start?

```r
# Factory diameters: N(10, 0.1). Spec window: 9.8 to 10.2.
mu_d    <- 10
sigma_d <- 0.1

# (a) Fraction in-spec
qc_in_spec <- pnorm(10.2, mu_d, sigma_d) - pnorm(9.8, mu_d, sigma_d)

# (b) P(zero defectives in a sample of 50)
p_defective <- 1 - qc_in_spec
qc_zero_def <- dbinom(0, size = 50, prob = p_defective)

# (c) Diameter above which only 1% of bolts fall
qc_cutoff <- qnorm(0.99, mu_d, sigma_d)

c(in_spec = qc_in_spec, zero_def_50 = qc_zero_def, top1_cutoff = qc_cutoff)
#>    in_spec  zero_def_50  top1_cutoff
#>     0.9545       0.0975      10.2326
```

Step (a) computes the strip between 9.8 and 10.2 by subtracting two `pnorm()` calls, **95.45%** of bolts land inside spec. Step (b) reuses that result: the defective rate is 1 − 0.9545 = 4.55%, and `dbinom(0, 50, 0.0455)` gives the chance of a perfect batch of 50 as about **9.75%**, surprisingly low, because with any non-trivial defect rate a batch of 50 almost always has at least one bad unit. Step (c) uses `qnorm(0.99, ...)` to find the upper-1% cutoff at **10.23 mm**, a useful threshold for screening outliers. Three distributions, three prefixes, one coherent pipeline.

## Summary

The d/p/q/r prefix convention is the single most portable pattern in R statistical computing. Memorise it on the normal distribution and it transfers to every other distribution with no new rules.

| Prefix | Returns | Given | Typical question |
|---|---|---|---|
| `d` | Density (continuous) or probability mass (discrete) | `x`, parameters | "Height of the curve at x" |
| `p` | Cumulative probability | `q`, parameters | "What fraction of X ≤ q?" |
| `q` | Quantile (inverse CDF) | `p`, parameters | "What x has p probability below it?" |
| `r` | Random sample | `n`, parameters | "Give me n draws from this distribution" |

The five distribution families covered here, `norm`, `binom`, `pois`, `t`, `chisq`, take different parameter names (`mean`/`sd`, `size`/`prob`, `lambda`, `df`) but share the same four prefixes. Reach for `lower.tail = FALSE` for upper tails, remember `pbinom`/`ppois` are inclusive (`P(X ≤ k)`), and convert CI confidence levels to quantile probabilities with `(1 + level) / 2`.

For the full mechanics of the t, F, normal, and chi-squared distributions, which situations generate each one and how to read their shapes, see the parent tutorial [Normal, t, F, and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html).

## References

1. R Core Team, *Distributions* manual page (`?Distributions`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html)
2. R Core Team, *The Normal Distribution* reference (`?Normal`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Normal.html)
3. R Core Team, *The Binomial Distribution* reference (`?Binomial`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Binomial.html)
4. R Core Team, *The Poisson Distribution* reference (`?Poisson`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Poisson.html)
5. R Core Team, *The Student t Distribution* reference (`?TDist`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TDist.html)
6. Verzani, J., *Using R for Introductory Statistics* (2nd ed.), Chapter 5: Probability and Distributions. CRC Press (2014).
7. Kross, S., *Introduction to dnorm, pnorm, qnorm, and rnorm for new biostatisticians*. [Link](https://seankross.com/notes/dpqr/)

## Continue Learning

- [Normal, t, F, and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html), the parent core post covering each distribution's shape, parameters, and when it arises.
- [Probability in R Exercises](Probability-in-R-Exercises.html), a broader sibling exercise set covering simulation, Bayes, and classical probability.
- [Binomial vs Poisson in R: Understand When Each Distribution Applies](Binomial-vs-Poisson-in-R.html), choosing between the two most common discrete distributions.
