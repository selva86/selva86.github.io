---
title: "One-Way ANOVA in R: F-Test, Levene's Test, and Post-Hoc — Complete Walkthrough"
slug: "One-Way-ANOVA-in-R"
description: "Fit a one-way ANOVA in R with aov(), check homogeneity via Levene's test, interpret the F-statistic, and run Tukey HSD to find which groups truly differ."
keywords: "one-way ANOVA R, aov function, ANOVA F-test, Levene's test, TukeyHSD, post-hoc tests, homogeneity of variance, Welch ANOVA, Games-Howell, Kruskal-Wallis"
auto_link_terms: "one-way ANOVA|one-way ANOVA in R|ANOVA F-test|Levene's test|post-hoc test|Tukey HSD|Games-Howell test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "2.4.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "One-Way ANOVA"
sidebar_order: 58
difficulty: "Intermediate"
---

# One-Way ANOVA in R: F-Test, Levene's Test, and Post-Hoc — Complete Walkthrough

<p class="lead">One-way ANOVA tests whether three or more group means differ by comparing variation <em>between</em> groups to variation <em>within</em> groups. In R, you fit the model with <code>aov()</code>, confirm the assumptions with Levene's test and a residual QQ plot, read the F-statistic and p-value, then run a post-hoc test like <code>TukeyHSD()</code> to see which specific pairs of groups actually differ.</p>

## How does one-way ANOVA compare group means?

Let's start with the simplest useful ANOVA: does plant weight change across three different treatments? The built-in `PlantGrowth` dataset has 30 observations split across a control and two treatment groups, which is exactly the shape of problem ANOVA was built for. One call to `aov()` plus `summary()` gives you the F-statistic and the p-value that answer the question.

```r title="Fit a one-way ANOVA on PlantGrowth"
library(dplyr)

pg <- PlantGrowth
head(pg, 3)
#>   weight group
#> 1   4.17  ctrl
#> 2   5.58  ctrl
#> 3   5.18  ctrl

aov1 <- aov(weight ~ group, data = pg)
summary(aov1)
#>             Df Sum Sq Mean Sq F value Pr(>F)  
#> group        2  3.766  1.8832   4.846 0.0159 *
#> Residuals   27 10.492  0.3886                 
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The F-value is 4.85 and the p-value is 0.016, which is below 0.05. We reject the null that all three group means are equal. ANOVA does not tell us which group drives the effect, only that at least one group is out of line with the others. A post-hoc test will pin that down next.

![Between-group versus within-group variation feeding into the F-statistic.](screenshots/One-Way-ANOVA-in-R-f-ratio-concept.webp)

*Figure 1: The F-statistic is the ratio of between-group variation to within-group variation. A large F (with a small p) says the groups differ.*

Under the hood, `aov()` is asking a simple question: how much of the variation in `weight` is explained by `group`, compared to the variation that's left over inside each group? That ratio is the F-statistic. If groups are tightly clustered around their own means while the group means are far apart, F is large. If the groups overlap heavily, F is near 1 and the p-value is large.

Let's look at the group means and spreads directly to build intuition.

```r title="Summarise weight by group"
group_stats <- pg |>
  group_by(group) |>
  summarise(
    n = n(),
    mean_weight = mean(weight),
    sd_weight = sd(weight)
  )
group_stats
#> # A tibble: 3 × 4
#>   group     n mean_weight sd_weight
#>   <fct> <int>       <dbl>     <dbl>
#> 1 ctrl     10        5.03     0.583
#> 2 trt1     10        4.66     0.794
#> 3 trt2     10        5.53     0.443
```

The `trt2` plants are about 0.87 grams heavier on average than `trt1` plants, and the within-group spreads (SDs of 0.44 to 0.79) are modest compared to that gap. That is the signal-to-noise pattern that produced an F of 4.85.

[KEY INSIGHT]
**The F-statistic is a signal-to-noise ratio, not a test of which groups differ.** A large F means "at least one mean is separated from the others" but it cannot tell you *which* one without a follow-up pairwise test.

**Try it:** Fit a one-way ANOVA on the built-in `iris` dataset to test whether `Sepal.Length` differs across `Species`. Save the fitted model to `ex_aov` and print its summary.

```r title="Your turn: ANOVA on iris"
# Try it: fit ANOVA and print summary
ex_aov <- NULL  # replace with aov(...)

