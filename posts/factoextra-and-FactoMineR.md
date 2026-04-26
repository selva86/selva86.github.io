---
title: "factoextra in R: Publication-Quality PCA and Cluster Visualisations in Minutes"
slug: "factoextra-and-FactoMineR"
description: "factoextra wraps ggplot2 around prcomp(), kmeans() and hclust() in R. Master fviz_pca_biplot(), fviz_cluster() and fviz_dend() with runnable examples."
keywords: "factoextra in R, FactoMineR, fviz_pca_biplot, fviz_cluster, fviz_dend, fviz_nbclust, PCA visualisation R, cluster visualisation R, scree plot R, biplot R"
auto_link_terms: "factoextra|FactoMineR|fviz_pca_biplot()|fviz_cluster()|fviz_dend()|fviz_nbclust()|fviz_eig()|fviz_contrib()"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-26"
curriculum_id: "2.5.10"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "factoextra (PCA + Clusters)"
sidebar_order: 80
difficulty: "Intermediate"
---

# factoextra in R: Publication-Quality PCA and Cluster Visualisations in Minutes

<p class="lead">factoextra is an R package that turns the dense numeric output of <code>prcomp()</code>, <code>kmeans()</code>, and <code>hclust()</code> into publication-ready ggplot2 visuals through a single <code>fviz_*()</code> call.</p>

## What does factoextra add on top of base R PCA and clustering?

Most R users hit the same wall after running `prcomp()` or `kmeans()`: the numbers are right, but the default plots look like 1995. The `fviz_*()` family in factoextra wraps every common multivariate result in ggplot2, with sensible defaults for colors, labels, and legends. Three lines of code, and you have a chart you can drop straight into a paper.

Here is the payoff. Run a scaled PCA on `iris`, then ask factoextra for a coloured biplot with species ellipses and non-overlapping labels.

```r title="Iris PCA biplot in three lines"
library(factoextra)

pc_iris <- prcomp(iris[, 1:4], scale. = TRUE)

fviz_pca_biplot(
  pc_iris,
  habillage   = iris$Species,
  addEllipses = TRUE,
  repel       = TRUE
)
#> Renders a biplot: 50 setosa points cleanly separated on the left,
#> versicolor and virginica overlapping on the right, with petal-length
#> and petal-width arrows pointing to the right and ellipses around each
#> species group.
```

The interesting part is what we did *not* write. No manual `ggplot()` setup, no `geom_point()` plus `geom_segment()` plus `geom_text_repel()` for arrows, no per-group colour scale. `fviz_pca_biplot()` infers all of that from the `prcomp` object and the grouping factor.

[KEY INSIGHT]
**factoextra returns a ggplot.** Every `fviz_*()` call hands back a regular ggplot object, so you can keep layering with `+ theme_minimal()`, `+ labs(title = "...")`, or `+ scale_color_brewer()` exactly as you would with any other ggplot.

**Try it:** Run a scaled PCA on six numeric `mtcars` columns and plot a biplot coloured by cylinder count. Use `factor(mtcars$cyl)` as the grouping variable.

```r title="Your turn: mtcars biplot by cylinder"
# Try it: PCA biplot for mtcars
ex_pc <- prcomp(mtcars[, c("mpg", "disp", "hp", "drat", "wt", "qsec")], scale. = TRUE)

# Build the biplot below:
# fviz_pca_biplot( ... )
#> Expected: a biplot with three colour groups (4-cyl, 6-cyl, 8-cyl)
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars biplot solution"
fviz_pca_biplot(
  ex_pc,
  habillage   = factor(mtcars$cyl),
  addEllipses = TRUE,
  repel       = TRUE
)
```

**Explanation:** `habillage` accepts any factor with one level per row of the original data. The arrows point from the origin in the direction each variable pulls the principal components, and the three cylinder groups separate cleanly along PC1.

</details>

## How do I make a publication-quality PCA biplot?

