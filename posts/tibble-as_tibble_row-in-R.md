---
title: "tibble as_tibble_row() in R: One Row at a Time"
slug: "tibble-as_tibble_row-in-R"
description: "Convert a named vector or list into a single-row tibble in R with as_tibble_row(). Examples for loops, list-columns, and rowwise records, plus pitfalls."
keywords: "tibble as_tibble_row, as_tibble_row function R, tibble as_tibble_row examples, R named vector to row, as_tibble_row vs as_tibble, one row tibble R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "as_tibble_row()|tibble as_tibble_row|tibble::as_tibble_row()|named vector to tibble|one row tibble"
auto_link_case_sensitive: true
target_keyword: "tibble as_tibble_row"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble as_tibble_row() in R: One Row at a Time

<p class="lead">The <code>as_tibble_row()</code> function in the tibble package converts a named vector or a length-1 list into a one-row tibble, with each element becoming a column. It is the standard tool for building tibbles record-by-record from named scalars.</p>

[QUICK ANSWER]
as_tibble_row(c(x = 1, y = 2, z = 3))         # named vector to 1 row
as_tibble_row(list(a = 1, b = "hi"))          # mixed-type named list
as_tibble_row(c(1, 2, 3))                     # errors: needs names
as_tibble_row(c(a = 1, a = 2), .name_repair = "unique")  # dedupe names
purrr::map_dfr(seq, ~ as_tibble_row(.x))      # row-by-row build
as_tibble_row(list(id = 1, vals = list(1:3))) # list-column in one row
as_tibble_row(setNames(1:3, c("a","b","c")))  # vector via setNames

[DECISION TREE: Is as_tibble_row() the right tool?]
- one named vector to a 1-row tibble: as_tibble_row(c(a = 1, b = 2))
- one named vector to a 1-column tibble: as_tibble_col(c(a = 1, b = 2))
- many named vectors to a multi-row tibble: purrr::map_dfr(list, as_tibble_row)
- columns from raw vectors of equal length: tibble(x = 1:3, y = 4:6)
- coerce an existing data.frame or list: as_tibble(df)
- pivot a wide row into long form afterwards: tidyr::pivot_longer()

## What as_tibble_row() does in one sentence

**`as_tibble_row()` turns a single named record into a one-row tibble.** You pass a named vector or a length-1 list, and the function returns a `tbl_df` with one row and as many columns as there are names. Unlike `tibble()` or `as_tibble()`, this function is opinionated about producing exactly one row.

The use case is record-shaped data: a function returning named summary statistics, a dictionary from a JSON API, an iteration inside a `for` loop that computes a fresh record. `as_tibble_row()` lifts the wide-by-name shape into the tidyverse without manual reshaping.

## Syntax

**`as_tibble_row()` is a thin wrapper over `as_tibble()` with `.rows = 1`.** It has a fixed contract: input must be named, output is always one row.

```r title="Load tibble and convert a record"
library(tibble)

as_tibble_row(c(mpg = 21.0, cyl = 6, hp = 110, wt = 2.62))
#> # A tibble: 1 x 4
#>     mpg   cyl    hp    wt
#>   <dbl> <dbl> <dbl> <dbl>
#> 1    21     6   110  2.62
```

The full signature is:

```
as_tibble_row(x, .name_repair = c("check_unique", "unique", "universal", "minimal"))
```

- `x` is a named vector or a list (each element length 1, or a list itself for list-columns).
- `.name_repair` controls duplicate or syntactically invalid names: `"check_unique"` (default, errors on duplicates), `"unique"` (auto-suffix), `"minimal"` (keep as-is), `"universal"` (also fix syntax).

The result always has exactly one row and `class(c("tbl_df", "tbl", "data.frame"))`.

[TIP]
**Use `as_tibble_row()` over manual `tibble()` calls when names come from data.** Writing `tibble(mpg = 21, cyl = 6, hp = 110)` requires you to know the names at write time. `as_tibble_row(record)` works with whatever names the upstream code produced, which is exactly what you want inside `lapply()`, `purrr::map()`, or any pipeline that processes records dynamically.

## Five common patterns

### 1. Convert a named numeric vector

```r title="Summary stats as a 1-row tibble"
stats <- c(mean = mean(mtcars$mpg), sd = sd(mtcars$mpg), n = nrow(mtcars))
as_tibble_row(stats)
#> # A tibble: 1 x 3
#>    mean    sd     n
#>   <dbl> <dbl> <dbl>
#> 1  20.1  6.03    32
```

Every element of the vector becomes one column. The numeric type carries through, so column types match the source vector exactly.

### 2. Convert a mixed-type named list

```r title="Heterogeneous record"
record <- list(id = 42, name = "Ana", active = TRUE, score = 91.5)
as_tibble_row(record)
#> # A tibble: 1 x 4
#>      id name  active score
#>   <dbl> <chr> <lgl>  <dbl>
#> 1    42 Ana   TRUE    91.5
```

