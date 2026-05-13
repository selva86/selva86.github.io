---
title: "Bayesian Statistics Exercises in R: 20 Practice Problems"
slug: "Bayesian-Statistics-Exercises-in-R"
description: "Twenty Bayesian statistics R exercises: conjugate priors, posteriors, rstanarm, brms, MCMC diagnostics, LOO model comparison. Hidden solutions."
keywords: "Bayesian R exercises, brms exercises, rstanarm R, Bayesian regression R, MCMC R exercises, posterior R"
mathjax: true
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Bayesian Statistics Exercises"
sidebar_order: 161
fr_parent: "Bayesian-Statistics-in-R.html"
auto_link_terms: "bayesian statistics r|conjugate prior|posterior distribution|mcmc diagnostics|credible interval"
auto_link_case_sensitive: false
target_keyword: "Bayesian R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Bayesian Statistics Exercises in R: 20 Practice Problems

<p class="lead">Twenty Bayesian statistics practice problems in R covering conjugate priors, grid approximation, posterior summaries, regression with rstanarm and brms, MCMC diagnostics (R-hat, ESS), posterior predictive checks, credible intervals, and LOO model comparison. Solutions are hidden; reveal each one only after you have attempted the exercise yourself on a local R install.</p>

```r title="Run this once before any exercise"
library(rstanarm)
library(brms)
library(bayesplot)
library(posterior)
library(bayestestR)
library(loo)
```

## Section 1. Conjugate updating and grid approximation (4 problems)

### Exercise 1.1: Beta-binomial conjugate update for an A/B test

**Task:** A growth team is running an A/B test on a landing page. The control variant gets 14 conversions out of 100 visitors. Use a Beta(2, 2) weakly informative prior on the conversion rate and compute the resulting Beta posterior parameters analytically. Save the posterior shape parameters as a length-2 numeric vector to `ex_1_1`.

**Expected result:**

```
#> [1] 16 88
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prior_a <- 2
prior_b <- 2
successes <- 14
failures  <- 100 - successes
ex_1_1 <- c(prior_a + successes, prior_b + failures)
ex_1_1
#> [1] 16 88
```

**Explanation:** When the prior on a proportion is Beta(a, b) and the data are binomial with k successes out of n trials, conjugacy gives a closed-form Beta(a+k, b+n-k) posterior. Beta(2, 2) is a soft prior centered at 0.5 with an equivalent weight of about 2 successes plus 2 failures. The resulting Beta(16, 88) posterior shifts strongly toward 0.16 because the data dominate the prior at n=100. This identity is the foundation for streaming A/B updates without refitting.

</details>

### Exercise 1.2: Posterior mean and 95% credible interval from Beta(16, 88)

**Task:** Continuing the A/B test from the previous exercise, summarize the Beta(16, 88) posterior by computing the posterior mean conversion rate and the equal-tailed 95% credible interval using base R quantile functions. Save a named numeric vector with components `mean`, `lower`, `upper` to `ex_1_2`.

**Expected result:**

```
#>      mean     lower     upper
#> 0.1538462 0.0935023 0.2256617
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
post_a <- 16
post_b <- 88
post_mean <- post_a / (post_a + post_b)
ci <- qbeta(c(0.025, 0.975), post_a, post_b)
ex_1_2 <- c(mean = post_mean, lower = ci[1], upper = ci[2])
ex_1_2
#>      mean     lower     upper
#> 0.1538462 0.0935023 0.2256617
```

**Explanation:** The mean of Beta(a, b) is a / (a + b), and equal-tailed quantiles come straight from `qbeta()`. The 95% credible interval is a direct probability statement about the parameter: there is a 95% posterior probability the true conversion rate lies between 9.4% and 22.6%, unlike a frequentist confidence interval which is a statement about the procedure. A highest-density interval would be slightly narrower because the Beta posterior is right-skewed.

</details>

### Exercise 1.3: Gamma-Poisson conjugate update for a call center rate

**Task:** A call center operations analyst observes 120 calls arriving in 8 hours and assumes Poisson arrivals with rate `lambda` per hour. With a weakly informative Gamma(2, 1) prior on `lambda`, compute the analytical Gamma posterior parameters (shape and rate) and the posterior mean rate. Save a named numeric vector with components `shape`, `rate`, `mean` to `ex_1_3`.

