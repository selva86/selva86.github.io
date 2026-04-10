---
title: "Bubble Chart in R: Add a Third Variable to Your Scatter Plot"
slug: "Bubble-Chart-in-R"
description: "Create bubble charts in R with ggplot2. Learn geom_point() size mapping, scale_size_area(), label overlaps with ggrepel, and when bubble charts communicate clearly vs. mislead."
keywords: "bubble chart in R, ggplot2 bubble chart, geom_point size, scale_size_area R, R bubble plot, bubble chart ggplot2"
auto_link_terms: "bubble chart in R|bubble plot in R|ggplot2 bubble chart|scale_size_area()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-4
post_type: "C"
fr_parent: ggplot2-Scatter-Plots.html
sidebar_section: "Visualization"
sidebar_title: "Bubble Chart"
---

# Bubble Chart in R: Add a Third Variable to Your Scatter Plot

<p class="lead">A bubble chart is a scatter plot where a third numeric variable is encoded as the size of each point — letting you visualize three dimensions in a single 2D plot without faceting.</p>

## Introduction

A scatter plot shows two variables. A bubble chart shows three. That third variable — population size, revenue, number of observations — is encoded as the *area* of the circle (the "bubble"), giving your data an extra dimension without adding complexity for the reader.

The classic use case is Hans Rosling's famous gapminder visualization: GDP on the x-axis, life expectancy on the y-axis, population as bubble size, and continent as color. Four variables, one chart, an immediately readable story.

ggplot2 makes bubble charts straightforward with `geom_point()` — the only difference from a scatter plot is that you also map a numeric variable to the `size` aesthetic. But the devil is in the details: using the wrong size scale, skipping transparency, or adding labels naively can make a bubble chart unreadable. This post walks you through every step.

## How do you create a basic bubble chart in R?

A bubble chart is just `geom_point()` with `size` mapped to a variable inside `aes()`. Let's use the built-in `mtcars` dataset, where we'll show `wt` (weight) on x, `mpg` on y, and bubble size proportional to `hp` (horsepower).

```r
library(ggplot2)
library(ggrepel)

# Basic bubble chart: weight vs mpg, size = horsepower
p_basic <- ggplot(mtcars, aes(x = wt, y = mpg, size = hp)) +
  geom_point(alpha = 0.6, color = "steelblue") +
  scale_size(range = c(2, 14)) +
  labs(
    title = "Car Weight vs Fuel Efficiency",
    x     = "Weight (1000 lbs)",
    y     = "Miles per Gallon",
    size  = "Horsepower"
  ) +
  theme_minimal()

p_basic
```

`scale_size(range = c(2, 14))` maps the smallest `hp` value to 2px and the largest to 14px. Without it, the default range is tiny — all bubbles look nearly the same size.

**Try it:** Change `range = c(2, 14)` to `range = c(1, 20)` and see how it affects readability. Is the range too dramatic now?

## What is the difference between scale_size() and scale_size_area()?

This is the most commonly misunderstood part of bubble charts. There are two size scales in ggplot2, and they behave differently:

- `scale_size()` maps the data value to the **radius** of the circle.
- `scale_size_area()` maps the data value to the **area** of the circle.

Why does this matter? Human perception works in two dimensions — we perceive circle *area*, not radius. If value A is twice value B and you double the *radius*, the bubble looks four times bigger (because area = π r²). This creates a misleading chart.

```r
# Compare: scale_size vs scale_size_area
# Use scale_size_area() when size = counts or totals (perceptually honest)
p_area <- ggplot(mtcars, aes(x = wt, y = mpg, size = hp)) +
  geom_point(alpha = 0.6, color = "coral") +
  scale_size_area(max_size = 14) +  # maps values to area, not radius
  labs(
    title = "Bubble Size Proportional to Horsepower (area-correct)",
    x     = "Weight (1000 lbs)",
    y     = "Miles per Gallon",
    size  = "Horsepower"
  ) +
  theme_minimal()

p_area
```

**Rule of thumb:**
- Use `scale_size_area()` when your size variable represents a **count or total** (population, revenue, observations) — this is the perceptually honest choice.
- Use `scale_size()` when you want manual control over the visual range and perceptual accuracy is less critical.
- `scale_size_area()` also maps zero to an actual zero-sized point (invisible), which is useful when zero is a meaningful value.

**Try it:** Swap `scale_size_area(max_size = 14)` for `scale_size(range = c(2, 14))` and compare the two plots. Notice which bubbles look more proportionally correct.

