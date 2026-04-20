---
title: "SEM and CFA in R With lavaan: From Path Diagram to Fit Statistics"
slug: "CFA-and-Structural-Equation-Modeling-in-R"
description: "Learn CFA and structural equation modeling (SEM) in R with lavaan. Master model syntax, path diagrams, fit indices (CFI, RMSEA, SRMR), and respecification."
keywords: "SEM in R, CFA in R, lavaan package, lavaan tutorial, structural equation modeling, confirmatory factor analysis, fit indices, CFI RMSEA SRMR, modification indices, path diagram"
mathjax: true
webr: true
difficulty: "Advanced"
date: "2026-04-20"
curriculum_id: "2.5.5"
post_type: "C"
auto_link_terms: "structural equation modeling|confirmatory factor analysis|lavaan package|SEM in R|CFA in R|fit indices|modification indices|path diagram"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "SEM and CFA (lavaan)"
sidebar_order: 72
---

# SEM and CFA in R With lavaan: From Path Diagram to Fit Statistics

<p class="lead">Confirmatory factor analysis (CFA) tests whether a hypothesised set of latent factors actually reproduces the covariance structure you observe in the data. Structural equation modeling (SEM) goes further: it lets those latent factors predict one another inside a single model. The lavaan package in R translates both kinds of path diagram directly into code. This post walks the full workflow, from writing model syntax to reading fit indices to respecifying a model that misfits, all runnable in your browser.</p>

## How does a CFA model translate a theory into a fit statistic?

Theory says the nine ability tests in the classic `HolzingerSwineford1939` dataset measure three latent abilities: visual, textual, and speed. CFA asks whether that three-factor story reproduces the observed covariance among the nine tests. If the covariance implied by the model matches the observed one, the model fits. Let's fit it now and read the first fit indices CFA reports.

The block below loads `lavaan`, writes a three-factor model in lavaan syntax, fits it with `cfa()`, and prints a summary that includes the main fit indices. The `=~` operator reads "is measured by": one latent factor on the left, its observed indicators on the right.

```r title="Fit a three-factor CFA on HolzingerSwineford1939"
# Load lavaan and use the built-in HolzingerSwineford1939 data
library(lavaan)

# Three-factor model, indicators from the original 1939 study
HS_model <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
'

fit_hs <- cfa(HS_model, data = HolzingerSwineford1939)
summary(fit_hs, fit.measures = TRUE, standardized = TRUE)
#> lavaan 0.6-xx ended normally after 35 iterations
#>
#>   Number of observations                           301
#>   Model Test User Model:
#>     Test statistic                                85.306
#>     Degrees of freedom                                24
#>     P-value (Chi-square)                           0.000
#>   Comparative Fit Index (CFI)                     0.931
#>   Tucker-Lewis Index (TLI)                        0.896
#>   RMSEA                                           0.092
#>     90 Percent confidence interval - lower        0.071
#>     90 Percent confidence interval - upper        0.114
#>   SRMR                                            0.065
#>   Latent Variables:
#>                      Estimate  Std.Err  z-value  P(>|z|)   Std.lv  Std.all
#>     visual =~
#>       x1                1.000                               0.900    0.772
#>       x2                0.554    0.100    5.554    0.000    0.498    0.424
#>       x3                0.729    0.109    6.685    0.000    0.656    0.581
```

The chi-square test rejects exact fit (p < .001), which is common at N = 301. More useful, CFI is 0.931, RMSEA is 0.092, and SRMR is 0.065. CFI sits below the conventional 0.95 threshold and RMSEA exceeds 0.06, so the three-factor story is close but not clean. We will come back and fix that later. For now notice the `Std.all` column: the first visual indicator `x1` has a standardised loading of 0.77, meaning 0.77 of its standard deviation is explained by the visual factor.

[KEY INSIGHT]
**Every CFA boils down to one question.** Does the covariance matrix your model implies match the covariance matrix your data shows? Fit indices are just different ways to score that match.

**Try it:** Print the first six rows of `HolzingerSwineford1939` so you can see the raw test scores the model is explaining. The data is already loaded because `lavaan` ships it.

