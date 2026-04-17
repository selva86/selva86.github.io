---
title: "Law of Large Numbers vs Central Limit Theorem: Two Laws That Are Not the Same Thing"
slug: "Law-of-Large-Numbers-vs-CLT-in-R"
description: "LLN says sample means converge to the population mean. CLT says their distribution becomes normal. Master both with runnable R simulations in this tutorial."
keywords: "Law of Large Numbers R, Central Limit Theorem R, LLN vs CLT, sampling distribution convergence, Monte Carlo simulation, convergence in probability, convergence in distribution, R statistics tutorial"
auto_link_terms: "Law of Large Numbers|LLN|Central Limit Theorem|CLT|convergence in probability|convergence in distribution|weak law of large numbers|strong law of large numbers"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-17"
curriculum_id: "2.1.10"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "LLN vs CLT"
sidebar_order: 24
difficulty: "Intermediate"
---

# Law of Large Numbers vs Central Limit Theorem: Two Laws That Are Not the Same Thing

<p class="lead">The Law of Large Numbers says the sample mean lands on the true population mean as you collect more data. The Central Limit Theorem says the spread of those sample means around the target follows a normal distribution. One promises a destination; the other promises a shape.</p>

## What's the one-line difference between LLN and CLT?

Here it is in one breath: the **Law of Large Numbers (LLN)** tells you *where* the sample mean lands, and the **Central Limit Theorem (CLT)** tells you *how* sample means scatter around that landing spot. The cleanest way to feel the difference is to draw many samples from a skewed distribution and look at two pictures of the same simulation. The left watches a single running mean march toward the true value. The right stacks many independent sample means into a histogram.

```r title="One path versus many sample means"
set.seed(1)

# LLN view: one long sequence, watch the running mean
run_x <- rexp(10000, rate = 1)            # true mean = 1
running_mean <- cumsum(run_x) / seq_along(run_x)

# CLT view: 5000 independent samples of size 30, collect the means
sample_means_30 <- replicate(5000, mean(rexp(30, rate = 1)))

par(mfrow = c(1, 2))
plot(running_mean, type = "l", log = "x",
     xlab = "n (log scale)", ylab = "Running mean",
     main = "LLN: one path -> true mean")
abline(h = 1, col = "red", lty = 2)

hist(sample_means_30, breaks = 40, col = "lightblue",
     xlab = "Sample mean (n=30)",
     main = "CLT: many means -> Normal")
abline(v = 1, col = "red", lty = 2)

# Numbers behind the pictures:
running_mean[10000]
#> [1] 1.003
mean(sample_means_30)
#> [1] 1.001
sd(sample_means_30)
#> [1] 0.183
1 / sqrt(30)
#> [1] 0.1826
```

The left plot's wiggly line settles on 1, that's LLN. The right plot's histogram is bell-shaped and centered on 1, with an empirical standard deviation of 0.183 that matches the CLT prediction $\sigma/\sqrt{n} = 1/\sqrt{30} \approx 0.183$. Same data, two different questions, two different answers.

[KEY INSIGHT]
**LLN is a statement about one estimate; CLT is a statement about the estimator.** LLN looks at a specific sample mean and says it converges. CLT looks at the rule for producing sample means and describes the distribution of outputs the rule produces. Once that distinction clicks, the two laws stop feeling interchangeable.

**Try it:** Re-run the same simulation but draw sample means from samples of size 5 instead of 30. Look at the histogram width and explain in one sentence what changed.

```r title="Exercise: wider distribution at n=5"
# Try it: smaller n, wider sampling distribution
set.seed(11)
ex_means_5 <- replicate(5000, mean(rexp(5, rate = 1)))

hist(ex_means_5, breaks = 40, col = "lightblue",
     main = "Sample means at n=5")
sd(ex_means_5)
#> Expected: roughly 1/sqrt(5) = 0.447
```

<details>
<summary>Click to reveal solution</summary>

```r title="n=5 solution"
set.seed(11)
ex_means_5 <- replicate(5000, mean(rexp(5, rate = 1)))
sd(ex_means_5)
#> [1] 0.451
```

**Explanation:** Smaller `n` means each sample mean is less precise, so the histogram is wider, its standard deviation grows like `1/sqrt(n)`. With `n=5` the sd is about 0.45, more than double the value at `n=30`.

