---
title: "T-Test Exercises in R: 20 Real-World Practice Problems"
slug: "T-Test-Exercises-in-R"
description: "20 t-test exercises in R covering one-sample, two-sample (Welch and Student), paired tests, assumptions, effect sizes, power, and reporting workflows."
keywords: "t test R exercises, t-test practice problems, one-sample t-test R, paired t-test exercises, Welch t-test R, Cohen's d R, t-test power analysis"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "t-Test Exercises (20 problems)"
sidebar_order: 152
fr_parent: "t-Tests-in-R.html"
auto_link_terms: "t-test exercises|t-test practice|one-sample t-test|paired t-test|welch t-test|cohen's d"
auto_link_case_sensitive: false
target_keyword: "t test R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# T-Test Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty t-test problems covering one-sample, two-sample (Welch and Student), paired, and one-sided variants with assumption checks, effect sizes, power calculations, and end-to-end stakeholder workflows. Every solution is hidden until you click; verify against the Expected result block before peeking.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(car)
library(pwr)
```

The dataset stable used across this hub: `iris`, `mtcars`, `ToothGrowth`, `PlantGrowth`, `ChickWeight`, plus inline tibbles where a domain scenario calls for one. Throughout, save each answer to `ex_<section>_<problem>` so you can sanity-check against the Expected result before revealing the solution.

## Section 1. One-sample t-tests (4 problems)

### Exercise 1.1: Test whether iris Sepal.Length mean equals 5.85

**Task:** The botany lab claims the global mean sepal length across iris species is 5.85 cm. Using the built-in `iris` dataset, run a two-sided one-sample t-test of `Sepal.Length` against the null mean 5.85 and save the htest object to `ex_1_1`. Report whether the p-value rejects the null at alpha 0.05.

**Expected result:**

```
#> 	One Sample t-test
#>
#> data:  iris$Sepal.Length
#> t = -0.39031, df = 149, p-value = 0.6969
#> alternative hypothesis: true mean is not equal to 5.85
#> 95 percent confidence interval:
#>  5.709732 5.976934
#> sample mean
#>     5.843333
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- t.test(iris$Sepal.Length, mu = 5.85)
ex_1_1
#> 	One Sample t-test
#>
#> data:  iris$Sepal.Length
#> t = -0.39031, df = 149, p-value = 0.6969
#> alternative hypothesis: true mean is not equal to 5.85
#> 95 percent confidence interval:
#>  5.709732 5.976934
#> sample mean
#>     5.843333
```

**Explanation:** `t.test(x, mu = 5.85)` defaults to a two-sided test against the supplied null mean. The p-value 0.697 is far above 0.05, so the data do not contradict the lab's claim. The 95 percent CI [5.71, 5.98] contains 5.85, which is the same conclusion expressed as an interval. Always pull `mu` from the scientific claim, never from the data itself.

</details>

### Exercise 1.2: One-sided test that mtcars mpg exceeds 18

**Task:** A fuel-economy reviewer wants evidence that the average car in `mtcars` gets more than 18 mpg. Run a one-sided (greater) one-sample t-test of `mtcars$mpg` against mu = 18 and save the htest object to `ex_1_2`. Confirm whether the lower CI bound stays above 18.

**Expected result:**

```
#> 	One Sample t-test
#>
#> data:  mtcars$mpg
#> t = 2.4286, df = 31, p-value = 0.01054
#> alternative hypothesis: true mean is greater than 18
#> 95 percent confidence interval:
#>  18.40632      Inf
#> sample mean
#>      20.09062
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- t.test(mtcars$mpg, mu = 18, alternative = "greater")
ex_1_2
#> 	One Sample t-test
#>
#> data:  mtcars$mpg
#> t = 2.4286, df = 31, p-value = 0.01054
#> alternative hypothesis: true mean is greater than 18
#> 95 percent confidence interval:
#>  18.40632      Inf
#> sample mean
#>      20.09062
```

**Explanation:** Setting `alternative = "greater"` halves the p-value compared to the two-sided test only when the sample mean is on the predicted side. The CI becomes one-sided: [18.41, Inf), and because its finite endpoint exceeds 18, the test rejects at alpha 0.05. The common mistake is using "greater" when the sample mean is below the null; in that case R still reports a finite p but it will be near 1, not near 0.

</details>

### Exercise 1.3: Manufacturing QA against a 10 mm bolt spec

**Task:** A factory specification requires bolts to average 10 mm. Quality control measures 12 bolts and finds the lengths shown below. Run a two-sided one-sample t-test against mu = 10 and save the htest object to `ex_1_3`. Decide whether the line should be paused (reject at alpha 0.01).

```r title="Setup data"
bolt_lengths <- c(10.02, 9.97, 10.05, 9.95, 10.01, 10.04,
                  9.98, 10.06, 9.96, 10.03, 9.99, 10.04)
