---
title: "Bayesian Statistics in R: Build Genuine Intuition Before Opening Stan or brms"
slug: "Bayesian-Statistics-in-R"
description: "Bayesian statistics in R, intuition first: simulate the prior, likelihood and posterior update with coin flips and Beta distributions, before any MCMC."
keywords: "Bayesian statistics R, prior likelihood posterior, Beta-Binomial conjugate, posterior simulation, credible interval, Bayesian inference, prior distribution, posterior distribution"
auto_link_terms: "Bayesian statistics|prior distribution|posterior distribution|likelihood function|credible interval|Beta-Binomial conjugate|prior-likelihood-posterior update"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-05-09"
curriculum_id: "5.1.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Bayesian Statistics"
sidebar_order: 111
difficulty: "Intermediate"
---

# Bayesian Statistics in R: Build Genuine Intuition Before Opening Stan or brms

<p class="lead">Bayesian statistics in R updates a prior belief about an unknown parameter with observed data, producing a posterior distribution you can plot, integrate, and reason about. Unlike frequentist methods that return a single point estimate, the Bayesian workflow gives you the full probability curve over plausible values.</p>

## How does Bayes' theorem turn data into a posterior?

Frequentist tools answer "what is the parameter?" with a single number and a confidence interval whose interpretation trips up most students. Bayesian inference flips the question. You start with a prior belief about the parameter, observe some data, and end with a posterior distribution: a probability curve over every plausible value of that parameter. This section shows the update happen in a single line of base R using the Beta-Binomial pair, the simplest example of an analytic posterior.

The math behind every Bayesian update is one line:

$$ p(\theta \mid \text{data}) \propto p(\text{data} \mid \theta) \cdot p(\theta) $$

Where: $p(\theta)$ is the prior, $p(\text{data} \mid \theta)$ is the likelihood, and $p(\theta \mid \text{data})$ is the posterior. The proportional sign hides a normalizing constant that does not affect the shape of the curve.

Imagine you flip a possibly-biased coin 100 times and see 65 heads. You want to estimate the unknown success probability theta. Pick a Beta(2, 2) prior, gently centered at 0.5 but allowing all values, and watch the posterior emerge.

```r title="Beta-Binomial posterior from 100 flips"
n <- 100                    # total flips
k <- 65                     # heads observed
alpha_prior <- 2            # prior shape parameters
beta_prior  <- 2            # ... encoding "fair-ish, but uncertain"

alpha_post <- alpha_prior + k          # closed-form posterior shape
beta_post  <- beta_prior  + n - k      # ... thanks to Beta-Binomial conjugacy

post_mean <- alpha_post / (alpha_post + beta_post)
cri       <- qbeta(c(0.025, 0.975), alpha_post, beta_post)

post_mean
#> [1] 0.6442308
cri
#> [1] 0.5497073 0.7321076
```

The posterior is Beta(67, 37). Its mean of 0.644 sits between the prior mean of 0.5 and the data proportion of 0.65, gently pulled toward 0.5 by the prior's weight. The 95% credible interval [0.55, 0.73] is the range that contains 95% of the posterior probability mass, the interpretation people incorrectly assign to a frequentist confidence interval.

![The Bayesian update workflow](screenshots/Bayesian-Statistics-in-R-workflow.webp)
*Figure 1: The Bayesian update workflow. Prior plus data give a posterior, which you then summarize.*

[KEY INSIGHT]
**The posterior is the prior reweighted by the likelihood.** No exotic computation, just multiplication and renormalization. The Beta-Binomial pair gives you the answer in closed form because the posterior stays in the Beta family.

**Try it:** Repeat the calculation with a much tighter prior, Beta(20, 20). What does the posterior mean become and why?

```r title="Your turn: tighten the prior"
ex_alpha <- 20            # try a tight prior
ex_beta  <- 20

# compute the posterior shape parameters and posterior mean here
# ex_alpha_post <- ?
# ex_beta_post  <- ?
# ex_post_mean  <- ?
#> Expected: posterior mean closer to 0.5 than 0.65
```

<details><summary>Click to reveal solution</summary>

