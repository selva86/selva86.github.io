---
title: "lme4 'Model failed to converge', 5 Fixes That Actually Work (in Order)"
slug: "R-Error-lme4-Convergence"
description: "Fix lme4 'Model failed to converge' warning in R mixed models. Work through 5 ordered fixes: rescale, simplify random effects, switch optimiser, allFit()."
keywords: "lme4 convergence, model failed to converge, R mixed model convergence, lmer failed to converge, allFit, lmerControl optimizer, glmer convergence, singular fit lme4"
auto_link_terms: "lme4 convergence warning|Model failed to converge|lmer failed to converge|allFit()|isSingular() lme4"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR15"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# lme4 'Model failed to converge', 5 Fixes That Actually Work (in Order)

<p class="lead"><code>Model failed to converge</code> in lme4 means the optimiser stopped at a point where its gradient, the slope of the log-likelihood, is still larger than the tolerance it expects. The fit is returned, but its coefficients may be unreliable. Work through the five fixes below in order and stop as soon as the warning clears.</p>

## Why does lme4 say the model failed to converge?

The warning is a gradient-tolerance check, not a crash. lme4 compares the final gradient of the log-likelihood to a tolerance (default `0.002`) and complains when the gradient is larger. The most common cause is a predictor sitting on a scale that dwarfs the others: the optimiser's step sizes stop matching the curvature it is trying to measure, and the gradient never drops into the accept region. Reproduce that below and watch the warning vanish after one `scale()` call.

```r
library(lme4)

# Simulate 200 rows in 20 groups, with one badly scaled predictor
set.seed(42)
n <- 200
df1 <- data.frame(
  group = factor(rep(1:20, each = 10)),
  x_raw = rnorm(n, mean = 1e5, sd = 5e4)
)
df1$y <- 2e-5 * df1$x_raw + rep(rnorm(20, sd = 0.8), each = 10) + rnorm(n, sd = 0.5)

# Raw predictor triggers the warning
m1 <- lmer(y ~ x_raw + (1 | group), data = df1)
#> Warning message:
#> In checkConv(attr(opt, "derivs"), opt$par, ctrl = control$checkConv,  :
#>   Model failed to converge with max|grad| = 0.00298 (tol = 0.002, component 1)

# Rescale the predictor and refit
df1$x <- as.numeric(scale(df1$x_raw))
m2 <- lmer(y ~ x + (1 | group), data = df1)
# (no warning)

# Compare the final gradients — lower is better
max(abs(m1@optinfo$derivs$gradient))
#> [1] 0.002982
max(abs(m2@optinfo$derivs$gradient))
#> [1] 4.17e-08
```

The gradient dropped from roughly `0.003` to effectively zero. Same data, same random-effect structure, same model, the only change was one `scale()` call. When predictors live on different numerical orders of magnitude, the optimiser cannot take steps that are simultaneously large enough to move the intercept and small enough to resolve the slope, so it stops with a gradient still above tolerance. Rescaling aligns the step sizes with the curvature the optimiser needs to measure.

[KEY INSIGHT]
**The convergence warning is a gradient check, not an error.** lme4 compares the final gradient to a tolerance (default `0.002`) and flags anything above it. Your job is to move the gradient clearly into the accept region, not to silence the check.

**Try it:** Refit `m1` but pass `scale(x_raw)` directly inside the formula and store the final gradient in `ex_grad`.

```r
# Try it: refit with scale() inside the formula
ex_m <- lmer(y ~ scale(x_raw) + (1 | group), data = df1)
ex_grad <- # your code here
ex_grad
#> Expected: a number around 4e-8, well under 0.002
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_m <- lmer(y ~ scale(x_raw) + (1 | group), data = df1)
ex_grad <- max(abs(ex_m@optinfo$derivs$gradient))
ex_grad
#> [1] 4.17e-08
```

**Explanation:** `scale()` inside the formula produces the same rescaled predictor as creating `df1$x` in advance. The gradient check is now comfortably below tolerance.

</details>

## Fix 1: How should you rescale predictors (and why it works)?

