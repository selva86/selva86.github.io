---
title: "recipes step_novel() in R: Handle Unseen Factor Levels"
slug: recipes-step_novel-in-R
description: "Learn how the recipes step_novel() function in R assigns a placeholder level to unseen factor categories, with runnable prep, bake, and step_dummy examples."
keywords: "recipes step_novel, step_novel function R, recipes step_novel example, R handle novel factor levels, step_novel tidymodels, unseen factor levels R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "step_novel()|recipes step_novel|recipes::step_novel()|novel factor levels|step_novel"
auto_link_case_sensitive: true
target_keyword: "recipes step_novel"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_novel() in R: Handle Unseen Factor Levels

<p class="lead">The recipes <code>step_novel()</code> function adds a reserved placeholder level to a factor column so categories never seen during training do not break predictions on new data.</p>

[QUICK ANSWER]
step_novel(rec, var)                            # add a "new" placeholder level
step_novel(rec, var, new_level = "unseen")      # custom placeholder name
step_novel(rec, all_nominal_predictors())       # apply to every factor column
recipe(...) |> step_novel(x) |> step_dummy(x)   # use before dummy encoding
prep(rec); bake(rec, new_data = test)           # train, then apply to new data

[DECISION TREE: Is step_novel() the right tool?]
- factor level unseen in training: step_novel(rec, x)
- factor value is missing (NA): step_unknown(rec, x)
- rare training levels to collapse: step_other(rec, x)
- convert factor to 0/1 columns: step_dummy(rec, x)
- drop a constant factor column: step_zv(rec, x)
- character column needs a factor first: step_string2factor(rec, x)

## What step_novel() does

**step_novel() reserves a new factor level for categories that appear only at prediction time.** When you train a model on data where a factor column has the levels `Chicago`, `LA`, and `NYC`, the model has no representation for a row that later arrives with `Boston`. That mismatch produces missing values or an outright error during scoring.

`step_novel()` solves this by adding one extra level (named `"new"` by default) to the factor while the recipe is being prepared. Any value in fresh data that was not present in the training set is mapped to that reserved level instead of becoming `NA`. The model then treats every unseen category as a single known group.

[KEY INSIGHT]
**A model can only score levels it saw during training.** step_novel() pre-registers a catch-all level so the recipe stays valid no matter what categories the production data contains.

## step_novel() syntax and arguments

**The function takes a recipe, one or more columns, and an optional name for the placeholder.** It is a selection step, so you can name columns directly or use tidyselect helpers like `all_nominal_predictors()`.

```r title="step_novel signature and arguments"
step_novel(
  recipe,
  ...,                  # columns: factor variables to process
  role = NA,
  trained = FALSE,
  new_level = "new",    # name of the reserved placeholder level
  objects = NULL,
  skip = FALSE,
  id = rand_id("novel")
)
```

The argument you will change most often is `new_level`. It must be a string that does **not** already exist among the column's training levels, otherwise `prep()` raises an error. Everything else can stay at its default for typical workflows. The full reference lives in the [recipes documentation](https://recipes.tidymodels.org/reference/step_novel.html).

## step_novel() examples

**The pattern is always prep then bake.** `prep()` learns the training levels; `bake()` applies the mapping to any new data frame. The examples below build a small housing-price dataset and process it step by step.

```r title="Basic step_novel on unseen levels"
library(recipes)

train <- data.frame(
  city  = factor(c("NYC", "LA", "NYC", "Chicago", "LA")),
  price = c(420, 510, 395, 280, 530)
)

novel_rec <- recipe(price ~ city, data = train) |>
  step_novel(city) |>
  prep()

new_data <- data.frame(city = factor(c("NYC", "Boston", "Denver")))
bake(novel_rec, new_data = new_data)
#> # A tibble: 3 x 1
#>   city
#>   <fct>
#> 1 NYC
#> 2 new
#> 3 new
```

`Boston` and `Denver` were absent from training, so both collapse into the `new` level while `NYC` passes through unchanged. Without `step_novel()`, those two rows would be `NA`.

You can rename the placeholder when `"new"` could clash with a real category or when you want a clearer label in reports.

```r title="Custom placeholder name"
custom_rec <- recipe(price ~ city, data = train) |>
  step_novel(city, new_level = "unseen_city") |>
  prep()

bake(custom_rec, new_data = new_data)
#> # A tibble: 3 x 1
#>   city
#>   <fct>
#> 1 NYC
#> 2 unseen_city
#> 3 unseen_city
```

The most common production use is pairing `step_novel()` with `step_dummy()`. The novel step must run first so the dummy encoder has a column to represent unseen categories.

```r title="step_novel before step_dummy"
dummy_rec <- recipe(price ~ city, data = train) |>
  step_novel(city) |>
  step_dummy(city) |>
  prep()

bake(dummy_rec, new_data = new_data)
#> # A tibble: 3 x 3
#>   city_LA city_NYC city_new
#>     <dbl>    <dbl>    <dbl>
#> 1       0        1        0
#> 2       0        0        1
#> 3       0        0        1
```

The `city_new` indicator carries every unseen city. A model fit on these columns can score the `Boston` and `Denver` rows without complaint.

To guard several factor columns at once, swap the bare column name for a tidyselect helper.

