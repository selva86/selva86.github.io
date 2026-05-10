---
title: "Shapiro-Wilk Test in R: Test Normality With shapiro.test()"
slug: "How-to-do-Shapiro-Wilk-Test-in-R"
description: "Run the Shapiro-Wilk normality test in R with shapiro.test(). Covers interpretation, sample size limits, Q-Q plot pairing, alternatives, and 5 examples."
keywords: "Shapiro-Wilk test in R, shapiro.test R, R normality test, test for normality R, Q-Q plot R, R distribution test"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "statistical-test"
subcategory_id: "normality-variance"
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "Shapiro-Wilk test|shapiro.test()|normality test|test for normality|Q-Q plot"
auto_link_case_sensitive: false
target_keyword: "Shapiro-Wilk test in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Shapiro-Wilk Test in R: Test Normality With shapiro.test()

<p class="lead">The Shapiro-Wilk test in R checks whether a numeric sample is consistent with a normal distribution. Use <code>shapiro.test(x)</code>; a p-value below your threshold (e.g., 0.05) suggests non-normality.</p>

[QUICK ANSWER]
shapiro.test(x)                              # default test
shapiro.test(x)$p.value                      # extract p-value
shapiro.test(x)$statistic                    # W statistic (close to 1 = normal)
qqnorm(x); qqline(x)                         # visual Q-Q plot
ks.test(x, "pnorm", mean(x), sd(x))          # alternative: KS test
nortest::ad.test(x)                          # Anderson-Darling alternative

[DECISION TREE: Is Shapiro-Wilk the right tool?]
- check normality, n < 5000: shapiro.test()
- check normality, n > 5000: visual Q-Q plot + Anderson-Darling
- check normality of residuals after model: shapiro.test(residuals(fit))
- categorical or count data: not normal, skip Shapiro
- decide t-test vs Wilcoxon: shapiro on each group (or just visualize)
- detect specific deviation (skew, kurtosis): moments::skewness/kurtosis
- exact distribution test: ks.test (specify the distribution)

## What Shapiro-Wilk does in one sentence

**Shapiro-Wilk computes a test statistic W that compares the sample's order statistics to those expected from a normal distribution; W close to 1 means normal, lower means non-normal.** The p-value tells you the probability of seeing a deviation this large by chance under normality.

The test is widely used as an automated normality check before t-tests, ANOVA, or regression. It works best with sample sizes between 7 and 5000.

## Syntax

**`shapiro.test(x)` returns the W statistic and p-value.**

```r title="Test normality of mtcars$mpg"
shapiro.test(mtcars$mpg)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  mtcars$mpg
#> W = 0.94756, p-value = 0.1229
```

W = 0.95 (close to 1, suggesting normality), p = 0.12 (not significant, cannot reject normality).

[TIP]
**Use Shapiro-Wilk in tandem with a visual Q-Q plot.** The test gives a yes/no answer; the Q-Q plot shows HOW the distribution deviates (heavy tails, skew, multimodality). Together they make a complete normality assessment. `qqnorm(x); qqline(x)` is the one-line standard.

## Five common patterns

### 1. Basic normality test

```r title="Just the test"
result <- shapiro.test(mtcars$mpg)
result$statistic
result$p.value
#>         W
#> 0.9475647
#> [1] 0.1228814
```

A p-value above 0.05 means the data are CONSISTENT with normal. This is not "proof of normality"; it just means you cannot reject it.

### 2. Test residuals from a regression

```r title="Are model residuals normal?"
fit <- lm(mpg ~ wt, data = mtcars)
shapiro.test(residuals(fit))
#>
#>  Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.94508, p-value = 0.1044
```

Many regression assumptions concern RESIDUALS, not raw data. Test `residuals(fit)` after fitting your model.

### 3. Pair with Q-Q plot

```r title="Visual + statistical normality check"
x <- mtcars$mpg

# Statistical
print(shapiro.test(x))

# Visual
qqnorm(x, main = "Q-Q plot of mpg")
qqline(x, col = "red")
```

Points on the line in the Q-Q plot indicate normality. Curvature suggests skew; outliers at the ends suggest heavy tails.

### 4. Compare normality across groups

```r title="Test each group separately"
by(mtcars$mpg, mtcars$cyl, shapiro.test)
#> mtcars$cyl: 4
#>
#>  Shapiro-Wilk normality test
#>
#> data:  dd[x, ]
#> W = 0.91243, p-value = 0.2606
#>
#> -----------------------------------
#> mtcars$cyl: 6
#>
#>  Shapiro-Wilk normality test
#>
#> data:  dd[x, ]
#> W = 0.89903, p-value = 0.3252
```

Use `by()` (base R) or `dplyr::group_by() %>% summarise()` to apply the test per group. Useful before deciding ANOVA vs Kruskal-Wallis.

### 5. Alternative tests for n > 5000

```r title="Anderson-Darling for large samples"
# Generate large sample
set.seed(1)
big <- rnorm(10000)

# Shapiro-Wilk would error (n > 5000)
# shapiro.test(big)  # Error

# Use Anderson-Darling
nortest::ad.test(big)
#>
#>  Anderson-Darling normality test
#>
#> data:  big
#> A = 0.30236, p-value = 0.5754
```

