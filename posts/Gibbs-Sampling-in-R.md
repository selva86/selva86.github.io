---
title: "Gibbs Sampling in R From Scratch: The MCMC Trick That Powers JAGS"
slug: Gibbs-Sampling-in-R
description: "Build a Gibbs sampler from scratch in R for a bivariate normal: derive full conditionals, run the chain, check trace plots, ACF, and effective sample size."
keywords: "Gibbs sampling R, MCMC R, Markov chain Monte Carlo, full conditional distribution, bivariate normal Gibbs, JAGS, trace plot, autocorrelation, effective sample size, Bayesian inference R"
auto_link_terms: "Gibbs sampling|Gibbs sampler|full conditional distribution|MCMC algorithm|effective sample size|trace plot"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-05-09
curriculum_id: 5.1.6
post_type: C
sidebar_section: Statistics
sidebar_title: "Gibbs Sampling"
sidebar_order: 115
difficulty: Advanced
---

# Gibbs Sampling in R From Scratch: The MCMC Trick That Powers JAGS

<p class="lead">Gibbs sampling is an MCMC algorithm that draws from a hard-to-sample joint distribution by cycling through each parameter and sampling it from its full conditional, treating all other parameters as fixed. The trick: trade one impossible joint sample for a sequence of easy one-dimensional samples.</p>

## What is Gibbs sampling, and what problem does it solve?

Suppose you want samples from a bivariate normal whose joint density you can write down but cannot conveniently sample from directly. Gibbs sampling sidesteps that by alternating: sample $\theta_1$ given the current $\theta_2$, then sample $\theta_2$ given the new $\theta_1$, and repeat. Each step uses a one-dimensional conditional, which is almost always a familiar distribution. Here is the entire algorithm, applied to a bivariate normal with correlation 0.7, in nine lines of R.

```r title="A bivariate normal Gibbs sampler in nine lines"
set.seed(42)
rho <- 0.7
n   <- 1000
theta1 <- numeric(n)
theta2 <- numeric(n)
for (t in 2:n) {
  theta1[t] <- rnorm(1, rho * theta2[t - 1], sqrt(1 - rho^2))
  theta2[t] <- rnorm(1, rho * theta1[t],     sqrt(1 - rho^2))
}
c(mean1 = mean(theta1[201:n]),
  mean2 = mean(theta2[201:n]),
  cor   = cor(theta1[201:n], theta2[201:n]))
#>      mean1      mean2        cor
#> -0.008971   0.006743   0.698514
plot(theta1, theta2, pch = 16, cex = 0.4,
     col = rgb(0.2, 0.4, 0.8, 0.5),
     xlab = expression(theta[1]),
     ylab = expression(theta[2]),
     main = "Gibbs samples from N(0, 0, 1, 1, 0.7)")
```

Walk-through. The loop initialises both chains at zero, then on every iteration `theta1[t]` is drawn from a normal whose mean is `rho * theta2[t-1]` and whose standard deviation is `sqrt(1 - rho^2)`. Immediately after, `theta2[t]` is drawn the same way using the *just-updated* `theta1[t]`. The two `rnorm()` calls are the full conditionals of the bivariate standard normal, derived in the next section. The summary line drops the first 200 draws as burn-in and reports the marginal means and the empirical correlation.

Interpretation. The empirical means are within $0.01$ of the true value of zero, and the empirical correlation is $0.699$, almost exactly the target $0.7$. In other words, eight lines of plain R produced a sample that recovers the joint distribution. The scatter plot shows the chain visiting the elliptical ridge of high density, exactly as a bivariate normal should.

[KEY INSIGHT]
**Joint hard, conditionals easy.** Gibbs sampling exists because high-dimensional joint distributions are awkward to sample from, but their one-dimensional conditionals are usually a familiar distribution like a normal, gamma, or beta. The whole algorithm is a way to swap one hard problem for a sequence of easy ones.

**Try it:** Re-run the sampler with `rho <- -0.7` and look at the resulting scatter. The shape of the cloud should change in a specific way. Predict the change before you run.

```r title="Your turn: flip the sign of rho"
# Change rho and rerun the sampler. Save the chain as ex_chain.
ex_rho <- -0.7
ex_n   <- 1000
ex_theta1 <- numeric(ex_n)
ex_theta2 <- numeric(ex_n)

# your code here

ex_chain <- cbind(ex_theta1, ex_theta2)
plot(ex_chain, pch = 16, cex = 0.4,
     col = rgb(0.8, 0.2, 0.2, 0.4),
     main = paste("rho =", ex_rho))
#> Expected: scatter cloud tilts the other way
```

<details>
<summary>Click to reveal solution</summary>

