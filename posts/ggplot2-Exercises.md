---
title: "ggplot2 Exercises: 15 Chart-Building Practice Problems (With Solutions)"
slug: "ggplot2-Exercises"
description: "Practice ggplot2 with 15 chart-building exercises. Problems cover scatter plots, bar charts, line charts, heatmaps, facets, themes, and more — all with worked solutions and runnable code."
keywords: "ggplot2 exercises, ggplot2 practice problems, ggplot2 exercises with solutions, R visualization exercises, ggplot2 coding practice"
auto_link_terms: "ggplot2 exercises|ggplot2 practice problems"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: E3.1
post_type: EX
sidebar_title: "ggplot2 (15 problems)"
fr_parent: ggplot2-Getting-Started.html
difficulty: "Intermediate"
---

# ggplot2 Exercises: 15 Chart-Building Practice Problems (With Solutions)

<p class="lead">Fifteen hands-on ggplot2 exercises covering scatter plots, bar charts, line charts, heatmaps, facets, themes, and more — each with a worked solution and runnable code.</p>

## Introduction

Reading about ggplot2 is useful. Writing ggplot2 code without looking at notes is how you actually learn it.

These 15 exercises cover the full core ggplot2 toolkit — geoms, aesthetics, scales, facets, themes, and coordinate systems — using built-in R datasets so no data download is needed. Each exercise has a clear goal, optional hints, and a complete worked solution.

Work through them in order (they progress from easier to harder) or jump to the topics you want to reinforce.

**All exercises use only base R datasets** — `mtcars`, `iris`, `airquality`, `mpg`, `diamonds`, `economics` — so you can run them anywhere.

---

## Exercise 1: Basic Scatter Plot

**Dataset:** `iris`

**Task:** Create a scatter plot of `Sepal.Length` (x) vs `Petal.Length` (y). Color points by `Species`. Set point size to 3 and transparency to 0.7.

**Expected output:** Three colored clusters of points, clearly separated by species.

```r
library(ggplot2)

# Your code here
# Hint: use aes(color = Species) inside ggplot()

p1 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.7)
p1
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

p1 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.7) +
  scale_color_manual(values = c("#E69F00", "#56B4E9", "#009E73")) +
  labs(
    title = "Sepal vs Petal Length by Species",
    x     = "Sepal Length (cm)",
    y     = "Petal Length (cm)"
  ) +
  theme_minimal()
p1
```

</details>

---

## Exercise 2: Scatter Plot with Trend Line

**Dataset:** `mtcars`

**Task:** Create a scatter plot of `wt` (x) vs `mpg` (y). Add a linear regression smooth line (`method = "lm"`) with a 95% confidence band. Color the points by `cyl` (treated as a factor).

```r
# Your code here
# Hint: factor(cyl) converts cyl to discrete for coloring
# Hint: geom_smooth(method = "lm", formula = y ~ x)
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3, alpha = 0.8) +
  geom_smooth(method = "lm", formula = y ~ x,
              color = "grey30", se = TRUE, linewidth = 0.8) +
  scale_color_manual(
    values = c("4" = "#2196F3", "6" = "#FF9800", "8" = "#F44336"),
    labels = c("4 cyl", "6 cyl", "8 cyl")
  ) +
  labs(
    title  = "Car Weight vs Fuel Efficiency",
    x      = "Weight (1,000 lbs)", y = "Miles per Gallon",
    color  = "Cylinders",
    caption = "Shaded area = 95% confidence interval"
  ) +
  theme_minimal()
```

</details>

---

## Exercise 3: Ordered Bar Chart

**Dataset:** `mpg` (from ggplot2)

**Task:** Compute the average highway MPG (`hwy`) for each `manufacturer`. Create a horizontal bar chart ordered from highest to lowest average MPG. Show bars in a single color of your choice.

```r
# Hint: use dplyr to summarise, then reorder()
# Hint: coord_flip() for horizontal bars
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(dplyr)

mpg_avg <- mpg |>
  group_by(manufacturer) |>
  summarise(avg_hwy = mean(hwy)) |>
  mutate(manufacturer = reorder(manufacturer, avg_hwy))

ggplot(mpg_avg, aes(x = manufacturer, y = avg_hwy)) +
  geom_col(fill = "#1565C0", alpha = 0.85, width = 0.7) +
  coord_flip() +
  labs(
    title = "Average Highway MPG by Manufacturer",
    x = NULL, y = "Average Highway MPG"
  ) +
  theme_minimal()
```

