---
title: "R Maps for US States & Counties: ggplot2 + tigris Package"
slug: "R-Maps-for-US-States-and-Counties"
description: "Build US state and county maps in R using the tigris package and ggplot2 geom_sf(). Download Census shapefiles, join data, and color counties by value."
keywords: "tigris R package, US state maps in R, county maps R, ggplot2 geom_sf, choropleth maps R, Census TIGER shapefiles, R maps tutorial"
auto_link_terms: "tigris package|US state maps|county maps in R|geom_sf|Census TIGER shapefiles|cartographic boundary files"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-05-09"
curriculum_id: "FR-maps-1"
post_type: "FR"
fr_parent: "Choropleth-Maps-in-R.html"
difficulty: "Intermediate"
---

# R Maps for US States & Counties: ggplot2 + tigris Package

<p class="lead">The tigris package downloads US Census TIGER/Line shapefiles directly into R as ready-to-plot sf objects, so you can build state and county maps with ggplot2's geom_sf() in a few lines of code, no manual file downloads or coordinate-system wrangling.</p>

## How do I get a US state or county map into R?

Most US-mapping pain in R comes from the file plumbing: finding the right shapefile, loading it correctly, getting the projection right, joining your data on a sometimes-mysterious FIPS column. The tigris package collapses all of that to one function call. You get an sf data frame back, ready for geom_sf(). This section shows the shortest path from a blank R session to a national state map you can hand to a stakeholder.

The short version is three function calls plus a plot. `states()` fetches the shapefile, `shift_geometry()` repositions Alaska and Hawaii for a compact display, and `geom_sf()` draws it. The `cb = TRUE` argument requests the cartographic (simplified) boundaries, which load fast and look clean at thematic-map scale.

```r title="National state map in three function calls"
library(tigris)
library(ggplot2)

library(scales)
us_states <- states(cb = TRUE, year = 2024) |>
  shift_geometry()

ggplot(us_states) +
  geom_sf(fill = "white", color = "grey40", linewidth = 0.2) +
  theme_void()
#> A 51-row sf data frame (50 states + DC) plotted as a national outline,
#> with Alaska tucked under the southwestern US and Hawaii beside it.
```

The result is a clean national outline with all 50 states plus DC, Alaska and Hawaii repositioned for compact display. Behind the scenes tigris downloaded a small (~1 MB) shapefile from the Census Bureau, parsed it into an sf object, and ggplot rendered it via `geom_sf()`. No file paths, no coordinate-system conversions, no `readOGR()` boilerplate.

![The tigris-to-ggplot pipeline](screenshots/R-Maps-for-US-States-and-Counties-workflow.webp)
*Figure 1: The tigris-to-ggplot pipeline. Each step is a single function call.*

[NOTE]
**tigris fetches shapefiles over HTTPS at runtime, so the code in this tutorial runs in your local RStudio rather than the in-browser sandbox.** Copy any block to RStudio (or RStudio Cloud) and run it there. Once the data is loaded the rest of the workflow is pure ggplot2, which behaves identically in both environments.

**Try it:** Replace the national call with one that fetches just the counties of Maine, then plot them.

```r title="Your turn: Maine counties"
# ex_me_counties <- counties(?, cb = TRUE) |> shift_geometry()
# ggplot(ex_me_counties) + geom_sf() + theme_void()
#> Expected: an outline of Maine showing 16 counties.
```

<details><summary>Click to reveal solution</summary>

```r title="Maine counties solution"
ex_me_counties <- counties("Maine", cb = TRUE)
ggplot(ex_me_counties) +
  geom_sf(fill = "white", color = "grey40") +
  theme_void()
#> 16 counties of Maine, drawn from the cb=TRUE simplified boundaries.
```

`counties()` accepts a state name, a 2-letter abbreviation, or a FIPS code as its first argument. With `cb = TRUE` it returns 16 simple-feature rows, one per county, each with a geometry column ready for ggplot.

</details>

## What does cb = TRUE actually do?

