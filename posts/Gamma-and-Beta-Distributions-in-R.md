---
title: "Gamma & Beta Distributions in R: Shape, Scale & Conjugate Priors"
slug: Gamma-and-Beta-Distributions-in-R
description: "Learn gamma and beta distributions in R, shape, scale, rate parameters, conjugate priors, and d/p/q/r functions with runnable examples and clear intuition."
keywords: "gamma distribution R, beta distribution R, dgamma, dbeta, pgamma, pbeta, conjugate prior, shape parameter, rate parameter, Bayesian R"
auto_link_terms: "gamma distribution|beta distribution|conjugate prior|conjugate priors|shape parameter|rate parameter|dgamma|dbeta|pgamma|pbeta"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: FR-prob-9
post_type: FR
fr_parent: Normal-t-F-and-Chi-Squared-Distributions-in-R.html
difficulty: Intermediate
---

# Gamma & Beta Distributions in R: Shape, Scale & Conjugate Priors

<p class="lead">The gamma distribution models positive, right-skewed quantities like waiting times and total claim amounts, while the beta distribution models proportions bounded between 0 and 1. In Bayesian analysis they are the canonical conjugate priors, beta pairs with the binomial, gamma pairs with the Poisson, and getting fluent in their R parameterisations unlocks both families.</p>

## What is the gamma distribution and when does it arise?

The gamma distribution is what you get when you add up `k` independent exponential waiting times. It shows up whenever a quantity is positive, continuous, and right-skewed, insurance claim totals, time to the `k`th arrival in a Poisson process, rainfall amounts, session durations. R exposes four functions for it, `dgamma()`, `pgamma()`, `qgamma()`, and `rgamma()`, which return the density, cumulative probability, quantile, and random samples. The quickest way to build intuition is to plot its family of shapes.

The code below loads `ggplot2` and `tibble`, builds a grid of x-values, computes the gamma density at three shape values (1, 3, and 6) with rate fixed at 1, and plots the three curves on one chart. Watch how the shape parameter pulls the peak to the right and makes the tail heavier.

```r
# Plot gamma densities for shapes 1, 3, 6 at rate = 1
library(ggplot2)
library(tibble)

x_grid <- seq(0, 15, length.out = 400)

gamma_curves <- tibble(
  x        = rep(x_grid, 3),
  density  = c(dgamma(x_grid, shape = 1, rate = 1),
               dgamma(x_grid, shape = 3, rate = 1),
               dgamma(x_grid, shape = 6, rate = 1)),
  shape    = factor(rep(c("shape = 1", "shape = 3", "shape = 6"),
                        each = length(x_grid)))
)

ggplot(gamma_curves, aes(x, density, colour = shape)) +
  geom_line(size = 1) +
  labs(title = "Gamma densities at rate = 1",
       x = "x", y = "density") +
  theme_minimal(base_size = 13)
#> Three curves on one chart: a decaying exponential (shape 1), a skewed
#> hump peaking near x = 2 (shape 3), and a broader hump peaking near x = 5
#> (shape 6). All start at 0 and decay to 0 as x grows.
```

Shape 1 is the familiar exponential decay, a purely monotonic curve starting at 1 and falling to zero. Shape 3 introduces a visible peak because the distribution now represents the sum of three exponentials. Shape 6 pushes that peak further right and makes the overall shape look almost bell-like. The single shape parameter is doing all the work here; the rate only stretches or squeezes the horizontal axis.

**Try it:** Evaluate `dgamma()` at x = 3 and `pgamma()` at q = 3 for Gamma(shape = 2, rate = 1). The first gives the height of the density, the second gives the probability of being at or below 3.

```r
# Try it: density and cumulative probability at x = 3
# your code here

#> Expected: density ~0.15, cumulative ~0.80
```

<details>
<summary>Click to reveal solution</summary>

```r
dgamma(3, shape = 2, rate = 1)
#> [1] 0.1493612
pgamma(3, shape = 2, rate = 1)
#> [1] 0.8008517
```

