---
title: "Treemap in R with treemapify and ggplot2"
slug: "Treemap-in-R"
description: "Create treemaps in R using the treemapify package with ggplot2. Learn geom_treemap(), text labels, subgroup hierarchies, color encoding, and when treemaps beat bar charts for proportional data."
keywords: "treemap in R, treemapify R, geom_treemap ggplot2, R treemap ggplot2, hierarchical treemap R, treemapify tutorial"
auto_link_terms: "treemap in R|treemapify|geom_treemap()|R treemap ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-9
post_type: "C"
fr_parent: ggplot2-Bar-Charts.html
sidebar_section: "Visualization"
sidebar_title: "Treemap"
difficulty: "Intermediate"
---

# Treemap in R with treemapify and ggplot2

<p class="lead">A treemap divides a rectangle into tiles, each tile represents one observation, and its area encodes a numeric value. In R, the <code>treemapify</code> package brings treemaps into the ggplot2 grammar with <code>geom_treemap()</code>.</p>

## Introduction

When you have many categories and want to show their proportional sizes, a bar chart works well up to about 20-30 bars. Beyond that, the chart becomes a wall of color with labels you can barely read.

A treemap solves this by packing every category into a single rectangle. Bigger categories get bigger tiles, the proportions are immediately visible even with 50+ categories. Add a second variable as color, and you're encoding two dimensions in one compact chart.

The tradeoff: treemaps are harder to compare precisely. You can tell that one tile is roughly twice the size of another, but you can't read exact values without labels. They're a visualization for "big picture proportions," not precise comparisons.

The `treemapify` package integrates with ggplot2, so all your usual theme, scale, and annotation tools work exactly as expected.

## How do you create a basic treemap in R?

`treemapify` works as a ggplot2 extension. Load both packages, build a data frame, and use `geom_treemap()` with an `area` aesthetic.

```r
library(ggplot2)
library(treemapify)

# Simulated market share data
market_df <- data.frame(
  company  = c("Apple", "Samsung", "Xiaomi", "OPPO", "Vivo",
               "Huawei", "Motorola", "OnePlus", "Nokia", "Others"),
  sector   = c("US", "Korea", "China", "China", "China",
                "China", "US", "China", "Finland", "Various"),
  share    = c(18.8, 21.6, 12.7, 8.9, 8.5, 3.1, 3.5, 2.1, 2.4, 18.4),
  growth   = c(4.2, -2.1, 3.8, 1.5, 2.9, -8.3, 6.1, -1.2, 0.8, 1.0)
)

# Basic treemap: tile area = market share
p_basic <- ggplot(market_df, aes(area = share, fill = company)) +
  geom_treemap() +
  labs(title = "Smartphone Market Share", fill = "Company") +
  theme(legend.position = "right")

p_basic
```

The `area` aesthetic is the only required aesthetic, it controls the tile size. `fill` maps a variable to tile color. Without labels, though, you can't tell which tile belongs to which company.

**Try it:** Remove `fill = company` and instead use `fill = share` with `scale_fill_viridis_c()`. This encodes the same information (market share) as both area AND color, double encoding that makes the largest tiles stand out even more.

## How do you add text labels to a treemap?

`geom_treemap_text()` automatically resizes labels to fit inside each tile, small tiles get smaller text, large tiles get larger text. Labels that don't fit at all are hidden automatically.

```r
# Add auto-sized text labels
p_labels <- ggplot(market_df, aes(area = share, fill = company, label = company)) +
  geom_treemap() +
  geom_treemap_text(
    fontface  = "bold",
    color     = "white",
    place     = "centre",   # center text in tile
    grow      = TRUE,       # grow text to fill tile
    reflow    = TRUE        # wrap long labels
  ) +
  labs(title = "Smartphone Market Share", fill = NULL) +
  theme(legend.position = "none")

p_labels
```

`grow = TRUE` scales text up to fill the tile. `reflow = TRUE` wraps long labels across multiple lines. Set `color = "white"` for light text on colored tiles, adjust for light-colored tiles.

To also show the share value, use `label = paste0(company, "\n", share, "%")`:

**Try it:** Change `label = company` to `aes(label = paste0(company, "\n", share, "%"))` to show both the company name and percentage on each tile.

## How do you color by a second variable?

Encoding a second numeric variable as color turns a treemap into a 2D visualization: area shows one metric, color shows another.

