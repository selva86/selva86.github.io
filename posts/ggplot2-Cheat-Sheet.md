---
title: "ggplot2 Cheat Sheet: Quick Reference for Geoms, Scales, Themes and More"
slug: "ggplot2-Cheat-Sheet"
description: "Complete ggplot2 cheat sheet covering geoms, aesthetics, scales, coordinate systems, themes, and facets — with runnable code examples for every section."
keywords: "ggplot2 cheat sheet, ggplot2 quick reference, ggplot2 functions, ggplot2 geoms list, ggplot2 scales reference, ggplot2 themes, ggplot2 aesthetics"
auto_link_terms: "ggplot2 cheat sheet|ggplot2 quick reference|ggplot2 functions list|ggplot2 geoms|ggplot2 themes reference"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "CHT3"
post_type: "FR"
fr_parent: "ggplot2-Getting-Started.html"
---

# ggplot2 Cheat Sheet: Quick Reference for Geoms, Scales, Themes and More

<p class="lead">This cheat sheet is your one-page reference for ggplot2 — covering the layer grammar, every major geom, aesthetic mappings, scale functions, facets, and theme customization, each with a minimal working example you can run and modify.</p>

## Introduction

ggplot2 follows a layered grammar: start with data and a coordinate system, add geometric layers (geoms), control how data maps to visual properties (aesthetics and scales), and polish with themes. Every chart in ggplot2 is built by composing these layers using `+`.

The basic template is always:

```r
library(ggplot2)

# The universal ggplot2 template
# ggplot(data, aes(x = ..., y = ...)) + geom_*() + scale_*() + theme_*()

# Verify it works with a minimal example
p_base <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title = "Weight vs MPG", x = "Weight (1000 lbs)", y = "Miles per Gallon")

p_base
```

Each section below shows the key functions in that category with quick examples. All code shares a single session — `mtcars` and `mpg` are always available.

## What Are the Essential Geoms in ggplot2?

A geom defines the visual mark drawn for each data point. Add multiple geoms to the same chart by layering them with `+`.

| Geom | Use For | Key Arguments |
|---|---|---|
| `geom_point()` | Scatter plots | `size`, `shape`, `alpha` |
| `geom_line()` | Line charts (sorted by x) | `linewidth`, `linetype` |
| `geom_bar()` | Count frequency from raw data | `fill`, `position` |
| `geom_col()` | Bar heights from pre-computed values | `fill`, `width` |
| `geom_histogram()` | Distribution of one continuous variable | `binwidth`, `bins`, `fill` |
| `geom_density()` | Smooth density curve | `adjust`, `fill`, `alpha` |
| `geom_boxplot()` | Median, quartiles, outliers | `fill`, `notch` |
| `geom_violin()` | Full distribution shape per group | `fill`, `draw_quantiles` |
| `geom_smooth()` | Trend / regression line | `method`, `se` |
| `geom_text()` | Text labels at data positions | `label`, `hjust`, `vjust` |
| `geom_hline()` | Horizontal reference line | `yintercept`, `linetype` |
| `geom_vline()` | Vertical reference line | `xintercept`, `linetype` |
| `geom_abline()` | Line by slope and intercept | `slope`, `intercept` |
| `geom_area()` | Filled area under a line | `fill`, `alpha` |
| `geom_tile()` | Heatmap tiles | `fill` |
| `geom_bin2d()` | 2D density bins | `bins`, `fill` |
| `geom_jitter()` | Scatter with random noise (reduces overlap) | `width`, `height` |
| `geom_errorbar()` | Error bars | `ymin`, `ymax`, `width` |
| `geom_ribbon()` | Shaded band between y bounds | `ymin`, `ymax`, `fill` |
| `geom_segment()` | Arbitrary line segments | `x`, `xend`, `y`, `yend` |

```r
# Quick geom gallery - 4 charts on one dataset
p_point <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.6) +
  labs(title = "geom_point()", x = "Displacement", y = "MPG")

p_smooth <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.3) +
  geom_smooth(method = "lm", color = "firebrick") +
  labs(title = "geom_point() + geom_smooth()", x = "Displacement", y = "MPG")

p_hist <- ggplot(mpg, aes(x = hwy)) +
  geom_histogram(binwidth = 3, fill = "steelblue", color = "white") +
  labs(title = "geom_histogram()", x = "Highway MPG")

p_box <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_boxplot(show.legend = FALSE) +
  scale_fill_brewer(palette = "Set2") +
  labs(title = "geom_boxplot()", x = "Drive Type", y = "Highway MPG")

# Show all four
library(patchwork)
(p_point | p_smooth) / (p_hist | p_box)
```

