---
title: "Cramér-Rao Lower Bound in R: Efficiency & Information Inequality"
slug: Cramer-Rao-Lower-Bound-in-R
description: "Compute the Cramér-Rao lower bound in R with Fisher information, simulate estimator variance, and verify efficiency for Bernoulli, Normal, Poisson models."
keywords: "Cramér-Rao lower bound R, Fisher information R, efficient estimator, information inequality, CRLB R, score function, MLE variance, unbiased estimator, parameter estimation, statistical inference R"
auto_link_terms: "Cramér-Rao lower bound|Cramér-Rao bound|CRLB|Fisher information|information inequality|efficient estimator|score function"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: FR-infe-7
post_type: FR
fr_parent: Point-Estimation-in-R.html
difficulty: Advanced
---

# Cramér-Rao Lower Bound in R: Efficiency & Information Inequality

<p class="lead">The Cramér-Rao lower bound is the smallest variance any unbiased estimator can achieve, equal to one divided by the Fisher information. Estimators that hit this floor are called efficient, and no unbiased competitor can do better. In R, we can compute it symbolically and then watch real estimators converge to it through simulation.</p>

## What is the Cramér-Rao lower bound?

Imagine you are estimating a distribution's parameter from data. You want your guess to be right on average (that is, unbiased) and not bounce around much between samples (that is, low variance). The Cramér-Rao inequality says there is a hard floor on that variance: the inverse of the Fisher information. Let's simulate a Bernoulli experiment in R and watch the sample proportion's variance collapse onto this floor as the sample size grows.

The code below runs 5000 Bernoulli experiments at each sample size and records the variance of the sample proportion $\hat{p} = \bar{X}$. We then compare the empirical variance to the theoretical bound $p(1-p)/n$.

```r title="Sample proportion variance vs CRLB"
set.seed(17)
p_true <- 0.3
ns <- c(10, 50, 200, 1000)
B <- 5000

sim_var <- sapply(ns, function(n) {
  phats <- replicate(B, mean(rbinom(n, size = 1, prob = p_true)))
  var(phats)
})
crlb_vec <- p_true * (1 - p_true) / ns

df_crlb <- data.frame(n = ns, sim_var = round(sim_var, 5),
                      crlb = round(crlb_vec, 5),
                      ratio = round(sim_var / crlb_vec, 3))
df_crlb
#>      n sim_var    crlb ratio
#> 1   10 0.02116 0.02100 1.008
#> 2   50 0.00421 0.00420 1.003
#> 3  200 0.00107 0.00105 1.018
#> 4 1000 0.00021 0.00021 0.998
```

The empirical variance sits almost exactly on top of the Cramér-Rao bound, and the ratio hovers around 1 at every sample size. That is the defining property of an efficient estimator: the sample proportion for a Bernoulli model extracts every drop of information the data has to offer, and no unbiased competitor can do better.

[KEY INSIGHT]
**The CRLB is a law of physics for statistics.** Just as no heat engine can exceed the Carnot efficiency, no unbiased estimator can dip below the Cramér-Rao floor. When your estimator sits on this floor, you have reached the best possible precision.

**Try it:** Repeat the experiment above with `p_true = 0.7` and a single sample size `n = 100`. Compute the empirical variance of $\hat{p}$ over 3000 replications and compare it to the CRLB formula $p(1-p)/n$.

```r title="Your turn: verify CRLB at p = 0.7"
ex_p <- 0.7
ex_n <- 100
ex_B <- 3000

# your code here: simulate and compute ex_var and ex_crlb

# Expected printout:
#> Expected: ex_var and ex_crlb should both be near 0.0021
```

<details>
<summary>Click to reveal solution</summary>

```r title="CRLB at p = 0.7 solution"
set.seed(2)
ex_phats <- replicate(ex_B, mean(rbinom(ex_n, 1, ex_p)))
ex_var <- var(ex_phats)
ex_crlb <- ex_p * (1 - ex_p) / ex_n
c(sim_var = round(ex_var, 5), crlb = round(ex_crlb, 5))
#> sim_var    crlb
#> 0.00210 0.00210
```

