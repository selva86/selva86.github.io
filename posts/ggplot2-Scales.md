---
title: "ggplot2 Scales: Control Every Axis, Colour, and Size — The Full Reference"
slug: "ggplot2-Scales"
description: "Scales control how data maps to visuals in ggplot2. Master scale_x_log10(), scale_color_brewer(), scale_fill_manual(), axis limits, breaks, and labels."
keywords: "ggplot2 scales, scale_x_continuous, scale_color_brewer, scale_fill_manual, scale_x_log10, ggplot2 axis limits, ggplot2 breaks labels, ggplot2 color scale, ggplot2 size scale, expand ggplot2"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.9"
post_type: "C"
auto_link_terms: "ggplot2 scales|scale_x_continuous()|scale_color_brewer()|scale_fill_manual()|scale_x_log10()|ggplot2 axis scale|scale_y_continuous()"
auto_link_case_sensitive: true
sidebar_section: "Visualization"
sidebar_title: "ggplot2 Scales"
sidebar_order: 6
difficulty: "Intermediate"
---

# ggplot2 Scales: Control Every Axis, Colour, and Size — The Full Reference

<p class="lead">Scales control how ggplot2 maps data values to visual properties like position, colour, size, and transparency. Mastering them gives you complete control over every axis, legend, and colour palette in your plots.</p>

## Introduction

Every time you write `aes(x = ..., y = ...)`, ggplot2 silently picks a default scale behind the scenes. Most of the time, those defaults work fine. But when you need log-transformed axes, custom colour palettes, formatted currency labels, or exact axis limits, you need to take control of scales yourself.

Scales are the bridge between your data and the visual output. They translate a numeric column into an x-axis position, a factor column into a colour, or a continuous variable into point size. Every aesthetic you map inside `aes()` has a corresponding scale, whether you see it or not.

In this tutorial, you will learn the scale naming convention, position scales for continuous and discrete axes, log and sqrt transformations, colour and fill scales (Brewer, manual, gradient, viridis), size and alpha scales, and the shared components that all scales have in common: breaks, labels, limits, and expand. All code runs directly in your browser — no setup required.

![ggplot2 scales overview](screenshots/ggplot2-Scales-overview-mindmap.webp)
*Figure 1: The four families of ggplot2 scales and their shared components.*

```r
# Load libraries (persists for all code blocks)
library(ggplot2)
library(scales)

# Base scatter plot we'll reuse throughout
p_base <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3)
p_base
#> (scatter plot of weight vs fuel efficiency)
```

This base plot uses the default scales for both axes. Every section below shows you how to override those defaults.

## How Does the ggplot2 Scale Naming Convention Work?

Every scale function in ggplot2 follows a three-part naming pattern: `scale_` + the aesthetic name + the scale type. Once you know this pattern, you can guess the right function for any situation without looking it up.

For example, `scale_x_continuous()` controls a continuous x-axis. `scale_color_brewer()` applies a Brewer palette to the colour aesthetic. `scale_fill_manual()` lets you hand-pick fill colours.

![Scale naming convention](screenshots/ggplot2-Scales-naming-convention.webp)
*Figure 2: Every scale function follows the scale_ + aesthetic_ + type pattern.*

```r
# The default plot adds scales implicitly
# These two plots are identical:
p_implicit <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point()

p_explicit <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  scale_x_continuous() +
  scale_y_continuous()

# Both produce the same output
p_explicit
#> (same scatter plot as before — explicit scales match the defaults)
```

The explicit version does nothing new here, but it shows you exactly where to plug in customisations. Every argument you pass to `scale_x_continuous()` — breaks, labels, limits, expand — overrides the defaults.

[KEY INSIGHT]
**The naming convention is your cheat sheet.** If you know the aesthetic (x, y, color, fill, size, alpha) and the data type (continuous, discrete, manual, brewer, log10), you can construct the function name: `scale_color_viridis_d()`, `scale_y_log10()`, `scale_fill_gradient2()`. No memorisation needed.

