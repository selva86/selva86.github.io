---
title: "The Resampling 15: Bootstrap and Permutation Problems in R"
slug: "Resampling-Problems-in-R"
description: "Bootstrap and permutation exercises in R: 15 base R drills covering resampled means, medians, correlations, percentile confidence intervals, and the jackknife."
keywords: "bootstrap exercises R, permutation test practice, resampling in R, bootstrap confidence interval R, permutation test R, jackknife R, bootstrap standard error, sample replicate R"
mathjax: true
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Resampling Problems"
sidebar_order: 150
fr_parent: "Bootstrap-in-R.html"
auto_link_terms: "bootstrap exercises|permutation test in r|jackknife resampling|bootstrap confidence interval|resampling in r|bootstrap standard error"
auto_link_case_sensitive: false
target_keyword: "bootstrap exercises R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# The Resampling 15: Bootstrap and Permutation Problems in R

<p class="lead">Fifteen hand-built resampling problems in pure base R, no add-on packages required. You will bootstrap a mean, median, and correlation, turn a bootstrap distribution into a percentile confidence interval, resample a regression slope, run permutation tests for two-group differences, pit a permutation test against the t-test, and finish with a taste of the jackknife. Every problem fixes a seed so your numbers match, and solutions stay hidden until you try.</p>

```r title="Run this once before any exercise"
# Every drill below is pure base R: sample(), replicate(), quantile(), lm(), t.test().
# No add-on packages are needed. datasets ships with R and is already attached; the
# explicit call just documents where mtcars and ToothGrowth come from. Each problem
# sets its own seed, so run them in any order.
library(datasets)
set.seed(1)
```

## Section 1. Bootstrap a statistic from scratch (3 problems)

### Exercise 1.1: Bootstrap the standard error of the mean

**Task:** The `mpg` column of the built-in `mtcars` dataset holds 32 observations. Estimate the standard error of its mean by drawing 2000 bootstrap resamples (each one samples the 32 values with replacement), taking the mean of every resample, and reporting the standard deviation of those 2000 means. Save the result to `ex_1_1`.

**Expected result:**

```
#> [1] 1.065977
```

**Difficulty:** Beginner

[HINTS]
The bootstrap treats your sample as the population: resample it with replacement, recompute the statistic, and let the spread of those recomputations estimate the standard error.
Wrap `mean(sample(x, replace = TRUE))` inside `replicate(2000, ...)`, then take `sd()` of the result.

```r title="Your turn"
set.seed(1)
x <- mtcars$mpg
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
x <- mtcars$mpg
boot_means <- replicate(2000, mean(sample(x, replace = TRUE)))
ex_1_1 <- sd(boot_means)
ex_1_1
#> [1] 1.065977
```

**Explanation:** Each `sample(x, replace = TRUE)` draws 32 values from the same 32, so some appear twice and others not at all, and that is exactly the variation the bootstrap uses to mimic drawing fresh samples from the population. The standard deviation of the 2000 resample means is the bootstrap standard error. Because it assumes no particular distribution, the same recipe works for statistics that have no tidy closed-form standard error. Setting the seed first is what makes your number reproducible.

</details>

### Exercise 1.2: Bootstrap the standard error of the median

**Task:** The median has no simple closed-form standard error, which makes it a natural target for resampling. Using the same `mpg` column from `mtcars`, draw 2000 bootstrap resamples, take the median of each resample, and report the standard deviation of those 2000 medians. Save the result to `ex_1_2`.

**Expected result:**

```
#> [1] 1.303096
```

**Difficulty:** Beginner

[HINTS]
The recipe is identical to bootstrapping the mean; only the statistic you recompute on each resample changes.
Swap `mean` for `median` inside the same `replicate(2000, median(sample(x, replace = TRUE)))` pattern.

```r title="Your turn"
set.seed(2)
x <- mtcars$mpg
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2)
x <- mtcars$mpg
boot_medians <- replicate(2000, median(sample(x, replace = TRUE)))
ex_1_2 <- sd(boot_medians)
ex_1_2
#> [1] 1.303096
```

**Explanation:** The median is a rank-based statistic, so classical standard-error formulas either do not exist or lean on shaky assumptions. The bootstrap sidesteps all of that by recomputing the median on thousands of resampled datasets and measuring how much it moves. Notice the bootstrap standard error here is larger than the mean's, which reflects the median hopping between the two central `mpg` values as the resample composition changes. The principle is general: any statistic you can compute, you can bootstrap.

