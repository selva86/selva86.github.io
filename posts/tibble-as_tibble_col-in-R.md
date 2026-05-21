---
title: "tibble as_tibble_col() in R: Vector to One-Column Tibble"
slug: "tibble-as_tibble_col-in-R"
description: "Convert a vector into a one-column tibble in R with as_tibble_col(). Examples for naming the column, list-columns, pipelines, plus pitfalls and alternatives."
keywords: "tibble as_tibble_col, as_tibble_col function R, tibble as_tibble_col examples, R vector to tibble column, as_tibble_col vs enframe, one column tibble R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "as_tibble_col()|tibble as_tibble_col|tibble::as_tibble_col()|vector to tibble column|one column tibble"
auto_link_case_sensitive: true
target_keyword: "tibble as_tibble_col"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble as_tibble_col() in R: Vector to One-Column Tibble

<p class="lead">The <code>as_tibble_col()</code> function in the tibble package converts a vector into a one-column tibble. You pass any atomic vector or list and optionally a column name, and it returns a <code>tbl_df</code> with one column and as many rows as the input length.</p>

[QUICK ANSWER]
as_tibble_col(1:5)                                  # default column name "value"
as_tibble_col(1:5, column_name = "x")               # custom name
as_tibble_col(letters[1:3], column_name = "letter") # character vector
as_tibble_col(list(1:2, 3:4), column_name = "vals") # list-column
as_tibble_col(c(1.1, 2.2), column_name = "price")   # numeric column
as_tibble_col(c(TRUE, FALSE, NA), column_name = "ok") # logical with NA
1:10 |> as_tibble_col("n")                          # pipe-friendly

[DECISION TREE: Is as_tibble_col() the right tool?]
- one vector to a 1-column tibble: as_tibble_col(x, "name")
- one named vector to a 1-row tibble: as_tibble_row(c(a = 1, b = 2))
- named vector to a 2-column name-value tibble: tibble::enframe(x)
- multiple parallel vectors to a tibble: tibble(x = 1:3, y = 4:6)
- coerce an existing data.frame or list: as_tibble(df)
- add a vector as a new column to an existing tibble: dplyr::mutate(df, new = x)

## What as_tibble_col() does in one sentence

**`as_tibble_col()` lifts a single vector into a one-column tibble.** You pass the vector and an optional column name, and the function returns a `tbl_df` with one column and `length(x)` rows. Unlike `as_tibble_row()` (its row-shaped twin), the output is always a column.

The use case is shape conversion: a model output, a sampling result, or a single column extracted from elsewhere needs to enter a tidyverse pipeline as a tibble. `as_tibble_col()` is the most direct constructor for that one column, with control over the column name and no extra metadata columns.

## Syntax

**`as_tibble_col()` has two arguments and a fixed contract.** The input must be a vector (atomic or list), and the output is always a one-column tibble.

```r title="Load tibble and convert a vector"
library(tibble)

as_tibble_col(c(21.0, 22.8, 24.4, 19.7), column_name = "mpg")
#> # A tibble: 4 x 1
#>     mpg
#>   <dbl>
#> 1  21
#> 2  22.8
#> 3  24.4
#> 4  19.7
```

The full signature is:

```
as_tibble_col(x, column_name = "value")
```

- `x` is any atomic vector or list. Length is preserved as the row count.
- `column_name` is the name of the single output column. Defaults to `"value"`.

The result always has exactly one column and `class(c("tbl_df", "tbl", "data.frame"))`. Vector type carries through: a `<dbl>` vector produces a `<dbl>` column, a `<chr>` vector a `<chr>` column.

[TIP]
**Always set `column_name` explicitly.** The default `"value"` is fine for one-off work but collides quickly when joining or binding multiple one-column tibbles. Naming the column at construction time, `as_tibble_col(x, "price")`, prevents a downstream `rename()` and makes the tibble self-documenting when printed.

## Five common patterns

### 1. Default conversion with a custom name

```r title="Numeric vector to a named column"
ages <- c(34, 41, 29, 52, 38)
as_tibble_col(ages, column_name = "age")
#> # A tibble: 5 x 1
#>     age
#>   <dbl>
#> 1    34
#> 2    41
#> 3    29
#> 4    52
#> 5    38
```

The vector length becomes the row count, the type carries through, and the chosen `column_name` labels the single column. This is the canonical pattern when a function returns a bare vector but a downstream tidyverse step expects a tibble.

### 2. Character vector with explicit name

```r title="Character column"
codes <- c("AA", "BB", "CC", "DD")
as_tibble_col(codes, column_name = "code")
#> # A tibble: 4 x 1
#>   code
#>   <chr>
#> 1 AA
#> 2 BB
#> 3 CC
#> 4 DD
```

Character vectors produce `<chr>` columns. The same call shape works for factors, dates, and logicals. No coercion happens, so timezone and factor levels survive the conversion.

### 3. List input creates a list-column

