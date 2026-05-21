---
title: "tibble rownames_to_column() in R: Move Rownames to Column"
slug: "tibble-rownames_to_column-in-R"
description: "Move data frame row names into a named column with tibble rownames_to_column() in R. Learn syntax, default var name, mtcars walkthrough, and pitfalls."
keywords: "tibble rownames_to_column, rownames_to_column function R, tibble rownames_to_column examples, R convert rownames to column, move rownames to column R, rownames_to_column tidyverse, rownames_to_column mtcars"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "rownames_to_column()|tibble rownames_to_column|tibble::rownames_to_column()|rownames to column|move rownames to column"
auto_link_case_sensitive: true
target_keyword: "tibble rownames_to_column"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble rownames_to_column() in R: Move Rownames to Column

<p class="lead">The <code>rownames_to_column()</code> function in the tibble package moves a data frame's row names into a regular column and returns a tibble, with the <code>var</code> argument controlling the new column name (default <code>"rowname"</code>).</p>

[QUICK ANSWER]
rownames_to_column(mtcars)                          # default var = "rowname"
rownames_to_column(mtcars, var = "model")           # custom column name
mtcars |> rownames_to_column("model")               # pipe-friendly
rownames_to_column(as.data.frame(x))                # works on data.frame, not matrix
df |> rownames_to_column() |> as_tibble()           # already a tibble after the call
rownames_to_column(df, var = "id") |> head(3)       # chain into further steps
column_to_rownames(df, "id")                        # reverse operation

[DECISION TREE: Is rownames_to_column() the right tool?]
- move rownames to a column: rownames_to_column(df, "id")
- move a column back to rownames: column_to_rownames(df, "id")
- check if a data frame has rownames: has_rownames(df)
- drop rownames entirely: remove_rownames(df)
- add a sequential id column: rowid_to_column(df, "id")
- get rownames as a character vector: rownames(df)
- convert data frame to tibble (drops rownames): as_tibble(df)

## What rownames_to_column() does in one sentence

**`rownames_to_column()` returns a tibble with the source data frame's row names moved into a new column at the leftmost position.** You pass a data frame whose row names you want to preserve, and optionally a `var` argument naming the new column. The function returns a tibble, so existing row names are discarded after the move and the result has integer row numbers from one upward.

The function lives in the tibble package and exists because tibbles intentionally do not support row names. When you convert a base R data frame with meaningful row names (like `mtcars`, where each row is a car model) directly with `as_tibble()`, the model labels vanish. `rownames_to_column()` is the safe migration path: lift the labels into a real column first, then convert.

## Syntax

**`rownames_to_column()` takes the data frame first, then an optional `var` string naming the new column.** The input must be a `data.frame` with non-trivial row names; tibbles are rejected because they have no row names to move.

```r title="Load tibble and inspect mtcars row names"
library(tibble)
library(dplyr)

class(mtcars)
#> [1] "data.frame"

head(rownames(mtcars), 3)
#> [1] "Mazda RX4"     "Mazda RX4 Wag" "Datsun 710"
```

The full signature is:

```
rownames_to_column(.data, var = "rowname")
```

Arguments:

- `.data`: a base R `data.frame`. Tibbles are rejected because they have no row names to extract.
- `var`: a string naming the new column. Defaults to `"rowname"`. Must not clash with an existing column name.

The new column is always inserted as the first column. The result is a tibble; row numbers reset to `1:nrow(.data)`.

[TIP]
**Always set `var` to a meaningful name.** The default `"rowname"` is forgettable and reads poorly in downstream code. For `mtcars`, write `rownames_to_column(mtcars, "model")`; for a sample-by-gene matrix, `rownames_to_column(df, "sample_id")`. A descriptive name makes joins and filters self-documenting later.

## Six common patterns

### 1. Default conversion with the "rowname" column name

```r title="Convert mtcars with the default column name"
mtcars_t <- rownames_to_column(mtcars)
head(mtcars_t, 3)
#> # A tibble: 3 x 12
#>   rowname         mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <chr>         <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Mazda RX4      21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2 Mazda RX4 Wag  21       6   160   110  3.9   2.88  17.0     0     1     4     4
#> 3 Datsun 710     22.8     4   108    93  3.85  2.32  18.6     1     1     4     1
```

With no `var` argument, the new column is named `"rowname"` and placed at position one. The result is a tibble, so subsequent dplyr verbs work without further conversion.

### 2. Set a meaningful column name

```r title="Use var to name the column descriptively"
mtcars_t <- rownames_to_column(mtcars, var = "model")
head(mtcars_t, 3)
#> # A tibble: 3 x 12
#>   model           mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <chr>         <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Mazda RX4      21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2 Mazda RX4 Wag  21       6   160   110  3.9   2.88  17.0     0     1     4     4
#> 3 Datsun 710     22.8     4   108    93  3.85  2.32  18.6     1     1     4     1
```

Naming the column `"model"` tells the next reader what the values mean. The string can be any valid column name; if it clashes with an existing column the function errors.

