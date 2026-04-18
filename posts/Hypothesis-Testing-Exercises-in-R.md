---
title: "Hypothesis Testing Exercises in R: 15 Practice Problems with Solutions"
slug: Hypothesis-Testing-Exercises-in-R
description: "15 hypothesis testing exercises in R with runnable solutions: t-tests, proportions, chi-square, non-parametric tests, Type I/II errors, and power analysis."
keywords: "hypothesis testing exercises in R, t-test exercises, p-value practice problems, chi-square exercises R, hypothesis testing practice, Type I error simulation, power analysis R"
auto_link_terms: "hypothesis testing exercises|hypothesis testing practice|hypothesis test problems|t-test exercises|hypothesis testing questions|p-value practice"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.1
post_type: EX
sidebar_title: "Hypothesis Testing Exercises"
fr_parent: Hypothesis-Testing-in-R.html
difficulty: Intermediate
---

# Hypothesis Testing Exercises in R: 15 Practice Problems with Solutions

<p class="lead">These 15 hypothesis testing exercises in R walk you through t-tests, proportion tests, chi-square, non-parametric alternatives, Type I and Type II errors, and power analysis with full runnable solutions. Every problem includes a scaffold, a hint, and a reveal so you can check your answer the moment you finish coding.</p>

## How do you set up and run a hypothesis test in R?

Every hypothesis test in R collapses the same five-step story: state H₀ and H₁, pick a test, compute a statistic, read the p-value, decide against α. We'll run that full story on `iris$Sepal.Width` in one block against the claim "mean sepal width equals 3.0 cm," then lean on this one pattern across all 15 problems below.

```r title="One-sample t-test on iris Sepal.Width"
# Five-step hypothesis test in one block
# H0: mean Sepal.Width = 3.0      H1: mean Sepal.Width != 3.0
sample_test <- t.test(iris$Sepal.Width, mu = 3.0)
sample_test
#> 	One Sample t-test
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

The sample mean (3.057) sits just above the hypothesised 3.0, the t statistic is a modest 1.61, and the p-value of 0.11 says: "a gap this big or bigger would happen about 11% of the time if H₀ held." That's not rare enough to reject at α = 0.05, so we keep H₀. The 95% CI \[2.987, 3.128\] also contains 3.0, which is the same decision expressed as an interval.

[KEY INSIGHT]
**Every R hypothesis test returns the same list shape: statistic, p.value, parameter, conf.int.** That consistency is what lets one decision rule (p < α) power `t.test()`, `prop.test()`, `chisq.test()`, and `wilcox.test()` alike. Learn the interface once and every future test slots in.

**Try it:** Re-run the same test against `mu = 2.9`. Predict before running: should the p-value go up or down compared to 0.11?

```r title="Your turn: predict p-value at mu 2.9"
# Try it: change mu and predict the direction of the p-value
ex_test <- t.test(iris$Sepal.Width, mu = ___)   # replace ___ with 2.9
ex_test$p.value
#> Expected: a much smaller p-value, below 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mu-2.9 solution"
ex_test <- t.test(iris$Sepal.Width, mu = 2.9)
ex_test$p.value
#> [1] 1.853741e-05
```

**Explanation:** The sample mean 3.057 is farther from 2.9 than it is from 3.0, so the t statistic grows and the tail probability shrinks. The p-value drops well below 0.05 and we now reject H₀: μ = 2.9.

</details>

## How do you read test output and decide against alpha?

The object returned by any R test is a list, which means you can pull out the exact number you need with `$p.value`, `$statistic`, or `$conf.int`. That matters the moment you want to report a result, chain the decision into code, or re-use the same template across dozens of tests. Once you can programmatically read a test object you can automate the whole report.

```r title="Extract results and automate the decision"
# Programmatic access to a test result
alpha <- 0.05

c(statistic = unname(sample_test$statistic),
  p_value   = sample_test$p.value,
  ci_lo     = sample_test$conf.int[1],
  ci_hi     = sample_test$conf.int[2])
#>  statistic    p_value      ci_lo      ci_hi
#>  1.6104762  0.1094245  2.9865569  3.1281097