</details>

## What does the Law of Large Numbers actually say?

The plain-English version is what you saw above: take more and more iid samples and the sample mean closes in on the population mean. The formal version is just that statement made precise.

For independent and identically distributed random variables $X_1, X_2, \ldots, X_n$ with $E[X] = \mu$, the **Weak Law of Large Numbers** says:

$$\bar{X}_n \xrightarrow{P} \mu \quad \text{as } n \to \infty$$

Where:

- $\bar{X}_n = \frac{1}{n}\sum_{i=1}^{n} X_i$, the sample mean of the first $n$ observations
- $\xrightarrow{P}$ means "converges in probability", for any tolerance $\epsilon > 0$, $P(|\bar{X}_n - \mu| > \epsilon) \to 0$
- $\mu$, the true population mean

A stronger version (the **Strong Law of Large Numbers**) replaces convergence in probability with almost-sure convergence. The practical takeaway is the same: the sample mean lands on the truth. The strong version just guarantees that if you watched the simulation forever, almost every individual path would converge, not just *most of them in probability*.

The simulation that makes the LLN feel real is the running proportion of heads in a biased coin flip. Set the true probability to 0.3 and watch the sample proportion home in on it.

```r title="Running proportion of Bernoulli heads"
set.seed(2)

# Simulate 10,000 Bernoulli(0.3) trials
flips <- rbinom(10000, size = 1, prob = 0.3)
running_p <- cumsum(flips) / seq_along(flips)

plot(running_p, type = "l", log = "x",
     xlab = "Number of flips (log scale)",
     ylab = "Running proportion of heads",
     main = "LLN in action: running proportion -> 0.3")
abline(h = 0.3, col = "red", lty = 2)

# Snapshot the running proportion at four sample sizes
running_p[c(10, 100, 1000, 10000)]
#> [1] 0.4000 0.3300 0.3060 0.3014
```

At n=10 the proportion is off by 0.10 from the truth. By n=10,000 the gap is down to 0.0014. The line on the plot doesn't approach the dashed red line in a straight march, it wiggles, sometimes overshoots, sometimes lags. But the wiggles get smaller, and the overall trajectory is locked toward 0.3.

[KEY INSIGHT]
**LLN is the reason simulation works as evidence.** Every Monte Carlo estimate, a probability, an integral, an expected value, leans on LLN to promise that more iterations give a tighter answer. Without it, "I ran a simulation and got X" would be just an anecdote.

**Try it:** Change the bias to `prob = 0.7` and predict before running where the line will settle.

```r title="Exercise: verify convergence to 0.7"
# Try it: predict the convergence target, then verify
set.seed(22)
ex_flips_7 <- rbinom(10000, size = 1, prob = 0.7)
ex_running_7 <- cumsum(ex_flips_7) / seq_along(ex_flips_7)

ex_running_7[10000]
#> Expected: very close to 0.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Convergence-to-0.7 solution"
set.seed(22)
ex_flips_7 <- rbinom(10000, size = 1, prob = 0.7)
ex_running_7 <- cumsum(ex_flips_7) / seq_along(ex_flips_7)
ex_running_7[10000]
#> [1] 0.7008
```

**Explanation:** LLN guarantees the running proportion converges to the true probability `p`. Change `p` and the destination changes accordingly, the plot shape is the same, the dashed line just moves.

</details>

## What does the Central Limit Theorem actually say?

LLN watches one running mean. CLT asks a different question: if you collect *many* sample means from independent samples of size $n$, what does the *distribution* of those means look like? The answer is the surprise, it morphs into a normal regardless of the parent distribution's shape, as long as the parent has finite variance.

The formal statement: for iid $X_1, \ldots, X_n$ with mean $\mu$ and finite variance $\sigma^2$,

$$\sqrt{n}(\bar{X}_n - \mu) \xrightarrow{d} N(0, \sigma^2)$$

Equivalently and more useful in practice:

$$\bar{X}_n \approx N\left(\mu, \frac{\sigma^2}{n}\right) \quad \text{for large } n$$

Where:

- $\xrightarrow{d}$ means "converges in distribution", the cumulative distribution function of $\sqrt{n}(\bar{X}_n - \mu)$ converges to the normal CDF
- $\sigma^2$, the population variance (must be finite)
- $\sigma / \sqrt{n}$, the standard error of the sample mean, the typical CLT scaling

