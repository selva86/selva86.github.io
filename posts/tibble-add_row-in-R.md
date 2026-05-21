---
title: "tibble add_row() in R: Append Rows to a Data Frame"
slug: "tibble-add_row-in-R"
description: "Append rows to a tibble in R with add_row() from the tibble package. Learn syntax, position control, NA handling, and common pitfalls with code examples."
keywords: "tibble add_row, add_row function R, tibble add_row examples, R add_row tibble, append row to tibble, dplyr add row, add_row tidyverse"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "add_row()|tibble add_row|tibble::add_row()|append row to tibble|add row to tibble"
auto_link_case_sensitive: true
target_keyword: "tibble add_row"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble add_row() in R: Append Rows to a Data Frame

<p class="lead">The <code>add_row()</code> function in the tibble package appends one or more rows to an existing tibble using name-value pairs, with optional <code>.before</code> and <code>.after</code> arguments to control insert position.</p>

[QUICK ANSWER]
add_row(df, x = 4, y = "d")                  # append one row at end
add_row(df, x = c(4, 5), y = c("d", "e"))    # append several rows
add_row(df, x = 0, y = "first", .before = 1) # insert at top
add_row(df, x = 9, .after = 2)               # missing cols become NA
add_row(df, y = "z")                         # only one col supplied
add_row(df)                                  # append a fully-NA row
df |> add_row(x = 4, y = "d")                # pipe-friendly

[DECISION TREE: Is add_row() the right tool?]
- append one or more rows to a tibble: add_row(df, x = 4, y = "d")
- add a new column instead of a row: add_column(df, z = 1:3)
- stack two tibbles vertically: dplyr::bind_rows(df1, df2)
- update an existing row in place: dplyr::rows_update(df, new_df)
- build a tibble from scratch: tibble(x = 1:3, y = c("a","b","c"))
- convert a list or matrix to a tibble: as_tibble(x)
- insert a row by index in a data.frame: rbind(df[1:i, ], row, df[(i+1):n, ])

## What add_row() does in one sentence

**`add_row()` returns a new tibble with extra rows appended or inserted.** You pass the source tibble plus one name-value pair per column you want to populate. Missing columns fill with `NA`. The original tibble is not modified; assignment back is required to persist the change.

The function lives in the tibble package and works on any tibble or data frame. It mirrors `add_column()` for the column-axis case and complements `dplyr::bind_rows()` for the multi-frame case. Where `bind_rows()` joins two tibbles, `add_row()` is for the smaller, surgical task of adding a handful of rows you describe inline.

## Syntax

**`add_row()` takes the tibble first, then name-value pairs, then optional position arguments.** Vectors recycle to match the longest input, so passing scalars for some columns and vectors for others is fine as long as lengths align.

```r title="Load tibble and inspect the signature"
library(tibble)

df <- tibble(x = 1:3, y = c("a", "b", "c"))
df
#> # A tibble: 3 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
```

The full signature is:

```
add_row(.data, ..., .before = NULL, .after = NULL)
```

Arguments:

- `.data`: the source tibble or data frame.
- `...`: name-value pairs. Names must match existing column names; values can be scalars or vectors.
- `.before`: integer index. The new rows are inserted before this row.
- `.after`: integer index. The new rows are inserted after this row.

If both `.before` and `.after` are `NULL` (the default), new rows are appended at the end. Supplying both is an error. Columns omitted from `...` are filled with `NA` of the appropriate type.

[TIP]
**Pipe `add_row()` for readable row-append chains.** Because `add_row()` returns a new tibble, it composes with the native pipe: `df |> add_row(x = 4, y = "d") |> add_row(x = 5, y = "e")`. The pattern reads top-to-bottom in the order rows arrive, which is easier to scan than nested function calls.

## Six common patterns

### 1. Append a single row at the end

```r title="Append one row with name-value pairs"
df2 <- add_row(df, x = 4, y = "d")
df2
#> # A tibble: 4 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
#> 4     4 d
```

The new row goes at position `nrow(df) + 1`. Column order in the call does not matter; values land in the column whose name matches.

### 2. Append several rows at once

```r title="Pass vectors to add multiple rows"
df3 <- add_row(df, x = c(4, 5, 6), y = c("d", "e", "f"))
df3
#> # A tibble: 6 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
#> 4     4 d
#> 5     5 e
#> 6     6 f
```

