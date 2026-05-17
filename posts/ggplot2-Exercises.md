---
title: "ggplot2 Exercises: 15 Chart-Building Practice Problems (With Solutions)"
slug: "ggplot2-Exercises"
description: "Practice ggplot2 with 15 chart-building exercises. Problems cover scatter plots, bar charts, line charts, heatmaps, facets, themes, and more, all with worked solutions and runnable code."
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
exercise_count: 15
time_estimate_min: 50
---

# ggplot2 Exercises: 15 Chart-Building Practice Problems (With Solutions)

<p class="lead">Fifteen hands-on ggplot2 exercises covering scatter plots, bar charts, line charts, heatmaps, facets, themes, and more, each with a worked solution and runnable code.</p>

Reading about ggplot2 is useful. Writing ggplot2 code without looking at notes is how you actually learn it. These 15 problems cover the full core ggplot2 toolkit, geoms, aesthetics, scales, facets, themes, and coordinate systems, using built-in R datasets so no data download is needed.

The 15 problems are grouped into three sections of five. Section 1 builds single-geom charts one concept at a time. Section 2 mixes facets, transformed scales, and combined geoms. Section 3 stitches multiple layers, custom themes, and annotations into the kind of polished charts you build on the job. Every problem ships with an expected result, two progressive hints, and a hidden solution with an explanation.

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(scales)
library(ggrepel)
```

All code runs in one shared R session, so the setup block above loads the packages once and the exercises do not repeat it. Use `ex_` prefixed names (already scaffolded) so you do not overwrite anything by accident. Every exercise uses only base R datasets or datasets bundled with ggplot2 (`mtcars`, `iris`, `airquality`, `mpg`, `diamonds`, `economics`, `economics_long`), so you can run them anywhere.

## Section 1. Single-geom charts: scatter, bar, and line basics

These five problems build one chart with one or two geoms at a time.

### Exercise 1.1: Basic scatter plot colored by group

**Task:** Using `iris`, create a scatter plot of `Sepal.Length` (x) versus `Petal.Length` (y), with points colored by `Species`. Set point size to 3 and transparency (`alpha`) to 0.7, add a manual color palette, axis labels, a title, and `theme_minimal()`. Save the plot object to `ex_1_1`.

**Expected result:**

```
A scatter plot of sepal length versus petal length showing three colored point clusters, one per iris species, clearly separated.
```

**Difficulty:** Beginner

[HINTS]
The grouping variable that decides each point's color belongs inside the aesthetic mapping, not in the geom.
Put `color = Species` inside `aes()`, draw points with `geom_point(size = 3, alpha = 0.7)`, then add `scale_color_manual()`, `labs()`, and `theme_minimal()`.

```r title="Your turn"
ex_1_1 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.7) +
  scale_color_manual(values = c("#E69F00", "#56B4E9", "#009E73")) +
  labs(
    title = "Sepal vs Petal Length by Species",
    x     = "Sepal Length (cm)",
    y     = "Petal Length (cm)"
  ) +
  theme_minimal()
