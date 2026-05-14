---
title: "ggplot2 coord_cartesian() in R: Zoom Without Dropping Data"
slug: "ggplot2-coord_cartesian-in-R"
description: "Use ggplot2 coord_cartesian() in R to zoom a plot to a chosen x or y window without removing data outside the limits, so stats and smoothers stay intact."
keywords: "ggplot2 coord_cartesian, coord_cartesian function R, ggplot2 coord_cartesian examples, R xlim ylim ggplot, coord_cartesian vs xlim, ggplot2 zoom plot, coord_cartesian vs scale_x_continuous"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "coord_cartesian()|ggplot2 coord_cartesian|ggplot2::coord_cartesian()|zoom plot in ggplot2|coord_cartesian xlim ylim"
auto_link_case_sensitive: true
target_keyword: "ggplot2 coord_cartesian"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 coord_cartesian() in R: Zoom Without Dropping Data

<p class="lead">ggplot2 coord_cartesian() in R zooms a plot to a specific x or y window without filtering the underlying data, so smoothers, regression lines, and statistical layers keep using every row. It is the safe alternative to xlim() and scale_x_continuous(limits = ...), both of which silently drop points outside the window before stats run.</p>

[QUICK ANSWER]
coord_cartesian(xlim = c(0, 50))                       # zoom the x axis
coord_cartesian(ylim = c(10, 30))                      # zoom the y axis
coord_cartesian(xlim = c(0, 50), ylim = c(10, 30))     # zoom both
coord_cartesian(expand = FALSE)                        # remove default padding
coord_cartesian(clip = "off")                          # let labels spill outside
coord_cartesian(default = TRUE)                        # use as a base coord
ggplot(df, aes(x, y)) + geom_point() + coord_cartesian(xlim = c(0, 10))
ggplot(df, aes(x, y)) + geom_smooth() + coord_cartesian(ylim = c(0, 5))

[DECISION TREE: Is coord_cartesian() the right tool?]
- zoom into a window without dropping data: coord_cartesian(xlim = c(0, 10))
- subset the data before plotting: dplyr::filter(df, between(x, 0, 10))
- transform the scale (log, sqrt, reverse): scale_x_log10(), scale_x_reverse()
- rotate the plot 90 degrees: coord_flip()
- bend an axis into a circle: coord_polar()
- enforce a fixed aspect ratio for maps: coord_fixed()
- change axis breaks and labels only: scale_x_continuous(breaks = ...)

## What coord_cartesian() does in one sentence

**coord_cartesian() is a coordinate system that crops the plot panel to a window without removing any data from the layers.** Limits are applied at the rendering stage, after every stat has run, so smoothers, density curves, and regression lines see the full dataset and the visible part of the curve stays correct. By contrast, scale_x_continuous(limits = c(a, b)) and the shortcut xlim(a, b) both drop rows outside the window before the stat sees them, which silently changes the result.

Scale limits act before stats; coord limits act after.

## Syntax

**coord_cartesian() takes four arguments and zero are required.**

```r title="coord_cartesian function signature"
coord_cartesian(
  xlim   = NULL,    # zoom window on the x axis, e.g. c(0, 10)
  ylim   = NULL,    # zoom window on the y axis, e.g. c(0, 100)
  expand = TRUE,    # add 5 percent padding around the window
  default = FALSE,  # use this coord only if no other coord is set
  clip   = "on"     # "on" trims geoms at the panel; "off" lets them spill
)
```

- `xlim` and `ylim`: length-2 numeric (or date/time) vectors. NULL means use the data range.
- `expand`: set to `FALSE` for bar charts or area charts that should start exactly at zero.
- `default`: lets a wrapper function fall back to cartesian if the caller has not requested another coord.
- `clip`: switch to `"off"` when geom_text() labels or arrows need to render beyond the panel border.

[NOTE]
**coord_cartesian() is already the default coord in ggplot2.** Every plot you make without an explicit `coord_*()` call already runs through cartesian coordinates. You only call coord_cartesian() explicitly when you need to zoom, change expansion, or alter clipping; you do not need it to draw a normal plot.

## Five common patterns

**Pattern 1: zoom into a busy scatter plot without dropping points.** The classic use case. A scatter has a long tail or a sparse edge; you want to inspect the dense region but keep the smoother fitted on all data so the trend you read off the visible curve still reflects the full sample.

