---
title: "t-Test Exercises in R: 12 One, Two & Paired Sample Problems, Solved Step-by-Step"
slug: t-Test-Exercises-in-R
description: "12 t-test exercises in R with runnable solutions: one-sample, two-sample (Welch and Student), paired tests, assumptions, effect sizes, and power checks."
keywords: "t-test exercises in R, one-sample t-test practice, two-sample t-test problems, paired t-test exercises, Welch t-test R, t-test assumptions, Cohen's d t-test, t-test solutions"
auto_link_terms: "t-test exercises|t-test practice problems|t-test problems|one-sample t-test exercises|paired t-test exercises|two-sample t-test exercises|t-test solutions"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.2
post_type: EX
sidebar_title: "t-Test Exercises (12 problems)"
fr_parent: t-Tests-in-R.html
difficulty: Intermediate
---

# t-Test Exercises in R: 12 One, Two & Paired Sample Problems, Solved Step-by-Step

<p class="lead">These 12 t-test exercises in R walk you through one-sample, two-sample (Welch and Student), and paired tests with full runnable solutions, covering assumption checks, effect sizes, and one-tailed variants so you can pick the right test and defend the result.</p>

## Which t-test matches your question setup?

Before grinding through twelve problems, you need one skill: looking at a data layout and knowing which of three tests to fire. The decision hinges on two questions. Do you have one group or two? If two, are the groups independent subjects, or the same subjects measured twice? Here is that decision rule applied to three tiny datasets in a single block so you can see the three calls side by side.

```r title="Three t-tests side by side"
# One-sample: is iris Sepal.Length mean different from 5.85?
one_res <- t.test(iris$Sepal.Length, mu = 5.85)

# Two-sample: setosa vs versicolor Petal.Length (independent groups)
sub <- subset(iris, Species %in% c("setosa", "versicolor"))
two_res <- t.test(Petal.Length ~ Species, data = sub)

# Paired: sleep dataset, same 10 subjects tested on both drugs
paired_res <- t.test(extra ~ group, data = sleep, paired = TRUE)

c(one_p = one_res$p.value, two_p = two_res$p.value, paired_p = paired_res$p.value)
#>       one_p       two_p    paired_p
#> 0.089670756 0.000000000 0.002832792
```

Each call answers a different question. The one-sample call asks whether an overall mean matches a reference. The two-sample call asks whether two independent groups differ. The paired call asks whether the *within-subject* change differs from zero. Same function, three very different data layouts.

| Your setup | R call | When to use |
|---|---|---|
| One group vs a reference value | `t.test(x, mu = value)` | Sample mean compared to a claim (label, target, historical mean) |
| Two independent groups | `t.test(y ~ group, data = d)` | Different subjects in each group |
| Two measurements per subject | `t.test(y ~ group, data = d, paired = TRUE)` | Before/after, matched pairs, crossover designs |

[KEY INSIGHT]
**A paired t-test is a one-sample t-test on the differences.** Compute `d <- after - before`, then run `t.test(d, mu = 0)`. You'll get the exact same t-statistic and p-value as `t.test(after, before, paired = TRUE)`. The "paired" flag is really just bookkeeping for the subtraction.

**Try it:** A nutrition study weighs 20 patients before and after 12 weeks on an anorexia treatment, giving each patient a pre and post weight. Which of the three t-test setups fits this design? Store your answer in `ex_answer` as `"one"`, `"two"`, or `"paired"`.

```r title="Your turn: pick the test"
# Same 20 patients, two measurements each (before, after 12 weeks)
ex_answer <- ""  # fill in: "one", "two", or "paired"
ex_answer
#> Expected: "paired"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pick the test solution"
ex_answer <- "paired"
ex_answer
#> [1] "paired"
```

**Explanation:** Each subject contributes two measurements, so the pre and post values are linked. A paired t-test uses that link; an independent two-sample test would throw it away and lose power.

</details>

## How do you read and report a t-test result in R?

A call to `t.test()` returns a list that looks like a printed block, but every number in that block is accessible by name. Five fields do most of the work: `statistic` (t value), `parameter` (degrees of freedom), `p.value`, `conf.int` (95% CI by default), and `estimate` (the sample mean, or the two group means). Pulling them out by name gives you one-line access for reports and pipelines.

