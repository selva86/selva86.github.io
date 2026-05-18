---
title: "recipes step_lincomb() in R: Remove Linear Combinations"
slug: recipes-step_lincomb-in-R
description: "The recipes step_lincomb() function in R removes predictors that are exact linear combinations of other columns. Runnable prep and bake examples included."
keywords: "recipes step_lincomb, step_lincomb function R, recipes step_lincomb example, remove linear combinations R, step_lincomb tidymodels, findLinearCombos recipes, perfect multicollinearity R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_lincomb()|recipes step_lincomb|recipes::step_lincomb()|linear combinations|step_lincomb"
auto_link_case_sensitive: true
target_keyword: "recipes step_lincomb"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_lincomb() in R: Remove Linear Combinations

<p class="lead">The recipes <code>step_lincomb()</code> function in R removes predictors that are exact linear combinations of other columns, the perfect multicollinearity that destabilizes a linear model before it can fit.</p>

[QUICK ANSWER]
step_lincomb(rec, all_numeric_predictors())                 # screen numeric predictors
step_lincomb(rec, x1, x2, x3)                               # named columns only
step_lincomb(rec, all_numeric_predictors(), max_steps = 10) # allow more removal passes
prep(rec); bake(rec, new_data = NULL)                       # train, then apply
tidy(prep(rec), number = 1)                                 # list removed columns
bake(prepped, new_data = test)                              # apply to fresh data

[DECISION TREE: Is step_lincomb() the right tool?]
- columns are exact linear combinations: step_lincomb(rec, all_numeric_predictors())
- predictors merely correlated in pairs: step_corr(rec, all_numeric_predictors())
- column has exactly one unique value: step_zv(rec, all_predictors())
- column nearly constant, one value dominates: step_nzv(rec, all_predictors())
- compress a correlated set into components: step_pca(rec, all_numeric_predictors())
- drop a named column outright: step_rm(rec, bad_col)

## What step_lincomb() does

**step_lincomb() deletes columns that other columns can reproduce exactly.** When one predictor equals a weighted sum of others, it carries zero new information, and the model's design matrix becomes rank deficient. Linear regression then fails to estimate coefficients, or returns `NA` for the dependent terms. The `recipes step_lincomb` step finds and removes that exact redundancy before any model sees the data.

Like every recipe step, `step_lincomb()` runs in two stages. During `prep()` it inspects the columns you selected, detects every exact linear dependency using a QR decomposition, and records which columns to drop. `bake()` then removes those columns from the training data and from any new data passed through the recipe later. The detection logic is the same one behind caret's `findLinearCombos()`.

[KEY INSIGHT]
**step_lincomb() targets exact redundancy, not approximate.** A column survives even at a correlation of 0.99; it is removed only when a weighted sum of other columns reproduces it to numerical precision. That makes the step rare on raw data and common after feature engineering, where dummy variables and derived ratios often sum to a constant.

## step_lincomb() syntax and arguments

**step_lincomb() is a selection step with almost nothing to configure.** You name columns directly or, more often, use the tidyselect helper `all_numeric_predictors()`, since linear combinations are only defined for numeric data.

```r title="step_lincomb signature and arguments"
step_lincomb(
  recipe,
  ...,                       # columns to screen
  role = NA,
  trained = FALSE,
  max_steps = 5,             # passes of detect-and-remove
  removals = NULL,
  skip = FALSE,
  id = rand_id("lincomb")
)
```

