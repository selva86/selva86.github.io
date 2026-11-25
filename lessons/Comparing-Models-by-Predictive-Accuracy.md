---
title: "Bayesian Data Analysis Lesson 6: Comparing models by predictive accuracy"
catalog_blurb: "See why predicting new data, not fitting old data, should decide between models."
description: "Three Bayesian regressions compared not by training fit but by predictive accuracy, worked out by hand two ways and checked against WAIC and a standard error."
keywords: "log pointwise predictive density, lppd, leave-one-out cross-validation, WAIC, importance sampling, Pareto smoothed importance sampling, elpd, standard error of elpd difference, Bayesian model comparison, R"
post_type: "LESSON"
curriculum_id: "4.110.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-bayes"
course_title: "Bayesian Data Analysis"
course_lesson: "6"
course_total: "8"
course_landing: "Bayesian-Data-Analysis-Course.html"
course_next: "Priors-That-Regularize-Without-Dictating"
course_prev: "Checking-a-Bayesian-Model-Before-and-After"
---

=== step === cover
## Comparing models by predictive accuracy

Today let's understand how to compare models properly: not by how well each one fits the data it was trained on, but by how well each one predicts data it has not seen yet.

Picture eighteen boutique gyms. Each one reports last month's memberships sold and the profit it made, in thousands of dollars.

Three Bayesian regressions will compete to explain that profit over this lesson: one using nothing but an overall average, one adding memberships sold, and one adding floor size on top of that.

Here is memberships sold against profit for all eighteen gyms, the data every model in this lesson works from.

::widget chart-plotter {"data":[{"x":87,"y":14.1},{"x":40,"y":5.3},{"x":127,"y":20.8},{"x":42,"y":9.5},{"x":51,"y":8.5},{"x":202,"y":40.5},{"x":55,"y":12.3},{"x":89,"y":18.1},{"x":190,"y":35.1},{"x":61,"y":8.4},{"x":70,"y":13.3},{"x":115,"y":16.8},{"x":194,"y":30.3},{"x":185,"y":29.7},{"x":165,"y":35.8},{"x":138,"y":17.4},{"x":122,"y":18.7},{"x":96,"y":22.2}],"geoms":["point"],"x":"memberships","y":"profit"}

Profit rises with memberships, roughly along a line. But it is not a perfect line: gyms with similar memberships still land at noticeably different profits, so there is room for another predictor to matter, or to look like it matters.

=== step === concept
## Why fit alone cannot judge a model

So if profit rises with memberships, why not just fit a model and see which one explains the data best?

Call the three models by name from here on. Model A uses nothing but an overall average. Model B adds memberships sold. Model C adds floor size, each gym's floor space measured in hundreds of square feet, on top of memberships.

A natural way to judge them is R-squared, the share of the variation in profit a model accounts for in the data it was fit on. Fit all three with ordinary least squares and compare.

```r
# Fit three nested regressions and compare their training R-squared
set.seed(11)
n_gyms <- 18
memberships <- round(runif(n_gyms, 40, 210))
floor100 <- round(runif(n_gyms, 20, 60))
profit <- 2 + 0.18 * memberships + rnorm(n_gyms, 0, 6)
gyms <- data.frame(memberships, floor100, profit)

model_a <- lm(profit ~ 1, data = gyms)
model_b <- lm(profit ~ memberships, data = gyms)
model_c <- lm(profit ~ memberships + floor100, data = gyms)

round(summary(model_a)$r.squared, 3)
#> [1] 0
round(summary(model_b)$r.squared, 3)
#> [1] 0.881
round(summary(model_c)$r.squared, 3)
#> [1] 0.884
```

R-squared climbs at every step: 0 for Model A, 0.881 once memberships is added, 0.884 once floor size joins it too.

That last step should give you pause. This data was built with `set.seed(11)`, with floor size carrying no real effect on profit at all. Yet adding it still nudged R-squared up, from 0.881 to 0.884.

[KEY INSIGHT]
Training R-squared can only rise or stay flat as you add predictors, whether or not they truly help. A number that never goes down cannot be the judge of which predictors belong. Something else has to decide, and that something is how well a model predicts data it was not fit on.

=== step === widget
## Fit improves with complexity; prediction does not

That rising R-squared is not a fluke of this one example. It is a general fact about training fit, and the next widget shows it happening in a completely different setting: a model growing more complex round by round.

