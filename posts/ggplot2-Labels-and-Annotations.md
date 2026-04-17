---
title: "ggplot2 Labels and Annotations: Add Context Without Cluttering Your Chart"
slug: "ggplot2-Labels-and-Annotations"
description: "Label your plots effectively: labs() for titles and axis labels, geom_text() and geom_label() for data labels, ggrepel for non-overlapping annotations."
keywords: "ggplot2 labels, ggplot2 annotations, geom_text, geom_label, ggrepel, annotate ggplot2, labs ggplot2, ggplot2 titles, ggplot2 captions, geom_text_repel"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.11"
post_type: "C"
auto_link_terms: "ggplot2 labels|ggplot2 annotations|geom_text()|geom_label()|ggrepel|annotate()|labs()|geom_text_repel()"
auto_link_case_sensitive: true
sidebar_section: "Visualization"
sidebar_title: "Labels & Annotations"
sidebar_order: 6
difficulty: "Intermediate"
---

# ggplot2 Labels and Annotations: Add Context Without Cluttering Your Chart

<p class="lead">Labels and annotations turn a raw ggplot2 chart into a self-explanatory story, use <code>labs()</code> for titles, <code>geom_text()</code> for data-driven labels, <code>ggrepel</code> for overlap-free placement, and <code>annotate()</code> for custom callouts.</p>

## Introduction

A chart without labels is like a map without street names. The axes, points, and bars may be technically accurate, but your reader has no idea what they are looking at. Good labels answer the three questions every viewer asks: "What am I seeing?", "What stands out?", and "Why does it matter?"

ggplot2 gives you five labeling tools that cover every scenario. `labs()` handles the big-picture metadata, titles, subtitles, axis names, and captions. `geom_text()` and `geom_label()` attach labels directly to data points. The `ggrepel` package pushes those labels apart so they never overlap. And `annotate()` lets you drop custom text, rectangles, or arrows at any coordinate.

In this tutorial, you will learn how each function works, when to pick one over another, and how to combine them into a polished, self-explanatory chart. All code runs directly in your browser, just hit the Run button or press Ctrl+Enter.

![Overview of ggplot2 labeling and annotation functions](screenshots/ggplot2-Labels-and-Annotations-overview-mindmap.webp)
*Figure 1: Overview of ggplot2 labeling and annotation functions.*

Let's start by loading the libraries we need and creating a base plot to work with throughout this tutorial.

```r title="Build the base scatter plot"
# Load libraries (run this block first)
library(ggplot2)
library(ggrepel)

# Base scatter plot we'll reuse
p_base <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(color = "steelblue", size = 2.5)

p_base
```

## How does labs() control titles, axes, and captions?

The `labs()` function is the single entry point for all plot metadata text. It sets the title, subtitle, caption, axis labels, and even a tag (useful for multi-panel figures). Think of it as the "headline layer" of your chart.

Every argument in `labs()` maps to a specific text element on the plot. The title sits at the top, the subtitle just below it, the caption in the bottom-right corner, and the tag in the top-left.

```r title="Add title, subtitle, caption with labs"
# Add metadata labels with labs()
p_labs <- p_base +
  labs(
    title    = "Fuel Economy vs. Car Weight",
    subtitle = "Heavier cars burn more fuel per mile",
    caption  = "Source: 1974 Motor Trend magazine (mtcars dataset)",
    x        = "Weight (1000 lbs)",
    y        = "Miles per Gallon",
    tag      = "A"
  )

p_labs
```

The title tells the reader what the chart shows. The subtitle adds the takeaway. The caption credits the data source, a small touch that builds trust. The tag is handy when you have "Figure A", "Figure B" panels in a report.

[TIP]
**Always include a caption with your data source.** Readers and reviewers trust charts more when they can trace the data back to its origin. Use `labs(caption = "Source: ...")` for this.

You can also style these text elements with `theme()`. Here is how to make the title bold, center it, and shrink the caption.

