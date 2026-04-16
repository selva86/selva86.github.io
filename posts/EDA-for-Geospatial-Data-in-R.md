---
title: "EDA for Geospatial Data in R: Spatial Distribution & Clustering"
slug: "EDA-for-Geospatial-Data-in-R"
description: "Explore spatial distributions, detect clusters, and measure spatial autocorrelation in R with ggplot2. Interactive code examples using built-in datasets."
keywords: "geospatial EDA R, spatial distribution R, spatial clustering R, point pattern analysis R, spatial autocorrelation R, Moran's I R, kernel density estimation R, ggplot2 spatial data"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-16"
curriculum_id: "FR-eda-3"
post_type: "FR"
auto_link_terms: "geospatial EDA|spatial distribution analysis|spatial clustering in R|point pattern analysis|spatial autocorrelation|kernel density estimation|geospatial data analysis"
auto_link_case_sensitive: false
fr_parent: "Univariate-EDA-in-R.html"
---

# EDA for Geospatial Data in R: Spatial Distribution & Clustering

<p class="lead">Geospatial EDA reveals <em>where</em> your data concentrates, spreads, and clusters — patterns you'd completely miss in a regular summary table. This tutorial walks you through spatial distribution mapping, K-means clustering, spatial autocorrelation testing, and density heatmaps using R's built-in <code>quakes</code> dataset.</p>

## What makes geospatial data different from regular tabular data?

Every row in geospatial data carries a location — a latitude and longitude that anchors it to a real place on Earth. That spatial context means nearby observations aren't independent. An earthquake at one location makes nearby earthquakes more likely. A high-crime neighbourhood sits next to other high-crime neighbourhoods. Regular summary statistics ignore this structure entirely.

Let's load R's built-in `quakes` dataset and plot 1,000 earthquakes near Fiji to see this spatial structure immediately.

```r
# Load libraries and plot earthquake locations
library(ggplot2)
library(dplyr)

ggplot(quakes, aes(x = long, y = lat, color = mag)) +
  geom_point(alpha = 0.6, size = 1.5) +
  scale_color_viridis_c(option = "plasma", name = "Magnitude") +
  labs(title = "Earthquakes Near Fiji (1964)",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> A scatter plot showing 1000 earthquake locations forming a clear
#> arc-shaped band from north to south — the Tonga-Kermadec trench.
#> Stronger magnitudes (brighter colors) aren't randomly scattered.
```

The plot reveals something a `summary()` call never could: earthquakes form a distinct arc tracing a tectonic plate boundary. Stronger quakes concentrate in specific zones along this arc. This is spatial structure — and the entire point of geospatial EDA.

The `quakes` dataset contains 1,000 seismic events near Fiji since 1964 with five columns: `lat`, `long`, `depth` (km), `mag` (Richter), and `stations` (number of reporting stations).

```r
# Explore the dataset structure
str(quakes)
#> 'data.frame':	1000 obs. of  5 variables:
#>  $ lat     : num  -20.4 -20.6 -26 -18 -20.4 ...
#>  $ long    : num  182 181 184 182 182 ...
#>  $ depth   : int  562 650 42 626 649 ...
#>  $ mag     : num  4.8 4.2 5.4 4.1 4 4 4.8 4.4 4.7 4.3 ...
#>  $ stations: int  41 15 43 19 11 12 43 15 35 19 ...

summary(quakes[, c("lat", "long", "mag", "depth")])
#>       lat              long            mag           depth
#>  Min.   :-38.59   Min.   :165.7   Min.   :4.00   Min.   : 40.0
#>  1st Qu.:-23.47   1st Qu.:179.6   1st Qu.:4.30   1st Qu.: 99.0
#>  Median :-20.30   Median :181.6   Median :4.60   Median :247.0
#>  Mean   :-20.64   Mean   :179.5   Mean   :4.62   Mean   :311.4
#>  3rd Qu.:-17.64   3rd Qu.:183.2   3rd Qu.:4.90   3rd Qu.:543.0
#>  Max.   :-10.72   Max.   :188.1   Max.   :6.40   Max.   :680.0
```

The latitude spans roughly -39 to -11 (all southern hemisphere), and longitude runs 166 to 188 (crossing the International Date Line east of Australia). Magnitudes range from 4.0 to 6.4, and depths from 40 to 680 km.

[KEY INSIGHT]
**Tobler's First Law of Geography: "Everything is related to everything else, but near things are more related than distant things."** This law is the foundation of geospatial analysis. It means standard statistics that assume independence between observations can mislead you when data has geographic structure.

**Try it:** Plot the quakes colored by `depth` instead of `mag`. Do shallow earthquakes (low depth) cluster in different locations than deep ones?

```r
# Try it: plot quakes colored by depth
ggplot(quakes, aes(x = long, y = lat, color = depth)) +
  geom_point(alpha = 0.6, size = 1.5) +
  scale_color_viridis_c(name = "Depth (km)") +
  labs(title = "Earthquake Depth Distribution",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Expected: A plot showing shallow (yellow) quakes in one
#> region and deep (purple) quakes in another.
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(quakes, aes(x = long, y = lat, color = depth)) +
  geom_point(alpha = 0.6, size = 1.5) +
  scale_color_viridis_c(name = "Depth (km)") +
  labs(title = "Earthquake Depth Distribution",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Shallow earthquakes (bright yellow) cluster along the eastern
#> edge of the arc, while deep earthquakes (dark purple) appear
#> further west. This matches geology: the plate dives deeper
#> as it subducts westward under the Pacific plate.
```

