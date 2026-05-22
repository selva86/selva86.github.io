---
title: "rsample nested_cv() in R: Nested Cross-Validation Splits"
slug: rsample-nested_cv-in-R
description: "Build nested cross-validation splits with rsample nested_cv() in R. Covers outer/inner resampling, inner_resamples column, and honest tuning workflows."
keywords: "rsample nested_cv, nested_cv function R, rsample nested_cv examples, nested cross validation R, tidymodels nested cv, rsample nested resampling"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "nested_cv()|rsample nested_cv|rsample::nested_cv()|nested cross-validation|nested resampling"
auto_link_case_sensitive: true
target_keyword: "rsample nested_cv"
sibling_block_enabled: true
difficulty: Intermediate
---

# rsample nested_cv() in R: Nested Cross-Validation Splits

<p class="lead">The rsample nested_cv() function in R builds nested cross-validation splits, so hyperparameter tuning happens inside an outer loop that gives an unbiased performance estimate of the entire model-selection pipeline.</p>

[QUICK ANSWER]
nested_cv(df, outside = vfold_cv(v = 5), inside = vfold_cv(v = 5))   # nested k-fold
nested_cv(df, outside = vfold_cv(v = 5), inside = bootstraps(times = 25))  # CV outside, boot inside
nested_cv(df, outside = vfold_cv(v = 10, repeats = 3), inside = vfold_cv(v = 5))  # repeated outer
nested_cv(df, outside = mc_cv(prop = 0.8, times = 10), inside = vfold_cv(v = 5))  # MC outer
folds$inner_resamples[[1]]                                            # inner resamples for fold 1
analysis(folds$splits[[1]])                                           # outer training rows
assessment(folds$splits[[1]])                                         # outer held-out rows
set.seed(123); nested_cv(df, vfold_cv(v = 5), vfold_cv(v = 5))        # reproducible nesting

[DECISION TREE: Is nested_cv() the right tool?]
- unbiased estimate after tuning: nested_cv(df, vfold_cv(v = 5), vfold_cv(v = 5))
- single train/test for final reporting: initial_split(df, prop = 0.8)
- plain k-fold tuning, no outer loop: vfold_cv(df, v = 10)
- repeated resampling with replacement: bootstraps(df, times = 25)
- time-ordered resampling: rolling_origin(df, initial = 100)
- monte carlo random splits: mc_cv(df, prop = 0.8, times = 25)
- keep grouped rows together: group_vfold_cv(df, group_var)

## What nested_cv() does

**nested_cv() builds a two-level resampling object, an outer scheme for evaluation and an inner scheme for tuning.** It belongs to the rsample package, the resampling engine of the tidymodels ecosystem. The function does not duplicate data. It returns a tibble of outer `rsplit` objects in a `splits` list-column, plus an `inner_resamples` list-column where each entry is itself a tibble of inner splits drawn from that outer fold's analysis set.

The point of nesting is honesty. Plain k-fold cross-validation that doubles as both the tuning loop and the reporting loop reuses the same held-out rows twice, which biases the final metric upward. nested_cv() prevents that leak: the inner resamples pick hyperparameters, and the outer assessment set, untouched until the inner loop finishes, scores the chosen model.

## Syntax and arguments

**The signature has one required data argument and two unquoted resampling expressions.**

```r title="nested_cv function signature"
nested_cv(
  data,      # the data frame to resample
  outside,   # outer resampling call: vfold_cv(v = 5), mc_cv(...), bootstraps(...)
  inside     # inner resampling call evaluated within each outer fold
)
```

The arguments that matter in practice:

- **data**: the data frame or tibble to resample.
- **outside**: an unquoted call to any rsample resampler. This drives the outer loop where each split's assessment set is the honest test set for one model-selection cycle.
- **inside**: an unquoted call to any rsample resampler. It is re-run on each outer fold's analysis set, so the inner splits are nested inside the outer training data and never see the outer held-out rows.

Both `outside` and `inside` accept the full set of rsample functions: `vfold_cv()`, `bootstraps()`, `mc_cv()`, `loo_cv()`, `validation_split()`, and others. The inner call is wrapped in a quoting machinery, so write it as a bare function call, not a string.

## nested_cv() examples

### Basic nested 5x5 cross-validation

**Call nested_cv() with two resampling expressions to get an outer-by-inner split structure.** A 5-fold outer with 5-fold inner is the standard starting point.

