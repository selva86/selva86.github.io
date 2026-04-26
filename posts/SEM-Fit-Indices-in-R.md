---
title: "SEM Fit Indices in R: CFI, RMSEA, SRMR — What Counts as Good Fit?"
slug: SEM-Fit-Indices-in-R
description: "Read SEM fit indices in R with lavaan: CFI, RMSEA, SRMR cutoffs, what counts as good fit, and what to do when your model misfits. Runnable R code shown."
keywords: "SEM fit indices in R, CFI, RMSEA, SRMR, lavaan fitMeasures, model fit SEM, Hu Bentler cutoffs, good fit thresholds, structural equation modeling fit, lavaan tutorial"
auto_link_terms: "SEM fit indices|fitMeasures()|CFI cutoff|RMSEA cutoff|SRMR cutoff|Hu Bentler cutoffs|good model fit|model fit indices"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-26
curriculum_id: FR-mult-11
post_type: FR
fr_parent: CFA-and-Structural-Equation-Modeling-in-R.html
difficulty: "Intermediate"
---

# SEM Fit Indices in R: CFI, RMSEA, SRMR — What Counts as Good Fit?

<p class="lead">Three numbers, CFI, RMSEA, and SRMR, decide whether reviewers take your CFA or SEM model seriously. CFI is close to 1 when your model beats a baseline of "everything is uncorrelated"; RMSEA is close to 0 when the per-degree-of-freedom misfit is small; SRMR is close to 0 when the average residual correlation is small. This guide computes all three from a real lavaan fit, explains where the conventional cutoffs come from, and shows what to do when the numbers say your model does not fit.</p>

## How do you compute CFI, RMSEA, and SRMR in R?

Before debating what counts as "good," let's see all three indices for a real CFA fit. The block below loads `lavaan`, fits the classic three-factor model on the `HolzingerSwineford1939` data, and pulls just the indices that matter. Reading these numbers in this exact order is the workflow you will repeat for every model you fit.

```r title="Fit a CFA and pull CFI, RMSEA, SRMR"
library(lavaan)

HS_model <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
'

fit_hs <- cfa(HS_model, data = HolzingerSwineford1939)

fit_idx <- fitMeasures(fit_hs, c("chisq", "df", "pvalue", "cfi", "rmsea", "srmr"))
round(fit_idx, 3)
#>  chisq     df pvalue    cfi  rmsea   srmr
#> 85.306 24.000  0.000  0.931  0.092  0.065
```

Three useful facts pop out. The chi-square test rejects exact fit (p < .001), which is the norm at N = 301 because chi-square is sensitive to sample size. CFI is 0.931, just below the conventional 0.95 line. RMSEA is 0.092, above the 0.06 line. SRMR is 0.065, comfortably under the 0.08 line. So the residuals look fine on average, but the model still leaves more structure on the table than you would want. We will fix that in Section 6.

[KEY INSIGHT]
**Each index answers a different question.** CFI asks "how much better than nothing?", RMSEA asks "how much misfit per degree of freedom?", and SRMR asks "how big are the leftover correlations?". One number tells you nothing; the trio triangulates.

**Try it:** Pull just the chi-square statistic and its degrees of freedom from `fit_hs` into a named numeric vector called `ex_chisq`. You will reuse these in Section 2.

```r title="Your turn: extract chi-square and df"
# Try it: build ex_chisq with only chisq and df
ex_chisq <- # your code here

ex_chisq
#> Expected: chisq = 85.306, df = 24
```

<details>
<summary>Click to reveal solution</summary>

```r title="Chi-square extraction solution"
ex_chisq <- fitMeasures(fit_hs, c("chisq", "df"))
round(ex_chisq, 3)
#>  chisq     df
#> 85.306 24.000
```

**Explanation:** `fitMeasures()` accepts a character vector of names; pass exactly the indices you need and you get a named numeric vector back.

</details>

## What does CFI actually compare your model to?