The most common aesthetics are `x`, `y`, `color` (or `colour`), `fill`, `size`, and `alpha`. The most common types are `continuous`, `discrete`, `manual`, `brewer`, `log10`, `sqrt`, `reverse`, `gradient`, `gradient2`, and `viridis_c`/`viridis_d`.

**Try it:** What scale function would you use to apply a manual colour palette to the `color` aesthetic? Write it as a call with `values = c("red", "blue")`.

```r
# Try it: write the correct scale function
ex_plot <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3)
  # Add the correct scale function here

# Test: add your scale to ex_plot
ex_plot
#> Expected: scatter with red and blue points (plus a third colour for 3 levels)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_plot <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_manual(values = c("red", "blue", "darkgreen"))
ex_plot
#> (scatter plot with three custom colours for 4, 6, and 8 cylinders)
```

**Explanation:** `scale_color_manual()` follows the pattern: scale_ + color_ + manual. You need one colour per factor level (mtcars has 3 cylinder groups).

</details>

## How Do You Customise Position Scales for Continuous and Discrete Axes?

Position scales control the x-axis and y-axis. For numeric data, you use `scale_x_continuous()` and `scale_y_continuous()`. For categorical data, you use `scale_x_discrete()` and `scale_y_discrete()`. Both share the same core arguments: `breaks`, `labels`, `limits`, and `expand`.

Let's start with continuous axes. The `breaks` argument sets where tick marks appear. The `labels` argument controls what text is printed at each tick. The `limits` argument defines the axis range.

```r
# Custom breaks, labels, and limits on the y-axis
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3) +
  scale_y_continuous(
    name = "Fuel Efficiency (miles per gallon)",
    breaks = seq(10, 35, by = 5),
    limits = c(10, 35)
  ) +
  scale_x_continuous(
    name = "Weight (1000 lbs)",
    breaks = seq(1, 6, by = 1)
  )
#> (scatter plot with clean 5-unit y-axis ticks from 10 to 35)
```

The `breaks` argument accepts a numeric vector or a function. The `labels` argument can be a character vector (same length as breaks) or a labelling function from the scales package.

```r
# Format labels as dollar amounts (hypothetical price data)
price_data <- data.frame(
  item = c("A", "B", "C", "D", "E"),
  price = c(1200, 4500, 800, 6700, 3200)
)

ggplot(price_data, aes(x = item, y = price)) +
  geom_col(fill = "steelblue") +
  scale_y_continuous(
    labels = label_dollar(),
    breaks = seq(0, 7000, by = 1000)
  )
#> (bar chart with y-axis labels like $0, $1,000, $2,000, ...)
```

For discrete axes, you can reorder and relabel categories directly in the scale.

```r
# Reorder and relabel discrete axis
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_boxplot(fill = "lightblue") +
  scale_x_discrete(
    limits = c("4", "6", "8"),
    labels = c("4" = "Four", "6" = "Six", "8" = "Eight")
  ) +
  labs(x = "Cylinders")
#> (boxplot with relabelled x-axis: Four, Six, Eight)
```

The `expand` argument controls the padding between your data and the axis edges. By default, ggplot2 adds 5% padding on each side for continuous axes. Use `expansion()` to change this.

```r
# Remove axis padding so bars touch the axis
ggplot(price_data, aes(x = item, y = price)) +
  geom_col(fill = "steelblue") +
  scale_y_continuous(
    labels = label_dollar(),
    expand = expansion(mult = c(0, 0.05))
  )
#> (bar chart with bars starting exactly at $0, 5% padding at top)
```

The `mult` argument adds proportional padding. Setting the lower bound to 0 removes the gap below the bars, while keeping a small 5% cushion at the top.

[WARNING]
**Setting limits removes data outside the range.** When you use `limits = c(15, 30)` in a scale, ggplot2 converts out-of-bounds points to NA before computing statistics. If you just want to zoom in visually, use `coord_cartesian(ylim = c(15, 30))` instead — it keeps all data intact.