</details>

---

## Exercise 4: Grouped Bar Chart

**Dataset:** `mtcars`

**Task:** Create a grouped bar chart showing the average `mpg` for each combination of `cyl` (x-axis) and `am` (0 = automatic, 1 = manual, used for fill grouping). Use `position_dodge()`.

```r
# Hint: am should be a factor for discrete fill
# Hint: position_dodge(0.8) separates grouped bars
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(dplyr)

mt_sum <- mtcars |>
  group_by(cyl, am) |>
  summarise(avg_mpg = mean(mpg), .groups = "drop") |>
  mutate(
    cyl = paste(cyl, "cylinders"),
    am  = factor(am, labels = c("Automatic", "Manual"))
  )

ggplot(mt_sum, aes(x = cyl, y = avg_mpg, fill = am)) +
  geom_col(position = position_dodge(0.8), width = 0.7, alpha = 0.9) +
  scale_fill_manual(values = c("Automatic" = "#FF9800", "Manual" = "#1565C0")) +
  labs(
    title = "Average MPG: Automatic vs Manual by Cylinder Count",
    x = NULL, y = "Average MPG", fill = "Transmission"
  ) +
  theme_minimal()
```

</details>

---

## Exercise 5: Time Series Line Chart

**Dataset:** `economics` (from ggplot2)

**Task:** Plot `unemploy` (number unemployed) over `date` as a line chart. Add a horizontal reference line at the mean of `unemploy`. Color the area below the line using `geom_area()`.

```r
# Hint: geom_area(alpha = 0.2) fills under the line
# Hint: geom_hline(yintercept = mean(economics$unemploy), ...)
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

mean_unemploy <- mean(economics$unemploy)

ggplot(economics, aes(x = date, y = unemploy)) +
  geom_area(fill = "#1565C0", alpha = 0.2) +
  geom_line(color = "#1565C0", linewidth = 0.8) +
  geom_hline(yintercept = mean_unemploy, linetype = "dashed",
             color = "#C62828", linewidth = 0.7) +
  annotate("text", x = min(economics$date), y = mean_unemploy + 300,
           label = paste0("Mean: ", round(mean_unemploy/1000, 0), "K"),
           color = "#C62828", hjust = 0, size = 3.5) +
  scale_y_continuous(labels = function(x) paste0(x/1000, "K")) +
  labs(
    title = "US Unemployment Over Time",
    x = NULL, y = "Unemployed (thousands)"
  ) +
  theme_minimal()
```

</details>

---

## Exercise 6: Faceted Line Chart

**Dataset:** `airquality`

**Task:** For each month (5-9), plot `Temp` (y) vs day number (x) as a line. Use `facet_wrap(~ Month)` with 1 row. Give each month a descriptive label using `labeller`.

```r
# Hint: airquality already has Day and Month columns
# Hint: labeller = labeller(Month = c("5"="May","6"="Jun",...))
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

month_labels <- c("5" = "May", "6" = "Jun", "7" = "Jul",
                  "8" = "Aug", "9" = "Sep")

ggplot(airquality, aes(x = Day, y = Temp)) +
  geom_line(color = "#E53935", linewidth = 0.7) +
  geom_smooth(method = "loess", formula = y ~ x,
              se = FALSE, color = "grey40", linewidth = 0.5, linetype = "dashed") +
  facet_wrap(~ Month, nrow = 1,
             labeller = labeller(Month = month_labels)) +
  labs(
    title = "Daily Temperature by Month (New York 1973)",
    x = "Day of Month", y = "Temperature (°F)"
  ) +
  theme_minimal() +
  theme(strip.text = element_text(face = "bold"))
```

</details>

---

## Exercise 7: Histogram with Density Curve

**Dataset:** `diamonds` (from ggplot2)

**Task:** Plot a histogram of `price` (log10-transformed for readability). Overlay a density curve using `geom_density()`. Use `aes(y = after_stat(density))` to put histogram and density on the same scale.

