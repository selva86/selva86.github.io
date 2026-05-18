---
title: "recipes step_impute_knn() in R: KNN Missing Data Imputation"
slug: recipes-step_impute_knn-in-R
description: "Learn how recipes step_impute_knn() imputes missing values from k nearest neighbours in R. Covers the neighbors and impute_with arguments plus pitfalls."
keywords: "recipes step_impute_knn, step_impute_knn function R, recipes step_impute_knn examples, R KNN imputation recipes, tidymodels knn imputation, step_impute_knn tidymodels"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Missing-Value-Treatment-With-R.html
auto_link_terms: "step_impute_knn()|recipes step_impute_knn|recipes::step_impute_knn()|KNN imputation|step_impute_knn tidymodels"
auto_link_case_sensitive: true
target_keyword: "recipes step_impute_knn"
sibling_block_enabled: true
difficulty: Intermediate
---

# recipes step_impute_knn() in R: KNN Missing Data Imputation

<p class="lead">recipes step_impute_knn() imputes missing values in R by borrowing from the k nearest neighbours of each incomplete row. It fills both numeric and categorical columns and learns the reference data during prep().</p>

[QUICK ANSWER]
step_impute_knn(rec, Ozone)                          # impute one column
step_impute_knn(rec, Ozone, Solar.R)                 # impute several columns
step_impute_knn(rec, all_numeric_predictors())       # all numeric predictors
step_impute_knn(rec, Ozone, neighbors = 10)          # set the neighbour count
step_impute_knn(rec, Ozone, impute_with = imp_vars(Wind, Temp))  # choose matching features
prep(rec) |> bake(new_data = NULL)                   # learn, then apply

[DECISION TREE: Is step_impute_knn() the right tool?]
- impute from similar rows (mixed types): step_impute_knn(rec, all_predictors())
- impute numeric NAs with the mean: step_impute_mean(rec, x)
- impute numeric NAs with the median: step_impute_median(rec, x)
- impute categorical NAs with the mode: step_impute_mode(rec, grp)
- impute from a linear model: step_impute_linear(rec, x)
- impute with bagged trees: step_impute_bag(rec, x)
- drop rows with NA entirely: step_naomit(rec, all_predictors())

## What step_impute_knn() does

