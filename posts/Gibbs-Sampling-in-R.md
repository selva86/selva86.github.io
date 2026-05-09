---
title: "Gibbs Sampling in R From Scratch: The MCMC Trick That Powers JAGS"
slug: "Gibbs-Sampling-in-R"
description: "Build a Gibbs sampler from scratch in R for the classic mean-and-variance problem. Understand why this trick beats Metropolis on multi-parameter models."
keywords: "Gibbs sampling R, MCMC R, full conditionals, Bayesian Normal model, JAGS, posterior sampling R, Bayesian inference, conditional posterior, two-parameter MCMC, Inverse-Gamma sampling"
auto_link_terms: "Gibbs sampling|Gibbs sampler|full conditional|conditional posterior|MCMC algorithm|JAGS|Inverse-Gamma|Normal-Inverse-Gamma|Bayesian Normal model|posterior conditional|Metropolis-within-Gibbs|two-parameter MCMC"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-05-10"
curriculum_id: "5.1.6"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Gibbs Sampling"
sidebar_order: 115
difficulty: "Intermediate"
---

# Gibbs Sampling in R From Scratch: The MCMC Trick That Powers JAGS

<p class="lead">You measured how long 20 customers waited at your counter and you want two numbers from that data: the typical wait, and how much waits vary from one customer to the next. Both unknown, both with honest uncertainty around them. There is a sampling trick called Gibbs sampling that handles this in about 30 lines of base R. It is the algorithm at the heart of JAGS, and once you see it work you will understand why two unknowns are easier than one when you set the problem up right.</p>

## What if you want to estimate two things from data at once?

In the previous post you saw an MCMC sampler that estimated a single unknown, a click-through rate, by proposing tiny random moves and accepting them with the right probability. That sampler had one parameter to track. Now there are two: the mean wait time and the spread around it.

You could extend the previous sampler to two dimensions. It works, but it is awkward. You have to tune a step size for each direction, most random 2D proposals land in implausible regions, and the chain stalls on the long thin shape that two-parameter posteriors usually have. Gibbs sampling is the alternative that exploits the geometry instead of fighting it.

The full sampler runs on 20 simulated wait times below. The truth in the simulation is mean 120 seconds and standard deviation 15. We pretend we do not know either, and we recover both with full Bayesian uncertainty.

```r title="Run the full Gibbs sampler end to end"
set.seed(2026)

# 20 simulated customer wait times in seconds (truth: mean=120, sd=15)
wait_times <- rnorm(20, mean = 120, sd = 15)

gibbs_mean_var <- function(y, n_iter = 5000) {
  n    <- length(y)
  ybar <- mean(y)

  mu_samples <- numeric(n_iter)
  sd_samples <- numeric(n_iter)

  current_sd <- sd(y)   # any reasonable starting value works

  for (i in seq_len(n_iter)) {
    # Sample the mean given the current standard deviation
    current_mu <- rnorm(1, mean = ybar, sd = current_sd / sqrt(n))

    # Sample the variance given the new mean, then take the square root
    sum_sq      <- sum((y - current_mu)^2)
    current_var <- 1 / rgamma(1, shape = n / 2, rate = sum_sq / 2)
    current_sd  <- sqrt(current_var)

    mu_samples[i] <- current_mu
    sd_samples[i] <- current_sd
  }
  list(mu = mu_samples, sd = sd_samples)
}

chain    <- gibbs_mean_var(wait_times, n_iter = 5000)
post_mu  <- chain$mu[-(1:500)]   # drop first 500 as burn-in
post_sd  <- chain$sd[-(1:500)]

c(post_mean_mu  = mean(post_mu),
  post_low_mu   = quantile(post_mu, 0.025),
  post_high_mu  = quantile(post_mu, 0.975),
  post_mean_sd  = mean(post_sd),
  post_low_sd   = quantile(post_sd, 0.025),
  post_high_sd  = quantile(post_sd, 0.975))
#> post_mean_mu  post_low_mu  post_high_mu  post_mean_sd  post_low_sd post_high_sd
#>     117.583       110.720       124.447         15.791        11.894       21.517
```