CFI stands for Comparative Fit Index. The "comparative" part is the whole story: CFI compares your model's misfit to the misfit of a worst-case baseline in which every observed variable is independent (no correlations at all). If your model is much better than that baseline, CFI is close to 1; if your model is barely better, CFI is close to 0.

The formula expresses that intuition directly:

$$\text{CFI} = 1 - \frac{\max(\chi^2_{\text{target}} - df_{\text{target}},\ 0)}{\max(\chi^2_{\text{target}} - df_{\text{target}},\ \chi^2_{\text{baseline}} - df_{\text{baseline}},\ 0)}$$

Where:

- $\chi^2_{\text{target}}$, $df_{\text{target}}$ are the chi-square and degrees of freedom for the model you fit.
- $\chi^2_{\text{baseline}}$, $df_{\text{baseline}}$ are the same quantities for the independence (baseline) model.

The `max(..., 0)` parts protect against negative numerators when a model fits better than its degrees of freedom would predict. lavaan computes the baseline for you and reports CFI; the next block reproduces the calculation by hand so the formula is not magic.

```r title="Compute CFI by hand from a baseline fit"
# Baseline model: every variable's variance, no covariances
null_model <- '
  x1 ~~ x1
  x2 ~~ x2
  x3 ~~ x3
  x4 ~~ x4
  x5 ~~ x5
  x6 ~~ x6
  x7 ~~ x7
  x8 ~~ x8
  x9 ~~ x9
'
fit_null <- lavaan(null_model, data = HolzingerSwineford1939)

target_excess   <- max(fitMeasures(fit_hs,   "chisq") - fitMeasures(fit_hs,   "df"), 0)
baseline_excess <- max(fitMeasures(fit_null, "chisq") - fitMeasures(fit_null, "df"), 0)

cfi_manual <- 1 - target_excess / baseline_excess
round(c(cfi_manual = cfi_manual, cfi_lavaan = fitMeasures(fit_hs, "cfi")), 3)
#> cfi_manual    cfi_lavaan
#>      0.931         0.931
```

The hand calculation matches lavaan's reported CFI to three decimals. The intuition to take away: the denominator is "how bad could things possibly get," and the ratio is "what fraction of that worst case does your model leave on the table." CFI = 0.931 means your model removes about 93 percent of the baseline's excess misfit. The textbook bar of 0.95 asks for 95 percent.

[NOTE]
**TLI is CFI's older sibling.** TLI (Tucker-Lewis Index, also called NNFI) uses the same baseline but normalises by df differently, which makes it dip lower for parsimonious models. Some journals expect both; both move together so reporting CFI alone is usually enough.

**Try it:** Compute TLI by hand for `fit_hs` using the formula `TLI = (chi2_null/df_null - chi2_target/df_target) / (chi2_null/df_null - 1)`. Save it to `ex_tli` and check it against `fitMeasures(fit_hs, "tli")`.

```r title="Your turn: TLI by hand"
# Try it: compute TLI manually
chi2_t <- # your code here
df_t   <- # your code here
chi2_n <- # your code here
df_n   <- # your code here

ex_tli <- # your code here

c(ex_tli = ex_tli, tli_lavaan = fitMeasures(fit_hs, "tli"))
#> Expected: both ≈ 0.896
```

<details>
<summary>Click to reveal solution</summary>

```r title="TLI calculation solution"
chi2_t <- fitMeasures(fit_hs,   "chisq")
df_t   <- fitMeasures(fit_hs,   "df")
chi2_n <- fitMeasures(fit_null, "chisq")
df_n   <- fitMeasures(fit_null, "df")

ex_tli <- (chi2_n / df_n - chi2_t / df_t) / (chi2_n / df_n - 1)
round(c(ex_tli = ex_tli, tli_lavaan = fitMeasures(fit_hs, "tli")), 3)
#>     ex_tli tli_lavaan
#>      0.896      0.896
```

