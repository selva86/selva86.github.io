---
title: "dplyr cur_group() in R: Access Current Group Inside Verbs"
slug: "dplyr-cur_group-in-R"
description: "Use dplyr cur_group() and friends to access the current group inside summarise or mutate in R. Covers cur_group, cur_group_id, cur_group_rows, 5 examples."
keywords: "dplyr cur_group, R cur_group_id, cur_group_rows, dplyr group introspection, current group dplyr, group context"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cur_group()|cur_group_id()|cur_group_rows()|dplyr cur_group|current group context"
auto_link_case_sensitive: true
target_keyword: "dplyr cur_group"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr cur_group() in R: Access Current Group Inside Verbs

<p class="lead">The <code>cur_group()</code> family in dplyr (<code>cur_group()</code>, <code>cur_group_id()</code>, <code>cur_group_rows()</code>) gives access to the CURRENT group's identity inside <code>summarise()</code> or <code>mutate()</code> on a grouped tibble.</p>

[QUICK ANSWER]
df |> group_by(g) |> summarise(grp_id = cur_group_id())
df |> group_by(g) |> mutate(grp_label = cur_group()$g)
df |> group_by(g) |> summarise(idx = list(cur_group_rows()))
df |> group_by(g) |> mutate(grp_n = length(cur_group_rows()))
n_distinct(...)                          # different: not group identity
cur_data() |> some_fn()                  # deprecated: use pick(everything())

[DECISION TREE: Is cur_group() the right tool?]
- get the current group's column values: cur_group()
- get a unique INTEGER per group: cur_group_id()
- get row indices in the current group: cur_group_rows()
- get the group's data frame (deprecated): pick(everything())
- access ALL columns inside summarise: pick(everything())

## What cur_group() does in one sentence

**`cur_group()` returns a 1-row tibble with the values of the grouping columns FOR THE CURRENT GROUP, when called inside a dplyr verb on a grouped tibble.** Useful when you need to know which group you're in (e.g., for printing diagnostics, building per-group filenames).

The full family:

- `cur_group()`: 1-row tibble of grouping values.
- `cur_group_id()`: unique integer 1..n_groups identifying the current group.
- `cur_group_rows()`: integer vector of row indices in the original frame.

## Syntax

**No arguments. Must be called inside dplyr verbs (`summarise`, `mutate`, `filter`) on a grouped tibble.**

```r title="Get current group identity inside summarise"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(grp_id = cur_group_id(),
            grp    = cur_group()$cyl)
#> # A tibble: 3 x 3
#>     cyl grp_id   grp
#>     4      1     4
#>     6      2     6
#>     8      3     8
```

[TIP]
**`cur_group_id()` is the simplest and most useful: it gives a unique integer per group.** Use it for color-coding, logging, or building per-group identifiers.

## Five common patterns

### 1. Unique integer per group

```r title="cur_group_id for stable group numbering"
mtcars |>
  group_by(cyl) |>
  mutate(grp_id = cur_group_id())
```

Each cyl group gets a unique integer ID. Useful for downstream group-aware analysis or color schemes.

### 2. Print diagnostics per group

```r title="Inside mutate or summarise"
mtcars |>
  group_by(cyl) |>
  summarise(
    n      = n(),
    avg    = mean(mpg),
    note   = paste("group:", cur_group()$cyl, "n=", n())
  )
```

### 3. Row indices per group

```r title="Original-frame indices for each group"
mtcars |>
  group_by(cyl) |>
  summarise(rows = list(cur_group_rows()))
#> # A tibble: 3 x 2
#>     cyl rows
#>     4   <int [11]>
#>     6   <int [7]>
#>     8   <int [14]>
```

`cur_group_rows()` returns the indices of rows in the CURRENT group within the ORIGINAL frame.

### 4. Per-group file output

```r title="Save each group as separate CSV"
mtcars |>
  group_by(cyl) |>
  group_walk(~ write_csv(.x, paste0("cyl_", .y$cyl, ".csv")))
```

`group_walk` is a higher-level alternative; for in-summary file naming, cur_group() works.

### 5. Group-specific reference data

```r title="Pick from a lookup keyed by current group"
lookup <- tibble(cyl = c(4, 6, 8), label = c("eco","mid","big"))

mtcars |>
  group_by(cyl) |>
  mutate(label = lookup$label[match(cur_group()$cyl, lookup$cyl)])
```

[KEY INSIGHT]
**`cur_group_id()` is the most-used member of this family: it gives a stable per-group integer ID.** `cur_group()` returns the actual values; `cur_group_rows()` returns indices. They're rarely needed in everyday work but valuable for advanced per-group operations.

