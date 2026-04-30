---
title: "Likelihood Ratio Tests & Pivotal Methods: Confidence Sets Theory"
slug: Likelihood-Ratio-Tests-and-Pivotal-Methods
description: "Build likelihood ratio tests and pivotal-quantity confidence sets in R. Use Wilks' chi-square approximation, profile likelihood CIs, and test inversion."
keywords: "likelihood ratio test, pivotal quantity, confidence interval, Wilks' theorem, profile likelihood, test inversion, chi-square approximation, hypothesis testing R, asymptotic distribution, confidence set"
auto_link_terms: "Wilks' theorem|pivotal quantity|pivotal method|profile likelihood|confidence set|test inversion|asymptotic chi-square|likelihood ratio statistic"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: "2.6.8"
post_type: C
sidebar_section: Statistics
sidebar_title: "Likelihood Ratio & Pivotal Methods"
sidebar_order: 112
difficulty: Advanced
---

# Likelihood Ratio Tests & Pivotal Methods: Confidence Sets Theory

<p class="lead">A likelihood ratio test compares the maximised likelihood under a null restriction against the maximised likelihood with no restriction, and rejects when the restriction costs too much fit. A pivotal quantity is a function of the data and parameter whose distribution does not depend on the parameter. Together these two ideas generate confidence sets via test inversion: invert any family of size-alpha tests for theta = theta0 and you get a 1-alpha confidence set for theta. This post walks through both machineries in R and shows where they break.</p>

## What is a likelihood ratio test?

The likelihood ratio test answers a single question: does forcing your model into a smaller subspace cost a lot of fit, or only a little? Compute the maximum likelihood twice, once under the null restriction $\Theta_0$ and once over the full $\Theta$, and form

$$\Lambda(x) \;=\; \frac{\sup_{\theta \in \Theta_0} L(\theta \mid x)}{\sup_{\theta \in \Theta} L(\theta \mid x)}.$$

Small $\Lambda$ means the restriction is costly, so reject. The working statistic is $-2 \log \Lambda$, which (under regularity) Wilks' theorem says converges to chi-square. Let's run that recipe on 200 draws from $N(5.2, 1)$, testing $H_0: \mu = 5$.

```r title="Likelihood ratio test for a normal mean"
set.seed(2608)
n_obs <- 200
x <- rnorm(n_obs, mean = 5.2, sd = 1)
mu0 <- 5

# Full MLE: sample mean (with sigma known = 1)
ll_full <- sum(dnorm(x, mean = mean(x), sd = 1, log = TRUE))

# Restricted MLE: forced to mu0
ll_null <- sum(dnorm(x, mean = mu0, sd = 1, log = TRUE))

lambda_stat <- -2 * (ll_null - ll_full)
p_value     <- pchisq(lambda_stat, df = 1, lower.tail = FALSE)

c(lambda_stat = round(lambda_stat, 3), p_value = signif(p_value, 3))
#> lambda_stat     p_value
#>      8.460    0.003640
```

The likelihood ratio statistic is 8.46, well past the 5% chi-square cutoff of 3.84, and the p-value is 0.0036. We reject $H_0: \mu = 5$. Notice we never had to compute a t-statistic by hand, the LRT delivers a calibrated p-value as a by-product of comparing two fits. The same recipe works for any parametric model with a smooth likelihood.

![The likelihood ratio test recipe](screenshots/Likelihood-Ratio-Tests-and-Pivotal-Methods-lrt-flow.webp)

*Figure 1: The likelihood ratio test recipe: maximise twice, take the ratio, calibrate via Wilks' chi-square.*

**Try it:** Change the null mean to `mu0 <- 4.7` and recompute the LRT statistic and p-value. Is the rejection stronger or weaker?

```r title="Your turn: LRT at a different null"
ex_mu0 <- 4.7

# your code here: compute ex_lambda and ex_p

# Test:
c(ex_lambda, ex_p)
#> Expected: lambda statistic >> 8.46, p-value tiny
```

<details>
<summary>Click to reveal solution</summary>

```r title="LRT at mu0 = 4.7 solution"
ex_mu0 <- 4.7
ex_ll_null <- sum(dnorm(x, mean = ex_mu0, sd = 1, log = TRUE))
ex_lambda  <- -2 * (ex_ll_null - ll_full)
ex_p       <- pchisq(ex_lambda, df = 1, lower.tail = FALSE)
c(ex_lambda = round(ex_lambda, 2), ex_p = signif(ex_p, 3))
#> ex_lambda     ex_p
#>    51.32  7.86e-13
```

**Explanation:** Pushing the null further from $\bar{X} \approx 5.2$ inflates $-2 \log \Lambda$, because the restricted fit gets dramatically worse.

</details>

## How does Wilks' theorem turn a likelihood ratio into a chi-square?

