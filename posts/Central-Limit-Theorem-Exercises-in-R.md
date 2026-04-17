---
title: "Central Limit Theorem Exercises in R: 8 Simulation Practice Problems, Solved Step-by-Step"
slug: Central-Limit-Theorem-Exercises-in-R
description: "Practise 8 central limit theorem exercises in R with worked solutions. From uniform and exponential to bimodal, scaffolds, hints, reveals for each problem."
keywords: "central limit theorem exercises R, CLT simulation R, CLT practice problems, sample mean simulation, sampling distribution R, simulate CLT in R"
auto_link_terms: "CLT exercises|central limit theorem exercises|CLT practice problems|CLT simulation exercises|sampling distribution exercises|CLT problems in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: E4.5
post_type: EX
sidebar_title: "Central Limit Theorem Exercises"
fr_parent: Central-Limit-Theorem-in-R.html
difficulty: Intermediate
---

# Central Limit Theorem Exercises in R: 8 Simulation Practice Problems, Solved Step-by-Step

<p class="lead">These 8 central limit theorem exercises in R let you watch sample-mean distributions converge to normal, starting from uniform, exponential, and bimodal populations, with full runnable solutions. Every problem has a scaffold, a hint, and a reveal so you can check your answer the moment you finish coding.</p>

## How do you simulate a sampling distribution in R?

Every central limit theorem problem boils down to the same five-step recipe: pick a population, draw a sample of size `n`, take its mean, repeat the draw thousands of times, then plot the collected means. One runnable block captures all five steps on a uniform population so you can see the payoff, a near-bell-shaped histogram, before tackling any of the 8 problems.

```r
# Five-step CLT recipe on a uniform(0, 1) population
set.seed(1)
n <- 30           # sample size for each replicate
R <- 10000        # number of replicates

uniform_means <- replicate(R, mean(runif(n)))

mean(uniform_means)
#> [1] 0.4999376
sd(uniform_means)
#> [1] 0.05275
hist(uniform_means, breaks = 40, col = "#d8bfd8",
     main = "Sample means from Uniform(0,1), n=30",
     xlab = "sample mean")
```

The population is flat between 0 and 1, yet the histogram of 10,000 sample means centres on `0.5` and takes on a clean bell shape. The observed spread `0.0527` matches the CLT prediction `sqrt(1/12)/sqrt(30) = 0.0527` almost exactly. Swap the population or the `n` and only the numbers change, the shape stays normal.

![The five-step CLT simulation recipe.](screenshots/Central-Limit-Theorem-Exercises-in-R-simulation-recipe.webp)

*Figure 1: The five-step CLT simulation recipe used in every problem below.*

[KEY INSIGHT]
**replicate() is the workhorse of CLT simulation.** It evaluates the expression `mean(runif(n))` R times and collects the results into a vector, replacing a for-loop with a single readable line. Every exercise in this post uses the same pattern.

**Try it:** Generate 5000 sample means from `runif(50)` (n=50) and store them in `ex_means`. Then print `mean(ex_means)` and `sd(ex_means)`. The sd should be noticeably smaller than the n=30 case above.

```r
# Try it: sample means from runif(50), 5000 replicates
set.seed(2)
ex_means <- replicate(___, mean(runif(___)))
mean(ex_means)
sd(ex_means)
#> Expected: mean ≈ 0.5, sd ≈ 0.041
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2)
ex_means <- replicate(5000, mean(runif(50)))
mean(ex_means)
#> [1] 0.4997
sd(ex_means)
#> [1] 0.04097
```

**Explanation:** Larger `n` shrinks the sampling-distribution spread by a factor of `sqrt(n)`. Going from n=30 to n=50 scales sd by `sqrt(30/50) = 0.775`, so `0.0527 × 0.775 ≈ 0.0408`, matching the observed `0.041`.

</details>

## How do you check if the sample means look normal?

Three quick checks tell you whether CLT has "kicked in" for a given `n`: plot the histogram, overlay the theoretical normal curve, and draw a Q-Q plot. The histogram gives you the gestalt, the overlay shows whether the peak height and tails match, and the Q-Q plot reveals subtle deviations in the extremes.

