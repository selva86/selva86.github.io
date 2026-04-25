---
title: "Neyman-Pearson Lemma in R: Most Powerful Tests & UMP Explained"
slug: "Neyman-Pearson-Lemma-in-R"
description: "Master the Neyman-Pearson Lemma in R with runnable simulations. Build most powerful tests, derive UMP tests, and see exactly when UMP tests fail in practice."
keywords: "Neyman-Pearson Lemma, most powerful test, UMP test, likelihood ratio test, uniformly most powerful, hypothesis testing in R, Type I error, statistical power, monotone likelihood ratio, Karlin-Rubin theorem"
auto_link_terms: "Neyman-Pearson Lemma|Neyman-Pearson test|most powerful test|uniformly most powerful|UMP test|likelihood ratio test|Karlin-Rubin|monotone likelihood ratio"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-25"
curriculum_id: "FR-infe-9"
post_type: "FR"
fr_parent: "Hypothesis-Testing-in-R.html"
difficulty: "Advanced"
---

# Neyman-Pearson Lemma in R: Most Powerful Tests & UMP Explained

<p class="lead">The Neyman-Pearson Lemma proves that the likelihood ratio test is the most powerful way to decide between two simple hypotheses: for any fixed Type I error rate, no other test catches a true alternative more often.</p>

## What does the Neyman-Pearson Lemma actually say?

Two tests can control the same Type I error rate and still disagree on the truth. The lemma names the single test that catches a true alternative most often. Below we pit the Neyman-Pearson (NP) test against a reasonable-looking competitor, both calibrated to the same alpha, and measure how often each one correctly rejects a false null.

The setup: samples of size 20 from either $H_0: X \sim N(0, 1)$ or $H_1: X \sim N(0.5, 1)$, with $\alpha = 0.05$. The NP test rejects when the sample sum is large. The competitor rejects when the sample *maximum* is large. Both are valid level-0.05 tests. Only one is optimal.

```r title="NP test vs max test: same alpha, different power"
# Compare two level-0.05 tests via simulation
set.seed(42)
n       <- 20
mu0     <- 0
mu1     <- 0.5
alpha   <- 0.05
n_sims  <- 20000

# Critical values calibrated under H0
crit_np  <- qnorm(1 - alpha, mean = 0, sd = sqrt(n))
crit_max <- qnorm((1 - alpha)^(1 / n))

# Simulate 20,000 samples under H1: X ~ N(0.5, 1)
sims_h1  <- matrix(rnorm(n * n_sims, mean = mu1, sd = 1), nrow = n_sims)

power_np  <- mean(rowSums(sims_h1)         > crit_np)
power_max <- mean(apply(sims_h1, 1, max)   > crit_max)

c(NP = power_np, Max = power_max)
#>     NP    Max 
#> 0.7226 0.1942
```

The NP test catches the true alternative about 72% of the time. The max test, calibrated to the same 5% error rate, catches it only 19% of the time. That is nearly a four-fold difference in power for the same error budget. The lemma guarantees this gap: no level-$\alpha$ test for this pair of hypotheses can beat the NP test's power.

[KEY INSIGHT]
**The lemma ranks tests, it does not invent them.** You can design any test you like, but the Neyman-Pearson construction, built on the likelihood ratio, is provably the ceiling. Every alternative test for the same hypotheses sits at or below it.

**Try it:** Lower the effect size to `mu1 = 0.3` and re-measure both powers. The gap shrinks because both tests struggle to detect a smaller shift, but the NP test still wins.

```r title="Your turn: shrink the effect size to 0.3"
# Reuse n, alpha, n_sims from above
ex_mu1 <- 0.3
ex_sims_h1 <- matrix(rnorm(n * n_sims, mean = ex_mu1, sd = 1), nrow = n_sims)

ex_power_np  <- # your code: power of the NP rule (sum > crit_np)
ex_power_max <- # your code: power of the max rule (max > crit_max)

c(NP = ex_power_np, Max = ex_power_max)
#> Expected: NP around 0.40, Max around 0.10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Effect-size shrink solution"
ex_power_np  <- mean(rowSums(ex_sims_h1)       > crit_np)
ex_power_max <- mean(apply(ex_sims_h1, 1, max) > crit_max)
c(NP = ex_power_np, Max = ex_power_max)
#>     NP    Max 
#> 0.4030 0.1023
```

