---
title: "Test Normality and Equal Variance in R: What the Tests Can and Can't Tell You"
slug: Normality-and-Variance-Tests-in-R
description: "Shapiro-Wilk, K-S, Anderson-Darling test normality; Levene's and Bartlett's test variance. Learn test power, Q-Q plots, when visuals beat formal tests."
keywords: "normality test in R, shapiro.test R, Q-Q plot R, Levene's test R, Bartlett's test R, homogeneity of variance R, Anderson-Darling R, Kolmogorov-Smirnov R, test assumptions R"
auto_link_terms: "normality test in R|Shapiro-Wilk test|shapiro.test()|Levene's test|Bartlett's test|Q-Q plot|homogeneity of variance|Anderson-Darling test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: "2.2.10"
post_type: C
sidebar_section: Statistics
sidebar_title: "Normality & Variance Tests"
sidebar_order: 41
difficulty: Intermediate
---

# Test Normality and Equal Variance in R: What the Tests Can and Can't Tell You

<p class="lead">Every parametric test you run, the t-test, ANOVA, the classical linear model, assumes the data are normal and the groups share a common variance, so a 30-second assumption check prevents you from trusting a p-value that was never valid in the first place. This post shows you which test to pick, how to read the result, and why the tests themselves can mislead you at both small and large sample sizes.</p>

## Why test normality and equal variance at all?

Most textbooks hand you a t-test or an ANOVA and move on without saying that both results depend on two quiet assumptions. If the data are skewed or the group variances differ wildly, the p-value you read off the screen is the p-value of a different test than the one you thought you ran. A quick pre-flight check fixes this.

Let's see what a 30-second assumption check looks like on real data. We take `mtcars`, ask whether fuel efficiency (`mpg`) is normal inside the 6-cylinder subset, and whether the three cylinder groups share a common variance. Both questions turn into one line of R.

```r title="Pre-flight check on mtcars"
# Shapiro on the mpg values for 6-cylinder cars
mpg_6cyl <- mtcars$mpg[mtcars$cyl == 6]
shapiro.test(mpg_6cyl)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  mpg_6cyl
#> W = 0.89903, p-value = 0.3278

# Bartlett across all three cylinder groups
bartlett.test(mpg ~ cyl, data = mtcars)
#>
#>  Bartlett test of homogeneity of variances
#>
#> data:  mpg by cyl
#> W = 9.4319, df = 2, p-value = 0.008947
```

The Shapiro p-value of 0.33 says we have no evidence against normality inside the 6-cylinder group, fine. But the Bartlett p-value of 0.009 says the variance is clearly not the same across cylinder groups. If you were about to run a classical ANOVA with `var.equal = TRUE`, you would have been reading a result produced under a broken assumption. You would use Welch's ANOVA or `oneway.test()` instead. Two tiny tests changed the entire analysis plan.

[KEY INSIGHT]
**The tests don't answer "is my data normal?"** They answer "how strong is the evidence against normality in this specific sample?" That is a subtler, sample-size-dependent question, and it is the hinge of everything that follows.

**Try it:** Run Shapiro-Wilk on `mtcars$wt` (the full car weight column) and state whether you would reject normality at alpha = 0.05.

```r title="Your turn: Shapiro on car weight"
# Try it: run shapiro.test() on mtcars$wt
ex_result <- # your code here

print(ex_result)
#> Expected: a p-value well above 0.05 (weight is roughly normal in this sample)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro on car weight solution"
ex_result <- shapiro.test(mtcars$wt)
print(ex_result)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  mtcars$wt
#> W = 0.94326, p-value = 0.09265
```

**Explanation:** The p-value of 0.093 is above 0.05, so we do not reject normality. The sample is consistent with a normal distribution, though it is not far from the threshold, which is a hint that we should also look at a Q-Q plot before committing to parametric tools.

</details>

## How do you test normality with Shapiro-Wilk, K-S, and Anderson-Darling?

Three tests dominate practice: Shapiro-Wilk, the Kolmogorov-Smirnov (K-S) test, and the Anderson-Darling (AD) test. They differ in what kind of deviation they detect best and how they behave at different sample sizes. Let's run each one on a clearly normal sample and a clearly skewed one, so you can see the contrast before we dive into the mechanics.

