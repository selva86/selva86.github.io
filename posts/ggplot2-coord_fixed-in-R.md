---
title: "ggplot2 coord_fixed() in R: Lock Plot Aspect Ratio"
slug: "ggplot2-coord_fixed-in-R"
description: "Use ggplot2 coord_fixed() in R to lock the aspect ratio so equal data units take equal screen space. Essential for maps, residuals, and y=x diagnostics."
keywords: "ggplot2 coord_fixed, coord_fixed function R, ggplot2 coord_fixed examples, R aspect ratio ggplot, coord_fixed vs coord_equal, ggplot2 fixed aspect ratio, equal axes ggplot2"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "coord_fixed()|ggplot2 coord_fixed|ggplot2::coord_fixed()|fixed aspect ratio|coord_fixed ratio"
auto_link_case_sensitive: true
target_keyword: "ggplot2 coord_fixed"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 coord_fixed() in R: Lock Plot Aspect Ratio

<p class="lead">ggplot2 coord_fixed() in R locks the aspect ratio between x and y, so one data unit on x always takes the same screen space as one data unit on y. Use it whenever the angle of a slope, a distance, or a shape carries meaning, including maps, predicted-vs-actual diagnostics, and y = x comparisons.</p>

[QUICK ANSWER]
coord_fixed()                                          # default 1:1 ratio
coord_fixed(ratio = 1)                                 # explicit 1:1
coord_fixed(ratio = 2)                                 # y unit twice the x unit
coord_fixed(ratio = 0.5)                               # x unit twice the y unit
coord_fixed(xlim = c(0, 10), ylim = c(0, 10))          # fixed ratio plus zoom
coord_fixed(expand = FALSE)                            # remove default padding
ggplot(df, aes(x, y)) + geom_point() + coord_fixed()
ggplot(df, aes(long, lat)) + geom_polygon() + coord_fixed(1.3)

[DECISION TREE: Is coord_fixed() the right tool?]
- enforce 1:1 visual scale on x and y: coord_fixed()
- zoom without dropping data: coord_cartesian(xlim = c(a, b))
- project longitude and latitude properly: coord_sf() or coord_map()
- rotate the plot 90 degrees: coord_flip()
- bend an axis into a circle: coord_polar()
- control output figure size, not data ratio: ggsave(width = w, height = h)
- log or sqrt transform an axis: scale_x_log10(), scale_x_sqrt()

## What coord_fixed() does in one sentence

**coord_fixed() pins the visual y-to-x ratio so equal data distances render as equal screen distances.** Without it, ggplot2 stretches the panel to fill the available space, which means a 45 degree line on the data scale almost never looks 45 degrees on screen. With coord_fixed(ratio = 1), one y unit renders the same pixels as one x unit, regardless of panel size.

The ratio argument is `y / x`. A value of 2 makes a y unit twice as tall as an x unit; 0.5 makes it half as tall.

## Syntax

**coord_fixed() takes five arguments and zero are required.**

```r title="coord_fixed function signature"
coord_fixed(
  ratio  = 1,       # y / x screen ratio; 1 means equal
  xlim   = NULL,    # optional zoom window on the x axis
  ylim   = NULL,    # optional zoom window on the y axis
  expand = TRUE,    # add 5 percent padding around the limits
  clip   = "on"     # "on" trims geoms at the panel; "off" lets them spill
)
```

- `ratio`: a positive number. Defaults to 1, the most common case. Pass `ratio = 1.3` for unprojected lat-long data at mid latitudes.
- `xlim` and `ylim`: behave the same as in [coord_cartesian()](ggplot2-coord_cartesian-in-R.html); applied after stats run, so smoothers see all data.
- `expand`: set `FALSE` to anchor a bar baseline or crop a map to its exact extent.
- `clip`: switch to `"off"` for geom_text() labels that should render outside the panel.

[NOTE]
**coord_equal() is the same function with a different name.** `coord_equal(ratio = 1)` and `coord_fixed(ratio = 1)` are identical; coord_equal() is a thin wrapper kept for historical reasons. Pick one and stay consistent across your codebase.

## Five common patterns

**Pattern 1: square scatter for predicted vs actual.** Diagnostic plots compare predicted to actual along the y = x line. A wide panel tilts the line and makes overestimation look like underestimation. Lock the ratio so the reference line is a true 45 degrees.

```r title="Predicted vs actual with a true 45 degree line"
library(ggplot2)

fit <- lm(mpg ~ wt + hp, data = mtcars)
diag <- data.frame(actual = mtcars$mpg, predicted = fitted(fit))

ggplot(diag, aes(predicted, actual)) +
  geom_point() +
  geom_abline(slope = 1, intercept = 0, color = "red") +
  coord_fixed() +
  labs(x = "Predicted mpg", y = "Actual mpg")
#> Square panel; the red line bisects the panel at a true 45 degrees.
```

