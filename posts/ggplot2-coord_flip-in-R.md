---
title: "ggplot2 coord_flip() in R: Horizontal Bar and Box Plots"
slug: "ggplot2-coord_flip-in-R"
description: "Use ggplot2 coord_flip() in R to swap the x and y axes and turn vertical bar, box, and lollipop charts into clean horizontal versions with readable labels."
keywords: "ggplot2 coord_flip, coord_flip function R, ggplot2 coord_flip examples, R horizontal bar chart ggplot2, flip axes ggplot, ggplot2 horizontal box plot, coord_flip vs orientation"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "coord_flip()|ggplot2 coord_flip|ggplot2::coord_flip()|flip axes ggplot|horizontal bar chart in ggplot2"
auto_link_case_sensitive: true
target_keyword: "ggplot2 coord_flip"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 coord_flip() in R: Horizontal Bar and Box Plots

<p class="lead">ggplot2 coord_flip() in R swaps the x and y axes after the geom is drawn, so a vertical bar chart becomes a horizontal one without rewriting the aesthetic mapping. It is the simplest way to rescue long category labels that overlap on the x axis.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_col() + coord_flip()    # vertical bars to horizontal
ggplot(df, aes(x, y)) + geom_boxplot() + coord_flip() # vertical box to horizontal
ggplot(df, aes(x, y)) + geom_point() + coord_flip()   # rotate any geom
coord_flip(xlim = c(0, 50))                           # zoom the new x axis
coord_flip(ylim = c(0, 100))                          # zoom the new y axis
coord_flip(clip = "off")                              # let labels spill outside
coord_flip(expand = FALSE)                            # remove default padding
geom_bar(orientation = "y")                           # modern alternative, no flip

[DECISION TREE: Is coord_flip() the right tool?]
- rotate any cartesian plot 90 degrees: coord_flip()
- horizontal bar chart only, ggplot2 3.3 or newer: geom_bar(orientation = "y")
- bend axis into a circle (pie or rose): coord_polar()
- force a fixed aspect ratio for maps: coord_fixed()
- reverse the direction of one axis: scale_x_reverse() or scale_y_reverse()
- reorder bars from longest to shortest: forcats::fct_reorder() + coord_flip()
- pivot the data, not the plot: tidyr::pivot_longer()

## What coord_flip() does in one sentence

**coord_flip() is a coordinate transformation that swaps the x and y axes after every layer is drawn.** Because the swap happens at the coordinate stage rather than the aesthetic stage, you keep writing `aes(x = category, y = value)` and the function rotates the canvas at render time. The benefit shows up immediately on bar charts with long category names: rotating the plot moves the labels onto the vertical axis where they have room to breathe.

## Syntax

**coord_flip() takes four arguments and zero are required.**

```r title="coord_flip function signature"
coord_flip(
  xlim   = NULL,    # limits applied to the new x axis (originally y)
  ylim   = NULL,    # limits applied to the new y axis (originally x)
  expand = TRUE,    # add 5 percent padding around the plot data
  clip   = "on"     # "on" trims geoms at the panel; "off" lets them spill
)
```

- `xlim` and `ylim`: act on the axes after flipping, so `xlim` controls what used to be the y axis.
- `expand`: set to `FALSE` for bar charts that should start exactly at zero.
- `clip`: switch to `"off"` when annotations or long bars need to render beyond the panel.

[NOTE]
**ggplot2 3.3.0 added an orientation argument to most geoms.** `geom_bar(orientation = "y")`, `geom_boxplot(orientation = "y")`, and `geom_density(orientation = "y")` produce horizontal versions without flipping the coordinates, which keeps your stats and tooltips on the correct axis. Use `coord_flip()` for legacy code and for geoms that lack `orientation`; reach for `orientation = "y"` on new code.

## Five common patterns

**Pattern 1: horizontal bar chart with long labels.** The classic use case. Long category names overlap on the x axis but fit comfortably on the y axis.