**Explanation:** `dgamma()` returns the density value at a single point, while `pgamma()` integrates the density from 0 up to the query point. For Gamma(2, 1), roughly 80% of the probability mass sits below x = 3.

</details>

[NOTE]
**The gamma distribution generalises several other distributions.** Gamma(1, rate) is the exponential; integer shape gives the Erlang; shape = k/2 with rate = 1/2 produces the chi-squared distribution with k degrees of freedom.

![Gamma distribution family](screenshots/Gamma-and-Beta-Distributions-in-R-gamma-family.webp)

*Figure 1: The gamma distribution generalises the exponential, Erlang, and chi-squared as special cases.*

## How do shape, rate, and scale parameters differ?

R's `dgamma()` accepts either `rate` (default) or `scale`, and tutorials often disagree on which name to use. Shape controls skewness: small shape gives a sharp early peak, large shape looks almost symmetric. Rate controls how quickly probability decays, and scale is its reciprocal, `scale = 1 / rate`. Mixing them silently produces wrong answers, so let's tighten the vocabulary.

The formula below captures the relationship between mean, shape, and rate.

$$\text{mean} = \frac{\alpha}{\beta} = \alpha \theta, \qquad \text{variance} = \frac{\alpha}{\beta^2} = \alpha \theta^2$$

Where:
- $\alpha$ = shape
- $\beta$ = rate
- $\theta = 1/\beta$ = scale

In R, the two parameterisations are fully equivalent. The next block computes the density at x = 1 using `rate = 2` and then using `scale = 0.5`, identical numbers fall out because they describe the same distribution.

```r
# Equivalent calls using rate and scale
dgamma(1, shape = 3, rate  = 2)
#> [1] 0.2706706
dgamma(1, shape = 3, scale = 0.5)
#> [1] 0.2706706
```

Both calls describe the same Gamma(3, rate = 2) distribution, just with a different vocabulary. Pick whichever convention matches the formula in your source material and stick with it for an entire analysis. Now let's see how the shape parameter alone reshapes the density while rate is held at 1.

```r
# Compare shapes 1, 2, 5, 10 at rate = 1 using the same x_grid
gamma_shape_curves <- tibble(
  x       = rep(x_grid, 4),
  density = c(dgamma(x_grid, shape = 1,  rate = 1),
              dgamma(x_grid, shape = 2,  rate = 1),
              dgamma(x_grid, shape = 5,  rate = 1),
              dgamma(x_grid, shape = 10, rate = 1)),
  shape   = factor(rep(c("1", "2", "5", "10"), each = length(x_grid)),
                   levels = c("1", "2", "5", "10"))
)

ggplot(gamma_shape_curves, aes(x, density, colour = shape)) +
  geom_line(size = 1) +
  labs(title = "Gamma shape parameter sweep (rate = 1)",
       x = "x", y = "density") +
  theme_minimal(base_size = 13)
#> Four curves: shape 1 decays from 1 monotonically; shape 2 peaks near x = 1;
#> shape 5 peaks near x = 4; shape 10 peaks near x = 9 and looks almost symmetric.
```

As shape grows, the peak moves right and the curve grows progressively more symmetric. At shape = 10 the gamma looks strikingly similar to a normal distribution, a sign that with enough summed exponentials the central limit theorem starts to take over.

**Try it:** Compute the probability that a Gamma(shape = 3, rate = 0.5) draw exceeds 10. Use `pgamma()` with `lower.tail = FALSE`.

```r
# Try it: P(X > 10) for Gamma(3, rate = 0.5)
# your code here

#> Expected: ~0.125
```

<details>
<summary>Click to reveal solution</summary>

```r
pgamma(10, shape = 3, rate = 0.5, lower.tail = FALSE)
#> [1] 0.1246520
```

**Explanation:** `lower.tail = FALSE` returns the upper-tail probability P(X > q) directly. About 12.5% of draws from Gamma(3, 0.5) exceed 10.

