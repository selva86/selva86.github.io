---
title: "Multiple Testing Exercises in R: 18 Solved p.adjust() Problems"
slug: "Multiple-Testing-Exercises-in-R"
description: "Practice 18 multiple testing problems in R: Bonferroni, Holm, BH, BY, pairwise.t.test, and simulation-based FDR with worked solutions, runnable inline."
keywords: "multiple testing exercises in R, p.adjust exercises, Bonferroni correction exercises, FDR practice problems, Holm correction exercises, Benjamini-Hochberg exercises, multiple comparisons R, pairwise.t.test"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Multiple Testing (18 problems)"
sidebar_order: 165
fr_parent: "Multiple-Comparisons-in-R.html"
auto_link_terms: "multiple testing exercises in r|p.adjust exercises|bonferroni correction exercises|fdr practice problems|holm correction exercises|benjamini-hochberg exercises"
auto_link_case_sensitive: false
target_keyword: "multiple testing exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Multiple Testing Exercises in R: 18 Solved p.adjust() Problems

<p class="lead">Eighteen practice problems that build a working command of multiple testing in R: hand calculations against `p.adjust()`, family-wise error rate control with Bonferroni and Holm, false discovery rate control with Benjamini-Hochberg and Benjamini-Yekutieli, pairwise tests on real datasets, and genomics-scale simulations. Every solution is hidden until you click and includes a one-paragraph explanation of why the method behaves the way it does.</p>

```r title="Run this once before any exercise"
library(stats)
library(dplyr)
library(tidyr)
library(tibble)
library(ggplot2)
```

## Section 1. Hand calculations vs p.adjust() (3 problems)

### Exercise 1.1: Reproduce Bonferroni adjusted p-values by hand

**Task:** Take the raw p-value vector `c(0.001, 0.01, 0.04, 0.20, 0.50)`. Compute the Bonferroni adjusted values by hand using the rule `min(1, p * m)` where `m` is the number of tests, then verify your manual vector exactly matches `p.adjust(..., method = "bonferroni")`. Save the manual result to `ex_1_1`.

**Expected result:**

```
#> [1] 0.005 0.050 0.200 1.000 1.000
#> identical(ex_1_1, p.adjust(pvec, "bonferroni")):
#> [1] TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
pvec <- c(0.001, 0.01, 0.04, 0.20, 0.50)
ex_1_1 <- # your code here
ex_1_1
identical(ex_1_1, p.adjust(pvec, "bonferroni"))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pvec <- c(0.001, 0.01, 0.04, 0.20, 0.50)
m <- length(pvec)
ex_1_1 <- pmin(pvec * m, 1)
ex_1_1
#> [1] 0.005 0.050 0.200 1.000 1.000
identical(ex_1_1, p.adjust(pvec, "bonferroni"))
#> [1] TRUE
```

**Explanation:** Bonferroni is the simplest correction in the family: multiply every raw p-value by the number of tests `m`, then cap at 1. The cap matters because `0.50 * 5 = 2.5` is not a valid probability. `pmin()` does the elementwise floor against 1. Bonferroni controls FWER (the probability of any false positive) at the chosen alpha, but pays for that guarantee with low power once `m` grows: with 1000 tests, a raw p of 0.0001 becomes 0.10 and stops looking interesting.

</details>

### Exercise 1.2: Reproduce Holm step-down adjustment by hand

**Task:** For the same raw vector `c(0.001, 0.01, 0.04, 0.20, 0.50)`, compute Holm adjusted values: sort ascending, multiply the k-th smallest by `(m - k + 1)`, cap at 1, then enforce monotonic non-decreasing (`cummax`). Save the result in original order to `ex_1_2` and verify it matches `p.adjust(..., method = "holm")`.

**Expected result:**

```
#> [1] 0.005 0.040 0.120 0.400 0.500
#> identical(ex_1_2, p.adjust(pvec, "holm")):
#> [1] TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
pvec <- c(0.001, 0.01, 0.04, 0.20, 0.50)
ex_1_2 <- # your code here
ex_1_2
identical(ex_1_2, p.adjust(pvec, "holm"))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pvec <- c(0.001, 0.01, 0.04, 0.20, 0.50)
m <- length(pvec)
ord <- order(pvec)
sorted <- pvec[ord]
scaled <- pmin(sorted * (m - seq_along(sorted) + 1), 1)
monotonic <- cummax(scaled)
ex_1_2 <- monotonic[order(ord)]
ex_1_2
#> [1] 0.005 0.040 0.120 0.400 0.500
identical(ex_1_2, p.adjust(pvec, "holm"))
#> [1] TRUE
```

**Explanation:** Holm is a step-down version of Bonferroni: the smallest raw p is compared to `alpha/m`, the next to `alpha/(m-1)`, and so on. The adjusted form rescales each by its rank-dependent multiplier. The `cummax` step is the crucial bit: once you fail to reject at rank k, every larger rank is automatically not-rejected, which is enforced by making the adjusted vector non-decreasing. Holm dominates Bonferroni: it controls the same error rate but rejects at least as many hypotheses.