ex_1_1
```

**Explanation:** Mapping `color = Species` inside `aes()` ties the color to the data, so ggplot2 draws one color per species and adds a legend automatically. `scale_color_manual()` overrides the default palette with three colorblind-safe hues. `geom_point()` arguments outside `aes()` (`size`, `alpha`) are fixed values, not data-driven. The three species form visibly separate clusters, which is why `iris` is the classic classification demo.

</details>

### Exercise 1.2: Scatter plot with a regression trend line

**Task:** Using `mtcars`, create a scatter plot of `wt` (x) versus `mpg` (y), with points colored by `cyl` treated as a factor. Add a linear regression smooth line (`method = "lm"`) with a 95% confidence band, a manual color palette, and labels. Save the plot object to `ex_1_2`.

**Expected result:**

```
A scatter plot of car weight versus miles per gallon with points colored by cylinder count and a straight downward-sloping regression line with a shaded confidence band.
```

**Difficulty:** Beginner

[HINTS]
Treat the cylinder count as a discrete category before mapping it to color, and the trend line is its own layer added on top of the points.
Use `color = factor(cyl)` in `aes()`, then add `geom_smooth(method = "lm", formula = y ~ x, se = TRUE)`.

```r title="Your turn"
ex_1_2 <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
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
ex_1_2
```

**Explanation:** `factor(cyl)` converts the numeric cylinder count into a discrete variable, so ggplot2 uses a categorical color scale instead of a continuous gradient. `geom_smooth(method = "lm")` fits an ordinary least-squares line; `se = TRUE` draws the shaded 95% confidence band. The line slopes downward because heavier cars get fewer miles per gallon.

</details>

### Exercise 1.3: Ordered horizontal bar chart

**Task:** From the `mpg` dataset, compute the average highway MPG (`hwy`) for each `manufacturer`, then build a horizontal bar chart ordered from highest to lowest average MPG, all bars in a single color. Save the plot object to `ex_1_3`.

**Expected result:**

```
A horizontal bar chart of average highway MPG per manufacturer, with bars sorted longest at the top down to shortest.
```

**Difficulty:** Beginner

[HINTS]
Summarise the data to one row per manufacturer first, and a bar chart only sorts cleanly if the category is converted to an ordered factor by the value you want to sort on.
Use `group_by()` + `summarise()`, then `reorder(manufacturer, avg_hwy)`, plot with `geom_col()`, and flip to horizontal with `coord_flip()`.

```r title="Your turn"
mpg_avg <- mpg |>
  group_by(manufacturer) |>
  summarise(avg_hwy = mean(hwy)) |>
  mutate(manufacturer = reorder(manufacturer, avg_hwy))

ex_1_3 <- ggplot(mpg_avg, aes(x = manufacturer, y = avg_hwy)) +
  # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_avg <- mpg |>
  group_by(manufacturer) |>
  summarise(avg_hwy = mean(hwy)) |>
  mutate(manufacturer = reorder(manufacturer, avg_hwy))

ex_1_3 <- ggplot(mpg_avg, aes(x = manufacturer, y = avg_hwy)) +
  geom_col(fill = "#1565C0", alpha = 0.85, width = 0.7) +
  coord_flip() +
  labs(
    title = "Average Highway MPG by Manufacturer",
    x = NULL, y = "Average Highway MPG"
  ) +
  theme_minimal()
ex_1_3
```

**Explanation:** `geom_col()` draws bars whose heights are the values in the data, unlike `geom_bar()` which counts rows. `reorder(manufacturer, avg_hwy)` turns the manufacturer into an ordered factor sorted by average MPG, so the bars come out ranked. `coord_flip()` swaps the axes to make a horizontal chart, which keeps the manufacturer labels readable.

</details>

### Exercise 1.4: Grouped bar chart with dodged bars

**Task:** From `mtcars`, build a grouped bar chart of average `mpg` for each combination of `cyl` (x-axis) and `am` (transmission, used for fill). Treat `am` as a factor labeled Automatic / Manual, and separate the grouped bars with `position_dodge()`. Save the plot object to `ex_1_4`.

**Expected result:**

```
A grouped bar chart with one pair of side-by-side bars (automatic and manual) for each cylinder count, comparing average MPG.
```

**Difficulty:** Beginner

[HINTS]
The variable that splits each x-position into multiple bars must be a discrete factor mapped to fill, and the bars need to be told to sit next to each other rather than stack.
Map `fill = am` (as a factor), then set `position = position_dodge(0.8)` inside `geom_col()`.

```r title="Your turn"
mt_sum <- mtcars |>
  group_by(cyl, am) |>
  summarise(avg_mpg = mean(mpg), .groups = "drop") |>
  mutate(
    cyl = paste(cyl, "cylinders"),
    am  = factor(am, labels = c("Automatic", "Manual"))
  )

ex_1_4 <- ggplot(mt_sum, aes(x = cyl, y = avg_mpg, fill = am)) +
  # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt_sum <- mtcars |>
  group_by(cyl, am) |>
  summarise(avg_mpg = mean(mpg), .groups = "drop") |>
  mutate(
    cyl = paste(cyl, "cylinders"),
    am  = factor(am, labels = c("Automatic", "Manual"))
  )

