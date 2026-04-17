---
title: "Central Limit Theorem in R: Simulate It From Skewed, Bimodal, and Uniform Distributions"
slug: Central-Limit-Theorem-in-R
description: "Simulate the Central Limit Theorem in R: draw sample means from skewed, bimodal, and uniform distributions and watch the normal shape emerge as n grows."
keywords: "central limit theorem in R, CLT simulation R, sampling distribution of the mean, simulate CLT, exponential distribution mean, bimodal CLT, Q-Q plot normality, Shapiro-Wilk test, standard error formula, Cauchy CLT fails"
auto_link_terms: "Central Limit Theorem|CLT|sampling distribution of the mean|sample mean distribution|standard error of the mean|normal approximation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: "2.1.8"
post_type: C
sidebar_section: Statistics
sidebar_title: Central Limit Theorem
sidebar_order: 22
difficulty: Intermediate
---

# Central Limit Theorem in R: Simulate It From Skewed, Bimodal, and Uniform Distributions

<p class="lead">The <strong>Central Limit Theorem (CLT)</strong> says the distribution of sample means approaches a normal distribution as the sample size grows, no matter what the parent distribution looks like. This post uses R simulations to show the CLT at work on skewed, bimodal, and uniform populations, so you can watch normality emerge with your own eyes.</p>

## How does the Central Limit Theorem work in R?

Here's the claim the CLT makes, and why it feels strange the first time: if you repeatedly draw small samples from any population and average each sample, those averages start to form a bell curve, even when the population itself looks nothing like a bell. The fastest way to believe this is to watch it happen. Let's draw 1,000 sample means from a heavily right-skewed exponential distribution and plot them.

```r title="Exponential sample means form a bell"
library(ggplot2)
set.seed(42)

# Draw 1,000 sample means of size n = 30 from Exponential(rate = 1)
exp_means30 <- replicate(1000, mean(rexp(30, rate = 1)))

ggplot(data.frame(m = exp_means30), aes(m)) +
  geom_histogram(aes(y = after_stat(density)),
                 bins = 30, fill = "steelblue", alpha = 0.75) +
  stat_function(fun = dnorm,
                args = list(mean = 1, sd = 1 / sqrt(30)),
                color = "red", linewidth = 1) +
  labs(title = "Sample means look normal — even from a skewed parent",
       x = "Sample mean", y = "Density")
#> Plot: a tight bell curve centered near 1.0 with the red normal density on top.
```

The histogram is a textbook bell curve centered close to 1. The red line is the normal density the CLT predicts: mean 1, standard deviation $1/\sqrt{30} \approx 0.183$. The original exponential was strongly right-skewed, yet its *means* are nearly symmetric. That is the whole magic trick of the CLT, in one plot.

![The five-step recipe any CLT simulation follows](screenshots/Central-Limit-Theorem-in-R-simulation-flow.webp)
*Figure 1: The five-step recipe any CLT simulation follows, draw, average, repeat, plot.*

To appreciate what just happened, compare the parent population to what came out. Here is the exponential itself, 10,000 raw draws, no averaging.

```r title="Parent exponential is heavily right-skewed"
set.seed(1)
exp_parent <- rexp(10000, rate = 1)

ggplot(data.frame(x = exp_parent), aes(x)) +
  geom_histogram(bins = 50, fill = "tomato", alpha = 0.75) +
  labs(title = "Parent distribution: Exponential(rate = 1) — heavily right-skewed",
       x = "Value", y = "Count")
#> Plot: a sharp spike near zero that tails off to the right — clearly non-normal.
```

Side by side, the transformation is obvious. The parent has a long right tail and a hard edge at zero. After averaging samples of size 30, the skew is gone and the result looks normal. The parent's shape stopped mattering once we started averaging.

[KEY INSIGHT]
**The CLT is about the sampling distribution of the mean, not the raw data.** Your data can be wildly non-normal and the CLT still guarantees near-normality for the *means* you compute from it, that's why so many everyday statistical tools (t-tests, confidence intervals, regression) still work on messy data.

Formally, if $X_1, X_2, \ldots, X_n$ are independent draws from a distribution with mean $\mu$ and finite variance $\sigma^2$, then as $n$ grows:

