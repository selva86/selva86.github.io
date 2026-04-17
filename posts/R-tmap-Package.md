---
title: "R tmap Package: Thematic Maps with ggplot2-Style Grammar"
slug: "R-tmap-Package"
description: "Master R's tmap package for thematic maps. Build choropleths, bubble maps, and interactive views with tm_shape(), fewer lines than raw ggplot2."
keywords: "tmap R, tmap package R, thematic maps R, tm_shape, tm_polygons, tmap choropleth, tmap interactive map, tmap facet map, tmap bubble map, tmap vs ggplot2"
auto_link_terms: "tmap|tmap package|tm_shape()|tm_polygons()|tm_fill()|tmap_mode()|thematic maps in R|tmap choropleth"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-16"
curriculum_id: "FR-maps-3"
post_type: "FR"
fr_parent: "Choropleth-Maps-in-R.html"
difficulty: "Intermediate"
---

# R tmap Package: Thematic Maps with ggplot2-Style Grammar

<p class="lead">tmap is an R package that builds thematic maps, choropleths, bubble maps, and faceted panels, using a layered grammar modelled on ggplot2. You compose a map with tm_shape() plus layer functions like tm_polygons(), and tmap handles projections, legends, and colour scales automatically.</p>

## What does a tmap map look like in three lines of code?

Why write ten lines of ggplot2 when tmap does it in three? tmap wraps spatial plotting in a grammar that mirrors ggplot2: start with the data using tm_shape(), add layers with tm_polygons() or tm_bubbles(), then tweak legends and palettes. The payoff is a publication-ready choropleth in a single pipeline.

```r
# Load tmap — World, metro, and rivers datasets come bundled
library(tmap)

# Choropleth: life expectancy by country
tm_shape(World) +
  tm_polygons(fill = "life_exp")
#> [A world choropleth map shaded from light yellow (low life expectancy)
#>  to dark green (high life expectancy). Legend shows "life_exp" with
#>  five interval bins. Countries with missing data appear grey.]
```

That is the entire map: one tm_shape() call to set the data, one tm_polygons() call to fill countries by a column. Compare that to the ggplot2 equivalent, which needs separate calls for geom_sf(), scale_fill_viridis_c(), theme_void(), and manual legend formatting.

```r
# The same map in ggplot2 + sf — more code, same result
library(sf)
library(ggplot2)

ggplot(World) +
  geom_sf(aes(fill = life_exp), colour = "white", linewidth = 0.2) +
  scale_fill_viridis_c(option = "viridis", na.value = "grey90") +
  labs(fill = "Life\nexpectancy") +
  theme_void()
#> [Same world choropleth, but required 5 function calls instead of 2.]
```

Both maps tell the same story, but the tmap version is half the code. When you are building ten maps in a report, that difference compounds fast.

[KEY INSIGHT]
**tmap's grammar mirrors ggplot2: tm_shape() = data, tm_polygons() = layer.** If you already know ggplot2, you already know the mental model. The difference is that tmap is purpose-built for maps, so projections, legends, and spatial joins work out of the box.

**Try it:** Create a choropleth of the "HPI" (Happy Planet Index) column from the built-in World dataset.

```r
# Try it: choropleth of HPI
ex_hpi_map <- tm_shape(World) +
  tm_polygons(fill = "HPI")

# Display:
ex_hpi_map
#> Expected: a world map shaded by Happy Planet Index values
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_hpi_map <- tm_shape(World) +
  tm_polygons(fill = "HPI")
ex_hpi_map
#> [World map with countries shaded by HPI. Latin American countries
#>  like Costa Rica appear in dark green (high HPI), while many
#>  African and Middle Eastern countries appear lighter.]
```

**Explanation:** Swapping the column name in `fill` is all it takes to map a different variable. tmap picks a default palette and classification automatically.

</details>

## How do you control colours, breaks, and palettes?