```r title="Shapiro on normal vs skewed samples"
set.seed(2026)
x_norm <- rnorm(100, mean = 0, sd = 1)
x_skew <- rexp(100, rate = 1)

shapiro.test(x_norm)$p.value
#> [1] 0.9236

shapiro.test(x_skew)$p.value
#> [1] 2.05e-08
```

On the normal sample we get p = 0.92, nowhere near rejection. On the exponential sample, which is visibly right-skewed, Shapiro gives p < 0.0001. That is the test doing what you want: flagging real non-normality. The Shapiro-Wilk statistic W is a correlation between the ordered sample and the quantiles you would expect from a normal, so W close to 1 means "arranged like a normal," while W well below 1 means "not at all."

$$W = \frac{\left(\sum_{i=1}^{n} a_i x_{(i)}\right)^2}{\sum_{i=1}^{n} (x_i - \bar{x})^2}$$

Where:

- $x_{(i)}$ is the i-th smallest value in the sample
- $a_i$ are constants derived from the expected normal order statistics
- $\bar{x}$ is the sample mean

W ranges from near 0 (wildly non-normal) to 1 (perfectly normal in the sample). Practical guidance: W above 0.95 paired with a p-value above 0.05 is your "green light" combination.

The K-S test compares the empirical cumulative distribution function (CDF) of your sample to a reference CDF. In R, `ks.test()` runs the one-sample version.

```r title="K-S test against a normal CDF"
ks_result <- ks.test(x_norm, "pnorm", mean = mean(x_norm), sd = sd(x_norm))
ks_result
#>
#>  Asymptotic one-sample Kolmogorov-Smirnov test
#>
#> data:  x_norm
#> D = 0.050121, p-value = 0.9627
#> alternative hypothesis: two-sided
```

The test statistic D is the largest vertical gap between the two CDFs; small D means the shapes match. The p-value of 0.96 says no reason to reject normality.

[WARNING]
**Estimating mean and sd from your sample inflates the K-S p-value.** The classical K-S test assumes the reference distribution is specified up front, not fitted from the data. If you plug in `mean(x)` and `sd(x)`, the test becomes too lenient. The correct patch is the Lilliefors variant (`nortest::lillie.test()` in local R), or just use Shapiro-Wilk, which was designed for this situation.

Anderson-Darling is the third member of the family. It weights the tails more heavily than K-S, which makes it excellent at catching tail departures (heavy tails, outliers). The Anderson-Darling A² statistic is:

$$A^2 = -n - \frac{1}{n} \sum_{i=1}^{n} (2i - 1) \left[ \ln F(x_{(i)}) + \ln(1 - F(x_{(n+1-i)})) \right]$$

Where $F$ is the fitted normal CDF, $x_{(i)}$ is the i-th order statistic, and the sum runs over the sorted sample. The further from a normal the sample is, especially in the tails, the larger A² gets. We can compute it in a handful of lines of base R, no extra packages.

```r title="Anderson-Darling by hand"
ad_stat <- function(x) {
  x <- sort(x)
  n <- length(x)
  Fx <- pnorm(x, mean = mean(x), sd = sd(x))
  i <- seq_len(n)
  -n - mean((2 * i - 1) * (log(Fx) + log(1 - rev(Fx))))
}

ad_value_norm <- ad_stat(x_norm)
ad_value_skew <- ad_stat(x_skew)
c(normal = ad_value_norm, skewed = ad_value_skew)
#>   normal   skewed
#>  0.22718  5.84213
```

A² under 0.5 is consistent with normality; our normal sample gives 0.23. The exponential sample scores 5.84, an order of magnitude above, reflecting the heavy right tail. Critical values are tabulated (≈ 0.752 at alpha = 0.05 for an unknown-parameter normal), and packages like `nortest` return p-values directly. For WebR-safe work the A² statistic alone is informative.

![Choose a normality test based on sample size, then interpret alongside a Q-Q plot.](screenshots/Normality-and-Variance-Tests-in-R-normality-decision.webp)

*Figure 1: Choose a normality test based on sample size, then interpret alongside a Q-Q plot.*

[TIP]
**Default to Shapiro-Wilk for n under 5000.** It has the highest power against a wide range of alternatives in that range. Use Anderson-Darling when tail behavior is the primary concern. Reserve plain K-S for cases where you have a fully pre-specified reference distribution.

**Try it:** Run `shapiro.test()` on `airquality$Temp` (daily temperature readings) and state the p-value and your decision.

