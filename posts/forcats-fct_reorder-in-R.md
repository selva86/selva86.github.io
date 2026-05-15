---
title: "forcats fct_reorder() in R: Sort Factors by a Variable"
slug: "forcats-fct_reorder-in-R"
description: "Learn forcats fct_reorder() in R to sort factor levels by another variable. Reorder boxplots and bar charts by median or mean with runnable code examples."
keywords: "forcats fct_reorder, fct_reorder function R, forcats fct_reorder examples, reorder factor levels in R, fct_reorder ggplot, order factor by value R, fct_reorder by mean"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_reorder()|forcats fct_reorder|forcats::fct_reorder()|reorder factor levels|order factor levels"
auto_link_case_sensitive: true
target_keyword: "forcats fct_reorder"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_reorder() in R: Sort Factors by a Variable

<p class="lead">The forcats <code>fct_reorder()</code> function reorders the levels of a factor by a summary of another variable, so plots display groups in a meaningful order instead of alphabetically.</p>

[QUICK ANSWER]
fct_reorder(f, x)                      # order levels by median of x
fct_reorder(f, x, .fun = mean)         # order by the mean instead
fct_reorder(f, x, .desc = TRUE)        # high-to-low order
fct_reorder(f, x, na.rm = TRUE)        # drop NA before summarising
fct_reorder2(f, x, y)                  # order for line-chart legends
ggplot(df, aes(fct_reorder(g, v), v))  # sorted bars in one line

[DECISION TREE: Is fct_reorder() the right tool?]
- order levels by another variable: fct_reorder(f, x)
- order a line chart legend: fct_reorder2(f, x, y)
- order by appearance in the data: fct_inorder(f)
- order by how often a level occurs: fct_infreq(f)
- pin one specific level first: fct_relevel(f, "ref")
- just reverse the current order: fct_rev(f)

## What fct_reorder() does in one sentence

**`fct_reorder()` sorts factor levels by a number.** You give it a factor and a numeric vector of the same length. It computes one summary value per level (the median by default), then reorders the levels from the smallest summary to the largest. The underlying data is untouched, only the level order changes.

This matters because factor level order controls plotting order. A bar chart, a boxplot, or a legend draws groups in level order, and the default level order is alphabetical. Alphabetical order is rarely the order a reader wants. `fct_reorder()` replaces it with a value-based order so the tallest bar, or the group with the highest median, lands where the eye expects it.

## Syntax

**`fct_reorder()` takes a factor, a numeric vector, and an optional summary function.** Every other argument has a sensible default, so the two-argument form covers most real cases.

```r title="Load forcats and inspect the data"
library(forcats)
library(ggplot2)

# InsectSprays: insect counts under 6 spray treatments
str(InsectSprays)
#> 'data.frame':	72 obs. of  2 variables:
#>  $ count: num  10 7 20 14 14 12 10 23 17 20 ...
#>  $ spray: Factor w/ 6 levels "A","B","C","D",..: 1 1 1 1 1 1 1 1 1 1 ...

levels(InsectSprays$spray)
#> [1] "A" "B" "C" "D" "E" "F"
```

The full signature is:

```
fct_reorder(.f, .x, .fun = median, ..., .na_rm = NULL, .default = Inf, .desc = FALSE)
```

- `.f` is the factor (a character vector also works, it is coerced to a factor).
- `.x` is a numeric vector the same length as `.f`. Levels are sorted by a summary of this.
- `.fun` is the summary applied to `.x` within each level. The default is `median`.
- `...` passes extra arguments straight to `.fun`, for example `na.rm = TRUE`.
- `.na_rm` controls whether levels with an `NA` summary are dropped.
- `.default` is the placeholder summary for levels that produce `NA`; `Inf` sends them last.
- `.desc`, when `TRUE`, sorts from largest to smallest instead.

## fct_reorder() examples

### 1. Reorder factor levels by median

**The two-argument call is the workhorse.** Pass the factor and a numeric vector, and the levels come back sorted by group median.

