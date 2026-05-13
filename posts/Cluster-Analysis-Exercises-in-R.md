---
title: "Cluster Analysis Exercises in R: 17 k-Means, Hierarchical & PAM Problems"
slug: "Cluster-Analysis-Exercises-in-R"
description: "17 cluster analysis exercises in R covering k-means, scaling, elbow & silhouette diagnostics, hierarchical clustering, linkage choice, PAM, and Rand index."
keywords: "cluster analysis exercises in R, clustering exercises R, k-means exercises, kmeans practice, hierarchical clustering R exercises, hclust practice, silhouette R, elbow method R, PAM clustering R, adjusted rand index R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Cluster Analysis Exercises"
sidebar_order: 305
fr_parent: "Cluster-Analysis-in-R.html"
auto_link_terms: "cluster analysis exercises in R|clustering exercises in R|kmeans practice|hierarchical clustering exercises|silhouette analysis R"
auto_link_case_sensitive: false
target_keyword: "cluster analysis exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Cluster Analysis Exercises in R: 17 k-Means, Hierarchical & PAM Problems

<p class="lead">Seventeen cluster analysis exercises in R, ordered from a first <code>kmeans()</code> fit through scaling, elbow and silhouette diagnostics, hierarchical clustering with multiple linkages, cophenetic correlation, k-medoids, and partition agreement via the adjusted Rand index. Each problem ships with a runnable starter, an exact expected output, and a click-to-reveal solution explaining the choice.</p>

```r title="Run this once before any exercise"
library(cluster)
library(factoextra)
library(ggplot2)
library(mclust)
```

## Section 1. k-means warm-up (3 problems)

### Exercise 1.1: Fit a three-cluster k-means on scaled iris

**Task:** Fit a k-means model with three centers on the scaled `iris[, 1:4]` numeric matrix using `set.seed(101)` and `nstart = 25`, then save the fitted object to `ex_1_1` so later exercises can re-use its sizes, centers, and within-SS slots.

**Expected result:**

```
#> K-means clustering with 3 clusters of sizes 50, 53, 47
#>
#> Cluster sizes:
#> [1] 50 53 47
```

**Difficulty:** Beginner

```r title="Your turn"
iris_scaled <- scale(iris[, 1:4])
ex_1_1 <- # your code here
ex_1_1$size
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris_scaled <- scale(iris[, 1:4])
set.seed(101)
ex_1_1 <- kmeans(iris_scaled, centers = 3, nstart = 25)
ex_1_1$size
#> [1] 50 53 47
```

**Explanation:** `nstart = 25` runs k-means from 25 random initial centroids and keeps the lowest within-cluster sum of squares, which is the standard defence against bad starts. Without it a single unlucky seed can land in a poor local minimum. The size vector returning roughly balanced groups is a sanity sign that the algorithm has not collapsed into a degenerate one-big-cluster solution.

</details>

### Exercise 1.2: Read the centers, within-SS, and total within-SS

**Task:** Using the `ex_1_1` object from the previous exercise, extract the cluster centroid matrix, the per-cluster within-cluster sum of squares vector, and the scalar total within-SS. Bundle the three into a named list saved as `ex_1_2` so a reviewer can audit the loss decomposition in one print call.

**Expected result:**

```
#> $centers (rounded)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1       -1.01        0.85        -1.30       -1.25
#> 2       -0.05       -0.88         0.35        0.28
#> 3        1.16        0.13         1.00        1.03
#>
#> $withinss
#> [1] 47.4 44.1 47.5
#>
#> $tot.withinss
#> [1] 138.89
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- list(
  centers      = round(ex_1_1$centers, 2),
  withinss     = round(ex_1_1$withinss, 1),
  tot.withinss = round(ex_1_1$tot.withinss, 2)
)
ex_1_2
#> $centers (rounded)
#> ...
#> $tot.withinss
#> [1] 138.89
```

