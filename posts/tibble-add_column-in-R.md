---
title: "tibble add_column() in R: Append Columns to a Data Frame"
slug: "tibble-add_column-in-R"
description: "Append or insert columns in a tibble with add_column() from the R tibble package. Learn syntax, position control, recycling, and pitfalls with examples."
keywords: "tibble add_column, add_column function R, tibble add_column examples, R add_column tibble, add column to tibble, dplyr add column, add_column tidyverse"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "add_column()|tibble add_column|tibble::add_column()|add column to tibble|append column to tibble"
auto_link_case_sensitive: true
target_keyword: "tibble add_column"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble add_column() in R: Append Columns to a Data Frame

<p class="lead">The <code>add_column()</code> function in the tibble package adds one or more columns to an existing tibble using name-value pairs, with optional <code>.before</code> and <code>.after</code> arguments to control insert position.</p>

[QUICK ANSWER]
add_column(df, z = 1:3)                          # append column at end
add_column(df, z = 1:3, w = 0)                   # multiple columns
add_column(df, z = 1:3, .before = "y")           # insert before named col
add_column(df, z = 1:3, .after = 1)              # insert by index
add_column(df, source = "manual")                # scalar recycles
df |> add_column(z = 1:3)                        # pipe-friendly
add_column(df, x = 1:3, .name_repair = "unique") # repair on conflict

[DECISION TREE: Is add_column() the right tool?]
- add a literal vector as a new column: add_column(df, z = 1:3)
- compute a column from existing ones: dplyr::mutate(df, z = x + y)
- bind two tibbles side by side: dplyr::bind_cols(df, df2)
- rename existing columns: dplyr::rename(df, new = old)
- choose, drop, or reorder columns: dplyr::select(df, x, y)
- add a row instead of a column: tibble::add_row(df, x = 4, y = "d")
- move existing columns to new positions: dplyr::relocate(df, z, .before = y)

## What add_column() does in one sentence

**`add_column()` returns a new tibble with extra columns appended or inserted.** You pass the source tibble plus one name-value pair per column to create. Each value must be a vector of length `nrow(.data)` or a scalar that recycles to fill the column. The original tibble is not modified; assignment back is required to persist the change.

The function lives in the tibble package and is the column-axis counterpart of `add_row()`. Where `dplyr::mutate()` is best for columns derived from existing ones, `add_column()` is best for columns whose values you supply directly as vectors. It also offers position control through `.before` and `.after`, which `mutate()` does not.

## Syntax

**`add_column()` takes the tibble first, then name-value pairs, then optional position arguments.** Vectors must match `nrow(.data)` exactly; scalars recycle to fill every row.

```r title="Load tibble and set up a sample data frame"
library(tibble)
library(dplyr)

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
add_column(.data, ..., .before = NULL, .after = NULL, .name_repair = "check_unique")
```

Arguments:

- `.data`: the source tibble or data frame.
- `...`: name-value pairs. Names become new column names; values are vectors of length `nrow(.data)` or scalars.
- `.before`: 1-based column index or column name. New columns are inserted before this position.
- `.after`: 1-based column index or column name. New columns are inserted after this position.
- `.name_repair`: strategy for fixing duplicate or non-syntactic names. Default `"check_unique"` rejects duplicates outright.

If both `.before` and `.after` are `NULL` (the default), new columns append at the right.

[TIP]
**Pipe `add_column()` for readable column-append chains.** Because `add_column()` returns a new tibble, it composes with the native pipe: `df |> add_column(z = 1:3) |> add_column(w = letters[1:3])`. The pattern reads top-to-bottom in the order columns arrive, which is easier to scan than nested calls.

## Six common patterns

### 1. Append a column at the end

```r title="Append a single column at the right"
df2 <- add_column(df, z = c(10, 20, 30))
df2
#> # A tibble: 3 x 3
#>       x y         z
#>   <int> <chr> <dbl>
#> 1     1 a        10
#> 2     2 b        20
#> 3     3 c        30
```

With no position argument, the new column goes to the right of every existing column. Column order in subsequent reads follows the order of insertion.

### 2. Append multiple columns in one call

```r title="Pass several name-value pairs"
df3 <- add_column(df, z = 4:6, w = letters[24:26])
df3
#> # A tibble: 3 x 4
#>       x y         z w
#>   <int> <chr> <int> <chr>
#> 1     1 a         4 x
#> 2     2 b         5 y
#> 3     3 c         6 z
```

Each pair becomes one column. The new columns appear in the order you write them, side by side after the original columns.

### 3. Insert before or after a named column

