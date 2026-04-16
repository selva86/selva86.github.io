---
title: "Pie Chart and Donut Chart in R with ggplot2"
slug: "Pie-Donut-Chart-in-R"
description: "Create pie and donut charts in R with ggplot2 coord_polar(). Learn to add labels, customize colors, make donut holes, and know when pie charts mislead vs. communicate clearly."
keywords: "pie chart in R, donut chart R, ggplot2 pie chart, coord_polar ggplot2, R donut chart ggplot2, pie chart ggplot2 labels"
auto_link_terms: "pie chart in R|donut chart in R|ggplot2 pie chart|coord_polar()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-5
post_type: "C"
fr_parent: ggplot2-Bar-Charts.html
sidebar_section: "Visualization"
sidebar_title: "Pie & Donut Chart"
difficulty: "Intermediate"
---

# Pie Chart and Donut Chart in R with ggplot2

<p class="lead">A pie chart in ggplot2 is a bar chart flipped into polar coordinates — <code>geom_bar()</code> plus <code>coord_polar(theta = "y")</code>. A donut chart adds a hole in the center by adjusting the x-axis limits.</p>

## Introduction

Pie charts have a reputation. Data visualization experts often recommend against them — and for good reason. Human perception is poor at comparing slice angles. We can instantly see that one bar is twice as tall as another, but we struggle to tell whether a 38% slice is bigger than a 34% slice when they sit next to each other.

That said, pie charts aren't universally wrong. They communicate part-to-whole relationships clearly when you have 3-5 slices with meaningful differences. Donut charts have become popular as a cleaner variation — the center hole removes the misleading focal point and gives you space for a total or key metric.

This post shows you how to build both in ggplot2, add proper labels, customize colors, and — importantly — when to reach for a bar chart instead.

## How do you create a basic pie chart in R?

In ggplot2, a pie chart is a stacked bar chart mapped to polar coordinates. The key insight: `coord_polar(theta = "y")` wraps the y-axis around into a circle. Each bar segment becomes a pie slice.

```r
library(ggplot2)

# Sample data: fruit sales share
fruit_df <- data.frame(
  category = c("Apples", "Bananas", "Cherries", "Dates", "Elderberries"),
  share    = c(35, 25, 20, 12, 8)
)

# Basic pie chart
p_pie <- ggplot(fruit_df, aes(x = "", y = share, fill = category)) +
  geom_bar(stat = "identity", width = 1) +
  coord_polar(theta = "y") +
  theme_void() +
  labs(title = "Fruit Sales Share", fill = "Category")

p_pie
```

Three things happening here:
1. `x = ""` makes a single stacked bar — one vertical column.
2. `coord_polar(theta = "y")` wraps the y-axis (the stacked heights) around into a circle.
3. `theme_void()` removes axes, gridlines, and background — all of which are meaningless in a pie chart.

**Try it:** Change `theme_void()` to `theme_minimal()` and see the naked axis labels that `theme_void()` hides. This is why we use `theme_void()` for pie charts.

## How do you add percentage labels to a pie chart?

Labels should show values directly on each slice. Position them at the center of each slice using `position_stack(vjust = 0.5)`.

```r
# Add percentage labels inside slices
fruit_df$pct_label <- paste0(fruit_df$share, "%")

p_labels <- ggplot(fruit_df, aes(x = "", y = share, fill = category)) +
  geom_bar(stat = "identity", width = 1, color = "white", linewidth = 0.5) +
  geom_text(
    aes(label = pct_label),
    position = position_stack(vjust = 0.5),  # center of each slice
    color    = "white",
    fontface = "bold",
    size     = 4
  ) +
  coord_polar(theta = "y") +
  theme_void() +
  labs(title = "Fruit Sales Share (%)", fill = "Category")

p_labels
```

`position_stack(vjust = 0.5)` places each label at the vertical midpoint of its stacked segment — which becomes the angular midpoint of each slice after polar transformation.

The `color = "white"` on `geom_bar()` draws white dividing lines between slices, making the chart easier to read when slices share similar hues.

**Try it:** Change `vjust = 0.5` to `vjust = 1.0` and see where labels end up (at the outer edge of each slice). Then try `vjust = 0` (inner edge). `0.5` is usually the sweet spot.

## How do you customize pie chart colors?

By default ggplot2 uses its standard discrete palette. For pie charts, pick colors with sufficient contrast between adjacent slices.

```r
# Custom palette with high contrast between slices
my_colors <- c(
  "Apples"       = "#E53935",
  "Bananas"      = "#FFD600",
  "Cherries"     = "#8E24AA",
  "Dates"        = "#F57C00",
  "Elderberries" = "#43A047"
)

p_colored <- ggplot(fruit_df, aes(x = "", y = share, fill = category)) +
  geom_bar(stat = "identity", width = 1, color = "white", linewidth = 0.5) +
  geom_text(
    aes(label = pct_label),
    position = position_stack(vjust = 0.5),
    color = "white", fontface = "bold", size = 4
  ) +
  scale_fill_manual(values = my_colors) +
  coord_polar(theta = "y") +
  theme_void() +
  labs(title = "Fruit Sales Share", fill = NULL) +
  theme(legend.position = "right")

p_colored
```