decision_msg <- if (sample_test$p.value < alpha) {
  "Reject H0 at alpha = 0.05"
} else {
  "Fail to reject H0 at alpha = 0.05"
}
decision_msg
#> [1] "Fail to reject H0 at alpha = 0.05"
```

Pulling each number out separately is the template you'll use in every exercise: extract, compare to α, print a plain-English decision. Notice the CI contains 3.0, which is the same conclusion as p > 0.05 stated differently. Whenever the null value sits inside the 95% CI, the two-sided test at α = 0.05 will fail to reject.

[TIP]
**Always report statistic, df, p, and CI together.** A p-value alone answers "is the effect non-zero?" but not "how big is it?" or "how precisely measured?" The CI carries both pieces. Journals increasingly require the quartet, and it protects you from the worst misreads of a p-value on its own.

**Try it:** Run a Welch two-sample t-test of `Petal.Length` by `Species` on the iris rows for `setosa` and `versicolor`, then extract the 95% confidence interval for the difference of means.

```r title="Your turn: extract CI from two-sample t-test"
# Try it: Welch two-sample t on iris Petal.Length, setosa vs versicolor
setv <- subset(iris, Species %in% c("setosa", "versicolor"))
ex_ci_test <- t.test(Petal.Length ~ Species, data = setv)
# your code: print the 95% CI only
___
#> Expected: a tight interval near -2.8, well below zero
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-sample CI solution"
setv <- subset(iris, Species %in% c("setosa", "versicolor"))
ex_ci_test <- t.test(Petal.Length ~ Species, data = setv)
ex_ci_test$conf.int
#> [1] -2.939618 -2.656382
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** The CI sits entirely on one side of zero, which is the two-sample version of "null value not contained." Setosa petals are about 2.8 cm shorter than versicolor, and we're 95% confident the true difference lies in \[-2.94, -2.66\].

</details>

## Practice Exercises

The 15 exercises below ramp from core t-test mechanics to simulation-based reasoning about Type I error, power, and multiple testing. Every solution uses distinct variables (prefixed `ex1_`, `ex2_`, ...) so your exercise code never overwrites the tutorial's `sample_test` state.

### Exercise 1: One-sample t-test against a fixed value

Using the iris dataset, test whether the mean `Sepal.Length` for *setosa* flowers differs from 5.0 cm. Report the t statistic, the p-value, and the 95% CI, then state your decision at α = 0.05.

```r title="Exercise 1 starter"
# Exercise 1: one-sample t-test on iris setosa Sepal.Length vs mu = 5.0
# Hint: subset iris to Species == "setosa" first, then call t.test(..., mu = 5.0)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
setosa_len <- iris$Sepal.Length[iris$Species == "setosa"]
ex1_test <- t.test(setosa_len, mu = 5.0)
ex1_test
#> 	One Sample t-test
#>
#> data:  setosa_len
#> t = 0.12028, df = 49, p-value = 0.9048
#> alternative hypothesis: true mean is not equal to 5
#> 95 percent confidence interval:
#>  4.905824 5.106176
#> sample estimates:
#> mean of x
#>     5.006
```

**Decision:** p ≈ 0.90 is nowhere near 0.05, so we fail to reject H₀. The mean setosa sepal length is consistent with 5.0 cm, and 5.0 sits comfortably inside the 95% CI \[4.91, 5.11\].

</details>

### Exercise 2: One-sided t-test with direction

On mtcars, test whether 4-cylinder cars have mean miles-per-gallon *greater than* 25 (not just different from 25). Use α = 0.05 and state whether you would reject.

```r title="Exercise 2 starter"
# Exercise 2: one-sided t-test on mtcars 4-cyl mpg vs mu = 25
# Hint: subset to cyl == 4, then use alternative = "greater"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
four_cyl <- mtcars$mpg[mtcars$cyl == 4]
ex2_test <- t.test(four_cyl, mu = 25, alternative = "greater")
ex2_test
#> 	One Sample t-test
#>
#> data:  four_cyl
#> t = 1.2215, df = 10, p-value = 0.1249
#> alternative hypothesis: true mean is greater than 25
#> 95 percent confidence interval:
#>  24.2217     Inf
#> sample estimates:
#> mean of x
#>  26.66364
```

**Decision:** The sample mean 26.66 sits above 25, but the one-sided p-value 0.125 is above 0.05. We fail to reject H₀. This is the right reminder that "the sample mean is higher than the claim" is never enough on its own, you need the standard error and the sample size to decide.

</details>

### Exercise 3: Manual t statistic and two-sided p-value

