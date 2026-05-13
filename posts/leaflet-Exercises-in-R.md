---
title: "leaflet Exercises in R: 20 Real-World Map Problems"
slug: "leaflet-Exercises-in-R"
description: "20 leaflet R exercises: markers, popups, choropleth, heatmaps, layer control, dashboards. Hidden solutions, embedded business context, real workflows."
keywords: "leaflet R exercises, leaflet practice R, R interactive map exercises, choropleth R, leaflet markers R, leaflet popup R, leaflet heatmap R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "leaflet Exercises"
sidebar_order: 151
fr_parent: "R-Tutorial.html"
auto_link_terms: "leaflet R exercises|leaflet practice R|R interactive map exercises|choropleth R|leaflet popup R|leaflet heatmap R"
auto_link_case_sensitive: false
target_keyword: "leaflet R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# leaflet Exercises in R: 20 Real-World Map Problems

<p class="lead">Twenty hands-on leaflet exercises grouped by skill: base maps, markers and popups, polygons and choropleths, color palettes and legends, layer controls, and full ops-team dashboards. Every problem is framed around a real ask from analysts, dispatchers, and city planners. Solutions are hidden behind a click so you can attempt each one first.</p>

```r title="Run this once before any exercise"
library(leaflet)
library(leaflet.extras)
library(dplyr)
library(tibble)
```

## Section 1. Base maps and tile providers (3 problems)

### Exercise 1.1: Render a default OpenStreetMap base layer

**Task:** A new analyst onboarding to a logistics tool needs a baseline map to confirm the leaflet stack is wired up. Initialize a leaflet widget and add the default OpenStreetMap tiles so the analyst sees a world map at the lowest zoom. Save the result to `ex_1_1`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - one base tile layer: OpenStreetMap default
#>   - view: world extent, default zoom 1, center (0, 0)
#>   - no markers, polygons, or overlays
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- leaflet() |>
  addTiles()
ex_1_1
#> A leaflet htmlwidget:
#>   - one base tile layer: OpenStreetMap default
#>   - view: world extent, default zoom 1, center (0, 0)
```

**Explanation:** `leaflet()` returns an empty htmlwidget; tiles are not implied. `addTiles()` with no arguments calls the OpenStreetMap provider, which is the canonical free baseline. You will compose every other layer (markers, polygons, choropleths) on top of this base. Skipping the tile layer leaves a blank grey canvas, which is a common first-time gotcha.

</details>

### Exercise 1.2: Center and zoom on a specific city for a courier briefing

**Task:** Dispatch wants the morning briefing centered on Manhattan at zoom 12 so the courier team sees neighborhood-level streets, not boroughs. Build a leaflet map centered on longitude `-74.0060` and latitude `40.7128` at zoom level 12 with default tiles. Save the result to `ex_1_2`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - tile layer: OpenStreetMap
#>   - center: lng = -74.0060, lat = 40.7128 (Manhattan)
#>   - zoom: 12 (neighborhood-level streets visible)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- leaflet() |>
  addTiles() |>
  setView(lng = -74.0060, lat = 40.7128, zoom = 12)
ex_1_2
#> A leaflet htmlwidget centered on Manhattan at zoom 12
```

**Explanation:** `setView()` controls both the geographic center and the zoom level simultaneously. Zoom 12 is the sweet spot for urban dispatch: streets are labeled, but a whole borough still fits in view. Compare to `fitBounds()`, which auto-fits a bounding box and is preferred when you have a set of points whose extent you want shown. Use `setView()` when the focal point is fixed regardless of data.

</details>

### Exercise 1.3: Compare three tile providers for a real-estate listing page

**Task:** A real-estate marketing team is A/B testing the base-map style on listing pages. Render three leaflet maps centered on San Francisco (lng `-122.42`, lat `37.77`, zoom 12) using OpenStreetMap, CartoDB Positron, and Esri WorldImagery. Save the three maps as a named list to `ex_1_3` with names `"osm"`, `"carto"`, and `"esri"`.

**Expected result:**

```
#> A named list of length 3 holding leaflet htmlwidgets:
#>   $osm   : OpenStreetMap tiles, SF view
#>   $carto : CartoDB.Positron clean light tiles, SF view
#>   $esri  : Esri.WorldImagery satellite tiles, SF view
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
str(ex_1_3, max.level = 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_map <- function(provider) {
  leaflet() |>
    addProviderTiles(provider) |>
    setView(lng = -122.42, lat = 37.77, zoom = 12)
}

ex_1_3 <- list(
  osm   = leaflet() |> addTiles() |> setView(-122.42, 37.77, 12),
  carto = make_map(providers$CartoDB.Positron),
  esri  = make_map(providers$Esri.WorldImagery)
)
str(ex_1_3, max.level = 1)
#> List of 3
#>  $ osm  :List of 8
#>  $ carto:List of 8
#>  $ esri :List of 8
```

**Explanation:** `addProviderTiles()` switches to any of 200+ free tile providers exposed through the `providers` object. Positron is the de facto choice for analytics dashboards because its muted palette lets data colors pop. Esri WorldImagery is the satellite default. For commercial use, check provider terms: OpenStreetMap requires attribution, and some providers cap free tile requests per day.

</details>

## Section 2. Markers, popups, and labels (4 problems)

### Exercise 2.1: Drop a single marker with a popup for a store opening

**Task:** A retail expansion lead is announcing the new Brooklyn flagship and wants a one-pin map for the press release. Add one marker at lng `-73.9442`, lat `40.6782` with a popup that reads `"Brooklyn Flagship Opening Sept 2026"`. Use OpenStreetMap tiles centered on the marker at zoom 13. Save to `ex_2_1`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - tile layer: OpenStreetMap
#>   - center: (-73.9442, 40.6782), zoom 13
#>   - one marker with popup "Brooklyn Flagship Opening Sept 2026"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- leaflet() |>
  addTiles() |>
  setView(lng = -73.9442, lat = 40.6782, zoom = 13) |>
  addMarkers(
    lng = -73.9442,
    lat = 40.6782,
    popup = "Brooklyn Flagship Opening Sept 2026"
  )
