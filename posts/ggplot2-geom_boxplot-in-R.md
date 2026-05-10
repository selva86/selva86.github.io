---
title: "ggplot2 geom_boxplot() in R: Box Plots With Examples"
slug: "ggplot2-geom_boxplot-in-R"
description: "Use ggplot2 geom_boxplot() to compare distributions across groups in R. Covers outliers, notches, jittered overlay, sorted boxes, and 6 worked examples."
keywords: "geom_boxplot, ggplot2 boxplot, box plot in R, R boxplot examples, ggplot2 notched boxplot, ggplot2 outliers, jittered boxplot"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_boxplot()|ggplot2 geom_boxplot|ggplot2 boxplot|box plot in ggplot2|notched boxplot"
auto_link_case_sensitive: true
target_keyword: "geom_boxplot"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_boxplot() in R: Box Plots With Examples

<p class="lead">The <code>geom_boxplot()</code> function in ggplot2 draws a box plot summarizing a distribution: median (center line), 25th and 75th percentiles (box edges), whiskers (1.5x IQR), and outliers (points). It is the most efficient way to compare many distributions at once.</p>

[QUICK ANSWER]
ggplot(df, aes(x = group, y = value)) + geom_boxplot()                # basic
ggplot(df, aes(x = group, y = value, fill = group)) + geom_boxplot()  # filled
ggplot(df, aes(x = group, y = value)) + geom_boxplot(notch = TRUE)    # with notches
ggplot(df, aes(x = group, y = value)) + geom_boxplot() + geom_jitter(width = 0.1)
ggplot(df, aes(x, y)) + geom_boxplot(outlier.color = "red")           # color outliers
ggplot(df, aes(x = reorder(group, value), y = value)) + geom_boxplot()# sorted
ggplot(df, aes(x = group, y = value)) + geom_boxplot() + coord_flip() # horizontal

[DECISION TREE: Is geom_boxplot() the right tool?]
- compare distributions across groups: geom_boxplot()
- show density shape (not just summary): geom_violin()
- combine box + raw points: geom_boxplot() + geom_jitter()
- show distribution of one variable: geom_histogram() or geom_density()
- show paired pre/post: geom_boxplot() + geom_line(group = subject)
- many points overlaid: geom_violin() or raincloud plot
- single number summary per group: geom_point() + stat_summary()

## What geom_boxplot() does in one sentence

**`geom_boxplot()` draws a five-number summary per group: median, 25th and 75th percentiles, plus whiskers and outliers.** The box represents the middle 50% of values; the line inside is the median; whiskers extend to 1.5 times the interquartile range; points beyond are outliers.

Box plots are the most data-dense way to compare many distributions in one chart. They reveal central tendency, spread, skewness, and outliers without asking the reader to interpret bin choices.

## Syntax

**`geom_boxplot()` requires `aes(y)`. With grouping, also map `x`.** Without an x mapping, all values go into one box.

```r title="Load ggplot2 and inspect mpg"
library(ggplot2)

table(mpg$class)
#>   2seater    compact    midsize    minivan     pickup subcompact        suv
#>         5         47         41         11         33         35         62
```

The full signature:

```
geom_boxplot(mapping = NULL, data = NULL, stat = "boxplot", position = "dodge2",
             ..., outlier.colour = NULL, outlier.color = NULL, outlier.fill = NULL,
             outlier.shape = 19, outlier.size = 1.5, outlier.stroke = 0.5,
             outlier.alpha = NULL, notch = FALSE, notchwidth = 0.5, varwidth = FALSE,
             na.rm = FALSE, orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**Box widths are uniform by default; use `varwidth = TRUE` for proportional widths.** With `varwidth = TRUE`, each box's width is proportional to the square root of the group's sample size. Smaller groups get narrower boxes, conveying group size visually alongside distribution.

## Six common patterns

### 1. Basic boxplot per group

```r title="Highway mpg by class"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot()
```

The simplest case: one box per `class`. Median, IQR, whiskers, and outliers all visible.

### 2. Filled boxes with color

```r title="Color boxes by class"
ggplot(mpg, aes(x = class, y = hwy, fill = class)) +
  geom_boxplot() +
  guides(fill = "none")  # hide redundant legend
```

`fill = class` colors each box. `guides(fill = "none")` removes the legend (redundant with the x axis).

### 3. Notched box plot

```r title="Notches show approximate 95% CI for median"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot(notch = TRUE)
```

`notch = TRUE` adds a "notch" around the median. Non-overlapping notches between groups suggest medians differ significantly. Notches are approximate; for formal tests, use a Wilcoxon test.

### 4. Box plot with jittered points overlay

```r title="Show every observation"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot(outlier.shape = NA) +
  geom_jitter(width = 0.2, alpha = 0.4)
```

`geom_jitter` overlays raw points; `outlier.shape = NA` hides boxplot outliers (avoiding double-display since jitter shows them too). Useful when group sizes are small.

### 5. Highlight outliers in red

```r title="Outliers in red"
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot(outlier.color = "red", outlier.size = 2)
```

`outlier.color` and `outlier.size` style the outlier points without affecting the box.

### 6. Sorted box plot (by median)

```r title="Boxes ordered by median hwy"
ggplot(mpg, aes(x = reorder(class, hwy, FUN = median), y = hwy)) +
  geom_boxplot() +
  labs(x = "class")
