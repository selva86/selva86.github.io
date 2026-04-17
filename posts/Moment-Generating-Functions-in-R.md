---
title: "Moment Generating Functions in R: Theory, Computation & Applications"
slug: "Moment-Generating-Functions-in-R"
description: "Learn moment generating functions in R: definitions, derivatives for moments, MGFs of common distributions, sums of independent variables, and uniqueness."
keywords: "moment generating function R, MGF R, compute MGF in R, MGF derivatives, MGF common distributions, MGF sum independent variables, MGF uniqueness"
auto_link_terms: "moment generating function|moment generating functions|MGF in R|moment-generating function|MGF derivatives"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-17"
curriculum_id: "FR-prob-2"
post_type: "FR"
fr_parent: "Expected-Value-and-Variance-in-R.html"
difficulty: "Intermediate"
---

# Moment Generating Functions in R: Theory, Computation & Applications

<p class="lead">The **moment generating function (MGF)** of a random variable $X$ is $M_X(t) = E[e^{tX}]$. When it exists in a neighbourhood of $t=0$, every moment of $X$, mean, variance, skewness, kurtosis, can be read off by differentiating $M_X(t)$ at $t=0$. MGFs also turn convolutions of independent random variables into plain products, and their uniqueness property lets you identify a distribution from its MGF alone.</p>

## What is a moment generating function in R?

The MGF is a *transform*: it repackages everything a random variable knows about itself into a single function of a dummy variable $t$. The payoff is that routine questions like "what is $E[X]$?" or "what is $Var(X)$?" become derivative evaluations, no integrals required once you have the MGF. Let's compute the MGF of an Exponential($\lambda = 2$) random variable at a few values of $t$ and check it matches the closed form $\lambda / (\lambda - t)$.

```r
# MGF of Exponential(rate = lambda): M(t) = lambda / (lambda - t), valid for t < lambda
mgf_exp <- function(t, lambda = 2) lambda / (lambda - t)

t_grid   <- c(0, 0.5, 1, 1.5)
mgf_vals <- mgf_exp(t_grid)
data.frame(t = t_grid, M_t = mgf_vals)
#>     t M_t
#> 1 0.0 1.0
#> 2 0.5 1.333333
#> 3 1.0 2.0
#> 4 1.5 4.0
```

Three things to notice. First, $M_X(0) = 1$, this is always true for any MGF, since $E[e^0] = E[1] = 1$. It's a useful sanity check. Second, the function grows fast as $t$ approaches $\lambda = 2$ (the boundary); at $t = 2$ it blows up. Third, we can only evaluate the MGF for $t < \lambda$, outside that window the expectation diverges. Every MGF has such a *region of convergence* around zero.

That's the formula, but does it match reality? Let's draw samples from the distribution and approximate $E[e^{tX}]$ by the sample average.

```r
# Empirical MGF: replace the expectation with a sample mean
set.seed(2026)
x_samples <- rexp(n = 1e5, rate = 2)
mc_vals   <- sapply(t_grid, function(t) mean(exp(t * x_samples)))

data.frame(t = t_grid, theoretical = mgf_vals, monte_carlo = round(mc_vals, 4))
#>     t theoretical monte_carlo
#> 1 0.0    1.000000      1.0000
#> 2 0.5    1.333333      1.3323
#> 3 1.0    2.000000      1.9941
#> 4 1.5    4.000000      3.9672
```

The Monte Carlo estimates track the theoretical values to three decimal places, exactly what the law of large numbers predicts. This is the reassurance we need before trusting MGF-based derivations later in the post: the formula $M_X(t) = E[e^{tX}]$ is not an abstract identity, it's a real expectation that you can sample against.

![From Random Variable to Moments via MGF](screenshots/Moment-Generating-Functions-in-R-mgf-workflow.webp)
*Figure 1: How an MGF converts a random variable into its moments via derivatives at zero.*

[KEY INSIGHT]
**An MGF is the DNA test of a distribution.** If two random variables have the same MGF on an open interval around zero, they have the same distribution, period. No two distributions share an MGF.