**Explanation:** TLI rewards parsimony by dividing each chi-square by its df before comparing. That is why TLI (0.896) is below CFI (0.931) for the same model: TLI is harsher on models with many free parameters.

</details>

## Why does RMSEA penalise complexity (and small N)?

RMSEA is the Root Mean Square Error of Approximation. It tries to estimate the per-degree-of-freedom population discrepancy between your model and the truth, scaled by sample size. The formula is:

$$\text{RMSEA} = \sqrt{\frac{\max(\chi^2 - df,\ 0)}{df \cdot (N - 1)}}$$

Where $\chi^2$ and $df$ come from the target model and $N$ is the sample size. Two implications matter for daily use. First, dividing by $df$ rewards parsimonious models: adding free parameters that do not improve fit will raise RMSEA. Second, dividing by $(N-1)$ means small samples produce inflated RMSEA estimates even for correct models, which is why the 90% confidence interval is more important than the point estimate.

```r title="RMSEA point estimate, CI, and close-fit p-value"
fitMeasures(fit_hs, c("rmsea", "rmsea.ci.lower", "rmsea.ci.upper",
                      "rmsea.pvalue"))
#>          rmsea rmsea.ci.lower rmsea.ci.upper   rmsea.pvalue
#>          0.092          0.071          0.114          0.001
```

Read the four numbers as one sentence: the best estimate of population RMSEA is 0.092, the 90% CI runs from 0.071 to 0.114, and the test of "RMSEA ≤ 0.05" returns p = 0.001 (we reject close fit). Even the lower CI bound (0.071) is above the 0.06 conventional threshold, so the misfit is not just sampling noise. For a small-N study (say N = 80) you might see a point estimate of 0.05 with a CI from 0.00 to 0.13; the CI tells you the data cannot distinguish good fit from bad and the point estimate is overconfident.

[WARNING]
**RMSEA misbehaves for small models with low df.** Kenny, Kaniskan, and McCoach (2015) showed that for models with df under about 5 and N under 200, RMSEA is artificially inflated and routinely flags well-fitting models as poor. For small models, lean on SRMR and the chi-square test instead, and treat RMSEA as advisory.

**Try it:** Extract just the upper bound of the 90% RMSEA CI into `ex_rmsea_upper`. A strict test rejects close fit when the upper CI exceeds 0.10. Print TRUE if the strict test rejects, FALSE if it does not.

```r title="Your turn: strict RMSEA test"
# Try it: extract upper RMSEA CI and apply the 0.10 rule
ex_rmsea_upper <- # your code here

ex_rmsea_upper > 0.10
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="RMSEA upper CI solution"
ex_rmsea_upper <- fitMeasures(fit_hs, "rmsea.ci.upper")
unname(ex_rmsea_upper > 0.10)
#> [1] TRUE
```

**Explanation:** The upper 90% CI is 0.114, above 0.10, so even the optimistic edge of the interval rules out close fit. This is a stronger conclusion than reading the point estimate alone.

</details>

## When is SRMR more honest than the other two?

SRMR is the Standardized Root Mean Square Residual. While CFI and RMSEA are derived from the chi-square statistic and inherit its quirks, SRMR is computed directly from the gap between the observed correlation matrix and the model-implied correlation matrix. It has no dependence on the baseline model and very little dependence on the estimator, which makes it the most stable of the three indices when you switch from ML to robust ML or to ordered-categorical estimators.

```r title="SRMR and the residual correlation matrix"
# Standardised residuals are the building blocks of SRMR
resid_cor <- residuals(fit_hs, type = "cor")$cov
round(resid_cor[1:5, 1:5], 3)
#>        x1     x2     x3     x4     x5
#> x1  0.000 -0.060  0.054  0.080  0.029
#> x2 -0.060  0.000 -0.022 -0.015 -0.025
#> x3  0.054 -0.022  0.000 -0.040 -0.067
#> x4  0.080 -0.015 -0.040  0.000  0.011
#> x5  0.029 -0.025 -0.067  0.011  0.000

# SRMR is (roughly) the root mean square of these off-diagonal residuals
fitMeasures(fit_hs, "srmr")
#>  srmr
#> 0.065
```