ex_1_4 <- ggplot(mt_sum, aes(x = cyl, y = avg_mpg, fill = am)) +
  geom_col(position = position_dodge(0.8), width = 0.7, alpha = 0.9) +
  scale_fill_manual(values = c("Automatic" = "#FF9800", "Manual" = "#1565C0")) +
  labs(
    title = "Average MPG: Automatic vs Manual by Cylinder Count",
    x = NULL, y = "Average MPG", fill = "Transmission"
  ) +
  theme_minimal()
ex_1_4
```

**Explanation:** `geom_col()` defaults to stacking bars with the same x-value; `position_dodge(0.8)` places them side by side instead, so you can compare automatic against manual within each cylinder group. `factor(am, labels = ...)` swaps the raw 0/1 codes for readable labels. `scale_fill_manual()` assigns a fixed color to each transmission type.

</details>

### Exercise 1.5: Time series line chart with a reference line

**Task:** From the `economics` dataset, plot `unemploy` (number unemployed) over `date` as a line chart. Shade the area below the line with `geom_area()`, add a dashed horizontal reference line at the mean of `unemploy`, annotate that line with its value, and format the y-axis in thousands. Save the plot object to `ex_1_5`.

**Expected result:**

```
A line chart of US unemployment over time with the area under the line shaded and a dashed horizontal line marking the long-run mean.
```

**Difficulty:** Beginner

[HINTS]
A horizontal reference line is a separate layer that needs a single y-value, and the shaded fill below the line is also its own geom drawn before the line.
Add `geom_area(alpha = 0.2)` then `geom_line()`, and place the reference with `geom_hline(yintercept = mean(economics$unemploy))`.

```r title="Your turn"
mean_unemploy <- mean(economics$unemploy)

ex_1_5 <- ggplot(economics, aes(x = date, y = unemploy)) +
  # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mean_unemploy <- mean(economics$unemploy)

ex_1_5 <- ggplot(economics, aes(x = date, y = unemploy)) +
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
ex_1_5
```

**Explanation:** `geom_area()` fills the region between the line and the x-axis; drawing it before `geom_line()` keeps the line crisp on top. `geom_hline()` adds a constant horizontal reference at `yintercept`. `annotate()` places a one-off text label at fixed coordinates without needing a data column. `scale_y_continuous(labels = ...)` reformats the axis tick text into a compact "K" notation.

</details>

## Section 2. Facets, transformed scales, and combined geoms

These five problems combine two or more concepts: faceting, scale transforms, and layered geoms.

### Exercise 2.1: Faceted line chart with a labeller

**Task:** From `airquality`, plot daily `Temp` (y) against `Day` (x) as a line, one panel per `Month` arranged in a single row with `facet_wrap()`. Replace the numeric month codes with month names using a `labeller`, and add a dashed LOESS smooth in each panel. Save the plot object to `ex_2_1`.

**Expected result:**

```
A row of five line-chart panels, one per month from May to September, each showing daily temperature with a dashed smoothed trend.
```

**Difficulty:** Intermediate

[HINTS]
Each month should get its own panel, and the panels need readable names rather than the raw numeric codes.
Use `facet_wrap(~ Month, nrow = 1)` and pass `labeller = labeller(Month = ...)` with a named vector of month names.

```r title="Your turn"
month_labels <- c("5" = "May", "6" = "Jun", "7" = "Jul",
                  "8" = "Aug", "9" = "Sep")

ex_2_1 <- ggplot(airquality, aes(x = Day, y = Temp)) +
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
month_labels <- c("5" = "May", "6" = "Jun", "7" = "Jul",
                  "8" = "Aug", "9" = "Sep")

ex_2_1 <- ggplot(airquality, aes(x = Day, y = Temp)) +
  geom_line(color = "#E53935", linewidth = 0.7) +
  geom_smooth(method = "loess", formula = y ~ x,
              se = FALSE, color = "grey40", linewidth = 0.5, linetype = "dashed") +
  facet_wrap(~ Month, nrow = 1,
             labeller = labeller(Month = month_labels)) +
  labs(
    title = "Daily Temperature by Month (New York 1973)",
    x = "Day of Month", y = "Temperature (F)"
  ) +
  theme_minimal() +
  theme(strip.text = element_text(face = "bold"))
