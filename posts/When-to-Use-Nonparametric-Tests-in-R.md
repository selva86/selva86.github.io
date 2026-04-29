---
title: "When to Use Nonparametric Tests in R: Decision Guide with Flowchart"
slug: "When-to-Use-Nonparametric-Tests-in-R"
description: "A practical decision guide for choosing nonparametric tests in R: when to use them, the flowchart, and runnable code for Wilcoxon, Kruskal-Wallis, and more."
keywords: "nonparametric tests in R, when to use nonparametric tests, parametric vs nonparametric R, Wilcoxon test R, Mann-Whitney R, Kruskal-Wallis R, Friedman test R, Spearman correlation, normality assumption R, rank-based tests"
auto_link_terms: "nonparametric tests in R|parametric vs nonparametric|Wilcoxon test|Mann-Whitney test|Kruskal-Wallis test|Friedman test|Spearman correlation|rank-based tests|when to use nonparametric"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-29
curriculum_id: "2.8.1"
post_type: C
sidebar_section: "Statistics"
sidebar_title: "When to Use Nonparametric Tests"
sidebar_order: 84
difficulty: Intermediate
---

# When to Use Nonparametric Tests in R: Decision Guide with Flowchart

<p class="lead">Use a nonparametric test in R when your data fail the assumptions of a parametric test, that is, when the distribution is skewed, contains outliers, the sample is small, or the values are ordinal. This guide gives you one decision flowchart, the parametric-to-nonparametric mapping, and runnable code for every test you'll need.</p>

Examples below use base R (`wilcox.test`, `kruskal.test`, `friedman.test`, `cor.test`), so there's nothing extra to install.

## When does a nonparametric test win in R?

The fastest way to feel why this matters is to run both tests on the same messy data and compare. We'll build two groups where group B truly has higher values than group A, then sneak three large outliers into group A. The outliers drag A's mean upward, hiding the true ordering. We then ask the t-test and the Wilcoxon test the same question: are these groups different?

```r title="t-test vs Wilcoxon on contaminated data"
set.seed(2026)
group_a_clean <- rnorm(17, mean = 5, sd = 1)
group_a       <- c(group_a_clean, 60, 65, 70)   # 3 outliers added
group_b       <- rnorm(20, mean = 8, sd = 1)

t_p <- t.test(group_a, group_b)$p.value
w_p <- wilcox.test(group_a, group_b)$p.value

round(c(t_test = t_p, wilcoxon = w_p), 4)
#>    t_test wilcoxon
#>    0.2871   0.0014
```

The t-test reports `p = 0.29`, so it cannot reject the null that the means are equal. The Wilcoxon test reports `p = 0.001`, a clear rejection. Both tests saw the same numbers; only one detected the truth. The outliers pulled group A's *mean* above group B's, but they could not change the fact that most A values *rank below* most B values. The Wilcoxon test works on ranks, not magnitudes, so a few extreme points cannot dominate it.

[KEY INSIGHT]
**Rank-based tests trade magnitude for order.** A parametric test asks "how far apart are the means?" A nonparametric test asks "do values from one group tend to rank higher than values from the other?" That single shift is what makes nonparametric tests robust to outliers and skew.

**Try it:** Repeat the demo with smaller outliers (replace `60, 65, 70` with `15, 18, 20`) and re-run both tests. Save the two p-values to `ex_t` and `ex_w`.

```r title="Your turn: smaller outliers"
set.seed(2026)
ex_clean <- rnorm(17, mean = 5, sd = 1)
ex_a     <- c(ex_clean, 15, 18, 20)
ex_b     <- rnorm(20, mean = 8, sd = 1)

# your code here
ex_t <- NA
ex_w <- NA

round(c(t = ex_t, w = ex_w), 4)
#> Expected: both p-values small, but Wilcoxon still smaller.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smaller outliers solution"
set.seed(2026)
ex_clean <- rnorm(17, mean = 5, sd = 1)
ex_a     <- c(ex_clean, 15, 18, 20)
ex_b     <- rnorm(20, mean = 8, sd = 1)

ex_t <- t.test(ex_a, ex_b)$p.value
ex_w <- wilcox.test(ex_a, ex_b)$p.value
round(c(t = ex_t, w = ex_w), 4)
#>      t      w
#> 0.0428 0.0008
```