ex_2_1
#> A leaflet htmlwidget with one marker and popup
```

**Explanation:** `addMarkers()` accepts either inline coordinates or a `data` frame with `lng`/`lat` columns. Popups appear on click; for hover behavior you would use `label = ...` instead. Popups support HTML by default, so something like `popup = "<b>Brooklyn</b><br>Sept 2026"` will render bold. For untrusted content always sanitize, or pass `popup = htmlEscape(text)` to avoid XSS through user-submitted strings.

</details>

### Exercise 2.2: Plot multiple store locations from a data frame

**Task:** The retail ops team has a tibble of US flagship stores with `name`, `lng`, and `lat`. Plot all five stores as markers on a leaflet map with each popup showing the store name. Use OpenStreetMap tiles and let `fitBounds()` auto-zoom to show all five. Build the data inline first. Save the map to `ex_2_2`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - tile layer: OpenStreetMap
#>   - 5 markers (NYC, Chicago, LA, Austin, Seattle)
#>   - view auto-fit to bounding box of all 5
#>   - each popup shows the store name on click
```

**Difficulty:** Intermediate

```r title="Your turn"
stores <- tibble::tribble(
  ~name,        ~lng,      ~lat,
  "NYC",        -74.0060,  40.7128,
  "Chicago",    -87.6298,  41.8781,
  "Los Angeles",-118.2437, 34.0522,
  "Austin",     -97.7431,  30.2672,
  "Seattle",    -122.3321, 47.6062
)

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stores <- tibble::tribble(
  ~name,        ~lng,      ~lat,
  "NYC",        -74.0060,  40.7128,
  "Chicago",    -87.6298,  41.8781,
  "Los Angeles",-118.2437, 34.0522,
  "Austin",     -97.7431,  30.2672,
  "Seattle",    -122.3321, 47.6062
)

ex_2_2 <- leaflet(stores) |>
  addTiles() |>
  addMarkers(lng = ~lng, lat = ~lat, popup = ~name) |>
  fitBounds(
    lng1 = min(stores$lng), lat1 = min(stores$lat),
    lng2 = max(stores$lng), lat2 = max(stores$lat)
  )
ex_2_2
#> A leaflet htmlwidget with 5 popup-labeled markers and auto-fit bounds
```

**Explanation:** Passing the data frame to `leaflet(data = stores)` lets you reference columns with formula notation (`~lng`, `~lat`, `~name`). This is far cleaner than passing vectors. `fitBounds()` auto-zooms to the smallest box that contains all points, which is exactly what you want for a multi-store overview. For a single-coast subset you would use `setView()` with a hardcoded center to keep the framing stable across updates.

</details>

### Exercise 2.3: Use awesome icons to encode store status

**Task:** The retail ops dashboard needs to flag store status visually: `"open"` stores use a green storefront icon, `"closing_soon"` uses an orange clock, and `"closed"` uses a red ban icon. Use `awesomeIcons()` from the FontAwesome library. Build a tibble with three stores, one per status, then render them with status-driven icons. Save to `ex_2_3`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 3 awesome-icon markers, one per status
#>   - green "store" icon for "open"
#>   - orange "clock" icon for "closing_soon"
#>   - red "ban" icon for "closed"
#>   - popup shows store name on click
```

**Difficulty:** Intermediate

```r title="Your turn"
status_stores <- tibble::tribble(
  ~name,          ~lng,      ~lat,    ~status,
  "Open Store",   -74.0060,  40.7128, "open",
  "Soon-To-Close",-87.6298,  41.8781, "closing_soon",
  "Closed Store", -97.7431,  30.2672, "closed"
)

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
status_stores <- tibble::tribble(
  ~name,          ~lng,      ~lat,    ~status,
  "Open Store",   -74.0060,  40.7128, "open",
  "Soon-To-Close",-87.6298,  41.8781, "closing_soon",
  "Closed Store", -97.7431,  30.2672, "closed"
)

icon_lookup <- c(open = "store", closing_soon = "clock", closed = "ban")
color_lookup <- c(open = "green", closing_soon = "orange", closed = "red")

icons <- awesomeIcons(
  icon       = icon_lookup[status_stores$status],
  markerColor= color_lookup[status_stores$status],
  library    = "fa",
  iconColor  = "white"
)

ex_2_3 <- leaflet(status_stores) |>
  addTiles() |>
  addAwesomeMarkers(lng = ~lng, lat = ~lat, icon = icons, popup = ~name)
ex_2_3
#> A leaflet htmlwidget with 3 color-coded awesome-icon markers
```

**Explanation:** `awesomeIcons()` builds a vectorized icon definition; you pass parallel vectors for `icon`, `markerColor`, and `iconColor`. Named lookup vectors are the idiomatic way to map a categorical column to icon properties without nested `if_else()`. `library = "fa"` selects FontAwesome; alternatives are `"ion"`, `"glyphicon"`, `"mdi"`. Always pick icons that read clearly at the smallest zoom you support, since FA icons rasterize poorly below 16px.

</details>

### Exercise 2.4: Cluster dense markers for a sales call list

**Task:** A regional sales rep loaded 80 prospect accounts inside the New York metro and the map is unreadable from the overlap. Use `clusterOptions = markerClusterOptions()` to collapse overlapping markers into expandable cluster bubbles. Generate the 80 points by sampling around NYC and render with clustering. Save to `ex_2_4`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - tile layer: OpenStreetMap
#>   - 80 prospect markers clustered into ~6 expandable bubbles
#>   - clicking a cluster zooms in and splits the bubble
#>   - center: NYC, zoom 10
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
prospects <- tibble::tibble(
  account_id = paste0("A", 1:80),
  lng        = rnorm(80, mean = -74.0060, sd = 0.15),
  lat        = rnorm(80, mean = 40.7128,  sd = 0.10)
)

ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
prospects <- tibble::tibble(
  account_id = paste0("A", 1:80),
  lng        = rnorm(80, mean = -74.0060, sd = 0.15),
  lat        = rnorm(80, mean = 40.7128,  sd = 0.10)
)

ex_2_4 <- leaflet(prospects) |>
  addTiles() |>
  setView(lng = -74.0060, lat = 40.7128, zoom = 10) |>
  addMarkers(
    lng = ~lng, lat = ~lat, popup = ~account_id,
    clusterOptions = markerClusterOptions()
  )
ex_2_4
#> A leaflet htmlwidget with clustered prospect markers
```

