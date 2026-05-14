---
title: "ggplot2 annotate() in R: Add Text, Lines, and Shapes"
slug: "ggplot2-annotate-in-R"
description: "Use ggplot2 annotate() in R to add a single text label, segment, rectangle, or arrow to a plot without binding the layer to a column in your data frame."
keywords: "ggplot2 annotate, annotate function R, ggplot2 annotate examples, R annotate plot, add text to ggplot, ggplot2 annotation layer, annotate vs geom_text"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "annotate()|ggplot2 annotate|ggplot2::annotate()|annotation layer ggplot2|add annotation to ggplot"
auto_link_case_sensitive: true
target_keyword: "ggplot2 annotate"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 annotate() in R: Add Text, Lines, and Shapes

<p class="lead">ggplot2 annotate() in R adds a single text label, segment, rectangle, arrow, or point to a plot using literal values instead of a data column. It is the right tool when the annotation describes the plot, not the data, so it draws once regardless of how many rows the underlying data frame contains.</p>

[QUICK ANSWER]
annotate("text", x = 5, y = 30, label = "peak")             # one label
annotate("segment", x = 1, xend = 3, y = 10, yend = 25)     # one line
annotate("rect", xmin = 2, xmax = 4, ymin = 0, ymax = 30)   # shaded region
annotate("curve", x = 1, xend = 3, y = 10, yend = 25)       # curved arrow
annotate("point", x = 5, y = 30, size = 4, colour = "red")  # one point
annotate("text", x = c(2, 5), y = c(10, 30), label = c("a","b"))  # vectorised
annotate("text", x = 5, y = 30, label = "peak", size = 5, fontface = "bold")
annotate("rect", xmin = 2, xmax = 4, ymin = -Inf, ymax = Inf, alpha = 0.2)

[DECISION TREE: Is annotate() the right tool?]
- add one or two fixed labels or shapes to a plot: annotate("text", x = 5, y = 30, label = "peak")
- one label per row from a data column: geom_text(aes(label = name))
- one label per row with a background box: geom_label(aes(label = name))
- pull labels out of overlap automatically: ggrepel::geom_text_repel()
- mark a vertical or horizontal reference line: geom_vline(xintercept = 5) or geom_hline()
- highlight a band across all facets: geom_rect() with data carrying the bounds
- draw arrows pointing at a feature: annotate("curve", arrow = arrow())

## What annotate() does in one sentence

**annotate() is a layer constructor that takes a geom name and literal aesthetic values, then draws exactly one instance of that geom.** It bypasses aes() entirely; the values you pass for `x`, `y`, `label`, `xmin`, and so on are treated as constants rather than column references. The first argument is the short form of a geom name (`"text"`, `"segment"`, `"rect"`, `"point"`, `"curve"`) and the rest are aesthetics that geom understands.

The contrast with geom_text() is the source of most confusion: geom_text() draws one label per row, so `geom_text(label = "peak")` on a 32-row data frame stamps "peak" thirty-two times in the same spot. annotate() always draws once.

## Syntax

**annotate() takes a geom name followed by aesthetic values as named arguments.**

```r title="annotate function signature"
annotate(
  geom,           # short geom name, e.g. "text", "segment", "rect"
  x = NULL,       # x position; required for most geoms
  y = NULL,       # y position; required for most geoms
  xmin = NULL,    # left edge, for "rect"
  xmax = NULL,    # right edge, for "rect"
  ymin = NULL,    # bottom edge, for "rect"
  ymax = NULL,    # top edge, for "rect"
  xend = NULL,    # second endpoint, for "segment" and "curve"
  yend = NULL,
  na.rm = FALSE,  # silently drop NA values instead of warning
  ...             # any other aesthetic the geom accepts (label, colour, size, alpha, ...)
)
```

- The valid geom shorthand strings are anything that has a `geom_*()` constructor, stripped of the prefix: `"text"`, `"label"`, `"segment"`, `"curve"`, `"rect"`, `"point"`, `"pointrange"`, `"linerange"`.
- All position aesthetics must have the same length. Recycling silently changes meaning, so prefer matching lengths explicitly.
- Aesthetics passed here are NOT mapped, so do not wrap them in aes().

