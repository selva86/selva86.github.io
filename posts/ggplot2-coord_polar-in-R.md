---
title: "ggplot2 coord_polar() in R: Build Polar Coordinate Charts"
slug: "ggplot2-coord_polar-in-R"
description: "Use ggplot2 coord_polar() in R to convert cartesian plots into polar coordinates. Build pie charts, rose plots, and circular bar charts with full code examples."
keywords: "ggplot2 coord_polar, coord_polar function R, ggplot2 coord_polar examples, R polar coordinates ggplot2, pie chart ggplot2 coord_polar, coord_polar pie chart R, ggplot2 circular plot"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "coord_polar()|ggplot2 coord_polar|ggplot2::coord_polar()|polar coordinates in ggplot2|coord_polar function"
auto_link_case_sensitive: true
target_keyword: "ggplot2 coord_polar"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 coord_polar() in R: Build Polar Coordinate Charts

<p class="lead">ggplot2 coord_polar() in R bends the x or y axis of a cartesian plot into a circle, turning bar charts into pie slices, rose plots, and circular bar charts without writing any custom geometry.</p>

[QUICK ANSWER]
coord_polar()                                # full circle, x mapped to angle
coord_polar(theta = "y")                     # map y to angle (pie chart)
coord_polar(theta = "x", start = 0)          # rotate the 12 o-clock start
coord_polar(theta = "x", direction = -1)     # reverse, counter-clockwise
coord_polar(theta = "y", clip = "off")       # let labels render outside
coord_polar() + theme_void()                 # strip axes for a clean pie
geom_bar() + coord_polar()                   # bar to wind rose
geom_col(width = 1) + coord_polar("y")       # stacked bar to pie

[DECISION TREE: Is coord_polar() the right tool?]
- bend a bar chart into a pie or rose: coord_polar() or coord_polar("y")
- flip x and y but keep cartesian: coord_flip()
- modern polar with inner radius or partial arcs: coord_radial()
- rotate axis labels, not the plot: theme(axis.text.x = element_text(angle = 90))
- sunburst or radial treemap: use ggsunburst or treemapify
- map projection for geographic data: coord_map() or coord_sf()

## What coord_polar() does in one sentence

**coord_polar() is a coordinate transformation, not a geom.** It re-maps either the x-axis or the y-axis onto an angular dimension, so a horizontal bar drawn at x = 3 sits at 3 radians around the origin instead of along a straight line. Because the geom data does not change, the same `geom_bar()` call produces a column under default cartesian coords and a pie slice under `coord_polar(theta = "y")`. That separation between geometry and coordinates is the engine behind every pie, rose, and circular bar built in ggplot2.

## Syntax

**The signature has four arguments and two sensible defaults.**

```r title="coord_polar function signature"
coord_polar(
  theta     = "x",      # which axis becomes the angle: "x" or "y"
  start     = 0,        # offset of 12 o-clock in radians
  direction = 1,        # 1 = clockwise, -1 = counter-clockwise
  clip      = "on"      # "on" trims labels at panel; "off" lets them spill
)
```

- `theta`: maps `"x"` (rose / circular bar) or `"y"` (pie) onto the angle.
- `start`: rotation offset in radians, applied after the angle mapping. `pi / 2` puts the first slice at 3 o-clock.
- `direction`: `1` runs slices clockwise, `-1` counter-clockwise.
- `clip`: set to `"off"` whenever labels need room to render outside the disc.

[NOTE]
**ggplot2 3.5.0 added coord_radial().** It supports inner radius, axis lines, and partial arcs, none of which `coord_polar()` can do. Reach for `coord_polar()` for stock pies and rose plots; reach for `coord_radial()` when you need a donut or a half circle.

## Five common patterns

**Pattern 1: pie chart from a single stacked bar.** Build one column with `geom_col()`, then bend it.