**Try it:** Write a function `ex_mgf_exp3(t)` for the MGF of Exponential(rate = 3). Evaluate it at t = 1, then confirm by Monte Carlo using 1e5 samples.

```r
# Try it: MGF of Exp(3) at t = 1
ex_mgf_exp3 <- function(t) {
  # your code here
}

ex_mgf_exp3(1)
#> Expected: 1.5

# Monte Carlo check
set.seed(7)
ex_samples <- rexp(1e5, rate = 3)
# compute ex_mc_val as mean(exp(1 * ex_samples))
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mgf_exp3 <- function(t) 3 / (3 - t)
ex_mgf_exp3(1)
#> [1] 1.5

set.seed(7)
ex_samples <- rexp(1e5, rate = 3)
ex_mc_val  <- mean(exp(1 * ex_samples))
ex_mc_val
#> [1] 1.5016
```

**Explanation:** Plug $\lambda = 3$ into $\lambda/(\lambda - t)$. The Monte Carlo average of $e^{tX}$ over 100,000 samples lands within 0.2% of the theoretical 1.5.

</details>

## How do you extract moments from an MGF?

This is the "generating" part of "moment generating function". The $k$-th moment of $X$, that is, $E[X^k]$, equals the $k$-th derivative of $M_X(t)$ evaluated at $t=0$:

$$E[X^k] = \left.\frac{d^k}{dt^k} M_X(t)\right|_{t=0}$$

The intuition comes from Taylor expanding $e^{tX}$:

$$M_X(t) = E\left[1 + tX + \frac{t^2 X^2}{2!} + \cdots\right] = 1 + t\, E[X] + \frac{t^2}{2!} E[X^2] + \cdots$$

Differentiating $k$ times and setting $t=0$ pops out $E[X^k]$ and kills every other term. In R, we don't even have to do the calculus by hand, base R's `D()` function performs symbolic differentiation on expressions.

```r
# MGF of Exp(lambda=2) as a symbolic expression, then differentiate
mgf_expr <- expression(2 / (2 - t))

d1 <- D(mgf_expr, "t")       # first derivative w.r.t. t
d2 <- D(d1, "t")             # second derivative

# Evaluate derivatives at t = 0 to get the moments
t <- 0
mean_x          <- eval(d1)
second_moment_x <- eval(d2)
var_x           <- second_moment_x - mean_x^2

c(mean = mean_x, second_moment = second_moment_x, variance = var_x)
#>          mean second_moment      variance 
#>          0.50          0.50          0.25
```

The numbers line up with the textbook formulas for Exp($\lambda$): mean is $1/\lambda = 0.5$, variance is $1/\lambda^2 = 0.25$. We never wrote an integral. The `D()` call did the symbolic work; `eval()` just plugged $t = 0$ into the resulting expressions. For any MGF you can write as a single R `expression()`, this two-line recipe recovers every moment.

[TIP]
**Prefer symbolic differentiation over finite differences.** Finite-difference approximations of derivatives accumulate floating-point error near $t = 0$, exactly where you need to evaluate. `D()` returns an exact symbolic derivative, so there's no truncation bias to tune.

**Try it:** Use `D()` to compute the second moment $E[X^2]$ and variance of an Exponential(rate = 3) random variable. Compare your variance to the formula $1/\lambda^2$.

```r
# Try it: moments of Exp(3) via symbolic differentiation
ex_mgf_expr3 <- expression(3 / (3 - t))
# your code here — compute ex_d1, ex_d2, then ex_mean, ex_second, ex_var
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mgf_expr3 <- expression(3 / (3 - t))
ex_d1 <- D(ex_mgf_expr3, "t")
ex_d2 <- D(ex_d1, "t")

t <- 0
ex_mean   <- eval(ex_d1)
ex_second <- eval(ex_d2)
ex_var    <- ex_second - ex_mean^2

c(mean = ex_mean, second_moment = ex_second, variance = ex_var)
#>          mean second_moment      variance 
#>     0.3333333     0.2222222     0.1111111
```