Walk through what just happened. The first three lines simulated 20 wait times from a Normal distribution with the truth we will try to recover. Inside `gibbs_mean_var`, we allocated two vectors to hold the samples and picked a starting standard deviation from the data. The loop ran 5000 times, and each iteration sampled a new mean (using `rnorm`) and then a new variance (using `1 / rgamma`).

After the loop we dropped the first 500 samples as burn-in. The chain takes a few iterations to find the bulk of the posterior, so those early values are not representative. The remaining 4500 samples are draws from the joint posterior over the mean and the standard deviation.

Now read the output. The posterior mean for the underlying typical wait is 117.6 seconds with a 95% range of 110.7 to 124.4. The truth was 120, recovered within sample noise. The posterior mean for the standard deviation is 15.8 with a 95% range of 11.9 to 21.5; the truth was 15, also recovered.

That is the entire pipeline. Two unknowns, joint posterior, no specialised package, in 5000 iterations of base R. The next sections unpack why the two single-line draws of `rnorm` and `rgamma` actually produce samples from the joint distribution.

![One cycle of Gibbs sampling](screenshots/Gibbs-Sampling-in-R-cycle.webp)
*Figure 1: One cycle of Gibbs sampling. Hold one unknown fixed, sample the other from its conditional. Then flip and repeat.*

[KEY INSIGHT]
**Gibbs sampling turns a hard joint-distribution problem into a chain of easy single-parameter draws.** You never need to sample directly from the 2D posterior. You only need to know how to sample one unknown when the other is given. R already provides those one-dimensional functions for almost every standard distribution.

**Try it:** Re-run the sampler with only 5 wait times instead of 20. The 95% range of the posterior mean should widen, because less data means more uncertainty.

```r title="Your turn: smaller dataset"
set.seed(99)
ex_y <- rnorm(5, mean = 120, sd = 15)

# Run gibbs_mean_var(ex_y, 5000), drop the first 500 as burn-in,
# and compute quantile(post_mu, c(0.025, 0.975)).
#> Expected: a 95% range much wider than [110.7, 124.4] from 20 observations
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smaller dataset solution"
set.seed(99)
ex_y       <- rnorm(5, mean = 120, sd = 15)
ex_chain   <- gibbs_mean_var(ex_y, n_iter = 5000)
ex_post_mu <- ex_chain$mu[-(1:500)]

quantile(ex_post_mu, c(0.025, 0.975))
#>      2.5%     97.5%
#> 105.3812  132.4711
```

The 95% range with 5 observations is roughly 105 to 132, a span of 27 seconds. The earlier run with 20 observations had a span of about 14 seconds. Less data, more uncertainty: the algorithm responded automatically, no code change needed.

</details>

## Why doesn't the MCMC trick from before work as well in 2D?

The Metropolis-Hastings sampler from the previous post worked beautifully for one unknown. You proposed a small step, scored it, and accepted with the right probability. The chain wandered through the 1D posterior, spending more time where the density was high.

Doing the same thing for two unknowns at once introduces three new problems.

The first is *step-size tuning*. You now need a step size for the mean direction and a step size for the standard-deviation direction. If the two unknowns have very different scales (one in the hundreds, the other in the tens), a single shared step size is the wrong fit for both. You end up tuning a 2x2 covariance matrix instead of one number.

The second is *acceptance rate*. In 2D, a random step of fixed size lands in a low-density region more often than in 1D, just because there is more "low-density" area for the same step. So you reject more often, and the chain crawls.

The third is the *geometry*. The joint posterior over the mean and the standard deviation is not symmetric. The plausible range of the mean depends on the current standard deviation: a small sigma pins the mean down tightly, a large sigma loosens it. A symmetric 2D proposal cannot follow that, and wastes effort proposing impossible combinations.

Gibbs sidesteps all three. There is no step size to tune, because each move is sampled directly from a known distribution. There is no rejection, because every sample comes from the right conditional. The geometry is respected automatically, because each move uses the conditional given the *current* value of the other unknown.

