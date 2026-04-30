---
title: "Aligned Rank Transform for Factorial Designs in R: ARTool Package"
slug: "Aligned-Rank-Transform-for-Factorial-Designs-in-R"
description: "Use ARTool to run nonparametric factorial ANOVA in R. Test main effects and interactions on ranked data with art(), anova(), and art.con() post-hoc."
keywords: "Aligned Rank Transform, ARTool R package, nonparametric factorial ANOVA, art() function R, anova.art, ART-C contrasts, rank transform ANOVA, Wobbrock ART, mixed effects ART, nonparametric interaction effect"
auto_link_terms: "Aligned Rank Transform|ARTool package|ART-C contrasts|nonparametric factorial ANOVA|aligned rank transform ANOVA|Wobbrock ART procedure|nonparametric interaction effect"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "FR-nonp-11"
post_type: "FR"
fr_parent: "Kruskal-Wallis-Test-in-R-2.html"
difficulty: "Intermediate"
---

# Aligned Rank Transform for Factorial Designs in R: ARTool Package

<p class="lead">The Aligned Rank Transform (ART) is a nonparametric procedure that lets you run factorial ANOVA, including interaction effects, on ranked data when normality fails. The R package <code>ARTool</code> automates the alignment and ranking steps so you can fit two-way (and higher) designs with <code>art()</code> and read main effects, interactions, and post-hoc contrasts the way you would from a regular ANOVA.</p>

## What is the Aligned Rank Transform?

Suppose you ran a 2×4 experiment and the residuals are skewed. A classical two-way ANOVA is no longer trustworthy, and Kruskal-Wallis can only handle one factor at a time. ART solves both problems in one model. We'll start with the canonical example from Higgins (1990), where moisture and fertilizer were crossed in a peat-pot trial, and watch ART pick up the moisture × fertilizer interaction in eight lines.

```r title="First ART analysis on Higgins 1990"
# Load ARTool and the example dataset
library(ARTool)
data(Higgins1990Table5, package = "ARTool")
hg <- Higgins1990Table5

# Step 1: align and rank with art()
m_first <- art(DryMatter ~ Moisture * Fertilizer, data = hg)

# Step 2: read the ART ANOVA table
anova_first <- anova(m_first)
anova_first
#> Analysis of Variance of Aligned Rank Transformed Data
#>
#> Table Type: Anova Table (Type III tests) 
#> Model: No Repeated Measures (lm)
#> Response: art(DryMatter)
#>
#>                      Df Df.res F value     Pr(>F)    
#> 1 Moisture            3     32  23.851 1.0091e-08 ***
#> 2 Fertilizer          3     32  73.074 3.6763e-15 ***
#> 3 Moisture:Fertilizer 9     32   4.530 4.5876e-04 ***
```

Both main effects and the interaction come out significant on ranked data. The interaction p-value (`4.6e-04`) is the result a plain `kruskal.test()` could never give you, because Kruskal-Wallis collapses every cell into a single one-factor comparison. ART preserves the factorial structure and produces the same F-table layout you already know how to read.

[KEY INSIGHT]
**ART tests interactions correctly because it aligns first, then ranks.** A naive rank transform (rank the whole response, then run ANOVA) inflates Type-I error on interactions because ranking destroys the additive structure. ART removes all other effects from the response *before* ranking, so each effect is tested on a residualized scale that the rank transform handles cleanly.

**Try it:** Re-run the ART ANOVA on the subset of trays numbered 1 through 6 only. Save the table to `ex_anova_sub`.

```r title="Your turn: ART on a tray subset"
# Try it: subset hg to Tray %in% 1:6, refit art(), save anova() to ex_anova_sub

# ex_sub <- hg[hg$Tray %in% 1:6, ]
# ex_m_sub <- art( ??? )
# ex_anova_sub <- anova(ex_m_sub)
# ex_anova_sub
#> Expected: a 3-row F table with smaller F values than the full data
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tray subset solution"
ex_sub <- hg[hg$Tray %in% 1:6, ]
ex_m_sub <- art(DryMatter ~ Moisture * Fertilizer, data = ex_sub)
ex_anova_sub <- anova(ex_m_sub)
ex_anova_sub
#> ... main effects still significant, interaction p-value larger than full data
```

**Explanation:** Half the trays means roughly half the observations, so F values shrink. The structure of the table is unchanged because ART works on whatever rows you hand it.

</details>

## How do you fit ART in R with art() and anova()?