`nortest::ad.test()` (Anderson-Darling) handles arbitrary sample sizes. Other options: `nortest::lillie.test()` (Lilliefors-corrected KS), or just visual Q-Q plots.

[KEY INSIGHT]
**With LARGE samples, Shapiro-Wilk often rejects normality even when the deviation is too small to matter.** A sample of n = 5000 with a tiny skew will produce a significant p-value, but the t-test is robust to such mild deviation. For large n, prefer visual inspection (Q-Q plot) over the test result.

## Shapiro-Wilk vs other normality tests

**Several normality tests exist, each with different sample-size limits and sensitivities.** Pick based on your data and what kind of deviation matters.

| Test | Best for | Strengths | Weaknesses |
|---|---|---|---|
| Shapiro-Wilk | n in 7-5000 | Most powerful for typical samples | Errors above n=5000 |
| Anderson-Darling | Any n | Sensitive to tail differences | Requires nortest package |
| Lilliefors (KS) | Any n | Simple; works on any continuous | Less powerful than Shapiro |
| Jarque-Bera | Large n | Tests skew + kurtosis directly | Sensitive only to higher moments |

When to use which:

- Use Shapiro-Wilk for typical sample sizes (7 to 5000).
- Use Anderson-Darling for n > 5000 or when tails matter.
- Always pair with a Q-Q plot for visual confirmation.

## Common pitfalls

**Pitfall 1: relying on a non-significant p-value as PROOF of normality.** A non-significant test means you cannot REJECT normality, not that data ARE normal. With small samples, the test has low power to detect non-normality.

**Pitfall 2: testing normality on already-grouped or already-transformed data.** Shapiro tests the full distribution. If you suspect different group means, test residuals after fitting a model, not the raw data.

[WARNING]
**Shapiro-Wilk errors when n > 5000.** R explicitly limits the sample size. For larger samples, use `nortest::ad.test()`, `ks.test()`, or just rely on Q-Q plots. The CLT also makes inferential tests robust at large n, so normality testing matters less.

**Pitfall 3: using Shapiro on count, ordinal, or categorical data.** These data types are not normal by construction. Skip the test and use methods designed for the data type (Poisson regression, ordinal regression, etc.).

## Try it yourself

**Try it:** Test whether `iris$Sepal.Length` for the species "setosa" is normally distributed. Save to `ex_test`.

```r title="Your turn: Shapiro-Wilk on iris setosa"
# Try it: setosa Sepal.Length
ex_test <- # your code here

ex_test$statistic
ex_test$p.value
#> Expected: W close to 1, p > 0.05 (data look normal)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_test <- shapiro.test(iris$Sepal.Length[iris$Species == "setosa"])
ex_test$statistic
#>         W
#> 0.9776986
ex_test$p.value
#> [1] 0.4595132
```

**Explanation:** W = 0.98 (very close to 1) and p = 0.46 (well above 0.05). The data are consistent with normality. Pairing this with a Q-Q plot would visually confirm the points fall close to the reference line.

</details>

## Related tests

After mastering Shapiro-Wilk, look at:

- `qqnorm()`, `qqline()`: Q-Q plot for visual normality assessment
- `ks.test(x, "pnorm", mean, sd)`: Kolmogorov-Smirnov against any specified distribution
- `nortest::ad.test()`: Anderson-Darling (works on any n)
- `nortest::lillie.test()`: Lilliefors-corrected KS test
- `moments::skewness()`, `kurtosis()`: direct measures of distribution shape
- `bartlett.test()`, `levene.test()`: equal-variance tests (related but different)

For multivariate normality, `MVN::mvn()` provides multiple tests including Mardia and Henze-Zirkler.

## FAQ

**How do I test for normality in R?**

`shapiro.test(x)` for sample sizes 7 to 5000. Pair with `qqnorm(x); qqline(x)` for a visual check. P-value above 0.05 means data are consistent with normal; below means evidence against normality.

**What is a good Shapiro-Wilk W statistic?**

W ranges from 0 to 1. W = 1 means perfect normality; values above 0.95 typically suggest the data are normal-like. Pair the W value with the p-value: high W and high p both suggest normality.

**Why does Shapiro-Wilk error with large samples?**

R limits Shapiro-Wilk to n <= 5000 because the test becomes hypersensitive to trivial deviations at larger sizes (large n + any tiny non-normality = "significant"). For larger samples, use Anderson-Darling (`nortest::ad.test`) or visual Q-Q plots.

**How do I test if model residuals are normal?**

Fit the model, extract residuals, then run shapiro: `fit <- lm(y ~ x); shapiro.test(residuals(fit))`. Residual normality is what regression and ANOVA assume, not raw-data normality.

**What if Shapiro-Wilk says my data are not normal?**

Three options. 1) Transform the data (log, sqrt, Box-Cox) and retest. 2) Use a non-parametric alternative (Wilcoxon instead of t-test, Kruskal-Wallis instead of ANOVA). 3) Use a more flexible model (GLM, robust regression, bootstrapping). The choice depends on your downstream analysis.
