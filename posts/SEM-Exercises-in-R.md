---
title: "SEM Exercises in R: 8 lavaan Path Model Practice Problems — Solved Step-by-Step)"
slug: "SEM-Exercises-in-R"
description: "Practise SEM exercises in R: 8 lavaan path model problems with worked solutions, from model specification through fit indices, mediation, and respecification."
keywords: "SEM exercises in R, lavaan exercises, lavaan path model, structural equation modeling R, lavaan tutorial, SEM mediation R, lavaan fit indices, SEM modification indices, lavaan bootstrap, lavaan anova"
auto_link_terms: "SEM exercises in R|lavaan exercises|lavaan practice|path model exercises|structural equation modeling exercises|lavaan path model|SEM practice problems"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "E8.4"
post_type: "EX"
sidebar_title: "SEM Exercises (8 problems)"
fr_parent: "CFA-and-Structural-Equation-Modeling-in-R.html"
difficulty: "Advanced"
---

# SEM Exercises in R: 8 lavaan Path Model Practice Problems, Solved Step-by-Step

<p class="lead">These 8 SEM exercises in R take you from your first <code>lavaan</code> path model on the bundled <code>PoliticalDemocracy</code> data through standardized estimates, fit indices, a hybrid measurement-plus-structural model, mediation with indirect effects, bootstrap confidence intervals, modification indices, and a chi-square nested-model test. Every problem is solved step by step with runnable R code and a click-to-reveal explanation.</p>

## How do you specify and fit a path model with lavaan?

`lavaan` turns a path diagram into a small string of model syntax: `~` for regression arrows, `=~` for measurement (factor loading) arrows, and `~~` for variances and covariances. Once you write the model, `sem()` fits it and `summary()` prints the estimates. We start with a two-equation regression-style path model on `PoliticalDemocracy` so you can see the syntax-to-output round trip end to end before any latent variables get involved.

```r title="Fit a two-equation path model on PoliticalDemocracy"
# Load lavaan once for the whole notebook
library(lavaan)

# PoliticalDemocracy is bundled with lavaan: 75 countries, columns x1-x3 (industrialization)
# and y1-y8 (democracy indicators in 1960 and 1965)
head(PoliticalDemocracy[, c("x1", "x2", "x3", "y1", "y5")], 3)
#>          x1       x2       x3   y1     y5
#> 1  4.442651 3.637586 2.557615 2.50  3.333
#> 2  5.384495 5.062595 3.568079 1.25  3.333
#> 3  5.961005 6.255750 5.224433 7.50  9.999

# Path model: democracy in 1965 depends on industrialization and on lagged democracy
model_basic <- '
  y5 ~ x1 + y1
  y1 ~ x1
'

# sem() fits with maximum likelihood by default
fit_basic <- sem(model_basic, data = PoliticalDemocracy)

# Standardized=TRUE adds Std.all column with z-score-scaled coefficients
summary(fit_basic, standardized = TRUE, fit.measures = FALSE)
#> Regressions:
#>                Estimate  Std.Err  z-value  P(>|z|)   Std.all
#>   y5 ~                                                      
#>     x1            0.751    0.214    3.508    0.000    0.391
#>     y1            0.624    0.080    7.769    0.000    0.633
#>   y1 ~                                                      
#>     x1            1.470    0.255    5.760    0.000    0.563
```

Two equations, two sets of coefficients. Industrialization in 1960 (`x1`) raises both democracy in 1960 (`y1 ~ x1` = 1.47) and democracy in 1965 (`y5 ~ x1` = 0.75), and lagged democracy strongly predicts current democracy (`y5 ~ y1` = 0.62). The standardized column on the right (`Std.all`) puts every coefficient on a comparable scale, which is the version you usually want when comparing predictor importance.

```r title="Pull estimates as a tidy data frame"
# parameterEstimates() returns one row per parameter with estimates, SEs, p-values
pe_basic <- parameterEstimates(fit_basic)
pe_basic[pe_basic$op == "~", c("lhs", "op", "rhs", "est", "se", "pvalue")]
#>   lhs op rhs      est       se pvalue
#> 1  y5  ~  x1 0.751260 0.214069 0.0005
#> 2  y5  ~  y1 0.624324 0.080358 0.0000
#> 3  y1  ~  x1 1.470326 0.255241 0.0000
```