```r title="Extract fields from a t-test result"
t_res <- t.test(iris$Sepal.Length, mu = 5.85)
t_stat <- t_res$statistic
df     <- t_res$parameter
p      <- t_res$p.value
ci     <- t_res$conf.int
est    <- t_res$estimate
round(c(t_stat, df = df, p = p, ci_low = ci[1], ci_high = ci[2], mean = est), 3)
#>    t.t        df         p    ci_low   ci_high mean.of.x
#> -1.711   149.000     0.089     5.710     5.852     5.843
```

Read in one breath: the sample mean (5.843) sits just below the hypothesized 5.85, the 95% CI covers 5.85, and p is 0.089. Not significant at 0.05. In APA style you would write this as `t(149) = -1.71, p = 0.089, 95% CI [5.71, 5.85]`.

[TIP]
**Tidy a t-test for reporting.** Wrap any `t.test()` result in `broom::tidy()` (broom is WebR-safe) to get a one-row data frame with `estimate`, `statistic`, `p.value`, `conf.low`, `conf.high`, and `method`. It plugs straight into `knitr::kable()` or a ggplot label without manual extraction.

[WARNING]
**A p-value alone is never a result.** Two tests can share `p = 0.03` and tell opposite stories if one has a tight CI around a tiny effect and the other has a wide CI around a huge one. Always report the estimate, the confidence interval, and an effect size alongside the p-value, otherwise the reader cannot judge the finding.

**Try it:** Run a one-sample t-test on `airquality$Temp` against mu = 77, remove missing values with `na.rm` handled by `t.test()` automatically, and print only the p-value to three decimals.

```r title="Your turn: one-sample on airquality$Temp"
ex_p <- 0  # replace with the p-value
round(ex_p, 3)
#> Expected: 0.121
```

<details>
<summary>Click to reveal solution</summary>

```r title="Airquality one-sample solution"
ex_p <- t.test(airquality$Temp, mu = 77)$p.value
round(ex_p, 3)
#> [1] 0.121
```

**Explanation:** `t.test()` strips `NA`s internally, so you can pass a column with missing values directly. Chaining `$p.value` on the result pulls just the number, which is the form you want for pipelines and reports.

</details>

## Practice Exercises

Twelve problems, split into one-sample (Exercises 1-4), two-sample (5-8), and paired (9-12). Each has a starter block, a hint, and a reveal. Solutions use `my_*` variable names so your tutorial variables above stay intact.

**One-sample t-tests**

### Exercise 1: Two-sided test against a hypothesized mean

Using `iris$Sepal.Length`, test the hypothesis that the population mean equals 5.85. Store the full `t.test()` result in `my_res1`, then report the p-value rounded to three decimals and whether you reject H0 at alpha = 0.05.

```r title="Exercise 1 starter: two-sided one-sample"
# Hint: t.test(x, mu = <reference>) returns a named list.
# Extract p-value with $p.value.

my_res1 <- NULL
# round(my_res1$p.value, 3)
#> Expected p-value: 0.09
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_res1 <- t.test(iris$Sepal.Length, mu = 5.85)
round(my_res1$p.value, 3)
#> [1] 0.09

# Decision at alpha = 0.05
my_res1$p.value < 0.05
#> [1] FALSE
```

**Explanation:** `p = 0.09 > 0.05`, so you fail to reject H0. There is not enough evidence that the iris mean differs from 5.85.

</details>

### Exercise 2: One-tailed test (less)

Use `mtcars$mpg` to test whether the population mean is less than 25 mpg. Set `alternative = "less"`. Store the result in `my_res2` and interpret.

```r title="Exercise 2 starter: one-tailed less"
# Hint: alternative = "less" flips the rejection region to the lower tail.

my_res2 <- NULL
# my_res2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_res2 <- t.test(mtcars$mpg, mu = 25, alternative = "less")
round(c(t = my_res2$statistic, p = my_res2$p.value), 4)
#>        t.t          p
#> -4.4997000  0.0000453
```

**Explanation:** `p ≈ 4.5e-05` is far below 0.05, so you reject H0 in favour of the alternative: the mean mpg is significantly less than 25. The one-tailed framing lets the full alpha budget sit in the lower tail, raising power when the direction is pre-specified.

</details>

### Exercise 3: Extract a 99% confidence interval

From `airquality$Wind`, extract the 99% confidence interval for the mean using `conf.level = 0.99`. Store the CI in `my_ci` and compare its width to the default 95% CI.

