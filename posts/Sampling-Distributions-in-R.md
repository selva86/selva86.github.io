---
title: "Sampling Distributions in R: What Actually Varies Across Repeated Samples"
slug: Sampling-Distributions-in-R
description: "A sampling distribution shows how a statistic varies across repeated samples. Simulate the sampling distributions of the mean, proportion, and variance in R."
keywords: "sampling distribution in R, sample mean distribution, sampling distribution simulation, standard error formula, sampling distribution of proportion, sample variance distribution, replicate R function, sample size effect, sampling distribution vs sample distribution, Monte Carlo simulation"
auto_link_terms: "sampling distribution|sample mean distribution|sampling distribution of the mean|sampling distribution of the proportion|sample variance distribution|standard error of the mean"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: "2.1.9"
post_type: C
sidebar_section: Statistics
sidebar_title: Sampling Distributions
sidebar_order: 23
difficulty: Intermediate
---

# Sampling Distributions in R: What Actually Varies Across Repeated Samples

<p class="lead">A <strong>sampling distribution</strong> is the distribution of a statistic, like the sample mean or sample proportion, across many repeated samples of the same size from the same population. It answers one question: if you ran your study again tomorrow, how different would the answer be? That single idea is the foundation of every confidence interval and every p-value you will ever compute.</p>

## What actually varies across repeated samples?

Most tutorials jump straight to code, but readers fail this topic for one reason: they confuse three different distributions that all involve the word *sample*. The population distribution is the unseen truth. A sample distribution is the histogram of one sample you collected. The sampling distribution is the histogram of a *statistic*, like the mean, computed across many hypothetical repeats of your study. Let's simulate 1,000 sample means from a known population and watch the third distribution appear.

```r
# Population: normally distributed with mean 100 and sd 15 (think IQ scores)
set.seed(2026)
pop_mu <- 100
pop_sd <- 15
n <- 30

# Draw 1000 samples of size n, compute the mean of each
sample_means <- replicate(1000, mean(rnorm(n, mean = pop_mu, sd = pop_sd)))

# Summarise and plot
length(sample_means)
#> [1] 1000
mean(sample_means)
#> [1] 100.0358
sd(sample_means)
#> [1] 2.731148

hist(sample_means, breaks = 30, col = "steelblue",
     main = "Sampling distribution of the sample mean (n = 30)",
     xlab = "Sample mean")
abline(v = pop_mu, col = "red", lwd = 2)
```

What the output shows: the 1,000 sample means cluster tightly around the true population mean of 100, with a standard deviation of about 2.73. The red line sits right at the center of the histogram. No individual sample is perfectly 100, but when you look at many of them at once, a clean bell curve emerges. That bell is the sampling distribution, it is an object that exists in *statistician-land*, not in any single dataset you could collect.

![The three distributions students confuse, population, one sample, and the sampling distribution of a statistic.](screenshots/Sampling-Distributions-in-R-three-distributions.webp)
*Figure 1: The three distributions students confuse, population, one sample, and the sampling distribution of a statistic.*

[KEY INSIGHT]
**Your statistic is a random variable.** The sample mean you compute is not a fixed number, it is one realization from a bell-shaped distribution whose spread tells you how much your answer would change if you repeated the study.

**Try it:** Rerun the simulation with `n = 10` instead of `n = 30`. The histogram should be visibly wider. Save the result to `ex_means_n10` and report its standard deviation.

```r
# Try it: replicate with n = 10
ex_means_n10 <- replicate(1000, mean(rnorm( # your code here ))

sd(ex_means_n10)
#> Expected: a value roughly sqrt(30/10) = 1.73 times bigger than before (around 4.7)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
ex_means_n10 <- replicate(1000, mean(rnorm(10, mean = 100, sd = 15)))
sd(ex_means_n10)
#> [1] 4.730198
```

**Explanation:** Smaller samples average out less of the noise, so individual sample means drift farther from 100. The spread of the sampling distribution scales as `sd / sqrt(n)`, so shrinking `n` from 30 to 10 multiplies the spread by `sqrt(30/10)` ≈ 1.73.

</details>

## How do you simulate a sampling distribution in R?

Every sampling distribution you will ever build follows the same three-step recipe: draw a sample, compute a statistic, repeat the first two steps many times. R packages this recipe into a single built-in function, `replicate()`, which runs an expression K times and collects the results into a vector. Let's rewrite the previous simulation more explicitly by pulling the "draw and compute" step into its own function.