```r
# Hint: scale_x_log10() transforms the x axis
# Hint: after_stat(density) rescales histogram counts to density
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

ggplot(diamonds, aes(x = price)) +
  geom_histogram(aes(y = after_stat(density)),
                 bins = 50, fill = "#1565C0", alpha = 0.6, color = "white") +
  geom_density(color = "#C62828", linewidth = 1) +
  scale_x_log10(labels = scales::dollar) +
  labs(
    title    = "Diamond Price Distribution (log10 scale)",
    subtitle = "Histogram with overlaid density curve",
    x        = "Price (log10 scale)", y = "Density"
  ) +
  theme_minimal()
```

</details>

---

## Exercise 8: Boxplot with Jitter

**Dataset:** `iris`

**Task:** Create a boxplot of `Sepal.Width` for each `Species`. Overlay individual data points using `geom_jitter()`. Color by Species, use a custom palette.

```r
# Hint: add geom_jitter() after geom_boxplot()
# Hint: width = 0.2 in geom_jitter() reduces horizontal spread
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

ggplot(iris, aes(x = Species, y = Sepal.Width, fill = Species, color = Species)) +
  geom_boxplot(alpha = 0.3, outlier.shape = NA, width = 0.5) +
  geom_jitter(width = 0.15, alpha = 0.6, size = 1.8) +
  scale_fill_manual(values  = c("#E69F00", "#56B4E9", "#009E73")) +
  scale_color_manual(values = c("#E69F00", "#56B4E9", "#009E73")) +
  labs(
    title = "Sepal Width Distribution by Species",
    x = NULL, y = "Sepal Width (cm)"
  ) +
  theme_minimal() +
  theme(legend.position = "none")
```

</details>

---

## Exercise 9: Heatmap

**Dataset:** `airquality`

**Task:** Create a heatmap showing average daily temperature by month (rows) and week of month (columns). Compute week of month as `ceiling(Day / 7)`. Use `geom_tile()` with a sequential blue color scale.

```r
# Hint: mutate(Week = ceiling(Day / 7))
# Hint: scale_fill_gradient(low = "white", high = "#1565C0")
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(dplyr)

air_heat <- airquality |>
  mutate(
    Week      = ceiling(Day / 7),
    Month_lab = month.abb[Month]
  ) |>
  group_by(Month_lab, Week) |>
  summarise(avg_temp = mean(Temp, na.rm = TRUE), .groups = "drop")

air_heat$Month_lab <- factor(air_heat$Month_lab,
                             levels = month.abb[5:9])

ggplot(air_heat, aes(x = factor(Week), y = Month_lab, fill = avg_temp)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_gradient(low = "#E3F2FD", high = "#1565C0", name = "°F") +
  labs(
    title = "Average Temperature by Month and Week",
    x     = "Week of Month", y = NULL
  ) +
  theme_minimal() +
  theme(panel.grid = element_blank())
```

</details>

---

## Exercise 10: Faceted Scatter Plot

**Dataset:** `mpg`

**Task:** Create scatter plots of `displ` (x) vs `hwy` (y) faceted by `drv` (drive type). Add a LOESS smooth to each facet. Use `facet_grid(drv ~ .)` for a vertical layout.

```r
# Hint: facet_grid(drv ~ .) creates one row per drv level
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

drv_labels <- c("4" = "4-Wheel Drive", "f" = "Front-Wheel", "r" = "Rear-Wheel")

ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5, color = "#1565C0") +
  geom_smooth(method = "loess", formula = y ~ x,
              color = "#C62828", se = FALSE, linewidth = 0.8) +
  facet_grid(drv ~ ., labeller = labeller(drv = drv_labels)) +
  labs(
    title = "Engine Displacement vs Highway MPG by Drive Type",
    x     = "Displacement (L)", y = "Highway MPG"
  ) +
  theme_minimal() +
  theme(strip.text.y = element_text(face = "bold"))
```

</details>

---

## Exercise 11: Lollipop Chart

**Dataset:** `mtcars`

**Task:** Compute the average `qsec` (quarter-mile time) per number of cylinders. Create a horizontal lollipop chart ordered by `qsec` descending (slowest cars at top). Color lollipops by whether `qsec` is above or below the overall mean.