```r title="Horizontal bar with long labels"
library(ggplot2)
library(dplyr)

sales <- data.frame(
  department = c("Electronics and computing", "Home and kitchen goods",
                 "Sports and outdoor gear", "Books and stationery",
                 "Clothing and accessories"),
  revenue    = c(58, 42, 31, 27, 22)
)

ggplot(sales, aes(x = department, y = revenue)) +
  geom_col(fill = "steelblue") +
  coord_flip() +
  labs(x = NULL, y = "Revenue (USD millions)")
#> Five horizontal bars; longest label fits without rotation.
```

**Pattern 2: horizontal box plot for ordered categories.** Box plots benefit from flipping when category names are long or when comparing many groups vertically.

```r title="Horizontal box plot"
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_boxplot(fill = "lightgray") +
  coord_flip() +
  labs(x = "Cylinders", y = "Miles per gallon")
#> Three horizontal boxes; whiskers extend left and right.
```

**Pattern 3: horizontal lollipop chart.** A lollipop combines `geom_segment()` and `geom_point()`; flipping turns it horizontal in one line.

```r title="Horizontal lollipop chart"
sales_sorted <- sales |>
  arrange(revenue) |>
  mutate(department = factor(department, levels = department))

ggplot(sales_sorted, aes(x = department, y = revenue)) +
  geom_segment(aes(xend = department, y = 0, yend = revenue), color = "gray") +
  geom_point(size = 4, color = "firebrick") +
  coord_flip() +
  labs(x = NULL, y = "Revenue (USD millions)")
#> Five horizontal lollipops, ordered shortest to longest.
```

**Pattern 4: ranked bars with forcats reorder.** Reordering the factor before flipping puts the longest bar at the top, the canonical layout for ranked horizontal bars.

```r title="Ranked horizontal bars"
library(forcats)

ggplot(sales, aes(x = fct_reorder(department, revenue), y = revenue)) +
  geom_col(fill = "darkorange") +
  coord_flip() +
  labs(x = NULL, y = "Revenue (USD millions)")
#> Bars run from longest at top to shortest at bottom.
```

**Pattern 5: flipping vs the modern orientation argument.** Both code paths produce the same chart. The orientation route keeps the stat on the correct axis, which matters for `stat_summary()` and tooltips.

```r title="orientation = y vs coord_flip"
ggplot(sales, aes(x = revenue, y = fct_reorder(department, revenue))) +
  geom_col(orientation = "y", fill = "steelblue") +
  labs(x = "Revenue (USD millions)", y = NULL)
#> Same horizontal bars as pattern 4, no flip in the pipeline.
```

[TIP]
**Always reorder factors before flipping.** ggplot2 prints factor levels from bottom to top on the y axis, so `coord_flip()` reverses your visual ordering. Wrap the category in `fct_reorder()` or `fct_rev()` so the bar you expect at the top actually lands at the top.

## coord_flip() vs orientation vs swapping aes

**Three routes reach the same horizontal chart, but they differ on stats and labels.**

| Feature                                     | coord_flip() | orientation = "y" | swap x and y in aes() |
|---------------------------------------------|--------------|-------------------|----------------------|
| Works on any geom                           | yes          | only listed geoms | yes                  |
| Keeps stats on the original axis            | no           | yes               | yes                  |
| Available in ggplot2 < 3.3.0                | yes          | no                | yes                  |
| Tooltips show the correct mapping (plotly)  | no           | yes               | yes                  |
| Requires no aesthetic rewrite               | yes          | no                | no                   |

[KEY INSIGHT]
**coord_flip() rotates the canvas, orientation rotates the geom.** That is the entire mental model. When you flip the canvas, every annotation and stat sees the flipped axes too, which is why `stat_summary()` and `geom_smooth()` sometimes behave strangely after a flip. When you set `orientation = "y"`, the geom itself runs its stat horizontally and the axes stay where you put them.

## Common pitfalls

**Pitfall 1: factor levels appear reversed after flipping.** ggplot2 draws factor levels from bottom to top on the y axis. After `coord_flip()`, the first level lands at the bottom of the chart, which feels backwards for ranked bars. Fix with `fct_rev()` or by sorting the factor with `fct_reorder()`.