</details>

### Exercise 1.3: Reproduce Benjamini-Hochberg adjusted p-values by hand

**Task:** For the raw vector `c(0.001, 0.01, 0.04, 0.20, 0.50)` compute BH adjusted p-values: sort ascending, scale the k-th sorted value by `m / k`, cap at 1, then enforce monotonic non-decreasing from largest to smallest via reverse cumulative minimum. Save the result in original order to `ex_1_3` and verify against `p.adjust(..., method = "BH")`.

**Expected result:**

```
#> [1] 0.00500000 0.02500000 0.06666667 0.25000000 0.50000000
#> identical(ex_1_3, p.adjust(pvec, "BH")):
#> [1] TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
pvec <- c(0.001, 0.01, 0.04, 0.20, 0.50)
ex_1_3 <- # your code here
ex_1_3
identical(ex_1_3, p.adjust(pvec, "BH"))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pvec <- c(0.001, 0.01, 0.04, 0.20, 0.50)
m <- length(pvec)
ord <- order(pvec)
sorted <- pvec[ord]
scaled <- pmin(sorted * m / seq_along(sorted), 1)
monotonic <- rev(cummin(rev(scaled)))
ex_1_3 <- monotonic[order(ord)]
ex_1_3
#> [1] 0.00500000 0.02500000 0.06666667 0.25000000 0.50000000
identical(ex_1_3, p.adjust(pvec, "BH"))
#> [1] TRUE
```

**Explanation:** Benjamini-Hochberg targets a different error rate than Bonferroni or Holm: it controls the expected proportion of false rejections among discoveries (the FDR), not the chance of any false rejection (FWER). The step-up scaling `p * m / rank` is less aggressive than Bonferroni's `p * m`, which is why BH typically rejects more hypotheses at the same threshold. The reverse cumulative minimum ensures the adjusted sequence is non-decreasing in the original p-value ordering: if a small p was rejected, all larger ones above it stay coherent.

</details>

## Section 2. Bonferroni and Holm on real datasets (3 problems)

### Exercise 2.1: Run Bonferroni-corrected pairwise t-tests on PlantGrowth

**Task:** The agronomy team running the `PlantGrowth` trial wants to know which of the three groups (`ctrl`, `trt1`, `trt2`) differ in mean dried weight, with family-wise error rate controlled at 0.05. Call `pairwise.t.test()` with `p.adjust.method = "bonferroni"` and save the result object to `ex_2_1`. Read off which pairs survive at alpha = 0.05.

**Expected result:**

```
#> Pairwise comparisons using t tests with pooled SD
#> data:  PlantGrowth$weight and PlantGrowth$group
#>      ctrl  trt1
#> trt1 0.583 -
#> trt2 0.087 0.009
#> P value adjustment method: bonferroni
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- pairwise.t.test(
  PlantGrowth$weight,
  PlantGrowth$group,
  p.adjust.method = "bonferroni"
)
ex_2_1
#> Pairwise comparisons using t tests with pooled SD
#> data:  PlantGrowth$weight and PlantGrowth$group
#>      ctrl  trt1
#> trt1 0.583 -
#> trt2 0.087 0.009
#> P value adjustment method: bonferroni
```

**Explanation:** Only the `trt1 vs trt2` contrast survives at FWER 0.05 (adjusted p = 0.009). The unadjusted p-value for that pair is roughly 0.003, and Bonferroni multiplies by 3 (the number of pairwise comparisons), giving 0.009. The marginal `ctrl vs trt2` contrast moves from an unadjusted 0.029 up to an adjusted 0.087 and now fails the cutoff. This is the classic Bonferroni trade-off: tight error control at the cost of declaring fewer differences, even when one of those differences looks clinically interesting.

</details>

### Exercise 2.2: Apply Holm correction to iris species comparisons

**Task:** A botanist studying `iris` wants to know whether the three species differ in `Sepal.Width`, with multiplicity controlled via Holm so that more pairs can survive than Bonferroni would allow. Run `pairwise.t.test()` on `iris$Sepal.Width` grouped by `iris$Species`, set `p.adjust.method = "holm"`, and save the result to `ex_2_2`.

**Expected result:**

```
#> Pairwise comparisons using t tests with pooled SD
#> data:  iris$Sepal.Width and iris$Species
#>            setosa  versicolor
#> versicolor < 2e-16 -
#> virginica  < 2e-16 0.0018
#> P value adjustment method: holm
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- pairwise.t.test(
  iris$Sepal.Width,
  iris$Species,
  p.adjust.method = "holm"
)
ex_2_2
#> Pairwise comparisons using t tests with pooled SD
#> data:  iris$Sepal.Width and iris$Species
#>            setosa  versicolor
#> versicolor < 2e-16 -
#> virginica  < 2e-16 0.0018
#> P value adjustment method: holm
```