The default palette works, but real-world maps need intentional colour choices. tmap classifies continuous data into intervals, quantile, jenks, equal, or pretty, and maps each interval to a colour. You control this through the `fill.scale` argument, which accepts a tm_scale_intervals() or tm_scale_continuous() call.

```r
# Quantile breaks with a blue-green palette
tm_shape(World) +
  tm_polygons(
    fill = "gdp_cap_est",
    fill.scale = tm_scale_intervals(style = "quantile", n = 5,
                                     values = "YlGnBu")
  )
#> [World map where each quantile bin holds roughly equal numbers of
#>  countries. Light yellow = lowest GDP quintile, dark blue = highest.
#>  Bins: 0-1,870 / 1,870-5,350 / 5,350-13,500 / 13,500-33,100 / 33,100-105,000]
```

Quantile breaks guarantee equal-count bins, so every colour appears on roughly the same number of countries. That makes the map look balanced, but it hides how extreme the outliers are. Now compare with Jenks natural breaks, which groups values by natural clusters in the data.

```r
# Jenks natural breaks — clusters by data gaps
tm_shape(World) +
  tm_polygons(
    fill = "gdp_cap_est",
    fill.scale = tm_scale_intervals(style = "jenks", n = 5,
                                     values = "YlGnBu")
  )
#> [Same data, different story. Jenks finds natural gaps: a large cluster
#>  of low-GDP countries in one bin, a few wealthy outliers in the top bin.
#>  The colour distribution is uneven — most countries are yellow/light green.]
```

The Jenks map reveals the skew: most countries cluster in the bottom two bins, while a handful of wealthy nations sit alone in the top bin. Which classification you choose depends on the story you want to tell.

[TIP]
**Use "jenks" for skewed data, "quantile" for balanced maps.** Jenks finds natural groupings so outliers get their own class. Quantile forces equal counts, which smooths over extremes. Neither is wrong, they answer different questions.

For categorical variables like continent or income group, tmap automatically switches to a qualitative palette.

```r
# Categorical fill — continent
tm_shape(World) +
  tm_polygons(
    fill = "continent",
    fill.scale = tm_scale_categorical(values = "Set2")
  )
#> [World map with each continent in a distinct colour from the
#>  Set2 palette: Africa green, Asia orange, Europe purple, etc.
#>  Legend lists all seven continent labels.]
```

[WARNING]
**The default "pretty" breaks can hide outliers.** With skewed data like GDP, "pretty" rounds to tidy numbers and often puts 80-90% of observations in one bin. Always check whether the default classification tells an honest story, switch to "jenks" or "quantile" if it does not.

**Try it:** Create a choropleth of "inequality" using the "Reds" palette with equal-interval breaks and 6 classes.

```r
# Try it: inequality with Reds, equal intervals
ex_ineq <- tm_shape(World) +
  tm_polygons(
    fill = "inequality",
    fill.scale = tm_scale_intervals(style = "equal", n = 6,
                                     values = "Reds")
  )

ex_ineq
#> Expected: world map in shades of red, with 6 equal-width bins
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ineq <- tm_shape(World) +
  tm_polygons(
    fill = "inequality",
    fill.scale = tm_scale_intervals(style = "equal", n = 6,
                                     values = "Reds")
  )
ex_ineq
#> [World map in six shades of red. Equal-width bins split the
#>  inequality range into even intervals. Southern African and
#>  Latin American countries tend toward darker reds.]
```

**Explanation:** `style = "equal"` divides the data range into six equal-width bins, and `values = "Reds"` applies the sequential red palette from ColorBrewer.

</details>

## How do you add a compass, scale bar, and title?

A map without context is just a coloured shape. Compass, scale bar, title, and credits tell the reader where north is, how big the regions are, and where the data came from. tmap adds each as a separate layer you stack with `+`.

