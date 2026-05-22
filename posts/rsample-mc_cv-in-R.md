---
title: "rsample mc_cv() in R: Monte Carlo Cross-Validation Splits"
slug: rsample-mc_cv-in-R
description: "Build Monte Carlo cross-validation splits with rsample mc_cv() in R. Covers prop, times, strata, set.seed reproducibility, and how mc_cv differs from vfold_cv."
keywords: "rsample mc_cv, mc_cv function R, rsample mc_cv examples, R monte carlo cross validation, mc_cv tidymodels, monte carlo cv R, repeated random splits R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "mc_cv()|rsample mc_cv|rsample::mc_cv()|monte carlo cross-validation|monte carlo cv"
auto_link_case_sensitive: true
target_keyword: "rsample mc_cv"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample mc_cv() in R: Monte Carlo Cross-Validation Splits

<p class="lead">The rsample mc_cv() function in R builds Monte Carlo cross-validation splits, drawing many independent random train/test partitions so you can average a model's performance across resamples without committing to a fixed v-fold structure.</p>

[QUICK ANSWER]
mc_cv(df)                                # default: 25 splits, prop = 0.75
mc_cv(df, prop = 0.8)                    # 80/20 random splits
mc_cv(df, times = 100)                   # 100 Monte Carlo splits
mc_cv(df, prop = 0.7, times = 50)        # 50 splits at 70/30
mc_cv(df, strata = y)                    # class-balanced splits
analysis(mcs$splits[[1]])                # training rows of split 1
assessment(mcs$splits[[1]])              # held-out rows of split 1
set.seed(123); mc_cv(df, times = 25)     # reproducible splits

[DECISION TREE: Is mc_cv() the right tool?]
- repeated random train/test splits: mc_cv(df, prop = 0.75, times = 25)
- every row held out exactly once: vfold_cv(df, v = 10)
- one final hold-out partition: initial_split(df, prop = 0.8)
- resamples with replacement: bootstraps(df, times = 25)
- time-ordered resamples: rolling_origin(df, initial = 100)
- keep group rows together across splits: group_vfold_cv(df, group_var)
- very small dataset, leave-one-out: loo_cv(df)

## What mc_cv() does

**mc_cv() draws a sequence of independent random train/test splits from a data frame.** It belongs to the rsample package, the resampling engine of the tidymodels ecosystem. Each call to `mc_cv()` returns a tibble of `rsplit` objects in a `splits` list-column, where every row is one Monte Carlo replicate with its own analysis (training) portion and assessment (held-out) portion.

The defining feature is independence. Unlike vfold_cv(), which partitions every row into exactly one held-out fold, mc_cv() resamples freely. A given row may sit in the assessment set of several splits or of none at all. That property makes mc_cv() useful when you want many resamples (50, 100, or more) without inflating the cost of a high-v fold scheme, and when the natural unit of evaluation is a random hold-out rather than an exhaustive partition.

## Syntax and arguments

**The signature has one required argument and four tuning knobs.**

```r title="mc_cv function signature"
mc_cv(
  data,           # the data frame to resample
  prop = 3/4,     # proportion that goes to the analysis (training) set
  times = 25,     # number of Monte Carlo splits
  strata = NULL,  # column to stratify the splits by
  breaks = 4,     # bins used when strata is numeric
  pool = 0.1      # small-group pooling threshold for strata
)
```

The arguments that matter in practice:

- **data**: the data frame or tibble to resample.
- **prop**: proportion of rows assigned to the analysis (training) set in each split. The default `0.75` gives 75/25 splits.
- **times**: how many independent splits to draw. The default `25` is a reasonable starting point; raise to 50 or 100 on small datasets.
- **strata**: a column name. Each split is drawn so the class proportions of `strata` are preserved in both analysis and assessment sets.
- **breaks**: when `strata` is numeric, the number of quantile bins used for stratification.

## mc_cv() examples

### Default Monte Carlo splits

**Call mc_cv() on a data frame and print the result to see the split structure.** The defaults produce 25 splits at a 75/25 ratio.