Lists are the natural input when columns mix types. Each element keeps its own type, so the resulting tibble has `<dbl>`, `<chr>`, and `<lgl>` columns without coercion.

### 3. Build row-by-row in a loop

```r title="Loop that grows a tibble one record at a time"
rows <- lapply(1:3, function(i) {
  as_tibble_row(c(iter = i, square = i^2, cube = i^3))
})
do.call(rbind, rows)
#> # A tibble: 3 x 3
#>    iter square  cube
#>   <dbl>  <dbl> <dbl>
#> 1     1      1     1
#> 2     2      4     8
#> 3     3      9    27
```

This is the classic record-accumulator pattern. Each iteration produces one row; `rbind()` stitches them into the final frame. The `dplyr::bind_rows()` and `purrr::map_dfr()` shortcuts (next pattern) do the same thing more concisely.

### 4. Combine with purrr::map_dfr

```r title="map_dfr returns the stacked tibble directly"
library(purrr)

result <- map_dfr(1:3, ~ as_tibble_row(c(iter = .x, square = .x^2)))
result
#> # A tibble: 3 x 2
#>    iter square
#>   <dbl>  <dbl>
#> 1     1      1
#> 2     2      4
#> 3     3      9
```

`map_dfr()` calls the function for each input, expects a tibble row out, and binds the results. Paired with `as_tibble_row()`, it replaces dozens of lines of `for`-loop bookkeeping with one expression.

### 5. Create a list-column inside the row

```r title="One row carrying a vector in a single cell"
as_tibble_row(list(id = 1, label = "batch_A", samples = list(c(0.1, 0.5, 0.9))))
#> # A tibble: 1 x 3
#>      id label   samples
#>   <dbl> <chr>   <list>
#> 1     1 batch_A <dbl [3]>
```

When a list element is itself a list of length 1, that cell becomes a list-column. This is how you store nested objects (vectors, models, even tibbles) inside a single row, ready for `tidyr::unnest()` or `purrr::map()` later.

## as_tibble_row() vs as_tibble() vs tibble()

**The three constructors differ in what they accept and how many rows they emit.** `as_tibble_row()` always produces one row from a named record. `as_tibble()` coerces an existing rectangular object preserving its shape. `tibble()` builds from raw vectors with the row count determined by the longest input.

| Behavior | `as_tibble_row()` | `as_tibble()` | `tibble()` |
|---|---|---|---|
| Input | Named vector or list | data.frame, list, matrix | Bare named vectors |
| Rows in output | Always 1 | Same as input | Length of longest input |
| Names required | Yes (errors without) | Yes (or repaired) | From argument names |
| Mixed types | Yes (via list input) | Yes | Yes |
| Recycling | None | None | Length 1 to longest |
| Typical use | One record at a time | Coerce existing object | Inline construction |

Decision rule:

- Reach for `as_tibble_row()` when each unit of work produces a named scalar record.
- Reach for `tibble()` when you have parallel vectors and know their names statically.
- Reach for `as_tibble()` when you already have a data.frame, list, or matrix to promote.

[KEY INSIGHT]
**`as_tibble_row()` is the natural pair to `purrr::map_dfr()`.** Together they form the canonical "for-each-input, build-a-record, bind-them-all" pattern. Once you internalize that pairing, most loops that accumulate results collapse into a single `map_dfr()` call, with `as_tibble_row()` doing the per-iteration shape lift.

## Common pitfalls

**Pitfall 1: unnamed input errors immediately.** The function requires names; bare numeric vectors trigger a hard error, not a fallback.

```r title="Names are mandatory"
# This errors:
# as_tibble_row(c(1, 2, 3))
# Error: All columns in a tibble must be named.

# Fix: add names before calling
as_tibble_row(setNames(c(1, 2, 3), c("a", "b", "c")))
#> # A tibble: 1 x 3
#>       a     b     c
#>   <dbl> <dbl> <dbl>
#> 1     1     2     3
```

`setNames()` is the quickest fix. For programmatic naming, build the names vector first and apply it before the conversion.

**Pitfall 2: vector elements longer than 1 break the 1-row contract.** Every element of a vector input must be a scalar, and every list element must be length 1 (or a wrapped list for list-columns).

```r title="Length-1 only"
# This errors:
# as_tibble_row(list(a = 1, b = c(2, 3)))
# Error: Tibble columns must have compatible sizes.

# Fix 1: wrap the multi-value element in list() for a list-column
as_tibble_row(list(a = 1, b = list(c(2, 3))))
#> # A tibble: 1 x 2
#>       a         b
#>   <dbl>    <list>
#> 1     1 <dbl [2]>
```

