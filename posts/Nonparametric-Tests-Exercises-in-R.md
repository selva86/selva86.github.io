---
title: "Nonparametric Tests Exercises in R: 10 Practice Problems, Solved Step-by-Step"
slug: Nonparametric-Tests-Exercises-in-R
description: "10 nonparametric tests exercises in R with runnable solutions: Wilcoxon signed-rank, Mann-Whitney U, Kruskal-Wallis, post-hoc, and rank-based effect sizes."
keywords: "nonparametric tests exercises in R, Wilcoxon test R, Mann-Whitney test R, Kruskal-Wallis exercises, nonparametric practice problems, wilcox.test examples, kruskal.test examples, rank-based tests R"
auto_link_terms: "nonparametric tests exercises|nonparametric practice problems|Wilcoxon exercises|Mann-Whitney exercises|Kruskal-Wallis exercises|rank-based tests exercises|nonparametric solutions"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.6
post_type: EX
sidebar_title: "Nonparametric Tests Exercises (10 problems)"
fr_parent: Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html
difficulty: Intermediate
---

# Nonparametric Tests Exercises in R: 10 Practice Problems, Solved Step-by-Step

<p class="lead">These 10 nonparametric tests exercises in R cover one-sample Wilcoxon signed-rank, two-sample Mann-Whitney U, paired signed-rank, Kruskal-Wallis for three or more groups, post-hoc pairwise comparisons, Hodges-Lehmann confidence intervals, tie handling, and rank-based effect sizes, each one runnable in your browser.</p>

## Which non-parametric test matches your design?

One of three R calls covers 90% of rank-based problems. The choice depends only on how your data is laid out: one group, two independent groups, two paired groups, or three-plus groups. Here are all three tests run against the same built-in datasets so you can see the output shape before starting the exercises.

```r title="Three rank-based tests, three data layouts"
# Layout 1: one sample, test median vs a claimed value
one_res <- wilcox.test(mtcars$mpg, mu = 20)

# Layout 2: two independent groups (Mann-Whitney U)
set4 <- mtcars$mpg[mtcars$cyl == 4]
set8 <- mtcars$mpg[mtcars$cyl == 8]
mw_res <- wilcox.test(set4, set8)

# Layout 3: three or more groups (Kruskal-Wallis)
kw_res <- kruskal.test(Sepal.Width ~ Species, data = iris)

c(one_sample     = one_res$p.value,
  mann_whitney   = mw_res$p.value,
  kruskal_wallis = kw_res$p.value)
#>     one_sample    mann_whitney  kruskal_wallis
#>   4.027e-01       4.192e-06       9.514e-15
```

Three calls, three p-values, same `$p.value` field on every result. The one-sample test fails to reject that median mpg equals 20 (p = 0.40). The Mann-Whitney test strongly rejects equal mpg across 4-cyl and 8-cyl cars (p = 4e-06). The Kruskal-Wallis test crushes the null that `Sepal.Width` is interchangeable across iris species (p = 1e-14). Same function family, same result shape, just different input layouts.

Here is the one-line decision rule:

| You have... | Are measurements paired? | R call |
|---|---|---|
| One sample + a claimed centre | N/A | `wilcox.test(x, mu = m)` |
| Two independent groups | No | `wilcox.test(y ~ g)` or `wilcox.test(x, y)` |
| Two groups, same subjects | Yes | `wilcox.test(x, y, paired = TRUE)` |
| Three or more groups | No | `kruskal.test(y ~ g)` |

[KEY INSIGHT]
**Mann-Whitney U and Wilcoxon rank-sum are the same test under two names.** R only ships `wilcox.test()`, which returns a W statistic equal to the Wilcoxon rank sum shifted by a constant. Whether a paper calls the result "U" or "W", the p-value is identical. "Non-parametric" means the test does not assume a specific distribution shape (like normal), not that it is assumption-free. It still assumes independence and, for the paired test, a symmetric distribution of differences.

**Try it:** A trainer measures blood pressure for 15 patients before and after an intervention. Same patients, two measurements each. Which flag in `wilcox.test()` must you set? Save `"paired"` or `"mu"` to `ex_flag`.

```r title="Your turn: pick the wilcox.test flag"
# Try it: before/after on the same 15 patients
ex_flag <- "___"   # replace with "paired" or "mu"
ex_flag
#> Expected: "paired"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Paired design solution"
ex_flag <- "paired"
ex_flag
#> [1] "paired"
```