**Explanation:** With smaller outliers, the t-test recovers and even agrees with Wilcoxon, but Wilcoxon still reports a smaller p-value because rank order is unaffected by spread.

</details>

## What assumptions of parametric tests must hold?

Parametric tests like the t-test and ANOVA earn their power by *assuming* something about the data. Three assumptions matter most:

1. **Normality.** Each group (or the residuals) follows a roughly bell-shaped distribution.
2. **Equal variance** (homoscedasticity). Spread is similar across groups.
3. **Independence.** Observations don't influence each other.

When any of these fail, the test's reported p-value is no longer trustworthy. Let's check each in R, starting with normality.

```r title="Shapiro-Wilk on normal vs skewed data"
set.seed(11)
normal_x <- rnorm(60, mean = 0, sd = 1)
skewed_x <- rexp(60, rate = 1)

s_norm <- shapiro.test(normal_x)
s_skew <- shapiro.test(skewed_x)

round(c(normal_p = s_norm$p.value, skewed_p = s_skew$p.value), 4)
#> normal_p skewed_p
#>   0.7124   0.0001
```

The normal sample passes (`p = 0.71`, well above 0.05), so the assumption holds. The exponential sample fails dramatically (`p = 0.0001`), confirming what we already knew: it's right-skewed. A small p-value here is a *red flag*, not a green one. It tells you the data are unlikely to have come from a normal distribution.

[WARNING]
**Shapiro-Wilk lies at the extremes of sample size.** With n under 20, the test almost always passes (not enough power to reject normality). With n over 5000, even tiny deviations from perfect normality reject. Below n = 30, lean on a Q-Q plot or domain knowledge instead. Above n = 5000, the Central Limit Theorem usually has you covered anyway.

Next, equal variance:

```r title="var.test for equal variance"
set.seed(11)
x_low_var  <- rnorm(40, mean = 5, sd = 1)
x_high_var <- rnorm(40, mean = 5, sd = 4)

var_test <- var.test(x_low_var, x_high_var)
round(var_test$p.value, 4)
#> [1] 0
```

`var.test()` runs an F-test on the ratio of variances. The tiny p-value here flags unequal spread. For more than two groups, swap in `bartlett.test()` (sensitive to non-normality) or the `leveneTest()` from the `car` package. If equal variance fails, even a Welch t-test (which relaxes this) may leave you happier with a rank-based alternative when normality also fails.

Finally, the practical "outlier detector" most analysts actually use, the IQR rule:

```r title="IQR-based outlier count"
set.seed(11)
x <- c(rnorm(50, mean = 5, sd = 1), 12, 15, 20)   # 3 planted outliers
q   <- quantile(x, c(0.25, 0.75))
iqr <- diff(q)
outliers <- x[x < q[1] - 1.5 * iqr | x > q[2] + 1.5 * iqr]
length(outliers)
#> [1] 3
```

Three points fall more than 1.5 IQRs outside the box, the standard "boxplot whisker" rule. Three out of 53 is roughly 6%, well into the range where parametric tests start to lose power. If your real-world dataset shows even 5-10% outliers, your t-test is paying a tax that a Wilcoxon test does not.

**Try it:** Run `shapiro.test()` on `airquality$Wind` and decide whether it passes the normality assumption.

```r title="Your turn: test airquality$Wind for normality"
# Hint: shapiro.test() returns a list; the p-value is in $p.value

ex_wind <- NA  # replace with the test result

ex_wind
#> Expected: a Shapiro-Wilk result with a p-value.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wind normality solution"
ex_wind <- shapiro.test(airquality$Wind)
ex_wind
#>
#>     Shapiro-Wilk normality test
#>
#> data:  airquality$Wind
#> W = 0.98575, p-value = 0.1178
```

**Explanation:** `p = 0.12 > 0.05`, so we fail to reject normality. Wind speed is borderline normal, and a parametric test is reasonable here.

</details>

## What is the decision flowchart for choosing a nonparametric test?

The flowchart below collapses everything above into one picture. Read it top to bottom: classify your data, check distribution shape, then check sample size. If any branch lands on "Use Nonparametric," skip the t-test or ANOVA.

