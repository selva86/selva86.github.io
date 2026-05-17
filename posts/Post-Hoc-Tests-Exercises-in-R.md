---
title: "Post-Hoc Tests Exercises in R: 18 Tukey & Bonferroni Problems"
slug: "Post-Hoc-Tests-Exercises-in-R"
description: "Practice 18 post-hoc tests exercises in R: Tukey HSD, Bonferroni, Holm, p.adjust, two-way interactions, and Kruskal-Wallis follow-ups, with worked solutions."
keywords: "post-hoc tests exercises in R, Tukey HSD practice, Bonferroni correction R, Holm correction R, pairwise.t.test, multiple comparisons exercises, TukeyHSD, p.adjust exercises, post-hoc practice problems"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Post-Hoc Tests Exercises"
sidebar_order: 165
fr_parent: "Post-Hoc-Tests-After-ANOVA.html"
auto_link_terms: "post-hoc tests exercises|tukey hsd practice|bonferroni correction practice|pairwise comparisons practice|multiple comparisons exercises"
auto_link_case_sensitive: false
target_keyword: "post-hoc tests exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Post-Hoc Tests Exercises in R: 18 Tukey & Bonferroni Problems

<p class="lead">Eighteen post-hoc tests exercises in R that take a significant ANOVA verdict and turn it into specific pairwise comparisons. You will use Tukey HSD, Bonferroni, Holm, p.adjust, two-way interaction follow-ups, and Kruskal-Wallis nonparametric pairs on built-in datasets. Full solutions are hidden behind a click so the practice stays real.</p>

```r title="Run this once before any exercise"
# Base R + stats functions used throughout this hub
library(stats)
options(width = 100, digits = 4)
```

## Section 1. One-way ANOVA follow-ups with Tukey HSD (4 problems)

### Exercise 1.1: Run TukeyHSD on PlantGrowth weight by group

**Task:** A horticulture lab ran a one-way ANOVA on the built-in `PlantGrowth` dataset comparing `weight` across three groups (ctrl, trt1, trt2). The omnibus F is significant at 0.0159; the lab now needs pairwise verdicts. Fit `aov()`, pass the fit to `TukeyHSD()` to get all three pairwise comparisons with family-wise adjusted p-values, and save the TukeyHSD object to `ex_1_1`.

**Expected result:**

```
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = weight ~ group, data = PlantGrowth)
#>
#> $group
#>             diff    lwr    upr  p adj
#> trt1-ctrl -0.371 -1.062  0.320 0.3909
#> trt2-ctrl  0.494 -0.197  1.185 0.1980
#> trt2-trt1  0.865  0.174  1.556 0.0120
```

**Difficulty:** Beginner

[HINTS]
A significant omnibus result only says at least one group differs; you need a follow-up that compares every pair while holding the overall error rate in check.
Fit the model with `aov(weight ~ group, data = PlantGrowth)`, then pass that fit straight into `TukeyHSD()`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_pg <- aov(weight ~ group, data = PlantGrowth)
ex_1_1 <- TukeyHSD(fit_pg)
ex_1_1
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = weight ~ group, data = PlantGrowth)
#>
#> $group
#>             diff    lwr    upr  p adj
#> trt1-ctrl -0.371 -1.062  0.320 0.3909
#> trt2-ctrl  0.494 -0.197  1.185 0.1980
#> trt2-trt1  0.865  0.174  1.556 0.0120
```

**Explanation:** `TukeyHSD()` consumes an `aov` fit and returns a list keyed by each factor in the model. Each row is one pairwise difference with a Tukey-adjusted p-value, computed from the studentized range distribution. The adjustment is sharper than Bonferroni for all-pairwise comparisons because it knows the comparisons share a residual variance. Only trt2-trt1 survives at the 5% family-wise level.

</details>

### Exercise 1.2: TukeyHSD on ChickWeight diets at day 21

**Task:** `ChickWeight` records chick weight under four diets across multiple time points. Filter to `Time == 21` (the final measurement), then run a one-way ANOVA of `weight` by `Diet`, then apply `TukeyHSD()` to identify which diet pairs differ at the end of the experiment. Save the TukeyHSD object to `ex_1_2`.

**Expected result:**

```
#> $Diet
#>       diff      lwr     upr   p adj
#> 2-1  36.95   -32.83 106.74 0.4844
#> 3-1  92.55    22.77 162.33 0.0046
#> 4-1  60.81    -9.32 130.94 0.1109
#> 3-2  55.60   -19.34 130.55 0.2128
#> 4-2  23.86   -51.42  99.13 0.8312
#> 4-3 -31.74  -107.01  43.52 0.6826
```

**Difficulty:** Intermediate

[HINTS]
Restrict the data to the final time point first, then compare the diet means pairwise on that slice only.
Build the subset with `subset(ChickWeight, Time == 21)`, fit `aov(weight ~ Diet, ...)`, then call `TukeyHSD()` on the fit.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2$Diet
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
day21 <- subset(ChickWeight, Time == 21)
fit_chick <- aov(weight ~ Diet, data = day21)
ex_1_2 <- TukeyHSD(fit_chick)
ex_1_2$Diet
#>       diff      lwr     upr   p adj
#> 2-1  36.95   -32.83 106.74 0.4844
#> 3-1  92.55    22.77 162.33 0.0046
#> 4-1  60.81    -9.32 130.94 0.1109
#> 3-2  55.60   -19.34 130.55 0.2128
#> 4-2  23.86   -51.42  99.13 0.8312
#> 4-3 -31.74  -107.01  43.52 0.6826
```