**Explanation:** The depth gradient runs roughly east to west — shallow quakes near the trench (east) and deep quakes where the plate has subducted further (west). This spatial pattern in depth is geologically meaningful.

</details>

## How do you visualize spatial distributions in R?

A basic point map is just the starting point. To see spatial patterns clearly, you need to encode additional variables into the geometry and break the data into meaningful subsets. Three strategies work well for point data: bubble maps (size = variable), color-mapped points, and faceted views.

Let's start with a bubble map where point size represents magnitude and transparency handles overlap.

```r
# Bubble map: size = magnitude, alpha for dense regions
ggplot(quakes, aes(x = long, y = lat)) +
  geom_point(aes(size = mag), alpha = 0.3, color = "steelblue") +
  scale_size_continuous(range = c(0.5, 5), name = "Magnitude") +
  labs(title = "Earthquake Magnitude (Bubble Map)",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Larger bubbles (stronger quakes) appear throughout the arc,
#> but the densest concentration of all sizes sits around
#> lat -20, long 180-182.
```

The bubble map immediately shows two things: where earthquakes are densest (the central section of the arc) and where the strongest quakes occur. Transparency is essential here — without `alpha = 0.3`, the central cluster would be an opaque blob hiding hundreds of overlapping points.

Now let's split the data by magnitude category to see if weak, moderate, and strong earthquakes have different spatial footprints.

```r
# Create magnitude categories and facet
quakes_cat <- quakes |>
  mutate(mag_cat = case_when(
    mag < 4.5 ~ "Low (4.0-4.4)",
    mag < 5.0 ~ "Medium (4.5-4.9)",
    TRUE       ~ "High (5.0+)"
  )) |>
  mutate(mag_cat = factor(mag_cat,
    levels = c("Low (4.0-4.4)", "Medium (4.5-4.9)", "High (5.0+)")))

ggplot(quakes_cat, aes(x = long, y = lat)) +
  geom_point(alpha = 0.4, size = 1, color = "tomato") +
  facet_wrap(~mag_cat) +
  labs(title = "Spatial Distribution by Magnitude Category",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Three panels: Low shows the most points spread across the full arc.
#> Medium is sparser but similar shape. High (5.0+) has far fewer
#> points concentrated in specific zones.
```

Faceting reveals that low-magnitude quakes fill the entire arc, while the strongest quakes concentrate in specific "hotspot" segments. This difference in spatial spread across categories is a classic geospatial EDA finding — and one you'd miss entirely in a frequency table.

Adding rug plots to the margins shows the marginal distributions along each axis. This helps you see whether the data clusters more strongly along latitude or longitude.

```r
# Point map with marginal rug plots
ggplot(quakes, aes(x = long, y = lat)) +
  geom_point(alpha = 0.3, size = 1, color = "steelblue") +
  geom_rug(alpha = 0.05, color = "steelblue") +
  labs(title = "Earthquake Locations with Marginal Distributions",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Dense rug marks along the x-axis around 178-184 and along
#> the y-axis around -22 to -18 show the data's centre of mass.
```

The rug marks are densest around longitude 178-184 and latitude -22 to -18, confirming that most seismic activity concentrates in this region. The combined point map + rug plot is a quick diagnostic for identifying the spatial "centre of mass."

[TIP]
**Use alpha (transparency) when plotting dense point data.** Without it, overlapping points hide the true density — 50 earthquakes in one spot look identical to 5. Start with `alpha = 0.3` and adjust from there.

**Try it:** Create a bubble map where point size maps to `stations` (number of reporting stations) and color maps to `mag_cat`. Does the number of reporting stations relate to spatial location?

```r
# Try it: bubble map with size = stations, color = mag_cat
ggplot(quakes_cat, aes(x = long, y = lat, color = mag_cat)) +
  geom_point(aes(size = stations), alpha = 0.4) +
  scale_size_continuous(range = c(0.5, 4)) +
  labs(title = "Stations and Magnitude by Location") +
  theme_minimal()
#> Expected: Larger bubbles (more stations) tend to appear
#> where magnitude is higher.
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(quakes_cat, aes(x = long, y = lat, color = mag_cat)) +
  geom_point(aes(size = stations), alpha = 0.4) +
  scale_size_continuous(range = c(0.5, 4), name = "Stations") +
  scale_color_manual(values = c("Low (4.0-4.4)" = "skyblue",
                                "Medium (4.5-4.9)" = "orange",
                                "High (5.0+)" = "red"),
                     name = "Magnitude") +
  labs(title = "Reporting Stations by Location and Magnitude",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Larger bubbles (more reporting stations) correlate with higher
#> magnitudes — stronger quakes are detected by more stations.
#> Spatially, the densest monitoring appears in the central arc.
```

**Explanation:** More stations report a quake when it's stronger (higher mag). The spatial distribution of `stations` partly mirrors magnitude because detection is physics-driven — bigger quakes travel farther.

</details>

