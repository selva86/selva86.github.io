---
title: "Heatmap in R: Build and Customize with ggplot2 geom_tile()"
slug: "Heatmap-in-R"
description: "Create heatmaps in R with ggplot2's geom_tile(). Learn to reshape data, apply color scales, add text labels, cluster rows and columns, and avoid common heatmap mistakes."
keywords: "heatmap in R, geom_tile ggplot2, ggplot2 heatmap, correlation heatmap R, R heatmap color scale, pivot_longer heatmap R"
auto_link_terms: "heatmap in R|geom_tile()|ggplot2 heatmap|correlation heatmap R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-char-3"
post_type: "FR"
fr_parent: "ggplot2-Scatter-Plots.html"
---

# Heatmap in R: Build and Customize with ggplot2 geom_tile()

<p class="lead">A heatmap encodes a numeric matrix as a grid of colored tiles — rows on one axis, columns on the other, and fill color encoding the value at each cell. In ggplot2, <code>geom_tile()</code> builds heatmaps with the same grammar as every other chart type.</p>

## Introduction

Heatmaps are the right tool when you have a two-dimensional grid of values and you want readers to spot patterns — which cells are high, which are low, and where the extremes cluster. Common applications include correlation matrices (which variables move together?), time-by-category grids (which months had the highest sales in each region?), and gene expression matrices in bioinformatics.

The ggplot2 approach requires your data in long (tidy) format: one row per cell, with columns for the row identifier, the column identifier, and the fill value. If your data starts as a wide matrix (rows = observations, columns = variables), you need to reshape it first — and `tidyr::pivot_longer()` handles that in one line.

In this tutorial you will learn:

- How `geom_tile()` builds a heatmap from long-format data
- How to reshape wide data into long format with `pivot_longer()`
- How to choose sequential vs. diverging color scales
- How to add numeric labels inside each tile
- How to clean up the theme for a polished final chart

## How Does geom_tile() Build a Heatmap?

`geom_tile()` draws a rectangle at every combination of x and y, filled by the `fill` aesthetic. If your data has one row for each (x, y) pair, you get a complete grid with no gaps.

Let's start with a direct demonstration using the `airquality` dataset — monthly averages of ozone, temperature, and wind, restructured as a grid:

```r
library(ggplot2)
library(tidyr)

# Monthly average of three air quality variables
# airquality: Month (5-9), Ozone, Solar.R, Wind, Temp
aq_clean <- na.omit(airquality)
aq_avg <- aggregate(
  cbind(Ozone, Wind, Temp) ~ Month,
  data = aq_clean,
  FUN  = mean
)
aq_avg$Month <- month.abb[aq_avg$Month]

# Basic heatmap: one tile per (Month, Variable) pair
aq_long <- pivot_longer(aq_avg, cols = -Month,
                         names_to = "Variable", values_to = "Value")

p_basic <- ggplot(aq_long, aes(x = Month, y = Variable, fill = Value)) +
  geom_tile(color = "white", linewidth = 0.5) +
  labs(
    title = "Air Quality Monthly Averages (NYC, 1973)",
    x     = NULL,
    y     = NULL,
    fill  = "Value"
  )

p_basic
```

Each tile's color encodes the value at that (Month, Variable) intersection. The default color scale (grey-to-dark-blue) shows higher values as darker — but we'll improve that shortly.

`color = "white"` and `linewidth = 0.5` add thin white borders between tiles — making the grid structure visible and preventing adjacent colors from blending visually.

> **KEY INSIGHT:** `geom_tile()` expects your data in long format — one row per cell. If you pass a wide matrix directly to `ggplot()`, you'll get a chart with only one tile per row (one y-level per observation). Always reshape to long format first.

**Try it:** Remove `color = "white"` from `geom_tile()`. How does the heatmap look without tile borders?

```r
ex_no_border <- ggplot(aq_long, aes(x = Month, y = Variable, fill = Value)) +
  geom_tile(linewidth = 0) +
  labs(x = NULL, y = NULL)

ex_no_border
```

