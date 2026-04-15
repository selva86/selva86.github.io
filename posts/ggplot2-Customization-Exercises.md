---
title: "ggplot2 Customization Exercises: 10 Theme & Scale Practice Problems — Solved Step-by-Step"
slug: "ggplot2-Customization-Exercises"
description: "Practice ggplot2 customization with 10 theme and scale exercises. Covers theme(), element_text(), scale_color_brewer(), custom themes — all with runnable solutions."
keywords: "ggplot2 customization exercises, ggplot2 theme exercises, ggplot2 scale exercises, theme() practice problems, ggplot2 exercises with solutions, ggplot2 theme practice, scale_color_brewer exercises, custom ggplot2 theme practice"
auto_link_terms: "ggplot2 customization exercises|ggplot2 theme exercises|ggplot2 scale exercises|theme exercises R|ggplot2 customization practice|ggplot2 theme practice problems"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "E3.3"
post_type: "EX"
sidebar_title: "ggplot2 Customization (10 problems)"
fr_parent: "ggplot2-Themes-in-R.html"
---


# ggplot2 Customization Exercises: 10 Theme & Scale Practice Problems — Solved Step-by-Step

<p class="lead">Themes control how a ggplot2 chart looks — fonts, backgrounds, grid lines, legend placement — and scales control how data maps to colours, axis limits, and labels. These 10 exercises build your customization skills from basic theme swaps to a full reusable house style, each with runnable starter code and a step-by-step solution.</p>

## What Do Themes and Scales Control?

Themes and scales are the two customization layers in ggplot2. A theme changes the non-data elements — everything around your data points, bars, or lines. A scale changes how data values translate into visual properties like position, colour, and size.

Here's how a single plot transforms when you add one theme and one scale function. Run the code to see the before-and-after.

```r
library(ggplot2)
library(scales)

# Default ggplot2 styling
p_base <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  labs(
    title = "Fuel Efficiency vs Weight",
    x = "Weight (1000 lbs)",
    y = "Miles per Gallon",
    colour = "Cylinders"
  )
p_base
#> Scatter plot with grey background, default colours

# Now: one theme + one scale = a polished chart
p_styled <- p_base +
  theme_minimal(base_size = 13) +
  scale_colour_brewer(palette = "Set1")
p_styled
#> Same data, but clean background and vibrant categorical colours
```

The data didn't change — only the presentation did. `theme_minimal()` stripped the grey background and border, and `scale_colour_brewer()` replaced the default hue cycle with a ColorBrewer palette designed for readability.

Here's a quick reference for the functions you'll practice in these exercises.

| Customization | Function | Controls |
|---|---|---|
| Complete theme swap | `theme_minimal()`, `theme_classic()`, etc. | All non-data elements at once |
| Individual element | `theme(element = ...)` | One specific visual property |
| Text styling | `element_text(size, face, angle, colour)` | Fonts, rotation, colour |
| Background/border | `element_rect(fill, colour, linewidth)` | Rectangles (panels, legend, strips) |
| Line styling | `element_line(colour, linewidth, linetype)` | Grid lines, axis lines |
| Remove element | `element_blank()` | Delete any theme element |
| Categorical colour | `scale_colour_brewer(palette)` | Discrete colour palette |
| Manual colour | `scale_fill_manual(values)` | Hand-picked colours |
| Axis formatting | `scale_y_continuous(labels, limits, breaks)` | Numeric axis display |

[KEY INSIGHT]
**Themes change the stage, scales change the translation.** A theme is like redecorating the room your chart lives in. A scale is like changing the language your data speaks — a number becomes a dollar amount, a category becomes a specific colour.

**Try it:** Take `p_base` and apply `theme_classic()` with `scale_colour_brewer(palette = "Set2")`. How does the look change from the styled version above?

```r
# Try it: swap theme and palette
ex_swap <- p_base +
  # your code here
  NULL

ex_swap
#> Expected: clean axis lines, no grid, Set2 pastel colours
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_swap <- p_base +
  theme_classic(base_size = 13) +
  scale_colour_brewer(palette = "Set2")
ex_swap
#> Scatter with axis lines only, no grid, pastel Set2 palette
```

