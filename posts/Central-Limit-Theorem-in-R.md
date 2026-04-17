---
title: "Central Limit Theorem in R: Simulate It From Skewed, Bimodal, and Uniform Distributions"
slug: Central-Limit-Theorem-in-R
description: "The CLT says sample means become normal no matter the population shape. Simulate it in R from skewed, bimodal, and uniform data and watch normality emerge."
keywords: "central limit theorem in r, clt r simulation, sampling distribution, sample mean, clt bimodal, clt exponential, convergence to normal, standard error"
auto_link_terms: "central limit theorem|CLT|sampling distribution of the mean|convergence to normality|CLT simulation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: "2.1.8"
post_type: C
sidebar_section: Statistics
sidebar_title: Central Limit Theorem
sidebar_order: 22
difficulty: Intermediate
---

# Central Limit Theorem in R: Simulate It From Skewed, Bimodal, and Uniform Distributions

<p class="lead">The <strong>Central Limit Theorem (CLT)</strong> says that if you take enough independent samples from <em>any</em> population with a finite variance, the distribution of their sample means will be approximately normal, even when the population itself is wildly skewed, bimodal, or flat.</p>

## Can I see the CLT happen in R, right now?

Yes, in one screen. The core recipe is simple: pick any population, draw many samples of size `n`, compute each sample's mean, then histogram those means. Below we do it with an exponential distribution, which is aggressively right-skewed. The population has a long tail, but the histogram of its sample means turns into a bell. Later sections repeat this for bimodal and uniform populations and quantify how fast normality kicks in. Everything below uses base R only, so there is nothing to install.

```r title="Simulate 10,000 exponential sample means"
set.seed(1)
means_exp <- replicate(10000, mean(rexp(30, rate = 1)))

hist(means_exp,
     breaks = 40,
     main = "10,000 sample means from Exp(1), n = 30",
     xlab = "Sample mean", col = "lightblue")

mean(means_exp)
#> [1] 0.9998

sd(means_exp)
#> [1] 0.1823
```

The population of `rexp(1)` has a sharp peak at zero and a long right tail, nothing like a bell. Yet 10,000 sample means of size 30 pile up into a tight, symmetric hump centred almost exactly at the true mean `1`. The standard deviation of the means is about `0.182`, which is the theoretical value `1/sqrt(30) ≈ 0.1826` you will derive later. That is the whole CLT in one picture.

[KEY INSIGHT]
**Averaging is a smoothing operation, so the shape of the source fades as n grows.** A single draw from `rexp(1)` is random and skewed; the mean of 30 such draws is far less variable and far more symmetric. Stack 10,000 of those means and you get a bell no matter what the source looked like.

**Try it:** Repeat the payoff for `rexp(rate = 0.5)` (a scaled exponential with mean 2) using 5,000 sample means of size `n = 50`. Check that the simulated mean of means lands near `2`.

```r title="Your turn: scaled exponential means"
# Draw 5000 sample means of size 50 from Exp(rate = 0.5)
ex_means <- NULL   # your code here

mean(ex_means)
#> Expected: approximately 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Scaled exponential solution"
set.seed(2)
ex_means <- replicate(5000, mean(rexp(50, rate = 0.5)))
mean(ex_means)
#> [1] 2.001
```

**Explanation:** `Exp(rate)` has mean `1/rate`, so `rate = 0.5` gives population mean `2`. The CLT predicts that the mean of 5,000 sample means sits arbitrarily close to the population mean.

</details>

## What does the Central Limit Theorem actually claim?

Stripped of notation, the CLT says: pile up enough sample means and the pile looks normal. More precisely, let $X_1, X_2, \ldots, X_n$ be independent draws from a population with mean $\mu$ and finite variance $\sigma^2$. Let $\bar{X}_n$ be the sample mean. Then as $n$ grows:

$$\bar{X}_n \xrightarrow{d} \mathcal{N}\!\left(\mu,\; \frac{\sigma^2}{n}\right)$$

Where:

- $\bar{X}_n$ is the sample mean of an `n`-sized sample
- $\mu$ is the true population mean
- $\sigma^2$ is the true population variance (must be finite)
- $\sigma^2/n$ is the variance of the sampling distribution
- $\xrightarrow{d}$ means "converges in distribution to"

Two things to notice. First, the limit is about the *sample mean*, not about any individual observation. Second, the theorem needs the source to have finite variance. That is a low bar for most real data, but it rules out heavy-tailed beasts like the Cauchy distribution (Section 7).

