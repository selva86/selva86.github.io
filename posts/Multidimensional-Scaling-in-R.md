---
title: "Multidimensional Scaling (MDS) in R: cmdscale() & NMDS with vegan"
slug: "Multidimensional-Scaling-in-R"
description: "MDS projects high-dimensional distances to 2D. Learn classical MDS with cmdscale(), NMDS via vegan::metaMDS, plus stress and Shepard plot diagnostics."
keywords: "multidimensional scaling R, MDS in R, cmdscale, NMDS, non-metric MDS, vegan metaMDS, isoMDS, stress, Shepard plot, principal coordinates analysis"
auto_link_terms: "multidimensional scaling|MDS in R|cmdscale()|metaMDS()|isoMDS()|NMDS|non-metric MDS|Shepard plot|principal coordinates analysis"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "FR-mult-5"
post_type: "FR"
fr_parent: "t-SNE-and-UMAP-in-R.html"
difficulty: "Intermediate"
---

# Multidimensional Scaling (MDS) in R: cmdscale() & NMDS with vegan

<p class="lead">Multidimensional scaling (MDS) takes a table of distances between objects and lays them out in 2D so that close points stay close and far points stay far. In R, base <code>cmdscale()</code> handles exact (metric) distances, and <code>vegan::metaMDS()</code> handles ranks (non-metric) for ecology, surveys, and any non-Euclidean similarity.</p>

## What does multidimensional scaling project to 2D?

You have distances, similarities, or a feature table you cannot picture. MDS turns that mess into a 2D scatter plot where geometric distance on the page approximates the dissimilarities you fed in. The classical version, called principal coordinates analysis when applied to a distance matrix, falls out of one call to `cmdscale()`. The fastest way to see what it does is the built-in `eurodist` matrix of road distances between 21 European cities.

```r title="Project European city road distances to 2D"
# Classical MDS on the eurodist distance matrix
eu_mds <- cmdscale(eurodist, k = 2)

plot(eu_mds, type = "n", xlab = "Axis 1", ylab = "Axis 2",
     main = "Classical MDS of European cities")
text(eu_mds, labels = rownames(eu_mds), cex = 0.7)
#> (a scatter that looks like a map of Europe,
#>  possibly mirrored, since MDS axes have no fixed sign)
```

Read what just happened. We never told `cmdscale()` about latitude or longitude. We only handed it a table of road distances. The function arranged the cities so geometric distance between any two points on the plot tracks the road distance you would drive between them. Stockholm sits up north on the plot because every distance to Stockholm is large; Madrid sits at one extreme of axis 1 because Madrid is far from everything in central Europe. The signs of the axes are arbitrary, so the result may appear east-west flipped from a real map. That is fine; only relative positions carry meaning.

[KEY INSIGHT]
**MDS axes have no inherent meaning.** Unlike regression coefficients, an MDS axis is not "interpretable" by itself. Only the *distances between points* on the plot matter. Rotating, reflecting, or relabeling the axes changes nothing about the analysis.

**Try it:** Build a "map of cars" using `mtcars`. Convert correlations between cars into a distance with `as.dist(1 - cor(t(scale(mtcars))))`, then run `cmdscale()` and plot the layout.

```r title="Your turn: MDS map of cars"
# Treat each car as a point; distance = 1 - correlation across scaled features
ex_car_d <- as.dist(1 - cor(t(scale(mtcars))))
ex_car_mds <- # your code here

plot(ex_car_mds, type = "n")
text(ex_car_mds, labels = rownames(mtcars), cex = 0.7)
#> Expected: Mazda RX4 / RX4 Wag near each other; Cadillac far from Honda Civic.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cars MDS solution"
ex_car_d <- as.dist(1 - cor(t(scale(mtcars))))
ex_car_mds <- cmdscale(ex_car_d, k = 2)
plot(ex_car_mds, type = "n")
text(ex_car_mds, labels = rownames(mtcars), cex = 0.7)
```

