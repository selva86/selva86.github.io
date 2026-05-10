---
title: "ggplot2 geom_segment() in R: Draw Line Segments"
slug: "ggplot2-geom_segment-in-R"
description: "Use ggplot2 geom_segment() to draw line segments between explicit (x, y) and (xend, yend) coordinates in R. Covers arrows, layouts, 5 worked examples."
keywords: "ggplot2 geom_segment, R line segment, geom_segment arrow, segment xend yend, ggplot draw arrow, geom_segment lollipop"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_segment()|ggplot2 geom_segment|line segment|geom_segment arrow|lollipop chart"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_segment"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# ggplot2 geom_segment() in R: Draw Line Segments

<p class="lead">The <code>geom_segment()</code> function in ggplot2 draws line segments between explicit start and end points, specified via x, y, xend, and yend aesthetics. Useful for arrows, lollipop charts, and custom annotations.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, xend = xend, yend = yend)) + geom_segment()
geom_segment(arrow = arrow())
ggplot(df, aes(x, y)) + geom_segment(aes(xend = x, yend = 0))  # lollipop
geom_curve(...)                          # curved version

[DECISION TREE: Is geom_segment() the right tool?]
- straight line between 2 specific points: geom_segment()
- curved connection: geom_curve()
- arrow with text: geom_segment(arrow = ...) + annotate
- lollipop chart: geom_segment(aes(xend, yend = 0)) + geom_point()
- error bars: geom_errorbar()

## What geom_segment() does in one sentence

**`geom_segment()` draws straight line segments from (x, y) to (xend, yend) for each row of data.** Each row produces ONE segment.

## Syntax

**`geom_segment(mapping = NULL, data = NULL, arrow = NULL, lineend = "butt", ...)`. Requires aes(x, y, xend, yend).**

```r title="Lollipop chart"
library(ggplot2)
library(dplyr)

library(tibble)
mtcars |>
  tibble::rownames_to_column("car") |>
  arrange(mpg) |>
  slice_head(n = 10) |>
  ggplot(aes(x = mpg, y = reorder(car, mpg))) +
  geom_segment(aes(xend = 0, yend = car)) +
  geom_point(size = 3, color = "steelblue")
```

[TIP]
**Combine geom_segment with geom_point for lollipop charts.** The segment is the "stick"; the point is the "candy".

## Five common patterns

### 1. Lollipop chart

```r title="Bar alternative"
df |>
  ggplot(aes(category, value)) +
  geom_segment(aes(xend = category, yend = 0)) +
  geom_point(size = 3)
```

### 2. Arrow segment

```r title="With arrowhead"
ggplot(df, aes(x = 0, y = 0, xend = 5, yend = 10)) +
  geom_segment(arrow = arrow(length = unit(0.3, "cm")))
```

### 3. Connect two points

```r title="A-to-B segments"
df <- tibble(x1 = 1:3, y1 = 1:3, x2 = 4:6, y2 = 4:6)
ggplot(df, aes(x = x1, y = y1, xend = x2, yend = y2)) +
  geom_segment()
```

### 4. Highlight reference lines

```r title="Vertical line at x = 5"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_segment(aes(x = 5, y = 0, xend = 5, yend = max(mpg)),
               linetype = "dashed", color = "red")
```

### 5. Network-like edges

```r title="Connect node positions"
edges <- tibble(x1 = c(0, 1), y1 = c(0, 1), x2 = c(1, 2), y2 = c(1, 0))
ggplot(edges, aes(x = x1, y = y1, xend = x2, yend = y2)) +
  geom_segment()
```

[KEY INSIGHT]
**`geom_segment` requires FOUR aesthetics: x, y, xend, yend.** Each row draws ONE segment from (x, y) to (xend, yend).

## geom_segment() vs geom_curve() vs geom_line()

| Function | Path | Best for |
|---|---|---|
| `geom_segment()` | Straight line | Explicit endpoints |
| `geom_curve()` | Curved line | Arc connections |
| `geom_line()` | Connected points (sorted x) | Trends |
| `geom_path()` | Connected points (row order) | Trajectories |

## A practical workflow

**Lollipop charts are a common alternative to bar charts and use geom_segment + geom_point.**

```r
mtcars |>
  tibble::rownames_to_column("car") |>
  arrange(desc(mpg)) |>
  slice_head(n = 10) |>
  ggplot(aes(x = mpg, y = reorder(car, mpg))) +
  geom_segment(aes(xend = 0, yend = car), color = "grey") +
  geom_point(size = 4, color = "steelblue")
```

## Common pitfalls

**Pitfall 1: forgetting xend or yend.** geom_segment requires all four aesthetics. Missing one errors.

**Pitfall 2: arrow direction.** arrow appears at the END (xend, yend) by default. Reverse aesthetics if direction is wrong.

[WARNING]
**`geom_segment()` does NOT close shapes.** It draws ONE segment per row. For closed shapes, use geom_polygon.

## Try it yourself

**Try it:** Make a lollipop chart of top 5 mtcars by mpg. Save to `ex_plot`.

```r title="Your turn: lollipop"
ex_plot <- mtcars |>
  tibble::rownames_to_column("car") |>
  arrange(desc(mpg)) |>
  slice_head(n = 5) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- mtcars |>
  tibble::rownames_to_column("car") |>
  arrange(desc(mpg)) |>
  slice_head(n = 5) |>
  ggplot(aes(x = mpg, y = reorder(car, mpg))) +
  geom_segment(aes(xend = 0, yend = car)) +
  geom_point(size = 3, color = "steelblue")
```

**Explanation:** Sort by mpg desc, take top 5, draw segment from 0 to mpg with point at the end.

</details>

## Related ggplot2 functions

After mastering geom_segment, look at:

- `geom_curve()`: curved segments
- `arrow()`: arrowhead specification
- `geom_path()` / `geom_line()`: connected points
- `geom_vline()` / `geom_hline()`: full-axis reference lines
- `annotate()`: one-off annotations

## FAQ

**What does geom_segment do in ggplot2?**

`geom_segment()` draws straight line segments from (x, y) to (xend, yend) for each row of data.

**How do I add an arrow to geom_segment?**

Pass `arrow = arrow(length = unit(0.3, "cm"))`: `geom_segment(arrow = arrow())`. Arrow appears at (xend, yend).

**What is the difference between geom_segment and geom_line?**

geom_segment draws independent segments per row using xend/yend. geom_line connects points across rows with sorted x.

**How do I make a lollipop chart?**

Combine geom_segment (stick from baseline to value) with geom_point (candy at value).

**What is the difference between geom_segment and geom_curve?**

geom_segment is straight; geom_curve is curved. Same aesthetics; different visual.
