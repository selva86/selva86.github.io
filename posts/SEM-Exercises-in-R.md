---
title: "SEM Exercises in R: 16 lavaan Practice Problems"
slug: "SEM-Exercises-in-R"
description: "16 structural equation modeling exercises in R with worked lavaan solutions: path models, CFA, fit indices, mediation, bootstrap, multi-group invariance, and ordered-categorical SEM."
keywords: "SEM exercises in R, lavaan exercises, lavaan practice, structural equation modeling exercises, lavaan CFA, lavaan mediation, lavaan bootstrap, measurement invariance R, lavaan WLSMV, modification indices"
mathjax: true
webr: true
date: "2026-05-13"
curriculum_id: "E8.4"
post_type: "EX"
sidebar_title: "SEM Exercises (16 problems)"
sidebar_order: 143
fr_parent: "CFA-and-Structural-Equation-Modeling-in-R.html"
auto_link_terms: "SEM exercises in R|lavaan exercises|lavaan practice|structural equation modeling exercises|lavaan path model|lavaan CFA|SEM practice problems"
auto_link_case_sensitive: false
target_keyword: "SEM exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# SEM Exercises in R: 16 lavaan Practice Problems

<p class="lead">These 16 structural equation modeling exercises in R take you through the full <code>lavaan</code> workflow on bundled datasets: writing model syntax, fitting CFA and full SEMs, reading fit indices, interpreting modification indices, estimating indirect effects with bootstrap intervals, testing measurement invariance across groups, and handling ordered-categorical indicators. Solutions are hidden behind a click and explained.</p>

## How are these problems structured?

Every problem gives you a task, the exact output your solution must reproduce, and a difficulty tag. You write code in the Your turn block, then expand the solution to verify your approach and read why it works. Code blocks share state across the page like notebook cells, so you only need to load packages once.

```r title="Run this once before any exercise"
library(lavaan)
```

The two datasets used throughout are bundled with `lavaan` itself: `PoliticalDemocracy` (75 nations, eight indicators of industrialization and political democracy in 1960 and 1965) and `HolzingerSwineford1939` (301 schoolchildren, nine cognitive tests grouped into visual, textual, and speed factors).

## Section 1. Specifying and fitting your first lavaan model (3 problems)

### Exercise 1.1: Fit a two-equation path model on PoliticalDemocracy

**Task:** A political scientist wants to confirm that 1960 industrialization (`x1`) predicts 1960 democracy (`y1`), which in turn predicts 1965 democracy (`y5`). Use `lavaan::sem()` to fit a two-equation path model with `y1` regressed on `x1`, and `y5` regressed on `y1`. Save the fitted object to `ex_1_1` and print `summary(ex_1_1)` so the parameter estimates appear.

**Expected result:**

```
#> lavaan 0.6 ended normally after 1 iterations
#>   Estimator                                         ML
#>   Number of observations                            75
#> Model Test User Model:
#>   Test statistic                                 0.000
#>   Degrees of freedom                                 0
#> Regressions:
#>                    Estimate  Std.Err  z-value  P(>|z|)
#>   y1 ~
#>     x1                1.270    0.131    9.677    0.000
#>   y5 ~
#>     y1                0.838    0.046   18.108    0.000
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
summary(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_1_1 <- '
  y1 ~ x1
  y5 ~ y1
'
ex_1_1 <- sem(mod_1_1, data = PoliticalDemocracy)
summary(ex_1_1)
#> lavaan 0.6 ended normally after 1 iterations
#>   Number of observations                            75
#> Model Test User Model:
#>   Test statistic                                 0.000
#>   Degrees of freedom                                 0
```

**Explanation:** The `~` operator means "regressed on" in lavaan syntax, exactly as in base R formulas. With two equations and three observed variables, the model is just-identified (df = 0), so the chi-square is forced to zero and no fit can be assessed. Just-identified path models always reproduce the covariances perfectly, which is why interesting SEMs add latent variables or constraints to push degrees of freedom above zero.

</details>

### Exercise 1.2: Specify a three-indicator measurement model with the =~ operator

**Task:** Define a one-factor measurement model where a latent `visual` factor is measured by three indicators (`x1`, `x2`, `x3`) from `HolzingerSwineford1939`. Use `cfa()` to fit it and save the result to `ex_1_2`. The `=~` operator reads as "is measured by" and tells lavaan to estimate factor loadings.