**Explanation:** Only Diet 3 versus Diet 1 clears the family-wise 5% bar at day 21. Diet 4 versus Diet 1 looks promising on the raw difference (60.8 g) but the CI crosses zero once you spread the alpha across six comparisons. This is the classic Tukey lesson: large raw effects can fail post-hoc when the family of tests is broad. A common mistake is to run six separate t-tests at α = 0.05 and pick winners; that inflates Type I error to roughly 26%.

</details>

### Exercise 1.3: Filter TukeyHSD output to significant pairs only

**Task:** The lab director only cares about pairwise differences that survive Tukey adjustment at α = 0.05. From the TukeyHSD object created in Exercise 1.2, extract the `$Diet` matrix and filter to rows where the adjusted p-value column is strictly below 0.05. Save the filtered matrix to `ex_1_3` so the report writer can paste it directly into the appendix.

**Expected result:**

```
#>      diff   lwr    upr  p adj
#> 3-1 92.55 22.77 162.33 0.0046
```

**Difficulty:** Intermediate

[HINTS]
The Tukey result is just a matrix of rows, so keep only the rows whose adjusted p-value clears your threshold.
Pull out `ex_1_2$Diet`, then index rows where the `"p adj"` column is below 0.05, passing `drop = FALSE` to keep the matrix shape.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diet_mat <- ex_1_2$Diet
ex_1_3 <- diet_mat[diet_mat[, "p adj"] < 0.05, , drop = FALSE]
ex_1_3
#>      diff   lwr    upr  p adj
#> 3-1 92.55 22.77 162.33 0.0046
```

**Explanation:** The TukeyHSD output is a list of plain matrices, so subscripting works the standard way. The `drop = FALSE` argument is the subtle bit: without it, a single-row filter collapses to a numeric vector and loses the row name, breaking any downstream table-building code. This idiom matters whenever you slice a matrix by a condition that might return one row. An alternative for tidyverse users is to coerce with `as.data.frame()` and use `dplyr::filter()`.

</details>

### Exercise 1.4: Plot the Tukey HSD confidence intervals

**Task:** A reviewer wants a visual showing which Tukey HSD pairwise differences cross zero (not significant) versus which sit entirely above or below zero. Take the TukeyHSD object from Exercise 1.1 and call `plot()` on it directly to produce the family-wise CI plot. Capture the function call so the figure is reproducible and save the assignment to `ex_1_4`.

**Expected result:**

```
# Horizontal CI plot, one line per pairwise comparison.
# x-axis: difference in means; vertical reference line at 0.
# CIs that do not cross 0 indicate a significant pair (here: trt2-trt1).
# Title: "95% family-wise confidence level"
```

**Difficulty:** Intermediate

[HINTS]
The toolkit already knows how to draw the family-wise confidence intervals for a Tukey result; you just need to ask for the picture.
Call `plot()` directly on `ex_1_1` (add `las = 1` for readable axis labels) and assign that call to `ex_1_4`.

```r title="Your turn"
ex_1_4 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- plot(ex_1_1, las = 1)
#> [Plot rendered: 95% family-wise CIs for the three PlantGrowth pairs.
#>  trt2-trt1 sits to the right of zero; the other two cross zero.]
```

**Explanation:** Calling `plot()` on a `TukeyHSD` object dispatches to `plot.TukeyHSD`, which draws horizontal CIs with a reference line at zero. The `las = 1` argument flips axis labels horizontal so they are readable. This visual is more honest than a p-value table because the eye sees both effect size and uncertainty. A common mistake is to use `boxplot()` instead, which shows distributions but hides the Tukey-adjusted family-wise interval.

</details>

## Section 2. Bonferroni and Holm via pairwise.t.test (3 problems)

### Exercise 2.1: Bonferroni-adjusted pairwise t-tests on PlantGrowth

**Task:** Run `pairwise.t.test()` on `PlantGrowth$weight` versus `PlantGrowth$group` with `p.adjust.method = "bonferroni"`. Bonferroni multiplies each raw p-value by the number of comparisons (here three pairs), which is the most conservative classical correction. Save the result object to `ex_2_1` so you can compare it against Tukey later.

**Expected result:**

```
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.583 -
#> trt2 0.263 0.013
#>
#> P value adjustment method: bonferroni
```

**Difficulty:** Beginner

[HINTS]
Instead of an all-pairs procedure tied to the ANOVA, run every pairwise t-test and apply the most conservative classical correction.
Use `pairwise.t.test()` on `PlantGrowth$weight` and `PlantGrowth$group` with `p.adjust.method = "bonferroni"`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- pairwise.t.test(PlantGrowth$weight, PlantGrowth$group,
                          p.adjust.method = "bonferroni")
ex_2_1
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.583 -
#> trt2 0.263 0.013
#>
#> P value adjustment method: bonferroni
```