Read "boosting rounds" on the x-axis as model complexity, growing from something as plain as Model A toward something with as many moving parts as Model C. Read "train" as fit on the data a model saw, and "validation" as accuracy on data it did not see.

::widget learning-curve {}

The train line keeps falling as complexity grows, the same one-way climb you just saw in R-squared. The validation line falls for a while too, then bottoms out and climbs back up.

That turn is the whole point. Past some complexity, a model stops learning anything new about the data and starts fitting noise that will not repeat on the next batch of gyms. Training fit alone could never show you that turn, because training fit never turns.

=== step === quiz
## Quick check: fit versus prediction
::prose-only the quiz question is the content

Model C's R-squared beat Model B's, 0.884 against 0.881, and the widget above showed training error falling while validation error bottomed out and rose. What do those two things, taken together, actually show?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It proves floor size really affects profit. ::no Floor size was built into this data with no real effect on profit at all. A higher training R-squared does not prove an effect is real; it only shows training fit, which can rise from a predictor that does nothing.
- Training R-squared rises or stays flat as predictors are added, whether or not they truly help, while held-out, or validation, accuracy is the one that bottoms out and can get worse. That is why predictive accuracy on new data, not training fit, should decide between models. ::ok Exactly right. Training fit only ever goes up, so it cannot tell a real predictor from a useless one. Accuracy on data a model did not see is what actually turns when a model has gone too far, which is the number this lesson builds next.
- It means Model C has overfit and should never be used. ::no One higher training R-squared does not by itself prove overfitting, and it is far too early to rule Model C out. The next several steps build the actual tool for deciding that.
- Raising R-squared this way should be impossible. ::no It is not impossible at all. Adding any predictor, useful or not, can only raise or hold flat the fit on the data used to estimate it. That is exactly the weakness this step is pointing at.

=== step === concept
## The log pointwise predictive density

So training fit is out. What should take its place?

Predictive accuracy on data a model has not seen is what should decide between models. In a Bayesian model, that accuracy is scored with the **log pointwise predictive density**, written lppd.

A Bayesian model does not hand back one single prediction for a gym's profit. It hands back a whole posterior of equally plausible parameter draws, each one implying a slightly different prediction. So to score how well the model predicts one gym, average the predictive density across every draw first, and only then take the log. Summed across every gym, that is lppd.

\[ \text{lppd} = \sum_{i=1}^{n} \log\left( \frac{1}{S}\sum_{s=1}^{S} p(y_i \mid \theta_s) \right) \]

Here \(n\) is the number of gyms, \(S\) is the number of posterior draws, \(\theta_s\) is one draw of a model's parameters, and \(p(y_i \mid \theta_s)\) is how likely gym \(i\)'s real profit is under that one draw.

Before fitting any real model, work this out by hand for one gym, using five made-up posterior draws just to see the arithmetic.

```r
# Work out one gym's lppd by hand from five toy posterior draws of its mean
y1 <- gyms$profit[1]
toy_mu <- c(11, 13, 16, 18, 21)
toy_sigma <- 6
toy_density <- dnorm(y1, mean = toy_mu, sd = toy_sigma)
round(toy_density, 4)
#> [1] 0.0581 0.0654 0.0633 0.0539 0.0344
round(mean(toy_density), 4)
#> [1] 0.055
round(log(mean(toy_density)), 4)
#> [1] -2.9004
```

Gym 1's real profit is 14.1. The five toy draws guess its mean at 11, 13, 16, 18 and 21, each with the same spread of 6. Averaging the five densities gives 0.055, and the log of that, -2.9004, is this one gym's lppd contribution.

Add up a number like that for all eighteen gyms, and that total is the model's lppd. The next steps build the real posterior draws so that sum is not make-believe anymore.

=== step === concept
## Setting up three nested Bayesian regressions

Time to fit the three real models the Bayesian way.

Fix the noise level, sigma, at the residual standard deviation OLS's full model already estimated. That is a simplification: it keeps the posterior over the coefficients closed form, with no sampler needed to find it. Put a Normal(0, 10 squared) prior on every coefficient, wide enough to barely constrain anything near the actual values.

Under a fixed sigma and a Normal prior, the posterior over the coefficients is Normal too, with a mean and covariance you can write down directly.

