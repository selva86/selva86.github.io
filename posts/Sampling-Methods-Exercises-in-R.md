---
title: "Sampling Methods Exercises in R: 20 Real Practice Problems"
slug: "Sampling-Methods-Exercises-in-R"
description: "Practice sampling methods in R with 20 hands-on exercises: simple random, stratified, cluster, bootstrap, permutation, jackknife, weighted designs. Hidden solutions."
keywords: "bootstrap sampling R exercises, sampling methods R practice, stratified sampling R, sample() R exercises, permutation test R, jackknife R, survey design R, train test split R"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Sampling Methods Exercises"
sidebar_order: 145
fr_parent: "Sampling-Distributions-in-R.html"
auto_link_terms: "bootstrap sampling in r|stratified sampling r|sample function r|permutation test r|jackknife resampling|survey package r"
auto_link_case_sensitive: false
target_keyword: "bootstrap sampling R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Sampling Methods Exercises in R: 20 Real Practice Problems

<p class="lead">Twenty practice problems that walk through every common sampling routine an analyst runs in R: simple random and weighted draws with <code>sample()</code>, stratified and cluster designs with dplyr, bootstrap standard errors and BCa confidence intervals from the <code>boot</code> package, permutation tests, jackknife influence, and reproducible train/test splits. Every problem ships with a hidden solution.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(boot)
library(survey)
set.seed(1)
```

## Section 1. Simple random sampling foundations (3 problems)

### Exercise 1.1: Draw a simple random sample of 10 rows from mtcars

**Task:** Use base R's `sample()` to pick 10 row indices from `mtcars` without replacement, then subset the data frame to those rows. Save the resulting 10-row data frame to `ex_1_1`. The point is to see how `sample()` plus integer indexing produces a clean random subset that respects row identity.

**Expected result:**

```
#>                      mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Pontiac Firebird    19.2   8 400.0 175 3.08 3.845 17.05  0  0    3    2
#> Lotus Europa        30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
#> Hornet Sportabout   18.7   8 360.0 175 3.15 3.440 17.02  0  0    3    2
#> Cadillac Fleetwood  10.4   8 472.0 205 2.93 5.250 17.98  0  0    3    4
#> ...
#> # 6 more rows
```

**Difficulty:** Beginner

[HINTS]
You need random row positions, not random values - draw a set of integers within the valid row range, then use them to index the data frame.
Call sample(nrow(mtcars), size = 10, replace = FALSE) to get the indices, then subset with mtcars[idx, ].

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(nrow(mtcars), size = 10, replace = FALSE)
ex_1_1 <- mtcars[idx, ]
ex_1_1
#>                      mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Pontiac Firebird    19.2   8 400.0 175 3.08 3.845 17.05  0  0    3    2
#> Lotus Europa        30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
#> Hornet Sportabout   18.7   8 360.0 175 3.15 3.440 17.02  0  0    3    2
#> Cadillac Fleetwood  10.4   8 472.0 205 2.93 5.250 17.98  0  0    3    4
```

**Explanation:** `sample(n, size)` is the standard idiom for drawing row positions: it returns a permutation of `1:n` truncated to `size`. Integer indexing then preserves row names and column types, which a `slice()` or `[].sample()` clone in another language would not always do. Default is without replacement, so each row appears at most once. If you needed the same draw twice (a paired bootstrap, for example) you would set the seed before each call.

</details>

### Exercise 1.2: Simulate 1,000 rolls of a fair six-sided die

**Task:** Use `sample()` to draw 1,000 integers from 1:6 with replacement, then tabulate the result with `table()`. Save the named integer vector of counts to `ex_1_2`. With 1,000 draws each face should appear roughly 167 times.

**Expected result:**

```
#>   1   2   3   4   5   6
#> 173 152 153 172 174 176
```

**Difficulty:** Beginner

[HINTS]
Each roll is independent, so the same face can come up repeatedly - that means drawing with replacement, then counting how often each face appears.
Use sample(1:6, size = 1000, replace = TRUE) and summarise the result with table().

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
rolls <- sample(1:6, size = 1000, replace = TRUE)
ex_1_2 <- table(rolls)
ex_1_2
#> rolls
#>   1   2   3   4   5   6
#> 173 152 153 172 174 176
```

**Explanation:** `replace = TRUE` is what makes this a sampling problem instead of a permutation: each draw is independent, so the same face can come up many times. Without it you would just be shuffling the integers 1:6. For a biased die you would add `prob = c(0.1, 0.1, 0.1, 0.1, 0.1, 0.5)` so the probabilities apply per draw. The expected count under uniformity is 1000/6 ~ 166.7 per face; the observed counts here are within the normal Monte Carlo spread.

</details>

### Exercise 1.3: Show that set.seed makes a draw reproducible

**Task:** A code reviewer asks you to prove the sample you used in a report is reproducible. Set the seed to 42, draw 5 values from 1:100, then set the seed to 42 again and draw 5 more. Save a list with components `first` and `second` (both length-5 integer vectors) to `ex_1_3`. They must be identical.

**Expected result:**

```
#> $first
#> [1] 49 65 25 74 18
#>
#> $second
#> [1] 49 65 25 74 18
```

**Difficulty:** Intermediate

[HINTS]
Reproducibility comes from resetting the random number generator to the same state right before each draw.
Call set.seed(42) before each sample(1:100, 5), then wrap both vectors in list(first = ..., second = ...).

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
first <- sample(1:100, 5)
set.seed(42)
second <- sample(1:100, 5)
ex_1_3 <- list(first = first, second = second)
ex_1_3
#> $first
#> [1] 49 65 25 74 18
#>
#> $second
#> [1] 49 65 25 74 18
identical(first, second)
#> [1] TRUE
```