![Decision flowchart for choosing a nonparametric test in R](screenshots/When-to-Use-Nonparametric-Tests-in-R-decision-flowchart.webp)

*Figure 1: The decision flowchart for choosing between parametric and nonparametric tests.*

The four exit points work like this:

- **Ordinal data** (Likert scales, rankings, ordered categories) goes straight to nonparametric. There's no meaningful "mean" of "Strongly Agree."
- **Continuous but skewed or outlier-laden** data goes to nonparametric. Magnitudes are unreliable.
- **Continuous, roughly normal, but small n** goes to nonparametric. Without the Central Limit Theorem rescuing you (it kicks in around n = 30), the t-test's p-value depends on perfect normality, which you can't verify with so few points.
- **Continuous, roughly normal, large n** goes to parametric. You earn the extra power.

Let's apply it to a concrete dataset, the daily ozone readings in `airquality`:

```r title="Apply the flowchart to airquality$Ozone"
ozone_data <- na.omit(airquality$Ozone)

length(ozone_data)
#> [1] 116

summary(ozone_data)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   1.00   18.00   31.50   42.13   63.25  168.00

oz_norm <- shapiro.test(ozone_data)
round(oz_norm$p.value, 8)
#> [1] 2.79e-08
```

Mean (42) much greater than median (31.5) screams right-skew. Maximum of 168 against a third quartile of 63 confirms outliers. The Shapiro-Wilk p-value is microscopic. Three branches of the flowchart all point to "nonparametric." Comparing ozone across months should use `kruskal.test()`, not one-way ANOVA.

[TIP]
**Decide before you peek.** Pick parametric or nonparametric *before* running the test you actually care about. Running both and reporting whichever gives a smaller p-value is p-hacking, which inflates your false-positive rate. The flowchart, applied to assumption checks alone, is your pre-registered decision rule.

**Try it:** Walk `iris$Sepal.Width` through the flowchart and decide which test family you'd use to compare it across species. Save your answer as a string.

```r title="Your turn: walk Sepal.Width through the flowchart"
# Hint: check sample size, then shapiro.test()

ex_sw_n   <- NA
ex_sw_p   <- NA
ex_choice <- NA   # "parametric" or "nonparametric"

list(n = ex_sw_n, p = ex_sw_p, choice = ex_choice)
#> Expected: n = 150, p > 0.05, choice = "parametric"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sepal.Width flowchart solution"
ex_sw_n   <- length(iris$Sepal.Width)
ex_sw_p   <- shapiro.test(iris$Sepal.Width)$p.value
ex_choice <- if (ex_sw_p > 0.05 && ex_sw_n >= 30) "parametric" else "nonparametric"

list(n = ex_sw_n, p = round(ex_sw_p, 4), choice = ex_choice)
#> $n
#> [1] 150
#>
#> $p
#> [1] 0.1012
#>
#> $choice
#> [1] "parametric"
```

**Explanation:** Sepal.Width passes the normality test and has n = 150, so the flowchart sends you to the parametric branch (one-way ANOVA across species).

</details>

## What are the main nonparametric tests in R, and when do you use each?

Once the flowchart points you nonparametric, the next question is *which* nonparametric test. Each parametric test has a rank-based counterpart that asks the same scientific question without needing normality.

| Parametric test | Nonparametric counterpart | R function | Use when |
|---|---|---|---|
| Independent t-test | Mann-Whitney / Wilcoxon rank-sum | `wilcox.test(x, y)` | Two unpaired groups |
| Paired t-test | Wilcoxon signed-rank | `wilcox.test(x, y, paired = TRUE)` | Two paired measurements |
| One-way ANOVA | Kruskal-Wallis | `kruskal.test(y ~ group)` | 3+ unpaired groups |
| Repeated-measures ANOVA | Friedman | `friedman.test(y, groups, blocks)` | 3+ paired or blocked measurements |
| Pearson correlation | Spearman / Kendall | `cor.test(x, y, method = "spearman")` | Monotonic but not linear association |

Now let's run each one on a built-in dataset.

### Mann-Whitney (two independent groups)

