---
title: "recipes step_ica() in R: Independent Component Features"
slug: recipes-step_ica-in-R
description: "The recipes step_ica() function in R extracts statistically independent components from numeric predictors for modeling. Runnable prep and bake examples."
keywords: "recipes step_ica, step_ica function R, recipes step_ica example, R ICA recipe, tidymodels ICA preprocessing, independent component analysis R, step_ica num_comp"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_ica()|recipes step_ica|recipes::step_ica()|independent component analysis|step_ica"
auto_link_case_sensitive: true
target_keyword: "recipes step_ica"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_ica() in R: Independent Component Features

<p class="lead">The recipes <code>step_ica()</code> function in R adds independent component analysis to a preprocessing pipeline, replacing numeric predictors with a smaller block of statistically independent components before a model is trained.</p>

[QUICK ANSWER]
step_ica(rec, all_numeric_predictors())                              # default 5 components
step_ica(rec, all_numeric_predictors(), num_comp = 3)                # keep 3 components
step_ica(rec, x, y, z)                                               # named columns only
step_ica(rec, all_numeric_predictors(), seed = 123)                  # reproducible result
step_ica(rec, all_numeric_predictors(), prefix = "ic_")              # rename IC1 to ic_1
step_ica(rec, all_numeric_predictors(), keep_original_cols = TRUE)   # keep input columns
prep(rec); bake(rec, new_data = NULL)                                # train, then apply
tidy(prep(rec), number = 1)                                          # inspect the mixing matrix

[DECISION TREE: Is step_ica() the right tool?]
- extract independent non-Gaussian signals: step_ica(rec, all_numeric_predictors())
- want variance-ranked components instead: step_pca(rec, all_numeric_predictors())
- predictors have nonlinear structure: step_kpca(rec, all_numeric_predictors())
- reduce predictors using the outcome: step_pls(rec, all_numeric_predictors())
- just drop correlated columns by name: step_corr(rec, all_numeric_predictors())
- only need centering and scaling: step_normalize(rec, all_numeric_predictors())

## What step_ica() does

**step_ica() converts a group of numeric predictors into independent components.** Independent component analysis assumes the observed columns are linear mixtures of hidden source signals and tries to recover those sources. Where principal component analysis only removes correlation, ICA goes further and separates components that are statistically independent, which is a stronger condition.

Like every recipe step, `step_ica()` works in two stages. During `prep()` it runs `fastICA()` on the selected training columns and stores the estimated unmixing matrix. `bake()` then projects any data, training or new, onto those stored components. The output columns are named `IC1`, `IC2`, and so on, and the original predictors are dropped.

[KEY INSIGHT]
**Independent is a stronger claim than uncorrelated.** Two columns can be uncorrelated yet still share higher-order structure. ICA targets full statistical independence, so its components are well suited to data whose sources are non-Gaussian, such as separated signals or blended sensor readings.

## step_ica() syntax and arguments

**step_ica() is a transformation step sized by a component count.** You select columns directly or, far more often, with the tidyselect helper `all_numeric_predictors()`, since ICA is only defined for numeric data. Unlike `step_pca()`, there is no variance threshold argument, because ICA does not rank its components by variance.

```r title="step_ica signature and arguments"
step_ica(
  recipe,
  ...,                            # columns to transform
  role = "predictor",
  trained = FALSE,
  num_comp = 5,                   # how many independent components to keep
  options = list(method = "C"),   # passed to fastICA()
  seed = sample.int(10000, 5),    # makes the stochastic fit reproducible
  prefix = "IC",                  # component column name prefix
  keep_original_cols = FALSE,
  skip = FALSE,
  id = rand_id("ica")
)
```