```r title="Pie chart from a stacked bar"
library(ggplot2)
library(dplyr)

share <- data.frame(
  segment = c("A", "B", "C", "D"),
  value   = c(45, 25, 20, 10)
)

ggplot(share, aes(x = "", y = value, fill = segment)) +
  geom_col(width = 1, color = "white") +
  coord_polar(theta = "y") +
  theme_void() +
  ggtitle("Market share")
#> A polar plot with four wedges summing to 100.
```

The empty `x = ""` collapses every row into one column, so the heights stack and the angles map to cumulative share.

**Pattern 2: rose plot from frequency counts.** Map `theta = "x"` and let `geom_bar()` count categories.

```r title="Rose plot from counts"
ggplot(mtcars, aes(x = factor(cyl), fill = factor(cyl))) +
  geom_bar(width = 1, color = "white") +
  coord_polar(theta = "x") +
  theme_minimal() +
  labs(x = NULL, y = NULL, fill = "Cylinders")
#> A three-petal rose; sectors sized by count per cyl.
```

**Pattern 3: circular bar chart with named items.** Same as pattern 2 but rows are individuals, not counts.

```r title="Circular bar chart"
df <- data.frame(
  name  = paste0("item_", 1:12),
  value = c(8, 14, 6, 12, 18, 9, 11, 16, 5, 13, 7, 10)
)

ggplot(df, aes(x = name, y = value, fill = value)) +
  geom_col(width = 0.9) +
  coord_polar(theta = "x", start = 0) +
  scale_fill_viridis_c() +
  theme_minimal() +
  theme(axis.text.x = element_text(size = 8))
#> A 12-petal circular bar chart, petals shaded by value.
```

**Pattern 4: rotate the start angle.** Pies look more natural when slice 1 begins at the top (the default in most BI tools).

```r title="Rotate start to 12 o-clock"
ggplot(share, aes(x = "", y = value, fill = segment)) +
  geom_col(width = 1, color = "white") +
  coord_polar(theta = "y", start = 0, direction = -1) +
  theme_void()
#> Same pie as pattern 1, slices ordered counter-clockwise from top.
```

The `direction = -1` matches how Excel and PowerBI draw pies.

**Pattern 5: half-pie gauge.** Pad the data with an empty value that occupies the unwanted half of the circle.

```r title="Half-pie gauge"
gauge <- data.frame(
  level = c("filled", "rest", "hidden"),
  value = c(35, 65, 100)
)

ggplot(gauge, aes(x = "", y = value, fill = level)) +
  geom_col(width = 1) +
  coord_polar(theta = "y", start = -pi / 2, direction = 1) +
  scale_fill_manual(values = c(filled = "#1f77b4", rest = "#cccccc", hidden = "transparent")) +
  theme_void() +
  theme(legend.position = "none")
#> Half-circle gauge: 35 percent fill on the left, grey on the right.
```

[TIP]
**Use coord_radial(inner.radius = 0.4) for donuts.** The classic hack is drawing a white circle on top of `coord_polar()`. As of ggplot2 3.5.0, `coord_radial()` exposes a real `inner.radius` argument, so the donut is one line instead of a layered workaround.

## coord_polar() vs coord_radial() and base R pie()

**Pick the function by feature, not by familiarity.**

| Feature                          | coord_polar() | coord_radial() | base pie() |
|----------------------------------|---------------|----------------|------------|
| Pie chart                        | yes           | yes            | yes        |
| Donut (inner radius)             | no            | yes            | no         |
| Partial arc / gauge              | hack only     | yes            | no         |
| Works inside a ggplot pipeline   | yes           | yes            | no         |
| Available pre-ggplot2 3.5.0      | yes           | no             | yes (base) |

[KEY INSIGHT]
**coord_polar() is a transformation lens, not a chart type.** Any geom that draws in cartesian space gets bent. A `geom_text()` label sitting at x = 5 rotates to 5 radians around the origin. Once you internalize that the angle is just the x or y mapping after warping, rose plots and gauges stop feeling like specialty charts.

## Common pitfalls

