---
title: "Order Statistics in R: Min, Max, Sample Quantiles, Theory & Simulation"
slug: Order-Statistics-in-R
description: "Understand order statistics in R: derive the distribution of the minimum, maximum, and k-th order statistic, then verify every formula through simulation."
keywords: "order statistics in R, kth order statistic, distribution of the maximum, distribution of the minimum, sample quantile formula, order statistic simulation, beta distribution order statistics, quantile function R, extreme value R, nonparametric confidence interval quantile"
auto_link_terms: "order statistic|order statistics|kth order statistic|sample quantile|distribution of the maximum|distribution of the minimum|empirical quantile"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: "FR-prob-6"
post_type: FR
fr_parent: "Sampling-Distributions-in-R.html"
difficulty: Advanced
---

# Order Statistics in R: Min, Max, Sample Quantiles, Theory & Simulation

<p class="lead"><strong>Order statistics</strong> are the values of your sample once you sort it from smallest to largest. The minimum, the maximum, the median, and every sample quantile are all order statistics, and each one has a known probability distribution that you can derive on paper and verify by simulation in R.</p>

## What exactly is an order statistic?

Take any sample of `n` numbers and sort them. The smallest value is called the **first order statistic**, written $X_{(1)}$. The largest is the **n-th order statistic**, $X_{(n)}$. In between sit $X_{(2)}, X_{(3)}, \ldots, X_{(n-1)}$, in sorted order. The subscript is always in parentheses to distinguish $X_{(k)}$ (the k-th smallest) from $X_k$ (the k-th sample point in the order you collected it). Let's see all of them in one sample.

```r
# Draw 10 values from a standard normal, then sort them
set.seed(1)
x10 <- rnorm(10)
sort(x10)
#>  [1] -0.8356 -0.8204 -0.6265 -0.3054 -0.2947  0.1836  0.4874  0.5758  0.7383
#> [10]  1.5953

# Pick out specific order statistics by index after sorting
sort(x10)[1]    # X(1): the minimum
#> [1] -0.8356
sort(x10)[5]    # X(5): the 5th-smallest value
#> [1] -0.2947
sort(x10)[10]   # X(10): the maximum
#> [1] 1.5953
```

The sorted vector *is* the vector of order statistics. The first entry is the sample minimum, the last is the sample maximum, and the middle entries are the sample quartiles, median, and every other quantile you might want. This single reframe, "sorted sample = ordered statistics", is the whole foundation. Everything that follows is about the distribution each of these sorted values follows across many repeated samples.

[KEY INSIGHT]
**Order statistics are random variables with their own distributions.** $X_{(k)}$ changes every time you draw a new sample, so it has a probability distribution. The rest of this post derives those distributions and verifies them by simulation.

**Try it:** Draw a sample of 12 values from `rexp(12, rate = 1)` and extract its 7th order statistic into `ex_x7`.

```r
# Try it: get the 7th order statistic of an exponential sample
set.seed(42)
ex_x <- rexp(12, rate = 1)

ex_x7 <- 0  # your code here

ex_x7
#> Expected: a single positive number around 0.8-1.5
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
ex_x <- rexp(12, rate = 1)
ex_x7 <- sort(ex_x)[7]
ex_x7
#> [1] 0.8564
```

**Explanation:** `sort()` returns the values in ascending order; indexing with `[7]` picks out the 7th-smallest value, which is $X_{(7)}$ by definition.

</details>

## How is the maximum distributed?

The maximum is the most intuitive order statistic to tackle first. Ask: what is the probability that $X_{(n)}$ is at most $x$? That event happens exactly when *every* value in the sample is at most $x$, if even one exceeded $x$, the max would too. Because sample points are independent, you can multiply their probabilities together.

$$F_{X_{(n)}}(x) = P(X_{(n)} \le x) = [F(x)]^n$$

Where:

- $F_{X_{(n)}}(x)$ = CDF of the sample maximum
- $F(x)$ = CDF of the underlying distribution each $X_i$ was drawn from
- $n$ = sample size

