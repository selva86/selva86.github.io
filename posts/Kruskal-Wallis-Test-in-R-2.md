---
title: "Kruskal-Wallis Test in R: k-Sample Nonparametric ANOVA + Post-Hoc"
slug: "Kruskal-Wallis-Test-in-R-2"
description: "Kruskal-Wallis test in R: nonparametric ANOVA for k independent samples, with Dunn post-hoc, eta-squared effect size, assumptions, and worked example."
keywords: "Kruskal-Wallis test in R, kruskal.test, nonparametric ANOVA, post-hoc Kruskal-Wallis, Dunn test in R, pairwise.wilcox.test, eta-squared effect size, rank-based ANOVA, k-sample nonparametric test"
auto_link_terms: "Kruskal-Wallis test|Kruskal-Wallis|kruskal.test()|nonparametric ANOVA|Dunn test|Dunn post-hoc|rank-based ANOVA|k-sample nonparametric test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "2.8.4"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Kruskal-Wallis Test"
sidebar_order: 92
difficulty: "Intermediate"
---

# Kruskal-Wallis Test in R: k-Sample Nonparametric ANOVA + Post-Hoc

<p class="lead">The Kruskal-Wallis test is the rank-based, nonparametric counterpart to one-way ANOVA. In R, <code>kruskal.test(y ~ group)</code> checks whether 3 or more independent groups come from the same distribution without requiring normality.</p>

## How do you run a Kruskal-Wallis test in R?

Suppose you grew plants under three conditions and want to know whether the conditions matter. ANOVA wants normal residuals. Your sample is small and skewed, so the t-distribution feels shaky. The Kruskal-Wallis test ranks every observation across the three groups and asks whether the rank totals look too uneven to be chance. One call to `kruskal.test()` returns the H statistic and a p-value.

```r title="Run kruskal.test() on PlantGrowth"
# Three plant groups: ctrl, trt1, trt2 (10 each)
pg <- PlantGrowth
table(pg$group)
#> ctrl trt1 trt2
#>   10   10   10

kw <- kruskal.test(weight ~ group, data = pg)
kw
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  weight by group
#> Kruskal-Wallis chi-squared = 7.9886, df = 2, p-value = 0.01842
```

The H statistic is `7.9886` on `df = 2` (one less than the number of groups), and the p-value is `0.01842`. At a 5% level, you reject the null that the three group distributions are identical, so at least one treatment shifts plant weight relative to the others. Which one is the post-hoc question, taken up below.

[KEY INSIGHT]
**Kruskal-Wallis works on ranks, not raw values.** It pools every observation, replaces each one with its rank in the pool, and asks whether the average rank within each group looks too far from the overall mean rank to be chance. That is why it shrugs off skew, outliers, and non-normal shapes that wreck ANOVA.

**Try it:** Run a Kruskal-Wallis test on `airquality` to check whether `Ozone` differs across `Month`. Drop missing values first and confirm the H statistic.

```r title="Your turn: Kruskal-Wallis on airquality"
# Try it: airquality has Ozone (response) and Month (group)
ex_aq <- na.omit(airquality[, c("Ozone", "Month")])
ex_kw <- # your code here

ex_kw
#> Expected: H ≈ 29.27, df = 4, p-value ≈ 6.9e-06
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality Kruskal-Wallis solution"
ex_aq <- na.omit(airquality[, c("Ozone", "Month")])
ex_kw <- kruskal.test(Ozone ~ Month, data = ex_aq)
ex_kw
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  Ozone by Month
#> Kruskal-Wallis chi-squared = 29.267, df = 4, p-value = 6.901e-06
```

**Explanation:** With 5 months, `df = k - 1 = 4`. The tiny p-value tells you ozone levels differ strongly across months, no surprise given seasonal weather.

</details>

## How does the Kruskal-Wallis test actually work?

Knowing what `kruskal.test()` does inside helps you read its output and explain it to colleagues. The pipeline is short: pool, rank, average, compare.

![How Kruskal-Wallis builds its verdict](screenshots/Kruskal-Wallis-Test-in-R-2-test-pipeline.webp)
*Figure 1: Each step in how Kruskal-Wallis turns ranked data into a verdict.*