From `mtcars$hp`, compute the t statistic against μ₀ = 150 from scratch using `mean()`, `sd()`, `length()`, and convert it to a two-sided p-value with `pt()`. Verify your answer against the `t.test()` output.

```r title="Exercise 3 starter"
# Exercise 3: manual t and two-sided p for mtcars$hp against mu = 150
# Hint: t = (mean(x) - mu0) / (sd(x) / sqrt(n)); p = 2 * pt(-abs(t), df = n-1)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
hp_vec <- mtcars$hp
n <- length(hp_vec)
mu0 <- 150

ex3_t <- (mean(hp_vec) - mu0) / (sd(hp_vec) / sqrt(n))
ex3_p <- 2 * pt(-abs(ex3_t), df = n - 1)
c(t = ex3_t, p = ex3_p)
#>          t          p
#> -0.2735125  0.7862540

# Verify
t.test(hp_vec, mu = 150)$statistic
#>          t
#> -0.2735125
t.test(hp_vec, mu = 150)$p.value
#> [1] 0.786254
```

**Explanation:** The manual t (-0.274) and p (0.786) match the `t.test()` output to the last digit. There's no magic, the p-value is just twice the left-tail probability of `-|t|` on a t distribution with `n - 1` degrees of freedom. Building the number by hand once cements that.

</details>

### Exercise 4: Build a reusable decision function

Write a function `decide_t(x, mu, alpha)` that runs a one-sample t-test and returns a list with fields `statistic`, `p_value`, `ci`, and `decision` (character: `"reject"` or `"fail to reject"`). Test it on `iris$Petal.Length` against μ = 3.8 at α = 0.05.

```r title="Exercise 4 starter"
# Exercise 4: reusable decide_t() wrapping t.test()
# Hint: call t.test() inside the function, then assemble a list of return values

decide_t <- function(x, mu, alpha = 0.05) {
  # your code here
}

# Test:
ex4_out <- decide_t(iris$Petal.Length, mu = 3.8, alpha = 0.05)
ex4_out
#> Expected: decision is "fail to reject"

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
decide_t <- function(x, mu, alpha = 0.05) {
  tt <- t.test(x, mu = mu)
  list(
    statistic = unname(tt$statistic),
    p_value   = tt$p.value,
    ci        = tt$conf.int,
    decision  = if (tt$p.value < alpha) "reject" else "fail to reject"
  )
}

ex4_out <- decide_t(iris$Petal.Length, mu = 3.8, alpha = 0.05)
ex4_out
#> $statistic
#> [1] -0.2867036
#>
#> $p_value
#> [1] 0.7747889
#>
#> $ci
#> [1] 3.473185 4.042815
#> attr(,"conf.level")
#> [1] 0.95
#>
#> $decision
#> [1] "fail to reject"
```

**Explanation:** The function packages the four numbers you actually want to report. Now every call site reads as one line and returns a self-contained decision record, which is the pattern you extend into a full analysis pipeline.

</details>

### Exercise 5: Two-sample Welch t-test

Test whether the mean `Petal.Length` differs between iris *setosa* and *versicolor*. Run the two-sample Welch t-test, extract the full result, then write a one-sentence paper-ready summary that includes the means, the t statistic, the degrees of freedom, the p-value, and the 95% CI.

```r title="Exercise 5 starter"
# Exercise 5: Welch two-sample t-test on iris Petal.Length by Species
# Hint: subset to setosa + versicolor, use the formula interface Petal.Length ~ Species

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
setv <- subset(iris, Species %in% c("setosa", "versicolor"))
ex5_test <- t.test(Petal.Length ~ Species, data = setv)
ex5_test
#> 	Welch Two Sample t-test
#>
#> data:  Petal.Length by Species
#> t = -39.493, df = 62.14, p-value < 2.2e-16
#> alternative hypothesis: true difference in means between group setosa and group versicolor is not equal to 0
#> 95 percent confidence interval:
#>  -2.939618 -2.656382
#> sample estimates:
#>     mean in group setosa mean in group versicolor
#>                    1.462                    4.260
```

**Paper-ready sentence:**

> Versicolor petals (M = 4.26 cm, n = 50) were significantly longer than setosa petals (M = 1.46 cm, n = 50), Welch's t(62.14) = -39.49, p < 0.001, 95% CI for the difference \[-2.94, -2.66\] cm.

**Explanation:** The 2.8 cm gap is 40 standard errors wide, which is why the p-value is vanishingly small and the CI sits far from zero. Reporting the means + t + df + p + CI is the full quartet a reader needs to judge the effect for themselves.

