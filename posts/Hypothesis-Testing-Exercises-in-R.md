---
title: "Hypothesis Testing Exercises in R: 25 Real-World Practice Problems"
slug: "Hypothesis-Testing-Exercises-in-R"
description: "25 hypothesis testing exercises in R covering t-tests, proportions, chi-square, non-parametric tests, power, multiple-testing correction, and equivalence."
keywords: "hypothesis testing R, t-test exercises, p-value practice, chi-square exercises, power analysis R, Wilcoxon Mann-Whitney, multiple testing correction"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Hypothesis Testing Exercises"
sidebar_order: 125
fr_parent: "Hypothesis-Testing-in-R.html"
auto_link_terms: "hypothesis testing exercises|hypothesis testing practice|hypothesis test problems|p-value practice|t-test exercises|power analysis practice"
auto_link_case_sensitive: false
target_keyword: "hypothesis testing R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Hypothesis Testing Exercises in R: 25 Real-World Practice Problems

<p class="lead">These 25 hypothesis testing exercises rebuild the full inference workflow in R: one-sample and two-sample t-tests, proportion and chi-square tests, non-parametric alternatives, power and effect size, and production patterns like multiple-testing correction and equivalence testing. Every solution is hidden behind a reveal so you can verify after coding.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
library(pwr)
library(broom)
library(purrr)
library(tibble)
```

## Section 1. One-sample tests and reading the test object (4 problems)

### Exercise 1.1: Two-sided one-sample t-test on iris Sepal.Width

**Task:** Run a two-sided one-sample t-test on `iris$Sepal.Width` against the null hypothesis that the population mean equals 3.0. Use the full 150-row dataset and the default 95% confidence level. Save the entire `htest` object to `ex_1_1` so the next exercise can pull values out of it.

**Expected result:**

```
#>
#>  One Sample t-test
#>
#> data:  iris$Sepal.Width
#> t = 1.6105, df = 149, p-value = 0.1094
#> alternative hypothesis: true mean is not equal to 3
#> 95 percent confidence interval:
#>  2.986557 3.128110
#> sample estimates:
#> mean of x
#>  3.057333
```

**Difficulty:** Beginner

[HINTS]
A one-sample test compares your data's mean against a single fixed reference value, and that reference value is a parameter you supply.
Call t.test() on the vector and set the mu argument to 3.0; the default alternative is already two-sided.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- t.test(iris$Sepal.Width, mu = 3.0)
ex_1_1
#>
#>  One Sample t-test
#>
#> data:  iris$Sepal.Width
#> t = 1.6105, df = 149, p-value = 0.1094
```

**Explanation:** `t.test(x, mu = ...)` runs a one-sample t-test against the hypothesised mean. The sample mean of 3.057 sits only 0.057 above 3.0, the t statistic is a modest 1.61, and p = 0.109 fails to reject H0 at the usual 0.05 cutoff. The 95% CI \[2.987, 3.128\] contains 3.0, which is the same decision expressed as an interval. Keeping the full object (not just the p-value) lets you pull every component later.

</details>

### Exercise 1.2: Extract p-value, statistic, and CI from a t-test object

**Task:** Using the object from Exercise 1.1, build a named numeric vector containing the t statistic, the p-value, and the two endpoints of the 95% confidence interval. Use only `$` accessors against the `htest` object. Save the four-element named vector to `ex_1_2` so you can pipe it into a report-friendly format.

**Expected result:**

```
#> statistic   p_value     ci_lo     ci_hi
#> 1.6105000 0.1093850 2.9865568 3.1281099
```

**Difficulty:** Beginner

[HINTS]
The result of a test is just a list, so every piece of it is reachable as a named element of that list.
Pull `$statistic`, `$p.value`, and the two slots of `$conf.int`, assemble them with c(), and strip the leftover label with unname().

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- c(
  statistic = unname(ex_1_1$statistic),
  p_value   = ex_1_1$p.value,
  ci_lo     = ex_1_1$conf.int[1],
  ci_hi     = ex_1_1$conf.int[2]
)
ex_1_2
#> statistic   p_value     ci_lo     ci_hi
#> 1.6105000 0.1093850 2.9865568 3.1281099
```

**Explanation:** Every `htest` object is a list, so `$p.value`, `$statistic`, `$conf.int`, and `$parameter` give you the raw numbers. `unname()` strips the "t" label R puts on the statistic element so the output vector looks clean. This pattern is the foundation of every automated reporting pipeline: run a test, pluck the numbers, drop them in a table. `broom::tidy(ex_1_1)` is the tidyverse equivalent and returns a 1-row tibble with the same columns.

</details>

### Exercise 1.3: One-sided alternative for an air quality cleanup target

**Task:** A regulator setting an ozone advisory wants to test whether the New York summer mean of `airquality$Ozone` is strictly greater than 40 ppb. Drop the missing values, run a one-sided one-sample t-test with `alternative = "greater"`, and save the test object to `ex_1_3`. State whether the regulator should reject the 40 ppb null at alpha 0.05.

**Expected result:**

```
#>
#>  One Sample t-test
#>
#> data:  na.omit(airquality$Ozone)
#> t = 0.5779, df = 115, p-value = 0.2822
#> alternative hypothesis: true mean is greater than 40
#> 95 percent confidence interval:
#>  35.91368      Inf
#> sample estimates:
#> mean of x
#>  42.12931
```

**Difficulty:** Intermediate

[HINTS]
When the question is directional - is the mean strictly above a threshold - the test should count deviations on only one side.
Run t.test() with mu = 40 and alternative = "greater", wrapping the vector in na.omit() first to drop the missing values.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- t.test(
  na.omit(airquality$Ozone),
  mu = 40,
  alternative = "greater"
)
ex_1_3$p.value
#> [1] 0.2821847
```

