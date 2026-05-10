---
title: "One-Sample t-Test in R: Test a Mean Against a Value"
slug: "How-to-do-One-Sample-t-Test-in-R"
description: "Run a one-sample t-test in R with t.test() to compare a sample mean to a known value. Covers assumptions, p-value, CI, effect size, and 5 worked examples."
keywords: "one-sample t-test in R, t.test R, R t-test mean, single sample t-test, t-test assumptions, R cohens d t-test"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "statistical-test"
subcategory_id: "t-test"
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "one-sample t-test|t.test()|R t-test|test sample mean|Student's t-test"
auto_link_case_sensitive: false
target_keyword: "one-sample t-test in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# One-Sample t-Test in R: Test a Mean Against a Value

<p class="lead">A one-sample t-test in R compares the mean of a single sample to a known value (the null hypothesis mean). Use <code>t.test(x, mu = m0)</code> where <code>x</code> is the sample and <code>m0</code> is the hypothesized mean.</p>

[QUICK ANSWER]
t.test(x, mu = 100)                       # default two-sided
t.test(x, mu = 100, alternative = "greater")  # one-sided (right)
t.test(x, mu = 100, alternative = "less")     # one-sided (left)
t.test(x, mu = 100, conf.level = 0.99)        # 99% CI
t.test(x, mu = 100)$p.value                   # extract p-value
t.test(x, mu = 100)$conf.int                  # extract CI
shapiro.test(x)                              # check normality first

[DECISION TREE: Is one-sample t-test the right tool?]
- compare sample mean to fixed value: t.test(x, mu = m0)
- compare two independent samples: t.test(x, y) (two-sample)
- compare paired observations: t.test(x, y, paired = TRUE)
- compare median (non-normal): wilcox.test(x, mu = m0)
- compare proportion to value: prop.test or binom.test
- compare variances: var.test(x, y)
- normality check before t-test: shapiro.test(x)

## What a one-sample t-test does in one sentence

**A one-sample t-test asks: "is the mean of this sample DIFFERENT from a hypothesized value?"** It computes the t-statistic `(mean(x) - mu) / (sd(x) / sqrt(n))` and converts it to a p-value using the t distribution with `n - 1` degrees of freedom.

Used when you have one sample and want to test against a known/expected value. Common in quality control ("is the average length 100 mm as specified?"), product testing ("is mean rating different from 3.5?"), and theoretical comparisons.

## Syntax

**Pass the sample as `x` and the hypothesized mean as `mu`. The result is a `htest` object with t-statistic, p-value, CI, and more.**

```r title="Generate sample data and run t-test"
set.seed(42)
x <- rnorm(30, mean = 102, sd = 10)

mean(x)
#> [1] 102.5318

t.test(x, mu = 100)
#>
#>  One Sample t-test
#>
#> data:  x
#> t = 1.4129, df = 29, p-value = 0.1683
#> alternative hypothesis: true mean is not equal to 100
#> 95 percent confidence interval:
#>   98.86462 106.19891
#> sample estimates:
#> mean of x
#>  102.5318
```

[TIP]
**Always check normality before a t-test on small samples.** For n < 30, use `shapiro.test(x)` (Shapiro-Wilk) or a Q-Q plot. If non-normal, use `wilcox.test(x, mu = 100)` (Wilcoxon signed-rank) instead. For n >= 30, the central limit theorem gives the t-test reasonable robustness even on slightly non-normal data.

## Five common patterns

### 1. Two-sided test (default)

```r title="Is the mean different from 100?"
set.seed(42)
x <- rnorm(30, mean = 102, sd = 10)

result <- t.test(x, mu = 100)
result$p.value
#> [1] 0.1683175
```

The two-sided test is the default. The alternative hypothesis is "true mean != 100".

### 2. One-sided test (greater)

```r title="Is the mean greater than 100?"
t.test(x, mu = 100, alternative = "greater")$p.value
#> [1] 0.08415876
```

`alternative = "greater"` tests "true mean > 100". Use when you have a directional hypothesis BEFORE seeing the data. Never pick the direction post-hoc; that inflates the false-positive rate.

### 3. Custom confidence level

```r title="99% CI instead of default 95%"
t.test(x, mu = 100, conf.level = 0.99)$conf.int
#> [1] 97.55793 107.50560
#> attr(,"conf.level")
#> [1] 0.99
```

Wider confidence levels (99%) produce wider intervals. Tighter levels (90%) produce narrower ones.

### 4. Effect size (Cohen's d)

```r title="Standardized mean difference"
mean_x <- mean(x)
sd_x <- sd(x)
d <- (mean_x - 100) / sd_x
d
#> [1] 0.2580193
```

Cohen's d is the difference in standard deviations. Convention: 0.2 = small, 0.5 = medium, 0.8 = large effect. Always report effect size alongside the p-value; significance alone does not measure importance.

### 5. Extract specific results