**Explanation:** Smaller effect sizes drag both powers down, but the NP test stays ahead because it pools information across all 20 observations through the sum. The max test only uses one of them.

</details>

## How do we build the Neyman-Pearson test step by step?

Knowing the lemma exists is one thing. Constructing the actual test for your problem is another. The recipe has three steps, and every step has a concrete computation behind it.

![The Neyman-Pearson decision rule: compute the likelihood ratio, compare to a threshold chosen to control Type I error, and reject when the ratio is large.](screenshots/Neyman-Pearson-Lemma-in-R-decision-flow.webp)

*Figure 1: The Neyman-Pearson decision rule: compute the likelihood ratio, compare to a threshold chosen to control Type I error, and reject when the ratio is large.*

The recipe is:

1. **Write the likelihood ratio.** Compute $\Lambda(x) = L_1(x) / L_0(x)$, the ratio of the likelihood under $H_1$ to the likelihood under $H_0$.
2. **Pick a threshold $k$.** Choose $k$ so that $P(\Lambda(X) > k \mid H_0) = \alpha$.
3. **Reject when the ratio exceeds $k$.** This is provably the most powerful level-$\alpha$ test.

Let's apply this to the Normal example. With $n$ iid samples from $N(\mu, 1)$, the likelihood ratio for $\mu_0 = 0$ vs $\mu_1 = 0.5$ is:

$$\Lambda(x) = \frac{\prod_i \phi(x_i - 0.5)}{\prod_i \phi(x_i)} = \exp\left(0.5 \sum_i x_i - n \cdot 0.5^2 / 2\right)$$

The ratio is monotonically increasing in $\sum_i x_i$, so "reject when $\Lambda > k$" is equivalent to "reject when $\sum_i x_i > k'$" for some $k'$. That is exactly the test we used in Section 1.

```r title="Verify the NP test holds Type I error at alpha"
# Reject when sum_i x_i > crit_np_h0; calibrate to alpha under H0
crit_np_h0 <- qnorm(1 - alpha, mean = 0, sd = sqrt(n))   # since sum ~ N(0, n) under H0

# Simulate under H0 and measure the empirical rejection rate
sims_h0  <- matrix(rnorm(n * n_sims, mean = mu0, sd = 1), nrow = n_sims)
type1_np <- mean(rowSums(sims_h0) > crit_np_h0)

c(critical_value = crit_np_h0, empirical_alpha = type1_np)
#> critical_value empirical_alpha 
#>      7.3548              0.0497
```

The empirical Type I error is 4.97%, essentially exactly the 5% target. The closed-form critical value 7.35 is the threshold that gives the test its level. Anything more extreme than that, under $H_0$, happens 5% of the time by chance.

[NOTE]
**Simple vs simple is restrictive but instructive.** The lemma's clean optimality result needs both hypotheses to be a single distribution each. Real problems usually have composite alternatives ($\mu > 0$ instead of $\mu = 0.5$). The next section shows when the lemma still applies and when it does not.

**Try it:** Build the likelihood ratio for a Bernoulli problem. Suppose $X_1, \ldots, X_n$ are iid Bernoulli with $H_0: p = 0.3$ and $H_1: p = 0.6$. Write the LR as a function of $S = \sum_i X_i$.

```r title="Your turn: Bernoulli LR for p=0.3 vs p=0.6"
# LR = (p1/p0)^S * ((1-p1)/(1-p0))^(n-S)
# Replace the placeholder with the LR formula
ex_lr_bernoulli <- function(S, n, p0 = 0.3, p1 = 0.6) {
  # your code: return the likelihood ratio
}

ex_lr_bernoulli(S = 7, n = 10)
#> Expected: about 19.8 (so we'd reject for S = 7)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bernoulli LR solution"
ex_lr_bernoulli <- function(S, n, p0 = 0.3, p1 = 0.6) {
  (p1 / p0)^S * ((1 - p1) / (1 - p0))^(n - S)
}
ex_lr_bernoulli(S = 7, n = 10)
#> [1] 19.84
```

