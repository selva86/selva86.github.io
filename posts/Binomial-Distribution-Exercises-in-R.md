---
title: "Binomial Distribution Exercises in R: 17 Practice Problems"
slug: "Binomial-Distribution-Exercises-in-R"
description: "Practice 17 binomial distribution exercises in R covering dbinom, pbinom, qbinom, rbinom and binom.test with full runnable solutions and explanations."
keywords: "binomial distribution exercises in R, dbinom exercises, pbinom practice, qbinom problems, rbinom simulation, binom.test R, binomial probability R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Binomial Distribution Exercises"
sidebar_order: 305
fr_parent: "Binomial-and-Poisson-Distributions-in-R.html"
auto_link_terms: "binomial distribution exercises|dbinom exercises|pbinom practice|qbinom exercises|rbinom simulation|binom.test exercises"
auto_link_case_sensitive: false
target_keyword: "binomial distribution exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Binomial Distribution Exercises in R: 17 Practice Problems

<p class="lead">Seventeen runnable binomial distribution exercises in R, grouped by the four core functions (<code>dbinom</code>, <code>pbinom</code>, <code>qbinom</code>, <code>rbinom</code>) plus <code>binom.test</code> inference. Each problem ships with a hidden solution and a written explanation so you can self-check the moment you finish coding.</p>

```r title="Run this once before any exercise"
library(ggplot2)
set.seed(2026)
```

## Section 1. Exact probabilities with dbinom (3 problems)

### Exercise 1.1: Probability of exactly 5 heads in 10 fair flips

**Task:** A friend hands you a coin claimed to be fair and asks for the probability of getting exactly 5 heads in 10 flips. Use `dbinom()` with `size = 10` and `prob = 0.5` to compute $P(X = 5)$. Save the scalar to `ex_1_1`.

**Expected result:**

```
#> [1] 0.2460938
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- dbinom(5, size = 10, prob = 0.5)
ex_1_1
#> [1] 0.2460938
```

**Explanation:** `dbinom(x, size, prob)` returns the probability mass at exactly `x` successes. The first argument is the count you want a probability for, not a vector of trial outcomes. For a fair coin the answer is $\binom{10}{5} \cdot 0.5^{10} = 252 / 1024 \approx 0.2461$. A common mistake is using `pbinom()` here, which would return the cumulative probability $P(X \le 5)$ instead of the exact-equality mass.

</details>

### Exercise 1.2: Quality control: exactly 2 defective widgets in a batch of 50

**Task:** A quality engineer at a parts supplier samples 50 widgets from a production line with a 3 percent defect rate. Compute the probability that exactly 2 widgets in the sample are defective using `dbinom()`. Save the result to `ex_1_2`.

**Expected result:**

```
#> [1] 0.2555182
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- dbinom(2, size = 50, prob = 0.03)
ex_1_2
#> [1] 0.2555182
```

**Explanation:** Every trial is one widget, success means defective, and the trials are assumed independent with constant probability 0.03, which is the textbook binomial setup. Around 25.5 percent is the single most likely count near the mean $np = 1.5$. If the defect rate were estimated from a small pilot rather than known, you would want a Beta-binomial or a credible interval on $p$ before treating the answer as exact.

</details>

### Exercise 1.3: Plot the PMF of Binomial(20, 0.3) with a bar chart

**Task:** Build a bar chart showing $P(X = k)$ for $k = 0, 1, \ldots, 20$ under `Binomial(size = 20, prob = 0.3)`. Use `ggplot2` with `geom_col()`, label the axes, and save the ggplot object to `ex_1_3`.

**Expected result:**

```
# A ggplot bar chart with k on the x-axis (0..20) and dbinom(k, 20, 0.3) on the y-axis.
# Peak bar sits around k=6 (the mean np=6). Tails are visibly skinny beyond k=12.
# Axes: x = "Successes (k)", y = "P(X = k)".
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
k  <- 0:20
pmf <- data.frame(k = k, p = dbinom(k, size = 20, prob = 0.3))

ex_1_3 <- ggplot(pmf, aes(x = k, y = p)) +
  geom_col(fill = "#3a7bd5") +
  labs(x = "Successes (k)", y = "P(X = k)",
       title = "PMF of Binomial(20, 0.3)") +
  theme_minimal()
ex_1_3
```

