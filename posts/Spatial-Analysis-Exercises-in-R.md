---
title: "Spatial Analysis Exercises in R: 15 Practice Problems"
slug: "Spatial-Analysis-Exercises-in-R"
description: "Practice spatial analysis in R with 15 hands-on problems: sf I/O, CRS reprojection, geometry ops, spatial joins, choropleth maps. Hidden solutions."
keywords: "spatial analysis R exercises, sf R practice, GIS R exercises, st_join R, choropleth R, R mapping exercises"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Spatial Analysis Exercises"
sidebar_order: 166
fr_parent: "Spatial-Data-in-R-with-sf.html"
auto_link_terms: "spatial analysis r exercises|sf r practice|gis r exercises|r mapping exercises|st_join r"
auto_link_case_sensitive: false
target_keyword: "spatial analysis R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Spatial Analysis Exercises in R: 15 Practice Problems

<p class="lead">Fifteen graded practice problems on spatial analysis in R covering reading vector data with sf, CRS handling and reprojection, geometry operations, spatial joins, and choropleth mapping. Solutions are hidden behind reveal toggles so you can attempt each problem first.</p>

```r title="Run this once before any exercise"
library(sf)
library(dplyr)
library(ggplot2)
library(tibble)
library(units)
```

## Section 1. Reading and inspecting vector data (3 problems)

### Exercise 1.1: Load the North Carolina county shapefile with st_read

**Task:** A regional planner is starting a county-level health study and needs the canonical North Carolina county boundaries loaded into R. Use `sf::st_read()` to read `nc.shp` from the `sf` package's bundled `shape/` directory (resolve the path with `system.file("shape/nc.shp", package = "sf")`), pass `quiet = TRUE` to suppress the driver banner, and save the loaded sf object to `ex_1_1`.

**Expected result:**

```
#> [1] "sf"         "data.frame"
#> [1] 100  15
```

**Difficulty:** Intermediate

[HINTS]
Vector data sits on disk as a shapefile plus sidecar files - you need a reader that turns that bundle into a spatial table held in memory.
Call st_read() on the shapefile path, resolving the path with system.file("shape/nc.shp", package = "sf"), and pass quiet = TRUE.

```r title="Your turn"
ex_1_1 <- # your code here
class(ex_1_1)
dim(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nc_path <- system.file("shape/nc.shp", package = "sf")
ex_1_1 <- st_read(nc_path, quiet = TRUE)
class(ex_1_1)
#> [1] "sf"         "data.frame"
dim(ex_1_1)
#> [1] 100  15
```

**Explanation:** `st_read()` returns an `sf` object that inherits from `data.frame`, so every dplyr verb you already know works on it. The `geometry` column is a list-column of class `sfc` carrying the polygons; the other 14 columns are the attribute table from the DBF sidecar. Passing `quiet = TRUE` keeps stdout clean inside scripts and Rmd reports. If `st_read()` cannot find the file, double-check `system.file()` returned a non-empty string.

</details>

### Exercise 1.2: Inspect feature count, geometry type, and attribute names

**Task:** Before any analysis the planner needs a one-screen audit of the shapefile: how many features, what geometry type, and which attribute columns are present. Using `ex_1_1` from the previous exercise, build a named list with elements `n`, `geom_type`, and `cols` (first 6 column names only), and save it to `ex_1_2`.

**Expected result:**

```
#> $n
#> [1] 100
#>
#> $geom_type
#> [1] MULTIPOLYGON
#> Levels: MULTIPOLYGON
#>
#> $cols
#> [1] "AREA"     "PERIMETER" "CNTY_"     "CNTY_ID"  "NAME"      "FIPS"
```

**Difficulty:** Beginner