**Explanation:** `theme_classic()` removes grid lines and the background box, leaving only axis lines — a common journal style. `"Set2"` uses softer pastel tones compared to the bolder `"Set1"`.

</details>

## How Do You Switch and Layer Themes? (Exercises 1–3)

These first three exercises focus on `theme()` and its element functions. You'll apply built-in themes, remove elements with `element_blank()`, and style text with `element_text()`. Each exercise builds on a familiar built-in dataset.

### Exercise 1: Apply a Built-In Theme

**Dataset:** `mpg`

**Task:** Create a boxplot of `hwy` (y-axis) grouped by `class` (x-axis). Apply `theme_light()`. Add the title "Highway MPG by Vehicle Class" and label the axes "Vehicle Class" and "Highway MPG".

```r
# Exercise 1: boxplot with theme_light
p1 <- ggplot(mpg, aes(x = class, y = hwy)) +
  # your code here
  NULL

p1
#> Expected: boxplot with 7 classes, light theme, titled axes
```

<details>
<summary>Click to reveal solution</summary>

```r
p1 <- ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot(fill = "#7FB3D8") +
  theme_light() +
  labs(
    title = "Highway MPG by Vehicle Class",
    x = "Vehicle Class",
    y = "Highway MPG"
  )
p1
#> Boxplot: compact and subcompact have highest medians (~28-29),
#> pickups and SUVs lowest (~17). Light grey grid, white background.
```

**Explanation:** `theme_light()` gives a clean white background with subtle grey grid lines — less stark than `theme_bw()`, more structured than `theme_minimal()`. The `fill` argument colours the boxes, making group boundaries easier to see.

</details>

### Exercise 2: Remove Grid Lines and Style Line Elements

**Dataset:** `mtcars`

**Task:** Create a scatter plot of `wt` (x) vs `mpg` (y). Start with `theme_bw()`, then add `theme()` to:
1. Remove minor grid lines entirely
2. Change major grid lines to dashed, light grey (`"grey85"`)
3. Make the panel border thicker (linewidth 1.5)

```r
# Exercise 2: customize grid lines
p2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, colour = "#4B6FA5") +
  theme_bw() +
  theme(
    # your code here
  ) +
  labs(title = "Weight vs Fuel Efficiency", x = "Weight (1000 lbs)", y = "MPG")

p2
#> Expected: scatter with no minor grid, dashed major grid, thick border
```

<details>
<summary>Click to reveal solution</summary>

```r
p2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, colour = "#4B6FA5") +
  theme_bw() +
  theme(
    panel.grid.minor = element_blank(),
    panel.grid.major = element_line(colour = "grey85", linetype = "dashed"),
    panel.border = element_rect(colour = "black", linewidth = 1.5)
  ) +
  labs(title = "Weight vs Fuel Efficiency", x = "Weight (1000 lbs)", y = "MPG")
p2
#> Scatter plot: no minor grid, dashed light grey major grid,
#> thick black border. Heavier cars cluster at lower MPG.
```

**Explanation:** `element_blank()` removes an element completely — no line, no space. `element_line()` controls line properties: `linetype = "dashed"` draws dashes instead of solid lines, and `colour = "grey85"` makes them subtle. `element_rect()` styles rectangles like the panel border.

</details>

### Exercise 3: Customize Axis and Title Text

**Dataset:** `diamonds` (random sample of 500 rows)

**Task:** Create a bar chart counting diamonds by `cut`. Then customize the text:
1. Rotate x-axis labels 45 degrees (with `hjust = 1` for alignment)
2. Set the plot title to 16pt bold
3. Make axis titles 12pt and bold
4. Apply `theme_minimal()` as the base