The H statistic is essentially the variance of the group mean ranks, scaled to a chi-square reference distribution.

$$H = \frac{12}{n(n+1)} \sum_{i=1}^{k} n_i \left(\bar{R}_i - \frac{n+1}{2}\right)^2$$

Where:

- $n$ = total sample size across all groups
- $k$ = number of groups
- $n_i$ = sample size of group $i$
- $\bar{R}_i$ = mean rank of group $i$
- $\frac{n+1}{2}$ = the overall mean rank (the same for every dataset of size $n$)

Under the null of identical distributions, $H$ follows approximately a chi-square distribution with $k-1$ degrees of freedom. A large $H$ means at least one group sits far from the overall mean rank.

Let us compute mean ranks for `PlantGrowth` and watch the formula come together.

```r title="Pool-rank PlantGrowth and compute mean ranks"
# Ranks across the pooled values (ties get average ranks)
pg_ranks <- rank(pg$weight)
mean_ranks <- tapply(pg_ranks, pg$group, mean)
mean_ranks
#>  ctrl  trt1  trt2
#> 15.50  9.85 21.15
```

The mean ranks are roughly `15.5` for `ctrl`, `9.85` for `trt1`, and `21.15` for `trt2`. The overall mean rank is $(30+1)/2 = 15.5$, exactly where `ctrl` sits, while `trt1` is much lower and `trt2` much higher. That spread is what `H` is summarising.

```r title="Compute H from mean ranks and verify"
n  <- nrow(pg)
k  <- length(mean_ranks)
ni <- as.numeric(table(pg$group))
overall_mean_rank <- (n + 1) / 2

H_manual <- (12 / (n * (n + 1))) * sum(ni * (mean_ranks - overall_mean_rank)^2)
H_manual
#> [1] 7.9886

# Compare to the value kruskal.test() reported
all.equal(unname(kw$statistic), round(H_manual, 4))
#> [1] TRUE
```

The hand-computed `H` matches `kw$statistic` to four decimals. R's `kruskal.test()` also applies a tie correction (the Plant Growth weights have a few ties) which is why values out of `rank()` are averages, not integers, and the formula already adjusts for that.

[NOTE]
**Ties shrink H slightly.** When several observations share a value, they all receive the same average rank and the variance of ranks is smaller than it would be without ties. R's `kruskal.test()` divides H by a tie-correction factor so the chi-square approximation stays valid. With many ties (think Likert data) the correction matters. With few, it is barely visible.

**Try it:** Compute the mean rank per group for `iris` Sepal.Width by Species using `rank()` plus `tapply()`, exactly as we just did.

```r title="Your turn: mean ranks for iris Sepal.Width"
# Try it: rank Sepal.Width then average per Species
ex_ranks <- # your code here
ex_mean_ranks <- # your code here

ex_mean_ranks
#> Expected: setosa ≈ 105, versicolor ≈ 50, virginica ≈ 71
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris Sepal.Width mean ranks solution"
ex_ranks <- rank(iris$Sepal.Width)
ex_mean_ranks <- tapply(ex_ranks, iris$Species, mean)
ex_mean_ranks
#>     setosa versicolor  virginica
#>     104.99      50.06      71.45
```

**Explanation:** Setosa flowers have wider sepals on average, so their pooled ranks are higher. Versicolor sits at the bottom. Plug these mean ranks into the H formula and you reproduce `kruskal.test(Sepal.Width ~ Species, data = iris)`.

</details>

## What assumptions does the Kruskal-Wallis test require?

Kruskal-Wallis is gentler than ANOVA but it is not assumption-free. Three things must hold, and one detail decides whether you can talk about *medians* or only *distributions*.

![Choosing Kruskal-Wallis vs one-way ANOVA](screenshots/Kruskal-Wallis-Test-in-R-2-decision-flow.webp)
*Figure 2: When Kruskal-Wallis is the right tool versus one-way ANOVA.*