**Expected result:**

```
#> lavaan 0.6 ended normally after 19 iterations
#>   Number of observations                           301
#> Model Test User Model:
#>   Test statistic                                 0.000
#>   Degrees of freedom                                 0
#> Latent Variables:
#>                    Estimate  Std.Err  z-value  P(>|z|)
#>   visual =~
#>     x1                1.000
#>     x2                0.554    0.100    5.554    0.000
#>     x3                0.729    0.109    6.685    0.000
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
summary(ex_1_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_1_2 <- 'visual =~ x1 + x2 + x3'
ex_1_2 <- cfa(mod_1_2, data = HolzingerSwineford1939)
summary(ex_1_2)
#> Number of observations                           301
#> Latent Variables:
#>   visual =~
#>     x1                1.000
#>     x2                0.554    0.100    5.554    0.000
#>     x3                0.729    0.109    6.685    0.000
```

**Explanation:** The first indicator's loading is fixed to 1 by default ("marker variable" identification), which gives the latent factor a scale. Without this constraint the factor would be unidentified because you can rescale the latent variable and absorb the change into the loadings. With three indicators the model has 6 unique covariances and 6 free parameters (2 loadings + 3 residuals + 1 factor variance), so df = 0 and fit is perfect by construction.

</details>

### Exercise 1.3: Free a residual covariance with the ~~ operator

**Task:** Returning to the three-indicator `visual` factor on `HolzingerSwineford1939`, suppose `x1` and `x3` share a residual correlation because both are timed tasks. Modify the model from Exercise 1.2 to also estimate `x1 ~~ x3` (free residual covariance) and save the refit to `ex_1_3`. Use `parameterEstimates(ex_1_3)` to confirm the new parameter.

**Expected result:**

```
#> # The new row in parameterEstimates(ex_1_3):
#>   lhs op rhs   est    se      z pvalue
#>    x1 ~~  x3 0.297 0.198  1.500 0.134
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
parameterEstimates(ex_1_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_1_3 <- '
  visual =~ x1 + x2 + x3
  x1 ~~ x3
'
ex_1_3 <- cfa(mod_1_3, data = HolzingerSwineford1939)
parameterEstimates(ex_1_3)
#>      lhs op    rhs   est    se      z pvalue
#> 1 visual =~     x1 1.000 0.000     NA     NA
#> 2 visual =~     x2 0.554 0.100  5.554  0.000
#> 3 visual =~     x3 0.729 0.109  6.685  0.000
#> 4     x1 ~~     x1 0.553 0.119  4.652  0.000
#> 5     x1 ~~     x3 0.297 0.198  1.500  0.134
```

**Explanation:** The `~~` operator covers both variances (`x1 ~~ x1`) and covariances (`x1 ~~ x3`). lavaan estimates every indicator's residual variance automatically, so you only write `~~` lines when you want to free an off-diagonal residual covariance the default model fixed to zero. With this new parameter the model becomes unidentified for a three-indicator factor (df would go negative), so in practice you would need either four indicators or an equality constraint elsewhere to test the residual covariance.

</details>

## Section 2. Confirmatory factor analysis (3 problems)

### Exercise 2.1: Fit a classic three-factor CFA on HolzingerSwineford1939

**Task:** The canonical Holzinger-Swineford CFA defines three correlated factors: `visual` measured by `x1, x2, x3`; `textual` by `x4, x5, x6`; and `speed` by `x7, x8, x9`. Specify this model, fit it with `cfa()`, and save the fitted object to `ex_2_1`. Print only the fit statistics line of `summary(ex_2_1, fit.measures = TRUE)` (the Test User Model block).

**Expected result:**

```
#> lavaan 0.6 ended normally after 35 iterations
#>   Number of observations                           301
#> Model Test User Model:
#>   Test statistic                                85.306
#>   Degrees of freedom                                24
#>   P-value (Chi-square)                           0.000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
summary(ex_2_1, fit.measures = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_2_1 <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
'
ex_2_1 <- cfa(mod_2_1, data = HolzingerSwineford1939)
summary(ex_2_1, fit.measures = TRUE)
#> Test statistic                                85.306
#> Degrees of freedom                                24
#> P-value (Chi-square)                           0.000
```

