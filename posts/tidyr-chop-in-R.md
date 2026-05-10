---
title: "tidyr chop() in R: Group Rows Into List Columns"
slug: "tidyr-chop-in-R"
description: "Use tidyr chop() to combine rows into list columns by collapsing within groups in R. Covers vs nest, unchop, and 5 worked examples."
keywords: "tidyr chop, R chop list column, chop vs nest, unchop tidyr, group rows to list, tidyr chop"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::chop()|tidyr chop|chop list column|chop vs nest|group rows to list"
auto_link_case_sensitive: true
target_keyword: "tidyr chop"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr chop() in R: Group Rows Into List Columns

<p class="lead">The <code>chop()</code> function in tidyr collapses rows within groups into list-column cells. Each cell holds a vector of the values from rows in that group. It is a lighter-weight version of <code>nest()</code>.</p>

[QUICK ANSWER]
df |> chop(c(value))                    # vector list-col, one per group row
df |> chop(c(value, score))              # multiple list cols
df |> unchop(value)                       # opposite
df |> nest(.by = group)                   # different: tibble list col

[DECISION TREE: Is chop() the right tool?]
- collapse rows into vector list-col: chop()
- collapse rows into tibble list-col: nest()
- expand list col back to rows: unchop()
- specific cols only: chop(c(specific_cols))

## What chop() does in one sentence

**`chop(data, cols)` collapses each group's rows in `cols` into a list-column where each cell is a vector of the original values.** Lighter than nest, which creates a tibble per cell.

## Syntax

**`chop(data, cols, ..., error_call = caller_env())`. cols are the columns to collapse.**

```r title="Chop values per group"
library(tidyr)
library(dplyr)

df <- tibble(
  user = c("a","a","b","b","b"),
  visits = c(1, 2, 3, 4, 5)
)

df |>
  chop(visits)
#> # A tibble: 2 x 2
#>   user        visits
#>   <chr>       <list>
#> 1     a       <int [2]>
#> 2     b       <int [3]>
```

[TIP]
**chop is faster than nest when you only need vector list-cols, not tibbles.** Use chop for "collapse this column into per-group lists".

## Five common patterns

### 1. Standard chop

```r title="One vector per group"
df |> chop(visits)
```

Group columns are detected automatically (the unchosen ones).

### 2. Multiple chopped columns

```r title="Two list-cols, parallel"
df |> chop(c(visits, score))
```

### 3. Compute on chopped lists

```r title="Per-row aggregation"
df |>
  chop(visits) |>
  mutate(total = purrr::map_dbl(visits, sum),
         n     = purrr::map_int(visits, length))
```

### 4. Round-trip with unchop

```r title="chop then unchop"
df |> chop(visits) |> unchop(visits) |> identical(df)
```

### 5. Compare with nest

```r title="chop is lighter"
df |> chop(visits)         # list of integer vectors
df |> nest(data = visits)  # list of 1-column tibbles (heavier)
```

[KEY INSIGHT]
**`chop` is to `nest` as vectors are to data frames.** chop creates list-of-vector cells; nest creates list-of-tibble cells. For single-column collapsing, chop is more efficient.

## chop() vs nest() vs summarise(list(...))

| Function | Cell type | Best for |
|---|---|---|
| `chop(col)` | Vector | Single-column collapse |
| `nest(.by = g)` | Tibble | Multi-column collapse |
| `summarise(x = list(col))` | Vector (manual) | Inside summarise pipelines |

## A practical workflow

**Use chop for "list of values per group" patterns.**

```r
events |>
  chop(timestamp) |>
  mutate(first_event = purrr::map_int(timestamp, ~ as.integer(min(.x))),
         last_event  = purrr::map_int(timestamp, ~ as.integer(max(.x))))
```

Per group: list of timestamps, plus first and last.

## Common pitfalls

**Pitfall 1: forgetting cols argument.** `chop(df)` with no cols just returns df. You must specify which columns to collapse.

**Pitfall 2: confusing with nest.** chop = vectors; nest = tibbles. Different cell types.

[WARNING]
**`chop()` collapses by ALL non-chopped columns implicitly.** All other columns must be unique per group, or chop creates surprising groupings.

## Try it yourself

**Try it:** Chop the value column per group, count items per group. Save to `ex_chopped`.

```r title="Your turn: chop and count"
df <- tibble(g = c("a","a","b"), v = c(1, 2, 3))

ex_chopped <- df |>
  # your code here

ex_chopped$count
#> Expected: c(2, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_chopped <- df |>
  chop(v) |>
  mutate(count = purrr::map_int(v, length))

ex_chopped$count
#> [1] 2 1
```

**Explanation:** chop(v) collapses values per g; map_int(v, length) counts items.

</details>

## Related tidyr functions

After mastering chop, look at:

- `unchop()`: opposite (vectors to rows)
- `nest()`: tibble version
- `unnest()`: tibble version of unchop
- `summarise(list(...))`: alternative for collapse

## FAQ

**What does chop do in tidyr?**

`chop(data, cols)` collapses each group's rows in `cols` into a list-column where each cell is a vector. Lighter than nest.

**What is the difference between chop and nest?**

chop creates VECTOR list cells. nest creates TIBBLE list cells. chop for single-column collapse; nest for multi-column.

**Is chop faster than nest?**

Slightly, for single-column cases. The difference is small but chop avoids the tibble wrapping.

**How do I expand chopped columns?**

`unchop(col)` is the inverse. Returns the original row-per-row form.

**When should I use chop vs nest?**

chop for one or a few related columns into vectors. nest for collapsing all non-grouping columns into a tibble.