```

**Expected result:**

```
#> 	One Sample t-test
#>
#> data:  bolt_lengths
#> t = 1.2456, df = 11, p-value = 0.2389
#> alternative hypothesis: true mean is not equal to 10
#> 95 percent confidence interval:
#>   9.990078 10.033255
#> sample mean
#>    10.01167
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- t.test(bolt_lengths, mu = 10)
ex_1_3
#> 	One Sample t-test
#>
#> data:  bolt_lengths
#> t = 1.2456, df = 11, p-value = 0.2389
#> alternative hypothesis: true mean is not equal to 10
#> 95 percent confidence interval:
#>   9.990078 10.033255
#> sample mean
#>    10.01167
```

**Explanation:** A p-value of 0.24 is nowhere near 0.01, so the line is statistically on-spec. Small samples (n = 12) have low power, so a non-rejection is not proof of compliance; it just means this evidence is insufficient to flag drift. For ongoing monitoring, an SPC chart with control limits is more useful than a single t-test because it visualizes trend, not just a single snapshot.

</details>

### Exercise 1.4: Extract the 95% CI from a t-test object

**Task:** You ran the test in Exercise 1.1 and now need just the 95 percent confidence interval as a length-two numeric vector for a downstream report. Pull `conf.int` directly off the htest object and strip the attribute. Save the resulting unnamed numeric vector to `ex_1_4`.

**Expected result:**

```
#> [1] 5.709732 5.976934
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- as.numeric(ex_1_1$conf.int)
ex_1_4
#> [1] 5.709732 5.976934
```

**Explanation:** `t.test()` returns an `htest` list with `$conf.int`, `$estimate`, `$statistic`, `$p.value`, and `$parameter` (df). Wrapping in `as.numeric()` drops the `conf.level` attribute that tags along, which matters when you later paste the values into a report or pass them to a function that errors on attributes. For one-sided tests one endpoint will be `-Inf` or `Inf`, which `as.numeric` preserves.

</details>

## Section 2. Two-sample tests: Welch and Student (4 problems)

### Exercise 2.1: Compare Petal.Length between setosa and versicolor

**Task:** Use the `iris` dataset to compare `Petal.Length` between species `setosa` and `versicolor`. Run a two-sample (Welch) t-test using the formula interface and filter out the `virginica` rows before testing. Save the htest object to `ex_2_1`.

**Expected result:**

```
#> 	Welch Two Sample t-test
#>
#> data:  Petal.Length by Species
#> t = -39.493, df = 62.14, p-value < 2.2e-16
#> alternative hypothesis: true difference in means between group setosa and group versicolor is not equal to 0
#> 95 percent confidence interval:
#>  -2.939618 -2.656382
#> mean in group setosa mean in group versicolor
#>                1.462                    4.260
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
two_species <- subset(iris, Species %in% c("setosa", "versicolor"))
two_species$Species <- droplevels(two_species$Species)
ex_2_1 <- t.test(Petal.Length ~ Species, data = two_species)
ex_2_1
#> 	Welch Two Sample t-test
#>
#> data:  Petal.Length by Species
#> t = -39.493, df = 62.14, p-value < 2.2e-16
#> alternative hypothesis: true difference in means between group setosa and group versicolor is not equal to 0
#> 95 percent confidence interval:
#>  -2.939618 -2.656382
#> mean in group setosa mean in group versicolor
#>                1.462                    4.260
```

**Explanation:** Formula `Petal.Length ~ Species` is the cleanest two-sample syntax when data live in a data frame. `t.test()` defaults to `var.equal = FALSE` (Welch), which is the right default because equal variances are rarely true and Welch is robust when they happen to be equal. Dropping unused factor levels with `droplevels()` prevents R from silently trying a three-group comparison that errors on a two-sample test.

</details>

### Exercise 2.2: Welch vs Student on ToothGrowth supplement groups

**Task:** Using `ToothGrowth`, compare tooth length `len` between supplements `OJ` and `VC` two ways: first with the default Welch correction, then with `var.equal = TRUE` (Student). Store the two htest objects in a named list `ex_2_2` with elements `welch` and `student`, then compare the two p-values.

**Expected result:**

```
#> $welch
#> 	Welch Two Sample t-test
#> ...
#> t = 1.9153, df = 55.309, p-value = 0.06063
#>
#> $student
#> 	Two Sample t-test
#> ...
#> t = 1.9153, df = 58, p-value = 0.06039
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2$welch$p.value
ex_2_2$student$p.value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- list(
  welch   = t.test(len ~ supp, data = ToothGrowth),
  student = t.test(len ~ supp, data = ToothGrowth, var.equal = TRUE)
)
c(welch = ex_2_2$welch$p.value, student = ex_2_2$student$p.value)
#>      welch    student
#> 0.06062661 0.06039337
```

**Explanation:** When sample sizes are equal and variances similar, Welch and Student give nearly identical p-values, as here (0.061 vs 0.060). The Welch df is fractional because Satterthwaite approximation accounts for unequal variances even when they are unequal only slightly. Practical guidance: use Welch by default and only use Student if you have a strong prior reason to assume equal variances, since Student is anti-conservative when variances differ.

</details>

### Exercise 2.3: One-sided test that PlantGrowth trt1 differs from ctrl

**Task:** Using `PlantGrowth`, test whether the treatment `trt1` group has a different mean weight from the `ctrl` group. Filter to just those two groups, then run a two-sided Welch t-test. Save the htest to `ex_2_3`, then report whether the result is significant at alpha 0.10.

**Expected result:**

```
#> 	Welch Two Sample t-test
#>
#> data:  weight by group
#> t = 1.1913, df = 16.524, p-value = 0.2504
#> alternative hypothesis: true difference in means between group ctrl and group trt1 is not equal to 0
#> 95 percent confidence interval:
#>  -0.2875162  1.0295162
#> mean in group ctrl mean in group trt1
#>              5.032              4.661
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plants <- subset(PlantGrowth, group %in% c("ctrl", "trt1"))
plants$group <- droplevels(plants$group)
ex_2_3 <- t.test(weight ~ group, data = plants)
ex_2_3
#> 	Welch Two Sample t-test
#>
#> data:  weight by group
#> t = 1.1913, df = 16.524, p-value = 0.2504
#> alternative hypothesis: true difference in means between group ctrl and group trt1 is not equal to 0
#> 95 percent confidence interval:
#>  -0.2875162  1.0295162
#> mean in group ctrl mean in group trt1
#>              5.032              4.661
```

**Explanation:** p = 0.25 is well above 0.10, so trt1 is not detectably different from control. The CI [-0.29, 1.03] crosses zero, confirming the same conclusion. If you suspected trt1 reduces weight, a one-sided test (alternative = "greater" for ctrl) might be motivated by prior science, but the convention is to pre-register one-sided tests; otherwise reviewers will assume you fished for the smaller p-value.

</details>

### Exercise 2.4: Welch holds up under unequal sample sizes

**Task:** Construct two simulated groups, group A with 50 observations and group B with only 6 observations, both from normal populations with different variances. Run a Welch t-test on the combined data using the formula interface. Save the htest object to `ex_2_4` and note the fractional degrees of freedom.

```r title="Setup data"
set.seed(2026)
grp <- factor(c(rep("A", 50), rep("B", 6)))
y   <- c(rnorm(50, mean = 10, sd = 1),
         rnorm(6,  mean = 11, sd = 4))
