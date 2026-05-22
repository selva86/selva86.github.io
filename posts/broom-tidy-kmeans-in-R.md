---
title: "broom tidy() for kmeans in R: Cluster Centers and Sizes"
slug: "broom-tidy-kmeans-in-R"
description: "Tidy kmeans clustering output in R with broom::tidy(). Get a clean data frame of cluster centers, sizes, and within-cluster sums of squares in one call."
keywords: "broom tidy kmeans, tidy kmeans R, broom kmeans clusters, tidy clustering output, kmeans cluster centers, tidy.kmeans, broom cluster analysis"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Cluster-Analysis-in-R.html"
auto_link_terms: "broom::tidy()|broom tidy|tidy kmeans|kmeans clusters|tidy clustering output"
auto_link_case_sensitive: true
target_keyword: "broom tidy kmeans"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for kmeans in R: Cluster Centers and Sizes

<p class="lead">The <code>broom::tidy()</code> function turns a <code>kmeans</code> object into a one-row-per-cluster data frame holding the cluster means for every input variable, the cluster size, and the within-cluster sum of squares. It is the fastest way to pipe clustering output into <code>dplyr</code>, <code>ggplot2</code>, or a report.</p>

[QUICK ANSWER]
tidy(km)                                        # one row per cluster, all centers
tidy(km, col.names = c("a","b","c","d"))        # rename center columns
glance(km)                                      # one-row model summary
augment(km, data = iris[, 1:4])                 # append .cluster to data
tidy(km) |> arrange(desc(size))                 # largest cluster first
tidy(km) |> arrange(withinss)                   # tightest cluster first
purrr::map_dfr(2:8, ~glance(kmeans(x, .x)))     # elbow-plot source

[DECISION TREE: Is tidy() the right tool for a kmeans fit?]
- one row per cluster with centers + size + withinss: tidy(km)
- one-row model summary (totss, betweenss, iter): glance(km)
- attach .cluster to the original observations: augment(km, data = df)
- pick the optimal k from many fits: factoextra::fviz_nbclust(df, kmeans)
- silhouette score per observation: cluster::silhouette(km$cluster, dist(df))
- non-spherical or noisy clusters: dbscan::dbscan(df, eps, minPts)
- final cluster table for a report: gtsummary::tbl_summary(augmented, by = .cluster)

## What tidy() does for kmeans in one sentence

**The tidier reshapes the cluster output into a tibble with one row per cluster.** A fitted kmeans object is an S3 list with separate components for centers, sizes, and within-cluster sums of squares. The tidier joins those pieces into a rectangular data frame keyed by cluster id, so downstream dplyr verbs and ggplot geoms work without manual extraction.

For a three-cluster fit on a four-variable dataset, the result has three rows and seven columns: four center columns (one per input variable), size, withinss, and cluster. Reading the tibble end-to-end gives you the full cluster profile at a glance.

## Syntax

**`tidy()` is an S3 generic; broom dispatches on the `kmeans` class automatically.** The function takes the fitted object as the only required argument; an optional `col.names` argument relabels the center columns when the originals are inconvenient.

```r title="Load packages and fit kmeans on iris"
library(broom)
library(dplyr)
library(ggplot2)
library(purrr)

set.seed(42)
iris_x <- iris[, 1:4]
km <- kmeans(iris_x, centers = 3, nstart = 25)
class(km)
#> [1] "kmeans"
```

The two arguments worth knowing are:

- `x`: the fitted `kmeans` object (required)
- `col.names`: a character vector of names for the center columns; default uses the column names from the data passed to `kmeans()`

Both `glance()` and `augment()` follow the same dispatch pattern and round out the broom interface for clustering.

[TIP]
**Always pass `nstart = 25` or higher to `kmeans()` before tidying.** A single random start often lands on a local minimum that produces unstable cluster centers. With `nstart = 25`, R runs 25 random initializations and keeps the best, so `tidy(km)` returns a reproducible profile.

## Common patterns

### 1. Cluster centers and sizes

```r title="Tidy a kmeans fit to inspect centers"
tidy(km)
#> # A tibble: 3 x 7
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width  size withinss cluster
#>          <dbl>       <dbl>        <dbl>       <dbl> <int>    <dbl> <fct>
#> 1         5.01        3.43         1.46       0.246    50     15.2 1
#> 2         5.90        2.75         4.39       1.43     62     39.8 2
#> 3         6.85        3.07         5.74       2.07     38     23.9 3
```

Each row is one cluster. The first four columns hold the mean of each input variable inside that cluster. `size` is the row count and `withinss` is the sum of squared distances from each member to its cluster center. Lower `withinss` relative to `size` means a tighter cluster.