**Explanation:** A `kmeans` return is a list, not an S4 object, so all internals are reachable by `$`. The triple of centers, per-cluster SS, and total within-SS is what every downstream diagnostic (elbow, silhouette, comparison across k) is built on. Centroids are reported in scaled units because the input was scaled; back-transforming with the column means and standard deviations recovers original units.

</details>

### Exercise 1.3: Cross-tabulate cluster labels against true species

**Task:** A botanist hands you the unlabeled `iris[, 1:4]` table and asks how well unsupervised k-means recovers the three species. Cross-tabulate the cluster labels in `ex_1_1$cluster` against the `iris$Species` factor and save the contingency matrix as `ex_1_3` so the diagonal misalignment is visible at a glance.

**Expected result:**

```
#>             Species
#> Cluster      setosa versicolor virginica
#>   1              50          0         0
#>   2               0         39        14
#>   3               0         11        36
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- table(Cluster = ex_1_1$cluster, Species = iris$Species)
ex_1_3
#>             Species
#> Cluster      setosa versicolor virginica
#>   1              50          0         0
#>   2               0         39        14
#>   3               0         11        36
```

**Explanation:** Setosa is linearly separable on petals and falls cleanly into one cluster. The 25 off-diagonal hits come from the versicolor and virginica overlap that no purely unsupervised algorithm can resolve from these four features. The numeric cluster labels are arbitrary and may permute between runs even with a fixed seed if `nstart` changes, so always relabel via the table before reporting accuracy.

</details>

## Section 2. Scaling and preprocessing (3 problems)

### Exercise 2.1: Show that unscaled k-means is dominated by the largest-variance column

**Task:** Compute and compare two k-means fits with three centers on `USArrests`: one on the raw matrix and one on the column-scaled matrix. For each, return the total within-cluster sum of squares and the cross-tab of the two label vectors against each other, saved together as a list named `ex_2_1`.

**Expected result:**

```
#> $unscaled_tot_withinss
#> [1] 19564
#>
#> $scaled_tot_withinss
#> [1] 60.0
#>
#> $agreement_table
#>          scaled
#> unscaled   1  2  3
#>        1   0 13  3
#>        2   0  0 17
#>        3  14  3  0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
km_raw    <- kmeans(USArrests,        centers = 3, nstart = 25)
km_scaled <- kmeans(scale(USArrests), centers = 3, nstart = 25)
ex_2_1 <- list(
  unscaled_tot_withinss = round(km_raw$tot.withinss),
  scaled_tot_withinss   = round(km_scaled$tot.withinss, 1),
  agreement_table       = table(unscaled = km_raw$cluster, scaled = km_scaled$cluster)
)
ex_2_1
```

**Explanation:** `Assault` ranges 45 to 337 while `Murder` ranges 0.8 to 17.4, so unscaled Euclidean distance is essentially distance-on-Assault and the other three variables are ignored. After scaling, every column contributes a unit variance and the partition reorganises completely, which the agreement table makes obvious. The total within-SS values are not comparable across the two fits because the input scales differ; only the partition labels are.

</details>

### Exercise 2.2: Cluster a numeric subset of a mixed-type frame

**Task:** A marketing analyst has the `mtcars` frame and wants to cluster cars on continuous performance traits only. Build a clean numeric matrix by keeping just `mpg`, `disp`, `hp`, `drat`, `wt`, `qsec`, scale it, fit a four-cluster k-means with `nstart = 50`, and save the cluster vector named with car names as `ex_2_2`.

**Expected result:**

```
#>           Mazda RX4       Mazda RX4 Wag          Datsun 710      Hornet 4 Drive
#>                   2                   2                   3                   3
#>   Hornet Sportabout             Valiant          Duster 360           Merc 240D
#>                   1                   3                   1                   3
#> ...
#> # 24 more names hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
head(ex_2_2, 8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
num_cols <- c("mpg", "disp", "hp", "drat", "wt", "qsec")
mt_scaled <- scale(mtcars[, num_cols])
set.seed(3)
km_mt <- kmeans(mt_scaled, centers = 4, nstart = 50)
ex_2_2 <- setNames(km_mt$cluster, rownames(mtcars))
head(ex_2_2, 8)
```

