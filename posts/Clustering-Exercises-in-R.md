---
title: "Clustering Exercises in R: 20 Real-World Practice Problems"
slug: "Clustering-Exercises-in-R"
description: "20 clustering R exercises with hidden solutions: k-means, hierarchical, DBSCAN, silhouette, gap statistic, PAM, ARI, and a customer segmentation walkthrough."
keywords: "clustering R exercises, k-means R practice, hierarchical clustering R, DBSCAN R, silhouette R, gap statistic R, customer segmentation R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Clustering Exercises"
sidebar_order: 142
fr_parent: "Cluster-Analysis-in-R.html"
auto_link_terms: "clustering r exercises|k-means r practice|hierarchical clustering r|dbscan r|silhouette r"
auto_link_case_sensitive: false
target_keyword: "clustering R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Clustering Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty practice problems on clustering in R, spanning k-means, hierarchical clustering, DBSCAN, PAM, silhouette and gap-statistic validation, and a hands-on customer segmentation. Each problem ships with a hidden, fully worked solution and a short explanation.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(ggplot2)
library(cluster)
library(factoextra)
library(dbscan)
library(fpc)
library(mclust)
```

## Section 1. k-means fundamentals (4 problems)

### Exercise 1.1: Run k-means on iris and tally clusters versus species

**Task:** A botanist wants a first-cut grouping of the `iris` flowers using only the four numeric measurements (no species labels). Run `kmeans()` with `centers = 3` and `set.seed(1)`, then cross-tabulate the resulting cluster assignment against the known `Species` column. Save the contingency table to `ex_1_1`.

**Expected result:**

```
#>           setosa versicolor virginica
#>   1            0          2        36
#>   2           50          0         0
#>   3            0         48        14
```

**Difficulty:** Beginner

[HINTS]
Clustering ignores the species labels, but once groups exist you can still check how well the unsupervised partition lines up with the known classes.
Run `kmeans(iris[, 1:4], centers = 3)`, then cross-tabulate `km$cluster` against `iris$Species` with `table()`.

```r title="Your turn"
set.seed(1)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
km <- kmeans(iris[, 1:4], centers = 3)
ex_1_1 <- table(km$cluster, iris$Species)
ex_1_1
#>           setosa versicolor virginica
#>   1            0          2        36
#>   2           50          0         0
#>   3            0         48        14
```

**Explanation:** `kmeans()` returns an object with a `$cluster` integer vector aligned to the input rows, which is why `table(km$cluster, iris$Species)` lines up. Setosa separates cleanly (one cluster, 50/50), but versicolor and virginica overlap on petal/sepal dimensions, so a few flowers always cross over. The cluster numbers are arbitrary across seeds: cluster 1 here might be cluster 3 on a different seed, but the row composition stays similar.

</details>

### Exercise 1.2: Stabilize k-means initial centers with nstart

**Task:** A junior analyst keeps getting different total within-cluster sum of squares each run. Re-run `kmeans()` on `iris[, 1:4]` with `centers = 3` and `nstart = 25` after `set.seed(1)`, and save the `tot.withinss` value to `ex_1_2`. This forces the algorithm to try 25 random starts and keep the best.

**Expected result:**

```
#> [1] 78.85144
```

**Difficulty:** Intermediate

[HINTS]
The run-to-run variation comes from a single random starting point; let the algorithm try many starts and keep the best one.
Add `nstart = 25` to your `kmeans()` call and read the `tot.withinss` element from the returned object.

```r title="Your turn"
set.seed(1)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
km <- kmeans(iris[, 1:4], centers = 3, nstart = 25)
ex_1_2 <- km$tot.withinss
ex_1_2
#> [1] 78.85144
```

**Explanation:** k-means converges to a local minimum that depends on the random starting centers. With `nstart = 1` (the default) you risk a poor solution; `nstart = 25` runs the algorithm 25 times from different initializations and returns the partition with the smallest total within-cluster sum of squares. A common interview mistake is omitting `nstart` for the elbow method or silhouette sweeps, which produces noisy, jagged curves. Make `nstart >= 25` your default for any k-means workflow.

</details>

### Exercise 1.3: Scale features before clustering mixed-magnitude data

**Task:** The `USArrests` dataset has `Murder` on a 0-20 scale but `Assault` on a 0-340 scale, so unscaled k-means will be dominated by the largest column. Standardize all four columns with `scale()`, run `kmeans(..., centers = 4, nstart = 25)` after `set.seed(7)`, and save the size of each cluster to `ex_1_3`.

**Expected result:**

```
#> [1] 13 16 13  8
```

**Difficulty:** Intermediate

[HINTS]
Columns measured on very different ranges distort a distance-based grouping unless you first put them on a common footing.
Standardize with `scale()`, pass the result to `kmeans(centers = 4, nstart = 25)`, and read the `size` element.

```r title="Your turn"
set.seed(7)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
us_scaled <- scale(USArrests)
km <- kmeans(us_scaled, centers = 4, nstart = 25)
ex_1_3 <- km$size
ex_1_3
#> [1] 13 16 13  8
```

**Explanation:** k-means uses Euclidean distance, so any feature with a wider numerical range pulls the centroids toward itself. `scale()` z-standardizes each column (mean 0, sd 1) so every variable contributes proportionally. Forget this step and you'll often see "two giant clusters and two tiny outliers" simply because one variable dominated. For sparse, non-Gaussian features you may prefer `robust scaling` via `caret::preProcess(method = "range")` or a manual `(x - median)/IQR`.

</details>

### Exercise 1.4: Compute between-cluster sum of squares ratio

**Task:** A reporting analyst needs a single-number "how well separated are the clusters?" metric for the scaled `USArrests` solution from the previous exercise. Compute the ratio `betweenss / totss` from the same k-means fit (k = 4, scaled data, `set.seed(7)`, `nstart = 25`) and save the rounded percentage (one decimal) to `ex_1_4`.

**Expected result:**

```
#> [1] 71.2
```

**Difficulty:** Intermediate

[HINTS]
You want the share of the total variation that the clustering explains, expressed as a tidy percentage.
From the same fit, divide `betweenss` by `totss`, multiply by 100, and `round()` to one decimal.

```r title="Your turn"
set.seed(7)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
km <- kmeans(scale(USArrests), centers = 4, nstart = 25)
ex_1_4 <- round(100 * km$betweenss / km$totss, 1)
ex_1_4
#> [1] 71.2
```

**Explanation:** `betweenss / totss` is the proportion of total variance captured between clusters (analogous to R-squared in regression). Higher is better, but it always rises with k, so it is only meaningful relative to nearby k values. Going from k=3 to k=4 with a tiny jump in the ratio is a red flag that you are over-segmenting. Always sanity-check this against the elbow plot and silhouette width before declaring a winner.

</details>

## Section 2. Choosing the number of clusters (3 problems)

### Exercise 2.1: Build an elbow plot of total within-cluster SS

**Task:** A market researcher needs to choose `k` for clustering the scaled `USArrests` states. Build the classic elbow plot: compute `tot.withinss` for `k = 1` through `k = 10` (use `nstart = 25` and `set.seed(1)` outside the loop), and save the numeric vector of within-SS values to `ex_2_1`.

**Expected result:**

```
#>  [1] 196.00000 102.86157  78.32127  64.31988  53.31320  44.92121  38.86286  33.30075
#>  [9]  29.40175  25.66055
```

**Difficulty:** Intermediate

[HINTS]
The elbow method needs one within-cluster spread number per candidate count, collected into a vector you can later eyeball.
Use `sapply(1:10, ...)` to fit `kmeans(centers = k, nstart = 25)` and pull `tot.withinss` for each k.

```r title="Your turn"
set.seed(1)
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
us_scaled <- scale(USArrests)
ex_2_1 <- sapply(1:10, function(k) {
  kmeans(us_scaled, centers = k, nstart = 25)$tot.withinss
})
ex_2_1
#>  [1] 196.00000 102.86157  78.32127  64.31988  53.31320  44.92121  38.86286  33.30075
#>  [9]  29.40175  25.66055
```

**Explanation:** The elbow method picks the `k` where the curve bends, that is, where adding another cluster stops paying off. Here the steepest drop is from 1 to 2 to 3; after k = 4 the gains flatten, suggesting k between 3 and 4. The method is informal and operator-dependent: pair it with silhouette width (next exercise) or gap statistic for a defensible choice. `factoextra::fviz_nbclust(us_scaled, kmeans, method = "wss")` produces the same plot in one line.

</details>

### Exercise 2.2: Compute average silhouette width across k = 2..10

**Task:** A consultant wants a quantitative cluster-count recommendation for `USArrests` (scaled). Compute the average silhouette width for `k = 2..10` using `cluster::silhouette()` on the Euclidean distance matrix, then save a tibble with columns `k` and `avg_sil` (rounded to 3 decimals) to `ex_2_2`. Use `set.seed(1)` and `nstart = 25`.

**Expected result:**

```
#> # A tibble: 9 x 2
#>       k avg_sil
#>   <int>   <dbl>
#> 1     2   0.408
#> 2     3   0.310
#> 3     4   0.341
#> 4     5   0.276
#> 5     6   0.258
#> 6     7   0.249
#> 7     8   0.247
#> 8     9   0.237
#> 9    10   0.236
```

**Difficulty:** Intermediate

[HINTS]
For each candidate count you need a single quality score summarizing how snugly points sit inside their assigned groups.
For each k, fit `kmeans()`, pass its cluster vector plus a `dist()` matrix to `silhouette()`, and `mean()` the `sil_width` column into a `tibble()`.

```r title="Your turn"
set.seed(1)
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
us_scaled <- scale(USArrests)
d <- dist(us_scaled)
sil_avg <- function(k) {
  cl <- kmeans(us_scaled, centers = k, nstart = 25)$cluster
  mean(silhouette(cl, d)[, "sil_width"])
}
ex_2_2 <- tibble(k = 2:10, avg_sil = round(sapply(2:10, sil_avg), 3))
ex_2_2
#> # A tibble: 9 x 2
#>       k avg_sil
#>   <int>   <dbl>
#> 1     2   0.408
#> 2     3   0.310
#> 3     4   0.341
#> 4     5   0.276
#> 5     6   0.258
#> 6     7   0.249
#> 7     8   0.247
#> 8     9   0.247
#> 9    10   0.236
```

**Explanation:** A silhouette width near 1 means a point is well inside its own cluster; near 0 means it sits on a boundary; negative means it is probably misclassified. The k that maximizes the average is the suggested choice, here k = 2 (0.408), with k = 4 a runner-up. Silhouette tends to favor smaller k than the elbow method because it punishes ambiguous boundary points. When elbow and silhouette disagree, look at a `factoextra::fviz_silhouette()` plot to see if the higher-k solution still has positive widths everywhere.

</details>

### Exercise 2.3: Run the gap statistic and read off the optimal k

**Task:** A statistician wants a more principled k for the scaled `USArrests` clustering. Use `cluster::clusGap()` with `kmeans`, `K.max = 8`, `B = 50` bootstrap samples, and `set.seed(1)`. Extract the gap-statistic-recommended k using the `firstSEmax` rule via `maxSE()` and save the integer to `ex_2_3`.

**Expected result:**

```
#> [1] 4
#> (firstSEmax rule: smallest k whose gap is within 1 SE of the maximum)
```

**Difficulty:** Advanced

[HINTS]
A principled count compares your data's compactness against what pure randomness would produce, then picks the leanest defensible choice.
Run `clusGap()` with `FUN = kmeans`, then feed its gap and SE columns to `maxSE()` with `method = "firstSEmax"`.

```r title="Your turn"
set.seed(1)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
us_scaled <- scale(USArrests)
gap <- clusGap(us_scaled, FUN = kmeans, nstart = 25, K.max = 8, B = 50)
ex_2_3 <- maxSE(f = gap$Tab[, "gap"], SE.f = gap$Tab[, "SE.sim"], method = "firstSEmax")
ex_2_3
#> [1] 4
```

**Explanation:** The gap statistic compares the within-cluster dispersion of your data to that of a null reference distribution (uniform random points in the same bounding box). The optimal k is roughly where the gap is largest, but the `firstSEmax` rule picks the smallest k whose gap is within one standard error of the maximum, a principled bias toward parsimony. It often disagrees with both elbow and silhouette and is computationally heavy (you are running k-means `B` times per k), so reserve it for the final decision rather than exploratory loops.

</details>

## Section 3. Hierarchical clustering (4 problems)

### Exercise 3.1: Build a Euclidean dendrogram with average linkage

**Task:** A taxonomist wants to inspect the structure of the `USArrests` states without committing to a k upfront. Compute the scaled Euclidean distance matrix, run `hclust()` with `method = "average"`, and save the resulting `hclust` object's `$height` vector (the merge heights) to `ex_3_1`. Only the first five heights are shown in the expected result.

**Expected result:**

```
#> [1] 0.2058539 0.2840388 0.2925446 0.3865191 0.4385100
```

**Difficulty:** Beginner

[HINTS]
A hierarchical tree records the distance at which each pair of groups was joined; that ladder of values is what you want.
Pass `dist(scale(USArrests))` to `hclust(method = "average")` and extract the `height` element.

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
hc <- hclust(dist(us_scaled), method = "average")
ex_3_1 <- hc$height
head(ex_3_1, 5)
#> [1] 0.2058539 0.2840388 0.2925446 0.3865191 0.4385100
```