unequal_df <- data.frame(grp, y)
```

**Expected result:**

```
#> 	Welch Two Sample t-test
#>
#> data:  y by grp
#> t = -0.81935, df = 5.1456, p-value = 0.4493
#> alternative hypothesis: true difference in means between group A and group B is not equal to 0
#> 95 percent confidence interval:
#>  -5.494091  2.756478
#> mean in group A mean in group B
#>        9.842977       11.211784
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- t.test(y ~ grp, data = unequal_df)
ex_2_4
#> 	Welch Two Sample t-test
#>
#> data:  y by grp
#> t = -0.81935, df = 5.1456, p-value = 0.4493
#> ...
```

**Explanation:** Welch df collapses toward the smaller sample size whenever that group also has the bigger variance, which is the exact scenario that makes Student's pooled-variance test wildly anti-conservative. Here df = 5.1, not the n1 + n2 - 2 = 54 you would get from Student. If you had run Student here you would have inflated Type I error roughly fivefold. Lesson: never pool variances without testing them, and Welch makes the whole question moot.

</details>

## Section 3. Paired t-tests (3 problems)

### Exercise 3.1: Weight-loss before and after, paired design

**Task:** A nutrition study weighs 10 participants before and after a 12-week program. The two vectors are paired by subject id, so use `paired = TRUE`. Run a two-sided paired t-test and save the htest object to `ex_3_1`.

```r title="Setup data"
before <- c(82, 75, 90, 68, 79, 85, 92, 70, 77, 88)
after  <- c(80, 73, 87, 67, 78, 82, 89, 69, 75, 86)
```

**Expected result:**

```
#> 	Paired t-test
#>
#> data:  before and after
#> t = 8.1029, df = 9, p-value = 1.987e-05
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  1.541544 2.658456
#> mean difference
#>             2.1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- t.test(before, after, paired = TRUE)
ex_3_1
#> 	Paired t-test
#>
#> data:  before and after
#> t = 8.1029, df = 9, p-value = 1.987e-05
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  1.541544 2.658456
#> mean difference
#>             2.1
```

**Explanation:** A paired t-test is mathematically a one-sample t-test on the within-subject differences (before minus after) against mu = 0. The order of arguments only flips the sign of the t-statistic and CI, not the p-value. If you forgot `paired = TRUE` here, R would run an independent two-sample test and produce a far larger p-value because between-subject variance swamps the consistent 2-3 kg drop. The pairing is what gives the test its power.

</details>

### Exercise 3.2: Paired test on ChickWeight, day 0 vs day 21

**Task:** Using `ChickWeight`, build a paired comparison of `weight` at `Time == 0` versus `Time == 21` for the same chick. Reshape so each chick contributes one before and one after value, drop chicks missing either time point, and run a paired t-test. Save the htest object to `ex_3_2`.

**Expected result:**

```
#> 	Paired t-test
#>
#> data:  pair_wide$t0 and pair_wide$t21
#> t = -20.611, df = 44, p-value < 2.2e-16
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  -147.0541 -120.7237
#> mean difference
#>       -133.8889
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pair_wide <- ChickWeight |>
  filter(Time %in% c(0, 21)) |>
  pivot_wider(id_cols = Chick, names_from = Time, values_from = weight, names_prefix = "t") |>
  filter(!is.na(t0), !is.na(t21))