**Explanation:** The one-sided alternative `"greater"` only counts deviations above 40, so the t distribution's upper tail supplies the p-value. The sample mean is 42.13 (above 40) yet noise is large, so p = 0.28 fails to reject. The CI lower bound becomes finite (35.91) while the upper is +Inf: a one-sided CI is a half-line, not an interval. A two-sided test here would give roughly double the p-value but a symmetric finite interval.

</details>

### Exercise 1.4: Confidence interval and p-value give the same decision

**Task:** For the built-in vector `trees$Height`, run a two-sided one-sample t-test against `mu = 75`. Build a 2-row tibble with columns `mu` and `decision` where row 1 reports the p < 0.05 decision and row 2 reports whether 75 lies inside the 95% CI. Save the tibble to `ex_1_4` and confirm both rows agree.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   mu    decision
#>   <chr> <chr>
#> 1 p<.05 fail to reject
#> 2 inCI  fail to reject
```

**Difficulty:** Intermediate

[HINTS]
A confidence interval and a two-sided p-value encode the same decision rule, just expressed as an interval versus a cutoff.
After t.test(trees$Height, mu = 75), compare `$p.value` to 0.05 and check whether 75 lies between the two `$conf.int` endpoints.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tt <- t.test(trees$Height, mu = 75)
in_ci <- 75 >= tt$conf.int[1] && 75 <= tt$conf.int[2]
ex_1_4 <- tibble::tibble(
  mu = c("p<.05", "inCI"),
  decision = c(
    if (tt$p.value < 0.05) "reject" else "fail to reject",
    if (in_ci) "fail to reject" else "reject"
  )
)
ex_1_4
```

**Explanation:** The two-sided CI and the two-sided p-value are mathematically the same procedure expressed differently: the 95% CI is the set of mu values that would NOT be rejected at alpha = 0.05. If your hypothesised mu sits inside the CI, p > 0.05; if outside, p < 0.05. Always. When students see the two disagree, it is almost always a one-sided test with a half-line CI being compared against a two-sided cutoff.

</details>

## Section 2. Two-sample comparisons (5 problems)

### Exercise 2.1: Welch two-sample t-test on iris setosa vs versicolor

**Task:** A botanist studying speciation wants to know whether setosa and versicolor irises differ in mean sepal length. Filter `iris` to those two species, run a Welch two-sample t-test on `Sepal.Length` by `Species`, and save the test object to `ex_2_1`. State the p-value and the direction of the estimated difference.

**Expected result:**

```
#>
#>  Welch Two Sample t-test
#>
#> data:  Sepal.Length by Species
#> t = -15.386, df = 86.538, p-value < 2.2e-16
#> alternative hypothesis: true difference in means between group setosa and group versicolor is not equal to 0
#> 95 percent confidence interval:
#>  -1.105533 -0.851334
#> sample estimates:
#>     mean in group setosa mean in group versicolor
#>                    5.006                    5.936
```

**Difficulty:** Intermediate

[HINTS]
A two-sample test asks whether two groups share a common mean; the response and the grouping factor are its two inputs.
Filter iris to the two species, then call t.test() with the formula `Sepal.Length ~ Species` and a data argument.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
two_species <- iris %>% filter(Species %in% c("setosa", "versicolor"))
two_species$Species <- droplevels(two_species$Species)

ex_2_1 <- t.test(Sepal.Length ~ Species, data = two_species)
ex_2_1$p.value
#> [1] 8.985235e-27
```

**Explanation:** The formula interface `y ~ group` is the cleanest way to pass a two-sample test: R splits `Sepal.Length` by the factor levels. `droplevels()` removes the unused virginica level so the test labels print cleanly. Welch is the default because it does NOT assume equal variances; it adjusts the degrees of freedom (here 86.5, not 98) to compensate. The negative CI tells you setosa (the first level alphabetically) has the smaller mean.

</details>

### Exercise 2.2: Paired t-test on a within-subject weight change

**Task:** A trial coordinator measures weight before and after a 12-week intervention on 20 participants. Build the inline tibble below, run a paired t-test of `weight_after` against `weight_before`, and save the test object to `ex_2_2`. Decide whether the intervention produced a significant mean weight change.

```r
pre_post <- tibble::tibble(
  subject       = 1:20,
  weight_before = c(82.4, 90.1, 78.2, 85.6, 91.0, 79.3, 88.7, 84.2, 86.5, 80.9,
                   89.4, 83.1, 87.6, 81.8, 92.3, 85.0, 77.4, 88.0, 84.5, 86.8),
  weight_after  = c(80.1, 88.4, 76.7, 83.9, 88.2, 78.5, 86.1, 82.5, 84.6, 79.7,
                   86.8, 81.5, 85.9, 80.2, 89.5, 83.4, 76.2, 85.7, 82.8, 84.6)
)
```

**Expected result:**

```
#>
#>  Paired t-test
#>
#> data:  pre_post$weight_after and pre_post$weight_before
#> t = -11.84, df = 19, p-value = 3.1e-10
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  -2.310 -1.620
#> sample estimates:
#> mean difference
#>          -1.965
```

**Difficulty:** Intermediate

[HINTS]
When each row pairs two measurements on the same subject, the test should work on the within-subject differences, not the raw groups.
Pass both vectors to t.test() and set paired = TRUE so it tests the per-subject differences against zero.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- t.test(
  pre_post$weight_after,
  pre_post$weight_before,
  paired = TRUE
)
ex_2_2$p.value
#> [1] 3.1e-10
```

