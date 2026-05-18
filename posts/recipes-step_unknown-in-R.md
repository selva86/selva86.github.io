---
title: "recipes step_unknown() in R: Label Missing Factor Values"
slug: recipes-step_unknown-in-R
description: "Learn how the recipes step_unknown() function in R relabels missing (NA) factor values as an explicit level, with runnable prep, bake, and step_dummy examples."
keywords: "recipes step_unknown, step_unknown function R, recipes step_unknown example, R missing factor levels, step_unknown tidymodels, handle NA factor R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "step_unknown()|recipes step_unknown|recipes::step_unknown()|missing factor levels|step_unknown"
auto_link_case_sensitive: true
target_keyword: "recipes step_unknown"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_unknown() in R: Label Missing Factor Values

<p class="lead">The recipes <code>step_unknown()</code> function in R replaces missing (<code>NA</code>) values in a factor column with an explicit level, so models can use incomplete categorical data instead of dropping rows.</p>

[QUICK ANSWER]
step_unknown(rec, var)                           # NA becomes the level "unknown"
step_unknown(rec, var, new_level = "missing")    # custom placeholder name
step_unknown(rec, all_nominal_predictors())      # apply to every factor column
recipe(...) |> step_unknown(x) |> step_dummy(x)  # run before dummy encoding
prep(rec); bake(rec, new_data = NULL)            # train, then return baked data
recipe(...) |> step_unknown(x) |> step_novel(x)  # cover NA and unseen levels

[DECISION TREE: Is step_unknown() the right tool?]
- factor value is missing (NA): step_unknown(rec, x)
- factor level unseen in training: step_novel(rec, x)
- fill NA with most common level: step_impute_mode(rec, x)
- rare training levels to collapse: step_other(rec, x)
- convert factor to 0/1 columns: step_dummy(rec, x)
- numeric column has NA values: step_impute_mean(rec, x)

## What step_unknown() does

**step_unknown() turns missing factor values into a category the model can use.** A categorical predictor with `NA` entries is a problem for most algorithms: they either discard the affected rows or stop with an error. `step_unknown()` removes that obstacle by relabeling every `NA` in a factor column as a known level, named `"unknown"` by default.

The step runs inside a recipes pipeline. When you call `prep()`, it records which columns to treat; when you call `bake()`, it applies the relabeling to whatever data frame you pass. Because the missing value becomes a real factor level, downstream steps like `step_dummy()` give it its own indicator column.

[KEY INSIGHT]
**Missingness in a categorical field is often informative.** A blank `region` or an unrecorded `grade` can correlate with the outcome. step_unknown() keeps that signal in the model instead of throwing the row away.

## step_unknown() syntax and arguments

**The function takes a recipe, one or more columns, and an optional label for the missing level.** It is a selection step, so you can name factor columns directly or reach them with tidyselect helpers such as `all_nominal_predictors()`.

```r title="step_unknown signature and arguments"
step_unknown(
  recipe,
  ...,                    # columns: factor variables to process
  role = NA,
  trained = FALSE,
  new_level = "unknown",  # label assigned to missing values
  objects = NULL,
  skip = FALSE,
  id = rand_id("unknown")
)
```

The argument you change most often is `new_level`. It must be a string that is not already one of the column's levels, or `prep()` raises an error. The remaining arguments stay at their defaults for almost every workflow. Full details are in the [recipes documentation](https://recipes.tidymodels.org/reference/step_unknown.html).

## step_unknown() examples

**Every recipe follows the same prep-then-bake rhythm.** `prep()` learns the structure from training data; `bake()` produces the processed frame. The examples below build a small grades dataset that contains missing values.