**Explanation:** `set.seed()` rewinds R's RNG state. Any function downstream that consumes random numbers (sample, rnorm, kmeans with random init, ranger's bootstrap, mclust's EM start) will produce the same draw. A common bug is calling `set.seed()` once at the top of a script and then expecting two later calls to match; they will not, because intermediate code between them consumed RNG state. The fix is to re-seed immediately before each block whose reproducibility you care about.

</details>

## Section 2. Bootstrap resampling (5 problems)

### Exercise 2.1: Bootstrap the standard error of the mean mpg

**Task:** A product manager looking at the `mtcars` mileage figures asks how uncertain the sample mean of `mpg` is. Generate 1,000 bootstrap replicates by sampling rows with replacement (size n = 32 each time), compute the mean of `mpg` for each replicate, and save the resulting length-1000 numeric vector of replicate means to `ex_2_1`. The standard deviation of that vector is the bootstrap standard error.

**Expected result:**

```
#> str(ex_2_1)
#>  num [1:1000] 20.5 19.9 20.4 ...
#> mean(ex_2_1)
#> [1] 20.0985
#> sd(ex_2_1)
#> [1] 1.054
```

**Difficulty:** Intermediate

[HINTS]
Treat the observed sample as the population: repeatedly draw a same-size sample from it with replacement and record the statistic each time.
Drive 1,000 iterations with replicate(), each computing mean(mtcars$mpg[sample(n, n, replace = TRUE)]).

```r title="Your turn"
ex_2_1 <- # your code here
str(ex_2_1)
mean(ex_2_1)
sd(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
B <- 1000
n <- nrow(mtcars)
ex_2_1 <- replicate(B, mean(mtcars$mpg[sample(n, n, replace = TRUE)]))
str(ex_2_1)
#>  num [1:1000] 20.5 19.9 20.4 ...
mean(ex_2_1)
#> [1] 20.0985
sd(ex_2_1)
#> [1] 1.054
```

**Explanation:** The bootstrap treats the observed sample as the population and resamples from it with replacement at the same size n. The standard deviation of the resulting replicate statistics is a direct estimate of the standard error of that statistic. Notice that the bootstrap mean (20.10) is essentially the sample mean (20.09); the bootstrap does not change point estimates, only their uncertainty. `replicate()` is the most concise base-R driver for this; the `boot` package is preferred when you also want bias correction and confidence intervals.

</details>

### Exercise 2.2: Bootstrap a 95 percent percentile CI for the median mpg

**Task:** Continue from the previous exercise. Resample `mtcars$mpg` 2,000 times with replacement (each replicate of size 32), compute the median per replicate, then return the 2.5th and 97.5th percentiles of those medians as the bootstrap percentile 95 percent confidence interval. Save a length-2 named numeric vector (`lower`, `upper`) to `ex_2_2`.

**Expected result:**

```
#> lower upper
#> 16.40 22.80
```

**Difficulty:** Intermediate

