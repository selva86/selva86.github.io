---
title: "forcats fct_rev() in R: Reverse Factor Level Order"
slug: "forcats-fct_rev-in-R"
description: "Learn forcats fct_rev() in R to reverse factor level order in one call. See examples, a ggplot legend fix, common pitfalls, and the fct_relevel difference."
keywords: "forcats fct_rev, fct_rev function R, forcats fct_rev examples, reverse factor levels R, fct_rev ggplot legend, R reverse factor order"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_rev()|forcats fct_rev|forcats::fct_rev()|reverse factor levels|fct_rev|reverse factor order"
auto_link_case_sensitive: true
target_keyword: "forcats fct_rev"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_rev() in R: Reverse Factor Level Order

<p class="lead">The <code>fct_rev()</code> function in forcats reverses the order of a factor's levels in a single call. It flips the level sequence end to end without changing any of the underlying data values.</p>

[QUICK ANSWER]
fct_rev(f)                          # reverse the level order
fct_rev(factor(c("a", "b", "c")))   # works on a bare factor
levels(fct_rev(f))                  # inspect the reversed order
fct_rev(df$grp)                     # reverse a data frame column
fct_rev(fct_infreq(f))              # least-frequent level first
fct_rev(fct_reorder(f, x))          # reverse a data-driven order
fct_rev(fct_rev(f))                 # back to the original order

[DECISION TREE: Is fct_rev() the right tool?]
- reverse the current level order: fct_rev(f)
- set the order by hand: fct_relevel(f, "a", "b")
- order levels by another variable: fct_reorder(f, x)
- order levels by frequency: fct_infreq(f)
- order by first appearance in data: fct_inorder(f)
- rotate levels without reversing: fct_shift(f, n)

## What fct_rev() does

**`fct_rev()` reverses the order of a factor's levels and nothing else.** A factor stores its categories as an ordered set of levels. By default R sorts those levels alphabetically, and that order controls how the categories appear on chart axes, in legends, and in any sorted output. `fct_rev()` takes the current order, whatever it is, and turns it back to front.

The function is deliberately small. It has no arguments to configure and no statistic to compute. If the levels are `Low`, `Medium`, `High` they become `High`, `Medium`, `Low`, and the data values stay exactly the same.

Level order is rarely cosmetic. It decides which category sits at the top of a bar chart, which row leads a frequency table, and which level becomes the baseline in a regression. Alphabetical order, R's default, almost never matches the order a reader expects, and `fct_rev()` is the shortest way to flip it.

[KEY INSIGHT]
**`fct_rev()` reverses metadata, not data.** A factor is a pair: integer codes for each observation and a lookup table of level labels. `fct_rev()` only reverses the lookup table and remaps the codes to match. No observation is added, dropped, relabelled, or reordered in the vector itself.

## fct_rev() syntax

**`fct_rev()` takes a single argument: the factor to reverse.** The full signature is as short as a forcats function gets:

```
fct_rev(f)
```

- `f` is a factor. A character vector is accepted and coerced to a factor first.

There is no `after` and no `...`. Because the result depends entirely on the input order, confirm a factor's starting levels before reversing them. The code below builds a small factor and prints its levels.

```r title="Load forcats and build a factor"
library(forcats)

ratings <- factor(c("Low", "High", "Medium", "High", "Low"))
levels(ratings)
#> [1] "High"   "Low"    "Medium"
```

The levels came back alphabetically: `High`, `Low`, `Medium`. That is the order `fct_rev()` will flip in the examples below.

## fct_rev() examples

**Each example reverses level order on a factor, then shows the result.** `fct_rev()` always returns a new factor, so assign the result to a name to keep it.

### 1. Reverse a factor's level order

Pass the factor straight to `fct_rev()`. The level vector is returned end to front.

```r title="Reverse a factor level order"
ratings_rev <- fct_rev(ratings)
levels(ratings_rev)
#> [1] "Medium" "Low"    "High"
```

The values stored in `ratings` are untouched. Only the level lookup table changed, and that table is what a plot or a model reads when it sorts the categories.

### 2. Reverse a factor column in a data frame

The most common real use is flipping a column so a chart reads correctly. Assign the reversed factor back to the same column.

```r title="Reverse a data frame column"
df <- data.frame(size = factor(c("S", "M", "L", "M", "S")))
levels(df$size)
#> [1] "L" "M" "S"

df$size <- fct_rev(df$size)
levels(df$size)
#> [1] "S" "M" "L"
```

[TIP]
**Reach for `fct_rev()` to fix upside-down horizontal bar charts.** When you use `coord_flip()` in ggplot2, the first level is drawn at the bottom of the axis. Wrapping the factor in `fct_rev()` puts the first level back on top, so the chart reads in the order your reader expects.

### 3. Reverse a data-driven order

`fct_rev()` composes cleanly with the other forcats ordering functions. Order by frequency first, then reverse to put the least common level in front.

```r title="Reverse a frequency-based order"
grades <- factor(c("A", "B", "A", "C", "A", "B"))
levels(fct_infreq(grades))
#> [1] "A" "B" "C"

levels(fct_rev(fct_infreq(grades)))
#> [1] "C" "B" "A"
```

`fct_infreq()` ranks levels from most to least common. Wrapping it in `fct_rev()` flips that to least-common-first, a useful order when rare categories should draw the eye.

### 4. fct_rev() is its own inverse

Applying `fct_rev()` twice returns the original level order, so the call is safe to toggle.

```r title="Reverse twice to restore order"
identical(levels(fct_rev(fct_rev(ratings))), levels(ratings))
#> [1] TRUE
```

## Reverse order in a ggplot2 chart

