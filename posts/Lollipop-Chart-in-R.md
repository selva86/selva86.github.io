---
title: "Lollipop Chart in R: A Cleaner Alternative to Bar Charts"
slug: "Lollipop-Chart-in-R"
description: "Create lollipop charts in R with ggplot2 using geom_segment() and geom_point(). Learn ordering, horizontal layout, color encoding, diverging lollipops, and when lollipops beat bar charts."
keywords: "lollipop chart R, ggplot2 lollipop, geom_segment geom_point R, lollipop plot ggplot2, R ranked chart, cleveland dot plot R"
auto_link_terms: "lollipop chart in R|lollipop plot in R|ggplot2 lollipop chart"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-6
post_type: "C"
fr_parent: ggplot2-Bar-Charts.html
sidebar_section: "Visualization"
sidebar_title: "Lollipop Chart"
difficulty: "Intermediate"
---

# Lollipop Chart in R: A Cleaner Alternative to Bar Charts

<p class="lead">A lollipop chart is a bar chart stripped down to its essentials, a thin line (stem) topped with a dot, built in ggplot2 with <code>geom_segment()</code> and <code>geom_point()</code>.</p>

## Introduction

Bar charts are workhorses. They communicate magnitude clearly. But when you have 15-25 categories, a dense forest of filled bars becomes visually noisy, the bars dominate the ink budget, and the actual values (the tops of the bars) are lost in the clutter.

A lollipop chart solves this. By replacing the filled bar with a thin line and a single dot, you reduce visual noise and make the data points themselves the focal element. The reader's eye goes directly to the dot, not to a wall of colored rectangles.

The tradeoff is that lollipops are slightly less precise than bars for length comparison, humans are better at comparing bar lengths than dot positions along a line. But when you have many categories and want a clean ranked visualization, lollipops are often the better choice.

## How do you create a basic lollipop chart in R?

A lollipop chart needs two geoms: `geom_segment()` for the stem (from 0 to the value) and `geom_point()` for the dot at the top.

```r
library(ggplot2)

# Sample: average temperature by month
df <- data.frame(
  month = month.abb,
  temp  = c(2, 4, 8, 13, 17, 21, 24, 23, 18, 12, 7, 3)
)
df$month <- factor(df$month, levels = month.abb)

# Basic lollipop chart
p_basic <- ggplot(df, aes(x = month, y = temp)) +
  geom_segment(
    aes(x = month, xend = month, y = 0, yend = temp),
    color = "grey60", linewidth = 0.8
  ) +
  geom_point(color = "steelblue", size = 4) +
  labs(
    title = "Average Monthly Temperature",
    x = NULL, y = "Temperature (°C)"
  ) +
  theme_minimal()

p_basic
```

`geom_segment()` takes four coordinates: `x`, `xend` (same category on both ends), `y = 0` (baseline), and `yend = temp` (the value). `geom_point()` then places a dot at `(month, temp)`.

**Try it:** Change `geom_point(color = "steelblue", size = 4)` to `geom_point(shape = 21, fill = "steelblue", color = "white", size = 5, stroke = 1.5)`. Shape 21 is a hollow circle you can fill, the white stroke creates a clean border.

## How do you order a lollipop chart by value?

When categories have no natural order (months, countries, products), ordering by value turns a random-looking plot into a clear ranking.

```r
# Reorder categories by temperature value
df_ordered <- df
df_ordered$month <- reorder(df_ordered$month, df_ordered$temp)

p_ordered <- ggplot(df_ordered, aes(x = month, y = temp)) +
  geom_segment(
    aes(x = month, xend = month, y = 0, yend = temp),
    color = "grey60", linewidth = 0.8
  ) +
  geom_point(color = "steelblue", size = 4) +
  labs(
    title = "Monthly Temperature — Ranked Lowest to Highest",
    x = NULL, y = "Temperature (°C)"
  ) +
  theme_minimal()

p_ordered
```

`reorder(month, temp)` reorders the factor levels of `month` by ascending `temp`. The chart now reads left-to-right from coldest to warmest.

**Try it:** Change `reorder(df_ordered$month, df_ordered$temp)` to `reorder(df_ordered$month, -df_ordered$temp)` to sort descending (highest first).

## How do you make a horizontal lollipop chart?