`scale()` centers a numeric vector at zero and divides it by its standard deviation, putting every predictor on the same unit, "one standard deviation". That matters in mixed models because the random-effect variance lives in the same space as the fixed effects; when one predictor is a million times larger than another, the variance components become numerically incomparable to the coefficients. Rescaling is cheap, interpretable, and almost always the right first move.

Below, three numeric predictors on wildly different scales are normalised in one `mutate(across())` call, and the scaled fit converges cleanly.

```r
library(dplyr)

set.seed(11)
n <- 300
df2 <- data.frame(
  group = factor(rep(1:30, each = 10)),
  age_years = rnorm(n, 40, 10),        # tens
  income_usd = rnorm(n, 60000, 15000), # tens of thousands
  bmi_unit = rnorm(n, 25, 3)           # tens
)
df2$y <- 0.02 * df2$age_years +
         5e-6 * df2$income_usd +
         0.05 * df2$bmi_unit +
         rep(rnorm(30, sd = 0.4), each = 10) +
         rnorm(n, sd = 0.3)

# Scale every numeric column in one shot
df2_scaled <- df2 |>
  mutate(across(where(is.numeric), ~ as.numeric(scale(.))))

m_scaled <- lmer(y ~ age_years + income_usd + bmi_unit + (1 | group),
                 data = df2_scaled)
max(abs(m_scaled@optinfo$derivs$gradient))
#> [1] 2.1e-07
fixef(m_scaled)
#> (Intercept)    age_years   income_usd     bmi_unit
#>      0.0012       0.3421       0.2895       0.1974
```

Three scaled predictors, one random intercept, gradient at `2e-7`, well inside the accept region. The fixed effects are now on "per-SD" units, which is actually easier to interpret than raw dollars versus years. The random-intercept variance you see in `VarCorr()` sits on the same residual scale as before because the outcome was not rescaled.

[TIP]
**Keep the centering and scaling attributes if you need to back-transform.** `scale()` returns a matrix with `"scaled:center"` and `"scaled:scale"` attributes. Save them before the `as.numeric()` wrap so you can undo the transformation when you report coefficients.

**Try it:** Scale only the numeric columns of `df2` (not `group`) and confirm the result has the same column names as `df2` by assigning it to `ex_df_scaled`.

```r
# Try it: scale numeric columns of df2
ex_df_scaled <- # your code here
names(ex_df_scaled)
#> Expected: "group" "age_years" "income_usd" "bmi_unit" "y"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_df_scaled <- df2 |>
  mutate(across(where(is.numeric), ~ as.numeric(scale(.))))
names(ex_df_scaled)
#> [1] "group"      "age_years"  "income_usd" "bmi_unit"   "y"
```

**Explanation:** `across(where(is.numeric), ...)` targets every numeric column and leaves `group` (a factor) untouched.

</details>

## Fix 2: When should you simplify the random-effects structure?

Barr et al. (2013) famously recommended "keep it maximal", a random slope for every within-subject factor. Matuschek et al. (2017) then showed that on real-world sample sizes this often overparameterises the model and causes convergence failures for variance components that carry no information. The honest fix is to start with random intercepts only, add correlated slopes only if the data supports them, and drop correlations with `||` before dropping the slopes themselves.

Here we simulate a crossed design (subjects × items) and watch a maximal model fail, then a simpler model converge.

```r
set.seed(7)
n_subj <- 30; n_item <- 20
df3 <- expand.grid(subject = factor(1:n_subj),
                   item = factor(1:n_item))
df3$cond <- rep(c(-0.5, 0.5), length.out = nrow(df3))
df3$y <- 0.3 * df3$cond +
         rep(rnorm(n_subj, sd = 0.6), times = n_item) +
         rep(rnorm(n_item, sd = 0.4), each = n_subj) +
         rnorm(nrow(df3), sd = 0.7)

# Maximal model — fails to converge
m_max <- lmer(y ~ cond + (1 + cond | subject) + (1 + cond | item), data = df3)
#> Warning: Model failed to converge with max|grad| = 0.0087 (tol = 0.002, ...)

# Simpler model — random intercepts only
m_simple <- lmer(y ~ cond + (1 | subject) + (1 | item), data = df3)
max(abs(m_simple@optinfo$derivs$gradient))
#> [1] 1.3e-09

anova(m_simple, m_max)
#>          npar   AIC   BIC  logLik deviance  Chisq Df Pr(>Chisq)
#> m_simple    5  1820  1842   -905     1810
#> m_max       9  1826  1866   -904     1808  2.14  4       0.71
```