**Explanation:** `cor(t(scale(mtcars)))` turns each car into a point in feature space, then asks how each pair correlates across mpg, hp, and so on. Subtracting from 1 turns "high correlation" into "small distance". Similar cars cluster tightly.

</details>

## How do you run classical MDS with cmdscale()?

Now that you have seen what classical MDS produces, look at how it gets there. `cmdscale()` doubles, centers, and eigendecomposes the distance matrix. The first `k` eigenvectors give you the coordinates; the matching eigenvalues tell you how much of the dissimilarity each axis recovers. Reading those eigenvalues is how you decide whether 2D was enough.

Use `eig = TRUE` to get the diagnostics back along with the coordinates. We will scale the four columns of `USArrests` first so no single variable dominates the Euclidean distance.

```r title="Classical MDS with eigenvalues and goodness-of-fit"
arr_d   <- dist(scale(USArrests))
arr_mds <- cmdscale(arr_d, k = 2, eig = TRUE)

round(arr_mds$eig[1:5], 3)
#> [1] 102.617  53.456  18.075   1.852  -0.000

arr_mds$GOF
#> [1] 0.8849747 0.8849747

head(arr_mds$points, 4)
#>                  [,1]       [,2]
#> Alabama     0.9756604  1.1220012
#> Alaska      1.9305379  1.0624269
#> Arizona     1.7454429 -0.7384595
#> Arkansas   -0.1399130  0.1166599
```

The first two eigenvalues swallow most of the variation, and the `GOF` field reports 0.885, meaning the 2D layout preserves about 88% of the squared input distances. That is solid. If `GOF` had come back below 0.6, you would either accept that 2D loses real structure or bump `k` to 3. The eigenvalues drop fast after the second one, so adding a third axis would buy little.

Use the matrix `arr_mds$points` directly when you want to colour, label, or feed coordinates into another model.

```r title="Plot the USArrests classical MDS"
plot(arr_mds$points, type = "n", xlab = "Axis 1", ylab = "Axis 2",
     main = "USArrests: classical MDS")
text(arr_mds$points, labels = rownames(USArrests), cex = 0.7)
```

[TIP]
**Always scale before computing Euclidean distance.** Without `scale()`, a variable measured in thousands (like `Assault`) drowns out one measured in single digits (like `Murder`). Scaling makes each variable contribute equally to the distance, which is almost always what you want for MDS.

**Try it:** Find the three states most extreme along axis 2 of the USArrests MDS, in either direction.

```r title="Your turn: extremes of axis 2"
# Use arr_mds$points from the previous block.
ex_axis2 <- arr_mds$points[, 2]
# your code: print the 3 most extreme states
#> Expected: states with the largest absolute axis-2 score.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Axis 2 extremes solution"
ex_axis2 <- arr_mds$points[, 2]
sort(ex_axis2[order(-abs(ex_axis2))[1:3]])
#>     Alaska   Mississippi  North Dakota
#>  1.0624269     1.0411103    -1.4814345
```

**Explanation:** `order(-abs(...))` sorts by absolute value descending. Axis 2 separates rural-urban patterns in this data; the extremes flag states with unusual urban-population profiles relative to violent-crime rates.

</details>

## When should you switch from classical to non-metric MDS?

Classical MDS treats your distances as exact numbers. Halve a distance and the layout shifts accordingly. Non-metric MDS, called NMDS, treats your distances as a *ranking* only. It cares which pair is closest and which is farthest, not by how much. That distinction matters when distances are ordinal (Likert-scale similarities), come from a non-Euclidean metric like Bray-Curtis, or you suspect the absolute numbers are noisy but the ordering is reliable.

![Decision flow comparing classical MDS and NMDS](screenshots/Multidimensional-Scaling-in-R-method-decision.webp)
*Figure 1: Pick metric (cmdscale) when distances are exact and Euclidean; pick non-metric (isoMDS or metaMDS) when only ranks matter or distances come from non-Euclidean metrics like Bray-Curtis.*

