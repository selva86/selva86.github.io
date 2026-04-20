---
title: "ANOVA Exercises in R: 15 One-Way & Two-Way Practice Problems, Solved Step-by-Step"
slug: ANOVA-Exercises-in-R
description: "15 ANOVA exercises in R with runnable solutions covering one-way, two-way, interactions, Tukey HSD, Levene's, Welch's ANOVA, contrasts, and effect size."
keywords: "ANOVA exercises in R, one-way ANOVA practice, two-way ANOVA R, ANOVA interaction effects, Tukey HSD R, Welch's ANOVA, Levene's test R, aov() examples, ANOVA effect size, ANOVA practice problems"
auto_link_terms: "ANOVA exercises|ANOVA practice problems|ANOVA exercises in R|ANOVA practice|one-way ANOVA exercises|two-way ANOVA exercises|ANOVA problems"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: E7.1
post_type: EX
sidebar_title: "ANOVA Exercises (15 problems)"
fr_parent: One-Way-ANOVA-in-R.html
difficulty: Intermediate
---

# ANOVA Exercises in R: 15 One-Way & Two-Way Practice Problems, Solved Step-by-Step

<p class="lead">These 15 ANOVA exercises in R cover one-way and two-way designs with runnable solutions, so you practise picking the right model, checking assumptions, interpreting F and p, running Tukey post-hoc, reading interaction effects, and reporting effect sizes end-to-end.</p>

## Which ANOVA design matches your data?

One R function, three different ANOVA designs. `aov()` fits a one-way ANOVA when the right-hand side has a single factor, a two-way additive model when you use `+`, and a full factorial model with interaction when you use `*`. The decision hinges on how many grouping variables you have and whether they might interact. Here is the same function used all three ways on the `ToothGrowth` dataset so you can see the shape of each output before drilling into the 15 exercises.

```r title="Three ANOVA designs on one dataset"
# One factor: does supplement type affect tooth growth?
aov_oneway <- aov(len ~ supp, data = ToothGrowth)
summary(aov_oneway)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> supp         1  205.4   205.4   3.668 0.0604 .
#> Residuals   58 3246.9    56.0

# Two factors, additive: supplement and dose together
aov_add <- aov(len ~ supp + factor(dose), data = ToothGrowth)
summary(aov_add)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> supp          1  205.4   205.4   14.02  0.00043 ***
#> factor(dose)  2 2426.4  1213.2   82.81  < 2e-16 ***
#> Residuals    56  820.4    14.7

# Two factors with interaction: does dose effect depend on supplement?
aov_int <- aov(len ~ supp * factor(dose), data = ToothGrowth)
summary(aov_int)
#>                   Df Sum Sq Mean Sq F value   Pr(>F)
#> supp               1  205.4   205.4   15.57  0.00023 ***
#> factor(dose)       2 2426.4  1213.2   92.00  < 2e-16 ***
#> supp:factor(dose)  2  108.3    54.2    4.11   0.0219 *
#> Residuals         54  712.1    13.2
```

All three fits use the same function on the same data, only the formula changes. The one-way model looks at supplement alone and barely reaches significance (p = 0.060). Adding dose as a second factor reveals what was hidden: supplement does matter once you account for dose (p = 0.0004), and dose itself is massively significant. The interaction model adds one more row, `supp:factor(dose)` with p = 0.022, which says the effect of supplement is not the same at every dose level. The formula operator is all that changed, but the scientific conclusion changed with it.

Here is the one-line decision rule:

| Your design... | Formula | Fits |
|---|---|---|
| One grouping factor | `y ~ g` | One-way ANOVA |
| Two factors, no interaction assumed | `y ~ g1 + g2` | Two-way additive |
| Two factors, interaction allowed | `y ~ g1 * g2` | Two-way with interaction |
| Three factors with full interactions | `y ~ g1 * g2 * g3` | Three-way factorial |

[KEY INSIGHT]
**An interaction term asks: does the effect of one factor depend on the level of the other?** If `supp:dose` is significant, the OJ-vs-VC difference is not the same at every dose. If it's non-significant, the additive model is enough and you can report main effects cleanly. Always fit the interaction first, then drop it only if it is clearly not needed.

**Try it:** You have three grouping variables `a`, `b`, `c` and you want every two-way interaction but not the three-way. Which formula do you use? Set `ex_formula` to the correct string.