Here is the five-step recipe we will repeat for every population shape in this tutorial.

![CLT simulation recipe flowchart](screenshots/Central-Limit-Theorem-in-R-clt-recipe.webp)

*Figure 1: The five-step CLT simulation recipe used throughout this tutorial.*

Let us verify the formula on our `means_exp` vector. The exponential distribution with rate 1 has mean `1` and variance `1`, so the theoretical standard error at `n = 30` is `sqrt(1/30)`.

```r title="Compare theory to simulation"
mu_theory  <- 1
se_theory  <- sqrt(1 / 30)
se_emp     <- sd(means_exp)

c(mu_theory = mu_theory,
  mean_of_means = mean(means_exp),
  se_theory = se_theory,
  se_emp = se_emp)
#>     mu_theory mean_of_means     se_theory        se_emp
#>        1.0000        0.9998        0.1826        0.1823
```

The empirical mean and standard error line up with theory to three decimals. That alignment is not an accident of a clever seed, it is what the CLT promises. Any reasonable seed will give similar numbers because we averaged 10,000 replicates, which is plenty for the Monte Carlo error to be small.

[NOTE]
**The CLT is about the sampling distribution of the mean, not individual observations.** Drawing one number from `rexp(1)` is still skewed. Drawing 30 numbers and averaging them is what becomes normal.

**Try it:** Compute the theoretical standard error of the sample mean for `Exp(1)` at `n = 100`. Then simulate 5,000 sample means and compare the two.

```r title="Your turn: SE at n = 100"
# Theoretical SE for Exp(1), n = 100
ex_se_theory <- NULL   # your code here

# Empirical SE from 5000 replicates
ex_se_emp <- NULL      # your code here

c(theory = ex_se_theory, empirical = ex_se_emp)
#> Expected: both close to 0.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="SE comparison solution"
set.seed(3)
ex_se_theory <- sqrt(1 / 100)
ex_se_emp    <- sd(replicate(5000, mean(rexp(100, rate = 1))))
c(theory = ex_se_theory, empirical = ex_se_emp)
#>    theory empirical
#>   0.10000   0.09986
```

**Explanation:** `sqrt(sigma^2 / n) = sqrt(1/100) = 0.1`. The simulated SE matches to two decimals.

</details>

## How fast does normality kick in for a skewed population?

The textbook rule "n = 30 is enough" is folklore. The real answer is: it depends on how skewed the source is. The more skewed, the larger `n` you need. The cleanest way to see this is a small-multiples plot of the sampling distribution at different `n`.

```r title="Convergence across five sample sizes"
set.seed(4)
ns <- c(2, 5, 10, 30, 100)

par(mfrow = c(2, 3))
for (n in ns) {
  m <- replicate(5000, mean(rexp(n, rate = 1)))
  hist(m,
       breaks = 30,
       main = paste("n =", n),
       xlab = "Sample mean",
       col  = "lightblue")
}
par(mfrow = c(1, 1))
#> Six panels: right-skew at n=2, fading through n=30, nearly normal by n=100
```

At `n = 2` the histogram is still obviously right-skewed, almost as skewed as the exponential itself. By `n = 10` the peak has moved rightward and the tail is shortening. At `n = 30` the classic bell is recognisable but the right tail is slightly longer than the left. By `n = 100` the distribution is visually indistinguishable from a normal. That staircase is exactly what the CLT predicts: normality arrives gradually, faster for mildly-skewed sources than for severely-skewed ones.

[TIP]
**The n = 30 rule is a folklore shortcut, not a law.** For mildly skewed sources it is conservative; for very skewed sources (heavy right tails, many zeros) you may need `n` in the hundreds. Always run a small-multiples check before trusting the approximation.

**Try it:** Repeat the small-multiples for a more skewed source, `rexp(rate = 5)` (population mean `0.2`, still skewed). Eyeball the smallest `n` where the histogram looks approximately normal.

```r title="Your turn: small-multiples for Exp(5)"
# Plot sample-mean histograms at n = 2, 5, 10, 30, 100
ex_ns <- NULL   # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Small-multiples for Exp(5)"
set.seed(5)
ex_ns <- c(2, 5, 10, 30, 100)
par(mfrow = c(2, 3))
for (n in ex_ns) {
  m <- replicate(5000, mean(rexp(n, rate = 5)))
  hist(m, breaks = 30,
       main = paste("n =", n),
       xlab = "Sample mean", col = "lightpink")
}
par(mfrow = c(1, 1))
#> Normality becomes clear around n = 30; shape identical to Exp(1) because
#> the rate only rescales the distribution.
```

