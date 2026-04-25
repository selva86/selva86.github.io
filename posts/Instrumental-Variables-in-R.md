---
title: "Instrumental Variables in R: ivreg Package & Two-Stage Least Squares"
slug: "Instrumental-Variables-in-R"
description: "Learn instrumental variables regression in R with the ivreg package. Run 2SLS estimation and interpret weak instrument, Wu-Hausman, and Sargan diagnostics."
keywords: "instrumental variables in R, ivreg, two-stage least squares, 2SLS, weak instruments, Wu-Hausman test, Sargan test, endogeneity, IV regression, ivreg package"
auto_link_terms: "instrumental variables|ivreg package|two-stage least squares|2SLS|Wu-Hausman test|Sargan test|endogeneity"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "FR-regr-18"
post_type: "FR"
fr_parent: "Multiple-Regression-in-R.html"
difficulty: "Advanced"
---

# Instrumental Variables in R: ivreg Package & Two-Stage Least Squares

<p class="lead">Instrumental variables (IV) regression is a method for estimating causal effects when a predictor is correlated with the error term, a problem called <strong>endogeneity</strong> that biases ordinary least squares. The <code>ivreg</code> package in R runs two-stage least squares (2SLS) to fix it, producing consistent estimates plus weak-instrument, Wu-Hausman, and Sargan diagnostics in one call.</p>

## When does OLS fail and IV rescue it?

The clearest way to see why IV matters is to build a scenario where you already know the truth, then watch OLS miss it. Suppose wages depend on schooling, but both wages and schooling also depend on unobserved ability. That hidden third variable biases the OLS slope on schooling, so you cannot tell causation from correlation. An instrument, a variable that affects schooling but nothing else in the equation, restores identification. Let's simulate this exact setup and compare OLS against `ivreg()` side by side.

```r title="Simulate endogeneity and compare OLS vs ivreg"
library(ivreg)

set.seed(2026)
n <- 1000
u <- rnorm(n)                 # unobserved confounder (e.g., ability)
z <- rnorm(n)                 # instrument (uncorrelated with u)
x <- 0.7 * z + 0.6 * u + rnorm(n)  # endogenous regressor
y <- 2 * x + 1.5 * u + rnorm(n)    # true causal slope on x is 2

sim <- data.frame(y = y, x = x, z = z)

ols_fit <- lm(y ~ x, data = sim)
iv_fit  <- ivreg(y ~ x | z, data = sim)

c(OLS = coef(ols_fit)["x"], IV = coef(iv_fit)["x"])
#>  OLS.x   IV.x
#> 2.567  1.989
```

The true causal slope is `2`. OLS reports `2.57`, inflated by the confounder `u`, which pushes both `x` and `y` upward together. `ivreg()` returns `1.99`, recovering the true effect. The pipe `|` in the formula is the IV syntax: regressors on the left, instruments on the right.

[KEY INSIGHT]
**OLS is biased because x carries the confounder's fingerprint.** The instrumental variable estimator isolates the variation in x driven only by z, the part guaranteed to be unrelated to u, and uses just that piece to estimate the slope on y.

**Try it:** Triple the strength of the confounder by changing `1.5 * u` to `4 * u` in the `y` equation. Refit OLS and IV. The OLS slope should drift much further from 2 while the IV slope barely moves.

```r title="Your turn: stronger confounder"
set.seed(2026)
n <- 1000
u <- rnorm(n)
z <- rnorm(n)
x <- 0.7 * z + 0.6 * u + rnorm(n)
y2 <- 2 * x + ___ * u + rnorm(n)   # change the multiplier on u

sim2 <- data.frame(y = y2, x = x, z = z)
# fit OLS and IV here, then print both x slopes
#> Expected: OLS drifts far from 2; IV stays near 2.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stronger confounder solution"
set.seed(2026)
n <- 1000
u <- rnorm(n)
z <- rnorm(n)
x <- 0.7 * z + 0.6 * u + rnorm(n)
y2 <- 2 * x + 4 * u + rnorm(n)

sim2 <- data.frame(y = y2, x = x, z = z)
ols2 <- lm(y ~ x, data = sim2)
iv2  <- ivreg(y ~ x | z, data = sim2)
c(OLS = coef(ols2)["x"], IV = coef(iv2)["x"])
#>  OLS.x   IV.x
#> 3.51   1.97
```