### 3. Pipe-friendly conversion before dplyr verbs

```r title="Chain into filter and select"
mtcars |>
  rownames_to_column("model") |>
  filter(cyl == 4) |>
  select(model, mpg, hp) |>
  head(3)
#> # A tibble: 3 x 3
#>   model            mpg    hp
#>   <chr>          <dbl> <dbl>
#> 1 Datsun 710      22.8    93
#> 2 Merc 240D       24.4    62
#> 3 Merc 230        22.8    95
```

Once the row names are a column, dplyr verbs can filter, sort, and join on them. This is the canonical reason to convert: dplyr operations cannot reference row names directly.

### 4. Convert from matrix via as.data.frame() first

```r title="Matrices need conversion to data frame before rownames_to_column"
m <- matrix(1:9, nrow = 3, dimnames = list(c("a", "b", "c"), c("x", "y", "z")))
m_df <- as.data.frame(m)
rownames_to_column(m_df, "label")
#> # A tibble: 3 x 4
#>   label     x     y     z
#>   <chr> <int> <int> <int>
#> 1 a         1     4     7
#> 2 b         2     5     8
#> 3 c         3     6     9
```

`rownames_to_column()` accepts only `data.frame` inputs. Matrices, even with `dimnames`, must be promoted with `as.data.frame()` first. The row names then transfer cleanly.

### 5. Round-trip with column_to_rownames()

```r title="Move out and back with the inverse function"
df_with_col <- rownames_to_column(mtcars, "model")
df_restored <- column_to_rownames(df_with_col, "model")
head(rownames(df_restored), 3)
#> [1] "Mazda RX4"     "Mazda RX4 Wag" "Datsun 710"
```

`column_to_rownames()` is the inverse: it takes a column name, moves the values back into row names, and drops the column. Round-tripping is exact when no rows are reordered between the two calls.

### 6. Preserve rownames when converting to tibble

```r title="Bridge from rownamed data.frame to tibble safely"
# Wrong: rownames silently dropped
as_tibble(mtcars) |> head(2)
#> # A tibble: 2 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2  21       6   160   110  3.9   2.88  17.0     0     1     4     4

# Right: lift rownames first, then convert
mtcars |> rownames_to_column("model") |> head(2)
#> # A tibble: 2 x 12
#>   model           mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <chr>         <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Mazda RX4      21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2 Mazda RX4 Wag  21       6   160   110  3.9   2.88  17.0     0     1     4     4
```

The `as_tibble()` path silently discards row names; `rownames_to_column()` preserves them. Always prefer the latter when the row labels carry meaning.

## rownames_to_column() vs alternatives

**Pick `rownames_to_column()` when the input is a base R data frame with informative row names.** Several adjacent tools handle related row-axis tasks; choosing the wrong one is the most common source of confusion.

| Behavior | `rownames_to_column()` | `as_tibble(rownames=)` | `rowid_to_column()` | Base R assignment |
|---|---|---|---|---|
| Source | tibble | tibble | tibble | base R |
| Best for | Lift existing rownames | Lift rownames during conversion | Add new sequential id | Manual control |
| New column position | First | First | First | Any |
| Source preserved | Rownames removed | Rownames removed | Rownames untouched | Both kept |
| Returns | tibble | tibble | tibble | data.frame |
| Errors if column exists | Yes | Yes | Yes | No (overwrites) |

When to use which:

- Use `rownames_to_column()` for explicit two-step conversion when the data frame is already in scope.
- Use `as_tibble(df, rownames = "model")` to lift rownames as part of the tibble conversion in one call.
- Use `rowid_to_column()` to add a fresh `1:nrow(df)` id, not for existing row names.
- Avoid `cbind(rowname = rownames(df), df)` from base R, it returns a data.frame and loses tibble printing.

[KEY INSIGHT]
**Tibbles do not have row names by design.** The tidyverse treats row names as a data quality smell: any meaningful per-row identifier should be a first-class column the user can filter, join, and select on. `rownames_to_column()` exists to bridge legacy `data.frame` workflows into the tidyverse without silently losing information. If you find yourself reaching for row names on a tibble, you have a missing column instead.

## Common pitfalls

**Pitfall 1: passing a tibble.** Tibbles have no row names, so the function errors. Convert from a base `data.frame` instead, or check with `is.data.frame()` and `!tibble::is_tibble()` before calling.

```r title="Tibbles are rejected"
# This errors:
# rownames_to_column(as_tibble(mtcars))
# Error: `df` must be a data frame without row names.

# Fix: call on the base data.frame before converting
rownames_to_column(mtcars, "model") |> head(2)
#> # A tibble: 2 x 12
#>   model           mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <chr>         <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Mazda RX4      21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2 Mazda RX4 Wag  21       6   160   110  3.9   2.88  17.0     0     1     4     4
```

**Pitfall 2: var name collides with an existing column.** The function refuses to overwrite. Pick a non-clashing name or rename the existing column first.

