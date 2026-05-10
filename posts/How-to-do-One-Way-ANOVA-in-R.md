---
title: "One-Way ANOVA in R: Compare Group Means With aov()"
slug: "How-to-do-One-Way-ANOVA-in-R"
description: "Run one-way ANOVA in R with aov() to compare means across 3+ groups. Covers assumptions, F-statistic, post-hoc Tukey HSD, effect size, and 5 examples."
keywords: "one-way ANOVA in R, R aov, compare group means R, ANOVA assumptions, Tukey HSD R, R post-hoc test, eta squared ANOVA"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "statistical-test"
subcategory_id: "anova"
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "one-way ANOVA|aov()|R ANOVA|ANOVA in R|F-test|Tukey HSD"
auto_link_case_sensitive: false
target_keyword: "one-way ANOVA in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# One-Way ANOVA in R: Compare Group Means With aov()

<p class="lead">One-way ANOVA in R tests whether the means of three or more groups are equal. Use <code>aov(y ~ group, data = df)</code> to fit the model and <code>summary()</code> for the F-statistic and p-value. Pair with <code>TukeyHSD()</code> for pairwise comparisons.</p>

[QUICK ANSWER]
fit <- aov(mpg ~ factor(cyl), data = mtcars)    # fit
summary(fit)                                    # F-stat + p-value
TukeyHSD(fit)                                   # pairwise post-hoc
oneway.test(mpg ~ cyl, data = mtcars)           # Welch (unequal var)
shapiro.test(residuals(fit))                    # check normality
bartlett.test(mpg ~ factor(cyl), data = mtcars) # check equal variance
DescTools::EtaSq(fit)                           # effect size (eta squared)

[DECISION TREE: Is one-way ANOVA the right tool?]
- compare 3+ group means: aov(y ~ group)
- compare 2 means only: t.test(y ~ group)
- non-normal data: kruskal.test(y ~ group)
- unequal variances: oneway.test(y ~ group)
- repeated measures: aov(y ~ group + Error(subject)) or lme4::lmer
- multiple factors: aov(y ~ a * b) (two-way ANOVA)
- continuous predictor: lm(y ~ x)

## What one-way ANOVA does in one sentence

**One-way ANOVA tests the null hypothesis that all group means are equal by comparing the variance BETWEEN groups to the variance WITHIN groups.** A large F-statistic means between-group variance dominates; a small F-statistic means groups are indistinguishable.

A significant ANOVA tells you SOMEWHERE in the groups, means differ. It does NOT tell you which pair. For that, run a post-hoc test like Tukey's HSD.

## Syntax

**`aov(y ~ group, data = df)` fits the model. `summary()` produces the ANOVA table.**

```r title="Run ANOVA on mtcars: mpg by cyl"
fit <- aov(mpg ~ factor(cyl), data = mtcars)
summary(fit)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(cyl)   2  824.8   412.4   39.70 4.98e-09 ***
#> Residuals    29  301.3    10.4
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The F-statistic (39.70) and p-value (4.98e-09) tell you the groups differ.

[TIP]
**Always wrap a numeric grouping column in `factor()`.** `aov(mpg ~ cyl)` treats cyl as continuous and fits a regression instead of ANOVA. `aov(mpg ~ factor(cyl))` correctly treats cyl as categorical with three groups.

## Five common patterns

### 1. Basic ANOVA + summary

```r title="Mean mpg differs by cyl"
fit <- aov(mpg ~ factor(cyl), data = mtcars)
summary(fit)
```

The F-statistic compares between- to within-group variance. The p-value tests "all group means equal".

### 2. Tukey HSD for pairwise differences

```r title="Which pairs differ?"
TukeyHSD(fit)
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = mpg ~ factor(cyl), data = mtcars)
#>
#> $`factor(cyl)`
#>           diff       lwr        upr     p adj
#> 6-4 -6.920779 -10.769422 -3.0721355 0.0003209
#> 8-4 -11.563636 -14.770860 -8.3564122 0.0000000
#> 8-6  -4.642857  -8.327583 -0.9581313 0.0112287
```

Each row shows the difference between two groups, its CI, and family-adjusted p-value. All three pairs differ here.

### 3. Welch's one-way (unequal variances)

```r title="When variances are unequal across groups"
oneway.test(mpg ~ cyl, data = mtcars)
#>
#>  One-way analysis of means (not assuming equal variances)
#>
#> data:  mpg and cyl
#> F = 32.018, num df = 2.000, denom df = 14.357, p-value = 5.144e-06
```

`oneway.test()` does NOT assume equal variances. Use it when Bartlett's or Levene's test rejects equal variance.

### 4. Check assumptions

```r title="Normality and equal variance"
# Normality of residuals
shapiro.test(residuals(fit))
#>
#>  Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.97065, p-value = 0.508