```r title="Style metadata text with theme"
# Style the metadata text
p_labs +
  theme(
    plot.title    = element_text(face = "bold", size = 16, hjust = 0.5),
    plot.subtitle = element_text(color = "grey40", size = 12, hjust = 0.5),
    plot.caption  = element_text(size = 8, color = "grey60")
  )
```

The `hjust = 0.5` argument centers the text. A value of 0 aligns left, and 1 aligns right. The `face` argument accepts "bold", "italic", "bold.italic", or "plain".

**Try it:** Create a scatter plot of `mtcars` with `hp` on the x-axis and `mpg` on the y-axis. Add a title, subtitle, and caption using `labs()`.

```r title="Exercise: Add labs to hp scatter"
# Try it: add labs() to a new scatter
ex_plot <- ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point() # add labs() below

# your code here

ex_plot
#> Expected: a scatter with title, subtitle, and caption
```

<details>
<summary>Click to reveal solution</summary>

```r title="hp scatter labs solution"
ex_plot <- ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point() +
  labs(
    title    = "Horsepower vs. Fuel Economy",
    subtitle = "More horsepower generally means lower mpg",
    caption  = "Source: mtcars dataset"
  )
ex_plot
```

**Explanation:** `labs()` accepts title, subtitle, and caption as named arguments. Each one appears at the standard position on the chart.

</details>

## How do geom_text() and geom_label() place data-driven labels?

When you want to attach a label to each data point, the car name next to its dot, the revenue figure above a bar, you need `geom_text()` or `geom_label()`. Both map the `label` aesthetic to a column in your data. The difference is that `geom_label()` draws a filled rectangle behind the text.

![Decision guide: which labeling function fits your need](screenshots/ggplot2-Labels-and-Annotations-decision-flow.webp)
*Figure 2: Decision guide: which labeling function fits your need.*

Let's label each point with the car's row name using `geom_text()`.

```r title="geomtext labels every point"
# geom_text() labels each point
p_text <- ggplot(mtcars, aes(x = wt, y = mpg, label = rownames(mtcars))) +
  geom_point(color = "steelblue", size = 2) +
  geom_text(size = 3, hjust = -0.1) +
  labs(title = "geom_text(): raw labels")

p_text
```

The result is messy because labels overlap heavily. That is expected, we will fix it with `ggrepel` in the next section. For now, notice that `geom_text()` takes several positioning arguments.

Now let's compare with `geom_label()`, which adds a background rectangle.

```r title="geomlabel draws boxed subset labels"
# geom_label() adds a background box
p_label <- ggplot(
  mtcars[mtcars$mpg > 28, ],
  aes(x = wt, y = mpg, label = rownames(mtcars[mtcars$mpg > 28, ]))
) +
  geom_point(color = "steelblue", size = 3) +
  geom_label(
    nudge_y     = 0.8,
    size        = 3,
    fill        = "lightyellow",
    label.size  = 0.3
  ) +
  labs(title = "geom_label(): boxed labels for a subset")

p_label
```

The `nudge_y = 0.8` pushes each label slightly above its point. The `fill` argument colors the box, and `label.size` controls the border thickness. Use `geom_label()` when you need high contrast against a busy background.

[WARNING]
**geom_text() size is in millimeters, not points.** A `size = 12` in geom_text does not match `size = 12` in theme(). Roughly, multiply mm by 2.85 to get points. Use `size = 3` to `size = 4` for most label tasks.

Key positioning arguments for both functions:

| Argument | What it does | Example values |
|---|---|---|
| `nudge_x`, `nudge_y` | Shift label away from point | `0.1`, `-0.5` |
| `hjust`, `vjust` | Horizontal/vertical justification | 0 (left), 0.5 (center), 1 (right) |
| `check_overlap` | Hide labels that would overlap | `TRUE` / `FALSE` |
| `angle` | Rotate text in degrees | `45`, `90` |

**Try it:** Filter `mtcars` to cars with `mpg > 30` and label those points using `geom_text()`. Use `nudge_y = 1` so labels sit above the dots.