## How Do You Reshape Wide Data to Long Format?

Most real-world data starts wide — each variable is its own column, each row is an observation. A correlation matrix is a classic example: the row and column names are the same set of variables.

`pivot_longer()` from `tidyr` converts wide to long with three key arguments: `cols` (which columns to pivot), `names_to` (the new column that will hold the old column names), and `values_to` (the new column that will hold the values).

```r
# Correlation matrix of mtcars numeric variables
cor_mat <- round(cor(mtcars), 2)

# Convert to long format: one row per (Var1, Var2) pair
cor_long <- as.data.frame(as.table(cor_mat))
names(cor_long) <- c("Var1", "Var2", "Correlation")

head(cor_long)
```

`as.table()` on a matrix produces a three-column data frame automatically — a shortcut that avoids `pivot_longer()` for square matrices. For non-square wide data (e.g., a month × region sales grid), use:

```r
# For general wide-to-long: pivot_longer
# sales_long <- pivot_longer(
#   wide_df,
#   cols      = -region,       # all columns except the ID column
#   names_to  = "month",
#   values_to = "sales"
# )
```

> **TIP:** For a correlation matrix specifically, `as.data.frame(as.table(cor(df)))` is the fastest path to a three-column long format. For any other wide matrix, `pivot_longer()` is the standard tool.

**Try it:** Compute the correlation matrix of just the numeric columns in `iris` (exclude `Species`). Convert it to long format using `as.data.frame(as.table(cor(...)))`.

```r
iris_num  <- iris[, -5]  # remove Species column
cor_iris  <- round(cor(iris_num), 2)
ex_iris_long <- as.data.frame(as.table(cor_iris))
names(ex_iris_long) <- c("Var1", "Var2", "Corr")
head(ex_iris_long)
```

## How Do You Choose the Right Color Scale for a Heatmap?

Color scale choice is critical for heatmaps. The wrong scale can hide patterns or create false impressions of direction.

**Use a sequential scale** when your values run in one direction (all positive, or all negative) with no meaningful midpoint:

```r
# Sequential: airquality temperature month × day
air_temp <- aggregate(Temp ~ Month + Day, data = airquality, FUN = mean)
air_temp$Month <- factor(month.abb[air_temp$Month],
                          levels = month.abb[5:9])

p_seq <- ggplot(air_temp, aes(x = Day, y = Month, fill = Temp)) +
  geom_tile(color = "white", linewidth = 0.3) +
  scale_fill_viridis_c(
    option = "plasma",
    name   = "Temp (°F)"
  ) +
  labs(
    title = "Sequential: Daily Temperature by Month (NYC, 1973)",
    x     = "Day of Month",
    y     = NULL
  ) +
  theme_minimal() +
  theme(panel.grid = element_blank())

p_seq
```

**Use a diverging scale** when your values have a meaningful midpoint — most commonly zero. Correlations range from -1 to +1 with 0 as the neutral midpoint:

```r
# Diverging: correlation matrix of mtcars
p_corr <- ggplot(cor_long, aes(x = Var1, y = Var2, fill = Correlation)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_gradient2(
    low      = "#4393c3",   # blue for negative
    mid      = "white",     # white at zero
    high     = "#d6604d",   # red for positive
    midpoint = 0,
    limits   = c(-1, 1),
    name     = "Corr"
  ) +
  labs(
    title = "Diverging: mtcars Correlation Matrix",
    x     = NULL,
    y     = NULL
  ) +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    panel.grid  = element_blank()
  )

p_corr
```

`midpoint = 0` centers the white color exactly at zero. `limits = c(-1, 1)` forces the color scale to span the full correlation range symmetrically — without this, ggplot2 sets the limits to the data's actual range, which may not be ±1 and will offset the midpoint.

