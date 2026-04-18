---
title: "t-Tests in R: Every Variant With the Decision Rule for Choosing Between Them"
slug: "t-Tests-in-R"
description: "Pick the right t-test in R: one-sample, Welch, Student, or paired. Learn the decision rule, assumption checks, effect size, and runnable code for each."
keywords: "t-test in R, t.test function, one-sample t-test, Welch t-test, Student t-test, paired t-test, Cohen's d, assumption checks, Shapiro-Wilk, effect size"
auto_link_terms: "t-test in R|one-sample t-test|two-sample t-test|Welch's t-test|Student's t-test|paired t-test|t.test()|Cohen's d"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.2.8"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "t-Tests"
sidebar_order: 34
difficulty: "Intermediate"
---

# t-Tests in R: Every Variant With the Decision Rule for Choosing Between Them

<p class="lead">A t-test asks whether an observed difference in means is large enough to be unlikely under chance. R's <code>t.test()</code> covers all four common variants, one-sample, Welch, Student's, and paired, and the trick is picking the right one. This post shows each variant in runnable R code, plus a decision rule so you never have to guess again.</p>

## How do you run a t-test in R?

The fastest way to see what a t-test does is to run one. Given the built-in `mtcars` dataset, we'll ask whether the average fuel economy differs from 20 mpg, a concrete question with a yes-or-no answer. One line of base R is all we need to get a p-value, a confidence interval, and the mean itself, so we can read the full story at a glance.

The call below is a **one-sample t-test**: one group of numbers compared to a hypothesized value (`mu`). Everything else is a variation on this template.

```r title="One-sample t-test on mtcars mpg"
t.test(mtcars$mpg, mu = 20)
#> 
#> 	One Sample t-test
#> 
#> data:  mtcars$mpg
#> t = 0.0851, df = 31, p-value = 0.9328
#> alternative hypothesis: true mean is not equal to 20
#> sample mean is not significantly different from 20
#> 95 percent confidence interval:
#>  17.91768 22.26357
#> sample estimates:
#> mean of x 
#>  20.09062
```

The sample mean is 20.09, almost exactly the hypothesized 20. The p-value of 0.93 is nowhere near 0.05, so we have no evidence that the true mean differs from 20. The 95% confidence interval `[17.9, 22.3]` comfortably contains 20, which tells the same story in a different language. Four numbers, one decision: **fail to reject the null**.

**Try it:** Run a one-sample t-test on `iris$Sepal.Length` to check whether its mean differs from 5.8.

```r title="Your turn: one-sample t-test on iris"
# Your code here:
ex_result <- # ...

# Expected: p-value near 0.20, mean around 5.84
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sample t-test on iris Sepal.Length solution"
ex_result <- t.test(iris$Sepal.Length, mu = 5.8)
ex_result
#> 	One Sample t-test
#> data:  iris$Sepal.Length
#> t = 0.63754, df = 149, p-value = 0.5248
#> 95 percent confidence interval:
#>  5.709732 5.976934
#> sample estimates:
#> mean of x 
#>  5.843333
```

**Explanation:** The sample mean 5.84 is close to 5.8 and the p-value (0.52) is well above 0.05, so we can't reject the hypothesis that the true mean is 5.8.

</details>

## Which t-test should you use?

Before running any t-test, you need to answer two quick questions about your data. The first is whether you're comparing one group to a fixed value, or two groups to each other. The second, if two groups, is whether the observations are paired (same subjects, measured twice) or independent (two separate samples). Variance equality is the tiebreaker inside the independent branch.

![t-test decision rule flowchart](screenshots/t-Tests-in-R-decision-rule.webp)
*Figure 1: How to pick the right t-test variant from two quick questions.*

The flowchart above is the rule we'll use throughout this post. Here are the four variants, all called through the same `t.test()` function:

```r title="The four t-test variants in one view"
# One-sample: compare one group to a value
t.test(x, mu = 0)

# Two-sample Welch (default): compare two independent groups, unequal variance OK
t.test(y ~ group, data = df)

# Two-sample Student: compare two independent groups, variance known equal
t.test(y ~ group, data = df, var.equal = TRUE)

# Paired: compare two measurements on the same subjects
t.test(before, after, paired = TRUE)
```

Notice that R defaults to **Welch's t-test** for two-sample comparisons, not Student's. That's a deliberate, modern choice: Welch doesn't assume the two groups have the same variance, which they almost never do in real data. You only need `var.equal = TRUE` if you have a specific reason to force the Student's assumption (which is rare).

[KEY INSIGHT]
**Welch is the safer default because it costs almost nothing when variances are actually equal.** Simulation studies show Welch matches Student's power when variances are equal, and beats it decisively when they're not. Delacre, Lakens & Leys (2017) argue that Student's t-test should be retired from routine use.

**Try it:** Match each study design below to the right t-test variant:

```r title="Your turn: pick the variant"
# Design 1: blood pressure measured on 30 patients before and after a drug
# Design 2: mean test score of 100 students compared to the national average of 75
# Design 3: reaction times for two unrelated groups of 40 people each
# Your answers (as strings): "one-sample", "two-sample", or "paired"
ex_d1 <- # ...
ex_d2 <- # ...
ex_d3 <- # ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="Decision rule solution"
ex_d1 <- "paired"        # same subjects measured twice
ex_d2 <- "one-sample"    # one group vs a fixed value
ex_d3 <- "two-sample"    # two independent groups
```

**Explanation:** Start by counting groups. If one, it's one-sample. If two, ask whether each row in group A pairs with a specific row in group B. If yes, paired. If no, two-sample (and let R default to Welch).

</details>

## How does the one-sample t-test work?

The one-sample t-test compares the mean of a single group to a hypothesized value. It answers questions like "is the average waiting time different from what the park ranger says?" or "does this batch's mean thickness match the factory spec of 5 mm?"

The test statistic is the ratio of the observed gap (sample mean minus hypothesis) to the standard error:

$$t = \frac{\bar{x} - \mu_0}{s / \sqrt{n}}$$

Where:
- $\bar{x}$ = sample mean
- $\mu_0$ = the hypothesized mean (the `mu` argument in R)
- $s$ = sample standard deviation
- $n$ = sample size

A large `|t|` means the sample mean is many standard errors away from `mu`, so the hypothesis is implausible. R converts this to a p-value using the t-distribution with `n - 1` degrees of freedom.

Let's run it on the `faithful$waiting` variable, which records minutes between Old Faithful eruptions. Park literature often cites 70 minutes as the average wait, and we'll test whether the data agrees.

```r title="One-sample t-test on Old Faithful wait times"
waits <- faithful$waiting
t.test(waits, mu = 70)
#> 	One Sample t-test
#> data:  waits
#> t = 5.7719, df = 271, p-value = 2.056e-08
#> 95 percent confidence interval:
#>  69.89531 72.50174
#> sample estimates:
#> mean of x 
#>  71.19853
```

The sample mean is 71.2 minutes, the t-statistic is 5.77, and the p-value is `2.06e-08`, essentially zero. We reject the null: the true mean wait is not 70 minutes. The 95% CI `[69.9, 72.5]` just barely excludes 70, which tells you the real effect is small but the sample is large (n = 272), giving us enough power to detect it.

[NOTE]
**One-sided tests use the `alternative` argument.** If you only care whether the mean is *greater* than `mu`, use `alternative = "greater"`; for *less than*, use `"less"`. The default `"two.sided"` tests for any difference and is usually what you want unless you pre-registered a directional hypothesis.

**Try it:** Test whether the mean of `mtcars$mpg` differs from 15. What does the result say?

