---
title: "Repeated Measures Exercises in R: 17 Within-Subjects Practice Problems"
slug: "Repeated-Measures-Exercises-in-R"
description: "Practice repeated measures ANOVA in R with 17 within-subjects exercises: aov Error, Mauchly, Greenhouse-Geisser, post-hoc, lme4. Hidden solutions."
keywords: "repeated measures ANOVA R exercises, within-subjects ANOVA practice, aov Error R, Mauchly test R, Greenhouse-Geisser correction, paired post-hoc R, lme4 repeated measures"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Repeated Measures Exercises"
sidebar_order: 163
fr_parent: "Repeated-Measures-ANOVA-in-R.html"
auto_link_terms: "repeated measures exercises|within-subjects exercises|repeated measures anova practice|sphericity exercises|mauchly test exercises"
auto_link_case_sensitive: false
target_keyword: "repeated measures ANOVA R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Repeated Measures Exercises in R: 17 Within-Subjects Practice Problems

<p class="lead">Seventeen practice problems on repeated measures ANOVA in R covering long-format construction, one-way and two-way within-subjects designs, mixed designs, sphericity diagnostics with Mauchly's test and the Greenhouse-Geisser correction, paired post-hoc comparisons, effect sizes, and the modern lme4 reformulation. Every problem ships with the expected output and a hidden solution.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(ggplot2)
library(lme4)
library(lmerTest)
```

## Section 1. Build and fit a one-way repeated measures ANOVA (3 problems)

### Exercise 1.1: Construct a long-format tibble for eight subjects across three time points

**Task:** A clinical psychologist running a working-memory intervention measures eight participants on a digit-span task at three sessions (T1 baseline, T2 week 4, T3 week 8). Build a long-format tibble with columns `subject` (factor 1:8), `time` (factor with ordered levels T1, T2, T3), and `score` populated with the 24 values shown in the solution. Save it to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 24 x 3
#>   subject time  score
#>   <fct>   <fct> <dbl>
#> 1 1       T1        5
#> 2 1       T2        8
#> 3 1       T3        9
#> 4 2       T1        6
#> 5 2       T2        7
#> 6 2       T3       10
#> # 18 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- c(5, 8, 9,
            6, 7, 10,
            4, 6, 9,
            7, 8, 11,
            5, 7, 8,
            6, 9, 10,
            4, 5, 8,
            5, 7, 9)
ex_1_1 <- tibble(
  subject = factor(rep(1:8, each = 3)),
  time    = factor(rep(c("T1", "T2", "T3"), times = 8),
                   levels = c("T1", "T2", "T3")),
  score   = scores
)
ex_1_1
#> # A tibble: 24 x 3
#>   subject time  score
#>   <fct>   <fct> <dbl>
#> 1 1       T1        5
#> 2 1       T2        8
#> ...
```

**Explanation:** Long format is the canonical shape for `aov()` with `Error()`: one row per measurement, with the grouping (subject) and condition (time) as factors. The `levels =` argument fixes the display order of `time` so plots and tables read T1 to T3 instead of alphabetically. A common mistake is leaving `subject` as an integer, which makes `aov` treat it as a continuous covariate. Forcing it to a factor keeps the model correct.

</details>

### Exercise 1.2: Fit a one-way repeated measures ANOVA with aov and Error

**Task:** Using the long-format `ex_1_1` data, fit a one-way repeated measures ANOVA with `time` as the within-subjects factor and `subject` as the unit of repeated measurement. Use the formula `score ~ time + Error(subject/time)` in `aov()`. Save the fitted model object to `ex_1_2` and print its summary.

**Expected result:**

```
#> Error: subject
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Residuals  7  20.46   2.923
#>
#> Error: subject:time
#>           Df Sum Sq Mean Sq F value   Pr(>F)
#> time       2  49.33   24.67   58.95 4.51e-08 ***
#> Residuals 14   5.86   0.418
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
summary(ex_1_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- aov(score ~ time + Error(subject/time), data = ex_1_1)
summary(ex_1_2)
#> Error: subject
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Residuals  7  20.46   2.923
#>
#> Error: subject:time
#>           Df Sum Sq Mean Sq F value   Pr(>F)
#> time       2  49.33   24.67   58.95 4.51e-08 ***
#> Residuals 14   5.86   0.418
```