![Limits vs coord zoom](screenshots/ggplot2-Scales-limits-vs-zoom.webp)
*Figure 3: Setting limits removes data; coord_cartesian() zooms without data loss.*

**Try it:** Create a bar chart of `mtcars` cylinder counts using `geom_bar()`. Format the y-axis with `label_comma()` and remove the bottom padding with `expansion()`.

```r
# Try it: formatted y-axis with no bottom padding
ex_bars <- ggplot(mtcars, aes(x = factor(cyl))) +
  geom_bar(fill = "coral")
  # Add scale_y_continuous with label_comma() and expansion()

ex_bars
#> Expected: bar chart with comma-formatted counts, bars touching the x-axis
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bars <- ggplot(mtcars, aes(x = factor(cyl))) +
  geom_bar(fill = "coral") +
  scale_y_continuous(
    labels = label_comma(),
    expand = expansion(mult = c(0, 0.05))
  )
ex_bars
#> (bar chart: 4-cyl = 11, 6-cyl = 7, 8-cyl = 14, bars start at 0)
```

**Explanation:** `label_comma()` adds thousand separators (not visible here with small counts, but essential for large values). `expansion(mult = c(0, 0.05))` removes bottom padding.

</details>

## How Do You Apply Log, Sqrt, and Reverse Transformations?

When your data spans several orders of magnitude, a linear axis compresses most of your points into a tiny region. Log transformations spread the data evenly by working on a multiplicative scale instead of an additive one.

The simplest approach is `scale_x_log10()` or `scale_y_log10()`. These apply a base-10 logarithm to the axis.

```r
# Diamonds data: price spans $326 to $18,823
# Linear axis compresses most points at the bottom
p_linear <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  labs(title = "Linear scale")

# Log10 axis reveals the relationship clearly
p_log <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_x_log10() +
  scale_y_log10() +
  labs(title = "Log10 scale")

p_log
#> (scatter with even spread across both axes, clear linear trend on log-log)
```

On the log-log scale, the relationship between carat and price looks nearly linear. This tells you that price scales as a power of carat weight — something the linear plot hides.

You can also use `scale_x_sqrt()` for a milder transformation, or `scale_x_reverse()` to flip the axis direction.

```r
# Reverse the x-axis (useful for time running right-to-left)
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3) +
  scale_x_reverse(name = "Weight (heaviest on left)")
#> (scatter plot with x-axis running from 5.5 on the left to 1.5 on the right)
```

For cleaner tick labels on log scales, use `breaks_log()` from the scales package. This places breaks at powers of 10.

```r
# Clean log-scale labels with breaks_log()
ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_x_log10(
    breaks = breaks_log(n = 6),
    labels = label_number(accuracy = 0.1)
  ) +
  scale_y_log10(
    breaks = breaks_log(n = 5),
    labels = label_dollar()
  )
#> (log-log scatter with ticks at 0.3, 1.0, 3.0 on x; $300, $1,000, $3,000, $10,000 on y)
```

The `breaks_log()` function places ticks at sensible powers, and `label_dollar()` formats the y-axis as currency.

[TIP]
**Use log scales when data spans more than one order of magnitude.** A variable ranging from 100 to 100,000 is a strong candidate. If the range is only 2x-3x (e.g., 10 to 30), a linear axis is clearer.

**Try it:** Create a scatter plot of `diamonds` with `carat` on the x-axis and `price` on the y-axis. Apply `scale_y_log10()` and format the labels with `label_dollar()`.

```r
# Try it: log-scaled y-axis with dollar labels
ex_log <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5)
  # Add scale_y_log10 with label_dollar()

ex_log
#> Expected: scatter with dollar-formatted log y-axis
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_log <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_log10(labels = label_dollar())
ex_log
#> (scatter plot with y-axis: $300, $1,000, $3,000, $10,000)
```

**Explanation:** `scale_y_log10()` transforms the axis, and `labels = label_dollar()` formats each break as a dollar amount.

</details>

