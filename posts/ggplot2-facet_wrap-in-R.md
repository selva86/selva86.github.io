---
title: "ggplot2 facet_wrap() in R: Multi-Panel Plots With Examples"
slug: "ggplot2-facet_wrap-in-R"
description: "Use ggplot2 facet_wrap() in R to split one plot into a grid of small-multiple panels. Control rows, columns, scales, labels, and ordering. 7 examples."
keywords: "facet_wrap, ggplot2 facet_wrap, facet_wrap in R, ggplot2 small multiples, facet_wrap nrow ncol, facet_wrap scales free, facet_wrap labeller"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "facet_wrap()|ggplot2 facet_wrap|facet_wrap in R|ggplot2 small multiples|facet wrap"
auto_link_case_sensitive: true
target_keyword: "facet_wrap"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 facet_wrap() in R: Multi-Panel Plots With Examples

<p class="lead">The <code>facet_wrap()</code> function in ggplot2 splits one plot into a grid of small-multiple panels, one panel per level of a categorical variable. Each panel reuses the same geoms and aesthetics, so you can compare a relationship across groups at a glance.</p>

[QUICK ANSWER]
p + facet_wrap(~ class)                              # one panel per level
p + facet_wrap(vars(class))                          # tidy-eval form
p + facet_wrap(~ class, nrow = 2)                    # force 2 rows
p + facet_wrap(~ class, ncol = 3)                    # force 3 columns
p + facet_wrap(~ class, scales = "free_y")           # free y per panel
p + facet_wrap(~ drv + cyl)                          # facet by two variables
p + facet_wrap(~ class, labeller = label_both)       # show "class: suv" labels
p + facet_wrap(~ class, dir = "v", strip.position = "bottom")  # layout tweaks

[DECISION TREE: Is facet_wrap() the right tool?]
- one categorical variable, wrap into rows: facet_wrap(~ var)
- two categorical variables on a strict row x column grid: facet_grid(rowvar ~ colvar)
- many panels, want a compact rectangle: facet_wrap(~ var, ncol = 4)
- panels with very different y ranges: facet_wrap(~ var, scales = "free_y")
- one plot per group saved as a file: split data + map(ggsave)
- interactive panel swap by a control: shiny + reactive ggplot
- plot a 2D matrix without faceting: geom_tile() with a grid aes

## What facet_wrap() does in one sentence

**`facet_wrap()` splits a plot into panels, one per level of a discrete variable, and wraps the panels into a rectangular grid.** It is the small-multiples primitive in ggplot2: same geoms, same aesthetic mappings, different subset of data per panel.

Use it whenever you would otherwise overlay too many groups on a single axis, or whenever a single chart hides patterns inside subgroups. Faceting trades one busy plot for several clean ones.

## Syntax

**`facet_wrap()` is a layer added to a ggplot() call.** The required argument is a formula or a `vars()` call naming the faceting variable. Optional arguments control the layout, the scale linkage, and the strip labels.

```r title="Load ggplot2 and inspect mpg"
library(ggplot2)

head(mpg)[, c("manufacturer", "class", "displ", "hwy")]
#> # A tibble: 6 x 4
#>   manufacturer class   displ   hwy
#>   <chr>        <chr>   <dbl> <int>
#> 1 audi         compact   1.8    29
#> 2 audi         compact   1.8    29
#> 3 audi         compact   2.0    31
#> 4 audi         compact   2.0    30
#> 5 audi         compact   2.8    26
#> 6 audi         compact   2.8    26
```

The full signature:

```
facet_wrap(facets, nrow = NULL, ncol = NULL, scales = "fixed",
           shrink = TRUE, labeller = "label_value", as.table = TRUE,
           switch = NULL, drop = TRUE, dir = "h", strip.position = "top")
```

The `facets` argument accepts a one-sided formula (`~ var`) or `vars(var)`. Multiple variables go on the right side: `~ var1 + var2`, or `vars(var1, var2)`.

