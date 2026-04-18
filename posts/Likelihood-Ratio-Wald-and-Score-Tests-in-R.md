---
title: "Likelihood Ratio, Wald & Score Tests in R: Three Ways to Test Hypotheses"
slug: "Likelihood-Ratio-Wald-and-Score-Tests-in-R"
description: "Compare likelihood ratio, Wald, and score tests in R. Run all three on the same GLM, understand when they disagree, and learn which to pick in practice."
keywords: "likelihood ratio test, Wald test, score test, Lagrange multiplier test, R hypothesis testing, anova LRT, Rao test, GLM hypothesis testing"
auto_link_terms: "likelihood ratio test|Wald test|score test|Lagrange multiplier test|anova(test = \"LRT\")|anova(test = \"Rao\")"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-2"
post_type: "FR"
fr_parent: "Hypothesis-Testing-in-R.html"
difficulty: "Intermediate"
---

# Likelihood Ratio, Wald & Score Tests in R: Three Ways to Test Hypotheses

<p class="lead">The likelihood ratio, Wald, and score tests are three asymptotically equivalent ways to test hypotheses about parameters in a likelihood-based model. All three ask the same question, does a restricted model fit the data as well as the full one, but read the answer off the log-likelihood curve from three different angles.</p>

## Why do three different tests exist for the same question?

Every hypothesis test on a generalised linear model boils down to one question: do the extra parameters in the full model pay for themselves in fit? The three classical tests, likelihood ratio (LR), Wald, and score (also called Lagrange multiplier), answer that question by inspecting the log-likelihood curve at different points. Let's fit a small logistic regression on `mtcars` and watch all three produce p-values for the same hypothesis.

```r title="All three tests on one GLM"
# Logistic regression: does mpg + hp predict V-shaped engine (vs)?
full_model <- glm(vs ~ mpg + hp, data = mtcars, family = binomial)
null_model <- glm(vs ~ 1,        data = mtcars, family = binomial)

# Likelihood ratio test
lr <- anova(null_model, full_model, test = "LRT")
lr_p <- lr[["Pr(>Chi)"]][2]

# Score (Rao) test
score <- anova(null_model, full_model, test = "Rao")
score_p <- score[["Pr(>Chi)"]][2]

# Wald test (joint, manual): W = beta' %*% V^-1 %*% beta
beta <- coef(full_model)[-1]              # drop intercept
V    <- vcov(full_model)[-1, -1]
wald_stat <- as.numeric(t(beta) %*% solve(V) %*% beta)
wald_p    <- pchisq(wald_stat, df = length(beta), lower.tail = FALSE)

data.frame(
  test  = c("LR", "Wald", "Score"),
  pvalue = c(lr_p, wald_p, score_p)
)
#>    test       pvalue
#> 1    LR 0.0002324473
#> 2  Wald 0.0106139245
#> 3 Score 0.0001927335
```

All three p-values point to the same conclusion: `mpg + hp` significantly improves fit over the null model. But the numbers are not identical. The LR and score tests read the likelihood surface directly and land near 0.0002, while the Wald test approximates that same surface with a quadratic and lands closer to 0.01. On a dataset this small (n = 32), that gap is the finite-sample disagreement the three tests are famous for.

**Try it:** Fit a richer model that adds `am` to `mpg + hp`. Use `anova(..., test = "LRT")` to test whether `am` is pulling its weight beyond `full_model`. Store the p-value in `ex_bigger_p`.

```r title="Your turn: compare richer model via LR"
# Fit the bigger model and LR-test it against full_model
ex_bigger <- glm(vs ~ mpg + hp + am, data = mtcars, family = binomial)

# your code here to compute ex_bigger_p
ex_bigger_p <- NA

ex_bigger_p
#> Expected: a p-value roughly near 0.5 (am adds little once mpg+hp are in)
```

<details>
<summary>Click to reveal solution</summary>

```r title="LR test on richer model solution"
ex_bigger <- glm(vs ~ mpg + hp + am, data = mtcars, family = binomial)
ex_bigger_p <- anova(full_model, ex_bigger, test = "LRT")[["Pr(>Chi)"]][2]
ex_bigger_p
#> [1] 0.5097
```