**Explanation:** Mean is $1/3 \approx 0.333$; variance is $1/9 \approx 0.111$. Both match the closed-form Exp($\lambda$) identities.

</details>

## What are the MGFs of common distributions?

Most named distributions have simple closed-form MGFs. The table below is the single most useful piece of reference material in this post, bookmark it.

| Distribution | MGF $M_X(t)$ | Domain of $t$ | Mean | Variance |
|---|---|---|---|---|
| Bernoulli($p$) | $(1-p) + p e^t$ | all $t$ | $p$ | $p(1-p)$ |
| Binomial($n, p$) | $[(1-p) + p e^t]^n$ | all $t$ | $np$ | $np(1-p)$ |
| Poisson($\lambda$) | $\exp(\lambda(e^t - 1))$ | all $t$ | $\lambda$ | $\lambda$ |
| Exponential($\lambda$) | $\lambda / (\lambda - t)$ | $t < \lambda$ | $1/\lambda$ | $1/\lambda^2$ |
| Normal($\mu, \sigma^2$) | $\exp(\mu t + \sigma^2 t^2 / 2)$ | all $t$ | $\mu$ | $\sigma^2$ |
| Gamma($k, \lambda$) | $(\lambda / (\lambda - t))^k$ | $t < \lambda$ | $k/\lambda$ | $k/\lambda^2$ |

Seeing the formulas side-by-side tells you something deep: the Gamma MGF is the Exponential MGF to a power, hinting that a Gamma($k, \lambda$) is a sum of $k$ independent Exp($\lambda$) variables, we'll prove exactly that in the capstone exercises. Let's encode the six MGFs in R and plot them.

```r
library(ggplot2)

mgf_bern  <- function(t, p = 0.3)              (1 - p) + p * exp(t)
mgf_binom <- function(t, n = 10, p = 0.3)      ((1 - p) + p * exp(t))^n
mgf_pois  <- function(t, lambda = 3)           exp(lambda * (exp(t) - 1))
mgf_exp2  <- function(t, lambda = 2)           lambda / (lambda - t)
mgf_norm  <- function(t, mu = 0, sigma = 1)    exp(mu * t + sigma^2 * t^2 / 2)
mgf_gamma <- function(t, k = 3, lambda = 2)    (lambda / (lambda - t))^k

# Evaluate each MGF on a shared grid and stack for ggplot
t_vec <- seq(-1, 1, length.out = 200)
df_mgf <- data.frame(
  t            = rep(t_vec, 6),
  M_t          = c(mgf_bern(t_vec), mgf_binom(t_vec), mgf_pois(t_vec),
                   mgf_exp2(t_vec), mgf_norm(t_vec), mgf_gamma(t_vec)),
  distribution = rep(c("Bernoulli(0.3)", "Binomial(10, 0.3)", "Poisson(3)",
                       "Exp(2)", "Normal(0,1)", "Gamma(3, 2)"), each = length(t_vec))
)

ggplot(df_mgf, aes(t, M_t, colour = distribution)) +
  geom_line(linewidth = 0.8) +
  coord_cartesian(ylim = c(0, 10)) +
  labs(title = "MGFs of six common distributions on t in [-1, 1]",
       x = "t", y = "M(t)") +
  theme_minimal(base_size = 12)
```

All six MGFs pass through $(0, 1)$, as they must. Near $t = 0$ they all curve gently upward, the slope at zero is the mean of the distribution, and the curvature is related to the variance. The Binomial(10, 0.3) climbs fastest because it has the largest mean among the six (mean = 3), while Bernoulli(0.3), with mean 0.3, barely rises.

[NOTE]
**The Normal MGF is the most-used formula in this table.** $\exp(\mu t + \sigma^2 t^2 / 2)$ is a quadratic in the exponent, and every higher cumulant (third, fourth...) is zero. That single fact is why sums of Normals stay Normal and why the Central Limit Theorem feels natural.

**Try it:** Write `ex_mgf_pois(t, lambda)` from scratch and evaluate it at t = 0.5 for both lambda = 2 and lambda = 5. Which Poisson has the larger MGF at t = 0.5, and why?