$$\bar{X}_n \;\sim\; \mathcal{N}\!\left(\mu,\; \frac{\sigma^2}{n}\right)$$

Where:

- $\bar{X}_n$ = the mean of a sample of size $n$
- $\mu$ = the population mean
- $\sigma^2$ = the population variance
- $\sigma / \sqrt{n}$ = the **standard error**, how tightly the sample means cluster around $\mu$

The standard error shrinks with $\sqrt{n}$, which is why doubling your sample size doesn't halve uncertainty, you need four times the sample to cut the standard error in half.

**Try it:** Change the exponential rate from 1 to 0.5 and predict the mean and standard error of the resulting sample means at n = 30. Hint: for `Exponential(rate = r)`, $\mu = 1/r$ and $\sigma = 1/r$.

```r title="Exercise: Sample means at rate 0.5"
# Try it: sample means from a rate-0.5 exponential
ex_rate_means <- replicate(1000, mean(rexp(30, rate = 0.5)))

# Your job — predict these two numbers, then run:
# mean(ex_rate_means)
# sd(ex_rate_means)

#> Expected: mean(ex_rate_means) near 2
#> Expected: sd(ex_rate_means)  near 2 / sqrt(30) ~ 0.365
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sample means at rate 0.5 solution"
mean(ex_rate_means)
#> [1] 2.003
sd(ex_rate_means)
#> [1] 0.368
```

**Explanation:** Exponential(rate = 0.5) has population mean and sd both equal to $1 / 0.5 = 2$. The CLT predicts sample means at n = 30 have mean 2 and standard error $2/\sqrt{30} \approx 0.365$. The simulation matches.

</details>

## How does sample size change CLT convergence?

Sample size is the dial that controls how close the sampling distribution gets to normal. Small $n$ means lumpy, skewed histograms. Large $n$ means a tight, symmetric bell. Rather than eyeball three separate plots, let's build a small helper function and then run the experiment across three sample sizes at once.

```r title="simulatemeans helper for repeated sampling"
# Helper: simulate k sample means of size n from an R random-number function
simulate_means <- function(rdist, n, k = 1000) {
  replicate(k, mean(rdist(n)))
}

# Quick sanity check — recompute what we saw in Block 1
check <- simulate_means(function(n) rexp(n, rate = 1), n = 30, k = 1000)
c(mean_of_means = mean(check), se_of_means = sd(check), predicted_se = 1 / sqrt(30))
#>  mean_of_means    se_of_means   predicted_se
#>       0.99982        0.18134        0.18257
```

The mean of means lands on 1.0 (the population mean) and the observed spread lands on 0.181, within 1% of the theoretical $1/\sqrt{30} = 0.183$. That's the CLT formula working in practice, not just on paper. Having `simulate_means()` means we can now run the same experiment across any distribution with one line.

[TIP]
**Use replicate() instead of a for-loop for repeated sampling.** `replicate(k, expr)` evaluates `expr` k times and collects the results into a vector, no manual indexing required. It's faster to write, faster to read, and vectorized under the hood.

Now compare three sample sizes on the same exponential. We stack them into a data frame and use `facet_wrap()` so the three histograms share axes.

```r title="Three sample sizes side by side"
set.seed(7)
df_exp <- rbind(
  data.frame(n = "n = 5",   m = simulate_means(function(n) rexp(n, 1), 5)),
  data.frame(n = "n = 30",  m = simulate_means(function(n) rexp(n, 1), 30)),
  data.frame(n = "n = 100", m = simulate_means(function(n) rexp(n, 1), 100))
)
df_exp$n <- factor(df_exp$n, levels = c("n = 5", "n = 30", "n = 100"))

ggplot(df_exp, aes(m)) +
  geom_histogram(bins = 30, fill = "steelblue", alpha = 0.75) +
  facet_wrap(~ n, scales = "free_y") +
  labs(title = "Exponential sample means at three sample sizes",
       x = "Sample mean", y = "Count")
#> Plot: left panel (n=5) is right-skewed; middle (n=30) is near-normal; right (n=100) is a tight symmetric bell.
```

