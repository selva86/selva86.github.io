---
title: "recipes step_impute_median() in R: Impute Missing Values"
slug: recipes-step_impute_median-in-R
description: "Learn how recipes step_impute_median() fills missing numeric values with the column median in R. Syntax, airquality examples, and median vs mean imputation."
keywords: "recipes step_impute_median, step_impute_median function R, recipes step_impute_median examples, R median imputation recipes, tidymodels impute median, step_impute_median vs step_impute_mean"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Missing-Value-Treatment-With-R.html
auto_link_terms: "step_impute_median()|recipes step_impute_median|recipes::step_impute_median()|median imputation|step_impute_median tidymodels"
auto_link_case_sensitive: true
target_keyword: "recipes step_impute_median"
sibling_block_enabled: true
difficulty: Intermediate
---

# recipes step_impute_median() in R: Impute Missing Values

<p class="lead">recipes step_impute_median() fills missing numeric values with the column median, learned from training data during prep() and applied during bake(). It is the outlier-resistant imputation step in the tidymodels recipes package.</p>

[QUICK ANSWER]
step_impute_median(rec, x)                          # impute one column
step_impute_median(rec, x, y)                       # impute several columns
step_impute_median(rec, all_numeric_predictors())   # all numeric predictors
prep(rec) |> bake(new_data = NULL)                  # apply to training data
tidy(prepped, number = 1)                           # see the learned medians
recipe(y ~ ., data = df) |> step_impute_median(x)   # inside a full recipe

[DECISION TREE: Is step_impute_median() the right tool?]
- impute skewed numeric NAs: step_impute_median(rec, all_numeric_predictors())
- impute symmetric numeric NAs: step_impute_mean(rec, x)
- impute categorical NAs: step_impute_mode(rec, grp)
- impute from similar rows: step_impute_knn(rec, x)
- impute from a linear model: step_impute_linear(rec, x)
- drop rows with NA entirely: step_naomit(rec, all_predictors())

## What step_impute_median() does