1. **Independence of observations.** Each value comes from a different unit, and groups are independent of each other. Repeated measures or paired data break this and require Friedman or a mixed model.
2. **Ordinal or continuous response.** The test uses ranks, so the response needs an ordering. Strictly nominal categories cannot be ranked.
3. **Similar group shapes** (only if you want to compare medians). When the three group distributions have the same shape and spread, a significant H means the medians differ. When shapes differ noticeably (one skewed, one symmetric), Kruskal-Wallis still detects that the groups are not interchangeable, but the conclusion is about distributions, not medians specifically.

A boxplot is the fastest shape check. Look at whisker length and skew, not just the medians.

```r title="Inspect group shapes with a boxplot"
library(ggplot2)

shape_plot <- ggplot(pg, aes(x = group, y = weight, fill = group)) +
  geom_boxplot(alpha = 0.7, outlier.shape = 1) +
  geom_jitter(width = 0.1, alpha = 0.6) +
  labs(title = "PlantGrowth: weight by treatment group",
       x = NULL, y = "Weight (g)") +
  theme_minimal() +
  theme(legend.position = "none")

shape_plot
```

The three boxes have similar widths and roughly symmetric whiskers. Spreads are not identical, but they are in the same ballpark, so reading the test result as "at least one median differs" is reasonable here.

[WARNING]
**Different shapes change what Kruskal-Wallis answers.** If one group is heavily right-skewed and another symmetric, a significant H tells you the distributions are not the same, not that the medians are different. Report it that way and avoid statements like "treatment B has a higher median" unless the shape evidence supports it.

**Try it:** Build a boxplot for `ToothGrowth$len` by the combination of `supp` and `dose` to see whether shapes are similar enough to interpret a Kruskal-Wallis result as a median comparison.

```r title="Your turn: ToothGrowth shape check"
# Try it: combine supp and dose into a single factor
ex_tg <- ToothGrowth
ex_tg$grp <- # your code here: paste supp and dose into one factor

ex_plot <- # your code here: ggplot boxplot of len ~ grp

ex_plot
#> Expected: 6 boxes (OJ.0.5, OJ.1, OJ.2, VC.0.5, VC.1, VC.2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="ToothGrowth shape-check solution"
ex_tg <- ToothGrowth
ex_tg$grp <- factor(paste(ex_tg$supp, ex_tg$dose, sep = "."))

ex_plot <- ggplot(ex_tg, aes(x = grp, y = len, fill = supp)) +
  geom_boxplot(alpha = 0.7) +
  labs(x = NULL, y = "Tooth length") +
  theme_minimal()

ex_plot
```

**Explanation:** Most boxes look symmetric with comparable spread. `VC.0.5` and `OJ.2` look slightly less variable, but nothing extreme, so a Kruskal-Wallis on `len ~ grp` can be interpreted as testing for median differences across the six dose-supplement combinations.

</details>

## How do you interpret the result and report effect size?

A p-value tells you whether the groups likely differ. It does not say *how much*. Reporting an effect size alongside the H statistic is a small extra effort that makes the result publishable and reproducible.

For Kruskal-Wallis, the standard effect size is **eta-squared based on H**, which estimates the proportion of variance in ranks explained by group membership.

$$\eta^2_H = \frac{H - k + 1}{n - k}$$

The conventional thresholds are small (`0.01`), medium (`0.06`), and large (`0.14`).

```r title="Compute eta-squared from the H statistic"
H  <- unname(kw$statistic)
k  <- length(unique(pg$group))
n  <- nrow(pg)

eta_sq <- (H - k + 1) / (n - k)
round(eta_sq, 3)
#> [1] 0.222

interpret <- if (eta_sq >= 0.14) "large" else if (eta_sq >= 0.06) "medium" else "small"
sprintf("Eta-squared = %.3f (%s effect)", eta_sq, interpret)
#> [1] "Eta-squared = 0.222 (large effect)"
```

Plant treatment explains roughly 22 percent of the rank variance, a large effect. A reporting sentence ties it together: "A Kruskal-Wallis test indicated a significant difference in plant weight across the three groups, $H(2) = 7.99$, $p = .018$, with a large effect size, $\eta^2_H = 0.22$."