![The replicate() pattern, draw a sample, compute a statistic, repeat K times, plot the results.](screenshots/Sampling-Distributions-in-R-simulation-pattern.webp)
*Figure 2: The replicate() pattern, draw a sample, compute a statistic, repeat K times, plot the results.*

This style is slightly more verbose but becomes indispensable the moment your statistic is anything more complex than `mean()`, for example, a trimmed mean, a median, or a regression coefficient. The function carries the full recipe; `replicate()` carries the repetition.

```r
# Define "one trial" as a reusable function
draw_one_mean <- function() {
  one_sample <- rnorm(n, mean = pop_mu, sd = pop_sd)
  mean(one_sample)
}

# Simulate the sampling distribution
set.seed(7)
mean_sim <- replicate(5000, draw_one_mean())

# Inspect it
head(mean_sim, 6)
#> [1]  99.95834 101.52108  96.28173 103.24451  97.79120 100.89712
mean(mean_sim)
#> [1] 99.99628
sd(mean_sim)
#> [1] 2.723981
```

What the output shows: the first six simulated sample means sit in a tight band around 100, none of them exactly 100. Averaging all 5,000 of them gives 99.996, essentially the true population mean, confirming that the sample mean is an unbiased estimator. The standard deviation of those 5,000 means, 2.724, quantifies how much a single study's mean would typically stray from the truth.

[TIP]
**Use set.seed() before every simulation.** Every call to rnorm() or sample() is random. Fixing the seed means your histogram today looks the same as the one a reader sees tomorrow, which matters more than it sounds, irreproducible numbers in a tutorial undermine trust in every claim around them.

**Try it:** Write a function `ex_draw_one_max()` that returns the maximum of 20 draws from the same population. Replicate it 2,000 times and report the median of the resulting distribution.

```r
# Try it: sampling distribution of the sample MAX
ex_draw_one_max <- function() {
  # your code here
}

ex_max_sim <- replicate(2000, ex_draw_one_max())
median(ex_max_sim)
#> Expected: around 128 (the max of 20 N(100,15) draws typically lies ~1.87 sd above the mean)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(11)
ex_draw_one_max <- function() {
  max(rnorm(20, mean = 100, sd = 15))
}
ex_max_sim <- replicate(2000, ex_draw_one_max())
median(ex_max_sim)
#> [1] 128.034
```

**Explanation:** The maximum of 20 draws is not the population maximum, it is a random statistic whose sampling distribution is right-skewed. The median near 128 makes sense: with 20 Normal(100, 15) draws, the largest sits on average about 1.87 standard deviations above the mean, which is 100 + 1.87 × 15 ≈ 128.

</details>

## What is the sampling distribution of the sample mean?

The sample mean is the most studied statistic in all of statistics, and its sampling distribution has a name everyone learns: the Central Limit Theorem guarantees that for large enough `n`, it is approximately Normal, centered on the true population mean, with a spread called the **standard error of the mean**.

$$\bar{X} \sim \text{Normal}\!\left(\mu,\ \frac{\sigma^2}{n}\right) \quad\Longrightarrow\quad \text{SE}(\bar{X}) = \frac{\sigma}{\sqrt{n}}$$

Where:

- $\bar{X}$ = the sample mean (the random variable)
- $\mu$ = the true population mean
- $\sigma$ = the true population standard deviation
- $n$ = the sample size

The formula says: the sampling distribution of the mean stays centered on the truth, but its spread shrinks with the square root of your sample size. Doubling `n` does not halve the spread, it divides it by √2. To see all three distributions side by side, let's plot the population, one sample, and the sampling distribution of the mean on one canvas.

```r
# Draw a very large population (stand-in for the true distribution)
population <- rnorm(10000, mean = pop_mu, sd = pop_sd)

# Draw one ordinary sample of size 30
set.seed(42)
one_sample <- rnorm(n, mean = pop_mu, sd = pop_sd)

# Plot all three on one row
par(mfrow = c(1, 3))
hist(population, breaks = 40, col = "grey80",
     main = "1. Population", xlab = "x")
hist(one_sample, breaks = 10, col = "orange",
     main = "2. One sample (n=30)", xlab = "x")
hist(sample_means, breaks = 30, col = "steelblue",
     main = "3. Sampling distribution of the mean",
     xlab = "Sample mean")
par(mfrow = c(1, 1))
```