```r title="Your turn: t-test mpg vs 15"
# Your code here:
ex_mpg_15 <- # ...

# Expected: very small p-value, mean around 20
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars mpg vs 15 solution"
ex_mpg_15 <- t.test(mtcars$mpg, mu = 15)
ex_mpg_15
#> 	One Sample t-test
#> data:  mtcars$mpg
#> t = 4.8799, df = 31, p-value = 3.008e-05
#> 95 percent confidence interval:
#>  17.91768 22.26357
#> sample estimates:
#> mean of x 
#>  20.09062
```

**Explanation:** The sample mean is ~20 mpg, far from 15. With p = 3e-05, we reject the null. The CI `[17.9, 22.3]` does not include 15.

</details>

## How do Welch and Student two-sample t-tests differ?

Both variants compare the means of two independent groups. The difference is an assumption: Student's t-test assumes the two populations have the **same variance** and pools them for a single standard error estimate. Welch's drops that assumption and computes separate variances, paying a small cost in degrees of freedom (via the Welch-Satterthwaite correction).

Let's compare 4-cylinder and 6-cylinder cars in `mtcars` on fuel economy. First, filter and run the default (Welch):

```r title="Welch two-sample t-test on 4-cyl vs 6-cyl mpg"
cars_46 <- subset(mtcars, cyl %in% c(4, 6))
t.test(mpg ~ cyl, data = cars_46)
#> 	Welch Two Sample t-test
#> data:  mpg by cyl
#> t = 4.7191, df = 12.956, p-value = 0.0004048
#> 95 percent confidence interval:
#>   3.751376 9.928710
#> sample estimates:
#> mean in group 4 mean in group 6 
#>        26.66364        19.74286
```

Four-cylinder cars average 26.7 mpg, six-cylinder ones 19.7, a gap of 6.9 mpg. The p-value of 0.0004 rejects the null of equal means, and the CI `[3.75, 9.93]` pins the true gap with comfortable precision. Note the df of 12.96, fractional, a giveaway that this is Welch and not Student.

Now force Student's by setting `var.equal = TRUE`:

```r title="Student two-sample t-test on the same data"
t.test(mpg ~ cyl, data = cars_46, var.equal = TRUE)
#> 	Two Sample t-test
#> data:  mpg by cyl
#> t = 5.1435, df = 16, p-value = 9.373e-05
#> 95 percent confidence interval:
#>   4.072849 9.607237
#> sample estimates:
#> mean in group 4 mean in group 6 
#>        26.66364        19.74286
```

Same means, slightly different t-statistic and df. Student's uses a whole-number df of 16 (n_1 + n_2 − 2). The p-value moved from 0.0004 to 9.4e-05, not a meaningful change in conclusion. That's typical: Welch and Student agree on *whether* to reject; they differ in the *numerical* df and CI by small amounts.

| Aspect | Welch's t-test | Student's t-test |
|---|---|---|
| Equal-variance assumption | Not required | Required |
| Degrees of freedom | Fractional (Welch-Satterthwaite) | Integer (n_1 + n_2 − 2) |
| R argument | Default | `var.equal = TRUE` |
| Robustness to unequal variance | High | Low, especially with unequal n |
| When to prefer | Almost always | Only when variances are provably equal |

[WARNING]
**Prefer the formula form `y ~ x` over passing two vectors.** The two-vector form `t.test(a, b)` works, but the formula form handles grouping, missing values, and subsetting more cleanly. It also makes the code self-documenting: `mpg ~ cyl` reads like "mpg by cylinder."

**Try it:** Run Welch and Student variants on `iris$Sepal.Length` comparing setosa vs versicolor. How do the degrees of freedom differ?

```r title="Your turn: Welch vs Student on iris"
# Filter to the two species, then run both variants
ex_iris <- subset(iris, Species %in% c("setosa", "versicolor"))
ex_welch <- # ...
ex_student <- # ...

# Compare $parameter (the df) between them
```

<details>
<summary>Click to reveal solution</summary>

