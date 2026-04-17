---
title: "Binomial vs Poisson in R: Understand When Each Distribution Fits Your Counts"
slug: "Binomial-and-Poisson-Distributions-in-R"
description: "Binomial models fixed-n binary trials; Poisson models rare events in continuous time. Learn the R functions (dbinom, dpois, rbinom) and how to choose."
keywords: "binomial distribution R, poisson distribution R, dbinom dpois, binomial vs poisson, rbinom rpois, probability distributions R, when to use poisson or binomial, count data R"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-16"
curriculum_id: "2.1.6"
post_type: "C"
auto_link_terms: "binomial distribution|poisson distribution|binomial vs poisson|dbinom()|dpois()|rbinom()|rpois()|pbinom()|ppois()|count data distribution"
auto_link_case_sensitive: true
sidebar_section: "Statistics"
sidebar_title: "Binomial vs Poisson"
sidebar_order: 20
---

# Binomial vs Poisson in R: Understand When Each Distribution Fits Your Counts

<p class="lead">The binomial distribution counts successes in a fixed number of trials (like heads in 20 coin flips), while the Poisson distribution counts events in a fixed interval of time or space (like calls to a help desk per hour). This tutorial shows you how each distribution works in R, when to use which, and the mathematical bridge that connects them.</p>

## What does the binomial distribution model?

Imagine you flip a coin 10 times and count the heads. You know the number of trials (10), and each flip has two outcomes, heads or tails. That setup is the binomial distribution in a nutshell. Let's see it in action with R's dbinom() function.

```r title="Binomial PMF for coin flips"
# Binomial PMF: probability of k heads in 10 fair coin flips
k_binom <- 0:10
probs_binom <- dbinom(k_binom, size = 10, prob = 0.5)

# Show the probabilities
names(probs_binom) <- k_binom
round(probs_binom, 4)
#>      0      1      2      3      4      5      6      7      8      9     10
#> 0.0010 0.0098 0.0439 0.1172 0.2051 0.2461 0.2051 0.1172 0.0439 0.0098 0.0010

# Plot the PMF
barplot(probs_binom, names.arg = k_binom,
        col = "steelblue", border = "white",
        xlab = "Number of heads (k)",
        ylab = "P(X = k)",
        main = "Binomial(n=10, p=0.5)")
```

The most likely outcome is 5 heads (probability 24.6%), and the distribution is perfectly symmetric because p = 0.5. Notice how outcomes far from 5, like 0 or 10 heads, are extremely unlikely (about 0.1% each).

The binomial distribution requires four conditions: a **fixed number of trials** (n), exactly **two outcomes** per trial (success/failure), a **constant probability** of success (p) across trials, and **independence** between trials. Whenever all four hold, you're in binomial territory.

Now let's answer a cumulative question: what's the probability of getting 3 or fewer heads?

```r title="Cumulative P at most 3"
# Cumulative probability: P(X <= 3) for 10 fair coin flips
cum_prob <- pbinom(3, size = 10, prob = 0.5)
cat("P(X <= 3) =", round(cum_prob, 4), "\n")
#> P(X <= 3) = 0.1719
```

There's about a 17.2% chance of getting 3 or fewer heads in 10 fair flips. The pbinom() function sums the individual probabilities from dbinom(0) through dbinom(3) for you.

[KEY INSIGHT]
**The binomial's variance is always less than its mean.** Mean = np and Variance = np(1-p). Since (1-p) is always between 0 and 1, variance is always a fraction of the mean. This is the binomial's fingerprint, when you see variance < mean in count data, think binomial.

**Try it:** A new drug cures 70% of patients. If 15 patients take it, what's the probability that exactly 12 are cured? Use dbinom().

```r title="Exercise: Twelve cured of fifteen"
# Try it: P(exactly 12 cured) with n=15, p=0.70
ex_cure_prob <- dbinom(x = ___, size = ___, prob = ___)
ex_cure_prob
#> Expected: approximately 0.1700
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cured probability solution"
ex_cure_prob <- dbinom(x = 12, size = 15, prob = 0.70)
ex_cure_prob
#> [1] 0.1700
```

**Explanation:** dbinom(12, 15, 0.70) computes the exact probability of 12 successes in 15 independent trials, each with a 70% success rate.

</details>

## What does the Poisson distribution model?

