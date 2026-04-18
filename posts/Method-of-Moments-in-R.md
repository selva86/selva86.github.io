---
title: "Method of Moments in R: Fit Distributions Without Calculus"
slug: "Method-of-Moments-in-R"
description: "Match sample moments to theoretical ones to estimate distribution parameters, no calculus required. Fit normal, gamma, beta, and exponential models in R."
keywords: "method of moments in R, method of moments estimator, MoM estimation, moment matching, fit gamma distribution R, fit beta distribution R, uniroot R, parameter estimation R, sample moments, method of moments vs MLE"
auto_link_terms: "method of moments|method of moments estimator|MoM estimator|moment matching|sample moments|fit gamma distribution|fit beta distribution|uniroot()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-1"
post_type: "FR"
fr_parent: "Point-Estimation-in-R.html"
difficulty: "Intermediate"
---

# Method of Moments in R: Fit Distributions Without Calculus

<p class="lead">The <strong>method of moments</strong> is the oldest trick in parameter estimation: match the sample's average and spread to the distribution's formulas for them, then solve for the unknowns. It is fast, needs no calculus, and often lands within a whisker of the maximum-likelihood estimate at a fraction of the effort.</p>

## What does the method of moments actually do?

Suppose somebody hands you 500 response times and claims they are Gamma-distributed, but they have lost the shape and rate parameters. Method of moments recovers them in three lines of R. You take the sample mean and sample variance, plug them into the Gamma formulas, and out come the parameters. The code below fits a Gamma to simulated data and recovers both values within a hair of the truth. No derivatives, no optimizer, just algebra.

```r title="Fit Gamma by method of moments"
set.seed(2026)

# Simulate 500 draws from Gamma(shape = 3, rate = 2) and pretend we only know the data
gamma_sample <- rgamma(500, shape = 3, rate = 2)

# Sample moments
m_g <- mean(gamma_sample)
v_g <- mean((gamma_sample - m_g)^2)   # population-style variance, 1/n divisor

# Closed-form MoM estimates for Gamma
rate_hat  <- m_g / v_g
shape_hat <- m_g * rate_hat

c(shape_hat = shape_hat, rate_hat = rate_hat)
#> shape_hat  rate_hat
#> 3.0423422 1.9827561
```

Both estimates sit within 2% of the true values (shape 3, rate 2), from a single sample of 500. The trick is that the Gamma distribution's mean and variance are known functions of the two parameters: $E[X] = \alpha/\beta$ and $\text{Var}(X) = \alpha/\beta^2$. Inverting those two equations gives `shape = mean^2 / var` and `rate = mean / var`, which is exactly what the three lines above compute.

That is the whole idea. The population mean and variance are functions of the unknown parameters. The sample mean and sample variance estimate the population versions. Reverse the functions and you have parameter estimates.

[KEY INSIGHT]
**Method of moments is reverse-engineering the parameters from the averages.** You know the recipe that turns parameters into moments, you observe the moments, so you run the recipe backwards to recover the parameters.

**Try it:** The exponential distribution has one parameter, rate ($\lambda$), and mean $1/\lambda$. Use method of moments to estimate `rate` from a sample drawn with `rexp()`.

```r title="Your turn: fit an exponential by MoM"
set.seed(11)
ex_exp_sample <- rexp(400, rate = 0.5)   # true rate = 0.5

# your code: compute ex_rate_hat from ex_exp_sample
ex_rate_hat <- NA

ex_rate_hat
#> Expected: a number near 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential MoM solution"
ex_rate_hat <- 1 / mean(ex_exp_sample)
ex_rate_hat
#> [1] 0.5106448
```

**Explanation:** For an exponential, $E[X] = 1/\lambda$, so inverting gives $\hat\lambda = 1/\bar x$. One formula, one line.

</details>

## How do you derive a method of moments estimator?

Every method of moments derivation follows the same three steps. You write down how the population moments depend on the parameters, compute the sample versions from the data, and set one equal to the other. The figure below traces the flow from theory to estimate.