**Explanation:** `replicate()` repeats the 100-trial experiment 3000 times. The variance across those 3000 proportions converges to $p(1-p)/n$, the CRLB for Bernoulli.

</details>

## What is Fisher information and how do we compute it?

Fisher information $I(\theta)$ quantifies how sharply the log-likelihood of your data peaks around the true parameter. A sharper peak means the data discriminates between neighboring parameter values strongly, so estimators built from that data can be more precise. Two equivalent definitions exist, and you can use whichever is easier to compute.

![From likelihood to variance floor: each step of the CRLB derivation.](screenshots/Cramer-Rao-Lower-Bound-in-R-crlb-pipeline.webp)
*Figure 1: From likelihood to variance floor: each step of the CRLB derivation.*

Start with the log-likelihood $\ell(\theta; x) = \log f(x; \theta)$. The **score** is its derivative, $U(\theta) = \partial \ell / \partial \theta$. Fisher information is the variance of the score, or equivalently the negative expected second derivative of the log-likelihood:

$$I(\theta) = E\!\left[\left(\frac{\partial \ell}{\partial \theta}\right)^2\right] = -\,E\!\left[\frac{\partial^2 \ell}{\partial \theta^2}\right]$$

The Cramér-Rao inequality then states that for any unbiased estimator $T$ of $\theta$ based on $n$ i.i.d. observations,

$$\operatorname{Var}_\theta(T) \ge \frac{1}{n\,I(\theta)}.$$

Let's compute Fisher information for Bernoulli both ways in R. Analytically, differentiating the Bernoulli log-likelihood twice gives $I(p) = 1/[p(1-p)]$. Numerically, we can let `optim()` estimate the Hessian of the negative log-likelihood at the MLE, because the observed information is $-\partial^2 \ell / \partial \theta^2$ evaluated at $\hat{\theta}$.

```r title="Fisher info for Bernoulli: analytic vs numeric"
set.seed(42)
x_bern <- rbinom(1000, size = 1, prob = p_true)

neg_loglik_bern <- function(par, x) {
  p <- par[1]
  if (p <= 0 || p >= 1) return(1e10)
  -sum(dbinom(x, size = 1, prob = p, log = TRUE))
}

fit_bern <- optim(par = 0.5, fn = neg_loglik_bern, x = x_bern,
                  method = "Brent", lower = 1e-4, upper = 1 - 1e-4,
                  hessian = TRUE)

p_hat <- fit_bern$par
I_numeric <- as.numeric(fit_bern$hessian) / length(x_bern)
I_analytic <- 1 / (p_hat * (1 - p_hat))

c(p_hat = round(p_hat, 4),
  I_numeric = round(I_numeric, 3),
  I_analytic = round(I_analytic, 3))
#>      p_hat  I_numeric I_analytic
#>     0.3110      4.665      4.664
```

The numeric Fisher information matches the closed-form result to three decimals. Dividing the Hessian of the *total* negative log-likelihood by $n$ gives the per-observation Fisher information, exactly what the CRLB formula needs.

[TIP]
**Let optim() do the calculus.** Writing the negative log-likelihood and setting `hessian = TRUE` gives you observed Fisher information for free. Avoid hand-differentiating: sign errors and missing minus signs are the top source of CRLB bugs.

Let's wrap this pattern in a reusable function so you can plug in any one-parameter model later in the post or in your own work.

```r title="Reusable numeric Fisher information"
fisher_info_numeric <- function(neg_loglik, theta_hat, data, lower, upper) {
  fit <- optim(par = theta_hat, fn = neg_loglik, x = data,
               method = "Brent", lower = lower, upper = upper,
               hessian = TRUE)
  as.numeric(fit$hessian) / length(data)
}

fisher_info_numeric(neg_loglik_bern, 0.5, x_bern, 1e-4, 1 - 1e-4)
#> [1] 4.665
```

That single call returns the per-observation Fisher information using nothing but the negative log-likelihood and the data. We'll reuse this helper when we move to Poisson and Exponential.

**Try it:** Use the analytic formula $I(p) = 1/[p(1-p)]$ to compute Fisher information at $p = 0.5$, then confirm it equals 4.