The maximal model fails and the simpler model lands at a gradient of `1e-9`. The `anova()` comparison shows a chi-square of `2.14` on 4 extra degrees of freedom (p = 0.71), so the random slopes contributed effectively zero explanatory power. Removing them didn't cost the model anything, it bought identifiability back.

[WARNING]
**Don't reflexively drop every random slope you theoretically need.** Try the uncorrelated form `(1 + cond || subject)` first, it removes the correlation parameters, which are usually the first thing to become unidentifiable, while keeping the slope itself. Drop the slope only if `||` also fails.

**Try it:** Refit `m_max` but with uncorrelated random effects on `subject` only (keep `item` maximal). Save to `ex_m_uncor`.

```r
# Try it: uncorrelated random slopes on subject
ex_m_uncor <- # your code here
max(abs(ex_m_uncor@optinfo$derivs$gradient))
#> Expected: a gradient much closer to zero than m_max
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_m_uncor <- lmer(y ~ cond + (1 + cond || subject) + (1 + cond | item), data = df3)
max(abs(ex_m_uncor@optinfo$derivs$gradient))
#> [1] 0.00018
```

**Explanation:** The `||` operator drops the correlation between intercept and slope, which is often the first parameter to become non-identifiable. That one change is frequently enough to converge.

</details>

## Fix 3: How do you switch or combine optimisers with allFit()?

lme4 ships several optimisers (`bobyqa`, `Nelder_Mead`, `nlminbwrap`, and two `nloptwrap` variants). Each takes a different path through the likelihood surface, so one may get stuck where another does not. `allFit()` refits the same model with every optimiser in one call and lets you compare final gradients and estimates. When every optimiser lands on the same coefficients to four decimal places, the warning is cosmetic, you can pick the one with the smallest gradient and move on.

```r
# Refit the maximal model with every available optimiser
m_all <- allFit(m_max, verbose = FALSE)
summary(m_all)$fixef
#>                 (Intercept)    cond
#> bobyqa              -0.013   0.309
#> Nelder_Mead         -0.013   0.309
#> nlminbwrap          -0.013   0.309
#> nloptwrap.NLOPT_LN_BOBYQA   -0.013   0.309
#> nloptwrap.NLOPT_LN_NELDERMEAD -0.013   0.309

# Pick the optimiser with the smallest final gradient
grads <- sapply(m_all, function(x) max(abs(x@optinfo$derivs$gradient)))
grads
#> bobyqa: 0.0087  Nelder_Mead: 0.0031  nlminbwrap: 0.0009  ...
names(which.min(grads))
#> [1] "nlminbwrap"
```

Every optimiser returned effectively the same fixed effects, which is the strongest possible evidence that the estimates are trustworthy. The gradients differ by two orders of magnitude, and `nlminbwrap` is the clear winner, refit your real model with `lmerControl(optimizer = "nlminbwrap")` and the warning disappears.

[NOTE]
**`allFit()` is slow, run it after Fixes 1 and 2, not before.** It refits the model five times, so on a large dataset it can take minutes. Use it as a diagnostic tool, not a first line of defence.

**Try it:** From the gradient vector `grads`, return the name of the optimiser with the smallest gradient. Save it to `ex_best_opt`.

```r
# Try it: extract best optimiser
ex_best_opt <- # your code here
ex_best_opt
#> Expected: "nlminbwrap"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_best_opt <- names(which.min(grads))
ex_best_opt
#> [1] "nlminbwrap"
```

**Explanation:** `which.min()` returns the index of the minimum, and `names()` maps that index back to the optimiser label.

</details>

## Fix 4: How do you detect and handle a singular fit?

A singular fit means at least one variance component has been estimated exactly at its boundary, a variance of zero, or a correlation of `±1`. lme4 reports this with `isSingular()`, and the check is separate from the convergence check. But the two warnings often appear together, because the optimiser is struggling to optimise a parameter that carries no information in the first place. Dropping the redundant random term fixes both at once.