**Explanation:** Passing a vector `0:20` to `dbinom()` vectorizes the call and returns 21 probabilities in one shot, which is the cleanest way to build a PMF table for plotting. The peak at $k = 6$ matches $np$, the mean of the distribution. For larger `size` the bars start to look bell-shaped, foreshadowing the normal approximation you will see in Section 4.

</details>

## Section 2. Cumulative and tail probabilities with pbinom (4 problems)

### Exercise 2.1: At most 2 heads in 10 fair flips

**Task:** Continuing with the fair-coin scenario, compute the probability of getting at most 2 heads in 10 flips. Use `pbinom()` to evaluate $P(X \le 2)$ with `size = 10` and `prob = 0.5`. Save the scalar to `ex_2_1`.

**Expected result:**

```
#> [1] 0.0546875
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- pbinom(2, size = 10, prob = 0.5)
ex_2_1
#> [1] 0.0546875
```

**Explanation:** `pbinom(q, size, prob)` returns the lower-tail probability $P(X \le q)$ by default, so passing `q = 2` includes the masses at 0, 1, and 2. You could verify by hand with `sum(dbinom(0:2, 10, 0.5))`, which returns the same value. Many beginners reach for `dbinom(2, ...)` here and get the at-exactly-2 mass instead of the at-most-2 cumulative.

</details>

### Exercise 2.2: Survival probability: 8 or more successes out of 20

**Task:** A clinical trial enrolls 20 patients in a single arm, each with response probability 0.30. Compute the probability that 8 or more patients respond using `pbinom()` with `lower.tail = FALSE`. Save the upper-tail probability to `ex_2_2`.

**Expected result:**

```
#> [1] 0.2277282
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- pbinom(7, size = 20, prob = 0.3, lower.tail = FALSE)
ex_2_2
#> [1] 0.2277282
```

**Explanation:** The trick is the offset: `pbinom(q, ..., lower.tail = FALSE)` returns $P(X > q)$, strictly greater than, so to capture $P(X \ge 8)$ you pass `q = 7`. Equivalently you can write `1 - pbinom(7, 20, 0.3)`, but the `lower.tail = FALSE` path is numerically more stable for probabilities near 1 because it avoids `1 - x` cancellation when `x` is tiny.

</details>

### Exercise 2.3: Email marketing: open rate between 40 and 60 on 100 sends

**Task:** A growth team blasts 100 emails with a historical open rate of 0.5 and wants the probability that the number opened lies between 40 and 60 inclusive. Use the difference of two `pbinom()` calls to compute $P(40 \le X \le 60)$. Save the interval probability to `ex_2_3`.

**Expected result:**

```
#> [1] 0.9647998
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- pbinom(60, 100, 0.5) - pbinom(39, 100, 0.5)
ex_2_3
#> [1] 0.9647998
```

**Explanation:** Inclusive interval probabilities use a discrete-aware offset: $P(a \le X \le b) = P(X \le b) - P(X \le a - 1)$. Passing 39 instead of 40 is the most common mistake here. The answer roughly 96.5 percent is close to but not exactly the 95 percent you would read off a continuous normal approximation, which is a reminder that the normal CDF is a smoothing of this step function.

</details>

### Exercise 2.4: Recompute pbinom by summing dbinom

**Task:** Verify your understanding of the binomial CDF by recomputing $P(X \le 5)$ for `Binomial(12, 0.3)` two ways: with `pbinom()`, and by summing `dbinom()` over $k = 0, 1, \ldots, 5$. Save both results in a named numeric vector with elements `cdf` and `pmf_sum` to `ex_2_4`.

**Expected result:**

```
#>      cdf  pmf_sum
#> 0.882131 0.882131
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- c(
  cdf     = pbinom(5, size = 12, prob = 0.3),
  pmf_sum = sum(dbinom(0:5, size = 12, prob = 0.3))
)
ex_2_4
#>      cdf  pmf_sum
#> 0.882131 0.882131
```