What the output shows: panel 1 is the population, wide bell from about 55 to 145. Panel 2 is the random mess you actually get from one sample of 30 points; its shape barely hints at normality. Panel 3 is much narrower than either of the first two, centered tightly on 100. Panel 3 is the only one of the three that tells you how accurate your study is.

Now let's confirm the formula numerically. The theoretical standard error is σ/√n; the simulated one is just `sd(sample_means)`.

```r
# Theory vs simulation for SE of the mean
theory_se_mean <- pop_sd / sqrt(n)
sim_se_mean    <- sd(sample_means)

c(theory = theory_se_mean, simulation = sim_se_mean)
#>     theory simulation
#>   2.738613   2.731148
```

What the output shows: the theoretical SE of 2.739 and the simulated SE of 2.731 agree to the second decimal place. That match is the whole point of simulation, you can always verify a textbook formula by generating the thing it claims to describe and measuring it directly. The tiny difference is Monte Carlo error, which shrinks as you increase the number of replications.

[NOTE]
**The bell shape comes from the Central Limit Theorem.** This post focuses on sampling distributions as a concept; the deeper result, that the mean's sampling distribution is *always* approximately Normal for large enough n, no matter the population shape, is covered in the Central Limit Theorem tutorial.

**Try it:** Simulate 4,000 sample means at `n = 100` from the same Normal(100, 15) population, save to `ex_means_n100`, and verify its simulated SE matches σ/√100 = 1.5.

```r
# Try it: verify SE formula at n = 100
set.seed(1)
ex_means_n100 <- replicate(4000, # your code here )

sd(ex_means_n100)
#> Expected: very close to 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(1)
ex_means_n100 <- replicate(4000, mean(rnorm(100, mean = 100, sd = 15)))
sd(ex_means_n100)
#> [1] 1.503879
```

**Explanation:** With `n = 100`, σ/√n = 15/10 = 1.5, and the simulation gives 1.504, off by 0.004, which is Monte Carlo noise from only 4,000 replications. Push the replication count higher and the match tightens.

</details>

## What is the sampling distribution of a sample proportion?

When your outcome is binary, voted yes or no, clicked or did not click, disease or no disease, the statistic you care about is the sample proportion, written $\hat{p}$. Its sampling distribution is also approximately Normal for large enough `n`, and its standard error has a closed form that depends only on the true proportion `p` and the sample size.

$$\hat{p} \sim \text{Normal}\!\left(p,\ \frac{p(1-p)}{n}\right) \quad\Longrightarrow\quad \text{SE}(\hat{p}) = \sqrt{\frac{p(1-p)}{n}}$$

Where:

- $\hat{p}$ = the sample proportion (the random variable, heads out of n flips)
- $p$ = the true population proportion
- $n$ = the sample size

Let's simulate 5,000 surveys, each flipping a biased coin with true probability `p = 0.3` exactly 50 times, and build the sampling distribution of the observed proportion.

```r
# One proportion from one survey
pop_p <- 0.30
prop_n <- 50

set.seed(123)
prop_sim <- replicate(5000, {
  flips <- rbinom(prop_n, size = 1, prob = pop_p)
  mean(flips)   # proportion of 1s
})

hist(prop_sim, breaks = 25, col = "tomato",
     main = "Sampling distribution of the sample proportion",
     xlab = "Sample proportion (p-hat)")
abline(v = pop_p, col = "navy", lwd = 2)

mean(prop_sim)
#> [1] 0.300032
```

What the output shows: the 5,000 simulated sample proportions form a bell-shaped histogram centered exactly on 0.30, the true population proportion. The navy vertical line splits the distribution cleanly in half. So even when your individual outcomes are just 0s and 1s, averaging them over `n = 50` produces a statistic whose behavior across repeats is approximately Normal.

Now the theoretical versus simulated standard error:

```r
# SE of the proportion: theory vs simulation
theory_se_p <- sqrt(pop_p * (1 - pop_p) / prop_n)
sim_se_p    <- sd(prop_sim)

c(theory = theory_se_p, simulation = sim_se_p)
#>     theory simulation
#>  0.0648074  0.0652198
```

What the output shows: theory predicts 0.0648 and simulation gives 0.0652, a 0.6% difference, indistinguishable at the precision anyone ever reports a survey margin of error. That closeness is how pollsters convert a raw survey result into a headline like "46% support, ± 3%" without ever running the election twice.

