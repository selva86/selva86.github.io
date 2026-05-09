---
title: "Conjugate Priors in R: The Shortcut That Gives Exact Posteriors Without MCMC"
slug: "Conjugate-Priors-in-R"
description: "Conjugate priors in R give exact posteriors in closed form. Master Beta-Binomial, Gamma-Poisson, and Normal-Normal updates with worked simulations, no MCMC."
keywords: "conjugate priors R, Beta-Binomial, Gamma-Poisson, Normal-Normal, posterior closed form, Bayesian inference R, conjugate distribution, prior posterior R"
auto_link_terms: "conjugate prior|Beta-Binomial conjugate|Gamma-Poisson conjugate|Normal-Normal conjugate|conjugate family|posterior closed form"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-05-09"
curriculum_id: "5.1.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Conjugate Priors"
sidebar_order: 112
difficulty: "Intermediate"
---

# Conjugate Priors in R: The Shortcut That Gives Exact Posteriors Without MCMC

<p class="lead">A conjugate prior is one where the posterior, after observing data, stays in the same distribution family as the prior. That property turns Bayesian updating into pure arithmetic on shape parameters, no MCMC required, no integration to do by hand. R has every helper you need (dbeta, dgamma, dnorm, qbeta, qgamma, qnorm) so a working analyst can compute exact posteriors in three lines.</p>

## What does it mean for a prior to be conjugate?

You probably came here because someone told you "just use a conjugate prior and you skip MCMC." That is true, and the reason it works is small enough to fit in a paragraph. The likelihood and the prior, viewed as functions of the parameter, share the same algebraic shape. Multiply them and the shape is preserved, so the posterior lives in the same family with parameters you can write down by hand.

The whole trick is one identity. Posterior is proportional to prior times likelihood:

$$ p(\theta \mid y) \;\propto\; p(y \mid \theta) \cdot p(\theta) $$

Where $p(\theta)$ is the prior, $p(y \mid \theta)$ is the likelihood, and $p(\theta \mid y)$ is the posterior. The constant of proportionality is whatever makes the posterior integrate to 1. When prior and likelihood are conjugate, that constant pops out for free because the posterior is a known distribution.

Suppose you flip a possibly-biased coin 100 times and see 65 heads. With a Beta(2, 2) prior, the posterior is exactly Beta(67, 37). One line of arithmetic gives you the full posterior plus its 95% credible interval.

```r title="Beta-Binomial in three lines"
n <- 100
k <- 65
alpha_prior <- 2
beta_prior  <- 2

alpha_post <- alpha_prior + k          # 67
beta_post  <- beta_prior  + n - k      # 37

post_mean <- alpha_post / (alpha_post + beta_post)
cri       <- qbeta(c(0.025, 0.975), alpha_post, beta_post)

post_mean
#> [1] 0.6442308
cri
#> [1] 0.5497073 0.7321076
```

The Beta(2, 2) prior gives a Beta(67, 37) posterior. Mean 0.644 sits between the prior mean 0.5 and the data proportion 0.65, gently pulled toward 0.5 by the prior's weight. The 95% credible interval is the range that contains 95% of the posterior probability mass. None of this required `integrate()`, `optim()`, or any sampler.

![Why conjugacy works](screenshots/Conjugate-Priors-in-R-kernel.webp)
*Figure 1: Why conjugacy works. Prior and likelihood share the same algebraic shape, so the posterior stays in the family.*

[KEY INSIGHT]
**Conjugate is just an algebraic-shape match between prior and likelihood, no magic.** When the likelihood viewed as a function of theta has the same kernel form as the prior, multiplying them gives a curve in the same family. The posterior parameters are simple sums of prior parameters and data summaries.

**Try it:** Repeat the calculation with a tighter Beta(20, 20) prior. What does the posterior mean become and why?

```r title="Your turn: tighten the prior"
ex_alpha <- 20
ex_beta  <- 20

# compute ex_alpha_post, ex_beta_post, and the posterior mean
#> Expected: posterior mean closer to 0.5 than 0.65
```

<details><summary>Click to reveal solution</summary>

```r title="Tighter prior solution"
ex_alpha_post <- ex_alpha + k
ex_beta_post  <- ex_beta  + n - k
ex_alpha_post / (ex_alpha_post + ex_beta_post)
#> [1] 0.6071429
```