Visualise the convergence by drawing 5000 sample means at three different sample sizes from the same skewed parent (the exponential).

```r title="Sample means at three sample sizes"
set.seed(3)

# 5000 sample means at three sample sizes
clt_means_2  <- replicate(5000, mean(rexp(2,  rate = 1)))
clt_means_10 <- replicate(5000, mean(rexp(10, rate = 1)))
clt_means_30 <- replicate(5000, mean(rexp(30, rate = 1)))

par(mfrow = c(1, 3))
for (i in seq_along(list(clt_means_2, clt_means_10, clt_means_30))) {
  m <- list(clt_means_2, clt_means_10, clt_means_30)[[i]]
  n <- c(2, 10, 30)[i]
  hist(m, breaks = 40, freq = FALSE, col = "lightblue",
       xlab = paste("Sample mean (n =", n, ")"),
       main = paste("n =", n))
  curve(dnorm(x, mean = 1, sd = 1 / sqrt(n)),
        add = TRUE, col = "red", lwd = 2)
}

# Compare empirical vs theoretical sd at each n
sapply(list(clt_means_2, clt_means_10, clt_means_30), sd)
#> [1] 0.7117 0.3162 0.1834
1 / sqrt(c(2, 10, 30))
#> [1] 0.7071 0.3162 0.1826
```

At n=2 the histogram is still visibly skewed, two exponentials averaged together are not yet normal. At n=10 the right tail is still a bit heavier than the red normal curve, but the bulk fits. At n=30 the empirical histogram and the theoretical normal are nearly indistinguishable, and the empirical standard deviations match $1/\sqrt{n}$ to three decimals.

[TIP]
**n ≥ 30 is the textbook rule of thumb.** For moderately skewed distributions like the exponential, sample sizes of 30 and above usually give a tight normal approximation. Heavier skew or smaller `n` calls for a quick sanity check by simulation before trusting the CLT.

**Try it:** Repeat the experiment with a uniform parent `runif(n, 0, 1)`. Predict whether the histograms become normal faster or slower than they did for the exponential.

```r title="Exercise: uniform parent, n=5"
# Try it: uniform parent, faster or slower convergence?
set.seed(33)
ex_unif_means <- replicate(5000, mean(runif(5, 0, 1)))

hist(ex_unif_means, breaks = 40, freq = FALSE,
     col = "lightblue", main = "Sample means of Uniform(0,1), n=5")
curve(dnorm(x, 0.5, sqrt(1/12) / sqrt(5)),
      add = TRUE, col = "red", lwd = 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Uniform-parent solution"
set.seed(33)
ex_unif_means <- replicate(5000, mean(runif(5, 0, 1)))
mean(ex_unif_means); sd(ex_unif_means)
#> [1] 0.4998
#> [1] 0.1289
sqrt(1/12) / sqrt(5)
#> [1] 0.1291
```

**Explanation:** The uniform distribution is symmetric, so the CLT kicks in much faster than for the skewed exponential, even at `n=5` the histogram is visibly bell-shaped. Symmetry buys you smaller required `n`; skew costs you larger `n`.

</details>

## How do LLN and CLT work together in the same simulation?

The two laws are not competing answers to the same question. They are two views of the same experiment. LLN watches the *limit of one path*. CLT watches the *cross-section of many paths*. The link is that the CLT predicts how wide a confidence band the running mean lives inside, and that band shrinks at the $1/\sqrt{n}$ rate.

![LLN and CLT compared](screenshots/Law-of-Large-Numbers-vs-CLT-in-R-side-by-side.webp)

*Figure 1: LLN and CLT ask different questions about the same data, one about destination, one about scatter.*

Make the link concrete by drawing the running mean from an exponential and overlaying the CLT-derived 95% band $\mu \pm 1.96 \cdot \sigma / \sqrt{n}$.