```r title="Your turn: pick the right formula"
# Try it: main effects + all 2-way interactions, no 3-way
ex_formula <- "___"   # replace with the right formula string
ex_formula
#> Expected: "y ~ (a + b + c)^2"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-way interactions only solution"
ex_formula <- "y ~ (a + b + c)^2"
ex_formula
#> [1] "y ~ (a + b + c)^2"
```

**Explanation:** The `^2` operator expands to all main effects plus every two-way interaction but stops short of higher-order terms. `y ~ a * b * c` would give you all three main effects, all three two-way interactions, *and* the three-way interaction. Using `^2` is the clean way to cap interaction order.

</details>

## How do you read aov() output and follow up with post-hoc?

`summary(aov_fit)` prints one row per effect and one residual row. The columns are always `Df` (degrees of freedom), `Sum Sq` (sum of squares, how much variation the effect explains), `Mean Sq` (sum of squares divided by df), `F value` (effect mean square over residual mean square), and `Pr(>F)` (the p-value). ANOVA only tells you *whether* the group means differ, not *which pairs* differ. For that you need a post-hoc test like Tukey's HSD.

```r title="Read the ANOVA table and run Tukey post-hoc"
# Fit one-way ANOVA on PlantGrowth (three treatment groups)
pg_fit <- aov(weight ~ group, data = PlantGrowth)
summary(pg_fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> group        2  3.766  1.8832   4.846 0.0159 *
#> Residuals   27 10.492  0.3886

# Which pairs of groups actually differ?
pg_tukey <- TukeyHSD(pg_fit)
pg_tukey
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = weight ~ group, data = PlantGrowth)
#>
#> $group
#>             diff        lwr       upr     p adj
#> trt1-ctrl -0.371 -1.0622161 0.3202161 0.3908711
#> trt2-ctrl  0.494 -0.1972161 1.1852161 0.1979960
#> trt2-trt1  0.865  0.1737839 1.5562161 0.0120030
```

The ANOVA row says *some* group differs (F(2, 27) = 4.85, p = 0.016), but it does not say *which*. Tukey's HSD fills that gap with all three pairwise comparisons, a `diff` (mean difference), a 95% confidence interval (`lwr`, `upr`), and a family-wise-adjusted p-value (`p adj`). Only `trt2-trt1` is significant (p = 0.012), the 0.87 gram difference in plant weight between the two treatments is real. `trt2-ctrl` and `trt1-ctrl` both fail to reach significance on their own. The family-wise adjustment is what keeps the overall false-positive rate at 5% despite running three tests.

Here are the five columns of the summary table you need to know:

| Column | What it is | How to read it |
|---|---|---|
| `Df` | Degrees of freedom for the effect | Groups − 1 for one-way |
| `Sum Sq` | Variation explained by the effect | Bigger is more explanatory |
| `Mean Sq` | Sum Sq divided by Df | Variance-like quantity |
| `F value` | Effect MS over residual MS | Bigger → stronger signal |
| `Pr(>F)` | Tail probability under H₀ | The decision number |

[WARNING]
**`summary(aov_fit)` and `anova(lm_fit)` can give different answers for unbalanced two-way designs.** `aov()` uses Type I (sequential) sums of squares, so the order of factors in the formula changes the p-values. When your design is unbalanced, switch to `car::Anova(fit, type = 2)` or `type = 3` to get order-independent tests. For balanced designs (equal cells), all three types agree.

[TIP]
**`broom::tidy()` converts any `aov` or `TukeyHSD` object into a tidy data frame.** `broom::tidy(pg_fit)` gives one row per term with `statistic` and `p.value` columns; `broom::tidy(pg_tukey)` gives one row per pair. Much easier to slot into reports or combine across models than parsing `summary()` text.

**Try it:** Extract just the adjusted p-value for the `trt2-trt1` comparison from `pg_tukey`. Save it to `ex_p`.

```r title="Your turn: pull one Tukey p-value"
# Try it: grab the p adj for trt2 vs trt1
ex_p <- pg_tukey$group[___, "p adj"]   # fill in the row selector
ex_p
#> Expected: about 0.012
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tukey p-value solution"
ex_p <- pg_tukey$group["trt2-trt1", "p adj"]
ex_p
#> [1] 0.01200295
```

**Explanation:** `pg_tukey$group` is a plain matrix with named rows. You can index it either by name (`"trt2-trt1"`) or by position (`3`). The name-based index is self-documenting and survives re-ordering, so prefer it for reporting code.

