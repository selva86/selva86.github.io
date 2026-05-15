---
title: "forcats fct_infreq() in R: Order Levels by Frequency"
slug: forcats-fct_infreq-in-R
description: "Learn how forcats fct_infreq() reorders factor levels by frequency in R, placing the most common category first, with runnable examples and ggplot2 tips."
keywords: "forcats fct_infreq, fct_infreq function R, forcats fct_infreq examples, R reorder factor by frequency, order factor levels by count R, fct_infreq vs fct_inorder, fct_infreq R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_infreq()|forcats fct_infreq|forcats::fct_infreq()|reorder factor by frequency|order factor levels by frequency"
auto_link_case_sensitive: true
target_keyword: forcats fct_infreq
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_infreq() in R: Order Levels by Frequency

<p class="lead">The forcats fct_infreq() function reorders the levels of a factor by frequency, so the most common category comes first and the rarest comes last.</p>

[QUICK ANSWER]
fct_infreq(x)                        # levels by frequency, most common first
fct_infreq(x, ordered = TRUE)        # also make it an ordered factor
fct_infreq(x, w = weights)           # weight the frequency count
fct_rev(fct_infreq(x))               # least common category first
fct_infreq(fct_lump(x, n = 5))       # lump rare levels, then order
aes(fct_infreq(class))               # order ggplot2 bars by count
mutate(df, col = fct_infreq(col))    # apply inside a dplyr pipeline

[DECISION TREE: Is fct_infreq() the right tool?]
- order levels by frequency: fct_infreq(x)
- order levels by first appearance: fct_inorder(x)
- order levels by numeric value: fct_inseq(factor(x))
- order by another variable: fct_reorder(x, y)
- set a custom order by hand: fct_relevel(f, "B", "A")
- lump rare levels together: fct_lump(x, n = 5)

## What fct_infreq() does in one sentence

**fct_infreq() reorders a factor's levels by how often each value occurs, most frequent first.** It comes from the forcats package, part of the tidyverse. Where base R `factor()` sorts levels alphabetically, fct_infreq() ranks them by count, which is exactly what you want when a bar chart or a summary table should lead with the dominant category.

## Syntax

**The function takes a factor, an optional weight vector, and an optional ordered flag.** The full signature is short:

```r title="The fct_infreq signature"
fct_infreq(f, w = NULL, ordered = NA)
```

The arguments are:

- `f`: a factor, or any vector that can be coerced to a factor (character, numeric, or logical). fct_infreq() converts it for you.
- `w`: an optional numeric vector of weights, one per observation. When supplied, levels are ranked by the sum of their weights instead of a plain row count.
- `ordered`: a logical controlling whether the result is an ordered factor. `NA` (the default) keeps the input's existing ordered status. `TRUE` forces an ordered factor; `FALSE` forces an unordered one.

The function never changes the values or the number of rows. It only rewrites the `levels` attribute so the level vector is sorted by frequency. When two levels tie on count, fct_infreq() keeps their previous relative order.

## fct_infreq() examples

**Example 1 shows the core behavior against the base R default.** Load forcats and compare a plain factor with an fct_infreq() factor.

```r title="Alphabetical order versus frequency order"
library(forcats)
x <- c("apple", "cherry", "cherry", "banana", "cherry", "apple")

levels(factor(x))
#> [1] "apple"  "banana" "cherry"

levels(fct_infreq(x))
#> [1] "cherry" "apple"  "banana"
```

base R sorts the levels alphabetically. fct_infreq() instead ranks by count: `cherry` appears three times, `apple` twice, `banana` once.

**Example 2 is the most common real use case: ordering bars in ggplot2.** Bars and axis ticks follow factor level order, so a frequency chart looks best when the tallest bar leads.

```r title="Order ggplot2 bars by count"
library(ggplot2)
ggplot(mpg, aes(fct_infreq(class))) +
  geom_bar()
#> Bars run tallest to shortest: suv, compact, midsize, subcompact, ...
```

Without fct_infreq() the x-axis would read `2seater, compact, midsize, ...` in alphabetical order, scattering the tall and short bars and making the chart harder to scan.

[KEY INSIGHT]
**ggplot2 reads category order from factor levels, not from the bar heights it computes.** That is why a frequency chart can still look unsorted even though geom_bar() counts the rows for you. Wrapping the variable in fct_infreq() ties the visual order to the counts.

**Example 3 weights the frequency count.** Pass a `w` vector when each row should contribute more than one to the tally, such as pre-aggregated sales.

```r title="Rank levels by weighted frequency"
region <- c("North", "South", "East")
sales  <- c(50, 300, 120)
levels(fct_infreq(region, w = sales))
#> [1] "South" "East"  "North"
```

Each region appears once, so an unweighted call would leave the order untouched. With `w = sales`, `South` leads because its weight total is highest.

**Example 4 applies fct_infreq() inside a dplyr pipeline.** Use `mutate()` to convert a column in place so the rest of your workflow sees the frequency order.

