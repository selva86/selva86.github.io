---
title: "recipes step_zv() in R: Remove Zero-Variance Predictors"
slug: recipes-step_zv-in-R
description: "Learn how the recipes step_zv() function in R removes zero-variance predictors, constant columns with a single value, with runnable prep and bake examples."
keywords: "recipes step_zv, step_zv function R, recipes step_zv example, R remove zero variance predictors, step_zv tidymodels, zero variance filter R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_zv()|recipes step_zv|recipes::step_zv()|zero-variance predictors|step_zv"
auto_link_case_sensitive: true
target_keyword: "recipes step_zv"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_zv() in R: Remove Zero-Variance Predictors

<p class="lead">The recipes <code>step_zv()</code> function in R removes zero-variance predictors, columns that contain only a single unique value, so they cannot destabilize a model or a downstream preprocessing step.</p>

[QUICK ANSWER]
step_zv(rec, all_predictors())            # drop every constant column
step_zv(rec, x, y)                        # screen named columns only
step_zv(rec, all_numeric_predictors())    # numeric predictors only
step_dummy(x) |> step_zv(all_predictors()) # after dummy encoding
prep(rec); bake(rec, new_data = NULL)     # train, then apply
tidy(prep(rec), number = 1)               # list removed columns

[DECISION TREE: Is step_zv() the right tool?]
- column has one unique value: step_zv(rec, all_predictors())
- column nearly constant, not exactly: step_nzv(rec, all_predictors())
- predictors strongly correlated: step_corr(rec, all_numeric_predictors())
- columns are exact linear combos: step_lincomb(rec, all_numeric_predictors())
- drop a specific column by name: step_rm(rec, bad_col)
- compress many predictors: step_pca(rec, all_numeric_predictors())

## What step_zv() does

**step_zv() deletes any column that has zero variance, meaning every row holds the same value.** A constant column carries no information a model can learn from. Worse, it can trigger errors: many fitting routines fail when a predictor has no spread, and operations like scaling divide by a standard deviation of zero.

`step_zv()` screens the columns you select while the recipe is prepared. During `prep()` it counts the distinct values in each selected column. Any column with exactly one distinct value is marked for removal, and `bake()` then drops it from every data frame the recipe touches, training and new data alike.

[KEY INSIGHT]
**A zero-variance column is decided from the data passed to prep(), not declared in advance.** step_zv() learns the removal list once during preparation, then applies that same list consistently to every new dataset.

## step_zv() syntax and arguments

**step_zv() takes a recipe and a column selection, and almost never needs anything else.** It is a selection step, so you can name columns directly or use tidyselect helpers such as `all_predictors()` or `all_numeric_predictors()`.

```r title="step_zv signature and arguments"
step_zv(
  recipe,
  ...,                  # columns to screen for zero variance
  role = NA,
  trained = FALSE,
  group = NULL,         # optional: judge variance within groups
  removals = NULL,
  skip = FALSE,
  id = rand_id("zv")
)
```