</details>

## Practice Exercises

Fifteen capstone problems, ordered roughly easier to harder. Every exercise uses a distinct `ex<N>_` prefix so the solutions do not clobber tutorial variables.

### Exercise 1: One-way ANOVA on PlantGrowth

Fit a one-way ANOVA predicting `weight` from `group` on the built-in `PlantGrowth` dataset. Save the fit to `ex1_fit` and print the summary. State whether you reject H₀ at α = 0.05.

```r title="Exercise 1 starter: PlantGrowth one-way"
# Exercise 1: one-way ANOVA on PlantGrowth
# Hint: aov(weight ~ group, data = PlantGrowth), then summary()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_fit <- aov(weight ~ group, data = PlantGrowth)
summary(ex1_fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> group        2  3.766  1.8832   4.846 0.0159 *
#> Residuals   27 10.492  0.3886
```

**Explanation:** F(2, 27) = 4.85 with p = 0.016 rejects the null that all three group means are equal. The three groups (control, treatment 1, treatment 2) do not all produce the same mean weight. Exercises 5 and 6 will locate which pair is responsible.

</details>

### Exercise 2: Fit the same one-way ANOVA as a linear model

ANOVA is a linear model with a categorical predictor. Refit Exercise 1 using `lm()`, run `anova()` on it, and verify the F statistic and p-value match.

```r title="Exercise 2 starter: lm equivalent"
# Exercise 2: same model via lm() + anova()
# Hint: lm(weight ~ group, data = PlantGrowth), then anova()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_lm <- lm(weight ~ group, data = PlantGrowth)
anova(ex2_lm)
#> Analysis of Variance Table
#>
#> Response: weight
#>           Df  Sum Sq Mean Sq F value  Pr(>F)
#> group      2  3.7663 1.88313  4.8461 0.01591 *
#> Residuals 27 10.4921 0.38860
```

**Explanation:** F = 4.85, p = 0.016, identical to `summary(ex1_fit)`. ANOVA is a reparametrisation of a linear regression where the predictor is categorical. Once you internalise this, techniques like `emmeans`, `contrasts()`, and `predict()` become available for ANOVA-style analyses too.

</details>

[KEY INSIGHT]
**Every ANOVA is a linear model with categorical predictors under the hood.** `aov()` is a thin wrapper around `lm()` that reformats the output as an ANOVA table. This means the full R modelling ecosystem, residual plots, `predict()`, `emmeans`, robust standard errors, applies to ANOVA too. Memorising one framework unlocks both.

### Exercise 3: Check equal-variance assumption with Levene's test

One-way ANOVA assumes homogeneous variances across groups. Use `car::leveneTest` to test that assumption on PlantGrowth. Save the result to `ex3_lev` and state whether the assumption is met at α = 0.05.

```r title="Exercise 3 starter: Levene's test"
# Exercise 3: Levene's test for homogeneity of variance
library(car)
# Hint: leveneTest(weight ~ group, data = PlantGrowth)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
library(car)
ex3_lev <- leveneTest(weight ~ group, data = PlantGrowth)
ex3_lev
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  2  1.1192 0.3412
#>       27
```

**Explanation:** Levene's p = 0.34 fails to reject equal variances, so the standard ANOVA's homoscedasticity assumption is safe for PlantGrowth. If Levene's had been significant, you would switch to Welch's one-way ANOVA (next exercise) instead of `aov()`.

</details>

### Exercise 4: Welch's one-way ANOVA (unequal variances)

When Levene's test flags unequal variances, `oneway.test()` with `var.equal = FALSE` (the default) runs Welch's approximation, which does not assume homoscedasticity. Run it on PlantGrowth and compare the F statistic to the standard ANOVA from Exercise 1.

```r title="Exercise 4 starter: Welch's one-way"
# Exercise 4: Welch's one-way ANOVA
# Hint: oneway.test(weight ~ group, data = PlantGrowth)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_w <- oneway.test(weight ~ group, data = PlantGrowth)
ex4_w
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  weight and group
#> F = 5.181, num df = 2.000, denom df = 17.129, p-value = 0.01739
```