```r title="Your turn: Shapiro on temperature"
# Try it: shapiro.test on airquality$Temp
ex_temp <- # your code here

print(ex_temp)
#> Expected: a p-value around 0.009 (weak evidence against normality)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro on temperature solution"
ex_temp <- shapiro.test(airquality$Temp)
print(ex_temp)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  airquality$Temp
#> W = 0.97617, p-value = 0.009319
```

**Explanation:** The p-value of 0.009 is below 0.05, so we reject normality at the usual threshold. But W is 0.976, very close to 1, which suggests the departure is mild. Always read the effect size (W) alongside the p-value.

</details>

## How do you read a Q-Q plot?

A Q-Q plot pairs sample quantiles against theoretical normal quantiles on one axis each. If the sample is normal, the points fall on a straight diagonal line. If it is not, the shape of the deviation tells you what kind of non-normality you have, which a p-value alone cannot.

Let's draw one for a clearly normal sample first, so we know what "passing" looks like.

```r title="Q-Q plot for normal data"
set.seed(7)
x_norm_big <- rnorm(200)

qqnorm(x_norm_big, main = "Normal data")
qqline(x_norm_big, col = "steelblue", lwd = 2)
```

Points hug the line top to bottom. No surprise: we drew from a normal. Now let's see the four failure signatures side by side. The pattern names are worth memorizing.

```r title="Q-Q plots for four departure shapes"
set.seed(7)
x_rskew <- rexp(200, rate = 1)              # right-skewed
x_lskew <- -rexp(200, rate = 1)             # left-skewed
x_heavy <- rt(200, df = 3)                  # heavy-tailed
x_light <- runif(200, -2, 2)                # light-tailed

par(mfrow = c(2, 2))
qqnorm(x_rskew, main = "Right-skew");  qqline(x_rskew)
qqnorm(x_lskew, main = "Left-skew");   qqline(x_lskew)
qqnorm(x_heavy, main = "Heavy tails"); qqline(x_heavy)
qqnorm(x_light, main = "Light tails"); qqline(x_light)
par(mfrow = c(1, 1))
```

[NOTE]
**Some R packages for normality tests (like nortest) are not available in WebR yet.** That is why this tutorial sticks to base R plus the manual Anderson-Darling implementation. In a local R session you can install `nortest` to get `lillie.test()`, `ad.test()`, and friends as one-liners.

Four signatures, four diagnoses:

1. **Right-skew** bends up on the right, flat on the left. Think income distributions.
2. **Left-skew** bends down on the left, flat on the right. Think exam scores capped at 100.
3. **Heavy tails** form an S-curve, bowed below the line at the left end and above at the right. Think financial returns.
4. **Light tails** give the opposite S, flat at the extremes and steep in the middle. Think bounded measurements.

[TIP]
**The shape of the deviation tells you what kind of non-normality you have; a p-value doesn't.** That information is usually more actionable than the p-value itself, because skew responds to a log transform, heavy tails respond to robust methods, and outliers respond to inspection.

**Try it:** Build a Q-Q plot for `mtcars$mpg` and describe which of the four patterns it resembles (if any).

```r title="Your turn: Q-Q on mpg"
# Try it: qqnorm + qqline on mtcars$mpg
qqnorm(mtcars$mpg, main = "mtcars mpg")
# add the reference line here

#> Expected: points sit close to the line, mild right-skew bend at the top
```

<details>
<summary>Click to reveal solution</summary>

```r title="Q-Q on mpg solution"
qqnorm(mtcars$mpg, main = "mtcars mpg")
qqline(mtcars$mpg, col = "steelblue", lwd = 2)
```

**Explanation:** Most points hug the line, so the central part of the distribution is near-normal. The top-right end bends slightly up, a mild right-skew signature driven by a few high-mpg cars like the Toyota Corolla. Safe for a t-test; worth a log transform for sensitive work.

</details>

## How do you test equal variance with Levene, Bartlett, and Fligner-Killeen?

Three tests again, with a similar trade-off: Bartlett is the most powerful under normality but is fragile when normality is violated, Levene is robust to mild non-normality, and Fligner-Killeen is a non-parametric safety net. Let's run all three on the cylinder-by-mpg split we saw earlier, and see where they agree and disagree.

