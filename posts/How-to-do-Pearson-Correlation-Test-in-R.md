---
title: "Pearson Correlation Test in R: cor.test() Guide"
slug: "How-to-do-Pearson-Correlation-Test-in-R"
description: "Run a Pearson correlation test in R with cor.test() to test linear association between two numeric variables. Covers assumptions, p-value, and 5 examples."
keywords: "Pearson correlation in R, cor.test R, R correlation test, R linear correlation, Pearson r in R, correlation p-value R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "statistical-test"
subcategory_id: "correlation"
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "Pearson correlation|cor.test()|correlation in R|R correlation|linear correlation"
auto_link_case_sensitive: false
target_keyword: "Pearson correlation in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Pearson Correlation Test in R: cor.test() Guide

<p class="lead">A Pearson correlation test in R measures the LINEAR association between two numeric variables. Use <code>cor.test(x, y)</code> to get the correlation coefficient, p-value, and confidence interval.</p>

[QUICK ANSWER]
cor.test(x, y)                                # default Pearson, two-sided
cor.test(x, y, method = "spearman")           # rank-based (non-linear ok)
cor.test(x, y, method = "kendall")            # rank-based (small N)
cor.test(x, y, alternative = "greater")       # one-sided
cor.test(x, y, conf.level = 0.99)             # custom CI
cor(x, y, use = "complete.obs")               # just the coefficient (no test)
cor.test(x, y)$p.value                        # extract p-value

[DECISION TREE: Is Pearson correlation the right tool?]
- linear association, normal-ish numerics: cor.test(x, y)
- non-linear monotonic association: cor.test(x, y, method = "spearman")
- small sample with ties: cor.test(x, y, method = "kendall")
- categorical x continuous y: ANOVA or t-test
- two categorical: chi-square or fisher.test
- partial correlation (controlling for z): ppcor::pcor.test()
- multiple comparisons: cor() with adjusted p-values

## What Pearson correlation does in one sentence

**Pearson's r measures the strength and direction of LINEAR association between two numeric variables, ranging from -1 (perfect negative) to +1 (perfect positive), with 0 meaning no linear relationship.** The test gives a p-value for the null hypothesis "true correlation is 0".

Use it for two continuous variables that look reasonably linear and roughly normal. For non-linear or rank-based associations, use Spearman or Kendall instead.

## Syntax

**`cor.test(x, y)` returns Pearson's r, t-statistic, p-value, and 95% CI.**

```r title="Test correlation between mpg and wt"
cor.test(mtcars$mpg, mtcars$wt)
#>
#>  Pearson's product-moment correlation
#>
#> data:  mtcars$mpg and mtcars$wt
#> t = -9.559, df = 30, p-value = 1.294e-10
#> alternative hypothesis: true correlation is not equal to 0
#> 95 percent confidence interval:
#>  -0.9338264 -0.7440872
#> sample estimates:
#>        cor
#> -0.8676594
```

The correlation is -0.87 (strong negative), p is essentially 0, CI is (-0.93, -0.74).

[TIP]
**Always plot your data before correlating.** Anscombe's quartet famously shows four datasets with identical correlation but very different shapes (linear, curved, outlier-driven, etc.). A correlation coefficient summarizes a relationship; a scatter plot reveals it.

## Five common patterns

### 1. Default Pearson correlation

```r title="Linear correlation between two variables"
result <- cor.test(mtcars$mpg, mtcars$wt)
result$estimate
result$p.value
result$conf.int
#>        cor
#> -0.8676594
#> [1] 1.293958e-10
#> [1] -0.9338264 -0.7440872
```

Pearson's r answers: "as one variable increases, does the other increase (positive r) or decrease (negative r)?"

### 2. Spearman (rank-based, robust to non-normality)

```r title="Use Spearman when data are not normal"
cor.test(mtcars$mpg, mtcars$hp, method = "spearman")
#>  Spearman's rank correlation rho
#>
#> data:  mtcars$mpg and mtcars$hp
#> S = 10337, p-value = 5.086e-12
#> alternative hypothesis: true rho is not equal to 0
#> sample estimates:
#>        rho
#> -0.8946646
```

Spearman correlates the RANKS rather than raw values. Robust to outliers and non-linear monotonic relationships.

### 3. Kendall (small samples, many ties)

```r title="Use Kendall for small N or many ties"
cor.test(mtcars$mpg, mtcars$cyl, method = "kendall")
#>  Kendall's rank correlation tau
#>
#> data:  mtcars$mpg and mtcars$cyl
#> z = -5.7981, p-value = 6.706e-09
#> alternative hypothesis: true tau is not equal to 0
#> sample estimates:
#>        tau
#> -0.7953750
```

Kendall's tau is more conservative than Spearman, especially with small samples.

### 4. One-sided test

```r title="Test for positive correlation only"
cor.test(mtcars$mpg, mtcars$drat, alternative = "greater")
#>  Pearson's product-moment correlation
#>
#> data:  mtcars$mpg and mtcars$drat
#> t = 5.0959, df = 30, p-value = 8.244e-06
#> alternative hypothesis: true correlation is greater than 0
#> 95 percent confidence interval:
#>  0.4583541 1.0000000
#> sample estimates:
#>       cor
#> 0.6811719
```