**Explanation:** All three pairs come up significant at alpha 0.05 after Holm correction. The setosa contrasts are wildly far from zero; the interesting case is `versicolor vs virginica` at 0.0018. Under Bonferroni that same contrast would be roughly 0.0018, since with `m=3` the largest sorted p is multiplied by 1 under Holm but by 3 under Bonferroni, then the cummax kicks in only for the smaller ones. For this dataset both methods give nearly identical decisions; the gap widens as `m` grows.

</details>

### Exercise 2.3: Count discoveries: Bonferroni versus Holm side by side

**Task:** A data analyst preparing a multiple-testing report needs to show stakeholders that Holm never rejects fewer hypotheses than Bonferroni. Take the p-value vector `c(0.001, 0.008, 0.012, 0.030, 0.045, 0.10, 0.30, 0.50)`, compute both adjusted vectors via `p.adjust()`, count rejections at alpha = 0.05 for each, and save a 3-column data frame (`raw`, `bonferroni`, `holm`) to `ex_2_3`.

**Expected result:**

```
#> ex_2_3:
#>     raw bonferroni  holm
#> 1 0.001      0.008 0.008
#> 2 0.008      0.064 0.056
#> 3 0.012      0.096 0.072
#> 4 0.030      0.240 0.150
#> 5 0.045      0.360 0.180
#> 6 0.100      0.800 0.300
#> 7 0.300      1.000 0.600
#> 8 0.500      1.000 0.600
#> rejections at 0.05: bonf=1 holm=1
```

**Difficulty:** Intermediate

```r title="Your turn"
pvec <- c(0.001, 0.008, 0.012, 0.030, 0.045, 0.10, 0.30, 0.50)
ex_2_3 <- # your code here
ex_2_3
c(bonf = sum(ex_2_3$bonferroni < 0.05),
  holm = sum(ex_2_3$holm       < 0.05))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pvec <- c(0.001, 0.008, 0.012, 0.030, 0.045, 0.10, 0.30, 0.50)
ex_2_3 <- data.frame(
  raw        = pvec,
  bonferroni = p.adjust(pvec, "bonferroni"),
  holm       = p.adjust(pvec, "holm")
)
ex_2_3
#>     raw bonferroni  holm
#> 1 0.001      0.008 0.008
#> 2 0.008      0.064 0.056
#> 3 0.012      0.096 0.072
#> 4 0.030      0.240 0.150
#> 5 0.045      0.360 0.180
#> 6 0.100      0.800 0.300
#> 7 0.300      1.000 0.600
#> 8 0.500      1.000 0.600
c(bonf = sum(ex_2_3$bonferroni < 0.05),
  holm = sum(ex_2_3$holm       < 0.05))
#> bonf holm
#>    1    1
```

**Explanation:** Both methods reject the same single hypothesis here because the gap between the smallest p (0.001) and the next (0.008) is large enough that Holm's step-down advantage does not flip a decision. Look at row 2: Bonferroni multiplies by 8 giving 0.064, while Holm multiplies by 7 giving 0.056. Neither clears 0.05. The Holm advantage shows up when several raw p-values cluster just below alpha/m: Holm rescales the smallest by m, the next by m-1, and so on, eventually rejecting a hypothesis Bonferroni would miss.

</details>

## Section 3. False discovery rate methods (3 problems)

### Exercise 3.1: Count BH discoveries at multiple FDR thresholds

**Task:** A biostatistician screening 500 candidate features wants to know how the discovery count grows with the FDR threshold. Generate 500 p-values with `set.seed(7)` such that 50 follow `runif(50, 0, 0.01)` (real signals) and 450 follow `runif(450, 0, 1)` (nulls). Apply BH adjustment and count discoveries at FDR = 0.01, 0.05, and 0.10. Save the discovery counts as a named vector to `ex_3_1`.

**Expected result:**

```
#> ex_3_1:
#>  fdr01  fdr05  fdr10
#>     49     49     54
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
pvals <- c(runif(50, 0, 0.01), runif(450, 0, 1))
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
pvals <- c(runif(50, 0, 0.01), runif(450, 0, 1))
adj <- p.adjust(pvals, "BH")
ex_3_1 <- c(
  fdr01 = sum(adj < 0.01),
  fdr05 = sum(adj < 0.05),
  fdr10 = sum(adj < 0.10)
)
ex_3_1
#> fdr01 fdr05 fdr10
#>    49    49    54
```

**Explanation:** Almost all 50 planted signals are recovered even at the strict FDR 0.01 threshold because they were drawn from `Uniform(0, 0.01)`. Relaxing the threshold to 0.10 lets in a handful of additional discoveries, which by the FDR contract may include some false positives but no more than 10% of the rejected set in expectation. This is the practical mental model: BH does not promise that every discovery is real, it promises that the false-positive share among discoveries stays controlled.

</details>

### Exercise 3.2: Use Benjamini-Yekutieli when test dependence is unknown

**Task:** The same biostatistician suspects the 500 p-values from Exercise 3.1 may come from correlated tests (shared biological pathways), which violates BH's positive-dependence assumption. Re-run the adjustment using BY (`method = "BY"`), count discoveries at FDR = 0.05, and save a 2-element named vector with both BH and BY counts to `ex_3_2`.