</details>

### Exercise 6: Paired t-test on the sleep dataset

The built-in `sleep` dataset records extra sleep induced by two drugs in the same 10 subjects. Test whether drug 2 produces *more* extra sleep than drug 1 using a paired t-test. First convince yourself the data really is paired, then run the test with the correct alternative.

```r title="Exercise 6 starter"
# Exercise 6: paired t-test on sleep, drug 2 > drug 1
# Hint: subset by group, confirm the two vectors share subject IDs, then pass paired = TRUE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
# Confirm pairing: same ID appears in each group
head(sleep)
#>   extra group ID
#> 1   0.7     1  1
#> 2  -1.6     1  2
#> 3  -0.2     1  3
#> 4  -1.2     1  4
#> 5  -0.1     1  5
#> 6   3.4     1  6

drug1 <- sleep$extra[sleep$group == 1]
drug2 <- sleep$extra[sleep$group == 2]

ex6_test <- t.test(drug2, drug1, paired = TRUE, alternative = "greater")
ex6_test
#> 	Paired t-test
#>
#> data:  drug2 and drug1
#> t = 4.0621, df = 9, p-value = 0.001416
#> alternative hypothesis: true mean difference is greater than 0
#> 95 percent confidence interval:
#>  0.8669947       Inf
#> sample estimates:
#> mean difference
#>            1.58
```

**Decision:** p ≈ 0.0014, far below 0.05, so we reject H₀. Drug 2 produces on average 1.58 hours more extra sleep per subject than drug 1, and the one-sided 95% CI lower bound is 0.87 hours.

**Explanation:** A paired t-test reduces to a one-sample t-test on the within-subject differences. That's why `paired = TRUE` is so much more powerful than an independent two-sample test here, it cancels out the between-subject variability that would otherwise dominate.

</details>

### Exercise 7: Equal-variance vs Welch t-test

On mtcars, test whether `mpg` differs by transmission type (`am`) under two variance assumptions: equal variance (`var.equal = TRUE`) and Welch (default). Then use `bartlett.test()` to check which assumption the data supports.

```r title="Exercise 7 starter"
# Exercise 7: equal-variance vs Welch t-test on mtcars mpg by am
# Hint: call t.test(mpg ~ am, data = mtcars, var.equal = TRUE) and default
#       Then bartlett.test(mpg ~ am, data = mtcars) for the variance check

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_eq    <- t.test(mpg ~ am, data = mtcars, var.equal = TRUE)
ex7_welch <- t.test(mpg ~ am, data = mtcars)
ex7_bart  <- bartlett.test(mpg ~ am, data = mtcars)

c(equal_var_p = ex7_eq$p.value,
  welch_p     = ex7_welch$p.value,
  bartlett_p  = ex7_bart$p.value)
#> equal_var_p     welch_p  bartlett_p
#>  0.00028506  0.00137367  0.07231519
```

**Explanation:** Both tests reject H₀, but they disagree on magnitude. The Bartlett p-value of 0.072 is borderline, the variances are probably not equal enough to trust `var.equal = TRUE`. Welch's test relaxes the assumption by estimating a fractional degrees of freedom, and it's the safer default for real data. The modern recommendation is to use Welch unless you have a strong prior reason (balanced design, matched sds) to assume equal variances.

</details>

[NOTE]
**R's default t.test() is Welch, not Student's.** This differs from many textbooks and SPSS, which default to the equal-variance version. The modern consensus is that Welch is better-behaved under mild variance differences and costs almost nothing in power when variances really are equal. Set `var.equal = TRUE` only when you have a specific design reason to.

### Exercise 8: One-proportion test against a claim

A factory claims its defect rate is 2%. In a sample of 500 units, 18 turn out to be defective. Test whether the observed defect rate differs significantly from 2% using both `prop.test()` and `binom.test()`, and decide at α = 0.05.

```r title="Exercise 8 starter"
# Exercise 8: one-proportion test, 18 defects out of 500, claim = 2%
# Hint: prop.test(x = 18, n = 500, p = 0.02)  and  binom.test(18, 500, p = 0.02)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_prop  <- prop.test(x = 18, n = 500, p = 0.02)
ex8_binom <- binom.test(x = 18, n = 500, p = 0.02)

c(prop_p = ex8_prop$p.value, binom_p = ex8_binom$p.value)
#>     prop_p    binom_p
#> 0.03168317 0.03207064

ex8_prop$conf.int
#> [1] 0.02271537 0.05669728
#> attr(,"conf.level")
#> [1] 0.95
```

