---
title: "dplyr with_groups() in R: Apply Scoped Grouping"
slug: "dplyr-with_groups-in-R"
description: "Use dplyr with_groups() to apply a temporary grouping for one expression then restore the original grouping in R. Covers vs group_by, .by, and 5 examples."
keywords: "dplyr with_groups, R temporary grouping, with_groups vs group_by, dplyr 1.0 with_groups, restore grouping, scoped grouping"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "with_groups()|dplyr with_groups|temporary grouping|scoped grouping|with_groups vs .by"
auto_link_case_sensitive: true
target_keyword: "dplyr with_groups"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr with_groups() in R: Temporarily Group for One Expression

<p class="lead">The <code>with_groups()</code> function in dplyr applies a TEMPORARY grouping for a single function call, then restores the original grouping. It is a scoped variant of <code>group_by()</code>.</p>

[QUICK ANSWER]
df |> with_groups(g, mutate, x = mean(value))    # group, mutate, restore
df |> with_groups(g1, summarise, n = n())         # temp group then summarise
df |> with_groups(NULL, fn, ...)                   # ungroup, run fn, restore
df |> mutate(.by = g, x = mean(value))            # cleaner alternative (1.1+)
df |> group_by(g) |> mutate(x = mean(value)) |> ungroup() # equivalent

[DECISION TREE: Is with_groups() the right tool?]
- temporary grouping for one verb (dplyr <1.1): with_groups()
- temporary grouping for one verb (dplyr 1.1+): use .by argument
- multi-step grouped pipeline: group_by + ungroup
- dynamic grouping (column chosen at runtime): with_groups
- restore prior grouping: with_groups handles this

## What with_groups() does in one sentence

**`with_groups(.data, .groups, .f, ...)` calls `.f` on `.data` after temporarily applying `.groups`, then RESTORES the original grouping.** The result has whatever grouping `.data` had before the call.

This is dplyr's "scoped grouping" mechanism. It existed before the `.by` argument; for new code, `.by` is usually cleaner.

## Syntax

**`with_groups(.data, .groups, .f, ...)`. `.groups` is the temporary grouping (column or NULL); `.f` is the verb to apply.**

```r title="Compute per-group mean inside a single mutate"
library(dplyr)

mtcars |>
  with_groups(cyl, mutate, mpg_z = (mpg - mean(mpg)) / sd(mpg))
```

Equivalent to `group_by(cyl) |> mutate(...) |> ungroup()` but in one verb.

[TIP]
**For dplyr 1.1+, prefer `.by` argument over `with_groups()`.** It is more concise: `mutate(df, .by = cyl, mpg_z = ...)`. Reserve with_groups for legacy code or dynamic-grouping patterns.

## Five common patterns

### 1. Temporary group + mutate

```r title="Restore grouping after the call"
mtcars |>
  with_groups(cyl, mutate, rel_mpg = mpg / mean(mpg))
```

### 2. Temporary group + summarise

```r title="One-shot grouped summary"
mtcars |>
  with_groups(cyl, summarise, avg_mpg = mean(mpg))
```

### 3. Ungroup temporarily

```r title="Pass NULL to ungroup for one call"
df_grouped |>
  with_groups(NULL, mutate, total_n = n())  # n() over the whole frame
# Original grouping restored after this
```

### 4. Modern .by alternative (preferred)

```r title="dplyr 1.1+ replacement"
mtcars |>
  mutate(.by = cyl, rel_mpg = mpg / mean(mpg))
```

`.by` is shorter and more discoverable.

### 5. Dynamic grouping

```r title="Column chosen at runtime"
group_col <- "cyl"

mtcars |>
  with_groups(!!sym(group_col), mutate, rel_mpg = mpg / mean(mpg))
```

For dynamic grouping, with_groups (or `group_by(across(all_of(...)))`) is needed because `.by` doesn't accept dynamic column names cleanly.

[KEY INSIGHT]
**`with_groups` is "scoped grouping": pre-1.1 dplyr, this was the only way to have grouping affect ONE verb without leaking to subsequent verbs.** dplyr 1.1's `.by` argument is the modern equivalent. with_groups still has its place for legacy code and dynamic grouping.

## with_groups() vs .by vs group_by()

**Three ways to apply grouping in dplyr.**

| Approach | Scope | Best for |
|---|---|---|
| `with_groups(g, fn, ...)` | One function call | Pre-1.1 scoped grouping |
| `mutate(.by = g, ...)` | One verb (1.1+) | Modern scoped grouping |
| `group_by(g) |> ... |> ungroup()` | Multi-verb | Long grouped pipelines |

When to use which:

- `.by` for one-verb scoped grouping in modern code.
- `group_by` for multi-verb pipelines.
- `with_groups` for legacy code or dynamic grouping with non-standard evaluation.