**Explanation:** Paired t-tests treat the 20 differences as a one-sample test against zero, so within-subject correlation is removed and statistical power jumps compared to a two-sample t-test on the same data. The mean difference of -1.97 kg is small in absolute terms but consistent enough across subjects that the test rejects at p well below 0.001. Forgetting `paired = TRUE` here would still give a directionally correct estimate but with a much larger p-value because between-subject baseline variance is reintroduced.

</details>

### Exercise 2.3: Compare Welch vs equal-variance Student t-test on the same data

**Task:** A statistics reviewer wants you to demonstrate when the Welch correction matters. Take the setosa vs versicolor data from Exercise 2.1, run both `var.equal = FALSE` (Welch, the default) and `var.equal = TRUE` (Student) t-tests, and save a 2-row tibble of degrees of freedom and p-values to `ex_2_3`. Comment in your explanation on when the difference matters.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   variant      df p_value
#>   <chr>     <dbl>   <dbl>
#> 1 welch      86.5 8.99e-27
#> 2 student    98.0 3.75e-28
```

**Difficulty:** Advanced

[HINTS]
The same comparison can assume the two groups share one variance or allow them to differ, and that single assumption changes the degrees of freedom.
Run t.test() twice on the same formula, once with var.equal = FALSE and once with var.equal = TRUE, then collect `$parameter` and `$p.value`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
two_species <- iris %>%
  filter(Species %in% c("setosa", "versicolor")) %>%
  mutate(Species = droplevels(Species))

w <- t.test(Sepal.Length ~ Species, data = two_species, var.equal = FALSE)
s <- t.test(Sepal.Length ~ Species, data = two_species, var.equal = TRUE)

ex_2_3 <- tibble::tibble(
  variant = c("welch", "student"),
  df = c(unname(w$parameter), unname(s$parameter)),
  p_value = c(w$p.value, s$p.value)
)
ex_2_3
```

**Explanation:** Welch's correction lowers degrees of freedom whenever the sample variances differ, which widens the t distribution's tails and raises the p-value. With equal sample sizes and similar variances the two tests are nearly identical, but with unequal sizes AND unequal variances they diverge sharply. Welch should be your default: it only loses a tiny bit of power when variances really are equal but stays valid when they are not. The Student version is a relic worth knowing only because legacy code uses it.

</details>

### Exercise 2.4: F-test for equal variances across mtcars cylinder groups

**Task:** Before defending the equal-variance assumption you need evidence. Subset `mtcars` to 4-cylinder and 8-cylinder cars, run `var.test()` to compare the variances of `mpg` between those two groups, and save the test object to `ex_2_4`. Report whether the test rejects equal variances at alpha 0.05 and what that implies for choosing Welch vs Student.

**Expected result:**

```
#>
#>  F test to compare two variances
#>
#> data:  mpg by cyl
#> F = 4.3865, num df = 10, denom df = 13, p-value = 0.01415
#> alternative hypothesis: true ratio of variances is not equal to 1
#> 95 percent confidence interval:
#>   1.357918 15.473052
#> sample estimates:
#> ratio of variances
#>            4.38651
```

**Difficulty:** Intermediate

[HINTS]
Before trusting an equal-variance assumption you can test the ratio of the two group variances against one.
Subset mtcars to the two cylinder counts and call var.test() with the formula `mpg ~ cyl`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sub_mt <- mtcars %>% filter(cyl %in% c(4, 8))
ex_2_4 <- var.test(mpg ~ cyl, data = sub_mt)
ex_2_4$p.value
#> [1] 0.01415
```

**Explanation:** `var.test()` runs an F-test on the ratio of two sample variances against H0: ratio = 1. Here the variance of 4-cyl mpg is roughly 4.4 times that of 8-cyl mpg, and p = 0.014 rejects equal variances. That is exactly the situation where Welch matters: forcing `var.equal = TRUE` on a Student t-test would inflate Type I error. F-tests are highly sensitive to non-normality though, so for serious work use Levene's test from `car::leveneTest()` (or Brown-Forsythe) which is more robust to skewed data.

</details>

### Exercise 2.5: Two-sample t-test from summary statistics only

**Task:** A meta-analyst with only published summary statistics (means, sds, and sample sizes for two groups) needs to reproduce a Welch t-test without the raw data. Given group A (mean=50.2, sd=8.1, n=30) and group B (mean=46.8, sd=9.4, n=35), compute the Welch t statistic, the Welch degrees of freedom, and the two-sided p-value using base R formulas. Save a named numeric vector to `ex_2_5`.

**Expected result:**

```
#>      t        df p_value
#> 1.5640   62.7610  0.1229
```

**Difficulty:** Advanced

[HINTS]
With only means, standard deviations, and sample sizes you can still rebuild the test statistic and its tail probability by hand.
Form the standard error from the `s^2/n` terms, divide the mean difference by it, get the Welch df, then double pt(-abs(t), df) for the two-sided p.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1 <- 50.2; s1 <- 8.1; n1 <- 30
m2 <- 46.8; s2 <- 9.4; n2 <- 35

se <- sqrt(s1^2 / n1 + s2^2 / n2)
t_stat <- (m1 - m2) / se
df_welch <- (s1^2/n1 + s2^2/n2)^2 /
  ((s1^2/n1)^2 / (n1 - 1) + (s2^2/n2)^2 / (n2 - 1))
p_value <- 2 * pt(-abs(t_stat), df = df_welch)

ex_2_5 <- round(c(t = t_stat, df = df_welch, p_value = p_value), 4)
ex_2_5
```

**Explanation:** Welch t = (m1 - m2) / sqrt(s1^2/n1 + s2^2/n2), and the Welch-Satterthwaite degrees of freedom blend the two within-group variance estimates into a single non-integer df. The two-sided p-value is `2 * pt(-abs(t), df)`. This pattern is essential for meta-analysis, replication checks, and recomputing tests when only summary tables exist. The `BSDA::tsum.test()` function wraps the same math if you want a one-line version.