```r title="Insert a column directly before column y"
df4 <- add_column(df, z = c(100, 200, 300), .before = "y")
df4
#> # A tibble: 3 x 3
#>       x     z y
#>   <int> <dbl> <chr>
#> 1     1   100 a
#> 2     2   200 b
#> 3     3   300 c
```

You can reference the insertion point by name (`"y"`) or by 1-based index (`1`). Names survive column reordering, which makes the call self-documenting and refactor-safe.

### 4. Scalar values recycle across rows

```r title="A scalar fills every row"
df5 <- add_column(df, source = "manual")
df5
#> # A tibble: 3 x 3
#>       x y     source
#>   <int> <chr> <chr>
#> 1     1 a     manual
#> 2     2 b     manual
#> 3     3 c     manual
```

A length-1 value recycles to match `nrow(df)`. Lengths other than 1 or `nrow(df)` are rejected rather than recycled silently.

### 5. Insert at the start with .before = 1

```r title="Put an id column on the far left"
df6 <- add_column(df, id = c("A1", "A2", "A3"), .before = 1)
df6
#> # A tibble: 3 x 3
#>   id        x y
#>   <chr> <int> <chr>
#> 1 A1        1 a
#> 2 A2        2 b
#> 3 A3        3 c
```

`.before = 1` puts the new column at position one. `.after = ncol(df)` is identical to the default append behavior.

### 6. Handle name conflicts with .name_repair

```r title="Repair a duplicate name automatically"
df7 <- add_column(df, x = 1:3, .name_repair = "unique")
names(df7)
#> New names:
#> * `x` -> `x...1`
#> * `x` -> `x...3`
#> [1] "x...1" "y"     "x...3"
```

Default `"check_unique"` rejects duplicates outright. Switch to `"unique"` (or `"universal"`) when you need the call to succeed by suffixing the duplicate name.

## add_column() vs mutate() vs bind_cols() vs cbind()

**Pick `add_column()` for inline columns supplied as literal vectors.** Each of the four options solves a different problem; choosing the wrong one is the most common confusion in this corner of the tidyverse.

| Behavior | `add_column()` | `dplyr::mutate()` | `dplyr::bind_cols()` | `cbind()` |
|---|---|---|---|---|
| Source | tibble | dplyr | dplyr | base R |
| Best for | Inline literal vectors | Computed from existing cols | Joining two tibbles by column | Legacy data frames |
| Position control | `.before`, `.after` | `.before`, `.after` | Append only | Append only |
| Length rule | nrow or 1 | nrow or 1 (per group) | nrow must match | Recycles silently |
| Duplicate names | Errors by default | Overwrites | Auto-repairs | Allows duplicates |
| Returns | tibble | tibble | tibble | data.frame |

When to use which:

- Use `add_column()` to splice in columns you supply as inline vectors, especially when position matters.
- Use `mutate()` to compute new columns from existing ones; do not use `add_column()` for derived values.
- Use `bind_cols()` to join two tibbles side-by-side when both already contain complete columns.
- Use `cbind()` only in base R workflows where tidyverse is not loaded.

[KEY INSIGHT]
**`add_column()` returns a new tibble; it does not mutate.** Forgetting to assign the result back is the single most common mistake. The original tibble stays unchanged after `add_column(df, z = 1:3)`. To persist the column, write `df <- add_column(df, z = 1:3)` or pipe into a chain that rebinds at the end. This is the standard tidyverse pattern: pure functions, explicit assignment.

## Common pitfalls

**Pitfall 1: vector length does not match nrow(.data).** Every value must be length `nrow(df)` or length 1. Any other length errors.

```r title="Mismatched lengths are rejected"
# This errors:
# add_column(df, z = c(1, 2))
# Error: New columns must be compatible with `.data`.
# x New column `z` has 2 rows.
# i `.data` has 3 rows.

# Fix: match the row count, or use a scalar
add_column(df, z = c(1, 2, 3))
#> # A tibble: 3 x 3
#>       x y         z
#>   <int> <chr> <dbl>
#> 1     1 a         1
#> 2     2 b         2
#> 3     3 c         3
```

**Pitfall 2: trying to add an existing column name.** `add_column()` refuses to overwrite. Use `mutate()` to replace a column or pass `.name_repair = "unique"` to suffix the new one.

```r title="Duplicate column name errors by default"
# This errors:
# add_column(df, x = c(7, 8, 9))
# Error: Column names `x` must not be duplicated.

# Fix: overwrite via mutate(), or repair the name
df |> dplyr::mutate(x = c(7, 8, 9))
#> # A tibble: 3 x 2
#>       x y
#>   <dbl> <chr>
#> 1     7 a
#> 2     8 b
#> 3     9 c
```

