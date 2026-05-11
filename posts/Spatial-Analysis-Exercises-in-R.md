---
title: "Spatial Analysis Exercises in R: 15 Practice Problems"
slug: "Spatial-Analysis-Exercises-in-R"
description: "Master spatial analysis in R with 15 practice problems: sf, raster, projections, geometry ops, choropleth. Hidden solutions."
keywords: "spatial analysis R exercises, sf R practice, GIS R exercises, raster R, R mapping exercises"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Spatial Analysis Exercises"
sidebar_order: 166
fr_parent: "R-Tutorial.html"
auto_link_terms: "spatial analysis R exercises|sf R practice|GIS R exercises|R mapping exercises"
auto_link_case_sensitive: false
target_keyword: "spatial analysis R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Spatial Analysis Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on spatial analysis in R with sf and raster: read, project, geometry operations, joins, choropleth maps.</p>

```r title="Run this once before any exercise"
library(sf)
library(dplyr)
```

### Exercise 1: Read shapefile

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"))
head(nc)
```

</details>

### Exercise 2: Check CRS

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_crs(nc)
```

</details>

### Exercise 3: Transform CRS

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_transform(nc, 3857) |> head(1)
```

</details>

### Exercise 4: Plot

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
plot(st_geometry(nc))
```

</details>

### Exercise 5: Choropleth with ggplot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
ggplot2::ggplot(nc) + ggplot2::geom_sf(ggplot2::aes(fill = AREA))
```

</details>

### Exercise 6: Centroid

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_centroid(nc) |> head(1)
```

</details>

### Exercise 7: Compute areas

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_area(nc) |> head()
```

</details>

### Exercise 8: Buffer

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_buffer(nc, dist = 0.05) |> head(1)
```

</details>

### Exercise 9: Spatial join (points in polygons)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
pts <- st_sample(nc, 10)
st_intersects(pts, nc)
```

</details>

### Exercise 10: Union

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_union(nc) |> plot()
```

</details>

### Exercise 11: Distance between two points

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
p1 <- st_point(c(-74, 40.7))
p2 <- st_point(c(-118, 34.0))
st_sfc(p1, p2, crs = 4326) |> st_distance()
```

</details>

### Exercise 12: Filter by attribute

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
nc |> filter(AREA > 0.1)
```

</details>

### Exercise 13: Write shapefile

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_write(nc, "out.gpkg", append = FALSE)
```

</details>

### Exercise 14: Bounding box

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
nc <- st_read(system.file("shape/nc.shp", package="sf"), quiet = TRUE)
st_bbox(nc)
```

</details>

### Exercise 15: Raster basics

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# library(terra)
# r <- rast(system.file("ex/elev.tif", package = "terra"))
# plot(r)
```

</details>

## What to do next

- **leaflet-Exercises** (shipped) — interactive maps.
- **Data-Visualization-Exercises** (shipped) — viz fundamentals.
