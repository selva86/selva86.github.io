---
title: "tapply() in R: Apply a Function by Grouping Factor"
slug: base-tapply-in-R
description: "Learn tapply() in R to compute grouped summaries from a vector and one or more factors. See five patterns, comparisons to aggregate, and common pitfalls."
keywords: "tapply in R, tapply function R, base tapply, R group by vector, tapply vs aggregate, tapply examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: base-r-essentials
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "tapply()|base tapply|base::tapply()|tapply function|tapply R"
auto_link_case_sensitive: true
target_keyword: "tapply in R"
sibling_block_enabled: true
difficulty: Beginner
---

# base tapply() in R: Apply Functions to Grouped Vector Subsets

<p class="lead">The <code>tapply()</code> function in base R applies a function to subsets of a vector defined by one or more grouping factors. It returns an array of per-group results, making it the base R workhorse for grouped summaries without loading any package.</p>

[QUICK ANSWER]
tapply(mtcars$mpg, mtcars$cyl, mean)                    # mean mpg per cylinder count
tapply(mtcars$mpg, mtcars$cyl, sum)                     # sum within group
tapply(mtcars$mpg, list(mtcars$cyl, mtcars$am), mean)   # two grouping factors
tapply(mtcars$mpg, mtcars$cyl, length)                  # count per group
tapply(mtcars$mpg, mtcars$cyl, function(x) max(x)-min(x)) # custom function
tapply(x, g, mean, na.rm = TRUE)                        # pass args to FUN
tapply(x, g, mean, default = 0)                         # fill empty groups

[DECISION TREE: Is tapply() the right tool?]
- grouped summary of one vector: tapply(x, g, mean)
- grouped summary of many columns: aggregate(df, by = list(g), mean)
- list output instead of array: split(x, g) then lapply()
- per-row transform tied to group: ave(x, g, FUN = mean)
- modern tidy syntax: dplyr::group_by(df, g) then summarise()
- apply function over matrix rows: apply(m, 1, sum)
- apply function over list elements: lapply(lst, fun)

## What tapply() does in one sentence

**tapply() is a grouped function applier for vectors.** You pass a vector of values, one or more parallel factors that label each value's group, and a function. It returns the result of running that function on every subset of values that share a group label.

[KEY INSIGHT]
**Think of tapply() as split-apply-combine for a single vector.** It internally calls `split()` to break the vector by factor, then applies your function to each chunk, then arranges the answers into an array keyed by factor level. This mental model explains every other behavior in this guide.

## Syntax

```r title="tapply function signature"
tapply(X, INDEX, FUN = NULL, ..., default = NA, simplify = TRUE)
```

**Five arguments matter in everyday use.** `X` is the numeric or character vector to summarize. `INDEX` is a factor (or list of factors) the same length as `X` that labels each element's group. `FUN` is the function applied to each subset. Extra `...` arguments are forwarded to `FUN` (this is how you pass `na.rm = TRUE`). `simplify = TRUE` returns an array; `simplify = FALSE` returns a list.

[NOTE]
**INDEX can be a vector or a list.** A single vector groups by one factor and returns a 1D named array. A list of two vectors groups by both factors and returns a 2D matrix. Three vectors return a 3D array, and so on, one dimension per grouping factor.

## Five common patterns

**These five recipes cover 95 percent of `tapply()` calls in practice.** Each example uses the built-in `mtcars` dataset so you can copy and run them as-is.

### 1. Mean of a numeric column by one factor

```r title="Mean mpg by cylinder count"
tapply(mtcars$mpg, mtcars$cyl, mean)
#>        4        6        8 
#> 26.66364 19.74286 15.10000
```

The output is a named numeric vector. Names come from the unique factor levels in `INDEX`. Reading order matches `levels(factor(mtcars$cyl))`, which is sorted ascending.

### 2. Multiple summary statistics with a custom function

```r title="Range of mpg per cylinder count"
tapply(mtcars$mpg, mtcars$cyl, function(x) max(x) - min(x))
#>     4     6     8 
#> 11.10  3.60  8.70
```

Any function that takes a vector and returns a scalar works. To return multiple statistics per group, return a vector and `tapply()` will stack the results into a matrix.

### 3. Two grouping factors

```r title="Mean mpg by cylinder and transmission"
tapply(mtcars$mpg, list(mtcars$cyl, mtcars$am), mean)
#>          0        1
#> 4 22.90000 28.07500
#> 6 19.12500 20.56667
#> 8 15.05000 15.40000
```

Pass `INDEX` as a list. Rows are the first factor's levels (`cyl`), columns the second (`am`). Cell `[1,2]` is the mean mpg for 4-cylinder cars with automatic transmission coded as 1.

### 4. Count of values per group

```r title="Count cars per cylinder bucket"
tapply(mtcars$mpg, mtcars$cyl, length)
#>  4  6  8 
#> 11  7 14
```

`length` returns the size of each subset. This is equivalent to `table(mtcars$cyl)` for a single factor, but `tapply()` extends naturally to multi-factor counts.

### 5. Pass extra arguments to FUN

```r title="Mean with NA handling"
x <- c(1, 2, NA, 4, 5, NA)
g <- c("a", "a", "a", "b", "b", "b")
tapply(x, g, mean, na.rm = TRUE)
#>   a   b 
#> 1.5 4.5
```

Any argument after `FUN` is forwarded to `FUN`. This is the cleanest way to skip missing values without writing an anonymous function.

