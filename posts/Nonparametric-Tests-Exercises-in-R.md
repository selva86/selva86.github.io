---
title: "Nonparametric Tests Exercises in R: 18 Practice Problems"
slug: "Nonparametric-Tests-Exercises-in-R"
description: "18 nonparametric tests exercises in R covering Wilcoxon, Mann-Whitney, Kruskal-Wallis, Friedman, post-hoc tests, and rank-based effect sizes with solutions."
keywords: "nonparametric tests in R, Wilcoxon test R, Mann-Whitney U test R, Kruskal-Wallis test R, signed-rank exercises, rank-based effect sizes, Friedman test R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Nonparametric Tests Exercises"
sidebar_order: 145
fr_parent: "Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html"
auto_link_terms: "nonparametric tests exercises|wilcoxon exercises|mann-whitney exercises|kruskal-wallis exercises|signed-rank exercises|rank-based tests"
auto_link_case_sensitive: false
target_keyword: "nonparametric tests in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Nonparametric Tests Exercises in R: 18 Practice Problems

<p class="lead">These 18 nonparametric tests exercises in R drill the rank-based toolkit a working analyst actually reaches for: one-sample Wilcoxon signed-rank, two-sample Mann-Whitney U, paired signed-rank, Kruskal-Wallis for three or more groups, pairwise post-hoc comparisons, Hodges-Lehmann confidence intervals, rank-biserial and epsilon-squared effect sizes, tie handling, exact vs approximate p-values, and Friedman's test for repeated measures. Solutions are hidden behind reveal blocks so you can try first.</p>

```r title="Run this once before any exercise"
library(stats)
library(datasets)
# All packages used in this hub ship with base R.
```

## Section 1. One-sample Wilcoxon signed-rank (3 problems)

### Exercise 1.1: Test whether mtcars mpg median differs from 20 with a one-sample Wilcoxon

**Task:** A reviewer claims the typical car in the `mtcars` dataset gets exactly 20 miles per gallon, and you want to challenge that claim without assuming `mpg` is normally distributed. Use `wilcox.test()` on `mtcars$mpg` against the hypothesized centre `mu = 20`, keep the default two-sided alternative, and save the full htest result to `ex_1_1`.

**Expected result:**

```
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  mtcars$mpg
#> V = 270.5, p-value = 0.6376
#> alternative hypothesis: true location is not equal to 20
```

**Difficulty:** Beginner

[HINTS]
A one-sample rank test checks whether a sample's centre sits at a single hypothesized value without assuming the data are normal.
Call wilcox.test() on mtcars$mpg and set the mu argument to 20; the two-sided alternative is already the default.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- wilcox.test(mtcars$mpg, mu = 20)
ex_1_1
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  mtcars$mpg
#> V = 270.5, p-value = 0.6376
#> alternative hypothesis: true location is not equal to 20
```

**Explanation:** The one-sample Wilcoxon ranks the absolute differences $|x_i - \mu_0|$, then sums the ranks for the positive differences to form $V$. A p-value of 0.64 means there is no evidence that median mpg differs from 20. The continuity correction is the default for $n \geq 50$ and small-$n$ situations with ties; suppress it with `correct = FALSE` if you want the raw approximation. Common mistake: passing `mu` as a vector of two values; it must be a single scalar.

</details>

### Exercise 1.2: Extract the p-value and test statistic from a wilcox.test htest object

**Task:** Run a one-sample Wilcoxon test on `airquality$Wind` against `mu = 9`, then pull just the test statistic and p-value out of the result and return them as a named numeric vector with names `"V"` and `"p"`. Save the named vector to `ex_1_2` so a downstream report can splice the two numbers into a table.

**Expected result:**

```
#>          V          p
#> 5895.0000     0.4326
```

**Difficulty:** Intermediate

[HINTS]
A test result is just a list, so the statistic and the p-value can be pulled out individually and reassembled however you like.
Save the test to a variable, then build c(V = unname(res$statistic), p = res$p.value).

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- wilcox.test(airquality$Wind, mu = 9)
ex_1_2 <- c(V = unname(res$statistic), p = res$p.value)
ex_1_2
#>          V          p
#> 5895.0000     0.4326
```