## A practical workflow

**Use with_groups when you need to temporarily switch grouping mid-pipeline without breaking the chain.**

```r title="Mid-pipeline grouping switch"
df |>
  group_by(category) |>
  mutate(category_total = sum(amount)) |>
  # Now temporarily switch to subcategory grouping for one stat:
  with_groups(c(category, subcategory), mutate, sub_avg = mean(amount)) |>
  # Original (category) grouping is restored after
  summarise(...)
```

Without with_groups, you'd need explicit ungroup/regroup gymnastics.

## Common pitfalls

**Pitfall 1: confusion between `with_groups` and `group_by`.** with_groups is SCOPED (one call); group_by is PERSISTENT until ungroup. Mixing them up causes hard-to-diagnose bugs.

**Pitfall 2: dplyr 1.1 deprecation soft-warning.** with_groups isn't deprecated, but `.by` is recommended. Don't write new code with with_groups unless you have a reason.

[WARNING]
**`with_groups` arguments differ from typical dplyr functions: it expects `.f` second, then `...`.** Easy to write `df |> with_groups(g, mean(x))` (wrong) instead of `df |> with_groups(g, summarise, x = mean(x))` (right).

## Why scoped grouping matters

**The cleanest dplyr pipelines use scoped grouping (`.by` or with_groups) rather than persistent group_by/ungroup pairs.** Persistent grouping is "stateful" — every subsequent verb has to reason about whether the current grouping applies. Scoped grouping is "stateless" — each verb has explicit grouping per call. For pipelines longer than 3 to 4 verbs, scoped grouping is much easier to debug because you can read each verb in isolation. The pre-1.1 pattern was group_by/ungroup; modern pipelines should default to .by. with_groups remains useful for legacy code or dynamic-grouping scenarios where .by's syntax falls short.

## When to use over .by

**For modern dplyr code, `.by` is always preferred over with_groups for static grouping.** Reach for with_groups only in two specific cases: (1) maintaining legacy code consistency, and (2) when grouping columns are determined at runtime via `!!sym()` or `across(all_of(...))`. The `.by` argument has a small limitation around dynamic column name passing that with_groups handles cleanly.

## Try it yourself

**Try it:** Use `with_groups` to compute per-cyl mean mpg as a new column, without changing mtcars's grouping. Save to `ex_with_grp`.

```r title="Your turn: scoped grouping"
ex_with_grp <- mtcars |>
  # your code here

head(ex_with_grp[, c("mpg","cyl","cyl_avg_mpg")])
#> Expected: cyl_avg_mpg column added
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_with_grp <- mtcars |>
  with_groups(cyl, mutate, cyl_avg_mpg = mean(mpg))

head(ex_with_grp[, c("mpg","cyl","cyl_avg_mpg")])
#>                    mpg cyl cyl_avg_mpg
#> Mazda RX4         21.0   6      19.74286
#> Mazda RX4 Wag     21.0   6      19.74286
#> Datsun 710        22.8   4      26.66364
#> ...

# dplyr 1.1+ alternative:
ex_modern <- mtcars |> mutate(.by = cyl, cyl_avg_mpg = mean(mpg))
```

**Explanation:** with_groups applies cyl grouping to the mutate call only. The .by argument does the same in modern dplyr.

</details>

## Related dplyr functions

After mastering with_groups, look at:

- `group_by()` / `ungroup()`: persistent grouping
- `.by` argument: modern scoped grouping (1.1+)
- `cur_group()`, `cur_group_id()`, `cur_group_rows()`: introspection
- `group_split()`: split into list of frames per group
- `rowwise()`: per-row grouping
- `nest_join()`: nested grouping with list columns

For most modern code, `.by` replaces with_groups; check if it suits your case first.

## FAQ

**What does with_groups do in dplyr?**

`with_groups(.data, .groups, .f, ...)` applies a temporary grouping to .data, runs .f, and restores the original grouping. Scoped grouping for one function call.

**What is the difference between with_groups and group_by?**

group_by is PERSISTENT: subsequent verbs see the grouping until ungroup. with_groups is SCOPED: only the wrapped function sees the grouping; the original grouping is restored after.

**Should I use with_groups or .by in modern code?**

`.by` (dplyr 1.1+) is preferred for one-verb scoped grouping. It is shorter and more discoverable. Reserve with_groups for legacy code or dynamic grouping.

**How do I temporarily ungroup with with_groups?**

Pass `NULL` as the grouping: `with_groups(NULL, fn, ...)`. The function runs ungrouped; the original grouping is restored after.

**Is with_groups deprecated?**

Not deprecated, but soft-superseded by `.by` in dplyr 1.1+. New code should usually use `.by`.
