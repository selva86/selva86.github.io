---
title: "t-SNE and UMAP in R: Compress High-Dimensional Data to 2D, Without Losing Clusters"
slug: t-SNE-and-UMAP-in-R
description: "t-SNE and UMAP project high-dimensional data to 2D in R. Learn Rtsne and the umap package, tune perplexity and n_neighbors, avoid over-interpretation."
keywords: "t-SNE in R, UMAP in R, Rtsne package, umap package, dimensionality reduction, nonlinear embedding, perplexity, n_neighbors, cluster visualization, manifold learning"
auto_link_terms: "t-SNE|UMAP|Rtsne|nonlinear dimensionality reduction|perplexity parameter|manifold learning|umap package"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-21
curriculum_id: "2.5.9"
post_type: C
sidebar_section: Statistics
sidebar_title: "t-SNE and UMAP"
sidebar_order: 76
difficulty: Intermediate
---

# t-SNE and UMAP in R: Compress High-Dimensional Data to 2D, Without Losing Clusters

<p class="lead">t-SNE and UMAP are nonlinear dimensionality-reduction methods that turn a table with dozens of columns into a 2D map where points close together in the original space stay close together on the page. Use them when PCA leaves your clusters overlapping and you need a map good enough to eyeball.</p>

## What do t-SNE and UMAP actually do?

Picture the iris dataset: four measurements per flower, three species. PCA draws a straight 2D shadow of that 4D cloud, which works when groups separate along straight lines. t-SNE and UMAP do something subtler: they ask, for every pair of points, *how similar are you in the full space?* and then place those points on a 2D canvas so similar ones land near each other. Non-linearities stop being a problem. One line of code shows the payoff.

```r title="Payoff: t-SNE on iris"
library(Rtsne)
library(ggplot2)

# Scale the four numeric columns so each contributes equally
iris_num <- iris[, 1:4]
iris_scaled <- scale(iris_num)

set.seed(1)
tsne_iris <- Rtsne(iris_scaled, dims = 2, perplexity = 30, verbose = FALSE)

tsne_df <- data.frame(
  x = tsne_iris$Y[, 1],
  y = tsne_iris$Y[, 2],
  species = iris$Species
)

ggplot(tsne_df, aes(x, y, color = species)) +
  geom_point(size = 2) +
  labs(title = "t-SNE of iris", x = "t-SNE 1", y = "t-SNE 2")
#> Three clouds appear: setosa sits off on one side,
#> versicolor and virginica sit together but separate clearly.
```

Four columns of numbers turned into three visually distinct flower groups. Nothing about the species labels entered the calculation. t-SNE only saw the measurements, yet the picture shows what a botanist already knows: setosa is different, versicolor and virginica are closer but still distinguishable. That is what "preserving neighbor structure" buys you.

The mental model is simple. For every point, t-SNE and UMAP list its nearest neighbors in the high-dimensional space. Then they place points on a 2D canvas and nudge them until every point's list of 2D neighbors roughly matches its original list. Unrelated points are allowed to drift to whatever position the optimizer finds convenient. That is why these plots are useful for spotting clusters and useless for measuring the distance *between* clusters.

[KEY INSIGHT]
**t-SNE and UMAP preserve neighbors, not distances.** If A and B were in each other's top-20 nearest neighbors in the original space, they will sit close in 2D. But the distance between two clusters on the page rarely matches the distance between them in reality.

Before any of this works, there's a small but critical data-prep step: you need to put every column on the same scale. Both algorithms measure point-to-point similarity with Euclidean distance, so a feature in thousands will drown a feature in tenths. `scale()` centers and standardizes each column, which lets every feature contribute fairly to the neighbor calculation.

[TIP]
**Scale numeric columns before running either method.** Skipping `scale()` is the top cause of confusing plots, especially when your columns mix units (price in dollars next to weight in grams next to a 0-1 ratio).

**Try it:** Run t-SNE on the numeric columns of `mtcars`, colored by cylinder count.