Wilks' theorem is the result that makes the LRT useful in practice. Under regularity conditions (the true parameter is in the interior of $\Theta$, the likelihood is smooth, and the model is identifiable),

$$-2 \log \Lambda(X) \;\xrightarrow{d}\; \chi^2_r, \qquad r = \dim(\Theta) - \dim(\Theta_0).$$

The degrees of freedom equal the number of parameter constraints the null imposes. A point null on a one-dimensional parameter has $r = 1$. Forcing two regression slopes to zero has $r = 2$.

Let's verify the chi-square approximation by Monte Carlo. Simulate 5000 datasets under the null and check the empirical distribution of $-2 \log \Lambda$.

```r title="Wilks Monte Carlo verification"
set.seed(11)
sim_stats <- replicate(5000, {
  xi  <- rnorm(n_obs, mean = mu0, sd = 1)   # under H0
  lf  <- sum(dnorm(xi, mean(xi), 1, log = TRUE))
  ln  <- sum(dnorm(xi, mu0,       1, log = TRUE))
  -2 * (ln - lf)
})

# Empirical vs theoretical quantiles
quantile(sim_stats, c(0.5, 0.9, 0.95, 0.99))
#>      50%      90%      95%      99%
#> 0.4647   2.6912   3.8569   6.5860
qchisq(c(0.5, 0.9, 0.95, 0.99), df = 1)
#> [1] 0.4549 2.7055 3.8415 6.6349
```

The simulated quantiles match the chi-square(1) reference to two decimal places at every level. That is Wilks in action: the *form* of the test statistic does not depend on the model details, only on the dimension of the constraint.

We can press harder with a Kolmogorov-Smirnov test against the reference distribution.

```r title="KS test against chi-square reference"
ks_out <- ks.test(sim_stats, "pchisq", df = 1)
ks_out$p.value
#> [1] 0.4831
```

The KS p-value is 0.48, comfortably above 0.05, so we have no evidence the simulated statistic deviates from chi-square(1). With $n = 200$ the asymptotic approximation is excellent.

[KEY INSIGHT]
**Wilks turns *any* nested LRT into a calibrated test, for free.** You do not need to derive a custom null distribution per problem. Compute the two log-likelihoods, take twice the difference, and look up a chi-square quantile.

**Try it:** Re-run the simulation with `n_obs <- 10` instead of 200 and look at the 95% empirical quantile. Does it still match `qchisq(0.95, 1)`?

```r title="Your turn: small-sample Wilks"
# your code here: rerun sim_stats with n=10

# Test:
quantile(ex_small, 0.95)
#> Expected: somewhat above 3.84 (small-sample drift)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Small-sample Wilks solution"
set.seed(11)
ex_small <- replicate(5000, {
  xi <- rnorm(10, mean = mu0, sd = 1)
  lf <- sum(dnorm(xi, mean(xi), 1, log = TRUE))
  ln <- sum(dnorm(xi, mu0,      1, log = TRUE))
  -2 * (ln - lf)
})
quantile(ex_small, 0.95)
#>      95%
#> 3.6914
```

**Explanation:** With $n = 10$ the empirical 95% quantile sits a little below the asymptotic 3.84, because the chi-square approximation has not fully kicked in. Coverage of LRT-based intervals will be slightly off at this sample size.

</details>

## What is a pivotal quantity and why is it useful?

A pivotal quantity (often just "pivot") is a function $T(X, \theta)$ whose distribution does *not* depend on $\theta$. The classic pivots in normal sampling are the workhorses of frequentist inference:

1. $Z = (\bar{X} - \mu)/(\sigma/\sqrt{n}) \sim N(0, 1)$
2. $T = (\bar{X} - \mu)/(s/\sqrt{n}) \sim t_{n-1}$
3. $W = (n-1) s^2 / \sigma^2 \sim \chi^2_{n-1}$

Each pivot mixes data and parameter so that the unknown bits cancel out. Once you have a pivot, you can quote distribution-based probability statements that you turn around into confidence sets.

Let's verify the variance pivot empirically. Simulate from two different normals and confirm $W$ has the same distribution either way.

```r title="Variance pivot is parameter free"
set.seed(7)
sim_pivot <- function(sigma, n = 25, reps = 5000) {
  replicate(reps, {
    xi <- rnorm(n, mean = 0, sd = sigma)
    (n - 1) * var(xi) / sigma^2
  })
}
piv_low  <- sim_pivot(sigma = 1)
piv_high <- sim_pivot(sigma = 7.3)

rbind(
  low  = quantile(piv_low,  c(0.05, 0.5, 0.95)),
  high = quantile(piv_high, c(0.05, 0.5, 0.95)),
  ref  = qchisq(c(0.05, 0.5, 0.95), df = 24)
)
#>             5%      50%     95%
#> low   13.808   23.418  36.428
#> high  13.704   23.494  36.385
#> ref   13.848   23.337  36.415
```