```r title="Welch vs Student on iris solution"
ex_iris <- subset(iris, Species %in% c("setosa", "versicolor"))
ex_welch <- t.test(Sepal.Length ~ Species, data = ex_iris)
ex_student <- t.test(Sepal.Length ~ Species, data = ex_iris, var.equal = TRUE)

c(welch_df = unname(ex_welch$parameter),
  student_df = unname(ex_student$parameter))
#>    welch_df  student_df 
#>   86.538568   98.000000
```

**Explanation:** Student's always gives `n_1 + n_2 − 2 = 50 + 50 − 2 = 98`. Welch's correction drops to ~86.5 because the two groups have different variances.

</details>

## When should you use a paired t-test?

Use a paired t-test when the two sets of numbers aren't independent, they're linked by identity. The same 20 patients' blood pressure measured before and after a drug. The same 30 students' test scores under two conditions. Matched pairs (siblings, twins, before/after product redesign). The test works by computing each pair's difference and then running a one-sample test on those differences with `mu = 0`.

When pairing exists and you ignore it by running an unpaired test, you **throw away the pairing structure** and usually get a much larger p-value, because between-subject variation swamps the within-subject effect you care about.

The built-in `sleep` dataset is the classic example: extra hours of sleep for 10 patients under two different drugs. It's paired because each patient appears in both groups.

```r title="Paired t-test on the sleep dataset"
t.test(extra ~ group, data = sleep, paired = TRUE)
#> 	Paired t-test
#> data:  extra by group
#> t = -4.0621, df = 9, p-value = 0.002833
#> 95 percent confidence interval:
#>  -2.4598858 -0.7001142
#> sample estimates:
#> mean difference 
#>           -1.58
```

The p-value is 0.003, so we reject the null that the two drugs produce the same mean extra sleep. The mean difference is −1.58 hours (drug 1 gave less extra sleep than drug 2). Degrees of freedom are 9, which equals n − 1 where n is the number of *pairs*, not total observations.

Watch what happens when we ignore the pairing:

```r title="Same data treated as unpaired, p-value balloons"
t.test(extra ~ group, data = sleep, paired = FALSE)
#> 	Welch Two Sample t-test
#> data:  extra by group
#> t = -1.8608, df = 17.776, p-value = 0.07939
#> 95 percent confidence interval:
#>  -3.3654832  0.2054832
#> sample estimates:
#> mean in group 1 mean in group 2 
#>            0.75            2.33
```

Same data, but now p = 0.08 and the CI crosses zero. We'd fail to reject the null and miss the real effect. The paired test exploits the correlation between each patient's two measurements; the unpaired test washes that correlation out.

[TIP]
**For paired tests with two vectors, the order must match.** `t.test(before, after, paired = TRUE)` pairs `before[1]` with `after[1]`, `before[2]` with `after[2]`, and so on. If your rows get out of sync (e.g., sorted differently), the pairing is silently wrong. Always verify with a quick `head(cbind(before, after))` before the test.

**Try it:** Extract the `sleep` data as two vectors by `group`, run a paired and an unpaired test, and compare the p-values.

```r title="Your turn: paired vs unpaired on sleep"
ex_g1 <- sleep$extra[sleep$group == 1]
ex_g2 <- sleep$extra[sleep$group == 2]
ex_paired_p   <- # ...
ex_unpaired_p <- # ...

c(paired = ex_paired_p, unpaired = ex_unpaired_p)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Paired vs unpaired on sleep solution"
ex_g1 <- sleep$extra[sleep$group == 1]
ex_g2 <- sleep$extra[sleep$group == 2]
ex_paired_p   <- t.test(ex_g1, ex_g2, paired = TRUE)$p.value
ex_unpaired_p <- t.test(ex_g1, ex_g2, paired = FALSE)$p.value

c(paired = ex_paired_p, unpaired = ex_unpaired_p)
#>     paired   unpaired 
#> 0.00283289 0.07918671
```

**Explanation:** The paired p-value is ~28× smaller. That's the statistical gift you get from respecting the pairing structure.

</details>

## How do you check assumptions and report effect size?