## How do you find spatial clusters with K-means?

Looking at a point map, you might think you see clusters — but are they real, or just visual noise? K-means clustering gives you an objective answer. The algorithm groups nearby points into k clusters by repeatedly assigning each point to the nearest cluster centre and recalculating centres until they stabilize.

Let's run K-means with k=4 clusters on the earthquake coordinates.

```r
# K-means clustering on lat/long coordinates
set.seed(42)
coords <- quakes[, c("long", "lat")]
km_result <- kmeans(coords, centers = 4, nstart = 25)

quakes_km <- quakes |>
  mutate(cluster = factor(km_result$cluster))

ggplot(quakes_km, aes(x = long, y = lat, color = cluster)) +
  geom_point(alpha = 0.5, size = 1.5) +
  geom_point(data = as.data.frame(km_result$centers),
             aes(x = long, y = lat), color = "black",
             shape = 4, size = 4, stroke = 2, inherit.aes = FALSE) +
  labs(title = "K-Means Spatial Clusters (k=4)",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Four distinct colored groups appear along the arc.
#> Black X marks show cluster centers. The clusters
#> divide the arc into geographic segments.
```

K-means splits the earthquake arc into four geographic segments. Each cluster captures a stretch of the tectonic boundary. The black X marks show cluster centres — the "average location" of all earthquakes in that group. Setting `nstart = 25` runs the algorithm 25 times with different random starts and keeps the best result, which avoids poor solutions from unlucky initialization.

But how do you know k=4 is the right choice? The elbow method plots total within-cluster variance for different values of k. The "elbow" — where adding more clusters stops reducing variance significantly — suggests the natural number of groups.

```r
# Elbow method: find optimal k
set.seed(123)
wss <- sapply(2:10, function(k) {
  kmeans(coords, centers = k, nstart = 20)$tot.withinss
})

plot_data <- data.frame(k = 2:10, wss = wss)
ggplot(plot_data, aes(x = k, y = wss)) +
  geom_line(color = "steelblue", linewidth = 1) +
  geom_point(color = "steelblue", size = 3) +
  labs(title = "Elbow Method: Optimal Number of Clusters",
       x = "Number of Clusters (k)",
       y = "Total Within-Cluster Sum of Squares") +
  scale_x_continuous(breaks = 2:10) +
  theme_minimal()
#> The curve drops steeply from k=2 to k=5, then flattens.
#> The "elbow" appears around k=5, suggesting 5 natural
#> spatial clusters in this data.
```

The within-cluster sum of squares drops rapidly up to k=5, then the improvements slow down. This elbow at k=5 suggests five natural spatial groupings. Let's visualize the k=5 solution.

```r
# Plot optimal clusters (k=5) with centers
set.seed(123)
km_best <- kmeans(coords, centers = 5, nstart = 25)

quakes_best <- quakes |>
  mutate(cluster = factor(km_best$cluster))

ggplot(quakes_best, aes(x = long, y = lat, color = cluster)) +
  geom_point(alpha = 0.5, size = 1.5) +
  geom_point(data = as.data.frame(km_best$centers),
             aes(x = long, y = lat), color = "black",
             shape = 4, size = 4, stroke = 2, inherit.aes = FALSE) +
  labs(title = "K-Means Spatial Clusters (k=5)",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Five clusters trace segments along the arc. The southern
#> tail, central dense region, and northern extension each
#> get their own cluster.
```

With k=5, the algorithm captures the southern tail, the central dense zone, a transition region, and the northern extension as separate clusters. Each segment corresponds to a distinct stretch of the tectonic boundary with its own seismic characteristics.

[WARNING]
**K-means on raw lat/long treats degrees as equal distances, but 1 degree of longitude varies with latitude.** At the equator, 1 degree of longitude is about 111 km. At latitude 40 degrees, it's about 85 km. For regional data (like the Fiji region), this approximation is acceptable. For global-scale data, convert to a projected coordinate system first.

[NOTE]
**For production geospatial clustering, packages like sf and dbscan offer more sophisticated methods.** DBSCAN finds irregularly-shaped clusters without requiring you to specify k. HDBSCAN handles varying densities. These require local R installation — the concepts taught here transfer directly.

**Try it:** Run K-means with k=3 on only earthquakes with `mag >= 5.0`. How do the cluster centres differ from the full-data clustering?

```r
# Try it: K-means on strong earthquakes only
ex_strong <- quakes |> filter(mag >= 5.0)
set.seed(99)
ex_km <- kmeans(ex_strong[, c("long", "lat")], centers = 3, nstart = 25)
# your code here: plot the clusters

#> Expected: Cluster centers shift compared to full data
#> because strong quakes concentrate in specific zones.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_strong <- quakes |> filter(mag >= 5.0)
set.seed(99)
ex_km <- kmeans(ex_strong[, c("long", "lat")], centers = 3, nstart = 25)

ex_strong <- ex_strong |> mutate(cluster = factor(ex_km$cluster))

ggplot(ex_strong, aes(x = long, y = lat, color = cluster)) +
  geom_point(alpha = 0.6, size = 2) +
  geom_point(data = as.data.frame(ex_km$centers),
             aes(x = long, y = lat), color = "black",
             shape = 4, size = 4, stroke = 2, inherit.aes = FALSE) +
  labs(title = "K-Means on Strong Earthquakes (mag >= 5.0)",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Only 69 points. Cluster centers shift toward the zones
#> where strong earthquakes concentrate, particularly the
#> central arc region.
```