```r
# Exercise 3: text customization
set.seed(42)
d_small <- diamonds[sample(nrow(diamonds), 500), ]

p3 <- ggplot(d_small, aes(x = cut)) +
  geom_bar(fill = "#A5C882") +
  theme_minimal() +
  theme(
    # your code here
  ) +
  labs(title = "Diamond Quality Distribution", x = "Cut Quality", y = "Count")

p3
#> Expected: bar chart with angled labels, bold title at 16pt, bold axis titles
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
d_small <- diamonds[sample(nrow(diamonds), 500), ]

p3 <- ggplot(d_small, aes(x = cut)) +
  geom_bar(fill = "#A5C882") +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    plot.title = element_text(size = 16, face = "bold"),
    axis.title = element_text(size = 12, face = "bold")
  ) +
  labs(title = "Diamond Quality Distribution", x = "Cut Quality", y = "Count")
p3
#> Bar chart: Ideal has the most diamonds, Fair the fewest.
#> X-axis labels angled at 45°, large bold title, bold axis titles.
```

**Explanation:** `axis.text.x` controls only x-axis tick labels. `angle = 45` rotates them, and `hjust = 1` right-aligns so they don't overlap the ticks. `plot.title` and `axis.title` each accept `element_text()` — `face = "bold"` makes text bold, `size` sets the point size.

</details>

[TIP]
**Always set hjust = 1 when angling x-axis labels.** Without it, the rotated text anchors at the centre and floats away from the tick marks. With `hjust = 1`, the right edge of each label sits directly above its tick.

## How Do You Control Colours with Scales? (Exercises 4–6)

Scales control the mapping between data values and visual properties. These exercises focus on colour and axis scales — the two you'll use most often when customizing real charts.

### Exercise 4: Apply a ColorBrewer Palette

**Dataset:** `iris`

**Task:** Create a scatter plot of `Sepal.Length` (x) vs `Petal.Length` (y), coloured by `Species`. Apply `scale_colour_brewer(palette = "Dark2")`. Set the legend title to "Iris Species" and apply `theme_minimal()`.

```r
# Exercise 4: ColorBrewer palette
p4 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, colour = Species)) +
  geom_point(size = 2.5) +
  # your code here
  labs(x = "Sepal Length (cm)", y = "Petal Length (cm)")

p4
#> Expected: scatter with 3 species in Dark2 colours, clean theme
```

<details>
<summary>Click to reveal solution</summary>

```r
p4 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, colour = Species)) +
  geom_point(size = 2.5) +
  scale_colour_brewer(palette = "Dark2") +
  theme_minimal() +
  labs(
    x = "Sepal Length (cm)",
    y = "Petal Length (cm)",
    colour = "Iris Species"
  )
p4
#> Scatter: setosa clusters bottom-left (short petals), virginica top-right.
#> Dark2 palette: teal, orange, purple — high contrast, colourblind-safe.
```

**Explanation:** `scale_colour_brewer()` picks a palette from the ColorBrewer project, designed by cartographers for visual clarity. `"Dark2"` is a qualitative palette — distinct, saturated colours for categorical data. The `colour` argument inside `labs()` renames the legend title.

</details>

### Exercise 5: Assign Custom Colours with scale_fill_manual

**Dataset:** `mtcars`

**Task:** Compute mean `mpg` by `cyl` using `aggregate()`. Create a bar chart (`geom_col`) of mean MPG per cylinder group with `fill = factor(cyl)`. Assign these exact colours:
- 4 cylinders → `"#2C7BB6"` (blue)
- 6 cylinders → `"#ABD9E9"` (light blue)
- 8 cylinders → `"#D7191C"` (red)