**Expected result:**

```
#>      shape       rate       mean
#> 122.000000   9.000000  13.555556
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prior_shape <- 2
prior_rate  <- 1
total_calls <- 120
hours       <- 8
post_shape <- prior_shape + total_calls
post_rate  <- prior_rate + hours
post_mean  <- post_shape / post_rate
ex_1_3 <- c(shape = post_shape, rate = post_rate, mean = post_mean)
ex_1_3
#>      shape       rate       mean
#> 122.000000   9.000000  13.555556
```

**Explanation:** For Poisson observations with a Gamma(alpha, beta) prior on the rate, the posterior is Gamma(alpha + total counts, beta + total exposure time), so the Gamma is conjugate to the Poisson and updating is just adding sufficient statistics. The posterior mean of 122/9 (about 13.56 calls per hour) is a precision-weighted average of the prior mean (2) and the empirical rate (15), tilted toward the data because the prior carries only 1 hour of equivalent weight versus 8 hours of observation.

</details>

### Exercise 1.4: Grid approximation of a Bayesian binomial proportion

**Task:** A biostatistician wants to estimate the cure rate after observing 7 successes in 10 patients, without using closed-form conjugacy. Approximate the posterior over a 1,000-point uniform grid on [0, 1] with a uniform prior and a binomial likelihood, then compute the posterior mean by a weighted sum of grid values. Save the result as a single numeric value to `ex_1_4`.

**Expected result:**

```
#> [1] 0.6666007
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_grid <- seq(0, 1, length.out = 1000)
prior  <- rep(1, 1000)
lik    <- dbinom(7, size = 10, prob = p_grid)
post   <- (lik * prior) / sum(lik * prior)
ex_1_4 <- sum(p_grid * post)
ex_1_4
#> [1] 0.6666007
```

**Explanation:** Grid approximation discretizes the parameter space, evaluates prior times likelihood at each grid point, and normalizes the weights to sum to one. The posterior mean is then a weighted average of the grid values. The exact Beta(8, 4) posterior under a uniform prior has mean 8/12 = 0.6667, so the 1,000-point grid agrees to four decimals. Grid approximation breaks down past three or four parameters because the grid size grows exponentially with dimensionality, which is why MCMC takes over.

</details>

## Section 2. Bayesian regression with rstanarm (4 problems)

### Exercise 2.1: Bayesian linear regression on mtcars with stan_glm

**Task:** An automotive performance analyst wants to model `mpg` as a linear function of `wt` on the built-in `mtcars` dataset using `rstanarm::stan_glm()` with default weakly informative priors, 2,000 iterations, and 4 chains. Fit the model with `seed = 1` for reproducibility and save the fitted model object to `ex_2_1`.

**Expected result:**

```
#> stan_glm
#>  family:       gaussian [identity]
#>  formula:      mpg ~ wt
#>  observations: 32
#>             Median MAD_SD
#> (Intercept) 37.3   1.9
#> wt          -5.3   0.6
#> sigma        3.2   0.4
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- rstanarm::stan_glm(
  mpg ~ wt,
  data    = mtcars,
  family  = gaussian(),
  iter    = 2000,
  chains  = 4,
  refresh = 0,
  seed    = 1
)
print(ex_2_1)
#> stan_glm
#>  family:       gaussian [identity]
#>  formula:      mpg ~ wt
#>             Median MAD_SD
#> (Intercept) 37.3   1.9
#> wt          -5.3   0.6
#> sigma        3.2   0.4
```

**Explanation:** `stan_glm()` is the rstanarm wrapper around Stan that fits the same families as base `glm()` but returns full posterior draws rather than maximum likelihood estimates. Default rstanarm priors are weakly informative normals centered at zero with scales auto-adjusted to the data, so for moderate sample sizes the posterior is essentially data-driven. The printed output shows posterior medians and median absolute deviations rather than point estimates plus standard errors. Set `refresh = 0` to suppress chain progress messages in batch scripts.

</details>

### Exercise 2.2: Set custom normal priors on regression coefficients

**Task:** The analyst from the previous exercise wants to enforce a domain-informed prior belief that the slope of `mpg` on `wt` is around -5 with standard deviation 2, and a normal(20, 2.5) prior on the centered intercept. Refit the same model with these priors using `rstanarm::stan_glm()` and save the fitted object to `ex_2_2`.