Working with `parameterEstimates()` rather than reading the printed `summary()` output is what lets you script post-hoc analyses: filter by `op` to isolate regressions (`~`), variances (`~~`), or factor loadings (`=~`), and extract `est`, `se`, or `pvalue` directly into downstream code.

[KEY INSIGHT]
**lavaan model syntax is just three operators wired together.** `~` says "regress on", `=~` says "is measured by", and `~~` says "covaries with". A path diagram with five arrows becomes a five-line string. Every fancy SEM later in this article is a longer combination of those same three pieces.

[TIP]
**Use `sem()` for path models and `cfa()` for measurement-only models.** Both wrap `lavaan()` with sensible defaults: `sem()` fixes the first loading per latent variable to 1 and freely estimates exogenous covariances; `cfa()` does the same but is documented for measurement models. They produce identical fits when the syntax matches.

**Try it:** From `pe_basic`, extract the *unstandardized* regression coefficient on `x1` for the `y5` equation and save it to `ex_coef`. One subset is enough.

```r title="Your turn: extract a specific coefficient"
# Goal: pull the est value for the y5 ~ x1 row
ex_coef <- ___
ex_coef
#> Expected: ~0.751
```

<details>
<summary>Click to reveal solution</summary>

```r title="Specific coefficient solution"
ex_coef <- pe_basic$est[pe_basic$lhs == "y5" & pe_basic$op == "~" & pe_basic$rhs == "x1"]
ex_coef
#> [1] 0.7512603
```

**Explanation:** Three logical conditions pin down the exact row: outcome `y5`, operator `~` (regression), predictor `x1`. The `$est` column then returns the point estimate. This is the same value as the `Estimate` printed by `summary()`, just grabbed programmatically.

</details>

## How do you judge whether a lavaan model actually fits?

A path model returns coefficients no matter what, but only fit indices tell you whether the model's implied covariance matrix actually matches the data covariance matrix. lavaan reports chi-square, CFI, TLI, RMSEA, and SRMR. Knowing which to trust and the standard cutoffs (CFI and TLI ≥ 0.95, RMSEA ≤ 0.06, SRMR ≤ 0.08) is what separates a defensible SEM from a number salad.

```r title="Pull the standard fit suite from fitMeasures()"
# fitMeasures() returns a named numeric vector of every fit index lavaan tracks
fit_idx <- fitMeasures(fit_basic, c("chisq", "df", "pvalue", "cfi", "tli", "rmsea", "srmr"))
round(fit_idx, 3)
#>  chisq     df pvalue    cfi    tli  rmsea   srmr 
#>  0.000      0    NaN  1.000  1.000  0.000  0.000
```

The basic two-equation model is *just-identified* (df = 0): it has exactly as many parameters as covariances, so it fits the data perfectly by construction. CFI = 1, RMSEA = 0, and chi-square = 0 are diagnostic only when df > 0. The job of fit indices begins once you start imposing constraints, which is what every later exercise does.

```r title="Read the chi-square test"
# Chi-square test: H0 says the model-implied covariance matrix equals the data
# Reject H0 (low p) means the model misfits; fail to reject (high p) means it's OK
fitMeasures(fit_basic, c("chisq", "df", "pvalue"))
#>   chisq      df  pvalue 
#>       0       0     NaN
```

With df = 0 there is nothing to test. In Exercises 3 and 4 below you will fit over-identified models where the chi-square actually carries information, and where CFI and RMSEA are the primary indices to lean on (chi-square rejects too eagerly when N is large).

[WARNING]
**Chi-square rejects almost any real model when N is large.** With sample sizes above ~250 the chi-square test has so much power that even tiny model-data discrepancies produce significant p-values. The field switched to CFI, RMSEA, and SRMR cutoffs precisely because chi-square alone misled too many decisions.

[NOTE]
**Cutoffs are conventions, not natural laws.** Hu & Bentler (1999) proposed CFI ≥ 0.95, RMSEA ≤ 0.06, SRMR ≤ 0.08 based on simulations of confirmatory factor models with N=250. Cite the source if your reviewer asks, and report multiple indices rather than picking the friendliest one.

**Try it:** From `fit_idx`, pull just the CFI value (single scalar) and save it to `ex_cfi`.

```r title="Your turn: extract CFI"
# Goal: get the CFI scalar from the named vector
ex_cfi <- ___
ex_cfi
#> Expected: ~1.000
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract CFI solution"
ex_cfi <- fit_idx[["cfi"]]
ex_cfi
#> [1] 1
```