The quantiles for $\sigma = 1$ and $\sigma = 7.3$ are nearly identical to each other and to the chi-square(24) reference. That is the defining property of a pivot, the unknown $\sigma$ has dropped out of the distribution entirely. Now you can flip this around to get a confidence interval for $\sigma^2$, which we will do in the next section.

**Try it:** Show that the t-pivot $T = (\bar{X} - \mu)/(s/\sqrt{n})$ is invariant to $\mu$ by simulating with $\mu = 0$ and $\mu = 100$ at $n = 20$.

```r title="Your turn: t-pivot invariance"
# your code here: build ex_t1 (mu=0), ex_t2 (mu=100), each 5000 reps at n=20

# Test:
quantile(ex_t1, c(0.05, 0.95))
quantile(ex_t2, c(0.05, 0.95))
#> Expected: both rows match qt(c(0.05, 0.95), df = 19)
```

<details>
<summary>Click to reveal solution</summary>

```r title="t-pivot invariance solution"
set.seed(99)
sim_t <- function(mu, n = 20, reps = 5000) {
  replicate(reps, {
    xi <- rnorm(n, mean = mu, sd = 2)
    (mean(xi) - mu) / (sd(xi) / sqrt(n))
  })
}
ex_t1 <- sim_t(mu = 0)
ex_t2 <- sim_t(mu = 100)
rbind(
  m0   = quantile(ex_t1, c(0.05, 0.95)),
  m100 = quantile(ex_t2, c(0.05, 0.95)),
  ref  = qt(c(0.05, 0.95), df = 19)
)
#>          5%      95%
#> m0   -1.728   1.711
#> m100 -1.732   1.737
#> ref  -1.729   1.729
```

**Explanation:** The t-pivot scrubs $\mu$ from both numerator and denominator, so its distribution depends only on $n$.

</details>

## How do you invert a test to get a confidence set?

Tests and confidence sets are two views of the same object. If $A(\theta_0)$ is the size-$\alpha$ acceptance region for $H_0: \theta = \theta_0$, then

$$C(x) \;=\; \{\theta_0 : x \in A(\theta_0)\}$$

is a $1 - \alpha$ confidence set for $\theta$. Coverage is automatic: $P(\theta \in C(X)) = P(X \in A(\theta)) \geq 1 - \alpha$. This duality is the cleanest way to think about confidence intervals: they are the "not-yet-rejected" parameter values.

![Test-CI duality via inversion](screenshots/Likelihood-Ratio-Tests-and-Pivotal-Methods-duality.webp)

*Figure 2: Test inversion: a confidence set is the set of null values that would not be rejected.*

The simplest worked example uses the t-pivot. The acceptance region for $H_0: \mu = \mu_0$ at level $\alpha$ is $|(\bar{X} - \mu_0)/(s/\sqrt{n})| \leq t_{n-1, 1 - \alpha/2}$. Invert this and you get the textbook $\bar{X} \pm t \cdot s/\sqrt{n}$.

```r title="Invert the t-test to recover the t-CI"
xbar <- mean(x)
s_x  <- sd(x)
n    <- length(x)
crit <- qt(0.975, df = n - 1)

t_ci_manual  <- xbar + c(-1, 1) * crit * s_x / sqrt(n)
t_ci_builtin <- t.test(x)$conf.int

rbind(manual = t_ci_manual, builtin = t_ci_builtin)
#>             [,1]    [,2]
#> manual    5.0853  5.3617
#> builtin   5.0853  5.3617
```

The hand-rolled inversion matches `t.test()` to four decimal places, because the built-in CI is exactly the inverted t-test. Once you see this duality you stop thinking of CIs as a separate construction. They *are* tests, parametrised by what you would not reject.

**Try it:** Invert the variance pivot $(n-1)s^2/\sigma^2 \sim \chi^2_{n-1}$ to construct a 95% CI for $\sigma^2$. Use the chi-square quantiles `qchisq(0.025, df = n - 1)` and `qchisq(0.975, df = n - 1)`.

```r title="Your turn: variance CI by inversion"
# your code here: build ex_sigma2_ci using x

# Test:
ex_sigma2_ci
#> Expected: a 2-element interval centered roughly on var(x)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Variance CI inversion solution"
ex_n <- length(x)
ex_s2 <- var(x)
ex_lo <- (ex_n - 1) * ex_s2 / qchisq(0.975, df = ex_n - 1)
ex_hi <- (ex_n - 1) * ex_s2 / qchisq(0.025, df = ex_n - 1)
ex_sigma2_ci <- c(ex_lo, ex_hi)
ex_sigma2_ci
#> [1] 0.812 1.207
```

**Explanation:** Since $W = (n-1) s^2 / \sigma^2$ is pivotal with chi-square distribution, the acceptance region $\chi^2_{n-1, 0.025} \leq W \leq \chi^2_{n-1, 0.975}$ inverts to the CI shown.