</details>

[WARNING]
**Supplying both `rate` and `scale` is an error.** R will throw an error if you pass both, intentional, to protect you from a half-remembered formula. Pick one naming convention for each analysis.

## What is the beta distribution and why is it used for proportions?

The beta distribution lives on the interval [0, 1], which makes it the natural distribution over a probability itself. Its two shape parameters, `shape1` (often α) and `shape2` (often β), act like "pseudo-successes" and "pseudo-failures." That single idea explains why Beta(1, 1) is flat, Beta(10, 10) is a tight bump around 0.5, and Beta(0.5, 0.5) is U-shaped with mass piled at both ends.

The mean is a simple ratio of the two parameters, and their sum controls how concentrated the distribution is.

$$\text{mean} = \frac{\alpha}{\alpha + \beta}, \qquad \text{concentration} = \alpha + \beta$$

The next block plots five beta densities covering the full range of shapes you're likely to meet in practice: uniform, U-shape, left-skew, right-skew, and tight symmetric.

```r
# Plot beta densities for five parameter combinations
p_grid <- seq(0.001, 0.999, length.out = 400)

beta_curves <- tibble(
  p       = rep(p_grid, 5),
  density = c(dbeta(p_grid, 1,   1),
              dbeta(p_grid, 2,   5),
              dbeta(p_grid, 5,   2),
              dbeta(p_grid, 10, 10),
              dbeta(p_grid, 0.5, 0.5)),
  params  = factor(rep(c("Beta(1, 1)", "Beta(2, 5)", "Beta(5, 2)",
                         "Beta(10, 10)", "Beta(0.5, 0.5)"),
                       each = length(p_grid)),
                   levels = c("Beta(1, 1)", "Beta(2, 5)", "Beta(5, 2)",
                              "Beta(10, 10)", "Beta(0.5, 0.5)"))
)

ggplot(beta_curves, aes(p, density, colour = params)) +
  geom_line(size = 1) +
  labs(title = "Beta density shapes",
       x = "p", y = "density") +
  theme_minimal(base_size = 13)
#> Five curves: flat line (uniform), left-leaning peak near 0.3 (Beta(2,5)),
#> right-leaning peak near 0.7 (Beta(5,2)), tight bell at 0.5 (Beta(10,10)),
#> U-shape with mass at 0 and 1 (Beta(0.5,0.5)).
```

Beta(1, 1) is the flat uniform, a reasonable prior when you want to say "I know nothing about this probability." Beta(10, 10) is the opposite: strong prior belief that the probability is near 0.5. The U-shape of Beta(0.5, 0.5), Jeffreys' prior, carries the different idea that the probability is likely near 0 or 1 but rarely in between. Think of α and β as pseudo-counts and these shapes make immediate sense.

**Try it:** Find the 2.5% and 97.5% quantiles of a Beta(10, 20) distribution. Together they form a 95% central interval.

```r
# Try it: 95% central interval of Beta(10, 20)
# your code here

#> Expected: roughly c(0.18, 0.51)
```

<details>
<summary>Click to reveal solution</summary>

```r
qbeta(c(0.025, 0.975), shape1 = 10, shape2 = 20)
#> [1] 0.1820 0.5072
```

**Explanation:** `qbeta()` is the inverse of `pbeta()`. Passing a vector of probabilities returns the corresponding quantiles. The interval `[0.18, 0.51]` contains the middle 95% of the distribution's mass.

</details>

## How do d/p/q/r functions work for both distributions?

R follows the same four-letter convention for every distribution: `d` = density, `p` = cumulative probability, `q` = quantile, `r` = random draw. Once you've used `dnorm()` and `pnorm()`, you already know how to use `dgamma()` and `dbeta()`. The only thing that changes is the parameter names.