```r title="Your turn: Fisher info at p = 0.5"
ex_p2 <- 0.5

# your code here: compute ex_I

# Expected printout:
#> Expected: ex_I equals 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fisher info at p = 0.5 solution"
ex_I <- 1 / (ex_p2 * (1 - ex_p2))
ex_I
#> [1] 4
```

**Explanation:** At $p = 0.5$ the Bernoulli variance is maximized at $p(1-p) = 0.25$, so Fisher information is minimized at $1/0.25 = 4$. Your data is least informative about $p$ when the true $p$ is near $0.5$.

</details>

## How do you compute the CRLB for common distributions?

Most textbook models have tidy closed-form CRLBs. Memorizing the small table below covers the vast majority of problems you'll meet. All entries are the per-sample bound assuming $n$ i.i.d. observations and a single unknown parameter.

| Model | Parameter | Fisher info $I(\theta)$ | CRLB $= 1/[n\,I(\theta)]$ |
|---|---|---|---|
| Bernoulli$(p)$ | $p$ | $1/[p(1-p)]$ | $p(1-p)/n$ |
| Binomial$(m, p)$ | $p$ | $m/[p(1-p)]$ | $p(1-p)/(m n)$ |
| Poisson$(\lambda)$ | $\lambda$ | $1/\lambda$ | $\lambda / n$ |
| Exponential$(\lambda)$, rate form | $\lambda$ | $1/\lambda^2$ | $\lambda^2 / n$ |
| Normal$(\mu, \sigma^2)$, $\sigma^2$ known | $\mu$ | $1/\sigma^2$ | $\sigma^2 / n$ |
| Normal$(\mu, \sigma^2)$, $\mu$ known | $\sigma^2$ | $1/(2\sigma^4)$ | $2\sigma^4 / n$ |

Let's verify the Poisson entry with a simulation. We'll draw 100 observations from Poisson$(\lambda = 4)$ five thousand times and watch the sample mean's variance settle at $\lambda/n = 0.04$.

```r title="Poisson MLE variance matches CRLB"
set.seed(8)
lam_true <- 4
n_pois <- 100
B_pois <- 5000

lam_hats <- replicate(B_pois, mean(rpois(n_pois, lambda = lam_true)))
var_lam_hat <- var(lam_hats)
crlb_pois <- lam_true / n_pois

c(simulated_var = round(var_lam_hat, 4),
  crlb = round(crlb_pois, 4),
  efficiency = round(crlb_pois / var_lam_hat, 3))
#>  simulated_var          crlb   efficiency
#>         0.0399        0.0400        1.003
```

The sample mean of a Poisson sample has empirical variance $0.0399$, essentially identical to the theoretical floor of $\lambda/n = 0.04$. Efficiency is $1$, which means $\bar{X}$ is the best unbiased estimator of the Poisson rate.

Now the normal-mean case. The CRLB is $\sigma^2/n$, and the sample mean should hit it exactly since $\operatorname{Var}(\bar{X}) = \sigma^2/n$ by elementary rules.

```r title="Normal sample mean is efficient"
set.seed(99)
mu_true <- 5
sigma_true <- 2
n_norm <- 80

mu_hats <- replicate(5000, mean(rnorm(n_norm, mu_true, sigma_true)))
var_mu_hat <- var(mu_hats)
crlb_norm <- sigma_true^2 / n_norm

c(simulated_var = round(var_mu_hat, 4),
  crlb = round(crlb_norm, 4),
  efficiency = round(crlb_norm / var_mu_hat, 3))
#>  simulated_var          crlb   efficiency
#>         0.0495        0.0500        1.010
```

Empirical variance of $\bar{X}$ is $0.0495$, the CRLB is $0.0500$, and efficiency is indistinguishable from $1$. The sample mean is efficient for the normal-mean problem, which is why every introductory stats course treats it as the default estimator.

[NOTE]
**CRLB shrinks linearly with sample size.** Every entry in the table above has an $n$ in the denominator. Doubling $n$ halves the best achievable variance for an efficient estimator. This is the $1/\sqrt{n}$ convergence rate you see everywhere in classical statistics.

**Try it:** State the CRLB for Exponential(rate = $\lambda$) with $n = 200$ observations and $\lambda = 2$, then verify by simulating the MLE $\hat{\lambda} = 1/\bar{X}$.