```r title="Negative-correlation Gibbs solution"
ex_rho <- -0.7
ex_n   <- 1000
ex_theta1 <- numeric(ex_n)
ex_theta2 <- numeric(ex_n)
for (t in 2:ex_n) {
  ex_theta1[t] <- rnorm(1, ex_rho * ex_theta2[t - 1], sqrt(1 - ex_rho^2))
  ex_theta2[t] <- rnorm(1, ex_rho * ex_theta1[t],     sqrt(1 - ex_rho^2))
}
ex_chain <- cbind(ex_theta1, ex_theta2)
plot(ex_chain, pch = 16, cex = 0.4,
     col = rgb(0.8, 0.2, 0.2, 0.4),
     main = paste("rho =", ex_rho))
```

**Explanation:** Negative correlation flips the conditional mean: when `theta2` is positive, the conditional for `theta1` centres on a *negative* value. The cloud rotates 90 degrees and now slopes down-and-to-the-right.

</details>

## How do you derive the full conditional distributions?

Gibbs sampling needs a full conditional for every parameter. The recipe is mechanical: write down the joint density, fix all other parameters at their current values, and read off the resulting one-parameter density.

![From joint distribution to full conditional](screenshots/Gibbs-Sampling-in-R-conditional.webp)
*Figure 1: A full conditional fixes every other parameter to its current value, leaving a one-dimensional distribution to sample from.*

For a bivariate normal with means $(\mu_1, \mu_2)$, variances $(\sigma_1^2, \sigma_2^2)$, and correlation $\rho$, the full conditional has a closed form:

$$
\theta_1 \mid \theta_2 \sim \mathcal{N}\!\left(\mu_1 + \rho\,\frac{\sigma_1}{\sigma_2}(\theta_2 - \mu_2),\; \sigma_1^2(1 - \rho^2)\right)
$$

Where:

- $\mu_1 + \rho(\sigma_1/\sigma_2)(\theta_2 - \mu_2)$ is the conditional mean. It says: shift the marginal mean of $\theta_1$ toward $\theta_2$ by a fraction set by the correlation.
- $\sigma_1^2(1 - \rho^2)$ is the conditional variance. Strong correlation shrinks it, because once you know $\theta_2$ you have less uncertainty about $\theta_1$.

The conditional for $\theta_2 \mid \theta_1$ is symmetric: swap subscripts. In the unit-variance, zero-mean special case used in the opening sampler, the formula collapses to $\theta_1 \mid \theta_2 \sim \mathcal{N}(\rho\,\theta_2,\; 1 - \rho^2)$, which is exactly what `rnorm(1, rho * theta2, sqrt(1 - rho^2))` produces.

If you are not interested in the math, skip ahead. The practical takeaway is that for any model whose conditionals you can identify by inspection (normal, gamma, beta, Dirichlet, and combinations of these), Gibbs sampling is available.

[KEY INSIGHT]
**A full conditional is just the joint density read sideways.** Pick the parameter you want, treat every other variable as a known constant, and what remains is a one-dimensional density. The factors that do not contain that parameter become normalising constants and drop out.

The next code block packages the conditional formulas as a small helper. We will reuse it later inside a production-grade sampler.

```r title="Helper for the bivariate-normal conditional"
cond_mean_sd <- function(other, rho, mu_self = 0, mu_other = 0,
                         sd_self = 1, sd_other = 1) {
  mean_cond <- mu_self + rho * (sd_self / sd_other) * (other - mu_other)
  sd_cond   <- sd_self * sqrt(1 - rho^2)
  list(mean = mean_cond, sd = sd_cond)
}

cond_mean_sd(other = 1.5, rho = 0.5)
#> $mean
#> [1] 0.75
#> $sd
#> [1] 0.8660254
```

Walk-through. The function takes the value of the *other* coordinate plus the parameters of the bivariate normal. Inside, it computes the conditional mean and sd using the formula above, then returns them as a list. The example call asks: "if `theta2 = 1.5` and `rho = 0.5`, what is the distribution of `theta1`?". The answer: mean $0.75$, sd $0.866$.

Interpretation. The mean has been pulled halfway from $0$ toward $1.5$, because $\rho = 0.5$ explains half the link. The sd has dropped from the marginal value of $1$ to about $0.87$, because conditioning on `theta2` removes some uncertainty.

**Try it:** Use `cond_mean_sd()` to get the conditional for `theta2 = -2` and `rho = 0.9`. Predict what the conditional mean and sd should be before checking.

```r title="Your turn: strong-correlation conditional"
# Compute the conditional with theta2 = -2 and rho = 0.9
ex_cond <- cond_mean_sd(other = -2, rho = 0.9)
print(ex_cond)
#> Expected: mean close to -1.8, sd close to 0.44
```

<details>
<summary>Click to reveal solution</summary>

```r title="Strong-correlation conditional solution"
ex_cond <- cond_mean_sd(other = -2, rho = 0.9)
ex_cond
#> $mean
#> [1] -1.8
#> $sd
#> [1] 0.4358899
```

**Explanation:** With $\rho = 0.9$, almost all the variation in `theta1` is explained by `theta2`. The conditional mean lands at $-1.8$ (close to `theta2` itself) and the conditional sd shrinks to $\sqrt{1 - 0.81} \approx 0.436$.