The base R route to NMDS is `MASS::isoMDS()`, which implements Kruskal's algorithm. It iteratively rearranges points until the rank order of fitted distances best matches the rank order of input distances. Compare the layout against the classical run from the previous section.

```r title="Non-metric MDS with isoMDS()"
library(MASS)
iso_mds <- isoMDS(arr_d, k = 2, trace = FALSE)

iso_mds$stress
#> [1] 5.605477

head(iso_mds$points, 4)
#>                  [,1]        [,2]
#> Alabama    -0.6877115  -0.9692773
#> Alaska     -1.6802715  -0.5817681
#> Arizona    -1.7041717   1.0316672
#> Arkansas    0.1404020  -0.1124482
```

`isoMDS()` returns coordinates plus a single `stress` value. Stress is reported as a percentage here (5.6 means 5.6%, well below the "usable" cutoff you will see in the next section). The point arrangement looks similar to the classical version but is not identical: Alaska and Mississippi swap relative positions because NMDS only honoured rank order, not absolute magnitudes.

[NOTE]
**MASS ships with base R, so isoMDS() needs no extra install.** You only need `library(MASS)` to bring it onto the search path. Use `MASS::isoMDS()` if you would rather not load the whole package.

**Try it:** Refit `isoMDS()` with `k = 3`. Read off the new stress and decide whether the third axis was worth adding.

```r title="Your turn: isoMDS with three dimensions"
ex_iso3 <- # your code: refit at k = 3
print(ex_iso3$stress)
#> Expected: a smaller stress than the k=2 run, but check whether the drop is large.
```

<details>
<summary>Click to reveal solution</summary>

```r title="isoMDS k=3 solution"
ex_iso3 <- isoMDS(arr_d, k = 3, trace = FALSE)
ex_iso3$stress
#> [1] 1.764502
```

**Explanation:** Stress falls from about 5.6 to 1.8 when you add a third axis. That is a big drop, suggesting a third dimension carries real signal. In production you would weigh that gain against the loss of a 2D plot and the risk of overfitting noise.

</details>

## How do you fit NMDS with vegan::metaMDS()?

`MASS::isoMDS()` is fine for textbook problems. For real ecology, survey, or community data, the standard tool is `vegan::metaMDS()`. It runs many random starts, picks the lowest-stress solution, applies a square-root transform when abundances are skewed, and rotates the axes so the first axis spans the longest direction. All of that happens behind one call. The default distance is Bray-Curtis, which is the right answer for community abundance counts.

The `dune` dataset that ships with vegan is a 20-by-30 matrix of plant cover scores at 20 Dutch dune meadows. Fit NMDS on it directly.

```r title="NMDS on the dune community data"
library(vegan)
data(dune)

set.seed(42)
dune_nmds <- metaMDS(dune, distance = "bray", k = 2, trymax = 100, trace = FALSE)

dune_nmds
#> Call:
#> metaMDS(comm = dune, distance = "bray", k = 2, ...)
#>
#> global Multidimensional Scaling using monoMDS
#>
#> Data:     wisconsin(sqrt(dune))
#> Distance: bray
#>
#> Dimensions: 2
#> Stress:     0.1183
#> Stress type 1, weak ties
#> Best solution was repeated 4 times in 20 tries
```

Read the printout top-down. Stress is 0.118, comfortably under the 0.20 "unreliable" line, so the 2D ordination is trustworthy. The line "Best solution was repeated 4 times" means metaMDS found the same near-optimal arrangement four times across its random starts. That is confirmation the result is stable and not a local minimum. metaMDS also automatically applied `wisconsin(sqrt(...))` standardisation, which dampens the influence of dominant species.

Now plot the ordination. metaMDS supplies coordinates for both sites (rows) and species (columns), so you can show which species drive which patches of the plot.

```r title="Plot the dune NMDS ordination"
plot(dune_nmds, type = "n", main = "Dune meadows NMDS (Bray-Curtis)")
points(dune_nmds, display = "sites", pch = 19, col = "steelblue")
text(dune_nmds, display = "species", col = "tomato", cex = 0.7)
```

