---
title: "ggplot2 geom_area() in R: Area Charts With Examples"
slug: "ggplot2-geom_area-in-R"
description: "Use ggplot2 geom_area() to draw filled area charts in R. Covers stacked areas, proportional fills, color, alpha, time series areas, and 5 worked examples."
keywords: "geom_area, ggplot2 area chart, area plot in R, R stacked area chart, ggplot2 fill area, time series area"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_area()|ggplot2 geom_area|ggplot2 area chart|area plot ggplot2|stacked area chart"
auto_link_case_sensitive: true
target_keyword: "geom_area"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_area() in R: Area Charts With Examples

<p class="lead">The <code>geom_area()</code> function in ggplot2 fills the area between a line and the x axis. It is the area version of <code>geom_line()</code> and the building block for stacked area charts and streamgraphs.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_area()                                # basic area
ggplot(df, aes(x, y, fill = group)) + geom_area()                  # stacked
ggplot(df, aes(x, y, fill = group)) + geom_area(position = "fill") # 100% stacked
ggplot(df, aes(x, y, fill = group)) + geom_area(alpha = 0.5)       # transparent
ggplot(df, aes(x, y)) + geom_area(fill = "steelblue") + geom_line()# area + line
ggplot(df, aes(x, ymin = lo, ymax = hi)) + geom_ribbon()           # band (alternative)

[DECISION TREE: Is geom_area() the right tool?]
- single area between line and zero: geom_area()
- stacked composition over time: geom_area(aes(fill = grp))
- proportions (100% stacked): geom_area(position = "fill")
- band between two values: geom_ribbon(aes(ymin, ymax))
- filled distribution: geom_density()
- bar version: geom_col() or geom_bar()
- streamgraph (centered stack): ggstream package

## What geom_area() does in one sentence

**`geom_area()` fills the region between a line at y values and the x axis (or another baseline).** It is `geom_line()` plus a fill below. With grouped data, it stacks areas by default.

Use area charts for time series where the magnitude (and how it composes by group) matters. They are common for sales over time, traffic source breakdown, and population composition.

## Syntax

**`geom_area()` requires `aes(x, y)`. With grouping, also map `fill`.**

```r title="Load ggplot2 and create sample time series"
library(ggplot2)

df <- tibble::tibble(
  year = rep(2020:2024, 3),
  group = rep(c("A","B","C"), each = 5),
  value = c(10,12,15,14,16, 8,9,11,12,13, 5,6,7,8,9)
)
head(df)
```

The full signature:

```
geom_area(mapping = NULL, data = NULL, stat = "identity", position = "stack",
          ..., na.rm = FALSE, orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**Default `position = "stack"` automatically sums groups vertically.** With `aes(fill = group)` and stack position, areas at each x add together. Set `position = "identity"` if you want them OVERLAID (and use `alpha`).

## Five common patterns

### 1. Single filled area

```r title="Total over time"
total <- aggregate(value ~ year, df, sum)

ggplot(total, aes(x = year, y = value)) +
  geom_area(fill = "steelblue", alpha = 0.7) +
  geom_line(color = "darkblue", linewidth = 1)
```

The simplest case: the area below the line is filled. Adding `geom_line()` on top emphasizes the upper boundary.

### 2. Stacked area by group

```r title="Stacked time series"
ggplot(df, aes(x = year, y = value, fill = group)) +
  geom_area()
```

`fill = group` automatically stacks. The TOTAL height at each year is the sum across all groups. Each color shows that group's contribution.

### 3. 100% stacked (proportions)

```r title="Proportional area"
ggplot(df, aes(x = year, y = value, fill = group)) +
  geom_area(position = "fill") +
  scale_y_continuous(labels = scales::percent)
```

`position = "fill"` rescales each year so the total reaches 1.0. Useful for showing how composition changes over time when total is not the focus.

### 4. Transparent overlapping areas

```r title="Overlay rather than stack"
ggplot(df, aes(x = year, y = value, fill = group)) +
  geom_area(position = "identity", alpha = 0.4)
```

`position = "identity"` plots each group's area independently (not stacked). Combined with `alpha = 0.4`, overlapping areas are visible. Note: identity-positioned areas obscure each other; usually overlay is more readable as `geom_line()`.

### 5. Confidence band with geom_ribbon

```r title="Band between lo and hi"
df_band <- tibble::tibble(
  year = 2020:2024,
  estimate = c(10, 12, 15, 14, 16),
  lo = estimate - 2,
  hi = estimate + 2
)

ggplot(df_band, aes(x = year, y = estimate)) +
  geom_ribbon(aes(ymin = lo, ymax = hi), fill = "steelblue", alpha = 0.3) +
  geom_line(color = "darkblue", linewidth = 1)