## How do you add a fourth variable with color?

Color is the natural fourth channel. Add a categorical or continuous variable to the `color` aesthetic to encode group membership or gradient intensity.

```r
# Map color to cylinder count (treated as factor for discrete colors)
mtcars$cyl_f <- factor(mtcars$cyl, labels = c("4 cyl", "6 cyl", "8 cyl"))

p_color <- ggplot(mtcars, aes(x = wt, y = mpg, size = hp, color = cyl_f)) +
  geom_point(alpha = 0.7) +
  scale_size_area(max_size = 14) +
  scale_color_manual(
    values = c("4 cyl" = "#2196F3", "6 cyl" = "#FF9800", "8 cyl" = "#F44336")
  ) +
  labs(
    title  = "Weight vs MPG by Cylinder Count",
    x      = "Weight (1000 lbs)",
    y      = "Miles per Gallon",
    size   = "Horsepower",
    color  = "Cylinders"
  ) +
  theme_minimal()

p_color
```

Four variables, one chart: weight (x), mpg (y), horsepower (size), cylinders (color). The pattern becomes immediately readable — 8-cylinder cars cluster in the bottom-right (heavy and inefficient), 4-cylinder cars in the top-left.

**Try it:** Change `color = cyl_f` to `color = hp` (continuous) and swap `scale_color_manual()` for `scale_color_viridis_c()`. How does encoding the same variable (`hp`) as both size and color change what you notice?

## How do you add labels to bubble charts without overlapping?

Labels on bubble charts overlap easily because bubbles are large and placed at arbitrary positions. `geom_text()` gives you labels but no overlap control. Use `ggrepel::geom_text_repel()` to automatically push labels away from each other and from the bubbles.

```r
# Label car names, repel overlaps automatically
p_label <- ggplot(mtcars, aes(x = wt, y = mpg, size = hp, color = cyl_f)) +
  geom_point(alpha = 0.7) +
  geom_text_repel(
    aes(label = rownames(mtcars)),
    size          = 2.8,
    color         = "grey30",
    max.overlaps  = 15,       # allow up to 15 overlapping attempts before giving up
    box.padding   = 0.4,      # space between label box and point
    segment.color = "grey70"  # connector line color
  ) +
  scale_size_area(max_size = 12) +
  scale_color_manual(
    values = c("4 cyl" = "#2196F3", "6 cyl" = "#FF9800", "8 cyl" = "#F44336")
  ) +
  labs(
    title = "Car Performance Overview",
    x = "Weight (1000 lbs)", y = "Miles per Gallon",
    size = "Horsepower", color = "Cylinders"
  ) +
  theme_minimal()

p_label
```

`geom_text_repel()` draws connecting lines from each label to its point when the label has been pushed away. The `max.overlaps` argument controls how aggressively labels are placed — increase it if some labels disappear.

**Try it:** Replace `geom_text_repel()` with plain `geom_text(aes(label = rownames(mtcars)), size = 2.8)` and see the difference. This is why ggrepel exists.

## How do you handle overplotting in bubble charts?

When bubbles overlap, smaller ones get hidden behind larger ones. Two fixes work together:

1. **Alpha transparency** — lets you see buried bubbles through the ones on top.
2. **Reorder by size descending** — plot large bubbles first so small ones render on top.

```r
# Sort so large bubbles are drawn first (small bubbles stay visible on top)
mtcars_sorted <- mtcars[order(mtcars$hp, decreasing = TRUE), ]

p_overlap <- ggplot(mtcars_sorted, aes(x = wt, y = mpg, size = hp, color = cyl_f)) +
  geom_point(alpha = 0.5, stroke = 0.5, color = "white") +  # white border separates touching bubbles
  geom_point(alpha = 0.65) +
  scale_size_area(max_size = 14) +
  scale_color_manual(
    values = c("4 cyl" = "#2196F3", "6 cyl" = "#FF9800", "8 cyl" = "#F44336")
  ) +
  labs(
    title = "Overplotting Fix: Sort + Alpha + White Border",
    x = "Weight (1000 lbs)", y = "Miles per Gallon",
    size = "Horsepower", color = "Cylinders"
  ) +
  theme_minimal()

p_overlap
```

The double `geom_point()` trick: the first call draws a white-bordered ghost (using `color = "white"` with low alpha), the second draws the filled colored bubble on top. The white border acts as a visual separator between touching bubbles — a classic bubble chart technique.

**Try it:** Remove the first `geom_point()` call (the white border layer) and compare. The effect is subtle but makes crowded regions much easier to read.