**Explanation:** Selecting columns by name beats `select_if(is.numeric)` here because `vs`, `am`, `gear`, and `carb` are stored as numeric but are really categorical; tossing them into Euclidean distance silently warps the metric. Setting the names on the result keeps row identity through downstream merges. A `nstart` of 50 is a small cost for 32 rows and tightens the loss estimate for a write-up.

</details>

### Exercise 2.3: Impute then scale before clustering

**Task:** An ops engineer hands you a copy of `airquality` that still has missing `Ozone` and `Solar.R` cells. Replace each missing value with the column median, scale the resulting numeric matrix, fit a three-cluster k-means, and save a tibble-free data frame combining the original `Month` column with the new cluster label as `ex_2_3`.

**Expected result:**

```
#> # head(ex_2_3, 5)
#>   Month cluster
#> 1     5       1
#> 2     5       2
#> 3     5       2
#> 4     5       2
#> 5     5       2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
head(ex_2_3, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq <- airquality
for (col in c("Ozone", "Solar.R")) {
  aq[[col]][is.na(aq[[col]])] <- median(aq[[col]], na.rm = TRUE)
}
aq_scaled <- scale(aq[, c("Ozone", "Solar.R", "Wind", "Temp")])
set.seed(5)
km_aq <- kmeans(aq_scaled, centers = 3, nstart = 25)
ex_2_3 <- data.frame(Month = aq$Month, cluster = km_aq$cluster)
head(ex_2_3, 5)
```

**Explanation:** k-means errors out on any NA in the input, so imputation is non-optional, not stylistic. Column-median imputation is a fast neutral baseline; a more careful pipeline would use mice or a regression imputation, but those add variance that has to be propagated. Order matters: impute first, then scale, so the scaling statistics are computed on a complete matrix and not on whatever happens to be observed in that column.

</details>

## Section 3. Choosing k (3 problems)

### Exercise 3.1: Elbow plot via total within-SS for k = 1..10

**Task:** Run k-means with `nstart = 20` on scaled `USArrests` for every k from 1 through 10, collect each fit's `tot.withinss`, and save the named numeric vector indexed by k as `ex_3_1` so the elbow can be inspected by inverse-difference rather than by eyeballing a plot.

**Expected result:**

```
#>      1      2      3      4      5      6      7      8      9     10
#> 196.00 102.86  78.32  71.44  62.32  55.26  49.61  44.74  41.10  37.91
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
round(ex_3_1, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
set.seed(11)
ks <- 1:10
wss <- sapply(ks, function(k) kmeans(us_scaled, centers = k, nstart = 20)$tot.withinss)
ex_3_1 <- setNames(wss, ks)
round(ex_3_1, 2)
```

**Explanation:** Total within-SS is monotone non-increasing in k by construction, so the elbow is not a minimum but a knee in the rate of decrease. The first big drop here is from k=1 to k=2 (196 to 103), then k=2 to k=3 still earns 25 points, and after k=4 every extra cluster buys less than ten. Two or three is the defensible range; picking ten because the SS keeps dropping is over-fitting.

</details>

### Exercise 3.2: Average silhouette width for k = 2..8

**Task:** For scaled `USArrests`, compute the average silhouette width for every k from 2 through 8 using `cluster::silhouette()` against the Euclidean distance matrix, then save the named numeric vector indexed by k as `ex_3_2` so the maximising k jumps out.

**Expected result:**

```
#>     2     3     4     5     6     7     8
#> 0.408 0.310 0.341 0.247 0.205 0.211 0.156
```

**Difficulty:** Intermediate

```r title="Your turn"
us_scaled <- scale(USArrests)
d_us <- dist(us_scaled)
ex_3_2 <- # your code here
round(ex_3_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
d_us <- dist(us_scaled)
set.seed(2)
asw <- sapply(2:8, function(k) {
  km <- kmeans(us_scaled, centers = k, nstart = 25)
  mean(silhouette(km$cluster, d_us)[, "sil_width"])
})
ex_3_2 <- setNames(asw, 2:8)
round(ex_3_2, 3)
```

