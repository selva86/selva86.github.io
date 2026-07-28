---
title: "brms vs Stan vs JAGS in R: Which Bayesian Package Should You Use?"
slug: "brms-vs-Stan-vs-JAGS-in-R"
description: "brms vs Stan vs JAGS in R compared: how each specifies a Bayesian model, which sampler it runs, and a clear decision guide for choosing the right one."
keywords: "brms vs Stan, brms vs JAGS, Stan vs JAGS, Bayesian R packages, which Bayesian package, rjags, rstan, brms package, MCMC in R, Bayesian modeling in R"
auto_link_terms: "brms vs Stan|Stan vs JAGS|brms vs JAGS|brms vs Stan vs JAGS|choosing a Bayesian package|Bayesian package comparison|which Bayesian package|Bayesian software in R|compare Bayesian packages|rjags vs rstan"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-28"
curriculum_id: "CMP10"
post_type: "FR"
fr_parent: "brms-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">brms, Stan, and JAGS all fit Bayesian models by drawing samples from the posterior, so they answer the same statistical question. What differs is how you write the model down and how the software explores it: brms suits most regression work, Stan gives you full control over custom models, and JAGS is handy when your model has discrete hidden parameters.</p>

If you have decided to go Bayesian in R, the next question is which package to write your model in. This guide compares the three most common choices side by side, in plain language, so you can pick with confidence. The runnable examples on this page use base R so you can follow every idea live in your browser. The package-specific code for brms, Stan, and JAGS is shown for reference, since those engines run in a local R session rather than here.

## What do brms, Stan, and JAGS actually do?

All three tools solve one problem: you have a model with unknown parameters, you have some prior belief about those parameters, and you have data. You want the updated belief after seeing the data, which is called the posterior. Bayes' rule says the posterior is proportional to the likelihood of the data times the prior:

$$p(\theta \mid y) \propto p(y \mid \theta)\, p(\theta)$$

Where:

- $p(\theta \mid y)$ is the posterior, what we want.
- $p(y \mid \theta)$ is the likelihood, how well a parameter value explains the data.
- $p(\theta)$ is the prior, what we believed before seeing the data.

For a tiny model you can compute the posterior directly on a grid of values. Let's do exactly that so you can see a real posterior before we bring in the packages. Suppose we measured 12 reaction times in seconds and we want the posterior for the true average. We put a Normal(2, 0.5) prior on the mean and evaluate the formula above at 2000 candidate values.

```r title="Grid-approximate a posterior mean"
# 12 reaction times (seconds); we want the posterior for the true mean
y <- c(2.1, 1.9, 2.4, 2.0, 2.2, 1.8, 2.3, 2.1, 2.5, 1.7, 2.2, 2.0)

grid <- seq(1.5, 2.5, length.out = 2000)          # candidate values of the mean
prior <- dnorm(grid, mean = 2.0, sd = 0.5)          # Normal(2, 0.5) prior
likelihood <- sapply(grid, function(m) prod(dnorm(y, mean = m, sd = 0.25)))
post <- prior * likelihood                          # posterior proportional to prior x likelihood
post <- post / sum(post)                            # normalise so it sums to 1

post_mean <- sum(grid * post)                       # posterior mean
cdf <- cumsum(post)
ci <- c(grid[which.min(abs(cdf - 0.025))], grid[which.min(abs(cdf - 0.975))])
round(c(mean = post_mean, lower = ci[1], upper = ci[2]), 3)
#>  mean lower upper 
#> 2.098 1.958 2.238
```

The walk-through: we built the prior and the likelihood on the same grid, multiplied them point by point, and normalised the result into a proper probability distribution. Summing `grid * post` gives the posterior mean, and reading off the 2.5% and 97.5% points of the cumulative distribution gives a 95% credible interval.