```r title="Running mean inside CLT band"
set.seed(4)
run_clt <- rexp(10000, rate = 1)               # true mean = 1, sd = 1
running_mean_4 <- cumsum(run_clt) / seq_along(run_clt)

n_seq <- seq_along(run_clt)
band_upper <- 1 + 1.96 * 1 / sqrt(n_seq)
band_lower <- 1 - 1.96 * 1 / sqrt(n_seq)

plot(running_mean_4, type = "l", log = "x",
     xlab = "n (log scale)", ylab = "Running mean",
     main = "LLN running mean inside CLT 95% band",
     ylim = c(0, 2))
lines(band_upper, col = "blue", lty = 2)
lines(band_lower, col = "blue", lty = 2)
abline(h = 1, col = "red", lty = 2)

# Band width shrinks as 1/sqrt(n)
2 * 1.96 / sqrt(c(100, 1000, 10000))
#> [1] 0.3920 0.1240 0.0392
```

The blue dashed band funnels in toward the red true-mean line, and the running mean stays inside it (with brief excursions, which is exactly what a 95% band predicts). The band's full width drops from 0.39 at n=100 to 0.039 at n=10,000, a tenfold shrinkage for a 100-fold increase in `n`, the signature $1/\sqrt{n}$ rate.

| Question | LLN | CLT |
|---|---|---|
| What converges? | The sample mean $\bar{X}_n$ | The distribution of $\bar{X}_n$ |
| Type of convergence | In probability (or almost surely) | In distribution |
| Requires finite mean? | Yes | Yes |
| Requires finite variance? | No | Yes |
| Gives a distribution? | No, just a destination | Yes, Normal$(\mu, \sigma^2/n)$ |
| Practical use | Justifies Monte Carlo estimates | Builds confidence intervals and tests |

[NOTE]
**This band is exactly how confidence intervals are born.** A 95% confidence interval for the population mean is just $\bar{X}_n \pm 1.96 \cdot \hat{\sigma}/\sqrt{n}$, the CLT band centered on the observed sample mean instead of the true mean. The whole machinery of inferential statistics rides on this one fact.

**Try it:** Compute the CLT half-band width at n=2500 by hand (using $\sigma=1$) and verify against the simulation's running standard error.

```r title="Exercise: half-band at n=2500"
# Try it: half-band = 1.96 * sigma / sqrt(n) at n=2500
ex_se_2500 <- 1.96 * 1 / sqrt(2500)
ex_se_2500
#> Expected: 0.0392
```

<details>
<summary>Click to reveal solution</summary>

```r title="Half-band solution"
ex_se_2500 <- 1.96 * 1 / sqrt(2500)
ex_se_2500
#> [1] 0.0392
```

**Explanation:** The CLT half-band is $1.96 \cdot \sigma / \sqrt{n}$. Plug in $\sigma=1$ and $n=2500$ to get 0.0392. That matches `band_upper[2500] - 1` from the simulation, the half-distance from the true mean to the upper band edge.

</details>

## When do LLN and CLT break down?

Both laws come with fine print. LLN needs the population mean to exist. CLT needs the population variance to be finite. Heavy-tailed distributions can violate either condition, and the cleanest demonstration of failure is the **Cauchy distribution**, it has no finite mean at all, so LLN fails and CLT-style normality of sample means never appears.

![When does each law apply?](screenshots/Law-of-Large-Numbers-vs-CLT-in-R-decision.webp)

*Figure 2: A simple decision tree for when each law applies.*

Draw 10,000 Cauchy values, compute the running mean, and watch it refuse to settle.

```r title="Cauchy breaks LLN; exponential does not"
set.seed(5)

# Heavy-tailed Cauchy vs well-behaved Exponential
cauchy_x <- rcauchy(10000)
exp_x    <- rexp(10000, rate = 1)

cauchy_run <- cumsum(cauchy_x) / seq_along(cauchy_x)
exp_run    <- cumsum(exp_x)    / seq_along(exp_x)

par(mfrow = c(1, 2))
plot(cauchy_run, type = "l", log = "x",
     xlab = "n (log scale)", ylab = "Running mean",
     main = "Cauchy: LLN fails")
abline(h = 0, col = "red", lty = 2)

plot(exp_run, type = "l", log = "x",
     xlab = "n (log scale)", ylab = "Running mean",
     main = "Exponential: LLN holds")
abline(h = 1, col = "red", lty = 2)

# Cauchy running mean refuses to settle
cauchy_run[c(100, 1000, 10000)]
#> [1] -0.3145  0.0429 -0.4128
exp_run[c(100, 1000, 10000)]
#> [1] 1.0466 1.0124 1.0023
```

