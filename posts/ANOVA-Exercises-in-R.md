---
title: "ANOVA Exercises in R: 15 One-Way and Two-Way Practice Problems"
slug: "ANOVA-Exercises-in-R"
description: "15 ANOVA R exercises with runnable solutions: one-way, two-way, interactions, Tukey HSD, Levene's, Welch's, effect size, contrasts, and assumption checks."
keywords: "ANOVA R exercises, ANOVA exercises in R, one-way ANOVA practice, two-way ANOVA R, Tukey HSD R, Welch's ANOVA, Levene's test R, eta squared R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "ANOVA Exercises (15)"
sidebar_order: 415
fr_parent: "One-Way-ANOVA-in-R.html"
auto_link_terms: "anova exercises|anova practice problems|anova exercises in r|one-way anova practice|two-way anova practice"
auto_link_case_sensitive: false
target_keyword: "ANOVA R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ANOVA Exercises in R: 15 One-Way and Two-Way Practice Problems

<p class="lead">Fifteen ANOVA exercises that walk you from a single-factor `aov()` fit through two-way interactions, Tukey HSD, Levene's and Welch's tests, effect sizes, and custom contrasts. Each problem has a runnable code stub plus a hidden solution with explanation, so you can attempt first and verify second.</p>

```r title="Run this once before any exercise"
library(car)
```

## Section 1. One-way ANOVA on a single grouping factor (3 problems)

### Exercise 1.1: Fit a one-way ANOVA on PlantGrowth weight by treatment group

**Task:** An agronomist running a small greenhouse experiment wants to know whether dry-weight yield differs across the three groups in the built-in `PlantGrowth` dataset (control, treatment 1, treatment 2). Fit a one-way ANOVA with `aov()` using `weight ~ group`, then save the fitted model object to `ex_1_1` and print its `summary()`.

**Expected result:**

```
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> group        2  3.766  1.8832   4.846 0.0159 *
#> Residuals   27 10.492  0.3886
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
summary(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- aov(weight ~ group, data = PlantGrowth)
summary(ex_1_1)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> group        2  3.766  1.8832   4.846 0.0159 *
#> Residuals   27 10.492  0.3886
```

**Explanation:** `aov()` is a thin wrapper around `lm()` whose `summary.aov` method prints the classical ANOVA table instead of a regression coefficient table. The F-statistic is the ratio of between-group mean square to within-group mean square; under the null of equal group means it follows an F distribution with (k-1, N-k) degrees of freedom. A p-value of 0.016 rejects equal means at the 5% level, but does not tell you which pair differs (that needs a post-hoc test like Tukey HSD).

</details>

### Exercise 1.2: Test whether iris sepal length differs across species

**Task:** A botany student is comparing the three species in the built-in `iris` dataset on `Sepal.Length`. Fit a one-way ANOVA with `aov(Sepal.Length ~ Species, data = iris)` and save the fitted model to `ex_1_2`. Use `summary()` to print the ANOVA table so you can read off the F value and the p-value for the species factor.

**Expected result:**

```
#>              Df Sum Sq Mean Sq F value Pr(>F)
#> Species       2  63.21  31.606   119.3 <2e-16 ***
#> Residuals   147  38.96   0.265
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
summary(ex_1_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- aov(Sepal.Length ~ Species, data = iris)
summary(ex_1_2)
#>              Df Sum Sq Mean Sq F value Pr(>F)
#> Species       2  63.21  31.606   119.3 <2e-16 ***
#> Residuals   147  38.96   0.265
```

**Explanation:** The F value of 119 is extremely large because between-species variance dominates within-species variance for sepal length: setosa is much shorter than virginica on average. With three species the numerator df is 2 and the denominator df is 150 minus 3 = 147. A p-value reported as `<2e-16` is at the machine-precision floor; you can pull the exact number with `summary(ex_1_2)[[1]][["Pr(>F)"]][1]`. Always pair an "obviously significant" F test with effect size (eta-squared) and a plot, because significance alone says nothing about practical magnitude.

</details>

### Exercise 1.3: One-way ANOVA on ToothGrowth length by supplement