**step_impute_median() is a recipe step that replaces missing numeric values with the median of each column.** It belongs to the [recipes](https://recipes.tidymodels.org/) package, the preprocessing engine of tidymodels. You add the step to a recipe object and it becomes one stage of a reproducible feature-engineering pipeline.

The step runs in two phases. When you call `prep()`, it computes the median of each selected column from the training data and stores it. When you call `bake()`, it uses those stored medians to fill `NA` values in any dataset you pass. Because the value is learned once and reused everywhere, median imputation inside a recipe stays safe for modelling.

[KEY INSIGHT]
**The median ignores how extreme the outliers are.** It is the middle value of the sorted column, so a handful of huge readings cannot drag it. That is why `step_impute_median()` is the safer default for skewed data, while `step_impute_mean()` gets pulled toward the tail.

## Syntax and arguments

**The signature is short, and unlike step_impute_mean() there is no trim argument to tune.** Here is the call with its defaults:

```r title="step_impute_median signature"
step_impute_median(
  recipe,
  ...,
  role = NA,
  trained = FALSE,
  medians = NULL,
  skip = FALSE,
  id = rand_id("impute_median")
)
```

The arguments you will actually set:

- `recipe`: the recipe object you are adding the step to.
- `...`: one or more selectors naming the columns to impute, such as `Ozone` or `all_numeric_predictors()`.
- `skip`: if `TRUE`, the step is skipped when baking new data. Leave it `FALSE` for imputation.

The `medians` argument is filled automatically during `prep()`, so never set it by hand. There is no `trim` option because the median is already a robust statistic.

## step_impute_median() examples

**Median imputation earns its place when a column is skewed.** The built-in `airquality` dataset makes this concrete: its `Ozone` column is right-skewed, so the mean and median disagree.

```r title="Load recipes and compare mean to median"
library(recipes)

mean(airquality$Ozone, na.rm = TRUE)
#> [1] 42.12931
median(airquality$Ozone, na.rm = TRUE)
#> [1] 31.5
```

The mean sits about 10 units above the median because a few high ozone readings inflate it. Filling gaps with `31.5` keeps the imputed values closer to a typical day. Now build a recipe that imputes both incomplete columns.

```r title="Build and prep a median-imputation recipe"
rec <- recipe(Temp ~ ., data = airquality) |>
  step_impute_median(Ozone, Solar.R)

prepped <- prep(rec, training = airquality)
imputed <- bake(prepped, new_data = airquality)

colSums(is.na(imputed))
#>   Ozone Solar.R    Wind   Month     Day    Temp
#>       0       0       0       0       0       0
```

Every gap is filled. To see the exact values inserted, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect the learned median values"
tidy(prepped, number = 1)
#> # A tibble: 2 x 3
#>   terms   value id
#>   <chr>   <dbl> <chr>
#> 1 Ozone    31.5 impute_median_x1a2b
#> 2 Solar.R   205 impute_median_x1a2b
```

Listing columns by hand does not scale. The `all_numeric_predictors()` selector imputes every numeric predictor in one call.

```r title="Impute every numeric predictor at once"
rec_all <- recipe(Temp ~ ., data = airquality) |>
  step_impute_median(all_numeric_predictors()) |>
  prep()

baked <- bake(rec_all, new_data = NULL)
colSums(is.na(baked))
#>   Ozone Solar.R    Wind   Month     Day    Temp
#>       0       0       0       0       0       0
```

[TIP]
**Use bake(new_data = NULL) to retrieve the processed training data.** Once a recipe is prepped, passing `NULL` returns the already-imputed training set without re-running `prep()`, which is faster than baking the original frame again.

## Median vs mean imputation: which to use

**Median imputation and mean imputation fill the same gaps, but they behave differently on messy data.** The choice comes down to the shape of the column.

| Aspect | step_impute_median() | step_impute_mean() |
|---|---|---|
| Best for | Skewed columns, outliers present | Roughly symmetric columns |
| Pulled by outliers | No | Yes |
| trim argument | Not available | Available |
| Replacement value | Middle sorted value | Arithmetic average |

Decision rule: reach for `step_impute_median()` when a column is skewed or has outliers, which covers most real-world counts, prices, and durations. Use `step_impute_mean()` only when a column is roughly symmetric. When unsure, the median is the safer default because it cannot be distorted by a few extreme rows.

## Common pitfalls

**The most common surprise is that non-numeric columns are silently ignored.** `step_impute_median()` only touches numeric columns. Point it at a factor and the `NA` values stay in place with no error.

```r title="Pitfall: non-numeric columns are skipped"
df <- data.frame(x = c(1, NA, 5), grp = factor(c("a", NA, "b")))

baked <- recipe(~ ., data = df) |>
  step_impute_median(all_predictors()) |>
  prep() |>
  bake(new_data = NULL)

baked
#>   x  grp
#> 1 1    a
#> 2 3 <NA>
#> 3 5    b
```

The numeric `x` is filled with its median `3`, but the factor `grp` keeps its `NA`. Use `step_impute_mode()` for categorical columns.

Two more traps to avoid:

- **Imputing before splitting.** Build the recipe on the training split only. Computing the median on the full dataset leaks test information into the model.
- **Imputing the outcome.** Selectors like `all_numeric_predictors()` exclude the response, but a bare column name does not. Never impute the variable you are predicting.

[WARNING]
**A column that is all NA cannot be imputed.** If every value in a selected column is missing, the median is `NA` and the step fills nothing. Drop such columns with `step_zv()` or remove them before the recipe.

## Try it yourself

**Try it:** Build a recipe on `airquality` that imputes only the `Ozone` column with its median, then confirm no missing values remain. Save the baked data to `ex_imputed`.

```r title="Your turn: impute Ozone"
# Try it: impute only Ozone with the median
ex_imputed <- # your code here

sum(is.na(ex_imputed$Ozone))
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_imputed <- recipe(Temp ~ ., data = airquality) |>
  step_impute_median(Ozone) |>
  prep() |>
  bake(new_data = NULL)

sum(is.na(ex_imputed$Ozone))
#> [1] 0
```

**Explanation:** The recipe selects only `Ozone`, learns its median during `prep()`, and `bake(new_data = NULL)` returns the processed training data with the gaps filled.

</details>

## Related recipes steps

**These steps pair naturally with median imputation in a preprocessing pipeline.**

- `step_impute_mean()`: mean fill, best for symmetric numeric columns.
- `step_impute_mode()`: most-frequent-value fill for categorical columns.
- `step_impute_knn()`: imputes from k nearest neighbours.
- `step_impute_linear()`: imputes from a linear model of other predictors.
- `step_normalize()`: centre and scale numeric columns after imputing.

## FAQ

**What is the difference between step_impute_median() and step_medianimpute()?**

They do the same thing. `step_medianimpute()` was the original name and was deprecated in recipes 0.1.16 in favour of `step_impute_median()`. The new spelling groups every imputation step under a shared `step_impute_*` prefix. Old code still runs but raises a deprecation warning, so update calls to the current name when you can.

**Does step_impute_median() work on factor or character columns?**

No. `step_impute_median()` operates only on numeric columns. If you select a factor or character column, its missing values are left in place with no error or warning. For categorical data use `step_impute_mode()`, which fills with the most frequent level instead.

**When should I use median instead of mean imputation?**

Use median imputation when a column is skewed or contains outliers, because the median is the middle value and cannot be pulled toward extreme readings. Counts, prices, incomes, and durations are usually skewed, so the median is a sensible default. Switch to `step_impute_mean()` only when a column is roughly symmetric.

**Does step_impute_median() cause data leakage?**

Not when used correctly. The median is computed only during `prep()`, which you run on the training set. When you `bake()` validation or test data, recipes reuses the stored training median. Leakage happens only if you prep the recipe on the full dataset before splitting, so always split your data first.