**Explanation:** Silhouette compares each point's mean distance to its own cluster against its mean distance to the next-closest cluster, so the average sits in [-1, 1]. The k that maximises it is the most internally cohesive and externally separated. Here k=2 wins decisively at 0.41 because the four-variable arrests profile splits cleanly into a high-violence and low-violence band. The elbow from the previous exercise pointed at k=3, which is why the two diagnostics belong together.

</details>

### Exercise 3.3: Gap statistic with clusGap

**Task:** Use `cluster::clusGap()` with 50 bootstrap references and `kmeans` as the FUNcluster on scaled `USArrests` for k from 1 through 8, then save the Tibshirani gap value and `s.e.sim` columns indexed by k as the data frame `ex_3_3`. The optimal k is the smallest k where Gap(k) >= Gap(k+1) - s.e.sim(k+1).

**Expected result:**

```
#>   k   gap   SE
#> 1 1 0.299 0.029
#> 2 2 0.477 0.038
#> 3 3 0.541 0.038
#> 4 4 0.581 0.036
#> 5 5 0.601 0.034
#> 6 6 0.625 0.034
#> 7 7 0.658 0.033
#> 8 8 0.683 0.033
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
gs <- clusGap(scale(USArrests), FUN = kmeans, nstart = 25, K.max = 8, B = 50)
tab <- gs$Tab
ex_3_3 <- data.frame(
  k   = seq_len(nrow(tab)),
  gap = round(tab[, "gap"], 3),
  SE  = round(tab[, "SE.sim"], 3)
)
ex_3_3
```

**Explanation:** The gap statistic compares log within-SS against the distribution under a uniform null reference, so it punishes the trivial "always more clusters reduces SS" effect. The 1-SE rule (smallest k whose gap is within one standard error of the next) is the conservative pick. Production code should bump `B` to 500 once the runtime budget allows, because the SE on `gap` shrinks as `1/sqrt(B)` and a noisy SE produces a noisy k.

</details>

## Section 4. Stability and reproducibility (2 problems)

### Exercise 4.1: Effect of nstart on the within-SS minimum

**Task:** A reviewer questions whether your reported k-means loss is reproducible. Refit a 5-cluster k-means on scaled `USArrests` four times with the same seed but `nstart` set to 1, 5, 25, and 100, collect the `tot.withinss` from each, and save the named numeric vector as `ex_4_1` showing the loss plateau as restarts increase.

**Expected result:**

```
#>      1      5     25    100
#> 79.61  62.50  62.32  62.32
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
round(ex_4_1, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
nstarts <- c(1, 5, 25, 100)
losses <- sapply(nstarts, function(n) {
  set.seed(42)
  kmeans(us_scaled, centers = 5, nstart = n)$tot.withinss
})
ex_4_1 <- setNames(losses, nstarts)
round(ex_4_1, 2)
```

**Explanation:** A single random start often gets trapped in a local minimum, especially as k grows; the 79.6 at `nstart=1` is roughly 27% worse than the 62.3 reached by 25 restarts. After about 25 the loss flatlines, which is why `nstart = 25` is the working default in `factoextra` and most published recipes. The lesson generalises to every Lloyd-style algorithm: report the loss after enough restarts that more does not lower it.

</details>

### Exercise 4.2: Hand-rolled cluster stability via bootstrap resamples

**Task:** Without using `fpc::clusterboot`, write a routine that draws 50 bootstrap resamples of scaled `USArrests`, refits 3-cluster k-means on each resample, projects the labels back to the full 50 states via the closest original centroid, and saves the 50-by-50 co-membership frequency matrix (proportion of bootstraps where i and j share a cluster) as `ex_4_2`. Diagonal entries are 1.

**Expected result:**