> **WARNING:** Never use a sequential (single-direction) color scale for correlation or any data with a meaningful zero. A sequential scale from white to blue makes -0.9 look similar to +0.1 (both pale), completely obscuring the sign of the relationship.

**Try it:** Change the `low` and `high` colors in `scale_fill_gradient2()` to `"#1a9850"` (green) and `"#d73027"` (red). Does the correlation matrix still read clearly?

```r
ex_green_red <- ggplot(cor_long, aes(x = Var1, y = Var2, fill = Correlation)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_gradient2(low = "#1a9850", mid = "white",
                        high = "#d73027", midpoint = 0, limits = c(-1, 1)) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1),
        panel.grid = element_blank())

ex_green_red
```

## How Do You Add Text Labels Inside Heatmap Tiles?

When your grid is small enough (typically under 10×10 cells), printing the exact value inside each tile lets readers get precise numbers without estimating from the color scale.

```r
# Correlation heatmap with labels inside tiles
p_label <- ggplot(cor_long, aes(x = Var1, y = Var2, fill = Correlation)) +
  geom_tile(color = "white", linewidth = 0.5) +
  geom_text(
    aes(label = sprintf("%.2f", Correlation),
        color  = abs(Correlation) > 0.5),  # white text on dark tiles
    size = 2.8
  ) +
  scale_fill_gradient2(
    low = "#4393c3", mid = "white", high = "#d6604d",
    midpoint = 0, limits = c(-1, 1), name = "Corr"
  ) +
  scale_color_manual(
    values = c("FALSE" = "grey20", "TRUE" = "white"),
    guide  = "none"
  ) +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    panel.grid  = element_blank()
  ) +
  labs(
    title = "Correlation matrix with value labels",
    x = NULL, y = NULL
  )

p_label
```

The `color = abs(Correlation) > 0.5` trick switches label color from dark grey (on pale tiles) to white (on strongly colored tiles) — ensuring labels are always readable regardless of tile intensity. `scale_color_manual()` with `guide = "none"` maps `TRUE/FALSE` to `"white"/"grey20"` without adding a legend.

`sprintf("%.2f", Correlation)` formats each number to exactly 2 decimal places — consistent with correlation coefficient conventions.

> **TIP:** For large heatmaps (20×20+), text labels become too small to read and clutter the chart. Switch to a clean tile-only heatmap with a well-chosen color scale, relying on interactive tooltips (via `plotly::ggplotly()`) when readers need exact values.

**Try it:** Change `size = 2.8` to `size = 4`. Do the labels fit inside the tiles, or do they overflow?

```r
ex_larger_labels <- p_label +
  geom_text(
    data = cor_long,
    aes(x = Var1, y = Var2, label = sprintf("%.2f", Correlation)),
    size = 4, color = "grey20"
  )
# Note: this will overplot - just to see the size effect
ex_larger_labels
```

## Common Mistakes and How to Fix Them

### Mistake 1: Passing wide-format data directly to geom_tile()

❌ `ggplot(wide_matrix, aes(x = ?, y = ?, fill = ?))` — a wide matrix doesn't have separate row/column/value columns for ggplot2 to use.

✅ Convert to long format first: `pivot_longer()` for general wide data, or `as.data.frame(as.table(mat))` for square matrices.

### Mistake 2: Using a sequential color scale for diverging data

❌ Using `scale_fill_viridis_c()` on a correlation matrix. Negative correlations (-0.8) and near-zero ones (0.05) both appear pale/cool — hiding the sign difference.

✅ Use `scale_fill_gradient2(low, mid, high, midpoint = 0)` for any data centered at zero. Always set `limits` to be symmetric: `limits = c(-1, 1)` for correlations.

### Mistake 3: Forgetting limits on the diverging scale

❌ Without `limits = c(-1, 1)`, ggplot2 sets the scale limits to the data's actual range. If your highest correlation is 0.8, the midpoint (white) will appear at 0.4, not 0 — making moderate positive correlations look neutral.

