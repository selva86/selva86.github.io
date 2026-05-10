---
title: "ggplot2 geom_curve() in R: Draw Curved Connections"
slug: "ggplot2-geom_curve-in-R"
description: "Use ggplot2 geom_curve() to draw curved arcs between two points in R. Covers curvature, angle, ncp, vs geom_segment, and 5 worked examples."
keywords: "ggplot2 geom_curve, R curved arc, geom_curve curvature, geom_curve angle, geom_curve vs geom_segment"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_curve()|ggplot2 geom_curve|curved arc|curvature ggplot|geom_curve vs geom_segment"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_curve"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# ggplot2 geom_curve() in R: Draw Curved Connections

<p class="lead">The <code>geom_curve()</code> function in ggplot2 draws CURVED arcs between two points, useful for connecting nodes in network plots, decorative annotations, or stylistic alternatives to straight segments.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, xend = xend, yend = yend)) + geom_curve()
geom_curve(curvature = 0.5)              # curvier
geom_curve(curvature = -0.5)             # bend other direction
geom_curve(angle = 45)                    # control arc orientation
geom_segment()                            # straight version

[DECISION TREE: Is geom_curve() the right tool?]
- curved connection between 2 points: geom_curve()
- straight line: geom_segment()
- arrow on a curve: geom_curve(arrow = arrow())
- network edges with bends: geom_curve()
- subtle annotation arc: geom_curve(curvature = 0.2)

## What geom_curve() does in one sentence

**`geom_curve()` draws curved (arc) line segments from (x, y) to (xend, yend) for each row of data.** Same arguments as geom_segment plus `curvature` and `angle`.

## Syntax

**`geom_curve(mapping = NULL, data = NULL, curvature = 0.5, angle = 90, ncp = 5, arrow = NULL, ...)`. Requires aes(x, y, xend, yend).**

```r title="Curved connection"
library(ggplot2)

df <- tibble(x = 0, y = 0, xend = 5, yend = 5)

ggplot(df, aes(x, y, xend = xend, yend = yend)) +
  geom_curve(curvature = 0.3) +
  geom_point() +
  geom_point(aes(x = xend, y = yend))
```

[TIP]
**Curvature 0 is straight (= geom_segment); positive curves clockwise; negative curves counterclockwise.** Range typically 0 to 1.

## Five common patterns

### 1. Standard curve

```r title="Default curvature 0.5"
ggplot(df, aes(0, 0, xend = 5, yend = 5)) +
  geom_curve()
```

### 2. Reverse direction

```r title="Curve the other way"
ggplot(df, aes(0, 0, xend = 5, yend = 5)) +
  geom_curve(curvature = -0.5)
```

### 3. Tight curve

```r title="More dramatic arc"
geom_curve(curvature = 0.8)
```

### 4. Curve with arrow

```r title="Annotation"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_curve(aes(x = 4, y = 30, xend = 5, yend = 25),
             arrow = arrow(length = unit(0.3, "cm")),
             color = "red")
```

### 5. Network edges

```r title="Curved edges between nodes"
edges <- tibble(x1 = c(0, 1), y1 = c(0, 1), x2 = c(1, 2), y2 = c(1, 0))
ggplot(edges, aes(x1, y1, xend = x2, yend = y2)) +
  geom_curve(curvature = 0.3)
```

[KEY INSIGHT]
**`curvature` controls bend AMOUNT; `angle` controls bend DIRECTION.** Most users only need curvature; angle is for fine-tuning.

## geom_curve() vs geom_segment() vs geom_line()

| Function | Shape | Endpoints |
|---|---|---|
| `geom_curve()` | Curved arc | (x, y) to (xend, yend) per row |
| `geom_segment()` | Straight | (x, y) to (xend, yend) per row |
| `geom_line()` | Polyline | Across rows in sorted x |

## A practical workflow

**Use geom_curve for stylistic annotations or network edge plots.**

```r
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_curve(
    aes(x = 4.5, y = 30, xend = 5.4, yend = 17.3),
    arrow = arrow(length = unit(0.3, "cm")),
    color = "red"
  ) +
  annotate("text", x = 4, y = 31, label = "Heaviest car")
```

## Common pitfalls

**Pitfall 1: too much curvature.** Above 1 produces extreme bends. Stay 0 to 1 for natural-looking arcs.

**Pitfall 2: missing aesthetics.** Like geom_segment, requires x, y, xend, yend.

[WARNING]
**`geom_curve()` doesn't connect across rows.** Each row is one curve. For curved trajectories across many points, use geom_path with smoothing.

## Try it yourself

**Try it:** Draw a curved arrow from (0,0) to (5,5). Save to `ex_plot`.

```r title="Your turn: curved arrow"
ex_plot <- ggplot(tibble(x = 0, y = 0, xend = 5, yend = 5),
                  aes(x, y, xend = xend, yend = yend)) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(tibble(x = 0, y = 0, xend = 5, yend = 5),
                  aes(x, y, xend = xend, yend = yend)) +
  geom_curve(arrow = arrow(length = unit(0.3, "cm")), curvature = 0.3)
```

**Explanation:** Curve with curvature 0.3 and arrow at the end.

</details>

## Related ggplot2 functions

After mastering geom_curve, look at:

- `geom_segment()`: straight version
- `arrow()`: arrowhead spec
- `geom_path()` / `geom_line()`: multi-point lines
- `annotate()`: one-off annotations

## FAQ

**What does geom_curve do in ggplot2?**

`geom_curve()` draws curved arc segments between (x, y) and (xend, yend). Same as geom_segment but curved.

**How do I control the curve direction?**

Use the `curvature` argument: positive curves clockwise; negative counterclockwise; 0 is straight.

**What is the difference between geom_curve and geom_segment?**

geom_segment is straight; geom_curve is curved. Otherwise identical aesthetics and arguments.

**Can I add an arrow to geom_curve?**

Yes. Pass `arrow = arrow()`. Same as geom_segment.

**Does curvature have to be between 0 and 1?**

No, but values outside this range produce extreme curves. Practical range is 0 to 1.