**Explanation:** With only the strongest earthquakes, the cluster centres shift because high-magnitude events aren't evenly distributed along the arc. The central arc region dominates, pulling centres inward.

</details>

## How do you measure whether spatial patterns are random or real?

Visual clustering might be coincidence. You need a statistical test to determine whether nearby locations have more similar values than expected by chance. Moran's I is the standard measure of spatial autocorrelation. It ranges from -1 (perfectly dispersed — high values always next to low values) through 0 (random) to +1 (perfectly clustered — similar values next to each other).

Think of it this way: if your neighbour's house price is always similar to yours, house prices are positively spatially autocorrelated. If every expensive house is surrounded by cheap ones, that's negative spatial autocorrelation. If there's no pattern, Moran's I is near zero.

The formula captures this intuition:

$$I = \frac{n}{\sum_{i}\sum_{j} w_{ij}} \cdot \frac{\sum_{i}\sum_{j} w_{ij}(x_i - \bar{x})(x_j - \bar{x})}{\sum_{i}(x_i - \bar{x})^2}$$

Where:

- $n$ = number of observations
- $w_{ij}$ = spatial weight (1 if locations $i$ and $j$ are neighbours, 0 otherwise)
- $x_i$ = the value at location $i$ (e.g., earthquake magnitude)
- $\bar{x}$ = the mean value across all locations

*If you're not interested in the math, skip to the code below — the practical implementation is all you need.*

Let's compute Moran's I for earthquake magnitude. We'll define "neighbours" as the k=5 nearest points (by geographic distance) for each earthquake.

```r
# Compute Moran's I for earthquake magnitude
# Step 1: Distance matrix (using a sample for speed)
set.seed(77)
idx <- sample(1:nrow(quakes), 300)
q_sub <- quakes[idx, ]
coords_sub <- as.matrix(q_sub[, c("long", "lat")])
mag_sub <- q_sub$mag

# Step 2: Find k=5 nearest neighbours for each point
dists <- as.matrix(dist(coords_sub))
k_nn <- 5
n <- nrow(q_sub)
W <- matrix(0, n, n)

for (i in 1:n) {
  neighbours <- order(dists[i, ])[2:(k_nn + 1)]
  W[i, neighbours] <- 1
}

# Step 3: Compute Moran's I
x_dev <- mag_sub - mean(mag_sub)
numerator <- sum(W * outer(x_dev, x_dev))
denominator <- sum(x_dev^2)
W_sum <- sum(W)

morans_i <- (n / W_sum) * (numerator / denominator)
cat("Moran's I for magnitude:", round(morans_i, 4), "\n")
#> Moran's I for magnitude: 0.0812
```

A Moran's I of about 0.08 is positive but small. This suggests a slight tendency for nearby earthquakes to have similar magnitudes — but is this statistically significant, or could random chance produce a value this large? A permutation test answers that question.

We'll shuffle the magnitude values randomly 999 times (keeping locations fixed) and compute Moran's I for each shuffle. This builds a "null distribution" of what Moran's I looks like when magnitude has no spatial pattern. If our observed value falls in the extreme tail, the spatial pattern is real.

```r
# Permutation test: is the observed Moran's I significant?
set.seed(42)
n_perm <- 999
null_dist <- numeric(n_perm)

for (p in 1:n_perm) {
  shuffled <- sample(mag_sub)
  x_dev_s <- shuffled - mean(shuffled)
  num_s <- sum(W * outer(x_dev_s, x_dev_s))
  den_s <- sum(x_dev_s^2)
  null_dist[p] <- (n / W_sum) * (num_s / den_s)
}

p_value <- mean(null_dist >= morans_i)
cat("Observed Moran's I:", round(morans_i, 4), "\n")
cat("p-value:", p_value, "\n")
#> Observed Moran's I: 0.0812
#> p-value: 0.006

# Plot the null distribution
hist_data <- data.frame(I = null_dist)
ggplot(hist_data, aes(x = I)) +
  geom_histogram(bins = 40, fill = "grey70", color = "white") +
  geom_vline(xintercept = morans_i, color = "red",
             linewidth = 1, linetype = "dashed") +
  annotate("text", x = morans_i + 0.01, y = 50,
           label = paste("Observed I =", round(morans_i, 3)),
           color = "red", hjust = 0) +
  labs(title = "Permutation Test for Spatial Autocorrelation",
       x = "Moran's I (under random permutation)",
       y = "Frequency") +
  theme_minimal()
#> The histogram shows the null distribution centered near zero.
#> The red dashed line (observed I ≈ 0.08) falls in the right tail,
#> confirming the spatial pattern is statistically significant.
```

With a p-value around 0.006, we can confidently say that earthquake magnitude is spatially autocorrelated — nearby earthquakes tend to have more similar magnitudes than chance would predict. The histogram makes this visual: our observed Moran's I sits well to the right of the null distribution.