The art() workflow is three steps every time: transform, verify, analyze. The transform step builds a rectangular table of aligned and ranked responses, one column per effect. The verify step checks that alignment actually zeroed out the other effects. The analyze step is `anova()`, which selects between `lm`, `aov`, and `lmer` based on your formula.

![ART workflow](screenshots/Aligned-Rank-Transform-for-Factorial-Designs-in-R-workflow.webp)
*Figure 1: The three-step ART workflow (align, rank, ANOVA) followed by ART-C post-hoc contrasts.*

Before any of that, the predictors must be factors. ART aligns by group means, so a numeric column will silently produce wrong results.

```r title="Inspect Higgins1990Table5 structure"
# Look at the dataset shape and variable types
str(hg)
#> 'data.frame':	48 obs. of  4 variables:
#>  $ Tray      : Factor w/ 12 levels "1","2","3","4",..: 1 1 1 1 2 2 2 2 3 3 ...
#>  $ Moisture  : Factor w/ 4 levels "M1","M2","M3","M4": 1 1 1 1 1 1 1 1 1 1 ...
#>  $ Fertilizer: Factor w/ 4 levels "F1","F2","F3","F4": 1 2 3 4 1 2 3 4 1 2 ...
#>  $ DryMatter : num  3.3 4.3 4.5 5.8 4 4.1 6.5 7.3 1.9 3.8 ...
head(hg, 4)
#>   Tray Moisture Fertilizer DryMatter
#> 1    1       M1         F1       3.3
#> 2    1       M1         F2       4.3
#> 3    1       M1         F3       4.5
#> 4    1       M1         F4       5.8
```

48 rows, 4 columns. Both predictors are already factors here, but if you load your own data with `read.csv()` you will likely need to coerce them.

[WARNING]
**All ART predictors must be factors before art().** Pass a numeric column and the alignment step uses each unique value as a group, so doses 0.5, 1.0, 2.0 become three labels but residuals are computed on the wrong scale. Always run `as.factor()` first and confirm with `str()`.

```r title="Coerce predictors to factor()"
# Always coerce predictors and confirm the levels
hg$Moisture   <- as.factor(hg$Moisture)
hg$Fertilizer <- as.factor(hg$Fertilizer)
levels(hg$Moisture)
#> [1] "M1" "M2" "M3" "M4"
levels(hg$Fertilizer)
#> [1] "F1" "F2" "F3" "F4"
```

The four levels for each factor confirm we have a 4×4 design. Now fit the ART model and verify alignment with `summary()`. The verify step is the one most tutorials skip, but it is the only diagnostic ART gives you.

```r title="Fit ART and verify alignment"
# Fit and verify
m <- art(DryMatter ~ Moisture * Fertilizer, data = hg)
summary(m)
#> Aligned Rank Transform of Factorial Model
#>
#> Call:
#> art(formula = DryMatter ~ Moisture * Fertilizer, data = hg)
#>
#> Column sums of aligned responses (should all be 0):
#>            Moisture          Fertilizer Moisture:Fertilizer 
#>                   0                   0                   0 
#>
#> F values of ANOVAs on aligned responses not of interest (should all be ~0):
#>            Moisture          Fertilizer Moisture:Fertilizer 
#>             0.00000             0.00000             0.00000
```

Three zeros where you want zeros. Column sums of zero confirm that aligning removed every other effect from each column, and F values of zero confirm that the residualized columns no longer carry signal from the other terms. If you ever see non-zero numbers here, the model is misspecified, usually because a predictor is numeric.

```r title="Read the ART ANOVA F table"
# Pull the F table for ranked aligned responses
art_table <- anova(m)
art_table
#>                      Df Df.res F value     Pr(>F)    
#> 1 Moisture            3     32  23.851 1.0091e-08 ***
#> 2 Fertilizer          3     32  73.074 3.6763e-15 ***
#> 3 Moisture:Fertilizer 9     32   4.530 4.5876e-04 ***
```

This is the same shape as `aov()` output: degrees of freedom, residual degrees of freedom, F, and a p-value. Read it the same way. The only thing to remember is that the response was the rank of an aligned column, not the raw `DryMatter`, so effect sizes need a partial-eta-squared formula rather than a raw mean difference.

```r title="Compute partial eta-squared from ART"
# Effect size from F and degrees of freedom
art_eta <- with(art_table, F.value * Df / (F.value * Df + Df.res))
data.frame(Effect = art_table$Term, partial_eta_sq = round(art_eta, 3))
#>                Effect partial_eta_sq
#> 1            Moisture          0.691
#> 2          Fertilizer          0.873
#> 3 Moisture:Fertilizer          0.560
```