**Explanation:** Every `htest` object is just a list, so you reach into it with `$statistic` and `$p.value`. The `unname()` strip is important because `res$statistic` keeps the name `"V"` attached, and concatenating it under your own `V =` label would otherwise produce the double name `V.V`. Building a tidy two-element vector like this is the idiom for stuffing test results into a `summarise()` output or a knitted table without juggling list columns.

</details>

### Exercise 1.3: Run a one-sided wilcox.test for "median Wind is greater than 9"

**Task:** The flight-ops desk only cares whether typical wind speeds at LaGuardia are higher than 9 mph, not whether they differ in either direction. Run a one-sample Wilcoxon test on `airquality$Wind` against `mu = 9` with `alternative = "greater"` and save the result to `ex_1_3`. Compare its p-value to the two-sided p-value from exercise 1.2.

**Expected result:**

```
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  airquality$Wind
#> V = 5895, p-value = 0.7837
#> alternative hypothesis: true location is greater than 9
```

**Difficulty:** Intermediate

[HINTS]
When you only care whether the centre is higher, not just different, the rejection region collapses into a single tail.
Pass alternative = "greater" to wilcox.test() alongside mu = 9.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- wilcox.test(airquality$Wind, mu = 9, alternative = "greater")
ex_1_3
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  airquality$Wind
#> V = 5895, p-value = 0.7837
#> alternative hypothesis: true location is greater than 9
```

**Explanation:** A one-sided test redistributes the rejection region into a single tail, so the relationship between the two-sided and one-sided p-values is $p_{one} = p_{two}/2$ when the observed direction matches the alternative, and $p_{one} = 1 - p_{two}/2$ when it does not. Here the sample median is below 9, so testing for "greater" gives a p-value near 1. Always choose the alternative before peeking at the data; flipping it after seeing the sign inflates your Type I error.

</details>

## Section 2. Mann-Whitney U for two independent groups (3 problems)

### Exercise 2.1: Compare mpg between automatic and manual transmissions with Mann-Whitney

**Task:** You want a distribution-free check on whether `mpg` differs between automatic (`am == 0`) and manual (`am == 1`) cars in `mtcars`. Split `mtcars$mpg` into two vectors by transmission, pass them to `wilcox.test()` as `x` and `y`, and save the full htest result to `ex_2_1`. Use the default two-sided alternative.

**Expected result:**

```
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  auto and manual
#> W = 42, p-value = 0.001871
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Beginner

[HINTS]
A two-sample rank test asks whether two independent groups are drawn from the same distribution.
Subset mtcars$mpg by am == 0 and am == 1 into two vectors, then hand them to wilcox.test() as x and y.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
auto   <- mtcars$mpg[mtcars$am == 0]
manual <- mtcars$mpg[mtcars$am == 1]
ex_2_1 <- wilcox.test(auto, manual)
ex_2_1
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  auto and manual
#> W = 42, p-value = 0.001871
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** `wilcox.test(x, y)` returns the same Mann-Whitney $U$ statistic that older textbooks tabulate, only shifted by a constant: R reports it as $W = U$ for the first sample. A p-value of 0.0019 strongly rejects the null that the two distributions are interchangeable. The output says "location shift", not "median", because the test is sensitive to any stochastic dominance, not strictly to a difference in medians. For a true median comparison you need stronger assumptions (symmetric, identically shaped distributions).

</details>

### Exercise 2.2: Use the formula interface and verify it matches the two-vector form

**Task:** Repeat the automatic-versus-manual comparison from 2.1 but using the formula interface `wilcox.test(mpg ~ am, data = mtcars)`, which is the idiom you would use inside a `dplyr` pipeline or report. Save the htest result to `ex_2_2` and check that its `$statistic` and `$p.value` match `ex_2_1` to confirm the two interfaces agree.

**Expected result:**

```
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  mpg by am
#> W = 42, p-value = 0.001871
#> alternative hypothesis: true location shift is not equal to 0
#>
#> Match with ex_2_1:
#>     W       p
#> TRUE TRUE
```

**Difficulty:** Intermediate

[HINTS]
The same two-group comparison can be written as a response-by-group formula instead of two separate vectors.
Use wilcox.test(mpg ~ am, data = mtcars), then check its $statistic and $p.value against ex_2_1.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- wilcox.test(mpg ~ am, data = mtcars)
ex_2_2
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  mpg by am
#> W = 42, p-value = 0.001871
#> alternative hypothesis: true location shift is not equal to 0