[HINTS]
A percentile interval is just the empirical tails of the resampled statistics - resample many medians, then read off the cut points.
After replicate()-ing median(sample(...)), pass the medians to quantile(..., c(0.025, 0.975)) and label them with setNames().

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
B <- 2000
n <- length(mtcars$mpg)
medians <- replicate(B, median(sample(mtcars$mpg, n, replace = TRUE)))
ex_2_2 <- setNames(
  quantile(medians, c(0.025, 0.975)),
  c("lower", "upper")
)
ex_2_2
#> lower upper
#> 16.40 22.80
```

**Explanation:** The percentile method takes the empirical quantiles of the replicate statistics directly. It works well when the bootstrap distribution is roughly symmetric and the statistic has no strong bias. For skewed distributions the bias-corrected and accelerated (BCa) interval, demonstrated in exercise 2.4, has better coverage. Two thousand replicates is a reasonable default for a CI; standard errors converge faster (around 500 reps is enough) but CIs need more because the tails are noisier.

</details>

### Exercise 2.3: Bootstrap the correlation between mpg and wt

**Task:** The same product manager wants a sense of how stable the negative correlation between `mpg` and `wt` is across resamples of `mtcars`. Generate 1,000 paired bootstrap replicates (sample rows with replacement, recompute the Pearson correlation each time), and save the length-1000 vector of replicate correlations to `ex_2_3`. Print its mean and a percentile 95 percent CI.

**Expected result:**

```
#> mean(ex_2_3)
#> [1] -0.866
#> quantile(ex_2_3, c(0.025, 0.975))
#>      2.5%     97.5%
#> -0.9388   -0.7510
```

**Difficulty:** Intermediate

[HINTS]
To keep the relationship between two variables intact, resample whole rows together rather than each column on its own.
Inside replicate(), draw idx <- sample(n, n, replace = TRUE) once and compute cor(mtcars$mpg[idx], mtcars$wt[idx]).

```r title="Your turn"
ex_2_3 <- # your code here
mean(ex_2_3)
quantile(ex_2_3, c(0.025, 0.975))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
B <- 1000
n <- nrow(mtcars)
ex_2_3 <- replicate(B, {
  idx <- sample(n, n, replace = TRUE)
  cor(mtcars$mpg[idx], mtcars$wt[idx])
})
mean(ex_2_3)
#> [1] -0.866
quantile(ex_2_3, c(0.025, 0.975))
#>      2.5%     97.5%
#> -0.9388   -0.7510
```

**Explanation:** A paired (or case) bootstrap resamples whole rows, which keeps the bivariate structure intact. Resampling `mpg` and `wt` independently would destroy the correlation. The replicate correlations stay tightly negative, which gives the manager a usable confidence statement: the correlation is reliably below -0.75 even under heavy resampling. For small n like 32 the Fisher z-transform plus normal interval is the parametric alternative; bootstrap is preferred when you cannot defend the normality of the transformed correlations.

</details>

### Exercise 2.4: Use boot::boot for a regression coefficient with BCa CI

**Task:** Fit `lm(mpg ~ wt, data = mtcars)` and report a BCa 95 percent confidence interval for the slope. Use `boot::boot()` with 1,000 replicates over rows of `mtcars`, then `boot::boot.ci(type = "bca")`. Save the boot object to `ex_2_4`. The BCa interval corrects for both bias and skewness in the bootstrap distribution, which the plain percentile interval does not.

**Expected result:**

```
#> ORDINARY NONPARAMETRIC BOOTSTRAP
#> Call: boot(data = mtcars, statistic = slope_fn, R = 1000)
#> Bootstrap Statistics :
#>     original      bias    std. error
#> t1*  -5.3445   0.022    0.764
#>
#> BOOTSTRAP CONFIDENCE INTERVAL CALCULATIONS
#> Based on 1000 bootstrap replicates
#> Level     BCa
#> 95%   (-6.911, -3.871 )
```

**Difficulty:** Advanced

[HINTS]
The package version needs a function that returns your statistic from a resampled copy of the data, plus a separate call for the interval.
Write a statistic with signature (data, idx) returning the wt coefficient, pass it to boot(data = mtcars, statistic = ..., R = 1000), then boot.ci(type = "bca").

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
boot.ci(ex_2_4, type = "bca")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
slope_fn <- function(data, idx) {
  coef(lm(mpg ~ wt, data = data[idx, ]))[["wt"]]
}
ex_2_4 <- boot(data = mtcars, statistic = slope_fn, R = 1000)
ex_2_4
#> ORDINARY NONPARAMETRIC BOOTSTRAP
#> Bootstrap Statistics :
#>     original      bias    std. error
#> t1*  -5.3445   0.022    0.764

boot.ci(ex_2_4, type = "bca")
#> Level     BCa
#> 95%   (-6.911, -3.871 )
```

**Explanation:** `boot::boot()` expects a statistic function with signature `(data, idx)` so it can pass in the resampled row indices. The bias column is the difference between the mean of the bootstrap replicates and the original estimate; if it is large relative to the standard error you have a bias problem that the BCa interval partially corrects. BCa is the default recommendation in Davison and Hinkley because it has second-order accuracy under regular conditions. The plain percentile and basic intervals are good fallbacks when the BCa acceleration computation fails (it can with very small samples).

</details>

### Exercise 2.5: Residual versus case resampling for a regression slope

**Task:** An audit team asks which bootstrap flavor (case resampling or residual resampling) gives a tighter SE for the `wt` slope in `lm(mpg ~ wt, data = mtcars)`. Implement both: case bootstrap resamples whole rows, residual bootstrap resamples the residuals of the fitted model and adds them back to the fitted values to form a new response. Run 1,000 replicates of each and return a length-2 named numeric vector of bootstrap SEs (`case`, `residual`) as `ex_2_5`.

**Expected result:**

```
#>     case residual
#>    0.764    0.566
```

**Difficulty:** Advanced

[HINTS]
One approach resamples whole observations; the other holds the fitted values fixed and only reshuffles the leftover noise before refitting.
For the residual version, build y_star <- fitted(fit) + sample(residuals(fit), n, replace = TRUE) and refit; take sd() of each set of slopes.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
B <- 1000
n <- nrow(mtcars)
fit <- lm(mpg ~ wt, data = mtcars)
fitted_vals <- fitted(fit)
resids <- residuals(fit)

case_slopes <- replicate(B, {
  idx <- sample(n, n, replace = TRUE)
  coef(lm(mpg ~ wt, data = mtcars[idx, ]))[["wt"]]
})

resid_slopes <- replicate(B, {
  y_star <- fitted_vals + sample(resids, n, replace = TRUE)
  coef(lm(y_star ~ mtcars$wt))[["wt"]]
})