**Explanation:** `markerClusterOptions()` activates the MarkerCluster plugin, which bundles overlapping markers into a single bubble showing the count. Clicking the bubble zooms in and splits the cluster recursively. This is essential for any dataset over ~50 points in a small area, where individual markers stack and become useless. Tune visual density with `maxClusterRadius` and `disableClusteringAtZoom` to control when clusters dissolve into raw markers.

</details>

## Section 3. Shapes, lines, and polygons (3 problems)

### Exercise 3.1: Draw a delivery route as a polyline

**Task:** A last-mile dispatcher needs to visualize today's planned route between four Manhattan dropoffs in sequence. Build a tibble with the four stops in order, draw a blue polyline connecting them with `addPolylines()`, and overlay numbered markers at each stop. Use OpenStreetMap tiles, `fitBounds()` for framing. Save to `ex_3_1`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - tile layer: OpenStreetMap
#>   - 1 blue polyline connecting 4 stops in order
#>   - 4 markers labeled "Stop 1", "Stop 2", "Stop 3", "Stop 4"
#>   - view auto-fit to route bounding box
```

**Difficulty:** Intermediate

```r title="Your turn"
route <- tibble::tribble(
  ~stop,    ~lng,      ~lat,
  "Stop 1", -74.0060,  40.7128,
  "Stop 2", -73.9857,  40.7484,
  "Stop 3", -73.9683,  40.7851,
  "Stop 4", -73.9442,  40.6782
)

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
route <- tibble::tribble(
  ~stop,    ~lng,      ~lat,
  "Stop 1", -74.0060,  40.7128,
  "Stop 2", -73.9857,  40.7484,
  "Stop 3", -73.9683,  40.7851,
  "Stop 4", -73.9442,  40.6782
)

ex_3_1 <- leaflet(route) |>
  addTiles() |>
  addPolylines(lng = ~lng, lat = ~lat, color = "blue", weight = 3) |>
  addMarkers(lng = ~lng, lat = ~lat, popup = ~stop) |>
  fitBounds(
    lng1 = min(route$lng), lat1 = min(route$lat),
    lng2 = max(route$lng), lat2 = max(route$lat)
  )
ex_3_1
#> A leaflet htmlwidget with one polyline and 4 stop markers
```

**Explanation:** `addPolylines()` connects points in the order they appear in the data frame, so route ordering matters. The line is a straight geodesic between consecutive points; for real road-following lines you would call a routing service like OSRM or Mapbox Directions and feed the returned coordinate string back in. Use `weight` for line thickness and `dashArray = "5,5"` for dashed lines (useful for planned vs actual routes).

</details>

### Exercise 3.2: Size circles by sales volume for a territory map

**Task:** The VP of Sales wants a map where each city's circle radius is proportional to its quarterly revenue, so high-grossing markets are visually obvious. Use `addCircles()` with `radius` scaled to revenue (treat radius in meters). Tooltip should show `name` and `revenue`. Save to `ex_3_2`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 5 circles, radius proportional to revenue
#>   - LA circle largest (revenue 5.2M), Austin smallest (1.1M)
#>   - hover label shows "<name>: $<revenue>M"
#>   - view auto-fit to all 5 cities
```

**Difficulty:** Intermediate

```r title="Your turn"
sales <- tibble::tribble(
  ~name,         ~lng,      ~lat,    ~revenue,
  "NYC",         -74.0060,  40.7128, 4.8,
  "Chicago",     -87.6298,  41.8781, 3.4,
  "Los Angeles", -118.2437, 34.0522, 5.2,
  "Austin",      -97.7431,  30.2672, 1.1,
  "Seattle",     -122.3321, 47.6062, 2.7
)

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble::tribble(
  ~name,         ~lng,      ~lat,    ~revenue,
  "NYC",         -74.0060,  40.7128, 4.8,
  "Chicago",     -87.6298,  41.8781, 3.4,
  "Los Angeles", -118.2437, 34.0522, 5.2,
  "Austin",      -97.7431,  30.2672, 1.1,
  "Seattle",     -122.3321, 47.6062, 2.7
)

ex_3_2 <- leaflet(sales) |>
  addTiles() |>
  addCircles(
    lng = ~lng, lat = ~lat,
    radius = ~revenue * 25000,
    color = "darkred", fillOpacity = 0.5,
    label = ~paste0(name, ": $", revenue, "M")
  ) |>
  fitBounds(
    lng1 = min(sales$lng), lat1 = min(sales$lat),
    lng2 = max(sales$lng), lat2 = max(sales$lat)
  )
ex_3_2
#> A leaflet htmlwidget with revenue-sized circles and hover labels
```