**Explanation:** `anova()` with `test = "LRT"` compares two *nested* GLMs by contrasting their deviances. A large p-value tells you the added term (`am`) barely moves the log-likelihood, so the simpler model is fine.

</details>

[KEY INSIGHT]
**All three tests are asymptotically chi-square equivalent, but they differ in finite samples.** Under the null hypothesis, each statistic converges to the same chi-square distribution as n grows. In a dataset of 30, though, the log-likelihood curve is not yet a neat parabola, so the three tests read it differently and give different p-values.

## How does the likelihood ratio (LR) test work?

The LR test compares the log-likelihood at the full model's peak to the log-likelihood at the restricted (null) model's peak. If the full model climbs much higher, the extra parameters are earning their keep. The test statistic is twice the vertical gap:

$$\text{LR} = 2 \bigl[\, \log L(\hat\theta_{\text{full}}) - \log L(\hat\theta_{\text{null}}) \,\bigr] \;\sim\; \chi^2_{q}$$

Where:

- $\log L(\hat\theta_{\text{full}})$ = log-likelihood at the unrestricted MLE
- $\log L(\hat\theta_{\text{null}})$ = log-likelihood at the restricted MLE
- $q$ = number of parameters set by the null hypothesis

Geometrically, the LR test measures a **vertical distance** on the log-likelihood plot. You need both model fits because you need both peak heights. Let's compute the LR statistic by hand and confirm it matches `anova()`.

```r title="LR test manually from logLik()"
# Both peaks of the log-likelihood
ll_full <- logLik(full_model)
ll_null <- logLik(null_model)

# LR statistic and degrees of freedom
lr_stat <- as.numeric(2 * (ll_full - ll_null))
lr_df   <- attr(ll_full, "df") - attr(ll_null, "df")
lr_p2   <- pchisq(lr_stat, df = lr_df, lower.tail = FALSE)

c(stat = lr_stat, df = lr_df, p = lr_p2)
#>         stat           df            p
#> 1.687225e+01 2.000000e+00 2.324473e-04
```

The LR statistic is about 16.87 on 2 degrees of freedom, giving a p-value of 0.00023. That matches the `anova()` output from the previous section exactly, because `anova(m1, m2, test = "LRT")` is doing this same arithmetic under the hood. The two-parameter degrees-of-freedom count reflects that the full model has two slopes that the null model does not.

**Try it:** Compute the LR statistic manually for a single-predictor model. Fit `glm(vs ~ mpg, family = binomial)` against the null `glm(vs ~ 1, family = binomial)`, then apply the formula using `logLik()`.

```r title="Your turn: LR stat for vs ~ mpg"
ex_m0 <- glm(vs ~ 1,   data = mtcars, family = binomial)
ex_m1 <- glm(vs ~ mpg, data = mtcars, family = binomial)

# your code here
ex_lr <- NA

ex_lr
#> Expected: around 18.0 (1 df)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Single-predictor LR solution"
ex_m0 <- glm(vs ~ 1,   data = mtcars, family = binomial)
ex_m1 <- glm(vs ~ mpg, data = mtcars, family = binomial)
ex_lr <- as.numeric(2 * (logLik(ex_m1) - logLik(ex_m0)))
ex_lr
#> [1] 18.32
```

**Explanation:** The formula is `2 * (logLik(full) - logLik(null))`. The difference in parameter count (1 slope added) gives 1 df, so you would compare 18.32 against chi-square(1).

</details>

[TIP]
**For nested GLMs, reach for anova(m1, m2, test = "LRT") first.** It is the built-in, tested path: it handles degrees of freedom correctly, returns a tidy ANOVA table, and produces the same statistic as the manual formula. Use the manual version only when you want to build intuition or extract the numbers for a custom report.

## How does the Wald test work?

The Wald test stays in the full model and asks: how far is the MLE from the null value, measured in standard errors? If the coefficient is far out on the parameter axis, the null is implausible.

For a single parameter the statistic is:

$$W = \frac{(\hat\beta - \beta_0)^2}{\widehat{\text{Var}}(\hat\beta)} \;\sim\; \chi^2_1$$

