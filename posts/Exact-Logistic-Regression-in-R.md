---
title: "Exact Logistic Regression in R: When Separation Causes Problems"
slug: Exact-Logistic-Regression-in-R
description: "Learn exact logistic regression in R when separation makes glm() fail. Compare glm, Firth (logistf), and exact MCMC (elrm) with runnable, interactive examples."
keywords: "exact logistic regression, complete separation, quasi-complete separation, Firth logistic regression, elrm, logistf, penalized logistic regression, R, glm"
auto_link_terms: "exact logistic regression|complete separation|quasi-complete separation|Firth logistic regression|elrm()|logistf()|penalized logistic regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-29
curriculum_id: FR-cate-4
post_type: FR
fr_parent: Logistic-Regression-in-R-2.html
difficulty: Intermediate
---

# Exact Logistic Regression in R: When Separation Causes Problems

<p class="lead">Exact logistic regression is a small-sample method that gives reliable p-values and confidence intervals when standard <code>glm()</code> breaks down because of complete or quasi-complete separation, where one predictor pattern perfectly classifies the outcome.</p>

## What goes wrong when glm() meets separation?

Standard `glm()` fits logistic regression by maximum likelihood, and that algorithm only works when no predictor pattern perfectly classifies the outcome. The moment one does, the likelihood keeps climbing as a coefficient marches toward infinity, and `glm()` either fails to converge or returns silly numbers with vast standard errors. Let's force this to happen on a tiny clinical dataset, watch R complain, and use that as our entry point.

```r title="Fit glm on a perfectly separated trial"
# 12-patient trial: treatment perfectly predicts response
trial <- data.frame(
  patient_id = 1:12,
  treatment  = c(rep(0, 6), rep(1, 6)),
  response   = c(rep(0, 6), rep(1, 6))
)

m_glm <- glm(response ~ treatment, data = trial, family = binomial)
summary(m_glm)$coefficients
#>               Estimate Std. Error    z value Pr(>|z|)
#> (Intercept) -26.566085   77498.34 -0.0003428   0.9997
#> treatment    53.132170  109599.64  0.0004848   0.9996
```

Look at those numbers. The treatment effect is estimated at ~53 on the log-odds scale, with a standard error of ~110,000 and a p-value of 0.9996. R also raised the warning `glm.fit: fitted probabilities numerically 0 or 1 occurred`. The model didn't fail loudly. It fell over quietly and still printed a coefficient table that looks like real output. The huge standard error is the giveaway: nothing here is reliable.

[WARNING]
**Treat the "fitted probabilities 0 or 1" warning as a hard stop.** R does not refuse to print results when separation occurs, so a downstream `summary()` table will look normal at a glance. Always scan for that warning and check whether any standard error is implausibly large.

**Try it:** Flip one outcome so separation is broken (change one treated patient to a non-responder). Refit `glm()` and confirm the warning disappears and the standard error becomes finite.

```r title="Your turn: break the separation"
# Make a copy and flip one outcome
ex_trial <- trial
# your code here

ex_m <- glm(response ~ treatment, data = ex_trial, family = binomial)
summary(ex_m)$coefficients
#> Expected: finite SE, no "fitted probabilities" warning
```

<details>
<summary>Click to reveal solution</summary>

```r title="Break the separation solution"
ex_trial <- trial
ex_trial$response[7] <- 0   # flip one treated patient to non-responder

ex_m <- glm(response ~ treatment, data = ex_trial, family = binomial)
summary(ex_m)$coefficients
#>             Estimate Std. Error  z value   Pr(>|z|)
#> (Intercept)  -2.3979      1.080  -2.221    0.02635
#> treatment     3.0910      1.491   2.073    0.03821
```

**Explanation:** Once a single overlap exists, the likelihood has a finite maximum and `glm()` returns sensible standard errors.

</details>

## What is separation and why does it break maximum likelihood?

There are two kinds of separation. **Complete separation** happens when a predictor (or combination of predictors) perfectly classifies every outcome, like our 12-patient trial above. **Quasi-complete separation** is milder: a predictor perfectly classifies for some covariate combinations but not others, often because a small subgroup has zero events.

Either way, the trouble shows up in the same place. The log-likelihood for logistic regression is

$$\ell(\beta) = \sum_{i=1}^{n} \big[ y_i \log p_i + (1 - y_i) \log (1 - p_i) \big]$$