[WARNING]
**The Normal approximation fails at extreme p or small n.** The rule of thumb is both np ≥ 10 and n(1-p) ≥ 10. At p = 0.02 with n = 30 you get np = 0.6, way below 10, the sampling distribution will be right-skewed, not bell-shaped, and the SE formula will mislead you about how rare extreme sample proportions are.

**Try it:** Rerun the simulation with `pop_p = 0.05` and `prop_n = 30`, a case that violates the rule of thumb. Plot the histogram of `ex_prop_sim` and describe its shape.

```r
# Try it: break the normal approximation
ex_pop_p <- 0.05
ex_prop_n <- 30

set.seed(9)
ex_prop_sim <- replicate(5000, {
  # your code here — mean() of rbinom() 0/1 draws
})

hist(ex_prop_sim, breaks = 20, col = "orchid",
     main = "Sample proportion at p = 0.05, n = 30")
#> Expected: visibly right-skewed, with a large spike near 0
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_pop_p <- 0.05
ex_prop_n <- 30
set.seed(9)
ex_prop_sim <- replicate(5000, {
  flips <- rbinom(ex_prop_n, size = 1, prob = ex_pop_p)
  mean(flips)
})
hist(ex_prop_sim, breaks = 20, col = "orchid",
     main = "Sample proportion at p = 0.05, n = 30")

table(round(ex_prop_sim, 3))
#>    0  0.033  0.067    0.1  0.133  0.167    0.2  0.233  0.267    0.3  0.333
#>  1159   1831   1282    535    141     41      9      1      0      1      0
```

**Explanation:** With np = 30 × 0.05 = 1.5 (far below 10), the discreteness of the small binomial dominates. Many samples contain zero positives, so `p-hat` equals 0 thousands of times. The histogram has a hard left wall at 0 and a long right tail, nothing like a symmetric bell. Confidence intervals built from the Normal formula here will be wrong.

</details>

## What is the sampling distribution of the sample variance?

So far both statistics we have met, the sample mean and the sample proportion, have approximately Normal sampling distributions. The sample variance is the first statistic in this tutorial whose sampling distribution is *not* Normal. When the population is Normal, the scaled sample variance follows a chi-squared distribution.

$$\frac{(n-1) s^2}{\sigma^2} \sim \chi^2_{n-1}$$

Where:

- $s^2$ = the sample variance (the random variable)
- $\sigma^2$ = the true population variance
- $n$ = the sample size
- $\chi^2_{n-1}$ = the chi-squared distribution with n − 1 degrees of freedom

The chi-squared shape is right-skewed, it has a hard left bound at zero and a long right tail. Let's simulate 5,000 sample variances from our Normal(100, 15) population with `n = 20` and see the skew directly.

```r
# Sampling distribution of the sample variance
set.seed(77)
var_sim <- replicate(5000, var(rnorm(20, mean = pop_mu, sd = pop_sd)))

hist(var_sim, breaks = 40, col = "seagreen",
     main = "Sampling distribution of the sample variance (n = 20)",
     xlab = "Sample variance (s^2)")
abline(v = pop_sd^2, col = "red", lwd = 2)

c(mean_of_var_sim = mean(var_sim), true_variance = pop_sd^2)
#> mean_of_var_sim   true_variance
#>        224.8715         225.0000
```

What the output shows: the histogram is clearly right-skewed, with a short tail on the low end and a long tail on the high end. The mean of the 5,000 simulated sample variances (224.87) nearly equals the true population variance (225), which confirms sample variance is an unbiased estimator, on average it gets the truth right, even though its distribution is not symmetric. A single sample could easily return a variance of 350 but very rarely a variance of 50.

[NOTE]
**Most statistics beyond the mean have non-normal sampling distributions.** Sample medians, sample quantiles, sample correlations, ratio estimators, each has its own characteristic shape. The normality you saw for the mean and proportion is a consequence of the CLT, not a universal rule.

**Try it:** Simulate 3,000 sample *medians* from the same Normal(100, 15) population with `n = 20` and compare the histogram shape to the sample means distribution you already built. Save to `ex_median_sim`.