```r title="Create default Monte Carlo splits"
library(rsample)

set.seed(123)
mc_splits <- mc_cv(mtcars)
mc_splits
#> # Monte Carlo cross-validation (0.75/0.25) with 25 resamples  
#> # A tibble: 25 x 2
#>    splits         id        
#>    <list>         <chr>     
#>  1 <split [24/8]> Resample01
#>  2 <split [24/8]> Resample02
#>  3 <split [24/8]> Resample03
#>  4 <split [24/8]> Resample04
#>  5 <split [24/8]> Resample05
#>  6 <split [24/8]> Resample06
#>  7 <split [24/8]> Resample07
#>  8 <split [24/8]> Resample08
#>  9 <split [24/8]> Resample09
#> 10 <split [24/8]> Resample10
#> # i 15 more rows
```

### Extract analysis and assessment sets

**Each split exposes an analysis() set for fitting and an assessment() set for scoring.** These helpers return ordinary data frames you can pass to any modeling function.

```r title="Pull one split's data"
split1 <- mc_splits$splits[[1]]

train_part <- analysis(split1)
test_part  <- assessment(split1)

nrow(train_part)
#> [1] 24
nrow(test_part)
#> [1] 8
```

### Change the train/test proportion

**Pass prop to control how much of the data goes into the analysis set on each split.** Raising prop produces smaller assessment sets and lower-variance training, useful when the data is scarce and you want to keep most of it for fitting.

```r title="Use 80/20 splits"
set.seed(123)
mc_80 <- mc_cv(mtcars, prop = 0.8)
mc_80$splits[[1]]
#> <Analysis/Assess/Total>
#> <26/6/32>
```

### Increase the number of resamples

**Set times higher to average over more random splits.** A common pattern is 50 or 100 resamples on small datasets where a single 10-fold pass is noisy.

```r title="Run 50 Monte Carlo splits"
set.seed(123)
mc_50 <- mc_cv(mtcars, prop = 0.75, times = 50)
nrow(mc_50)
#> [1] 50
```

### Stratify by the outcome

**Use strata to keep a class or numeric distribution balanced across every split.** Without stratification a random split can under-represent a rare class. Here a cylinder-balanced split preserves the 4/6/8-cylinder mix in both portions.

```r title="Stratified splits by a factor column"
set.seed(123)
strat_mc <- mc_cv(mtcars, prop = 0.75, times = 10, strata = cyl)
table(analysis(strat_mc$splits[[1]])$cyl)
#> 
#>  4  6  8 
#>  8  5 10
```

## mc_cv() vs other resampling functions

**mc_cv() draws repeated random hold-outs; the alternatives have different sampling structures.** Choose based on the resampling estimator you need.

| Function | Produces | Use when |
|---|---|---|
| `mc_cv()` | Independent random train/test splits | Many resamples, no v-fold constraint |
| `vfold_cv()` | v folds, every row held out exactly once | Stable k-fold tuning, standard CV |
| `initial_split()` | One train/test split | Final hold-out evaluation |
| `bootstraps()` | Resamples with replacement | Variance estimates, very small data |
| `rolling_origin()` | Time-ordered resamples | Forecasting, expanding or sliding windows |
| `loo_cv()` | n folds of size 1 | Tiny datasets, leave-one-out |

A tidymodels workflow can plug `mc_cv()` directly into `fit_resamples()` or `tune_grid()` wherever a `vfold_cv()` object would go. The resamples object is interchangeable.

[KEY INSIGHT]
**Rows are not partitioned, they are resampled.** With `mc_cv()`, the same row can appear in the assessment set of multiple splits or never at all. That is the deliberate trade-off: you give up the every-row-held-out-once guarantee of v-fold CV in exchange for an unbounded number of resamples drawn from the same family of random splits.

## Common pitfalls

**Three mistakes account for most mc_cv() bugs.**

- **Forgetting set.seed().** `mc_cv()` shuffles rows on every call. Without `set.seed()` before the call, runs are not reproducible and any cross-validated metric drifts between executions. Place the seed in the same script, immediately before the resample.
- **Using mc_cv() on time-ordered data.** Random splits ignore chronology, so a forecasting model can train on the future and test on the past. Use `rolling_origin()` instead for time series; reserve `mc_cv()` for cross-sectional data.
- **Confusing times with prop.** `times` controls how many splits are drawn, not how big each one is. To take 100 resamples of size 30/70 use `mc_cv(df, prop = 0.3, times = 100)`, not `times = 30, prop = 100`.