```r
# Full map with cartographic elements
tm_shape(World) +
  tm_polygons(
    fill = "life_exp",
    fill.scale = tm_scale_intervals(style = "quantile", values = "viridis")
  ) +
  tm_title("Life Expectancy by Country") +
  tm_compass(position = c("left", "bottom")) +
  tm_scalebar(position = c("right", "bottom")) +
  tm_credits("Source: World Health Organization",
             position = c("left", "top"))
#> [World choropleth of life expectancy in viridis palette.
#>  Title "Life Expectancy by Country" at top. Compass rose in
#>  bottom-left. Scale bar in bottom-right showing km.
#>  Credits text "Source: WHO" in top-left.]
```

The `position` argument takes a two-element vector: horizontal ("left", "center", "right") and vertical ("top", "center", "bottom"). This gives you nine anchor points to place any element without overlap.

[TIP]
**Place the scale bar and compass in empty areas.** Oceans, deserts, or any region without data make good homes for map furniture. Overlapping the scale bar with dense data regions makes both harder to read.

Let's adjust the title styling and move elements around.

```r
# Title outside the map frame, compass in top-right
tm_shape(World) +
  tm_polygons(fill = "life_exp",
              fill.scale = tm_scale_intervals(values = "plasma")) +
  tm_title("Global Life Expectancy (2020)",
           position = c("center", "top"),
           size = 1.2) +
  tm_compass(type = "arrow", position = c("right", "top"), size = 1.5) +
  tm_scalebar(position = c("left", "bottom"), width = 15)
#> [Same choropleth with a centered title, arrow-style compass in
#>  the top-right, and a wider scale bar in the bottom-left.]
```

**Try it:** Add a compass in the top-left corner and credits reading "Source: Natural Earth" in the bottom-right to any World choropleth.

```r
# Try it: compass top-left, credits bottom-right
ex_elements <- tm_shape(World) +
  tm_polygons(fill = "economy") +
  # your code here

ex_elements
#> Expected: map with compass top-left and credits bottom-right
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_elements <- tm_shape(World) +
  tm_polygons(fill = "economy") +
  tm_compass(position = c("left", "top")) +
  tm_credits("Source: Natural Earth", position = c("right", "bottom"))
ex_elements
#> [World map coloured by economy type with a compass rose in the
#>  top-left and "Source: Natural Earth" credits in the bottom-right.]
```

**Explanation:** Each map element is its own layer added with `+`. The `position` vector controls placement using a (horizontal, vertical) pair.

</details>

## How do you switch between static and interactive maps?

Here is the single best feature of tmap: one function call turns any static map into a zoomable, pannable, clickable web map. Call tmap_mode("view") before plotting and the exact same code produces an interactive leaflet-powered map. Call tmap_mode("plot") to switch back.

```r
# Switch to interactive mode
tmap_mode("view")

# Same code as before — now interactive
tm_shape(World) +
  tm_polygons(fill = "life_exp")
#> [An interactive web map appears. You can zoom with scroll,
#>  pan by dragging, and hover over any country to see its name
#>  and life expectancy value in a popup tooltip.]
```

The code is identical to the static version. The only change is tmap_mode("view"). This means you can develop a map in static mode (fast rendering, easy export) and flip to interactive mode for exploration, without rewriting a single line.

```r
# Switch back to static mode for the rest of the tutorial
tmap_mode("plot")
#> tmap mode set to plotting
```

[KEY INSIGHT]
**One codebase, two outputs.** tmap_mode("view") swaps the rendering engine from static PNG to interactive Leaflet, same map code, two delivery formats. Build in "plot" mode, present in "view" mode.

[NOTE]
**Interactive mode produces a Leaflet widget.** In the code editor on this page, the map renders as a static snapshot. To see the full interactive experience with zoom and hover, run the code in RStudio or an R notebook.

**Try it:** Create an interactive bubble map of metropolitan populations using the built-in `metro` dataset. Use tm_bubbles() with size mapped to "pop2020".

```r
# Try it: interactive bubble map
tmap_mode("view")

ex_bubbles <- tm_shape(metro) +
  tm_bubbles(size = "pop2020")

# Display:
ex_bubbles
#> Expected: interactive map with bubbles sized by 2020 metro population

# Reset to static
tmap_mode("plot")
```