**Explanation:** The CDF is defined as the cumulative sum of the PMF, so the two values must agree to floating-point precision. This identity is the reason `pbinom()` and `sum(dbinom(...))` are interchangeable for small `size`, but `pbinom()` is preferred for large `size` because R uses a stable algorithm rather than summing many tiny floats. Exercises like this one are also useful when sanity-checking custom probability code against the built-in family.

</details>

## Section 3. Quantiles and prediction with qbinom (3 problems)

### Exercise 3.1: Find the 95th percentile of Binomial(100, 0.5)

**Task:** Use `qbinom()` to find the smallest integer $k$ such that $P(X \le k) \ge 0.95$ when $X \sim \text{Binomial}(100, 0.5)$. Save this critical value to `ex_3_1` and verify it returns a numeric value.

**Expected result:**

```
#> [1] 58
#> [1] "numeric"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
class(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- qbinom(0.95, size = 100, prob = 0.5)
ex_3_1
#> [1] 58
class(ex_3_1)
#> [1] "numeric"
```

**Explanation:** `qbinom(p, ...)` returns the smallest integer $k$ with cumulative probability at least `p`, so it is the discrete inverse of `pbinom()`. The answer 58 says that in 100 fair flips you would expect to see 58 or fewer heads at least 95 percent of the time. A common confusion is to expect the normal approximation $\mu + 1.645\sigma = 58.2$ to round to 58 exactly, which it does here but does not always.

</details>

### Exercise 3.2: Build a 95 percent prediction interval for daily conversions

**Task:** A site averages 2000 visitors per day with a 5 percent conversion rate. The analytics lead wants a 95 percent prediction interval for the number of daily conversions. Use `qbinom()` at probabilities 0.025 and 0.975 to compute the lower and upper bounds. Save them as a length-2 numeric vector with names `lower` and `upper` to `ex_3_2`.

**Expected result:**

```
#> lower upper
#>    81   120
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- c(
  lower = qbinom(0.025, size = 2000, prob = 0.05),
  upper = qbinom(0.975, size = 2000, prob = 0.05)
)
ex_3_2
#> lower upper
#>    81   120
```

**Explanation:** This is a prediction interval, not a confidence interval. It says where future daily conversion counts should fall under the assumed model, holding `prob = 0.05` fixed. A confidence interval would instead quantify uncertainty about `prob` itself. Reviewers sometimes flag prediction intervals that are too narrow because the analyst forgot to account for parameter uncertainty, especially when `prob` was estimated from a small sample.

</details>

### Exercise 3.3: Compare qbinom to the empirical 0.9 quantile of rbinom

**Task:** Draw 50000 samples from `Binomial(40, 0.25)` with `rbinom()`, then compute the 0.9 sample quantile and compare it with `qbinom(0.9, 40, 0.25)`. Save both numbers in a named vector with elements `theoretical` and `empirical` to `ex_3_3`.

**Expected result:**

```
#> theoretical   empirical
#>          14          14
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
samp <- rbinom(50000, size = 40, prob = 0.25)
ex_3_3 <- c(
  theoretical = qbinom(0.9, 40, 0.25),
  empirical   = unname(quantile(samp, 0.9, type = 1))
)
ex_3_3
#> theoretical   empirical
#>          14          14
```

**Explanation:** Empirical and theoretical quantiles should match for large `n`, and 50000 is well past the regime where Monte Carlo noise matters here. Passing `type = 1` to `quantile()` is important because it uses the inverse of the empirical CDF, which matches the discrete-aware definition `qbinom()` uses. Other `type` values interpolate between adjacent order statistics and can drift off by 1 for skewed discrete distributions.

</details>

## Section 4. Simulation and parameter estimation with rbinom (4 problems)

### Exercise 4.1: Estimate the head probability from 10000 simulated flips

**Task:** Simulate 10000 Bernoulli trials of a fair coin using `rbinom(n = 10000, size = 1, prob = 0.5)`, then compute the sample mean as your estimate of `prob`. Save the proportion to `ex_4_1`.

