---
title: "Expected Value and Variance: Derive Them Theoretically, Then Verify via Simulation"
slug: "Expected-Value-and-Variance-in-R"
description: "Expected value is the probability-weighted mean; variance measures spread around it. Derive both theoretically, then verify via 10,000-draw R simulations."
keywords: "expected value in R, variance in R, E[X] formula, Var(X) formula, probability simulation R, LOTUS, linearity of expectation, shortcut variance formula"
auto_link_terms: "expected value in R|probability-weighted mean|variance formula|LOTUS|shortcut variance formula|linearity of expectation|sample mean convergence"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.1.5"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Expected Value and Variance"
sidebar_order: 20
difficulty: "Intermediate"
---

# Expected Value and Variance: Derive Them Theoretically, Then Verify via Simulation

<p class="lead">The <b>expected value</b> of a random variable is its long-run average, the probability-weighted mean of all outcomes. The <b>variance</b> measures how far typical outcomes sit from that average, squared. Derive each formula once, then verify it in seconds with a 10,000-draw R simulation. The sample statistic will close in on the theoretical value every time.</p>

## What is expected value, and why is it the long-run average?

A fair six-sided die lands on each face with probability 1/6. You will never roll a 3.5 on a single toss, yet 3.5 is the right answer for "what do you expect on average." The expected value resolves that paradox. Here it is in code, with one line for the theoretical formula and another for the proof by simulation.

```r title="Simulate 100,000 dice rolls and compute E[X]"
# Simulate a fair six-sided die
set.seed(1)
rolls <- sample(1:6, size = 1e5, replace = TRUE)

# Sample mean from 100,000 rolls
mean(rolls)
#> [1] 3.50102

# Theoretical expected value: sum of x * P(x)
sum((1:6) * (1/6))
#> [1] 3.5
```

The sample mean landed at 3.50102, indistinguishable from the theoretical 3.5 at three decimal places. The formula `sum(x * P(x))` is the entire definition of expected value for a discrete variable. Each face contributes its own value weighted by how likely it is, and you add them up. Simulation is just doing the weighting empirically instead of by formula.

[KEY INSIGHT]
**Expected value is not a value you will see, it is the balancing point of all outcomes.** Stack 1/6 of your mass at each face from 1 to 6 on a seesaw, and 3.5 is the pivot that balances the whole thing. That's why E[X] can be a non-integer for an integer-valued variable.

For a general discrete random variable $X$ with outcomes $x_1, x_2, \ldots$ and probabilities $P(X = x_i)$:

$$E[X] = \sum_{i} x_i \cdot P(X = x_i)$$

The R pattern `sum(vals * probs)` computes this directly. You can also write it with `weighted.mean(vals, probs)` or `c(vals %*% probs)`. All three return the same number.

**Try it:** A biased coin lands heads with probability 0.7. Define $X = 1$ when heads and $X = 0$ when tails. Compute $E[X]$ by formula, then verify with a simulation of 50,000 flips.

```r title="Your turn: biased coin expected value"
# Define outcomes and probabilities
ex_vals <- c(1, 0)
ex_probs <- c(0.7, 0.3)

# Theoretical E[X]:
# your code here

# Simulation:
set.seed(2)
ex_flips <- sample(ex_vals, size = 5e4, replace = TRUE, prob = ex_probs)
# your code here for sample mean

#> Expected: theoretical = 0.7, sample mean ~ 0.70 (within 0.01)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Biased coin solution"
ex_vals <- c(1, 0)
ex_probs <- c(0.7, 0.3)

# Theoretical
sum(ex_vals * ex_probs)
#> [1] 0.7

# Simulation
set.seed(2)
ex_flips <- sample(ex_vals, size = 5e4, replace = TRUE, prob = ex_probs)
mean(ex_flips)
#> [1] 0.70048
```

**Explanation:** For a Bernoulli variable, $E[X] = p$ because the only non-zero contribution is $1 \cdot p$. The sample mean of a long string of 0s and 1s is just the proportion of 1s, which by the law of large numbers approaches $p$.

</details>

## How do you derive and simulate variance?

Expected value tells you the center. Variance tells you how wide the cloud of outcomes is around that center. It is the average squared distance from the mean. The "squared" matters, positive and negative deviations do not cancel, and it makes the math combine nicely under sums of independent variables.

There are two equivalent formulas. Write them both down because the second one is easier for hand derivations.

