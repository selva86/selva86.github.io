---
title: "ggplot2 geom_line() in R: Line Charts With Examples"
slug: "ggplot2-geom_line-in-R"
description: "Use ggplot2 geom_line() to build line charts in R for time series and trends. Covers color, linetype, group, multi-line plots, steps, and 6 worked examples."
keywords: "geom_line, ggplot2 line chart, line plot in R, geom_line examples, ggplot2 multi-line, ggplot2 time series, ggplot2 linetype"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_line()|ggplot2 geom_line|ggplot2 line chart|line chart in ggplot2|time series ggplot"
auto_link_case_sensitive: true
target_keyword: "geom_line"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_line() in R: Line Charts With Examples

<p class="lead">The <code>geom_line()</code> function in ggplot2 connects points in order of x to draw a line. Use it for time series, trends, and any continuous relationship where reading x as a sequence makes sense.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_line()                          # basic line
ggplot(df, aes(x, y, color = group)) + geom_line()           # one line per group
ggplot(df, aes(x, y, group = group)) + geom_line()           # multi-line, no color
ggplot(df, aes(x, y, linetype = group)) + geom_line()        # different linetypes
ggplot(df, aes(x, y)) + geom_line(linewidth = 1.2)           # thicker line
ggplot(df, aes(x, y)) + geom_line() + geom_point()           # line + markers
ggplot(df, aes(x, y)) + geom_line() + scale_x_date()         # time series

[DECISION TREE: Is geom_line() the right tool?]
- continuous trend over time: geom_line()
- step changes (no interpolation): geom_step()
- one continuous + many points (no order): geom_point()
- multiple lines per group: aes(group = grp) + geom_line()
- area under the line: geom_area()
- range / band: geom_ribbon()
- rolling smooth: geom_smooth(method = "loess")

## What geom_line() does in one sentence

**`geom_line()` draws a line connecting points in ascending order of x.** Each row contributes one point; ggplot connects them with straight segments. Use the `group` aesthetic to draw multiple lines, one per group, in the same plot.

Unlike `geom_path()` (which connects points in row order regardless of x), `geom_line()` always sorts by x first. This makes it the right choice for time series and any plot where x represents a continuous independent variable.

## Syntax

**`geom_line()` is a layer added to a `ggplot()` call.** Minimum is `aes(x, y)`. For multi-line plots, also map `group`, `color`, or `linetype`.

```r title="Load ggplot2 and economics data"
library(ggplot2)

head(economics)[, c("date", "unemploy", "pop")]
#> # A tibble: 6 x 3
#>   date       unemploy    pop
#>   <date>        <dbl>  <dbl>
#> 1 1967-07-01     2944 198712
#> 2 1967-08-01     2945 198911
#> 3 1967-09-01     2958 199113
```

The full signature:

```
geom_line(mapping = NULL, data = NULL, stat = "identity", position = "identity",
          ..., na.rm = FALSE, orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**Use `linewidth` (ggplot2 3.4+), not `size`, for line thickness.** `geom_line(linewidth = 1.2)` is the modern parameter. The old `size = 1.2` still works but produces deprecation warnings in newer ggplot2 versions.

## Six common patterns

### 1. Basic time series line

```r title="US unemployment over time"
ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line(color = "steelblue", linewidth = 0.8)
```

The simplest case: x is a date, y is a numeric, line connects them in chronological order.

### 2. Multi-line with color

```r title="Population by sex over time"
df <- tibble::tribble(
  ~year, ~sex, ~pop,
  2020, "M", 49.5,
  2020, "F", 50.5,
  2021, "M", 49.7,
  2021, "F", 50.3,
  2022, "M", 49.6,
  2022, "F", 50.4
)

ggplot(df, aes(x = year, y = pop, color = sex)) +
  geom_line(linewidth = 1) +
  geom_point(size = 3)
```

`color = sex` automatically groups the data; ggplot draws one line per unique sex value.

### 3. Different linetypes per group

```r title="Solid vs dashed lines"
ggplot(df, aes(x = year, y = pop, linetype = sex)) +
  geom_line(linewidth = 1)
```

`linetype` maps to one of "solid", "dashed", "dotted", "dotdash", etc. Useful when colors are not appropriate (e.g., grayscale printing).

### 4. Line + points

```r title="Line connects, points anchor"
ggplot(df, aes(x = year, y = pop, color = sex)) +
  geom_line(linewidth = 1) +
  geom_point(size = 3)
```

A common combo: the line shows the trend, points emphasize each measurement. Useful when data is sparse and individual values matter.

### 5. Group without color

```r title="Multiple lines, single color"
ggplot(df, aes(x = year, y = pop, group = sex)) +
  geom_line(linewidth = 0.8, color = "gray60") +
  geom_point()
```

Use `group = sex` (in aes) when you need separate lines but do NOT want the legend / color to encode it. Useful when one variable is the focus and other groupings are reference.

### 6. Stepped line for discrete jumps

```r title="Step plot for discrete state changes"
df_step <- tibble::tibble(
  time = 1:5,
  state = c("A", "B", "B", "C", "C")
)