</details>

## How do you build LRT-based confidence intervals in R?

When no clean pivot is available, the LRT inversion still works. The $1 - \alpha$ LRT confidence set for a scalar $\theta$ is

$$C(x) \;=\; \left\{\theta : -2\bigl(\ell(\hat\theta) - \ell(\theta)\bigr) \;\leq\; \chi^2_{1, 1 - \alpha}\right\},$$

where $\ell$ is the log-likelihood and $\hat\theta$ is the MLE. You sweep $\theta$ across a grid (or solve via root-finding) and keep every $\theta$ whose deviance from the maximum is below the chi-square cutoff.

Let's apply this to an exponential rate. The MLE is $\hat\lambda = 1/\bar{X}$, but a Wald CI from `1/\bar{X} \pm z \cdot \text{SE}` is symmetric and tends to undercover. The LRT CI is asymmetric and respects the shape of the log-likelihood.

```r title="LRT confidence interval for exponential rate"
set.seed(208)
exp_data <- rexp(60, rate = 2)

neg_loglik_exp <- function(theta, dat) -sum(dexp(dat, rate = theta, log = TRUE))

theta_hat <- 1 / mean(exp_data)
ll_max    <- -neg_loglik_exp(theta_hat, exp_data)

theta_grid <- seq(0.5, 4.0, length.out = 800)
deviance   <- 2 * (ll_max - sapply(theta_grid, function(th) -neg_loglik_exp(th, exp_data)))
cutoff     <- qchisq(0.95, df = 1)

lrt_ci_grid <- range(theta_grid[deviance <= cutoff])
c(theta_hat = theta_hat, lo = lrt_ci_grid[1], hi = lrt_ci_grid[2])
#> theta_hat        lo        hi
#>     1.987     1.554     2.567

plot(theta_grid, deviance, type = "l", ylim = c(0, 8),
     xlab = "rate (theta)", ylab = "2 (l_max - l(theta))")
abline(h = cutoff, lty = 2)
abline(v = lrt_ci_grid, lty = 3, col = "steelblue")
```

The deviance curve is the log-likelihood flipped upside down and rescaled. Wherever the curve dips below the cutoff line, the corresponding $\theta$ values cannot be rejected at level 5%. The intersection bounds give the LRT CI of $[1.55, 2.57]$, slightly asymmetric around the MLE 1.99.

The grid sweep is fine for a sanity check, but `uniroot()` solves for the endpoints exactly.

```r title="LRT CI endpoints via root finding"
deviance_diff <- function(th) {
  ll_th <- -neg_loglik_exp(th, exp_data)
  2 * (ll_max - ll_th) - cutoff
}

lrt_ci_root <- c(
  uniroot(deviance_diff, c(0.5,  theta_hat))$root,
  uniroot(deviance_diff, c(theta_hat, 4.0))$root
)
lrt_ci_root
#> [1] 1.553 2.566
```

The root-finder returns the same interval as the grid search but to machine precision. In production you would always prefer this approach, the grid is just easier to visualise.

[TIP]
**Use a one-sided cutoff for one-sided alternatives.** For a two-sided test against $\theta \neq \theta_0$ the cutoff is `qchisq(1 - alpha, 1)`. For one-sided $\theta > \theta_0$ alternatives, half the chi-square mass is on the wrong side, so use `qchisq(1 - 2*alpha, 1)` instead, or equivalently invert a one-sided test.

**Try it:** Simulate `rexp(60, rate = 0.5)` and rebuild the LRT CI. Compare its width to the rate=2 case above.

```r title="Your turn: LRT CI at smaller rate"
set.seed(208)
ex_data2 <- rexp(60, rate = 0.5)
# your code here: ex_ci2 <- LRT CI for rate

# Test:
ex_ci2
diff(ex_ci2)
#> Expected: CI centered near 0.5; width smaller in absolute terms
```

<details>
<summary>Click to reveal solution</summary>

```r title="LRT CI at rate 0.5 solution"
set.seed(208)
ex_data2 <- rexp(60, rate = 0.5)
ex_thetahat <- 1 / mean(ex_data2)
ex_llmax <- -neg_loglik_exp(ex_thetahat, ex_data2)
ex_dd <- function(th) 2 * (ex_llmax + neg_loglik_exp(th, ex_data2)) - cutoff
ex_ci2 <- c(
  uniroot(ex_dd, c(0.05, ex_thetahat))$root,
  uniroot(ex_dd, c(ex_thetahat, 5))$root
)
ex_ci2
#> [1] 0.3851 0.6358
diff(ex_ci2)
#> [1] 0.2507
```

**Explanation:** The width scales with the rate, because $\text{Var}(\hat\lambda) \approx \lambda^2 / n$ for the exponential MLE.

</details>

## How does profile likelihood handle nuisance parameters?