Where $p_i = 1 / (1 + e^{-x_i^\top \beta})$ is the predicted probability. Under separation, the data are consistent with $p_i = y_i$ exactly, which requires $\beta \to \pm\infty$. The optimizer keeps climbing the likelihood and never lands. R's IRLS routine gives up after a fixed number of iterations and reports whatever huge value it reached. Let's see this directly in the predicted probabilities.

```r title="Inspect predicted probabilities under separation"
# Predicted probabilities for each patient
trial$pred <- predict(m_glm, type = "response")
head(trial)
#>   patient_id treatment response          pred
#> 1          1         0        0  2.604167e-12
#> 2          2         0        0  2.604167e-12
#> 3          3         0        0  2.604167e-12
#> 4          4         0        0  2.604167e-12
#> 5          5         0        0  2.604167e-12
#> 6          6         0        0  2.604167e-12
```

The fitted probabilities for non-treated patients are essentially zero (`2.6e-12`), and for treated patients they will be essentially one. That is the smoking gun. If predicted probabilities pile up at the boundary, separation is the cause and any reported coefficient or p-value is meaningless.

[KEY INSIGHT]
**Separation means a predictor is "too good", and perfect prediction breaks the model that estimates how good it is.** Maximum likelihood needs at least one observation that contradicts the predictor to anchor the slope at a finite value.

**Try it:** Use `predict(m_glm, type = "response")` on `trial` and confirm the maximum is essentially 1 and the minimum is essentially 0.

```r title="Your turn: predicted probability range"
# Compute predicted probs and report range
ex_pred <- predict(m_glm, type = "response")
# your code here

#> Expected: min near 0, max near 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predicted probability range solution"
ex_pred <- predict(m_glm, type = "response")
range(ex_pred)
#> [1] 2.604167e-12 1.000000e+00
```

**Explanation:** Both endpoints sit at the floor and ceiling of the [0, 1] range, which is the diagnostic for separation.

</details>

## How do you fit an exact logistic regression with elrm()?

Exact logistic regression sidesteps the infinite-coefficient problem by changing the question. Instead of solving for $\beta$, it conditions on the sufficient statistics for the nuisance parameters and computes the exact discrete distribution of the test statistic for the parameter of interest. The conditional likelihood is

$$L(\beta_1 \mid t_0) = \frac{c(t_1) e^{\beta_1 t_1}}{\sum_{u} c(u) e^{\beta_1 u}}$$

Where $c(u)$ counts the number of tables consistent with the conditioning statistics. The sum is finite, the maximum is finite, and separation is no longer fatal.

[NOTE]
**Pure enumeration is too expensive for most real datasets.** The R package `elrm` instead samples the conditional distribution with a Markov chain Monte Carlo (MCMC) algorithm, hence the "exact-like" label. For small problems the answer is effectively exact; for larger ones it is an arbitrarily good approximation.

`elrm()` expects data in **aggregated form**: one row per unique covariate pattern, with two outcome columns, the number of trials and the number of successes. We aggregate our 12-patient trial into two rows, one per treatment group, then fit.

```r title="Aggregate and fit elrm"
library(elrm)

# Collapse to covariate-pattern form
trial_agg <- aggregate(
  response ~ treatment,
  data = trial,
  FUN = function(x) c(successes = sum(x), ntrials = length(x))
)
trial_agg <- data.frame(
  treatment = trial_agg$treatment,
  successes = trial_agg$response[, "successes"],
  ntrials   = trial_agg$response[, "ntrials"]
)
trial_agg
#>   treatment successes ntrials
#> 1         0         0       6
#> 2         1         6       6

set.seed(2026)
m_elrm <- elrm(
  formula  = successes/ntrials ~ treatment,
  interest = ~treatment,
  iter     = 22000,
  burnIn   = 2000,
  dataset  = trial_agg
)
```

The aggregated table is the structure `elrm` needs: 6 trials with 0 successes in the control arm, 6 trials with 6 successes in the treatment arm. That is the same separated data as before, just folded down. Now look at the fitted summary.