The binomial needs a fixed trial count. But what if there's no natural upper limit? A help desk might receive 0 calls in an hour, or 3, or 12, there's no fixed number of "trials." That's where the Poisson distribution steps in. It models the count of events in a fixed interval when those events occur independently at a constant average rate.

Let's model a help desk that averages 5 calls per hour.

```r title="Poisson PMF for call counts"
# Poisson PMF: probability of k calls when average rate = 5/hour
k_pois <- 0:15
probs_pois <- dpois(k_pois, lambda = 5)

names(probs_pois) <- k_pois
round(probs_pois, 4)
#>      0      1      2      3      4      5      6      7      8      9     10
#> 0.0067 0.0337 0.0842 0.1404 0.1755 0.1755 0.1462 0.1044 0.0653 0.0363 0.0181
#>     11     12     13     14     15
#> 0.0082 0.0034 0.0013 0.0005 0.0002

# Plot the PMF
barplot(probs_pois, names.arg = k_pois,
        col = "coral", border = "white",
        xlab = "Number of calls (k)",
        ylab = "P(X = k)",
        main = "Poisson(lambda = 5)")
```

The distribution peaks near lambda = 5 and has a slight right skew, there's always a small probability of getting a much higher count. Unlike the binomial, there's no ceiling on k (though probabilities shrink rapidly).

What's the chance the desk gets swamped with more than 2 calls in an hour? We can use the cumulative function ppois().

```r title="Poisson tail probabilities"
# P(X <= 2) and P(X > 2) for Poisson(lambda=5)
cum_pois <- ppois(2, lambda = 5)
cat("P(X <= 2) =", round(cum_pois, 4), "\n")
#> P(X <= 2) = 0.1247
cat("P(X > 2)  =", round(1 - cum_pois, 4), "\n")
#> P(X > 2)  = 0.8753
```

There's an 87.5% chance of getting more than 2 calls per hour when the average rate is 5. The complement trick, `1 - ppois(k, lambda)`, is the standard way to compute upper-tail probabilities.

[KEY INSIGHT]
**For a Poisson distribution, the mean equals the variance.** Both equal lambda. This is the Poisson's defining signature. When you compute the mean and variance of real count data and they're roughly equal, that's a strong hint that Poisson is the right model.

**Try it:** A website averages 8 server errors per day. What's the probability of exactly 3 errors today? Use dpois().

```r title="Exercise: Three errors with lambda 8"
# Try it: P(exactly 3 errors) with lambda = 8
ex_error_prob <- dpois(x = ___, lambda = ___)
ex_error_prob
#> Expected: approximately 0.0286
```

<details>
<summary>Click to reveal solution</summary>

```r title="Error probability solution"
ex_error_prob <- dpois(x = 3, lambda = 8)
ex_error_prob
#> [1] 0.02861
```

**Explanation:** With an average of 8 errors/day, getting only 3 is quite unlikely (about 2.9%), because 3 is far below the mean of 8.

</details>

## How do the R functions map between binomial and Poisson?

R uses a consistent naming convention for all probability distributions. Every distribution gets four functions with the same prefix pattern: **d** for density (probability at a point), **p** for cumulative probability, **q** for quantile (inverse CDF), and **r** for random number generation. The suffix tells you the distribution, `binom` for binomial, `pois` for Poisson.

Let's see all eight functions side by side.

```r title="d, p, q, r convention"
# d: exact probability
cat("dbinom(3, 10, 0.5) =", dbinom(3, size = 10, prob = 0.5), "\n")
#> dbinom(3, 10, 0.5) = 0.1171875
cat("dpois(3, lambda=5) =", dpois(3, lambda = 5), "\n")
#> dpois(3, lambda=5) = 0.1403739

# p: cumulative P(X <= k)
cat("pbinom(3, 10, 0.5) =", pbinom(3, size = 10, prob = 0.5), "\n")
#> pbinom(3, 10, 0.5) = 0.171875
cat("ppois(3, lambda=5) =", ppois(3, lambda = 5), "\n")
#> ppois(3, lambda=5) = 0.2650259

# q: quantile (find k for a given cumulative probability)
cat("qbinom(0.90, 10, 0.5) =", qbinom(0.90, size = 10, prob = 0.5), "\n")
#> qbinom(0.90, 10, 0.5) = 7
cat("qpois(0.90, lambda=5) =", qpois(0.90, lambda = 5), "\n")
#> qpois(0.90, lambda=5) = 8

# r: random samples (3 each)
set.seed(42)
cat("rbinom(3, 10, 0.5) =", rbinom(3, size = 10, prob = 0.5), "\n")
#> rbinom(3, 10, 0.5) = 8 5 5
set.seed(42)
cat("rpois(3, lambda=5)  =", rpois(3, lambda = 5), "\n")
#> rpois(3, lambda=5)  = 5 2 7
```