```

`reorder(class, hwy, FUN = median)` orders factor levels by descending median hwy. Combined with `coord_flip()`, this produces a clean ranked horizontal box plot.

[KEY INSIGHT]
**Box plots HIDE the shape of the distribution within each group.** A single peak and a bimodal distribution can produce identical box plots. For shape-sensitive analysis, prefer `geom_violin()` or overlay raw data with `geom_jitter()`. Box plots are best for ranking medians and spotting outliers across many groups.

## geom_boxplot() vs base R boxplot()

**Both produce nearly identical visualizations. ggplot2's version integrates with grouping, faceting, and theming.**

| Task | ggplot2 | Base R |
|---|---|---|
| Per group | `aes(x = grp, y = val) + geom_boxplot()` | `boxplot(val ~ grp, data = df)` |
| With notches | `geom_boxplot(notch = TRUE)` | `boxplot(notch = TRUE)` |
| Color by group | `aes(fill = grp)` | `boxplot(col = palette)` |
| Sort by median | `reorder(grp, val, median)` | (manual reorder before plot) |
| Outliers off | `outlier.shape = NA` | `outline = FALSE` |
| Overlay points | `+ geom_jitter()` | `stripchart(add = TRUE)` |

When to use which:

- Use ggplot2 for grouped, faceted, sorted, or themed box plots.
- Use base `boxplot()` for one-line interactive use.

## Common pitfalls

**Pitfall 1: outliers shown twice when adding jitter.** `geom_boxplot() + geom_jitter()` plots outliers as part of the boxplot AND as jitter points. Set `outlier.shape = NA` on the boxplot to hide its outliers.

**Pitfall 2: x is continuous but you want grouped boxes.** ggplot tries to draw one box per unique x value. If x is numeric and represents groups, convert to factor: `aes(x = factor(group_num), y = value)`.

[WARNING]
**Tukey whiskers (1.5x IQR) are a CONVENTION, not a statistical truth.** A point outside the whisker is a "potential outlier" by Tukey's rule, not necessarily a true outlier. For real outlier detection, use methods appropriate to the data's distribution.

**Pitfall 3: comparing very different group sizes silently.** A box from 5 observations carries less reliable info than a box from 500. Use `varwidth = TRUE` to encode group size as box width; or print group counts (`stat_summary(geom = "text", fun.data = ...)`).

## Try it yourself

**Try it:** Make a box plot of `mpg$hwy` per `class`, with classes sorted by median hwy, horizontal orientation, and steelblue fill. Save to `ex_plot`.

```r title="Your turn: sorted horizontal box plot"
# Try it: reorder + flip + fill
ex_plot <- ggplot(mpg, aes(x = # your code here,
                            y = hwy)) +
  geom_boxplot(fill = "steelblue") +
  coord_flip()

print(ex_plot)
#> Expected: horizontal box plot, highest median at top
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mpg, aes(x = reorder(class, hwy, FUN = median), y = hwy)) +
  geom_boxplot(fill = "steelblue") +
  coord_flip() +
  labs(x = "Class", y = "Highway MPG")

print(ex_plot)
```

**Explanation:** `reorder(class, hwy, FUN = median)` orders factor levels by ascending median hwy. After `coord_flip()`, the highest-median class is at the TOP of the chart (visually). The fill applies to all boxes.

</details>

## Related ggplot2 functions

After mastering `geom_boxplot()`, look at:

- `geom_violin()`: shows distribution shape, not just summary
- `geom_jitter()`: raw points with random horizontal offset
- `geom_dotplot()`: stacked dots per observation (small N only)
- `stat_summary()`: add custom summary points (mean, SE, etc.) on top
- `geom_errorbar()`: alternative summary display
- `coord_flip()`: horizontal box plots

For "raincloud" plots (half-violin + box + jitter), see the `ggdist` package which extends ggplot2 with publication-quality distribution displays.

## FAQ

**How do I add jittered points to a ggplot2 boxplot?**

Combine: `geom_boxplot(outlier.shape = NA) + geom_jitter(width = 0.2, alpha = 0.5)`. Hide boxplot outliers (otherwise they show twice). `width = 0.2` keeps jitter inside the box footprint.

**What do the whiskers mean in a ggplot2 boxplot?**

Whiskers extend to the most extreme value within 1.5 times the interquartile range (IQR) from the 25th and 75th percentile boxes. Points beyond are plotted individually as outliers. This is Tukey's convention.

**How do I sort boxes by median in ggplot2?**

Wrap the x mapping in `reorder()`: `aes(x = reorder(group, value, FUN = median), y = value)`. The `FUN` argument controls the sort statistic (median, mean, max, etc.). Default sort is ascending.

**How do I make a horizontal boxplot in ggplot2?**

Add `coord_flip()` after the boxplot: `ggplot() + geom_boxplot() + coord_flip()`. Or in newer ggplot2, swap x and y in `aes()`: `aes(x = value, y = group)` produces horizontal boxes natively.

**Should I use boxplot or violin plot in ggplot2?**

Boxplot is best for comparing MANY groups (5+) where the summary is the focus. Violin plot is better when the SHAPE of each distribution matters (multimodality, skewness). For best of both, overlay: `geom_violin() + geom_boxplot(width = 0.1)`.
