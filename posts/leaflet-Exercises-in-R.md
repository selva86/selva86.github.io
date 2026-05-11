---
title: "leaflet Exercises in R: 20 Practice Problems"
slug: "leaflet-Exercises-in-R"
description: "Master leaflet in R with 20 practice problems: markers, layers, choropleth, popups, geocoding, tiles. Hidden solutions."
keywords: "leaflet R exercises, leaflet practice R, R interactive map exercises, choropleth R, leaflet tiles R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "leaflet Exercises"
sidebar_order: 151
fr_parent: "R-Tutorial.html"
auto_link_terms: "leaflet R exercises|leaflet practice R|R interactive map exercises|choropleth R"
auto_link_case_sensitive: false
target_keyword: "leaflet R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# leaflet Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on leaflet in R: markers, layers, popups, tiles, choropleths, geocoding. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(leaflet)
library(dplyr)
```

### Exercise 1: Blank map

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles()
```

</details>

### Exercise 2: Set view

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |> setView(lng = -74, lat = 40.7, zoom = 12)
```

</details>

### Exercise 3: Add marker

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |> addMarkers(-74, 40.7, popup = "NYC")
```

</details>

### Exercise 4: Many markers

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- data.frame(lon = c(-74, -118, -87), lat = c(40.7, 34.0, 41.9),
                 name = c("NYC","LA","Chicago"))
leaflet(df) |> addTiles() |> addMarkers(~lon, ~lat, popup = ~name)
```

</details>

### Exercise 5: Circle markers

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- data.frame(lon = c(-74, -118), lat = c(40.7, 34.0))
leaflet(df) |> addTiles() |> addCircleMarkers(~lon, ~lat, radius = 5)
```

</details>

### Exercise 6: Color by value

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- data.frame(lon = c(-74, -118, -87), lat = c(40.7, 34.0, 41.9),
                 score = c(85, 70, 92))
pal <- colorNumeric("Blues", df$score)
leaflet(df) |> addTiles() |>
  addCircleMarkers(~lon, ~lat, color = ~pal(score), radius = 8, fillOpacity = 0.8)
```

</details>

### Exercise 7: Tile providers

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
leaflet() |> addProviderTiles("CartoDB.Positron")
```

</details>

### Exercise 8: Multiple tile layers

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
leaflet() |>
  addTiles(group = "OSM") |>
  addProviderTiles("CartoDB.Positron", group = "Carto") |>
  addLayersControl(baseGroups = c("OSM","Carto"))
```

</details>

### Exercise 9: Polygons

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# Simple square polygon
poly <- list(list(c(-74.1, 40.7), c(-74.0, 40.7), c(-74.0, 40.8), c(-74.1, 40.8), c(-74.1, 40.7)))
leaflet() |> addTiles() |>
  addPolygons(data = sf::st_polygon(poly) |> sf::st_sfc(crs = 4326))
```

</details>

### Exercise 10: Polylines

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |>
  addPolylines(lng = c(-74, -73.9, -73.8), lat = c(40.7, 40.75, 40.8))
```

</details>

### Exercise 11: Popups with HTML

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |>
  addMarkers(-74, 40.7, popup = "<b>NYC</b><br>Pop ~ 8.4M")
```

</details>

### Exercise 12: Labels (tooltips)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |>
  addMarkers(-74, 40.7, label = "Hover me")
```

</details>

### Exercise 13: Choropleth (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# nc <- sf::st_read(system.file("shape/nc.shp", package="sf"))
# pal <- colorNumeric("Reds", nc$AREA)
# leaflet(nc) |> addTiles() |> addPolygons(fillColor = ~pal(AREA), fillOpacity = 0.7)
```

</details>

### Exercise 14: Mini-map

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |> addMiniMap()
```

</details>

### Exercise 15: Scale bar

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |> addScaleBar(position = "bottomleft")
```

</details>

### Exercise 16: Measure widget

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |>
  addMeasure(primaryLengthUnit = "kilometers")
```

</details>

### Exercise 17: Layer groups + toggle

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
leaflet() |> addTiles() |>
  addMarkers(-74, 40.7, group = "NYC") |>
  addMarkers(-118, 34.0, group = "LA") |>
  addLayersControl(overlayGroups = c("NYC","LA"))
```

</details>

### Exercise 18: Legend

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- data.frame(lon = c(-74,-118), lat = c(40.7, 34.0), score = c(85, 70))
pal <- colorNumeric("Blues", df$score)
leaflet(df) |> addTiles() |>
  addCircleMarkers(~lon, ~lat, color = ~pal(score)) |>
  addLegend("bottomright", pal = pal, values = ~score, title = "Score")
```

</details>

### Exercise 19: Cluster markers

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- data.frame(lon = runif(100, -74.1, -73.9), lat = runif(100, 40.6, 40.8))
leaflet(df) |> addTiles() |>
  addMarkers(~lon, ~lat, clusterOptions = markerClusterOptions())
```

</details>

### Exercise 20: Save to HTML

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
m <- leaflet() |> addTiles() |> addMarkers(-74, 40.7)
htmlwidgets::saveWidget(m, "map.html")
```

</details>

## What to do next

- **Data-Visualization-Exercises** (shipped) — broader viz.
- **Shiny-Exercises** (shipped) — embed leaflet in Shiny apps.