A biplot does two jobs at once. Each point shows where an observation lands in PC1 by PC2 space, and each arrow shows how strongly a variable loads onto those same axes. factoextra's `fviz_pca_biplot()` stitches both layers together so the reader sees observations and drivers in one chart.

![PCA workflow with factoextra](screenshots/factoextra-and-FactoMineR-pca-workflow.webp)
*Figure 1: The PCA workflow with factoextra: one prcomp() call feeds every fviz_*() function.*

We will switch to the built-in `USArrests` dataset for the rest of the post. It has four numeric crime rates across 50 US states, which is small enough to read every label.

```r title="USArrests PCA + plain biplot"
pc <- prcomp(USArrests, scale. = TRUE)

fviz_pca_biplot(pc, repel = TRUE)
#> Biplot of 50 states; "Murder", "Assault", "Rape" arrows pointing
#> right (driving PC1); "UrbanPop" arrow pointing up (driving PC2).
#> States like Florida and Nevada land far right (high crime).
```

Reading the chart: states on the right are high-crime, states at the top are highly urban, and the angles between arrows tell you how variables correlate. `Murder`, `Assault`, and `Rape` cluster tightly together because they correlate strongly. `UrbanPop` sits near 90 degrees away, signalling near-independence from violent crime in this data.

[TIP]
**Always set `repel = TRUE` on biplots.** factoextra runs ggrepel under the hood to push overlapping labels apart. Without it, dense biplots become unreadable bowls of text.

Now layer in the customisations a paper would expect: a curated palette, points coloured by quality of representation (cos2), and a clean theme.

```r title="Polished biplot coloured by cos2"
fviz_pca_biplot(
  pc,
  col.ind        = "cos2",
  gradient.cols  = c("#00AFBB", "#E7B800", "#FC4E07"),
  repel          = TRUE,
  geom.ind       = "point",
  pointshape     = 21,
  pointsize      = 2.5
) +
  ggplot2::theme_minimal() +
  ggplot2::labs(title = "USArrests: PC1 vs PC2 (coloured by cos2)")
#> Same biplot, points sized and coloured on a teal-orange gradient by
#> their cos2 (representation quality on PC1-PC2). Dim labels become
#> light teal, well-represented states (e.g. Florida, North Carolina)
#> become deep orange.
```

The `col.ind = "cos2"` argument tells factoextra to colour each observation by how well the first two principal components capture it. States in deep orange are well-represented by this 2D view; states in pale teal are mostly described by PC3 or PC4 and should be interpreted with caution.

**Try it:** Re-run the polished biplot with the `"npg"` (Nature Publishing Group) palette and switch the geometry to text labels instead of points.

```r title="Your turn: NPG palette + text geom"
# Try it: change palette and geometry
# fviz_pca_biplot( pc, ... )
#> Expected: biplot with NPG-style colours and state names instead of points
```

<details>
<summary>Click to reveal solution</summary>

```r title="NPG biplot solution"
fviz_pca_biplot(
  pc,
  habillage   = rep("All", nrow(USArrests)),
  palette     = "npg",
  geom.ind    = "text",
  repel       = TRUE
)
```

**Explanation:** `palette` accepts journal-themed names from ggsci (`jco`, `npg`, `aaas`, `lancet`). Setting `geom.ind = "text"` replaces points with the row names from `USArrests` (the state labels).

</details>

## How do I tell which variables drive each principal component?

A biplot shows the answer geometrically, but for a written report you usually want hard numbers. Three diagnostics carry most of the load: the scree plot for variance explained, the contribution bar plot for variables, and the variable correlation circle.

Start with the scree plot. It tells you whether two components are enough to summarise the data or whether you need three or more.

```r title="Scree plot with variance labels"
fviz_eig(pc, addlabels = TRUE, ylim = c(0, 70))
#> Bar plot of eigenvalues. PC1 ~62%, PC2 ~25%, PC3 ~9%, PC4 ~4%.
#> Cumulative variance through PC2 ≈ 87%.
```