**Decision:** Both tests return p ≈ 0.032, below 0.05, so we reject H₀ at α = 0.05. The observed defect rate (3.6%) is significantly higher than the claimed 2%.

**Explanation:** `prop.test()` uses a chi-square approximation with continuity correction; `binom.test()` is the exact test based on the binomial distribution. Results agree closely here because `n = 500` is large. Prefer `binom.test()` when `n * p < 10` or `n * (1 - p) < 10`, where the approximation breaks down.

</details>

### Exercise 9: Two-proportion A/B test

A team runs an A/B test on a checkout button. Control converts 48 of 500; treatment converts 72 of 500. Test whether the conversion rates differ and compute the 95% confidence interval for the difference.

```r title="Exercise 9 starter"
# Exercise 9: two-proportion test, control 48/500 vs treatment 72/500
# Hint: prop.test(x = c(48, 72), n = c(500, 500))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_ab <- prop.test(x = c(48, 72), n = c(500, 500))
ex9_ab
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  c(48, 72) out of c(500, 500)
#> X-squared = 4.9041, df = 1, p-value = 0.02682
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.09004175 -0.00595825
#> sample estimates:
#> prop 1 prop 2
#>  0.096  0.144
```

**Decision:** p ≈ 0.027 is below 0.05, so we reject H₀. Treatment conversion (14.4%) is significantly higher than control (9.6%). The 95% CI for the difference \[-9.0, -0.6\] percentage points excludes zero, which is the same conclusion phrased as an interval.

**Explanation:** The CI is the more useful number in practice. A 0.6 to 9.0 percentage-point lift is a wide range, if the lower bound is too small to justify the rollout cost, you'd collect more data before committing.

</details>

### Exercise 10: Chi-square test of independence

Using `mtcars`, test whether transmission type (`am`) is independent of cylinder count (`cyl`). Build the 3 × 2 contingency table, run `chisq.test()`, and interpret the warning R throws. Then compare to `fisher.test()` to see how the exact test handles small expected counts.

```r title="Exercise 10 starter"
# Exercise 10: chi-square independence of cyl and am in mtcars
# Hint: table(mtcars$cyl, mtcars$am) then chisq.test() on the table

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
cyl_am <- table(mtcars$cyl, mtcars$am)
cyl_am
#>
#>      0  1
#>   4  3  8
#>   6  4  3
#>   8 12  2

ex10_chi <- chisq.test(cyl_am)
#> Warning message:
#> In chisq.test(cyl_am) : Chi-squared approximation may be incorrect
ex10_chi
#> 	Pearson's Chi-squared test
#>
#> data:  cyl_am
#> X-squared = 8.7407, df = 2, p-value = 0.01265

ex10_chi$expected
#>        0        1
#> 4 6.7188 4.28125
#> 6 4.2813 2.71875
#> 8 8.5625 5.43750

ex10_fisher <- fisher.test(cyl_am)
ex10_fisher$p.value
#> [1] 0.009105526
```

**Decision:** Both tests reject H₀ at α = 0.05, transmission type is not independent of cylinder count in this sample. 4-cylinder cars lean heavily manual, 8-cylinder cars lean heavily automatic.

**Explanation:** The warning fires because two expected cells (the 6-cyl row) drop below 5, breaking the chi-square approximation. `fisher.test()` is exact and avoids that failure mode. As a rule, switch to Fisher's exact test whenever any expected count is below 5 or the sample is small (total n < 50).

</details>

### Exercise 11: Wilcoxon rank-sum test

Compare `Petal.Length` between iris *versicolor* and *virginica* using the non-parametric Wilcoxon rank-sum test (also called Mann-Whitney U). Run the parametric t-test on the same data and compare p-values.

```r title="Exercise 11 starter"
# Exercise 11: Wilcoxon rank-sum on iris versicolor vs virginica Petal.Length
# Hint: wilcox.test(Petal.Length ~ Species, data = vv) on the subset

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 11 solution"
vv <- subset(iris, Species %in% c("versicolor", "virginica"))
ex11_w <- wilcox.test(Petal.Length ~ Species, data = vv)
ex11_t <- t.test(Petal.Length ~ Species, data = vv)

c(wilcox_p = ex11_w$p.value, ttest_p = ex11_t$p.value)
#>     wilcox_p      ttest_p
#> 8.346526e-17 3.177882e-22
```