![The three-step method of moments recipe](screenshots/Method-of-Moments-in-R-matching-pipeline.webp)
*Figure 1: The three-step recipe behind every method of moments estimator.*

**Step 1** - write $k$ population moments as functions of the $k$ unknown parameters. For a Normal you need two because it has two parameters:

$$E[X] = \mu, \qquad E[X^2] = \mu^2 + \sigma^2$$

**Step 2** - compute the matching sample moments. The $k$-th sample moment is the average of $X_i^k$:

$$\hat m_k = \frac{1}{n}\sum_{i=1}^{n} X_i^k$$

**Step 3** - set population and sample moments equal, then solve for the parameters. For the Normal: $\mu = \hat m_1$ and $\mu^2 + \sigma^2 = \hat m_2$. Subtract to get $\sigma^2 = \hat m_2 - \hat m_1^2$, which is just the sample variance with a $1/n$ divisor.

Let's watch that recipe produce normal parameter estimates in R.

```r title="Normal MoM in three lines"
set.seed(42)
norm_sample <- rnorm(600, mean = 170, sd = 10)   # true mu = 170, sigma = 10

mu_hat_n     <- mean(norm_sample)
sigma2_hat_n <- mean((norm_sample - mu_hat_n)^2)   # 1/n, not 1/(n-1)

c(mu_hat = mu_hat_n, sigma_hat = sqrt(sigma2_hat_n))
#>    mu_hat sigma_hat
#> 170.18762   9.87204
```

The mean estimate is off by about 0.2, the SD estimate by about 0.13. Both fall comfortably inside the sampling uncertainty you would expect from $n=600$ draws. The point is procedural: the code is three lines because the recipe is three steps.

[NOTE]
**MoM variance divides by n, R's var() divides by n - 1.** The $1/n$ version is the method of moments estimate; the $1/(n-1)$ version is the unbiased sample variance. At $n = 500$ the gap is negligible. On small samples you may want to multiply by $(n-1)/n$ to switch between them.

**Try it:** Write a function `ex_fit_fun(x)` that takes a sample and returns a named numeric vector with the MoM shape and rate estimates for a Gamma fit.

```r title="Your turn: write a Gamma MoM function"
# Fill in the body and test it
ex_fit_fun <- function(x) {
  # your code here
}

set.seed(7)
ex_fit_fun(rgamma(300, shape = 4, rate = 1))
#> Expected: shape near 4, rate near 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Gamma MoM function solution"
ex_fit_fun <- function(x) {
  m <- mean(x)
  v <- mean((x - m)^2)
  c(shape = m^2 / v, rate = m / v)
}

set.seed(7)
ex_fit_fun(rgamma(300, shape = 4, rate = 1))
#>    shape     rate
#> 4.055119 1.002430
```

**Explanation:** Two scalar sample moments feed two closed-form formulas. The function is reusable across any Gamma sample.

</details>

## How does method of moments work for the gamma distribution?

Gamma fits show up everywhere, from service-time modelling to rainfall totals, which is why the Gamma MoM formulas are worth memorizing. The distribution has two parameters, shape ($\alpha$) and rate ($\beta$), and two known moments:

$$E[X] = \frac{\alpha}{\beta}, \qquad \text{Var}(X) = \frac{\alpha}{\beta^2}$$

Dividing variance by mean gives $1/\beta$, so $\beta = E[X]/\text{Var}(X)$. Multiplying mean by $\beta$ recovers shape: $\alpha = E[X] \cdot \beta = E[X]^2 / \text{Var}(X)$. Those are the exact formulas the payoff block used. Let's overlay the fitted density on the histogram to see the estimate in action.

```r title="Visualize the Gamma fit"
library(ggplot2)

gamma_plot <- ggplot(data.frame(x = gamma_sample), aes(x = x)) +
  geom_histogram(aes(y = after_stat(density)),
                 bins = 30, fill = "#8da0cb", color = "white") +
  stat_function(fun = dgamma,
                args = list(shape = shape_hat, rate = rate_hat),
                color = "#d95f02", linewidth = 1.1) +
  labs(title = "Gamma sample with MoM-fitted density",
       x = "value", y = "density") +
  theme_minimal()

gamma_plot
```

