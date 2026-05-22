---
title: "rsample bootstraps() in R: Bootstrap Resampling Splits"
slug: rsample-bootstraps-in-R
description: "Build bootstrap resamples with rsample bootstraps() in R. Covers times, strata, apparent, set.seed reproducibility, and analysis()/assessment() helpers."
keywords: "rsample bootstraps, bootstraps function R, rsample bootstraps examples, R bootstrap resampling, tidymodels bootstraps, rsample resampling with replacement, bootstrap samples R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "bootstraps()|rsample bootstraps|rsample::bootstraps()|bootstrap resampling|bootstrap samples"
auto_link_case_sensitive: true
target_keyword: "rsample bootstraps"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample bootstraps() in R: Bootstrap Resampling Splits

<p class="lead">The rsample bootstraps() function in R builds bootstrap resamples by drawing rows with replacement, so you can estimate model variance, build confidence intervals, or train ensemble models on small datasets.</p>

[QUICK ANSWER]
bootstraps(df)                              # default 25 resamples
bootstraps(df, times = 1000)                # large bootstrap for CIs
bootstraps(df, strata = y)                  # stratified bootstrap
bootstraps(df, apparent = TRUE)             # add apparent (original) split
analysis(boots$splits[[1]])                 # in-bag rows of resample 1
assessment(boots$splits[[1]])               # out-of-bag (OOB) rows
set.seed(123); bootstraps(df, times = 100)  # reproducible resamples

[DECISION TREE: Is bootstraps() the right tool?]
- bootstrap resampling with replacement: bootstraps(df, times = 1000)
- k-fold cross-validation without replacement: vfold_cv(df, v = 10)
- single train/test partition: initial_split(df, prop = 0.8)
- monte carlo random splits: mc_cv(df, prop = 0.8, times = 25)
- time-ordered resamples: rolling_origin(df, initial = 100)
- keep groups intact across resamples: group_bootstraps(df, group_var)
- leave-one-out resampling: loo_cv(df)

## What bootstraps() does

**bootstraps() draws resamples of the same size as the input data, with replacement.** It is part of the rsample package, the resampling engine in the tidymodels ecosystem. Each resample uses bootstrap sampling: rows are drawn at random with replacement from the original data, so the analysis set is the same length as the input but contains duplicate rows. On average about 63.2 percent of the original rows appear at least once; the remaining 36.8 percent form the out-of-bag (OOB) assessment set.

The function returns a tibble with a `splits` list-column of `rsplit` objects and an `id` column labelling each resample. It does not copy the underlying data. Each `rsplit` stores integer row indices into the original frame, so a thousand bootstrap resamples of a million-row table is still a small object. Use bootstrap resampling to estimate the sampling variance of a statistic, build percentile confidence intervals, or feed `fit_resamples()` when cross-validation is impractical on very small data.

## Syntax and arguments

**The signature has one required argument and five tuning knobs.**

```r title="bootstraps function signature"
bootstraps(
  data,            # the data frame to resample
  times = 25,      # number of bootstrap resamples
  strata = NULL,   # column to stratify resamples by
  breaks = 4,      # bins used when strata is numeric
  pool = 0.1,      # small-group pooling threshold for strata
  apparent = FALSE # add an extra "apparent" split using original data
)
```

The arguments that matter in practice:

- **data**: the data frame or tibble to resample.
- **times**: the number of bootstrap resamples. The default `25` is fine for quick checks; use `1000` or more for percentile confidence intervals.
- **strata**: a column name. Resamples are drawn within each stratum so class or quantile proportions are preserved.
- **breaks**: when `strata` is numeric, the number of quantile bins used to stratify.
- **apparent**: if `TRUE`, appends one extra row to the result where both analysis and assessment sets are the full original data. Used by some bias correction methods.

## bootstraps() examples

### Basic 25-sample bootstrap

**Call bootstraps() on a data frame and print the result to see the resample structure.** The default `times = 25` produces a tibble with 25 rows, one per resample.