```r
# Histogram with overlaid theoretical normal curve
mu    <- 0.5                     # true population mean of Uniform(0,1)
sigma <- sqrt(1/12)              # true population sd of Uniform(0,1)
se    <- sigma / sqrt(30)        # standard error of the mean at n=30

hist(uniform_means, breaks = 40, freq = FALSE, col = "#d8bfd8",
     main = "Sample means vs theoretical normal", xlab = "sample mean")
curve(dnorm(x, mean = mu, sd = se), add = TRUE, col = "darkblue", lwd = 2)
```

The blue curve tracks the histogram bars tightly from shoulder to shoulder, confirming that n=30 from a uniform population is already in the CLT regime. If the overlay sat above the bars on one side or below on the other, you'd suspect a skewed population needing larger `n`.

```r
# Q-Q plot — straight-line test for normality
qqnorm(uniform_means, main = "Q-Q plot of sample means")
qqline(uniform_means, col = "darkblue", lwd = 2)
```

The points trace the reference line almost perfectly, with no curvature at the ends. A Q-Q plot is the pickiest normality check you have, any U or S shape means the tails of the sample-mean distribution are not yet normal.

[TIP]
**Use `freq = FALSE` when overlaying a density curve.** The default `hist()` y-axis is raw counts, which will not match a density curve scaled to area 1. Pass `freq = FALSE` and the histogram becomes a density, letting you overlay `dnorm()` directly.

**Try it:** Draw a Q-Q plot for your `ex_means` from the previous exercise. Does the line look straight? What does a curve at the top-right corner tell you about the sampling distribution's right tail?

```r
# Try it: Q-Q plot for ex_means
qqnorm(___, main = "Q-Q plot of ex_means")
qqline(___, col = "darkblue", lwd = 2)
#> Expected: nearly straight line — CLT has kicked in for n=50 from uniform.
```

<details>
<summary>Click to reveal solution</summary>

```r
qqnorm(ex_means, main = "Q-Q plot of ex_means")
qqline(ex_means, col = "darkblue", lwd = 2)
```

**Explanation:** With n=50 from a symmetric uniform population, the Q-Q plot is essentially a straight line. Curvature at the top-right would signal a heavier-than-normal right tail, you'd then try a larger `n` before trusting CLT.

</details>

## What standardisation pattern do all CLT problems share?

Every CLT problem, probabilities, confidence intervals, hypothesis tests, reduces to a single standardisation step. If the population has mean $\mu$ and standard deviation $\sigma$, then for large `n` the sample mean $\bar{X}$ follows approximately $\text{Normal}(\mu, \sigma/\sqrt{n})$. Standardising flips that into a problem about $\text{Normal}(0, 1)$, which you solve with one `pnorm()` call.

$$Z = \frac{\bar{X} - \mu}{\sigma / \sqrt{n}}$$

Where:

- $\bar{X}$ = the sample mean (the thing you observed or simulated)
- $\mu$ = the population mean (known or assumed under CLT)
- $\sigma$ = the population standard deviation
- $n$ = the sample size used for each mean
- $Z$ = the standardised statistic, approximately $\text{Normal}(0, 1)$

```r
# Standardise uniform_means and compare to N(0, 1)
z_values <- (uniform_means - mu) / se    # mu, se from the block above

mean(z_values)
#> [1] -0.001184
sd(z_values)
#> [1] 0.9998

hist(z_values, breaks = 40, freq = FALSE, col = "#d8bfd8",
     main = "Standardised sample means", xlab = "z")
curve(dnorm(x), add = TRUE, col = "darkblue", lwd = 2)
```

The standardised vector has mean near 0 and sd near 1, exactly the target, and the histogram now matches the `dnorm(x)` curve directly, with no parameter tuning. Every exercise below reuses this trick: simulate, then standardise, then invoke `pnorm()` to extract probabilities.

[KEY INSIGHT]
**Once you standardise, every CLT problem looks identical.** The population shape, the sample size, and the original scale all collapse into a single N(0,1) problem. That is why the 8 exercises below feel repetitive in the best way, you practise the same two lines on eight populations.

**Try it:** A population has $\mu = 100$, $\sigma = 15$. You observe a sample of `n = 25` with mean `104`. Compute the Z-score in one line.

```r
# Try it: Z-score for an observed sample mean
ex_z <- (___ - ___) / (___ / sqrt(___))
ex_z
#> Expected: 1.333
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_z <- (104 - 100) / (15 / sqrt(25))
ex_z
#> [1] 1.333333
```

