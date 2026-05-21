---
title: "tibble enframe() in R: Named Vector to Two-Column Tibble"
slug: "tibble-enframe-in-R"
description: "Lift a named vector into a two-column tibble in R with tibble::enframe(). Examples for purrr map output, list columns, deframe round-trips, and pitfalls."
keywords: "tibble enframe, enframe function R, tibble enframe examples, R named vector to tibble, named vector to data frame R, enframe purrr map output, deframe vs enframe"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "enframe()|tibble enframe|tibble::enframe()|named vector to tibble|enframe vs deframe"
auto_link_case_sensitive: true
target_keyword: "tibble enframe"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble enframe() in R: Named Vector to Two-Column Tibble

<p class="lead">The <code>tibble enframe()</code> function lifts a vector into a two-column tibble with columns <code>name</code> and <code>value</code>. A named vector uses its names as the first column; an unnamed vector gets sequential integers. The result is rectangular data ready for dplyr, ggplot2, and tidyr pipelines.</p>

[QUICK ANSWER]
enframe(c(a = 1, b = 2, c = 3))               # named vector, name column from names
enframe(c(10, 20, 30))                        # unnamed vector, name column is 1:n
enframe(c(a = 1, b = 2), name = "key", value = "n")  # rename both columns
enframe(letters[1:5])                         # character vector, integer names
enframe(list(a = 1:2, b = 3:5))               # list input, list column of values
enframe(table(mtcars$cyl))                    # table to tidy two-column tibble
enframe(purrr::map(1:3, ~ .x^2))              # map output to tibble for unnest

[DECISION TREE: Is enframe() the right tool?]
- named vector to two-column tibble: enframe(v)
- two-column tibble back to a named vector: tibble::deframe(df)
- single vector to a one-column tibble: tibble::as_tibble_col(v, "name")
- named vector to a one-row tibble: tibble::as_tibble_row(v)
- list of equal-length elements to a tibble: tibble::as_tibble(lst)
- table() output as a tidy frame with counts: as.data.frame(tab)

## What enframe() does in one sentence

**`enframe()` is the inverse of `deframe()`.** You pass a vector and the function returns a two-column tibble. The first column holds the vector's `names()` (or integer indices if the vector is unnamed) and the second column holds the values. The default column names are `name` and `value`, both overridable.

The use case is entering the rectangular world. After base R code produces a named vector (a `table()`, a `quantile()`, a `summary()`, or a `purrr::map()` result), `enframe()` converts it into a tibble you can feed to dplyr, ggplot2, or tidyr without writing `data.frame(name = names(v), value = unname(v))` by hand.

## Syntax

**`enframe()` takes one vector and two optional column-name arguments.** The function works on atomic vectors and on lists; for lists you get a list-column you can later expand with `tidyr::unnest()`.

```r title="Load tibble and enframe a named vector"
library(tibble)

scores <- c(alice = 92, bob = 78, carol = 85)
enframe(scores)
#> # A tibble: 3 x 2
#>   name  value
#>   <chr> <dbl>
#> 1 alice    92
#> 2 bob      78
#> 3 carol    85
```

The full signature is:

```
enframe(x, name = "name", value = "value")
```

- `x` is a vector. Atomic vectors produce a regular value column; lists produce a `<list>` column.
- `name` is the first column's label. Pass `NULL` to suppress the name column entirely; the output is then a one-column tibble.
- `value` is the second column's label.

The output type follows the input: a numeric vector produces a `<dbl>` value column, a character vector produces `<chr>`, a logical vector produces `<lgl>`. The name column is always `<chr>` when names exist and `<int>` when the input is unnamed.

[TIP]
**Rename the columns at the call site for self-documenting code.** Default `name` and `value` are generic; passing `name = "city"` and `value = "pop"` makes the downstream pipeline read like English. The rename is cheaper than chaining a separate `rename()` call and the column names show up in plot axis labels for free.

## Four common patterns

### 1. Named vector to a tibble for plotting

```r title="Pipe a named numeric into ggplot2"
library(tibble)
library(ggplot2)

medals <- c(USA = 39, China = 38, Japan = 27, GB = 22, Australia = 17)
medals |>
  enframe(name = "country", value = "gold") |>
  ggplot(aes(reorder(country, gold), gold)) +
  geom_col() +
  coord_flip()
```

`ggplot2` requires a data frame, not a named vector. `enframe()` is the one-liner bridge: the named vector becomes a two-column tibble, ready for `aes()` mappings. The explicit `name` and `value` arguments mean the columns already have the labels the plot needs.