> **TIP:** Stack multiple geoms to build richer charts. A common pattern: `geom_boxplot() + geom_jitter()` shows both the summary statistics and the raw data distribution simultaneously.

**Try it:** Replace `geom_boxplot()` with `geom_violin()` in `p_box`. How does the shape of the distribution change compared to the boxplot?

```r
# Your code here — swap geom_boxplot() for geom_violin()
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_violin <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(show.legend = FALSE) +
  scale_fill_brewer(palette = "Set2") +
  labs(x = "Drive Type", y = "Highway MPG")

ex_violin
```

A violin plot replaces the box's five-number summary with a mirrored density curve, so you can see *where* values cluster — not just the median and quartiles. For `mpg` you'll notice the front-wheel drive distribution is bimodal (compact econoboxes vs midsize sedans), a detail the boxplot completely hides. Trade-off: violins use more ink and require enough data per group to look stable.
</details>

## How Do Aesthetics and aes() Work?

Aesthetics map data columns to visual properties. Mappings inside `aes()` are data-driven. Values set *outside* `aes()` are fixed for all data points.

| Aesthetic | Controls | Variable Types | Example |
|---|---|---|---|
| `x`, `y` | Position | Continuous, discrete, date | `aes(x = date, y = value)` |
| `color` | Point/line/text color | Continuous → gradient; Discrete → palette | `aes(color = species)` |
| `fill` | Interior fill color | Continuous → gradient; Discrete → palette | `aes(fill = category)` |
| `size` | Point size, line thickness | Continuous numeric | `aes(size = population)` |
| `shape` | Point shape (16 = circle, 17 = triangle…) | Discrete (≤ 6 levels) | `aes(shape = group)` |
| `alpha` | Transparency (0 = invisible, 1 = opaque) | Continuous numeric | `aes(alpha = confidence)` |
| `linetype` | Line style | Discrete | `aes(linetype = type)` |
| `label` | Text content | Character | `aes(label = name)` |
| `group` | Grouping without visual change | Discrete | `aes(group = id)` |

```r
# Demonstrate 4 aesthetics mapped simultaneously
p_aes <- ggplot(mpg, aes(
    x     = displ,
    y     = hwy,
    color = drv,      # categorical → discrete color
    size  = cyl,      # numeric → size scale
    alpha = cty       # numeric → transparency
  )) +
  geom_point() +
  scale_color_brewer(palette = "Set1",
                     labels = c("4"="4WD","f"="Front","r"="Rear")) +
  labs(
    title = "Four aesthetics in one scatter plot",
    x     = "Displacement (L)",
    y     = "Highway MPG",
    color = "Drive",
    size  = "Cylinders",
    alpha = "City MPG"
  )

p_aes
```

> **KEY INSIGHT:** `color = "blue"` (outside `aes()`) sets all points to blue. `aes(color = drv)` maps the `drv` column to color — one color per unique value. Putting a column name outside `aes()` (e.g., `color = drv`) is a common error that maps the literal string, not the column.

**Try it:** Move `size = cyl` from inside `aes()` to outside as `size = 3`. How does the chart change?

```r
# Your code here — move size out of aes() into geom_point()
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fixed_size <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point(size = 3, alpha = 0.7) +
  scale_color_brewer(palette = "Set1")

ex_fixed_size
```

Moving `size` outside `aes()` turns it from a data-driven *mapping* into a fixed *setting* — every point is the same size regardless of `cyl`. The cylinder information disappears from the chart, but the points become uniform and easier to read when you don't need that extra dimension. Anything inside `aes()` is tied to a column; anything outside is a constant applied to every observation.
</details>


## How Do You Customize Scales for Axes and Colors?

Scale functions control how data values map to visual properties — axis range, breaks, labels, color palettes, size ranges. Every aesthetic has a corresponding `scale_*()` family.

**Axis scales:**