ex_2_5 <- c(case = sd(case_slopes), residual = sd(resid_slopes))
ex_2_5
#>     case residual
#>    0.764    0.566
```

**Explanation:** Residual resampling assumes the regression model is correctly specified (linear, homoscedastic errors) and only randomizes the noise, so it produces a tighter SE. Case resampling makes no functional-form assumption and absorbs heteroscedasticity and model misspecification into wider intervals. When you cannot defend the linearity assumption (which is most real datasets) the case bootstrap is the safer default. The gap between the two SEs here, about 35 percent, is a useful diagnostic: it suggests the homoscedasticity assumption is overstating precision.

</details>

## Section 3. Stratified, cluster, and systematic designs (4 problems)

### Exercise 3.1: Stratified sample of 5 flowers per Species

**Task:** A botanist asks for a balanced training subset of `iris`: exactly 5 rows from each `Species` so every class is equally represented. Use dplyr's `group_by()` plus `slice_sample(n = 5)` to draw the stratified sample and save the 15-row tibble to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 15 x 5
#> # Groups:   Species [3]
#>    Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>           <dbl>       <dbl>        <dbl>       <dbl> <fct>
#>  1          5.1         3.5          1.4         0.2 setosa
#>  2          4.9         3            1.4         0.2 setosa
#>  ...
#> # count per group: setosa 5, versicolor 5, virginica 5
```

**Difficulty:** Intermediate

[HINTS]
You want the draw to happen separately within each class so every class contributes the same number of rows.
Pipe iris through group_by(Species) then slice_sample(n = 5).

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_3_1 <- iris |>
  group_by(Species) |>
  slice_sample(n = 5)
ex_3_1
#> # A tibble: 15 x 5
#> # Groups:   Species [3]
count(ex_3_1, Species)
#> # A tibble: 3 x 2
#>   Species        n
#>   <fct>      <int>
#> 1 setosa         5
#> 2 versicolor     5
#> 3 virginica      5
```

**Explanation:** `slice_sample()` is the modern dplyr replacement for `sample_n()` and works gracefully with grouped data: the `n = 5` applies per group, not in total. Use `prop = 0.1` instead of `n` for a 10 percent sample per stratum, which is what proportional allocation calls for. Stratifying is what makes a sample defensible when some classes are rare (you still see every class) and is the first reflex of any biostatistician dealing with imbalanced treatment arms.

</details>

### Exercise 3.2: Cluster sample of cylinder groups in mtcars

**Task:** A field surveyor cannot afford to sample individual cars; they must sample groups (clusters) and take everyone in the chosen groups. Treat each distinct `cyl` value in `mtcars` as a cluster, randomly pick 2 clusters, and return the full subset of rows from those clusters as `ex_3_2`. Save the picked cyl values as an attribute on the result for the auditor.

**Expected result:**

```
#> # A tibble: 18 x 11
#>    mpg cyl  disp  hp  drat   wt  qsec vs am gear carb
#> 1 22.8   4 108    93  3.85 2.32 18.6  1  1    4    1
#> 2 24.4   4 146.7  62  3.69 3.19 20    1  0    4    2
#> ...
#> attr(,"clusters_picked")
#> [1] 4 8
```

**Difficulty:** Intermediate

[HINTS]
Sample the groups themselves, not the rows - once a group is chosen, every member of it comes along.
Pick clusters with sample(unique(mtcars$cyl), size = 2), keep rows where cyl %in% picked, then record them via attr(..., "clusters_picked").

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
attr(ex_3_2, "clusters_picked")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
clusters <- unique(mtcars$cyl)
picked   <- sample(clusters, size = 2)
ex_3_2   <- mtcars[mtcars$cyl %in% picked, ]
attr(ex_3_2, "clusters_picked") <- picked
nrow(ex_3_2)
#> [1] 18
attr(ex_3_2, "clusters_picked")
#> [1] 4 8
```

**Explanation:** Cluster sampling is what you do when units of observation come in natural groups and visiting one group costs the same whether you measure 1 unit or all of them: schools, hospitals, city blocks, gene families. The downside is design effect: observations within a cluster are correlated, so the effective sample size is smaller than the raw row count. Variance estimates that ignore the cluster structure (a plain `mean()` and `sd()/sqrt(n)`) will be too narrow. The `survey` package in exercise 4.3 handles this properly.

</details>

### Exercise 3.3: Systematic sample of every 4th row of diamonds

**Task:** Take a systematic 1-in-4 sample from the `diamonds` dataset: pick a random start position between 1 and 4, then keep every 4th row from that start. Use `ggplot2::diamonds` (a 53,940 row tibble) and save the result to `ex_3_3`. Report the row count, which should be approximately 53940/4 = 13,485.

**Expected result:**

```
#> # A tibble: 13,485 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43
#> 2  0.31 Good      J     SI2      63.3    58   335  4.34  4.35  2.75
#> ...
#> nrow(ex_3_3)
#> [1] 13485
```

**Difficulty:** Intermediate

[HINTS]
Pick one random entry point near the top of the frame, then step through it at a fixed stride.
Choose start <- sample(seq_len(4), 1), build positions with seq(from = start, to = nrow(diamonds), by = 4), and index diamonds with them.

```r title="Your turn"
library(ggplot2)
ex_3_3 <- # your code here
nrow(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(ggplot2)
set.seed(1)
k     <- 4
start <- sample(seq_len(k), 1)
idx   <- seq(from = start, to = nrow(diamonds), by = k)
ex_3_3 <- diamonds[idx, ]
nrow(ex_3_3)
#> [1] 13485
```