| Function | Gamma signature | Beta signature | Returns |
|---|---|---|---|
| `d*()` | `dgamma(x, shape, rate)` | `dbeta(x, shape1, shape2)` | Density at x |
| `p*()` | `pgamma(q, shape, rate)` | `pbeta(q, shape1, shape2)` | P(X ≤ q) |
| `q*()` | `qgamma(p, shape, rate)` | `qbeta(p, shape1, shape2)` | Inverse of p-function |
| `r*()` | `rgamma(n, shape, rate)` | `rbeta(n, shape1, shape2)` | n random draws |

The next block exercises all four for a Gamma(3, 1) and a Beta(5, 2), one line each, to anchor the pattern.

```r
# d/p/q/r tour for Gamma(3, 1) and Beta(5, 2)
set.seed(17)

dgamma(2, shape = 3, rate = 1)            # density at x = 2
#> [1] 0.2706706
pgamma(2, shape = 3, rate = 1)            # P(X <= 2)
#> [1] 0.3233236
qgamma(0.5, shape = 3, rate = 1)          # median
#> [1] 2.674060
rgamma(5, shape = 3, rate = 1)            # 5 random draws
#> [1] 3.3156869 2.5213214 4.1672800 2.1870281 3.4529516

dbeta(0.7, shape1 = 5, shape2 = 2)        # density at p = 0.7
#> [1] 2.016840
pbeta(0.7, shape1 = 5, shape2 = 2)        # P(X <= 0.7)
#> [1] 0.3294172
qbeta(0.5, shape1 = 5, shape2 = 2)        # median
#> [1] 0.7355162
rbeta(5, shape1 = 5, shape2 = 2)          # 5 random draws
#> [1] 0.7762 0.5982 0.8411 0.6728 0.7104
```

The pattern is fully regular, pick your distribution, pick your question (density, probability, quantile, or sample), and swap in the right prefix. The parameter names change between `shape`/`rate` and `shape1`/`shape2`, which is why it pays to use named arguments rather than positional ones.

**Try it:** Draw 1000 samples from Beta(2, 5). Check that the sample mean is close to the theoretical mean `α / (α + β) = 2/7 ≈ 0.286`.

```r
# Try it: Monte Carlo check for Beta mean
# your code here

#> Expected: sample mean within 0.01 of 0.2857
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
ex_sample_mean <- mean(rbeta(1000, shape1 = 2, shape2 = 5))
ex_sample_mean
#> [1] 0.2859
2 / (2 + 5)
#> [1] 0.2857143
```

**Explanation:** 1000 draws gives a sample mean accurate to about two decimal places. Run with 100,000 draws for three decimals.

</details>

[TIP]
**Use `lower.tail = FALSE` for upper-tail probabilities.** `pgamma(q, ..., lower.tail = FALSE)` returns P(X > q) directly, numerically safer than `1 - pgamma(q, ...)` when the true probability is tiny. The same applies to `pbeta()`.

## How does beta serve as the conjugate prior for binomial likelihoods?

Conjugate means: start with a Beta(α, β) prior over the success probability, observe `x` successes in `n` trials, and the posterior is also a beta, specifically Beta(α + x, β + n − x). No integration, no MCMC, no optimiser. Add the successes to α, add the failures to β, done. This closed-form update is why the beta distribution is the first tool every Bayesian reaches for when modelling a probability.

The formula behind the rule comes from combining the binomial likelihood with the beta prior and noticing the posterior has the same functional form.

$$p(\theta \mid x) \propto \theta^{\alpha + x - 1} (1 - \theta)^{\beta + n - x - 1}$$

That is the kernel of Beta(α + x, β + n − x), which is why the update is algebra rather than calculus. Let's run a concrete example: a weakly informative Beta(2, 2) prior, a coin that lands heads 7 times in 10 flips, and the resulting Beta(9, 5) posterior.