| Function | Controls | Key Args |
|---|---|---|
| `scale_x_continuous()` | Continuous x-axis | `limits`, `breaks`, `labels`, `trans` |
| `scale_y_continuous()` | Continuous y-axis | `limits`, `breaks`, `labels`, `expand` |
| `scale_x_discrete()` | Categorical x-axis | `limits` (reorder), `labels` |
| `scale_x_date()` | Date x-axis | `date_breaks`, `date_labels` |
| `scale_x_log10()` | Log10 x-axis | — |

**Color/fill scales:**

| Function | For | When to Use |
|---|---|---|
| `scale_color_brewer()` | Discrete color | ColorBrewer qualitative/sequential |
| `scale_fill_brewer()` | Discrete fill | Same, for bar/tile interiors |
| `scale_color_distiller()` | Continuous color | ColorBrewer interpolated |
| `scale_fill_distiller()` | Continuous fill | Same, for fill |
| `scale_color_viridis_c()` | Continuous color | Perceptually uniform, colorblind-safe |
| `scale_color_viridis_d()` | Discrete color | Same but for categories |
| `scale_color_manual()` | Discrete color | Specify exact hex/named colors |
| `scale_color_gradient()` | Continuous, 2-color | Simple low-to-high gradient |
| `scale_color_gradient2()` | Continuous, diverging | Low-mid-high with midpoint |

```r
# Demonstrate scale customization
p_scales <- ggplot(mpg, aes(x = displ, y = hwy, color = hwy)) +
  geom_point(size = 3) +
  scale_x_continuous(
    breaks = seq(1, 7, by = 1),
    limits = c(1, 7),
    labels = function(x) paste0(x, "L")
  ) +
  scale_y_continuous(
    breaks = seq(10, 45, by = 5),
    expand = expansion(mult = c(0.05, 0.1))
  ) +
  scale_color_viridis_c(
    option = "plasma",
    name   = "Hwy MPG"
  ) +
  labs(
    title = "Scale customization: axis breaks + labels + color",
    x     = "Engine Displacement",
    y     = "Highway MPG"
  )

p_scales
```

> **TIP:** `labels = scales::comma` formats numeric axis labels with thousand separators. `labels = scales::percent` adds a % sign. `labels = scales::dollar` adds a $ prefix. Load the `scales` package once and use these as shorthand throughout your project.

**Try it:** Add `scale_x_log10()` to any scatter plot. How does a log-transformed axis change the appearance of the data distribution?

```r
# Your code here — add scale_x_log10() to a scatter plot
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_log <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05, color = "steelblue") +
  scale_x_log10() +
  scale_y_log10(labels = scales::comma)

ex_log
```

Log scales spread out the dense low-value region and compress the long tail, so a right-skewed cloud like diamonds `carat` vs `price` straightens into a near-linear band. That makes the multiplicative relationship (each doubling of carat roughly triples price) visually obvious where a linear axis just piles everything in the bottom-left corner.
</details>


## How Do You Use Facets to Create Multi-Panel Charts?

Facets split your data by a variable and draw one panel per group — all with the same axes and geoms, making comparison effortless.

| Function | What it Does | Key Args |
|---|---|---|
| `facet_wrap(~ var)` | Wrap panels into rows and columns automatically | `nrow`, `ncol`, `scales`, `labeller` |
| `facet_wrap(~ var1 + var2)` | Facet by two variables, wrapped | Same |
| `facet_grid(rows ~ cols)` | Grid layout: one variable per axis | `scales`, `space`, `labeller` |
| `facet_grid(. ~ cols)` | Facet columns only | — |
| `facet_grid(rows ~ .)` | Facet rows only | — |

```r
# facet_wrap: one panel per drive type
p_facet <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(alpha = 0.7) +
  geom_smooth(method = "lm", se = FALSE, color = "grey30",
              linewidth = 0.7, linetype = "dashed") +
  facet_wrap(
    ~ drv,
    nrow     = 1,
    labeller = labeller(drv = c("4"="4WD","f"="Front-wheel","r"="Rear-wheel"))
  ) +
  scale_color_brewer(palette = "Set2") +
  labs(
    title  = "facet_wrap(): one panel per drive type",
    x      = "Displacement (L)",
    y      = "Highway MPG",
    color  = "Class"
  ) +
  theme_minimal()

p_facet
```

The `scales` argument controls axis behavior across panels:

| `scales =` | Behavior |
|---|---|
| `"fixed"` (default) | All panels share the same x and y range |
| `"free_x"` | Each panel has its own x-axis range |
| `"free_y"` | Each panel has its own y-axis range |
| `"free"` | Each panel has independent x and y ranges |