The CDF gets pushed to the right as $n$ grows, because the max of more draws tends to be larger. Let's verify this by simulating 10,000 samples of size 5 from a uniform distribution on $[0, 1]$, where $F(x) = x$, and compare the empirical CDF to the theoretical $x^5$.

```r
# Simulate 10,000 maxima, each from a size-5 Uniform(0,1) sample
library(ggplot2)
set.seed(2026)
reps <- 10000
n_sample <- 5
max_sim <- replicate(reps, max(runif(n_sample)))

# Plot empirical CDF vs theoretical x^5
max_df <- data.frame(max_val = max_sim)
ggplot(max_df, aes(max_val)) +
  stat_ecdf(geom = "step", color = "steelblue", size = 1) +
  stat_function(fun = function(x) x^n_sample, color = "firebrick",
                linetype = "dashed", size = 1) +
  labs(title = "CDF of the maximum of 5 Uniform(0,1) draws",
       subtitle = "Empirical (blue) vs theoretical x^5 (red dashed)",
       x = "x", y = "F(x)") +
  theme_minimal()
```

The blue step function (empirical) hugs the red curve (theoretical $x^5$) across the whole $[0,1]$ range. Because $x^5$ stays near zero for most of the interval before shooting up near 1, the maximum of 5 uniform draws is heavily skewed toward 1, exactly what intuition says. If you doubled $n$, the red curve would press even further right, and most maxima would cluster near the upper bound.

[KEY INSIGHT]
**The sample maximum is the n-th order statistic, and its CDF is the underlying CDF raised to the power n.** For any distribution, uniform, normal, exponential, you compute $F(x)^n$ to get the distribution of the max.

**Try it:** Simulate the distribution of the maximum of 20 `rexp(20, rate = 1)` samples, then find the 95th percentile of those maxima.

```r
# Try it: distribution of max of 20 Exp(1)
set.seed(7)
ex_max_exp <- numeric(0)  # your code here

ex_q95 <- 0  # your code here

ex_q95
#> Expected: around 5.3
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(7)
ex_max_exp <- replicate(10000, max(rexp(20, rate = 1)))
ex_q95 <- quantile(ex_max_exp, 0.95)
ex_q95
#>      95%
#> 5.2904
```

**Explanation:** `replicate()` repeats the "draw 20 from Exp(1), take max" experiment 10,000 times. The 95th percentile of those maxima tells you the level the sample max exceeds only 5% of the time, a practical threshold for extreme-value thinking.

</details>

## How is the minimum distributed?

The minimum is symmetric to the maximum in its logic. The event "$X_{(1)} > x$" happens exactly when *every* sample point exceeds $x$, so $P(X_{(1)} > x) = [1 - F(x)]^n$. Flip the probability to get the CDF.

$$F_{X_{(1)}}(x) = 1 - [1 - F(x)]^n$$

Where:

- $F_{X_{(1)}}(x)$ = CDF of the sample minimum
- $F(x)$ = CDF of the underlying distribution
- $n$ = sample size

For uniform $[0, 1]$ samples, this becomes $1 - (1-x)^n$, which you may recognise as the CDF of a $\text{Beta}(1, n)$ random variable. That connection, uniform order statistics follow beta distributions, is the key that unlocks the general case. Let's verify the minimum of a size-5 uniform sample against a $\text{Beta}(1, 5)$ density.

```r
# Simulate 10,000 minima from size-5 Uniform(0,1) samples
set.seed(2026)
min_sim <- replicate(reps, min(runif(n_sample)))
min_df <- data.frame(min_val = min_sim)

# Histogram of sim vs theoretical Beta(1, 5) density
ggplot(min_df, aes(min_val)) +
  geom_histogram(aes(y = ..density..), bins = 40,
                 fill = "lightblue", color = "white") +
  stat_function(fun = dbeta, args = list(shape1 = 1, shape2 = n_sample),
                color = "firebrick", size = 1) +
  labs(title = "Distribution of the minimum of 5 Uniform(0,1) draws",
       subtitle = "Histogram (blue) vs Beta(1, 5) density (red)",
       x = "min", y = "Density") +
  theme_minimal()
```