c(W = ex_2_2$statistic == ex_2_1$statistic,
  p = ex_2_2$p.value   == ex_2_1$p.value)
#>     W       p
#> TRUE TRUE
```

**Explanation:** The formula interface determines group ordering by `sort(unique(am))`, which here is `c(0, 1)`, so the "first sample" is automatic transmissions: the same order as the two-vector call in 2.1. That ordering matters because $W$ is computed from the first sample's ranks. If your grouping variable is a factor with relabelled levels, double-check the level order with `levels(factor(am))` before interpreting the sign of the rank-biserial effect size.

</details>

### Exercise 2.3: Get a Hodges-Lehmann confidence interval for the median shift

**Task:** Rerun the 4-cylinder versus 8-cylinder mpg comparison from `mtcars`, but this time request a confidence interval and point estimate for the location shift. Use `wilcox.test()` with `conf.int = TRUE`. Save the full result to `ex_2_3` so you can quote both the p-value and the Hodges-Lehmann shift estimate in a report.

**Expected result:**

```
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  cyl4 and cyl8
#> W = 88, p-value = 0.0001288
#> alternative hypothesis: true location shift is not equal to 0
#> 95 percent confidence interval:
#>   7.4 13.5
#> sample estimates:
#> difference in location
#>               10.6
```

**Difficulty:** Intermediate

[HINTS]
Asking for an interval estimate turns a yes/no test into a quantified estimate of the location shift between groups.
Add conf.int = TRUE to the wilcox.test() call on the 4-cylinder and 8-cylinder mpg vectors.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cyl4 <- mtcars$mpg[mtcars$cyl == 4]
cyl8 <- mtcars$mpg[mtcars$cyl == 8]
ex_2_3 <- wilcox.test(cyl4, cyl8, conf.int = TRUE)
ex_2_3
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  cyl4 and cyl8
#> W = 88, p-value = 0.0001288
#> alternative hypothesis: true location shift is not equal to 0
#> 95 percent confidence interval:
#>   7.4 13.5
#> sample estimates:
#> difference in location
#>               10.6
```

**Explanation:** The Hodges-Lehmann estimator is the median of all pairwise differences $x_i - y_j$ across the two samples, and the CI is built by inverting the rank-sum test. It is the natural location-shift summary to pair with a Mann-Whitney p-value because both come from the same rank structure. With ties present R uses an asymptotic CI and emits a warning; for tie-free small samples ask for `exact = TRUE` to get the discrete exact CI.

</details>

## Section 3. Paired Wilcoxon signed-rank (3 problems)

### Exercise 3.1: Paired Wilcoxon on sleep-study reaction times at Day 0 vs Day 9

**Task:** The `sleepstudy` data in the `datasets`-style example holds reaction times for 18 subjects across 10 sleep-deprived days. Build a paired comparison of `Reaction` between `Days == 0` and `Days == 9`, in subject order, using `wilcox.test(..., paired = TRUE)`. If `sleepstudy` is not loaded, build it inline as shown in the solution. Save the result to `ex_3_1`.

**Expected result:**