The diagonal is zero by construction (each variable correlates 1.0 with itself, and the model reproduces variances exactly). The off-diagonal entries are the model's leftover correlations: how far each pair of indicators differs from what the model implies. Most are small (|r| < 0.05), which is why SRMR is comfortable at 0.065. The largest residual in the snippet above, 0.080 between x1 and x4, hints that the model could be improved by allowing those two to share variance beyond what their factors explain.

**Try it:** Find the indicator pair with the largest absolute off-diagonal residual in `resid_cor`. Save the value to `ex_max_resid`. The pair with the biggest residual is your first candidate for respecification.

```r title="Your turn: largest standardised residual"
# Try it: find max(abs(resid_cor)) excluding the diagonal
diag(resid_cor) <- NA
ex_max_resid <- # your code here

round(ex_max_resid, 3)
#> Expected: ≈ 0.110
```

<details>
<summary>Click to reveal solution</summary>

```r title="Largest residual solution"
diag(resid_cor) <- NA
ex_max_resid <- max(abs(resid_cor), na.rm = TRUE)
round(ex_max_resid, 3)
#> [1] 0.11
```

**Explanation:** Setting the diagonal to NA keeps it out of the max. The largest absolute residual (≈ 0.11) is between x7 and x9, two speed indicators, suggesting their relationship goes beyond the latent `speed` factor.

</details>

## What thresholds make a fit "good"?

The most cited cutoffs come from Hu and Bentler (1999), who studied how often each index correctly accepted true models and rejected misspecified ones across thousands of simulated datasets. Their two-index recommendation is the rule most reviewers expect today: report SRMR with either CFI or RMSEA, and meet the cutoffs for both.

| Index | Excellent | Acceptable | Poor | Source |
|---|---|---|---|---|
| CFI | ≥ 0.95 | 0.90 – 0.95 | < 0.90 | Hu & Bentler (1999); Bentler (1990) |
| RMSEA | ≤ 0.06 | 0.06 – 0.08 | > 0.10 | Hu & Bentler (1999); Browne & Cudeck (1992) |
| SRMR | ≤ 0.08 | 0.08 – 0.10 | > 0.10 | Hu & Bentler (1999) |

Three caveats kill any blanket use of this table. Hu and Bentler simulated continuous, normally distributed indicators with N ≥ 250 and small-to-moderate models; outside that envelope, the cutoffs are advisory rather than law. With ordered-categorical data fit by `WLSMV`, RMSEA and CFI tend to look artificially better, so use the scaled/robust versions reported by `fitMeasures()` and demand a tougher CFI (Xia & Yang, 2019). With very large models (50+ indicators), CFI drifts down even when the model is correct, so a CFI of 0.92 on a big model is not the same red flag as 0.92 on a small one (Shi, Lee & Maydeu-Olivares, 2019).

[TIP]
**Use the `.scaled` columns when you use a robust estimator.** Calls like `cfa(model, data, estimator = "MLR")` or `cfa(model, data, ordered = TRUE)` add columns such as `cfi.scaled` and `rmsea.scaled` to `fitMeasures()`. Report those, not the unscaled defaults; otherwise reviewers familiar with robust SEM will flag the inconsistency.

**Try it:** A colleague reports CFI = 0.93, RMSEA = 0.07, SRMR = 0.05 for a CFA on continuous data with N = 400. Save the verdict ("acceptable", "excellent", or "poor") for each index to `ex_verdict` and decide whether the model passes the two-index rule.