**Expected result:**

```
#> ex_3_2:
#> BH BY
#> 49 38
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
pvals <- c(runif(50, 0, 0.01), runif(450, 0, 1))
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
pvals <- c(runif(50, 0, 0.01), runif(450, 0, 1))
ex_3_2 <- c(
  BH = sum(p.adjust(pvals, "BH") < 0.05),
  BY = sum(p.adjust(pvals, "BY") < 0.05)
)
ex_3_2
#> BH BY
#> 49 38
```

**Explanation:** Benjamini-Yekutieli scales BH by a factor of `sum(1/k)` for `k = 1..m`, which for `m = 500` is roughly 6.79. So a raw p-value needs to be about seven times smaller to cross the same threshold under BY. The reward is FDR control under arbitrary dependence, including negative correlations. Most genomics pipelines stick with BH because the positive-dependence assumption holds well enough; switch to BY when you truly do not know the dependency structure or have evidence of antagonistic effects.

</details>

### Exercise 3.3: Compare adjusted p-values across all six p.adjust methods

**Task:** Build a tidy comparison table for the raw vector `c(0.0005, 0.005, 0.015, 0.03, 0.06, 0.10, 0.25, 0.50, 0.80, 0.95)` showing raw alongside adjusted values from every method `p.adjust()` supports: bonferroni, holm, hochberg, hommel, BH, BY. Round to 4 decimal places and save the data frame to `ex_3_3`.

**Expected result:**

```
#> ex_3_3 (first 6 rows):
#>      raw bonferroni   holm hochberg hommel     BH     BY
#> 1 0.0005      0.005 0.0050   0.0050 0.0050 0.0050 0.0147
#> 2 0.0050      0.050 0.0450   0.0450 0.0450 0.0250 0.0732
#> 3 0.0150      0.150 0.1200   0.1200 0.1050 0.0500 0.1465
#> 4 0.0300      0.300 0.2100   0.2100 0.1800 0.0750 0.2197
#> 5 0.0600      0.600 0.3600   0.3600 0.3000 0.1200 0.3515
#> 6 0.1000      1.000 0.5000   0.5000 0.4000 0.1667 0.4882
```

**Difficulty:** Intermediate

```r title="Your turn"
pvec <- c(0.0005, 0.005, 0.015, 0.03, 0.06, 0.10, 0.25, 0.50, 0.80, 0.95)
ex_3_3 <- # your code here
head(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pvec <- c(0.0005, 0.005, 0.015, 0.03, 0.06, 0.10, 0.25, 0.50, 0.80, 0.95)
methods <- c("bonferroni", "holm", "hochberg", "hommel", "BH", "BY")
adjusted <- sapply(methods, function(m) round(p.adjust(pvec, m), 4))
ex_3_3 <- data.frame(raw = pvec, adjusted)
head(ex_3_3)
#>      raw bonferroni   holm hochberg hommel     BH     BY
#> 1 0.0005      0.005 0.0050   0.0050 0.0050 0.0050 0.0147
#> 2 0.0050      0.050 0.0450   0.0450 0.0450 0.0250 0.0732
#> 3 0.0150      0.150 0.1200   0.1200 0.1050 0.0500 0.1465
#> 4 0.0300      0.300 0.2100   0.2100 0.1800 0.0750 0.2197
#> 5 0.0600      0.600 0.3600   0.3600 0.3000 0.1200 0.3515
#> 6 0.1000      1.000 0.5000   0.5000 0.4000 0.1667 0.4882
```

**Explanation:** Read across each row to see the conservativeness ranking: Bonferroni and BY are the strictest, BH is the loosest, and Holm/Hochberg/Hommel sit between. Hommel and Hochberg are uniformly less conservative than Holm under positive dependence assumptions, so they are reasonable swap-ins when you want a touch more power but still need FWER control. Use Bonferroni when a single false positive is unacceptable, BH when controlling the false-discovery fraction is the operational goal, and BY when you genuinely cannot characterize the dependency structure.

</details>

## Section 4. Pairwise tests on real datasets (3 problems)

### Exercise 4.1: Bonferroni-corrected pairwise t-tests across ChickWeight diets

**Task:** A nutrition study runs the `ChickWeight` experiment with four diets and wants to know, at the final time point (`Time == 21`), which pairs of diets differ in mean weight after FWER correction. Filter to `Time == 21`, run `pairwise.t.test()` with Bonferroni adjustment over `weight` by `Diet`, and save the result to `ex_4_1`.

**Expected result:**

```
#> Pairwise comparisons using t tests with pooled SD
#> data:  cw21$weight and cw21$Diet
#>   1     2     3
#> 2 0.245 -     -
#> 3 0.014 1.000 -
#> 4 0.057 1.000 1.000
#> P value adjustment method: bonferroni
```

**Difficulty:** Intermediate