```r title="Exercise 3 starter: 99% CI"
# Hint: t.test(x, conf.level = 0.99)$conf.int returns a 2-element numeric vector.

my_ci <- NULL
# my_ci
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_ci <- t.test(airquality$Wind, conf.level = 0.99)$conf.int
ci_95  <- t.test(airquality$Wind)$conf.int
round(c(width_99 = diff(my_ci), width_95 = diff(ci_95)), 2)
#> width_99 width_95
#>     1.59     1.21
```

**Explanation:** The 99% CI is wider (1.59 vs 1.21) because a higher confidence level demands a larger margin of error. A tighter CI requires either a larger sample or accepting a lower confidence level.

</details>

### Exercise 4: Small-sample simulation

Use `set.seed(21)` and generate 8 observations from `rnorm(8, mean = 102, sd = 5)`. Test H0: mu = 100. Store the sample in `my_sample` and the result in `my_res4`. Explain what the p-value tells you despite a true effect being present.

```r title="Exercise 4 starter: small-n simulation"
set.seed(21)
my_sample <- NULL
my_res4   <- NULL
# round(my_res4$p.value, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
set.seed(21)
my_sample <- rnorm(8, mean = 102, sd = 5)
my_res4   <- t.test(my_sample, mu = 100)
round(c(mean = mean(my_sample), p = my_res4$p.value), 3)
#>  mean     p
#> 102.21 0.319
```

**Explanation:** Even though the true mean (102) differs from H0 (100), the p-value (0.319) is not significant. Eight observations with sd = 5 give very low statistical power; a real but small effect goes undetected. This is a Type II error: failing to reject a false H0.

</details>

[NOTE]
**Non-significant is not the same as zero effect.** Exercise 4 shows why. The sample mean is 102, the population mean is 102, and yet `p > 0.05`. Low power, not absence of effect.

**Two-sample t-tests**

### Exercise 5: Welch two-sample with formula notation

Compare `mpg` between automatic (`am = 0`) and manual (`am = 1`) cars in `mtcars` using the formula interface. This is Welch's test by default, no equal-variance assumption. Store in `my_res5`.

```r title="Exercise 5 starter: Welch two-sample"
# Hint: formula is y ~ group. Welch is the default when var.equal is not set.

my_res5 <- NULL
# my_res5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
my_res5 <- t.test(mpg ~ am, data = mtcars)
round(c(t = my_res5$statistic, df = my_res5$parameter, p = my_res5$p.value), 4)
#>       t.t     df.df         p
#>  -3.7671   18.3323    0.0014
```

**Explanation:** p = 0.0014 indicates a clear mpg difference between transmission types. Notice the fractional df (18.33): Welch's adjustment shrinks the degrees of freedom to account for unequal group variances.

</details>

[TIP]
**Formula notation `y ~ group` requires exactly two levels.** If your grouping variable has 3+ levels, subset first (as in Exercise 6) or switch to one-way ANOVA with `aov()`.

### Exercise 6: Student two-sample with var.equal = TRUE

