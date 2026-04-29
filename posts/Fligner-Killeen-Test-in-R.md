---
title: "Fligner-Killeen Test in R: Robust Alternative to Levene's Test"
slug: Fligner-Killeen-Test-in-R
description: "Fligner-Killeen test in R: the robust nonparametric alternative to Levene's test for homogeneity of variance. Includes code, output, and a decision guide."
keywords: "fligner-killeen test r, fligner.test, homogeneity of variance r, nonparametric variance test, levene's test alternative, robust variance test, anova assumptions r"
auto_link_terms: "Fligner-Killeen test|fligner.test|homogeneity of variance|nonparametric variance test|equal variance assumption|variance homogeneity test|robust variance test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: FR-nonp-6
post_type: FR
fr_parent: When-to-Use-Nonparametric-Tests-in-R.html
difficulty: Intermediate
---

# Fligner-Killeen Test in R: Robust Alternative to Levene's Test

<p class="lead">The Fligner-Killeen test checks whether several groups share the same variance, without assuming the data is normally distributed. Use it when residual diagnostics reveal heavy tails, skew, or outliers, and you still need a defensible homogeneity check before ANOVA or a t-test.</p>

Bartlett's test fails badly under non-normality and Levene's test handles it acceptably; Fligner-Killeen handles it best, and it ships with base R via `fligner.test()`.

## What does the Fligner-Killeen test do?

Fligner-Killeen tests whether several groups share the same variance, without assuming the data is normally distributed. That makes it the safest pick when your residuals look skewed or have heavy tails, where Bartlett's test would lie to you. Let's run it on the built-in `InsectSprays` data, which records insect counts under six different sprays. We expect very different spreads, since some sprays kill nearly everything (low variance) while others miss many plots (high variance).

Pass the formula `count ~ spray` and the data frame, and the function returns a chi-square statistic and a p-value.

```r title="Fligner-Killeen on InsectSprays"
fk_insect <- fligner.test(count ~ spray, data = InsectSprays)
fk_insect
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  count by spray
#> Fligner-Killeen:med chi-squared = 14.483, df = 5, p-value = 0.01282
```

The chi-squared statistic is 14.5 on 5 degrees of freedom, with p = 0.013. Since p is well below 0.05, we reject the null hypothesis of equal variances. The six sprays do not produce the same spread of insect counts, which means a standard one-way ANOVA on this data would violate the equal-variance assumption.

Under the hood, the test centres each observation by subtracting its group's median, takes the absolute deviation, ranks all of those across the full sample, and then asks: do the average ranks differ across groups? If a group has unusually large absolute deviations, its average rank will be higher.

The chi-square test statistic has the form:

$$X^2 = \frac{\sum_{i=1}^{k} n_i (\bar{a}_i - \bar{a})^2}{V^2}$$

Where:
- $k$ = number of groups
- $n_i$ = sample size in group $i$
- $\bar{a}_i$ = mean rank score in group $i$
- $\bar{a}$ = overall mean rank score
- $V^2$ = variance of the rank scores

[KEY INSIGHT]
**Median-centring is what makes Fligner-Killeen robust.** Subtracting each group's median (not its mean) means a single outlier cannot push the centre around. The mean shifts toward outliers; the median ignores them. That single design choice is why Fligner-Killeen survives heavy tails where Bartlett's test, which is built on the sample variance, falls apart.

**Try it:** Run the Fligner-Killeen test on the `chickwts` data, which records the weights of chicks fed six different feed types. Use the formula `weight ~ feed`. Save the result to `ex_chick`.

```r title="Your turn: Fligner-Killeen on chickwts"
# Try it: test homogeneity of variance across feed types
ex_chick <- # your code here

ex_chick
#> Expected: chi-squared statistic with df = 5 and a p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="chickwts solution"
ex_chick <- fligner.test(weight ~ feed, data = chickwts)
ex_chick
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  weight by feed
#> Fligner-Killeen:med chi-squared = 4.0744, df = 5, p-value = 0.539
```

**Explanation:** p = 0.54 is far above 0.05, so we have no evidence that the variance differs across feed types. A standard one-way ANOVA's equal-variance assumption looks safe here.

</details>