```r title="Exercise: Label cars above thirty mpg"
# Try it: label high-mpg cars
ex_high <- mtcars[mtcars$mpg > 30, ]
ex_text <- ggplot(ex_high, aes(x = wt, y = mpg, label = rownames(ex_high))) +
  geom_point(size = 3) # add geom_text() below

# your code here

ex_text
#> Expected: scatter with 4 labeled points above dots
```

<details>
<summary>Click to reveal solution</summary>

```r title="High-mpg label solution"
ex_high <- mtcars[mtcars$mpg > 30, ]
ex_text <- ggplot(ex_high, aes(x = wt, y = mpg, label = rownames(ex_high))) +
  geom_point(size = 3) +
  geom_text(nudge_y = 1, size = 3)
ex_text
```

**Explanation:** `nudge_y = 1` shifts each label one unit above its data point so they do not sit directly on the dot.

</details>

## How does ggrepel prevent overlapping labels?

The `ggrepel` package solves the biggest pain point in plot labeling: overlapping text. Its `geom_text_repel()` and `geom_label_repel()` functions work like their base counterparts but use a physics simulation to push labels apart. Each label connects back to its data point with a thin segment.

Let's see the difference. Here is the same all-cars scatter, but with `geom_text_repel()` instead of `geom_text()`.

```r title="geomtextrepel prevents overlaps"
# geom_text_repel() pushes labels apart
set.seed(42)
p_repel <- ggplot(mtcars, aes(x = wt, y = mpg, label = rownames(mtcars))) +
  geom_point(color = "steelblue", size = 2) +
  geom_text_repel(size = 2.5, max.overlaps = 15) +
  labs(title = "geom_text_repel(): no overlapping labels")

p_repel
```

Much cleaner. The `max.overlaps` argument controls how many overlapping labels the function will try to resolve before giving up and hiding the rest. Increase it to show more labels on dense plots.

[KEY INSIGHT]
**ggrepel is deterministic when you set a seed.** Call `set.seed()` before `geom_text_repel()` and the labels will land in the same positions every time you render the plot. This matters for reproducible reports.

Now let's style `geom_label_repel()` for a polished look.

```r title="Styled geomlabelrepel for top ten"
# Styled geom_label_repel()
set.seed(99)
top10 <- mtcars[order(mtcars$mpg, decreasing = TRUE)[1:10], ]

p_lrepel <- ggplot(top10, aes(x = wt, y = mpg, label = rownames(top10))) +
  geom_point(color = "steelblue", size = 3) +
  geom_label_repel(
    fill          = "white",
    box.padding   = 0.5,
    segment.color = "grey50",
    size          = 3
  ) +
  labs(title = "Top 10 most fuel-efficient cars")

p_lrepel
```

The `box.padding` argument adds space between the label box and its point. The `segment.color` controls the connecting line color. These small tweaks make labels look intentional rather than cluttered.

Useful `ggrepel` parameters at a glance:

| Parameter | Purpose | Good default |
|---|---|---|
| `max.overlaps` | Max overlaps before hiding | 10-20 |
| `box.padding` | Space around label box | 0.35-0.5 |
| `point.padding` | Space between label and point | 0.3 |
| `segment.color` | Connector line color | "grey50" |
| `segment.size` | Connector line width | 0.3-0.5 |
| `min.segment.length` | Hide short segments | 0.2 |
| `direction` | Repel direction | "both", "x", "y" |
| `force` | Repulsion strength | 1 (default) |

**Try it:** Take the 5 heaviest cars in `mtcars` (highest `wt`) and label them with `geom_text_repel()`. Set the seed to 123.

```r title="Exercise: Label five heaviest cars"
# Try it: label the 5 heaviest cars
set.seed(123)
ex_heavy <- mtcars[order(mtcars$wt, decreasing = TRUE)[1:5], ]

ex_repel <- ggplot(ex_heavy, aes(x = wt, y = mpg, label = rownames(ex_heavy))) +
  geom_point(size = 3) # add geom_text_repel() below

# your code here

ex_repel
#> Expected: 5 labeled points with no overlaps
```

<details>
<summary>Click to reveal solution</summary>