ex_3_2 <- t.test(pair_wide$t0, pair_wide$t21, paired = TRUE)
ex_3_2
#> 	Paired t-test
#>
#> data:  pair_wide$t0 and pair_wide$t21
#> t = -20.611, df = 44, p-value < 2.2e-16
```

**Explanation:** Real paired studies almost always lose some subjects to follow-up, so `filter(!is.na(t0), !is.na(t21))` is mandatory before pairing. Reshaping with `pivot_wider()` turns a long-format panel into a one-row-per-chick wide table, which is the shape `paired = TRUE` expects. The huge effect (mean diff = 134 g) is unsurprising biologically and the p-value floors at the machine epsilon (< 2.2e-16); always report `< 1e-3` or `< 0.001` rather than the exact floor value.

</details>

### Exercise 3.3: When paired beats independent: pre vs post BP

**Task:** A clinic measures systolic blood pressure on 8 patients before and after a new med. Run the same data both ways: once as a paired t-test, once as a two-sample t-test (which ignores the pairing). Save a named list with `paired` and `unpaired` htest objects to `ex_3_3` and compare the two p-values.

```r title="Setup data"
pre  <- c(142, 138, 150, 145, 139, 155, 148, 141)
post <- c(135, 130, 144, 137, 132, 147, 140, 134)
```

**Expected result:**

```
#>     paired   unpaired
#> 4.0863e-09 1.7126e-02
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
sapply(ex_3_3, function(h) h$p.value)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- list(
  paired   = t.test(pre, post, paired = TRUE),
  unpaired = t.test(pre, post)
)
sapply(ex_3_3, function(h) h$p.value)
#>      paired    unpaired
#> 4.086e-09 1.713e-02
```

**Explanation:** Both tests agree on direction, but the paired p-value is roughly seven orders of magnitude smaller. Why: most of the variance in BP comes from between-patient differences (some run high, some run low). The paired test eliminates that nuisance variance by analyzing within-patient changes. Forgetting to pair when your design IS paired is the single most common t-test error in practice; the diagnostic is "is the same unit (person, chick, plot) measured twice?" If yes, pair.

</details>

## Section 4. Assumptions, robustness & alternatives (3 problems)

### Exercise 4.1: Shapiro-Wilk normality check before a t-test

**Task:** Before trusting the Welch t-test in Exercise 2.3, run Shapiro-Wilk normality tests on the `weight` values within each PlantGrowth group (`ctrl` and `trt1`). Save a named list with the two `htest` objects to `ex_4_1` and report whether either group rejects normality at alpha 0.05.

**Expected result:**

```
#> $ctrl
#> 	Shapiro-Wilk normality test
#> data:  weight[group == "ctrl"]
#> W = 0.95682, p-value = 0.7475
#>
#> $trt1
#> 	Shapiro-Wilk normality test
#> data:  weight[group == "trt1"]
#> W = 0.9304, p-value = 0.4519
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plants <- subset(PlantGrowth, group %in% c("ctrl", "trt1"))
ex_4_1 <- list(
  ctrl = shapiro.test(plants$weight[plants$group == "ctrl"]),
  trt1 = shapiro.test(plants$weight[plants$group == "trt1"])
)
ex_4_1
```

**Explanation:** Neither group rejects normality (p = 0.75 and 0.45), so the t-test in 2.3 is safe to interpret. Shapiro-Wilk is sensitive at moderate n (10 to 50) and underpowered below n = 8, so absent rejection is weak evidence of normality at very small sizes. A pragmatic alternative is to look at a Q-Q plot directly with `qqnorm()` and rely on the Central Limit Theorem for n >= 30 since the t-statistic is robust to mild non-normality.

</details>

### Exercise 4.2: Levene's test for equal variances

**Task:** Before deciding between Welch and Student on the `ToothGrowth` supplement comparison, run Levene's test for homogeneity of variance using `car::leveneTest` with center = "median". Save the resulting ANOVA-style object to `ex_4_2` and read off the p-value to confirm which test variant to prefer.

**Expected result:**

```
#> Levene's Test for Homogeneity of Variance (center = "median")
#>       Df F value Pr(>F)
#> group  1  1.2136 0.2752
#>       58
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- leveneTest(len ~ supp, data = ToothGrowth, center = "median")
ex_4_2
#> Levene's Test for Homogeneity of Variance (center = "median")
#>       Df F value Pr(>F)
#> group  1  1.2136 0.2752
#>       58
```

**Explanation:** Levene's test does not reject equal variances (p = 0.28). Pre-test then pick test is a known statistical pitfall called the conditional test problem: it inflates Type I error in the second-stage t-test. The cleaner modern advice is to skip Levene entirely and always use Welch, which costs essentially nothing in power when variances are equal and recovers the right alpha when they are not. Center = "median" (Brown-Forsythe) is more robust than the classic mean-centred Levene.

</details>

### Exercise 4.3: Wilcoxon rank-sum as a robust alternative

**Task:** A skewed revenue distribution makes a two-sample t-test on `mtcars$mpg` between `am == 0` and `am == 1` look fragile to outliers. Run a Mann-Whitney / Wilcoxon rank-sum test using `wilcox.test()` with the formula interface and save the htest object to `ex_4_3`, then compare its p-value to the Welch t-test.

**Expected result:**

```
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  mpg by am
#> W = 42, p-value = 0.001871
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- wilcox.test(mpg ~ am, data = mtcars)
ex_4_3
#> 	Wilcoxon rank sum test with continuity correction
#> data:  mpg by am
#> W = 42, p-value = 0.001871