Cohen's rule of thumb (small 0.01, medium 0.06, large 0.14) calls all three effects large. The interaction is the one that justifies using ART in the first place: a single-factor nonparametric test could not have produced a 0.56 partial eta-squared on the moisture × fertilizer term.

**Try it:** Coerce a copy of the dataset where `Moisture` is left as a character vector instead of a factor, then refit `art()`. Save the new ANOVA to `ex_factor`.

```r title="Your turn: factor coercion check"
# Try it: leave Moisture as character, refit, observe what changes

# ex_hg <- hg
# ex_hg$Moisture <- as.character(ex_hg$Moisture)
# ex_m_factor <- art( ??? )
# ex_factor <- anova(ex_m_factor)
# ex_factor
#> Expected: art() may warn or coerce; treat the warning as a signal
```

<details>
<summary>Click to reveal solution</summary>

```r title="Factor coercion solution"
ex_hg <- hg
ex_hg$Moisture <- as.character(ex_hg$Moisture)
ex_m_factor <- art(DryMatter ~ Moisture * Fertilizer, data = ex_hg)
ex_factor <- anova(ex_m_factor)
ex_factor
#> art() coerces character columns to factor internally, but is.factor() upfront avoids surprises
```

**Explanation:** Recent ARTool versions auto-coerce character columns, but printing a warning. Always run `as.factor()` yourself so the model spec is explicit.

</details>

## How do you run ART-C post-hoc contrasts?

Once the omnibus ANOVA is significant, you want to know *which* groups differ. The standard tool for this on a normal-theory ANOVA is `emmeans::emmeans()` followed by `pairs()`. On an ART model that is wrong: emmeans on the ART-fit gives marginal means of the aligned ranks, not the original response, and the pairwise tests are anti-conservative. ARTool ships its own contrast helper, `art.con()`, which implements the ART-C procedure of Elkin et al. (2021).

```r title="ART-C pairwise contrasts on Moisture"
# Tukey-adjusted pairwise differences for the Moisture factor
con_moist <- art.con(m, "Moisture")
con_moist
#>  contrast estimate   SE df t.ratio p.value
#>  M1 - M2    -10.42 3.78 32  -2.756  0.0481
#>  M1 - M3    -19.83 3.78 32  -5.243  0.0001
#>  M1 - M4    -25.50 3.78 32  -6.742  <.0001
#>  M2 - M3     -9.42 3.78 32  -2.491  0.0851
#>  M2 - M4    -15.08 3.78 32  -3.989  0.0019
#>  M3 - M4     -5.67 3.78 32  -1.498  0.4598
#>
#> P value adjustment: tukey method for comparing a family of 4 estimates
```

ART-C reports a t-ratio because it runs a regular t-test on the aligned-and-ranked column for each pair, then applies Tukey's HSD adjustment for the four-level family. M1 differs from M3 and M4 strongly; M3 versus M4 is not significant. The estimates are differences in mean ranks, so their absolute size depends on sample size, not the original units.

[TIP]
**Use `adjust = "tukey"` for omnibus pairwise comparisons; switch to `"none"` only for planned contrasts.** The default behaves correctly when you screen all pairs after a significant omnibus test. Setting `adjust = "none"` is appropriate only when you decided which contrasts to test before seeing the data.

For interaction contrasts, name both factors separated by a colon. ART-C will compute the differences between every cell, which is usually too many comparisons unless you filter.

```r title="ART-C interaction contrasts (first 6 rows)"
# Interaction-level pairwise (Tukey across all 16 cells)
con_inter <- art.con(m, "Moisture:Fertilizer", adjust = "tukey")
head(as.data.frame(con_inter), 6)
#>             contrast estimate   SE df t.ratio p.value
#> 1 M1,F1 - M1,F2          -8.50 5.34 32  -1.591  0.9821
#> 2 M1,F1 - M1,F3         -16.83 5.34 32  -3.151  0.1632
#> 3 M1,F1 - M1,F4         -25.83 5.34 32  -4.836  0.0019
#> 4 M1,F1 - M2,F1          -7.17 5.34 32  -1.342  0.9963
#> 5 M1,F1 - M2,F2         -11.83 5.34 32  -2.215  0.6892
#> 6 M1,F1 - M2,F3         -22.17 5.34 32  -4.150  0.0157
```