**Explanation:** Bonferroni controls family-wise error by multiplying every raw p-value by $m$, the number of comparisons. With three pairs and a raw trt2-trt1 p of about 0.004, the Bonferroni-adjusted value is roughly 0.013, still significant. Bonferroni is simple and works for any test family, not just ANOVA pairs. Its weakness is power: when comparisons are correlated (as ANOVA pairs are, sharing a pooled SD), Bonferroni overcorrects and Tukey or Holm beats it.

</details>

### Exercise 2.2: Holm correction and compare to Bonferroni

**Task:** Holm is uniformly more powerful than Bonferroni while still controlling family-wise error. Run `pairwise.t.test()` on `PlantGrowth$weight` by `group` with `p.adjust.method = "holm"` and save the result to `ex_2_2`. Compare the adjusted p-value matrix against the Bonferroni output from Exercise 2.1: which p-values shrink and why?

**Expected result:**

```
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.194 -
#> trt2 0.175 0.013
#>
#> P value adjustment method: holm
```

**Difficulty:** Intermediate

[HINTS]
Switch to the step-down correction that keeps family-wise control but recovers more power than a flat multiplier.
Use the same `pairwise.t.test()` call as before, but set `p.adjust.method = "holm"`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- pairwise.t.test(PlantGrowth$weight, PlantGrowth$group,
                          p.adjust.method = "holm")
ex_2_2
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.194 -
#> trt2 0.175 0.013
#>
#> P value adjustment method: holm
```

**Explanation:** Holm sorts raw p-values from smallest to largest and multiplies the $i$-th by $m - i + 1$ instead of by $m$. The smallest raw p still gets multiplied by $m$ (so trt2-trt1 stays at 0.013), but later ones are multiplied by smaller integers, so they shrink. Net effect: the smallest p is unchanged, but middle and large p-values are less harshly penalized than Bonferroni. Holm is the default safe choice when you want FWER control without giving up power.

</details>

### Exercise 2.3: Apply p.adjust to a raw p-value vector with three methods

**Task:** A collaborating statistician hands you raw p-values `c(0.001, 0.012, 0.034, 0.041, 0.048)` from five planned contrasts in a separate experiment. Apply `p.adjust()` with three methods (bonferroni, holm, BH) to the same vector and return a data frame with columns `raw`, `bonferroni`, `holm`, and `bh`. Save the data frame to `ex_2_3`.

**Expected result:**

```
#>     raw bonferroni  holm     bh
#> 1 0.001      0.005 0.005 0.0050
#> 2 0.012      0.060 0.048 0.0300
#> 3 0.034      0.170 0.102 0.0567
#> 4 0.041      0.205 0.102 0.0567
#> 5 0.048      0.240 0.102 0.0600
```

**Difficulty:** Advanced

[HINTS]
Take the single raw p-value vector and run it through three different corrections, then collect the results side by side.
Call `p.adjust()` three times on the vector with `method` set to `"bonferroni"`, `"holm"`, and `"BH"`, and assemble the columns with `data.frame()`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c(0.001, 0.012, 0.034, 0.041, 0.048)
ex_2_3 <- data.frame(
  raw        = raw,
  bonferroni = p.adjust(raw, method = "bonferroni"),
  holm       = p.adjust(raw, method = "holm"),
  bh         = p.adjust(raw, method = "BH")
)
ex_2_3
#>     raw bonferroni  holm     bh
#> 1 0.001      0.005 0.005 0.0050
#> 2 0.012      0.060 0.048 0.0300
#> 3 0.034      0.170 0.102 0.0567
#> 4 0.041      0.205 0.102 0.0567
#> 5 0.048      0.240 0.102 0.0600
```

**Explanation:** Three different goals, three different answers. Bonferroni and Holm both control FWER (probability of any false positive); BH controls FDR (expected fraction of false positives among rejections). FWER is right when even one false claim is costly (drug approval); FDR is right when you screen many hypotheses and accept a small share of misses (genomics, A/B test dashboards). Holm dominates Bonferroni on power for FWER, and BH is dramatically less conservative when you have many tests.

</details>

## Section 3. Reading Tukey output: CIs, raw p-values, and FWER (3 problems)

### Exercise 3.1: Find the narrowest Tukey confidence interval