**Explanation:** `addCircles()` interprets `radius` in meters on the ground, so the visual size changes with zoom (geographic). For a marker that keeps a constant pixel size regardless of zoom, use `addCircleMarkers()` where `radius` is in pixels. The 25000 multiplier is empirical: pick a value so the largest bubble fits the city footprint at your default zoom. For perceptual accuracy, scale by `sqrt(revenue)` so circle AREA (not radius) is proportional to the metric.

</details>

### Exercise 3.3: Rectangles for delivery-zone bounding boxes

**Task:** A logistics planner divides New York into three rectangular delivery zones (Lower Manhattan, Midtown, Uptown) and wants to overlay them as semi-transparent rectangles with hover labels showing the zone name. Use `addRectangles()` with `lng1`/`lat1`/`lng2`/`lat2`. Save the map to `ex_3_3`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 3 semi-transparent rectangles tiling Manhattan
#>   - colors: Lower (red), Midtown (green), Uptown (blue)
#>   - hover label shows zone name
#>   - view centered on Manhattan, zoom 12
```

**Difficulty:** Intermediate

```r title="Your turn"
zones <- tibble::tribble(
  ~zone,     ~lng1,    ~lat1,   ~lng2,    ~lat2,   ~color,
  "Lower",   -74.020,  40.700,  -73.990,  40.730,  "red",
  "Midtown", -74.000,  40.730,  -73.960,  40.770,  "green",
  "Uptown",  -73.985,  40.770,  -73.930,  40.820,  "blue"
)

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
zones <- tibble::tribble(
  ~zone,     ~lng1,    ~lat1,   ~lng2,    ~lat2,   ~color,
  "Lower",   -74.020,  40.700,  -73.990,  40.730,  "red",
  "Midtown", -74.000,  40.730,  -73.960,  40.770,  "green",
  "Uptown",  -73.985,  40.770,  -73.930,  40.820,  "blue"
)

ex_3_3 <- leaflet() |>
  addTiles() |>
  setView(-73.98, 40.76, zoom = 12) |>
  addRectangles(
    lng1 = zones$lng1, lat1 = zones$lat1,
    lng2 = zones$lng2, lat2 = zones$lat2,
    color = zones$color, fillOpacity = 0.3,
    label = zones$zone
  )
ex_3_3
#> A leaflet htmlwidget with 3 colored zone rectangles
```

**Explanation:** `addRectangles()` is the simplest geometric overlay because you specify two opposite corners, not a coordinate list. For non-rectangular zones use `addPolygons()` with a list of `lng`/`lat` vectors. Note that the data frame's columns are passed as raw vectors here rather than with `~` formula notation: this works when you call `leaflet()` without `data =`. Both styles are valid; pick one per project for consistency.

</details>

## Section 4. Choropleth and color scales (4 problems)

### Exercise 4.1: Build a continuous color palette with colorNumeric

**Task:** A city analyst wants to color neighborhoods on a 0-100 deprivation index, going from light yellow to dark red. Build a continuous palette function with `colorNumeric(palette = "YlOrRd", domain = 0:100)`. Then apply it to a vector of five scores and return both the palette function and the colors as a named list. Save to `ex_4_1`.

**Expected result:**

```
#> List of 2:
#>  $ pal   : function (x) ... (colorNumeric palette)
#>  $ colors: chr [1:5] "#FFFFCC" "#FED976" "#FD8D3C" "#E31A1C" "#800026"
#>    (5 colors going light yellow to dark red for scores 10, 30, 55, 80, 95)
```

**Difficulty:** Intermediate

```r title="Your turn"
scores <- c(10, 30, 55, 80, 95)

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- c(10, 30, 55, 80, 95)

pal <- colorNumeric(palette = "YlOrRd", domain = 0:100)

ex_4_1 <- list(
  pal    = pal,
  colors = pal(scores)
)
ex_4_1$colors
#> [1] "#FFFFCC" "#FED976" "#FD8D3C" "#E31A1C" "#800026"
```

**Explanation:** `colorNumeric()` returns a CLOSURE: a function that, given a numeric vector, returns a vector of hex colors. The `domain` argument fixes the scale so the same score always maps to the same color across different subsets of your data, which is critical for comparable maps. For discrete bins use `colorBin()`, for quantile-based binning use `colorQuantile()`, and for categorical data use `colorFactor()`.

</details>

### Exercise 4.2: Bin a continuous metric into 5 quantile-based colors

**Task:** A retail planner wants to color 30 zip codes by foot-traffic into 5 quantile bins so the top quintile pops. Generate 30 random foot-traffic counts, build a 5-quintile palette with `colorQuantile()`, and return a tibble with the count, the bin index, and the hex color. Save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 30 x 3
#>    foot_traffic   bin color
#>           <dbl> <int> <chr>
#>  1         2350     3 #FD8D3C
#>  2         8200     5 #BD0026
#>  3          450     1 #FFFFB2
#>  ...
#>  # 27 more rows hidden; bin values 1-5; colors light yellow to dark red
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(11)
foot_traffic <- sample(100:10000, 30)

ex_4_2 <- # your code here
head(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
foot_traffic <- sample(100:10000, 30)

pal_q <- colorQuantile(palette = "YlOrRd", domain = foot_traffic, n = 5)

ex_4_2 <- tibble::tibble(
  foot_traffic = foot_traffic,
  bin          = as.integer(cut(foot_traffic,
                  breaks = quantile(foot_traffic, probs = seq(0, 1, 0.2)),
                  include.lowest = TRUE)),
  color        = pal_q(foot_traffic)
)
head(ex_4_2)
#> # A tibble: 6 x 3
#>   foot_traffic   bin color
#>          <dbl> <int> <chr>
#> 1         2350     3 #FD8D3C
#> ...
```

**Explanation:** `colorQuantile()` is the right tool when raw values are highly skewed: equal-width bins (`colorBin()`) would lump 90% of zip codes into one color and leave the top 10% as outliers. Quantile binning guarantees each bin holds the same number of observations, so the visual contrast is preserved even when distributions are heavy-tailed. The trade-off is that bin boundaries are no longer round numbers; document them in the legend.