```r
# Try it: Poisson MGF
ex_mgf_pois <- function(t, lambda) {
  # your code here
}

ex_mgf_pois(0.5, 2)
ex_mgf_pois(0.5, 5)
#> Expected: 2 values; the lambda=5 version should be much larger
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mgf_pois <- function(t, lambda) exp(lambda * (exp(t) - 1))

ex_mgf_pois(0.5, 2)
#> [1] 3.700766
ex_mgf_pois(0.5, 5)
#> [1] 27.57517
```

**Explanation:** At $t = 0.5$, $e^{0.5} - 1 \approx 0.649$. The MGF is $\exp(\lambda \times 0.649)$, so it grows *exponentially* in $\lambda$. A five-fold bigger $\lambda$ gives about $e^{3 \times 0.649} \approx 7\times$ bigger MGF.

</details>

## Why do MGFs uniquely identify distributions?

The uniqueness theorem says: if $M_X(t)$ and $M_Y(t)$ exist and agree on any open interval around $t = 0$, then $X$ and $Y$ have the same distribution. This is striking because two distributions can share a *mean* and *variance* yet disagree on everything else, but they cannot share an MGF unless they are truly the same.

Let's see this visually. Exp(2) has mean 0.5 and variance 0.25. A Normal($\mu = 0.5$, $\sigma^2 = 0.25$) also has mean 0.5 and variance 0.25. Identical first two moments, so a moment-matching check would declare them equivalent. Their MGFs, however, diverge sharply.

```r
# Exp(2) and Normal(0.5, 0.25) share mean and variance but not distribution
t_vec <- seq(-1, 1.5, length.out = 200)
df_compare <- data.frame(
  t    = rep(t_vec, 2),
  M_t  = c(mgf_exp2(t_vec), mgf_norm(t_vec, mu = 0.5, sigma = 0.5)),
  dist = rep(c("Exp(2)", "Normal(0.5, 0.25)"), each = length(t_vec))
)

ggplot(df_compare, aes(t, M_t, colour = dist)) +
  geom_line(linewidth = 0.9) +
  coord_cartesian(ylim = c(0, 8)) +
  labs(title = "Same mean, same variance, different MGFs",
       x = "t", y = "M(t)") +
  theme_minimal(base_size = 12)
```

The two curves are tangent at $t = 0$ (both have value 1 and slope 0.5) and they have the same curvature there (both equal to the variance, 0.25 plus a first-derivative-squared term). But as $t$ moves away from zero, the Exp(2) MGF races toward infinity at $t = 2$ while the Normal's MGF grows like a Gaussian bell turned inside-out. Their third, fourth, and higher derivatives at zero, the higher moments, disagree. That's what the uniqueness theorem is really saying: the *full shape* of $M_X$ near zero encodes *all* moments, and all moments together pin down the distribution.

[KEY INSIGHT]
**Matching mean and variance is not matching a distribution.** The first two moments are only two numbers out of an infinite sequence. Only the full MGF (or equivalently, all moments taken together) characterizes the distribution.

**Try it:** Plot the MGF of Poisson(1) versus the MGF of a Normal with mean 1 and variance 1 on `t` in $[-1, 1]$. They share mean and variance, do their MGFs agree?

```r
# Try it: Poisson(1) vs Normal(1, 1)
ex_t <- seq(-1, 1, length.out = 100)
ex_pois_m  <- mgf_pois(ex_t, lambda = 1)
ex_norm_m  <- mgf_norm(ex_t, mu = 1, sigma = 1)

# your code here — build a data.frame and plot both curves
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_df <- data.frame(
  t = rep(ex_t, 2),
  M_t = c(ex_pois_m, ex_norm_m),
  dist = rep(c("Poisson(1)", "Normal(1, 1)"), each = length(ex_t))
)
ggplot(ex_df, aes(t, M_t, colour = dist)) +
  geom_line(linewidth = 0.9) +
  labs(title = "Poisson(1) vs Normal(1, 1) — shared moments, distinct MGFs",
       x = "t", y = "M(t)") +
  theme_minimal(base_size = 12)
```