ggplot(df_step, aes(x = time, y = state, group = 1)) +
  geom_step()
```

`geom_step()` connects with right-angle steps, not slanted lines. Right for state changes (e.g., Markov chains, on/off signals) where interpolation between values does not make sense.

[KEY INSIGHT]
**`geom_line()` requires that ggplot can identify which points belong to the same line.** With one line, just `aes(x, y)` is enough. With multiple lines, you MUST map `color`, `linetype`, or `group` to a grouping variable. Without that, ggplot zigzags trying to connect every point in x order, producing a tangled mess.

## geom_line() vs base R plot(type = "l")

**Base R uses `plot(type = "l")` or `lines()`. ggplot2 makes line plots composable and grouping explicit.**

| Task | ggplot2 | Base R |
|---|---|---|
| Single line | `geom_line()` | `plot(x, y, type = "l")` |
| Multiple lines | `aes(group/color = grp)` | (loop with `lines()` per group) |
| Line + points | `+ geom_line() + geom_point()` | `plot(type = "b")` or `o` |
| Line types | `aes(linetype = grp)` | `lty = ...` per call |
| Time-series x | `+ scale_x_date()` | `plot.Date()` |
| Add legend | automatic from aes | `legend(...)` manually |

When to use which:

- Use ggplot2 for multi-group, faceted, or publication line plots.
- Use base `plot(type = "l")` for one-line interactive exploration.

## Common pitfalls

**Pitfall 1: missing group aesthetic for multi-line.** Without `group`, `color`, or `linetype` mapped to a categorical variable, ggplot tries to connect ALL points in x order, producing a single zigzag line across all groups. Symptom: looks like a sawtooth wave.

**Pitfall 2: confusing `geom_line()` with `geom_path()`.** `geom_line` sorts by x first; `geom_path` connects in ROW order. For time series, geom_line; for paths through space (e.g., GPS tracks), geom_path.

[WARNING]
**`size` is deprecated for line thickness in ggplot2 3.4+; use `linewidth`.** Old code with `geom_line(size = 1.5)` still works but warns. Update to `geom_line(linewidth = 1.5)` for new work.

**Pitfall 3: factor x axis with continuous group.** `aes(x = factor(year), y = val, group = 1)` is needed when x is a factor but you still want a continuous line. Without `group = 1`, ggplot draws no line.

## Try it yourself

**Try it:** Plot `economics` showing `unemploy` over `date` as a line, but ALSO map `unemploy` to color so the line color shifts with the value. Save to `ex_plot`.

```r title="Your turn: line with color gradient"
# Try it: color line by y value
ex_plot <- ggplot(economics, aes(x = date, y = unemploy)) +
  # your code here

print(ex_plot)
#> Expected: a line plot where color changes with unemployment value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(economics, aes(x = date, y = unemploy, color = unemploy)) +
  geom_line(linewidth = 1) +
  scale_color_gradient(low = "steelblue", high = "firebrick")

print(ex_plot)
```

**Explanation:** Mapping `color = unemploy` makes the line color encode the y value. `scale_color_gradient()` defines the low-to-high color ramp. Higher unemployment = redder line.

</details>

## Related ggplot2 functions

After mastering `geom_line()`, look at:

- `geom_path()`: connect in row order (not x order)
- `geom_step()`: right-angle steps for discrete state changes
- `geom_area()`: filled area under a line
- `geom_ribbon()`: band between two y values (e.g., confidence intervals)
- `geom_smooth()`: fit a smooth trend line through points
- `scale_x_date()`, `scale_x_datetime()`: date and datetime axis formatting

For animated transitions over time, `gganimate::transition_reveal()` builds an animated geom_line.

## FAQ

**How do I add multiple lines to a ggplot?**

Map a categorical variable to `color`, `linetype`, or `group`: `aes(x, y, color = group)`. ggplot draws one line per unique group value. If you do not want color in the legend, use `group = group` instead.

**What is the difference between geom_line and geom_path in ggplot2?**

`geom_line()` connects points in ASCENDING x ORDER. `geom_path()` connects in ROW ORDER (no sorting). For time series, use geom_line. For trajectories or paths through space, use geom_path.

**How do I change the line color in geom_line?**

For ALL lines: `geom_line(color = "blue")` (outside aes). To map color to a variable: `aes(color = group)` (inside aes). Don't mix them up; the wrong form is the most common ggplot2 error.

**How do I make a thicker line in ggplot2?**

Use `linewidth`: `geom_line(linewidth = 1.5)`. The old `size` argument is deprecated in ggplot2 3.4+. Default linewidth is 0.5; values 1 to 2 are typical for clearer plots.

**How do I plot a time series in ggplot2?**

Use `geom_line()` with x as a Date or POSIXct column: `ggplot(df, aes(x = date, y = value)) + geom_line()`. Use `scale_x_date()` for date-formatted axis labels: `+ scale_x_date(date_breaks = "1 year", date_labels = "%Y")`.