**The most frequent reason to call `fct_rev()` is a chart that reads in the wrong direction.** ggplot2 places the first factor level at the origin of an axis. In a horizontal bar chart built with `coord_flip()`, that first level lands at the bottom, so an alphabetical or count-sorted factor reads upside down.

Wrapping the factor in `fct_rev()` fixes it without touching the data. The same trick reorders a legend: mapping `fill = fct_rev(group)` flips the legend keys to match the segments of a stacked bar.

```r title="Reverse a factor for a flipped bar chart"
counts <- factor(rep(c("Cat", "Dog", "Fish"), times = c(3, 5, 2)))
ordered <- fct_rev(fct_infreq(counts))
levels(ordered)
#> [1] "Fish" "Cat"  "Dog"
```

With the levels reversed, the most common category is drawn last, placing it at the top of a `coord_flip()` chart. The data is unchanged, so counts stay the same.

## fct_rev() vs other forcats ordering functions

**`fct_rev()` only flips the existing order; the others compute a new one.** Reach for `fct_rev()` when the order you want is the mirror image of what you have.

| Function | Sets level order by | Use when |
|---|---|---|
| `fct_rev()` | reversing the current order | you only need to flip the existing order |
| `fct_relevel()` | a manual specification | you know the exact order you want |
| `fct_reorder()` | another numeric variable | order should track a summary value |
| `fct_infreq()` | frequency, most common first | the popular category should lead |
| `fct_inorder()` | order of first appearance | data already arrives in a meaningful sequence |

The decision rule is short: if you want the opposite of the current order, use `fct_rev()`; if you want a specific new order, use one of the others. A common pattern combines the two: set the order with `fct_reorder()`, then flip it once with `fct_rev()`.

## Common pitfalls

**Pitfall 1: expecting `fct_rev()` to reverse the data.** It does not reverse the vector of observations, only the level lookup table. The values stay in their original positions, as the comparison below shows.

```r title="Data values are untouched"
as.character(ratings)
#> [1] "Low"    "High"   "Medium" "High"   "Low"
as.character(fct_rev(ratings))
#> [1] "Low"    "High"   "Medium" "High"   "Low"
```

**Pitfall 2: forgetting to assign the result.** `fct_rev()` returns a new factor and never modifies the original in place. Call it without assigning the output and the reversed order is discarded.

[WARNING]
**`fct_rev()` reverses relative to the current order, not to the alphabet.** If a factor's levels are already custom-ordered as `Low`, `Medium`, `High`, then `fct_rev()` yields `High`, `Medium`, `Low`. It is not a descending alphabetical sort. To sort levels alphabetically, use `fct_relevel(f, sort)` instead.

**Pitfall 3: confusing reversing with renaming.** `fct_rev()` never changes a label, only its position. To rename a level, use `fct_recode()`; to merge several levels into one, use `fct_collapse()`.

## Try it yourself

**Try it:** The `ex_priority` factor has its levels in alphabetical order. Reverse them so the level order becomes `Med`, `Low`, `High` and save the result to `ex_reversed`.

```r title="Your turn: reverse priority levels"
ex_priority <- factor(c("High", "Low", "Med", "Low"))
levels(ex_priority)
#> [1] "High" "Low"  "Med"

# Reverse the level order
ex_reversed <- # your code here

levels(ex_reversed)
#> Expected: "Med" "Low" "High"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_reversed <- fct_rev(ex_priority)
levels(ex_reversed)
#> [1] "Med"  "Low"  "High"
```

**Explanation:** `fct_rev()` flips the level lookup table end to end. The alphabetical order `High`, `Low`, `Med` becomes `Med`, `Low`, `High`, and the factor values themselves are unchanged.

</details>

## Related forcats functions

After `fct_rev()`, these forcats functions cover the rest of factor-order work:

- `fct_relevel()`: set the level order by hand from names you supply.
- `fct_reorder()`: order levels by a summary of another variable, ideal before plotting.
- `fct_infreq()`: order levels from most to least common.
- `fct_inorder()`: order levels by when each value first appears.
- `fct_shift()`: rotate levels by a fixed number of positions.

For the bigger picture on how factors store and display categories, see the forcats reference at [forcats.tidyverse.org](https://forcats.tidyverse.org/reference/fct_rev.html).

## FAQ

**What does fct_rev do in R?**

`fct_rev()` reverses the order of a factor's levels. You pass it a factor and it returns a new factor whose level sequence is flipped end to end. The underlying observations are not changed, so it is safe to use purely for display purposes, such as flipping the order of bars or a legend. It takes no other arguments, which makes it the simplest of the forcats ordering functions.

**How do I reverse a ggplot legend order in R?**

Wrap the factor that maps to the `fill` or `colour` aesthetic in `fct_rev()`. For example, `aes(fill = fct_rev(category))` reverses the order the categories appear in the legend. This is the standard fix when a stacked bar chart legend reads in the opposite order to the stacked segments. No `scale_*` adjustment is needed.

**What is the difference between fct_rev and fct_relevel?**

`fct_rev()` flips the current level order without you naming anything. `fct_relevel()` sets a specific order from level names you supply. Use `fct_rev()` when you want the exact mirror image of the existing order, and `fct_relevel()` when you need a particular sequence, such as moving one level to the front as a regression reference.

**Does fct_rev change the data values?**

No. `fct_rev()` only reverses the order of the level labels and remaps the integer codes to match. Every observation keeps the same category, so counts, means, and other computed results are identical before and after. This is why it is safe to apply right before plotting or printing a table.

**Can fct_rev be undone?**

Yes. `fct_rev()` is its own inverse, so calling it twice returns the original level order. `fct_rev(fct_rev(f))` has the same levels as `f`. This makes it safe to toggle the order on and off without tracking the original separately.