\[ \Sigma_{post} = \left(\frac{1}{\sigma^2}X^\top X + \frac{1}{\tau^2}I\right)^{-1}, \qquad \mu_{post} = \Sigma_{post}\left(\frac{1}{\sigma^2}X^\top y\right) \]

Here \(X\) is a model's design matrix, \(y\) is the profit vector, \(\sigma\) is the fixed noise level, and \(\tau = 10\) is the prior's standard deviation.

```r
# Fix sigma, set up the closed-form Bayesian posterior for all three models, then draw 2000 samples from each
sigma_hat <- summary(model_c)$sigma
round(sigma_hat, 3)
#> [1] 3.796

bayes_lm_posterior <- function(X, y, sigma, tau = 10) {
  p <- ncol(X)
  prec_post <- (1 / sigma^2) * t(X) %*% X + (1 / tau^2) * diag(p)
  Sigma_post <- solve(prec_post)
  mu_post <- Sigma_post %*% ((1 / sigma^2) * t(X) %*% y)
  list(mu = as.numeric(mu_post), Sigma = Sigma_post)
}

X_A <- model.matrix(~1, data = gyms)
X_B <- model.matrix(~memberships, data = gyms)
X_C <- model.matrix(~memberships + floor100, data = gyms)
y_profit <- gyms$profit

post_A <- bayes_lm_posterior(X_A, y_profit, sigma_hat)
post_B <- bayes_lm_posterior(X_B, y_profit, sigma_hat)
post_C <- bayes_lm_posterior(X_C, y_profit, sigma_hat)
round(post_B$mu, 3)
#> [1] -0.005  0.176
round(post_C$mu, 3)
#> [1] -1.809  0.174  0.057

n_draws <- 2000
sample_post <- function(mu, Sigma, n_draws) {
  p <- length(mu)
  upper <- chol(Sigma)
  z <- matrix(rnorm(p * n_draws), nrow = p, ncol = n_draws)
  t(mu + t(upper) %*% z)
}
set.seed(22)
beta_draws_A <- sample_post(post_A$mu, post_A$Sigma, n_draws)
beta_draws_B <- sample_post(post_B$mu, post_B$Sigma, n_draws)
beta_draws_C <- sample_post(post_C$mu, post_C$Sigma, n_draws)
round(colMeans(beta_draws_B), 3)
#> (Intercept) memberships
#>       0.009       0.176
```

Sigma comes out at 3.796, thousand dollars of noise around whatever line a model draws. Model B's posterior mean puts memberships' coefficient at 0.176, and Model C's posterior mean puts it at 0.174 with floor size adding 0.057, a small, uncertain number next to a prior standard deviation of 10.

`chol(Sigma)` is what turns a posterior mean and covariance into actual draws. It factors the covariance matrix so that independent standard-normal noise, `z`, multiplied through it comes out shaped exactly like that covariance, correlations included; adding `mu` then shifts the whole cloud of points onto the posterior mean. That is the entire trick behind `sample_post`.

The last line is a check on the sampler itself. Averaging the 2000 draws from Model B's posterior gives 0.009 and 0.176, close to the 0.176 the formula gave directly. The draws are landing where the formula says they should, so they are ready to use.

=== step === concept
## Leave-one-out, computed directly

**Leave-one-out** predictive accuracy asks a direct question for each gym: refit the model without that gym, then score how well the refit model predicts the gym it never saw.

Because the posterior here is closed form, refitting is cheap. Drop one gym's row from \(X\) and \(y\), run the same formula from the last step, and the held-out gym's profit has a known predictive distribution: Normal, with the refit posterior's mean and a variance that combines the fixed noise with how uncertain the coefficients still are.

\[ y_i \mid y_{-i} \sim \text{Normal}\!\left(x_i^\top \mu_{post,-i},\ \ \sigma^2 + x_i^\top \Sigma_{post,-i}\, x_i\right) \]

Do that for every one of the eighteen gyms, sum the log density across them, and that sum is a model's exact leave-one-out lppd, written elpd_loo.