✅ Always set `limits = c(-max_abs, max_abs)` for diverging scales to keep the midpoint at the true zero.

### Mistake 4: Grid lines showing through tile borders

❌ `theme_minimal()` includes a grid by default — the grid lines sit *behind* the tiles but show through the `color = "white"` tile borders, creating a double-line effect.

✅ Add `theme(panel.grid = element_blank())` to remove the grid entirely. The tile borders are enough structure.

### Mistake 5: Unordered axes hiding patterns

❌ Default alphabetical variable ordering on both axes makes it hard to see whether correlated variables cluster together.

✅ Reorder axes by hierarchical clustering: `hclust(dist(cor_mat))` gives a dendrogram order that groups similar variables together. Apply with `scale_x_discrete(limits = ordered_vars)`.

## Practice Exercises

### Exercise 1: Monthly airline passenger heatmap

Using the `AirPassengers` time series, convert to a data frame with `month` and `year` columns. Create a heatmap of passenger count by month (y) and year (x) using a sequential viridis palette. Is there a clear seasonal pattern?

```r
ap_df <- data.frame(
  month = factor(rep(month.abb, 12), levels = month.abb),
  year  = factor(rep(1949:1960, each = 12)),
  n     = as.numeric(AirPassengers)
)

# Your heatmap code:
# ggplot(ap_df, aes(x = year, y = month, fill = n)) +
#   geom_tile(color = "white", linewidth = 0.3) +
#   scale_fill_viridis_c(option = "plasma", name = "Passengers") +
#   labs(title = "Monthly Airline Passengers (1949-1960)", x = NULL, y = NULL)
```

### Exercise 2: Labeled iris correlation heatmap

Compute the correlation matrix for all four numeric columns of `iris`. Convert to long format and create a labeled heatmap with:
- Diverging color scale (blue-white-red)
- Correlation values as text inside each tile
- Rotated x-axis labels
- No grid lines

```r
# Starter code
iris_cor <- round(cor(iris[, -5]), 2)
iris_long <- as.data.frame(as.table(iris_cor))
names(iris_long) <- c("Var1", "Var2", "Corr")

# Your heatmap code:
# ggplot(iris_long, aes(x = Var1, y = Var2, fill = Corr)) + ...
```

## Complete Example

A complete, publication-ready correlation heatmap of `mtcars` with value labels, clean theme, and title:

```r
# Full correlation heatmap pipeline
numeric_vars <- mtcars[, c("mpg","cyl","disp","hp","wt","qsec","gear")]
cor_final <- round(cor(numeric_vars), 2)
cor_final_long <- as.data.frame(as.table(cor_final))
names(cor_final_long) <- c("Var1", "Var2", "Corr")

p_final <- ggplot(cor_final_long, aes(x = Var1, y = Var2, fill = Corr)) +
  geom_tile(color = "white", linewidth = 0.8) +
  geom_text(
    aes(label  = sprintf("%.2f", Corr),
        color  = abs(Corr) > 0.5),
    size     = 3.5,
    fontface = "bold"
  ) +
  scale_fill_gradient2(
    low      = "#4393c3",
    mid      = "white",
    high     = "#d6604d",
    midpoint = 0,
    limits   = c(-1, 1),
    name     = "Correlation"
  ) +
  scale_color_manual(
    values = c("FALSE" = "grey30", "TRUE" = "white"),
    guide  = "none"
  ) +
  scale_x_discrete(position = "top") +   # column labels at top
  labs(
    title    = "mtcars: Variable Correlation Matrix",
    subtitle = "Blue = negative correlation | Red = positive | Values ≥ |0.5| in white",
    x        = NULL,
    y        = NULL,
    caption  = "Source: R datasets::mtcars"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title      = element_text(face = "bold", size = 14),
    plot.subtitle   = element_text(color = "grey50", size = 9),
    axis.text.x     = element_text(angle = 0, hjust = 0.5),
    panel.grid      = element_blank(),
    legend.position = "right",
    legend.key.height = unit(1.5, "cm")
  )

p_final
```