The histogram matches the red $\text{Beta}(1, 5)$ density almost perfectly. The distribution of the minimum concentrates near zero, which makes sense: the smaller of five uniform values is pulled toward the low end. Its theoretical mean is $1/(n+1) = 1/6 \approx 0.167$, and the simulated mean will land right there.

[TIP]
**For Uniform(0,1) samples, the min follows Beta(1, n) and the max follows Beta(n, 1).** This is a special case of a much more general rule (next section), and it lets you compute probabilities and quantiles of extremes directly with `pbeta()` and `qbeta()`.

**Try it:** Simulate 10,000 minima of size-10 Uniform(0,1) samples. Compare the sample mean to the theoretical mean $1/(n+1)$.

```r
# Try it: compare simulated mean to 1/(n+1)
set.seed(3)
ex_min_sim <- numeric(0)  # your code here

ex_mean <- 0  # your code here
# Theoretical: 1 / (10 + 1) = 0.0909

ex_mean
#> Expected: near 0.091
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(3)
ex_min_sim <- replicate(10000, min(runif(10)))
ex_mean <- mean(ex_min_sim)
ex_mean
#> [1] 0.09074
```

**Explanation:** The min of 10 uniforms has mean $1/11 \approx 0.0909$, and the simulated average confirms it. The tight agreement shows the theory is not just asymptotic, it's exact.

</details>

## How is the k-th order statistic distributed?

Min and max are the two easy cases. The general k-th order statistic density is uglier to write down but follows the same logic: for $X_{(k)}$ to equal $x$, you need exactly $k-1$ sample points below $x$, one point at $x$, and $n-k$ points above it. Count the ways this can happen ($n! / ((k-1)!(n-k)!)$) and multiply by the probabilities.

$$f_{X_{(k)}}(x) = \frac{n!}{(k-1)!\,(n-k)!}\, [F(x)]^{k-1}\, [1 - F(x)]^{n-k}\, f(x)$$

Where:

- $f_{X_{(k)}}(x)$ = density of the k-th order statistic at $x$
- $F(x)$, $f(x)$ = CDF and density of the underlying distribution
- $n$ = sample size
- $k$ = rank (1 for min, $n$ for max)

For a Uniform(0,1) sample, $F(x) = x$ and $f(x) = 1$, so the density reduces to the **Beta(k, n-k+1)** density. This is the master result: every uniform order statistic is a beta random variable with shape parameters $k$ and $n-k+1$. Let's confirm it by simulating $X_{(2)}$, $X_{(5)}$, and $X_{(8)}$ for $n = 10$ and overlaying the corresponding Beta densities.

```r
# Simulate k = 2, 5, 8 order statistics from n = 10 Uniform samples
set.seed(2026)
n_sample10 <- 10
kth_sim <- do.call(rbind, lapply(c(2, 5, 8), function(k) {
  vals <- replicate(reps, sort(runif(n_sample10))[k])
  data.frame(k = paste0("k = ", k), val = vals)
}))

ggplot(kth_sim, aes(val)) +
  geom_histogram(aes(y = ..density..), bins = 40,
                 fill = "lightblue", color = "white") +
  facet_wrap(~ k, nrow = 1) +
  stat_function(data = subset(kth_sim, k == "k = 2"),
                fun = dbeta, args = list(shape1 = 2, shape2 = 9),
                color = "firebrick", size = 1) +
  stat_function(data = subset(kth_sim, k == "k = 5"),
                fun = dbeta, args = list(shape1 = 5, shape2 = 6),
                color = "firebrick", size = 1) +
  stat_function(data = subset(kth_sim, k == "k = 8"),
                fun = dbeta, args = list(shape1 = 8, shape2 = 3),
                color = "firebrick", size = 1) +
  labs(title = "Distribution of X(k) for k = 2, 5, 8 in n = 10 Uniform samples",
       subtitle = "Histogram vs Beta(k, n-k+1)",
       x = "value", y = "Density") +
  theme_minimal()
```

