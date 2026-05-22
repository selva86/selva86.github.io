---
title: "rsample vfold_cv() in R: V-Fold Cross-Validation Splits"
slug: rsample-vfold_cv-in-R
description: "Build v-fold cross-validation splits with rsample vfold_cv() in R. Covers v, repeats, strata, set.seed reproducibility, and analysis()/assessment() helpers."
keywords: "rsample vfold_cv, vfold_cv function R, rsample vfold_cv examples, R k-fold cross validation, vfold_cv tidymodels, cross validation R rsample"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "vfold_cv()|rsample vfold_cv|rsample::vfold_cv()|v-fold cross-validation|k-fold cross-validation"
auto_link_case_sensitive: true
target_keyword: "rsample vfold_cv"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample vfold_cv() in R: V-Fold Cross-Validation Splits

<p class="lead">The rsample vfold_cv() function in R builds v-fold cross-validation splits, so you can tune and evaluate a model on multiple held-out folds instead of relying on a single train/test partition.</p>

[QUICK ANSWER]
vfold_cv(df)                                # default 10 folds
vfold_cv(df, v = 5)                         # 5-fold cross-validation
vfold_cv(df, v = 10, repeats = 5)           # repeated 10-fold CV
vfold_cv(df, strata = y)                    # stratified folds
analysis(folds$splits[[1]])                 # training rows of fold 1
assessment(folds$splits[[1]])               # held-out rows of fold 1
set.seed(123); vfold_cv(df, v = 5)          # reproducible folds

[DECISION TREE: Is vfold_cv() the right tool?]
- k-fold cross-validation: vfold_cv(df, v = 10)
- single train/test split: initial_split(df, prop = 0.8)
- repeated resampling with replacement: bootstraps(df, times = 25)
- time-ordered resamples: rolling_origin(df, initial = 100)
- keep groups intact across folds: group_vfold_cv(df, group_var)
- leave-one-out cross-validation: loo_cv(df)
- monte carlo random splits: mc_cv(df, prop = 0.8, times = 25)

## What vfold_cv() does

**vfold_cv() splits a data frame into v approximately equal folds for cross-validation.** It belongs to the rsample package, the resampling engine of the tidymodels ecosystem. The function does not duplicate your data. It returns a tibble of `rsplit` objects in a `splits` list-column, where each split stores the row indices that belong to the analysis (training) portion and the assessment (held-out) portion of one fold.

The point of cross-validation is a stable performance estimate. Every row sits in the held-out set exactly once across the v folds, so the model is scored on the entire data without ever evaluating on rows it was trained on. This is the resampling object that `tune_grid()` and `fit_resamples()` consume during hyperparameter tuning.

## Syntax and arguments

**The signature has one required argument and four tuning knobs.**

```r title="vfold_cv function signature"
vfold_cv(
  data,           # the data frame to resample
  v = 10,         # number of folds
  repeats = 1,    # how many times to repeat the v-fold scheme
  strata = NULL,  # column to stratify the folds by
  breaks = 4,     # bins used when strata is numeric
  pool = 0.1      # small-group pooling threshold for strata
)
```

The arguments that matter in practice:

- **data**: the data frame or tibble to resample.
- **v**: the number of folds. The default `10` is the standard k-fold choice.
- **repeats**: the number of times the entire v-fold scheme is repeated with a fresh shuffle. Use `repeats > 1` to reduce variance on small datasets.
- **strata**: a column name. Folds are formed within each level so class proportions are preserved.
- **breaks**: when `strata` is numeric, the number of quantile bins used to stratify.

## vfold_cv() examples

### Basic 10-fold cross-validation

**Call vfold_cv() on a data frame and print the result to see the fold structure.** The default `v = 10` produces a tibble with ten splits.