$$\text{Var}(X) = E[(X - \mu)^2] = E[X^2] - (E[X])^2$$

The shortcut formula $E[X^2] - (E[X])^2$ says: take the expectation of $X$ squared, subtract the square of the expectation. Let us derive Var for the fair die, then simulate.

```r title="Derive and simulate variance of a fair die"
# E[X^2] = sum of x^2 * P(x)
ex2 <- sum((1:6)^2 * (1/6))
ex2
#> [1] 15.16667

# (E[X])^2 = 3.5^2
mu_sq <- 3.5^2
mu_sq
#> [1] 12.25

# Theoretical variance
var_theory <- ex2 - mu_sq
var_theory
#> [1] 2.916667

# Sample variance from the same 100,000 rolls
var(rolls)
#> [1] 2.917153
```

The theoretical variance is $35/12 \approx 2.917$, and R's `var()` on the 100,000 rolls returned 2.917153. The match is precise because 100,000 is a lot of rolls. With only 30 rolls, the sample variance would still cluster around 2.917 but with visible noise. Variance, like expectation, converges as N grows.

[TIP]
**R's `var()` uses `n - 1` in the denominator, not `n`.** This is the unbiased sample variance. The theoretical variance uses $n$ (or rather, no division since probabilities already sum to 1). For large N the difference is negligible, $n/(n-1)$ approaches 1, but for tiny samples it matters. Population variance is available via `var(x) * (n-1) / n`.

**Try it:** Compute the variance for the sum of two independent fair dice. Use the shortcut formula. Hint: the sum ranges from 2 to 12, and `outer(1:6, 1:6, "+")` gives you all 36 equally likely combinations.

```r title="Your turn: variance of two-dice sum"
# Build all 36 sums, each with probability 1/36
ex_sums <- as.vector(outer(1:6, 1:6, "+"))
ex_p <- rep(1/36, 36)

# Your code: compute E[X], E[X^2], then variance via shortcut

#> Expected: E[X] = 7, Var(X) = 35/6 ≈ 5.833
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-dice variance solution"
ex_sums <- as.vector(outer(1:6, 1:6, "+"))
ex_p <- rep(1/36, 36)

ex_mean <- sum(ex_sums * ex_p)
ex_ex2 <- sum(ex_sums^2 * ex_p)
ex_var <- ex_ex2 - ex_mean^2

c(mean = ex_mean, variance = ex_var)
#>     mean variance
#> 7.000000 5.833333
```

**Explanation:** Two independent dice have $E[X+Y] = E[X] + E[Y] = 3.5 + 3.5 = 7$ and $\text{Var}(X+Y) = \text{Var}(X) + \text{Var}(Y) = 35/12 + 35/12 = 35/6$. The computation confirms both.

</details>

## How do expectation and variance extend to continuous random variables?

For continuous random variables, swap the sum for an integral and the probability mass function (PMF, the list of probabilities for a discrete variable) for a probability density function (PDF, a smooth curve whose area under a slice gives probability). The intuition is identical, only the notation changes.

$$E[X] = \int_{-\infty}^{\infty} x \cdot f(x) \, dx \qquad \text{Var}(X) = \int_{-\infty}^{\infty} (x - \mu)^2 f(x) \, dx$$

You are still computing a probability-weighted average of values. Where the discrete case weights by $P(x)$, the continuous case weights by $f(x) \, dx$, an infinitesimal slice of probability.

![Discrete and continuous expected value formulas side by side.](screenshots/Expected-Value-and-Variance-in-R-discrete-vs-continuous.webp)
*Figure 1: Discrete variables sum probability-weighted values; continuous variables integrate over the density. Either way, R simulation gives you a check in seconds.*

Let us verify two classics: the uniform and the exponential.

```r title="Uniform(0,1) expected value and variance"
# Theoretical for Uniform(a, b):
# E[X] = (a + b) / 2       -> for (0, 1) = 0.5
# Var(X) = (b - a)^2 / 12  -> for (0, 1) = 1/12 ≈ 0.0833

set.seed(3)
u <- runif(1e5, min = 0, max = 1)

c(sample_mean = mean(u), sample_var = var(u))
#> sample_mean  sample_var
#>  0.50056900  0.08336221
```

Theoretical E = 0.5, sample mean = 0.5006. Theoretical Var = 0.0833, sample variance = 0.0834. Same pattern: one line of code delivers the numbers the integral would give you with more work.

