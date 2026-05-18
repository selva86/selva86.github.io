---
title: "recipes step_pca() in R: PCA Feature Reduction for Modeling"
slug: recipes-step_pca-in-R
description: "The recipes step_pca() function in R turns correlated numeric predictors into principal components for modeling. Runnable prep and bake examples included."
keywords: "recipes step_pca, step_pca function R, recipes step_pca example, R PCA recipe, tidymodels PCA preprocessing, step_pca threshold, dimensionality reduction recipes"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_pca()|recipes step_pca|recipes::step_pca()|principal component analysis|step_pca"
auto_link_case_sensitive: true
target_keyword: "recipes step_pca"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_pca() in R: PCA Feature Reduction for Modeling

<p class="lead">The recipes <code>step_pca()</code> function in R adds principal component analysis to a preprocessing pipeline, replacing a set of correlated numeric predictors with a smaller block of uncorrelated components before a model is trained.</p>

[QUICK ANSWER]
step_pca(rec, all_numeric_predictors())                            # default 5 components
step_pca(rec, all_numeric_predictors(), num_comp = 3)              # keep 3 components
step_pca(rec, all_numeric_predictors(), threshold = 0.9)           # keep 90% of variance
step_pca(rec, x, y, z)                                             # named columns only
step_pca(rec, all_numeric_predictors(), prefix = "pc_")            # rename PC1 to pc_1
step_pca(rec, all_numeric_predictors(), keep_original_cols = TRUE) # keep input columns
prep(rec); bake(rec, new_data = NULL)                              # train, then apply
tidy(prep(rec), number = 1, type = "variance")                     # variance per component

[DECISION TREE: Is step_pca() the right tool?]
- compress correlated predictors into components: step_pca(rec, all_numeric_predictors())
- drop redundant columns but keep names: step_corr(rec, all_numeric_predictors())
- predictors have nonlinear structure: step_kpca(rec, all_numeric_predictors())
- want independent signals not variance: step_ica(rec, all_numeric_predictors())
- reduce predictors using the outcome: step_pls(rec, all_numeric_predictors())
- only need centering and scaling: step_normalize(rec, all_numeric_predictors())

## What step_pca() does

**step_pca() converts a group of numeric predictors into principal components.** Principal component analysis finds new axes, ordered by how much variance they capture, that are linear combinations of the original columns. When predictors are correlated, the first few components hold most of the signal, so a model can train on three or four components instead of twenty columns.

Like every recipe step, `step_pca()` works in two stages. During `prep()` it runs `prcomp()` on the selected training columns and stores the rotation matrix, the loadings that map raw columns to components. `bake()` then projects any data, training or new, onto those stored axes. The output columns are named `PC1`, `PC2`, and so on, and the original predictors are dropped.

[KEY INSIGHT]
**The component axes are learned once and frozen.** Because `prep()` stores the rotation from the training set, `bake()` applies the exact same projection to test data. New rows never shift the axes, so no information leaks from test back into training, the way it would if you ran PCA on the full dataset.

## step_pca() syntax and arguments

**step_pca() is a transformation step sized by either a component count or a variance target.** You select columns directly or, far more often, with the tidyselect helper `all_numeric_predictors()`, since PCA is only defined for numeric data.

```r title="step_pca signature and arguments"
step_pca(
  recipe,
  ...,                       # columns to transform
  role = "predictor",
  trained = FALSE,
  num_comp = 5,              # how many components to keep
  threshold = NA,            # or: keep enough components for this variance fraction
  options = list(),          # passed to prcomp(): center, scale.
  prefix = "PC",             # component column name prefix
  keep_original_cols = FALSE,
  skip = FALSE,
  id = rand_id("pca")
)
```

