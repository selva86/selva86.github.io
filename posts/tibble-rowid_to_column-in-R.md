---
title: "tibble rowid_to_column() in R: Add Sequential Row IDs"
slug: "tibble-rowid_to_column-in-R"
description: "Add a sequential 1..n row id column with tibble rowid_to_column() in R. Learn the syntax, sorting safety, group-aware alternatives, and common pitfalls."
keywords: "tibble rowid_to_column, rowid_to_column function R, tibble rowid_to_column examples, R add row id column, R add row number column, tibble add row index, rowid_to_column tidyverse"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "rowid_to_column()|tibble rowid_to_column|tibble::rowid_to_column()|add row id column|add row number column"
auto_link_case_sensitive: true
target_keyword: "tibble rowid_to_column"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble rowid_to_column() in R: Add Sequential Row IDs

<p class="lead">The <code>rowid_to_column()</code> function in the tibble package adds an integer column with values <code>1:nrow(x)</code> at the leftmost position of a data frame and returns a tibble, with the <code>var</code> argument controlling the new column name (default <code>"rowid"</code>).</p>

[QUICK ANSWER]
rowid_to_column(mtcars)                          # default var = "rowid"
rowid_to_column(mtcars, var = "id")              # custom column name
mtcars |> rowid_to_column("id")                  # pipe-friendly
rowid_to_column(df) |> arrange(desc(value))      # tag BEFORE sorting
df |> rowid_to_column("orig_pos") |> slice(1:5)  # tag BEFORE subsetting
rowid_to_column(as.data.frame(m), "obs")         # convert matrix first
df |> rowid_to_column() |> filter(rowid > 100)   # filter on the new id

[DECISION TREE: Is rowid_to_column() the right tool?]
- add a sequential 1..n id at column 1: rowid_to_column(df, "id")
- add a per-group sequential id: df |> group_by(g) |> mutate(id = row_number())
- move existing rownames into a column: rownames_to_column(df, "name")
- check whether the frame has rownames: has_rownames(df)
- drop rownames without adding any id: remove_rownames(df)
- add a column at a specific position: add_column(df, id = 1:n(), .before = 1)
- get the row count only: nrow(df)

## What rowid_to_column() does in one sentence

**`rowid_to_column()` returns a tibble with a fresh integer column `1:nrow(x)` inserted at the leftmost position.** You pass a data frame and an optional `var` string for the new column name. The function ignores any existing row names; if those labels matter, lift them with `rownames_to_column()` first.

The function lives in the tibble package and exists for a common bookkeeping task: tagging rows with a stable identifier before you sort, sample, pivot, or join. Once a row carries its own id, you can always trace it back to its original position, even after the data frame is reshaped.

## Syntax

**`rowid_to_column()` takes the data frame first and an optional `var` argument naming the new id column.** The function accepts both base R data frames and tibbles and always returns a tibble.

```r title="Load tibble and add a sequential id"
library(tibble)
library(dplyr)

mtcars_id <- rowid_to_column(mtcars, "id")
head(mtcars_id[, 1:4], 4)
#> # A tibble: 4 x 4
#>      id   mpg   cyl  disp
#>   <int> <dbl> <dbl> <dbl>
#> 1     1  21       6   160
#> 2     2  21       6   160
#> 3     3  22.8     4   108
#> 4     4  21.4     6   258
```

The full signature is:

```
rowid_to_column(x, var = "rowid")
```

Arguments:

- `x`: a base R `data.frame` or a tibble. Other inputs error.
- `var`: a string naming the new id column. Defaults to `"rowid"`. Must not clash with an existing column.

The new column is always inserted at position one and always holds the integer sequence `1:nrow(x)`, regardless of any row order in the input. The result is a tibble.

[TIP]
**Tag rows before reshaping, not after.** Once `arrange()`, `slice()`, or a join has scrambled order, the original positions are gone. Call `rowid_to_column()` immediately after import so every later transformation preserves an audit trail back to the raw rows.

## Five typical uses

**Each pattern targets a different downstream operation that benefits from a stable id.** Use them as templates for your own code.

```r title="Preserve original order across a sort"
mtcars |>
  rowid_to_column("orig") |>
  arrange(desc(mpg)) |>
  head(3) |>
  select(orig, mpg, cyl)
#> # A tibble: 3 x 3
#>    orig   mpg   cyl
#>   <int> <dbl> <dbl>
#> 1    20  33.9     4
#> 2    18  32.4     4
#> 3    19  30.4     4
```