[HINTS]
Auditing a layer means answering three separate questions - how many features, what shape type, which columns - and bundling the answers together.
Use nrow() for the count, st_geometry_type() wrapped in unique() for the type, and head(names(...), 6) for the columns, collected with list().

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- list(
  n         = nrow(ex_1_1),
  geom_type = unique(st_geometry_type(ex_1_1)),
  cols      = head(names(ex_1_1), 6)
)
ex_1_2
#> $n
#> [1] 100
#> $geom_type
#> [1] MULTIPOLYGON
#> Levels: MULTIPOLYGON
#> $cols
#> [1] "AREA"     "PERIMETER" "CNTY_"     "CNTY_ID"  "NAME"      "FIPS"
```

**Explanation:** `st_geometry_type()` returns one value per feature, so `unique()` gives you the single shared type when the layer is homogeneous. Shapefiles always store polygons as MULTIPOLYGON even when each feature is a single ring, because the format permits multi-part features. Use this audit pattern (count + geometry type + attribute preview) as the first cell of any new spatial notebook so downstream surprises (mixed geometry, missing attributes) surface immediately.

</details>

### Exercise 1.3: Build an inline sf POINT layer for store locations

**Task:** A retail planner needs the five flagship store coordinates as an sf point layer for distance analysis. Construct an inline tibble with columns `store`, `lon`, `lat` (the five rows below), then convert it to an sf object with `st_as_sf()` using `coords = c("lon", "lat")` and EPSG 4326 (WGS84). Save the result to `ex_1_3`.

```
store      lon       lat
Raleigh    -78.6382  35.7796
Charlotte  -80.8431  35.2271
Greensboro -79.7920  36.0726
Durham     -78.8986  35.9940
Asheville  -82.5515  35.5951
```

**Expected result:**

```
#> Simple feature collection with 5 features and 1 field
#> Geometry type: POINT
#> Dimension:     XY
#> Bounding box:  xmin: -82.5515 ymin: 35.2271 xmax: -78.6382 ymax: 36.0726
#> Geodetic CRS:  WGS 84
#>        store                    geometry
#> 1    Raleigh POINT (-78.6382 35.7796)
#> 2  Charlotte POINT (-80.8431 35.2271)
#> 3 Greensboro POINT (-79.792 36.0726)
#> 4     Durham POINT (-78.8986 35.994)
#> 5  Asheville POINT (-82.5515 35.5951)
```

**Difficulty:** Intermediate

[HINTS]
A plain data frame becomes spatial once you tell R which columns hold the coordinates and which datum those numbers belong to.
Pass the tibble to st_as_sf() with coords = c("lon", "lat") and crs = 4326.

```r title="Your turn"
stores <- tibble::tibble(
  store = c("Raleigh", "Charlotte", "Greensboro", "Durham", "Asheville"),
  lon   = c(-78.6382, -80.8431, -79.7920, -78.8986, -82.5515),
  lat   = c( 35.7796,  35.2271,  36.0726,  35.9940,  35.5951)
)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stores <- tibble::tibble(
  store = c("Raleigh", "Charlotte", "Greensboro", "Durham", "Asheville"),
  lon   = c(-78.6382, -80.8431, -79.7920, -78.8986, -82.5515),
  lat   = c( 35.7796,  35.2271,  36.0726,  35.9940,  35.5951)
)
ex_1_3 <- st_as_sf(stores, coords = c("lon", "lat"), crs = 4326)
ex_1_3
#> Simple feature collection with 5 features and 1 field
#> Geometry type: POINT
#> Geodetic CRS:  WGS 84
```

**Explanation:** `st_as_sf()` converts any data frame with coordinate columns to an sf object in one call. Always declare the CRS at construction time: an sf object without a CRS is a silent landmine because `st_distance()` will return planar units while you assume meters. EPSG 4326 is the WGS84 lon/lat code, the default for GPS-derived data. If the upstream system used EPSG 3857 (web mercator tiles) or a state plane code, pass that instead.

</details>

## Section 2. Coordinate reference systems and projections (3 problems)

### Exercise 2.1: Extract the EPSG code from the loaded layer

**Task:** A climatologist preparing to merge the NC layer with a NOAA grid wants the EPSG code so the join projection is unambiguous. From `ex_1_1`, extract just the numeric EPSG code using `sf::st_crs()` and the `$epsg` accessor, and save the integer to `ex_2_1`.

**Expected result:**

```
#> [1] 4267
```

**Difficulty:** Intermediate

[HINTS]
Every spatial layer carries a coordinate reference description, and a registered one has a short numeric identifier you can pull straight out.
Call st_crs() on the layer and read its $epsg element.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- st_crs(ex_1_1)$epsg
ex_2_1
#> [1] 4267
```