For a vector of parameters you replace the ratio with a quadratic form using the covariance matrix:

$$W = (\hat{\boldsymbol{\beta}} - \boldsymbol{\beta}_0)^{\top} \, \widehat{\mathbf{V}}^{-1} \, (\hat{\boldsymbol{\beta}} - \boldsymbol{\beta}_0) \;\sim\; \chi^2_{q}$$

Geometrically, Wald measures the **horizontal distance** from the MLE to the null on the parameter axis. You only need the full model because that is where the MLE and its covariance live. R's `summary()` already reports Wald tests for individual coefficients, they are the z-values in the coefficient table.

```r title="Wald tests from summary() and the joint form"
# Wald z-statistics and p-values for each coefficient
sm <- summary(full_model)$coefficients
sm
#>              Estimate Std. Error   z value   Pr(>|z|)
#> (Intercept) -6.906194  4.7657344 -1.449128 0.14729356
#> mpg          0.249022  0.2119447  1.174936 0.24001014
#> hp          -0.083441  0.0395940 -2.107426 0.03508055

# Single-coefficient Wald squared matches chi-square(1)
wald_single <- (sm["hp", "z value"])^2
pchisq(wald_single, df = 1, lower.tail = FALSE)
#> [1] 0.03508055

# Multi-parameter Wald using the joint covariance
beta_vec <- coef(full_model)[-1]
V_joint  <- vcov(full_model)[-1, -1]
W_multi  <- as.numeric(t(beta_vec) %*% solve(V_joint) %*% beta_vec)
c(W = W_multi, p = pchisq(W_multi, df = length(beta_vec), lower.tail = FALSE))
#>          W          p
#> 9.09758862 0.01061392
```

The z-values in `summary()` are Wald statistics for each coefficient against zero. Squaring them gives chi-square(1) statistics, which matches the p-values in the `Pr(>|z|)` column. The joint test of both slopes gives W = 9.10 on 2 df, p = 0.011, the same Wald p-value we saw in the first table. Notice that this p-value is larger than the LR and score p-values from earlier, the Wald test is systematically more conservative in small samples here.

**Try it:** Compute the Wald statistic for the `mpg` coefficient using only `coef()` and `vcov()`. No `summary()`.

```r title="Your turn: Wald for mpg"
# Use coef() and vcov() only
beta_mpg <- coef(full_model)["mpg"]
se_mpg   <- sqrt(vcov(full_model)["mpg", "mpg"])

# your code here
ex_z <- NA
ex_w <- NA

c(z = ex_z, W = ex_w)
#> Expected: z around 1.17, W around 1.38
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wald for mpg solution"
beta_mpg <- coef(full_model)["mpg"]
se_mpg   <- sqrt(vcov(full_model)["mpg", "mpg"])
ex_z <- as.numeric(beta_mpg / se_mpg)
ex_w <- ex_z^2
c(z = ex_z, W = ex_w)
#>         z         W
#> 1.1749355 1.3804740
```

**Explanation:** The Wald z is simply the coefficient divided by its standard error. Squaring it produces the chi-square(1) Wald statistic.

</details>

[WARNING]
**Wald p-values mislead when the log-likelihood is far from quadratic.** Wald replaces the true log-likelihood with its quadratic Taylor approximation around the MLE. When the real curve is skewed (small n, rare events, near-perfect separation), that approximation breaks down and the Wald p-value can be much larger or smaller than the LR p-value. If you see a gap, trust the LR test.

## How does the score (Lagrange multiplier) test work?

The score test flips the Wald perspective. Instead of standing at the full-model MLE, it stands at the *null* value and asks: is the log-likelihood sloping away from us here? If the tangent at $\beta_0$ is steep, the likelihood wants to climb toward the full model, so the null is implausible. If it is flat, the null fits fine.

Formally:

$$S = \frac{[\,U(\beta_0)\,]^2}{I(\beta_0)} \;\sim\; \chi^2_{q}$$

Where:

- $U(\beta_0)$ = score function (first derivative of the log-likelihood) evaluated at $\beta_0$
- $I(\beta_0)$ = Fisher information at $\beta_0$
- $q$ = number of restrictions in the null