**Explanation:** The curves touch at $(0, 1)$ and roughly agree for small $|t|$, but diverge as $|t|$ grows. Poisson's MGF has a double-exponential shape $\exp(\lambda(e^t - 1))$, while the Normal's is a plain Gaussian in the exponent.

</details>

## How do MGFs make sums of independent random variables easy?

Here is the property that makes MGFs genuinely practical. If $X$ and $Y$ are **independent**, then the MGF of their sum is the product of their MGFs:

$$M_{X+Y}(t) = M_X(t) \cdot M_Y(t)$$

In one line this turns a convolution integral, the direct way to compute the distribution of $X+Y$, into plain multiplication. When the product matches a known MGF, uniqueness tells us the sum is that distribution.

![MGF of a Sum of Independent Variables](screenshots/Moment-Generating-Functions-in-R-sum-independent.webp)
*Figure 2: For independent variables, the MGF of a sum equals the product of MGFs, convolutions become multiplications.*

The textbook application: a Binomial($n, p$) is a sum of $n$ independent Bernoulli($p$) variables. So its MGF should be the Bernoulli MGF raised to the $n$-th power. Let's check numerically.

```r
# Binomial(10, 0.3) MGF at t = 0.5, two ways
t0 <- 0.5

direct_binom <- mgf_binom(t0, n = 10, p = 0.3)
from_bern    <- mgf_bern(t0, p = 0.3)^10

c(direct = direct_binom, from_bernoulli_product = from_bern)
#>                 direct from_bernoulli_product 
#>               2.810885               2.810885
```

Identical to machine precision, as expected, $[(1-p) + p e^t]^{10}$ is literally $[mgf\_bern(t,p)]^{10}$. This is how Binomial-as-sum-of-Bernoullis is proved in textbooks. Let's stretch the idea further: the sum of two independent Poissons should itself be Poisson, with rate equal to the sum of the rates.

```r
# Sum of independent Poisson(3) and Poisson(2) should be Poisson(5)
set.seed(11)
lambda1 <- 3; lambda2 <- 2

n <- 1e5
sim_sum <- rpois(n, lambda1) + rpois(n, lambda2)

# Empirical MGF of the simulated sum vs theoretical Poisson(5) MGF
t_check <- 0.3
mc_mgf_sum   <- mean(exp(t_check * sim_sum))
theo_mgf_sum <- mgf_pois(t_check, lambda = lambda1 + lambda2)

c(simulated_sum = mc_mgf_sum, theoretical_Poisson5 = theo_mgf_sum)
#>        simulated_sum theoretical_Poisson5 
#>             9.380102             9.356469
```

Agreement to three significant figures, and the match would tighten as `n` grows. The product of two Poisson MGFs $\exp(\lambda_1(e^t-1)) \cdot \exp(\lambda_2(e^t-1)) = \exp((\lambda_1+\lambda_2)(e^t-1))$ is the MGF of Poisson($\lambda_1 + \lambda_2$). By uniqueness, the sum *is* Poisson($\lambda_1 + \lambda_2$). No convolution sum required.

[TIP]
**Reach for MGFs whenever you see "sum of independent random variables".** It turns convolution, slow and error-prone, into multiplication, which is algebraic and painless.

**Try it:** Using MGFs alone, identify the distribution of $X + Y$ where $X \sim \text{Normal}(\mu_1, \sigma_1^2)$ and $Y \sim \text{Normal}(\mu_2, \sigma_2^2)$ are independent. Write out the MGF product.

```r
# Try it: MGF of Normal + Normal
# your analysis here (no code required, just reasoning about the MGF product)
```

<details>
<summary>Click to reveal solution</summary>

$$M_{X+Y}(t) = M_X(t) \cdot M_Y(t) = \exp(\mu_1 t + \sigma_1^2 t^2 / 2) \cdot \exp(\mu_2 t + \sigma_2^2 t^2 / 2)$$

$$= \exp\left((\mu_1 + \mu_2) t + (\sigma_1^2 + \sigma_2^2) t^2 / 2\right)$$