## Complete Example: A Polished Bubble Chart

Here's a full production-ready bubble chart with proper sizing, labeling, theme, and annotation.

```r
# Polished bubble chart: label only notable cars
notable <- c("Toyota Corolla", "Datsun 710", "Cadillac Fleetwood",
             "Maserati Bora", "Honda Civic", "Ferrari Dino")

mtcars$car   <- rownames(mtcars)
mtcars$label <- ifelse(mtcars$car %in% notable, mtcars$car, NA)
mtcars_ord   <- mtcars[order(mtcars$hp, decreasing = TRUE), ]

p_final <- ggplot(mtcars_ord, aes(x = wt, y = mpg, size = hp, color = cyl_f)) +
  # White border layer
  geom_point(aes(size = hp), alpha = 0.3, color = "white") +
  # Main bubbles
  geom_point(alpha = 0.75) +
  # Selective labels
  geom_text_repel(
    aes(label = label),
    size = 3, color = "grey20",
    max.overlaps = 20,
    box.padding  = 0.5,
    segment.color = "grey60",
    na.rm = TRUE
  ) +
  scale_size_area(max_size = 16, guide = guide_legend(order = 2)) +
  scale_color_manual(
    values = c("4 cyl" = "#2196F3", "6 cyl" = "#FF9800", "8 cyl" = "#E53935"),
    guide  = guide_legend(order = 1, override.aes = list(size = 5))
  ) +
  labs(
    title    = "Car Weight, Fuel Efficiency, and Engine Power",
    subtitle = "Bubble size = horsepower | Color = cylinder count",
    x        = "Weight (1,000 lbs)",
    y        = "Miles per Gallon",
    size     = "Horsepower",
    color    = "Cylinders"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold"),
    plot.subtitle = element_text(color = "grey50", size = 11),
    legend.position = "right"
  )

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Mapping size to radius instead of area

❌ Using `scale_size()` for counts makes large categories look disproportionately bigger.

```r
# Wrong: radius-based scaling distorts relative sizes
scale_size(range = c(2, 14))
```

✅ Use `scale_size_area()` when size represents a count or total.

```r
# Correct: area-based scaling is perceptually honest
scale_size_area(max_size = 14)
```

### Mistake 2: Not sorting data before plotting

❌ Plotting in default order buries small bubbles under large ones.

```r
# Wrong: unsorted — large bubbles may hide small ones
ggplot(mtcars, aes(x = wt, y = mpg, size = hp))
```

✅ Sort descending by size so large bubbles render first.

```r
# Correct: large bubbles drawn first, small ones on top
mtcars_sorted <- mtcars[order(mtcars$hp, decreasing = TRUE), ]
ggplot(mtcars_sorted, aes(x = wt, y = mpg, size = hp))
```

### Mistake 3: Using geom_text() for labels on busy charts

❌ Plain `geom_text()` draws labels at exact coordinates, producing unreadable overlaps.

```r
# Wrong: labels pile up on top of each other
geom_text(aes(label = car), size = 3)
```

✅ Use `ggrepel::geom_text_repel()` to push labels apart automatically.

```r
# Correct: labels repel each other and connect back to their points
geom_text_repel(aes(label = car), size = 3, max.overlaps = 15)
```

### Mistake 4: Skipping transparency

Without `alpha`, overlapping bubbles are completely opaque — you lose the information underneath.

```r
# Wrong
geom_point(color = "steelblue")

# Correct: transparency reveals hidden bubbles
geom_point(alpha = 0.65, color = "steelblue")
```

### Mistake 5: Encoding too many variables

Four variables (x, y, size, color) is the comfortable maximum for a bubble chart. Adding a fifth (shape, label for every point, facet grid, AND color) creates cognitive overload. Simplify — pick the most important story.

## Practice Exercises

### Exercise 1: Gapminder-style bubble chart

Using the built-in `LifeCycleSavings` dataset (savings rate, per-capita disposable income, per-capita income growth, population), create a bubble chart with:

- x = `dpi` (per-capita disposable income)
- y = `sr` (savings rate)
- size = `pop75` (population over 75, a proxy for aging)
- Sorted so large bubbles are behind small ones
- `scale_size_area(max_size = 12)`
- A clean minimal theme with a descriptive title

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

df <- LifeCycleSavings
df$country <- rownames(df)
df_sorted  <- df[order(df$pop75, decreasing = TRUE), ]

ggplot(df_sorted, aes(x = dpi, y = sr, size = pop75)) +
  geom_point(alpha = 0.65, color = "steelblue") +
  scale_size_area(max_size = 12) +
  labs(
    title = "Savings Rate vs. Per-Capita Income",
    subtitle = "Bubble size = population aged 75+",
    x    = "Per-Capita Disposable Income",
    y    = "Savings Rate (%)",
    size = "Pop 75+ (%)"
  ) +
  theme_minimal()
```