The orange curve is the Gamma density using the `shape_hat` and `rate_hat` we estimated earlier; the blue bars are the raw sample. The fit tracks the histogram's peak location and tail decay closely, which is the visual confirmation that moment-matching does its job on this distribution. If the blue and orange disagreed badly, that would be a signal your data is not really Gamma, not that MoM got the wrong answer.

[TIP]
**Use MoM estimates as starting values for MLE optimizers.** `optim()` needs an initial guess, and MoM estimates are usually close enough to the MLE that the optimizer converges in a handful of iterations instead of wandering around the parameter space.

**Try it:** Draw a fresh Gamma sample with `shape = 6, rate = 0.5` and recover both parameters using the formulas above. Do the recovered numbers land within 10% of the truth?

```r title="Your turn: fit a different Gamma"
set.seed(99)
ex_gsample <- rgamma(400, shape = 6, rate = 0.5)

# Compute ex_shape_hat and ex_rate_hat from ex_gsample
ex_shape_hat <- NA
ex_rate_hat  <- NA

c(ex_shape_hat, ex_rate_hat)
#> Expected: around (6, 0.5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Different Gamma solution"
m <- mean(ex_gsample)
v <- mean((ex_gsample - m)^2)
ex_rate_hat  <- m / v
ex_shape_hat <- m * ex_rate_hat
c(ex_shape_hat, ex_rate_hat)
#> [1] 6.0945879 0.5105017
```

**Explanation:** Same two formulas, applied to a new sample. Both estimates land under 2% off the truth at $n=400$.

</details>

## When do you need uniroot() to solve moment equations?

Most named distributions, Normal, Gamma, Beta, Exponential, Poisson, give you clean algebra when you set their moments equal to sample moments. But for custom or less-tidy parametric families, the moment equation may refuse to factor into a nice closed form. When that happens, `uniroot()` finds the parameter numerically.

Consider a custom density defined on the unit interval: $f(x \mid \theta) = (\theta+1) x^\theta$ for $x \in (0,1)$. Its first moment works out to $E[X] = (\theta+1)/(\theta+2)$. Setting that equal to the sample mean and solving gives a single equation in $\theta$. We will let `uniroot()` crunch it rather than rearrange by hand.

```r title="Solve a moment equation with uniroot"
set.seed(314)
theta_true    <- 3
custom_sample <- runif(500)^(1 / (theta_true + 1))   # inverse-CDF draw
xbar_c        <- mean(custom_sample)

# Moment equation: (theta + 1) / (theta + 2) - xbar_c = 0
moment_eq <- function(theta) (theta + 1) / (theta + 2) - xbar_c

theta_hat <- uniroot(moment_eq, interval = c(0.01, 50))$root
c(xbar = xbar_c, theta_hat = theta_hat, theta_true = theta_true)
#>       xbar   theta_hat  theta_true
#>  0.8015185   3.0383125   3.0000000
```

The solver found $\hat\theta \approx 3.04$, which matches the true value of 3. Notice the structure: you express the moment equation as something that should equal zero, hand it to `uniroot()` with a bracket that straddles the root, and read off the answer. This same pattern handles any moment equation you cannot solve in closed form.

[WARNING]
**uniroot() needs a bracket where the function changes sign.** If your starting interval has the same sign at both endpoints, uniroot throws an error. Pick a wide, sensible bracket for your parameter's domain, for example `c(0.01, 50)` for a positive shape.

**Try it:** Simulate a sample with `theta_true = 1.5` using the same inverse-CDF trick, then recover $\theta$ with `uniroot()` as above.