### 2. table() or quantile() output as a tidy frame

```r title="Frequency counts as a tibble"
library(tibble)

cyl_tab <- table(mtcars$cyl)
enframe(cyl_tab, name = "cyl", value = "n")
#> # A tibble: 3 x 2
#>   cyl       n
#>   <chr> <int>
#> 1 4        11
#> 2 6         7
#> 3 8        14
```

`table()` returns a named integer vector with class `table`; `enframe()` strips the class and produces a tidy two-column tibble. The same pattern works for `quantile()`, `summary()` on a numeric, and any other base R function whose output is a named atomic vector.

### 3. purrr::map() output as a list-column tibble

```r title="Wrap a map result in a tibble"
library(tibble)
library(purrr)
library(tidyr)

squared <- map(1:4, ~ .x^2)
enframe(squared, name = "input", value = "result") |>
  unnest(result)
#> # A tibble: 4 x 2
#>   input result
#>   <int>  <dbl>
#> 1     1      1
#> 2     2      4
#> 3     3      9
#> 4     4     16
```

`purrr::map()` returns a list. `enframe()` lifts the list into a tibble with a `<list>` value column; `tidyr::unnest()` then flattens it to a regular tibble. This is the canonical pattern for moving from functional-style iteration into a tidy result.

### 4. Drop the name column for an integer index

```r title="Unnamed vector with default integer names"
library(tibble)

values <- c(10, 25, 7, 14)
enframe(values)
#> # A tibble: 4 x 2
#>   name  value
#>   <int> <dbl>
#> 1     1    10
#> 2     2    25
#> 3     3     7
#> 4     4    14
```

For unnamed input, `enframe()` synthesizes the first column as `1:length(x)`. The column type is `<int>` rather than `<chr>`, which is occasionally useful: you can sort, filter, or join numerically on the index. Pass `name = NULL` if you do not want the index column at all; the output then has just the `value` column.

## enframe() vs as_tibble_col() vs as_tibble_row()

**Three tibble functions take a vector and emit a tibble, but each produces a different shape.** Pick by what column layout you want.

| Behavior | `enframe()` | `as_tibble_col()` | `as_tibble_row()` |
|---|---|---|---|
| Input | Named or unnamed vector | Single vector | Single vector (named recommended) |
| Output shape | Two columns (`name`, `value`) | One column | One row, one column per vector element |
| Names handled? | First column = names | Names dropped | Names become column names |
| Length | N rows for N elements | N rows | 1 row |
| Typical use | Lookup-style data, map results | Wrap a column in a frame | Single record for `bind_rows()` |

Decision rule:

- Reach for `enframe()` when you want a key-value layout for plotting or joining.
- Reach for `as_tibble_col()` when you want a one-column frame and do not care about names.
- Reach for `as_tibble_row()` when you want each named element as its own column, typically to stack rows with `bind_rows()`.

[KEY INSIGHT]
**Think of `enframe()` as the entry gate to the tidyverse.** Many base R workflows produce named vectors as final results: `table()`, `quantile()`, `summary()`, named `sapply()` output. Without `enframe()` you would write `data.frame(name = names(v), value = unname(v), stringsAsFactors = FALSE)` by hand, then convert to a tibble. `enframe()` does it in one call, with the right column types, ready for the next pipeline step.

## Common pitfalls

**Pitfall 1: unnamed input gets integer indices, not your data.** Beginners sometimes expect `enframe()` to pull names from a sibling vector or from the values themselves.

```r title="Unnamed input behavior"
library(tibble)

# Unnamed vector: name column is 1:n
enframe(c("apple", "bread", "cheese"))
#> # A tibble: 3 x 2
#>   name  value 
#>   <int> <chr> 
#> 1     1 apple 
#> 2     2 bread 
#> 3     3 cheese

# To use the values themselves as names, set names first:
items <- c("apple", "bread", "cheese")
enframe(setNames(items, items))
#> # A tibble: 3 x 2
#>   name   value 
#>   <chr>  <chr> 
#> 1 apple  apple 
#> 2 bread  bread 
#> 3 cheese cheese
```

Always attach names with `setNames()` (or `names<-`) before calling `enframe()` if you want a specific first column. The function never inspects values to guess at names.

[WARNING]
**Duplicate names survive into the tibble.** R allows duplicate names on a vector, and `enframe()` copies them straight into the name column. The output is a perfectly valid tibble, but downstream `pivot_wider()`, `left_join()` on `name`, or any operation that assumes unique keys will misbehave. Dedupe the names before enframing if uniqueness matters: `v <- v[!duplicated(names(v))]`.