summary(ex_aov)
#> Expected: group Df=2, large F (~120), Pr(>F) well below 0.001.
```

<details>
<summary>Click to reveal solution</summary>

```r title="ANOVA on iris solution"
ex_aov <- aov(Sepal.Length ~ Species, data = iris)
summary(ex_aov)
#>              Df Sum Sq Mean Sq F value Pr(>F)    
#> Species       2  63.21  31.606   119.3 <2e-16 ***
#> Residuals   147  38.96   0.265                    
```

**Explanation:** Three iris species with 50 flowers each produce a huge F (119) and a near-zero p-value. The three species clearly differ in sepal length, and the size of F tells us the between-species signal dwarfs the within-species noise.

</details>

## How do you fit a one-way ANOVA with aov()?

The formula syntax `response ~ factor` is the R convention shared by regression, ANOVA, and many modelling functions. On the left is the continuous outcome; on the right is the categorical grouping variable. `aov()` returns a fitted model object, and `summary()` prints the ANOVA table from it.

Before trusting a test, look at the data. A boxplot shows medians, spreads, and outliers side-by-side and is the single most effective ANOVA diagnostic.

```r title="Boxplot of weight by group"
library(ggplot2)

ggplot(pg, aes(x = group, y = weight, fill = group)) +
  geom_boxplot(alpha = 0.6, outlier.shape = NA) +
  geom_jitter(width = 0.1, size = 2) +
  labs(title = "PlantGrowth: weight by treatment group",
       x = NULL, y = "Weight (g)") +
  theme_minimal() +
  theme(legend.position = "none")
```

The `trt2` box sits visibly above `trt1`, and `ctrl` falls in between. There are no extreme outliers, and the boxes overlap but do not coincide. Graphs like this are what the F-test is formalising: "are these boxes stacked far enough apart, given their widths, that chance alone cannot explain it?"

Now let's peek at how `aov()` relates to the workhorse `lm()` function. They are the same fit under the hood; `aov()` just formats the output as an ANOVA table instead of a regression table.

```r title="aov() equals lm() plus anova()"
mod_lm <- lm(weight ~ group, data = pg)
anova(mod_lm)
#> Analysis of Variance Table
#>
#> Response: weight
#>           Df  Sum Sq Mean Sq F value  Pr(>F)  
#> group      2  3.7663 1.88317  4.8461 0.01591 *
#> Residuals 27 10.4921 0.38860                  
```

The table is identical to what `summary(aov1)` printed. The practical difference is only in the defaults: `aov()` is the right entry point when ANOVA is the story; `lm()` is better when you will also want regression diagnostics, coefficients, or `predict()`.

[TIP]
**Use aov() when ANOVA is the output you want, lm() when you will follow up with regression tools.** Both fit the same model. `aov()` gives you a clean ANOVA table; `lm()` gives you coefficients, residuals, and `predict()` for downstream work.

**Try it:** From the summary of `aov1`, extract the F-value and the p-value programmatically so you could log them to a report. Store them in `ex_f` and `ex_p`.

```r title="Your turn: extract F and p"
# Try it: summary.aov returns a list; the first element holds the table.
aov_tbl <- summary(aov1)[[1]]

ex_f <- NA  # replace
ex_p <- NA  # replace

c(F = ex_f, p = ex_p)
#> Expected: F around 4.85 and p around 0.016.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract F and p solution"
aov_tbl <- summary(aov1)[[1]]
ex_f <- aov_tbl[["F value"]][1]
ex_p <- aov_tbl[["Pr(>F)"]][1]
c(F = ex_f, p = ex_p)
#>        F        p 
#> 4.846088 0.015909
```

**Explanation:** `summary.aov` returns a list of one data frame. Columns are named exactly as they print, so `[["F value"]]` and `[["Pr(>F)"]]` pull the numbers out. Index `[1]` picks the `group` row rather than the `Residuals` row.

</details>

## How do you check one-way ANOVA assumptions?

Classic one-way ANOVA rests on three assumptions. *Independence* of observations comes from study design, not from a statistical test. *Normality* means the residuals (observed minus group mean) follow a normal distribution, and *homogeneity of variance* means every group has roughly the same spread. ANOVA is fairly robust to small departures when group sizes are balanced, but large violations distort the F-distribution and inflate error rates.

Let's check normality first. Pull the residuals from the fitted model, then run a Shapiro-Wilk test and a QQ plot together.

```r title="Check normality of residuals"
resids <- residuals(aov1)