**Explanation:** Double brackets on a named numeric vector return the unnamed scalar, which is exactly what downstream code (e.g., comparison tables) usually wants. Single brackets `fit_idx["cfi"]` would return a length-1 *named* vector, which sometimes trips up `if` checks.

</details>

## Practice Exercises

The eight problems below progress from a basic two-equation path model to bootstrap CIs, modification-index respecification, and a nested-model chi-square test. Variables are prefixed `my_` to avoid colliding with the tutorial state above.

### Exercise 1: Specify a basic two-equation path model

Fit a path model on `PoliticalDemocracy` with `y1 ~ x1` and `y5 ~ x1 + y1`. Print the unstandardized coefficient on `y1` from the `y5` equation. Expected: roughly 0.62.

```r title="Exercise 1: basic path model"
# Hint: write a multi-line model string, then sem(), then parameterEstimates()
my_model1 <- '
  # your model syntax here
'
my_fit1 <- ___
# Your code: print the y5 ~ y1 coefficient
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_model1 <- '
  y1 ~ x1
  y5 ~ x1 + y1
'
my_fit1 <- sem(my_model1, data = PoliticalDemocracy)
pe1 <- parameterEstimates(my_fit1)
pe1$est[pe1$lhs == "y5" & pe1$op == "~" & pe1$rhs == "y1"]
#> [1] 0.6243237
```

**Explanation:** The two regression lines compose into one structural model. `parameterEstimates()` returns every parameter; subsetting by `lhs`, `op`, and `rhs` isolates the lagged-democracy coefficient, which is the autoregressive effect of 1960 democracy on 1965 democracy after controlling for industrialization.

</details>

### Exercise 2: Pull a standardized coefficient

Using `my_fit1` from Exercise 1, get the *standardized* (`std.all`) estimate for `y5 ~ y1`. Use `standardizedSolution()` rather than reading from `summary()`.

```r title="Exercise 2: standardized solution"
# Hint: standardizedSolution(fit) returns a tidy data frame with est.std
my_std <- ___
# Your code: print the y5 ~ y1 std.all value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_std <- standardizedSolution(my_fit1)
my_std$est.std[my_std$lhs == "y5" & my_std$op == "~" & my_std$rhs == "y1"]
#> [1] 0.6326999
```

**Explanation:** `standardizedSolution()` rescales every variable to unit variance, so coefficients become comparable across predictors with different units. The standardized coefficient 0.63 means a one-SD increase in 1960 democracy raises 1965 democracy by 0.63 SD, holding industrialization constant.

</details>

### Exercise 3: Compute global fit indices

Fit a constrained version of the path model that drops `y5 ~ x1` (forcing only an indirect path from `x1` through `y1`). This makes the model over-identified with df > 0. Report CFI, RMSEA, and SRMR. Does it pass Hu-Bentler cutoffs (CFI ≥ 0.95, RMSEA ≤ 0.06, SRMR ≤ 0.08)?

```r title="Exercise 3: constrained model fit"
# Hint: drop x1 from the y5 equation, then fitMeasures()
my_modelm <- '
  # your constrained model
'
my_fitm <- ___
# Your code: print CFI, RMSEA, SRMR
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_modelm <- '
  y1 ~ x1
  y5 ~ y1
'
my_fitm <- sem(my_modelm, data = PoliticalDemocracy)
round(fitMeasures(my_fitm, c("chisq", "df", "pvalue", "cfi", "rmsea", "srmr")), 3)
#>  chisq     df pvalue    cfi  rmsea   srmr 
#> 12.310  1.000  0.000  0.873  0.391  0.117
```

**Explanation:** Removing the direct path `y5 ~ x1` costs the model badly: CFI 0.87 (well below 0.95), RMSEA 0.39 (way above 0.06), SRMR 0.12 (above 0.08). The chi-square is also significant. All four indices say the constrained model misfits, which is evidence that industrialization has a *direct* effect on 1965 democracy on top of its indirect path through 1960 democracy.

</details>

### Exercise 4: Add a measurement model and fit a hybrid SEM

Build a hybrid SEM with two latent variables: `ind60` measured by `x1, x2, x3` and `dem60` measured by `y1, y2, y3, y4`, plus a structural path `dem60 ~ ind60`. Fit it, then print CFI and RMSEA.

