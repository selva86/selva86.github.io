---
title: "Nonparametric Tests Exercises in R: 10 Practice Problems, Solved Step-by-Step"
slug: Nonparametric-Tests-Exercises-in-R
description: "10 nonparametric tests exercises in R with runnable solutions: Wilcoxon signed-rank, Mann-Whitney U, Kruskal-Wallis, post-hoc, effect sizes, and tie handling."
keywords: "nonparametric tests exercises in R, Wilcoxon exercises R, Mann-Whitney U exercises, Kruskal-Wallis practice problems, wilcox.test examples, kruskal.test R, rank-sum test exercises, nonparametric effect size R"
auto_link_terms: "nonparametric tests exercises|nonparametric practice problems|Wilcoxon exercises|Mann-Whitney exercises|Kruskal-Wallis exercises|rank-sum exercises|signed-rank exercises|nonparametric test solutions"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.6
post_type: EX
sidebar_title: "Nonparametric Exercises (10 problems)"
fr_parent: Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html
difficulty: Intermediate
---

# Nonparametric Tests Exercises in R: 10 Practice Problems, Solved Step-by-Step

<p class="lead">These 10 nonparametric tests exercises in R walk you through Wilcoxon signed-rank, Mann-Whitney U, and Kruskal-Wallis with runnable solutions, covering one-sample, paired, and multi-group layouts plus post-hoc pairs, effect sizes, and tie handling so you can pick the right test and defend the p-value.</p>

## Which nonparametric test matches your question setup?

Three rank-based tests cover most real use. Which one fires depends only on the data layout: how many groups you have, and whether measurements are paired. Here are the three calls on built-in R data in a single block so you can see the shapes side by side before the 10 exercises begin.

```r title="Three nonparametric tests side by side"
# One-sample signed-rank: is mtcars wt median different from 3.2?
os_res <- wilcox.test(mtcars$wt, mu = 3.2)

# Mann-Whitney U (two independent groups): sleep data, two drugs
ms_res <- wilcox.test(extra ~ group, data = sleep)

# Kruskal-Wallis (3+ groups): iris Sepal.Width across 3 species
ks_res <- kruskal.test(Sepal.Width ~ Species, data = iris)

c(one_sample_p = os_res$p.value,
  mann_whitney_p = ms_res$p.value,
  kruskal_wallis_p = ks_res$p.value)
#>    one_sample_p  mann_whitney_p kruskal_wallis_p
#>    7.459318e-01    6.932224e-02    1.569282e-14
```

Each call answers a different question. The one-sample call asks whether an overall median matches a reference value. The Mann-Whitney call asks whether two independent groups come from the same distribution. The Kruskal-Wallis call asks the same question for three or more groups. Same family, three layouts, three very different p-values.

| Your setup | R call | When to use |
|---|---|---|
| One group vs a reference value | `wilcox.test(x, mu = value)` | Median comparison on a skewed or ordinal sample |
| Two independent groups | `wilcox.test(y ~ group, data = d)` | Different subjects in each group, non-normal outcome |
| Two paired measurements | `wilcox.test(y ~ group, data = d, paired = TRUE)` | Same subjects measured twice (before/after, matched pairs) |
| Three or more groups | `kruskal.test(y ~ group, data = d)` | Multi-group comparison when ANOVA assumptions fail |

[KEY INSIGHT]
**Mann-Whitney U and the Wilcoxon rank-sum test are the same test under two names.** R's `wilcox.test()` implements both. The statistic it prints (`W`) equals Mann-Whitney's U for the first group. You do not need two functions for two papers that used different labels.

**Try it:** You have two vectors `before` and `after` holding 10 patients' cholesterol measured twice. Which flag does `wilcox.test()` need to treat them as paired rather than independent? Set `ex_flag` to `"paired"` or `"mu"`.

```r title="Your turn: pick the flag"
# Same 10 patients, two measurements each
before <- c(210, 198, 225, 240, 215, 200, 220, 235, 205, 230)
after  <- c(200, 190, 215, 225, 208, 195, 210, 220, 200, 220)

ex_flag <- "___"   # replace with "paired" or "mu"
ex_flag
#> Expected: "paired"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pick the flag solution"
ex_flag <- "paired"
wilcox.test(before, after, paired = TRUE)$p.value
#> [1] 0.005086263
```

**Explanation:** Each subject contributes two linked measurements. `paired = TRUE` tells `wilcox.test()` to subtract within-subject, then run a signed-rank test on the differences. The `mu` flag is for one-sample tests against a reference value, which is a different question.