**Pitfall 2: geom_smooth() lines disappear or look wrong.** `geom_smooth()` fits its model along the x axis, so flipping after the fit can leave the smoother in the wrong orientation. Either use `geom_smooth(orientation = "y")` or fit the model on the swapped mapping directly with `aes(x = y_var, y = x_var)`.

**Pitfall 3: scale limits applied to the wrong axis.** After flipping, the original `scale_y_continuous(limits = ...)` still targets the value axis, but visually it now sits on the horizontal. New readers often pass limits to `scale_x_continuous()` and see no effect. Pass limits inside `coord_flip(xlim = ..., ylim = ...)` or remember that scale functions act on the pre-flip axes.

## Try it yourself

**Try it:** Build a horizontal bar chart of the median highway mileage by class from the mpg dataset, with classes ordered from highest to lowest median. Save the plot to ex_hbar.

```r title="Your turn: horizontal bar from mpg"
# Try it: horizontal median mpg by class
ex_hbar <- # your code here

ex_hbar
#> Expected: 7 horizontal bars ordered top down by median hwy.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(ggplot2)
library(dplyr)
library(forcats)

ex_hbar <- mpg |>
  group_by(class) |>
  summarise(med_hwy = median(hwy), .groups = "drop") |>
  ggplot(aes(x = fct_reorder(class, med_hwy), y = med_hwy)) +
  geom_col(fill = "steelblue") +
  coord_flip() +
  labs(x = NULL, y = "Median highway mpg")

ex_hbar
#> Seven horizontal bars, compact at top, pickup at bottom.
```

**Explanation:** `summarise()` produces one row per class with the median. `fct_reorder()` ranks the factor by that median so the largest value sits at the top after the flip. Without the reorder, classes would appear in alphabetical order from bottom to top.

</details>

## Related ggplot2 functions

- `coord_polar()`: bends an axis into a circle for pies and rose plots.
- `coord_fixed()`: enforces a fixed aspect ratio for maps and scatter plots.
- `coord_cartesian()`: zooms without dropping data, no flip applied.
- `geom_bar()`: counts rows by category; supports `orientation = "y"` since 3.3.0.
- `scale_y_reverse()`: reverses the value axis without rotating the plot.

## FAQ

**When should I use coord_flip() versus geom_bar(orientation = "y")?**

Use `coord_flip()` when the plot mixes layers that may not all support `orientation`, or when the project pins ggplot2 below 3.3.0. Use `orientation = "y"` on new code with `geom_bar()`, `geom_boxplot()`, `geom_density()`, or `geom_smooth()` because the stat runs on the correct axis and tooltips stay aligned. For a one-off chart with `geom_col()` only, both produce identical output, so pick the route that matches the rest of your codebase.

**Why does coord_flip() reverse the order of my bars?**

ggplot2 prints factor levels from bottom to top on the y axis. After flipping, the first level lands at the bottom of the chart, the opposite of what most readers expect. Wrap the category variable in `forcats::fct_rev()` or use `fct_reorder()` with the value to fix the order. Sorting the underlying data frame alone is not enough because the factor levels carry the order, not the row order.

**Does coord_flip() work with facets?**

Yes. `coord_flip()` composes cleanly with `facet_wrap()` and `facet_grid()`. Every panel rotates the same way, and free scales (`scales = "free_x"` or `"free_y"`) act on the post-flip axes, which is occasionally surprising. If you want only some facets to flip, build them as separate plots and stitch with `patchwork::wrap_plots()`.

**Can I set axis limits after coord_flip()?**

Yes, but inside `coord_flip()` itself: `coord_flip(xlim = c(0, 100))`. Passing limits to `scale_x_continuous()` after `coord_flip()` still acts on the original x axis (the post-flip vertical), which feels inverted. The cleanest pattern is to put display ranges inside the coord call and reserve `scale_*_continuous()` for transformations and breaks.

External reference: [ggplot2 coord_flip() documentation](https://ggplot2.tidyverse.org/reference/coord_flip.html).