```r title="Build a 5x5 nested CV object"
library(rsample)

set.seed(123)
folds <- nested_cv(mtcars,
                   outside = vfold_cv(v = 5),
                   inside  = vfold_cv(v = 5))
folds
#> # Nested resampling:
#> #  outer: 5-fold cross-validation
#> #  inner: 5-fold cross-validation
#> # A tibble: 5 x 3
#>   splits          id    inner_resamples
#>   <list>          <chr> <list>         
#> 1 <split [25/7]>  Fold1 <vfold_cv [5x2]>
#> 2 <split [25/7]>  Fold2 <vfold_cv [5x2]>
#> 3 <split [25/7]>  Fold3 <vfold_cv [5x2]>
#> 4 <split [25/7]>  Fold4 <vfold_cv [5x2]>
#> 5 <split [25/7]>  Fold5 <vfold_cv [5x2]>
```

### Inspect the inner resamples for one outer fold

**Each row of the result carries its own inner resampling tibble in the inner_resamples column.** Index it like any list-column.

```r title="Pull the inner resamples for fold 1"
inner <- folds$inner_resamples[[1]]
inner
#> #  5-fold cross-validation 
#> # A tibble: 5 x 2
#>   splits          id   
#>   <list>          <chr>
#> 1 <split [20/5]>  Fold1
#> 2 <split [20/5]>  Fold2
#> 3 <split [20/5]>  Fold3
#> 4 <split [20/5]>  Fold4
#> 5 <split [20/5]>  Fold5
```

The 25 analysis rows from outer fold 1 are split again into five inner folds of 20 train / 5 assess. Those inner folds drive tuning for that one outer pass.

### Extract analysis and assessment sets

**Inside any fold, analysis() and assessment() return ordinary data frames.** The same helpers work at both outer and inner levels.

```r title="Pull data frames from outer and inner folds"
outer_train <- analysis(folds$splits[[1]])
outer_test  <- assessment(folds$splits[[1]])

inner_fold1 <- folds$inner_resamples[[1]]$splits[[1]]
inner_train <- analysis(inner_fold1)
inner_test  <- assessment(inner_fold1)

c(outer = nrow(outer_train), inner = nrow(inner_train))
#> outer inner 
#>    25    20
```

### Mix resampling schemes across levels

**The outer and inner schemes do not have to match.** A common pattern uses cross-validation outside and bootstraps inside for variance-friendly inner tuning on small data.

```r title="CV outside, bootstrap inside"
set.seed(123)
mix_folds <- nested_cv(mtcars,
                       outside = vfold_cv(v = 5),
                       inside  = bootstraps(times = 25))
mix_folds$inner_resamples[[1]]
#> # Bootstrap sampling 
#> # A tibble: 25 x 2
#>    splits          id         
#>    <list>          <chr>      
#>  1 <split [25/9]>  Bootstrap01
#>  2 <split [25/8]>  Bootstrap02
#>  3 <split [25/9]>  Bootstrap03
#> # i 22 more rows
```

## nested_cv() vs other resampling functions

**nested_cv() is the only rsample builder that combines two resampling schemes into one object.** Pick by what the next consumer in your pipeline needs.

| Function | Produces | Use when |
|---|---|---|
| `nested_cv()` | Outer splits + per-fold inner resamples | Tuning AND honest performance reporting on small data |
| `vfold_cv()` | v folds, every row held out once | Tuning OR reporting, not both at once |
| `initial_split()` | One train/test split | Final hold-out reporting after tuning |
| `bootstraps()` | Resamples with replacement | Variance estimates, small data |
| `mc_cv()` | Random train/test splits, can overlap | Many resamples without v-fold structure |

A typical workflow uses `vfold_cv()` for tuning when the dataset is large enough to keep a separate test set with `initial_split()`. When data is too small to spare a single test set, `nested_cv()` substitutes its outer loop for that hold-out.

[KEY INSIGHT]
**The inner_resamples column is the whole point.** Every outer fold carries its own inner resampling tibble, so when you fit a model per outer fold, the inner splits act as a private tuning set for that fold. Compute the cross-validated metric inside, pick the best hyperparameters, refit on the outer analysis set, and score on the outer assessment set. That outer metric is the unbiased estimate the rest of the pipeline can quote.

## Common pitfalls

**Three mistakes account for most nested_cv() bugs.**