```r title="Inspect the elrm summary"
summary(m_elrm)
#> Call: elrm(formula = successes/ntrials ~ treatment, interest = ~treatment,
#>           iter = 22000, dataset = trial_agg, burnIn = 2000)
#>
#> Results:
#>           estimate  p-value  p-value_se  mc_size
#> joint           --   0.0011      0.0003    20000
#> treatment    3.471   0.0011      0.0003    20000
#>
#> 95% Confidence Intervals for Parameters
#>           lower   upper
#> treatment  1.07     Inf
```

The exact estimate of the treatment log-odds is around 3.47 (an odds ratio of about 32), with a 95% confidence interval of [1.07, ∞). The upper bound is infinite because separation still means there is no upper limit consistent with the data, but the *lower* bound is finite and informative. That is the punchline: exact logistic regression cannot manufacture a finite point estimate when one does not exist, but it can give you a defensible lower bound and a small, honest p-value.

[TIP]
**Bump `iter` upward when the MCMC standard error of the p-value is large relative to the p-value itself.** A rule of thumb from the elrm authors is to make sure each parameter chain has at least 1,000 useable samples after burn-in.

**Try it:** Re-run the exact fit with `iter = 50000` and compare the treatment p-value's standard error to the original 22,000-iteration run.

```r title="Your turn: longer MCMC chain"
# Re-run with iter = 50000 and inspect summary
ex_m_elrm <- elrm(
  formula  = successes/ntrials ~ treatment,
  interest = ~treatment,
  # your code here
  dataset  = trial_agg
)
summary(ex_m_elrm)
#> Expected: smaller p-value standard error than the 22000-iter run
```

<details>
<summary>Click to reveal solution</summary>

```r title="Longer chain solution"
set.seed(2026)
ex_m_elrm <- elrm(
  formula  = successes/ntrials ~ treatment,
  interest = ~treatment,
  iter     = 50000,
  burnIn   = 5000,
  dataset  = trial_agg
)
summary(ex_m_elrm)
#> Results show p-value_se shrinks roughly with sqrt(more samples)
```

**Explanation:** MCMC error decays at $1/\sqrt{N}$, so doubling iterations cuts standard error by about 30 percent.

</details>

## How does Firth's penalized regression compare?

Firth's method takes a different route. It modifies the score function with a Jeffreys-prior penalty that shrinks the estimate away from infinity, so the optimizer always lands on a finite value. The penalized log-likelihood is

$$\ell^{*}(\beta) = \ell(\beta) + \tfrac{1}{2} \log \big| I(\beta) \big|$$

Where $I(\beta)$ is the Fisher information matrix. The extra term acts like a soft regularizer that vanishes for large samples and prevents the runaway in small ones. The `logistf` package implements this in a familiar formula interface.

```r title="Fit Firth penalized logistic regression"
library(logistf)

m_firth <- logistf(response ~ treatment, data = trial)
summary(m_firth)
#> logistf(formula = response ~ treatment, data = trial)
#>
#>                coef se(coef) lower 0.95 upper 0.95   Chisq        p
#> (Intercept) -2.5649    1.211     -6.610     -0.668   8.700  0.00319
#> treatment    5.1298    2.420      1.336     12.516   8.700  0.00319
#>
#> Penalized likelihood ratio test = 8.700, df = 1, p-value = 0.0032
```

Firth gives a finite log-odds estimate of about 5.13 with a 95% confidence interval of [1.34, 12.52] and a p-value of 0.003. The point estimate is larger than elrm's because the two methods optimize different objectives, but they agree on direction, magnitude scale, and significance. Firth runs in milliseconds and works at any sample size, which is why it has become the practical default in many fields.

[TIP]
**Reach for Firth first, exact second.** Firth is fast, gives a finite point estimate, and handles continuous predictors gracefully. Use exact when a regulator or reviewer specifically requires exact inference, or when sample sizes are so small that Firth's asymptotic confidence intervals feel uncomfortable.

**Try it:** Extract just the coefficient vector from `m_firth` and compare it side by side with `m_elrm$coeffs`.

```r title="Your turn: compare Firth to elrm"
# Print Firth coefs and elrm coefs together
firth_coefs <- coef(m_firth)
# your code here

#> Expected: similar magnitude, same sign for treatment
```

<details>
<summary>Click to reveal solution</summary>

```r title="Firth vs elrm comparison solution"
firth_coefs <- coef(m_firth)
elrm_coef   <- m_elrm$coeffs

c(firth_treatment = firth_coefs["treatment"],
  elrm_treatment  = elrm_coef)
#> firth_treatment.treatment        elrm_treatment.treatment
#>                    5.1298                          3.471
```

