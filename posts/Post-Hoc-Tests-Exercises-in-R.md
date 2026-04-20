---
title: "Post-Hoc Tests Exercises in R: 8 Tukey & Bonferroni Problems, Solved Step-by-Step"
slug: Post-Hoc-Tests-Exercises-in-R
description: "Practise 8 post-hoc exercises in R with runnable Tukey HSD, Bonferroni, Holm, pairwise.t.test, and two-way interaction comparisons, solved step-by-step."
keywords: "post-hoc tests exercises in R, Tukey HSD practice, Bonferroni correction R, pairwise comparisons R, multiple comparisons exercises, TukeyHSD, pairwise.t.test, Holm adjustment R, post-hoc exercises"
auto_link_terms: "post-hoc exercises|Tukey HSD exercises|Bonferroni exercises|post-hoc tests exercises|post-hoc practice problems|pairwise comparisons exercises"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-20
curriculum_id: E7.2
post_type: EX
sidebar_title: "Post-Hoc Tests Exercises (8 problems)"
fr_parent: Post-Hoc-Tests-After-ANOVA.html
difficulty: Intermediate
---

# Post-Hoc Tests Exercises in R: 8 Tukey & Bonferroni Problems, Solved Step-by-Step

<p class="lead">Eight post-hoc exercises in R that turn a significant ANOVA into specific pairwise verdicts. You run Tukey HSD, Bonferroni, Holm, and nonparametric alternatives on built-in datasets, read the adjusted p-values and confidence intervals, and see exactly when one correction is sharper than another.</p>

## Which post-hoc test fits your ANOVA, Tukey or Bonferroni?

A significant ANOVA tells you some group differs, but not which one. The two standard follow-ups in base R are `TukeyHSD()` and `pairwise.t.test()` with a Bonferroni correction. Tukey is tailored to all-pairwise comparisons after ANOVA; Bonferroni is more generic and applies anywhere you want to test a family of hypotheses. Both adjust p-values so the overall (familywise) false-positive rate stays near 5% instead of ballooning with each new comparison. Running both on the same data side by side is the quickest way to see how their verdicts differ before you start the exercises.