```r
# Compute each model's exact leave-one-out predictive accuracy by refitting the closed-form posterior 18 times
loo_exact <- function(X, y, sigma) {
  n_obs <- length(y)
  out <- numeric(n_obs)
  for (i in 1:n_obs) {
    post_i <- bayes_lm_posterior(X[-i, , drop = FALSE], y[-i], sigma)
    mean_pred <- as.numeric(X[i, , drop = FALSE] %*% post_i$mu)
    var_pred <- sigma^2 + as.numeric(X[i, , drop = FALSE] %*% post_i$Sigma %*% t(X[i, , drop = FALSE]))
    out[i] <- dnorm(y[i], mean = mean_pred, sd = sqrt(var_pred), log = TRUE)
  }
  out
}

loo_i_A <- loo_exact(X_A, y_profit, sigma_hat)
loo_i_B <- loo_exact(X_B, y_profit, sigma_hat)
loo_i_C <- loo_exact(X_C, y_profit, sigma_hat)

elpd_loo_exact_A <- sum(loo_i_A)
elpd_loo_exact_B <- sum(loo_i_B)
elpd_loo_exact_C <- sum(loo_i_C)
round(c(A = elpd_loo_exact_A, B = elpd_loo_exact_B, C = elpd_loo_exact_C), 1)
#>      A      B      C
#> -109.2  -50.2  -51.0
```

These numbers are log densities, so less negative means better. Model A, with no predictors at all, scores -109.2. Model B jumps to -50.2 the moment memberships joins in. Model C, with floor size added on top, barely moves: -51.0, if anything a touch worse than Model B.

Every later number in this lesson gets checked against these three. Refitting eighteen times only worked because this posterior is closed form and nearly free to compute again; a model that needs a sampler to fit even once would make that refitting loop expensive, sometimes far too expensive to run eighteen times over. The next step builds the shortcut for exactly that case.

=== step === concept
## Approximating leave-one-out without refitting

Refitting eighteen times was only affordable here because the posterior has a formula. A model fit by a sampler instead might take minutes, or longer, for one fit alone, and eighteen refits would not be realistic.

So approximate the leave-one-out score from the single full-data posterior fit earlier, with no refitting at all. The idea is importance sampling: reweight the existing draws so they behave like draws from the posterior that never saw the held-out gym.

A draw that already predicted the held-out gym well under the full-data fit should count for less once that gym is removed, since removing it would pull the posterior away from exactly that draw. A draw that predicted the held-out gym poorly should count for more. That reweighting, worked through algebra, reduces to one clean number: score the held-out gym by the harmonic mean of its likelihood across the draws.

\[ \widehat{p}(y_i \mid y_{-i}) \approx \left(\frac{1}{S}\sum_{s=1}^{S} \frac{1}{p(y_i \mid \theta_s)}\right)^{-1} \]

```r
# Approximate leave-one-out accuracy from the single full-data fit, using importance weights
loo_importance_sampling <- function(X, y, draws, sigma) {
  n_obs <- length(y)
  out <- numeric(n_obs)
  for (i in 1:n_obs) {
    eta <- as.numeric(draws %*% X[i, ])
    likelihood <- dnorm(y[i], mean = eta, sd = sigma)
    out[i] <- log(1 / mean(1 / likelihood))
  }
  out
}

loo_is_i_A <- loo_importance_sampling(X_A, y_profit, beta_draws_A, sigma_hat)
loo_is_i_B <- loo_importance_sampling(X_B, y_profit, beta_draws_B, sigma_hat)
loo_is_i_C <- loo_importance_sampling(X_C, y_profit, beta_draws_C, sigma_hat)

elpd_loo_is_A <- sum(loo_is_i_A)
elpd_loo_is_B <- sum(loo_is_i_B)
elpd_loo_is_C <- sum(loo_is_i_C)
round(c(A = elpd_loo_is_A, B = elpd_loo_is_B, C = elpd_loo_is_C), 1)
#>      A      B      C
#> -109.3  -50.2  -51.0
round(c(A = elpd_loo_exact_A - elpd_loo_is_A, B = elpd_loo_exact_B - elpd_loo_is_B, C = elpd_loo_exact_C - elpd_loo_is_C), 2)
#>     A     B     C
#>  0.11  0.00 -0.04
```

No refitting happened at all, and the approximation still lands within about a tenth of the exact refitting numbers above, for every model.

This harmonic-mean estimator has a real weakness, though, worth naming honestly. If even one posterior draw assigns the held-out gym a tiny likelihood, its inverse is huge, and that one draw can dominate the whole average. The `loo` package handles this by fitting a Pareto distribution to the largest weights and smoothing them, instead of using the raw inverse weights directly. It is not yet a proven package to run in this browser, so here it is as reference only, to run locally.