```r title="Your turn: t-SNE on mtcars"
# Scale mtcars and run Rtsne, then plot with color = cylinder
ex_mtcars <- scale(mtcars)
# your code here

# Test: you should see small, medium, large cars form three loose groups
```

<details>
<summary>Click to reveal solution</summary>

```r title="t-SNE on mtcars solution"
set.seed(2)
ex_mtcars_tsne <- Rtsne(ex_mtcars, perplexity = 10, verbose = FALSE)
ex_mtcars_df <- data.frame(
  x = ex_mtcars_tsne$Y[, 1],
  y = ex_mtcars_tsne$Y[, 2],
  cyl = factor(mtcars$cyl)
)
ggplot(ex_mtcars_df, aes(x, y, color = cyl)) +
  geom_point(size = 3) +
  labs(title = "t-SNE of mtcars", x = "t-SNE 1", y = "t-SNE 2")
#> Three regions appear: 4-cyl econoboxes, 6-cyl sedans, 8-cyl muscle.
```

**Explanation:** `perplexity=10` is lower because `mtcars` has only 32 rows, and the default 30 is larger than the sample size (Rtsne would refuse to run). Smaller datasets want smaller perplexity.

</details>

## How do you run t-SNE in R with Rtsne?

![The shared pipeline of t-SNE and UMAP.](screenshots/t-SNE-and-UMAP-in-R-pipeline-flow.webp)
*Figure 1: The shared pipeline: scale, compute neighbor similarities, optimize a 2D layout, plot.*

The `Rtsne` package wraps Laurens van der Maaten's Barnes-Hut t-SNE implementation. Its key arguments:

- `X`: the scaled numeric matrix or data frame
- `dims = 2`: output dimensions (almost always 2)
- `perplexity = 30`: effective neighborhood size (typical range 5 to 50)
- `max_iter = 1000`: optimizer iterations
- `verbose = TRUE`: print progress

Perplexity is the one knob that changes your plot. It controls how many neighbors each point "feels" during the optimization. Low perplexity makes t-SNE focus on tight local groups. High perplexity pulls in broader context. Let's rerun with perplexity 15 and see the difference.

```r title="t-SNE with perplexity = 15"
set.seed(1)
tsne_p15 <- Rtsne(iris_scaled, dims = 2, perplexity = 15, verbose = FALSE)

tsne_p15_df <- data.frame(
  x = tsne_p15$Y[, 1],
  y = tsne_p15$Y[, 2],
  species = iris$Species
)

ggplot(tsne_p15_df, aes(x, y, color = species)) +
  geom_point(size = 2) +
  labs(title = "t-SNE of iris (perplexity = 15)")
#> Species still separate, but versicolor and virginica pull further apart.
```

The three clouds are still there, but the gap between versicolor and virginica widened. Smaller perplexity = more local focus = more aggressive cluster separation. That can be good (real sub-groups pop out) or bad (noise looks like sub-groups). You must eyeball several values to know which.

[NOTE]
**Call set.seed() before Rtsne for reproducibility.** t-SNE initializes randomly and runs a stochastic optimizer. Two runs with different seeds give visually different layouts even on identical data. Fix the seed in your analysis scripts; swap it deliberately only when checking stability.

**Try it:** Re-run t-SNE with `perplexity = 5` and describe the visual change versus `perplexity = 30`.

```r title="Your turn: perplexity = 5"
# Run Rtsne with perplexity=5 on iris_scaled
# your code here

# Test: expect tighter clusters, maybe a split of one species into sub-blobs
```

<details>
<summary>Click to reveal solution</summary>

```r title="Perplexity = 5 solution"
set.seed(1)
ex_tsne_p5 <- Rtsne(iris_scaled, perplexity = 5, verbose = FALSE)
plot(ex_tsne_p5$Y, col = iris$Species, pch = 19,
     xlab = "t-SNE 1", ylab = "t-SNE 2",
     main = "t-SNE of iris (perplexity = 5)")
#> Clusters become very small and sometimes split into fragments.
```