A Beta(20, 20) prior is equivalent to having seen 38 prior flips with 19 heads. Adding the new 100 flips gives a posterior pulled noticeably back toward 0.5. A stronger prior carries more weight against the same data.

</details>

## How does the Beta-Binomial pair work?

The Beta-Binomial pair is the workhorse for proportions. Any time you have successes out of trials, that is Binomial data, and a Beta prior gives you a Beta posterior. The shape parameters alpha and beta act as pseudo-counts of prior successes and failures, so the update rule is just addition: add observed successes to alpha, add observed failures to beta.

A practical scenario. You ship 200 builds and 42 of them contain a bug. You believe most builds are clean, encoded as a Beta(2, 8) prior (mean 0.2). Compute the posterior bug rate.

```r title="Beta-Binomial bug-detection rate"
bd_n <- 200
bd_k <- 42

bd_post_a <- 2 + bd_k
bd_post_b <- 8 + bd_n - bd_k

bd_mean <- bd_post_a / (bd_post_a + bd_post_b)
qbeta(c(0.025, 0.975), bd_post_a, bd_post_b)
#> [1] 0.1620205 0.2723091
bd_mean
#> [1] 0.2142857
```

The posterior is Beta(44, 166). The mean of 0.214 is just above the data proportion of 0.21, slightly pulled toward the prior mean 0.2. The 95% credible interval [0.16, 0.27] gives a reportable range. The whole computation took four arithmetic operations and one quantile call.

[TIP]
**Alpha and beta act as pseudo-counts of prior successes and failures.** A Beta(2, 8) prior carries the same weight as 10 prior observations split 2 to 8. Doubling both shape parameters keeps the mean but tightens the curve, equivalent to having seen 20 prior observations.

**Try it:** Recompute with a Beta(1, 1) uniform prior on the same data. How does the posterior mean change?

```r title="Your turn: uniform prior"
ex_unif_a <- 1
ex_unif_b <- 1

# compute the posterior parameters and posterior mean
#> Expected: posterior mean essentially equals data proportion 42/200 = 0.21
```

<details><summary>Click to reveal solution</summary>

```r title="Uniform prior solution"
ex_unif_post_a <- ex_unif_a + bd_k
ex_unif_post_b <- ex_unif_b + bd_n - bd_k
ex_unif_post_a / (ex_unif_post_a + ex_unif_post_b)
#> [1] 0.2128713
```

With a uniform prior, the posterior mean is essentially the data proportion. The prior carries weight 2 against the data's weight of 200, so the data dominates.

</details>

## How does the Gamma-Poisson pair work?

When you have count data with a constant rate, like support tickets per day or accidents per month, the natural likelihood is Poisson. The conjugate prior is Gamma, and the posterior is Gamma with arithmetic-update parameters: add the sum of observations to alpha, add the number of observations to beta.

The math in one line. If $y_1, \ldots, y_n$ are Poisson($\lambda$) observations and the prior is Gamma($\alpha, \beta$), then:

$$ \lambda \mid y \;\sim\; \text{Gamma}\!\left(\alpha + \sum y_i,\; \beta + n\right) $$

Where: $\alpha$ and $\beta$ are the prior shape and rate, $n$ is the sample size, and $\sum y_i$ is the total of the observed counts.

Imagine you run a SaaS support team. You observe ticket counts for five days: 8, 12, 7, 15, 9. Your prior belief is "around 8 tickets per day, but I am not very sure," encoded as Gamma(2, 0.25). Compute the posterior over the daily rate.

```r title="Gamma-Poisson support tickets"
gp_y <- c(8, 12, 7, 15, 9)
gp_n <- length(gp_y)
gp_a_prior <- 2
gp_b_prior <- 0.25

gp_a_post <- gp_a_prior + sum(gp_y)       # 2 + 51 = 53
gp_b_post <- gp_b_prior + gp_n            # 0.25 + 5 = 5.25

gp_post_mean <- gp_a_post / gp_b_post
gp_post_mean
#> [1] 10.09524
qgamma(c(0.025, 0.975), gp_a_post, gp_b_post)
#> [1]  7.563749 12.916091
```

The posterior is Gamma(53, 5.25), with mean 10.1 tickets per day and 95% credible interval [7.6, 12.9]. The data mean was 51/5 = 10.2, so the prior pulled the answer down by about 0.1, confirming the prior was barely informative against five real observations.