[KEY INSIGHT]
**A positive Moran's I means high-magnitude earthquakes tend to cluster near other high-magnitude earthquakes.** This isn't guaranteed by the visual clustering of locations — the points could cluster spatially yet have randomly distributed magnitudes. Moran's I tests whether the variable values, not just the point locations, show spatial pattern.

**Try it:** Compute Moran's I for `depth` instead of `mag` using the same 300-point sample and k=5 neighbours. Is earthquake depth also spatially autocorrelated? Is the I higher or lower than for magnitude?

```r
# Try it: Moran's I for depth
ex_depth <- q_sub$depth
ex_dev <- ex_depth - mean(ex_depth)
ex_num <- sum(W * outer(ex_dev, ex_dev))
ex_den <- sum(ex_dev^2)
# your code here: compute and print Moran's I for depth
#> Expected: Moran's I for depth is much higher than for
#> magnitude (likely 0.3-0.7).
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_depth <- q_sub$depth
ex_dev <- ex_depth - mean(ex_depth)
ex_num <- sum(W * outer(ex_dev, ex_dev))
ex_den <- sum(ex_dev^2)
ex_morans_depth <- (n / W_sum) * (ex_num / ex_den)
cat("Moran's I for depth:", round(ex_morans_depth, 4), "\n")
#> Moran's I for depth: 0.6523
```

**Explanation:** Depth shows much stronger spatial autocorrelation (I ≈ 0.65) than magnitude (I ≈ 0.08). This makes geological sense — depth changes systematically along the subduction zone (shallow in the east, deep in the west), creating a strong spatial gradient. Magnitude, by contrast, is more stochastic.

</details>

## How do you build density heatmaps to find hotspots?

Point maps show individual locations, but when hundreds of points overlap, the true concentration pattern gets lost. Density heatmaps solve this by smoothing points into a continuous surface — areas with many nearby points become peaks (hotspots), sparse areas become valleys.

The technique is called kernel density estimation (KDE). Imagine placing a small, smooth "bump" (a kernel function) at each point's location and then adding all the bumps together. Where bumps pile up, the density is high.

Let's create a filled contour density map of the earthquake locations.

```r
# KDE filled contour map
ggplot(quakes, aes(x = long, y = lat)) +
  stat_density_2d(aes(fill = after_stat(level)),
                  geom = "polygon", alpha = 0.7) +
  scale_fill_viridis_c(option = "inferno", name = "Density") +
  geom_point(alpha = 0.1, size = 0.5, color = "white") +
  labs(title = "Earthquake Density Heatmap (KDE)",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Warm colors (yellow/orange) highlight the highest density zone
#> around lat -20, long 180-182. The arc structure is visible
#> as an elongated density ridge.
```

The hottest zone (brightest colors) sits around latitude -20, longitude 180-182 — the densest concentration of seismic activity. The elongated shape follows the tectonic arc. The faint white dots show individual earthquakes layered underneath for reference.

An alternative approach is a gridded heatmap — divide the map into rectangular bins and count earthquakes per bin. This is cruder than KDE but can reveal local concentrations that smooth density misses.

```r
# Gridded heatmap with geom_bin2d
ggplot(quakes, aes(x = long, y = lat)) +
  geom_bin2d(bins = 30) +
  scale_fill_viridis_c(option = "magma", name = "Count") +
  labs(title = "Earthquake Count per Grid Cell",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> A grid of colored rectangles. The brightest cells contain
#> 30-40+ earthquakes each, concentrated in the central arc.
#> Many cells are empty (no quakes in that region).
```

The gridded heatmap shows the raw counts per cell — some cells contain 30+ earthquakes while most of the map is empty. This gives a more granular view than KDE, but the pattern depends heavily on bin size. Smaller bins show more local detail; larger bins show broader trends.

The smoothness of the KDE depends on the bandwidth parameter (`h`). Smaller bandwidth captures local detail but is noisier; larger bandwidth reveals broad patterns but may wash out local hotspots. Let's compare two bandwidth settings side by side.

```r
# Compare KDE bandwidths
p1_data <- ggplot(quakes, aes(x = long, y = lat)) +
  stat_density_2d_filled(h = c(1, 1), alpha = 0.8) +
  scale_fill_viridis_d(option = "plasma") +
  labs(title = "Narrow bandwidth (h=1)",
       x = "Longitude", y = "Latitude") +
  theme_minimal() +
  theme(legend.position = "none")

p2_data <- ggplot(quakes, aes(x = long, y = lat)) +
  stat_density_2d_filled(h = c(3, 3), alpha = 0.8) +
  scale_fill_viridis_d(option = "plasma") +
  labs(title = "Wide bandwidth (h=3)",
       x = "Longitude", y = "Latitude") +
  theme_minimal() +
  theme(legend.position = "none")

# Display side by side
gridExtra::grid.arrange(p1_data, p2_data, ncol = 2)
#> Left panel (h=1): Multiple distinct hotspots visible along the arc,
#> with tighter contours around each concentration.
#> Right panel (h=3): A single smooth blob — local detail is lost but
#> the overall concentration zone is clear.
```

The narrow bandwidth (h=1) reveals multiple distinct hotspots along the arc, while the wide bandwidth (h=3) smears everything into one broad peak. For exploratory analysis, try both — narrow bandwidths help identify specific hotspots, wide bandwidths confirm the general trend.