## How do you run fligner.test() in R?

`fligner.test()` accepts two interfaces. The first is the formula interface, where you write `y ~ g` and pass `data = your_df`. The second is the list interface, where you pass a list of numeric vectors, one per group. Both produce identical results, but the formula form is faster to type when your data is already in a tidy data frame.

Here is the formula interface on `PlantGrowth`, which compares plant weights under three conditions: `ctrl`, `trt1`, `trt2`.

```r title="Formula interface on PlantGrowth"
fk_plants <- fligner.test(weight ~ group, data = PlantGrowth)
fk_plants
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  weight by group
#> Fligner-Killeen:med chi-squared = 2.3499, df = 2, p-value = 0.3088
```

The p-value of 0.31 is comfortably above 0.05, so we have no evidence that the three groups have different variances. Plant weights spread out roughly equally under control and the two treatments.

Now the same data through the list interface. Use `split()` to break the numeric column into a list keyed by the grouping factor, then hand that list straight to `fligner.test()`.

```r title="List interface on PlantGrowth"
pg_list <- split(PlantGrowth$weight, PlantGrowth$group)
fk_plants_list <- fligner.test(pg_list)
fk_plants_list
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  pg_list
#> Fligner-Killeen:med chi-squared = 2.3499, df = 2, p-value = 0.3088
```

The chi-squared statistic, df, and p-value match the formula version exactly. Only the `data:` line in the printout changes, which reflects how you fed the data in.

[TIP]
**Prefer the formula interface for tidy data frames.** It is one line shorter and self-documenting, since the formula `weight ~ group` reads as "weight by group". Reach for the list interface only when your data already lives as separate vectors and you do not want to pack them into a data frame just to test variances.

**Try it:** Run `fligner.test()` on the `iris` dataset to test whether `Sepal.Length` has equal variance across the three `Species`. Use the formula interface and save the result to `ex_iris_fk`.

```r title="Your turn: Fligner-Killeen on iris"
# Try it: test Sepal.Length variance across Species
ex_iris_fk <- # your code here

ex_iris_fk
#> Expected: chi-squared with df = 2 and a p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris solution"
ex_iris_fk <- fligner.test(Sepal.Length ~ Species, data = iris)
ex_iris_fk
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  Sepal.Length by Species
#> Fligner-Killeen:med chi-squared = 1.3947, df = 2, p-value = 0.4979
```

**Explanation:** p = 0.50 indicates no evidence of unequal variance across species, so the equal-variance assumption holds for Sepal.Length.

</details>

## How do you interpret the p-value?

The decision rule is the same as any hypothesis test. Choose a significance level $\alpha$ (usually 0.05). If the p-value is below $\alpha$, reject the null and conclude variances differ. If it is at or above $\alpha$, you have no evidence to reject equal variances. Use that decision to choose between standard ANOVA (assumes equal variance), Welch's ANOVA (does not), or a transformation.

A boxplot makes the InsectSprays result visceral. Sprays C, D, and E hug the floor, while A, B, and F spread widely. The Fligner-Killeen p-value of 0.013 puts a number on what your eyes already see.

```r title="Visualise the variance differences"
library(ggplot2)
ggplot(InsectSprays, aes(x = spray, y = count, fill = spray)) +
  geom_boxplot(alpha = 0.7, show.legend = FALSE) +
  labs(title = "Insect counts by spray type",
       subtitle = "Spreads differ visibly across sprays",
       x = "Spray", y = "Insect count") +
  theme_minimal()

insect_p <- fk_insect$p.value
round(insect_p, 4)
#> [1] 0.0128
```

The boxplots back up the test. Sprays C and E have boxes only a few units tall, while A and F span a much wider range. Pulling out `$p.value` from the test object gives you the raw number for use in a report or for chaining into a downstream decision in your script.

Now check the test calibrates correctly under the null. Simulate three groups drawn from the same Normal distribution, where every variance is exactly 1. The p-value should land somewhere in [0, 1] with no bias toward small values.

