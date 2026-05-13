---
title: "ggplot2 scale_shape() in R: Map a Variable to Point Shapes"
slug: "ggplot2-scale_shape-in-R"
description: "Use ggplot2 scale_shape() in R to map a factor to point shapes. Covers scale_shape_manual(), shape codes 0-25, open vs filled, legend tuning, 5 worked examples."
keywords: "ggplot2 scale_shape, R point shapes, scale_shape_manual, ggplot shape codes, filled shapes ggplot, shape legend ggplot"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_shape()|ggplot2 scale_shape|scale_shape_manual()|scale_shape_identity()|ggplot shape codes"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_shape"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_shape() in R: Map a Variable to Point Shapes

<p class="lead">The <code>scale_shape()</code> function in ggplot2 maps a discrete (factor) variable to point shapes, so each level of the variable draws a different plotting symbol. It is the standard scale behind any chart that uses the <code>shape</code> aesthetic to distinguish groups.</p>

[QUICK ANSWER]
scale_shape()                                         # default 6 shapes
scale_shape(name = "Species")                         # tune legend title
scale_shape_manual(values = c(16, 17, 15))            # pick shape codes by hand
scale_shape_manual(values = c("setosa" = 16, "virginica" = 17))  # named values
scale_shape_identity()                                # use column values as shape codes
scale_shape(solid = FALSE)                            # open (hollow) shapes only
scale_shape_discrete(name = "Group", labels = c("A","B","C"))    # custom labels

[DECISION TREE: Is scale_shape() the right tool?]
- map a factor to point shape: scale_shape()
- pick specific shape codes per level: scale_shape_manual()
- column already holds shape codes (0 to 25): scale_shape_identity()
- shape by a CONTINUOUS variable: bin it first, then scale_shape_binned()
- color, not shape, by group: scale_color_brewer()
- fix one shape for all points (no mapping): geom_point(shape = 17)

## What scale_shape() does in one sentence

**`scale_shape()` maps each level of a discrete variable to a unique point shape so groups are visually separable without color.** ggplot picks shapes 16, 17, 15, 3, 7, 8 by default (filled circle, filled triangle, filled square, plus, asterisk in square, asterisk).

## Syntax and arguments

**`scale_shape(name = waiver(), breaks = waiver(), labels = waiver(), limits = NULL, solid = TRUE, na.translate = TRUE, na.value = NA, guide = "legend")`.** The `solid` argument toggles between filled (default) and hollow shapes. There is no `values` argument on `scale_shape()` itself; to pick specific codes use `scale_shape_manual()`.

```r title="Default mapping with iris"
library(ggplot2)

ggplot(iris, aes(Sepal.Length, Sepal.Width, shape = Species)) +
  geom_point(size = 3) +
  scale_shape()
```

The `shape = Species` mapping inside `aes()` tells ggplot which variable controls the symbol. `scale_shape()` then auto-picks one shape per factor level. With three Species, ggplot assigns 16, 17, 15.

[TIP]
**Always set `size = 3` or larger when shape is the encoding.** The default `size = 1.5` is too small to tell triangles from squares at a glance, especially on retina displays. Bump it to 3 or 4 for legibility.

## Five common patterns

### 1. Default scale_shape() with a factor

```r title="Default shapes by Species"
ggplot(iris, aes(Petal.Length, Petal.Width, shape = Species)) +
  geom_point(size = 3, color = "steelblue") +
  scale_shape() +
  labs(title = "Iris petal dimensions by Species")
```

The auto-assigned shapes are 16 (circle), 17 (triangle), 15 (square). They are filled by default. If you want different symbols, jump to `scale_shape_manual()` in pattern 2.

### 2. Manual shape codes with scale_shape_manual()

```r title="Hand-pick shapes per level"
ggplot(iris, aes(Petal.Length, Petal.Width, shape = Species)) +
  geom_point(size = 3) +
  scale_shape_manual(values = c("setosa" = 16,
                                "versicolor" = 17,
                                "virginica" = 8))
```

Use `scale_shape_manual()` whenever you need a specific symbol per group. The 26 R shape codes go from 0 (open square) to 25 (filled down triangle). Codes 21 to 25 are special: they accept both `color` (border) and `fill` (interior).

[KEY INSIGHT]
**ggplot has 26 shape codes (0 to 25), but only 6 are auto-assigned.** If a factor has more than 6 levels, `scale_shape()` cycles a warning and refuses to plot. Switch to `scale_shape_manual()` and supply enough codes, or reduce groups.

### 3. Open shapes with `solid = FALSE`

```r title="Hollow shapes for transparency"
ggplot(iris, aes(Sepal.Length, Sepal.Width, shape = Species)) +
  geom_point(size = 3.5, stroke = 1.2) +
  scale_shape(solid = FALSE)
```

`solid = FALSE` swaps to open (hollow) shapes: 1 (open circle), 2 (open triangle), 0 (open square). Hollow shapes reveal overlap and work well on dark backgrounds. Bump `stroke` to make the outline readable.

### 4. Fill-aware shapes (21 to 25)

```r title="Use fill for filled circle with border"
ggplot(iris, aes(Sepal.Length, Sepal.Width,
                 shape = Species, fill = Species)) +
  geom_point(size = 4, color = "black", stroke = 0.8) +
  scale_shape_manual(values = c(21, 22, 24)) +
  scale_fill_brewer(palette = "Set2")
```

Shape codes 21 to 25 are the "filled with border" family. They listen to both `color` (border) and `fill` (interior). This pattern produces publication-grade points where each Species has a distinct symbol AND a distinct fill color.

