---
title: "ggplot2 scale_color_manual() in R: Custom Colors for Groups"
slug: "ggplot2-scale_color_manual-in-R"
description: "Use ggplot2 scale_color_manual() to assign custom colors to discrete groups in R. Covers values, named vector, fill_manual, and 5 worked examples."
keywords: "ggplot2 scale_color_manual, R custom colors plot, scale_color_manual values, named color vector, scale_fill_manual"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_color_manual()|ggplot2 scale_color_manual|custom colors plot|scale_fill_manual|named color vector"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_color_manual"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_color_manual() in R: Custom Colors for Groups

<p class="lead">The <code>scale_color_manual()</code> function in ggplot2 assigns specific colors to specific factor levels in a plot. It is the right choice when you want EXACT colors (e.g., brand colors) instead of an automatic palette.</p>

[QUICK ANSWER]
+ scale_color_manual(values = c("a" = "red", "b" = "blue"))
+ scale_color_manual(values = c("red","blue","green"))
+ scale_fill_manual(values = c(...))         # fill aesthetic
+ scale_color_brewer(palette = "Set1")        # palette alternative
+ scale_color_viridis_d()                     # perceptual uniform

[DECISION TREE: Is scale_color_manual() the right tool?]
- specific exact colors per category: scale_color_manual()
- color palette by name: scale_color_brewer()
- perceptually uniform: scale_color_viridis_d()
- continuous gradient: scale_color_gradient()
- fill aesthetic: scale_fill_manual()

## What scale_color_manual() does in one sentence

**`scale_color_manual(values = ...)` maps each factor level of the color aesthetic to a specific color you provide.** Used when default palette doesn't match brand or domain conventions.

## Syntax

**`scale_color_manual(values, name = waiver(), labels = waiver(), ...)`. values is a named or positional vector of colors.**

```r title="Brand colors"
library(ggplot2)

ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_manual(values = c("4" = "#1f77b4", "6" = "#ff7f0e", "8" = "#d62728"))
```

[TIP]
**Use NAMED vectors `c("level" = "color")` for safety; positional `c("red","blue")` is fragile if levels reorder.**

## Five common patterns

### 1. Named values

```r title="Explicit level-color mapping"
+ scale_color_manual(values = c("low" = "green", "mid" = "yellow", "high" = "red"))
```

### 2. Positional values

```r title="Order matches factor levels"
+ scale_color_manual(values = c("red", "blue", "green"))
```

### 3. fill_manual variant

```r title="For geom_col, geom_bar"
+ scale_fill_manual(values = c("a" = "steelblue", "b" = "tomato"))
```

### 4. Use hex codes

```r title="Brand colors"
+ scale_color_manual(values = c("primary" = "#1F2937", "secondary" = "#3B82F6"))
```

### 5. Drop unused levels

```r title="drop = FALSE keeps all"
+ scale_color_manual(values = c(...), drop = FALSE)
```

[KEY INSIGHT]
**Use named vector `c("level"="color")` for STABLE mapping across plot revisions.** Positional vectors break if you reorder factor levels.

## scale_color_manual() vs scale_color_brewer() vs scale_color_viridis

| Function | Source | Best for |
|---|---|---|
| `scale_color_manual()` | Custom | Exact colors |
| `scale_color_brewer()` | ColorBrewer palettes | Named palettes |
| `scale_color_viridis_d()` | Viridis | Perceptually uniform |
| `scale_color_grey()` | Greyscale | Print-safe |

## A practical workflow

**For team / brand consistency, define a colors vector once and reuse.**

```r
team_colors <- c(
  "Sales"      = "#1F77B4",
  "Marketing"  = "#FF7F0E",
  "Engineering" = "#2CA02C"
)

ggplot(df, aes(month, headcount, color = team)) +
  geom_line() +
  scale_color_manual(values = team_colors)
```

## Common pitfalls

**Pitfall 1: too few colors.** If you have 5 levels but values has 3, ggplot recycles or errors. Provide one per level.

**Pitfall 2: typos in named vector.** A typo in "level" silently maps to default gray. Always check output.

[WARNING]
**`scale_color_manual` only sets COLOR aesthetic; for FILL, use `scale_fill_manual()`.** They are separate scales.

## Try it yourself

**Try it:** Color mtcars points by cyl with custom colors red, green, blue. Save to `ex_plot`.

```r title="Your turn: custom colors"
ex_plot <- mtcars |>
  ggplot(aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_manual(values = c("4" = "red", "6" = "green", "8" = "blue"))
```

**Explanation:** Named vector maps each cyl value to a specific color.

</details>

## Related ggplot2 functions

After mastering scale_color_manual, look at:

- `scale_fill_manual()`: same for fill aesthetic
- `scale_color_brewer()`: ColorBrewer palettes
- `scale_color_viridis_d()`: viridis palette
- `aes(color = ...)`: map color aesthetic
- `theme()`: plot-wide styling

## FAQ

**What does scale_color_manual do in ggplot2?**

`scale_color_manual()` assigns specific colors to factor levels for the color aesthetic. Used for custom / brand colors.

**What is the difference between scale_color_manual and scale_fill_manual?**

color is for line/point COLOR. fill is for area FILL (bars, polygons, ribbons). Use whichever aesthetic your geom uses.

**How do I provide colors as hex codes?**

Pass them in values: `c("a" = "#1F77B4", "b" = "#FF7F0E")`.

**What if I have more levels than colors?**

ggplot recycles or errors. Always provide one color per level.

**Should I use named or positional values?**

Named for safety. Positional breaks silently if factor levels reorder.