```
#> dim(ex_4_2): 50 50
#> ex_4_2[1:4, 1:4]
#>             Alabama Alaska Arizona Arkansas
#> Alabama        1.00   0.62    0.66     0.74
#> Alaska         0.62   1.00    0.74     0.50
#> Arizona        0.66   0.74    1.00     0.48
#> Arkansas       0.74   0.50    0.48     1.00
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2[1:4, 1:4]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
n <- nrow(us_scaled)
B <- 50
set.seed(99)
co <- matrix(0, n, n, dimnames = list(rownames(us_scaled), rownames(us_scaled)))
for (b in seq_len(B)) {
  idx <- sample.int(n, replace = TRUE)
  km_b <- kmeans(us_scaled[idx, , drop = FALSE], centers = 3, nstart = 10)
  d2c <- as.matrix(dist(rbind(us_scaled, km_b$centers)))[1:n, (n + 1):(n + 3)]
  labels <- max.col(-d2c)
  for (i in seq_len(n)) for (j in seq_len(n)) {
    co[i, j] <- co[i, j] + (labels[i] == labels[j])
  }
}
ex_4_2 <- co / B
ex_4_2[1:4, 1:4]
```

**Explanation:** The bootstrap exposes which point-pairs always cluster together (co-membership near 1) versus those that swap clusters between resamples (co-membership near 0.5). A noisy off-diagonal block flags a soft boundary the user should not treat as discrete. Re-projecting via closest centroid rather than refitting on the full sample keeps the comparison apples-to-apples, since the labels emitted by `kmeans` are arbitrary numerics that vary across runs.

</details>

## Section 5. Hierarchical clustering (3 problems)

### Exercise 5.1: Build an hclust on USArrests and cut to three groups

**Task:** A criminologist wants states grouped by violent-crime profile. Compute Euclidean distances on scaled `USArrests`, build a hierarchical clustering with `method = "ward.D2"`, cut the resulting dendrogram to three groups with `cutree`, and save the named integer cluster vector as `ex_5_1` ordered by the state names as they appear in the data.

**Expected result:**

```
#>     Alabama      Alaska     Arizona    Arkansas  California    Colorado
#>           1           1           1           2           1           2
#> Connecticut    Delaware     Florida     Georgia      Hawaii       Idaho
#>           3           1           1           1           3           3
#> ...
#> # 38 more states hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
head(ex_5_1, 12)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
d_us <- dist(us_scaled, method = "euclidean")
hc <- hclust(d_us, method = "ward.D2")
ex_5_1 <- cutree(hc, k = 3)
head(ex_5_1, 12)
```

**Explanation:** `ward.D2` is Ward's method on the actual Euclidean distances (the original `ward.D` mistakenly skipped the squaring step), so it is the right choice when paired with `dist(...)` rather than `dist(...)^2`. Cutting the tree at k=3 produces a sharp partition that broadly aligns with high-violence southern states, mid-violence western states, and low-violence north-eastern states. Hierarchical labels are deterministic for a given distance matrix, unlike k-means.

</details>

### Exercise 5.2: Compare four linkage methods on the same distance matrix

**Task:** Using the Euclidean distance matrix on scaled `USArrests`, build four `hclust` fits with single, complete, average, and ward.D2 linkage. For each, cut to three clusters and save the four label vectors side-by-side as a 50-row data frame `ex_5_2` so the chaining behaviour of single-linkage shows up against the more balanced partitions.

**Expected result:**

```
#> head(ex_5_2, 6)
#>             single complete average ward.D2
#> Alabama          1        1       1       1
#> Alaska           1        1       1       1
#> Arizona          1        1       1       1
#> Arkansas         1        1       1       2
#> California       1        1       1       1
#> Colorado         1        1       1       2
#>
#> table per method (cluster sizes):
#> single:  c(48, 1, 1)
#> complete: c(8, 11, 31)
#> average:  c(2, 1, 47)
#> ward.D2: c(16, 14, 20)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
sapply(ex_5_2, function(v) as.integer(table(v)))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
d_us <- dist(us_scaled)
methods <- c("single", "complete", "average", "ward.D2")
labels <- lapply(methods, function(m) cutree(hclust(d_us, method = m), k = 3))
ex_5_2 <- as.data.frame(setNames(labels, methods))
rownames(ex_5_2) <- rownames(USArrests)
sapply(ex_5_2, function(v) as.integer(table(v)))
```