Apply `theme_minimal()` and remove the legend (it's redundant with the x-axis).

```r
# Exercise 5: custom fill colours
cyl_means <- aggregate(mpg ~ cyl, data = mtcars, FUN = mean)

p5 <- ggplot(cyl_means, aes(x = factor(cyl), y = mpg, fill = factor(cyl))) +
  geom_col() +
  # your code here
  labs(title = "Mean Fuel Efficiency by Cylinder Count",
       x = "Cylinders", y = "Mean MPG")

p5
#> Expected: 3 bars in blue, light blue, red — no legend
```

<details>
<summary>Click to reveal solution</summary>

```r
cyl_means <- aggregate(mpg ~ cyl, data = mtcars, FUN = mean)

p5 <- ggplot(cyl_means, aes(x = factor(cyl), y = mpg, fill = factor(cyl))) +
  geom_col() +
  scale_fill_manual(values = c("4" = "#2C7BB6", "6" = "#ABD9E9", "8" = "#D7191C")) +
  theme_minimal() +
  theme(legend.position = "none") +
  labs(
    title = "Mean Fuel Efficiency by Cylinder Count",
    x = "Cylinders",
    y = "Mean MPG"
  )
p5
#> 4-cyl: ~26.7 mpg (blue), 6-cyl: ~19.7 (light blue), 8-cyl: ~15.1 (red).
#> No legend — colour + x-axis labels tell the story.
```

**Explanation:** `scale_fill_manual()` accepts a named vector — each name matches a level of the fill variable, each value is a colour. Using named values ensures the right colour always maps to the right group, even if the data order changes. `legend.position = "none"` hides the legend when it's redundant.

</details>

### Exercise 6: Format Axis Labels and Set Limits

**Dataset:** `diamonds` (random sample of 1000 rows)

**Task:** Create a scatter plot of `carat` (x) vs `price` (y). Then:
1. Format the y-axis as dollars with commas using `scale_y_continuous(labels = scales::dollar)`
2. Set the x-axis range from 0 to 3 using `scale_x_continuous(limits = ...)`
3. Apply `theme_light()`

```r
# Exercise 6: axis formatting
set.seed(99)
d_sample <- diamonds[sample(nrow(diamonds), 1000), ]

p6 <- ggplot(d_sample, aes(x = carat, y = price)) +
  geom_point(alpha = 0.4, colour = "#4B6FA5") +
  # your code here
  labs(title = "Diamond Price vs Carat", x = "Carat Weight", y = "Price")

p6
#> Expected: scatter with $ y-axis labels, x-axis 0-3, light theme
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
d_sample <- diamonds[sample(nrow(diamonds), 1000), ]

p6 <- ggplot(d_sample, aes(x = carat, y = price)) +
  geom_point(alpha = 0.4, colour = "#4B6FA5") +
  scale_y_continuous(labels = scales::dollar) +
  scale_x_continuous(limits = c(0, 3)) +
  theme_light() +
  labs(title = "Diamond Price vs Carat", x = "Carat Weight", y = "Price")
p6
#> Scatter: exponential-looking relationship — price rises steeply above 1.5 carat.
#> Y-axis shows $0, $5,000, $10,000, $15,000. X-axis runs 0 to 3.
```

**Explanation:** `scales::dollar` is a label formatter from the `scales` package — it adds a `$` prefix and comma separators. `limits = c(0, 3)` restricts the x-axis range and drops points outside that window. Any `scales::` formatter (percent, comma, scientific) works the same way inside `labels`.

</details>

[WARNING]
**Setting axis limits with scale_x_continuous removes data outside the range.** Points beyond the limits are silently dropped, which affects computed statistics like trend lines. If you want to zoom without removing data, use `coord_cartesian(xlim = c(0, 3))` instead.

## How Do You Customize Legends, Backgrounds, and Strips? (Exercises 7–8)

Legends, panel backgrounds, and facet strips are all theme elements controlled by `element_rect()` and `element_text()`. These two exercises practise the elements most people struggle with — positioning and styling the decorations around the data.

### Exercise 7: Move and Style the Legend

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y), coloured by `drv` (drive type). Then:
1. Move the legend to the bottom of the plot
2. Give the legend a light grey background (`"grey95"`) with a thin grey border
3. Set legend text to 11pt
4. Apply `theme_minimal()`

```r
# Exercise 7: legend customization
p7 <- ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) +
  geom_point(size = 2.5) +
  theme_minimal() +
  theme(
    # your code here
  ) +
  labs(title = "Fuel Efficiency by Drive Type",
       x = "Engine Displacement (L)", y = "Highway MPG", colour = "Drive")

p7
#> Expected: legend at bottom, light grey box around it, 11pt text
```

<details>
<summary>Click to reveal solution</summary>

