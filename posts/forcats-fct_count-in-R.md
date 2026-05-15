---
title: "forcats fct_count() in R: Count Factor Level Frequencies"
slug: forcats-fct_count-in-R
description: "Learn how forcats fct_count() counts the rows in each factor level in R, returning a tidy table of counts and proportions, with runnable examples and tips."
keywords: "forcats fct_count, fct_count function R, forcats fct_count examples, R count factor levels, count factor frequencies R, fct_count vs table, fct_count R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_count()|forcats fct_count|forcats::fct_count()|count factor levels|count factor frequencies"
auto_link_case_sensitive: true
target_keyword: forcats fct_count
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_count() in R: Count Factor Level Frequencies

<p class="lead">The forcats fct_count() function counts how many rows fall into each level of a factor, returning the result as a tidy table of counts and optional proportions.</p>

[QUICK ANSWER]
fct_count(f)                         # count rows in each level
fct_count(f, sort = TRUE)            # counts, largest level first
fct_count(f, prop = TRUE)            # add a proportion column
fct_count(factor(x))                 # coerce a character vector first
fct_count(fct_lump(f, n = 5))        # lump rare levels, then count
fct_count(f)$n                       # pull just the count vector
count(df, col)                       # dplyr equivalent on a data frame

[DECISION TREE: Is fct_count() the right tool?]
- count rows per factor level: fct_count(f)
- count rows per data frame group: count(df, col)
- get counts as a named vector: table(f)
- cross-tabulate two variables: table(a, b)
- lump rare levels before counting: fct_lump(f, n = 5)
- reorder levels by frequency: fct_infreq(f)

## What fct_count() does in one sentence

**fct_count() tallies the number of observations in every level of a factor and hands you back a data frame.** It comes from the forcats package, part of the tidyverse. Where base R `table()` returns a named array, fct_count() returns a tibble with one row per level, which slots straight into a dplyr or ggplot2 pipeline without reshaping.

## Syntax

**The function takes a factor plus two logical flags for sorting and proportions.** The full signature is short:

```r title="The fct_count signature"
fct_count(f, sort = FALSE, prop = FALSE)
```

The arguments are:

- `f`: a factor, or any vector that can be coerced to a factor. fct_count() converts character, numeric, and logical input for you.
- `sort`: a logical. When `TRUE`, rows are ordered by count, largest first. The default `FALSE` keeps the existing level order.
- `prop`: a logical. When `TRUE`, an extra column `p` is added holding each level's share of the total.

The result always has a column `f` with the levels and a column `n` with the integer counts. With `prop = TRUE` it also carries `p`, a proportion between 0 and 1. The number of output rows equals the number of factor levels, not the number of input observations.

## fct_count() examples

**Example 1 shows the core behavior: one row per level.** Load forcats and count a small factor.

```r title="Count rows in each factor level"
library(forcats)
animals <- factor(c("cat", "dog", "cat", "bird", "cat", "dog"))
fct_count(animals)
#> # A tibble: 3 x 2
#>   f         n
#>   <fct> <int>
#> 1 bird      1
#> 2 cat       3
#> 3 dog       2
```

The levels appear in their stored order, which is alphabetical here because `factor()` sorts levels by default. Each `n` is the row count for that level.

**Example 2 sorts the table by frequency.** Pass `sort = TRUE` to rank levels from most to least common.

```r title="Sort the count table by frequency"
fct_count(animals, sort = TRUE)
#> # A tibble: 3 x 2
#>   f         n
#>   <fct> <int>
#> 1 cat       3
#> 2 dog       2
#> 3 bird      1
```

`cat` now leads with three rows. This is the form you want when feeding a ranked summary table into a report.

[KEY INSIGHT]
**fct_count() with sort = TRUE reorders the table rows, not the factor levels.** The level order of the input factor is untouched. If you need the factor itself reordered for a ggplot2 chart, reach for fct_infreq() instead, which rewrites the levels rather than producing a count table.

**Example 3 adds proportions.** Set `prop = TRUE` to get each level's share alongside the raw count.

```r title="Add a proportion column"
fct_count(animals, sort = TRUE, prop = TRUE)
#> # A tibble: 3 x 3
#>   f         n     p
#>   <fct> <int> <dbl>
#> 1 cat       3 0.5  
#> 2 dog       2 0.333
#> 3 bird      1 0.167
```

The `p` column is a fraction of the total six rows. Multiply by 100 if you want percentages.

**Example 4 counts a real dataset column.** fct_count() coerces a character vector, so you can point it straight at a data frame column.

```r title="Count a column from the mpg dataset"
library(ggplot2)
fct_count(factor(mpg$drv), sort = TRUE)
#> # A tibble: 3 x 2
#>   f         n
#>   <fct> <int>
#> 1 f       106
#> 2 4       103
#> 3 r        25
```

Front-wheel-drive cars dominate the `mpg` dataset, followed closely by four-wheel drive, with rear-wheel drive far behind.

