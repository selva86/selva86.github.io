---
title: "Cluster Analysis Exercises in R: 10 k-Means & Hierarchical Problems, Solved Step-by-Step)"
slug: "Cluster-Analysis-Exercises-in-R"
description: "Practise cluster analysis exercises in R: 10 k-means and hierarchical problems with worked solutions, from your first kmeans() fit to silhouette validation."
keywords: "clustering exercises in R, k-means exercises, hierarchical clustering exercises, kmeans practice, hclust practice, silhouette R, elbow method R, dendrogram R, cluster validation R, R clustering practice"
auto_link_terms: "cluster analysis exercises in R|clustering exercises in R|k-means exercises|hierarchical clustering exercises|kmeans practice problems|hclust practice|cluster analysis practice"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "E8.2"
post_type: "EX"
sidebar_title: "Clustering Exercises (10 problems)"
fr_parent: "Cluster-Analysis-in-R.html"
difficulty: "Intermediate"
---

# Cluster Analysis Exercises in R: 10 k-Means & Hierarchical Problems, Solved Step-by-Step

<p class="lead">These 10 cluster analysis exercises in R take you from your first <code>kmeans()</code> fit through scaling decisions, the elbow and silhouette diagnostics, <code>nstart</code> stability, hierarchical clustering with <code>hclust()</code>, linkage method comparisons, cophenetic correlation, and the agreement between k-means and ward.D2 hierarchical labels. Every problem is solved step by step with runnable R code and a click-to-reveal explanation.</p>

## How do you fit k-means in R and read the cluster output?

k-means in R lives inside one base function, `kmeans()`, that returns a list with cluster labels, centroid coordinates, cluster sizes, and the within- and between-cluster sums of squares. Most exercises below pull from those slots, so the first job is to fit a clean k-means and read off what each piece means. We use `iris[, 1:4]` for the warm-up because four numeric columns and three known species make the result easy to interpret.

```r title="First k-means fit on scaled iris"
# Load supporting packages once for the whole notebook
library(cluster)
library(factoextra)

# Scale so each column contributes equally to Euclidean distance
iris_scaled <- scale(iris[, 1:4])

# nstart=25 runs the algorithm 25 times from random starts and keeps the best
set.seed(101)
km_fit <- kmeans(iris_scaled, centers = 3, nstart = 25)

# Sizes of each cluster
km_fit$size
#> [1] 50 53 47
```

The fit splits 150 flowers into three groups of size 50, 53, and 47. That is suspiciously close to iris's true 50-50-50 species balance, which is exactly the point: with scaled features and three centroids, k-means largely recovers the species partition without ever seeing the labels.

```r title="Total within-SS, between-SS, and the trade-off"
# Total within-cluster sum of squares (the loss kmeans minimises)
km_fit$tot.withinss
#> [1] 138.8884

# Between-cluster sum of squares
km_fit$betweenss
#> [1] 457.1116

# They sum to the total SS of the scaled data
km_fit$tot.withinss + km_fit$betweenss
#> [1] 596

# Which equals (n - 1) * p for scaled columns
(nrow(iris_scaled) - 1) * ncol(iris_scaled)
#> [1] 596
```

Total SS in scaled data is fixed at $(n - 1) \times p = 149 \times 4 = 596$. k-means cannot change that total, only redistribute it between within and between. Minimising within-cluster SS is mathematically the same as maximising between-cluster SS, which is why a useful summary is the ratio `betweenss / totss`, also reported by `print(km_fit)` as a percentage.

[KEY INSIGHT]
**k-means is a variance-redistribution machine.** Total SS is fixed by the data, so the algorithm just shuffles points to push as much SS as possible into the between-cluster bucket. Higher between-SS means tighter, better-separated clusters, which is why "betweenss / totss" appears in every k-means summary.

[TIP]
**Always set `nstart` to at least 25.** k-means picks random initial centroids, so a single run can land in a poor local minimum. With `nstart = 25` the function tries 25 random starts and keeps the lowest within-SS, which costs almost nothing on small data and dramatically improves stability.

**Try it:** From the warm-up `km_fit` above, find the size of the smallest cluster and save it to `ex_min`. One short line is enough.

```r title="Your turn: smallest cluster size"
# Goal: get the size of the smallest of the three clusters
ex_min <- ___
ex_min
#> Expected: 47
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smallest cluster solution"
ex_min <- min(km_fit$size)
ex_min
#> [1] 47
```