**Expected result:**

```
#> [1] 0.4977  # approximately 0.5; exact value depends on the seed
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
flips  <- rbinom(10000, size = 1, prob = 0.5)
ex_4_1 <- mean(flips)
ex_4_1
#> [1] 0.4977
```

**Explanation:** Setting `size = 1` makes `rbinom()` generate Bernoulli outcomes (0 or 1), and the sample mean of those is the maximum likelihood estimate of `prob`. With 10000 draws the standard error is $\sqrt{0.5 \cdot 0.5 / 10000} = 0.005$, so values near 0.495 to 0.505 are routine. Cranking `n` higher tightens that band, while shrinking `n` widens it and makes Monte Carlo estimation noticeably noisier.

</details>

### Exercise 4.2: Estimate p with standard error from a sample of 200 customers

**Task:** A survey draws 200 customers, of whom 56 click the promo banner. Treat this as a single Binomial(200, p) observation. Compute the point estimate $\hat p = 56/200$ and its standard error $\sqrt{\hat p (1 - \hat p) / 200}$. Save both to a named numeric vector with elements `phat` and `se` and assign it to `ex_4_2`.

**Expected result:**

```
#>    phat      se
#> 0.28000 0.03175
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x  <- 56
n  <- 200
phat <- x / n
se   <- sqrt(phat * (1 - phat) / n)
ex_4_2 <- c(phat = phat, se = se)
ex_4_2
#>    phat      se
#> 0.28000 0.03175
```

**Explanation:** $\hat p$ is the sample success proportion and is the MLE of the binomial probability parameter. Its Wald standard error uses $\hat p$ in place of the unknown true $p$, which is why the formula plugs in 0.28 rather than a hypothesized 0.5. For small samples or proportions near 0 or 1, Wald standard errors overstate precision; in those regimes prefer Wilson or Agresti-Coull intervals returned by `binom.test()` and `prop.test()`.

</details>

### Exercise 4.3: Compare empirical to theoretical mean and variance

**Task:** Draw 5000 samples from `Binomial(20, 0.3)` with `rbinom()`. Compute the sample mean and sample variance, then compute the theoretical values $np$ and $np(1-p)$. Save all four as a named numeric vector with elements `emp_mean`, `emp_var`, `theo_mean`, `theo_var` and assign to `ex_4_3`.

**Expected result:**

```
#>  emp_mean   emp_var theo_mean  theo_var
#>    6.0098    4.1632    6.0000    4.2000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
draws <- rbinom(5000, size = 20, prob = 0.3)
ex_4_3 <- c(
  emp_mean  = mean(draws),
  emp_var   = var(draws),
  theo_mean = 20 * 0.3,
  theo_var  = 20 * 0.3 * (1 - 0.3)
)
ex_4_3
```

**Explanation:** The theoretical mean of $\text{Binomial}(n, p)$ is $np$ and the variance is $np(1 - p)$, both classic results derived from summing $n$ independent Bernoulli variables. Empirical estimates from 5000 draws should be within a few percent of these targets. If you saw the empirical variance systematically above the theoretical value, that would signal overdispersion and you might switch to a Beta-binomial or quasi-binomial fit.

</details>

### Exercise 4.4: Simulate free-throw streaks for an 85 percent shooter

**Task:** Simulate one season of 1000 free-throw attempts for a player with a true make rate of 0.85, then count the longest consecutive run of makes (a streak). Use `rbinom()` to generate the 1000 outcomes and `rle()` to find the longest run of 1s. Save the longest streak length to `ex_4_4`.

**Expected result:**

```
#> [1] 41  # exact streak depends on the seed; expect tens, not hundreds
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
makes  <- rbinom(1000, size = 1, prob = 0.85)
runs   <- rle(makes)
ex_4_4 <- max(runs$lengths[runs$values == 1])
ex_4_4
#> [1] 41
```