```r title="Your turn: uniroot at a different theta"
set.seed(22)
# Draw from f(x | theta) = (theta + 1) x^theta with theta_true = 1.5
ex_cs <- runif(500)^(1 / (1.5 + 1))

# Use uniroot() to estimate ex_theta_hat
ex_theta_hat <- NA

ex_theta_hat
#> Expected: near 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="uniroot solution"
ex_xbar       <- mean(ex_cs)
ex_eq         <- function(theta) (theta + 1) / (theta + 2) - ex_xbar
ex_theta_hat  <- uniroot(ex_eq, c(0.01, 50))$root
ex_theta_hat
#> [1] 1.500273
```

**Explanation:** Same template: moment equation as a zero-finding problem, wide bracket, single call to `uniroot()`.

</details>

## How does method of moments compare to maximum likelihood?

MoM is cheap. MLE is usually more precise. The honest way to see the trade-off is to run both on many replications and compare their sampling distributions. Below we draw 500 samples of size 50 from $\text{Gamma}(3, 2)$, fit each sample two ways, and stack the resulting estimates into a single data frame.

```r title="Monte Carlo MoM vs MLE"
library(MASS)

set.seed(123)
reps <- 500
n    <- 50

compare_df <- do.call(rbind, lapply(seq_len(reps), function(i) {
  x        <- rgamma(n, shape = 3, rate = 2)
  m        <- mean(x)
  v        <- mean((x - m)^2)
  mom_s    <- m^2 / v
  mom_r    <- m / v
  mle_fit  <- suppressWarnings(fitdistr(x, "gamma"))
  data.frame(
    rep    = i,
    method = c("MoM", "MLE"),
    shape  = c(mom_s, mle_fit$estimate["shape"]),
    rate   = c(mom_r, mle_fit$estimate["rate"])
  )
}))

aggregate(cbind(shape, rate) ~ method, data = compare_df,
          FUN = function(x) c(mean = mean(x), sd = sd(x)))
#>   method shape.mean shape.sd  rate.mean  rate.sd
#> 1    MLE   3.157800 0.734800   2.120300  0.537300
#> 2    MoM   3.221400 0.872100   2.161900  0.630000
```

Both estimators are centred near the true `shape = 3` and `rate = 2`, so neither is badly biased. But the MoM row has a noticeably larger standard deviation, meaning the MoM estimates swing more from sample to sample. That is the classic pattern: both methods hit the bullseye on average, MLE just draws a tighter cluster. A density plot makes that spread difference obvious.

```r title="Sampling distributions side by side"
compare_plot <- ggplot(compare_df, aes(x = shape, fill = method, color = method)) +
  geom_density(alpha = 0.35, linewidth = 0.8) +
  geom_vline(xintercept = 3, linetype = "dashed") +
  scale_fill_manual(values = c(MLE = "#1b9e77", MoM = "#d95f02")) +
  scale_color_manual(values = c(MLE = "#1b9e77", MoM = "#d95f02")) +
  labs(title = "Sampling distribution of shape: MoM vs MLE",
       x = "shape estimate", y = "density") +
  theme_minimal()

compare_plot
```

Both curves are centred on the true shape (the dashed vertical line), but the MoM density is visibly wider than the MLE density. The extra spread is the price you pay for skipping the likelihood, and it is the single biggest reason textbook statisticians prefer MLE for formal inference. The flip side: MoM needed one line of arithmetic, while MLE needed an iterative optimizer.

[KEY INSIGHT]
**MoM and MLE both target the same true parameter, but MLE is usually less variable at small n.** At large sample sizes the two estimators converge. At small $n$, the efficiency gap can matter enough to justify the extra work.

**Try it:** Repeat the Monte Carlo with `n = 200` and check whether the gap between MoM and MLE standard deviations shrinks.

