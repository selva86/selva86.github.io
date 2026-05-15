---
title: "forcats fct_reorder2() in R: Order Factors for Legends"
slug: "forcats-fct_reorder2-in-R"
description: "Learn forcats fct_reorder2() in R to reorder factor levels so a line chart legend matches the lines. Syntax, last2 and first2 helpers, and worked examples."
keywords: "forcats fct_reorder2, fct_reorder2 function R, forcats fct_reorder2 examples, R fct_reorder2 legend order, reorder factor by line chart, fct_reorder2 vs fct_reorder, last2 first2 forcats"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_reorder2()|forcats fct_reorder2|forcats::fct_reorder2()|fct_reorder2|reorder factor for legend"
auto_link_case_sensitive: true
target_keyword: "forcats fct_reorder2"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_reorder2() in R: Order Factors for Legends

<p class="lead">The forcats <code>fct_reorder2()</code> function reorders factor levels by the y values at the largest x, so a line chart legend lists groups in the same order the lines appear at the right edge of the plot.</p>

[QUICK ANSWER]
aes(color = fct_reorder2(grp, x, y))      # match legend to line order
fct_reorder2(grp, x, y)                   # reorder by y at the last x
fct_reorder2(grp, x, y, .fun = first2)    # reorder by y at the first x
fct_reorder2(grp, x, y, .desc = FALSE)    # ascending instead of descending
fct_reorder2(grp, x, y, .fun = last2)     # default helper, stated explicitly
levels(fct_reorder2(grp, x, y))           # inspect the resulting order

[DECISION TREE: Is fct_reorder2() the right tool?]
- match a line chart legend to the lines: fct_reorder2(grp, x, y)
- reorder a bar chart or boxplot by value: fct_reorder(grp, value)
- set the level order by hand: fct_relevel(grp, "b", "a")
- order levels by how often they appear: fct_infreq(grp)
- reverse the current level order: fct_rev(grp)
- order levels by first appearance in data: fct_inorder(grp)

## What fct_reorder2() does in one sentence

**`fct_reorder2()` orders factor levels for two-dimensional plots.** You give it a factor and two numeric vectors, an x and a y. For each level it finds the y value sitting at the largest x value, then sorts the levels by those y values. The data stays untouched. Only the order of the levels changes.

This solves a specific annoyance. In a line chart where a factor sets the line color, ggplot2 builds the legend in factor level order, which is alphabetical by default. The lines themselves end up stacked by their y values on the right edge. When those two orders disagree, a reader's eye has to bounce between the legend and the lines to match them. `fct_reorder2()` aligns the legend with the lines so the chart reads itself.

## Syntax

**`fct_reorder2()` takes a factor plus an x and y pair.** The signature is compact, and most calls only need the first three arguments.

```r title="The fct_reorder2 signature"
fct_reorder2(.f, .x, .y, .fun = last2, ..., .desc = TRUE)
```

The arguments work as follows.

- `.f`: the factor whose levels you want to reorder.
- `.x`: a numeric vector, usually the variable on the plot's x axis.
- `.y`: a numeric vector, usually the variable on the y axis.
- `.fun`: the summary helper. The default `last2` reads y at the largest x. Pass `first2` to read y at the smallest x.
- `.desc`: sort descending. The default `TRUE` puts the highest line at the top of the legend.

The helpers `last2()` and `first2()` exist only to serve `fct_reorder2()`. `last2()` returns the value of y when the pair is sorted by x and you take the last row. `first2()` takes the first row instead.

## fct_reorder2() examples

**Start with a line chart that has a mismatched legend.** The built-in `ChickWeight` data records chick body weight over time across four diets. Summarising to a mean per diet per time point gives four clean lines.

```r title="Load packages and prepare data"
library(forcats)
library(dplyr)
library(ggplot2)

chick <- ChickWeight |>
  group_by(Diet, Time) |>
  summarise(weight = mean(weight), .groups = "drop")

head(chick)
#> # A tibble: 6 x 3
#>   Diet   Time weight
#>   <fct> <dbl>  <dbl>
#> 1 1         0   41.4
#> 2 1         2   47.2
#> 3 1         4   56.5
```

Plot the lines colored by `Diet` and the legend lists diets 1, 2, 3, 4, even though diet 3 finishes highest. Wrapping `Diet` in `fct_reorder2()` fixes the order.

```r title="Reorder the legend to match the lines"
ggplot(chick, aes(Time, weight,
                   color = fct_reorder2(Diet, Time, weight))) +
  geom_line(linewidth = 1) +
  labs(color = "Diet")
#> Legend now reads 3, 4, 2, 1 from top, matching the lines
```

You can confirm the new order without drawing anything by calling `levels()` on the reordered factor.

```r title="Inspect the reordered levels"
levels(fct_reorder2(chick$Diet, chick$Time, chick$weight))
#> [1] "3" "4" "2" "1"
```