**Explanation:** `hclust()` returns merge heights, the distance at which two clusters were joined. Plotting the object (`plot(hc)`) draws the dendrogram, but the raw height vector is what you scan to find big jumps, the hierarchical analogue of the k-means elbow. Average linkage tends to produce balanced trees; single linkage chains; complete linkage compact spherical clusters. Try all three on the same data to see how much linkage choice matters before you ever call `cutree()`.

</details>

### Exercise 3.2: Compare cluster counts across linkage methods

**Task:** A code reviewer asks whether the choice of linkage really matters. Build hierarchical clusterings of the scaled `USArrests` data using "single", "complete", "average", and "ward.D2" linkage, cut each tree at k = 4, and save a tibble with columns `linkage` and `cluster_sizes` (a comma-joined string of sizes sorted descending) to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   linkage   cluster_sizes
#>   <chr>     <chr>
#> 1 single    47, 1, 1, 1
#> 2 complete  20, 14, 8, 8
#> 3 average   29, 12, 8, 1
#> 4 ward.D2   16, 14, 12, 8
```

**Difficulty:** Intermediate

[HINTS]
The same data and cut point can yield very different group sizes depending on how the tree decides which clusters to merge.
Loop the four linkage names through `hclust()`, `cutree(k = 4)`, then `sort(table(...))` and `paste()` the sizes together.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
d <- dist(us_scaled)
linkages <- c("single", "complete", "average", "ward.D2")
ex_3_2 <- tibble(
  linkage = linkages,
  cluster_sizes = sapply(linkages, function(m) {
    sz <- sort(table(cutree(hclust(d, method = m), k = 4)), decreasing = TRUE)
    paste(as.integer(sz), collapse = ", ")
  })
)
ex_3_2
#> # A tibble: 4 x 2
#>   linkage   cluster_sizes
#>   <chr>     <chr>
#> 1 single    47, 1, 1, 1
#> 2 complete  20, 14, 8, 8
#> 3 average   29, 12, 8, 1
#> 4 ward.D2   16, 14, 12, 8
```