```r title="Create default 10-fold CV"
library(rsample)

set.seed(123)
iris_folds <- vfold_cv(iris)
iris_folds
#> #  10-fold cross-validation 
#> # A tibble: 10 x 2
#>    splits           id    
#>    <list>           <chr> 
#>  1 <split [135/15]> Fold01
#>  2 <split [135/15]> Fold02
#>  3 <split [135/15]> Fold03
#>  4 <split [135/15]> Fold04
#>  5 <split [135/15]> Fold05
#>  6 <split [135/15]> Fold06
#>  7 <split [135/15]> Fold07
#>  8 <split [135/15]> Fold08
#>  9 <split [135/15]> Fold09
#> 10 <split [135/15]> Fold10
```

### Extract analysis and assessment sets

**Each split has an analysis() set used for fitting and an assessment() set used for scoring.** These helpers return ordinary data frames you can pass to any modeling function.

```r title="Pull one fold's data"
fold1 <- iris_folds$splits[[1]]

train_fold <- analysis(fold1)
test_fold  <- assessment(fold1)

nrow(train_fold)
#> [1] 135
nrow(test_fold)
#> [1] 15
```

### Change the number of folds

**Pass v to choose a different number of folds.** Five folds is a common, faster alternative when models are slow to fit.

```r title="Use 5-fold cross-validation"
set.seed(123)
folds_5 <- vfold_cv(iris, v = 5)
folds_5
#> #  5-fold cross-validation 
#> # A tibble: 5 x 2
#>   splits           id   
#>   <list>           <chr>
#> 1 <split [120/30]> Fold1
#> 2 <split [120/30]> Fold2
#> 3 <split [120/30]> Fold3
#> 4 <split [120/30]> Fold4
#> 5 <split [120/30]> Fold5
```

### Repeated v-fold cross-validation

**Set repeats > 1 to rerun the v-fold scheme with a fresh shuffle each time.** The result is `v * repeats` splits, useful when a single 10-fold estimate is too noisy.

```r title="Run repeated 5-fold CV"
set.seed(123)
rep_folds <- vfold_cv(iris, v = 5, repeats = 3)
nrow(rep_folds)
#> [1] 15

unique(rep_folds$id)
#> [1] "Repeat1" "Repeat2" "Repeat3"
```

### Stratify by the outcome

**Use strata to keep the outcome distribution balanced across every fold.** Without stratification a random fold may under-represent a rare class. Here every species appears in equal counts in each fold.

```r title="Stratified folds by a factor column"
set.seed(123)
strat_folds <- vfold_cv(iris, v = 5, strata = Species)
table(analysis(strat_folds$splits[[1]])$Species)
#> 
#>     setosa versicolor  virginica 
#>         40         40         40
```

## vfold_cv() vs other resampling functions

**vfold_cv() partitions every row into exactly one held-out fold; the alternatives sample differently.** Choose based on the resampling estimator you need.

| Function | Produces | Use when |
|---|---|---|
| `vfold_cv()` | v folds, every row held out once | Tuning, robust performance estimates |
| `initial_split()` | One train/test split | Final hold-out evaluation |
| `bootstraps()` | Resamples with replacement | Small data, variance estimates |
| `mc_cv()` | Random train/test splits, can overlap | Many resamples without v-fold structure |
| `rolling_origin()` | Time-ordered resamples | Forecasting, expanding or sliding windows |
| `loo_cv()` | n folds of size 1 | Very small datasets, leave-one-out |

A typical tidymodels workflow combines them: `initial_split()` carves off a final testing set, then `vfold_cv()` on the training portion drives `tune_grid()` or `fit_resamples()`.

[KEY INSIGHT]
**The folds object is a tibble of pointers, not data.** Each `<split [135/15]>` entry stores indices into the original data frame, so a 10-fold object on a million-row table is still tiny. `analysis()` and `assessment()` are the only way to materialize a fold's rows as a usable data frame.

## Common pitfalls

**Three mistakes account for most vfold_cv() bugs.**