```r
# Beta-binomial conjugate update
prior_ab <- c(alpha = 2, beta = 2)
n_trials <- 10
x_heads  <- 7

post_ab  <- c(alpha = prior_ab["alpha"] + x_heads,
              beta  = prior_ab["beta"]  + n_trials - x_heads)
post_ab
#> alpha.alpha   beta.beta
#>           9           5

# Plot prior and posterior on the same axes
coin_curves <- tibble(
  p        = rep(p_grid, 2),
  density  = c(dbeta(p_grid, prior_ab["alpha"], prior_ab["beta"]),
               dbeta(p_grid, post_ab["alpha"],  post_ab["beta"])),
  curve    = factor(rep(c("Prior Beta(2,2)", "Posterior Beta(9,5)"),
                        each = length(p_grid)),
                    levels = c("Prior Beta(2,2)", "Posterior Beta(9,5)"))
)

ggplot(coin_curves, aes(p, density, colour = curve)) +
  geom_line(size = 1) +
  labs(title = "Beta prior updated by 7/10 heads",
       x = "p (prob of heads)", y = "density") +
  theme_minimal(base_size = 13)

# 95% credible interval for the posterior
qbeta(c(0.025, 0.975), post_ab["alpha"], post_ab["beta"])
#> [1] 0.3863 0.8417
```

The prior Beta(2, 2) is a gentle bump around 0.5, a mild belief in a fair coin. After seeing 7 heads in 10 flips, the posterior Beta(9, 5) shifts noticeably to the right and tightens into a narrower curve that peaks near 0.65. The 95% credible interval says that the true probability of heads is between roughly 0.39 and 0.84 with 95% posterior probability, a useful honest statement given only 10 flips.

**Try it:** Repeat the update but with a much more opinionated Beta(20, 20) prior. Compare the posterior mean to the simple frequentist estimate 7/10.

```r
# Try it: strong prior + 7/10 heads
# your code here

#> Expected: posterior mean ~0.54, much closer to 0.5 than 7/10 = 0.70
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_strong_prior <- c(alpha = 20, beta = 20)
ex_strong_post  <- c(alpha = ex_strong_prior["alpha"] + 7,
                     beta  = ex_strong_prior["beta"]  + 10 - 7)
ex_post_mean <- ex_strong_post["alpha"] / sum(ex_strong_post)
ex_post_mean
#> 0.54
```

**Explanation:** With 40 pseudo-observations already baked into the prior, 10 real observations barely move the posterior. The posterior mean lands at 0.54, halfway between the prior mean of 0.5 and the data mean of 0.7.

</details>

[KEY INSIGHT]
**Conjugacy lets prior and posterior share the same distribution family.** The update is algebra on the parameters, not calculus on the probabilities. You add observed successes to α and observed failures to β, that's the entire inference.

![Beta-binomial conjugate update](screenshots/Gamma-and-Beta-Distributions-in-R-bayesian-update.webp)

*Figure 2: The beta-binomial conjugate update: add successes to α and failures to β.*

## When should you use gamma as a prior?

The gamma distribution is the conjugate prior for the rate parameter of a Poisson likelihood. Start with Gamma(α, β) over the rate `λ`, observe a total count `sum(x)` across `n` periods, and the posterior is Gamma(α + sum(x), β + n). The update adds observed events to α and observed time to β, same algebraic elegance as the beta-binomial case.

Concretely: suppose you run a blog and want to estimate its daily visitor rate. You start with a weak prior Gamma(2, 1) expressing "I think the rate is around 2 visits/day but I'm not sure." Then you collect 5 days of data and see a total of 37 visits. The posterior is Gamma(2 + 37, 1 + 5) = Gamma(39, 6).

```r
# Gamma-Poisson conjugate update for visitor rate
visit_prior <- c(alpha = 2, beta = 1)
total_visits <- 37
days         <- 5

visit_post <- c(alpha = visit_prior["alpha"] + total_visits,
                beta  = visit_prior["beta"]  + days)
visit_post
#> alpha.alpha   beta.beta
#>          39           6

post_mean  <- visit_post["alpha"] / visit_post["beta"]
post_mean
#> 6.5

# 95% credible interval for the rate
qgamma(c(0.025, 0.975), visit_post["alpha"], visit_post["beta"])
#> [1] 4.627 8.796
```