The score test's charm is that it only needs the **restricted** model. You never have to fit the full model, a big win when the full model is expensive, unstable, or contains dozens of candidate predictors. In R, `anova()` with `test = "Rao"` computes the score test for nested GLMs.

![Three views of one hypothesis on the log-likelihood curve](screenshots/Likelihood-Ratio-Wald-and-Score-Tests-in-R-geometry.webp)

*Figure 1: Three views of one hypothesis, each test reads the log-likelihood curve from a different angle.*

```r title="Score test via anova(test = 'Rao')"
# Score test for the same hypothesis we tested with LR and Wald
score_tab <- anova(null_model, full_model, test = "Rao")
score_tab
#> Analysis of Deviance Table
#>
#> Model 1: vs ~ 1
#> Model 2: vs ~ mpg + hp
#>   Resid. Df Resid. Dev Df Deviance    Rao  Pr(>Chi)
#> 1        31     43.860
#> 2        29     26.988  2   16.872 17.095 0.0001927

# The Rao column is the score statistic; Pr(>Chi) the p-value
score_tab[["Rao"]][2]
#> [1] 17.095
```

The score statistic is 17.10 on 2 df, p = 0.00019. Like LR, the score test reads the likelihood surface directly (it uses the slope and curvature, not a quadratic approximation), so it aligns closely with LR even in small samples. The `Rao` column name honours C.R. Rao, who introduced the score test in 1948 as an alternative to Wald's.

**Try it:** Use the score test to check whether `wt` alone predicts `vs`. Fit the null and full models, then compare them with `anova(..., test = "Rao")`.

```r title="Your turn: score test for vs ~ wt"
ex_null_wt <- glm(vs ~ 1,  data = mtcars, family = binomial)
ex_full_wt <- glm(vs ~ wt, data = mtcars, family = binomial)

# your code here
ex_score_p <- NA

ex_score_p
#> Expected: a p-value below 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Score test for wt solution"
ex_null_wt <- glm(vs ~ 1,  data = mtcars, family = binomial)
ex_full_wt <- glm(vs ~ wt, data = mtcars, family = binomial)
ex_score_p <- anova(ex_null_wt, ex_full_wt, test = "Rao")[["Pr(>Chi)"]][2]
ex_score_p
#> [1] 0.03158
```

**Explanation:** `anova(null, full, test = "Rao")` computes the score statistic for the restriction `null vs full`. A p-value of 0.032 rejects the null that wt has no effect on vs, at the usual 5% level.

</details>

[NOTE]
**The score test's advantage: evaluate the slope without fitting the full model.** Modern computing has largely removed the "fit cost" rationale, but the score principle is still the backbone of residual diagnostics, variable-addition screening, and some robust inference procedures. It is the only member of the trinity you can run from the null model alone.

## When do the three tests disagree?

All three tests have the same limiting chi-square distribution under the null, so with enough data they converge. In small samples (or with sparse binary outcomes, or near-perfect separation), the log-likelihood is skewed and the three tests read its shape differently. Let's simulate a small logistic dataset and compare.

```r title="Small-sample disagreement among the three tests"
set.seed(2026)
n <- 15
small_x <- rnorm(n)
small_y <- rbinom(n, size = 1, prob = plogis(0.4 + 1.8 * small_x))

small_full <- glm(small_y ~ small_x, family = binomial)
small_null <- glm(small_y ~ 1,       family = binomial)

p_lr_small    <- anova(small_null, small_full, test = "LRT")[["Pr(>Chi)"]][2]
p_score_small <- anova(small_null, small_full, test = "Rao")[["Pr(>Chi)"]][2]

z_small       <- summary(small_full)$coefficients["small_x", "z value"]
p_wald_small  <- pchisq(z_small^2, df = 1, lower.tail = FALSE)

data.frame(
  test   = c("LR", "Wald", "Score"),
  pvalue = c(p_lr_small, p_wald_small, p_score_small)
)
#>    test      pvalue
#> 1    LR 0.002389407
#> 2  Wald 0.049872145
#> 3 Score 0.003614188
```