The price is one assumption: you need to know how to sample from each unknown's conditional distribution. For Normal data with no informative prior, the conditionals are well-known closed forms. We will see what happens when they are not in section six.

[NOTE]
**You can mix Gibbs and Metropolis-Hastings.** When most of your conditionals are easy but one or two are not, you sample the easy ones via Gibbs and use a Metropolis-Hastings step for the hard ones. This combination is called Metropolis-within-Gibbs and it is the standard approach in tools like JAGS for moderately complex models.

**Try it:** Look at the sampler code from the first section and identify the two lines that produce a new sample inside the loop. Note which distribution each one uses.

```r title="Your turn: identify the sampling lines"
# Open gibbs_mean_var() from above.
# Find the two lines inside the for-loop that draw new samples.
# Write a short note: which distribution does each one use?
#> Expected: rnorm() for the mean, 1 / rgamma() for the variance
```

<details>
<summary>Click to reveal solution</summary>

The two sampling lines inside the loop are:

```r title="The two sampling lines"
current_mu  <- rnorm(1, mean = ybar, sd = current_sd / sqrt(n))
current_var <- 1 / rgamma(1, shape = n / 2, rate = sum_sq / 2)
```

The first uses `rnorm()` to draw the mean from a Normal distribution. Its centre is the sample mean of the data, and its spread is the current standard deviation divided by `sqrt(n)`, which is the textbook standard error.

The second uses `rgamma()` to draw a Gamma random number, then takes the reciprocal. The "draw from Gamma, take reciprocal" pattern is how you sample from an Inverse-Gamma distribution in R, which happens to be the conditional posterior of the variance under a Normal model with no informative prior.

</details>

## What's the Gibbs trick, exactly?

Stripped of math, Gibbs is doing this. Imagine a 2D landscape of plausibility. Height represents how plausible a particular pair of (mean, standard deviation) values is given the data. Most of the volume sits in a roughly elliptical region around the truth, and you want samples in proportion to that height.

You cannot sample directly from the 2D distribution because R has no function that takes "here is the joint posterior over a Normal model" and gives you a draw. But you can sample slices.

Pick a horizontal slice through the landscape at a fixed standard deviation. Along that slice, the height varies as you change the mean. The shape of the height along that slice happens to be a Normal distribution; R has `rnorm`. Sample one mean from that slice.

Now pick a vertical slice at the new mean. Along this slice, the height varies as you change the standard deviation. The shape is related to the Inverse-Gamma; R has `rgamma`, and you can sample Inverse-Gamma by taking the reciprocal. Sample one standard deviation from that slice.

Repeat. Slice horizontally at the new sigma, sample a new mean. Slice vertically at the new mean, sample a new sigma. Each slice is one-dimensional, and each one-dimensional slice is a familiar distribution.

After thousands of iterations, the collected pairs are samples from the joint 2D posterior. The chain has wandered through the plausible region in a series of right-angle moves, like a robot vacuum that can only move horizontally or vertically but eventually covers the whole room.

The mathematical guarantee, which we will not derive but which holds whenever your conditionals are correct, is that this right-angle wandering produces samples that follow the true joint distribution. Three things to notice:

1. Every move is accepted (no rejection step).
2. There is no step size to tune (the move size is set by the spread of the conditional itself).
3. Moves are always axis-aligned (which becomes a problem when the two unknowns are highly correlated, see section six).

![Gibbs vs Metropolis in 2D](screenshots/Gibbs-Sampling-in-R-vs-metropolis.webp)
*Figure 2: Gibbs takes axis-aligned steps and accepts every move. Metropolis takes diagonal steps and has to tune the step size and reject some.*

**Try it:** Run a single cycle of Gibbs by hand: starting from `current_sd = 20`, sample one new mean and one new standard deviation using the formulas from the sampler.