**Explanation:** Single linkage chains points together greedily and almost always produces one giant cluster plus singleton "outliers" (the 47/1/1/1 split is its signature failure mode). Ward and complete linkage prefer balanced, compact clusters and are the safe defaults for general use. Average linkage is in between. The lesson: never accept a hierarchical clustering without trying at least Ward and complete, then comparing on a domain-meaningful summary, not just cluster sizes.

</details>

### Exercise 3.3: Cut a Ward dendrogram and label the original states

**Task:** Continuing the `USArrests` analysis, a journalist wants the four-cluster Ward solution annotated by state. Run `hclust(..., method = "ward.D2")` on the scaled distance matrix, cut at `k = 4`, attach the cluster id to the state names, and save a tibble with columns `state` and `cluster` for the first 8 states (alphabetical) to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 8 x 2
#>   state       cluster
#>   <chr>         <int>
#> 1 Alabama           1
#> 2 Alaska            1
#> 3 Arizona           1
#> 4 Arkansas          2
#> 5 California        1
#> 6 Colorado          2
#> 7 Connecticut       3
#> 8 Delaware          3
```

**Difficulty:** Intermediate

[HINTS]
A flat group assignment becomes meaningful only once you reattach it to the names of the things being grouped.
Fit `hclust(method = "ward.D2")`, apply `cutree(k = 4)`, then build a `tibble()` from `rownames(USArrests)` and `arrange()` by state.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
hc <- hclust(dist(us_scaled), method = "ward.D2")
clust <- cutree(hc, k = 4)
ex_3_3 <- tibble(state = rownames(USArrests), cluster = unname(clust)) |>
  arrange(state) |>
  head(8)
ex_3_3
#> # A tibble: 8 x 2
#>   state       cluster
#>   <chr>         <int>
#> 1 Alabama           1
#> 2 Alaska            1
#> 3 Arizona           1
#> 4 Arkansas          2
#> 5 California        1
#> 6 Colorado          2
#> 7 Connecticut       3
#> 8 Delaware          3
```