## How Do You Control Colour and Fill Scales?

Colour scales are where ggplot2 really shines. There are two aesthetics to know: `color` (outlines and points) and `fill` (area fills in bars, boxes, and polygons). Each has discrete and continuous variants.

For discrete data, the most popular choice is `scale_color_brewer()`, which uses the ColorBrewer palettes designed by cartographer Cynthia Brewer. These palettes are perceptually balanced and many are colourblind-safe.

```r
# ColorBrewer palette for discrete colour
ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 4) +
  scale_color_brewer(palette = "Set2", name = "Cylinders")
#> (scatter with 3 distinct, pleasing colours for 4, 6, 8 cylinders)
```

The `palette` argument selects a specific palette. Good choices include "Set1" (bold), "Set2" (muted), "Dark2" (dark), "Paired" (12 colours), and "Pastel1" (soft). For sequential data, try "Blues", "Greens", or "YlOrRd".

When you need exact colours, use `scale_fill_manual()` or `scale_color_manual()` with a named vector.

```r
# Manual fill colours with a named vector
cyl_colors <- c("4" = "#2196F3", "6" = "#FF9800", "8" = "#F44336")

ggplot(mtcars, aes(x = factor(cyl), y = mpg, fill = factor(cyl))) +
  geom_boxplot() +
  scale_fill_manual(values = cyl_colors, name = "Cylinders")
#> (boxplot with blue=4cyl, orange=6cyl, red=8cyl)
```

The named vector maps each factor level to a specific hex colour. This is essential when you have brand colours or need consistent colours across multiple plots.

For continuous colour data, use gradient scales. `scale_color_gradient()` creates a two-colour gradient, and `scale_color_gradient2()` creates a diverging three-colour gradient with a midpoint.

```r
# Diverging gradient: blue-white-red around the median mpg
median_mpg <- median(mtcars$mpg)

ggplot(mtcars, aes(x = wt, y = hp, color = mpg)) +
  geom_point(size = 4) +
  scale_color_gradient2(
    low = "blue", mid = "white", high = "red",
    midpoint = median_mpg,
    name = "MPG"
  )
#> (scatter: blue = high mpg, red = low mpg, white = median)
```

The diverging palette highlights which cars are above or below the median fuel efficiency.

For the best perceptual uniformity and colourblind safety, use the viridis scales: `scale_color_viridis_d()` for discrete data and `scale_color_viridis_c()` for continuous.

```r
# Viridis for colourblind-safe continuous palette
ggplot(faithfuld, aes(x = waiting, y = eruptions, fill = density)) +
  geom_tile() +
  scale_fill_viridis_c(option = "magma", name = "Density")
#> (heatmap with magma palette: black -> red -> yellow -> white)
```

The `option` argument selects the viridis variant: "viridis" (default), "magma", "inferno", "plasma", or "cividis" (optimised for colour vision deficiency).

[TIP]
**Preview all Brewer palettes in one command.** Run `RColorBrewer::display.brewer.all()` to see every available palette grouped by type (sequential, qualitative, diverging).

[NOTE]
**Both colour and color work in ggplot2.** The package accepts both British and American spellings: `scale_colour_brewer()` and `scale_color_brewer()` are identical.

**Try it:** Create a boxplot of `iris` with `Species` on the x-axis, `Sepal.Length` on the y-axis, and a manual fill scale using three colours of your choice.

```r
# Try it: manual fill scale on iris boxplot
ex_fill <- ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  geom_boxplot()
  # Add scale_fill_manual with 3 colours

ex_fill
#> Expected: boxplot with your 3 custom fill colours
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fill <- ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  geom_boxplot() +
  scale_fill_manual(values = c("setosa" = "#66c2a5",
                                "versicolor" = "#fc8d62",
                                "virginica" = "#8da0cb"))
ex_fill
#> (boxplot with three distinct custom fill colours)
```

**Explanation:** Named vectors ensure each species gets the exact colour you intend, regardless of factor level order.

</details>