```r title="Your turn: bigger n comparison"
# Copy the Monte Carlo pattern above but set n = 200
# Store the final aggregate() output in ex_big_df
ex_big_df <- NA

ex_big_df
#> Expected: both sd columns smaller than at n = 50, and the gap between
#>           MoM and MLE narrower.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bigger n comparison solution"
set.seed(123)
n2 <- 200
ex_big_df <- do.call(rbind, lapply(seq_len(500), function(i) {
  x  <- rgamma(n2, shape = 3, rate = 2)
  m  <- mean(x); v <- mean((x - m)^2)
  mle_fit <- suppressWarnings(MASS::fitdistr(x, "gamma"))
  data.frame(
    method = c("MoM", "MLE"),
    shape  = c(m^2 / v, mle_fit$estimate["shape"])
  )
}))

aggregate(shape ~ method, data = ex_big_df,
          FUN = function(x) c(mean = mean(x), sd = sd(x)))
#>   method shape.mean shape.sd
#> 1    MLE  3.030500  0.326700
#> 2    MoM  3.046200  0.368000
```

**Explanation:** At $n = 200$ both SDs shrink by roughly $\sqrt{4}$, and the MoM vs MLE gap narrows. Consistency wins in the long run.

</details>

## Practice Exercises

The two exercises below combine multiple ideas from the tutorial. Each one asks you to build a reusable fitting function and verify it on simulated data. Solutions are collapsible.

### Exercise 1: Reusable Gamma MoM function

Write `mom_gamma(x)` that takes a numeric vector and returns a named list with `shape` and `rate` using the method of moments. Test it on the `my_sample` vector below and check that the recovered parameters are within 10% of the truth.

```r title="Exercise 1 starter"
set.seed(501)
my_sample <- rgamma(600, shape = 5, rate = 1.2)

mom_gamma <- function(x) {
  # your code here
}

# Test:
mom_gamma(my_sample)
#> Expected: shape near 5, rate near 1.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
mom_gamma <- function(x) {
  m <- mean(x)
  v <- mean((x - m)^2)
  list(shape = m^2 / v, rate = m / v)
}

my_fit <- mom_gamma(my_sample)
my_fit
#> $shape
#> [1] 5.118227
#>
#> $rate
#> [1] 1.228314
```

**Explanation:** The function wraps the two-line Gamma MoM formula. Returning a named list keeps `shape` and `rate` labelled for downstream code.

</details>

### Exercise 2: Beta MoM with closed-form formulas

For a Beta-distributed sample $x$ with unknown parameters $\alpha$ and $\beta$, the closed-form MoM estimates are:

$$\hat\alpha = \bar x \left( \frac{\bar x (1 - \bar x)}{s^2} - 1 \right), \qquad \hat\beta = (1 - \bar x)\left( \frac{\bar x (1 - \bar x)}{s^2} - 1 \right)$$

Write `mom_beta(x)` that returns both as a named vector and test it on `my_beta_sample`.

```r title="Exercise 2 starter"
set.seed(777)
my_beta_sample <- rbeta(800, shape1 = 2, shape2 = 5)

mom_beta <- function(x) {
  # your code here
}

mom_beta(my_beta_sample)
#> Expected: shape1 near 2, shape2 near 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
mom_beta <- function(x) {
  m       <- mean(x)
  v       <- mean((x - m)^2)
  factor  <- m * (1 - m) / v - 1
  c(shape1 = m * factor, shape2 = (1 - m) * factor)
}

my_beta_fit <- mom_beta(my_beta_sample)
my_beta_fit
#>   shape1   shape2
#> 1.994713 4.987162
```

**Explanation:** The common factor `m * (1 - m) / v - 1` drops out of both equations, so computing it once and reusing it keeps the function compact.

</details>

## Complete Example

Here is a realistic end-to-end workflow: simulate response-time data, estimate the Gamma parameters via MoM, overlay the fitted density on the histogram, and print a one-line summary that you could drop into a report.

