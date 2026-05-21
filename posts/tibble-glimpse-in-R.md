---
title: "tibble glimpse() in R: Compact Transposed Data Preview"
slug: "tibble-glimpse-in-R"
description: "Compact, transposed preview of any data frame in R with tibble glimpse(). Learn syntax, examples, comparisons with str() and head(), and pitfalls to avoid."
keywords: "tibble glimpse, glimpse function R, tibble glimpse examples, R glimpse data frame, dplyr glimpse, glimpse vs str R, glimpse output R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "glimpse()|tibble glimpse|tibble::glimpse()|glimpse function|glimpse a tibble"
auto_link_case_sensitive: true
target_keyword: "tibble glimpse"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble glimpse() in R: Compact Transposed Data Preview

<p class="lead">The <code>glimpse()</code> function in the tibble package prints a transposed, column-by-column preview of a data frame so you can see every column name, its type, and the first few values on a single screen.</p>

[QUICK ANSWER]
glimpse(mtcars)                          # default: console width
glimpse(iris, width = 60)                # narrower for small terminals
glimpse(starwars)                        # handles list-columns
mtcars |> glimpse()                      # pipe-friendly, returns invisibly
df |> filter(cyl == 4) |> glimpse()      # inspect mid-pipeline
glimpse(as_tibble(airquality))           # works on plain data.frames too

[DECISION TREE: Is glimpse() the right tool?]
- compact column-by-column overview: glimpse(df)
- full data with all rows: print(df, n = Inf)
- nested structure with attributes: str(df)
- first or last few rows in normal layout: head(df) or tail(df)
- numeric summaries per column: summary(df)
- interactive spreadsheet view: View(df)

## What glimpse() does in one sentence

**`glimpse()` is a transposed printer for data frames.** Instead of showing columns left-to-right and rows top-to-bottom like `print()`, it puts each column on its own line, so you can see all 60 columns of a wide tibble without horizontal scrolling. Each line shows the column name, its type in angle brackets, and as many values as fit in the console width.

It belongs to the tibble package and is re-exported by dplyr, so `library(tibble)` or `library(dplyr)` both bring it into scope. The function returns its input invisibly, which makes it safe to drop anywhere inside a pipeline without breaking the chain.

## Syntax

**`glimpse()` takes a data frame and one optional width argument.** The signature is short because the function exists to do one thing well: print a transposed summary.

```r title="Load tibble and call glimpse on mtcars"
library(tibble)

glimpse(mtcars)
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, ...
#> $ cyl  <dbl> 6, 6, 4, 6, 8, 6, 8, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, 4, ...
#> $ disp <dbl> 160.0, 160.0, 108.0, 258.0, 360.0, 225.0, 360.0, 146.7, ...
#> $ hp   <dbl> 110, 110, 93, 110, 175, 105, 245, 62, 95, 123, 123, 180, ...
#> $ drat <dbl> 3.90, 3.90, 3.85, 3.08, 3.71, 2.76, 3.15, 3.69, 3.92, ...
#> $ wt   <dbl> 2.620, 2.875, 2.320, 3.215, 3.440, 3.460, 3.570, 3.190, ...
#> $ qsec <dbl> 16.46, 17.02, 18.61, 19.44, 17.02, 20.22, 15.84, 20.00, ...
#> $ vs   <dbl> 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, ...
#> $ am   <dbl> 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, ...
#> $ gear <dbl> 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 4, ...
#> $ carb <dbl> 4, 4, 1, 1, 2, 1, 4, 2, 2, 4, 4, 3, 3, 3, 4, 4, 4, 1, ...
```

The full signature is:

```
glimpse(x, width = NULL, ...)
```

- `x` is a data frame, tibble, or any list-like object with named elements of equal length.
- `width` is the number of characters per line. Default is `getOption("width")`, usually 80 in scripts and wider in RStudio.
- `...` is forwarded to method-specific implementations and is normally unused.

The return value is `x` itself, returned invisibly. That is what makes `df |> glimpse() |> filter(...)` work without printing twice.

[KEY INSIGHT]
**Transposed printing trades row depth for column breadth.** `print()` shows the first 10 rows of every column; `glimpse()` shows every column with whatever fits in one console line. Wide data favors glimpse(); tall data favors print() or head().