## cur_group() vs cur_group_id() vs cur_group_rows()

**Three group-introspection functions.**

| Function | Returns | Best for |
|---|---|---|
| `cur_group()` | 1-row tibble of grouping values | "What group am I in?" |
| `cur_group_id()` | Single integer | Unique per-group ID |
| `cur_group_rows()` | Integer vector | Row indices in original frame |
| `cur_data()` | Deprecated | Use pick(everything()) |
| `cur_data_all()` | Deprecated | Use pick(everything()) |

When to use which:

- `cur_group_id` for stable per-group integer IDs.
- `cur_group` for the actual grouping column values.
- `cur_group_rows` for accessing the original frame's row indices.

## A practical workflow

**The "per-group file output" or "per-group named element" pattern uses cur_group.**

```r title="Per-group output paths"
results_per_cyl <- mtcars |>
  group_by(cyl) |>
  summarise(
    avg_mpg  = mean(mpg),
    plot_path = paste0("plots/cyl_", cur_group()$cyl, ".png")
  )
```

Build per-group output paths or labels.

For unique integer IDs in joins:

```r title="Stable per-group integer IDs"
mtcars_with_group_id <- mtcars |>
  group_by(cyl) |>
  mutate(group_id = cur_group_id()) |>
  ungroup()
```

`group_id` is now stable; can be joined or used for downstream identification.

## Common pitfalls

**Pitfall 1: calling outside dplyr verbs.** `mtcars |> cur_group()` errors. cur_group must be inside `summarise`, `mutate`, or `filter` on a grouped tibble.

**Pitfall 2: cur_data() is deprecated.** It returned the current group's data frame. Use `pick(everything())` in modern code.

[WARNING]
**`cur_group_id()` returns SEQUENTIAL integers based on the GROUPED ORDER, not the original group_by argument values.** If you `group_by(category)` and category has values "B", "A", "C", cur_group_id may not be 1=A, 2=B, 3=C. It depends on how dplyr orders groups internally.

## Why cur_group_id is the most useful member

**Of the cur_group family, cur_group_id is the one that comes up most often in real pipelines.** It returns a stable integer per group, which is perfect for feeding into joins, color palettes, or as an alternative to factor codes. cur_group itself is rarely needed because the grouping columns are usually accessible via the result tibble. cur_group_rows is even more niche. If you find yourself reaching for cur_data(), switch to pick(everything()) instead — same result, cleaner intent, future-proof.

## Try it yourself

**Try it:** Add a unique `group_id` column to mtcars based on cyl group. Save to `ex_ids`.

```r title="Your turn: group integer IDs"
ex_ids <- mtcars |>
  # your code here

head(ex_ids[, c("mpg","cyl","group_id")])
#> Expected: group_id 1, 2, or 3 per row depending on cyl
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ids <- mtcars |>
  group_by(cyl) |>
  mutate(group_id = cur_group_id()) |>
  ungroup()

head(ex_ids[, c("mpg","cyl","group_id")])
#>                    mpg cyl group_id
#> Mazda RX4         21.0   6        2
#> Mazda RX4 Wag     21.0   6        2
#> Datsun 710        22.8   4        1
#> Hornet 4 Drive    21.4   6        2
#> Hornet Sportabout 18.7   8        3
#> Valiant           18.1   6        2
```

**Explanation:** `cur_group_id()` returns a unique integer per cyl group: 1 for cyl=4, 2 for cyl=6, 3 for cyl=8.

</details>

## Related dplyr functions

After mastering cur_group, look at:

- `group_by()` / `ungroup()`: standard grouping
- `pick(everything())`: replaces deprecated cur_data()
- `n()`: count rows in current group
- `groups()`: list of grouping columns (top-level)
- `group_walk()` / `group_map()`: apply function per group
- `dplyr::group_split()`: split grouped df into list

For "apply function per group with side effects", `group_walk()` is more convenient than cur_group inside summarise.

## FAQ

**What does cur_group do in dplyr?**

`cur_group()` returns a 1-row tibble of the current group's grouping column values, when called inside a dplyr verb on a grouped tibble.

**What is the difference between cur_group and cur_group_id?**

cur_group returns a 1-row tibble of column values. cur_group_id returns a single integer (stable per-group ID).

**What does cur_group_rows return?**

It returns an integer vector of row indices in the ORIGINAL data frame that belong to the current group. Useful for advanced per-group operations.

**Is cur_data deprecated?**

Yes, since dplyr 1.1. Use `pick(everything())` instead, which returns the current group's data as a tibble.

**Can I use cur_group_id outside summarise / mutate?**

No. The cur_group family must be called inside dplyr verbs on a grouped tibble. Outside that context, they error.
