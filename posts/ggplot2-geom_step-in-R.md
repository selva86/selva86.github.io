---
title: "ggplot2 geom_step() in R: Step Function Lines"
slug: "ggplot2-geom_step-in-R"
description: "Use ggplot2 geom_step() to draw step-function lines in R, useful for cumulative or piecewise data. Covers direction, vs geom_line, and 5 examples."
keywords: "ggplot2 geom_step, R step function plot, geom_step direction, piecewise constant R, step plot ggplot, geom_step vs geom_line"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_step()|ggplot2 geom_step|step function|piecewise constant|step plot"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_step"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_step() in R: Step Function Lines

<p class="lead">The <code>geom_step()</code> function in ggplot2 draws connected lines that step rather than smoothly slope between points. It is the right choice for piecewise-constant data like cumulative event plots or empirical CDFs.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_step()
ggplot(df, aes(x, y)) + geom_step(direction = "vh")  # vertical-then-horizontal
ggplot(df, aes(x, y)) + geom_step(direction = "hv")  # horizontal-then-vertical (default)
geom_line()                                          # smooth/diagonal connections
stat_ecdf()                                          # cumulative distribution

[DECISION TREE: Is geom_step() the right tool?]
- piecewise-constant time-series: geom_step()
- empirical CDF: stat_ecdf() (built on geom_step)
- smooth line connection: geom_line()
- bar chart: geom_col()
- cumulative count: geom_step on cumsum()

## What geom_step() does in one sentence

**`geom_step()` connects points with HORIZONTAL and VERTICAL segments instead of diagonal ones, producing a stair-step appearance.** Useful for piecewise-constant data.

## Syntax

**`geom_step(direction = "hv", ...)`. direction is "hv" (default) or "vh".**

```r title="Step function"
library(ggplot2)
library(dplyr)

df <- tibble(x = c(1, 3, 5, 7), y = c(10, 25, 15, 30))

ggplot(df, aes(x, y)) +
  geom_step()
```

[TIP]
**Use geom_step for cumulative counts, event timelines, or any "value stays constant until next event" data.** Smooth-line interpolation would mislead.

## Five common patterns

### 1. Cumulative event count

```r title="Running count over time"
events |>
  arrange(timestamp) |>
  mutate(count = row_number()) |>
  ggplot(aes(timestamp, count)) +
  geom_step()
```

### 2. Direction "vh"

```r title="Vertical first, then horizontal"
ggplot(df, aes(x, y)) +
  geom_step(direction = "vh")
```

### 3. Empirical CDF

```r title="ECDF via stat_ecdf"
ggplot(mtcars, aes(mpg)) +
  stat_ecdf()
```

### 4. Compare hv vs vh

```r title="Two directions on same data"
ggplot(df, aes(x, y)) +
  geom_step(direction = "hv", color = "blue") +
  geom_step(direction = "vh", color = "red")
```

### 5. Multiple groups

```r title="Per-group steps"
ggplot(df, aes(x, y, color = group)) +
  geom_step()
```

[KEY INSIGHT]
**Direction "hv" (default) draws horizontal first, then vertical at each step.** "vh" reverses. Pick based on whether the value applies BEFORE or AFTER the x-coordinate.

## geom_step() vs geom_line() vs geom_path()

| Function | Connection | Best for |
|---|---|---|
| `geom_step()` | Step (hv or vh) | Piecewise-constant |
| `geom_line()` | Diagonal lines | Smooth trends |
| `geom_path()` | Same as geom_line but follows row order | Trajectories |

## A practical workflow

**Use geom_step for "value changes at discrete events" plots.**

```r
prices |>
  arrange(timestamp) |>
  ggplot(aes(timestamp, price)) +
  geom_step() +
  scale_x_datetime() +
  labs(title = "Price changes over time")
```

Each price persists until the next change. Steps faithfully show this.

## Common pitfalls

**Pitfall 1: confusing direction.** Default "hv" extends the previous y until the next x; "vh" jumps to new y first then extends. Pick based on data semantics.

**Pitfall 2: using on smooth data.** Step shows discrete changes. For continuous trends, use geom_line.

[WARNING]
**`geom_step` connects points in DATA ROW ORDER.** If your data isn't sorted by x, the steps will be jumbled. Always `arrange(x)` first.

## Try it yourself

**Try it:** Plot a cumulative count of mtcars rows ordered by mpg using geom_step. Save to `ex_plot`.

```r title="Your turn: cumulative count"
ex_plot <- mtcars |>
  arrange(mpg) |>
  mutate(rank = row_number()) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- mtcars |>
  arrange(mpg) |>
  mutate(rank = row_number()) |>
  ggplot(aes(mpg, rank)) +
  geom_step()
```

**Explanation:** Arrange by mpg, compute cumulative rank, plot as steps.

</details>

## Related ggplot2 functions

After mastering geom_step, look at:

- `geom_line()`: smooth connections
- `geom_path()`: row-order line
- `stat_ecdf()`: empirical CDF (built on step)
- `geom_segment()`: explicit segment drawing
- `scale_x_datetime()`: time-axis scaling

## FAQ

**What does geom_step do in ggplot2?**

`geom_step()` connects points with horizontal and vertical line segments, producing a stair-step appearance. Used for piecewise-constant data.

**What is the difference between geom_step and geom_line?**

geom_step uses right-angled segments (hv or vh). geom_line uses diagonal segments. Pick based on whether your data is piecewise-constant (step) or continuous (line).

**What does direction "hv" mean?**

Horizontal-first then vertical: extend previous y until next x, then jump to new y. Default. "vh" reverses.

**Can I use geom_step for ECDF?**

Yes, indirectly: `stat_ecdf()` is built on geom_step and is the standard ECDF function.

**Does geom_step require sorted data?**

Yes. It connects points in row order; unsorted data produces jumbled steps. arrange() first.