**Expected result:**

```
#> Priors for model 'ex_2_2'
#> ------
#> Intercept (after predictors centered)
#>     ~ normal(location = 20, scale = 2.5)
#> Coefficients
#>     ~ normal(location = -5, scale = 2)
#> Auxiliary (sigma)
#>     ~ exponential(rate = 0.31)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- rstanarm::stan_glm(
  mpg ~ wt,
  data            = mtcars,
  family          = gaussian(),
  prior           = rstanarm::normal(location = -5, scale = 2),
  prior_intercept = rstanarm::normal(location = 20, scale = 2.5),
  iter            = 2000,
  chains          = 4,
  refresh         = 0,
  seed            = 1
)
rstanarm::prior_summary(ex_2_2)
```

**Explanation:** The `prior` argument controls the prior on slope coefficients while `prior_intercept` controls the prior on the centered intercept; rstanarm internally centers predictors before sampling for efficiency, so the intercept prior is on that centered intercept, not the raw one. `rstanarm::normal()` is the prior constructor and accepts vector arguments when you want a different normal per coefficient. Always confirm with `prior_summary()` because rstanarm sometimes rescales user priors when `autoscale = TRUE`.

</details>

### Exercise 2.3: Bayesian logistic regression for transmission type

**Task:** A vintage car valuation team wants the posterior over the log-odds that a car has a manual transmission (`am = 1`) as a function of `mpg` and `hp` from `mtcars`. Fit a Bayesian logistic regression with `rstanarm::stan_glm()`, `family = binomial(link = "logit")`, 2,000 iterations, and 4 chains. Save the fitted model object to `ex_2_3`.

**Expected result:**

```
#> stan_glm
#>  family:       binomial [logit]
#>  formula:      am ~ mpg + hp
#>  observations: 32
#>             Median MAD_SD
#> (Intercept) -33.6   19.1
#> mpg           1.5    0.8
#> hp            0.05   0.04
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- rstanarm::stan_glm(
  am ~ mpg + hp,
  data    = mtcars,
  family  = binomial(link = "logit"),
  iter    = 2000,
  chains  = 4,
  refresh = 0,
  seed    = 1
)
print(ex_2_3)
```

**Explanation:** For a binomial family, `stan_glm()` samples directly from the posterior of the log-odds coefficients, so the reported medians are interpretable as posterior median log-odds-ratios per unit change in the predictor. The `MAD_SD` column reports median absolute deviation, a robust scale measure that is more reliable than the posterior standard deviation when the posterior is heavy-tailed. With only 32 observations the intercept posterior is very wide; the Bayesian framing carries that uncertainty forward into predictions instead of pretending it does not exist.

</details>

### Exercise 2.4: Extract 90% credible intervals from a fitted stan_glm

**Task:** A reporting analyst needs to publish 90% credible intervals for every coefficient in the linear regression `ex_2_1`. Use `rstanarm::posterior_interval()` with `prob = 0.90` to extract the matrix of intervals and save the matrix (with rows for each parameter) to `ex_2_4`.

**Expected result:**

```
#>                   5%        95%
#> (Intercept)  34.1438   40.5113
#> wt           -6.3084   -4.3110
#> sigma         2.6051    3.9523
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- rstanarm::posterior_interval(ex_2_1, prob = 0.90)
ex_2_4
#>                   5%        95%
#> (Intercept)  34.1438   40.5113
#> wt           -6.3084   -4.3110
#> sigma         2.6051    3.9523
```

**Explanation:** `posterior_interval()` extracts equal-tailed credible intervals from the stored MCMC draws. The default `prob = 0.9` is the rstanarm convention because the authors argue 95% intervals overstate certainty in noisy regression scenarios. For a highest-density interval instead of equal-tailed bounds, use `bayestestR::hdi(ex_2_1, ci = 0.9)`, which gives narrower bounds when the posterior is skewed (commonly for variance components or rare-event probabilities).

</details>

## Section 3. Bayesian regression with brms (4 problems)

### Exercise 3.1: brm linear regression with an informative prior