**Pattern 2: map with one degree of latitude equal to one degree of longitude.** For an unprojected map at the equator, set `ratio = 1`. At mid latitudes, set `ratio = 1 / cos(lat)` to approximate the Mercator squeeze; at 40 degrees that is roughly 1.3.

```r title="State map with equator-style 1:1 ratio"
states <- map_data("state")

ggplot(states, aes(long, lat, group = group)) +
  geom_polygon(fill = "lightgray", color = "white") +
  coord_fixed(ratio = 1.3) +
  labs(x = NULL, y = NULL)
#> Map of the lower 48; states no longer squeezed horizontally.
```

**Pattern 3: shape preservation for ellipses and circles.** When you draw a circle or ellipse with `geom_path()`, the panel must use equal scaling or the circle becomes an oval. coord_fixed() guarantees that a circle of radius r looks like a circle.

```r title="Draw a true circle"
theta <- seq(0, 2 * pi, length.out = 200)
circle <- data.frame(x = cos(theta), y = sin(theta))

ggplot(circle, aes(x, y)) +
  geom_path() +
  coord_fixed() +
  labs(title = "Unit circle, drawn as a circle")
#> The path closes into a true circle, not an ellipse.
```

**Pattern 4: residual plots where slope angle matters.** A residuals-vs-fitted plot reads better when residuals and fitted values share the same visual scale; trends appear at their honest steepness instead of being exaggerated by the panel.

```r title="Residuals with truthful slopes"
fit <- lm(mpg ~ wt, data = mtcars)
res <- data.frame(fitted = fitted(fit), resid = resid(fit))

ggplot(res, aes(fitted, resid)) +
  geom_point() +
  geom_hline(yintercept = 0, color = "blue") +
  coord_fixed() +
  labs(x = "Fitted mpg", y = "Residual")
#> Tall, narrow panel; residual scatter looks faithful to its true magnitude.
```

**Pattern 5: custom ratio to emphasize a small range.** Setting `ratio = 5` makes a y unit five times taller than an x unit, useful when the meaningful variation in y is small relative to the x range and you want to amplify it without rescaling the data.

```r title="Amplify a narrow y range"
df <- data.frame(x = 1:50, y = 0.5 + sin(1:50 / 5) * 0.1)

ggplot(df, aes(x, y)) +
  geom_line() +
  coord_fixed(ratio = 50) +
  labs(x = "Index", y = "Value")
#> Wavelets become clearly visible without changing the underlying numbers.
```

[TIP]
**Pick coord_fixed() any time slope, distance, or shape carries meaning.** Maps, residuals, predicted vs actual, geometry plots, force diagrams, and dose-response curves all need it. Skip it for time series, bar charts, and most categorical comparisons; the panel-stretching default is fine when only the bar heights or trend direction matter.

## coord_fixed() vs coord_cartesian() vs theme(aspect.ratio)

**Three ways to control plot shape, but they answer different questions.**

| Feature                                  | coord_fixed()        | coord_cartesian()        | theme(aspect.ratio = 1) |
|------------------------------------------|----------------------|--------------------------|-------------------------|
| Locks data unit ratio (1 unit y = 1 unit x) | yes               | no                       | no                      |
| Locks panel pixel ratio (height / width) | depends on data range | no                     | yes                     |
| Affects map and circle correctness       | yes                  | no                       | no                      |
| Honors limits without dropping data      | yes                  | yes                      | no, theme is layout only |
| Use case                                 | maps, residuals, y=x | zoom panel only          | uniform panel shape across facets |

[KEY INSIGHT]
**coord_fixed() is about data units; theme(aspect.ratio) is about panel pixels.** A `coord_fixed()` plot of x in `[0, 10]` and y in `[0, 100]` produces a panel ten times taller than wide, because a y unit equals an x unit and there are ten times more y units. A `theme(aspect.ratio = 1)` plot always renders a square panel, regardless of the data range, so a unit on x rarely matches a unit on y. Use coord_fixed() when the geometry must be honest. Use aspect.ratio when you want every facet to share a shape.

## Common pitfalls

**Pitfall 1: tiny panels when y range is much smaller than x range.** `coord_fixed()` with x in `[0, 1000]` and y in `[0, 5]` produces a panel 200 times wider than tall, which often collapses to a thin strip. Either pass a custom `ratio` to widen the y unit, or rescale one of the variables before plotting.

