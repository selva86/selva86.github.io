---
title: "ggplot2 scale_x_log10() in R: Log-Transform the X Axis"
slug: "ggplot2-scale_x_log10-in-R"
description: "Use ggplot2 scale_x_log10() to log10-transform the x axis for skewed data in R. Covers breaks, labels, vs scale_x_continuous trans, 5 examples."
keywords: "ggplot2 scale_x_log10, R log x axis, scale_x_log10 breaks, log scale ggplot, scale_x_continuous trans log10"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_x_log10()|ggplot2 scale_x_log10|log x axis|log scale ggplot|scale_x_log10 breaks"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_x_log10"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_x_log10() in R: Log-Transform the X Axis

<p class="lead">The <code>scale_x_log10()</code> function in ggplot2 is a shortcut to log10-transform the X axis. It is essential for visualizing wide-range or skewed data where small and large values must coexist on one plot.</p>

[QUICK ANSWER]
+ scale_x_log10()
+ scale_x_log10(labels = scales::comma)
+ scale_x_log10(breaks = c(1, 10, 100, 1000))
+ scale_x_continuous(trans = "log10")     # equivalent
+ scale_x_log10(labels = scales::label_log())

[DECISION TREE: Is scale_x_log10() the right tool?]
- log10 transform x: scale_x_log10()
- natural log: scale_x_continuous(trans = "log")
- sqrt: scale_x_sqrt()
- y-axis log: scale_y_log10()
- arbitrary trans: scale_x_continuous(trans = "...")

## What scale_x_log10() does in one sentence

**`scale_x_log10()` log10-transforms the X axis values, equivalent to `scale_x_continuous(trans = "log10")` but shorter.** Useful for skewed positive data spanning multiple orders of magnitude.

## Syntax

**`scale_x_log10(name = waiver(), breaks = waiver(), labels = waiver(), ...)`. Same arguments as scale_x_continuous.**

```r title="Log x for diamond price"
library(ggplot2)
library(scales)

ggplot(diamonds, aes(carat, price)) +
  geom_point(alpha = 0.1) +
  scale_x_log10(labels = comma)
```

[TIP]
**Log scales fail on zero or negative values.** All x values must be > 0. ggplot will drop non-positive points with a warning.

## Five common patterns

### 1. Standard log x

```r title="Log scale with default labels"
+ scale_x_log10()
```

### 2. Comma-formatted log labels

```r title="Readable big numbers"
+ scale_x_log10(labels = scales::comma)
```

### 3. Custom breaks

```r title="Powers of 10"
+ scale_x_log10(breaks = c(1, 10, 100, 1000, 10000))
```

### 4. Scientific notation labels

```r title="10^N notation"
+ scale_x_log10(labels = scales::label_log())
```

### 5. Both axes log

```r title="Log-log plot"
+ scale_x_log10() + scale_y_log10()
```

[KEY INSIGHT]
**Log scales reveal multiplicative relationships.** If raw scatter looks like a curve, log-transforming x or y often makes it linear, exposing power-law or exponential structure.

## scale_x_log10() vs scale_x_continuous(trans=) vs scale_x_sqrt

| Function | Transform |
|---|---|
| `scale_x_log10()` | Log base 10 (shortcut) |
| `scale_x_continuous(trans = "log10")` | Same; explicit |
| `scale_x_continuous(trans = "log")` | Natural log |
| `scale_x_sqrt()` | Square root |
| `scale_x_continuous(trans = "log2")` | Log base 2 |

## A practical workflow

**For skewed data (revenue, GDP, population, etc.), log scales are the default visualization choice.**

```r
ggplot(diamonds, aes(carat, price, color = cut)) +
  geom_point(alpha = 0.3) +
  scale_x_log10(labels = comma) +
  scale_y_log10(labels = scales::dollar)
```

Both axes log; comma + dollar formatting.

## Common pitfalls

**Pitfall 1: zero or negative values.** Log fails for non-positive numbers. Filter or shift before plotting.

**Pitfall 2: misleading interpretation.** Linear-looking trends on log axes are EXPONENTIAL in raw data. Always disclose log scales in titles or captions.

[WARNING]
**`scale_x_log10()` may produce unexpected breaks.** For control, set `breaks = c(1, 10, 100, ...)` explicitly.

## Try it yourself

**Try it:** Plot mtcars hp on log10 x with comma-formatted labels. Save to `ex_plot`.

```r title="Your turn: log x"
library(scales)

ex_plot <- mtcars |>
  ggplot(aes(hp, mpg)) +
  geom_point() +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(hp, mpg)) +
  geom_point() +
  scale_x_log10(labels = comma)
```

**Explanation:** Log10 x-axis with comma labels.

</details>

## Related ggplot2 functions

After mastering scale_x_log10, look at:

- `scale_y_log10()`: log y axis
- `scale_x_sqrt()`: square root x
- `scale_x_continuous(trans = ...)`: arbitrary transformations
- `coord_trans(x = "log10")`: visual-only transform (no stat impact)
- `scales::label_log()` / `comma`: label formatters

## FAQ

**What does scale_x_log10 do in ggplot2?**

`scale_x_log10()` log10-transforms the X axis. Shortcut for `scale_x_continuous(trans = "log10")`.

**How do I add comma labels to log x?**

`scale_x_log10(labels = scales::comma)`.

**Can I use log10 with negative numbers?**

No. Log fails on zero and negative values; ggplot drops those points with a warning.

**What is the difference between scale_x_log10 and coord_trans(x = "log10")?**

scale_x_log10 transforms the data BEFORE stats run (e.g., regression line is fit on log values). coord_trans transforms only the VISUAL after stats run.

**How do I get powers-of-10 axis labels?**

`scale_x_log10(labels = scales::label_log())` produces 10^N format.