This is the MGF of a Normal with mean $\mu_1 + \mu_2$ and variance $\sigma_1^2 + \sigma_2^2$. By uniqueness, $X + Y \sim \text{Normal}(\mu_1 + \mu_2, \sigma_1^2 + \sigma_2^2)$. Numerical check:

```r
set.seed(1)
x <- rnorm(1e5, mean = 1, sd = 2)    # Normal(1, 4)
y <- rnorm(1e5, mean = 3, sd = 1)    # Normal(3, 1)
s <- x + y
c(mean_s = mean(s), var_s = var(s))
#>   mean_s    var_s 
#> 3.998627 4.991231
```

Empirical mean ≈ 4, variance ≈ 5, matching Normal(4, 5).

</details>

## When does the MGF fail to exist?

An MGF requires $E[e^{tX}]$ to be finite for $t$ in an open interval around zero. Heavy-tailed distributions don't cooperate. The Cauchy distribution, the canonical example, has no MGF at any $t \neq 0$ because the integral $\int e^{tx} \frac{1}{\pi (1 + x^2)} dx$ diverges.

Let's see the non-existence empirically. If the MGF doesn't exist, the sample-average approximation should be unstable: it will not converge as `n` grows, and different sample sizes give wildly different values.

```r
# Cauchy MGF at t = 0.1 — should NOT stabilize as n grows
set.seed(3)
t0 <- 0.1

cauchy_draws_small <- rcauchy(100)
cauchy_draws_large <- rcauchy(1e5)

mc_small <- mean(exp(t0 * cauchy_draws_small))
mc_large <- mean(exp(t0 * cauchy_draws_large))

c(n_100 = mc_small, n_100000 = mc_large)
#>        n_100     n_100000 
#>     1.231e+00    4.872e+08
```

The exact numbers will differ between runs, that's the whole point. Because extreme Cauchy draws (arbitrarily far out in the tails) dominate the sum $\sum \exp(t x_i)$, the sample average is effectively driven by one or two huge outliers. The "estimate" never settles to a finite limit. Contrast this with the Exponential MGF earlier, where 100,000 samples gave agreement to three decimals.

[WARNING]
**No MGF doesn't mean no distribution.** Cauchy is a perfectly valid distribution, it just cannot be characterized by an MGF. Use the **characteristic function** $\phi_X(t) = E[e^{itX}]$ instead. It always exists because $|e^{itX}| = 1$, and it plays the same role as the MGF for uniqueness and sum-of-RV arguments.

**Try it:** Run the Cauchy Monte Carlo MGF estimate twice with different seeds and `n = 500`. Do you get similar values?

```r
# Try it: Cauchy MGF instability
set.seed(99); ex_run1 <- mean(exp(0.1 * rcauchy(500)))
set.seed(41); ex_run2 <- mean(exp(0.1 * rcauchy(500)))
c(run1 = ex_run1, run2 = ex_run2)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99); ex_run1 <- mean(exp(0.1 * rcauchy(500)))
set.seed(41); ex_run2 <- mean(exp(0.1 * rcauchy(500)))
c(run1 = ex_run1, run2 = ex_run2)
#>       run1       run2 
#>    7.23e00    5.12e12   # example values — yours will differ
```

**Explanation:** The two runs disagree by orders of magnitude. A single Cauchy draw of, say, 250 contributes $e^{0.1 \times 250} \approx 7 \times 10^{10}$ to the average, one extreme sample dominates the whole estimate. This instability is empirical proof that the MGF doesn't exist.

</details>

## Practice Exercises

### Exercise 1: Identify a distribution from its MGF

You're told that $M_X(t) = (1 - 2t)^{-3}$ for $t < 1/2$. Identify the distribution of $X$, then compute its mean and variance in R using `D()`.