**step_impute_knn() fills missing values using the k most similar complete rows.** It is part of the [recipes](https://recipes.tidymodels.org/) package, the preprocessing engine of tidymodels. For each row with an `NA`, the step finds the k nearest neighbours across the other predictors, then fills the gap with the neighbours' average for a numeric column or their most common level for a categorical one.

Like every recipe step, it has two phases. When you call `prep()`, the step stores the training data as a reference set. When you call `bake()`, it searches that reference set for neighbours of whatever data you pass in and uses them to fill the gaps.

[KEY INSIGHT]
**KNN imputation is multivariate.** Mean and median imputation look at one column in isolation. step_impute_knn() uses the relationships between columns, so a hot, windy day gets an Ozone estimate from other hot, windy days rather than the global average.

## Syntax and arguments

**Two arguments control the quality of the fill: neighbors and impute_with.** Here is the call with its defaults:

```r title="step_impute_knn signature"
step_impute_knn(
  recipe,
  ...,
  role = NA,
  trained = FALSE,
  neighbors = 5,
  impute_with = imp_vars(all_predictors()),
  options = list(nthread = 1, eps = 1e-08),
  ref_data = NULL,
  columns = NULL,
  skip = FALSE,
  id = rand_id("impute_knn")
)
```

The arguments you will actually set:

- `recipe`: the recipe object you are adding the step to.
- `...`: one or more selectors naming the columns to impute. They can be numeric or categorical.
- `neighbors`: the number of neighbours to average. The default is 5.
- `impute_with`: an `imp_vars()` selector listing the predictors used to measure row similarity. Defaults to all predictors.
- `skip`: leave it `FALSE` for imputation so the step also runs on new data.

The `ref_data` and `columns` arguments are filled automatically during `prep()` and you should not set them by hand.

## step_impute_knn() examples

**Start with airquality, which has gaps in two columns.** The built-in dataset makes a clean test case.

```r title="Load recipes and check missing values"
library(recipes)

colSums(is.na(airquality))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

`Ozone` has 37 missing values and `Solar.R` has 7. Build a recipe that imputes both columns from their neighbours.

```r title="Build and prep a KNN imputation recipe"
rec <- recipe(Temp ~ ., data = airquality) |>
  step_impute_knn(Ozone, Solar.R)

prepped <- prep(rec, training = airquality)
imputed <- bake(prepped, new_data = airquality)

colSums(is.na(imputed))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>       0       0       0       0       0       0
```

Every gap is filled. The value of KNN shows up when you compare it against a flat mean.

```r title="KNN fills vary row by row"
gaps <- which(is.na(airquality$Ozone))
imputed$Ozone[gaps][1:6]
#> [1] 21.4 18.0 11.6 23.8 38.2 27.6

mean(airquality$Ozone, na.rm = TRUE)
#> [1] 42.13
```

Mean imputation would write `42.13` into every gap. KNN gives each row its own estimate from similar days, so the imputed column keeps realistic variation.

The `neighbors` argument trades smoothing against local detail.

```r title="Fewer neighbours, more local detail"
rec3 <- recipe(Temp ~ ., data = airquality) |>
  step_impute_knn(Ozone, Solar.R, neighbors = 3) |>
  prep()

bake(rec3, new_data = NULL)$Ozone[gaps][1:6]
#> [1] 19.0 14.7  9.3 26.0 41.3 24.7
```

With `neighbors = 3` the fills react more sharply to the closest rows. Larger values pull each estimate toward the global mean.

Restrict the matching features with `impute_with` when only some columns carry a real similarity signal.

```r title="Choose which predictors define similarity"
rec_iw <- recipe(Temp ~ ., data = airquality) |>
  step_impute_knn(Ozone, impute_with = imp_vars(Solar.R, Wind, Temp)) |>
  prep()

baked_iw <- bake(rec_iw, new_data = NULL)
sum(is.na(baked_iw$Ozone))
#> [1] 0
```

Here neighbours are found using only `Solar.R`, `Wind`, and `Temp`, ignoring `Month` and `Day`, which carry no meaningful similarity for ozone levels.

[TIP]
**You do not need to scale predictors first.** step_impute_knn() measures distance with Gower's metric, which normalises each variable internally. Adding `step_normalize()` before it changes nothing for the imputation.

## step_impute_knn() vs other imputation steps

**KNN is the accuracy-for-speed trade in the recipes imputation family.** Each step suits a different combination of data type and compute budget.

| Step | Approach | Speed | Mixed types |
|---|---|---|---|
| `step_impute_mean()` | Column mean | Fastest | No |
| `step_impute_median()` | Column median | Fastest | No |
| `step_impute_knn()` | Average of k neighbours | Slow | Yes |
| `step_impute_linear()` | Linear model of predictors | Medium | No |
| `step_impute_bag()` | Bagged tree model | Slowest | Yes |

Decision rule: reach for `step_impute_mean()` or `step_impute_median()` for a quick baseline. Switch to `step_impute_knn()` when columns are correlated and you can afford the extra compute. Use `step_impute_bag()` when you want model-based accuracy and KNN is too slow.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `KNNImputer`. It also fills each gap from the nearest rows, but operates only on numeric arrays, whereas step_impute_knn() handles factor columns directly through Gower distance.

## Common pitfalls

**The biggest cost of KNN imputation is speed.** For every missing cell, recipes computes a distance to each reference row. On a dataset with hundreds of thousands of rows this is slow, and it reruns on every resample during tuning.

```r title="Pitfall: imputing the outcome column"
rec_bad <- recipe(Temp ~ ., data = airquality) |>
  step_impute_knn(all_numeric()) |>
  prep()
#> all_numeric() also selects Temp, the outcome
```

`all_numeric()` selects the response column. Use `all_numeric_predictors()` so the outcome is never imputed.

Two more traps to avoid:

- **Neighbours too large.** Setting `neighbors` close to the row count averages most of the data and collapses KNN toward plain mean imputation.
- **Imputing before splitting.** Build the recipe on the training split. `prep()` stores that split as the reference set, so neighbours for test rows come only from training data.

[WARNING]
**Predictors used in impute_with should be mostly complete.** If the matching features are themselves riddled with `NA` values, the neighbour search has little to compare and the fills become unreliable. Impute or drop those columns before this step.

## Try it yourself

**Try it:** Build a recipe on `airquality` that imputes `Ozone` with `step_impute_knn()` using `neighbors = 7`, then confirm no missing values remain. Save the baked data to `ex_imputed`.

```r title="Your turn: KNN-impute Ozone"
# Try it: impute Ozone with 7 neighbours
ex_imputed <- # your code here

sum(is.na(ex_imputed$Ozone))
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_imputed <- recipe(Temp ~ ., data = airquality) |>
  step_impute_knn(Ozone, neighbors = 7) |>
  prep() |>
  bake(new_data = NULL)

sum(is.na(ex_imputed$Ozone))
#> [1] 0
```

**Explanation:** The recipe learns the `airquality` rows as a reference set during `prep()`, and `bake(new_data = NULL)` fills each missing `Ozone` value with the average of its 7 nearest neighbours.

</details>

## Related recipes steps

**These steps pair naturally with KNN imputation in a preprocessing pipeline.**

- `step_impute_mean()`: fast mean fill for symmetric numeric columns.
- `step_impute_median()`: median fill, robust to skew and outliers.
- `step_impute_mode()`: most-frequent-level fill for categorical columns.
- `step_impute_bag()`: bagged-tree imputation, model-based and slower.
- `step_normalize()`: centre and scale numeric columns after imputing.

## FAQ

**How does step_impute_knn() handle categorical columns?**

step_impute_knn() works on factor and character columns as well as numeric ones. It finds the k nearest neighbours with Gower distance, which supports mixed data types, then fills a categorical gap with the most common level among those neighbours. This is an advantage over `step_impute_mean()` and `step_impute_median()`, which ignore non-numeric columns entirely and leave their `NA` values in place.

**What is a good value for the neighbors argument?**

The default of 5 is a sound starting point for most datasets. Smaller values like 3 make the fill react sharply to the closest rows but are noisier. Larger values smooth the estimate toward the global average. If imputation quality matters, treat `neighbors` as a tunable parameter with `tune()` and pick the value by cross-validation rather than guessing.

**Does step_impute_knn() cause data leakage?**

Not when used correctly. `prep()` stores only the training data as the neighbour reference set. When you `bake()` validation or test data, recipes searches for neighbours within that stored training set, never within the new data. Leakage happens only if you prep the recipe on the full dataset before splitting, so always split first.

**Is step_impute_knn() slow on large datasets?**

It can be. Every missing cell triggers a distance calculation against the whole reference set, so cost grows with both rows and missing values. On large data, prefer `step_impute_mean()` or `step_impute_median()` for speed, restrict `impute_with` to a few strong predictors, or impute on a sample. The cost multiplies during tuning because the step reruns on every resample.