<details>
<summary>Click to reveal solution</summary>

```r
tmap_mode("view")

ex_bubbles <- tm_shape(metro) +
  tm_bubbles(size = "pop2020")
ex_bubbles
#> [Interactive map showing circles over major world cities.
#>  Tokyo, Delhi, and Shanghai have the largest bubbles.
#>  Hover reveals city name and population.]

tmap_mode("plot")
#> tmap mode set to plotting
```

**Explanation:** `metro` is a built-in sf point dataset of world metropolitan areas. tm_bubbles() maps point data as proportionally sized circles, the `size` argument controls which column drives the circle radius.

</details>

## How do you create faceted (small-multiple) maps?

Faceting splits one map into panels by a grouping variable, just like ggplot2's facet_wrap() but for maps. This is powerful for comparing patterns across regions or time periods side by side, without forcing the reader to flip between separate maps.

```r
# Faceted choropleth by continent
tm_shape(World) +
  tm_polygons(fill = "life_exp",
              fill.scale = tm_scale_intervals(values = "viridis")) +
  tm_facets(by = "continent", free.scales = FALSE)
#> [Seven panels, one per continent, each showing the same life
#>  expectancy colour scale. Europe is uniformly dark (high life
#>  expectancy), Africa shows more variation with lighter shades.]
```

By default, all facets share the same colour scale, a continent coloured dark green in one panel means the same value in every other panel. This makes cross-continent comparison fair. But sometimes each facet has a wildly different range, and a shared scale wastes most of the palette on unused intervals.

```r
# Free scales — each continent gets its own range
tm_shape(World) +
  tm_polygons(fill = "life_exp",
              fill.scale = tm_scale_intervals(values = "viridis")) +
  tm_facets(by = "continent", free.scales = TRUE)
#> [Seven panels, each with its own legend range. Europe's scale
#>  runs 72-84, Africa's runs 45-78. Now within-continent variation
#>  is visible, but cross-continent comparison is impossible.]
```

[TIP]
**Use free.scales = TRUE when the point is within-group variation, FALSE when comparing across groups.** Shared scales make comparisons fair; free scales reveal local patterns hidden by a global range.

**Try it:** Create a faceted map showing only Europe and Africa side by side, coloured by life expectancy with a shared scale.

```r
# Try it: facet Europe vs Africa
ex_facet <- tm_shape(World[World$continent %in% c("Europe", "Africa"), ]) +
  tm_polygons(fill = "life_exp",
              fill.scale = tm_scale_intervals(values = "viridis")) +
  # your code here

ex_facet
#> Expected: two panels — Europe and Africa — same colour scale
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_facet <- tm_shape(World[World$continent %in% c("Europe", "Africa"), ]) +
  tm_polygons(fill = "life_exp",
              fill.scale = tm_scale_intervals(values = "viridis")) +
  tm_facets(by = "continent", free.scales = FALSE)
ex_facet
#> [Two panels: Europe (mostly dark green, high life expectancy)
#>  and Africa (mixed, with several countries in yellow/light green).
#>  Shared scale highlights the gap between continents.]
```

**Explanation:** Subsetting `World` before mapping keeps only the two continents of interest. `free.scales = FALSE` ensures both panels use the same colour scale for honest comparison.

</details>

## How do you layer bubbles, lines, and text on a map?

Real maps rarely show a single variable. You might want country borders filled by GDP, city bubbles sized by population, and labels on the largest cities, all in one figure. tmap handles this with multiple tm_shape() calls, each introducing a new data layer.

```r
# Multi-layer: polygons + bubbles + text
tm_shape(World) +
  tm_polygons(fill = "life_exp",
              fill.scale = tm_scale_intervals(values = "YlGn")) +
tm_shape(metro) +
  tm_bubbles(size = "pop2020",
             fill = "red",
             fill_alpha = 0.5) +
  tm_text(text = "name", size = 0.5)
#> [World choropleth in yellow-green with red semi-transparent
#>  bubbles over major cities. City names appear as small labels.
#>  Tokyo, Delhi, Shanghai show as the largest bubbles.]
```