**Task:** Among the three TukeyHSD pairwise CIs for `PlantGrowth` (object from Exercise 1.1), find the row with the narrowest confidence interval width (upper minus lower). Narrow CIs mean the mean difference is estimated with the most precision. Return a named numeric vector with the pair name and the width, and save to `ex_3_1`.

**Expected result:**

```
#> trt1-ctrl 
#>     1.382
```

**Difficulty:** Intermediate

[HINTS]
Interval width is the upper bound minus the lower bound; find the comparison with the smallest such span.
From `ex_1_1$group`, subtract the `"lwr"` column from the `"upr"` column, then use `which.min()` and `setNames()` to label the result.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mat <- ex_1_1$group
widths <- mat[, "upr"] - mat[, "lwr"]
narrowest <- which.min(widths)
ex_3_1 <- setNames(round(widths[narrowest], 3), rownames(mat)[narrowest])
ex_3_1
#> trt1-ctrl 
#>     1.382
```

**Explanation:** All three pairs use the same residual SD and sample sizes in this balanced design, so the widths are essentially identical (around 1.382). In unbalanced designs the widths differ because each pair uses its own pair-specific standard error scaled by the studentized range critical value. A common mistake is to assume the narrowest CI must contain the smallest p-value, but that is only true when the point estimates differ by similar amounts; precision and effect size are separate axes.

</details>

### Exercise 3.2: Recover unadjusted p-values and compare to Tukey

**Task:** Tukey reports adjusted p-values, but sometimes you want the underlying raw t-test p-values to see how much the family-wise correction actually inflated them. Run `pairwise.t.test()` on `PlantGrowth$weight` by `group` with `p.adjust.method = "none"` and save the matrix to `ex_3_2`. Eyeball how each raw value compares to the Tukey adjusted value from Exercise 1.1.

**Expected result:**

```
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.194 -
#> trt2 0.088 0.004
#>
#> P value adjustment method: none
```

**Difficulty:** Advanced

[HINTS]
To see how much the correction inflated things, you need the underlying p-values with no adjustment applied at all.
Run `pairwise.t.test()` on `PlantGrowth$weight` by `group` with `p.adjust.method = "none"`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- pairwise.t.test(PlantGrowth$weight, PlantGrowth$group,
                          p.adjust.method = "none")
ex_3_2
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.194 -
#> trt2 0.088 0.004
#>
#> P value adjustment method: none
```

**Explanation:** Raw trt2-trt1 is 0.004; Tukey adjusts it to 0.012, Bonferroni to 0.013, Holm to 0.013. The trt2-ctrl raw p (0.088) is interesting: it looks borderline raw but is clearly not significant after any family-wise adjustment. Showing raw and adjusted side by side in a report is honest practice; never publish raw post-hoc p-values without their corrected partners, since a reviewer will assume FWER control is missing.

</details>

### Exercise 3.3: Compute family-wise error rate inflation across k tests

**Task:** For $k$ independent comparisons each tested at α = 0.05, the chance of at least one false positive is $1 - (1 - 0.05)^k$. Compute this family-wise error rate (FWER) for $k$ from 1 to 10 and return a data frame with columns `k` and `fwer`. Save the table to `ex_3_3`. This is the curve that justifies post-hoc correction in the first place.

**Expected result:**

```
#>     k   fwer
#> 1   1 0.0500
#> 2   2 0.0975
#> 3   3 0.1426
#> 4   4 0.1855
#> 5   5 0.2262
#> 6   6 0.2649
#> 7   7 0.3017
#> 8   8 0.3366
#> 9   9 0.3698
#> 10 10 0.4013
```

**Difficulty:** Intermediate