**Explanation:** Same subjects measured twice is a paired design. Set `paired = TRUE` and pass the two vectors, `wilcox.test(before, after, paired = TRUE)`. `mu` is the one-sample null centre, irrelevant when you have two measurements per subject.

</details>

## How do you read wilcox.test() and kruskal.test() output?

Both functions return a `htest` list with everything you need for a write-up: the test statistic, p-value, alternative hypothesis, and (for Wilcoxon with `conf.int = TRUE`) a confidence interval plus Hodges-Lehmann location estimate. Pulling fields by name gives one-line access for report tables, assumption checks, and downstream plots.

```r title="Extract every useful field from wilcox.test and kruskal.test"
# Mann-Whitney with confidence interval switched on
mw_full <- wilcox.test(set4, set8, conf.int = TRUE)

mw_full$statistic
#>   W
#> 117
mw_full$p.value
#> [1] 4.192e-06
mw_full$estimate
#> difference in location
#>                  10.50
mw_full$conf.int
#> [1] 6.300 14.200
#> attr(,"conf.level")
#> [1] 0.95

# Kruskal-Wallis fields (reuse kw_res from earlier)
kw_res$statistic
#> Kruskal-Wallis chi-squared
#>                      63.57
kw_res$parameter
#> df
#>  2
kw_res$p.value
#> [1] 9.514e-15
```

The Wilcoxon `$estimate` is the Hodges-Lehmann estimator, the median of all pairwise differences between the two samples. It is a rank-based analogue of a mean difference, and its 95% CI of 6.3 to 14.2 mpg is the interval you report instead of `mean(set4) - mean(set8)`. For Kruskal-Wallis, `$statistic` is H and `$parameter` is df = groups minus 1. Those three fields plus the p-value are everything a reviewer asks for.

Here are the five fields you will reach for most often:

| Field | wilcox.test | kruskal.test | When to use |
|---|---|---|---|
| `$statistic` | W (rank-sum / signed-rank) | H (chi-sq approximation) | Always report |
| `$parameter` | not present | df = k − 1 | KW write-ups |
| `$p.value` | Tail probability | Tail probability | The decision number |
| `$estimate` | Hodges-Lehmann (with `conf.int`) | not present | Effect magnitude |
| `$conf.int` | 95% CI on HL (with `conf.int`) | not present | Uncertainty range |

[TIP]
**broom::tidy() turns any R test into a one-row data frame.** `broom::tidy(mw_full)` returns a clean `estimate / statistic / p.value / method / alternative` row that drops into markdown tables or `ggplot` panels. Useful when you run the same test across many subsets with `purrr::map()`.

[WARNING]
**If you see "cannot compute exact p-value with ties", the asymptotic approximation was used.** Rank-based tests assume continuous data so ties shouldn't occur, but real data has them. R silently falls back to a normal approximation (with continuity correction unless you set `correct = FALSE`). For small samples with many ties, the fallback is inaccurate, consider `coin::wilcox_test()` for an exact permutation-based alternative.

**Try it:** Extract just the p-value from a one-sample Wilcoxon test on `mtcars$mpg` with null median `mu = 20`. Save it to `ex_p`, rounded to 4 decimals.

```r title="Your turn: extract the one-sample p-value"
# Try it: one-sample wilcox on mtcars$mpg against mu = 20, keep only p, rounded
ex_p <- round(wilcox.test(___, mu = ___)$p.value, 4)   # fill in the vector and null
ex_p
#> Expected: 0.4027
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sample p-value solution"
ex_p <- round(wilcox.test(mtcars$mpg, mu = 20)$p.value, 4)
ex_p
#> [1] 0.4027
```

**Explanation:** `wilcox.test(x, mu = 20)` runs the one-sample signed-rank test of whether the pseudo-median of `x` equals 20. The observed median of `mtcars$mpg` is 19.2, close enough to 20 that with n = 32 the test cannot reject, p = 0.40.

</details>

## Practice Exercises

Ten capstone problems, ordered roughly easier to harder. Every exercise uses a distinct `ex<N>_` prefix so solutions do not clobber earlier tutorial state.

### Exercise 1: One-sample Wilcoxon signed-rank against a claimed median