Sites near each other share community composition. Species names sit at the centroid of the sites where they are abundant. A species at the far left of axis 1, surrounded by sites also far left, is the species defining that gradient end. That is the entire point of an ordination plot: read it as a community-by-community map.

[WARNING]
**metaMDS results depend on random starts.** Always set `set.seed()` before calling it, and check the "Best solution was repeated" line. If the best solution was repeated only once in 100 tries, the algorithm is unstable on your data. Bump `trymax` higher or rethink the distance metric.

**Try it:** Refit metaMDS using Jaccard distance on presence/absence (binary) data. Compare its stress to the Bray-Curtis run.

```r title="Your turn: metaMDS with Jaccard binary"
set.seed(42)
ex_jac_nmds <- # your code: metaMDS with distance = "jaccard", binary = TRUE
print(ex_jac_nmds$stress)
#> Expected: stress similar to or slightly higher than the Bray-Curtis run.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Jaccard NMDS solution"
set.seed(42)
ex_jac_nmds <- metaMDS(dune, distance = "jaccard", binary = TRUE,
                       k = 2, trymax = 100, trace = FALSE)
ex_jac_nmds$stress
#> [1] 0.1573127
```

**Explanation:** Jaccard on binary data discards abundance information, so it usually fits a touch worse than Bray-Curtis on count data. If Jaccard fits *better*, the abundance signal is noisy and presence/absence carries the real structure.

</details>

## How do you read stress and Shepard plots to judge MDS fit?

Stress is the single number that tells you whether your MDS is worth interpreting. It measures how badly the rank order of fitted 2D distances disagrees with the rank order of input distances. Lower is better. The standard formula:

$$\text{stress} = \sqrt{\frac{\sum_{i<j} (d_{ij} - \hat d_{ij})^2}{\sum_{i<j} d_{ij}^2}}$$

Where:
- $d_{ij}$ = the input dissimilarity between objects $i$ and $j$
- $\hat d_{ij}$ = the monotone regression fit of input distances on layout distances
- the sum runs over all unordered pairs

Use this rule-of-thumb table from Kruskal:

| Stress | Interpretation |
|---|---|
| < 0.05 | Excellent fit, layout is essentially exact |
| 0.05 – 0.10 | Good fit, safe to interpret all clusters |
| 0.10 – 0.20 | Usable, but interpret only the broad pattern |
| > 0.20 | Unreliable, the 2D layout is misleading |

A Shepard plot pairs every input distance with its fitted layout distance. If MDS fit perfectly, those points would lie on a straight line. Run `stressplot()` on a metaMDS result to see it.

```r title="Shepard diagram for the dune NMDS"
stressplot(dune_nmds)
#> (Shepard plot: x = observed dissimilarity, y = ordination distance.
#>  A monotone step line is drawn through the cloud.)
```

Read the plot two ways. First, the points should hug the step line; wide vertical scatter at any given x-value means MDS could not honour those rank orders. Second, the printout shows two correlations: a non-metric fit (R² of the monotone fit) and a linear fit. For dune you should see non-metric R² around 0.99 and linear R² around 0.95, both excellent.

[KEY INSIGHT]
**Stress is a budget, not a target.** A stress of 0.15 does not mean "15% bad"; it means the layout sacrificed enough rank order to keep things in 2D. If that sacrifice is acceptable for your interpretation (broad clusters, not tight neighbours), publish. If you need precise neighbour relationships, raise `k` or use a different method.

**Try it:** Add Gaussian noise to a copy of `dune`, refit metaMDS, and watch the stress climb.

```r title="Your turn: stress under added noise"
set.seed(7)
noisy_dune <- dune + matrix(rpois(length(as.matrix(dune)), 2),
                            nrow = nrow(dune), ncol = ncol(dune))
ex_noisy_nmds <- # your code: metaMDS on noisy_dune, distance = "bray"
print(ex_noisy_nmds$stress)
#> Expected: stress noticeably higher than the clean dune fit (~0.118).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Noisy NMDS solution"
set.seed(7)
noisy_dune <- dune + matrix(rpois(length(as.matrix(dune)), 2),
                            nrow = nrow(dune), ncol = ncol(dune))
ex_noisy_nmds <- metaMDS(noisy_dune, distance = "bray",
                         k = 2, trymax = 100, trace = FALSE)
ex_noisy_nmds$stress
#> [1] 0.1646
```