shapiro.test(resids)
#> 
#>   Shapiro-Wilk normality test
#> 
#> data:  resids
#> W = 0.96607, p-value = 0.4379

qqnorm(resids, main = "Normal QQ plot of ANOVA residuals")
qqline(resids, col = "steelblue", lwd = 2)
```

Shapiro returns a p-value of 0.44, well above 0.05, so we fail to reject normality. That is what we want: high p here means "the data are consistent with a normal distribution." The QQ plot should show points roughly on the diagonal line, which it does.

Now homogeneity. The industry-standard tool is Levene's test from the `car` package. Unlike the older Bartlett test, Levene does not itself require normal data, which makes it safer in practice.

```r title="Levene's test for equal variances"
library(car)

leveneTest(weight ~ group, data = pg)
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  2  1.1192 0.3412
#> 27
```

The p-value is 0.34, so we again fail to reject the null. "Fail to reject" is the good news here: we have no evidence that the group variances differ, which means classic ANOVA is appropriate.

[WARNING]
**A high p-value in Levene's test is good news for ANOVA.** You want to *fail* to reject the null of equal variances. A low Levene p-value (below 0.05) is the danger signal that tells you to switch to Welch ANOVA instead of the classic F-test.

**Try it:** Run Levene's test on `iris` Sepal.Length by Species. Is the equal-variance assumption met?

```r title="Your turn: Levene on iris"
# Try it: leveneTest with response ~ group.
ex_lev <- NULL  # replace with leveneTest(...)

ex_lev
#> Expected: an F-value and a p-value. If p > 0.05, variances look equal.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Levene on iris solution"
ex_lev <- leveneTest(Sepal.Length ~ Species, data = iris)
ex_lev
#> Levene's Test for Homogeneity of Variance (center = median)
#>        Df F value  Pr(>F)  
#> group   2  6.3527 0.002259 **
#> 147
```

**Explanation:** Levene returns a significant p-value (0.002), so iris species do *not* share the same Sepal.Length variance. That is exactly the situation where Welch ANOVA is safer than classic ANOVA, which we cover in the next section.

</details>

## What if the equal-variance assumption fails? (Welch ANOVA)

When Levene's test says "variances differ," the classic F-test loses its guarantee on the type-I error rate. Welch's one-way ANOVA, available in base R as `oneway.test(var.equal = FALSE)`, adjusts the degrees of freedom to stay valid under unequal variances. It still expects approximately normal residuals, so it is not a fix for wildly skewed data.

![Decision flow from normality to variance equality to the right ANOVA flavour.](screenshots/One-Way-ANOVA-in-R-test-choice.webp)

*Figure 2: Decision path for picking the right ANOVA flavour based on normality and variance homogeneity.*

Here is Welch ANOVA run on the same PlantGrowth data, alongside the classic version for comparison.

```r title="Classic vs Welch one-way ANOVA"
oneway.test(weight ~ group, data = pg, var.equal = TRUE)
#> 
#>   One-way analysis of means
#> 
#> data:  weight and group
#> F = 4.8461, num df = 2, denom df = 27, p-value = 0.01591

oneway.test(weight ~ group, data = pg, var.equal = FALSE)
#> 
#>   One-way analysis of means (not assuming equal variances)
#> 
#> data:  weight and group
#> F = 5.181, num df = 2.000, denom df = 17.128, p-value = 0.01739
```

The two F-values are close (4.85 vs 5.18) and both p-values sit under 0.02. Welch's denominator degrees of freedom dropped from 27 to about 17, which is the cost of relaxing the equal-variance assumption. When variances really do differ, Welch gives you a p-value you can trust; when they don't, classic ANOVA is very slightly more powerful.

[NOTE]
**Kruskal-Wallis is the non-parametric fallback when normality also fails.** Use `kruskal.test(response ~ group, data = df)` when residuals are clearly non-normal and your sample size is small. It ranks the data first, so it is robust to skew and outliers.

**Try it:** Given that iris variances differ across species (you showed this in the previous Levene exercise), run Welch's ANOVA on Sepal.Length by Species and compare its F-value to the classic F.

```r title="Your turn: Welch on iris"
# Try it: oneway.test with var.equal = FALSE
ex_welch <- NULL  # replace