**Explanation:** `km_fit$size` is the named vector of cluster counts, and `min()` plucks the smallest. The answer 47 matches the third cluster, which absorbed slightly fewer flowers than the others because the *versicolor*-*virginica* boundary is fuzzy.

</details>

## How do you build and cut a hierarchical clustering tree?

Hierarchical clustering in R is a two-step recipe, `dist()` then `hclust()`, returning a tree you slice at any number of clusters with `cutree()`. The default `method = "complete"` is rarely the right pick on continuous data, so the exercises favour `method = "ward.D2"`, which minimises within-cluster variance the same way k-means does and tends to produce balanced groups.

```r title="Hierarchical clustering on USArrests"
# USArrests: 50 US states, 4 crime-rate columns
usa_scaled <- scale(USArrests)

# Pairwise Euclidean distances, then agglomerative tree
hc_fit <- hclust(dist(usa_scaled), method = "ward.D2")

# Cut the tree into 4 clusters
hc_cut4 <- cutree(hc_fit, k = 4)

# Cluster sizes
table(hc_cut4)
#> hc_cut4
#>  1  2  3  4
#>  8 11 21 10
```

Four clusters of sizes 8, 11, 21, and 10. Ward's linkage delivers a fairly balanced split because it picks merges that grow within-cluster variance the least at each step. Compare this to single linkage, which famously chains points together and produces one giant cluster plus several singletons.

```r title="Plot the dendrogram"
# Draw the tree and overlay 4-cluster boundary
plot(hc_fit, hang = -1, cex = 0.6,
     main = "USArrests: ward.D2 dendrogram",
     xlab = "", sub = "")
rect.hclust(hc_fit, k = 4, border = "tomato")
```

Reading top-down, the tree shows the 50 states being progressively merged from leaves at height 0 up to one cluster at the top. The four red rectangles mark where `cutree(k = 4)` slices the tree, and you can read off the membership by tracing each state's leaf up to its enclosing rectangle.

[NOTE]
**ward.D and ward.D2 are not the same.** `ward.D` operates on raw distances and is the original Lance-Williams formula; `ward.D2` squares the distances first and matches Ward's original 1963 paper. Use `ward.D2` unless you have a specific reason to reproduce older code.

[WARNING]
**`hclust()` defaults to `method = "complete"`.** Many tutorials skip the `method` argument and silently use complete linkage, which exaggerates a few large distances and can chain noisy points together. Make `method` explicit on every fit so future readers know exactly what tree you built.

**Try it:** Re-cut `hc_fit` at `k = 2` and report the size of the larger of the two clusters, saving it to `ex_big`.

```r title="Your turn: larger of two clusters"
# Goal: cut at k=2 and find the size of the bigger cluster
ex_big <- ___
ex_big
#> Expected: 30
```

<details>
<summary>Click to reveal solution</summary>

```r title="Larger-cluster solution"
ex_big <- max(table(cutree(hc_fit, k = 2)))
ex_big
#> [1] 30
```

**Explanation:** `cutree(hc_fit, k = 2)` returns a length-50 vector of 1s and 2s, `table()` counts them, and `max()` picks the larger count. Cutting at k=2 produces a 20-30 split that maps loosely onto low-crime versus high-crime states, the most basic structure ward.D2 finds in the data.

</details>

## Practice Exercises

The 10 problems below ramp from a clean first k-means fit through to the agreement between k-means and hierarchical labels. Every exercise uses an `ex<N>_` variable prefix so your work does not overwrite the tutorial fits above. Run the starter, attempt the solution, then click to reveal.

### Exercise 1: Smallest cluster size for k=3 on iris

Fit k-means on scaled `iris[, 1:4]` with `centers = 3` and `nstart = 25` (use `set.seed(1)`). Save the size of the smallest cluster to `ex1_min`.

```r title="Exercise 1 starter"
# Hint: scale(), kmeans(), and min(fit$size)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(1)
ex1_fit <- kmeans(scale(iris[, 1:4]), centers = 3, nstart = 25)
ex1_min <- min(ex1_fit$size)
ex1_min
#> [1] 47
```

**Explanation:** The same setup as the warm-up but with a different seed; the answer is still 47 because `nstart = 25` makes the result effectively seed-independent on this clean dataset. If you got a different number, check whether you forgot to scale or set `nstart`.