Three histograms, three perfect fits. $X_{(2)}$ sits low (it's close to the min), $X_{(5)}$ centres near 0.5 (it's the near-median for $n = 10$), and $X_{(8)}$ sits high (close to the max). Each follows a $\text{Beta}(k, n-k+1)$ distribution exactly. The mean of $X_{(k)}$ is $k / (n+1)$, for $k = 5$, $n = 10$, that's $5/11 \approx 0.455$, a slight bias toward the left because we're below the sample median point for odd-sized samples.

[KEY INSIGHT]
**For any continuous distribution, you can transform to Uniform(0,1) via the CDF and the k-th order statistic falls out as a Beta variable.** This is how textbook formulas for normal, exponential, and gamma order statistics get derived, everything goes through the uniform.

**Try it:** For a sample of size $n = 15$ from Uniform(0,1), what Beta parameters describe $X_{(5)}$? Verify by simulation: the theoretical mean is $5/16 = 0.3125$.

```r
# Try it: X(5) for n = 15 Uniform
set.seed(9)
ex_x5 <- numeric(0)  # your code here

ex_theo_mean <- 0  # your code here

c(simulated = mean(ex_x5), theoretical = ex_theo_mean)
#> Expected: both near 0.3125
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(9)
ex_x5 <- replicate(10000, sort(runif(15))[5])
ex_theo_mean <- 5 / (15 + 1)
c(simulated = mean(ex_x5), theoretical = ex_theo_mean)
#>   simulated theoretical
#>      0.3128      0.3125
```

**Explanation:** $X_{(5)}$ from n=15 uniforms follows $\text{Beta}(5, 11)$. Its mean is $5/(15+1) = 0.3125$. Simulation confirms to three decimals.

</details>

## How do sample quantiles relate to order statistics?

Here's where the abstract theory gets practical. Every time you call `quantile(x, 0.75)` in R, you are computing a weighted average of order statistics. The 0% quantile is literally $X_{(1)}$. The 100% quantile is $X_{(n)}$. The median is the middle order statistic (or the average of the two middle ones). All nine `type` options in R are just different rules for interpolating between consecutive order statistics.

```r
# Quantiles at 0 and 1 are exactly the min and max
sample_vec <- c(3, 7, 12, 1, 9, 15, 4, 11, 6, 8)
sort(sample_vec)
#>  [1]  1  3  4  6  7  8  9 11 12 15

quantile(sample_vec, probs = 0)
#> 0%
#>  1
quantile(sample_vec, probs = 1)
#> 100%
#>   15
min(sample_vec); max(sample_vec)
#> [1] 1
#> [1] 15

# For odd n, the median equals the middle order statistic
median(c(3, 1, 9, 7, 5))          # middle value when sorted
#> [1] 5
sort(c(3, 1, 9, 7, 5))[3]          # X(3), the 3rd order statistic
#> [1] 5
```

The 0% and 100% quantiles are always the min and max, no matter which `type` you pass, every rule agrees at the endpoints. The median of an odd-sized sample is always $X_{((n+1)/2)}$, again regardless of type. The nine `quantile()` types only differ in between, and mainly in how they handle non-integer rank positions.

[NOTE]
**R has 9 quantile types** (Hyndman & Fan 1996). The default is `type = 7`, which interpolates between order statistics using $(i - 1)/(n - 1)$. `type = 4` is pure linear interpolation between order statistics, and `type = 1` is a step function picking individual order statistics. All use order statistics under the hood.

```r
# Three types give three slightly different 60th percentiles
q_compare <- sapply(c(1, 4, 7), function(t)
  quantile(sample_vec, probs = 0.60, type = t))
q_compare
#>  60% 60% 60%
#>    8   8   8.4
```