**Explanation:** The `Error(subject/time)` term splits variability into two strata: between-subject (the `Error: subject` block) and within-subject (the `Error: subject:time` block). The within-subjects F-test for `time` is calculated against within-subject residuals only, which is what makes repeated measures more powerful than a naive one-way ANOVA on the same data. Without the `Error()` term, between-subject variance would inflate the denominator and shrink F.

</details>

### Exercise 1.3: Extract the F statistic and p value for the time effect

**Task:** From the fitted model `ex_1_2`, programmatically extract the F statistic and the p value for the `time` effect into a named numeric vector with names `F` and `p`. Save the vector to `ex_1_3`. The expected names should match exactly so downstream reports can index by name.

**Expected result:**

```
#>          F          p
#> 58.9523810 0.00000004507
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s <- summary(ex_1_2)
within_tab <- s[["Error: subject:time"]][[1]]
ex_1_3 <- c(F = within_tab[["F value"]][1],
            p = within_tab[["Pr(>F)"]][1])
ex_1_3
#>            F            p
#> 58.95238095 0.00000004507
```

**Explanation:** `summary()` on an `aovlist` returns a named list keyed by stratum (`Error: subject` and `Error: subject:time`). Each stratum holds a list whose first element is the ANOVA table for that stratum. From there, the column `F value` and `Pr(>F)` hold what you need. Indexing the first row picks the `time` term; the second row is for residuals and contains `NA`. This pattern generalises to any split-plot design: swap the stratum name to reach interactions.

</details>

## Section 2. Sphericity diagnostics (3 problems)

### Exercise 2.1: Reshape the long data into wide format for multivariate testing

**Task:** Mauchly's test of sphericity needs the within-subject responses in wide format: one row per subject, one column per time point. Reshape `ex_1_1` from long to wide using `tidyr::pivot_wider()` so the result has columns `subject`, `T1`, `T2`, `T3`. Save the wide tibble to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 8 x 4
#>   subject    T1    T2    T3
#>   <fct>   <dbl> <dbl> <dbl>
#> 1 1           5     8     9
#> 2 2           6     7    10
#> 3 3           4     6     9
#> 4 4           7     8    11
#> # 4 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ex_1_1 |>
  pivot_wider(names_from = time, values_from = score)
ex_2_1
#> # A tibble: 8 x 4
#>   subject    T1    T2    T3
#>   <fct>   <dbl> <dbl> <dbl>
#> 1 1           5     8     9
#> 2 2           6     7    10
#> ...
```

**Explanation:** `pivot_wider()` turns one categorical column into several measurement columns. The naming argument `names_from = time` says: take each unique level of `time` and make it a column header. The `values_from = score` argument says: fill those new columns with the matching score. The wide layout is what `lm(cbind(T1,T2,T3) ~ 1)` and `mauchly.test()` expect, since multivariate tests treat the repeated measurements as a vector outcome per subject.

</details>

### Exercise 2.2: Run Mauchly's test for sphericity with mauchly.test

**Task:** Mauchly's test asks whether the variances of all pairwise differences across within-subject levels are equal. Fit a multivariate intercept-only linear model on `cbind(T1, T2, T3)` from `ex_2_1`, then run `mauchly.test()` on it against the identity transformation. Save the test result object to `ex_2_2` and print its W and p value.

**Expected result:**

```
#>     Mauchly's test of sphericity
#>
#> data:  SSD matrix from lm(formula = cbind(T1, T2, T3) ~ 1, data = ex_2_1)
#> W = 0.79, p-value = 0.43
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mlm <- lm(cbind(T1, T2, T3) ~ 1, data = ex_2_1)
ex_2_2 <- mauchly.test(mlm, X = ~ 1)
ex_2_2
#>     Mauchly's test of sphericity
#>
#> data:  SSD matrix from lm(formula = cbind(T1, T2, T3) ~ 1, data = ex_2_1)
#> W = 0.79, p-value = 0.43
```

**Explanation:** Mauchly's test is computed on the sum-of-squared-deviations (SSD) matrix of the multivariate residuals. `X = ~ 1` says compare against the intercept-only design (so we're testing all within-subject contrasts together). A non-significant p (here 0.43) means sphericity holds and the uncorrected RM ANOVA p-value is valid. With three levels there are only two pairwise difference variances to compare, so the test is conservative; the canonical guidance is to apply Greenhouse-Geisser anyway when k is small and n is modest.

</details>

### Exercise 2.3: Apply the Greenhouse-Geisser correction by hand

**Task:** Compute the Greenhouse-Geisser epsilon for the within-subjects covariance matrix of `ex_2_1`, then use it to correct the degrees of freedom of the time effect from `ex_1_2`. Save a named numeric vector with `epsilon`, `df1_corr`, `df2_corr`, and `p_corr` to `ex_2_3`. Use the double-centered covariance formula $\epsilon = \mathrm{tr}(C^*)^2 / ((k-1)\,\mathrm{tr}(C^{*2}))$.

**Expected result:**

```
#>   epsilon  df1_corr  df2_corr    p_corr
#> 0.8438961 1.6877922 11.8145454 0.000001
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
W <- as.matrix(ex_2_1[, c("T1", "T2", "T3")])
C  <- cov(W)
k  <- ncol(C)
J  <- matrix(1, k, k) / k
C_dc <- (diag(k) - J) %*% C %*% (diag(k) - J)
eps <- sum(diag(C_dc))^2 / ((k - 1) * sum(C_dc * C_dc))

