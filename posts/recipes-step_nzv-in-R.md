---
title: "recipes step_nzv() in R: Drop Near-Zero-Variance Predictors"
slug: recipes-step_nzv-in-R
description: "The recipes step_nzv() function in R removes near-zero-variance predictors using freq_cut and unique_cut thresholds. Runnable prep and bake examples included."
keywords: "recipes step_nzv, step_nzv function R, recipes step_nzv example, near-zero variance R, remove near-zero variance predictors R, step_nzv tidymodels, nearZeroVar recipes"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_nzv()|recipes step_nzv|recipes::step_nzv()|near-zero-variance predictors|step_nzv"
auto_link_case_sensitive: true
target_keyword: "recipes step_nzv"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_nzv() in R: Drop Near-Zero-Variance Predictors

<p class="lead">The recipes <code>step_nzv()</code> function in R removes near-zero-variance predictors, columns that are overwhelmingly one value but not perfectly constant, before they can destabilize a model.</p>

[QUICK ANSWER]
step_nzv(rec, all_predictors())                  # screen every predictor
step_nzv(rec, all_numeric_predictors())          # numeric predictors only
step_nzv(rec, x, y)                              # named columns only
step_nzv(rec, all_predictors(), freq_cut = 5)    # stricter frequency rule
step_nzv(rec, all_predictors(), unique_cut = 20) # stricter uniqueness rule
prep(rec); bake(rec, new_data = NULL)            # train, then apply
tidy(prep(rec), number = 1)                      # list removed columns

[DECISION TREE: Is step_nzv() the right tool?]
- column nearly constant, not exactly: step_nzv(rec, all_predictors())
- column has exactly one value: step_zv(rec, all_predictors())
- predictors strongly correlated: step_corr(rec, all_numeric_predictors())
- columns are exact linear combos: step_lincomb(rec, all_numeric_predictors())
- drop a named column outright: step_rm(rec, bad_col)
- compress many predictors into few: step_pca(rec, all_numeric_predictors())

## What step_nzv() does

**step_nzv() deletes columns that carry almost no information because one value dominates them.** A column where 996 of 1,000 rows read `"no"` technically has variance, so `step_zv()` leaves it alone. Yet that column is nearly useless to a model and can break a cross-validation fold the moment the rare value disappears from a resample.

`step_nzv()` screens the columns you select while the recipe is prepared. During `prep()` it measures two quantities for each column and flags a column as near-zero variance only when both criteria are met. `bake()` then drops every flagged column from training data and new data alike.

[KEY INSIGHT]
**A column is flagged only when both thresholds fire, not either one.** The frequency ratio (most common value over second most common) must exceed `freq_cut`, and the percentage of distinct values must fall below `unique_cut`. A column that trips just one test survives.

## step_nzv() syntax and arguments

**step_nzv() is a selection step controlled by two numeric thresholds.** You name columns directly or use tidyselect helpers such as `all_predictors()` or `all_numeric_predictors()`, then optionally tune how aggressive the filter is.

```r title="step_nzv signature and arguments"
step_nzv(
  recipe,
  ...,                  # columns to screen
  role = NA,
  trained = FALSE,
  freq_cut = 95 / 5,    # frequency-ratio cutoff (default 19)
  unique_cut = 10,      # percent-unique cutoff (default 10)
  options = list(freq_cut = 95 / 5, unique_cut = 10),
  removals = NULL,
  skip = FALSE,
  id = rand_id("nzv")
)
```

