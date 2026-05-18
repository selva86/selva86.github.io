---
title: "recipes step_impute_mode() in R: Impute Categorical NAs"
slug: recipes-step_impute_mode-in-R
description: "Learn how recipes step_impute_mode() fills missing categorical values with the most common level in R. Syntax, examples, tidy() output, and common pitfalls."
keywords: "recipes step_impute_mode, step_impute_mode function R, recipes step_impute_mode examples, R mode imputation, tidymodels impute mode, impute categorical missing values R"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Missing-Value-Treatment-With-R.html
auto_link_terms: "step_impute_mode()|recipes step_impute_mode|recipes::step_impute_mode()|mode imputation|step_impute_mode tidymodels"
auto_link_case_sensitive: true
target_keyword: "recipes step_impute_mode"
sibling_block_enabled: true
difficulty: Intermediate
---

# recipes step_impute_mode() in R: Impute Categorical NAs

<p class="lead">recipes step_impute_mode() fills missing categorical values with the most common level of each column, learned from training data during prep() and applied during bake(). It is the standard imputation step for factor and character predictors in tidymodels.</p>

[QUICK ANSWER]
step_impute_mode(rec, x)                          # impute one column
step_impute_mode(rec, x, y)                       # impute several columns
step_impute_mode(rec, all_nominal_predictors())   # all categorical predictors
step_impute_mode(rec, x, ptype = factor())        # lock the output factor type
prep(rec) |> bake(new_data = NULL)                # apply to training data
tidy(prepped, number = 1)                         # see the learned modes

[DECISION TREE: Is step_impute_mode() the right tool?]
- categorical NAs: step_impute_mode(rec, all_nominal_predictors())
- symmetric numeric NAs: step_impute_mean(rec, x)
- skewed numeric NAs: step_impute_median(rec, x)
- neighbour-based fill: step_impute_knn(rec, x)
- treat NA as its own level: step_unknown(rec, x)
- drop rows with NA: step_naomit(rec, all_predictors())

## What step_impute_mode() does