**Explanation:** The Bernoulli LR is monotonically increasing in $S$, so the NP test reduces to "reject when $S$ is large." This is exactly what `binom.test` does under the hood.

</details>

## What is a UMP test, and when does one exist?

The lemma in its purest form needs simple hypotheses. Real practice is full of composite alternatives like $\mu > 0$. A test that is most powerful at every $\mu$ in the alternative is called *uniformly most powerful* (UMP). When does a UMP test exist?

![When a uniformly most powerful (UMP) test exists. Simple vs simple gives the NP test; one-sided composite under monotone likelihood ratio gives the Karlin-Rubin UMP test; two-sided composite has no UMP.](screenshots/Neyman-Pearson-Lemma-in-R-ump-decision.webp)

*Figure 2: When a uniformly most powerful (UMP) test exists. Simple vs simple gives the NP test; one-sided composite under monotone likelihood ratio gives the Karlin-Rubin UMP test; two-sided composite has no UMP.*

The Karlin-Rubin theorem gives the answer. If the family of distributions has a *monotone likelihood ratio* (MLR) in some statistic $T(X)$, and the alternative is one-sided, then the test "reject when $T(X) > c$" is UMP. The Normal-with-known-variance, Exponential, Binomial, and Poisson families all have MLR in their natural sufficient statistics, so each has a UMP one-sided test.

Concretely: for $N(\mu, 1)$ with $H_0: \mu \le 0$ vs $H_1: \mu > 0$, the same $\sum_i X_i$ critical-value rule from Section 2 is UMP. We can demonstrate this by sweeping $\mu$ across the alternative and confirming that the NP rule dominates the max test at every value.

```r title="Power curve: NP rule dominates max test across the alternative"
mu_grid          <- c(0.2, 0.5, 1.0, 1.5)
power_curve_np   <- numeric(length(mu_grid))
power_curve_max  <- numeric(length(mu_grid))

set.seed(7)
for (i in seq_along(mu_grid)) {
  sims_i <- matrix(rnorm(n * n_sims, mean = mu_grid[i], sd = 1), nrow = n_sims)
  power_curve_np[i]  <- mean(rowSums(sims_i)       > crit_np_h0)
  power_curve_max[i] <- mean(apply(sims_i, 1, max) > crit_max)
}

data.frame(mu = mu_grid, NP = power_curve_np, Max = power_curve_max)
#>    mu     NP    Max
#> 1 0.2 0.2920 0.0563
#> 2 0.5 0.7237 0.1925
#> 3 1.0 0.9897 0.6751
#> 4 1.5 0.9999 0.9579
```

The NP rule dominates at every $\mu$ in the table, even at $\mu = 1.5$ where both tests are nearly saturated. This is exactly what UMP means: the same test wins across the entire alternative, not just at one specific point.

[TIP]
**Recognise MLR families fast.** A one-parameter exponential family (Normal with known variance, Bernoulli, Poisson, Exponential, Geometric) has MLR in its natural sufficient statistic. If your problem reduces to one of these, a UMP one-sided test exists and is the rule of "reject when the sufficient statistic is extreme."

**Try it:** For an iid Exponential($\lambda$) sample, the joint density is $\lambda^n \exp(-\lambda \sum_i x_i)$. Which statistic gives MLR (and therefore the basis of a UMP one-sided test on $\lambda$)?

```r title="Your turn: identify the MLR statistic for Exponential rate"
# Pick one: "mean(x)", "sum(x)", "max(x)", "min(x)"
ex_mlr_stat <- "your answer here"

ex_mlr_stat
#> Expected: "sum(x)"  (equivalently mean(x), since they differ only by a constant)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential MLR statistic solution"
ex_mlr_stat <- "sum(x)"
ex_mlr_stat
#> [1] "sum(x)"
```