```r title="Duplicate column name errors"
df <- data.frame(model = c("a", "b"), x = 1:2, row.names = c("r1", "r2"))
# This errors:
# rownames_to_column(df, "model")
# Error: Column `model` already exists.

# Fix: choose a different var name
rownames_to_column(df, "row_id")
#>   row_id model x
#> 1     r1     a 1
#> 2     r2     b 2
```

[WARNING]
**Row names that look like integers are coerced to character.** Even if `rownames(df)` returns `"1"`, `"2"`, `"3"`, the new column is `chr`, not `int`. If you need an integer id, pass the result through `mutate(id = as.integer(rowname))` or use `rowid_to_column()` instead, which adds an integer column from the start.

**Pitfall 3: forgetting that the result has fresh row numbers.** The output tibble has `row.names` of `1:nrow(.data)`, not the originals. If downstream code relies on the original rownames, capture them in the call.

```r title="The old rownames live only in the new column now"
mtcars_t <- rownames_to_column(mtcars, "model")
rownames(mtcars_t)[1:3]
#> [1] "1" "2" "3"

mtcars_t$model[1:3]
#> [1] "Mazda RX4"     "Mazda RX4 Wag" "Datsun 710"
```

## Try it yourself

**Try it:** Convert `USArrests` (a base R dataset with US state names as row names) into a tibble whose first column is named `state`. Then filter to states whose `Murder` rate exceeds 10. Save the result to `ex_high_murder`.

```r title="Your turn: lift USArrests rownames and filter"
library(tibble)
library(dplyr)
# Try it: build ex_high_murder
ex_high_murder <- # your code here

ex_high_murder
#> Expected: 5 rows, first column "state"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_high_murder <- USArrests |>
  rownames_to_column(var = "state") |>
  filter(Murder > 10)

ex_high_murder
#> # A tibble: 5 x 5
#>   state          Murder Assault UrbanPop  Rape
#>   <chr>           <dbl>   <int>    <int> <dbl>
#> 1 Alabama          13.2     236       58  21.2
#> 2 Florida          15.4     335       80  31.9
#> 3 Georgia          17.4     211       60  25.8
#> 4 Mississippi      16.1     259       44  17.1
#> 5 South Carolina   14.4     279       48  22.5
```

**Explanation:** `USArrests` is a base `data.frame` with state names as row names. `rownames_to_column(var = "state")` lifts them into a real column so `filter()` can reference the rate column directly. The result is a tibble with integer row numbers and the state label preserved.

</details>

## Related tibble functions

Alongside `rownames_to_column()`, look at:

- `column_to_rownames()`: the inverse operation, moves a column back into row names.
- `rowid_to_column()`: prepends a fresh integer id column from one upward, ignoring any existing row names.
- `has_rownames()`: returns `TRUE` if a data frame carries non-trivial row names.
- `remove_rownames()`: drops row names without preserving them.
- `as_tibble(rownames = "var")`: combines rowname lifting with tibble conversion in a single call.
- `dplyr::relocate()`: move the new id column to a different position after `rownames_to_column()`.

For the full reference, see the [official tibble documentation](https://tibble.tidyverse.org/reference/rownames.html).

## FAQ

**How do you convert row names to a column in R?**

Call `rownames_to_column()` from the tibble package on a base `data.frame` whose row names you want to preserve. Example: `rownames_to_column(mtcars, var = "model")` returns a tibble where the original row names like `"Mazda RX4"` live in a new first column named `model`. The `var` argument defaults to `"rowname"`, but a descriptive name is preferable. The result is always a tibble with integer row numbers from one upward.

**What is the difference between rownames_to_column() and rowid_to_column()?**

`rownames_to_column()` lifts EXISTING row names into a column, preserving labels like `"Mazda RX4"` or `"Alabama"`. `rowid_to_column()` adds a NEW sequential integer id column from one upward, ignoring any existing row names. Use the first when row names carry meaning, like dataset record identifiers. Use the second when you simply need a stable per-row id for joining or tracking row order through transformations.

**Why does rownames_to_column() error on a tibble?**

Tibbles intentionally do not support row names, so there is nothing to extract. The error message reads `must be a data frame without row names`. Either call the function on the base `data.frame` BEFORE converting with `as_tibble()`, or use the combined form `as_tibble(df, rownames = "model")`, which lifts row names during conversion in a single call.

**Can I undo rownames_to_column()?**

Yes. `column_to_rownames(df, "model")` is the exact inverse: it takes the column name, moves the values back into row names, and drops the column. Round-tripping is lossless as long as no rows are reordered or filtered between the two calls. Note that the round-trip returns a base `data.frame`, not a tibble, because tibbles do not support row names.

**Does rownames_to_column() modify the original data frame?**

No. `rownames_to_column()` returns a new tibble; the original `data.frame` is unchanged. Assign the result back to persist the change: `mtcars_t <- rownames_to_column(mtcars, "model")`. This is the standard tidyverse pattern, functions are pure and changes only persist through explicit assignment or piping into a chain that rebinds at the end.