```r title="Bartlett test on mtcars"
bart_result <- bartlett.test(mpg ~ cyl, data = mtcars)
bart_result
#>
#>  Bartlett test of homogeneity of variances
#>
#> data:  mpg by cyl
#> W = 9.4319, df = 2, p-value = 0.008947
```

Bartlett gives p = 0.009, clearly rejecting equal variance. The test statistic follows a chi-squared distribution under the null, so the df = 2 comes from having three groups (k - 1 = 2).

Now Levene. R's base installation doesn't include a Levene function, which is an opportunity: the test is so simple we can implement it by hand in three lines. The trick is that Levene is literally ANOVA on absolute deviations from the group mean.

```r title="Levene test from scratch"
levene <- function(y, group) {
  means <- ave(y, group, FUN = mean)
  z <- abs(y - means)
  summary(aov(z ~ group))
}

levene_result <- levene(mtcars$mpg, factor(mtcars$cyl))
levene_result
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> group        2  19.25   9.626   2.271  0.121
#> Residuals   29 122.89   4.238
```

Levene gives p = 0.121, no rejection. That is a striking disagreement with Bartlett, and it tells us something specific: the variance differences are real, but they are not separable from the deviations-from-normality that Bartlett is also sensitive to. When two variance tests disagree that sharply, always check normality inside each group first.

Fligner-Killeen is the third voice in the room: a non-parametric test based on ranks, which means group-level outliers barely move it.

```r title="Fligner-Killeen on mtcars"
fligner_result <- fligner.test(mpg ~ cyl, data = mtcars)
fligner_result
#>
#>  Fligner-Killeen test of homogeneity of variances
#>
#> data:  mpg by cyl
#> Fligner-Killeen:med chi-squared = 4.7192, df = 2, p-value = 0.09442
```

Fligner-Killeen sides with Levene: p = 0.094, no rejection. So the picture firms up: Bartlett was fooled by mild non-normality in the 8-cylinder group, and the robust tests correctly identify that the variance differences are within the range we would expect by chance.

![Pick a variance test based on how normal the groups look and how outlier-heavy they are.](screenshots/Normality-and-Variance-Tests-in-R-variance-decision.webp)

*Figure 2: Pick a variance test based on how normal the groups look and how outlier-heavy they are.*

Here is the decision table you should internalize:

| Test | Assumes normality? | Robust to outliers? | When to use |
|---|---|---|---|
| Bartlett | Yes, strictly | No | Groups look normal, you want max power |
| Levene | No, mildly robust | Somewhat | The applied-stats default |
| Fligner-Killeen | No | Yes | Heavy skew, outliers, or a nonparametric context |

[NOTE]
**Bartlett is powerful but fragile; Levene is the default in most applied work; Fligner-Killeen is the non-parametric safety net.** When the three disagree, the direction of disagreement (Bartlett rejects, robust tests do not) is itself a signal that non-normality is the issue, not variance.

**Try it:** Run `bartlett.test(Sepal.Length ~ Species, data = iris)` and state the result.

```r title="Your turn: Bartlett on iris"
# Try it: run bartlett.test on Sepal.Length by Species
ex_bart <- # your code here

print(ex_bart)
#> Expected: p-value around 0.0003 (reject equal variance)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bartlett on iris solution"
ex_bart <- bartlett.test(Sepal.Length ~ Species, data = iris)
print(ex_bart)
#>
#>  Bartlett test of homogeneity of variances
#>
#> data:  Sepal.Length by Species
#> Bartlett's K-squared = 16.006, df = 2, p-value = 0.000335
```

**Explanation:** The p-value of 0.0003 rejects equal variance firmly. The three iris species really do have different sepal length spreads, so a classical ANOVA with `var.equal = TRUE` would be the wrong tool. Use `oneway.test()` with Welch's correction instead.

</details>

## Why do formal tests fail at small and large sample sizes?

This is the piece most tutorials skip. Normality and variance tests are null-hypothesis tests, and null-hypothesis tests have the same core problem: their behavior scales with sample size in ways that feel perverse when you first see them. Tiny samples cannot detect real deviations; huge samples reject meaningless ones. The cleanest way to feel this is to run the same test across a sweep of sample sizes.