```r title="Tukey vs Bonferroni on PlantGrowth"
# One-way ANOVA: does plant weight differ by group (ctrl, trt1, trt2)?
fit_pg <- aov(weight ~ group, data = PlantGrowth)
summary(fit_pg)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> group        2  3.766  1.8832   4.846 0.0159 *
#> Residuals   27 10.492  0.3886

# Tukey HSD: all pairwise comparisons, Tukey-adjusted p-values
tukey_pg <- TukeyHSD(fit_pg)
tukey_pg
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

# Pairwise t-tests with Bonferroni correction
bonf_pg <- pairwise.t.test(PlantGrowth$weight, PlantGrowth$group, p.adj = "bonferroni")
bonf_pg
#>
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

The ANOVA rejects the null at p = 0.016, confirming at least one pair differs. Tukey narrows it down: only `trt2-trt1` clears the 0.05 line with p = 0.012; the other two comparisons sit well above. Bonferroni agrees the `trt2-trt1` pair is significant (p = 0.013) and keeps the other two non-significant. The two methods produce slightly different adjusted p-values, but here they reach the same conclusion. That alignment breaks down once you have more groups, which is where picking the right method starts to matter.

Here is the one-line rule for choosing between them:

| Situation | Use |
|---|---|
| Standard all-pairs post-hoc after one-way or factorial ANOVA | `TukeyHSD()` |
| You only care about a subset of planned pairs, or want a method that works beyond ANOVA (nonparametric, chi-square follow-ups) | `pairwise.t.test()` with `p.adj = "bonferroni"` |
| You want Bonferroni's safety but more power | `pairwise.t.test()` with `p.adj = "holm"` (Exercise 5) |
| Data is skewed or non-normal | `pairwise.wilcox.test()` with `p.adj = "bonferroni"` (Exercise 8) |

[KEY INSIGHT]
**Every extra pairwise test inflates your false-positive rate.** With 3 groups and unadjusted α = 0.05 per test, the familywise chance of at least one false positive is roughly 1 - (1 - 0.05)^3 = 14%. With 6 groups and 15 pairs, it balloons past 50%. Tukey and Bonferroni both pull this back to 5%, just via different math. Skipping the adjustment does not "save" significance, it manufactures it.

**Try it:** Pull out the adjusted p-value for the `trt2-trt1` pair from `tukey_pg`. Save it to `ex_p`.

```r title="Your turn: extract one Tukey p-value"
# Try it: grab the p adj for trt2 vs trt1
# Hint: tukey_pg$group is a matrix; the rownames are "trt2-trt1" etc.
ex_p <- ___   # replace with the correct extraction
ex_p
#> Expected: a number near 0.012
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract Tukey p-value solution"
ex_p <- tukey_pg$group["trt2-trt1", "p adj"]
ex_p
#> [1] 0.01200642
```

**Explanation:** `TukeyHSD()` returns a list with one entry per factor. That entry is a numeric matrix whose rownames are the pairs and whose columns are `diff`, `lwr`, `upr`, and `p adj`. Indexing `[rowname, colname]` is the clean way to pull out a single value. This pattern is the basis of Exercise 2.

</details>

## How do you read TukeyHSD output and confidence intervals?

The Tukey object has four columns worth knowing cold. `diff` is the mean difference for the pair (second group minus first, based on the rowname). `lwr` and `upr` are the lower and upper bounds of the 95% family-wise confidence interval for that difference. `p adj` is the adjusted p-value. The quickest read: if the CI covers zero, the pair is non-significant at the 0.05 family-wise level; if it lies entirely above or below zero, the pair is significant. Calling `plot()` on the Tukey object turns that into a visual scan.

```r title="Plot TukeyHSD confidence intervals"
plot(tukey_pg)
# A base R plot: one horizontal CI per pair.
# Pairs whose bars CROSS the zero line are non-significant.
# Pairs whose bars sit ENTIRELY above or below zero are significant.
```

The printed Tukey table for PlantGrowth tells the same story: `trt1-ctrl` (-1.06 to 0.32) and `trt2-ctrl` (-0.20 to 1.19) both straddle zero, and both have `p adj > 0.05`. Only `trt2-trt1` (0.17 to 1.56) clears zero entirely, matching its `p adj = 0.012`. The plot is handy when you have many pairs and want to triage which ones are worth writing up before reading p-values.

[TIP]
**plot(TukeyHSD()) scales well with group count.** On 6-group InsectSprays you get 15 intervals in one figure, and the eye immediately picks out which pairs cross zero. Try it after Exercise 1.

**Try it:** From `tukey_pg$group`, identify the one pair whose CI does NOT cross zero. Save its row name (a string) to `ex_nonsig`.

```r title="Your turn: find the significant pair"
# Try it: return the row name of the only significant pair
ex_nonsig <- "___"   # replace with the correct rowname
ex_nonsig
#> Expected: "trt2-trt1"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Find significant pair solution"
# A pair is "significant" if both lwr and upr lie on the same side of zero.
rows <- rownames(tukey_pg$group)
sig <- rows[sign(tukey_pg$group[, "lwr"]) == sign(tukey_pg$group[, "upr"])]
ex_nonsig <- sig
ex_nonsig
#> [1] "trt2-trt1"
```

**Explanation:** A CI crosses zero when `lwr` and `upr` have opposite signs. Filtering to pairs where `sign(lwr) == sign(upr)` returns only the intervals that stay on one side of zero, which is equivalent to `p adj < 0.05` at the 95% family-wise level.

</details>

## Practice Exercises

Eight problems, progressive difficulty. Each starter block is runnable as-is so you can iterate; solutions are collapsed. Use distinct variable names (`ex1_*`, `ex2_*`, ...) so your work does not overwrite tutorial objects like `tukey_pg`.

### Exercise 1: TukeyHSD on InsectSprays

Fit a one-way ANOVA on the built-in `InsectSprays` dataset (`count ~ spray`), save the fit to `ex1_fit`, and run TukeyHSD on it into `ex1_tukey`. Print `ex1_tukey`. InsectSprays has six groups, so you will get 15 pairwise rows.

```r title="Exercise 1 starter: Tukey on InsectSprays"
# Exercise 1: one-way ANOVA + TukeyHSD on InsectSprays
# Hint: aov(count ~ spray, data = InsectSprays), then TukeyHSD()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_fit <- aov(count ~ spray, data = InsectSprays)
summary(ex1_fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> spray        5   2669   533.8    34.7 <2e-16 ***
#> Residuals   66   1015    15.4

ex1_tukey <- TukeyHSD(ex1_fit)
ex1_tukey
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = count ~ spray, data = InsectSprays)
#>
#> $spray
#>            diff        lwr        upr     p adj
#> B-A   0.8333333  -3.866075   5.532742 0.9951810
#> C-A -12.4166667 -17.116075  -7.717258 0.0000000
#> D-A  -9.5833333 -14.282742  -4.883925 0.0000014
#> E-A -11.0000000 -15.699409  -6.300591 0.0000000
#> F-A   2.1666667  -2.532742   6.866075 0.7542147
#> C-B -13.2500000 -17.949409  -8.550591 0.0000000
#> D-B -10.4166667 -15.116075  -5.717258 0.0000002
#> E-B -11.8333333 -16.532742  -7.133925 0.0000000
#> F-B   1.3333333  -3.366075   6.032742 0.9603075
#> D-C   2.8333333  -1.866075   7.532742 0.4920707
#> E-C   1.4166667  -3.282742   6.116075 0.9488669
#> F-C  14.5833333   9.883925  19.282742 0.0000000
#> E-D  -1.4166667  -6.116075   3.282742 0.9488669
#> F-D  11.7500000   7.050591  16.449409 0.0000000
#> F-E  13.1666667   8.467258  17.866075 0.0000000
```

**Explanation:** The ANOVA is massively significant (F = 34.7, p < 2e-16) because sprays C, D, and E kill far more insects than A, B, and F. The Tukey table confirms the structure: every pair that crosses the "weak vs strong" boundary is significant, while within-group pairs (A-B, A-F, C-D, C-E, D-E, etc.) are not. This 15-row object powers Exercises 2, 4, and 7.

</details>

### Exercise 2: Extract the adjusted p-value for a specific pair

From `ex1_tukey`, pull out the adjusted p-value for the `C-A` comparison into `ex2_pval`. This is the skill you use every time a reviewer asks "what is the exact p for spray C vs spray A?"

```r title="Exercise 2 starter: extract one Tukey p-value"
# Exercise 2: extract p adj for "C-A" from ex1_tukey
# Hint: see the Try it in the first H2 for the pattern.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_pval <- ex1_tukey$spray["C-A", "p adj"]
ex2_pval
#> [1] 1.536295e-08
```

**Explanation:** Same matrix-indexing pattern as the first Try it, but with factor name `spray` and rowname `C-A`. When a p-value prints as `0.0000000` in the full table, pulling it out as a numeric shows the real magnitude, here roughly 1.5e-08. Rounded display hides the strength of the evidence.

</details>

### Exercise 3: Pairwise t-tests with Bonferroni adjustment

Run `pairwise.t.test()` on `InsectSprays$count` and `InsectSprays$spray` with `p.adj = "bonferroni"`, save to `ex3_bonf`, and print it.

```r title="Exercise 3 starter: Bonferroni pairwise"
# Exercise 3: pairwise t-tests with Bonferroni adjustment
# Hint: pairwise.t.test(x, g, p.adj = "bonferroni")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_bonf <- pairwise.t.test(InsectSprays$count, InsectSprays$spray,
                            p.adj = "bonferroni")