Two principal components capture roughly 87 percent of the variance in `USArrests`, which means a 2D biplot is a faithful summary. If PC1 had captured only 30 percent, we would have needed to draw PC2 vs PC3 or use a 3D method instead.

[WARNING]
**Always pass `scale. = TRUE` when variables use different units.** `USArrests` mixes counts per 100k (Murder, Assault, Rape) with a percentage (UrbanPop), so unscaled PCA would let `Assault` (largest variance) dominate every component. Scaling fixes that by giving each variable unit variance before decomposition.

Next, ask which variables drive PC1.

```r title="Variable contributions to PC1"
fviz_contrib(pc, choice = "var", axes = 1, top = 4)
#> Bar plot: Assault ~35%, Murder ~32%, Rape ~28%, UrbanPop ~5%.
#> Dashed red line at 25% (the expected uniform contribution).
```

Three of the four variables sit above the dashed red line - the line marks the contribution each variable would have if all four contributed equally (100 / 4 = 25 percent). `Assault`, `Murder`, and `Rape` all clear that bar, confirming that PC1 is essentially a violent-crime axis. `UrbanPop` falls well short, which is exactly what we want: it gets its own axis, PC2.

[NOTE]
**cos2 vs contrib are easy to mix up.** `cos2` measures how well an axis represents a variable (a quality score). `contrib` measures how much a variable explains an axis (a share of variance). The biplot above coloured *individuals* by cos2; the bar chart here ranks *variables* by contrib.

Finally, the variable correlation circle gives an at-a-glance summary of every variable on every selected axis.

```r title="Variable correlation circle"
fviz_pca_var(
  pc,
  col.var       = "contrib",
  gradient.cols = c("#00AFBB", "#E7B800", "#FC4E07"),
  repel         = TRUE
)
#> Unit circle with four arrows. Murder, Assault, Rape clustered tightly
#> on the right (high PC1 loading), UrbanPop straight up (high PC2),
#> arrows coloured by total contribution to PC1+PC2.
```

Arrows close to the unit circle are well-represented in the PC1-PC2 plane. Arrows pointing in similar directions correlate positively; arrows at right angles are roughly uncorrelated; arrows pointing opposite ways correlate negatively.

**Try it:** Plot variable contributions to PC2 instead of PC1.

```r title="Your turn: contributions to PC2"
# Try it: bar chart of variable contributions to PC2
# fviz_contrib( ... )
#> Expected: a single bar towering over the others (UrbanPop)
```

<details>
<summary>Click to reveal solution</summary>

```r title="PC2 contributions solution"
fviz_contrib(pc, choice = "var", axes = 2, top = 4)
```

**Explanation:** `axes = 2` swaps PC1 for PC2 in the contribution calculation. `UrbanPop` should dominate PC2 because the violent-crime trio already used up PC1.

</details>

## How do I cluster data and visualise it with fviz_cluster()?

PCA reveals structure inherent to the variables. Clustering reveals structure inherent to the rows. factoextra wires them together: pick `k` with `fviz_nbclust()`, run `kmeans()`, then plot in PC1 by PC2 space using `fviz_cluster()`.

Start by picking a sensible number of clusters. The within-cluster sum of squares ("elbow") method gives a quick visual.

```r title="Elbow method for k-means k"
usa_z <- scale(USArrests)

fviz_nbclust(usa_z, kmeans, method = "wss")
#> Line chart: total within-cluster SS plotted against k = 1..10.
#> A clear elbow at k = 4, with diminishing returns afterward.
```

The line bends sharply at `k = 4` and flattens after. That is the elbow: each cluster you add up to four cuts variance meaningfully; beyond four, you are mostly chasing noise.

Now fit k-means with `k = 4` and hand the result plus the data to `fviz_cluster()`.