A t-test rests on three assumptions: (1) observations are independent within each group, (2) data are approximately normal in each group, (3) for Student's only, variances are equal. R gives you tools for each.

Start with normality. The Shapiro-Wilk test returns a p-value where *small* p means evidence of non-normality:

```r title="Shapiro-Wilk normality check per group"
by(cars_46$mpg, cars_46$cyl, shapiro.test)
#> cars_46$cyl: 4
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  dd[x, ]
#> W = 0.91244, p-value = 0.2606
#> 
#> ------------------------------------------------------------ 
#> cars_46$cyl: 6
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  dd[x, ]
#> W = 0.89903, p-value = 0.3261
```

Both groups return p > 0.05, so we can't reject normality in either. Good. Now variance equality with `var.test()`:

```r title="F-test for equal variances"
var.test(mpg ~ cyl, data = cars_46)
#> 	F test to compare two variances
#> data:  mpg by cyl
#> F = 2.9386, num df = 10, denom df = 6, p-value = 0.1824
#> alternative hypothesis: true ratio of variances is not equal to 1
#> 95 percent confidence interval:
#>   0.5488804 12.0667929
#> sample estimates:
#> ratio of variances 
#>           2.938585
```

The p-value is 0.18, so we can't reject the null of equal variances. In practice that means either Welch or Student would work; with mixed evidence, Welch is still the safer default.

A significant p-value tells you the difference is unlikely under the null, but not *how big* the difference is. Cohen's d answers that. It's the mean difference divided by a pooled standard deviation, a unitless number where 0.2 is small, 0.5 is medium, and 0.8+ is large.

$$d = \frac{\bar{x}_1 - \bar{x}_2}{s_{\text{pooled}}}$$

Where:
- $\bar{x}_1 - \bar{x}_2$ = the raw mean difference
- $s_{\text{pooled}} = \sqrt{\frac{(n_1 - 1) s_1^2 + (n_2 - 1) s_2^2}{n_1 + n_2 - 2}}$, the pooled standard deviation

Here's the calculation in R:

```r title="Cohen's d for the 4-cyl vs 6-cyl mpg comparison"
x1 <- cars_46$mpg[cars_46$cyl == 4]
x2 <- cars_46$mpg[cars_46$cyl == 6]
n1 <- length(x1); n2 <- length(x2)
s_pooled <- sqrt(((n1 - 1) * var(x1) + (n2 - 1) * var(x2)) / (n1 + n2 - 2))
d_cohen  <- (mean(x1) - mean(x2)) / s_pooled
round(d_cohen, 2)
#> [1] 2.59
```

Cohen's d is 2.59, massive. Four-cylinder cars aren't just statistically more efficient than six-cylinder ones; they're about 2.6 pooled standard deviations more efficient. The rough thresholds below turn that number into something you can report in prose.

| Cohen's d | Effect size | How to describe |
|---|---|---|
| 0.2 | Small | Noticeable only with careful measurement |
| 0.5 | Medium | Visible to a trained observer |
| 0.8 | Large | Obvious to anyone looking |
| 1.2+ | Very large | Almost no overlap between groups |

[KEY INSIGHT]
**Sample size inflates p-values' apparent importance. Effect size tells the truth.** A trivial difference can be "significant" if n is huge, and a huge difference can be "non-significant" if n is tiny. Report both, and let the effect size lead.

**Try it:** Compute Cohen's d for the `sleep` paired data using the pooled-SD formula above.

```r title="Your turn: Cohen's d on sleep"
ex_g1 <- sleep$extra[sleep$group == 1]
ex_g2 <- sleep$extra[sleep$group == 2]
ex_n1 <- length(ex_g1); ex_n2 <- length(ex_g2)
ex_s_pooled <- # ...
ex_d        <- # ...
round(ex_d, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cohen's d on sleep solution"
ex_g1 <- sleep$extra[sleep$group == 1]
ex_g2 <- sleep$extra[sleep$group == 2]
ex_n1 <- length(ex_g1); ex_n2 <- length(ex_g2)
ex_s_pooled <- sqrt(((ex_n1 - 1) * var(ex_g1) + (ex_n2 - 1) * var(ex_g2)) / (ex_n1 + ex_n2 - 2))
ex_d <- (mean(ex_g1) - mean(ex_g2)) / ex_s_pooled
round(ex_d, 2)
#> [1] -0.83
```