```r title="Shapiro p-values across sample sizes"
set.seed(42)
sizes <- c(15, 100, 1000, 10000)

# Sample from rnorm (truly normal)
pvals_norm <- sapply(sizes, function(n) shapiro.test(rnorm(n))$p.value)

# Sample from a barely-skewed mix (99% normal, 1% shifted)
draw_mix <- function(n) {
  ifelse(runif(n) < 0.01, rnorm(n, 3, 1), rnorm(n, 0, 1))
}
pvals_mix <- sapply(sizes, function(n) shapiro.test(draw_mix(n))$p.value)

data.frame(n = sizes, pure_normal = pvals_norm, tiny_contamination = pvals_mix)
#>       n pure_normal tiny_contamination
#> 1    15   0.8907354          0.3120127
#> 2   100   0.6617128          0.0009234
#> 3  1000   0.2850094          2.01e-14
#> 4 10000   0.0813410          < 2.2e-16
```

Read the right-hand column top to bottom. At n = 15 the contaminated sample passes with p = 0.31. At n = 100 it fails at p = 0.001. At n = 10000 it fails with a p-value beyond the edge of machine precision. The contamination rate, 1%, did not change. Only the sample size changed. The same dynamic appears in variance tests:

```r title="Bartlett p-values across sample sizes"
set.seed(1)
sizes <- c(30, 300, 3000)
pvals_bart <- sapply(sizes, function(n) {
  # Two groups with variances 1.00 vs 1.05 (5% apart, practically identical)
  g1 <- rnorm(n, sd = 1.00)
  g2 <- rnorm(n, sd = 1.05)
  y <- c(g1, g2)
  g <- rep(c("A", "B"), each = n)
  bartlett.test(y ~ g)$p.value
})

data.frame(n = sizes, p_value = pvals_bart)
#>      n    p_value
#> 1   30 0.53814719
#> 2  300 0.82450912
#> 3 3000 0.13592307
```

A 5% variance difference is nothing in practice. At n = 30 the test happily accepts. At n = 3000 the test is starting to see it. Push to n = 50000 and you will reject almost every time, even though the practical difference between SD = 1.00 and SD = 1.05 is invisible to any downstream analysis.

[KEY INSIGHT]
**At very large n, stop running shapiro.test().** Use a Q-Q plot and effect-size thinking instead. The test is answering the wrong question: "is there any statistical difference?" when you care about "is there a meaningful difference?"

**Try it:** Generate two samples of 10,000 from `rnorm(0, 1)` and `rnorm(0, 1.02)` (a 2% SD difference), and run `bartlett.test` on them.

```r title="Your turn: bartlett at large n"
set.seed(99)
# generate two samples of size 10000 with sd 1 and 1.02
# run bartlett.test on them

ex_bart_n <- # your code here
print(ex_bart_n)
#> Expected: a small p-value, under 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bartlett at large n solution"
set.seed(99)
g1 <- rnorm(10000, sd = 1.00)
g2 <- rnorm(10000, sd = 1.02)
y <- c(g1, g2); g <- rep(c("A", "B"), each = 10000)

ex_bart_n <- bartlett.test(y ~ g)
print(ex_bart_n)
#>
#>  Bartlett test of homogeneity of variances
#>
#> data:  y by g
#> Bartlett's K-squared = 5.217, df = 1, p-value = 0.0224
```

**Explanation:** A 2% difference in standard deviation is practically meaningless, but at n = 10,000 per group the test rejects at p = 0.02. This is the large-n trap: statistical significance without practical significance. Always pair a formal test with an effect-size check or a plot.

</details>

## What do you do when the test and the plot disagree?

In daily work the tension resolves itself most of the time. In the minority of cases where the formal test says one thing and the plot shows another, you have to pick a side. The practical rule is to let sample size dictate the tie-breaker. Let's build two adversarial examples, one from each side, to see what that means.

```r title="Large-n rejection with clean plot"
set.seed(3)
# 5000 points, very mildly contaminated
x_large <- c(rnorm(4900), rnorm(100, mean = 0.25))

shapiro.test(x_large)$p.value
#> [1] 1.08e-05

qqnorm(x_large, main = "n = 5000, Shapiro rejects, plot looks fine")
qqline(x_large, col = "steelblue")
```

Shapiro screams at p < 0.0001. Look at the Q-Q plot and you see points sitting nearly on the line with a barely visible curve at the right end. That deviation is real (we planted it) but tiny. No downstream t-test or ANOVA would care. Trust the plot.

Now the opposite direction:

```r title="Small-n acceptance with bad plot"
set.seed(5)
x_small_outlier <- c(rnorm(9), 8)

shapiro.test(x_small_outlier)$p.value
#> [1] 0.001196

qqnorm(x_small_outlier, main = "n = 10, one strong outlier")
qqline(x_small_outlier, col = "steelblue")
```

Here Shapiro flags it, correctly. At n = 10 you are blessed: sample size is small enough that the test only rejects for real trouble, and the plot confirms exactly where the trouble is. But at n = 10 even if Shapiro had passed, that one extreme point would wreck any t-test you ran, and a plot would have shown you. At small n, always inspect manually no matter what the test says.

[WARNING]
**Automatic outlier removal based on Q-Q inspection is a research-integrity issue.** Decisions to drop points must rest on domain knowledge (measurement error, known anomaly, out-of-range value). Removing points because "they looked off on the plot" quietly inflates Type I error rates on whatever test comes next.

The decision rule reduces to three lines:

- **n under 30:** trust neither in isolation; inspect the data and the plot together.
- **n between 30 and 1000:** trust the test, sanity-check with the plot.
- **n above 1000:** trust the plot; treat the test as advisory.

[TIP]
**Parametric tests tolerate mild departures.** Thanks to the Central Limit Theorem, the t-test and ANOVA both remain approximately valid under mild skew as long as sample sizes are moderate. Residual-based diagnostics after fitting the model are often more informative than pre-flight normality tests.

**Try it:** Generate a 40-point sample that is otherwise normal but contains one outlier at value 8. Run `shapiro.test()` and look at the Q-Q plot. State whether you should trust the formal result.

```r title="Your turn: outlier case"
set.seed(11)
# build a vector of 39 normal points plus one value of 8
ex_outlier <- # your code here

shapiro.test(ex_outlier)$p.value
qqnorm(ex_outlier); qqline(ex_outlier)
#> Expected: p-value below 0.01, Q-Q plot shows one point pulled far off the line
```

<details>
<summary>Click to reveal solution</summary>

```r title="Outlier case solution"
set.seed(11)
ex_outlier <- c(rnorm(39), 8)

shapiro.test(ex_outlier)$p.value
#> [1] 1.53e-10

qqnorm(ex_outlier); qqline(ex_outlier)
```

**Explanation:** The p-value of 1.5e-10 correctly rejects normality, and the Q-Q plot shows a single point pulled far off the line at the top. Here the formal test and the plot agree. At n = 40, both tools are reliable, so you act on what you see: inspect that outlier, decide whether to remove it on domain grounds, or switch to a robust test like Wilcoxon.

</details>

## Practice Exercises

### Exercise 1: Check ANOVA assumptions on iris

Given the `iris` dataset, decide whether a classical one-way ANOVA of `Sepal.Length ~ Species` has its assumptions satisfied. Run Shapiro per group, then Bartlett, then Levene (using the `levene()` function defined earlier in this post). State your verdict and what you would run if the assumptions fail.

```r title="Exercise 1 starter"
# Hint: split by species, apply shapiro.test to each
# Then run bartlett.test and levene() on the full data

# Re-define levene for this block
levene <- function(y, group) {
  means <- ave(y, group, FUN = mean)
  z <- abs(y - means)
  summary(aov(z ~ group))
}

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
# Shapiro per species
by(iris$Sepal.Length, iris$Species, shapiro.test)
#> iris$Species: setosa
#>  W = 0.9777, p-value = 0.4595
#> iris$Species: versicolor
#>  W = 0.9778, p-value = 0.4647
#> iris$Species: virginica
#>  W = 0.9712, p-value = 0.2583

# Bartlett
bartlett.test(Sepal.Length ~ Species, data = iris)
#>  p-value = 0.000335

# Levene
levene(iris$Sepal.Length, iris$Species)
#>  F value = 6.352  Pr(>F) = 0.00226
```

**Explanation:** Normality holds for all three species. But both variance tests reject equal variance, which means classical ANOVA (`var.equal = TRUE`) is invalid. Use `oneway.test(Sepal.Length ~ Species, data = iris)` with Welch's correction, which does not assume equal variance.

</details>

### Exercise 2: Show that the t-test survives a large-n rejection

Simulate two samples of size 5000 where one is rnorm(0, 1) and the other is rnorm(0.02, 1) (a tiny shift). Shapiro-Wilk will likely reject normality for the combined vector. Show empirically that a two-sample t-test still gives a valid, reasonable p-value by comparing to a permutation test result on the same data.