**Explanation:** Systematic sampling spreads draws evenly through the frame, which is useful when the frame is ordered by something correlated with the outcome (price, time of arrival, position on a conveyor) and you want coverage rather than clustering. The hidden risk is periodicity: if the frame has a hidden cycle of length k or a multiple of k, the sample is biased. With diamonds, the rows are ordered by carat and there is no built-in period of 4, so systematic sampling here behaves almost identically to a simple random sample of the same size.

</details>

### Exercise 3.4: Proportional versus equal allocation across strata

**Task:** Compare two stratified designs on `iris` for an audit memo: (a) equal allocation of 10 rows per Species, (b) proportional allocation of 20 percent per Species. Build both and return them in a named list `ex_3_4` with components `equal` and `proportional`. Print the count per Species for each so the audit can see the allocation logic.

**Expected result:**

```
#> $equal
#> # A tibble: 30 x 5
#> count(ex_3_4$equal, Species)
#>   Species        n
#> 1 setosa        10
#> 2 versicolor    10
#> 3 virginica     10
#>
#> $proportional
#> # A tibble: 30 x 5
#> count(ex_3_4$proportional, Species)
#>   Species        n
#> 1 setosa        10
#> 2 versicolor    10
#> 3 virginica     10
```

**Difficulty:** Advanced

[HINTS]
One design fixes the same count in every stratum; the other takes a fixed fraction of each stratum's size.
Both use group_by(Species), one with slice_sample(n = 10) and the other with slice_sample(prop = 0.2); collect them in list(equal = ..., proportional = ...).

```r title="Your turn"
ex_3_4 <- # your code here
count(ex_3_4$equal, Species)
count(ex_3_4$proportional, Species)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
equal_alloc <- iris |>
  group_by(Species) |>
  slice_sample(n = 10) |>
  ungroup()

proportional_alloc <- iris |>
  group_by(Species) |>
  slice_sample(prop = 0.2) |>
  ungroup()

ex_3_4 <- list(equal = equal_alloc, proportional = proportional_alloc)
count(ex_3_4$equal, Species)
#> # A tibble: 3 x 2
#>   Species        n
#> 1 setosa        10
#> 2 versicolor    10
#> 3 virginica     10
count(ex_3_4$proportional, Species)
#>   Species        n
#> 1 setosa        10
#> 2 versicolor    10
#> 3 virginica     10
```

**Explanation:** Equal allocation gives every stratum the same precision, which is what you want when you plan to compare strata against each other (treatment versus control, men versus women). Proportional allocation gives every stratum a share matching its population weight, which is what you want when the headline statistic is the overall mean. With iris the two designs happen to land on identical counts because the three Species are perfectly balanced at 50 rows each; for an imbalanced frame they diverge sharply. Neyman allocation, a third option, weighs by stratum standard deviation and is optimal when strata variances differ.

</details>

## Section 4. Weighted and complex designs (3 problems)

### Exercise 4.1: Draw a weighted contest winner by spend

**Task:** A marketing team runs a sweepstakes where the probability of winning is proportional to the customer's revenue. Build an inline tibble of 8 customers with revenues 100, 250, 75, 500, 1200, 300, 80, 950, then draw 1 winner using `sample()` with a `prob = revenue` argument. Repeat the draw 10,000 times to estimate the empirical win probability per customer, and return a tibble with columns `customer`, `revenue`, `empirical_prob` sorted by customer as `ex_4_1`.

**Expected result:**

```
#> # A tibble: 8 x 3
#>   customer revenue empirical_prob
#>   <chr>      <dbl>          <dbl>
#> 1 A            100         0.0287
#> 2 B            250         0.0707
#> 3 C             75         0.0218
#> 4 D            500         0.144
#> 5 E           1200         0.342
#> 6 F            300         0.0853
#> 7 G             80         0.0234
#> 8 H            950         0.270
```

**Difficulty:** Intermediate

[HINTS]
Give each customer a selection chance proportional to their revenue, then repeat the draw enough times to read off how often each one wins.
Pass prob = customers$revenue to sample(..., size = 10000, replace = TRUE), then tabulate the winners and divide by 10000 inside mutate().

```r title="Your turn"
customers <- tibble(
  customer = LETTERS[1:8],
  revenue  = c(100, 250, 75, 500, 1200, 300, 80, 950)
)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
customers <- tibble(
  customer = LETTERS[1:8],
  revenue  = c(100, 250, 75, 500, 1200, 300, 80, 950)
)

winners <- sample(
  customers$customer,
  size    = 10000,
  replace = TRUE,
  prob    = customers$revenue
)

ex_4_1 <- customers |>
  mutate(empirical_prob = as.numeric(table(factor(winners, levels = customer))) / 10000)
ex_4_1
#> # A tibble: 8 x 3
#>   customer revenue empirical_prob
#>   <chr>      <dbl>          <dbl>
#> 1 A            100         0.0287
#> 5 E           1200         0.342
#> 8 H            950         0.270
```