# Equal variance (Levene's via car package, or Bartlett's)
bartlett.test(mpg ~ factor(cyl), data = mtcars)
#>
#>  Bartlett test of homogeneity of variances
#>
#> data:  mpg by factor(cyl)
#> Bartlett's K-squared = 3.2259, df = 2, p-value = 0.1992
```

Both assumptions pass here. ANOVA is appropriate.

### 5. Effect size (eta-squared)

```r title="How much variance does cyl explain?"
ss_between <- summary(fit)[[1]][1, "Sum Sq"]
ss_total <- ss_between + summary(fit)[[1]][2, "Sum Sq"]
eta_sq <- ss_between / ss_total
eta_sq
#> [1] 0.7325025
```

Eta-squared is the proportion of total variance explained by the grouping. Convention: 0.01 small, 0.06 medium, 0.14+ large. Here 73% of mpg variance is explained by cyl, a very large effect.

[KEY INSIGHT]
**A significant ANOVA does not tell you WHICH groups differ.** Always run a post-hoc test like `TukeyHSD()`, `pairwise.t.test()`, or `emmeans::pairs()` to identify specific pair differences. Reading just the omnibus F-test is incomplete.

## ANOVA assumptions

| Assumption | How to check | Fix if violated |
|---|---|---|
| Independence | Study design | Use mixed-effects model |
| Normality of residuals | shapiro.test(residuals(fit)) | Kruskal-Wallis (kruskal.test) |
| Equal variances | bartlett.test or Levene's | oneway.test (Welch) |
| Random sampling | Study design | Acknowledge in results |
| No extreme outliers | boxplot, cooks.distance | Trim or use rank-based test |

### Practical workflow for one-way ANOVA

**ANOVA is rarely a one-line analysis in real research.** The full workflow has a sequence: prepare data, check assumptions, fit, test, post-hoc, interpret, report.

Start by inspecting your groups visually with a boxplot or violin plot. This reveals outliers, asymmetry, and obvious group differences before any test runs. Next, check the assumptions: residual normality with `shapiro.test(residuals(fit))` and equal variances with `bartlett.test()` or Levene's test. If either fails badly, switch tools (Welch's ANOVA for unequal variances, Kruskal-Wallis for non-normality).

Once assumptions hold, fit `aov()` and read `summary()`. The F-statistic and its p-value answer "are any group means different?" If yes, run `TukeyHSD()` to identify which pairs differ. Compute eta-squared as the effect-size measure: significance with a tiny effect is rarely useful in practice.

When reporting, include all the moving parts: F(df1, df2) = F-value, p = p-value, eta-squared = effect_size, plus the post-hoc comparisons (which pairs differ and by how much). A standalone p-value is incomplete. Pair the result with a visualization (boxplot or means-with-error-bars chart) so readers can see what the test detected.

In notebook environments, save the model object so you can re-extract residuals, run additional post-hocs, or compute marginal means with `emmeans` later. Re-fitting the model each time is wasteful and error-prone.

## Common pitfalls

**Pitfall 1: forgetting `factor()` on a numeric group variable.** Without it, `aov(y ~ group)` treats group as continuous and fits a linear regression. Always `factor()` if the grouping variable is numeric.

**Pitfall 2: skipping post-hoc tests.** A significant ANOVA only says "at least one pair differs". Without `TukeyHSD()` or `pairwise.t.test()`, you do not know WHERE.

[WARNING]
**Tukey HSD assumes equal sample sizes; for unequal n, it uses the harmonic mean which is conservative.** For severely unbalanced designs, use `emmeans::pairs(emmeans(fit, ~ group))` or `lsmeans` for cleaner Type-III adjustments.

**Pitfall 3: running multiple t-tests instead of ANOVA.** Pairwise t-tests inflate the false-positive rate. Use ANOVA + Tukey HSD (or another adjusted post-hoc) for proper multiple-comparison control.

## Try it yourself

**Try it:** Fit a one-way ANOVA on `iris$Sepal.Length` by `Species`. Run Tukey HSD. Save the model to `ex_fit`.

```r title="Your turn: ANOVA on iris"
# Try it: Sepal.Length by Species
ex_fit <- # your code here

