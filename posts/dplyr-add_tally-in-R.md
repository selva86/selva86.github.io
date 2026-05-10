---
title: "dplyr add_tally() in R: Group Count, Keep Rows"
slug: "dplyr-add_tally-in-R"
description: "Use dplyr add_tally() to add a count column to an already-grouped tibble without collapsing rows in R. Covers add_tally vs add_count, wt, and 5 examples."
keywords: "dplyr add_tally, R add tally column, add_tally vs add_count, dplyr group count keep rows, weighted tally R, mutate n() dplyr"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "add_tally()|dplyr add_tally|add_tally vs add_count|tally without summarise|add count grouped"
auto_link_case_sensitive: true
target_keyword: "dplyr add_tally"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr add_tally() in R: Add Group Count to Already-Grouped Data

<p class="lead">The <code>add_tally()</code> function in dplyr adds a column with the per-group row count to every row of an already-grouped tibble, WITHOUT collapsing the data. It is the mutate-style counterpart of <code>tally()</code>.</p>

[QUICK ANSWER]
df |> group_by(g) |> add_tally()              # adds n column; keeps grouping
df |> group_by(g) |> add_tally(sort = TRUE)   # sort desc by n
df |> group_by(g) |> add_tally(name = "size") # rename added column
df |> group_by(g) |> add_tally(wt = price)    # weighted: sum(price)
df |> group_by(g) |> mutate(n = n())          # equivalent without ungroup
df |> add_count(g)                            # one-step alternative

[DECISION TREE: add_tally vs add_count?]
- already grouped via group_by(): add_tally()
- not yet grouped: add_count(g) (does grouping for you)
- want summary one row per group: tally() / count(g)
- weighted: add_tally(wt = w) or add_count(g, wt = w)
- multiple aggregates: group_by + mutate

## What add_tally() does in one sentence

**`add_tally(df)` is `mutate(df, n = n())` for a grouped tibble.** It adds a column `n` with the per-group row count, keeps all rows, and preserves the existing grouping.

`add_tally()` and `add_count()` are sisters. The difference: `add_count(df, g)` includes the grouping step; `add_tally()` assumes you already grouped.

## Syntax

**`add_tally(x, wt = NULL, sort = FALSE, name = NULL)`. Operates on a (typically grouped) data frame.**

```r title="Add count column to grouped mtcars"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  add_tally() |>
  select(mpg, cyl, n) |>
  head(5)
#>                    mpg cyl  n
#> Mazda RX4         21.0   6  7
#> Mazda RX4 Wag     21.0   6  7
#> Datsun 710        22.8   4 11
#> ...
```

[TIP]
**Use `add_count(g)` if you have NOT yet grouped; use `add_tally()` if you already did.** Functionally similar; argument shape differs by entry point.

## Five common patterns

### 1. Add count after group_by

```r title="Standard pattern"
mtcars |>
  group_by(cyl) |>
  add_tally()
```

Each row knows its cyl group's size.

### 2. Filter to common groups

```r title="Keep cyl groups with >= 10 rows"
mtcars |>
  group_by(cyl) |>
  add_tally() |>
  filter(n >= 10) |>
  ungroup()
```

The mutate-style way to filter rare groups.

### 3. Sort by group size

```r title="Largest group first"
mtcars |>
  group_by(cyl) |>
  add_tally(sort = TRUE) |>
  head(3)
```

### 4. Weighted tally

```r title="Sum of a column, not row count"
mtcars |>
  group_by(cyl) |>
  add_tally(wt = wt, name = "total_weight")
```

### 5. Compute proportion within group

```r title="Each row's share of group total"
mtcars |>
  group_by(cyl) |>
  add_tally(wt = wt) |>
  mutate(share = wt / n)
```

A common pattern: `add_tally(wt = x)` gives the group sum; divide each row's value by it for share-of-group.

[KEY INSIGHT]
**`add_tally()` is just `mutate(n = n())` with extra options (`sort`, `name`, `wt`).** When the options aren't needed, `mutate(n = n())` is equally clear. Reach for `add_tally` when you want named or sorted output without writing those mutations by hand.

## add_tally() vs add_count() vs mutate(n = n())

**Three ways to add a count column without collapsing.**