```r title="Confirm null behaviour with a simulation"
set.seed(311)
g1 <- rnorm(40, mean = 0, sd = 1)
g2 <- rnorm(40, mean = 1, sd = 1)
g3 <- rnorm(40, mean = -1, sd = 1)

sim_y <- c(g1, g2, g3)
sim_g <- factor(rep(c("A", "B", "C"), each = 40))

fk_sim <- fligner.test(sim_y, sim_g)
round(fk_sim$p.value, 3)
#> [1] 0.788
```

p = 0.79 is well above 0.05, exactly as it should be when all three variances are truly identical. The means differ, but Fligner-Killeen ignores that; it tests spread, not location.

[WARNING]
**A non-significant Fligner-Killeen result is not proof of equal variances.** It only means you do not have enough evidence to declare them unequal. With small samples (n < 10 per group), the test has weak power and may fail to flag real differences. Always pair the p-value with a boxplot or a ratio of group standard deviations, and lean toward Welch's ANOVA whenever variance equality is in serious doubt.

**Try it:** Simulate three groups of size 25 from `rt(25, df = 3)` (heavy-tailed t-distribution), with the second group multiplied by 3 to inflate its scale. Run `fligner.test()` and check whether it detects the inflated variance. Save the test object to `ex_sim`.

```r title="Your turn: detect inflated variance"
# Try it: build heavy-tailed groups with one inflated, then test
set.seed(42)
ex_y_a <- rt(25, df = 3)
ex_y_b <- # write code: rt(25, df = 3) * 3
ex_y_c <- rt(25, df = 3)

ex_sim <- # write fligner.test() call

ex_sim
#> Expected: a small p-value (variance B is 9x A and C)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Inflated-variance solution"
set.seed(42)
ex_y_a <- rt(25, df = 3)
ex_y_b <- rt(25, df = 3) * 3
ex_y_c <- rt(25, df = 3)

ex_sim <- fligner.test(list(A = ex_y_a, B = ex_y_b, C = ex_y_c))
ex_sim
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  list(A = ex_y_a, B = ex_y_b, C = ex_y_c)
#> Fligner-Killeen:med chi-squared = 18.005, df = 2, p-value = 0.0001229
```

**Explanation:** The p-value is 0.0001, comfortably below 0.05. Fligner-Killeen catches the 9x variance inflation in group B even though the data has heavy t-distributed tails, where Bartlett's test would have produced a misleading result driven by the tails rather than the true scale difference.

</details>

## When should you use it instead of Bartlett's or Levene's?

R offers three tests for equal variance across groups: `bartlett.test()`, `car::leveneTest()`, and `fligner.test()`. They differ in what they assume and how they fail. The table below summarises the trade-offs.

| Test | Assumes normality? | Robust to outliers? | Power on Normal data | Recommended when |
|---|---|---|---|---|
| `bartlett.test()` | Yes (strong) | No | High | Data is clearly Normal and outlier-free |
| `car::leveneTest()` | No (centres on mean or median) | Moderate | Moderate | Mild departures from normality |
| `fligner.test()` | No (rank-based, median-centred) | High | Moderate | Heavy tails, skew, or outliers |

The simulation below shows the difference. Build three groups from a t-distribution with df = 3 (heavy tails) and identical scale. Bartlett's test should incorrectly flag a difference, because tails inflate the sample variance unevenly across groups. Fligner-Killeen should not.

```r title="Three tests on heavy-tailed data"
library(car)
set.seed(2026)
ht_y <- c(rt(40, df = 3),
          rt(40, df = 3),
          rt(40, df = 3))
ht_g <- factor(rep(c("A", "B", "C"), each = 40))

bart_ht <- bartlett.test(ht_y, ht_g)$p.value
lev_ht  <- leveneTest(ht_y ~ ht_g)$"Pr(>F)"[1]
flig_ht <- fligner.test(ht_y, ht_g)$p.value

c(Bartlett = bart_ht, Levene = lev_ht, Fligner = flig_ht)
#>   Bartlett     Levene    Fligner
#> 0.01024873 0.31845423 0.40789108
```

Bartlett's test returns p = 0.01, falsely declaring unequal variances. The three groups all have the same true scale; Bartlett is fooled by the heavy tails. Levene (p = 0.32) and Fligner-Killeen (p = 0.41) correctly fail to reject. On heavy-tailed data, Bartlett's test inflates the false-positive rate, which is exactly the failure mode Fligner-Killeen was designed to fix.