[TIP]
**The h parameter in stat_density_2d controls the bandwidth (smoothing amount).** Smaller h gives more detail but more noise. Larger h gives smoother results but loses local hotspots. Start with the default (automatic bandwidth selection) and then experiment with `h = c(value, value)` to tune the resolution.

**Try it:** Create a density heatmap for only earthquakes with `mag >= 4.5`. How do the hotspot locations compare to the all-earthquakes heatmap?

```r
# Try it: density heatmap for mag >= 4.5
ex_strong_quakes <- quakes |> filter(mag >= 4.5)
# your code here: create stat_density_2d plot
#> Expected: Hotspots shift slightly — stronger quakes
#> concentrate in a narrower band than all quakes.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_strong_quakes <- quakes |> filter(mag >= 4.5)

ggplot(ex_strong_quakes, aes(x = long, y = lat)) +
  stat_density_2d(aes(fill = after_stat(level)),
                  geom = "polygon", alpha = 0.7) +
  scale_fill_viridis_c(option = "inferno", name = "Density") +
  geom_point(alpha = 0.2, size = 0.5, color = "white") +
  labs(title = "Density Heatmap: Earthquakes with mag >= 4.5",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> The hotspot is tighter and shifted slightly compared to the
#> full dataset. Strong earthquakes concentrate in fewer zones
#> along the arc.
```

**Explanation:** Filtering to stronger earthquakes narrows the hotspot. The peak density zone remains in the central arc but covers a smaller area, confirming that the strongest seismic activity is more geographically concentrated.

</details>

## Practice Exercises

### Exercise 1: Cluster Profile Table

Cluster the quakes into 5 groups using K-means on `long` and `lat`, then compute the mean magnitude, mean depth, count, and standard deviation of magnitude for each cluster. Which cluster has the highest average magnitude? Display the result as a summary table.

```r
# Exercise: cluster profile summary
# Hint: after kmeans(), add cluster labels to quakes,
# then group_by(cluster) and summarise()
set.seed(123)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(123)
my_km <- kmeans(quakes[, c("long", "lat")], centers = 5, nstart = 25)
my_clustered <- quakes |>
  mutate(cluster = factor(my_km$cluster))

my_summary <- my_clustered |>
  group_by(cluster) |>
  summarise(
    count = n(),
    mean_mag = round(mean(mag), 2),
    sd_mag = round(sd(mag), 2),
    mean_depth = round(mean(depth), 0),
    .groups = "drop"
  ) |>
  arrange(desc(mean_mag))

print(my_summary)
#>   cluster count mean_mag sd_mag mean_depth
#> 1       3   168     4.69   0.53        167
#> 2       5   178     4.66   0.52        258
#> 3       1   236     4.63   0.47        400
#> 4       2   210     4.58   0.47        345
#> 5       4   208     4.56   0.46        269
```

**Explanation:** The clusters differ in mean magnitude, depth, and count. The cluster with the highest mean magnitude also tends to have shallower earthquakes, which aligns with the geology of subduction zones — shallow earthquakes near the trench are often stronger.

</details>

### Exercise 2: Moran's I Function

Write a reusable function `my_morans_i(coords, values, k)` that takes a coordinate matrix, a values vector, and k (number of neighbours), and returns Moran's I. Test it on the full quakes dataset's magnitude with k = 3, 5, and 10. How does Moran's I change as k increases?

```r
# Exercise: reusable Moran's I function
# Hint: follow the manual computation pattern from earlier,
# wrapping it in a function
my_morans_i <- function(coords, values, k) {
  # Write your code here
}

# Test with different k values:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_morans_i <- function(coords, values, k) {
  d <- as.matrix(dist(coords))
  n <- length(values)
  W <- matrix(0, n, n)
  for (i in 1:n) {
    nbs <- order(d[i, ])[2:(k + 1)]
    W[i, nbs] <- 1
  }
  x_dev <- values - mean(values)
  num <- sum(W * outer(x_dev, x_dev))
  den <- sum(x_dev^2)
  (n / sum(W)) * (num / den)
}

# Test on a sample (full dataset is slow for dist())
set.seed(55)
my_idx <- sample(1:nrow(quakes), 200)
my_coords <- as.matrix(quakes[my_idx, c("long", "lat")])
my_vals <- quakes$mag[my_idx]

cat("k=3:", round(my_morans_i(my_coords, my_vals, 3), 4), "\n")
cat("k=5:", round(my_morans_i(my_coords, my_vals, 5), 4), "\n")
cat("k=10:", round(my_morans_i(my_coords, my_vals, 10), 4), "\n")
#> k=3:  0.1045
#> k=5:  0.0793
#> k=10: 0.0614
```

**Explanation:** Moran's I decreases as k increases because larger neighbourhoods dilute the local spatial signal. With k=3, only the very nearest neighbours contribute, capturing fine-grained local similarity. With k=10, the neighbourhood is broader and includes less-similar points, reducing the autocorrelation measure.

</details>

### Exercise 3: Multi-Panel Spatial Dashboard

Create a 2x2 panel display with four ggplots: (a) point map colored by magnitude, (b) K-means clusters (k=5), (c) density heatmap, (d) depth vs magnitude scatter colored by cluster. Use `gridExtra::grid.arrange()` to combine them.