| Approach | Pre-grouped? | Best for |
|---|---|---|
| `add_tally()` | Yes (must be grouped) | After group_by, no extra args |
| `add_count(df, g)` | No (does grouping) | One-step group + count |
| `group_by(g) %>% mutate(n = n())` | n/a | Explicit; combine with other mutations |

When to use which:

- `add_count(g)` for one-step "add count by g".
- `add_tally()` after an existing group_by.
- `mutate(n = n())` if you also need other per-group computations alongside.

## A practical workflow

**The "share of group" pattern is the killer use case for add_tally with wt.**

```r title="Share of group revenue"
df |>
  group_by(category) |>
  add_tally(wt = revenue, name = "category_total") |>
  mutate(share_of_category = revenue / category_total)
```

Each row knows its category's total revenue and its own share. One pipeline, no joins.

For row-count proportions:

```r title="Inverse-frequency weighting"
df |>
  group_by(category) |>
  add_tally(name = "category_size") |>
  mutate(weight = 1 / category_size)
```

Inverse-frequency weighting: rare categories get higher weight.

## Common pitfalls

**Pitfall 1: column name clash.** If your data has an existing `n` column, add_tally silently overwrites. Use `name = "..."` to avoid surprises.

**Pitfall 2: forgetting to ungroup.** add_tally keeps the input grouping. Downstream verbs continue operating per-group. Add `ungroup()` if you don't want that.

[WARNING]
**`add_tally()` requires `group_by()` first to be useful.** On an ungrouped frame, it adds `n = nrow(df)` as a constant column: same number on every row. Probably not what you want.

## When add_tally beats explicit mutate

**For pure row counts, `mutate(n = n())` is just as clear as `add_tally()`.** The reason to reach for add_tally is the extra options it provides: `sort` re-orders rows by group size, `wt` switches from row count to a weighted sum, and `name` lets you avoid the default `n` column name. None of these are dramatic but together they make grouped pipelines shorter. For richer per-group computations (mean, sd, count, all in one step), drop add_tally and use `summarise()` or `mutate()` with multiple expressions directly.

## Try it yourself

**Try it:** For each `cyl` group, add a column with the total horsepower of that group. Save to `ex_hp_total`.

```r title="Your turn: total hp per cyl group"
ex_hp_total <- mtcars |>
  # your code here

head(ex_hp_total)
#> Expected: original rows + new column with cyl-group's total hp
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_hp_total <- mtcars |>
  group_by(cyl) |>
  add_tally(wt = hp, name = "cyl_total_hp") |>
  ungroup()

head(ex_hp_total[, c("mpg","cyl","hp","cyl_total_hp")])
#>                    mpg cyl  hp cyl_total_hp
#> Mazda RX4         21.0   6 110          856
#> ...
```

**Explanation:** `add_tally(wt = hp)` returns `sum(hp)` per cyl group, named via `name`. Each row knows its cyl group's total hp.

</details>

## Related count functions

After mastering add_tally, look at:

- `add_count()`: same idea, does grouping for you
- `tally()`: summarise version of add_tally
- `count()`: summarise version of add_count
- `n()`: per-group row count, inside mutate / summarise
- `cur_group_id()` / `cur_group_rows()`: identify current group
- `mutate(n = n())`: explicit equivalent

For multi-statistic per-group additions, `group_by + mutate(several = ...)` is more flexible than chained add_tally calls.

## FAQ

**What is the difference between add_tally and add_count in dplyr?**

`add_count(df, g)` does both grouping and counting in one call. `add_tally(df)` requires the data to already be grouped via `group_by()`. Otherwise identical behavior.

**How do I add a row count without collapsing rows?**

Use `add_count(df, group_col)` (one step) or `df |> group_by(group_col) |> add_tally()` (two steps). Both keep all rows and add column `n`.

**What does the wt argument do in add_tally?**

`add_tally(wt = col)` adds `sum(col)` per group instead of the row count. The new column is still named `n` by default; rename with `name = "..."`.

**When should I use add_tally instead of mutate(n = n())?**

When you also want `sort` or `name` arguments, or to use `wt`. For pure row-count addition, `mutate(n = n())` is equally clear.

**Does add_tally ungroup the result?**

No. add_tally keeps the existing grouping. Use `add_count` (which ungroups) or chain `ungroup()` if you want to drop grouping after.