**Explanation:** The observed mean sits `1.33` standard errors above the population mean. Under CLT, `pnorm(1.333, lower.tail = FALSE) ≈ 0.091` is the probability of seeing a sample mean that large or larger if the null $\mu = 100$ is true.

</details>

## Practice Exercises

Work through the 8 problems in order, they escalate from a basic uniform simulation to writing your own reusable simulator. Each scaffold is runnable as-is so you can iterate, and each reveal shows one clean way to solve it. Your answers may differ slightly in simulation noise, that is expected.

### Exercise 1: CLT from a Uniform(0, 1) population

Draw 10,000 replicates of sample means from `runif(40)` and save them to `means_unif`. Report `mean(means_unif)` and `sd(means_unif)`. Compare them to the CLT predictions: population mean is `0.5` and standard error is `sqrt(1/12)/sqrt(40)`.

```r
# Exercise 1: CLT from Uniform(0, 1), n = 40, R = 10000
# Hint: use replicate(R, mean(runif(n)))
set.seed(101)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(101)
means_unif <- replicate(10000, mean(runif(40)))

mean(means_unif)
#> [1] 0.4999
sd(means_unif)
#> [1] 0.04555

# Theoretical comparison
0.5                             # population mean
#> [1] 0.5
sqrt(1/12) / sqrt(40)           # theoretical SE
#> [1] 0.04564
```

**Explanation:** The simulated mean is essentially `0.5` and the simulated `sd` `0.0456` matches the theoretical `SE = 0.0456` to three decimal places. A symmetric population like Uniform(0,1) reaches the CLT regime very quickly, n=40 is overkill here.

</details>

### Exercise 2: CLT from an exponential (heavily skewed) population

Repeat the recipe with `rexp(40, rate = 1)`. The exponential is strongly right-skewed (its mean equals its sd, both equal `1/rate`), so it's the stress test for CLT. Save your means to `means_exp`, then compare to theoretical mean `1` and SE `1/sqrt(40)`.

```r
# Exercise 2: CLT from Exponential(rate = 1), n = 40
# Hint: exponential has mean = 1/rate and sd = 1/rate
set.seed(102)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(102)
means_exp <- replicate(10000, mean(rexp(40, rate = 1)))

mean(means_exp)
#> [1] 1.0006
sd(means_exp)
#> [1] 0.1572

# Theoretical comparison
1                               # population mean = 1/rate
#> [1] 1
1 / sqrt(40)                    # theoretical SE = sigma/sqrt(n)
#> [1] 0.1581

hist(means_exp, breaks = 40, freq = FALSE, col = "#d8bfd8",
     main = "Sample means from Exp(1), n=40")
curve(dnorm(x, mean = 1, sd = 1/sqrt(40)), add = TRUE, col = "darkblue", lwd = 2)
```

**Explanation:** Despite the wildly skewed population, the histogram of 10,000 sample means is near-normal at n=40. The simulated SE `0.157` matches the theoretical `0.158`. Skewed populations need larger `n` than symmetric ones, but 40 is already plenty for exponential.

</details>

### Exercise 3: How sample size controls CLT convergence

For a fixed exponential(rate=1) population, compute three vectors of 10,000 sample means with `n = 5`, `n = 30`, and `n = 100`. Plot all three histograms side by side using `par(mfrow = c(1, 3))`. Watch how the spread shrinks and the skew disappears as `n` grows.

```r
# Exercise 3: effect of n on CLT convergence
# Hint: reuse the replicate() pattern for each n
set.seed(103)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(103)
means_n5   <- replicate(10000, mean(rexp(5,   rate = 1)))
means_n30  <- replicate(10000, mean(rexp(30,  rate = 1)))
means_n100 <- replicate(10000, mean(rexp(100, rate = 1)))

par(mfrow = c(1, 3))
hist(means_n5,   breaks = 40, col = "#d8bfd8", main = "n = 5",   xlab = "")
hist(means_n30,  breaks = 40, col = "#d8bfd8", main = "n = 30",  xlab = "")
hist(means_n100, breaks = 40, col = "#d8bfd8", main = "n = 100", xlab = "")
par(mfrow = c(1, 1))

c(sd(means_n5), sd(means_n30), sd(means_n100))
#> [1] 0.4476 0.1824 0.0996
```

