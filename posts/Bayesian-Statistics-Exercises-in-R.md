---
title: "Bayesian Statistics Exercises in R: 20 Practice Problems"
slug: "Bayesian-Statistics-Exercises-in-R"
description: "Master Bayesian statistics in R with 20 practice problems: priors, posteriors, MCMC, brms, rstanarm, posterior summaries. Hidden solutions."
keywords: "Bayesian R exercises, brms exercises, rstanarm R, R Bayesian practice, MCMC R exercises"
mathjax: true
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Bayesian Statistics Exercises"
sidebar_order: 161
fr_parent: "R-Tutorial.html"
auto_link_terms: "Bayesian R exercises|brms exercises|rstanarm R|R Bayesian practice"
auto_link_case_sensitive: false
target_keyword: "Bayesian R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Bayesian Statistics Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on Bayesian inference in R: priors, posteriors, MCMC, brms, rstanarm, posterior summaries. Hidden solutions.</p>

```r title="Run this once before any exercise"
# library(brms); library(rstanarm); library(bayesplot); library(posterior)
```

### Exercise 1: Conjugate prior for binomial

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# Beta(a,b) prior + binomial likelihood -> Beta(a+x, b+n-x) posterior
a <- 2; b <- 2; n <- 10; x <- 7
post_a <- a + x; post_b <- b + n - x
qbeta(c(0.025, 0.975), post_a, post_b)
```

</details>

### Exercise 2: Posterior mean (beta-binomial)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
a <- 7; b <- 2 + 3
a / (a + b)
```

</details>

### Exercise 3: brms simple linear regression

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# fit <- brms::brm(mpg ~ wt, data = mtcars, chains = 4)
# summary(fit)
```

</details>

### Exercise 4: rstanarm linear

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# fit <- rstanarm::stan_glm(mpg ~ wt, data = mtcars)
```

</details>

### Exercise 5: Set a normal prior

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# brms::brm(mpg ~ wt, data = mtcars,
#           prior = prior(normal(0, 10), class = "b"))
```

</details>

### Exercise 6: Inspect chains

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# plot(fit)   # trace and density per parameter
```

</details>

### Exercise 7: R-hat convergence

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# rstan::rhat(fit$fit) |> max()   # should be near 1.0
```

</details>

### Exercise 8: Effective sample size

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# posterior::ess_bulk(as_draws(fit))
```

</details>

### Exercise 9: Posterior CI

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# posterior_interval(fit, prob = 0.95)
```

</details>

### Exercise 10: Posterior predictive check

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# rstanarm::pp_check(fit, nreps = 50)
```

</details>

### Exercise 11: Compare two models with LOO

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# l1 <- loo::loo(fit1); l2 <- loo::loo(fit2)
# loo::loo_compare(l1, l2)
```

</details>

### Exercise 12: Bayes factor

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# library(bayestestR); bayesfactor(fit1, fit2)
```

</details>

### Exercise 13: Posterior mean prediction

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# posterior_predict(fit, newdata = data.frame(wt = 3)) |> colMeans()
```

</details>

### Exercise 14: Hierarchical model

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# brms::brm(mpg ~ wt + (1 | cyl), data = mtcars)
```

</details>

### Exercise 15: Logistic Bayesian

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# rstanarm::stan_glm(am ~ mpg, data = mtcars, family = binomial)
```

</details>

### Exercise 16: Strong prior vs weak

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# Compare posterior with prior(normal(0, 0.1)) vs prior(normal(0, 10))
```

</details>

### Exercise 17: Grid approximation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
p_grid <- seq(0, 1, length = 1000)
prior <- rep(1, 1000)
lik <- dbinom(7, 10, p_grid)
post <- (lik * prior) / sum(lik * prior)
sample(p_grid, 1e4, prob = post, replace = TRUE) |> mean()
```

</details>

### Exercise 18: Plot posterior

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# library(bayesplot); mcmc_areas(as.matrix(fit), prob = 0.95)
```

</details>

### Exercise 19: Credible interval extraction

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# bayestestR::hdi(fit)
```

</details>

### Exercise 20: Posterior probability of effect

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# bayestestR::p_direction(fit)
```

</details>

## What to do next

- **Hypothesis-Testing-Exercises** (shipped) — frequentist baseline.
- **Linear-Regression-Exercises** (shipped) — OLS baseline.