```r title="Mann-Whitney on the sleep dataset"
mw_result <- wilcox.test(extra ~ group, data = sleep)
mw_result
#>
#>     Wilcoxon rank sum test with continuity correction
#>
#> data:  extra by group
#> W = 25.5, p-value = 0.06933
#> alternative hypothesis: true location shift is not equal to 0
```

The two drug groups in `sleep` show a borderline difference (`p = 0.069`). At the conventional 0.05 cutoff we wouldn't reject the null, but the small sample (n = 10 per group) leaves us under-powered. The W statistic is the sum of ranks in one group; the p-value compares it to the distribution of W under random shuffling.

[NOTE]
**`wilcox.test()` is two tests in one.** Without `paired = TRUE` it's the Mann-Whitney / Wilcoxon rank-sum (independent groups). With `paired = TRUE` it's the Wilcoxon signed-rank (paired measurements). The function name in R is historical, the same `wilcox.test()` covers both.

### Wilcoxon signed-rank (paired measurements)

```r title="Wilcoxon signed-rank, paired"
extra1 <- sleep$extra[sleep$group == 1]
extra2 <- sleep$extra[sleep$group == 2]

paired_result <- wilcox.test(extra1, extra2, paired = TRUE)
paired_result
#>
#>     Wilcoxon signed rank test with continuity correction
#>
#> data:  extra1 and extra2
#> V = 0, p-value = 0.009091
#> alternative hypothesis: true location shift is not equal to 0
```

When we treat the two columns as paired (each subject got both drugs), `p` drops to `0.009`. Pairing removes between-subject variation, which is why the same data now gives a much sharper signal. The V statistic of 0 means *every* difference favored drug 2.

### Kruskal-Wallis (3+ independent groups)

```r title="Kruskal-Wallis on chickwts"
kw_result <- kruskal.test(weight ~ feed, data = chickwts)
kw_result
#>
#>     Kruskal-Wallis rank sum test
#>
#> data:  weight by feed
#> Kruskal-Wallis chi-squared = 37.343, df = 5, p-value = 5.113e-07
```

`chickwts` has 71 chicks across 6 feed types, with a few obvious outliers in the heaviest groups. The Kruskal-Wallis test compares average ranks across feeds and gives `p < 1e-6`. Some feed type produces a very different weight distribution. To find which pairs differ, follow up with `pairwise.wilcox.test(chickwts$weight, chickwts$feed, p.adjust.method = "bonferroni")`.

### Friedman (3+ paired or blocked measurements)

```r title="Friedman test on rounding times"
ratings <- matrix(c(
  5.40, 5.50, 5.55,  5.85, 5.70, 5.75,  5.20, 5.60, 5.50,
  5.55, 5.50, 5.40,  5.90, 5.85, 5.70,  5.45, 5.55, 5.60,
  5.40, 5.40, 5.35,  5.45, 5.50, 5.35,  5.25, 5.15, 5.00,
  5.85, 5.80, 5.70,  5.25, 5.20, 5.10,  5.65, 5.55, 5.45,
  5.60, 5.35, 5.45,  5.05, 5.00, 4.95,  5.50, 5.50, 5.40,
  5.45, 5.55, 5.50,  5.55, 5.55, 5.35,  5.45, 5.50, 5.55,
  5.50, 5.45, 5.25,  5.65, 5.60, 5.40,  5.70, 5.65, 5.55,
  6.30, 6.30, 6.25),
  nrow = 22, byrow = TRUE,
  dimnames = list(NULL, c("Round", "Narrow", "Wide")))

friedman_result <- friedman.test(ratings)
friedman_result
#>
#>     Friedman rank sum test
#>
#> data:  ratings
#> Friedman chi-squared = 11.143, df = 2, p-value = 0.003805
```

Each row is a baseball player; each column is a base-rounding technique they all tried. The Friedman test checks whether technique matters *within* players, ranking the three columns row by row. With `p = 0.0038` we reject the null of no difference between techniques.

### Spearman correlation (monotonic association)

```r title="Spearman rank correlation"
spearman_result <- cor.test(mtcars$mpg, mtcars$hp, method = "spearman")
spearman_result
#>
#>     Spearman's rank correlation rho
#>
#> data:  mtcars$mpg and mtcars$hp
#> S = 10337, p-value = 5.086e-12
#> alternative hypothesis: true rho is not equal to 0
#> sample estimates:
#>        rho
#> -0.8946646
```