```r title="Your turn: one cycle of Gibbs"
set.seed(7)
ex_y <- rnorm(20, mean = 120, sd = 15)
n    <- length(ex_y)
ybar <- mean(ex_y)
current_sd <- 20

# 1. Sample a new mean from rnorm using the formula in gibbs_mean_var
# 2. Sample a new variance from 1 / rgamma using the formula
# 3. Print c(mu = current_mu, sd = sqrt(current_var))
#> Expected: one mean near 120, one sd near 15
```

<details>
<summary>Click to reveal solution</summary>

```r title="One cycle solution"
set.seed(7)
ex_y <- rnorm(20, mean = 120, sd = 15)
n    <- length(ex_y)
ybar <- mean(ex_y)
current_sd <- 20

current_mu  <- rnorm(1, mean = ybar, sd = current_sd / sqrt(n))
sum_sq      <- sum((ex_y - current_mu)^2)
current_var <- 1 / rgamma(1, shape = n / 2, rate = sum_sq / 2)

c(mu = current_mu, sd = sqrt(current_var))
#>      mu       sd
#> 122.341   16.452
```

One cycle produced one mean and one standard deviation, both reasonable given the truth (120 and 15). Run the cycle again with the new `current_sd` and you get another pair, and so on for thousands of iterations. That is the whole sampler.

</details>

## How do I code Gibbs in R?

You already saw the full sampler at the top of the post. Now we build it again from a blank line, more slowly, so each piece has a clear job.

The first piece is storage. We need two vectors to hold the samples, and a starting value for the chain. Allocating up front is faster than growing vectors inside the loop.

```r title="Step 1: allocate storage and pick a start"
y      <- wait_times
n      <- length(y)
ybar   <- mean(y)
n_iter <- 5000

mu_samples <- numeric(n_iter)
sd_samples <- numeric(n_iter)

# Start the chain at the sample standard deviation of the data
current_sd <- sd(y)

c(starting_sd = current_sd, n_iter = n_iter, n_obs = n)
#> starting_sd      n_iter      n_obs
#>    14.83925   5000.00000   20.00000
```

Walk through what we just set up. Lines 1 to 4 copied the data into a local variable, computed its length, and computed its mean once (we will reuse `ybar` inside the loop). Lines 6 and 7 allocated empty numeric vectors of length 5000. Line 10 set the starting standard deviation; using `sd(y)` is reasonable because the sample standard deviation of the data is at least in the right ballpark.

The output confirms a starting `current_sd` of 14.84 (close to the truth of 15), 5000 planned iterations, and 20 observations. Setup is ready.

The second piece is the loop. Each iteration draws one mean and one variance using the two formulas from earlier, then stores both samples.

```r title="Step 2: the Gibbs loop"
set.seed(2026)
mu_samples <- numeric(n_iter)
sd_samples <- numeric(n_iter)
current_sd <- sd(y)

for (i in seq_len(n_iter)) {
  current_mu  <- rnorm(1, mean = ybar, sd = current_sd / sqrt(n))

  sum_sq      <- sum((y - current_mu)^2)
  current_var <- 1 / rgamma(1, shape = n / 2, rate = sum_sq / 2)
  current_sd  <- sqrt(current_var)

  mu_samples[i] <- current_mu
  sd_samples[i] <- current_sd
}

c(mu_late_mean = mean(tail(mu_samples, 100)),
  sd_late_mean = mean(tail(sd_samples, 100)))
#> mu_late_mean sd_late_mean
#>      117.643       15.772
```

Walk through the loop body. Each iteration starts by sampling a new mean from a Normal distribution centred at the data mean, with spread shrunk by `1 / sqrt(n)`. That `1 / sqrt(n)` is the standard error of the mean, and it is why the conditional gets tighter as the sample size grows.

The next three lines sample a new variance given the new mean, then take the square root for the standard deviation. The two store statements record both samples in their vectors. By the end of the loop, `mu_samples` and `sd_samples` each hold 5000 values.

The sanity check on the last 100 samples shows a mean of 117.6 and a standard deviation of 15.8, matching the full-run result and the truth. The sampler is working.

[TIP]
**Always validate a sampler on simulated data with known parameters before trusting it on real data.** Generate fake data, run the sampler, and confirm the posterior contains the truth. If it does not, your conditionals are probably wrong or your starting values are pathological.