The pattern is identical: `d` computes exact probabilities, `p` accumulates, `q` inverts the CDF, and `r` simulates. Once you learn this for one distribution, you know it for all of them, dnorm, pnorm, qnorm, rnorm work the same way for the normal distribution.

![R's d/p/q/r prefix system maps identically across binomial and Poisson functions](screenshots/Binomial-and-Poisson-Distributions-in-R-r-functions.webp)

*Figure 1: R's d/p/q/r prefix system maps identically across binomial and Poisson functions.*

[TIP]
**This d/p/q/r pattern applies to every distribution in R.** Normal: dnorm, pnorm, qnorm, rnorm. Exponential: dexp, pexp, qexp, rexp. Once you learn the prefix system, you can work with any distribution in R without memorizing separate function names.

**Try it:** Use qbinom() and qpois() to find the 90th percentile for Binomial(n=50, p=0.3) and Poisson(lambda=15). How close are they?

```r title="Exercise: 90th percentile comparison"
# Try it: 90th percentile comparison
ex_q_binom <- qbinom(0.90, size = ___, prob = ___)
ex_q_pois <- qpois(0.90, lambda = ___)
cat("Binomial 90th:", ex_q_binom, " Poisson 90th:", ex_q_pois, "\n")
#> Expected: both should be close to each other
```

<details>
<summary>Click to reveal solution</summary>

```r title="90th percentile solution"
ex_q_binom <- qbinom(0.90, size = 50, prob = 0.3)
ex_q_pois <- qpois(0.90, lambda = 15)
cat("Binomial 90th:", ex_q_binom, " Poisson 90th:", ex_q_pois, "\n")
#> Binomial 90th: 19  Poisson 90th: 20
```

**Explanation:** Both are close (19 vs 20), which makes sense because Binomial(50, 0.3) has mean = 15, the same as our Poisson. But they're not identical because n=50 isn't large enough for the Poisson approximation to be perfect.

</details>

## When does Poisson approximate the binomial?

Here's where the two distributions connect mathematically. When you have a large number of trials (n) but each trial has a small probability of success (p), the Binomial(n, p) distribution converges to Poisson(lambda = np). This is the **Poisson limit theorem**, and it's one of the most elegant results in probability.

The binomial PMF is:

$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}$$

The Poisson PMF is:

$$P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

Where:
- $n$ = number of trials, $p$ = probability of success per trial
- $\lambda$ = np = expected number of events
- $\binom{n}{k}$ = "n choose k" = the number of ways to pick k successes from n trials
- $e$ = Euler's number (approximately 2.718)

*If you're not interested in the math, skip to the code below, it demonstrates the convergence visually.*

As n grows and p shrinks while keeping lambda = np fixed, the binomial terms converge to the Poisson formula. The rule of thumb: **n >= 100 and np <= 10** makes the approximation very accurate.

Let's verify this in R.

```r title="Binomial converges to Poisson"
# Compare Binomial(n=1000, p=0.003) vs Poisson(lambda=3)
k_vals <- 0:10
binom_probs <- dbinom(k_vals, size = 1000, prob = 0.003)
pois_probs <- dpois(k_vals, lambda = 3)

comparison <- data.frame(
  k = k_vals,
  Binomial = round(binom_probs, 6),
  Poisson = round(pois_probs, 6),
  Difference = round(abs(binom_probs - pois_probs), 6)
)
print(comparison)
#>     k Binomial  Poisson Difference
#> 1   0 0.049211 0.049787   0.000576
#> 2   1 0.148124 0.149361   0.001237
#> 3   2 0.223054 0.224042   0.000988
#> 4   3 0.223722 0.224042   0.000320
#> 5   4 0.168040 0.168031   0.000009
#> 6   5 0.100632 0.100819   0.000187
#> 7   6 0.050015 0.050409   0.000395
#> 8   7 0.021305 0.021604   0.000299
#> 9   8 0.007930 0.008102   0.000172
#> 10  9 0.002616 0.002701   0.000085
#> 11 10 0.000775 0.000810   0.000035

max_diff <- max(abs(binom_probs - pois_probs))
cat("Maximum absolute difference:", round(max_diff, 6), "\n")
#> Maximum absolute difference: 0.001237
```