[KEY INSIGHT]
**The same kernel-shape mechanism works across families.** The Poisson likelihood viewed as a function of lambda has a Gamma kernel, so a Gamma prior gives a Gamma posterior. The update rule is again pure addition: alpha gets the data sum, beta gets the data count.

**Try it:** Suppose you collect another five days with sum 60 instead of 51. Recompute the posterior parameters and mean.

```r title="Your turn: change observed sum"
ex_y_new_sum <- 60

# compute the new posterior alpha and posterior mean
#> Expected: posterior mean above 10
```

<details><summary>Click to reveal solution</summary>

```r title="Different sum solution"
ex_a_post_new <- gp_a_prior + ex_y_new_sum
ex_b_post_new <- gp_b_prior + 5
ex_a_post_new / ex_b_post_new
#> [1] 11.80952
```

A larger observed sum shifts the posterior mean up to about 11.8. The Gamma family responds linearly to the observed total, which is why it stays interpretable across batch sizes.

</details>

## How does the Normal-Normal pair work (with known sigma)?

For data that is approximately Normal with a known measurement standard deviation, the conjugate prior on the unknown mean is itself Normal. The posterior is Normal with two intuitive parameters: a weighted average of the prior mean and the data mean, and a precision (inverse variance) that adds prior precision and data precision.

The posterior mean formula is a precision-weighted blend.

$$ \mu \mid y \;\sim\; \text{Normal}\!\left(\frac{\frac{\mu_0}{\tau_0^2} + \frac{n \bar{y}}{\sigma^2}}{\frac{1}{\tau_0^2} + \frac{n}{\sigma^2}},\;\; \left(\frac{1}{\tau_0^2} + \frac{n}{\sigma^2}\right)^{-1}\right) $$

Where: $\mu_0$ is the prior mean, $\tau_0$ is the prior standard deviation, $\sigma$ is the known data standard deviation, $n$ is the sample size, and $\bar{y}$ is the sample mean. The first term in the parentheses is the precision-weighted blend, the second is the posterior variance.

A blood-pressure example. A clinic measures systolic BP for 15 patients (sample mean 128 mmHg, known measurement σ = 10 mmHg). Prior belief about the population mean is Normal(120, 8²). Compute the posterior.

```r title="Normal-Normal blood-pressure mean"
nn_y     <- c(135, 128, 142, 119, 130, 122, 138, 125,
              132, 117, 140, 124, 130, 121, 137)
nn_n     <- length(nn_y)
nn_mean  <- mean(nn_y)
nn_sigma <- 10                # known data SD

nn_m0 <- 120                  # prior mean
nn_t0 <- 8                    # prior SD

prior_prec <- 1 / nn_t0^2
data_prec  <- nn_n / nn_sigma^2

nn_post_var  <- 1 / (prior_prec + data_prec)
nn_post_mean <- nn_post_var * (nn_m0 * prior_prec + nn_mean * data_prec)

nn_post_mean
#> [1] 127.0857
sqrt(nn_post_var)
#> [1] 2.182179
qnorm(c(0.025, 0.975), nn_post_mean, sqrt(nn_post_var))
#> [1] 122.8087 131.3627
```

The posterior is Normal(127.1, 2.18²) with 95% credible interval [122.8, 131.4]. The data mean was 128.7 and the prior mean was 120, so the posterior sits at 127.1, much closer to the data because n=15 observations carry more precision than a prior with σ=8.

[NOTE]
**Unknown sigma needs a different conjugate setup.** When both mean and variance are unknown, the conjugate prior is Normal-Inverse-Gamma (a joint prior over mu and sigma squared). It is still closed-form, just with two parameters in play. For most everyday work the known-sigma version is enough, but be aware of the extension.

**Try it:** Tighten the prior to Normal(120, 2²) (much more confident) and recompute the posterior mean. Does it move closer to 120?

```r title="Your turn: tight prior"
ex_t0_tight <- 2

# recompute prior_prec, post_var, post_mean
#> Expected: posterior mean shifts noticeably toward 120
```

<details><summary>Click to reveal solution</summary>

```r title="Tight prior solution"
ex_prior_prec <- 1 / ex_t0_tight^2
ex_post_var   <- 1 / (ex_prior_prec + data_prec)
ex_post_var * (nn_m0 * ex_prior_prec + nn_mean * data_prec)
#> [1] 122.5825
```