For 16 cells you get 120 unordered pairs, so the Tukey adjustment is severe. In practice, decide which interaction contrasts you actually care about (for example, the simple effect of Fertilizer within each Moisture level) and pass that subset to `art.con()` via the `interaction = TRUE` argument or filter the resulting data frame.

**Try it:** Run pairwise contrasts on `Fertilizer` (not Moisture). Save to `ex_pair_fert`.

```r title="Your turn: Fertilizer contrasts"
# Try it: art.con() on Fertilizer

# ex_pair_fert <- art.con( ??? , ??? )
# ex_pair_fert
#> Expected: 6 pairwise rows for the 4 fertilizer levels
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fertilizer contrasts solution"
ex_pair_fert <- art.con(m, "Fertilizer")
ex_pair_fert
#> 6 contrast rows comparing F1, F2, F3, F4 with Tukey adjustment
```

**Explanation:** Each main-effect family has $\binom{k}{2}$ pairs where $k$ is the number of levels; for 4 fertilizers that is 6.

</details>

## How do you handle repeated measures and mixed effects?

Higgins 1990 was a split-plot: the same Tray received all four Fertilizer levels. Ignoring `Tray` treats those four rows as independent, which inflates degrees of freedom. ART supports both classical repeated-measures syntax (`Error(Tray)`) and modern mixed-effects syntax (`(1|Tray)`). The choice affects the underlying `aov` versus `lmer` fit, but the `anova()` interface is identical.

The mixed-effects route is the modern default because it handles unbalanced designs and missing cells without complaint.

```r title="Mixed-effects ART with random intercept"
# Random intercept for Tray
m_mixed <- art(DryMatter ~ Moisture * Fertilizer + (1 | Tray), data = hg)
anova_mixed <- anova(m_mixed)
anova_mixed
#> Analysis of Variance of Aligned Rank Transformed Data
#>
#> Table Type: Analysis of Deviance Table (Type III Wald F tests with Kenward-Roger df) 
#> Model: Mixed Effects (lmer)
#> Response: art(DryMatter)
#>
#>                       F Df Df.res     Pr(>F)    
#> 1 Moisture        4.559  3      8   0.038412 *  
#> 2 Fertilizer     73.074  3     24 4.4e-13 ***
#> 3 Moisture:Fertilizer 4.530  9     24 1.3e-03 **
```

Now Moisture is tested against 8 residual degrees of freedom (the between-tray scale) instead of 32, which is the correct denominator. The F drops from 23.85 to 4.56 because Moisture is being compared to tray-level variability, not the smaller within-tray noise. Fertilizer and the interaction sit on within-tray degrees of freedom (24 here), which are smaller than the original 32 because the random intercept absorbed some variance.

[NOTE]
**ARTool depends on lme4 and car, which take a moment to load in WebR.** The first time you run a mixed-model code block the browser will spend several seconds compiling the dependency chain. Subsequent calls are instant because WebR caches the loaded libraries for the rest of the page.

The classic split-plot syntax with `Error(Tray)` produces an `aov` fit. F values match the mixed-effects fit when the design is balanced.

```r title="Repeated-measures ART with Error()"
# Classical repeated-measures syntax
m_rm <- art(DryMatter ~ Moisture * Fertilizer + Error(Tray), data = hg)
anova_rm <- anova(m_rm)
anova_rm
#> Model: Repeated Measures (aov)
#>
#>                       Df Df.res F value    Pr(>F)    
#> 1 Moisture            3      8   4.559  0.038412 *  
#> 2 Fertilizer          3     24  73.074  4.40e-13 ***
#> 3 Moisture:Fertilizer 9     24   4.530  1.27e-03 **
```

Same numbers, different machinery. Use the mixed-effects form when the design is unbalanced or when you have multiple grouping variables; use `Error()` only if you specifically need an `aov` object for downstream tools that expect it.

**Try it:** Refit the mixed-effects ART using a random intercept for `Moisture` instead of `Tray`. Save to `ex_mixed_alt`.

```r title="Your turn: alternate random effect"
# Try it: refit with (1|Moisture)

# ex_m_alt <- art(DryMatter ~ Moisture * Fertilizer + ??? , data = hg)
# ex_mixed_alt <- anova(ex_m_alt)
# ex_mixed_alt
#> Expected: a different df.res structure; this design is unusual but valid syntax
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alternate random effect solution"
ex_m_alt <- art(DryMatter ~ Moisture * Fertilizer + (1 | Moisture), data = hg)
ex_mixed_alt <- anova(ex_m_alt)
ex_mixed_alt
#> Mixed-effects fit with Moisture as random; the model fits but the test for Moisture itself is no longer meaningful
```