Test whether the median weight in `mtcars$wt` differs from 3.2 (thousand pounds). Save the full result to `ex1_res`. State the decision at α = 0.05 and explain why the pseudo-median is a better target than the simple median when the distribution is skewed.

```r title="Exercise 1 starter: one-sample signed-rank"
# Exercise 1: is median mtcars$wt different from 3.2?
# Hint: wilcox.test(vec, mu = 3.2, conf.int = TRUE)
ex1_vec <- mtcars$wt
median(ex1_vec)
#> [1] 3.325

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_res <- wilcox.test(ex1_vec, mu = 3.2, conf.int = TRUE)
ex1_res
#>
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  ex1_vec
#> V = 269, p-value = 0.3073
#> alternative hypothesis: true location is not equal to 3.2
#> 95 percent confidence interval:
#>  2.9975 3.6100
#> sample estimates:
#> (pseudo)median
#>        3.2325
```

**Explanation:** The signed-rank test converts each `x - 3.2` difference to a signed rank and asks whether the positive and negative ranks balance. V = 269, p = 0.31, so we fail to reject. The 95% CI on the pseudo-median (2.998 to 3.610) contains 3.2, telling the same story from a location-estimate angle. Use the pseudo-median instead of `median()` when you want a signed-rank-compatible centre for a potentially asymmetric distribution.

</details>

### Exercise 2: Mann-Whitney U on two independent groups

Using the `iris` dataset, compare `Petal.Length` between setosa and versicolor. Save the result to `ex2_res`. Report W and the p-value.

```r title="Exercise 2 starter: Mann-Whitney on iris"
# Exercise 2: Petal.Length setosa vs versicolor
# Hint: wilcox.test(x, y) when you have two independent numeric vectors
ex2_g_set <- iris$Petal.Length[iris$Species == "setosa"]
ex2_g_ver <- iris$Petal.Length[iris$Species == "versicolor"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_res <- wilcox.test(ex2_g_set, ex2_g_ver)
ex2_res
#>
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  ex2_g_set and ex2_g_ver
#> W = 0, p-value < 2.2e-16
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** Setosa petals range 1.0 to 1.9 cm and versicolor petals range 3.0 to 5.1 cm. Zero overlap means every setosa value ranks below every versicolor value, so W = 0 (the minimum possible). The p-value is below `.Machine$double.eps`, R prints `< 2.2e-16`. When two samples are perfectly separable, the rank-sum test returns the most extreme p-value it can produce.

</details>

### Exercise 3: One-tailed Mann-Whitney (direction matters)

Re-run Exercise 2 with the alternative hypothesis "versicolor petals are *longer* than setosa petals". Save the result to `ex3_res`. Explain why a one-tailed test halves the p-value when the effect is in the hypothesised direction.

```r title="Exercise 3 starter: one-tailed Mann-Whitney"
# Exercise 3: one-tailed (versicolor > setosa)
# Hint: the first vector is what the alternative says is larger

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_res <- wilcox.test(ex2_g_ver, ex2_g_set, alternative = "greater")
ex3_res
#>
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  ex2_g_ver and ex2_g_set
#> W = 2500, p-value < 2.2e-16
#> alternative hypothesis: true location shift is greater than 0
```

**Explanation:** Putting versicolor first in `wilcox.test(ver, set, alternative = "greater")` tests whether the first sample is stochastically larger than the second. W = 2500 (the maximum possible for 50 × 50 samples), and the one-tailed p-value equals the right-tail area only. With perfect separation it saturates at the floating-point limit. For a less extreme effect, the one-tailed p would be exactly half the two-tailed p when the observed direction matches the alternative.

</details>

[TIP]
**`alternative = "two.sided"` is the safe default, change it only when the direction is pre-specified.** Picking one-tailed *after* peeking at group means inflates false positives and is a common reviewer red flag. Lock in one-tailed from your pre-registration or hypothesis, not from the data.

### Exercise 4: Paired Wilcoxon signed-rank on the sleep dataset

R's built-in `sleep` dataset records extra hours of sleep from the same 10 subjects taking two soporific drugs (groups 1 and 2). Run a paired Wilcoxon signed-rank test and save the result to `ex4_res`.

```r title="Exercise 4 starter: paired sleep data"
# Exercise 4: paired signed-rank on sleep
# Hint: each ID appears in both groups, pass paired = TRUE
ex4_d1 <- sleep$extra[sleep$group == 1]
ex4_d2 <- sleep$extra[sleep$group == 2]
head(cbind(ex4_d1, ex4_d2))
#>      ex4_d1 ex4_d2
#> [1,]    0.7    1.9
#> [2,]   -1.6    0.8
#> [3,]   -0.2    1.1
#> [4,]   -1.2    0.1
#> [5,]   -0.1   -0.1
#> [6,]    3.4    4.4

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_res <- suppressWarnings(wilcox.test(ex4_d1, ex4_d2, paired = TRUE))
ex4_res
#>
#> 	Wilcoxon signed rank test with continuity correction
#>
#> data:  ex4_d1 and ex4_d2
#> V = 0, p-value = 0.009091
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** With `paired = TRUE`, R computes `d <- ex4_d1 - ex4_d2` per subject, ranks the `|d|` values, signs them, and sums the positive ranks into V. Here every subject slept longer on drug 2 than drug 1, so every signed difference is negative, positive ranks sum to V = 0 (the minimum). The asymptotic p-value of 0.0091 rejects "no difference" at α = 0.05, drug 2 outperforms drug 1 in this sample.