> **KEY INSIGHT:** `scales = "free_y"` is essential when comparing metrics with very different units or magnitudes (e.g., count vs. percentage). Without it, a metric with small values appears as a flat line at the bottom of the panel.

**Try it:** Add `scales = "free"` to `facet_wrap()` in `p_facet`. How does this change the axes across the three panels?

```r
# Your code here — add scales = "free" to facet_wrap()
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_free_scales <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.6, color = "steelblue") +
  facet_wrap(~ drv, scales = "free")

ex_free_scales
```

With `scales = "free"` each panel fits its own x and y range, so every facet uses its full plotting area even when groups differ in magnitude. The trade-off is that cross-panel comparison becomes harder — a point that looks "high" in the rear-wheel panel may actually sit at the same hwy MPG as a "low" point in the front-wheel panel. Use free scales to reveal within-group structure, fixed scales to compare across groups.
</details>


## How Do You Apply Themes and Polish Your Chart?

Themes control all non-data visual elements: background, grid lines, axis text, legend position, font sizes, and more.

**Built-in themes:**

| Theme | Style |
|---|---|
| `theme_gray()` | Default — grey background, white grid |
| `theme_bw()` | White background, black grid frame |
| `theme_minimal()` | White background, light grey grid, no border |
| `theme_classic()` | White background, no grid, clean axes |
| `theme_void()` | No axes, no background — for maps and diagrams |
| `theme_dark()` | Dark background — good for viridis color scales |
| `theme_light()` | Light grey lines, white background |

**Customizing with `theme()`:**

```r
# Build a fully customized theme
p_theme <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  scale_fill_brewer(palette = "Set2",
                    labels = c("4"="4WD","f"="Front","r"="Rear")) +
  labs(
    title    = "Custom theme demonstration",
    subtitle = "Every visual element is controllable via theme()",
    x        = "Vehicle Class",
    y        = "Count",
    fill     = "Drive Type",
    caption  = "Source: ggplot2::mpg"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title       = element_text(face = "bold", size = 16),
    plot.subtitle    = element_text(color = "grey50", size = 11),
    axis.text.x      = element_text(angle = 30, hjust = 1),
    panel.grid.major.x = element_blank(),
    legend.position  = "top",
    legend.title     = element_text(face = "bold"),
    plot.caption     = element_text(color = "grey60", hjust = 1)
  )

p_theme
```

**Key `theme()` element functions:**

| Function | Controls |
|---|---|
| `element_text(face, size, color, angle, hjust, vjust)` | Text elements |
| `element_line(color, linewidth, linetype)` | Line elements |
| `element_rect(fill, color, linewidth)` | Rectangle/border elements |
| `element_blank()` | Remove an element entirely |

**Common `theme()` targets:**

| Target | What It Affects |
|---|---|
| `plot.title` | Chart title |
| `plot.subtitle` | Subtitle text |
| `plot.caption` | Caption at bottom-right |
| `axis.title.x / y` | Axis label text |
| `axis.text.x / y` | Axis tick labels |
| `panel.grid.major / minor` | Grid lines |
| `panel.background` | Plot area background |
| `legend.position` | `"top"`, `"bottom"`, `"left"`, `"right"`, `"none"` |
| `strip.text` | Facet panel labels |

> **TIP:** Set a theme globally for all charts in a session with `theme_set(theme_minimal())`. Every subsequent `ggplot()` call inherits that theme without repeating it. You can still override individual elements with `+ theme(...)` on specific charts.

**Try it:** Replace `theme_minimal()` with `theme_classic()`. How does the chart's overall feel change?

```r
# Your code here — swap theme_minimal() for theme_classic()
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_classic <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  scale_fill_brewer(palette = "Set2",
                    labels = c("4"="4WD","f"="Front","r"="Rear")) +
  labs(title = "theme_classic() demonstration",
       x = "Vehicle Class", y = "Count", fill = "Drive Type") +
  theme_classic(base_size = 13)

ex_classic
```

`theme_classic()` drops the grid lines entirely and draws solid black axis lines on the left and bottom — the look of a traditional scientific publication. Compared to `theme_minimal()` (white background, faint grey grid, no axis lines) the chart feels more formal and print-ready, but you lose the grid which was helping readers estimate bar heights. Pick classic for camera-ready figures, minimal for screens and dashboards.
</details>