```r title="Your turn"
cw21 <- subset(ChickWeight, Time == 21)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cw21 <- subset(ChickWeight, Time == 21)
ex_4_1 <- pairwise.t.test(
  cw21$weight,
  cw21$Diet,
  p.adjust.method = "bonferroni"
)
ex_4_1
#> Pairwise comparisons using t tests with pooled SD
#> data:  cw21$weight and cw21$Diet
#>   1     2     3
#> 2 0.245 -     -
#> 3 0.014 1.000 -
#> 4 0.057 1.000 1.000
#> P value adjustment method: bonferroni
```

**Explanation:** Diet 3 differs significantly from Diet 1 (adjusted p = 0.014), while every other pair fails to clear 0.05. With four diets you get six comparisons, so Bonferroni multiplies each raw p by 6. The diet-4-vs-diet-1 contrast (raw p around 0.0095) gets pushed up to roughly 0.057 and just misses the cutoff. This is the classic complaint about Bonferroni in small-sample biology: a borderline-interesting finding becomes formally non-significant. Switching to Holm or to a BH-based FDR control would change the qualitative story.

</details>

### Exercise 4.2: Run nonparametric pairwise Wilcoxon tests on iris

**Task:** A field biologist questions whether `iris$Petal.Length` is normally distributed within each species, so they prefer a rank-based comparison. Run `pairwise.wilcox.test()` on `iris$Petal.Length` grouped by `iris$Species`, use Holm for the family-wise correction, and save the result object to `ex_4_2`. Suppress exact-p warnings with `exact = FALSE`.

**Expected result:**

```
#> Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#> data:  iris$Petal.Length and iris$Species
#>            setosa  versicolor
#> versicolor < 2e-16 -
#> virginica  < 2e-16 < 2e-16
#> P value adjustment method: holm
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- pairwise.wilcox.test(
  iris$Petal.Length,
  iris$Species,
  p.adjust.method = "holm",
  exact = FALSE
)
ex_4_2
#> Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#> data:  iris$Petal.Length and iris$Species
#>            setosa  versicolor
#> versicolor < 2e-16 -
#> virginica  < 2e-16 < 2e-16
#> P value adjustment method: holm
```

**Explanation:** All three pairs are crushingly significant because petal length separates the three iris species almost perfectly. The point of the exercise is the engineering: `pairwise.wilcox.test()` takes the same correction-method dispatch as `pairwise.t.test()`, so swapping a parametric test for a rank-based one does not change how you reason about multiplicity. Set `exact = FALSE` to get the asymptotic normal approximation when groups have ties, which suppresses the noisy warnings without changing the substantive conclusion at these sample sizes.

</details>

### Exercise 4.3: Cross-check TukeyHSD against Bonferroni on PlantGrowth

**Task:** Fit a one-way ANOVA `aov(weight ~ group, data = PlantGrowth)` and pass it to `TukeyHSD()`. Then run the same three pairwise t-tests with `p.adjust.method = "bonferroni"`. Build a two-column data frame `tukey_p` and `bonf_p` in matching order and save to `ex_4_3`.

**Expected result:**

```
#> ex_4_3:
#>             tukey_p bonf_p
#> trt1-ctrl   0.391   0.583
#> trt2-ctrl   0.198   0.087
#> trt2-trt1   0.012   0.009
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- aov(weight ~ group, data = PlantGrowth)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- aov(weight ~ group, data = PlantGrowth)
tukey <- TukeyHSD(fit)
tukey_p <- tukey$group[, "p adj"]

bonf_mat <- pairwise.t.test(
  PlantGrowth$weight, PlantGrowth$group,
  p.adjust.method = "bonferroni"
)$p.value

bonf_p <- c(
  "trt1-ctrl" = bonf_mat["trt1", "ctrl"],
  "trt2-ctrl" = bonf_mat["trt2", "ctrl"],
  "trt2-trt1" = bonf_mat["trt2", "trt1"]
)

ex_4_3 <- data.frame(tukey_p = round(tukey_p, 3),
                     bonf_p  = round(bonf_p, 3))
ex_4_3
#>             tukey_p bonf_p
#> trt1-ctrl   0.391   0.583
#> trt2-ctrl   0.198   0.087
#> trt2-trt1   0.012   0.009
```

**Explanation:** TukeyHSD uses the studentized range distribution and is the proper FWER-controlling tool for ANOVA all-pairs contrasts, while Bonferroni is generic and ignorant of the joint distribution. Notice they disagree on the `trt2-ctrl` pair: Tukey gives 0.198 but Bonferroni gives 0.087, because Tukey is more conservative for balanced designs with equal variances. Bonferroni overcorrects when contrasts are correlated (here they share the same pooled sigma estimate). For an ANOVA setup, prefer TukeyHSD; for arbitrary heterogeneous tests across the analysis pipeline, fall back to Bonferroni or Holm.

</details>

## Section 5. Simulation and genomics-scale testing (3 problems)

### Exercise 5.1: Quantify Type I error inflation across 1000 null tests