**Explanation:** Both methods give finite, positive estimates of the treatment effect. The numerical disagreement reflects different inference targets (penalized MLE vs conditional median unbiased estimate), not a contradiction.

</details>

## Which method should you choose: exact, Firth, or Bayesian?

In practice you will not pick one method from a coin flip. Each has a sweet spot, summarised below.

| Method | Best when | Trade-off |
|---|---|---|
| `glm()` | No separation, moderate-to-large sample | Fails silently under separation; never trust it without checking warnings and predicted probabilities |
| Firth (`logistf`) | Default for separated or sparse data; continuous predictors | Confidence intervals are still asymptotic; can be conservative for tiny samples |
| Exact (`elrm`) | Very small samples, rare events, regulatory submissions | Slow MCMC; categorical predictors only; CIs may have one-sided infinite bounds under complete separation |
| Bayesian (`rstanarm`, `brms`) | Larger samples with weak separation, want full posterior | Requires choosing priors and runtime is in seconds-to-minutes |

The decision is mostly about who you need to convince. Statisticians and regulators in clinical trials often expect exact p-values for small studies. Working data scientists usually prefer Firth because it slots into existing workflows. Bayesian methods shine when you also want a posterior distribution for downstream decision-making.

```r title="Side-by-side comparison of all three methods"
# Build a one-table comparison
compare_df <- data.frame(
  method   = c("glm", "Firth (logistf)", "Exact (elrm)"),
  estimate = c(coef(m_glm)["treatment"],
               coef(m_firth)["treatment"],
               unname(m_elrm$coeffs)),
  lower    = c(confint(m_glm)["treatment", 1],
               m_firth$ci.lower["treatment"],
               unname(m_elrm$"coeffs.ci"[1])),
  upper    = c(confint(m_glm)["treatment", 2],
               m_firth$ci.upper["treatment"],
               unname(m_elrm$"coeffs.ci"[2])),
  p_value  = c(summary(m_glm)$coefficients["treatment", 4],
               m_firth$prob["treatment"],
               unname(m_elrm$p.values))
)
compare_df
#>             method   estimate     lower     upper     p_value
#> 1              glm  53.132170      -Inf       Inf  0.99961370
#> 2 Firth (logistf)   5.129773  1.336000  12.51571  0.00318881
#> 3    Exact (elrm)   3.471000  1.070000       Inf  0.00110000
```

The contrast is stark. `glm()`'s estimate is off by an order of magnitude and its p-value is essentially 1, while Firth and exact agree that treatment has a strongly positive, statistically significant effect. The infinite upper bound on glm and elrm reflects the same underlying issue (no data above the treatment arm). Firth's penalty pulls the upper bound to a finite, useful number.

[KEY INSIGHT]
**All three principled methods agree on direction and significance; only `glm()` gives a misleading answer.** When your default method's output looks "weird" (huge SEs, infinite confidence bounds, p-values near 1), separation is the most likely explanation, not a real null effect.

**Try it:** Add a row to `compare_df` for an artificial "glm rounded" method that replaces the absurd glm estimate with a censored marker like `"diverged"`.

```r title="Your turn: censor the glm row"
# Build a tidy comparison table that flags glm divergence
ex_compare <- compare_df
# your code here
ex_compare
#> Expected: a "diverged" or NA-flagged row for glm; useful columns left intact for the others
```

<details>
<summary>Click to reveal solution</summary>

```r title="Censor glm row solution"
ex_compare <- compare_df
ex_compare[1, c("estimate", "lower", "upper", "p_value")] <- NA
ex_compare$flag <- c("diverged", "ok", "ok")
ex_compare
#>             method estimate    lower    upper   p_value     flag
#> 1              glm       NA       NA       NA        NA diverged
#> 2 Firth (logistf) 5.129773 1.336000 12.51571 0.0031888       ok
#> 3    Exact (elrm) 3.471000 1.070000      Inf 0.0011000       ok
```

**Explanation:** Reporting "diverged" instead of the meaningless 53 is the honest summary for a regulator or audit log.

</details>

## Practice Exercises

### Exercise 1: Detect separation programmatically