```

`geom_ribbon()` is a sibling: it fills the area between TWO y values (`ymin` and `ymax`), not between y and zero. Use ribbons for confidence intervals or forecast bands; use areas for compositions.

[KEY INSIGHT]
**Stacked area charts can MISLEAD when group order changes the visual emphasis.** Reorder groups by total or by recent value: `aes(fill = forcats::fct_reorder(group, value))`. The bottom group has a stable baseline; higher groups fluctuate visually because their baseline is the sum below them.

## geom_area() vs geom_line() vs geom_ribbon()

**Three line-related geoms, each filling a different region.**

| Geom | Fills | Use for |
|---|---|---|
| `geom_line()` | Nothing | Trend or time series, no fill |
| `geom_area()` | Below line to baseline (0 or stacked group) | Time series with magnitude focus |
| `geom_ribbon()` | Between two y values (ymin, ymax) | Confidence intervals, forecast bands |

When to use which:

- Use `geom_line()` for clean trend visualization without emphasis on magnitude.
- Use `geom_area()` for emphasizing magnitude or composition over time.
- Use `geom_ribbon()` for uncertainty bands around a central line.

## Common pitfalls

**Pitfall 1: stacked area when overlay was intended.** Default `position = "stack"` sums groups. If you want to compare independent series, set `position = "identity"` and use `alpha` (or use `geom_line()`).

**Pitfall 2: missing data creates gaps.** geom_area() does not interpolate over NA. If a group has no value at year 2022, the area drops to zero there, distorting the visual. Either fill missing values explicitly or use `tidyr::complete()` to ensure regular structure.

[WARNING]
**Stacked area can hide DECLINE in groups beyond the bottom.** If group A is at the bottom and grows, group B above it will appear to grow too even if its actual values shrunk. Always print group-level numeric data alongside, or use 100%-stacked or facets.

**Pitfall 3: order of fill groups matters.** Default fill order is alphabetical, which may not be the most informative ordering. Reorder by recent value with `forcats::fct_reorder(group, value)` for cleaner visual hierarchy.

## Try it yourself

**Try it:** Use the sample `df` to make a 100% stacked area chart showing the proportional composition of A, B, C over the years 2020 to 2024. Save to `ex_plot`.

```r title="Your turn: 100% stacked area"
df <- tibble::tibble(
  year = rep(2020:2024, 3),
  group = rep(c("A","B","C"), each = 5),
  value = c(10,12,15,14,16, 8,9,11,12,13, 5,6,7,8,9)
)

# Try it: proportional stacking
ex_plot <- ggplot(df, aes(x = year, y = value, fill = group)) +
  # your code here

print(ex_plot)
#> Expected: stacked area where each year sums to 1.0 (or 100%)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(df, aes(x = year, y = value, fill = group)) +
  geom_area(position = "fill") +
  scale_y_continuous(labels = scales::percent) +
  scale_fill_viridis_d() +
  labs(x = "Year", y = "Share", fill = "Group")

print(ex_plot)
```

**Explanation:** `position = "fill"` rescales each year so the total reaches 1.0. `scale_y_continuous(labels = scales::percent)` formats the y axis as percentages instead of decimals. The viridis palette ensures colorblind-friendly fills.

</details>

## Related ggplot2 functions

After mastering `geom_area()`, look at:

- `geom_line()`: line without fill
- `geom_ribbon()`: fill between two y values
- `geom_density()`: filled density curve (special case)
- `position_stack()`, `position_fill()`: explicit position controls
- `forcats::fct_reorder()`: reorder fill groups for cleaner visual hierarchy
- `ggstream::geom_stream()`: streamgraph (centered around midline, smoothed)

For complex multi-series area charts, the `ggstream` package provides streamgraphs with smoothing and centering.

## FAQ

**What is the difference between geom_area and geom_ribbon in ggplot2?**

`geom_area()` fills between a line and a BASELINE (default 0, or the stacked group below). `geom_ribbon()` fills between TWO y values (ymin and ymax). Use area for compositions; ribbon for confidence intervals.

**How do I make a stacked area chart in ggplot2?**

Map a categorical variable to `fill` inside `aes()`: `geom_area(aes(fill = group))`. Default `position = "stack"` stacks them. The y at each x is the sum across groups.

**How do I make a 100% stacked area chart?**

Set `position = "fill"`: `geom_area(position = "fill")`. Each x value's total is rescaled to 1.0 (or 100%). Format the y axis with `scale_y_continuous(labels = scales::percent)`.

**Can I overlay area charts instead of stacking?**

Yes, with `position = "identity"` and `alpha`: `geom_area(position = "identity", alpha = 0.4)`. Overlapping areas are visible. For many groups, line plots (`geom_line(color = group)`) are usually clearer.

**How do I fill between two lines in ggplot2?**

Use `geom_ribbon()` with `aes(ymin, ymax)`: `geom_ribbon(aes(ymin = lower, ymax = upper), alpha = 0.3)`. Common for confidence bands or forecast intervals around a central line.