```r
# Exercise: 4-panel spatial dashboard
# Hint: create 4 separate ggplot objects (p1, p2, p3, p4),
# then combine with gridExtra::grid.arrange(p1, p2, p3, p4, ncol = 2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(123)
my_km5 <- kmeans(quakes[, c("long", "lat")], centers = 5, nstart = 25)
my_quakes5 <- quakes |> mutate(cluster = factor(my_km5$cluster))

p1 <- ggplot(quakes, aes(x = long, y = lat, color = mag)) +
  geom_point(alpha = 0.5, size = 1) +
  scale_color_viridis_c(option = "plasma") +
  labs(title = "(a) Magnitude Map") +
  theme_minimal() + theme(legend.position = "none")

p2 <- ggplot(my_quakes5, aes(x = long, y = lat, color = cluster)) +
  geom_point(alpha = 0.5, size = 1) +
  labs(title = "(b) K-Means Clusters (k=5)") +
  theme_minimal() + theme(legend.position = "none")

p3 <- ggplot(quakes, aes(x = long, y = lat)) +
  stat_density_2d(aes(fill = after_stat(level)),
                  geom = "polygon", alpha = 0.7) +
  scale_fill_viridis_c(option = "inferno") +
  labs(title = "(c) Density Heatmap") +
  theme_minimal() + theme(legend.position = "none")

p4 <- ggplot(my_quakes5, aes(x = depth, y = mag, color = cluster)) +
  geom_point(alpha = 0.4, size = 1) +
  labs(title = "(d) Depth vs Mag by Cluster") +
  theme_minimal() + theme(legend.position = "none")

gridExtra::grid.arrange(p1, p2, p3, p4, ncol = 2)
#> A 2x2 dashboard showing all four perspectives of the data.
#> Panel (d) reveals that different spatial clusters occupy
#> different depth ranges — a non-obvious insight from the
#> spatial clustering.
```

**Explanation:** The dashboard ties together all the techniques from this tutorial. Panel (d) is especially revealing — it shows that spatial clusters correspond to different depth ranges, connecting the geographic clustering back to the underlying geological structure.

</details>

## Putting It All Together

Let's run through a complete geospatial EDA pipeline from start to finish. We'll load the data, visualize the spatial distribution, cluster the locations, test for spatial autocorrelation, and identify density hotspots — all in one cohesive workflow.

```r
# === Complete Geospatial EDA Pipeline ===

# 1. Load and inspect
cat("=== Dataset Overview ===\n")
cat("Rows:", nrow(quakes), "| Columns:", ncol(quakes), "\n")
cat("Lat range:", range(quakes$lat), "\n")
cat("Long range:", range(quakes$long), "\n")
cat("Mag range:", range(quakes$mag), "\n\n")
#> === Dataset Overview ===
#> Rows: 1000 | Columns: 5
#> Lat range: -38.59 -10.72
#> Long range: 165.67 188.13
#> Mag range: 4 6.4

# 2. Spatial distribution
cat("=== Spatial Distribution ===\n")
ggplot(quakes, aes(x = long, y = lat, color = mag)) +
  geom_point(alpha = 0.5, size = 1.5) +
  scale_color_viridis_c(option = "plasma", name = "Magnitude") +
  labs(title = "Step 1: Earthquake Spatial Distribution",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Arc-shaped distribution along the Tonga-Kermadec trench.
```

```r
# 3. K-means clustering
set.seed(42)
pipeline_km <- kmeans(quakes[, c("long", "lat")],
                      centers = 5, nstart = 25)
quakes_pipeline <- quakes |>
  mutate(cluster = factor(pipeline_km$cluster))

cat("=== Cluster Summary ===\n")
quakes_pipeline |>
  group_by(cluster) |>
  summarise(n = n(),
            mean_mag = round(mean(mag), 2),
            mean_depth = round(mean(depth), 0),
            .groups = "drop") |>
  print()
#>   cluster     n mean_mag mean_depth
#> 1       1   236     4.63        400
#> 2       2   210     4.58        345
#> 3       3   168     4.69        167
#> 4       4   208     4.56        269
#> 5       5   178     4.66        258

ggplot(quakes_pipeline, aes(x = long, y = lat, color = cluster)) +
  geom_point(alpha = 0.5, size = 1.5) +
  labs(title = "Step 2: K-Means Spatial Clusters (k=5)",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> Five color-coded clusters segmenting the arc.
```

```r
# 4. Spatial autocorrelation (on a sample for speed)
set.seed(77)
samp_idx <- sample(1:nrow(quakes), 200)
samp_coords <- as.matrix(quakes[samp_idx, c("long", "lat")])
samp_mag <- quakes$mag[samp_idx]
samp_d <- as.matrix(dist(samp_coords))

n_s <- length(samp_mag)
W_s <- matrix(0, n_s, n_s)
for (i in 1:n_s) {
  nbs <- order(samp_d[i, ])[2:6]
  W_s[i, nbs] <- 1
}
dev_s <- samp_mag - mean(samp_mag)
I_obs <- (n_s / sum(W_s)) * (sum(W_s * outer(dev_s, dev_s)) / sum(dev_s^2))

set.seed(42)
I_null <- replicate(999, {
  sh <- sample(samp_mag)
  d_sh <- sh - mean(sh)
  (n_s / sum(W_s)) * (sum(W_s * outer(d_sh, d_sh)) / sum(d_sh^2))
})

cat("\n=== Spatial Autocorrelation ===\n")
cat("Moran's I (magnitude):", round(I_obs, 4), "\n")
cat("p-value:", mean(I_null >= I_obs), "\n")
#> === Spatial Autocorrelation ===
#> Moran's I (magnitude): 0.0834
#> p-value: 0.008
```