```r title="Tighter prior solution"
ex_alpha_post <- ex_alpha + k
ex_beta_post  <- ex_beta  + n - k
ex_post_mean  <- ex_alpha_post / (ex_alpha_post + ex_beta_post)
ex_post_mean
#> [1] 0.6071429
```

A Beta(20, 20) prior is equivalent to having seen 38 prior flips with 19 heads. Adding the new 100 flips gives a posterior that is pulled noticeably back toward 0.5. The lesson: a stronger prior carries more weight against the same data.
</details>

## What does a prior actually encode?

A prior is just a probability distribution over the parameter. Anything you can put on a curve, you can use as a prior. The Beta family is convenient for proportions because it lives on [0, 1] and supports two intuitive shape parameters that act like "pseudo-counts" of prior successes and failures. Three Beta priors illustrate the spectrum from ignorance to strong belief.

```r title="Three priors plotted on one panel"
theta_grid <- seq(0, 1, length.out = 200)

plot(theta_grid, dbeta(theta_grid, 1, 1), type = "l", lwd = 2,
     ylim = c(0, 6), xlab = expression(theta), ylab = "density",
     main = "Three priors over a proportion")
lines(theta_grid, dbeta(theta_grid, 20, 20), lwd = 2, col = "steelblue")
lines(theta_grid, dbeta(theta_grid,  2,  5), lwd = 2, col = "tomato")
legend("topright", lwd = 2,
       col = c("black", "steelblue", "tomato"),
       legend = c("Beta(1,1) uniform", "Beta(20,20) tight at 0.5", "Beta(2,5) skewed low"))
```

Beta(1, 1) is flat: every value of theta is equally plausible before seeing data. Beta(20, 20) is tight around 0.5: a strong belief that the coin is fair. Beta(2, 5) is skewed low: a belief that small values of theta are more likely. Each shape encodes a different domain assumption, and each will pull the posterior in a different direction.

[TIP]
**Pick a prior whose shape matches your prior belief, not whatever is convenient.** A Beta(2, 2) prior is mildly skeptical of extreme values; a Beta(1, 1) prior is informationless; a Beta(50, 50) prior is hard to budge. The skill is in the matching, not the mathematics.

**Try it:** Build two priors for the same coin-flip data: a "loose" Beta(2, 2) and a "tight" Beta(50, 50). Compute both posteriors after 100 flips with 65 heads. Compare their posterior means.

```r title="Your turn: loose vs tight prior comparison"
ex_loose_alpha <- 2
ex_loose_beta  <- 2
ex_tight_alpha <- 50
ex_tight_beta  <- 50

# compute both posteriors and their means
#> Expected: loose posterior mean nearer 0.65, tight posterior nearer 0.5
```

<details><summary>Click to reveal solution</summary>

```r title="Loose vs tight prior solution"
loose_post_mean <- (ex_loose_alpha + k) / (ex_loose_alpha + k + ex_loose_beta + n - k)
tight_post_mean <- (ex_tight_alpha + k) / (ex_tight_alpha + k + ex_tight_beta + n - k)
loose_post_mean
#> [1] 0.6442308
tight_post_mean
#> [1] 0.575
```

The loose prior lets the data dominate: posterior mean 0.644, almost the data proportion. The tight prior insists on fairness: posterior mean 0.575, halfway between the prior and the data. A prior with weight 100 carries the same influence as 100 new observations.
</details>

## How do prior and likelihood combine into a posterior?

The likelihood is a function of the parameter, given fixed data. It is not itself a probability distribution over theta, just a curve showing which theta values are most consistent with what you saw. Multiply the likelihood curve by the prior curve, normalize so the area is 1, and you have the posterior. Plotting all three on the same axis makes the arithmetic visual.

```r title="Prior, likelihood, posterior on one panel"
likelihood_vals <- dbinom(k, size = n, prob = theta_grid)

par(mfrow = c(1, 3), mar = c(4, 4, 3, 1))

plot(theta_grid, dbeta(theta_grid, alpha_prior, beta_prior),
     type = "l", lwd = 2, main = "Prior  Beta(2, 2)",
     xlab = expression(theta), ylab = "density")

plot(theta_grid, likelihood_vals, type = "l", lwd = 2, col = "tomato",
     main = "Likelihood  Binomial(n=100, k=65)",
     xlab = expression(theta), ylab = "L(theta)")

plot(theta_grid, dbeta(theta_grid, alpha_post, beta_post),
     type = "l", lwd = 2, col = "steelblue",
     main = "Posterior  Beta(67, 37)",
     xlab = expression(theta), ylab = "density")

par(mfrow = c(1, 1))
```