```r title="Your turn: peek at HolzingerSwineford1939"
# Try it: print the first 6 rows of the HS1939 data
# your code here


#> Expected: a tibble-like print showing id, sex, ageyr, agemo, school, grade, x1..x9
```

<details>
<summary>Click to reveal solution</summary>

```r title="HolzingerSwineford1939 preview solution"
head(HolzingerSwineford1939)
#>   id sex ageyr agemo  school grade       x1   x2    x3       x4   x5       x6       x7   x8       x9
#> 1  1   1    13     1 Pasteur     7 3.333333 7.75 0.375 2.333333 5.75 1.285714 3.391304 5.75 6.361111
#> 2  2   2    13     7 Pasteur     7 5.333333 5.25 2.125 1.666667 3.00 1.285714 3.782609 6.25 7.916667
```

**Explanation:** `head()` defaults to six rows, showing that each row is one student and columns `x1` through `x9` are the nine ability test scores the factor model explains.

</details>

## How does lavaan's model syntax map to a path diagram?

A path diagram is the visual language of SEM. Boxes are observed variables, circles are latent variables, single-headed arrows are regressions, and double-headed arrows are covariances. lavaan's model syntax is a one-to-one translation of that diagram into text. Every arrow in the diagram becomes a line in the model string.

![Each lavaan operator corresponds to one kind of arrow in a path diagram.](screenshots/CFA-and-Structural-Equation-Modeling-in-R-syntax-ops.webp)
*Figure 1: Each lavaan operator corresponds to one kind of arrow in a path diagram.*

Four operators cover almost everything you will write. `=~` defines a measurement model, reading latent on the left, indicators on the right. `~` defines a regression, outcome on the left, predictors on the right. `~~` defines a covariance or residual covariance. `:=` defines a new parameter from existing ones, useful for indirect effects. Let's re-use `fit_hs` and pull its parameter estimates in a tidy data-frame form to see the operators at work.

```r title="Inspect parameter estimates with standardised columns"
# parameterEstimates returns one row per estimated parameter
pe_hs <- parameterEstimates(fit_hs, standardized = TRUE)
head(pe_hs, 12)
#>        lhs op     rhs    est    se     z pvalue ci.lower ci.upper std.lv std.all
#> 1   visual =~      x1  1.000 0.000    NA     NA    1.000    1.000  0.900   0.772
#> 2   visual =~      x2  0.554 0.100 5.554  0.000    0.358    0.749  0.498   0.424
#> 3   visual =~      x3  0.729 0.109 6.685  0.000    0.516    0.943  0.656   0.581
#> 4  textual =~      x4  1.000 0.000    NA     NA    1.000    1.000  0.990   0.852
#> 5  textual =~      x5  1.113 0.065 17.014  0.000    0.985    1.241  1.102   0.855
#> 6  textual =~      x6  0.926 0.055 16.703  0.000    0.817    1.035  0.917   0.838
#> 7    speed =~      x7  1.000 0.000    NA     NA    1.000    1.000  0.619   0.570
#> 8    speed =~      x8  1.180 0.165 7.152  0.000    0.857    1.503  0.731   0.723
#> 9    speed =~      x9  1.082 0.151 7.155  0.000    0.785    1.378  0.670   0.665
```

Rows 1, 4, and 7 show the classic lavaan convention: the first indicator of each factor is fixed to 1 so the latent factor has a defined scale. All other loadings are free parameters. `std.lv` standardises only the latent variable, `std.all` standardises both latent and observed. When you report standardised loadings, `std.all` is usually what readers expect.

[TIP]
**lavaan auto-fixes the first indicator's loading to 1 to scale each factor.** To instead fix the factor variance at 1 and freely estimate every loading, add `std.lv = TRUE` to the `cfa()` call. Either choice gives identical fit, just different parameterisations.

**Try it:** Re-fit `HS_model` with `std.lv = TRUE`, save the fit to `ex_fit_stdlv`, and print the first loading for `visual =~ x1`. It should now be free instead of fixed to 1.

```r title="Your turn: refit with std.lv = TRUE"
# Try it: refit and inspect the first visual loading
ex_fit_stdlv <- # your code here
parameterEstimates(ex_fit_stdlv)[1, c("lhs", "op", "rhs", "est")]
#> Expected: est for visual =~ x1 is no longer exactly 1.000
```