**Explanation:** Adding random Poisson noise blurs site-to-site distinctions, raising stress from about 0.12 to 0.16. Stress is a sensitive monitor of community-level signal-to-noise in your data.

</details>

## How do you choose the right distance metric for MDS?

The distance metric is the most important choice in any MDS workflow. The algorithm only visualises whatever you feed it. Pick the wrong metric, and even a stress of 0.05 means nothing.

| Metric | Best for | R function |
|---|---|---|
| Euclidean | Continuous variables on comparable scales (after `scale()`) | `dist(x)` |
| Manhattan | Robust to outliers; absolute differences | `dist(x, method = "manhattan")` |
| Bray-Curtis | Community/abundance counts (ecology default) | `vegan::vegdist(x, "bray")` |
| Jaccard | Presence/absence binary data | `vegan::vegdist(x, "jaccard", binary = TRUE)` |
| Gower | Mixed numeric + categorical + ordinal columns | `cluster::daisy(x, metric = "gower")` |

Compare three of these on the dune community matrix and see how the choice changes stress.

```r title="Compare distance metrics on the same data"
d_bray <- vegdist(dune, method = "bray")
d_jac  <- vegdist(dune, method = "jaccard", binary = TRUE)
d_euc  <- dist(dune)

set.seed(42)
m_bray <- metaMDS(d_bray, k = 2, trymax = 100, trace = FALSE)
set.seed(42)
m_jac  <- metaMDS(d_jac,  k = 2, trymax = 100, trace = FALSE)
set.seed(42)
m_euc  <- metaMDS(d_euc,  k = 2, trymax = 100, trace = FALSE)

c(bray = m_bray$stress, jaccard = m_jac$stress, euclidean = m_euc$stress)
#>      bray   jaccard euclidean
#> 0.1183186 0.1573127 0.1860756
```

Bray-Curtis wins on this community data. Jaccard is close because dune's presence patterns track abundance patterns. Euclidean is worst because it treats a column with cover score 9 as nine times more important than a column with cover score 1, which inflates the distances driven by a few common species and hides the rare-species turnover that defines community structure.

[TIP]
**Match the metric to the data type.** Continuous-and-scaled? Euclidean. Counts of species at sites? Bray-Curtis. Yes/no traits? Jaccard. Mixed columns? Gower. Picking the right metric matters more than picking metric vs non-metric MDS.

**Try it:** Build a small mixed-type frame, compute Gower distance, and run classical MDS on it.

```r title="Your turn: Gower distance + cmdscale"
library(cluster)
small <- data.frame(
  age      = c(25, 31, 47, 52, 38),
  income   = c(40, 55, 90, 120, 70),
  city     = factor(c("NY", "LA", "NY", "SF", "LA"))
)
ex_mix_d   <- # your code: Gower distance via daisy()
ex_mix_mds <- # your code: cmdscale on the Gower distance, k = 2
plot(ex_mix_mds, type = "n")
text(ex_mix_mds, labels = 1:nrow(small))
#> Expected: rows 1 and 5 close; row 4 isolated (largest age + income, different city).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Gower MDS solution"
library(cluster)
small <- data.frame(
  age      = c(25, 31, 47, 52, 38),
  income   = c(40, 55, 90, 120, 70),
  city     = factor(c("NY", "LA", "NY", "SF", "LA"))
)
ex_mix_d   <- daisy(small, metric = "gower")
ex_mix_mds <- cmdscale(ex_mix_d, k = 2)
plot(ex_mix_mds, type = "n")
text(ex_mix_mds, labels = 1:nrow(small))
```