Each tm_shape() call resets the data context. The first tm_shape(World) feeds the polygon layer; the second tm_shape(metro) feeds the bubble and text layers. You can stack as many data layers as you need.

Let's clean up the labels so only the largest cities show names, and adjust the bubble sizing.

```r
# Filter labels to cities > 10 million, customise bubbles
big_cities <- metro[metro$pop2020 > 10000, ]

tm_shape(World) +
  tm_polygons(fill = "income_grp",
              fill.scale = tm_scale_categorical(values = "Set3")) +
tm_shape(big_cities) +
  tm_bubbles(size = "pop2020",
             fill = "darkblue",
             fill_alpha = 0.6,
             size.scale = tm_scale_continuous()) +
  tm_text(text = "name", size = 0.7,
          ymod = -1)
#> [World map coloured by income group with dark blue bubbles
#>  on ~30 megacities. Labels offset below each bubble show
#>  city names: Tokyo, Delhi, Shanghai, Sao Paulo, Mumbai, etc.]
```

[KEY INSIGHT]
**Every new tm_shape() call starts a fresh data layer.** You can mix sf polygons, points, and lines in one map, each layer has its own data, aesthetics, and scale. This is tmap's equivalent of stacking multiple geom_*() calls in ggplot2.

**Try it:** Overlay the built-in `rivers` dataset as blue lines on top of a world polygon base map filled in light grey.

```r
# Try it: world polygons + river lines
ex_rivers <- tm_shape(World) +
  tm_polygons(fill = "grey95") +
  # your code here: add rivers as blue lines

ex_rivers
#> Expected: world map with grey polygons and blue river lines
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rivers <- tm_shape(World) +
  tm_polygons(fill = "grey95") +
tm_shape(rivers) +
  tm_lines(col = "blue", lwd = 1)
ex_rivers
#> [World map in light grey with major rivers drawn as blue lines.
#>  The Nile, Amazon, Mississippi, Yangtze, and other major rivers
#>  are clearly visible against the grey background.]
```

**Explanation:** `rivers` is a built-in sf line dataset in tmap. Adding it as a second tm_shape() layer with tm_lines() overlays the rivers on top of the polygon base map.

</details>

## Practice Exercises

### Exercise 1: Customised GDP Choropleth with Map Elements

Build a choropleth of GDP per capita (`gdp_cap_est`) from the `World` dataset. Use Jenks natural breaks with 6 classes, the "viridis" palette, and add a title ("Global GDP per Capita"), compass (bottom-left), and scale bar (bottom-right).

```r
# Exercise 1: GDP choropleth with full cartographic elements
# Hint: combine tm_scale_intervals(style = "jenks") with tm_compass() and tm_scalebar()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_gdp_map <- tm_shape(World) +
  tm_polygons(
    fill = "gdp_cap_est",
    fill.scale = tm_scale_intervals(style = "jenks", n = 6,
                                     values = "viridis")
  ) +
  tm_title("Global GDP per Capita") +
  tm_compass(position = c("left", "bottom")) +
  tm_scalebar(position = c("right", "bottom"))
my_gdp_map
#> [World choropleth in viridis palette with Jenks breaks.
#>  Most developing nations in one or two bins (purple/blue),
#>  wealthy nations in yellow. Title at top, compass bottom-left,
#>  scale bar bottom-right.]
```

**Explanation:** Jenks breaks reveal the natural gap between wealthy and developing nations. The "viridis" palette is perceptually uniform and colourblind-safe. Map elements add professional context.

</details>

### Exercise 2: Multi-Layer Map with Megacity Labels

Create a multi-layer map that: (1) fills World polygons by life expectancy using the "YlOrRd" palette and quantile breaks, (2) overlays bubbles for cities with population > 15,000 (in thousands) from the `metro` dataset sized by `pop2020`, and (3) adds text labels for those cities. Save the full map object as `my_multi`.

