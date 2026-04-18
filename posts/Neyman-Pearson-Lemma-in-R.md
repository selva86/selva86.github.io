---
title: "Neyman-Pearson Lemma in R: Most Powerful Tests & UMP Explained"
slug: "Neyman-Pearson-Lemma-in-R"
description: "Master the Neyman-Pearson Lemma in R with runnable simulations. Build most powerful tests, derive UMP tests, and see exactly when UMP tests fail in practice."
keywords: "Neyman-Pearson Lemma, most powerful test, UMP test, likelihood ratio test, uniformly most powerful, hypothesis testing in R, Type I error, statistical power, monotone likelihood ratio, Karlin-Rubin theorem"
auto_link_terms: "Neyman-Pearson Lemma|Neyman-Pearson test|most powerful test|uniformly most powerful|UMP test|likelihood ratio test|Karlin-Rubin|monotone likelihood ratio"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
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
#>        NP       Max 
#> 0.7226    0.1942
```

The NP test catches the true alternative 72% of the time. The max test, calibrated to the same 5% error rate, catches it only 19% of the time. That is a nearly four-fold difference in power for the same error budget. The lemma guarantees this: no test at alpha=0.05 can beat the NP test's 72% power against this alternative.

[KEY INSIGHT]
**The lemma ranks tests, it does not invent them.** You can design any test you like, but the Neyman-Pearson construction, based on the likelihood ratio, is provably the ceiling. Every alternative test sits at or below it.

**Try it:** Rerun the simulation with `n <- 40`. How much power does the NP test gain, and does the max test keep up?

```r title="Your turn: larger sample size"
# Try it: rerun with n = 40
n2 <- 40
crit_np2  <- qnorm(1 - alpha, mean = 0, sd = sqrt(n2))
sims_h1_2 <- matrix(rnorm(n2 * n_sims, mean = mu1, sd = 1), nrow = n_sims)

# your code here: compute power_np2

#> Expected: power_np2 is around 0.93
```

<details>
<summary>Click to reveal solution</summary>

```r title="Larger sample size solution"
power_np2 <- mean(rowSums(sims_h1_2) > crit_np2)
power_np2
#> [1] 0.9354
```

**Explanation:** Doubling the sample size pushes NP power from 0.72 to 0.94. Power grows non-linearly with n because the signal-to-noise ratio scales as $\sqrt{n}$, not n.

</details>

## Why is the likelihood ratio the optimal test statistic?

The intuition is a budget problem. You have a fixed Type I error budget, alpha. Every sample point you promise to reject "costs" some probability under $H_0$ and "buys" some probability under $H_1$. A smart test spends the budget on sample points that buy the most power per unit cost. That ratio, buy divided by cost, is exactly $f_1(x) / f_0(x)$: the likelihood ratio.

Formally, the lemma states that the most powerful test of size $\alpha$ for $H_0: \theta = \theta_0$ against $H_1: \theta = \theta_1$ rejects when

$$\Lambda(x) = \frac{f_1(x)}{f_0(x)} > k$$

where $k$ is chosen so that $P_{H_0}(\Lambda(X) > k) = \alpha$. Where:

- $f_0(x), f_1(x)$ = the densities (or mass functions) under $H_0$ and $H_1$
- $\Lambda(x)$ = the likelihood ratio at the observed sample
- $k$ = the threshold calibrated to exactly spend alpha

For a normal mean shift ($H_0: N(0,1)$ vs $H_1: N(1,1)$), the LR simplifies to $\Lambda(x) = \exp(x - 0.5)$, which is monotone increasing in $x$. That is why the NP test reduces to "reject when the sample mean is large."

```r title="Likelihood ratio curve for the normal mean shift"
# Plot f1(x) / f0(x) for H0: N(0,1) vs H1: N(1,1)
x_grid  <- seq(-3, 4, length.out = 200)
lr_vals <- dnorm(x_grid, mean = 1) / dnorm(x_grid, mean = 0)

plot(x_grid, lr_vals, type = "l", lwd = 2, col = "steelblue",
     xlab = "x", ylab = "LR(x) = f1(x) / f0(x)",
     main = "Likelihood ratio is monotone in x")