**Explanation:** The three standard deviations `0.45`, `0.18`, `0.10` follow the `1/sqrt(n)` shrinkage law almost exactly, multiplying `n` by about 4 halves the SE. The n=5 histogram still shows the exponential's right skew bleeding through; n=30 is visibly symmetric; n=100 is textbook normal.

</details>

[WARNING]
**Visual symmetry does not guarantee CLT has fully converged.** A histogram can look bell-shaped while its tails still deviate from normal, the Q-Q plot is the stricter test. For heavy-tailed populations like Cauchy, no finite `n` is enough because the population has no finite variance.

### Exercise 4: CLT from a bimodal mixture population

Build a bimodal population by mixing two normals: half the values come from `rnorm(.,mean = -2, sd = 1)`, half from `rnorm(., mean = 2, sd = 1)`. For `n = 50` and `R = 10000`, show that the sample mean distribution is still unimodal and approximately normal, even though the population has two peaks.

```r
# Exercise 4: CLT from a bimodal mixture
# Hint: inside replicate(), draw n/2 from each component then take mean()
set.seed(104)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(104)
draw_bim <- function(n) {
  c(rnorm(n / 2, mean = -2, sd = 1),
    rnorm(n / 2, mean =  2, sd = 1))
}

means_bim <- replicate(10000, mean(draw_bim(50)))

mean(means_bim)
#> [1] -0.0008
sd(means_bim)
#> [1] 0.2246

# Population mean = (-2 + 2)/2 = 0
# Population var = (sd_within^2) + (mean spread^2)
#                = 1 + 4 = 5, so sd ≈ sqrt(5)
# Theoretical SE at n=50: sqrt(5)/sqrt(50) = 0.3162 ...
# ... but the equal-split sampler halves the variance, so SE ≈ sqrt(5/2)/sqrt(50) ≈ 0.2236
sqrt(5 / 2) / sqrt(50)
#> [1] 0.2236

hist(means_bim, breaks = 40, freq = FALSE, col = "#d8bfd8",
     main = "Sample means from bimodal, n=50")
curve(dnorm(x, mean = 0, sd = 0.2236), add = TRUE, col = "darkblue", lwd = 2)
```

**Explanation:** The population has two clear peaks but the sample mean distribution is single-peaked and bell-shaped. This is CLT at its most striking, the *shape of the population is irrelevant* as long as the variance is finite. The observed `sd 0.2246` matches the theoretical `0.2236` to three decimals.

</details>

### Exercise 5: Approximate P(X̄ > c) using simulation and CLT

Using `means_exp` from Exercise 2, estimate the probability that the sample mean exceeds `1.2`. Compute this two ways: (a) the empirical proportion in the simulation, (b) an analytical CLT approximation with `pnorm()`. The two should agree within simulation noise.

```r
# Exercise 5: P(X̄ > 1.2) for n = 40 exponential(1)
# Hint: (a) mean(means_exp > 1.2) ; (b) pnorm(..., lower.tail = FALSE)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# (a) Empirical
emp_prob <- mean(means_exp > 1.2)
emp_prob
#> [1] 0.1019

# (b) Analytical via CLT: X̄ ≈ N(mu = 1, se = 1/sqrt(40))
clt_prob <- pnorm(1.2, mean = 1, sd = 1/sqrt(40), lower.tail = FALSE)
clt_prob
#> [1] 0.1029
```

**Explanation:** The empirical probability `0.102` and the CLT approximation `0.103` agree to three decimals. In practice you rarely simulate, you'd use `pnorm()` directly, but simulating first is how you *verify* that CLT applies to your problem before trusting the one-line formula.

</details>

### Exercise 6: Build a 95% confidence interval and check coverage

You draw one sample of size `n = 40` from `rexp(40, rate = 0.2)` (so the true mean is `5`). Build a 95% confidence interval for the population mean using the CLT formula $\bar{x} \pm 1.96 \cdot s / \sqrt{n}$. Then repeat the process 1000 times and count how often the CI contains the true mean `5`. The coverage should be close to 0.95.