[KEY INSIGHT]
**Median ranks beat means for outlier robustness.** Bartlett works on raw sample variances, so a single outlier changes its statistic dramatically. Levene works on absolute deviations from the group mean (or median, with `center = "median"`), so outliers still pull the centre. Fligner-Killeen works on the *ranks* of those deviations, where an outlier just becomes "the largest rank" and stops mattering. That is why it survives the heaviest tails.

**Try it:** Use `airquality` to test whether `Ozone` has equal variance across `Month`. Run all three tests and save the three p-values into a named vector called `ex_air`. (Hint: filter out NAs first with `na.omit()`.)

```r title="Your turn: three tests on airquality"
# Try it: bartlett, levene, and fligner on the same data
aq <- na.omit(airquality)
aq$Month <- factor(aq$Month)

ex_bart <- # bartlett.test(...)
ex_lev  <- # leveneTest(...)
ex_flig <- # fligner.test(...)

ex_air <- c(Bartlett = ex_bart$p.value,
            Levene = ex_lev$"Pr(>F)"[1],
            Fligner = ex_flig$p.value)
round(ex_air, 4)
#> Expected: three p-values, with at least one near zero (Ozone is famously skewed)
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality solution"
aq <- na.omit(airquality)
aq$Month <- factor(aq$Month)

ex_bart <- bartlett.test(Ozone ~ Month, data = aq)
ex_lev  <- leveneTest(Ozone ~ Month, data = aq)
ex_flig <- fligner.test(Ozone ~ Month, data = aq)

ex_air <- c(Bartlett = ex_bart$p.value,
            Levene = ex_lev$"Pr(>F)"[1],
            Fligner = ex_flig$p.value)
round(ex_air, 4)
#> Bartlett   Levene  Fligner
#>   0.0000   0.0030   0.0098
```

**Explanation:** All three tests agree the variances differ across months, but Bartlett's p-value is dramatically smaller than the other two. That gap is a fingerprint of skewed data: Bartlett over-rejects because Ozone is right-skewed. The Fligner-Killeen p (0.0098) is the most defensible number to report.

</details>

## What if variances are unequal?

A small Fligner-Killeen p-value tells you *not* to use a standard one-way ANOVA, because its F-test assumes equal variances and will produce wrong p-values otherwise. You have three good options.

**Welch's ANOVA** is the simplest fix. It modifies the F-test to account for unequal variances and gives you back a valid p-value with very little effort. Use `oneway.test(..., var.equal = FALSE)`. **A transformation** like `log()` or `sqrt()` can stabilise variance when the unequal spread is driven by skew. **Kruskal-Wallis** is the right call when both location *and* spread differ, since it tests for any distributional difference between groups.

Here is Welch's ANOVA on the InsectSprays data, where Fligner-Killeen rejected equal variance.

```r title="Welch ANOVA when variance is unequal"
welch_insect <- oneway.test(count ~ spray, data = InsectSprays, var.equal = FALSE)
welch_insect
#>
#>  One-way analysis of means (not assuming equal variances)
#>
#> data:  count and spray
#> F = 36.065, num df = 5.000, denom df = 30.043, p-value = 7.999e-12
```

p = 8e-12 says the spray means really do differ. Welch handled the unequal variance flagged by Fligner-Killeen automatically, by adjusting the denominator degrees of freedom from the standard ANOVA's 66 down to 30, which keeps the test honest. You did not need to transform the data or switch to a rank test, just flip one argument.

[NOTE]
**When Welch is not enough, drop to a nonparametric test.** If the groups have different shapes (one skewed left, another skewed right), Welch's ANOVA still assumes a common shape, which fails. In that case use `kruskal.test()`, which makes no shape assumption. The decision is laid out in detail in [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html), the parent post for this article.

**Try it:** PlantGrowth passed the Fligner-Killeen check earlier, so a standard ANOVA is fine. Still, run Welch's ANOVA on it as a robust default and save the test object to `ex_pg_welch`. The p-value should be similar to a regular `aov()`.