```r title="Five heaviest solution"
set.seed(123)
ex_heavy <- mtcars[order(mtcars$wt, decreasing = TRUE)[1:5], ]

ex_repel <- ggplot(ex_heavy, aes(x = wt, y = mpg, label = rownames(ex_heavy))) +
  geom_point(size = 3) +
  geom_text_repel(size = 3)
ex_repel
```

**Explanation:** `geom_text_repel()` automatically spaces labels so they do not overlap, connecting each to its point with a segment line.

</details>

## How does annotate() add custom text, shapes, and arrows?

Sometimes you need to highlight something that is not tied to a specific data point. Maybe you want to label a region of the chart, draw a rectangle around outliers, or add an arrow pointing to an interesting observation. That is what `annotate()` is for.

Unlike `geom_text()`, which maps data columns to aesthetics, `annotate()` places a single geom at fixed coordinates you specify. It does not need a `label` column in your data.

Let's add a text annotation to our base scatter.

```r title="annotate text at fixed position"
# annotate() places text at fixed coordinates
p_ann <- p_base +
  annotate(
    "text",
    x     = 4.5,
    y     = 30,
    label = "Light cars get\nbetter mileage",
    size  = 4,
    color = "darkred",
    fontface = "italic"
  ) +
  labs(title = "annotate('text'): fixed-position note")

p_ann
```

The `\n` inside the label string creates a line break. The `fontface` argument accepts "plain", "bold", "italic", or "bold.italic". Notice that `annotate()` does not require an `aes()` call, you pass x, y, and label directly.

Now let's combine a highlighted rectangle with an arrow and a label.

```r title="Combine rect, arrow, and text"
# Combine rect, segment with arrow, and text
p_shapes <- p_base +
  annotate(
    "rect",
    xmin = 1.5, xmax = 2.5,
    ymin = 25,  ymax = 35,
    alpha = 0.15, fill = "gold"
  ) +
  annotate(
    "segment",
    x = 3.5, xend = 2.5,
    y = 33,  yend = 30,
    arrow = arrow(length = unit(0.2, "cm")),
    color = "darkred"
  ) +
  annotate(
    "text",
    x = 3.7, y = 33.5,
    label = "Efficient zone",
    size = 3.5, color = "darkred"
  ) +
  labs(title = "Rectangles, arrows, and labels with annotate()")

p_shapes
```

The gold rectangle highlights the "efficient zone", cars that are light and get good mileage. The arrow draws the eye from the label to the region. Together, they tell a story without adding clutter.

[TIP]
**Use annotate("rect") with low alpha for region highlights.** An alpha of 0.1 to 0.2 tints the background without hiding data points underneath. Pair it with a text label and arrow for maximum clarity.

Here is a quick reference for common `annotate()` geom types:

| Geom type | Required args | Use case |
|---|---|---|
| `"text"` | x, y, label | Fixed-position note |
| `"label"` | x, y, label | Boxed fixed-position note |
| `"rect"` | xmin, xmax, ymin, ymax | Highlight a region |
| `"segment"` | x, y, xend, yend | Straight line or arrow |
| `"curve"` | x, y, xend, yend | Curved connector |
| `"pointrange"` | x, y, ymin, ymax | Error bar at a fixed position |

**Try it:** Add an `annotate("segment")` arrow to the base scatter pointing from coordinates (4, 30) to the data point for "Toyota Corolla" (wt = 1.835, mpg = 33.9). Add a text annotation at (4.2, 30) that says "Best mpg".

```r title="Exercise: Arrow pointing to Toyota Corolla"
# Try it: arrow pointing to Toyota Corolla
ex_ann <- p_base # add annotate() calls below

# your code here

ex_ann
#> Expected: scatter with arrow pointing to Toyota Corolla + "Best mpg" label
```

<details>
<summary>Click to reveal solution</summary>

```r title="Toyota Corolla arrow solution"
ex_ann <- p_base +
  annotate(
    "segment",
    x = 4, xend = 1.95,
    y = 30, yend = 33.5,
    arrow = arrow(length = unit(0.2, "cm")),
    color = "darkred"
  ) +
  annotate(
    "text",
    x = 4.2, y = 30,
    label = "Best mpg",
    size = 3.5, color = "darkred"
  )
ex_ann
```