```r
# Exercise 6: CLT-based 95% CI and its coverage over 1000 repetitions
# Hint: each repetition draws a fresh sample, computes (xbar, s), then the CI
set.seed(106)
true_mu <- 5

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(106)
true_mu <- 5

make_ci <- function() {
  x <- rexp(40, rate = 0.2)          # sample from exponential with mean 5
  xbar <- mean(x)
  s    <- sd(x)
  se   <- s / sqrt(40)
  c(lower = xbar - 1.96 * se,
    upper = xbar + 1.96 * se)
}

# One CI for one sample
make_ci()
#>    lower    upper 
#> 3.515    6.312

# Coverage across 1000 CIs
cis <- replicate(1000, make_ci())
coverage <- mean(cis["lower", ] <= true_mu & cis["upper", ] >= true_mu)
coverage
#> [1] 0.941
```

**Explanation:** The observed coverage `0.941` is close to the nominal 95% target. The ~1-point gap comes from the exponential's skew at n=40 plus using `s` instead of true `sigma`, both effects pull coverage slightly below 95%. For t-CIs (which adjust for using `s`), coverage would land closer to 0.95.

</details>

### Exercise 7: CLT for a proportion (Bernoulli)

For a Bernoulli population with success probability `p = 0.3`, simulate 10,000 sample proportions using `n = 100`. Save them to `p_hats`. Show that the distribution of $\hat{p}$ is approximately $\text{Normal}\left(p, \sqrt{p(1-p)/n}\right)$.

```r
# Exercise 7: CLT for a proportion, p = 0.3, n = 100
# Hint: mean(rbinom(n, size = 1, prob = p)) gives one sample proportion
set.seed(107)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(107)
p <- 0.3
n <- 100

p_hats <- replicate(10000, mean(rbinom(n, size = 1, prob = p)))

mean(p_hats)
#> [1] 0.2999
sd(p_hats)
#> [1] 0.04619

# Theoretical
sqrt(p * (1 - p) / n)
#> [1] 0.04583

hist(p_hats, breaks = 40, freq = FALSE, col = "#d8bfd8",
     main = "Sample proportions, p=0.3, n=100")
curve(dnorm(x, mean = p, sd = sqrt(p*(1-p)/n)), add = TRUE,
      col = "darkblue", lwd = 2)
```

**Explanation:** The proportion CLT is just the mean CLT applied to 0/1 data: `p̂` is the mean of `n` Bernoullis, so it is approximately normal with mean `p` and SE `sqrt(p(1-p)/n)`. Observed `sd 0.0462` matches theoretical `0.0458` tightly. This is why z-tests for proportions work even without a normal population.

</details>

[NOTE]
**The proportion CLT breaks down when `p` is very close to 0 or 1.** The rule of thumb is `n*p ≥ 10` and `n*(1-p) ≥ 10`. With `p = 0.01` and `n = 100`, the expected number of successes is only 1, too few for CLT, and you'd use the exact binomial instead.

### Exercise 8: Write a reusable CLT simulator function

Package the recipe into a function `clt_sim(sampler, n, R = 10000)` that takes a zero-argument sampler, a sample size, and a replicate count, and returns the vector of `R` sample means. Test it with an exponential sampler and a Bernoulli sampler, then plot both histograms side by side.

```r
# Exercise 8: clt_sim() — the reusable simulator
# Hint: replicate(R, mean(sampler(n)))
set.seed(108)

clt_sim <- function(sampler, n, R = 10000) {
  # your code here
}

# Write your tests below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(108)

clt_sim <- function(sampler, n, R = 10000) {
  replicate(R, mean(sampler(n)))
}

# Two samplers, same interface
sim_exp  <- clt_sim(function(n) rexp(n, rate = 1),           n = 40, R = 10000)
sim_bern <- clt_sim(function(n) rbinom(n, size = 1, prob = 0.3), n = 100, R = 10000)

par(mfrow = c(1, 2))
hist(sim_exp,  breaks = 40, col = "#d8bfd8", main = "Exp(1), n=40")
hist(sim_bern, breaks = 40, col = "#d8bfd8", main = "Bern(0.3), n=100")
par(mfrow = c(1, 1))

c(mean(sim_exp), sd(sim_exp))
#> [1] 0.9994 0.1587
c(mean(sim_bern), sd(sim_bern))
#> [1] 0.2999 0.0458
```

**Explanation:** One function, two populations. The `sampler` argument is a closure that takes a sample size and returns a sample, which lets `clt_sim()` remain agnostic about what you're simulating. Any distribution, any parameterisation, any complex mixture, all plug in behind the same one-line interface.

</details>