```r
p7 <- ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) +
  geom_point(size = 2.5) +
  theme_minimal() +
  theme(
    legend.position = "bottom",
    legend.background = element_rect(fill = "grey95", colour = "grey80", linewidth = 0.3),
    legend.text = element_text(size = 11)
  ) +
  labs(
    title = "Fuel Efficiency by Drive Type",
    x = "Engine Displacement (L)",
    y = "Highway MPG",
    colour = "Drive"
  )
p7
#> Scatter: front-wheel drive (f) clusters at lower displacement/higher mpg.
#> Legend sits below the plot in a subtle grey box.
```

**Explanation:** `legend.position = "bottom"` moves the legend below the plot area. `legend.background` takes `element_rect()` — `fill` sets the background colour, `colour` the border, and `linewidth` the border thickness. `legend.text` controls the category labels inside the legend.

</details>

### Exercise 8: Style Facet Strip Panels

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y) faceted by `drv`. Customize:
1. Set strip background to navy (`"#2C3E50"`)
2. Set strip text to white, bold, 11pt
3. Set panel background to white
4. Keep `theme_minimal()` as the base

```r
# Exercise 8: facet strip styling
p8 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "#4B6FA5", alpha = 0.6) +
  facet_wrap(~drv) +
  theme_minimal() +
  theme(
    # your code here
  ) +
  labs(title = "MPG by Drive Type", x = "Displacement (L)", y = "Highway MPG")

p8
#> Expected: 3 facet panels with navy strip headers, white bold text
```

<details>
<summary>Click to reveal solution</summary>

```r
p8 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "#4B6FA5", alpha = 0.6) +
  facet_wrap(~drv) +
  theme_minimal() +
  theme(
    strip.background = element_rect(fill = "#2C3E50", colour = "#2C3E50"),
    strip.text = element_text(colour = "white", face = "bold", size = 11),
    panel.background = element_rect(fill = "white", colour = NA)
  ) +
  labs(title = "MPG by Drive Type", x = "Displacement (L)", y = "Highway MPG")
p8
#> Three panels (4, f, r) with dark navy headers and white bold text.
#> Front-wheel cars show highest highway mpg, rear-wheel the lowest.
```

**Explanation:** `strip.background` controls the coloured bar above each facet panel. `strip.text` styles the text inside that bar. Setting both `fill` and `colour` of the strip to the same navy prevents a contrasting border from showing. `panel.background` fills each panel's plotting area.

</details>

[TIP]
**Set the strip border colour to match the fill.** By default, `element_rect()` draws a thin black border. If your strip fill is dark, that border is invisible. But on lighter fills, a mismatched border looks messy. Setting `colour = fill_colour` gives a clean edge.

## Can You Build a Reusable Custom Theme? (Exercises 9–10)

Real-world reporting means applying the same visual style to dozens of charts. Writing a custom theme function saves you from copy-pasting `theme()` calls across every plot. These final exercises combine everything above into a reusable workflow.

### Exercise 9: Build a theme_report() Function

**Task:** Write a function called `theme_report()` that returns a ggplot2 theme with these settings:
- Base: `theme_minimal(base_size = 13)`
- Plot title: 16pt, bold
- Plot subtitle: 12pt, italic, grey (`"grey40"`)
- Axis titles: 12pt, bold
- Plot caption: 9pt, grey (`"grey50"`)
- Major grid: light grey (`"grey90"`), dashed
- Minor grid: removed
- Legend position: bottom

Test it by applying `theme_report()` to a scatter of `mtcars` `wt` vs `mpg`.

```r
# Exercise 9: build a reusable theme
theme_report <- function() {
  # your code here
}

# Test it
p9 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, colour = "#4B6FA5") +
  theme_report() +
  labs(
    title = "Weight vs Fuel Efficiency",
    subtitle = "Data from the 1974 Motor Trend magazine",
    caption = "Source: mtcars dataset",
    x = "Weight (1000 lbs)", y = "Miles per Gallon"
  )
p9
#> Expected: clean minimal plot with bold title, italic grey subtitle, dashed grid
```

