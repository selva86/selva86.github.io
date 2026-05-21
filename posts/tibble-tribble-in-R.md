---
title: "tibble tribble() in R: Build Tibbles Row by Row"
slug: "tibble-tribble-in-R"
description: "Build small tibbles row-by-row in R with tribble() from the tibble package. Learn formula syntax, examples, comparison with tibble(), and common pitfalls."
keywords: "tibble tribble, tribble function R, R tribble examples, tribble vs tibble, tribble tidyverse, create tibble row by row, tibble package R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "tribble()|tibble tribble|tibble::tribble()|row-by-row tibble|tribble function"
auto_link_case_sensitive: true
target_keyword: "tibble tribble"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble tribble() in R: Build Tibbles Row by Row

<p class="lead">The <code>tribble()</code> function in the tibble package builds tibbles row-by-row using a transposed formula syntax, ideal for small lookup tables, fixtures, and test data where the layout reads naturally as rows.</p>

[QUICK ANSWER]
tribble(~x, ~y, 1, "a", 2, "b")            # 2 rows, 2 cols
tribble(~name, ~score, "Ana", 91)          # one row
tribble(~id, ~tag, 1, "ok", 2, NA)         # NA values allowed
tribble(~a, ~b, ~c, 1, 2, 3, 4, 5, 6)      # 3 cols, 2 rows
tribble(~`bad name`, ~x, 1, 2)             # back-ticked names
tribble(~k, ~v, "a", list(1:3))            # list-columns work
tribble(~x, ~y)                            # empty 0-row shell

[DECISION TREE: Is tribble() the right tool?]
- author a small table row-by-row: tribble(~x, ~y, 1, "a", 2, "b")
- build column-by-column from vectors: tibble(x = 1:3, y = letters[1:3])
- convert an existing data.frame: as_tibble(df)
- read a table from a file: readr::read_csv("file.csv")
- promote a named vector to a tibble: enframe(c(a=1, b=2))
- generate many synthetic rows: tibble(x = 1:1000, y = rnorm(1000))
- add rows to an existing tibble: add_row(df, x = 4, y = "d")

## What tribble() does in one sentence

**`tribble()` builds a tibble row-by-row using a transposed layout.** You pass column names as formulas (`~name`), then list the cell values in row-major order. The function returns a tibble with one row per group of values that matches the column count.

The name is short for "transposed tibble". Where `tibble()` reads column-first (you write a whole column, then the next column), `tribble()` reads row-first (you write the headers, then row 1's values, then row 2's). For small tables you would otherwise type by hand, this layout matches how the data looks on paper, which is why test fixtures, lookup tables, and documentation examples lean on it.

## Syntax

**`tribble()` accepts formula-headers followed by cell values.** Headers start with `~` and are listed first. Cell values follow, separated by commas, in row-major order: row 1 column 1, row 1 column 2, then row 2 column 1, and so on.

```r title="Load tibble and author a small table"
library(tibble)

t1 <- tribble(
  ~id, ~name,  ~score,
   1,  "Ana",   91,
   2,  "Bo",    85,
   3,  "Cy",    78
)
t1
#> # A tibble: 3 x 3
#>      id name  score
#>   <dbl> <chr> <dbl>
#> 1     1 Ana      91
#> 2     2 Bo       85
#> 3     3 Cy       78
```

The full signature is:

```
tribble(...)
```

There is only one argument: the variadic `...`. tribble decides where headers end and rows begin by reading until it sees a non-formula value. After that, every value is a cell. Column types are inferred from the values, using the same coercion rules as `c()`.

[TIP]
**Align cells visually for readability.** The whole point of `tribble()` is that the source code looks like the table. Use spaces to align cells under their column headers. Editors with a fixed-width font let you see the table shape at a glance, which catches missing or extra values immediately.

## Six common patterns

### 1. Author a small lookup table

```r title="Country code to region map"
regions <- tribble(
  ~code, ~country,    ~region,
  "IN",  "India",     "Asia",
  "NO",  "Norway",    "Europe",
  "PE",  "Peru",      "South America",
  "JP",  "Japan",     "Asia"
)
regions
#> # A tibble: 4 x 3
#>   code  country region
#>   <chr> <chr>   <chr>
#> 1 IN    India   Asia
#> 2 NO    Norway  Europe
#> 3 PE    Peru    South America
#> 4 JP    Japan   Asia
```

Lookup tables are the canonical use case. Storing the mapping inline keeps the join visible in the same script that uses it.

### 2. Build a fixture for tests