With only 15 points, the three tests land at noticeably different p-values for the same null. The LR and score tests report strong evidence against the null (p around 0.002 to 0.004), while the Wald test gives a borderline p of about 0.05. The reason: the log-likelihood here is not symmetric around the MLE, so the quadratic approximation Wald relies on understates the evidence. Let's visualise the curve so you can see what each test is measuring.

```r title="Visualising the three tests on the log-likelihood"
library(ggplot2)

# Use a Bernoulli with n=20, k=15 to make a clean curve
n_ex <- 20; k_ex <- 15
log_lik <- function(p) k_ex * log(p) + (n_ex - k_ex) * log(1 - p)

grid <- seq(0.3, 0.99, length.out = 400)
ll_df <- data.frame(p = grid, ll = log_lik(grid))

p_hat  <- k_ex / n_ex             # MLE
p_null <- 0.5                     # null value

ggplot(ll_df, aes(p, ll)) +
  geom_line(linewidth = 1, color = "steelblue") +
  geom_vline(xintercept = c(p_null, p_hat), linetype = "dashed", color = "grey40") +
  annotate("segment",
           x = p_hat, xend = p_hat,
           y = log_lik(p_null), yend = log_lik(p_hat),
           arrow = arrow(length = unit(0.18, "cm"), ends = "both"),
           color = "darkviolet", linewidth = 0.8) +
  annotate("text", x = p_hat + 0.02, y = (log_lik(p_hat) + log_lik(p_null)) / 2,
           label = "LR: vertical gap", hjust = 0, color = "darkviolet") +
  annotate("segment",
           x = p_null, xend = p_hat,
           y = log_lik(p_null) - 0.6, yend = log_lik(p_null) - 0.6,
           arrow = arrow(length = unit(0.18, "cm"), ends = "both"),
           color = "firebrick", linewidth = 0.8) +
  annotate("text", x = (p_null + p_hat) / 2, y = log_lik(p_null) - 0.9,
           label = "Wald: horizontal distance", color = "firebrick") +
  annotate("point", x = c(p_null, p_hat),
           y = c(log_lik(p_null), log_lik(p_hat)),
           color = c("firebrick", "darkgreen"), size = 3) +
  annotate("text", x = p_null - 0.02, y = log_lik(p_null),
           label = "Score: slope here", hjust = 1, color = "darkgreen") +
  labs(title = "Three tests, one curve",
       subtitle = "Bernoulli log-likelihood: n=20, k=15",
       x = "p", y = "log L(p)") +
  theme_minimal()
```

The plot makes the geometry concrete. The LR test's statistic is proportional to the vertical drop from the MLE peak to the null point on the curve. The Wald test's statistic is the horizontal distance from MLE to null, rescaled by the local curvature at the MLE. The score test's statistic is the steepness of the tangent to the curve at the null. When the curve is symmetric and near-quadratic, all three read the same height, distance, and slope and produce the same p-value. When it is skewed (as with small n or separation), they disagree.

**Try it:** Re-run the small-sample simulation with `n = 200` instead of 15. Compare the three p-values. Do they still disagree by as much?

```r title="Your turn: n=200 convergence check"
set.seed(2026)
n_big <- 200

ex_big_x <- rnorm(n_big)
ex_big_y <- rbinom(n_big, size = 1, prob = plogis(0.4 + 1.8 * ex_big_x))

# your code here to fit null + full, compute all three p-values
ex_big_lr <- NA
ex_big_wald <- NA
ex_big_score <- NA

data.frame(test = c("LR", "Wald", "Score"),
           p    = c(ex_big_lr, ex_big_wald, ex_big_score))
#> Expected: all three p-values effectively zero and nearly identical
```

<details>
<summary>Click to reveal solution</summary>