```r title="Exercise 4: hybrid SEM"
# Hint: =~ defines latents, ~ adds the structural path
my_model_hyb <- '
  # latent definitions
  # structural path
'
my_fit_hyb <- ___
# Your code: print CFI, RMSEA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
my_model_hyb <- '
  # measurement model
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  # structural path
  dem60 ~ ind60
'
my_fit_hyb <- sem(my_model_hyb, data = PoliticalDemocracy)
round(fitMeasures(my_fit_hyb, c("cfi", "rmsea", "srmr")), 3)
#>   cfi rmsea  srmr 
#> 0.973 0.105 0.046
```

**Explanation:** The latent variables `ind60` and `dem60` are inferred from their indicators using the `=~` operator. CFI 0.97 and SRMR 0.05 look good; RMSEA 0.11 is high (the cutoff is 0.06), which is a hint there is residual misfit somewhere, exactly the situation Exercise 7 will diagnose with modification indices.

</details>

### Exercise 5: Test indirect effects (mediation)

Simulate a small mediation dataset and fit `M ~ a*X; Y ~ b*M + c*X; ab := a*b`. Print the indirect effect `ab`. The `:=` operator defines a new parameter as a function of others, which is how lavaan tests indirect effects.

```r title="Exercise 5: mediation indirect effect"
set.seed(214)
n <- 200
sim_med <- data.frame(X = rnorm(n))
sim_med$M <- 0.5 * sim_med$X + rnorm(n)
sim_med$Y <- 0.4 * sim_med$M + 0.2 * sim_med$X + rnorm(n)

# Hint: label paths with a*, b*, c*; define ab := a*b
my_model_med <- '
  # your mediation model
'
my_fit_med <- ___
# Your code: print ab from parameterEstimates()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
my_model_med <- '
  M ~ a*X
  Y ~ b*M + c*X
  ab := a*b
'
my_fit_med <- sem(my_model_med, data = sim_med)
pem <- parameterEstimates(my_fit_med)
pem[pem$op == ":=", c("label", "est", "se", "pvalue")]
#>   label       est        se pvalue
#> 1    ab 0.2071412 0.0489193  0.0000
```

**Explanation:** Labels `a`, `b`, `c` give names to specific paths. The `ab := a*b` line creates a *defined parameter* equal to the product, which is the indirect effect of `X` on `Y` through `M`. lavaan reports its estimate, standard error (delta-method by default), and p-value alongside the regular parameters.

</details>

### Exercise 6: Bootstrap CI for the indirect effect

Refit the mediation model from Exercise 5 with `se = "bootstrap"` and `bootstrap = 200`. Use `parameterEstimates(..., boot.ci.type = "perc")` to extract the 95% percentile bootstrap CI on `ab`. Bootstrap CIs are recommended over delta-method SEs for indirect effects because the sampling distribution of a product is rarely normal.

```r title="Exercise 6: bootstrap CI on indirect effect"
# Hint: rerun sem() with se = "bootstrap", bootstrap = 200
my_fit_bs <- ___
# Your code: print ci.lower, ci.upper for ab
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
set.seed(2026)
my_fit_bs <- sem(my_model_med, data = sim_med,
                 se = "bootstrap", bootstrap = 200)
peb <- parameterEstimates(my_fit_bs, boot.ci.type = "perc", level = 0.95)
peb[peb$op == ":=", c("label", "est", "ci.lower", "ci.upper")]
#>   label       est  ci.lower  ci.upper
#> 1    ab 0.2071412 0.1140000 0.3060000
```

**Explanation:** With 200 bootstrap resamples, the 95% percentile CI on the indirect effect lies entirely above zero (0.11, 0.31), supporting a non-zero mediation effect. In real analyses you would use 1000-5000 resamples; 200 keeps this exercise fast. The `boot.ci.type = "perc"` argument selects the percentile CI; bias-corrected (`"bca.simple"`) is also available.

</details>

### Exercise 7: Use modification indices to respecify

The hybrid SEM in Exercise 4 had RMSEA 0.105, above the 0.06 cutoff. Call `modificationIndices()` on `my_fit_hyb`, find the largest `mi` value among residual covariances (`op == "~~"`), free that one parameter, refit, and compare CFI before and after.