At $n = 5$ the sampling distribution still leans right, you can see the tail. At $n = 30$ it's noticeably symmetric. At $n = 100$ it's a crisp bell. This matches the standard error shrinking from $1/\sqrt{5} = 0.447$ to $1/\sqrt{100} = 0.1$. The lesson: there is no single "magic" $n$, how fast you converge depends on how skewed the parent is.

[NOTE]
**The "n ≥ 30" rule of thumb has nuance.** It's a rough guide for moderately skewed data. Strongly skewed parents (like Exponential or Lognormal) may need n = 50 or 100 for a convincing bell. Nearly symmetric parents pass at n = 5–10. When in doubt, simulate.

**Try it:** Simulate 1,000 sample means of size n = 50 from Exponential(rate = 1) and verify that the standard error is close to $1/\sqrt{50}$.

```r title="Exercise: Standard error at n = 50"
# Try it: SE at n = 50
ex_n50 <- simulate_means(function(n) rexp(n, 1), 50)

# Your job — compute:
# sd(ex_n50)
# and compare to 1 / sqrt(50)

#> Expected: sd(ex_n50) close to 0.141
```

<details>
<summary>Click to reveal solution</summary>

```r title="Standard error at n = 50 solution"
sd(ex_n50)
#> [1] 0.1407
1 / sqrt(50)
#> [1] 0.1414
```

**Explanation:** The simulated standard error (0.141) is within 1% of the theoretical $1/\sqrt{50} = 0.141$. Each time you quadruple $n$, the standard error is roughly halved, the $\sqrt{n}$ law.

</details>

## Does the CLT work for uniform and bimodal distributions?

Skewed data was the dramatic case. Two other shapes test the theorem from opposite ends: a **uniform** distribution (symmetric, bounded, no tails) and a **bimodal** mixture (two separate humps). Uniform parents converge fastest because they are already symmetric. Bimodal parents are the most visually interesting because averaging literally fuses the two peaks into one.

```r title="Uniform sample means converge quickly"
# Uniform(0, 1): symmetric, already gentle on the CLT
set.seed(11)
u_means5  <- simulate_means(function(n) runif(n, 0, 1), 5)
u_means30 <- simulate_means(function(n) runif(n, 0, 1), 30)

df_u <- rbind(
  data.frame(n = "n = 5",  m = u_means5),
  data.frame(n = "n = 30", m = u_means30)
)

ggplot(df_u, aes(m)) +
  geom_histogram(bins = 30, fill = "seagreen", alpha = 0.75) +
  facet_wrap(~ n) +
  labs(title = "Uniform(0,1) sample means converge fast",
       x = "Sample mean", y = "Count")
#> Plot: n=5 is already roughly triangular; n=30 is a tight symmetric bell.
```

Even at $n = 5$ the uniform means are approximately bell-shaped (technically a triangular distribution, which is close enough that your eye barely notices). By $n = 30$ they're indistinguishable from normal. Symmetric parents are the easy case for the CLT.

Bimodal is more striking. Let's build a population that draws from one of two normal components 50/50, a visibly double-humped shape, and then compute sample means.

```r title="Bimodal parent versus sample means"
# Bimodal: 50/50 mixture of N(-2, 0.5) and N(2, 0.5)
set.seed(21)
rbimodal <- function(n) {
  ifelse(runif(n) < 0.5, rnorm(n, -2, 0.5), rnorm(n, 2, 0.5))
}

bimodal_draw <- rbimodal(10000)
b_means30    <- simulate_means(rbimodal, 30)

df_b <- rbind(
  data.frame(panel = "Parent (bimodal)",     x = bimodal_draw),
  data.frame(panel = "Sample means (n=30)",  x = b_means30)
)

ggplot(df_b, aes(x)) +
  geom_histogram(bins = 50, fill = "purple", alpha = 0.7) +
  facet_wrap(~ panel, scales = "free") +
  labs(title = "Bimodal parent, unimodal sampling distribution",
       x = "Value", y = "Count")
#> Plot: left panel shows two separate humps near -2 and +2; right panel shows a single bell near 0.
```