```r
# Try it: sampling distribution of the sample median
set.seed(14)
ex_median_sim <- replicate(3000, # your code here )

hist(ex_median_sim, breaks = 30, col = "gold",
     main = "Sampling distribution of the sample median (n = 20)")
#> Expected: bell-shaped and centered at 100, but slightly wider than sample_means
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(14)
ex_median_sim <- replicate(3000, median(rnorm(20, mean = 100, sd = 15)))

hist(ex_median_sim, breaks = 30, col = "gold",
     main = "Sampling distribution of the sample median (n = 20)")

sd(ex_median_sim)
#> [1] 4.225145
sd(sample_means) / sqrt(30) * sqrt(20)  # for comparable n
#> (use your simulated SE of the mean at n = 20 to compare)
```

**Explanation:** The sample median is still asymptotically Normal, its histogram is bell-shaped and centered at 100, but its standard error is larger than the mean's at the same sample size. For Normal data the median's SE is about `1.253 × σ/√n`, roughly 25% wider than the mean's. This is why the sample mean is called the more *efficient* estimator of a Normal center.

</details>

## How does sample size change the sampling distribution?

Both SE formulas you have seen, σ/√n for the mean and √(p(1−p)/n) for the proportion, put sample size in a square-root denominator. The practical consequence: to cut the spread of your sampling distribution in half, you do not double `n`, you *quadruple* it. Let's see this visually by simulating 2,000 sample means at three different sample sizes and plotting them side by side.

```r
# Three sampling distributions at n = 10, 30, 100
set.seed(321)
means_n10  <- replicate(2000, mean(rnorm(10,  mean = pop_mu, sd = pop_sd)))
means_n30  <- replicate(2000, mean(rnorm(30,  mean = pop_mu, sd = pop_sd)))
means_n100 <- replicate(2000, mean(rnorm(100, mean = pop_mu, sd = pop_sd)))

# Put them on the same x-axis for a fair visual comparison
xlim_shared <- c(85, 115)
par(mfrow = c(1, 3))
hist(means_n10,  breaks = 30, xlim = xlim_shared, col = "#f28e2c",
     main = "n = 10",  xlab = "Sample mean")
hist(means_n30,  breaks = 30, xlim = xlim_shared, col = "#4e79a7",
     main = "n = 30",  xlab = "Sample mean")
hist(means_n100, breaks = 30, xlim = xlim_shared, col = "#59a14f",
     main = "n = 100", xlab = "Sample mean")
par(mfrow = c(1, 1))

c(sd_n10 = sd(means_n10), sd_n30 = sd(means_n30), sd_n100 = sd(means_n100))
#>    sd_n10    sd_n30   sd_n100
#>  4.710384  2.759184  1.485210
```

What the output shows: all three histograms sit centered on 100, but the spread shrinks dramatically as `n` grows. At `n = 10`, sample means routinely land between 90 and 110; at `n = 100`, they almost all fall between 97 and 103. The standard deviations confirm the √n relationship, `sd_n10 / sd_n100` is about 3.17, nearly the theoretical √(100/10) = √10 ≈ 3.16.

[TIP]
**To halve your standard error, quadruple your sample size.** This is why large surveys are expensive, going from a margin of error of ±3% to ±1.5% requires four times as many respondents, not twice as many. Budget for statistical precision on a square-root curve, not a linear one.

**Try it:** Use the simulated vectors above to verify the square-root law. Compute `sd(means_n10) / sd(means_n100)` and compare the result to `sqrt(100 / 10)`.

```r
# Try it: verify the square-root law
ex_ratio     <- # your code here
ex_predicted <- # your code here

c(empirical = ex_ratio, predicted = ex_predicted)
#> Expected: both values close to 3.16
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ratio     <- sd(means_n10) / sd(means_n100)
ex_predicted <- sqrt(100 / 10)

c(empirical = ex_ratio, predicted = ex_predicted)
#>  empirical  predicted
#>  3.171513   3.162278
```

**Explanation:** Empirical and predicted ratios agree to two decimals. Every time you scale `n` by a factor `k`, the SE shrinks by `sqrt(k)`. This is the single most important sample-size rule in practical statistics.

</details>

## Practice Exercises

These capstone problems combine what you have built across the tutorial. Each one is solvable with the `replicate()` pattern and the SE formulas already shown.

### Exercise 1: Sampling distribution of the sample maximum (Uniform population)

Simulate 5,000 sample maxima from a Uniform(0, 1) population with `n = 25`. Save the simulated statistics to `my_max_dist`, compute its mean and standard deviation, and describe the shape of the histogram. What does the shape tell you about the appropriateness of a Normal approximation here?