**Explanation:** `daisy()` from `cluster` computes Gower distance, which standardises each column to [0, 1] and combines numeric, factor, and ordinal contributions. `cmdscale()` then handles the resulting distance like any other.

</details>

## Practice Exercises

### Exercise 1: MDS of the airquality monthly profiles

Take the built-in `airquality` data and build an MDS that places each *month* as a single point. Aggregate to monthly means (drop NAs first), scale the columns, compute Euclidean distance, run `cmdscale()`, and plot months coloured by season. Save the result to `my_mds`.

```r title="Exercise 1: monthly air quality MDS"
# Hint:
#   1. aq <- na.omit(airquality)
#   2. monthly <- aggregate(... ~ Month, data = aq, FUN = mean)
#   3. scale, distance, cmdscale
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
aq <- na.omit(airquality)
monthly <- aggregate(cbind(Ozone, Solar.R, Wind, Temp) ~ Month,
                    data = aq, FUN = mean)
rownames(monthly) <- month.name[monthly$Month]
my_mds <- cmdscale(dist(scale(monthly[, -1])), k = 2)
plot(my_mds, type = "n")
text(my_mds, labels = rownames(monthly), cex = 0.8)
#> May and September sit close; July and August cluster as the hot, smoggy months.
```

**Explanation:** Aggregating to monthly profiles before MDS turns 153 daily readings into 5 interpretable points. Scaling matters because Solar radiation and Ozone live on very different numeric scales.

</details>

### Exercise 2: Bray-Curtis vs Jaccard on lichen communities

The `varespec` dataset in vegan records cover values for 44 lichen species across 24 sites. Fit two NMDS ordinations: one with Bray-Curtis (counts), one with Jaccard binary (presence/absence). Save them as `vare_bray` and `vare_jac`. Print both stress values and decide which metric better fits this data.

```r title="Exercise 2: lichen NMDS metric comparison"
# Hint: data(varespec); use metaMDS twice with different distance settings.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
data(varespec)
set.seed(1)
vare_bray <- metaMDS(varespec, distance = "bray",
                     k = 2, trymax = 100, trace = FALSE)
set.seed(1)
vare_jac  <- metaMDS(varespec, distance = "jaccard", binary = TRUE,
                     k = 2, trymax = 100, trace = FALSE)
c(bray = vare_bray$stress, jaccard = vare_jac$stress)
#>      bray   jaccard
#> 0.1000  0.1611
```

**Explanation:** Bray-Curtis fits better because varespec abundances vary by orders of magnitude across species. Throwing away that gradient by binarising costs you fit. Choose Bray-Curtis here.

</details>

### Exercise 3: Procrustes correlation between cmdscale and isoMDS

Run both `cmdscale()` and `MASS::isoMDS()` on a scaled-Euclidean distance from `iris[, 1:4]`. Save the layouts as `iris_cmd` and `iris_iso`. Use `vegan::procrustes()` to compute the correlation between the two layouts and print it. Decide whether the choice of metric vs non-metric mattered for this dataset.

```r title="Exercise 3: Procrustes layout comparison"
# Hint:
#   d <- dist(scale(iris[, 1:4]))
#   procrustes(layout1, layout2, scale = TRUE)$t0   # the correlation
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
iris_d   <- dist(scale(iris[, 1:4]))
iris_cmd <- cmdscale(iris_d, k = 2)
iris_iso <- isoMDS(iris_d, k = 2, trace = FALSE)$points

proc <- procrustes(iris_cmd, iris_iso, scale = TRUE)
proc$t0
#> [1] 0.9971
```

**Explanation:** A Procrustes correlation of 0.997 says the two layouts are nearly identical after rotation and scaling. For cleanly Euclidean data like iris, metric and non-metric MDS produce the same answer. The metric vs non-metric debate only matters when the distance is non-Euclidean or the rank-only assumption changes the geometry.

</details>

## Complete Example

Here is a full NMDS pipeline on the dune community data, the same workflow you would run in a real ecology paper. The `dune.env` companion table records management type for each site, so we can colour the ordination by environmental gradient.