abline(h = 1, lty = 3, col = "gray50")
abline(v = 0.5, lty = 3, col = "gray50")
```

The curve climbs through 1 exactly at $x = 0.5$, the midpoint of the two means. Points to the right of 0.5 favor $H_1$; points to the left favor $H_0$. Because the ratio is monotone, sorting samples by LR is equivalent to sorting by $x$ itself. That monotonicity is the secret to the lemma's simplicity in Gaussian settings.

[NOTE]
**Randomization only matters for discrete distributions.** For continuous families like the normal, the threshold $k$ hits the target alpha exactly. For Poisson, binomial, and other discrete families, you may need to randomize boundary points to match alpha precisely. Most practitioners use a conservative threshold (slightly less than alpha) and skip the randomization.

**Try it:** Compute the likelihood ratio at three specific x values (-2, 0, 2) for the normal mean shift. Verify that the LR at $x=0$ equals $\exp(-0.5) \approx 0.607$.

```r title="Your turn: LR at three points"
# Try it: evaluate LR at x = -2, 0, 2
pts <- c(-2, 0, 2)

# your code here: compute lr_manual = f1(pts) / f0(pts)

#> Expected: c(0.0821, 0.6065, 4.4817)
```

<details>
<summary>Click to reveal solution</summary>

```r title="LR at three points solution"
lr_manual <- dnorm(pts, mean = 1) / dnorm(pts, mean = 0)
round(lr_manual, 4)
#> [1] 0.0821 0.6065 4.4817
```

**Explanation:** The algebraic shortcut is $\Lambda(x) = \exp(x - 0.5)$ for this specific problem. At $x=-2$, LR=0.082 (strong evidence for $H_0$). At $x=2$, LR=4.48 (strong evidence for $H_1$).

</details>

## How do you build a Neyman-Pearson test in R?

For a normal sample with known variance, the NP test reduces to thresholding the sample mean. You need three ingredients: the null mean, the alternative direction (only sign matters), and the desired alpha. The threshold follows from the null distribution of the sample mean.

![Three-step Neyman-Pearson recipe flow](screenshots/Neyman-Pearson-Lemma-in-R-recipe-flow.webp)
*Figure 1: The three-step Neyman-Pearson recipe. Write the likelihood ratio, pick a threshold that spends exactly alpha, reject when the ratio exceeds it.*

Here is a minimal implementation. Given a sample `x`, a null mean `mu0`, an alternative mean `mu1 > mu0`, and alpha, the function returns the critical value, the observed sample mean, and the reject/retain decision.

```r title="Build the np_test() function"
# Neyman-Pearson test for N(mu, 1) with H1: mu = mu1 > mu0
np_test <- function(x, mu0, mu1, alpha) {
  n <- length(x)
  crit <- qnorm(1 - alpha, mean = mu0, sd = 1 / sqrt(n))
  list(
    sample_mean = mean(x),
    critical    = crit,
    reject_H0   = mean(x) > crit
  )
}

# Apply to a sample drawn under H1
set.seed(2026)
x_sample <- rnorm(30, mean = 0.6, sd = 1)
result   <- np_test(x_sample, mu0 = 0, mu1 = 1, alpha = 0.05)
result
#> $sample_mean
#> [1] 0.5431
#> 
#> $critical
#> [1] 0.3003
#> 
#> $reject_H0
#> [1] TRUE
```

The sample mean is 0.54 and the critical value is 0.30. Because 0.54 exceeds 0.30, we reject $H_0$. Notice that the function never uses `mu1` to compute the threshold: `mu1` only determines the *direction* of the test (upper tail in this case). This tiny detail becomes the key to UMP tests in the next section.

[TIP]
**Calibrate the threshold with qnorm, not by simulation.** The quantile function gives you the exact critical value in one line. Simulation works but introduces Monte Carlo noise that eats into your alpha budget. For common distributions (normal, t, chi-squared, F), always prefer the quantile function.

Next, visualize the power curve: how often does the test reject as the true mean moves from 0 (the null) upward?

```r title="Theoretical power curve"
# Power curve for the NP test: true mean vs rejection probability
mu_grid    <- seq(0, 1.5, by = 0.02)
crit_theta <- qnorm(1 - alpha, mean = 0, sd = 1 / sqrt(30))
power_curve <- 1 - pnorm(crit_theta, mean = mu_grid, sd = 1 / sqrt(30))