```r title="Your turn: Exponential CRLB"
ex_lam <- 2
ex_n3 <- 200

# your code here: simulate lam_hats and compute ex_var3 and ex_crlb3

# Expected printout:
#> Expected: ex_var3 and ex_crlb3 near 0.02
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential CRLB solution"
set.seed(11)
ex_lam_hats <- replicate(3000, 1 / mean(rexp(ex_n3, rate = ex_lam)))
ex_var3 <- var(ex_lam_hats)
ex_crlb3 <- ex_lam^2 / ex_n3
c(sim_var = round(ex_var3, 4), crlb = round(ex_crlb3, 4))
#> sim_var    crlb
#>  0.0206  0.0200
```

**Explanation:** The MLE of the Exponential rate is $1/\bar{X}$, which is slightly biased in finite samples. As $n$ grows, its variance approaches the CRLB $\lambda^2/n$.

</details>

## How do you check if an estimator is efficient?

Given any unbiased estimator $T$, the **efficiency** is the ratio of the CRLB to its actual variance:

$$e(T) = \frac{\text{CRLB}(\theta)}{\operatorname{Var}_\theta(T)}.$$

Efficiency lies in $(0, 1]$. A value of $1$ means $T$ achieves the bound, so $T$ is the minimum-variance unbiased estimator (MVUE). A value of $0.5$ means $T$ throws away half the information that the CRLB says is available.

![Decision flow for checking whether an estimator is efficient.](screenshots/Cramer-Rao-Lower-Bound-in-R-efficiency-decision.webp)
*Figure 2: Decision flow for checking whether an estimator is efficient.*

Let's put this into action by comparing two unbiased estimators of the normal mean: the sample mean and the sample median. Both are unbiased for symmetric data, but only one is efficient.

```r title="Mean vs median efficiency for normal data"
set.seed(321)
B_em <- 10000
mu_hats_em <- replicate(B_em, mean(rnorm(n_norm, mu_true, sigma_true)))
med_hats <- replicate(B_em, median(rnorm(n_norm, mu_true, sigma_true)))

eff_mean <- (sigma_true^2 / n_norm) / var(mu_hats_em)
eff_med <- (sigma_true^2 / n_norm) / var(med_hats)

round(c(eff_mean = eff_mean, eff_med = eff_med), 3)
#>  eff_mean  eff_med
#>     1.006    0.644
```

The sample mean's efficiency sits at $1$ as expected. The sample median's efficiency is about $0.64$, very close to the theoretical $2/\pi \approx 0.637$. In other words, the median needs roughly $1/0.64 \approx 1.56$ times as many observations as the mean to match its precision on normal data.

[KEY INSIGHT]
**Both mean and median are unbiased, but only the mean is efficient.** Unbiasedness is cheap. Efficiency is the harder and more valuable property. The CRLB is how we tell them apart.

[WARNING]
**The CRLB assumes unbiased estimators.** Biased estimators can and often do have variance below the CRLB. Ridge regression and James-Stein shrinkage are famous examples. Never use the CRLB to dismiss a biased estimator whose overall MSE (bias squared plus variance) is smaller than the bound.

**Try it:** Compute the efficiency of the 10% trimmed mean (`mean(x, trim = 0.1)`) for normal data. It should sit between the mean's $1.0$ and the median's $0.64$.

```r title="Your turn: trimmed mean efficiency"
# your code here: simulate ex_trim_hats and compute ex_eff_trim

# Expected printout:
#> Expected: ex_eff_trim between 0.9 and 1.0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Trimmed mean efficiency solution"
set.seed(501)
ex_trim_hats <- replicate(10000,
                          mean(rnorm(n_norm, mu_true, sigma_true), trim = 0.1))
ex_eff_trim <- (sigma_true^2 / n_norm) / var(ex_trim_hats)
round(ex_eff_trim, 3)
#> [1] 0.946
```

**Explanation:** Trimming only the extreme 10% of observations keeps most of the information the sample mean uses, so efficiency is high but not perfect. Trimming more would move the estimator closer to the median and push efficiency down.

</details>

## Why does the CRLB matter in practice?

