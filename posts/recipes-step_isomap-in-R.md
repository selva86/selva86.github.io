---
title: "recipes step_isomap() in R: Nonlinear Manifold Step"
slug: recipes-step_isomap-in-R
description: "The recipes step_isomap() function in R adds Isomap manifold embedding inside a preprocessing pipeline. Runnable prep and bake examples on mtcars and iris."
keywords: "recipes step_isomap, step_isomap function R, recipes step_isomap example, Isomap recipes R, step_isomap tidymodels, nonlinear dimensionality reduction R, step_isomap num_terms"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_isomap()|recipes step_isomap|recipes::step_isomap()|Isomap embedding|step_isomap"
auto_link_case_sensitive: true
target_keyword: "recipes step_isomap"
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_isomap() in R: Nonlinear Manifold Step

<p class="lead">The recipes <code>step_isomap()</code> function in R adds Isomap manifold embedding to a preprocessing pipeline, replacing numeric predictors with components that follow the curved low-dimensional surface the data lies on rather than its straight-line directions.</p>

[QUICK ANSWER]
step_isomap(rec, all_numeric_predictors())                                # default 5 comps, 50 neighbors
step_isomap(rec, all_numeric_predictors(), num_terms = 3)                 # keep 3 components
step_isomap(rec, x, y, z)                                                 # named columns only
step_isomap(rec, all_numeric_predictors(), neighbors = 10)                # smaller k for the graph
step_isomap(rec, all_numeric_predictors(), prefix = "iso_")               # rename Isomap1 to iso_1
prep(rec); bake(rec, new_data = NULL)                                     # train, then apply
tidy(prep(rec), number = 1)                                               # list transformed columns

[DECISION TREE: Is step_isomap() the right tool?]
- data lies on a curved manifold: step_isomap(rec, all_numeric_predictors())
- structure is linear and correlated: step_pca(rec, all_numeric_predictors())
- want nonlinear PCA via a kernel: step_kpca(rec, all_numeric_predictors())
- want a 2D map for clustering or plots: step_umap(rec, all_numeric_predictors())
- want independent signals not distance: step_ica(rec, all_numeric_predictors())
- reduce predictors using the outcome: step_pls(rec, all_numeric_predictors(), outcome = vars(y))

## What step_isomap() does

**step_isomap() runs Isomap manifold embedding as a recipe step.** Linear PCA flattens predictors onto straight axes through the variance, which works when the data sits roughly inside a hyperplane. Isomap handles the harder case where rows trace a curved surface, like points wrapped around a Swiss roll. It first builds a k-nearest-neighbor graph on the training rows, measures shortest path distances along that graph, then runs classical multidimensional scaling on those geodesic distances to keep the manifold's true shape in a low-dimensional embedding.

Like every recipes step, `step_isomap()` works in two stages. During `prep()` it builds the k-NN graph, computes geodesic distances, and stores the learned embedding. `bake()` then projects training data, or new data, onto the same low-dimensional space. The output columns are named `Isomap1`, `Isomap2`, and so on, and the original predictors are dropped.

[KEY INSIGHT]
**Isomap preserves walking distance along the manifold, not straight-line distance through space.** Two rows on opposite ends of a curled-up sheet may be Euclidean neighbors but geodesic strangers. Replacing Euclidean distances with shortest paths over the neighbor graph captures intrinsic geometry that linear PCA and even kernel PCA can miss.

## step_isomap() syntax and arguments

**step_isomap() is a transformation step controlled mainly by the component count and the neighborhood size.** You pick columns directly or, more often, with the tidyselect helper `all_numeric_predictors()`, since Isomap is defined only for numeric data.

```r title="step_isomap signature and arguments"
step_isomap(
  recipe,
  ...,                       # columns to transform
  role = "predictor",
  trained = FALSE,
  num_terms = 5,             # how many embedding dimensions to keep
  neighbors = 50,            # k in the k-NN graph
  options = list(.mute = c("message", "output")),
  res = NULL,                # stores the fitted embedding after prep()
  columns = NULL,
  prefix = "Isomap",         # component column name prefix
  keep_original_cols = FALSE,
  skip = FALSE,
  id = rand_id("isomap")
)
```

