---
title: "forcats fct_inorder() in R: Order Levels by Appearance"
slug: forcats-fct_inorder-in-R
description: "Learn how forcats fct_inorder() reorders factor levels by their order of first appearance in R, with runnable examples, ggplot2 use cases, and pitfalls."
keywords: "forcats fct_inorder, fct_inorder function R, forcats fct_inorder examples, R reorder factor levels, fct_inorder vs fct_infreq, factor levels order of appearance R, fct_inorder R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_inorder()|forcats fct_inorder|forcats::fct_inorder()|reorder factor levels by appearance|order factor levels by appearance"
auto_link_case_sensitive: true
target_keyword: forcats fct_inorder
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_inorder() in R: Order Levels by Appearance

<p class="lead">The forcats fct_inorder() function reorders the levels of a factor so they follow the order values first appear in your data, not the alphabetical default.</p>

[QUICK ANSWER]
fct_inorder(x)                      # levels follow first appearance
fct_inorder(x, ordered = TRUE)      # also make it an ordered factor
fct_infreq(x)                       # order by frequency instead
fct_inseq(factor(x))                # order by numeric level value
fct_rev(fct_inorder(x))             # appearance order, reversed
aes(fct_inorder(stage), users)      # lock a ggplot axis to data order
mutate(df, col = fct_inorder(col))  # apply inside a dplyr pipeline

[DECISION TREE: Is fct_inorder() the right tool?]
- order levels by first appearance: fct_inorder(x)
- order levels by frequency: fct_infreq(x)
- order levels by numeric value: fct_inseq(factor(x))
- order by another variable: fct_reorder(x, y)
- set a custom order by hand: fct_relevel(f, "B", "A")
- reverse the current level order: fct_rev(f)

## What fct_inorder() does in one sentence

**fct_inorder() reorders a factor's levels to match the order each value first appears in the data.** It comes from the forcats package, part of the tidyverse. Where base R `factor()` sorts levels alphabetically, fct_inorder() keeps them in the sequence your data presents them, which matters whenever level order drives a plot or a table.

## Syntax

**The function takes a factor and an optional ordered flag.** The full signature is short:

```r title="The fct_inorder signature"
fct_inorder(f, ordered = NA)
```

The arguments are:

- `f`: a factor, or any vector that can be coerced to a factor (character, numeric, or logical). fct_inorder() converts it for you.
- `ordered`: a logical controlling whether the result is an ordered factor. `NA` (the default) keeps the input's existing ordered status. `TRUE` forces an ordered factor; `FALSE` forces an unordered one.

The function never changes the values or the number of rows. It only rewrites the `levels` attribute so the level vector is sorted by first appearance. Every observation keeps its original label, and the factor still has exactly the same categories.

## fct_inorder() examples

**Example 1 shows the core behavior against the base R default.** Load forcats and compare a plain factor with an fct_inorder() factor.

```r title="Alphabetical order versus appearance order"
library(forcats)
x <- c("Mar", "Jan", "Feb", "Jan", "Mar")

levels(factor(x))
#> [1] "Feb" "Jan" "Mar"

levels(fct_inorder(x))
#> [1] "Mar" "Jan" "Feb"
```

base R sorts the levels alphabetically. fct_inorder() instead uses the order each value is first seen: `Mar`, then `Jan`, then `Feb`.

**Example 2 is the most common real use case: fixing bar order in ggplot2.** Bars and axis ticks follow factor level order, so an unordered factor often plots in the wrong sequence.

```r title="Keep bar order in a ggplot chart"
library(ggplot2)
stages <- data.frame(
  stage = c("Visit", "Signup", "Trial", "Paid"),
  users = c(1000, 620, 410, 180)
)
ggplot(stages, aes(fct_inorder(stage), users)) +
  geom_col()
#> Bars render in funnel order: Visit, Signup, Trial, Paid
```

Without fct_inorder() the x-axis would read `Paid, Signup, Trial, Visit`, breaking the funnel story.

[KEY INSIGHT]
**ggplot2 reads category order from factor levels, not from row order.** That is why a chart can look scrambled even when your data frame rows are perfectly arranged. Wrapping the variable in fct_inorder() ties the visual order back to the data.

**Example 3 creates an ordered factor in one step.** Pass `ordered = TRUE` when the categories have a true ranking.

```r title="Create an ordered factor"
f <- fct_inorder(x, ordered = TRUE)
is.ordered(f)
#> [1] TRUE
```

**Example 4 applies fct_inorder() inside a dplyr pipeline.** Use `mutate()` to convert a column in place so the rest of your workflow sees the corrected order.