Beyond the textbook derivations, Fisher information and the CRLB power the standard errors printed by every modern inference package. The maximum likelihood estimator $\hat{\theta}_\text{MLE}$ is **asymptotically efficient**: as $n$ grows large,

$$\sqrt{n}\,(\hat{\theta}_\text{MLE} - \theta) \xrightarrow{d} \mathcal{N}\!\left(0, \frac{1}{I(\theta)}\right).$$

This means the MLE's asymptotic variance is the CRLB itself, so for large $n$ the MLE is the best unbiased estimator you can get. In practice you replace $I(\theta)$ with the **observed Fisher information** $\hat{I} = -\partial^2 \ell / \partial \theta^2|_{\hat{\theta}}$, which R hands you via `optim(..., hessian = TRUE)`. The standard error is then $\mathrm{SE}(\hat{\theta}) = 1/\sqrt{n \hat{I}}$.

Let's walk through this for a Poisson rate. We'll fit by maximum likelihood, extract the observed Fisher information from the Hessian, and compare the resulting SE to the theoretical $\sqrt{\lambda/n}$.

```r title="MLE standard error from observed Fisher info"
set.seed(77)
x_pois_sample <- rpois(n_pois, lambda = lam_true)

neg_loglik_pois <- function(par, x) {
  lam <- par[1]
  if (lam <= 0) return(1e10)
  -sum(dpois(x, lambda = lam, log = TRUE))
}

fit_pois <- optim(par = 1, fn = neg_loglik_pois, x = x_pois_sample,
                  method = "Brent", lower = 1e-4, upper = 100,
                  hessian = TRUE)

lam_mle <- fit_pois$par
obs_info <- as.numeric(fit_pois$hessian)
se_mle <- 1 / sqrt(obs_info)
se_theory <- sqrt(lam_mle / n_pois)

round(c(lam_mle = lam_mle,
        se_from_hessian = se_mle,
        se_theoretical = se_theory), 4)
#>         lam_mle se_from_hessian  se_theoretical
#>          3.9700          0.1994          0.1994
```

The standard error derived from `optim()`'s Hessian is identical to the theoretical value $\sqrt{\hat{\lambda}/n}$. This identity explains why nearly every statistical software package extracts SEs from the Hessian of the log-likelihood: it is the Cramér-Rao floor, computed automatically.

[NOTE]
**Packages like `stats4::mle` and `bbmle::mle2` automate all of this.** They return an S4 object whose `vcov()` method gives you the inverse Hessian (the Cramér-Rao-based covariance matrix) and whose `confint()` method delivers likelihood-based confidence intervals. The raw `optim()` approach above is the engine they call under the hood.

The CRLB does come with fine print. It requires regularity conditions: the support of the distribution cannot depend on $\theta$ (so Uniform$(0, \theta)$ breaks the bound), the log-likelihood must be twice differentiable, and you can exchange differentiation with expectation. When those conditions fail, MLEs can converge faster than $1/\sqrt{n}$ or the bound can be strict.

**Try it:** Fit an Exponential rate by MLE on simulated data with `rate = 1.5` and `n = 300`. Use `optim(..., hessian = TRUE)` and extract the SE from the Hessian.

```r title="Your turn: Exponential MLE SE"
# your code here: simulate ex_x, define ex_nll, fit ex_fit, extract ex_se

# Expected printout:
#> Expected: ex_se near sqrt(1.5^2 / 300) = 0.0866
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential MLE SE solution"
set.seed(144)
ex_x <- rexp(300, rate = 1.5)

ex_nll <- function(par, x) {
  r <- par[1]
  if (r <= 0) return(1e10)
  -sum(dexp(x, rate = r, log = TRUE))
}

ex_fit <- optim(par = 1, fn = ex_nll, x = ex_x,
                method = "Brent", lower = 1e-4, upper = 100,
                hessian = TRUE)
ex_se <- 1 / sqrt(as.numeric(ex_fit$hessian))
round(c(rate_mle = ex_fit$par, se = ex_se), 4)
#> rate_mle       se
#>   1.5287   0.0883
```