**Pitfall 2: a single scalar produces a one-row tibble, not a column.** Newcomers sometimes pass a scalar expecting a one-cell frame and get a one-row two-column tibble instead.

```r title="Scalar input is still a vector"
library(tibble)

enframe(42)
#> # A tibble: 1 x 2
#>   name  value
#>   <int> <dbl>
#> 1     1    42

enframe(c(answer = 42))
#> # A tibble: 1 x 2
#>   name   value
#>   <chr>  <dbl>
#> 1 answer    42
```

R has no scalar type; `42` is a length-1 numeric vector. `enframe()` treats it like any other length-1 vector and produces a one-row tibble with the synthesized integer name column. To suppress the name column on a scalar, pass `name = NULL`.

## Try it yourself

**Try it:** Compute the mean miles-per-gallon for each `cyl` group in `mtcars` using `tapply()`, then convert the resulting named numeric vector into a tibble with columns `cyl` and `mean_mpg`. Save the tibble to `ex_mpg`.

```r title="Your turn: named vector to tibble"
library(tibble)

# Try it: tapply result to tibble
mpg_by_cyl <- tapply(mtcars$mpg, mtcars$cyl, mean)
ex_mpg <- # your code here

ex_mpg
#> Expected: a 3-row tibble with columns cyl and mean_mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(tibble)

mpg_by_cyl <- tapply(mtcars$mpg, mtcars$cyl, mean)
ex_mpg <- enframe(mpg_by_cyl, name = "cyl", value = "mean_mpg")
ex_mpg
#> # A tibble: 3 x 2
#>   cyl   mean_mpg
#>   <chr>    <dbl>
#> 1 4         26.7
#> 2 6         19.7
#> 3 8         15.1
```

**Explanation:** `tapply()` returns a named numeric vector keyed by `cyl`. Passing `name = "cyl", value = "mean_mpg"` to `enframe()` lifts that vector into a two-column tibble with the labels the analysis actually uses, ready for further dplyr or ggplot2 work.

</details>

## Related tibble functions

After mastering `enframe()`, look at:

- `tibble::deframe()`: the inverse, collapses a one- or two-column tibble back into a named vector.
- `tibble::as_tibble_col()`: lift a single vector into a one-column tibble without the name column.
- `tibble::as_tibble_row()`: lift a named vector into a one-row tibble with one column per element.
- `tibble::tibble()`: build a tibble from scratch by passing columns directly.
- `tidyr::unnest()`: flatten a list-column produced by `enframe(list_value)` into regular rows.
- `dplyr::count()`: get a two-column tibble of group counts directly, skipping `table()` and `enframe()`.

For the full API, the [official enframe() documentation](https://tibble.tidyverse.org/reference/enframe.html) covers the contract alongside `deframe()`.

## FAQ

**What is the difference between enframe() and as_tibble() in R?**

`enframe()` is specialized for vectors: it always produces a two-column tibble with `name` and `value`, regardless of whether the input is named. `as_tibble()` is the general-purpose coercer; given a list, it produces a tibble where each list element becomes a column, and given a data frame it just refines the class. Reach for `enframe()` when you have a single named vector and want key-value rows. Reach for `as_tibble()` when you have a list of equal-length columns or an existing frame to clean up.

**Can enframe() handle a data frame as input?**

No. `enframe()` errors if you pass a data frame, because a data frame is not a vector. The fix is to extract a column first with `df$col` or `pull()`, then call `enframe()`. If you instead want to round-trip a two-column tibble to a named vector and back, use `tibble::deframe()` to collapse and `enframe()` to restore.

**Why does enframe() return a list-column when I pass a list?**

`enframe()` preserves the input type. A list of vectors becomes a list-column rather than being flattened, so you can later use `tidyr::unnest()` to control the unfolding. This is the canonical pattern for working with `purrr::map()` output: keep the per-element shape until you explicitly unnest. If you want to flatten immediately, use `tibble(name = names(lst), value = unlist(lst))` or pipe `enframe(lst) |> unnest(value)`.

**Does enframe() coerce the name column to character?**

Yes, when the input vector is named. R vector names are always character strings, so `enframe()` carries that type through into the name column as `<chr>`. When the input is unnamed, the name column is `<int>` (the synthesized indices `1:length(x)`). Pass `name = NULL` if you want only the value column with no name column at all.

</content>
</invoke>