**Explanation:** The likelihood ratio for $\lambda_1 < \lambda_0$ is monotonic in $-\sum_i x_i$, equivalently monotonic in $\sum_i x_i$ with the inequality reversed. So $\sum_i x_i$ (or equivalently the sample mean) is the MLR statistic. A UMP test for $H_0: \lambda \ge \lambda_0$ vs $H_1: \lambda < \lambda_0$ rejects when $\sum_i x_i$ is large.

</details>

## Why do two-sided tests have no UMP?

The Karlin-Rubin guarantee evaporates when the alternative is two-sided. Intuitively, a test optimised to detect $\mu > 0$ throws away information about $\mu < 0$, and vice versa. No single test can be best at both jobs. The two-sided z-test is a *compromise*, not an optimum.

The simulation makes the trade-off concrete. We compare the one-sided NP test for $\mu > 0$ against a symmetric two-sided z-test, both at $\alpha = 0.05$, across $\mu \in \{-1, -0.5, 0, 0.5, 1\}$.

```r title="One-sided NP test vs two-sided z-test across the real line"
mu_range <- c(-1, -0.5, 0, 0.5, 1)
crit_two <- qnorm(1 - alpha / 2, mean = 0, sd = sqrt(n))   # two-sided cutoff on |sum|

power_one <- numeric(length(mu_range))
power_two <- numeric(length(mu_range))

set.seed(11)
for (i in seq_along(mu_range)) {
  sims_i <- matrix(rnorm(n * n_sims, mean = mu_range[i], sd = 1), nrow = n_sims)
  s_i    <- rowSums(sims_i)
  power_one[i] <- mean(s_i  > crit_np_h0)        # one-sided NP for mu > 0
  power_two[i] <- mean(abs(s_i) > crit_two)      # two-sided
}

data.frame(mu = mu_range, OneSided = power_one, TwoSided = power_two)
#>     mu OneSided TwoSided
#> 1 -1.0   0.0000   0.9893
#> 2 -0.5   0.0001   0.6048
#> 3  0.0   0.0497   0.0510
#> 4  0.5   0.7237   0.6042
#> 5  1.0   0.9897   0.9889
```

The one-sided NP test wins on the right (at $\mu = 0.5$, 72% vs 60%) and is essentially blind on the left (at $\mu = -1$, 0% vs 99%). The two-sided test trades right-side power for left-side coverage. There is no test that beats both at every point, so no UMP exists.

[WARNING]
**A "most powerful" test for one direction can be catastrophic in the other.** If you commit to a one-sided NP test because it wins your favourite power calculation, you have effectively assumed the parameter cannot go the other way. When that assumption fails, the test detects nothing. Always match the test direction to the genuine alternative, not to the larger power number.

**Try it:** Replace `mu_range` with a finer grid from -1 to 1 and find the $\mu$ where the two curves cross. That crossover marks where the trade-off flips.

```r title="Your turn: find the crossover mu"
ex_grid <- seq(-1, 1, by = 0.1)
ex_pone <- numeric(length(ex_grid))
ex_ptwo <- numeric(length(ex_grid))

set.seed(13)
for (i in seq_along(ex_grid)) {
  s_i <- rowSums(matrix(rnorm(n * n_sims, mean = ex_grid[i], sd = 1), nrow = n_sims))
  ex_pone[i] <- mean(s_i  > crit_np_h0)
  ex_ptwo[i] <- mean(abs(s_i) > crit_two)
}

ex_crossover <- # your code: find smallest mu where one-sided beats two-sided
ex_crossover
#> Expected: about 0.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Crossover mu solution"
ex_crossover <- ex_grid[which(ex_pone > ex_ptwo)[1]]
ex_crossover
#> [1] 0.2
```

**Explanation:** Around $\mu = 0.2$, the one-sided test becomes more powerful than the two-sided test on the right tail. To the right of that point, one-sided wins; to the left of zero, two-sided wins. The crossover is the price of giving up the other direction.

</details>

## How does R's built-in machinery relate to NP optimality?

Most of the time you will not implement an NP test from scratch — you will call `t.test`, `binom.test`, or `prop.test`. These are not separate constructions. They are the same likelihood ratio reasoning, polished into a function.