</details>

## Section 3. Proportions and counts (4 problems)

### Exercise 3.1: One-proportion z-test on a coin flip experiment

**Task:** Test whether a coin showing 540 heads in 1000 flips deviates from fairness using `prop.test()` with `correct = FALSE` so the output matches a textbook one-proportion z-test. Use the default two-sided alternative and 95% confidence level. Save the test object to `ex_3_1` and report the p-value.

**Expected result:**

```
#>
#>  1-sample proportions test without continuity correction
#>
#> data:  540 out of 1000, null probability 0.5
#> X-squared = 6.4, df = 1, p-value = 0.01141
#> alternative hypothesis: true p is not equal to 0.5
#> 95 percent confidence interval:
#>  0.5090 0.5705
#> sample estimates:
#>    p
#> 0.54
```

**Difficulty:** Beginner

[HINTS]
Testing a single observed rate against a hypothesised probability is a one-proportion test built on the normal approximation.
Call prop.test() with x = 540, n = 1000, p = 0.5, and correct = FALSE to drop the continuity correction.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- prop.test(
  x = 540,
  n = 1000,
  p = 0.5,
  correct = FALSE
)
ex_3_1$p.value
#> [1] 0.01141204
```

**Explanation:** `prop.test()` runs a score test based on the normal approximation. The X-squared statistic equals the square of the z statistic; 6.4 corresponds to z = 2.53 and a two-sided p-value of 0.011. Setting `correct = FALSE` skips Yates' continuity correction so the output lines up with the closed-form formula z = (p_hat - p0) / sqrt(p0 * (1 - p0) / n). For small n use `binom.test()` (exact binomial); for very small n the Wilson interval from `prop.test()` still works well.

</details>

### Exercise 3.2: Two-proportion test on A/B clickthrough rates

**Task:** A growth team runs an A/B test on a button color change. Variant A receives 12,400 impressions and 412 clicks; variant B receives 12,180 impressions and 489 clicks. Run a two-proportion test with `prop.test()` to evaluate whether the difference is statistically significant at alpha 0.05. Save the test object to `ex_3_2` and report the conclusion.

**Expected result:**

```
#>
#>  2-sample test for equality of proportions with continuity correction
#>
#> data:  c(412, 489) out of c(12400, 12180)
#> X-squared = 7.39, df = 1, p-value = 0.006547
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.0124 -0.0021
#> sample estimates:
#>    prop 1    prop 2
#> 0.03323   0.04014
```

**Difficulty:** Intermediate

[HINTS]
Comparing two observed rates is a two-group test on the difference in proportions.
Pass length-2 vectors to prop.test() - x = c(clicks_A, clicks_B) and n = c(impressions_A, impressions_B).

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- prop.test(
  x = c(412, 489),
  n = c(12400, 12180)
)
ex_3_2$p.value
#> [1] 0.006547
```

**Explanation:** Both `x` and `n` accept length-2 vectors and `prop.test()` computes the absolute risk difference (p1 - p2) along with its 95% CI. p = 0.0065 rejects equal proportions, and the CI \[-0.012, -0.002\] indicates B beats A by 0.2 to 1.2 percentage points. For relative effects (lift), divide the rates yourself; `prop.test()` always works on the absolute difference. Tools like `rstatix::pairwise_prop_test()` or `infer::prop_test()` make this composable inside a tidy pipeline.

</details>

### Exercise 3.3: Chi-square test of independence on smoking by gender

**Task:** An epidemiologist needs to test whether smoking status is independent of gender in a small cohort. Build the inline 2x3 contingency table below, run `chisq.test()` to test the null of independence, and save the test object to `ex_3_3`. Report the X-squared statistic, degrees of freedom, and p-value.

```r
smoke <- matrix(
  c(120, 80, 50,
     90, 110, 70),
  nrow = 2, byrow = TRUE,
  dimnames = list(
    gender = c("male", "female"),
    status = c("never", "former", "current")
  )
)
```

**Expected result:**

```
#>
#>  Pearson's Chi-squared test
#>
#> data:  smoke
#> X-squared = 11.37, df = 2, p-value = 0.003394
```

**Difficulty:** Intermediate

[HINTS]
A test of independence checks whether two categorical variables in a contingency table vary together or freely.
Pass the matrix straight to chisq.test(); with a two-dimensional table it runs the Pearson independence test automatically.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- chisq.test(smoke)
ex_3_3
#>
#>  Pearson's Chi-squared test
#>
#> data:  smoke
#> X-squared = 11.37, df = 2, p-value = 0.003394
```

**Explanation:** `chisq.test()` on a matrix computes the Pearson chi-squared statistic comparing observed counts to those expected under independence. Degrees of freedom equal `(rows - 1) * (cols - 1)`, here 1 * 2 = 2. With p = 0.003 you reject independence and conclude smoking status varies with gender in this sample. When any expected cell drops below 5, R warns and you should switch to `fisher.test()`. Inspect `ex_3_3$residuals` to see WHICH cells drive the rejection: the largest absolute standardised residuals are the cells most out of line with the independence model.

</details>

### Exercise 3.4: Chi-square goodness-of-fit on a six-sided die

**Task:** You roll a suspected six-sided die 600 times and observe the counts c(95, 110, 88, 102, 115, 90). Test whether the die is fair (each face probability 1/6) using a chi-square goodness-of-fit test via `chisq.test(x, p = ...)`. Save the test object to `ex_3_4` and report your conclusion at alpha 0.05.

**Expected result:**

```
#>
#>  Chi-squared test for given probabilities
#>
#> data:  rolls
#> X-squared = 5.34, df = 5, p-value = 0.376
```

**Difficulty:** Intermediate

[HINTS]
A goodness-of-fit test compares observed category counts against a set of expected probabilities.
Give chisq.test() the count vector and a `p` argument of rep(1/6, 6) for the fair-die probabilities.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rolls <- c(95, 110, 88, 102, 115, 90)
ex_3_4 <- chisq.test(rolls, p = rep(1/6, 6))
ex_3_4
#>
#>  Chi-squared test for given probabilities
#>
#> data:  rolls
#> X-squared = 5.34, df = 5, p-value = 0.376
```