```r title="k-means + fviz_cluster on USArrests"
set.seed(123)
km <- kmeans(usa_z, centers = 4, nstart = 25)

fviz_cluster(
  km,
  data         = usa_z,
  ellipse.type = "convex",
  palette      = "jco",
  repel        = TRUE
) +
  ggplot2::theme_minimal()
#> Scatter of 50 states in PC1 by PC2 with four convex hulls.
#> Cluster 1: low-crime, high-urban (e.g. New Hampshire, Vermont).
#> Cluster 2: high-crime states (Florida, Nevada, California).
#> Cluster 3: moderate, rural (e.g. Idaho, Montana).
#> Cluster 4: in between.
```

`fviz_cluster()` runs its own PCA under the hood when the data has more than two columns, then projects every observation onto PC1 by PC2. The convex hulls show cluster boundaries; the colours come from the cluster labels in `km$cluster`.

[TIP]
**Use `nstart = 25` or higher for k-means.** A single random start can get stuck in a poor local optimum. `nstart = 25` runs the algorithm 25 times and keeps the best result, at negligible extra cost on small data.

**Try it:** Re-run `fviz_nbclust()` with `method = "silhouette"` and read off the suggested optimum.

```r title="Your turn: silhouette method"
# Try it: silhouette-based k selection
# fviz_nbclust( ... )
#> Expected: a peak around k = 2, with k = 4 a strong runner-up
```

<details>
<summary>Click to reveal solution</summary>

```r title="Silhouette method solution"
fviz_nbclust(usa_z, kmeans, method = "silhouette")
```

**Explanation:** Silhouette gives a single optimum (peak average silhouette width) rather than asking the analyst to spot a bend. On `USArrests` it favours `k = 2`, which separates urban-violent from rural-quiet, while elbow prefers a finer 4-cluster split.

</details>

## How do I draw a colored hierarchical clustering dendrogram?

Hierarchical clustering offers a nested view: cut the tree at any level and you get a different number of clusters. factoextra's `fviz_dend()` colours branches by cluster and adds rectangles to mark where the tree was cut.

![Choosing the right cluster visual](screenshots/factoextra-and-FactoMineR-cluster-decision.webp)
*Figure 2: Choosing the right cluster visual based on the algorithm and the question.*

Build the tree from the same scaled data and request four clusters.

```r title="hclust + fviz_dend (rectangular)"
d  <- dist(usa_z)
hc <- hclust(d, method = "ward.D2")

fviz_dend(
  hc,
  k         = 4,
  rect      = TRUE,
  k_colors  = "jco",
  cex       = 0.5
)
#> Rectangular dendrogram with 50 leaves (US states), four coloured
#> branches at k = 4, and rectangles drawn around each cluster.
```

Read it from the bottom up. States that join early are most similar; the height of each merge tells you how dissimilar the two sub-trees were before they fused. The four rectangles correspond to the four clusters at the level we cut.

For papers and posters with limited horizontal space, a circular layout often reads better.

```r title="Circular dendrogram"
fviz_dend(
  hc,
  k        = 4,
  type     = "circular",
  k_colors = "jco"
)
#> Same four-cluster split, drawn as a sunburst with state labels around
#> the rim. Easier to read with 50+ leaves.
```

[KEY INSIGHT]
**A biplot and a dendrogram are two views of the same data.** The biplot shows direction (which variables pull which observations); the dendrogram shows nesting (which observations merge first). On `USArrests`, both will tell you that Florida and Nevada belong together, but only the dendrogram shows you they fuse early enough to be near-identical.

**Try it:** Switch the linkage method from `"ward.D2"` to `"complete"` and rebuild the rectangular dendrogram.

```r title="Your turn: complete linkage"
# Try it: complete-linkage hierarchical clustering
# ex_hc <- hclust( ... )
# fviz_dend( ... )
#> Expected: a noticeably different tree shape, with chain-like branches
```

<details>
<summary>Click to reveal solution</summary>

```r title="Complete-linkage solution"
ex_hc <- hclust(d, method = "complete")

fviz_dend(ex_hc, k = 4, rect = TRUE, k_colors = "jco", cex = 0.5)
```