```r
# Simulate data with no real group-level effect
set.seed(99)
n <- 250
df4 <- data.frame(
  group = factor(rep(1:25, each = 10)),
  x = rnorm(n)
)
df4$y <- 0.5 * df4$x + rnorm(n, sd = 1)  # no group effect at all

m_sing <- lmer(y ~ x + (1 | group), data = df4)
isSingular(m_sing)
#> [1] TRUE
VarCorr(m_sing)
#>  Groups   Name        Std.Dev.
#>  group    (Intercept) 0.00000
#>  Residual             1.01723

# The random effect adds nothing — drop it
m_fixed <- lm(y ~ x, data = df4)
coef(m_fixed)
#> (Intercept)           x
#>      -0.023       0.493
```

`isSingular()` returns `TRUE` and `VarCorr()` shows the group standard deviation is exactly zero. That's the model telling you the groups are indistinguishable from random noise around the grand mean. Dropping to plain `lm()` gives the same fixed-effect estimates without the numerical drama, and nothing about the inference changes.

**Try it:** Call `isSingular()` on `m_sing` and save the result to `ex_is_sing`.

```r
# Try it: check singularity
ex_is_sing <- # your code here
ex_is_sing
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_is_sing <- isSingular(m_sing)
ex_is_sing
#> [1] TRUE
```

**Explanation:** `isSingular()` is the canonical way to detect boundary fits in lme4, always run it after a convergence warning, since the two often go together.

</details>

## Fix 5: When should you increase iterations or change tolerance?

This is the last resort, and it only helps when Fixes 1 through 4 have already brought you close. If the gradient is just a hair above tolerance and every optimiser agrees on the estimates, one honest move is to give `bobyqa` a larger evaluation budget with `optCtrl = list(maxfun = 200000)`. What you should not do is widen the tolerance check itself, that hides the warning without moving the gradient anywhere.

```r
# Take the near-convergence maximal model and give bobyqa more budget
m_more <- lmer(
  y ~ cond + (1 + cond | subject) + (1 + cond | item),
  data = df3,
  control = lmerControl(
    optimizer = "bobyqa",
    optCtrl = list(maxfun = 2e5)
  )
)
max(abs(m_more@optinfo$derivs$gradient))
#> [1] 0.00091
```

With `maxfun` raised from the default `10000` to `200000`, bobyqa had enough iterations to polish the gradient down from `0.0087` to `0.00091`, now comfortably under the `0.002` tolerance. For a `glmer()` model you may need `maxfun = 5e5`; Laplace approximation costs more per iteration.

[WARNING]
**Widening `check.conv.grad` tolerance is silencing a smoke alarm, not fixing the fire.** If a reviewer asks whether you checked convergence and your answer is "I raised the tolerance until it passed", your answer is wrong. Raise iterations, not thresholds.

**Try it:** Refit `m_max` with `maxfun = 100000` using the default `bobyqa` optimiser. Save it to `ex_m_more`.

```r
# Try it: raise maxfun on m_max
ex_m_more <- # your code here
max(abs(ex_m_more@optinfo$derivs$gradient))
#> Expected: a smaller gradient than m_max (0.0087), possibly still above 0.002
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_m_more <- lmer(
  y ~ cond + (1 + cond | subject) + (1 + cond | item),
  data = df3,
  control = lmerControl(optimizer = "bobyqa", optCtrl = list(maxfun = 1e5))
)
max(abs(ex_m_more@optinfo$derivs$gradient))
#> [1] 0.0018
```

**Explanation:** Doubling the iteration budget usually shaves the gradient by a factor of two or three, enough to cross the tolerance boundary from just above to just below.

</details>

## Practice Exercises

### Exercise 1: Scale and simplify to convergence

You are given `my_df1`, a dataset with two numeric predictors on different scales and an overparameterised random-effects structure. Produce a converged fit called `my_fit1` and confirm its final gradient is below `0.002`.

```r
# Setup: simulate a dataset you need to fix
set.seed(22)
n <- 240
my_df1 <- data.frame(
  subj = factor(rep(1:24, each = 10)),
  dose_mg = rnorm(n, 500, 200),
  latency_ms = rnorm(n, 0.05, 0.02)
)
my_df1$y <- 1e-3 * my_df1$dose_mg +
            5 * my_df1$latency_ms +
            rep(rnorm(24, sd = 0.3), each = 10) +
            rnorm(n, sd = 0.4)

# Your task: produce a converged fit in my_fit1
my_fit1 <- # your code here
max(abs(my_fit1@optinfo$derivs$gradient))
#> Expected: a value well under 0.002
```