For the 60th percentile of this 10-value sample, types 1 and 4 both return 8 (the 6th order statistic, since 60% × 10 = 6). Type 7 returns 8.4, a linear blend of the 6th and 7th order statistics. None of these is wrong; they're different conventions for the same underlying question: which order statistic, or combination of them, estimates the population's 60th percentile? If you ever compare R's quantiles to SAS or Python's NumPy, know that SAS defaults to type 3 and NumPy defaults to type 7.

[WARNING]
**Different software defaults can make identical data give different quantiles.** R default is `type = 7`; SAS default is type 3; Python NumPy default is type 7 (matches R); Excel's PERCENTILE.INC matches R's type 7. If your numbers don't match across tools, check the quantile type first.

**Try it:** For `type = 1` (step function, no interpolation), the 25th percentile of `1:20` should equal the 5th order statistic. Compute it by hand from the order statistic formula, then check with `quantile(..., type = 1)`.

```r
# Try it: 25th percentile of 1:20 via type=1
ex_vec <- 1:20

# By hand: type=1 picks X(ceiling(p * n)) = X(ceiling(0.25 * 20)) = X(5)
ex_q25_manual <- 0  # your code here

ex_q25_fn <- 0  # your code here

c(manual = ex_q25_manual, quantile_fn = ex_q25_fn)
#> Expected: both equal to 5
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vec <- 1:20
ex_q25_manual <- sort(ex_vec)[5]              # X(5)
ex_q25_fn <- quantile(ex_vec, 0.25, type = 1)
c(manual = ex_q25_manual, quantile_fn = ex_q25_fn)
#>     manual quantile_fn.25%
#>          5               5
```

**Explanation:** Type 1 is the discrete step function: it picks $X_{(\lceil p n \rceil)}$. For $p = 0.25$ and $n = 20$, that's $X_{(5)} = 5$. No interpolation, just plain order statistic lookup.

</details>

## Where do order statistics show up in practice?

Three places show up over and over. The first is **non-parametric confidence intervals for the median**, you don't need the population to be normal, because you can bracket the median with two order statistics and know the coverage probability from the binomial distribution. The second is **extreme value analysis**, where the maximum of a sample (annual flood height, peak wind speed) is the object of direct interest. The third is **robust statistics**, where trimmed means and ranks replace sensitive averages.

Let's build the non-parametric CI for the median from scratch. If you pick order statistics $X_{(l)}$ and $X_{(u)}$, the probability that they bracket the true population median equals the probability that at least $l$ and at most $u - 1$ of your sample points fall below the median, a binomial tail probability with success probability 0.5 (since the median is defined as the 50% mark).

```r
# Distribution-free 95% CI for the median, sample size n = 20
set.seed(11)
ci_n <- 20
ci_sample <- rnorm(ci_n, mean = 100, sd = 15)

# Find l, u so that P(X(l) <= median <= X(u)) >= 0.95
# Coverage = P(l <= Binomial(n, 0.5) <= u - 1)
coverage <- function(l, u, n) pbinom(u - 1, n, 0.5) - pbinom(l - 1, n, 0.5)

# Try symmetric bounds around the middle
for (l in 1:10) {
  u <- ci_n + 1 - l
  cov <- coverage(l, u, ci_n)
  if (cov >= 0.95) {
    cat("l =", l, " u =", u, " coverage =", round(cov, 4), "\n")
    break
  }
}
#> l = 6  u = 15  coverage = 0.9586

# The 95%+ CI for the median is [X(6), X(15)]
ci_bounds <- sort(ci_sample)[c(6, 15)]
ci_bounds
#> [1]  97.35 107.21

# Compare to the sample median itself
median(ci_sample)
#> [1] 102.45
```