**Explanation:** Goodness-of-fit uses a single vector of observed counts and a vector of expected probabilities. df = number of categories minus 1 (here 6 - 1 = 5). With p = 0.376 you fail to reject fairness: the observed counts are well within sampling noise for a fair die. Note that "fail to reject" is NOT "the die is fair"; you simply lack evidence to claim it is biased. A sample of 6,000 rolls instead of 600 would give a much sharper test if you wanted to rule out a 1-2 percent bias.

</details>

## Section 4. Non-parametric alternatives (4 problems)

### Exercise 4.1: Wilcoxon signed-rank test on paired pre/post pain scores

**Task:** A physical therapist measures pain on a 0-10 ordinal scale before and after a 6-week treatment in 15 patients. Build the inline tibble below, run a Wilcoxon signed-rank test on `after` vs `before` with `paired = TRUE`, and save the test object to `ex_4_1`. Note why this is the right test for ordinal pain scores.

```r
pain <- tibble::tibble(
  patient = 1:15,
  before  = c(7, 8, 6, 9, 7, 5, 8, 6, 7, 9, 8, 6, 7, 8, 7),
  after   = c(4, 5, 5, 6, 4, 4, 5, 4, 5, 7, 6, 4, 5, 6, 5)
)
```

**Expected result:**

```
#>
#>  Wilcoxon signed rank test with continuity correction
#>
#> data:  pain$after and pain$before
#> V = 0, p-value = 0.0006619
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Intermediate

[HINTS]
For paired measurements on an ordinal scale, rank the differences rather than assuming their spacing is meaningful.
Call wilcox.test() with the two vectors and paired = TRUE to run the signed-rank version.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- wilcox.test(
  pain$after,
  pain$before,
  paired = TRUE
)
ex_4_1$p.value
#> [1] 0.0006619
```

**Explanation:** A paired Wilcoxon ranks the absolute differences and tests whether positive and negative ranks balance under H0. It is the right choice for ordinal data like a pain scale where the interval between 5 and 6 is not guaranteed to equal the interval between 8 and 9. Here V = 0 means every difference moved the same direction (pain dropped for every patient), which yields p = 0.0007 and a clear rejection. A paired t-test on the same data would also reject, but its assumption of normally distributed differences is shaky on ordinal scales.

</details>

### Exercise 4.2: Mann-Whitney U on two independent groups

**Task:** Run `wilcox.test()` on `airquality$Ozone` split by whether `Month` is 5 (May) or 8 (August). Drop NA rows in the relevant columns first. The two distributions are skewed, so Mann-Whitney is more appropriate than a Welch t-test. Save the test object to `ex_4_2` and report the p-value.

**Expected result:**

```
#>
#>  Wilcoxon rank sum test with continuity correction
#>
#> data:  Ozone by month_label
#> W = 127.5, p-value = 0.0001208
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Intermediate

[HINTS]
When two independent groups are skewed, compare them by rank position instead of by mean.
After filtering to the two months, call wilcox.test() with the formula `Ozone ~ month_label`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq <- airquality %>%
  filter(Month %in% c(5, 8), !is.na(Ozone)) %>%
  mutate(month_label = factor(Month, labels = c("May", "Aug")))

ex_4_2 <- wilcox.test(Ozone ~ month_label, data = aq)
ex_4_2$p.value
#> [1] 0.00012
```

**Explanation:** The independent-samples Wilcoxon (also called Mann-Whitney U) ranks all observations together and asks whether ranks in group A tend to be larger or smaller than ranks in group B. It is invariant to monotone transforms of the response, so log-transforming ozone would give the same p-value. With p = 0.00012 you reject equal distributions: August ozone is reliably higher than May ozone. Note that "location shift" in R's output is a special case; the test rejects more broadly any shift in stochastic dominance.

</details>

### Exercise 4.3: Kruskal-Wallis across three or more groups

**Task:** Use `PlantGrowth` (groups: ctrl, trt1, trt2) and run a Kruskal-Wallis test on `weight` by `group`. This is the non-parametric alternative to a one-way ANOVA and you should reach for it when group sizes are small or residuals look non-normal. Save the test object to `ex_4_3` and decide whether at least one group differs.

**Expected result:**

```
#>
#>  Kruskal-Wallis rank sum test
#>
#> data:  weight by group
#> Kruskal-Wallis chi-squared = 7.99, df = 2, p-value = 0.01842
```

**Difficulty:** Intermediate