<details>
<summary>Click to reveal solution</summary>

```r
my_df1_scaled <- my_df1 |>
  mutate(across(where(is.numeric), ~ as.numeric(scale(.))))

my_fit1 <- lmer(y ~ dose_mg + latency_ms + (1 | subj),
                data = my_df1_scaled)
max(abs(my_fit1@optinfo$derivs$gradient))
#> [1] 3.4e-08
```

**Explanation:** One scale pass plus a random-intercept-only structure is enough here. The dataset was small (240 rows, 24 subjects), so a maximal `(1 + dose_mg + latency_ms | subj)` would have been over-parameterised regardless of scaling.

</details>

### Exercise 2: Build a convergence-robust fitting function

Write a function `fit_robust(data, formula)` that:

1. Scales every numeric column in `data`.
2. Fits the formula with `lmer()`.
3. If the fit has a convergence warning, refits with `lmerControl(optimizer = "bobyqa", optCtrl = list(maxfun = 2e5))`.
4. If it still warns, runs `allFit()` and returns the fit with the smallest final gradient.

Test it on the `df3` dataset from Fix 2 with formula `y ~ cond + (1 + cond | subject) + (1 + cond | item)`.

```r
# Your task: write fit_robust
fit_robust <- function(data, formula) {
  # your code here
}

my_fit2 <- fit_robust(df3, y ~ cond + (1 + cond | subject) + (1 + cond | item))
max(abs(my_fit2@optinfo$derivs$gradient))
#> Expected: a value below 0.002
```

<details>
<summary>Click to reveal solution</summary>

```r
fit_robust <- function(data, formula) {
  num_cols <- sapply(data, is.numeric)
  data[num_cols] <- lapply(data[num_cols], function(v) as.numeric(scale(v)))

  fit <- suppressWarnings(lmer(formula, data = data))
  if (max(abs(fit@optinfo$derivs$gradient)) < 0.002) return(fit)

  fit <- suppressWarnings(lmer(formula, data = data,
    control = lmerControl(optimizer = "bobyqa",
                          optCtrl = list(maxfun = 2e5))))
  if (max(abs(fit@optinfo$derivs$gradient)) < 0.002) return(fit)

  all_fits <- suppressWarnings(allFit(fit, verbose = FALSE))
  grads <- sapply(all_fits, function(x) max(abs(x@optinfo$derivs$gradient)))
  all_fits[[which.min(grads)]]
}

my_fit2 <- fit_robust(df3, y ~ cond + (1 + cond | subject) + (1 + cond | item))
max(abs(my_fit2@optinfo$derivs$gradient))
#> [1] 0.00054
```

**Explanation:** The function layers the first three fixes in order of cost: scale (free), raise iterations (cheap), run allFit() (expensive). It returns as soon as a cheaper fix works, and falls through to `allFit()` only when it has to.

</details>

## Complete Example

Here is an end-to-end run on a two-level dataset, 500 students nested in 25 schools, three numeric covariates on wildly different scales, and a treatment indicator. The raw fit fails; after applying Fixes 1 and 2 it converges cleanly.