**step_impute_mode() is a recipe step that replaces missing categorical values with the most common level of each column.** It belongs to the [recipes](https://recipes.tidymodels.org/) package, the preprocessing engine of tidymodels. You add it to a recipe object, where it becomes one stage in a reproducible feature-engineering pipeline.

The step works in two phases. When you call `prep()`, it scans the training data and records the most frequent value (the mode) of each selected column. When you call `bake()`, it uses those stored modes to fill `NA` entries in any dataset you pass in. Because the mode is learned once, the same value fills the training, validation, and test sets.

[KEY INSIGHT]
**The mode is the only average a category has.** A factor or character column has no arithmetic mean, so the most frequent level is the natural fill value. step_impute_mode() finds that level once and reuses it, which keeps imputation consistent across every dataset the recipe touches.

## Syntax and arguments

**The signature is short, and most arguments are filled for you.** Here is the call with its defaults:

```r title="step_impute_mode signature"
step_impute_mode(
  recipe,
  ...,
  role = NA,
  trained = FALSE,
  modes = NULL,
  ptype = NULL,
  skip = FALSE,
  id = rand_id("impute_mode")
)
```

The arguments you will actually set:

- `recipe`: the recipe object you are adding the step to.
- `...`: one or more selectors naming the columns to impute, such as `size` or `all_nominal_predictors()`.
- `ptype`: an optional prototype value. Supplying `factor()` forces the imputed column back to a factor so its level set stays stable.
- `skip`: if `TRUE`, the step is skipped when baking new data. Leave it `FALSE` for imputation.

The `modes` argument is populated automatically during `prep()` and you should never set it by hand.

## step_impute_mode() examples

**Start with a small dataset that has gaps in its categorical columns.** Built-in frames like `airquality` only miss numeric values, so a constructed example shows the behaviour clearly.

```r title="Build a dataset with missing categories"
library(recipes)

df <- data.frame(
  size  = factor(c("S", "M", "L", "M", NA, "S", "L", NA, "S", "S")),
  color = c("red", "blue", NA, "blue", "red", "red", NA, "red", "red", "red"),
  price = c(10, 12, 15, 11, 9, 10, 16, 13, 12, 10)
)

colSums(is.na(df))
#>  size color price
#>     2     2     0
```

Both `size` and `color` have two missing values. Now build a recipe that imputes them and inspect the result.

```r title="Build and prep a mode-imputation recipe"
rec <- recipe(price ~ ., data = df) |>
  step_impute_mode(size, color)

prepped <- prep(rec, training = df)
imputed <- bake(prepped, new_data = df)

colSums(is.na(imputed))
#>  size color price
#>     0     0     0
```

Every gap is filled. To see exactly which level was inserted into each column, call `tidy()` on the prepped recipe with the step number.

```r title="Inspect the learned mode values"
tidy(prepped, number = 1)
#> # A tibble: 2 x 3
#>   terms value id
#>   <chr> <chr> <chr>
#> 1 size  S     impute_mode_xQ4m1
#> 2 color red   impute_mode_xQ4m1
```

`S` is the most common size and `red` is the most common color, so those levels fill the gaps. Listing columns by hand does not scale, so use a selector instead.

```r title="Impute every categorical predictor at once"
rec_all <- recipe(price ~ ., data = df) |>
  step_impute_mode(all_nominal_predictors()) |>
  prep()

baked <- bake(rec_all, new_data = NULL)
colSums(is.na(baked))
#>  size color price
#>     0     0     0
```

`all_nominal_predictors()` selects every factor and character predictor and leaves the numeric `price` outcome untouched.

[TIP]
**Prefer all_nominal_predictors() over naming columns.** It future-proofs the recipe: when a new categorical feature appears in your data, it is imputed automatically with no edit to the step.

## step_impute_mode() vs other imputation steps

**Mode imputation handles categories; the rest of the family handles numbers.** The recipes package ships one imputation step per data shape, and choosing the right one matters more than tuning any single step.

| Step | Best for | Column types |
|---|---|---|
| `step_impute_mode()` | Categorical predictors | factor, character |
| `step_impute_mean()` | Symmetric numeric columns | numeric |
| `step_impute_median()` | Skewed numeric columns | numeric |
| `step_impute_knn()` | Neighbour-informed fill | factor, numeric |
| `step_unknown()` | When a missing value is meaningful | factor |

Decision rule: use `step_impute_mode()` for factor and character predictors. Switch to `step_unknown()` when the absence of a value carries signal, since it turns `NA` into an explicit `"unknown"` level instead of guessing.

[NOTE]
**Coming from Python pandas?** The closest equivalent is `df.fillna(df.mode().iloc[0])`. The recipes version adds the prep/bake split, so the training mode is reused on new data automatically.

## Common pitfalls

**The biggest surprise is what happens when two levels are equally common.** When a column has a tie for most frequent value, `step_impute_mode()` resolves it deterministically and picks one level. It never errors and never warns, so you may not notice the choice was arbitrary.

```r title="Pitfall: a tie between two levels"
tie <- data.frame(grp = factor(c("a", "a", "b", "b", NA)))

baked <- recipe(~ ., data = tie) |>
  step_impute_mode(grp) |>
  prep() |>
  bake(new_data = NULL)

baked$grp
#> [1] a a b b a
#> Levels: a b
```

Both `a` and `b` appear twice, and the step fills the gap with `a`. If a tie like this is meaningful, use `step_unknown()` so the missing value becomes its own level instead.

Two more traps to avoid:

- **Mode-imputing numeric columns.** A bare numeric selector lets the step fill with the single most frequent number, which is rarely sensible. Use `all_nominal_predictors()` or switch to `step_impute_mean()` for numeric data.
- **Imputing before splitting.** Build the recipe on the training split only. Computing the mode on the full dataset leaks test information into the model.

[WARNING]
**A column that is entirely NA cannot be imputed.** If every value in a selected column is missing, there is no mode to learn and the step fills nothing. Drop such columns with `step_zv()` or remove them before the recipe runs.

## Try it yourself

**Try it:** Build a recipe on the `df` data frame above that imputes only the `color` column with its mode, then confirm no missing values remain. Save the baked data to `ex_imputed`.

```r title="Your turn: impute color"
# Try it: impute only color
ex_imputed <- # your code here

sum(is.na(ex_imputed$color))
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_imputed <- recipe(price ~ ., data = df) |>
  step_impute_mode(color) |>
  prep() |>
  bake(new_data = NULL)

sum(is.na(ex_imputed$color))
#> [1] 0
```

**Explanation:** The recipe selects only `color`, learns its mode (`red`) during `prep()`, and `bake(new_data = NULL)` returns the processed training data with the gaps filled.

</details>

## Related recipes steps

**These steps pair naturally with mode imputation in a preprocessing pipeline.**

- `step_impute_mean()`: mean fill for symmetric numeric columns.
- `step_impute_median()`: median fill, robust to skew and outliers.
- `step_impute_knn()`: imputes from k nearest neighbours, works on factors too.
- `step_unknown()`: assigns missing factor values to an explicit `"unknown"` level.
- `step_dummy()`: one-hot encodes factors after they have been imputed.

## FAQ

**What is the difference between step_impute_mode() and step_modeimpute()?**

They do the same thing. `step_modeimpute()` was the original name and was deprecated in recipes 0.1.16 in favour of `step_impute_mode()`. The rename grouped every imputation step under a shared `step_impute_*` prefix. Old code still runs but raises a deprecation warning, so update calls to the current spelling when you maintain a project.

**Does step_impute_mode() work on numeric columns?**

Technically yes, but it is rarely useful. On a numeric column it fills gaps with the single most frequent number, which is not a meaningful summary of continuous data. Use `step_impute_mean()` or `step_impute_median()` for numeric columns, and reserve `step_impute_mode()` for factor and character predictors.

**How does step_impute_mode() handle ties?**

When two or more levels share the highest frequency, the step resolves the tie deterministically and fills with one of them. It does not raise a warning, so the choice is silent. If a tie reflects a real ambiguity in your data, prefer `step_unknown()`, which converts the missing value into its own explicit level.

**Does step_impute_mode() cause data leakage?**

Not when used correctly. The mode is computed only during `prep()`, which you run on the training set. When you `bake()` validation or test data, recipes reuses the stored training mode. Leakage happens only if you prep the recipe on the full dataset before splitting, so always split your data first.
</content>
</invoke>