## How Do You Control Size and Alpha Scales?

Size and alpha (transparency) scales map continuous values to point size or opacity. They are less common than colour scales but essential for bubble charts and overplotted scatter plots.

The key distinction is between `scale_size()` and `scale_size_area()`. The default `scale_size()` maps values to the point radius. This means a value twice as large gets a circle with twice the radius — but four times the area. That distorts perception. Use `scale_size_area()` instead, which maps values to circle area so that visual proportions are honest.

```r
# Bubble chart with area-proportional sizing
ggplot(mtcars, aes(x = wt, y = mpg, size = hp)) +
  geom_point(alpha = 0.6, color = "steelblue") +
  scale_size_area(max_size = 15, name = "Horsepower") +
  labs(title = "Bubble chart: size proportional to horsepower")
#> (scatter with bubbles — larger circles = more horsepower)
```

With `scale_size_area()`, a car with 200 hp has a circle with twice the area of a car with 100 hp. This is visually honest. The `max_size` argument controls the largest bubble's diameter in mm.

For overplotted data, `scale_alpha_continuous()` lets you map a variable to transparency. Points in dense regions become semi-transparent, revealing the underlying distribution.

```r
# Alpha scale to handle overplotting
ggplot(diamonds, aes(x = carat, y = price, alpha = depth)) +
  geom_point(size = 1, color = "purple") +
  scale_alpha_continuous(range = c(0.1, 0.9), name = "Depth (%)") +
  scale_y_continuous(labels = label_dollar())
#> (scatter: deeper diamonds are more opaque, shallower are more transparent)
```

The `range` argument in `scale_alpha_continuous()` sets the minimum and maximum opacity. A range of `c(0.1, 0.9)` ensures even the faintest points are still visible.

[WARNING]
**scale_size() maps to radius, scale_size_area() maps to area.** Using `scale_size()` for bubble charts makes small values look disproportionately tiny and large values disproportionately huge. Always use `scale_size_area()` when size should represent a quantitative value.

**Try it:** Create a bubble chart of `mtcars` with `disp` on x, `mpg` on y, and `hp` mapped to size using `scale_size_area()`. Set `max_size = 12`.

```r
# Try it: bubble chart with area-proportional sizing
ex_bubble <- ggplot(mtcars, aes(x = disp, y = mpg, size = hp)) +
  geom_point(alpha = 0.6)
  # Add scale_size_area with max_size = 12

ex_bubble
#> Expected: bubble chart with honestly-sized circles
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bubble <- ggplot(mtcars, aes(x = disp, y = mpg, size = hp)) +
  geom_point(alpha = 0.6, color = "darkgreen") +
  scale_size_area(max_size = 12, name = "Horsepower")
ex_bubble
#> (bubble chart with area-proportional circles up to 12mm)
```

**Explanation:** `scale_size_area()` ensures the visual area of each bubble is proportional to horsepower, making the chart perceptually accurate.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using limits to zoom instead of coord_cartesian()

This is the most common scale mistake. Setting `limits` inside a scale function removes data outside the range before stats are computed.

❌ **Wrong:**
```r
# This REMOVES points outside 15-30 mpg
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm") +
  scale_y_continuous(limits = c(15, 30))
#> Warning: Removed 6 rows containing missing values
#> (regression line computed on FEWER points — slope is wrong)
```

**Why it is wrong:** Six data points are converted to NA. The regression line is fitted to the remaining data, giving a different slope than the full dataset.

✅ **Correct:**
```r
# This ZOOMS without removing any data
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm") +
  coord_cartesian(ylim = c(15, 30))
#> (regression line computed on ALL 32 points, view zoomed to 15-30)
```

### Mistake 2: Using scale_size() instead of scale_size_area() for bubble charts

❌ **Wrong:**
```r
# scale_size maps to RADIUS — visually dishonest
ggplot(mtcars, aes(x = wt, y = mpg, size = hp)) +
  geom_point(alpha = 0.5) +
  scale_size(range = c(2, 15))
#> (300hp circle looks ~9x bigger than 100hp circle, not 3x)
```