**Task:** A racing engineer treating `mtcars` as historical telemetry believes the slope of `mpg` on `wt` lies around -4 with standard deviation 1 based on prior aerodynamic studies. Fit `brms::brm(mpg ~ wt, data = mtcars)` with a `normal(-4, 1)` prior on the `wt` coefficient, 4 chains, 2,000 iterations, and `seed = 1`. Save the fitted brmsfit object to `ex_3_1`.

**Expected result:**

```
#>  Family: gaussian
#>   Links: mu = identity; sigma = identity
#> Formula: mpg ~ wt
#>    Data: mtcars (Number of observations: 32)
#> Regression Coefficients:
#>           Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> Intercept    35.79      1.71    32.43    39.16 1.00     3201     2814
#> wt           -4.92      0.53    -5.99    -3.89 1.00     3252     2832
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- brms::brm(
  mpg ~ wt,
  data    = mtcars,
  prior   = brms::prior(normal(-4, 1), class = "b", coef = "wt"),
  chains  = 4,
  iter    = 2000,
  refresh = 0,
  seed    = 1
)
summary(ex_3_1)
```

**Explanation:** brms compiles a Stan program from the R formula and runs Hamiltonian Monte Carlo. Priors are declared with `brms::prior()` keyed by class (`b` for coefficients, `Intercept` for the centered intercept, `sigma` for residual SD). When the prior conflicts with the data, the posterior compromises between them weighted by their precision; here Bayes pulls the OLS slope of about -5.3 toward the prior mean of -4 because n = 32 carries only moderate evidence. Run a prior sensitivity sweep before publishing.

</details>

### Exercise 3.2: Hierarchical model with random intercepts by cylinder group

**Task:** A motorsport analytics team wants to partial-pool the intercept of `mpg ~ wt` across the three cylinder groups in `mtcars` because cars with the same cylinder count share an unobserved efficiency baseline. Fit `mpg ~ wt + (1 | cyl)` with `brms::brm()` using default priors, 4 chains, 2,000 iterations, and `seed = 1`. Save the fitted brmsfit object to `ex_3_2`.

**Expected result:**

```
#> Multilevel Hyperparameters:
#> ~cyl (Number of levels: 3)
#>               Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> sd(Intercept)     2.79      1.92     0.62     7.99 1.00      995     1331
#> Regression Coefficients:
#>           Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> Intercept    35.34      2.39    30.46    40.10 1.00     1893     2103
#> wt           -3.97      0.71    -5.36    -2.59 1.00     2042     2087
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- brms::brm(
  mpg ~ wt + (1 | cyl),
  data    = mtcars,
  chains  = 4,
  iter    = 2000,
  refresh = 0,
  seed    = 1
)
summary(ex_3_2)
```

**Explanation:** The `(1 | cyl)` term tells brms to estimate one varying intercept per cylinder group, drawn from a shared normal prior whose standard deviation `sd(Intercept)` is itself estimated from the data. This is partial pooling: a group with few cars is shrunk toward the global mean, while a group with many cars stays close to its own data. Use `ranef(ex_3_2)` to inspect the per-group intercept deviations; with only three groups the partial-pooling shrinkage is strong because the group-level variance is poorly identified.

</details>

### Exercise 3.3: Compare posterior under a tight prior vs a wide prior

**Task:** A statistics teaching team wants to demonstrate how a tight prior pulls the posterior away from the OLS estimate. Refit `mpg ~ wt` on `mtcars` with `brms::brm()` twice: once with a tight `normal(0, 0.1)` prior on the slope and once with a wide `normal(0, 100)` prior. Extract the posterior median slope from each fit and save the two medians as a named numeric vector with names `tight` and `wide` to `ex_3_3`.

**Expected result:**

```
#>       tight        wide
#> -0.19030  -5.34218
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_tight <- brms::brm(
  mpg ~ wt, data = mtcars,
  prior   = brms::prior(normal(0, 0.1), class = "b"),
  chains  = 4, iter = 2000, refresh = 0, seed = 1
)
fit_wide <- brms::brm(
  mpg ~ wt, data = mtcars,
  prior   = brms::prior(normal(0, 100), class = "b"),
  chains  = 4, iter = 2000, refresh = 0, seed = 1
)
ex_3_3 <- c(
  tight = median(brms::as_draws_df(fit_tight)$b_wt),
  wide  = median(brms::as_draws_df(fit_wide)$b_wt)
)
ex_3_3
#>       tight        wide
#> -0.19030  -5.34218
```

