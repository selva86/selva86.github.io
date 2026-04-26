---
title: "DBSCAN Clustering in R: Density-Based Clustering for Non-Convex Shapes"
slug: DBSCAN-Clustering-in-R
description: "Learn DBSCAN clustering in R to find non-convex clusters and noise without picking k. Tune eps with kNNdistplot, run dbscan(), and interpret results."
keywords: "DBSCAN R, dbscan package R, density-based clustering R, kNNdistplot, eps minPts, non-convex clusters, noise detection, dbscan() function"
auto_link_terms: "DBSCAN clustering in R|DBSCAN in R|dbscan()|kNNdistplot()|density-based clustering|eps parameter|core points|noise points"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-26
curriculum_id: "FR-mult-7"
post_type: FR
fr_parent: Cluster-Analysis-in-R.html
difficulty: Intermediate
---

# DBSCAN Clustering in R: Density-Based Clustering for Non-Convex Shapes

<p class="lead">DBSCAN groups dense regions of points into clusters of any shape and labels everything sparse as noise, so you do not have to pick the cluster count <code>k</code> upfront. This tutorial uses the <code>dbscan</code> package in R to fit DBSCAN on non-convex data, tune <code>eps</code> and <code>minPts</code>, and read the noise points correctly.</p>

## Why does DBSCAN beat k-Means on non-convex shapes?

k-Means draws round, balanced clusters, so it falls apart on rings, moons, or any group that is long and curvy. DBSCAN looks at density instead: where points are packed close together, they belong to the same cluster, and where the data thins out, those points get flagged as noise. Let's see this difference on `multishapes`, a small demo dataset whose groups are deliberately non-spherical.

```r title="Fit DBSCAN on multishapes"
# Libraries persist across all blocks on this page
library(dbscan)
library(factoextra)

shapes <- multishapes[, 1:2]   # drop the true label
db <- dbscan(shapes, eps = 0.15, minPts = 5)
db
#> DBSCAN clustering for 1100 objects.
#> Parameters: eps = 0.15, minPts = 5
#> Using euclidean distances and borderpoints = TRUE
#> The clustering contains 5 cluster(s) and 31 noise points.
```

DBSCAN found five clusters and tagged 31 points as noise, with no `k` specified anywhere. The same data given to `kmeans(shapes, centers = 5)` would slice the moons in half because k-Means insists on convex, equal-spread groups. DBSCAN follows the dense trail instead.

[TIP]
**Always scale numeric features before DBSCAN unless they share a unit.** Distances drive the algorithm, so a column measured in thousands silently dominates one measured in single digits. Use `scale()` first if your columns are on different scales.

**Try it:** Run DBSCAN on the four numeric columns of `iris` with `eps = 0.5` and `minPts = 5`. Print the result to see how many clusters and noise points it finds.

```r title="Your turn: DBSCAN on iris"
# Fit DBSCAN on the iris numeric columns
ex_iris <- iris[, 1:4]
ex_db1 <- # your code here

ex_db1
#> Expected: 2 clusters and a small number of noise points
```

<details>
<summary>Click to reveal solution</summary>

```r title="DBSCAN on iris solution"
ex_iris <- iris[, 1:4]
ex_db1 <- dbscan(ex_iris, eps = 0.5, minPts = 5)
ex_db1
#> DBSCAN clustering for 150 objects.
#> Parameters: eps = 0.5, minPts = 5
#> The clustering contains 2 cluster(s) and 17 noise points.
```

**Explanation:** DBSCAN merges versicolor and virginica into one cluster because they overlap in petal/sepal space at this `eps`. Tightening `eps` would split them at the cost of more noise.

</details>

## How does DBSCAN classify each point as core, border, or noise?

DBSCAN gives every point one of three roles. A **core point** has at least `minPts` neighbors within distance `eps`. A **border point** sits inside the `eps`-neighborhood of a core point but does not itself have enough neighbors to be core. Anything else is **noise** and gets cluster label `0`.

![DBSCAN classifies every point as core, border, or noise based on its eps-neighborhood.](screenshots/DBSCAN-Clustering-in-R-point-types.webp)
*Figure 1: DBSCAN classifies every point as core, border, or noise based on its eps-neighborhood.*

The result object stores the cluster label for each row and exposes a helper for the core/border split, so you can inspect the breakdown directly.

```r title="Inspect core, border, and noise"
core_flags <- is.corepoint(shapes, eps = 0.15, minPts = 5)

# Counts: TRUE = core, FALSE = border or noise
table(core_flags)
#> core_flags
#> FALSE  TRUE
#>   116   984

# Cluster labels: 0 means noise, 1..5 are real clusters
table(db$cluster)
#>   0   1   2   3   4   5
#>  31 408 401 105  92  63
```