**Task:** Using the `ToothGrowth` dataset (guinea-pig odontoblast length under two vitamin C supplement types), fit a one-way ANOVA of `len` on `supp` with `aov(len ~ supp, data = ToothGrowth)` and save the fitted model to `ex_1_3`. Print the ANOVA table so you can decide whether supplement type alone explains the observed differences.

**Expected result:**

```
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> supp         1  205.4   205.4   3.668 0.0604 .
#> Residuals   58 3246.9    56.0
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
summary(ex_1_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- aov(len ~ supp, data = ToothGrowth)
summary(ex_1_3)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> supp         1  205.4   205.4   3.668 0.0604 .
#> Residuals   58 3246.9    56.0
```

**Explanation:** The single-factor model lumps all dose levels together, which inflates the residual sum of squares because dose is a real (and large) source of variance left unmodelled. That is why supplement looks only marginally significant here (p = 0.060) but jumps to p = 0.0004 once you add `dose` as a second factor in Exercise 3.1. Treat a borderline p-value from a one-way ANOVA as a hint that an important covariate may be missing from the right-hand side.

</details>

## Section 2. Reading the output and post-hoc comparisons (3 problems)

### Exercise 2.1: Extract the F statistic and p-value as a named numeric vector

**Task:** A reporting analyst preparing a CSV summary of several ANOVA results needs the F statistic and the p-value pulled out of the model object as a named numeric vector. From `ex_1_1` (the PlantGrowth fit), extract the F value and the `Pr(>F)` for the `group` row and save them as a named numeric vector `c(F = ..., p = ...)` to `ex_2_1`.

**Expected result:**

```
#>          F          p
#> 4.84609 0.01591
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tab <- summary(ex_1_1)[[1]]
ex_2_1 <- c(F = tab[["F value"]][1], p = tab[["Pr(>F)"]][1])
round(ex_2_1, 5)
#>          F          p
#> 4.84609 0.01591
```

**Explanation:** `summary.aov` returns a list whose first element is a data frame with columns `Df`, `Sum Sq`, `Mean Sq`, `F value`, `Pr(>F)`. The first row is the factor effect and the second row is the residual (which has no F or p). Indexing with `[[1]]` and then a column name gives a numeric vector you can subset. For programmatic pipelines, `broom::tidy(ex_1_1)` returns the same numbers as a tibble with stable column names and is friendlier than positional indexing.

</details>

### Exercise 2.2: Run Tukey HSD on the PlantGrowth one-way ANOVA

**Task:** A reviewer wants to know which specific pairs of `PlantGrowth` groups differ, not just whether at least one pair differs. Run Tukey's Honest Significant Differences post-hoc on the model `ex_1_1` with `TukeyHSD()` and save the returned object to `ex_2_2`. Print it so the pairwise differences, confidence intervals, and adjusted p-values are visible.

**Expected result:**

```
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = weight ~ group, data = PlantGrowth)
#>
#> $group
#>             diff        lwr       upr     p adj
#> trt1-ctrl -0.371 -1.0622161 0.3202161 0.3908711
#> trt2-ctrl  0.494 -0.1972161 1.1852161 0.1979960
#> trt2-trt1  0.865  0.1737839 1.5562161 0.0120064
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- TukeyHSD(ex_1_1)
ex_2_2
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = weight ~ group, data = PlantGrowth)
#>
#> $group
#>             diff        lwr       upr     p adj
#> trt1-ctrl -0.371 -1.0622161 0.3202161 0.3908711
#> trt2-ctrl  0.494 -0.1972161 1.1852161 0.1979960
#> trt2-trt1  0.865  0.1737839 1.5562161 0.0120064
```

**Explanation:** Tukey HSD inverts the studentized range distribution to control the family-wise error rate at 5%, so the three pairwise p-values are already adjusted (you do not apply Bonferroni on top). The only significant pair is trt2 vs trt1; both treatments versus control are non-significant. This is a common pattern with three-arm trials: the two treatments together "move the needle" enough to flag the omnibus F test, but only the most extreme pair survives a controlled pairwise comparison.

</details>