[HINTS]
The rank-based comparison extends naturally past two groups to test whether any of several groups differs.
Call kruskal.test() with the formula `weight ~ group` and the PlantGrowth data.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- kruskal.test(weight ~ group, data = PlantGrowth)
ex_4_3
```

**Explanation:** Kruskal-Wallis generalises Mann-Whitney to k > 2 groups by ranking all observations and comparing rank sums. df = k - 1 = 2 here. With p = 0.018 the test rejects "all groups identical" but does NOT tell you which pair is different; follow up with `pairwise.wilcox.test(PlantGrowth$weight, PlantGrowth$group, p.adjust.method = "BH")` to get adjusted pairwise comparisons. For parametric data prefer one-way ANOVA via `aov()`; Kruskal-Wallis is the safe fallback when the residual diagnostics fail.

</details>

### Exercise 4.4: Bootstrap CI for the mean of a small skewed sample

**Task:** A junior analyst is uncomfortable trusting the t-distribution on a sample of 25 reaction times that look right-skewed. Build the inline vector below, draw 10,000 bootstrap resamples (with replacement) of the mean, and compute the 2.5% and 97.5% percentiles. Save a length-3 named vector with `mean_obs`, `ci_lo`, `ci_hi` to `ex_4_4` and compare against `t.test()`.

```r
set.seed(42)
rt <- rgamma(25, shape = 2, rate = 0.02)   # right-skewed reaction times
```

**Expected result:**

```
#> mean_obs    ci_lo    ci_hi
#>   92.500   67.300  120.400
```

**Difficulty:** Advanced

[HINTS]
Resampling the data with replacement many times builds an empirical picture of how the statistic itself varies.
Use replicate() around mean(sample(rt, length(rt), replace = TRUE)), then take the 0.025 and 0.975 quantile() of the results.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
boot_means <- replicate(
  10000,
  mean(sample(rt, length(rt), replace = TRUE))
)

ex_4_4 <- c(
  mean_obs = mean(rt),
  ci_lo = unname(quantile(boot_means, 0.025)),
  ci_hi = unname(quantile(boot_means, 0.975))
)
ex_4_4
```

**Explanation:** The percentile bootstrap constructs a confidence interval by resampling the data, recomputing the statistic 10,000 times, and taking the 2.5/97.5 percentiles of the resulting distribution. It makes no assumption that the sampling distribution of the mean is symmetric, so on skewed data it produces an asymmetric CI that better reflects reality. `t.test(rt)$conf.int` on the same data forces symmetry around the sample mean and can over- or undercover. For more rigorous bootstrap CIs (BCa, studentized) use `boot::boot()` plus `boot::boot.ci()`.

</details>

## Section 5. Errors, power, and effect size (4 problems)

### Exercise 5.1: Simulate the empirical Type I error rate under H0

**Task:** Generate 5,000 independent samples of size 30 from a standard normal (so H0 is true), run a two-sided one-sample t-test against `mu = 0` on each sample, and count the fraction with p-value below 0.05. Save the resulting empirical Type I error rate to `ex_5_1`. It should land near 0.05 since H0 holds.

**Expected result:**

```
#> [1] 0.0494
```

**Difficulty:** Advanced

[HINTS]
When the null is true, repeatedly testing fresh samples should reject at roughly the chosen alpha rate.
Use replicate() to run t.test(rnorm(30), mu = 0)$p.value many times, then take mean() of the indicator p-value < 0.05.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
p_values <- replicate(5000, {
  x <- rnorm(30)
  t.test(x, mu = 0)$p.value
})

ex_5_1 <- mean(p_values < 0.05)
ex_5_1
#> [1] 0.0494
```

**Explanation:** When H0 is true the p-value is uniformly distributed on \[0, 1\], so the fraction below alpha = 0.05 should equal alpha. With 5,000 simulations the Monte Carlo standard error is sqrt(0.05 * 0.95 / 5000) ~= 0.003, so any value in roughly \[0.045, 0.055\] is consistent with calibrated nominal error. Running this once gives intuition for why "p < 0.05" is a statement about long-run frequency, not about any individual experiment. Bump n_sim to 100,000 to nail down the third decimal.

</details>

### Exercise 5.2: Cohen's d for a two-sample comparison

**Task:** Compute Cohen's d (the standardised mean difference using the pooled standard deviation) for `iris$Sepal.Length` between setosa and versicolor. Use the textbook pooled-SD formula in base R; do not call `effsize::cohen.d`. Save the single numeric to `ex_5_2`. Interpret the magnitude using Cohen's conventional cutoffs (small 0.2, medium 0.5, large 0.8).

**Expected result:**

```
#> [1] -2.10
```

**Difficulty:** Intermediate

[HINTS]
An effect size rescales the gap between two group means into units of their shared spread.
Compute the pooled variance from each group's var() and n, then divide the difference of means by its square root.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setosa     <- iris$Sepal.Length[iris$Species == "setosa"]
versicolor <- iris$Sepal.Length[iris$Species == "versicolor"]

n1 <- length(setosa); n2 <- length(versicolor)
sp_sq <- ((n1 - 1) * var(setosa) + (n2 - 1) * var(versicolor)) / (n1 + n2 - 2)
ex_5_2 <- (mean(setosa) - mean(versicolor)) / sqrt(sp_sq)
round(ex_5_2, 2)
#> [1] -2.10
```

**Explanation:** Cohen's d expresses the group mean difference in units of pooled standard deviation, so it is comparable across studies regardless of the original measurement scale. |d| = 2.10 is huge: setosa sepals are about two standard deviations shorter than versicolor sepals on average. A p-value tells you the difference is unlikely to be zero; d tells you HOW BIG the difference is. Always report both. For paired designs use the SD of the differences instead of the pooled SD (Cohen's dz).

</details>

### Exercise 5.3: Required sample size for 80% power with pwr.t.test

**Task:** A trial designer wants to detect a Cohen's d of 0.5 in a two-sample (independent groups) study at alpha 0.05 with 80% power. Use `pwr::pwr.t.test()` with `type = "two.sample"` to compute the required sample size per group. Save the whole pwr object to `ex_5_3` and read off the `n` element. Comment on what happens if d drops to 0.3.

**Expected result:**

```
#>
#>      Two-sample t test power calculation
#>
#>               n = 63.766
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate

[HINTS]
Power analysis links effect size, alpha, power, and sample size so that fixing all but one solves for the last.
Call pwr.t.test() with d = 0.5, sig.level = 0.05, power = 0.8, and type = "two.sample", leaving n unspecified.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- pwr.t.test(
  d = 0.5,
  sig.level = 0.05,
  power = 0.8,
  type = "two.sample",
  alternative = "two.sided"
)
ceiling(ex_5_3$n)
#> [1] 64
```