```r title="Your turn: Welch ANOVA on PlantGrowth"
# Try it: run Welch ANOVA on weight ~ group
ex_pg_welch <- # your code here

ex_pg_welch
#> Expected: F-statistic and p-value testing equality of plant weight means
```

<details>
<summary>Click to reveal solution</summary>

```r title="PlantGrowth Welch solution"
ex_pg_welch <- oneway.test(weight ~ group, data = PlantGrowth, var.equal = FALSE)
ex_pg_welch
#>
#>  One-way analysis of means (not assuming equal variances)
#>
#> data:  weight and group
#> F = 5.181, num df = 2.000, denom df = 17.128, p-value = 0.01739
```

**Explanation:** p = 0.017, similar to what `aov()` would produce here. Welch's adjustment is mild because Fligner-Killeen confirmed the variances were already comparable. Welch makes a great default for one-way comparisons, since it costs you almost nothing when variances are equal but saves you when they are not.

</details>

## Practice Exercises

### Exercise 1: Fligner-Killeen vs Bartlett under skew

Generate three groups of size 50 from a chi-squared distribution with 2 df (right-skewed, all the same true scale). Run both Bartlett and Fligner-Killeen. Save Bartlett's p-value to `my_bart_p` and Fligner-Killeen's p-value to `my_flig_p`. Bartlett should over-reject because of the skew.

```r title="Exercise: Bartlett vs Fligner under skew"
# Hint: rchisq(50, df = 2) gives a right-skewed sample
set.seed(99)


# Save:
my_bart_p <- NULL  # Bartlett's p-value
my_flig_p <- NULL  # Fligner-Killeen's p-value

c(Bartlett = my_bart_p, Fligner = my_flig_p)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Skew exercise solution"
set.seed(99)
my_y <- c(rchisq(50, df = 2),
          rchisq(50, df = 2),
          rchisq(50, df = 2))
my_g <- factor(rep(c("X", "Y", "Z"), each = 50))

my_bart_p <- bartlett.test(my_y, my_g)$p.value
my_flig_p <- fligner.test(my_y, my_g)$p.value

round(c(Bartlett = my_bart_p, Fligner = my_flig_p), 3)
#> Bartlett  Fligner
#>    0.072    0.812
```

**Explanation:** Bartlett's p = 0.072 is borderline and would flip to "significant" with a slightly different seed. Fligner's p = 0.81 is rock-solid: it correctly says the variances are equal, despite the skew. On any real-world right-skewed data (waiting times, counts, incomes), Bartlett's false-positive rate is unsafe and Fligner is the right default.

</details>

### Exercise 2: Real-data workflow with Welch fallback

Use `airquality`. Test whether `Ozone` variance differs by `Month` with Fligner-Killeen. If the test rejects equal variance, run Welch's ANOVA. Save the Fligner p-value to `my_flig_air` and the Welch p-value to `my_welch_p`.

```r title="Exercise: airquality workflow"
# Hint: na.omit() first; convert Month to a factor
my_air <- na.omit(airquality)
my_air$Month <- factor(my_air$Month)

# Step 1: variance check
my_flig_air <- NULL

# Step 2: if my_flig_air < 0.05, run Welch ANOVA
my_welch_p <- NULL

c(Fligner_p = my_flig_air, Welch_p = my_welch_p)
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality workflow solution"
my_air <- na.omit(airquality)
my_air$Month <- factor(my_air$Month)

my_flig_air <- fligner.test(Ozone ~ Month, data = my_air)$p.value
my_welch_p  <- oneway.test(Ozone ~ Month, data = my_air, var.equal = FALSE)$p.value

round(c(Fligner_p = my_flig_air, Welch_p = my_welch_p), 4)
#> Fligner_p   Welch_p
#>    0.0098    0.0000
```

**Explanation:** Fligner-Killeen flags unequal variance (p = 0.010), so a standard `aov()` is unsafe. Welch's ANOVA returns p < 0.0001, which is a defensible result that does not assume equal variances. This two-step workflow is the standard pattern: check variance, then either keep ANOVA or switch to Welch.

</details>

## Complete Example

End-to-end on `mtcars`: does fuel efficiency (`mpg`) have equal variance across cylinder counts (`cyl`)? Test, decide, then choose the right group-mean comparison.