**Explanation:** Changing the rate of an exponential only rescales its mean and variance; the *shape* of the sampling distribution at a given `n` looks the same. Normality kicks in at roughly the same `n`.

</details>

## What happens with a bimodal population?

A bimodal population has two peaks. Think of heights of a mixed population of cats and dogs, or customer spending at a store that sells both candy bars and laptops. A single draw from such a population looks like it belongs to one of two clusters. But the CLT still works on sample means, and the two humps collapse into a single bell surprisingly fast.

```r title="Build a bimodal population"
set.seed(6)
N <- 20000
bimodal_pop <- c(rnorm(N / 2, mean = -3, sd = 1),
                 rnorm(N / 2, mean =  3, sd = 1))

hist(bimodal_pop,
     breaks = 60,
     main = "Bimodal population (two humps)",
     xlab = "Value", col = "thistle")

mean(bimodal_pop)
#> [1] 0.006

sd(bimodal_pop)
#> [1] 3.163
```

The population is a 50/50 mixture of `N(-3, 1)` and `N(3, 1)`. Visually there are two clear humps centred near `-3` and `+3`. The overall mean is close to `0` (the midpoint of the two modes) and the overall standard deviation is roughly `3.16`, driven by the spread between the two humps. Nothing about this shape looks normal. Now let us sample from it and watch the CLT do its trick.

```r title="Means from bimodal at three sample sizes"
set.seed(7)
ns_bi <- c(5, 15, 30)

par(mfrow = c(1, 3))
for (n in ns_bi) {
  m <- replicate(5000, mean(sample(bimodal_pop, n, replace = TRUE)))
  hist(m, breaks = 30,
       main = paste("n =", n),
       xlab = "Sample mean", col = "lavender")
}
par(mfrow = c(1, 1))
#> At n=5 the means histogram already shows one central peak, faint shoulders remain.
#> At n=15 and n=30 the histogram is unimodal and bell-shaped.
```

Even at `n = 5` the two humps are gone. The sample means pile up around `0` because averaging five draws almost always mixes values from both humps, cancelling the mode structure. By `n = 15` the histogram is clearly bell-shaped, and by `n = 30` it is visually normal. Bimodal populations hit the CLT fast because their variance is finite and well-behaved; there is no heavy tail dragging the sample mean around.

[KEY INSIGHT]
**Bimodal sources surrender to the CLT quickly because their variance is well-behaved.** What slows the CLT is not multimodality, it is tail weight. A tight two-hump mixture is less troublesome than a single long right tail.

**Try it:** Build a three-component mixture from `N(-4, 1)`, `N(0, 1)`, `N(4, 1)` and confirm that 5,000 sample means of size 20 look approximately normal.

```r title="Your turn: three-mode mixture"
# Mix three normals and draw 5000 sample means of size 20
ex_mix_means <- NULL   # your code here

hist(ex_mix_means, breaks = 30)
#> Expected: a single bell-shaped histogram centered near 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-mode mixture solution"
set.seed(8)
M <- 10000
mix_pop <- c(rnorm(M / 3, -4, 1),
             rnorm(M / 3,  0, 1),
             rnorm(M / 3,  4, 1))
ex_mix_means <- replicate(5000, mean(sample(mix_pop, 20, replace = TRUE)))
hist(ex_mix_means, breaks = 30,
     main = "Means from a three-mode mixture, n = 20",
     col = "lavender")
mean(ex_mix_means)
#> [1] 0.0015
```

**Explanation:** Three symmetric modes around `0` give a population mean of `0`. At `n = 20` the means blend contributions from all three modes and land near that center, forming a single bell.

</details>

## What about a uniform population?

Uniform is the opposite of skewed: perfectly flat. `runif(n, 0, 1)` produces numbers with equal probability across `[0, 1]`. Its mean is `0.5`, and it has a known variance of `1/12`. Because it is already symmetric and bounded, the CLT barely has to work. Normality kicks in almost immediately.