Spearman's rho of -0.89 says that as horsepower goes up, miles-per-gallon goes down, monotonically and strongly. Spearman is happy with monotonic but non-linear relationships, where Pearson would understate the association.

**Try it:** Run a Kruskal-Wallis test on `count ~ spray` from `InsectSprays`. Save the result to `ex_kw` and report the p-value rounded to 4 decimals.

```r title="Your turn: Kruskal-Wallis on InsectSprays"
# Hint: use kruskal.test(y ~ group, data = ...)

ex_kw <- NA
ex_kw_p <- NA

ex_kw_p
#> Expected: a very small p-value (well below 0.05).
```

<details>
<summary>Click to reveal solution</summary>

```r title="InsectSprays solution"
ex_kw   <- kruskal.test(count ~ spray, data = InsectSprays)
ex_kw_p <- round(ex_kw$p.value, 4)
ex_kw
#>
#>     Kruskal-Wallis rank sum test
#>
#> data:  count by spray
#> Kruskal-Wallis chi-squared = 54.691, df = 5, p-value = 1.511e-10
ex_kw_p
#> [1] 0
```

**Explanation:** With `p ≈ 1.5e-10` we strongly reject the null that all six sprays produce the same insect counts. At least one spray differs from the others.

</details>

## What are common mistakes when picking nonparametric tests?

Four myths catch new analysts. Each one is wrong, and knowing why sharpens your decision making.

**Myth 1: "Small n always means nonparametric."** Not if your data are clearly normal and you have prior knowledge of the distribution. With n = 10 truly normal points, a t-test still has more power than a Wilcoxon test.

**Myth 2: "Mann-Whitney tests medians."** It does only when both groups share the same shape and spread. In general it tests *stochastic dominance*, the question "are values from one group typically larger?" A significant Mann-Whitney does not by itself mean medians differ.

**Myth 3: "Nonparametric means assumption-free."** Wrong. Independence still matters. Friedman assumes the same scale across blocks. Wilcoxon paired assumes symmetric differences. The label "nonparametric" only relaxes the *distribution* assumption, not all of them.

**Myth 4: "Always run nonparametric to be safe."** Costly. On truly normal data, Wilcoxon has about 95% the power of a t-test (the asymptotic relative efficiency). On heavy-tailed data, Wilcoxon is hugely more powerful. Pick based on assumption checks, not blanket caution.

It's also worth knowing how to report a *standardized effect* alongside a Wilcoxon p-value. The conventional rank-biserial correlation, derived from the Z statistic, is one option:

```r title="Effect size r from a Wilcoxon p-value"
n_total  <- length(sleep$extra)        # 20
wt_z     <- qnorm(mw_result$p.value / 2)
effect_r <- abs(wt_z) / sqrt(n_total)

round(c(z = wt_z, r = effect_r), 3)
#>      z      r
#> -1.815  0.406
```

A rank-biserial correlation of 0.41 is in the "medium-large" range by Cohen's rule of thumb (0.1 / 0.3 / 0.5 for small / medium / large). Report this next to the p-value so reviewers see effect magnitude, not just significance.

[KEY INSIGHT]
**Rank-based does not mean assumption-free.** Nonparametric tests trade the normality assumption for an independence-and-shape assumption. They're not a free lunch, they're a different lunch.

**Try it:** Which myth is reflected in this one-line analysis? *"My sample is small (n=12), so I'll use a Wilcoxon test."*

```r title="Your turn: identify the myth"
# Set ex_myth to "1", "2", "3", or "4" and explain in a comment
ex_myth <- ""

ex_myth
#> Expected: one of "1", "2", "3", "4".
```

<details>
<summary>Click to reveal solution</summary>

```r title="Myth-spotting solution"
ex_myth <- "1"
# The analyst is using small n alone as the trigger.
# That's myth 1: small n by itself does not mandate nonparametric.
# A Q-Q plot or domain knowledge about normality should drive the choice.
ex_myth
#> [1] "1"
```

**Explanation:** Small samples don't automatically rule out parametric tests. If the data are plausibly normal (small samples often look noisy but symmetric), a t-test gives sharper conclusions.