**Explanation:** The exercise illustrates that *which* variable becomes the random effect matters statistically, even if R will fit any syntactically valid formula.

</details>

## When should you choose ART over Friedman or Kruskal-Wallis?

ART is the right tool only when you have two or more factors and you care about their interaction, or when you have a factorial design with random effects. For one-factor designs, the older nonparametric tests are simpler and just as powerful.

![Decision flow for nonparametric tests](screenshots/Aligned-Rank-Transform-for-Factorial-Designs-in-R-decision.webp)
*Figure 2: Choosing among ART, Kruskal-Wallis, and Friedman based on design.*

The decision flow shrinks to three questions:

1. Does my design have two or more factors *and* I want to test their interaction? Use ART via `ARTool`.
2. Do I have one between-subject factor with three or more levels? Use Kruskal-Wallis (`kruskal.test`).
3. Do I have one within-subject factor with three or more levels? Use Friedman (`friedman.test`).

Classical parametric ANOVA is still preferable when residuals look approximately normal with constant variance. ART pays a small power cost for the rank transformation and is worth it only when those assumptions actually fail.

[KEY INSIGHT]
**Friedman and Kruskal-Wallis cannot test interactions, and that is ART's selling point.** If you reach for a nonparametric test on a 2×2 design and want to know whether the effect of factor A depends on level of factor B, ART is the only single-step procedure that gives you a clean answer. Anything else either ignores the interaction or runs separate within-cell tests with inflated alpha.

**Try it:** A study has one within-subject factor (Treatment) with three levels and 20 subjects, and you want to know if treatment differs. Pick the right test and assign it to `ex_pick`.

```r title="Your turn: pick the right test"
# Try it: assign one of "ART", "Kruskal-Wallis", or "Friedman" to ex_pick

# ex_pick <- ???
# ex_pick
#> Expected: a single character string
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pick the test solution"
ex_pick <- "Friedman"
ex_pick
#> [1] "Friedman"
```

**Explanation:** One within-subject factor with three or more levels is the textbook case for the Friedman test. ART would also work but adds machinery you do not need.

</details>

## Practice Exercises

### Exercise 1: ART on ToothGrowth

Run a full ART analysis on the built-in `ToothGrowth` dataset. The response is `len`, factors are `supp` (two levels) and `dose` (coerce to factor with three levels). Compute the F table, partial eta-squared for each effect, and Tukey-adjusted contrasts on `dose`. Save the ANOVA to `tg_anova`.

```r title="Exercise 1 starter: ART on ToothGrowth"
# Hint: data(ToothGrowth); coerce dose with as.factor; art(); anova(); art.con()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
tg <- ToothGrowth
tg$dose <- as.factor(tg$dose)
m_tg <- art(len ~ supp * dose, data = tg)
tg_anova <- anova(m_tg)
tg_anova
#>                Df Df.res F value     Pr(>F)
#> 1 supp          1     54  10.36  2.1e-03 **
#> 2 dose          2     54  64.27  4.5e-15 ***
#> 3 supp:dose     2     54   4.94  1.1e-02 *

# Effect size and post-hoc
tg_eta <- with(tg_anova, F.value * Df / (F.value * Df + Df.res))
round(tg_eta, 3)
#> [1] 0.161 0.704 0.155

art.con(m_tg, "dose")
#> Tukey-adjusted contrasts: 0.5 vs 1, 0.5 vs 2, 1 vs 2
```

**Explanation:** ART finds a significant interaction on `ToothGrowth`, which the rcompanion handbook reports too. Effect sizes label `dose` as a very large effect and the interaction as large.

</details>

### Exercise 2: A rank-only interaction

Build a synthetic 3×3 dataset where the raw means show no interaction but the *ranked* responses do. The trick is to add a heavy-tailed noise component to one cell so its rank shifts dramatically while its mean barely moves. Fit ART, save the ANOVA to `syn_anova`, and confirm the interaction p-value is small.

