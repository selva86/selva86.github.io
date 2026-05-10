---
title: "ggplot2 geom_rect() in R: Draw Rectangles"
slug: "ggplot2-geom_rect-in-R"
description: "Use ggplot2 geom_rect() to draw rectangles from xmin/xmax/ymin/ymax in R. Covers fill, alpha, vs geom_tile, and 5 worked examples."
keywords: "ggplot2 geom_rect, R rectangle plot, geom_rect xmin xmax, geom_rect vs geom_tile, ggplot draw rectangle"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_rect()|ggplot2 geom_rect|rectangle plot|geom_rect vs geom_tile|draw rectangle"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_rect"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_rect() in R: Draw Rectangles

<p class="lead">The <code>geom_rect()</code> function in ggplot2 draws rectangles from explicit xmin, xmax, ymin, ymax coordinates. Useful for highlighting regions, time-period shading, or custom annotations.</p>

[QUICK ANSWER]
ggplot(df, aes(xmin = x1, xmax = x2, ymin = y1, ymax = y2)) + geom_rect()
geom_rect(aes(...), fill = "yellow", alpha = 0.3)
geom_tile(...)                            # different: x, y, width, height
annotate("rect", xmin = ..., ...)         # one-off rectangle

[DECISION TREE: Is geom_rect() the right tool?]
- explicit corner coords (xmin/xmax/ymin/ymax): geom_rect()
- center + width/height: geom_tile()
- one-off region: annotate("rect", ...)
- highlight a time period: geom_rect()
- background bands: geom_rect()

## What geom_rect() does in one sentence

**`geom_rect()` draws rectangles defined by xmin, xmax, ymin, ymax aesthetics.** Each row produces ONE rectangle.

## Syntax

**`geom_rect(mapping = NULL, data = NULL, fill = "grey50", alpha = 1, ...)`. Requires aes(xmin, xmax, ymin, ymax).**

```r title="Highlight time periods"
library(ggplot2)

ggplot(economics, aes(date, unemploy)) +
  geom_line() +
  geom_rect(
    aes(xmin = as.Date("2008-09-01"), xmax = as.Date("2009-12-01"),
        ymin = -Inf, ymax = Inf),
    fill = "red", alpha = 0.2,
    inherit.aes = FALSE
  )
```

[TIP]
**Use `inherit.aes = FALSE` when geom_rect's aesthetics differ from the main plot.** Otherwise ggplot tries to apply parent aesthetics.

## Five common patterns

### 1. Highlight time period

```r title="Recession band"
ggplot(econ_df, aes(date, value)) +
  geom_line() +
  geom_rect(
    aes(xmin = as.Date("2008-01-01"), xmax = as.Date("2009-06-01"),
        ymin = -Inf, ymax = Inf),
    fill = "red", alpha = 0.2,
    inherit.aes = FALSE
  )
```

### 2. Multiple rectangles

```r title="Several highlight bands"
bands <- tibble(start = c(2008, 2020), end = c(2009, 2021))

ggplot(df, aes(year, value)) +
  geom_line() +
  geom_rect(
    data = bands,
    aes(xmin = start, xmax = end, ymin = -Inf, ymax = Inf),
    fill = "red", alpha = 0.2,
    inherit.aes = FALSE
  )
```

### 3. Background grid cells

```r title="Mark specific regions"
ggplot(df, aes(x, y)) +
  geom_rect(
    aes(xmin = 1, xmax = 3, ymin = 1, ymax = 3),
    fill = "yellow", alpha = 0.3,
    inherit.aes = FALSE
  ) +
  geom_point()
```

### 4. With borders

```r title="Outlined rectangle"
geom_rect(aes(xmin = ..., xmax = ..., ymin = ..., ymax = ...),
          color = "black", fill = NA)
```

### 5. annotate alternative

```r title="One-off rect"
ggplot(df, aes(x, y)) +
  geom_point() +
  annotate("rect", xmin = 0, xmax = 1, ymin = 0, ymax = 1,
           fill = "yellow", alpha = 0.3)
```

[KEY INSIGHT]
**For a SINGLE rectangle, `annotate("rect", ...)` is cleaner than `geom_rect()` because it doesn't require a data frame.** For data-driven rectangles (multiple regions), use geom_rect.

## geom_rect() vs geom_tile() vs annotate()

| Function | Spec | Best for |
|---|---|---|
| `geom_rect()` | xmin/xmax/ymin/ymax | Data-driven rectangles |
| `geom_tile()` | x, y, width, height | Heatmaps |
| `annotate("rect", ...)` | Same as geom_rect | One-off rectangle |

## A practical workflow

**Use geom_rect for time-period shading on time-series plots.**

```r
recessions <- tibble(
  start = as.Date(c("2001-03-01","2008-01-01","2020-02-01")),
  end   = as.Date(c("2001-11-01","2009-06-01","2020-04-01"))
)

ggplot(econ, aes(date, value)) +
  geom_rect(
    data = recessions,
    aes(xmin = start, xmax = end, ymin = -Inf, ymax = Inf),
    fill = "grey80", alpha = 0.5,
    inherit.aes = FALSE
  ) +
  geom_line()
```

Recession bands behind a time-series line.

## Common pitfalls

**Pitfall 1: forgetting inherit.aes = FALSE.** Without it, ggplot tries to apply the main plot's aesthetics to geom_rect, which may not have x/y mapped.

**Pitfall 2: y range for full-height bands.** Use `ymin = -Inf, ymax = Inf` for full-height shading.

[WARNING]
**`geom_rect()` requires all four corner aesthetics.** Missing any errors at runtime.

## Try it yourself

**Try it:** Add a yellow rectangle highlighting cars with 4-6 cyl in mtcars wt-mpg scatter. Save to `ex_plot`.

```r title="Your turn: highlight region"
ex_plot <- mtcars |>
  ggplot(aes(wt, mpg)) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg)) +
  annotate("rect", xmin = 2, xmax = 3.5, ymin = 20, ymax = 35,
           fill = "yellow", alpha = 0.3) +
  geom_point()
```

**Explanation:** annotate is cleaner for a one-off rectangle. Yellow band highlights light, efficient cars.

</details>

## Related ggplot2 functions

After mastering geom_rect, look at:

- `geom_tile()`: heatmap tiles
- `annotate("rect", ...)`: one-off rectangle
- `geom_polygon()`: irregular shapes
- `geom_ribbon()`: between-curves area
- `geom_vline()` / `geom_hline()`: reference lines

## FAQ

**What does geom_rect do in ggplot2?**

`geom_rect()` draws rectangles from xmin/xmax/ymin/ymax aesthetics. Each row produces one rectangle.

**What is the difference between geom_rect and geom_tile?**

geom_rect uses corner coordinates (xmin/xmax/ymin/ymax). geom_tile uses center + width/height. geom_tile is more common for heatmaps.

**How do I add a single rectangle annotation?**

Use `annotate("rect", xmin = ..., ...)` instead of geom_rect. No data frame needed.

**How do I make full-height bands?**

Pass `ymin = -Inf, ymax = Inf`. This extends the rectangle to the plot's full y range.

**Why does geom_rect error in my plot?**

Often because the parent plot has different aesthetics. Pass `inherit.aes = FALSE` to make geom_rect ignore them.