ex_welch
#> Expected: F around 138, df around 34, p < 2.2e-16.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Welch on iris solution"
ex_welch <- oneway.test(Sepal.Length ~ Species, data = iris, var.equal = FALSE)
ex_welch
#> 
#>   One-way analysis of means (not assuming equal variances)
#> 
#> data:  Sepal.Length and Species
#> F = 138.91, num df = 2.000, denom df = 91.572, p-value < 2.2e-16
```

**Explanation:** Welch bumps F from 119 (classic) to 139 and trims denominator df from 147 to about 92. The iris species differ so dramatically that both tests agree, but the Welch version is the safer report when you know variances are unequal.

</details>

## Which post-hoc test should you run after a significant ANOVA?

A significant ANOVA tells you "at least one mean is different." Post-hoc tests tell you *which pairs* differ. Running plain pairwise t-tests without correction would inflate the false-positive rate: with three groups and three comparisons, the chance of at least one spurious "significant" result climbs from 5% to about 14%. Post-hoc methods correct for that.

![Decision tree for choosing Tukey, Games-Howell, Dunnett, or Bonferroni based on the comparison goal and variance structure.](screenshots/One-Way-ANOVA-in-R-post-hoc-chooser.webp)

*Figure 3: Which post-hoc test to run depends on whether variances are equal and which pairs you want to compare.*

Tukey's Honest Significant Difference (HSD) is the default choice when variances are equal and you want all pairwise comparisons. R has it built in.

```r title="TukeyHSD all-pairs post-hoc"
tukey_out <- TukeyHSD(aov1)
tukey_out
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> Fit: aov(formula = weight ~ group, data = pg)
#> 
#> $group
#>             diff        lwr       upr     p adj
#> trt1-ctrl -0.371 -1.0622161 0.3202161 0.3908711
#> trt2-ctrl  0.494 -0.1972161 1.1852161 0.1979960
#> trt2-trt1  0.865  0.1737839 1.5562161 0.0120064

plot(tukey_out, las = 1)
```

Read each row as "group A minus group B." `trt2-trt1` has a mean difference of 0.865 grams with a 95% confidence interval that does *not* cross zero, and an adjusted p-value of 0.012. That is the pair driving our significant ANOVA. The other two comparisons have intervals that cross zero and p-values above 0.05, so we cannot call them different.

If Tukey's HSD is not the right fit, `pairwise.t.test()` offers the same logic with different correction methods. Bonferroni is the most conservative; Holm is a strict-but-less-wasteful improvement.

```r title="pairwise.t.test with Bonferroni and Holm"
pairwise.t.test(pg$weight, pg$group, p.adjust.method = "bonferroni")
#>   Pairwise comparisons using t tests with pooled SD 
#> 
#> data:  pg$weight and pg$group 
#> 
#>      ctrl  trt1 
#> trt1 0.583 -    
#> trt2 0.263 0.013
#> 
#> P value adjustment method: bonferroni

pairwise.t.test(pg$weight, pg$group, p.adjust.method = "holm")
#>      ctrl  trt1 
#> trt1 0.194 -    
#> trt2 0.175 0.013
```

Both methods flag `trt2` vs `trt1` as the significant pair, matching Tukey. Holm's p-values for the non-significant pairs are smaller than Bonferroni's because Holm is uniformly less conservative, yet it preserves the same family-wise error guarantee.

[KEY INSIGHT]
**Tukey HSD is the right default for all-pairs comparisons under equal variances.** It balances power and family-wise error control. Switch to Games-Howell when variances are unequal, to Dunnett when every group is compared against one control, and to Bonferroni or Holm when you have a small number of pre-planned pairwise tests.

[NOTE]
**Games-Howell and Dunnett need extra packages.** Games-Howell is available as `rstatix::games_howell_test()` or `PMCMRplus::tukeyTest()`; Dunnett is in `multcomp::glht()`. Install those packages locally if your analysis needs them. Tukey HSD and `pairwise.t.test()` in this tutorial cover the large majority of real-world post-hoc needs.

**Try it:** Run TukeyHSD on the iris ANOVA you fit earlier (`ex_aov`) and identify which Species pair has the largest mean Sepal.Length difference.

```r title="Your turn: TukeyHSD on iris"
# Try it: TukeyHSD on an aov() object.
ex_tukey <- NULL  # replace