Most points are core, a small ring of border points hugs the edges of each cluster, and 31 noise points are scattered outside any dense region. The cluster numbers themselves are arbitrary identifiers, the only special label is `0` for noise.

[KEY INSIGHT]
**Cluster `0` is always noise, real clusters start at `1`.** This is the opposite of `kmeans()`, which numbers clusters from `1` and never labels anything as outlier. Forgetting this leads to off-by-one bugs when you summarize results by cluster.

**Try it:** Use `table(db$cluster)` to compute how many points sit in cluster 1 alone. Save it to `ex_counts`.

```r title="Your turn: count cluster 1 points"
ex_counts <- # your code here

ex_counts
#> Expected: a single number, the count of cluster 1 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count cluster 1 points solution"
ex_counts <- sum(db$cluster == 1)
ex_counts
#> [1] 408
```

**Explanation:** A logical comparison gives `TRUE`/`FALSE`, and `sum()` treats those as `1`/`0`, giving you the count in one line.

</details>

## How do you choose eps with kNNdistplot()?

The whole tutorial used `eps = 0.15` without explanation. Here is how that number is picked. The `dbscan` package ships a helper, `kNNdistplot()`, that plots the distance from every point to its k-th nearest neighbor, sorted from smallest to largest. Where the curve bends sharply upward, you have crossed the boundary between dense (cluster) and sparse (noise) regions, that is a good `eps`.

The standard rule for `minPts` is "data dimensionality plus 1", with a minimum of 3. Once `minPts` is fixed, plot the k-NN distance with `k = minPts - 1`.

![The tuning workflow: choose minPts, then read eps off the kNN-distance elbow.](screenshots/DBSCAN-Clustering-in-R-tuning-flow.webp)
*Figure 2: The tuning workflow: choose minPts, then read eps off the kNN-distance elbow.*

```r title="kNN distance plot to pick eps"
# minPts = 5, so plot k = 4
kNNdistplot(shapes, k = 4)
abline(h = 0.15, col = "red", lty = 2)
```

The y-axis is the distance to the 4th nearest neighbor for each point. Up to about y = 0.15, the curve is almost flat, those are core-region points whose neighbors are nearby. Past 0.15 it bends sharply upward, meaning the next handful of points are far from anything else, exactly the noise we want excluded. Reading the elbow off the dashed line gives `eps = 0.15`.

[WARNING]
**An eps that is too small produces mostly noise, too large produces one giant cluster.** If `dbscan()` returns 0 noise and 1 cluster, drop `eps`. If it returns 90% noise, raise `eps` or lower `minPts`.

**Try it:** Increase `minPts` to 10, plot `kNNdistplot(shapes, k = 9)`, and visually estimate the new elbow. Save your read-off as `ex_kdist`.

```r title="Your turn: re-tune eps for minPts=10"
# Plot the k-NN distance and pick eps
kNNdistplot(shapes, k = 9)
ex_kdist <- # your read-off here, a single number

ex_kdist
#> Expected: a number a bit larger than 0.15
```

<details>
<summary>Click to reveal solution</summary>

```r title="Re-tune eps solution"
kNNdistplot(shapes, k = 9)
abline(h = 0.18, col = "red", lty = 2)
ex_kdist <- 0.18
ex_kdist
#> [1] 0.18
```

**Explanation:** A higher `minPts` requires more neighbors to qualify as core, so the elbow shifts to a slightly larger distance. Around 0.18 is a reasonable read for `k = 9` here.

</details>

## What does the noise label actually mean and should you keep it?

Noise points are not always errors. DBSCAN labels a point as noise when it sits in a sparse region under the current `eps`. That covers genuine outliers (bad sensor reads, fraud), but it also covers small real groups that happen to be less dense than the bulk. Looking at where the noise lands tells you which case you are in.

```r title="Plot noise vs cluster points"
library(ggplot2)

shapes_plot <- shapes
shapes_plot$cluster <- factor(db$cluster)

ggplot(shapes_plot, aes(x, y, colour = cluster)) +
  geom_point(size = 1) +
  scale_colour_manual(values = c("0" = "grey60", "1" = "#E41A1C",
                                 "2" = "#377EB8", "3" = "#4DAF4A",
                                 "4" = "#984EA3", "5" = "#FF7F00")) +
  labs(title = "DBSCAN on multishapes (grey = noise)") +
  theme_minimal()
```

The grey points sit between clusters and on the outer fringe of each ring, exactly where you would expect "transition zone" data. Some are likely genuine outliers, others are points the current `eps` could not reach. Before throwing them out, retune `eps` and see if the count drops, if it does, those points were just under-included, not anomalies.

