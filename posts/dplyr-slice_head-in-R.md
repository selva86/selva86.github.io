---
title: "dplyr slice_head() in R: Take the First N Rows (Per Group)"
slug: "dplyr-slice_head-in-R"
description: "Use dplyr slice_head() to take the first n rows of a tibble (or per group). Covers n, prop, .by, vs head() / slice(), grouped behavior, and 5 examples."
keywords: "dplyr slice_head, R first n rows, slice_head per group, dplyr top rows, slice_head vs head, dplyr slice_head .by, R top rows by group"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "slice_head()|dplyr slice_head|first n rows|top rows by group|head dplyr"
auto_link_case_sensitive: true
target_keyword: "dplyr slice_head"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr slice_head() in R: Take the First N Rows (Per Group)

<p class="lead">The <code>slice_head()</code> function in dplyr returns the FIRST n (or fraction) rows of a data frame, optionally per group. It is the dplyr-pipe-friendly replacement for base R <code>head()</code>.</p>

[QUICK ANSWER]
slice_head(df, n = 5)                       # first 5 rows
slice_head(df, prop = 0.1)                  # first 10% of rows
df |> group_by(g) |> slice_head(n = 3)      # 3 per group
slice_head(df, n = 3, by = cyl)             # per group via .by (dplyr 1.1+)
df |> arrange(x) |> slice_head(n = 5)       # smallest by x
head(df, 5)                                 # base R alternative

[DECISION TREE: Is slice_head() the right tool?]
- first n rows of a tibble: slice_head(n = N)
- first n rows PER GROUP: group_by + slice_head, or slice_head(.by = g)
- top n by a column: slice_max() (or arrange + slice_head)
- bottom n by a column: slice_min() (or arrange desc + slice_head)
- random sample: slice_sample(n = N)
- specific row indexes: slice(c(1,3,5))
- last n rows: slice_tail(n = N)

## What slice_head() does in one sentence

**`slice_head(.data, n = X)` keeps the first X rows of a tibble; on a grouped tibble it keeps the first X per group.** Use `prop = 0.1` instead of `n` to take a fraction.

This is dplyr's pipe-friendly answer to `head()`. The big advantage: it respects `group_by()` automatically and integrates cleanly with the rest of the dplyr verb set.

## Syntax

**`slice_head(.data, n = NULL, prop = NULL, by = NULL)`. Pass `n` OR `prop`, not both.**

```r title="First 5 rows"
library(dplyr)

mtcars |>
  slice_head(n = 5)
#>      mpg cyl ...
#> Mazda RX4    21.0 6
#> Mazda RX4 Wag 21.0 6
#> ...
```

[TIP]
**On a grouped tibble, `slice_head(n = 3)` returns 3 rows PER GROUP, not 3 total.** If you have 3 groups, you get 9 rows. Use `ungroup()` first or `slice_head(n = 3) |> head(3)` if you really want 3 total.

## Five common patterns

### 1. First n rows of an ungrouped data frame

```r title="Top 10"
mtcars |>
  slice_head(n = 10)
```

Equivalent to `head(mtcars, 10)`, but pipeline-friendly.

### 2. First n rows per group

```r title="3 cars per cylinder count"
mtcars |>
  group_by(cyl) |>
  slice_head(n = 3) |>
  ungroup()
```

Returns 3 rows per cylinder group (9 total since cyl has 3 unique values).

### 3. Use .by for one-step grouping (dplyr 1.1+)

```r title="No group_by needed"
mtcars |>
  slice_head(n = 3, by = cyl)
```

`by = cyl` scopes grouping to this verb only. No `ungroup()` needed downstream.

### 4. Top fraction with prop

```r title="Top 10% of rows"
mtcars |>
  slice_head(prop = 0.1)
```

Returns roughly 3 rows (10% of 32). Useful for quick samples.

### 5. Top n by a sorting column

```r title="3 highest MPG cars"
mtcars |>
  arrange(desc(mpg)) |>
  slice_head(n = 3)
```

Often easier: `slice_max(mtcars, mpg, n = 3)` does the same in one call.

[KEY INSIGHT]
**`slice_head()` returns positional first rows; `slice_max()` returns rank-based top rows.** They differ when the data is unsorted. `slice_head` cares about ROW ORDER; `slice_max` cares about a COLUMN VALUE. Use slice_max if you mean "top by metric"; use slice_head + arrange when row order matters.

