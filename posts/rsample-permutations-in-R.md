---
title: "rsample permutations() in R: Permutation Test Resamples"
slug: rsample-permutations-in-R
description: "Use rsample::permutations() to build permutation resamples in R for null distributions, p-values, and hypothesis tests. Syntax, examples, and pitfalls."
keywords: "rsample permutations, permutations function R, rsample permutations examples, R permutation resamples, permutation test rsample, tidymodels permutations"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "permutations()|rsample permutations|rsample::permutations()|permutation resamples|permutation test"
auto_link_case_sensitive: true
target_keyword: "rsample permutations"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample permutations() in R: Permutation Test Resamples

<p class="lead">rsample permutations() creates randomly shuffled resamples for permutation tests in R, letting you build a null distribution and compute p-values without parametric assumptions.</p>

[QUICK ANSWER]
permutations(df, permute = y, times = 1000)         # null distribution
permutations(df, permute = c(a, b), times = 500)    # multiple columns
permutations(df, permute = y, apparent = TRUE)      # include original
analysis(perms$splits[[1]])                          # one shuffled resample
map_dbl(perms$splits, ~ stat(analysis(.x)))          # null statistics vector
mean(null_stats >= observed)                         # one-sided p-value
mean(abs(null_stats) >= abs(observed))               # two-sided p-value

[DECISION TREE: Is permutations() the right tool?]
- test hypothesis with null distribution: permutations(df, permute = y)
- bootstrap resamples with replacement: bootstraps(df, times = 1000)
- k-fold cross-validation: vfold_cv(df, v = 10)
- single train and test split: initial_split(df, prop = 0.8)
- time-aware rolling resamples: rolling_origin(df)
- repeated random splits: mc_cv(df, prop = 0.8, times = 25)

## What permutations() does

**permutations() shuffles selected columns to break a relationship under the null.** You pass a data frame, name one or more columns via `permute`, and rsample returns a set of resampled tibbles where those columns have been randomly reordered while the rest stay aligned to the original rows. Each resample is a draw from the null hypothesis that the permuted columns are independent of everything else.

The output is an `rset` (resample set) with a `splits` list-column. Unlike bootstraps or v-fold cross-validation, every split keeps all original rows, so `analysis()` returns the full data with shuffled columns; `assessment()` does not apply.

[KEY INSIGHT]
**Permutation tests are exchangeable by construction.** If the null is true, every reordering is equally likely, so the observed statistic should sit somewhere typical in the simulated distribution.

## Syntax and arguments

**Four arguments control the resample set.** The first two are required; the others have sensible defaults that work for most permutation tests.

```r title="Function signature"
permutations(
  data,                # data frame or tibble
  permute,             # column(s) to shuffle, tidyselect syntax
  times = 25,          # number of permutation resamples
  apparent = FALSE,    # add the original (unshuffled) split
  ...
)
```

| Argument | Type | Purpose |
|---|---|---|
| `data` | data.frame | The dataset whose rows stay intact |
| `permute` | tidyselect | Column(s) to shuffle across rows |
| `times` | integer | Number of permuted resamples to generate |
| `apparent` | logical | If TRUE, append the original unshuffled data as an "Apparent" split |

The default `times = 25` is far too low for inference. Use 1,000 to 10,000 for usable p-values; 25 is fine for testing pipeline code.

## permutations() examples

**Build a null distribution for a two-group mean difference.** The setup compares `mpg` between automatic and manual cars in `mtcars`, then permutes the `am` column to simulate the null of no association.

```r title="Compute the observed test statistic"
library(rsample)
library(dplyr)
library(purrr)

observed <- mtcars %>%
  group_by(am) %>%
  summarise(m = mean(mpg)) %>%
  pull(m) %>%
  diff()

observed
#> [1] 7.244939
```

```r title="Generate 1,000 permutation resamples"
set.seed(1)
perms <- permutations(mtcars, permute = am, times = 1000)
perms
#> # Permutation sampling
#> # A tibble: 1,000 x 2
#>    splits         id
#>    <list>         <chr>
#>  1 <split [32/0]> Permutations0001
#>  2 <split [32/0]> Permutations0002
#>  3 <split [32/0]> Permutations0003
#>  4 <split [32/0]> Permutations0004
#>  5 <split [32/0]> Permutations0005
#> # ... with 995 more rows
```

```r title="Compute the null statistic for each resample"
null_diff <- map_dbl(perms$splits, function(s) {
  analysis(s) %>%
    group_by(am) %>%
    summarise(m = mean(mpg), .groups = "drop") %>%
    pull(m) %>%
    diff()
})

summary(null_diff)
#>     Min.  1st Qu.   Median     Mean  3rd Qu.     Max.
#> -7.46875 -1.86250  0.04375  0.01923  1.93125  7.40625
```

```r title="Two-sided p-value"
p_value <- mean(abs(null_diff) >= abs(observed))
p_value
#> [1] 0.001
```

The observed gap of 7.24 mpg lands far in the tail of the null distribution, so the p-value is approximately 1/1000.

[TIP]
**Set apparent = TRUE to get an unbiased one-sided p-value.** Adding the observed data to the resample pool ensures the minimum achievable p-value is 1/(times+1) rather than 0, which matters when the null is true.

```r title="Permute several columns at once"
set.seed(2)
multi <- permutations(mtcars, permute = c(am, cyl), times = 500)
analysis(multi$splits[[1]]) %>%
  select(mpg, am, cyl) %>%
  head(3)
#>    mpg am cyl
#> 1 21.0  0   4
#> 2 21.0  1   8
#> 3 22.8  0   6
```