**Decision:** Both tests reject H₀ overwhelmingly, versicolor and virginica petal lengths differ significantly.

**Explanation:** The non-parametric Wilcoxon test does not assume normality, it uses ranks. With large effect sizes like this one, both tests agree. The t-test tends to produce slightly smaller p-values when assumptions hold because it uses more information (actual values rather than ranks). Reach for `wilcox.test()` when your data has outliers, clear skew, or small n where normality is unverifiable.

</details>

### Exercise 12: Wilcoxon signed-rank on paired data

Re-run Exercise 6 on the `sleep` dataset using `wilcox.test(..., paired = TRUE)`. Compare the p-value to the parametric paired t-test and comment on the difference.

```r title="Exercise 12 starter"
# Exercise 12: Wilcoxon signed-rank on paired sleep data
# Hint: wilcox.test(drug2, drug1, paired = TRUE, alternative = "greater")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 12 solution"
drug1 <- sleep$extra[sleep$group == 1]
drug2 <- sleep$extra[sleep$group == 2]

ex12_w <- wilcox.test(drug2, drug1, paired = TRUE, alternative = "greater")
ex12_t <- t.test(drug2, drug1, paired = TRUE, alternative = "greater")

c(wilcox_p = ex12_w$p.value, ttest_p = ex12_t$p.value)
#>    wilcox_p     ttest_p
#> 0.004545455 0.001415712
```

**Decision:** Both tests reject H₀, but the Wilcoxon p-value (0.0045) is larger than the t-test p-value (0.0014). Both are below 0.05.

**Explanation:** The signed-rank test turns differences into signed ranks, losing some information on magnitude. When the data is roughly normal (like here), the t-test is more powerful and produces a smaller p-value. When the data has heavy tails or outliers, the signed-rank test is more robust and often the safer choice. A 10-subject study is right at the edge where you might want the non-parametric backup as a sanity check.

</details>

### Exercise 13: Empirical Type I error rate

Simulate 2000 samples of size `n = 30` from `N(0, 1)` and run a one-sample t-test against μ = 0 on each. The null hypothesis is true by construction, so the proportion of p-values below 0.05 should sit near 0.05. Verify that.

```r title="Exercise 13 starter"
# Exercise 13: empirical Type I error rate under a true null
# Hint: replicate(2000, t.test(rnorm(30), mu = 0)$p.value < 0.05)
set.seed(1305)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 13 solution"
set.seed(1305)
ex13_rejects <- replicate(2000, {
  s <- rnorm(30, mean = 0, sd = 1)
  t.test(s, mu = 0)$p.value < 0.05
})
ex13_rate <- mean(ex13_rejects)
ex13_rate
#> [1] 0.051
```

**Explanation:** We rejected H₀ about 5.1% of the time even though H₀ was always true. That's α in action, the pre-specified tolerance for false positives. Run the simulation with α = 0.01 and the rate drops to about 1%. This is the whole statistical guarantee of hypothesis testing: the long-run false-positive rate equals α, regardless of the data-generating process, as long as the test's assumptions hold.

</details>

[KEY INSIGHT]
**α is the one number hypothesis testing promises to control.** The t-test does not know whether your effect is real or your sampling design is sensible, it only guarantees that, across many experiments in which H₀ is true, you will reject roughly α of the time. Every misuse of p-values comes from forgetting that this is the only long-run guarantee the framework offers.

### Exercise 14: Power curve across effect sizes

Hold the sample size fixed at `n = 40` and the standard deviation at 1. For true means of 0.1, 0.3, 0.5, and 0.8, simulate 1000 t-tests against μ = 0 and record the empirical power at α = 0.05. Plot the resulting power curve.

