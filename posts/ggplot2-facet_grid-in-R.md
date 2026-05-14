---
title: "ggplot2 facet_grid() in R: Grid Layouts With Free Scales"
slug: "ggplot2-facet_grid-in-R"
description: "Use ggplot2 facet_grid() in R to split a plot into a matrix of panels by row and column variables. Control scales, labels, space, and margins. 7 examples."
keywords: "facet_grid, ggplot2 facet_grid, facet_grid in R, ggplot2 facet_grid scales free, facet_grid labels, facet_grid vs facet_wrap, facet_grid margins"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "facet_grid()|ggplot2 facet_grid|facet_grid in R|facet grid|ggplot2 panel grid"
auto_link_case_sensitive: true
target_keyword: "facet_grid"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 facet_grid() in R: Grid Layouts With Free Scales

<p class="lead">The <code>facet_grid()</code> function in ggplot2 splits one plot into a 2D matrix of panels defined by a row variable and a column variable. Rows and columns become coordinates, so cross-group comparison along either axis is read at a glance.</p>

[QUICK ANSWER]
p + facet_grid(rows = vars(drv))                     # rows only
p + facet_grid(cols = vars(cyl))                     # columns only
p + facet_grid(drv ~ cyl)                            # rows by cols
p + facet_grid(drv ~ cyl, scales = "free_y")         # free y per row
p + facet_grid(drv ~ cyl, space = "free_x")          # column width by data
p + facet_grid(drv ~ cyl, labeller = label_both)     # "drv: 4" labels
p + facet_grid(drv ~ cyl, margins = TRUE)            # add total panels
p + facet_grid(drv ~ cyl, switch = "y")              # strips on the left

[DECISION TREE: Is facet_grid() the right tool?]
- two discrete variables on a strict row x col grid: facet_grid(row ~ col)
- one variable, wrap into many panels: facet_wrap(~ var, ncol = 4)
- one panel per unique combo only (skip empties): facet_wrap(~ var1 + var2)
- panel sizes proportional to data range: facet_grid(., space = "free")
- side-by-side plots of different datasets: patchwork::wrap_plots()
- a heatmap of two discrete vars: geom_tile() with x and y aesthetics
- one plot per group saved to disk: split data + purrr::map(ggsave)

## What facet_grid() does in one sentence

**`facet_grid()` lays out panels on a strict 2D matrix where rows are the levels of one variable and columns are the levels of another.** It is the cross-tabulation primitive for ggplot2: same geoms, one panel per `(row_level, column_level)` cell, including empty cells.

Use it when you want to compare a relationship across two categorical splits at once. For one-variable faceting, prefer `facet_wrap()`; for cross-tabulation, `facet_grid()` is the right tool.

## Syntax

**`facet_grid()` is a layer added to a ggplot() call** that takes either a formula (`rows ~ cols`) or the explicit `rows`/`cols` arguments. Optional arguments control scale linkage, panel sizing, labels, strip placement, and margin totals.

```r title="Load ggplot2 and inspect mpg"
library(ggplot2)

head(mpg)[, c("manufacturer", "drv", "cyl", "displ", "hwy")]
#> # A tibble: 6 x 5
#>   manufacturer drv     cyl displ   hwy
#>   <chr>        <chr> <int> <dbl> <int>
#> 1 audi         f         4   1.8    29
#> 2 audi         f         4   1.8    29
#> 3 audi         f         4   2.0    31
#> 4 audi         f         4   2.0    30
#> 5 audi         f         6   2.8    26
#> 6 audi         f         6   2.8    26
```

The full signature:

```
facet_grid(rows = NULL, cols = NULL, scales = "fixed", space = "fixed",
           shrink = TRUE, labeller = "label_value", as.table = TRUE,
           switch = NULL, drop = TRUE, margins = FALSE, axes = "margins",
           axis.labels = "all")
```

You can pass `rows` and `cols` as `vars(varname)`, or use the older formula form `rowvar ~ colvar`. Use a dot for "no faceting on this axis": `facet_grid(. ~ cyl)` is columns only; `facet_grid(drv ~ .)` is rows only.

[TIP]
**Prefer `vars()` over the formula form in new code.** `facet_grid(rows = vars(drv), cols = vars(cyl))` is the tidy-evaluation idiom and pairs cleanly with programmatic faceting (passing variable names as function arguments). The formula form `drv ~ cyl` still works and stays common in older tutorials.

## Seven common patterns