**Explanation:** With only 32 observations the data information is finite, so a tight prior centered at zero with scale 0.1 dominates and shrinks the slope toward zero, while the diffuse `normal(0, 100)` prior recovers essentially the OLS slope. This is the textbook bias-variance trade-off of prior choice: tight priors reduce posterior variance but introduce bias toward the prior mean. Always run a prior sensitivity analysis like this before publishing Bayesian results in any regulated reporting setting.

</details>

### Exercise 3.4: Inspect the prior summary on a fitted brms model

**Task:** A reviewer wants to audit which priors brms actually used for the hierarchical fit `ex_3_2`, including the default priors on the residual `sigma` and the group standard deviation. Call `brms::prior_summary(ex_3_2)` to retrieve the prior table and save the returned data frame to `ex_3_4`.

**Expected result:**

```
#>                   prior     class      coef group resp dpar nlpar lb ub  source
#>                  (flat)         b                                          default
#>                  (flat)         b        wt                          (vectorized)
#>  student_t(3, 19.2, 5.4) Intercept                                          default
#>     student_t(3, 0, 5.4)        sd                                          default
#>     student_t(3, 0, 5.4)        sd             cyl                  0    (vectorized)
#>     student_t(3, 0, 5.4)        sd Intercept   cyl                  0    (vectorized)
#>     student_t(3, 0, 5.4)     sigma                                  0      default
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- brms::prior_summary(ex_3_2)
ex_3_4
```

**Explanation:** brms picks weakly informative defaults from a Student-t family with 3 degrees of freedom and location and scale derived from the response data; this is more robust than a normal default because the heavier tails accommodate occasional large coefficients. Coefficients (`class = "b"`) default to flat (improper) priors. Always run `prior_summary()` before publishing because regulated reporting environments like FDA submissions or EMA reviews require that priors be explicitly disclosed rather than left at unstated defaults.

</details>

## Section 4. MCMC diagnostics: R-hat, ESS, traces (4 problems)

### Exercise 4.1: Compute the maximum R-hat across all parameters

**Task:** A diagnostics-focused team needs a one-number summary of MCMC convergence for the linear fit `ex_2_1`. Extract the posterior draws with `posterior::as_draws()`, compute the per-parameter R-hat with `posterior::summarise_draws()`, and take the maximum across all parameters. Save the single numeric to `ex_4_1`.

**Expected result:**

```
#> [1] 1.001
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
draws <- posterior::as_draws(ex_2_1)
ex_4_1 <- max(posterior::summarise_draws(draws, "rhat")$rhat)
ex_4_1
#> [1] 1.001
```

**Explanation:** R-hat (the potential scale reduction factor) compares the within-chain variance to the between-chain variance; values below 1.01 indicate the chains have mixed well and are sampling from the same target distribution. If `max(rhat) > 1.05` the chains have not converged and you should run longer, reparameterize, or fix divergences before trusting the posterior. The `posterior` package is the modern unified interface and supersedes `rstan::summary()` and `coda::gelman.diag()` for diagnostics on any MCMC output.

</details>

### Exercise 4.2: Compute bulk effective sample size for the wt coefficient

**Task:** The same team wants to confirm there are enough effectively independent samples to trust the posterior median of the `wt` coefficient in `ex_2_1`. Extract the posterior draws as a data frame with `posterior::as_draws_df()` and compute the bulk ESS for the `wt` parameter using `posterior::ess_bulk()`. Save the numeric value to `ex_4_2`.

**Expected result:**

```
#> [1] 3984.521
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
draws <- posterior::as_draws_df(ex_2_1)
ex_4_2 <- posterior::ess_bulk(draws$wt)
ex_4_2
#> [1] 3984.521
```

**Explanation:** Bulk ESS is the effective sample size for estimating the bulk of the posterior (mean, median) and corrects for autocorrelation between successive MCMC draws. The rule of thumb is `ess_bulk >= 400` for stable median estimates; values below that suggest you should run more iterations or reparameterize. Tail ESS (`posterior::ess_tail`) is a separate diagnostic for the 5% and 95% quantiles and can be lower than bulk ESS when the posterior has heavy tails; always report both for any published quantity.

</details>

### Exercise 4.3: Trace plot for the wt slope across chains