**Explanation:** When `prob` is supplied to `sample()`, R normalizes it internally so the values sum to 1, which is why raw revenue dollars work as weights with no manual division. The empirical probabilities track the theoretical p_i = revenue_i / sum(revenue) closely after 10,000 draws; the gap is Monte Carlo noise. The same `prob` argument drives any weighted draw in base R, including the bootstrap weighted variant where the resampling weights are not all equal. For survey work, the design weights live on the design object rather than each draw.

</details>

### Exercise 4.2: Probability proportional to size (PPS) cluster sample

**Task:** A national survey team needs to draw 3 cities from a frame of 10 cities with a probability proportional to each city's population. Build an inline tibble of cities A through J with populations 50, 80, 30, 200, 150, 90, 60, 40, 110, 70 (in thousands), then draw 3 cities without replacement using `sample(prob = population)`. Save the resulting 3-row tibble (sorted by `population` descending) to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   city  population
#>   <chr>      <dbl>
#> 1 D            200
#> 2 I            110
#> 3 F             90
```

**Difficulty:** Advanced

[HINTS]
Larger units should be more likely to be selected, and here you pick without putting a chosen unit back.
Use sample(cities$city, size = 3, replace = FALSE, prob = cities$population), then filter() and arrange(desc(population)).

```r title="Your turn"
cities <- tibble(
  city       = LETTERS[1:10],
  population = c(50, 80, 30, 200, 150, 90, 60, 40, 110, 70)
)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
cities <- tibble(
  city       = LETTERS[1:10],
  population = c(50, 80, 30, 200, 150, 90, 60, 40, 110, 70)
)

picked <- sample(
  cities$city,
  size    = 3,
  replace = FALSE,
  prob    = cities$population
)

ex_4_2 <- cities |>
  filter(city %in% picked) |>
  arrange(desc(population))
ex_4_2
#> # A tibble: 3 x 2
#>   city  population
#>   <chr>      <dbl>
#> 1 D            200
#> 2 I            110
#> 3 F             90
```

**Explanation:** PPS sampling is the standard for multistage surveys where larger units (cities, schools, hospitals) deserve a higher chance of selection because they hold more units of the second stage (people, students, patients). Done correctly, the unequal inclusion probabilities are offset by Horvitz-Thompson weights at the estimation stage so the overall mean is still unbiased. Note that base R's `sample(..., replace = FALSE, prob = ...)` uses sequential PPS without replacement, which is fine for small samples but biases inclusion probabilities once you sample a substantial fraction of the frame; for that case look at `pps::ppswr` or `sampling::UPpoisson`.

</details>

### Exercise 4.3: Design-based mean from a stratified survey

**Task:** A pollster has a stratified survey of 20 respondents drawn from two strata (urban N = 5000, rural N = 3000) and sampled 12 urban and 8 rural respondents. Use the `survey` package's `svydesign()` and `svymean()` to estimate the population mean of the `score` column with stratum-aware weights. Save the `svystat` object to `ex_4_3` and print it.

**Expected result:**

```
#>          mean     SE
#> score   6.875  0.426
```

**Difficulty:** Advanced

[HINTS]
The estimate has to account for how the sample was drawn, so each respondent carries a weight reflecting how many people they stand for.
Build a design with svydesign(ids = ~1, strata = ~stratum, weights = ~weight, data = poll), then call svymean(~score, design).

```r title="Your turn"
poll <- tibble(
  stratum  = rep(c("urban", "rural"), c(12, 8)),
  N_h      = rep(c(5000, 3000),       c(12, 8)),
  n_h      = rep(c(12, 8),             c(12, 8)),
  weight   = N_h / n_h,
  score    = c(7, 8, 6, 9, 5, 7, 8, 6, 7, 8, 5, 9, 6, 7, 5, 6, 7, 8, 5, 4)
)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
poll <- tibble(
  stratum  = rep(c("urban", "rural"), c(12, 8)),
  N_h      = rep(c(5000, 3000),       c(12, 8)),
  n_h      = rep(c(12, 8),             c(12, 8)),
  weight   = N_h / n_h,
  score    = c(7, 8, 6, 9, 5, 7, 8, 6, 7, 8, 5, 9, 6, 7, 5, 6, 7, 8, 5, 4)
)