**Explanation:** `st_crs()` returns a `crs` object that prints a WKT block but exposes `$epsg`, `$wkt`, `$proj4string`, and `$input` accessors for programmatic use. NC's bundled shapefile is in NAD27 (EPSG 4267), a 1927 North American datum that differs from WGS84 by up to 100m, so reprojecting before any cross-dataset analysis is mandatory. When `$epsg` returns `NA`, the layer carries a custom WKT without a registered code and you must reproject by passing the full CRS object, not an integer.

</details>

### Exercise 2.2: Reproject NC counties to web mercator

**Task:** The web team wants to overlay NC counties on a Leaflet basemap, so the layer must be in EPSG 3857 (web mercator). Reproject `ex_1_1` to 3857 with `st_transform()` and save the result to `ex_2_2`. Confirm the new bounding box has values in millions, not in decimal degrees.

**Expected result:**

```
#> Simple feature collection with 100 features and 14 fields
#> Geometry type: MULTIPOLYGON
#> Dimension:     XY
#> Bounding box:  xmin: -9531829 ymin: 3858905 xmax: -8420343 ymax: 4324619
#> Projected CRS: WGS 84 / Pseudo-Mercator
```

**Difficulty:** Advanced

[HINTS]
Changing the projection recomputes every coordinate into a different reference system - it is not just a relabelling of the layer.
Use st_transform() with a target code of 3857.

```r title="Your turn"
ex_2_2 <- # your code here
print(ex_2_2, n = 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- st_transform(ex_1_1, 3857)
print(ex_2_2, n = 0)
#> Simple feature collection with 100 features and 14 fields
#> Geometry type: MULTIPOLYGON
#> Bounding box:  xmin: -9531829 ymin: 3858905 xmax: -8420343 ymax: 4324619
#> Projected CRS: WGS 84 / Pseudo-Mercator
```

**Explanation:** `st_transform()` reprojects vector geometries using PROJ under the hood. EPSG 3857 stores coordinates in meters from the equator and the prime meridian, hence the seven-digit values. Web mercator badly distorts area away from the equator (Greenland looks the size of Africa), so never use 3857 for area or distance calculations: it is a display projection only. For numerical work, pick a local projected CRS such as UTM or a state plane (Exercise 2.3).

</details>

### Exercise 2.3: Compute county areas in square kilometres using UTM 17N

**Task:** An infrastructure analyst needs each NC county's area in km² for a road-density denominator. Reproject `ex_1_1` to UTM zone 17N (EPSG 32617), compute `st_area()`, convert from m² to km² using `units::set_units()`, attach the result as a `area_km2` column, and save the top 5 counties by area to `ex_2_3`.

**Expected result:**

```
#> Simple feature collection with 5 features and 2 fields
#> Geometry type: MULTIPOLYGON
#> Projected CRS: WGS 84 / UTM zone 17N
#>      NAME       area_km2                       geometry
#> 1 Sampson 2451.730 [km^2] MULTIPOLYGON (((...))) 
#> 2  Robeson 2459.213 [km^2] MULTIPOLYGON (((...)))
#> 3   Duplin 2204.561 [km^2] MULTIPOLYGON (((...)))
#> 4 Columbus 2452.892 [km^2] MULTIPOLYGON (((...)))
#> 5    Bladen 2266.420 [km^2] MULTIPOLYGON (((...)))
```