[NOTE]
**Noise count is sensitive to `eps`, retune before discarding.** Doubling `eps` from 0.15 to 0.30 typically cuts the noise count by half or more. Use noise count as a tuning signal, not a hard verdict on each row.

**Try it:** Filter the noise rows out of `multishapes` using `db$cluster == 0` and report how many rows result. Save the filtered data frame to `ex_noise`.

```r title="Your turn: extract noise rows"
ex_noise <- # your code here

nrow(ex_noise)
#> Expected: 31
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract noise rows solution"
ex_noise <- shapes[db$cluster == 0, ]
nrow(ex_noise)
#> [1] 31
```

**Explanation:** Logical subsetting with `db$cluster == 0` picks the rows DBSCAN flagged as noise, matching the count printed by `db`.

</details>

## When does DBSCAN fail and what is HDBSCAN?

DBSCAN's weak spot is varying density. A single `eps` cannot fit both a tight cluster and a loose one in the same dataset, you either over-merge the loose one or fragment the tight one. HDBSCAN ("hierarchical DBSCAN") fixes this by considering many `eps` values at once and extracting the most stable clusters across that hierarchy. There is no `eps` to tune, only `minPts`.

```r title="Compare DBSCAN with HDBSCAN"
hdb <- hdbscan(shapes, minPts = 5)
hdb
#> HDBSCAN clustering for 1100 objects.
#> Parameters: minPts = 5
#> The clustering contains 5 cluster(s) and 24 noise points.

table(hdb$cluster)
#>   0   1   2   3   4   5
#>  24 410 405 110  90  61
```

HDBSCAN finds the same five shapes but with slightly fewer noise points, because it can pick a tighter density threshold for each cluster individually. On uniform-density data like `multishapes`, the two algorithms agree closely, but on real datasets where some clusters are dense and others diffuse, HDBSCAN usually wins.

[KEY INSIGHT]
**HDBSCAN replaces `eps` with a density hierarchy, so you only tune `minPts`.** This makes it the safer default when you do not know whether your clusters share a density. Reach for plain DBSCAN when you want a fast, deterministic baseline you can fully explain.

**Try it:** Refit HDBSCAN on `shapes` with `minPts = 15` and report how many clusters it returns. Save the model to `ex_hdb`.

```r title="Your turn: HDBSCAN with minPts=15"
ex_hdb <- # your code here

length(unique(ex_hdb$cluster)) - 1   # subtract the noise label
#> Expected: a small integer (cluster count)
```

<details>
<summary>Click to reveal solution</summary>

```r title="HDBSCAN minPts=15 solution"
ex_hdb <- hdbscan(shapes, minPts = 15)
length(unique(ex_hdb$cluster)) - 1
#> [1] 5
```

**Explanation:** Higher `minPts` makes each cluster require more support before it counts, often reducing cluster count and raising noise. Here the five real shapes still survive.

</details>

## Practice Exercises

### Exercise 1: Fit DBSCAN on iris with a tuned eps

Scale the four numeric columns of `iris`, use `kNNdistplot()` with `k = 4` to read an elbow, fit DBSCAN with that `eps` and `minPts = 5`, and report the cluster + noise counts. Save the model to `my_db`.

```r title="Exercise 1: tuned DBSCAN on iris"
# Hint: scale() first, then kNNdistplot(), then dbscan()

my_iris <- # your scaled data
# kNNdistplot(my_iris, k = 4)
my_db <- # your dbscan() call

table(my_db$cluster)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_iris <- scale(iris[, 1:4])
kNNdistplot(my_iris, k = 4)
abline(h = 0.7, col = "red", lty = 2)
my_db <- dbscan(my_iris, eps = 0.7, minPts = 5)
table(my_db$cluster)
#>   0   1   2
#>  32  49  69
```

**Explanation:** After scaling, the elbow sits near 0.7. DBSCAN finds 2 clusters (one is `setosa`, the other merges `versicolor` and `virginica`) and flags 32 transition points as noise.

</details>

### Exercise 2: Sweep eps to find the cleanest split on multishapes

Try `eps` values `c(0.10, 0.15, 0.20, 0.30)` at `minPts = 5` on `shapes`. For each value, record the cluster count and the noise count in a data frame called `my_sweep`. Identify the `eps` that gives roughly 5 clusters with the smallest noise count.

```r title="Exercise 2: eps sweep"
# Hint: sapply() over the eps values, build a data frame at the end

eps_grid <- c(0.10, 0.15, 0.20, 0.30)
my_sweep <- # your data frame with eps, n_clusters, n_noise

print(my_sweep)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
eps_grid <- c(0.10, 0.15, 0.20, 0.30)
results <- lapply(eps_grid, function(e) {
  fit <- dbscan(shapes, eps = e, minPts = 5)
  data.frame(eps = e,
             n_clusters = length(unique(fit$cluster[fit$cluster > 0])),
             n_noise = sum(fit$cluster == 0))
})
my_sweep <- do.call(rbind, results)
print(my_sweep)
#>    eps n_clusters n_noise
#> 1 0.10          7     158
#> 2 0.15          5      31
#> 3 0.20          5      11
#> 4 0.30          1       0
```