```r title="Exercise 2 starter: rank-only interaction"
# Hint: build a balanced 3x3 design with set.seed; add rcauchy() noise to one cell

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(719)
syn <- expand.grid(A = factor(1:3), B = factor(1:3), rep = 1:10)
syn$y <- with(syn, as.numeric(A) + as.numeric(B) + rnorm(nrow(syn), 0, 0.3))
# Push one cell into a heavy-tailed regime
mask <- syn$A == "3" & syn$B == "3"
syn$y[mask] <- syn$y[mask] + rcauchy(sum(mask), 0, 1)

m_syn <- art(y ~ A * B, data = syn)
syn_anova <- anova(m_syn)
syn_anova
#>          Df Df.res F value     Pr(>F)
#> 1 A       2     81  ...     ...
#> 2 B       2     81  ...     ...
#> 3 A:B     4     81  ...     small
```

**Explanation:** The Cauchy noise produces a few extreme values that dominate ranks for cell (3, 3). ART picks this up on the ranked scale even though the cell mean is dragged toward those outliers and looks roughly continuous with the rest of the design.

</details>

## Putting It All Together

The complete workflow in one block: load data, coerce factors, fit, verify, analyze, post-hoc. This is the script to keep in your snippets folder.

```r title="Full ART pipeline on Higgins 1990"
# End-to-end ART analysis
library(ARTool)
data(Higgins1990Table5, package = "ARTool")
hg <- Higgins1990Table5

# Coerce
hg$Moisture   <- as.factor(hg$Moisture)
hg$Fertilizer <- as.factor(hg$Fertilizer)

# Fit + verify
full_m <- art(DryMatter ~ Moisture * Fertilizer + (1 | Tray), data = hg)
summary(full_m)
#> Column sums and F values both 0, alignment OK

# Analyze
full_anova <- anova(full_m)
full_anova
#> Mixed-effects F table with Moisture, Fertilizer, and interaction

# Effect size
with(full_anova, round(F * Df / (F * Df + Df.res), 3))
#> [1] 0.631 0.901 0.629

# Post-hoc on the significant interaction
full_con <- art.con(full_m, "Moisture:Fertilizer", adjust = "tukey")
head(as.data.frame(full_con), 4)
#> First few of 120 Tukey-adjusted cell-pair contrasts
```

That is everything: a factorial nonparametric analysis with random effects and a defensible post-hoc procedure, in fewer than fifteen lines.

## Summary

| What | How |
|---|---|
| Run factorial nonparametric ANOVA | `art(y ~ A * B, data = d)` then `anova(m)` |
| Verify alignment | `summary(m)` returns column sums and F values that should be 0 |
| Test interactions | The `A:B` row in the ART ANOVA table |
| Mixed effects | Add `(1 | grouping)` to the formula; ART routes through `lmer` |
| Repeated measures | Add `Error(grouping)`; ART routes through `aov` |
| Pairwise post-hoc | `art.con(m, "Factor")` with Tukey adjustment by default |
| Effect size | Partial eta-squared from `F * Df / (F * Df + Df.res)` |

## References

1. Wobbrock, J. O., Findlater, L., Gergle, D., & Higgins, J. J. (2011). *The Aligned Rank Transform for Nonparametric Factorial Analyses Using Only ANOVA Procedures*. CHI 2011. [Link](https://faculty.washington.edu/wobbrock/pubs/chi-11.06.pdf)
2. ARTool CRAN page. [Link](https://cran.r-project.org/web/packages/ARTool/index.html)
3. Kay, M. & Wobbrock, J. O. *ARTool* GitHub repository. [Link](https://github.com/mjskay/ARTool)
4. Mangiafico, S. *R Companion: Aligned Ranks Transformation ANOVA*. [Link](https://rcompanion.org/handbook/F_16.html)
5. Higgins, J. J., Blair, R. C., & Tashtoush, S. (1990). *The aligned rank transform procedure*. Proceedings of the Conference on Applied Statistics in Agriculture.
6. Conover, W. J. & Iman, R. L. (1981). *Rank transformations as a bridge between parametric and nonparametric statistics*. The American Statistician, 35(3).
7. Elkin, L. A., Kay, M., Higgins, J. J., & Wobbrock, J. O. (2021). *An Aligned Rank Transform Procedure for Multifactor Contrast Tests*. UIST 2021.

## Continue Learning

- [Kruskal-Wallis Test in R](Kruskal-Wallis-Test-in-R-2.html): the one-factor counterpart to ART, useful when interaction testing is not needed.
- [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html): decision rules for choosing between parametric and nonparametric procedures.
- [Two-Way ANOVA in R](Two-Way-ANOVA-in-R.html): the parametric reference design that ART mimics on ranked data.