```r-static
# Reference only: loo cannot yet run in this browser, so run this locally
suppressMessages(library(loo))

log_lik_B <- sapply(1:nrow(beta_draws_B), function(s) {
  dnorm(y_profit, mean = as.numeric(X_B %*% beta_draws_B[s, ]), sd = sigma_hat, log = TRUE)
})

loo(t(log_lik_B))
#> Computed from 2000 by 18 log-likelihood matrix.
#>
#>          Estimate  SE
#> elpd_loo    -50.2 2.4
#> p_loo         1.8 0.5
#> looic       100.4 4.8
#> ------
#> All Pareto k estimates are good (k < 0.7).
```

Run locally, `loo`'s own elpd_loo for Model B comes back at -50.2 with a standard error of 2.4, matching the hand-rolled numbers from this lesson almost exactly. Its Pareto k diagnostic also comes back good for every gym here, meaning the harmonic-mean estimator, in this particular dataset, was never actually unstable.

=== step === concept
## WAIC, a related approximation

**WAIC** is a second shortcut from the very same posterior draws, with no leave-one-out logic in it at all.

For each gym, average its density across the draws and take the log, exactly like lppd, then subtract a penalty: the variance of that gym's log-likelihood across the draws, an estimate of how much uncertainty that one gym is costing the model. Summed across all eighteen gyms, that is WAIC.

\[ \text{WAIC} = \sum_{i=1}^{n} \left[\log\left(\frac{1}{S}\sum_{s=1}^{S} p(y_i \mid \theta_s)\right) - \text{Var}_s\big(\log p(y_i \mid \theta_s)\big)\right] \]

```r
# Compute WAIC from the same posterior draws, no refitting needed
waic_calc <- function(X, y, draws, sigma) {
  n_obs <- length(y)
  lppd_i <- numeric(n_obs)
  p_waic_i <- numeric(n_obs)
  for (i in 1:n_obs) {
    eta <- as.numeric(draws %*% X[i, ])
    log_lik <- dnorm(y[i], mean = eta, sd = sigma, log = TRUE)
    lppd_i[i] <- log(mean(exp(log_lik)))
    p_waic_i[i] <- var(log_lik)
  }
  sum(lppd_i) - sum(p_waic_i)
}

elpd_waic_A <- waic_calc(X_A, y_profit, beta_draws_A, sigma_hat)
elpd_waic_B <- waic_calc(X_B, y_profit, beta_draws_B, sigma_hat)
elpd_waic_C <- waic_calc(X_C, y_profit, beta_draws_C, sigma_hat)

round(rbind(
  exact = c(A = elpd_loo_exact_A, B = elpd_loo_exact_B, C = elpd_loo_exact_C),
  importance_sampling = c(A = elpd_loo_is_A, B = elpd_loo_is_B, C = elpd_loo_is_C),
  waic = c(A = elpd_waic_A, B = elpd_waic_B, C = elpd_waic_C)
), 1)
#>                          A     B     C
#> exact               -109.2 -50.2 -51.0
#> importance_sampling -109.3 -50.2 -51.0
#> waic                -109.3 -50.2 -50.9
```

Three different routes to the same number, laid out side by side. Exact leave-one-out, the importance-sampling approximation, and WAIC all agree to within a tenth or two for every model. WAIC needed neither a refit nor an importance weight, just the same 2000 posterior draws already drawn earlier.

=== step === concept
## Comparing models with the standard error of the difference

Model B scored -50.2 and Model C scored -51.0. That is a real difference, but on its own it says nothing about whether it is a difference worth trusting.

Compare two models by their per-gym leave-one-out numbers directly, not just the totals. Subtract one model's eighteen values from the other's, gym by gym, and that gives eighteen paired differences, \(d_i\). Their sum is elpd_diff. Their spread tells you how much that sum could have come out differently with a different eighteen gyms.

\[ \text{elpd\_diff} = \sum_{i=1}^{n} d_i, \qquad \widehat{\text{se}} = \sqrt{n \cdot \text{Var}(d_i)} \]