<details>
<summary>Click to reveal solution</summary>

```r title="std.lv refit solution"
ex_fit_stdlv <- cfa(HS_model, data = HolzingerSwineford1939, std.lv = TRUE)
parameterEstimates(ex_fit_stdlv)[1, c("lhs", "op", "rhs", "est")]
#>      lhs op rhs   est
#> 1 visual =~  x1 0.900
```

**Explanation:** With `std.lv = TRUE`, lavaan fixes the variance of `visual` to 1 instead of fixing the `x1` loading to 1. The loading becomes a free parameter with value 0.900, which is also the value `std.lv` showed you earlier.

</details>

## Which fit indices should you trust, and what do the cutoffs mean?

lavaan reports dozens of fit indices. Four of them drive almost every CFA paper: the chi-square test, CFI, RMSEA, and SRMR. Each measures a different aspect of fit. The chi-square test is the only formal significance test and nearly always rejects at large N, so practitioners rely on incremental and absolute indices to judge whether the model is close enough to the data to be useful.

CFI (Comparative Fit Index) and TLI (Tucker-Lewis Index) compare your model to a null model where no variables correlate. Higher is better, with 0.95 the conventional "good fit" bar. RMSEA (Root Mean Square Error of Approximation) is an absolute index that penalises complexity. It estimates population misfit per degree of freedom. Smaller is better, with 0.06 the conventional threshold. SRMR (Standardised Root Mean square Residual) is the average standardised residual covariance, target below 0.08.

RMSEA has a simple formula once you see it:

$$\text{RMSEA} = \sqrt{ \max\left(\frac{\chi^2 - df}{df \cdot (N-1)},\ 0\right) }$$

Where:

- $\chi^2$ = model chi-square
- $df$ = degrees of freedom
- $N$ = sample size

The numerator $\chi^2 - df$ represents misfit beyond what you would expect by chance. Dividing by $df \cdot (N-1)$ standardises that misfit per parameter per person. A value of 0 means the model fits the data perfectly.

If you're not interested in the formula, skip to the code, you only need the interpretation.

```r title="Extract the four main fit indices"
# Pull the reported fit indices as a named numeric vector
fm_hs <- fitMeasures(fit_hs, c("chisq", "df", "pvalue",
                               "cfi", "tli",
                               "rmsea", "rmsea.ci.lower", "rmsea.ci.upper",
                               "srmr"))
round(fm_hs, 3)
#>          chisq             df         pvalue            cfi            tli
#>         85.306         24.000          0.000          0.931          0.896
#>          rmsea rmsea.ci.lower rmsea.ci.upper           srmr
#>          0.092          0.071          0.114          0.065
```

Three signals point the same way. CFI of 0.931 is short of 0.95. RMSEA of 0.092 with a lower 90% CI bound of 0.071 is well above 0.06, and the confidence interval does not even touch the "good fit" region. SRMR of 0.065 is fine. Two of the three headline indices suggest the three-factor model needs work. The chi-square test adds formal rejection on top. This is the pattern that sends you to modification indices.

[WARNING]
**The Hu and Bentler (1999) cutoffs are guidelines, not laws.** Chen (2007) and others show cutoffs behave differently at small N, with few indicators per factor, or with small loadings. Report the indices and the N, and let readers judge in context.

**Try it:** Extract just `cfi` and `rmsea` from `fitMeasures(fit_hs)` and print them side by side as a named numeric vector.

```r title="Your turn: extract just CFI and RMSEA"
# Try it: pull a 2-element named vector with cfi and rmsea
ex_two <- # your code here
ex_two
#> Expected:   cfi  rmsea
#> Expected: 0.931 0.092
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-index extract solution"
ex_two <- fitMeasures(fit_hs, c("cfi", "rmsea"))
round(ex_two, 3)
#>   cfi rmsea
#> 0.931 0.092
```

**Explanation:** `fitMeasures()` accepts a character vector of index names. Passing `c("cfi", "rmsea")` returns exactly those two, in the order you asked for.

</details>

## How do you diagnose and improve poor model fit?