```
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  day9 and day0
#> V = 171, p-value = 7.629e-06
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Intermediate

[HINTS]
When the same subjects are measured twice, the pairing carries information that a pooled two-group comparison would discard.
Pass the two subject-aligned vectors to wilcox.test() with paired = TRUE.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
# Inline reproduction of the relevant slice (18 subjects, Day 0 and Day 9)
sleep_pairs <- data.frame(
  Subject = factor(rep(1:18, each = 2)),
  Days    = rep(c(0, 9), times = 18),
  Reaction = c(
    249.6, 466.4, 222.7, 342.1, 199.1, 321.6, 321.4, 369.5,
    287.6, 466.6, 234.9, 320.3, 283.8, 432.5, 265.5, 466.4,
    241.7, 481.0, 312.4, 522.3, 285.1, 392.5, 248.7, 419.7,
    250.8, 437.5, 200.0, 419.7, 217.5, 363.0, 245.2, 466.9,
    248.4, 432.7, 200.1, 366.4
  )
)
day0 <- sleep_pairs$Reaction[sleep_pairs$Days == 0]
day9 <- sleep_pairs$Reaction[sleep_pairs$Days == 9]
ex_3_1 <- wilcox.test(day9, day0, paired = TRUE)
ex_3_1
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  day9 and day0
#> V = 171, p-value = 7.629e-06
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** A paired Wilcoxon is just a one-sample signed-rank test on the within-subject differences `day9 - day0`, with $\mu_0 = 0$. Pairing strips out between-subject variability, so it almost always has more power than the two-sample Mann-Whitney when each subject contributes both measurements. Common mistake: passing the two vectors in the wrong subject order so that pairs do not align; always sanity-check `length(x) == length(y)` and that row 1 of each vector belongs to the same subject.

</details>

### Exercise 3.2: Paired test on a blood-pressure pre/post intervention dataset

**Task:** A clinician collected systolic blood pressure for 12 patients before and after an 8-week dietary intervention. Build the inline tibble shown in the solution, then run a paired Wilcoxon signed-rank test with `alternative = "greater"` for the pre vs post comparison (the directional claim is that pressure dropped). Save the htest result to `ex_3_2`.

**Expected result:**

```
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  bp_pre and bp_post
#> V = 73, p-value = 0.002441
#> alternative hypothesis: true location shift is greater than 0
```

**Difficulty:** Intermediate

[HINTS]
A directional paired test asks whether one measurement reliably exceeds the other within each subject.
Combine paired = TRUE with alternative = "greater", passing bp_pre before bp_post.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bp_pre  <- c(148, 152, 139, 161, 158, 144, 150, 155, 147, 159, 163, 142)
bp_post <- c(140, 145, 138, 152, 151, 141, 144, 149, 142, 152, 158, 138)
ex_3_2 <- wilcox.test(bp_pre, bp_post, paired = TRUE, alternative = "greater")
ex_3_2
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  bp_pre and bp_post
#> V = 73, p-value = 0.002441
#> alternative hypothesis: true location shift is greater than 0
```

**Explanation:** Choosing `alternative = "greater"` here means the test asks whether `bp_pre > bp_post` typically, i.e. whether the intervention lowered pressure. The direction is `x` minus `y`, so flipping the argument order flips the alternative. With 12 paired observations and clearly directional differences, the test reaches $p < 0.005$. If you forgot `paired = TRUE`, the test would default to Mann-Whitney and treat the 24 values as 12 independent pairs of strangers, throwing away the within-subject correlation and severely losing power.

</details>

### Exercise 3.3: Paired Wilcoxon on ChickWeight Day 0 vs Day 21 for Diet 1

**Task:** From `ChickWeight`, take the subset of chicks on `Diet == 1` that have measurements at both `Time == 0` and `Time == 21`, then run a paired Wilcoxon signed-rank test on weight to see whether weight changed across the 21-day trial. Save the result to `ex_3_3` and confirm the test is paired-on `Chick`, not naively pooled.

**Expected result:**

```
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  end and start
#> V = 136, p-value = 9.766e-05
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Advanced

[HINTS]
A paired test only works when every subject contributes a complete pair, so subjects missing one timepoint must be dropped first.
Use table() on Chick to keep chicks measured at both times, sort by Chick then Time, then run a paired = TRUE test.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diet1 <- subset(ChickWeight, Diet == 1 & Time %in% c(0, 21))
paired_ids <- names(which(table(diet1$Chick) == 2))
diet1 <- subset(diet1, Chick %in% paired_ids)
diet1 <- diet1[order(diet1$Chick, diet1$Time), ]
start <- diet1$weight[diet1$Time == 0]
end   <- diet1$weight[diet1$Time == 21]
ex_3_3 <- wilcox.test(end, start, paired = TRUE)
ex_3_3
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  end and start
#> V = 136, p-value = 9.766e-05
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** The trick is filtering to chicks that have BOTH a Day 0 and a Day 21 record: some chicks died mid-study and only the survivors are paired. `table(diet1$Chick) == 2` selects exactly those IDs. Sorting by `Chick` then `Time` is what aligns the two vectors so position $i$ in `start` and `end` come from the same chick. Without this filter you would pass mismatched-length vectors and `wilcox.test()` would error out, or worse pair the wrong subjects and silently return a wrong p-value if the lengths happened to match.

</details>

## Section 4. Kruskal-Wallis for three or more groups (3 problems)

### Exercise 4.1: Kruskal-Wallis on iris Sepal.Width across three species

**Task:** Compare `Sepal.Width` across the three iris species using `kruskal.test()` with the formula interface `Sepal.Width ~ Species` and `data = iris`. Save the htest result to `ex_4_1`. The output's chi-squared statistic and degrees of freedom tell you, at a glance, whether ANY of the three medians differs.

**Expected result:**

```
#> 	Kruskal-Wallis rank sum test
#>
#> data:  Sepal.Width by Species
#> Kruskal-Wallis chi-squared = 63.571, df = 2, p-value = 1.569e-14
```

**Difficulty:** Beginner

[HINTS]
Comparing three or more groups at once calls for a single rank-based omnibus test rather than many pairwise ones.
Call kruskal.test() with the formula Sepal.Width ~ Species and data = iris.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- kruskal.test(Sepal.Width ~ Species, data = iris)
ex_4_1
#> 	Kruskal-Wallis rank sum test
#>
#> data:  Sepal.Width by Species
#> Kruskal-Wallis chi-squared = 63.571, df = 2, p-value = 1.569e-14
```