**Try it:** Add a third vector `ss_samples` and store `sum_sq` at every iteration. Compare its mean across iterations to `sum((y - mean(y))^2)`.

```r title="Your turn: track sum_sq"
# Add ss_samples <- numeric(n_iter)
# Store ss_samples[i] <- sum_sq inside the loop after computing it
# After the loop, compare mean(ss_samples) to sum((y - mean(y))^2)
#> Expected: chain mean is slightly larger than the data-mean version
```

<details>
<summary>Click to reveal solution</summary>

```r title="Track sum_sq solution"
ss_samples <- numeric(n_iter)
mu_samples <- numeric(n_iter)
sd_samples <- numeric(n_iter)
current_sd <- sd(y)

set.seed(2026)
for (i in seq_len(n_iter)) {
  current_mu  <- rnorm(1, mean = ybar, sd = current_sd / sqrt(n))
  sum_sq      <- sum((y - current_mu)^2)
  current_var <- 1 / rgamma(1, shape = n / 2, rate = sum_sq / 2)
  current_sd  <- sqrt(current_var)

  ss_samples[i] <- sum_sq
  mu_samples[i] <- current_mu
  sd_samples[i] <- current_sd
}

c(chain_mean_ss = mean(ss_samples),
  data_mean_ss  = sum((y - mean(y))^2))
#> chain_mean_ss  data_mean_ss
#>      4525.116      4181.247
```

The chain's average `sum_sq` (4525) is slightly larger than the data-mean version (4181). Each iteration's `sum_sq` is computed against the chain's *current* `mu`, which jitters around the data mean rather than sitting on it. The extra jitter inflates `sum_sq` slightly on average. This is a real property of the algorithm: it is why the posterior on the variance reflects both the data's spread and the residual uncertainty in the mean.

</details>

## How do I check that the sampler actually worked?

Three diagnostics. Trace plots, comparison against the data, and convergence across multiple chains starting from different seeds.

A *trace plot* shows each sample value against its iteration number. A healthy chain looks like a fuzzy caterpillar moving up and down without long flat stretches, drifts, or sudden jumps. We plot one for the mean and one for the standard deviation.

```r title="Step 3: trace plots and posterior densities"
chain <- gibbs_mean_var(wait_times, n_iter = 5000)

par(mfrow = c(2, 2), mar = c(4, 4, 2, 1))

plot(chain$mu, type = "l", col = "steelblue",
     xlab = "iteration", ylab = "mean (sec)", main = "Trace of mu")

plot(chain$sd, type = "l", col = "tomato",
     xlab = "iteration", ylab = "sd (sec)", main = "Trace of sd")

hist(chain$mu[-(1:500)], breaks = 40, col = "lightblue", border = "white",
     freq = FALSE, xlab = "mean (sec)", main = "Posterior of mu")

hist(chain$sd[-(1:500)], breaks = 40, col = "lightpink", border = "white",
     freq = FALSE, xlab = "sd (sec)", main = "Posterior of sd")

par(mfrow = c(1, 1))
```

Walk through what the plot shows. The two top panels are trace plots: `mu_samples` and `sd_samples` plotted against their indices. The two bottom panels are histograms of the post-burn-in samples, giving the marginal posterior for each unknown.

What you should see when you run this. Both trace plots are horizontal fuzzy bands without drift. The mean trace stays roughly between 110 and 125; the sd trace stays roughly between 11 and 22.

Both histograms are bell-shaped, the sd histogram slightly skewed because it cannot be negative. The mean histogram is centred around 117 to 118 and the sd histogram around 15 to 16, matching the summary statistics we computed earlier.

The third diagnostic is the multiple-chain check. If you start the sampler from different random seeds and all chains converge to the same posterior, you can trust the result.