summary(ex_fit)
TukeyHSD(ex_fit)
#> Expected: F-test highly significant; all 3 species pairs differ
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- aov(Sepal.Length ~ Species, data = iris)
summary(ex_fit)
#>              Df Sum Sq Mean Sq F value Pr(>F)
#> Species       2  63.21   31.61   119.3 <2e-16 ***
#> Residuals   147  38.96    0.27

TukeyHSD(ex_fit)
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> $Species
#>                       diff       lwr       upr p adj
#> versicolor-setosa    0.930 0.6862273 1.1737727 0e+00
#> virginica-setosa     1.582 1.3382273 1.8257727 0e+00
#> virginica-versicolor 0.652 0.4082273 0.8957727 0e+00
```

**Explanation:** The F-test (F = 119.3, p < 2e-16) is highly significant. Tukey HSD shows all three Species pairs differ significantly with p < 0.001 each.

</details>

## Related tests

After mastering one-way ANOVA, look at:

- `kruskal.test()`: non-parametric alternative for non-normal data
- `oneway.test()`: Welch's ANOVA for unequal variances
- `aov(y ~ a * b)`: two-way ANOVA for factorial designs
- `aov(y ~ group + Error(subject))`: repeated-measures ANOVA
- `lm(y ~ group)`: equivalent to one-way ANOVA via regression
- `emmeans::emmeans()`: estimated marginal means with custom contrasts

For sample size planning, `pwr::pwr.anova.test()` computes required N per group for a target power.

## FAQ

**How do I run one-way ANOVA in R?**

`aov(y ~ group, data = df)` followed by `summary()`. Wrap numeric group variables in `factor()`: `aov(y ~ factor(group))`. Pair with `TukeyHSD()` for post-hoc pairwise tests.

**What is the difference between aov and lm in R?**

Both fit the same linear model. `lm()` returns regression coefficients; `aov()` returns the ANOVA decomposition (sums of squares). They are mathematically equivalent for one-way designs. Use `aov()` when you want the ANOVA table; `lm()` when you want coefficient interpretations.

**How do I do post-hoc tests after ANOVA in R?**

`TukeyHSD(fit)` is the standard. It computes all pairwise comparisons with family-wise error correction. Alternatives: `pairwise.t.test(y, group, p.adjust.method = "bonferroni")`, `emmeans::pairs(emmeans(fit, ~ group))`.

**What if my data violate the equal variance assumption?**

Use `oneway.test(y ~ group, data = df)`, which is Welch's ANOVA (does not assume equal variances). Or transform the data (log, sqrt) to stabilize variance, then re-run aov.

**How do I report ANOVA results?**

Standard format: F(df_between, df_within) = F-value, p = p-value, eta-squared = effect_size. Example: "F(2, 29) = 39.70, p < .001, eta^2 = 0.73". Always include effect size and post-hoc results.