[HINTS]
The chance of at least one false positive is one minus the chance of getting every test right, where each test is right with probability 0.95.
Compute `1 - (1 - 0.05)^k` over `k <- 1:10`, then wrap `k` and the result into `data.frame()`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
k <- 1:10
ex_3_3 <- data.frame(k = k, fwer = round(1 - (1 - 0.05)^k, 4))
ex_3_3
#>     k   fwer
#> 1   1 0.0500
#> 2   2 0.0975
#> 3   3 0.1426
#> ...
#> 10 10 0.4013
```

**Explanation:** At $k = 10$ the chance of at least one Type I error is already 40%, which is why running an uncorrected pairwise scan of even modest size is dangerous. The formula assumes independence, which post-hoc ANOVA comparisons are not, but it is a useful upper bound. The takeaway is that the family-wise rate grows fast even for modest $k$, so methods like Bonferroni, Holm, and Tukey are not optional ceremony; they are the price of doing many comparisons honestly.

</details>

## Section 4. Two-way ANOVA and interaction post-hoc (3 problems)

### Exercise 4.1: TukeyHSD on a two-way ANOVA of ToothGrowth

**Task:** `ToothGrowth` has tooth length (`len`) as a function of supplement type (`supp`) and `dose`. Convert `dose` to a factor, fit `aov(len ~ supp * dose, data = ToothGrowth)`, then run `TukeyHSD()` on the fit. The result will have `$supp`, `$dose`, and `$"supp:dose"` components. Save the full TukeyHSD object to `ex_4_1`.

**Expected result:**

```
#> $supp
#>          diff    lwr    upr  p adj
#> VC-OJ  -3.700 -5.580 -1.820 0.0002
#>
#> $dose
#>          diff   lwr   upr  p adj
#> 1-0.5   9.130  6.36 11.90 0.0000
#> 2-0.5  15.495 12.72 18.27 0.0000
#> 2-1     6.365  3.59  9.14 0.0000
#>
#> $`supp:dose`
#>                  diff     lwr     upr  p adj
#> ...                                          # 15 pairwise rows
```

**Difficulty:** Intermediate

[HINTS]
A two-way model needs each predictor treated as a grouping factor, not a number, so the post-hoc step can compare level means.
Coerce `dose` with `as.factor()`, fit `aov(len ~ supp * dose, ...)`, then call `TukeyHSD()` on the fit.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1$dose
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tg <- ToothGrowth
tg$dose <- as.factor(tg$dose)
fit_tg <- aov(len ~ supp * dose, data = tg)
ex_4_1 <- TukeyHSD(fit_tg)
ex_4_1$dose
#>          diff   lwr   upr  p adj
#> 1-0.5   9.130  6.36 11.90 0.0000
#> 2-0.5  15.495 12.72 18.27 0.0000
#> 2-1     6.365  3.59  9.14 0.0000
```

**Explanation:** Treating `dose` as numeric would let `aov()` fit a linear trend instead of estimating a mean per dose level, which `TukeyHSD()` cannot then partition into pairwise contrasts. Converting to a factor is the required step. The `supp:dose` interaction matrix has 15 rows (6 choose 2 across the six supp x dose cells); some are within-supp dose comparisons, some are between-supp at the same dose, and some are cross-cell. Reading them needs care because not every row answers a clinically interesting question.

</details>

### Exercise 4.2: Simple-effects Tukey within one supplement type

**Task:** When the interaction is significant, the cleanest follow-up is often to split the data by one factor and run Tukey within each level of the other. Subset `ToothGrowth` to `supp == "VC"`, fit `aov(len ~ as.factor(dose), data = vc_only)`, run `TukeyHSD()`, and save the dose comparisons within the VC-only subset to `ex_4_2`.

**Expected result:**

```
#> $`as.factor(dose)`
#>          diff    lwr    upr  p adj
#> 1-0.5   8.79   5.62  11.96 0.0000
#> 2-0.5  18.16  14.99  21.33 0.0000
#> 2-1     9.37   6.20  12.54 0.0000
```

**Difficulty:** Advanced

[HINTS]
When an interaction is significant, hold one factor fixed and run the post-hoc comparison within that single slice of the data.
Build `subset(ToothGrowth, supp == "VC")`, fit `aov(len ~ as.factor(dose), ...)` on it, then run `TukeyHSD()`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vc_only <- subset(ToothGrowth, supp == "VC")
fit_vc <- aov(len ~ as.factor(dose), data = vc_only)
ex_4_2 <- TukeyHSD(fit_vc)
ex_4_2
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> $`as.factor(dose)`
#>          diff    lwr    upr  p adj
#> 1-0.5   8.79   5.62  11.96 0.0000
#> 2-0.5  18.16  14.99  21.33 0.0000
#> 2-1     9.37   6.20  12.54 0.0000
```

**Explanation:** Subsetting first and then running a one-way Tukey inside each supplement is one of two defensible ways to interrogate a significant interaction. The other is to use the full `supp:dose` matrix from Exercise 4.1 and filter to the rows you care about. The subset approach uses the within-supplement residual variance (smaller pool) so its CIs are slightly different from the full-model interaction CIs; report which one you used. The VC dose-response here is monotone: more is more, every step is significant.

</details>

### Exercise 4.3: Filter the interaction matrix to highly significant pairs

**Task:** From the TukeyHSD object in Exercise 4.1, programmatically extract just the `supp:dose` interaction matrix and filter to rows whose adjusted p-value is strictly below 0.01 (highly significant). The interaction matrix has 15 rows total, of which several will pass this stricter bar. Save the resulting matrix to `ex_4_3`.

**Expected result:**

```
#>                  diff    lwr    upr  p adj
#> OJ:1-OJ:0.5      9.47   4.67  14.27 0.0000
#> OJ:2-OJ:0.5     12.83   8.03  17.63 0.0000
#> VC:1-OJ:0.5      3.54  -1.26   8.34 0.2640
#> VC:2-OJ:0.5     12.91   8.11  17.71 0.0000
#> OJ:2-OJ:1        3.36  -1.44   8.16 0.3145
#> VC:1-OJ:1       -5.93 -10.73  -1.13 0.0073
#> VC:2-OJ:1        3.44  -1.36   8.24 0.2937
#> VC:1-OJ:2       -9.29 -14.09  -4.49 0.0000
#> VC:2-OJ:2        0.08  -4.72   4.88 1.0000
#> ...                                          # rows kept where p adj < 0.01
```

**Difficulty:** Advanced

[HINTS]
The interaction comparisons are one named component of the Tukey result; keep only the rows that clear the stricter significance bar.
Extract the component with `ex_4_1[["supp:dose"]]` (double brackets because the name has a colon), then index rows where `"p adj"` is below 0.01 with `drop = FALSE`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
int_mat <- ex_4_1[["supp:dose"]]
ex_4_3 <- int_mat[int_mat[, "p adj"] < 0.01, , drop = FALSE]
ex_4_3
#>                  diff    lwr    upr  p adj
#> OJ:1-OJ:0.5      9.47   4.67  14.27 0.0000
#> OJ:2-OJ:0.5     12.83   8.03  17.63 0.0000
#> VC:2-OJ:0.5     12.91   8.11  17.71 0.0000
#> VC:1-OJ:1       -5.93 -10.73  -1.13 0.0073
#> VC:1-OJ:2       -9.29 -14.09  -4.49 0.0000
#> VC:2-VC:0.5     18.16  13.36  22.96 0.0000
#> VC:2-VC:1        9.37   4.57  14.17 0.0000
```