[TIP]
**Combine fct_count() with fct_lump() to summarise long-tailed categories.** Call `fct_lump(f, n = 5)` first to collapse rare levels into an "Other" bucket, then `fct_count()` to tally what remains. You get a compact table with a handful of named rows plus a single "Other".

## fct_count() vs other ways to count in R

**fct_count() is one of several ways to count categories.** Pick by what shape of output you need.

| Function | Returns | Use when |
|---|---|---|
| fct_count() | A tibble with `f`, `n`, optional `p` | You want a tidy count table to pipe |
| table() | A named integer array | You want a quick base R tally |
| dplyr::count() | A tibble grouped by columns | Counting groups in a data frame |
| summary() | A named integer vector | A fast console glance at a factor |
| fct_infreq() | A reordered factor | You want to reorder levels, not count |

The decision rule: use fct_count() when the count itself is your output and it must stay tidy. Use `table()` for a throwaway check, and `dplyr::count()` when you are already counting grouped columns in a data frame.

## Common pitfalls

**fct_count() returns a data frame, not a named vector.** You cannot index it the way you index `table()` output.

```r title="Pitfall: fct_count output is a tibble"
counts <- fct_count(animals)
counts$n
#> [1] 1 3 2
```

To pull a single level's count, filter the tibble or use `counts$n` and match against `counts$f`. Indexing by name like `counts["cat"]` will not work.

**The `p` column is a proportion, not a percentage.** With `prop = TRUE`, values range from 0 to 1. Multiply by 100 before labelling a chart or table as a percentage.

[WARNING]
**fct_count() gives missing values their own row.** If the factor contains `NA`, the output includes a level whose `f` is `NA` with its own count. The count is not silently dropped.

```r title="Pitfall: NA becomes its own row"
g <- factor(c("a", "b", NA, "a", NA))
fct_count(g)
#> # A tibble: 3 x 2
#>   f         n
#>   <fct> <int>
#> 1 a         2
#> 2 b         1
#> 3 NA        2
```

Drop or recode missing values with `fct_na_value_to_level()` or `na.omit()` first if you do not want `NA` in the table.

## Try it yourself

**Try it:** Count the rows in each level of `factor(c("S", "M", "L", "M", "S", "M"))`, with the most common size first. Save the table to `ex_sizes`.

```r title="Your turn: count factor levels"
# Try it: count and sort factor levels
ex_sizes <- # your code here

ex_sizes
#> Expected: M 3, S 2, L 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sizes <- fct_count(factor(c("S", "M", "L", "M", "S", "M")), sort = TRUE)
ex_sizes
#> # A tibble: 3 x 2
#>   f         n
#>   <fct> <int>
#> 1 M         3
#> 2 S         2
#> 3 L         1
```

**Explanation:** fct_count() tallies each level: `M` appears three times, `S` twice, `L` once. With `sort = TRUE`, the rows are ordered from the highest count to the lowest.

</details>

## Related forcats functions

**These forcats functions pair naturally with fct_count() for working with factors.**

- [fct_infreq()](forcats-fct_infreq-in-R.html): reorder factor levels by frequency instead of counting them.
- [fct_lump()](forcats-fct_lump-in-R.html): collapse rare levels into "Other" before counting.
- [fct_recode()](forcats-fct_recode-in-R.html): rename levels by hand.
- [fct_relevel()](forcats-fct_relevel-in-R.html): move specific levels to a chosen position.
- [Categorical Data in R](Categorical-Data-in-R.html): the full guide to factors.

See the [forcats reference](https://forcats.tidyverse.org/reference/fct_count.html) for the official documentation.

## FAQ

**What is the difference between fct_count() and table()?**

Both count the observations in each category, but they differ in output shape. `table()` returns a named integer array that you index by level name. fct_count() returns a tibble with a column for the levels and a column for the counts. The tibble plugs directly into dplyr verbs and ggplot2 without conversion, while a `table()` result usually needs `as.data.frame()` first. Use fct_count() when the count is part of a tidy workflow.

**How do I add percentages to fct_count() output?**

Call fct_count() with `prop = TRUE` to get a `p` column holding each level's share of the total as a fraction between 0 and 1. To display percentages, multiply that column by 100, for example `mutate(result, pct = p * 100)`. The `p` column is a proportion by design so it works directly in calculations; the conversion to a percentage is left to you.

**Does fct_count() count NA values?**

Yes. If the factor contains missing values, fct_count() gives them their own row with `f` shown as `NA` and a count of how many `NA` values appeared. It does not drop them silently. If you want the table without missing values, remove them before counting with `na.omit()` or convert them to an explicit level with `fct_na_value_to_level()`.

**Can fct_count() count a character vector?**

Yes. fct_count() coerces its input to a factor first, so a plain character vector works without wrapping it in `factor()` yourself. The levels are created in alphabetical order during coercion. If you need a specific level order in the output, convert to a factor with the order you want before calling fct_count(), or pass `sort = TRUE` to rank rows by count.
</content>
</invoke>