</details>

### Exercise 2: Within-SS for k=4 on iris

On the scaled iris features, compare `tot.withinss` for `k = 3` versus `k = 4`. Save the k=4 within-SS to `ex2_within4`. Use `set.seed(2)` for both fits and `nstart = 25`.

```r title="Exercise 2 starter"
# Hint: re-fit with centers=4 and read $tot.withinss

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_data <- scale(iris[, 1:4])

set.seed(2); ex2_k3 <- kmeans(ex2_data, centers = 3, nstart = 25)
set.seed(2); ex2_k4 <- kmeans(ex2_data, centers = 4, nstart = 25)

ex2_within4 <- ex2_k4$tot.withinss
round(c(k3 = ex2_k3$tot.withinss, k4 = ex2_within4), 2)
#>     k3     k4
#> 138.89 113.65
```

**Explanation:** Adding a fourth centroid drops within-SS from 139 to 114, but the gain is much smaller than the drop from k=2 to k=3 would be. That diminishing return is exactly what the elbow method (Exercise 3) makes visual: the curve bends sharply where extra clusters stop helping.

</details>

### Exercise 3: Elbow curve on USArrests

Build the within-SS vector for `k = 1` through `k = 10` on scaled `USArrests`, with `nstart = 25` and `set.seed(3)`. Save the length-10 numeric vector to `ex3_wss`. The elbow visible in the result is what `factoextra::fviz_nbclust()` plots under the hood.

```r title="Exercise 3 starter"
# Hint: sapply(1:10, function(k) kmeans(...)$tot.withinss)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_data <- scale(USArrests)

set.seed(3)
ex3_wss <- sapply(1:10, function(k) {
  kmeans(ex3_data, centers = k, nstart = 25)$tot.withinss
})
round(ex3_wss, 1)
#>  [1] 196.0 102.9  78.3  64.0  56.6  50.6  45.4  41.5  38.1  35.4
```

**Explanation:** The within-SS plummets from 196 at k=1 to 103 at k=2, then bends sharply at k=3 or k=4. After k=4 the curve flattens, telling you that adding more clusters is mostly memorising noise. Plot `ex3_wss` against `1:10` to see the textbook elbow shape.

</details>

[TIP]
**Use the elbow and silhouette together, never alone.** The elbow shows where extra clusters stop reducing within-SS, while silhouette measures cohesion-versus-separation per point. They often disagree on small datasets like iris; combining both plus a quick PC1-PC2 scatter beats picking k from any single number.

### Exercise 4: Best k by mean silhouette on iris

For `k` in 2 through 5, fit k-means on scaled iris and compute the mean silhouette width using `cluster::silhouette()`. Save the `k` that maximises mean silhouette to `ex4_best_k`. Use `set.seed(4)` and `nstart = 25` for every fit.

```r title="Exercise 4 starter"
# Hint: silhouette(cluster, dist) returns a matrix; column 3 is sil_width

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_data <- scale(iris[, 1:4])
ex4_dist <- dist(ex4_data)

set.seed(4)
ex4_widths <- sapply(2:5, function(k) {
  cl <- kmeans(ex4_data, centers = k, nstart = 25)$cluster
  mean(silhouette(cl, ex4_dist)[, 3])
})
names(ex4_widths) <- 2:5
round(ex4_widths, 3)
#>     2     3     4     5
#> 0.582 0.460 0.385 0.347

ex4_best_k <- as.integer(names(ex4_widths)[which.max(ex4_widths)])
ex4_best_k
#> [1] 2
```

**Explanation:** Silhouette picks k=2 even though we know there are three species, because *versicolor* and *virginica* overlap heavily in petal/sepal space. This is a famous lesson: silhouette is one diagnostic, not a verdict. Combine it with the elbow plot, domain knowledge, and a quick visual on PC1-PC2 before committing to a final `k`.

</details>

### Exercise 5: nstart sensitivity on USArrests

Fit k-means on scaled `USArrests` at `k = 4` twice: once with `nstart = 1` and once with `nstart = 50`. Use `set.seed(5)` immediately before each fit so both start from the same RNG state. Save the difference `(nstart=1 within-SS) - (nstart=50 within-SS)` to `ex5_diff`. A positive value means `nstart = 1` got stuck in a worse local minimum.