```r title="A small fixed dataset for unit tests"
fx <- tribble(
  ~input, ~expected,
   0,      0,
   1,      1,
   4,      2,
   9,      3,
   16,     4
)
fx
#> # A tibble: 5 x 2
#>   input expected
#>   <dbl>    <dbl>
#> 1     0        0
#> 2     1        1
#> 3     4        2
#> 4     9        3
#> 5    16        4
```

Each row is a test case. Iterating with `purrr::pmap()` or a simple `for` loop checks them all.

### 3. Mix types and NA values

```r title="Different types per column"
events <- tribble(
  ~id, ~ts,                ~ok,    ~note,
  1,   "2026-05-22 09:15",  TRUE,   "first run",
  2,   "2026-05-22 09:17",  FALSE,  NA,
  3,   "2026-05-22 09:30",  TRUE,   "retry"
)
events
#> # A tibble: 3 x 4
#>      id ts                  ok    note
#>   <dbl> <chr>               <lgl> <chr>
#> 1     1 2026-05-22 09:15    TRUE  first run
#> 2     2 2026-05-22 09:17    FALSE NA
#> 3     3 2026-05-22 09:30    TRUE  retry
```

`NA` works as a value. Columns infer their type from the non-NA cells.

### 4. Non-syntactic column names with back-ticks

```r title="Spaces and special chars need back-ticks"
ratings <- tribble(
  ~`product id`, ~`rating (1-5)`,
   "A-001",       4,
   "A-002",       5,
   "B-100",       3
)
ratings
#> # A tibble: 3 x 2
#>   `product id` `rating (1-5)`
#>   <chr>                 <dbl>
#> 1 A-001                     4
#> 2 A-002                     5
#> 3 B-100                     3
```

`tribble()` keeps these names exactly. No `make.names()` mangling.

### 5. List-columns inside a row layout

```r title="A column whose cells are vectors"
nested <- tribble(
  ~group, ~values,
  "x",    c(1, 2, 3),
  "y",    c(10, 20),
  "z",    c(100)
)
nested
#> # A tibble: 3 x 2
#>   group values
#>   <chr> <list>
#> 1 x     <dbl [3]>
#> 2 y     <dbl [2]>
#> 3 z     <dbl [1]>
```

Each cell holds an R object. Useful for ragged data or nested model results.

### 6. Empty-shell tibble with named columns

```r title="Zero rows but known schema"
empty <- tribble(
  ~id, ~name, ~score
)
empty
#> # A tibble: 0 x 3
#> # i 3 variables: id <lgl>, name <lgl>, score <lgl>
```

Useful when a function should return a typed empty frame. Column types default to logical until you populate the first row.

## tribble() vs tibble() vs data.frame()

**Use `tribble()` when the table is small and the visual layout matters.** Below roughly 30 rows or wherever the author wants the code to mirror the printed table, `tribble()` reads more naturally than its column-first cousin.

| Behavior | `tribble()` | `tibble()` | `data.frame()` |
|---|---|---|---|
| Layout | Row-by-row | Column-by-column | Column-by-column |
| Header syntax | `~name` formulas | `name = vector` | `name = vector` |
| Best for | Small tables, fixtures | Vectors of any length | Legacy code |
| Refer to prior col | No | Yes | No |
| Type coercion | Per column from values | Per vector | Per vector |
| Row names | None | None | Always |
| String to factor | Never | Never | Was default before R 4.0 |

When to use which:

- Use `tribble()` for small inline tables that should read like a printed table.
- Use `tibble()` when you already have vectors or want to compute one column from another.
- Use `data.frame()` when you need legacy compatibility or want to avoid the tibble dependency.

[KEY INSIGHT]
**`tribble()` is a writing tool, not a runtime tool.** Once the table grows past 30 rows, the formula layout stops helping and starts hiding mistakes. Past that size, switch to a CSV file plus `read_csv()`, or generate the rows programmatically with `tibble()`. The row-by-row layout earns its keep on tables you would otherwise type into a Markdown document or paste from a spreadsheet.

## Common pitfalls

**Pitfall 1: wrong number of values.** Values must be a multiple of the column count. Anything else errors.

```r title="A missing value breaks the row pattern"
# This would error:
# tribble(~x, ~y, 1, 2, 3)
# Error: Data must be rectangular.

# Fix: add the missing value (use NA if unknown)
tribble(~x, ~y, 1, 2, 3, NA)
#> # A tibble: 2 x 2
#>       x     y
#>   <dbl> <dbl>
#> 1     1     2
#> 2     3    NA
```

**Pitfall 2: forgetting the `~` on headers.** `tribble()` decides where headers end by scanning for the first non-formula value. A header without `~` becomes data, shifting every column.