**Explanation:** `"complete"` linkage merges clusters by maximum pairwise distance, while `"ward.D2"` minimises within-cluster variance. Complete linkage tends to produce more evenly sized clusters; Ward tends to produce tighter, more spherical ones.

</details>

## Practice Exercises

These capstone exercises combine PCA and clustering. Use the `my_*` prefix so your variables do not overwrite anything from the tutorial.

### Exercise 1: PCA biplot of mtcars by cylinder

Run a scaled PCA on the numeric columns of `mtcars`, save the result to `my_pca`, and produce a `fviz_pca_biplot()` coloured by `factor(cyl)`.

```r title="Exercise 1 starter"
# Exercise 1: mtcars PCA biplot by cylinder
# Hint: select numeric columns, scale them via prcomp(scale. = TRUE),
#       then call fviz_pca_biplot() with habillage = factor(mtcars$cyl).

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_pca <- prcomp(mtcars[, sapply(mtcars, is.numeric)], scale. = TRUE)

fviz_pca_biplot(
  my_pca,
  habillage   = factor(mtcars$cyl),
  addEllipses = TRUE,
  palette     = "jco",
  repel       = TRUE
)
```

**Explanation:** `sapply(mtcars, is.numeric)` returns a logical vector that selects every numeric column. `factor(mtcars$cyl)` converts the cylinder count into a three-level grouping factor that `habillage` understands.

</details>

### Exercise 2: silhouette-driven k-means on iris

Pick the optimal `k` for scaled `iris[, 1:4]` using the silhouette method, fit k-means with that `k`, save it to `my_clusters`, and plot the result with `ellipse.type = "norm"`.

```r title="Exercise 2 starter"
# Exercise 2: silhouette-driven k-means
# Hint: iris_z <- scale(iris[, 1:4])
#       use fviz_nbclust to find k, then kmeans() + fviz_cluster()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
iris_z <- scale(iris[, 1:4])

# Silhouette suggests k = 2 here (versicolor + virginica overlap)
my_clusters <- kmeans(iris_z, centers = 2, nstart = 25)

fviz_cluster(
  my_clusters,
  data         = iris_z,
  ellipse.type = "norm",
  palette      = "jco",
  repel        = TRUE
)
```

**Explanation:** Silhouette favours `k = 2` on `iris` because versicolor and virginica overlap in feature space and only setosa is cleanly separated. The biological "true" `k` is 3, which is a useful reminder that statistical optima do not always match biological labels.

</details>

### Exercise 3: average-linkage dendrogram of USArrests

Build a hierarchical clustering of scaled `USArrests` using `method = "average"`, cut at `k = 3`, and produce a rectangular `fviz_dend()`.

```r title="Exercise 3 starter"
# Exercise 3: average-linkage dendrogram
# Hint: dist() then hclust(method = "average"), then fviz_dend(k = 3)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_d  <- dist(usa_z)
my_hc <- hclust(my_d, method = "average")

fviz_dend(my_hc, k = 3, rect = TRUE, k_colors = "jco", cex = 0.5)
```

**Explanation:** Average linkage merges clusters by mean pairwise distance, sitting between single (chain-prone) and complete (compact) linkage. With `k = 3` you get a clean three-way split: low-crime urban, low-crime rural, and high-crime.

</details>

## Complete Example

This block stitches every step into one workflow on `USArrests`: scale the data, run PCA, plot the scree, build the biplot, cluster with k-means, and draw a dendrogram. Run them in order; each block uses variables from the previous one.

```r title="Complete: scale + PCA + scree"
# 1. Scale and run PCA
pc_full <- prcomp(USArrests, scale. = TRUE)

# 2. Inspect variance explained
fviz_eig(pc_full, addlabels = TRUE, ylim = c(0, 70))
#> Two components capture ~87% of total variance.
```

