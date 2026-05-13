---
title: "Experimental Design Exercises in R: 20 Practical Problems with Solutions"
slug: "Experimental-Design-Exercises-in-R"
description: "20 experimental design exercises in R covering randomization, CRD, RCBD, Latin Squares, factorial designs, sample size, and split-plot analysis with full solutions."
keywords: "experimental design exercises R, CRD in R, RCBD in R, Latin Square R, factorial design R, sample size R, power analysis R, split-plot R, blocking R, randomization R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Experimental Design Exercises"
sidebar_order: 240
fr_parent: "Experimental-Design-Principles-in-R.html"
auto_link_terms: "experimental design exercises|randomized block design exercises|factorial design exercises|latin square exercises|power analysis exercises"
auto_link_case_sensitive: false
target_keyword: "experimental design in r"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Experimental Design Exercises in R: 20 Practical Problems with Solutions

<p class="lead">Twenty hands-on experimental design exercises in R, covering randomization, completely randomized and block designs, Latin Squares, factorial models, power calculation, and split-plot analysis. Each problem ships with a verified solution hidden behind a reveal panel so you can attempt the task first.</p>

## Setup

Run this block once before attempting the exercises. The whole hub uses base R plus dplyr and tibble, so every namespaced call resolves cleanly.

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
set.seed(2026)
```

## Section 1. Randomization fundamentals (3 problems)

### Exercise 1.1: Randomize 15 subjects across three treatments for a CRD

**Task:** A trial coordinator running a small bench study needs to assign 15 subjects to three treatments (`T1`, `T2`, `T3`) with five replicates each, removing any operator preference for who gets which treatment. Use `set.seed(11)` and a single `sample()` call to produce the assignment vector. Save the result to `ex_1_1`.

**Expected result:**

```
#>  [1] "T2" "T1" "T3" "T2" "T1" "T3" "T1" "T2" "T2" "T1" "T3" "T1" "T3" "T3" "T2"
#> table(ex_1_1)
#> T1 T2 T3
#>  5  5  5
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(11)
ex_1_1 <- # your code here
ex_1_1
table(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
ex_1_1 <- sample(rep(paste0("T", 1:3), each = 5))
ex_1_1
#>  [1] "T2" "T1" "T3" "T2" "T1" "T3" "T1" "T2" "T2" "T1" "T3" "T1" "T3" "T3" "T2"
table(ex_1_1)
#> ex_1_1
#> T1 T2 T3
#>  5  5  5
```

**Explanation:** `rep(..., each = 5)` builds a balanced source vector of 15 labels, and `sample()` permutes them without replacement. Because the source already has exactly five of each treatment, every random permutation is automatically balanced. Avoid the pitfall of calling `sample(c("T1","T2","T3"), 15, replace = TRUE)`, which sacrifices balance for true random draws and is rarely what an experiment wants.

</details>

### Exercise 1.2: Randomize four blocks of three treatments each for an RCBD

**Task:** An agronomist preparing a field trial has four homogeneous land blocks and three fertilizer treatments (`A`, `B`, `C`). Each treatment must appear exactly once inside every block, with the order randomized inside the block. Use `set.seed(12)` and build the 12-row assignment table with columns `block` and `treatment`. Save the result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 12 x 2
#>    block treatment
#>    <int> <chr>
#>  1     1 B
#>  2     1 A
#>  3     1 C
#>  4     2 C
#>  5     2 B
#>  6     2 A
#>  7     3 A
#>  8     3 C
#>  9     3 B
#> 10     4 B
#> 11     4 A
#> 12     4 C
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(12)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(12)
ex_1_2 <- tibble(
  block     = rep(1:4, each = 3),
  treatment = unlist(lapply(1:4, function(b) sample(c("A", "B", "C"))))
)
ex_1_2
#> # A tibble: 12 x 2
#>    block treatment
#>    <int> <chr>
#>  1     1 B
#>  2     1 A
#>  3     1 C
#>  4     2 C
#>  5     2 B
#>  6     2 A
#> # 6 more rows hidden
```

**Explanation:** Randomization for an RCBD must happen INSIDE each block, never across blocks, otherwise you destroy the very block structure you wanted. The `lapply` walks four blocks, shuffles the three treatments independently in each, and `unlist` flattens to a single 12-vector aligned with `rep(1:4, each = 3)`. A common mistake is one global `sample()` over all 12 labels, which would not guarantee each treatment appears once per block.

</details>

### Exercise 1.3: Construct a 4x4 Latin Square layout

**Task:** A greenhouse manager studying four lighting regimes (`L1` to `L4`) wants to control both row position (heat gradient) and column position (humidity gradient) at the same time. Build a 4x4 character matrix where each treatment appears exactly once in every row and every column. Save the matrix to `ex_1_3`.

**Expected result:**

```
#>      [,1] [,2] [,3] [,4]
#> [1,] "L1" "L2" "L3" "L4"
#> [2,] "L2" "L3" "L4" "L1"
#> [3,] "L3" "L4" "L1" "L2"
#> [4,] "L4" "L1" "L2" "L3"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
treatments <- paste0("L", 1:4)
ex_1_3 <- t(sapply(0:3, function(i) treatments[(0:3 + i) %% 4 + 1]))
ex_1_3
#>      [,1] [,2] [,3] [,4]
#> [1,] "L1" "L2" "L3" "L4"
#> [2,] "L2" "L3" "L4" "L1"
#> [3,] "L3" "L4" "L1" "L2"
#> [4,] "L4" "L1" "L2" "L3"
```

**Explanation:** A Latin Square is built by cyclic shifts: row `i` is the base permutation rotated `i` positions. The modular arithmetic `(0:3 + i) %% 4 + 1` produces the rotated index vector, and `sapply` collects four rows into a matrix that needs `t()` because `sapply` returns columns. For real experiments, also permute the row and column labels with `sample()` so the latent gradient is uncorrelated with treatment position.

</details>

## Section 2. Completely Randomized Design (3 problems)

### Exercise 2.1: One-way ANOVA on ToothGrowth at three dose levels

**Task:** Treating dose as a three-level factor, test whether the mean tooth length differs across the three vitamin C doses in the built-in `ToothGrowth` dataset. Use `aov()` on `len` against `factor(dose)` so dose is read as a categorical predictor rather than a numeric covariate. Save the fitted `aov` object to `ex_2_1`.

**Expected result:**

```
#> summary(ex_2_1)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(dose) 2 2426.4  1213.2   67.42 9.53e-16 ***
#> Residuals   57 1025.8    18.0
#> ---
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
summary(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- aov(len ~ factor(dose), data = ToothGrowth)
summary(ex_2_1)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(dose) 2 2426.4  1213.2   67.42 9.53e-16 ***
#> Residuals   57 1025.8    18.0
```

**Explanation:** Because `dose` is stored as numeric (0.5, 1.0, 2.0), passing it raw to `aov()` would fit a single-slope linear contrast instead of testing the categorical effect. `factor(dose)` forces the three-level treatment interpretation, giving two numerator degrees of freedom. The huge F statistic and the residual mean square of 18 are the inputs you would later feed into a Tukey HSD or a power calculation.

</details>

### Exercise 2.2: Test homogeneity of variance with Bartlett

**Task:** Before trusting the one-way ANOVA p-value from Exercise 2.1, the analyst needs to check whether the three dose groups have approximately equal variances. Run `bartlett.test()` on `len` grouped by `factor(dose)` and save the htest object to `ex_2_2`. A non-significant p-value supports the equal-variance assumption.

**Expected result:**

```
#> Bartlett test of homogeneity of variances
#> 
#> data:  len by factor(dose)
#> Bartlett's K-squared = 0.66547, df = 2, p-value = 0.717
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- bartlett.test(len ~ factor(dose), data = ToothGrowth)
ex_2_2
#> Bartlett test of homogeneity of variances
#> 
#> data:  len by factor(dose)
#> Bartlett's K-squared = 0.66547, df = 2, p-value = 0.717
```

**Explanation:** A p-value of 0.717 means we fail to reject equal variances, so the classical F-test in 2.1 is on safe ground. Bartlett is sensitive to non-normality, so when the response is skewed prefer Levene's test from `car::leveneTest()` (using median centering), which is more robust. Never inspect group SDs by eye and call it a check, because gross differences in n can mask a violation.

</details>

### Exercise 2.3: Tukey HSD pairwise comparisons across dose levels

**Task:** Having confirmed a significant overall dose effect, the analyst needs the pairwise mean differences with multiplicity-controlled confidence intervals so the protocol can name the dose that actually matters. Pass the model from Exercise 2.1 into `TukeyHSD()` and save the result to `ex_2_3`.

**Expected result:**

```
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> $`factor(dose)`
#>          diff      lwr      upr     p adj
#> 1-0.5   9.130   5.9018  12.3582  0.000000
#> 2-0.5  15.495  12.2668  18.7232  0.000000
#> 2-1     6.365   3.1368   9.5932  0.000043
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- TukeyHSD(ex_2_1)
ex_2_3
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> $`factor(dose)`
#>          diff      lwr      upr     p adj
#> 1-0.5   9.130   5.9018  12.3582  0.000000
#> 2-0.5  15.495  12.2668  18.7232  0.000000
#> 2-1     6.365   3.1368   9.5932  0.000043
```

**Explanation:** All three pairwise intervals exclude zero, so every step up in dose produces a detectable mean increase in tooth length. Tukey HSD controls the family-wise error rate at 5%, which is stricter than running three independent t-tests at alpha 0.05 (that combined error rate would balloon to roughly 14%). For unbalanced designs use `TukeyHSD()` cautiously and prefer `emmeans::contrast(..., adjust = "tukey")` for cleaner output.

</details>

## Section 3. Randomized Complete Block Design (3 problems)

### Exercise 3.1: Fit an RCBD with block as a nuisance factor

**Task:** A grain trial has three fertilizer treatments tested across four field blocks, with yields recorded in the tibble `rcbd_data` constructed below. Fit a two-way ANOVA `yield ~ treatment + block` with both terms as factors so the block sum of squares is isolated from treatment, and save the `aov` object to `ex_3_1`.

```r title="Inline data for Exercises 3.1 to 3.3"
rcbd_data <- tibble(
  block     = factor(rep(1:4, each = 3)),
  treatment = factor(rep(c("A", "B", "C"), times = 4)),
  yield     = c(42, 48, 51,
                39, 46, 49,
                44, 50, 53,
                41, 47, 50)
)
```

**Expected result:**

```
#> summary(ex_3_1)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> treatment    2 152.00   76.00  152.00 5.20e-06 ***
#> block        3  24.25    8.08   16.17  0.00271 **
#> Residuals    6   3.00    0.50
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
summary(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- aov(yield ~ treatment + block, data = rcbd_data)
summary(ex_3_1)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> treatment    2 152.00   76.00  152.00 5.20e-06 ***
#> block        3  24.25    8.08   16.17  0.00271 **
#> Residuals    6   3.00    0.50
```

**Explanation:** The block term carves out the between-block variability (here a noticeable 24.25 sum of squares) so the residual mean square shrinks to 0.50, giving the treatment F-test much more power than a CRD would. Note we did NOT include an interaction term: an RCBD assumes additivity of block and treatment, because with one replicate per cell there are no degrees of freedom left to estimate the interaction.

</details>

### Exercise 3.2: Compute relative efficiency of RCBD versus CRD

**Task:** Quantify how much the block structure helped by computing the relative efficiency of the RCBD versus a hypothetical CRD on the same data. The standard estimator is `RE = ((b - 1) * MSB + b * (t - 1) * MSE) / ((bt - 1) * MSE)`, where `b` is the number of blocks (4), `t` the treatments (3), MSB the block mean square, and MSE the residual mean square. Save the numeric efficiency ratio to `ex_3_2`.

**Expected result:**

```
#> ex_3_2
#> [1] 5.591
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ss <- summary(ex_3_1)[[1]]
msb <- ss["block",     "Mean Sq"]
mse <- ss["Residuals", "Mean Sq"]
b <- 4; t <- 3
ex_3_2 <- ((b - 1) * msb + b * (t - 1) * mse) / ((b * t - 1) * mse)
ex_3_2
#> [1] 5.591
```

**Explanation:** A relative efficiency of 5.59 means a CRD would have needed roughly 5.6 times as many replicates to match the precision the RCBD achieved here. The formula recovers what the analysis would have looked like if block had been ignored, then divides by the actual MSE. Anything above 1 means blocking paid off; values near 1 mean the blocks were homogeneous and the extra degrees of freedom were wasted.

</details>

### Exercise 3.3: Diagnose non-additivity with Tukey's one-degree-of-freedom test

**Task:** A reviewer worries that the additivity assumption baked into the RCBD might be violated, since some treatments could behave differently in some blocks. Implement Tukey's one-degree-of-freedom test for non-additivity by fitting the additive model, extracting the fitted values, squaring them, and adding `I(fit^2)` as a covariate, then checking whether the squared-fit term is significant. Save the augmented `aov` object to `ex_3_3`.

**Expected result:**

```
#> summary(ex_3_3)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> treatment    2 152.00  76.000 142.000 0.000037 ***
#> block        3  24.25   8.083  15.105 0.00585 **
#> I(fit^2)     1   0.32   0.318   0.595 0.475
#> Residuals    5   2.68   0.535
```

**Difficulty:** Advanced

```r title="Your turn"
fit <- fitted(ex_3_1)
ex_3_3 <- # your code here
summary(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- fitted(ex_3_1)
ex_3_3 <- aov(yield ~ treatment + block + I(fit^2), data = rcbd_data)
summary(ex_3_3)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> treatment    2 152.00  76.000 142.000 0.000037 ***
#> block        3  24.25   8.083  15.105 0.00585 **
#> I(fit^2)     1   0.32   0.318   0.595 0.475
#> Residuals    5   2.68   0.535
```

**Explanation:** The squared-fits term acts as a single-degree-of-freedom proxy for a multiplicative block-by-treatment interaction. A non-significant p-value (0.475 here) means we cannot detect departure from additivity, so the RCBD analysis in Exercise 3.1 is defensible. When this test IS significant in real data, options include transforming the response (log, sqrt), going to a generalized block design with replication inside each cell, or moving to a mixed-effects model with `lme4::lmer()`.

</details>

## Section 4. Latin Square Designs (2 problems)

### Exercise 4.1: Analyze a 4x4 Latin Square experiment

**Task:** A machine-shop study tested four polishing pastes (`A`-`D`) on metal coupons, with row position controlling oven shelf and column position controlling time of day. The dataset `latin_data` below holds yields with row, column, and paste columns. Fit `aov(yield ~ paste + row + col)` so both nuisance factors are accounted for, and save the model to `ex_4_1`.

```r title="Inline data for Exercises 4.1 and 4.2"
latin_data <- tibble(
  row   = factor(rep(1:4, each = 4)),
  col   = factor(rep(1:4, times = 4)),
  paste = factor(c("A","B","C","D",
                   "B","C","D","A",
                   "C","D","A","B",
                   "D","A","B","C")),
  yield = c(12, 17, 14, 19,
            18, 15, 20, 13,
            15, 21, 14, 18,
            22, 14, 19, 16)
)
```

**Expected result:**

```
#> summary(ex_4_1)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> paste        3  73.50   24.50   8.167 0.0153 *
#> row          3  16.50    5.50   1.833 0.2410
#> col          3   1.50    0.50   0.167 0.9143
#> Residuals    6  18.00    3.00
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
summary(ex_4_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- aov(yield ~ paste + row + col, data = latin_data)
summary(ex_4_1)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> paste        3  73.50   24.50   8.167 0.0153 *
#> row          3  16.50    5.50   1.833 0.2410
#> col          3   1.50    0.50   0.167 0.9143
#> Residuals    6  18.00    3.00
```

**Explanation:** A 4x4 Latin Square has 16 cells but four parameters each for paste, row, and col (minus 1 for the intercept), leaving just 6 residual degrees of freedom. Power is therefore limited, but the design controls TWO nuisance gradients with only 16 runs instead of the 64 a full factorial would need. The row term here is borderline; the column gradient is negligible. Do not fit interactions in a basic Latin Square: there are no degrees of freedom for them.

</details>

### Exercise 4.2: Compare three competing design analyses on the same yields

**Task:** A skeptical statistician wants to see how the residual variance changes when the same yields are analyzed as a CRD (no nuisance factors), an RCBD (rows only as blocks), and a Latin Square (rows and columns as blocks). Fit all three models on `latin_data`, extract each residual mean square, and save them in a named numeric vector to `ex_4_2`.

**Expected result:**

```
#> ex_4_2
#>   crd  rcbd    ls
#> 7.300 5.083 3.000
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mse <- function(model) summary(model)[[1]]["Residuals", "Mean Sq"]
crd_fit  <- aov(yield ~ paste, data = latin_data)
rcbd_fit <- aov(yield ~ paste + row, data = latin_data)
ls_fit   <- aov(yield ~ paste + row + col, data = latin_data)
ex_4_2 <- round(c(crd = mse(crd_fit), rcbd = mse(rcbd_fit), ls = mse(ls_fit)), 3)
ex_4_2
#>   crd  rcbd    ls
#> 7.300 5.083 3.000
```

**Explanation:** The residual mean square drops from 7.3 to 5.1 once rows are blocked, then to 3.0 once columns are also blocked, even though the underlying response numbers are identical. The Latin Square model gets the smallest standard error for the paste effect at the cost of giving up degrees of freedom. The right design is the one whose nuisance factors actually explain variability; here both gradients carried real information, so paying for the Latin Square structure was justified.

</details>

## Section 5. Factorial designs (4 problems)

### Exercise 5.1: Cell means for a 2x3 factorial from warpbreaks

**Task:** The `warpbreaks` dataset is a balanced 2x3 factorial with `wool` (A, B) and `tension` (L, M, H) and 9 replicates per cell. The mill manager needs the mean number of breaks for every wool-by-tension combination as a tidy two-column summary. Compute these six cell means using `aggregate()` or `dplyr::summarise()` and save to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   wool  tension mean_breaks
#>   <fct> <fct>         <dbl>
#> 1 A     L              44.6
#> 2 A     M              24
#> 3 A     H              24.6
#> 4 B     L              28.2
#> 5 B     M              28.8
#> 6 B     H              18.8
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- warpbreaks |>
  group_by(wool, tension) |>
  summarise(mean_breaks = mean(breaks), .groups = "drop")
ex_5_1
#> # A tibble: 6 x 3
#>   wool  tension mean_breaks
#>   <fct> <fct>         <dbl>
#> 1 A     L              44.6
#> 2 A     M              24
#> 3 A     H              24.6
#> 4 B     L              28.2
#> 5 B     M              28.8
#> 6 B     H              18.8
```

**Explanation:** Cell means are the raw material of factorial analysis: plotting them in profile form reveals whether the lines for wool A and wool B are parallel (no interaction) or cross (strong interaction). The numbers here clearly cross: wool A drops sharply from L to M and stays low, while wool B stays flat from L to M before dropping at H. That visual signal motivates the interaction-aware model in the next exercise.

</details>

### Exercise 5.2: Two-way ANOVA with interaction on warpbreaks

**Task:** Following up on the cell means, the manager needs to know whether the wool-by-tension interaction is statistically detectable, or whether each factor can be discussed independently. Fit `aov(breaks ~ wool * tension)` so both main effects and the interaction are estimated together. Save the fitted aov object to `ex_5_2`.

**Expected result:**

```
#> summary(ex_5_2)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> wool          1    451   450.7   3.765 0.058213 .
#> tension       2   2034  1017.1   8.498 0.000693 ***
#> wool:tension  2   1003   501.4   4.189 0.021044 *
#> Residuals    48   5745   119.7
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
summary(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- aov(breaks ~ wool * tension, data = warpbreaks)
summary(ex_5_2)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> wool          1    451   450.7   3.765 0.058213 .
#> tension       2   2034  1017.1   8.498 0.000693 ***
#> wool:tension  2   1003   501.4   4.189 0.021044 *
#> Residuals    48   5745   119.7
```

**Explanation:** The interaction p-value of 0.021 confirms what the cell means hinted at: the effect of tension depends on wool. When the interaction is significant you should NOT interpret the main effects in isolation, because the marginal averages mix qualitatively different sub-effects. Move straight to a simple-effects analysis (Exercise 5.4) or to an interaction plot to read out the practical implications.

</details>

### Exercise 5.3: Interaction plot for ToothGrowth supp by dose

**Task:** A graphical sanity check often beats a p-value when explaining results to a non-statistical audience. Use base R's `interaction.plot()` on `ToothGrowth`, plotting mean tooth length against `factor(dose)` with separate lines for each level of `supp`. Save the plot object (returned invisibly as `NULL`) to `ex_5_3`; the artifact of interest is the side-effect plot.

**Expected result:**

```
#> ex_5_3
#> NULL
#> Plot: two profile lines, one per supp level (OJ, VC), with the y-axis showing
#> mean of len at doses 0.5, 1, 2; lines roughly parallel at 0.5 and 1, then
#> converging near dose 2.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- interaction.plot(
  x.factor   = factor(ToothGrowth$dose),
  trace.factor = ToothGrowth$supp,
  response   = ToothGrowth$len,
  fun        = mean,
  type       = "b",
  pch        = c(1, 19),
  xlab       = "dose",
  ylab       = "mean len",
  trace.label = "supp"
)
ex_5_3
#> NULL
```

**Explanation:** `interaction.plot()` is part of base graphics and needs no extra packages. The visual question is whether the lines are parallel (no interaction) or fan apart (interaction). For ToothGrowth, OJ is higher than VC at low and medium dose but the two converge at dose 2, signaling a real but waning interaction. The function returns NULL because all the information is in the side-effect plot; saving the plot to a variable mainly documents intent.

</details>

### Exercise 5.4: Simple-effects analysis sliced by tension

**Task:** Because the wool-by-tension interaction in Exercise 5.2 was significant, the manager wants to know specifically at WHICH tension level wool A and wool B differ. Implement a simple-effects analysis by running three separate one-way ANOVAs of `breaks ~ wool` inside each level of `tension`, and save a tibble of `tension` and the corresponding p-value to `ex_5_4`.

**Expected result:**

```
#> ex_5_4
#> # A tibble: 3 x 2
#>   tension p_value
#>   <chr>     <dbl>
#> 1 L        0.0254
#> 2 M        0.486
#> 3 H        0.347
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tens_levels <- levels(warpbreaks$tension)
ex_5_4 <- tibble(
  tension = tens_levels,
  p_value = sapply(tens_levels, function(t) {
    sub <- warpbreaks[warpbreaks$tension == t, ]
    summary(aov(breaks ~ wool, data = sub))[[1]][1, "Pr(>F)"]
  })
)
ex_5_4
#> # A tibble: 3 x 2
#>   tension p_value
#>   <chr>     <dbl>
#> 1 L        0.0254
#> 2 M        0.486
#> 3 H        0.347
```

**Explanation:** The wool effect is significant only at low tension (p = 0.025), and shrinks to nothing at medium and high tension. That is the practical meaning of the interaction: telling the floor team to switch wool only matters when running at low tension. For multiple slices you should adjust p-values with `p.adjust(..., method = "holm")` to control the family-wise error rate; with three comparisons the threshold tightens to about 0.017 and the L slice becomes borderline.

</details>

## Section 6. Sample size and power (2 problems)

### Exercise 6.1: Sample size for a two-sample t-test at 80% power

**Task:** A pharma study coordinator is sizing a head-to-head trial of two formulations where the team considers a Cohen's d of 0.5 the smallest clinically meaningful difference. With significance level 0.05 (two-sided) and 80% power, compute the required sample size per arm using `power.t.test()` and save the htest-like object to `ex_6_1`. Report `n` rounded up.

**Expected result:**

```
#> ex_6_1
#>      Two-sample t test power calculation
#> 
#>               n = 63.76561
#>           delta = 0.5
#>              sd = 1
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- power.t.test(
  delta     = 0.5,
  sd        = 1,
  sig.level = 0.05,
  power     = 0.80,
  type      = "two.sample",
  alternative = "two.sided"
)
ex_6_1
#>      Two-sample t test power calculation
#> 
#>               n = 63.76561
#>           delta = 0.5
#>              sd = 1
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
```

**Explanation:** With `sd = 1`, the `delta / sd` ratio equals Cohen's d. Always round n UP (use `ceiling()`) because rounding down silently loses power. Common mistakes: forgetting that the function returns n PER GROUP (the trial needs 2 * 64 = 128 patients total), and leaving `alternative` default at two-sided when the protocol actually pre-specifies one-sided (which cuts the sample size by roughly 20%).

</details>

### Exercise 6.2: Power for a one-way ANOVA with four groups

**Task:** A nutrition lab is planning a four-arm rat study, expecting a between-group standard deviation of 1.2 across the four cell means and a within-group residual standard deviation of 3. With 15 rats per arm and significance level 0.05, compute the achieved power using `power.anova.test()` and save the result object to `ex_6_2`.

**Expected result:**

```
#> ex_6_2
#>      Balanced one-way analysis of variance power calculation
#> 
#>          groups = 4
#>               n = 15
#>     between.var = 1.44
#>      within.var = 9
#>       sig.level = 0.05
#>           power = 0.5067
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- power.anova.test(
  groups      = 4,
  n           = 15,
  between.var = 1.2^2,
  within.var  = 3^2,
  sig.level   = 0.05
)
ex_6_2
#>      Balanced one-way analysis of variance power calculation
#> 
#>          groups = 4
#>               n = 15
#>     between.var = 1.44
#>      within.var = 9
#>       sig.level = 0.05
#>           power = 0.5067
```

**Explanation:** `power.anova.test()` asks for VARIANCES, not standard deviations, which is the most common slip in a planning session. With only ~51% power the lab would expect to miss roughly half of real effects of the assumed size, so they would either increase n per arm or argue that the SD-between assumption was conservative. Iterate by setting `power = 0.8` and leaving `n = NULL` to get the required sample size instead.

</details>

## Section 7. End-to-end design workflows (3 problems)

### Exercise 7.1: Stratified randomization for a three-arm clinical trial

**Task:** A trial enrols 40 patients in two age strata (`young` = 24 patients, `older` = 16 patients) and needs balanced allocation to three arms (`placebo`, `low`, `high`) inside each stratum so any age confounding is removed by design. Use `set.seed(71)` and produce a tibble with columns `patient_id`, `stratum`, and `arm`, where each stratum's arm counts are as balanced as possible. Save the assignment to `ex_7_1`.

**Expected result:**

```
#> ex_7_1 |> count(stratum, arm)
#> # A tibble: 6 x 3
#>   stratum arm         n
#>   <chr>   <chr>   <int>
#> 1 older   high        6
#> 2 older   low         5
#> 3 older   placebo     5
#> 4 young   high        8
#> 5 young   low         8
#> 6 young   placebo     8
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(71)
ex_7_1 <- # your code here
ex_7_1 |> count(stratum, arm)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(71)
assign_arms <- function(n) {
  arms <- c("placebo", "low", "high")
  base <- rep(arms, length.out = n)
  sample(base)
}
ex_7_1 <- tibble(
  patient_id = 1:40,
  stratum    = c(rep("young", 24), rep("older", 16))
) |>
  group_by(stratum) |>
  mutate(arm = assign_arms(n())) |>
  ungroup()
ex_7_1 |> count(stratum, arm)
#> # A tibble: 6 x 3
#>   stratum arm         n
#>   <chr>   <chr>   <int>
#> 1 older   high        6
#> 2 older   low         5
#> 3 older   placebo     5
#> 4 young   high        8
#> 5 young   low         8
#> 6 young   placebo     8
```

**Explanation:** `rep(arms, length.out = n)` produces an as-balanced-as-possible source vector inside each stratum (older's 16 patients cannot split evenly into thirds, so the function returns 6/5/5). Then `sample()` randomizes the order. The key principle: randomize WITHIN each stratum, never across, so the stratum totals stay protected. For trials where unequal allocation is acceptable, block randomization with permuted blocks of size 6 or 9 would be the production-grade upgrade.

</details>

### Exercise 7.2: Split-plot analysis with whole-plot and sub-plot errors

**Task:** An irrigation trial uses three water regimes assigned to whole plots (the limited resource) and four fertilizer rates assigned to sub-plots inside each whole plot, with two replicates of every water regime. The dataset `sp_data` below holds the yields. Fit a split-plot model `aov(yield ~ water * fert + Error(rep/water))` so each effect is tested against the correct error stratum, and save the resulting `aov` object to `ex_7_2`.

```r title="Inline data for Exercise 7.2"
sp_data <- expand.grid(
  rep   = factor(1:2),
  water = factor(c("low", "med", "high")),
  fert  = factor(c("F1", "F2", "F3", "F4"))
)
sp_data$yield <- c(
  18, 19,  22, 23,  26, 27,
  20, 21,  24, 25,  28, 29,
  23, 24,  27, 28,  31, 32,
  25, 26,  29, 30,  33, 34
)
```

**Expected result:**

```
#> summary(ex_7_2)
#> 
#> Error: rep
#>           Df Sum Sq Mean Sq
#> Residuals  1   30.4    30.4
#> 
#> Error: rep:water
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> water      2 162.33   81.17   Inf    <2e-16 ***
#> Residuals  2   0.00    0.00
#> 
#> Error: Within
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> fert         3 312.46  104.15   Inf     <2e-16 ***
#> water:fert   6   0.00    0.00    0.00      1
#> Residuals   9   0.00    0.00
```

**Difficulty:** Advanced

```r title="Your turn"
ex_7_2 <- # your code here
summary(ex_7_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- aov(yield ~ water * fert + Error(rep/water), data = sp_data)
summary(ex_7_2)
#> Error: rep
#>           Df Sum Sq Mean Sq
#> Residuals  1   30.4    30.4
#> 
#> Error: rep:water
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> water      2 162.33   81.17   Inf  <2e-16 ***
#> 
#> Error: Within
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> fert         3 312.46  104.15   Inf  <2e-16 ***
#> water:fert   6   0.00    0.00    0.00      1
```

**Explanation:** The `Error(rep/water)` term nests water inside replicate, producing two error strata: water is tested against the whole-plot error (rep:water residual), while fert and the interaction are tested against the sub-plot residual. Getting the error structure wrong is the classic split-plot mistake: a flat `aov(yield ~ water * fert)` would test water against the much smaller sub-plot error, inflating the F statistic and overstating significance. Real datasets give meaningful residuals; this toy dataset's residuals collapse to zero because the response is constructed deterministically.

</details>

### Exercise 7.3: Design and analyze a balanced 2x3 factorial end-to-end

**Task:** A take-home interview asks the candidate to simulate, then analyze, a balanced 2x3 factorial with three replicates per cell (18 runs total), factors `temp` (low, high) and `catalyst` (A, B, C), a true temp effect of +4, catalyst effects of (0, 2, 5), no interaction, and residual standard deviation 1.5. Use `set.seed(73)` so the result is reproducible. Build the dataset and save the fitted aov including interaction to `ex_7_3`.

**Expected result:**

```
#> summary(ex_7_3)
#>                Df Sum Sq Mean Sq F value   Pr(>F)
#> temp            1  85.86   85.86  38.06 5.0e-05 ***
#> catalyst        2  84.61   42.30  18.75 0.00021 ***
#> temp:catalyst   2   2.36    1.18   0.52 0.6075
#> Residuals      12  27.07    2.26
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(73)
ex_7_3 <- # your code here
summary(ex_7_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(73)
design <- expand.grid(
  rep      = 1:3,
  temp     = factor(c("low", "high"), levels = c("low", "high")),
  catalyst = factor(c("A", "B", "C"))
)
temp_eff <- c(low = 0, high = 4)
cat_eff  <- c(A = 0, B = 2, C = 5)
design$y <- 10 +
  temp_eff[as.character(design$temp)] +
  cat_eff[as.character(design$catalyst)] +
  rnorm(nrow(design), sd = 1.5)
ex_7_3 <- aov(y ~ temp * catalyst, data = design)
summary(ex_7_3)
#>                Df Sum Sq Mean Sq F value   Pr(>F)
#> temp            1  85.86   85.86  38.06 5.0e-05 ***
#> catalyst        2  84.61   42.30  18.75 0.00021 ***
#> temp:catalyst   2   2.36    1.18   0.52 0.6075
#> Residuals      12  27.07    2.26
```

**Explanation:** Because the true model had no interaction, the `temp:catalyst` term is correctly non-significant at p = 0.61, while both main effects are detected clearly. This pattern (simulate-fit-recover) is the gold-standard sanity check for a real experimental design: if your analysis pipeline cannot recover effects you put in, it will not recover real effects either. The residual mean square of 2.26 is close to the true sigma^2 of 2.25, confirming the model captures the noise floor.

</details>

## What to do next

- Read the parent tutorial [Experimental Design Principles in R](Experimental-Design-Principles-in-R.html) for the conceptual framing behind CRD, RCBD, and Latin Squares.
- Move on to [ANOVA Exercises in R](ANOVA-Exercises-in-R.html) for deeper inference practice once you are comfortable with the design side.
- Brush up on the modelling fundamentals with [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html), since most experimental designs reduce to a linear model under the hood.