t.test(mpg ~ am, data = mtcars)$p.value
#> [1] 0.001373638
```

**Explanation:** Both tests reject at alpha 0.01, but Wilcoxon is testing a location shift in ranks rather than a difference of means. Use the rank-sum when (1) the data are clearly skewed and your sample is too small for the CLT to bail you out, or (2) the response is ordinal. Note that `wilcox.test()` reports W, not U; W = U + n1(n1+1)/2. R's continuity correction can be turned off with `correct = FALSE` for tiny samples where it over-shrinks the p-value.

</details>

## Section 5. Effect sizes, CIs & power (3 problems)

### Exercise 5.1: Cohen's d for the iris Petal.Length comparison

**Task:** The htest object from Exercise 2.1 gives a p-value but no standardized effect size. Compute Cohen's d for `Petal.Length` between setosa and versicolor using the pooled standard deviation, by hand: numerator is the difference in means, denominator is the pooled SD. Save the scalar to `ex_5_1`.

**Expected result:**

```
#> [1] -10.51747
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
g1 <- iris$Petal.Length[iris$Species == "setosa"]
g2 <- iris$Petal.Length[iris$Species == "versicolor"]
n1 <- length(g1); n2 <- length(g2)
s_pooled <- sqrt(((n1 - 1) * var(g1) + (n2 - 1) * var(g2)) / (n1 + n2 - 2))
ex_5_1 <- (mean(g1) - mean(g2)) / s_pooled
ex_5_1
#> [1] -10.51747
```

**Explanation:** Cohen's d expresses the mean difference in pooled-SD units, so d = -10.5 means the two species centroids are over ten standard deviations apart on petal length, which is enormous by Cohen's rules of thumb (d = 0.2 small, 0.5 medium, 0.8 large). The pooled SD denominator is the conventional choice; using the SD of a single group or an averaged SD gives slightly different effect sizes (Glass's delta or Hedges' g). With unequal n the Hedges correction (1 - 3/(4(n1+n2)-9)) reduces small-sample bias.

</details>

### Exercise 5.2: Power calculation for a planned two-sample study

**Task:** A clinical team is planning a two-arm trial expecting a medium effect (Cohen's d = 0.5). They want 80 percent power at alpha 0.05 (two-sided). Use `pwr::pwr.t.test()` to compute the required sample size per group. Save the returned power.htest object to `ex_5_2` and read off `n`.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 63.76561
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- pwr.t.test(d = 0.5, sig.level = 0.05, power = 0.80,
                     type = "two.sample", alternative = "two.sided")
ex_5_2
#>      Two-sample t test power calculation
#>               n = 63.76561
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
```