The exponential running mean clamps onto 1 and never lets go. The Cauchy running mean jumps wildly even at n=10,000, sometimes wandering by half a unit between snapshots. A single extreme draw can shift the running mean significantly because the Cauchy's tails decay so slowly that very large values keep arriving at every scale. Re-running with a different seed gives a totally different trajectory.

[WARNING]
**LLN failures are silent.** The simulation does not throw an error or warn. It just produces a number that looks like an estimate but isn't converging to anything. If you summarize a heavy-tailed dataset with `mean()` and report it as a population estimate, you may be reporting noise, always check for finite mean and variance before quoting Monte Carlo means.

**Try it:** Use a Student's t with `df=2` (heavy tail, finite mean but infinite variance). Predict whether LLN holds and whether CLT holds, then check.

```r title="Exercise: Student-t with df=2"
# Try it: t with df=2 — finite mean, infinite variance
set.seed(55)
ex_t2 <- rt(10000, df = 2)
ex_t2_run <- cumsum(ex_t2) / seq_along(ex_t2)

ex_t2_run[c(100, 1000, 10000)]
#> Expected: drifts toward 0 (LLN holds) but slowly
```

<details>
<summary>Click to reveal solution</summary>

```r title="t(df=2) solution"
set.seed(55)
ex_t2 <- rt(10000, df = 2)
ex_t2_run <- cumsum(ex_t2) / seq_along(ex_t2)
ex_t2_run[c(100, 1000, 10000)]
#> [1]  0.16480 -0.05240 -0.00867

# CLT-style sample-mean histogram: should look ragged at n=30
ex_t2_means <- replicate(5000, mean(rt(30, df = 2)))
sd(ex_t2_means)
#> [1] 0.6843  # much wider than 1/sqrt(30) due to infinite variance
```

**Explanation:** A `t(df=2)` distribution has a finite mean (zero) but infinite variance. LLN still holds, the running mean drifts toward zero but more erratically than for a thin-tailed distribution. CLT, however, fails: the sampling distribution of the mean is still heavy-tailed and not well approximated by a normal at any practical `n`.

</details>

## Practice Exercises

These capstone exercises combine the concepts from each section. They use distinct variable names (prefixed `my_`) so they do not overwrite tutorial state.

### Exercise 1: Empirical convergence rate of the LLN

Estimate the LLN convergence rate. Take a running mean of 50,000 draws from `rexp(rate = 2)` (true mean 0.5). Compute the absolute error from 0.5 at n = 100, 1000, and 10,000 and confirm the error shrinks by roughly a factor of $\sqrt{10}$ each time (the $1/\sqrt{n}$ rate).

```r title="Exercise: LLN convergence rate"
# Exercise: LLN convergence rate
# Hint: cumsum(x) / seq_along(x), then index at the three sample sizes.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Convergence-rate solution"
set.seed(101)
my_x <- rexp(50000, rate = 2)
my_running <- cumsum(my_x) / seq_along(my_x)
my_errors <- abs(my_running[c(100, 1000, 10000)] - 0.5)
my_errors
#> [1] 0.05344 0.01196 0.00405

# Ratios should be roughly sqrt(10) = 3.16
my_errors[1] / my_errors[2]
#> [1] 4.47
my_errors[2] / my_errors[3]
#> [1] 2.95
```

**Explanation:** LLN promises convergence; CLT pins down the rate. The absolute error of the running mean shrinks as $\sigma/\sqrt{n}$, so a 100x increase in `n` should reduce error by about $\sqrt{100} = 10$. Two factors of $\sqrt{10}$ (each between 1000x intervals) should each be near 3.16, small-sample noise pushes them off slightly but the order of magnitude matches.

</details>

### Exercise 2: CLT for a sample proportion

Demonstrate CLT for a sample proportion. Simulate 5000 experiments where each experiment is 100 fair coin flips. The sample proportion is the count of heads divided by 100. Plot a histogram of the 5000 sample proportions and overlay the CLT-predicted normal $N(0.5, 0.05)$.