Now an exponential distribution, which is skewed rather than flat.

```r title="Exponential(rate=2) expected value and variance"
# Theoretical for Exponential(rate):
# E[X] = 1 / rate      -> 1/2 = 0.5
# Var(X) = 1 / rate^2  -> 1/4 = 0.25

set.seed(4)
e <- rexp(1e5, rate = 2)

c(sample_mean = mean(e), sample_var = var(e))
#> sample_mean  sample_var
#>   0.4992173   0.2498211
```

Both statistics land inside 0.002 of the theoretical values. The exponential is a skewed distribution, most draws are near zero, with a long right tail, yet the machinery is exactly the same. Write down the formula, simulate, compare.

[NOTE]
**R's `dexp()`, `pexp()`, and `rexp()` take a rate parameter, not a mean.** Many textbooks parameterize exponentials by mean $\beta = 1/\lambda$. If someone tells you "mean 10 exponential," use `rate = 1/10` in R. Getting this backwards is the most common mistake with the exponential family.

**Try it:** Compute theoretical $E[X]$ and $\text{Var}(X)$ for $X \sim \text{Uniform}(2, 10)$. Then simulate 10,000 draws and compare.

```r title="Your turn: Uniform(2, 10)"
ex_a <- 2
ex_b <- 10

# Theoretical
# your code here

# Simulation
set.seed(5)
ex_u <- runif(1e4, min = ex_a, max = ex_b)
# your code here

#> Expected: E[X] = 6, Var(X) = 64/12 ≈ 5.333, sample stats within 0.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Uniform(2, 10) solution"
ex_a <- 2
ex_b <- 10

# Theoretical
c(mean = (ex_a + ex_b) / 2, variance = (ex_b - ex_a)^2 / 12)
#>     mean variance
#>  6.00000  5.33333

# Simulation
set.seed(5)
ex_u <- runif(1e4, min = ex_a, max = ex_b)
c(sample_mean = mean(ex_u), sample_var = var(ex_u))
#> sample_mean  sample_var
#>    5.988134    5.384251
```

**Explanation:** The uniform distribution is symmetric, so the mean is the midpoint. The variance depends only on the range, because shifting $(a, b)$ left or right does not change spread.

</details>

## How do linearity and independence change E and Var?

Three rules do most of the practical work. Linearity of expectation. Quadratic scaling of variance. Additivity under independence. You can derive each from the definitions, but it is faster to state them and prove them by simulation.

**Linearity of expectation** (no independence assumption needed):
$$E[aX + b] = a \cdot E[X] + b \qquad E[X + Y] = E[X] + E[Y]$$

**Variance under linear transformation and independent sums**:
$$\text{Var}(aX + b) = a^2 \cdot \text{Var}(X) \qquad \text{Var}(X + Y) = \text{Var}(X) + \text{Var}(Y) \text{ if } X \perp Y$$

The $b$ drops out of variance because shifting every outcome by a constant does not change spread. The $a$ squares because variance is in squared units. Let us verify with dice.

```r title="Linearity and scaling: Y = 3X + 5 on dice"
# Start from the dice rolls in Block 1
Y <- 3 * rolls + 5

# Theoretical predictions:
# E[Y]   = 3 * E[X] + 5       = 3 * 3.5 + 5         = 15.5
# Var(Y) = 3^2 * Var(X)       = 9 * 35/12           = 26.25

c(sample_mean_Y = mean(Y), sample_var_Y = var(Y))
#> sample_mean_Y  sample_var_Y
#>     15.50306      26.25438
```

The transformed variable has mean 15.5 and variance 26.25, right on the theoretical predictions. Notice the constant 5 lifted the mean by 5 but did not change the variance. The factor 3 scaled the mean by 3 and the variance by 9. That quadratic behavior is why standard deviation ($\sqrt{\text{Var}}$) is often the more intuitive spread measure, it scales linearly.

Now contrast independent versus correlated sums.

```r title="Independent vs correlated: Var(X+Y) under two regimes"
set.seed(6)
x_norm <- rnorm(1e5, mean = 0, sd = 1)
y_norm <- rnorm(1e5, mean = 0, sd = 1)   # drawn independently of x_norm

# Independent sum: Var(X + Y) = 1 + 1 = 2
var(x_norm + y_norm)
#> [1] 2.000108

# Perfectly correlated: Y = X, so Var(X + X) = Var(2X) = 4 * Var(X) = 4
var(x_norm + x_norm)
#> [1] 4.004317
```