```r title="Create default 25 bootstrap resamples"
library(rsample)

set.seed(123)
iris_boots <- bootstraps(iris)
iris_boots
#> # Bootstrap sampling 
#> # A tibble: 25 x 2
#>    splits           id         
#>    <list>           <chr>      
#>  1 <split [150/53]> Bootstrap01
#>  2 <split [150/49]> Bootstrap02
#>  3 <split [150/60]> Bootstrap03
#>  4 <split [150/57]> Bootstrap04
#>  5 <split [150/58]> Bootstrap05
#>  6 <split [150/52]> Bootstrap06
#>  7 <split [150/55]> Bootstrap07
#>  8 <split [150/57]> Bootstrap08
#>  9 <split [150/56]> Bootstrap09
#> 10 <split [150/57]> Bootstrap10
#> # i 15 more rows
```

### Extract analysis and assessment sets

**Each split has an analysis() set with duplicates and an assessment() set of out-of-bag rows.** The two helpers return ordinary data frames you can feed to any modeling function.

```r title="Pull one resample's data"
boot1 <- iris_boots$splits[[1]]

in_bag  <- analysis(boot1)
oob_bag <- assessment(boot1)

nrow(in_bag)
#> [1] 150
nrow(oob_bag)
#> [1] 53

sum(duplicated(in_bag))
#> [1] 97
```

### Increase times for confidence intervals

**Set times to a large number when you want a percentile confidence interval.** A common rule of thumb is at least 1,000 resamples for a 95 percent interval and 10,000 for the tails of a 99 percent interval.

```r title="Run 1000 bootstrap resamples for a CI"
set.seed(123)
boots_1000 <- bootstraps(iris, times = 1000)
nrow(boots_1000)
#> [1] 1000

boot_means <- vapply(
  boots_1000$splits,
  function(s) mean(analysis(s)$Sepal.Length),
  numeric(1)
)
quantile(boot_means, c(0.025, 0.975))
#>     2.5%    97.5% 
#> 5.751333 5.937833
```

### Stratify by a class column

**Use strata to keep the outcome distribution balanced across every resample.** Without stratification a small minority class can be absent from some bootstraps, breaking models that need all classes present.

```r title="Stratified bootstrap by a factor column"
set.seed(123)
strat_boots <- bootstraps(iris, times = 5, strata = Species)
table(analysis(strat_boots$splits[[1]])$Species)
#> 
#>     setosa versicolor  virginica 
#>         50         50         50
```

## bootstraps() vs other resampling functions

**bootstraps() draws with replacement; the alternatives partition without replacement or sample with constraints.** Pick the function that matches the estimator you need.

| Function | Produces | Use when |
|---|---|---|
| `bootstraps()` | Resamples with replacement, same size as data | Confidence intervals, variance estimates, small data |
| `vfold_cv()` | v folds, every row held out once | Tuning, stable performance estimates |
| `mc_cv()` | Random train/test splits, can overlap | Many resamples without v-fold structure |
| `initial_split()` | One train/test split | Final hold-out evaluation |
| `loo_cv()` | n folds of size 1 | Very small datasets, leave-one-out |
| `group_bootstraps()` | Bootstrap on whole groups | Hierarchical or clustered data |

A typical bootstrap workflow looks like: `bootstraps()` returns the resamples, you fit a statistic or model on each `analysis()` set, then aggregate the per-resample statistics into a distribution. The OOB rows from `assessment()` are useful for honest accuracy estimates that mirror random forest OOB error.

[KEY INSIGHT]
**The analysis() set is always the same size as the original data, but contains duplicates.** This is what makes bootstraps different from cross-validation. About 63.2 percent of rows appear at least once in any resample; the rest are out-of-bag and form a free assessment set, no extra splitting required.

## Common pitfalls

**Three mistakes account for most bootstraps() bugs.**

- **Forgetting set.seed().** `bootstraps()` shuffles and samples with replacement before partitioning. Without `set.seed()` before the call, every run produces different resamples and your bootstrap intervals drift. Set the seed in the same script, right before the resample.
- **Using too few resamples for a confidence interval.** The default `times = 25` is meant for quick checks and `fit_resamples()` plumbing tests, not statistics. Percentile confidence intervals need at least 1,000 resamples; tail quantiles of a 99 percent interval need 10,000 or more.
- **Treating duplicates as a bug.** A bootstrap resample is supposed to contain repeated rows. `sum(duplicated(analysis(split)))` will be non-zero by design. The OOB assessment set is the unique held-out portion.