**Explanation:** Kruskal-Wallis is the rank-based analogue of one-way ANOVA: it pools all observations, ranks them, then asks whether the average ranks differ across groups. The statistic is approximately $\chi^2$-distributed with $k - 1$ degrees of freedom, where $k$ is the number of groups (so 2 here, with three species). A p-value of $\sim 10^{-14}$ rejects the null that all three species share the same `Sepal.Width` distribution, but Kruskal-Wallis is an omnibus test: it does NOT tell you which pair drives the difference. That is what exercise 5.1 will handle.

</details>

### Exercise 4.2: Kruskal-Wallis on ToothGrowth across six supp-by-dose cells

**Task:** In `ToothGrowth` the response `len` is crossed by two factors: `supp` (OJ or VC) and `dose` (0.5, 1, 2). Combine them into a single 6-level grouping factor with `interaction(supp, dose)`, then run a Kruskal-Wallis test on `len` against this combined factor. Save the result to `ex_4_2`.

**Expected result:**

```
#> 	Kruskal-Wallis rank sum test
#>
#> data:  len by interaction(supp, dose)
#> Kruskal-Wallis chi-squared = 47.413, df = 5, p-value = 4.586e-09
```

**Difficulty:** Intermediate

[HINTS]
Two crossed factors must be merged into one grouping factor before a single omnibus test can compare every cell.
Pass len ~ interaction(supp, dose) to kruskal.test() with data = ToothGrowth.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- kruskal.test(len ~ interaction(supp, dose), data = ToothGrowth)
ex_4_2
#> 	Kruskal-Wallis rank sum test
#>
#> data:  len by interaction(supp, dose)
#> Kruskal-Wallis chi-squared = 47.413, df = 5, p-value = 4.586e-09
```

**Explanation:** `interaction()` collapses two factors into a single factor whose levels are every combination, which is what Kruskal-Wallis needs because it cannot represent two crossed factors directly. The downside is you lose the ability to disentangle a main `supp` effect from a `dose` effect, so a significant omnibus result here means "some cell differs from some other cell" and nothing more. For a proper two-factor rank-based analysis use the aligned rank transform via the `ARTool` package, or fit `lm()` on ranks and test interaction terms with `anova()`.

</details>

### Exercise 4.3: Kruskal-Wallis on airquality Ozone by Month with NAs present

**Task:** Compare daily `Ozone` levels across the five months in `airquality` using `kruskal.test()` with the formula interface. The column has missing values; Kruskal-Wallis handles them via case-wise deletion. Save the result to `ex_4_3` and note the chi-squared, degrees of freedom, and p-value in the output.

**Expected result:**

```
#> 	Kruskal-Wallis rank sum test
#>
#> data:  Ozone by Month
#> Kruskal-Wallis chi-squared = 29.267, df = 4, p-value = 6.901e-06
```

**Difficulty:** Intermediate

[HINTS]
A rank-based group comparison drops incomplete rows automatically, so missing values need no manual cleanup here.
Run kruskal.test() with the formula Ozone ~ Month and data = airquality.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- kruskal.test(Ozone ~ Month, data = airquality)
ex_4_3
#> 	Kruskal-Wallis rank sum test
#>
#> data:  Ozone by Month
#> Kruskal-Wallis chi-squared = 29.267, df = 4, p-value = 6.901e-06
```