[WARNING]
**Setting `color =` on shapes 16 to 20 changes the WHOLE point, not the border.** Only shapes 21 to 25 separate border (`color`) from interior (`fill`). If your fill assignment seems ignored, you are likely on a shape outside 21 to 25.

### 5. Tidy legend with custom labels

```r title="Custom legend title and labels"
ggplot(iris, aes(Sepal.Length, Sepal.Width, shape = Species)) +
  geom_point(size = 3) +
  scale_shape(
    name = "Iris species",
    labels = c("setosa" = "I. setosa",
               "versicolor" = "I. versicolor",
               "virginica" = "I. virginica")
  )
```

The `name` argument renames the legend header. The `labels` argument relabels each level, useful for italicized scientific names or shortened display strings. Without `labels`, ggplot uses the raw factor levels.

## scale_shape() vs scale_shape_manual() vs scale_shape_identity()

| Function | Source of shape values | Use when |
|---|---|---|
| `scale_shape()` | Auto picks 16, 17, 15, 3, 7, 8 in order | Up to 6 groups, any shape is fine |
| `scale_shape_manual()` | You pass `values = c(...)` | Specific codes per group needed |
| `scale_shape_identity()` | The data column itself holds 0 to 25 codes | Data already encodes shape numerically |
| `scale_shape_discrete()` | Identical to `scale_shape()` (alias) | Legacy code or clarity |
| `scale_shape_binned()` | Continuous variable binned into shapes | Shape by numeric range |

## Common pitfalls

**Pitfall 1: more than 6 levels.** `scale_shape()` warns "The shape palette can deal with a maximum of 6 discrete values" and drops rows beyond six. Use `scale_shape_manual(values = 0:nlevels(x))` or rethink the encoding.

**Pitfall 2: fill ignored on shapes 16 to 20.** Only codes 21 to 25 use the `fill` aesthetic. If you mapped fill but see no color inside the points, you picked the wrong shape family.

**Pitfall 3: continuous variable passed to shape.** `aes(shape = mpg)` errors with "A continuous variable cannot be mapped to the shape aesthetic." Cast to a factor first (`factor(cut(mpg, 3))`) or use color/size instead.

## Try it yourself

**Try it:** Plot `mtcars` with `wt` on x, `mpg` on y, and `cyl` (as a factor) controlling point shape. Use `scale_shape_manual()` to assign cyl=4 a filled circle (16), cyl=6 a filled triangle (17), and cyl=8 a filled square (15). Save the plot to `ex_shape`.

```r title="Your turn: mtcars shapes"
ex_shape <- mtcars |>
  ggplot(aes(wt, mpg, shape = factor(cyl))) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_shape <- ggplot(mtcars, aes(wt, mpg, shape = factor(cyl))) +
  geom_point(size = 3.5, color = "darkblue") +
  scale_shape_manual(values = c("4" = 16, "6" = 17, "8" = 15),
                     name = "Cylinders")

ex_shape
```

**Explanation:** `factor(cyl)` converts the numeric `cyl` column to a discrete variable so the shape aesthetic accepts it. `scale_shape_manual(values = ...)` then maps each level to a chosen shape code, and `name =` sets the legend title.

</details>

## Related ggplot2 functions

After mastering `scale_shape()`, look at:

- `geom_point()`: the main geom that uses the shape aesthetic
- `scale_shape_manual()`: pick shape codes per level
- `scale_shape_identity()`: when the data column already holds shape codes
- `scale_color_brewer()`: pair color with shape for accessible group encoding
- `aes()`: where you map `shape = variable` in the first place

For the full reference, see the [official ggplot2 scale_shape page](https://ggplot2.tidyverse.org/reference/scale_shape.html).

## FAQ

**What shape codes does ggplot2 use?**

ggplot2 supports R's 26 plotting symbols, numbered 0 to 25. Codes 0 to 14 are line-drawn (no fill), 15 to 20 are solid filled, and 21 to 25 are filled-with-border (they respond to both `color` and `fill`). The default `scale_shape()` picks from 16, 17, 15, 3, 7, 8 in order. You can see all 26 visually with `ggplot(data.frame(x = 0:25), aes(x %% 6, x %/% 6, shape = factor(x))) + geom_point(size = 5) + scale_shape_manual(values = 0:25)`.

**How do I use more than 6 shapes in ggplot2?**

The default `scale_shape()` palette tops out at 6 unique shapes. Pass `scale_shape_manual(values = c(16, 17, 15, 3, 7, 8, 18, 19))` (or any list of valid codes 0 to 25) to extend it. If you need 7+ groups, consider whether shape is the right encoding; color or faceting usually reads better than tiny shape differences.

**What is the difference between scale_shape and scale_shape_manual?**

`scale_shape()` auto-assigns shapes from a fixed palette (max 6 groups). `scale_shape_manual()` lets you specify exactly which shape code each factor level gets via `values = c(...)`. Use `scale_shape()` for quick exploratory plots and `scale_shape_manual()` for publication where the shape-to-group mapping must be deliberate.

**Why are my filled shapes showing no fill color?**

Only shape codes 21 to 25 listen to the `fill` aesthetic. Codes 16 to 20 are colored by the `color` aesthetic instead. If you set `fill = Species` and used shape 16, the fill is silently ignored. Switch to `scale_shape_manual(values = c(21, 22, 24))` and the fill mapping will take effect.

**Can I map a continuous variable to shape in ggplot2?**

Not directly. ggplot2 errors with "A continuous variable cannot be mapped to the shape aesthetic" because shape is inherently discrete. Two workarounds: bin the variable into 3 to 6 categories with `cut(x, 4)` and pass the result, or use `scale_shape_binned()` which does the binning for you. For continuous encoding, prefer color or size.