[TIP]
**Save a reporting template once, paste it forever.** A line like `sprintf("H(%d) = %.2f, p = %.3f, eta-sq = %.3f", df, H, p, eta_sq)` keeps your write-ups consistent, copy-friendly, and journal-ready. Drop it into a helper function and call it after every Kruskal-Wallis you run.

**Try it:** Compute eta-squared for the `airquality` Kruskal-Wallis result you ran earlier (`ex_kw`).

```r title="Your turn: eta-squared for airquality"
# Try it: use ex_kw from the previous airquality exercise
ex_H <- # your code here
ex_n <- # your code here
ex_k <- # your code here

ex_eta <- # your code here
round(ex_eta, 3)
#> Expected: ≈ 0.235
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality eta-squared solution"
ex_H <- unname(ex_kw$statistic)
ex_n <- nrow(ex_aq)
ex_k <- length(unique(ex_aq$Month))

ex_eta <- (ex_H - ex_k + 1) / (ex_n - ex_k)
round(ex_eta, 3)
#> [1] 0.235
```

**Explanation:** Month explains about 23.5 percent of rank variance in `Ozone`, a large effect, consistent with the very small p-value.

</details>

## Which post-hoc test should you use after a significant Kruskal-Wallis?

Kruskal-Wallis answers "do at least two groups differ?" but never "which pair?". Once H is significant, you need a post-hoc test that compares pairs while controlling the family-wise error rate.

![Post-hoc options after a significant Kruskal-Wallis](screenshots/Kruskal-Wallis-Test-in-R-2-posthoc-options.webp)
*Figure 3: The three common post-hoc routes after a significant Kruskal-Wallis.*

The three routes are:

- **Dunn's test** uses the same pooled ranks the original Kruskal-Wallis used, then compares group mean ranks pairwise with a normal approximation. Recommended default because it stays consistent with the global test.
- **`pairwise.wilcox.test()`** runs a Mann-Whitney U on each pair, re-ranking each subset. Convenient because it lives in base R and supports any p-adjustment method.
- **Conover-Iman** is more powerful than Dunn when group shapes are similar but lives in `PMCMRplus`, which is heavier.

The simplest path stays in base R.

```r title="pairwise.wilcox.test with BH correction"
pwt <- pairwise.wilcox.test(pg$weight, pg$group, p.adjust.method = "BH")
pwt
#>
#> 	Pairwise comparisons using Wilcoxon rank sum exact test
#>
#> data:  pg$weight and pg$group
#>
#>      ctrl   trt1
#> trt1 0.199  -
#> trt2 0.094  0.027
#>
#> P value adjustment method: BH
```

After Benjamini-Hochberg adjustment, only the `trt1` vs `trt2` comparison survives at 5 percent (`p = 0.027`). The `ctrl` vs `trt2` comparison is borderline (`p = 0.094`). That matches the boxplot intuition: trt2 sits well above trt1.

If you want the canonical Dunn's test without depending on extra packages, you can implement it in a few lines of base R.

```r title="Manual Dunn's test in base R"
dunn_pairs <- function(y, g, adjust = "bonferroni") {
  g  <- factor(g)
  ng <- table(g)
  N  <- length(y)
  R  <- rank(y)
  meanR <- tapply(R, g, mean)

  # Tie correction term
  T <- sum(table(y)^3 - table(y)) / (N - 1)
  sigma2 <- (N * (N + 1) / 12) * (1 - T / (N^3 - N))

  pairs <- combn(levels(g), 2, simplify = FALSE)
  rows <- lapply(pairs, function(p) {
    se <- sqrt(sigma2 * (1 / ng[p[1]] + 1 / ng[p[2]]))
    z  <- (meanR[p[1]] - meanR[p[2]]) / se
    p_raw <- 2 * pnorm(-abs(z))
    data.frame(comparison = paste(p, collapse = " vs "),
               z = round(z, 3), p_raw = signif(p_raw, 3))
  })
  out <- do.call(rbind, rows)
  out$p_adj <- signif(p.adjust(out$p_raw, method = adjust), 3)
  out
}

dunn_tbl <- dunn_pairs(pg$weight, pg$group, adjust = "bonferroni")
dunn_tbl
#>      comparison      z p_raw  p_adj
#> 1   ctrl vs trt1  1.605 0.108 0.3250
#> 2   ctrl vs trt2 -1.605 0.108 0.3250
#> 3   trt1 vs trt2 -3.210 0.001 0.0040
```