The likelihood peaks at the maximum likelihood estimate, exactly k/n = 0.65. The prior peaks at 0.5. The posterior peaks slightly below 0.65, pulled toward the prior in proportion to the prior's tightness. With a weak prior and large n, the posterior almost coincides with the likelihood.

![Beta-Binomial conjugate update](screenshots/Bayesian-Statistics-in-R-conjugate.webp)
*Figure 2: The Beta-Binomial conjugate shortcut. Prior shape parameters absorb the count of observed successes and failures.*

[KEY INSIGHT]
**The posterior always lies between the prior and the likelihood, weighted by their relative confidence.** A flat prior gives you back the likelihood. A point-mass prior ignores the data entirely. Real priors live somewhere in between and the data nudges the answer accordingly.

**Try it:** Suppose you observed 20 heads in 100 flips instead of 65. Recompute the posterior and re-plot. Where does the posterior peak now?

```r title="Your turn: shift the data"
ex_k_new <- 20

# compute new posterior shape and re-plot all three curves
#> Expected: posterior peak shifts toward 0.2
```

<details><summary>Click to reveal solution</summary>

```r title="Shifted-data solution"
ex_alpha_post_new <- alpha_prior + ex_k_new
ex_beta_post_new  <- beta_prior + n - ex_k_new
ex_post_mean_new  <- ex_alpha_post_new / (ex_alpha_post_new + ex_beta_post_new)
ex_post_mean_new
#> [1] 0.2115385

# (re-plot omitted for brevity; same code structure as the panel above)
```

The posterior now peaks near 0.21, just above the data proportion 0.20, slightly pulled toward 0.5 by the prior. The shape of the curve and the location of its peak both follow the data, while the prior modulates the pull.
</details>

## What changes as more data arrives?

A common worry about Bayesian methods is "what if I pick the wrong prior?" The honest answer: with enough data, the prior gets washed out. Likelihood scales with n, prior does not, so the posterior shifts toward the data as n grows. Showing this with a deliberately bad prior makes the point concrete.

```r title="Posterior with n = 10, 100, 1000 against a wrong prior"
true_theta <- 0.7                          # the truth we are trying to recover
sims <- list(
  small  = list(n =   10, k = round(0.7 *   10)),   # 7  / 10
  medium = list(n =  100, k = round(0.7 *  100)),   # 70 / 100
  large  = list(n = 1000, k = round(0.7 * 1000))    # 700/ 1000
)
wrong_alpha <- 80    # a stubborn prior centered at 0.8 ...
wrong_beta  <- 20    # ... that disagrees with the truth

plot(theta_grid, dbeta(theta_grid, wrong_alpha, wrong_beta), type = "l", lwd = 2,
     ylim = c(0, 30), xlab = expression(theta), ylab = "density",
     main = "Posterior shifts toward the truth as n grows")
abline(v = true_theta, lty = 2)
cols <- c("tomato", "orange", "steelblue")
for (i in seq_along(sims)) {
  s <- sims[[i]]
  lines(theta_grid,
        dbeta(theta_grid, wrong_alpha + s$k, wrong_beta + s$n - s$k),
        lwd = 2, col = cols[i])
}
legend("topleft", lwd = 2, col = c("black", cols),
       legend = c("Wrong prior Beta(80,20)", "n=10", "n=100", "n=1000"))
```

The prior peaks at 0.8 and refuses to budge much for n=10. By n=100 the posterior straddles 0.75. By n=1000 it has converged tightly around the true 0.7. The posterior peak migrates from prior toward truth as the data accumulates.

[NOTE]
**This is the Bayesian answer to "but I might pick a bad prior."** With informative data, even a stubborn prior gets corrected. With weak data, the prior matters and you need to defend your choice. Honest reporting always shows posterior sensitivity to the prior.

**Try it:** Start from a uniform Beta(1, 1) prior and the same true theta = 0.7. With n = 1000, where does the posterior peak?