### Exercise 2.3: Pairwise t-tests with Bonferroni correction on PlantGrowth

**Task:** A statistician wants to compare Tukey HSD against the more conservative Bonferroni adjustment as a sanity check. Run `pairwise.t.test()` on `PlantGrowth$weight` grouped by `PlantGrowth$group` with `p.adjust.method = "bonferroni"` and save the returned object to `ex_2_3`. Print the object so the adjusted-p matrix is shown.

**Expected result:**

```
#>   Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.582 -
#> trt2 0.263 0.013
#>
#> P value adjustment method: bonferroni
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- pairwise.t.test(
  PlantGrowth$weight, PlantGrowth$group,
  p.adjust.method = "bonferroni"
)
ex_2_3
#>   Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.582 -
#> trt2 0.263 0.013
#>
#> P value adjustment method: bonferroni
```

**Explanation:** Bonferroni multiplies each raw p-value by the number of comparisons (here 3) and caps at 1. It is the most conservative of the common corrections, which is why the trt2 vs trt1 adjusted p of 0.013 is slightly larger than Tukey's 0.012. With more comparisons (six groups: 15 pairs) Bonferroni quickly becomes underpowered; Tukey HSD or Holm are usually preferable for many comparisons. Use the pooled-SD variant when you trust the equal-variance assumption from Levene's test; otherwise pass `pool.sd = FALSE` for a Welch-style version.

</details>

## Section 3. Two-way ANOVA and interaction effects (3 problems)

### Exercise 3.1: Additive two-way ANOVA on ToothGrowth supp + dose

**Task:** Reanalyse `ToothGrowth` with both factors in the model: supplement type (`supp`) and dose level coerced to a factor with `factor(dose)`. Fit the additive (no-interaction) two-way model `aov(len ~ supp + factor(dose), data = ToothGrowth)` and save the result to `ex_3_1`. Print the ANOVA table to see whether supplement still looks marginal after dose is controlled for.

**Expected result:**

```
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> supp          1  205.4   205.4   14.02  0.000429 ***
#> factor(dose)  2 2426.4  1213.2   82.81  < 2e-16 ***
#> Residuals    56  820.4    14.7
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
summary(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- aov(len ~ supp + factor(dose), data = ToothGrowth)
summary(ex_3_1)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> supp          1  205.4   205.4   14.02  0.000429 ***
#> factor(dose)  2 2426.4  1213.2   82.81  < 2e-16 ***
#> Residuals    56  820.4    14.7
```

**Explanation:** Once dose is added to the right-hand side, the residual mean square drops from 56 (one-way) to 14.7 because most of that variance was really dose, not noise. Supplement now has an F of 14 and a p of 0.0004 instead of being marginal: a clean illustration of why omitting a strong covariate inflates within-group variance and hides real effects. Wrap dose in `factor()` so it is treated as three discrete levels (0.5, 1, 2) with two degrees of freedom; leaving it numeric would force a linear trend with only one degree of freedom.

</details>

### Exercise 3.2: Full factorial supp * dose with interaction term

**Task:** Extend the model from Exercise 3.1 to allow the supplement effect to differ across doses. Fit the full factorial `aov(len ~ supp * factor(dose), data = ToothGrowth)` and save it to `ex_3_2`. Print the ANOVA table; the new row `supp:factor(dose)` is the interaction test that asks whether the OJ-vs-VC gap depends on dose.

**Expected result:**

```
#>                    Df Sum Sq Mean Sq F value   Pr(>F)
#> supp                1  205.4   205.4   15.57  0.000231 ***
#> factor(dose)        2 2426.4  1213.2   92.00  < 2e-16 ***
#> supp:factor(dose)   2  108.3    54.2    4.11  0.021860 *
#> Residuals          54  712.1    13.2
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
summary(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- aov(len ~ supp * factor(dose), data = ToothGrowth)
summary(ex_3_2)
#>                    Df Sum Sq Mean Sq F value   Pr(>F)
#> supp                1  205.4   205.4   15.57  0.000231 ***
#> factor(dose)        2 2426.4  1213.2   92.00  < 2e-16 ***
#> supp:factor(dose)   2  108.3    54.2    4.11  0.021860 *
#> Residuals          54  712.1    13.2
```