**Explanation:** With perplexity 5, t-SNE only considers each point's 5 closest neighbors. Real clusters shatter into sub-blobs because any local variation gets amplified. This is the classic "perplexity too low" look.

</details>

## How do you run UMAP in R with the umap package?

UMAP, by McInnes, Healy and Melville (2018), joined the toolbox a decade after t-SNE. It optimizes a different objective, runs faster, and tends to preserve more of the global structure. Two R packages implement it: `umap` (pure R, easy install) and `uwot` (Rcpp, faster). The code below uses `umap` because it runs in-browser. The API of the two is deliberately similar.

```r title="UMAP with the umap package"
library(umap)

set.seed(1)
umap_iris <- umap::umap(iris_scaled, n_neighbors = 15, min_dist = 0.1)

umap_df <- data.frame(
  x = umap_iris$layout[, 1],
  y = umap_iris$layout[, 2],
  species = iris$Species
)

ggplot(umap_df, aes(x, y, color = species)) +
  geom_point(size = 2) +
  labs(title = "UMAP of iris", x = "UMAP 1", y = "UMAP 2")
#> Three species separate into compact clouds with clear gaps.
```

UMAP's output looks tighter than t-SNE's. Points inside a cluster collapse toward a single "blob" while the three blobs drift apart. That is a consequence of the `min_dist` parameter (how close neighbors are allowed to sit) and UMAP's cost function, which penalizes far-apart neighbors and far-apart non-neighbors symmetrically.

Seeing both methods side-by-side is the fastest way to build intuition. We'll use `patchwork` to stitch them together.

```r title="t-SNE and UMAP side-by-side"
library(patchwork)

p_tsne <- ggplot(tsne_df, aes(x, y, color = species)) +
  geom_point(size = 2) + labs(title = "t-SNE")

p_umap <- ggplot(umap_df, aes(x, y, color = species)) +
  geom_point(size = 2) + labs(title = "UMAP")

p_tsne + p_umap
#> Two plots. UMAP clusters are denser; t-SNE clusters are more spread out.
```

Same data, same seed family, same colors. The two plots tell the same *story* (three clear species) with different *visual emphasis*. UMAP paints compact, island-like clusters; t-SNE paints soft, diffuse ones. Neither is wrong. Which one you prefer depends on whether you want to eyeball small-scale sub-structure (t-SNE) or big-picture layout (UMAP).

[NOTE]
**uwot is the production alternative.** `library(uwot); umap(iris_scaled)` gives a near-identical API and runs much faster on large data. The in-browser sample on this page uses the pure-R `umap` package because `uwot` ships only as a compiled binary. Swap in `uwot::umap()` in your local R session.

**Try it:** Re-run `umap::umap` with `n_neighbors = 30` and plot the result.

```r title="Your turn: UMAP with n_neighbors = 30"
# Call umap::umap() with n_neighbors = 30 on iris_scaled
# your code here

# Test: expect clusters to merge slightly compared to n_neighbors = 15
```

<details>
<summary>Click to reveal solution</summary>

```r title="UMAP n_neighbors = 30 solution"
set.seed(1)
ex_umap_nn30 <- umap::umap(iris_scaled, n_neighbors = 30, min_dist = 0.1)
plot(ex_umap_nn30$layout, col = iris$Species, pch = 19,
     xlab = "UMAP 1", ylab = "UMAP 2",
     main = "UMAP of iris (n_neighbors = 30)")
#> Clusters remain three, but setosa sits closer to the versicolor mass.
```

**Explanation:** Larger `n_neighbors` means each point considers a wider context. Global structure (setosa being off on its own) gets slightly muted; cluster boundaries blur a little. This is the UMAP equivalent of raising t-SNE's perplexity.

</details>

## How do perplexity and n_neighbors change the picture?

Both parameters are versions of the same question: *how big is a local neighborhood?* Small values make the algorithm focus on very local structure, so real clusters shatter into fragments. Large values pull in broader context, so real clusters merge. The "right" value is whatever makes the plot show what the data actually contains, and you learn that by trying several.