</details>

### Exercise 1.3: Bootstrap the correlation between mpg and weight

**Task:** A correlation comes with a standard error that leans on an assumption of bivariate normality you may not want to trust. From `mtcars`, resample the rows (not the two columns independently) 2000 times, recompute the correlation between `mpg` and `wt` on each resample, and report the observed correlation together with the bootstrap standard error as a named vector. Save the result to `ex_1_3`.

**Expected result:**

```
#>    estimate     boot_se 
#> -0.86765938  0.03420277 
```

**Difficulty:** Intermediate

[HINTS]
To keep each (mpg, wt) pair intact, resample row indices once and reuse the same indices for both columns.
Draw `idx <- sample(nrow(d), replace = TRUE)` inside `replicate()`, then `cor(d$mpg[idx], d$wt[idx])`.

```r title="Your turn"
set.seed(3)
d <- mtcars[, c("mpg", "wt")]
n <- nrow(d)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
d <- mtcars[, c("mpg", "wt")]
n <- nrow(d)
boot_cor <- replicate(2000, {
  idx <- sample(n, replace = TRUE)
  cor(d$mpg[idx], d$wt[idx])
})
ex_1_3 <- c(estimate = cor(d$mpg, d$wt), boot_se = sd(boot_cor))
ex_1_3
#>    estimate     boot_se 
#> -0.86765938  0.03420277 
```

**Explanation:** The key move is resampling rows, not columns. If you sampled `mpg` and `wt` independently you would shatter their pairing and bootstrap a correlation near zero. Drawing one index vector and applying it to both columns keeps each car's (mpg, wt) pair together, so the resampled correlation reflects the real relationship. The small bootstrap standard error, about 0.03 against an estimate near -0.87, tells you the strong negative correlation is stable rather than an artifact of a few cars.

</details>

## Section 2. Bootstrap confidence intervals (3 problems)

### Exercise 2.1: Build a percentile confidence interval for the mean

**Task:** A bootstrap distribution is more than a standard error: its quantiles are themselves a confidence interval. Draw 2000 bootstrap resample means of the `mtcars` `mpg` column, then take the 2.5th and 97.5th percentiles of that distribution to form a 95 percent percentile confidence interval. Save the two-element result to `ex_2_1`.

**Expected result:**

```
#>     2.5%    97.5% 
#> 18.02188 22.14695 
```

**Difficulty:** Intermediate

[HINTS]
The percentile method reads the interval straight off the bootstrap distribution, with no normal approximation and no plus-or-minus-two-standard-errors rule.
Feed the vector of resample means to `quantile(..., c(0.025, 0.975))`.

```r title="Your turn"
set.seed(4)
x <- mtcars$mpg
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(4)
x <- mtcars$mpg
boot_means <- replicate(2000, mean(sample(x, replace = TRUE)))
ex_2_1 <- quantile(boot_means, c(0.025, 0.975))
ex_2_1
#>     2.5%    97.5% 
#> 18.02188 22.14695 
```

**Explanation:** The percentile interval is the simplest bootstrap confidence interval: sort the resampled statistics and cut off the bottom and top 2.5 percent. It needs no assumption that the sampling distribution is symmetric or normal, which is its main advantage over the textbook `mean plus or minus 1.96 * se` interval. The trade-off is that it can be biased for small samples or skewed statistics, where the bias-corrected and accelerated (BCa) interval does better. For a roughly symmetric statistic like this mean, the percentile interval lands close to the classical result.

</details>

### Exercise 2.2: Build a 90 percent percentile interval for the median

**Task:** Confidence levels are just a choice of tail probabilities. Reusing the bootstrap-the-median recipe on the `mtcars` `mpg` column with 2000 resamples, form a 90 percent percentile confidence interval by taking the 5th and 95th percentiles of the resampled medians. Save the two-element result to `ex_2_2`.

**Expected result:**

```
#>    5%   95% 
#> 17.25 21.40 
```

**Difficulty:** Intermediate

[HINTS]
A 90 percent interval leaves 5 percent in each tail, so the quantile probabilities shift inward from the 95 percent case.
Use `quantile(boot_medians, c(0.05, 0.95))`.