A Normal(120, 2²) prior carries weight 1/4 = 0.25 in precision units, comparable to 25 hypothetical observations at σ=10. Combined with the 15 real observations, the posterior gets pulled close to 120 (122.6) instead of close to the data mean (128.7).

</details>

## How does sequential updating work for Gamma-Poisson?

A nice property of conjugate updates is that they are order-independent and incremental. Update after batch one, then update again with batch two, and you land on the same posterior as if you had combined both batches and updated once. That makes streaming Bayes natural.

```r title="Sequential vs one-shot Gamma-Poisson"
batch1 <- c(8, 12, 7)
batch2 <- c(15, 9)

# Sequential: update once per batch
seq_first  <- c(alpha = gp_a_prior + sum(batch1),
                beta  = gp_b_prior + length(batch1))           # Gamma(29, 3.25)

seq_second <- c(alpha = seq_first["alpha"] + sum(batch2),
                beta  = seq_first["beta"]  + length(batch2))   # Gamma(53, 5.25)

# One-shot: combine batches
seq_combined <- c(alpha = gp_a_prior + sum(c(batch1, batch2)),
                  beta  = gp_b_prior + length(c(batch1, batch2)))

seq_second
#> alpha.alpha   beta.beta
#>       53.00        5.25
seq_combined
#> alpha  beta
#> 53.00  5.25
```

Both paths land on Gamma(53, 5.25). The math is the same because the Gamma update is additive in both alpha (which absorbs sum y) and beta (which absorbs n). Yesterday's posterior literally becomes today's prior.

[TIP]
**All conjugate updates are stream-friendly. Posterior of yesterday becomes prior of today.** Save the two posterior parameters at the end of each day, plug them in as the prior tomorrow. No re-processing of past data, no log files to retain. This is part of what makes Bayesian methods natural for online learning.

**Try it:** Split the same five-day data into batches of 1 and 4. Verify the sequential result still matches the one-shot.

```r title="Your turn: different batch boundary"
ex_b1 <- c(8)
ex_b2 <- c(12, 7, 15, 9)

# update sequentially across the two batches and compare to one-shot
#> Expected: same Gamma(53, 5.25) posterior as before.
```

<details><summary>Click to reveal solution</summary>

```r title="Different batch boundary solution"
step1 <- c(alpha = gp_a_prior + sum(ex_b1),
           beta  = gp_b_prior + length(ex_b1))
step2 <- c(alpha = step1["alpha"] + sum(ex_b2),
           beta  = step1["beta"]  + length(ex_b2))
step2
#> alpha.alpha   beta.beta
#>       53.00        5.25
```

Same Gamma(53, 5.25) regardless of how you slice the data. Order-independence is a hard property to give up once you have it.

</details>

## When does conjugacy NOT save you?

Conjugacy is a powerful shortcut, but a narrow one. The moment your model leaves the small list of standard pairs, the closed form disappears and you need a sampler. The three big places it breaks: multi-parameter likelihoods without a joint conjugate, hierarchical models, and any custom likelihood that does not match a known family.

A two-parameter Normal model (both mean AND standard deviation unknown) demonstrates the wall. Grid approximation works in two dimensions but blows up fast.

```r title="Two-parameter grid: where conjugacy ends"
set.seed(11)
y_obs <- rnorm(20, mean = 5, sd = 1.5)

mu_grid    <- seq(3, 7, length.out = 80)
sigma_grid <- seq(0.5, 3, length.out = 80)

post_grid <- outer(mu_grid, sigma_grid, function(m, s) {
  loglik <- sapply(seq_along(m), function(i)
    sum(dnorm(y_obs, mean = m[i], sd = s[i], log = TRUE)))
  exp(loglik - max(loglik))
})
post_grid <- post_grid / sum(post_grid)
sum(mu_grid * rowSums(post_grid))
#> [1] 5.124375
```

Two parameters at 80 grid points each is 6,400 cells. Three parameters at 80 points is 512,000. Five parameters at 50 points is over 312 million. The combinatorial blow-up is exactly why MCMC was invented: it samples from the posterior without ever computing it on a grid.

![When conjugacy stops helping](screenshots/Conjugate-Priors-in-R-when-fails.webp)
*Figure 3: When conjugacy stops helping. Most real models fall off this tree quickly.*