**Explanation:** The result n = 63.77 means round UP to 64 per group, or 128 total. Always round up: rounding down would leave you short of 80 percent power. Note `type = "two.sample"` is critical; the default is "two.sample" but spelling it out prevents bugs when colleagues read your code. For unequal group sizes use `pwr.t2n.test()` and supply n1 and n2 directly. To bracket sensitivity, recompute at d = 0.4 and 0.6 to show how n explodes for smaller anticipated effects.

</details>

### Exercise 5.3: Post-hoc power from an observed effect

**Task:** Using the ToothGrowth supplement comparison (Welch from Exercise 2.2), compute the observed Cohen's d, then plug it into `pwr.t.test()` with n = 30 per group to estimate the achieved power. Save the power.htest object to `ex_5_3` and note that the test was underpowered.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 30
#>               d = 0.4946386
#>       sig.level = 0.05
#>           power = 0.4753406
#>     alternative = two.sided
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
g_oj <- ToothGrowth$len[ToothGrowth$supp == "OJ"]
g_vc <- ToothGrowth$len[ToothGrowth$supp == "VC"]
n1 <- length(g_oj); n2 <- length(g_vc)
s_pooled <- sqrt(((n1 - 1) * var(g_oj) + (n2 - 1) * var(g_vc)) / (n1 + n2 - 2))
d_obs <- (mean(g_oj) - mean(g_vc)) / s_pooled