</details>

## How do you read and report a Wilcoxon or Kruskal-Wallis result?

The print block from `wilcox.test()` is friendly, but every number in it is also accessible by name. For reports and pipelines, pull the fields directly: `statistic` (the W or H value), `p.value`, and for Kruskal-Wallis, `parameter` (degrees of freedom). That lets you drop values straight into text with `sprintf`.

```r title="Extract fields from a rank-sum result"
# Mann-Whitney comparing iris petal lengths: setosa vs versicolor
sub <- subset(iris, Species %in% c("setosa", "versicolor"))
rs_res <- wilcox.test(Petal.Length ~ Species, data = sub)

# Pull the fields you actually need
rs_res$statistic
#>    W
#> 0
rs_res$p.value
#> [1] 8.035846e-18

# Format a one-line report
sprintf("Mann-Whitney U: W = %.0f, p = %.3g",
        rs_res$statistic, rs_res$p.value)
#> [1] "Mann-Whitney U: W = 0, p = 8.04e-18"
```

A W of zero means every setosa observation ranked below every versicolor observation. That is a complete, non-overlapping separation, and the p-value of roughly $8 \times 10^{-18}$ is the test's way of saying there is no scenario where these two species share a distribution of petal length. Pull the fields you need, then hand-format them. This is how you keep statistical reporting reproducible instead of screenshot-based.

[NOTE]
**`wilcox.test()` and `kruskal.test()` drop NA values silently.** If your input has missing data, compare `length(x)` before and after removing NAs so your reported sample size matches the test's effective sample size. Hidden NAs are a top source of "why does my p-value not match the paper?" questions.

**Try it:** Run Kruskal-Wallis on iris `Sepal.Width` by `Species` and pull only the p-value formatted to 4 decimal places. Store the formatted string in `ex_kw_p`.

```r title="Your turn: extract a KW p-value"
# Run the test and extract just the p-value, rounded to 4 decimals
ex_kw_p <- "___"   # replace with your formatted string
ex_kw_p
#> Expected: "0.0000"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract KW p-value solution"
kw <- kruskal.test(Sepal.Width ~ Species, data = iris)
ex_kw_p <- sprintf("%.4f", kw$p.value)
ex_kw_p
#> [1] "0.0000"
```

**Explanation:** `kw$p.value` returns the raw numeric. `sprintf("%.4f", ...)` rounds to 4 decimals as a character string, which is what reports and Shiny apps usually want. The reported value of 0.0000 means the raw p-value is below $5 \times 10^{-5}$, so the three species clearly differ in sepal width.

</details>

## Practice Exercises

Ten exercises follow, ordered by progressive difficulty. Each one runs in the same browser R session, so variables from earlier exercises stay in memory. Variable names are prefixed with `ex1_`, `ex2_`, and so on, so your exercise work does not clash with the teaching examples above.

### Exercise 1: One-sample Wilcoxon signed-rank against a claimed median

An automaker claims the median weight of mid-size cars in the mtcars dataset is 3.2 (thousand pounds). Test whether the data disagrees with that claim at the 5% level. Extract the p-value and decide whether to reject.

```r title="Exercise 1 starter: one-sample signed-rank"
# Hint: wilcox.test(x, mu = ...)
# Save the whole result to ex1_res, then print ex1_res$p.value

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_res <- wilcox.test(mtcars$wt, mu = 3.2)
ex1_res$p.value
#> [1] 0.7459318
```

**Explanation:** The p-value of 0.75 is nowhere near 0.05, so there is no evidence against the claim. The signed-rank test here asks whether the pseudo-median of mtcars weights differs from 3.2, because the Wilcoxon does not require symmetry around the true median, the reference point is technically the pseudo-median. This distinction matters only for skewed distributions.

</details>

### Exercise 2: Mann-Whitney U on two independent groups

Does petal length differ between the `setosa` and `versicolor` species in `iris`? Run a two-sided Mann-Whitney U test. Save the result to `ex2_res` and report both the W statistic and the p-value.

```r title="Exercise 2 starter: two independent groups"
# Hint: subset iris to two species, then wilcox.test(Petal.Length ~ Species, data = ...)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_sub <- subset(iris, Species %in% c("setosa", "versicolor"))
ex2_res <- wilcox.test(Petal.Length ~ Species, data = ex2_sub)
c(W = unname(ex2_res$statistic), p = ex2_res$p.value)
#>            W            p
#> 0.000000e+00 8.035846e-18
```