```r title="Reorder spray levels by median count"
sprays_by_median <- fct_reorder(InsectSprays$spray, InsectSprays$count)
levels(sprays_by_median)
#> [1] "C" "E" "D" "A" "F" "B"
```

Spray C has the lowest median insect count, so it becomes the first level. Spray B has the highest and moves last. The original `count` and `spray` columns are unchanged.

### 2. Order a ggplot boxplot

**The most common use of `fct_reorder()` is inside `aes()`.** Calling it directly on the mapping reorders the plot without creating an intermediate object.

```r title="Order a boxplot by group median"
ggplot(InsectSprays, aes(x = fct_reorder(spray, count), y = count)) +
  geom_boxplot() +
  labs(x = "Spray", y = "Insect count")
#> Boxplots draw left to right in median order: C, E, D, A, F, B
```

The boxes now climb steadily from low median to high median, which reads far better than the alphabetical A-to-F default.

[TIP]
**Reorder inside `aes()`, not before.** Wrapping `fct_reorder()` directly in the aesthetic keeps your data frame clean and makes the ordering rule visible right where the chart is built. You rarely need a separate reordered column.

### 3. Reverse the order with .desc

**Set `.desc = TRUE` to sort from high to low.** This is handy when you want the largest group first, such as a ranked bar chart.

```r title="Sort levels from high to low"
sprays_desc <- fct_reorder(InsectSprays$spray, InsectSprays$count,
                           .desc = TRUE)
levels(sprays_desc)
#> [1] "B" "F" "A" "D" "E" "C"
```

This is the exact reverse of the median order from example 1. You could also wrap the result in `fct_rev()`, but `.desc` is clearer.

### 4. Order by a custom summary function

**Pass `.fun` to summarise by something other than the median.** The mean, the maximum, or any function that turns a numeric vector into one number all work.

```r title="Order by mean instead of median"
sprays_by_mean <- fct_reorder(InsectSprays$spray, InsectSprays$count,
                              .fun = mean)
levels(sprays_by_mean)
#> [1] "C" "E" "D" "A" "B" "F"
```

Notice that B and F swap places compared with the median order. Spray F has a higher mean but a lower median because a few large counts pull its average up.

[KEY INSIGHT]
**The summary function changes the answer.** Median and mean can produce different orders when a group is skewed. Pick `.fun` to match the story your chart tells: median for a typical value, mean for a total-volume comparison.

## fct_reorder() vs other forcats ordering functions

**`fct_reorder()` is one of several level-ordering tools in forcats.** Each sorts by a different rule, so the choice depends on what your chart should communicate.

| Function | Orders levels by | Typical use |
|---|---|---|
| `fct_reorder()` | a summary of another variable | bar and box plots |
| `fct_reorder2()` | a second variable at the last data point | line chart legends |
| `fct_infreq()` | how often each level appears | frequency-sorted bars |
| `fct_inorder()` | first appearance in the data | preserving data order |
| `fct_relevel()` | a position you specify by hand | pinning a reference level |
| `reorder()` (base R) | a summary of another variable | base R equivalent |

Use `fct_reorder()` when a numeric variable defines the order. Use `fct_infreq()` when count itself is the order. Use `fct_relevel()` when one level is a baseline that must come first regardless of its value.

[NOTE]
**Coming from Python pandas?** There is no one-line equivalent. You would compute a group summary with `groupby`, sort it, then pass the sorted index to `pd.Categorical(..., categories=order, ordered=True)`. `fct_reorder()` collapses all three steps into one call.

## Common pitfalls

**Pitfall 1: expecting the rows to move.** `fct_reorder()` changes level order, not row order. The data frame stays in its original sequence.

```r title="fct_reorder changes levels, not row order"
df <- data.frame(g = c("b", "a", "b"), v = c(1, 5, 3))
df$g <- fct_reorder(df$g, df$v)
levels(df$g)     # level order is now value-based
#> [1] "b" "a"
df               # rows stay in their original positions
#>   g v
#> 1 b 1
#> 2 a 5
#> 3 b 3
```