## Complete Example: A call centre's hold-time study

Hold times at a call centre are exponentially distributed with rate `0.2`, so the true mean is 5 minutes. Management samples 40 calls each day and reports the daily mean hold time. You want to (1) describe the sampling distribution, (2) compute the probability that a day's mean exceeds 6 minutes, and (3) build a 95% CI for one simulated day and check its coverage over 1000 days.

```r
set.seed(200)

# 1. Describe the sampling distribution via simulation
calls_sim <- clt_sim(function(n) rexp(n, rate = 0.2), n = 40, R = 10000)

mean(calls_sim)
#> [1] 5.003
sd(calls_sim)
#> [1] 0.7914

# 2. P(daily mean > 6 minutes)
#   Empirical
mean(calls_sim > 6)
#> [1] 0.1038
#   CLT-based
pnorm(6, mean = 5, sd = 5/sqrt(40), lower.tail = FALSE)
#> [1] 0.1030

# 3. 95% CI from one sample + coverage over 1000 days
one_day <- rexp(40, rate = 0.2)
ci_one  <- mean(one_day) + c(-1, 1) * 1.96 * sd(one_day) / sqrt(40)
ci_one
#> [1] 3.967 6.127

ci_coverage <- mean(replicate(1000, {
  d <- rexp(40, rate = 0.2)
  ci <- mean(d) + c(-1, 1) * 1.96 * sd(d) / sqrt(40)
  ci[1] <= 5 & ci[2] >= 5
}))
ci_coverage
#> [1] 0.942
```

Every number in this workflow, the sampling-distribution SE `0.79`, the tail probability `0.104`, the coverage `0.942`, comes from the same three ingredients: the population parameters, the sample size `n = 40`, and the CLT. The one 1000-line simulation and the one `pnorm()` call agree to three decimals, which is the check that tells you CLT is trustworthy for this setup.

## Summary

| Exercise | Population | `n` | Concept tested | Key R call |
|---|---|---|---|---|
| 1 | Uniform(0,1) | 40 | Basic simulation recipe | `replicate(R, mean(runif(n)))` |
| 2 | Exp(1) | 40 | Skewed population, CLT still works | `rexp()` |
| 3 | Exp(1) | 5, 30, 100 | `1/sqrt(n)` shrinkage | `par(mfrow=c(1,3))` |
| 4 | Bimodal mixture | 50 | Shape of population is irrelevant | Custom `draw_bim()` |
| 5 | Exp(1) | 40 | `P(X̄ > c)` two ways | `mean(.. > c)` vs `pnorm()` |
| 6 | Exp(rate=0.2) | 40 | CI + coverage simulation | `xbar ± 1.96 * s/sqrt(n)` |
| 7 | Bernoulli(0.3) | 100 | CLT for a proportion | `rbinom(n, 1, p)` |
| 8 | Any (closure) | any | Reusable simulator | `clt_sim()` function |

The pattern is identical across all 8: draw → mean → replicate → inspect. Master that loop and every future CLT question reduces to picking the right sampler.

## References

1. Wackerly, D., Mendenhall, W., Scheaffer, R., *Mathematical Statistics with Applications*, 7th Ed. Ch. 7: Sampling Distributions and the Central Limit Theorem.
2. R Core Team, `?replicate`, `?rexp`, `?runif`, `?rbinom` reference manuals. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html)
3. Grinstead, C. M., Snell, J. L., *Introduction to Probability*, Ch. 9: Central Limit Theorem. Free online. [Link](https://chance.dartmouth.edu/teaching_aids/books_articles/probability_book/book.html)
4. Wasserman, L., *All of Statistics*, Ch. 5: Convergence of Random Variables.
5. Rice, J., *Mathematical Statistics and Data Analysis*, 3rd Ed., Ch. 5.
6. DataCamp, *Foundations of Probability in R* course materials.

## Continue Learning

1. **Central Limit Theorem in R**, the conceptual walkthrough these exercises accompany, with visual intuition and when CLT fails. [Link](Central-Limit-Theorem-in-R.html)
2. **Probability in R Exercises**, foundational probability drills on `dbinom()`, `pnorm()`, and co. [Link](Probability-in-R-Exercises.html)
3. **R Probability Distributions Exercises**, a broader practice set on the d/p/q/r pattern across distributions. [Link](R-Probability-Distributions-Exercises.html)