```r
# Color by growth rate (positive = green, negative = red)
p_color <- ggplot(market_df, aes(area = share, fill = growth, label = company)) +
  geom_treemap() +
  geom_treemap_text(
    fontface = "bold", color = "white",
    place = "centre", grow = TRUE, reflow = TRUE
  ) +
  scale_fill_gradient2(
    low      = "#C62828",   # negative growth = red
    mid      = "#F5F5F5",   # zero growth = near white
    high     = "#2E7D32",   # positive growth = green
    midpoint = 0,
    name     = "YoY Growth (%)"
  ) +
  labs(
    title    = "Smartphone Market Share (area) and Growth (color)",
    subtitle = "Tile size = market share | Color = year-over-year growth"
  ) +
  theme(plot.title = element_text(face = "bold"),
        plot.subtitle = element_text(color = "grey50"))

p_color
```

At a glance: Samsung has the largest market share (biggest tile) but is shrinking (reddish). Motorola has a small share but strong growth (green). Huawei is small and contracting (deep red).

**Try it:** Replace `scale_fill_gradient2()` with `scale_fill_viridis_c(option = "plasma")` for a different continuous scale. Which scale communicates the positive/negative split more clearly?

## How do you create a hierarchical treemap with subgroups?

Real data often has a natural hierarchy, categories within sectors, products within brands. `treemapify` supports this with the `subgroup` aesthetic and `geom_treemap_subgroup_border()`.

```r
# Hierarchical treemap: subgroup by region
sub_df <- data.frame(
  company  = c("Apple", "Motorola",                           # US
               "Samsung",                                      # Korea
               "Xiaomi", "OPPO", "Vivo", "Huawei", "OnePlus", # China
               "Nokia"),                                        # Finland
  sector   = c("Americas", "Americas",
               "Asia-Pacific",
               "Asia-Pacific", "Asia-Pacific", "Asia-Pacific",
               "Asia-Pacific", "Asia-Pacific",
               "Europe"),
  share    = c(18.8, 3.5,
               21.6,
               12.7, 8.9, 8.5, 3.1, 2.1,
               2.4)
)

p_subgroup <- ggplot(sub_df,
  aes(area = share, fill = company,
      label = company, subgroup = sector)) +
  # Tiles
  geom_treemap() +
  # Subgroup borders
  geom_treemap_subgroup_border(color = "white", linewidth = 3) +
  # Company labels
  geom_treemap_text(
    fontface = "italic", color = "white",
    place = "centre", grow = TRUE, reflow = TRUE, size = 10
  ) +
  # Subgroup labels
  geom_treemap_subgroup_text(
    place    = "topleft",
    fontface = "bold",
    color    = "white",
    alpha    = 0.7,
    size     = 14,
    grow     = FALSE
  ) +
  labs(title = "Smartphone Share by Company and Region", fill = NULL) +
  theme(legend.position = "right")

p_subgroup
```

`geom_treemap_subgroup_border()` draws white borders around each region group. `geom_treemap_subgroup_text()` places region labels in the top-left corner of each subgroup area. The hierarchy is now visible: Asia-Pacific dominates, with Samsung and several Chinese brands; Americas has Apple and Motorola.

**Try it:** Add a second subgroup level with `subgroup2 = sector` (or another variable) and `geom_treemap_subgroup2_border()` to create a three-level hierarchy.

## Complete Example: Polished Treemap

```r
# Full polished treemap with dual encoding
p_final <- ggplot(market_df,
  aes(area = share, fill = growth, label = company,
      subgroup = sector)) +
  geom_treemap(color = "white", linewidth = 2) +
  geom_treemap_subgroup_border(color = "white", linewidth = 4) +
  geom_treemap_subgroup_text(
    place = "topleft", color = "white", alpha = 0.6,
    fontface = "bold", size = 16, grow = FALSE
  ) +
  geom_treemap_text(
    aes(label = paste0(company, "\n", share, "%")),
    fontface = "bold", color = "white",
    place = "centre", grow = TRUE, reflow = TRUE
  ) +
  scale_fill_gradient2(
    low = "#C62828", mid = "grey90", high = "#1B5E20",
    midpoint = 0, name = "YoY Growth (%)"
  ) +
  labs(
    title    = "Global Smartphone Market",
    subtitle = "Area = market share (%) | Color = year-over-year growth (%)"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold", size = 16),
    plot.subtitle = element_text(color = "grey50", size = 11),
    legend.position = "right"
  )

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting the area aesthetic

`geom_treemap()` requires `area`, without it, ggplot2 can't size the tiles.

```r
# Wrong: missing area
ggplot(df, aes(fill = category)) + geom_treemap()

# Correct
ggplot(df, aes(area = value, fill = category)) + geom_treemap()
```

### Mistake 2: Using treemaps for time series or comparisons

Treemaps show proportions at a single point in time. They cannot show change over time (use a line chart) or allow precise side-by-side comparison (use a bar chart). If your audience needs to read exact values, add labels, or use a bar chart instead.

### Mistake 3: Too many categories with tiny tiles

When a category's share is very small, its tile becomes too small to show a label. Fix: collapse small categories into "Others" or use a bar chart that can accommodate small differences better.

### Mistake 4: Not matching label color to fill contrast

```r
# Wrong: white labels on light tiles are invisible
geom_treemap_text(color = "white")