## Common Mistakes and How to Fix Them

### Mistake 1: Mapping a variable name outside aes()

❌ `geom_point(color = drv)` passes the string `"drv"` as color, coloring all points one color:

```r
# Wrong: color = drv outside aes() is literal, not a column lookup
ggplot(mpg, aes(x = displ, y = hwy)) + geom_point(color = drv)
```

✅ Move data mappings inside `aes()`:

```r
ggplot(mpg, aes(x = displ, y = hwy, color = drv)) + geom_point()
```

### Mistake 2: Using geom_bar() with pre-computed data

❌ `geom_bar()` counts rows. Adding `y = value` causes an error unless you add `stat = "identity"`.

✅ Use `geom_col()` when you have pre-computed heights.

### Mistake 3: Scales applied after geoms that ignore them

❌ `scale_x_log10()` applied to a histogram changes the axis labels but not the bin boundaries — the histogram was already computed on the original scale.

✅ Log-transform the variable before plotting, or use `scale_x_continuous(trans = "log10")` which correctly affects `stat_bin()`.

### Mistake 4: Forgetting to load ggplot2 or a required extension

❌ `patchwork::wrap_plots()` fails silently or with a confusing error if `patchwork` isn't loaded.

✅ `library(patchwork)` before use. Extensions like `ggrepel`, `patchwork`, and `ggridges` must be explicitly loaded even when ggplot2 is already loaded.

### Mistake 5: theme() overriding theme_*() — order matters

❌ Placing `theme_minimal()` after `theme()` resets all the custom `theme()` changes:

```r
# Wrong order - theme_minimal() resets everything after it
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  theme(axis.text = element_text(color = "red")) +
  theme_minimal()  # this resets the red text!
```

✅ Always put the base theme function *before* your `theme()` customizations:

```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  theme_minimal() +  # base theme first
  theme(axis.text = element_text(color = "red"))  # customizations after
```

## Practice Exercises

### Exercise 1: Build a chart from scratch

Using only this cheat sheet as a reference, create a scatter plot of `mpg`'s `cty` (x) vs `hwy` (y) with:
- Points colored by `class` using `scale_color_brewer(palette = "Set2")`
- A regression line per class (`geom_smooth(method="lm", se=FALSE)`)
- Facets by `drv` using `facet_wrap()`
- `theme_minimal()` + a bold title

```r
# Build it here — use the tables in each section for reference
# ggplot(mpg, aes(x = cty, y = hwy, color = class)) + ...
```

### Exercise 2: Recreate a specific chart style

Build a horizontal bar chart of average `hwy` per `manufacturer` (top 10 only) that:
- Sorts bars by descending average mpg (`fct_reorder` + `coord_flip()`)
- Uses `scale_fill_viridis_d()` for fill color
- Adds value labels with `geom_text(hjust = -0.2)`
- Removes grid lines with `theme(panel.grid.major.y = element_blank())`

```r
library(forcats)
mfr_avg <- aggregate(hwy ~ manufacturer, mpg, mean)
mfr_top <- head(mfr_avg[order(-mfr_avg$hwy), ], 10)

# Build it here
# ggplot(mfr_top, aes(x = fct_reorder(manufacturer, hwy), y = hwy, fill = manufacturer)) +
#   geom_col(show.legend = FALSE) + coord_flip() + ...
```

## Complete Example

This end-to-end example assembles all five sections — geoms, aesthetics, scales, facets, and themes — into a single publication-quality chart:

```r
# Complete example: ggplot2 grammar in one chart
p_final <- ggplot(
    mpg,
    aes(x = displ, y = hwy, color = hwy, size = cyl)
  ) +
  # Layer 1: scatter points
  geom_point(alpha = 0.7) +
  # Layer 2: trend line per facet
  geom_smooth(method = "lm", se = FALSE,
              color = "grey30", linewidth = 0.7,
              aes(group = 1)) +  # one line per facet, not per color
  # Scales
  scale_color_viridis_c(option = "plasma", name = "Hwy MPG") +
  scale_size_continuous(range = c(1.5, 5), name = "Cylinders") +
  scale_x_continuous(breaks = 1:7, labels = paste0(1:7, "L")) +
  scale_y_continuous(breaks = seq(10, 45, 5)) +
  # Facets
  facet_wrap(
    ~ drv,
    labeller = labeller(drv = c("4"="4-Wheel Drive",
                                 "f"="Front-Wheel Drive",
                                 "r"="Rear-Wheel Drive"))
  ) +
  # Labels
  labs(
    title    = "Engine Displacement vs Fuel Efficiency",
    subtitle = "Points colored by highway MPG; size by cylinder count",
    x        = "Engine Displacement",
    y        = "Highway MPG",
    caption  = "Source: ggplot2::mpg"
  ) +
  # Theme
  theme_minimal(base_size = 12) +
  theme(
    plot.title     = element_text(face = "bold", size = 14),
    plot.subtitle  = element_text(color = "grey50", size = 10),
    strip.text     = element_text(face = "bold"),
    legend.position = "right",
    panel.grid.minor = element_blank()
  )

p_final
```