The probabilities match to three or four decimal places. The maximum difference across all k values is just 0.0012, for practical purposes, they're interchangeable.

Now let's see this convergence visually. As n increases (with lambda fixed at 3), the binomial PMF gets closer and closer to the Poisson PMF.

```r title="Visual convergence at 20, 100, 1000"
# Visual convergence: Binomial approaches Poisson as n grows
par(mfrow = c(1, 3))
lambda_target <- 3

for (n_val in c(20, 100, 1000)) {
  p_val <- lambda_target / n_val
  k_range <- 0:10
  
  binom_vals <- dbinom(k_range, size = n_val, prob = p_val)
  pois_vals <- dpois(k_range, lambda = lambda_target)
  
  barplot(rbind(binom_vals, pois_vals), beside = TRUE,
          names.arg = k_range,
          col = c("steelblue", "coral"),
          main = paste0("n=", n_val, ", p=", round(p_val, 4)),
          xlab = "k", ylab = "P(X = k)",
          legend.text = c("Binomial", "Poisson"),
          args.legend = list(x = "topright", cex = 0.8))
}
par(mfrow = c(1, 1))
```

At n=20, you can see gaps between the blue (binomial) and coral (Poisson) bars. By n=100, they're very close. At n=1000, the bars are virtually identical. This is the Poisson limit theorem in action.

[WARNING]
**The approximation breaks down when p is not small.** With n=50 and p=0.5, the binomial has mean = 25 and variance = 12.5. Poisson(25) has variance = 25. The means match but the variance mismatch (12.5 vs 25) means the Poisson badly overestimates spread. Stick to the rule: n >= 100 and np <= 10.

**Try it:** For n=500 and p=0.004 (lambda=2), compare dbinom() and dpois() for k=0 through 5. At which k is the difference largest?

```r title="Exercise: Binomial 500 versus Poisson 2"
# Try it: compare Binomial(500, 0.004) vs Poisson(2) for k=0..5
ex_k <- 0:5
ex_binom <- dbinom(ex_k, size = ___, prob = ___)
ex_pois <- dpois(ex_k, lambda = ___)
data.frame(k = ex_k, Binom = round(ex_binom, 6),
           Pois = round(ex_pois, 6),
           Diff = round(abs(ex_binom - ex_pois), 6))
#> Expected: differences should all be very small
```

<details>
<summary>Click to reveal solution</summary>

```r title="Convergence table solution"
ex_k <- 0:5
ex_binom <- dbinom(ex_k, size = 500, prob = 0.004)
ex_pois <- dpois(ex_k, lambda = 2)
data.frame(k = ex_k, Binom = round(ex_binom, 6),
           Pois = round(ex_pois, 6),
           Diff = round(abs(ex_binom - ex_pois), 6))
#>   k    Binom     Pois     Diff
#> 1 0 0.134398 0.135335 0.000937
#> 2 1 0.270475 0.270671 0.000196
#> 3 2 0.272019 0.270671 0.001348
#> 4 3 0.182016 0.180447 0.001569
#> 5 4 0.091234 0.090224 0.001010
#> 6 5 0.036433 0.036089 0.000344
```

**Explanation:** The largest difference is at k=3 (about 0.0016), but all differences are tiny. With n=500 and p=0.004, the Poisson approximation is excellent.

</details>

## How do you simulate from each distribution?

Formulas give you theoretical probabilities. Simulation gives you data you can touch. R's rbinom() and rpois() let you generate thousands of random draws in a single line, which is invaluable for Monte Carlo estimation, checking your formulas, and power analysis.

Let's simulate 10,000 draws from a binomial and verify that the sample statistics match the theory.

```r title="Simulate binomial draws"
# Simulate 10,000 Binomial(n=20, p=0.3) draws
set.seed(101)
sim_binom <- rbinom(10000, size = 20, prob = 0.3)

mean_b <- mean(sim_binom)
var_b <- var(sim_binom)
cat("Sample mean:", round(mean_b, 2), " (theory: np =", 20 * 0.3, ")\n")
#> Sample mean: 6.01  (theory: np = 6 )
cat("Sample var: ", round(var_b, 2), " (theory: np(1-p) =", 20 * 0.3 * 0.7, ")\n")
#> Sample var:  4.19  (theory: np(1-p) = 4.2 )
```