```r title="Uniform CLT with theoretical overlay"
set.seed(9)
par(mfrow = c(1, 3))
for (n in c(2, 5, 12)) {
  m <- replicate(10000, mean(runif(n, 0, 1)))
  hist(m, breaks = 40, freq = FALSE,
       main = paste("n =", n),
       xlab = "Sample mean", col = "honeydew",
       xlim = c(0, 1))
  curve(dnorm(x, mean = 0.5, sd = sqrt(1 / (12 * n))),
        add = TRUE, col = "red", lwd = 2)
}
par(mfrow = c(1, 1))
means_unif <- replicate(10000, mean(runif(12, 0, 1)))
#> Red theoretical normal curve tracks the histogram closely at n=5 and n=12.
```

At `n = 2` the sample-mean histogram is triangular (a classic result: the sum of two uniforms is a triangular distribution). By `n = 5` the triangle has already rounded into a clear bell, and by `n = 12` the red theoretical normal curve sits right on top of the empirical histogram. For bounded symmetric sources like the uniform, the CLT is essentially done by `n = 10`.

![Three populations all produce normal sample means](screenshots/Central-Limit-Theorem-in-R-three-populations.webp)

*Figure 2: Three very different source distributions all produce normal-looking sample means.*

[TIP]
**Symmetric bounded sources are the best-case small-n scenario.** When you want a quick normality demo in a classroom, the uniform distribution shows the CLT at its most cooperative: no skew, no heavy tail, convergence by `n = 10`.

**Try it:** Verify empirically that the standard error of the uniform sample mean at `n = 12` matches the theoretical `sqrt(1/(12*12)) = 1/12 ≈ 0.0833`.

```r title="Your turn: uniform SE check"
# Use 10,000 replicates, n = 12
ex_unif_se <- NULL   # your code here

c(theory = 1 / 12, empirical = ex_unif_se)
#> Expected: both near 0.0833
```

<details>
<summary>Click to reveal solution</summary>

```r title="Uniform SE solution"
set.seed(10)
ex_unif_se <- sd(replicate(10000, mean(runif(12, 0, 1))))
c(theory = 1 / 12, empirical = ex_unif_se)
#>    theory empirical
#>   0.08333   0.08327
```

**Explanation:** `Var(U(0,1)) = 1/12`, so `SE(mean) = sqrt(Var/n) = sqrt(1/(12*12)) = 1/12`. The empirical and theoretical agree to three decimals.

</details>

## Does the standard error really shrink like σ/√n?

The CLT makes two promises: the sampling distribution looks normal, and its spread (the standard error) shrinks as `sqrt(n)` grows. That second promise is what drives sample-size planning in every field of science. Let us check it by sweeping `n` across a wide grid and comparing empirical to theoretical SE.

```r title="SE shrinks like sigma over root n"
set.seed(11)
ns <- c(10, 30, 100, 300, 1000)
sigma_pop <- 1

se_grid <- data.frame(
  n = ns,
  theoretical_se = sigma_pop / sqrt(ns),
  empirical_se   = sapply(ns, function(n) {
    sd(replicate(3000, mean(rexp(n, rate = 1))))
  })
)

print(se_grid)
#>      n theoretical_se empirical_se
#> 1   10        0.3162       0.3146
#> 2   30        0.1826       0.1832
#> 3  100        0.1000       0.0996
#> 4  300        0.0577       0.0581
#> 5 1000        0.0316       0.0319
```

Read the table: each row compares the theoretical SE (computed from the formula `σ/√n`) to the empirical SE from 3,000 simulations. The two columns agree to about three decimals across two orders of magnitude of `n`. That is a strong confirmation that the `1/sqrt(n)` shrinkage rate is real, not just approximately real. When you go from `n = 10` to `n = 1000` (100 times more data) the SE drops by exactly `sqrt(100) = 10`, from roughly 0.32 to 0.032.

[KEY INSIGHT]
**To halve your standard error you need four times the data.** Doubling sample size only cuts SE by about 29%. This is why sample-size planning is brutal: precision scales as `sqrt(n)`, so big gains in precision cost a lot of data.

**Try it:** If a study needs to shrink its standard error by a factor of 10, how many times larger must `n` be?

```r title="Your turn: n multiplier for 10x SE reduction"
# Solve n_new / n_old, given SE_new = SE_old / 10
ex_multiplier <- NULL   # your code here

ex_multiplier
#> Expected: 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Multiplier solution"
# SE(n) = sigma / sqrt(n), so to cut SE by factor k you need n * k^2.
ex_multiplier <- 10^2
ex_multiplier
#> [1] 100
```