**Pitfall 2: applying coord_fixed() to a faceted plot and getting blank panels.** Each facet inherits the same data-unit ratio, but free scales (`facet_wrap(scales = "free")`) can produce panels with wildly different aspect ratios. Stick to `scales = "fixed"` when using coord_fixed() with facets, or drop coord_fixed() and use `theme(aspect.ratio = 1)` for uniform panel shapes.

**Pitfall 3: using coord_fixed() on a map with raw lat-long values.** At latitudes far from the equator, one degree of longitude covers fewer kilometers than one degree of latitude. `coord_fixed(ratio = 1)` squeezes the map. Use `coord_fixed(ratio = 1 / cos(mean_lat * pi / 180))`, or switch to `coord_sf()` for any production map.

**Pitfall 4: combining coord_fixed() with another coord and seeing one ignored.** A ggplot2 plot has only one coord. Calling `coord_polar()` after `coord_fixed()` overwrites the fixed ratio. To zoom a fixed-ratio plot, pass `xlim` and `ylim` to `coord_fixed()` itself; do not chain coords.

**Pitfall 5: assuming `ratio = 1` is the same as `theme(aspect.ratio = 1)`.** They produce identical panels only when the x and y data ranges are equal. Otherwise, `coord_fixed(1)` follows the data and `theme(aspect.ratio = 1)` follows the layout, and the two diverge.

## Try it yourself

**Try it:** Build a scatter plot of `Sepal.Length` vs `Sepal.Width` from the iris dataset, colored by Species, with a 1:1 aspect ratio so the visual distance between any two points reflects the true Euclidean distance. Save the plot to `ex_iris`.

```r title="Your turn: equal-scale iris scatter"
# Try it: 1:1 iris scatter
ex_iris <- # your code here

ex_iris
#> Expected: scatter colored by Species; one cm on x equals one cm on y.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(ggplot2)

ex_iris <- ggplot(iris, aes(x = Sepal.Length, y = Sepal.Width, color = Species)) +
  geom_point(size = 2) +
  coord_fixed() +
  labs(x = "Sepal length (cm)", y = "Sepal width (cm)")

ex_iris
#> Three colored point clouds; panel proportions follow the data ranges.
```

**Explanation:** Both axes are measured in centimeters, so a 1:1 ratio is honest. Without coord_fixed(), the panel would stretch and the visual distance between two flowers would not reflect their true botanical distance.

</details>

## Related ggplot2 functions

- `coord_cartesian()`: zoom a panel to a window without dropping data; does not lock ratio.
- `coord_equal()`: identical to `coord_fixed()`; older alias kept for compatibility.
- `coord_sf()`: proper map projections for spatial data, replacing the lat-long approximation.
- `coord_flip()`: rotates the plot 90 degrees; horizontal bar charts are the typical use.
- `coord_polar()`: bends an axis into a circle, used for pie and rose charts.

## FAQ

**What does coord_fixed() do in ggplot2?**

`coord_fixed()` locks the aspect ratio of the plot panel so equal data distances on x and y render as equal pixel distances. The default `ratio = 1` makes one unit of y the same screen size as one unit of x, which is essential for maps, predicted-vs-actual diagnostics, and any plot where slope angle or shape carries meaning. Without it, ggplot2 stretches the panel to fill available space and distorts angles.

**What is the difference between coord_fixed and coord_equal?**

There is no functional difference. `coord_equal()` is an alias for `coord_fixed()`; both accept identical arguments and return the same object. The ggplot2 source defines coord_equal() as a thin wrapper kept for historical naming. Pick one and stay consistent. Most modern code prefers coord_fixed() because the name documents what is being fixed (the ratio between axes).

**How do I use coord_fixed for a map in ggplot2?**

For a quick unprojected map of US states near mid latitudes, use `coord_fixed(ratio = 1.3)`; the value `1.3` is roughly `1 / cos(40 degrees)` and compensates for meridian convergence. For production maps or anything outside a narrow latitude band, switch to `coord_sf()` from the sf package for a proper projection. Avoid `coord_fixed(1)` on lat-long data above 30 degrees; the map will look horizontally squashed.

**Can I combine coord_fixed with xlim and ylim to zoom?**

Yes. `coord_fixed()` accepts `xlim` and `ylim` arguments that behave like in coord_cartesian(): they crop the panel without dropping data, so smoothers and densities still see every row. The aspect ratio is preserved inside the cropped window. Do not call `coord_cartesian()` separately to zoom; it would overwrite `coord_fixed()` because a plot can only have one coord.

External reference: [ggplot2 coord_fixed() documentation](https://ggplot2.tidyverse.org/reference/coord_fixed.html).