**Explanation:** Tiny `eps` over-fragments and labels too much as noise, large `eps` collapses everything into a single blob. `eps = 0.20` gives 5 clusters with only 11 noise points, the cleanest split for this data.

</details>

## Complete Example

The end-to-end DBSCAN workflow on `multishapes`, in one narrative.

```r title="Full DBSCAN workflow"
library(dbscan)
library(factoextra)
library(ggplot2)

# 1. Load data and drop the true label
full_shapes <- multishapes[, 1:2]

# 2. Tune eps via kNNdistplot
kNNdistplot(full_shapes, k = 4)
abline(h = 0.15, col = "red", lty = 2)

# 3. Fit DBSCAN with the chosen eps
final_db <- dbscan(full_shapes, eps = 0.15, minPts = 5)
final_db
#> DBSCAN clustering for 1100 objects.
#> Parameters: eps = 0.15, minPts = 5
#> The clustering contains 5 cluster(s) and 31 noise points.

# 4. Inspect cluster sizes and noise count
table(final_db$cluster)
#>   0   1   2   3   4   5
#>  31 408 401 105  92  63

# 5. Visualize
fviz_cluster(list(data = full_shapes, cluster = final_db$cluster),
             geom = "point", ellipse = FALSE,
             show.clust.cent = FALSE,
             palette = "Set1", ggtheme = theme_minimal())

# 6. If varying density is suspected, switch to HDBSCAN
final_hdb <- hdbscan(full_shapes, minPts = 5)
table(final_hdb$cluster)
```

Read the output bottom-up: HDBSCAN gave the safety check, the visualization confirmed the five non-convex shapes, and the noise count of 31 (out of 1100) is small enough to trust the rest of the cluster assignments. This is the workflow you can drop on any new numeric dataset.

## Summary

| Property | k-Means | DBSCAN | HDBSCAN |
|---|---|---|---|
| Need to specify k | Yes | No | No |
| Cluster shape | Convex only | Any (density-based) | Any (density-based) |
| Detects outliers | No | Yes (label `0`) | Yes (label `0`) |
| Tunable parameters | `centers` | `eps`, `minPts` | `minPts` |
| Handles varying density | Poorly | Poorly (single `eps`) | Well |
| Speed (n = 10k) | Fastest | Fast | Slower |

Use DBSCAN when your clusters are non-convex and roughly the same density. Use HDBSCAN when densities differ. Reach for k-Means only when you already know `k` and your clusters are convex blobs.

## References

1. Hahsler, M., Piekenbrock, M., & Doran, D. (2019). *dbscan: Fast Density-Based Clustering with R*. Journal of Statistical Software, 91(1). [Link](https://www.jstatsoft.org/article/view/v091i01)
2. Ester, M., Kriegel, H.-P., Sander, J., & Xu, X. (1996). *A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise*. KDD-96. [Link](https://cdn.aaai.org/KDD/1996/KDD96-037.pdf)
3. dbscan package on CRAN. [Link](https://cran.r-project.org/package=dbscan)
4. Hahsler, M. *dbscan vignette: Fast Density-based Clustering with R*. [Link](https://cran.r-project.org/web/packages/dbscan/vignettes/dbscan.pdf)
5. Campello, R. J. G. B., Moulavi, D., & Sander, J. (2013). *Density-Based Clustering Based on Hierarchical Density Estimates* (HDBSCAN). PAKDD. [Link](https://link.springer.com/chapter/10.1007/978-3-642-37456-2_14)
6. Datanovia. *DBSCAN: Density-Based Clustering Essentials*. [Link](https://www.datanovia.com/en/lessons/dbscan-density-based-clustering-essentials/)
7. STHDA. *DBSCAN: density-based clustering for discovering clusters with noise*. [Link](https://www.sthda.com/english/wiki/wiki.php?id_contents=7940)

## Continue Learning

- [Clustering in R: k-Means vs Hierarchical vs DBSCAN](Cluster-Analysis-in-R.html) — the parent guide that compares all three algorithms side by side on the same data.
- [PCA in R](PCA-in-R.html) — reduce high-dimensional data to 2 or 3 components first, then cluster, especially useful when DBSCAN's distance computation slows down.
- [Interpreting PCA Results in R](Interpreting-PCA-Results-in-R.html) — make sense of the components you feed into DBSCAN, so the resulting clusters have a story.