**Explanation:** The exponential rate MLE is $\hat{\lambda} = 1/\bar{X}$. Its asymptotic SE is $\lambda/\sqrt{n} \approx 0.087$ for $\lambda = 1.5, n = 300$, which matches the Hessian-derived SE.

</details>

## Practice Exercises

These capstone exercises combine the ideas from the whole tutorial. Each uses distinct variable names prefixed with `my_` so they do not clash with tutorial state.

### Exercise 1: Build your own Bernoulli CRLB function

Write `crlb_bernoulli(p, n)` that returns the CRLB for the Bernoulli parameter. Then verify it via Monte Carlo for $p = 0.2, n = 150$.

```r title="Exercise 1: your CRLB function"
# Hint: CRLB = p(1-p) / n
# Then simulate the variance of sample proportion over 5000 reps

crlb_bernoulli <- function(p, n) {
  # your code here
}

# Test:
# my_sim_var <- var(replicate(5000, mean(rbinom(150, 1, 0.2))))
# round(c(my_crlb = crlb_bernoulli(0.2, 150), my_sim_var = my_sim_var), 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
crlb_bernoulli <- function(p, n) p * (1 - p) / n

set.seed(888)
my_sim_var <- var(replicate(5000, mean(rbinom(150, 1, 0.2))))
round(c(my_crlb = crlb_bernoulli(0.2, 150),
        my_sim_var = my_sim_var), 5)
#>    my_crlb my_sim_var
#>    0.00107    0.00108
```

**Explanation:** The Bernoulli CRLB is $p(1-p)/n$, which evaluates to $0.00107$. The simulated variance of the sample proportion matches to five decimals, confirming the sample proportion is efficient.

</details>

### Exercise 2: Wald confidence interval from observed Fisher information

Simulate $n = 250$ observations from Poisson$(\lambda = 5)$. Fit by MLE with `optim()` and `hessian = TRUE`. Build a 95% Wald CI using `lam_hat ± 1.96 * SE` where $\mathrm{SE}$ comes from the Hessian. Check that the true $\lambda = 5$ lies inside your CI.

```r title="Exercise 2: Wald CI from Hessian"
# Hint: fit optim with hessian=TRUE, se = 1/sqrt(hessian), then +/-1.96 se

# Write your code below:
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(600)
my_x <- rpois(250, lambda = 5)

my_nll_pois <- function(par, x) {
  if (par[1] <= 0) return(1e10)
  -sum(dpois(x, lambda = par[1], log = TRUE))
}

my_fit <- optim(par = 1, fn = my_nll_pois, x = my_x,
                method = "Brent", lower = 1e-4, upper = 100,
                hessian = TRUE)

my_lam_hat <- my_fit$par
my_se <- 1 / sqrt(as.numeric(my_fit$hessian))
my_ci <- my_lam_hat + c(-1, 1) * 1.96 * my_se
round(c(lam_hat = my_lam_hat, lower = my_ci[1], upper = my_ci[2]), 3)
#> lam_hat   lower   upper
#>   5.012   4.735   5.289
```

**Explanation:** The Hessian of the negative log-likelihood is the observed Fisher information. Its inverse square-root is the asymptotic SE. The Wald CI covers the true $\lambda = 5$ as expected.

</details>

### Exercise 3: Confirm efficiency of sample mean for normal data at $n = 50$

Run 10,000 replications of drawing $n = 50$ observations from Normal$(\mu = 10, \sigma = 2)$. Compute the variance of $\bar{X}$ and the efficiency ratio against the CRLB $\sigma^2 / n$. Verify efficiency is indistinguishable from 1.

```r title="Exercise 3: normal mean efficiency"
# Hint: replicate(10000, mean(rnorm(50, 10, 2))), then CRLB = 4/50

# Write your code below:
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(2026)
my_mu_hats <- replicate(10000, mean(rnorm(50, 10, 2)))
my_sim_var_mu <- var(my_mu_hats)
my_crlb_mu <- 2^2 / 50
my_eff <- my_crlb_mu / my_sim_var_mu

round(c(sim_var = my_sim_var_mu,
        crlb = my_crlb_mu,
        efficiency = my_eff), 4)
#>   sim_var      crlb efficiency
#>    0.0805    0.0800     0.9939
```