```r title="Exercise: CLT for sample proportion"
# Exercise: CLT for a sample proportion
# Hint: rbinom(1, 100, 0.5) inside replicate(5000, ...) gives the count.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Sample-proportion solution"
set.seed(202)
my_props <- replicate(5000, rbinom(1, 100, 0.5) / 100)

hist(my_props, breaks = 40, freq = FALSE, col = "lightblue",
     xlab = "Sample proportion (n=100 flips)",
     main = "CLT for sample proportion of heads")
curve(dnorm(x, mean = 0.5, sd = 0.05),
      add = TRUE, col = "red", lwd = 2)

mean(my_props); sd(my_props)
#> [1] 0.4999
#> [1] 0.0497
```

**Explanation:** For a Bernoulli with $p = 0.5$, the variance of one trial is $p(1-p) = 0.25$. The standard error of the sample proportion at $n = 100$ is $\sqrt{0.25/100} = 0.05$. The histogram and the overlaid normal match almost exactly, a textbook CLT.

</details>

### Exercise 3: Borderline case, Pareto with shape α=3

Investigate whether CLT applies to a Pareto distribution with shape $\alpha = 3$. Simulate it via $X = U^{-1/\alpha}$ where $U \sim$ Uniform(0,1). The distribution has finite mean $\alpha/(\alpha-1) = 1.5$ and finite variance only when $\alpha > 2$. Draw 5000 sample means of size 30, plot the histogram, and overlay the theoretical normal.

```r title="Exercise: CLT for Pareto(alpha=3)"
# Exercise: CLT for Pareto(alpha=3)
# Hint: Pareto sample = U^(-1/alpha) for U ~ Uniform(0,1).
# True mean = alpha/(alpha-1) = 1.5
# True variance = alpha / ((alpha-1)^2 * (alpha-2)) = 0.75

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Pareto solution"
set.seed(303)
alpha <- 3
true_mean <- alpha / (alpha - 1)        # 1.5
true_var  <- alpha / ((alpha - 1)^2 * (alpha - 2))  # 0.75

my_pareto_means <- replicate(5000, {
  u <- runif(30)
  mean(u^(-1 / alpha))
})

hist(my_pareto_means, breaks = 40, freq = FALSE, col = "lightblue",
     xlab = "Sample mean (n=30, Pareto alpha=3)",
     main = "CLT for Pareto(alpha=3)")
curve(dnorm(x, mean = true_mean, sd = sqrt(true_var / 30)),
      add = TRUE, col = "red", lwd = 2)

mean(my_pareto_means); sd(my_pareto_means)
#> [1] 1.520
#> [1] 0.171
sqrt(true_var / 30)
#> [1] 0.158
```

**Explanation:** Pareto with $\alpha = 3$ has finite variance, so CLT should apply, and it does. The empirical mean (1.52) is close to the theoretical 1.5, and the empirical sd (0.171) is close to the theoretical 0.158. A small upward bias in the sd is the signature of a still-heavy right tail at `n=30`, bumping `n` to 100 would close the gap further.

</details>

## Complete Example: A/B test sample size from first principles

Tie LLN and CLT together with a concrete A/B test problem. A product manager observes a 0.5 percentage-point conversion lift in a small test (1000 users per group) and asks: how big does the test need to be before that estimated lift is trustworthy?

LLN tells you the estimate eventually lands on the truth. CLT tells you how wide the uncertainty band is for any given `n`. The sample size formula falls right out of the CLT.

For a desired margin of error `E` at 95% confidence, the required sample size per group is:

$$n = \left(\frac{1.96 \cdot \sigma}{E}\right)^2$$

For a Bernoulli with `p ≈ 0.05` (a realistic conversion baseline), $\sigma \approx \sqrt{p(1-p)} \approx 0.218$. Pick a target margin of error of 0.2 percentage points (so we can distinguish a 0.5pp lift from zero with confidence).