```r title="Use fct_infreq inside a dplyr pipeline"
library(dplyr)
mpg |>
  mutate(class = fct_infreq(class)) |>
  pull(class) |>
  levels()
#> [1] "suv" "compact" "midsize" "subcompact" "pickup" "minivan" "2seater"
```

[TIP]
**Combine fct_infreq() with fct_lump() to tame long-tailed categories.** Call `fct_lump(x, n = 5)` first to collapse rare levels into an "Other" bucket, then `fct_infreq()` to rank what remains. The result is a clean chart with a handful of named bars plus one "Other".

## fct_infreq() vs other forcats ordering functions

**fct_infreq() is one of several forcats functions that reorder levels.** Pick by what should drive the order.

| Function | Orders levels by | Use when |
|---|---|---|
| fct_infreq() | Frequency, most common first | Ranking categories by their count |
| fct_inorder() | First appearance in the data | Rows already sit in a meaningful order |
| fct_inseq() | Numeric value of the levels | Levels are numbers stored as a factor |
| fct_reorder() | A summary of another variable | Sorting bars by a measured value |
| fct_relevel() | A manual order you specify | You know the exact order you want |

The decision rule: if a count should set the order, use fct_infreq(). If an external variable should set it, reach for fct_reorder(); if you know the exact sequence, use fct_relevel().

## Common pitfalls

**fct_infreq() does not sort numbers numerically.** It treats every input as categorical and ranks by count, so numeric values can land out of sequence.

```r title="Pitfall: numbers are ranked by count"
v <- c(10, 2, 33, 2)
levels(fct_infreq(v))
#> [1] "2"  "10" "33"
```

`2` leads because it occurs twice; `10` and `33` tie on count and keep their appearance order. For a numeric sort, use `fct_inseq(factor(v))`, which returns `2, 10, 33` by value.

**Ties keep their previous order, not alphabetical order.** When two levels share the same count, fct_infreq() does not break the tie alphabetically. It preserves whatever order the levels already had, so the result can look arbitrary if you have many equally common categories.

[WARNING]
**fct_infreq() counts every row, including NA values.** Missing values form their own level and are ranked by how often `NA` appears, landing wherever that count places them rather than always last. Drop or recode NAs with `fct_explicit_na()` first if you do not want them competing for a top position.

## Try it yourself

**Try it:** Given the vector `c("dog", "cat", "cat", "fish", "cat", "dog")`, build a factor whose levels are ordered from most to least frequent. Save it to `ex_pets`.

```r title="Your turn: order pets by frequency"
# Try it: order levels by frequency
ex_pets <- # your code here

levels(ex_pets)
#> Expected: "cat" "dog" "fish"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pets <- fct_infreq(c("dog", "cat", "cat", "fish", "cat", "dog"))
levels(ex_pets)
#> [1] "cat"  "dog"  "fish"
```

**Explanation:** fct_infreq() counts each value: `cat` appears three times, `dog` twice, `fish` once. The levels are then sorted from the highest count to the lowest, giving `cat`, `dog`, `fish`.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_infreq() for level management.**

- [fct_inorder()](forcats-fct_inorder-in-R.html): order levels by first appearance instead of count.
- [fct_reorder()](forcats-fct_reorder-in-R.html): order levels by a summary of another variable.
- [fct_relevel()](forcats-fct_relevel-in-R.html): move specific levels to a manual position.
- [fct_rev()](forcats-fct_rev-in-R.html): reverse the current level order.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_inorder.html) for the official documentation.

## FAQ

**What is the difference between fct_infreq() and fct_inorder()?**

Both reorder factor levels, but they use different signals. fct_infreq() sorts levels by frequency, placing the most common category first. fct_inorder() sorts levels by the order values first appear as you read down the data. Use fct_infreq() when you want a ranking by count, which is common for frequency bar charts. Use fct_inorder() when the row order itself is meaningful, such as a time sequence or a process funnel.

**How do I order ggplot2 bars from most to least common?**

Wrap the categorical variable in fct_infreq() inside `aes()`, for example `aes(fct_infreq(class))`. ggplot2 draws categories in factor level order, and fct_infreq() sets that order by count. The result is a bar chart with the tallest bar on the left. To put the most common category at the top of a horizontal chart, add `coord_flip()` or combine fct_infreq() with `fct_rev()`.

**Does fct_infreq() change my data or just the levels?**

It changes only the `levels` attribute of the factor. Every observation keeps its original value, and the number of rows is unchanged. fct_infreq() never sorts or drops rows. If you need the rows themselves in a new order, use `dplyr::arrange()` instead. Think of fct_infreq() as reordering the legend, not rearranging the data.

**How do I reverse the order produced by fct_infreq()?**

Wrap the result in `fct_rev()`. The call `fct_rev(fct_infreq(x))` first ranks levels by frequency, then reverses them so the rarest category comes first. This is useful for horizontal bar charts, where ggplot2 plots the first level at the bottom and you often want the most common category on top.