```r title="Complete: biplot + k-means cluster"
# 3. Biplot coloured by cos2
fviz_pca_biplot(
  pc_full,
  col.ind       = "cos2",
  gradient.cols = c("#00AFBB", "#E7B800", "#FC4E07"),
  repel         = TRUE
)

# 4. k-means with k = 4 (from the elbow method earlier)
set.seed(456)
km_full <- kmeans(scale(USArrests), centers = 4, nstart = 25)

fviz_cluster(km_full, data = scale(USArrests), ellipse.type = "convex", palette = "jco")
#> Four clusters in PC1-PC2 space, matching the biplot regions.
```

```r title="Complete: hclust dendrogram"
# 5. Hierarchical clustering with the same scaled data
hc_full <- hclust(dist(scale(USArrests)), method = "ward.D2")

fviz_dend(hc_full, k = 4, rect = TRUE, k_colors = "jco", cex = 0.5)
#> Dendrogram cut at k = 4, branches coloured to match fviz_cluster output.
```

The biplot, the cluster plot, and the dendrogram all describe the same 50 states from three angles: variable directions, partitional grouping, and merge nesting. Whenever they agree, you have a robust story; whenever they disagree, the disagreement itself is informative.

## Summary

![The fviz_*() family at a glance](screenshots/factoextra-and-FactoMineR-fviz-family.webp)
*Figure 3: The full fviz_*() family at a glance, grouped by analysis type.*

| Function | Input object | What it shows |
|---|---|---|
| `fviz_eig()` | `prcomp` | Scree plot of variance explained |
| `fviz_pca_var()` | `prcomp` | Variable correlation circle |
| `fviz_pca_ind()` | `prcomp` | Individuals in PC space |
| `fviz_pca_biplot()` | `prcomp` | Individuals + variable arrows together |
| `fviz_contrib()` | `prcomp` | Variable / individual contributions to an axis |
| `fviz_nbclust()` | scaled data + clustering function | Optimal `k` heuristic |
| `fviz_cluster()` | `kmeans`/`pam` + data | Clusters in PC1 by PC2 space |
| `fviz_dend()` | `hclust` | Coloured dendrogram with cluster cuts |

Key takeaways:

- factoextra returns plain ggplot2 objects, so you can layer `+ theme_minimal()` and friends without ceremony.
- Always scale your data (`scale. = TRUE` in `prcomp()`, `scale()` before `kmeans()`) when variables use different units.
- Use `fviz_eig()` to decide if a 2D biplot is enough, and `fviz_contrib()` to back the visual story with numbers.
- Pick `k` with `fviz_nbclust()` before clustering; rerun k-means with `nstart >= 25` for stable results.
- A biplot and a dendrogram on the same scaled data describe the same structure from different angles, so cross-check them.

## References

1. Kassambara, A. & Mundt, F. - *factoextra: Extract and Visualize the Results of Multivariate Data Analyses*. CRAN. [Link](https://cran.r-project.org/package=factoextra)
2. Kassambara, A. - *Practical Guide to Cluster Analysis in R*. STHDA. [Link](https://www.sthda.com/english/wiki/practical-guide-to-cluster-analysis-in-r-essentials)
3. Lê, S., Josse, J. & Husson, F. - FactoMineR: An R Package for Multivariate Analysis. *Journal of Statistical Software*, 25(1). [Link](https://www.jstatsoft.org/article/view/v025i01)
4. Husson, F., Lê, S. & Pagès, J. - *Exploratory Multivariate Analysis by Example Using R*, 2nd ed. CRC Press (2017).
5. Wickham, H. - *ggplot2: Elegant Graphics for Data Analysis*. [Link](https://ggplot2-book.org/)
6. R Core Team - `?prcomp` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prcomp.html)
7. Datanovia - factoextra reference site. [Link](https://rpkgs.datanovia.com/factoextra/)

## Continue Learning

- [PCA in R](PCA-in-R.html) - base `prcomp()` walkthrough with manual interpretation.
- [Cluster Analysis in R](Cluster-Analysis-in-R.html) - k-means, hierarchical, and DBSCAN side by side.
- [Interpreting PCA Results in R](Interpreting-PCA-Results-in-R.html) - loadings, scores, and how to read a scree plot.