The `removals` slot is filled automatically at `prep()` time with the names of the flagged columns. `freq_cut` defaults to `95/5`, so a column is suspicious when its top value is at least 19 times more common than its runner-up. `unique_cut` defaults to `10`, meaning the column must also have fewer than 10 percent distinct values. The full reference lives in the [recipes documentation](https://recipes.tidymodels.org/reference/step_nzv.html).

## step_nzv() examples

**The pattern is always prep then bake.** `prep()` measures each column and decides what to remove; `bake()` applies that decision. The examples below build a 200-row frame where one predictor is heavily skewed.

```r title="Drop a near-zero-variance column"
library(recipes)

set.seed(1)
train <- data.frame(
  age    = sample(20:60, 200, replace = TRUE),
  rare   = c(rep("no", 196), rep("yes", 4)),
  income = rnorm(200, 50, 10)
)

nzv_rec <- recipe(income ~ ., data = train) |>
  step_nzv(all_predictors()) |>
  prep()

names(bake(nzv_rec, new_data = NULL))
#> [1] "age"    "income"
```

The `rare` column is 196 `"no"` against 4 `"yes"`, a frequency ratio of 49 and only 1 percent distinct values, so both thresholds fire and the column is dropped. `age` spreads across many values and survives. To confirm exactly what was removed, call `tidy()` on the prepared recipe.

```r title="See which columns step_nzv removed"
tidy(nzv_rec, number = 1)
#> # A tibble: 1 x 2
#>   terms id
#>   <chr> <chr>
#> 1 rare  nzv_a1B2c
```

The `terms` column lists every flagged predictor; an empty tibble means nothing tripped both thresholds. The `freq_cut` argument controls how skewed a column must be before it counts.

```r title="Tighten freq_cut to catch a milder skew"
train2 <- data.frame(
  mostly = c(rep("a", 180), rep("b", 20)),
  spread = rnorm(200),
  y      = rnorm(200)
)

# default freq_cut = 19: ratio is only 180/20 = 9, so nothing drops
recipe(y ~ ., data = train2) |>
  step_nzv(all_predictors()) |> prep() |>
  bake(new_data = NULL) |> ncol()
#> [1] 3

# freq_cut = 4: now 9 > 4, so mostly is removed
recipe(y ~ ., data = train2) |>
  step_nzv(all_predictors(), freq_cut = 4) |> prep() |>
  bake(new_data = NULL) |> ncol()
#> [1] 2
```

At the default cutoff the `mostly` column survives because its 9-to-1 split is not extreme enough. Lowering `freq_cut` to 4 makes the filter stricter and the column is dropped. `step_nzv()` is also valuable right after `step_dummy()`, where rare factor levels produce skewed indicator columns.

```r title="step_nzv after step_dummy"
set.seed(2)
train3 <- data.frame(
  plan  = factor(c(rep("basic", 195), rep("pro", 5))),
  usage = rnorm(200, 100, 20),
  churn = rnorm(200)
)

dummy_rec <- recipe(churn ~ ., data = train3) |>
  step_dummy(plan) |>
  step_nzv(all_predictors()) |>
  prep()

names(bake(dummy_rec, new_data = NULL))
#> [1] "usage" "churn"
```

`step_dummy()` turns `plan` into `plan_pro`, a column of 195 zeros and 5 ones. That column has variance, so `step_zv()` would keep it, but `step_nzv()` recognizes the 39-to-1 skew and removes it before it reaches the model.

[NOTE]
**Coming from Python scikit-learn?** There is no exact one-line equivalent. `VarianceThreshold` removes only strictly low-variance features; the closest match to step_nzv() is a custom filter on value-frequency ratios, which caret originally provided through `nearZeroVar()`.

## step_nzv() vs step_zv()

**Both steps remove uninformative columns, but they apply different tests.** Picking the wrong one either keeps near-dead columns or, worse, deletes useful predictors.

| Step | Removes | Decided from |
|------|---------|--------------|
| `step_zv()` | Columns with exactly one unique value | Count of distinct values |
| `step_nzv()` | Columns that are nearly constant | `freq_cut` ratio and `unique_cut` percentage |
| `step_corr()` | Columns highly correlated with another | Pairwise correlation matrix |

Use `step_zv()` as a cheap, guaranteed-safe filter for strictly constant columns. Reach for `step_nzv()` when a column is overwhelmingly one value but not perfectly constant, such as a rare-event flag. Many pipelines run `step_zv()` first, then `step_nzv()` for the borderline cases.

[TIP]
**Place step_nzv() after encoding and imputation, not before.** Dummy columns and imputed columns change value frequencies, so screening too early misses the skewed columns those steps create.

## Common pitfalls

**Three mistakes account for most step_nzv() confusion.**

1. **Expecting it to fire on small datasets.** With only 5 rows, even 1 distinct value is 20 percent unique, above the default `unique_cut` of 10. The filter rarely triggers until you have a few hundred rows or you raise `unique_cut`.
2. **Assuming one threshold is enough.** A column needs both a high frequency ratio and a low unique percentage. A skewed numeric column with many distinct values passes the `unique_cut` test and survives.
3. **Treating the removal list as fixed.** Near-zero variance is judged from the data given to `prep()`. Under resampling, a column flagged in one fold may be kept in another.

[WARNING]
**step_nzv() silently changes the column count.** A baked frame can have fewer columns than the input with no message. If downstream code expects columns by position, call `tidy()` to confirm what was dropped.

## Try it yourself

**Try it:** Build a recipe on the frame below, add `step_nzv()` to all predictors, and bake the training data. The `signup` column is 198 `"free"` against 2 `"paid"` and should disappear. Save the result to `ex_baked`.

```r title="Your turn: step_nzv on all predictors"
set.seed(7)
ex_train <- data.frame(
  signup = c(rep("free", 198), rep("paid", 2)),
  visits = sample(1:50, 200, replace = TRUE),
  spend  = rnorm(200, 30, 8)
)
# Try it: prep a recipe with step_nzv(all_predictors()), then bake
ex_baked <- # your code here

names(ex_baked)
#> Expected: signup removed, visits and spend remain
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(spend ~ ., data = ex_train) |>
  step_nzv(all_predictors()) |>
  prep()

ex_baked <- bake(ex_rec, new_data = NULL)
names(ex_baked)
#> [1] "visits" "spend"
```

**Explanation:** `signup` has a 99-to-1 frequency ratio and 1 percent distinct values, so both thresholds fire during `prep()` and `bake()` drops it. `visits` spreads across many values and stays.

</details>

## Related recipes functions

**step_nzv() is one filter in a larger column-cleaning toolkit.** These steps often appear together in the same recipe:

- `step_zv()` removes strictly constant columns with exactly one unique value.
- `step_corr()` drops predictors highly correlated with another column.
- `step_lincomb()` removes columns that form exact linear combinations of others.
- `step_rm()` deletes specific columns you name by hand.
- `step_dummy()` converts factors into indicator columns, often paired before `step_nzv()`.

## FAQ

**What does step_nzv() do in R?**

`step_nzv()` is a recipes step that removes near-zero-variance predictors, columns that are overwhelmingly one value but not perfectly constant. During `prep()` it measures each selected column's frequency ratio and percentage of unique values. A column is flagged only when the frequency ratio exceeds `freq_cut` and the unique percentage falls below `unique_cut`. `bake()` then drops the flagged columns from training and new data alike.

**What is the difference between step_zv() and step_nzv()?**

`step_zv()` removes only strictly constant columns, those with exactly one unique value. `step_nzv()` is more aggressive: it removes columns that are almost constant, judged by a frequency ratio and a unique-value percentage. A column with 999 identical entries and one different entry survives `step_zv()` but is caught by `step_nzv()`. Use `step_zv()` for truly dead columns and `step_nzv()` for skewed ones.

**What do freq_cut and unique_cut mean?**

`freq_cut` is the ratio of the most common value's frequency to the second most common value's frequency; the default `95/5` equals 19. `unique_cut` is the percentage of distinct values out of all rows, defaulting to 10. A column is flagged as near-zero variance only when its frequency ratio is above `freq_cut` and its unique percentage is below `unique_cut`. Lower `freq_cut` or raise `unique_cut` to make the filter stricter.

**Why did step_nzv() not remove any columns?**

The most common reason is a small dataset. With few rows, the percentage of distinct values stays above the default `unique_cut` of 10, so the second criterion never passes. Either test more data or raise `unique_cut`. The other reason is that a column trips only one threshold; both the frequency ratio and the unique percentage must qualify before a column is removed.
</content>
</invoke>