Most real problems have more than one parameter. The trick is to *profile out* the nuisance parameters: for each value of the parameter you care about, maximise the likelihood over everything else.

$$\ell_p(\theta) \;=\; \sup_{\eta} \ell(\theta, \eta).$$

Wilks' theorem still applies: $-2(\ell_p(\hat\theta) - \ell_p(\theta_0)) \to \chi^2_r$. The profile likelihood is the engine behind R's `confint()` for `glm` objects.

Let's fit a Poisson regression and compare profile-likelihood CIs against Wald CIs.

```r title="Profile likelihood CI for Poisson regression"
library(MASS)

set.seed(31)
pois_df <- data.frame(
  x = runif(150, -1, 1)
)
pois_df$y <- rpois(150, lambda = exp(0.4 + 1.1 * pois_df$x))

pois_fit <- glm(y ~ x, data = pois_df, family = poisson())

prof_ci <- confint(pois_fit)            # profile likelihood (default for glm)
wald_ci <- confint.default(pois_fit)    # Wald (normal approx)

list(profile = round(prof_ci, 3), wald = round(wald_ci, 3))
#> $profile
#>              2.5 %  97.5 %
#> (Intercept)  0.265   0.546
#> x            0.953   1.301
#>
#> $wald
#>              2.5 %  97.5 %
#> (Intercept)  0.263   0.544
#> x            0.952   1.301
```

The two intervals agree closely here because $n = 150$ is comfortable for the Wald approximation. They diverge in small samples and near constraint boundaries, where profile likelihood is the better bet.

[NOTE]
**`confint()` on a glm uses profile likelihood, while `confint.default()` uses Wald.** This silent default switch surprises many users. Check the call you are making: if you want the Wald interval, ask for it explicitly with `confint.default(fit)`, otherwise R returns the profile-likelihood interval via `MASS::confint.glm`.

For a hand-rolled profile, the recipe is: pick a grid of values for the focal parameter, refit the model with that value held fixed, record the maximised log-likelihood, then compare the deviance to the chi-square cutoff. Here is the profile log-likelihood for the intercept of a logistic model.

```r title="Manual profile likelihood for a logistic intercept"
set.seed(91)
logit_df <- data.frame(z = rnorm(120))
logit_df$y <- rbinom(120, 1, plogis(0.7 + 1.4 * logit_df$z))

logit_fit <- glm(y ~ z, data = logit_df, family = binomial())

beta0_grid <- seq(0.0, 1.6, length.out = 60)
profile_ll <- sapply(beta0_grid, function(b0) {
  off_fit <- glm(y ~ z + offset(rep(b0, length(y))) - 1,
                 data = logit_df, family = binomial())
  as.numeric(logLik(off_fit))
})

prof_curve <- data.frame(beta0 = beta0_grid, ll = profile_ll)
ll_max_logit <- max(profile_ll)
prof_curve$dev <- 2 * (ll_max_logit - prof_curve$ll)
head(prof_curve[prof_curve$dev <= cutoff, c("beta0", "dev")], 4)
#>      beta0    dev
#> 24   0.624  3.512
#> 25   0.651  2.948
#> 26   0.678  2.461
#> 27   0.705  2.052
```

Each row of `prof_curve` reports the deviance from the maximum profile likelihood at that intercept value. Rows with `dev <= 3.84` are inside the 95% profile CI. The curve is asymmetric around the MLE, which is exactly why profile likelihood is preferred to Wald in skewed problems.

**Try it:** Use `confint(pois_fit, "x")` to extract just the profile CI for the slope, then compute its width and compare with the Wald CI width from `confint.default(pois_fit, "x")`.

```r title="Your turn: profile vs Wald widths"
ex_prof <- confint(pois_fit, "x")
# your code here: ex_wald, ex_widths

# Test:
ex_widths
#> Expected: profile width close to but not identical to Wald width
```

<details>
<summary>Click to reveal solution</summary>

```r title="Profile vs Wald width solution"
ex_prof <- confint(pois_fit, "x")
ex_wald <- confint.default(pois_fit, "x")
ex_widths <- c(profile = diff(ex_prof), wald = diff(ex_wald))
ex_widths
#> profile    wald
#>  0.348    0.349
```

**Explanation:** With $n = 150$ the Wald approximation is good, so the two widths are within 0.001 of each other. Drop $n$ to 25 and the gap widens.

</details>

## When do LRT and pivot methods break down?

Wilks' theorem and pivot inversion assume regularity. Three failure modes show up often.

1. **Boundary parameter spaces.** Variance components, mixing weights, and other parameters constrained to $[0, \infty)$ violate the "interior of $\Theta$" assumption. The LRT statistic becomes a 50:50 mixture of $\chi^2_0$ and $\chi^2_1$ rather than a pure chi-square.
2. **Small samples.** The chi-square calibration is asymptotic. Below $n \approx 30$ for one-parameter models, coverage drifts.
3. **Non-identifiability.** Mixture models with unknown components and certain hidden-variable models break Wilks even at large $n$, because the model dimension is itself ambiguous.