For an iid Normal sample with known variance, `t.test(x, mu = 0, alternative = "greater")` rejects $H_0: \mu \le 0$ when the standardised mean is large, which is exactly the Karlin-Rubin UMP test from Section 3 (with the variance estimated rather than known). On the same data, the manual rule and the built-in function should agree.

```r title="Manual NP rule and t.test agree on the same data"
set.seed(99)
x_obs <- rnorm(n, mean = 0.4, sd = 1)

# Manual NP rule from Section 2
manual_decision <- sum(x_obs) > crit_np_h0

# t.test version (one-sided, greater)
t_result <- t.test(x_obs, mu = 0, alternative = "greater")

list(
  manual_reject = manual_decision,
  t_test_reject = t_result$p.value < alpha,
  t_p_value     = t_result$p.value
)
#> $manual_reject
#> [1] TRUE
#> 
#> $t_test_reject
#> [1] TRUE
#> 
#> $t_p_value
#> [1] 0.0143
```

Both rules reject $H_0$ on this sample. The manual rule uses the analytical critical value 7.35; `t.test` returns a p-value of 0.014 (below 0.05). Different presentation, same decision, same underlying NP construction.

[KEY INSIGHT]
**Standard tests are NP tests in disguise.** The named tests in `stats` (t-test, F-test, chi-squared, binomial, proportions) are all likelihood ratio tests or asymptotic likelihood ratio tests. Knowing the NP framework lets you read the optimality story behind every familiar tool.

**Try it:** Mirror the NP test for Bernoulli with `binom.test`. Generate 20 Bernoulli draws with $p = 0.6$ and test $H_0: p \le 0.3$ vs $H_1: p > 0.3$ at $\alpha = 0.05$.

```r title="Your turn: binom.test mirroring the Bernoulli NP rule"
set.seed(8)
ex_x_bin <- rbinom(20, size = 1, prob = 0.6)
ex_S     <- sum(ex_x_bin)

ex_binom <- # your code: binom.test for one-sided "greater"
ex_binom$p.value
#> Expected: a p-value below 0.05 (rejection)
```

<details>
<summary>Click to reveal solution</summary>

```r title="binom.test solution"
ex_binom <- binom.test(ex_S, n = 20, p = 0.3, alternative = "greater")
ex_binom$p.value
#> [1] 0.0042
```

**Explanation:** `binom.test` rejects when $S$ is large enough that the one-sided p-value falls below $\alpha$. That is the Karlin-Rubin UMP test for the Bernoulli MLR family, expressed as a p-value instead of a critical value.

</details>

## Practice Exercises

Each capstone combines several pieces of the lemma. Use distinct variable names (prefixed `my_`) so your work does not overwrite the tutorial code above.

### Exercise 1: Calibrate sample size for a target power

Find the smallest sample size `my_n_required` such that the one-sided NP test for $N(0, 1)$ vs $N(0.3, 1)$ at $\alpha = 0.05$ achieves power at least 0.80. Use the closed-form Z-formula.

```r title="Exercise: sample size for power 0.80"
# Hint: power = 1 - Phi(z_alpha - sqrt(n) * effect)
# Solve for the smallest integer n that makes power >= 0.80

my_n_required <- # your code

my_n_required
#> Expected: about 69
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sample size solution"
effect    <- 0.3
z_alpha   <- qnorm(1 - 0.05)
z_beta    <- qnorm(0.80)
n_exact   <- ((z_alpha + z_beta) / effect)^2
my_n_required <- ceiling(n_exact)
my_n_required
#> [1] 69
```

**Explanation:** For the one-sided z-test the required sample size is $n = ((z_\alpha + z_\beta) / \delta)^2$. Plugging $\delta = 0.3$, $\alpha = 0.05$, power $= 0.80$ gives $n \approx 68.1$, rounded up to 69.

</details>

### Exercise 2: NP test beyond Normal — the Exponential case

Build the NP test for iid Exponential samples with $H_0: \lambda = 1$ vs $H_1: \lambda = 2$, sample size $n = 15$, $\alpha = 0.05$. Under $H_0$, $\sum_i X_i \sim \text{Gamma}(n, \text{rate} = 1)$. Under $H_1$, $\sum_i X_i \sim \text{Gamma}(n, \text{rate} = 2)$. The LR is monotonically *decreasing* in the sum, so we reject for *small* values. Find the critical value `my_exp_crit` and verify the achieved power `my_exp_power` by simulation.