The `cb` argument toggles between two file families. With `cb = TRUE` you get cartographic boundary files: the Census Bureau's simplified, thematic-map-friendly shapes (file sizes in the kilobytes to low megabytes). With `cb = FALSE` you get the full TIGER/Line files: every coastal jiggle, every island, every river boundary at full resolution (file sizes ten to a hundred times larger). Comparing one state's two versions makes the tradeoff obvious.

```r title="cb=TRUE vs cb=FALSE for one state"
fl_simple <- states(cb = TRUE) |>
  subset(NAME == "Florida")
fl_full   <- states(cb = FALSE) |>
  subset(NAME == "Florida")

format(object.size(fl_simple), units = "Kb")
#> [1] "12.4 Kb"
format(object.size(fl_full), units = "Mb")
#> [1] "1.7 Mb"
```

Florida at cartographic resolution is 12 KB. Florida at full TIGER resolution is 1.7 MB, more than 100x larger, with thousands of additional vertices along its coastline. For thematic maps that show data colored by state or county, the simplified version renders in a fraction of the time and looks identical at typical screen resolutions.

[TIP]
**Default to cb = TRUE for thematic maps and dashboards.** Use cb = FALSE only when you need true coastline geometry, which is rare. The simplified version downloads faster, plots faster, and is the version every published thematic map you've seen actually uses.

**Try it:** Compare object sizes for your home state at both resolutions.

```r title="Your turn: object size compare"
# ex_state_simple <- states(cb = TRUE)  |> subset(NAME == "?")
# ex_state_full   <- states(cb = FALSE) |> subset(NAME == "?")
# format(object.size(ex_state_simple), units = "Kb")
# format(object.size(ex_state_full),   units = "Kb")
#> Expected: full version is roughly 50x to 200x larger.
```

<details><summary>Click to reveal solution</summary>

```r title="Object size compare solution"
ex_state_simple <- states(cb = TRUE)  |> subset(NAME == "California")
ex_state_full   <- states(cb = FALSE) |> subset(NAME == "California")
format(object.size(ex_state_simple), units = "Kb")
#> [1] "9.8 Kb"
format(object.size(ex_state_full),   units = "Kb")
#> [1] "1432 Kb"
```

California's full version is about 150x larger than its cartographic version. The visual difference at a national map scale is essentially zero. The compute cost difference is enormous.

</details>

## How do I color counties by a value (choropleth)?

A choropleth map colors each region by a number. The recipe is always the same: get the sf object, get a tabular data frame keyed by the same identifier (usually GEOID, the FIPS code), `left_join()` them, and pass the value column to `geom_sf(aes(fill = ...))`. tigris and dplyr cooperate cleanly because an sf object is just a data frame with an extra geometry column.

```r title="County choropleth for one state"
library(dplyr)

ny_counties <- counties("NY", cb = TRUE)

# A small fake metric, one row per NY county
set.seed(7)
ny_data <- data.frame(
  GEOID  = ny_counties$GEOID,
  metric = round(runif(nrow(ny_counties), min = 0, max = 100), 1)
)

ny_joined <- ny_counties |>
  left_join(ny_data, by = "GEOID")

ggplot(ny_joined) +
  geom_sf(aes(fill = metric), color = "white", linewidth = 0.1) +
  scale_fill_viridis_c(option = "magma") +
  theme_void()
#> 62 NY counties, each filled by its random metric value, with a viridis legend.
```

The join lines up because both data frames carry the same `GEOID` column (the 5-digit county FIPS code). After joining, the sf object has a new `metric` column the fill aesthetic can read. The viridis palette is the standard choice for thematic maps because it stays readable in grayscale and for color-blind viewers.

[KEY INSIGHT]
**An sf object is just a data frame with a geometry column, so every dplyr verb works on it.** `left_join()`, `filter()`, `mutate()`, `select()`, `summarise()` all behave normally. The geometry column tags along automatically and ggplot draws whatever ends up in the result.

**Try it:** Swap the fill in the example for a different column, for example a categorical bin like `metric_bin <- cut(metric, 4)`.