ex_2_1
```

**Explanation:** `facet_wrap(~ Month)` splits the data into one panel per month; `nrow = 1` forces them onto a single row for side-by-side comparison. The `labeller` argument with a named vector swaps the numeric facet titles for month abbreviations. `geom_smooth(method = "loess")` adds a locally weighted trend to each panel independently.

</details>

### Exercise 2.2: Histogram with an overlaid density curve

**Task:** From `diamonds`, plot a histogram of `price` on a log10-transformed x-axis. Overlay a density curve, and put both on the same vertical scale by mapping the histogram y-aesthetic to `after_stat(density)`. Save the plot object to `ex_2_2`.

**Expected result:**

```
A histogram of diamond price on a log10 x-axis with a smooth density curve overlaid on the same density scale.
```

**Difficulty:** Intermediate

[HINTS]
A raw histogram counts rows while a density curve integrates to one, so the histogram has to be rescaled to density before the two can share an axis.
Map `y = after_stat(density)` inside `geom_histogram()`, add `geom_density()`, and transform the x-axis with `scale_x_log10()`.

```r title="Your turn"
ex_2_2 <- ggplot(diamonds, aes(x = price)) +
  # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(diamonds, aes(x = price)) +
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
ex_2_2
```

**Explanation:** By default `geom_histogram()` plots counts on the y-axis, which dwarfs a density curve. Mapping `y = after_stat(density)` rescales the bars so their total area is 1, matching the density curve. `scale_x_log10()` compresses the heavily right-skewed price range so the distribution shape is visible. `after_stat()` is the modern replacement for the older `..density..` syntax.

</details>

### Exercise 2.3: Boxplot with jittered points

**Task:** From `iris`, create a boxplot of `Sepal.Width` for each `Species`, then overlay the individual observations with `geom_jitter()`. Color by species with a custom palette and hide the legend. Save the plot object to `ex_2_3`.

**Expected result:**

```
A boxplot of sepal width per iris species with the raw data points jittered on top of each box.
```

**Difficulty:** Intermediate

[HINTS]
Drawing the raw points on top of the boxes needs a second geom that spreads overlapping points horizontally so they do not pile up on one line.
Add `geom_jitter(width = 0.15)` after `geom_boxplot()`, and set `outlier.shape = NA` so outliers are not drawn twice.

```r title="Your turn"
ex_2_3 <- ggplot(iris, aes(x = Species, y = Sepal.Width, fill = Species, color = Species)) +
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(iris, aes(x = Species, y = Sepal.Width, fill = Species, color = Species)) +
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
ex_2_3
```

**Explanation:** `geom_jitter()` is `geom_point()` with a small random horizontal shift, which separates points that would otherwise stack on a single category line. Setting `outlier.shape = NA` on the boxplot stops outliers being plotted twice, once by the box and once by the jitter. The boxplot fill `alpha = 0.3` keeps the points visible through the boxes. `theme(legend.position = "none")` drops the redundant legend since the x-axis already names the species.

</details>

### Exercise 2.4: Heatmap with a sequential color scale

**Task:** From `airquality`, build a heatmap of average daily temperature, with `Month` on the rows and week-of-month on the columns. Compute the week as `ceiling(Day / 7)`, summarise the mean `Temp` per month-and-week cell, and draw the cells with `geom_tile()` using a sequential blue gradient. Save the plot object to `ex_2_4`.

**Expected result:**

```
A grid heatmap with months as rows and weeks as columns, each cell shaded from light to dark blue by average temperature.
```

**Difficulty:** Intermediate

[HINTS]
A heatmap needs the data pre-aggregated to one value per cell, then a geom that draws rectangles and a continuous fill scale that runs from light to dark.
Summarise to one row per month-week, draw with `geom_tile()`, and color with `scale_fill_gradient(low = ..., high = ...)`.

```r title="Your turn"
air_heat <- airquality |>
  mutate(
    Week      = ceiling(Day / 7),
    Month_lab = month.abb[Month]
  ) |>
  group_by(Month_lab, Week) |>
  summarise(avg_temp = mean(Temp, na.rm = TRUE), .groups = "drop")

air_heat$Month_lab <- factor(air_heat$Month_lab, levels = month.abb[5:9])

ex_2_4 <- ggplot(air_heat, aes(x = factor(Week), y = Month_lab, fill = avg_temp)) +
  # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