The `orig` column travels with each row, so a later `arrange(orig)` restores the input order without re-importing the data.

```r title="Track rows across a pivot"
library(tidyr)
wide <- head(iris, 3) |>
  rowid_to_column("flower")

wide |>
  pivot_longer(-c(flower, Species), names_to = "trait", values_to = "value")
#> # A tibble: 12 x 4
#>   flower Species trait        value
#>    <int> <fct>   <chr>        <dbl>
#> 1      1 setosa  Sepal.Length   5.1
#> 2      1 setosa  Sepal.Width    3.5
#> 3      1 setosa  Petal.Length   1.4
#> 4      1 setosa  Petal.Width    0.2
#> 5      2 setosa  Sepal.Length   4.9
#> # i 7 more rows
```

`flower` survives the long-format reshape, so a later `pivot_wider()` or aggregation can group on it.

```r title="Track subset rows back to source"
mtcars |>
  rowid_to_column("car") |>
  slice(c(5, 12, 28)) |>
  select(car, mpg, cyl)
#> # A tibble: 3 x 3
#>     car   mpg   cyl
#>   <int> <dbl> <dbl>
#> 1     5  18.7     8
#> 2    12  16.4     8
#> 3    28  30.4     4
```

The `car` column reveals exactly which rows of `mtcars` ended up in the subset, even after filtering or slicing drops the original positions.

```r title="Anti-join to find skipped rows"
all_rows <- mtcars |> rowid_to_column("id")
kept     <- all_rows |> filter(mpg > 20)

anti_join(all_rows, kept, by = "id") |>
  summarise(n_dropped = n(), avg_mpg = mean(mpg))
#> # A tibble: 1 x 2
#>   n_dropped avg_mpg
#>       <int>   <dbl>
#> 1        18    15.9
```

Using `id` as the join key avoids ambiguity when the data also has duplicated rows on substantive columns like `mpg` or `cyl`.

```r title="Combine with row_number for per-group ids"
mtcars |>
  rowid_to_column("global") |>
  group_by(cyl) |>
  mutate(within_cyl = row_number()) |>
  ungroup() |>
  select(global, cyl, within_cyl) |>
  head(4)
#> # A tibble: 4 x 3
#>   global   cyl within_cyl
#>    <int> <dbl>      <int>
#> 1      1     6          1
#> 2      2     6          2
#> 3      3     4          1
#> 4      4     6          3
```

`rowid_to_column()` gives a global identifier; `row_number()` inside `group_by()` gives a per-group one. Carry both when you need cross-group traceability.

## rowid_to_column() vs alternatives

**Choose the tool that matches the scope: global, grouped, or based on data semantics.** The shortcuts below cover most real workflows.

| Tool | What you get | When to use |
|------|--------------|-------------|
| `rowid_to_column(df, "id")` | Integer column `1:nrow(df)` at position 1; tibble result | Most cases; you want a global stable id |
| `mutate(df, id = row_number())` | Same sequence, appended at end; respects `group_by()` | You need per-group ids or want to chain inside an existing `mutate()` |
| `rownames_to_column(df, "id")` | Existing row names become a character column at position 1 | Source has meaningful row labels like `mtcars` |
| `mutate(df, id = seq_len(n()))` | Same as `row_number()`; base R style | Avoiding tidyverse verbs inside a `mutate()` chain |
| `cbind(id = seq_len(nrow(df)), df)` | Base R equivalent; returns data.frame, not tibble | You need a base data.frame output |

The decision tree at the top of this page maps each of these to a concrete code snippet. For most pipelines, `rowid_to_column()` wins on readability: the function name states the intent, and the new column lands at the front where readers expect identifiers.

[KEY INSIGHT]
**`rowid_to_column()` and `row_number()` are not interchangeable.** `rowid_to_column()` ignores any `group_by()` and always produces `1:nrow(x)`. `mutate(id = row_number())` restarts at one within every group. Pick the first for global ids, the second for per-group ids.

## Common pitfalls

**Three failure modes catch most users.** Each is silent, so the bug surfaces later in the pipeline.

The first is **silent rowname loss**. If your input has meaningful labels like `mtcars`, calling `rowid_to_column()` discards them. The result has integer ids only; the `"Mazda RX4"` labels are gone.

```r title="Rownames disappear silently"
result <- rowid_to_column(mtcars)
"Mazda RX4" %in% names(result)
#> [1] FALSE
head(result$rowid, 3)
#> [1] 1 2 3
```