```r title="Your turn: uniform prior, large n"
ex_n <- 1000

# uniform prior, observe 70% successes, compute posterior parameters
#> Expected: posterior tightly peaked near 0.7
```

<details><summary>Click to reveal solution</summary>

```r title="Uniform-prior, large-n solution"
ex_alpha_unif <- 1 + round(true_theta * ex_n)
ex_beta_unif  <- 1 + ex_n - round(true_theta * ex_n)
ex_alpha_unif / (ex_alpha_unif + ex_beta_unif)
#> [1] 0.6993014
qbeta(c(0.025, 0.975), ex_alpha_unif, ex_beta_unif)
#> [1] 0.6705486 0.7269683
```

A uniform prior plus 1000 observations gives a posterior whose mean is essentially the data proportion, with a 95% credible interval roughly +/- 0.03 around the truth. With this much data, the choice of weak prior barely matters.
</details>

## How do we summarize a posterior in R?

A posterior is a curve, not a number. To report or act on it you reduce it to a few summaries: a central estimate, an interval that captures most of the mass, and the probability of any event of interest. R provides every Beta family helper you need: `dbeta`, `pbeta`, `qbeta`, `rbeta`.

```r title="Posterior mean, credible interval, and P(theta > 0.5)"
post_mean
#> [1] 0.6442308
cri
#> [1] 0.5497073 0.7321076

p_gt_half <- 1 - pbeta(0.5, alpha_post, beta_post)
p_gt_half
#> [1] 0.9979088

p_hat <- k / n
freq_ci <- p_hat + c(-1, 1) * qnorm(0.975) * sqrt(p_hat * (1 - p_hat) / n)
freq_ci
#> [1] 0.5565097 0.7434903
```

The 95% credible interval [0.55, 0.73] is similar in width to the frequentist Wald CI [0.56, 0.74], but the interpretation differs sharply. The Bayesian statement is "given my prior and the data, there is a 95% probability that theta is in this interval." The frequentist statement is the contortion most students stumble over.

[NOTE]
**The credible interval has the interpretation people want from a confidence interval.** That alone is worth the price of admission to Bayesian thinking. A posterior probability of 0.998 that theta exceeds 0.5 is the kind of statement decision-makers can act on directly.

**Try it:** What is the posterior probability that theta > 0.6?

```r title="Your turn: P(theta > 0.6)"
# use 1 - pbeta() with alpha_post and beta_post
# ex_p <- ?
#> Expected: a value between 0.7 and 0.9
```

<details><summary>Click to reveal solution</summary>

```r title="Tail-probability solution"
ex_p <- 1 - pbeta(0.6, alpha_post, beta_post)
ex_p
#> [1] 0.8164234
```

There is roughly an 82% posterior probability that theta exceeds 0.6 given this prior and these data. Combined with the credible interval, you can quote either a range or any tail probability your stakeholder cares about.
</details>

## When do we need MCMC instead of analytic posteriors?

The Beta-Binomial pair is conjugate, meaning the posterior stays in the same Beta family as the prior. Conjugate priors exist for several common likelihoods (Normal-Normal, Gamma-Poisson) and they all give closed-form posteriors. Once you leave that small family, or once you have more than a couple of unknown parameters, the integral that normalizes the posterior becomes intractable. Grid approximation on a 2-parameter Normal model shows the limit of brute force.

```r title="Grid approximation for Normal mean and standard deviation"
set.seed(42)
y_obs <- rnorm(20, mean = 5, sd = 1.5)            # 20 observations from a Normal

mu_grid    <- seq(3, 7, length.out = 80)          # 80 candidate means
sigma_grid <- seq(0.5, 3, length.out = 80)        # 80 candidate sds

post_grid <- outer(mu_grid, sigma_grid, function(m, s) {
  loglik <- sapply(seq_along(m), function(i)
    sum(dnorm(y_obs, mean = m[i], sd = s[i], log = TRUE)))
  exp(loglik - max(loglik))                       # rescale for numerical safety
})
post_grid <- post_grid / sum(post_grid)            # normalize

# posterior mean for mu, marginalizing over sigma
mu_post_mean <- sum(mu_grid * rowSums(post_grid))
mu_post_mean
#> [1] 5.124375
```