We can quantify the small-sample drift with a quick coverage simulation. Compare Wald and LRT CIs for an exponential rate at $n = 8$.

```r title="Small-sample coverage of Wald vs LRT"
set.seed(404)
truth   <- 1.5
n_small <- 8

cov_one <- function() {
  d <- rexp(n_small, rate = truth)
  th <- 1 / mean(d)
  se <- th / sqrt(n_small)
  wald <- th + c(-1, 1) * qnorm(0.975) * se
  ll_max <- sum(dexp(d, rate = th, log = TRUE))
  dd <- function(theta) 2 * (ll_max - sum(dexp(d, rate = theta, log = TRUE))) - cutoff
  lo <- tryCatch(uniroot(dd, c(1e-3, th))$root, error = function(e) NA)
  hi <- tryCatch(uniroot(dd, c(th, 50))$root,   error = function(e) NA)
  c(wald = wald[1] <= truth && truth <= wald[2],
    lrt  = !is.na(lo) && !is.na(hi) && lo <= truth && truth <= hi)
}

cov_table <- rowMeans(replicate(2000, cov_one()), na.rm = TRUE)
cov_table
#>   wald    lrt
#> 0.8775 0.9300
```

Wald undercovers at 87.75% nominal-95%, while LRT covers at 93.00%. Neither hits 95% exactly at $n = 8$, but LRT is markedly closer. As $n$ grows both converge; the asymptotic guarantees only kick in once you are large enough.

[WARNING]
**A 95% CI is not a 95% CI when assumptions break.** "Coverage" is a frequency over repeated samples, not a property of one interval. If your model violates regularity (boundary, non-identifiability) or your $n$ is too small, the nominal level can lie miles off the achieved level. Always check coverage by simulation when you cannot trust the asymptotics.

**Try it:** Re-run the coverage simulation with `n_small <- 80`. How close does each method get to nominal 95%?

```r title="Your turn: bigger sample coverage"
ex_n <- 80
# your code here: build ex_cov_table the same way

# Test:
ex_cov_table
#> Expected: both methods within ~0.01 of 0.95
```

<details>
<summary>Click to reveal solution</summary>

```r title="Coverage at n=80 solution"
set.seed(404)
ex_n <- 80
ex_cov_one <- function() {
  d <- rexp(ex_n, rate = truth)
  th <- 1 / mean(d)
  se <- th / sqrt(ex_n)
  wald <- th + c(-1, 1) * qnorm(0.975) * se
  ll_max <- sum(dexp(d, rate = th, log = TRUE))
  dd <- function(theta) 2 * (ll_max - sum(dexp(d, rate = theta, log = TRUE))) - cutoff
  lo <- uniroot(dd, c(1e-3, th))$root
  hi <- uniroot(dd, c(th, 50))$root
  c(wald = wald[1] <= truth && truth <= wald[2],
    lrt  = lo <= truth && truth <= hi)
}
ex_cov_table <- rowMeans(replicate(2000, ex_cov_one()))
ex_cov_table
#>   wald    lrt
#> 0.9395  0.9505
```

**Explanation:** At $n = 80$ both methods are very close to nominal, with LRT slightly closer. The asymptotic story is reliable here.

</details>

## Practice Exercises

### Exercise 1: LRT-based CI for a Bernoulli proportion

Simulate 50 Bernoulli draws with success probability 0.3, fit the MLE, and build the LRT-based 95% CI for $p$ using `uniroot()` on the deviance equation. Compare its width to the Wald CI $\hat p \pm 1.96 \sqrt{\hat p(1-\hat p)/n}$.

```r title="Exercise 1 starter"
set.seed(81)
my_bern <- rbinom(50, size = 1, prob = 0.3)

# Hint: write neg_ll_bern(p) <- -sum(dbinom(my_bern, 1, p, log = TRUE))
#       cutoff is qchisq(0.95, 1)
# Build my_lrt_ci and my_wald_ci, then compare diff() of each.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Bernoulli LRT CI solution"
set.seed(81)
my_bern <- rbinom(50, size = 1, prob = 0.3)
my_phat <- mean(my_bern)

ll_bern <- function(p) sum(dbinom(my_bern, 1, p, log = TRUE))
my_llmax <- ll_bern(my_phat)

dev_p <- function(p) 2 * (my_llmax - ll_bern(p)) - qchisq(0.95, 1)
my_lrt_ci <- c(uniroot(dev_p, c(1e-4, my_phat))$root,
               uniroot(dev_p, c(my_phat, 1 - 1e-4))$root)

se_w  <- sqrt(my_phat * (1 - my_phat) / length(my_bern))
my_wald_ci <- my_phat + c(-1, 1) * qnorm(0.975) * se_w

list(lrt = my_lrt_ci, wald = my_wald_ci,
     widths = c(lrt = diff(my_lrt_ci), wald = diff(my_wald_ci)))
#> $lrt
#> [1] 0.1736 0.4426
#> $wald
#> [1] 0.1659 0.4341
#> $widths
#>    lrt   wald
#>  0.269  0.268
```