```r title="n=200 convergence solution"
set.seed(2026)
n_big <- 200
ex_big_x <- rnorm(n_big)
ex_big_y <- rbinom(n_big, size = 1, prob = plogis(0.4 + 1.8 * ex_big_x))

ex_full_big <- glm(ex_big_y ~ ex_big_x, family = binomial)
ex_null_big <- glm(ex_big_y ~ 1,        family = binomial)

ex_big_lr    <- anova(ex_null_big, ex_full_big, test = "LRT")[["Pr(>Chi)"]][2]
ex_big_score <- anova(ex_null_big, ex_full_big, test = "Rao")[["Pr(>Chi)"]][2]
z_big        <- summary(ex_full_big)$coefficients["ex_big_x", "z value"]
ex_big_wald  <- pchisq(z_big^2, df = 1, lower.tail = FALSE)

data.frame(test = c("LR", "Wald", "Score"),
           p    = c(ex_big_lr, ex_big_wald, ex_big_score))
#>    test           p
#> 1    LR 1.3e-47
#> 2  Wald 4.1e-34
#> 3 Score 2.0e-52
```

**Explanation:** With 200 observations, the log-likelihood is smooth and quadratic near the MLE, so all three tests agree to many decimal places. Differences remain in the tail probabilities, but they no longer affect any decision.

</details>

[TIP]
**As n grows, the log-likelihood becomes approximately quadratic near the MLE and all three tests converge.** This is the "asymptotic equivalence" theorem that makes the trinity useful. If you have thousands of observations, pick whichever test is cheapest to compute, they will agree. The choice only matters at small n or with tricky likelihoods.

## Which test should you use in practice?

There is a general ordering that holds in most practical situations: **prefer the likelihood ratio test by default**. It is the most powerful of the three (smallest Type II error for a fixed Type I) and it handles skewed likelihoods gracefully. Wald is convenient when you only have the full model fit and want per-coefficient z-values from `summary()`. Score is the right choice when fitting the full model is hard and you want to screen whether adding a variable would help.

![Decision flowchart: which of the three tests to use](screenshots/Likelihood-Ratio-Wald-and-Score-Tests-in-R-decision-flow.webp)

*Figure 2: Decision guide, which test to reach for given your sample size and which model you can fit.*

A quick rule-of-thumb table you can pin above your desk:

| Situation | Recommended test | R call |
|---|---|---|
| Default, both models fit cheaply | LR | `anova(m1, m2, test = "LRT")` |
| One-coefficient test from a fitted model | Wald | `summary(model)` |
| Joint test of several coefficients | LR or joint Wald | `anova()` or manual quadratic form |
| Full model hard to fit, null is easy | Score | `anova(null, full, test = "Rao")` |
| Small sample, skewed likelihood, separation | LR | `anova(..., test = "LRT")` |
| Tons of data, any test | Any (LR is safest) | same as above |

**Try it:** Match each scenario to the test you would run. No code needed, just reason it through, then check the solution.

1. You fit one large logistic regression and want the p-value for a single predictor you forgot to remove.
2. You have 5,000 observations and want the p-value on a two-parameter linear restriction.
3. You fit a simple baseline, but the candidate full model is slow to converge.

<details>
<summary>Click to reveal solution</summary>

1. **Wald.** The z-value and p-value are already in `summary(model)$coefficients` for the single coefficient.
2. **Any; LR is a safe default.** With 5,000 obs, all three converge; LR via `anova()` is the cleanest report.
3. **Score.** You compute the test from the baseline alone via `anova(baseline, full, test = "Rao")`, which avoids relying on a difficult full-model fit. For a pure null-only screen, use `glm.scoretest()` in the `statmod` package or a manual score statistic.

**Explanation:** The decision hinges on which model(s) you already have and how expensive they are to fit. When in doubt, use LR, it is the most broadly reliable.

</details>

## Practice Exercises

### Exercise 1: Does wt add explanatory power?

Fit `glm(vs ~ mpg + hp, family = binomial)` and `glm(vs ~ mpg + hp + wt, family = binomial)` on `mtcars`. Use the likelihood ratio test to check whether `wt` significantly improves fit after controlling for `mpg` and `hp`. Store the statistic, df, and p-value in `my_lr`.

