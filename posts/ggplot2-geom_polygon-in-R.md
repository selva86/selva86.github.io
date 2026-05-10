---
title: "ggplot2 geom_polygon() in R: Filled Closed Shapes"
slug: "ggplot2-geom_polygon-in-R"
description: "Use ggplot2 geom_polygon() to draw filled closed shapes from x/y coordinates in R. Covers group, fill, maps, and 5 worked examples."
keywords: "ggplot2 geom_polygon, R polygon plot, geom_polygon group, polygon fill ggplot, geom_polygon vs geom_path"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_polygon()|ggplot2 geom_polygon|polygon plot|filled closed shape|geom_polygon group"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_polygon"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# ggplot2 geom_polygon() in R: Filled Closed Shapes

<p class="lead">The <code>geom_polygon()</code> function in ggplot2 draws filled CLOSED shapes from a sequence of x and y coordinates. It is essential for map plots, custom shapes, and area fills.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_polygon()
ggplot(df, aes(x, y, group = id, fill = id)) + geom_polygon()
ggplot(map_data("world"), aes(long, lat, group = group)) + geom_polygon()
geom_path(...)                          # different: open path

[DECISION TREE: Is geom_polygon() the right tool?]
- closed filled shape: geom_polygon()
- map regions: geom_polygon (or geom_sf for sf objects)
- open path: geom_path()
- rectangle: geom_rect()
- multiple polygons: aes(group = id)

## What geom_polygon() does in one sentence

**`geom_polygon()` connects points in row order, closes the loop (last to first), and fills the interior.** Used for maps, custom shapes, and area fills.

## Syntax

**`geom_polygon(mapping = NULL, data = NULL, fill = "grey50", ...)`. Always uses row order to determine vertices.**

```r title="World map"
library(ggplot2)
library(maps)

ggplot(map_data("world"), aes(long, lat, group = group)) +
  geom_polygon(fill = "lightgrey", color = "black")
```

[TIP]
**For maps, ALWAYS pass `group = group` in aes.** Otherwise polygons connect across regions, producing visual artifacts.

## Five common patterns

### 1. Simple polygon

```r title="Triangle"
df <- tibble(x = c(0, 1, 0.5), y = c(0, 0, 1))
ggplot(df, aes(x, y)) + geom_polygon()
```

### 2. Multiple polygons via group

```r title="Two triangles"
df <- tibble(
  x = c(0,1,0.5,  2,3,2.5),
  y = c(0,0,1,    0,0,1),
  id = c("A","A","A","B","B","B")
)
ggplot(df, aes(x, y, group = id, fill = id)) +
  geom_polygon()
```

### 3. World map

```r title="Country boundaries"
ggplot(map_data("world"), aes(long, lat, group = group)) +
  geom_polygon(fill = "white", color = "grey50")
```

### 4. Choropleth via fill

```r title="Color regions by metric"
us_states <- map_data("state")
metrics <- tibble(region = unique(us_states$region), value = runif(49))

us_states |>
  left_join(metrics, by = "region") |>
  ggplot(aes(long, lat, group = group, fill = value)) +
  geom_polygon(color = "white") +
  coord_map()
```

### 5. Custom shape with alpha

```r title="Translucent polygon over points"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_polygon(data = tibble(wt = c(2,4,4,2), mpg = c(20,20,30,30)),
               fill = "yellow", alpha = 0.3)
```

[KEY INSIGHT]
**Polygons need `group` to keep boundaries separate.** Without group, ggplot connects all points into one giant polygon. Always provide group when plotting multiple regions.

## geom_polygon() vs geom_rect() vs geom_sf()

| Function | Inputs | Best for |
|---|---|---|
| `geom_polygon()` | x, y per vertex | Custom polygons / maps |
| `geom_rect()` | xmin, xmax, ymin, ymax | Rectangles |
| `geom_sf()` | sf objects | Modern map data |

For modern map work, geom_sf with the sf package is often easier than geom_polygon.

## A practical workflow

**Map plotting is geom_polygon's signature use case.**

```r
us_data <- map_data("state") |>
  left_join(state_metrics, by = "region")

ggplot(us_data, aes(long, lat, group = group, fill = value)) +
  geom_polygon(color = "white", linewidth = 0.2) +
  coord_map() +
  scale_fill_viridis_c() +
  theme_void()
```

Standard choropleth recipe.

## Common pitfalls

**Pitfall 1: forgetting group.** Without it, polygons join into one tangled mess. Always set group for maps.

**Pitfall 2: confusing with geom_path.** geom_path is OPEN; geom_polygon is CLOSED and FILLED.

[WARNING]
**`geom_polygon()` requires vertices in ORDER (clockwise or counterclockwise).** Random row order produces self-intersecting polygons.

## Try it yourself

**Try it:** Plot a simple square polygon. Save to `ex_plot`.

```r title="Your turn: a square"
df <- tibble(x = c(0, 2, 2, 0), y = c(0, 0, 2, 2))

ex_plot <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(df, aes(x, y)) +
  geom_polygon(fill = "steelblue") +
  coord_fixed()
```

**Explanation:** Four vertices in order; geom_polygon closes the loop and fills.

</details>

## Related ggplot2 functions

After mastering geom_polygon, look at:

- `geom_path()`: open path
- `geom_rect()`: rectangles
- `geom_sf()`: sf objects (maps)
- `coord_map()` / `coord_sf()`: map projections
- `geom_ribbon()`: between-curves area

## FAQ

**What does geom_polygon do in ggplot2?**

`geom_polygon()` draws filled closed shapes from x and y coordinates connected in row order.

**Why do I need group in geom_polygon?**

To distinguish multiple polygons. Without it, all points connect into one polygon. Group separates them.

**What is the difference between geom_polygon and geom_path?**

geom_polygon CLOSES the loop and FILLS. geom_path is open (no fill, no auto-close).

**Should I use geom_polygon or geom_sf for maps?**

For modern sf-based map data, geom_sf is easier. For traditional data frames from `maps` package, geom_polygon is the standard.

**Can I have holes in a polygon?**

geom_polygon does not natively support holes. Use geom_sf with sf objects for proper polygon-with-holes support.