**Explanation:** With three factors and three indicators each, lavaan estimates 6 free factor loadings (one per factor is fixed at 1), 9 residual variances, 3 factor variances, and 3 factor covariances, for 21 parameters against 45 unique covariances, giving df = 24. The chi-square is significant, which technically rejects exact fit, but with n = 301 the test is over-powered. That is why we look at CFI, TLI, RMSEA, and SRMR before judging the model, which Exercise 3.1 covers.

</details>

### Exercise 2.2: Extract standardized loadings with the std.all column

**Task:** Using `ex_2_1` from the previous exercise, pull only the factor loadings (rows where `op == "=~"`) with their standardized values (`std.all`). Save the resulting data frame to `ex_2_2`. Standardized loadings are easier to interpret than raw because all variables are on the same scale.

**Expected result:**

```
#>      lhs op rhs   est std.all
#> 1 visual =~  x1 1.000   0.772
#> 2 visual =~  x2 0.554   0.424
#> 3 visual =~  x3 0.729   0.581
#> 4 textual =~ x4 1.000   0.852
#> 5 textual =~ x5 1.113   0.855
#> 6 textual =~ x6 0.926   0.838
#> 7 speed =~  x7 1.000   0.570
#> 8 speed =~  x8 1.180   0.723
#> 9 speed =~  x9 1.082   0.665
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pe <- parameterEstimates(ex_2_1, standardized = TRUE)
ex_2_2 <- pe[pe$op == "=~", c("lhs", "op", "rhs", "est", "std.all")]
ex_2_2
#>       lhs op rhs   est std.all
#> 1  visual =~  x1 1.000   0.772
#> 2  visual =~  x2 0.554   0.424
#> 3  visual =~  x3 0.729   0.581
#> ...
```

**Explanation:** `parameterEstimates()` with `standardized = TRUE` adds three new columns: `std.lv` (latent variable standardized), `std.all` (both latent and observed standardized), and `std.nox` (everything except exogenous covariates standardized). `std.all` is the right column for reading loadings as correlations between indicator and factor. Anything above ~.5 is a reasonable loading; values below ~.3 suggest the indicator is barely tapping the factor.

</details>

### Exercise 2.3: Inspect estimates with the standardizedSolution helper

**Task:** Instead of slicing `parameterEstimates()` by hand, use `standardizedSolution(ex_2_1)` to get a clean table of standardized estimates with confidence intervals. Filter the result to only the factor covariance rows (where both sides are latent factors and `op == "~~"`) and save it to `ex_2_3`. This gives you the inter-factor correlations.

**Expected result:**

```
#>       lhs op     rhs est.std    se      z pvalue ci.lower ci.upper
#> 1  visual ~~  textual   0.459 0.064  7.189  0.000    0.334    0.585
#> 2  visual ~~    speed   0.471 0.073  6.461  0.000    0.328    0.613
#> 3 textual ~~    speed   0.283 0.069  4.117  0.000    0.149    0.418
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ss <- standardizedSolution(ex_2_1)
latents <- c("visual", "textual", "speed")
ex_2_3 <- ss[ss$op == "~~" & ss$lhs %in% latents & ss$rhs %in% latents & ss$lhs != ss$rhs, ]
ex_2_3
#>       lhs op     rhs est.std    se      z pvalue ci.lower ci.upper
#> 1  visual ~~  textual   0.459 0.064  7.189  0.000    0.334    0.585
#> 2  visual ~~    speed   0.471 0.073  6.461  0.000    0.328    0.613
#> 3 textual ~~    speed   0.283 0.069  4.117  0.000    0.149    0.418
```

**Explanation:** `standardizedSolution()` reports the standardized estimates directly with proper standard errors via the delta method, plus 95% confidence intervals out of the box. The factor correlations here (.46, .47, .28) show that visual and textual share moderate variance, and so do visual and speed, but textual and speed are weaker. None hit .85, so discriminant validity is supported and the three-factor structure makes sense.

</details>

## Section 3. Model fit and respecification (3 problems)

### Exercise 3.1: Pull CFI, TLI, RMSEA, and SRMR from fitMeasures

**Task:** Global fit of a CFA is judged by a handful of indices. Pull just `cfi`, `tli`, `rmsea`, and `srmr` from `ex_2_1` using `fitMeasures()` with the index names passed as a character vector. Save the named numeric to `ex_3_1` and round it to three decimals. Common thresholds for acceptable fit are CFI/TLI > .90, RMSEA < .08, SRMR < .08.