Most workflows pass only the recipe and a selector. The `removals` slot is filled automatically at `prep()` time with the names of the constant columns. The `group` argument is for the rare case where a column should be considered constant only within levels of another variable. The full reference lives in the [recipes documentation](https://recipes.tidymodels.org/reference/step_zv.html).

## step_zv() examples

**The pattern is always prep then bake.** `prep()` finds the constant columns; `bake()` removes them. The examples below start from a small dataset where one predictor never changes.

```r title="Drop a constant column"
library(recipes)

train <- data.frame(
  age    = c(34, 41, 29, 52, 38),
  region = c("east", "east", "east", "east", "east"),
  income = c(48, 61, 39, 72, 55)
)

zv_rec <- recipe(income ~ ., data = train) |>
  step_zv(all_predictors()) |>
  prep()

bake(zv_rec, new_data = NULL)
#> # A tibble: 5 x 2
#>     age income
#>   <dbl>  <dbl>
#> 1    34     48
#> 2    41     61
#> 3    29     39
#> 4    52     72
#> 5    38     55
```

The `region` column held `"east"` in every row, so `step_zv()` dropped it. Only `age` and `income` survive. To confirm exactly which columns were removed, call `tidy()` on the prepared recipe and pass the step number.

```r title="See which columns step_zv removed"
tidy(zv_rec, number = 1)
#> # A tibble: 1 x 2
#>   terms  id
#>   <chr>  <chr>
#> 1 region zv_AbC12
```

The `terms` column lists every removed predictor. An empty tibble means no column was constant. This is the quickest audit when a recipe silently changes the number of columns it returns.

`step_zv()` is most valuable right after `step_dummy()`. Dummy encoding can create indicator columns that are all zeros when a factor level never appears in the data, and those columns have zero variance.

```r title="step_zv after step_dummy"
train2 <- data.frame(
  grade = factor(c("A", "A", "A", "A", "A"), levels = c("A", "B")),
  hours = c(3, 5, 2, 6, 4),
  score = c(70, 85, 60, 90, 78)
)

dummy_rec <- recipe(score ~ ., data = train2) |>
  step_dummy(grade) |>
  step_zv(all_predictors()) |>
  prep()

bake(dummy_rec, new_data = NULL)
#> # A tibble: 5 x 2
#>   hours score
#>   <dbl> <dbl>
#> 1     3    70
#> 2     5    85
#> 3     2    60
#> 4     6    90
#> 5     4    78
```

The factor `grade` declares level `B`, but no row uses it, so `step_dummy()` produced an all-zero `grade_B` column. `step_zv()` then removed that dead column before it could reach the model. You can also restrict screening to named columns instead of every predictor.

```r title="Screen only named columns"
mixed <- data.frame(
  const_a = rep(1, 5),
  varies  = c(2, 9, 4, 7, 1),
  const_b = rep("z", 5),
  y       = c(10, 22, 13, 19, 8)
)

named_rec <- recipe(y ~ ., data = mixed) |>
  step_zv(const_a, varies) |>
  prep()

bake(named_rec, new_data = NULL)
#> # A tibble: 5 x 3
#>   varies const_b     y
#>    <dbl> <chr>    <dbl>
#> 1      2 z           10
#> 2      9 z           22
#> 3      4 z           13
#> 4      7 z           19
#> 5      1 z            8
```

Only `const_a` and `varies` were screened, so `const_a` was dropped while `const_b` stayed, even though it is also constant. Selection scopes the check; an unselected constant column passes through untouched.

[NOTE]
**Coming from Python scikit-learn?** The equivalent is `VarianceThreshold(threshold=0.0)`, which drops features with zero variance. step_zv() differs by learning the removal list inside the recipe so the same columns are dropped from training and scoring data automatically.

## step_zv() vs step_nzv() vs step_corr()

**Three recipes steps remove unhelpful columns, but each targets a different defect.** Choosing the wrong one either keeps noise you wanted gone or deletes columns you meant to keep.

| Step | Removes | Decided from |
|------|---------|--------------|
| `step_zv()` | Columns with exactly one unique value | Count of distinct values |
| `step_nzv()` | Columns that are nearly constant | Frequency ratio and unique-value percentage |
| `step_corr()` | Columns highly correlated with another predictor | Pairwise correlation matrix |

Use `step_zv()` for strictly constant columns: it is cheap, safe, and rarely surprises you. Reach for `step_nzv()` when a column is overwhelmingly one value but not perfectly constant, such as 999 zeros and a single one. Use `step_corr()` to thin out redundant numeric predictors. Many pipelines run `step_zv()` first as a guaranteed-safe filter, then add the others.

## Common pitfalls

**Three mistakes account for most step_zv() confusion.**

1. **Expecting it to catch near-constant columns.** `step_zv()` removes a column only when every value is identical. A column that is 99 percent one value still has variance and survives. Use `step_nzv()` for that case.
2. **Running it before `step_dummy()`.** All-zero dummy columns do not exist until `step_dummy()` runs. Place `step_zv()` after the dummy step so it can see and remove them.
3. **Assuming the removed set is fixed.** Zero variance is judged from the data given to `prep()`. Under resampling, a column constant in one fold may vary in another, so the removal list can differ across resamples.

[WARNING]
**step_zv() silently changes the column count.** A baked data frame can have fewer columns than the input with no message. If downstream code expects specific columns by position, call `tidy()` to confirm what was dropped.

## Try it yourself

**Try it:** Build a recipe on the training frame below, add `step_zv()` to all predictors, and bake the training data. The `flag` column is constant and should disappear. Save the result to `ex_baked`.

```r title="Your turn: step_zv on all predictors"
ex_train <- data.frame(
  flag  = rep("yes", 4),
  units = c(12, 30, 19, 25),
  sales = c(220, 540, 360, 480)
)
# Try it: prep a recipe with step_zv(all_predictors()), then bake
ex_baked <- # your code here

ex_baked
#> Expected: flag removed, units and sales remain
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(sales ~ ., data = ex_train) |>
  step_zv(all_predictors()) |>
  prep()

ex_baked <- bake(ex_rec, new_data = NULL)
ex_baked
#> # A tibble: 4 x 2
#>   units sales
#>   <dbl> <dbl>
#> 1    12   220
#> 2    30   540
#> 3    19   360
#> 4    25   480
```

**Explanation:** `flag` holds `"yes"` in every row, so `step_zv()` flags it as zero variance during `prep()` and `bake()` drops it. The numeric predictor `units` varies, so it stays.

</details>

## Related recipes functions

**step_zv() is one filter in a larger column-cleaning toolkit.** These steps frequently appear together in the same recipe:

- `step_nzv()` removes near-zero-variance columns that are almost, but not exactly, constant.
- `step_corr()` drops predictors that are highly correlated with another column.
- `step_lincomb()` removes columns that form exact linear combinations of others.
- `step_rm()` deletes specific columns you name by hand.
- `step_dummy()` converts factors into indicator columns, often paired before `step_zv()`.

## FAQ

**What does step_zv() do in R?**

`step_zv()` is a recipes step that removes zero-variance predictors, columns where every observation has the same value. When the recipe is prepared with `prep()`, it counts the distinct values in each selected column and marks any column with a single unique value for removal. `bake()` then drops those columns from training and new data alike. It is a safe, fast filter commonly used to clean a dataset before modeling.

**What is the difference between step_zv() and step_nzv()?**

`step_zv()` removes only strictly constant columns, those with exactly one unique value. `step_nzv()` is more aggressive: it removes near-zero-variance columns that are overwhelmingly one value but not perfectly constant, judged by a frequency ratio and the percentage of unique values. A column with 999 identical entries and one different entry survives `step_zv()` but is caught by `step_nzv()`. Use `step_zv()` when you only want to delete truly dead columns.

**Should step_zv() come before or after step_dummy()?**

After. `step_dummy()` builds indicator columns from a factor, and if a level never appears in the data, the corresponding dummy column is all zeros and therefore zero variance. If `step_zv()` runs first, those dead columns do not exist yet and slip through. Placing `step_zv()` after `step_dummy()` lets it see and remove the all-zero indicators before they reach the model.

**How do I see which columns step_zv() removed?**

Call `tidy()` on the prepared recipe and pass the step number, for example `tidy(prepped_recipe, number = 1)`. It returns a tibble whose `terms` column lists every predictor that was removed for zero variance. An empty tibble means no column was constant. This is the fastest way to audit a recipe when the baked output unexpectedly has fewer columns than the input.
</content>
</invoke>