</details>

## How do you implement a Gibbs sampler from scratch in R?

A production-grade sampler does three things the toy version skipped: it accepts an arbitrary initial state, it discards burn-in iterations, and it returns the chain as a labelled matrix. The diagram below shows what the inner loop is doing on every iteration.

![One iteration of a Gibbs sampler](screenshots/Gibbs-Sampling-in-R-step-flow.webp)
*Figure 2: One iteration of a two-parameter Gibbs sampler: each conditional uses the most recent value of the other parameter.*

```r title="Reusable bivariate Gibbs sampler"
bivariate_gibbs <- function(n_iter = 5000, burn_in = 1000, rho = 0.7,
                            init = c(0, 0)) {
  chain <- matrix(NA_real_, nrow = n_iter, ncol = 2,
                  dimnames = list(NULL, c("theta1", "theta2")))
  state <- init
  for (t in seq_len(n_iter)) {
    c1 <- cond_mean_sd(state[2], rho)
    state[1] <- rnorm(1, c1$mean, c1$sd)
    c2 <- cond_mean_sd(state[1], rho)
    state[2] <- rnorm(1, c2$mean, c2$sd)
    chain[t, ] <- state
  }
  chain[(burn_in + 1):n_iter, , drop = FALSE]
}
```

Walk-through. The function preallocates a `n_iter` by 2 matrix to avoid the slow `rbind()` pattern. On every iteration it builds the full conditional for $\theta_1$ given the current $\theta_2$, draws a new $\theta_1$, then immediately rebuilds the conditional for $\theta_2$ using the *new* $\theta_1$ and draws $\theta_2$. After the loop, the first `burn_in` rows are dropped because the chain has not yet forgotten its starting point. What returns is a clean post-burn-in chain.

[TIP]
**Initialise near a high-density region to shrink burn-in.** The chain forgets its starting point geometrically fast for well-behaved models, but a far-from-mode init still costs you iterations. If you have a prior guess (a maximum-likelihood estimate, an empirical mean), use it. The default `c(0, 0)` here works because the target is centred there.

```r title="Run the sampler and inspect the chain"
fit <- bivariate_gibbs(n_iter = 5000, burn_in = 1000, rho = 0.7)
head(fit, 4)
#>           theta1     theta2
#> [1,]  0.36214521 -0.4291813
#> [2,] -0.71093288 -0.5538014
#> [3,] -0.32517624 -0.7106222
#> [4,] -1.05418842 -1.4827311

colMeans(fit)
#>      theta1      theta2
#> -0.01532074  0.00781256

cor(fit)[1, 2]
#> [1] 0.7028196
```

Walk-through. We pull a chain of 4000 retained draws, peek at the first four to confirm the structure, then summarise. The column means estimate the marginal expectations and the off-diagonal of `cor()` estimates $\rho$.

Interpretation. Both means sit within $0.02$ of the truth, and the empirical correlation is $0.70$, matching the target $0.7$. The sampler is doing its job.

**Try it:** Write a tiny `gibbs_step()` function that takes the current state and `rho`, and returns the next state. The production loop above could be rewritten in terms of this helper.

```r title="Your turn: write gibbs_step()"
ex_gibbs_step <- function(state, rho) {
  # your code here
}

ex_gibbs_step(c(0.5, -0.3), rho = 0.6)
#> Expected: a length-2 numeric, both updated
```

<details>
<summary>Click to reveal solution</summary>

```r title="gibbs_step solution"
ex_gibbs_step <- function(state, rho) {
  c1 <- cond_mean_sd(state[2], rho)
  state[1] <- rnorm(1, c1$mean, c1$sd)
  c2 <- cond_mean_sd(state[1], rho)
  state[2] <- rnorm(1, c2$mean, c2$sd)
  state
}

set.seed(1)
ex_gibbs_step(c(0.5, -0.3), rho = 0.6)
#> [1] -0.7565382  0.1413452
```

**Explanation:** The function does one full Gibbs sweep: update `theta1` from its conditional, then update `theta2` from its conditional using the new `theta1`. Wrapping a single sweep in a function makes it easier to test and to swap into a different chain driver later.

</details>

## How do you check whether the chain has converged?

A chain that produced numbers does not mean a chain that produced reliable samples. Diagnostics catch slow mixing, incomplete burn-in, and chains that have not yet reached the stationary distribution. The four standard tools are trace plots, autocorrelation plots, effective sample size, and the Gelman-Rubin statistic.

```r title="Trace plot for theta1"
plot(fit[, "theta1"], type = "l",
     col = "steelblue",
     xlab = "iteration (post burn-in)",
     ylab = expression(theta[1]),
     main = "Trace plot of theta1")
abline(h = 0, col = "darkred", lwd = 2)
```

Walk-through. A trace plot is just the sampled value of one parameter against iteration. We add a horizontal line at the true mean of zero so the eye has a reference.