```r title="Step 4: multiple chains from different starts"
chains <- lapply(1:4, function(seed) {
  set.seed(seed)
  gibbs_mean_var(wait_times, n_iter = 5000)
})

mu_means <- sapply(chains, function(c) round(mean(c$mu[-(1:500)]), 2))
sd_means <- sapply(chains, function(c) round(mean(c$sd[-(1:500)]), 2))

rbind(mu = mu_means, sd = sd_means)
#>       [,1]   [,2]   [,3]   [,4]
#> mu  117.62 117.55 117.59 117.51
#> sd   15.79  15.82  15.78  15.85
```

Walk through what we just did. We ran the sampler four separate times with different seeds, so each chain has its own random sequence. After burn-in, we computed each chain's posterior mean for both unknowns.

The four posterior means for `mu` are 117.62, 117.55, 117.59, and 117.51, all within 0.15 of each other. The four sd means are 15.79, 15.82, 15.78, and 15.85. All four chains found the same posterior, which is what convergence looks like. If we had seen one chain at 117 and another at 130, we would know something was wrong.

[TIP]
**Run multiple chains by default.** It costs almost nothing in code and catches a class of bugs that a single chain hides: stuck modes, insufficient burn-in, pathological starting values. Production tools like JAGS, brms, and Stan run four chains by default for exactly this reason.

**Try it:** Compute the ratio of across-chain spread to within-chain spread for `mu`. The ratio should be very small (well below 0.1) if the chains agree.

```r title="Your turn: across vs within"
chains <- lapply(1:2, function(seed) {
  set.seed(seed)
  gibbs_mean_var(wait_times, n_iter = 5000)
})

# Compute mean(post_mu) for each chain (across-chain spread = sd of those means)
# Compute sd(post_mu) for the first chain (within-chain spread)
# Print the ratio
#> Expected: ratio well below 0.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Across vs within solution"
post_means <- sapply(chains, function(c) mean(c$mu[-(1:500)]))
within_sd  <- sd(chains[[1]]$mu[-(1:500)])

c(across_chain_sd = sd(post_means),
  within_chain_sd = within_sd,
  ratio           = sd(post_means) / within_sd)
#> across_chain_sd  within_chain_sd            ratio
#>          0.0495           3.5001           0.0141
```

The across-chain spread is 0.05 and the within-chain spread is 3.50; the ratio is 0.014, well below 0.1. The chains agree on the posterior. The Gelman-Rubin Rhat statistic (the formal version of this idea) would be close to 1.0.

</details>

## When does Gibbs sampling break down, and what do you do then?

Gibbs is excellent when the conditionals are easy, but it has limits. Three situations cause trouble in real models.

The first is when one or more conditionals are not standard distributions. Then you cannot just call `rnorm` or `rgamma`. The standard fix is *Metropolis-within-Gibbs*: replace the troublesome draw with a small Metropolis-Hastings step inside the cycle. The rest of the algorithm stays the same.

The second is when the unknowns are highly correlated. The joint posterior is then a long thin diagonal ridge, and Gibbs can only move along axes. The chain has to take many tiny axis-aligned steps to traverse the ridge, and consecutive samples are almost identical. Two fixes: *reparameterise* the model so the unknowns are less correlated, or switch to *Hamiltonian Monte Carlo* (HMC), which can take diagonal moves informed by the posterior's gradient.

The third is when the model has dozens or hundreds of parameters. Pure Gibbs cycles through every parameter every iteration, which gets slow. JAGS handles this case by being implemented in C; Stan handles it more efficiently by using HMC with auto-tuning.

For one-off analyses with a handful of parameters, our 30-line R sampler is fast enough. For production-scale Bayesian models, you graduate to JAGS, brms, or Stan.

JAGS deserves a specific note. When you write a JAGS model and call it from R via the `rjags` or `R2jags` package, you hand JAGS a model spec and JAGS works out the conditionals automatically. JAGS then runs a Gibbs sampler much like the one we just built. The 30-line implementation in this post is a transparent version of what JAGS does on autopilot.

[KEY INSIGHT]
**Knowing what's inside JAGS makes you a better user of it.** When JAGS chains mix slowly, you will know it is probably highly correlated parameters and you will think about reparameterisation. When JAGS errors say a conditional could not be sampled, you will know the model has a non-standard distribution somewhere. None of this is mysterious once you have coded Gibbs from scratch.