[TIP]
**Reach for `tapply()` first, then graduate.** For a single vector and 1-2 factors, `tapply()` is shorter than `aggregate()` and ships with base R. Switch to `aggregate()` or `dplyr` once you need to summarize multiple columns at once or chain further operations.

## tapply vs aggregate vs by vs ave

**Four base R functions handle grouped operations, each with a niche.** Knowing which one returns what shape saves debugging time later.

| Function | Input | Output | Use when |
|---|---|---|---|
| `tapply(x, g, fun)` | Vector + factor(s) | Array (named, possibly multi-dim) | One column, one or more factors |
| `aggregate(df, by, fun)` | Data frame + factor list | Data frame | Multiple columns at once |
| `by(df, g, fun)` | Data frame + factor | List indexed by group | Per-group operation on whole subframe |
| `ave(x, g, FUN)` | Vector + factor | Vector of same length as input | Add group statistic back as a column |

`tapply()` is for collapsing a vector into a smaller array. `ave()` is the mirror: it returns a result the same length as the input, repeating the group statistic for every row. Pick `tapply()` when you want a summary table and `ave()` when you want to attach the group mean to each original row.

## Common pitfalls

**Empty factor levels yield NA cells.** If `INDEX` is a factor with levels that have zero observations in `X`, the corresponding cell is `NA` (or whatever you pass as `default`). This trips up code that assumes the output has no missing values.

```r title="Empty levels produce NA"
g <- factor(c("a", "a", "b"), levels = c("a", "b", "c"))
tapply(c(1, 2, 3), g, sum)
#>  a  b  c 
#>  3  3 NA
```

**Set `default = 0` (added in R 4.0)** to fill empty groups with a sensible value instead of `NA`.

**Function output shape must be consistent across groups.** If `FUN` returns a 2-element vector for some groups and a 3-element vector for others, `tapply()` falls back to a list of mixed shapes. Always return the same number of values from `FUN` for every subset, or use `simplify = FALSE` and post-process explicitly.

**Character INDEX gets coerced to factor.** R sorts character factor levels alphabetically by default, which may not match your intended display order. Wrap with `factor(g, levels = c("low", "mid", "high"))` to control ordering.

## Try it yourself

**Try it:** Use `tapply()` to compute the median horsepower (`hp`) of `mtcars` grouped by the number of gears (`gear`). Save the result to `ex_hp_by_gear`.

```r title="Your turn: median hp by gear"
# Try it: median hp grouped by gear
ex_hp_by_gear <- # your code here

ex_hp_by_gear
#> Expected: 3 named values (one per gear count)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_hp_by_gear <- tapply(mtcars$hp, mtcars$gear, median)
ex_hp_by_gear
#>     3     4     5 
#> 180.0  91.0 175.0
```

**Explanation:** `tapply()` splits `mtcars$hp` by the values in `mtcars$gear`, then applies `median` to each subset. The output is a named numeric vector with one entry per unique gear count.

</details>

## Related apply functions

The apply family covers different input shapes. Each has a niche; mixing them up is the most common base R confusion.

- `apply(m, MARGIN, FUN)`: matrix or array, by row (`1`) or column (`2`).
- `lapply(lst, FUN)`: list or vector, always returns a list.
- `sapply(lst, FUN)`: list or vector, simplifies result to a vector or matrix.
- `vapply(lst, FUN, FUN.VALUE)`: like `sapply()` but type-safe via a template.
- `mapply(FUN, ..., MoreArgs)`: multivariate; passes parallel elements from multiple arguments.

Use `tapply()` when your input is a single vector and the grouping comes from a parallel factor. Everything else in the family ignores grouping factors entirely. For a comparison of those siblings, see [base sapply()](base-sapply-in-R.html) and [base lapply()](base-lapply-in-R.html). The official reference is the [base R apply family documentation](https://www.rdocumentation.org/packages/base/topics/tapply).

## FAQ

**What is tapply() used for in R?**

`tapply()` computes a function over subsets of a vector defined by one or more grouping factors. It is the base R answer to "give me a summary statistic per group" without loading dplyr or data.table. Typical uses include mean values per category, counts per level, range or standard deviation by bucket, and any custom function that takes a vector and returns a scalar.

**What is the difference between apply and tapply?**

`apply()` operates on matrix or array rows and columns, treating each row or column as the input to your function. `tapply()` operates on a single vector and partitions it by a factor, applying your function to each partition. `apply()` cares about the geometry of a 2D object; `tapply()` cares about group membership in a 1D object.

**Can tapply() handle more than one grouping variable?**

Yes. Pass a list of two or more factors as the `INDEX` argument. The result is a multidimensional array with one dimension per factor. Two factors give you a matrix, three factors give a 3D array, and so on. Cells with no observations return `NA` or the value you pass to `default`.

**How does tapply() differ from aggregate()?**

`aggregate()` works on data frames and summarizes multiple columns at once, returning a data frame. `tapply()` works on a single vector and returns an array. If you have one column to summarize, `tapply()` is shorter and faster. If you have many columns or want a tidy data frame output for downstream operations, use `aggregate()` or `dplyr::summarise()`.

**Why does tapply() return NA for some groups?**

This happens when your `INDEX` is a factor with levels that have no observations in your data. Those cells get `NA` by default. Pass `default = 0` (or any other sentinel value) to fill them. Alternatively, drop empty levels first with `droplevels()` before calling `tapply()`.