</details>

### Exercise 4.3: Choropleth polygons with a continuous palette and legend

**Task:** A real-estate marketing team wants a choropleth of 4 neighborhood polygons colored by median home price, with a legend in the bottom-right. Build the neighborhood polygons inline as a tibble of `lng`/`lat` vectors per neighborhood. Use `colorNumeric` for the fill, `addPolygons()`, and `addLegend()`. Save to `ex_4_3`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 4 polygon overlays, fill color by median_price
#>   - palette: YlGnBu (light yellow to dark blue), domain 200k-1.2M
#>   - legend in "bottomright" titled "Median Price ($)"
#>   - hover label shows neighborhood name and price
```

**Difficulty:** Intermediate

```r title="Your turn"
nbhds <- list(
  list(name = "Downtown",  price =  900000,
       lng = c(-74.02,-74.00,-74.00,-74.02),
       lat = c( 40.70, 40.70, 40.72, 40.72)),
  list(name = "Midtown",   price = 1200000,
       lng = c(-74.00,-73.97,-73.97,-74.00),
       lat = c( 40.74, 40.74, 40.77, 40.77)),
  list(name = "Uptown",    price =  600000,
       lng = c(-73.97,-73.94,-73.94,-73.97),
       lat = c( 40.78, 40.78, 40.82, 40.82)),
  list(name = "Outerring", price =  250000,
       lng = c(-73.94,-73.90,-73.90,-73.94),
       lat = c( 40.65, 40.65, 40.68, 40.68))
)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nbhds <- list(
  list(name = "Downtown",  price =  900000,
       lng = c(-74.02,-74.00,-74.00,-74.02),
       lat = c( 40.70, 40.70, 40.72, 40.72)),
  list(name = "Midtown",   price = 1200000,
       lng = c(-74.00,-73.97,-73.97,-74.00),
       lat = c( 40.74, 40.74, 40.77, 40.77)),
  list(name = "Uptown",    price =  600000,
       lng = c(-73.97,-73.94,-73.94,-73.97),
       lat = c( 40.78, 40.78, 40.82, 40.82)),
  list(name = "Outerring", price =  250000,
       lng = c(-73.94,-73.90,-73.90,-73.94),
       lat = c( 40.65, 40.65, 40.68, 40.68))
)

prices <- sapply(nbhds, \(n) n$price)
pal    <- colorNumeric("YlGnBu", domain = range(prices))

m <- leaflet() |> addTiles() |> setView(-73.97, 40.74, 11)

for (n in nbhds) {
  m <- m |> addPolygons(
    lng = n$lng, lat = n$lat,
    fillColor = pal(n$price), fillOpacity = 0.7,
    color = "white", weight = 1,
    label = sprintf("%s: $%s", n$name, format(n$price, big.mark = ","))
  )
}

ex_4_3 <- m |> addLegend(
  position = "bottomright", pal = pal, values = prices,
  title    = "Median Price ($)", labFormat = labelFormat(prefix = "$")
)
ex_4_3
#> A leaflet htmlwidget with 4 choropleth polygons and a price legend
```

**Explanation:** Iterating with a `for` loop is the most readable pattern when each polygon has its own vector of coordinates rather than a tidy long table. For a real project you would typically load a shapefile or GeoJSON with `sf::st_read()` and pass the resulting sf object directly to `addPolygons(data = sf_obj, fillColor = ~pal(price))`. `addLegend()` rounds out the choropleth: a colored polygon without a legend is unreadable.

</details>

### Exercise 4.4: Highlight polygons on hover for an interactive choropleth

**Task:** The same real-estate map from 4.3 should highlight the polygon under the cursor (thicker border, full opacity) so the user can clearly see which neighborhood they are inspecting. Wrap `addPolygons()` with `highlightOptions()`. Reuse the same data. Save to `ex_4_4`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - same choropleth as ex_4_3
#>   - hovering a polygon thickens its border to 3px and lifts opacity to 1.0
#>   - hover label still shows name + price
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here, reuse nbhds and pal from ex_4_3
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- sapply(nbhds, \(n) n$price)
pal    <- colorNumeric("YlGnBu", domain = range(prices))

m <- leaflet() |> addTiles() |> setView(-73.97, 40.74, 11)

for (n in nbhds) {
  m <- m |> addPolygons(
    lng = n$lng, lat = n$lat,
    fillColor = pal(n$price), fillOpacity = 0.7,
    color = "white", weight = 1,
    label = sprintf("%s: $%s", n$name, format(n$price, big.mark = ",")),
    highlightOptions = highlightOptions(
      color = "black", weight = 3, fillOpacity = 1.0, bringToFront = TRUE
    )
  )
}

ex_4_4 <- m |> addLegend(
  position = "bottomright", pal = pal, values = prices,
  title    = "Median Price ($)", labFormat = labelFormat(prefix = "$")
)
ex_4_4
#> A leaflet htmlwidget with hover-highlight choropleth polygons
```

**Explanation:** `highlightOptions()` swaps in temporary styling on `mouseover`, then restores the original style on `mouseout`. `bringToFront = TRUE` ensures the highlighted polygon overlaps its neighbors visually, which matters when borders touch. This is the single biggest readability win for choropleths shown to non-technical viewers: it converts a static color blob into something users can explore.

</details>

## Section 5. Layer control and interactive features (3 problems)

### Exercise 5.1: Toggle two base maps and two overlay groups

