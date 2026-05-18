---
title: "recipes step_impute_mean() in R: Mean Imputation"
slug: recipes-step_impute_mean-in-R
description: "Learn how recipes step_impute_mean() fills missing numeric values with the column mean in R. Syntax, trim argument, airquality examples, and common pitfalls."
keywords: "recipes step_impute_mean, step_impute_mean function R, recipes step_impute_mean examples, R mean imputation recipes, tidymodels impute mean, step_impute_mean tidymodels"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Missing-Value-Treatment-With-R.html
auto_link_terms: "step_impute_mean()|recipes step_impute_mean|recipes::step_impute_mean()|mean imputation|step_impute_mean tidymodels"
auto_link_case_sensitive: true
target_keyword: "recipes step_impute_mean"
sibling_block_enabled: true
difficulty: Intermediate
---

# recipes step_impute_mean() in R: Mean Imputation

<p class="lead">recipes step_impute_mean() fills missing numeric values with the column mean, learned from your training data during prep() and applied during bake(). It is the simplest imputation step in the tidymodels recipes package.</p>

[QUICK ANSWER]
step_impute_mean(rec, x)                          # impute one column
step_impute_mean(rec, x, y)                       # impute several columns
step_impute_mean(rec, all_numeric_predictors())   # all numeric predictors
step_impute_mean(rec, x, trim = 0.1)              # trimmed mean (robust)
prep(rec) |> bake(new_data = NULL)                # apply to training data
tidy(prepped, number = 1)                         # see the learned means

[DECISION TREE: Is step_impute_mean() the right tool?]
- impute numeric NAs with the mean: step_impute_mean(rec, all_numeric_predictors())
- impute with the median instead: step_impute_median(rec, x)
- impute categorical NAs: step_impute_mode(rec, grp)
- impute from neighbouring rows: step_impute_knn(rec, x)
- impute a time trend: step_impute_linear(rec, x)
- drop rows with NA entirely: step_naomit(rec, all_predictors())

## What step_impute_mean() does