The `am` and `cyl` columns are each shuffled independently across rows; `mpg` stays attached to its original row.

## permutations() vs other resampling functions

**Use permutations() for hypothesis tests, not for model evaluation.** The other rsample functions resample rows; `permutations()` resamples values inside columns.

| Function | What it resamples | Replacement | Typical use |
|---|---|---|---|
| `permutations()` | One or more columns (shuffled) | n/a | Null distributions, p-values |
| `bootstraps()` | Rows | Yes | Standard errors, confidence intervals |
| `vfold_cv()` | Rows (k folds) | No | k-fold cross-validation |
| `mc_cv()` | Rows (random splits) | No | Repeated holdout |
| `initial_split()` | Rows (one split) | No | Single train/test split |

If you want to assess a model's predictive accuracy, reach for `bootstraps()` or `vfold_cv()`. If you want to test whether two variables are associated beyond chance, reach for `permutations()`.

[NOTE]
**Coming from Python SciPy?** The closest analog is `scipy.stats.permutation_test()`, but SciPy returns a p-value directly while rsample gives you the resample list and lets you compute any statistic.

## Common pitfalls

**Forgetting to set a seed makes results irreproducible.** Permutation tests are stochastic; rerunning without `set.seed()` gives a different p-value every time. Always seed before calling `permutations()`.

**Using too few permutations underestimates significance.** With `times = 25`, the smallest possible p-value is 1/25 = 0.04. To detect effects at p < 0.01, you need at least 1,000 permutations; for p < 0.001, use 10,000.

```r title="Pitfall: tiny times produces coarse p-values"
set.seed(3)
tiny <- permutations(mtcars, permute = am, times = 25)
null_tiny <- map_dbl(tiny$splits, function(s) {
  analysis(s) %>% group_by(am) %>%
    summarise(m = mean(mpg), .groups = "drop") %>% pull(m) %>% diff()
})
mean(abs(null_tiny) >= abs(observed))
#> [1] 0
```

The p-value is 0 because 25 resamples cannot distinguish 1/25 from 0/25. Increase `times`.

[WARNING]
**Permuting a constant or near-constant column gives no null variability.** If `permute` points to a column with one unique value, every shuffle is identical, and the test has no power.

## Try it yourself

**Try it:** Use `permutations()` on `iris` to test whether `Species` is associated with `Sepal.Length`. Permute the `Species` column 1,000 times and compute the proportion of resamples where the difference between the largest and smallest group means is at least as extreme as the observed difference.

```r title="Your turn: permutation test on iris"
library(rsample); library(dplyr); library(purrr)

# observed range of group means
ex_observed <- iris %>%
  group_by(Species) %>%
  summarise(m = mean(Sepal.Length), .groups = "drop") %>%
  summarise(range = max(m) - min(m)) %>%
  pull(range)

set.seed(42)
ex_perms <- # your code here

ex_p <- # your code here
ex_p
#> Expected: a value at or near 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_perms <- permutations(iris, permute = Species, times = 1000)

ex_null <- map_dbl(ex_perms$splits, function(s) {
  analysis(s) %>%
    group_by(Species) %>%
    summarise(m = mean(Sepal.Length), .groups = "drop") %>%
    summarise(range = max(m) - min(m)) %>%
    pull(range)
})

ex_p <- mean(ex_null >= ex_observed)
ex_p
#> [1] 0
```

**Explanation:** Shuffling `Species` across rows breaks its tie to `Sepal.Length`. The observed range of group means is so much larger than any random reshuffle produces that no resample exceeds it, giving p approximately equal to 1/(times+1).

</details>

## Related rsample functions

- [bootstraps()](rsample-bootstraps-in-R.html): resample rows with replacement for standard errors and CIs.
- [vfold_cv()](rsample-vfold_cv-in-R.html): split into k folds for cross-validation.
- [mc_cv()](rsample-mc_cv-in-R.html): repeated random train/test splits.
- [initial_split()](rsample-initial_split-in-R.html): one train/test split for a final holdout.
- [analysis()](rsample-training-in-R.html): pull the analysis (training) set from any split, including a permutation split.

Full reference at the [tidymodels rsample documentation](https://rsample.tidymodels.org/reference/permutations.html).

## FAQ

**What is the difference between bootstraps() and permutations() in rsample?**

`bootstraps()` samples rows with replacement to estimate the sampling distribution of a statistic under the observed data, supporting confidence intervals and standard errors. `permutations()` shuffles specific columns to simulate the null hypothesis that those columns are independent of the rest of the data, supporting p-values and hypothesis tests. Bootstraps preserve relationships; permutations break them.

**How many permutations should I use for a permutation test?**

Use at least 1,000 for routine inference and 10,000 if you need precision near small p-values. The minimum reportable p-value is approximately 1/times, so 25 (the default) is only safe for code testing. Increasing `times` is cheap in rsample because each split is a list element, so default to 1,000 unless your statistic is very expensive.

**Can I use rsample permutations with a grouped data frame?**

`permutations()` does not respect dplyr groups; it shuffles the selected columns across all rows regardless of any prior `group_by()`. To restrict shuffling within groups (a stratified permutation), call `permutations()` separately on each group's subset and combine the resamples manually, or use `dplyr::mutate()` with `sample()` inside a custom resample loop.

**Why does rsample::permutations() return an Apparent split?**

Only when you set `apparent = TRUE`. That option adds the original unshuffled data as one extra resample so the observed statistic is included in the null pool. Including the apparent split keeps p-values strictly positive and is the convention recommended by Phipson and Smyth for exact permutation tests.