```r title="Your turn: classify a fit"
# Try it: classify CFI = 0.93, RMSEA = 0.07, SRMR = 0.05
ex_verdict <- c(
  cfi   = ,  # your code here
  rmsea = ,  # your code here
  srmr  =    # your code here
)

ex_verdict
#> Expected:   cfi      rmsea      srmr
#>             "acceptable" "acceptable" "excellent"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Classification solution"
ex_verdict <- c(
  cfi   = "acceptable",   # 0.93 is in [0.90, 0.95)
  rmsea = "acceptable",   # 0.07 is in (0.06, 0.08]
  srmr  = "excellent"     # 0.05 is below 0.08
)
ex_verdict
#>          cfi        rmsea         srmr
#> "acceptable" "acceptable"  "excellent"
```

**Explanation:** The two-index rule (Hu & Bentler) wants either (CFI excellent AND SRMR excellent) or (RMSEA excellent AND SRMR excellent). Here both CFI and RMSEA are merely acceptable, so the model fails the strict version of the rule. It would pass the older Browne & Cudeck (1992) "adequate fit" bar.

</details>

## What do you do when fit is bad?

When the indices say no, the next step is diagnosis, not deletion. lavaan's `modindices()` ranks the constraints (parameters fixed at zero) by the chi-square drop you would gain by freeing them. The biggest hits are candidates for respecification, but only if you can defend them theoretically. A residual covariance between two indicators is defensible when those indicators share method (same wording, same scale, same time of measurement); a cross-loading is defensible when the indicator is theoretically related to a second factor.

```r title="Top modification indices for the misfitting model"
mi_top <- modindices(fit_hs, sort = TRUE, maximum.number = 5)
mi_top[, c("lhs", "op", "rhs", "mi", "epc")]
#>       lhs op rhs    mi    epc
#> 1 visual =~  x9 36.41  0.577
#> 2 visual =~  x7 18.63 -0.422
#> 3   x7 ~~  x8 34.15  0.536
#> 4   x8 ~~  x9 14.95 -0.423
#> 5   x1 ~~  x9  8.51  0.135
```

Two patterns show up. Indicator x9 wants to load on `visual` in addition to `speed` (mi = 36.4, epc = +0.58), which is plausible because x9 ("straight and curved capitals") has a visual-perception component. Indicators x7, x8, x9 also share residual covariance among themselves, hinting at a method effect from being administered as timed speeded tasks. Adding the cross-loading is the more defensible move; it has substantive justification beyond "this lowers chi-square."

[KEY INSIGHT]
**Modification indices propose, theory disposes.** Free a parameter only when you can give a sentence-long substantive reason. Chasing every large MI is how you end up with a model that fits this sample beautifully and replicates nowhere.

```r title="Respecify, refit, and compare"
HS_model_v2 <- '
  visual  =~ x1 + x2 + x3 + x9
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
'

fit_hs_v2 <- cfa(HS_model_v2, data = HolzingerSwineford1939)

compare_idx <- rbind(
  v1 = fitMeasures(fit_hs,    c("chisq", "df", "cfi", "rmsea", "srmr")),
  v2 = fitMeasures(fit_hs_v2, c("chisq", "df", "cfi", "rmsea", "srmr"))
)
round(compare_idx, 3)
#>       chisq df   cfi rmsea  srmr
#> v1   85.306 24 0.931 0.092 0.065
#> v2   52.382 23 0.967 0.066 0.052
```

Adding the single cross-loading drops chi-square by 33 points for one degree of freedom, lifts CFI from 0.931 to 0.967 (now above 0.95), pulls RMSEA down to 0.066 (one notch above the 0.06 cutoff), and lowers SRMR to 0.052. Three of the four indicators of fit improved meaningfully. That is a publishable respecification, and crucially, it has a substantive story.

**Try it:** Try a different respecification: instead of the `visual =~ x9` cross-loading, add the `x7 ~~ x8` residual covariance. Fit the new model and store it as `ex_fit_v3`. Print its CFI to compare with v2's 0.967.