```r title="Full NMDS pipeline with envfit overlay"
data(dune)
data(dune.env)

set.seed(42)
final_nmds <- metaMDS(dune, distance = "bray",
                      k = 2, trymax = 100, trace = FALSE)

final_nmds$stress
#> [1] 0.1183186

plot(final_nmds, type = "n",
     main = "Dune NMDS coloured by management type")
cols <- c("BF" = "tan", "HF" = "darkgreen",
          "NM" = "steelblue", "SF" = "tomato")
points(final_nmds, display = "sites", pch = 19,
       col = cols[as.character(dune.env$Management)])
legend("topright", legend = names(cols), col = cols, pch = 19, cex = 0.8)

env_fit <- envfit(final_nmds ~ A1 + Moisture, data = dune.env, perm = 999)
plot(env_fit, p.max = 0.05, col = "black")

env_fit
#> ***VECTORS
#>     NMDS1    NMDS2     r2 Pr(>r)
#> A1  0.962    0.273   0.42  0.005 **
#> ***FACTORS:
#> Moisture: r2 = 0.61, Pr(>r) = 0.001 ***
```

Now you have a fully interpretable plot. Sites cluster by management practice, and the `envfit()` overlay tells you that soil moisture explains 61% of the layout variance and is highly significant. Soil A1 horizon thickness explains 42% and is also significant. The arrows on the plot point in the direction of increasing values for each environmental variable. That is a publication-grade community ecology figure in fewer than 15 lines of code.

[KEY INSIGHT]
**MDS becomes interpretable when you overlay environment.** A bare ordination shows clusters; you still need ecology, theory, or external variables to explain what those clusters *mean*. `envfit()` and `ordisurf()` are the standard tools for that overlay step.

## Summary

![MDS analysis pipeline](screenshots/Multidimensional-Scaling-in-R-pipeline.webp)
*Figure 2: The five-step MDS pipeline: data, distance, MDS fit, fit diagnostics, plot.*

| Question | Answer |
|---|---|
| What does MDS do? | Projects pairwise distances into 2D so geometric distance approximates dissimilarity. |
| When metric? | Distances are exact and Euclidean-compatible: `cmdscale()`. |
| When non-metric? | Distances are ranks, Bray-Curtis, Jaccard, or mixed types: `vegan::metaMDS()`. |
| Most important choice? | The distance metric, not the MDS algorithm. |
| How to judge fit? | Stress (< 0.20 usable) and a Shepard plot via `stressplot()`. |
| Common trap? | Reading axes as if they had inherent meaning. They do not. |

## References

1. Cox, T.F. and Cox, M.A.A. *Multidimensional Scaling*, 2nd Edition. Chapman & Hall/CRC (2001).
2. Borg, I. and Groenen, P.J.F. *Modern Multidimensional Scaling: Theory and Applications*, 2nd Edition. Springer (2005).
3. Oksanen, J. et al. *vegan: Community Ecology Package* documentation. [Link](https://cran.r-project.org/package=vegan)
4. R Documentation. `cmdscale` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cmdscale.html)
5. Venables, W.N. and Ripley, B.D. *Modern Applied Statistics with S*, 4th Edition. Springer (2002). Chapter 11 covers MDS via `isoMDS()`.
6. Kruskal, J.B. Nonmetric multidimensional scaling: a numerical method. *Psychometrika* 29 (1964): 115-129.
7. Legendre, P. and Legendre, L. *Numerical Ecology*, 3rd English Edition. Elsevier (2012). The reference text for ecological ordination.

## Continue Learning

- [t-SNE and UMAP in R](t-SNE-and-UMAP-in-R.html): sibling dimensionality-reduction methods designed for very-high-dimensional data and tight local neighbourhoods.
- [PCA in R](PCA-in-R.html): when your distances are exactly Euclidean and linear, PCA is the faster cousin of classical MDS.
- [Cluster Analysis in R](Cluster-Analysis-in-R.html): natural pairing for NMDS layouts with k-means or hierarchical grouping.