```r title="Exercise 14 starter"
# Exercise 14: power curve across effect sizes at fixed n = 40
# Hint: nest replicate() inside sapply() over the four true means
set.seed(1405)
ex14_mus <- c(0.1, 0.3, 0.5, 0.8)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 14 solution"
set.seed(1405)
ex14_mus   <- c(0.1, 0.3, 0.5, 0.8)
ex14_power <- sapply(ex14_mus, function(mu_true) {
  rejects <- replicate(1000, {
    s <- rnorm(40, mean = mu_true, sd = 1)
    t.test(s, mu = 0)$p.value < 0.05
  })
  mean(rejects)
})

data.frame(true_mu = ex14_mus, power = ex14_power)
#>   true_mu power
#> 1     0.1 0.103
#> 2     0.3 0.491
#> 3     0.5 0.879
#> 4     0.8 0.999

plot(ex14_mus, ex14_power, type = "b", pch = 19, col = "#6e4a9e",
     xlab = "True mean (effect size)", ylab = "Empirical power",
     main = "Power curve at n = 40, alpha = 0.05")
abline(h = 0.8, lty = 2, col = "darkred")
```

**Explanation:** Power rises steeply with effect size. At μ = 0.1 we catch a real effect only 10% of the time (basically the false-positive rate), meaning n = 40 is far too small for small effects. By μ = 0.5 we're at 88% power, and at μ = 0.8 we reject almost always. The red dashed line at 0.80 is the conventional target, it crosses the curve around μ = 0.45, which is the minimum effect we can reliably detect with this sample size.

</details>

### Exercise 15: Multiple testing and Bonferroni correction

Run 20 independent one-sample t-tests under H₀ (all samples from `N(0, 1)`) and count how often *at least one* rejects at α = 0.05. Compare the observed family-wise error rate to the theoretical value and to the Bonferroni-corrected threshold α = 0.05 / 20.

```r title="Exercise 15 starter"
# Exercise 15: family-wise error rate with and without Bonferroni correction
# Hint: replicate the "run 20 tests" experiment many times, record whether any rejected
set.seed(1505)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 15 solution"
set.seed(1505)
run_20_tests <- function() {
  replicate(20, t.test(rnorm(30), mu = 0)$p.value)
}

# 3000 replications of "run 20 tests and record all 20 p-values"
ex15_pvals <- replicate(3000, run_20_tests())
dim(ex15_pvals)
#> [1]   20 3000

# Family-wise error rate: at least one p < 0.05 per batch of 20
ex15_fwer_raw <- mean(apply(ex15_pvals < 0.05, 2, any))
ex15_fwer_raw
#> [1] 0.6453

# Theoretical FWER
1 - (1 - 0.05)^20
#> [1] 0.6415

# With Bonferroni: reject only if any p < alpha / 20 = 0.0025
ex15_fwer_bonf <- mean(apply(ex15_pvals < 0.05 / 20, 2, any))
ex15_fwer_bonf
#> [1] 0.0493
```

**Explanation:** With no correction, more than 64% of "20-test batches" produced at least one false positive, even though every test faced a true H₀. That's the whole point of multiple-testing correction: fixing α per-test is not the same as fixing it per-experiment. Bonferroni tightens each test's threshold to α/k, bringing the family-wise rate back down to ~0.05. Alternatives include Holm (more powerful than Bonferroni) and Benjamini-Hochberg (controls the false discovery rate instead of FWER), both available via `p.adjust()`.

</details>

## Complete Example: A marketing A/B test, end-to-end

A marketing team runs a live A/B test on a checkout button. Control shows the original button to 1250 users and collects 124 conversions; treatment shows the new button to 1250 users and collects 170 conversions. The team wants a proper five-step report plus a power-analysis follow-up: at this sample size, what's the chance they'd catch a true 1.5-percentage-point lift?

```r title="End-to-end A/B test and power follow-up"
# 1. State H0 and H1
# H0: conversion rate is the same in control and treatment
# H1: they differ (two-sided)

# 2. Data
conversions <- c(124, 170)
n_each      <- c(1250, 1250)

# 3 & 4. Choose prop.test(), compute statistic and p-value
ab_test <- prop.test(x = conversions, n = n_each)
ab_test
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  conversions out of n_each
#> X-squared = 7.6823, df = 1, p-value = 0.005575
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.06306137 -0.01053863
#> sample estimates:
#> prop 1 prop 2
#> 0.0992 0.1360

# 5. Decide at alpha = 0.05 and report
alpha <- 0.05
if (ab_test$p.value < alpha) "Reject H0" else "Fail to reject H0"
#> [1] "Reject H0"
```

A paper-ready write-up of this result reads:

> The new checkout button converted significantly higher than control (treatment 13.6% vs control 9.9%, difference 3.7 percentage points), χ²(1) = 7.68, p = 0.0056, 95% CI for the difference \[1.1, 6.3\] percentage points.