**Explanation:** The segment starts at (4, 30) and ends near Toyota Corolla. The `arrow()` function adds an arrowhead at the end point. The text sits just to the right of the segment start.

</details>

## How do you style and position label text with theme()?

Every text element on a ggplot2 chart, the title, axis labels, tick marks, legend text, can be customized through `theme()` and `element_text()`. This is where you make your labels look professional instead of default.

![How annotation layers stack onto a base plot](screenshots/ggplot2-Labels-and-Annotations-layer-stack.webp)
*Figure 3: How annotation layers stack onto a base plot.*

The key parameters inside `element_text()` are `size`, `face`, `color`, `family`, `hjust`, `vjust`, `angle`, and `lineheight`. Let's see them in action.

```r title="Full theme customization of text"
# Full theme customization of text elements
p_styled <- p_base +
  labs(
    title    = "Fuel Economy vs. Weight",
    subtitle = "Data from the 1974 Motor Trend US magazine",
    x        = "Weight (1000 lbs)",
    y        = "Miles per Gallon",
    caption  = "Source: mtcars dataset"
  ) +
  theme_minimal() +
  theme(
    plot.title      = element_text(face = "bold", size = 16, hjust = 0.5),
    plot.subtitle   = element_text(size = 11, color = "grey40", hjust = 0.5),
    plot.caption    = element_text(size = 8, color = "grey50", hjust = 1),
    axis.title      = element_text(face = "bold", size = 12),
    axis.text       = element_text(size = 10),
    axis.text.x     = element_text(angle = 0),
    axis.title.y    = element_text(margin = margin(r = 10))
  )

p_styled
```

The `margin()` function on `axis.title.y` adds 10 points of right-side padding, pushing the y-axis title away from the tick labels. This small adjustment prevents the title from cramming into the numbers.

[NOTE]
**hjust and vjust use 0-to-1 scales.** For horizontal justification: 0 = left-aligned, 0.5 = centered, 1 = right-aligned. For vertical: 0 = bottom, 0.5 = middle, 1 = top. These work inside both `element_text()` and `geom_text()`.

Here is a reference table for the most useful `theme()` text components:

| Component | What it controls |
|---|---|
| `plot.title` | Main title |
| `plot.subtitle` | Subtitle below title |
| `plot.caption` | Caption (bottom-right by default) |
| `plot.tag` | Panel tag (top-left by default) |
| `axis.title` | Both axis titles |
| `axis.title.x` | X-axis title only |
| `axis.title.y` | Y-axis title only |
| `axis.text` | Both axes tick labels |
| `legend.title` | Legend title |
| `legend.text` | Legend item labels |
| `strip.text` | Facet strip labels |

**Try it:** Take the `p_base` scatter and add `labs()` with a title and axis labels. Then center the title with `theme()` and make the axis titles bold.

```r title="Exercise: Center title and bold axes"
# Try it: center title, bold axes
ex_theme <- p_base +
  labs(title = "My Custom Plot", x = "Weight", y = "MPG") # add theme() below

# your code here

ex_theme
#> Expected: centered title, bold axis labels
```

<details>
<summary>Click to reveal solution</summary>

```r title="Center and bold solution"
ex_theme <- p_base +
  labs(title = "My Custom Plot", x = "Weight", y = "MPG") +
  theme(
    plot.title = element_text(hjust = 0.5),
    axis.title = element_text(face = "bold")
  )
ex_theme
```

**Explanation:** `hjust = 0.5` centers the title, and `face = "bold"` makes both axis titles bold in a single call via `axis.title`.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using geom_text() size as if it were points

```r title="Mistake: size fourteen swallows chart"
# Wrong: size = 14 is huge in geom_text (it uses mm)
ggplot(mtcars[1:3, ], aes(x = wt, y = mpg, label = rownames(mtcars[1:3, ]))) +
  geom_point() +
  geom_text(size = 14)
```