**Explanation:** The double-square-bracket indexing `ex_4_1[["supp:dose"]]` is required because the component name contains a colon and would not survive `$`-style access. Tightening from 0.05 to 0.01 is a small but useful filter when interaction matrices are large and you want to lead the report with the rock-solid differences. The remaining seven rows above tell a clear story: every comparison involving the highest dose against the lowest dose passes; VC at low dose loses to OJ; the two supplements tie at the high dose.

</details>

## Section 5. Nonparametric post-hoc: Kruskal-Wallis follow-ups (2 problems)

### Exercise 5.1: pairwise.wilcox.test after Kruskal-Wallis on iris

**Task:** When ANOVA assumptions are violated, the nonparametric route is `kruskal.test()` for the omnibus and `pairwise.wilcox.test()` for follow-ups. On `iris$Sepal.Width` by `Species`, first run `kruskal.test()` to confirm at least one species differs, then call `pairwise.wilcox.test()` with `p.adjust.method = "BH"`. Save the pairwise test result to `ex_5_1`.

**Expected result:**

```
#>  Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#>
#> data:  iris$Sepal.Width and iris$Species
#>
#>            setosa  versicolor
#> versicolor 1.0e-15 -
#> virginica  6.4e-13 9.0e-04
#>
#> P value adjustment method: BH
```

**Difficulty:** Intermediate

[HINTS]
When the normality assumption fails, swap both the omnibus and the pairwise tests for their rank-based counterparts.
Run `kruskal.test(Sepal.Width ~ Species, data = iris)` for the omnibus, then `pairwise.wilcox.test()` with `p.adjust.method = "BH"`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
kruskal.test(Sepal.Width ~ Species, data = iris)
#>  Kruskal-Wallis rank sum test
#>
#> data:  Sepal.Width by Species
#> Kruskal-Wallis chi-squared = 63.6, df = 2, p-value = 1.6e-14

ex_5_1 <- pairwise.wilcox.test(iris$Sepal.Width, iris$Species,
                               p.adjust.method = "BH")
ex_5_1
#>  Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#>
#>            setosa  versicolor
#> versicolor 1.0e-15 -
#> virginica  6.4e-13 9.0e-04
#>
#> P value adjustment method: BH
```

**Explanation:** `pairwise.wilcox.test()` is the rank-based analogue of `pairwise.t.test()`. Use it when the residuals fail normality (Shapiro-Wilk rejects, QQ plot shows heavy tails) or when the variances are wildly unequal across groups. All three iris species differ on sepal width even after BH correction. A common pitfall is to use `pairwise.t.test()` then add a footnote saying "data was not normal"; if you suspect non-normality, switch the test, do not just note the violation.

</details>

### Exercise 5.2: Compare BH and Bonferroni on the same nonparametric pairs

**Task:** Repeat the `pairwise.wilcox.test()` from Exercise 5.1 using `p.adjust.method = "bonferroni"` instead of BH, and save the result to `ex_5_2`. Inspect how the adjusted p-values shift between BH and Bonferroni. Bonferroni controls FWER while BH controls FDR, so the two answer different inferential questions even on the same raw p-values.

**Expected result:**

```
#>  Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#>
#> data:  iris$Sepal.Width and iris$Species
#>
#>            setosa  versicolor
#> versicolor 1.5e-15 -
#> virginica  6.4e-13 1.4e-03
#>
#> P value adjustment method: bonferroni
```

**Difficulty:** Intermediate

[HINTS]
Re-run the same rank-based pairwise comparisons, but swap in the correction that controls family-wise error rather than false discovery rate.
Repeat the `pairwise.wilcox.test()` call on `iris$Sepal.Width` by `iris$Species` with `p.adjust.method = "bonferroni"`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- pairwise.wilcox.test(iris$Sepal.Width, iris$Species,
                               p.adjust.method = "bonferroni")
ex_5_2
#>  Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#>
#>            setosa  versicolor
#> versicolor 1.5e-15 -
#> virginica  6.4e-13 1.4e-03
#>
#> P value adjustment method: bonferroni
```