**Explanation:** Power analysis trades off five quantities: effect size d, alpha, power (1 - beta), sample size n, and the test type. Fix any four and `pwr.t.test()` solves for the fifth (use `NULL` for the unknown). Detecting d = 0.5 needs about 64 per group; halving the effect to d = 0.25 quadruples the required n to roughly 252 per group, because power scales with n through d * sqrt(n). Always run power analysis BEFORE collecting data; running it after non-significant results to "explain" the null is post-hoc power and is statistically meaningless.

</details>

### Exercise 5.4: Power curve across a grid of effect sizes

**Task:** Hold n = 30 per group and alpha = 0.05 fixed. Across `d` values from 0.1 to 1.0 in steps of 0.1, compute the power of a two-sided two-sample t-test using `pwr::pwr.t.test()`. Save a tibble with columns `d` and `power` to `ex_5_4`, then plot it as a power curve (ggplot, line + points).

**Expected result:**

```
#> # A tibble: 10 x 2
#>      d  power
#>   <dbl>  <dbl>
#> 1  0.1 0.072
#> 2  0.2 0.139
#> ...
#> # 8 more rows
```

**Difficulty:** Advanced

[HINTS]
Sweeping the effect size across a range shows how detectability climbs as the true difference grows.
Map pwr.t.test(d = .x, n = 30, sig.level = 0.05, type = "two.sample")$power over a seq() of d values.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- tibble::tibble(d = seq(0.1, 1.0, by = 0.1)) %>%
  mutate(power = purrr::map_dbl(
    d,
    ~ pwr.t.test(d = .x, n = 30, sig.level = 0.05,
                  type = "two.sample")$power
  ))

ggplot(ex_5_4, aes(d, power)) +
  geom_line(linewidth = 1) +
  geom_point(size = 2) +
  geom_hline(yintercept = 0.8, linetype = "dashed") +
  scale_y_continuous(limits = c(0, 1)) +
  labs(title = "Power vs effect size (n=30 per group)",
       x = "Cohen's d", y = "Power")
```

**Explanation:** A power curve makes the n/d/power trade-off visible: with only 30 per group, you need a Cohen's d above ~0.74 to hit the conventional 80% power target. Below d = 0.4 you have less than a coin-flip chance of detecting a real effect, so a non-significant result tells you nothing. Power curves are essential when negotiating study scope with stakeholders ("we can detect d >= 0.5 with 80% power, anything smaller you need a bigger sample"). For three-arm trials use `pwr::pwr.anova.test()` instead.

</details>

## Section 6. Real-world workflows (4 problems)

### Exercise 6.1: Multiple-testing correction across 20 hypothesis tests

**Task:** A bioinformatician runs 20 independent two-sample tests and gets the raw p-values below. Apply both Bonferroni and Benjamini-Hochberg (FDR) correction via `p.adjust()` and save a tibble with columns `raw`, `bonferroni`, `bh` to `ex_6_1`. Comment on how many tests are "significant" at alpha 0.05 under each method.

```r
raw_p <- c(0.0001, 0.0008, 0.003, 0.012, 0.018, 0.022, 0.035, 0.041, 0.049, 0.060,
           0.071, 0.085, 0.120, 0.180, 0.220, 0.330, 0.450, 0.610, 0.780, 0.910)
```

**Expected result:**

```
#> # A tibble: 20 x 3
#>      raw bonferroni     bh
#>    <dbl>      <dbl>  <dbl>
#> 1 0.0001     0.0020 0.0020
#> 2 0.0008     0.0160 0.0080
#> 3 0.0030     0.0600 0.0200
#> 4 0.0120     0.2400 0.0540
#> ...
#> # 16 more rows
```

**Difficulty:** Advanced

[HINTS]
Running many tests inflates the chance of at least one false positive, so the raw p-values need rescaling.
Apply p.adjust() to the vector twice, with method = "bonferroni" and method = "BH".

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- tibble::tibble(
  raw = raw_p,
  bonferroni = p.adjust(raw_p, method = "bonferroni"),
  bh = p.adjust(raw_p, method = "BH")
)
ex_6_1 %>%
  summarise(
    sig_raw  = sum(raw < 0.05),
    sig_bonf = sum(bonferroni < 0.05),
    sig_bh   = sum(bh < 0.05)
  )
#> sig_raw sig_bonf sig_bh
#>       9        2      3
```