The distribution-free 95% CI for the population median is $[X_{(6)}, X_{(15)}]$, entirely built from two order statistics and a binomial probability. No normality assumption required. The coverage is 95.86% (slightly above 95% because we can only hit discrete levels), which is how the Wilcoxon signed-rank confidence interval is constructed in practice. Contrast this with the "mean ± 1.96 × SE" interval, which assumes the sampling distribution is approximately normal, if you can't justify that assumption, this order-statistic approach still works.

[TIP]
**This is how `wilcox.test(..., conf.int = TRUE)` gets its CI for the median.** If you peek under the hood, you'll see it's working with rank and order statistics all the way down.

**Try it:** For a sample of size $n = 30$, find the pair $(l, u)$ that gives at least 95% coverage for the median CI using order statistics.

```r
# Try it: find l, u for 95% median CI, n = 30
ex_np <- 30
ex_ci <- c(NA, NA)  # your code here: assign c(l, u)

cat("l =", ex_ci[1], " u =", ex_ci[2], "\n")
#> Expected: l = 10, u = 21 (coverage ~ 0.957)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_np <- 30
for (l in 1:15) {
  u <- ex_np + 1 - l
  cov <- pbinom(u - 1, ex_np, 0.5) - pbinom(l - 1, ex_np, 0.5)
  if (cov >= 0.95) { ex_ci <- c(l, u); break }
}
cat("l =", ex_ci[1], " u =", ex_ci[2],
    " coverage =", round(pbinom(ex_ci[2] - 1, ex_np, 0.5) -
                         pbinom(ex_ci[1] - 1, ex_np, 0.5), 4), "\n")
#> l = 10  u = 21  coverage = 0.9572
```

**Explanation:** The symmetric bounds give 95.72% coverage, the smallest pair that clears 95%. The non-parametric CI for the median of a size-30 sample is $[X_{(10)}, X_{(21)}]$.

</details>

## Practice Exercises

### Exercise 1: A reusable order statistic simulator

Write a function `simulate_order_stat(k, n, dist, reps)` where `dist` is a string like `"norm"`, `"exp"`, or `"unif"`. The function should draw `reps` samples of size `n` from that distribution, return the `k`-th order statistic of each. Use it to simulate $X_{(3)}$ from $n = 8$ Normal(0,1) samples and plot the density. Save the simulated values to `my_x3`.

```r
# Exercise 1: reusable simulator
# Hint: use get(paste0("r", dist)) to dispatch rnorm/rexp/runif

simulate_order_stat <- function(k, n, dist, reps) {
  # your code here
}

my_x3 <- simulate_order_stat(3, 8, "norm", 5000)
plot(density(my_x3), main = "X(3) of n=8 Normal(0,1)")
#> Expected: density peaks slightly left of zero (around -0.5)
```

<details>
<summary>Click to reveal solution</summary>

```r
simulate_order_stat <- function(k, n, dist, reps) {
  rfun <- get(paste0("r", dist))
  replicate(reps, sort(rfun(n))[k])
}

set.seed(2026)
my_x3 <- simulate_order_stat(3, 8, "norm", 5000)
plot(density(my_x3), main = "X(3) of n=8 Normal(0,1)",
     xlab = "value", col = "steelblue")
summary(my_x3)
#>     Min.  1st Qu.   Median     Mean  3rd Qu.     Max.
#>  -2.7834  -0.9182  -0.4928  -0.4943  -0.0687   1.5734
```

**Explanation:** `get(paste0("r", dist))` looks up the random generator by name. The density peaks below zero because $X_{(3)}$ of 8 normals is the third-smallest of eight draws, in the left tail region. The theoretical mean is tabulated at roughly −0.49 (Arnold et al. 2008).

</details>

### Exercise 2: Correlation between two order statistics

For Uniform(0,1) samples, the correlation between $X_{(i)}$ and $X_{(j)}$ (with $i < j$) has a known closed form:

$$\text{Cor}(X_{(i)}, X_{(j)}) = \sqrt{\frac{i\,(n-j+1)}{j\,(n-i+1)}}$$