[TIP]
**brms and Stan generalize the prior + likelihood = posterior idea via sampling.** The mental model you built here transfers directly. MCMC produces samples instead of a closed form, and the same summaries (posterior mean, credible interval, tail probability) work on those samples just like they work on closed-form posteriors.

**Try it:** Roughly how many cells does grid approximation need for 5 parameters at 50 points each?

```r title="Your turn: grid cost for 5 params"
ex_d <- 5
# total cells at 50 points each
#> Expected: a number above 300 million
```

<details><summary>Click to reveal solution</summary>

```r title="Grid cost solution"
50 ^ ex_d
#> [1] 312500000
```

Over 312 million cells. Each cell needs a likelihood evaluation. By six or seven parameters even cluster-scale grids are infeasible.

</details>

## Practice Exercises

### Exercise 1: Click-through rate (Beta-Binomial)

A new ad shows 500 impressions and gets 37 clicks. Use a Beta(2, 8) prior. Compute the posterior, the posterior mean, the 95% credible interval, and the posterior probability that the true click-through rate exceeds 5%.

```r title="Exercise 1 starter"
ctr_n <- 500
ctr_k <- 37

# compute ctr_post_a, ctr_post_b, ctr_mean, ctr_cri, ctr_p_above
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ctr_post_a <- 2 + ctr_k
ctr_post_b <- 8 + ctr_n - ctr_k
ctr_mean   <- ctr_post_a / (ctr_post_a + ctr_post_b)
ctr_cri    <- qbeta(c(0.025, 0.975), ctr_post_a, ctr_post_b)
ctr_p_above <- 1 - pbeta(0.05, ctr_post_a, ctr_post_b)
ctr_mean
#> [1] 0.07647059
ctr_cri
#> [1] 0.05477729 0.10204081
ctr_p_above
#> [1] 0.9851317
```

Posterior Beta(39, 471), mean 0.077, 95% CrI [0.055, 0.102]. Posterior probability above 5% is 0.985, strongly suggesting the ad outperforms a 5% threshold.

</details>

### Exercise 2: Support-ticket rate over two days (Gamma-Poisson)

Two days of data: 12 tickets on Monday, 18 tickets on Tuesday. Use a Gamma(2, 1) prior. Compute the posterior over the daily rate, the posterior mean, and the posterior probability that the true rate exceeds 20 tickets per day.

```r title="Exercise 2 starter"
tk_y <- c(12, 18)

# compute tk_post_a, tk_post_b, tk_mean, tk_p_high
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
tk_post_a <- 2 + sum(tk_y)
tk_post_b <- 1 + length(tk_y)
tk_mean   <- tk_post_a / tk_post_b
tk_p_high <- 1 - pgamma(20, tk_post_a, tk_post_b)
tk_mean
#> [1] 10.66667
tk_p_high
#> [1] 0.0007580094
```

Posterior Gamma(32, 3), mean 10.7 tickets per day. Posterior probability of exceeding 20 is just 0.08%, so the data essentially rules that out under this prior.

</details>

### Exercise 3: IQ measurements (Normal-Normal)

Three IQ measurements (118, 122, 124) with known measurement σ = 15. Prior on the underlying IQ is Normal(100, 15²). Compute the posterior mean, posterior standard deviation, and 95% credible interval.

```r title="Exercise 3 starter"
iq_y <- c(118, 122, 124)
iq_sigma <- 15
iq_m0 <- 100
iq_t0 <- 15

# compute iq_post_mean, iq_post_var, iq_cri
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
iq_n         <- length(iq_y)
iq_data_prec <- iq_n / iq_sigma^2
iq_prior_prec <- 1 / iq_t0^2
iq_post_var   <- 1 / (iq_prior_prec + iq_data_prec)
iq_post_mean  <- iq_post_var * (iq_m0 * iq_prior_prec + mean(iq_y) * iq_data_prec)
iq_cri        <- qnorm(c(0.025, 0.975), iq_post_mean, sqrt(iq_post_var))
iq_post_mean
#> [1] 115.5
sqrt(iq_post_var)
#> [1] 7.5
iq_cri
#> [1] 100.8003 130.1997
```

Posterior mean 115.5, posterior SD 7.5. Three measurements with σ=15 carry the same precision as the prior, so the posterior mean is exactly halfway between the prior mean (100) and the data mean (121.3).

</details>

## Complete Example: Two-Variant AB Test