**Task:** A city dashboard needs the user to toggle between OpenStreetMap and CartoDB.Positron base layers, and to toggle two overlay groups: "Police Stations" (10 markers) and "Fire Stations" (5 markers). Use `addLayersControl()`. Generate both station tibbles inline by sampling around Chicago. Save the map to `ex_5_1`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 2 base layers selectable via radio: "OSM", "Positron"
#>   - 2 overlay groups toggleable via checkbox: "Police", "Fire"
#>   - 10 blue police markers, 5 red fire markers
#>   - layer control collapsed by default in top-right
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(3)
police <- tibble::tibble(
  lng = rnorm(10, -87.6298, 0.08),
  lat = rnorm(10,  41.8781, 0.06)
)
fire <- tibble::tibble(
  lng = rnorm(5, -87.6298, 0.10),
  lat = rnorm(5,  41.8781, 0.07)
)

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
police <- tibble::tibble(
  lng = rnorm(10, -87.6298, 0.08),
  lat = rnorm(10,  41.8781, 0.06)
)
fire <- tibble::tibble(
  lng = rnorm(5, -87.6298, 0.10),
  lat = rnorm(5,  41.8781, 0.07)
)

ex_5_1 <- leaflet() |>
  addTiles(group = "OSM") |>
  addProviderTiles(providers$CartoDB.Positron, group = "Positron") |>
  addCircleMarkers(
    data = police, lng = ~lng, lat = ~lat,
    color = "blue", radius = 5, group = "Police"
  ) |>
  addCircleMarkers(
    data = fire, lng = ~lng, lat = ~lat,
    color = "red", radius = 6, group = "Fire"
  ) |>
  addLayersControl(
    baseGroups    = c("OSM", "Positron"),
    overlayGroups = c("Police", "Fire"),
    options       = layersControlOptions(collapsed = TRUE)
  )
ex_5_1
#> A leaflet htmlwidget with 2 base maps and 2 toggleable overlay groups
```

**Explanation:** Layer groups are the leaflet idiom for showing/hiding sets of features as a unit. Pass `group = "name"` to every `add*()` call you want grouped, then list those groups in `addLayersControl()`. `baseGroups` are mutually exclusive (radio buttons); `overlayGroups` are independent (checkboxes). For dashboards with many layers, set `collapsed = TRUE` so the control starts as a small icon and expands on hover.

</details>

### Exercise 5.2: Add fullscreen and scale-bar controls

**Task:** The retail leadership reviews territory maps on a projector in the boardroom and needs the map to expand to fullscreen with one click, plus a scale bar so they can eyeball distances. Use `addFullscreenControl()` from leaflet.extras and `addScaleBar()` from leaflet. Build a five-store map and add both controls. Save to `ex_5_2`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 5 sales markers (NYC, Chicago, LA, Austin, Seattle)
#>   - fullscreen button in top-left corner
#>   - scale bar in bottom-left, units "metric" (km)
#>   - view auto-fit to all 5 cities
```

**Difficulty:** Advanced

```r title="Your turn"
sales <- tibble::tribble(
  ~name,         ~lng,      ~lat,
  "NYC",         -74.0060,  40.7128,
  "Chicago",     -87.6298,  41.8781,
  "Los Angeles", -118.2437, 34.0522,
  "Austin",      -97.7431,  30.2672,
  "Seattle",     -122.3321, 47.6062
)

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble::tribble(
  ~name,         ~lng,      ~lat,
  "NYC",         -74.0060,  40.7128,
  "Chicago",     -87.6298,  41.8781,
  "Los Angeles", -118.2437, 34.0522,
  "Austin",      -97.7431,  30.2672,
  "Seattle",     -122.3321, 47.6062
)

ex_5_2 <- leaflet(sales) |>
  addTiles() |>
  addMarkers(lng = ~lng, lat = ~lat, popup = ~name) |>
  fitBounds(
    lng1 = min(sales$lng), lat1 = min(sales$lat),
    lng2 = max(sales$lng), lat2 = max(sales$lat)
  ) |>
  addFullscreenControl(position = "topleft") |>
  addScaleBar(position = "bottomleft",
              options = scaleBarOptions(imperial = FALSE))
ex_5_2
#> A leaflet htmlwidget with fullscreen control and metric scale bar
```

**Explanation:** Boardroom and conference-room maps benefit enormously from `addFullscreenControl()`: a projected map at 1024x768 with a sidebar of controls is unreadable, but fullscreen mode reclaims the entire screen. `addScaleBar()` is the cheapest credibility win on any geographic figure presented to non-technical stakeholders. Set `imperial = TRUE` for US audiences; metric for international. The scale bar auto-adjusts to the current zoom level.

</details>

### Exercise 5.3: Custom HTML popup styling a delivery zone

**Task:** A logistics ops team wants a polygon overlay for the Newark delivery zone with a click-popup that styles content in HTML: bold zone name, 2-row table of "Orders today" and "Avg delivery time". Use `addPolygons()` with a custom HTML popup string. Save to `ex_5_3`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 1 blue polygon outlining Newark delivery zone
#>   - click triggers popup with HTML table:
#>     - <b>Newark Zone</b>
#>     - Orders today: 142
#>     - Avg delivery time: 38 min
```

**Difficulty:** Advanced

```r title="Your turn"
newark <- list(
  lng = c(-74.20, -74.14, -74.14, -74.20),
  lat = c( 40.70,  40.70,  40.76,  40.76)
)

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
newark <- list(
  lng = c(-74.20, -74.14, -74.14, -74.20),
  lat = c( 40.70,  40.70,  40.76,  40.76)
)

popup_html <- paste(
  "<b>Newark Zone</b>",
  "<table style='font-size:11px'>",
  "<tr><td>Orders today</td><td><b>142</b></td></tr>",
  "<tr><td>Avg delivery</td><td><b>38 min</b></td></tr>",
  "</table>",
  sep = ""
)

