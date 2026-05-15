---
title: "purrr map_df() in R: Build a Data Frame From a List"
slug: "purrr-map_df-in-R"
description: "Use purrr map_df() in R to apply a function to each element and row-bind the results into one tidy data frame. Worked examples, map_dfc, list_rbind, and FAQ."
keywords: "purrr map_df, map_df function R, purrr map_df examples, R map_df data frame, map_df vs map_dfr, map_df vs map_dfc, combine list into data frame R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "map_df()|purrr map_df|purrr::map_df()|map_df function|purrr map_df examples"
auto_link_case_sensitive: true
target_keyword: "purrr map_df"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr map_df() in R: Build a Data Frame From a List

<p class="lead">The <code>map_df()</code> function in purrr applies a function to each element of a list or vector and row-binds the per-element results into a single data frame. It is the data-frame-returning variant of <code>map()</code>, and an alias for <code>map_dfr()</code>.</p>

[QUICK ANSWER]
map_df(x, ~ data.frame(n = length(.x)))   # one row per element
map_df(by_grp, summary_fn)                # each call returns a row
map_df(x, fn, .id = "source")             # add a label column
map2_df(x, y, fn)                         # two inputs in parallel
pmap_df(list(a, b, c), fn)                # many inputs in parallel
map_dfc(x, fn)                            # bind columns, not rows
map(x, fn) |> list_rbind()                # modern purrr 1.0 form

[DECISION TREE: Is map_df() the right tool?]
- stack results into rows: map_df(x, fn)
- bind results side by side: map_dfc(x, fn)
- keep a plain list of outputs: map(x, fn)
- return one number per element: map_dbl(x, mean)
- feed two lists in parallel: map2_df(x, y, fn)
- modern row-bind, no map_df: map(x, fn) |> list_rbind()

## What map_df() does in one sentence

**map_df() turns many small results into one data frame.** It loops over `.x`, calls `.f` on each element, and expects each call to return a data frame (or a named value that can become one row). purrr then stacks those pieces with `dplyr::bind_rows()`, so the final output is a single tidy data frame. Columns are matched by name across pieces, and any gaps are filled with `NA`.

## Syntax

**map_df() takes a list, a function, and an optional id column.** The four arguments are:

- `.x`: a list or atomic vector to iterate over. A data frame counts as a list of its columns.
- `.f`: the function to apply. It must return a data frame, or a named value that coerces to one row.
- `...`: extra arguments passed unchanged to every call of `.f`.
- `.id`: a string. When `.x` is named, this adds a column holding each element's name.

The `.f` argument accepts several forms. Here the lambda formula and the native anonymous function are applied to a named list of vectors.

```r title="Two ways to write the function"
library(purrr)

nums <- list(a = 1:3, b = 4:6, c = 7:9)

# Lambda formula: .x is each element
map_df(nums, ~ data.frame(total = sum(.x), n = length(.x)))
#>   total n
#> 1     6 3
#> 2    15 3
#> 3    24 3

# Native anonymous function (R 4.1+)
map_df(nums, \(v) data.frame(total = sum(v)))
#>   total
#> 1     6
#> 2    15
#> 3    24
```

The lambda form is the most common because `.x` reads cleanly inside short summaries.

[TIP]
**Always name your input list.** When `.x` carries names, `.id = "name"` captures them as a column, so you never lose track of which row came from which element.

## Worked examples

**These four examples cover the most common map_df() jobs.** Each uses a built-in dataset so you can run them directly.

**Example 1: summarise groups into rows.** Split `mtcars` by cylinder count, then collapse each group to one summary row.

```r title="One summary row per group"
library(dplyr)

by_cyl <- split(mtcars, mtcars$cyl)

map_df(by_cyl, ~ data.frame(
  cars    = nrow(.x),
  avg_mpg = round(mean(.x$mpg), 1),
  avg_hp  = round(mean(.x$hp), 1)
))
#>   cars avg_mpg avg_hp
#> 1   11    26.7   82.6
#> 2    7    19.7  122.3
#> 3   14    15.1  209.2
```

**Example 2: label each row with .id.** Add a column showing which group a row came from.

```r title="Use .id to keep the group label"
map_df(by_cyl, ~ data.frame(avg_mpg = round(mean(.x$mpg), 1)), .id = "cyl")
#>   cyl avg_mpg
#> 1   4    26.7
#> 2   6    19.7
#> 3   8    15.1
```

**Example 3: summarise every column of a data frame.** A data frame is a list of columns, so `map_df()` iterates columns directly.

```r title="Per-column numeric summary"
map_df(mtcars[c("mpg", "hp", "wt")],
       ~ data.frame(mean = round(mean(.x), 2),
                    sd   = round(sd(.x), 2)),
       .id = "variable")
#>   variable   mean    sd
#> 1      mpg  20.09  6.03
#> 2       hp 146.69 68.56
#> 3       wt   3.22  0.98
```

**Example 4: combine two inputs with map2_df().** When each row needs values from two lists, `map2_df()` walks them in lockstep.

```r title="Row-bind from two parallel inputs"
months <- c("Jan", "Feb", "Mar")
sales  <- list(c(10, 12, 8), c(9, 11), c(15, 20, 18, 5))

map2_df(months, sales, ~ data.frame(month = .x, units = sum(.y)))
#>   month units
#> 1   Jan    30
#> 2   Feb    20
#> 3   Mar    58
```

[WARNING]
**map_df() row-binds by column name, not by position.** If two results use different names for the same data, you get extra columns padded with `NA` instead of a clean stack. Keep the column names identical across every call of `.f`.