Each vector contributes one row's worth of data per position. All vectors must be the same length or length 1 (which recycles).

### 3. Insert at a specific position with .before or .after

```r title="Insert a header row at the top"
df4 <- add_row(df, x = 0, y = "header", .before = 1)
df4
#> # A tibble: 4 x 2
#>       x y
#>   <int> <chr>
#> 1     0 header
#> 2     1 a
#> 3     2 b
#> 4     3 c
```

`.before = 1` inserts above row 1. `.after = nrow(df)` is identical to the default append. Use one or the other, not both.

### 4. Let missing columns become NA

```r title="Supply only one column, the other becomes NA"
df5 <- add_row(df, x = 99)
df5
#> # A tibble: 4 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
#> 4    99 NA
```

You do not have to fill every column. This is convenient when most fields are unknown at insert time and will be back-filled later.

### 5. Append a placeholder row with no values

```r title="A fully NA row, useful as a sentinel"
df6 <- add_row(df)
df6
#> # A tibble: 4 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
#> 4    NA NA
```

Calling `add_row()` with only `.data` appends a single row where every column is `NA`. Useful for reserving a slot you will populate via assignment.

### 6. Vector recycling and scalar columns

```r title="A scalar recycles across multiple rows"
df7 <- add_row(df, x = c(10, 11, 12), y = "new")
df7
#> # A tibble: 6 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
#> 4    10 new
#> 5    11 new
#> 6    12 new
```

Length-1 inputs recycle to match the longest input. Mismatched non-scalar lengths error rather than recycle silently.

## add_row() vs bind_rows() vs rbind()

**Use `add_row()` for inline row additions with named values.** Where `add_row()` shines is the small, hand-written case where you know the values and want them visible in source. For combining two frames, reach for `dplyr::bind_rows()`. For base R, `rbind()` still works but is fussier about types and column matching.

| Behavior | `add_row()` | `bind_rows()` | `rbind()` |
|---|---|---|---|
| Source | tibble package | dplyr | base R |
| Inputs | name-value pairs | tibbles or lists | data frames |
| Missing columns | Fill with NA | Fill with NA | Error |
| Extra columns | Error | Add column with NA | Error |
| Position control | `.before`, `.after` | Append only | Append only |
| Type coercion | Per column | Per column | Strict matching |
| Returns | tibble | tibble | data.frame |

When to use which:

- Use `add_row()` to splice in a few hand-written rows where source readability matters.
- Use `bind_rows()` to stack two or more tibbles whose schemas mostly overlap.
- Use `rbind()` for legacy code that already uses base R data frames end-to-end.

[KEY INSIGHT]
**`add_row()` returns a new tibble; it does not mutate.** Forgetting to assign the result back is the single most common mistake. The original tibble stays unchanged after `add_row(df, x = 4)`. To persist the row, write `df <- add_row(df, x = 4)` or pipe into a chain that re-binds at the end. Tibble functions follow this rule consistently, which makes them safe to compose but trips up users coming from spreadsheet or SQL `INSERT` semantics.

## Common pitfalls

**Pitfall 1: column names that do not exist in .data.** `add_row()` will not invent new columns. A typo or extra name throws an error.

```r title="An unknown column name is rejected"
# This errors:
# add_row(df, x = 4, z = 99)
# Error in `add_row()`:
# ! New rows can't add columns.
# i Can't find columns `z` in `.data`.

# Fix: only name columns that already exist
add_row(df, x = 4)
#> # A tibble: 4 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
#> 4     4 NA
```

**Pitfall 2: type mismatch.** Values must coerce to the existing column type, otherwise the call errors. Adding a string to an integer column is rejected, not silently converted.

```r title="A type-incompatible value errors"
# This errors:
# add_row(df, x = "four", y = "d")
# Error: Can't combine `..1$x` <integer> and `..2$x` <character>.

# Fix: coerce the value or change the column type first
add_row(df, x = 4L, y = "d")
#> # A tibble: 4 x 2
#>       x y
#>   <int> <chr>
#> 1     1 a
#> 2     2 b
#> 3     3 c
#> 4     4 d
```

[WARNING]
**`.before` and `.after` cannot both be set.** Passing both arguments produces an error. Pick one, or omit both to append at the end. The arguments are also positional integers, not row identifiers, so renumbering after a previous insert shifts the meaning of every index.