ex3_bonf
#>
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  InsectSprays$count and InsectSprays$spray
#>
#>         A       B       C       D       E
#> B 1.0e+00 -       -       -       -
#> C 1.1e-08 2.0e-10 -       -       -
#> D 4.5e-06 8.3e-07 1.00000 -       -
#> E 3.8e-08 4.4e-10 1.00000 1.00000 -
#> F 1.00000 1.00000 2.0e-10 1.5e-07 1.1e-09
#>
#> P value adjustment method: bonferroni
```

**Explanation:** `pairwise.t.test()` returns a lower-triangular matrix of adjusted p-values. The structure mirrors Tukey: A/B/F cluster together as "weak sprays" (all mutual p-values = 1.00), C/D/E cluster as "strong sprays" (all mutual p-values = 1.00), and every weak-strong comparison is highly significant. Bonferroni's conservativism is visible in the 1.00 values, which are p-values that got multiplied by the number of comparisons (15) and capped at 1.

</details>

### Exercise 4: Compare Tukey and Bonferroni side-by-side

Build a data frame with three columns, `pair`, `tukey_p`, and `bonf_p`, showing the adjusted p-value from `ex1_tukey` and from `ex3_bonf` for every pair. Save to `ex4_tbl`. This tells you which method is being more conservative on this dataset.

```r title="Exercise 4 starter: side-by-side table"
# Exercise 4: combine Tukey and Bonferroni p-values in one table
# Hint: tukey p-values are in ex1_tukey$spray[, "p adj"]
#       bonferroni p-values are in ex3_bonf$p.value (an upper/lower triangular matrix)
# You need to align them by pair name.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
# Tukey part: one p-value per pair, already named
tukey_p <- ex1_tukey$spray[, "p adj"]