**Explanation:** Bonferroni controls the family-wise error rate by multiplying each p-value by the number of tests; it is the strictest method and rarely calls anything significant in high-dimensional settings. Benjamini-Hochberg controls the false discovery rate (the expected fraction of false positives AMONG rejected hypotheses), which gives more power at the cost of allowing some false positives. For genome-wide screens BH (or Storey's q-value) is the standard; for confirmatory clinical analyses Bonferroni or Holm is the default.

</details>

### Exercise 6.2: Run a t-test per group and tidy the results

**Task:** Using `mtcars`, split cars by `am` (0 = automatic, 1 = manual) and run a Welch t-test on `mpg` vs `am` separately within each `cyl` group (4, 6, 8). Use `dplyr::group_by()` + `dplyr::reframe()` + `broom::tidy()` (or equivalent) to produce a tibble with one row per cylinder containing the estimate, statistic, and p-value. Save to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>     cyl estimate statistic p.value
#>   <dbl>    <dbl>     <dbl>   <dbl>
#> 1     4    -5.18    -2.32   0.0418
#> 2     6    -0.343   -0.207  0.846
#> 3     8    -0.300   -0.247  0.811
```

**Difficulty:** Intermediate

[HINTS]
Running the same test within each subgroup and stacking the results turns a wall of output into one tidy table.
group_by(cyl), then reframe() a broom::tidy() of t.test(mpg ~ am), and select the columns you need.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- mtcars %>%
  group_by(cyl) %>%
  reframe(broom::tidy(t.test(mpg ~ am))) %>%
  select(cyl, estimate, statistic, p.value)
ex_6_2
```

**Explanation:** `broom::tidy()` converts the wall-of-text `htest` print output into a clean 1-row tibble per test, which makes group-wise testing composable. With `group_by()` + `reframe()` you fan out one t-test per cyl group and stack the results vertically. This pattern is the foundation of every "tests by subgroup" report in production analytics. Beware multiple testing here: three p-values means you should bump alpha down via `p.adjust(ex_6_2$p.value, method = "BH")` if you want to interpret each independently.

</details>

### Exercise 6.3: Permutation test for the difference in two means

**Task:** A junior researcher needs a distribution-free check on whether `sleep$extra` differs between the two `group` levels. Compute the observed difference in means, then build a null distribution by permuting the group labels 10,000 times and recomputing the difference. Save a length-2 named numeric with `obs_diff` and `p_value` (two-sided) to `ex_6_3`.

**Expected result:**

```
#> obs_diff   p_value
#>  -1.580     0.078
```

**Difficulty:** Advanced

[HINTS]
Under the null the group labels are exchangeable, so reshuffling them builds the distribution of differences expected by chance.
Compute the observed mean difference, then replicate() that difference after sample()-ing the group vector, and compare absolute values.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
extra <- sleep$extra
grp <- sleep$group

obs_diff <- mean(extra[grp == 1]) - mean(extra[grp == 2])
perm_diffs <- replicate(10000, {
  shuffled <- sample(grp)
  mean(extra[shuffled == 1]) - mean(extra[shuffled == 2])
})

p_value <- mean(abs(perm_diffs) >= abs(obs_diff))
ex_6_3 <- c(obs_diff = obs_diff, p_value = p_value)
ex_6_3
```

**Explanation:** A permutation test simulates the exact null distribution by reassigning group labels at random: under H0 the labels are exchangeable, so any reassignment is equally likely. The two-sided p-value is the fraction of permuted differences as extreme as or more extreme than the observed one. It makes NO distributional assumption on the data; the cost is computational. For the 20-observation `sleep` dataset the permutation p-value lines up with the paired t-test p-value of about 0.076, but for skewed or heavy-tailed data they diverge.

</details>

### Exercise 6.4: Equivalence test (TOST) for "no meaningful difference"

**Task:** A regulatory analyst needs to prove two manufacturing lines produce equivalent mean fill volumes. Build the inline tibble below, define an equivalence margin of plus or minus 0.5 ml, and run two one-sided t-tests (TOST): one for `mu = -0.5` with `alternative = "greater"` and one for `mu = 0.5` with `alternative = "less"`. Save a length-3 named vector `p_lower`, `p_upper`, `p_tost` (the larger of the two) to `ex_6_4`. Equivalence is claimed if `p_tost < 0.05`.

```r
fill <- tibble::tibble(
  line_a = c(50.1, 49.9, 50.3, 50.2, 49.8, 50.0, 50.1, 49.9, 50.2, 50.0,
             50.1, 49.8, 50.2, 50.0, 49.9, 50.1, 50.3, 49.8, 50.0, 50.2),
  line_b = c(50.0, 50.2, 49.9, 50.1, 50.0, 49.8, 50.2, 50.1, 49.9, 50.0,
             50.1, 50.0, 49.8, 50.2, 50.1, 49.9, 50.0, 50.1, 50.2, 49.9)
)
```

**Expected result:**

```
#>  p_lower  p_upper   p_tost
#> 1.5e-09  3.5e-09  3.5e-09
```

**Difficulty:** Advanced

[HINTS]
To argue two groups are practically the same, test that their difference sits inside an agreed equivalence margin from both sides.
Run t.test() on the differences twice - mu = -0.5 with alternative = "greater" and mu = 0.5 with alternative = "less" - and keep the larger p-value.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diffs <- fill$line_a - fill$line_b
delta <- 0.5

t_lower <- t.test(diffs, mu = -delta, alternative = "greater")
t_upper <- t.test(diffs, mu =  delta, alternative = "less")

ex_6_4 <- c(
  p_lower = t_lower$p.value,
  p_upper = t_upper$p.value,
  p_tost  = max(t_lower$p.value, t_upper$p.value)
)
ex_6_4
```

**Explanation:** The two one-sided tests (TOST) procedure flips the classical question. Instead of asking "is the difference different from zero?", you ask "is the difference inside the practically-equivalent interval \[-delta, +delta\]?". You reject non-equivalence only if BOTH one-sided tests reject, so the relevant p-value is the larger of the two. A non-significant standard t-test does NOT establish equivalence; only TOST does. Packages like `TOSTER::tsum_TOST()` automate this for both raw and standardised effect sizes.

</details>

## What to do next

You have just run through the inference workflow R analysts use every day. To consolidate and extend:

- Read [Hypothesis Testing in R](Hypothesis-Testing-in-R.html) for the conceptual map that ties t-tests, chi-square, and non-parametric alternatives together.
- Sharpen your distribution sense with [Probability Distributions Exercises in R](Probability-Distributions-Exercises-in-R.html), which drills `dnorm`, `pnorm`, `qnorm`, and friends.
- Move from group means to group structures with [ANOVA Exercises in R](ANOVA-Exercises-in-R.html) for k-group and factorial designs.
- Translate inference into prediction with [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html), where the same t-statistics reappear on coefficient rows.