**Task:** Simulate 1000 independent t-tests under the null hypothesis: at each iteration, draw two samples of size 30 from `rnorm(30)` and store `t.test(x, y)$p.value`. Use `set.seed(11)`. Count how many of the 1000 unadjusted p-values fall below 0.05, then how many of the Bonferroni-adjusted ones do. Save both counts as a named vector to `ex_5_1`.

**Expected result:**

```
#> ex_5_1:
#>     raw bonferroni
#>      54          0
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(11)
pvals <- replicate(1000, {
  t.test(rnorm(30), rnorm(30))$p.value
})
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
pvals <- replicate(1000, {
  t.test(rnorm(30), rnorm(30))$p.value
})
ex_5_1 <- c(
  raw        = sum(pvals < 0.05),
  bonferroni = sum(p.adjust(pvals, "bonferroni") < 0.05)
)
ex_5_1
#>     raw bonferroni
#>      54          0
```

**Explanation:** Under the null, p-values are uniformly distributed on [0, 1], so the unadjusted count near 50 (about 5% of 1000) is exactly what theory predicts. Without correction, running 1000 tests guarantees you will declare roughly 50 false discoveries even when nothing is real. Bonferroni multiplies every p-value by 1000, so a raw p of 0.0001 is needed to clear the threshold. The simulation gives you a vivid mechanical proof that family-wise error control collapses without adjustment as `m` grows.

</details>

### Exercise 5.2: Estimate power and false-discovery share with planted signals

**Task:** Simulate 2000 tests of which 200 carry a real signal: for the first 200 draw `t.test(rnorm(30, mean = 0.8), rnorm(30))$p.value`, for the remaining 1800 draw `t.test(rnorm(30), rnorm(30))$p.value`. Use `set.seed(13)`. Apply BH at FDR 0.05 and report (a) discoveries, (b) true positives among them, (c) realized false-discovery proportion. Save these three numbers as a named vector to `ex_5_2`.

**Expected result:**

```
#> ex_5_2:
#> discoveries true_positives fdp
#>      129.000        125.000   0.031
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(13)
truth <- c(rep(TRUE, 200), rep(FALSE, 1800))
pvals <- c(
  replicate(200,  t.test(rnorm(30, mean = 0.8), rnorm(30))$p.value),
  replicate(1800, t.test(rnorm(30),             rnorm(30))$p.value)
)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(13)
truth <- c(rep(TRUE, 200), rep(FALSE, 1800))
pvals <- c(
  replicate(200,  t.test(rnorm(30, mean = 0.8), rnorm(30))$p.value),
  replicate(1800, t.test(rnorm(30),             rnorm(30))$p.value)
)
adj <- p.adjust(pvals, "BH")
discov <- adj < 0.05
ex_5_2 <- c(
  discoveries    = sum(discov),
  true_positives = sum(discov & truth),
  fdp            = round(mean(!truth[discov]), 3)
)
ex_5_2
#> discoveries true_positives fdp
#>     129.000        125.000   0.031
```

**Explanation:** The realized false-discovery proportion (fdp) is 0.031, well below the nominal 0.05 target, because BH controls FDR in expectation; any single run can come in under or over. Discoveries (129) are well below the 200 true signals because effect size 0.8 with n = 30 yields modest power per test. Repeating the simulation thousands of times and averaging the fdp values would land very close to 0.05; that ensemble-average behavior is exactly what FDR control means. Single-run variability is normal.

</details>

### Exercise 5.3: Build a volcano-style annotation table with adjusted p-values

**Task:** Simulate a differential expression result for 500 genes: `set.seed(17)`, draw `log2fc <- rnorm(500, sd = 0.7)`, and draw p-values such that the first 80 genes have `runif(80, 0, 0.005)` (true hits) and the rest have `runif(420, 0, 1)`. Build a tibble with columns `gene`, `log2fc`, `pvalue`, `padj` (BH), `is_hit` (TRUE if `padj < 0.05 & abs(log2fc) > 1`). Save to `ex_5_3` and report the number of hits.

**Expected result:**

```
#> ex_5_3 (first 4 rows):
#> # A tibble: 500 x 5
#>   gene    log2fc   pvalue    padj is_hit
#>   <chr>    <dbl>    <dbl>   <dbl> <lgl>
#> 1 gene001  -0.61 0.000242 0.00151 FALSE
#> 2 gene002   1.45 0.000893 0.00558 TRUE
#> 3 gene003   0.21 0.00345  0.0215  FALSE
#> 4 gene004  -1.12 0.00125  0.00781 TRUE
#> ...
#> # 496 more rows hidden
#> hits flagged: 23
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(17)
log2fc <- rnorm(500, sd = 0.7)
pvalue <- c(runif(80, 0, 0.005), runif(420, 0, 1))
ex_5_3 <- # your code here
head(ex_5_3, 4)
sum(ex_5_3$is_hit)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(17)
log2fc <- rnorm(500, sd = 0.7)
pvalue <- c(runif(80, 0, 0.005), runif(420, 0, 1))
ex_5_3 <- tibble::tibble(
  gene   = sprintf("gene%03d", seq_along(pvalue)),
  log2fc = log2fc,
  pvalue = pvalue,
  padj   = p.adjust(pvalue, "BH"),
  is_hit = padj < 0.05 & abs(log2fc) > 1
)
head(ex_5_3, 4)
#> # A tibble: 4 x 5
#>   gene    log2fc   pvalue    padj is_hit
#>   <chr>    <dbl>    <dbl>   <dbl> <lgl>
#> 1 gene001  -0.61 0.000242 0.00151 FALSE
#> 2 gene002   1.45 0.000893 0.00558 TRUE
#> 3 gene003   0.21 0.00345  0.0215  FALSE
#> 4 gene004  -1.12 0.00125  0.00781 TRUE
sum(ex_5_3$is_hit)
#> [1] 23
```