```r title="Pull statistics from the htest object"
result <- t.test(x, mu = 100)
result$statistic   # t-statistic
result$parameter   # degrees of freedom
result$p.value     # p-value
result$conf.int    # confidence interval
result$estimate    # sample mean
#>        t
#> 1.412882
#>
#> df
#> 29
#> [1] 0.1683175
#> [1] 98.86462 106.19891
#> attr(,"conf.level")
#> [1] 0.95
#> mean of x
#>  102.5318
```

The `htest` object is a list. Use `$` to extract specific values for further analysis or reporting.

[KEY INSIGHT]
**A non-significant p-value (p > 0.05) does NOT mean the means are equal.** It means there is INSUFFICIENT EVIDENCE to claim they differ. With small samples, even meaningful differences may not reach significance. Always pair a t-test with an effect size and a confidence interval to interpret correctly. A wide CI tells you "we cannot rule out a meaningful difference"; a narrow CI tells you "the difference is small if it exists".

## Assumptions and how to check them

**The t-test assumes:** independent observations, approximately normal distribution (or large enough sample), no extreme outliers.

| Assumption | How to check | What to do if violated |
|---|---|---|
| Independence | Study design | Use a model that handles dependence (mixed model) |
| Normality | shapiro.test(x), Q-Q plot | wilcox.test() (non-parametric) |
| No extreme outliers | boxplot(x), look at data | Trim outliers, transform, or use Wilcoxon |
| Random sampling | Study design | Acknowledge limitation in results |

For sample sizes 30+, the CLT gives the t-test robustness against mild non-normality. For sample sizes under 15, normality really matters; consider Wilcoxon if doubtful.

## Common pitfalls

**Pitfall 1: confusing one-sample with two-sample t-test.** One-sample compares ONE sample to a value. Two-sample compares TWO samples to each other. Use `t.test(x, mu = 100)` for one-sample; `t.test(x, y)` for two-sample.

**Pitfall 2: post-hoc choice of alternative direction.** Picking `alternative = "greater"` after seeing the data inflates the false-positive rate. Direction must be specified BEFORE seeing data, based on prior hypothesis.

[WARNING]
**Welch's t-test is the default for unequal-variance two-sample tests, NOT for one-sample.** `t.test(x, mu = 100)` performs Student's one-sample t-test (no variance assumption between groups; only normality assumption). Welch's correction does not apply here.

**Pitfall 3: relying on p-value alone.** A p-value answers "is there evidence of a difference?" not "how big is the difference?". Always report and interpret the effect size and CI alongside.

## Try it yourself

**Try it:** Run a one-sample t-test on `mtcars$mpg` to test whether the mean MPG differs from 20. Extract the p-value and CI. Save the result to `ex_test`.

```r title="Your turn: t-test on mtcars$mpg"
# Try it: test mean mpg against 20
ex_test <- # your code here

ex_test$p.value
ex_test$conf.int
#> Expected: small p-value (mean is close to 20), CI around 17-22
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_test <- t.test(mtcars$mpg, mu = 20)
ex_test$p.value
#> [1] 0.9325521
ex_test$conf.int
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `t.test(mtcars$mpg, mu = 20)` tests whether the sample mean (20.09) differs from 20. The p-value (0.93) is large, meaning we cannot reject the null. The 95% CI (17.9, 22.3) includes 20, consistent with that conclusion. No evidence the true mean differs from 20.

</details>

## Related statistical tests

After mastering the one-sample t-test, look at:

- `t.test(x, y)`: two-sample (independent groups) t-test
- `t.test(x, y, paired = TRUE)`: paired-samples t-test (matched pre/post)
- `wilcox.test(x, mu = 100)`: non-parametric alternative for non-normal data
- `var.test()`: F-test for equal variances
- `prop.test()`: test a proportion against a value
- `binom.test()`: exact binomial test for proportions

For sample size planning, use `pwr::pwr.t.test()` to compute required N for a target power.

## FAQ

**How do I run a one-sample t-test in R?**

Use `t.test(x, mu = hypothesized_value)`. For example, `t.test(mtcars$mpg, mu = 20)` tests whether the mean MPG differs from 20. The result includes t-statistic, degrees of freedom, p-value, and 95% confidence interval.

**What is the difference between one-sample and two-sample t-test?**

One-sample compares one sample's mean to a fixed VALUE (`mu`). Two-sample compares the means of two samples to each other. Both use `t.test()`; one-sample passes `mu`, two-sample passes a second vector `y`.

**How do I check assumptions for a t-test in R?**

Normality: `shapiro.test(x)` (Shapiro-Wilk) or a Q-Q plot via `qqnorm(x); qqline(x)`. Outliers: `boxplot(x)`. Independence: study design only. For n < 30 with non-normal data, switch to `wilcox.test()`.

**How do I extract the p-value from a t.test in R?**

Save the result and use `$`: `result <- t.test(x, mu = 100); result$p.value`. Other useful fields: `$statistic`, `$conf.int`, `$estimate`, `$parameter` (degrees of freedom).

**What does mu mean in t.test()?**

`mu` is the hypothesized mean under the null hypothesis. For a one-sample test, it is the value you compare your sample mean against. Default is 0 (test whether mean differs from 0). For a comparison test (two-sample), `mu` is the hypothesized DIFFERENCE between the two means (default 0).