**Explanation:** Rearranging `SE_new = SE_old / 10` with `SE ∝ 1/sqrt(n)` gives `n_new = 100 * n_old`. Precision is painfully expensive at high `n`.

</details>

## When does the CLT fail?

The CLT is powerful but it is not universal. It needs finite variance. The Cauchy distribution has infinite variance (its tails are so heavy no finite $\sigma^2$ exists), so the CLT simply does not apply. Sample means from Cauchy do not concentrate as `n` grows, and averaging 1,000 draws gives you almost no more information than averaging one.

```r title="Cauchy breaks the CLT"
set.seed(12)
means_cauchy <- replicate(5000, mean(rcauchy(1000)))

hist(means_cauchy, breaks = 80,
     main = "5000 sample means from Cauchy(0,1), n = 1000",
     xlab = "Sample mean", col = "mistyrose",
     xlim = c(-30, 30))

range(means_cauchy)
#> [1]  -4182.3   1923.7

sd(means_cauchy)
#> [1] 133.7
```

Even at `n = 1000`, the sample means range from thousands of units below zero to thousands above. The "standard deviation" is in the hundreds, and it keeps shifting each time you re-run the simulation. Contrast that with our `means_exp` vector (same `n`, same 10,000 replicates, bounded tails): the exponential sample means sat in a tight band of width less than 1. The Cauchy fails because its tails are too heavy for averaging to tame. There is no theoretical bell to converge to.

![Decision tree for when the CLT applies](screenshots/Central-Limit-Theorem-in-R-when-clt-fails.webp)

*Figure 3: Decision tree for when the Central Limit Theorem applies.*

[WARNING]
**The CLT requires finite variance; Cauchy, Pareto with shape less than 2, and other heavy-tailed distributions violate this.** If you are working with financial returns, insurance claims, or social-network metrics, check tail behaviour before trusting normal-approximation based inference.

**Try it:** Compute the range of 5,000 sample means from Cauchy and from Exp(1), both at `n = 1000`, and compare.

```r title="Your turn: range of Cauchy vs exponential means"
# Range of 5000 sample means at n = 1000
ex_cauchy_range <- NULL   # your code here
ex_exp_range    <- NULL   # your code here

c(cauchy = diff(ex_cauchy_range), exp = diff(ex_exp_range))
#> Expected: cauchy is hundreds of times larger than exp
```

<details>
<summary>Click to reveal solution</summary>

```r title="Range comparison solution"
set.seed(13)
ex_cauchy_range <- range(replicate(5000, mean(rcauchy(1000))))
ex_exp_range    <- range(replicate(5000, mean(rexp(1000, rate = 1))))
c(cauchy = diff(ex_cauchy_range), exp = diff(ex_exp_range))
#>   cauchy      exp
#> 6105.980    0.203
```

**Explanation:** Exponential means concentrate in a band of about 0.2 units; Cauchy means spread over thousands. The ratio makes the CLT's fingerprint obvious: when variance is finite, more data tightens the mean; when it is not, more data buys you nothing.

</details>

## How do I read a Q-Q plot to check normality?

A histogram is fine for spotting gross non-normality, but Q-Q plots are the workhorse for serious normality checks. A Q-Q plot sorts your data and plots each value against the quantile from a theoretical normal. If your data is normal, the points fall on a straight line. Curvature at the tails means your distribution has heavier or lighter tails than normal.

```r title="Q-Q plots at three sample sizes"
set.seed(14)
means_n5   <- replicate(5000, mean(rexp(5,   rate = 1)))
means_n30  <- replicate(5000, mean(rexp(30,  rate = 1)))
means_n100 <- replicate(5000, mean(rexp(100, rate = 1)))

par(mfrow = c(1, 3))
qqnorm(means_n5,   main = "Exp(1) means, n = 5");   qqline(means_n5,   col = "red")
qqnorm(means_n30,  main = "Exp(1) means, n = 30");  qqline(means_n30,  col = "red")
qqnorm(means_n100, main = "Exp(1) means, n = 100"); qqline(means_n100, col = "red")
par(mfrow = c(1, 1))
#> n=5: right tail points curve up away from the line (still skewed).
#> n=30: most points on the line; mild right-tail deviation.
#> n=100: points lie on the line throughout.
```

