---
title: "Wilcoxon Test in R: Signed-Rank and Rank-Sum With Examples"
slug: "How-to-do-Wilcoxon-Signed-Rank-Test-in-R"
description: "Run Wilcoxon tests in R with wilcox.test(): signed-rank for paired samples, rank-sum (Mann-Whitney U) for independent. Includes assumptions and 5 examples."
keywords: "Wilcoxon test in R, wilcox.test R, Mann-Whitney U test R, Wilcoxon signed-rank test R, R non-parametric t-test, paired Wilcoxon"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "statistical-test"
subcategory_id: "nonparametric"
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "Wilcoxon test|wilcox.test()|Mann-Whitney|signed-rank test|rank-sum test"
auto_link_case_sensitive: false
target_keyword: "Wilcoxon test in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Wilcoxon Test in R: Signed-Rank and Rank-Sum With Examples

<p class="lead">The <code>wilcox.test()</code> function in R runs Wilcoxon tests: signed-rank (paired samples) and rank-sum (independent samples, also known as Mann-Whitney U). Use them when t-test assumptions are violated.</p>

[QUICK ANSWER]
wilcox.test(x, mu = 0)                            # one-sample signed-rank
wilcox.test(x, y)                                 # two-sample (Mann-Whitney U)
wilcox.test(x, y, paired = TRUE)                  # paired signed-rank
wilcox.test(x, y, alternative = "greater")        # one-sided
wilcox.test(x, y, conf.int = TRUE)                # add Hodges-Lehmann CI
wilcox.test(x, y)$p.value                         # extract p-value
wilcox.test(value ~ group, data = df)             # formula syntax

[DECISION TREE: Is Wilcoxon the right tool?]
- compare two groups, non-normal: wilcox.test(x, y)
- paired/repeated measures, non-normal: wilcox.test(x, y, paired = TRUE)
- one sample vs value, non-normal: wilcox.test(x, mu = m0)
- normal data, two groups: t.test() (more powerful)
- 3+ groups: kruskal.test()
- ordinal/ranked outcome: Wilcoxon is appropriate
- effect size: r = Z / sqrt(N) or coin::wilcox_test()

## What Wilcoxon does in one sentence

**Wilcoxon tests compare distributions using RANKS instead of raw values, so they do not assume normality.** Signed-rank uses absolute differences from a center; rank-sum (Mann-Whitney U) uses the combined ranks of two samples to test whether one tends to produce larger values.

Both are non-parametric alternatives to the t-test. Use them when sample sizes are small AND data are non-normal. For larger samples, the t-test is robust enough that Wilcoxon's slight power loss is unnecessary.

## Syntax

**`wilcox.test(x, y)` runs rank-sum; `wilcox.test(x, y, paired = TRUE)` runs signed-rank on differences.**

```r title="Compare two groups with Wilcoxon"
set.seed(1)
x <- rnorm(20, mean = 5)
y <- rnorm(20, mean = 6)

wilcox.test(x, y)
#>
#>  Wilcoxon rank sum exact test
#>
#> data:  x and y
#> W = 124, p-value = 0.01287
#> alternative hypothesis: true location shift is not equal to 0
```

The W statistic and p-value tell you whether x tends to produce different values than y.

[TIP]
**Wilcoxon does NOT compare medians; it compares LOCATION SHIFT.** Two distributions with the same median but different shapes can produce a significant Wilcoxon test. The test asks "is the probability that a random x exceeds a random y different from 0.5?". If you specifically need to compare medians, use a separate test like `mood.test`.

## Five common patterns

### 1. Two-sample (Mann-Whitney U / rank-sum)

```r title="Compare two independent groups"
wilcox.test(mpg ~ am, data = mtcars)
#>
#>  Wilcoxon rank sum test with continuity correction
#>
#> data:  mpg by am
#> W = 42, p-value = 0.001871
#> alternative hypothesis: true location shift is not equal to 0
```

Formula syntax: `wilcox.test(value ~ group, data = df)`. Tests whether `value` differs by `group`.

### 2. Paired / repeated measures

```r title="Pre vs post on same subjects"
pre <- c(20, 22, 25, 28, 30)
post <- c(22, 23, 27, 30, 33)

wilcox.test(pre, post, paired = TRUE)
#>
#>  Wilcoxon signed rank exact test
#>
#> data:  pre and post
#> V = 0, p-value = 0.0625
#> alternative hypothesis: true location shift is not equal to 0
```

`paired = TRUE` runs signed-rank on the differences. The signed-rank looks at WITHIN-subject changes, which is more powerful when measurements are correlated.

### 3. One-sample signed-rank

```r title="Test if median differs from a value"
x <- c(102, 105, 99, 108, 110, 95, 103)
wilcox.test(x, mu = 100)
#>
#>  Wilcoxon signed rank exact test
#>
#> data:  x
#> V = 22, p-value = 0.4063
#> alternative hypothesis: true location is not equal to 100
```

`wilcox.test(x, mu = 100)` tests whether x's median is 100. Non-parametric alternative to one-sample t-test.

### 4. Hodges-Lehmann confidence interval

```r title="Add CI for the location shift"
wilcox.test(mpg ~ am, data = mtcars, conf.int = TRUE)
#>
#>  Wilcoxon rank sum test with continuity correction
#>
#> data:  mpg by am
#> W = 42, p-value = 0.001871
#> alternative hypothesis: true location shift is not equal to 0
#> 95 percent confidence interval:
#>  -11.299977  -2.700001
#> sample estimates:
#> difference in location
#>              -6.799963
```

