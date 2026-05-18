---
title: "recipes step_kpca() in R: Kernel PCA Feature Step"
slug: recipes-step_kpca-in-R
description: "The recipes step_kpca() function in R runs kernel PCA inside a preprocessing pipeline to capture nonlinear predictor structure. Runnable prep and bake examples."
keywords: "recipes step_kpca, step_kpca function R, recipes step_kpca example, kernel PCA recipes R, step_kpca tidymodels, nonlinear dimensionality reduction R, step_kpca num_comp"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_kpca()|recipes step_kpca|recipes::step_kpca()|kernel PCA|step_kpca"
auto_link_case_sensitive: true
target_keyword: "recipes step_kpca"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_kpca() in R: Kernel PCA Feature Step

<p class="lead">The recipes <code>step_kpca()</code> function in R adds kernel PCA to a preprocessing pipeline, replacing a set of numeric predictors with components that capture nonlinear structure a plain linear PCA would miss.</p>

[QUICK ANSWER]
step_kpca(rec, all_numeric_predictors())                                  # default RBF kernel, 5 comps
step_kpca(rec, all_numeric_predictors(), num_comp = 3)                     # keep 3 components
step_kpca(rec, x, y, z)                                                    # named columns only
step_kpca(rec, all_numeric_predictors(),
          options = list(kernel = "polydot", kpar = list(degree = 2)))     # polynomial kernel
step_kpca(rec, all_numeric_predictors(), prefix = "kpc_")                  # rename kPC1 to kpc_1
prep(rec); bake(rec, new_data = NULL)                                      # train, then apply
tidy(prep(rec), number = 1)                                                # list transformed columns

[DECISION TREE: Is step_kpca() the right tool?]
- predictors have nonlinear structure: step_kpca(rec, all_numeric_predictors())
- structure is linear and correlated: step_pca(rec, all_numeric_predictors())
- want a tunable RBF kernel: step_kpca_rbf(rec, all_numeric_predictors())
- want independent signals not variance: step_ica(rec, all_numeric_predictors())
- preserve a curved manifold's geometry: step_isomap(rec, all_numeric_predictors())
- reduce predictors using the outcome: step_pls(rec, all_numeric_predictors())

## What step_kpca() does

**step_kpca() runs kernel principal component analysis as a recipe step.** Ordinary PCA finds straight-line axes through the data, so it only compresses predictors that vary together linearly. Kernel PCA first maps the predictors into a higher dimensional feature space through a kernel function, then runs PCA there. The result is components that can follow curved, nonlinear relationships between the original columns.

Like every recipe step, `step_kpca()` works in two stages. During `prep()` it calls `kernlab::kpca()` on the selected training columns, builds the kernel matrix, and stores the learned projection. `bake()` then maps any data, training or new, onto those stored kernel components. The output columns are named `kPC1`, `kPC2`, and so on, and the original predictors are dropped.

[KEY INSIGHT]
**The kernel decides what "similar" means before PCA ever runs.** A linear kernel reproduces ordinary PCA, while an RBF kernel measures closeness by distance and an exponentially decaying weight. Choosing the kernel, not tuning the component count, is the decision that gives kernel PCA its power over `step_pca()`.

## step_kpca() syntax and arguments

**step_kpca() is a transformation step controlled by a component count and a kernel specification.** You select columns directly or, far more often, with the tidyselect helper `all_numeric_predictors()`, since kernel PCA is defined only for numeric data.

```r title="step_kpca signature and arguments"
step_kpca(
  recipe,
  ...,                       # columns to transform
  role = "predictor",
  trained = FALSE,
  num_comp = 5,              # how many kernel components to keep
  res = NULL,                # stores the fitted kpca object after prep()
  options = list(            # forwarded to the kpca engine
    kernel = "rbfdot",
    kpar = list(sigma = 0.2)
  ),
  prefix = "kPC",            # component column name prefix
  keep_original_cols = FALSE,
  skip = FALSE,
  id = rand_id("kpca")
)
```