**Explanation:** The interaction row is significant (p = 0.022), so the supplement effect is NOT the same at every dose. From the cell means you will see OJ outperforms VC at 0.5 and 1 mg, but the two are nearly tied at 2 mg. When the interaction is significant, you should interpret main effects with care or pivot to simple-effect tests within each dose level rather than reporting one aggregate "supp effect". `*` expands to all main effects plus the interaction; `(supp + factor(dose))^2` would give the same model for two factors.

</details>

### Exercise 3.3: Build a 6-row cell means table for supp x dose

**Task:** Before interpreting the interaction you ran in Exercise 3.2, summarise the underlying cell means. Use `aggregate(len ~ supp + factor(dose), data = ToothGrowth, FUN = mean)` to build a 6-row table (one row per supp x dose cell) and save it to `ex_3_3`. The table should have three columns: `supp`, `factor(dose)`, and `len`.

**Expected result:**

```
#>   supp factor(dose)    len
#> 1   OJ          0.5 13.230
#> 2   VC          0.5  7.980
#> 3   OJ          1   22.700
#> 4   VC          1   16.770
#> 5   OJ          2   26.060
#> 6   VC          2   26.140
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- aggregate(
  len ~ supp + factor(dose),
  data = ToothGrowth,
  FUN = mean
)
ex_3_3
#>   supp factor(dose)    len
#> 1   OJ          0.5 13.230
#> 2   VC          0.5  7.980
#> 3   OJ          1   22.700
#> 4   VC          1   16.770
#> 5   OJ          2   26.060
#> 6   VC          2   26.140
```

**Explanation:** The OJ-minus-VC gap is +5.25 at 0.5 mg, +5.93 at 1 mg, but only -0.08 at 2 mg. That collapsing gap is exactly the interaction the ANOVA flagged. Cell means tables are the most important diagnostic before reading any interaction p-value, because a "significant interaction" can be ordinal (lines stay in the same rank order) or disordinal (lines cross), and the interpretation differs. For tidyverse users, the equivalent is `ToothGrowth |> group_by(supp, dose) |> summarise(mean = mean(len))`.

</details>

## Section 4. Assumption checks before you trust the F test (3 problems)

### Exercise 4.1: Levene's test for homogeneity of variance on PlantGrowth

**Task:** Before reporting the one-way ANOVA F test from Exercise 1.1, an auditor asks for the standard equal-variance check. Use `leveneTest(weight ~ group, data = PlantGrowth)` from the `car` package and save the returned object to `ex_4_1`. Print it; a non-significant p means the equal-variance assumption is acceptable and the classical F test is valid.

**Expected result:**

```
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  2  1.1192 0.3412
#>       27
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- leveneTest(weight ~ group, data = PlantGrowth)
ex_4_1
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  2  1.1192 0.3412
#>       27
```

**Explanation:** Levene's test runs a one-way ANOVA on the absolute deviations from each group's center (median by default, which is the robust Brown-Forsythe variant). A non-significant result (p = 0.34) means there is not enough evidence to reject equal variances; classical `aov()` is fine. If Levene's were significant you would either transform `weight` (often `log()`), fit a Welch-style ANOVA via `oneway.test(..., var.equal = FALSE)`, or move to a non-parametric test like Kruskal-Wallis.

</details>

### Exercise 4.2: Shapiro-Wilk normality on the ANOVA residuals

**Task:** The classical ANOVA F test assumes the residuals are approximately normal. Pull the residuals from `ex_1_1` with `residuals()`, pass them to `shapiro.test()`, and save the htest object to `ex_4_2`. Print it; a non-significant Shapiro p-value means you cannot reject the normality assumption from this sample size.

**Expected result:**

```
#>   Shapiro-Wilk normality test
#>
#> data:  residuals(ex_1_1)
#> W = 0.96607, p-value = 0.4379
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- shapiro.test(residuals(ex_1_1))
ex_4_2
#>   Shapiro-Wilk normality test
#>
#> data:  residuals(ex_1_1)
#> W = 0.96607, p-value = 0.4379
```