```r title="Your turn: alternative respecification"
# Try it: add x7 ~~ x8 instead of the visual =~ x9 cross-loading
HS_model_v3 <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
  x7 ~~ x8
'

ex_fit_v3 <- # your code here

round(fitMeasures(ex_fit_v3, "cfi"), 3)
#> Expected: ≈ 0.957 (improvement, but smaller than the cross-loading)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alternative respec solution"
HS_model_v3 <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
  x7 ~~ x8
'
ex_fit_v3 <- cfa(HS_model_v3, data = HolzingerSwineford1939)
round(fitMeasures(ex_fit_v3, c("cfi", "rmsea", "srmr")), 3)
#>   cfi rmsea  srmr
#> 0.957 0.073 0.061
```

**Explanation:** The residual-covariance route improves fit too, but less than the cross-loading. When two respecifications both have a defensible story, prefer the one that improves fit more and changes parameter interpretation least; here that is the cross-loading because it adds substantive content (x9 measures both abilities).

</details>

## Practice Exercises

### Exercise 1: Fit on a subsample and read the indices

Subset `HolzingerSwineford1939` to school = "Pasteur" and refit `HS_model`. Save the fit to `fit_pasteur` and report CFI, RMSEA, SRMR. Decide whether each index passes the Hu & Bentler cutoff.

```r title="Capstone Exercise 1"
# Exercise: fit HS_model on Pasteur students only
# Hint: subset(), then cfa(); pull the trio with fitMeasures()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Pasteur subsample solution"
pasteur_data <- subset(HolzingerSwineford1939, school == "Pasteur")

fit_pasteur <- cfa(HS_model, data = pasteur_data)

round(fitMeasures(fit_pasteur, c("cfi", "rmsea", "srmr")), 3)
#>   cfi rmsea  srmr
#> 0.928 0.087 0.069
```

**Explanation:** With N ≈ 156 the indices look similar to the full sample but slightly worse, and the RMSEA point estimate alone fails the 0.06 cutoff. Inspect the 90% CI before condemning the model: `fitMeasures(fit_pasteur, "rmsea.ci.upper")` will be near 0.12, so even the optimistic bound rules out close fit. Same conclusion as before: the three-factor model is close, not clean.

</details>

### Exercise 2: Compare a one-factor `g` model to the three-factor model

Fit a single-factor `g` model where one latent variable explains all nine indicators. Save the fit to `fit_g`. Compare its CFI, RMSEA, SRMR to `fit_hs` in a `compare_g` data frame and decide which model wins.

```r title="Capstone Exercise 2"
# Exercise: fit a one-factor g model on the same nine indicators
# Hint: g =~ x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="One-factor vs three-factor solution"
g_model <- '
  g =~ x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9
'
fit_g <- cfa(g_model, data = HolzingerSwineford1939)

compare_g <- rbind(
  three_factor = fitMeasures(fit_hs, c("chisq", "df", "cfi", "rmsea", "srmr")),
  one_factor   = fitMeasures(fit_g,  c("chisq", "df", "cfi", "rmsea", "srmr"))
)
round(compare_g, 3)
#>                chisq df   cfi rmsea  srmr
#> three_factor  85.306 24 0.931 0.092 0.065
#> one_factor   312.264 27 0.652 0.187 0.139
```

**Explanation:** The one-factor model collapses on every index: CFI drops below 0.7, RMSEA jumps above 0.18, SRMR doubles. This is exactly the situation fit indices are designed to flag. The three-factor model wins decisively, even though it is not yet "excellent" by Hu & Bentler.

</details>

## Putting It All Together

Here is the full workflow in one block: fit, read the trio, diagnose with modification indices, respecify, refit, and confirm improvement. This is the loop you will run on every CFA or SEM you build.