Reading the centers gives an immediate cluster profile. Cluster 1 has the smallest petals (length 1.46, width 0.25) and the highest sepal width; that is the `setosa` species in disguise. Cluster 3 has the largest petals across both dimensions, matching `virginica`. Cluster 2 sits in between and aligns with `versicolor`. The whole interpretation comes from the tibble; no extra extraction is needed.

### 2. One-row model summary with glance()

```r title="Glance for totss, betweenss, and iterations"
glance(km)
#> # A tibble: 1 x 4
#>   totss tot.withinss betweenss  iter
#>   <dbl>        <dbl>     <dbl> <int>
#> 1  681.         78.9      603.     2
```

`glance()` returns the model-level diagnostics: total sum of squares (`totss`), total within-cluster SS (`tot.withinss`), between-cluster SS (`betweenss`), and the number of iterations to converge. The ratio `betweenss / totss` is the standard "variance explained" metric for kmeans; here, about 89 percent. Anything above 80 percent on well-scaled data is usually good; below 60 percent suggests too few clusters or non-spherical structure.

### 3. Attach cluster labels with augment()

```r title="Augment to add .cluster to the data"
aug <- augment(km, data = iris_x)
head(aug, 4)
#> # A tibble: 4 x 5
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width .cluster
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>
#> 1          5.1         3.5          1.4         0.2 1
#> 2          4.9         3            1.4         0.2 1
#> 3          4.7         3.2          1.3         0.2 1
#> 4          4.6         3.1          1.5         0.2 1
```

`augment()` returns the original rows with a `.cluster` factor column appended. This is the join key for any downstream summary, plot, or report. Pass the same data you used for `kmeans()`; broom does not store the design matrix on the fit. From here, profiling is a one-liner: bind `iris$Species` to `aug` and call `count(.cluster, Species)` to see actual versus assigned labels.

### 4. Elbow plot from many fits

```r title="Build an elbow plot with glance across k"
elbow <- purrr::map_dfr(
  1:8,
  ~ glance(kmeans(iris_x, centers = .x, nstart = 25)),
  .id = "k"
)
elbow |> select(k, tot.withinss)
#> # A tibble: 8 x 2
#>   k     tot.withinss
#>   <chr>        <dbl>
#> 1 1           681.
#> 2 2           152.
#> 3 3            78.9
#> 4 4            57.3
#> 5 5            46.5
#> 6 6            39.1
#> 7 7            34.3
#> 8 8            30.2
```

Plot `tot.withinss` against `k` and look for the kink; here, the drop from k = 2 to k = 3 is the last steep one, suggesting three clusters fit `iris` well. The `purrr::map_dfr()` + `glance()` pattern scales the same way for any other clustering hyperparameter.

The same trick generalizes beyond kmeans. Swap the inner call for `cluster::pam()` or `mclust::Mclust()` and the rest of the pipeline still works.

[KEY INSIGHT]
**The tidy data frame is the bridge between clustering and tidyverse tooling.** Once `tidy()` returns a tibble of cluster profiles, every dplyr verb, every ggplot geom, and every `gt`/`flextable` layout works without any custom shim. That is why broom is bundled with tidymodels even when you only fit one clustering model.

## tidy() vs print(km) and factoextra

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `print(km)` | printed text + nested list | Quick console check |
| `broom::tidy(km)` | tibble (data frame) | dplyr piping, ggplot, custom tables |
| `factoextra::fviz_cluster(km, data)` | ggplot object | Final 2D cluster plot for a report |

Use `tidy()` whenever the next step is code: filtering clusters by size, joining centers back to raw rows, drawing a custom bar chart of profiles. Use `factoextra` for the final figure; it handles PCA projection and color palettes for you, but it does not return a tibble.

## Common pitfalls

**Pitfall 1: passing the raw data, not the fit.** `tidy(iris_x)` does not run kmeans for you; it returns a tibble describing the data frame. Fit the model first, then tidy the model.

```r title="Wrong: tidying the data instead of the fit"
tidy(iris_x) |> head(2)
#> # A tibble: 2 x 4
#>   column         n  mean    sd
#>   <chr>      <dbl> <dbl> <dbl>
#> 1 Sepal.Length 150  5.84 0.828
#> 2 Sepal.Width  150  3.06 0.436
```

That is `broom::tidy.data.frame`, a summary of each column, not cluster centers.

**Pitfall 2: forgetting `nstart`.** Without `nstart`, you may get different cluster ids on each run, and `tidy(km)` will return permuted rows. Cluster identity in kmeans is arbitrary; pin the seed AND raise `nstart` for stable downstream code.