```r title="A/B test sample size from CLT"
set.seed(42)

# Inputs from the business problem
observed_lift <- 0.005     # 0.5 percentage points
baseline_p    <- 0.05      # 5% baseline conversion
target_E      <- 0.002     # margin of error: 0.2 percentage points

# CLT-derived sample size per group
sigma_per_user <- sqrt(baseline_p * (1 - baseline_p))
required_n <- ceiling((1.96 * sigma_per_user / target_E)^2)
required_n
#> [1] 45619

# Standard error of the lift estimator at this n
se_per_group <- sigma_per_user / sqrt(required_n)
se_lift <- sqrt(2) * se_per_group     # variance of A - B = sum of variances
se_lift
#> [1] 0.00144

# Simulate one A/B test at this n with a true 0.5pp lift
control   <- rbinom(required_n, 1, baseline_p)
treatment <- rbinom(required_n, 1, baseline_p + observed_lift)
sim_lift  <- mean(treatment) - mean(control)
sim_lift
#> [1] 0.0048

# 95% CI for the simulated lift
sim_lift + c(-1.96, 1.96) * se_lift
#> [1] 0.00197 0.00765
```

The required sample size is about 45,600 per group. At that size the standard error of the lift is 0.00144, so a 0.5pp lift is roughly 3.5 standard errors away from zero, clearly significant. The simulated A/B test produced a 0.48pp lift, and the 95% CI [0.20pp, 0.77pp] excludes zero, the test would correctly conclude the lift is real. At the original 1000 users per group, the standard error would have been about 0.0098, so a 0.5pp lift would be only half a standard error from zero, statistically indistinguishable from random noise.

[TIP]
**Halving your margin of error means quadrupling your sample.** The CLT formula $n \propto 1/E^2$ is the most useful piece of arithmetic in applied statistics. Wanting a smaller error band by a factor of 2 costs a factor of 4 in sample size. Wanting it 10x tighter costs 100x.

This is LLN and CLT working together in production: LLN justifies *why* a large enough sample will give the right answer, and CLT tells you *how large* that sample needs to be.

## Summary

| Aspect | Law of Large Numbers | Central Limit Theorem |
|---|---|---|
| One-line | Sample mean → true mean | Sample-mean distribution → Normal |
| Convergence type | In probability (Weak) or almost sure (Strong) | In distribution |
| Requires finite mean? | Yes | Yes |
| Requires finite variance? | No | Yes |
| Output | A point (the destination) | A shape (Normal) |
| Rate of convergence | $\sigma/\sqrt{n}$ for the absolute error | Same $1/\sqrt{n}$ scaling |
| Practical use | Justifies Monte Carlo, simulation, sample averages | Confidence intervals, hypothesis tests, sample size formulas |
| Common failure case | Cauchy (no mean) | Cauchy or `t(df=2)` (infinite variance) |

The two laws are complementary. LLN says *where* the sample mean lands; CLT says *how* it scatters around the landing spot. Confusing them is the most common mistake in introductory statistics, and the most consequential, because almost every applied technique (CIs, t-tests, A/B tests, bootstrap) leans on the CLT's distributional promise, not just LLN's destination promise.

## References

1. Wasserman, L., *All of Statistics*, Chapter 5 (Convergence of Random Variables). Springer (2004). [Link](https://www.stat.cmu.edu/~larry/all-of-statistics/)
2. Casella, G. & Berger, R., *Statistical Inference*, 2nd Edition, Chapter 5 (Properties of a Random Sample). Cengage (2002).
3. Wickham, H., *Advanced R*, 2nd Edition, Chapter 23 (Measuring performance). CRC Press (2019). [Link](https://adv-r.hadley.nz/)
4. R Core Team, Distributions reference (`rcauchy`, `rexp`, `rbinom`, `rt`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html)
5. MIT 18.05, Central Limit Theorem and the Law of Large Numbers, Class 6 prep notes. [Link](https://math.mit.edu/~dav/05.dir/class6-prep.pdf)
6. Wikipedia, Law of Large Numbers. [Link](https://en.wikipedia.org/wiki/Law_of_large_numbers)
7. Wikipedia, Central Limit Theorem. [Link](https://en.wikipedia.org/wiki/Central_limit_theorem)

## Continue Learning

- [Central Limit Theorem in R: Simulate It From Skewed, Bimodal, and Uniform Distributions](Central-Limit-Theorem-in-R.html), go deeper on CLT with parent shapes the simulation in this article didn't cover.
- [Sampling Distributions in R: What Actually Varies Across Repeated Samples](Sampling-Distributions-in-R.html), the underlying machinery both laws describe.
- [Normal, t, F, and Chi-Squared in R: Understand Each Distribution and When It Arises](Normal-t-F-and-Chi-Squared-Distributions-in-R.html), the limit distributions referenced throughout this tutorial.