**Explanation:** W = 0 means every setosa petal ranked below every versicolor petal, complete separation. The p-value of roughly $8 \times 10^{-18}$ is as small as it gets. In practical language: if these two species had the same petal-length distribution, you would not expect to see zero overlap in 100 samples, let alone the first one.

</details>

### Exercise 3: One-tailed Mann-Whitney (direction matters)

Building on Exercise 2, now test the specific hypothesis that versicolor petals are *longer* than setosa petals. Use `alternative = "greater"`. Mind the order of factor levels when interpreting "greater".

[TIP]
**`alternative` has three values: `"two.sided"` (default), `"less"`, `"greater"`.** For a formula interface like `Petal.Length ~ Species`, "greater" means the *first* factor level's distribution tends to be greater than the second. Check the order with `levels()` or you will mis-sign your conclusion.

```r title="Exercise 3 starter: one-tailed rank-sum"
# Hint: check levels(ex2_sub$Species), then add alternative = "greater" or "less"
# Save as ex3_res

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
# setosa is level 1, versicolor is level 2
# To test "versicolor > setosa", we need "less" because level 1 (setosa) < level 2 (versicolor)
ex3_res <- wilcox.test(Petal.Length ~ Species, data = ex2_sub,
                       alternative = "less")
ex3_res$p.value
#> [1] 4.017923e-18
```

**Explanation:** `levels(ex2_sub$Species)` puts setosa first. Testing `alternative = "less"` on the formula means "first level's distribution is less than second level's", which is the same as "versicolor petals are longer than setosa petals". The one-tailed p-value is exactly half the two-sided p-value from Exercise 2, as expected when the effect aligns with the hypothesis direction.

</details>

### Exercise 4: Paired Wilcoxon signed-rank (before/after)

The built-in `sleep` dataset records 10 patients who each tried two different sleep drugs. The `extra` column is extra hours of sleep, and `group` is the drug (1 or 2). Run a paired signed-rank test to see whether drug 1 and drug 2 differ.

```r title="Exercise 4 starter: paired test"
# Hint: the sleep data has the same 10 IDs in each group, paired = TRUE
# Save as ex4_res

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_res <- wilcox.test(extra ~ group, data = sleep, paired = TRUE)
c(V = unname(ex4_res$statistic), p = ex4_res$p.value)
#>           V           p
#> 0.000000000 0.009090801
```

**Explanation:** V = 0 here is the signed-rank equivalent of W = 0: every within-patient difference pointed the same direction (drug 2 gave more extra sleep for every patient). The paired p-value of 0.009 rejects equality at the 1% level. An unpaired Mann-Whitney on the same data would give a much larger p-value because it throws away the within-subject pairing.

</details>

### Exercise 5: Tie handling and exact vs approximate p-values

Construct a small dataset with deliberate ties and run a rank-sum test. R will print a warning ("cannot compute exact p-value with ties"). Re-run with `exact = FALSE, correct = TRUE` to get a clean approximate p-value instead.

[WARNING]
**"Cannot compute exact p-value with ties" means the default exact algorithm fell back to the normal approximation silently.** The p-value you get is valid, but the warning signals that tied ranks exist. Rerun with `exact = FALSE, correct = TRUE` to make the approximation explicit and the warning go away.

```r title="Exercise 5 starter: ties produce a warning"
# Hint: make two small vectors with some repeated values
ex5_tied <- list(
  a = c(1, 2, 2, 3, 4),
  b = c(2, 3, 3, 4, 5)
)
# Run wilcox.test on ex5_tied$a vs ex5_tied$b and observe the warning
# Then rerun with exact = FALSE, correct = TRUE

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_tied <- list(
  a = c(1, 2, 2, 3, 4),
  b = c(2, 3, 3, 4, 5)
)
# Clean approximate p-value, no warning
ex5_res <- wilcox.test(ex5_tied$a, ex5_tied$b,
                       exact = FALSE, correct = TRUE)
ex5_res$p.value
#> [1] 0.1730173
```

**Explanation:** Ties break the exact permutation distribution that `wilcox.test()` uses by default, so R silently switches to a normal approximation and warns you. Passing `exact = FALSE` makes the approximation explicit and the `correct = TRUE` applies a continuity correction of 0.5 to the numerator, which slightly widens the p-value. In this tiny sample, p = 0.17 fails to reject equality, no surprise at n = 5 per group.