**Try it:** Match each model below to the limitation it triggers: (a) Normal model with mean and variance unknown, (b) regression with 50 highly-correlated predictors, (c) hierarchical model with a custom non-standard likelihood.

```r title="Your turn: identify Gibbs limitations"
# (a) Normal mean + variance         -> ?
# (b) 50 correlated regression coefs -> ?
# (c) hierarchical custom likelihood -> ?
#> Expected: (a) clean, no problem. (b) slow mixing from correlation.
#>           (c) needs Metropolis-within-Gibbs.
```

<details>
<summary>Click to reveal solution</summary>

(a) Normal mean + variance is the case we just built. Both conditionals are standard distributions, so plain Gibbs is clean and fast. No issue.

(b) 50 correlated regression predictors is the slow-mixing case. Gibbs can only move one coefficient at a time, and the diagonal correlation structure means many cycles are needed to explore the joint posterior. The fix is to orthogonalise the predictors or use HMC.

(c) Hierarchical model with custom likelihood is the Metropolis-within-Gibbs case. Some parameters have nice conditionals (the hierarchical priors usually do), but the data-level parameters with a custom likelihood do not have closed forms. You sample those with a Metropolis-Hastings step inside the Gibbs cycle.

</details>

## Practice Exercises

### Exercise 1: Run on real data with an informative prior

The example used a flat prior on the mean. Real Bayesian work often uses an informative prior. Modify the sampler so the mean has a `Normal(120, 5^2)` prior. The conditional posterior for the mean given the variance becomes a precision-weighted average of the prior mean and the data mean.

```r title="Exercise 1 starter"
y          <- wait_times
n          <- length(y)
ybar       <- mean(y)
prior_mean <- 120
prior_var  <- 25

gibbs_with_prior <- function(y, prior_mean = 120, prior_var = 25, n_iter = 5000) {
  # Inside the loop, replace the mu draw with the precision-weighted version:
  # post_var_mu  <- 1 / (1 / prior_var + n / current_var)
  # post_mean_mu <- post_var_mu * (prior_mean / prior_var + n * ybar / current_var)
  # current_mu   <- rnorm(1, post_mean_mu, sqrt(post_var_mu))
  # Variance draw stays the same. Return list(mu=..., sd=...).
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
gibbs_with_prior <- function(y, prior_mean = 120, prior_var = 25, n_iter = 5000) {
  n           <- length(y)
  ybar        <- mean(y)
  mu_samples  <- numeric(n_iter)
  sd_samples  <- numeric(n_iter)
  current_var <- var(y)

  for (i in seq_len(n_iter)) {
    post_var_mu  <- 1 / (1 / prior_var + n / current_var)
    post_mean_mu <- post_var_mu * (prior_mean / prior_var + n * ybar / current_var)
    current_mu   <- rnorm(1, post_mean_mu, sqrt(post_var_mu))

    sum_sq       <- sum((y - current_mu)^2)
    current_var  <- 1 / rgamma(1, shape = n / 2, rate = sum_sq / 2)

    mu_samples[i] <- current_mu
    sd_samples[i] <- sqrt(current_var)
  }
  list(mu = mu_samples, sd = sd_samples)
}

set.seed(2026)
chain_pri <- gibbs_with_prior(wait_times)
mean(chain_pri$mu[-(1:500)])
#> [1] 118.0631
```

The informative prior pulled the posterior mean toward 120 (the prior centre) compared to the flat-prior 117.6. With 20 observations the data still dominates, but the prior contributed a small nudge toward its centre.

</details>

### Exercise 2: Burn-in and thinning together

For the chain from the first section, compute the post-burn-in posterior mean of `mu`, the same with thinning every 5th sample, and the within-chain standard deviations of both. Show that thinning reduces the effective sample size but not the estimate.