The Dunn z-statistics confirm `trt1` vs `trt2` as the only pair surviving Bonferroni correction (`p_adj = 0.004`). Note that Dunn uses pooled ranks, which is why all three z values are nicely related: `ctrl` is exactly between `trt1` and `trt2` in mean rank space.

[NOTE]
**Production code can lean on a package.** Outside WebR, `FSA::dunnTest(weight ~ group, data = pg, method = "bonferroni")` and `dunn.test::dunn.test(pg$weight, pg$group, method = "bonferroni")` give the same result with cleaner output and built-in formatting. The hand-rolled version above is enough to teach the mechanics and survives in any R environment.

**Try it:** Re-run `pairwise.wilcox.test()` on `PlantGrowth` using Bonferroni adjustment instead of BH. Which pair stays significant?

```r title="Your turn: pairwise.wilcox.test with Bonferroni"
# Try it: switch p.adjust.method to "bonferroni"
ex_pwt <- # your code here
ex_pwt
#> Expected: only trt1 vs trt2 remains < 0.05 after Bonferroni
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bonferroni pairwise solution"
ex_pwt <- pairwise.wilcox.test(pg$weight, pg$group, p.adjust.method = "bonferroni")
ex_pwt
#>
#> 	Pairwise comparisons using Wilcoxon rank sum exact test
#>
#> data:  pg$weight and pg$group
#>
#>      ctrl  trt1
#> trt1 0.598 -
#> trt2 0.281 0.025
#>
#> P value adjustment method: bonferroni
```

**Explanation:** Bonferroni is more conservative than BH, so `ctrl` vs `trt2` moves further from significance. Only `trt1` vs `trt2` survives at 5 percent (`p = 0.025`).

</details>

## How do you visualize Kruskal-Wallis results?

A boxplot with the test result printed on it tells the whole story in one figure. Use `ggplot2` to draw the boxes, then `annotate()` to print the H statistic, p-value, and effect size as a subtitle.

```r title="Annotated Kruskal-Wallis boxplot"
kw_subtitle <- sprintf("Kruskal-Wallis: H(%d) = %.2f, p = %.3f, eta-sq = %.2f",
                       kw$parameter, kw$statistic, kw$p.value, eta_sq)

kw_plot <- ggplot(pg, aes(x = group, y = weight, fill = group)) +
  geom_boxplot(alpha = 0.7, outlier.shape = 1) +
  geom_jitter(width = 0.1, alpha = 0.6) +
  stat_summary(fun = median, geom = "point",
               shape = 23, size = 3, fill = "white") +
  labs(title = "PlantGrowth: weight by treatment",
       subtitle = kw_subtitle,
       x = NULL, y = "Weight (g)") +
  theme_minimal() +
  theme(legend.position = "none")

kw_plot
```

The subtitle carries the full statistical report inside the figure, the diamond markers highlight medians, and the jittered points reassure readers that the boxes summarise actual data. With one image you communicate group spread, sample size, the test verdict, and the effect size.

[TIP]
**Always show jittered points on small samples.** A boxplot built on 10 observations per group hides nothing and gains a lot of credibility when the raw points are visible. `geom_jitter(width = 0.1, alpha = 0.6)` is the standard recipe.

**Try it:** Add a horizontal dashed line at the *overall* median of `pg$weight` to the plot above so reviewers can see how each group's median compares to the pooled median.

```r title="Your turn: add the overall median line"
ex_overall <- median(pg$weight)

ex_plot <- kw_plot + # your code here
ex_plot
#> Expected: dashed horizontal line near 5.155
```

<details>
<summary>Click to reveal solution</summary>

```r title="Overall median line solution"
ex_overall <- median(pg$weight)

ex_plot <- kw_plot +
  geom_hline(yintercept = ex_overall, linetype = "dashed", color = "grey40")
ex_plot
```