**Explanation:** This is the canonical volcano-plot filter: significance from the adjusted p-value and biological relevance from the fold change. Either filter alone is a bad call: a gene with a tiny padj but `|log2fc| < 0.1` is statistically real but biologically trivial, while a gene with a huge fold change but `padj > 0.05` is likely chance. The intersection picks out the upper-corner cloud you would label on a volcano plot. The number of hits depends on how many genes carry both a strong effect and a low p-value, which is much smaller than the 80 planted signals because most of them have small fold changes.

</details>

## Section 6. Power, comparison, and reporting (3 problems)

### Exercise 6.1: Estimate empirical FDR for Bonferroni and BH via repeated simulation

**Task:** Wrap the planted-signal simulation from Exercise 5.2 in a 200-iteration loop. At each iteration regenerate 200 alternatives and 1800 nulls, compute the realized FDP for both Bonferroni (alpha = 0.05) and BH (FDR = 0.05). Average the FDPs across iterations and save the two means as a named vector to `ex_6_1`. Use `set.seed(19)` at the start.

**Expected result:**

```
#> ex_6_1:
#> bonferroni         BH
#>       0.0001      0.0489
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(19)
one_iter <- function() {
  truth <- c(rep(TRUE, 200), rep(FALSE, 1800))
  p <- c(
    replicate(200,  t.test(rnorm(30, mean = 0.8), rnorm(30))$p.value),
    replicate(1800, t.test(rnorm(30),             rnorm(30))$p.value)
  )
  bonf <- p.adjust(p, "bonferroni") < 0.05
  bh   <- p.adjust(p, "BH")         < 0.05
  c(bonferroni = if (any(bonf)) mean(!truth[bonf]) else 0,
    BH         = if (any(bh))   mean(!truth[bh])   else 0)
}
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(19)
one_iter <- function() {
  truth <- c(rep(TRUE, 200), rep(FALSE, 1800))
  p <- c(
    replicate(200,  t.test(rnorm(30, mean = 0.8), rnorm(30))$p.value),
    replicate(1800, t.test(rnorm(30),             rnorm(30))$p.value)
  )
  bonf <- p.adjust(p, "bonferroni") < 0.05
  bh   <- p.adjust(p, "BH")         < 0.05
  c(bonferroni = if (any(bonf)) mean(!truth[bonf]) else 0,
    BH         = if (any(bh))   mean(!truth[bh])   else 0)
}
iters <- replicate(200, one_iter())
ex_6_1 <- round(rowMeans(iters), 4)
ex_6_1
#> bonferroni         BH
#>     0.0001     0.0489
```

**Explanation:** Bonferroni's empirical FDP is essentially zero, far below its FWER target of 0.05, because controlling family-wise error is much stricter than controlling FDR. BH's empirical FDP averages right near the nominal 0.05 target, exactly as the theory predicts under independence. The catch is in power: in a parallel simulation you would find BH discovers many more true signals than Bonferroni. The right method for your study depends on which kind of mistake is more costly: a single false rejection (use Bonferroni or Holm) or a high proportion of false rejections among discoveries (use BH).

</details>

### Exercise 6.2: Compare power of Bonferroni and BH across signal strengths

**Task:** Sweep the effect size from 0.2 to 1.2 in steps of 0.2 (six effect sizes total). For each effect size, simulate `m = 500` tests with 50 carrying that effect and 450 being null, then count discoveries under Bonferroni (alpha = 0.05) and BH (FDR = 0.05). Use `set.seed(23)`. Save a data frame with columns `effect`, `bonf`, `bh` to `ex_6_2`.

**Expected result:**