```r title="Your turn"
set.seed(5)
x <- mtcars$mpg
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(5)
x <- mtcars$mpg
boot_medians <- replicate(2000, median(sample(x, replace = TRUE)))
ex_2_2 <- quantile(boot_medians, c(0.05, 0.95))
ex_2_2
#>    5%   95% 
#> 17.25 21.40 
```

**Explanation:** Moving from 95 to 90 percent confidence simply narrows the interval, because you are accepting a higher chance of missing the true value. The bounds here land on round numbers because the bootstrap median can only take values that actually appear in `mpg`, so its distribution is discrete and lumpy. That lumpiness is a genuine feature of bootstrapping an order statistic from a small sample, and it is why a percentile interval for a median looks chunkier than one for a mean.

</details>

### Exercise 2.3: Estimate the bootstrap bias of the correlation

**Task:** A bootstrap can estimate not just spread but bias, the systematic gap between a statistic and what it estimates. From `mtcars`, draw 3000 row resamples, recompute the `mpg` versus `wt` correlation on each, and report the observed correlation, the mean of the bootstrap correlations, and the bias estimate (bootstrap mean minus observed) as a named vector. Save the result to `ex_2_3`.

**Expected result:**

```
#>     estimate    boot_mean         bias 
#> -0.867659377 -0.870073085 -0.002413708 
```

**Difficulty:** Advanced

[HINTS]
Bootstrap bias is the average of the resampled statistics minus the statistic computed on the original sample.
After building `boot_cor` the same way as the correlation exercise, compute `mean(boot_cor) - cor(d$mpg, d$wt)`.

```r title="Your turn"
set.seed(6)
d <- mtcars[, c("mpg", "wt")]
n <- nrow(d)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(6)
d <- mtcars[, c("mpg", "wt")]
n <- nrow(d)
theta_hat <- cor(d$mpg, d$wt)
boot_cor <- replicate(3000, {
  idx <- sample(n, replace = TRUE)
  cor(d$mpg[idx], d$wt[idx])
})
ex_2_3 <- c(estimate  = theta_hat,
            boot_mean = mean(boot_cor),
            bias      = mean(boot_cor) - theta_hat)
ex_2_3
#>     estimate    boot_mean         bias 
#> -0.867659377 -0.870073085 -0.002413708 
```

**Explanation:** The bootstrap estimates bias by asking how far the average resampled statistic drifts from the original estimate. Here the bias is tiny, about -0.002, so the sample correlation is very nearly unbiased and no correction is warranted. When the bias is large relative to the standard error you can subtract it to form a bias-corrected estimate, though doing so inflates variance and is often not worth it. The correlation coefficient is mildly biased in general, and this drill shows the effect is negligible for this dataset.

</details>

## Section 3. Bootstrap a regression coefficient (2 problems)

### Exercise 3.1: Bootstrap the standard error of a regression slope

**Task:** The standard errors that `lm()` reports assume independent, constant-variance, normally distributed errors. For a distribution-free alternative, resample the 32 rows of `mtcars` 2000 times, refit `mpg ~ wt` on each resample, and collect the slope on `wt`. Report the observed slope and the bootstrap standard error as a named vector saved to `ex_3_1`.

**Expected result:**

```
#>   estimate    boot_se 
#> -5.3444716  0.7045009 
```

**Difficulty:** Intermediate

[HINTS]
Bootstrapping a model means refitting it on each resampled dataset and pulling out the one coefficient you care about.
Inside `replicate()`, fit `lm(mpg ~ wt, data = mtcars[idx, ])` and extract `coef(...)[["wt"]]`.

```r title="Your turn"
set.seed(7)
n <- nrow(mtcars)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
n <- nrow(mtcars)
boot_slope <- replicate(2000, {
  idx <- sample(n, replace = TRUE)
  coef(lm(mpg ~ wt, data = mtcars[idx, ]))[["wt"]]
})
ex_3_1 <- c(estimate = coef(lm(mpg ~ wt, data = mtcars))[["wt"]],
            boot_se  = sd(boot_slope))
ex_3_1
#>   estimate    boot_se 
#> -5.3444716  0.7045009 
```