**Why it is wrong:** `geom_text()` measures size in millimeters, not points. A `size = 14` creates enormous text that swallows the chart. The `theme()` function uses points.

```r title="Correct: size three or four"
# Correct: size = 3 to 4 is normal for geom_text
ggplot(mtcars[1:3, ], aes(x = wt, y = mpg, label = rownames(mtcars[1:3, ]))) +
  geom_point() +
  geom_text(size = 3.5, nudge_y = 0.5)
```

### Mistake 2: Using geom_text() on dense data instead of ggrepel

```r title="Mistake: All thirty-two labels pile up"
# Wrong: all 32 labels pile up
ggplot(mtcars, aes(x = wt, y = mpg, label = rownames(mtcars))) +
  geom_point() +
  geom_text(size = 2.5)
```

**Why it is wrong:** With 32 points close together, `geom_text()` draws every label at its exact data coordinate. The result is an unreadable mess of overlapping text.

```r title="Correct: ggrepel spreads labels"
# Correct: ggrepel pushes labels apart
set.seed(42)
ggplot(mtcars, aes(x = wt, y = mpg, label = rownames(mtcars))) +
  geom_point() +
  geom_text_repel(size = 2.5, max.overlaps = 20)
```

### Mistake 3: Putting fixed text inside aes() instead of using annotate()

```r title="Mistake: Fixed label inside aes"
# Wrong: aes(label = "Note") repeats the label for every row
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_text(aes(label = "Important!"), x = 3, y = 30, size = 4)
#> Draws "Important!" 32 times on top of each other
```

**Why it is wrong:** When a fixed string goes inside `aes()`, ggplot2 maps it to every row of the data. You get 32 overlapping copies of the same text, which renders slowly and looks like one bold label (but is not).

```r title="Correct: annotate for fixed text"
# Correct: use annotate() for fixed-position text
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate("text", x = 3, y = 30, label = "Important!", size = 4)
```

### Mistake 4: Hardcoding annotate() coordinates that break with new data

```r title="Mistake: Hardcoded coordinates drift"
# Fragile: coordinates only work for this specific data range
p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate("text", x = 5.5, y = 34, label = "Top right note")

# If you filter to mpg < 25, the annotation floats outside the visible area
```

**Why it is wrong:** If the data range changes (new data, different filter), hardcoded coordinates can land outside the plot area or in the wrong spot.

```r title="Correct: Inf anchors to corner"
# Better: use Inf or data-derived coordinates
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate(
    "text",
    x = Inf, y = Inf,
    label = "Top right note",
    hjust = 1.1, vjust = 1.5,
    size = 4
  )
#> Always anchored to the top-right corner regardless of data range
```

## Practice Exercises

### Exercise 1: Labeled scatter with ggrepel and labs

Build a scatter plot of `mtcars` with `wt` on the x-axis and `mpg` on the y-axis. Add a title, subtitle, and caption using `labs()`. Then label only the 6-cylinder cars using `geom_text_repel()`. Color the 6-cylinder points differently.

```r title="Exercise: Highlight six-cylinder cars"
# Exercise 1: combine labs() + ggrepel for 6-cylinder cars
# Hint: create a subset for cyl == 6, pass it as the data argument to geom_text_repel()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Six-cylinder highlight solution"
my_cyl6 <- mtcars[mtcars$cyl == 6, ]

set.seed(42)
my_plot1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(color = "grey60", size = 2) +
  geom_point(data = my_cyl6, color = "tomato", size = 3) +
  geom_text_repel(
    data  = my_cyl6,
    aes(label = rownames(my_cyl6)),
    size  = 3,
    color = "tomato"
  ) +
  labs(
    title    = "6-Cylinder Cars in mtcars",
    subtitle = "Labeled points are 6-cylinder models",
    caption  = "Source: mtcars dataset",
    x        = "Weight (1000 lbs)",
    y        = "Miles per Gallon"
  ) +
  theme_minimal()

my_plot1
```