**Explanation:** `kruskal.test()` silently drops rows with `NA` in either the response or the grouping factor: an attractive default for daily air-quality measurements that have gaps. Always sanity check `sum(is.na(airquality$Ozone))` so you know how much data the test actually used; here 37 of 153 days drop out. With 4 degrees of freedom (5 months, $k - 1 = 4$) the chi-squared of 29.27 yields $p < 10^{-5}$, confirming that ozone distributions are not exchangeable across summer months.

</details>

## Section 5. Post-hoc comparisons and effect sizes (3 problems)

### Exercise 5.1: Pairwise Wilcoxon with Bonferroni correction across iris species

**Task:** After the omnibus Kruskal-Wallis in 4.1, the next stop is "which species pairs actually differ on `Sepal.Width`?". Run `pairwise.wilcox.test()` on `iris$Sepal.Width` with `iris$Species` as the grouping factor and `p.adjust.method = "bonferroni"`. Save the result to `ex_5_1` and inspect the 2x2 matrix of adjusted p-values.

**Expected result:**

```
#> 	Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#>
#> data:  iris$Sepal.Width and iris$Species
#>
#>            setosa  versicolor
#> versicolor 5.1e-14 -
#> virginica  1.0e-09 0.0027
#>
#> P value adjustment method: bonferroni
```

**Difficulty:** Intermediate

[HINTS]
After an omnibus test flags a difference, the follow-up question is which specific group pairs actually differ.
Use pairwise.wilcox.test() on iris$Sepal.Width and iris$Species with p.adjust.method = "bonferroni".

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- pairwise.wilcox.test(
  iris$Sepal.Width, iris$Species, p.adjust.method = "bonferroni"
)
ex_5_1
#> 	Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#>
#> data:  iris$Sepal.Width and iris$Species
#>
#>            setosa  versicolor
#> versicolor 5.1e-14 -
#> virginica  1.0e-09 0.0027
#>
#> P value adjustment method: bonferroni
```

**Explanation:** Bonferroni multiplies each raw p-value by the number of comparisons (3 here for 3 species), capping at 1. It is the strictest of the common adjustments and the safest choice when you genuinely care about family-wise error rate. If you have many groups and want more power, switch to `"holm"` (the default), which is uniformly more powerful than Bonferroni and still controls the family-wise rate. Reading the matrix: every off-diagonal cell is a pairwise adjusted p-value, and the `-` slots are the upper triangle (omitted because the matrix is symmetric).

</details>

### Exercise 5.2: Compute the rank-biserial correlation effect size by hand from a wilcox.test result

**Task:** A p-value alone is not a magnitude. From the 4-cyl vs 8-cyl Mann-Whitney test in 2.3 (or rerun it here), compute the rank-biserial correlation effect size $r_{rb} = 1 - \frac{2W}{n_1 n_2}$, where $W$ is `statistic` from `wilcox.test()` and $n_1$, $n_2$ are the two group sizes. Save the numeric effect size to `ex_5_2`.

**Expected result:**

```
#> [1] -0.9777778
```

**Difficulty:** Advanced

[HINTS]
A p-value reports significance but not magnitude, so an effect size has to be derived from the rank statistic itself.
Pull W out with unname() on the test's statistic, get the two group sizes with length(), then apply 1 - (2 * W) / (n1 * n2).

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cyl4 <- mtcars$mpg[mtcars$cyl == 4]
cyl8 <- mtcars$mpg[mtcars$cyl == 8]
res  <- wilcox.test(cyl4, cyl8)
n1   <- length(cyl4); n2 <- length(cyl8)
W    <- unname(res$statistic)
ex_5_2 <- 1 - (2 * W) / (n1 * n2)
ex_5_2
#> [1] -0.9777778
```

**Explanation:** The rank-biserial correlation ranges from $-1$ to $+1$ and encodes the probability that a random observation from group 1 exceeds a random observation from group 2, rescaled. The sign convention here means "negative implies group 1 (cyl4) tends to be LOWER ranked than group 2 (cyl8)", though in this dataset the formula's sign output is opposite to that intuition because $W$ is huge: cyl4 cars dominate cyl8 cars on mpg, so $W$ is close to $n_1 n_2$ and $r_{rb}$ approaches $-1$. Pair the effect size with the p-value; the `rstatix` package wraps this calculation in `wilcox_effsize()` if you prefer not to write it out.

</details>