</details>

### Exercise 6: Kruskal-Wallis on 3 groups

Does sepal width differ across all three iris species? Run a Kruskal-Wallis test on the full `iris` dataset, save the result to `ex6_res`, and extract both the H statistic and degrees of freedom.

```r title="Exercise 6 starter: Kruskal-Wallis on three species"
# Hint: kruskal.test(Sepal.Width ~ Species, data = iris)
# H is in $statistic, df is in $parameter

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_res <- kruskal.test(Sepal.Width ~ Species, data = iris)
c(H = unname(ex6_res$statistic),
  df = unname(ex6_res$parameter),
  p = ex6_res$p.value)
#>            H           df            p
#> 6.328831e+01 2.000000e+00 1.569282e-14
```

**Explanation:** H = 63.3 on df = 2 gives a p-value far below any reasonable alpha, so at least one species differs. Kruskal-Wallis is an "omnibus" test: it tells you *something* differs but not *which* pair. For that you need post-hoc comparisons (Exercise 7). The df equals number of groups minus one, just like one-way ANOVA's between-group df.

</details>

### Exercise 7: Post-hoc pairwise comparisons with FDR

Exercise 6 showed species differ on sepal width, but not which pairs. Run `pairwise.wilcox.test()` across all three species with Benjamini-Hochberg FDR correction. Save the result to `ex7_res` and read the pairwise p-value matrix.

[TIP]
**`p.adjust.method` controls how you pay for multiple comparisons.** `"BH"` (Benjamini-Hochberg, the default FDR) is the right default for exploratory work; it controls the false discovery rate. `"holm"` is a stepdown family-wise-error method, more conservative. `"bonferroni"` is the most conservative and loses power quickly above 4-5 comparisons.

```r title="Exercise 7 starter: post-hoc pairwise"
# Hint: pairwise.wilcox.test(iris$Sepal.Width, iris$Species, p.adjust.method = "BH")

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_res <- pairwise.wilcox.test(iris$Sepal.Width, iris$Species,
                                p.adjust.method = "BH")
ex7_res$p.value
#>                 setosa   versicolor
#> versicolor 2.402983e-11           NA
#> virginica  4.447596e-09 4.438060e-03
```

**Explanation:** All three pairwise p-values sit below 0.005 after BH adjustment, so every pair differs significantly. Setosa vs the other two is the strongest effect, and versicolor vs virginica is smaller but still meaningful. `pairwise.wilcox.test()` runs rank-sum tests for every pair and then adjusts p-values in the chosen family.

</details>

### Exercise 8: Rank-biserial effect size for Mann-Whitney

A significant p-value tells you an effect is non-zero; effect size tells you how big. For Mann-Whitney, a clean choice is the rank-biserial correlation:

$$r = 1 - \frac{2U}{n_1 n_2}$$

where $U$ is the U statistic and $n_1, n_2$ are the two group sizes. The value ranges from -1 to 1, where 0 means complete overlap. Compute it for Exercise 2 (setosa vs versicolor petal length).

```r title="Exercise 8 starter: rank-biserial effect size"
# Hint: U = ex2_res$statistic, n1 = 50 (setosa), n2 = 50 (versicolor)
# Classify: |r| < 0.1 small, 0.1-0.3 moderate, 0.3-0.5 large, > 0.5 very large

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_U <- unname(ex2_res$statistic)
ex8_n1 <- 50
ex8_n2 <- 50
ex8_r <- 1 - (2 * ex8_U) / (ex8_n1 * ex8_n2)
ex8_r
#> [1] 1
```

**Explanation:** U = 0 pushes the formula to r = 1, the theoretical maximum. Every setosa value ranked below every versicolor value, so the effect is perfectly separated. Real-world effect sizes this large are rare; this is a textbook dataset bred for clean examples. Most applied problems return |r| in the 0.1 to 0.4 range.

</details>

### Exercise 9: Epsilon-squared effect size for Kruskal-Wallis

For Kruskal-Wallis, the analog of eta-squared is epsilon-squared:

$$\varepsilon^2 = \frac{H}{(n^2 - 1)/(n + 1)} = \frac{H(n+1)}{n^2 - 1}$$

where $H$ is the test statistic and $n$ is the total sample size. It ranges from 0 to 1. Compute it for Exercise 6 (sepal width across 3 species).