A grid is the fastest way. Below, we run Rtsne four times at perplexity 5, 15, 30, 50 and plot all four.

```r title="Perplexity grid for t-SNE"
perp_values <- c(5, 15, 30, 50)

perp_grid <- do.call(rbind, lapply(perp_values, function(p) {
  set.seed(1)
  out <- Rtsne(iris_scaled, perplexity = p, verbose = FALSE)
  data.frame(
    x = out$Y[, 1],
    y = out$Y[, 2],
    species = iris$Species,
    perplexity = paste0("perp = ", p)
  )
}))

ggplot(perp_grid, aes(x, y, color = species)) +
  geom_point(size = 1.2) +
  facet_wrap(~ perplexity, scales = "free") +
  labs(title = "t-SNE on iris across perplexity values")
#> Four panels. Perp=5 shows fragmented sub-clusters; perp=50 shows a smooth layout.
```

Perplexity 5 fragments virginica into mini-blobs that aren't real sub-species. Perplexity 50 smooths everything into three clean globs. Perplexity 15 and 30 sit between them and show the same story. That's the zone to settle on for this dataset. Reporting just one perplexity without trying others is a common beginner mistake.

The same game with UMAP's `n_neighbors`:

```r title="n_neighbors grid for UMAP"
nn_values <- c(5, 15, 30, 50)

nn_grid <- do.call(rbind, lapply(nn_values, function(k) {
  set.seed(1)
  out <- umap::umap(iris_scaled, n_neighbors = k, min_dist = 0.1)
  data.frame(
    x = out$layout[, 1],
    y = out$layout[, 2],
    species = iris$Species,
    neighbors = paste0("n_neighbors = ", k)
  )
}))

ggplot(nn_grid, aes(x, y, color = species)) +
  geom_point(size = 1.2) +
  facet_wrap(~ neighbors, scales = "free") +
  labs(title = "UMAP on iris across n_neighbors")
#> Four panels. Low n_neighbors splits clusters; high n_neighbors merges them.
```

Same pattern as t-SNE, different tuning name. UMAP with `n_neighbors = 5` fragments the clusters; with `n_neighbors = 50` it softens them. The middle values hit the right balance. `min_dist` is a secondary knob that controls how tightly points are packed inside a cluster; try `0.01` for crisp blobs and `0.5` for loose clouds.

[KEY INSIGHT]
**There is no universally correct perplexity or n_neighbors.** These parameters don't have an objective answer; they have a defensible one, and you find it by trying 3 to 5 values and keeping the layout that is stable across the range.

**Try it:** Run UMAP on iris twice with `min_dist = 0.01` and `min_dist = 0.5` and describe the change.

```r title="Your turn: two min_dist values"
# Run umap twice on iris_scaled, first with min_dist=0.01, then min_dist=0.5
# your code here

# Test: expect tighter blobs at 0.01, looser clouds at 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="min_dist comparison solution"
set.seed(1)
ex_umap_tight <- umap::umap(iris_scaled, n_neighbors = 15, min_dist = 0.01)
set.seed(1)
ex_umap_loose <- umap::umap(iris_scaled, n_neighbors = 15, min_dist = 0.5)

par(mfrow = c(1, 2))
plot(ex_umap_tight$layout, col = iris$Species, pch = 19, main = "min_dist = 0.01")
plot(ex_umap_loose$layout, col = iris$Species, pch = 19, main = "min_dist = 0.5")
par(mfrow = c(1, 1))
#> Tight blobs on the left, loose clouds on the right.
```

**Explanation:** `min_dist` is the minimum distance UMAP allows between neighboring points in the 2D layout. Smaller = tighter clusters. Use small values for clear visual separation; larger values when you want to see point density inside clusters.

</details>

## When should you trust the 2D layout, and when should you not?

Three traps catch readers who take these plots too literally. The first is seed sensitivity. t-SNE initializes the 2D layout randomly and descends a non-convex objective. Different random seeds reach different minima. Same data, same parameters, different pictures.

