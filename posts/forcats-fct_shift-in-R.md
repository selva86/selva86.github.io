---
title: "forcats fct_shift() in R: Rotate Factor Level Order"
slug: "forcats-fct_shift-in-R"
description: "Learn forcats fct_shift() in R to rotate factor levels by a fixed offset, with weekday and month axis examples, common pitfalls, and the fct_rev difference."
keywords: "forcats fct_shift, fct_shift function R, forcats fct_shift examples, rotate factor levels R, shift factor levels R, fct_shift vs fct_relevel"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_shift()|forcats fct_shift|forcats::fct_shift()|rotate factor levels|fct_shift|shift factor levels"
auto_link_case_sensitive: true
target_keyword: "forcats fct_shift"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_shift() in R: Rotate Factor Level Order

<p class="lead">The <code>fct_shift()</code> function in forcats rotates a factor's levels by a fixed number of positions, wrapping levels that fall off one end back to the other. It is built for cyclic categories such as weekdays and months.</p>

[QUICK ANSWER]
fct_shift(f)                        # shift levels left by 1
fct_shift(f, n = 2)                 # shift left by 2
fct_shift(f, n = -1)                # shift right by 1
fct_shift(factor(c("a","b","c")))   # works on a bare factor
levels(fct_shift(f))                # inspect the rotated order
fct_shift(df$day)                   # rotate a data frame column
fct_shift(f, n = nlevels(f))        # full rotation, back to start

[DECISION TREE: Is fct_shift() the right tool?]
- rotate levels by a fixed offset: fct_shift(f, n)
- reverse the level order: fct_rev(f)
- set the order by hand: fct_relevel(f, "Mon", "Tue")
- order levels by another variable: fct_reorder(f, x)
- order levels by frequency: fct_infreq(f)
- order by first appearance in data: fct_inorder(f)

## What fct_shift() does

**`fct_shift()` rotates the levels of a factor by a fixed offset.** It picks up the level list and slides every level a set number of places. Any level that runs off one end reappears at the other end. The data values never move; only the level lookup table is rebuilt.

Some categories are inherently cyclic. Weekdays run Monday to Sunday and then start again, months wrap from December to January, and clock hours wrap at midnight. For data like this there is no single correct starting point, only the one your chart or table should lead with. `fct_shift()` changes that starting point in one call.

This is different from reversing or hand-ordering. `fct_rev()` flips the sequence end to end, and `fct_relevel()` rebuilds it from names you type out. `fct_shift()` keeps the relative sequence intact and only changes where that sequence begins.

[KEY INSIGHT]
**Think of the levels as a ring, not a list.** `fct_shift()` rotates the ring: the spacing and direction between levels stay the same, and only the cut point moves. A positive `n` cuts the ring further to the left, a negative `n` further to the right.

## fct_shift() syntax

**`fct_shift()` takes a factor and an integer offset.** The signature has just two arguments:

```
fct_shift(f, n = 1L)
```

- `f` is a factor. A character vector is accepted and coerced to a factor first.
- `n` is the integer number of positions to shift. A positive `n` shifts levels to the left, so leading levels wrap to the end. A negative `n` shifts to the right. The default is `1`.

Because the result is a rotation of the current order, confirm a factor's starting levels before shifting them. The code below builds a weekday factor with its levels in calendar order.

```r title="Load forcats and build a weekday factor"
library(forcats)

week <- factor(
  c("Mon", "Wed", "Fri", "Mon"),
  levels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
)
levels(week)
#> [1] "Mon" "Tue" "Wed" "Thu" "Fri" "Sat" "Sun"
```

The levels run `Mon` through `Sun`. That is the order `fct_shift()` will rotate in the examples below.

## fct_shift() examples

**Each example rotates the weekday factor and prints the new level order.** `fct_shift()` always returns a new factor, so assign the result to a name to keep it.

### 1. Shift levels left by one

With the default `n = 1`, every level moves one place to the left and the first level wraps to the end.

```r title="Shift factor levels left by one"
levels(fct_shift(week))
#> [1] "Tue" "Wed" "Thu" "Fri" "Sat" "Sun" "Mon"
```

`Mon` moved from the front to the back. The week now reads `Tue` first, which is what a chart axis or sorted table would use.

### 2. Shift by a larger offset

Pass any integer to `n` to rotate further. An `n` of `2` moves the first two levels to the end.

```r title="Shift factor levels left by two"
levels(fct_shift(week, n = 2))
#> [1] "Wed" "Thu" "Fri" "Sat" "Sun" "Mon" "Tue"
```

Both `Mon` and `Tue` wrapped around, so the sequence now starts on `Wed`.

### 3. Shift right with a negative n

A negative `n` rotates in the opposite direction. Use it to pull trailing levels to the front, such as making `Sun` the first day of the week.

```r title="Shift factor levels right by one"
levels(fct_shift(week, n = -1))
#> [1] "Sun" "Mon" "Tue" "Wed" "Thu" "Fri" "Sat"
```

`Sun` wrapped from the end to the front. This is the order many calendars use.

[TIP]
**Use a negative `n` to change which day a weekday chart starts on.** A ggplot2 bar chart or calendar heatmap reads its categories from the factor's level order. Rotating the weekday column with `fct_shift(day, -1)` moves `Sun` to the front without editing any data values.

### 4. Rotate a data frame column

The most common real use is rotating a factor column so a chart leads with the right category. Assign the shifted factor back to the same column.