[KEY INSIGHT]
**Epsilon-squared is H normalized by its theoretical maximum.** That is why it lands between 0 and 1. Rules of thumb: < 0.01 is negligible, 0.01-0.08 small, 0.08-0.26 moderate, > 0.26 large (Cohen-style thresholds adapted for ranks).

```r title="Exercise 9 starter: epsilon-squared"
# Hint: H = ex6_res$statistic, n = nrow(iris) = 150

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_H <- unname(ex6_res$statistic)
ex9_n <- nrow(iris)
ex9_eps <- ex9_H * (ex9_n + 1) / (ex9_n^2 - 1)
ex9_eps
#> [1] 0.4250257
```

**Explanation:** Epsilon-squared = 0.43 sits well above the 0.26 "large" threshold, matching what the tiny p-value already suggested. Unlike the p-value, this number tells you *how much* of the rank variation in sepal width is attributable to species, about 43%. That is the kind of statistic that belongs in a results paragraph next to H and p.

</details>

### Exercise 10: Decide the right test from a data description

Four short vignettes, four correct R calls. Match each scenario to the right test and save your answers as a named character vector called `ex10_choices`. Use the codes from this key:

- `"one_sample"` → `wilcox.test(x, mu = value)`
- `"mann_whitney"` → `wilcox.test(y ~ group, data = d)`
- `"paired"` → `wilcox.test(y ~ group, data = d, paired = TRUE)`
- `"kruskal"` → `kruskal.test(y ~ group, data = d)`

Vignettes:

- **A.** 40 students rate a textbook on a 1-10 ordinal scale. Is the median rating different from 7?
- **B.** A clinic measures systolic blood pressure in 25 patients before and after a 30-day exercise program.
- **C.** Soil nitrogen measured at 4 different farm plots with 12 readings per plot. Do plots differ?
- **D.** Hospital wait times measured in two different emergency rooms on skewed, non-normal distributions.

```r title="Exercise 10 starter: map scenarios to tests"
ex10_choices <- c(
  A = "___",
  B = "___",
  C = "___",
  D = "___"
)
ex10_choices

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
ex10_choices <- c(
  A = "one_sample",     # one group vs reference value
  B = "paired",         # same patients, before vs after
  C = "kruskal",        # 4 groups, one outcome
  D = "mann_whitney"    # two independent groups, non-normal
)
ex10_choices
#>             A             B             C             D
#>  "one_sample"      "paired"     "kruskal" "mann_whitney"
```

**Explanation:** Every scenario maps to exactly one call. A compares a single group's median to a claim. B has linked before/after measurements, so paired. C is three or more groups, so Kruskal-Wallis. D is two independent groups with non-normality, so Mann-Whitney. This mapping is 80% of real-world nonparametric analysis; the rest is careful reporting of effect sizes and assumptions.

</details>

## Complete Example: Pain-relief dose comparison

Here is the full workflow you would apply to a real dataset. A clinical trial measures pain reduction (0-10 ordinal scale) across three doses of a new analgesic: 10 patients per dose, 30 patients total. The outcome is ordinal and the sample is small, so nonparametric is the right call from the start.

[NOTE]
**On ordinal or skewed data, start nonparametric rather than running a t-test first and apologizing later.** Running a t-test, noticing non-normality in the residuals, and then switching to Wilcoxon inflates the false-positive rate because you chose the test after seeing the data. The right reason to pick a nonparametric test is the design, not a failed normality check.

```r title="Complete example: simulate, test, post-hoc, effect size"
set.seed(2026)

# Simulate pain-reduction scores per dose (ordinal, 0-10 scale)
pain_df <- data.frame(
  dose  = rep(c("low", "medium", "high"), each = 10),
  score = c(sample(1:5, 10, replace = TRUE),
            sample(3:7, 10, replace = TRUE),
            sample(5:9, 10, replace = TRUE))
)
pain_df$dose <- factor(pain_df$dose, levels = c("low", "medium", "high"))

# Step 1: omnibus Kruskal-Wallis across three doses
pain_kw <- kruskal.test(score ~ dose, data = pain_df)
pain_kw$p.value
#> [1] 9.968406e-05

# Step 2: post-hoc pairwise Wilcoxon with Holm adjustment
pain_ph <- pairwise.wilcox.test(pain_df$score, pain_df$dose,
                                p.adjust.method = "holm")
pain_ph$p.value
#>              low      medium
#> medium 0.03148519         NA
#> high   0.00028005 0.01236345

# Step 3: epsilon-squared effect size
pain_H <- unname(pain_kw$statistic)
pain_n <- nrow(pain_df)
pain_eps <- pain_H * (pain_n + 1) / (pain_n^2 - 1)
pain_eps
#> [1] 0.6406218

# Step 4: one-line summary
sprintf("KW H(%d) = %.2f, p = %.4f, epsilon^2 = %.2f",
        unname(pain_kw$parameter), pain_H, pain_kw$p.value, pain_eps)
#> [1] "KW H(2) = 18.57, p = 0.0001, epsilon^2 = 0.64"
```