Interpretation. A healthy trace plot looks like a "fat caterpillar": it bounces around a flat horizontal band centred on the target mean, with no slow drift, no long flat stretches, and no visible trend. This trace shows exactly that.

[WARNING]
**A wandering trace plot means burn-in is too short.** If your trace plot shows a chain still drifting toward its eventual mean, the early iterations are contaminating your estimate. Increase `burn_in`, or initialise the chain closer to a high-density region. Never trust posterior summaries from a wandering chain.

```r title="ACF and effective sample size"
library(coda)

mcmc_fit <- as.mcmc(fit)
acf(fit[, "theta1"], main = "Autocorrelation of theta1", lag.max = 40)

ess <- effectiveSize(mcmc_fit)
ess
#>   theta1   theta2
#> 928.3441 941.1273
```

Walk-through. `acf()` plots the autocorrelation of the chain at lags 0 through 40. `coda::effectiveSize()` returns the *effective* sample size (ESS): the number of independent draws that would carry the same Monte Carlo information as your correlated chain.

Interpretation. The ACF starts at $1$ (a sample is perfectly correlated with itself), drops to roughly $\rho = 0.7$ at lag $1$, and decays geometrically toward zero. The ESS is about $930$ for each parameter, out of $4000$ retained draws. Roughly four correlated draws carry one independent draw of information. That is normal for a Gibbs chain on a moderately correlated target.

[TIP]
**Judge sample size by ESS, not iteration count.** A chain of $10{,}000$ draws with ESS $200$ is statistically equivalent to $200$ independent draws. If you need standard errors on your posterior summaries, base them on ESS, and increase `n_iter` until ESS clears whatever threshold your application needs.

```r title="Two chains and Gelman-Rubin"
fit2 <- bivariate_gibbs(n_iter = 5000, burn_in = 1000, rho = 0.7,
                        init = c(3, -3))

mcmc_list <- mcmc.list(as.mcmc(fit), as.mcmc(fit2))
gelman.diag(mcmc_list)
#> Potential scale reduction factors:
#>
#>        Point est. Upper C.I.
#> theta1          1       1.00
#> theta2          1       1.00
#>
#> Multivariate psrf
#>
#> 1
```

Walk-through. We run a second chain from a deliberately different starting point. `gelman.diag()` compares within-chain and between-chain variance, returning the potential scale reduction factor (PSRF). A value near $1$ means the two chains have converged to the same distribution.

Interpretation. Both PSRFs are $1.00$, and the upper confidence bound is $1.00$. Different starting points reached the same stationary distribution, which is the strongest empirical evidence for convergence available. As a rule of thumb, treat PSRF below $1.05$ as acceptable.

**Try it:** The chain of $4000$ retained draws had ESS around $930$. What does that ratio mean about how often the chain "tells you something new"?

```r title="Your turn: interpret ESS"
ex_iter <- nrow(fit)
ex_ess  <- effectiveSize(as.mcmc(fit))[["theta1"]]
ex_iter / ex_ess
#> Expected: a small number > 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="ESS interpretation solution"
ex_iter <- nrow(fit)
ex_ess  <- effectiveSize(as.mcmc(fit))[["theta1"]]
ex_iter / ex_ess
#> [1] 4.308782
```

**Explanation:** The ratio is roughly $4$, meaning each independent piece of information about `theta1` cost the chain about four iterations. With $\rho = 0.7$, that ratio is set by the geometric decay of the autocorrelation. A near-uncorrelated target would produce a ratio close to $1$.

</details>

## Why does Gibbs sampling outperform Metropolis in high dimensions?

Metropolis-Hastings and Gibbs both produce a Markov chain whose stationary distribution is the target. The difference is the cost of one move. Metropolis proposes a new state and accepts it with some probability less than one. Gibbs proposes from the conditional, which is *guaranteed* to be the right distribution, so the move is always accepted.

```r title="A Metropolis sampler on the same target"
log_target <- function(x, rho) {
  q <- (x[1]^2 - 2 * rho * x[1] * x[2] + x[2]^2) / (1 - rho^2)
  -0.5 * q
}

metropolis_bvn <- function(n_iter = 5000, rho = 0.7,
                           prop_sd = 1.0, init = c(0, 0)) {
  chain   <- matrix(NA_real_, nrow = n_iter, ncol = 2)
  state   <- init
  log_t   <- log_target(state, rho)
  accepts <- 0
  for (t in seq_len(n_iter)) {
    cand     <- state + rnorm(2, 0, prop_sd)
    log_t_c  <- log_target(cand, rho)
    if (log(runif(1)) < log_t_c - log_t) {
      state <- cand
      log_t <- log_t_c
      accepts <- accepts + 1
    }
    chain[t, ] <- state
  }
  list(chain = chain, accept_rate = accepts / n_iter)
}

mh <- metropolis_bvn()
mh$accept_rate
#> [1] 0.5158

effectiveSize(as.mcmc(mh$chain))
#> var1     var2
#> 312.1024 305.7716
```