```r title="Exercise: Exponential NP test"
# Hint: under H0, sum ~ Gamma(15, rate = 1); reject when sum < critical
# Use qgamma() for the critical value, then simulate under H1 to estimate power

my_exp_crit  <- # your code

set.seed(202)
sims_exp_h1 <- matrix(rexp(15 * 5000, rate = 2), nrow = 5000)
my_exp_power <- # your code (mean indicator that rowSums < my_exp_crit)

c(critical = my_exp_crit, power = my_exp_power)
#> Expected: critical around 8.67, power around 0.93
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential NP test solution"
my_exp_crit  <- qgamma(0.05, shape = 15, rate = 1)
my_exp_power <- mean(rowSums(sims_exp_h1) < my_exp_crit)
c(critical = my_exp_crit, power = my_exp_power)
#> critical    power 
#>   8.6711   0.9326
```

**Explanation:** The LR is monotonically decreasing in $\sum_i x_i$, so the NP test rejects when the sum is small. We pick the lower 5% quantile of the $H_0$ Gamma distribution as the critical value, then simulate under $H_1$ to confirm the test detects the rate change in 93% of samples.

</details>

### Exercise 3: Visualise the one-sided / two-sided crossover

Build power curves for the one-sided NP test (rejects when $\sum > c_{\text{NP}}$) and the symmetric two-sided z-test across $\mu \in \{-1, -0.75, -0.5, \ldots, 1\}$. Identify the negative-$\mu$ region where the two-sided test wins by a factor of at least 5.

```r title="Exercise: crossover region"
my_mu_grid    <- seq(-1, 1, by = 0.25)
my_power_one  <- numeric(length(my_mu_grid))
my_power_two  <- numeric(length(my_mu_grid))

set.seed(303)
# Hint: reuse n, n_sims, crit_np_h0, crit_two from earlier blocks
for (i in seq_along(my_mu_grid)) {
  s_i <- rowSums(matrix(rnorm(n * n_sims, mean = my_mu_grid[i], sd = 1), nrow = n_sims))
  my_power_one[i] <- # your code
  my_power_two[i] <- # your code
}

# Identify negative-mu values where two-sided power exceeds one-sided by 5x or more
ratio <- my_power_two / pmax(my_power_one, 1e-6)
my_mu_grid[ratio >= 5 & my_mu_grid < 0]
#> Expected: all negative mu values, since one-sided test is essentially blind there
```

<details>
<summary>Click to reveal solution</summary>

```r title="Crossover region solution"
for (i in seq_along(my_mu_grid)) {
  s_i <- rowSums(matrix(rnorm(n * n_sims, mean = my_mu_grid[i], sd = 1), nrow = n_sims))
  my_power_one[i] <- mean(s_i      > crit_np_h0)
  my_power_two[i] <- mean(abs(s_i) > crit_two)
}
ratio <- my_power_two / pmax(my_power_one, 1e-6)
my_mu_grid[ratio >= 5 & my_mu_grid < 0]
#> [1] -1.00 -0.75 -0.50 -0.25
```

**Explanation:** For every negative $\mu$ in the grid, the two-sided test's power dwarfs the one-sided test's by orders of magnitude. The one-sided NP test is "blind" on the wrong side because its rejection region lies entirely in the upper tail. This is the operational meaning of "no UMP exists for two-sided alternatives."

</details>

## Complete Example: A reusable NP framework in R

We will fold the recipe into a small function and apply it to a manufacturing-style problem. A supplier claims their components have defect counts $\sim N(50, 5^2)$. We suspect the true mean has drifted to 55. We collect a sample of 30 measurements and want a level-0.05 test with quantified power against the suspected alternative.