If you need the rows themselves sorted, use `dplyr::arrange()` after reordering the factor.

**Pitfall 2: missing values poison the summary.** The default `median` returns `NA` for any group that contains an `NA`, and that level gets pushed to the end.

```r title="Missing values need na.rm"
grp <- factor(c("hi", "hi", "lo", "lo"))
val <- c(5, NA, 8, 12)

# Default: the NA makes the "hi" summary NA, sending it last
levels(fct_reorder(grp, val))
#> [1] "lo" "hi"

# Pass na.rm through ... so the summary ignores NA
levels(fct_reorder(grp, val, na.rm = TRUE))
#> [1] "hi" "lo"
```

**Pitfall 3: using `fct_reorder()` for a line chart legend.** When several lines share a plot, you want the legend ordered by where the lines end, not by a single summary. That is the job of `fct_reorder2()`, which sorts by a second variable at the largest value of the first.

[WARNING]
**`fct_reorder()` and `fct_reorder2()` are not interchangeable.** `fct_reorder()` collapses each group to one number, which suits bars and boxes. A multi-line chart needs `fct_reorder2()` so the legend matches the order the lines appear at the right edge of the plot.

## Try it yourself

**Try it:** Reorder the `spray` factor in InsectSprays by the mean count, highest first. Save the result to `ex_sprays`.

```r title="Your turn: reorder by mean"
# Try it: order spray levels by descending mean count
ex_sprays <- # your code here

levels(ex_sprays)
#> Expected: "F" "B" "A" "D" "E" "C"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sprays <- fct_reorder(InsectSprays$spray, InsectSprays$count,
                         .fun = mean, .desc = TRUE)
levels(ex_sprays)
#> [1] "F" "B" "A" "D" "E" "C"
```

**Explanation:** Passing `.fun = mean` summarises each group by its average, and `.desc = TRUE` flips the result so the largest mean comes first.

</details>

## Related forcats functions

After `fct_reorder()`, these forcats functions round out factor handling:

- `fct_reorder2()`: order levels for line chart legends by a second variable.
- `fct_relevel()`: move specific levels to the front by hand.
- `fct_infreq()`: order levels by frequency, most common first.
- `fct_inorder()`: order levels by first appearance in the data.
- `fct_rev()`: reverse the current level order.

The base R function `reorder()` does the same job as `fct_reorder()` and needs no extra package. Most users still prefer the forcats version because its arguments are explicit and it composes cleanly with the rest of the `fct_` family. See the [forcats reference](https://forcats.tidyverse.org/reference/fct_reorder.html) for the full argument list.

## FAQ

**What does fct_reorder do in R?**

`fct_reorder()` reorders the levels of a factor based on a summary of a second variable. For each level, it computes one number (the median by default), then sorts the levels from smallest to largest. It is mainly used so ggplot2 charts display groups in value order rather than alphabetical order. The data values themselves are not changed, only the order in which the factor stores its levels.

**What is the difference between fct_reorder and fct_relevel?**

`fct_reorder()` sorts levels automatically by a numeric variable, so you never name the levels yourself. `fct_relevel()` is manual: you list the levels in the order you want, or move a specific level to the front. Use `fct_reorder()` when data defines the order, and `fct_relevel()` when you need a fixed reference level first, such as a control group in a model.

**How do I reorder a ggplot bar chart by value?**

Wrap the categorical variable in `fct_reorder()` inside `aes()`. For a bar chart of a value `v` by group `g`, write `aes(x = fct_reorder(g, v), y = v)`. The bars then climb from the smallest value to the largest. Add `.desc = TRUE` inside `fct_reorder()` if you want the tallest bar on the left instead.

**Can fct_reorder handle missing values?**

Yes, but you must ask for it. The default summary function `median` returns `NA` for any group that contains an `NA`, and that level is sent to the end. Pass `na.rm = TRUE` through the `...` argument, as in `fct_reorder(f, x, na.rm = TRUE)`, so the summary ignores missing values and the level is ranked by its real data.
</content>
</invoke>