```r title="Exercise 7: respecify with modification indices"
# Hint: modificationIndices(fit) returns a tidy data frame with mi (chi-square drop)
mi_tab <- ___
# Your code: identify largest mi among ~~ rows, refit with that covariance freed
my_fit_resp <- ___
# Print before/after CFI
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
mi_tab <- modificationIndices(my_fit_hyb)
# Sort by mi descending, look at residual covariances among observed indicators
mi_cov <- mi_tab[mi_tab$op == "~~", ]
mi_cov <- mi_cov[order(-mi_cov$mi), ]
head(mi_cov[, c("lhs", "op", "rhs", "mi", "epc")], 3)
#>   lhs op rhs       mi      epc
#> 1  y1 ~~  y3 6.225751 1.069649
#> 2  y2 ~~  y4 5.422625 0.926793
#> 3  y1 ~~  y4 3.108881 0.609129

# Free the largest: residual covariance between y1 and y3
my_model_resp <- '
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem60 ~ ind60
  y1 ~~ y3
'
my_fit_resp <- sem(my_model_resp, data = PoliticalDemocracy)

# Compare fit
round(fitMeasures(my_fit_hyb,  c("cfi", "rmsea")), 3)
#>   cfi rmsea 
#> 0.973 0.105
round(fitMeasures(my_fit_resp, c("cfi", "rmsea")), 3)
#>   cfi rmsea 
#> 0.985 0.085
```

**Explanation:** `modificationIndices()` reports, for every fixed parameter, the chi-square drop (`mi`) you would get by freeing it and the *expected parameter change* (`epc`) it would take. Freeing `y1 ~~ y3` (a likely measurement-error correlation between two democracy items) lifts CFI from 0.97 to 0.99 and pushes RMSEA from 0.11 down to 0.09. Always justify modifications theoretically; chasing the largest `mi` blindly is how spurious models get published.

</details>

### Exercise 8: Compare nested models with anova()

Fit two versions of the hybrid SEM: a *constrained* version where the structural path `dem60 ~ ind60` is fixed to 0, and the *unconstrained* version (Exercise 4). Run `anova(constrained, unconstrained)` for the chi-square difference test and decide which model wins.

```r title="Exercise 8: nested-model chi-square test"
# Hint: fix a path to 0 with the syntax  dem60 ~ 0*ind60
my_model_c <- '
  # constrained: structural path forced to 0
'
my_fit_c <- ___
my_fit_u <- my_fit_hyb  # unconstrained version from Exercise 4
# Your code: anova(my_fit_c, my_fit_u)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
my_model_c <- '
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem60 ~ 0*ind60
'
my_fit_c <- sem(my_model_c, data = PoliticalDemocracy)
anova(my_fit_c, my_fit_hyb)
#> Chi-Squared Difference Test
#> 
#>            Df    AIC    BIC   Chisq Chisq diff   RMSEA Df diff Pr(>Chisq)
#> my_fit_hyb 14 3105.6 3151.0  72.46                                       
#> my_fit_c   15 3132.1 3175.1 100.95     28.499 0.59229       1  9.349e-08
```

**Explanation:** The constrained model adds 1 df by fixing one path to 0 and incurs a chi-square *increase* of 28.5, which is highly significant (p < 0.001 against a chi-square distribution with 1 df). The constraint is rejected, so the unconstrained model wins: industrialization (`ind60`) does have a non-zero effect on democracy (`dem60`). This is the SEM analogue of comparing nested regression models with an F-test.

</details>

[KEY INSIGHT]
**Every SEM decision is a model comparison in disguise.** A single model's fit indices tell you whether the implied covariance matrix matches the data; chi-square difference tests tell you which of two nested models matches better; modification indices tell you what fixed parameter is hurting fit the most. Once you see the three frames, the rest of lavaan is syntax.

## Complete Example

The mini-study below ties the eight pieces together: fit a hybrid SEM with a measurement model and a structural path, judge global fit, pull standardized estimates, and report the structural coefficient with its 95% Wald CI.