**Task:** A peer reviewer asks for a visual check that the four chains overlap for the `wt` slope in `ex_2_1`. Use `bayesplot::mcmc_trace()` on the posterior draws to produce a trace plot for parameter `wt` and save the returned ggplot object to `ex_4_3`.

**Expected result:**

```
# trace plot: four overlapping chains for parameter wt
# y-axis range approximately -7 to -3, x-axis post-warmup iteration 1 to 1000
# no chain stuck on a different mode, no obvious drift or stuck patches
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- bayesplot::mcmc_trace(ex_2_1, pars = "wt")
ex_4_3
```

**Explanation:** A healthy trace plot looks like overlapping fuzzy caterpillars with no visible drift, structural breaks, or stuck patches. If one chain wanders off to a different region of parameter space, you have multimodality or a label-switching problem; if all chains crawl slowly with high autocorrelation, increase `iter` or reparameterize (e.g., switch to non-centered parameterization for hierarchical models). bayesplot is part of the Stan ecosystem and accepts both rstanarm and brms fits directly without conversion.

</details>

### Exercise 4.4: Posterior predictive check with density overlay

**Task:** A modeling reviewer wants to compare the observed distribution of `mpg` in `mtcars` against 50 replicated draws from the posterior predictive of `ex_2_1` using `bayesplot::ppc_dens_overlay()`. Generate the replicates with `rstanarm::posterior_predict(ex_2_1, draws = 50)`, then call `ppc_dens_overlay()` and save the returned ggplot object to `ex_4_4`.

**Expected result:**

```
# density overlay: dark line is observed mpg, 50 light lines are y_rep replicates
# replicates broadly cover observed density between 10 and 35
# minor underprediction in the right tail near 33 mpg
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
y_rep <- rstanarm::posterior_predict(ex_2_1, draws = 50)
ex_4_4 <- bayesplot::ppc_dens_overlay(y = mtcars$mpg, yrep = y_rep)
ex_4_4
```

**Explanation:** A posterior predictive check simulates new outcomes from the fitted model and compares them to the actual data. If the model captures the data-generating process, the replicates should overlap the observed density. Systematic gaps (e.g., the observed has two modes but the replicates have one) reveal model mis-specification such as an unmodeled subgroup. `ppc_dens_overlay()` is the workhorse PPC for continuous responses; `ppc_bars()` is the discrete-count equivalent and `ppc_stat()` checks calibration of any summary statistic.

</details>

## Section 5. Posterior summaries and model comparison (4 problems)

### Exercise 5.1: Extract a 95% credible interval for a stan_glm coefficient

**Task:** A reporting analyst preparing a stakeholder summary needs the 95% equal-tailed credible interval for the `wt` slope from the fit `ex_2_1`. Call `rstanarm::posterior_interval()` with `prob = 0.95` and `pars = "wt"`, then save the returned 1-row matrix to `ex_5_1`.

**Expected result:**

```
#>       2.5%     97.5%
#> wt -6.5089  -4.1207
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- rstanarm::posterior_interval(ex_2_1, prob = 0.95, pars = "wt")
ex_5_1
#>       2.5%     97.5%
#> wt -6.5089  -4.1207
```

**Explanation:** `posterior_interval()` returns equal-tailed quantile-based intervals from the stored MCMC draws. The default `prob` is 0.9 in rstanarm; pass `prob = 0.95` to match conventional frequentist reporting when the audience expects 95% intervals. The interpretation is fully Bayesian: there is a 95% posterior probability the true slope lies in `[-6.51, -4.12]`, conditional on the model and prior. This is a direct statement about the parameter, not the procedure.

</details>

### Exercise 5.2: Highest-density interval with bayestestR

**Task:** A clinical-trial team prefers highest-density intervals over equal-tailed intervals because the HDI gives the shortest interval containing 95% of posterior mass, which matters for asymmetric posteriors. Compute the 95% HDI for every parameter of `ex_2_1` using `bayestestR::hdi()` with `ci = 0.95`. Save the returned data frame to `ex_5_2`.

**Expected result:**

```
#> Highest Density Interval
#> Parameter   |        95% HDI
#> ----------------------------
#> (Intercept) | [33.50, 41.05]
#> wt          | [-6.40, -4.04]
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- bayestestR::hdi(ex_2_1, ci = 0.95)
ex_5_2
```