```r title="Two seeds, two layouts"
set.seed(10)
tsne_s1 <- Rtsne(iris_scaled, perplexity = 30, verbose = FALSE)

set.seed(99)
tsne_s2 <- Rtsne(iris_scaled, perplexity = 30, verbose = FALSE)

seed_df <- rbind(
  data.frame(x = tsne_s1$Y[, 1], y = tsne_s1$Y[, 2],
             species = iris$Species, seed = "seed = 10"),
  data.frame(x = tsne_s2$Y[, 1], y = tsne_s2$Y[, 2],
             species = iris$Species, seed = "seed = 99")
)

ggplot(seed_df, aes(x, y, color = species)) +
  geom_point(size = 1.2) +
  facet_wrap(~ seed, scales = "free") +
  labs(title = "Same data, two seeds")
#> Same three clusters, but rotated and reshaped between the two seeds.
```

The clusters survive (good: that tells you they're real). But their shapes, rotations and relative positions change. That is the signal you need: *only the cluster membership is robust*; *everything else is artifact*.

[WARNING]
**Different random seeds produce different layouts.** Always fix the seed with set.seed() in analysis scripts. Rerun with 2 or 3 different seeds to check that your cluster story is stable before making claims about it.

The second trap is harder to catch: cluster sizes and inter-cluster gaps on the page don't mean what you think. t-SNE's cost function equalizes cluster density, so a tight cluster of 200 points and a loose cluster of 10 points can appear the same size in the 2D plot. Here's a minimal demo.

```r title="Cluster sizes do not reflect reality"
set.seed(42)
blobs_x <- rbind(
  matrix(rnorm(200 * 5, mean = 0, sd = 0.1), ncol = 5),   # tight blob, 200 pts
  matrix(rnorm(200 * 5, mean = 10, sd = 5), ncol = 5)     # loose blob, 200 pts
)
blobs_tsne <- Rtsne(blobs_x, perplexity = 30, verbose = FALSE)
blobs_df <- data.frame(
  x = blobs_tsne$Y[, 1],
  y = blobs_tsne$Y[, 2],
  group = factor(rep(c("tight (sd=0.1)", "loose (sd=5)"), each = 200))
)

ggplot(blobs_df, aes(x, y, color = group)) +
  geom_point(size = 1.2) +
  labs(title = "Two blobs, very different spread, similar on page")
#> The two clouds look roughly the same size in the plot,
#> even though the loose blob is 50x wider in the raw data.
```

In the raw data, the loose blob has 50x the spread of the tight one. On the t-SNE page, they look similar. If you'd made decisions based on visual cluster diameter, you'd be wrong by a factor of 50. UMAP is slightly better here but has the same general failure mode.

[WARNING]
**Cluster sizes and inter-cluster gaps on the page are not meaningful.** The 2D coordinates let you spot who-neighbors-whom; they do not measure *how different* the clusters are. For that, go back to the original high-dimensional data and use a real metric.

Both pitfalls above share a cause. These methods are built to reveal *who is near whom*, not to quantify anything else. So the moment you start reading "the red cluster is twice as wide as the blue one" off a t-SNE plot, you have exited the range where the method's output means what you think it means.

The useful posture is to treat every t-SNE or UMAP plot as a hypothesis generator, never an answer. It suggests "there might be three groups here, and point X looks like it belongs with the red group." You then go back to the original numeric data and test that suggestion with a real clustering algorithm or a statistical test.

[KEY INSIGHT]
**t-SNE and UMAP are exploratory tools, never inferential ones.** Use them to form hypotheses; never to test them. Always confirm findings with the original data, statistical tests or a clustering algorithm applied to the raw matrix, not the 2D embedding.

**Try it:** Run Rtsne twice with seeds 10 and 99 on iris, then verify that the first point has different coordinates across the two runs.

```r title="Your turn: verify seed sensitivity"
# Run Rtsne on iris_scaled twice with different seeds
# Print the first row of each output matrix
# your code here

# Test: the two printed rows should differ numerically
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seed sensitivity solution"
set.seed(10); ex_tsne_s10 <- Rtsne(iris_scaled, perplexity = 30, verbose = FALSE)
set.seed(99); ex_tsne_s99 <- Rtsne(iris_scaled, perplexity = 30, verbose = FALSE)

cat("Seed 10, point 1:", ex_tsne_s10$Y[1, ], "\n")
cat("Seed 99, point 1:", ex_tsne_s99$Y[1, ], "\n")
#> Two different pairs of numbers; the layout has moved.
```

**Explanation:** The coordinates differ because the algorithm converges to different local minima of a non-convex objective. The cluster memberships are typically stable; the positions are not.

</details>

## When should you pick t-SNE vs UMAP?

The two methods solve the same problem with different trade-offs. Most projects can use either; the differences matter at the margins.

![A quick decision guide for picking between t-SNE and UMAP.](screenshots/t-SNE-and-UMAP-in-R-tsne-vs-umap-decision.webp)
*Figure 2: A quick decision guide for choosing between t-SNE and UMAP.*

Speed is the first lever. UMAP scales roughly linearly in sample size; Barnes-Hut t-SNE scales O(n log n) but with a much larger constant. On a few thousand rows they feel identical. On tens of thousands, UMAP is faster. On hundreds of thousands, t-SNE becomes painful.

```r title="Timing both on a 1000-row matrix"
set.seed(7)
bench_mat <- matrix(rnorm(1000 * 30), ncol = 30)

t_tsne <- system.time(Rtsne(bench_mat, perplexity = 30, verbose = FALSE))
t_umap <- system.time(umap::umap(bench_mat, n_neighbors = 15))

cat("Rtsne seconds:", round(t_tsne["elapsed"], 2), "\n")
cat("umap  seconds:", round(t_umap["elapsed"], 2), "\n")
#> umap is typically faster on this size; the gap widens with more rows.
```

At 1,000 rows and 30 columns, the two methods finish in comparable time. Scale this to 50,000 rows and UMAP wins by 10x or more. That's the first reason UMAP took over in biology and single-cell genomics: practitioners there routinely embed 100k+ points.

The second lever is global structure. UMAP's cost function pushes unrelated points apart more aggressively, so the large-scale layout (which cluster is near which) is more trustworthy than t-SNE's. t-SNE's strength is the opposite: it over-separates clusters, which looks clean but can exaggerate real gaps.

| Question | t-SNE (Rtsne) | UMAP (umap / uwot) |
|---|---|---|
| Speed on 50k rows | Slow (minutes) | Fast (seconds) |
| Global structure | Often distorted | Better preserved |
| Key knob | `perplexity` (5 to 50) | `n_neighbors` (5 to 50) |
| Seed reproducibility | `set.seed()` works | `set.seed()` works |
| Project new points | Not supported | `uwot::umap_transform()` |
| Output "look" | Soft, diffuse clouds | Compact island blobs |

[TIP]
**For over 50,000 rows, prefer UMAP.** Also prefer UMAP when you need to project new data onto the same embedding later, or when the relative positions of clusters matter to your story.

**Try it:** Use `system.time()` to time Rtsne and umap on a 300-row synthetic matrix. Which finished first?

```r title="Your turn: time both on 300 rows"
# Make a 300x20 matrix of rnorm, then time both methods
# your code here

# Test: print both elapsed times
```

<details>
<summary>Click to reveal solution</summary>

```r title="Timing 300 rows solution"
set.seed(5)
ex_bench_mat <- matrix(rnorm(300 * 20), ncol = 20)

ex_t1 <- system.time(Rtsne(ex_bench_mat, perplexity = 20, verbose = FALSE))
ex_t2 <- system.time(umap::umap(ex_bench_mat, n_neighbors = 15))

cat("Rtsne:", round(ex_t1["elapsed"], 2), "s\n")
cat("umap :", round(ex_t2["elapsed"], 2), "s\n")
#> Both complete in well under a second at this size.
```

**Explanation:** On small data, both methods are fast enough that the choice is cosmetic. The speed gap opens as `n` grows.

</details>

## Practice Exercises

### Exercise 1: Embed the attitude dataset

Scale the built-in `attitude` data set (30 rows, 7 columns of survey ratings), run Rtsne with `perplexity = 7`, run `umap::umap` with `n_neighbors = 7`, and plot both side by side. Save the side-by-side plot to `my_att_plot`.

```r title="Exercise 1 starter"
# Hint: scale() first, then run both methods, combine with patchwork

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
att_scaled <- scale(attitude)

set.seed(1)
my_att_tsne <- Rtsne(att_scaled, perplexity = 7, verbose = FALSE)
set.seed(1)
my_att_umap <- umap::umap(att_scaled, n_neighbors = 7, min_dist = 0.1)

p_a <- ggplot(data.frame(x = my_att_tsne$Y[, 1], y = my_att_tsne$Y[, 2]),
              aes(x, y)) + geom_point() + labs(title = "t-SNE (attitude)")
p_b <- ggplot(data.frame(x = my_att_umap$layout[, 1], y = my_att_umap$layout[, 2]),
              aes(x, y)) + geom_point() + labs(title = "UMAP (attitude)")

my_att_plot <- p_a + p_b
my_att_plot
#> Two scatterplots of 30 points each; both methods reveal 2 to 3 loose groupings.
```

**Explanation:** `perplexity = 7` and `n_neighbors = 7` are both below the default because `attitude` has only 30 rows. Rtsne requires `3 * perplexity < n - 1`, so anything above 9 would error.

</details>

### Exercise 2: Unified embedding function

Write a function `embed_2d(mat, method = c("tsne","umap"))` that scales the matrix internally, runs the chosen method, and returns a data frame with columns `x`, `y`, `method`. Then call it twice on `iris[, 1:4]` (once for each method), bind the results, and facet-plot the two embeddings.

```r title="Exercise 2 starter"
# Hint: match.arg() for the method argument; rbind the two outputs

embed_2d <- function(mat, method = c("tsne", "umap")) {
  # your code here
}

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
embed_2d <- function(mat, method = c("tsne", "umap")) {
  method <- match.arg(method)
  x_scaled <- scale(mat)
  set.seed(1)
  if (method == "tsne") {
    out <- Rtsne(x_scaled, perplexity = 30, verbose = FALSE)$Y
  } else {
    out <- umap::umap(x_scaled, n_neighbors = 15, min_dist = 0.1)$layout
  }
  data.frame(x = out[, 1], y = out[, 2], method = method)
}

df_tsne <- embed_2d(iris[, 1:4], "tsne")
df_umap <- embed_2d(iris[, 1:4], "umap")
df_both <- rbind(df_tsne, df_umap)
df_both$species <- rep(iris$Species, 2)

ggplot(df_both, aes(x, y, color = species)) +
  geom_point(size = 1.2) +
  facet_wrap(~ method, scales = "free") +
  labs(title = "Same data, both methods")
#> Two panels, three clusters each, different visual spacing per method.
```

**Explanation:** `match.arg()` validates the `method` argument against the allowed values, so a typo fails fast. Wrapping both methods behind a single function keeps downstream plotting code identical.

</details>

## Complete Example

A 500-row sample of the `diamonds` dataset has seven numeric columns (carat, depth, table, price, x, y, z) plus a `cut` label with five levels. We want to see whether the numeric features alone carry enough signal to separate diamonds by cut quality.

```r title="End-to-end on diamonds"
set.seed(3)
d_sample <- diamonds[sample(nrow(diamonds), 500), ]

# Keep numeric columns only, drop the rare-value-inflated 'table'
d_num <- d_sample[, c("carat", "depth", "price", "x", "y", "z")]
d_scaled <- scale(d_num)

set.seed(3)
d_tsne <- Rtsne(d_scaled, perplexity = 30, verbose = FALSE)
set.seed(3)
d_umap <- umap::umap(d_scaled, n_neighbors = 15, min_dist = 0.1)

d_df <- rbind(
  data.frame(x = d_tsne$Y[, 1],        y = d_tsne$Y[, 2],        cut = d_sample$cut, method = "t-SNE"),
  data.frame(x = d_umap$layout[, 1],   y = d_umap$layout[, 2],   cut = d_sample$cut, method = "UMAP")
)

ggplot(d_df, aes(x, y, color = cut)) +
  geom_point(size = 1, alpha = 0.7) +
  facet_wrap(~ method, scales = "free") +
  labs(title = "t-SNE and UMAP of diamonds (numeric features, 500-row sample)")
#> Both panels show a main mass of points; cut labels do NOT form clean clusters.
```

This is a useful negative result. The numeric features of a diamond (size, price, shape) do not carry enough information to separate diamonds by `cut` quality. The cut label is mostly orthogonal to those numeric columns. If your plot looks like this, with points thoroughly mixed by color, the conclusion is that the features you used don't explain the label you colored by, not that t-SNE or UMAP failed. That interpretation check is the most valuable part of running these embeddings.

## Summary

![Overview of what t-SNE and UMAP do, their key knobs, and common traps.](screenshots/t-SNE-and-UMAP-in-R-overview-mindmap.webp)
*Figure 3: Overview of what both methods do, their key knobs, and common traps.*

| Question | t-SNE (Rtsne) | UMAP (umap / uwot) |
|---|---|---|
| What's the R call? | `Rtsne(x, perplexity = 30)` | `umap::umap(x, n_neighbors = 15)` |
| Main knob | `perplexity` (5 to 50) | `n_neighbors` (5 to 50) |
| Secondary knob | `max_iter`, `theta` | `min_dist`, `metric` |
| Global structure | Often distorted | Better preserved |
| Speed on large n | Slower | Faster |
| Seed behavior | Stochastic, fix with `set.seed()` | Stochastic, fix with `set.seed()` |
| New-point projection | Not supported | `uwot::umap_transform()` |
| Good default for n < 5k | Either works | Either works |
| Good default for n > 50k | Avoid | Prefer |

Rules of thumb to keep:

1. Always `scale()` the columns first.
2. Always `set.seed()` before the call, and try 2 to 3 seeds.
3. Always try 3 to 5 values of the main knob (perplexity or n_neighbors).
4. Never interpret cluster sizes or inter-cluster distances as meaningful.
5. Confirm any cluster story with a separate method on the raw data.

## References

1. Van der Maaten, L. & Hinton, G. (2008). Visualizing Data using t-SNE. *Journal of Machine Learning Research*, 9: 2579-2605. [PDF](https://www.jmlr.org/papers/volume9/vandermaaten08a/vandermaaten08a.pdf)
2. McInnes, L., Healy, J., & Melville, J. (2018). UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction. *arXiv:1802.03426*. [Link](https://arxiv.org/abs/1802.03426)
3. Krijthe, J. H. Rtsne: R wrapper for Barnes-Hut t-SNE. [GitHub](https://github.com/jkrijthe/Rtsne)
4. Konopka, T. umap package on CRAN. [Link](https://cran.r-project.org/package=umap)
5. Melville, J. uwot package: R implementation of UMAP. [GitHub](https://github.com/jlmelville/uwot)
6. Wattenberg, M., Viégas, F., & Johnson, I. (2016). How to Use t-SNE Effectively. *Distill*. [Link](https://distill.pub/2016/misread-tsne/)
7. Coenen, A. & Pearce, A. Understanding UMAP. *Google PAIR*. [Link](https://pair-code.github.io/understanding-umap/)

## Continue Learning

- [PCA with prcomp()](PCA-in-R.html): the linear sibling of these methods; always start there before reaching for a nonlinear embedding.
- [Clustering in R: k-Means, Hierarchical, DBSCAN](Cluster-Analysis-in-R.html): once the embedding suggests groups, confirm them with a clustering algorithm on the raw data.
- [Linear Discriminant Analysis in R](Linear-Discriminant-Analysis-in-R.html): the supervised alternative when you already know the labels and want to maximize class separation.