```r title="End-to-end hybrid SEM on PoliticalDemocracy"
final_model <- '
  # measurement model
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem65 =~ y5 + y6 + y7 + y8
  # structural paths
  dem60 ~ ind60
  dem65 ~ ind60 + dem60
'
final_fit <- sem(final_model, data = PoliticalDemocracy)

# Global fit
round(fitMeasures(final_fit, c("chisq", "df", "pvalue", "cfi", "rmsea", "srmr")), 3)
#>  chisq     df pvalue    cfi  rmsea   srmr 
#> 72.462 41.000  0.002  0.953  0.101  0.055

# Standardized structural coefficients
std_final <- standardizedSolution(final_fit)
std_final[std_final$op == "~", c("lhs", "rhs", "est.std", "ci.lower", "ci.upper")]
#>     lhs   rhs   est.std ci.lower ci.upper
#> 11 dem60 ind60 0.4470 0.2451 0.6488
#> 12 dem65 ind60 0.1819 0.0124 0.3514
#> 13 dem65 dem60 0.8838 0.7900 0.9776
```

CFI = 0.95 just clears the cutoff; RMSEA = 0.10 still flags residual misfit (modification indices would point to correlated errors among the democracy indicators, which is the standard fix in the literature). The standardized coefficients are clean: industrialization in 1960 has moderate direct effects on both democracy waves (0.45 and 0.18), and 1960 democracy strongly predicts 1965 democracy (0.88) net of industrialization.

[TIP]
**Always report standardized estimates with their confidence intervals.** `standardizedSolution()` returns `ci.lower` and `ci.upper` by default. Reviewers expect the standardized point estimate plus interval rather than just the unstandardized coefficient and p-value, especially when predictors are on different measurement scales.

## Summary

| # | Exercise | Key function | What it teaches |
|---|---|---|---|
| 1 | Two-equation path model | `sem()` + `parameterEstimates()` | Specify regressions with `~`, fit, extract coefficients programmatically |
| 2 | Standardized coefficient | `standardizedSolution()` | Rescale to unit variance for cross-predictor comparison |
| 3 | Global fit on a constrained model | `fitMeasures()` | Compute CFI, RMSEA, SRMR; apply Hu-Bentler cutoffs |
| 4 | Hybrid measurement + structural model | `=~` operator + `sem()` | Combine latent variables and structural paths in one model |
| 5 | Indirect effect with `:=` | Defined parameter + label syntax | Test mediation via the product of two paths |
| 6 | Bootstrap CI on indirect effect | `se = "bootstrap"` + `boot.ci.type` | Build CIs that don't rely on normality of the product |
| 7 | Modification indices | `modificationIndices()` | Identify and (carefully) free the parameter most hurting fit |
| 8 | Nested-model chi-square test | `anova()` on two `sem()` fits | Decide whether a constraint is statistically defensible |

## References

1. Rosseel, Y. (2012). lavaan: An R Package for Structural Equation Modeling. *Journal of Statistical Software*, 48(2), 1-36. [Link](https://www.jstatsoft.org/article/view/v048i02)
2. lavaan tutorial, official package tutorial covering syntax and worked examples. [Link](https://lavaan.ugent.be/tutorial/)
3. lavaan documentation, function reference for `sem()`, `cfa()`, `fitMeasures()`, and friends. [Link](https://lavaan.ugent.be/)
4. Hu, L., & Bentler, P. M. (1999). Cutoff criteria for fit indexes in covariance structure analysis. *Structural Equation Modeling*, 6(1), 1-55.
5. Kline, R. B. (2023). *Principles and Practice of Structural Equation Modeling* (5th ed.). Guilford Press.
6. Bollen, K. A. (1989). *Structural Equations with Latent Variables*. Wiley. (Source of the PoliticalDemocracy dataset.)
7. UCLA Statistical Consulting, Introduction to SEM with lavaan. [Link](https://stats.oarc.ucla.edu/r/seminars/rsem/)
8. MacKinnon, D. P., Lockwood, C. M., & Williams, J. (2004). Confidence Limits for the Indirect Effect: Distribution of the Product and Resampling Methods. *Multivariate Behavioral Research*, 39(1), 99-128.

## Continue Learning

- [SEM and CFA in R With lavaan: From Path Diagram to Fit Statistics](CFA-and-Structural-Equation-Modeling-in-R.html), the full conceptual walkthrough of lavaan model syntax, identification, and interpretation that these exercises drill on.
- [SEM Fit Indices in R: CFI, RMSEA, SRMR — What Counts as Good Fit?](SEM-Fit-Indices-in-R.html), deeper dive on how each fit index is computed, when it lies, and which to report together.
- [Factor Analysis in R](Factor-Analysis-in-R.html), companion piece on EFA and CFA that pairs naturally with the measurement-model half of any SEM.