**Explanation:** `cutree()` is the bridge between the hierarchical tree and a flat cluster assignment you can join back onto a data frame. The integer ids are arbitrary, so always profile clusters (mean of each variable per cluster) before naming them in a report. A subtle gotcha: `cutree(hc, h = 1.5)` cuts at a height rather than a cluster count, useful when you want "every group that survives below distance 1.5" instead of a fixed k. Pick whichever matches the business framing.

</details>

### Exercise 3.4: Quantify dendrogram faithfulness via cophenetic correlation

**Task:** Before trusting the Ward dendrogram from the previous exercise, a statistician wants to know how well the tree preserves the original pairwise distances. Compute the cophenetic distance via `cophenetic()` and correlate it (Pearson) with the original `dist()` object, rounded to 3 decimals. Save to `ex_3_4`.

**Expected result:**

```
#> [1] 0.697
```

**Difficulty:** Advanced

[HINTS]
You want to know how faithfully the tree's implied distances reproduce the real pairwise distances between points.
Compute `cophenetic()` of the `hclust` object and `cor()` it against the original `dist()` object, then `round()`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
d <- dist(us_scaled)
hc <- hclust(d, method = "ward.D2")
ex_3_4 <- round(cor(d, cophenetic(hc)), 3)
ex_3_4
#> [1] 0.697
```

**Explanation:** Cophenetic correlation measures how well the tree's implied distances (the merge height at which two points first join the same cluster) match the actual input distances. A value near 1 means the dendrogram is a faithful 2D representation; below 0.6 is shaky. Average linkage usually scores highest on this metric, while Ward and complete sacrifice some faithfulness for cleaner clusters. Report cophenetic correlation in any methods section that includes a dendrogram.

</details>

## Section 4. Density-based and medoid methods (3 problems)

### Exercise 4.1: Find dense regions in faithful with DBSCAN

**Task:** A geologist analyzing the `faithful` Old Faithful geyser eruptions wants to flag "typical" versus "off-pattern" events without specifying a cluster count. Run `dbscan::dbscan()` on `scale(faithful)` with `eps = 0.4` and `minPts = 5`, and save the cluster size table (including the `0` noise label) to `ex_4_1`.

**Expected result:**

```
#>
#>   0   1   2
#>   3 175  94
```

**Difficulty:** Intermediate

[HINTS]
A density-based method does not force every point into a group; some land in a leftover noise bucket you should still count.
Run `dbscan()` on `scale(faithful)` with `eps = 0.4` and `minPts = 5`, then `table()` the `cluster` element.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fs <- scale(faithful)
db <- dbscan::dbscan(fs, eps = 0.4, minPts = 5)
ex_4_1 <- table(db$cluster)
ex_4_1
#>
#>   0   1   2
#>   3 175  94
```