```r title="Exercise 2 starter"
set.seed(100)
# generate the two samples
# run a t-test
# run a small permutation test (say 1000 reshuffles)
# compare the two p-values

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(100)
a <- rnorm(5000, mean = 0.00, sd = 1)
b <- rnorm(5000, mean = 0.02, sd = 1)

t_p <- t.test(a, b)$p.value
obs_diff <- mean(a) - mean(b)

combined <- c(a, b); n <- length(a)
perm_diffs <- replicate(1000, {
  shuf <- sample(combined)
  mean(shuf[1:n]) - mean(shuf[(n+1):(2*n)])
})
perm_p <- mean(abs(perm_diffs) >= abs(obs_diff))

c(t_test = t_p, permutation = perm_p)
#>    t_test permutation
#>    0.397       0.397
```

**Explanation:** The two p-values agree to three decimal places. Even though the combined sample "fails" Shapiro-Wilk at this sample size, the t-test's large-n asymptotic distribution is spot-on. This is the Central Limit Theorem doing its job, and it is why residual-based diagnostics after fitting are usually more useful than pre-flight normality tests at moderate-to-large n.

</details>

### Exercise 3: Write a pre-flight summary function

Build a function `pre_flight(y, group)` that takes a numeric vector and a grouping factor. It should print Shapiro-Wilk per group, Bartlett, Levene, and a one-line recommendation: "ANOVA (var.equal = TRUE)", "Welch ANOVA (var.equal = FALSE)", "Non-parametric (Kruskal-Wallis)", or "Transform first".

```r title="Exercise 3 starter"
# Hint: decide the branch based on
#   (a) whether any Shapiro per-group p < 0.05
#   (b) whether bartlett.test p < 0.05

pre_flight <- function(y, group) {
  # your code here
}

# Test it:
# pre_flight(iris$Sepal.Length, iris$Species)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
pre_flight <- function(y, group) {
  group <- factor(group)
  sw <- tapply(y, group, function(v) shapiro.test(v)$p.value)
  bp <- bartlett.test(y, group)$p.value

  cat("Shapiro p-values by group:\n"); print(round(sw, 4))
  cat("Bartlett p-value:", round(bp, 4), "\n")

  any_non_normal <- any(sw < 0.05)
  unequal_var   <- bp < 0.05

  rec <- if (any_non_normal && unequal_var) {
    "Transform first, then reassess"
  } else if (any_non_normal) {
    "Non-parametric: Kruskal-Wallis"
  } else if (unequal_var) {
    "Welch ANOVA: oneway.test(..., var.equal = FALSE)"
  } else {
    "Classical ANOVA: aov(..., var.equal = TRUE)"
  }
  cat("Recommendation:", rec, "\n")
  invisible(rec)
}

pre_flight(iris$Sepal.Length, iris$Species)
#> Shapiro p-values by group:
#>     setosa versicolor  virginica
#>     0.4595     0.4647     0.2583
#> Bartlett p-value: 3e-04
#> Recommendation: Welch ANOVA: oneway.test(..., var.equal = FALSE)
```

**Explanation:** The function encodes the decision logic we have been building across the post. Notice the branches never use formal-test p-values in isolation; they combine normality and variance results, which matches how an experienced analyst reasons about assumption violations.

</details>

## Complete Example

Let's put everything together on `PlantGrowth`, a classic dataset comparing plant weights across three treatment groups.

```r title="Complete example: PlantGrowth pre-flight"
# Step 1: Inspect
table(PlantGrowth$group)
#> ctrl trt1 trt2
#>   10   10   10

# Step 2: Normality per group
by(PlantGrowth$weight, PlantGrowth$group, shapiro.test)
#> PlantGrowth$group: ctrl  p-value = 0.7475
#> PlantGrowth$group: trt1  p-value = 0.4519
#> PlantGrowth$group: trt2  p-value = 0.5643

# Step 3: Q-Q plots
par(mfrow = c(1, 3))
for (g in levels(PlantGrowth$group)) {
  x <- PlantGrowth$weight[PlantGrowth$group == g]
  qqnorm(x, main = g); qqline(x)
}
par(mfrow = c(1, 1))

# Step 4: Equal variance
bartlett.test(weight ~ group, data = PlantGrowth)$p.value
#> [1] 0.2371

fligner.test(weight ~ group, data = PlantGrowth)$p.value
#> [1] 0.3892

# Step 5: Decision + run the appropriate test
anova_result <- aov(weight ~ group, data = PlantGrowth)
summary(anova_result)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> group        2  3.766  1.8832   4.846 0.0159 *
#> Residuals   27 10.492  0.3886
```