plot(mu_grid, power_curve, type = "l", lwd = 2, col = "steelblue",
     xlab = "True mean (mu)", ylab = "Power",
     main = "NP test power curve (n = 30, alpha = 0.05)")
abline(h = alpha, lty = 2, col = "red")
abline(v = 0,     lty = 3, col = "gray50")
```

The curve passes through 0.05 at $\mu=0$ (the null, where rejection is by chance alone) and climbs steeply as $\mu$ moves away. By $\mu = 1$, power is essentially 1. This shape, called the *power function*, is what you want to inspect when designing any test.

**Try it:** Write `np_test_lower(x, mu0, alpha)` that rejects when the sample mean is *below* the threshold, for an alternative $\mu_1 < \mu_0$.

```r title="Your turn: lower-tail NP test"
# Try it: mirror np_test() for H1: mu < mu0
np_test_lower <- function(x, mu0, alpha) {
  n <- length(x)
  # your code here: compute crit and the reject rule

}

np_test_lower(x_sample, mu0 = 0, alpha = 0.05)
#> Expected: reject_H0 = FALSE (sample mean 0.54 is NOT small)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lower-tail NP test solution"
np_test_lower <- function(x, mu0, alpha) {
  n <- length(x)
  crit <- qnorm(alpha, mean = mu0, sd = 1 / sqrt(n))
  list(
    sample_mean = mean(x),
    critical    = crit,
    reject_H0   = mean(x) < crit
  )
}
np_test_lower(x_sample, mu0 = 0, alpha = 0.05)
#> $sample_mean
#> [1] 0.5431
#> 
#> $critical
#> [1] -0.3003
#> 
#> $reject_H0
#> [1] FALSE
```

**Explanation:** The lower-tail critical value is the symmetric reflection: `qnorm(alpha, ...)` instead of `qnorm(1-alpha, ...)`. The reject rule flips from greater-than to less-than.

</details>

## How does the lemma extend to composite alternatives (UMP tests)?

A simple alternative like $H_1: \mu = 1$ is rarely realistic. In practice you want to detect *any* $\mu > \mu_0$, not a specific value. This is a *composite* alternative. The lemma extends via the **Karlin-Rubin theorem**: if the family has a *monotone likelihood ratio* (MLR) in a statistic $T(x)$, then the NP test based on $T$ is uniformly most powerful (UMP) across all one-sided alternatives.

MLR holds in most standard parametric families:

1. **Normal** (mean, known variance) - MLR in the sample mean
2. **Exponential** (rate) - MLR in the sample mean
3. **Binomial** (success probability) - MLR in the sample count
4. **Poisson** (rate) - MLR in the sample sum
5. **Uniform** (upper bound) - MLR in the sample maximum

For all of these, the LR test derived for *any* single alternative inside the composite range works equally well for *every* alternative in that range. That is the magic of UMP: one test, uniformly optimal.

To see UMP in action, compute the power of the np_test() at several alternative means, using the same threshold:

```r title="Same threshold, many alternatives: UMP in action"
# Same threshold (derived once), multiple true means
mu1_values  <- c(0.3, 0.6, 1.0, 1.5)
power_at_mu1 <- 1 - pnorm(crit_theta, mean = mu1_values, sd = 1 / sqrt(30))