[WARNING]
**`.before` and `.after` cannot both be set in one call.** Passing both arguments triggers an error. Each accepts either an integer index or a column name; pick one slot per call. Indices reference the source tibble at the moment of the call, so chained inserts shift positions as columns are added.

**Pitfall 3: forgetting to assign back.** `add_column()` returns a new tibble. The original is untouched.

```r title="Without assignment, the new column vanishes"
add_column(df, z = 4:6)
ncol(df)
#> [1] 2

# Fix: assign the result back
df <- add_column(df, z = 4:6)
ncol(df)
#> [1] 3
```

## Try it yourself

**Try it:** Convert `iris` to a tibble, then add a `Species_Code` column that holds the integer codes of the `Species` factor (1, 2, 3). Insert the new column directly after `Species`. Save the result to `ex_iris`.

```r title="Your turn: add a species code column to iris"
library(tibble)
# Try it: add Species_Code right after Species
ex_iris <- # your code here

head(ex_iris, 3)
#> Expected: 6 columns ending with Species, Species_Code
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_iris <- iris |>
  as_tibble() |>
  add_column(Species_Code = as.integer(iris$Species), .after = "Species")

head(ex_iris, 3)
#> # A tibble: 3 x 6
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species Species_Code
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>          <int>
#> 1          5.1         3.5          1.4         0.2 setosa             1
#> 2          4.9         3            1.4         0.2 setosa             1
#> 3          4.7         3.2          1.3         0.2 setosa             1
```

**Explanation:** `as_tibble()` converts `iris` from a base data frame to a tibble. `as.integer()` on the `Species` factor returns its underlying numeric codes. `.after = "Species"` places the new column directly to the right of `Species`, keeping related fields adjacent.

</details>

## Related tibble functions

Alongside `add_column()`, look at:

- `add_row()`: extend a tibble with new rows instead of new columns.
- `tibble()` and `tribble()`: build a tibble from scratch, column-by-column or row-by-row.
- `as_tibble()`: convert a data frame, list, or matrix into a tibble.
- `dplyr::mutate()`: create or replace columns computed from existing ones.
- `dplyr::bind_cols()`: combine two tibbles side-by-side when both contain full columns.
- `dplyr::relocate()`: move existing columns to new positions without changing their values.

For the full reference, see the [official tibble documentation](https://tibble.tidyverse.org/reference/add_column.html).

## FAQ

**How do you add a column to a tibble in R?**

Call `add_column()` from the tibble package with the source tibble as the first argument, then one name-value pair per column to create. Example: `add_column(df, z = 1:3)` appends a column `z` with values 1, 2, 3. Each value must be length `nrow(df)` or length 1. The function returns a new tibble, so assign the result back: `df <- add_column(df, z = 1:3)` to persist the change.

**What is the difference between add_column() and mutate()?**

`add_column()` adds a column whose values you supply as a literal vector: `add_column(df, z = c(10, 20, 30))`. `dplyr::mutate()` creates or replaces columns whose values are computed from existing ones: `mutate(df, z = x + 1)`. Use `add_column()` for hand-written or externally sourced vectors and when you need `.before`/`.after` position control. Use `mutate()` for expressions referring to other columns, group-wise computation, and overwriting existing columns.

**Can add_column() insert at a specific position?**

Yes. Pass `.before = N` to insert to the left of column `N`, or `.after = N` to insert to the right. `N` can be a 1-based integer index or a column name. Example: `add_column(df, z = 1:3, .before = "y")` places `z` directly before column `y`. Without either argument, new columns append at the right. You cannot pass both `.before` and `.after` in the same call, and indices reference the source tibble at the moment of the call.

**Why does add_column() error with "column names must not be duplicated"?**

`add_column()` refuses to overwrite an existing column by default. If `.data` already contains a column named `x`, passing `x = ...` raises that error. To replace an existing column, use `dplyr::mutate(df, x = ...)`. To keep both columns under different names, pass `.name_repair = "unique"`, which suffixes the duplicate to `x...1`, `x...3`, and so on, preserving values without collision.

**Does add_column() modify the original tibble?**

No. `add_column()` returns a new tibble; the original is unchanged. This is the standard tidyverse pattern: functions are pure, and changes only persist when you assign the result back. Write `df <- add_column(df, z = 1:3)` or chain through the pipe: `df <- df |> add_column(z = 1:3) |> add_column(w = 4:6)`. Treating `add_column()` like an in-place spreadsheet edit is the most common bug.