### 1. Basic facet_grid by rows and columns

```r title="Panels by drive and cylinder"
p <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()

p + facet_grid(drv ~ cyl)
```

`facet_grid(drv ~ cyl)` creates a matrix with one row per `drv` level (4, f, r) and one column per `cyl` level (4, 5, 6, 8). Empty cells (e.g. rear-wheel-drive 4-cylinder cars) are kept and stay blank, which is the defining behavior of grid faceting.

### 2. Rows only or columns only

```r title="Rows only with the dot"
p + facet_grid(drv ~ .)
```

A dot on either side of the formula means "no faceting on this axis". `drv ~ .` gives one row per `drv` level, stacked vertically. Swap to `. ~ drv` for the same panels arranged horizontally.

### 3. Free scales per row or column

```r title="Free y axis per row"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl, scales = "free_y")
```

Unlike `facet_wrap()`, where `scales = "free_y"` frees each panel independently, `facet_grid()` frees each row (with `"free_y"`) or each column (with `"free_x"`) but keeps the linked axis consistent within the row or column. This preserves the grid's row-vs-row and column-vs-column readability.

### 4. Proportional panel sizes with space

```r title="Column widths match data range"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_grid(. ~ cyl, scales = "free_x", space = "free_x")
```

The `space` argument is unique to `facet_grid()`: panels can take width or height proportional to their data range instead of every panel having the same size. Set `space = "free_x"` with `scales = "free_x"` so wider data ranges get wider panels, which avoids whitespace and visual distortion.

### 5. Marginal totals

```r title="Add row, column, and grand-total panels"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl, margins = TRUE)
```

`margins = TRUE` appends an "(all)" row, an "(all)" column, and one grand-total panel. Each marginal panel re-aggregates the data across that dimension, so the bottom row shows each cylinder count pooled over drive types, and the rightmost column shows each drive type pooled over cylinders. Useful for sanity-checking that subgroup patterns match the overall pattern.

[KEY INSIGHT]
**`facet_grid()` is a cross-tab; `facet_wrap()` is a rectangle of small multiples.** Grid faceting preserves the meaning of row position and column position (they are coordinates of a categorical variable), so you can read down a column and across a row as comparisons. Wrap faceting flattens panels into a sequence and arranges them to fit the page. Choose grid when both axes carry meaning; choose wrap when only one does.

### 6. Custom labellers and strip position

```r title="Both labels visible, strips on the left"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl,
             labeller = label_both,
             switch = "y")
```

Default labels show only the value (`f`, `8`). `label_both` shows `drv: f` and `cyl: 8`. The `switch` argument moves strip labels: `"x"` moves column strips to the bottom, `"y"` moves row strips to the left, and `"both"` does both at once. This pairs well with `theme(strip.placement = "outside")` when an axis label would otherwise overlap the strip.

### 7. Programmatic faceting with vars()

```r title="Pass variable names as arguments"
plot_by <- function(data, rowvar, colvar) {
  ggplot(data, aes(x = displ, y = hwy)) +
    geom_point() +
    facet_grid(rows = vars({{ rowvar }}), cols = vars({{ colvar }}))
}

plot_by(mpg, drv, cyl)
```

The `vars()` form is required when faceting variables come from function arguments. Pair it with curly-curly (`{{ }}`) inside a function so the caller can pass bare column names: `plot_by(mpg, drv, cyl)`. Trying to pass `drv ~ cyl` programmatically forces awkward string parsing; the `vars()` form is the supported path.

## facet_grid() vs facet_wrap()

**Use `facet_grid()` when row and column positions both carry meaning; use `facet_wrap()` when one variable wraps for layout.** Both share scale, theme, and labelling defaults but answer different layout questions.

| Feature | facet_grid() | facet_wrap() |
|---|---|---|
| Panel layout | strict row x col matrix | 1D sequence wrapped to fit |
| Empty combinations | always shown (blank) | dropped by default |
| Scale freeing | per row or per column | per panel |
| `space = "free"` | yes (proportional panels) | no |
| `margins = TRUE` | yes (totals) | no |
| `nrow` / `ncol` control | inferred from variables | yes |
| Best for | two variables, cross-tab reading | one variable, many levels |

Rule of thumb: if you can frame the question as "how does Y depend on X across (row, column) cells", reach for `facet_grid()`. If the question is "show me one panel per group, please wrap them to fit", reach for `facet_wrap()`.

## Common pitfalls