Using `iris`, compare `Petal.Length` between `"setosa"` and `"versicolor"`. Assume equal variances by setting `var.equal = TRUE` (Student's classical form). Store in `my_res6`.

```r title="Exercise 6 starter: Student two-sample"
# Hint: subset iris to only two species first, then use the formula interface.

iris_two <- subset(iris, Species %in% c("setosa", "versicolor"))
my_res6  <- NULL
# my_res6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
iris_two <- subset(iris, Species %in% c("setosa", "versicolor"))
my_res6  <- t.test(Petal.Length ~ Species, data = iris_two, var.equal = TRUE)
round(c(t = my_res6$statistic, df = my_res6$parameter, p = my_res6$p.value), 4)
#>      t.t    df.df        p
#> -39.4927  98.0000   0.0000
```

**Explanation:** Degrees of freedom are integer (98 = n1 + n2 - 2), confirming this is the classical Student form. The enormous t-statistic reflects the huge gap between setosa and versicolor petal lengths, a textbook case of clear group separation.

</details>

### Exercise 7: One-tailed two-sample test

Using `iris`, test whether `Sepal.Width` of `"virginica"` is *greater* than that of `"versicolor"`. Use `alternative = "greater"`. Store in `my_res7`.

```r title="Exercise 7 starter: one-tailed two-sample"
# Hint: the order of levels matters for alternative = "greater".
# R compares the first level against the second in alphabetical order by default.

iris_vv <- subset(iris, Species %in% c("versicolor", "virginica"))
iris_vv$Species <- factor(iris_vv$Species, levels = c("virginica", "versicolor"))
my_res7 <- NULL
# my_res7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
iris_vv <- subset(iris, Species %in% c("versicolor", "virginica"))
iris_vv$Species <- factor(iris_vv$Species, levels = c("virginica", "versicolor"))
my_res7 <- t.test(Sepal.Width ~ Species, data = iris_vv, alternative = "greater")
round(c(t = my_res7$statistic, p = my_res7$p.value), 4)
#>     t.t       p
#>  3.2058  0.0009
```

**Explanation:** The relevelling ensures `virginica` is the reference level, so `alternative = "greater"` tests `virginica mean > versicolor mean`. p = 0.0009 is strong evidence for the directional claim. Always check how your factor is ordered before a one-tailed two-sample test.

</details>

### Exercise 8: Cohen's d for a two-sample comparison

Using `chickwts`, compute Cohen's d for the weight difference between `"casein"` and `"horsebean"` feeds using the pooled-standard-deviation formula. Store the result in `my_d8`.

$$d = \frac{\bar{x}_1 - \bar{x}_2}{s_{\text{pooled}}}, \quad s_{\text{pooled}} = \sqrt{\frac{(n_1 - 1) s_1^2 + (n_2 - 1) s_2^2}{n_1 + n_2 - 2}}$$

```r title="Exercise 8 starter: Cohen's d"
# Hint: split the two feeds, compute pooled SD, then the standardized difference.

x1 <- chickwts$weight[chickwts$feed == "casein"]
x2 <- chickwts$weight[chickwts$feed == "horsebean"]
my_d8 <- 0
# round(my_d8, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
x1 <- chickwts$weight[chickwts$feed == "casein"]
x2 <- chickwts$weight[chickwts$feed == "horsebean"]
n1 <- length(x1); n2 <- length(x2)
s_pooled <- sqrt(((n1 - 1) * var(x1) + (n2 - 1) * var(x2)) / (n1 + n2 - 2))
my_d8 <- (mean(x1) - mean(x2)) / s_pooled
round(my_d8, 2)
#> [1] 2.82
```

**Explanation:** d = 2.82 is a huge effect (well above the 0.8 "large" threshold). Chicks on casein weigh nearly three pooled standard deviations more than chicks on horsebean, a gap far bigger than the p-value alone would communicate.

</details>

**Paired t-tests**

### Exercise 9: Classic paired test

Use the built-in `sleep` dataset, which measures extra hours slept for 10 subjects under two drugs. Run a paired t-test comparing `group = 1` and `group = 2`. Store the result in `my_res9`.

```r title="Exercise 9 starter: paired classic"
# Hint: formula y ~ group with paired = TRUE. Data must be sorted so row i
# in group 1 matches row i in group 2. The sleep dataset already is.

my_res9 <- NULL
# my_res9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
my_res9 <- t.test(extra ~ group, data = sleep, paired = TRUE)
round(c(t = my_res9$statistic, df = my_res9$parameter, p = my_res9$p.value), 4)
#>     t.t   df.df       p
#> -4.0621  9.0000  0.0028
```

**Explanation:** p = 0.0028, df = 9 (one less than the 10 pairs). The two drugs produce significantly different extra-sleep amounts. Because the same 10 subjects appear in both groups, each pair contributes one difference, hence the n - 1 = 9 degrees of freedom.

</details>

### Exercise 10: Paired vs independent on the same data

Run *two* tests on `sleep`: a paired test (`my_paired`) and an independent two-sample test (`my_indep`). Compare the p-values and explain why they differ.

```r title="Exercise 10 starter: paired vs independent"
# Hint: same formula, just flip paired = TRUE / FALSE.

my_paired <- NULL
my_indep  <- NULL
# c(paired = my_paired$p.value, indep = my_indep$p.value)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
my_paired <- t.test(extra ~ group, data = sleep, paired = TRUE)
my_indep  <- t.test(extra ~ group, data = sleep, paired = FALSE)
round(c(paired_p = my_paired$p.value, indep_p = my_indep$p.value), 4)
#> paired_p  indep_p
#>   0.0028   0.0794
```

**Explanation:** The paired test delivers p = 0.0028 while the independent test gives p = 0.079. Same data, wildly different verdicts.

</details>

[KEY INSIGHT]
**Pairing removes between-subject variance, so paired tests are more powerful on the same data.** When each subject is their own control, the individual baseline drops out of the comparison. The independent test mixes within-subject and between-subject variability, inflating the noise and hiding the signal.

### Exercise 11: One-tailed paired test

Using `sleep`, test whether drug 2 produces *more* extra sleep than drug 1. Use `alternative = "greater"` with a careful factor ordering so the direction is correct. Store in `my_res11`.

```r title="Exercise 11 starter: one-tailed paired"
# Hint: relevel group so level 1 is "2" and level 2 is "1", then
# alternative = "greater" tests mean(group=2) > mean(group=1).

sleep2 <- sleep
sleep2$group <- factor(sleep2$group, levels = c("2", "1"))
my_res11 <- NULL
# my_res11
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 11 solution"
sleep2 <- sleep
sleep2$group <- factor(sleep2$group, levels = c("2", "1"))
my_res11 <- t.test(extra ~ group, data = sleep2, paired = TRUE,
                   alternative = "greater")
round(c(t = my_res11$statistic, p = my_res11$p.value), 4)
#>    t.t      p
#> 4.0621 0.0014
```

**Explanation:** p = 0.0014 = 0.0028 / 2, exactly half the two-sided paired p-value. That halving only makes sense if the data points the predicted way, which it does here (drug 2's mean > drug 1's mean). Never use a one-tailed test as a way to rescue a borderline two-sided p-value; commit to the direction before running the test.

</details>

### Exercise 12: Assumption check before a paired test

For a paired t-test, normality must hold on the *differences*, not on the two raw groups. Run `shapiro.test()` on the differences for `sleep`, then run the paired t-test. Store the differences in `my_diffs` and the test in `my_res12`.

```r title="Exercise 12 starter: shapiro + paired"
# Hint: extract the two groups as vectors first, subtract to get differences,
# then shapiro.test(my_diffs).

g1 <- sleep$extra[sleep$group == 1]
g2 <- sleep$extra[sleep$group == 2]
my_diffs <- NULL
my_res12 <- NULL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 12 solution"
g1 <- sleep$extra[sleep$group == 1]
g2 <- sleep$extra[sleep$group == 2]
my_diffs <- g2 - g1
sh <- shapiro.test(my_diffs)
my_res12 <- t.test(g2, g1, paired = TRUE)
round(c(shapiro_p = sh$p.value, ttest_p = my_res12$p.value), 4)
#> shapiro_p   ttest_p
#>    0.8318    0.0028
```

**Explanation:** Shapiro-Wilk on the differences gives p = 0.83, so you fail to reject normality. The paired t-test is justified, and its p = 0.0028 matches the formula call in Exercise 9. If Shapiro had returned p < 0.05, you would switch to `wilcox.test(g2, g1, paired = TRUE)`.

</details>

[WARNING]
**Do not run Shapiro on the raw groups for a paired test.** You could easily see non-normality in `g1` and `g2` separately while the differences are perfectly normal (and vice versa). The paired t-test assumption is on the differences, full stop.

## Complete Example: Medication Effect on Systolic Blood Pressure

One end-to-end workflow that combines test selection, assumption check, t-test, effect size, and an APA-style report. This is the pattern to reuse on your own paired data.

**Scenario.** Fifteen patients have their systolic blood pressure measured at baseline and again six weeks after starting a new medication. You want to know whether the medication lowers BP on average. Because each subject contributes two measurements, this is a paired design, and you expect a negative direction (post < pre).

First, simulate realistic paired data with a known drop.

```r title="Simulate paired blood pressure data"
set.seed(2026)
n <- 15
bp_before <- rnorm(n, mean = 145, sd = 10)
bp_after  <- bp_before - rnorm(n, mean = 8, sd = 4)  # true drop ~ 8 mmHg
bp_diff   <- bp_after - bp_before
round(data.frame(subject = 1:n, before = bp_before,
                 after = bp_after, diff = bp_diff), 1)[1:5, ]
#>   subject before after diff
#> 1       1  140.6 132.2 -8.4
#> 2       2  150.9 139.5 -11.4
#> 3       3  143.7 139.9 -3.8
#> 4       4  147.2 133.6 -13.6
#> 5       5  150.6 140.2 -10.4
```

The first five rows confirm each subject's `after` reading is below their `before` reading. Now run the full assumption-check + test + effect-size sequence.

```r title="Assumption check, paired test, Cohen's d"
# 1. Normality of the differences
bp_shapiro <- shapiro.test(bp_diff)

# 2. Paired t-test, one-tailed (alternative = "less" because we expect a drop)
bp_test <- t.test(bp_after, bp_before, paired = TRUE, alternative = "less")

# 3. Cohen's d for paired data: mean(diff) / sd(diff)
bp_d <- mean(bp_diff) / sd(bp_diff)

round(c(shapiro_p = bp_shapiro$p.value,
        t         = bp_test$statistic,
        df        = bp_test$parameter,
        p         = bp_test$p.value,
        ci_upper  = bp_test$conf.int[2],
        cohen_d   = bp_d), 3)
#> shapiro_p       t.t     df.df         p  ci_upper   cohen_d
#>     0.937    -9.228    14.000     0.000    -6.881    -2.382
```

Everything lines up. Shapiro's p = 0.94 confirms normal differences. The paired t-test rejects H0 overwhelmingly with `t(14) = -9.23, p < 0.001`, and the one-sided 95% CI rules out any drop smaller than 6.88 mmHg. Cohen's d is -2.38, far beyond "large." The APA-style report writes itself:

> *A paired-samples t-test showed a significant drop in systolic blood pressure after six weeks of medication (M_before = 147.6, M_after = 139.4), t(14) = -9.23, p < .001, one-sided 95% CI [-∞, -6.88], Cohen's d = -2.38.*

This template, simulate or load → check assumption → test → effect size → one-sentence APA report, is the exact sequence to reuse when writing up any of the twelve exercises above against your own data.

## Summary

| Test | R call | Assumption check | Effect size |
|---|---|---|---|
| One-sample | `t.test(x, mu = m0)` | Shapiro on `x` | `(mean(x) - m0) / sd(x)` |
| Welch two-sample | `t.test(y ~ g, data = d)` | Shapiro per group | Cohen's d with pooled SD |
| Student two-sample | `t.test(y ~ g, data = d, var.equal = TRUE)` | Shapiro per group + `var.test()` | Cohen's d with pooled SD |
| Paired | `t.test(y ~ g, data = d, paired = TRUE)` | Shapiro on the differences | `mean(diff) / sd(diff)` |

Key habits you should now have locked in:

- Pick the test from the data layout, not from what looks convenient.
- Always extract the named fields (`$p.value`, `$conf.int`, `$estimate`) rather than eyeballing the printed block.
- Run the assumption check on the correct quantity (raw groups for two-sample, differences for paired).
- Report p-value, 95% CI, and an effect size together, never the p-value alone.
- Commit to one-sided direction *before* seeing the data; do not use it as a p-hacking rescue.

## References

1. R Core Team, `t.test()` reference documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
2. Student, "The Probable Error of a Mean." *Biometrika* 6(1), 1908. The original t-test paper. [Link](https://www.jstor.org/stable/2331554)
3. Welch, B. L., "The generalization of Student's problem when several different population variances are involved." *Biometrika* 34, 1947. [Link](https://www.jstor.org/stable/2332510)
4. Navarro, D., *Learning Statistics with R*, Chapter 13: Comparing two means. [Link](https://learningstatisticswithr.com/book/ttest.html)
5. Diez, Barr, Çetinkaya-Rundel, *OpenIntro Statistics*, 4th ed., Chapter 7. [Link](https://www.openintro.org/book/os/)
6. Cohen, J., *Statistical Power Analysis for the Behavioral Sciences*, 2nd ed., Routledge, 1988. Effect-size thresholds for d.
7. Wickham, H. & Grolemund, G., *R for Data Science*. [Link](https://r4ds.hadley.nz/)

## Continue Learning

1. **[t-Tests in R](t-Tests-in-R.html)**, the canonical reference that covers the decision rule, assumption checks, and effect sizes in depth; use it when any exercise above leaves you wanting more theory.
2. **[Hypothesis Testing in R](Hypothesis-Testing-in-R.html)**, situates the t-test inside the broader hypothesis-testing framework, alongside chi-square, proportion tests, and non-parametric alternatives.
3. **[Effect Size in R](Effect-Size-in-R.html)**, deep-dive on Cohen's d, Hedges' g, and Glass's delta, with the pooled-SD formulas that Exercise 8 and the Complete Example use.