The sample mean (6.01) is nearly identical to the theoretical mean (6.0), and the sample variance (4.19) matches np(1-p) = 4.2 almost exactly. With 10,000 draws, simulation estimates are very precise.

Now the same for Poisson.

```r title="Simulate Poisson draws"
# Simulate 10,000 Poisson(lambda=6) draws
set.seed(202)
sim_pois <- rpois(10000, lambda = 6)

mean_p <- mean(sim_pois)
var_p <- var(sim_pois)
cat("Sample mean:", round(mean_p, 2), " (theory: lambda =", 6, ")\n")
#> Sample mean: 5.98  (theory: lambda = 6 )
cat("Sample var: ", round(var_p, 2), " (theory: lambda =", 6, ")\n")
#> Sample var:  5.96  (theory: lambda = 6 )
```

Both mean and variance converge to lambda = 6, confirming the Poisson's defining property: mean equals variance. This is a practical way to check your distributional assumptions, simulate, compute, compare.

[TIP]
**Always use set.seed() before simulation for reproducibility.** Without it, every run gives different random numbers. Pick a distinct seed for each major example (not always 42) so readers can reproduce your exact output.

**Try it:** Simulate 5,000 Poisson(lambda=10) values. What fraction exceed 15? Compare your answer to the theoretical `1 - ppois(15, 10)`.

```r title="Exercise: Fraction exceeding 15"
# Try it: fraction of Poisson(10) draws exceeding 15
set.seed(303)
ex_sim <- rpois(5000, lambda = ___)
ex_frac <- mean(ex_sim > ___)
cat("Simulated P(X > 15):", round(ex_frac, 4), "\n")
cat("Theoretical P(X > 15):", round(1 - ppois(___, ___), 4), "\n")
#> Expected: both around 0.0487
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fraction exceeding solution"
set.seed(303)
ex_sim <- rpois(5000, lambda = 10)
ex_frac <- mean(ex_sim > 15)
cat("Simulated P(X > 15):", round(ex_frac, 4), "\n")
#> Simulated P(X > 15): 0.0486
cat("Theoretical P(X > 15):", round(1 - ppois(15, 10), 4), "\n")
#> Theoretical P(X > 15): 0.0487
```

**Explanation:** The simulated fraction (0.0486) matches the theoretical probability (0.0487) closely. The trick is `mean(ex_sim > 15)`, which computes the fraction of TRUE values in the logical vector.

</details>

## How do you choose between binomial and Poisson for real data?

You've learned both distributions. Now the practical question: when you have real count data sitting in front of you, which distribution should you reach for? Here's a simple decision checklist.

**Ask yourself these questions in order:**

1. Is there a **fixed number of trials** (n)? → If no, consider Poisson.
2. Is each trial **binary** (success/failure)? → If no, consider Multinomial or other models.
3. Is n **known and moderate** (say, under 100)? → Binomial.
4. Is n very large and p very small? → Poisson approximation works.
5. Are events occurring in **continuous time or space** with no natural upper bound? → Poisson.

![Decision flowchart for choosing between binomial and Poisson distributions](screenshots/Binomial-and-Poisson-Distributions-in-R-decision-flow.webp)

*Figure 2: Decision flowchart for choosing between binomial and Poisson distributions.*

The mean-variance relationship is your strongest diagnostic tool. Let's apply it to real data.

```r title="Diagnose complaint distribution"
# Daily customer complaints over 30 days
complaints <- c(2, 5, 3, 1, 4, 6, 2, 3, 5, 4,
                3, 7, 2, 4, 3, 5, 1, 6, 4, 3,
                2, 5, 3, 4, 2, 6, 3, 1, 4, 5)

data_mean <- mean(complaints)
data_var <- var(complaints)
ratio <- data_var / data_mean

cat("Mean:    ", round(data_mean, 2), "\n")
#> Mean:     3.57
cat("Variance:", round(data_var, 2), "\n")
#> Variance: 2.32
cat("Var/Mean:", round(ratio, 2), "\n")
#> Var/Mean: 0.65

if (ratio < 0.8) {
  cat("Verdict: Variance < Mean -> Consider Binomial\n")
} else if (ratio > 1.2) {
  cat("Verdict: Variance >> Mean -> Consider Negative Binomial (overdispersion)\n")
} else {
  cat("Verdict: Variance ≈ Mean -> Poisson is a good fit\n")
}
#> Verdict: Variance < Mean -> Consider Binomial
```