```r
# Hint: geom_segment(aes(x = cyl, xend = cyl, y = mean_qsec, yend = qsec))
#       where mean_qsec is the overall mean (reference line)
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(dplyr)

qsec_df <- mtcars |>
  group_by(cyl) |>
  summarise(avg_qsec = mean(qsec)) |>
  mutate(
    cyl   = paste(cyl, "cylinders"),
    cyl   = reorder(cyl, avg_qsec),
    above = avg_qsec >= mean(avg_qsec)
  )

mean_q <- mean(qsec_df$avg_qsec)

ggplot(qsec_df, aes(x = cyl, y = avg_qsec, color = above)) +
  geom_hline(yintercept = mean_q, linetype = "dashed", color = "grey50") +
  geom_segment(aes(x = cyl, xend = cyl, y = mean_q, yend = avg_qsec),
               linewidth = 0.9) +
  geom_point(size = 5) +
  scale_color_manual(values = c("TRUE" = "#1565C0", "FALSE" = "#C62828"),
                     guide = "none") +
  coord_flip() +
  labs(title = "Quarter-Mile Time by Cylinder Count",
       x = NULL, y = "Average Quarter-Mile Time (sec)") +
  theme_minimal()
```

</details>

---

## Exercise 12: Custom Theme

**Dataset:** `iris`