```r title="Basic step_unknown on missing values"
library(recipes)

train <- data.frame(
  grade = factor(c("A", "B", NA, "A", NA)),
  score = c(88, 72, 65, 91, 70)
)

unknown_rec <- recipe(score ~ grade, data = train) |>
  step_unknown(grade) |>
  prep()

bake(unknown_rec, new_data = NULL)
#> # A tibble: 5 x 2
#>   grade   score
#>   <fct>   <dbl>
#> 1 A          88
#> 2 B          72
#> 3 unknown    65
#> 4 A          91
#> 5 unknown    70
```

The two `NA` grades became the level `unknown`. The `score` column is untouched because `step_unknown()` ignores numeric variables.

You can rename the placeholder when `"unknown"` is unclear or could clash with a real category.

```r title="Custom label for missing values"
custom_rec <- recipe(score ~ grade, data = train) |>
  step_unknown(grade, new_level = "missing") |>
  prep()

bake(custom_rec, new_data = NULL)
#> # A tibble: 5 x 2
#>   grade   score
#>   <fct>   <dbl>
#> 1 A          88
#> 2 B          72
#> 3 missing    65
#> 4 A          91
#> 5 missing    70
```

The label `missing` now marks the same rows. A descriptive name helps when the baked data appears in reports or plots.

To guard several factor columns in one call, swap the bare column name for a tidyselect helper.

```r title="Apply step_unknown to all factor predictors"
multi <- data.frame(
  grade  = factor(c("A", "B", NA)),
  region = factor(c("East", NA, "West")),
  score  = c(88, 72, 65)
)

multi_rec <- recipe(score ~ ., data = multi) |>
  step_unknown(all_nominal_predictors()) |>
  prep()

bake(multi_rec, new_data = NULL)
#> # A tibble: 3 x 3
#>   grade   region  score
#>   <fct>   <fct>   <dbl>
#> 1 A       East       88
#> 2 B       unknown    72
#> 3 unknown West       65
```

Both `grade` and `region` had their `NA` entries relabeled, while `score` passed through unchanged.

The most common production pairing is `step_unknown()` followed by `step_dummy()`. The unknown step must run first so the dummy encoder sees a complete set of levels.

```r title="step_unknown before step_dummy"
dummy_rec <- recipe(score ~ grade, data = train) |>
  step_unknown(grade) |>
  step_dummy(grade) |>
  prep()

bake(dummy_rec, new_data = NULL)
#> # A tibble: 5 x 3
#>   grade_B grade_unknown score
#>     <dbl>         <dbl> <dbl>
#> 1       0             0    88
#> 2       1             0    72
#> 3       0             1    65
#> 4       0             0    91
#> 5       0             1    70
```

The `grade_unknown` column now carries every row that was missing a grade. A model fit on these indicators treats missingness as its own predictor.

[NOTE]
**Coming from Python pandas?** The closest equivalent is `df["col"].fillna("unknown")` or scikit-learn's `SimpleImputer(strategy="constant", fill_value="unknown")`. step_unknown() differs by recording the rule during `prep()` so new data is treated identically.

## step_unknown() vs step_novel() vs step_impute_mode()

**Three recipes steps touch factor problems, but they fix different things.** Choosing the wrong one either misses your case or alters data you meant to keep.

| Step | Problem it solves | What it does to the value |
|------|-------------------|---------------------------|
| `step_unknown()` | Factor value is missing (`NA`) | Relabels `NA` as an explicit `unknown` level |
| `step_novel()` | Category appears only at prediction time | Reserves a level for unseen categories |
| `step_impute_mode()` | Factor value is missing (`NA`) | Fills `NA` with the most frequent training level |

Use `step_unknown()` when `NA` values need an explicit, modelable bucket. Use `step_novel()` when production data may contain categories training never saw. Use `step_impute_mode()` when you would rather fill `NA` with a best guess than flag it. Pipelines often chain `step_unknown()` and `step_novel()` to cover both missing and unseen values.

## Common pitfalls

**Three mistakes cause most step_unknown() bugs.**