# Bonferroni part: flatten the matrix, drop NAs, and rename to match Tukey
bonf_mat <- ex3_bonf$p.value
bonf_pairs <- expand.grid(row = rownames(bonf_mat), col = colnames(bonf_mat),
                          stringsAsFactors = FALSE)
bonf_pairs$bonf_p <- as.vector(bonf_mat)
bonf_pairs <- bonf_pairs[!is.na(bonf_pairs$bonf_p), ]
bonf_pairs$pair <- paste0(bonf_pairs$row, "-", bonf_pairs$col)

ex4_tbl <- data.frame(
  pair    = names(tukey_p),
  tukey_p = round(tukey_p, 6),
  bonf_p  = round(bonf_pairs$bonf_p[match(names(tukey_p), bonf_pairs$pair)], 6)
)
ex4_tbl
#>    pair  tukey_p   bonf_p
#> 1   B-A 0.995181 1.000000
#> 2   C-A 0.000000 0.000000
#> 3   D-A 0.000001 0.000005
#> 4   E-A 0.000000 0.000000
#> 5   F-A 0.754215 1.000000
#> 6   C-B 0.000000 0.000000
#> 7   D-B 0.000000 0.000001
#> 8   E-B 0.000000 0.000000
#> 9   F-B 0.960308 1.000000
#> 10  D-C 0.492071 1.000000
#> 11  E-C 0.948867 1.000000
#> 12  F-C 0.000000 0.000000
#> 13  E-D 0.948867 1.000000
#> 14  F-D 0.000000 0.000000
#> 15  F-E 0.000000 0.000000
```

**Explanation:** Bonferroni is slightly more conservative on non-significant pairs (every Tukey value above about 0.5 gets pushed to 1.00 by Bonferroni's cap). On the pairs that actually matter, both methods agree, and both agree with the eye. The practical takeaway: Tukey and Bonferroni rarely disagree about significance on ANOVA data. Use Tukey when you want slightly more power for the borderline pairs.

</details>

### Exercise 5: Holm adjustment, better power with the same guarantee

Holm's step-down procedure controls the same familywise error rate as Bonferroni but is uniformly less conservative. Run `pairwise.t.test()` again with `p.adj = "holm"` on InsectSprays, save to `ex5_holm`, and confirm every Holm p-value is less than or equal to the matching Bonferroni p-value.

```r title="Exercise 5 starter: Holm adjustment"
# Exercise 5: Holm adjustment (a.k.a. Holm-Bonferroni)
# Hint: pairwise.t.test(..., p.adj = "holm")
# Then compare ex5_holm$p.value and ex3_bonf$p.value element-wise.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_holm <- pairwise.t.test(InsectSprays$count, InsectSprays$spray,
                            p.adj = "holm")
ex5_holm
#>
#>  Pairwise comparisons using t tests with pooled SD
#>
#> data:  InsectSprays$count and InsectSprays$spray
#>
#>         A       B       C       D       E
#> B 0.81964 -       -       -       -
#> C 5.2e-09 1.3e-10 -       -       -
#> D 1.5e-06 3.3e-07 1.00000 -       -
#> E 1.8e-08 2.9e-10 1.00000 1.00000 -
#> F 1.00000 1.00000 1.3e-10 4.9e-08 5.1e-10
#>
#> P value adjustment method: holm

