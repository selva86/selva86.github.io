---
title: "tidyr unpack() in R: Spread df-Column Back Into Columns"
slug: "tidyr-unpack-in-R"
description: "Use tidyr unpack() to spread a packed df-column back into multiple columns in R. Covers vs pack, names_sep, and 5 worked examples."
keywords: "tidyr unpack, R unpack df-column, unpack vs pack, unpack tidyr, spread df-column, unpack tibble"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::unpack()|tidyr unpack|unpack df-column|unpack vs pack|spread packed columns"
auto_link_case_sensitive: true
target_keyword: "tidyr unpack"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr unpack() in R: Spread df-Column Back Into Columns

<p class="lead">The <code>unpack()</code> function in tidyr expands a packed df-column (a column whose cells are tibbles) back into multiple top-level columns. It is the opposite of <code>pack()</code>.</p>

[QUICK ANSWER]
df |> unpack(packed_col)              # spread back to columns
df |> unpack(c(col1, col2))            # multiple packed cols
df |> unpack(packed_col, names_sep = "_")
df |> pack(...)                        # opposite operation

[DECISION TREE: Is unpack() the right tool?]
- spread df-column back to columns: unpack()
- spread list of named lists: unnest_wider()
- spread list of tibbles: unnest()
- combine columns into df-column: pack()

## What unpack() does in one sentence

**`unpack(data, cols, names_sep = NULL)` expands a column whose cells are tibbles into multiple top-level columns.** The new columns are named after the inner tibble's columns.

## Syntax

**`unpack(data, cols, ..., names_sep = NULL, names_repair = "check_unique")`.**

```r title="Round-trip pack/unpack"
library(tidyr)
library(dplyr)

packed <- mtcars |>
  pack(perf = c(mpg, hp))

packed |>
  unpack(perf) |>
  head(2)
#>            mpg hp cyl ...
#> Mazda RX4   21 110   6 ...
#> Mazda RX4 Wag 21 110 6 ...
```

[TIP]
**unpack reverses pack exactly.** `pack(...) |> unpack(...)` returns the original data frame.

## Five common patterns

### 1. Standard unpack

```r title="df-column to columns"
packed |> unpack(perf)
```

### 2. Multiple df-columns

```r title="Unpack two at once"
packed |> unpack(c(perf, physical))
```

### 3. With names_sep

```r title="Prefix new column names"
packed |> unpack(perf, names_sep = "_")
#> Columns become perf_mpg, perf_hp
```

### 4. Round-trip

```r title="Pack then unpack"
mtcars |>
  pack(perf = c(mpg, hp)) |>
  unpack(perf) |>
  identical(mtcars)
```

### 5. Selective unpack

```r title="Keep some packed, unpack one"
df_packed <- mtcars |>
  pack(perf = c(mpg, hp), phys = c(disp, wt))

df_packed |> unpack(perf)
#> perf is unpacked; phys remains a df-column
```

[KEY INSIGHT]
**`unpack` expects DF-COLUMNS (tibble cells); `unnest_wider` accepts named lists too.** They overlap but unpack is specifically for the column-of-tibbles structure created by pack.

## unpack() vs unnest_wider() vs unnest()

| Function | Input cell type | Output |
|---|---|---|
| `unpack()` | Tibble (one row per cell) | New columns |
| `unnest_wider()` | Named list or 1-row tibble | New columns |
| `unnest()` | Tibble (multiple rows) | New rows |

Use unpack for pack/unpack round-trips; unnest_wider for general named-list structures.

## A practical workflow

**Use unpack to undo pack-style organization for downstream verbs that don't understand df-columns.**

```r
df_packed |>
  unpack(metrics) |>
  filter(mpg > 20) |>
  pack(metrics = c(mpg, hp, qsec))
```

Unpack for filter; re-pack after.

## Common pitfalls

**Pitfall 1: name conflicts.** If unpacking creates duplicate names with existing columns, error. Use names_sep or names_repair.

**Pitfall 2: confusing with unnest.** unpack is for SINGLE-ROW tibble columns. unnest is for MULTI-ROW tibble columns.

[WARNING]
**`unpack()` requires each cell to be a tibble of the same shape.** Inconsistent shapes error.

## Try it yourself

**Try it:** Pack then unpack mtcars and verify identity. Save check to `ex_check`.

```r title="Your turn: round trip"
ex_check <- mtcars |>
  pack(p = c(mpg, hp)) |>
  unpack(p) |>
  # your code here

ex_check
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_check <- identical(mtcars |> pack(p = c(mpg, hp)) |> unpack(p), mtcars)

ex_check
#> [1] TRUE
```

**Explanation:** pack/unpack are inverses; round-trip preserves the data exactly.

</details>

## Related tidyr functions

After mastering unpack, look at:

- `pack()`: opposite (combine columns)
- `unnest()`: list-column to rows
- `unnest_wider()`: named lists to columns
- `unnest_longer()`: vectors to rows

## FAQ

**What does unpack do in tidyr?**

`unpack(data, col)` expands a column whose cells are tibbles into multiple top-level columns.

**What is the difference between unpack and unnest_wider?**

unpack expects df-columns (tibble cells with one row each). unnest_wider also accepts named lists. unpack is more strict.

**How do I avoid name conflicts when unpacking?**

Pass `names_sep = "_"` to prefix the new columns with the original df-column's name.

**Is unpack the inverse of pack?**

Yes. `pack(...) |> unpack(...)` returns the original.

**Can I unpack multiple df-columns at once?**

Yes. `unpack(c(col1, col2))` unpacks both. Each cell must be a tibble.