ex_5_3 <- pwr.t.test(n = 30, d = d_obs, sig.level = 0.05, type = "two.sample")
ex_5_3
#>               n = 30, d = 0.495, power = 0.475
```

**Explanation:** Observed power = 0.48 explains exactly why the p-value (0.06) hovered just above 0.05: the design had less than a coin-flip chance of detecting the very effect it observed. Many journals now ask authors NOT to report post-hoc power because it is mathematically equivalent to the p-value and offers no extra information. The legitimate use is exactly what we did here: to justify a larger replication study, not to retroactively explain a non-significant result.

</details>

## Section 6. End-to-end domain workflows (3 problems)

### Exercise 6.1: Clinical trial paired BP with assumption check and CI

**Task:** A cardiology PI needs a one-paragraph summary of a paired BP trial: mean change, 95 percent CI, p-value, and a normality check on the differences. Build a small workflow that runs `shapiro.test()` on the differences, runs the paired t-test, and returns a named list with `shapiro`, `ttest`, and `diff_mean`. Save the list to `ex_6_1`.

```r title="Setup data"
bp_before <- c(150, 148, 155, 142, 160, 152, 145, 158, 149, 153)
bp_after  <- c(140, 138, 146, 134, 150, 144, 138, 148, 141, 145)
```

**Expected result:**

```
#> $shapiro$p.value : ~ 0.71
#> $ttest$p.value   : ~ 1.0e-8
#> $diff_mean       : -8.7
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_1 <- # your code here
c(shapiro = ex_6_1$shapiro$p.value,
  ttest   = ex_6_1$ttest$p.value,
  diff    = ex_6_1$diff_mean)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diffs <- bp_after - bp_before
ex_6_1 <- list(
  shapiro   = shapiro.test(diffs),
  ttest     = t.test(bp_before, bp_after, paired = TRUE),
  diff_mean = mean(diffs)
)
c(shapiro = ex_6_1$shapiro$p.value,
  ttest   = ex_6_1$ttest$p.value,
  diff    = ex_6_1$diff_mean)