**Explanation:** This is case resampling, or row resampling: each bootstrap dataset is a fresh sample of whole cars, so the refit slope varies because the mix of cars changes. The resulting standard error makes no assumption about the error distribution, which is why it is a useful cross-check on the `summary(lm())` standard error. When the two disagree sharply, it usually signals heteroskedasticity or an influential point. An alternative is residual resampling, which holds the predictors fixed and resamples residuals, but case resampling is more robust when the mean model itself may be misspecified.

</details>

### Exercise 3.2: Compare bootstrap and normal-theory slope intervals

**Task:** Do the bootstrap and the classical regression interval agree for this model? Resample the rows of `mtcars` 2000 times, collect the `mpg ~ wt` slope from each refit, and build a 95 percent percentile interval from those slopes. Stack it against `confint()` from the single full-data fit in a two-row matrix saved to `ex_3_2`.

**Expected result:**

```
#>                    2.5%     97.5%
#> bootstrap     -6.969041 -4.203181
#> normal_theory -6.486308 -4.202635
```

**Difficulty:** Advanced

[HINTS]
You need two intervals for the same slope: one read off the bootstrap distribution, one from the model's own formula.
Combine `quantile(boot_slope, c(0.025, 0.975))` and `confint(fit)["wt", ]` with `rbind()`.

```r title="Your turn"
set.seed(8)
n <- nrow(mtcars)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(8)
n <- nrow(mtcars)
boot_slope <- replicate(2000, {
  idx <- sample(n, replace = TRUE)
  coef(lm(mpg ~ wt, data = mtcars[idx, ]))[["wt"]]
})
ex_3_2 <- rbind(
  bootstrap     = quantile(boot_slope, c(0.025, 0.975)),
  normal_theory = confint(lm(mpg ~ wt, data = mtcars))["wt", ]
)
ex_3_2
#>                    2.5%     97.5%
#> bootstrap     -6.969041 -4.203181
#> normal_theory -6.486308 -4.202635
```

**Explanation:** The two intervals share an upper bound near -4.2 but the bootstrap reaches lower at the bottom, a sign the slope's sampling distribution is slightly left-skewed once you drop the normality assumption. `confint()` inverts a symmetric t interval, so by construction it cannot show that asymmetry. When bootstrap and normal-theory intervals line up you gain confidence the model assumptions are reasonable; when they diverge, trust the bootstrap, because it reads the actual resampling behavior instead of assuming a shape. The column labels come from `quantile()`, since `rbind()` keeps the first argument's names.

</details>

## Section 4. Permutation tests for two-group differences (3 problems)

### Exercise 4.1: Build a permutation distribution for a mean difference

**Task:** A permutation test asks what group differences look like when the labels carry no information. In `mtcars`, compute the observed gap in mean `mpg` between manual (`am == 1`) and automatic (`am == 0`) cars, then shuffle the `am` labels 2000 times and recompute the difference each time. Report the observed difference plus the mean and standard deviation of the permutation differences, saved to `ex_4_1`.

**Expected result:**

```
#>      observed     perm_mean       perm_sd 
#>  7.2449392713 -0.0001651822  2.2139906693 
```

**Difficulty:** Intermediate

[HINTS]
Under the null hypothesis the labels are exchangeable, so reshuffling them and recomputing the statistic builds its null distribution.
Use `sample(am)` (no replacement) to permute the labels inside `replicate()`.

```r title="Your turn"
set.seed(9)
mpg <- mtcars$mpg
am  <- mtcars$am
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(9)
mpg <- mtcars$mpg
am  <- mtcars$am
obs_diff <- mean(mpg[am == 1]) - mean(mpg[am == 0])
perm_diffs <- replicate(2000, {
  shuffled <- sample(am)
  mean(mpg[shuffled == 1]) - mean(mpg[shuffled == 0])
})
ex_4_1 <- c(observed  = obs_diff,
            perm_mean = mean(perm_diffs),
            perm_sd   = sd(perm_diffs))
ex_4_1
#>      observed     perm_mean       perm_sd 
#>  7.2449392713 -0.0001651822  2.2139906693 
```

**Explanation:** Permutation differs from the bootstrap in one crucial way: it samples the labels without replacement, which is what enforces the null hypothesis of no group effect. The permutation mean sits essentially at zero, as it must when the labels are meaningless, and its standard deviation is the spread you would see by chance alone. The observed 7.2 mpg gap is more than three of those chance standard deviations away from zero, which already hints the difference is real. The next exercise turns that hint into a p-value.