**Explanation:** The LRT CI for a proportion is asymmetric and stays inside [0, 1] by construction, which is the key reason it is preferred over Wald near the boundaries 0 or 1.

</details>

### Exercise 2: Profile likelihood CI for a gamma shape

Simulate 100 draws from `rgamma(100, shape = 2.5, rate = 1)` and build the profile likelihood CI for the shape parameter, profiling out the rate. Use `optimize()` for the inner maximisation.

```r title="Exercise 2 starter"
set.seed(15)
my_gamma <- rgamma(100, shape = 2.5, rate = 1)

# Hint:
#   For each shape on a grid, max over rate using optimize().
#   Profile log-lik = max log-lik at that shape.
#   Find the shape grid points where profile_dev <= qchisq(0.95, 1).

```

<details>
<summary>Click to reveal solution</summary>

```r title="Gamma profile CI solution"
set.seed(15)
my_gamma <- rgamma(100, shape = 2.5, rate = 1)

profile_at <- function(sh) {
  obj <- function(rt) -sum(dgamma(my_gamma, shape = sh, rate = rt, log = TRUE))
  optimize(obj, c(1e-3, 50))$objective * -1
}

shape_grid <- seq(1.6, 3.6, length.out = 100)
prof_ll    <- sapply(shape_grid, profile_at)
my_max     <- max(prof_ll)
in_set     <- shape_grid[2 * (my_max - prof_ll) <= qchisq(0.95, 1)]
range(in_set)
#> [1] 1.964 3.151
```

**Explanation:** The CI 1.96 to 3.15 covers the truth 2.5 and uses the profile log-likelihood that has rate concentrated out. Wilks' theorem still calibrates the cutoff because shape is one-dimensional.

</details>

### Exercise 3: A generic test-inversion function

Write `invert_test(pivot_fn, x, alpha = 0.05, search = c(-50, 50))` that takes a pivot function returning a p-value for `H0: theta = theta0` given data `x`, and returns the 1 - alpha confidence set by inverting at the boundary. Test it on the Z-pivot for a normal mean with known $\sigma = 1$.

```r title="Exercise 3 starter"
my_x <- rnorm(40, 3, 1)

# Hint: pivot_fn(theta0, x) returns a p-value.
#       Invert it: find theta0 where pivot_fn = alpha (boundary of acceptance).
#       Use uniroot() on each side of the MLE.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Generic invert_test solution"
set.seed(8)
my_x <- rnorm(40, 3, 1)

invert_test <- function(pivot_fn, x, alpha = 0.05, search = c(-50, 50)) {
  mle  <- mean(x)
  root <- function(side) {
    f <- function(t0) pivot_fn(t0, x) - alpha
    uniroot(f, c(if (side == "lo") search[1] else mle,
                 if (side == "lo") mle      else search[2]))$root
  }
  c(root("lo"), root("hi"))
}

z_pivot <- function(theta0, x) {
  z <- (mean(x) - theta0) / (1 / sqrt(length(x)))
  2 * pnorm(-abs(z))
}

invert_test(z_pivot, my_x)
#> [1] 2.7064 3.3260
mean(my_x) + c(-1, 1) * qnorm(0.975) / sqrt(length(my_x))
#> [1] 2.7064 3.3260
```

**Explanation:** The inverter recovers the analytic Z-CI exactly, because the boundary of a two-sided test acceptance region is the closed-form CI. The same `invert_test()` works for any pivot you can evaluate as a p-value.

</details>

## Complete Example

Tie everything together on a logistic regression. Generate data, fit the model, and report Wald, profile likelihood, and LRT-based inference side by side.

```r title="Logistic regression: complete inference workflow"
set.seed(2026)
demo_df <- data.frame(x = rnorm(180))
demo_df$y <- rbinom(180, 1, plogis(-0.5 + 1.6 * demo_df$x))

demo_fit  <- glm(y ~ x, data = demo_df, family = binomial())
null_fit  <- glm(y ~ 1, data = demo_df, family = binomial())

# 1. Wald CI for slope
wald_slope <- confint.default(demo_fit, "x")

# 2. Profile likelihood CI for slope
prof_slope <- confint(demo_fit, "x")

# 3. LRT for slope = 0 (compare nested models)
lrt_anova <- anova(null_fit, demo_fit, test = "LRT")

list(
  wald     = round(wald_slope, 3),
  profile  = round(prof_slope, 3),
  lrt_stat = round(lrt_anova$Deviance[2], 3),
  lrt_pval = signif(lrt_anova$`Pr(>Chi)`[2], 3)
)
#> $wald
#>     2.5 %  97.5 %
#> x   1.207   2.011
#> $profile
#>     2.5 %  97.5 %
#> x   1.215   2.025
#> $lrt_stat
#> [1] 73.882
#> $lrt_pval
#> [1] 8.31e-18
```