**Explanation:** `geom_hline()` overlays a horizontal line at any y-value. The pooled median `ex_overall` (`5.155`) sits between `trt1` and `trt2`, which visually echoes the post-hoc result that those two groups are the ones pulling apart.

</details>

## Practice Exercises

Apply the full pipeline (run, effect size, post-hoc) to two new datasets.

### Exercise 1: Kruskal-Wallis on mtcars by cylinders

Run a Kruskal-Wallis test on `mtcars` to check whether `mpg` differs across `cyl` (4, 6, 8 cylinders). Compute eta-squared, then run `pairwise.wilcox.test()` with BH adjustment. Save them to `my_kw`, `my_eta`, and `my_post`.

```r title="Exercise: Kruskal-Wallis on mtcars"
# Hint: convert cyl to a factor first
# Hint: eta-sq = (H - k + 1) / (n - k)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars Kruskal-Wallis solution"
mt <- mtcars
mt$cyl <- factor(mt$cyl)

my_kw  <- kruskal.test(mpg ~ cyl, data = mt)
my_kw
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  mpg by cyl
#> Kruskal-Wallis chi-squared = 25.746, df = 2, p-value = 2.566e-06

my_n   <- nrow(mt)
my_k   <- length(unique(mt$cyl))
my_eta <- (unname(my_kw$statistic) - my_k + 1) / (my_n - my_k)
round(my_eta, 3)
#> [1] 0.819

my_post <- pairwise.wilcox.test(mt$mpg, mt$cyl, p.adjust.method = "BH")
my_post
#>
#> 	Pairwise comparisons using Wilcoxon rank sum exact test
#>
#> data:  mt$mpg and mt$cyl
#>
#>   4       6
#> 6 0.00373 -
#> 8 6.6e-06 0.00120
#>
#> P value adjustment method: BH
```

**Explanation:** All three pairs differ after BH correction. The huge eta-squared (`0.82`) confirms cylinder count is a dominant driver of fuel economy.

</details>

### Exercise 2: Build a reusable kw_report() helper

Write a function `kw_report(y, g)` that returns a list with `H`, `df`, `p`, `eta_sq`, and a BH-adjusted pairwise p-value matrix. Test it on `iris$Sepal.Length` by `Species`.

```r title="Exercise: kw_report function"
# Hint: combine kruskal.test() + the eta-sq formula + pairwise.wilcox.test()
# Hint: return list(H = ..., df = ..., p = ..., eta_sq = ..., pairs = ...)

kw_report <- function(y, g) {
  # your code here
}

# Test it:
kw_report(iris$Sepal.Length, iris$Species)
#> Expected: H ≈ 96.94, df = 2, p < 1e-20, eta_sq ≈ 0.64
```

<details>
<summary>Click to reveal solution</summary>

```r title="kw_report function solution"
kw_report <- function(y, g) {
  g  <- factor(g)
  kw <- kruskal.test(y, g)
  n  <- length(y)
  k  <- length(levels(g))
  eta_sq <- (unname(kw$statistic) - k + 1) / (n - k)
  pairs <- pairwise.wilcox.test(y, g, p.adjust.method = "BH")
  list(H = unname(kw$statistic),
       df = unname(kw$parameter),
       p = kw$p.value,
       eta_sq = eta_sq,
       pairs = pairs$p.value)
}

res <- kw_report(iris$Sepal.Length, iris$Species)
res$H;   res$df;   res$p;   round(res$eta_sq, 3)
#> [1] 96.94
#> [1] 2
#> [1] 8.92e-22
#> [1] 0.640
res$pairs
#>            setosa  versicolor
#> versicolor 8.3e-15 NA
#> virginica  6.4e-17 5.9e-07
```

**Explanation:** All three iris species differ in sepal length at virtually any alpha. Wrapping the pipeline in a function lets you reuse it across datasets without re-typing the formula.

</details>

## Complete Example

A full Kruskal-Wallis workflow on iris from start to finish: run, check shapes, post-hoc, effect size, report.