# Confirm Holm <= Bonferroni everywhere
all(ex5_holm$p.value <= ex3_bonf$p.value, na.rm = TRUE)
#> [1] TRUE
```

**Explanation:** Every Holm p-value is less than or equal to its Bonferroni counterpart, so Holm never loses power but controls the same familywise error rate. The `B-A` pair drops from 1.0000 (Bonferroni) to 0.82 (Holm), the small-but-nonzero `D-A` tightens from 4.5e-06 to 1.5e-06, and so on. If you were ever tempted to use Bonferroni "to be safe," use Holm instead, same guarantee, more power.

</details>

### Exercise 6: Tukey HSD on a two-way ANOVA

Fit a factorial ANOVA `len ~ supp * factor(dose)` on `ToothGrowth`, save to `ex6_fit`, and run TukeyHSD on it into `ex6_tukey`. Then pull out the comparison of `OJ:0.5` vs `VC:0.5` from the interaction term. Supplement effect at the lowest dose is the scientific question.

```r title="Exercise 6 starter: Tukey on two-way ANOVA"
# Exercise 6: factorial ANOVA + Tukey on supp:dose interaction
# Hint: aov(len ~ supp * factor(dose), data = ToothGrowth)
# TukeyHSD on a factorial fit compares EVERY combination; search
# rownames(ex6_tukey[["supp:factor(dose)"]]) for the pair you want.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_fit <- aov(len ~ supp * factor(dose), data = ToothGrowth)
ex6_tukey <- TukeyHSD(ex6_fit)
# The interaction piece is named "supp:factor(dose)"
int_rows <- ex6_tukey[["supp:factor(dose)"]]
int_rows["VC:0.5-OJ:0.5", ]
#>         diff          lwr          upr        p adj
#>   -5.2500000  -10.0487900  -0.4512100    0.0242297
```

**Explanation:** At dose 0.5, VC delivers 5.25 units LESS tooth growth than OJ, with a 95% family-wise CI of [-10.05, -0.45] and `p adj = 0.024`. That is a significant supplement effect at the lowest dose. `TukeyHSD()` on a factorial fit returns one block per term (`supp`, `factor(dose)`, `supp:factor(dose)`), and the interaction block contains all 15 cross-combinations. You rarely care about all 15, so filter to the specific cell comparison that answers your question.

</details>

[WARNING]
**Tukey on an interaction term compares every combination, including uninteresting ones.** A 2-by-3 design produces 15 interaction pairs, most of which are not what you asked. Always filter to the specific within-dose or within-supp comparisons that map to your scientific question before reporting.

### Exercise 7: Plot the TukeyHSD confidence intervals

Call `plot(ex1_tukey, las = 1)` to visualise the 15 InsectSprays pairs. `las = 1` rotates the axis labels so the rownames are readable. Eyeball the chart: count how many intervals cross zero (non-significant) versus how many sit entirely on one side (significant).

```r title="Exercise 7 starter: plot Tukey intervals"
# Exercise 7: visualise ex1_tukey
# Hint: plot(ex1_tukey, las = 1), no extra packages needed.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
par(mar = c(5, 8, 4, 2))   # widen left margin so rownames fit
plot(ex1_tukey, las = 1)
```

**Explanation:** Six pairs (`B-A`, `F-A`, `F-B`, `D-C`, `E-C`, `E-D`) have intervals straddling zero, so they are non-significant. The other nine sit entirely on one side of zero and are significant. This matches the `p adj` column from Exercise 1 perfectly. On a 6-group design you can verify the post-hoc story visually in one glance, which is why `plot(TukeyHSD())` is often faster than scanning a 15-row printout.

</details>

### Exercise 8: Nonparametric post-hoc after Kruskal-Wallis

When the ANOVA assumption of normality fails, the Kruskal-Wallis test replaces `aov()` and `pairwise.wilcox.test()` with `p.adj = "bonferroni"` replaces Tukey. Run both on `PlantGrowth` (yes, it is normal enough for ANOVA, but the same pipeline applies to any skewed outcome). Save the pairwise result to `ex8_wilcox`.

```r title="Exercise 8 starter: nonparametric post-hoc"
# Exercise 8: Kruskal-Wallis + pairwise.wilcox.test with Bonferroni
# Hint: kruskal.test(weight ~ group, data = PlantGrowth)
#       pairwise.wilcox.test(PlantGrowth$weight, PlantGrowth$group,
#                            p.adj = "bonferroni")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
kruskal.test(weight ~ group, data = PlantGrowth)
#>
#>  Kruskal-Wallis rank sum test
#>
#> data:  weight by group
#> Kruskal-Wallis chi-squared = 7.9885, df = 2, p-value = 0.01842