[TIP]
**Prefer `vars()` over the formula form in new code.** `facet_wrap(vars(class))` is the tidy-evaluation idiom and pairs cleanly with programmatic faceting (passing variable names as function arguments). The formula form `~ class` still works and remains common in tutorials.

## Seven common patterns

### 1. Basic facet_wrap by one variable

```r title="One panel per car class"
p <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()

p + facet_wrap(~ class)
```

`facet_wrap(~ class)` splits the scatter into one panel per unique value of `class`. The 7 car classes wrap into a default 3 x 3 grid (with the last cell empty).

### 2. Control rows and columns

```r title="Force a 2 x 4 layout"
p + facet_wrap(~ class, nrow = 2)
```

`nrow = 2` forces 2 rows; ggplot computes the columns. Swap to `ncol = 4` to force 4 columns and let rows fall out. Set neither to keep the default near-square wrap.

### 3. Free scales per panel

```r title="Free y axis per panel"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class, scales = "free_y")
```

The default `scales = "fixed"` keeps the same x and y limits across panels (best for direct comparison). `"free_y"` lets each panel set its own y range, useful when group magnitudes differ. Other options: `"free_x"`, `"free"` (both axes free).

### 4. Custom panel labels with labeller

```r title="Show both the variable name and value in the strip"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class, labeller = label_both)
```

Default labeller shows just the value (`suv`). `label_both` shows `class: suv`. Other built-ins: `label_value` (default), `label_parsed` (for math expressions), `label_wrap_gen(width = 15)` (wrap long labels onto two lines).

### 5. Strip position and direction

```r title="Strips at bottom, panels filled vertically"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class, strip.position = "bottom", dir = "v")
```

`strip.position` moves the panel label strip to `"top"` (default), `"bottom"`, `"left"`, or `"right"`. `dir = "v"` fills the grid down then right; `"h"` (default) fills right then down.

### 6. Facet by multiple variables

```r title="Wrap by drv and cyl"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ drv + cyl)
```

Listing more than one variable on the right side creates one panel per unique combination present in the data. Unlike `facet_grid()`, `facet_wrap()` skips combinations with no rows, so the grid stays compact.

[KEY INSIGHT]
**`facet_wrap()` wraps a 1D sequence of panels into 2D; `facet_grid()` enforces a strict 2D matrix.** With `facet_wrap()`, panel order is the unique levels in the data, wrapped left-to-right then top-to-bottom. With `facet_grid()`, rows and columns are coordinates and empty cells are kept. Pick `facet_wrap()` when screen space matters; pick `facet_grid()` when row/column comparison matters.

### 7. Drop empty panels

```r title="Keep all factor levels, even unused ones"
mpg2 <- mpg
mpg2$class <- factor(mpg2$class,
                     levels = c("compact", "midsize", "suv",
                                "pickup", "minivan", "subcompact",
                                "2seater", "luxury"))

ggplot(mpg2, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class, drop = FALSE)
```

`drop = FALSE` keeps a panel for every factor level, even ones with zero rows ("luxury" here). Useful when a downstream table or report expects a fixed set of panels.

## facet_wrap() vs facet_grid()

**Pick `facet_wrap()` for one variable; pick `facet_grid()` for a strict two-variable matrix.** Both faceting functions share scales, themes, and labelling defaults, but they answer different layout questions.

| Question | facet_wrap() | facet_grid() |
|---|---|---|
| Panels per row x column | wraps a 1D sequence into 2D | strict row var x col var grid |
| Empty combinations | dropped by default | always shown |
| `nrow`/`ncol` control | yes | inferred from row/col vars |
| Best for | one variable, many levels | two variables, balanced design |
| Marginal totals | not supported | `margins = TRUE` |

Rule of thumb: if you can write the faceting as a single right-side variable list, start with `facet_wrap()`. Switch to `facet_grid(rowvar ~ colvar)` only when row-vs-column comparison is the point of the plot.

## Common pitfalls

**Pitfall 1: too many panels.** `facet_wrap(~ manufacturer)` on `mpg` produces 15 panels. Each panel becomes tiny and the chart loses its purpose. Limit faceting to 4 to 12 panels, or collapse rare levels into "other" with `forcats::fct_lump()` first.