The interpretation: the posterior says the true mean is about 2.10 seconds, and we are 95% sure it lies between 1.96 and 2.24. That full range, not just a single number, is the Bayesian answer. brms, Stan, and JAGS all produce this same kind of result, a whole posterior distribution, for models far too big to solve on a grid.

[KEY INSIGHT]
**The three packages give you the same posterior; they differ only in the front end and the sampler.** Once you accept that, the choice stops being about correctness and becomes about how you want to write the model and how fast it needs to run.

**Try it:** Recompute the posterior mean with a wider prior, Normal(2, 1), which expresses weaker prior belief. Reuse `grid` and `likelihood` from above.

```r title="Your turn: widen the prior"
# Build a Normal(2, 1) prior on the same grid, multiply by `likelihood`,
# normalise so it sums to 1, then take sum(grid * posterior).
# Expected: still about 2.10, because the data dominate here.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wider prior solution"
ex_prior <- dnorm(grid, mean = 2.0, sd = 1.0)
ex_post <- ex_prior * likelihood
ex_post <- ex_post / sum(ex_post)
round(sum(grid * ex_post), 3)
#> [1] 2.099
```

**Explanation:** With 12 data points the likelihood is sharp, so loosening the prior barely moves the posterior mean. The prior matters most when data are scarce.

</details>

## How does each package describe the same model?

Real models have more parameters than a grid can handle, so you hand the job to a sampler. The three packages sit at different heights on an abstraction ladder. brms lets you write a one-line formula. Stan asks you to write a small program that spells out the model. JAGS uses a declarative language called BUGS, where you state the relationships and it works out the rest.

![Three ways to describe one Bayesian model, all ending at posterior draws.](screenshots/brms-vs-Stan-vs-JAGS-in-R-abstraction-ladder.webp)
*Figure 1: brms writes Stan for you, while JAGS runs its own Gibbs engine. All roads end at posterior draws.*

To compare the three fairly, we need one concrete model. Let's simulate a simple linear regression where the true intercept is 2 and the true slope is 0.5, then look at the data and fit an ordinary least-squares line as a reference point.

```r title="Simulate a regression and fit lm"
set.seed(101)
n <- 60
x <- runif(n, 0, 10)
y_reg <- 2 + 0.5 * x + rnorm(n, sd = 1)   # true intercept 2, true slope 0.5
d <- data.frame(x = x, y = y_reg)
head(d, 3)
#>           x        y
#> 1 3.7219838 4.755929
#> 2 0.4382482 2.498276
#> 3 7.0968402 6.556286

fit_lm <- lm(y ~ x, data = d)
round(coef(fit_lm), 3)
#> (Intercept)           x 
#>       2.077       0.480
```

Least squares recovers a slope of 0.48, close to the true 0.5. That is a single best-guess line with no uncertainty attached. The Bayesian version returns a posterior for the slope instead. Here is how you would ask each package for it.

With **brms**, the model is the same formula you gave `lm()`, plus a prior and a family. You never write any Stan code.

```
library(brms)

fit_brms <- brm(
  y ~ x,                                     # same formula you would give lm()
  data   = d,
  family = gaussian(),
  prior  = prior(normal(0, 1), class = "b") # prior on the slope
)

summary(fit_brms)   # posterior means, 95% credible intervals, and convergence diagnostics
```

With **Stan**, you write a small program with three blocks: the data it expects, the parameters to estimate, then the model that connects them. You then call it from R.

```stan
// slope_model.stan
data {
  int<lower=1> N;
  vector[N] x;
  vector[N] y;
}
parameters {
  real a;                 // intercept
  real b;                 // slope
  real<lower=0> sigma;    // noise standard deviation
}
model {
  b ~ normal(0, 1);              // prior on the slope
  y ~ normal(a + b * x, sigma);  // likelihood
}
```

```
library(rstan)

fit_stan <- stan(
  file  = "slope_model.stan",
  data  = list(N = nrow(d), x = d[["x"]], y = d[["y"]])
)

print(fit_stan, pars = c("a", "b", "sigma"))
```

