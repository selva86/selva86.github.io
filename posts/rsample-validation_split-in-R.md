---
title: "rsample validation_split() in R: Train Validation Split"
slug: rsample-validation_split-in-R
description: "Create a train/validation split with rsample validation_split() in R. Covers prop, strata, the initial_validation_split() upgrade, and tune integration."
keywords: "rsample validation_split, validation_split function R, rsample validation_split examples, R validation set split, initial_validation_split, train validation test split R, tidymodels validation set"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "validation_split()|rsample validation_split|rsample::validation_split()|validation set split|initial_validation_split()"
auto_link_case_sensitive: true
target_keyword: "rsample validation_split"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample validation_split() in R: Train Validation Split

<p class="lead">The rsample validation_split() function in R creates a single train/validation partition wrapped as a resampling object, so you can tune a model on the validation set without burning your held-out test set.</p>

[QUICK ANSWER]
validation_split(df)                          # default 75/25 train/validation
validation_split(df, prop = 0.8)              # custom 80/20
validation_split(df, strata = y)              # stratified by outcome
analysis(vs$splits[[1]])                      # extract training rows
assessment(vs$splits[[1]])                    # extract validation rows
set.seed(123); validation_split(df)           # reproducible split
initial_validation_split(df, prop = c(.6,.2)) # modern 3-way split

[DECISION TREE: Is validation_split() the right tool?]
- single train/validation rset for tuning: validation_split(df, prop = 0.8)
- three-way train/val/test in one shot: initial_validation_split(df)
- simple train/test split, no tuning: initial_split(df, prop = 0.8)
- k-fold cross-validation for tuning: vfold_cv(df, v = 10)
- repeated resampling estimates: bootstraps(df, times = 25)
- stratify the split by class: validation_split(df, strata = y)
- time-ordered validation slice: initial_time_split(df, prop = 0.8)

## What validation_split() does

**validation_split() partitions a data frame once into a training portion and a validation portion, and returns that pair as an rset.** It lives in the rsample package, the resampling engine of the tidymodels ecosystem. The split itself is the same as `initial_split()`, but the return value is shaped differently. You get a one-row tibble with a `splits` list-column, the same shape that `vfold_cv()` and `bootstraps()` produce. That shape is what `tune::tune_grid()` expects in its `resamples` argument.

The point of a held-out validation set is to tune hyperparameters without touching the final test set. You fit candidate models on the training rows, score them on the validation rows, pick the best, and only then evaluate on a fresh test split.

## Syntax and arguments

**The signature mirrors initial_split() so the same defaults apply.**

```r title="validation split function signature"
validation_split(
  data,           # data frame to split
  prop = 3/4,     # fraction of rows in training
  strata = NULL,  # column to stratify by
  breaks = 4,     # quantile bins for numeric strata
  pool = 0.1      # small-level pooling threshold
)
```

The arguments you reach for in practice:

- **data**: the data frame or tibble to partition.
- **prop**: the fraction of rows kept for training. The default `3/4` sends 75 percent to training, 25 percent to the validation slice.
- **strata**: a column name. Splitting is performed within each level of this variable so the class mix is preserved on both sides.
- **breaks**: when `strata` is numeric, the number of quantile bins used to stratify the values.
- **pool**: strata levels smaller than this fraction of the data are merged before splitting, which prevents empty cells.

[NOTE]
**As of rsample 1.2.0, validation_split() is soft-deprecated.** The function still works and you will see it in tutorials, but new tidymodels code should prefer the `initial_validation_split()` plus `validation_set()` pair covered below.

## validation_split() examples

### Basic 80/20 train/validation split

**Call validation_split() on a data frame and print the result to see the rset shape.** The return value is a one-row tibble, not a single split, because rsample treats it as a resampling object with exactly one resample.