## map_df() vs map_dfc() and list_rbind()

**map_df() is one of three ways purrr assembles a data frame.** The variant you pick depends on direction and on your purrr version.

| Function | Combines by | Use when |
|---|---|---|
| `map_df()` / `map_dfr()` | rows (stacked) | each call returns a row or block of rows |
| `map_dfc()` | columns (side by side) | each call returns a new column |
| `map() + list_rbind()` | rows (stacked) | you are on purrr 1.0.0 or later |

**map_df() and map_dfr() are the same function.** `map_df()` is simply the older alias, so existing code keeps working. `map_dfc()` is the column-binding twin: it places each result next to the last instead of below it.

[NOTE]
**On purrr 1.0.0 or later?** `map_dfr()` and `map_dfc()` are superseded. The recommended replacement is `map()` followed by `list_rbind()` or `list_cbind()`, which separates iteration from combination and produces clearer errors.

```r title="The modern purrr 1.0 replacement"
map(by_cyl, ~ data.frame(avg_mpg = round(mean(.x$mpg), 1))) |>
  list_rbind(names_to = "cyl")
#>   cyl avg_mpg
#> 1   4    26.7
#> 2   6    19.7
#> 3   8    15.1
```

## Common pitfalls

**Most map_df() failures come from the function not returning a data frame.** The fix is usually to reshape the per-element result.

**Pitfall 1: the function returns a bare vector.** `map_df()` needs each result to be a data frame or a named value.

```r title="Unnamed vector cannot become a row"
map_df(1:3, ~ .x ^ 2)
#> Error in `map_df()`:
#> ! Argument 1 must be a data frame or a named atomic vector.
```

Fix: wrap the result, `~ data.frame(sq = .x ^ 2)`.

**Pitfall 2: .id is just numbers when the input is unnamed.** The `.id` column reads from the names of `.x`.

```r title="No names means numeric id values"
map_df(list(1:3, 4:6), ~ data.frame(total = sum(.x)), .id = "src")
#>   src total
#> 1   1     6
#> 2   2    15
```

Fix: name the list first, `list(a = 1:3, b = 4:6)`.

**Pitfall 3: inconsistent column types across pieces.** If one call returns a column as text and another as numeric, the bind fails.

```r title="Type clash across pieces"
map_df(list(a = 1, b = "x"), ~ data.frame(value = .x))
#> Error in `map_df()`:
#> ! Can't combine `value` <double> and `value` <character>.
```

Fix: make `.f` return a consistent type, or coerce inside the function.

## Try it yourself

**Try it:** Use `map_df()` to build a one-row-per-species summary of `iris`: the mean `Sepal.Length` and the row count for each species. Save it to `ex_summary`.

```r title="Your turn: summarise iris by species"
# Try it: one summary row per species
ex_summary <- # your code here

ex_summary
#> Expected: 3 rows, 3 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
by_species <- split(iris, iris$Species)

ex_summary <- map_df(by_species,
  ~ data.frame(avg_sepal = mean(.x$Sepal.Length), n = nrow(.x)),
  .id = "species")
ex_summary
#>      species avg_sepal  n
#> 1     setosa     5.006 50
#> 2 versicolor     5.936 50
#> 3  virginica     6.588 50
```

**Explanation:** `split()` turns `iris` into a named list of three data frames. `map_df()` reduces each to a one-row summary and stacks them, while `.id = "species"` keeps the group label as a column.

</details>

## Related purrr functions

**map_df() sits in purrr's data-frame-output family.** Reach for a sibling when row-binding is not what you need:

- [map()](purrr-map-in-R.html): returns a plain list when results are not data frames.
- [map_dbl()](purrr-map_dbl-in-R.html): returns one number per element instead of rows.
- [map2()](purrr-map2-in-R.html): iterates two vectors in lockstep.
- [pmap()](purrr-pmap-in-R.html): iterates over any number of inputs, including data frame rows.
- [reduce()](purrr-reduce-in-R.html): collapses a list to a single value.

See the broader [Functional Programming in R](Functional-Programming-in-R.html) guide for context, and the official [purrr map_dfr reference](https://purrr.tidyverse.org/reference/map_dfr.html) for the superseded-status notes.

## FAQ

**What is the difference between map_df() and map_dfr() in R?**

There is no functional difference. `map_df()` is an alias for `map_dfr()`, and both row-bind the per-element results into one data frame. The `map_dfr()` name was introduced to pair clearly with `map_dfc()`, where the "c" stands for columns. Older code and tutorials use `map_df()`, so it stays available, but `map_dfr()` is the name the documentation now prefers.

**Why does map_df() say the argument must be a data frame?**

The function you passed returned something that cannot become a row, usually a bare unnamed vector. `map_df()` row-binds with `bind_rows()`, which needs each piece to be a data frame or a named atomic vector. Wrap your result in `data.frame()` or `tibble()`, or give the vector names, and the error disappears.

**Is map_df() deprecated?**

Not deprecated, but superseded as of purrr 1.0.0. Superseded means it still works and will not be removed, yet it is no longer the recommended approach. The current advice is to call `map()` and then `list_rbind()`, which separates iteration from combination. Existing `map_df()` code is safe to keep, while new code can prefer the `list_rbind()` form.

**How do I add a column showing which element each row came from?**

Pass `.id` with a column name, for example `map_df(x, fn, .id = "source")`. The `.id` column is populated from the names of `.x`. If your input list is unnamed, `.id` falls back to the integer position written as text. Name the list elements first when you want meaningful labels rather than 1, 2, 3.