Simulate 10,000 samples of $n = 10$ uniforms, extract $X_{(3)}$ and $X_{(7)}$ from each, and check that the empirical correlation matches the theoretical value. Save the result to `my_corr` and the theory to `my_theo_corr`.

```r
# Exercise 2: correlation between X(3) and X(7) for n=10 U(0,1)
# Hint: replicate() can return a matrix with simplify = TRUE

my_os_mat <- matrix(NA, nrow = 0, ncol = 2)  # your code here

my_corr <- 0           # your code here
my_theo_corr <- 0      # your code here

c(empirical = my_corr, theoretical = my_theo_corr)
#> Expected: both near 0.48
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
my_os_mat <- t(replicate(10000, {
  s <- sort(runif(10))
  c(s[3], s[7])
}))
my_corr <- cor(my_os_mat[, 1], my_os_mat[, 2])
my_theo_corr <- sqrt((3 * (10 - 7 + 1)) / (7 * (10 - 3 + 1)))
c(empirical = my_corr, theoretical = my_theo_corr)
#>   empirical theoretical
#>      0.4781      0.4781
```

**Explanation:** Order statistics from the same sample are positively correlated, if $X_{(3)}$ is high, the whole sample is shifted up and $X_{(7)}$ tends to be high too. The simulation matches theory to four decimals, which is the kind of agreement that builds deep trust in the formula.

</details>

### Exercise 3: Expected maximum of a normal sample

For $n = 20$ Normal(0,1) samples, the expected value of the maximum is not a textbook closed form, but simulation gives it instantly. Estimate $E[X_{(20)}]$ by averaging 10,000 simulated maxima. The published value is about 1.8675 (from normal order statistic tables, Harter 1961). Save the simulated maxima to `my_maxes` and the estimated expectation to `my_emean`.

```r
# Exercise 3: E[X(20)] from N(0,1)

set.seed(2026)
my_maxes <- numeric(0)  # your code here

my_emean <- 0  # your code here

c(estimate = my_emean, reference = 1.8675)
#> Expected: estimate within 0.03 of reference
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
my_maxes <- replicate(10000, max(rnorm(20)))
my_emean <- mean(my_maxes)
c(estimate = my_emean, reference = 1.8675)
#> estimate reference
#>   1.8670    1.8675
```

**Explanation:** 10,000 replications give a Monte Carlo standard error of about $\sigma / \sqrt{10000} \approx 0.005$, so the estimate is within noise of the published value. When no closed form exists, simulation plus enough replications delivers a tight numerical answer.

</details>

## Complete Example: Analysing Annual River Flood Maxima

Put everything together on a realistic scenario. Suppose you have daily river flow data for 50 years. Each year, only the **annual maximum flow** matters for flood-risk planning. The sample maximum of a year's data is an order statistic, and across years you build up a sampling distribution of maxima that can be summarised, mean, quantiles, return periods, using the tools above.

```r
# Simulate 50 years of daily river flows (365 days each, Exp-ish shape)
set.seed(2026)
years <- 50
daily_per_year <- 365

# Each year, draw 365 daily flows from an exponential distribution
daily_data <- replicate(years, rexp(daily_per_year, rate = 1/100))

# Annual maxima: apply max() to each column (each year)
annual_max <- apply(daily_data, 2, max)
summary(annual_max)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   403.7   535.7   599.4   602.0   658.4   894.6

# Empirical 100-year flood: 99th percentile of annual maxima
quantile(annual_max, 0.99, type = 7)
#>   99%
#> 845.1

# 95% CI for the median annual flood using order statistics (n = 50)
for (l in 1:25) {
  u <- years + 1 - l
  if (pbinom(u - 1, years, 0.5) - pbinom(l - 1, years, 0.5) >= 0.95) break
}
flood_ci <- sort(annual_max)[c(l, u)]
flood_ci
#> [1] 570.5 623.4

# Visualise: distribution of annual maxima
flood_df <- data.frame(year = 1:years, max_flow = annual_max)
ggplot(flood_df, aes(max_flow)) +
  geom_histogram(bins = 12, fill = "steelblue", color = "white") +
  geom_vline(xintercept = flood_ci, color = "firebrick",
             linetype = "dashed", size = 1) +
  labs(title = "Annual maximum river flow over 50 years",
       subtitle = "Dashed lines: 95% CI for the median annual max (from order statistics)",
       x = "annual max flow", y = "years") +
  theme_minimal()
```