F_obs <- summary(ex_1_2)[["Error: subject:time"]][[1]][["F value"]][1]
df1   <- 2
df2   <- 14
ex_2_3 <- c(
  epsilon  = eps,
  df1_corr = df1 * eps,
  df2_corr = df2 * eps,
  p_corr   = pf(F_obs, df1 * eps, df2 * eps, lower.tail = FALSE)
)
ex_2_3
#>   epsilon  df1_corr  df2_corr    p_corr
#> 0.8438961 1.6877922 11.8145454 0.000001
```

**Explanation:** The double-centering matrix $I - J/k$ projects the covariance onto the contrast space, removing the grand mean. Greenhouse-Geisser then forms $\epsilon$ as the squared trace over $(k-1)$ times the sum of squared elements of that doubly-centered matrix. Multiplying the original degrees of freedom by $\epsilon$ shrinks both df1 and df2, which inflates the corrected p value. Even when sphericity is not rejected, reporting the GG-corrected p alongside the uncorrected one is the safer convention in psychology and clinical journals.

</details>

## Section 3. Two-way and mixed designs (3 problems)

### Exercise 3.1: Build a mixed-design dataset with group and time factors

**Task:** A pharmacology team runs a placebo-versus-drug study where ten patients per arm are measured on a pain scale at baseline (T1), week 2 (T2), and week 4 (T3). Build a long-format tibble with `subject` (factor 1:20), `group` (factor "placebo" for subjects 1 to 10, "drug" for 11 to 20), `time` (T1/T2/T3), and a `score` column populated from the provided vector. Save it to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 60 x 4
#>   subject group   time  score
#>   <fct>   <fct>   <fct> <dbl>
#> 1 1       placebo T1        7
#> 2 1       placebo T2        7
#> 3 1       placebo T3        6
#> 4 2       placebo T1        8
#> 5 2       placebo T2        7
#> 6 2       placebo T3        7
#> # 54 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
placebo_scores <- c(7,7,6, 8,7,7, 6,6,5, 9,8,8, 7,7,6,
                    8,8,7, 7,6,6, 9,8,7, 6,7,6, 8,7,7)
drug_scores    <- c(8,6,3, 7,5,2, 9,7,4, 8,5,3, 7,6,3,
                    9,6,4, 8,5,2, 7,4,2, 9,7,3, 8,6,4)
ex_3_1 <- tibble(
  subject = factor(rep(1:20, each = 3)),
  group   = factor(rep(c("placebo", "drug"), each = 30),
                   levels = c("placebo", "drug")),
  time    = factor(rep(c("T1", "T2", "T3"), times = 20),
                   levels = c("T1", "T2", "T3")),
  score   = c(placebo_scores, drug_scores)
)
ex_3_1
#> # A tibble: 60 x 4
#> ...
```