ex_5_3 <- leaflet() |>
  addTiles() |>
  setView(-74.17, 40.73, zoom = 12) |>
  addPolygons(
    lng = newark$lng, lat = newark$lat,
    color = "blue", fillOpacity = 0.3,
    popup = popup_html
  )
ex_5_3
#> A leaflet htmlwidget with one polygon and a styled HTML popup
```

**Explanation:** Popups support arbitrary HTML, so you can embed tables, images (`<img>`), and links to operational dashboards. For data-driven popups across many polygons, build the HTML strings vectorized with `glue::glue()` or `sprintf()` and pass them as a vector. Keep popup HTML lean: every popup is rendered on first click, so embedding large images can slow down dense maps. For richer interactivity (forms, charts), use Shiny instead.

</details>

## Section 6. Realistic ops-team dashboards (3 problems)

### Exercise 6.1: Build a daily delivery-coverage map with depot and route layers

**Task:** A regional logistics dispatcher wants a daily ops map showing one depot, three delivery zones as rectangles, and the planned routes from depot to each zone center as polylines. Color rectangles by load (light=low, dark=high). Toggle "Zones" and "Routes" via layer control. Use the inline data below. Save the map to `ex_6_1`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 1 depot marker (red, "Newark Depot")
#>   - 3 zone rectangles fill-colored by load (light yellow to dark red)
#>   - 3 dashed polylines from depot to each zone center
#>   - layer control: "Zones" and "Routes" toggleable, OSM base
```

**Difficulty:** Advanced

```r title="Your turn"
depot <- list(name = "Newark Depot", lng = -74.17, lat = 40.73)
zones <- tibble::tribble(
  ~zone,     ~lng1,    ~lat1,   ~lng2,    ~lat2,   ~load,
  "Newark",  -74.20,   40.70,   -74.14,   40.76,   180,
  "JC",      -74.10,   40.70,   -74.04,   40.75,    90,
  "Hoboken", -74.04,   40.73,   -74.01,   40.76,    45
)

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
depot <- list(name = "Newark Depot", lng = -74.17, lat = 40.73)
zones <- tibble::tribble(
  ~zone,     ~lng1,    ~lat1,   ~lng2,    ~lat2,   ~load,
  "Newark",  -74.20,   40.70,   -74.14,   40.76,   180,
  "JC",      -74.10,   40.70,   -74.04,   40.75,    90,
  "Hoboken", -74.04,   40.73,   -74.01,   40.76,    45
)

zones <- zones |>
  mutate(
    cx = (lng1 + lng2) / 2,
    cy = (lat1 + lat2) / 2
  )

pal <- colorNumeric("YlOrRd", domain = zones$load)

m <- leaflet() |>
  addTiles() |>
  setView(-74.10, 40.73, zoom = 11) |>
  addAwesomeMarkers(
    lng = depot$lng, lat = depot$lat,
    icon = awesomeIcons(icon = "truck", library = "fa", markerColor = "red"),
    popup = depot$name
  )

for (i in seq_len(nrow(zones))) {
  z <- zones[i, ]
  m <- m |>
    addRectangles(
      lng1 = z$lng1, lat1 = z$lat1, lng2 = z$lng2, lat2 = z$lat2,
      fillColor = pal(z$load), fillOpacity = 0.6,
      color = "white", weight = 1,
      label = sprintf("%s: %d orders", z$zone, z$load),
      group = "Zones"
    ) |>
    addPolylines(
      lng = c(depot$lng, z$cx), lat = c(depot$lat, z$cy),
      color = "blue", weight = 2, dashArray = "6,6",
      group = "Routes"
    )
}

ex_6_1 <- m |>
  addLegend(position = "bottomright", pal = pal, values = zones$load,
            title = "Orders / Zone") |>
  addLayersControl(
    overlayGroups = c("Zones", "Routes"),
    options = layersControlOptions(collapsed = FALSE)
  )
ex_6_1
#> A leaflet htmlwidget with depot, color-coded zones, dashed routes, and toggles
```

**Explanation:** This pattern is the backbone of a dispatch dashboard: one fixed asset (depot), several variable assets (zones) styled by a metric (load), and the relationships between them (routes). The loop builds the layers incrementally rather than vectorizing because each zone has unique coordinates. In production you would swap in real polygons (a shapefile) and real road-following routes from a routing API. The toggle control lets dispatchers focus on one perspective at a time.

</details>

### Exercise 6.2: Crime hotspot heatmap for a city analyst

**Task:** A city analyst wants to surface crime hotspots from a sample of 200 incident points clustered around three latent epicenters in Chicago. Render a heatmap with `addHeatmap()` from leaflet.extras, with `radius = 20` and `blur = 15`. Center on Chicago at zoom 11. Save to `ex_6_2`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - tile layer: CartoDB.DarkMatter
#>   - heatmap of 200 incident points, 3 visible hotspots
#>   - red core for dense areas, fading through orange/yellow to blue
#>   - center: Chicago (-87.63, 41.88), zoom 11
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(42)
centers <- list(c(-87.65, 41.87), c(-87.62, 41.90), c(-87.66, 41.92))
incidents <- do.call(rbind, lapply(centers, \(c) data.frame(
  lng = rnorm(67, c[1], 0.005),
  lat = rnorm(67, c[2], 0.005)
)))[1:200, ]

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
centers <- list(c(-87.65, 41.87), c(-87.62, 41.90), c(-87.66, 41.92))
incidents <- do.call(rbind, lapply(centers, \(c) data.frame(
  lng = rnorm(67, c[1], 0.005),
  lat = rnorm(67, c[2], 0.005)
)))[1:200, ]

ex_6_2 <- leaflet(incidents) |>
  addProviderTiles(providers$CartoDB.DarkMatter) |>
  setView(-87.63, 41.88, zoom = 11) |>
  addHeatmap(
    lng = ~lng, lat = ~lat,
    radius = 20, blur = 15, max = 0.05
  )