The parent has two obvious modes near $-2$ and $+2$. The sampling distribution of the mean has one mode near $0$. Why? Most samples of size 30 pull roughly half their points from each hump, and the average of those pulls lands near zero. The two modes are *smoothed out by averaging*, which is exactly what the CLT predicts should happen.

[WARNING]
**The CLT governs means, not counts or sums of rare events.** For proportions, approximations like "np and n(1-p) both at least 10" use the CLT but have extra conditions. For rare counts (small λ Poisson), the normal approximation is poor, use the actual distribution instead.

**Try it:** Simulate 1,000 sample means of size n = 20 from `Uniform(-1, 1)` and confirm the mean of means is close to 0.

```r title="Exercise: Symmetric uniform around zero"
# Try it: symmetric uniform around zero
ex_uni_sym <- simulate_means(function(n) runif(n, -1, 1), 20)

# Your job — compute:
# mean(ex_uni_sym)
# sd(ex_uni_sym)

#> Expected: mean(ex_uni_sym) near 0
#> Expected: sd(ex_uni_sym) near sqrt(1/3) / sqrt(20) ~ 0.129
```

<details>
<summary>Click to reveal solution</summary>

```r title="Symmetric uniform around zero solution"
mean(ex_uni_sym)
#> [1] 0.0018
sd(ex_uni_sym)
#> [1] 0.1288
```

**Explanation:** `Uniform(-1, 1)` has mean 0 and variance $1/3$, so standard deviation $\sqrt{1/3} \approx 0.577$. The CLT predicts sample means at n = 20 have SE $= 0.577 / \sqrt{20} \approx 0.129$, the simulation agrees.

</details>

## How do you confirm normality with Q-Q plots and Shapiro-Wilk?

Eyeballing histograms is a start. For a sharper diagnostic, statisticians use two tools: the **Q-Q plot** (visual) and the **Shapiro-Wilk test** (numeric). A Q-Q plot compares the quantiles of your data against the quantiles a normal distribution would have, points that fall on a straight line mean the data is normal. Shapiro-Wilk returns a p-value where a high p (typically > 0.05) means you cannot reject the hypothesis that the data is normal.

```r title="Q-Q plot for exponential means"
# Q-Q plot for the n = 30 exponential means
ggplot(data.frame(m = exp_means30), aes(sample = m)) +
  stat_qq(color = "steelblue") +
  stat_qq_line(color = "red") +
  labs(title = "Q-Q plot: exponential means at n = 30",
       x = "Theoretical normal quantiles", y = "Sample quantiles")
#> Plot: points hug the red line in the middle with tiny curvature in the upper tail.
```

The points hug the reference line across the bulk of the distribution. A slight curl in the upper-right corner is the last ghost of the exponential's skew, there is still a hint of a heavier right tail at $n = 30$. At $n = 100$ even this curl would disappear.

Now the numeric test. We run Shapiro-Wilk across three sample sizes to see the p-value change.

```r title="Shapiro-Wilk across three sample sizes"
set.seed(99)
sw_results <- data.frame(
  n = c(5, 30, 100),
  p_value = c(
    shapiro.test(simulate_means(function(n) rexp(n, 1), 5))$p.value,
    shapiro.test(simulate_means(function(n) rexp(n, 1), 30))$p.value,
    shapiro.test(simulate_means(function(n) rexp(n, 1), 100))$p.value
  )
)
sw_results
#>     n   p_value
#> 1   5  2.1e-28
#> 2  30  4.6e-06
#> 3 100  0.0512
```

At $n = 5$ the p-value is essentially zero, the means are clearly non-normal. At $n = 30$ it's small but far from zero. At $n = 100$ it crosses the usual 0.05 threshold, you can no longer reject normality. Shapiro-Wilk puts a number on the progression our eyes saw earlier.

[TIP]
**Shapiro-Wilk becomes hyper-sensitive when k is large.** If you simulate 100,000 sample means, even a tiny departure from normal will produce a near-zero p-value. Always pair Shapiro with a Q-Q plot, the eye tolerates the practical fuzz the test does not.