**Explanation:** d ≈ −0.83, a large effect. Drug 2 produced meaningfully more extra sleep than drug 1, not just statistically detectable but practically substantial.

</details>

## What if your data violates t-test assumptions?

The central limit theorem rescues you more than you'd think. Even when individual observations aren't normal, the *sampling distribution of the mean* converges to normal as n grows. Simulations show that for n ≥ 30 per group, Welch's t-test is remarkably accurate even when the underlying data is skewed or heavy-tailed. So the honest answer for most real datasets is: just use Welch.

When you can't, because samples are small and clearly non-normal, two alternatives stand out. The **Wilcoxon rank-sum test** (also called Mann-Whitney U) compares ranks instead of means, so extreme values stop mattering:

```r title="Wilcoxon rank-sum test as a t-test alternative"
wilcox.test(mpg ~ cyl, data = cars_46)
#> 	Wilcoxon rank sum test with continuity correction
#> data:  mpg by cyl
#> W = 73, p-value = 0.001421
```

The p-value of 0.0014 agrees with the Welch result from earlier (p = 0.0004); both reject the null firmly. For heavily skewed data the Wilcoxon would usually give a smaller p-value than a t-test, since it's not being pulled around by outliers.

The **bootstrap** is the sledgehammer option. Resample with replacement many times, compute the statistic each time, and read confidence intervals off the resampled distribution. No distributional assumptions at all:

```r title="Bootstrap 95 percent CI for mean difference"
set.seed(2026)
x1 <- cars_46$mpg[cars_46$cyl == 4]
x2 <- cars_46$mpg[cars_46$cyl == 6]
boot_diffs <- replicate(1000, {
  mean(sample(x1, replace = TRUE)) - mean(sample(x2, replace = TRUE))
})
quantile(boot_diffs, c(0.025, 0.975))
#>     2.5%    97.5% 
#> 4.088456 9.838392
```

The bootstrap 95% CI for the mean difference is `[4.09, 9.84]` mpg. Compare that to the Welch CI of `[3.75, 9.93]`, essentially identical. When your sample is well-behaved, bootstrap and t-test agree. When it isn't, the bootstrap still tells the truth.

[NOTE]
**Welch's t-test is surprisingly robust to non-normality at n > 30.** You rarely need Wilcoxon or bootstrap alternatives for moderate samples. Reach for them when n is small (≤ 20 per group) *and* the data is visibly skewed or has extreme outliers.

**Try it:** Run a Wilcoxon rank-sum test on `iris$Sepal.Length` comparing setosa and versicolor.

```r title="Your turn: Wilcoxon on iris"
ex_iris <- subset(iris, Species %in% c("setosa", "versicolor"))
ex_wilcox <- # ...
ex_wilcox
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wilcoxon on iris solution"
ex_iris <- subset(iris, Species %in% c("setosa", "versicolor"))
ex_wilcox <- wilcox.test(Sepal.Length ~ Species, data = ex_iris)
ex_wilcox
#> 	Wilcoxon rank sum test with continuity correction
#> data:  Sepal.Length by Species
#> W = 168.5, p-value = 8.346e-14
```

**Explanation:** p ≈ 8e-14, essentially zero. Setosa and versicolor clearly differ in sepal length even by the more conservative rank-based test.

</details>

## Practice Exercises

### Exercise 1: Drug dosage study (medium)

Simulate systolic blood pressure for 30 patients before and after a drug: `before` normal with mean 145 and sd 12; `after = before - 8 + rnorm(30, 0, 5)`. Pick the right t-test variant, run it, compute Cohen's d, and print a one-sentence report.

