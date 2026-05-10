---
title: "ggplot2 geom_path() in R: Connect Points in Data Order"
slug: "ggplot2-geom_path-in-R"
description: "Use ggplot2 geom_path() to connect points in data row order in R. Covers vs geom_line (sorted x), trajectory plots, and 5 worked examples."
keywords: "ggplot2 geom_path, R geom_path vs geom_line, trajectory plot ggplot, geom_path data order, line in row order R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_path()|ggplot2 geom_path|geom_path vs geom_line|trajectory plot|path in row order"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_path"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_path() in R: Connect Points in Data Order

<p class="lead">The <code>geom_path()</code> function in ggplot2 connects points with line segments in DATA ROW ORDER (not sorted by x). It is the right tool for trajectory plots, paths, and any sequence where order matters.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_path()
ggplot(df, aes(x, y, color = step)) + geom_path()
geom_line()                              # different: sorts by x first
geom_path(arrow = arrow())               # add arrow at end

[DECISION TREE: Is geom_path() the right tool?]
- 2D trajectory in time order: geom_path()
- traditional line plot (sorted x): geom_line()
- step function: geom_step()
- closed polygon: geom_polygon()

## What geom_path() does in one sentence

**`geom_path()` connects points with line segments in the ORDER they appear in the data.** Unlike geom_line (which sorts by x first), geom_path respects row order.

## Syntax

**`geom_path(mapping = NULL, data = NULL, lineend = "butt", linejoin = "round", linemitre = 10, arrow = NULL, ...)`.**

```r title="Random walk trajectory"
library(ggplot2)

set.seed(1)
df <- tibble(
  step = 1:50,
  x    = cumsum(rnorm(50)),
  y    = cumsum(rnorm(50))
)

ggplot(df, aes(x, y)) +
  geom_path()
```

[TIP]
**Use geom_path for spatial trajectories, animation paths, and any data where the connection order matters.** Use geom_line for traditional trends.

## Five common patterns

### 1. Random walk

```r title="2D trajectory"
df <- tibble(
  step = 1:100,
  x = cumsum(rnorm(100)),
  y = cumsum(rnorm(100))
)
ggplot(df, aes(x, y)) +
  geom_path()
```

### 2. Color by step

```r title="Show progression"
ggplot(df, aes(x, y, color = step)) +
  geom_path()
```

### 3. With arrow

```r title="Mark direction"
ggplot(df, aes(x, y)) +
  geom_path(arrow = arrow(length = unit(0.3, "cm")))
```

### 4. Multiple paths (groups)

```r title="Per-group trajectories"
ggplot(df, aes(x, y, group = trial, color = trial)) +
  geom_path()
```

### 5. Closed loop

```r title="Connect last to first"
df_closed <- bind_rows(df, df[1, ])  # repeat first row
ggplot(df_closed, aes(x, y)) +
  geom_path()
```

[KEY INSIGHT]
**`geom_path` is for SEQUENCED data where the order between points matters.** `geom_line` sorts internally, so it's wrong for trajectories where the path crosses itself.

## geom_path() vs geom_line() vs geom_step()

| Function | Order | Best for |
|---|---|---|
| `geom_path()` | Row order | Trajectories, paths |
| `geom_line()` | Sorted by x | Traditional trends |
| `geom_step()` | Row order with steps | Piecewise-constant |
| `geom_polygon()` | Closed loop | Filled shapes |

## A practical workflow

**Use geom_path for time-series with non-monotonic x.**

```r
ggplot(market_data, aes(volatility, return, color = date)) +
  geom_path() +
  geom_point()
```

Plot return vs volatility over time; the PATH shows how each point connects chronologically.

## Common pitfalls

**Pitfall 1: confusing geom_path with geom_line.** geom_path keeps row order; geom_line sorts. For trajectories with non-monotonic x, geom_line is WRONG.

**Pitfall 2: forgetting to arrange data.** geom_path follows row order. If you want chronological order, arrange by timestamp first.

[WARNING]
**`geom_path()` does NOT close the polygon.** First and last points are not connected. To close, append the first row to the end before plotting.

## Try it yourself

**Try it:** Plot a 2D random walk path with color showing step. Save to `ex_plot`.

```r title="Your turn: random walk"
set.seed(42)
df <- tibble(step = 1:50, x = cumsum(rnorm(50)), y = cumsum(rnorm(50)))

ex_plot <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(df, aes(x, y, color = step)) +
  geom_path()
```

**Explanation:** geom_path connects points in row (= step) order; color gradient shows direction.

</details>

## Related ggplot2 functions

After mastering geom_path, look at:

- `geom_line()`: sorted by x
- `geom_step()`: piecewise-constant
- `geom_polygon()`: closed shape
- `geom_segment()`: explicit segments
- `arrow()`: add direction markers

## FAQ

**What does geom_path do in ggplot2?**

`geom_path()` connects points with line segments in DATA ROW ORDER. Unlike geom_line, it does not sort by x.

**What is the difference between geom_path and geom_line?**

geom_path keeps row order. geom_line sorts by x. For trajectories or non-monotonic x, geom_path is correct.

**How do I add an arrow to geom_path?**

Pass `arrow = arrow(length = unit(0.3, "cm"))`: `geom_path(arrow = arrow())`. An arrowhead appears at the end.

**Does geom_path close polygons?**

No. First and last points are NOT connected. For closed loops, append the first row to the end of the data before plotting (or use geom_polygon).

**Can I use geom_path for time-series?**

Yes, especially when (x, y) are both varying and the chronological order matters. For x = time, y = value with monotonic time, geom_line is fine.