1. **Placing it after `step_dummy()`.** The dummy step encodes whatever levels exist when it runs. If `step_unknown()` runs later, the `NA` rows are already encoded as all-zero or dropped. Put `step_unknown()` first.
2. **Expecting it to work on character columns.** The step processes factors. A plain character column is not selected the same way; convert it with `step_string2factor()` first.
3. **Confusing it with imputation.** `step_unknown()` does not guess a plausible value. It marks the row as missing. If you want the gap filled with a real level, use `step_impute_mode()` instead.

[WARNING]
**step_unknown() leaves numeric `NA` values alone.** It selects only nominal columns. A numeric predictor with missing values still needs a step such as `step_impute_mean()`, or those rows will break model fitting.

## Try it yourself

**Try it:** Build a recipe on the training frame below, add `step_unknown()` to the `team` column, and bake the training data so the missing team becomes the level `"unknown"`. Save the result to `ex_baked`.

```r title="Your turn: step_unknown on team"
ex_train <- data.frame(
  team  = factor(c("Lions", "Bears", NA)),
  score = c(21, 14, 28)
)
# Try it: prep a recipe with step_unknown on team, then bake
ex_baked <- # your code here

ex_baked
#> Expected: the NA team shown as the level "unknown"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(score ~ team, data = ex_train) |>
  step_unknown(team) |>
  prep()

ex_baked <- bake(ex_rec, new_data = NULL)
ex_baked
#> # A tibble: 3 x 2
#>   team    score
#>   <fct>   <dbl>
#> 1 Lions      21
#> 2 Bears      14
#> 3 unknown    28
```

**Explanation:** `prep()` records `team` as a factor with the missing value flagged. `bake()` with `new_data = NULL` returns the processed training data, where the `NA` team is now the level `unknown`.

</details>

## Related recipes functions

**step_unknown() is one step in a factor-handling toolkit.** These steps often appear together in the same recipe:

- `step_novel()` reserves a level for categories unseen during training.
- `step_other()` collapses infrequent training levels into a single `other` level.
- `step_impute_mode()` fills missing factor values with the most common level.
- `step_dummy()` converts factors into 0/1 indicator columns.
- `step_string2factor()` turns character columns into factors so factor steps can select them.

## FAQ

**What value does step_unknown() assign to missing data?**

By default it assigns the string `"unknown"`. Every `NA` in a selected factor column is relabeled to this level when `bake()` runs. You can change the label with the `new_level` argument, for example `step_unknown(grade, new_level = "missing")`. The name you choose must not already exist among the column's levels, otherwise `prep()` stops with an error. The relabeled value is a normal factor level, so later steps treat it like any other category.

**What is the difference between step_unknown() and step_impute_mode()?**

Both handle `NA` in factor columns, but they make opposite assumptions. `step_unknown()` keeps missingness visible: it creates a separate `"unknown"` level so the model can learn whether a missing value predicts the outcome. `step_impute_mode()` hides missingness: it replaces each `NA` with the most frequent training level, as if the value had been observed. Choose `step_unknown()` when the gap might carry signal, and `step_impute_mode()` when you want a best-guess fill.

**Does step_unknown() work on character columns?**

No. `step_unknown()` operates on factor (nominal) variables. A plain character column is not a factor, so tidyselect helpers like `all_nominal_predictors()` may not pick it up, and the step has no level set to extend. Convert character columns first with `step_string2factor()`, then apply `step_unknown()`. Once the column is a factor, the step relabels its `NA` entries normally. Numeric columns are always skipped.

**Should step_unknown() run before or after step_dummy()?**

Before. `step_dummy()` builds indicator columns from the factor levels that exist when it runs. If `step_unknown()` runs first, the `"unknown"` level becomes one of those columns, so missing rows get their own indicator. Reversing the order means the `NA` rows are encoded before they are labeled, which usually produces all-zero indicator rows or an error. The reliable pattern is `step_unknown()` then `step_dummy()`.