[NOTE]
**annotate() is not its own geom.** Internally it builds a layer from whatever geom name you pass and stores the aesthetics on the layer's data slot as constants. That is why you can pass any aesthetic the underlying geom accepts (colour, size, alpha, fontface, hjust, vjust, angle) and it just works without aes().

## Five common patterns

**Pattern 1: drop one text label at a fixed coordinate.** The canonical use case. Pick a spot on the plot, write a word there, do not touch the data.

```r title="One text label on a scatter plot"
library(ggplot2)

ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate("text", x = 5, y = 30, label = "outlier?", colour = "firebrick", size = 5) +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
#> Scatter of 32 cars; the word "outlier?" sits at (5, 30) in firebrick red.
```

**Pattern 2: shade a region with a translucent rectangle.** Use `annotate("rect", ...)` with `alpha` around 0.2 to highlight a window. Set `ymin = -Inf, ymax = Inf` to make the band span the full panel height regardless of the y axis range.

```r title="Shade a vertical band across the panel"
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate("rect", xmin = 3, xmax = 4, ymin = -Inf, ymax = Inf,
           alpha = 0.15, fill = "steelblue") +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
#> Scatter with a faint blue vertical band between wt = 3 and wt = 4.
```

**Pattern 3: point at something with a curved arrow.** Combine `annotate("curve", ...)` with the `arrow` argument from `grid::arrow()`. The `curvature` argument bends the line; positive values bend one way, negative the other.

```r title="Curved arrow pointing at a feature"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  annotate("curve", x = 4.5, y = 25, xend = 5.3, yend = 15,
           curvature = 0.3, arrow = arrow(length = unit(3, "mm"))) +
  annotate("text", x = 4.5, y = 26, label = "heavy car", size = 4)
#> Scatter with a curved arrow tip ending near the right-most point.
```

**Pattern 4: vectorise to draw several annotations in one call.** Pass same-length vectors to x, y, and label; ggplot2 draws one instance per index. Both this and geom_text() work, but a hand-curated vector keeps annotations out of your data frame.

```r title="Three labels in one annotate call"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  annotate("text",
           x = c(2.0, 3.4, 5.3),
           y = c(33, 20, 11),
           label = c("light", "mid", "heavy"),
           colour = "darkgreen") +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
#> Scatter with three green labels at the three coordinates.
```

**Pattern 5: line segment plus a reference label.** Combine two annotate() calls: one for the segment, one for the text that names it. This is useful for marking a threshold or a target value.

```r title="Threshold segment with caption"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  annotate("segment", x = 1.5, xend = 5.5, y = 22, yend = 22,
           linetype = "dashed", colour = "grey40") +
  annotate("text", x = 5.4, y = 23, label = "target = 22 mpg",
           hjust = 1, size = 4, colour = "grey20") +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
#> Scatter with a horizontal dashed line at y = 22 and a label naming it.
```

[TIP]
**Use Inf for full-axis bands.** Replacing `ymin` or `ymax` with `-Inf` or `Inf` makes a rectangle extend to the panel edge automatically; you do not need to read the data range and pick numbers. The same trick works for `xmin` and `xmax` to draw full-height bands across the panel.

## annotate() vs geom_text() vs geom_label()

**Three layers can put text on a plot; only one is meant for one-off annotations.**

| Feature                                | annotate("text", ...) | geom_text() | geom_label() |
|----------------------------------------|------------------------|-------------|--------------|
| Draws one instance per call            | yes                    | no (one per row) | no (one per row) |
| Uses aes() mappings                    | no                     | yes         | yes          |
| Reads x and y from data                | no                     | yes         | yes          |
| Has a background box                   | no                     | no          | yes          |
| Right tool for one fixed label         | yes                    | no          | no           |
| Right tool for per-row labels          | no                     | yes         | yes          |
| Common bug: prints text many times     | safe                   | likely      | likely       |

[KEY INSIGHT]
**annotate() is what you reach for when the annotation is part of the chart, not the data.** A title belongs in labs(). A per-row label belongs in geom_text(). The arrow you draw to call out a feature, the rectangle you shade to mark a regime, the single asterisk that flags an outlier: those are annotations, and that is exactly the gap annotate() fills.

## Common pitfalls