air_heat <- airquality |>
  mutate(
    Week      = ceiling(Day / 7),
    Month_lab = month.abb[Month]
  ) |>
  group_by(Month_lab, Week) |>
  summarise(avg_temp = mean(Temp, na.rm = TRUE), .groups = "drop")

air_heat$Month_lab <- factor(air_heat$Month_lab,
                             levels = month.abb[5:9])

ex_2_4 <- ggplot(air_heat, aes(x = factor(Week), y = Month_lab, fill = avg_temp)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_gradient(low = "#E3F2FD", high = "#1565C0", name = "F") +
  labs(
    title = "Average Temperature by Month and Week",
    x     = "Week of Month", y = NULL
  ) +
  theme_minimal() +
  theme(panel.grid = element_blank())
ex_2_4
```

**Explanation:** `geom_tile()` draws a colored rectangle for every x-y combination, which is exactly what a heatmap is. The data must be aggregated first, here `group_by()` + `summarise()` collapses each month-week pair to one mean temperature. `scale_fill_gradient()` maps that continuous value onto a two-point color ramp. The `factor()` on `Month_lab` fixes the row order to calendar order rather than alphabetical.

</details>

### Exercise 2.5: Faceted scatter plot with per-facet smoothing

**Task:** From `mpg`, create scatter plots of `displ` (x) versus `hwy` (y), faceted by `drv` (drive type) in a vertical layout using `facet_grid()`. Add a LOESS smooth to each facet and give the facets descriptive labels with a `labeller`. Save the plot object to `ex_2_5`.

**Expected result:**

```
Three stacked scatter-plot panels, one per drive type, each plotting engine displacement against highway MPG with its own smoothed trend.
```

**Difficulty:** Intermediate

[HINTS]
To stack the panels vertically, the faceting formula must put the variable on the row side and leave the column side empty.
Use `facet_grid(drv ~ .)` and pass `labeller = labeller(drv = ...)` with a named vector of drive-type labels.

```r title="Your turn"
drv_labels <- c("4" = "4-Wheel Drive", "f" = "Front-Wheel", "r" = "Rear-Wheel")

ex_2_5 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
drv_labels <- c("4" = "4-Wheel Drive", "f" = "Front-Wheel", "r" = "Rear-Wheel")

ex_2_5 <- ggplot(mpg, aes(x = displ, y = hwy)) +
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
ex_2_5
```

**Explanation:** `facet_grid(drv ~ .)` lays panels out in a grid where rows are `drv` levels and the dot means "no column variable", giving a single vertical stack. Unlike `facet_wrap()`, `facet_grid()` keeps panels aligned on shared axes, which makes comparing the three drive types straightforward. The `labeller` swaps cryptic codes for readable labels.

</details>

## Section 3. Layered, themed, and annotated plots

These five problems stitch multiple layers, custom themes, and annotations into the kind of polished charts you build on the job.

### Exercise 3.1: Lollipop chart with a conditional color rule

**Task:** From `mtcars`, compute the average `qsec` (quarter-mile time) per cylinder count. Build a horizontal lollipop chart ordered by `qsec`, with each lollipop colored by whether its value is above or below the overall mean, plus a dashed reference line at that mean. Save the plot object to `ex_3_1`.

**Expected result:**

```
A horizontal lollipop chart of average quarter-mile time per cylinder count, with stems and dots colored by whether they sit above or below the mean reference line.
```

**Difficulty:** Advanced

[HINTS]
A lollipop is a stem plus a dot, and the stem must run from the reference value to each data value rather than from zero.
Draw the stems with `geom_segment()` (from the mean to the value), add `geom_point()` for the heads, and flip with `coord_flip()`.

```r title="Your turn"
qsec_df <- mtcars |>
  group_by(cyl) |>
  summarise(avg_qsec = mean(qsec)) |>
  mutate(
    cyl   = paste(cyl, "cylinders"),
    cyl   = reorder(cyl, avg_qsec),
    above = avg_qsec >= mean(avg_qsec)
  )

mean_q <- mean(qsec_df$avg_qsec)

ex_3_1 <- ggplot(qsec_df, aes(x = cyl, y = avg_qsec, color = above)) +
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
qsec_df <- mtcars |>
  group_by(cyl) |>
  summarise(avg_qsec = mean(qsec)) |>
  mutate(
    cyl   = paste(cyl, "cylinders"),
    cyl   = reorder(cyl, avg_qsec),
    above = avg_qsec >= mean(avg_qsec)
  )

mean_q <- mean(qsec_df$avg_qsec)

ex_3_1 <- ggplot(qsec_df, aes(x = cyl, y = avg_qsec, color = above)) +
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
ex_3_1
```

**Explanation:** A lollipop chart is a leaner alternative to a bar chart: `geom_segment()` draws the thin stem from the mean reference line to each value, and `geom_point()` caps it with a dot. Mapping `color = above` (a logical) splits the lollipops into two colors via `scale_color_manual()`. `coord_flip()` makes the chart horizontal so the category labels stay readable.

</details>

### Exercise 3.2: Fully custom dark theme

**Task:** Recreate the iris scatter plot from Exercise 1.1, but apply a fully custom dark theme: a dark grey background (`#2b2b2b`), white text, no gridlines, white axis lines, and the legend at the bottom. Build the theme as a reusable `theme()` object. Save the plot object to `ex_3_2`.

**Expected result:**

```
The iris sepal-versus-petal scatter plot rendered on a dark grey background with white text, white axis lines, no gridlines, and the legend below the plot.
```

**Difficulty:** Advanced

[HINTS]
Every visual element of a plot, backgrounds, text, axis lines, legend position, is controlled by one function that takes element specifications.
Build a `theme()` object setting `panel.background`, `plot.background`, `panel.grid`, `axis.line`, the text elements, and `legend.position`.

```r title="Your turn"
dark_theme <- theme(
  # your code here
)

ex_3_2 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.8) +
  scale_color_manual(values = c("#F4A620", "#00B4D8", "#80B918")) +
  labs(title = "Iris Scatter Plot - Dark Theme",
       x = "Sepal Length (cm)", y = "Petal Length (cm)") +
  dark_theme
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
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

ex_3_2 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.8) +
  scale_color_manual(values = c("#F4A620", "#00B4D8", "#80B918")) +
  labs(title = "Iris Scatter Plot - Dark Theme",
       x = "Sepal Length (cm)", y = "Petal Length (cm)") +
  dark_theme
ex_3_2
```

**Explanation:** `theme()` controls every non-data element. Each argument takes an `element_*()` function: `element_rect()` for filled boxes, `element_line()` for lines, `element_text()` for text, and `element_blank()` to remove an element entirely. Assigning the result to `dark_theme` makes it a reusable object you can add to any plot, which is how you enforce a consistent house style across a report.

</details>

### Exercise 3.3: Stacked area chart over time

**Task:** Filter `economics_long` to the `unemploy` and `pop` variables, then plot a stacked area chart of their normalized values (`value01`) over `date`, using `geom_area()` with `position = "stack"` and a two-color palette. Save the plot object to `ex_3_3`.

**Expected result:**

```
A stacked area chart over time with two colored bands, unemployment and population, layered on top of each other.
```

**Difficulty:** Advanced

[HINTS]
A stacked area chart needs the data in long format with one column naming the series, and the bands have to be told to pile up rather than overlap.
Filter to the two variables, then `geom_area(aes(fill = variable), position = "stack")`.

```r title="Your turn"
econ_sub <- economics_long |>
  filter(variable %in% c("unemploy", "pop"))

ex_3_3 <- ggplot(econ_sub, aes(x = date, y = value01, fill = variable)) +
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
econ_sub <- economics_long |>
  filter(variable %in% c("unemploy", "pop"))

ex_3_3 <- ggplot(econ_sub, aes(x = date, y = value01, fill = variable)) +
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
ex_3_3
```

**Explanation:** `economics_long` is the tidy (long) form of `economics`, with a `variable` column naming each series, which is the shape ggplot2 wants for a multi-series chart. `geom_area(position = "stack")` piles the bands on top of one another so the top edge shows the combined total. `value01` is the pre-normalized 0-1 version of each series, which keeps the two bands on a comparable scale.

</details>

### Exercise 3.4: Annotated scatter plot labeling extreme points

**Task:** From `mtcars`, create a scatter plot of `wt` versus `mpg`, label the three most and three least fuel-efficient cars with `ggrepel::geom_text_repel()`, and add a linear `geom_smooth()`. Build a `label` column that is the car name only for those six rows and `NA` everywhere else. Save the plot object to `ex_3_4`.

**Expected result:**

```
A scatter plot of car weight versus MPG with a regression line and text labels marking only the three most and three least efficient cars.
```

**Difficulty:** Advanced

[HINTS]
Labeling only the extremes means most rows get no label, and the labels must be nudged apart so they do not overlap each other or the points.
Pick the extremes with `slice_max()` / `slice_min()`, build a `label` column with `ifelse()`, and place labels with `geom_text_repel(na.rm = TRUE)`.

```r title="Your turn"
mt <- mtcars
mt$car <- rownames(mtcars)

top3    <- mt |> slice_max(mpg, n = 3)
bottom3 <- mt |> slice_min(mpg, n = 3)
labeled <- bind_rows(top3, bottom3)

mt$label <- ifelse(mt$car %in% labeled$car, mt$car, NA)

ex_3_4 <- ggplot(mt, aes(x = wt, y = mpg)) +
  # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars
mt$car <- rownames(mtcars)

top3    <- mt |> slice_max(mpg, n = 3)
bottom3 <- mt |> slice_min(mpg, n = 3)
labeled <- bind_rows(top3, bottom3)

mt$label <- ifelse(mt$car %in% labeled$car, mt$car, NA)

ex_3_4 <- ggplot(mt, aes(x = wt, y = mpg)) +
  geom_point(alpha = 0.6, color = "steelblue", size = 3) +
  geom_smooth(method = "lm", formula = y ~ x, se = FALSE,
              color = "#C62828", linewidth = 1) +
  geom_text_repel(aes(label = label), size = 3, color = "grey20",
                  na.rm = TRUE, box.padding = 0.5) +
  labs(title = "Car Weight vs MPG (best and worst labeled)",
       x = "Weight (1,000 lbs)", y = "Miles per Gallon") +
  theme_minimal()
ex_3_4
```

**Explanation:** Labeling every point would clutter the chart, so a `label` column is built that holds the car name only for the six extreme rows and `NA` for the rest. `geom_text_repel()` from the ggrepel package draws those labels and automatically nudges them apart so they do not collide; `na.rm = TRUE` quietly skips the `NA` rows. `box.padding` controls how far labels are pushed off their points.

</details>

### Exercise 3.5: Multi-layer violin, box, and jitter plot

**Task:** From `airquality`, build a polished chart of the distribution of `Temp` by `Month`. Layer three geoms: a violin plot for the distribution shape, a narrow white boxplot inside it, and jittered points on top. Color by month with a sequential palette, label it cleanly, and apply a custom theme. Save the plot object to `ex_3_5`.

**Expected result:**

```
One violin per month with a slim white boxplot nested inside and semi-transparent jittered points overlaid, showing the temperature distribution.
```

**Difficulty:** Advanced

[HINTS]
Three geoms drawn over the same x-y mapping stack from back to front, so the widest shape goes down first and the narrowest detail last.
Layer `geom_violin()`, then a narrow `geom_boxplot(width = 0.1)`, then `geom_jitter()`, all sharing `aes(x = Month_f, y = Temp)`.

```r title="Your turn"
airquality$Month_f <- factor(airquality$Month,
                             labels = c("May","Jun","Jul","Aug","Sep"))

ex_3_5 <- ggplot(airquality, aes(x = Month_f, y = Temp, fill = Month_f)) +
  # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
airquality$Month_f <- factor(airquality$Month,
                              labels = c("May","Jun","Jul","Aug","Sep"))

ex_3_5 <- ggplot(airquality, aes(x = Month_f, y = Temp, fill = Month_f)) +
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
    title    = "Temperature Distribution by Month - New York 1973",
    subtitle = "Violin + boxplot + individual observations",
    x        = NULL,
    y        = "Temperature (F)",
    caption  = "Source: airquality dataset (R base)"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold"),
    plot.subtitle = element_text(color = "grey50"),
    panel.grid.major.x = element_blank()
  )
ex_3_5
```

**Explanation:** Layer order matters: the wide `geom_violin()` is drawn first as the background, the slim `geom_boxplot(width = 0.1)` sits inside it to show quartiles, and `geom_jitter()` adds the raw points on top. The violin shows the full distribution shape, the box gives the summary statistics, and the points show sample size and outliers, three views of the same data in one chart. `scale_*_brewer()` applies a ColorBrewer sequential palette and `guide = "none"` drops the redundant legend.

</details>

## Summary

The 15 problems together exercise the full core ggplot2 toolkit, geoms, aesthetics, scales, facets, themes, and coordinate systems.

| # | Topic | Geoms / Concepts |
|---|-------|-----------------|
| 1.1 | Scatter plot | `geom_point()`, color aesthetics |
| 1.2 | Scatter + trend | `geom_smooth(method = "lm")` |
| 1.3 | Ordered bar chart | `geom_col()`, `reorder()`, `coord_flip()` |
| 1.4 | Grouped bar chart | `position_dodge()`, factor fill |
| 1.5 | Time series | `geom_line()`, `geom_area()`, `geom_hline()` |
| 2.1 | Faceted lines | `facet_wrap()`, `labeller` |
| 2.2 | Histogram + density | `after_stat(density)`, `geom_density()` |
| 2.3 | Boxplot + jitter | `geom_boxplot()`, `geom_jitter()` |
| 2.4 | Heatmap | `geom_tile()`, `scale_fill_gradient()` |
| 2.5 | Faceted scatter | `facet_grid()`, per-facet LOESS |
| 3.1 | Lollipop chart | `geom_segment()`, `geom_point()` |
| 3.2 | Custom theme | `theme()` elements, dark background |
| 3.3 | Stacked area | `geom_area(position = "stack")` |
| 3.4 | Annotated scatter | `geom_text_repel()`, conditional labels |
| 3.5 | Multi-layer violin | `geom_violin()`, `geom_boxplot()`, `geom_jitter()` |

If you built Sections 1 and 2 without peeking, you are comfortable with everyday ggplot2. If you built Section 3 too, you are ready for layered, publication-grade charts.

## FAQ

**Q: Why do my points all show the same color even though I set `color`?**
You probably set `color` outside `aes()`. A fixed value like `geom_point(color = "blue")` paints every point blue. To color by a variable, the mapping must go inside `aes()`, as in `aes(color = Species)`.

**Q: What is the difference between `geom_bar()` and `geom_col()`?**
`geom_bar()` counts the rows in each x category and uses the count as the bar height. `geom_col()` uses a y-value you already computed. If you have summarised your data, use `geom_col()`.

**Q: When should I use `facet_wrap()` versus `facet_grid()`?**
`facet_wrap()` lays panels out in a flowing grid based on one variable and is best for many levels. `facet_grid()` arranges panels by one variable on rows and another on columns, keeping axes aligned, and is best for a true two-way layout.

**Q: My `geom_smooth()` prints a message about the formula. How do I silence it?**
Pass the formula explicitly, for example `geom_smooth(method = "lm", formula = y ~ x)`. Every solution above does this so the message never appears.

**Q: How do I save a ggplot to a file?**
Use `ggsave("plot.png", plot = ex_1_1, width = 8, height = 5, dpi = 300)`. If you omit the `plot` argument, `ggsave()` saves the most recently displayed plot.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. [Link](https://ggplot2-book.org/)
2. ggplot2 documentation, function reference. [Link](https://ggplot2.tidyverse.org/reference/)
3. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 1: Data visualization. [Link](https://r4ds.hadley.nz/data-visualize.html)
4. Posit, Data visualization with ggplot2 cheatsheet. [Link](https://rstudio.github.io/cheatsheets/data-visualization.pdf)
5. ggrepel documentation, repelling text labels. [Link](https://ggrepel.slowkow.com/)

## Continue Learning

- [ggplot2 Getting Started](ggplot2-Getting-Started.html), the full ggplot2 grammar explained from the ground up
- [ggplot2 Themes in R](ggplot2-Themes.html), master `theme()` to create professional publication-ready plots
- [The Complete ggplot2 Tutorial](ggplot2-Tutorial-With-R.html), a top-to-bottom reference covering every chart type and customization