</details>

### Exercise 2: Label the extremes

Extend Exercise 1 to label only the 5 countries with the highest `pop75` value using `ggrepel::geom_text_repel()`. All other labels should be `NA`.

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(ggrepel)

df        <- LifeCycleSavings
df$country <- rownames(df)
top5      <- df$country[order(df$pop75, decreasing = TRUE)[1:5]]
df$label  <- ifelse(df$country %in% top5, df$country, NA)
df_sorted <- df[order(df$pop75, decreasing = TRUE), ]

ggplot(df_sorted, aes(x = dpi, y = sr, size = pop75)) +
  geom_point(alpha = 0.65, color = "steelblue") +
  geom_text_repel(aes(label = label), size = 3,
                  color = "grey20", na.rm = TRUE,
                  box.padding = 0.4, segment.color = "grey60") +
  scale_size_area(max_size = 12) +
  labs(
    title    = "Savings Rate vs. Per-Capita Income",
    subtitle = "Labels show 5 countries with highest aged population",
    x = "Per-Capita Disposable Income", y = "Savings Rate (%)",
    size = "Pop 75+ (%)"
  ) +
  theme_minimal()
```

</details>

## Summary

| Task | Code |
|---|---|
| Basic bubble chart | `geom_point(aes(size = var), alpha = 0.6)` |
| Scale by area (perceptually correct) | `scale_size_area(max_size = 14)` |
| Scale by radius (manual range) | `scale_size(range = c(2, 14))` |
| Add color dimension | `aes(color = group_var)` + `scale_color_manual()` |
| Label without overlap | `ggrepel::geom_text_repel()` |
| Fix overplotting | Sort data descending by size; use `alpha`; add white border layer |
| Selective labels | `label = ifelse(condition, name, NA)` + `na.rm = TRUE` |

**When to use bubble charts:**
- You have 3-4 numeric or mixed variables to show simultaneously
- The size variable has a natural zero (counts, totals, populations)
- Your audience can read size differences accurately (differences must be substantial — humans struggle to distinguish 10% size differences)

**When NOT to use bubble charts:**
- More than 20-30 data points (overplotting becomes unmanageable)
- Size differences are subtle (a bar chart communicates magnitude more precisely)
- All three variables matter equally for a decision (consider parallel coordinates instead)

## FAQ

**What is the difference between a bubble chart and a scatter plot?**
A scatter plot shows two variables (x and y). A bubble chart adds a third — the size of each point encodes a numeric variable. Color can add a fourth.

**Should I use scale_size() or scale_size_area()?**
Use `scale_size_area()` when size represents a count or total (population, revenue, frequency) — it maps values to *area*, which is what we perceive. Use `scale_size()` when you need manual control over the visual range and perceptual accuracy matters less.

**Why are some labels missing when I use geom_text_repel()?**
ggrepel gives up on placing labels that would overlap too much. Increase `max.overlaps` (e.g., `max.overlaps = 30`) or reduce the number of labels by setting most to `NA` and only labeling notable points.

**How do I make bubble sizes appear in the legend correctly?**
Use `guide_legend(override.aes = list(size = c(4, 8, 12)))` inside `scale_size_area()` or `scale_size()` to manually set legend key sizes to representative values.

**Can I create a 3D bubble chart in R?**
ggplot2 doesn't support true 3D. For interactive 3D, use the `plotly` package with `plot_ly(type = "scatter3d")`. For static, faceting or color coding is more readable than faked 3D perspective.

## References

- Wickham H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer.
- ggrepel documentation: overlapping text labels for ggplot2
- R Graph Gallery — Bubble chart: r-graph-gallery.com/bubble-chart.html
- r-charts.com — Bubble chart in ggplot2
- Wilke C. (2019). *Fundamentals of Data Visualization* — Chapter 12: Visualizing associations

## Continue Learning

- **ggplot2 Scatter Plots** — the foundation: geom_point(), trend lines, overplotting, and annotations
- **Heatmap in R** — encode a matrix of values as a color grid with geom_tile()
- **R Correlation Matrix Plot** — visualize pairwise correlations with corrplot and ggplot2