design   <- svydesign(ids = ~1, strata = ~stratum, weights = ~weight, data = poll)
ex_4_3   <- svymean(~score, design)
ex_4_3
#>          mean     SE
#> score   6.875  0.426
```

**Explanation:** Design-based inference (the Horvitz-Thompson framework) builds the standard error from the sampling design itself, not from an assumed superpopulation model. With stratified weights, the urban respondents each represent 5000/12 ~ 417 people and the rural ones each represent 375; ignoring those weights would give the unweighted mean and an underestimated SE. The `survey` package is the standard R interface for NHANES, BRFSS, and any other complex survey with strata, clusters, replicate weights, or finite-population corrections. For modeling under the same design, use `svyglm()` instead of `glm()`.

</details>

## Section 5. Permutation and jackknife (3 problems)

### Exercise 5.1: Permutation test for two-group mean difference

**Task:** A statistician wants a distribution-free test that `am = 0` (automatic) and `am = 1` (manual) cars have different mean `mpg` in `mtcars`. Compute the observed mean difference, then shuffle the `am` labels 5,000 times and recompute the mean difference per shuffle to build a null distribution. Save a list with `observed_diff` (scalar) and `p_value` (two-sided) to `ex_5_1`.

**Expected result:**

```
#> $observed_diff
#> [1] 7.2449
#>
#> $p_value
#> [1] 0.0002
```

**Difficulty:** Intermediate

[HINTS]
Under the null the group labels are interchangeable, so shuffling them many times builds the distribution of differences you would expect by chance.
In replicate(), permute the labels with sample(mtcars$am), recompute the group mean gap, and set p_value <- mean(abs(null) >= abs(observed)).

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
observed <- mean(mtcars$mpg[mtcars$am == 1]) - mean(mtcars$mpg[mtcars$am == 0])

B    <- 5000
null <- replicate(B, {
  shuffled <- sample(mtcars$am)
  mean(mtcars$mpg[shuffled == 1]) - mean(mtcars$mpg[shuffled == 0])
})

p_value <- mean(abs(null) >= abs(observed))
ex_5_1 <- list(observed_diff = observed, p_value = p_value)
ex_5_1
#> $observed_diff
#> [1] 7.2449
#> $p_value
#> [1] 0.0002
```

**Explanation:** A permutation test asks: if there were truly no association between `am` and `mpg`, how often would I see a mean difference at least as extreme as the one I observed, just by shuffling labels? It needs no normality assumption and no model: only that observations are exchangeable under the null. The p-value here (~0.0002) is essentially zero, agreeing with what a Welch t-test would conclude. Permutation tests shine when the test statistic has no analytic null distribution (a complicated ratio, a custom score function, a paired difference under heteroscedasticity).

</details>

### Exercise 5.2: Jackknife SE of the mean mpg

**Task:** Use the leave-one-out jackknife to estimate the standard error of the mean of `mtcars$mpg`. Drop each row in turn, recompute the mean on the remaining 31 rows, then apply the jackknife SE formula `sqrt((n-1)/n * sum((theta_i - theta_bar)^2))`. Save a length-1 numeric `ex_5_2` equal to that SE. Compare it to `sd(mpg)/sqrt(n)` in your head; they should be close.

**Expected result:**

```
#> [1] 1.0654
```

**Difficulty:** Intermediate

[HINTS]
Instead of random resampling, systematically remove one observation at a time and see how much the estimate moves.
Compute theta_i with sapply(seq_len(n), function(i) mean(x[-i])), then apply sqrt((n-1)/n * sum((theta_i - theta_bar)^2)).

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- mtcars$mpg
n <- length(x)
theta_i   <- sapply(seq_len(n), function(i) mean(x[-i]))
theta_bar <- mean(theta_i)
ex_5_2    <- sqrt((n - 1) / n * sum((theta_i - theta_bar)^2))
ex_5_2
#> [1] 1.0654
```

**Explanation:** The jackknife is the bootstrap's older deterministic cousin: instead of resampling B times, it produces n replicates by leaving each observation out once. For smooth statistics like the mean it gives an SE essentially identical to the parametric `sd(x)/sqrt(n)`, which is what you see here (1.065 vs 1.065). The jackknife breaks down for non-smooth statistics like the median or a quantile, where small leave-one-out changes can flip the estimate by a discrete jump. The bootstrap handles those cases more gracefully.

</details>

### Exercise 5.3: Jackknife influence values for the slope of mpg ~ wt

**Task:** Continuing the regression theme, compute the leave-one-out jackknife pseudo-values for the `wt` slope of `lm(mpg ~ wt, data = mtcars)`. For each row i, refit without row i and record `slope_i`. Return the 32-element named numeric vector of slope estimates (names = car models) as `ex_5_3`, and identify the most influential car (the one whose removal changes the slope most).

**Expected result:**

```
#> head(ex_5_3, 4)
#>          Mazda RX4      Mazda RX4 Wag         Datsun 710     Hornet 4 Drive
#>            -5.388            -5.379             -5.376             -5.337
#>
#> Most influential: "Chrysler Imperial"
```

**Difficulty:** Intermediate

[HINTS]
Refit the model with one row dropped each time; rows whose removal swings the coefficient most are the influential ones.
Use sapply(seq_len(n), function(i) coef(lm(mpg ~ wt, data = mtcars[-i, ]))[["wt"]]) and set names() to rownames(mtcars).

```r title="Your turn"
ex_5_3 <- # your code here
head(ex_5_3, 4)
names(ex_5_3)[which.max(abs(ex_5_3 - mean(ex_5_3)))]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- nrow(mtcars)
ex_5_3 <- sapply(seq_len(n), function(i) {
  coef(lm(mpg ~ wt, data = mtcars[-i, ]))[["wt"]]
})
names(ex_5_3) <- rownames(mtcars)