`scale_x_discrete(position = "top")` moves the x-axis labels to the top of the chart — the standard convention for correlation matrices, matching how most statistical software formats them.

## Summary

| Task | Code |
|---|---|
| Basic heatmap | `geom_tile(aes(fill = value))` |
| Tile borders | `geom_tile(color = "white", linewidth = 0.5)` |
| Sequential color | `scale_fill_viridis_c(option = "plasma")` |
| Diverging color | `scale_fill_gradient2(low, mid, high, midpoint = 0, limits = c(-1,1))` |
| Text labels | `geom_text(aes(label = sprintf("%.2f", value)))` |
| Rotate x labels | `theme(axis.text.x = element_text(angle = 45, hjust = 1))` |
| Remove grid | `theme(panel.grid = element_blank())` |
| Labels at top | `scale_x_discrete(position = "top")` |
| Wide to long | `pivot_longer(df, cols = -id_col, names_to = "var", values_to = "val")` |
| Matrix to long | `as.data.frame(as.table(cor_matrix))` |

Key rules:
- Long format (one row per cell) is required — reshape wide data first
- Sequential scale for all-positive/all-negative data; diverging scale for data centered at zero
- Always set `limits = c(-max, max)` on diverging scales to keep the midpoint at zero
- Remove the panel grid with `theme(panel.grid = element_blank())` — tile borders are sufficient structure

## FAQ

**What is the difference between geom_tile() and geom_raster()?**

Both draw rectangular tiles. `geom_tile()` accepts `width` and `height` aesthetics — tiles can be different sizes. `geom_raster()` assumes all tiles are the same size (faster for large grids). For standard heatmaps with uniform tile size, `geom_raster()` is slightly faster; for variable-size tiles, use `geom_tile()`.

**How do I reorder rows and columns by clustering?**

Compute hierarchical clustering: `ord <- hclust(dist(cor_matrix))$order`. Then reorder the factor levels: `factor(var, levels = colnames(cor_matrix)[ord])`. Apply to both Var1 and Var2 to group correlated variables together.

**My heatmap has missing tiles — why?**

Missing tiles appear when your long-format data is missing some (x, y) combinations. Either your source data is incomplete, or the `pivot_longer()` call skipped some columns. Check `is.na(value)` in your long data and handle missing values before plotting.

**How do I add a dendrogram to the heatmap?**

`geom_tile()` alone can't add dendrograms. Use the `pheatmap` package (`pheatmap()`) or `ComplexHeatmap` for Bioconductor for heatmaps with row and column dendrograms. These are dedicated heatmap packages with built-in clustering and annotation.

**How do I make a symmetric correlation matrix show only the lower triangle?**

Filter the long data to keep only rows where `Var1 >= Var2` (or `<=`) before plotting: `cor_long[cor_long$Var1 >= cor_long$Var2, ]`. This removes the upper triangle and diagonal, halving the number of tiles.

## References

1. ggplot2 reference — `geom_tile()`. https://ggplot2.tidyverse.org/reference/geom_tile.html
2. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer. https://ggplot2-book.org/
3. tidyr reference — `pivot_longer()`. https://tidyr.tidyverse.org/reference/pivot_longer.html
4. Wilke, C. O. (2019). *Fundamentals of Data Visualization*, Chapter 12: Visualizing Associations. https://clauswilke.com/dataviz/
5. R Graph Gallery — Heatmaps. https://r-graph-gallery.com/heatmap.html

## What's Next?

- **ggplot2 Scatter Plots** — the parent tutorial on `geom_point()` for exploring relationships between two continuous variables.
- **R Color Theory** — choosing sequential, diverging, and qualitative palettes with ColorBrewer and viridis.
- **Bubble Chart in R** — add a size dimension to scatter plots, extending two-variable exploration to three.