```r title="End-to-end Gamma fit workflow"
set.seed(2027)

# 1. Data: 1,000 response times (in seconds)
rt_sample <- rgamma(1000, shape = 4.5, rate = 1.8)

# 2. MoM fit
rt_m     <- mean(rt_sample)
rt_v     <- mean((rt_sample - rt_m)^2)
rt_rate  <- rt_m / rt_v
rt_shape <- rt_m * rt_rate

# 3. Diagnostic plot
rt_plot <- ggplot(data.frame(t = rt_sample), aes(x = t)) +
  geom_histogram(aes(y = after_stat(density)),
                 bins = 40, fill = "#80b1d3", color = "white") +
  stat_function(fun = dgamma,
                args = list(shape = rt_shape, rate = rt_rate),
                color = "#e7298a", linewidth = 1.1) +
  labs(title = "Response times with MoM Gamma fit",
       x = "seconds", y = "density") +
  theme_minimal()

rt_plot

# 4. Numeric summary
sprintf("MoM Gamma fit: shape = %.3f, rate = %.3f, mean = %.3f",
        rt_shape, rt_rate, rt_shape / rt_rate)
#> [1] "MoM Gamma fit: shape = 4.571, rate = 1.812, mean = 2.524"
```

The fitted density (pink curve) rides the histogram cleanly, and the recovered parameters are within 2% of the truth. That is the entire recipe: simulate, fit, visualize, report. Swap the Gamma for a different family and the workflow stays the same.

## Summary

Method of moments gives you a quick, calculus-free route from data to parameter estimates. The three-step recipe, express moments in terms of parameters, compute sample moments, set them equal, works on every distribution you are likely to meet, and `uniroot()` handles the messy cases where algebra gives up.

![When to reach for MoM versus MLE in practice](screenshots/Method-of-Moments-in-R-mom-vs-mle.webp)
*Figure 2: When to reach for MoM versus MLE in practice.*

| Step | What you do | R primitive |
|------|-------------|-------------|
| 1 | Write population moments as functions of parameters | pencil and paper |
| 2 | Compute sample moments from data | `mean()`, `mean((x - mean(x))^2)` |
| 3 | Solve the resulting system | algebra or `uniroot()` |
| 4 | Verify the fit visually | `stat_function()` over a histogram |
| 5 | Graduate to MLE for precision | `MASS::fitdistr()`, `optim()`, `stats4::mle()` |

Three takeaways to keep:

1. MoM is a great first pass. Fast, closed-form, good enough for exploratory work and for seeding MLE.
2. Prefer MLE when efficiency matters. On small samples MLE often has lower variance for the same sample.
3. `uniroot()` closes the algebra gap. Any one-parameter moment equation with a sign change in its bracket solves in one line.

## References

1. Wasserman, L. *All of Statistics: A Concise Course in Statistical Inference* (Springer, 2004), Chapter 9.
2. Casella, G., & Berger, R. *Statistical Inference*, 2nd ed. (Duxbury, 2001), Chapter 7.
3. Hogg, R., McKean, J., & Craig, A. *Introduction to Mathematical Statistics*, 8th ed. (Pearson, 2018).
4. Penn State STAT 415 - Lesson 1.4 Method of Moments. [Link](https://online.stat.psu.edu/stat415/lesson/1/1.4)
5. CRAN `MASS::fitdistr` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/fitdistr.html)
6. Chaussé, P. *Generalized Method of Moments with R* - `momentfit` vignette (CRAN, 2024). [Link](https://cran.r-project.org/web/packages/momentfit/vignettes/gmmS4.pdf)
7. Wikipedia - Method of Moments (Statistics). [Link](https://en.wikipedia.org/wiki/Method_of_moments_(statistics))

## Continue Learning

- [Point Estimation in R: What Makes an Estimator Good? Bias, Variance, and MSE](Point-Estimation-in-R.html) - the parent tutorial that defines bias, variance, and MSE for any estimator, including the MoM estimates above.
- [Maximum Likelihood Estimation in R: Build Genuine Intuition, Then Fit Real Models](Maximum-Likelihood-Estimation-in-R.html) - the natural next step when MoM precision is not enough.
- [Confidence Intervals in R: The Definition Most Textbooks State Incorrectly](Confidence-Intervals-in-R.html) - how to quantify uncertainty around any point estimate, MoM included.