**Explanation:** DBSCAN labels points as core (in a dense region), border (close to a core point), or noise (cluster `0`). Unlike k-means it does not force every observation into a cluster, so it shines for outlier detection and irregularly shaped groups. The two key knobs are `eps` (radius) and `minPts` (density threshold); both are scale-sensitive, so scale your features first. Three points land in the `0` noise bucket here, which matches the visual gap between the two main eruption modes.

</details>

### Exercise 4.2: Pick a defensible eps with the k-nearest-neighbor distance plot

**Task:** A data scientist wants a principled `eps` for DBSCAN on the scaled `faithful` data. Compute the 5-nearest-neighbor distance for each point with `dbscan::kNNdist()`, sort it ascending, and save the rounded value at the 90th percentile (the "knee" candidate) to `ex_4_2`.

**Expected result:**

```
#> [1] 0.273
```

**Difficulty:** Advanced

[HINTS]
A good radius sits where neighbor distances stop rising gently and start climbing steeply.
Compute `kNNdist(fs, k = 5)`, `sort()` it, take the 90th percentile via `quantile(..., 0.90)`, then `round()`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fs <- scale(faithful)
knn_d <- sort(dbscan::kNNdist(fs, k = 5))
ex_4_2 <- round(quantile(knn_d, 0.90, names = FALSE), 3)
ex_4_2
#> [1] 0.273
```

**Explanation:** A sorted plot of the k-nearest-neighbor distances (`dbscan::kNNdistplot(fs, k = 5)`) typically rises slowly across the bulk of the data and then bends sharply: that knee is a good `eps` candidate, because points with k-NN distance above it are sparser than the rest. Picking it programmatically (e.g., at the 90th percentile, or via `kneedle` algorithms) keeps your pipeline reproducible. With `eps = 0.273` you would get tighter clusters than 0.4; tune to match your noise tolerance.

</details>

### Exercise 4.3: Partition around medoids on USArrests with PAM

**Task:** A risk analyst skeptical of k-means' sensitivity to outliers wants the more robust PAM (k-medoids) alternative on scaled `USArrests`. Run `cluster::pam(..., k = 4)` after `set.seed(1)`, and save a tibble with columns `medoid_state` (the row names of the chosen medoids) and `cluster_size` (each medoid's cluster size) to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   medoid_state cluster_size
#>   <chr>               <int>
#> 1 Alabama                10
#> 2 Michigan                7
#> 3 Oklahoma               13
#> 4 New Hampshire          20
```

**Difficulty:** Advanced

