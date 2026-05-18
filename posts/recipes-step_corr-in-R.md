---
title: "recipes step_corr() in R: Drop Correlated Predictors"
slug: recipes-step_corr-in-R
description: "The recipes step_corr() function in R removes predictors with high pairwise correlation using a tunable threshold. Runnable prep and bake examples included."
keywords: "recipes step_corr, step_corr function R, recipes step_corr example, remove correlated predictors R, step_corr threshold, step_corr tidymodels, findCorrelation recipes"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_corr()|recipes step_corr|recipes::step_corr()|correlated predictors|step_corr"
auto_link_case_sensitive: true
target_keyword: "recipes step_corr"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_corr() in R: Drop Correlated Predictors

<p class="lead">The recipes <code>step_corr()</code> function in R removes predictors that are highly correlated with another column, judged by a tunable correlation threshold, before the redundancy can destabilize a model.</p>

[QUICK ANSWER]
step_corr(rec, all_numeric_predictors())                       # screen numeric predictors
step_corr(rec, all_numeric_predictors(), threshold = 0.8)      # stricter cutoff
step_corr(rec, x, y, z)                                        # named columns only
step_corr(rec, all_numeric_predictors(), method = "spearman")  # rank correlation
step_corr(rec, all_numeric_predictors(), use = "complete.obs") # NA handling
prep(rec); bake(rec, new_data = NULL)                          # train, then apply
tidy(prep(rec), number = 1)                                    # list removed columns

[DECISION TREE: Is step_corr() the right tool?]
- predictors correlated in pairs: step_corr(rec, all_numeric_predictors())
- column nearly constant, one value dominates: step_nzv(rec, all_predictors())
- column has exactly one value: step_zv(rec, all_predictors())
- columns are exact linear combinations: step_lincomb(rec, all_numeric_predictors())
- compress a correlated set into components: step_pca(rec, all_numeric_predictors())
- drop a named column outright: step_rm(rec, bad_col)

## What step_corr() does

**step_corr() deletes columns that duplicate the information already carried by another predictor.** When two columns move together, a model gains nothing from the second one, and linear models in particular return unstable coefficients and inflated standard errors. The `recipes step_corr` step screens that redundancy out before the model ever sees it.

`step_corr()` works in two stages, like every recipe step. During `prep()` it builds the correlation matrix of the columns you selected, finds every pair whose absolute correlation exceeds `threshold`, and records which columns to drop. `bake()` then removes those columns from the training data and from any new data you pass through later.

[KEY INSIGHT]
**step_corr() removes one column per correlated pair, not both.** For each pair above the threshold it keeps the column with the lower average correlation to everything else and discards the more redundant one. Two near-identical columns lose one member; a useful predictor that happens to share variance with a twin survives.

## step_corr() syntax and arguments

**step_corr() is a selection step controlled by a single threshold plus a correlation method.** You name columns directly or, more often, use the tidyselect helper `all_numeric_predictors()`, since correlation is only defined for numeric data.

```r title="step_corr signature and arguments"
step_corr(
  recipe,
  ...,                              # columns to screen
  role = NA,
  trained = FALSE,
  threshold = 0.9,                  # absolute-correlation cutoff
  use = "pairwise.complete.obs",    # how cor() handles missing values
  method = "pearson",               # or "spearman" / "kendall"
  removals = NULL,
  skip = FALSE,
  id = rand_id("corr")
)
```