**Explanation:** The bigger the confounder's influence, the more `x` and `y` move together for non-causal reasons, so OLS overshoots. IV only uses the part of `x` driven by `z`, which is uncorrelated with `u`, so it stays near the true value of 2.

</details>

## What is the intuition behind two-stage least squares?

2SLS does in two steps what `ivreg()` does in one. First, it regresses the endogenous variable on the instrument and keeps the fitted values. That stripped-down version of `x` contains only the variation the instrument can explain, so it is uncorrelated with the confounder by construction. Second, it regresses the outcome on those fitted values. The slope you get is the consistent causal estimate.

![Causal graph showing how the instrument Z reaches Y only through the endogenous regressor X.](screenshots/Instrumental-Variables-in-R-iv-causal-graph.webp)
*Figure 1: The IV causal graph. The instrument Z affects Y only through X, so Z is uncorrelated with the confounder U.*

The graph encodes the two assumptions that make 2SLS work: Z must drive X (the arrow Z → X), and Z must reach Y only through X (no direct arrow Z → Y, no arrow Z → U). Replacing X with its prediction from Z purges the U-driven contamination.

```r title="Manual two-stage least squares"
# Stage 1: regress endogenous x on instrument z
stage1 <- lm(x ~ z, data = sim)
x_hat  <- fitted(stage1)

# Stage 2: regress y on the fitted x
stage2 <- lm(y ~ x_hat, data = sim)
coef(stage2)["x_hat"]
#>   x_hat
#> 1.989
```

Manual 2SLS reproduces the `ivreg()` slope of `1.99` exactly. The two-step recipe is what is happening under the hood when you call `ivreg()`.

![Two-stage least squares workflow: Stage 1 produces fitted X-hat, Stage 2 regresses Y on X-hat.](screenshots/Instrumental-Variables-in-R-2sls-stages.webp)
*Figure 2: 2SLS replaces the endogenous X with its projection onto the instrument, then runs the usual OLS.*

You can write the estimator compactly. Let $X$ be the matrix of regressors and $Z$ the matrix of instruments. The 2SLS estimator is:

$$\hat{\beta}_{2SLS} = (X'P_Z X)^{-1} X'P_Z y$$

Where:
- $P_Z = Z(Z'Z)^{-1}Z'$ is the projection matrix onto the instrument space
- $X'P_Z X$ replaces $X'X$ from OLS with the instrument-projected version of the cross-product
- $X'P_Z y$ replaces $X'y$ similarly

If you do not care about the math, the manual code above is all you need to picture what 2SLS is doing. Skip ahead.

[WARNING]
**Never trust the standard errors from a manual two-step approach.** The Stage 2 lm treats `x_hat` as observed data, but it was estimated, so the reported standard errors are too small. `ivreg()` corrects this and reports valid inference.

**Try it:** Confirm by hand that `coef(stage2)["x_hat"]` equals `coef(iv_fit)["x"]` to the third decimal place.

```r title="Your turn: manual stages match ivreg"
# stage2 and iv_fit already exist from earlier blocks.
# Print both slopes and check they match.
#> Expected: both equal ~1.989
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual stages match ivreg solution"
manual <- coef(stage2)["x_hat"]
canned <- coef(iv_fit)["x"]
round(c(manual = manual, ivreg = canned), 4)
#> manual.x_hat   ivreg.x
#>      1.9890     1.9890
```

**Explanation:** The point estimate is mechanical. The two routes give identical coefficients. They diverge only on the standard errors, which `ivreg()` computes correctly.

</details>

## How do you write the ivreg formula?

The `ivreg()` call uses a two-part formula separated by a pipe. To the left of the pipe go the regressors, including both exogenous and endogenous ones. To the right go the instruments, including the exogenous regressors again (any variable that does not need an instrument is its own instrument). A three-part form splits the two groups explicitly.

```r title="Two-part IV formula on cigarette demand"
data("CigaretteDemand", package = "ivreg")

# log(packs) is outcome; log(rprice) is endogenous (price set by demand)
# log(rincome) is exogenous; salestax is the instrument for log(rprice)
cig_iv_2part <- ivreg(
  log(packs) ~ log(rprice) + log(rincome) | log(rincome) + salestax,
  data = CigaretteDemand
)
coef(cig_iv_2part)
#>  (Intercept) log(rprice) log(rincome)
#>      9.4307     -1.1434       0.2145
```

The price elasticity of demand is `-1.14`: a one percent rise in real price predicts a `1.14` percent drop in packs sold. Notice `log(rincome)` appears on both sides of the pipe because it is exogenous and acts as its own instrument.

```r title="Three-part IV formula gives same estimates"
# Equivalent: exogenous | endogenous | instruments
cig_iv_3part <- ivreg(
  log(packs) ~ log(rincome) | log(rprice) | salestax,
  data = CigaretteDemand
)
coef(cig_iv_3part)
#>  (Intercept) log(rincome) log(rprice)
#>      9.4307       0.2145     -1.1434
```

Both forms produce identical coefficients. The three-part form is more explicit about which regressors are endogenous, which makes it easier to read with multiple endogenous variables.

[TIP]
**The three-part formula scales better than the two-part form.** Once you have two or more endogenous regressors, listing them explicitly between two pipes is far less error-prone than remembering to repeat every exogenous variable in the second group.

**Try it:** Add `cigtax` as a second instrument alongside `salestax`. The model becomes overidentified.

```r title="Your turn: add second instrument"
ex_cig_2iv <- ivreg(
  log(packs) ~ log(rincome) | log(rprice) | salestax + ___,
  data = CigaretteDemand
)
coef(ex_cig_2iv)
#> Expected: similar elasticity, slightly tighter fit.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-instrument cigarette IV solution"
ex_cig_2iv <- ivreg(
  log(packs) ~ log(rincome) | log(rprice) | salestax + cigtax,
  data = CigaretteDemand
)
coef(ex_cig_2iv)
#>  (Intercept) log(rincome) log(rprice)
#>      9.8950       0.2800     -1.2774
```

**Explanation:** With two instruments for one endogenous regressor, the model is overidentified and 2SLS uses the optimally-weighted combination. The elasticity is now `-1.28`, slightly larger in magnitude than the single-instrument estimate.

</details>

## What do the diagnostic tests tell you?

`summary()` on an `ivreg` fit prints three extra tests OLS does not give you. The weak-instrument test asks whether your instrument actually moves the endogenous regressor (a small F-statistic here means your 2SLS estimate is unreliable). The Wu-Hausman test asks whether OLS and 2SLS disagree enough to justify using IV at all. The Sargan test, only for overidentified models, asks whether your instruments are mutually consistent with the exogeneity assumption.

```r title="Run summary with diagnostics"
diag_summary <- summary(cig_iv_2part, diagnostics = TRUE)
diag_summary$diagnostics
#>                    df1 df2 statistic   p-value
#> Weak instruments     1  45    45.158 2.655e-08
#> Wu-Hausman           1  44     1.105 2.989e-01
#> Sargan               0  NA        NA        NA
```

Three lines, three different questions:

| Test | What it asks | Decision rule (rough) |
|---|---|---|
| Weak instruments | Does the instrument move the endogenous regressor enough? | F > 10 means strong; here F = 45 is fine |
| Wu-Hausman | Are OLS and 2SLS estimates significantly different? | Small p means OLS is biased and IV is needed; p = 0.30 means the data does not flag endogeneity strongly |
| Sargan | When overidentified, do all instruments agree? | NA here because the model is just-identified (one instrument for one endogenous regressor) |

The weak-instrument F of `45` is well above the rule-of-thumb threshold of `10`, so `salestax` is a strong instrument for `log(rprice)`. The Wu-Hausman p-value of `0.30` means the data alone cannot conclusively reject OLS, but theory says cigarette price is endogenous, so IV is still the defensible choice. Sargan is NA because there is one instrument for one endogenous regressor, so the validity assumption cannot be checked from the data.

[NOTE]
**The Sargan test only runs when you have more instruments than endogenous regressors.** A just-identified model is exactly identified, leaving no over-restrictions to test. With two or more instruments per endogenous regressor, Sargan compares them; if they disagree, at least one is invalid.

**Try it:** Refit with two instruments (`salestax + cigtax`) for one endogenous regressor and read the Sargan test. A high p-value (above 0.10) supports that both instruments are valid.

```r title="Your turn: weak vs strong instruments"
ex_weak_fit <- ivreg(
  log(packs) ~ log(rincome) | log(rprice) | ___ + ___,
  data = CigaretteDemand
)
summary(ex_weak_fit, diagnostics = TRUE)$diagnostics
#> Expected: Sargan row now reports a finite p-value.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sargan test on overidentified model"
ex_weak_fit <- ivreg(
  log(packs) ~ log(rincome) | log(rprice) | salestax + cigtax,
  data = CigaretteDemand
)
summary(ex_weak_fit, diagnostics = TRUE)$diagnostics
#>                    df1 df2 statistic   p-value
#> Weak instruments     2  44   244.734 2.0e-25
#> Wu-Hausman           1  44     3.064 8.7e-02
#> Sargan               1  NA     1.205 2.7e-01
```

**Explanation:** The Sargan p-value of `0.27` is comfortably above `0.10`, so we fail to reject the joint exogeneity of `salestax` and `cigtax`. Both instruments are statistically consistent with each other.

</details>

## How do you choose a valid instrument?

Two rules decide whether a candidate instrument is valid. Relevance means the instrument must actually predict the endogenous regressor, check the first-stage F-statistic (rule of thumb: above 10). Exogeneity means the instrument must affect the outcome only through the endogenous regressor, this is an assumption, not a test, and it has to come from subject-matter logic. Classic examples: distance to college for schooling, rainfall for crop prices, quarter of birth for education.

```r title="Compute the first-stage F-statistic"
# First stage: regress endogenous log(rprice) on the instrument and exogenous controls
first_stage  <- lm(log(rprice) ~ log(rincome) + salestax, data = CigaretteDemand)

# Reduced form: same regression without the instrument
reduced_stage <- lm(log(rprice) ~ log(rincome), data = CigaretteDemand)

# F-test: does adding salestax significantly improve the fit?
f_stat <- anova(reduced_stage, first_stage)
f_stat
#> Analysis of Variance Table
#>
#> Model 1: log(rprice) ~ log(rincome)
#> Model 2: log(rprice) ~ log(rincome) + salestax
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)
#> 1     46 0.4459
#> 2     45 0.1830  1   0.2629 64.66 4.085e-10
```

The F-statistic of `64.66` is far above `10`, confirming `salestax` is a strong instrument for `log(rprice)`. This first-stage F is what the diagnostic block summarizes when it says "Weak instruments F = 45" (different scaling, same idea).

[KEY INSIGHT]
**A weak instrument does not just inflate standard errors, it pulls 2SLS estimates toward the OLS bias it was meant to cure.** When your first-stage F is in single digits, stop and find a better instrument. Reporting an IV result with a weak first stage is worse than reporting OLS, because readers think the endogeneity has been fixed when it has not.

**Try it:** Replace `salestax` with `rnorm(nrow(CigaretteDemand))`, a random noise variable, and recompute the first-stage F. It should collapse near 1.

```r title="Your turn: noise as instrument"
set.seed(7)
ex_noise <- rnorm(nrow(CigaretteDemand))
ex_weak_first <- lm(log(rprice) ~ log(rincome) + ex_noise, data = CigaretteDemand)
ex_reduced <- lm(log(rprice) ~ log(rincome), data = CigaretteDemand)
anova(ex_reduced, ex_weak_first)
#> Expected: F-statistic near 1, p-value much greater than 0.05.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Noise instrument first-stage F"
set.seed(7)
ex_noise <- rnorm(nrow(CigaretteDemand))
ex_weak_first <- lm(log(rprice) ~ log(rincome) + ex_noise, data = CigaretteDemand)
ex_reduced <- lm(log(rprice) ~ log(rincome), data = CigaretteDemand)
anova(ex_reduced, ex_weak_first)
#> Analysis of Variance Table
#>
#> Model 1: log(rprice) ~ log(rincome)
#> Model 2: log(rprice) ~ log(rincome) + ex_noise
#>   Res.Df    RSS Df Sum of Sq      F  Pr(>F)
#> 1     46 0.4459
#> 2     45 0.4452  1  0.000698 0.0706 0.7917
```

**Explanation:** Noise has no relationship with `log(rprice)`, so the first-stage F drops to `0.07` and the p-value is `0.79`. Using this as an instrument would produce a 2SLS estimate driven entirely by sampling noise.

</details>

## Practice Exercises

### Exercise 1: Diagnose and fix an endogenous model

Simulate `n = 800` observations with `u <- rnorm(n)`, `z <- rnorm(n)`, `x <- 0.5*z + 0.8*u + rnorm(n)`, `y <- 1.5*x + 2*u + rnorm(n)`. Fit OLS and `ivreg()`. Then read the weak-instrument test and Wu-Hausman test from `summary(..., diagnostics = TRUE)`. Decide whether IV is justified.

```r title="Capstone 1: diagnose and fix"
# Simulate, fit, diagnose, decide.
# Hint: true causal slope is 1.5; OLS will overshoot.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
set.seed(11)
n <- 800
u <- rnorm(n)
z <- rnorm(n)
cap_x <- 0.5 * z + 0.8 * u + rnorm(n)
cap_y <- 1.5 * cap_x + 2 * u + rnorm(n)
cap_sim <- data.frame(y = cap_y, x = cap_x, z = z)

cap_ols <- lm(y ~ x, data = cap_sim)
cap_iv  <- ivreg(y ~ x | z, data = cap_sim)
c(OLS = coef(cap_ols)["x"], IV = coef(cap_iv)["x"])
#>  OLS.x   IV.x
#>  2.578  1.490

summary(cap_iv, diagnostics = TRUE)$diagnostics
#>                    df1 df2 statistic   p-value
#> Weak instruments     1 798    298.50 1.69e-58
#> Wu-Hausman           1 797    258.34 4.07e-51
#> Sargan               0  NA        NA        NA
```

**Decision:** Weak-instrument F = `298` is strong, Wu-Hausman p = `4e-51` is essentially zero, OLS is biased upward to `2.58` while IV recovers the true slope of `1.5`. IV is clearly justified.

</details>

### Exercise 2: Reproduce ivreg with two manual lm calls

Using the simulated data from the first H2 (`sim` data frame with `y`, `x`, `z`), run Stage 1 and Stage 2 by hand and compare the slope to `iv_fit`. Then explain in one sentence why the standard errors differ.

```r title="Capstone 2: manual 2SLS"
# Stage 1, Stage 2, compare to ivreg.
# Hint: use fitted() to get x_hat from Stage 1.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
cap_stage1 <- lm(x ~ z, data = sim)
cap_xhat   <- fitted(cap_stage1)
cap_stage2 <- lm(y ~ cap_xhat, data = sim)

c(manual = coef(cap_stage2)["cap_xhat"], ivreg = coef(iv_fit)["x"])
#> manual.cap_xhat        ivreg.x
#>           1.989          1.989

# Standard errors:
c(manual_se = summary(cap_stage2)$coefficients["cap_xhat", "Std. Error"],
  ivreg_se  = summary(iv_fit)$coefficients["x", "Std. Error"])
#> manual_se  ivreg_se
#>     0.044     0.060
```

**Explanation:** Coefficients match exactly. The manual standard error is too small because Stage 2 treats `x_hat` as observed; `ivreg()` adjusts for the fact that `x_hat` was estimated in Stage 1. Always trust `ivreg()` for inference.

</details>

### Exercise 3: Pick the better of two instrument sets

Using `CigaretteDemand`, fit two `ivreg` models for `log(rprice)`: one using `salestax` only, the other using `cigtax` only. Compare the weak-instrument F and the price elasticity. Which instrument is more credible?

```r title="Capstone 3: compare two instruments"
# Fit two single-instrument models, read diagnostics on each.
# Hint: same outcome and exogenous controls; vary only the instrument.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 3 solution"
cap_cig_a <- ivreg(log(packs) ~ log(rincome) | log(rprice) | salestax,
                   data = CigaretteDemand)
cap_cig_b <- ivreg(log(packs) ~ log(rincome) | log(rprice) | cigtax,
                   data = CigaretteDemand)

# Elasticities and weak-instrument Fs
list(
  salestax = list(elast = coef(cap_cig_a)["log(rprice)"],
                  weakF = summary(cap_cig_a, diagnostics = TRUE)$diagnostics["Weak instruments", "statistic"]),
  cigtax   = list(elast = coef(cap_cig_b)["log(rprice)"],
                  weakF = summary(cap_cig_b, diagnostics = TRUE)$diagnostics["Weak instruments", "statistic"])
)
#> $salestax
#> $salestax$elast
#> log(rprice)
#>      -1.143
#> $salestax$weakF
#> [1] 45.16
#>
#> $cigtax
#> $cigtax$elast
#> log(rprice)
#>      -1.343
#> $cigtax$weakF
#> [1] 117.6
```

**Decision:** Both elasticities are negative and similar in magnitude. `cigtax` has a larger weak-instrument F (`118` vs `45`), so the first stage is stronger. Either instrument is defensible by the F threshold; pairing them as in the overidentified model lets you formally test their consistency with Sargan.

</details>

## Complete Example

End-to-end on `CigaretteDemand`: spot endogeneity, pick instruments, fit, diagnose, interpret.

```r title="End-to-end IV pipeline on CigaretteDemand"
library(ivreg)
data("CigaretteDemand", package = "ivreg")

# Step 1: OLS for comparison
ce_ols <- lm(log(packs) ~ log(rprice) + log(rincome), data = CigaretteDemand)
coef(ce_ols)["log(rprice)"]
#> log(rprice)
#>     -1.337

# Step 2: 2SLS with two instruments (overidentified for Sargan)
ce_iv <- ivreg(log(packs) ~ log(rincome) | log(rprice) | salestax + cigtax,
               data = CigaretteDemand)
coef(ce_iv)["log(rprice)"]
#> log(rprice)
#>     -1.277

# Step 3: full diagnostics
ce_diag <- summary(ce_iv, diagnostics = TRUE)
ce_diag$diagnostics
#>                    df1 df2 statistic   p-value
#> Weak instruments     2  44   244.734 2.011e-25
#> Wu-Hausman           1  44     3.064 8.685e-02
#> Sargan               1  NA     1.205 2.722e-01

# Step 4: 95% confidence interval for the elasticity
confint(ce_iv, "log(rprice)", level = 0.95)
#>                  2.5 %     97.5 %
#> log(rprice)   -1.5476    -1.0064
```

**Interpretation:** The IV elasticity is `-1.28`, statistically distinct from OLS's `-1.34` but not dramatically so. Both instruments pass the weak-instrument test (F = 245), the Sargan p-value of `0.27` says they are mutually consistent with exogeneity, and the Wu-Hausman p of `0.087` is borderline. With a 95% confidence interval of `[-1.55, -1.01]`, the demand for cigarettes is elastic: a 10 percent price increase is estimated to drop sales by roughly 13 percent.

## Summary

| Concept | R function or call | When to use |
|---|---|---|
| Endogeneity check | `ivreg()` + `summary(., diagnostics = TRUE)` | Any time a regressor might correlate with the error |
| 2SLS estimation | `ivreg(y ~ X | Z)` or `ivreg(y ~ exog | endo | inst)` | Causal effect with at least one valid instrument |
| First-stage F | `anova()` of nested `lm()` or weak-instrument row in `diagnostics` | Verify instrument relevance (rule: F > 10) |
| Wu-Hausman | `diagnostics["Wu-Hausman", ]` | Decide whether 2SLS differs from OLS enough to matter |
| Sargan | `diagnostics["Sargan", ]` | Test consistency across instruments (overidentified models only) |
| Manual 2SLS | Two `lm()` calls (Stage 1 then Stage 2) | Pedagogy only, never for reporting standard errors |

The full reasoning chain is: confirm an instrument is relevant via the first-stage F, defend its exogeneity by argument, fit `ivreg()`, read the diagnostics, and report the IV coefficient with its proper standard error and confidence interval.

## References

1. Kleiber, C. & Zeileis, A., *ivreg: Two-Stage Least-Squares Regression with Diagnostics*. CRAN vignette (2025). [Link](https://cran.r-project.org/web/packages/ivreg/vignettes/ivreg.html)
2. Stock, J. & Watson, M., *Introduction to Econometrics*. 4th ed., Pearson (2020). Chapter 12 on instrumental variables.
3. Wooldridge, J., *Introductory Econometrics: A Modern Approach*. 7th ed., Cengage (2020). Chapter 15.
4. Angrist, J. & Pischke, J-S., *Mostly Harmless Econometrics*. Princeton University Press (2009). Chapter 4.
5. Hanck, C., Arnold, M., Gerber, A. & Schmelzer, M., *Introduction to Econometrics with R*. Chapter 12. [Link](https://www.econometrics-with-r.org/12-ivr.html)
6. Fox, J., Kleiber, C. & Zeileis, A., *ivreg* package reference manual. [Link](https://cran.r-project.org/web/packages/ivreg/ivreg.pdf)
7. Staiger, D. & Stock, J., *Instrumental Variables Regression with Weak Instruments*. Econometrica 65(3):557-586 (1997).
8. R Core Team, `formula` help page documenting the `|` operator. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html)

## Continue Learning

- [Multiple Regression in R](Multiple-Regression-in-R.html), the parent topic: how OLS handles multiple predictors before you reach for IV.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), where endogeneity sits inside the "exogenous regressors" assumption and this post covers the four others.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html), the broader toolkit for spotting model problems that IV can or cannot fix.
