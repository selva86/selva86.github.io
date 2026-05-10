---
title: "ggplot2 scale_y_log10() in R: Log-Transform the Y Axis"
slug: "ggplot2-scale_y_log10-in-R"
description: "Use ggplot2 scale_y_log10() to log10-transform the y axis for skewed data in R. Covers breaks, labels, vs scale_y_continuous trans, 5 examples."
keywords: "ggplot2 scale_y_log10, R log y axis, scale_y_log10 breaks, log scale ggplot y, scale_y_continuous trans log10"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_y_log10()|ggplot2 scale_y_log10|log y axis|log scale ggplot y|scale_y_log10 breaks"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_y_log10"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_y_log10() in R: Log-Transform the Y Axis

<p class="lead">The <code>scale_y_log10()</code> function in ggplot2 log10-transforms the Y axis. It is the y-axis sister of <code>scale_x_log10()</code> and essential for visualizing skewed dependent variables.</p>

[QUICK ANSWER]
+ scale_y_log10()
+ scale_y_log10(labels = scales::comma)
+ scale_y_log10(breaks = c(1, 10, 100, 1000))
+ scale_y_continuous(trans = "log10")     # equivalent
+ scale_y_log10(labels = scales::dollar)

[DECISION TREE: Is scale_y_log10() the right tool?]
- log10 y axis: scale_y_log10()
- natural log: scale_y_continuous(trans = "log")
- sqrt: scale_y_sqrt()
- both axes log: scale_x_log10() + scale_y_log10()
- arbitrary: scale_y_continuous(trans = "...")

## What scale_y_log10() does in one sentence

**`scale_y_log10()` log10-transforms the Y axis values, equivalent to `scale_y_continuous(trans = "log10")`.** Useful for skewed positive y values like revenue, prices, or counts.

## Syntax

**`scale_y_log10(name = waiver(), breaks = waiver(), labels = waiver(), ...)`. Same as scale_y_continuous.**

```r title="Log y for diamond price"
library(ggplot2)
library(scales)

ggplot(diamonds, aes(carat, price)) +
  geom_point(alpha = 0.1) +
  scale_y_log10(labels = dollar)
```

[TIP]
**For revenue, prices, populations, and counts, `scale_y_log10` often reveals patterns that linear y hides.** Skewed positive data is the natural use case.

## Five common patterns

### 1. Standard log y

```r title="Log scale"
+ scale_y_log10()
```

### 2. Dollar-formatted log labels

```r title="Money on log scale"
+ scale_y_log10(labels = scales::dollar)
```

### 3. Custom breaks

```r title="Powers of 10"
+ scale_y_log10(breaks = c(1, 10, 100, 1000))
```

### 4. Combined with x log

```r title="Log-log plot"
+ scale_x_log10() + scale_y_log10()
```

### 5. Pseudo-log for zero values

```r title="When data includes 0"
+ scale_y_continuous(trans = scales::pseudo_log_trans(base = 10))
```

`pseudo_log` handles 0 and negatives; pure log10 cannot.

[KEY INSIGHT]
**Log y is the standard fix for skewed dependent variables.** If a histogram has a long right tail, log-transforming reveals patterns hidden by the spread.

## scale_y_log10() vs scale_y_continuous(trans=) vs pseudo_log

| Function | Transform | Handles 0 |
|---|---|---|
| `scale_y_log10()` | Log10 | No |
| `scale_y_continuous(trans = "log10")` | Same | No |
| `scale_y_sqrt()` | Sqrt | Yes |
| `scales::pseudo_log_trans()` | Log near zeros, linear at 0 | Yes |

## A practical workflow

**For skewed y, log10 is the default. For data with zeros, pseudo_log is a safer fallback.**

```r
ggplot(events, aes(date, count)) +
  geom_line() +
  scale_y_log10(labels = scales::comma)
```

For revenue charts:

```r
ggplot(sales, aes(month, revenue)) +
  geom_col() +
  scale_y_log10(labels = scales::dollar)
```

## Common pitfalls

**Pitfall 1: zeros and negatives drop.** Log fails on non-positive y. Use pseudo_log_trans or filter zeros.

**Pitfall 2: misleading bar charts.** Bar charts on log y axis distort proportions; readers easily misinterpret. Avoid log y on bar charts when possible.

[WARNING]
**`scale_y_log10()` transforms the data BEFORE stats run.** Regression / smoothers fit on log values. If you only want log VISUAL, use `coord_trans(y = "log10")` instead.

## Try it yourself

**Try it:** Plot mtcars hp vs disp on log y. Save to `ex_plot`.

```r title="Your turn: log y"
ex_plot <- mtcars |>
  ggplot(aes(disp, hp)) +
  geom_point() +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(disp, hp)) +
  geom_point() +
  scale_y_log10()
```

**Explanation:** Log10 transforms the y axis.

</details>

## Related ggplot2 / scales functions

After mastering scale_y_log10, look at:

- `scale_x_log10()`: same for x
- `scale_y_sqrt()`: square root y
- `coord_trans(y = "log10")`: visual-only transform
- `scales::pseudo_log_trans()`: handles zero
- `scales::label_log()`: 10^N labels

## FAQ

**What does scale_y_log10 do in ggplot2?**

`scale_y_log10()` log10-transforms the Y axis. Shortcut for `scale_y_continuous(trans = "log10")`.

**Can I use scale_y_log10 with zero values?**

No. Log fails on 0 and negatives. Use `scale_y_continuous(trans = scales::pseudo_log_trans())` to handle zeros.

**What is the difference between scale_y_log10 and coord_trans(y = "log10")?**

scale_y_log10 transforms data before stats. coord_trans transforms only the visual after stats. Different for regression and smoothers.

**Why does my bar chart on log y look weird?**

Log scales distort bar proportions. Readers misinterpret heights. Avoid log y on bars; use it for points and lines.

**Can I add log y on top of an existing plot?**

Yes. `+ scale_y_log10()` after the geoms. Or chain with other scale modifications.