```r title="Rotate a data frame factor column"
df <- data.frame(
  day = factor(
    c("Sat", "Sun", "Mon"),
    levels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
  )
)
df$day <- fct_shift(df$day, n = -2)
levels(df$day)
#> [1] "Sat" "Sun" "Mon" "Tue" "Wed" "Thu" "Fri"
```

An `n` of `-2` pulled `Sat` and `Sun` to the front, giving a weekend-first ordering. The three observations in the column keep their original categories.

## fct_shift() vs other forcats ordering functions

**`fct_shift()` rotates the existing order; the others build a new one.** Reach for `fct_shift()` only when the order you want is the current order started at a different point.

| Function | Sets level order by | Use when |
|---|---|---|
| `fct_shift()` | rotating by a fixed offset, wrapping | the cycle should start at a different point |
| `fct_rev()` | reversing the current order | you want the mirror image of the order |
| `fct_relevel()` | a manual specification | you know the exact order you want |
| `fct_reorder()` | another numeric variable | order should track a summary value |
| `fct_infreq()` | frequency, most common first | the popular category should lead |

The decision rule is short. If the levels already form a cycle and you only need to move the starting point, use `fct_shift()`. If you need a completely different order, use `fct_relevel()` or `fct_reorder()`. A common pattern sets a cyclic order once with `fct_relevel()`, then rotates the starting point with `fct_shift()`.

## Common pitfalls

**Pitfall 1: expecting a positive `n` to shift right.** A positive `n` shifts levels to the left, so the first level wraps to the end. Readers often expect the opposite. The comparison below shows the two directions side by side.

```r title="Positive n shifts left, negative n shifts right"
levels(fct_shift(week, n = 1))
#> [1] "Tue" "Wed" "Thu" "Fri" "Sat" "Sun" "Mon"
levels(fct_shift(week, n = -1))
#> [1] "Sun" "Mon" "Tue" "Wed" "Thu" "Fri" "Sat"
```

**Pitfall 2: expecting `fct_shift()` to reorder the data.** It rotates the level lookup table only. The vector of observations stays in place, as the character comparison below confirms.

```r title="Data values are untouched"
as.character(week)
#> [1] "Mon" "Wed" "Fri" "Mon"
as.character(fct_shift(week))
#> [1] "Mon" "Wed" "Fri" "Mon"
```

[WARNING]
**A full rotation returns the original factor.** Shifting by an `n` equal to the number of levels wraps all the way around. `fct_shift(week, 7)` has the same level order as `week`, because `7` is the level count. `fct_shift()` accepts any integer and reduces it against the level count, so very large offsets simply wrap.

**Pitfall 3: rotating levels that are not in cyclic order.** `fct_shift()` rotates whatever order the levels currently have. If the levels are alphabetical instead of calendar order, the rotation will not produce a sensible week. Set the levels in cyclic order first with `factor(levels = ...)` or `fct_relevel()`, then rotate.

## Try it yourself

**Try it:** The `ex_months` factor has its levels in calendar order, January first. Rotate them so the fiscal year starts in April and save the result to `ex_rotated`.

```r title="Your turn: rotate month levels"
ex_months <- factor(c("Jan", "Apr", "Dec"), levels = month.abb)
levels(ex_months)
#> [1] "Jan" "Feb" "Mar" "Apr" ... "Dec"

# Rotate so April leads
ex_rotated <- # your code here

levels(ex_rotated)
#> Expected: "Apr" "May" ... "Mar"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rotated <- fct_shift(ex_months, n = 3)
levels(ex_rotated)
#>  [1] "Apr" "May" "Jun" "Jul" "Aug" "Sep" "Oct" "Nov" "Dec" "Jan" "Feb" "Mar"
```

**Explanation:** A positive `n` of `3` shifts the levels left by three places. `Jan`, `Feb`, and `Mar` wrap to the end, so the level order now starts on `Apr`.

</details>

## Related forcats functions

After `fct_shift()`, these forcats functions cover the rest of factor-order work:

- `fct_rev()`: reverse the level order end to end.
- `fct_relevel()`: set the level order by hand from names you supply.
- `fct_reorder()`: order levels by a summary of another variable.
- `fct_inorder()`: order levels by when each value first appears.
- `fct_infreq()`: order levels from most to least common.

For the full argument reference, see the forcats documentation at [forcats.tidyverse.org](https://forcats.tidyverse.org/reference/fct_shift.html).

## FAQ

**What does fct_shift do in R?**

`fct_shift()` rotates the levels of a factor by a fixed number of positions. You pass it a factor and an integer `n`, and it slides every level that many places, wrapping levels off one end back to the other. The underlying observations are not changed, only the order of the level labels. It is designed for cyclic categories such as weekdays, months, and clock hours, where the sequence has no fixed starting point.

**What is the difference between fct_shift and fct_rev?**

`fct_shift()` rotates the level order, keeping the sequence and direction the same while moving the starting point. `fct_rev()` reverses the level order so the sequence runs backward. Use `fct_shift()` when the levels form a cycle and you want a different first level, and use `fct_rev()` when you want the exact mirror image of the current order, such as flipping a bar chart.

**Does fct_shift change the data values?**

No. `fct_shift()` only rotates the level lookup table and remaps the integer codes to match. Every observation keeps the same category, so counts, means, and other computed results are identical before and after the call. This makes it safe to apply right before plotting or printing a table.

**How do I make a weekday chart start on Sunday in R?**

Set the weekday column's levels in `Mon` to `Sun` order, then call `fct_shift(day, n = -1)`. The negative `n` rotates the levels one place to the right, pulling `Sun` from the end to the front. ggplot2 reads category order from the factor's levels, so the chart axis will then lead with `Sun` without any change to the data.