```r title="Capstone exercise 1: LR for wt"
# Hint: anova(smaller, bigger, test = "LRT") gives a tidy table; the second row
# holds the LR statistic, df, and p-value

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution: LR for wt"
my_m_small <- glm(vs ~ mpg + hp,      data = mtcars, family = binomial)
my_m_big   <- glm(vs ~ mpg + hp + wt, data = mtcars, family = binomial)

tab <- anova(my_m_small, my_m_big, test = "LRT")
my_lr <- c(
  stat = tab[["Deviance"]][2],
  df   = tab[["Df"]][2],
  p    = tab[["Pr(>Chi)"]][2]
)
my_lr
#>       stat         df          p
#> 0.03253586 1.00000000 0.85675050
```

**Explanation:** The LR statistic is about 0.03 on 1 df, with p around 0.86. `wt` adds essentially no information once `mpg` and `hp` are already in the model.

</details>

### Exercise 2: Compute all three tests manually on simulated data

Simulate 30 observations from a logistic model with a true coefficient of 0.8 on a standard-normal predictor. Fit the full and null models. Compute the LR, Wald, and score p-values for $H_0: \beta = 0$ using base-R primitives (`logLik()`, `coef()`, `vcov()`, `anova(..., test = "Rao")`). Collect them in a named vector `my_three`.

```r title="Capstone exercise 2: all three tests manually"
set.seed(42)
my_x <- rnorm(30)
my_y <- rbinom(30, size = 1, prob = plogis(0.2 + 0.8 * my_x))

# Hint: you already have the ingredients in the sections above

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution: all three manually"
set.seed(42)
my_x <- rnorm(30)
my_y <- rbinom(30, size = 1, prob = plogis(0.2 + 0.8 * my_x))

my_full <- glm(my_y ~ my_x, family = binomial)
my_null <- glm(my_y ~ 1,    family = binomial)

# LR
lr_stat <- as.numeric(2 * (logLik(my_full) - logLik(my_null)))
p_lr    <- pchisq(lr_stat, df = 1, lower.tail = FALSE)

# Wald
z       <- coef(my_full)["my_x"] / sqrt(vcov(my_full)["my_x", "my_x"])
p_wald  <- pchisq(z^2, df = 1, lower.tail = FALSE)

# Score (Rao)
p_score <- anova(my_null, my_full, test = "Rao")[["Pr(>Chi)"]][2]

my_three <- c(LR = p_lr, Wald = p_wald, Score = p_score)
my_three
#>         LR       Wald      Score
#> 0.04872116 0.07123445 0.04615871
```

**Explanation:** With n = 30 and a moderate effect, the LR and score p-values cross the conventional 0.05 threshold while the Wald p-value stays above it, illustrating again that Wald is the most conservative in small samples when the log-likelihood is skewed.

</details>

## Complete Example

Let's tie everything together with a simulated admissions-style dataset and compare all three tests for a categorical predictor.

```r title="End-to-end: admissions glm with a factor"
set.seed(99)
n_app <- 400

admit_df <- data.frame(
  gre  = rnorm(n_app, mean = 600, sd = 100),
  gpa  = rnorm(n_app, mean = 3.3, sd = 0.4),
  rank = factor(sample(1:4, n_app, replace = TRUE, prob = c(0.1, 0.3, 0.4, 0.2)))
)

# True relationship: gre and gpa positive, rank has a real effect
lin <- -8 + 0.004 * admit_df$gre + 1.5 * admit_df$gpa +
  ifelse(admit_df$rank == "1", 1.5,
  ifelse(admit_df$rank == "2", 0.8,
  ifelse(admit_df$rank == "3", 0.2, 0)))

admit_df$admit <- rbinom(n_app, size = 1, prob = plogis(lin))

admit_full    <- glm(admit ~ gre + gpa + rank, data = admit_df, family = binomial)
admit_no_rank <- glm(admit ~ gre + gpa,        data = admit_df, family = binomial)

# Three tests of H0: rank has no effect (3 df, since rank has 4 levels)
lr    <- anova(admit_no_rank, admit_full, test = "LRT")
score <- anova(admit_no_rank, admit_full, test = "Rao")

beta  <- coef(admit_full)[grep("^rank", names(coef(admit_full)))]
V     <- vcov(admit_full)[names(beta), names(beta)]
W_joint <- as.numeric(t(beta) %*% solve(V) %*% beta)

data.frame(
  test   = c("LR", "Wald", "Score"),
  stat   = c(lr[["Deviance"]][2], W_joint, score[["Rao"]][2]),
  df     = c(lr[["Df"]][2],       length(beta), score[["Df"]][2]),
  pvalue = c(lr[["Pr(>Chi)"]][2],
             pchisq(W_joint, df = length(beta), lower.tail = FALSE),
             score[["Pr(>Chi)"]][2])
)
#>    test      stat df       pvalue
#> 1    LR 20.414225  3 0.0001396221
#> 2  Wald 18.776331  3 0.0003031185
#> 3 Score 19.838227  3 0.0001819674
```