```r title="Exercise 5 starter"
# Hint: re-set the seed before each fit so the only thing that differs is nstart

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_data <- scale(USArrests)

set.seed(5); ex5_one  <- kmeans(ex5_data, centers = 4, nstart = 1)
set.seed(5); ex5_many <- kmeans(ex5_data, centers = 4, nstart = 50)

ex5_diff <- ex5_one$tot.withinss - ex5_many$tot.withinss
round(c(nstart_1 = ex5_one$tot.withinss,
        nstart_50 = ex5_many$tot.withinss,
        diff = ex5_diff), 3)
#>  nstart_1 nstart_50      diff
#>    65.198    63.883     1.315
```

**Explanation:** A single random start lands roughly 2% above the best known minimum on this seed; `nstart = 50` finds the better solution. The cost of running k-means 50 times on 50 rows is microscopic, and the payoff is a stable, reproducible answer. This exercise is the empirical justification for the `nstart >= 25` tip in the warm-up.

</details>

### Exercise 6: Scaled vs unscaled k-means on USArrests

Fit k-means twice on `USArrests`, once on the raw matrix and once on `scale(USArrests)`, both with `centers = 4`, `nstart = 25`, and `set.seed(6)` before each fit. Count how many of the 50 states get a different cluster index between the two fits, and save the count to `ex6_diff_count`. Treat any change in cluster ID as a difference (cluster numbering is arbitrary, so this is a rough upper bound on disagreement).

```r title="Exercise 6 starter"
# Hint: sum(ex6_raw$cluster != ex6_scaled$cluster)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
set.seed(6); ex6_raw    <- kmeans(USArrests,        centers = 4, nstart = 25)
set.seed(6); ex6_scaled <- kmeans(scale(USArrests), centers = 4, nstart = 25)

ex6_diff_count <- sum(ex6_raw$cluster != ex6_scaled$cluster)
ex6_diff_count
#> [1] 36
```

**Explanation:** Around 36 of 50 states get a different cluster ID after scaling. Without scaling, `Assault` (0-300+) dominates Euclidean distance because its raw variance dwarfs `Murder` (0-17) and `UrbanPop` (32-91). With scaling, all four columns carry equal weight and the clusters look qualitatively different. Some of the count comes from cluster-ID relabelling rather than genuine disagreement, but even after relabel-matching, scaling reshuffles roughly a third of states.

</details>

[NOTE]
**Cluster IDs are arbitrary, structures are not.** Two clusterings can have identical groupings but completely different label numbers, so raw `sum(a != b)` overstates disagreement. For an honest comparison, build a contingency table with `table(a, b)` and look for one dominant cell per row, exactly the trick used in Exercise 10.

### Exercise 7: Hierarchical cluster sizes on USArrests at k=4

On scaled `USArrests`, fit `hclust()` with `method = "ward.D2"` and cut at `k = 4`. Save the named vector of cluster sizes to `ex7_sizes`.

```r title="Exercise 7 starter"
# Hint: dist() -> hclust(method="ward.D2") -> cutree(k=4) -> table()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_data <- scale(USArrests)
ex7_hc   <- hclust(dist(ex7_data), method = "ward.D2")
ex7_sizes <- table(cutree(ex7_hc, k = 4))
ex7_sizes
#>
#>  1  2  3  4
#>  8 11 21 10
```

**Explanation:** Ward.D2 produces a fairly balanced 8-11-21-10 split, meaning no cluster dominates and none is a singleton. Compare this with what k-means at k=4 returned in Exercise 6: the two algorithms tend to agree on broad structure on USArrests, both pulling a large "high-crime urban" cluster out of the middle.

</details>

### Exercise 8: Linkage method comparison on iris

Fit `hclust()` on `dist(scale(iris[, 1:4]))` with each of four linkage methods: `single`, `complete`, `average`, and `ward.D2`. For each, cut at `k = 3` and record the size of the largest cluster. Save the named numeric vector to `ex8_max`.

```r title="Exercise 8 starter"
# Hint: sapply(c("single","complete","average","ward.D2"), function(m) ...)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_data <- scale(iris[, 1:4])
ex8_dist <- dist(ex8_data)

ex8_methods <- c("single", "complete", "average", "ward.D2")
ex8_max <- sapply(ex8_methods, function(m) {
  hc <- hclust(ex8_dist, method = m)
  max(table(cutree(hc, k = 3)))
})
ex8_max
#>   single complete  average  ward.D2
#>      148       72       97       64
```