```r title="Your turn: categorical fill"
# ex_fill_var <- cut(?, breaks = ?)
# ggplot(ny_joined |> mutate(bin = ex_fill_var)) +
#   geom_sf(aes(fill = bin)) + theme_void()
#> Expected: 4 discrete fill colors instead of a continuous gradient.
```

<details><summary>Click to reveal solution</summary>

```r title="Categorical fill solution"
ny_joined |>
  mutate(metric_bin = cut(metric, breaks = c(0, 25, 50, 75, 100))) |>
  ggplot() +
  geom_sf(aes(fill = metric_bin), color = "white", linewidth = 0.1) +
  scale_fill_viridis_d(option = "magma") +
  theme_void()
#> Same map, but the legend shows 4 named ranges instead of a continuous bar.
```

Switching from `scale_fill_viridis_c` (continuous) to `scale_fill_viridis_d` (discrete) handles the categorical bins. `cut()` turns a numeric column into a factor with named breakpoints, useful when stakeholders prefer discrete categories over a smooth gradient.

</details>

## How do I filter to one state's counties or a region?

Three patterns cover almost every use case. First, ask tigris for one state directly with `counties("state")`. Second, fetch all counties once and use `dplyr::filter()` on `STATEFP` (the 2-digit state FIPS code) to slice out any region. Third, combine the same fetch with a hand-picked vector of state codes for arbitrary multi-state regions like New England or the Mountain West.

```r title="Filter all counties to a region"
all_counties <- counties(cb = TRUE, year = 2024)

# Northeast: NY (36), NJ (34), CT (09), MA (25), RI (44), VT (50), NH (33), ME (23), PA (42)
ne_codes <- c("36", "34", "09", "25", "44", "50", "33", "23", "42")
ne_counties <- all_counties |>
  filter(STATEFP %in% ne_codes)

ggplot(ne_counties) +
  geom_sf(fill = "white", color = "grey40", linewidth = 0.15) +
  theme_void()
#> About 200 counties across the 9 Northeast states.
```

`STATEFP` is the standard 2-character state FIPS code Census uses everywhere. Once you have one nationwide pull, you can re-slice to any geographic group without re-fetching. For batch work this is faster than calling `counties()` once per state.

**Try it:** Filter to the Mountain West instead (CO=08, UT=49, WY=56, MT=30, ID=16, NV=32).

```r title="Your turn: Mountain West"
# ex_states   <- c("?", "?", "?", "?", "?", "?")
# ex_filtered <- all_counties |> filter(STATEFP %in% ex_states)
# ggplot(ex_filtered) + geom_sf() + theme_void()
#> Expected: counties of CO, UT, WY, MT, ID, NV.
```

<details><summary>Click to reveal solution</summary>

```r title="Mountain West solution"
ex_states   <- c("08", "49", "56", "30", "16", "32")
ex_filtered <- all_counties |> filter(STATEFP %in% ex_states)
ggplot(ex_filtered) +
  geom_sf(fill = "white", color = "grey40", linewidth = 0.15) +
  theme_void()
#> Counties of Colorado, Utah, Wyoming, Montana, Idaho, and Nevada.
```

The same recipe extends to any custom region. Census FIPS codes never change, so you can hard-code regional vectors once and reuse them across analyses.

</details>

## What about Alaska, Hawaii, and projection gotchas?

Two things trip up most US-map newcomers. First, tigris returns geometries in NAD83 (EPSG:4269), a longitude-latitude system that produces a slightly stretched-looking national map and places Alaska and Hawaii thousands of miles from the lower 48. Second, you almost always want to relocate Alaska and Hawaii into a compact inset so they sit beneath the southwestern US. tigris ships `shift_geometry()` for exactly this purpose.

```r title="shift_geometry repositions Alaska and Hawaii"
shifted <- us_states |>
  shift_geometry(position = "below", preserve_area = TRUE)

ggplot(shifted) +
  geom_sf(fill = "white", color = "grey40", linewidth = 0.2) +
  theme_void()
#> Same 51 states, but AK is tucked under the SW US and HI is beside it.
```