**Try it:** Run Shapiro-Wilk on 1,000 uniform `U(0,1)` sample means at n = 5 and predict whether the p-value will be large or small.

```r title="Exercise: Shapiro on uniform n=5"
# Try it: Shapiro on uniform means at n=5
ex_sw_uni5 <- simulate_means(function(n) runif(n, 0, 1), 5)

# Your job:
# shapiro.test(ex_sw_uni5)

#> Expected: p-value fairly large (uniform is symmetric, converges fast)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro on uniform n=5 solution"
shapiro.test(ex_sw_uni5)
#> 
#>     Shapiro-Wilk normality test
#>
#> data:  ex_sw_uni5
#> W = 0.9978, p-value = 0.217
```

**Explanation:** The p-value (~0.2) is far above 0.05, so we fail to reject normality. This matches intuition: the uniform is symmetric and bounded, so even n = 5 already looks roughly bell-shaped.

</details>

## When does the Central Limit Theorem fail?

The CLT is powerful, but it has two requirements written in fine print: (1) the population must have a **finite variance**, and (2) the samples must be **independent**. Break either one and the theorem stops working. The textbook counter-example for the variance rule is the **Cauchy distribution**, it has infinite variance, and its sample means do not converge to normal at any $n$.

```r title="Cauchy refuses to converge"
# Cauchy: heavy-tailed, infinite variance — CLT fails
set.seed(33)
cauchy_means <- data.frame(
  n = rep(c("n = 30", "n = 1000"), each = 1000),
  m = c(
    simulate_means(function(n) rcauchy(n), 30),
    simulate_means(function(n) rcauchy(n), 1000)
  )
)

ggplot(cauchy_means, aes(m)) +
  geom_histogram(bins = 60, fill = "firebrick", alpha = 0.75) +
  facet_wrap(~ n, scales = "free") +
  labs(title = "Cauchy means do NOT converge — even at n = 1000",
       x = "Sample mean", y = "Count")
#> Plot: both panels show wild outliers stretching across orders of magnitude.
```

Both panels look terrible. The spread at $n = 1000$ is not meaningfully smaller than at $n = 30$. That's because the Cauchy distribution has no population mean or variance to converge to, the tails are heavy enough that a single extreme draw can dominate any sample. Increasing $n$ doesn't help.

[KEY INSIGHT]
**The CLT needs finite variance.** If your data has extreme tails (stock returns, network latencies, certain physics measurements), sample means may never stabilize, you need distribution-specific methods, robust statistics, or the bootstrap instead.

Independence is the second trap. Time-series data with strong autocorrelation breaks the CLT because consecutive observations carry shared information, your effective sample size is much smaller than the number of rows.

[WARNING]
**The CLT assumes independent samples.** Running CLT-based tests on autocorrelated time-series data will produce standard errors that look too small and confidence intervals that are too narrow. For dependent data, use block bootstraps, HAC standard errors, or time-series-specific models.

**Try it:** Compute the spread (standard deviation) of Cauchy sample means at n = 30 and n = 1000 and confirm that increasing n does NOT shrink it.

```r title="Exercise: Cauchy ignores 1/sqrt(n)"
# Try it: Cauchy does not obey the 1/sqrt(n) law
ex_c30   <- simulate_means(function(n) rcauchy(n), 30)
ex_c1000 <- simulate_means(function(n) rcauchy(n), 1000)

# Your job — compute:
# sd(ex_c30)
# sd(ex_c1000)

#> Expected: both values are huge and comparable (no shrinkage with n)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cauchy ignores 1/sqrt(n) solution"
sd(ex_c30)
#> [1] 34.7
sd(ex_c1000)
#> [1] 23.9
```

**Explanation:** Both standard deviations are enormous and of similar order. Compare to the exponential, where SE shrank from 0.18 (n=30) to 0.10 (n=100). For Cauchy, the $1/\sqrt{n}$ law doesn't apply because variance is undefined, a classic CLT-fails case.

</details>

## Practice Exercises

Three capstone exercises that combine multiple ideas from the post. The `simulate_means()` helper from earlier is still in scope, reuse it.

### Exercise 1: Compare how fast lognormal vs exponential means converge