</details>

## Practice Exercises

### Exercise 1: Pick the right test for iris$Sepal.Length

Compare `Sepal.Length` across the three iris species. Run the appropriate normality and variance checks, decide between one-way ANOVA and Kruskal-Wallis, then run the chosen test. Save the result to `my_iris_test`.

```r title="Exercise 1: pick and run"
# 1. Check normality with shapiro.test() per species (or on residuals)
# 2. Check variance with bartlett.test()
# 3. Decide and run aov() OR kruskal.test()

my_iris_test <- NA

my_iris_test
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
# Per-species normality
sp_norm <- by(iris$Sepal.Length, iris$Species,
              function(x) shapiro.test(x)$p.value)
sp_norm
#> iris$Species
#>     setosa versicolor  virginica
#>     0.4595     0.4647     0.2583

# Variance equality
bart <- bartlett.test(Sepal.Length ~ Species, data = iris)
round(bart$p.value, 4)
#> [1] 0.0003

# Each group is normal but variances differ. Welch ANOVA or Kruskal-Wallis
# are both reasonable. Going with Kruskal-Wallis to stay distribution-free.
my_iris_test <- kruskal.test(Sepal.Length ~ Species, data = iris)
my_iris_test
#>
#>     Kruskal-Wallis rank sum test
#>
#> data:  Sepal.Length by Species
#> Kruskal-Wallis chi-squared = 96.937, df = 2, p-value < 2.2e-16
```

**Explanation:** All three species pass Shapiro-Wilk individually, but Bartlett rejects equal variance. With one assumption violated and a clean rank-based alternative available, Kruskal-Wallis is the conservative choice. The huge chi-squared and tiny p-value confirm species differ in sepal length.

</details>

### Exercise 2: Paired comparison with effect size

Compare drug 1 and drug 2 in the `sleep` dataset as paired measurements. Decide between a paired t-test and Wilcoxon signed-rank by inspecting the distribution of differences, run the chosen test, then compute the rank-biserial effect size. Save it to `my_sleep_es`.

```r title="Exercise 2: paired test and effect size"
# 1. Compute the differences extra2 - extra1
# 2. Test the differences for normality with shapiro.test()
# 3. Decide and run wilcox.test(..., paired = TRUE) OR t.test(..., paired = TRUE)
# 4. Compute rank-biserial: r = |Z| / sqrt(n)

my_sleep_es <- NA

my_sleep_es
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_e1 <- sleep$extra[sleep$group == 1]
ex2_e2 <- sleep$extra[sleep$group == 2]
ex2_d  <- ex2_e2 - ex2_e1

# Shapiro on the differences
ex2_sh <- shapiro.test(ex2_d)
round(ex2_sh$p.value, 4)
#> [1] 0.0314

# Differences fail normality, so Wilcoxon signed-rank
ex2_w <- wilcox.test(ex2_e1, ex2_e2, paired = TRUE)
ex2_w
#>
#>     Wilcoxon signed rank test with continuity correction
#>
#> data:  ex2_e1 and ex2_e2
#> V = 0, p-value = 0.009091

# Effect size from p-value
ex2_z       <- qnorm(ex2_w$p.value / 2)
my_sleep_es <- abs(ex2_z) / sqrt(length(ex2_d))
round(my_sleep_es, 3)
#> [1] 0.832
```

**Explanation:** The differences fail Shapiro-Wilk (`p = 0.03`), so we go nonparametric. The Wilcoxon signed-rank gives `p = 0.009`, and the rank-biserial of 0.83 is a *large* effect. Reporting both p-value and effect size paints the full picture.

</details>

## Complete Example

Let's run the full pipeline on `airquality$Ozone ~ Month`. Does ozone differ across the five summer months in the dataset? We'll move from raw data to a defensible test choice to a reported result.