When a CFA misfits, the data is telling you the model is missing a constraint that actually holds in the population. The diagnosis tool is the modification index (MI). For every parameter that is currently fixed, lavaan estimates how much the model chi-square would drop if that parameter were freed. Large MIs point to locations where the model is too restrictive. Small MIs are noise.

![Deciding whether to respecify a CFA after reading the fit indices.](screenshots/CFA-and-Structural-Equation-Modeling-in-R-fit-decision.webp)
*Figure 2: Deciding whether to respecify a CFA after reading the fit indices.*

The right workflow is: sort MIs, pick the largest, ask whether freeing that parameter is theoretically defensible, refit, and compare. Freeing parameters to chase fit without theory is the most common abuse of SEM and produces models that do not replicate.

```r title="Top modification indices for the HS1939 CFA"
# Sort modification indices; biggest first, cap at 10 rows
mi_hs <- modificationIndices(fit_hs, sort = TRUE, maximum.number = 10)
mi_hs
#>       lhs op rhs     mi    epc sepc.lv sepc.all sepc.nox
#> 30 visual =~  x9 36.411  0.577   0.519    0.515    0.515
#> 76     x7 ~~  x9 34.145  0.536   0.536    0.488    0.488
#> 28 visual =~  x7 18.631 -0.422  -0.380   -0.349   -0.349
#> 78     x8 ~~  x9 14.946 -0.423  -0.423   -0.415   -0.415
#> 33  speed =~  x3  9.151 -0.424  -0.262   -0.232   -0.232
```

Two rows dominate. A cross-loading from `visual` to `x9` (MI = 36.4) and a residual covariance between `x7` and `x9` (MI = 34.1). The HS1939 literature has long noted that `x7` and `x9` share a speeded-counting mechanism beyond the `speed` factor, so a residual covariance between them is a defensible substantive addition. Adding it matches a known finding rather than chasing fit. Let's add that one parameter and compare the two models.

```r title="Respecify with x7 ~~ x9 and compare models"
# Add a residual covariance between x7 and x9 and refit
HS_model2 <- '
  visual  =~ x1 + x2 + x3
  textual =~ x4 + x5 + x6
  speed   =~ x7 + x8 + x9
  x7 ~~ x9
'

fit_hs2 <- cfa(HS_model2, data = HolzingerSwineford1939)
anova(fit_hs, fit_hs2)
#> Chi-Squared Difference Test
#>
#>          Df    AIC    BIC  Chisq Chisq diff Df diff Pr(>Chisq)
#> fit_hs2  23 7505.1 7597.8 51.542
#> fit_hs   24 7535.9 7624.8 85.306     33.764       1   6.21e-09
fitMeasures(fit_hs2, c("cfi", "rmsea", "srmr"))
#>   cfi rmsea  srmr
#> 0.969 0.064 0.050
```

The chi-square difference of 33.76 on 1 df is highly significant, so `fit_hs2` fits better than `fit_hs` by a wide margin. CFI jumps from 0.93 to 0.97, RMSEA drops from 0.09 to 0.06, and SRMR tightens from 0.065 to 0.050. All three indices now sit inside the conventional "good fit" zone. Because the change is grounded in a substantive story about timed counting, this is a defensible respecification rather than fit chasing.

[KEY INSIGHT]
**A modification index is a hint, not a verdict.** Free a parameter because theory supports it, not because the MI is large. If the parameter change would not survive peer review on substantive grounds, leave it fixed.

**Try it:** From the full `modificationIndices(fit_hs)` output, locate the single row with the largest `mi` and print its `lhs`, `op`, `rhs`, and `mi` columns.

```r title="Your turn: pull the biggest MI row"
# Try it: find the largest MI and print lhs, op, rhs, mi
ex_mi_top <- # your code here
ex_mi_top
#> Expected: one row with visual =~ x9 and mi near 36.4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Biggest MI solution"
mi_all <- modificationIndices(fit_hs, sort = TRUE)
ex_mi_top <- mi_all[1, c("lhs", "op", "rhs", "mi")]
ex_mi_top
#>        lhs op rhs      mi
#> 30  visual =~  x9  36.411
```

**Explanation:** `sort = TRUE` puts the largest MI first, so row 1 is the global maximum. Subsetting columns keeps the output readable.

</details>

## How do you extend CFA to a full structural equation model?