**Task:** Recreate the scatter plot from Exercise 1, but apply a fully custom theme. Requirements: dark grey background (#2b2b2b), white text, no gridlines, white axis lines, legend at bottom.

```r
# Hint: theme() with panel.background, text, axis.line, legend.position
# Hint: theme_dark() as a starting point, then override specific elements
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

dark_theme <- theme(
  plot.background  = element_rect(fill = "#2b2b2b", color = NA),
  panel.background = element_rect(fill = "#2b2b2b", color = NA),
  panel.grid       = element_blank(),
  axis.line        = element_line(color = "white", linewidth = 0.5),
  axis.text        = element_text(color = "white", size = 11),
  axis.title       = element_text(color = "white", size = 12),
  plot.title       = element_text(color = "white", face = "bold", size = 14),
  legend.background = element_rect(fill = "#2b2b2b"),
  legend.text      = element_text(color = "white"),
  legend.title     = element_text(color = "white"),
  legend.position  = "bottom"
)

ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.8) +
  scale_color_manual(values = c("#F4A620", "#00B4D8", "#80B918")) +
  labs(title = "Iris Scatter Plot — Dark Theme",
       x = "Sepal Length (cm)", y = "Petal Length (cm)") +
  dark_theme
```

</details>

---

## Exercise 13: Stacked Area Chart

**Dataset:** `economics_long` (from ggplot2)

**Task:** Filter `economics_long` to the variables `unemploy` and `pop`. Plot a stacked area chart over time using `geom_area()` with `position = "stack"`. Use a two-color palette.

```r
# Hint: filter(variable %in% c("unemploy", "pop"))
# Hint: geom_area(aes(fill = variable), position = "stack")
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(dplyr)

econ_sub <- economics_long |>
  filter(variable %in% c("unemploy", "pop"))

ggplot(econ_sub, aes(x = date, y = value01, fill = variable)) +
  geom_area(position = "stack", alpha = 0.8) +
  scale_fill_manual(
    values = c("unemploy" = "#C62828", "pop" = "#1565C0"),
    labels = c("unemploy" = "Unemployment", "pop" = "Population (normalized)")
  ) +
  labs(
    title = "Stacked Area: US Economic Indicators",
    x = NULL, y = "Normalized Value (0-1)", fill = NULL
  ) +
  theme_minimal() +
  theme(legend.position = "top")
```

</details>

---

## Exercise 14: Annotated Plot

**Dataset:** `mtcars`

**Task:** Create a scatter plot of `wt` vs `mpg`. Label the 3 most fuel-efficient and 3 least fuel-efficient cars using `geom_text()` or `ggrepel::geom_text_repel()`. Add `geom_smooth(method = "lm")`.

```r
# Hint: slice_max(mpg, n = 3) and slice_min(mpg, n = 3)
# Hint: bind the two subsets, then label only those rows
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(ggrepel)
library(dplyr)

mt <- mtcars
mt$car <- rownames(mtcars)

top3    <- mt |> slice_max(mpg, n = 3)
bottom3 <- mt |> slice_min(mpg, n = 3)
labeled <- bind_rows(top3, bottom3)

mt$label <- ifelse(mt$car %in% labeled$car, mt$car, NA)

ggplot(mt, aes(x = wt, y = mpg)) +
  geom_point(alpha = 0.6, color = "steelblue", size = 3) +
  geom_smooth(method = "lm", formula = y ~ x, se = FALSE,
              color = "#C62828", linewidth = 1) +
  geom_text_repel(aes(label = label), size = 3, color = "grey20",
                  na.rm = TRUE, box.padding = 0.5) +
  labs(title = "Car Weight vs MPG (best and worst labeled)",
       x = "Weight (1,000 lbs)", y = "Miles per Gallon") +
  theme_minimal()
```

</details>

---

## Exercise 15: Complete Multi-Layer Plot

**Dataset:** `airquality`

**Task:** Create a polished chart showing the distribution of `Temp` by `Month`:
- Violin plot (outer shape) for distribution
- Boxplot inside (narrow, white, no outliers)
- Jittered points on top (small, semi-transparent)
- Color by month using a sequential palette
- Properly labeled with a clean theme

This combines everything — multiple geom layers, color scales, transparency, and theme customization.

```r
# Hint: use geom_violin() + geom_boxplot(width = 0.1) + geom_jitter()
# Hint: all three share aes(x = factor(Month), y = Temp)
```

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

airquality$Month_f <- factor(airquality$Month,
                              labels = c("May","Jun","Jul","Aug","Sep"))

ggplot(airquality, aes(x = Month_f, y = Temp, fill = Month_f)) +
  geom_violin(alpha = 0.4, trim = FALSE) +
  geom_boxplot(
    width = 0.1, fill = "white", color = "grey30",
    outlier.shape = NA
  ) +
  geom_jitter(
    aes(color = Month_f),
    width = 0.08, alpha = 0.5, size = 1.5
  ) +
  scale_fill_brewer(palette  = "YlOrRd", guide = "none") +
  scale_color_brewer(palette = "YlOrRd", guide = "none") +
  labs(
    title    = "Temperature Distribution by Month — New York 1973",
    subtitle = "Violin + boxplot + individual observations",
    x        = NULL,
    y        = "Temperature (°F)",
    caption  = "Source: airquality dataset (R base)"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold"),
    plot.subtitle = element_text(color = "grey50"),
    panel.grid.major.x = element_blank()
  )
```

</details>

---

## Summary

| # | Topic | Geoms / Concepts |
|---|-------|-----------------|
| 1 | Scatter plot | `geom_point()`, color aesthetics |
| 2 | Scatter + trend | `geom_smooth(method = "lm")` |
| 3 | Ordered bar chart | `geom_col()`, `reorder()`, `coord_flip()` |
| 4 | Grouped bar chart | `position_dodge()`, factor fill |
| 5 | Time series | `geom_line()`, `geom_area()`, `geom_hline()` |
| 6 | Faceted lines | `facet_wrap()`, `labeller` |
| 7 | Histogram + density | `after_stat(density)`, `geom_density()` |
| 8 | Boxplot + jitter | `geom_boxplot()`, `geom_jitter()` |
| 9 | Heatmap | `geom_tile()`, `scale_fill_gradient()` |
| 10 | Faceted scatter | `facet_grid()`, per-facet LOESS |
| 11 | Lollipop chart | `geom_segment()`, `geom_point()` |
| 12 | Custom theme | `theme()` elements, dark background |
| 13 | Stacked area | `geom_area(position = "stack")` |
| 14 | Annotated scatter | `geom_text_repel()`, `annotate()` |
| 15 | Multi-layer violin | `geom_violin()`, `geom_boxplot()`, `geom_jitter()` |

## Continue Learning

- **ggplot2 Getting Started** — the full ggplot2 grammar explained from the ground up
- **ggplot2 Themes in R** — master `theme()` to create professional publication-ready plots
- **ggplot2 Scales** — control color, size, shape, and axis scales precisely