The `threshold` argument is the only knob most pipelines touch: a column pair is flagged when its absolute correlation is above this value, so `0.9` is permissive and `0.75` is aggressive. The `removals` slot is filled automatically at `prep()` time with the names of the dropped columns. Full argument detail lives in the [recipes step_corr reference](https://recipes.tidymodels.org/reference/step_corr.html).

## step_corr() examples

**Every example follows the prep-then-bake rhythm.** The frame below has a `core_metric` column and two noisy copies of it, `proxy_one` and `proxy_two`, plus an `unrelated` column. `core_metric` correlates about 0.93 with each proxy, while the two proxies correlate only about 0.86 with each other.

```r title="Drop a redundant correlated column"
library(recipes)

set.seed(2026)
n <- 2000
core <- rnorm(n)
train <- data.frame(
  core_metric = core,
  proxy_one   = core + rnorm(n, sd = 0.41),
  proxy_two   = core + rnorm(n, sd = 0.41),
  unrelated   = rnorm(n),
  target      = rnorm(n)
)

corr_rec <- recipe(target ~ ., data = train) |>
  step_corr(all_numeric_predictors(), threshold = 0.9) |>
  prep()

names(bake(corr_rec, new_data = NULL))
#> [1] "proxy_one" "proxy_two" "unrelated" "target"
```

At `threshold = 0.9` only `core_metric` exceeds the cutoff, and it does so against both proxies. Because it is the most connected column, `step_corr()` drops it and keeps the two proxies, whose mutual correlation of 0.86 stays under the line. To confirm exactly what left, call `tidy()` on the prepared recipe.

```r title="List the columns step_corr removed"
tidy(corr_rec, number = 1)
#> # A tibble: 1 x 2
#>   terms       id
#>   <chr>       <chr>
#> 1 core_metric corr_a1B2c
```

The `terms` column names every dropped predictor; an empty tibble means nothing crossed the threshold. Lowering `threshold` makes the filter stricter and catches milder relationships.

```r title="Lower threshold removes more columns"
# threshold 0.9: only core_metric exceeds the cutoff
recipe(target ~ ., data = train) |>
  step_corr(all_numeric_predictors(), threshold = 0.9) |>
  prep() |> bake(new_data = NULL) |> ncol()
#> [1] 4

# threshold 0.8: the proxy_one / proxy_two pair (r = 0.86) now also fires
recipe(target ~ ., data = train) |>
  step_corr(all_numeric_predictors(), threshold = 0.8) |>
  prep() |> bake(new_data = NULL) |> ncol()
#> [1] 3
```

At `0.8` the three correlated columns form one cluster, so `step_corr()` keeps a single representative and drops the other two. The crucial property is that this decision is learned once during `prep()` and then applied unchanged to fresh data.

```r title="Apply the trained recipe to new data"
test <- data.frame(
  core_metric = rnorm(50),
  proxy_one   = rnorm(50),
  proxy_two   = rnorm(50),
  unrelated   = rnorm(50),
  target      = rnorm(50)
)

names(bake(corr_rec, new_data = test))
#> [1] "proxy_one" "proxy_two" "unrelated" "target"
```

The test frame loses `core_metric` even though its own correlations were never measured. That is the point: the column list is fixed from training, so train and test always end with the same schema and no information leaks across the split. The same logic scales to real data.

```r title="step_corr on the mtcars dataset"
mt_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_corr(all_numeric_predictors(), threshold = 0.9) |>
  prep()

ncol(bake(mt_rec, new_data = NULL))
#> [1] 10
```

`mtcars` has one predictor pair above 0.9: cylinder count and displacement correlate at 0.90. `step_corr()` drops whichever of the two carries the higher average correlation with the remaining predictors, leaving 10 of the original 11 columns.

[NOTE]
**Coming from Python scikit-learn?** There is no built-in correlation filter. `VarianceThreshold` only screens low-variance columns; the closest match to step_corr() is the `DropCorrelatedFeatures` transformer from the `feature-engine` package, or a manual filter on the correlation matrix.

## step_corr() vs step_pca()

**Both steps tackle correlated predictors, but they leave very different data behind.** Choosing wrong either keeps redundancy or destroys the column names your report depends on.

| Step | What it does | Original columns kept? |
|------|--------------|------------------------|
| `step_corr()` | Deletes redundant correlated columns | Yes, survivors are unchanged |
| `step_pca()` | Replaces a correlated set with orthogonal components | No, creates `PC1`, `PC2`, ... |
| `step_lincomb()` | Removes columns that are exact linear combinations | Yes, survivors are unchanged |

Reach for `step_corr()` when you want a smaller model that still uses interpretable, named predictors. Choose `step_pca()` when many predictors are correlated and you accept anonymous components in exchange for compression. Use `step_lincomb()` for the narrower case of exact redundancy, such as dummy columns that sum to a constant.

[TIP]
**Place step_corr() after scaling and imputation, not before.** Correlation is unaffected by centering or scaling, but missing values are not, and an all-NA column produces undefined correlations. Imputing first keeps the correlation matrix well defined.

## Common pitfalls

**Three mistakes account for most step_corr() confusion.**

1. **Selecting non-numeric columns.** Correlation is numeric-only. Use `all_numeric_predictors()` rather than `all_predictors()`, or `step_corr()` will fail or quietly ignore factor columns depending on the recipes version.
2. **Assuming it keeps the predictor you care about.** The filter ranks columns by average correlation, never by relationship to the outcome. It can discard the variable you find most interpretable and keep its twin.
3. **Setting the threshold too high to do anything.** The default `0.9` only catches near-duplicates. If you expect a leaner model, drop the threshold toward `0.8` or `0.75` and inspect `tidy()` to see what changed.

[WARNING]
**step_corr() silently changes the column count.** A baked frame can have fewer columns than the input with no message printed. If downstream code references columns by position, call `tidy()` after `prep()` to confirm exactly what was removed.

## Try it yourself

**Try it:** Build a recipe on the frame below, add `step_corr()` to the numeric predictors with `threshold = 0.9`, and bake the training data. The `revenue` and `revenue_copy` columns are near-identical, so one should disappear. Save the baked frame to `ex_baked`.

```r title="Your turn: step_corr on numeric predictors"
set.seed(99)
ex_train <- data.frame(
  revenue      = rnorm(500, 1000, 200),
  visits       = rnorm(500, 300, 50),
  conversion   = rnorm(500, 0.05, 0.01),
  outcome      = rnorm(500)
)
ex_train$revenue_copy <- ex_train$revenue + rnorm(500, sd = 1)

# Try it: prep a recipe with step_corr(all_numeric_predictors()), then bake
ex_baked <- # your code here

ncol(ex_baked)
#> Expected: one of the revenue pair removed
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(outcome ~ ., data = ex_train) |>
  step_corr(all_numeric_predictors(), threshold = 0.9) |>
  prep()

ex_baked <- bake(ex_rec, new_data = NULL)
ncol(ex_baked)
#> [1] 4
```

**Explanation:** `revenue` and `revenue_copy` correlate above 0.99, so `step_corr()` flags the pair during `prep()` and `bake()` drops one column. The frame goes from five columns to four.

</details>

## Related recipes functions

**step_corr() is one filter in a larger column-cleaning toolkit.** These steps often appear together in the same recipe:

- `step_nzv()` removes near-zero-variance columns that are overwhelmingly one value.
- `step_zv()` removes strictly constant columns with exactly one unique value.
- `step_lincomb()` removes columns that form exact linear combinations of others.
- `step_pca()` compresses a correlated set into orthogonal principal components.
- `step_normalize()` centers and scales numeric predictors, a common step before correlation filtering.

## FAQ

**What does step_corr() do in R?**

`step_corr()` is a recipes step that removes predictors highly correlated with another column. During `prep()` it computes the correlation matrix of the selected columns and flags every pair whose absolute correlation exceeds `threshold`, which defaults to 0.9. For each flagged pair it keeps the less redundant column and marks the other for removal. `bake()` then drops the marked columns from the training data and from any new data passed through the recipe later.

**How does step_corr() decide which column to remove?**

For each pair above the threshold, `step_corr()` compares the two columns by their average absolute correlation with all other predictors. It keeps the column with the lower average and removes the one that is more redundant overall. This is the same heuristic used by caret's `findCorrelation()`. The decision never considers the outcome variable, so removal is based purely on predictor-to-predictor relationships.

**What is the difference between step_corr() and step_pca()?**

`step_corr()` deletes redundant columns and keeps the survivors exactly as they were, so your model still uses named, interpretable predictors. `step_pca()` instead replaces a correlated group with new orthogonal components named `PC1`, `PC2`, and so on. Use `step_corr()` when interpretability matters and `step_pca()` when you want maximum compression and accept anonymous components in return.

**Why did step_corr() not remove any columns?**

The most common reason is a threshold set too high for the data. The default 0.9 only catches near-duplicate columns, so moderately correlated predictors survive. Lower `threshold` toward 0.8 or 0.75 to catch them. The other reason is that no selected columns are numeric: correlation is undefined for factors, so `step_corr()` has nothing to measure unless you select numeric predictors.
</content>
</invoke>