</details>

[NOTE]
**Paired vs independent is a design decision, not a data decision.** If the same subject contributes to both groups (before/after, left/right, rater/re-rater), it is paired. If subjects are independently sampled into group A vs group B, it is unpaired. Running the wrong variant can flip a significant result either way because pairing removes between-subject variance.

### Exercise 5: Tie handling, exact vs approximate p-values

Here is a small dataset with deliberate ties. Run `wilcox.test()` on it first with defaults (watch for the ties warning), then suppress the exact calculation with `exact = FALSE`. Save the final result to `ex5_res`.

```r title="Exercise 5 starter: ties in the data"
# Exercise 5: ties + exact p-value
# Hint: first use tryCatch to capture the warning message, then set exact = FALSE
ex5_tied <- c(3, 5, 7, 7, 9, 12, 15)
ex5_base <- c(4, 6, 8, 10, 11, 13)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
# First pass: see the warning
ex5_warn <- tryCatch(
  wilcox.test(ex5_tied, ex5_base),
  warning = function(w) conditionMessage(w)
)
ex5_warn
#> [1] "cannot compute exact p-value with ties"

# Second pass: switch to asymptotic approximation
ex5_res <- wilcox.test(ex5_tied, ex5_base, exact = FALSE)
ex5_res
#>
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  ex5_tied and ex5_base
#> W = 22.5, p-value = 0.9362
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** The repeated `7` in `ex5_tied` blocks the exact computation. R falls back to a normal approximation with continuity correction and tie-corrected variance, W = 22.5, p = 0.94. Setting `exact = FALSE` explicitly makes the fallback deterministic and silences the warning. For small n with heavy ties consider `coin::wilcox_test()` which runs an exact permutation test.

</details>

### Exercise 6: Kruskal-Wallis on three groups

Use the built-in `PlantGrowth` dataset (yields under a control and two treatments, n = 10 each). Save a Kruskal-Wallis test of `weight ~ group` to `ex6_res`.

```r title="Exercise 6 starter: Kruskal-Wallis"
# Exercise 6: weight across three plant growth groups
# Hint: kruskal.test(y ~ group, data = ...)
ex6_df <- PlantGrowth
head(ex6_df, 3)
#>   weight group
#> 1   4.17  ctrl
#> 2   5.58  ctrl
#> 3   5.18  ctrl

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_res <- kruskal.test(weight ~ group, data = ex6_df)
ex6_res
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  weight by group
#> Kruskal-Wallis chi-squared = 7.9882, df = 2, p-value = 0.01842
```

**Explanation:** H = 7.99 on df = 2 gives p = 0.018. At α = 0.05 we reject the null that all three groups share the same location. Kruskal-Wallis tells us *somewhere* in the three groups there is a difference, but it does not tell us *where*, that is the job of the post-hoc comparison in Exercise 7.

</details>

### Exercise 7: Post-hoc pairwise comparisons with BH adjustment

After a significant Kruskal-Wallis, use `pairwise.wilcox.test()` with `p.adjust.method = "BH"` (Benjamini-Hochberg) to identify *which* pairs of plant-growth groups differ. Save the result to `ex7_res`.

```r title="Exercise 7 starter: pairwise wilcox with BH"
# Exercise 7: pairwise.wilcox.test across the three groups
# Hint: pairwise.wilcox.test(y, g, p.adjust.method = "BH")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_res <- suppressWarnings(pairwise.wilcox.test(ex6_df$weight, ex6_df$group,
                                                 p.adjust.method = "BH"))