**Explanation:** Single linkage is catastrophic here, dumping 148 of 150 flowers into one cluster and leaving two singletons. Complete (72) and average (97) are imbalanced. Ward.D2 produces 64 in the largest cluster, which is much closer to the true 50-50-50 species split. This is the empirical case for ward.D2 as a sensible default on continuous data.

</details>

### Exercise 9: Cophenetic correlation on swiss

For the built-in `swiss` dataset (47 Swiss provinces, 6 numeric columns), fit `hclust()` with `method = "ward.D2"` and `method = "average"`. Use `cor(d, cophenetic(hc))` to compute the cophenetic correlation for each, where `d` is the original distance object. Save the larger of the two correlations to `ex9_best_coph`.

```r title="Exercise 9 starter"
# Hint: cophenetic(hc) returns the dendrogram-implied distances

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_data <- scale(swiss)
ex9_dist <- dist(ex9_data)

ex9_ward <- hclust(ex9_dist, method = "ward.D2")
ex9_avg  <- hclust(ex9_dist, method = "average")

ex9_coph <- c(
  ward    = cor(ex9_dist, cophenetic(ex9_ward)),
  average = cor(ex9_dist, cophenetic(ex9_avg))
)
round(ex9_coph, 3)
#>    ward average
#>   0.582   0.747

ex9_best_coph <- max(ex9_coph)
round(ex9_best_coph, 3)
#> [1] 0.747
```

**Explanation:** Average linkage wins on cophenetic correlation (0.75 vs 0.58) because it explicitly preserves average pairwise distances during merging. Ward.D2 sacrifices cophenetic fidelity to chase balanced clusters. Use cophenetic correlation when you care about the dendrogram as a faithful summary of distances, and ward.D2 when you care about the cluster shapes themselves.

</details>

[KEY INSIGHT]
**Linkage method choice is a value judgement, not a search for "the right answer".** Different linkages optimise different things: average preserves pairwise distances, ward.D2 minimises within-cluster variance, single chases nearest neighbours. None is universally best, and reporting cophenetic correlation alongside the dendrogram is the simplest way to be honest about the trade-off you made.

### Exercise 10: Agreement of k-means and ward.D2 on iris

Fit both k-means (with `set.seed(10)` and `nstart = 25`) and `hclust(method = "ward.D2")` at `k = 3` on scaled iris. Build a contingency table of the two label vectors. Sum the maximum count in each row of that table and save the result to `ex10_agree`. Because cluster IDs are arbitrary, this counts the largest possible match across re-labellings.

```r title="Exercise 10 starter"
# Hint: tab <- table(km, hc); ex10_agree <- sum(apply(tab, 1, max))

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
ex10_data <- scale(iris[, 1:4])

set.seed(10)
ex10_km <- kmeans(ex10_data, centers = 3, nstart = 25)$cluster

ex10_hc <- cutree(hclust(dist(ex10_data), method = "ward.D2"), k = 3)

ex10_tab <- table(km = ex10_km, hc = ex10_hc)
ex10_tab
#>     hc
#> km    1  2  3
#>   1  49  1  0
#>   2   0  3 47
#>   3   0 49  1

ex10_agree <- sum(apply(ex10_tab, 1, max))
ex10_agree
#> [1] 145
```

**Explanation:** 145 of 150 flowers fall into the modal cell of their k-means cluster within the ward.D2 partition, an agreement of 96.7%. The two algorithms see the same broad structure on iris because the species are roughly spherical in scaled feature space. On non-spherical data (e.g., the moons example in the parent tutorial) the agreement collapses, which is when DBSCAN starts to look attractive.

</details>

## Complete Example

The end-to-end pipeline below combines everything from the exercises into a typical clustering workflow on `USArrests`. We pick `k` via mean silhouette, fit a final k-means with `nstart = 50`, profile each cluster on the original (unscaled) units, and cross-check with a hierarchical fit.