Two independent standard normals each have variance 1. Adding them gives variance 2. But if you add a standard normal to itself, you get variance 4, not 2, because the "variance adds" rule requires independence. Doubling $X$ scales its variance by $2^2 = 4$.

[WARNING]
**Linearity of expectation always holds, variance additivity needs independence.** You can write $E[X + Y] = E[X] + E[Y]$ for any $X$ and $Y$, correlated or not. You cannot do the same with variance. If $X$ and $Y$ are correlated, the formula is $\text{Var}(X + Y) = \text{Var}(X) + \text{Var}(Y) + 2\text{Cov}(X, Y)$. Ignoring that covariance term is a classic pitfall in portfolio risk and experiment design.

**Try it:** For $X \sim N(0, 1)$, simulate $Y = 3X$. Report the sample mean and sample variance of $Y$.

```r title="Your turn: Y = 3X"
set.seed(7)
ex_x <- rnorm(1e5, mean = 0, sd = 1)

# Compute Y and its summary statistics
# your code here

#> Expected: mean(Y) ≈ 0, var(Y) ≈ 9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Y = 3X solution"
set.seed(7)
ex_x <- rnorm(1e5, mean = 0, sd = 1)
ex_y <- 3 * ex_x

c(mean_Y = mean(ex_y), var_Y = var(ex_y))
#>     mean_Y      var_Y
#> 0.01071632 8.97841421
```

**Explanation:** Mean scales linearly (3 times 0 is still 0). Variance scales by $3^2 = 9$. Standard deviation scales by 3, so $Y$ has sd 3 and var 9, which matches.

</details>

## Why does the sample mean converge to E[X]?

Every simulation above worked because of the Law of Large Numbers. As you take more and more draws, the sample mean converges to the expected value. Let us watch it happen in slow motion.

![Simulation-to-theory feedback loop.](screenshots/Expected-Value-and-Variance-in-R-convergence-flow.webp)
*Figure 2: The gap between sample statistics and theoretical values shrinks as N grows. Simulation is a built-in check on every derivation you do.*

```r title="Running mean of dice rolls converges to 3.5"
library(ggplot2)

# Cumulative sample mean at each n
run_mean <- cumsum(rolls) / seq_along(rolls)

run_df <- data.frame(
  n = seq_along(rolls),
  running_mean = run_mean
)

ggplot(run_df[run_df$n >= 10, ], aes(x = n, y = running_mean)) +
  geom_line(color = "#4b4eab") +
  geom_hline(yintercept = 3.5, color = "#c0392b", linetype = "dashed") +
  scale_x_log10() +
  labs(
    x = "Number of rolls (log scale)",
    y = "Running sample mean",
    title = "Sample mean converges to E[X] = 3.5"
  ) +
  theme_minimal()
```

Early on, the running mean swings wildly. With a handful of rolls, a few 6s in a row can pull it above 4. By N = 100 the curve has narrowed noticeably, and by N = 10,000 it is hugging 3.5 tightly. The variance of the sample mean shrinks as $\sigma^2 / N$, so its standard error shrinks as $\sigma / \sqrt{N}$.

[KEY INSIGHT]
**Accuracy of the sample mean improves as $1/\sqrt{N}$, not $1/N$.** To halve the error on your estimate of $E[X]$, you need four times the samples, not twice. To divide the error by 10, you need 100× more simulations. This square-root penalty is the single most important scaling fact in simulation work.

**Try it:** Simulate a running mean for $X \sim \text{Poisson}(\lambda = 3)$ across N from 10 to 10,000. Plot it with a horizontal line at 3.

```r title="Your turn: running mean for Poisson(3)"
set.seed(8)
ex_poi <- rpois(1e4, lambda = 3)

# Compute running mean and plot with horizontal line at 3
# your code here

#> Expected: curve converges to 3 by n = 10,000
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson running mean solution"
set.seed(8)
ex_poi <- rpois(1e4, lambda = 3)

ex_run <- cumsum(ex_poi) / seq_along(ex_poi)
ex_df <- data.frame(n = seq_along(ex_poi), running_mean = ex_run)

ggplot(ex_df[ex_df$n >= 10, ], aes(x = n, y = running_mean)) +
  geom_line(color = "#4b4eab") +
  geom_hline(yintercept = 3, color = "#c0392b", linetype = "dashed") +
  scale_x_log10() +
  labs(x = "N", y = "Running mean", title = "Poisson(3) sample mean")
```