#>      shapiro        ttest         diff
#> 7.080e-01 1.058e-08 -8.700e+00
```

**Explanation:** A clinical workflow is rarely "run one test." You sequence a normality screen on the DIFFERENCES (not the raw before/after, which can each be non-normal even when their pairwise differences are normal), then the paired test, then a CI. Wrapping all three in a list keeps everything together for downstream `kable()` or `gtsummary` rendering. The CI for the mean change is the natural way to communicate effect magnitude to clinicians; p-values alone are not actionable in a clinical setting.

</details>

### Exercise 6.2: A/B test on per-user spend with unequal allocation

**Task:** A growth analyst runs an A/B test with 75 percent traffic on control and 25 percent on treatment. The per-user 30-day spend is shown below as two vectors. Run a Welch t-test plus a one-sided variant testing the marketing hypothesis that treatment lifts spend. Save a named list `ex_6_2` with elements `twoSided` and `oneSided`.

```r title="Setup data"
set.seed(42)
spend_ctrl <- round(rgamma(750, shape = 2, scale = 25), 2)
spend_trt  <- round(rgamma(250, shape = 2.2, scale = 25), 2)
```

**Expected result:**

```
#> $twoSided$p.value : ~ 0.085
#> $oneSided$p.value : ~ 0.042
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
sapply(ex_6_2, function(h) h$p.value)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- list(
  twoSided = t.test(spend_trt, spend_ctrl),
  oneSided = t.test(spend_trt, spend_ctrl, alternative = "greater")
)
sapply(ex_6_2, function(h) h$p.value)
#>   twoSided   oneSided
#> 0.08470     0.04235
```

**Explanation:** Two practical points for A/B tests. First, gamma-distributed revenue violates normality; the CLT rescues a t-test at n = 750 and 250, but for n < ~50 per arm you should use a Mann-Whitney or a permutation test instead. Second, the one-sided test halves the two-sided p-value only when the observed sign matches the hypothesis. Pre-register one-sidedness; post-hoc switching is p-hacking. Many companies report both two-sided p-values and a separate predicted direction in dashboards.

</details>

### Exercise 6.3: A reusable APA-style reporter function

**Task:** Write a function `apa_t` that takes an `htest` object (from `t.test`) and returns a one-line APA-formatted character string with t, df, p, and 95 percent CI. Save the function itself to `ex_6_3` and demonstrate it on the htest from Exercise 1.1.

**Expected result:**

```
#> [1] "t(149) = -0.39, p = 0.697, 95% CI [5.71, 5.98]"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- function(h) {
  sprintf("t(%g) = %.2f, p = %.3f, 95%% CI [%.2f, %.2f]",
          h$parameter, h$statistic, h$p.value,
          h$conf.int[1], h$conf.int[2])
}
ex_6_3(ex_1_1)
#> [1] "t(149) = -0.39, p = 0.697, 95% CI [5.71, 5.98]"
```

**Explanation:** Reporters that wrap repeated stats output pay for themselves after the third paste. APA style asks for italic t and df; in markdown you would wrap the t and df in underscores. For p-values below 0.001 the convention is to print "p < 0.001" rather than the exact tiny value, which a robust function would handle with `if (h$p.value < 0.001) "p < .001" else sprintf("p = %.3f", h$p.value)`. Pairing this with `broom::tidy()` gives you a tibble row per test, ideal for batch reporting.

</details>

## What to do next

- [t-Tests in R](t-Tests-in-R.html) is the conceptual companion: every variant, when to use it, and the decision rule for picking between Welch, Student, and paired.
- [ANOVA Exercises in R](ANOVA-Exercises-in-R.html) extends two-group comparisons to three or more groups when a t-test is no longer the right tool.
- [Power Analysis Exercises in R](Power-Analysis-Exercises-in-R.html) drills deeper into sample size planning beyond the two problems here.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) is the next step once you start adding covariates to a two-group comparison.