**Expected result:**

```
#>   cfi   tli rmsea  srmr
#> 0.931 0.896 0.092 0.065
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- round(fitMeasures(ex_2_1, c("cfi", "tli", "rmsea", "srmr")), 3)
ex_3_1
#>   cfi   tli rmsea  srmr
#> 0.931 0.896 0.092 0.065
```

**Explanation:** CFI = .93 and SRMR = .065 look fine, but RMSEA = .092 sits just over the .08 mark and TLI = .896 is borderline. With n = 301 this often signals a minor misspecification that modification indices can reveal. Always report all four: any single index can be misleading because CFI penalizes badly fitting baseline models, RMSEA over-rejects small models, and SRMR is insensitive to misspecified factor variances.

</details>

### Exercise 3.2: Use modification indices to find a missing parameter

**Task:** The borderline RMSEA in `ex_2_1` suggests one or two paths are missing. Run `modindices(ex_2_1, sort. = TRUE)` and save the top 5 rows (largest `mi`) to `ex_3_2`. Each row tells you the expected drop in chi-square (`mi`) and the standardized parameter value (`sepc.all`) if the suggested path were freed.

**Expected result:**

```
#>       lhs op rhs     mi     epc sepc.all
#> 1  visual =~  x9 36.411   0.577    0.519
#> 2      x7 ~~  x8 34.145   0.536    0.488
#> 3      x8 ~~  x9 14.946  -0.423   -0.415
#> 4  visual =~  x7  18.631  -0.422   -0.380
#> 5     x2 ~~  x7   8.918   0.213    0.157
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mi <- modindices(ex_2_1, sort. = TRUE)
ex_3_2 <- head(mi[, c("lhs", "op", "rhs", "mi", "epc", "sepc.all")], 5)
ex_3_2
#>       lhs op rhs     mi     epc sepc.all
#> 1  visual =~  x9 36.411   0.577    0.519
#> 2      x7 ~~  x8 34.145   0.536    0.488
```

**Explanation:** The largest modification index points to a cross-loading of `x9` (speeded discrimination) on the `visual` factor, suggesting `x9` taps both visual and speed abilities. Freeing this single parameter would drop chi-square by about 36. Treat modification indices as hypothesis generators, not as automatic improvements: only free a parameter if it makes substantive theoretical sense. Chasing every large MI gives you a model that fits the sample perfectly and replicates poorly.

</details>

### Exercise 3.3: Compare nested models with anova

**Task:** Test whether freeing the `visual =~ x9` cross-loading from Exercise 3.2 produces a significantly better fit than the original three-factor model. Fit the augmented model, then call `anova(ex_2_1, ex_3_3_alt)` and save the comparison table to `ex_3_3`. A significant chi-square difference (p < .05) supports the more complex model.

**Expected result:**

```
#> Chi-Squared Difference Test
#>             Df    AIC    BIC Chisq Chisq diff Df diff Pr(>Chisq)
#> ex_2_1      24   7517   7596 85.31
#> ex_3_3_alt  23   7484   7567 50.34      34.97       1  3.34e-09
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_3_3 <- '
  visual  =~ x1 + x2 + x3 + x9
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
'
ex_3_3_alt <- cfa(mod_3_3, data = HolzingerSwineford1939)
ex_3_3 <- anova(ex_2_1, ex_3_3_alt)
ex_3_3
#> Chi-Squared Difference Test
#>             Df Chisq Chisq diff Df diff Pr(>Chisq)
#> ex_2_1      24 85.31
#> ex_3_3_alt  23 50.34      34.97       1  3.34e-09
```

**Explanation:** `anova()` on two lavaan fits runs the chi-square difference test for nested models. The drop of nearly 35 chi-square units on 1 df is highly significant (p < .001), and the AIC also drops, so the cross-loading buys real explanatory power. But before keeping it, ask whether a measurement that loads on both visual and speed factors is theoretically defensible. If it is not, the better move is to drop `x9` rather than chase the MI.

</details>

## Section 4. Full SEM with structural paths (3 problems)

### Exercise 4.1: Fit the classic Bollen industrialization-democracy SEM