**Explanation:** Poisson has $E[X] = \lambda = 3$, so the curve targets 3. The log-scale x-axis spreads out the early wild swings so you can see how the curve stabilizes.

</details>

## Practice Exercises

### Exercise 1: Custom discrete distribution

A random variable $X$ takes values 1, 2, 5, 10 with probabilities 0.4, 0.3, 0.2, 0.1. Compute $E[X]$ and $\text{Var}(X)$ by formula, then simulate 50,000 draws and confirm.

```r title="Custom PMF starter"
# Setup
my_vals  <- c(1, 2, 5, 10)
my_probs <- c(0.4, 0.3, 0.2, 0.1)

# Theoretical E[X] and Var(X) using the shortcut formula
# Hint: sum(my_vals * my_probs) for E, then subtract square of mean from E[X^2]

# Simulation
set.seed(42)
my_draws <- sample(my_vals, size = 5e4, replace = TRUE, prob = my_probs)

# Compare theoretical vs sample
```

<details>
<summary>Click to reveal solution</summary>

```r title="Custom PMF solution"
my_vals  <- c(1, 2, 5, 10)
my_probs <- c(0.4, 0.3, 0.2, 0.1)

my_mean  <- sum(my_vals * my_probs)
my_ex2   <- sum(my_vals^2 * my_probs)
my_var   <- my_ex2 - my_mean^2

set.seed(42)
my_draws <- sample(my_vals, size = 5e4, replace = TRUE, prob = my_probs)

rbind(
  theoretical = c(E = my_mean, Var = my_var),
  simulation  = c(E = mean(my_draws), Var = var(my_draws))
)
#>                  E    Var
#> theoretical 3.0000 7.6000
#> simulation  3.0034 7.6182
```

**Explanation:** $E[X] = 1(0.4) + 2(0.3) + 5(0.2) + 10(0.1) = 3.0$. $E[X^2] = 1(0.4) + 4(0.3) + 25(0.2) + 100(0.1) = 16.6$, so $\text{Var}(X) = 16.6 - 3.0^2 = 7.6$. The simulated values land within 0.02 of both theoretical quantities, a tight match delivered by 50,000 draws.

</details>

### Exercise 2: Verify variance via LOTUS

For $X \sim \text{Uniform}(0, 1)$, the Law of the Unconscious Statistician says $E[g(X)] = \int g(x) f(x) \, dx$. Use this to show $E[X^2] = 1/3$ analytically and by simulation. Then confirm the shortcut identity $\text{Var}(X) = E[X^2] - (E[X])^2 = 1/3 - 1/4 = 1/12$.

```r title="LOTUS starter"
# Simulate X ~ Uniform(0, 1)
set.seed(100)
my_u <- runif(1e5)

# Compute E[X^2] by simulation
# Compute Var(X) directly and via the shortcut identity
# Confirm both match 1/12

```

<details>
<summary>Click to reveal solution</summary>

```r title="LOTUS solution"
set.seed(100)
my_u <- runif(1e5)

# LOTUS: E[X^2] from sample
my_ex2_sim <- mean(my_u^2)
my_ex2_sim
#> [1] 0.3337015

# Analytical: E[X^2] = integral of x^2 from 0 to 1 = 1/3
1/3
#> [1] 0.3333333

# Shortcut identity: Var = E[X^2] - E[X]^2
my_var_shortcut <- my_ex2_sim - mean(my_u)^2
# Direct: var(my_u)
c(direct = var(my_u), shortcut = my_var_shortcut, theoretical = 1/12)
#>       direct     shortcut  theoretical
#>    0.0833491    0.0833482    0.0833333
```

**Explanation:** LOTUS says: to compute the expectation of a function of a random variable, average the function over the samples. You do not need the distribution of $g(X)$, just the distribution of $X$ itself. Both the direct `var()` and the shortcut identity agree with 1/12 to three decimal places.

</details>

## Complete Example

Suppose your office logs the number of late arrivals per day over 300 weekdays. You want two things: the average expected daily lateness, and a measure of day-to-day variability. Here is the full loop, from raw counts to theoretical fit.