<details>
<summary>Click to reveal solution</summary>

```r
theme_report <- function() {
  theme_minimal(base_size = 13) +
    theme(
      plot.title = element_text(size = 16, face = "bold"),
      plot.subtitle = element_text(size = 12, face = "italic", colour = "grey40"),
      axis.title = element_text(size = 12, face = "bold"),
      plot.caption = element_text(size = 9, colour = "grey50"),
      panel.grid.major = element_line(colour = "grey90", linetype = "dashed"),
      panel.grid.minor = element_blank(),
      legend.position = "bottom"
    )
}

p9 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, colour = "#4B6FA5") +
  theme_report() +
  labs(
    title = "Weight vs Fuel Efficiency",
    subtitle = "Data from the 1974 Motor Trend magazine",
    caption = "Source: mtcars dataset",
    x = "Weight (1000 lbs)", y = "Miles per Gallon"
  )
p9
#> Bold title, italic grey subtitle, dashed light grid, no minor grid,
#> bold axis titles, grey caption at bottom-right.
```

**Explanation:** A custom theme function wraps `theme_minimal()` and layers your `theme()` tweaks on top. Because it's a function, you call `theme_report()` on any plot — no copy-pasting. The `+` operator inside the function merges the base theme with your overrides.

</details>

[KEY INSIGHT]
**A custom theme function is the single most time-saving ggplot2 trick for professionals.** Once you define `theme_report()`, every chart in your project gets consistent styling with one line of code. Update the function once, and every plot updates automatically.

### Exercise 10: Publication-Ready Plot — Theme + Scale Combined

**Dataset:** `airquality` (built-in, May through September temperatures)

**Task:** Build a complete, publication-ready line chart:
1. Compute mean `Temp` per `Month` using `aggregate()`
2. Create a line chart with points: `geom_line() + geom_point()`, colour by `factor(Month)`
3. Apply `theme_report()` from Exercise 9
4. Use `scale_colour_brewer(palette = "YlOrRd")` (yellow-orange-red for temperature)
5. Label the x-axis with month names using `scale_x_continuous(breaks = 5:9, labels = month.abb[5:9])`
6. Add title "Average Temperature by Month", subtitle "New York, May–September 1973", and caption "Source: airquality dataset"
7. Remove the legend — colour is redundant with the x-axis labels

```r
# Exercise 10: publication-ready plot
aq_summary <- aggregate(Temp ~ Month, data = airquality, FUN = mean)

p10 <- ggplot(aq_summary, aes(x = Month, y = Temp, colour = factor(Month))) +
  # your code here
  NULL

p10
#> Expected: line chart, month names on x-axis, warm colour palette, no legend
```

<details>
<summary>Click to reveal solution</summary>

```r
aq_summary <- aggregate(Temp ~ Month, data = airquality, FUN = mean)

p10 <- ggplot(aq_summary, aes(x = Month, y = Temp, colour = factor(Month))) +
  geom_line(linewidth = 1.2, colour = "grey60") +
  geom_point(size = 4) +
  scale_colour_brewer(palette = "YlOrRd") +
  scale_x_continuous(breaks = 5:9, labels = month.abb[5:9]) +
  theme_report() +
  theme(legend.position = "none") +
  labs(
    title = "Average Temperature by Month",
    subtitle = "New York, May\u2013September 1973",
    caption = "Source: airquality dataset",
    x = "Month",
    y = "Temperature (\u00B0F)"
  )
p10
#> Line chart rising from May (~65°F) to July (~84°F), dipping slightly in Sep.
#> Points coloured yellow (May) through red (Sep). Clean, print-ready layout.
```

**Explanation:** The line connects months in grey (a neutral connector), while the points carry the colour encoding. `scale_colour_brewer("YlOrRd")` is a sequential palette — light yellow for cooler months, deep red for the hottest. `month.abb[5:9]` converts numeric months to abbreviations. Removing the legend avoids redundancy since the x-axis already shows month names.

</details>

## Complete Example

Here's a full pipeline combining themes, scales, and facets into one polished chart. This uses concepts from every exercise above.