[WARNING]
**The `.cluster` column from `augment()` is a factor, not an integer.** If you join augmented output back to a numeric-keyed table, cast with `as.integer(as.character(.cluster))`. A direct `as.integer(.cluster)` returns factor levels in encounter order, which silently differs from the printed label for clusters with non-default level ordering.

**Pitfall 3: mixing tidy.kmeans with tidy.Mclust output.** Both `kmeans` and `Mclust` are clustering fits, but their tidy outputs differ. `tidy.Mclust` returns mixing proportions and probabilistic memberships, not hard centers. Code that assumes `size` and `withinss` will break when handed a `Mclust` fit.

## Try it yourself

**Try it:** Fit kmeans with `k = 4` on the four numeric columns of `iris`, then use `tidy()` to get cluster centers and sizes. Filter the result to only clusters with at least 30 members. Save the filtered tibble to `ex_clusters`.

```r title="Your turn: tidy and filter clusters"
# Try it: tidy a 4-cluster fit, keep clusters with size >= 30
ex_clusters <- # your code here

ex_clusters
#> Expected: at most 4 rows; each row has size >= 30
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_km <- kmeans(iris[, 1:4], centers = 4, nstart = 25)
ex_clusters <- tidy(ex_km) |> filter(size >= 30)
ex_clusters
#> # A tibble: 3 x 7
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width  size withinss cluster
#>          <dbl>       <dbl>        <dbl>       <dbl> <int>    <dbl> <fct>
#> 1         5.01        3.43         1.46       0.246    50     15.2 1
#> 2         5.53        2.62         3.97       1.23     32     10.4 2
#> 3         6.53        3.06         5.51       2.16     45     27.5 3
```

**Explanation:** `tidy(ex_km)` returns one row per cluster with the centers, size, and within-cluster SS. The `filter(size >= 30)` step keeps only clusters with enough members to be worth profiling, which is a common screen before reporting.

</details>

## Related broom functions for clustering

After mastering `tidy()` for kmeans, look at:

- `glance()`: one-row model summary with `totss`, `tot.withinss`, `betweenss`, and `iter`
- `augment()`: original data with a `.cluster` factor appended
- `tidy.Mclust()`: same idea for Gaussian mixture models from the mclust package
- `factoextra::fviz_cluster()`: ggplot-based cluster visualization built on broom output

For a quick cluster-profile bar chart, pivot the tidy output to long form and pipe into `ggplot2::geom_col()`. For a model-selection plot, combine `purrr::map_dfr()` with `glance()` as shown above.

See the official [broom documentation for kmeans methods](https://broom.tidymodels.org/reference/kmeans_tidiers.html) for the complete column reference per tidier.

## FAQ

**How do I get cluster centers from a kmeans object?**

Call `tidy(km)`. Each row is one cluster, and the first columns are the cluster means for every variable you passed to `kmeans()`. This replaces the older pattern of pulling `km$centers` and binding `km$size` and `km$withinss` by hand. The tidy output is a tibble, so you can pipe it into `dplyr::arrange()` or `ggplot2::ggplot()` without further reshaping.

**Does broom tidy work with kmeans from base R?**

Yes. `broom::tidy()` ships with an S3 method for the base `stats::kmeans` class, so any fit produced by `kmeans()` is supported with no extra package. For other clustering algorithms, broom provides `tidy.Mclust` (mclust package) and partial support for `hclust` via `tidy.hclust`.

**What is the difference between tidy(), glance(), and augment() for kmeans?**

`tidy(km)` returns one row per cluster with centers, size, and withinss. `glance(km)` returns one row summarizing the whole fit: total SS, between-cluster SS, total within-cluster SS, and iterations. `augment(km, data)` returns the original observations with a `.cluster` column appended. Use `tidy()` for cluster profiles, `glance()` for model diagnostics, `augment()` for downstream joins.

**Can tidy() pick the right number of clusters for me?**

No. `tidy()` only describes the fit you pass. To choose `k`, combine `purrr::map_dfr()` with `glance()` across a range of values and inspect `tot.withinss` for an elbow, or use `factoextra::fviz_nbclust()` for a silhouette or gap-statistic plot. Both approaches consume tidy or glance output downstream.

**Why does cluster id 1 differ between two kmeans runs?**

Cluster ids in kmeans are arbitrary labels assigned in random-start order. Two runs on the same data with different seeds can swap label numbers even when the actual partition is identical. Fix the seed with `set.seed()` and raise `nstart` to 25 or higher for stable, reproducible labels in your tidy output.