ex7_res
#>
#> 	Pairwise comparisons using Wilcoxon rank sum test with continuity correction
#>
#> data:  ex6_df$weight and ex6_df$group
#>
#>      ctrl  trt1
#> trt1 0.310 -
#> trt2 0.095 0.027
#>
#> P value adjustment method: BH
```

**Explanation:** Of the three pairs, only trt1 vs trt2 clears α = 0.05 after BH adjustment (adjusted p = 0.027). The ctrl vs trt2 contrast is borderline (p = 0.095) and ctrl vs trt1 is not significant. BH controls the *expected false discovery rate*, less conservative than Bonferroni (which would multiply raw p-values by 3). Always report the adjustment method, unadjusted pairwise p-values inflate the false-positive risk.

</details>

[TIP]
**Choose `p.adjust.method` by the error you want to control.** `"bonferroni"` controls family-wise error rate (reject zero true nulls), strict but stable. `"holm"` does the same with a step-down gain in power. `"BH"` (Benjamini-Hochberg) controls the false discovery rate, the expected fraction of rejections that are wrong, and is the default in most modern biological and psychological reporting.

### Exercise 8: Rank-biserial effect size for Mann-Whitney

The p-value from Exercise 2 said "the two groups differ". Quantify *how much* with the rank-biserial correlation $r$, computed as $r = 1 - \frac{2U}{n_1 n_2}$ where $U$ is the smaller of the two U statistics. Save `ex8_r` and classify the magnitude.

```r title="Exercise 8 starter: rank-biserial effect size"
# Exercise 8: rank-biserial r from the Exercise 2 W stat
# Hint: U1 = W; U2 = n1*n2 - U1; use the smaller, then r = 1 - 2*U/(n1*n2)
ex8_n1 <- length(ex2_g_set)
ex8_n2 <- length(ex2_g_ver)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_U1 <- unname(ex2_res$statistic)          # W from Exercise 2
ex8_U2 <- ex8_n1 * ex8_n2 - ex8_U1
ex8_U  <- min(ex8_U1, ex8_U2)
ex8_r  <- 1 - 2 * ex8_U / (ex8_n1 * ex8_n2)
round(ex8_r, 3)
#> [1] 1
```

**Explanation:** With `U1 = 0`, `U2 = 2500`, the smaller is 0. Plug into the formula: $r = 1 - (2 \cdot 0)/(50 \cdot 50) = 1.0$. Perfect separation maps to $r = 1$, and that lines up with what we saw in Exercise 2. Cohen's thresholds on rank-biserial: 0.1 small, 0.3 medium, 0.5 large. An $r$ of 1.0 is as large as it goes.

</details>

### Exercise 9: Epsilon-squared effect size for Kruskal-Wallis

A Kruskal-Wallis p-value says there is *some* difference, but $\varepsilon^2$ quantifies it. Use the formula $\varepsilon^2 = \frac{H (n + 1)}{n^2 - 1}$ on the iris Sepal.Width vs Species Kruskal-Wallis from the opening section. Classify by the convention 0.01 small, 0.08 medium, 0.26 large.

```r title="Exercise 9 starter: epsilon-squared for KW"
# Exercise 9: epsilon^2 from the iris KW statistic
# Hint: reuse kw_res$statistic; n = nrow(iris)
ex9_H <- unname(kw_res$statistic)
ex9_n <- nrow(iris)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_eps <- ex9_H * (ex9_n + 1) / (ex9_n^2 - 1)
round(ex9_eps, 3)
#> [1] 0.427
```

**Explanation:** With $H = 63.57$ and $n = 150$, $\varepsilon^2 = 63.57 \cdot 151 / (150^2 - 1) = 0.427$. That sits well above the 0.26 "large" threshold: Species explains a meaningful share of the rank variance in Sepal.Width. Always pair a KW p-value with $\varepsilon^2$ (or $\eta^2_H$, which is nearly identical); a highly significant KW on a huge n can have a trivial effect.

</details>

[KEY INSIGHT]
**P-values scale with sample size, effect sizes do not.** In a study with 10,000 observations, a Kruskal-Wallis can flag a tiny $\varepsilon^2 = 0.002$ as $p < 10^{-10}$. That is "statistically significant but practically irrelevant". Reporting the rank-biserial $r$ or $\varepsilon^2$ alongside the p-value keeps the reader grounded in how big the effect actually is.

### Exercise 10: Full pipeline on chickwts, test → post-hoc → effect size

Real data usually arrives as one row per observation with a categorical grouping. R's built-in `chickwts` has the weight of 71 chicks across 6 feed types. Put the full workflow together: Kruskal-Wallis, pairwise post-hoc with Holm adjustment, and $\varepsilon^2$.

```r title="Exercise 10 starter: chickwts end-to-end"
# Exercise 10: full KW pipeline on chickwts
# Hint: kruskal.test -> pairwise.wilcox.test (holm) -> epsilon-squared
ex10_df <- chickwts
table(ex10_df$feed)
#>    casein horsebean   linseed  meatmeal   soybean sunflower
#>        12        10        12        11        14        12

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
# Step 1: Kruskal-Wallis
ex10_res <- kruskal.test(weight ~ feed, data = ex10_df)
ex10_res$statistic
#> Kruskal-Wallis chi-squared
#>                     37.343
ex10_res$p.value
#> [1] 5.113e-07