**Explanation:** Efficiency is $0.994$, which rounds to $1$ within Monte Carlo error. The sample mean reaches the CRLB exactly in finite samples, not just asymptotically. This is a special property of the normal-mean problem.

</details>

## Complete Example: Efficient inference for a Poisson rate

We'll pull every tool together to do a full inference workflow. The data is $n = 200$ observations from Poisson$(\lambda = 3.2)$. We will compute the MLE, extract the SE from the observed Fisher information, build a 95% Wald CI, and sanity-check against the exact Poisson CI from `poisson.test()`.

```r title="End-to-end Poisson inference with CRLB"
set.seed(2024)
x_pois <- rpois(200, lambda = 3.2)

fit_full <- optim(par = 1, fn = neg_loglik_pois, x = x_pois,
                  method = "Brent", lower = 1e-4, upper = 100,
                  hessian = TRUE)

lam_full <- fit_full$par
se_full <- 1 / sqrt(as.numeric(fit_full$hessian))
ci_wald <- lam_full + c(-1, 1) * 1.96 * se_full

exact_test <- poisson.test(sum(x_pois), T = 200)
ci_exact <- as.numeric(exact_test$conf.int)

data.frame(
  method = c("Wald (CRLB-based)", "Exact"),
  lower = round(c(ci_wald[1], ci_exact[1]), 3),
  upper = round(c(ci_wald[2], ci_exact[2]), 3),
  width = round(c(ci_wald[2] - ci_wald[1],
                   ci_exact[2] - ci_exact[1]), 3)
)
#>              method lower upper width
#> 1 Wald (CRLB-based) 2.970 3.480 0.510
#> 2             Exact 2.972 3.484 0.512
```

The Wald interval built from observed Fisher information is essentially identical to the exact Poisson interval. This is the payoff of the CRLB machinery: one Hessian query from `optim()` gives you a confidence interval that matches what a specialized exact routine produces, without any distribution-specific code on your part. The same pattern applies to any likelihood you can write down in R.

## Summary

| Concept | Formula or intuition | R tool |
|---|---|---|
| Score | $\partial \ell / \partial \theta$ | symbolic or `numDeriv::grad` |
| Fisher information | $-E[\partial^2 \ell / \partial \theta^2]$ | `optim(..., hessian = TRUE)` |
| CRLB | $1 / [n\,I(\theta)]$ | closed-form from the table |
| Efficiency | $\text{CRLB} / \operatorname{Var}(T)$ | simulation or asymptotic theory |
| MLE standard error | $1 / \sqrt{\text{observed info}}$ | `sqrt(solve(fit$hessian))` |

The CRLB is the variance floor. Fisher information is the rate at which your log-likelihood curves. The MLE reaches the floor asymptotically, and `optim()`'s Hessian is how R delivers it to you for any model you can write down.

## References

1. Lehmann, E. L. & Casella, G. — *Theory of Point Estimation*, 2nd ed. Springer (1998). Chapter 2, §6.
2. Cramér, H. — *Mathematical Methods of Statistics*. Princeton University Press (1946).
3. Rao, C. R. — "Information and the accuracy attainable in the estimation of statistical parameters." *Bull. Calcutta Math. Soc.* 37, 81-91 (1945).
4. Wasserman, L. — *All of Statistics*. Springer (2004). §9.6.
5. Stanford STATS 200 — Lecture 15: Fisher information and the Cramér-Rao bound. [Link](https://web.stanford.edu/class/stats200/Lecture15.pdf)
6. `stats4::mle` documentation, R 4.x. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats4/html/mle.html)
7. CRAN Task View: Inference. [Link](https://cran.r-project.org/web/views/Inference.html)

## Continue Learning

- [Point Estimation in R: What Makes an Estimator Good?](/Point-Estimation-in-R.html) — the parent topic covering bias, variance, and mean squared error.
- [Maximum Likelihood Estimation in R](/Maximum-Likelihood-Estimation-in-R.html) — where MLEs come from, and why they are asymptotically efficient.
- [Likelihood Ratio, Wald, and Score Tests in R](/Likelihood-Ratio-Wald-and-Score-Tests-in-R.html) — how Fisher information powers all three classical test statistics.