</details>

### Exercise 4.2: Turn a permutation distribution into a p-value

**Task:** Extend the previous test into a proper two-sided p-value for the `mtcars` `mpg` difference by transmission type. Use 4000 label shuffles, count how many permuted differences are at least as extreme in absolute value as the observed gap, and apply the add-one correction so the p-value can never be exactly zero. Save the single number to `ex_4_2`.

**Expected result:**

```
#> [1] 0.000499875
```

**Difficulty:** Intermediate

[HINTS]
A two-sided permutation p-value counts the permutations whose absolute statistic meets or exceeds your observed absolute statistic.
Compute `(1 + sum(abs(perm_diffs) >= abs(obs_diff))) / (length(perm_diffs) + 1)`.

```r title="Your turn"
set.seed(10)
mpg <- mtcars$mpg
am  <- mtcars$am
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(10)
mpg <- mtcars$mpg
am  <- mtcars$am
obs_diff <- mean(mpg[am == 1]) - mean(mpg[am == 0])
perm_diffs <- replicate(4000, {
  shuffled <- sample(am)
  mean(mpg[shuffled == 1]) - mean(mpg[shuffled == 0])
})
ex_4_2 <- (1 + sum(abs(perm_diffs) >= abs(obs_diff))) / (length(perm_diffs) + 1)
ex_4_2
#> [1] 0.000499875
```