Both Lognormal(0, 1) and Exponential(1) are right-skewed, but they skew differently. Draw 1,000 sample means of size n = 30 from each, run Shapiro-Wilk on both, and save the p-values to `my_lnorm` and `my_exp`. Which one converges to normal faster at n = 30?

```r title="Exercise: Exponential versus lognormal race"
# Exercise 1: convergence race
# Hint: simulate_means() accepts any R random-number function

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential versus lognormal race solution"
set.seed(55)
my_exp   <- shapiro.test(simulate_means(function(n) rexp(n, 1),      30))$p.value
my_lnorm <- shapiro.test(simulate_means(function(n) rlnorm(n, 0, 1), 30))$p.value
c(exp = my_exp, lnorm = my_lnorm)
#>       exp       lnorm
#>  4.52e-05   2.13e-31
```

**Explanation:** Exponential means are closer to normal at n = 30 than lognormal means. Lognormal has a heavier right tail, its skewness is about 6 versus 2 for the exponential, so convergence needs a bigger sample.

</details>

### Exercise 2: Write a function that finds the smallest n passing Shapiro-Wilk

Write `needed_n(rdist, threshold = 0.05)` that returns the smallest value from `c(5, 10, 20, 30, 50, 100)` whose simulated sample means at that size pass Shapiro-Wilk with `p > threshold`. If none pass, return `NA`. Test it on Uniform(0,1) and Exponential(1).

```r title="Exercise: Find smallest passing n"
# Exercise 2: convergence search
# Hint: loop through sizes, return the first pass

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Smallest passing n solution"
needed_n <- function(rdist, threshold = 0.05) {
  for (n in c(5, 10, 20, 30, 50, 100)) {
    m <- simulate_means(rdist, n, k = 1000)
    if (shapiro.test(m)$p.value > threshold) return(n)
  }
  NA
}

set.seed(77)
needed_n(function(n) runif(n, 0, 1))
#> [1] 5
needed_n(function(n) rexp(n, 1))
#> [1] 100
```

**Explanation:** Uniform passes at the smallest n tested (5) because it's already symmetric. Exponential doesn't pass until n = 100, the heavy skew takes work to smooth out. Simulation results carry randomness, so expect a slightly different answer if you change the seed.

</details>

### Exercise 3: Three-component mixture

Create a mixture population that draws equally from N(-3, 0.5), N(0, 0.5), and N(3, 0.5). Plot the parent (10,000 draws) and the sampling distribution of the mean at n = 30 side by side. Confirm the sampling distribution is unimodal and roughly normal.

```r title="Exercise: Three-hump mixture sample means"
# Exercise 3: three-hump mixture
# Hint: pick a component with sample(1:3, n, replace = TRUE) and rnorm from it

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-hump mixture solution"
set.seed(88)
rtri <- function(n) {
  comp <- sample(1:3, n, replace = TRUE)
  means <- c(-3, 0, 3)[comp]
  rnorm(n, mean = means, sd = 0.5)
}

tri_parent <- rtri(10000)
tri_means  <- simulate_means(rtri, 30)

df_tri <- rbind(
  data.frame(panel = "Parent (three humps)",  x = tri_parent),
  data.frame(panel = "Sample means (n = 30)", x = tri_means)
)

ggplot(df_tri, aes(x)) +
  geom_histogram(bins = 50, fill = "darkorange", alpha = 0.75) +
  facet_wrap(~ panel, scales = "free") +
  labs(x = "Value", y = "Count")
#> Plot: left panel has three clear humps at -3, 0, 3; right panel is a single bell near 0.
```

**Explanation:** Three humps in the parent become one hump in the mean. Samples of size 30 blend across all three components, and the result is unimodal and approximately normal, the CLT at work.

</details>

## Complete Example

Let's bring everything together in one four-panel plot: sample means at n = 30 from each of the four populations we studied, exponential, uniform, bimodal, and Cauchy. Three of the four should look normal. One should not.