```r title="List of vectors becomes a list-column"
batches <- list(c(0.1, 0.4), c(0.7, 0.9, 1.0), c(0.2))
as_tibble_col(batches, column_name = "samples")
#> # A tibble: 3 x 1
#>   samples
#>   <list>
#> 1 <dbl [2]>
#> 2 <dbl [3]>
#> 3 <dbl [1]>
```

When the input is a list, the output column is a list-column. Each element becomes one cell, so the row count equals the list length, not the total element count. Pair with `tidyr::unnest()` to expand the list-column into long form.

### 4. Pipe-friendly inside a pipeline

```r title="Use inside a pipeline"
library(tibble)

result <- rnorm(6, mean = 10, sd = 2) |>
  as_tibble_col("score") |>
  transform(rounded = round(score, 1))

head(result, 3)
#>      score rounded
#> 1 11.95711    12.0
#> 2 10.75479    10.8
#> 3 10.18962    10.2
```

`as_tibble_col()` accepts the piped input as its first argument and the column name as a positional second argument. This makes it a clean entry point into a pipeline that started with a bare numeric or character vector.

### 5. Pair with bind_cols to assemble a frame

```r title="Build a small tibble from independent vectors"
library(tibble)

id_col   <- as_tibble_col(101:105, "id")
score_col <- as_tibble_col(c(78, 91, 64, 88, 73), "score")
final <- cbind(id_col, score_col)
final
#>    id score
#> 1 101    78
#> 2 102    91
#> 3 103    64
#> 4 104    88
#> 5 105    73
```

When several independent functions each return a vector, lift each to a tibble and bind them column-wise. In practice `tibble(id = 101:105, score = c(78, 91, 64, 88, 73))` is shorter, but the `as_tibble_col()` approach scales when the vectors come from different sources and must be combined dynamically.

## as_tibble_col() vs enframe() vs tibble()

**The three constructors all produce small tibbles but differ in column count and required input.** `as_tibble_col()` always emits one column. `enframe()` emits two columns (name, value). `tibble()` builds from any number of named arguments.

| Behavior | `as_tibble_col()` | `enframe()` | `tibble()` |
|---|---|---|---|
| Input | Any vector or list | Vector (names optional) | Bare named arguments |
| Columns in output | Always 1 | Always 2 (name, value) | One per argument |
| Names of input used? | Discarded | Promoted to `name` column | From argument names |
| Row count | `length(x)` | `length(x)` | Length of longest input |
| Typical use | Shape lift, one column | Name-value lookup, frequency tables | Inline multi-column build |

Decision rule:

- Reach for `as_tibble_col()` when you have one vector and want one column.
- Reach for `enframe()` when a named vector should become a two-column key-value tibble.
- Reach for `tibble()` when several parallel vectors should sit side by side.

[KEY INSIGHT]
**`as_tibble_col()` and `as_tibble_row()` are mirror images.** Given the same input `c(a = 1, b = 2, c = 3)`, the row variant produces 1 row by 3 columns, and the col variant produces 3 rows by 1 column. Internalize that duality and you stop confusing them: pick `row()` when each element is a column, pick `col()` when each element is a row of one column.

## Common pitfalls

**Pitfall 1: input names are silently dropped.** If you pass a named vector, the names disappear; `as_tibble_col()` keeps only the values.

```r title="Names disappear, use enframe to keep them"
named_vec <- c(a = 1, b = 2, c = 3)
as_tibble_col(named_vec, "value")
#> # A tibble: 3 x 1
#>   value
#>   <dbl>
#> 1     1
#> 2     2
#> 3     3

# To preserve names, use enframe instead:
enframe(named_vec)
#> # A tibble: 3 x 2
#>   name  value
#>   <chr> <dbl>
#> 1 a         1
#> 2 b         2
#> 3 c         3
```

If the names carry meaning, `enframe()` is the right function. `as_tibble_col()` is for vectors where the position is all that matters.

**Pitfall 2: passing a data.frame errors.** The function is strict; it expects a vector or list, not an already-rectangular object.

```r title="Frames need as_tibble, not as_tibble_col"
# This errors:
# as_tibble_col(mtcars, "x")
# Error: `x` must be a vector.

# Fix: pull the column first, or use as_tibble for the whole frame
as_tibble_col(mtcars$mpg, "mpg") |> head(3)
#> # A tibble: 3 x 1
#>     mpg
#>   <dbl>
#> 1  21
#> 2  21
#> 3  22.8
```

Use `df$column` or `dplyr::pull(df, column)` to extract a single column first, then lift it with `as_tibble_col()`. For multi-column conversion, use `as_tibble()`.

[WARNING]
**Choose `column_name` carefully when joining downstream.** If two tibbles built with the default `"value"` get joined, the join key collides and either fails or auto-suffixes to `value.x` and `value.y`. Always pass an explicit `column_name` matching the role of the data ("price", "score", "code") so the column is ready for joins and pivots.