Two arguments control the output width. `num_comp` keeps a fixed number of components, while `threshold` keeps however many are needed to capture a fraction of total variance; setting `threshold` overrides `num_comp`. The `options` list is forwarded to `prcomp()`, which centers but does not scale by default. Full argument detail lives in the [recipes step_pca reference](https://recipes.tidymodels.org/reference/step_pca.html).

## step_pca() examples

**Every example follows the prep-then-bake rhythm.** The first builds a recipe on `mtcars`, normalizes the ten numeric predictors, and compresses them into three components. Normalizing first is important and is covered in the pitfalls below.

```r title="PCA as a recipe step on mtcars"
library(recipes)

pca_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_pca(all_numeric_predictors(), num_comp = 3) |>
  prep()

baked <- bake(pca_rec, new_data = NULL)
dim(baked)
#> [1] 32  4
grep("^PC", names(baked), value = TRUE)
#> [1] "PC1" "PC2" "PC3"
```

The ten predictors collapse into `PC1`, `PC2`, and `PC3`, while the outcome `mpg` passes through untouched. Calling `bake(pca_rec, new_data = test_df)` on any frame with the same input columns reuses the stored loadings, so train and test always land in the same component space.

```r title="num_comp sets how many components survive"
recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_pca(all_numeric_predictors(), num_comp = 5) |>
  prep() |>
  bake(new_data = NULL) |>
  ncol()
#> [1] 6
```

With `num_comp = 5` the baked frame has six columns: five components plus the outcome. Picking a count is fine when you already know how wide you want the model input. When you would rather target a variance budget, use `threshold` instead.

```r title="threshold keeps enough components for target variance"
iris_rec <- recipe(Species ~ ., data = iris) |>
  step_normalize(all_numeric_predictors()) |>
  step_pca(all_numeric_predictors(), threshold = 0.95) |>
  prep()

grep("^PC", names(bake(iris_rec, new_data = NULL)), value = TRUE)
#> [1] "PC1" "PC2"
```

The four iris measurements are strongly correlated, so two components already explain more than 95% of their variance and `step_pca()` stops there. To see the variance each component captures, call `tidy()` on the prepared recipe with `type = "variance"`.

```r title="tidy() reports variance captured per component"
library(dplyr)

tidy(iris_rec, number = 2, type = "variance") |>
  filter(terms == "percent variance")
#> # A tibble: 4 x 4
#>   terms             value component id
#>   <chr>             <dbl>     <int> <chr>
#> 1 percent variance 73.0           1 pca_AbCdE
#> 2 percent variance 22.9           2 pca_AbCdE
#> 3 percent variance  3.67          3 pca_AbCdE
#> 4 percent variance  0.515         4 pca_AbCdE
```

The `number = 2` argument points at the second step in the recipe, `step_pca()`. The table confirms `PC1` and `PC2` together carry about 96% of the variance, which is why the `threshold = 0.95` recipe retained exactly those two. Use `type = "coef"`, the default, to inspect the loadings instead.

[NOTE]
**Coming from Python scikit-learn?** The closest match is `sklearn.decomposition.PCA` inside a `Pipeline`. The recipes equivalent of `PCA(n_components=3)` is `step_pca(num_comp = 3)`, and `PCA(n_components=0.95)` maps to `step_pca(threshold = 0.95)`.

## step_pca() vs other reduction steps

**step_pca() is one of several recipes steps that shrink a wide predictor set, and they leave different data behind.** Choosing wrong either keeps redundancy or discards structure the model needs.

| Step | Transformation | Output columns | Best when |
|------|----------------|----------------|-----------|
| `step_pca()` | Linear orthogonal components | `PC1`, `PC2`, ... | Predictors are linearly correlated |
| `step_kpca()` | Kernel (nonlinear) PCA | `kPC1`, `kPC2`, ... | Structure between predictors is nonlinear |
| `step_ica()` | Independent components | `IC1`, `IC2`, ... | You want statistically independent signals |
| `step_corr()` | Drops redundant columns | Original survivors | You need named, interpretable predictors |

Reach for `step_pca()` when many predictors move together and you accept anonymous components in exchange for a compact, decorrelated model input. Choose `step_corr()` when interpretability matters and you want to keep real column names. Use `step_kpca()` or `step_ica()` only when the linear, variance-ranked view of PCA does not fit the problem.

[TIP]
**Tune the component count instead of guessing it.** Set `num_comp = tune()` and let a `workflow()` plus `tune_grid()` search for the value that maximizes cross-validated performance. The right width depends on the model and the data, not on a fixed rule of thumb.

## Common pitfalls

**Three mistakes account for most step_pca() confusion.**

1. **Skipping normalization.** `step_pca()` centers but does not scale by default, so a predictor measured in thousands dominates the first component over one measured in fractions. Add `step_normalize()` before `step_pca()`, or pass `options = list(scale. = TRUE)`.
2. **Selecting non-numeric columns.** PCA is numeric-only. Use `all_numeric_predictors()` rather than `all_predictors()`, otherwise factor or character columns trigger an error during `prep()`.
3. **Expecting interpretable outputs.** Components are blends of every input column. If your report needs named predictors, `step_pca()` is the wrong tool; use `step_corr()` or `step_select()` instead.

[WARNING]
**step_pca() changes the column count and the column names.** A baked frame replaces every selected predictor with `PC1`, `PC2`, and so on. Any downstream code that references original column names will break silently. Inspect `bake()` output once after adding the step.

## Try it yourself

**Try it:** Build a recipe on the built-in `USArrests` dataset, normalize the numeric predictors, and reduce them to two principal components with `step_pca()`. Save the baked training data to `ex_pca`.

```r title="Your turn: PCA on USArrests"
# Try it: normalize then PCA to 2 components
ex_rec <- recipe(~ ., data = USArrests) |>
  # add step_normalize and step_pca here
  prep()

ex_pca <- # your code here
ncol(ex_pca)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(~ ., data = USArrests) |>
  step_normalize(all_numeric_predictors()) |>
  step_pca(all_numeric_predictors(), num_comp = 2) |>
  prep()

ex_pca <- bake(ex_rec, new_data = NULL)
ncol(ex_pca)
#> [1] 2
```

**Explanation:** `USArrests` has four numeric columns and no outcome. `step_normalize()` puts them on a common scale, then `step_pca()` with `num_comp = 2` projects them onto two components, leaving a two-column frame.

</details>

## Related recipes functions

**step_pca() rarely appears alone in a recipe.** These steps commonly sit alongside it:

- `step_normalize()` centers and scales predictors, the recommended step before `step_pca()`.
- `step_corr()` drops correlated columns while keeping the survivors interpretable.
- `step_kpca()` runs kernel PCA for nonlinear predictor structure.
- `step_pls()` reduces predictors using the outcome, unlike unsupervised PCA.
- `step_impute_mean()` fills missing values, since PCA cannot handle `NA` inputs.

## FAQ

**What does step_pca() do in R?**

`step_pca()` is a recipes step that performs principal component analysis as part of a preprocessing pipeline. During `prep()` it runs `prcomp()` on the selected numeric predictors and stores the rotation matrix. During `bake()` it projects the data onto those axes, replacing the original columns with components named `PC1`, `PC2`, and so on. Because the rotation is learned only from training data, the same projection applies cleanly to new data without leakage.

**How many components should step_pca() keep?**

Use `num_comp` to keep a fixed count or `threshold` to keep enough components for a variance fraction, such as `threshold = 0.9` for 90%. If you are unsure, set `num_comp = tune()` and let `tune_grid()` search for the value that gives the best cross-validated model performance. There is no universal number; it depends on how correlated the predictors are and which model consumes them.

**Should I normalize before step_pca()?**

Yes. `step_pca()` centers predictors but does not scale them by default, so a high-variance column on a large numeric scale can dominate the first component. Place `step_normalize()` before `step_pca()` in the recipe, or pass `options = list(scale. = TRUE)`. Without one of these, PCA reflects measurement units rather than genuine shared structure.

**What is the difference between step_pca() and step_corr()?**

`step_pca()` replaces a correlated group of predictors with new orthogonal components, so the output columns are anonymous blends of the originals. `step_corr()` instead deletes redundant columns and keeps the survivors exactly as they were, with their original names. Use `step_pca()` for maximum compression and a decorrelated model input, and `step_corr()` when you need to keep interpretable, named predictors.
</content>
</invoke>