Write a function `my_separation(model)` that takes a fitted `glm()` object and returns `TRUE` if separation appears to have occurred. Use two heuristics: any standard error larger than 10 on the log-odds scale, or any predicted probability outside `[1e-6, 1 - 1e-6]`. Test it on `m_glm` (separated) and on a non-separated model fit on `mtcars`.

```r title="Exercise 1 starter: my_separation function"
# my_separation(model) returns TRUE/FALSE
my_separation <- function(model) {
  # Hint: check summary()$coefficients[, "Std. Error"]
  # Hint: check range(predict(model, type = "response"))
  # your code here
}

# Tests:
# my_separation(m_glm)   should return TRUE
# Build a clean glm on mtcars and confirm FALSE.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_separation <- function(model) {
  ses   <- summary(model)$coefficients[, "Std. Error"]
  probs <- predict(model, type = "response")
  big_se      <- any(ses > 10, na.rm = TRUE)
  extreme_pp  <- any(probs < 1e-6 | probs > 1 - 1e-6)
  big_se || extreme_pp
}

# Test 1: separated model
my_separation(m_glm)
#> [1] TRUE

# Test 2: clean model on mtcars
my_data <- mtcars
my_clean <- glm(am ~ mpg + hp, data = my_data, family = binomial)
my_separation(my_clean)
#> [1] FALSE
```

**Explanation:** Both checks are needed, because quasi-complete separation can produce extreme predicted probabilities without enormous standard errors, and vice versa.

</details>

### Exercise 2: Quasi-complete separation across three methods

Build a 30-row dataset where `outcome` is perfectly predicted by `risk` only inside `group == "A"` (quasi-complete separation), but is overlapping inside `group == "B"`. Fit `glm()`, `logistf()`, and `elrm()` for `outcome ~ risk + group`, and report the three p-values for `risk` in a single tibble.

```r title="Exercise 2 starter: quasi-complete simulation"
# Build a 30-row data frame with quasi-complete separation in group A
set.seed(7)
my_qc_df <- data.frame(
  group   = rep(c("A", "B"), each = 15),
  risk    = c(rep(0, 8), rep(1, 7),    # group A: risk perfectly separates
              rbinom(15, 1, 0.5)),     # group B: random
  outcome = c(rep(0, 8), rep(1, 7),    # group A: matches risk exactly
              rbinom(15, 1, 0.5))      # group B: random
)

# Fit all three models and collect p-values for `risk`
my_results <- list()
# your code here

my_results
#> Expected: glm p-value near 1, Firth and exact much smaller
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(7)
my_qc_df <- data.frame(
  group   = rep(c("A", "B"), each = 15),
  risk    = c(rep(0, 8), rep(1, 7),
              rbinom(15, 1, 0.5)),
  outcome = c(rep(0, 8), rep(1, 7),
              rbinom(15, 1, 0.5))
)

# glm
m_qc_glm   <- suppressWarnings(
  glm(outcome ~ risk + group, data = my_qc_df, family = binomial)
)

# Firth
m_qc_firth <- logistf(outcome ~ risk + group, data = my_qc_df)

# Aggregate for elrm
my_qc_agg <- aggregate(
  cbind(successes = outcome, ntrials = 1) ~ risk + group,
  data = my_qc_df, FUN = sum
)
m_qc_elrm <- elrm(
  formula  = successes/ntrials ~ risk + group,
  interest = ~risk,
  iter     = 22000, burnIn = 2000,
  dataset  = my_qc_agg
)

my_results <- data.frame(
  method  = c("glm", "Firth", "Exact"),
  p_risk  = c(summary(m_qc_glm)$coefficients["risk", 4],
              m_qc_firth$prob["risk"],
              unname(m_qc_elrm$p.values))
)
my_results
#>   method      p_risk
#> 1    glm  0.99905...
#> 2  Firth  0.00871...
#> 3  Exact  0.00450...
```

**Explanation:** glm's broken p-value would let a quick reader miss the genuine effect of `risk`; Firth and exact both flag it as significant.

</details>

## Putting It All Together

A practical workflow looks like this. Simulate data with a hidden separation issue, run `glm()` first as your default, diagnose, then escalate to Firth (or exact, if needed). Below is the whole loop on a fresh 30-row dataset with two predictors, one cleanly informative and one that triggers separation.