## Examples

**Each example covers a use case glimpse() handles better than the alternatives.** Run them top-to-bottom in the live console; the WebR session keeps state between blocks.

### 1. Inspect a fresh dataset

```r title="Glimpse the airquality data frame"
library(tibble)

glimpse(airquality)
#> Rows: 153
#> Columns: 6
#> $ Ozone   <int> 41, 36, 12, 18, NA, 28, 23, 19, 8, NA, 7, 16, 11, ...
#> $ Solar.R <int> 190, 118, 149, 313, NA, NA, 299, 99, 19, 194, NA, ...
#> $ Wind    <dbl> 7.4, 8.0, 12.6, 11.5, 14.3, 14.9, 8.6, 13.8, 20.1, ...
#> $ Temp    <int> 67, 72, 74, 62, 56, 66, 65, 59, 61, 69, 74, 69, 66, ...
#> $ Month   <int> 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, ...
#> $ Day     <int> 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...
```

In two lines of output you learn the row count, the column count, every column name, every column type, and the first handful of values. The `NA` in `Ozone` is immediately visible, which is harder to spot in a regular `print()` of the first ten rows.

### 2. Compare types across columns

```r title="Glimpse iris and read off the column types"
glimpse(iris)
#> Rows: 150
#> Columns: 5
#> $ Sepal.Length <dbl> 5.1, 4.9, 4.7, 4.6, 5.0, 5.4, 4.6, 5.0, 4.4, 4.9, ...
#> $ Sepal.Width  <dbl> 3.5, 3.0, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, ...
#> $ Petal.Length <dbl> 1.4, 1.4, 1.3, 1.5, 1.4, 1.7, 1.4, 1.5, 1.4, 1.5, ...
#> $ Petal.Width  <dbl> 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.2, 0.1, 0.1, ...
#> $ Species      <fct> setosa, setosa, setosa, setosa, setosa, setosa, ...
```

The `<dbl>` and `<fct>` tags tell you four columns are doubles and one is a factor, without calling `class()` five times.

### 3. Inspect mid-pipeline

```r title="Drop glimpse into a dplyr chain to inspect intermediate state"
library(dplyr)

mtcars |>
  filter(cyl == 4) |>
  glimpse() |>
  select(mpg, hp, wt) |>
  head(3)
#> Rows: 11
#> Columns: 11
#> $ mpg  <dbl> 22.8, 24.4, 22.8, 32.4, 30.4, 33.9, 21.5, 27.3, 26.0, ...
#> $ cyl  <dbl> 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4
#> ...
#>                 mpg  hp    wt
#> Datsun 710     22.8  93 2.320
#> Merc 240D      24.4  62 3.190
#> Merc 230       22.8  95 3.135
```

Because `glimpse()` returns its input invisibly, the chain keeps working. You see the post-filter state without rewriting the pipeline.

[TIP]
**Wrap any pipeline step in `glimpse()` to debug shape without breaking flow.** It is the tidyverse equivalent of `print()`-debugging, and it always returns the same object it received.

### 4. Control the line width

```r title="Set width to widen or narrow the value preview"
glimpse(mtcars, width = 50)
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, 21.4, 18.7, ...
#> $ cyl  <dbl> 6, 6, 4, 6, 8, 6, 8, 4, 4, ...
#> $ disp <dbl> 160.0, 160.0, 108.0, 258.0, ...
```

A narrower `width` truncates each row earlier, which is useful when piping output into a fixed-width log file or rendering inside a notebook with a narrow column.

## glimpse() vs str(), print(), head() and summary()

**Each function answers a different question about a data frame.** Picking the right one saves console scrolling and decision fatigue.

| Function | Layout | Best for | Returns |
|----------|--------|----------|---------|
| `glimpse(df)` | One row per column, transposed | Column names + types + sample values at a glance | `df` invisibly |
| `str(df)` | Nested, attribute-aware | Internal structure of lists and complex objects | `NULL` invisibly |
| `print(df)` | Standard tabular, top N rows | Reading actual rows in tabular form | `df` invisibly |
| `head(df)` | First 6 rows tabular | Quick peek at the top of the data | First 6 rows |
| `summary(df)` | Per-column statistics | Distribution check (min, median, NAs) | A summary object |