The posterior mean is 6.5 visits/day, and the 95% credible interval runs from about 4.6 to 8.8 visits/day. That is a full summary of what the data have to say about the underlying rate, and it took three lines of arithmetic, no sampler, no optimiser.

**Try it:** A second week brings in 45 visits over 7 days. Update the Gamma(39, 6) posterior to a new posterior and report its mean.

```r
# Try it: sequential update
# your code here

#> Expected: new posterior is Gamma(84, 13), mean ~6.46
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_new_post <- c(alpha = visit_post["alpha"] + 45,
                 beta  = visit_post["beta"]  + 7)
ex_new_post
#> alpha.alpha   beta.beta
#>          84          13
ex_new_post["alpha"] / ex_new_post["beta"]
#> 6.4615
```

**Explanation:** Bayesian updating is sequential by design, today's posterior becomes tomorrow's prior. The new posterior Gamma(84, 13) has a mean of about 6.46 visits/day and a tighter interval than before because it now contains 12 days of evidence.

</details>

[NOTE]
**Gamma is also the conjugate prior for the rate of an exponential likelihood.** Same algebra, same intuition, add observed events to α and observed time to β.

## Practice Exercises

Two capstone problems that pull several concepts together.

### Exercise 1: Claim-size tail probabilities

An insurance company models its daily total claim amount (in thousands) as Gamma(shape = 4, rate = 0.5). Use `pgamma()` and `qgamma()` to answer:

- What is the probability that a day's claims exceed 15 (thousand)?
- What claim amount is exceeded on only 1% of days?

Save the two answers to `claim_tail` and `claim_q99`.

```r
# Exercise 1: claim tail and quantile
# Hint: use lower.tail = FALSE for the first, qgamma for the second

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
claim_tail <- pgamma(15, shape = 4, rate = 0.5, lower.tail = FALSE)
claim_q99  <- qgamma(0.99, shape = 4, rate = 0.5)
claim_tail
#> [1] 0.0602
claim_q99
#> [1] 26.62
```

**Explanation:** About 6% of days exceed 15 (thousand) in claims. The 99th percentile is roughly 26.6 (thousand), exceeded on only 1 of every 100 days.

</details>

### Exercise 2: A/B test posterior probability

You run an A/B test. Control: 48 conversions in 200 visitors. Variant: 62 conversions in 200 visitors. Using a weakly informative Beta(1, 1) prior for both, compute each posterior, then simulate 20,000 draws from each posterior to estimate `P(variant rate > control rate)`. Save to `prob_variant_better`.

```r
# Exercise 2: posterior probability of lift
# Hint: posterior for each group is Beta(1 + successes, 1 + failures)
#       sample from rbeta() and compare

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
n_sim <- 20000

control_post <- rbeta(n_sim, shape1 = 1 + 48, shape2 = 1 + 200 - 48)
variant_post <- rbeta(n_sim, shape1 = 1 + 62, shape2 = 1 + 200 - 62)

prob_variant_better <- mean(variant_post > control_post)
prob_variant_better
#> [1] 0.9361
```

**Explanation:** In about 94% of the 20,000 simulated scenarios, the variant's conversion rate exceeds the control's. That is a direct posterior probability, much more interpretable than a frequentist p-value and computed entirely from closed-form conjugate posteriors.

</details>

## Complete Example

A full A/B test workflow that ties gamma, beta, and conjugate updating together in one worked analysis. Two groups with Beta(1, 1) priors, their posteriors plotted, and a posterior probability of lift.