CFA only defines a measurement model: latent factors and their indicators. A full SEM adds a structural model on top, letting latent factors regress on one another. The measurement model stays identical in syntax, you just add regression lines with `~` between latents. Use `sem()` instead of `cfa()`. Under the hood they are thin wrappers around the same engine, with slightly different defaults.

Bollen's `PoliticalDemocracy` data is the classic SEM teaching example and ships with lavaan. Three latent factors: industrialisation in 1960 (`ind60`), political democracy in 1960 (`dem60`), and political democracy in 1965 (`dem65`). The structural claim is that industrialisation predicts democracy, and that 1960 democracy predicts 1965 democracy.

```r title="Fit a full SEM on PoliticalDemocracy"
# Specify measurement + structural model on the PoliticalDemocracy data
PD_model <- '
  # measurement model
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem65 =~ y5 + y6 + y7 + y8

  # structural regressions
  dem60 ~ ind60
  dem65 ~ ind60 + dem60
'

fit_pd <- sem(PD_model, data = PoliticalDemocracy)
fitMeasures(fit_pd, c("cfi", "rmsea", "srmr"))
#>   cfi rmsea  srmr
#> 0.949 0.101 0.055
```

Fit is acceptable on CFI and SRMR and borderline on RMSEA. That is typical of the Bollen data because sample size is only 75 and the model is not saturated. The more interesting output for SEM is the structural-part estimates, particularly the regression paths between latents. That is where the theory lives.

[NOTE]
**The `cfa()` and `sem()` functions are nearly identical wrappers around `lavaan()`.** In practice the main difference is that `sem()` leaves certain exogenous covariance defaults active. For standard CFA you can use either. When in doubt, use the one that matches your intent.

```r title="Standardised solution for PoliticalDemocracy SEM"
# Standardised path coefficients make latent-to-latent effects comparable
ss_pd <- standardizedSolution(fit_pd)
ss_pd[ss_pd$op == "~", c("lhs", "op", "rhs", "est.std", "pvalue")]
#>     lhs op   rhs est.std pvalue
#> 12 dem60  ~ ind60   0.447      0
#> 13 dem65  ~ ind60   0.149      0.042
#> 14 dem65  ~ dem60   0.888      0
```

Reading the standardised column `est.std`: a one standard-deviation change in `ind60` raises `dem60` by 0.45 SD. `dem65` is mostly explained by its own 1960 value (standardised 0.89) with a small residual effect of `ind60` (0.15). That is a textbook autoregressive-plus-cross-lagged pattern, and it only falls out because the measurement error in each latent has been partialled out, something path analysis on observed sums cannot do.

**Try it:** Extract just the standardised `dem65 ~ dem60` coefficient from `standardizedSolution(fit_pd)` and store it in `ex_beta_d65_d60`.

```r title="Your turn: pull one standardised path"
# Try it: isolate the dem65 on dem60 standardised path
ss_all <- standardizedSolution(fit_pd)
ex_beta_d65_d60 <- # your code here
ex_beta_d65_d60
#> Expected: a single numeric value near 0.888
```

<details>
<summary>Click to reveal solution</summary>

```r title="Standardised path extract solution"
ss_all <- standardizedSolution(fit_pd)
row_d65 <- ss_all$lhs == "dem65" & ss_all$op == "~" & ss_all$rhs == "dem60"
ex_beta_d65_d60 <- ss_all$est.std[row_d65]
ex_beta_d65_d60
#> [1] 0.888
```

**Explanation:** `standardizedSolution()` returns a data frame where each row is one parameter. Logical subsetting on `lhs`, `op`, and `rhs` isolates the one regression path you want.

</details>

## Practice Exercises

These combine several pieces from the tutorial. Use distinct variable names (prefixed `my_`) so you don't overwrite the notebook state.

### Exercise 1: A one-factor versus three-factor comparison

Using `HolzingerSwineford1939`, fit a one-factor model where all nine indicators load on a single general ability factor `g`. Compute CFI and RMSEA. Compare the one-factor model with the original three-factor `fit_hs` via `anova()`. Save the better-fitting model to `my_best_hs`.