**Explanation:** Test the model's residuals, not the raw response, because ANOVA assumes Normal(0, sigma^2) errors conditional on the predictors. With n = 30 the Shapiro test has modest power, so a non-significant p (0.44) is weak evidence of normality, not proof; always pair it with a QQ-plot `plot(ex_1_1, which = 2)`. ANOVA is also robust to mild non-normality when sample sizes are equal across groups, so a borderline Shapiro result on balanced data rarely overturns the substantive conclusion.

</details>

### Exercise 4.3: Welch's ANOVA for unequal variances

**Task:** Suppose Levene's test had flagged unequal variances and you need a Welch-corrected ANOVA. Run `oneway.test(weight ~ group, data = PlantGrowth, var.equal = FALSE)` and save the htest object to `ex_4_3`. Print it; the Welch test uses Satterthwaite-style fractional denominator degrees of freedom and is robust to heteroscedastic groups.

**Expected result:**

```
#>   One-way analysis of means (not assuming equal variances)
#>
#> data:  weight and group
#> F = 5.181, num df = 2.000, denom df = 17.128, p-value = 0.01739
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- oneway.test(weight ~ group, data = PlantGrowth, var.equal = FALSE)
ex_4_3
#>   One-way analysis of means (not assuming equal variances)
#>
#> data:  weight and group
#> F = 5.181, num df = 2.000, denom df = 17.128, p-value = 0.01739
```

**Explanation:** Welch's ANOVA is the F-test analogue of Welch's t-test: it weights each group by its own variance and shrinks the denominator degrees of freedom so the test stays calibrated when variances differ. Notice the denom df here is a non-integer 17.13, smaller than the classical 27, which costs some power but buys robustness. For pairwise follow-ups under unequal variances, use `pairwise.t.test(..., pool.sd = FALSE)`; the Games-Howell post-hoc (from package `rstatix` or `userfriendlyscience`) is the Welch-style analogue of Tukey HSD.

</details>

## Section 5. Effect size, custom contrasts, and applied workflow (3 problems)

### Exercise 5.1: Compute eta-squared by hand from the ANOVA table

**Task:** A reviewer wants the effect size alongside the F test from Exercise 1.1. Compute eta-squared as the group sum of squares divided by the total sum of squares (group + residual) from `summary(ex_1_1)`. Save the single numeric value to `ex_5_1`, rounded to three decimals.

**Expected result:**

```
#> [1] 0.264
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tab <- summary(ex_1_1)[[1]]
ss_group <- tab[["Sum Sq"]][1]
ss_resid <- tab[["Sum Sq"]][2]
ex_5_1 <- round(ss_group / (ss_group + ss_resid), 3)
ex_5_1
#> [1] 0.264
```

**Explanation:** Eta-squared is the proportion of total variance in the outcome attributable to the factor, the ANOVA analogue of R-squared. Cohen's rough benchmarks call 0.01 small, 0.06 medium, and 0.14 large; the PlantGrowth effect of 0.26 is large. Eta-squared is upward-biased for small samples; partial eta-squared and omega-squared correct for that and are reported by `effectsize::eta_squared()` and `effectsize::omega_squared()`. Always report an effect size next to the F value because significance scales with sample size while effect size does not.

</details>

### Exercise 5.2: Custom contrast: control versus the average of two treatments

**Task:** Rather than three pairwise comparisons, you only care about one scientific question: does the average of the two treatments differ from control? Set up a custom contrast on `PlantGrowth$group` that maps `ctrl` to +2 and each treatment to -1, refit with `lm()`, and save the coefficient table (from `summary(...)$coefficients`) to `ex_5_2`. Print `ex_5_2`.

**Expected result:**

```
#>                Estimate Std. Error   t value  Pr(>|t|)
#> (Intercept)   5.0730000  0.1138682 44.551103 1.105e-26
#> group1       -0.0615000  0.1610458 -0.381881   0.70554
#> group2       -0.6180000  0.2789274 -2.215624   0.03524
```

**Difficulty:** Advanced