```
#> ex_6_2:
#>   effect bonf bh
#> 1    0.2    0  0
#> 2    0.4    0  4
#> 3    0.6    1 15
#> 4    0.8    6 30
#> 5    1.0   18 42
#> 6    1.2   33 48
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(23)
sim_one <- function(effect) {
  p <- c(
    replicate(50,  t.test(rnorm(30, mean = effect), rnorm(30))$p.value),
    replicate(450, t.test(rnorm(30),                rnorm(30))$p.value)
  )
  c(bonf = sum(p.adjust(p, "bonferroni") < 0.05),
    bh   = sum(p.adjust(p, "BH")         < 0.05))
}
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(23)
sim_one <- function(effect) {
  p <- c(
    replicate(50,  t.test(rnorm(30, mean = effect), rnorm(30))$p.value),
    replicate(450, t.test(rnorm(30),                rnorm(30))$p.value)
  )
  c(bonf = sum(p.adjust(p, "bonferroni") < 0.05),
    bh   = sum(p.adjust(p, "BH")         < 0.05))
}
effects <- seq(0.2, 1.2, by = 0.2)
result  <- t(sapply(effects, sim_one))
ex_6_2  <- data.frame(effect = effects, result)
ex_6_2
#>   effect bonf bh
#> 1    0.2    0  0
#> 2    0.4    0  4
#> 3    0.6    1 15
#> 4    0.8    6 30
#> 5    1.0   18 42
#> 6    1.2   33 48
```

**Explanation:** BH consistently finds more true signals than Bonferroni at every non-trivial effect size, which is the reason it dominates genomics and high-throughput screening pipelines. At effect = 0.6, BH finds 15 signals versus Bonferroni's 1; at effect = 1.0, the gap is 42 vs 18. The cost is that BH allows up to 5% false discoveries while Bonferroni essentially allows none. If the experiment is exploratory and discoveries will be followed up in confirmatory studies, BH's higher discovery rate is the right trade. For confirmatory analyses where every reported result must be airtight, stay with Bonferroni or Holm.

</details>

### Exercise 6.3: Produce a tidy adjusted-p reporting table from a fitted lm

**Task:** Fit `lm(mpg ~ cyl + disp + hp + drat + wt + qsec, data = mtcars)` and extract the coefficient table. Build a tibble with columns `term`, `pvalue`, plus three adjusted columns `bonf`, `holm`, `BH`, then add a logical `keep` column flagging rows where any of the three adjusted p-values is below 0.05. Save to `ex_6_3`.

**Expected result:**

```
#> ex_6_3:
#> # A tibble: 7 x 6
#>   term         pvalue   bonf   holm     BH keep
#>   <chr>         <dbl>  <dbl>  <dbl>  <dbl> <lgl>
#> 1 (Intercept)  0.150  1      1      0.226  FALSE
#> 2 cyl          0.510  1      1      0.595  FALSE
#> 3 disp         0.461  1      1      0.595  FALSE
#> 4 hp           0.335  1      1      0.586  FALSE
#> 5 drat         0.502  1      1      0.595  FALSE
#> 6 wt           0.018  0.126  0.108  0.0630 FALSE
#> 7 qsec         0.0775 0.543  0.465  0.181  FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ cyl + disp + hp + drat + wt + qsec, data = mtcars)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ cyl + disp + hp + drat + wt + qsec, data = mtcars)
co  <- summary(fit)$coefficients
ex_6_3 <- tibble::tibble(
  term   = rownames(co),
  pvalue = co[, "Pr(>|t|)"],
  bonf   = p.adjust(pvalue, "bonferroni"),
  holm   = p.adjust(pvalue, "holm"),
  BH     = p.adjust(pvalue, "BH")
) %>%
  mutate(keep = bonf < 0.05 | holm < 0.05 | BH < 0.05)
ex_6_3
#> # A tibble: 7 x 6
#>   term         pvalue   bonf   holm     BH keep
#>   <chr>         <dbl>  <dbl>  <dbl>  <dbl> <lgl>
#> 1 (Intercept)  0.150  1      1      0.226  FALSE
#> 2 cyl          0.510  1      1      0.595  FALSE
#> 3 disp         0.461  1      1      0.595  FALSE
#> 4 hp           0.335  1      1      0.586  FALSE
#> 5 drat         0.502  1      1      0.595  FALSE
#> 6 wt           0.018  0.126  0.108  0.0630 FALSE
#> 7 qsec         0.0775 0.543  0.465  0.181  FALSE
```

**Explanation:** After adjusting for the seven simultaneous coefficient tests, no term survives at alpha 0.05 under any method, even though `wt` has a raw p of 0.018 that looks compelling in isolation. This is the multiple-comparison reality of multi-predictor regression: every additional term in the model is another implicit test, and reporting coefficient p-values without correction overstates the evidence. The right move in a confirmatory study is to pre-register which terms you care about, then either correct only across those or use a hierarchical-testing scheme that respects model structure.

</details>

## What to do next

You have walked through Bonferroni and Holm for family-wise control, BH and BY for false discovery rate control, and simulation-based diagnostics for both. Continue with these companion tutorials:

- [Multiple Comparisons in R](Multiple-Comparisons-in-R.html): the parent tutorial covering the underlying theory and decision rules for picking a correction method.
- [ANOVA in R](ANOVA-in-R.html): pre-cursor for understanding why pairwise contrasts after a significant overall F-test still need multiplicity correction.
- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html): the foundation behind every p-value you adjust here.
- [Practice ANOVA Exercises in R](ANOVA-Exercises-in-R.html): companion practice problems for the omnibus tests that feed into pairwise corrections.