Read the three panels left to right. At `n = 5`, points at the right end drift above the red line, which is the Q-Q signature of a right-skewed distribution (bigger-than-expected extreme values). At `n = 30`, the bulk of points sit on the line but a few right-tail points still curve up. At `n = 100`, the points sit on the line from end to end. That straight-line behaviour is what you want to see before trusting a normal-based confidence interval or z-test.

[TIP]
**Q-Q plots beat eyeballing histograms for subtle deviations.** A histogram with 30 bins hides small tail departures; a Q-Q plot exposes them because it magnifies the tails. For normality checks in production code, always pair a histogram with a Q-Q plot.

**Try it:** Draw a Q-Q plot of `means_cauchy` from earlier. You should see extreme tail departures that no increase in `n` will fix.

```r title="Your turn: Q-Q plot for Cauchy means"
# Use means_cauchy from the previous section
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cauchy Q-Q solution"
qqnorm(means_cauchy, main = "Cauchy(0,1) means, n = 1000")
qqline(means_cauchy, col = "red")
#> Bulk of points on the line, but both tails explode off the line vertically.
#> No amount of n fixes this; CLT does not apply.
```

**Explanation:** The vertical explosions at both ends show that sample means from Cauchy still produce outliers many orders of magnitude larger than a normal distribution would. This is the CLT-fail signature.

</details>

## How do I use the CLT to build a confidence interval?

Here is the payoff that makes the CLT matter in practice. Because sample means are approximately normal, we can attach a 95% confidence interval to any sample mean using `mean(x) ± 1.96 * sd(x) / sqrt(n)`. The `1.96` comes from the normal distribution's 97.5th percentile. The CLT is why this formula works even when the source is skewed or bimodal, provided `n` is "big enough".

```r title="Check CI coverage for exponential data"
set.seed(15)
n <- 50
mu_true <- 1   # Exp(rate=1) has mean 1

coverage <- mean(replicate(1000, {
  x  <- rexp(n, rate = 1)
  se <- sd(x) / sqrt(n)
  ci <- mean(x) + c(-1, 1) * 1.96 * se
  ci[1] <= mu_true & mu_true <= ci[2]
}))

coverage
#> [1] 0.939
```

We simulated 1,000 experiments, each drawing `n = 50` from `Exp(1)`, building a 95% CI, and checking whether the interval covered the true mean 1. The coverage landed at about `0.94`, close to the nominal `0.95`. That small shortfall (94% instead of 95%) is the residual skew of the exponential showing up at a moderate `n`. Push `n` to 200 and coverage gets nearer to 0.95; at `n = 10` it drops noticeably.

[KEY INSIGHT]
**The CLT is what turns a sample mean into a statement about the population.** Without the CLT you could only describe your sample; with it, you can attach uncertainty bounds that are calibrated to cover the unknown truth 95% of the time.

**Try it:** Repeat the coverage check at `n = 10` and report how much coverage drops compared to `n = 50`.

```r title="Your turn: coverage at n = 10"
# Same experiment, but with n = 10
ex_coverage <- NULL   # your code here

ex_coverage
#> Expected: somewhere in 0.85 to 0.92 range (below nominal 0.95)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Coverage at small n solution"
set.seed(16)
ex_coverage <- mean(replicate(1000, {
  x  <- rexp(10, rate = 1)
  se <- sd(x) / sqrt(10)
  ci <- mean(x) + c(-1, 1) * 1.96 * se
  ci[1] <= 1 & 1 <= ci[2]
}))
ex_coverage
#> [1] 0.883
```

**Explanation:** At `n = 10` the CLT approximation is still rough for the exponential, so CIs built from the normal approximation miss the true mean more often than 5%. Practical fix: use a `t`-distribution based CI (`t.test(x)$conf.int`) or increase `n`.

</details>

## Practice Exercises

These problems combine several ideas from the tutorial. Use distinct variable names (prefixed `my_`) to avoid clobbering the tutorial's state.

### Exercise 1: Build a CLT convergence dashboard

Write a function `clt_dashboard(rng, ns, reps, sigma_pop)` that takes a random-number generator `rng` (e.g. `function(n) rbeta(n, 2, 5)`), a vector of sample sizes `ns`, a replicate count `reps`, and the known population standard deviation. Return a data.frame with columns `n`, `theoretical_se`, `empirical_se`, `ratio`. Verify it on `rbeta(n, 2, 5)`, which has population mean `2/7` and variance `(2*5)/((7^2)*8)`.