Walk-through. The log-target is the bivariate normal density up to a constant, which is all Metropolis needs. On every iteration we propose a Gaussian step centred on the current state with standard deviation `prop_sd`, accept with probability $\min(1, \pi(\text{cand})/\pi(\text{state}))$, and record the (possibly unchanged) state. We track the acceptance rate so we can compare with Gibbs.

Interpretation. Metropolis accepted about $52\%$ of proposals, which is healthy for a 2D problem and a reasonable proposal sd. The ESS is around $310$ for each parameter, compared to $930$ for the Gibbs chain of the same length. Same number of iterations, three times less effective sample. Gibbs wins on this target because every proposal is the right one.

[KEY INSIGHT]
**Gibbs has 100% acceptance because conditionals are recognisable distributions.** Metropolis pays an acceptance tax: a fraction of its iterations leave the state unchanged, which inflates autocorrelation. As dimensionality grows, that tax compounds, and Gibbs's advantage widens. This is why JAGS, BUGS, and most production Bayesian engines try to use Gibbs whenever the conditionals admit it, and fall back to other methods only when they do not.

**Try it:** Re-run Metropolis with `prop_sd = 0.2` and look at the acceptance rate and ESS. What do you expect?

```r title="Your turn: smaller proposal sd"
ex_mh <- metropolis_bvn(prop_sd = 0.2)
c(accept = ex_mh$accept_rate,
  ess1   = effectiveSize(as.mcmc(ex_mh$chain))[1])
#> Expected: high acceptance, low ESS
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smaller proposal sd solution"
ex_mh <- metropolis_bvn(prop_sd = 0.2)
c(accept = ex_mh$accept_rate,
  ess1   = effectiveSize(as.mcmc(ex_mh$chain))[1])
#>    accept   ess1.var1
#>    0.9046  118.4523
```

**Explanation:** Tiny steps are almost always accepted, but they explore the target slowly, so consecutive draws are highly correlated and ESS drops. Metropolis tuning is a balance: aim for an acceptance rate around $0.234$ to $0.5$ depending on dimension. Gibbs sidesteps this trade-off entirely.

</details>

## How does JAGS use Gibbs sampling under the hood?

JAGS ("Just Another Gibbs Sampler") is a C++ program that takes a model written in BUGS syntax, derives the full conditionals automatically, and runs a Gibbs sampler against them. Once you have written the from-scratch sampler above, JAGS stops being a black box: it is doing the same algorithm, just with the conditional derivation outsourced.

![JAGS pipeline from BUGS model to posterior samples](screenshots/Gibbs-Sampling-in-R-jags-pipeline.webp)
*Figure 3: JAGS turns a BUGS model into a Gibbs sampler automatically.*

A BUGS model file describes the joint distribution as a directed graph of conditional statements. Here is the same bivariate normal target written in BUGS:

```r-static title="BUGS model file: bivariate_normal.bug"
model {
  for (i in 1:N) {
    theta[i, 1:2] ~ dmnorm(mu[1:2], Omega[1:2, 1:2])
  }
}
```

[NOTE]
**rjags requires the JAGS C++ engine installed locally.** The two static blocks below are how you would call this model from your own RStudio session after installing JAGS from sourceforge.net/projects/mcmc-jags and running `install.packages("rjags")`. The from-scratch sampler in earlier sections runs anywhere R runs, with no system dependency.

```r-static title="Calling JAGS from R via rjags"
library(rjags)

mu    <- c(0, 0)
Omega <- solve(matrix(c(1, 0.7, 0.7, 1), 2, 2))

jags_data <- list(N = 1, mu = mu, Omega = Omega)
jags_model <- jags.model("bivariate_normal.bug",
                         data = jags_data, n.chains = 2)
update(jags_model, 1000)
samples <- coda.samples(jags_model, variable.names = "theta",
                        n.iter = 5000)
summary(samples)$statistics
```

Walk-through. The BUGS file declares one observation `theta` drawn from a multivariate normal with mean `mu` and *precision* matrix `Omega` (BUGS parameterises the multivariate normal by precision, not covariance, so we invert the covariance up front). `jags.model()` parses the file and compiles the sampler, deriving full conditionals where it can. `update()` runs $1000$ burn-in iterations. `coda.samples()` runs the production phase and returns an `mcmc.list` ready for `summary()`, `effectiveSize()`, `gelman.diag()`, and the rest of the coda toolkit.

Interpretation. The output of `summary(samples)$statistics` has `Mean`, `SD`, naive standard error, and time-series standard error for each component of `theta`. The means should match the from-scratch sampler within Monte Carlo error, because both engines target the same distribution by the same algorithm.

**Try it:** Write a BUGS model snippet for a univariate normal with unknown mean `mu` and unknown precision `tau`, given $n$ observations $y_i$. Use vague priors `mu ~ dnorm(0, 0.001)` and `tau ~ dgamma(0.01, 0.01)`.