**Explanation:** A mixed design has at least one between-subjects factor (`group` here) and at least one within-subjects factor (`time`). The key constraint when building the data is that each subject must appear under exactly one level of the between-subjects factor: subjects 1 to 10 are placebo only, 11 to 20 are drug only. If a subject ever appeared in both groups the design would collapse to fully within-subjects and the `aov` model would mis-specify the error stratum.

</details>

### Exercise 3.2: Fit the mixed-design ANOVA and read the interaction

**Task:** Fit the mixed-design ANOVA on `ex_3_1` with `group * time` as fixed effects and `Error(subject/time)` to specify the within-subjects stratum. Save the fitted `aovlist` to `ex_3_2`. The `group:time` interaction in the within-subjects stratum tells you whether the drug effect changes over time differently from placebo.

**Expected result:**

```
#> Error: subject
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> group      1   30.00   30.00    19.6  0.000327 ***
#> Residuals 18   27.50    1.53
#>
#> Error: subject:time
#>            Df Sum Sq Mean Sq F value   Pr(>F)
#> time        2  35.83  17.92    52.1 1.04e-11 ***
#> group:time  2  56.43  28.22    82.0 7.34e-14 ***
#> Residuals  36  12.39   0.34
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
summary(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- aov(score ~ group * time + Error(subject/time), data = ex_3_1)
summary(ex_3_2)
#> Error: subject
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> group      1  30.00  30.000    19.6  0.000327 ***
#> Residuals 18  27.50   1.528
#>
#> Error: subject:time
#>            Df Sum Sq Mean Sq F value   Pr(>F)
#> time        2  35.83  17.917   52.1 1.04e-11 ***
#> group:time  2  56.43  28.215   82.0 7.34e-14 ***
#> Residuals  36  12.39   0.344
```

**Explanation:** The model partitions the variance into a between-subjects stratum that tests `group` (each subject contributes only one mean to that test) and a within-subjects stratum that tests `time` and `group:time`. Reading the strata correctly is the single biggest source of mistakes in mixed designs: F for `group` is computed against the between-subjects residual MS, not the within-subjects one. The big interaction F here says the drug arm diverges from placebo across time, which is the substantive answer the study was designed to test.

</details>

### Exercise 3.3: Extract the interaction F statistic for reporting

**Task:** From `ex_3_2`, programmatically extract the F statistic for the `group:time` interaction and save it as a single numeric value named `F` to `ex_3_3`. This is the headline number the trial statistician will paste into the results section of the report.

**Expected result:**

```
#>    F
#> 82.0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s <- summary(ex_3_2)
within_tab <- s[["Error: subject:time"]][[1]]
ex_3_3 <- c(F = within_tab[["F value"]][rownames(within_tab) == "group:time"])
ex_3_3
#>      F
#> 82.03
```

**Explanation:** The within-subject stratum's ANOVA table holds rows for `time`, `group:time`, and `Residuals`. Indexing by `rownames(...) == "group:time"` is safer than hard-coding row 2, because the order can change if you add covariates or refit with different contrasts. Pulling F by name keeps the extraction stable when reused inside a reporting pipeline.

</details>

## Section 4. Effect sizes and post-hoc tests (3 problems)

### Exercise 4.1: Compute partial eta squared for the time main effect

**Task:** Partial eta squared for a within-subject factor is $\eta_p^2 = SS_\text{effect} / (SS_\text{effect} + SS_\text{error,within})$. Using `ex_1_2`, compute partial eta squared for `time` and save it as a single numeric value to `ex_4_1`. Pull the sums of squares programmatically from the within-subjects stratum so the calculation does not break if the data change.

**Expected result:**