Decision rule: reach for `glimpse()` when you want column-shaped information; reach for `head()` or `print()` when you want row-shaped information; reach for `summary()` when you want distributional information.

## Common pitfalls

1. **Confusing `glimpse()` output for the data itself.** The visible values are truncated previews, not the full column. Use `head()` or `pull()` if you need the actual values.
2. **Calling `glimpse()` on a non-data-frame list.** It still prints, but the layout assumes equal-length elements. Convert with `as_tibble()` first when the structure is irregular.
3. **Relying on `glimpse()` to detect type problems.** It shows the type R inferred, not the type you wanted. A column that should be numeric but contains `"N/A"` strings will print as `<chr>` without warning.

[WARNING]
**`glimpse()` does not signal coercion problems.** If `read_csv()` silently parsed a date column as character because of one malformed cell, `glimpse()` will show `<chr>` and move on. Pair it with `problems(df)` from readr when ingesting messy data.

## Try it yourself

**Try it:** Load the built-in `airquality` data, convert it to a tibble, then use `glimpse()` to identify which two columns contain missing values and what their R types are.

```r title="Your turn: glimpse airquality"
library(tibble)

# Convert airquality to a tibble, then glimpse it
ex_aq <- # your code here

# Identify columns with NA from the glimpse output
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(tibble)

ex_aq <- as_tibble(airquality)
glimpse(ex_aq)
#> Rows: 153
#> Columns: 6
#> $ Ozone   <int> 41, 36, 12, 18, NA, 28, 23, 19, 8, NA, ...
#> $ Solar.R <int> 190, 118, 149, 313, NA, NA, 299, 99, 19, ...
#> $ Wind    <dbl> 7.4, 8.0, 12.6, 11.5, 14.3, 14.9, 8.6, ...
#> $ Temp    <int> 67, 72, 74, 62, 56, 66, 65, 59, 61, 69, ...
#> $ Month   <int> 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, ...
#> $ Day     <int> 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...
```

**Explanation:** `Ozone` and `Solar.R` show `NA` values in the preview, and both are typed `<int>` (integer). The other four columns have no visible `NA`s in the first few values. For a definitive count, follow up with `colSums(is.na(ex_aq))`.

</details>

## Related tibble functions

- `as_tibble()` to promote a base `data.frame` or named list before glimpsing.
- `print.tbl_df()` for the standard tabular view of a tibble.
- `head()` and `tail()` for row-shaped peeks at the top and bottom.
- `str()` for attribute-aware structural inspection.
- `View()` to open an interactive spreadsheet view in RStudio.

For the full reference, see the [official tibble documentation](https://tibble.tidyverse.org/reference/glimpse.html).

## FAQ

**What is the difference between glimpse() and str() in R?**

`glimpse()` is optimized for data frames: it shows row count, column count, and a transposed sample of each column with a clean type tag. `str()` is a general-purpose inspector that walks any R object, including lists and nested attributes, and prints the underlying structure. For a data frame, `glimpse()` is almost always faster to read; for a fitted model or a nested list, `str()` is the right tool.

**Does glimpse() come from dplyr or tibble?**

The function lives in the tibble package and is re-exported by dplyr. Calling `library(tibble)` or `library(dplyr)` makes it available, and so does `library(tidyverse)`. The underlying implementation is in the pillar package, which handles the column formatting for both.

**Can I use glimpse() on a regular data.frame?**

Yes. `glimpse()` works on any object that behaves like a data frame, including base R `data.frame` objects, `data.table` objects, and tibbles. It does not require conversion. The output format is identical regardless of class.

**Why does glimpse() show fewer values than I expect?**

`glimpse()` fits as many values as it can into the console width. If your terminal is narrow, you see fewer values. Pass a larger `width` argument, for example `glimpse(df, width = 120)`, or widen the RStudio console pane.

**Does glimpse() print the entire column or just a sample?**

It prints only a sample sized to fit the line. The function never scrolls past one line per column, so very long character columns appear truncated. Use `pull(df, column)` or `df$column` when you need the full vector.
