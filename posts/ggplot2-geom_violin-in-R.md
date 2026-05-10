---
title: "ggplot2 geom_violin() in R: Violin Plots With Examples"
slug: "ggplot2-geom_violin-in-R"
description: "Use ggplot2 geom_violin() to show distribution shape across groups in R. Covers boxplot overlay, scale, trim flag, fill by group, and 6 worked examples."
keywords: "geom_violin, ggplot2 violin plot, violin plot in R, R violin plot examples, ggplot2 violin scale, half violin, violin boxplot overlay"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_violin()|ggplot2 geom_violin|ggplot2 violin plot|violin plot in ggplot2|violin plot R"
auto_link_case_sensitive: true
target_keyword: "geom_violin"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_violin() in R: Violin Plots With Examples

<p class="lead">The <code>geom_violin()</code> function in ggplot2 shows the kernel density of a distribution mirrored on both sides of a vertical axis, producing a violin shape per group. It reveals shape (multimodality, skew) that box plots hide.</p>

[QUICK ANSWER]
ggplot(df, aes(x = group, y = value)) + geom_violin()                       # basic
ggplot(df, aes(x = group, y = value, fill = group)) + geom_violin()         # filled
ggplot(df, aes(x, y)) + geom_violin(scale = "count")                        # area = sample size
ggplot(df, aes(x, y)) + geom_violin() + geom_boxplot(width = 0.1)           # combo
ggplot(df, aes(x, y)) + geom_violin(trim = FALSE)                           # full tails
ggplot(df, aes(x, y)) + geom_violin(adjust = 0.5)                           # tighter density
ggplot(df, aes(x, y)) + geom_violin() + geom_jitter(width = 0.05, alpha=0.4)# raw + violin

[DECISION TREE: Is geom_violin() the right tool?]
- show distribution shape across groups: geom_violin()
- five-number summary only: geom_boxplot()
- best of both: geom_violin() + geom_boxplot(width = 0.1)
- show every observation: geom_jitter() or geom_dotplot()
- one continuous variable: geom_density() or geom_histogram()
- raincloud plot (half violin + box + dots): ggdist::stat_halfeye()
- compare just two distributions: geom_density(aes(color = group))

## What geom_violin() does in one sentence

**`geom_violin()` is a mirrored kernel density plot per group.** Each "violin" shape shows the distribution of values: wider at densely populated y values, narrower at sparse ones. Symmetric around the center axis.

Unlike `geom_boxplot()` (which shows a five-number summary), violin plots reveal SHAPE: bimodality, heavy tails, skew. Use violin when shape matters; use boxplot when you have many groups and only need quick comparison.

## Syntax

**`geom_violin()` requires `aes(x, y)` for grouped violins.** Each unique x produces one violin built from the y values in that group.

```r title="Load ggplot2 and inspect mpg"
library(ggplot2)

table(mpg$class)
#>   2seater    compact    midsize    minivan     pickup subcompact        suv
#>         5         47         41         11         33         35         62
```

The full signature:

```
geom_violin(mapping = NULL, data = NULL, stat = "ydensity", position = "dodge",
            ..., draw_quantiles = NULL, trim = TRUE, scale = "area",
            na.rm = FALSE, orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**The `scale` argument controls how violin widths relate to each other.** Default `"area"` makes all violins have equal AREA (each shape sums to the same density). `"count"` makes them proportional to sample size (groups with more data get wider violins). `"width"` makes them all the same maximum width. Choose `scale = "count"` when group sizes differ a lot.

## Six common patterns

### 1. Basic violin per group

```r title="Highway mpg distribution by class"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_violin()
```

One violin per `class`. Width at each y level shows how many observations cluster there.

### 2. Filled violins

```r title="Color violins by class"
ggplot(mpg, aes(x = class, y = hwy, fill = class)) +
  geom_violin() +
  guides(fill = "none")
```

`fill = class` colors each violin. Hide the redundant legend with `guides(fill = "none")`.

### 3. Violin with embedded boxplot

```r title="Best of both worlds"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_violin(fill = "lightgray") +
  geom_boxplot(width = 0.15, fill = "white", outlier.shape = NA)
```

The thin boxplot inside each violin shows median and IQR; the violin shows shape. `outlier.shape = NA` prevents double-display.

### 4. Scale by sample size

```r title="Violin width proportional to N"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_violin(scale = "count")
```

`scale = "count"` makes the area of each violin proportional to the number of observations in that group. Smaller groups appear visibly thinner. Useful when sample sizes vary a lot.

### 5. Show full tails (trim = FALSE)

```r title="Extend violins to full data range"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_violin(trim = FALSE, fill = "steelblue")
```

By default `trim = TRUE` cuts violins at the extreme observed values. `trim = FALSE` extends them through the full kernel density range, showing what the smoother predicts beyond the data.

### 6. Violin + jittered raw points

```r title="Show every observation overlaid on violin"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_violin(fill = "lightgray", alpha = 0.5) +
  geom_jitter(width = 0.08, alpha = 0.4, color = "darkblue")