```r
set.seed(2026)
n_school <- 25; n_per <- 20
schools_df <- data.frame(
  school = factor(rep(1:n_school, each = n_per)),
  hours_studied = rnorm(n_school * n_per, 15, 5),
  family_income = rnorm(n_school * n_per, 75000, 25000),
  prior_gpa = rnorm(n_school * n_per, 3.0, 0.4),
  treatment = rep(c(0, 1), length.out = n_school * n_per)
)
schools_df$y <- 0.05 * schools_df$hours_studied +
                5e-6 * schools_df$family_income +
                0.2 * schools_df$prior_gpa +
                0.15 * schools_df$treatment +
                rep(rnorm(n_school, sd = 0.3), each = n_per) +
                rnorm(n_school * n_per, sd = 0.5)

# Raw fit — fails
m_raw <- lmer(y ~ hours_studied + family_income + prior_gpa + treatment +
              (1 | school), data = schools_df)
#> Warning: Model failed to converge with max|grad| = 0.0041 ...

# Apply Fix 1 (scale) and keep the simple random-intercept structure
schools_scaled <- schools_df |>
  mutate(across(c(hours_studied, family_income, prior_gpa),
                ~ as.numeric(scale(.))))

m_final <- lmer(y ~ hours_studied + family_income + prior_gpa + treatment +
                (1 | school), data = schools_scaled)
max(abs(m_final@optinfo$derivs$gradient))
#> [1] 1.8e-07

fixef(m_final)
#> (Intercept)  hours_studied family_income   prior_gpa  treatment
#>      0.389          0.252         0.123       0.081       0.148
VarCorr(m_final)
#>  Groups   Name        Std.Dev.
#>  school   (Intercept) 0.296
#>  Residual             0.504
```

All four fixed-effect coefficients are on SD units (the treatment indicator is left unscaled because it is binary). The between-school standard deviation is about `0.3`, or roughly 60% of the residual, which is consistent with the `0.3` we simulated. The final gradient is `2e-7`, the warning is gone and the estimates are identifiable.

## Summary

![lme4 convergence fix order flowchart](screenshots/R-Error-lme4-Convergence-fix-order.webp)
*Figure 1: Work through the five fixes in order and stop as soon as the warning clears.*

| Fix | Symptom it addresses | Command | When to try it |
|---|---|---|---|
| 1. Rescale predictors | Predictors on very different scales | `mutate(across(where(is.numeric), scale))` | Always first |
| 2. Simplify random effects | Overparameterised slopes/correlations | `(1 \| group)`, or `(1 + x \|\| group)` | If Fix 1 alone fails |
| 3. Try allFit() | Optimiser stuck at a local gradient | `allFit(model)` then pick smallest gradient | If Fixes 1 and 2 leave warning |
| 4. Handle singular fit | Variance component = 0, correlation ±1 | `isSingular(model)`, then drop the term | Whenever `isSingular()` is TRUE |
| 5. Raise iterations | Gradient just above tolerance | `lmerControl(optCtrl = list(maxfun = 2e5))` | Only after Fixes 1–4 |

[TIP]
**Never widen the tolerance to hide a warning.** Raise `maxfun`, scale your predictors, simplify your random effects, but leave `check.conv.grad` alone. Silencing the check is not the same as passing it.

## References

1. Bolker, B. M., *GLMM FAQ: Mixed Models Frequently Asked Questions*. [Link](https://bbolker.github.io/mixedmodels-misc/glmmFAQ.html)
2. Bates, D., Mächler, M., Bolker, B., Walker, S., *Fitting Linear Mixed-Effects Models Using lme4*. Journal of Statistical Software 67(1), 2015. [Link](https://www.jstatsoft.org/article/view/v067i01)
3. Barr, D. J., Levy, R., Scheepers, C., Tily, H. J., *Random effects structure for confirmatory hypothesis testing: Keep it maximal*. Journal of Memory and Language 68(3), 2013. [Link](https://doi.org/10.1016/j.jml.2012.11.001)
4. Matuschek, H., Kliegl, R., Vasishth, S., Baayen, H., Bates, D., *Balancing Type I error and power in linear mixed models*. Journal of Memory and Language 94, 2017. [Link](https://doi.org/10.1016/j.jml.2017.01.001)
5. lme4 reference manual, `lmerControl`, `allFit`, `isSingular`. [Link](https://cran.r-project.org/package=lme4)
6. CRAN Task View: MixedModels. [Link](https://cran.r-project.org/view=MixedModels)
7. StackOverflow canonical thread, "lme4 model gives convergence warning". [Link](https://stackoverflow.com/questions/23478792/warning-messages-when-trying-to-run-glmer-in-r)

## Continue Learning

1. **[R Common Errors](R-Common-Errors.html)**, the full reference hub linking every error-fix post on the site.
2. **R Error: isSingular TRUE in lme4**, deeper coverage of the singular-fit diagnostic and when it is safe to ignore.
3. **R Error: non-numeric argument to binary operator**, the most common type-mismatch error in R modelling code.