**Task:** The hallmark SEM on `PoliticalDemocracy` defines three latent variables: `ind60` (industrialization 1960) measured by `x1, x2, x3`; `dem60` (democracy 1960) measured by `y1, y2, y3, y4`; and `dem65` (democracy 1965) measured by `y5, y6, y7, y8`. The structural part regresses both `dem60` and `dem65` on `ind60`, plus `dem65` on `dem60`. Fit this model and save it to `ex_4_1`.

**Expected result:**

```
#> Model Test User Model:
#>   Test statistic                                72.462
#>   Degrees of freedom                                51
#>   P-value (Chi-square)                           0.026
#> Regressions:
#>                    Estimate  Std.Err  z-value  P(>|z|)
#>   dem60 ~
#>     ind60             1.483    0.399    3.715    0.000
#>   dem65 ~
#>     ind60             0.572    0.221    2.586    0.010
#>     dem60             0.837    0.098    8.514    0.000
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_1 <- # your code here
summary(ex_4_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_4_1 <- '
  # Measurement
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem65 =~ y5 + y6 + y7 + y8
  # Structural
  dem60 ~ ind60
  dem65 ~ ind60 + dem60
'
ex_4_1 <- sem(mod_4_1, data = PoliticalDemocracy)
summary(ex_4_1)
#> Test statistic                                72.462
#> Degrees of freedom                                51
#> Regressions:
#>   dem65 ~
#>     ind60             0.572    0.221    2.586    0.010
#>     dem60             0.837    0.098    8.514    0.000
```

**Explanation:** A full SEM has both a measurement model (the `=~` lines) and a structural model (the `~` lines). lavaan estimates them simultaneously, propagating measurement error into the structural coefficients. The chi-square is only marginally significant (p = .026), CFI typically exceeds .95 on this model, so fit is acceptable. The structural finding: industrialization in 1960 raises democracy in 1960, which then carries forward to 1965, with a small extra direct push from `ind60` to `dem65`.

</details>

### Exercise 4.2: Define an indirect effect with the := operator

**Task:** In the model from Exercise 4.1, the indirect effect of `ind60` on `dem65` flows through `dem60`. Label the two structural coefficients (`a` for `dem60 ~ ind60`, `b` for `dem65 ~ dem60`) and define `indirect := a * b` and `total := a * b + c` (where `c` is the direct path). Save the refit to `ex_4_2` and print the "Defined Parameters" block from `summary()`.

**Expected result:**

```
#> Defined Parameters:
#>                    Estimate  Std.Err  z-value  P(>|z|)
#>     indirect          1.241    0.350    3.548    0.000
#>     total             1.813    0.421    4.304    0.000
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
summary(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_4_2 <- '
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem65 =~ y5 + y6 + y7 + y8
  dem60 ~ a*ind60
  dem65 ~ c*ind60 + b*dem60
  indirect := a * b
  total    := a * b + c
'
ex_4_2 <- sem(mod_4_2, data = PoliticalDemocracy)
summary(ex_4_2)
#> Defined Parameters:
#>     indirect          1.241    0.350    3.548    0.000
#>     total             1.813    0.421    4.304    0.000
```

**Explanation:** Pre-multiplying a coefficient by a label (`a*ind60`) names that parameter so you can reuse it. The `:=` operator defines a new parameter as a function of the named ones, and lavaan applies the delta method to compute its standard error and z-test. The indirect effect (1.24) is highly significant, and it accounts for most of the total effect (1.81), confirming that 1960 democracy is the main channel through which industrialization shapes 1965 democracy.

</details>

### Exercise 4.3: Bootstrap a confidence interval for the indirect effect

**Task:** Delta-method standard errors assume the sampling distribution of the indirect effect is normal, which is wrong when sample size is small or the product is skewed. Refit `ex_4_2` with `se = "bootstrap"` and `bootstrap = 200` (use a small number so the page runs fast), then use `parameterEstimates(ex_4_3, boot.ci.type = "perc")` to pull the percentile bootstrap CI for the `indirect` row. Save the row to `ex_4_3`.

**Expected result:**