- **Forgetting set.seed().** `vfold_cv()` shuffles rows before partitioning. Without `set.seed()` before the call, every run produces different folds and your cross-validated metrics drift. Set the seed in the same script, right before the resample.
- **Calling vfold_cv() on the full dataset before initial_split().** Cross-validating on the entire data, including rows you later evaluate on, leaks information into model selection. Always split first with `initial_split()`, then resample only the training portion.
- **Confusing v with repeats.** `v = 100` builds 100 folds of `n/100` rows each, which is expensive and high-variance. `v = 10, repeats = 10` runs ten standard 10-fold passes, almost always the better choice.

[WARNING]
**rsample no longer exports `bootstrap()` as a noun, only `bootstraps()`.** Older tutorials referencing `bootstrap()` (singular) are out of date; current rsample uses the plural form alongside `vfold_cv()`, `mc_cv()`, and `loo_cv()`.

## Try it yourself

**Try it:** Build a 5-fold cross-validation object on the `mtcars` dataset stratified by `cyl`. Save it to `ex_folds`.

```r title="Your turn: stratified 5-fold CV"
# Try it: 5-fold stratified CV
set.seed(42)
ex_folds <- # your code here

nrow(ex_folds)
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_folds <- vfold_cv(mtcars, v = 5, strata = cyl)
nrow(ex_folds)
#> [1] 5
```

**Explanation:** `v = 5` produces five splits; `strata = cyl` preserves the proportion of 4, 6, and 8 cylinder cars across every fold. The result is a tibble with one row per fold, regardless of dataset size.

</details>

## Related rsample functions

**vfold_cv() is the workhorse; these functions extend it.**

- `analysis()` and `assessment()`: extract the two data frames from a split object.
- `initial_split()`: carve off a final testing set before resampling the training portion.
- `bootstraps()`: build bootstrap resamples with replacement for variance estimates.
- `group_vfold_cv()`: build folds while keeping all rows of a group together.
- `mc_cv()`: build random monte carlo train/test splits without the v-fold constraint.

[NOTE]
**Coming from scikit-learn?** `vfold_cv(df, v = 10)` is the tidymodels equivalent of `KFold(n_splits=10)`. The `strata` argument matches `StratifiedKFold`, and `repeats > 1` matches `RepeatedKFold`.

## FAQ

**What is the default number of folds in vfold_cv()?**

The default `v` argument is `10`, which builds a 10-fold cross-validation object. Each fold holds out 1/10 of the rows for assessment and uses the remaining 9/10 for analysis. For a 150-row dataset that is 15 held-out rows per fold. Five folds is a common faster alternative when models are slow to fit, and three folds is sometimes used during quick prototyping.

**How do I make vfold_cv() reproducible?**

Call `set.seed()` with any integer immediately before `vfold_cv()`. The function shuffles rows before partitioning, so a fixed seed guarantees the same folds every time the script runs. Keep the seed and the resample call together. Re-running with the same seed and the same R version reproduces the exact row assignments in every fold.

**What is the difference between vfold_cv() and bootstraps()?**

`vfold_cv()` partitions the data without replacement: every row appears in the held-out set exactly once across the v folds. `bootstraps()` draws each resample with replacement, so the same row can appear many times in one analysis set and never in another. Use cross-validation for stable tuning estimates and bootstraps for variance or bias estimates on small datasets.

**When should I use repeats?**

Set `repeats > 1` when a single 10-fold estimate is too noisy, typically on small datasets where the fold-to-fold variance is large. Repeated v-fold runs the entire scheme several times with a fresh shuffle and averages across all `v * repeats` results. The cost scales linearly: `v = 10, repeats = 5` fits 50 models instead of 10, but the resulting performance estimate has lower variance.

**Can vfold_cv() handle time series data?**

Not directly. `vfold_cv()` shuffles rows, which breaks the time order a forecasting model depends on. Use `rolling_origin()` instead. It produces resamples that respect chronology, with each assessment set following its analysis set in time, suitable for expanding-window or sliding-window evaluation.