**Explanation:** `rle()` returns run-length encoding of a vector: the lengths and the values of consecutive equal stretches, which is exactly the streak structure you want here. Filtering `runs$values == 1` keeps the make-streaks and drops the miss-streaks. The expected longest run for $p = 0.85$ and $n = 1000$ grows like $\log_{1/p}(n) \approx 28$, but tail values in the 30s and 40s are routine because the maximum of geometric-like streak lengths has a heavy right tail.

</details>

## Section 5. Inference with binom.test (3 problems)

### Exercise 5.1: Two-sided exact test for coin fairness

**Task:** Suppose 40 heads were observed in 100 flips. Run an exact two-sided test of $H_0: p = 0.5$ with `binom.test()` and extract the p-value. Save just the p-value as a scalar to `ex_5_1`.

**Expected result:**

```
#> [1] 0.05688793
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_5_1 <- binom.test(40, 100, p = 0.5, alternative = "two.sided")
ex_5_1   <- test_5_1$p.value
ex_5_1
#> [1] 0.05688793
```

**Explanation:** `binom.test()` returns a list (an `htest` object) and the p-value lives in `$p.value`. For two-sided tests R uses the rule of summing probabilities of all outcomes at least as unlikely as the observed one, which is exact and discrete-aware, not the lazy `2 * pbinom(...)` shortcut. The 5.7 percent value is famously just over the 5 percent threshold, a good talking point about the arbitrariness of alpha cutoffs.

</details>

### Exercise 5.2: A/B test: 125 clicks out of 1000 against a 10 percent baseline

**Task:** A product team ships a new landing page expecting at least a 10 percent click-through rate and observes 125 clicks in 1000 visits. Run a two-sided `binom.test()` of $H_0: p = 0.10$ and extract both the p-value and the 95 percent confidence interval. Save them as a named numeric vector with elements `pvalue`, `ci_lo`, `ci_hi` and assign to `ex_5_2`.

**Expected result:**

```
#>     pvalue      ci_lo      ci_hi
#> 0.00977970 0.10510020 0.14710000
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_5_2 <- binom.test(125, 1000, p = 0.10, alternative = "two.sided")
ex_5_2   <- c(
  pvalue = test_5_2$p.value,
  ci_lo  = test_5_2$conf.int[1],
  ci_hi  = test_5_2$conf.int[2]
)
ex_5_2
```

**Explanation:** The 95 percent interval `binom.test()` returns is Clopper-Pearson, the exact interval inverted from the binomial CDF. It is wider than the Wald or Wilson alternatives but guarantees coverage at least 95 percent. The interval here excludes the null value 0.10, consistent with the small p-value, but you should still report the effect size (12.5 percent observed versus 10 percent baseline) since statistical and practical significance are not the same.

</details>

### Exercise 5.3: Exact binom.test versus normal-approximation prop.test

**Task:** Run both `binom.test(35, 100, p = 0.40)` and `prop.test(35, 100, p = 0.40, correct = FALSE)` and compare their p-values to see how the normal approximation tracks the exact test. Save the two p-values to a named numeric vector with elements `exact` and `normal` and assign to `ex_5_3`.

**Expected result:**

```
#>     exact    normal
#> 0.3267612 0.3074177
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- c(
  exact  = binom.test(35, 100, p = 0.40)$p.value,
  normal = prop.test(35, 100, p = 0.40, correct = FALSE)$p.value
)
ex_5_3
```

**Explanation:** `prop.test()` uses a chi-squared statistic that is a normal approximation to the binomial, and `correct = FALSE` turns off Yates continuity correction so the comparison is apples-to-apples. The two p-values agree to about two significant figures here because $n = 100$ and the success count is comfortably away from 0 and $n$. For very small $n$ or extreme proportions the gap widens and the exact test is the safer default.

</details>

## What to do next

- Review the parent lesson: [Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html) for the underlying theory and worked walk-throughs.
- Move on to count-data inference: [Poisson Distribution Exercises in R](Poisson-Distribution-Exercises-in-R.html).
- Reinforce the inference muscles with [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html).
- For more probability practice, try [Normal Distribution Exercises in R](Normal-Distribution-Exercises-in-R.html).