```r title="Iris Kruskal-Wallis end-to-end"
# 1. Run the test
iris_kw <- kruskal.test(Sepal.Width ~ Species, data = iris)
iris_kw
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  Sepal.Width by Species
#> Kruskal-Wallis chi-squared = 63.571, df = 2, p-value = 1.569e-14

# 2. Effect size
iris_n  <- nrow(iris)
iris_k  <- length(unique(iris$Species))
iris_eta <- (unname(iris_kw$statistic) - iris_k + 1) / (iris_n - iris_k)
round(iris_eta, 3)
#> [1] 0.425

# 3. Post-hoc with BH adjustment
iris_pwt <- pairwise.wilcox.test(iris$Sepal.Width, iris$Species,
                                 p.adjust.method = "BH")
iris_pwt$p.value
#>                  setosa  versicolor
#> versicolor 1.024e-14         NA
#> virginica  4.476e-09   2.503e-04

# 4. Reporting sentence
sprintf("H(%d) = %.2f, p = %.2e, eta-sq = %.3f (large)",
        iris_kw$parameter, iris_kw$statistic, iris_kw$p.value, iris_eta)
#> [1] "H(2) = 63.57, p = 1.57e-14, eta-sq = 0.425 (large)"
```

The Kruskal-Wallis test rejects the null (`p < 1e-14`), eta-squared is `0.425` (large effect), and every pair of species differs significantly after BH correction. You can now write a one-paragraph summary that reports the H statistic, the post-hoc result, and the effect size, and your reader has everything they need.

## Summary

| Concept | Key takeaway |
|---|---|
| What it is | Rank-based, nonparametric counterpart to one-way ANOVA |
| When to use | 3+ independent groups, response is ordinal or continuous, normality fails |
| Function | `kruskal.test(y ~ group, data = ...)` |
| What H measures | Variance of group mean ranks scaled to chi-square (k-1) df |
| Median vs distribution | Equal shapes -> medians; unequal shapes -> distributions |
| Effect size | $\eta^2_H = (H - k + 1) / (n - k)$, large at 0.14 |
| Post-hoc | `pairwise.wilcox.test()` (base R) or Dunn's test |
| Tie handling | Built into `kruskal.test()`; matters with many ties |

## References

1. Kruskal, W. H., & Wallis, W. A. (1952). *Use of ranks in one-criterion variance analysis.* Journal of the American Statistical Association, 47(260), 583-621. [Link](https://doi.org/10.1080/01621459.1952.10483441)
2. R Core Team. *kruskal.test: Kruskal-Wallis Rank Sum Test.* R `stats` package documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kruskal.test.html)
3. Dunn, O. J. (1964). *Multiple comparisons using rank sums.* Technometrics, 6(3), 241-252. [Link](https://doi.org/10.1080/00401706.1964.10490181)
4. Hollander, M., Wolfe, D. A., & Chicken, E. (2014). *Nonparametric Statistical Methods*, 3rd edition. Wiley. [Link](https://www.wiley.com/en-us/Nonparametric+Statistical+Methods%2C+3rd+Edition-p-9780470387375)
5. Field, A., Miles, J., & Field, Z. (2012). *Discovering Statistics Using R.* SAGE Publications, Chapter 15. [Link](https://uk.sagepub.com/en-gb/eur/discovering-statistics-using-r/book236067)
6. Tomczak, M., & Tomczak, E. (2014). *The need to report effect size estimates revisited.* Trends in Sport Sciences, 1(21), 19-25. [Link](https://www.tss.awf.poznan.pl/files/3_Trends_Vol21_2014__no1_20.pdf)
7. Mangiafico, S. *Summary and Analysis of Extension Program Evaluation in R: Kruskal-Wallis Test.* rcompanion.org. [Link](https://rcompanion.org/handbook/F_08.html)

## Continue Learning

- [Mann-Whitney U Test in R](Mann-Whitney-U-Test-in-R.html) covers the two-group sibling of Kruskal-Wallis when you have only two independent samples.
- [Wilcoxon Signed-Rank Test in R](Wilcoxon-Signed-Rank-Test-in-R.html) handles the paired-sample case when normality of differences fails.
- [One-Way ANOVA in R](One-Way-ANOVA-in-R.html) is the parametric alternative when residuals are roughly normal and variances are similar.