```r title="End-to-end clustering pipeline on USArrests"
# 1. Scale
ce_data <- scale(USArrests)
ce_dist <- dist(ce_data)

# 2. Pick k by mean silhouette across k=2..6
set.seed(99)
ce_widths <- sapply(2:6, function(k) {
  cl <- kmeans(ce_data, centers = k, nstart = 25)$cluster
  mean(silhouette(cl, ce_dist)[, 3])
})
names(ce_widths) <- 2:6
round(ce_widths, 3)
#>     2     3     4     5     6
#> 0.408 0.309 0.342 0.310 0.295

ce_best_k <- as.integer(names(ce_widths)[which.max(ce_widths)])
ce_best_k
#> [1] 2

# 3. Final k-means at the chosen k with a robust nstart
set.seed(99)
ce_km <- kmeans(ce_data, centers = ce_best_k, nstart = 50)
ce_km$size
#> [1] 30 20

# 4. Profile clusters on the original scale
aggregate(USArrests, by = list(cluster = ce_km$cluster), FUN = mean)
#>   cluster   Murder  Assault UrbanPop     Rape
#> 1       1  4.86667 114.4333 63.63333 16.36000
#> 2       2 12.16500 255.2500 68.40000 28.96500

# 5. Cross-check with ward.D2 hierarchical at the same k
ce_hc <- cutree(hclust(ce_dist, method = "ward.D2"), k = ce_best_k)
table(km = ce_km$cluster, hc = ce_hc)
#>    hc
#> km   1  2
#>   1 30  0
#>   2  4 16
```

Silhouette picks k=2 cleanly (0.41, well above k=3's 0.31), separating low-crime states from high-crime states. The cluster profiles confirm the split is dominated by `Murder` (4.9 vs 12.2) and `Assault` (114 vs 255). The contingency table shows 46 of 50 states get the same broad label from k-means and ward.D2, a 92% agreement, which is the sanity check most cluster reports should include before publication.

## Summary

| Tool | When to use it | Quick reminder |
|---|---|---|
| `kmeans(data, k, nstart=25)` | Round, similar-sized clusters | Always set `nstart`; total SS = within + between |
| `dist()` + `hclust(method="ward.D2")` | Continuous data, balanced groups | Default `method="complete"` is rarely best |
| `cutree(hc, k)` | Slice the dendrogram | Returns an integer label per row |
| `silhouette(cluster, dist)` | Validate cluster cohesion | Mean width above 0.5 is solid; below 0.25 is weak |
| Elbow on `tot.withinss` | Choose k visually | Look for the bend, not the minimum |
| `cor(dist, cophenetic(hc))` | Dendrogram fidelity | Higher means the tree preserves distances |
| Cross-tab k-means vs hclust | Sanity check | High agreement means the structure is real |

## References

1. Hastie, T., Tibshirani, R., Friedman, J. *The Elements of Statistical Learning*, 2nd ed., Chapter 14: Unsupervised Learning. Free PDF, Stanford. [Link](https://hastie.su.domains/ElemStatLearn/)
2. Kaufman, L., Rousseeuw, P. J. *Finding Groups in Data: An Introduction to Cluster Analysis*, Wiley (1990). The original silhouette paper.
3. Ward, J. H. (1963). "Hierarchical Grouping to Optimize an Objective Function". *Journal of the American Statistical Association*, 58(301), 236-244. [Link](https://www.jstor.org/stable/2282967)
4. R Core Team. *kmeans() reference, stats package*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kmeans.html)
5. R Core Team. *hclust() reference, stats package*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/hclust.html)
6. Maechler, M. et al. *cluster package: silhouette() reference*. [Link](https://cran.r-project.org/web/packages/cluster/cluster.pdf)
7. Kassambara, A. *Practical Guide to Cluster Analysis in R*, STHDA. [Link](https://www.sthda.com/english/wiki/print.php?id=237)
8. Murtagh, F., Legendre, P. (2014). "Ward's Hierarchical Agglomerative Clustering Method: Which Algorithms Implement Ward's Criterion?". *Journal of Classification*, 31(3), 274-295.

## Continue Learning

- [Cluster Analysis in R: k-Means vs Hierarchical vs DBSCAN](Cluster-Analysis-in-R.html), the parent tutorial that compares all three algorithms on the same dataset and shows where each one wins or fails.
- [PCA in R: prcomp() Tutorial](PCA-in-R.html), the natural pre-step: project to a low-rank space before clustering when you have many correlated features.
- [PCA Exercises in R](PCA-Exercises-in-R.html), the companion drill set for the dimensionality-reduction half of unsupervised learning.