## Summary

**ggplot2 grammar in one line:**
`ggplot(data, aes()) + geom_*() + scale_*() + facet_*() + theme_*()`

**Quick decision guide:**

| Want to… | Use… |
|---|---|
| Plot points | `geom_point()` |
| Connect points over time | `geom_line()` |
| Show frequency counts | `geom_bar()` or `geom_histogram()` |
| Show pre-computed values | `geom_col()` |
| Show distribution | `geom_boxplot()` or `geom_violin()` |
| Add trend line | `geom_smooth(method="lm")` |
| Add labels | `geom_text()` or `ggrepel::geom_label_repel()` |
| Color by category | `aes(color=var)` + `scale_color_brewer()` |
| Color continuous | `aes(color=var)` + `scale_color_viridis_c()` |
| Custom colors | `scale_color_manual(values=c(...))` |
| Split into panels | `facet_wrap(~var)` |
| Clean white background | `theme_minimal()` or `theme_classic()` |
| Remove an element | `theme(element = element_blank())` |
| Move legend | `theme(legend.position = "top")` |

## FAQ

**What is the difference between color and fill in ggplot2?**

`color` controls the outline or stroke color — of points, lines, and text. `fill` controls the interior fill of shapes — bars, polygons, and filled circles (shape 21+). For `geom_point()` with solid shapes (the default shape 16), only `color` applies. For `geom_col()` and `geom_histogram()`, only `fill` applies to the bar interior.

**How do I save a ggplot2 chart to a file?**

Use `ggsave()`: `ggsave("chart.png", plot = p_final, width = 8, height = 5, dpi = 300)`. `ggsave()` saves the most recently printed plot if you omit the `plot` argument. Supported formats: PNG, PDF, SVG, JPEG, TIFF.

**How do I combine multiple ggplot2 charts into one figure?**

Use the `patchwork` package: `p1 + p2` places charts side-by-side; `p1 / p2` stacks them vertically; `(p1 | p2) / p3` creates a 2-over-1 layout. Annotate the combined figure with `plot_annotation(title = "...")`.

**How do I add a second y-axis in ggplot2?**

ggplot2 discourages dual y-axes for good design reasons (they are easily misleading). The supported approach uses `scale_y_continuous(sec.axis = sec_axis(~ . / 100, name = "Percent"))`. The secondary axis must be a mathematical transformation of the primary — you cannot independently scale two different variables.

**How do I reorder a categorical axis?**

Convert the variable to a factor with levels in the desired order before plotting, or use `fct_reorder()` from the `forcats` package inside `aes()`: `aes(x = fct_reorder(category, value))`. For frequency ordering, use `fct_infreq(category)`.

## References

1. ggplot2 official documentation. https://ggplot2.tidyverse.org/reference/
2. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer. https://ggplot2-book.org/
3. Wickham, H. & Grolemund, G. (2017). *R for Data Science*, Chapter 3. https://r4ds.had.co.nz/data-visualisation.html
4. RStudio/Posit ggplot2 cheat sheet (PDF). https://rstudio.github.io/cheatsheets/html/data-visualization.html
5. Wilke, C. O. (2019). *Fundamentals of Data Visualization*. O'Reilly. https://clauswilke.com/dataviz/

## Continue Learning

- **ggplot2 Getting Started** — the full introductory tutorial covering the grammar of graphics from scratch with step-by-step examples.
- **ggplot2 Scatter Plots** — deep dive into `geom_point()` with color, size, and shape mappings and overplotting solutions.
- **ggplot2 Themes in R** — comprehensive coverage of `theme()` customization to produce publication-quality charts.