```r
# Exercise 2: multi-layer map
# Hint: filter metro first, then stack three tm_shape() + layer calls

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_big_cities <- metro[metro$pop2020 > 15000, ]

my_multi <- tm_shape(World) +
  tm_polygons(
    fill = "life_exp",
    fill.scale = tm_scale_intervals(style = "quantile", values = "YlOrRd")
  ) +
tm_shape(my_big_cities) +
  tm_bubbles(size = "pop2020", fill = "steelblue", fill_alpha = 0.6) +
  tm_text(text = "name", size = 0.6, ymod = -1)
my_multi
#> [World map in yellow-orange-red gradient for life expectancy.
#>  Steel-blue bubbles mark ~20 megacities. Labels show names
#>  of the largest urban areas: Tokyo, Delhi, Shanghai, etc.]
```

**Explanation:** The first tm_shape() layer handles the choropleth base. The second tm_shape() introduces the filtered point data, which feeds both tm_bubbles() (size) and tm_text() (labels). The `ymod` argument nudges labels below the bubbles.

</details>

### Exercise 3: Faceted Comparison with Custom Title

Build a faceted map comparing HPI (Happy Planet Index) across continents. Use the "RdYlGn" palette with 5 interval classes, free scales so each continent shows its local variation, and add a descriptive title. Display only continents that have at least 5 countries in the dataset.

```r
# Exercise 3: faceted HPI comparison
# Hint: filter World by continent count, use tm_facets with free.scales = TRUE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Keep continents with 5+ countries
my_continent_counts <- table(World$continent)
my_keep <- names(my_continent_counts[my_continent_counts >= 5])
my_world_filtered <- World[World$continent %in% my_keep, ]

my_faceted <- tm_shape(my_world_filtered) +
  tm_polygons(
    fill = "HPI",
    fill.scale = tm_scale_intervals(n = 5, values = "RdYlGn")
  ) +
  tm_facets(by = "continent", free.scales = TRUE) +
  tm_title("Happy Planet Index by Continent")
my_faceted
#> [Multiple panels, each with its own HPI colour range.
#>  Latin America shows high HPI (green), while North America
#>  and Europe show moderate values. Africa varies widely.]
```

**Explanation:** Filtering by continent count removes panels with too few countries to be meaningful. `free.scales = TRUE` lets each panel use its own colour range, revealing within-continent patterns that a shared scale would flatten.

</details>

## Putting It All Together

Let's build a complete, publication-ready map from scratch: a life expectancy choropleth with megacity bubbles, cartographic elements, and a clean layout.

```r
# Complete example: publication-ready thematic map
library(tmap)

# Prepare data: filter metro to cities > 10 million
top_metros <- metro[metro$pop2020 > 10000, ]

# Build the map layer by layer
final_map <- tm_shape(World) +
  tm_polygons(
    fill = "life_exp",
    fill.scale = tm_scale_intervals(
      style = "jenks", n = 5,
      values = "viridis"
    ),
    fill.legend = tm_legend(title = "Life expectancy\n(years)")
  ) +
tm_shape(top_metros) +
  tm_bubbles(
    size = "pop2020",
    fill = "tomato",
    fill_alpha = 0.5,
    size.scale = tm_scale_continuous(),
    size.legend = tm_legend(title = "Metro population\n(thousands)")
  ) +
  tm_text(text = "name", size = 0.5, col = "black") +
tm_title("Global Life Expectancy and Megacities (2020)") +
tm_compass(type = "arrow", position = c("right", "top"), size = 1.5) +
tm_scalebar(position = c("left", "bottom"), width = 15) +
tm_credits("Data: Natural Earth & UN Population Division",
           position = c("right", "bottom"))

# Display static version
final_map
#> [A polished world map: countries in viridis palette by life
#>  expectancy (Jenks breaks). Red semi-transparent bubbles mark
#>  30+ megacities with labels. Arrow compass in top-right,
#>  scale bar in bottom-left, credits in bottom-right.
#>  Title centered at top. Two legends: one for fill, one for size.]

# Flip to interactive — same code, different output
tmap_mode("view")
final_map
#> [Same map, now interactive: zoom, pan, hover for tooltips
#>  showing country name, life expectancy, and city population.]

# Reset mode
tmap_mode("plot")
#> tmap mode set to plotting
```