```r
# Compare pairs of models: elpd_diff and its standard error
elpd_diff_se <- function(loo_vec_1, loo_vec_2) {
  pointwise_diff <- loo_vec_1 - loo_vec_2
  n_obs <- length(pointwise_diff)
  diff <- sum(pointwise_diff)
  se <- sqrt(n_obs * var(pointwise_diff))
  c(diff = diff, se = se, ratio = diff / se)
}

diff_B_minus_A <- elpd_diff_se(loo_i_B, loo_i_A)
diff_C_minus_B <- elpd_diff_se(loo_i_C, loo_i_B)
round(diff_B_minus_A, 2)
#>  diff    se ratio
#> 59.01 17.75  3.32
round(diff_C_minus_B, 2)
#>  diff    se ratio
#> -0.79  0.65 -1.22

# Each model's own elpd_loo carries a standard error too, the same formula applied to one model's 18 values instead of a difference
se_loo <- function(loo_vec) sqrt(length(loo_vec) * var(loo_vec))
round(c(A = se_loo(loo_i_A), B = se_loo(loo_i_B), C = se_loo(loo_i_C)), 1)
#>    A    B    C
#> 18.3  2.4  2.3

# Plot the 18 per-gym differences behind each comparison
stripchart(
  list(
    "B minus A" = loo_i_B - loo_i_A,
    "C minus B" = loo_i_C - loo_i_B
  ),
  method = "jitter", vertical = TRUE, pch = 16,
  ylab = "per-gym difference in log predictive density"
)
abline(h = 0, lty = 2)
```

Model B against Model A: a difference of 59.01, with a standard error of only 17.75. The difference is more than three times its own standard error, so this one is not close. Memberships genuinely helps.

Model C against Model B: a difference of -0.79, with a standard error of 0.65. The difference is barely bigger than its own standard error, barely over one ratio, which is nowhere near enough to call. The plot shows why: the eighteen "B minus A" dots sit consistently above zero, while the eighteen "C minus B" dots scatter tightly around it, some above and some below.

Each model's own elpd_loo has a standard error too, not just the differences between them: 18.3 for Model A, 2.4 for Model B, 2.3 for Model C. Model A's is by far the widest, because an intercept-only model misses most gyms by a lot and by wildly different amounts from gym to gym.

[KEY INSIGHT]
A gap between two elpd numbers only means something once you know its standard error. A gap several times its standard error is a real signal. A gap close to its own standard error is noise dressed up as a result, and floor size's -0.79 against a standard error of 0.65 is exactly that.

=== step === widget
## Reporting the comparison

Pull the real leave-one-out numbers computed earlier into one report-ready table: each model's leave-one-out score, its own standard error, and its difference and standard error against the best model in the set, Model B.

::widget styled-table {"cols":["model","elpd_loo","se","elpd_diff","se_diff"],"rows":[["A: intercept only",-109.2,18.3,-59.0,17.8],["B: plus memberships",-50.2,2.4,0.0,0.0],["C: plus memberships and floor size",-51.0,2.3,-0.8,0.6]],"title":"Model comparison by leave-one-out accuracy","note":"These are leave-one-out predictive numbers, not training fit."}

Toggle to the raw print and you see the same numbers a plain data frame would show. Toggle to the report table and the same numbers read the way you would hand them to someone else: which model is best, and by how much that gap could be expected to move around.

=== step === quiz
## Closing check: reading an elpd difference
::prose-only the quiz question is the content

From the table above, Model C's elpd_diff against Model B is -0.8, with a standard error of 0.6. What does that pairing actually say?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The data cannot distinguish the two models' predictive accuracy; the gap is small next to how much it could move around on a different set of gyms. ::ok Exactly. A gap of -0.8 against a standard error of 0.6 is well under two of its own standard errors, which is not enough to call one model better than the other. That is the honest conclusion of this whole lesson: Model C adds nothing the data can tell apart from Model B.
- Model C is definitely better because it uses more information. ::no Using one more predictor does not make a model better by itself. The elpd_diff number is the one that actually measures whether the extra predictor improved prediction, and here it did not, by enough to matter.
- Model B is definitely better because its number in the table is the larger one. ::no A larger elpd_loo on its own is not a verdict. The standard error next to the difference is what tells you whether that gap is bigger than noise, and here it is not.
- The comparison is meaningless because WAIC and the leave-one-out numbers are not identical. ::no WAIC and the leave-one-out numbers were never going to match to the decimal; they are two different approximations that agreed to within a tenth or two, which is the agreement this lesson was checking for. Meaninglessness is not the honest reading here; "too close to call" is.