ex8_wilcox <- pairwise.wilcox.test(PlantGrowth$weight, PlantGrowth$group,
                                   p.adj = "bonferroni")
ex8_wilcox
#>
#>  Pairwise comparisons using Wilcoxon rank sum exact test
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.586 -
#> trt2 0.416 0.028
#>
#> P value adjustment method: bonferroni
```

**Explanation:** Kruskal-Wallis gives an overall chi-squared of 7.99 (p = 0.018), close to what ANOVA produced. The pairwise Wilcoxon with Bonferroni flags only `trt2-trt1` at p = 0.028, matching Tukey and Bonferroni t-tests. This is the go-to pipeline when your outcome is ordinal, heavy-tailed, or otherwise non-normal: Kruskal-Wallis for the global test, `pairwise.wilcox.test()` for the post-hoc, Bonferroni or Holm for the adjustment.

</details>

## Complete Example: chick weights by feed type

End-to-end pipeline on the built-in `chickwts` dataset, which measures chick weights across six feed types. The workflow below is the same one you would run in a report: ANOVA, Tukey, Bonferroni, Holm, then a visual.

```r title="Complete pipeline on chickwts"
# Step 1: one-way ANOVA
ce_fit <- aov(weight ~ feed, data = chickwts)
summary(ce_fit)
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> feed         5 231129   46226   15.36 5.94e-10 ***
#> Residuals   65 195556    3009

# Step 2: Tukey HSD, the all-pairs default
ce_tukey <- TukeyHSD(ce_fit)
ce_tukey$feed[, c("diff", "p adj")]
#>                              diff        p adj
#> horsebean-casein        -163.3833 0.0000000
#> linseed-casein          -104.8333 0.0002100
#> meatmeal-casein          -46.6742 0.3324584
#> soybean-casein           -77.1548 0.0083653
#> sunflower-casein           5.3333 0.9998902
#> linseed-horsebean         58.5500 0.1413329
#> meatmeal-horsebean       116.7091 0.0001062
#> soybean-horsebean         86.2286 0.0042167
#> sunflower-horsebean      168.7167 0.0000000
#> meatmeal-linseed          58.1591 0.1766210
#> soybean-linseed           27.6786 0.7821869
#> sunflower-linseed        110.1667 0.0000996
#> soybean-meatmeal         -30.4805 0.7271591
#> sunflower-meatmeal        52.0075 0.2206962
#> sunflower-soybean         82.4881 0.0066952

# Step 3: Bonferroni and Holm on the same data
ce_bonf <- pairwise.t.test(chickwts$weight, chickwts$feed, p.adj = "bonferroni")
ce_holm <- pairwise.t.test(chickwts$weight, chickwts$feed, p.adj = "holm")
round(ce_bonf$p.value, 4)
#>             casein horsebean linseed meatmeal soybean
#> horsebean   0.0000        NA      NA       NA      NA
#> linseed     0.0002    0.2098      NA       NA      NA
#> meatmeal    0.3896    0.0001  0.2657       NA      NA
#> soybean     0.0090    0.0062  1.0000   1.0000      NA
#> sunflower   1.0000    0.0000  0.0001   0.2964  0.0071
round(ce_holm$p.value, 4)
#>             casein horsebean linseed meatmeal soybean
#> horsebean   0.0000        NA      NA       NA      NA
#> linseed     0.0002    0.0839      NA       NA      NA
#> meatmeal    0.0779    0.0001  0.0886       NA      NA
#> soybean     0.0060    0.0044  0.5555   0.5555      NA
#> sunflower   0.6972    0.0000  0.0001   0.0889  0.0049