```r title="Complete workflow on mtcars"
mt <- mtcars
mt$cyl <- factor(mt$cyl)

mt_fk <- fligner.test(mpg ~ cyl, data = mt)
mt_fk
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  mpg by cyl
#> Fligner-Killeen:med chi-squared = 6.6605, df = 2, p-value = 0.03578

mt_welch <- oneway.test(mpg ~ cyl, data = mt, var.equal = FALSE)
round(mt_welch$p.value, 6)
#> [1] 1.7e-05

cat("Fligner-Killeen p =", round(mt_fk$p.value, 4),
    "→ variances differ. Welch ANOVA p =",
    format(mt_welch$p.value, scientific = TRUE, digits = 3),
    "→ mpg means differ across cyl groups.\n")
#> Fligner-Killeen p = 0.0358 → variances differ. Welch ANOVA p = 1.74e-05 → mpg means differ across cyl groups.
```

Three lines of decision-relevant output. Fligner-Killeen rejects equal variance at p = 0.036, so we move from `aov()` to `oneway.test(..., var.equal = FALSE)`. Welch returns p ≈ 1.7e-5, an emphatic rejection of equal mpg means across cylinder counts. The whole workflow, from assumption check to final inference, fits in three function calls.

[TIP]
**`fligner.test()` drops missing values silently.** The default `na.action = na.omit` removes any row with `NA` in either the response or the grouping variable before testing. That is usually what you want, but if you have heavy missingness, run `summary(your_df)` first to confirm you are not dropping a meaningful chunk of the sample.

## Summary

| Question | Answer |
|---|---|
| What does it test? | Whether the variances of two or more groups are equal. |
| What does it assume? | Independent observations within and across groups. *No* normality required. |
| When should I use it? | When residuals are non-normal, heavy-tailed, or have outliers, where Bartlett over-rejects. |
| How do I run it? | `fligner.test(y ~ g, data = your_df)` or `fligner.test(list_of_vectors)`. |
| How do I interpret the p-value? | p < 0.05 → variances differ. p ≥ 0.05 → no evidence of difference (not proof of equality). |
| What if variances differ? | Use `oneway.test(..., var.equal = FALSE)` (Welch ANOVA), or transform, or switch to Kruskal-Wallis. |

The Fligner-Killeen test is your default homogeneity-of-variance check whenever you cannot fully trust the normality of your data. It costs nothing to run, ships with base R, and stays calibrated under the heavy tails that wreck Bartlett's test.

## References

1. Fligner, M. A., & Killeen, T. J. (1976). "Distribution-free two-sample tests for scale." *Journal of the American Statistical Association* 71(353), 210–213. [Link](https://www.jstor.org/stable/2285771)
2. Conover, W. J., Johnson, M. E., & Johnson, M. M. (1981). "A comparative study of tests for homogeneity of variances, with applications to the outer continental shelf bidding data." *Technometrics* 23(4), 351–361. [Link](https://www.jstor.org/stable/1268225)
3. R Core Team. `fligner.test()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/fligner.test.html)
4. R Core Team. `oneway.test()` documentation (Welch's ANOVA). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html)
5. Fox, J., & Weisberg, S. (2019). *An R Companion to Applied Regression*, 3rd ed. Sage. [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
6. Crawley, M. J. (2013). *The R Book*, 2nd ed. Wiley. Chapter 11: Analysis of Variance. [Link](https://www.wiley.com/en-us/The+R+Book%2C+2nd+Edition-p-9780470973929)
7. Wilcox, R. R. (2022). *Introduction to Robust Estimation and Hypothesis Testing*, 5th ed. Academic Press.

## Continue Learning

1. [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html). The parent decision guide. When variance fails *and* shape differs, this article walks you to the right rank-based test.
2. [Normality and Variance Tests in R](Normality-and-Variance-Tests-in-R.html). Pairs Fligner-Killeen with Shapiro-Wilk, Anderson-Darling, and Bartlett in a complete pre-ANOVA assumption-checking workflow.
3. [Kruskal-Wallis Test in R](Kruskal-Wallis-Test-in-R.html). The rank-based one-way ANOVA alternative, the right move when groups differ in shape as well as scale.