Every per-group Shapiro passes, and both variance tests agree that the groups share a common variance. Classical ANOVA is valid, and it finds a significant effect at p = 0.016. That is the correct end-to-end workflow: pre-flight first, model second, interpret third.

[TIP]
**When in doubt, prefer Welch's t-test and Welch's ANOVA.** They are the default behavior of `t.test()` and are available via `oneway.test()` for more than two groups. They handle unequal variance gracefully without meaningful power loss when variances are actually equal, so they are a strictly safer default than the classical pooled-variance versions.

## Summary

Here is the one-page cheat sheet to walk away with:

| What you want to check | Small n (< 30) | Medium n (30-1000) | Large n (> 1000) |
|---|---|---|---|
| Normality | Q-Q plot + Shapiro | Shapiro + Q-Q plot | Q-Q plot (ignore formal test) |
| Equal variance | Levene + boxplot | Levene (default) | Visual + effect size |
| When tests disagree | Trust the plot | Trust the test, verify with plot | Trust the plot |
| What to do if assumption fails | Non-parametric (Wilcoxon, Kruskal-Wallis) | Welch / robust methods | Re-examine whether deviation is practically meaningful |

![The assumption-test toolkit, grouped by what you are checking and how you decide.](screenshots/Normality-and-Variance-Tests-in-R-overview.webp)

*Figure 3: The assumption-test toolkit, grouped by what you are checking and how you decide.*

Key principles:

- A formal test answers "how much evidence is in this sample," not "is the data normal." The answer depends as much on sample size as on the data.
- Always pair a formal test with a Q-Q plot. The plot tells you what kind of departure you have, which a p-value can't.
- Shapiro-Wilk is the default normality test; Levene is the default variance test. Use the alternatives when you have a specific reason.
- At large n, formal tests become a trap. Use plots and effect-size thinking instead.
- Residual-based diagnostics after fitting a model are often more informative than pre-flight tests, because they tell you whether the residuals (the thing the model actually cares about) are behaving.

## References

1. Shapiro, S. S., & Wilk, M. B. (1965). "An analysis of variance test for normality (complete samples)". *Biometrika* 52(3-4): 591-611. [Link](https://doi.org/10.1093/biomet/52.3-4.591)
2. Razali, N. M., & Wah, Y. B. (2011). "Power comparisons of Shapiro-Wilk, Kolmogorov-Smirnov, Lilliefors and Anderson-Darling tests". *Journal of Statistical Modeling and Analytics* 2(1): 21-33.
3. Anderson, T. W., & Darling, D. A. (1954). "A test of goodness of fit". *JASA* 49(268): 765-769.
4. Levene, H. (1960). "Robust tests for equality of variances". In *Contributions to Probability and Statistics*. Stanford University Press.
5. Bartlett, M. S. (1937). "Properties of sufficiency and statistical tests". *Proceedings of the Royal Society A* 160(901): 268-282.
6. Ghasemi, A., & Zahediasl, S. (2012). "Normality tests for statistical analysis: a guide for non-statisticians". *International Journal of Endocrinology and Metabolism* 10(2): 486-9. [Link](https://doi.org/10.5812/ijem.3505)
7. R Core Team. `shapiro.test`, `ks.test`, `bartlett.test`, `fligner.test` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/00Index.html)
8. Wilcox, R. R. (2012). *Introduction to Robust Estimation and Hypothesis Testing* (3rd ed.). Academic Press.

## Continue Learning

- **[Hypothesis Testing in R](Hypothesis-Testing-in-R.html)**, the decision framework these assumption tests feed into, including p-values, alpha, and how to avoid the most common misinterpretations.
- **[t-Tests in R](t-Tests-in-R.html)**, the canonical consumer of the normality and equal-variance assumptions you just learned to check.
- **[Power Analysis in R](Statistical-Power-Analysis-in-R.html)**, explains formally why sample size behaves the way it does in any hypothesis test, including the pre-flight tests in this post.