ex_6_2
#> A leaflet htmlwidget with a heatmap of 200 incident points and 3 hotspots
```

**Explanation:** `addHeatmap()` aggregates point density into a smooth gradient using a kernel: `radius` is the influence radius in pixels and `blur` softens transitions between bands. The `max` parameter sets the intensity ceiling and is the single most consequential knob: too high and the map looks flat, too low and a few points saturate. CartoDB.DarkMatter is the conventional base for heatmaps because dark backgrounds make red/orange peaks pop visually. For high-precision hotspot detection, consider `addCluster()` or formal spatial statistics like Getis-Ord G*.

</details>

### Exercise 6.3: Multi-layer sales territory dashboard

**Task:** A VP of Sales wants a single map showing three territories: each territory's polygon colored by Q1 revenue (choropleth), markers for top accounts inside each territory, and the territory headquarters as a starred icon. Toggle "Territories", "Top Accounts", and "HQs" independently. Reuse a single color palette across the choropleth and the legend. Save to `ex_6_3`.

**Expected result:**

```
#> A leaflet htmlwidget:
#>   - 3 colored territory polygons (West, Central, East)
#>   - 6 top-account circle markers (2 per territory)
#>   - 3 starred HQ markers
#>   - layer control with 3 overlay groups, all visible by default
#>   - legend bottom-right titled "Q1 Revenue ($M)"
```

**Difficulty:** Advanced

```r title="Your turn"
territories <- list(
  list(name="West",    rev=4.2,
       lng=c(-122,-115,-115,-122), lat=c(33,33,42,42),
       hq=c(-118.24, 34.05)),
  list(name="Central", rev=3.1,
       lng=c(-105,-90,-90,-105),  lat=c(30,30,42,42),
       hq=c(-97.74, 30.27)),
  list(name="East",    rev=5.8,
       lng=c(-83,-71,-71,-83),    lat=c(36,36,44,44),
       hq=c(-74.01, 40.71))
)
top_accounts <- tibble::tribble(
  ~name,    ~lng,     ~lat,    ~territory,
  "Acme W", -119.4,   35.3,    "West",
  "Beta W", -117.1,   38.9,    "West",
  "Acme C", -98.5,    32.8,    "Central",
  "Beta C", -94.6,    38.6,    "Central",
  "Acme E", -75.2,    39.7,    "East",
  "Beta E", -76.6,    42.3,    "East"
)

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
territories <- list(
  list(name="West",    rev=4.2,
       lng=c(-122,-115,-115,-122), lat=c(33,33,42,42),
       hq=c(-118.24, 34.05)),
  list(name="Central", rev=3.1,
       lng=c(-105,-90,-90,-105),  lat=c(30,30,42,42),
       hq=c(-97.74, 30.27)),
  list(name="East",    rev=5.8,
       lng=c(-83,-71,-71,-83),    lat=c(36,36,44,44),
       hq=c(-74.01, 40.71))
)
top_accounts <- tibble::tribble(
  ~name,    ~lng,     ~lat,    ~territory,
  "Acme W", -119.4,   35.3,    "West",
  "Beta W", -117.1,   38.9,    "West",
  "Acme C", -98.5,    32.8,    "Central",
  "Beta C", -94.6,    38.6,    "Central",
  "Acme E", -75.2,    39.7,    "East",
  "Beta E", -76.6,    42.3,    "East"
)

revs <- sapply(territories, \(t) t$rev)
pal  <- colorNumeric("YlGnBu", domain = revs)

m <- leaflet() |>
  addProviderTiles(providers$CartoDB.Positron) |>
  setView(-95, 38, zoom = 4)

for (t in territories) {
  m <- m |>
    addPolygons(
      lng = t$lng, lat = t$lat,
      fillColor = pal(t$rev), fillOpacity = 0.5,
      color = "white", weight = 1,
      label = sprintf("%s: $%.1fM", t$name, t$rev),
      group = "Territories"
    ) |>
    addAwesomeMarkers(
      lng = t$hq[1], lat = t$hq[2],
      icon = awesomeIcons(icon = "star", library = "fa", markerColor = "darkblue"),
      popup = paste(t$name, "HQ"),
      group = "HQs"
    )
}

m <- m |>
  addCircleMarkers(
    data = top_accounts, lng = ~lng, lat = ~lat,
    radius = 6, color = "black", fillColor = "yellow",
    fillOpacity = 1, weight = 1,
    label = ~paste(name, "(", territory, ")"),
    group = "Top Accounts"
  )

ex_6_3 <- m |>
  addLegend(position = "bottomright", pal = pal, values = revs,
            title = "Q1 Revenue ($M)") |>
  addLayersControl(
    overlayGroups = c("Territories", "Top Accounts", "HQs"),
    options       = layersControlOptions(collapsed = FALSE)
  )
ex_6_3
#> A leaflet htmlwidget combining choropleth, account markers, HQ icons, legend, toggles
```

**Explanation:** Production dashboards stack five to ten layer types on one map; this exercise compresses that pattern into three. Two design rules to remember: keep one palette per metric (the legend implicitly trusts a single domain), and always assign every overlay a `group =` so the user has fine-grained control. For very large datasets (10k+ markers), pair this pattern with marker clustering or feature-group simplification to keep render time under one second.

</details>

## What to do next

- Brush up on the core API with the [leaflet for R tutorial](Leaflet-in-R.html) parent post.
- Practice manipulating the data that feeds these maps with [dplyr Exercises](dplyr-Exercises-in-R.html).
- For shapefile and GeoJSON handling, work through the [sf package Exercises](sf-Exercises-in-R.html).
- Compare with a different mapping toolkit in the [ggplot2 Maps Exercises](ggplot2-Maps-Exercises-in-R.html).