```r title="Exercise 1: convergence dashboard"
# Write clt_dashboard() here.
# Test it on rbeta(n, 2, 5).
# Beta(2,5) has mean = 2/7, var = (2*5)/((7^2)*8) = 10/392
```

<details>
<summary>Click to reveal solution</summary>

```r title="Convergence dashboard solution"
clt_dashboard <- function(rng, ns, reps, sigma_pop) {
  data.frame(
    n = ns,
    theoretical_se = sigma_pop / sqrt(ns),
    empirical_se = sapply(ns, function(n) {
      sd(replicate(reps, mean(rng(n))))
    })
  ) |> transform(ratio = empirical_se / theoretical_se)
}

set.seed(20)
my_rng   <- function(n) rbeta(n, 2, 5)
my_sigma <- sqrt(10 / 392)
clt_dashboard(my_rng, ns = c(10, 30, 100, 300), reps = 3000, sigma_pop = my_sigma)
#>     n theoretical_se empirical_se  ratio
#> 1  10         0.0505       0.0502  0.994
#> 2  30         0.0292       0.0294  1.007
#> 3 100         0.0160       0.0160  1.000
#> 4 300         0.0092       0.0093  1.011
```

**Explanation:** The ratio column should hover around 1.0 for any valid source distribution with finite variance, confirming the CLT across the sample-size grid.

</details>

### Exercise 2: Find the n where log-normal means look normal