With **JAGS**, you write a BUGS model. It looks similar to Stan but reads as a set of declarations, and it parameterises the normal by precision rather than standard deviation.

```
model {
  for (i in 1:N) {
    y[i] ~ dnorm(a + b * x[i], tau)   # tau is precision = 1 / variance
  }
  a   ~ dnorm(0, 0.001)               # vague prior on the intercept
  b   ~ dnorm(0, 1)                   # prior on the slope
  tau ~ dgamma(0.01, 0.01)            # prior on the precision
}
```

```
library(rjags)

# model_string holds the model block above, stored as a string
jags <- jags.model(textConnection(model_string),
                   data = list(N = nrow(d), x = d[["x"]], y = d[["y"]]))
samples <- coda.samples(jags, variable.names = c("a", "b"), n.iter = 2000)
summary(samples)
```

Notice the trade-off. The brms version is three lines and needs no new language. The Stan and JAGS versions are more verbose but let you write relationships that no formula could express.

[NOTE]
**Precision, not variance, trips up newcomers in JAGS.** JAGS writes the normal distribution as `dnorm(mean, tau)` where `tau` is the precision, equal to 1 divided by the variance. A big `tau` means small spread. Stan and brms use the standard deviation directly, so watch the switch when you port a model.

Is the claim that brms writes Stan for you literally true? Yes. brms has a function that shows you the exact Stan program it builds from your formula, and it runs without fitting anything. Let's look at the data block it generates.

```r-static title="brms generates the Stan program for you"
library(brms)

# make_stancode turns a formula into a full Stan program, no Stan coding required
stan_prog <- make_stancode(y ~ x, data = d, family = gaussian())
cat(paste(strsplit(as.character(stan_prog), "\n")[[1]][4:11], collapse = "\n"))
#> data {
#>   int<lower=1> N;  // total number of observations
#>   vector[N] Y;  // response variable
#>   int<lower=1> K;  // number of population-level effects
#>   matrix[N, K] X;  // population-level design matrix
#>   int<lower=1> Kc;  // number of population-level effects after centering
#>   int prior_only;  // should the likelihood be ignored?
#> }
```

The walk-through: `make_stancode()` returns the Stan program brms would compile, and we print its data block. That block is Stan code, written for you, from a one-line formula. The interpretation: brms is not a different method from Stan, it is a code generator that writes Stan for you, which is why anything brms fits, Stan can fit too.

**Try it:** Get the 95% confidence interval for the slope from the `lm()` fit with `confint()`, so you have a frequentist interval to compare against a Bayesian one later.

```r title="Your turn: confidence interval for the slope"
# Use confint() on fit_lm and pull out the row named "x".
# Expected: a lower and upper bound bracketing 0.5.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Slope confidence interval solution"
ex_ci <- confint(fit_lm)["x", ]
round(ex_ci, 3)
#>  2.5 % 97.5 % 
#>  0.382  0.577
```

**Explanation:** The frequentist interval runs from 0.38 to 0.58. A Bayesian credible interval from any of the three packages will land in a similar place for this simple model, but it carries a direct probability reading: the slope is 95% likely to be inside it.

</details>

## What sampler runs under the hood, and why does it matter?

When the posterior is too complex for a grid, the packages approximate it by drawing thousands of samples from it. This is Markov chain Monte Carlo, or MCMC. The two big families of sampler explain most of the practical differences between the packages.

JAGS uses **Gibbs sampling**. It updates one parameter at a time, drawing each from its distribution given the current values of all the others. It is simple and needs no gradients, but it can get stuck taking tiny steps when parameters are correlated. Stan and brms use **Hamiltonian Monte Carlo**, or HMC, with a variant called the No-U-Turn Sampler. HMC uses the gradient of the posterior to propose long, informed jumps, so it explores correlated, high-dimensional models far more efficiently.