## slice_head() vs head() vs slice() vs slice_max()

**Four ways to grab "some rows" in R, with different semantics.**

| Function | Returns | Per group? | Best for |
|---|---|---|---|
| `slice_head(n)` | First n rows | Yes | dplyr pipelines |
| `base::head(n)` | First n rows | No | Quick interactive use |
| `slice(c(1,3,5))` | Specific row indexes | Yes | Pick exact rows |
| `slice_max(col, n)` | Top n by column value | Yes | "Top n by metric" |
| `slice_min(col, n)` | Bottom n by column value | Yes | "Bottom n by metric" |
| `slice_sample(n)` | Random n rows | Yes | Random sampling |

When to use which:

- `slice_head` when row order is the criterion.
- `slice_max` / `slice_min` when a column value is the criterion.
- `slice_sample` for random subsets.
- `slice` for specific positional rows.

## A practical workflow

**Most "top N" tasks combine `arrange()` and `slice_head()` (or use `slice_max()` directly).** Common patterns:

1. **Top per group**: `group_by(g) |> arrange(desc(metric)) |> slice_head(n = 3) |> ungroup()`
2. **Quick preview**: `slice_head(n = 5)` mid-pipeline to inspect intermediate state
3. **Stratified sampling**: `slice_head(n = 10, by = group)` for equal-count subsets per group
4. **Pagination-like behavior**: `slice(((page-1)*size + 1):(page*size))` for arbitrary pages; `slice_head(n = size)` for the first page

## Common pitfalls

**Pitfall 1: per-group surprise.** `mtcars |> group_by(cyl) |> slice_head(n = 5)` returns 15 rows, not 5. The grouping is silently respected.

**Pitfall 2: `n` larger than the group size.** If a group has 4 rows and you ask for `n = 10`, you get all 4 rows (no warning). For strict size, validate group sizes first.

[WARNING]
**`slice_head()` returns rows in their CURRENT order; it does NOT sort.** If you want "top 5 by column X", combine with `arrange(X)` first, OR use `slice_max(X, n = 5)` which sorts internally.

## Try it yourself

**Try it:** Get the 2 cars with the LOWEST `mpg` per `cyl` group. Save to `ex_low_mpg`.

```r title="Your turn: bottom 2 mpg per cyl"
ex_low_mpg <- mtcars |>
  # your code here

ex_low_mpg
#> Expected: 6 rows (2 per cyl group)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_low_mpg <- mtcars |>
  group_by(cyl) |>
  arrange(mpg) |>
  slice_head(n = 2) |>
  ungroup()

# Or equivalently:
ex_low_mpg <- mtcars |>
  slice_min(mpg, n = 2, by = cyl)
```

**Explanation:** `arrange(mpg)` sorts ascending; `slice_head(n = 2)` per group picks the 2 lowest. `slice_min(mpg, n = 2)` does both steps internally.

</details>

## Related slice functions

After mastering slice_head, look at:

- `slice_tail()`: last n rows (per group)
- `slice_max()` / `slice_min()`: top/bottom n by a column value
- `slice_sample()`: random n rows
- `slice()`: specific positional rows by index
- `top_n()` / `top_frac()`: superseded; prefer slice_max
- `head()` / `tail()`: base R, not group-aware

For "top N by column", `slice_max(col, n = N)` is more direct than `arrange(desc(col)) |> slice_head(n = N)`.

## FAQ

**What is the difference between slice_head and head in R?**

`head(df, n)` is base R: takes first n rows of the WHOLE data frame, ignores grouping. `slice_head(df, n)` is dplyr: respects `group_by()` and works inside pipelines.

**How do I get the first n rows per group in dplyr?**

`df |> group_by(g) |> slice_head(n = 3)` returns the first 3 rows per group. Or `slice_head(df, n = 3, by = g)` in dplyr 1.1+.

**What is the difference between slice_head and slice_max?**

`slice_head(n)` returns the FIRST n rows in their current order. `slice_max(col, n)` returns the TOP n rows BY a column value (sorts internally).

**Can slice_head take a fraction?**

Yes: `slice_head(df, prop = 0.1)` returns the first 10% of rows. With grouping, 10% per group.

**How do I avoid the per-group default?**

Either ungroup first: `df |> ungroup() |> slice_head(n = 3)`, or use `head(df, 3)` (base R, never per-group).