**Explanation:** An HDI is the narrowest interval that contains 95% of the posterior density, so every value inside the HDI has higher posterior density than any value outside. For symmetric unimodal posteriors the HDI and equal-tailed interval coincide, but for skewed posteriors (variance parameters, rare-event probabilities) the HDI is more informative and sometimes drops the bound at zero entirely. bayestestR also exposes `eti()` for equal-tailed intervals and a flexible `ci()` wrapper that switches methods.

</details>

### Exercise 5.3: Posterior predictive for a new observation

**Task:** An automotive sales team wants the predictive distribution of `mpg` for a hypothetical 3,000-pound car (`wt = 3.0`) under the linear fit `ex_2_1`. Call `rstanarm::posterior_predict()` with `newdata = data.frame(wt = 3.0)` and 4,000 draws, then compute the predictive mean and a 90% predictive interval. Save a length-3 named numeric vector with components `mean`, `q05`, `q95` to `ex_5_3`.

**Expected result:**

```
#>     mean      q05      q95
#> 21.45    16.27    26.61
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
preds <- rstanarm::posterior_predict(
  ex_2_1,
  newdata = data.frame(wt = 3.0),
  draws   = 4000
)
ex_5_3 <- c(
  mean = mean(preds),
  q05  = unname(quantile(preds, 0.05)),
  q95  = unname(quantile(preds, 0.95))
)
ex_5_3
#>     mean      q05      q95
#> 21.45    16.27    26.61
```

**Explanation:** A posterior predictive distribution propagates both parameter uncertainty (from the posterior over the coefficients) and residual uncertainty (from sigma) to give the full predictive distribution of a new observation. The 90% predictive interval is much wider than the 90% credible interval for the mean response because it incorporates residual scatter. Always quote predictive intervals (not coefficient intervals) when forecasting a single new outcome rather than an average.

</details>

### Exercise 5.4: Compare two Bayesian models with LOO

**Task:** A modeling reviewer wants to know whether adding `cyl` as a predictor improves the linear fit on `mtcars`. Fit a second model `mpg ~ wt + cyl` with `rstanarm::stan_glm()` (4 chains, 2,000 iter, seed = 1), then compare it against `ex_2_1` using `loo::loo_compare()` on the `loo::loo()` objects from both fits. Save the comparison matrix to `ex_5_4`.

**Expected result:**

```
#>            elpd_diff se_diff
#> fit_wt_cyl   0.0       0.0
#> ex_2_1      -3.6       2.5
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_wt_cyl <- rstanarm::stan_glm(
  mpg ~ wt + cyl, data = mtcars,
  family  = gaussian(),
  iter    = 2000, chains = 4, refresh = 0, seed = 1
)
ex_5_4 <- loo::loo_compare(
  loo::loo(ex_2_1),
  loo::loo(fit_wt_cyl)
)
ex_5_4
#>            elpd_diff se_diff
#> fit_wt_cyl   0.0       0.0
#> ex_2_1      -3.6       2.5
```

**Explanation:** `loo::loo()` computes Pareto-smoothed importance-sampling leave-one-out cross-validation (PSIS-LOO), which estimates out-of-sample expected log predictive density (`elpd_loo`) without refitting the model n times. `loo_compare()` reports differences in `elpd_loo` with the best model on top. A difference smaller than 2-3 times `se_diff` is not strong evidence either way; here -3.6 with `se_diff = 2.5` is only weak evidence that adding `cyl` improves out-of-sample fit.

</details>

## What to do next

- **[Hypothesis-Testing-Exercises-in-R](Hypothesis-Testing-Exercises-in-R.html)**: the frequentist counterpart for inference drills, useful for contrasting credible intervals against confidence intervals.
- **[Linear-Regression-Exercises-in-R](Linear-Regression-Exercises-in-R.html)**: OLS regression practice that pairs naturally with the `stan_glm()` exercises above.
- **[GLM-Exercises-in-R](GLM-Exercises-in-R.html)**: generalized linear model patterns that translate to Bayesian GLMs via `brms::brm()`.
- **[Bayesian-Statistics-in-R](Bayesian-Statistics-in-R.html)**: the parent tutorial covering the conceptual foundations behind every problem on this page.