=== step === tryit
## Your turn: compare Model A against Model C directly

Model A and Model C's per-gym leave-one-out log densities, `loo_i_A` and `loo_i_C`, already exist on the page. Reuse the exact elpd_diff and standard error formula taught earlier to compare them directly, something this lesson has not done yet.

```r
# Model A and Model C's per-gym leave-one-out log densities already exist on the page
pointwise_diff <- loo_i_C - loo_i_A

elpd_diff <- ____________        # sum the 18 values in pointwise_diff
se_diff   <- ____________        # sqrt of 18 times the variance of pointwise_diff

round(c(diff = elpd_diff, se = se_diff, ratio = elpd_diff / se_diff), 1)
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*sum[(]pointwise_diff[)])(?=[\\s\\S]*sqrt[(]18\\s*[*]\\s*var[(]pointwise_diff[)][)])", "gate": true, "difficulty": "intermediate", "ok": "Right: a difference of 58.2 against a standard error of 17.8, a ratio over three. Model C clearly beats Model A alone, which is no surprise since memberships is doing that work, the same predictor that beat Model A earlier in this lesson.", "no": "Reuse the earlier formula: elpd_diff is sum(pointwise_diff), and se_diff is sqrt(18 * var(pointwise_diff))."}
::solution
```r
# Reuse the exact elpd_diff / se formula taught earlier, for Model C minus Model A
pointwise_diff <- loo_i_C - loo_i_A

elpd_diff <- sum(pointwise_diff)
se_diff   <- sqrt(18 * var(pointwise_diff))

round(c(diff = elpd_diff, se = se_diff, ratio = elpd_diff / se_diff), 1)
#>  diff    se ratio
#>  58.2  17.8   3.3
```

A difference of 58.2 against a standard error of 17.8 is more than three times over, the same decisive margin Model B had against Model A earlier in this lesson. That is expected: memberships is the predictor doing the work in both Model B and Model C, and Model A has it in neither.

=== step === concept
## References
::prose-only the sources are text, not a visual

- [Practical Bayesian model evaluation using leave-one-out cross-validation and WAIC](https://doi.org/10.1007/s11222-016-9696-4) - Vehtari, A., Gelman, A., Gabry, J. (2017), Statistics and Computing, 27(5), 1413 to 1432. The paper behind this lesson's importance-weighted leave-one-out estimate and the `loo` package.
- Watanabe, S. (2010). Asymptotic equivalence of Bayes cross validation and widely applicable information criterion in singular learning theory. Journal of Machine Learning Research, 11, 3571 to 3594. The paper that introduced WAIC.
- [Understanding predictive information criteria for Bayesian models](https://doi.org/10.1007/s11222-013-9416-2) - Gelman, A., Hwang, J., Vehtari, A. (2014), Statistics and Computing, 24(6), 997 to 1016.
- Vehtari, A., Simpson, D., Gelman, A., Yao, Y., Gabry, J. (2024). Pareto smoothed importance sampling. Journal of Machine Learning Research, 25(72), 1 to 58. The method behind `loo`'s stabilized version of this lesson's hand-rolled importance weights.
- [Bayesian Data Analysis, 3rd edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, A., Carlin, J.B., Stern, H.S., Dunson, D.B., Vehtari, A., Rubin, D.B. (2013), CRC Press, Chapter 7. The standard reference for predictive model comparison.

=== step === complete
## Comparing models by predictive accuracy
::prose-only closing summary

Here is what the three models actually showed.

- Training fit, R-squared, only ever rose as predictors were added, even one with no real effect, which is why it could never have been the judge.
- Predictive accuracy on held-out gyms, lppd and its leave-one-out version, is the number that actually decides. You computed it two ways, by refitting eighteen times and by reweighting a single fit, and the two agreed closely. WAIC, a third and cheaper route, agreed with both.
- Model B beat Model A by 59.01 against a standard error of 17.75, a real, decisive gap. Model C beat Model B by -0.79 against a standard error of 0.65, a gap too small to call anything at all.

So the honest verdict is this: memberships sold predicts a gym's profit about as well on its own as it does together with floor size. Floor size is not pulling its weight, and only the standard error of the difference was able to say so with any confidence.