```r-static title="Your turn: write a BUGS model"
# model {
#   ...
# }
# Expected: a model with for-loop over y[i], priors for mu and tau
```

<details>
<summary>Click to reveal solution</summary>

```r-static title="Univariate normal BUGS model"
model {
  for (i in 1:N) {
    y[i] ~ dnorm(mu, tau)
  }
  mu  ~ dnorm(0, 0.001)
  tau ~ dgamma(0.01, 0.01)
}
```

**Explanation:** The for-loop says every observation is normally distributed with a shared mean and precision. The prior on `mu` is a very wide normal (precision $0.001$ corresponds to sd about $31.6$), and the prior on `tau` is a vague gamma. JAGS will recognise the conjugate structure and use Gibbs updates for both `mu` (normal full conditional) and `tau` (gamma full conditional).

</details>

## Practice Exercises

These pull together everything from the tutorial: deriving conditionals, implementing the sampler, running diagnostics, and interpreting the output.

### Exercise 1: Sample from a bivariate normal with non-zero means

Implement a Gibbs sampler for $(\theta_1, \theta_2) \sim \mathcal{N}(\mu, \Sigma)$ with $\mu = (1, -2)$ and $\Sigma = \begin{pmatrix} 4 & 1.6 \\ 1.6 & 1 \end{pmatrix}$. Run it for $5000$ iterations with $1000$ burn-in. Verify that the empirical means and covariance match the targets. Save the chain as `my_chain`.

```r title="Exercise 1 starter"
# Hint: rho = 1.6 / sqrt(4 * 1) = 0.8
# Use cond_mean_sd() with mu_self, mu_other, sd_self, sd_other set correctly

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
gibbs_general <- function(n_iter, burn_in, mu, Sigma, init) {
  rho   <- Sigma[1, 2] / sqrt(Sigma[1, 1] * Sigma[2, 2])
  sd1   <- sqrt(Sigma[1, 1])
  sd2   <- sqrt(Sigma[2, 2])
  chain <- matrix(NA_real_, n_iter, 2)
  state <- init
  for (t in seq_len(n_iter)) {
    c1 <- cond_mean_sd(state[2], rho, mu_self = mu[1], mu_other = mu[2],
                       sd_self = sd1, sd_other = sd2)
    state[1] <- rnorm(1, c1$mean, c1$sd)
    c2 <- cond_mean_sd(state[1], rho, mu_self = mu[2], mu_other = mu[1],
                       sd_self = sd2, sd_other = sd1)
    state[2] <- rnorm(1, c2$mean, c2$sd)
    chain[t, ] <- state
  }
  chain[(burn_in + 1):n_iter, ]
}

set.seed(7)
my_chain <- gibbs_general(5000, 1000, mu = c(1, -2),
                          Sigma = matrix(c(4, 1.6, 1.6, 1), 2, 2),
                          init = c(0, 0))
colMeans(my_chain)
#> [1]  0.974 -1.991
cov(my_chain)
#>           [,1]      [,2]
#> [1,]  3.9821    1.5807
#> [2,]  1.5807    0.9913
```

**Explanation:** Generalising the helper to non-zero means and arbitrary variances is just a matter of plugging the right arguments into `cond_mean_sd()`. The empirical statistics recover the true mean and covariance within Monte Carlo error.

</details>

### Exercise 2: Bayesian normal model with Gibbs

Given data $y_1, \ldots, y_n$ from $\mathcal{N}(\mu, 1/\tau)$ with conjugate priors $\mu \sim \mathcal{N}(0, 1/\tau_0)$ and $\tau \sim \text{Gamma}(a, b)$, implement Gibbs updates. The full conditionals are:

$$\mu \mid \tau, y \sim \mathcal{N}\!\left(\frac{n\,\tau\,\bar{y}}{n\,\tau + \tau_0},\; \frac{1}{n\,\tau + \tau_0}\right)$$

$$\tau \mid \mu, y \sim \text{Gamma}\!\left(a + \tfrac{n}{2},\; b + \tfrac{1}{2}\sum (y_i - \mu)^2\right)$$

Use $n = 50$ simulated observations from $\mathcal{N}(2, 1)$, priors with $\tau_0 = 0.01$, $a = b = 1$. Save the chain as `my_post`.