The error message can confuse newcomers because it talks about "compatible sizes" while the function is explicitly designed for one row. The fix is always: either reduce the long element to a scalar, or wrap it in `list()` to make it a list-column.

[WARNING]
**`as_tibble_row()` is NOT the same as `as_tibble()` on a list.** Calling `as_tibble(list(a = 1, b = 2))` returns a 1-row, 2-column tibble in the common case, but if any element has length greater than 1 it creates multiple rows. `as_tibble_row()` will error in that case. Use the row variant when you need a guarantee that the output is exactly one row, no matter what the input looks like.

**Pitfall 3: forgetting to bind the rows.** A single `as_tibble_row()` call inside a loop is useless without an aggregator. Always pair it with `do.call(rbind, ...)`, `dplyr::bind_rows()`, or `purrr::map_dfr()`.

## Try it yourself

**Try it:** For each cylinder count in `mtcars` (4, 6, 8), compute the mean mpg and number of cars, then assemble the three records into a single tibble called `ex_summary`.

```r title="Your turn: per-cyl summary using as_tibble_row"
library(tibble)
library(purrr)

# Try it: build a 3-row tibble from per-cyl records
ex_summary <- # your code here

ex_summary
#> Expected: 3 rows, 3 columns (cyl, mean_mpg, n)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_summary <- map_dfr(c(4, 6, 8), function(cyl_value) {
  subset_rows <- mtcars[mtcars$cyl == cyl_value, ]
  as_tibble_row(c(
    cyl = cyl_value,
    mean_mpg = mean(subset_rows$mpg),
    n = nrow(subset_rows)
  ))
})
ex_summary
#> # A tibble: 3 x 3
#>     cyl mean_mpg     n
#>   <dbl>    <dbl> <dbl>
#> 1     4     26.7    11
#> 2     6     19.7     7
#> 3     8     15.1    14
```

**Explanation:** `map_dfr()` walks the three cylinder values, calls the function once per value, and binds the resulting one-row tibbles into a 3-row frame. `as_tibble_row()` does the per-iteration shape lift from named numeric vector to one row.

</details>

## Related tibble functions

After mastering `as_tibble_row()`, look at:

- `as_tibble_col()`: the column-shaped twin, turns a named vector into a one-column tibble with `name` and `value` columns.
- `tibble()`: build a tibble inline from raw named vectors of any length.
- `as_tibble()`: coerce an existing data.frame, list, or matrix into a tibble.
- `tribble()`: row-by-row construction with a literal syntax, good for fixed lookup tables.
- `enframe()`: another named-vector entry point, but always emits two columns (name, value).
- `add_row()`: append a single record to an existing tibble.

For the full API, the [official as_tibble_row() documentation](https://tibble.tidyverse.org/reference/as_tibble.html#row-and-column-constructors) lists every method and option.

## FAQ

**What is the difference between as_tibble_row() and as_tibble() in R?**

`as_tibble_row()` always returns exactly one row, taking a named vector or length-1 list as input. `as_tibble()` is the general coercer for already-rectangular objects (data frames, matrices, lists of equal-length vectors) and returns as many rows as the input shape implies. Reach for `as_tibble_row()` inside loops or `map_dfr()` calls where each unit of work produces one record. Reach for `as_tibble()` when you have a complete data frame or list to promote into the tidyverse.

**Why does as_tibble_row() error on unnamed input?**

Tibbles require named columns, and `as_tibble_row()` maps each input element to a column. With no names, the function fails fast rather than inventing labels like `V1`, `V2`. Fix by attaching names with `setNames(x, c("a", "b", "c"))` or `purrr::set_names()` before passing the vector. If the data has no meaningful names, `tibble()` with positional construction is more honest about what you are doing.

**How do I create a list-column with as_tibble_row()?**

Wrap the multi-element value in `list()` so it becomes a single list element of length 1. `as_tibble_row(list(id = 1, vals = list(c(1, 2, 3))))` puts the three-element numeric vector inside one cell. Without the outer `list()`, the function errors with a length-mismatch message. List-columns are the standard way to nest vectors, models, or other tibbles inside one row.

**How is as_tibble_row() different from tibble()?**

`tibble()` builds from raw named arguments: `tibble(a = 1:3, b = 4:6)`. You write names and values literally. `as_tibble_row()` takes one already-constructed named object and lifts it into a one-row tibble. Use `tibble()` when names are known at write time. Use `as_tibble_row()` when names come from upstream data, often inside a loop or `map()` producing one record per iteration.

**Can I use as_tibble_row() with a data.frame row?**

Indirectly. Extract a single row as a named list with `as.list(df[i, ])`, then pass it in: `as_tibble_row(as.list(mtcars[1, ]))`. Useful for plucking one record from a larger frame and re-emitting it as a standalone tibble, for example to bind into a different schema or to attach as a manifest.