**Why it is wrong:** A circle with 3x the radius has 9x the area. Readers perceive area, not radius, so the 300hp car looks far too large relative to a 100hp car.

✅ **Correct:**
```r
ggplot(mtcars, aes(x = wt, y = mpg, size = hp)) +
  geom_point(alpha = 0.5) +
  scale_size_area(max_size = 15)
#> (300hp circle has 3x the area of 100hp circle — visually honest)
```

### Mistake 3: Forgetting to load the scales package

❌ **Wrong:**
```r
# Without library(scales), label_dollar() is not found
# Error: could not find function "label_dollar"
ggplot(price_data, aes(x = item, y = price)) +
  geom_col() +
  scale_y_continuous(labels = label_dollar())
```

**Why it is wrong:** Functions like `label_dollar()`, `label_comma()`, `label_percent()`, and `breaks_log()` live in the scales package. ggplot2 imports some scales functions, but the label helpers need an explicit `library(scales)`.

✅ **Correct:**
```r
library(scales)  # Load at the top of your script
ggplot(price_data, aes(x = item, y = price)) +
  geom_col(fill = "steelblue") +
  scale_y_continuous(labels = label_dollar())
#> (bar chart with $-formatted y-axis)
```

### Mistake 4: Passing character strings as breaks on a continuous axis

❌ **Wrong:**
```r
# breaks must be numeric for a continuous scale
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  scale_x_continuous(breaks = c("light", "medium", "heavy"))
#> Error: non-numeric breaks
```

**Why it is wrong:** Continuous scales expect numeric break positions. If you want text labels at specific positions, set numeric breaks and character labels separately.

✅ **Correct:**
```r
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  scale_x_continuous(
    breaks = c(2, 3.5, 5),
    labels = c("Light", "Medium", "Heavy")
  )
#> (scatter with text labels at numeric positions 2, 3.5, 5)
```

## Practice Exercises

### Exercise 1: Polished scatter with Brewer palette and formatted axes

Create a scatter plot of `mtcars` with `wt` on x, `mpg` on y, and `factor(cyl)` mapped to colour. Use `scale_color_brewer()` with the "Dark2" palette. Set y-axis breaks at every 5 units and label the x-axis as "Weight (1000 lbs)". Remove the bottom y-axis padding.

```r
# Exercise 1: polished scatter
# Hint: combine scale_color_brewer, scale_y_continuous, scale_x_continuous

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_scatter <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_brewer(palette = "Dark2", name = "Cylinders") +
  scale_x_continuous(name = "Weight (1000 lbs)") +
  scale_y_continuous(
    breaks = seq(10, 35, by = 5),
    expand = expansion(mult = c(0, 0.05))
  )
my_scatter
#>   (scatter: 3 Dark2 colours, y breaks at 10,15,20,25,30,35, no bottom gap)
```

**Explanation:** Three separate scale functions control colour, x-axis, and y-axis independently. Each scale only affects its own aesthetic.

</details>

### Exercise 2: Log-scaled bubble chart with viridis fill

Using the `diamonds` dataset, create a scatter plot of `carat` (x) vs `price` (y). Map `cut` to colour using `scale_color_viridis_d()`. Apply log10 to both axes with dollar-formatted y labels and comma-formatted x labels. Add a `labs()` title of "Diamond Price by Carat and Cut".

```r
# Exercise 2: log bubble with viridis
# Hint: scale_x_log10 + scale_y_log10 + scale_color_viridis_d

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_diamonds <- ggplot(diamonds, aes(x = carat, y = price, color = cut)) +
  geom_point(alpha = 0.3, size = 0.8) +
  scale_x_log10(labels = label_comma()) +
  scale_y_log10(labels = label_dollar()) +
  scale_color_viridis_d(option = "viridis", name = "Cut") +
  labs(title = "Diamond Price by Carat and Cut")
my_diamonds
#> (log-log scatter with viridis palette, dollar y-axis, comma x-axis)
```