**Pitfall 1: empty cells when one combination has no data.** `facet_grid(manufacturer ~ class)` on `mpg` produces dozens of empty cells because most manufacturers do not build every class. Filter to a balanced subset first, or switch to `facet_wrap(~ manufacturer + class)` to drop empties.

**Pitfall 2: free scales break cross-row comparison.** `scales = "free_y"` lets each row pick its own y range, which is great inside the row but misleading across rows. Reserve free scales for cases where the within-row distribution matters more than the across-row magnitude.

[WARNING]
**Forgetting that the linked axis stays linked.** With `scales = "free_y"` in `facet_grid()`, columns still share an x axis. If you wanted both axes free, write `scales = "free"`. The four valid values are `"fixed"` (default), `"free_x"`, `"free_y"`, and `"free"`.

**Pitfall 3: many levels make tiny panels.** A 6x8 grid yields 48 panels, each too small to read. Cap each axis at 4 to 6 levels, or lump rare ones with `forcats::fct_lump()`.

## Try it yourself

**Try it:** Facet `mpg` by `drv` (rows) and `cyl` (columns) with free y axis per row. Use `geom_point()` for `displ` vs `hwy`. Save the plot to `ex_grid`.

```r title="Your turn: facet grid by drv and cyl"
# Try it: facet_grid with rows, cols, and free y
ex_grid <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  # your code here

ex_grid
#> Expected: 3 rows (drv = 4, f, r) x 4 columns (cyl = 4, 5, 6, 8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl, scales = "free_y")

ex_grid
```

**Explanation:** `drv ~ cyl` puts `drv` levels on the rows and `cyl` levels on the columns. `scales = "free_y"` lets each row find its own y range while keeping x and column-wise comparisons consistent.

</details>

## Related ggplot2 functions

After mastering `facet_grid()`, look at:

- `facet_wrap()`: wrap one variable's levels into a compact rectangle
- `vars()`: tidy-evaluation helper for programmatic faceting
- `label_both()`, `label_value()`, `label_parsed()`, `label_wrap_gen()`: built-in labellers
- `as_labeller()`: turn a named character vector into a labeller
- `theme(strip.text, strip.background, strip.placement)`: style panel strips
- `coord_cartesian()`: zoom inside panels without dropping points

For paginated grids, see `ggforce::facet_grid_paginate()`. For interactive grids, wrap with `plotly::ggplotly()`.

[NOTE]
**Coming from Python plotnine?** The API mirrors ggplot2 closely: `facet_grid("drv ~ cyl")` in plotnine matches `facet_grid(drv ~ cyl)` in R. Coming from base R `par(mfrow = c(3, 4))`? That hard-codes a global plotting grid; `facet_grid()` is local to one ggplot object, handles data subsetting, and adds strip labels for free.

## FAQ

**What is the difference between facet_grid and facet_wrap in ggplot2?**

`facet_grid()` arranges panels in a strict matrix where row and column positions match levels of two variables; empty combinations stay visible. `facet_wrap()` arranges panels in a 1D sequence wrapped to fit the page; empty combinations are dropped. Use grid when both axes carry meaning, wrap when only one does.

**How do you use free scales in facet_grid?**

Pass `scales = "free_y"`, `"free_x"`, or `"free"`. Inside `facet_grid()`, `"free_y"` frees the y axis per row (not per panel), and `"free_x"` frees the x axis per column. This preserves cross-column or cross-row comparison along the linked axis.

**How do I change labels in facet_grid?**

Set the `labeller` argument: `labeller = label_both` shows `var: value`, `labeller = label_wrap_gen(width = 15)` wraps long names. For full control, build a labeller with `as_labeller(c("4" = "4 cylinders", "8" = "8 cylinders"))` or recode the variable before plotting.

**How do I add row and column totals to facet_grid?**

Set `margins = TRUE` on `facet_grid()`. ggplot appends an "(all)" row, an "(all)" column, and a grand-total cell, each showing the data pooled along that dimension. Use this to verify that subgroup patterns reflect the overall pattern.

**Why are there empty panels in my facet_grid plot?**

`facet_grid()` keeps every `(row, column)` cell, even when no rows match. This is by design so the grid stays rectangular. To drop empty combinations, use `facet_wrap(~ row_var + col_var)` instead.

For the canonical reference, see the [ggplot2 facet_grid documentation](https://ggplot2.tidyverse.org/reference/facet_grid.html).