# Step 2: pairwise.wilcox.test with Holm
ex10_pw <- suppressWarnings(
  pairwise.wilcox.test(ex10_df$weight, ex10_df$feed,
                       p.adjust.method = "holm")
)
round(ex10_pw$p.value, 3)
#>           casein horsebean linseed meatmeal soybean
#> horsebean  0.001        NA      NA       NA      NA
#> linseed    0.004     0.096      NA       NA      NA
#> meatmeal   0.674     0.008   0.237       NA      NA
#> soybean    0.097     0.024   0.674    0.674      NA
#> sunflower  0.823     0.001   0.004    0.674   0.097

# Step 3: epsilon-squared
ex10_n   <- nrow(ex10_df)
ex10_H   <- unname(ex10_res$statistic)
ex10_eps <- ex10_H * (ex10_n + 1) / (ex10_n^2 - 1)
round(ex10_eps, 3)
#> [1] 0.527
```

**Explanation:** Three steps capture the whole story. Kruskal-Wallis says weights differ across feeds ($p = 5 \times 10^{-7}$). Holm-adjusted pairwise comparisons say casein beats horsebean and linseed but ties with meatmeal / soybean / sunflower, and horsebean is clearly the weakest feed. Epsilon-squared of 0.53 flags this as a very large effect, much of the weight variance is explained by feed choice. That three-line sketch, test / post-hoc / effect size, is the template for any categorical comparison in real data.

</details>

## Complete Example: end-to-end chickwts analysis with reporting

Let's stitch the full workflow, including an assumption check, into one block that mirrors how a real report would read.

```r title="End-to-end nonparametric analysis on chickwts"
# Step 1 - quick sanity check: n, median, IQR per group
cw_tab <- aggregate(weight ~ feed, data = chickwts,
                    FUN = function(v) round(c(n      = length(v),
                                              median = median(v),
                                              IQR    = IQR(v)), 1))
cw_tab
#>        feed weight.n weight.median weight.IQR
#> 1    casein       12         342.0       80.8
#> 2 horsebean       10         151.5       60.5
#> 3   linseed       12         221.0       94.8
#> 4  meatmeal       11         263.0       84.0
#> 5   soybean       14         248.0      105.5
#> 6 sunflower       12         328.0       50.8

# Step 2 - Shapiro-Wilk per group (sample sizes are small, so err on nonparametric)
cw_shapiro <- sapply(split(chickwts$weight, chickwts$feed),
                     function(v) shapiro.test(v)$p.value)
round(cw_shapiro, 3)
#>    casein horsebean   linseed  meatmeal   soybean sunflower
#>     0.215     0.506     0.923     0.931     0.506     0.365

# Step 3 - Kruskal-Wallis (the right default when any group is non-normal or small n)
cw_kw <- kruskal.test(weight ~ feed, data = chickwts)
cw_kw$p.value
#> [1] 5.113e-07