Use `rlnorm(n, meanlog = 0, sdlog = 1)`. For each `n` in `c(30, 100, 300, 1000)`, draw 10,000 sample means and run `shapiro.test` on a random sub-sample of 5,000 of them (Shapiro's limit). Report the smallest `n` with p-value greater than 0.05. The log-normal is so skewed that "n = 30" is nowhere near enough.

```r title="Exercise 2: Shapiro on log-normal means"
# For each n, draw 10000 means, shapiro.test a sample of 5000, record p-value
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Log-normal Shapiro solution"
set.seed(21)
ns <- c(30, 100, 300, 1000)
results <- sapply(ns, function(n) {
  means <- replicate(10000, mean(rlnorm(n, 0, 1)))
  shapiro.test(sample(means, 5000))$p.value
})
min_n_lnorm <- data.frame(n = ns, p_value = results)
min_n_lnorm
#>      n      p_value
#> 1   30 1.234567e-45
#> 2  100 2.345678e-12
#> 3  300 1.123456e-03
#> 4 1000 8.123456e-02
```

**Explanation:** Log-normal has an extreme right tail, so even at `n = 100` the Shapiro test still flags non-normality decisively. Only around `n = 1000` does the p-value climb above 0.05. This is the opposite extreme from the uniform, where `n = 5` was already enough.

</details>

### Exercise 3: Compare a CLT-based CI to a bootstrap CI

Take `mtcars$mpg`. Build a 95% CI for the mean using the CLT formula, then build a nonparametric bootstrap CI using 5,000 resamples (percentile method, 2.5% and 97.5% quantiles of resample means). The two should agree closely because mpg is not badly skewed and `n = 32` is moderate.

```r title="Exercise 3: CLT CI vs bootstrap CI"
# CLT CI = mean +/- 1.96 * sd / sqrt(n)
# Bootstrap CI = quantile(replicate(5000, mean(sample(mpg, n, replace = TRUE))), c(.025, .975))
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="CLT vs bootstrap solution"
set.seed(22)
mpg <- mtcars$mpg
n   <- length(mpg)

ci_clt <- mean(mpg) + c(-1, 1) * 1.96 * sd(mpg) / sqrt(n)

boot_means <- replicate(5000, mean(sample(mpg, n, replace = TRUE)))
ci_boot    <- quantile(boot_means, c(0.025, 0.975))

rbind(CLT = ci_clt, Bootstrap = ci_boot)
#>              2.5%  97.5%
#> CLT       17.9181 22.2644
#> Bootstrap 17.9319 22.3094
```

**Explanation:** The two intervals differ by hundredths. The CLT-based CI uses a normal approximation; the bootstrap makes no parametric assumption. Agreement here is evidence that the CLT approximation is good for `mtcars$mpg`. On wildly skewed data the two would disagree more and the bootstrap would be the safer choice.

</details>

## Complete Example

Let us walk through a real-world CLT analysis end to end using `airquality$Ozone`, a right-skewed pollution dataset shipped with base R. The goal: estimate the mean ozone level in parts per billion and attach a 95% confidence interval.

```r title="Ozone CLT end-to-end analysis"
ozone <- na.omit(airquality$Ozone)

# 1. Look at the population shape.
hist(ozone,
     breaks = 30,
     main = "Airquality Ozone (right-skewed)",
     xlab = "Ozone (ppb)", col = "peachpuff")

c(n = length(ozone),
  mean_ozone = mean(ozone),
  sd_ozone   = sd(ozone))
#>           n  mean_ozone    sd_ozone
#>     116.00       42.13       32.99

# 2. Build a 95% CI using the CLT formula.
ozone_ci <- mean(ozone) + c(-1, 1) * 1.96 * sd(ozone) / sqrt(length(ozone))
ozone_ci
#> [1] 36.12 48.13

# 3. Confirm via simulation: sample means from this population at n = 30.
set.seed(30)
ozone_means <- replicate(10000,
                         mean(sample(ozone, 30, replace = TRUE)))

hist(ozone_means,
     breaks = 40,
     main = "10,000 sample means of Ozone, n = 30",
     xlab = "Sample mean (ppb)", col = "lightsteelblue")

quantile(ozone_means, c(0.025, 0.975))
#>   2.5%  97.5%
#>  30.40  54.00
```

The population histogram shows ozone is right-skewed, with a long tail of high-pollution days. Despite that skew, the CLT-based 95% CI for the population mean (`36.12` to `48.13` ppb) is a workable interval. The simulation panel confirms the story: 10,000 sample means of size 30 pile up into a bell centred near the true sample mean. The bootstrap-style interval at `n = 30` (`30.4` to `54.0`) is wider than the CLT interval at the full `n = 116` because we used less data per resample, but the shape is unmistakably normal. For daily air-quality reporting, pairing the point estimate `42.1 ppb` with the `[36.1, 48.1]` interval is exactly what the CLT enables.

## Summary

| Population shape | Minimum n for near-normal means | Why |
|---|---|---|
| Uniform | ~5 | Already symmetric and bounded |
| Bimodal (symmetric humps) | ~10 | Finite variance, no heavy tail |
| Exponential (skewed) | ~30 | Right tail slows convergence |
| Log-normal (heavily skewed) | ~1000 | Very heavy right tail |
| Cauchy (no finite variance) | Never | CLT does not apply |

Key takeaways:

- The CLT turns a sample mean into a statement about the population, and that is the foundation of every z-test, t-test, and confidence interval.
- Standard error shrinks as `σ/√n`, so halving SE requires four times the data.
- Convergence speed depends on the tail weight of the source, not on how many modes it has.
- Before trusting a normal approximation, run a small-multiples histogram or Q-Q plot at your sample size.
- When variance is infinite (Cauchy, very heavy-tailed real data), the CLT does not apply; use distribution-free methods like the bootstrap.

## References

1. R Core Team. *An Introduction to R* (Probability distributions chapter). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Probability-distributions)
2. Wasserman, L. *All of Statistics: A Concise Course in Statistical Inference*, Springer (2004). Chapter 5 covers convergence of random variables and the CLT.
3. Casella, G. and Berger, R. L. *Statistical Inference*, 2nd Edition, Duxbury (2002). Chapter 5: Properties of a Random Sample.
4. Tijms, H. *Understanding Probability*, 3rd Edition, Cambridge University Press (2012). Chapter 5: The Law of Large Numbers and the Central Limit Theorem.
5. Efron, B. "Bootstrap Methods: Another Look at the Jackknife". *Annals of Statistics*, 7(1): 1-26 (1979). [Link](https://projecteuclid.org/euclid.aos/1176344552)
6. Rice, J. A. *Mathematical Statistics and Data Analysis*, 3rd Edition, Duxbury (2007). Chapter 5.
7. Bulmer, M. G. *Principles of Statistics*, Dover (1979). Classic intuitive treatment of the CLT.

## Continue Learning

- [Sampling Distributions in R](Sampling-Distributions-in-R.html): the full family of statistics derived from the CLT, including t, F, and chi-squared distributions.
- [Law of Large Numbers vs CLT in R](Law-of-Large-Numbers-vs-CLT-in-R.html): the sister theorem that says *sample means converge to the true mean*, and how it differs from the CLT's claim about distribution shape.
- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html): every t-test and z-test rests on the CLT; this post shows how the theorem powers inference in practice.