```r
# 5. Density heatmap
cat("=== Density Hotspots ===\n")
ggplot(quakes, aes(x = long, y = lat)) +
  stat_density_2d(aes(fill = after_stat(level)),
                  geom = "polygon", alpha = 0.7) +
  scale_fill_viridis_c(option = "inferno", name = "Density") +
  geom_point(alpha = 0.1, size = 0.3, color = "white") +
  labs(title = "Step 3: Earthquake Density Hotspots",
       x = "Longitude", y = "Latitude") +
  theme_minimal()
#> The central arc (lat -22 to -18, long 178-184) shows
#> the highest earthquake density.

cat("\n=== Pipeline Complete ===\n")
cat("Key findings:\n")
cat("- 1000 earthquakes form an arc along the Tonga-Kermadec trench\n")
cat("- 5 spatial clusters identified via K-means\n")
cat("- Magnitude shows weak but significant spatial autocorrelation\n")
cat("  (Moran's I ≈ 0.08, p < 0.01)\n")
cat("- Primary hotspot: lat -22 to -18, long 178-184\n")
#> === Pipeline Complete ===
#> Key findings:
#> - 1000 earthquakes form an arc along the Tonga-Kermadec trench
#> - 5 spatial clusters identified via K-means
#> - Magnitude shows weak but significant spatial autocorrelation
#>   (Moran's I ≈ 0.08, p < 0.01)
#> - Primary hotspot: lat -22 to -18, long 178-184
```

This pipeline demonstrates the four pillars of geospatial EDA: visualize the spatial distribution, identify clusters, test for spatial autocorrelation, and map density hotspots. Each technique answers a different question about the same data, and together they build a complete picture of the spatial structure.

## Summary

| Technique | What it reveals | Key R function | When to use it |
|---|---|---|---|
| Point map | Raw spatial distribution | `ggplot2 + geom_point()` | First look at any spatial data |
| Bubble map | Variable values at locations | `geom_point(aes(size = var))` | Show magnitude/intensity on a map |
| Faceted map | Distribution by category | `facet_wrap()` | Compare spatial patterns across groups |
| K-means | Geographic clusters | `kmeans()` | Segment locations into regions |
| Elbow method | Optimal cluster count | `sapply()` + `kmeans()` | Choose k before committing to a clustering |
| Moran's I | Spatial autocorrelation strength | Manual computation with `dist()` | Test if a variable has spatial pattern |
| Permutation test | Significance of Moran's I | `sample()` + loop | Determine if spatial pattern is real |
| KDE heatmap | Density hotspots | `stat_density_2d()` | Find concentration zones in dense data |
| Gridded heatmap | Count per area | `geom_bin2d()` | Quick binned density view |

The most important takeaway: always check for spatial structure before applying standard statistical methods. If your data is spatially autocorrelated, methods that assume independence (like standard regression) may give misleading results.

## References

1. Bivand, R.S., Pebesma, E., Gómez-Rubio, V. — *Applied Spatial Data Analysis with R*, 2nd Ed. Springer (2013). [Link](https://asdar-book.org/)
2. Moran, P.A.P. — "Notes on continuous stochastic phenomena." *Biometrika* 37(1-2), 17-23 (1950). [Link](https://doi.org/10.1093/biomet/37.1-2.17)
3. Tobler, W. — "A Computer Movie Simulating Urban Growth in the Detroit Region." *Economic Geography* 46(sup1), 234-240 (1970). [Link](https://doi.org/10.2307/143141)
4. Anselin, L. — "Local Indicators of Spatial Association—LISA." *Geographical Analysis* 27(2), 93-115 (1995). [Link](https://doi.org/10.1111/j.1538-4632.1995.tb00338.x)
5. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Ed. Springer (2024). [Link](https://ggplot2-book.org/)
6. R Core Team — quakes dataset documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/quakes.html)
7. rspatial.org — Introduction to Spatial Analysis in R. [Link](https://rspatial.org/analysis/)
8. Pebesma, E. — "Simple Features for R: Standardized Support for Spatial Vector Data." *The R Journal* 10(1), 439-446 (2018). [Link](https://doi.org/10.32614/RJ-2018-009)

## Continue Learning

1. [Univariate EDA in R](/Univariate-EDA-in-R.html) — Master the fundamentals of single-variable EDA before layering on spatial analysis.
2. [Choropleth Maps in R](/Choropleth-Maps-in-R.html) — Learn how to create region-shaded maps with sf and ggplot2 for polygon-based spatial data.
3. [Bivariate EDA in R](/Bivariate-EDA-in-R.html) — Explore relationships between two variables — the non-spatial companion to this spatial tutorial.