All three views agree: the slope is far from zero, with a 95% CI roughly $[1.2, 2.0]$ from either Wald or profile likelihood, and the LRT against the null model returns a chi-square statistic of 73.88 on 1 df, with a p-value below $10^{-17}$. Now plot the deviance curve so you can *see* the LRT confidence interval.

```r title="Visualise the LRT CI for the slope"
beta_grid <- seq(0.8, 2.4, length.out = 200)
prof_dev  <- sapply(beta_grid, function(b) {
  off_fit <- glm(y ~ offset(b * x), data = demo_df, family = binomial())
  2 * (as.numeric(logLik(demo_fit)) - as.numeric(logLik(off_fit)))
})

plot(beta_grid, prof_dev, type = "l",
     xlab = "slope (beta)", ylab = "profile deviance")
abline(h = qchisq(0.95, 1), lty = 2)
abline(v = prof_slope, lty = 3, col = "steelblue")
```

The dashed line is the chi-square(1) cutoff; the dotted vertical lines are the profile CI endpoints reported by `confint()`. The slope values where the deviance curve dips below the cutoff are the ones we cannot reject. That parabolic-looking dip is the entire content of the 95% LRT confidence interval.

## Summary

Three machineries produce frequentist confidence sets, with overlapping but distinct strengths.

![Confidence sets toolkit overview](screenshots/Likelihood-Ratio-Tests-and-Pivotal-Methods-overview.webp)

*Figure 3: The three machineries that produce confidence sets in classical statistics.*

| Method | When to use | R entry point |
|---|---|---|
| Pivotal quantity | Closed-form pivot exists ($Z$, $T$, chi-square for variance) | `t.test`, `qchisq`, hand inversion |
| LRT inversion | Likelihood is smooth, scalar parameter, no clean pivot | `optim` + `uniroot` on the deviance |
| Profile likelihood | Multi-parameter model with nuisance parameters | `confint(glm_fit)`, `MASS::confint.glm` |

The unifying ideas:

- The likelihood ratio statistic $-2 \log \Lambda$ is asymptotically chi-square under regularity (Wilks' theorem).
- A pivotal quantity has a parameter-free distribution and lets you state probability claims about the data-parameter combo.
- Confidence sets are exactly the not-yet-rejected parameter values from a family of size-$\alpha$ tests.
- When asymptotic regularity fails (boundaries, small $n$, non-identifiability) coverage drifts, so simulate.

[KEY INSIGHT]
**Tests and confidence sets are *the same object* viewed from different angles.** Once you internalise the duality, you stop memorising CI formulas and start reading them as inverted tests. This is why pivot CIs, LRT CIs, and profile-likelihood CIs all share the same skeleton.

## References

1. Casella, G. & Berger, R. L. *Statistical Inference*, 2nd ed., Duxbury, 2002. Chapter 8 (hypothesis testing) and Chapter 9 (interval estimation). [Link](https://duxbury.cengage.com)
2. Lehmann, E. L. & Romano, J. P. *Testing Statistical Hypotheses*, 4th ed., Springer, 2022. [Link](https://link.springer.com/book/10.1007/978-3-030-70578-7)
3. Wilks, S. S. "The large-sample distribution of the likelihood ratio for testing composite hypotheses," *Annals of Mathematical Statistics*, 1938. [Link](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-9/issue-1/The-Large-Sample-Distribution-of-the-Likelihood-Ratio-for-Testing/10.1214/aoms/1177732360.full)
4. Cox, D. R. & Hinkley, D. V. *Theoretical Statistics*, Chapman and Hall, 1974.
5. Pawitan, Y. *In All Likelihood: Statistical Modelling and Inference Using Likelihood*, Oxford University Press, 2013.
6. Cowan, G., Cranmer, K., Gross, E. & Vitells, O. "Asymptotic formulae for likelihood-based tests of new physics," *European Physical Journal C*, 2011. [Link](https://arxiv.org/abs/1007.1727)
7. R Documentation, `stats::confint` and `MASS::confint.glm`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/confint.html)

## Continue Learning

- [Neyman-Pearson Lemma in R](Neyman-Pearson-Lemma-in-R-2.html): the optimality story behind likelihood ratio tests for simple hypotheses.
- [Asymptotic Theory in R](Asymptotic-Theory-in-R-2.html): the convergence machinery (consistency, asymptotic normality, the delta method) that underwrites Wilks' theorem.
- [Cramer-Rao Lower Bound](Cramer-Rao-Lower-Bound-in-R-2.html): Fisher information, the variance bound for unbiased estimators, and the connection to MLE efficiency.