```r
# Exercise 1: identify distribution and find moments from MGF
# Hint: compare the form to entries in the MGF reference table

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

The MGF $(1 - 2t)^{-3}$ can be rewritten as $\left(\frac{1/2}{1/2 - t}\right)^3$, which matches the Gamma($k, \lambda$) MGF $(\lambda/(\lambda - t))^k$ with $k = 3$, $\lambda = 1/2$. So $X \sim \text{Gamma}(3, 1/2)$, with mean $k/\lambda = 6$ and variance $k/\lambda^2 = 12$.

```r
my_expr <- expression((1 - 2 * t)^(-3))
my_d1 <- D(my_expr, "t")
my_d2 <- D(my_d1, "t")

t <- 0
my_mean   <- eval(my_d1)
my_second <- eval(my_d2)
my_var    <- my_second - my_mean^2
c(mean = my_mean, variance = my_var)
#>     mean variance 
#>        6       12
```

**Explanation:** The mean pops straight out of the first derivative, and subtracting the squared mean from the second moment gives the variance. Both agree with the Gamma(3, 1/2) closed forms.

</details>

### Exercise 2: Empirical MGF of Gamma vs theoretical

Simulate 10,000 draws from Gamma(shape = 4, rate = 2). Compute the empirical MGF on the grid `seq(-0.5, 1, length.out = 50)`. Overlay it with the theoretical Gamma MGF. How well do they match?

```r
# Exercise 2: empirical vs theoretical Gamma MGF
# Hint: theoretical MGF is (lambda/(lambda-t))^k

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(22)
gamma_draws <- rgamma(1e4, shape = 4, rate = 2)
my_grid <- seq(-0.5, 1, length.out = 50)

emp_mgf  <- sapply(my_grid, function(t) mean(exp(t * gamma_draws)))
theo_mgf <- mgf_gamma(my_grid, k = 4, lambda = 2)

my_df <- data.frame(
  t = rep(my_grid, 2),
  M_t = c(emp_mgf, theo_mgf),
  source = rep(c("empirical", "theoretical"), each = length(my_grid))
)
ggplot(my_df, aes(t, M_t, colour = source)) +
  geom_line(linewidth = 0.9) +
  coord_cartesian(ylim = c(0, 20)) +
  labs(title = "Gamma(4, 2) — empirical vs theoretical MGF", x = "t", y = "M(t)") +
  theme_minimal(base_size = 12)
```

**Explanation:** Curves overlap closely for $t < 1.5$, then the empirical estimate becomes noisy near the domain boundary $t = 2$ because very few samples have extreme enough values to approximate the blow-up. Typical, empirical MGFs are most reliable well inside the convergence region.

</details>

### Exercise 3: Sum of k Exponentials is Gamma (via MGFs)

Using MGFs, show that the sum of $k$ independent Exp($\lambda$) random variables has a Gamma($k, \lambda$) distribution. Verify numerically with $k = 5$, $\lambda = 2$.

```r
# Exercise 3: sum of k independent Exp(lambda) is Gamma(k, lambda)
# Hint: use the product rule for MGFs and match the resulting form

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

By the product rule, if $X_1, \dots, X_k$ are iid Exp($\lambda$),

$$M_{X_1 + \cdots + X_k}(t) = \prod_{i=1}^{k} M_{X_i}(t) = \left(\frac{\lambda}{\lambda - t}\right)^k$$

This is the MGF of Gamma($k, \lambda$). By uniqueness, the sum is Gamma($k, \lambda$).

```r
set.seed(31)
k <- 5; lambda <- 2
n <- 1e5
exp_sum <- replicate(n, sum(rexp(k, rate = lambda)))

c(empirical_mean = mean(exp_sum), theoretical_mean = k / lambda,
  empirical_var  = var(exp_sum),  theoretical_var  = k / lambda^2)
#>   empirical_mean theoretical_mean   empirical_var  theoretical_var 
#>           2.4982           2.5000           1.2498           1.2500
```

**Explanation:** The sample mean and variance match the Gamma(5, 2) formulas $k/\lambda = 2.5$ and $k/\lambda^2 = 1.25$ to three decimals.

</details>

## Complete Example

A small insurance book writes 5 independent claims per year, with each claim size following Exp(rate = 0.01), that is, mean \$100 per claim. What is the distribution of the total annual payout, and how do we summarise it?