`conf.int = TRUE` returns the Hodges-Lehmann CI for the median difference. More informative than just a p-value.

### 5. One-sided Wilcoxon

```r title="Test for shift in one direction"
wilcox.test(x, y, alternative = "less")
#>
#>  Wilcoxon rank sum exact test
#>
#> data:  x and y
#> W = 124, p-value = 0.006435
#> alternative hypothesis: true location shift is less than 0
```

Direction must be specified BEFORE seeing data. Post-hoc directional tests inflate false-positive rates.

[KEY INSIGHT]
**For sample sizes above ~30, the t-test is so robust that Wilcoxon's power advantage on non-normal data is small.** For sample sizes below 15 with strong non-normality or outliers, Wilcoxon is a better choice. In the gray zone (15-30), inspect the data and use judgment.

## Wilcoxon vs t-test comparison

**The choice between Wilcoxon and t-test depends on data shape and sample size.** Both test similar things but with different assumptions.

| Property | t-test | Wilcoxon |
|---|---|---|
| Normality assumption | Yes (or large N) | No |
| Outlier sensitivity | High | Low (uses ranks) |
| Power on truly normal data | Higher | Slightly lower |
| Power on non-normal data | Lower | Higher |
| Returns | Mean difference + CI | Location shift + CI |
| Best for small N | If normal | If non-normal |

When to use which:

- Use t-test when normality is plausible OR N >= 30.
- Use Wilcoxon for small N with non-normal data or outliers.
- For ordinal data, Wilcoxon is the right choice (t-test makes no sense on ranks).

## Common pitfalls

**Pitfall 1: confusing signed-rank with rank-sum.** Signed-rank is for PAIRED data (same subjects, two measurements). Rank-sum (Mann-Whitney U) is for INDEPENDENT samples (different subjects). Specify `paired = TRUE` when paired.

**Pitfall 2: claiming "Wilcoxon compares medians".** Strictly, it tests location shift assuming both distributions have the same shape. With different shapes, the result depends on the entire distribution, not just medians.

[WARNING]
**Ties degrade Wilcoxon's exactness.** R automatically uses a normal approximation when ties are present and prints a warning. For very small samples with ties, exact methods from the `coin` package give better p-values: `coin::wilcox_test(value ~ group, data = df)`.

**Pitfall 3: using Wilcoxon when t-test would work.** With sample size 50+ and roughly symmetric data, the t-test is more powerful. Reach for Wilcoxon only when t-test assumptions clearly fail.

## Try it yourself

**Try it:** Use Wilcoxon to compare `mpg` between automatic (`am=0`) and manual (`am=1`) cars in `mtcars`. Save to `ex_test`.

```r title="Your turn: Wilcoxon on mtcars"
# Try it: rank-sum test of mpg by am
ex_test <- # your code here

ex_test$p.value
ex_test$statistic
#> Expected: significant difference, manual cars have higher mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_test <- wilcox.test(mpg ~ am, data = mtcars)
ex_test$p.value
#> [1] 0.001870838
ex_test$statistic
#>  W
#> 42
```

**Explanation:** The Mann-Whitney U test on mpg by am gives W = 42, p = 0.0019. Strong evidence that the distribution of mpg differs between automatic and manual cars. Manual cars (am=1) tend to have higher mpg.

</details>

## Related tests

After mastering Wilcoxon, look at:

- `t.test()`: parametric counterpart for normal data
- `kruskal.test()`: extension to 3+ groups (non-parametric ANOVA)
- `friedman.test()`: 3+ paired groups (non-parametric repeated-measures ANOVA)
- `coin::wilcox_test()`: exact Wilcoxon with permutation
- `mood.test()`: tests for scale (variance) differences
- `ks.test()`: Kolmogorov-Smirnov for whole distribution comparison

For effect size after Wilcoxon, the rank-biserial correlation `r = (1 - 2*W/(n1*n2))` works for the rank-sum case.

## FAQ

**What is the difference between Wilcoxon signed-rank and rank-sum tests?**

Signed-rank is for PAIRED data: same subjects, two measurements. It tests differences within pairs. Rank-sum (Mann-Whitney U) is for INDEPENDENT samples: two different groups. It tests whether one group tends to produce higher values.

**When should I use Wilcoxon instead of t-test in R?**

Use Wilcoxon when sample sizes are small AND the data are non-normal (skewed, heavy-tailed, or with outliers). For sample sizes 30+, the t-test is robust enough that Wilcoxon's advantage shrinks.

**How do I run Mann-Whitney U test in R?**

`wilcox.test(x, y)` (without paired = TRUE) IS the Mann-Whitney U test. R uses the equivalent rank-sum formulation. Both names refer to the same test; "Mann-Whitney U" is more common in non-statistics fields.

**Does Wilcoxon test compare medians?**

Not strictly. It tests for a LOCATION SHIFT, assuming both distributions have the same shape. If shapes differ, the test detects ANY location difference, not specifically medians. To formally compare medians, use a quantile regression or median test.

**How do I get a p-value from wilcox.test in R?**

`result <- wilcox.test(x, y); result$p.value`. Other useful fields: `$statistic` (W or V), `$conf.int` (with `conf.int = TRUE`), `$estimate` (Hodges-Lehmann shift estimate).
