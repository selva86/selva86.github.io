---
title: "dplyr cur_group_id() in R: Stable Integer ID Per Group"
slug: "dplyr-cur_group_id-in-R"
description: "Use dplyr cur_group_id() to get a stable unique integer ID for the current group inside summarise or mutate in R. Covers vs cur_group, 5 worked examples."
keywords: "dplyr cur_group_id, R group integer ID, cur_group_id vs cur_group, dplyr stable group identifier, group ID dplyr, sequential group integer"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cur_group_id()|dplyr cur_group_id|stable group ID|group integer identifier|sequential group id"
auto_link_case_sensitive: true
target_keyword: "dplyr cur_group_id"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr cur_group_id() in R: Stable Integer ID Per Group

<p class="lead">The <code>cur_group_id()</code> function in dplyr returns a unique integer 1..n_groups identifying the current group inside <code>summarise()</code> or <code>mutate()</code> on a grouped tibble.</p>

[QUICK ANSWER]
df |> group_by(g) |> mutate(grp_id = cur_group_id())
df |> group_by(g) |> summarise(grp_id = cur_group_id(), n = n())
cur_group()$g                            # alternative: actual group values
match(g, unique(g))                       # base R equivalent (less robust)

[DECISION TREE: Is cur_group_id() the right tool?]
- need a stable integer per group: cur_group_id()
- need the group's column values: cur_group()
- need row indices in current group: cur_group_rows()
- need just group-aware mutate: group_by + mutate

## What cur_group_id() does in one sentence

**`cur_group_id()` returns a single integer between 1 and n_groups, unique per group, when called inside a dplyr verb on a grouped tibble.** Useful for adding integer group IDs without manually computing them.

## Syntax

**No arguments. Must be inside a dplyr verb on a grouped tibble.**

```r title="Stable per-group integer"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  mutate(grp_id = cur_group_id()) |>
  select(mpg, cyl, grp_id) |>
  head(5)
#>            mpg cyl grp_id
#> Mazda RX4 21.0   6      2
#> Mazda RX4 Wag 21.0 6    2
#> Datsun 710 22.8  4      1
#> Hornet 4 Drive 21.4 6   2
#> Hornet Sportabout 18.7 8 3
```

[TIP]
**`cur_group_id()` returns SEQUENTIAL integers in the order dplyr processes groups.** This may not match alphabetical or numeric order of the grouping column.

## Five common patterns

### 1. Add stable group ID

```r title="Each row gets its group's ID"
mtcars |>
  group_by(cyl) |>
  mutate(grp_id = cur_group_id())
```

### 2. Use ID as factor levels

```r title="Stable codes for grouped categorical"
df |>
  group_by(category) |>
  mutate(category_code = cur_group_id())
```

### 3. Group-specific seed for randomness

```r title="Deterministic per-group sample"
df |>
  group_by(g) |>
  mutate(rand = {
    set.seed(cur_group_id())
    runif(n())
  })
```

### 4. Track progress in long pipelines

```r title="Print group ID for diagnostics"
df |>
  group_by(g) |>
  summarise(
    grp_id = cur_group_id(),
    n      = n(),
    .groups = "drop"
  )
```

### 5. Combine with cur_group for full context

```r title="Both ID and values"
mtcars |>
  group_by(cyl, gear) |>
  summarise(
    id   = cur_group_id(),
    cyl  = cur_group()$cyl,
    gear = cur_group()$gear,
    n    = n()
  )
```

[KEY INSIGHT]
**`cur_group_id()` is the most-used member of the cur_group family.** It gives you a clean integer per group, perfect for joining, color-coding, or as a stable surrogate key.

## cur_group_id() vs cur_group() vs match

**Three ways to identify groups in dplyr.**

| Function | Returns | Best for |
|---|---|---|
| `cur_group_id()` | Single integer | Stable per-group ID |
| `cur_group()` | 1-row tibble | Actual column values |
| `cur_group_rows()` | Integer vector | Row indices in original frame |
| `match(g, unique(g))` | Integer vector | Base R alternative |

When to use which:

- `cur_group_id` for stable ID that doesn't change with row order.
- `cur_group` for the actual grouping column values.
- `cur_group_rows` for advanced per-group operations.

## A practical workflow

**Use cur_group_id when you need a stable integer key per group for downstream use.**

```r
df_with_id <- df |>
  group_by(category, subcategory) |>
  mutate(group_key = cur_group_id()) |>
  ungroup()

# Now group_key is a stable integer for joins or color schemes
```

The integer is consistent across reruns of the same data.

## Common pitfalls

**Pitfall 1: ID order is dplyr-defined, not value-sorted.** Don't assume cur_group_id == 1 means the smallest grouping value. dplyr's internal ordering may differ.

**Pitfall 2: errors outside dplyr verbs.** `mtcars |> cur_group_id()` errors. Must be inside summarise / mutate / filter.

[WARNING]
**`cur_group_id()` IDs are NOT stable across different `group_by` calls on the SAME data.** Calling `group_by(cyl)` and `group_by(gear)` produces different ID assignments. They are stable only within ONE group_by.

## Try it yourself

**Try it:** Add a stable integer ID per cyl group to mtcars. Save to `ex_ids`.

```r title="Your turn: per-cyl integer IDs"
ex_ids <- mtcars |>
  # your code here

unique(ex_ids[, c("cyl","grp_id")])
#> Expected: 3 unique pairs
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ids <- mtcars |>
  group_by(cyl) |>
  mutate(grp_id = cur_group_id()) |>
  ungroup()

unique(ex_ids[, c("cyl","grp_id")])
#>   cyl grp_id
#> 1   6      2
#> 2   4      1
#> 3   8      3
```

**Explanation:** Each cyl group gets a unique integer 1, 2, or 3.

</details>

## Related dplyr functions

After mastering cur_group_id, look at:

- `cur_group()`: actual grouping values
- `cur_group_rows()`: row indices
- `n()`: row count in current group
- `group_by()`: parent context for all cur_group_*
- `dense_rank()`: similar but operates on a column directly

For a column-based equivalent, `dense_rank(category)` produces stable integers from a categorical column without group_by.

## Why cur_group_id beats hand-computed IDs

**Computing group IDs manually with match or factor() works but breaks down with grouped pipelines.** cur_group_id is dplyr-aware and integrates naturally. It also produces consistent results across versions of dplyr, whereas custom match-based logic depends on data ordering. For reproducibility, prefer cur_group_id.

## FAQ

**What does cur_group_id return?**

A single integer between 1 and n_groups, unique to the current group inside summarise / mutate / filter.

**What is the difference between cur_group_id and cur_group?**

cur_group_id returns a single integer; cur_group returns a 1-row tibble of the actual grouping column values. Use ID for stable keys; cur_group for actual values.

**Are cur_group_id values stable across runs?**

Yes, for the same input data and the same `group_by()` call. Different group_by calls or different data may produce different IDs.

**Can I use cur_group_id outside dplyr?**

No. It must be inside `summarise`, `mutate`, or `filter` on a grouped tibble.

**How do I get a stable group ID without group_by?**

Use `dense_rank(col)` for a column-based stable integer. cur_group_id is for grouped contexts; dense_rank works at the top level.