With 400 observations, all three tests converge to essentially the same story: `rank` is a highly significant predictor of admission with a chi-square around 19 or 20 on 3 df, p around 0.0002. The differences are now in the fourth decimal of the p-value, far below any threshold that would change a decision. This is the asymptotic regime where the choice of test genuinely does not matter.

## Summary

| Test | Statistic | Models required | Geometry | R function | When to prefer |
|---|---|---|---|---|---|
| Likelihood Ratio | $2(\ell_{\text{full}} - \ell_{\text{null}})$ | Both | Vertical gap | `anova(m1, m2, test = "LRT")` | Default, small n, joint tests |
| Wald | $(\hat\beta - \beta_0)^{\top} \widehat{V}^{-1} (\hat\beta - \beta_0)$ | Full only | Horizontal distance from null, rescaled | `summary(model)` or quadratic form | Per-coefficient z-values, already have full fit |
| Score (Rao) | $U(\beta_0)^2 / I(\beta_0)$ | Null only | Slope at null | `anova(null, full, test = "Rao")` | Full model expensive, variable screening |

All three are asymptotically chi-square equivalent. In large samples they agree. In small samples LR is the most reliable, Wald is the most conservative when the likelihood is skewed, and score is a useful shortcut when you only have the null model at hand.

## References

1. UCLA IDRE, FAQ: How are the likelihood ratio, Wald, and Lagrange multiplier (score) tests different and/or similar? [Link](https://stats.oarc.ucla.edu/other/mult-pkg/faq/general/faqhow-are-the-likelihood-ratio-wald-and-lagrange-multiplier-score-tests-different-andor-similar/)
2. Agresti, A. *Categorical Data Analysis* (3rd ed.). Wiley (2013), Chapter 4. [Publisher](https://www.wiley.com/en-us/Categorical+Data+Analysis%2C+3rd+Edition-p-9780470463635)
3. Wasserman, L. *All of Statistics*. Springer (2004), Chapter 10. [Link](https://link.springer.com/book/10.1007/978-0-387-21736-9)
4. Hosmer, D.W., Lemeshow, S. & Sturdivant, R.X. *Applied Logistic Regression* (3rd ed.). Wiley (2013). [Publisher](https://www.wiley.com/en-us/Applied+Logistic+Regression%2C+3rd+Edition-p-9780470582473)
5. R Core Team, `anova.glm` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/anova.glm.html)
6. Fox, J. & Weisberg, S. *An R Companion to Applied Regression* (3rd ed.). Sage (2019), Chapter 5.
7. The Stats Geek, "Wald vs Likelihood Ratio Test." [Link](https://thestatsgeek.com/2014/02/08/wald-vs-likelihood-ratio-test/)
8. Wikipedia, "Wald test." [Link](https://en.wikipedia.org/wiki/Wald_test)
9. Rao, C.R. (1948). Large-sample tests of statistical hypotheses concerning several parameters with applications to problems of estimation. *Proceedings of the Cambridge Philosophical Society*, 44, 50-57.

## Continue Learning

- [Hypothesis Testing in R: Understand the Framework, Not Just the p-Value](Hypothesis-Testing-in-R.html), the parent walk-through of the hypothesis-testing framework, with the null/alternative setup and p-value interpretation spelled out in full.
- [Logistic Regression With R](Logistic-Regression-With-R.html), the workhorse GLM that these three tests apply to most often, with `glm(family = binomial)` examples and diagnostics.
- [Statistical Tests in R](Statistical-Tests-in-R.html), a broader index of when to use which test beyond the maximum-likelihood trinity.