[WARNING]
**mc_cv() splits can overlap heavily on small datasets.** With 25 resamples on a 32-row dataset at `prop = 0.75`, each row sits in roughly 6 to 7 different assessment sets on average. That is fine for performance averaging but useless for variance estimates of a single observation, where `bootstraps()` is the better choice.

## Try it yourself

**Try it:** Build 30 Monte Carlo splits on the `mtcars` dataset with a 70/30 ratio, stratified by `cyl`. Save the result to `ex_mcs`.

```r title="Your turn: stratified mc_cv on mtcars"
# Try it: 30 Monte Carlo splits, 70/30, stratified by cyl
set.seed(42)
ex_mcs <- # your code here

nrow(ex_mcs)
#> Expected: 30
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_mcs <- mc_cv(mtcars, prop = 0.7, times = 30, strata = cyl)
nrow(ex_mcs)
#> [1] 30
```

**Explanation:** `times = 30` produces thirty independent splits; `prop = 0.7` sends 70 percent of rows into each training portion; `strata = cyl` keeps the cylinder mix proportional in both halves of every split.

</details>

## Related rsample functions

**mc_cv() draws the splits; these companions consume and extend them.**

- `analysis()` and `assessment()`: pull the training and held-out data frames from a split object.
- `initial_split()`: carve off a final testing set before applying mc_cv() to the training portion.
- `vfold_cv()`: build a partitioned v-fold object when every row must be held out exactly once.
- `bootstraps()`: draw with-replacement resamples when variance estimates are the goal.
- `group_vfold_cv()`: keep all rows of a group together; mc_cv() has no group-aware analogue.

[NOTE]
**Coming from scikit-learn?** `mc_cv(df, prop = 0.75, times = 25)` is the tidymodels equivalent of `ShuffleSplit(n_splits=25, train_size=0.75)`. The `strata` argument matches `StratifiedShuffleSplit`.

## FAQ

**What is the default number of splits in mc_cv()?**

The default `times` argument is `25`, which builds 25 Monte Carlo splits at a 75/25 ratio. Each split is independent, so a row can be in the assessment set of several splits or none. Twenty-five splits is a reasonable starting point for medium-sized datasets. On small data, raise it to 50 or 100 to reduce the variance of the averaged performance metric. The cost scales linearly with `times`.

**How is mc_cv() different from vfold_cv()?**

`vfold_cv()` partitions the data: every row sits in exactly one held-out fold across v folds, so v controls both the number of folds and the held-out size. `mc_cv()` resamples freely: it draws each split at random with the chosen `prop`, and the same row can appear in the assessment set of many splits or none. Use vfold_cv() for standard k-fold cross-validation and mc_cv() when you want many independent random hold-outs.

**How do I make mc_cv() reproducible?**

Call `set.seed()` with any integer immediately before `mc_cv()`. The function randomises rows on every call, so a fixed seed guarantees identical splits across runs. Keep the seed and the resample call in the same script, and rerun with the same seed plus the same R version to reproduce the exact assignments. The `splits` column is stable under that combination.

**Can mc_cv() be used for time series data?**

No. `mc_cv()` ignores row order and draws random hold-outs, which lets a forecasting model train on future observations and test on past ones. That leakage destroys the validity of any time-series performance estimate. Use `rolling_origin()`, `sliding_window()`, or `sliding_period()` from rsample instead. Those functions respect chronology and produce resamples that mimic real forecasting evaluation.

**Does mc_cv() work with tune_grid() and fit_resamples()?**

Yes. The object returned by `mc_cv()` carries the same `rset` class as `vfold_cv()` output, so tidymodels tuning and evaluation functions accept it without modification. Pass it as the `resamples` argument to `fit_resamples()` for a single model, or to `tune_grid()` when tuning hyperparameters. The performance metrics are then averaged across the `times` Monte Carlo splits rather than across v folds.