```r title="Create an 80/20 validation split"
library(rsample)

set.seed(123)
mtcars_vs <- validation_split(mtcars, prop = 0.8)
mtcars_vs
#> # A tibble: 1 x 2
#>   splits         id        
#>   <list>         <chr>     
#> 1 <split [25/7]> validation
```

The `<split [25/7]>` notation reports 25 training rows and 7 validation rows. The `id` column tags this resample as `validation`, which is how tune later labels the metric output.

### Extract the training and validation data

**Use analysis() for training rows and assessment() for validation rows.** The pair are the rsample names for what most people call the train and validation slices.

```r title="Pull training and validation rows"
train_data <- analysis(mtcars_vs$splits[[1]])
val_data   <- assessment(mtcars_vs$splits[[1]])

nrow(train_data)
#> [1] 25
nrow(val_data)
#> [1] 7
```

The `training()` and `testing()` helpers also work on the underlying rsplit, but `analysis()` and `assessment()` read more clearly when the second slice is a validation set rather than a test set.

### Stratified split on a classification target

**Pass a class column to strata to keep the class balance equal in both slices.** This matters most for imbalanced outcomes where a random split can leave the validation set short on a minority class.

```r title="Stratify the split by Species"
set.seed(42)
iris_vs <- validation_split(iris, prop = 0.75, strata = Species)
iris_vs$splits[[1]]
#> <Analysis/Assess/Total>
#> <111/39/150>

table(analysis(iris_vs$splits[[1]])$Species)
#> setosa versicolor  virginica 
#>     37         37         37
```

Every Species level lands 37 rows in training. Compare that to an unstratified split, where the counts will drift by a few rows each run.

### Hand the rset to tune_grid()

**The shape of validation_split() is built for tune::tune_grid(), which expects an rset in its resamples argument.** You define a tunable model spec, pass the validation rset, and tune fits each grid candidate on the training rows and scores it on the validation rows.

```r title="Validation rset slots into tune_grid"
# Pseudocode for downstream use, not run here
# library(parsnip); library(tune)
# spec <- rand_forest(mtry = tune()) |>
#   set_engine("ranger") |> set_mode("regression")
# tune_grid(spec, mpg ~ ., resamples = mtcars_vs, grid = 5)
```

Cross-validation rsets like `vfold_cv()` plug into the exact same slot. That interchangeability is the reason `validation_split()` returns a one-row tibble instead of a bare split.

## Compare with alternatives

**Use validation_split() when you want a single held-out slice with tune compatibility, but prefer initial_validation_split() for new code.** The table below shows when each rsample helper fits.

| Function | Output shape | Use case |
|---|---|---|
| `validation_split()` | rset, 1 row | Single train/validation pair, tune-compatible (soft-deprecated) |
| `initial_validation_split()` | 3-way split object | Train, validation, AND test in one call, modern replacement |
| `initial_split()` | rsplit, 1 split | Plain train/test, no tuning loop |
| `vfold_cv()` | rset, k rows | K-fold cross-validation in tune_grid() |
| `bootstraps()` | rset, t rows | Resampled performance estimates with replacement |

The modern path is `initial_validation_split()` followed by `validation_set()`:

```r title="Modern train validation test workflow"
set.seed(7)
three_way <- initial_validation_split(mtcars, prop = c(0.6, 0.2))
three_way
#> <Training/Validation/Testing/Total>
#> <19/6/7/32>

# Extract each slice
train_rows <- training(three_way)
val_rows   <- validation(three_way)
test_rows  <- testing(three_way)

# Convert to a tune-ready rset
vs <- validation_set(three_way)
vs
#> # A tibble: 1 x 2
#>   splits         id        
#>   <list>         <chr>     
#> 1 <split [19/6]> validation
```

[KEY INSIGHT]
**The validation set is for tuning, the test set is for the final score.** Touching the test set during hyperparameter selection inflates your reported accuracy. `initial_validation_split()` makes the three-way separation explicit so you never reach for the wrong slice.

## Common pitfalls

**Three mistakes show up over and over when readers first reach for validation_split().**