```r title="End-to-end: late arrivals analysis"
# Simulate a realistic dataset: true process is Poisson(lambda = 2.5)
set.seed(2026)
arrivals <- rpois(300, lambda = 2.5)

# Step 1: empirical E and Var from the data
emp_mean <- mean(arrivals)
emp_var  <- var(arrivals)

c(emp_mean = emp_mean, emp_var = emp_var)
#> emp_mean  emp_var
#> 2.486667 2.619699

# Step 2: if we model as Poisson, the sample mean is our estimate of lambda
lambda_hat <- emp_mean
lambda_hat
#> [1] 2.486667

# Step 3: Poisson theory says E[X] = lambda and Var(X) = lambda (same parameter!)
# If the data is truly Poisson, empirical mean and variance should be close.
c(lambda_hat_mean = lambda_hat, lambda_hat_var = lambda_hat)
#> lambda_hat_mean  lambda_hat_var
#>        2.486667        2.486667

# Step 4: the ratio Var/Mean is a quick diagnostic (should be ~1 for Poisson)
emp_var / emp_mean
#> [1] 1.053498
```

The empirical mean (2.49) and variance (2.62) are close, and their ratio is 1.05, very near the Poisson signature of 1. That suggests the count process is consistent with Poisson. If the ratio had been 3 or higher, the data would be *overdispersed* and you would reach for a negative binomial instead. Expected value and variance are not just textbook summaries, they are the first diagnostic you run on any count dataset.

## Summary

The expected value is a weighted average and the variance is a weighted average of squared deviations. Everything else, continuous case, linearity, independence, is a variation on that theme. Simulation in R converts every formula into a visible, testable fact.

![Overview mindmap.](screenshots/Expected-Value-and-Variance-in-R-ev-var-mindmap.webp)
*Figure 3: Expected value, variance, and simulation checks all connect through the same probability-weighted-average machinery.*

| Concept | Formula | R code |
|---|---|---|
| Discrete E[X] | $\sum x \cdot P(x)$ | `sum(vals * probs)` |
| Continuous E[X] | $\int x \cdot f(x) \, dx$ | `mean(sample)` on a large simulated sample |
| Shortcut Var | $E[X^2] - (E[X])^2$ | `sum(vals^2 * probs) - sum(vals * probs)^2` |
| Sample var (unbiased) | $\frac{1}{n-1} \sum (x_i - \bar{x})^2$ | `var(x)` |
| Linearity | $E[aX + b] = aE[X] + b$ | same identity holds in R numerically |
| Variance scaling | $\text{Var}(aX + b) = a^2 \text{Var}(X)$ | `var(a * x + b)` returns $a^2 \cdot \text{var}(x)$ |
| Independent sum | $\text{Var}(X + Y) = \text{Var}(X) + \text{Var}(Y)$ | only if `x` and `y` are independent draws |
| Convergence | sample mean error shrinks as $\sigma / \sqrt{N}$ | watch `cumsum(x) / seq_along(x)` |

Reach for the formula when you need closed-form answers. Reach for simulation when the formula is hard, when you want a sanity check, or when you need to communicate an intuition. The two methods together are stronger than either alone.

## References

1. Grinstead, C. & Snell, J. L.: *Introduction to Probability*, Chapter 6: Expected Value and Variance. Free online at American Mathematical Society. [Link](https://www.dartmouth.edu/~chance/teaching_aids/books_articles/probability_book/book.html)
2. Pishro-Nik, H.: *Introduction to Probability, Statistics, and Random Processes*, Section 4.1.2: Expected Value and Variance. [Link](https://www.probabilitycourse.com/chapter4/4_1_2_expected_val_variance.php)
3. Ross, S.: *A First Course in Probability*, 10th Edition, Chapter 7 (Properties of Expectation). Pearson.
4. MIT OpenCourseWare 18.05: Class 5 Prep: Variance of Discrete Random Variables. [Link](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/)
5. R Core Team: `var()` function documentation in the `stats` package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html)
6. Dalgaard, P.: *Introductory Statistics with R*, 2nd Edition, Chapter 2 (Probability and Distributions). Springer.

## Continue Learning

- **[Random Variables in R](Random-Variables-in-R.html)**: The discrete-vs-continuous distinction that sets the stage for every expectation formula above.
- **[Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html)**: Named distributions where $E[X]$ and $\text{Var}(X)$ have simple closed forms in terms of the parameters.
- **[Central Limit Theorem in R](Central-Limit-Theorem-in-R.html)**: Why the sample mean not only converges to $E[X]$ but does so with a predictable normal-shaped error distribution.