`fill = NULL` in `labs()` removes the legend title, which is usually redundant when each slice is already labeled.

**Try it:** Replace `scale_fill_manual(values = my_colors)` with `scale_fill_brewer(palette = "Set2")` to use a ColorBrewer palette. Compare legibility.

## How do you create a donut chart in R?

A donut chart is a pie chart with a hole punched through the center. The trick is to set `x = 2` in `aes()` (instead of `x = ""`) and then restrict the x-axis range with `xlim(0.5, 2.5)`. The range from 0.5 to just below 2 becomes the "empty center".

```r
# Donut chart: move x to 2, then xlim creates the hole
p_donut <- ggplot(fruit_df, aes(x = 2, y = share, fill = category)) +
  geom_bar(stat = "identity", width = 1, color = "white", linewidth = 0.5) +
  geom_text(
    aes(label = pct_label),
    position = position_stack(vjust = 0.5),
    color = "white", fontface = "bold", size = 4
  ) +
  scale_fill_manual(values = my_colors) +
  coord_polar(theta = "y") +
  xlim(0.5, 2.5) +          # values < 1.5 become the donut hole
  theme_void() +
  labs(title = "Fruit Sales (Donut)", fill = NULL)

p_donut
```

The donut hole size is controlled by `xlim()`. A wider range on the lower end (e.g., `xlim(0, 2.5)`) creates a larger hole; `xlim(1.5, 2.5)` creates a smaller hole. Experiment to find the right proportion.

**Try it:** Change `xlim(0.5, 2.5)` to `xlim(1.2, 2.5)` to make the hole smaller. Then try `xlim(0, 2.5)` for a larger hole.

## How do you add a center label to a donut chart?

The empty center of a donut chart is prime real estate for a summary statistic — a total, a percentage, or a key metric.

```r
# Donut with center annotation
total_label <- paste0("Total\n", sum(fruit_df$share), "%")

p_final <- ggplot(fruit_df, aes(x = 2, y = share, fill = category)) +
  geom_bar(stat = "identity", width = 1, color = "white", linewidth = 0.5) +
  geom_text(
    aes(label = pct_label),
    position = position_stack(vjust = 0.5),
    color = "white", fontface = "bold", size = 4
  ) +
  # Center annotation — placed at x=0 which is the hole center
  annotate(
    "text",
    x = 0, y = 0,
    label    = total_label,
    size     = 5,
    fontface = "bold",
    color    = "grey30"
  ) +
  scale_fill_manual(values = my_colors) +
  coord_polar(theta = "y") +
  xlim(-0.5, 2.5) +   # extended lower limit to accommodate center text
  theme_void() +
  labs(
    title    = "Fruit Sales Distribution",
    subtitle = "Share of total sales by fruit category",
    fill     = NULL
  ) +
  theme(
    plot.title    = element_text(face = "bold", hjust = 0.5, size = 14),
    plot.subtitle = element_text(hjust = 0.5, color = "grey50", size = 11),
    legend.position = "right"
  )

p_final
```

The `annotate()` call places text at coordinates `(0, 0)` — the center of the polar plot. The `xlim` lower bound is extended to `-0.5` to give the center text enough room.

**Try it:** Replace `total_label` with `"100%"` for a cleaner center label. Or add a secondary metric like `"5 Categories"`.

## Common Mistakes and How to Fix Them

### Mistake 1: Using a pie chart when differences are subtle

❌ Pie charts make it nearly impossible to compare slices with similar sizes.

```r
# 8 slices with 12-14% share each — readers can't tell which is bigger
data.frame(cat = LETTERS[1:8], pct = c(13,12,14,11,13,12,14,11))
```

✅ Use a bar chart when you need precise comparisons. Reserve pie charts for 3-5 slices with clear differences (e.g., 60% vs 25% vs 15%).

### Mistake 2: Forgetting theta = "y"

❌ Using `theta = "x"` wraps the x-axis around — creating a compass rose, not a pie.

```r
# Wrong: wraps x-axis, gives wrong chart type
coord_polar(theta = "x")
```

✅ Always use `theta = "y"` for pie and donut charts.

```r
# Correct
coord_polar(theta = "y")
```

### Mistake 3: Labels outside slices with no connector lines

Small slices have tiny arcs — labels placed inside them are unreadable. For slices under ~8%, place labels outside with connector lines using `ggrepel` or manual `geom_segment()` + `geom_text()`.

### Mistake 4: Using 3D pie charts

3D perspective distorts the apparent size of slices — front slices look larger than back slices at the same percentage. Avoid 3D pie charts entirely.

### Mistake 5: Too many categories

❌ A pie chart with 10+ categories is unreadable — slices become slivers, colors become indistinguishable.

✅ Collapse small categories into "Other". A pie chart should have at most 5-6 segments.

## Practice Exercises

### Exercise 1: Political poll pie chart

Create a pie chart for this polling data:

| Party | Votes (%) |
|-------|-----------|
| Party A | 42 |
| Party B | 31 |
| Party C | 18 |
| Others | 9 |

Use `scale_fill_manual()` with colors of your choice. Add percentage labels inside each slice.

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

poll <- data.frame(
  party = c("Party A", "Party B", "Party C", "Others"),
  pct   = c(42, 31, 18, 9)
)
poll$label <- paste0(poll$pct, "%")

ggplot(poll, aes(x = "", y = pct, fill = party)) +
  geom_bar(stat = "identity", width = 1, color = "white", linewidth = 0.5) +
  geom_text(aes(label = label),
            position = position_stack(vjust = 0.5),
            color = "white", fontface = "bold", size = 4.5) +
  scale_fill_manual(values = c(
    "Party A" = "#1565C0", "Party B" = "#C62828",
    "Party C" = "#2E7D32", "Others"  = "#757575"
  )) +
  coord_polar(theta = "y") +
  theme_void() +
  labs(title = "Election Poll Results", fill = NULL)
```

</details>

### Exercise 2: Donut with center total

Convert the poll data from Exercise 1 into a donut chart. Add a center annotation showing the number of respondents (assume N = 1,200).

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

poll <- data.frame(
  party = c("Party A", "Party B", "Party C", "Others"),
  pct   = c(42, 31, 18, 9)
)
poll$label <- paste0(poll$pct, "%")

ggplot(poll, aes(x = 2, y = pct, fill = party)) +
  geom_bar(stat = "identity", width = 1, color = "white", linewidth = 0.5) +
  geom_text(aes(label = label),
            position = position_stack(vjust = 0.5),
            color = "white", fontface = "bold", size = 4) +
  annotate("text", x = 0, y = 0,
           label = "N = 1,200\nRespondents",
           size = 4, fontface = "bold", color = "grey30") +
  scale_fill_manual(values = c(
    "Party A" = "#1565C0", "Party B" = "#C62828",
    "Party C" = "#2E7D32", "Others"  = "#757575"
  )) +
  coord_polar(theta = "y") +
  xlim(-0.5, 2.5) +
  theme_void() +
  labs(title = "Election Poll Results", fill = NULL)
```

</details>

## Summary

| Task | Code |
|---|---|
| Basic pie chart | `geom_bar(stat="identity") + coord_polar(theta="y")` |
| Clean background | `+ theme_void()` |
| Labels at slice centers | `geom_text(position = position_stack(vjust = 0.5))` |
| Slice borders | `geom_bar(color = "white", linewidth = 0.5)` |
| Custom colors | `scale_fill_manual(values = c(...))` |
| Donut chart | `x = 2` in `aes()` + `xlim(0.5, 2.5)` |
| Center annotation | `annotate("text", x = 0, y = 0, label = ...)` |

**When to use pie/donut charts:**
- 3-5 categories with meaningfully different shares (e.g., 60%, 25%, 15%)
- Showing a single dominant category ("majority share" story)
- Part-to-whole narrative where exact values matter less than overall composition

**When to use a bar chart instead:**
- More than 5-6 categories
- You need to compare precise values across categories
- Differences between categories are subtle (e.g., 32% vs 34%)

## FAQ

**Why does ggplot2 use geom_bar() for pie charts, not a dedicated geom?**
ggplot2's grammar treats a pie chart as a special coordinate system, not a special geom. A stacked bar chart (`geom_bar()`) becomes a pie when wrapped in `coord_polar(theta = "y")`. This keeps the grammar consistent.

**How do I sort slices in a pie chart?**
Reorder the factor levels: `fruit_df$category <- reorder(fruit_df$category, fruit_df$share)`. Combined with `position_stack()`, this sorts slices by size.

**Can I use coord_radial() instead of coord_polar()?**
Yes — `coord_radial()` was added in ggplot2 3.5.0 as a modernized alternative. For donut charts, it accepts an `inner.radius` argument (0 to 1) to control hole size directly, without the `xlim()` trick.

**Why do my labels disappear on small slices?**
Small slices have tiny text areas. Use `ifelse(share >= 8, label, "")` to suppress labels on slices under 8%, then add a legend for reference.

**Are there alternatives to pie charts for part-to-whole data?**
Yes: treemaps (for hierarchical data), waffle charts (for counts), stacked bar charts (for comparisons across groups), and lollipop charts (for ranked shares). All communicate proportions more accurately than pie charts.

## References

- Wickham H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer.
- R Graph Gallery — Pie chart with ggplot2: r-graph-gallery.com/piechart-ggplot2.html
- Wilke C. (2019). *Fundamentals of Data Visualization* — Chapter 10: Visualizing proportions
- Cairo A. (2016). *The Truthful Art* — Chapter 9: The perils of pie charts
- ggplot2 3.5.0 release notes — coord_radial()

## Continue Learning

- **ggplot2 Bar Charts** — the more reliable alternative to pie charts for comparing categories
- **R Treemap** — visualize hierarchical part-to-whole data with nested rectangles
- **R Waffle Chart** — display proportions as a grid of squares for easy counting