# Step 4 - pairwise with Holm + effect size
cw_pw_min  <- min(suppressWarnings(
                    pairwise.wilcox.test(chickwts$weight, chickwts$feed,
                                         p.adjust.method = "holm")$p.value),
                  na.rm = TRUE)
cw_eps     <- unname(cw_kw$statistic) * (nrow(chickwts) + 1) /
              (nrow(chickwts)^2 - 1)
c(min_adj_p = round(cw_pw_min, 4),
  epsilon2  = round(cw_eps, 3))
#> min_adj_p  epsilon2
#>     0.001     0.527
```

[WARNING]
**Median is not mean, do not swap the research question when you swap the test.** Kruskal-Wallis tests whether the *distributions* (usually summarised by medians or pseudo-medians) differ, not whether the means differ. If your client asked about average weight, explain upfront why you are answering a median-based question, and consider a transformed-data t-test / ANOVA or a robust mean like the Hodges-Lehmann estimator as complements.

A one-paragraph APA-style write-up: *A Kruskal-Wallis rank-sum test compared chick weights across six feeds in the `chickwts` dataset (N = 71). Weight differed significantly across feeds, $H(5) = 37.34$, $p < .001$, with a large effect, $\varepsilon^2 = 0.53$. Holm-adjusted pairwise Wilcoxon rank-sum tests indicated casein- and sunflower-fed chicks weighed significantly more than horsebean-fed chicks (all adjusted $p < .01$), while differences among the remaining feeds were not reliable.* That sentence answers three questions at once: is the effect real, is it big, and where does it live.

## Summary

| Exercise | Test | Key R call | Effect size |
|---|---|---|---|
| 1 | One-sample signed-rank | `wilcox.test(x, mu)` | n/a |
| 2-3 | Mann-Whitney (2- and 1-sided) | `wilcox.test(x, y)` | Rank-biserial $r$ |
| 4 | Paired signed-rank | `wilcox.test(x, y, paired = TRUE)` | n/a |
| 5 | Tie handling | `wilcox.test(..., exact = FALSE)` | n/a |
| 6 | Kruskal-Wallis | `kruskal.test(y ~ g)` | Epsilon-squared |
| 7 | Post-hoc pairwise | `pairwise.wilcox.test(y, g, "BH")` | n/a |
| 8-9 | Effect sizes | Formulas above | $r$, $\varepsilon^2$ |
| 10 | Full pipeline | KW + post-hoc + $\varepsilon^2$ | $\varepsilon^2$ |

Three principles carry across every exercise: pick the test from the design (one / two / paired / many groups); always pair the p-value with an effect size so the reader knows how big the effect is, not just whether it exists; and adjust pairwise post-hoc p-values so your family-wise error or false discovery rate is under control.

## References

1. R Core Team. *wilcox.test, R Stats Reference.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html)
2. R Core Team. *kruskal.test, R Stats Reference.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kruskal.test.html)
3. Hollander, M., Wolfe, D. A., and Chicken, E. *Nonparametric Statistical Methods*, 3rd edition. Wiley (2013).
4. Conover, W. J. *Practical Nonparametric Statistics*, 3rd edition. Wiley (1999).
5. Wilcoxon, F. "Individual Comparisons by Ranking Methods." *Biometrics Bulletin* 1(6), 80-83 (1945).
6. Mann, H. B. and Whitney, D. R. "On a test of whether one of two random variables is stochastically larger than the other." *Annals of Mathematical Statistics* 18(1), 50-60 (1947).
7. Kruskal, W. H. and Wallis, W. A. "Use of Ranks in One-Criterion Variance Analysis." *Journal of the American Statistical Association* 47(260), 583-621 (1952).
8. Tomczak, M. and Tomczak, E. "The need to report effect size estimates revisited." *Trends in Sport Sciences* 21(1), 19-25 (2014).

## Continue Learning

- [Wilcoxon, Mann-Whitney, and Kruskal-Wallis in R: Non-Parametric When Normality Fails](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html) covers the parent theory, decision rules, and assumption checks in detail.
- [t-Test Exercises in R](t-Test-Exercises-in-R.html) is the parametric counterpart, use it when the normality assumption holds.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) gives broader inference practice across proportions, means, and non-parametrics with the same drill-sheet format.