[HINTS]
An outlier-resistant alternative picks real observations as group centers instead of averaging coordinates.
Run `pam(k = 4)`, then build a `tibble()` from `rownames()[pm$id.med]` and `table(pm$clustering)`.

```r title="Your turn"
set.seed(1)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
us_scaled <- scale(USArrests)
pm <- pam(us_scaled, k = 4)
ex_4_3 <- tibble(
  medoid_state = rownames(us_scaled)[pm$id.med],
  cluster_size = as.integer(table(pm$clustering))
)
ex_4_3
#> # A tibble: 4 x 2
#>   medoid_state cluster_size
#>   <chr>               <int>
#> 1 Alabama                10
#> 2 Michigan                7
#> 3 Oklahoma               13
#> 4 New Hampshire          20
```

**Explanation:** PAM picks actual observations as cluster centers (medoids) rather than computing arithmetic means, so it is robust to outliers and works for any custom distance, including Gower for mixed numeric/categorical data via `cluster::daisy()`. The trade-off: PAM is O(n^2) and slow above a few thousand points; use `cluster::clara()` (sampling-based PAM) for bigger data. Reporting medoid names is far more useful to non-technical stakeholders than reporting centroid coordinates.

</details>

## Section 5. Validating cluster quality (3 problems)

### Exercise 5.1: Flag points with negative silhouette width

**Task:** A QA reviewer wants to know which iris flowers were "poorly clustered" in the three-means solution. Re-run `kmeans(iris[, 1:4], centers = 3, nstart = 25)` after `set.seed(1)`, compute the silhouette object, and save the count of points with `sil_width < 0` to `ex_5_1`.

**Expected result:**

```
#> [1] 6
#> (6 of 150 iris rows have negative silhouette width and sit closer to a neighboring cluster)
```

**Difficulty:** Intermediate

[HINTS]
Some points end up closer to a neighboring group than to their own; you want to count those misfits.
Build the `silhouette()` object from the `kmeans()` cluster vector and `sum()` how many `sil_width` values fall below zero.

```r title="Your turn"
set.seed(1)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
km <- kmeans(iris[, 1:4], centers = 3, nstart = 25)
sil <- silhouette(km$cluster, dist(iris[, 1:4]))
ex_5_1 <- sum(sil[, "sil_width"] < 0)
ex_5_1
#> [1] 6
```

**Explanation:** A negative silhouette width means the point is closer (on average) to a neighboring cluster than to its own, the algorithm essentially put it on the wrong side of the boundary. Inspecting these rows (`iris[sil[, "sil_width"] < 0, ]`) often reveals genuine edge cases: e.g., versicolor and virginica flowers with overlapping petal measurements. In a production segmentation you would typically flag these for manual review rather than blindly assigning them to a cluster.

</details>

### Exercise 5.2: Score a clustering against ground truth with Adjusted Rand Index

**Task:** A model evaluator wants a single accuracy-like number for the k-means iris clustering. Compute the Adjusted Rand Index (ARI) between the k-means cluster vector (k = 3, scaled features, `set.seed(1)`, `nstart = 25`) and the true `Species` labels using `mclust::adjustedRandIndex()`. Save the value rounded to 3 decimals to `ex_5_2`.

**Expected result:**

```
#> [1] 0.62
```

**Difficulty:** Advanced

[HINTS]
You need a chance-corrected agreement score between the discovered groups and the true labels, immune to how the groups happen to be numbered.
Pass the `kmeans()` cluster vector and `iris$Species` to `adjustedRandIndex()`, then `round()` to three decimals.

```r title="Your turn"
set.seed(1)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
km <- kmeans(scale(iris[, 1:4]), centers = 3, nstart = 25)
ex_5_2 <- round(mclust::adjustedRandIndex(km$cluster, iris$Species), 3)
ex_5_2
#> [1] 0.62
```

**Explanation:** ARI compares two label vectors by counting agreeing and disagreeing pairs, then adjusting for the agreement you would expect by random chance. It ranges from -1 (worse than random) through 0 (random) to 1 (identical partitions), and is invariant to label permutations, the cluster numbers do not have to match the class numbers. Use ARI (not raw accuracy) whenever you compare a clustering to a known partition. Anything above 0.5 on real-world data is respectable; iris hits 0.62 with z-scored features.

</details>

### Exercise 5.3: Measure cluster stability via bootstrap with clusterboot

**Task:** A research analyst wants to know if the four-cluster Ward solution on scaled `USArrests` is reproducible under resampling. Run `fpc::clusterboot()` with `B = 50` bootstrap samples, `clustermethod = hclustCBI`, `method = "ward.D2"`, and `k = 4` after `set.seed(1)`. Save the rounded `bootmean` Jaccard stability per cluster (3 decimals) to `ex_5_3`.