To order by where the lines *start* rather than end, swap in the `first2` helper. This is useful when the left edge of the plot is the focus.

```r title="Order by the first x value with first2"
levels(fct_reorder2(chick$Diet, chick$Time, chick$weight,
                    .fun = first2))
#> levels are ordered by mean weight at Time 0
```

[TIP]
**Reorder inside `aes()`, not before.** Calling `fct_reorder2()` directly in the `color` aesthetic keeps the transformation next to the plot it serves. The original data frame stays clean, and the chart documents its own ordering logic.

## fct_reorder2() vs fct_reorder()

**The two functions cover different plot shapes.** `fct_reorder()` is for one-dimensional displays where the factor maps to a position, such as the axis of a bar chart or boxplot. `fct_reorder2()` is for two-dimensional displays where the factor maps to a non-position aesthetic like color.

| Function | Use case | Inputs |
|---|---|---|
| `fct_reorder()` | Bar chart, boxplot, dot plot | factor, one numeric variable |
| `fct_reorder2()` | Line chart legend, colored series | factor, x and y numeric variables |
| `fct_infreq()` | Order by category frequency | factor only |

The decision rule is simple. If the factor sits on an axis, reach for `fct_reorder()`. If the factor sets a color or linetype on a chart with both x and y, reach for `fct_reorder2()`.

[KEY INSIGHT]
**`fct_reorder2()` answers "which line is on top at the end?"** The legend should mirror the visual stacking of the lines. By sorting on the y value at the largest x, the function captures exactly the order a reader sees on the right edge of the plot.

## Common pitfalls

**Three mistakes account for most confused legends.** Each has a quick fix.

Using `fct_reorder()` on a line chart passes only one variable, so it sorts by the median across all time points rather than the endpoint. The legend then disagrees with the lines.

```r title="Wrong tool for a line chart"
# orders by median weight, not the endpoint
levels(fct_reorder(chick$Diet, chick$weight))
#> order reflects the median, so it can disagree with the lines
```

Forgetting that `.desc = TRUE` is the default surprises people who expect ascending order. The highest line goes to the *top* of the legend on purpose. Set `.desc = FALSE` to flip it.

Passing x and y in the wrong order silently produces a valid but wrong ordering. The second argument is always x, the third is always y. `fct_reorder2(Diet, Time, weight)` reads "order Diet by weight at the largest Time."

## Try it yourself

**Try it:** Reorder the `Diet` legend of a ChickWeight line chart so it matches the lines, then save the reordered factor's levels to `ex_levels`.

```r title="Your turn: reorder a legend"
# Try it: reorder Diet with fct_reorder2
ex_levels <- # your code here

ex_levels
#> Expected: "3" "4" "2" "1"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_levels <- levels(
  fct_reorder2(chick$Diet, chick$Time, chick$weight)
)
ex_levels
#> [1] "3" "4" "2" "1"
```

**Explanation:** `fct_reorder2()` sorts `Diet` by mean `weight` at the largest `Time`. Diet 3 ends highest, so it lands first, and `levels()` reads back the new order.

</details>

## Related forcats functions

**`fct_reorder2()` belongs to a family of ordering helpers.** Pick the one that matches how your plot uses the factor.

- `fct_reorder()`: order levels by a summary of one variable.
- `fct_infreq()`: order levels from most to least frequent.
- `fct_inorder()`: order levels by first appearance in the data.
- `fct_relevel()`: move specific levels to chosen positions.
- `fct_rev()`: reverse the existing level order.

See the [official forcats reference](https://forcats.tidyverse.org/reference/fct_reorder.html) for the full argument list and the `last2`/`first2` helper details.

## FAQ

**What is the difference between fct_reorder and fct_reorder2?**

`fct_reorder()` reorders a factor using a single numeric variable and is meant for one-dimensional plots like bar charts and boxplots. `fct_reorder2()` reorders using two variables, an x and a y, and is meant for two-dimensional plots where the factor controls color. Use `fct_reorder2()` whenever you need a line chart legend to match the order of the lines.

**What do last2 and first2 do in fct_reorder2?**

They are summary helpers that pick a single y value per level. `last2()` sorts the x and y pair by x and returns the y at the largest x, which is the default. `first2()` returns the y at the smallest x instead. You choose between them with the `.fun` argument depending on whether the end or the start of the plot matters.

**Why does my fct_reorder2 legend still not match the lines?**

Check that you passed x and y in that exact order, since the second argument is x and the third is y. Also confirm you used `fct_reorder2()` and not `fct_reorder()`, because the single-variable version sorts by a median across all points rather than the endpoint. The mismatch usually traces back to one of those two slips.

**Does fct_reorder2() change my underlying data?**

No. `fct_reorder2()` only changes the order of the factor's levels, which is metadata attached to the factor. The values themselves, their length, and every other column stay exactly the same. Reordering levels is purely a display concern and is safe to do inside `aes()` at plot time.
</content>
</invoke>