ex_tukey
#> Expected: three rows. Largest diff is virginica vs setosa.
```

<details>
<summary>Click to reveal solution</summary>

```r title="TukeyHSD on iris solution"
ex_tukey <- TukeyHSD(ex_aov)
ex_tukey
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> Fit: aov(formula = Sepal.Length ~ Species, data = iris)
#> 
#> $Species
#>                        diff       lwr       upr p adj
#> versicolor-setosa     0.930 0.6862273 1.1737727     0
#> virginica-setosa      1.582 1.3382273 1.8257727     0
#> virginica-versicolor  0.652 0.4082273 0.8957727     0
```

**Explanation:** All three adjusted p-values round to zero, so every species pair differs. The largest gap is `virginica - setosa` at 1.58 cm. The practical takeaway: with a strong underlying signal, Tukey often flags every pair, and the effect sizes (the `diff` column) are what distinguish the biggest gaps.

</details>

## How big is the group effect? (Eta-squared)

A p-value tells you whether an effect exists. An effect size tells you how big it is. The standard ANOVA effect size is eta-squared ($\eta^2$), the proportion of total variation explained by group membership. Small effect is $\eta^2 \approx 0.01$, medium is $\approx 0.06$, and large is $\geq 0.14$ by Cohen's conventions.

The definition is straightforward:

$$\eta^2 = \frac{SS_{\text{between}}}{SS_{\text{total}}}$$

Where:
- $SS_{\text{between}}$ = the sum of squared deviations of each group mean from the overall mean, weighted by group size
- $SS_{\text{total}}$ = the sum of squared deviations of every observation from the overall mean

You can compute it by hand from the sums of squares that `summary(aov1)` already prints, or directly from the data.

```r title="Compute eta-squared for PlantGrowth"
grand_mean <- mean(pg$weight)

ss_total <- sum((pg$weight - grand_mean)^2)

ss_between <- pg |>
  group_by(group) |>
  summarise(n = n(), m = mean(weight)) |>
  summarise(ss = sum(n * (m - grand_mean)^2)) |>
  pull(ss)

eta_sq <- ss_between / ss_total
round(eta_sq, 3)
#> [1] 0.264
```

$\eta^2$ of 0.264 means group membership accounts for 26% of the variation in weight. That is a large effect by Cohen's rule of thumb, and it matches the visible gap we saw in the boxplot.

[TIP]
**Report effect size alongside F and p.** A tiny p-value on a large sample can reach "significance" even when $\eta^2$ is trivially small. Effect size keeps your conclusions grounded in practical meaning. Journals in psychology, medicine, and education increasingly require it.

**Try it:** Compute $\eta^2$ for the iris Sepal.Length model using the same formula. Save it as `ex_eta`.

```r title="Your turn: eta-squared for iris"
# Try it: repeat the calculation with iris.
ex_gm <- mean(iris$Sepal.Length)
ex_ss_total <- sum((iris$Sepal.Length - ex_gm)^2)
ex_ss_between <- NA  # replace

ex_eta <- NA  # replace with ex_ss_between / ex_ss_total
ex_eta
#> Expected: around 0.619 (a very large effect).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Eta-squared for iris solution"
ex_gm <- mean(iris$Sepal.Length)
ex_ss_total <- sum((iris$Sepal.Length - ex_gm)^2)

ex_ss_between <- iris |>
  group_by(Species) |>
  summarise(n = n(), m = mean(Sepal.Length)) |>
  summarise(ss = sum(n * (m - ex_gm)^2)) |>
  pull(ss)

ex_eta <- ex_ss_between / ex_ss_total
round(ex_eta, 3)
#> [1] 0.619
```

**Explanation:** Species explains about 62% of the variation in sepal length. That is an enormous effect and is why the iris dataset is such a popular teaching example: the group structure is unmistakable.

</details>

## Practice Exercises

### Exercise 1: Full workflow on chickwts

The `chickwts` dataset records the weight of chicks on six different feed types. Run the full one-way ANOVA workflow on it. Specifically: fit the model, run Levene's test, check if classic ANOVA is appropriate, report F and p, run TukeyHSD, and compute $\eta^2$. Save the fitted model to `my_aov` and the effect size to `my_eta`.

```r title="Exercise 1 starter"
# Hint: feed ~ group in this case is weight ~ feed.
# Steps:
#   1. fit aov
#   2. leveneTest
#   3. summary(my_aov)
#   4. TukeyHSD(my_aov)
#   5. compute eta-squared