**Explanation:** Welch's F = 5.18 with p = 0.017, very close to the standard ANOVA's F = 4.85 and p = 0.016. When variances are roughly equal (as Levene's confirmed), Welch's and classical ANOVA agree. When variances differ sharply, Welch's is the safer default, it adjusts the denominator df downward to protect the error rate.

</details>

### Exercise 5: TukeyHSD post-hoc on PlantGrowth

Rejecting ANOVA's null tells you *some* groups differ but not which. Run `TukeyHSD()` on `ex1_fit` and identify the pair with the smallest adjusted p-value.

```r title="Exercise 5 starter: Tukey post-hoc"
# Exercise 5: TukeyHSD on ex1_fit
# Hint: TukeyHSD(ex1_fit)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_tuk <- TukeyHSD(ex1_fit)
ex5_tuk
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = weight ~ group, data = PlantGrowth)
#>
#> $group
#>             diff        lwr       upr     p adj
#> trt1-ctrl -0.371 -1.0622161 0.3202161 0.3908711
#> trt2-ctrl  0.494 -0.1972161 1.1852161 0.1979960
#> trt2-trt1  0.865  0.1737839 1.5562161 0.0120030
```

**Explanation:** Only `trt2 − trt1 = 0.865` grams reaches significance (p adj = 0.012). Neither treatment differs from the control on its own. Tukey's HSD adjusts all three p-values so the family-wise Type I rate stays at 5%. Without that correction, running three naive t-tests inflates the false-positive rate to about 14%.

</details>

### Exercise 6: Pairwise t-tests with Bonferroni adjustment

Run `pairwise.t.test()` with `p.adjust.method = "bonferroni"` on PlantGrowth and compare the adjusted p-values to Tukey's.

```r title="Exercise 6 starter: Bonferroni pairwise"
# Exercise 6: pairwise t-tests with Bonferroni
# Hint: pairwise.t.test(PlantGrowth$weight, PlantGrowth$group, p.adjust.method = "bonferroni")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_pw <- pairwise.t.test(PlantGrowth$weight,
                          PlantGrowth$group,
                          p.adjust.method = "bonferroni")
ex6_pw
#>
#> 	Pairwise comparisons using t tests with pooled SD
#>
#> data:  PlantGrowth$weight and PlantGrowth$group
#>
#>      ctrl  trt1
#> trt1 0.583 -
#> trt2 0.263 0.013
#>
#> P value adjustment method: bonferroni
```

**Explanation:** Bonferroni and Tukey both flag `trt2 vs trt1` (p = 0.013 Bonferroni, 0.012 Tukey) and leave the other two comparisons non-significant. Bonferroni is more conservative in general (multiplies each p-value by the number of comparisons), but with only three pairs the two adjustments converge. For many comparisons, Tukey's HSD usually beats Bonferroni on power.

</details>

### Exercise 7: Effect size, eta-squared by hand and via a package

The F statistic and p-value tell you whether the effect is real, not how big it is. Eta-squared (η²) is the proportion of total variance explained by the group factor. Compute it two ways: from the ANOVA sums of squares by hand, and with `effectsize::eta_squared()`. Compare the two.

The formula:

$$\eta^2 = \dfrac{\text{SS}_{\text{effect}}}{\text{SS}_{\text{total}}}$$

Where:
- $\text{SS}_{\text{effect}}$ is the effect's sum of squares from the ANOVA table
- $\text{SS}_{\text{total}}$ is the total sum of squares, effect plus residual

```r title="Exercise 7 starter: eta-squared"
# Exercise 7: eta-squared two ways
library(effectsize)
# Hint: SS_effect / (SS_effect + SS_residual)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
library(effectsize)

# By hand from ex1_fit
ex7_ss <- summary(ex1_fit)[[1]][, "Sum Sq"]
ex7_eta_manual <- ex7_ss[1] / sum(ex7_ss)
round(ex7_eta_manual, 3)
#> [1] 0.264

# From the package
ex7_eta_pkg <- eta_squared(ex1_fit)
ex7_eta_pkg
#> # Effect Size for ANOVA
#>
#> Parameter | Eta2 |       95% CI
#> -------------------------------
#> group     | 0.26 | [0.01, 1.00]
```

**Explanation:** η² = 3.77 / (3.77 + 10.49) = 0.264, matching the package. About 26% of the variance in plant weight is explained by the group factor. Cohen's rough thresholds are 0.01 (small), 0.06 (medium), 0.14 (large), so 0.26 is a large effect, the significant p-value is backed by a meaningful magnitude.

</details>

### Exercise 8: Two-way additive ANOVA on ToothGrowth

Fit `aov(len ~ supp + factor(dose))` on `ToothGrowth`. Save to `ex8_fit`, print the summary, and report which main effects are significant.

```r title="Exercise 8 starter: two-way additive"
# Exercise 8: additive two-way model
# Hint: aov(len ~ supp + factor(dose), data = ToothGrowth)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_fit <- aov(len ~ supp + factor(dose), data = ToothGrowth)
summary(ex8_fit)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> supp          1  205.4   205.4   14.02  0.00043 ***
#> factor(dose)  2 2426.4  1213.2   82.81  < 2e-16 ***
#> Residuals    56  820.4    14.7
```

**Explanation:** Both main effects are highly significant. Supplement type contributes F = 14.0 (p < 0.001), and dose is enormous at F = 82.8 (p < 2e-16). This model assumes the supplement effect is the same at every dose (no interaction). Exercise 9 relaxes that assumption.

</details>

### Exercise 9: Two-way ANOVA with interaction

Re-fit the Exercise 8 model allowing interaction: `len ~ supp * factor(dose)`. Save as `ex9_fit`. Is the interaction significant? What does that mean scientifically?

```r title="Exercise 9 starter: two-way with interaction"
# Exercise 9: factorial with interaction
# Hint: aov(len ~ supp * factor(dose), data = ToothGrowth)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_fit <- aov(len ~ supp * factor(dose), data = ToothGrowth)
summary(ex9_fit)
#>                   Df Sum Sq Mean Sq F value   Pr(>F)
#> supp               1  205.4   205.4   15.57  0.00023 ***
#> factor(dose)       2 2426.4  1213.2   92.00  < 2e-16 ***
#> supp:factor(dose)  2  108.3    54.2    4.11   0.0219 *
#> Residuals         54  712.1    13.2
```

**Explanation:** The `supp:factor(dose)` interaction is significant (F = 4.11, p = 0.022). Scientifically, the OJ-vs-VC gap is not the same at every dose level. At low doses OJ substantially beats VC; at 2 mg, the two supplements produce similar growth. That nuance disappears in the additive model of Exercise 8, which is why you fit interactions first and drop them only when clearly unneeded.

</details>

[NOTE]
**If the interaction term is clearly non-significant (say p > 0.20) and residuals are clean, many applied statisticians drop it and report the additive model.** The trade-off: keeping a non-significant interaction costs you degrees of freedom and can shrink power for the main effects. Keep it if theory predicts an interaction or if you want to make "no interaction" an explicit finding.

### Exercise 10: Interaction plot

Visualise the interaction from Exercise 9 using `interaction.plot()`. Plot `factor(dose)` on the x-axis, `supp` as separate lines, and mean `len` on the y-axis.

```r title="Exercise 10 starter: interaction plot"
# Exercise 10: plot the interaction
# Hint: interaction.plot(x.factor, trace.factor, response)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
with(ToothGrowth,
     interaction.plot(x.factor    = factor(dose),
                      trace.factor = supp,
                      response     = len,
                      type         = "b",
                      col          = c("steelblue", "tomato"),
                      pch          = c(19, 17),
                      xlab         = "Dose (mg/day)",
                      ylab         = "Mean tooth length",
                      trace.label  = "Supplement"))
```

**Explanation:** Non-parallel lines indicate an interaction. The OJ line sits well above the VC line at 0.5 and 1.0 mg, then the two converge at 2.0 mg where both supplements hit the biological ceiling. Parallel lines would say the two supplements maintain the same gap across all doses, which is the additive model of Exercise 8. The visible convergence at 2.0 mg is exactly what the significant interaction term is detecting.

</details>

### Exercise 11: Simple-effects follow-up

When the interaction is significant, interpret each factor within levels of the other. Split `ToothGrowth` by `supp` and run a one-way ANOVA of `len ~ factor(dose)` within each subset. Save the fits to `ex11_oj` and `ex11_vc`.

```r title="Exercise 11 starter: simple effects"
# Exercise 11: one-way ANOVA of dose within each supp level
# Hint: subset(ToothGrowth, supp == "OJ"), then aov()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 11 solution"
ex11_oj <- aov(len ~ factor(dose), data = subset(ToothGrowth, supp == "OJ"))
summary(ex11_oj)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(dose)  2  885.3   442.6   32.02 4.72e-08 ***
#> Residuals    27  373.2    13.8

ex11_vc <- aov(len ~ factor(dose), data = subset(ToothGrowth, supp == "VC"))
summary(ex11_vc)
#>              Df Sum Sq Mean Sq F value Pr(>F)
#> factor(dose)  2 1649.5   824.7   67.07 3.36e-11 ***
#> Residuals    27  332.0    12.3
```

**Explanation:** Dose is strongly significant within each supplement, F = 32.0 for OJ and F = 67.1 for VC. Both supplements respond to dose, but the magnitude is larger for VC (higher F, bigger sum of squares). This is the numerical backing for the simple-effects interpretation: dose matters for both, but more steeply for VC, which is why the lines converge at the top.

</details>

### Exercise 12: Kruskal-Wallis, the non-parametric alternative

If residuals are badly non-normal and transformations do not help, Kruskal-Wallis replaces ANOVA without the normality assumption. Run `kruskal.test(weight ~ group, data = PlantGrowth)` and compare the decision to the standard ANOVA in Exercise 1.

```r title="Exercise 12 starter: Kruskal-Wallis"
# Exercise 12: non-parametric one-way
# Hint: kruskal.test(weight ~ group, data = PlantGrowth)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 12 solution"
ex12_kw <- kruskal.test(weight ~ group, data = PlantGrowth)
ex12_kw
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  weight by group
#> Kruskal-Wallis chi-squared = 7.9882, df = 2, p-value = 0.01842
```

**Explanation:** Kruskal-Wallis χ² = 7.99, p = 0.018, the same qualitative decision as ANOVA (p = 0.016). The rank-based test ignores the actual weight values and uses only their ranks, which costs some power when normality holds but pays off when distributions are skewed or have outliers. Use it as a robustness check and report both when they disagree.

</details>

### Exercise 13: Planned contrast on PlantGrowth

Run a planned contrast comparing group `trt2` to the average of `ctrl` and `trt1` using the `contrasts()` function. The contrast vector is `c(-1, -1, 2)` (scaled so it sums to zero).

```r title="Exercise 13 starter: planned contrast"
# Exercise 13: contrast trt2 vs mean of (ctrl, trt1)
# Hint: set contrasts(PlantGrowth$group) <- cbind(c(-1, -1, 2), c(-1, 1, 0))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 13 solution"
pg <- PlantGrowth
pg$group <- factor(pg$group)
contrasts(pg$group) <- cbind(
  trt2_vs_rest = c(-1, -1, 2),   # ctrl, trt1, trt2
  trt1_vs_ctrl = c(-1,  1, 0)
)

ex13_fit <- lm(weight ~ group, data = pg)
summary(ex13_fit)$coefficients
#>                    Estimate Std. Error    t value     Pr(>|t|)
#> (Intercept)         5.073000  0.1138648 44.5540175 3.361497e-26
#> grouptrt2_vs_rest   0.209500  0.0805050  2.6023284 1.489445e-02
#> grouptrt1_vs_ctrl  -0.185500  0.1394353 -1.3303460 1.945068e-01
```

**Explanation:** The `trt2_vs_rest` row tests whether `trt2`'s mean is different from the average of `ctrl` and `trt1`. With p = 0.015, it is. This is more powerful than the corresponding Tukey pairs because it asks one focused question per contrast instead of all pairwise differences. Planned contrasts must be specified before seeing the data to be valid, otherwise you are back in post-hoc territory.

</details>

### Exercise 14: Diagnostic plots for an ANOVA fit

Fit `aov(len ~ supp * factor(dose), data = ToothGrowth)` as `ex14_fit`, then produce the four standard diagnostic plots with `plot(ex14_fit)`. Comment briefly on the residuals-vs-fitted and the normal QQ plots.

```r title="Exercise 14 starter: diagnostics"
# Exercise 14: diagnostic plots
# Hint: par(mfrow = c(2, 2)); plot(ex14_fit)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 14 solution"
ex14_fit <- aov(len ~ supp * factor(dose), data = ToothGrowth)
par(mfrow = c(2, 2))
plot(ex14_fit)
par(mfrow = c(1, 1))
```

**Explanation:** The residuals-vs-fitted panel checks constant variance and should show a roughly horizontal cloud, no funnel or bow shape. The normal QQ plot checks residual normality, points should lie close to the diagonal line. On ToothGrowth the QQ plot is nearly straight with slight deviation in the tails, and the residuals cloud has no systematic pattern. ANOVA is fairly robust to mild deviations, so modest curvature is usually acceptable; major deviations point to a transformation or a non-parametric alternative.

</details>

### Exercise 15: Full report-ready pipeline

Combine everything into one pipeline on the `ToothGrowth` factorial design: fit the full interaction model, check Levene's, compute partial η², run TukeyHSD on the main effects, and tidy the ANOVA table with `broom::tidy()`.

```r title="Exercise 15 starter: full pipeline"
# Exercise 15: report-ready pipeline on ToothGrowth
library(broom)
# Hint: aov() -> leveneTest() -> eta_squared() -> TukeyHSD() -> tidy()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 15 solution"
library(broom)

# 1. Fit interaction model
ex15_fit <- aov(len ~ supp * factor(dose), data = ToothGrowth)

# 2. Equal variances?
leveneTest(len ~ supp * factor(dose), data = ToothGrowth)
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  5  1.7086 0.1484
#>       54

# 3. Partial eta-squared per term
eta_squared(ex15_fit, partial = TRUE)
#> # Effect Size for ANOVA (Type I)
#>
#> Parameter         | Eta2 (partial) |       95% CI
#> -------------------------------------------------
#> supp              |           0.22 | [0.07, 1.00]
#> factor(dose)      |           0.77 | [0.66, 1.00]
#> supp:factor(dose) |           0.13 | [0.00, 1.00]

# 4. Post-hoc on the dose main effect
TukeyHSD(ex15_fit, which = "factor(dose)")
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = len ~ supp * factor(dose), data = ToothGrowth)
#>
#> $`factor(dose)`
#>            diff       lwr       upr     p adj
#> 1-0.5    9.1300  6.362519 11.897481 0.0000000
#> 2-0.5   15.4950 12.727519 18.262481 0.0000000
#> 2-1      6.3650  3.597519  9.132481 0.0000030

# 5. Tidy ANOVA table
ex15_tidy <- tidy(ex15_fit)
ex15_tidy
#> # A tibble: 4 × 6
#>   term                 df sumsq meansq statistic    p.value
#>   <chr>             <dbl> <dbl>  <dbl>     <dbl>      <dbl>
#> 1 supp                  1  205.  205.       15.6  0.000231
#> 2 factor(dose)          2 2426. 1213.       92.0  0
#> 3 supp:factor(dose)     2  108.   54.2       4.11 0.0219
#> 4 Residuals            54  712.   13.2      NA   NA
```

**Explanation:** This is the full inferential workflow for a factorial design: check the assumption (Levene's p = 0.15, safe), fit the model, quantify each effect (dose is a huge partial η² of 0.77), pin down which dose levels differ (all three Tukey pairs are highly significant), and dump the whole ANOVA table into a tidy frame for downstream reporting. This one block is the template you can adapt to almost any two-factor experiment.

</details>

## Complete Example: warpbreaks Factorial Design

The `warpbreaks` dataset records the number of warp breaks per loom for two wool types (A, B) at three tension levels (L, M, H). This is a 2 × 3 factorial design, perfect for an end-to-end walkthrough.

```r title="End-to-end factorial ANOVA on warpbreaks"
# Step 1 - EDA with group means
with(warpbreaks, tapply(breaks, list(wool, tension), mean))
#>       L        M        H
#> A 44.55556 24.00000 24.55556
#> B 28.22222 28.77778 18.77778

# Step 2 - fit the factorial model
wb_fit <- aov(breaks ~ wool * tension, data = warpbreaks)
summary(wb_fit)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> wool          1    451   450.7   3.765 0.058213 .
#> tension       2   2034  1017.1   8.498 0.000693 ***
#> wool:tension  2   1003   501.4   4.189 0.021044 *
#> Residuals    48   5745   119.7

# Step 3 - check equal variances
leveneTest(breaks ~ wool * tension, data = warpbreaks)
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  5  1.2901 0.2847
#>       48

# Step 4 - effect size (partial eta-squared)
wb_v <- eta_squared(wb_fit, partial = TRUE)
wb_v
#> # Effect Size for ANOVA (Type I)
#>
#> Parameter    | Eta2 (partial) |       95% CI
#> --------------------------------------------
#> wool         |           0.07 | [0.00, 1.00]
#> tension      |           0.26 | [0.08, 1.00]
#> wool:tension |           0.15 | [0.01, 1.00]

# Step 5 - Tukey on tension (the cleanest main effect)
wb_tuk <- TukeyHSD(wb_fit, which = "tension")
wb_tuk
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = breaks ~ wool * tension, data = warpbreaks)
#>
#> $tension
#>           diff        lwr       upr     p adj
#> M-L -10.000000 -18.615043 -1.384957 0.0190396
#> H-L -14.722222 -23.337265 -6.107180 0.0004094
#> H-M  -4.722222 -13.337265  3.892821 0.3918731
```

[WARNING]
**Always inspect the interaction before reporting main effects.** Here the `wool:tension` interaction is significant (p = 0.021), which means the wool effect flips direction across tension levels (wool A is worse at L, similar at M, slightly better at H). Reporting only the main effect of wool would hide that reversal. Run simple effects or plot interaction means before drawing conclusions.

An APA-style summary for this analysis: *A two-way ANOVA examined the effects of wool type (A, B) and tension (L, M, H) on number of warp breaks per loom. Tension had a significant main effect, $F(2, 48) = 8.50, p < .001, \eta^2_p = .26$, and interacted significantly with wool, $F(2, 48) = 4.19, p = .021, \eta^2_p = .15$. Tukey HSD on the tension main effect showed medium and high tension produced significantly fewer breaks than low tension (both $p \leq .02$), while medium and high did not differ ($p = .39$).* That one paragraph communicates the design, the effects, their sizes, and the post-hoc landing, the ideal write-up for a factorial ANOVA.

## Summary

| Goal | R call | Key field |
|---|---|---|
| One-way ANOVA | `aov(y ~ g)` then `summary()` | `F value`, `Pr(>F)` |
| Two-way additive | `aov(y ~ g1 + g2)` | each main-effect row |
| Two-way with interaction | `aov(y ~ g1 * g2)` | `g1:g2` row |
| Variance check | `car::leveneTest(y ~ g, data)` | p > 0.05 is safe |
| Welch's (unequal variances) | `oneway.test(y ~ g)` | F, p |
| Post-hoc pairs | `TukeyHSD(fit)` | `p adj` column |
| Bonferroni pairs | `pairwise.t.test(y, g, p.adjust.method = "bonferroni")` | adjusted p-matrix |
| Non-parametric | `kruskal.test(y ~ g)` | chi-squared, p |
| Effect size | `effectsize::eta_squared(fit)` | Eta2 |
| Planned contrasts | `contrasts(g) <- cbind(...)` then `lm()` | per-contrast t, p |
| Tidy output | `broom::tidy(fit)` | data frame with one row per term |

## References

1. R Core Team. *aov: Fit an Analysis of Variance Model, R Stats Reference.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
2. Fox, J. & Weisberg, S. *An R Companion to Applied Regression*, 3rd edition. SAGE (2019). Source of `car::leveneTest` and `car::Anova`.
3. Tukey, J. W. "The Problem of Multiple Comparisons." Unpublished manuscript, Princeton University (1953).
4. Welch, B. L. "On the Comparison of Several Mean Values: An Alternative Approach." *Biometrika*, 38(3), 330-336 (1951).
5. Cohen, J. *Statistical Power Analysis for the Behavioral Sciences*, 2nd edition. Lawrence Erlbaum (1988). Source of eta-squared thresholds.
6. Kruskal, W. H. & Wallis, W. A. "Use of Ranks in One-Criterion Variance Analysis." *Journal of the American Statistical Association*, 47(260), 583-621 (1952).
7. Robinson, D., Hayes, A., & Couch, S. *broom: Convert Statistical Objects into Tidy Tibbles.* [Link](https://broom.tidymodels.org/)
8. Ben-Shachar, M. S., Lüdecke, D. & Makowski, D. *effectsize: Estimation of Effect Size Indices and Standardized Parameters.* [Link](https://easystats.github.io/effectsize/)

## Continue Learning

- [One-Way ANOVA in R: F-Test, Levene's Test, and Post-Hoc Complete Walkthrough](One-Way-ANOVA-in-R.html) covers the parent theory, the F-distribution derivation, assumption diagnostics, and post-hoc procedures in full.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) widens the practice to t-tests, proportion tests, non-parametric alternatives, and power analysis.
- [Multiple Regression Exercises in R](Multiple-Regression-Exercises-in-R.html) uses the same drill-sheet format for continuous predictors and interaction terms in a regression framing.