`shift_geometry()` rescales and translates Alaska and Hawaii into a standard inset position. With `preserve_area = TRUE` it keeps the relative areas roughly correct (Alaska is still much larger than any lower-48 state). The `position = "below"` option places both insets beneath the contiguous US; `"outside"` puts AK upper-left and HI lower-left, matching most published US maps.

[WARNING]
**shift_geometry() rescales Alaska and Hawaii for visual clarity. Never use the result for area or distance computation.** If you need true area (e.g., for population density), compute area on the original geometry first, then call shift_geometry only on the data you intend to plot.

**Try it:** Render the same data with and without shift_geometry, side by side, to feel the difference.

```r title="Your turn: with and without shift"
# ex_no_shift <- states(cb = TRUE)
# ex_shifted  <- shift_geometry(ex_no_shift)
# Plot each separately and compare.
#> Expected: the no-shift version places Alaska off the upper-left and Hawaii far southwest;
#>           the shifted version is compact.
```

<details><summary>Click to reveal solution</summary>

```r title="With and without shift solution"
ex_no_shift <- states(cb = TRUE)
ex_shifted  <- shift_geometry(ex_no_shift)

ggplot(ex_no_shift) + geom_sf() + theme_void() +
  ggtitle("Default geometry: AK far upper-left, HI off the SW")

ggplot(ex_shifted) + geom_sf() + theme_void() +
  ggtitle("After shift_geometry: compact inset")
```

The default geometry stretches the plot frame from far western Alaska to Puerto Rico, leaving a tiny lower-48 in the middle. Shifted geometry compresses everything into a familiar magazine-style inset.

</details>

## Practice Exercises

### Exercise 1: One-state county choropleth

Pick any state. Build a small synthetic dataset with one numeric column per county. Join it to the county sf object and produce a polished choropleth with a viridis fill, white county boundaries, and `theme_void()`.

```r title="Exercise 1 starter"
# 1) get counties for your state with counties(state, cb = TRUE)
# 2) build a data.frame with GEOID + a numeric column
# 3) left_join on GEOID
# 4) ggplot + geom_sf(aes(fill = your_column))
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_state <- "TX"
my_counties <- counties(my_state, cb = TRUE)
set.seed(11)
my_county_data <- data.frame(
  GEOID = my_counties$GEOID,
  unemployment = round(runif(nrow(my_counties), 2, 9), 2)
)
my_joined <- my_counties |>
  left_join(my_county_data, by = "GEOID")
my_map <- ggplot(my_joined) +
  geom_sf(aes(fill = unemployment), color = "white", linewidth = 0.1) +
  scale_fill_viridis_c(option = "viridis") +
  theme_void() +
  labs(title = "Synthetic county-level unemployment, TX", fill = "Rate (%)")
my_map
#> Texas counties colored by simulated unemployment rates.
```

The recipe is generic, swap "TX" for any state and the column name for any metric.

</details>

### Exercise 2: National choropleth with shift_geometry

Build a national map at the state level with a simulated value. Use `shift_geometry()`, a viridis fill, and a polished theme with a caption.

```r title="Exercise 2 starter"
# 1) states(cb = TRUE) |> shift_geometry()
# 2) Build a state-level data.frame keyed by GEOID
# 3) left_join + ggplot + scale_fill_viridis_c + theme_void
# 4) Add labs(title = ..., caption = "Simulated data")
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
nat_states <- states(cb = TRUE) |> shift_geometry()
set.seed(101)
nat_data <- data.frame(
  GEOID = nat_states$GEOID,
  median_income = round(runif(nrow(nat_states), 45000, 90000))
)
nat_joined <- nat_states |>
  left_join(nat_data, by = "GEOID")
nat_map <- ggplot(nat_joined) +
  geom_sf(aes(fill = median_income), color = "white", linewidth = 0.1) +
  scale_fill_viridis_c(option = "plasma", labels = scales::dollar_format()) +
  theme_void() +
  labs(title = "Simulated median household income by state",
       caption = "Source: simulated, for demonstration only",
       fill = NULL)
nat_map
#> National map with AK and HI tucked into the inset, states colored by simulated income.
```