**Pitfall 1: passing label inside aes() instead of as a literal.** Writing `annotate("text", aes(label = "peak"), x = 5, y = 30)` will error because annotate() does not accept aes(). Pass the label as a plain named argument: `annotate("text", x = 5, y = 30, label = "peak")`.

**Pitfall 2: using geom_text() when you wanted annotate().** A call like `geom_text(label = "peak", x = 5, y = 30)` looks correct but stamps "peak" once for every row in the plot's data, leaving a smudge of overlapping text. The fix is one character: replace `geom_text` with `annotate("text", ...)`.

**Pitfall 3: forgetting that annotate() inherits the plot's coordinate system.** With `coord_polar()` or `coord_flip()`, annotation positions are read in transformed coordinates; likewise, after `scale_y_log10()`, the `y` you pass is in log space. Compute the transformed value before passing it in.

**Pitfall 4: setting colour inside annotate("rect", ...) and seeing only an outline.** Rectangle aesthetics split into `fill` (the interior) and `colour` (the border). For a shaded band, set `fill = "steelblue"`; for a transparent box with a coloured edge, set `colour` and `fill = NA`.

## Try it yourself

**Try it:** On a scatter of mpg vs hp from mtcars, shade the horsepower band from 200 to 250 with a translucent red rectangle and add the label "high power" centred above the band at y = 30. Save the plot to ex_annot.

```r title="Your turn: shaded band with a label"
# Try it: shade hp 200-250 and label it
ex_annot <- # your code here

ex_annot
#> Expected: scatter with a faint red band from hp 200 to 250 and "high power" above it.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(ggplot2)

ex_annot <- ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point() +
  annotate("rect", xmin = 200, xmax = 250, ymin = -Inf, ymax = Inf,
           alpha = 0.15, fill = "firebrick") +
  annotate("text", x = 225, y = 30, label = "high power",
           colour = "firebrick", size = 4) +
  labs(x = "Horsepower", y = "Miles per gallon")

ex_annot
#> Scatter with a red band at hp 200-250 and a "high power" label above it.
```

**Explanation:** annotate("rect", ...) draws a single rectangle anchored to the panel by using Inf for the vertical bounds, and the second annotate() call adds the centred label. Both calls run once regardless of how many rows mtcars contains.

</details>

## Related ggplot2 functions

- `geom_text()`: per-row text labels mapped through aes(); use when the label comes from a column.
- `geom_label()`: like geom_text() but wraps each label in a rounded background box.
- `geom_vline()` and `geom_hline()`: reference lines at a fixed x or y; simpler than annotate("segment", ...) for full-axis lines.
- `geom_rect()`: data-driven rectangles; reach for it when you want one rectangle per row.
- `ggrepel::geom_text_repel()`: per-row labels that automatically dodge overlaps.

## FAQ

**What is the difference between annotate and geom_text in ggplot2?**

`annotate()` draws one instance of a geom using literal values, regardless of how many rows the plot's data contains. `geom_text()` draws one label per row and reads label, x, and y from columns mapped through aes(). For one label at a fixed coordinate, annotate("text", ...) is correct; geom_text() will stamp the same label once per row, producing visually thicker text from overlapping copies.

**How do I add an arrow to a ggplot2 chart?**

Use `annotate("segment", ...)` or `annotate("curve", ...)` with the `arrow` argument from `grid::arrow()`. The segment form draws a straight arrow between (x, y) and (xend, yend); curve bends the path via the `curvature` argument. Set the head with `arrow(length = unit(3, "mm"), type = "closed")` and follow with a second annotate("text", ...) call to label it.

**Can annotate() use vectors so I draw multiple labels in one call?**

Yes. Same-length vectors for `x`, `y`, and `label` produce one instance per index. It is convenient for two or three annotations you do not want in a data frame, but past about five entries, building a small data frame and calling `geom_text(data = small_df, aes(...))` is easier to maintain.

**How do I make an annotation span all facets?**

Calling annotate() in a faceted plot draws the same annotation in every panel, because annotate() carries no facet variable, which is usually what you want for a global reference. To draw a different annotation per facet, switch to geom_text() or geom_rect() with a data frame that contains the facet variable; the layer will be split by the facet like any other geom.

External reference: [ggplot2 annotate() documentation](https://ggplot2.tidyverse.org/reference/annotate.html).