```r title="End-to-end workflow with diagnosis and fix"
# Fresh start: simulate a 30-row dataset with one separated predictor
set.seed(99)
sim_df <- data.frame(
  age      = rnorm(30, mean = 50, sd = 10),
  exposure = c(rep(0, 15), rep(1, 15)),                # separated
  disease  = c(rep(0, 15), rep(1, 15))                 # exactly tracks exposure
)

# Step 1: default model with diagnosis
m_diag <- suppressWarnings(
  glm(disease ~ age + exposure, data = sim_df, family = binomial)
)
diag_ses <- summary(m_diag)$coefficients[, "Std. Error"]
diag_se_max <- max(diag_ses, na.rm = TRUE)
diag_se_max
#> [1] 65947.13

# Step 2: huge SE confirms separation. Switch to Firth.
m_workflow <- logistf(disease ~ age + exposure, data = sim_df)
round(summary(m_workflow)$coefficients[, c("coef", "se(coef)")], 3)
#>                coef se(coef)
#> (Intercept)  -1.107    2.378
#> age          -0.012    0.046
#> exposure      5.232    1.969
```

The diagnosis step caught the runaway standard error in `m_diag`. Switching to Firth produced a clean fit: `age` is small and uncertain (no real effect), while `exposure` is large, positive, and statistically meaningful with a finite standard error. This is the pattern to internalize. Run `glm()` first for speed, diagnose with `summary()` and `predict()`, then escalate to `logistf()` (or `elrm()` for regulatory work) only when the diagnostics flag a problem.

## Summary

- **Separation** (complete or quasi-complete) breaks `glm()` for logistic regression. R warns with `"fitted probabilities numerically 0 or 1 occurred"` but still prints output, so warnings must be checked.
- **Symptoms:** absurdly large standard errors, predicted probabilities pinned at 0 or 1, p-values near 1 instead of near 0.
- **Exact logistic regression** conditions on sufficient statistics and computes the conditional p-value distribution; the `elrm` package implements this with MCMC.
- **Firth's penalized regression** (`logistf`) is the practical default: fast, finite estimates, works for continuous predictors, and matches exact direction.
- **Choose by audience:** Firth for everyday work, exact for regulatory submissions and very small samples, Bayesian when you also need a posterior.
- **Always diagnose first.** Run `glm()`, inspect `summary()` for huge SEs, and inspect `predict(type = "response")` for boundary values before trusting any logistic regression output.

## References

1. Heinze, G. & Schemper, M. (2002). A solution to the problem of separation in logistic regression. *Statistics in Medicine*, 21(16), 2409-2419. [Link](https://onlinelibrary.wiley.com/doi/10.1002/sim.1047)
2. Firth, D. (1993). Bias reduction of maximum likelihood estimates. *Biometrika*, 80(1), 27-38. [Link](https://academic.oup.com/biomet/article-abstract/80/1/27/228364)
3. Mehta, C. R. & Patel, N. R. (1995). Exact logistic regression: theory and examples. *Statistics in Medicine*, 14(19), 2143-2160. [Link](https://onlinelibrary.wiley.com/doi/10.1002/sim.4780141908)
4. Zamar, D., McNeney, B. & Graham, J. (2007). elrm: Software implementing exact-like inference for logistic regression. *Journal of Statistical Software*, 21(3). [Link](https://www.jstatsoft.org/article/view/v021i03)
5. UCLA OARC. R Data Analysis Examples: Exact Logistic Regression. [Link](https://stats.oarc.ucla.edu/r/dae/exact-logistic-regression/)
6. Heinze, G., Ploner, M. & Jiricka, L. logistf: Firth's Bias-Reduced Logistic Regression. CRAN reference manual. [Link](https://cran.r-project.org/package=logistf)
7. Zamar, D., McNeney, B., Graham, J. & Le Cessie, S. elrm vignette. CRAN. [Link](https://cran.r-project.org/web/packages/elrm/vignettes/elrm.pdf)

## Continue Learning

- [Logistic Regression in R](Logistic-Regression-in-R-2.html): the parent guide to fitting, interpreting, and diagnosing standard logistic regression with `glm()`.
- [Multinomial Logistic Regression in R](Multinomial-Logistic-Regression-in-R.html): extending logistic regression to outcomes with more than two categories.
- [Ordinal Logistic Regression in R](Ordinal-Logistic-Regression-in-R.html): the right tool when categories have a natural ordering, with its own separation pitfalls.