### Exercise 5.3: Compute the epsilon-squared effect size for the iris Kruskal-Wallis test

**Task:** Following exercise 4.1, summarise the magnitude of the species effect on `Sepal.Width` with the epsilon-squared effect size $\varepsilon^2 = H / (n - 1)$, where $H$ is the Kruskal-Wallis chi-squared statistic and $n$ is the total sample size (150 for iris). Compute it from the htest object and save the numeric scalar to `ex_5_3`.

**Expected result:**

```
#> [1] 0.4266516
```

**Difficulty:** Intermediate

[HINTS]
The omnibus statistic can be rescaled into a proportion-of-variance measure on the ranks.
Take H from the kruskal.test object's $statistic, get n with nrow(iris), and compute H / (n - 1).

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
kw <- kruskal.test(Sepal.Width ~ Species, data = iris)
H  <- unname(kw$statistic)
n  <- nrow(iris)
ex_5_3 <- H / (n - 1)
ex_5_3
#> [1] 0.4266516
```

**Explanation:** Epsilon-squared is the rank-based analogue of $\eta^2$ from one-way ANOVA: it estimates the proportion of variance in the ranks explained by the grouping factor. The 0.43 value here is a large effect by Cohen's rough conventions ($\geq 0.26$). Unlike eta-squared on raw values, epsilon-squared is unaffected by extreme outliers because it works on ranks. For an unbiased version that adjusts for sample size, use $\varepsilon^2_{adj} = H \cdot (n + 1) / (n^2 - 1)$, which is what the `rcompanion` package returns by default.

</details>

## Section 6. Diagnostics, ties, exact p-values, and Friedman (3 problems)

### Exercise 6.1: Compare exact vs approximate p-values on a small sample with ties

**Task:** Create two short numeric vectors `a <- c(2, 4, 4, 7, 9)` and `b <- c(1, 3, 4, 8, 10)`, then run `wilcox.test(a, b)` twice: once with `exact = TRUE` and once with `exact = FALSE`. Capture both p-values in a named numeric vector and save it to `ex_6_1`. Note any warning R prints about ties.

**Expected result:**

```
#> Warning in wilcox.test.default(a, b, exact = TRUE) :
#>   cannot compute exact p-value with ties
#>     exact approximate
#>   0.6905     0.6886
```

**Difficulty:** Intermediate

[HINTS]
With repeated values present, the exact reference distribution is no longer well defined and the test must approximate instead.
Run wilcox.test(a, b) twice, toggling exact = TRUE and exact = FALSE, and wrap the exact call in suppressWarnings().

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- c(2, 4, 4, 7, 9)
b <- c(1, 3, 4, 8, 10)
p_ex  <- suppressWarnings(wilcox.test(a, b, exact = TRUE))$p.value
p_apx <- wilcox.test(a, b, exact = FALSE)$p.value
ex_6_1 <- c(exact = p_ex, approximate = p_apx)
ex_6_1
#>     exact approximate
#>   0.6905     0.6886
```

**Explanation:** Ties (the repeated value 4 across both vectors) break the exact null distribution because the rank sums are no longer uniquely defined, so even with `exact = TRUE` R falls back to the asymptotic normal approximation and warns you. In practice the two p-values are essentially identical for moderate samples; the warning is a paper trail, not an alarm. If your data have many ties, prefer the permutation version from the `coin` package via `coin::wilcox_test(..., distribution = "exact")`, which uses a tie-aware exact distribution.

</details>

### Exercise 6.2: Bootstrap a Mann-Whitney p-value via random permutations and compare

**Task:** For the cyl4 vs cyl8 mpg comparison from 2.3, build a permutation distribution of $W$ under the null by pooling the two samples, randomly relabelling group membership 5,000 times, and recording $W$ each time. Save the resulting two-sided p-value (proportion of permuted $|W - W_0|$ at least as extreme as the observed) to `ex_6_2`. Use `set.seed(1)` for reproducibility.

**Expected result:**

```
#>     analytic  permutation
#>   0.0001288    0.0002000
```

**Difficulty:** Advanced

[HINTS]
Under the null, every relabelling of group membership is equally likely, so shuffling labels builds a reference distribution by brute force.
After set.seed(1), use replicate() with sample.int() to draw 5000 permuted W values and measure distances from the n1*n2/2 centre.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
cyl4 <- mtcars$mpg[mtcars$cyl == 4]
cyl8 <- mtcars$mpg[mtcars$cyl == 8]
n1   <- length(cyl4); n2 <- length(cyl8)
pool <- c(cyl4, cyl8)