**Pitfall 3: list with length-mismatched elements works, atomic vector with mixed types coerces.** A list-column tolerates ragged elements, but if you pass an atomic vector built with `c()`, R coerces silently.

```r title="Coercion surprise"
# c() coerces numeric to character:
mixed <- c(1, 2, "three")
as_tibble_col(mixed, "x")
#> # A tibble: 3 x 1
#>   x
#>   <chr>
#> 1 1
#> 2 2
#> 3 three

# Use list() to preserve types as a list-column:
as_tibble_col(list(1, 2, "three"), "x")
#> # A tibble: 3 x 1
#>   x
#>   <list>
#> 1 <dbl [1]>
#> 2 <dbl [1]>
#> 3 <chr [1]>
```

The coercion to `<chr>` is `c()`'s doing, not `as_tibble_col()`'s. The function itself does not coerce; it inherits whatever type the input already has.

## Try it yourself

**Try it:** Take the `mpg` column from `mtcars`, lift it into a one-column tibble named `mileage`, then add a second column `band` that labels each value as `"low"`, `"mid"`, or `"high"` based on whether it is under 15, 15 to 25, or above 25. Save the result to `ex_bands`.

```r title="Your turn: lift mpg and add a band column"
library(tibble)

# Try it: convert mpg to a tibble column and classify
ex_bands <- # your code here

head(ex_bands, 3)
#> Expected: 3 rows, 2 columns (mileage, band)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_bands <- as_tibble_col(mtcars$mpg, "mileage")
ex_bands$band <- ifelse(ex_bands$mileage < 15, "low",
                 ifelse(ex_bands$mileage <= 25, "mid", "high"))
head(ex_bands, 3)
#> # A tibble: 3 x 2
#>   mileage band
#>     <dbl> <chr>
#> 1    21   mid
#> 2    21   mid
#> 3    22.8 mid
```

**Explanation:** `as_tibble_col()` does the shape lift from the bare numeric vector returned by `mtcars$mpg` into a tibble. After that, standard column-add syntax appends the classification, demonstrating how `as_tibble_col()` plugs cleanly into downstream tidyverse-or-base assembly.

</details>

## Related tibble functions

After mastering `as_tibble_col()`, look at:

- `as_tibble_row()`: the row-shaped twin, turns a named vector into a one-row tibble where each element becomes a column.
- `enframe()`: turn a named vector into a two-column tibble with `name` and `value` columns, preserving the names.
- `tibble()`: build a tibble inline from raw named vectors of any length.
- `as_tibble()`: coerce an existing data.frame, list, or matrix into a tibble.
- `tibble::deframe()`: the inverse of `enframe()`, collapses a two-column tibble back to a named vector.
- `dplyr::pull()`: extract a single column from a tibble as a bare vector, often the input to `as_tibble_col()`.

For the full API, the [official as_tibble_col() documentation](https://tibble.tidyverse.org/reference/as_tibble.html#row-and-column-constructors) lists every method and option.

## FAQ

**What is the difference between as_tibble_col() and enframe() in R?**

`as_tibble_col()` produces a one-column tibble and discards any names on the input vector. `enframe()` produces a two-column tibble with `name` and `value` columns, promoting the input vector's names into the first column. Reach for `as_tibble_col()` when only the values matter and you want a clean single column. Reach for `enframe()` when the names carry meaning, such as a named result from `table()` or a lookup vector where each entry is a key-value pair.

**Why does as_tibble_col() drop the names of my input vector?**

The function is designed for shape lifting, not for preserving metadata. Its single column holds values, not labels; if names were kept, they would have nowhere to live. If you need them, use `enframe()` instead, which writes the names into a dedicated `name` column. You can also bind them back manually with `tibble(name = names(x), value = x)`, but `enframe()` is the idiomatic way.

**Can I use as_tibble_col() inside a pipeline?**

Yes. The function takes the vector as its first argument, so it composes naturally with `|>` and `%>%`: `rnorm(10) |> as_tibble_col("z")`. Pair it with `dplyr::mutate()` or `tidyr::pivot_*` afterwards to enrich the column or reshape further. This is the most common production pattern: pull a vector from somewhere, lift it, then continue the pipeline.

**How is as_tibble_col() different from tibble()?**

`tibble()` builds from named arguments, one per column: `tibble(x = 1:3, y = 4:6)`. `as_tibble_col()` lifts one existing vector into one column: `as_tibble_col(1:3, "x")`. Use `as_tibble_col()` for a single dynamic vector. Use `tibble()` when several parallel vectors and their names are known statically.

**Can as_tibble_col() create a list-column?**

Yes. Pass a list rather than an atomic vector, and the function produces a list-column where each list element becomes one cell. `as_tibble_col(list(1:2, 3:4), "groups")` creates a 2-row tibble with one list-column holding the vectors. Useful when each row carries a nested object such as a sub-sample or smaller tibble.