**Explanation:** The add-one correction, $p = (1 + \#\{|d^*| \ge |d_\text{obs}|\}) / (B + 1)$, treats the observed data as one more equally likely arrangement, which keeps the p-value strictly positive and very slightly conservative. Here almost no shuffle beats the real 7.2 mpg gap, so the p-value is about 0.0005, strong evidence that transmission type and fuel economy are linked. Taking absolute values is what makes the test two-sided; drop it and you would be testing a one-sided alternative instead.

</details>

### Exercise 4.3: Run a permutation test on ToothGrowth supplements

**Task:** Switch datasets to test a real experimental question: does supplement type change tooth growth? In the built-in `ToothGrowth` data, compute the observed difference in mean `len` between orange juice (`OJ`) and ascorbic acid (`VC`), permute the `supp` labels 4000 times, and return the observed difference and the two-sided add-one p-value as a named vector. Save the result to `ex_4_3`.

**Expected result:**

```
#>   obs_diff    p_value 
#> 3.70000000 0.05548613 
```

**Difficulty:** Advanced

[HINTS]
The procedure is identical to the mtcars test; only the response, the grouping variable, and its two labels change.
Permute with `sample(supp)` and compare `mean(len[s == "OJ"]) - mean(len[s == "VC"])` against the observed gap.

```r title="Your turn"
set.seed(11)
len  <- ToothGrowth$len
supp <- ToothGrowth$supp
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
len  <- ToothGrowth$len
supp <- ToothGrowth$supp
obs <- mean(len[supp == "OJ"]) - mean(len[supp == "VC"])
perm <- replicate(4000, {
  s <- sample(supp)
  mean(len[s == "OJ"]) - mean(len[s == "VC"])
})
p_val <- (1 + sum(abs(perm) >= abs(obs))) / (length(perm) + 1)
ex_4_3 <- c(obs_diff = obs, p_value = p_val)
ex_4_3
#>   obs_diff    p_value 
#> 3.70000000 0.05548613 
```

**Explanation:** This is a borderline result: at about 0.055 the p-value sits just above the conventional 0.05 line, so supplement type alone is not quite significant once you ignore dose. That is a useful lesson in itself, since real data rarely hands you a clean verdict, and a permutation test is honest about that ambiguity rather than hiding it behind a formula. Pooling across the two dose levels also dilutes the effect, because dose is the stronger driver of growth in this experiment. A permutation done separately within each dose would be the natural next step.

</details>

## Section 5. Permutation test versus the t-test (2 problems)

### Exercise 5.1: Compare permutation and t-test p-values

**Task:** When the assumptions hold, a permutation test and Welch's t-test should roughly agree. For the `mtcars` `mpg` difference by transmission, compute the two-sided permutation p-value from 4000 shuffles and the `t.test(mpg ~ am)` p-value, then return both in a named vector so you can see how close they land. Save the result to `ex_5_1`.

**Expected result:**

```
#>       perm_p     t_test_p 
#> 0.0002499375 0.0013736383 
```

**Difficulty:** Intermediate

[HINTS]
Run the permutation test and the t-test on the very same data, then place their p-values side by side.
Pull the t-test p-value with `t.test(mpg ~ am)$p.value`.

```r title="Your turn"
set.seed(12)
mpg <- mtcars$mpg
am  <- mtcars$am
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(12)
mpg <- mtcars$mpg
am  <- mtcars$am
obs <- mean(mpg[am == 1]) - mean(mpg[am == 0])
perm <- replicate(4000, {
  s <- sample(am)
  mean(mpg[s == 1]) - mean(mpg[s == 0])
})
perm_p <- (1 + sum(abs(perm) >= abs(obs))) / (length(perm) + 1)
t_p <- t.test(mpg ~ am)$p.value
ex_5_1 <- c(perm_p = perm_p, t_test_p = t_p)
ex_5_1
#>       perm_p     t_test_p 
#> 0.0002499375 0.0013736383 
```

**Explanation:** Both tests agree on the substance: the transmission effect is highly significant either way. They differ in the small print because the t-test relies on a theoretical t distribution while the permutation test builds its null distribution directly from the data, so their p-values need not match digit for digit. With 32 observations and a large effect, the two land close together. The permutation test's real advantage appears when the t-test's normality or equal-variance assumptions fail, which is exactly what the final comparison explores.

</details>

### Exercise 5.2: Watch the tests diverge under an outlier

**Task:** A single wild value can pull the two approaches apart. Two small groups are given in the starter code below, where `group_a` carries one extreme outlier. Compute the two-sided permutation p-value for the difference in means from 4000 shuffles and the `t.test()` p-value, and return both as a named vector so you can compare how each one reacts to the outlier. Save the result to `ex_5_2`.

**Expected result:**

```
#>    perm_p  t_test_p 
#> 0.9865034 0.5330934 
```

**Difficulty:** Advanced

[HINTS]
The outlier inflates the group's variance, which the t-test folds straight into its denominator while the permutation test folds it into every reshuffle instead.
Build a `combined` vector and a `labels` vector, permute the labels, and compare against `t.test(group_a, group_b)`.

```r title="Your turn"
set.seed(13)
group_a <- c(1, 2, 2, 3, 3, 4, 40)   # one wild outlier
group_b <- c(2, 3, 3, 4, 5, 6, 7)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(13)
group_a <- c(1, 2, 2, 3, 3, 4, 40)   # one wild outlier
group_b <- c(2, 3, 3, 4, 5, 6, 7)
obs <- mean(group_a) - mean(group_b)
combined <- c(group_a, group_b)
labels <- rep(c("a", "b"), each = 7)
perm <- replicate(4000, {
  s <- sample(labels)
  mean(combined[s == "a"]) - mean(combined[s == "b"])
})
perm_p <- (1 + sum(abs(perm) >= abs(obs))) / (length(perm) + 1)
t_p <- t.test(group_a, group_b)$p.value
ex_5_2 <- c(perm_p = perm_p, t_test_p = t_p)
ex_5_2
#>    perm_p  t_test_p 
#> 0.9865034 0.5330934 
```

**Explanation:** Neither test flags a significant difference, but they disagree sharply on how unlikely the data are. The outlier of 40 dominates both the mean and the variance of `group_a`, so the observed mean gap is small relative to the enormous spread. The permutation test sees that almost every reshuffle produces an equally extreme or more extreme gap once the 40 lands in either group, pushing its p-value near 1. The t-test's p-value near 0.53 is not trustworthy here, because the outlier wrecks the normality its formula assumes. The lesson: with heavy tails or outliers, prefer a resampling or rank-based test over the t-test.

</details>

## Section 6. A taste of the jackknife (2 problems)

### Exercise 6.1: Estimate a jackknife standard error of the mean

**Task:** The jackknife predates the bootstrap and works by leaving out one observation at a time. For the `mtcars` `mpg` column, compute all 32 leave-one-out means, then combine them into the jackknife standard error of the mean using the standard scaling factor. Return the sample mean and the jackknife standard error as a named vector saved to `ex_6_1`.

**Expected result:**

```
#>         mean jackknife_se 
#>    20.090625     1.065424 
```

**Difficulty:** Beginner

[HINTS]
The jackknife recomputes the statistic on each dataset with exactly one row removed, then rescales the spread of those values.
Get the leave-one-out means with `sapply(1:n, function(i) mean(x[-i]))`, then apply the jackknife variance formula.

```r title="Your turn"
set.seed(14)
x <- mtcars$mpg
n <- length(x)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(14)
x <- mtcars$mpg
n <- length(x)
jack_means <- sapply(1:n, function(i) mean(x[-i]))
jack_se <- sqrt((n - 1) / n * sum((jack_means - mean(jack_means))^2))
ex_6_1 <- c(mean = mean(x), jackknife_se = jack_se)
ex_6_1
#>         mean jackknife_se 
#>    20.090625     1.065424 
```

**Explanation:** The jackknife standard error is $\sqrt{\frac{n-1}{n}\sum_{i}(\bar{x}_{(i)} - \bar{x}_{(\cdot)})^2}$, where $\bar{x}_{(i)}$ is the mean with observation $i$ removed and $\bar{x}_{(\cdot)}$ is the average of those leave-one-out means. That $(n-1)/n$ inflation factor is what turns the tiny leave-one-out variation into a proper standard-error estimate. For a smooth statistic like the mean it matches both the classical formula and the bootstrap almost exactly, which is a reassuring sanity check. The jackknife is fully deterministic, so the seed here changes nothing; it is set only to keep every drill in this collection uniform.

</details>

### Exercise 6.2: Find the most influential point with the jackknife

**Task:** Beyond standard errors, the jackknife reveals which single observation matters most. For the `mpg` versus `wt` correlation in `mtcars`, compute the 32 leave-one-out correlations, use them to estimate the jackknife bias, and identify the car whose removal shifts the correlation the most. Return the estimate, the jackknife bias, and that car name in a one-row data frame saved to `ex_6_2`.

**Expected result:**

```
#>     estimate jackknife_bias  most_influential
#> 1 -0.8676594   -0.002997711 Chrysler Imperial
```

**Difficulty:** Intermediate

[HINTS]
The jackknife bias rescales the gap between the mean of the leave-one-out estimates and the full-sample estimate.
Compute `jack_cor <- sapply(1:n, function(i) cor(d$mpg[-i], d$wt[-i]))`, then find `which.max(abs(jack_cor - theta))`.

```r title="Your turn"
set.seed(15)
d <- mtcars[, c("mpg", "wt")]
n <- nrow(d)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(15)
d <- mtcars[, c("mpg", "wt")]
n <- nrow(d)
theta <- cor(d$mpg, d$wt)
jack_cor <- sapply(1:n, function(i) cor(d$mpg[-i], d$wt[-i]))
jack_bias <- (n - 1) * (mean(jack_cor) - theta)
most_influential <- rownames(d)[which.max(abs(jack_cor - theta))]
ex_6_2 <- data.frame(estimate         = theta,
                     jackknife_bias   = jack_bias,
                     most_influential = most_influential)
ex_6_2
#>     estimate jackknife_bias  most_influential
#> 1 -0.8676594   -0.002997711 Chrysler Imperial
```

**Explanation:** Each leave-one-out correlation asks how much the estimate depends on a single car, and the one that moves it most, the Chrysler Imperial, is the most influential point. The jackknife bias, $(n-1)(\bar{\theta}_{(\cdot)} - \hat{\theta})$, is again tiny here, confirming the correlation is stable. Influence diagnostics like this are the jackknife's real strength: leaving each point out one at a time exposes fragile estimates that a single number could hide. When one observation dominates, that is a cue to inspect it before trusting the fit.

</details>

## What to do next

You now have the core resampling toolkit: bootstrap standard errors and confidence intervals, permutation tests, and the jackknife. Keep building from here:

- [Sampling Methods Exercises in R](Sampling-Methods-Exercises-in-R.html) for stratified, cluster, and weighted designs alongside more bootstrap practice.
- [Confidence Interval Exercises in R](Confidence-Interval-Exercises-in-R.html) to contrast these percentile intervals with the classical and t-based versions.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) to place permutation tests in the wider testing framework.
- [Permutation Tests in R](Permutation-Tests-in-R.html) for the full tutorial behind the two-group tests you just practiced.