**step_impute_mean() is a recipe step that replaces missing numeric values with the arithmetic mean of each column.** It is part of the [recipes](https://recipes.tidymodels.org/) package, the preprocessing engine of tidymodels. You add it to a recipe object and it becomes one stage in a reproducible feature-engineering pipeline.

The step has two phases. When you call `prep()`, it computes the mean of each selected column from the training data and stores it. When you call `bake()`, it uses those stored means to fill `NA` values in any dataset you pass in. This split is what makes mean imputation in a recipe safe for modelling.

[KEY INSIGHT]
**prep() learns, bake() applies.** The mean is estimated once from training data and reused on validation, test, and new data. The same number fills every dataset, so there is no information bleed from the test set into the model.

## Syntax and arguments

**The function signature is short, but two arguments matter for real work.** Here is the call with its defaults:

```r title="step_impute_mean signature"
step_impute_mean(
  recipe,
  ...,
  role = NA,
  trained = FALSE,
  means = NULL,
  trim = 0,
  skip = FALSE,
  id = rand_id("impute_mean")
)
```

The arguments you will actually set:

- `recipe`: the recipe object you are adding the step to.
- `...`: one or more selectors naming the columns to impute, such as `Ozone` or `all_numeric_predictors()`.
- `trim`: fraction (0 to 0.5) trimmed from each end of the sorted values before the mean is computed. `trim = 0` is the plain mean.
- `skip`: if `TRUE`, the step is skipped when baking new data. Leave it `FALSE` for imputation.

The `means` argument is filled automatically during `prep()` and you should not set it by hand.

## step_impute_mean() examples

**Start by confirming where the missing values are.** The built-in `airquality` dataset has gaps in two columns, which makes it a clean test case.

```r title="Load recipes and check missing values"
library(recipes)

colSums(is.na(airquality))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

`Ozone` has 37 missing values and `Solar.R` has 7. Now build a recipe that imputes both columns and inspect the result.

```r title="Build and prep a mean-imputation recipe"
rec <- recipe(Temp ~ ., data = airquality) |>
  step_impute_mean(Ozone, Solar.R)

prepped <- prep(rec, training = airquality)
imputed <- bake(prepped, new_data = airquality)

colSums(is.na(imputed))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>       0       0       0       0       0       0
```

Every gap is gone. To see the exact values that were inserted, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect the learned mean values"
tidy(prepped, number = 1)
#> # A tibble: 2 x 3
#>   terms   value id
#>   <chr>   <dbl> <chr>
#> 1 Ozone    42.1 impute_mean_AbC12
#> 2 Solar.R 186.  impute_mean_AbC12
```

You rarely want to list columns by hand. The `all_numeric_predictors()` selector imputes every numeric predictor at once, and `trim` makes the estimate resistant to outliers.

```r title="Impute all numeric predictors with a trimmed mean"
rec_trim <- recipe(Temp ~ ., data = airquality) |>
  step_impute_mean(all_numeric_predictors(), trim = 0.1) |>
  prep()

baked <- bake(rec_trim, new_data = NULL)
colSums(is.na(baked))
#>   Ozone Solar.R    Wind   Month     Day    Temp
#>       0       0       0       0       0       0
```

With `trim = 0.1`, the most extreme 10% of values at each end are dropped before averaging. For a skewed column like `Ozone`, the trimmed mean sits below the plain mean and resists a few large readings.

[TIP]
**Use bake(new_data = NULL) to retrieve the training data.** Once a recipe is prepped, passing `NULL` returns the already-processed training set without re-running `prep()`, which is faster than baking the original frame again.

## step_impute_mean() vs other imputation steps

**Mean imputation is the fastest option, but not always the right one.** The recipes package ships a family of imputation steps for different data types and distributions.

| Step | Best for | Handles factors? |
|---|---|---|
| `step_impute_mean()` | Numeric columns, roughly symmetric | No |
| `step_impute_median()` | Numeric columns, skewed or with outliers | No |
| `step_impute_mode()` | Categorical or integer columns | Yes |
| `step_impute_knn()` | Columns where neighbouring rows are informative | Yes |
| `step_impute_linear()` | Numeric columns with a trend or strong predictor | No |

Decision rule: use `step_impute_mean()` for quick baselines and symmetric numeric features. Switch to `step_impute_median()` when a column is skewed, and to `step_impute_knn()` when you can afford a slower, more accurate fill.

## Common pitfalls

**The most common surprise is that non-numeric columns are silently ignored.** `step_impute_mean()` only touches numeric columns. If you point it at a factor, the `NA` values stay untouched and no error is raised.

```r title="Pitfall: non-numeric columns are skipped"
df <- data.frame(x = c(1, NA, 3), grp = factor(c("a", NA, "b")))

baked <- recipe(~ ., data = df) |>
  step_impute_mean(all_predictors()) |>
  prep() |>
  bake(new_data = NULL)

baked
#>   x  grp
#> 1 1    a
#> 2 2 <NA>
#> 3 3    b
```

The numeric `x` is filled with `2`, but the factor `grp` keeps its `NA`. Use `step_impute_mode()` for categorical columns.

Two more traps to avoid:

- **Imputing before splitting.** Always build the recipe on the training split only. Computing the mean on the full dataset leaks test information into the model.
- **Imputing the outcome.** Selectors like `all_predictors()` exclude the response, but a bare column name does not. Never impute the variable you are predicting.

[WARNING]
**A column that is all NA cannot be imputed.** If every value in a selected column is missing, the mean is `NA` and the step fills nothing. Drop such columns with `step_zv()` or remove them before the recipe.

## Try it yourself

**Try it:** Build a recipe on `airquality` that imputes only the `Solar.R` column with its mean, then confirm no missing values remain. Save the baked data to `ex_imputed`.

```r title="Your turn: impute Solar.R"
# Try it: impute only Solar.R
ex_imputed <- # your code here

sum(is.na(ex_imputed$Solar.R))
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_imputed <- recipe(Temp ~ ., data = airquality) |>
  step_impute_mean(Solar.R) |>
  prep() |>
  bake(new_data = NULL)

sum(is.na(ex_imputed$Solar.R))
#> [1] 0
```

**Explanation:** The recipe selects only `Solar.R`, learns its mean during `prep()`, and `bake(new_data = NULL)` returns the processed training data with the gaps filled.

</details>

## Related recipes steps

**These steps pair naturally with mean imputation in a preprocessing pipeline.**

- `step_impute_median()`: median fill, robust to skew and outliers.
- `step_impute_mode()`: most-frequent-value fill for categorical columns.
- `step_impute_knn()`: imputes from k nearest neighbours.
- `step_impute_linear()`: imputes from a linear model of other predictors.
- `step_normalize()`: centre and scale numeric columns after imputing.

## FAQ

**What is the difference between step_impute_mean() and step_meanimpute()?**

They do the same thing. `step_meanimpute()` was the original name and was deprecated in recipes 0.1.16 in favour of `step_impute_mean()`. The new name groups all imputation steps under a common `step_impute_*` prefix. Old code still runs but raises a deprecation warning, so update calls to the current spelling when you can.

**Does step_impute_mean() work on factor or character columns?**

No. `step_impute_mean()` only operates on numeric columns. If you select a factor or character column, its missing values are left in place with no error or warning. For categorical data use `step_impute_mode()`, which fills with the most frequent level.

**When should I use mean versus median imputation?**

Use mean imputation when a column is roughly symmetric and free of extreme outliers. Use `step_impute_median()` when the column is skewed or has outliers, because the median is not pulled toward extreme values. The `trim` argument of `step_impute_mean()` is a middle ground that drops the tails before averaging.

**Does step_impute_mean() cause data leakage?**

Not when used correctly. The mean is computed only during `prep()`, which you run on the training set. When you `bake()` validation or test data, recipes reuses the stored training mean. Leakage happens only if you prep the recipe on the full dataset before splitting, so always split first.