**Explanation:** Single linkage chains: the second and third "clusters" are degenerate singletons because the algorithm merges any pair of points that share a nearby neighbour, hollowing out the giant cluster only at the end. Ward produces the most balanced split because it minimises within-cluster variance and resists chaining. Complete linkage sits between the two. Linkage choice is not cosmetic; it changes the answer.

</details>

### Exercise 5.3: Cophenetic correlation to pick a linkage

**Task:** For the four linkages from the previous exercise, compute the cophenetic correlation between the input distance matrix and the cophenetic distances induced by each dendrogram, then save the named numeric vector as `ex_5_3` so the linkage that best preserves the original pairwise distances is identifiable.

**Expected result:**

```
#>   single complete  average  ward.D2
#>    0.539    0.698    0.718    0.692
```

**Difficulty:** Advanced

```r title="Your turn"
us_scaled <- scale(USArrests)
d_us <- dist(us_scaled)
ex_5_3 <- # your code here
round(ex_5_3, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
d_us <- dist(us_scaled)
methods <- c("single", "complete", "average", "ward.D2")
cc <- sapply(methods, function(m) {
  hc <- hclust(d_us, method = m)
  cor(d_us, cophenetic(hc))
})
ex_5_3 <- cc
round(ex_5_3, 3)
```

**Explanation:** Cophenetic distance is the height in the dendrogram where two leaves merge, so the correlation between input distances and cophenetic distances measures how faithfully the tree encodes the original geometry. Average linkage and UPGMA-style methods tend to win this metric because they explicitly optimise an average distance criterion. Ward and complete come close because they bias toward compact clusters. A score below 0.6, as here for single linkage, is a strong signal that the dendrogram is a poor summary of the data.

</details>

## Section 6. Comparing and visualising partitions (3 problems)

### Exercise 6.1: Adjusted Rand index between k-means and ward labels

**Task:** Compare the 3-cluster k-means labels from `ex_1_1$cluster` against the 3-cluster ward.D2 hierarchical labels from `ex_5_1` using `mclust::adjustedRandIndex`. Wrap the raw ARI, the raw Rand index, and the confusion table into a list named `ex_6_1` so the agreement between the two algorithms is fully auditable.

**Expected result:**

```
#> $adjusted_rand_index
#> [1] 0.62
#>
#> $confusion
#>          ward
#> kmeans     1  2  3
#>      1    50  0  0
#>      2     0 39 14
#>      3     0  0 47
```

**Difficulty:** Intermediate

```r title="Your turn"
# Refit ward.D2 on the same iris scaled data so labels are comparable
iris_scaled <- scale(iris[, 1:4])
hc_iris <- hclust(dist(iris_scaled), method = "ward.D2")
ward_lab <- cutree(hc_iris, k = 3)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris_scaled <- scale(iris[, 1:4])
hc_iris <- hclust(dist(iris_scaled), method = "ward.D2")
ward_lab <- cutree(hc_iris, k = 3)
ex_6_1 <- list(
  adjusted_rand_index = round(adjustedRandIndex(ex_1_1$cluster, ward_lab), 2),
  confusion           = table(kmeans = ex_1_1$cluster, ward = ward_lab)
)
ex_6_1
```

**Explanation:** Plain Rand index is biased upward by chance agreement; the adjusted version subtracts that expectation and is zero for random pairings and one for identical partitions. A value of 0.62 means k-means and Ward agree on the bulk of pairs but disagree on the versicolor/virginica boundary, which the confusion table localises. ARI is the right summary whenever cluster labels are arbitrary integers, because it does not depend on label permutation.

</details>