If you need the labels, call `rownames_to_column()` first or chain both: `mtcars |> rownames_to_column("model") |> rowid_to_column("id")`.

The second is **var name collision**. If your data already has a column named `"rowid"`, the call errors instead of overwriting.

```r title="Var name collision errors"
df <- tibble(rowid = letters[1:3], x = 1:3)
tryCatch(rowid_to_column(df), error = function(e) conditionMessage(e))
#> [1] "Column `rowid` already exists in `.data`."
```

Pass an explicit `var` argument with a unique name to avoid the clash.

The third is **assuming the id reflects sorted order**. The id is assigned in the order the rows already appear, not by any sort key. If you want ranks, sort first, then call `rowid_to_column()`.

[WARNING]
**Group-aware operations require `mutate(row_number())`, not `rowid_to_column()`.** Wrapping `rowid_to_column()` inside `group_by()` produces no grouping effect: you get a global `1:nrow(x)` sequence regardless. Switch to `mutate(id = row_number())` whenever the id needs to restart per group.

## Try it yourself

**Try it:** Add an id column to `airquality` named `obs`, then keep only rows where `Ozone` is missing. How many rows do you get?

```r title="Your turn: tag and filter"
# Try it: add id, then filter
ex_missing <- # your code here

ex_missing
#> Expected: 37 rows with Ozone == NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_missing <- airquality |>
  rowid_to_column("obs") |>
  filter(is.na(Ozone))

nrow(ex_missing)
#> [1] 37
head(ex_missing$obs, 5)
#> [1]  5 10 25 26 27
```

**Explanation:** `rowid_to_column()` tags every row with its position in the original frame, so the `obs` values after the filter point straight back to the observations that had missing Ozone. The first few positions are useful for diagnosing whether the missingness clusters near the start of the series.

</details>

## Related tibble functions

**The tibble package ships a small toolkit for row-level housekeeping; learn them as a set.** Each handles one transformation cleanly:

- `rownames_to_column()`: move existing row names into a named column
- `column_to_rownames()`: the inverse, moving a column back to rownames (returns a data frame)
- `has_rownames()`: check whether a data frame has non-trivial row names
- `remove_rownames()`: drop rownames without keeping them
- `add_column()`: insert any column at a chosen position (more general than `rowid_to_column()`)

For the official reference, see the [tibble package documentation](https://tibble.tidyverse.org/reference/rownames.html).

## FAQ

**Does rowid_to_column() preserve existing row names?**

No. It silently drops them and replaces them with an integer `1:nrow(x)` sequence. If your data frame has meaningful row names like `mtcars`, call `rownames_to_column()` first to lift them into a real column, then optionally chain `rowid_to_column()` to add a separate integer id. The two functions are complementary, not redundant: one preserves labels, the other generates a fresh sequence.

**Why does rowid_to_column() ignore group_by()?**

`rowid_to_column()` is a frame-level utility, not a verb that participates in dplyr's grouped semantics. It always returns `1:nrow(x)` regardless of any prior `group_by()` call on the input. For per-group sequential ids, use `mutate(id = row_number())` inside the grouped pipeline. This is by design: the function name promises a row id, not a group-relative one, so users can rely on a predictable result.

**What is the difference between rowid_to_column() and rownames_to_column()?**

`rowid_to_column()` creates a new integer sequence `1:nrow(x)` and discards rownames. `rownames_to_column()` preserves the existing rownames by copying them into a character column. Use the first when you want a fresh, frame-position id; use the second when the existing labels carry meaning (model names, sample IDs, time points). Both insert the new column at position one and return a tibble, so they fit into the same pipe positions.

**Can I use rowid_to_column() with a tibble that already has an id column?**

Yes, but the var name must not collide. If you already have a column called `"rowid"`, pass an explicit `var = "..."` argument with a unique name. The function errors rather than overwriting, which prevents accidental data loss. For pipelines that may run twice, defensive code is a `!"id" %in% names(df)` guard, or use `add_column()` if you want overwrite semantics with explicit positioning control.

**Does rowid_to_column() work on a matrix or list?**

No. The function requires a data frame or tibble input. Convert first with `as.data.frame()` or `as_tibble()`. For matrices, `as.data.frame(m) |> rowid_to_column("id")` is the common idiom. Lists are not a valid input even when they have list elements of equal length; coerce to a tibble first. If you have a named vector, `enframe()` lifts it into a two-column tibble, after which `rowid_to_column()` works as expected.