**Explanation:** With only three pairs the BH and Bonferroni outputs are nearly identical here because the raw p-values are tiny. The differences become large when many tests sit in a borderline zone (raw p around 0.01 to 0.05) or when the family is large. BH ranks p-values and adjusts step-up; Bonferroni multiplies every raw p by $m$. For exploratory work with many groups, BH is almost always the right choice; for confirmatory work with stakes (clinical, regulatory), Bonferroni or Holm preserves the strict FWER guarantee.

</details>

## Section 6. End-to-end real-world scenarios (3 problems)

### Exercise 6.1: QC analyst comparing warpbreaks across wool and tension

**Task:** A textile QC analyst wants to know which combinations of wool type (A, B) and tension level (L, M, H) produce significantly different break counts. Fit `aov(breaks ~ wool * tension, data = warpbreaks)` and run `TukeyHSD()` on the interaction term only. Save the `wool:tension` matrix (15 pairwise rows) to `ex_6_1` so the operations team can scan for the worst-performing cell.

**Expected result:**

```
#>            diff      lwr      upr  p adj
#> B:L-A:L   -16.33  -32.99   0.32 0.0581
#> A:M-A:L   -20.56  -37.21  -3.90 0.0085
#> B:M-A:L   -15.78  -32.43   0.88 0.0734
#> A:H-A:L   -20.00  -36.65  -3.34 0.0107
#> B:H-A:L    -9.11  -25.77   7.54 0.5944
#> A:M-B:L    -4.22  -20.88  12.43 0.9785
#> ...                                       # 9 more rows
```

**Difficulty:** Intermediate

[HINTS]
Fit a model with both factors and their interaction, then pull just the cell-by-cell comparisons out of the post-hoc result.
Fit `aov(breaks ~ wool * tension, data = warpbreaks)`, run `TukeyHSD()`, and extract the `"wool:tension"` component with double brackets.

```r title="Your turn"
ex_6_1 <- # your code here
head(ex_6_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_wb <- aov(breaks ~ wool * tension, data = warpbreaks)
tukey_wb <- TukeyHSD(fit_wb)
ex_6_1 <- tukey_wb[["wool:tension"]]
head(ex_6_1)
#>            diff      lwr      upr  p adj
#> B:L-A:L   -16.33  -32.99   0.32 0.0581
#> A:M-A:L   -20.56  -37.21  -3.90 0.0085
#> B:M-A:L   -15.78  -32.43   0.88 0.0734
#> A:H-A:L   -20.00  -36.65  -3.34 0.0107
#> B:H-A:L    -9.11  -25.77   7.54 0.5944
#> A:M-B:L    -4.22  -20.88  12.43 0.9785
```

**Explanation:** Wool A at low tension is the worst cell on average (most breaks), and most comparisons against that cell are significant or borderline. The QC actionable insight is to either avoid wool A at low tension or to recheck the operating procedure for that cell. The TukeyHSD output is the right tool here because the analyst wants every pairwise verdict at one go; running 15 separate t-tests uncorrected would inflate FWER to roughly 54%.

</details>

### Exercise 6.2: Smallest effective dose recommendation from ToothGrowth

**Task:** A pharmacology team wants the smallest vitamin-C dose in `ToothGrowth` that produces tooth growth statistically indistinguishable from the largest dose. Restrict to `supp == "VC"`, run TukeyHSD on dose, and identify the lowest dose whose pairwise comparison against dose 2.0 has an adjusted p above 0.05 (no significant difference). Return a named numeric with the recommended dose and the p-value, and save to `ex_6_2`.

**Expected result:**

```
#> recommended_dose            p_adj 
#>            1.000            0.000 
#> # no dose below 2.0 ties with 2.0 in VC; recommendation = 2.0 itself
```

**Difficulty:** Advanced

[HINTS]
Among the comparisons against the top dose, look for the lowest dose whose difference is not statistically significant.
After `TukeyHSD()` on the VC-only dose model, filter the rows comparing against dose 2 (e.g. with `grep()` on the row names) for an adjusted p above 0.05, and fall back gracefully when none qualifies.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vc <- subset(ToothGrowth, supp == "VC")
vc$dose <- as.factor(vc$dose)
fit_vc <- aov(len ~ dose, data = vc)
tk <- TukeyHSD(fit_vc)$dose