```r title="Exercise 2 starter"
# chain$mu has 5000 samples
# 1. Drop first 500 (burn-in): post <- chain$mu[-(1:500)]
# 2. Thin: thin <- post[seq(1, length(post), by = 5)]
# 3. Compare mean(post) and mean(thin)
# 4. Compare sd(post) and sd(thin)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
post <- chain$mu[-(1:500)]
thin <- post[seq(1, length(post), by = 5)]

c(post_mean = mean(post),
  thin_mean = mean(thin),
  post_sd   = sd(post),
  thin_sd   = sd(thin),
  post_n    = length(post),
  thin_n    = length(thin))
#>   post_mean   thin_mean     post_sd     thin_sd      post_n      thin_n
#>     117.583     117.589       3.469       3.479    4500.000     900.000
```

Both estimates of the posterior mean are essentially identical (117.58 vs 117.59), and within-chain standard deviations match. Thinning gave us 900 samples instead of 4500, with no bias in the estimate. Use thinning when storage or post-processing time matters, not when accuracy does.

</details>

### Exercise 3: Posterior probability of an event

Use the chain to compute the posterior probability that the true typical wait time exceeds 125 seconds. This is the kind of question Bayesian methods answer naturally.

```r title="Exercise 3 starter"
# chain$mu[-(1:500)] holds 4500 post-burn-in samples
# The posterior probability mu > 125 is just mean(post_mu > 125).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
post_mu <- chain$mu[-(1:500)]
mean(post_mu > 125)
#> [1] 0.0227
```

There is a 2.3% posterior probability that the true typical wait exceeds 125 seconds. With only 20 observations this is a weak claim, but it is the kind of probabilistic statement Bayesian inference produces for free: the chain is a sample from the posterior, so any probability over the unknown is just a sample proportion.

</details>

## Summary

Gibbs sampling is an MCMC algorithm for joint posteriors that you cannot sample directly but whose conditionals are standard distributions. It cycles through unknowns one at a time, drawing each from its conditional given the current values of the others. Cycling preserves the joint distribution; the stored chain converges to it.

| Step | What you do | Why it works |
|---|---|---|
| 1 | Pick a starting value for each unknown | Burn-in handles the early bias |
| 2 | Hold all but one fixed, sample that one | Each conditional is one-dimensional, R handles it |
| 3 | Move to the next, repeat with others fixed | Cycling preserves the joint distribution |
| 4 | Store every value, loop | The stored chain is a sample from the joint posterior |
| 5 | Drop early samples, analyse the rest | Post-burn-in samples are the posterior |

For Normal data with a flat prior, both conditionals are clean (Normal for mu, Inverse-Gamma for variance), and the implementation is two `rnorm`/`rgamma` calls per iteration. For models where conditionals are not standard, fall back to Metropolis-within-Gibbs; for highly correlated unknowns, switch to HMC; for production scale, use JAGS, brms, or Stan.

## References

1. Geman, S. & Geman, D. "Stochastic Relaxation, Gibbs Distributions, and the Bayesian Restoration of Images." *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 1984.
2. Gelfand, A. E. & Smith, A. F. M. "Sampling-Based Approaches to Calculating Marginal Densities." *Journal of the American Statistical Association*, 1990.
3. Gelman, A., Carlin, J. B., Stern, H. S. et al. *Bayesian Data Analysis*, 3rd ed. Chapman & Hall, 2013. Chapter 11 covers Gibbs sampling.
4. Hoff, P. *A First Course in Bayesian Statistical Methods*. Springer, 2009. Chapters 5-6.
5. Plummer, M. JAGS user manual. [mcmc-jags.sourceforge.io](https://mcmc-jags.sourceforge.io/).

## Continue Learning

- [Build MCMC From Scratch in R](MCMC-in-R.html), the simpler 1-dimensional Metropolis-Hastings sampler from the previous post.
- [Hamiltonian Monte Carlo in R](Hamiltonian-Monte-Carlo-in-R.html), the next step up: a gradient-based sampler that beats Gibbs on highly correlated posteriors.
- [Conjugate Priors in R](Conjugate-Priors-in-R.html), the closed-form shortcut that works for some Bayesian models without any sampling.