1. **Treating the rset as a split.** `validation_split(df)` returns a tibble. Calling `training()` on it errors. You must index into `$splits[[1]]` first, or use `analysis()` and `assessment()` on the inner rsplit.

2. **Forgetting set.seed() before the call.** rsample uses R's RNG to draw the partition. Without a seed, every script run produces a different split, and your reported validation metric will jitter.

3. **Using the validation set as the test set.** Tuning on the validation slice and reporting that score as final performance leaks information. Hold out a separate test slice with `initial_validation_split()` or a second `initial_split()` step.

[WARNING]
**`validation_split(df, prop = 0.8)` puts 80 percent in training, NOT 80 percent in validation.** `prop` always names the training fraction, even though the function name highlights the validation slice.

## Try it yourself

**Try it:** Split iris into a 70/30 train/validation pair stratified by Species, then count how many setosa rows land in the validation slice. Save the count to `ex_setosa_val`.

```r title="Your turn: stratified validation split"
# Try it: build a stratified 70/30 validation_split of iris
set.seed(99)
ex_iris_vs <- # your code here

ex_setosa_val <- # your code here

ex_setosa_val
#> Expected: 15
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
ex_iris_vs <- validation_split(iris, prop = 0.7, strata = Species)

ex_setosa_val <- sum(assessment(ex_iris_vs$splits[[1]])$Species == "setosa")
ex_setosa_val
#> [1] 15
```

**Explanation:** Stratified splitting on Species keeps each class proportional, so a 70/30 split of 50 setosa rows puts 35 in training and 15 in the validation slice. `assessment()` pulls the validation rows from the inner rsplit object.

</details>

## Related rsample functions

- [`initial_split()`](rsample-initial_split-in-R.html) for a plain train/test pair with no tuning loop
- [`vfold_cv()`](rsample-vfold_cv-in-R.html) for k-fold cross-validation in tune_grid
- [`bootstraps()`](rsample-bootstraps-in-R.html) for resampled performance estimates
- [`group_initial_split()`](rsample-group_initial_split-in-R.html) when rows belong to groups that must not split across slices

External reference: the official [rsample::validation_split()](https://rsample.tidymodels.org/reference/validation_split.html) documentation.

## FAQ

**What is the difference between validation_split() and initial_split()?**

`initial_split()` returns a single rsplit object, the shape you pass to `training()` and `testing()` for a plain holdout. `validation_split()` makes the same partition but wraps it as a one-row rset, the shape `tune::tune_grid()` expects in its `resamples` argument. Use `initial_split()` when you only need a train/test pair. Use `validation_split()` when the held-out rows are a validation set you will score tuning candidates against.

**Is validation_split() deprecated?**

It is soft-deprecated as of rsample 1.2.0, which means the function still works and will not error, but new code should prefer `initial_validation_split()` paired with `validation_set()`. The new pair produces an explicit three-way train, validation, and test split, which makes the separation between tuning and final scoring impossible to confuse.

**How do I set the validation set proportion?**

Pass the `prop` argument. `prop` names the training fraction, not the validation fraction, so `prop = 0.8` gives 80 percent training and 20 percent validation. For a three-way `initial_validation_split()`, pass a two-element vector like `prop = c(0.6, 0.2)` for 60 percent training, 20 percent validation, and the remaining 20 percent test.

**Can I use validation_split() with tune_grid()?**

Yes. The one-row rset slots into `tune_grid(resamples = vs)` exactly like a `vfold_cv()` object. tune fits each candidate on the training rows, scores it on the validation rows, and reports the validation metric. For k-fold instead, swap `validation_split()` for `vfold_cv(v = 10)`; everything else stays the same.

**Why do I get two rows when I call assessment() on the result?**

You probably called `assessment()` on the rset tibble rather than the inner rsplit. Index in first: `assessment(vs$splits[[1]])`. The `$splits[[1]]` unwraps the list-column to get the rsplit object the resample helpers operate on.