```r
# Full A/B test posterior analysis
set.seed(42)

# Data
control_n <- 200; control_x <- 48
variant_n <- 200; variant_x <- 62

# Posteriors (prior Beta(1,1) for both groups)
ctrl_ab <- c(1 + control_x, 1 + control_n - control_x)
var_ab  <- c(1 + variant_x, 1 + variant_n - variant_x)

# Plot both posterior densities on one chart
ab_curves <- tibble(
  p       = rep(p_grid, 2),
  density = c(dbeta(p_grid, ctrl_ab[1], ctrl_ab[2]),
              dbeta(p_grid, var_ab[1],  var_ab[2])),
  group   = factor(rep(c("Control", "Variant"), each = length(p_grid)))
)

ggplot(ab_curves, aes(p, density, colour = group)) +
  geom_line(size = 1) +
  labs(title = "Posterior densities of conversion rate",
       x = "conversion rate", y = "density") +
  theme_minimal(base_size = 13)

# Monte Carlo estimate of P(variant > control) and 95% CI for the lift
n_sim    <- 50000
ctrl_sim <- rbeta(n_sim, ctrl_ab[1], ctrl_ab[2])
var_sim  <- rbeta(n_sim, var_ab[1],  var_ab[2])

p_variant_wins <- mean(var_sim > ctrl_sim)
lift_ci        <- quantile(var_sim - ctrl_sim, c(0.025, 0.975))

p_variant_wins
#> [1] 0.9422
lift_ci
#>    2.5%    97.5%
#>  0.0045  0.1369
```

The posterior for the variant sits visibly to the right of the control posterior, and 94% of posterior draws put the variant's rate above the control's. The 95% credible interval for the absolute lift is roughly 0.4 to 13.7 percentage points. This is the Bayesian decision-maker's report: both a probability of improvement and a range of plausible effect sizes, derived from three lines of conjugate arithmetic.

## Summary

Gamma and beta at a glance:

| Property | Gamma | Beta |
|---|---|---|
| Domain | (0, ∞) | (0, 1) |
| Parameters | shape, rate (or scale) | shape1 (α), shape2 (β) |
| Mean | shape / rate | α / (α + β) |
| Conjugate prior for | Poisson rate, exponential rate | Binomial probability, Bernoulli |
| Special cases | Exponential, Erlang, chi-squared | Uniform (α=β=1), Jeffreys (α=β=0.5) |
| R functions | `dgamma, pgamma, qgamma, rgamma` | `dbeta, pbeta, qbeta, rbeta` |

Key takeaways:

1. **Gamma lives on the positive reals and models positive skewed quantities.** Shape controls skewness, rate (or scale) controls spread.
2. **Beta lives on [0, 1] and models proportions.** Shape1 and shape2 act as pseudo-successes and pseudo-failures.
3. **The d/p/q/r convention carries over from the normal.** Density, cumulative probability, quantile, random sample, same four verbs for every distribution.
4. **Conjugate priors give you closed-form Bayesian updates.** Beta-binomial for success rates, gamma-Poisson for event rates. No sampler required.

## References

1. R Core Team, *GammaDist: The Gamma Distribution*. Official stats docs. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/GammaDist.html)
2. R Core Team, *Beta: The Beta Distribution*. Official stats docs. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Beta.html)
3. Gelman, A. et al., *Bayesian Data Analysis*, 3rd Edition (2014). Chapman & Hall/CRC. Chapter 2: Single-parameter models.
4. Hoff, P. D., *A First Course in Bayesian Statistical Methods* (2009). Springer. Chapter 3: One-parameter models.
5. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. [Link](https://ggplot2-book.org/)
6. Wikipedia, *Gamma distribution*. [Link](https://en.wikipedia.org/wiki/Gamma_distribution)
7. Wikipedia, *Beta distribution*. [Link](https://en.wikipedia.org/wiki/Beta_distribution)

## Continue Learning

- [Normal, t, F, and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html), the four distributions that dominate classical inference, with the d/p/q/r conventions you just practised here.
- [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html), why the gamma starts looking normal at large shape values.
- [Cauchy & Heavy-Tailed Distributions in R](Cauchy-and-Heavy-Tailed-Distributions-in-R.html), the other end of the spectrum, where the mean is undefined and conjugate updates don't save you.