The only meaningful knob is `max_steps`. Removing one column can resolve several dependencies at once, or expose a fresh one, so `step_lincomb()` repeats the detect-and-remove cycle up to `max_steps` times. The default of 5 clears almost every real recipe; raise it only if you suspect a deeply tangled set of derived columns. The `removals` slot is filled automatically at `prep()` time with the names of the dropped columns. Full argument detail lives in the [recipes step_lincomb reference](https://recipes.tidymodels.org/reference/step_lincomb.html).

## step_lincomb() examples

**Every example follows the prep-then-bake rhythm.** The frame below has four numeric predictors, but `x3` is built as `2 * x1 - x2`, an exact linear combination. The `x4` column is independent noise.

```r title="Drop an exact linear combination"
library(recipes)

set.seed(2026)
n <- 500
a <- rnorm(n)
b <- rnorm(n)
train <- data.frame(
  x1     = a,
  x2     = b,
  x3     = 2 * a - b,   # exact linear combination of x1 and x2
  x4     = rnorm(n),
  target = rnorm(n)
)

lc_rec <- recipe(target ~ ., data = train) |>
  step_lincomb(all_numeric_predictors()) |>
  prep()

names(bake(lc_rec, new_data = NULL))
#> [1] "x1"     "x2"     "x4"     "target"
```

`step_lincomb()` detects that `x3` is reconstructable from `x1` and `x2`, so it drops `x3` and keeps the two columns the combination was built from. To confirm exactly what left, call `tidy()` on the prepared recipe.

```r title="List the columns step_lincomb removed"
tidy(lc_rec, number = 1)
#> # A tibble: 1 x 2
#>   terms id
#>   <chr> <chr>
#> 1 x3    lincomb_aZ9k2
```

The `terms` column names every dropped predictor; an empty tibble means no exact dependency was found. The next example shows why `step_lincomb()` catches redundancy that a correlation filter never will. Here `feat_c` is the exact sum of `feat_a` and `feat_b`, yet each pairwise correlation is only about 0.71.

```r title="step_lincomb catches what step_corr misses"
set.seed(7)
m <- 800
f1 <- rnorm(m)
f2 <- rnorm(m)
combo2 <- data.frame(
  feat_a  = f1,
  feat_b  = f2,
  feat_c  = f1 + f2,   # exact sum, but each pairwise correlation is only ~0.71
  outcome = rnorm(m)
)

# step_corr at the default threshold removes nothing
recipe(outcome ~ ., data = combo2) |>
  step_corr(all_numeric_predictors(), threshold = 0.9) |>
  prep() |> bake(new_data = NULL) |> ncol()
#> [1] 4

# step_lincomb catches the exact three-column dependency
recipe(outcome ~ ., data = combo2) |>
  step_lincomb(all_numeric_predictors()) |>
  prep() |> bake(new_data = NULL) |> ncol()
#> [1] 3
```

No pair clears the 0.9 cutoff, so `step_corr()` leaves all four columns in place. `step_lincomb()` evaluates the columns jointly, finds the three-way dependency, and removes `feat_c`. This joint view is the step's whole reason to exist. The decision is learned once during `prep()` and then applied unchanged to fresh data.

```r title="Apply the trained recipe to new data"
test <- data.frame(
  x1     = rnorm(40),
  x2     = rnorm(40),
  x3     = rnorm(40),
  x4     = rnorm(40),
  target = rnorm(40)
)

names(bake(lc_rec, new_data = test))
#> [1] "x1"     "x2"     "x4"     "target"
```

The test frame loses `x3` even though its own columns are unrelated noise. That is the point: the removal list is fixed from training, so train and test always end with the same schema and no information leaks across the split.

[NOTE]
**Coming from Python scikit-learn?** There is no direct equivalent. `VarianceThreshold` only screens low-variance columns. To remove exact linear combinations you either inspect the rank of the design matrix yourself with `numpy.linalg.matrix_rank`, or drop dependent columns by hand after one-hot encoding.

## step_lincomb() vs step_corr()

**Both steps remove redundant predictors, but they answer different questions.** Using the wrong one either leaves perfect multicollinearity in place or deletes columns that were only loosely related.

| Step | Redundancy detected | Looks at |
|------|---------------------|----------|
| `step_lincomb()` | Exact linear combinations | All selected columns jointly |
| `step_corr()` | High pairwise correlation | Two columns at a time |
| `step_pca()` | Correlated groups, compressed | All selected columns jointly |

Reach for `step_lincomb()` when feature engineering may have produced exact dependencies, such as a full set of one-hot dummies or a ratio that duplicates its inputs. Choose `step_corr()` for the softer problem of predictors that merely move together. Many recipes use both: `step_lincomb()` first to clear perfect redundancy, then `step_corr()` to thin the near-duplicates that remain.

[TIP]
**Place step_lincomb() right after dummy encoding and interaction terms.** Those steps are the usual source of exact linear combinations, because a complete set of indicator columns sums to a constant. Running `step_lincomb()` immediately afterward catches the dummy-variable trap before it reaches the model.

## Common pitfalls

**Three mistakes account for most step_lincomb() confusion.**

1. **Expecting it to catch correlated columns.** `step_lincomb()` ignores any relationship short of exact. Two columns correlated at 0.98 both survive. Use `step_corr()` for approximate redundancy.
2. **Selecting non-numeric columns.** Linear combinations are numeric-only. Use `all_numeric_predictors()` rather than `all_predictors()`, or factor and character columns will trigger an error.
3. **Assuming it keeps the original predictor.** The step removes whichever column the QR decomposition flags as dependent, which is usually the engineered combination. Call `tidy()` after `prep()` to see exactly what was dropped.

[WARNING]
**step_lincomb() silently changes the column count.** A baked frame can have fewer columns than the input with no message printed. If downstream code references columns by position, call `tidy()` after `prep()` to confirm exactly what was removed.

## Try it yourself

**Try it:** Build a recipe on the frame below, add `step_lincomb()` to the numeric predictors, and bake the training data. The `bmi_proxy` column is an exact linear combination of `height` and `weight`, so it should disappear. Save the baked frame to `ex_baked`.

```r title="Your turn: step_lincomb on numeric predictors"
set.seed(42)
ex_train <- data.frame(
  height   = rnorm(300, 170, 10),
  weight   = rnorm(300, 70, 12),
  income   = rnorm(300, 50000, 8000),
  response = rnorm(300)
)
ex_train$bmi_proxy <- 3 * ex_train$height - 2 * ex_train$weight  # exact combination

# Try it: prep a recipe with step_lincomb(all_numeric_predictors()), then bake
ex_baked <- # your code here

ncol(ex_baked)
#> Expected: 4 columns (bmi_proxy removed)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(response ~ ., data = ex_train) |>
  step_lincomb(all_numeric_predictors()) |>
  prep()

ex_baked <- bake(ex_rec, new_data = NULL)
ncol(ex_baked)
#> [1] 4
```

**Explanation:** `bmi_proxy` is built as `3 * height - 2 * weight`, an exact linear combination. `step_lincomb()` detects the dependency during `prep()` and `bake()` drops the column, leaving `height`, `weight`, `income`, and `response`.

</details>

## Related recipes functions

**step_lincomb() is one filter in a larger column-cleaning toolkit.** These steps often appear together in the same recipe:

- `step_corr()` removes predictors with high pairwise correlation below exact redundancy.
- `step_zv()` removes strictly constant columns with exactly one unique value.
- `step_nzv()` removes near-zero-variance columns that are overwhelmingly one value.
- `step_pca()` compresses a correlated set into orthogonal principal components.
- `step_dummy()` one-hot encodes factors, a common upstream source of linear combinations.

## FAQ

**What does step_lincomb() do in R?**

`step_lincomb()` is a recipes step that removes predictors which are exact linear combinations of other columns. During `prep()` it runs a QR decomposition on the selected numeric columns, finds every column reproducible as a weighted sum of others, and records the removals. `bake()` then drops those columns from the training data and from any new data passed through the recipe. It targets perfect multicollinearity, the kind that makes a regression design matrix rank deficient.

**What is the difference between step_lincomb() and step_corr()?**

`step_lincomb()` removes columns that are exact linear combinations of others, evaluating all selected columns jointly. `step_corr()` removes columns with high pairwise correlation, comparing two columns at a time against a threshold. A three-column dependency where each pairwise correlation is moderate is invisible to `step_corr()` but caught by `step_lincomb()`. Use `step_lincomb()` for perfect redundancy and `step_corr()` for approximate redundancy.

**Why did step_lincomb() not remove any columns?**

The most common reason is that no exact linear combination exists. Real raw data rarely contains perfect multicollinearity, so `step_lincomb()` often leaves every column in place and returns an empty `tidy()` tibble. Exact dependencies usually appear only after feature engineering, such as a full set of one-hot dummies or a derived ratio. If you expected a removal, check that the suspect column is truly an exact weighted sum, not merely a strongly correlated one.

**Does step_lincomb() work on factor or character columns?**

No. Linear combinations are defined only for numeric data, so `step_lincomb()` must be pointed at numeric columns. Use the `all_numeric_predictors()` selector rather than `all_predictors()`. If you want to screen categorical predictors for redundancy, convert them with `step_dummy()` first, then place `step_lincomb()` afterward to catch the exact dependencies that one-hot encoding can create.
</content>