When category names are long, country names, product names, multi-word labels, flip the axes so labels run horizontally and are readable without tilting your head.

```r
# Horizontal lollipop: switch x and y, use long category names
countries <- data.frame(
  country = c("Norway", "Switzerland", "Ireland", "Germany",
               "Denmark", "Austria", "Belgium", "Luxembourg",
               "Sweden", "Australia"),
  hdi = c(0.961, 0.962, 0.945, 0.942, 0.948, 0.916, 0.937, 0.930, 0.947, 0.946)
)
countries$country <- reorder(countries$country, countries$hdi)

p_horiz <- ggplot(countries, aes(x = country, y = hdi)) +
  geom_segment(
    aes(x = country, xend = country, y = 0.9, yend = hdi),
    color = "grey60", linewidth = 0.8
  ) +
  geom_point(color = "#1565C0", size = 4) +
  coord_flip() +                # flip to horizontal
  labs(
    title = "Human Development Index — Top Countries",
    x = NULL, y = "HDI Score"
  ) +
  theme_minimal()

p_horiz
```

`coord_flip()` swaps x and y axes, country names now run vertically on the left, values extend horizontally. Note that `y = 0.9` in `geom_segment()` sets the baseline at 0.9 (not 0), since all HDI values are close to 1. Starting from 0 would make tiny differences invisible.

**Try it:** Change the baseline from `y = 0.9` to `y = 0` to see how a zero baseline changes the apparent differences between countries.

## How do you color lollipops above and below a threshold?

Coloring by a condition (above/below average, above/below zero, pass/fail threshold) adds a semantic layer that helps readers immediately see which categories are "good" vs "bad".

```r
# Color by above/below average temperature
avg_temp <- mean(df$temp)

df$status <- ifelse(df$temp >= avg_temp, "Above average", "Below average")

p_color <- ggplot(df, aes(x = month, y = temp, color = status)) +
  geom_hline(yintercept = avg_temp, linetype = "dashed",
             color = "grey50", linewidth = 0.6) +
  geom_segment(
    aes(x = month, xend = month, y = avg_temp, yend = temp),
    linewidth = 0.8
  ) +
  geom_point(size = 4) +
  scale_color_manual(
    values = c("Above average" = "#E53935", "Below average" = "#1565C0")
  ) +
  annotate("text", x = 0.7, y = avg_temp + 0.8,
           label = paste0("Avg: ", round(avg_temp, 1), "°C"),
           size = 3.5, color = "grey40", hjust = 0) +
  labs(
    title  = "Monthly Temperature vs Annual Average",
    x = NULL, y = "Temperature (°C)", color = NULL
  ) +
  theme_minimal() +
  theme(legend.position = "top")

p_color
```

The stems now start at `avg_temp` (not 0) and extend to each value. Red dots are above average, blue are below, the diverging stems from the reference line make the pattern immediately visible.

**Try it:** Change the reference from `avg_temp` to `15` (a round number) and see how choosing a different threshold changes the story.

## How do you create a diverging lollipop chart?

A diverging lollipop encodes positive values pointing right (or up) and negative values pointing left (or down). It's perfect for showing change, deviation, or gain/loss.

```r
# Diverging lollipop: year-over-year change by sector
div_df <- data.frame(
  sector = c("Technology", "Healthcare", "Finance", "Energy",
             "Consumer", "Utilities", "Materials", "Industrials"),
  change = c(18.5, 12.3, -4.1, -9.7, 6.2, -2.8, 3.4, 8.1)
)
div_df$sector <- reorder(div_df$sector, div_df$change)
div_df$direction <- ifelse(div_df$change >= 0, "Positive", "Negative")

p_diverg <- ggplot(div_df, aes(x = sector, y = change, color = direction)) +
  geom_hline(yintercept = 0, color = "grey40", linewidth = 0.5) +
  geom_segment(
    aes(x = sector, xend = sector, y = 0, yend = change),
    linewidth = 0.9
  ) +
  geom_point(size = 4) +
  geom_text(
    aes(label = paste0(ifelse(change > 0, "+", ""), change, "%")),
    hjust = ifelse(div_df$change >= 0, -0.3, 1.3),
    size = 3.2, fontface = "bold"
  ) +
  scale_color_manual(values = c("Positive" = "#2E7D32", "Negative" = "#C62828")) +
  coord_flip() +
  labs(
    title    = "Sector Performance — Year-over-Year Change",
    subtitle = "Percentage change vs. prior year",
    x = NULL, y = "Change (%)", color = NULL
  ) +
  theme_minimal() +
  theme(legend.position = "none",
        panel.grid.major.y = element_blank())

p_diverg
```

