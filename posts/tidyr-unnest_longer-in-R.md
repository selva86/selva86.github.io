---
title: "tidyr unnest_longer() in R: Expand Vector List Columns Into Rows"
slug: "tidyr-unnest_longer-in-R"
description: "Use tidyr unnest_longer() to expand a list-column of atomic vectors into multiple rows in R. Covers indices_to, vs unnest, and 5 worked examples."
keywords: "tidyr unnest_longer, R unnest_longer indices_to, unnest_longer vs unnest, vector list to rows, unnest_longer transform"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::unnest_longer()|tidyr unnest_longer|vector list to rows|unnest_longer indices|expand list column"
auto_link_case_sensitive: true
target_keyword: "tidyr unnest_longer"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr unnest_longer() in R: Expand Vector List Columns Into Rows

<p class="lead">The <code>unnest_longer()</code> function in tidyr expands a list-column where each cell is an ATOMIC VECTOR into multiple rows, one per element. It is the row-wise unnest specialized for vectors.</p>

[QUICK ANSWER]
df |> unnest_longer(col)                 # one row per element
df |> unnest_longer(col, indices_to = "i") # add 1, 2, ... index per row
df |> unnest_longer(col, values_to = "v")  # custom value column name
df |> unnest(col)                          # different: for tibble lists
df |> unnest_wider(col)                    # different: spread to columns

[DECISION TREE: Is unnest_longer() the right tool?]
- list column of vectors -> rows: unnest_longer()
- list column of tibbles -> rows: unnest()
- list column of named lists -> columns: unnest_wider()
- track position via indices_to: unnest_longer(col, indices_to = "i")
- string list -> rows: unnest_longer (or separate_longer_delim)

## What unnest_longer() does in one sentence

**`unnest_longer(data, col, indices_to = NULL, values_to = NULL)` expands a list-column of atomic vectors into multiple rows; each element of each vector becomes its own row.** Other columns are duplicated.

## Syntax

**`unnest_longer(data, col, ..., indices_to = NULL, values_to = NULL, keep_empty = FALSE)`.**

```r title="Each vector element to its own row"
library(tidyr)
library(dplyr)

df <- tibble(id = 1:2, vals = list(c(10, 20, 30), c(40, 50)))

df |>
  unnest_longer(vals)
#>   id vals
#> 1  1   10
#> 2  1   20
#> 3  1   30
#> 4  2   40
#> 5  2   50
```

[TIP]
**Pair `unnest_longer()` with `indices_to = "pos"` to track which element each row came from.** Useful for time-series-like data inside list columns.

## Five common patterns

### 1. Standard vector unnest

```r title="Vectors to rows"
df |> unnest_longer(vals)
```

### 2. With position index

```r title="Add 1, 2, 3, ... per element"
df |> unnest_longer(vals, indices_to = "position")
#>   id vals position
#> 1  1   10        1
#> 2  1   20        2
#> 3  1   30        3
#> 4  2   40        1
#> 5  2   50        2
```

### 3. From strsplit results

```r title="Split a string then unnest"
df <- tibble(id = 1:2, tags = c("a,b,c","d,e"))

df |>
  mutate(tag_list = strsplit(tags, ",")) |>
  unnest_longer(tag_list)
```

(For this specific case, `separate_longer_delim` is cleaner.)

### 4. Custom column name

```r title="Rename via values_to"
df |>
  unnest_longer(vals, values_to = "value")
#> Renames the unnested column from "vals" to "value"
```

### 5. Empty cells

```r title="Drop or keep empty list cells"
df <- tibble(id = 1:3, vals = list(c(1,2), integer(0), c(3)))
df |> unnest_longer(vals)                    # default: drop empty
df |> unnest_longer(vals, keep_empty = TRUE) # keep as NA row
```

[KEY INSIGHT]
**`unnest_longer` is for VECTOR list columns; `unnest` is for TIBBLE list columns.** They look similar but expect different cell types. The right one to call depends on what's IN the list column.

## unnest_longer() vs unnest() vs unnest_wider()

| Function | List column contains | Output |
|---|---|---|
| `unnest()` | Tibbles | Rows |
| `unnest_longer()` | Atomic vectors | Rows |
| `unnest_wider()` | Named lists | Columns |

When to use which:

- unnest for nested data frames.
- unnest_longer for vectors (each element a row).
- unnest_wider for named lists (each name a column).

## A practical workflow

**Use unnest_longer for tag-list columns or time-series-like list cells.**

```r
posts |>
  mutate(tag_list = strsplit(tags, ",")) |>
  unnest_longer(tag_list, indices_to = "tag_position")
```

Each tag becomes a row; tag_position tracks where it appeared in the original.

## Common pitfalls

**Pitfall 1: confusing with separate_longer_delim.** For string columns with delimiters, separate_longer_delim is more direct (no list column needed first).

**Pitfall 2: empty list cells dropped silently.** Use `keep_empty = TRUE` to preserve as NA rows.

[WARNING]
**`unnest_longer()` can produce huge output if list columns have large vectors.** A list column of 1000-element vectors with 1000 rows = 1M output rows.

## Try it yourself

**Try it:** Expand a list column of numeric vectors with position indices. Save to `ex_long`.

```r title="Your turn: track positions"
df <- tibble(id = 1:2, scores = list(c(10, 20, 30), c(40, 50)))

ex_long <- df |>
  # your code here

ex_long
#> Expected: 5 rows with scores and a position column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_long <- df |>
  unnest_longer(scores, indices_to = "pos")

ex_long
#>   id scores pos
#> 1  1     10   1
#> 2  1     20   2
#> 3  1     30   3
#> 4  2     40   1
#> 5  2     50   2
```

**Explanation:** Each vector element becomes a row; pos tracks its index within the original vector.

</details>

## Related tidyr functions

After mastering unnest_longer, look at:

- `unnest()`: for tibble list columns
- `unnest_wider()`: named lists to columns
- `separate_longer_delim()`: split string column into rows
- `purrr::map()`: per-cell transformation
- `nest()`: opposite (collapse to list column)

## FAQ

**What does unnest_longer do in tidyr?**

`unnest_longer(data, col)` expands a list column of atomic vectors into rows; each element becomes its own row. Other columns are duplicated.

**What is the difference between unnest_longer and unnest?**

unnest_longer expects vectors in cells. unnest expects tibbles. Different input shapes.

**How do I track position with unnest_longer?**

Pass `indices_to = "position"` to add a position column with 1, 2, 3, ... per row indicating where each element came from in the original vector.

**Does unnest_longer drop empty cells?**

Yes by default. Pass `keep_empty = TRUE` to preserve them as NA rows.

**What is the difference between unnest_longer and separate_longer_delim?**

unnest_longer expects a list-column of vectors already. separate_longer_delim splits a string column directly. For strings, separate_longer_delim is one step shorter.