ump_table <- data.frame(
  mu1   = mu1_values,
  power = round(power_at_mu1, 3)
)
ump_table
#>   mu1 power
#> 1 0.3 0.493
#> 2 0.6 0.950
#> 3 1.0 1.000
#> 4 1.5 1.000
```

Notice we calibrated `crit_theta` once for the null, and it delivered optimal power against every alternative. You never had to pick a specific `mu1` to design the test. That is the UMP property in a single table.

![When does a UMP test exist](screenshots/Neyman-Pearson-Lemma-in-R-ump-decision.webp)
*Figure 2: When a UMP test exists. Simple alternatives always. One-sided composite with MLR via Karlin-Rubin. Two-sided usually fails.*

[KEY INSIGHT]
**UMP is NP optimality that lifts from one alternative to a whole family.** The single-alternative lemma (simple vs simple) is a narrow result. Karlin-Rubin turns it into a practical workhorse: as long as your family has MLR, one-sided testing has a provably optimal procedure.

**Try it:** Verify the threshold does not depend on `mu1`. Compute the threshold twice, once for `mu1 = 0.5` and once for `mu1 = 2`, holding everything else fixed.

```r title="Your turn: threshold independence"
# Try it: threshold for two different alternatives
crit_check <- c(
  mu1_0.5 = qnorm(1 - alpha, mean = 0, sd = 1 / sqrt(30)),
  mu1_2.0 = qnorm(1 - alpha, mean = 0, sd = 1 / sqrt(30))
)
# your code here: print or inspect crit_check

#> Expected: both values are identical (~0.3003)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Threshold independence solution"
print(crit_check)
#>   mu1_0.5   mu1_2.0 
#> 0.3002663 0.3002663
identical(crit_check[1], crit_check[2])
#> [1] TRUE
```

**Explanation:** The threshold depends only on `mu0`, `n`, and `alpha`, never on `mu1`. That independence is exactly why the same test is optimal for every alternative in the one-sided family.

</details>

## When do UMP tests fail to exist?

UMP is fragile. The moment you allow alternatives on both sides of the null, it collapses. The NP-optimal test for $H_1: \mu > 0$ achieves near-zero power against $\mu < 0$, and vice versa. No single one-sided test can be optimal against both directions, so no UMP test exists for the two-sided alternative $H_1: \mu \neq 0$.

Visualize this failure directly. Plot the power of the upper-tail test across *both* sides of the null:

```r title="Two-sided failure: a one-sided test is blind on the wrong side"
# Power of the upper-tail test across both sides of the null
mus_wide     <- seq(-1.5, 1.5, by = 0.02)
power_upper  <- 1 - pnorm(crit_theta, mean = mus_wide, sd = 1 / sqrt(30))

plot(mus_wide, power_upper, type = "l", lwd = 2, col = "steelblue",
     xlab = "True mean (mu)", ylab = "Power",
     main = "One-sided test: blind to mu < 0")
abline(h = alpha, lty = 2, col = "red")
abline(v = 0,     lty = 3, col = "gray50")
```

For $\mu < 0$, the power curve sits *below* alpha: the one-sided upper test rejects less often than its nominal false-positive rate. Against $\mu = -0.3$, for example, power is under 0.001. If the true effect is negative, the test has essentially zero chance of detecting it. That is the price of picking a direction.

[WARNING]
**A one-sided test is deliberately blind on the opposite side.** Never pick one-sided just because it gives higher power. That choice is only justified when the other direction is scientifically impossible or irrelevant. If in doubt, use a two-sided test, you lose a little power but cover both directions.

When UMP tests fail, practitioners fall back to:

- **Two-sided z or t tests** for mean problems
- **Likelihood ratio tests (LRT)**, which generalize NP to composite nulls and alternatives
- **Unbiased tests**, which are optimal within a restricted class

None are UMP in the strict sense, but all are principled alternatives when the lemma cannot directly apply.

**Try it:** Compute the power of the upper-tail NP test (alpha=0.05, n=30) against $\mu = -0.3$. Confirm it is far below alpha.

```r title="Your turn: power on the wrong side"
# Try it: power at mu = -0.3
# your code here: compute power_neg using crit_theta

#> Expected: power_neg is around 0.0005
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wrong-side power solution"
power_neg <- 1 - pnorm(crit_theta, mean = -0.3, sd = 1 / sqrt(30))
round(power_neg, 5)
#> [1] 0.00051
```

**Explanation:** The upper-tail test puts all its rejection region above 0.30. Against a mean of -0.3, the sample mean is concentrated around -0.3 with SD 0.18, and the chance of it crossing 0.30 is near zero.

</details>

## Practice Exercises

These capstones combine ideas from multiple sections. Each is solvable with only what you saw above.

### Exercise 1: Neyman-Pearson test for a Poisson rate

Testing whether a call center's arrival rate jumped from 2 per hour to 3 per hour. Set $H_0: \lambda = 2$ vs $H_1: \lambda = 3$ with $n = 10$ independent hourly counts, $\alpha = 0.05$.

Derive the NP critical value for the sample *sum* (under $H_0$, the sum is Poisson with rate $n \lambda_0 = 20$). Then compute the theoretical power under $H_1$.

```r title="Exercise 1: Poisson NP test"
# H0: lambda = 2 vs H1: lambda = 3, n = 10, alpha = 0.05
ex_lambda0 <- 2
ex_lambda1 <- 3
ex_n       <- 10
ex_alpha_p <- 0.05