**Difficulty:** Advanced

[HINTS]
Reliable area numbers need a low-distortion projected system first; after that it is a measurement, a unit conversion, and a ranking.
After st_transform() to 32617, compute st_area(), convert with units::set_units(..., "km^2"), then arrange() descending and take head(5).

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nc_utm <- st_transform(ex_1_1, 32617)
nc_utm$area_km2 <- units::set_units(st_area(nc_utm), "km^2")

ex_2_3 <- nc_utm |>
  dplyr::arrange(dplyr::desc(area_km2)) |>
  dplyr::select(NAME, area_km2) |>
  head(5)
ex_2_3
```

**Explanation:** `st_area()` returns a `units`-aware vector in the CRS's native units (m² for UTM). `set_units()` from the `units` package converts safely without silent factor mistakes. Using UTM zone 17N for North Carolina keeps area distortion under 0.1% across the state; using web mercator (EPSG 3857) instead would inflate northern counties by ~25%. For an irregular study area that spans multiple UTM zones, prefer an equal-area projection such as Albers (EPSG 5070 for CONUS).

</details>

## Section 3. Geometry operations (3 problems)

### Exercise 3.1: Compute county centroids and attach as new geometry

**Task:** An epidemiologist building a heatmap wants one representative point per county. Compute centroids of `ex_1_1` with `st_centroid()`, preserve the `NAME` and `BIR74` columns, and save the resulting sf POINT layer (100 features) to `ex_3_1`. Suppress the constant attribute warning by wrapping in `suppressWarnings()`.

**Expected result:**

```
#> Simple feature collection with 100 features and 2 fields
#> Geometry type: POINT
#> Geodetic CRS:  NAD27
#>          NAME BIR74              geometry
#> 1        Ashe  1091 POINT (-81.49823 36.4314)
#> 2   Alleghany   487 POINT (-81.12513 36.49111)
#> 3       Surry  3188 POINT (-80.69137 36.41252)
#> 4   Currituck   508 POINT (-76.0228 36.40562)
#> 5 Northampton  1421 POINT (-77.41046 36.43586)
#> ...
#> # 95 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Collapsing each polygon to a single representative point keeps the attribute table but swaps out the shape column.
Select NAME and BIR74 first, then apply st_centroid(), wrapping the whole call in suppressWarnings().

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- suppressWarnings(
  ex_1_1 |>
    dplyr::select(NAME, BIR74) |>
    st_centroid()
)
head(ex_3_1, 5)
```

**Explanation:** `st_centroid()` replaces each polygon's geometry with its mathematical centroid. The warning ("attribute variables are assumed to be spatially constant") fires because attributes like population are no longer area-aggregated after collapsing to a point, which is a sensible reminder but harmless here. For concave shapes (e.g., a crescent-shaped park) the centroid can fall outside the polygon: use `st_point_on_surface()` if you need a point guaranteed to lie inside.

</details>

### Exercise 3.2: Build a 30km buffer around store points and union them

**Task:** A franchise team studying market overlap wants the combined catchment area assuming each flagship covers a 30km radius. Reproject `ex_1_3` to EPSG 3857, apply `st_buffer()` with `dist = 30000` (meters), then collapse the five overlapping disks into a single multipolygon with `st_union()`. Save the resulting single-feature sfc to `ex_3_2` and report `length(ex_3_2)`.

**Expected result:**

```
#> [1] 1
#> Geometry set for 1 feature 
#> Geometry type: MULTIPOLYGON
#> Dimension:     XY
#> Projected CRS: WGS 84 / Pseudo-Mercator
```

**Difficulty:** Advanced

[HINTS]
A radius only means meters once the layer is in a projected system; the overlapping disks then need to be dissolved into a single shape.
After st_transform() to 3857, apply st_buffer(dist = 30000) and collapse the result with st_union().

```r title="Your turn"
ex_3_2 <- # your code here
length(ex_3_2)
print(ex_3_2, n = 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ex_1_3 |>
  st_transform(3857) |>
  st_buffer(dist = 30000) |>
  st_union()

length(ex_3_2)
#> [1] 1
print(ex_3_2, n = 0)
#> Geometry set for 1 feature 
#> Geometry type: MULTIPOLYGON
#> Projected CRS: WGS 84 / Pseudo-Mercator
```

**Explanation:** `st_buffer()` requires a projected CRS so the distance argument is in linear meters; calling it on a geodetic (lon/lat) layer would silently treat the distance as decimal degrees and produce wildly wrong shapes. `st_union()` dissolves overlapping geometries into a single feature, which is the right collapse when you want the total covered area rather than per-store catchments. To keep per-store catchments separate, skip the `st_union()` step.

</details>

### Exercise 3.3: Intersect two arbitrary polygons and compute the overlap area

**Task:** A land-use auditor wants to confirm that two proposed zoning polygons overlap and measure the shared area. Construct two square polygons (square A from (0,0) to (10,10); square B from (5,5) to (15,15)) as inline sfc with `st_polygon()`, set CRS to a placeholder local meter system (EPSG 32617), compute their intersection with `st_intersection()`, take the area, and save the numeric value (in m²) to `ex_3_3`.

**Expected result:**

```
#> 25 [m^2]
```

**Difficulty:** Intermediate

[HINTS]
The shared region of two polygons is itself a polygon, and once you have that shape the overlap size is just its measured area.
Compute st_intersection() of the two sfc objects, then pass the resulting geometry to st_area().

```r title="Your turn"
sq_a <- st_polygon(list(rbind(c(0,0), c(10,0), c(10,10), c(0,10), c(0,0))))
sq_b <- st_polygon(list(rbind(c(5,5), c(15,5), c(15,15), c(5,15), c(5,5))))
sq_a_sfc <- st_sfc(sq_a, crs = 32617)
sq_b_sfc <- st_sfc(sq_b, crs = 32617)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sq_a <- st_polygon(list(rbind(c(0,0), c(10,0), c(10,10), c(0,10), c(0,0))))
sq_b <- st_polygon(list(rbind(c(5,5), c(15,5), c(15,15), c(5,15), c(5,5))))
sq_a_sfc <- st_sfc(sq_a, crs = 32617)
sq_b_sfc <- st_sfc(sq_b, crs = 32617)

ex_3_3 <- st_area(st_intersection(sq_a_sfc, sq_b_sfc))
ex_3_3
#> 25 [m^2]
```

**Explanation:** Each ring must be closed (first point equals last), or `st_polygon()` raises a coercion error. `st_intersection()` returns the geometry of the overlap; if the inputs are disjoint it returns an empty geometry rather than `NULL`, which is friendlier for piped pipelines. The shared region here is a 5x5 square (area 25), exactly what `st_area()` reports. For polygon-on-polygon clipping at scale, `st_intersection()` with `prepared = TRUE` (default in sf 1.0+) uses spatial indexes for big speedups.

</details>

## Section 4. Spatial joins and queries (3 problems)

### Exercise 4.1: Spatial-join store points to the containing county

**Task:** The retail planner needs to know which NC county each flagship store sits in, so reporting can roll up to county-level demographics. Reproject `ex_1_3` to match `ex_1_1`'s CRS (NAD27, EPSG 4267) with `st_transform()`, then use `st_join()` with `join = st_within` to attach each store's containing county `NAME`. Save the resulting 5-row sf object (with columns `store`, `NAME`, geometry) to `ex_4_1`.

**Expected result:**

```
#> Simple feature collection with 5 features and 2 fields
#> Geometry type: POINT
#> Geodetic CRS:  NAD27
#>        store     NAME                   geometry
#> 1    Raleigh     Wake POINT (-78.6382 35.7796)
#> 2  Charlotte Mecklenburg POINT (-80.8431 35.2271)
#> 3 Greensboro   Guilford POINT (-79.792 36.0726)
#> 4     Durham    Durham POINT (-78.8986 35.994)
#> 5  Asheville  Buncombe POINT (-82.5515 35.5951)
```

**Difficulty:** Advanced

[HINTS]
Tagging each point with the area that contains it is a join driven by location instead of a shared key - but both layers must share a reference system first.
Reproject the points with st_transform() to 4267, then run st_join() against the counties with join = st_within.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stores_nad27 <- st_transform(ex_1_3, 4267)
ex_4_1 <- st_join(
  stores_nad27,
  ex_1_1 |> dplyr::select(NAME),
  join = st_within
)
ex_4_1
```

**Explanation:** `st_join()` is the spatial analog of a left join: every left-hand feature is preserved, and matching right-hand attributes are attached. The `join` argument controls the predicate (`st_within`, `st_intersects`, `st_contains`, `st_touches`, `st_nearest_feature` for a fallback when nothing intersects). Always reproject both sides to the same CRS first: sf 1.0+ raises an error on mismatched CRS rather than silently treating one as the other. `st_within` is the right predicate for "point inside polygon" because `st_intersects` would also match boundary touches.

</details>

### Exercise 4.2: Find NC counties within 80km of Raleigh

**Task:** An emergency-response planner wants the set of counties whose boundary falls within an 80km radius of Raleigh's downtown coordinates. Build a single Raleigh point in EPSG 3857, reproject `ex_1_1` to 3857, use `st_is_within_distance()` with `dist = 80000` to find the matching county indices, subset `ex_1_1` (or its reprojection) to those rows, and save the county NAME vector (sorted alphabetically) to `ex_4_2`.

**Expected result:**

```
#>  [1] "Chatham"   "Cumberland" "Durham"    "Franklin" 
#>  [5] "Granville" "Harnett"    "Johnston"  "Lee"      
#>  [9] "Nash"      "Orange"     "Person"    "Sampson"  
#> [13] "Vance"     "Wake"       "Warren"    "Wayne"    
#> [17] "Wilson"
```

**Difficulty:** Intermediate

[HINTS]
Finding everything near a point is a proximity test that returns which features fall inside a radius, measured in the layer's linear units.
Use st_is_within_distance() with dist = 80000 and sparse = FALSE, then subset the NAME column and sort() it.

```r title="Your turn"
raleigh <- st_sfc(st_point(c(-78.6382, 35.7796)), crs = 4326) |>
  st_transform(3857)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raleigh <- st_sfc(st_point(c(-78.6382, 35.7796)), crs = 4326) |>
  st_transform(3857)
nc_3857 <- st_transform(ex_1_1, 3857)

within_idx <- st_is_within_distance(nc_3857, raleigh, dist = 80000, sparse = FALSE)[, 1]
ex_4_2 <- sort(ex_1_1$NAME[within_idx])
ex_4_2
```

**Explanation:** `st_is_within_distance()` returns a sparse logical matrix by default; passing `sparse = FALSE` flips it to a regular logical matrix you can subset with directly. The 80km cutoff is measured edge-to-edge, not centroid-to-centroid, so a large county whose boundary clips the radius is counted even if its centroid lies outside. For a strict centroid-distance test, run `st_distance(st_centroid(nc_3857), raleigh)` and filter on the numeric result. Always reproject to a meter-based CRS first or the `dist` argument is silently mistreated.

</details>

### Exercise 4.3: Count store points per county

**Task:** The retail planner wants a county-level inventory showing how many flagship stores sit in each NC county, including counties with zero stores. Use `lengths(st_intersects(...))` (or `st_join` plus `dplyr::count`) to compute the per-county store count, attach as a `n_stores` column, filter to counties with at least one store, and save the resulting 5-row tibble (`NAME`, `n_stores`) sorted by count descending to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   NAME        n_stores
#>   <chr>          <int>
#> 1 Buncombe           1
#> 2 Durham             1
#> 3 Guilford           1
#> 4 Mecklenburg        1
#> 5 Wake               1
```

**Difficulty:** Intermediate

[HINTS]
Counting points per area means asking, for each county, how many store features land inside it, then keeping only the non-empty counties.
Take lengths(st_intersects(counties, stores)) as the n_stores column, then filter() to n_stores > 0 and arrange() descending.

```r title="Your turn"
stores_nad27 <- st_transform(ex_1_3, 4267)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stores_nad27 <- st_transform(ex_1_3, 4267)

nc_counts <- ex_1_1
nc_counts$n_stores <- lengths(st_intersects(nc_counts, stores_nad27))

ex_4_3 <- nc_counts |>
  sf::st_drop_geometry() |>
  dplyr::filter(n_stores > 0) |>
  dplyr::select(NAME, n_stores) |>
  dplyr::arrange(dplyr::desc(n_stores), NAME) |>
  tibble::as_tibble()
ex_4_3
```

**Explanation:** `st_intersects(A, B)` returns a list where element `i` holds the indices of `B` that intersect feature `i` of `A`; `lengths()` collapses that list to a per-feature count without materializing a join table. This pattern scales to millions of features because sf uses a spatial index (STRtree) automatically. `st_drop_geometry()` strips the sfc column to free memory and lets you treat the result as a pure tibble for reporting.

</details>

## Section 5. Visualization and choropleth mapping (3 problems)

### Exercise 5.1: Plot county boundaries with base R sf plot

**Task:** A workshop facilitator wants a quick on-the-fly base R plot showing only the NC county outlines with no fill, no axis ticks, and a graphite border colour. Use `plot(st_geometry(ex_1_1), col = NA, border = "grey30")` and save the function call (as a closure or simply the plot output captured by `recordPlot()`) to `ex_5_1`. The grader only requires that you produce the plot; assign `ex_5_1 <- "boundaries_plotted"` as a sentinel after plotting.

**Expected result:**

```
#> [1] "boundaries_plotted"
# Plot panel: 100 unfilled MULTIPOLYGON outlines drawn in grey30 against a
# plain background, no axes, no title.
```

**Difficulty:** Beginner

[HINTS]
A bare outline map needs only the shape column, drawn with no fill so the borders carry all the information.
Call plot() on st_geometry(ex_1_1) with col = NA and border = "grey30".

```r title="Your turn"
plot(st_geometry(ex_1_1), col = NA, border = "grey30")
ex_5_1 <- "boundaries_plotted"
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plot(st_geometry(ex_1_1), col = NA, border = "grey30")
ex_5_1 <- "boundaries_plotted"
ex_5_1
#> [1] "boundaries_plotted"
```

**Explanation:** `plot()` on a full sf object draws one panel per attribute column, which is rarely what you want. `st_geometry()` extracts the geometry alone so you get a single clean panel. `col = NA` means no fill, leaving only borders, the standard choice for showing structure before encoding any variable. For multi-layer plots (counties + points + roads), call `plot(..., add = TRUE)` on subsequent layers, or move to ggplot2 which handles layering more cleanly (next exercise).

</details>

### Exercise 5.2: Build a ggplot choropleth of 1974 birth counts

**Task:** A public-health analyst preparing a one-page county report wants a choropleth of `BIR74` (live births July 1974 to June 1978) coloured on the viridis plasma palette with a tight, readable theme. Build the plot with `ggplot2::ggplot()` plus `geom_sf(aes(fill = BIR74))` plus `scale_fill_viridis_c(option = "plasma")` plus `theme_minimal()`, and save the ggplot object to `ex_5_2`. Print it to render.

**Expected result:**

```
# A ggplot panel showing 100 NC counties filled by BIR74 (range ~248 to
# ~21,588), plasma palette (deep purple to yellow), thin white borders,
# minimal axis chrome, legend titled "BIR74" on the right.
#> $data: 100 rows of sf data
#> $layers: 1
#> $scales: 1
```

**Difficulty:** Intermediate

[HINTS]
A choropleth maps one attribute to fill colour across the polygons, drawn on a deliberately minimal canvas.
Build it with ggplot() plus geom_sf(aes(fill = BIR74)), scale_fill_viridis_c(option = "plasma"), and theme_minimal().

```r title="Your turn"
ex_5_2 <- # your code here
print(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(ex_1_1) +
  geom_sf(aes(fill = BIR74), colour = "white", linewidth = 0.1) +
  scale_fill_viridis_c(option = "plasma", name = "BIR74") +
  theme_minimal() +
  labs(title = "Live births by NC county, 1974 to 1978")

print(ex_5_2)
```

**Explanation:** `geom_sf()` automatically uses each layer's CRS and reprojects on the fly, so you do not need to pre-align layers for plotting. Continuous viridis variants (`viridis`, `plasma`, `magma`, `inferno`, `cividis`) are perceptually uniform and colourblind-safe, which matters for any report you will share. `colour = "white"` plus `linewidth = 0.1` produces airy borders that read well at print resolution. For a discrete variable, swap in `scale_fill_viridis_d()`; for diverging data, use `scale_fill_distiller(palette = "RdBu")`.

</details>

### Exercise 5.3: Overlay store points on the choropleth with annotated labels

**Task:** The communications team wants the choropleth from the previous exercise extended with the five flagship stores plotted as white-edged red dots labelled by store name. Take `ex_5_2`, add `geom_sf(data = ex_1_3, ...)` with `shape = 21`, `fill = "red"`, `colour = "white"`, `size = 3`, then add `geom_sf_text(data = ex_1_3, aes(label = store), nudge_y = 0.15, size = 3, colour = "black")`, and save the new ggplot to `ex_5_3`.

**Expected result:**

```
# Choropleth identical to ex_5_2 with five red points overlaid at the store
# locations (Raleigh, Charlotte, Greensboro, Durham, Asheville) and a small
# black label slightly above each point. CRS auto-aligned by ggplot2.
#> $layers: 3
```

**Difficulty:** Advanced

[HINTS]
An existing map object can be extended by stacking new layers that draw the store locations and their names on top.
Add a geom_sf(data = ex_1_3, shape = 21, fill = "red", ...) layer and a geom_sf_text(data = ex_1_3, aes(label = store), nudge_y = 0.15, ...) layer onto ex_5_2.

```r title="Your turn"
ex_5_3 <- # your code here
print(ex_5_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ex_5_2 +
  geom_sf(data = ex_1_3, shape = 21, fill = "red", colour = "white", size = 3) +
  geom_sf_text(data = ex_1_3, aes(label = store),
               nudge_y = 0.15, size = 3, colour = "black")

print(ex_5_3)
```

**Explanation:** Each `geom_sf()` layer carries its own data argument, and ggplot2 reprojects every layer to the first layer's CRS automatically: here `ex_1_3` is in EPSG 4326 and `ex_1_1` in EPSG 4267, but the plot renders cleanly anyway. `shape = 21` is the filled circle whose border colour is controlled separately from the fill (unlike `shape = 19` which has no border). For non-overlapping label placement on dense maps, swap `geom_sf_text()` for `ggrepel::geom_text_repel()` after extracting coordinates with `st_coordinates()`.

</details>

## What to do next

- Review the parent lesson [Spatial Data in R with sf](Spatial-Data-in-R-with-sf.html) for the foundations these exercises build on.
- For data-wrangling pipelines that feed spatial joins, try [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- For visualization fundamentals used in the choropleth section, see [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html).
- For more advanced raster and geocomputation, the upcoming Raster Analysis hub will pair naturally with this set.