```r title="Zoom a scatter without dropping data"
library(ggplot2)

ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE) +
  coord_cartesian(xlim = c(2, 4)) +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
#> Smoother fits all 32 cars, panel shows only weights between 2 and 4.
```

**Pattern 2: same plot, wrong way (drops data before the smoother).** Passing limits to the scale removes rows below 2 and above 4, so the regression line is computed on a different sample. The console warning about removed rows is your hint that ggplot2 silently filtered the data.

```r title="xlim() drops data before stats run"
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE) +
  xlim(2, 4) +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
#> Warning: Removed 12 rows containing non-finite values.
#> Smoother fits only the 20 cars inside the window, slope visibly steeper.
```

**Pattern 3: bar chart with zero-anchored y axis.** Bar charts should start at zero. Combine `coord_cartesian(ylim = ...)` with `expand = FALSE` to clip the upper end without floating the baseline.

```r title="Zero-anchored bar chart"
counts <- as.data.frame(table(cyl = mtcars$cyl))

ggplot(counts, aes(x = cyl, y = Freq)) +
  geom_col(fill = "steelblue") +
  coord_cartesian(ylim = c(0, 16), expand = FALSE) +
  labs(x = "Cylinders", y = "Count")
#> Three bars; bars touch the x axis cleanly, ceiling at 16.
```

**Pattern 4: keep a smoother continuous across a panel zoom.** With coord_cartesian(), the loess curve in the visible window is exactly the curve fitted to the full dataset, restricted to that window. This matters most for loess and gam because both methods borrow strength from neighboring observations.

```r title="Smoother stays continuous after zoom"
set.seed(1)
df <- data.frame(x = 1:100, y = 1:100 + rnorm(100, sd = 10))

ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "loess", se = TRUE) +
  coord_cartesian(xlim = c(30, 70), ylim = c(20, 90))
#> Loess curve and ribbon span the full 100 points, panel zoomed to 30-70.
```

**Pattern 5: clip = "off" lets annotations escape the panel.** Use this when geom_text() labels would otherwise be cut off at the panel edge.

```r title="Allow labels to spill outside the panel"
labels <- data.frame(x = c(2, 5), y = c(20, 30), label = c("low", "high"))

ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_text(data = labels, aes(x, y, label = label), nudge_y = 1, size = 5) +
  coord_cartesian(ylim = c(10, 25), clip = "off")
#> "low" and "high" labels render above the panel ceiling instead of being trimmed.
```

[TIP]
**Reach for coord_cartesian() whenever you want to zoom.** It is the only ggplot2 mechanism that does not silently drop data. Use scale_x_continuous(limits = ...) only when you intentionally want to filter, for example to remove outliers from a density estimate. Treat the warning "Removed N rows containing non-finite values" as a signal that a scale dropped data; switch to coord_cartesian() if that was not your intent.

## coord_cartesian() vs scale_*_continuous(limits) vs xlim()

**Three routes to "smaller plot," but only one preserves your data.**

| Feature                                | coord_cartesian() | scale_x_continuous(limits) | xlim(a, b) |
|----------------------------------------|-------------------|----------------------------|------------|
| Drops data outside the window          | no                | yes                        | yes        |
| Stats see the full dataset             | yes               | no                         | no         |
| Issues "Removed N rows" warning        | no                | yes                        | yes        |
| Can transform the scale (log, sqrt)    | no                | yes                        | no         |
| One-line shortcut                      | medium            | verbose                    | short      |
| Correct for zoom intent                | yes               | rarely                     | rarely     |

[KEY INSIGHT]
**Scale limits filter, coord limits zoom.** Scales run before stats; coords run after. When you put limits on a scale you are telling ggplot2 "exclude this from the analysis." When you put limits on the coord you are saying "show me only this part of the analysis." The two operations produce identical pictures only when no statistical layer is present; the moment you add geom_smooth(), geom_density(), or stat_summary(), the choice changes the result.

## Common pitfalls

**Pitfall 1: passing limits to xlim() and being surprised by the regression.** A line that looks fine over the full data shifts when you call xlim() to focus on a region. The shift is not a rendering quirk; it is a refit on the subsetted data. Switch to coord_cartesian() and the slope returns to the original value.