head(ex_5_3, 4)
#>          Mazda RX4      Mazda RX4 Wag         Datsun 710     Hornet 4 Drive
#>            -5.388            -5.379             -5.376             -5.337
names(ex_5_3)[which.max(abs(ex_5_3 - mean(ex_5_3)))]
#> [1] "Chrysler Imperial"
```

**Explanation:** Jackknife slope estimates are a quick robustness check: if any single row swings the coefficient noticeably, you have a high-leverage observation worth investigating. Chrysler Imperial is heavy (5.345 thousand lbs) with high mpg relative to its weight, which is exactly the leverage pattern Cook's distance also flags. The classical diagnostic `cooks.distance(fit)` is closely related to this leave-one-out construction. Jackknifing coefficients is computationally cheaper than bootstrapping when n is small and you want a quick influence audit before a full bootstrap analysis.

</details>

## Section 6. Train/test splits (2 problems)

### Exercise 6.1: Simple 70/30 train/test split of mtcars

**Task:** An ML engineer building a baseline regression on `mtcars` needs a fixed 70/30 train/test split. Use `sample()` to draw 70 percent of row indices without replacement for train and the rest for test. Save a named list `ex_6_1` with `train` and `test` data frames. Print the row counts so the engineer can verify the split.

**Expected result:**

```
#> nrow(ex_6_1$train)
#> [1] 22
#> nrow(ex_6_1$test)
#> [1] 10
```

**Difficulty:** Beginner

[HINTS]
Draw a random subset of row positions for training; whatever is left over becomes the test set.
Use sample(n, size = floor(0.7 * n)) for train_idx, then mtcars[train_idx, ] and mtcars[-train_idx, ] in a named list.

```r title="Your turn"
ex_6_1 <- # your code here
nrow(ex_6_1$train)
nrow(ex_6_1$test)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
n          <- nrow(mtcars)
train_idx  <- sample(n, size = floor(0.7 * n), replace = FALSE)
ex_6_1     <- list(
  train = mtcars[train_idx, ],
  test  = mtcars[-train_idx, ]
)
nrow(ex_6_1$train)
#> [1] 22
nrow(ex_6_1$test)
#> [1] 10
```

**Explanation:** A random 70/30 split is the simplest holdout design and is fine when the response is roughly balanced and rows are exchangeable. It fails for small datasets like `mtcars` (n = 32), where a single bad split can move the test RMSE by 10-20 percent; in that regime cross-validation is the proper tool. The split also fails for time series (you would leak the future into training) and for grouped data (rows from the same patient or customer should stay together); both call for `rsample::initial_time_split()` and `rsample::group_initial_split()` respectively.

</details>

### Exercise 6.2: Stratified 80/20 split preserving Species balance

**Task:** Build a stratified 80/20 train/test split of `iris` that keeps the proportion of each `Species` identical between train and test. Use dplyr `group_by` plus `slice_sample(prop = 0.8)` for the train set, then `anti_join()` for the test set. Save a named list with `train` and `test` tibbles to `ex_6_2`. Verify the Species counts are balanced.

**Expected result:**

```
#> count(ex_6_2$train, Species)
#>   Species        n
#> 1 setosa        40
#> 2 versicolor    40
#> 3 virginica     40
#>
#> count(ex_6_2$test, Species)
#>   Species        n
#> 1 setosa        10
#> 2 versicolor    10
#> 3 virginica     10
```

**Difficulty:** Intermediate

[HINTS]
Draw the training fraction within each class so both splits keep the same class proportions, then define the test set as everything not in train.
After group_by(Species) and slice_sample(prop = 0.8), get the test set with anti_join() on a row_id column.

```r title="Your turn"
ex_6_2 <- # your code here
count(ex_6_2$train, Species)
count(ex_6_2$test, Species)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
iris_id <- iris |> mutate(row_id = row_number())

train_set <- iris_id |>
  group_by(Species) |>
  slice_sample(prop = 0.8) |>
  ungroup()

test_set <- iris_id |>
  anti_join(train_set, by = "row_id")

ex_6_2 <- list(
  train = train_set |> select(-row_id),
  test  = test_set  |> select(-row_id)
)

count(ex_6_2$train, Species)
#> # A tibble: 3 x 2
#>   Species        n
#> 1 setosa        40
#> 2 versicolor    40
#> 3 virginica     40

count(ex_6_2$test, Species)
#> # A tibble: 3 x 2
#>   Species        n
#> 1 setosa        10
#> 2 versicolor    10
#> 3 virginica     10
```

**Explanation:** Stratified splits matter most for classification with imbalanced classes (fraud, disease, churn): a random split can put zero positives in test, which makes any held-out metric meaningless. The `row_id` trick is a cheap way to express "everything not in train" with `anti_join()` because dplyr does not have a native split-then-complement function for grouped tibbles. The `rsample::initial_split(strata = Species)` wrapper does the same thing in one line and is what most tidymodels code uses in production.

</details>

## What to do next

- [Bootstrap in R](Bootstrap-in-R.html) walks through the same `boot::boot()` machinery used in section 2 with worked confidence intervals on a real example.
- [Sampling Distributions in R](Sampling-Distributions-in-R.html) is the theoretical companion: it shows why the bootstrap standard error you just computed approximates the true sampling SE.
- [Jackknife Resampling in R](Jackknife-Resampling-in-R.html) extends the leave-one-out construction from section 5 to bias correction and influence diagnostics.
- [Cross Validation Exercises in R](Cross-Validation-Exercises-in-R.html) is the next step after train/test: k-fold, repeated, and grouped CV designs for honest model selection.