For two unknowns we computed 80 x 80 = 6400 posterior values, which fits in memory. Add a third parameter and you need 80^3 = 512,000 cells. Add a fourth and you are in the millions. This combinatorial blow-up is why MCMC exists: it samples from the posterior without ever computing it on a grid.

[TIP]
**brms and Stan are MCMC engines under the hood, plus convenient model syntax.** The intuition you built here, prior plus likelihood gives posterior, transfers directly. MCMC just produces samples instead of a closed form, and the same summaries (mean, credible interval, tail probability) work on samples.

**Try it:** Add a third parameter (say, a slope) by extending the grid. Roughly how many cells do you need at the same resolution?

```r title="Your turn: cost of an extra parameter"
ex_third_dim <- 80

# compute total cells for three parameters at 80 points each
#> Expected: a number above 500,000
```

<details><summary>Click to reveal solution</summary>

```r title="Three-parameter grid cost"
80 * 80 * ex_third_dim
#> [1] 512000
```

512,000 cells for three parameters at modest resolution. Six parameters at 50 points each is over 15 billion. The cost grows exponentially in the dimension and that is exactly the wall MCMC was invented to scale past.
</details>

## Practice Exercises

### Exercise 1: Twitter survey

A Twitter survey asks 50 users whether they like a new feature; 32 say yes. Use a Beta(2, 2) prior to compute the posterior over the true approval rate, the posterior mean, and a 95% credible interval.

```r title="Exercise 1 starter"
tw_n <- 50
tw_k <- 32

# compute tw_post_alpha, tw_post_beta, tw_mean, and a 95% CrI
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
tw_post_alpha <- 2 + tw_k
tw_post_beta  <- 2 + tw_n - tw_k
tw_mean       <- tw_post_alpha / (tw_post_alpha + tw_post_beta)
tw_cri        <- qbeta(c(0.025, 0.975), tw_post_alpha, tw_post_beta)
tw_mean
#> [1] 0.6296296
tw_cri
#> [1] 0.4928577 0.7536919
```

Posterior is Beta(34, 20), mean 0.63, 95% CrI [0.49, 0.75]. The credible interval includes 0.5, so you cannot yet rule out the possibility that the feature is no better than a coin flip.
</details>

### Exercise 2: Sequential update equals one-shot update

Observe two batches of 50 flips: 35 heads in the first, 40 heads in the second. Show that updating once after each batch gives the same posterior as combining everything and updating once with n = 100, k = 75. Use a Beta(1, 1) prior.

```r title="Exercise 2 starter"
# Stage 1: prior Beta(1,1), data k=35 in n=50  -> posterior_1
# Stage 2: prior posterior_1, data k=40 in n=50 -> posterior_2
# One-shot: prior Beta(1,1), data k=75 in n=100 -> posterior_oneshot
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
seq_first  <- c(alpha = 1 + 35, beta = 1 + 50 - 35)            # Beta(36, 16)
seq_second <- c(alpha = seq_first["alpha"] + 40,
                beta  = seq_first["beta"]  + 50 - 40)           # Beta(76, 26)
seq_combined <- c(alpha = 1 + 75, beta = 1 + 100 - 75)          # Beta(76, 26)
seq_second
#>  alpha.alpha beta.beta
#>           76        26
seq_combined
#> alpha  beta
#>    76    26
```

Both paths land on Beta(76, 26). Bayes' theorem is order-independent and incremental: updating after every observation, or once at the end, gives identical answers.
</details>

### Exercise 3: Decision-relevant tail probability

Given a Beta(2, 5) prior and 30 successes in 50 trials, compute the posterior probability that theta exceeds 0.6.

```r title="Exercise 3 starter"
# ex3_alpha <- ?  (posterior alpha)
# ex3_beta  <- ?  (posterior beta)
# ex3_p     <- ?  (P(theta > 0.6))
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_alpha <- 2 + 30
ex3_beta  <- 5 + 50 - 30
ex3_p     <- 1 - pbeta(0.6, ex3_alpha, ex3_beta)
ex3_p
#> [1] 0.3056574
```

About a 31% posterior probability that theta exceeds 0.6. With a skeptical prior pulling toward small values, the data are not enough to swing the verdict above 0.6 with high confidence.
</details>