**Explanation:** Log10 scales reveal the linear relationship on log-log axes. Viridis is colourblind-safe and perceptually uniform. Label functions format the tick text without affecting the underlying data.

</details>

### Exercise 3: Diverging gradient heatmap

Create a correlation heatmap of `mtcars` using `geom_tile()`. Compute the correlation matrix, reshape it to long format, and map the correlation value to `fill`. Use `scale_fill_gradient2()` with blue for negative, white for zero, and red for positive correlations.

```r
# Exercise 3: correlation heatmap
# Hint: cor(), reshape with expand.grid or data.frame, scale_fill_gradient2

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_cor <- cor(mtcars[, 1:7])
my_cor_long <- data.frame(
  row = rep(colnames(my_cor), each = ncol(my_cor)),
  col = rep(colnames(my_cor), times = nrow(my_cor)),
  value = as.vector(my_cor)
)

my_heatmap <- ggplot(my_cor_long, aes(x = col, y = row, fill = value)) +
  geom_tile(color = "white") +
  scale_fill_gradient2(
    low = "blue", mid = "white", high = "red",
    midpoint = 0, limits = c(-1, 1),
    name = "Correlation"
  ) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  labs(title = "mtcars Correlation Heatmap", x = "", y = "")
my_heatmap
#> (heatmap: blue=negative, white=zero, red=positive correlations)
```

**Explanation:** `scale_fill_gradient2()` creates a diverging palette anchored at zero. The `limits = c(-1, 1)` ensures the colour range spans the full correlation range. Reshaping the matrix to long format lets ggplot2 map rows and columns to aesthetics.

</details>

## Putting It All Together

Let's build a publication-quality scatter plot that combines multiple scale customisations in a single chart. We will use log axes, a Brewer colour palette, formatted labels, custom breaks, and a polished legend.

```r
# Complete example: polished diamond scatter plot
set.seed(99)
diamond_sample <- diamonds[sample(nrow(diamonds), 2000), ]

p_final <- ggplot(diamond_sample, aes(
  x = carat, y = price,
  color = cut, size = depth
)) +
  geom_point(alpha = 0.6) +

  # Position scales: log10 with formatted labels
  scale_x_log10(
    name = "Carat Weight",
    breaks = c(0.3, 0.5, 1, 2, 3, 5),
    labels = label_number(accuracy = 0.1)
  ) +
  scale_y_log10(
    name = "Price (USD)",
    breaks = c(500, 1000, 2500, 5000, 10000, 18000),
    labels = label_dollar()
  ) +

  # Colour scale: Brewer palette
  scale_color_brewer(
    palette = "Set1",
    name = "Cut Quality"
  ) +

  # Size scale: area-proportional
  scale_size_area(
    max_size = 8,
    name = "Depth (%)"
  ) +

  labs(title = "Diamond Prices by Carat, Cut, and Depth") +
  theme_minimal()

p_final
#> (polished log-log scatter: 5 Brewer colours for cut, bubble size for depth,
#>  dollar labels on y-axis, clean carat labels on x-axis)
```

This chart uses four different scales at once: `scale_x_log10()` for the x position, `scale_y_log10()` for the y position, `scale_color_brewer()` for the colour aesthetic, and `scale_size_area()` for the size aesthetic. Each scale independently controls its own aesthetic without interfering with the others.

## Summary

| Scale Family | Key Functions | When to Use |
|---|---|---|
| Position (continuous) | `scale_x_continuous()`, `scale_y_continuous()` | Customise breaks, labels, limits on numeric axes |
| Position (discrete) | `scale_x_discrete()`, `scale_y_discrete()` | Reorder or relabel categories |
| Position (transform) | `scale_x_log10()`, `scale_x_sqrt()`, `scale_x_reverse()` | Spread skewed data or flip axis direction |
| Colour (discrete) | `scale_color_brewer()`, `scale_color_manual()`, `scale_color_viridis_d()` | Map categories to distinct colours |
| Colour (continuous) | `scale_color_gradient()`, `scale_color_gradient2()`, `scale_color_viridis_c()` | Map numeric values to colour gradients |
| Fill | `scale_fill_*()` | Same as colour, but for area fills (bars, boxes, tiles) |
| Size | `scale_size_area()` | Bubble charts with honest area encoding |
| Alpha | `scale_alpha_continuous()` | Reduce overplotting by mapping transparency |
| Shared arguments | `breaks`, `labels`, `limits`, `expand`, `name` | Work across all scale types |