**Pitfall 3: forgetting to assign back.** `add_row()` returns a new tibble. The original is untouched.

```r title="Without assignment, the change vanishes"
add_row(df, x = 4, y = "d")
nrow(df)
#> [1] 3

# Fix: assign the result back
df <- add_row(df, x = 4, y = "d")
nrow(df)
#> [1] 4
```

## Try it yourself

**Try it:** Take `mtcars`, convert it to a tibble, then insert one row at position 1 with `mpg = 50`, `cyl = 4`, and the remaining columns set to NA. Save the result to `ex_mtcars`.

```r title="Your turn: insert a header row into mtcars"
library(tibble)
# Try it: insert a row at the top
ex_mtcars <- # your code here

head(ex_mtcars, 3)
#> Expected: 3 rows, mpg=50 with NA elsewhere on row 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mtcars <- mtcars |>
  as_tibble() |>
  add_row(mpg = 50, cyl = 4, .before = 1)

head(ex_mtcars, 3)
#> # A tibble: 3 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1    50     4    NA    NA    NA    NA    NA    NA    NA    NA    NA
#> 2    21     6   160   110   3.9  2.62  16.5     0     1     4     4
#> 3    21     6   160   110   3.9  2.88  17.0     0     1     4     4
```

**Explanation:** `as_tibble()` converts `mtcars` from a data frame to a tibble so `add_row()` can act on it. Only `mpg` and `cyl` are named, so the other nine columns receive `NA` automatically. `.before = 1` places the new row above the original first row.

</details>

## Related tibble functions

After `add_row()`, look at:

- `add_column()`: extend an existing tibble with new columns instead of new rows.
- `tibble()` and `tribble()`: build tibbles from scratch, column-by-column or row-by-row.
- `as_tibble()`: convert a data frame, list, or matrix into a tibble.
- `dplyr::bind_rows()`: stack two or more tibbles vertically, accepting different column sets.
- `dplyr::rows_update()`: modify existing rows in place rather than appending new ones.

For the full reference, see the [official tibble documentation](https://tibble.tidyverse.org/reference/add_row.html).

## FAQ

**How do you add a row to a tibble in R?**

Call `add_row()` from the tibble package with the source tibble as the first argument, then one name-value pair per column you want to fill. Example: `add_row(df, x = 4, y = "d")` appends a single row where `x = 4` and `y = "d"`. Columns you do not name receive `NA`. The function returns a new tibble, so assign the result back: `df <- add_row(df, x = 4, y = "d")` to persist the change.

**What is the difference between add_row() and bind_rows()?**

`add_row()` accepts name-value pairs and is designed for inline, hand-written rows: `add_row(df, x = 4, y = "d")`. `dplyr::bind_rows()` accepts whole tibbles or data frames and stacks them: `bind_rows(df1, df2)`. Use `add_row()` when you know the values and want them visible in source; use `bind_rows()` when you already have the rows as another tibble. Both fill missing columns with `NA`, but `add_row()` rejects unknown column names while `bind_rows()` creates them.

**Can add_row() insert at a specific position in R?**

Yes. Pass `.before = N` to insert above row `N`, or `.after = N` to insert below row `N`. Example: `add_row(df, x = 0, y = "first", .before = 1)` inserts at the top. Without either argument, the new rows append at the end. You cannot supply both `.before` and `.after` in the same call; the function will error. Indices are based on the source tibble, so each call evaluates against the row numbering at that moment.

**Why does add_row() error with "can't add columns"?**

`add_row()` only fills columns that already exist in the source tibble. Passing a name that does not match an existing column triggers the error `New rows can't add columns`. Check the spelling of the column name and inspect the columns with `names(df)`. To add a new column, use `add_column()` or `dplyr::mutate()` instead. To stack a tibble that has extra columns, use `dplyr::bind_rows()`, which auto-fills missing columns on either side with `NA`.

**Does add_row() modify the original tibble?**

No. `add_row()` returns a new tibble; the original is unchanged. This is the standard tidyverse pattern: functions are pure, and changes only persist when you assign the result back. Write `df <- add_row(df, x = 4)` or chain through a pipe: `df <- df |> add_row(x = 4) |> add_row(x = 5)`. Treating `add_row()` like a spreadsheet INSERT that mutates in place is the most common bug; the result vanishes if not assigned.