[WARNING]
**Bootstrap performance estimates are optimistic on small data because duplicate rows leak between training and validation.** The 0.632 and 0.632+ bootstrap estimators correct for this. For honest model selection, prefer `vfold_cv()` or compute the OOB error from the `assessment()` set instead of overall in-bag fit.

## Try it yourself

**Try it:** Build 100 bootstrap resamples of the `mtcars` dataset stratified by `cyl`. Save it to `ex_boots`.

```r title="Your turn: stratified bootstrap"
# Try it: 100 stratified bootstraps
set.seed(42)
ex_boots <- # your code here

nrow(ex_boots)
#> Expected: 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_boots <- bootstraps(mtcars, times = 100, strata = cyl)
nrow(ex_boots)
#> [1] 100
```

**Explanation:** `times = 100` produces 100 resamples; `strata = cyl` keeps the proportion of 4, 6, and 8 cylinder cars roughly constant in each analysis set. The result is a tibble with one row per resample, regardless of dataset size.

</details>

## Related rsample functions

**bootstraps() is the workhorse for resampling with replacement; these functions extend or pair with it.**

- `analysis()` and `assessment()`: extract the in-bag and out-of-bag data frames from a split object.
- `initial_split()`: carve off a final testing set before bootstrapping the training portion.
- `vfold_cv()`: build k-fold cross-validation splits when you need every row held out exactly once.
- `group_bootstraps()`: bootstrap whole groups together for clustered or hierarchical data.
- `int_pctl()`: compute percentile confidence intervals from a bootstrapped tibble of statistics.

[NOTE]
**Coming from scikit-learn?** `bootstraps(df, times = 1000)` is the tidymodels equivalent of `sklearn.utils.resample` repeated 1,000 times. There is no direct stratified bootstrap helper in scikit-learn; rsample's `strata` argument fills that gap.

See the [rsample bootstraps reference](https://rsample.tidymodels.org/reference/bootstraps.html) on the tidymodels site for the full argument list.

## FAQ

**What is the default number of resamples in bootstraps()?**

The default `times` argument is `25`, which builds 25 bootstrap resamples. That is enough for quick sanity checks and for plumbing `fit_resamples()` calls, but it is far too few for a stable percentile confidence interval. For inference, use at least 1,000 resamples; for the tails of a 99 percent interval or for bias correction, use 5,000 to 10,000.

**How do I make bootstraps() reproducible?**

Call `set.seed()` with any integer immediately before `bootstraps()`. The function draws row indices with replacement using R's random number generator, so a fixed seed guarantees the same resamples every time the script runs. Keep the seed and the resample call together. Re-running with the same seed and the same R version reproduces the exact in-bag and out-of-bag assignments.

**What is the difference between bootstraps() and vfold_cv()?**

`bootstraps()` samples rows with replacement, so the analysis set is the same size as the original data and contains duplicates. `vfold_cv()` partitions rows without replacement, so every row appears in the held-out set exactly once across the v folds. Use bootstrap resampling for variance estimates and confidence intervals on small data, and use cross-validation for stable performance estimates during model tuning.

**What does the apparent argument do?**

Setting `apparent = TRUE` appends one extra row to the resulting tibble where both the analysis set and the assessment set are the full original data. Some bias correction methods, including the 0.632+ estimator, use this "apparent" split alongside the bootstrap resamples to compare in-sample fit to out-of-sample fit. Most everyday bootstrap workflows can leave it at the default `FALSE`.

**Can bootstraps() handle time series data?**

Not directly. `bootstraps()` ignores row order and samples uniformly with replacement, which breaks the temporal dependence a forecasting model needs. For chronological resamples use `rolling_origin()`. If you need a bootstrap-style estimator on time series, look at block bootstrap methods in the `boot` package or `tsboot()`, which preserve local autocorrelation by resampling contiguous blocks.