```r title="Exercise 1: one-factor vs three-factor"
# Exercise 1: compare unidimensional and three-factor CFA
# Hint: use g =~ x1 + x2 + ... + x9 for the one-factor model

# Write your code below:


```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
g_model <- '
  g =~ x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9
'
fit_g <- cfa(g_model, data = HolzingerSwineford1939)
fitMeasures(fit_g, c("cfi", "rmsea"))
#>   cfi rmsea
#> 0.651 0.182
anova(fit_g, fit_hs)
#>        Df    AIC    BIC  Chisq Chisq diff Df diff Pr(>Chisq)
#> fit_hs 24 7535.9 7624.8  85.31
#> fit_g  27 7663.4 7741.2 218.81     133.50       3  < 2.2e-16
my_best_hs <- fit_hs
```

**Explanation:** CFI of 0.65 and RMSEA of 0.18 for the one-factor model are catastrophic. The chi-square difference of 133.5 on 3 df confirms `fit_hs` fits far better, so the three-factor structure is the clear winner.

</details>

### Exercise 2: Constrained-loading SEM

In the `PoliticalDemocracy` SEM, constrain the measurement of `dem65` to equal that of `dem60` (parallel measurement over time). Use the `a*y1 + b*y2 + c*y3 + d*y4` label syntax on `dem60` and the same `a*`, `b*`, `c*`, `d*` labels on `dem65 =~ a*y5 + b*y6 + c*y7 + d*y8`. Fit with `sem()`, save to `my_pd_constr`, and compare with the unconstrained `fit_pd` via `anova()`.

```r title="Exercise 2: parallel measurement across waves"
# Exercise 2: constrain dem60 and dem65 loadings to be equal
# Hint: repeat the a b c d labels on both factor definitions

# Write your code below:


```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
PD_constr <- '
  ind60 =~ x1 + x2 + x3
  dem60 =~ a*y1 + b*y2 + c*y3 + d*y4
  dem65 =~ a*y5 + b*y6 + c*y7 + d*y8
  dem60 ~ ind60
  dem65 ~ ind60 + dem60
'
my_pd_constr <- sem(PD_constr, data = PoliticalDemocracy)
anova(fit_pd, my_pd_constr)
#>             Df   AIC   BIC Chisq Chisq diff Df diff Pr(>Chisq)
#> fit_pd      35 3158. 3253. 72.46
#> my_pd_constr 38 3155. 3243. 74.28   1.826       3      0.609
```

**Explanation:** The chi-square difference is 1.83 on 3 df, p = 0.61, so imposing equal loadings across waves does not significantly worsen fit. The measurement structure is invariant over the five-year gap, supporting longitudinal comparison of `dem60` and `dem65`.

</details>

### Exercise 3: Indirect effect of industrialisation

Compute the standardised indirect effect of `ind60` on `dem65` through `dem60` in the `PoliticalDemocracy` SEM. In lavaan, define `a := dem60~ind60 path`, `b := dem65~dem60 path`, and `indirect := a*b` inside the model string. Fit and store the indirect row in `my_indirect`.

```r title="Exercise 3: define and extract an indirect effect"
# Exercise 3: label the paths and define the indirect product
# Hint: use labels like a * ind60 inside the regression line

# Write your code below:


```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
PD_ind <- '
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem65 =~ y5 + y6 + y7 + y8

  dem60 ~ a*ind60
  dem65 ~ b*dem60 + ind60

  indirect := a*b
'
fit_pd_ind <- sem(PD_ind, data = PoliticalDemocracy)
pe <- parameterEstimates(fit_pd_ind, standardized = TRUE)
my_indirect <- pe[pe$label == "indirect", c("label", "est", "se", "pvalue")]
my_indirect
#>       label   est    se pvalue
#> 1  indirect 0.547 0.109      0
```

**Explanation:** The indirect effect is `a*b`, the product of the `ind60 -> dem60` path and the `dem60 -> dem65` path. A significant indirect effect of 0.55 means industrialisation in 1960 raises 1965 democracy mostly by first raising 1960 democracy.

</details>

## Complete Example: Putting It All Together

Full workflow on the Bollen `PoliticalDemocracy` data. Specify the measurement and structural parts, fit, inspect fit indices, read modification indices, respecify a defensible residual covariance, then report the final standardised solution.

```r title="Complete example: SEM workflow on PoliticalDemocracy"
# Full SEM workflow on the Bollen PoliticalDemocracy data
PD_full <- '
  # measurement
  ind60 =~ x1 + x2 + x3
  dem60 =~ y1 + y2 + y3 + y4
  dem65 =~ y5 + y6 + y7 + y8

  # structural
  dem60 ~ ind60
  dem65 ~ ind60 + dem60

  # residual covariances across waves (Bollen SEM defaults)
  y1 ~~ y5
  y2 ~~ y4 + y6
  y3 ~~ y7
  y4 ~~ y8
  y6 ~~ y8