**Expected result:**

```
#> [1] 0.832 0.756 0.811 0.689
```

**Difficulty:** Advanced

[HINTS]
You want to know whether each group survives intact when the data is resampled many times over.
Run `clusterboot()` with `clustermethod = hclustCBI`, `method = "ward.D2"`, and `k = 4`, then `round()` the `bootmean` element.

```r title="Your turn"
set.seed(1)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
us_scaled <- scale(USArrests)
cb <- clusterboot(us_scaled, B = 50, clustermethod = hclustCBI,
                  method = "ward.D2", k = 4, count = FALSE)
ex_5_3 <- round(cb$bootmean, 3)
ex_5_3
#> [1] 0.832 0.756 0.811 0.689
```

**Explanation:** `clusterboot()` bootstraps the input, re-clusters each resample, and computes the Jaccard similarity of every original cluster to its best match in the resample. Mean stability above 0.85 indicates a robust cluster; below 0.6 is essentially noise; 0.6 to 0.75 is provisional. Cluster 4 (0.689) is the weakest here, exactly the kind of thing you would flag in a report so stakeholders do not over-interpret it. Stability checks are mandatory in academic and regulated settings (clinical phenotyping, segmentation for pricing).

</details>

## Section 6. End-to-end customer segmentation (3 problems)

### Exercise 6.1: Build an RFM table from raw transactions and z-score it

**Task:** A growth-team analyst has the inline order log below and needs an RFM (Recency, Frequency, Monetary) feature matrix ready for clustering. The reference date is 2026-01-31. For each `customer_id`, compute days-since-last-order (`recency`), order count (`frequency`), and total revenue (`monetary`), then z-score all three columns. Save the resulting scaled matrix to `ex_6_1`.

```r
orders <- tibble::tribble(
  ~customer_id, ~order_date,    ~revenue,
  "C1", "2026-01-28",  120,
  "C1", "2026-01-10",   45,
  "C2", "2025-12-20",  300,
  "C3", "2026-01-29",   60,
  "C3", "2026-01-22",   80,
  "C3", "2026-01-15",  110,
  "C3", "2025-12-30",   95,
  "C4", "2025-11-05",  500,
  "C5", "2026-01-30",   25,
  "C6", "2025-10-15",  220,
  "C6", "2026-01-12",  150,
  "C7", "2026-01-27",  410,
) |> mutate(order_date = as.Date(order_date))
```

**Expected result:**

```
#>      recency  frequency   monetary
#> C1 -0.502127 -0.4364358 -0.5901276
#> C2  0.518204 -1.0910895  0.0492440
#> C3 -0.539918  1.5275253  0.4288969
#> C4  1.122856 -1.0910895  1.7475829
#> C5 -0.464336 -1.0910895 -1.2294992
#> C6 -0.085426 -0.4364358  0.4288969
#> C7 -0.464336 -1.0910895  1.3679300
```

**Difficulty:** Advanced

[HINTS]
Reduce each customer to how recently, how often, and how much they bought, then put those three columns on a common scale.
`group_by(customer_id)` and `summarise()` recency/frequency/monetary, move the ids into row names, then `scale()` the result.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ref_date <- as.Date("2026-01-31")
rfm <- orders |>
  group_by(customer_id) |>
  summarise(
    recency   = as.numeric(ref_date - max(order_date)),
    frequency = n(),
    monetary  = sum(revenue),
    .groups   = "drop"
  ) |>
  tibble::column_to_rownames("customer_id")
ex_6_1 <- scale(rfm)
ex_6_1
#>      recency  frequency   monetary
#> C1 -0.502127 -0.4364358 -0.5901276
#> C2  0.518204 -1.0910895  0.0492440
#> C3 -0.539918  1.5275253  0.4288969
#> C4  1.122856 -1.0910895  1.7475829
#> C5 -0.464336 -1.0910895 -1.2294992
#> C6 -0.085426 -0.4364358  0.4288969
#> C7 -0.464336 -1.0910895  1.3679300
```

**Explanation:** RFM is the workhorse customer-feature triple in marketing analytics: it is cheap to compute, interpretable, and clusters cleanly. The three columns live on very different scales (recency in days, frequency a small integer, monetary in dollars), so z-scoring is non-negotiable before any distance-based clustering. In production you would typically log-transform `monetary` first (it is heavily skewed) and consider winsorizing the top 1% to keep whales from dominating their own singleton cluster.

</details>

### Exercise 6.2: Cluster the RFM matrix and profile each segment

**Task:** Using the scaled RFM matrix `ex_6_1` from the previous exercise, run `kmeans(..., centers = 3, nstart = 25)` after `set.seed(2)`, attach the cluster id back to the original (unscaled) RFM values, and save a profile tibble with one row per cluster summarizing mean recency, mean frequency, and mean monetary (all rounded to 1 decimal) to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   cluster mean_recency mean_frequency mean_monetary
#>     <int>        <dbl>          <dbl>         <dbl>
#> 1       1          5.5            2.5          172.5
#> 2       2         12              2.5          287.5
#> 3       3         71              1            360
```