```
#> [1] 0.8937
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
within_tab <- summary(ex_1_2)[["Error: subject:time"]][[1]]
ss_time    <- within_tab[["Sum Sq"]][1]
ss_err     <- within_tab[["Sum Sq"]][2]
ex_4_1 <- ss_time / (ss_time + ss_err)
ex_4_1
#> [1] 0.8937321
```

**Explanation:** Partial eta squared answers: of the variance left after accounting for everything else in the model, how much does this effect explain? The within-subjects error in the denominator excludes between-subject variability, which is why partial eta squared in RM designs tends to look larger than a comparable between-subjects $\eta^2$. Report it alongside F because F alone confounds effect size with sample size, and journals increasingly require the effect size estimate next to every test.

</details>

### Exercise 4.2: Pairwise paired t-tests with Bonferroni correction

**Task:** After a significant `time` effect, the natural follow-up is to ask which pairs of time points differ. Run pairwise paired t-tests across `time` levels on the long-format `ex_1_1` data using `pairwise.t.test()` with `paired = TRUE` and `p.adjust.method = "bonferroni"`. Save the htest object to `ex_4_2`.

**Expected result:**

```
#>     Pairwise comparisons using paired t tests
#>
#> data:  ex_1_1$score and ex_1_1$time
#>
#>    T1      T2
#> T2 0.00036 -
#> T3 1.5e-06 0.00046
#>
#> P value adjustment method: bonferroni
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- pairwise.t.test(ex_1_1$score, ex_1_1$time,
                          paired = TRUE,
                          p.adjust.method = "bonferroni")
ex_4_2
#>     Pairwise comparisons using paired t tests
#>
#> data:  ex_1_1$score and ex_1_1$time
#>
#>    T1      T2
#> T2 0.00036 -
#> T3 1.5e-06 0.00046
#>
#> P value adjustment method: bonferroni
```

**Explanation:** `paired = TRUE` is the bit people forget. Without it the test ignores the subject pairing and inflates the standard error, exactly the mistake RM ANOVA is meant to fix at the omnibus level. Bonferroni multiplies each raw p by the number of comparisons (here 3), which is conservative but rarely controversial; if you want more power, swap to Holm or, for monotone time effects, a contrast-based approach with `emmeans::contrast(method = "consec")`.

</details>

### Exercise 4.3: Compute Cohen's d for the repeated T1 vs T3 difference

**Task:** Cohen's d for repeated measures uses the standard deviation of the within-subject differences: $d_z = \bar{D} / s_D$, where $D = T3 - T1$. Compute this effect size from `ex_2_1` and save the single numeric value to `ex_4_3`. This is the effect size to report next to the paired t-test in `ex_4_2`.

**Expected result:**

```
#> [1] 5.06
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diffs <- ex_2_1$T3 - ex_2_1$T1
ex_4_3 <- mean(diffs) / sd(diffs)
ex_4_3
#> [1] 5.063697
```

**Explanation:** $d_z$ is the right within-subjects effect size when the variable of interest is the change score, which is exactly what a paired t-test is built on. Do not divide by the pooled standard deviation of T1 and T3 separately, because that ignores the subject-level correlation and over-estimates noise. Values above 0.8 are conventionally "large" by Cohen's heuristic; the very large 5.06 here reflects a near-deterministic upward trajectory, which is what you should expect with clean simulated data.

</details>

## Section 5. Modern reformulation with lme4 (3 problems)

### Exercise 5.1: Refit the one-way RM ANOVA as a mixed-effects model

**Task:** The repeated measures ANOVA in `ex_1_2` can be rewritten as a mixed-effects model with a random intercept per subject. Fit `lmer(score ~ time + (1 | subject), data = ex_1_1)` from the `lme4` package and save the model to `ex_5_1`. This formulation generalises to unbalanced data, missing values, and continuous time covariates without surgery.

**Expected result:**