# Step 4: Tukey CI plot for the full visual
par(mar = c(5, 11, 4, 2))
plot(ce_tukey, las = 1)
```

The ANOVA rejects strongly (F = 15.36, p = 5.9e-10). Casein and sunflower are the heavyweight feeds; horsebean is the lightweight. Tukey, Bonferroni, and Holm all agree on the direction of every significant pair, but they trade power and conservativism at the margins: Tukey flags `soybean-casein` (p = 0.008), Bonferroni matches (p = 0.009), and Holm keeps it (p = 0.006). A borderline pair like `meatmeal-casein` sits at Tukey p = 0.33 (non-sig) and Bonferroni p = 0.39 (non-sig) with Holm at 0.08, all above 0.05. A one-paragraph report writes itself: "A one-way ANOVA (F(5, 65) = 15.4, p < 0.001) found feed type significantly affected chick weight. Tukey HSD showed casein, sunflower, and meatmeal all produced heavier chicks than horsebean (adjusted p ≤ 0.0001), while casein also beat linseed (p = 0.0002) and soybean (p = 0.008)."

[TIP]
**Always report both the ANOVA F and the post-hoc pairs.** The F answers "does feed type matter at all?" The pairs answer "which feeds differ?" Leaving out the F looks like p-hacking; leaving out the pairs leaves the reader with a yes/no and no actionable detail.

## Summary

- After a significant ANOVA, `TukeyHSD()` is the default for all pairwise comparisons, and `pairwise.t.test()` with `p.adj = "bonferroni"` is the generic alternative that works beyond ANOVA.
- The adjusted p-values from Tukey and Bonferroni rarely disagree on ANOVA data, but Bonferroni is slightly more conservative, especially on borderline pairs.
- Holm (`p.adj = "holm"`) dominates Bonferroni: same familywise error guarantee, more power. Prefer Holm unless you have a specific reason to use Bonferroni.
- `plot(TukeyHSD(fit))` turns a 15-row adjusted p-value table into a one-screen visual: any interval crossing zero is non-significant.
- For non-normal outcomes, the nonparametric pipeline is `kruskal.test()` followed by `pairwise.wilcox.test()` with Bonferroni or Holm.
- On factorial ANOVAs, `TukeyHSD()` returns one block per term. The interaction block contains every cell-vs-cell comparison, so filter to the scientific question you actually care about.

| Method | Power | When to use |
|---|---|---|
| `TukeyHSD()` | Best for all-pairs after ANOVA | One-way or factorial ANOVA, all pairwise comparisons |
| `pairwise.t.test(..., p.adj = "bonferroni")` | Conservative | Works outside ANOVA (nonparametric, chi-square follow-ups); simplest default |
| `pairwise.t.test(..., p.adj = "holm")` | Bonferroni's replacement | Same FWER guarantee, uniformly more power |
| `pairwise.wilcox.test(..., p.adj = "bonferroni")` | Nonparametric | Skewed or ordinal outcome; Kruskal-Wallis follow-up |

## References

1. R Core Team. *TukeyHSD() reference manual*. [stat.ethz.ch/R-manual/R-devel/library/stats/html/TukeyHSD.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TukeyHSD.html)
2. R Core Team. *pairwise.t.test() reference manual*. [stat.ethz.ch/R-manual/R-devel/library/stats/html/pairwise.t.test.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/pairwise.t.test.html)
3. R Core Team. *p.adjust() reference manual (Bonferroni, Holm, Hochberg, BH)*. [stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html)
4. Holm, S. (1979). A simple sequentially rejective multiple test procedure. *Scandinavian Journal of Statistics* 6:65-70.
5. Hothorn, T., Bretz, F., Westfall, P. (2008). Simultaneous Inference in General Parametric Models. *Biometrical Journal* 50(3):346-363.
6. UCLA OARC. *How can I do post-hoc pairwise comparisons in R?* [stats.oarc.ucla.edu/r/faq/how-can-i-do-post-hoc-pairwise-comparisons-in-r/](https://stats.oarc.ucla.edu/r/faq/how-can-i-do-post-hoc-pairwise-comparisons-in-r/)
7. Greenwood, M. (2022). *Intermediate Statistics with R*, Chapter 3: Multiple pair-wise comparisons using Tukey's HSD. [stats.libretexts.org](https://stats.libretexts.org/Bookshelves/Advanced_Statistics/Intermediate_Statistics_with_R_(Greenwood)/03%3A_One-Way_ANOVA/3.06%3A_Multiple_(pair-wise)_comparisons_using_Tukeys_HSD_and_the_compact_letter_display)

## Continue Learning

- [Post-Hoc Tests After ANOVA in R](Post-Hoc-Tests-After-ANOVA.html): the conceptual parent post covering when and why Tukey, Bonferroni, and Scheffé apply, with decision rules.
- [One-Way ANOVA in R](One-Way-ANOVA-in-R.html): fit and interpret the ANOVA that these post-hoc tests follow up on.
- [ANOVA Exercises in R](ANOVA-Exercises-in-R.html): sister exercise set focused on fitting one-way and factorial ANOVAs before the post-hoc stage.