```r title="End-to-end four parents compared"
set.seed(2024)
all_means <- rbind(
  data.frame(parent = "Exponential(1)",  m = simulate_means(function(n) rexp(n, 1), 30)),
  data.frame(parent = "Uniform(0,1)",    m = simulate_means(function(n) runif(n, 0, 1), 30)),
  data.frame(parent = "Bimodal mixture", m = simulate_means(rbimodal, 30)),
  data.frame(parent = "Cauchy(0,1)",     m = simulate_means(function(n) rcauchy(n), 30))
)

ggplot(all_means, aes(m)) +
  geom_histogram(bins = 40, fill = "steelblue", alpha = 0.8) +
  facet_wrap(~ parent, scales = "free") +
  labs(title = "Sampling distributions at n = 30 across four parents",
       x = "Sample mean", y = "Count")
#> Plot: Exponential, Uniform, and Bimodal all show bell-shaped sampling distributions.
#> Plot: Cauchy shows wild outliers and no bell — CLT does not apply.
```

Three of the four panels show neat bell curves, regardless of how wildly different their parent distributions are. The Cauchy panel is visibly broken, no bell, extreme outliers, no convergence. That single picture contains the post's entire message: **the CLT works for finite-variance distributions, and the parent's shape stops mattering once you average.**

## Summary

The CLT turns any well-behaved population into a normal sampling distribution, given enough samples. How many you need depends on the parent.

| Parent shape | Typical example | Convergence speed | Practical n |
|---|---|---|---|
| Symmetric, bounded | Uniform, Normal | Very fast | 5–15 |
| Bimodal / mixture | Two-normal mixture | Moderate | ~30 |
| Right-skewed | Exponential, Lognormal | Slower | 30–100 |
| Heavy-tailed | Cauchy, stable laws (α < 2) | Never |, |

![CLT convergence by parent shape](screenshots/Central-Limit-Theorem-in-R-convergence-by-shape.webp)
*Figure 2: How fast sample means converge depends on the parent shape, heavy tails never converge.*

The three rules to remember: (1) the CLT is about the *sampling distribution of the mean*, not the raw data; (2) the standard error is $\sigma/\sqrt{n}$, so quadrupling $n$ halves uncertainty; (3) check finite variance and independence before you trust any CLT-based inference.

## References

1. Rice, J.A., *Mathematical Statistics and Data Analysis*, 3rd Edition. Duxbury (2007). Chapter 5 covers the CLT and its proof. [Book listing](https://www.cengage.com/c/mathematical-statistics-and-data-analysis-3e-rice/9780534399429/)
2. Casella, G. & Berger, R.L., *Statistical Inference*, 2nd Edition. Duxbury (2002). Section 5.5 on convergence in distribution. [Book listing](https://www.cengage.com/c/statistical-inference-2e-casella/9780534243128/)
3. Wasserman, L., *All of Statistics*. Springer (2004). Section 5.4 on the CLT. [Publisher page](https://link.springer.com/book/10.1007/978-0-387-21736-9)
4. Hesterberg, T., "What Teachers Should Know About the Bootstrap". *The American Statistician* 69(4), 2015. Discusses when CLT approximations break and bootstrap alternatives. [PDF](https://arxiv.org/abs/1411.5279)
5. R Core Team, Base R distribution functions: `?rexp`, `?runif`, `?rcauchy`, `?shapiro.test`. [R manuals](https://cran.r-project.org/manuals.html)
6. ggplot2 documentation, `stat_function()` for overlaying theoretical densities. [Link](https://ggplot2.tidyverse.org/reference/stat_function.html)
7. Wikipedia, Central Limit Theorem entry, useful for the formal proof and historical context. [Link](https://en.wikipedia.org/wiki/Central_limit_theorem)

## Continue Learning

- [**Normal, t, F, and Chi-Squared Distributions in R**](/Normal-t-F-and-Chi-Squared-Distributions-in-R.html), the normal distribution the CLT produces, plus three close relatives used in testing.
- [**Binomial and Poisson Distributions in R**](/Binomial-and-Poisson-Distributions-in-R.html), discrete distributions whose normal approximations rest on the CLT.
- [**Sample Size Planning in R**](/Sample-Size-Planning-in-R.html), use the $\sigma/\sqrt{n}$ relationship to plan how much data you need for a target precision.