```r
# Complete example: faceted bar chart with full customization
dia_summary <- aggregate(price ~ cut + color, data = diamonds, FUN = mean)

p_complete <- ggplot(dia_summary, aes(x = color, y = price, fill = cut)) +
  geom_col(position = "dodge") +
  scale_fill_brewer(palette = "Blues") +
  scale_y_continuous(labels = scales::dollar) +
  facet_wrap(~cut, nrow = 1) +
  theme_report() +
  theme(
    strip.background = element_rect(fill = "#2C3E50", colour = "#2C3E50"),
    strip.text = element_text(colour = "white", face = "bold", size = 10),
    axis.text.x = element_text(angle = 45, hjust = 1, size = 9),
    legend.position = "none"
  ) +
  labs(
    title = "Average Diamond Price by Colour and Cut",
    subtitle = "Higher colour grades (D\u2013F) don\u2019t always mean higher prices",
    caption = "Source: ggplot2 diamonds dataset",
    x = "Colour Grade",
    y = "Mean Price"
  )
p_complete
#> Five facet panels (Fair through Ideal), each showing 7 colour-grade bars.
#> Fair-cut diamonds in colour J are the priciest (~$4,800) — because they're
#> larger stones. Ideal-cut diamonds are cheaper on average — more small stones.
#> Navy strip headers, dollar y-axis, rotated x-labels, no legend (redundant with facets).
```

This chart reveals a counterintuitive pattern: lower-quality cuts can have higher average prices because cut quality and carat weight are negatively correlated. The customization layers — theme, scales, facets, strip styling — work together to make this insight immediately visible.

## Summary

| Exercise | Concept | Key Functions |
|---|---|---|
| 1 | Apply built-in theme | `theme_light()`, `labs()` |
| 2 | Remove and restyle grid lines | `element_blank()`, `element_line(linetype)` |
| 3 | Customize text elements | `element_text(angle, size, face, hjust)` |
| 4 | ColorBrewer categorical palette | `scale_colour_brewer(palette)` |
| 5 | Custom colours with named vector | `scale_fill_manual(values)` |
| 6 | Axis formatting and limits | `scale_y_continuous(labels)`, `scale_x_continuous(limits)` |
| 7 | Legend position and background | `legend.position`, `legend.background` |
| 8 | Facet strip styling | `strip.background`, `strip.text` |
| 9 | Reusable custom theme function | `theme_minimal() + theme(...)` in a function |
| 10 | Publication-ready combined plot | Theme + scale + labs + legend removal |

The customization pattern in every exercise is the same: start with a complete theme, then layer `theme()` tweaks and `scale_*()` functions on top. Once that pattern clicks, you can style any ggplot2 chart.

## References

1. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Chapter 17: Themes. [Link](https://ggplot2-book.org/themes.html)
2. ggplot2 documentation — theme() reference. [Link](https://ggplot2.tidyverse.org/reference/theme.html)
3. ggplot2 documentation — Scales reference. [Link](https://ggplot2.tidyverse.org/reference/index.html#scales)
4. ggplot2 documentation — Complete themes. [Link](https://ggplot2.tidyverse.org/reference/ggtheme.html)
5. ColorBrewer 2.0 — Colour palettes for cartography and data visualization. [Link](https://colorbrewer2.org/)
6. Scherer, C. — *A ggplot2 Tutorial for Beautiful Plotting in R* (2019). [Link](https://www.cedricscherer.com/2019/08/05/a-ggplot2-tutorial-for-beautiful-plotting-in-r/)

## Continue Learning

1. [ggplot2 Themes](ggplot2-Themes-in-R.html) — Deep dive into the theme() system, all 8 built-in themes, the element inheritance tree, and building custom house styles from scratch.
2. [ggplot2 Scales](ggplot2-Scales.html) — Full reference for every scale function: position, colour, fill, size, alpha, plus breaks, labels, limits, and transformations.
3. [Publication-Ready Figures](Publication-Quality-Figures-in-R.html) — Export polished charts for papers and presentations with the right DPI, dimensions, and file format.