The `num_comp` argument fixes how many components survive; it must not exceed the number of selected predictors. The `seed` argument matters because ICA starts from a random initialization, so a fixed seed makes the result reproducible. The `options` list is forwarded to `fastICA()`. Full argument detail lives in the [recipes step_ica reference](https://recipes.tidymodels.org/reference/step_ica.html).

[NOTE]
**step_ica() needs the fastICA package.** The step calls `fastICA::fastICA()` under the hood, so install `fastICA` before adding it to a recipe. If the package is missing, `prep()` stops with a clear error naming the dependency.

## step_ica() examples

**Every example follows the prep-then-bake rhythm.** The first builds a recipe on `mtcars`, normalizes the ten numeric predictors, and extracts three independent components. Normalizing first is important and is covered in the pitfalls below.

```r title="ICA as a recipe step on mtcars"
library(recipes)

ica_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_ica(all_numeric_predictors(), num_comp = 3, seed = 42) |>
  prep()

baked <- bake(ica_rec, new_data = NULL)
dim(baked)
#> [1] 32  4
grep("^IC", names(baked), value = TRUE)
#> [1] "IC1" "IC2" "IC3"
```

The ten predictors collapse into `IC1`, `IC2`, and `IC3`, while the outcome `mpg` passes through untouched. Calling `bake()` on any frame with the same input columns reuses the stored unmixing matrix, so train and test always land in the same component space.

```r title="num_comp sets the number of components"
recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_ica(all_numeric_predictors(), num_comp = 5, seed = 42) |>
  prep() |>
  bake(new_data = NULL) |>
  ncol()
#> [1] 6
```

With `num_comp = 5` the baked frame has six columns: five components plus the outcome. Pick a count based on how many independent signals you expect the predictors to contain, or tune it as shown later.

```r title="The same recipe projects new data"
iris_rec <- recipe(Species ~ ., data = iris) |>
  step_normalize(all_numeric_predictors()) |>
  step_ica(all_numeric_predictors(), num_comp = 2, seed = 100) |>
  prep()

new_rows <- iris[c(1, 51, 101), ]
bake(iris_rec, new_data = new_rows)
#> # A tibble: 3 x 3
#>   Species       IC1     IC2
#>   <fct>       <dbl>   <dbl>
#> 1 setosa     -1.42   0.583
#> 2 versicolor  0.214 -0.067
#> 3 virginica   1.18  -0.402
```

Because the unmixing matrix was learned only from the training set, these three new rows are projected with the exact same transformation. No information leaks from new data back into the fitted components.

```r title="tidy() returns the estimated mixing matrix"
library(dplyr)

tidy(iris_rec, number = 2) |>
  filter(component == "IC1")
#> # A tibble: 4 x 4
#>   terms          value component id
#>   <chr>          <dbl> <chr>     <chr>
#> 1 Sepal.Length  0.512  IC1       ica_8xK2p
#> 2 Sepal.Width  -0.318  IC1       ica_8xK2p
#> 3 Petal.Length  0.901  IC1       ica_8xK2p
#> 4 Petal.Width   0.874  IC1       ica_8xK2p
```

Calling `tidy()` on the prepared recipe with `number = 2` points at the second step, `step_ica()`. The table shows how each original column loads onto a component, which is the closest ICA gives you to an interpretable view of the transformation.

## step_ica() vs other reduction steps

**step_ica() is one of several recipes steps that shrink a wide predictor set, and they leave different data behind.** Choosing wrong either keeps redundancy or discards structure the model needs.

| Step | Transformation | Output columns | Best when |
|------|----------------|----------------|-----------|
| `step_ica()` | Independent components | `IC1`, `IC2`, ... | Sources are non-Gaussian and independent |
| `step_pca()` | Linear orthogonal components | `PC1`, `PC2`, ... | Predictors are linearly correlated |
| `step_kpca()` | Kernel (nonlinear) PCA | `kPC1`, `kPC2`, ... | Structure between predictors is nonlinear |
| `step_corr()` | Drops redundant columns | Original survivors | You need named, interpretable predictors |

Reach for `step_ica()` when you believe the predictors are blends of independent underlying signals, a common situation with sensor, audio, or financial data. Choose `step_pca()` when you simply want a compact, decorrelated input ranked by variance. Use `step_corr()` when interpretability matters and you want to keep real column names.

[TIP]
**Tune the component count instead of guessing it.** Set `num_comp = tune()` and let a `workflow()` plus `tune_grid()` search for the value that maximizes cross-validated performance. ICA gives no variance ranking to lean on, so tuning is the reliable way to size the output.

## Common pitfalls

**Three mistakes account for most step_ica() confusion.**

1. **Forgetting the seed.** ICA starts from a random initialization, so two runs without a fixed `seed` produce different components. Always pass `seed` when you need reproducible recipes across sessions.
2. **Skipping normalization.** ICA is sensitive to predictor scale. Add `step_normalize()` before `step_ica()` so a large-scale column does not distort the recovered signals.
3. **Expecting ordered components.** Unlike PCA, ICA does not rank components by importance. `IC1` is not more significant than `IC3`, so do not drop later components assuming they carry less signal.

[WARNING]
**step_ica() changes the column count and the column names.** A baked frame replaces every selected predictor with `IC1`, `IC2`, and so on. Any downstream code that references original column names will break silently. Inspect `bake()` output once after adding the step.

## Try it yourself

**Try it:** Build a recipe on the built-in `USArrests` dataset, normalize the numeric predictors, and reduce them to two independent components with `step_ica()`. Use `seed = 7`. Save the baked training data to `ex_ica`.

```r title="Your turn: ICA on USArrests"
# Try it: normalize then ICA to 2 components
ex_rec <- recipe(~ ., data = USArrests) |>
  # add step_normalize and step_ica here
  prep()

ex_ica <- # your code here
ncol(ex_ica)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(~ ., data = USArrests) |>
  step_normalize(all_numeric_predictors()) |>
  step_ica(all_numeric_predictors(), num_comp = 2, seed = 7) |>
  prep()

ex_ica <- bake(ex_rec, new_data = NULL)
ncol(ex_ica)
#> [1] 2
```

**Explanation:** `USArrests` has four numeric columns and no outcome. `step_normalize()` puts them on a common scale, then `step_ica()` with `num_comp = 2` and a fixed `seed` projects them onto two reproducible independent components.

</details>

## Related recipes functions

**step_ica() rarely appears alone in a recipe.** These steps commonly sit alongside it:

- `step_normalize()` centers and scales predictors, the recommended step before `step_ica()`.
- `step_pca()` extracts variance-ranked orthogonal components instead of independent ones.
- `step_kpca()` runs kernel PCA for nonlinear predictor structure.
- `step_corr()` drops correlated columns while keeping the survivors interpretable.
- `step_impute_mean()` fills missing values, since ICA cannot handle `NA` inputs.

## FAQ

**What does step_ica() do in R?**

`step_ica()` is a recipes step that performs independent component analysis as part of a preprocessing pipeline. During `prep()` it runs `fastICA()` on the selected numeric predictors and stores the estimated unmixing matrix. During `bake()` it projects the data onto those components, replacing the original columns with components named `IC1`, `IC2`, and so on. Because the transformation is learned only from training data, the same projection applies cleanly to new data without leakage.

**What is the difference between step_ica() and step_pca()?**

`step_pca()` finds orthogonal components ranked by how much variance they capture, so dropping later components is a sensible compression strategy. `step_ica()` finds components that are statistically independent, a stronger condition, and does not rank them by importance. Use `step_pca()` for general decorrelation and compression, and `step_ica()` when the predictors are believed to be mixtures of independent, non-Gaussian source signals.

**Why do I need to set a seed in step_ica()?**

Independent component analysis starts from a random initialization and iterates to a solution, which makes it a stochastic algorithm. Without a fixed `seed`, two `prep()` calls on the same data produce different components and column values. Passing `seed` makes the recipe reproducible across sessions and machines, which matters when you save a prepared recipe and reuse it later.

**Should I normalize before step_ica()?**

Yes. `step_ica()` is sensitive to the scale of its inputs, so a predictor measured in large units can dominate the recovered components. Place `step_normalize()` before `step_ica()` in the recipe so every column contributes on a comparable scale. Without it, the independent components reflect measurement units rather than genuine shared structure.
</content>
</invoke>