Use `alternative = "greater"` (one-sided positive) or `"less"` (one-sided negative) ONLY if you specified the direction BEFORE seeing the data.

### 5. Many-pair correlation matrix

```r title="Correlation matrix with p-values"
mat <- cor(mtcars[, c("mpg", "cyl", "hp", "wt")])
mat
#>            mpg        cyl         hp         wt
#> mpg  1.0000000 -0.8521620 -0.7761684 -0.8676594
#> cyl -0.8521620  1.0000000  0.8324475  0.7824958
#> hp  -0.7761684  0.8324475  1.0000000  0.6587479
#> wt  -0.8676594  0.7824958  0.6587479  1.0000000
```

For a matrix WITH p-values, use `Hmisc::rcorr(as.matrix(data))` or `psych::corr.test(data)`.

[KEY INSIGHT]
**Correlation does NOT imply causation.** A high correlation between two variables means they vary TOGETHER, not that one CAUSES the other. There may be a third variable causing both, or the relationship may run in the opposite direction. Always remember this when interpreting correlation results.

## Pearson vs Spearman vs Kendall

**Three correlation methods with different assumptions and use cases.** Pick based on data shape and sample size.

| Method | Tests | Robust to | Best for |
|---|---|---|---|
| Pearson | Linear association | Normal-ish data | Two roughly normal continuous variables |
| Spearman | Monotonic association | Non-normality, mild outliers | Non-linear monotonic, ranks, ordinal data |
| Kendall | Concordance | Small N, many ties | Small samples, ordinal with ties |

When to use which:

- Use Pearson for typical "linear" scenarios with normal-ish data.
- Use Spearman when data are skewed or non-linear monotonic.
- Use Kendall for small samples or many tied values.

## Common pitfalls

**Pitfall 1: assuming correlation means linearity.** Pearson only measures LINEAR association. Two variables can be perfectly related (e.g., y = x^2) yet have Pearson r = 0. Always plot first.

**Pitfall 2: outliers can dominate.** A single extreme point can drive correlation up or down. Use Spearman if you suspect outliers, or examine influence with `cooks.distance()` after fitting `lm()`.

[WARNING]
**Multiple correlation tests inflate the false-positive rate.** Testing 100 variable pairs at p < 0.05 produces ~5 false positives by chance. Use Bonferroni or FDR adjustment: `p.adjust(p_values, method = "BH")` for false-discovery-rate control.

**Pitfall 3: small samples produce unreliable estimates.** With n < 20, the correlation coefficient has wide confidence intervals. A "strong" correlation in a tiny sample may not replicate.

## Try it yourself

**Try it:** Test the correlation between `iris$Sepal.Length` and `iris$Petal.Length` using Pearson. Save to `ex_test` and report the coefficient and p-value.

```r title="Your turn: correlation in iris"
# Try it: Sepal.Length vs Petal.Length
ex_test <- # your code here

ex_test$estimate
ex_test$p.value
#> Expected: ~0.87, p ~ 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_test <- cor.test(iris$Sepal.Length, iris$Petal.Length)

ex_test$estimate
#>       cor
#> 0.8717538
ex_test$p.value
#> [1] 1.038466e-47
```

**Explanation:** Pearson r = 0.87 (strong positive linear correlation). Sepal length and petal length grow together. The tiny p-value confirms the relationship is far from zero.

</details>

## Related tests

After mastering Pearson correlation, look at:

- `cor.test(method = "spearman")`: rank-based, non-linear monotonic
- `cor.test(method = "kendall")`: rank-based with ties
- `lm(y ~ x)`: regression for the same data with slope and intercept
- `Hmisc::rcorr()`: correlation matrix with p-values
- `psych::corr.test()`: correlation matrix with adjustment options
- `ppcor::pcor.test()`: partial correlation controlling for other variables

For visualization, `ggplot2::ggplot() + geom_point() + geom_smooth()` shows the relationship visually.

## FAQ

**How do I do a Pearson correlation test in R?**

`cor.test(x, y)` runs the default Pearson test. The result includes the correlation coefficient, t-statistic, p-value, and 95% confidence interval. Save the result and use `$estimate` for r and `$p.value` for the p-value.

**What is the difference between Pearson and Spearman correlation?**

Pearson measures linear association on the raw values. Spearman measures monotonic association on the ranks. Use Pearson for normal-ish linear data; Spearman for non-normal, ordinal, or non-linear-monotonic data.

**How do I extract the correlation coefficient from cor.test in R?**

`result <- cor.test(x, y); result$estimate`. The estimate is named "cor" (or "rho" for Spearman, "tau" for Kendall). For just the number: `unname(result$estimate)` or `result$estimate[[1]]`.

**What does a high correlation mean?**

A high correlation (close to +1 or -1) means the variables vary together (or oppositely). It does NOT mean one causes the other; a third variable could explain both, or the direction may be reversed. Correlation is a description of co-variation, not causation.

**How do I test correlation with NA values in R?**

`cor.test()` and `cor()` accept a `use` argument: `use = "complete.obs"` removes any row with NA in either variable; `use = "pairwise.complete.obs"` keeps all pairwise combinations. The choice affects the final r and the sample size.