The combination of shift_geometry, a viridis palette, and `scale_fill_viridis_c(labels = scales::dollar_format())` is the workhorse template for client-ready national maps.

</details>

## Complete Example: Population Density Visualization

Combine base R's built-in `state.area` and `state.name` vectors with tigris to build a real population-density map. The point is to show how external state-level data joins cleanly into the tigris workflow.

```r title="National population-density choropleth"
# Fake-but-realistic: built-in state.area is in square miles
dens_data <- data.frame(
  NAME = state.name,
  pop  = round(runif(50, 0.5e6, 4e7)),
  area = state.area
) |>
  mutate(density = pop / area)

us_states_full <- states(cb = TRUE) |> shift_geometry()

dens_joined <- us_states_full |>
  left_join(dens_data, by = "NAME")

dens_map <- ggplot(dens_joined) +
  geom_sf(aes(fill = density), color = "white", linewidth = 0.1) +
  scale_fill_viridis_c(option = "magma", trans = "log10",
                       labels = scales::label_number(),
                       na.value = "grey85") +
  theme_void() +
  labs(title = "Simulated population density (people per sq. mile, log scale)",
       caption = "Population values simulated; areas from base R state.area",
       fill = "Density")
dens_map
#> A national map (with AK and HI inset) colored by log-scaled density.
#> DC and territories without a base R area get the na.value grey.
```

Two real-world details show up here. First, the join key is `NAME`, not `GEOID`, because the base R vectors use full state names. tigris exposes both columns so you can pick whichever matches your external data. Second, density spans a couple orders of magnitude (rural Alaska to dense New Jersey), so a log-transformed fill scale is essential for a readable map.

## Summary

| Function | Returns | When to use |
|---|---|---|
| `states(cb = TRUE)` | sf with 50 states + DC + territories | National maps |
| `counties(state, cb = TRUE)` | sf with one state's counties | Single-state choropleth |
| `counties(cb = TRUE)` | sf with all 3,000+ US counties | Multi-state regions, custom slices |
| `shift_geometry()` | Same sf with AK/HI repositioned | Compact national display (always use for national thematic maps) |
| `cb = TRUE` | Simplified cartographic boundaries | Default for thematic maps (fast, small) |
| `cb = FALSE` | Full TIGER/Line resolution | Coastline-accurate work only |

## References

1. tigris on GitHub: [github.com/walkerke/tigris](https://github.com/walkerke/tigris). Source code, vignettes, and changelog.
2. Walker, K. *Analyzing US Census Data: Methods, Maps, and Models in R*, 2023. [walker-data.com/census-r](https://walker-data.com/census-r). Chapter 5 covers tigris workflows.
3. Wickham, H., Navarro, D., Pedersen, T. L. *ggplot2: Elegant Graphics for Data Analysis*, 3rd ed. Chapter 6 on Maps. [ggplot2-book.org/maps.html](https://ggplot2-book.org/maps.html).
4. Pebesma, E. "Simple Features for R: Standardized Support for Spatial Vector Data." *R Journal* 10(1), 2018. [journal.r-project.org/archive/2018/RJ-2018-009](https://journal.r-project.org/archive/2018/RJ-2018-009/).
5. US Census Bureau. *TIGER/Line Shapefiles Technical Documentation*. [census.gov/programs-surveys/geography](https://www.census.gov/programs-surveys/geography.html).

## Continue Learning

- [Choropleth Maps in R](Choropleth-Maps-in-R.html), the parent post that covers ggplot2 + sf choropleth recipes from first principles.
- [Spatial Data in R with sf](Spatial-Data-in-R-with-sf.html), the foundations of simple features that tigris builds on.
- [3D Maps in R](3D-Maps-in-R.html), the next step when 2D thematic mapping is not enough.