```r title="A bare header silently corrupts the table"
# Wrong: 'y' is treated as a value, not a header
# tribble(~x, "y", 1, 2)
# # A tibble: 1 x 2
# #   x     `"y"`
# #   <chr> <chr>
# # 1 1     2

# Right: every header gets ~
tribble(~x, ~y, 1, 2)
#> # A tibble: 1 x 2
#>       x     y
#>   <dbl> <dbl>
#> 1     1     2
```

[WARNING]
**Mixed types in one column coerce up.** A column with both numbers and strings becomes character. `tribble(~v, 1, "two")` gives `v` as `<chr>`, not a mix. Check the printed column type if a downstream join or filter fails unexpectedly.

**Pitfall 3: trying to use it for large data.** `tribble()` parses every value at call time. For tables past a few hundred rows, prefer a CSV file with `read_csv()` or a vector-based `tibble()` call. Generating thousands of rows via `tribble()` is slow and brittle.

## Try it yourself

**Try it:** Build a tibble named `ex_students` with three rows and three columns (`name`, `score`, `passed`). Use the values `Aki/88/TRUE`, `Mei/55/FALSE`, `Sol/72/TRUE`.

```r title="Your turn: author a small students tibble"
# Try it: 3 students, score and pass flag
ex_students <- # your code here

ex_students
#> Expected: 3 rows, 3 columns (name, score, passed)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_students <- tribble(
  ~name,  ~score, ~passed,
  "Aki",   88,    TRUE,
  "Mei",   55,    FALSE,
  "Sol",   72,    TRUE
)
ex_students
#> # A tibble: 3 x 3
#>   name  score passed
#>   <chr> <dbl> <lgl>
#> 1 Aki      88 TRUE
#> 2 Mei      55 FALSE
#> 3 Sol      72 TRUE
```

**Explanation:** Every header starts with `~`. Cell values follow in row-major order, three values per row to match three headers. Column types (`<chr>`, `<dbl>`, `<lgl>`) are inferred from the values.

</details>

## Related tibble functions

After `tribble()`, look at:

- `tibble()`: build a tibble column-by-column from named vectors.
- `as_tibble()`: convert a `data.frame`, matrix, or list into a tibble.
- `enframe()`: convert a named vector into a two-column tibble.
- `add_row()` and `add_column()`: extend an existing tibble with more rows or columns.
- `glimpse()`: print a tibble structure horizontally, one line per column.

For the full constructor reference, see the [official tibble documentation](https://tibble.tidyverse.org/reference/tribble.html).

## FAQ

**What is the difference between tibble() and tribble() in R?**

`tibble()` builds a data frame column-by-column from named vectors: `tibble(x = 1:3, y = c("a", "b", "c"))`. `tribble()` builds the same kind of data frame row-by-row using formula headers: `tribble(~x, ~y, 1, "a", 2, "b", 3, "c")`. Both return an object of class `tbl_df`. Use `tribble()` for small inline tables where the source code should mirror the printed layout. Use `tibble()` when you already have vectors or want a column to reference a prior one.

**How do you create a tibble row by row in R?**

Call `tribble()` with column headers as formulas, then list cell values in row-major order. Example: `tribble(~id, ~name, 1, "Ana", 2, "Bo")` creates a two-row, two-column tibble. The number of cell values must be a multiple of the number of headers, otherwise you get an "Data must be rectangular" error. Align cells visually under their headers so the source reads like the printed table.

**Is tribble() part of base R?**

No. `tribble()` lives in the tibble package, which is part of the tidyverse. Install it with `install.packages("tibble")` or get it as part of `install.packages("tidyverse")`. After loading with `library(tibble)`, the function is available directly. The base R equivalent would be writing out a `data.frame()` call column-by-column, which is harder to read for small fixed tables.

**Can tribble() handle NA and list-columns?**

Yes to both. Bare `NA` is a valid cell value, and the column type is inferred from the non-NA cells: `tribble(~x, 1, NA, 3)` gives an `<dbl>` column. List-columns work by wrapping cell values in `list()`: `tribble(~k, ~v, "a", list(1:3))`. The cells store the R object as-is, useful for nested data or per-row model outputs.

**Why use tribble() instead of read_csv() for small tables?**

For tables under about 30 rows that ship with code (lookup maps, test fixtures, examples), `tribble()` keeps the data in the same file as the code that uses it. There is no file to ship, no path to manage, and the table is version-controlled along with the script. Beyond 30 rows the visual layout stops paying off; switch to a CSV plus `read_csv()` at that point.