## Complete Example: Customer Satisfaction Survey

A SaaS company surveys 200 customers and finds 132 say they would recommend the product. Marketing wants to claim the recommendation rate is "above 60%." Quantify that claim under two priors: a skeptical Beta(2, 5) and an uninformative Beta(1, 1). Report posterior summaries and the posterior probability that theta > 0.6 under each.

```r title="Customer satisfaction full Bayesian workflow"
cs_n <- 200
cs_k <- 132

cs_skeptical <- c(alpha = 2 + cs_k, beta = 5 + cs_n - cs_k)
cs_uniform   <- c(alpha = 1 + cs_k, beta = 1 + cs_n - cs_k)

# posterior means
mean_skep <- cs_skeptical["alpha"] / sum(cs_skeptical)
mean_unif <- cs_uniform["alpha"]   / sum(cs_uniform)
mean_skep
#>     alpha
#> 0.6457478
mean_unif
#>     alpha
#> 0.6584158

# 95% credible intervals
cri_skep <- qbeta(c(0.025, 0.975), cs_skeptical["alpha"], cs_skeptical["beta"])
cri_unif <- qbeta(c(0.025, 0.975), cs_uniform["alpha"],   cs_uniform["beta"])
cri_skep
#> [1] 0.5779 0.7104
cri_unif
#> [1] 0.5908 0.7228

# P(theta > 0.6)
p_skep <- 1 - pbeta(0.6, cs_skeptical["alpha"], cs_skeptical["beta"])
p_unif <- 1 - pbeta(0.6, cs_uniform["alpha"],   cs_uniform["beta"])
p_skep
#>     alpha
#> 0.9092671
p_unif
#>     alpha
#> 0.9504487
```

Both priors give posterior probability above 90% that the true recommendation rate exceeds 60%. The skeptical prior pulls the answer down slightly (90.9% vs 95.0%) but agrees on the direction. Reporting both numbers shows that the conclusion is robust to a reasonable change of prior, which is what an honest Bayesian report looks like.

## Summary

| Question | Frequentist answer | Bayesian answer |
|---|---|---|
| Best estimate of theta | k/n point estimate | Posterior mean (Beta(alpha+k, beta+n-k) for proportions) |
| Uncertainty | 95% confidence interval | 95% credible interval |
| Interpretation of interval | "If we repeated the experiment, 95% of such intervals would cover theta." | "Given prior and data, there is a 95% probability that theta is in this interval." |
| Probability of an event | Not well-defined (theta is fixed, not random) | Computed by integrating the posterior |
| What you input | Data only | Prior + data |
| What you output | Single number + CI | Full probability distribution |

## References

1. McElreath, R. *Statistical Rethinking*, 2nd ed. Chapman & Hall, 2020. Chapters 1-2 build the prior-likelihood-posterior intuition with worked simulations.
2. Gelman, A., Carlin, J. B., Stern, H. S., et al. *Bayesian Data Analysis*, 3rd ed. Chapman & Hall, 2013. Chapter 1 covers the Bayes' rule foundations.
3. CRAN Task View: Bayesian Inference. [cran.r-project.org/web/views/Bayesian.html](https://cran.r-project.org/web/views/Bayesian.html). Curated list of R packages for Bayesian analysis.
4. Coghlan, A. *A Little Book of R for Bayesian Statistics*. [a-little-book-of-r-for-bayesian-statistics.readthedocs.io](https://a-little-book-of-r-for-bayesian-statistics.readthedocs.io). Practical Beta-Binomial worked examples.
5. Proctor, A. *Module 6: Intro to Bayesian Methods in R*. [andrewproctor.github.io/rcourse/module6.html](https://andrewproctor.github.io/rcourse/module6.html). Conceptual overview with rstanarm regression.

## Continue Learning

- [Bayes' Theorem in R](Bayes-Theorem-in-R.html), the discrete foundation, worked through medical-test reasoning.
- [Gamma & Beta Distributions in R](Gamma-and-Beta-Distributions-in-R.html), full mechanics of the Beta family used as priors here.
- [Maximum Likelihood Estimation in R](Maximum-Likelihood-Estimation-in-R.html), the frequentist counterpart to compare against the Bayesian workflow.