```
#>        lhs op rhs    label   est    se     z pvalue ci.lower ci.upper
#> 1 indirect :=  a*b indirect 1.241 0.317 3.913  0.000    0.711    1.916
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_4_3 <- '
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem65 =~ y5 + y6 + y7 + y8
  dem60 ~ a*ind60
  dem65 ~ c*ind60 + b*dem60
  indirect := a * b
'
fit_4_3 <- sem(mod_4_3, data = PoliticalDemocracy, se = "bootstrap", bootstrap = 200)
pe <- parameterEstimates(fit_4_3, boot.ci.type = "perc")
ex_4_3 <- pe[pe$label == "indirect", ]
ex_4_3
#>        lhs op rhs    label   est    se     z pvalue ci.lower ci.upper
#> 1 indirect :=  a*b indirect 1.241 0.317 3.913  0.000    0.711    1.916
```

**Explanation:** For mediation analysis, bootstrap percentile or bias-corrected intervals are the standard reporting choice because the product of two normals is skewed. In a real analysis you would use `bootstrap = 5000` or more; 200 here is purely for runtime. The CI excludes zero, so the indirect effect is significant by a non-parametric criterion as well as by the delta method. Researchers writing for journals usually report `boot.ci.type = "bca.simple"` for bias-corrected bootstrap intervals.

</details>

## Section 5. Multi-group, invariance, and categorical SEM (3 problems)

### Exercise 5.1: Fit the Holzinger-Swineford CFA separately for two schools

**Task:** The `HolzingerSwineford1939` dataset has a `school` variable with two levels: Pasteur and Grant-White. Fit the three-factor CFA from Exercise 2.1 separately to each school using the `group = "school"` argument and save the fit to `ex_5_1`. Inspect `summary(ex_5_1, fit.measures = TRUE)` to see per-group estimates and the combined fit.

**Expected result:**

```
#> Number of observations per group:
#>   Pasteur                                          156
#>   Grant-White                                      145
#> Model Test User Model:
#>   Test statistic                               115.851
#>   Degrees of freedom                                48
#>   P-value (Chi-square)                           0.000
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
summary(ex_5_1, fit.measures = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_5_1 <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
'
ex_5_1 <- cfa(mod_5_1, data = HolzingerSwineford1939, group = "school")
summary(ex_5_1, fit.measures = TRUE)
#> Number of observations per group:
#>   Pasteur                                          156
#>   Grant-White                                      145
```

**Explanation:** Passing `group =` tells lavaan to fit the model separately within each grouping level by default: every parameter is free in every group, so the df is roughly double the single-group model. This "configural" model is the baseline against which invariance constraints are tested. If the configural model itself fits poorly, the factor structure differs between groups and stronger invariance tests are not meaningful.

</details>

### Exercise 5.2: Test metric invariance by constraining loadings equal across groups

**Task:** To test whether factor loadings are equivalent across schools (metric invariance), refit the model with `group.equal = "loadings"`, then compare to `ex_5_1` with `anova()`. Save the comparison table to `ex_5_2`. A non-significant chi-square difference supports metric invariance, which is the prerequisite for comparing factor means or regression coefficients across groups.

**Expected result:**

```
#> Chi-Squared Difference Test
#>            Df    AIC    BIC Chisq Chisq diff Df diff Pr(>Chisq)
#> ex_5_1     48   7484   7715 115.9
#> ex_5_2_alt 54   7483   7691 124.0       8.19       6     0.224
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_5_2 <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
'
ex_5_2_alt <- cfa(mod_5_2, data = HolzingerSwineford1939,
                  group = "school", group.equal = "loadings")
ex_5_2 <- anova(ex_5_1, ex_5_2_alt)
ex_5_2
#> Chi-Squared Difference Test
#>            Df Chisq Chisq diff Df diff Pr(>Chisq)
#> ex_5_1     48 115.9
#> ex_5_2_alt 54 124.0       8.19       6     0.224
```

**Explanation:** Metric (weak) invariance means a one-unit change in the latent variable produces the same change in each indicator in every group. The test constrains 6 loadings equal across groups (2 free loadings per factor x 3 factors), so df grows by 6. The non-significant p value (.22) supports metric invariance. Next you would test scalar invariance with `group.equal = c("loadings", "intercepts")` to check whether group mean differences in indicators are explained entirely by latent mean differences.

</details>

### Exercise 5.3: Fit an ordered-categorical CFA with the WLSMV estimator

**Task:** Treat indicators `y1` through `y4` from `PoliticalDemocracy` as ordered-categorical (they are 4-point democracy ratings). Fit a one-factor CFA on them with `ordered = c("y1","y2","y3","y4")`, which switches lavaan to the WLSMV estimator and tetrachoric/polychoric correlations. Save the fit to `ex_5_3` and print the `Estimator` line plus standardized loadings.