The `num_terms` argument sets how many embedding dimensions survive in the baked output, and `neighbors` sets the k that builds the graph. The `neighbors` value must be smaller than the number of training rows, so it is the argument you tune first on small frames. Full argument detail lives in the [recipes step_isomap reference](https://recipes.tidymodels.org/reference/step_isomap.html).

## step_isomap() examples

**Every example follows the prep-then-bake rhythm.** The first builds a recipe on `mtcars`, normalizes the ten numeric predictors, and compresses them to three Isomap components. Normalizing first is essential and is covered in the pitfalls below.

```r title="Isomap as a recipe step on mtcars"
library(recipes)

iso_rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_isomap(all_numeric_predictors(), num_terms = 3, neighbors = 5) |>
  prep()

baked <- bake(iso_rec, new_data = NULL)
dim(baked)
#> [1] 32  4
grep("^Isomap", names(baked), value = TRUE)
#> [1] "Isomap1" "Isomap2" "Isomap3"
```

The ten predictors collapse into `Isomap1`, `Isomap2`, and `Isomap3`, while the outcome `mpg` passes through untouched. With only 32 rows in `mtcars` the default `neighbors = 50` cannot build the graph, so we set it to 5. Calling `bake(iso_rec, new_data = test_df)` on any frame with the same input columns reuses the stored embedding, so train and test land in the same Isomap space.

```r title="num_terms sets how many components survive"
recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_isomap(all_numeric_predictors(), num_terms = 2, neighbors = 5) |>
  prep() |>
  bake(new_data = NULL) |>
  ncol()
#> [1] 3
```

With `num_terms = 2` the baked frame has three columns: two Isomap components and the outcome. Unlike linear PCA, Isomap does not decompose variance, so you select the dimension count by intent or by tuning rather than by a percent-variance budget.

```r title="Tune the neighborhood size on a larger frame"
iris_rec <- recipe(Species ~ ., data = iris) |>
  step_normalize(all_numeric_predictors()) |>
  step_isomap(all_numeric_predictors(), num_terms = 2, neighbors = 8) |>
  prep()

baked_iris <- bake(iris_rec, new_data = NULL)
head(baked_iris, 3)
#> # A tibble: 3 x 3
#>   Species Isomap1 Isomap2
#>   <fct>     <dbl>   <dbl>
#> 1 setosa    -2.31   0.123
#> 2 setosa    -2.18  -0.105
#> 3 setosa    -2.04   0.087
```

Eight neighbors on 150 iris rows keeps the graph dense enough to connect all three species without short-circuiting setosa to virginica. The two Isomap columns can then feed a downstream classifier or be plotted for visual inspection.

```r title="tidy() lists the transformed columns"
tidy(iso_rec, number = 2)
#> # A tibble: 10 x 2
#>    terms id
#>    <chr> <chr>
#>  1 cyl   isomap_xY3kQ
#>  2 disp  isomap_xY3kQ
#>  3 hp    isomap_xY3kQ
#>  4 drat  isomap_xY3kQ
#>  5 wt    isomap_xY3kQ
#>  6 qsec  isomap_xY3kQ
#>  7 vs    isomap_xY3kQ
#>  8 am    isomap_xY3kQ
#>  9 gear  isomap_xY3kQ
#> 10 carb  isomap_xY3kQ
```

The `number = 2` argument points at the second step in the recipe, `step_isomap()`. The `tidy()` table lists the predictors that fed the step rather than a variance breakdown, because manifold components do not decompose variance the way linear ones do.

[NOTE]
**Coming from Python scikit-learn?** The closest match is `sklearn.manifold.Isomap` inside a `Pipeline`. The recipes equivalent of `Isomap(n_components=3, n_neighbors=5)` is `step_isomap(num_terms = 3, neighbors = 5)`.

## step_isomap() vs other reduction steps

**step_isomap() is one of several recipes steps that shrink a wide predictor set, and they leave different geometries behind.** Choosing wrong either discards curved structure or pays an interpretability cost you did not need.

| Step | Transformation | Output columns | Best when |
|------|----------------|----------------|-----------|
| `step_isomap()` | Geodesic distance MDS | `Isomap1`, ... | Data lies on a curved low-dimensional manifold |
| `step_pca()` | Linear orthogonal components | `PC1`, ... | Predictors are linearly correlated |
| `step_kpca()` | Kernel (nonlinear) PCA | `kPC1`, ... | Structure is nonlinear but not manifold-shaped |
| `step_umap()` | Topology-preserving embedding | `UMAP1`, ... | Visualization or downstream clustering |

Reach for `step_isomap()` when the predictors clearly trace a curved surface, such as pose data, sensor trajectories, or any geometry where geodesic distance matters. Stay with `step_pca()` when the predictors are merely correlated, since it is faster, reproducible, and easier to explain. Choose `step_kpca()` when the structure is nonlinear but not laid out as a manifold.

[TIP]
**Tune `neighbors` before you tune `num_terms`.** Too few neighbors disconnects the k-NN graph and produces NaN embeddings; too many flatten the manifold by short-circuiting between distant points. A practical starting range is 5 to 15 for small data and 20 to 50 for larger frames.

## Common pitfalls

**Three mistakes account for most step_isomap() confusion.**

1. **Leaving `neighbors` at the default 50.** On small training frames the k-NN graph cannot even be built. Set `neighbors` smaller than the row count and small enough to keep neighborhoods local.
2. **Skipping normalization.** Isomap measures distances on the predictors, so a column on a large scale dominates the graph. Place `step_normalize()` before `step_isomap()` so every predictor contributes evenly.
3. **Applying Isomap to truly linear data.** When the predictors are simply correlated in a straight-line sense, Isomap adds cost without improving structure. The k-NN graph plus geodesic MDS solve a problem the data does not have.

[WARNING]
**step_isomap() embeddings cannot be inverted to original columns.** Unlike PCA loadings, manifold components have no interpretable weights on the inputs. If a stakeholder needs to know which predictor drives a component, choose `step_pca()` or `step_pls()` instead.

## Try it yourself

**Try it:** Build a recipe on the built-in `USArrests` dataset, normalize the numeric predictors, and reduce them to two Isomap components with `neighbors = 8`. Save the baked training data to `ex_iso`.

```r title="Your turn: Isomap on USArrests"
# Try it: normalize then Isomap to 2 components
ex_rec <- recipe(~ ., data = USArrests) |>
  # add step_normalize and step_isomap here
  prep()

ex_iso <- # your code here
ncol(ex_iso)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(~ ., data = USArrests) |>
  step_normalize(all_numeric_predictors()) |>
  step_isomap(all_numeric_predictors(), num_terms = 2, neighbors = 8) |>
  prep()

ex_iso <- bake(ex_rec, new_data = NULL)
ncol(ex_iso)
#> [1] 2
```

**Explanation:** `USArrests` has four numeric columns and no outcome. `step_normalize()` puts them on a common scale, then `step_isomap()` with `num_terms = 2` and `neighbors = 8` projects them onto two manifold components, leaving a two-column frame.

</details>

## Related recipes functions

**step_isomap() rarely appears alone in a recipe.** These steps commonly sit alongside it:

- `step_normalize()` centers and scales predictors, the required step before `step_isomap()`.
- `step_pca()` runs linear PCA, the faster choice when structure is linear.
- `step_kpca()` runs kernel PCA, the alternative when structure is nonlinear but not manifold-shaped.
- `step_umap()` from the `embed` package produces topology-preserving embeddings tuned for visualization.
- `step_impute_mean()` fills missing values, since Isomap cannot handle `NA` inputs.

## FAQ

**What does step_isomap() do in R?**

`step_isomap()` is a recipes step that performs Isomap manifold embedding as part of a preprocessing pipeline. During `prep()` it builds a k-nearest-neighbor graph on the selected numeric predictors, computes geodesic shortest path distances, and runs classical multidimensional scaling on those distances to learn a low-dimensional embedding. During `bake()` it projects data onto that embedding, producing columns named `Isomap1`, `Isomap2`, and so on, while dropping the original predictors.

**When should I use step_isomap() instead of step_pca()?**

Use `step_isomap()` when the predictors trace a curved low-dimensional manifold that linear PCA would flatten incorrectly. A classic case is data whose true structure is one-dimensional but wraps through several columns, such as poses, trajectories, or sensor readings along a moving system. If the predictors are merely correlated in a straight-line sense, stay with `step_pca()`: it is faster, deterministic, and produces interpretable loadings.

**How do I choose the neighbors argument in step_isomap()?**

The `neighbors` value sets the k in the k-NN graph that defines the manifold. Too small a value disconnects the graph and yields NaN embeddings; too large a value short-circuits the geodesic distances and collapses the manifold to a straight-line approximation. A practical starting range is 5 to 15 on small frames and 20 to 50 on larger ones. Tune it through `tune()` if Isomap sits inside a workflow.

**Do I need to normalize before step_isomap()?**

Yes. Isomap measures Euclidean distance between rows to build its k-NN graph, so a predictor with a large numeric range will dominate that distance and pull the graph toward its own scale. Place `step_normalize()` before `step_isomap()` so every predictor contributes evenly. Without it, the components mostly reflect measurement units rather than genuine manifold structure.