**Pitfall 2: coord_cartesian() ignored because another coord was set.** A plot can have only one coord. If you have already called `coord_flip()` or `coord_polar()`, adding `coord_cartesian()` overwrites the earlier call. Combine zoom with flipping by passing `xlim` and `ylim` to coord_flip() itself; those arguments behave the same way.

**Pitfall 3: expanding when you wanted exact limits.** `coord_cartesian(ylim = c(0, 100))` still adds a 5 percent buffer on each side. For a bar chart that needs to sit on the x axis, you must also pass `expand = FALSE`, otherwise the baseline floats slightly below zero.

**Pitfall 4: zooming a plot that uses a log or sqrt scale.** coord_cartesian() works on the transformed scale, not the original units. After `scale_y_log10()`, the limits `c(10, 100)` passed to coord_cartesian() are read in log space. Compute the log values yourself: `coord_cartesian(ylim = log10(c(10, 100)))` when you want data-space numbers.

## Try it yourself

**Try it:** Build a scatter plot of mpg vs hp from the mtcars dataset with a linear smoother. Zoom the x axis to 100 to 200 hp without changing the slope of the smoother. Save the plot to ex_zoom.

```r title="Your turn: zoom mtcars without dropping data"
# Try it: zoom mpg vs hp
ex_zoom <- # your code here

ex_zoom
#> Expected: scatter and regression line; panel shows 100 to 200 hp, slope unchanged.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(ggplot2)

ex_zoom <- ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE) +
  coord_cartesian(xlim = c(100, 200)) +
  labs(x = "Horsepower", y = "Miles per gallon")

ex_zoom
#> Regression line fitted on 32 cars; panel cropped to 100-200 hp.
```

**Explanation:** Because coord_cartesian() runs after the smoother is fitted, the line is identical to the unzoomed plot, just clipped to the visible window. Using `xlim(100, 200)` instead would refit the line on the subset of cars in that window and report a different slope.

</details>

## Related ggplot2 functions

- `coord_flip()`: rotates the plot 90 degrees; also accepts xlim and ylim.
- `coord_polar()`: bends an axis into a circle for pies and rose plots.
- `coord_fixed()`: enforces a fixed aspect ratio, useful for maps and equal scaling.
- `scale_x_continuous()`: transforms or filters the x axis depending on whether you pass limits.
- `xlim()` and `ylim()`: shortcut wrappers around the continuous scales; both filter data.

## FAQ

**What is the difference between coord_cartesian and xlim in ggplot2?**

`coord_cartesian(xlim = c(a, b))` zooms the panel to the window after all stats and geoms have computed; every row of data still participates in fitting smoothers and computing densities. `xlim(a, b)` is a shortcut for `scale_x_continuous(limits = c(a, b))`, which sets the limits on the scale and drops any row outside the window before the stat runs. The shortcut also prints a "Removed N rows" warning. Use coord_cartesian() when you want to zoom; use xlim() when you want to filter.

**Does coord_cartesian() work with geom_smooth and statistical layers?**

Yes, and it is the recommended way to zoom anything that uses a stat. Because the coord applies its limits after the stat has computed, geom_smooth(), geom_density(), stat_summary(), and stat_quantile() all see the full data. Passing limits to scale_x_continuous() instead would change the smoother fit and the density estimate because the stat would only see the rows inside the window.

**Why does my bar chart float above zero after coord_cartesian(ylim = c(0, 100))?**

The default `expand = TRUE` adds a 5 percent buffer on each side of the window, which lifts the y axis baseline slightly below zero for the gridlines but visually leaves a gap between the bars and the axis. Pass `expand = FALSE` to anchor the bars exactly at zero, or use `scale_y_continuous(expand = expansion(mult = c(0, 0.05)))` for asymmetric padding that keeps zero pinned.

**Can I combine coord_cartesian with coord_flip?**

No. A ggplot2 plot can have only one coord, so the second call overwrites the first. If you need a flipped plot zoomed to a window, pass `xlim` and `ylim` to coord_flip() directly: `coord_flip(xlim = c(0, 50))`. The arguments behave the same as in coord_cartesian() because coord_flip() inherits from the cartesian coord.

External reference: [ggplot2 coord_cartesian() documentation](https://ggplot2.tidyverse.org/reference/coord_cartesian.html).