```r title="Apply step_novel to all factor predictors"
multi <- data.frame(
  city  = factor(c("NYC", "LA", "Chicago")),
  size  = factor(c("S", "M", "L")),
  price = c(420, 510, 280)
)

multi_rec <- recipe(price ~ ., data = multi) |>
  step_novel(all_nominal_predictors()) |>
  prep()

multi_new <- data.frame(
  city = factor("Boston"),
  size = factor("XL")
)
bake(multi_rec, new_data = multi_new)
#> # A tibble: 1 x 2
#>   city  size
#>   <fct> <fct>
#> 1 new   new
```

[NOTE]
**Coming from Python scikit-learn?** The equivalent is `OneHotEncoder(handle_unknown="ignore")`, which silently zeroes unseen categories. step_novel() differs by giving them an explicit, modelable level instead of dropping them.

## step_novel() vs step_unknown() vs step_other()

**Three recipes steps touch factor levels, but each fixes a different problem.** Picking the wrong one either misses the case you care about or distorts data you wanted to keep.

| Step | Problem it solves | When the level is decided |
|------|-------------------|---------------------------|
| `step_novel()` | Category unseen during training appears later | At `bake()` time, on new data |
| `step_unknown()` | Factor value is missing (`NA`) | At `bake()` time, on any data |
| `step_other()` | Infrequent training levels inflate the model | At `prep()` time, from training counts |

Use `step_novel()` for the future-proofing case: production data will contain categories your training sample never had. Use `step_unknown()` when missing factor values need an explicit bucket. Use `step_other()` to collapse rare-but-known levels before they add noise. Many pipelines chain all three.

## Common pitfalls

**Three mistakes account for most step_novel() bugs.**

1. **Placing it after `step_dummy()`.** The dummy step encodes whatever levels exist when it runs. If `step_novel()` runs later, the `new` column never gets created and unseen rows still break. Always put `step_novel()` first.
2. **Reusing an existing level name.** Passing `new_level = "NYC"` when `NYC` is already a training level makes `prep()` fail. Choose a label that cannot appear in the data.
3. **Expecting it to work on character columns.** `step_novel()` operates on factors. A character column is not selected by `all_nominal_predictors()` the same way; convert it with `step_string2factor()` first.

[WARNING]
**The reserved level is added even when no novel data ever appears.** Baked training output gains an empty `new` level. Code that counts or loops over factor levels downstream will see one extra entry.

## Try it yourself

**Try it:** Build a recipe on the training frame below, add `step_novel()` to the `team` column, and bake a new data frame containing the unseen team `"Hawks"`. Save the result to `ex_baked`.

```r title="Your turn: step_novel on team"
ex_train <- data.frame(
  team  = factor(c("Lions", "Bears", "Lions")),
  score = c(21, 14, 28)
)
# Try it: prep a recipe with step_novel, then bake "Hawks"
ex_baked <- # your code here

ex_baked
#> Expected: Hawks shown as the level "new"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(score ~ team, data = ex_train) |>
  step_novel(team) |>
  prep()

ex_baked <- bake(ex_rec, new_data = data.frame(team = factor("Hawks")))
ex_baked
#> # A tibble: 1 x 1
#>   team
#>   <fct>
#> 1 new
```

**Explanation:** `prep()` records the training levels `Bears` and `Lions` plus the reserved `new` level. Because `Hawks` was never in training, `bake()` maps it to `new`.

</details>

## Related recipes functions

**step_novel() is one piece of a factor-handling toolkit.** These steps commonly appear in the same recipe:

- `step_unknown()` assigns a placeholder to missing factor values.
- `step_other()` collapses infrequent training levels into a single `other` level.
- `step_dummy()` converts factors into 0/1 indicator columns.
- `step_string2factor()` turns character columns into factors so factor steps can select them.
- `step_zv()` drops columns with only one observed value.

## FAQ

**What value does step_novel() assign to unseen levels?**

By default it assigns the string `"new"`. Every category in fresh data that was not present during `prep()` is mapped to this reserved level. You can rename it with the `new_level` argument, for example `step_novel(x, new_level = "unseen")`. The chosen name must not already exist among the column's training levels, or `prep()` will stop with an error.

**Does step_novel() change the training data?**

It adds the reserved level to the factor's level set, but no training row is relabeled because every training value was, by definition, seen during training. Baked training output therefore contains an extra empty level. The actual relabeling only happens when `bake()` meets a category that the recipe never recorded.

**Should step_novel() come before or after step_dummy()?**

Before. `step_dummy()` builds indicator columns from the levels that exist when it runs. If `step_novel()` runs first, the dummy encoder includes a `_new` column that can absorb unseen categories. Reversing the order leaves no place for novel values and reintroduces the missing-data problem you were trying to fix.

**What is the difference between step_novel() and step_other()?**

`step_other()` works on the training data: it pools levels that appear too rarely into an `other` bucket, decided from training frequencies during `prep()`. `step_novel()` works on future data: it reserves a level for categories that training never saw at all. One reduces known noise, the other future-proofs against unknown categories.

**Can step_novel() handle several columns at once?**

Yes. Pass multiple column names separated by commas, or use a tidyselect helper such as `all_nominal_predictors()` to cover every factor predictor in the recipe. Each selected column gets its own reserved level, so a novel value in one column does not affect the others.