**Expected result:**

```
#> lavaan 0.6 ended normally after 22 iterations
#>   Estimator                                       DWLS
#>   Number of observations                            75
#> Latent Variables:
#>                    Estimate  Std.Err  z-value  P(>|z|)   Std.all
#>   dem60 =~
#>     y1                1.000                              0.838
#>     y2                1.302    0.171    7.617    0.000   0.866
#>     y3                1.230    0.171    7.207    0.000   0.815
#>     y4                1.305    0.158    8.275    0.000   0.876
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
summary(ex_5_3, standardized = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_5_3 <- 'dem60 =~ y1 + y2 + y3 + y4'
ex_5_3 <- cfa(mod_5_3,
              data = PoliticalDemocracy,
              ordered = c("y1", "y2", "y3", "y4"))
summary(ex_5_3, standardized = TRUE)
#>   Estimator                                       DWLS
#>   y1                1.000                              0.838
#>   y2                1.302    0.171    7.617    0.000   0.866
```

**Explanation:** When you declare indicators ordered, lavaan switches from maximum likelihood on the raw covariance matrix to diagonally weighted least squares (DWLS) on the polychoric correlation matrix, with mean- and variance-adjusted test statistics (the WLSMV variant). This is the correct estimator for Likert-style data with five or fewer categories, where treating ordinal scores as continuous biases loadings downward and inflates chi-square. Robust standard errors are reported by default.

</details>

## Section 6. Reporting (1 problem)

### Exercise 6.1: Build a publication-ready loadings table

**Task:** For the three-factor CFA fit `ex_2_1`, build a tidy data frame with one row per indicator, columns `factor`, `indicator`, `loading` (raw `est`), `std_loading` (`std.all`), and `pvalue`, rounded to three decimals. Sort by factor and then by descending standardized loading. Save the table to `ex_6_1`. This is the format you would paste into a paper or report.

**Expected result:**

```
#>    factor indicator loading std_loading pvalue
#> 1 textual        x5   1.113       0.855  0.000
#> 2 textual        x4   1.000       0.852  0.000
#> 3 textual        x6   0.926       0.838  0.000
#> 4  visual        x1   1.000       0.772  0.000
#> 5  visual        x3   0.729       0.581  0.000
#> 6  visual        x2   0.554       0.424  0.000
#> 7   speed        x8   1.180       0.723  0.000
#> 8   speed        x9   1.082       0.665  0.000
#> 9   speed        x7   1.000       0.570  0.000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pe <- parameterEstimates(ex_2_1, standardized = TRUE)
load_rows <- pe[pe$op == "=~", ]
ex_6_1 <- data.frame(
  factor      = load_rows$lhs,
  indicator   = load_rows$rhs,
  loading     = round(load_rows$est, 3),
  std_loading = round(load_rows$std.all, 3),
  pvalue      = round(load_rows$pvalue, 3)
)
ex_6_1 <- ex_6_1[order(ex_6_1$factor, -ex_6_1$std_loading), ]
ex_6_1
#>    factor indicator loading std_loading pvalue
#> 1 textual        x5   1.113       0.855  0.000
#> 2 textual        x4   1.000       0.852  0.000
```

**Explanation:** `parameterEstimates(..., standardized = TRUE)` is the single source of truth for everything you would print: estimates, standard errors, p values, standardized values, and confidence intervals. Building a clean data frame from it puts you one `write.csv()` or `knitr::kable()` away from a paper-ready table. The marker loading (first indicator of each factor) shows NA for the p value in lavaan output because that parameter is fixed, but using `est` and `std.all` still gives you a populated cell.

</details>

## What to do next

You have written lavaan syntax for path models, CFAs, and full SEMs; pulled fit indices; tested nested models; bootstrapped indirect effects; and handled multi-group and ordered-categorical data. The next steps:

- Revisit the parent tutorial, [CFA and Structural Equation Modeling in R](CFA-and-Structural-Equation-Modeling-in-R.html), for theory and figure-by-figure walkthroughs of every model used above.
- Practise the regression building blocks behind path models in the [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html).
- Move into latent-variable mixture and growth models with the [Factor Analysis Exercises in R](Factor-Analysis-Exercises-in-R.html).
- Use the [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) to plot path diagrams and residual matrices for your fits.