A typical conversion-rate AB test. Control gets 1,200 visitors and 84 convert; treatment gets 1,180 visitors and 105 convert. Use a Beta(1, 1) uniform prior on each variant. Compute posteriors for both, then estimate the posterior probability that treatment beats control by sampling from each posterior.

```r title="Conversion-rate AB test"
# Control
ctrl_n <- 1200; ctrl_k <-  84
ctrl_post <- c(alpha = 1 + ctrl_k, beta = 1 + ctrl_n - ctrl_k)

# Treatment
trt_n  <- 1180; trt_k  <- 105
trt_post  <- c(alpha = 1 + trt_k,  beta = 1 + trt_n  - trt_k)

ctrl_post["alpha"] / sum(ctrl_post)
#> alpha
#>  0.07
trt_post["alpha"]  / sum(trt_post)
#> alpha
#>  0.08966751

# Posterior probability that treatment > control
set.seed(2026)
N <- 1e5
ctrl_draws <- rbeta(N, ctrl_post["alpha"], ctrl_post["beta"])
trt_draws  <- rbeta(N, trt_post["alpha"],  trt_post["beta"])
mean(trt_draws > ctrl_draws)
#> [1] 0.97
```

Control posterior mean is 7.0%, treatment is 9.0%. Sampling 100,000 draws from each posterior shows the treatment rate exceeds the control rate in 97% of cases, a strong signal that treatment is better. This is the Bayesian counterpart to a frequentist p-value, but the answer is a probability you can quote directly to a stakeholder: "we are 97% sure treatment beats control."

## Summary

![Three common conjugate pairs](screenshots/Conjugate-Priors-in-R-three-families.webp)
*Figure 2: The three common conjugate pairs and their closed-form posterior parameters.*

| Family | Likelihood | Prior | Posterior parameters |
|---|---|---|---|
| Beta-Binomial | Binomial(n, theta) | Beta(alpha, beta) | Beta(alpha + k, beta + n - k) |
| Gamma-Poisson | Poisson(lambda) | Gamma(a, b) | Gamma(a + sum y, b + n) |
| Normal-Normal (known sigma) | Normal(mu, sigma²) | Normal(m0, t0²) | Precision-weighted mean and tau |
| Normal-Inverse-Gamma | Normal(mu, sigma²) for sigma² | Inverse-Gamma(a, b) | Inverse-Gamma(a + n/2, b + SS/2) |

When all four conditions hold, you skip MCMC: standard likelihood, conjugate prior on each parameter, no hierarchy, single dataset.

## References

1. Johnson, A. A., Ott, M. Q., Dogucu, M. *Bayes Rules! An Introduction to Applied Bayesian Modeling*, Chapman & Hall, 2022. Chapter 5 covers conjugate families. [bayesrulesbook.com/chapter-5](https://www.bayesrulesbook.com/chapter-5).
2. Gelman, A., Carlin, J. B., Stern, H. S., et al. *Bayesian Data Analysis*, 3rd ed. Chapman & Hall, 2013. Chapters 2-3 derive the standard conjugate families.
3. Cook, J. D. "Diagram of Bayesian conjugate priors." [johndcook.com/blog/conjugate_prior_diagram](https://www.johndcook.com/blog/conjugate_prior_diagram/). Interactive cross-family reference.
4. Fink, D. "A Compendium of Conjugate Priors." 1997. [johndcook.com/CompendiumOfConjugatePriors.pdf](https://www.johndcook.com/CompendiumOfConjugatePriors.pdf). Comprehensive table.
5. Gelman, A. and the Stan team. "Prior choice recommendations." [github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations](https://github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations).
6. CRAN Task View: Bayesian Inference. [cran.r-project.org/web/views/Bayesian.html](https://cran.r-project.org/web/views/Bayesian.html).
7. Wikipedia. "Conjugate prior." [en.wikipedia.org/wiki/Conjugate_prior](https://en.wikipedia.org/wiki/Conjugate_prior). Comprehensive cross-family table including hyperparameter interpretation.

## Continue Learning

- [Bayesian Statistics in R](Bayesian-Statistics-in-R.html), the section opener with deeper Beta-Binomial intuition and the prior-likelihood-posterior simulation.
- [Bayes' Theorem in R](Bayes-Theorem-in-R.html), the discrete-case foundation that motivates everything here.
- [Gamma & Beta Distributions in R](Gamma-and-Beta-Distributions-in-R.html), full mechanics of the two distribution families used as priors throughout this post.