The variance-to-mean ratio is 0.65, well below 1.0. This suggests the data has less spread than a Poisson model would predict, pointing toward a binomial model, perhaps each day has a fixed pool of potential complainants with some probability of complaining.

[WARNING]
**If variance is much larger than the mean (ratio >> 1), neither distribution fits well.** This is called overdispersion, and you should consider the Negative Binomial distribution or a quasi-Poisson model. Forcing a Poisson on overdispersed data underestimates uncertainty in any downstream analysis.

**Try it:** Given weekly accident counts at an intersection, `c(4, 6, 5, 3, 7, 5, 4, 6, 5, 8, 4, 3)`, compute the mean, variance, and their ratio. Which distribution fits better?

```r title="Exercise: Accident mean variance ratio"
# Try it: diagnose the distribution for accident data
ex_accidents <- c(4, 6, 5, 3, 7, 5, 4, 6, 5, 8, 4, 3)
ex_mean <- mean(ex_accidents)
ex_var <- var(ex_accidents)
cat("Mean:", round(ex_mean, 2), " Var:", round(ex_var, 2),
    " Ratio:", round(ex_var / ex_mean, 2), "\n")
#> Expected: ratio close to 1 -> Poisson
```

<details>
<summary>Click to reveal solution</summary>

```r title="Accident ratio solution"
ex_accidents <- c(4, 6, 5, 3, 7, 5, 4, 6, 5, 8, 4, 3)
ex_mean <- mean(ex_accidents)
ex_var <- var(ex_accidents)
cat("Mean:", round(ex_mean, 2), " Var:", round(ex_var, 2),
    " Ratio:", round(ex_var / ex_mean, 2), "\n")
#> Mean: 5  Var: 2.18  Ratio: 0.44
```

**Explanation:** The ratio is 0.44, meaning variance is less than half the mean. This points toward a binomial model rather than Poisson. Perhaps there's a fixed number of vehicles passing through each week, and each has a small probability of an accident.

</details>

## Practice Exercises

### Exercise 1: Quality control comparison

A factory produces 500 items per batch, with a defect rate of 0.8%. Model the number of defective items using both Binomial(500, 0.008) and Poisson(lambda=4). Compare P(X >= 5) from each model. Then plot both PMFs for k=0 to 12 on the same chart.

```r title="Exercise: Quality control comparison"
# Exercise 1: Compare Binomial and Poisson for quality control
# Hint: use 1 - pbinom(4, ...) and 1 - ppois(4, ...) for P(X >= 5)
# For the plot, use barplot with rbind() and beside=TRUE



```

<details>
<summary>Click to reveal solution</summary>

```r title="Quality control solution"
# P(X >= 5) from both models
p_binom_ge5 <- 1 - pbinom(4, size = 500, prob = 0.008)
p_pois_ge5 <- 1 - ppois(4, lambda = 4)
cat("Binomial P(X >= 5):", round(p_binom_ge5, 4), "\n")
#> Binomial P(X >= 5): 0.3712
cat("Poisson  P(X >= 5):", round(p_pois_ge5, 4), "\n")
#> Poisson  P(X >= 5): 0.3712

# Plot both PMFs
my_k <- 0:12
my_binom <- dbinom(my_k, size = 500, prob = 0.008)
my_pois <- dpois(my_k, lambda = 4)
barplot(rbind(my_binom, my_pois), beside = TRUE,
        names.arg = my_k, col = c("steelblue", "coral"),
        xlab = "Defective items (k)", ylab = "P(X = k)",
        main = "Binomial(500, 0.008) vs Poisson(4)",
        legend.text = c("Binomial", "Poisson"))
```

**Explanation:** With n=500 and p=0.008, the Poisson approximation (lambda = 500 * 0.008 = 4) is excellent. Both give P(X >= 5) = 0.3712, and the PMF bars overlap almost perfectly.

</details>

### Exercise 2: Hospital simulation

An emergency room receives an average of 4.2 patients per hour (Poisson). Simulate 1,000 one-hour windows with rpois(). Find what fraction of hours have zero patients, and compare to the theoretical dpois(0, 4.2). Then, for each hour's patients, simulate whether each patient is admitted (30% chance) using rbinom(). Report the average admissions per hour and the maximum admissions seen.