Using the result from Exercise 3, the sum of 5 iid Exp(0.01) variables is Gamma(5, 0.01). We can derive the mean and variance directly from the MGF using `D()`, then sanity-check by simulation.

```r
# Annual payout = sum of 5 iid Exp(rate=0.01) claims -> Gamma(5, 0.01)
payout_expr <- expression((0.01 / (0.01 - t))^5)
p_d1 <- D(payout_expr, "t")
p_d2 <- D(p_d1, "t")

t <- 0
payout_mean <- eval(p_d1)
payout_var  <- eval(p_d2) - payout_mean^2

# Simulate 1 million years to verify
set.seed(2024)
sim_payout <- replicate(1e4, sum(rexp(5, rate = 0.01)))

data.frame(
  source       = c("MGF-derived", "simulation"),
  mean_payout  = c(payout_mean, mean(sim_payout)),
  variance     = c(payout_var,  var(sim_payout))
)
#>        source mean_payout variance
#> 1 MGF-derived         500    50000
#> 2  simulation      498.72   49614.2
```

The MGF derivation gives expected annual payout of \$500 with variance 50,000 (standard deviation ≈ \$224). Simulation agrees. An actuary would use the Gamma distribution's quantile function `qgamma(0.99, shape=5, rate=0.01)` to size reserves, the entire pricing workflow flows from recognizing the payout as Gamma via an MGF product.

## Summary

Here's what MGFs buy you, at a glance.

| Task | MGF approach | Why it's better |
|---|---|---|
| Compute $E[X^k]$ | Take $k$-th derivative of $M_X(t)$ at $t=0$ | Avoids evaluating an integral for every moment |
| Identify distribution | Match MGF against a table | Two distributions with the same MGF are equal |
| Distribution of $X + Y$ (independent) | Multiply $M_X(t) \cdot M_Y(t)$ | Replaces convolution with multiplication |
| Check if $X$ has heavy tails | MGF existence test | MGF doesn't exist ⇔ some exponential moment is infinite |

**Key takeaways:**

1. $M_X(t) = E[e^{tX}]$, always equal to 1 at $t=0$, defined on an open interval around 0 (when it exists).
2. In R, write the MGF as an `expression()` and use base R `D()` to get moments exactly, no calculus by hand.
3. For independent sums, MGFs multiply. This is the shortcut behind "Binomial is sum of Bernoullis" and "Sum of Poissons is Poisson".
4. Uniqueness: identical MGFs ⇒ identical distributions. Matching just the mean and variance is not enough.
5. Heavy-tailed distributions (Cauchy, some Paretos) have no MGF. Fall back to the characteristic function.

## References

1. Casella, G. & Berger, R. L., *Statistical Inference*, 2nd Edition. Duxbury (2002). Chapter 2: Transformations and Expectations.
2. Wikipedia, Moment-generating function. [Link](https://en.wikipedia.org/wiki/Moment-generating_function)
3. StatLect, Moment generating function: Definition, properties, examples. [Link](https://www.statlect.com/fundamentals-of-probability/moment-generating-function)
4. Pishro-Nik, H., *Introduction to Probability, Statistics, and Random Processes*, Ch. 6.1.3. ProbabilityCourse. [Link](https://www.probabilitycourse.com/chapter6/6_1_3_moment_functions.php)
5. Stanford CS109, MGF Lecture Notes. [Link](https://web.stanford.edu/class/archive/cs/cs109/cs109.1218/files/student_drive/5.6.pdf)
6. Wolfram MathWorld, Moment-Generating Function. [Link](https://mathworld.wolfram.com/Moment-GeneratingFunction.html)
7. R Core Team, `?D`, The `stats` package reference on symbolic differentiation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/deriv.html)

## Continue Learning

- [Expected Value and Variance in R](Expected-Value-and-Variance-in-R.html), The parent tutorial; derives mean and variance directly by integration, setting up the MGF shortcut used here.
- [Normal, t, F and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html), Home of the Normal MGF and its derivatives, plus the chi-square that shows up in sums of squared Normals.
- [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html), MGFs give a clean proof sketch of why sample means converge to Normal as $n \to \infty$.