# Correct: use ifelse or a fixed dark color for light-colored tiles
# Or ensure your fill palette uses consistently dark colors
```

### Mistake 5: Encoding the same variable as both area and fill

Double encoding (same data as both size and color) isn't wrong per se, but it wastes a visual channel. Better: use fill for a *different* variable to give readers more information.

## Practice Exercises

### Exercise 1: GNP treemap

The `GNP` column from R's built-in `longley` dataset contains economic data. Create a treemap visualizing the `GNP` values from the `longley` dataset with year as the label.

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(treemapify)

df <- data.frame(
  year  = as.character(1947:1962),
  gnp   = longley$GNP
)

ggplot(df, aes(area = gnp, fill = gnp, label = year)) +
  geom_treemap() +
  geom_treemap_text(color = "white", place = "centre",
                    grow = TRUE, fontface = "bold") +
  scale_fill_viridis_c(option = "plasma", name = "GNP") +
  labs(title = "US GNP by Year (1947-1962)") +
  theme_minimal()
```

</details>

### Exercise 2: mtcars sector treemap

Create a hierarchical treemap using `mtcars` where:
- `area` = `hp` (horsepower)
- `subgroup` = number of cylinders (`cyl`)
- Label each car with its row name
- Color by `mpg` (fuel efficiency)

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(treemapify)

cars_df <- mtcars
cars_df$car <- rownames(mtcars)
cars_df$cyl <- paste(cars_df$cyl, "cylinders")

ggplot(cars_df, aes(area = hp, fill = mpg, label = car, subgroup = cyl)) +
  geom_treemap() +
  geom_treemap_subgroup_border(color = "white", linewidth = 3) +
  geom_treemap_subgroup_text(place = "topleft", color = "white",
                             fontface = "bold", alpha = 0.7, grow = FALSE) +
  geom_treemap_text(color = "white", place = "centre",
                    grow = TRUE, reflow = TRUE) +
  scale_fill_viridis_c(name = "MPG", option = "viridis") +
  labs(title = "Car Horsepower (area) and Fuel Efficiency (color)",
       subtitle = "Subgrouped by cylinder count") +
  theme_minimal()
```

</details>

## Summary

| Geom | Purpose |
|---|---|
| `geom_treemap()` | Draw tiles sized by `area` aesthetic |
| `geom_treemap_text()` | Auto-sized labels inside tiles |
| `geom_treemap_subgroup_border()` | Borders around subgroups |
| `geom_treemap_subgroup_text()` | Labels for subgroup areas |

| Key aesthetic | Maps to |
|---|---|
| `area` | Tile size (required) |
| `fill` | Tile color (a category or continuous variable) |
| `label` | Text label inside the tile |
| `subgroup` | Hierarchical grouping |

**When to use treemaps:**
- Many categories (20-100+) where a bar chart would be too long
- Showing proportions at a single point in time
- Two metrics to encode simultaneously (area + color)

**When to use bar charts instead:**
- Precise comparisons matter
- Fewer than 20 categories
- Time series or ranking changes over time

## FAQ

**Is treemapify on CRAN?**
Yes, `install.packages("treemapify")`. It depends on ggplot2 and ggfittext (for auto-sizing text).

**How do I control the treemap layout algorithm?**
`geom_treemap()` accepts a `layout` argument: `"squarified"` (default, best aspect ratios), `"scol"` (column-oriented), `"srow"` (row-oriented). Squarified is almost always the best choice.

**Can I add more than one level of subgroup?**
Yes, up to three levels: `subgroup`, `subgroup2`, `subgroup3`. Each level has corresponding border and text geoms (e.g., `geom_treemap_subgroup2_border()`).

**Why do some labels disappear?**
`geom_treemap_text()` drops labels that can't fit in the tile even at minimum size. For small tiles, either increase `min.size` (minimum font size before hiding) or reduce the number of categories.

**Can I use facets with treemapify?**
Yes, `facet_wrap()` and `facet_grid()` work with treemapify geoms, creating separate treemaps per facet panel. Useful for comparing structure across time periods or groups.

## References

- treemapify package documentation: wilkox.org/treemapify/
- Shneiderman B. (1992). Tree visualization with tree-maps. *ACM Transactions on Graphics*.
- Wilke C. (2019). *Fundamentals of Data Visualization*, Chapter 11: Visualizing nested proportions
- r-charts.com, Treemaps with treemapify

## Continue Learning

- **ggplot2 Bar Charts**, precise categorical comparisons when you have fewer categories
- **Pie Chart and Donut Chart in R**, part-to-whole for 3-5 categories
- **R Waffle Chart**, encode counts as grids of unit squares