```r title="End-to-end fit-evaluate-respecify pipeline"
# 1. Fit the original three-factor model (already in fit_hs)
# 2. Read the trio
fitMeasures(fit_hs, c("cfi", "rmsea", "srmr"))

# 3. If any index fails, look at the top MI and the largest residuals
modindices(fit_hs, sort = TRUE, maximum.number = 3)[, c("lhs","op","rhs","mi","epc")]

# 4. Add the most defensible parameter, refit
final_idx <- fitMeasures(fit_hs_v2, c("cfi", "rmsea", "srmr"))

# 5. Confirm the trio improved
round(final_idx, 3)
#>   cfi rmsea  srmr
#> 0.967 0.066 0.052
```

The respecified model passes the CFI and SRMR cutoffs and sits one notch above the strict RMSEA cutoff of 0.06. That combination is reportable as "good fit on two of three primary indices, marginal on RMSEA," which is honest and defensible.

## Summary

| Index | What it asks | One-line formula | Cutoff (good) | Main caveat |
|---|---|---|---|---|
| CFI | How much better than uncorrelated baseline? | $1 - (\chi^2 - df)_T / (\chi^2 - df)_B$ | ≥ 0.95 | Drifts down for very large models |
| RMSEA | Per-df misfit, scaled by N | $\sqrt{(\chi^2 - df)/(df \cdot (N-1))}$ | ≤ 0.06 (with CI) | Inflated for small models / small N |
| SRMR | Average leftover correlation | RMS of off-diagonal standardised residuals | ≤ 0.08 | Insensitive to misspecified factor structure |
| TLI | Like CFI but penalises non-parsimony | $(\chi^2_B/df_B - \chi^2_T/df_T) / (\chi^2_B/df_B - 1)$ | ≥ 0.95 | Moves with CFI; report whichever your audience expects |

Three takeaways: report at least CFI, RMSEA (with its 90% CI), and SRMR for any CFA or SEM. Apply Hu & Bentler cutoffs by default but adjust for sample size, model size, and estimator. When fit is poor, use modification indices and residuals to diagnose, but only free parameters you can defend with theory.

## References

1. Hu, L., & Bentler, P. M. (1999). Cutoff criteria for fit indexes in covariance structure analysis: Conventional criteria versus new alternatives. *Structural Equation Modeling*, 6(1), 1-55. [Link](https://doi.org/10.1080/10705519909540118)
2. Browne, M. W., & Cudeck, R. (1992). Alternative ways of assessing model fit. *Sociological Methods & Research*, 21(2), 230-258. [Link](https://doi.org/10.1177/0049124192021002005)
3. Kenny, D. A. (2024). Measuring Model Fit. [Link](http://davidakenny.net/cm/fit.htm)
4. Kline, R. B. (2016). *Principles and Practice of Structural Equation Modeling* (4th ed.). Guilford Press.
5. Rosseel, Y. (2012). lavaan: An R Package for Structural Equation Modeling. *Journal of Statistical Software*, 48(2). [Link](https://www.jstatsoft.org/article/view/v048i02)
6. lavaan documentation, `fitMeasures()` reference. [Link](https://lavaan.ugent.be/tutorial/cfa.html)
7. Kenny, D. A., Kaniskan, B., & McCoach, D. B. (2015). The performance of RMSEA in models with small degrees of freedom. *Sociological Methods & Research*, 44(3), 486-507. [Link](https://doi.org/10.1177/0049124114543236)
8. Xia, Y., & Yang, Y. (2019). RMSEA, CFI, and TLI in structural equation modeling with ordered categorical data. *Behavior Research Methods*, 51(1), 409-428. [Link](https://doi.org/10.3758/s13428-018-1055-2)

## Continue Learning

- [SEM and CFA in R With lavaan](CFA-and-Structural-Equation-Modeling-in-R.html), the parent tutorial that walks the full path from model syntax to respecification.
- [Exploratory Factor Analysis in R](Exploratory-Factor-Analysis-in-R.html), when you do not have a hypothesised factor structure to test, EFA finds one.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), the OLS analogue of fit indices: residual checks, normality, and influence diagnostics.