my_aov <- NULL
my_eta <- NULL

# Write your workflow below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
data(chickwts)

# 1. Fit
my_aov <- aov(weight ~ feed, data = chickwts)

# 2. Levene
leveneTest(weight ~ feed, data = chickwts)
#>        Df F value Pr(>F)
#> group   5  0.7493 0.5896
#> 65

# 3. F-test
summary(my_aov)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> feed         5 231129   46226   15.37 5.94e-10 ***
#> Residuals   65 195556    3009                     

# 4. Tukey
TukeyHSD(my_aov)
#> (prints a 15-row table; casein-horsebean, sunflower-horsebean, etc. are all significant)

# 5. Eta-squared
my_gm <- mean(chickwts$weight)
ss_total <- sum((chickwts$weight - my_gm)^2)
ss_between <- chickwts |>
  group_by(feed) |>
  summarise(n = n(), m = mean(weight)) |>
  summarise(ss = sum(n * (m - my_gm)^2)) |>
  pull(ss)

my_eta <- ss_between / ss_total
round(my_eta, 3)
#> [1] 0.542
```

**Explanation:** Levene's p of 0.59 says variances are fine, so classic ANOVA is valid. F of 15.4 with p near zero and $\eta^2$ of 0.54 tells us feed type has a very large effect on chick weight. Tukey then pinpoints the specific feed pairs that differ.

</details>

### Exercise 2: Unequal variances and Welch

Generate three groups of 30 observations each where group means are close but group standard deviations differ a lot (for example 1, 3, and 5). Apply both classic and Welch ANOVA. Compare the F-values and p-values. Save the Welch result to `my_welch`.

```r title="Exercise 2 starter"
# Hint: rnorm() takes mean and sd. Use set.seed() for reproducibility.
# Build a data frame with groups A, B, C and different SDs.

set.seed(42)

# Build the data frame:
my_data <- NULL  # replace

# Classic ANOVA:
# oneway.test(..., var.equal = TRUE)

# Welch ANOVA:
my_welch <- NULL  # replace

my_welch
#> Expected: Welch denominator df noticeably smaller than classic df.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(42)
my_data <- data.frame(
  value = c(rnorm(30, mean = 10, sd = 1),
            rnorm(30, mean = 11, sd = 3),
            rnorm(30, mean = 12, sd = 5)),
  group = rep(c("A", "B", "C"), each = 30)
)

oneway.test(value ~ group, data = my_data, var.equal = TRUE)
#>   F = 3.70, num df = 2, denom df = 87, p-value = 0.0288

my_welch <- oneway.test(value ~ group, data = my_data, var.equal = FALSE)
my_welch
#>   F = 3.12, num df = 2.000, denom df = 47.32, p-value = 0.0533
```

**Explanation:** The classic test reports p = 0.029, but it assumes all three groups share a variance, which they do not. Welch adjusts the denominator df down from 87 to 47 and returns p = 0.053. The conservative Welch result is the one you should trust here, because ignoring unequal variances in classic ANOVA inflates the false-positive rate.

</details>

## Complete Example

Let's run the full pipeline end-to-end on the `iris` dataset. The question: does sepal length differ across species? Each step below is what you would put in a real analysis report.

```r title="Complete iris ANOVA workflow"
# 1. Explore
iris |>
  group_by(Species) |>
  summarise(n = n(), mean = mean(Sepal.Length), sd = sd(Sepal.Length))
#>   Species        n  mean    sd
#>   setosa        50  5.01 0.352
#>   versicolor    50  5.94 0.516
#>   virginica     50  6.59 0.636

# 2. Assumption check: homogeneity of variance
leveneTest(Sepal.Length ~ Species, data = iris)
#> Levene p = 0.0023  -> variances differ

# 3. Fit (both classic and Welch, since Levene failed)
iris_aov <- aov(Sepal.Length ~ Species, data = iris)
summary(iris_aov)
#> Species       2  63.21  31.606   119.3 <2e-16 ***