**Pitfall 2: comparing magnitudes with `scales = "free"`.** Free scales let panels show internal structure, but they break direct comparison: a tall bar in one panel can be smaller than a short bar in another. Use `scales = "fixed"` (default) when the cross-panel comparison is the headline.

[WARNING]
**Forgetting that `facet_wrap()` reuses the global aesthetic mappings.** If your `ggplot()` call sets `aes(color = manufacturer)` and you facet by `manufacturer`, every panel will have one color and the legend will repeat per panel. Move the color aesthetic to the panels you want, or drop it once it becomes redundant with the facet.

**Pitfall 3: factor ordering.** Panels follow factor levels, not data order. Reorder levels before faceting (`fct_reorder()`, `fct_relevel()`) when you want a specific panel sequence; otherwise expect alphabetical order.

## Try it yourself

**Try it:** Facet `mpg` by `cyl` with 1 row and free y axis. Use `geom_point()` for `displ` vs `hwy`. Save the plot to `ex_facets`.

```r title="Your turn: facet by cyl, one row"
# Try it: facet_wrap with nrow and scales
ex_facets <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  # your code here

ex_facets
#> Expected: one row with 4 panels (cyl = 4, 5, 6, 8), independent y axes
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_facets <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ cyl, nrow = 1, scales = "free_y")

ex_facets
```

**Explanation:** `nrow = 1` forces a single row of panels. `scales = "free_y"` lets each cylinder group find its own y range, which highlights the within-group spread without flattening to a shared scale.

</details>

## Related ggplot2 functions

After mastering `facet_wrap()`, look at:

- `facet_grid()`: strict 2D faceting with separate row and column variables
- `vars()`: tidy-evaluation helper for programmatic faceting
- `label_both()`, `label_value()`, `label_parsed()`: built-in labellers
- `as_labeller()`: turn a named character vector into a labeller
- `theme(strip.text, strip.background)`: customize panel strips
- `coord_cartesian()`: zoom inside panels without dropping points

For interactive facets, wrap with `plotly::ggplotly()`. For very large panel counts, consider `ggforce::facet_wrap_paginate()` to split across pages.

[NOTE]
**Coming from Python plotnine?** The API mirrors ggplot2 closely: `facet_wrap("~ class")` in plotnine matches `facet_wrap(~ class)` in R. Coming from base R `par(mfrow = c(2, 3))`? That sets a global plotting grid; `facet_wrap()` is local to one ggplot object and handles data subsetting for you.

## FAQ

**How do I change the number of columns in facet_wrap?**

Set `ncol` directly: `facet_wrap(~ var, ncol = 4)`. To control rows instead, use `nrow`. Set neither and ggplot picks a near-square layout. `ncol` and `nrow` are mutually constraining; supply only one.

**How do I make each panel have its own y axis in facet_wrap?**

Use `scales = "free_y"`: `facet_wrap(~ var, scales = "free_y")`. For both axes free, use `scales = "free"`. Free scales let each panel show its internal range but make cross-panel magnitude comparison misleading.

**Can facet_wrap take two variables?**

Yes. Pass `~ var1 + var2` or `vars(var1, var2)`. ggplot creates one panel per unique combination present in the data and drops empty combinations. For a strict row x column matrix that keeps empty cells, use `facet_grid(var1 ~ var2)` instead.

**How do I rename the panel labels in facet_wrap?**

Two options. Recode the variable before plotting (`mutate(label = recode(var, ...))` and facet by `label`). Or pass a custom labeller: `facet_wrap(~ var, labeller = as_labeller(c("a" = "Apple", "b" = "Banana")))`.

**Why is one panel empty in my facet_wrap plot?**

`facet_wrap()` wraps panels into a rectangle and pads the last row with empty cells when the panel count is not a multiple of the column count. To remove the empty cell, change `nrow` or `ncol` so the layout fits exactly, or accept the visual gap.

For the canonical reference, see the [ggplot2 facet_wrap documentation](https://ggplot2.tidyverse.org/reference/facet_wrap.html).