The golden rule: every aesthetic you map in `aes()` has a corresponding scale. Learn the naming pattern `scale_<aesthetic>_<type>()`, and you can control any visual property in ggplot2.

## FAQ

**What is the difference between limits in a scale and coord_cartesian()?**

Setting `limits` inside a scale function (e.g., `scale_y_continuous(limits = c(10, 30))`) removes data outside the range before stats are computed. `coord_cartesian(ylim = c(10, 30))` performs a visual zoom — all data is kept, and stats are computed on the full dataset. Use `coord_cartesian()` when you want to zoom without affecting fitted lines or summaries.

**How do I remove the gap between my data and the axes?**

Use the `expand` argument with `expansion(mult = 0)` or `expansion(add = 0)`. For bar charts, `expansion(mult = c(0, 0.05))` removes the bottom gap while keeping a small top cushion. This makes bars start exactly at the axis baseline.

**Can I use different scales for different facets?**

By default, all facets share the same scales. Use `facet_wrap(~ variable, scales = "free")` to let each facet have its own axis range. You can also use `scales = "free_x"` or `scales = "free_y"` for just one axis. However, you cannot apply completely different scale types per facet.

**How do I reverse a colour gradient?**

Use `direction = -1` inside Brewer or viridis scales: `scale_color_brewer(direction = -1)`. For gradient scales, swap the `low` and `high` arguments. For viridis, use `scale_color_viridis_c(direction = -1)`.

**Why does scale_size() make small values look too big compared to large values?**

`scale_size()` maps values to the circle radius. Doubling the radius quadruples the area. Since humans perceive area (not radius), a value of 200 looks 4x bigger than 100 instead of 2x. Switch to `scale_size_area()`, which maps values to area directly. A value of 200 will have exactly twice the visual area of 100.

## References

1. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Chapters 10-11: Position Scales and Colour Scales. [Link](https://ggplot2-book.org/scales-position.html)
2. ggplot2 documentation — scale_continuous reference. [Link](https://ggplot2.tidyverse.org/reference/scale_continuous.html)
3. ggplot2 documentation — scale_colour_brewer reference. [Link](https://ggplot2.tidyverse.org/reference/scale_brewer.html)
4. scales package documentation — Label functions reference. [Link](https://scales.r-lib.org/reference/index.html)
5. Brewer, C. — ColorBrewer: Color Advice for Cartography. [Link](https://colorbrewer2.org/)
6. Wilke, C. — *Fundamentals of Data Visualization*. Chapter 4: Color Scales. [Link](https://clauswilke.com/dataviz/color-basics.html)
7. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 12: Communication. [Link](https://r4ds.hadley.nz/communication.html)
8. ggplot2 documentation — scale_manual reference. [Link](https://ggplot2.tidyverse.org/reference/scale_manual.html)

## Continue Learning

Now that you can control every axis, colour, and size in your plots, explore these related tutorials:

- **[ggplot2 Theme Customisation](Complete-Ggplot2-Tutorial-Part2-Customizing-Theme-With-R-Code.html)** — Change fonts, backgrounds, gridlines, and overall plot appearance
- **[Top 50 ggplot2 Visualisations](Top50-Ggplot2-Visualizations-MasterList-R-Code.html)** — The masterlist of chart types with complete code for each
- **[ggplot2 Quick Reference](ggplot2-cheatsheet.html)** — A compact cheat sheet of the most common ggplot2 functions