**Explanation:** Passing `my_cyl6` as the `data` argument to both `geom_point()` and `geom_text_repel()` layers them on top of the full dataset scatter. The `ggrepel` labels only appear for the subset.

</details>

### Exercise 2: Bar chart with value labels and annotated highlight

Create a bar chart showing mean `mpg` by `cyl` group. Add the numeric value on top of each bar using `geom_text()`. Then use `annotate("rect")` to highlight the tallest bar with a gold rectangle, and add a curved arrow with `annotate("curve")` pointing to it with a text note saying "Most efficient".

```r title="Exercise: Bar chart with annotations"
# Exercise 2: bar chart + value labels + annotation
# Hint: first compute mean mpg per cyl with aggregate()
# Then use geom_col() for bars and geom_text() for value labels
# Use annotate("rect"), annotate("curve"), and annotate("text")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Bar chart annotations solution"
my_agg <- aggregate(mpg ~ cyl, data = mtcars, FUN = mean)

my_plot2 <- ggplot(my_agg, aes(x = factor(cyl), y = mpg)) +
  geom_col(fill = "steelblue", width = 0.6) +
  geom_text(
    aes(label = round(mpg, 1)),
    vjust = -0.5,
    size  = 4
  ) +
  annotate(
    "rect",
    xmin = 0.6, xmax = 1.4,
    ymin = 0,   ymax = 27,
    alpha = 0.15, fill = "gold"
  ) +
  annotate(
    "curve",
    x = 2.5, xend = 1.2,
    y = 24,  yend = 26.5,
    curvature = -0.3,
    arrow = arrow(length = unit(0.2, "cm")),
    color = "darkred"
  ) +
  annotate(
    "text",
    x = 2.6, y = 24,
    label = "Most efficient",
    hjust = 0,
    color = "darkred",
    size  = 3.5
  ) +
  labs(
    title = "Average MPG by Cylinder Count",
    x     = "Cylinders",
    y     = "Mean Miles per Gallon"
  ) +
  theme_minimal() +
  ylim(0, 30)

my_plot2
```

**Explanation:** `geom_col()` creates bars from pre-computed values. `geom_text()` with `vjust = -0.5` places value labels just above each bar. The `annotate("curve")` with negative curvature draws an arc from the label to the 4-cylinder bar.

</details>

## Putting It All Together

Here is a complete example that combines every labeling technique from this tutorial into one polished chart.

```r title="End-to-end labelled mtcars chart"
# Complete example: all labeling tools in one chart
set.seed(77)

# Identify notable cars
top3 <- mtcars[order(mtcars$mpg, decreasing = TRUE)[1:3], ]

final_plot <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  # Data points
  geom_point(aes(color = factor(cyl)), size = 2.5) +

  # ggrepel labels for top 3
  geom_label_repel(
    data  = top3,
    aes(label = rownames(top3)),
    fill  = "white",
    size  = 3,
    box.padding = 0.5,
    segment.color = "grey40"
  ) +

  # Highlight the efficient zone
  annotate(
    "rect",
    xmin = 1.5, xmax = 2.5,
    ymin = 25,  ymax = 35,
    alpha = 0.1, fill = "forestgreen"
  ) +

  # Arrow pointing to the zone
  annotate(
    "curve",
    x = 3.8, xend = 2.6,
    y = 32,  yend = 30,
    curvature = 0.3,
    arrow = arrow(length = unit(0.15, "cm")),
    color = "forestgreen"
  ) +
  annotate(
    "text",
    x = 3.9, y = 32.5,
    label = "Sweet spot:\nlight & efficient",
    size = 3,
    color = "forestgreen",
    fontface = "italic"
  ) +

  # Metadata
  labs(
    title    = "Car Weight vs. Fuel Economy",
    subtitle = "Top 3 most efficient cars labeled, sweet spot highlighted",
    caption  = "Source: 1974 Motor Trend US magazine",
    x        = "Weight (1000 lbs)",
    y        = "Miles per Gallon",
    color    = "Cylinders"
  ) +

  # Theme styling
  theme_minimal() +
  theme(
    plot.title    = element_text(face = "bold", size = 15, hjust = 0.5),
    plot.subtitle = element_text(size = 10, color = "grey40", hjust = 0.5),
    plot.caption  = element_text(size = 8, color = "grey50"),
    legend.position = "bottom"
  )

final_plot
```