Now the power follow-up: suppose the true effect were a 1.5-percentage-point lift (10% to 11.5%). At n = 1250 per arm, how often would we catch it?

```r title="Power analysis for a 1.5-point lift"
# Power simulation: true rates 0.10 vs 0.115, same n as above
set.seed(1855)
ab_power <- replicate(2000, {
  s_control <- rbinom(1, size = 1250, prob = 0.100)
  s_treat   <- rbinom(1, size = 1250, prob = 0.115)
  prop.test(x = c(s_control, s_treat), n = c(1250, 1250))$p.value < 0.05
})
mean(ab_power)
#> [1] 0.332
```

At n = 1250 per arm, we'd catch a real 1.5-point lift only about 33% of the time. That's badly underpowered for a subtle effect, you'd need roughly 4,000 per arm to hit 80% power for that effect size. The A/B test above worked only because the actual lift (3.7 points) was much larger than the minimum the study was designed to catch. This is why power analysis goes *before* data collection: it tells you when "no significant result" is strong evidence of no effect, and when it just means you ran out of data.

[WARNING]
**A non-significant result is not proof of no effect.** It's evidence your study didn't have enough power to detect the effect that was actually there. Always report both the p-value and either the confidence interval or a post-hoc power estimate for the minimum effect you cared about.

## Summary

The 15 exercises above all plug into the same five-step hypothesis-testing loop. Switching tests is changing one function call, the decision rule, the CI, and the interpretation all follow the same shape.

| Exercise | Test | Dataset | Concept practised |
|---|---|---|---|
| 1 | one-sample t | iris setosa | μ test, decision rule |
| 2 | one-sided t | mtcars 4-cyl | directional alternative |
| 3 | manual t + pt() | mtcars$hp | test statistic from scratch |
| 4 | reusable function | iris | programmatic decision record |
| 5 | Welch t | iris Petal.Length | two-sample means |
| 6 | paired t | sleep | within-subject design |
| 7 | equal-var vs Welch | mtcars | variance assumption |
| 8 | prop.test / binom.test | defect rates | one-proportion test |
| 9 | prop.test (2-sample) | A/B conversions | two-proportion comparison |
| 10 | chisq.test / fisher.test | mtcars cyl × am | categorical independence |
| 11 | wilcox.test | iris Petal.Length | non-parametric two-group |
| 12 | wilcox.test paired | sleep | non-parametric paired |
| 13 | simulation | N(0, 1) | Type I error rate |
| 14 | simulation | N(μ, 1) | power curve |
| 15 | multi-test sim | 20 independent tests | family-wise error, Bonferroni |

The single most important takeaway: the same five steps (state, pick, compute, read, decide) apply to every test you will ever meet. Once that loop clicks, switching from `t.test()` to `wilcox.test()` to `chisq.test()` is changing one word.

## References

1. R Core Team, *An Introduction to R*. CRAN. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. R documentation: `?t.test`, `?prop.test`, `?chisq.test`, `?wilcox.test`, `?fisher.test`, `?binom.test`. The canonical reference for every function used in these 15 exercises, run `?t.test` at the R console.
3. Wasserstein, R.L. & Lazar, N.A., *The ASA's Statement on p-Values: Context, Process, and Purpose*. The American Statistician, 70(2), 129-133 (2016). [Link](https://doi.org/10.1080/00031305.2016.1154108)
4. Greenland, S. et al., *Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations*. European Journal of Epidemiology, 31, 337-350 (2016). [Link](https://doi.org/10.1007/s10654-016-0149-3)
5. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz)
6. Dalpiaz, D., *Applied Statistics with R*. [Link](https://book.stat420.org)
7. Cohen, J., *Statistical Power Analysis for the Behavioral Sciences*, 2nd Edition. Routledge (1988).

## Continue Learning

1. **Hypothesis Testing in R**, the conceptual walkthrough that these 15 exercises accompany. Covers H₀/H₁ setup, test statistics, the p-value definition, Type I and II errors, and choosing the right test. [Link](Hypothesis-Testing-in-R.html)
2. **Central Limit Theorem Exercises in R**, the sampling-distribution drills that justify the t-distribution and p-value mechanics. [Link](Central-Limit-Theorem-Exercises-in-R.html)
3. **Probability in R Exercises**, upstream drills on `pnorm()`, `pbinom()`, and friends, the functions you just used inside every p-value computation. [Link](Probability-in-R-Exercises.html)