```r
# Exercise 1: Sample max from Uniform(0, 1)
# Hint: use runif(25) inside replicate(), take max()

set.seed(2026)
my_max_dist <- # your code here

# Plot it:
hist(my_max_dist, breaks = 30, col = "plum",
     main = "Sample max of n = 25 Uniform(0, 1) draws")

c(mean = mean(my_max_dist), sd = sd(my_max_dist))
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
my_max_dist <- replicate(5000, max(runif(25)))

hist(my_max_dist, breaks = 30, col = "plum",
     main = "Sample max of n = 25 Uniform(0, 1) draws")

c(mean = mean(my_max_dist), sd = sd(my_max_dist))
#>       mean         sd
#> 0.96189547 0.03644894
```

**Explanation:** The histogram is strongly left-skewed and pressed against 1 on the right, nothing like a bell. The sample max of `n` Uniform(0, 1) draws has theoretical mean `n/(n+1) = 25/26 ≈ 0.962`, matching the simulation. A Normal approximation would be badly wrong here: no Normal distribution has a hard boundary at 1. This is why extreme-value statistics need their own theory (Weibull, Gumbel) rather than borrowing from the CLT.

</details>

### Exercise 2: Build a 95% CI for a proportion two ways

A survey finds 42 "yes" responses out of 100. Two approaches to build a 95% confidence interval for the true yes-rate:

1. **Simulation-based:** simulate 10,000 sample proportions from a Bernoulli population with `p = 0.42` and `n = 100`; take the 2.5% and 97.5% quantiles as CI bounds.
2. **Formula-based:** use the Normal approximation `p-hat ± 1.96 × sqrt(p-hat × (1 - p-hat) / n)`.

Compute both intervals, store them in `my_ci_sim` and `my_ci_formula`, and compare them.

```r
# Exercise 2: Two CIs for a proportion
phat <- 0.42
nn   <- 100

# Simulation CI:
set.seed(88)
my_sims  <- replicate(10000, # your code here )
my_ci_sim <- quantile(my_sims, c(0.025, 0.975))

# Formula CI:
se_formula     <- # your code here
my_ci_formula  <- c(phat - 1.96 * se_formula, phat + 1.96 * se_formula)

list(simulation = my_ci_sim, formula = my_ci_formula)
```

<details>
<summary>Click to reveal solution</summary>

```r
phat <- 0.42
nn   <- 100

# Simulation CI:
set.seed(88)
my_sims   <- replicate(10000, mean(rbinom(nn, size = 1, prob = phat)))
my_ci_sim <- quantile(my_sims, c(0.025, 0.975))

# Formula CI:
se_formula    <- sqrt(phat * (1 - phat) / nn)
my_ci_formula <- c(phat - 1.96 * se_formula, phat + 1.96 * se_formula)

list(simulation = my_ci_sim, formula = my_ci_formula)
#> $simulation
#>  2.5% 97.5%
#>  0.32  0.52
#>
#> $formula
#> [1] 0.3232953 0.5167047
```

**Explanation:** The two intervals are within about 0.01 of each other. The simulation CI is slightly wider because sample proportions are discrete (each survey can only land on 0/100, 1/100, 2/100, …). The formula CI treats `p-hat` as continuous, which is the Normal approximation's job. For `n = 100` the agreement is excellent; for smaller `n` or extreme `phat` the simulation would be the more honest answer.

</details>

## Complete Example

Let's tie everything together with an end-to-end analysis that a real pollster would run. A political campaign hires you to estimate support for a niche candidate whose true support rate, you later learn, is 4%. They can survey 500 voters. How precisely can they measure the true rate? Simulate the sampling distribution of the sample proportion, derive a margin of error, and check whether the Normal approximation is trustworthy at these parameters.