```r title="Use fct_inorder inside a dplyr pipeline"
library(dplyr)
stages |>
  mutate(stage = fct_inorder(stage)) |>
  pull(stage) |>
  levels()
#> [1] "Visit"  "Signup" "Trial"  "Paid"
```

[TIP]
**Apply fct_inorder() as the last step before plotting or tabulating.** If your data already arrives in a meaningful order, such as months or pipeline stages, one fct_inorder() call locks that order in without you typing every level by hand.

## fct_inorder() vs other forcats ordering functions

**fct_inorder() is one of several forcats functions that reorder levels.** Pick by what should drive the order.

| Function | Orders levels by | Use when |
|---|---|---|
| fct_inorder() | First appearance in the data | Rows already sit in a meaningful order |
| fct_infreq() | Frequency, most common first | Ranking categories by their count |
| fct_inseq() | Numeric value of the levels | Levels are numbers stored as a factor |
| fct_reorder() | A summary of another variable | Sorting bars by a measured value |
| fct_relevel() | A manual order you specify | You know the exact order you want |

The decision rule: if the row order itself carries the meaning, use fct_inorder(). If an external variable or a count should set the order, reach for fct_reorder() or fct_infreq() instead.

## Common pitfalls

**fct_inorder() does not sort numbers numerically.** It treats every input as categorical and orders by appearance, so numeric values can end up out of sequence.

```r title="Pitfall: numbers are not sorted by value"
v <- c(10, 2, 33, 2)
levels(fct_inorder(v))
#> [1] "10" "2"  "33"
```

For a numeric sort, use `fct_inseq(factor(v))`, which returns `2, 10, 33`.

**fct_inorder() reflects the current row order.** If you `arrange()` a data frame first, the levels follow the sorted rows, not the original file order. Call fct_inorder() before any sorting step if the raw order is what you want to preserve.

[WARNING]
**fct_inorder() changes only the level order, never the row order or the values.** The data frame rows stay exactly where they were. To physically reorder rows, you still need `arrange()`; fct_inorder() is purely about how the factor's categories are listed.

## Try it yourself

**Try it:** Given the vector `c("North", "South", "East", "South", "West")`, build a factor whose levels follow the order each region first appears. Save it to `ex_regions`.

```r title="Your turn: order regions by appearance"
# Try it: order levels by first appearance
ex_regions <- # your code here

levels(ex_regions)
#> Expected: "North" "South" "East" "West"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_regions <- fct_inorder(c("North", "South", "East", "South", "West"))
levels(ex_regions)
#> [1] "North" "South" "East"  "West"
```

**Explanation:** fct_inorder() walks the vector once and records each new value as it appears. `North` is first, `South` second, `East` third, and `West` last, so the levels follow that exact sequence.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_inorder() for level management.**

- [fct_infreq()](forcats-fct_infreq-in-R.html): order levels by how often each appears.
- [fct_reorder()](forcats-fct_reorder-in-R.html): order levels by a summary of another variable.
- [fct_relevel()](forcats-fct_relevel-in-R.html): move specific levels to a manual position.
- [fct_rev()](forcats-fct_rev-in-R.html): reverse the current level order.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_inorder.html) for the official documentation.

## FAQ

**What is the difference between fct_inorder() and fct_infreq()?**

Both reorder factor levels, but they use different signals. fct_inorder() sorts levels by the order values first appear as you read down the data. fct_infreq() sorts levels by frequency, placing the most common category first. Use fct_inorder() when the row order is meaningful, such as a time sequence or a process funnel. Use fct_infreq() when you want a ranking by count, which is common for ordering bars in a frequency chart.

**Does fct_inorder() change my data or just the levels?**

It changes only the `levels` attribute of the factor. Every observation keeps its original value, and the number of rows is unchanged. fct_inorder() never sorts or drops rows. If you need the rows themselves in a new order, use `dplyr::arrange()` instead. Think of fct_inorder() as relabeling the legend, not rearranging the data.

**Why is fct_inorder() useful for ggplot2?**

ggplot2 draws categories in factor level order. With a plain character vector or an alphabetically sorted factor, bars and axis labels can appear in a sequence that hides the story. Wrapping the variable in fct_inorder() makes the chart follow the order rows appear in your data frame, so funnels, stages, and timelines plot correctly.

**How do I reverse the order produced by fct_inorder()?**

Wrap the result in `fct_rev()`. The call `fct_rev(fct_inorder(x))` first sets levels by appearance, then reverses them. This is handy for horizontal bar charts, where ggplot2 plots the first level at the bottom and you often want the leading category on top.
</content>
</invoke>