oneway.test(Sepal.Length ~ Species, data = iris, var.equal = FALSE)
#> Welch F = 138.9, p < 2.2e-16

# 4. Post-hoc (since both tests agree the effect is huge, use Tukey for pairs)
TukeyHSD(iris_aov)
#> All three pairs significant; virginica - setosa is the largest gap at 1.58 cm.

# 5. Effect size
iris_gm <- mean(iris$Sepal.Length)
iris_ss_total <- sum((iris$Sepal.Length - iris_gm)^2)
iris_ss_between <- iris |>
  group_by(Species) |>
  summarise(n = n(), m = mean(Sepal.Length)) |>
  summarise(ss = sum(n * (m - iris_gm)^2)) |>
  pull(ss)
iris_eta <- iris_ss_between / iris_ss_total
round(iris_eta, 3)
#> [1] 0.619
```

**Reporting sentence you could drop into a paper or dashboard:**

> A one-way ANOVA with Welch correction showed that sepal length differed significantly across the three iris species, F(2, 91.6) = 138.9, p < .001, $\eta^2$ = 0.62. Tukey HSD post-hoc comparisons indicated that every pairwise difference was significant (all adjusted p < .001), with virginica having the longest sepals (mean 6.59 cm) and setosa the shortest (5.01 cm).

## Summary

You now have a complete one-way ANOVA workflow in R: explore, check assumptions, fit, follow up with post-hoc tests, and report effect size.

| Step | Function | What to check |
|---|---|---|
| Visualise | `ggplot() + geom_boxplot()` | Group medians, spreads, outliers |
| Normality of residuals | `shapiro.test(residuals(aov1))`, `qqnorm()` | High p, points on QQ line |
| Homogeneity of variance | `car::leveneTest()` | High p (fail to reject equal variances) |
| Fit classic ANOVA | `aov(y ~ group, data)` + `summary()` | F-value, Pr(>F) |
| Fit Welch ANOVA (if Levene failed) | `oneway.test(y ~ group, var.equal = FALSE)` | Same F/p interpretation |
| All-pairs post-hoc | `TukeyHSD(aov1)` | 95% CI that excludes 0, adjusted p |
| Planned comparisons | `pairwise.t.test(y, group, p.adjust.method = "holm")` | Adjusted p per pair |
| Effect size | $\eta^2 = SS_{between} / SS_{total}$ | Cohen: 0.01 small, 0.06 medium, 0.14 large |

**Rule of thumb order of operations:** EDA → Levene → pick classic or Welch → summary for F and p → post-hoc only if ANOVA is significant → always report effect size.

## References

1. R Core Team. `?aov` documentation. [stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
2. R Core Team. `?oneway.test` documentation. [stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html)
3. Fox, J. & Weisberg, S. (2019). *An R Companion to Applied Regression*, 3rd Edition. Sage. (car package, `leveneTest` reference.) [socialsciences.mcmaster.ca/jfox/Books/Companion](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
4. Kutner, M.H., Nachtsheim, C.J., Neter, J., & Li, W. (2005). *Applied Linear Statistical Models*, 5th Edition. McGraw-Hill/Irwin. Chapters on single-factor ANOVA.
5. Tukey, J.W. (1949). "Comparing Individual Means in the Analysis of Variance." *Biometrics* 5(2), 99-114.
6. Welch, B.L. (1951). "On the Comparison of Several Mean Values: An Alternative Approach." *Biometrika* 38(3/4), 330-336.
7. Games, P.A. & Howell, J.F. (1976). "Pairwise Multiple Comparison Procedures with Unequal N's and/or Variances: A Monte Carlo Study." *Journal of Educational Statistics* 1(2), 113-125.

## Continue Learning

- [t-Tests in R](t-Tests-in-R.html): When you only have two groups to compare, a t-test is the right tool. It is the two-group special case of one-way ANOVA.
- [Wilcoxon, Mann-Whitney and Kruskal-Wallis in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html): The non-parametric toolkit for when normality is clearly violated. Kruskal-Wallis is the rank-based sibling of one-way ANOVA.
- [Effect Size in R](Effect-Size-in-R.html): A deeper treatment of $\eta^2$, $\omega^2$, Cohen's f, and how to choose and report effect sizes in practice.