To make MCMC concrete, let's build the simplest sampler by hand, a random-walk Metropolis sampler, for the slope of our regression. We hold the intercept and noise at their least-squares values and let the slope wander. At each step we propose a small move, then accept it with a probability set by how much better or worse it makes the posterior.

$$\alpha = \min\left(1, \; \frac{p(\theta' \mid y)}{p(\theta \mid y)}\right)$$

Where $\theta'$ is the proposed value and $\theta$ is the current value. If the proposal is better the ratio exceeds 1 and we always accept; if it is worse we accept it only sometimes. If you are not interested in the mechanics, skip to the output, the numbers are all you need.

```r title="A Metropolis sampler for the slope"
a_hat <- coef(fit_lm)[["(Intercept)"]]   # hold intercept at its lm value
s_hat <- summary(fit_lm)$sigma           # hold noise at its lm value

# log posterior for the slope b: log-likelihood + log-prior Normal(0, 1)
logpost <- function(b) sum(dnorm(d$y, a_hat + b * d$x, s_hat, log = TRUE)) +
                       dnorm(b, 0, 1, log = TRUE)

set.seed(202)
n_iter <- 8000
draws_all <- numeric(n_iter)
b_cur <- 0
lp_cur <- logpost(b_cur)
accept <- 0
for (t in 1:n_iter) {
  b_prop  <- b_cur + rnorm(1, 0, 0.05)     # propose a small move
  lp_prop <- logpost(b_prop)
  if (log(runif(1)) < lp_prop - lp_cur) {  # accept with Metropolis probability
    b_cur <- b_prop; lp_cur <- lp_prop; accept <- accept + 1
  }
  draws_all[t] <- b_cur
}
draws <- draws_all[-(1:1000)]              # discard the first 1000 as warmup
round(c(post_mean = mean(draws), accept_rate = accept / n_iter), 3)
#>   post_mean accept_rate 
#>       0.479       0.469
```

The walk-through: we started the slope at 0, proposed a nudge each iteration, and kept or rejected it based on the posterior ratio. After discarding warmup, the retained samples are draws from the posterior of the slope. The interpretation: the posterior mean is 0.479, matching both the true 0.5 and the least-squares estimate, and about 47% of proposals were accepted. This hand-rolled loop is exactly the kind of work JAGS, Stan, and brms automate for you, only far more efficiently.

A picture helps. Plotting the chain over time shows it wandering around the posterior rather than drifting, which is the sign of a healthy sampler.

```r title="Trace plot of the chain"
plot(draws, type = "l", col = "steelblue",
     xlab = "iteration", ylab = "slope", main = "Metropolis chain for the slope")
```

Not all samples are worth the same. Because each draw is close to the one before it, the chain carries less information than its raw count suggests. The effective sample size measures how many truly independent draws you effectively have.

```r title="Effective sample size of the chain"
acf_vals <- acf(draws, plot = FALSE, lag.max = 50)$acf[-1]  # autocorrelations
ess <- length(draws) / (1 + 2 * sum(acf_vals[acf_vals > 0]))
round(c(n_draws = length(draws), effective = ess))
#>   n_draws effective 
#>      7000      1319
```

The interpretation: 7000 raw draws are worth only about 1319 independent ones here, because a plain random walk takes small, correlated steps. This is precisely the weakness HMC fixes: by using gradients to take long, decorrelated steps, Stan and brms turn the same wall-clock time into many more effective samples, especially as models grow.

[WARNING]
**A large raw sample count can hide very few effective samples.** If your chains are strongly autocorrelated, thousands of iterations may give you only a few hundred useful draws. Always check the effective sample size, and prefer HMC when a Gibbs sampler mixes slowly.

**Try it:** Rerun the sampler with a larger proposal standard deviation of 0.20 instead of 0.05, and report the acceptance rate. Reuse the `logpost` function from above.

```r title="Your turn: a bolder proposal"
# Copy the loop, change rnorm(1, 0, 0.05) to rnorm(1, 0, 0.20),
# use set.seed(303), and report accept_count / n_iter.
# Expected: acceptance drops well below the 0.47 we saw.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bolder proposal solution"
set.seed(303)
ex_draws <- numeric(4000); ex_b <- 0; ex_lp <- logpost(0); ex_acc <- 0
for (t in 1:4000) {
  ex_p <- ex_b + rnorm(1, 0, 0.20); ex_lpp <- logpost(ex_p)
  if (log(runif(1)) < ex_lpp - ex_lp) { ex_b <- ex_p; ex_lp <- ex_lpp; ex_acc <- ex_acc + 1 }
  ex_draws[t] <- ex_b
}
round(ex_acc / 4000, 3)
#> [1] 0.138
```

**Explanation:** Bigger jumps overshoot the posterior more often, so only 14% are accepted. Tuning this step size by hand is fiddly, which is another reason HMC and its auto-tuning are so valuable.

</details>

## Which package should you use, and how do they compare?

Now that you know what the three packages do and how they sample, the choice comes down to your model and your priorities. Here is the practical comparison.

| Dimension | brms | Stan (rstan) | JAGS (rjags) |
|---|---|---|---|
| How you specify a model | lme4-style formula | Stan program | BUGS model |
| Sampler | HMC / NUTS | HMC / NUTS | Gibbs + others |
| Learning curve | Gentle for R users | Steep | Moderate |
| Discrete parameters | No | No | Yes |
| Speed on hard models | Fast | Fast | Slower |
| What you install | A C++ toolchain | A C++ toolchain | The JAGS program |

Two rows deserve a note. First, both brms and Stan need a C++ compiler because Stan translates your model to C++ and compiles it, which adds a one-time build step per model. JAGS ships as its own program that R talks to, so there is nothing to compile. Second, only JAGS can sample discrete unknowns directly, such as a hidden class label, because HMC needs a continuous, differentiable surface to compute gradients on.

The decision usually follows a short path.

![A decision path for choosing a Bayesian package in R.](screenshots/brms-vs-Stan-vs-JAGS-in-R-decision-flow.webp)
*Figure 2: A quick decision path for picking the right Bayesian package.*

- **Reach for brms** when your model is a regression, a generalised linear model, or a multilevel model, which covers the large majority of applied work, and you get Stan's speed without writing Stan.
- **Drop down to Stan** when the formula interface cannot express your model, for example a custom likelihood or an unusual parameter constraint, or when you want maximum control and speed.
- **Choose JAGS** when your model has discrete latent parameters, or when you are working from existing BUGS or JAGS code and translating it would cost more than it is worth.

Whatever you pick, the output is the same shape: a set of posterior draws that you summarise the same way. Here is the 95% credible interval for our slope, straight from the Metropolis draws.

```r title="Credible interval from posterior draws"
round(quantile(draws, c(0.025, 0.5, 0.975)), 3)
#>  2.5%   50% 97.5% 
#> 0.436 0.479 0.525
```

The interpretation: given the data and prior, there is a 95% probability the slope lies between 0.44 and 0.53. brms, Stan, and JAGS would each hand you draws you summarise with this very line. The package decides how you write and run the model; it does not change how you read the answer.

[TIP]
**Start with brms and only drop to Stan when you must.** Most applied models are regressions that brms expresses in one formula, so you get HMC speed with almost no code. Move to writing raw Stan only when your model genuinely outgrows the formula interface.

**Try it:** From the same `draws`, compute the posterior probability that the slope is greater than 0.5.

```r title="Your turn: a posterior probability"
# The draws are samples from the posterior, so a probability is just a proportion.
# Compute the fraction of draws that exceed 0.5.
# Expected: a value well under 0.5, since the posterior centres near 0.48.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Posterior probability solution"
round(mean(draws > 0.5), 3)
#> [1] 0.174
```

**Explanation:** About 17% of the posterior mass sits above 0.5. Turning a question into a probability by counting draws is one of the everyday joys of Bayesian work, and it looks identical no matter which package produced the draws.

</details>

## FAQ

**Do I need to install anything special to use them?** brms and Stan both need a C++ toolchain, called Rtools on Windows, because Stan compiles each model. JAGS is a separate program you install first, and then the rjags package talks to it. brms is usually the smoothest to set up on a fresh machine because a single package install pulls in what it needs.

**Is brms just Stan underneath?** Yes. brms translates your formula into a Stan program and hands it to Stan to fit, as the generated-code example above showed. Anything brms can fit, Stan can fit, but not the other way around, because raw Stan can express models no formula can.

**Can JAGS do everything Stan can?** Not quite. JAGS can sample discrete unknown parameters that Stan cannot, which is a real advantage for some mixture and hidden-state models. But JAGS mixes more slowly on large, correlated models, where Stan's gradient-based sampler pulls ahead.

**Which one is fastest?** For most non-trivial models, Stan and brms are faster in effective samples per second because HMC explores the posterior more efficiently. JAGS can be competitive on small models with conjugate structure where Gibbs steps are cheap.

**Do I have to learn the Stan language to use brms?** No. You can go a long way with brms writing only R formulas. Learning to read Stan helps you understand and debug what brms generates, but it is not required to get results.

**What about rstanarm, PyMC, or NIMBLE?** rstanarm is a sibling of brms with pre-compiled models for common regressions, so it skips the compile step but supports fewer model types. PyMC is the popular Python equivalent of this space, and NIMBLE is a BUGS-compatible R package that compiles its samplers for extra speed. They are worth knowing, but brms, Stan, and JAGS remain the most common starting points in R.

## Practice Exercises

These two problems reuse the ideas above. Both run in your browser with base R.

### Exercise 1: Posterior for a proportion

You ran a small test and observed 18 successes out of 25 trials. Using a uniform prior on the success probability, grid-approximate the posterior mean and 95% credible interval. Use `dbinom()` for the likelihood over a grid of probabilities from 0 to 1.

```r title="Exercise 1 starter"
# Build p_grid from 0 to 1, a flat prior, and a dbinom(18, 25, p_grid) likelihood.
# Normalise the posterior, then report its mean and 2.5% / 97.5% points.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
p_grid <- seq(0, 1, length.out = 2000)
p_prior <- rep(1, length(p_grid))                 # flat Uniform(0, 1) prior
p_lik <- dbinom(18, size = 25, prob = p_grid)     # likelihood
p_post <- p_prior * p_lik
p_post <- p_post / sum(p_post)
p_cdf <- cumsum(p_post)
round(c(mean = sum(p_grid * p_post),
        lower = p_grid[which.min(abs(p_cdf - 0.025))],
        upper = p_grid[which.min(abs(p_cdf - 0.975))]), 3)
#>  mean lower upper 
#> 0.704 0.522 0.856
```

**Explanation:** The posterior mean of 0.70 is close to the raw rate 18/25 = 0.72, pulled slightly toward 0.5 by the prior, and the wide interval reflects how little 25 trials tell you. This is the same grid recipe from the first section, applied to a proportion instead of a mean.

</details>

### Exercise 2: Sample an unknown mean

Return to the 12 reaction times in `y`. Write a Metropolis sampler for the unknown mean, using a known noise standard deviation of 0.25 and a Normal(2, 0.5) prior, then report the posterior mean and 95% credible interval. Compare your answer to the grid result from the first section.

```r title="Exercise 2 starter"
# Write a log-posterior lp_mu(mu) = sum(dnorm(y, mu, 0.25, log = TRUE)) + dnorm(mu, 2, 0.5, log = TRUE).
# Run a Metropolis loop over mu with set.seed(404), discard warmup,
# then report mean and quantile(., c(0.025, 0.975)).
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(404)
lp_mu <- function(mu) sum(dnorm(y, mu, 0.25, log = TRUE)) + dnorm(mu, 2, 0.5, log = TRUE)
m_draws <- numeric(6000); m_cur <- 2; m_lp <- lp_mu(2)
for (t in 1:6000) {
  m_prop <- m_cur + rnorm(1, 0, 0.05); m_lpp <- lp_mu(m_prop)
  if (log(runif(1)) < m_lpp - m_lp) { m_cur <- m_prop; m_lp <- m_lpp }
  m_draws[t] <- m_cur
}
m_draws <- m_draws[-(1:1000)]
round(c(post_mean = mean(m_draws),
        lower = quantile(m_draws, 0.025),
        upper = quantile(m_draws, 0.975)), 3)
#>   post_mean  lower.2.5% upper.97.5% 
#>       2.097       1.958       2.232
```

**Explanation:** The sampler lands on a posterior mean of 2.10 with a 95% interval of 1.96 to 2.23, matching the grid answer from the first section almost exactly. Two different methods, one posterior, which is the whole point: the tool is a means to the same end.

</details>

## Summary

The three packages are front ends to the same idea. Pick based on how you want to write the model and what it needs to do.

| Package | Write a model as | Best when |
|---|---|---|
| brms | A one-line R formula | Regression, GLM, or multilevel work (most cases) |
| Stan | A Stan program | Custom likelihoods, unusual constraints, top speed |
| JAGS | A BUGS model | Discrete latent parameters or legacy BUGS code |

The one-line rule of thumb: default to brms, drop to Stan when the formula cannot express your model, and reach for JAGS when you need discrete parameters or already have BUGS code. Whichever you choose, you read the result the same way, as posterior draws you summarise into means, intervals, and probabilities.

## References

1. Burkner, P. (2017). *brms: An R Package for Bayesian Multilevel Models Using Stan.* Journal of Statistical Software. [Link](https://cran.r-project.org/web/packages/brms/vignettes/brms_overview.pdf) The canonical brms paper: what the formula interface can express and how it becomes Stan code.
2. brms package documentation on CRAN. [Link](https://cran.r-project.org/web/packages/brms/index.html) The CRAN reference for brms functions, including the `make_stancode` call used above.
3. Stan Development Team. *Stan Reference Manual.* [Link](https://mc-stan.org/docs/reference-manual/) The definitive guide to the Stan language and its HMC sampler.
4. Plummer, M. *JAGS: Just Another Gibbs Sampler.* Project page. [Link](https://mcmc-jags.sourceforge.io/) The JAGS project home: downloads and the BUGS modelling syntax.
5. rjags package documentation on CRAN. [Link](https://cran.r-project.org/web/packages/rjags/index.html) How to drive JAGS from R with the `rjags` calls shown above.
6. Ponisio, L. et al. (2021). *JAGS, NIMBLE, Stan: a detailed comparison among Bayesian MCMC software.* arXiv. [Link](https://arxiv.org/abs/2107.09357) A head-to-head benchmark if you want numbers behind the speed comparison.
7. Kurz, A. S. *Doing Bayesian Data Analysis in brms and the tidyverse.* [Link](https://bookdown.org/ajkurz/DBDA_recoded/) A full course that fits real models in brms, a good next step after this page.
8. Jumping Rivers. *Should I learn Stan?* [Link](https://www.jumpingrivers.com/blog/why-stan/) A short take on when dropping from brms to raw Stan is worth it.

## Continue Learning

- [brms in R](brms-in-R.html): the parent tutorial, fitting Bayesian regressions with the formula interface end to end.
- [Stan in R](Stan-in-R.html): write and fit your first Stan model when brms is not enough.
- [MCMC in R](MCMC-in-R.html): build a Metropolis-Hastings sampler from scratch to understand what these engines automate.
- [MCMC Diagnostics in R](MCMC-Diagnostics-in-R.html): the four checks that tell you whether your chains have converged.