```r title="Exercise: ER arrivals and admissions"
# Exercise 2: Hospital ER simulation
# Hint: first simulate arrivals with rpois(), then for each hour
# simulate admissions with rbinom(1, size=arrivals, prob=0.30)
set.seed(404)



```

<details>
<summary>Click to reveal solution</summary>

```r title="ER simulation solution"
set.seed(404)
# Simulate hourly arrivals
my_arrivals <- rpois(1000, lambda = 4.2)

# Fraction of hours with zero patients
my_zero_frac <- mean(my_arrivals == 0)
cat("Simulated P(0 patients):", round(my_zero_frac, 4), "\n")
#> Simulated P(0 patients): 0.013
cat("Theoretical P(0 patients):", round(dpois(0, 4.2), 4), "\n")
#> Theoretical P(0 patients): 0.015

# Simulate admissions per hour
my_admissions <- rbinom(1000, size = my_arrivals, prob = 0.30)
cat("Mean admissions/hour:", round(mean(my_admissions), 2), "\n")
#> Mean admissions/hour: 1.27
cat("Max admissions in any hour:", max(my_admissions), "\n")
#> Max admissions in any hour: 7
```

**Explanation:** The Poisson models arrivals (no fixed upper bound), while the binomial models admissions per hour (fixed n = arrivals that hour, binary outcome = admitted or not). This two-stage approach is common in real-world modelling.

</details>

### Exercise 3: Convergence experiment

Write a function that takes n and p, computes the maximum absolute difference between Binomial(n, p) and Poisson(lambda = np) PMFs for k = 0 to 20. Test it with n = 10, 50, 100, 500, and 1000 (using p = 5/n each time, so lambda = 5 is constant). Plot the maximum difference against n.

```r title="Exercise: Measure convergence rate"
# Exercise 3: measure convergence rate
# Hint: define a function max_diff(n, p) that computes
# max(abs(dbinom(0:20, n, p) - dpois(0:20, n*p)))



```

<details>
<summary>Click to reveal solution</summary>

```r title="Convergence rate solution"
my_max_diff <- function(n, p) {
  k_range <- 0:20
  max(abs(dbinom(k_range, size = n, prob = p) - dpois(k_range, lambda = n * p)))
}

my_n_vals <- c(10, 50, 100, 500, 1000)
my_diffs <- sapply(my_n_vals, function(n) my_max_diff(n, p = 5 / n))

names(my_diffs) <- my_n_vals
round(my_diffs, 6)
#>       10       50      100      500     1000
#> 0.032476 0.007227 0.003659 0.000740 0.000371

barplot(my_diffs, names.arg = my_n_vals,
        col = "steelblue", border = "white",
        xlab = "n (number of trials)",
        ylab = "Max |Binomial - Poisson|",
        main = "Convergence: Binomial -> Poisson")
```

**Explanation:** The maximum difference shrinks roughly as 1/n. At n=10 it's about 0.032 (noticeable), but by n=1000 it's just 0.0004 (negligible). This quantifies how quickly the Poisson approximation improves.

</details>

## Putting It All Together

Let's combine everything in a realistic scenario. A call center receives an average of 3 calls per minute (Poisson). Each call has an 85% chance of being resolved on first contact (binomial). We'll simulate 1,000 minutes of operations.

```r title="End-to-end call center simulation"
# Complete example: call center simulation
set.seed(500)
n_minutes <- 1000

# Stage 1: Poisson arrivals
calls <- rpois(n_minutes, lambda = 3)

# Stage 2: Binomial resolutions per minute
resolved <- rbinom(n_minutes, size = calls, prob = 0.85)

# Summary statistics
cat("=== Call Center Simulation (1000 minutes) ===\n\n")
cat("Arrivals (Poisson, lambda=3):\n")
cat("  Mean calls/min: ", round(mean(calls), 2), "\n")
cat("  Var calls/min:  ", round(var(calls), 2), "\n")
cat("  Max calls in 1 min:", max(calls), "\n\n")
#> Mean calls/min:  3.01
#> Var calls/min:   3.12
#> Max calls in 1 min: 11

cat("Resolutions (Binomial, n=calls, p=0.85):\n")
cat("  Mean resolved/min:", round(mean(resolved), 2), "\n")
cat("  Resolution rate:  ", round(mean(resolved) / mean(calls) * 100, 1), "%\n\n")
#> Mean resolved/min: 2.55
#> Resolution rate:   84.7 %

# What fraction of minutes had ALL calls resolved?
all_resolved <- mean(calls > 0 & resolved == calls)
zero_calls <- mean(calls == 0)
cat("P(all calls resolved | calls > 0):", round(all_resolved, 3), "\n")
#> P(all calls resolved | calls > 0): 0.435
cat("P(zero calls in a minute):        ", round(zero_calls, 3), "\n")
#> P(zero calls in a minute):         0.046

# Distribution of unresolved calls
unresolved <- calls - resolved
cat("Mean unresolved/min:", round(mean(unresolved), 2), "\n")
cat("Minutes with 3+ unresolved:", sum(unresolved >= 3), "\n")
#> Mean unresolved/min: 0.46
#> Minutes with 3+ unresolved: 12
```