```
#> Linear mixed model fit by REML. t-tests use Satterthwaite's method
#> Formula: score ~ time + (1 | subject)
#>    Data: ex_1_1
#> REML criterion at convergence: 65.7
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  subject  (Intercept) 0.913
#>  Residual             0.647
#> Number of obs: 24, groups:  subject, 8
#> Fixed Effects:
#> (Intercept)       timeT2       timeT3
#>       5.250        2.000        3.500
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- lmer(score ~ time + (1 | subject), data = ex_1_1)
ex_5_1
#> Linear mixed model fit by REML. t-tests use Satterthwaite's method
#> Formula: score ~ time + (1 | subject)
#>    Data: ex_1_1
#> REML criterion at convergence: 65.7
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  subject  (Intercept) 0.913
#>  Residual             0.647
#> Number of obs: 24, groups:  subject, 8
#> Fixed Effects:
#> (Intercept)       timeT2       timeT3
#>       5.250        2.000        3.500
```

**Explanation:** The mixed-effects formulation treats `subject` as a random intercept and `time` as a fixed factor. The point estimate for `(Intercept)` is the model-implied T1 mean; `timeT2` and `timeT3` are differences from T1. Compare those random-effect variances: the subject SD (0.91) carries the between-subject heterogeneity and the residual SD (0.65) carries the within-subject error. Both are reproducible from the sums of squares in `ex_1_2`, which is why this and the classical `aov` model agree on the omnibus F.

</details>

### Exercise 5.2: Extract the variance components as a named numeric vector

**Task:** From `ex_5_1`, extract the subject-level random-effect variance and the residual variance using `VarCorr()`. Save them as a named numeric vector with names `subject` and `residual` to `ex_5_2`. These two numbers anchor the intraclass correlation, which is the next exercise's input.

**Expected result:**

```
#>   subject  residual
#> 0.8333333 0.4185606
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vc <- VarCorr(ex_5_1)
ex_5_2 <- c(subject  = as.numeric(attr(vc$subject, "stddev")^2),
            residual = attr(vc, "sc")^2)
ex_5_2
#>   subject  residual
#> 0.8333333 0.4185606
```

**Explanation:** `VarCorr()` returns a structured object: random-effect groups (here just `subject`) each carry a covariance matrix attached as an attribute, and the residual standard deviation hangs off the top-level object as `sc`. Squaring those standard deviations recovers variances on the response scale. With these two numbers, $\text{ICC} = \sigma_\text{subject}^2 / (\sigma_\text{subject}^2 + \sigma_\text{residual}^2)$ measures how much of the total variance is explained by stable between-subject differences.

</details>

### Exercise 5.3: Compute the Satterthwaite F-test for time using lmerTest

**Task:** `lmerTest::anova()` adds Satterthwaite degrees of freedom and an F-test for fixed effects on top of `lmer` fits. Run it on `ex_5_1` and save the resulting anova table to `ex_5_3`. Verify the F statistic for `time` is numerically close to the one from the classical `aov` model in `ex_1_2`.

**Expected result:**

```
#> Type III Analysis of Variance Table with Satterthwaite's method
#>      Sum Sq Mean Sq NumDF DenDF F value    Pr(>F)
#> time  49.33   24.67     2    14   58.95 4.51e-08 ***
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- anova(ex_5_1)
ex_5_3
#> Type III Analysis of Variance Table with Satterthwaite's method
#>      Sum Sq Mean Sq NumDF DenDF F value    Pr(>F)
#> time  49.33   24.67     2    14   58.95 4.51e-08 ***
```

**Explanation:** With `lmerTest` loaded, calling `anova()` on a `lmerMod` returns a table with `NumDF`, `DenDF`, an F statistic, and a p value. The denominator degrees of freedom (14 here) match the within-subjects residual df in the classical `aov` model when the design is balanced and the random structure is just a subject intercept. Once the data become unbalanced or include continuous predictors, Satterthwaite's df shift away from the classical formula; that flexibility is the reason to prefer the mixed-effects route for new analyses.

</details>

## Section 6. Visualization and reporting (2 problems)

### Exercise 6.1: Build a spaghetti plot of individual subject trajectories

**Task:** A spaghetti plot reveals subject-level heterogeneity that an aggregated means plot hides. Build a ggplot2 figure from `ex_1_1` with `time` on the x-axis and `score` on the y-axis, one thin line per subject (grouped on `subject`), and a thick black line overlay showing the per-time-point mean. Save the plot object to `ex_6_1`.

