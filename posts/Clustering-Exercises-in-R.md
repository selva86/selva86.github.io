---
title: "Clustering Exercises in R: 20 Practice Problems"
slug: "Clustering-Exercises-in-R"
description: "Master clustering in R with 20 practice problems: k-means, hierarchical, DBSCAN, silhouette, elbow method. Hidden solutions."
keywords: "clustering R exercises, k-means R practice, hierarchical clustering R, DBSCAN R, R cluster analysis"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Clustering Exercises"
sidebar_order: 142
fr_parent: "R-Tutorial.html"
auto_link_terms: "clustering R exercises|k-means R practice|hierarchical clustering R|DBSCAN R"
auto_link_case_sensitive: false
target_keyword: "clustering R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Clustering Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on clustering in R: k-means, hierarchical, DBSCAN, silhouette, elbow method, visualization. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
library(cluster)
```

### Exercise 1: k-means basic

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(iris[, 1:4], centers = 3)
table(km$cluster, iris$Species)
```

</details>

### Exercise 2: Plot k-means clusters

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(iris[, 1:4], centers = 3)
iris$cluster <- factor(km$cluster)
ggplot(iris, aes(Sepal.Length, Petal.Length, color = cluster)) + geom_point()
```

</details>

### Exercise 3: nstart parameter

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
kmeans(iris[, 1:4], centers = 3, nstart = 25)
```

</details>

### Exercise 4: Scale before k-means

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
kmeans(scale(iris[, 1:4]), centers = 3)
```

</details>

### Exercise 5: Elbow method

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
wss <- sapply(1:10, function(k) kmeans(scale(iris[,1:4]), centers = k, nstart = 10)$tot.withinss)
plot(1:10, wss, type = "b")
```

</details>

### Exercise 6: Silhouette

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(scale(iris[,1:4]), centers = 3)
sil <- silhouette(km$cluster, dist(scale(iris[,1:4])))
mean(sil[, 3])
```

</details>

### Exercise 7: Hierarchical clustering

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
d <- dist(scale(iris[, 1:4]))
hc <- hclust(d, method = "complete")
cutree(hc, k = 3) |> table()
```

</details>

### Exercise 8: Plot dendrogram

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
hc <- hclust(dist(scale(iris[, 1:4])))
plot(hc)
```

</details>

### Exercise 9: Different linkage methods

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- dist(scale(iris[,1:4]))
list(complete = hclust(d, method = "complete"),
     ward     = hclust(d, method = "ward.D2"),
     single   = hclust(d, method = "single"))
```

</details>

### Exercise 10: DBSCAN

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
dbscan::dbscan(scale(iris[, 1:4]), eps = 0.5, minPts = 5)
```

</details>

### Exercise 11: Compare k-means vs hierarchical

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(scale(iris[,1:4]), 3)
hc <- cutree(hclust(dist(scale(iris[,1:4]))), 3)
table(km$cluster, hc)
```

</details>

### Exercise 12: Cluster centroids

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(iris[, 1:4], 3)
km$centers
```

</details>

### Exercise 13: Within-cluster sum of squares

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
kmeans(iris[, 1:4], 3)$tot.withinss
```

</details>

### Exercise 14: PAM (k-medoids)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
pam_fit <- cluster::pam(scale(iris[,1:4]), k = 3)
pam_fit$clusinfo
```

</details>

### Exercise 15: Gap statistic

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
gap <- cluster::clusGap(scale(iris[,1:4]), FUN = kmeans, K.max = 8, B = 50)
plot(gap)
```

</details>

### Exercise 16: Visualize hierarchical clusters via cuts

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
hc <- hclust(dist(scale(iris[,1:4])))
iris$cluster <- factor(cutree(hc, k = 3))
ggplot(iris, aes(Sepal.Length, Petal.Length, color = cluster)) + geom_point()
```

</details>

### Exercise 17: Predict new point to nearest centroid

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(scale(iris[,1:4]), 3)
new_point <- scale(iris[1, 1:4])
which.min(sqrt(rowSums((km$centers - matrix(rep(new_point, 3), nrow = 3))^2)))
```

</details>

### Exercise 18: External validation with ARI

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(scale(iris[,1:4]), 3)
mclust::adjustedRandIndex(km$cluster, as.integer(iris$Species))
```

</details>

### Exercise 19: Initialise k-means with k-means++

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
LICORS::kmeanspp(scale(iris[,1:4]), k = 3)$cluster |> table(iris$Species)
```

</details>

### Exercise 20: Mini-batch k-means demo (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# ClusterR::MiniBatchKmeans for very large data
# m <- ClusterR::MiniBatchKmeans(scale(iris[,1:4]), clusters = 3, batch_size = 30)
# Result: faster than kmeans on millions of rows
```

</details>

## What to do next

- **PCA-Exercises** (shipped) — dimension reduction before clustering.
- **Machine-Learning-Exercises** (shipped) — broader ML drills.