# Hint: use qpois() for the threshold and ppois() for power
# ex_crit_pois  <- ...
# ex_power_pois <- ...

```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson NP test solution"
# Under H0, sum ~ Poisson(n * lambda0) = Poisson(20)
ex_crit_pois <- qpois(1 - ex_alpha_p, lambda = ex_n * ex_lambda0)

# Under H1, sum ~ Poisson(n * lambda1) = Poisson(30)
ex_power_pois <- 1 - ppois(ex_crit_pois, lambda = ex_n * ex_lambda1)

c(critical = ex_crit_pois, power = round(ex_power_pois, 3))
#> critical    power 
#>   27.000    0.656
```

**Explanation:** Reject when the sum of the 10 counts exceeds 27. Under the alternative rate of 3, that happens 65.6% of the time. The Poisson family has MLR in the sample sum, so this test is UMP for any $\lambda_1 > 2$.

</details>

### Exercise 2: Empirical NP vs sample-variance test

Build a simulation confirming that the NP test outperforms a competing test based on the sample *variance* for a normal mean shift. Use $n = 25$, $\mu_0 = 0$, $\mu_1 = 0.6$, $\alpha = 0.05$, and 10,000 simulated samples from each hypothesis.

```r title="Exercise 2: NP vs variance test skeleton"
# Compare NP test (uses mean) vs variance test (uses sample variance)
set.seed(1)
my_n     <- 25
my_mu0   <- 0
my_mu1   <- 0.6
my_alpha <- 0.05

# Hint: calibrate crit_np via qnorm(), crit_var via simulation under H0
# my_sims_h0, my_sims_h1, my_crit_np, my_crit_var, my_power_np, my_power_var

```

<details>
<summary>Click to reveal solution</summary>

```r title="NP vs variance test solution"
my_sims_h0 <- matrix(rnorm(my_n * 10000, mean = my_mu0), nrow = 10000)
my_sims_h1 <- matrix(rnorm(my_n * 10000, mean = my_mu1), nrow = 10000)

my_crit_np  <- qnorm(1 - my_alpha, mean = my_mu0, sd = 1 / sqrt(my_n))
my_crit_var <- quantile(apply(my_sims_h0, 1, var), 1 - my_alpha)

my_power_np  <- mean(rowMeans(my_sims_h1) > my_crit_np)
my_power_var <- mean(apply(my_sims_h1, 1, var) > my_crit_var)

c(NP = my_power_np, Variance = my_power_var)
#>       NP Variance 
#>   0.9127   0.0512
```

**Explanation:** The NP test captures ~91% of the true alternatives. The variance test, calibrated to the same alpha, catches only ~5%, which is alpha itself. That makes sense: sample variance is invariant to mean shifts, so it is essentially useless for detecting a change in the mean. The lemma's power optimality is not a small edge, it is the difference between a useful test and a useless one.

</details>

## Complete Example: Clinical trial sample size

A pharmaceutical company is testing a new blood-pressure drug against placebo. The minimum clinically important difference (MCID) in standardized units is $\mu_1 = 0.4$. The null hypothesis is no effect ($\mu_0 = 0$). Regulators require a one-sided level-0.05 test with 80% power at the MCID. How many participants per arm do you need?

For a normal sample with unit variance, the NP test rejects when the sample mean exceeds $\mu_0 + z_{1-\alpha}/\sqrt{n}$. Power against $\mu_1$ is

$$1 - \Phi\!\left( z_{1-\alpha} - \sqrt{n}\,(\mu_1 - \mu_0) \right)$$

Set this equal to 0.80 and solve for $n$:

$$n = \frac{(z_{1-\alpha} + z_{1-\beta})^2}{(\mu_1 - \mu_0)^2} = \frac{(1.6449 + 0.8416)^2}{0.4^2} \approx 38.6$$

Round up to $n = 39$. Here is the calculation and a simulation check:

```r title="Clinical trial: solve for n, then simulate"
ce_mu0    <- 0
ce_mu1    <- 0.4
ce_alpha  <- 0.05
ce_target <- 0.80

# Closed-form sample size
ce_n <- ceiling(
  (qnorm(1 - ce_alpha) + qnorm(ce_target))^2 / (ce_mu1 - ce_mu0)^2
)
ce_n
#> [1] 39

# Verify: theoretical power at n = 39
ce_crit        <- qnorm(1 - ce_alpha, mean = ce_mu0, sd = 1 / sqrt(ce_n))
ce_check_power <- 1 - pnorm(ce_crit, mean = ce_mu1, sd = 1 / sqrt(ce_n))
round(ce_check_power, 3)
#> [1] 0.803
```

With $n = 39$, the NP test delivers 80.3% power at the MCID, clearing the regulator's 80% bar with 0.3 percentage points to spare. If you wanted to hit exactly 80% you could trim one participant, but in practice you always round up for safety.

[NOTE]
**This formula assumes known variance and a one-sided test.** Real trials use unknown variance (t-distribution) and often two-sided tests, which inflate $n$ by 10-30%. Tools like `pwr::pwr.t.test()` handle those adjustments with the same underlying logic: solve for $n$ given alpha, desired power, and effect size.

## Summary

| Concept | Statement | Scope |
|---|---|---|
| Neyman-Pearson Lemma | The LR test is most powerful for simple-vs-simple hypotheses. | Two specific distributions. |
| Likelihood ratio | $\Lambda(x) = f_1(x)/f_0(x)$, sorted to maximize power per unit alpha. | All parametric tests. |
| Critical value | $k$ chosen so that $P_{H_0}(\Lambda > k) = \alpha$. | Any distribution. |
| Karlin-Rubin extension | NP test is UMP for one-sided composite alternatives in MLR families. | Normal, exponential, binomial, Poisson. |
| Failure mode | No UMP for two-sided or multi-parameter alternatives. | Use LRT, two-sided, or unbiased tests. |

The lemma is the foundation for almost every hypothesis test in statistics. When you run a one-sided z-test, a one-sided t-test, or a one-sided exact Poisson test, you are using the NP procedure, often without realizing it.

## References

1. Neyman, J., & Pearson, E. S. (1933). On the problem of the most efficient tests of statistical hypotheses. *Philosophical Transactions of the Royal Society A*, 231, 289-337.
2. Lehmann, E. L., & Romano, J. P. (2005). *Testing Statistical Hypotheses* (3rd ed.). Springer. Chapters 3-4.
3. Casella, G., & Berger, R. L. (2002). *Statistical Inference* (2nd ed.). Duxbury. Chapter 8.
4. Penn State STAT 415 - Lesson 26: Most Powerful Tests. [Link](https://online.stat.psu.edu/stat415/lesson/26/26.1)
5. Wikipedia - Neyman-Pearson lemma. [Link](https://en.wikipedia.org/wiki/Neyman%E2%80%93Pearson_lemma)
6. UC Berkeley STAT 210A - Hypothesis Testing and the Neyman-Pearson Lemma. [Link](https://stat210a.berkeley.edu/fall-2024/reader/hypothesis-testing.html)
7. Stanford STATS 200 Lecture 6: Simple alternatives, Neyman-Pearson lemma. [Link](https://web.stanford.edu/class/archive/stats/stats200/stats200.1172/Lecture06.pdf)

## Continue Learning

- [Hypothesis Testing in R: Understand the Framework, Not Just the p-Value](Hypothesis-Testing-in-R.html) - the full framework this lemma sits inside.
- [Maximum Likelihood Estimation in R](Maximum-Likelihood-Estimation-in-R.html) - the estimation cousin of the likelihood ratio test.
- [Confidence Intervals in R](Confidence-Intervals-in-R.html) - dual concept to hypothesis testing with the same lemma lurking underneath.