**Pitfall 1: forgetting width = 1 on geom_col().** The default `width = 0.9` leaves white gaps between pie slices.

```r title="Wrong: gaps between slices"
ggplot(share, aes(x = "", y = value, fill = segment)) +
  geom_col() +
  coord_polar(theta = "y")
#> Pie with thin white wedges between slices.
```

Set `width = 1` and the slices touch cleanly.

**Pitfall 2: confusing theta = "x" with theta = "y".** Use `theta = "y"` for pies (a single stacked bar). Use `theta = "x"` for rose plots (multiple bars around the circle). If a pie renders as a thin ring, the wrong axis is mapped.

**Pitfall 3: labels clipped at the panel edge.** `coord_polar()` defaults to `clip = "on"`, which cuts off long labels. Set `clip = "off"` and pad the plot with `theme(plot.margin = margin(20, 20, 20, 20))` so labels have room.

## Try it yourself

**Try it:** Build a pie chart from the diamonds dataset showing the share of each cut grade. Save the plot to ex_pie.

```r title="Your turn: diamonds pie"
# Try it: pie of diamond cut counts
ex_pie <- # your code here

ex_pie
#> Expected: a pie with five slices labeled Fair through Ideal.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(ggplot2)
library(dplyr)

ex_pie <- diamonds |>
  count(cut) |>
  ggplot(aes(x = "", y = n, fill = cut)) +
  geom_col(width = 1, color = "white") +
  coord_polar(theta = "y") +
  theme_void()

ex_pie
#> A pie with five wedges; Ideal is the largest.
```

**Explanation:** `count()` produces one row per cut grade with column `n`. The empty `x = ""` collapses bars into a single column, `theta = "y"` maps `n` to angle, and `theme_void()` strips the cartesian axes.

</details>

## Related ggplot2 functions

- `coord_radial()`: modern replacement with inner radius and partial arcs.
- `coord_flip()`: swaps x and y while keeping cartesian, not polar.
- `coord_fixed()`: enforces a fixed aspect ratio for accurate maps and scatter plots.
- `geom_bar()`: counts rows by category, the base for rose plots.
- `geom_col()`: uses precomputed values, the base for pies and gauges.

## FAQ

**Why does my pie chart render as a flat horizontal bar?**

You probably passed `theta = "x"` instead of `theta = "y"`. With `theta = "x"` and a single bar (`x = ""`), there is no angular variation to draw, so coord_polar collapses the bar into a thin ring. Switch to `theta = "y"` and the heights of the stacked bar become slice angles. The visual cue: if your pie looks like a doughnut squashed into a pancake, the axis is wrong.

**Can I add data labels to a pie made with coord_polar()?**

Yes. Compute label positions in the data (cumulative angle midpoints), then add `geom_text(aes(label = value), position = position_stack(vjust = 0.5))` before `coord_polar()`. The labels inherit the polar transformation along with the bars, so they sit on each slice automatically.

**Is coord_polar() deprecated in favor of coord_radial()?**

No. `coord_polar()` still works in current ggplot2 and is the right pick for stock pies and rose plots. `coord_radial()` (ggplot2 3.5.0+) is a superset for donuts, partial arcs, and richer axis customization, but it is overkill for a plain pie.

**Why are my bar widths uneven after coord_polar()?**

You almost certainly forgot `width = 1` on `geom_col()` or `geom_bar()`. The default 0.9 leaves gaps between bars; in polar coordinates those gaps render as visible white wedges around the disc. Setting `width = 1` makes adjacent bars meet exactly.

**Can I draw a true half-circle with coord_polar()?**

Not directly. `coord_polar()` always draws a full 2 pi sweep. The common workaround pads the data with an empty value that occupies the unwanted half (see pattern 5 above). For a real half circle without the padding trick, switch to `coord_radial(start = -pi / 2, end = pi / 2)`.

External reference: [ggplot2 coord_polar() docs](https://ggplot2.tidyverse.org/reference/coord_polar.html).