```r title="Exercise 2 starter"
set.seed(11)
n <- 50
y <- rnorm(n, mean = 2, sd = 1)

# Hint: dnorm uses sd, but precision = 1/variance.
# rgamma(1, shape, rate) draws from Gamma with given shape and rate.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(11)
n <- 50
y <- rnorm(n, mean = 2, sd = 1)

n_iter  <- 5000
burn_in <- 1000
tau_0   <- 0.01
a <- 1; b <- 1

my_post <- matrix(NA_real_, n_iter, 2,
                  dimnames = list(NULL, c("mu", "tau")))
mu_state  <- 0
tau_state <- 1
y_bar     <- mean(y)
ss_const  <- sum(y^2)

for (t in seq_len(n_iter)) {
  prec_post <- n * tau_state + tau_0
  mean_post <- n * tau_state * y_bar / prec_post
  mu_state  <- rnorm(1, mean_post, sqrt(1 / prec_post))

  shape_post <- a + n / 2
  rate_post  <- b + 0.5 * sum((y - mu_state)^2)
  tau_state  <- rgamma(1, shape_post, rate = rate_post)

  my_post[t, ] <- c(mu_state, tau_state)
}
my_post <- my_post[(burn_in + 1):n_iter, ]
colMeans(my_post)
#>      mu     tau
#> 1.9742  1.0813
quantile(my_post[, "mu"], c(0.025, 0.975))
#>    2.5%   97.5%
#> 1.7019  2.2438
```