```r title="End-to-end nonparametric workflow"
# 1. Quick numeric summary per month
tapply(airquality$Ozone, airquality$Month, summary)
#> $`5`
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.    NA's
#>    1.00   11.00   18.00   23.62   31.50   115.00      5
#>
#> $`7`
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.    NA's
#>    7.00   49.00   60.00   59.12   73.00   135.00      1
#>
#> ... (months 6, 8, 9 omitted)

# 2. Normality on residuals from a one-way model
res <- resid(aov(Ozone ~ factor(Month), data = airquality))
shapiro.test(res)$p.value
#> [1] 1.8e-08

# 3. Variance check
bartlett.test(Ozone ~ factor(Month), data = airquality)$p.value
#> [1] 8.4e-05

# 4. Both fail. Run Kruskal-Wallis.
final <- kruskal.test(Ozone ~ Month, data = airquality)
final
#>
#>     Kruskal-Wallis rank sum test
#>
#> data:  Ozone by Month
#> Kruskal-Wallis chi-squared = 29.267, df = 4, p-value = 6.901e-06

# 5. Pairwise follow-up with Bonferroni correction
pairwise.wilcox.test(airquality$Ozone, airquality$Month,
                     p.adjust.method = "bonferroni")
```

The summary shows means well above medians for July and August, classic right-skew. Residuals fail Shapiro by a wide margin. Bartlett rejects equal variance. Two assumptions of one-way ANOVA are violated, so Kruskal-Wallis is the right call. The test rejects strongly (`p ≈ 7e-6`): ozone levels differ by month. The pairwise follow-up tells you exactly which months differ, with Bonferroni controlling the family-wise error rate.

## Summary

![Mindmap of nonparametric test families in R](screenshots/When-to-Use-Nonparametric-Tests-in-R-test-families.webp)

*Figure 2: The main families of nonparametric tests in R.*

Key takeaways:

| Question | Answer |
|---|---|
| When does nonparametric win? | Skewed data, outliers, ordinal scales, or small samples |
| When does parametric win? | Roughly normal data, n ≥ 30 per group, equal variance |
| Two independent groups | `wilcox.test(x, y)` |
| Two paired measurements | `wilcox.test(x, y, paired = TRUE)` |
| Three or more independent groups | `kruskal.test(y ~ group)` |
| Three or more paired or blocked groups | `friedman.test(y, groups, blocks)` |
| Rank correlation | `cor.test(x, y, method = "spearman")` |
| Effect size after Wilcoxon | `r = abs(qnorm(p/2)) / sqrt(n)` |

Apply the flowchart *before* you run the test you care about, report an effect size next to every p-value, and remember that "nonparametric" relaxes the distribution assumption, not the independence one.

## References

1. R Core Team. *R documentation: `wilcox.test`, `kruskal.test`, `friedman.test`, `cor.test`*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/00Index.html)
2. Hollander, M., Wolfe, D. A., & Chicken, E. *Nonparametric Statistical Methods*, 3rd ed. Wiley (2014). [Link](https://www.wiley.com/en-us/Nonparametric+Statistical+Methods%2C+3rd+Edition-p-9780470387375)
3. Conover, W. J. *Practical Nonparametric Statistics*, 3rd ed. Wiley (1999). [Link](https://www.wiley.com/en-us/Practical+Nonparametric+Statistics%2C+3rd+Edition-p-9780471160687)
4. Mangiafico, S. *R Companion: Introduction to Traditional Nonparametric Tests*. [Link](https://rcompanion.org/handbook/F_01.html)
5. Helwig, N. E. *Nonparametric Hypothesis Tests in R*, University of Minnesota. [Link](http://users.stat.umn.edu/~helwig/notes/nptest-notes.html)
6. Kruskal, W. H., & Wallis, W. A. (1952). Use of ranks in one-criterion variance analysis. *Journal of the American Statistical Association*, 47(260), 583-621. [Link](https://www.jstor.org/stable/2280779)
7. Wilcoxon, F. (1945). Individual comparisons by ranking methods. *Biometrics Bulletin*, 1(6), 80-83. [Link](https://www.jstor.org/stable/3001968)

## Continue Learning

1. [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), the foundations of hypothesis testing, p-values, and decision rules.
2. [Wilcoxon, Mann-Whitney and Kruskal-Wallis in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html), a deep dive on the three big rank-based tests with worked examples.
3. [Normality and Variance Tests in R](Normality-and-Variance-Tests-in-R.html), the pre-flight checks including Shapiro-Wilk, Anderson-Darling, and Levene's test.