# rows comparing each lower dose against 2.0
rows_vs_top <- grep("2-", rownames(tk), value = TRUE)
candidates <- tk[rows_vs_top, , drop = FALSE]
tie <- candidates[candidates[, "p adj"] > 0.05, , drop = FALSE]

if (nrow(tie) == 0) {
  ex_6_2 <- c(recommended_dose = 2.0, p_adj = NA)
} else {
  # smallest tie partner of dose 2
  ex_6_2 <- c(recommended_dose = 1.0, p_adj = round(min(tie[, "p adj"]), 4))
}
ex_6_2
#> recommended_dose            p_adj 
#>             2.00               NA 
```

**Explanation:** In VC, every step up in dose produces a significant gain (2 beats 1, 1 beats 0.5, 2 beats 0.5), so no lower dose ties with the top dose; the recommendation defaults to 2.0 itself. The code pattern is portable: filter Tukey rows to those involving the reference level, look for the first non-significant tie, fall back gracefully when none exists. In a real submission you would also want to overlay effect sizes and CIs, not just p-values, before issuing a clinical recommendation.

</details>

### Exercise 6.3: Build an end-to-end pairwise summary table for PlantGrowth

**Task:** For `PlantGrowth`, build a single tidy data frame summarising each pairwise group comparison with columns: `pair`, `diff`, `lwr`, `upr`, `p_tukey`, `p_bonf`, and `verdict` (where `verdict` is `"different"` if either Tukey or Bonferroni adjusted p is below 0.05, otherwise `"tie"`). Save the table to `ex_6_3`. This is the artifact a stakeholder report typically attaches as an appendix.

**Expected result:**

```
#>        pair   diff    lwr    upr p_tukey p_bonf  verdict
#> 1 trt1-ctrl -0.371 -1.062  0.320  0.3909  0.583     tie
#> 2 trt2-ctrl  0.494 -0.197  1.185  0.1980  0.263     tie
#> 3 trt2-trt1  0.865  0.174  1.556  0.0120  0.013 different
```

**Difficulty:** Advanced

[HINTS]
Combine the Tukey and Bonferroni results into one table, matching rows by pair name rather than by position, then derive a verdict column.
Take `TukeyHSD(fit)$group` and the `$p.value` matrix from `pairwise.t.test()`, align them with a named lookup keyed on the Tukey row names, then build the frame and add `verdict` with `ifelse()`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- aov(weight ~ group, data = PlantGrowth)
tk  <- TukeyHSD(fit)$group
bf  <- pairwise.t.test(PlantGrowth$weight, PlantGrowth$group,
                       p.adjust.method = "bonferroni")$p.value

# Translate Bonferroni lower-triangular matrix into the same pair order as Tukey
bf_long <- list(
  "trt1-ctrl" = bf["trt1", "ctrl"],
  "trt2-ctrl" = bf["trt2", "ctrl"],
  "trt2-trt1" = bf["trt2", "trt1"]
)

ex_6_3 <- data.frame(
  pair    = rownames(tk),
  diff    = round(tk[, "diff"], 3),
  lwr     = round(tk[, "lwr"], 3),
  upr     = round(tk[, "upr"], 3),
  p_tukey = round(tk[, "p adj"], 4),
  p_bonf  = round(unlist(bf_long[rownames(tk)]), 3),
  row.names = NULL
)
ex_6_3$verdict <- ifelse(ex_6_3$p_tukey < 0.05 | ex_6_3$p_bonf < 0.05,
                         "different", "tie")
ex_6_3
#>        pair   diff    lwr    upr p_tukey p_bonf  verdict
#> 1 trt1-ctrl -0.371 -1.062  0.320  0.3909  0.583     tie
#> 2 trt2-ctrl  0.494 -0.197  1.185  0.1980  0.263     tie
#> 3 trt2-trt1  0.865  0.174  1.556  0.0120  0.013 different
```

**Explanation:** Merging Tukey and Bonferroni outputs requires care because the two functions return different shapes: Tukey gives a named matrix with one row per pair; `pairwise.t.test` gives a lower-triangular matrix indexed by group names. The bridge is a named lookup keyed by the Tukey row names. A common mistake is to rely on positional ordering, which silently breaks when factor levels are reordered. Showing both corrections in one table is honest reporting: readers can see whether the verdict depends on the choice of adjustment.

</details>

## What to do next

- [ANOVA Exercises in R](ANOVA-Exercises-in-R.html) for the omnibus tests that lead into a Tukey or Bonferroni follow-up.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) for paired and independent t-tests that pairwise.t.test wraps.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) for the parent modelling framework that aov() inherits from.
- [Post-Hoc Tests After ANOVA](Post-Hoc-Tests-After-ANOVA.html) for the parent tutorial covering Tukey, Bonferroni, and Scheffe decision rules in full.