```

Combination of shape (violin) and individual values (jitter). Best when you want to verify the shape against actual points.

[KEY INSIGHT]
**Violin plots can MISLEAD with small samples.** Kernel density needs enough observations to estimate shape reliably. With < 10 observations per group, the violin is mostly the smoother's guess, not real data. For small N, prefer `geom_jitter()` or `geom_dotplot()` to show actual points.

## geom_violin() vs geom_boxplot()

**Both compare distributions across groups. Violin shows SHAPE; boxplot shows SUMMARY.**

| Feature | geom_violin | geom_boxplot |
|---|---|---|
| Shows distribution shape | Yes | No (just summary) |
| Reveals multimodality | Yes | No |
| Compact for many groups | Wider per group | More compact |
| Effective with small N | No (needs 20+) | Yes |
| Identifies outliers | Implicit (tail width) | Explicit (outlier points) |
| Shows median, IQR | Add `draw_quantiles = c(0.25, 0.5, 0.75)` | Built in |
| Best for | 4 to 8 groups, shape matters | Many groups, ranking medians |

When to use which:

- Use violin when group SHAPES matter (multimodality, skew).
- Use boxplot when SUMMARY suffices and group count is large.
- For both, overlay: `geom_violin() + geom_boxplot(width = 0.1)`.

## Common pitfalls

**Pitfall 1: violin with small N is misleading.** With < 10 obs per group, the kernel density is mostly noise. Use `geom_dotplot()` or `geom_jitter()` instead for small samples.

**Pitfall 2: forgetting that violin is symmetric.** Both halves of the violin show the same density. The width does NOT mean "spread to the right of the line"; it means "density of values at this y level".

[WARNING]
**Default `scale = "area"` can give visually misleading widths.** All violins normalize to the SAME area, so a group with 5 observations and a group with 500 obs look equally wide. Set `scale = "count"` to encode sample size in width.

**Pitfall 3: kernel bandwidth choice changes appearance.** ggplot's default `adjust = 1` uses a bandwidth that smooths over real bumps in some data. Try `adjust = 0.5` for tighter (more detail) or `adjust = 2` for looser (more smoothing) density.

## Try it yourself

**Try it:** Make a violin plot of `mpg$hwy` per `class`, overlay a thin white boxplot, and use `scale = "count"` to show group sizes. Save to `ex_plot`.

```r title="Your turn: violin + boxplot + count scale"
# Try it: combine + scale by N
ex_plot <- ggplot(mpg, aes(x = class, y = hwy)) +
  # your code here

print(ex_plot)
#> Expected: violins of varying widths, with thin white boxes inside
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mpg, aes(x = class, y = hwy)) +
  geom_violin(fill = "lightgray", scale = "count") +
  geom_boxplot(width = 0.1, fill = "white", outlier.shape = NA)

print(ex_plot)
```

**Explanation:** `scale = "count"` makes each violin's width proportional to its sample size. The `geom_boxplot(width = 0.1)` adds a thin embedded boxplot showing the median and IQR. Together they show shape AND summary statistics.

</details>

## Related ggplot2 functions

After mastering `geom_violin()`, look at:

- `geom_boxplot()`: simpler summary; pair with violin
- `geom_density()`: density curve for a single variable (no grouping)
- `geom_dotplot()`: stacked dots for small samples
- `geom_jitter()`: raw points overlay
- `ggdist::stat_halfeye()`: half-violin / raincloud-style displays
- `ggridges::geom_density_ridges()`: ridge plots (rotated stacked densities)

For raincloud plots (half-violin + box + jitter combination), the `ggdist` package extends ggplot2 with publication-quality distribution displays.

## FAQ

**What is the difference between violin and box plot in ggplot2?**

Violin plot shows the SHAPE of the distribution (kernel density). Box plot shows a five-number SUMMARY (median, IQR, whiskers). Violin reveals multimodality and skew that box plots hide; box plot is more compact when comparing many groups.

**How do I add a boxplot inside a violin plot in ggplot2?**

Layer them: `geom_violin() + geom_boxplot(width = 0.1, outlier.shape = NA)`. The thin boxplot shows median and IQR; the violin shows shape. Hide outliers on the boxplot to avoid double-display with the violin tails.

**What does the scale argument do in geom_violin?**

`scale` controls how violin widths relate. `"area"` (default) gives all violins equal area. `"count"` makes width proportional to sample size. `"width"` gives all violins the same maximum width. Use `"count"` when group sizes differ.

**Why does my violin plot look weird with small N?**

Kernel density needs many observations to estimate shape. With fewer than ~10 observations per group, the violin is mostly an artifact of smoothing. Use `geom_jitter()` or `geom_dotplot()` for small samples; reserve violin for groups with 20+ obs each.

**How do I make a horizontal violin plot in ggplot2?**

Add `coord_flip()`: `ggplot() + geom_violin() + coord_flip()`. Or in newer ggplot2, swap x and y: `aes(x = value, y = group)`. Both produce horizontal violins.