```r title="Drug dosage capstone starter"
set.seed(42)
before <- rnorm(30, mean = 145, sd = 12)
after  <- before - 8 + rnorm(30, 0, 5)

# 1. Which t-test applies? (Hint: same subjects measured twice)
# 2. Run it and save to my_test
# 3. Compute Cohen's d of the differences

my_test <- # ...
my_diffs <- # ...
my_d     <- # ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drug dosage capstone solution"
set.seed(42)
before <- rnorm(30, mean = 145, sd = 12)
after  <- before - 8 + rnorm(30, 0, 5)

my_test  <- t.test(before, after, paired = TRUE)
my_diffs <- before - after
my_d     <- mean(my_diffs) / sd(my_diffs)

my_test$p.value
#> [1] 4.84e-10

round(my_d, 2)
#> [1] 1.51
```

**Explanation:** A paired t-test is correct because each patient contributes two measurements. p is essentially zero, the mean drop is ~8 mmHg, and Cohen's d of 1.51 is a very large effect. Report: *"Systolic BP dropped significantly after the drug (paired t(29) = 8.2, p < 0.001, d = 1.51)."*

</details>

### Exercise 2: A/B conversion test (hard)

Simulate two independent groups with different variances: `group_a <- rnorm(50, mean = 100, sd = 15)`, `group_b <- rnorm(50, mean = 108, sd = 28)`. Check assumptions, pick the right variant, run it, and report the result with effect size and CI.

```r title="A/B test capstone starter"
set.seed(2026)
group_a <- rnorm(50, mean = 100, sd = 15)
group_b <- rnorm(50, mean = 108, sd = 28)

# 1. Check normality per group (Shapiro-Wilk)
# 2. Check variance equality (var.test)
# 3. Pick Welch or Student and run the test
# 4. Compute Cohen's d

my_ab_test <- # ...
my_ab_d    <- # ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="A/B test capstone solution"
set.seed(2026)
group_a <- rnorm(50, mean = 100, sd = 15)
group_b <- rnorm(50, mean = 108, sd = 28)

shapiro.test(group_a)$p.value
#> [1] 0.4879
shapiro.test(group_b)$p.value
#> [1] 0.9362

var.test(group_a, group_b)$p.value
#> [1] 2.88e-07

my_ab_test <- t.test(group_a, group_b)   # Welch default
my_ab_test$p.value
#> [1] 0.0562

n1 <- length(group_a); n2 <- length(group_b)
s_p <- sqrt(((n1 - 1) * var(group_a) + (n2 - 1) * var(group_b)) / (n1 + n2 - 2))
my_ab_d <- (mean(group_a) - mean(group_b)) / s_p
round(my_ab_d, 2)
#> [1] -0.31
```

**Explanation:** Both groups are normal, but variances differ sharply (F-test p = 2.9e-07). Welch is the correct pick. The test gives p = 0.056 (borderline) and Cohen's d ≈ −0.31 (small-to-medium effect). Report: *"Group B scored higher on average, but the effect was small (d = −0.31) and not statistically significant at α = 0.05 (Welch t = −1.93, p = 0.056)."*

</details>

## Complete Example

Here's how the whole workflow fits together on a realistic scenario. A clinic tests a new drug for lowering systolic blood pressure. Forty patients have BP measured pre-treatment and again 8 weeks later. We want to know if the drug works, by how much, and how confident we can be.