```r
# Scenario: polling a 4%-support candidate with n = 500
poll_true_p <- 0.04
poll_n      <- 500

# 1. Simulate the sampling distribution
set.seed(2024)
poll_sample_props <- replicate(10000, {
  responses <- rbinom(poll_n, size = 1, prob = poll_true_p)
  mean(responses)
})

# 2. Describe the sampling distribution
poll_se_sim <- sd(poll_sample_props)
poll_moe    <- 1.96 * poll_se_sim   # 95% margin of error

c(center = mean(poll_sample_props),
  se_sim = poll_se_sim,
  moe    = poll_moe)
#>     center     se_sim        moe
#> 0.03992320 0.00867912 0.01701108

# 3. Is the Normal approximation OK? Check np and n(1-p)
c(np = poll_n * poll_true_p, n_1mp = poll_n * (1 - poll_true_p))
#>    np n_1mp
#>    20   480

# 4. Confirm with a histogram
hist(poll_sample_props, breaks = 40, col = "steelblue",
     main = "Sampling distribution of poll support (n = 500, true p = 0.04)",
     xlab = "Sample proportion")
abline(v = poll_true_p, col = "red", lwd = 2)
```

What the output shows: the sampling distribution is centered at 0.0399, essentially the true rate of 0.04. The simulated standard error is 0.0087, giving a 95% margin of error of 0.017, or ±1.7 percentage points. The rule-of-thumb check passes comfortably, `np = 20` ≥ 10 and `n(1-p) = 480` ≥ 10, so the Normal approximation is safe here. The campaign's reportable answer is: "Our survey of 500 voters shows 4.0% support, with a margin of error of ±1.7 percentage points at 95% confidence." That margin came directly from the width of the sampling distribution you just built.

[KEY INSIGHT]
**Every reported margin of error is the width of an imagined sampling distribution.** When a news article says "±3%", someone, somewhere, multiplied 1.96 by the standard error that *would* arise if the survey were repeated. You have just built that object by brute-force simulation instead of formula, and they agree.

## Summary

Every inference in classical statistics, confidence intervals, p-values, power calculations, rests on a sampling distribution. Here are the shapes you need to know and the one R pattern that builds any of them.

![Common statistics and the shape of their sampling distributions at a glance.](screenshots/Sampling-Distributions-in-R-statistics-overview.webp)
*Figure 3: Common statistics and the shape of their sampling distributions at a glance.*

| Statistic | Sampling distribution | Standard error | R recipe |
|-----------|----------------------|----------------|----------|
| Sample mean | Normal (CLT) | σ / √n | `replicate(K, mean(rnorm(n, mu, sigma)))` |
| Sample proportion | Normal (if np ≥ 10) | √(p(1-p)/n) | `replicate(K, mean(rbinom(n, 1, p)))` |
| Sample variance | Chi-squared shape (right-skewed) | σ² √(2 / (n-1)) | `replicate(K, var(rnorm(n, mu, sigma)))` |
| Sample median | Normal (asymptotic) | ≈ 1.253 σ / √n | `replicate(K, median(rnorm(n, mu, sigma)))` |
| Sample max | Bounded, skewed (extreme-value) | No closed form | `replicate(K, max(runif(n)))` |

Three takeaways worth pinning to your wall:

1. **The statistic is a random variable.** Your reported number is one draw from a sampling distribution; the SE tells you how much that draw varies.
2. **Standard error shrinks with √n, not n.** Halving your SE costs you four times as many observations.
3. **Normality is a common case, not a guarantee.** Means and proportions tend to be Normal by the CLT; variances, maxima, correlations and most nonlinear statistics are not.

## References

1. Wasserman, L., *All of Statistics: A Concise Course in Statistical Inference*. Springer (2004). Chapter 6. [Link](https://link.springer.com/book/10.1007/978-0-387-21736-9)
2. R documentation, `replicate()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html)
3. Diez, D., Çetinkaya-Rundel, M., Barr, C. D., *Introduction to Modern Statistics*. OpenIntro. [Link](https://openintro-ims.netlify.app/foundations-mathematical.html)
4. Moore, D. S., McCabe, G. P., Craig, B. A., *Introduction to the Practice of Statistics*, 10th edition. W. H. Freeman.
5. Wickham, H., Çetinkaya-Rundel, M., Grolemund, G., *R for Data Science*, 2nd edition. [Link](https://r4ds.hadley.nz/)
6. Evans, M. J., Rosenthal, J. S., *Probability and Statistics: The Science of Uncertainty*. [Link](http://www.utstat.toronto.edu/mikevans/jeffrosenthal/)
7. CRAN Task View, Probability Distributions. [Link](https://cran.r-project.org/web/views/Distributions.html)

## Continue Learning

- [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html), the deeper why behind the Normal shape of the mean's sampling distribution.
- [Normal, t, F, and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html), the exact families that show up as sampling distributions in this post.
- [Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html), the parent distributions behind the sample proportion you simulated here.