This map combines five techniques from the tutorial: choropleth fill with Jenks breaks, multi-layer composition (polygons + bubbles + text), cartographic elements (compass, scale bar, credits), a descriptive title, and the static-to-interactive toggle. Each layer adds information without cluttering the map because tmap manages layout and legend placement automatically.

## Summary

| Function | Purpose | Example |
|---|---|---|
| tm_shape() | Set the spatial data for subsequent layers | `tm_shape(World)` |
| tm_polygons() | Fill and outline polygons | `tm_polygons(fill = "gdp")` |
| tm_fill() | Fill polygons (no borders) | `tm_fill(fill = "pop")` |
| tm_borders() | Draw polygon borders only | `tm_borders(col = "grey")` |
| tm_bubbles() | Proportional circle symbols | `tm_bubbles(size = "pop")` |
| tm_text() | Text labels on features | `tm_text(text = "name")` |
| tm_lines() | Draw line features | `tm_lines(col = "blue")` |
| tm_scale_intervals() | Classified breaks (jenks, quantile, equal) | `fill.scale = tm_scale_intervals(style = "jenks")` |
| tm_scale_continuous() | Unclassed smooth gradient | `fill.scale = tm_scale_continuous()` |
| tm_scale_categorical() | Qualitative palette for factors | `fill.scale = tm_scale_categorical()` |
| tm_compass() | North arrow | `tm_compass(position = c("left","top"))` |
| tm_scalebar() | Distance scale bar | `tm_scalebar(width = 15)` |
| tm_title() | Map title | `tm_title("My Map")` |
| tm_credits() | Source attribution | `tm_credits("Source: WHO")` |
| tm_facets() | Small multiples by a grouping variable | `tm_facets(by = "continent")` |
| tmap_mode() | Toggle static vs interactive output | `tmap_mode("view")` |
| tmap_save() | Export map to file (PNG, HTML) | `tmap_save(m, "map.png")` |

## References

1. Tennekes, M., tmap: Thematic Maps in R. *Journal of Statistical Software*, 84(6), 1-39 (2018). [Link](https://doi.org/10.18637/jss.v084.i06)
2. tmap official documentation. [Link](https://r-tmap.github.io/tmap/)
3. Tennekes, M. & Nowosad, J., *Elegant and Informative Maps with tmap*. [Link](https://tmap.geocompx.org/)
4. Lovelace, R., Nowosad, J. & Muenchow, J., *Geocomputation with R*, Chapter 9: Making Maps. [Link](https://r.geocompx.org/adv-map.html)
5. CRAN, tmap package reference manual. [Link](https://cran.r-project.org/package=tmap)
6. tmap GitHub repository. [Link](https://github.com/r-tmap/tmap)
7. R Graph Gallery, Create Beautiful Thematic Maps with tmap. [Link](https://r-graph-gallery.com/package/tmap.html)
8. Pebesma, E. & Bivand, R., *Spatial Data Science: With Applications in R*. [Link](https://r-spatial.org/book/)

## Continue Learning

- [Choropleth Maps in R](/Choropleth-Maps-in-R.html), Build choropleths from scratch with ggplot2 + sf, the foundational approach that tmap abstracts over
- [Spatial Data in R with sf](/Spatial-Data-in-R-with-sf.html), Read shapefiles, transform coordinate reference systems, and plot with geom_sf()
- [ggplot2 Colour Scales](/ggplot2-Colours.html), Master colour palettes, scales, and colour theory for any R visualisation