The `num_comp` argument sets how many components survive into the baked output. The `options` list is forwarded to `kernlab::kpca()`: `kernel` names the kernel function and `kpar` holds its parameters. The default is an RBF kernel with `sigma = 0.2`. Full argument detail lives in the [recipes step_kpca reference](https://recipes.tidymodels.org/reference/step_kpca.html).

## step_kpca() examples

**Every example follows the prep-then-bake rhythm.** The first builds a recipe on `mtcars`, normalizes the ten numeric predictors, and compresses them into three kernel components. Normalizing first is essential and is covered in the pitfalls below.

```r title="Kernel PCA as a recipe step on mtcars"
library(recipes)

kpca_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_kpca(all_numeric_predictors(), num_comp = 3) |>
  prep()

baked <- bake(kpca_rec, new_data = NULL)
dim(baked)
#> [1] 32  4
grep("^kPC", names(baked), value = TRUE)
#> [1] "kPC1" "kPC2" "kPC3"
```

The ten predictors collapse into `kPC1`, `kPC2`, and `kPC3`, while the outcome `mpg` passes through untouched. Calling `bake(kpca_rec, new_data = test_df)` on any frame with the same input columns reuses the stored kernel projection, so train and test always land in the same component space.

```r title="num_comp sets how many components survive"
recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_kpca(all_numeric_predictors(), num_comp = 5) |>
  prep() |>
  bake(new_data = NULL) |>
  ncol()
#> [1] 6
```

With `num_comp = 5` the baked frame has six columns: five kernel components plus the outcome. Unlike linear PCA, kernel PCA has no simple "percent variance" budget, so you pick the count directly or tune it.

```r title="Swap the kernel through the options list"
poly_rec <- recipe(Species ~ ., data = iris) |>
  step_normalize(all_numeric_predictors()) |>
  step_kpca(
    all_numeric_predictors(),
    num_comp = 2,
    options = list(kernel = "polydot", kpar = list(degree = 2))
  ) |>
  prep()

grep("^kPC", names(bake(poly_rec, new_data = NULL)), value = TRUE)
#> [1] "kPC1" "kPC2"
```

Here a degree-2 polynomial kernel replaces the default RBF kernel. The `kpar` list carries the kernel's own parameters, so swapping kernels is just an edit to `options`. To confirm which columns the step transformed, call `tidy()` on the prepared recipe.

```r title="tidy() lists the transformed columns"
tidy(kpca_rec, number = 2)
#> # A tibble: 10 x 2
#>    terms id
#>    <chr> <chr>
#>  1 cyl   kpca_xY3kQ
#>  2 disp  kpca_xY3kQ
#>  3 hp    kpca_xY3kQ
#>  4 drat  kpca_xY3kQ
#>  5 wt    kpca_xY3kQ
#>  6 qsec  kpca_xY3kQ
#>  7 vs    kpca_xY3kQ
#>  8 am    kpca_xY3kQ
#>  9 gear  kpca_xY3kQ
#> 10 carb  kpca_xY3kQ
```

The `number = 2` argument points at the second step in the recipe, `step_kpca()`. The `tidy()` table lists the predictors that fed the step rather than a variance breakdown, because kernel components do not decompose variance the way linear ones do.

[NOTE]
**Coming from Python scikit-learn?** The closest match is `sklearn.decomposition.KernelPCA` inside a `Pipeline`. The recipes equivalent of `KernelPCA(n_components=3, kernel="rbf")` is `step_kpca(num_comp = 3)`, since `step_kpca()` already defaults to an RBF kernel.

## step_kpca() vs other reduction steps

**step_kpca() is one of several recipes steps that shrink a wide predictor set, and they leave different data behind.** Choosing wrong either discards nonlinear structure or pays a cost in speed and interpretability you did not need.

| Step | Transformation | Output columns | Best when |
|------|----------------|----------------|-----------|
| `step_kpca()` | Kernel (nonlinear) PCA | `kPC1`, `kPC2`, ... | Structure between predictors is nonlinear |
| `step_pca()` | Linear orthogonal components | `PC1`, `PC2`, ... | Predictors are linearly correlated |
| `step_ica()` | Independent components | `IC1`, `IC2`, ... | You want statistically independent signals |
| `step_isomap()` | Manifold embedding | `Isomap1`, ... | Data lies on a curved low-dimensional manifold |

Reach for `step_kpca()` when a linear PCA leaves obvious structure uncompressed and you suspect curved relationships among predictors. Stay with `step_pca()` when the predictors are simply correlated, since it is faster, reproducible, and easier to explain. Kernel PCA earns its extra cost only when the linear view genuinely fails.

[TIP]
**Tune the kernel, not just the component count.** Use `step_kpca_rbf()` or `step_kpca_poly()` instead of `step_kpca()` when you want a tunable pipeline. They expose `sigma` and `degree` as `tune()`-able arguments, so `tune_grid()` can search kernel settings alongside `num_comp`.

## Common pitfalls

**Three mistakes account for most step_kpca() confusion.**

1. **Skipping normalization.** The RBF kernel measures distance between rows, so a predictor on a large numeric scale dominates that distance. Add `step_normalize()` before `step_kpca()` so every column contributes evenly.
2. **Trusting the default sigma.** The default `kpar = list(sigma = 0.2)` is a starting guess, not a fit. A poorly sized `sigma` produces components that are nearly constant or pure noise. Tune it through `step_kpca_rbf()`.
3. **Using it on large data carelessly.** Kernel PCA builds an n-by-n kernel matrix, so cost grows with the square of the row count. On tens of thousands of rows it is slow and memory hungry; sample or switch to `step_pca()`.

[WARNING]
**step_kpca() components cannot be mapped back to original columns.** Unlike linear PCA loadings, kernel components have no interpretable weights on the input predictors. If a stakeholder needs to know which variable drives a component, `step_kpca()` is the wrong tool.

## Try it yourself

**Try it:** Build a recipe on the built-in `USArrests` dataset, normalize the numeric predictors, and reduce them to two kernel components with `step_kpca()`. Save the baked training data to `ex_kpca`.

```r title="Your turn: kernel PCA on USArrests"
# Try it: normalize then kernel PCA to 2 components
ex_rec <- recipe(~ ., data = USArrests) |>
  # add step_normalize and step_kpca here
  prep()

ex_kpca <- # your code here
ncol(ex_kpca)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(~ ., data = USArrests) |>
  step_normalize(all_numeric_predictors()) |>
  step_kpca(all_numeric_predictors(), num_comp = 2) |>
  prep()

ex_kpca <- bake(ex_rec, new_data = NULL)
ncol(ex_kpca)
#> [1] 2
```

**Explanation:** `USArrests` has four numeric columns and no outcome. `step_normalize()` puts them on a common scale, then `step_kpca()` with `num_comp = 2` projects them onto two kernel components, leaving a two-column frame.

</details>

## Related recipes functions

**step_kpca() rarely appears alone in a recipe.** These steps commonly sit alongside it:

- `step_normalize()` centers and scales predictors, the required step before `step_kpca()`.
- `step_pca()` runs linear PCA, the faster choice when structure is linear.
- `step_kpca_rbf()` is the tunable RBF-kernel version, with `sigma` as a `tune()` argument.
- `step_ica()` extracts statistically independent signals instead of variance.
- `step_impute_mean()` fills missing values, since kernel PCA cannot handle `NA` inputs.

## FAQ

**What does step_kpca() do in R?**

`step_kpca()` is a recipes step that performs kernel principal component analysis as part of a preprocessing pipeline. During `prep()` it calls `kernlab::kpca()` on the selected numeric predictors and stores the fitted projection. During `bake()` it maps the data onto kernel components named `kPC1`, `kPC2`, and so on, dropping the original columns. Because the projection is learned only from training data, the same transformation applies cleanly to new data without leakage.

**When should I use step_kpca() instead of step_pca()?**

Use `step_kpca()` when you suspect the predictors relate to each other in a nonlinear way that linear PCA cannot compress. Kernel PCA maps the data through a kernel function before reducing it, so it can follow curved structure. If the predictors are simply correlated in a straight-line sense, stay with `step_pca()`, which is faster, reproducible, and produces interpretable loadings.

**How do I change the kernel in step_kpca()?**

Pass an `options` list with a `kernel` name and a `kpar` parameter list. For example, `options = list(kernel = "polydot", kpar = list(degree = 2))` switches to a degree-2 polynomial kernel. The default is `rbfdot` with `sigma = 0.2`. The `kernel` value can be any kernel that `kernlab::kpca()` accepts, such as `rbfdot`, `polydot`, `vanilladot`, or `tanhdot`.

**Do I need to normalize before step_kpca()?**

Yes. The default RBF kernel measures distance between rows, so a predictor on a large numeric scale will dominate that distance and crowd out smaller columns. Place `step_normalize()` before `step_kpca()` in the recipe so every predictor contributes on equal footing. Without it, the kernel components mostly reflect measurement units rather than genuine shared structure.
</content>
</invoke>