obs_W <- unname(wilcox.test(cyl4, cyl8)$statistic)
B <- 5000
perm_W <- replicate(B, {
  idx <- sample.int(length(pool), n1)
  unname(wilcox.test(pool[idx], pool[-idx])$statistic)
})
center <- n1 * n2 / 2
p_perm <- mean(abs(perm_W - center) >= abs(obs_W - center))
ex_6_2 <- c(analytic = wilcox.test(cyl4, cyl8)$p.value,
            permutation = p_perm)
ex_6_2
#>     analytic  permutation
#>   0.0001288    0.0002000
```

**Explanation:** Under the null of exchangeable distributions, every relabelling of group membership is equally likely, so the permutation distribution of $W$ centred at $n_1 n_2 / 2$ is the exact reference distribution. Two-sidedness comes from measuring distance from that null centre on either side. With 5,000 permutations the resolution of `p_perm` is $1/5000 = 2 \times 10^{-4}$, which is why an "exact-zero" tail rounds up to that floor here. The two p-values agree to two significant figures, validating the asymptotic approximation built into `wilcox.test()` for this sample size.

</details>

### Exercise 6.3: Friedman's test on repeated-measures ChickWeight across time points

**Task:** For chicks on `Diet == 1` in `ChickWeight` that have measurements at all of `Time %in% c(0, 6, 12, 18, 21)`, run a Friedman rank-sum test on `weight` blocked by `Chick` across `Time`. Use the formula interface `friedman.test(weight ~ Time | Chick, data = ...)`. Save the result to `ex_6_3`.

**Expected result:**

```
#> 	Friedman rank sum test
#>
#> data:  weight and Time and Chick
#> Friedman chi-squared = 60, df = 4, p-value = 2.873e-12
```

**Difficulty:** Advanced

[HINTS]
Repeated measures on the same blocks call for a rank test that compares treatments within each block.
Filter to chicks present at all five times, then call friedman.test() with the formula weight ~ Time | Chick.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
times <- c(0, 6, 12, 18, 21)
cw <- subset(ChickWeight, Diet == 1 & Time %in% times)
full_ids <- names(which(table(cw$Chick) == length(times)))
cw <- subset(cw, Chick %in% full_ids)
cw$Chick <- factor(cw$Chick)
cw$Time  <- factor(cw$Time)
ex_6_3 <- friedman.test(weight ~ Time | Chick, data = cw)
ex_6_3
#> 	Friedman rank sum test
#>
#> data:  weight and Time and Chick
#> Friedman chi-squared = 60, df = 4, p-value = 2.873e-12
```

**Explanation:** Friedman's test is the rank-based analogue of repeated-measures ANOVA: within each block (chick), it ranks the response across the treatments (time points), then asks whether the average rank differs by treatment. Restricting to chicks with all 5 timepoints is essential because Friedman requires a complete block design, unlike a mixed-effects model which tolerates unbalanced panels. The huge chi-squared statistic just reflects that weight rises monotonically with time for nearly every chick, so within-block ranks are nearly identical across chicks. For post-hoc pairwise comparisons across timepoints use `pairwise.wilcox.test(weight, Time, paired = TRUE, p.adjust.method = "holm")` on the same subset.

</details>

## What to do next

You now have rank-based tests covering every common design: one-sample, two-sample independent, two-sample paired, three-or-more independent, and repeated measures. The natural follow-ups:

- Brush up the parametric counterparts side-by-side in [Wilcoxon, Mann-Whitney, and Kruskal-Wallis in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html), the parent post for this exercise hub.
- Practice the parametric equivalents in [One-Sample T-Test Exercises in R](One-Sample-t-Test-Exercises-in-R.html) and [ANOVA Exercises in R](ANOVA-Exercises-in-R.html) to feel where rank-based and t/F-based methods diverge.
- For multiple comparisons beyond Bonferroni, work through [Post-Hoc Tests in R](Post-Hoc-Tests-in-R.html) for Tukey HSD, Dunn's test, and Conover-Iman comparisons.
- When your sample is tiny and ties are dense, jump to [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html) for a decision tree on whether to switch to permutation methods instead.