```r title="Your turn"
pg <- PlantGrowth
contrasts(pg$group) <- cbind(
  ctrl_vs_trts = c(2, -1, -1),
  trt1_vs_trt2 = c(0, 1, -1)
)
fit <- lm(weight ~ group, data = pg)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pg <- PlantGrowth
contrasts(pg$group) <- cbind(
  ctrl_vs_trts = c(2, -1, -1),
  trt1_vs_trt2 = c(0, 1, -1)
)
fit <- lm(weight ~ group, data = pg)
ex_5_2 <- summary(fit)$coefficients
ex_5_2
#>                Estimate Std. Error   t value  Pr(>|t|)
#> (Intercept)   5.0730000  0.1138682 44.551103 1.105e-26
#> group1       -0.0615000  0.1610458 -0.381881   0.70554
#> group2       -0.6180000  0.2789274 -2.215624   0.03524
```

**Explanation:** Assigning a contrast matrix to a factor changes what the lm coefficients estimate without refitting any new data. The two columns must be orthogonal and sum to zero within each column; `c(2, -1, -1)` and `c(0, 1, -1)` qualify. `group1` is one-third of the ctrl-versus-mean-of-treatments contrast (the +2/-1/-1 coding scales it), and its non-significant p (0.71) says the two treatments together do NOT differ from control on average. `group2` tests trt1 versus trt2 and is significant (p = 0.035), matching the Tukey HSD finding from Exercise 2.2. Custom contrasts let you test one targeted scientific question per degree of freedom instead of all pairs.

</details>

### Exercise 5.3: Full diagnostic workflow: ANOVA vs Welch vs Kruskal-Wallis

**Task:** Put the whole flow together: for `PlantGrowth weight ~ group`, run Levene's test, Shapiro on the aov residuals, classical ANOVA, Welch's ANOVA, and Kruskal-Wallis. Extract the p-values from each and assemble them into a named numeric vector `c(levene_p, shapiro_p, aov_p, welch_p, kruskal_p)` saved to `ex_5_3`. Round to four decimals and print.

**Expected result:**

```
#> levene_p shapiro_p     aov_p   welch_p kruskal_p
#>   0.3412    0.4379    0.0159    0.0174    0.0184
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lev <- leveneTest(weight ~ group, data = PlantGrowth)
sha <- shapiro.test(residuals(ex_1_1))
av  <- summary(ex_1_1)[[1]]
wel <- oneway.test(weight ~ group, data = PlantGrowth, var.equal = FALSE)
kru <- kruskal.test(weight ~ group, data = PlantGrowth)

ex_5_3 <- round(c(
  levene_p  = lev[["Pr(>F)"]][1],
  shapiro_p = sha$p.value,
  aov_p     = av[["Pr(>F)"]][1],
  welch_p   = wel$p.value,
  kruskal_p = kru$p.value
), 4)
ex_5_3
#> levene_p shapiro_p     aov_p   welch_p kruskal_p
#>   0.3412    0.4379    0.0159    0.0174    0.0184
```

**Explanation:** All three group-difference tests (classical, Welch, Kruskal-Wallis) agree on the conclusion at the 5% level, which is the reassuring case: the decision is robust to choice of test. When tests disagree, prefer the one whose assumptions are satisfied: classical F if Levene and Shapiro both pass, Welch's F if Levene flags unequal variances, Kruskal-Wallis if Shapiro flags clearly non-normal residuals (especially with small or unbalanced groups). Reporting all three is overkill for a paper, but during analysis it is a useful sensitivity check.

</details>

## What to do next

You have rehearsed every step of a one-way and two-way ANOVA workflow in R. To go deeper:

- Review the [One-Way ANOVA in R](One-Way-ANOVA-in-R.html) tutorial for a guided walk-through of the math and assumptions.
- Practise the related `lm` workflow with [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html), since `aov()` is just `lm()` with a different summary method.
- For tests where the response is a count or proportion rather than a continuous outcome, switch over to [Chi-Squared Test Exercises in R](Chi-Squared-Test-Exercises-in-R.html).
- Compare ANOVA against its two-group ancestor in [t-test Exercises in R](t-test-Exercises-in-R.html).