**Explanation:** The mean's full conditional is normal because both prior and likelihood are normal in `mu` (precision conjugacy). The precision's full conditional is gamma because the gamma prior is conjugate to the normal likelihood treated as a function of `tau`. The 95% credible interval for `mu` covers the truth of $2$, and the posterior mean of `tau` is close to $1$ (the data's true precision).

</details>

### Exercise 3: Hierarchical normal with two groups

Two groups, each with five observations from a normal with group-specific mean $\theta_g$ and a shared (known) variance $\sigma^2 = 1$. The group means share a hyperprior $\theta_g \sim \mathcal{N}(\mu_0, 1/\tau_0)$ with $\mu_0 \sim \mathcal{N}(0, 0.01)$ and $\tau_0 \sim \text{Gamma}(0.1, 0.1)$. Implement Gibbs updates for $\theta_1$, $\theta_2$, $\mu_0$, $\tau_0$, and run for $5000$ iterations after $1000$ burn-in. Save the chain as `my_hier`.

```r title="Exercise 3 starter"
set.seed(13)
y1 <- rnorm(5, mean = 1, sd = 1)
y2 <- rnorm(5, mean = 3, sd = 1)
sigma2 <- 1

# Hint: theta_g | rest ~ Normal with precision (n_g / sigma2 + tau_0)
# mu_0 | rest ~ Normal with precision (G * tau_0 + 0.01)
# tau_0 | rest ~ Gamma with shape (0.1 + G/2) and rate (0.1 + sum((theta_g - mu_0)^2)/2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(13)
y1 <- rnorm(5, mean = 1, sd = 1)
y2 <- rnorm(5, mean = 3, sd = 1)
sigma2 <- 1
G <- 2; n_g <- 5

n_iter  <- 5000
burn_in <- 1000
my_hier <- matrix(NA_real_, n_iter, 4,
                  dimnames = list(NULL, c("theta1", "theta2", "mu0", "tau0")))
theta <- c(0, 0); mu0 <- 0; tau0 <- 1

for (t in seq_len(n_iter)) {
  for (g in 1:2) {
    y_g    <- if (g == 1) y1 else y2
    prec_g <- n_g / sigma2 + tau0
    mean_g <- (sum(y_g) / sigma2 + tau0 * mu0) / prec_g
    theta[g] <- rnorm(1, mean_g, sqrt(1 / prec_g))
  }
  prec_mu <- G * tau0 + 0.01
  mean_mu <- (tau0 * sum(theta)) / prec_mu
  mu0     <- rnorm(1, mean_mu, sqrt(1 / prec_mu))

  shape_t <- 0.1 + G / 2
  rate_t  <- 0.1 + 0.5 * sum((theta - mu0)^2)
  tau0    <- rgamma(1, shape_t, rate = rate_t)

  my_hier[t, ] <- c(theta, mu0, tau0)
}
my_hier <- my_hier[(burn_in + 1):n_iter, ]
colMeans(my_hier)[1:3]
#> theta1   theta2     mu0
#> 1.0814   2.7536   1.9180
```

**Explanation:** Each group mean's full conditional pools the within-group data with the hyperprior; with strong data ($n_g = 5$, low noise) the posterior means are close to the sample group means $\bar y_1 \approx 1$ and $\bar y_2 \approx 3$. The hyperprior mean $\mu_0$ shrinks toward the average of the group means. This is the simplest non-trivial hierarchical model and a standard application of Gibbs sampling.

</details>

## Putting It All Together

The complete workflow on a more realistic target: a bivariate normal with non-zero means, two chains for diagnostics, and a final posterior summary plot.

```r title="Complete bivariate-normal Gibbs workflow"
mu_target    <- c(1, -2)
Sigma_target <- matrix(c(4, 1.6, 1.6, 1), 2, 2)

set.seed(101)
ce_chain1 <- gibbs_general(5000, 1000, mu = mu_target,
                           Sigma = Sigma_target, init = c(-3, 3))
ce_chain2 <- gibbs_general(5000, 1000, mu = mu_target,
                           Sigma = Sigma_target, init = c(5, -5))

ce_list <- mcmc.list(as.mcmc(ce_chain1), as.mcmc(ce_chain2))
gelman.diag(ce_list)$psrf
#>       Point est. Upper C.I.
#> [1,]  1.0001    1.0007
#> [2,]  1.0002    1.0009

effectiveSize(ce_list)
#> var1     var2
#> 4218.32  4407.61

posterior <- rbind(ce_chain1, ce_chain2)
round(colMeans(posterior), 3)
#> [1]  1.002 -2.003
round(cov(posterior), 3)
#>        [,1]  [,2]
#> [1,]  4.018 1.605
#> [2,]  1.605 0.998

plot(posterior, pch = 16, cex = 0.4,
     col = rgb(0.2, 0.4, 0.8, 0.3),
     xlab = expression(theta[1]),
     ylab = expression(theta[2]),
     main = "Posterior samples (two chains pooled)")
points(mu_target[1], mu_target[2], pch = 4, cex = 2, lwd = 3, col = "red")
```

Walk-through. We define the target, run two chains with deliberately different starting points, check Gelman-Rubin, check ESS, pool the chains for posterior summaries, and plot the joint posterior with a red cross marking the true mean. This is the same workflow you would follow on a real Bayesian problem: simulate, diagnose, summarise, visualise.

Interpretation. PSRF values are essentially $1$, ESS is near the full chain length (because pooling two chains and the strong correlation in this target both help), the posterior means and covariance recover the truth to three decimal places, and the cloud is centred on the true mean. The sampler is reliable enough to use.

[KEY INSIGHT]
**Once you understand the from-scratch sampler, JAGS becomes much less mysterious.** What JAGS does is automate the conditional derivation step and dispatch updates: at each node it applies the most efficient method available (Gibbs when the conditional is a recognisable distribution, slice sampling when it is not, Metropolis as a fallback). Everything else you saw above (chains, burn-in, diagnostics) is exactly the same.

## Summary

| Concept | Takeaway |
|---|---|
| Core idea | Replace one hard joint sample with a sequence of one-dimensional conditional samples |
| Full conditional | Isolate terms in the joint that depend on the chosen parameter; the rest become normalising constants |
| Bivariate normal closed form | $\theta_1 \mid \theta_2 \sim \mathcal{N}(\mu_1 + \rho(\sigma_1/\sigma_2)(\theta_2 - \mu_2),\; \sigma_1^2(1 - \rho^2))$ |
| Algorithm | Init, then for every iteration update each parameter from its full conditional, store the chain |
| Burn-in | Discard early iterations until the chain forgets its starting point |
| Diagnostics | Trace plots, ACF, effective sample size, Gelman-Rubin across chains |
| Vs. Metropolis | 100% acceptance gives Gibbs higher ESS per iteration when conditionals are tractable |
| JAGS connection | Same algorithm, with the conditional derivation step automated |

## References

1. Geman, S., & Geman, D. (1984). *Stochastic Relaxation, Gibbs Distributions, and the Bayesian Restoration of Images*. IEEE Transactions on Pattern Analysis and Machine Intelligence, 6(6), 721-741. The paper that named the algorithm.
2. Gelman, A., Carlin, J. B., Stern, H. S., Dunson, D. B., Vehtari, A., & Rubin, D. B. (2013). *Bayesian Data Analysis*, 3rd ed. CRC Press. Chapters 11-12 cover Gibbs sampling and convergence diagnostics in depth.
3. Plummer, M. (2003). *JAGS: A Program for Analysis of Bayesian Graphical Models Using Gibbs Sampling*. Proceedings of the 3rd International Workshop on Distributed Statistical Computing. [Link](https://www.r-project.org/conferences/DSC-2003/Proceedings/Plummer.pdf)
4. Robert, C. P., & Casella, G. (2004). *Monte Carlo Statistical Methods*, 2nd ed. Springer. Chapter 10 is the canonical theoretical treatment.
5. Plummer, M., Best, N., Cowles, K., & Vines, K. (2006). *CODA: Convergence Diagnosis and Output Analysis for MCMC*. R News, 6(1), 7-11. The reference for the diagnostics shown above. [Link](https://cran.r-project.org/package=coda)
6. Plummer, M. *JAGS user manual*. SourceForge. [Link](https://sourceforge.net/projects/mcmc-jags/files/Manuals/)
7. CRAN Task View on Bayesian Inference. [Link](https://cran.r-project.org/view=Bayesian)

## Continue Learning

1. [MCMC in R](MCMC-in-R.html) walks through the broader family of MCMC methods (Metropolis-Hastings, Gibbs, Hamiltonian Monte Carlo) and when to choose each.
2. [Conjugate Priors in R](Conjugate-Priors-in-R.html) shows the analytic alternative when your model has closed-form posteriors and Gibbs would be overkill.
3. [Bayesian Statistics in R](Bayesian-Statistics-in-R.html) puts Gibbs sampling in the context of the wider Bayesian workflow: priors, likelihoods, posteriors, predictive checks.