Value labels are placed to the right of positive dots and to the left of negative dots using `hjust = ifelse(change >= 0, -0.3, 1.3)`. This keeps labels from overlapping the stems.

**Try it:** Remove `+ theme(legend.position = "none")` to show the legend. Then try removing the `geom_text()` layer entirely, do you still know which bars are positive vs negative? This is the difference between encoding the sign (stem direction) and annotating the magnitude.

## Complete Example: Polished Lollipop Chart

```r
# Polished lollipop: programming language popularity
pop_df <- data.frame(
  language = c("Python", "JavaScript", "TypeScript", "Java", "C#",
               "C++", "PHP", "Shell", "R", "Swift"),
  usage_pct = c(51.1, 62.3, 38.5, 30.6, 27.1, 23.0, 18.2, 19.8, 12.9, 9.5)
)
pop_df$language <- reorder(pop_df$language, pop_df$usage_pct)

# Highlight R
pop_df$highlight <- pop_df$language == "R"

p_final <- ggplot(pop_df, aes(x = language, y = usage_pct)) +
  geom_segment(
    aes(x = language, xend = language, y = 0, yend = usage_pct,
        color = highlight),
    linewidth = 0.9, show.legend = FALSE
  ) +
  geom_point(
    aes(color = highlight),
    size = 4.5, show.legend = FALSE
  ) +
  geom_text(
    aes(label = paste0(usage_pct, "%")),
    hjust = -0.4, size = 3.2, color = "grey30"
  ) +
  scale_color_manual(values = c("FALSE" = "steelblue", "TRUE" = "#E53935")) +
  coord_flip() +
  scale_y_continuous(limits = c(0, 75), labels = function(x) paste0(x, "%")) +
  labs(
    title    = "Programming Language Popularity",
    subtitle = "% of developers using the language (Stack Overflow 2023)",
    x = NULL, y = NULL
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold"),
    plot.subtitle = element_text(color = "grey50", size = 11),
    panel.grid.major.y = element_blank(),
    axis.text.y   = element_text(face = ifelse(levels(pop_df$language) == "R", "bold", "plain"))
  )

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting to set the baseline to 0 (or the right reference)

❌ Omitting `y = 0` in `geom_segment()` makes stems appear as floating lines.

```r
# Wrong: y must be the baseline
geom_segment(aes(x = cat, xend = cat, yend = value))
```

✅ Always specify both endpoints:

```r
# Correct
geom_segment(aes(x = cat, xend = cat, y = 0, yend = value))
```

### Mistake 2: Not ordering categories

❌ Alphabetical or arbitrary category order makes it impossible to see ranking.

```r
# Wrong: default alphabetical order
ggplot(df, aes(x = country, y = gdp))
```

✅ Reorder by value when categories have no natural order.

```r
# Correct
df$country <- reorder(df$country, df$gdp)
```

### Mistake 3: Using lollipops for time series

Lollipops imply ranked comparison. For temporal data (months, years), a line chart communicates the trend better. Lollipops work for time when you want to emphasize individual period values rather than trend.

### Mistake 4: Tiny dots on thick stems

When `size` (dot) is smaller than `linewidth` (stem), the dot disappears behind the stem. Keep the dot visually dominant.

```r
# Wrong: stem too thick relative to dot
geom_segment(linewidth = 3) + geom_point(size = 2)

# Correct: dot should be visually larger than stem
geom_segment(linewidth = 0.8) + geom_point(size = 4)
```

### Mistake 5: Overlapping x-axis labels

Long category labels on a vertical lollipop chart get clipped or overlap. Fix: use `coord_flip()` for horizontal layout, or rotate labels with `theme(axis.text.x = element_text(angle = 45, hjust = 1))`.

## Practice Exercises

### Exercise 1: Ranked lollipop

Create a horizontal lollipop chart using the `mtcars` dataset, showing average `mpg` by number of cylinders (`cyl`). Order by `mpg` descending (highest mpg on top).

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

cyl_mpg <- aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
cyl_mpg$cyl  <- paste(cyl_mpg$cyl, "cylinders")
cyl_mpg$cyl  <- reorder(cyl_mpg$cyl, cyl_mpg$mpg)

ggplot(cyl_mpg, aes(x = cyl, y = mpg)) +
  geom_segment(aes(x = cyl, xend = cyl, y = 0, yend = mpg),
               color = "grey60", linewidth = 0.9) +
  geom_point(color = "steelblue", size = 5) +
  coord_flip() +
  labs(title = "Average MPG by Cylinder Count",
       x = NULL, y = "Miles per Gallon") +
  theme_minimal()
```