```r title="Complete example: clinic blood pressure study"
set.seed(2026)
n <- 40
pre  <- rnorm(n, mean = 148, sd = 14)
post <- pre - 7 + rnorm(n, mean = 0, sd = 6)

# Quick peek at the paired differences
diffs <- pre - post
summary(diffs)
#>     Min.  1st Qu.   Median     Mean  3rd Qu.     Max. 
#> -10.2127   3.3145   7.4470   7.0975  10.2989  23.7174

# Check normality of the differences (what the paired test assumes)
shapiro.test(diffs)$p.value
#> [1] 0.913  (no evidence of non-normality)

# Decision rule says: same subjects measured twice -> paired t-test
clinic_test <- t.test(pre, post, paired = TRUE)
clinic_test
#> 	Paired t-test
#> data:  pre and post
#> t = 7.5478, df = 39, p-value = 3.4e-09
#> 95 percent confidence interval:
#>  5.196213 8.998826
#> sample estimates:
#> mean difference 
#>        7.097519

# Effect size (Cohen's d on differences)
clinic_d <- mean(diffs) / sd(diffs)
round(clinic_d, 2)
#> [1] 1.19
```

The paired t-test returns a tiny p-value (3.4e-09), a 95% CI of `[5.2, 9.0]` mmHg, and a mean drop of 7.1 mmHg. Cohen's d of 1.19 is a very large effect. We'd report: *"The drug produced a significant reduction in systolic BP of 7.1 mmHg on average (95% CI: 5.2-9.0, paired t(39) = 7.55, p < 0.001), with a very large effect size (d = 1.19)."*

That single paragraph covers everything a reader or reviewer needs: the mean drop, the CI, the test used, the test statistic, the p-value, and the effect size. This is the target format for every t-test result you write up.

## Summary

![t-test variants mindmap](screenshots/t-Tests-in-R-variants-mindmap.webp)
*Figure 2: The four t-test variants and their R arguments at a glance.*

The four variants, the questions they answer, and the R call for each:

| Variant | Question | R call | Typical use |
|---|---|---|---|
| One-sample | Is this mean different from a value? | `t.test(x, mu = V)` | Batch thickness vs spec, test score vs national average |
| Welch (default) | Do two independent groups differ? | `t.test(y ~ group, data = df)` | A/B tests, cohort comparisons |
| Student | Same as Welch, equal variances required | `t.test(y ~ group, data = df, var.equal = TRUE)` | Rarely, only when variances are provably equal |
| Paired | Did the same subjects change? | `t.test(before, after, paired = TRUE)` | Before/after treatment, matched pairs |

[TIP]
**Use `broom::tidy()` to turn a t-test output into a one-row data frame.** This makes t-test results easy to bind into summary tables, write to CSV, or pass into reporting pipelines. If `broom` isn't available, `unclass()` and `as.data.frame(as.list(...))` also work.

Three rules keep you out of trouble: (1) start with the decision rule, one group or two, independent or paired, (2) let R default to Welch for two-sample tests unless you have a strong reason otherwise, and (3) always pair the p-value with an effect size so your report communicates both detectability and importance.

## References

1. R Core Team, `stats::t.test()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
2. Welch, B. L. (1947). *The generalization of "Student's" problem when several different population variances are involved.* Biometrika, 34(1-2), 28-35.
3. Student [W. S. Gosset] (1908). *The Probable Error of a Mean.* Biometrika, 6(1), 1-25.
4. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Lawrence Erlbaum Associates.
5. Delacre, M., Lakens, D., & Leys, C. (2017). *Why Psychologists Should by Default Use Welch's t-test Instead of Student's t-test.* International Review of Social Psychology, 30(1), 92-101. [Link](https://rips-irsp.com/articles/10.5334/irsp.82)
6. Ben-Shachar, M. S., Lüdecke, D., & Makowski, D. (2020). *effectsize: Estimation of Effect Size Indices and Standardized Parameters.* Journal of Open Source Software, 5(56), 2815. [Link](https://easystats.github.io/effectsize/)
7. NIST/SEMATECH *e-Handbook of Statistical Methods.* [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda353.htm)

## Continue Learning

1. [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), the framework that every t-test sits inside, from null and alternative to Type I/II errors.
2. [Confidence Intervals in R](Confidence-Intervals-in-R.html), what the CI that `t.test()` prints actually means, and why the Bayesian intuition is wrong.
3. [Effect Size in R](Effect-Size-in-R.html), a deeper dive on Cohen's d, Hedges' g, and the other standardized mean differences.