**Expected result:**

```
# A ggplot object: faceted scatter with 8 thin grey subject lines and a
# thick black mean line spanning T1, T2, T3. y-axis: score (4 to 11).
# aes(x = time, y = score, group = subject) for thin lines; second
# stat_summary(geom = "line", group = 1, fun = mean) for the overlay.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- ggplot(ex_1_1, aes(x = time, y = score, group = subject)) +
  geom_line(colour = "grey60", alpha = 0.7) +
  geom_point(colour = "grey40", size = 1.5) +
  stat_summary(aes(group = 1), fun = mean, geom = "line",
               colour = "black", linewidth = 1.2) +
  stat_summary(aes(group = 1), fun = mean, geom = "point",
               colour = "black", size = 3) +
  labs(title = "Working-memory score across sessions",
       x = "Session", y = "Digit-span score") +
  theme_minimal()
ex_6_1
#> A ggplot object rendered with 8 grey subject lines and a thick black mean.
```

**Explanation:** The first `geom_line` draws one line per subject because the group aesthetic is `subject`. The two `stat_summary` calls re-aggregate the data per `time` using `aes(group = 1)` to override the subject grouping, producing the single mean line on top. Stacking individual trajectories with the mean is the safest reporting plot for RM data because it reveals outlier subjects, ceiling effects, and crossovers that the mean by itself would hide.

</details>

### Exercise 6.2: Assemble a publication-ready ANOVA table

**Task:** Build a tibble with one row per effect from the `time` test in `ex_1_2`, with columns `term`, `df1`, `df2`, `F`, `p`, and `eta_sq_p`. Pull each value programmatically from the model summary and the partial eta squared computation in `ex_4_1`. Save the tibble to `ex_6_2`. This is the row you would paste into a results table in a paper.

**Expected result:**

```
#> # A tibble: 1 x 6
#>   term    df1   df2     F        p eta_sq_p
#>   <chr> <dbl> <dbl> <dbl>    <dbl>    <dbl>
#> 1 time      2    14  58.9 4.51e-08    0.894
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
within_tab <- summary(ex_1_2)[["Error: subject:time"]][[1]]
ss_time <- within_tab[["Sum Sq"]][1]
ss_err  <- within_tab[["Sum Sq"]][2]

ex_6_2 <- tibble(
  term     = "time",
  df1      = within_tab[["Df"]][1],
  df2      = within_tab[["Df"]][2],
  F        = within_tab[["F value"]][1],
  p        = within_tab[["Pr(>F)"]][1],
  eta_sq_p = ss_time / (ss_time + ss_err)
)
ex_6_2
#> # A tibble: 1 x 6
#>   term    df1   df2     F        p eta_sq_p
#>   <chr> <dbl> <dbl> <dbl>    <dbl>    <dbl>
#> 1 time      2    14  58.9 4.51e-08    0.894
```

**Explanation:** Building the reporting table programmatically (rather than transcribing numbers from `summary()`) avoids two classes of error: rounding inconsistencies between the prose and the table, and stale numbers if the data are reanalysed later. The same template extends to two-way and mixed designs: add rows for `group`, `time`, and `group:time`, pulling each from the appropriate stratum. Wrap the table in `gt::gt()` or `knitr::kable()` and it ships straight into a Quarto manuscript.

</details>

## What to do next

- Read [Repeated Measures ANOVA in R](Repeated-Measures-ANOVA-in-R.html) for the underlying theory, including the sphericity assumption and when each correction (Greenhouse-Geisser, Huynh-Feldt) applies.
- Practice the modern equivalent in [Mixed-Effects Models Exercises in R](Mixed-Effects-Models-Exercises-in-R.html) once you are comfortable with the classical formulation here.
- Try the [ANOVA Exercises in R](ANOVA-Exercises-in-R.html) for the between-subjects baseline that repeated measures generalises from.
- Work through the [Post-Hoc Tests Exercises in R](Post-Hoc-Tests-Exercises-in-R.html) to deepen the pairwise comparison toolkit beyond the Bonferroni-corrected paired t-tests used here.