- **Quoting the resampling calls.** Passing `outside = "vfold_cv(v = 5)"` as a string fails because the arguments are evaluated as expressions, not parsed as text. Write `outside = vfold_cv(v = 5)` bare, no quotes.
- **Using inner metrics as the final report.** The inner cross-validation exists to pick hyperparameters; its averaged metric is optimistic because the chosen model was selected on those same folds. Always report the outer assessment metric, computed once per outer fold after tuning is done.
- **Forgetting set.seed().** Each outer fold runs an independent inner resample, so two unseeded runs produce different nested structures. Set the seed once before nested_cv() to lock both levels.

[WARNING]
**nested_cv() does not exist in caret.** If you are porting code from `trainControl(method = "repeatedcv")` to tidymodels, there is no single tuning helper that combines the two loops. You build the nested object with `nested_cv()`, then drive the inner loop with `tune_grid()` per outer fold, typically inside a `purrr::map()` or `fit_resamples()` wrapper.

## Try it yourself

**Try it:** Build a 3-fold outer, 5-bootstrap inner nested resampling on the `iris` dataset stratified by `Species` on the outer loop. Save it to `ex_nested`.

```r title="Your turn: nested CV on iris"
# Try it: 3-fold outer, 5-bootstrap inner
set.seed(42)
ex_nested <- # your code here

nrow(ex_nested)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_nested <- nested_cv(iris,
                       outside = vfold_cv(v = 3, strata = Species),
                       inside  = bootstraps(times = 5))
nrow(ex_nested)
#> [1] 3
```

**Explanation:** `vfold_cv(v = 3, strata = Species)` builds the outer loop with balanced species proportions across the three folds. `bootstraps(times = 5)` builds five inner bootstrap resamples per outer training set. The result has one row per outer fold.

</details>

## Related rsample functions

**nested_cv() is the wrapper; these are the building blocks it composes.**

- `vfold_cv()`: standard k-fold cross-validation, the most common outer or inner choice.
- `bootstraps()`: bootstrap resamples, popular as an inner scheme on small data.
- `analysis()` and `assessment()`: extract the two data frames from any outer or inner split.
- `mc_cv()`: monte carlo random splits, useful for large outer loops without v-fold rigidity.
- `initial_split()`: build the single hold-out set you would use instead of nested_cv() when data is plentiful.

[NOTE]
**Coming from scikit-learn?** `nested_cv(df, vfold_cv(v = 5), vfold_cv(v = 5))` is the tidymodels equivalent of pairing `cross_val_score` with an inner `GridSearchCV`. The inner_resamples list-column matches what scikit-learn builds implicitly when you stack two cv iterators.

## FAQ

**When should I use nested_cv() instead of vfold_cv()?**

Use nested_cv() when the same dataset has to drive both hyperparameter tuning and the final performance report, and the dataset is too small to spare a separate `initial_split()` test set. Plain v-fold tuning inflates the reported metric because the model was chosen on the same held-out rows it is scored on. nested_cv() prevents that by giving each outer fold its own inner tuning set, which the outer assessment rows never see.

**What goes in the outside vs inside argument?**

The `outside` argument is the loop that produces the honest performance estimate. The `inside` argument is the loop that picks hyperparameters within each outer training fold. Outside is usually 3 to 10 fold cross-validation; inside is often 5-fold CV or 25-bootstrap resampling. They do not have to use the same resampling family, and inner can be cheaper than outer because it runs many times.

**How do I access the inner resamples?**

Each row of a nested_cv() result has an `inner_resamples` list-column. `folds$inner_resamples[[i]]` returns the tibble of inner splits for outer fold `i`, which has the same shape as the output of the inner resampler called on its own. From there, `analysis()` and `assessment()` work the same as on any rsample split.

**Is nested_cv() computationally expensive?**

Yes. With 5-fold outer and 5-fold inner, you fit each candidate model 25 times, plus 5 refits on the outer analysis sets, so cost grows as outer x inner x number-of-hyperparameter-combinations. Use 3 to 5 folds at each level for prototyping, and reserve 10x10 nesting for the final reportable result.

**Does nested_cv() respect stratification?**

It respects whatever the inner and outer resamplers do. Pass `strata = Species` inside the outer or inner call, for example `outside = vfold_cv(v = 5, strata = Species)`, and that level stratifies. The outer and inner stratification are independent, so you can stratify one level and skip the other.