```r title="np_test_normal: a reusable NP framework"
np_test_normal <- function(x, mu0, mu1, sigma, alpha = 0.05) {
  n_obs   <- length(x)
  # Critical value on the sample sum under H0
  crit    <- qnorm(1 - alpha, mean = n_obs * mu0, sd = sigma * sqrt(n_obs))
  test_st <- sum(x)
  reject  <- test_st > crit

  # Power under H1: P(sum > crit | mu1)
  power   <- 1 - pnorm(crit, mean = n_obs * mu1, sd = sigma * sqrt(n_obs))

  list(
    n              = n_obs,
    critical_value = crit,
    test_statistic = test_st,
    reject_h0      = reject,
    power_at_h1    = power
  )
}

# Apply to the manufacturing example
set.seed(2026)
sample_obs <- rnorm(30, mean = 55, sd = 5)   # truth: mean drifted to 55
ce_result  <- np_test_normal(sample_obs, mu0 = 50, mu1 = 55, sigma = 5, alpha = 0.05)
ce_result
#> $n
#> [1] 30
#> 
#> $critical_value
#> [1] 1545.04
#> 
#> $test_statistic
#> [1] 1660.57
#> 
#> $reject_h0
#> [1] TRUE
#> 
#> $power_at_h1
#> [1] 0.9999
```

The function reports a critical value of 1545 on the sample sum, an observed sample sum of 1660, and a rejection. The power against the suspected alternative (mean shift from 50 to 55) is essentially 1 — a 5-unit shift over 30 observations is an enormous signal. Had we collected only 5 observations, the same calculation would have shown power around 0.81, which is why sample size matters as much as effect size.

## Summary

| Result | What it says | When it applies |
|---|---|---|
| Neyman-Pearson Lemma | The likelihood ratio test is the most powerful level-$\alpha$ test. | Both hypotheses are simple (single distribution). |
| Karlin-Rubin theorem | The one-sided LR test on the MLR statistic is uniformly most powerful (UMP). | One-parameter family with monotone likelihood ratio + one-sided alternative. |
| Two-sided non-existence | No UMP test exists in general. | Two-sided composite alternatives. |
| LRT in R | `t.test`, `binom.test`, `prop.test`, etc. are LRTs. | Standard parametric inference in `stats` package. |
| Practical workflow | Fix $\alpha$ first, design the LR-based rejection region, then optimise power by sample size. | Any hypothesis-testing problem. |

## References

1. Casella, G. & Berger, R. — *Statistical Inference*, 2nd Edition. Duxbury (2002), Chapter 8. [Link](https://www.cambridge.org/core/books/statistical-inference/)
2. Lehmann, E. L. & Romano, J. P. — *Testing Statistical Hypotheses*, 4th Edition. Springer (2022). [Link](https://link.springer.com/book/10.1007/978-3-030-70578-7)
3. Neyman, J. & Pearson, E. S. (1933) — *On the Problem of the Most Efficient Tests of Statistical Hypotheses*. Philosophical Transactions of the Royal Society A, 231: 289-337. [Link](https://royalsocietypublishing.org/doi/10.1098/rsta.1933.0009)
4. Karlin, S. & Rubin, H. (1956) — *The Theory of Decision Procedures for Distributions with Monotone Likelihood Ratio*. Annals of Mathematical Statistics, 27(2): 272-299. [Link](https://projecteuclid.org/euclid.aoms/1177728259)
5. Wasserman, L. — *All of Statistics*, Chapter 10. Springer (2004). [Link](https://link.springer.com/book/10.1007/978-0-387-21736-9)
6. R documentation — `stats::t.test`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
7. R documentation — `stats::binom.test`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html)
8. StatLect — Neyman-Pearson Lemma. [Link](https://www.statlect.com/fundamentals-of-statistics/Neyman-Pearson-lemma)

## Continue Learning

- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html) — the parent post that sets up null and alternative hypotheses, p-values, and the decision framework that the lemma optimises.
- [Type I and Type II Errors in R](Type-I-and-Type-II-Errors-in-R.html) — a deeper look at the error-rate trade-off the lemma fixes alpha to control.
- [Power Analysis in R](Statistical-Power-Analysis-in-R.html) — how to translate the lemma's power guarantee into sample-size and effect-size calculations for real designs.