The overall Kruskal-Wallis test rejects equality (p < 0.001). All three pairwise comparisons after Holm adjustment show significant differences, with the largest gap between low and high doses (p < 0.001). Epsilon-squared of 0.64 indicates a large effect; dose accounts for roughly 64% of the rank variation in pain scores. In a paper you would report: "Pain-reduction scores differed significantly across doses (Kruskal-Wallis H(2) = 18.57, p < 0.001, ε² = 0.64). Post-hoc Holm-adjusted Wilcoxon tests found all three pairs differed (all adjusted p < 0.05), with the largest shift from low to high dose."

## Summary

| # | Exercise | Test used | Key function | Difficulty |
|---|---|---|---|---|
| 1 | One-sample median vs claim | Wilcoxon signed-rank | `wilcox.test(x, mu = )` | Medium |
| 2 | Two-species petal length | Mann-Whitney U | `wilcox.test(y ~ g, data = )` | Medium |
| 3 | One-tailed direction test | Mann-Whitney U | `alternative = "less"` | Medium |
| 4 | Two drugs, same patients | Paired signed-rank | `paired = TRUE` | Medium |
| 5 | Tie handling + warnings | Mann-Whitney U | `exact = FALSE, correct = TRUE` | Hard |
| 6 | Three-species sepal width | Kruskal-Wallis | `kruskal.test(y ~ g, data = )` | Medium |
| 7 | Which pairs differ | Post-hoc pairwise | `pairwise.wilcox.test(...)` | Hard |
| 8 | Mann-Whitney effect size | Rank-biserial r | formula on U | Hard |
| 9 | Kruskal-Wallis effect size | Epsilon-squared | formula on H | Hard |
| 10 | Decision drill | All four | scenario mapping | Hard |

Three rules to take away. First, the test you pick is decided by the data layout, not by running normality checks. Second, always report an effect size alongside the p-value; a significant H or W tells you an effect exists, not how big. Third, after a significant Kruskal-Wallis, do post-hoc pairs with BH or Holm adjustment, not 3 raw Wilcoxon tests.

## References

1. R Core Team. `wilcox.test` documentation (stats package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html)
2. R Core Team. `kruskal.test` documentation (stats package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kruskal.test.html)
3. Hollander, M., & Wolfe, D. A. (1999). *Nonparametric Statistical Methods* (2nd ed.). Wiley. [Link](https://www.wiley.com/en-us/Nonparametric+Statistical+Methods%2C+3rd+Edition-p-9780470387375)
4. Conover, W. J. (1999). *Practical Nonparametric Statistics* (3rd ed.). Wiley.
5. Mangiafico, S. (2016). *Summary and Analysis of Extension Program Evaluation in R*. [Link](https://rcompanion.org/handbook/)
6. Kerby, D. S. (2014). The simple difference formula: An approach to teaching nonparametric correlation. *Comprehensive Psychology*, 3, 11-IT. [Link](https://journals.sagepub.com/doi/10.2466/11.IT.3.1)
7. Tomczak, M., & Tomczak, E. (2014). The need to report effect size estimates revisited. *Trends in Sport Sciences*, 1(21), 19-25. [Link](https://tss.awf.poznan.pl/files/3_Trends_Vol21_2014__no1_20.pdf)

## Continue Learning

1. **[Wilcoxon, Mann-Whitney, and Kruskal-Wallis in R](/Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html)**: the underlying tutorial covers when to use each test, how the ranks work, and what the output means. Read this first if any exercise felt opaque.
2. **[t-Test Exercises in R](/t-Test-Exercises-in-R.html)**: the parametric companion with twelve one-sample, two-sample, and paired t-test problems in the same exercise format.
3. **[Hypothesis Testing Exercises in R](/Hypothesis-Testing-Exercises-in-R.html)**: broader practice across hypothesis tests, Type I/II errors, and p-value interpretation.