</details>

### Exercise 2: Diverging lollipop for deviations

Using `airquality`, compute the average `Temp` per month, then calculate each month's deviation from the overall mean. Create a diverging lollipop chart (horizontal) with green for above-average months and orange for below-average months.

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

monthly <- aggregate(Temp ~ Month, data = airquality, FUN = mean)
monthly$dev <- monthly$Temp - mean(monthly$Temp)
monthly$direction <- ifelse(monthly$dev >= 0, "Above", "Below")
monthly$Month <- factor(month.abb[monthly$Month], levels = month.abb[monthly$Month])
monthly$Month <- reorder(monthly$Month, monthly$dev)

ggplot(monthly, aes(x = Month, y = dev, color = direction)) +
  geom_hline(yintercept = 0, color = "grey40", linewidth = 0.5) +
  geom_segment(aes(x = Month, xend = Month, y = 0, yend = dev),
               linewidth = 0.9) +
  geom_point(size = 4) +
  scale_color_manual(values = c("Above" = "#2E7D32", "Below" = "#E65100")) +
  coord_flip() +
  labs(title = "Monthly Temperature Deviation from Mean",
       subtitle = "New York, 1973 (airquality dataset)",
       x = NULL, y = "Deviation (°F)", color = NULL) +
  theme_minimal() +
  theme(legend.position = "top")
```

</details>

## Summary

| Task | Code |
|---|---|
| Basic lollipop | `geom_segment(aes(y=0, yend=val)) + geom_point()` |
| Order by value | `reorder(category, value)` |
| Horizontal layout | `+ coord_flip()` |
| Color by condition | `ifelse()` variable + `scale_color_manual()` |
| Diverging lollipop | Baseline at 0, stems extend positive/negative |
| Value labels | `geom_text(aes(label = val), hjust = -0.3)` |

**Lollipop vs bar chart:**
- Use a **lollipop** when you have many categories (15+), when the visual clutter of filled bars is distracting, or when you want to emphasize the value position rather than the bar fill area.
- Use a **bar chart** when precise length comparison matters, when you need filled color for grouping, or when your audience is less familiar with lollipop charts.

## FAQ

**What is the difference between a lollipop chart and a Cleveland dot plot?**
A Cleveland dot plot shows dots only, no stems. It's used to compare multiple groups per category (two dots per row, one per group). A lollipop has a stem from zero and is used for single-variable ranked comparisons.

**Can I add multiple lollipops per category (grouped lollipops)?**
Yes, use `position_dodge()` in both `geom_segment()` and `geom_point()`, similar to a grouped bar chart. But more than 2 groups gets cluttered; consider small multiples instead.

**How do I add value labels that don't overlap the dots?**
Use `hjust = -0.3` for vertical lollipops (labels to the right of dots) or `hjust = 1.3` for labels to the left. For horizontal charts, use `vjust = -0.5` (above) or `vjust = 1.5` (below).

**Is there a dedicated lollipop geom in ggplot2?**
No, you compose it from `geom_segment()` + `geom_point()`. The `ggalt` package has `geom_lollipop()` as a convenience wrapper, but the base ggplot2 approach gives more flexibility.

## References

- Wickham H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer.
- R Graph Gallery, Lollipop chart: r-graph-gallery.com/lollipop-plot.html
- Wilke C. (2019). *Fundamentals of Data Visualization*, Chapter 6: Visualizing amounts
- data-to-viz.com, Lollipop chart

## Continue Learning

- **ggplot2 Bar Charts**, the classic alternative for comparing categorical magnitudes
- **Error Bars in ggplot2**, add uncertainty intervals to your point estimates
- **R Waffle Chart**, display counts as a grid of unit squares for intuitive proportions