This chart uses `labs()` for the title, subtitle, caption, and legend label. It uses `geom_label_repel()` to name the top 3 cars without overlap. It uses `annotate()` for the highlighted region, curved arrow, and descriptive note. And it uses `theme()` to center the title, style the subtitle, and move the legend to the bottom.

## Summary

| Function | Purpose | Data-driven? | Key arguments |
|---|---|---|---|
| `labs()` | Titles, axes, caption, tag | No | title, subtitle, caption, x, y, tag |
| `geom_text()` | Text at data coordinates | Yes | label, size, nudge_x, nudge_y, hjust, vjust |
| `geom_label()` | Boxed text at data coords | Yes | label, fill, label.size, label.padding |
| `geom_text_repel()` | Non-overlapping text | Yes | max.overlaps, box.padding, segment.color |
| `geom_label_repel()` | Non-overlapping boxed text | Yes | Same as above + fill, label.size |
| `annotate()` | Fixed-position marks | No | geom type, x, y, label, fill, arrow |
| `theme()` + `element_text()` | Style all text | No | size, face, color, hjust, family |

The golden rule: use `labs()` for plot-level metadata, `geom_text()`/`geom_label()` when labels come from data columns, `ggrepel` when those labels might overlap, and `annotate()` for one-off callouts at fixed positions.

## FAQ

### What is the difference between geom_text() and geom_label()?

`geom_text()` draws plain text at each data point. `geom_label()` does the same but adds a filled rectangle behind the text, making it easier to read against busy backgrounds. Use `geom_label()` when your chart has many overlapping elements.

### Can I use markdown or HTML in ggplot2 labels?

Not with the base functions. However, the `ggtext` package provides `element_markdown()` for titles and `geom_richtext()` for data labels. These let you use bold, italic, colors, and even images inside label text.

### How do I label only specific points, not all of them?

Pass a filtered subset as the `data` argument to `geom_text()` or `geom_text_repel()`. For example: `geom_text_repel(data = mtcars[mtcars$cyl == 6, ], aes(label = rownames(...)))`. This adds labels only for the subset while keeping all points visible.

### Why do my ggrepel labels still overlap?

Increase `max.overlaps` (default is 10) to allow more labels. Increase `force` to push labels harder. Reduce label `size`. Or filter your data to label fewer points. With hundreds of points, labeling all of them is impractical, pick the top N most interesting.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Chapter 8: Annotations. [Link](https://ggplot2-book.org/annotations.html)
2. ggplot2 documentation, `labs()` reference. [Link](https://ggplot2.tidyverse.org/reference/labs.html)
3. ggplot2 documentation, `geom_text()` and `geom_label()` reference. [Link](https://ggplot2.tidyverse.org/reference/geom_text.html)
4. Slowikowski, K., ggrepel: Automatically Position Non-Overlapping Text Labels. CRAN. [Link](https://cran.r-project.org/package=ggrepel)
5. R-Charts, Text annotations in ggplot2 with geom_text, geom_label, ggrepel. [Link](https://r-charts.com/ggplot2/text-annotations/)
6. R Graph Gallery, Add text labels with ggplot2. [Link](https://r-graph-gallery.com/275-add-text-labels-with-ggplot2.html)
7. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. Visualization chapters. [Link](https://r4ds.hadley.nz/)

## Continue Learning

Now that your charts communicate clearly with labels and annotations, here are natural next steps on r-statistics.co:

- **ggplot2 Themes**, Customize fonts, backgrounds, and spacing across the entire chart to match your brand or publication style.
- **ggplot2 Facets**, Split one plot into a grid of subplots by category, so labels and annotations scale across groups.
- **ggplot2 Scales and Axes**, Control how axes, colors, and legends translate data values into visual properties.