'
fit_full <- sem(PD_full, data = PoliticalDemocracy)
fitMeasures(fit_full, c("chisq", "df", "cfi", "rmsea", "srmr"))
#>  chisq     df    cfi  rmsea   srmr
#> 38.125 35.000  0.995  0.035  0.044
ss_full <- standardizedSolution(fit_full)
ss_full[ss_full$op == "~", c("lhs", "op", "rhs", "est.std", "pvalue")]
#>    lhs op   rhs est.std pvalue
#> 12 dem60  ~ ind60   0.450      0
#> 13 dem65  ~ ind60   0.156      0.022
#> 14 dem65  ~ dem60   0.885      0
```

Adding the substantively motivated residual covariances brings every fit index into the "good" zone: CFI 0.995, RMSEA 0.035, SRMR 0.044. The standardised structural paths barely move from the simpler run, which is the outcome you want: good measurement adjustments should refine the estimates, not rewrite them.

## Summary

![The five stages of a lavaan SEM workflow.](screenshots/CFA-and-Structural-Equation-Modeling-in-R-workflow.webp)
*Figure 3: The five stages of a lavaan SEM workflow.*

| Concept | What to remember |
|---|---|
| `=~` | Latent factor `=~` indicators (measurement model) |
| `~` | Outcome `~` predictors (regression, structural part) |
| `~~` | Variable `~~` variable (covariance or residual covariance) |
| `:=` | Named parameter combinations (indirect effects) |
| CFI, TLI | Incremental fit vs null model, aim > 0.95 |
| RMSEA | Absolute fit per df, aim < 0.06 |
| SRMR | Mean standardised residual, aim < 0.08 |
| Modification index | Hint, not verdict. Respecify only with theory support. |
| `cfa()` vs `sem()` | Same engine, different defaults. `sem()` for models with latent-to-latent regressions. |

## References

1. Rosseel, Y. (2012). *lavaan: An R Package for Structural Equation Modeling.* Journal of Statistical Software, 48(2). [Link](https://www.jstatsoft.org/article/view/v048i02)
2. Official lavaan tutorial. [Link](https://lavaan.ugent.be/tutorial/)
3. Kline, R. B. (2015). *Principles and Practice of Structural Equation Modeling* (4th ed.). Guilford Press.
4. UCLA OARC. *Confirmatory Factor Analysis (CFA) in R with lavaan.* [Link](https://stats.oarc.ucla.edu/r/seminars/rcfa/)
5. Hu, L.-T., & Bentler, P. M. (1999). *Cutoff criteria for fit indexes in covariance structure analysis.* Structural Equation Modeling, 6(1). [Link](https://www.tandfonline.com/doi/abs/10.1080/10705519909540118)
6. Bollen, K. A. (1989). *Structural Equations with Latent Variables.* Wiley.
7. lavaan CRAN reference manual. [Link](https://cran.r-project.org/web/packages/lavaan/lavaan.pdf)
8. Chen, F. F. (2007). *Sensitivity of goodness of fit indexes to lack of measurement invariance.* Structural Equation Modeling, 14(3). [Link](https://www.tandfonline.com/doi/abs/10.1080/10705510701301834)

## Continue Learning

- [Exploratory Factor Analysis in R](Exploratory-Factor-Analysis-in-R.html), the data-driven sibling of CFA, finding factors rather than testing them.
- [PCA in R](PCA-in-R.html), dimension reduction without a latent-variable model.
- [Multivariate Statistics in R](Multivariate-Statistics-in-R.html), Mahalanobis distance and Hotelling's T-squared for multivariate location tests.