### Exercise 6.2: Project clusters onto the first two principal components

**Task:** Use `factoextra::fviz_cluster` to visualise the `ex_1_1` k-means partition on the scaled `iris[, 1:4]` data using the first two principal components as axes, with convex hulls and the observation labels suppressed. Save the resulting ggplot object as `ex_6_2` so a downstream `ggsave` call can render it.

**Expected result:**

```
#> # Plot description
#> # Scatter on PC1 vs PC2, 150 points coloured by cluster (1, 2, 3),
#> # three convex hulls, no point labels, default factoextra theme.
#> # ggplot object of class c("gg", "ggplot")
class(ex_6_2)
#> [1] "gg"     "ggplot"
```

**Difficulty:** Intermediate

```r title="Your turn"
iris_scaled <- scale(iris[, 1:4])
ex_6_2 <- # your code here
class(ex_6_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris_scaled <- scale(iris[, 1:4])
ex_6_2 <- fviz_cluster(
  ex_1_1,
  data        = iris_scaled,
  geom        = "point",
  ellipse     = FALSE,
  show.clust.cent = TRUE
) +
  ggplot2::labs(title = "k-means clusters on iris (PCA projection)")
class(ex_6_2)
```

**Explanation:** `fviz_cluster` runs `prcomp` under the hood and plots scores on the first two principal components, which together explain about 96% of variance in scaled iris and so are an honest 2-D summary. Suppressing the per-point labels is a defensive habit on datasets larger than 50 rows; the figure becomes unreadable otherwise. The returned object is a regular ggplot, so further `+` layers customise it without touching factoextra internals.

</details>

### Exercise 6.3: PAM on USArrests and agreement with k-means

**Task:** A statistician argues that k-means is too sensitive to outliers and prefers k-medoids. Fit `cluster::pam` with three medoids on scaled `USArrests`, also fit k-means with three centers and `nstart = 25`, then save a list containing the medoid state names, the PAM cluster sizes, and the adjusted Rand index between PAM and k-means labels as `ex_6_3`.

**Expected result:**

```
#> $medoid_states
#> [1] "New Mexico" "Nebraska"   "New Jersey"
#>
#> $pam_sizes
#> [1] 20 14 16
#>
#> $ari_pam_vs_kmeans
#> [1] 0.92
```

**Difficulty:** Advanced

```r title="Your turn"
us_scaled <- scale(USArrests)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
us_scaled <- scale(USArrests)
set.seed(13)
pm <- pam(us_scaled, k = 3)
km <- kmeans(us_scaled, centers = 3, nstart = 25)
ex_6_3 <- list(
  medoid_states     = rownames(us_scaled)[pm$id.med],
  pam_sizes         = as.integer(table(pm$clustering)),
  ari_pam_vs_kmeans = round(adjustedRandIndex(pm$clustering, km$cluster), 2)
)
ex_6_3
```

**Explanation:** PAM minimises sum of dissimilarities to a medoid, which is an actual data point rather than a mean vector, so it is robust to outliers and works with arbitrary distance matrices via `daisy`. On scaled `USArrests` PAM and k-means agree at ARI 0.92, meaning the two methods carve the country almost identically; the small disagreements sit on states near a boundary. When the data has heavy-tailed columns or non-Euclidean metrics, the agreement drops and PAM is the safer default.

</details>

## What to do next

Now that you have a working clustering toolkit, deepen the foundation and apply it to broader workflows:

- Revisit the [Cluster Analysis in R](Cluster-Analysis-in-R.html) parent tutorial to see every diagnostic in context with end-to-end narrative.
- Try the [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html) hub to combine clustering with supervised pipelines and resampling.
- Practise the [EDA Exercises in R](EDA-Exercises-in-R.html) hub, since most clustering work begins with a careful univariate and bivariate exploration.
- Sharpen the matrix and scaling fundamentals via the [dplyr Exercises in R](dplyr-Exercises-in-R.html) hub, which underpins the preprocessing every cluster algorithm depends on.