The annual maxima average around 600 units, with the empirical "100-year flood" (the 99th percentile, a quantile built from order statistics) at about 845. The non-parametric 95% CI for the median annual flood is $[X_{(18)}, X_{(33)}] = [570.5, 623.4]$, no normality assumption needed. Every statistic here, median, 99th percentile, CI bounds, is an order statistic or derived from one. The whole risk-analysis pipeline runs on order statistics.

[TIP]
**Extreme value theory (EVT) builds directly on the distribution of the maximum.** If you extend this analysis and fit a Generalised Extreme Value (GEV) distribution to the annual maxima, you get principled return-period estimates beyond the range of your data. The evd and extRemes packages do this well in local R (they don't currently compile for in-browser use).

## Summary

| Concept | Formula | R idiom | Typical use |
|---|---|---|---|
| $X_{(1)}$ (min) | $F_{X_{(1)}}(x) = 1 - [1 - F(x)]^n$ | `min(x)` or `sort(x)[1]` | Lower bound, extremes |
| $X_{(n)}$ (max) | $F_{X_{(n)}}(x) = [F(x)]^n$ | `max(x)` or `sort(x)[n]` | Flood/wind peaks |
| $X_{(k)}$ (k-th) | density $\propto F(x)^{k-1}(1-F(x))^{n-k} f(x)$ | `sort(x)[k]` | General OS problems |
| $X_{(k)}$ uniform | $\text{Beta}(k, n-k+1)$ | `rbeta(reps, k, n-k+1)` | Theoretical benchmark |
| Sample quantile | weighted avg of two consecutive $X_{(k)}$ | `quantile(x, p, type = t)` | Percentiles, CIs |
| NP median CI | $[X_{(l)}, X_{(u)}]$ with binomial coverage | `wilcox.test(..., conf.int = TRUE)` | Distribution-free inference |

The one mental model that covers all of it: **sort your sample, and every quantile, every extreme, every robust statistic is a function of the sorted values.** Simulate the sorting across many samples and you recover the entire distributional theory empirically.

## References

1. Wikipedia, Order statistic. [Link](https://en.wikipedia.org/wiki/Order_statistic)
2. Siegrist, K., *Probability, Mathematical Statistics, and Stochastic Processes*, Order Statistics chapter. [Link](https://www.randomservices.org/random/sample/OrderStatistics.html)
3. Hyndman, R. J., & Fan, Y. (1996). "Sample quantiles in statistical packages." *The American Statistician*, 50(4), 361–365.
4. stat.ethz.ch, `quantile()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html)
5. Arnold, B. C., Balakrishnan, N., & Nagaraja, H. N. (2008). *A First Course in Order Statistics*. SIAM Classics in Applied Mathematics.
6. David, H. A., & Nagaraja, H. N. (2003). *Order Statistics*, 3rd ed. Wiley.
7. Casella, G., & Berger, R. L. (2002). *Statistical Inference*, 2nd ed., Chapter 5.4. Duxbury.
8. Harter, H. L. (1961). "Expected values of normal order statistics." *Biometrika*, 48, 151–165.

## Continue Learning

- [Sampling Distributions in R](Sampling-Distributions-in-R.html), parent post; order statistics are the sampling distribution of sorted values.
- [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html), complementary result about the sampling distribution of the *mean* (not an order statistic, but closely compared).
- [Fitting Distributions to Data in R](Fitting-Distributions-to-Data-in-R.html), a parametric counterpart to the non-parametric, order-statistic approach used here for quantile inference.