This two-stage simulation shows how Poisson and binomial work together naturally. The Poisson models the random arrival process (no fixed upper bound on calls per minute), while the binomial models the resolution of each batch (fixed n = calls received, binary outcome = resolved or not). About 43.5% of active minutes see all calls resolved on first contact, and only 12 out of 1,000 minutes had 3 or more unresolved calls.

## Summary

Here's a side-by-side comparison of the two distributions:

| Property | Binomial | Poisson |
|---|---|---|
| **Models** | Successes in fixed n trials | Events in fixed time/space |
| **Parameters** | n (trials), p (success prob) | lambda (average rate) |
| **Support** | 0, 1, 2, ..., n | 0, 1, 2, 3, ... (no upper bound) |
| **Mean** | np | lambda |
| **Variance** | np(1-p) | lambda |
| **Var vs Mean** | Variance < Mean (always) | Variance = Mean |
| **R density** | dbinom(k, size, prob) | dpois(k, lambda) |
| **R cumulative** | pbinom(k, size, prob) | ppois(k, lambda) |
| **R quantile** | qbinom(p, size, prob) | qpois(p, lambda) |
| **R random** | rbinom(n, size, prob) | rpois(n, lambda) |
| **Use when** | Fixed trials, binary, known n | Events in time/space, no cap |
| **Example** | 20 coin flips, defect counts | Calls/hour, typos/page |

**Key takeaways:**

- Use **binomial** when you have a fixed number of independent binary trials with constant success probability.
- Use **Poisson** when you're counting events in continuous time or space with no natural upper bound.
- The **Poisson approximates the binomial** when n is large (>=100) and p is small (np <= 10).
- Check the **variance-to-mean ratio** of your data: < 1 suggests binomial, ≈ 1 suggests Poisson, >> 1 suggests negative binomial.
- R's **d/p/q/r prefix system** works identically across all distributions, learn it once, use it everywhere.

![Side-by-side comparison of binomial and Poisson parameters, with the Poisson limit bridge](screenshots/Binomial-and-Poisson-Distributions-in-R-parameters.webp)

*Figure 3: Side-by-side comparison of binomial and Poisson parameters, with the Poisson limit bridge.*

## References

1. R Core Team, *The Binomial Distribution*. R Documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Binomial.html)
2. R Core Team, *The Poisson Distribution*. R Documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Poisson.html)
3. Hogg, R.V., McKean, J.W., Craig, A.T., *Introduction to Mathematical Statistics*, 8th Edition. Pearson (2019). Chapters 3-4.
4. Casella, G., Berger, R.L., *Statistical Inference*, 2nd Edition. Cengage (2002). Section 3.2-3.3.
5. NIST/SEMATECH, *Binomial Distribution*. Engineering Statistics Handbook. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366i.htm)
6. NIST/SEMATECH, *Poisson Distribution*. Engineering Statistics Handbook. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm)
7. Emory University Math Center, *The Connection Between the Poisson and Binomial Distributions*. [Link](https://mathcenter.oxford.emory.edu/site/math117/connectingPoissonAndBinomial/)
8. Wickham, H., Grolemund, G., *R for Data Science*, 2nd Edition. O'Reilly (2023). [Link](https://r4ds.hadley.nz/)

## Continue Learning

- [Random Variables in R](Random-Variables-in-R.html), understand PMF, PDF, and CDF before diving into specific distributions like binomial and Poisson.
- [Conditional Probability in R](Conditional-Probability-in-R.html), the foundation for understanding trial-based probability and independence assumptions.
- [Probability Axioms in R](Sample-Spaces-Events-and-Probability-Axioms-in-R-With-Monte-Carlo-Proof.html), prove the rules of probability that underlie both distributions using Monte Carlo simulation.