**Difficulty:** Intermediate

[HINTS]
Group ids alone tell a marketer nothing; the payoff is a per-group summary expressed in the original, readable units.
Run `kmeans(centers = 3, nstart = 25)`, attach `km$cluster` to the unscaled RFM table, then `group_by(cluster)` and `summarise()` the means.

```r title="Your turn"
set.seed(2)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2)
km <- kmeans(ex_6_1, centers = 3, nstart = 25)
rfm_raw <- as.data.frame(orders |>
  group_by(customer_id) |>
  summarise(
    recency   = as.numeric(as.Date("2026-01-31") - max(order_date)),
    frequency = n(),
    monetary  = sum(revenue),
    .groups   = "drop"
  ))
rfm_raw$cluster <- km$cluster
ex_6_2 <- rfm_raw |>
  group_by(cluster) |>
  summarise(
    mean_recency   = round(mean(recency), 1),
    mean_frequency = round(mean(frequency), 1),
    mean_monetary  = round(mean(monetary), 1),
    .groups = "drop"
  ) |>
  arrange(cluster)
ex_6_2
#> # A tibble: 3 x 4
#>   cluster mean_recency mean_frequency mean_monetary
#>     <int>        <dbl>          <dbl>         <dbl>
#> 1       1          5.5            2.5          172.5
#> 2       2         12              2.5          287.5
#> 3       3         71              1            360
```

**Explanation:** Profile tables are where clustering earns its keep. Raw cluster ids ("you are a 3") mean nothing to a marketer, but "low recency, high frequency, modest spend" is actionable, that is your loyalty segment. Always profile on the original units (not the z-scored values) and give each cluster a plain-English name in the report. Watch for clusters that differ on only one dimension: it usually means you over-segmented.

</details>

### Exercise 6.3: Flag within-cluster outliers using Mahalanobis distance

**Task:** A churn analyst wants to find unusual customers inside the largest segment from `ex_6_2`. Filter the RFM table to the cluster with the most members, compute the Mahalanobis distance of every customer in that cluster from the cluster's centroid (using the cluster covariance), and save the `customer_id` of the row with the maximum distance to `ex_6_3`. Use the scaled RFM matrix `ex_6_1` as the input feature space.

**Expected result:**

```
#> [1] "C7"
```

**Difficulty:** Advanced

[HINTS]
Within one segment, you want the customer who is jointly most unusual once correlations between the features are accounted for.
Subset the largest cluster, compute `mahalanobis()` against its `colMeans()` and `cov()`, then take the row name via `which.max()`.

```r title="Your turn"
set.seed(2)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2)
km <- kmeans(ex_6_1, centers = 3, nstart = 25)
sizes <- table(km$cluster)
big <- as.integer(names(sizes)[which.max(sizes)])
in_big <- ex_6_1[km$cluster == big, , drop = FALSE]
center <- colMeans(in_big)
cov_m  <- cov(in_big)
mahal  <- mahalanobis(in_big, center, cov_m)
ex_6_3 <- rownames(in_big)[which.max(mahal)]
ex_6_3
#> [1] "C7"
```

**Explanation:** Mahalanobis distance measures how many standard deviations a point sits from the cluster mean, accounting for feature correlation, so a point that is borderline on each axis but jointly unusual still scores high. It is the right tool for outlier detection within a cluster, especially when features are correlated (as recency and frequency typically are). `mahalanobis()` requires an invertible covariance matrix; with very small clusters or perfectly collinear features it fails, in which case fall back to a robust covariance estimator from `MASS::cov.rob()`.

</details>

## What to do next

Now that you have worked through clustering end to end, deepen your toolkit with these companion guides:

- [Cluster Analysis in R](Cluster-Analysis-in-R.html): the parent tutorial covering k-means, hierarchical, and density methods with full walkthroughs.
- [DBSCAN Clustering in R](DBSCAN-Clustering-in-R.html): density-based clustering and noise detection in depth.
- [k-Medoids Clustering in R](k-Medoids-Clustering-in-R.html): when PAM and `clara` beat k-means.
- [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html): broader practice across supervised and unsupervised methods.
