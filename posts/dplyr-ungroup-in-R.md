---
title: "dplyr ungroup() in R: Remove Grouping Before Next Step"
slug: "dplyr-ungroup-in-R"
description: "Use dplyr ungroup() to drop group_by structure before mutate, summarise, or join in R. Covers when to ungroup, .by alternative, and 5 worked examples."
keywords: "dplyr ungroup, R ungroup, group_by ungroup, dplyr remove grouping, when to ungroup R, dplyr .by, dplyr group structure"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "ungroup()|dplyr ungroup|remove grouping|grouped data frame|.by argument"
auto_link_case_sensitive: true
target_keyword: "dplyr ungroup"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr ungroup() in R: Remove Grouping Before Next Step

<p class="lead">The <code>ungroup()</code> function in dplyr removes the group structure that <code>group_by()</code> attached, so subsequent verbs operate on the whole data frame again. It is the explicit cleanup step every grouped pipeline needs.</p>

[QUICK ANSWER]
df |> group_by(g) |> mutate(rank = rank(x)) |> ungroup()
df |> group_by(g) |> summarise(n = n())          # auto-ungroups one level
df |> group_by(g) |> ungroup() |> nrow()         # drop grouping, count all
df |> group_by(g1, g2) |> ungroup(g2)            # remove ONE grouping var
mutate(df, .by = g, rank = rank(x))              # alternative: per-call grouping, no ungroup needed

[DECISION TREE: Do you need ungroup()?]
- finished a grouped operation, next step should see all rows: ungroup()
- after summarise() with multiple group vars: still grouped by all but the last, ungroup() to be safe
- pipeline ends here and result is consumed downstream: always ungroup()
- using .by arg in dplyr 1.1+: no ungroup() needed
- joining to another data frame: ungroup() first to avoid surprise group joins

## What ungroup() does in one sentence

**`ungroup(.data, ...)` strips the `groups` attribute from a `grouped_df`, returning a regular tibble (or data frame) where the next verb sees every row in one bucket.** With no extra args, it removes ALL grouping; with named columns, it removes only those.

This is how dplyr separates "compute per-group" from "compute across the whole table". Forgetting `ungroup()` is the single most common source of "why is mutate giving me odd numbers?" bugs.

## Syntax

**`ungroup(x, ...)`. With `...` empty it removes all grouping; with column names it removes those specific levels.**

```r title="Ungroup after a grouped mutate"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  mutate(rel_mpg = mpg / mean(mpg)) |>
  ungroup() |>
  arrange(desc(rel_mpg)) |>
  head(3)
#>     mpg cyl ... rel_mpg
#> ...
```

[TIP]
**`summarise()` peels off ONE grouping level automatically; `mutate()` and `filter()` do NOT.** After `group_by(g1, g2) |> summarise(...)` the result is still grouped by `g1`. Always `ungroup()` if downstream code shouldn't care.

## Five common patterns

### 1. Standard cleanup at the end of a grouped pipeline

```r title="Compute per-group then return ungrouped"
mtcars |>
  group_by(cyl) |>
  mutate(z = (mpg - mean(mpg)) / sd(mpg)) |>
  ungroup()
```

This is the canonical pattern. Without `ungroup()`, downstream `mutate()`s would still operate per-group.

### 2. Drop only ONE grouping variable

```r title="Keep cyl, remove gear grouping"
mtcars |>
  group_by(cyl, gear) |>
  mutate(within = mean(mpg)) |>
  ungroup(gear)
#> # Groups: cyl
```

`ungroup(gear)` removes that one column from the group structure.

### 3. After summarise() with multiple groups

```r title="summarise leaves residual grouping"
mtcars |>
  group_by(cyl, gear) |>
  summarise(avg = mean(mpg), .groups = "drop_last")
# still grouped by cyl

# Cleaner:
mtcars |>
  group_by(cyl, gear) |>
  summarise(avg = mean(mpg), .groups = "drop")
```

`.groups = "drop"` is equivalent to chaining `ungroup()` after summarise.

### 4. Replace ungroup with .by (dplyr 1.1+)

```r title="Per-call grouping; no ungroup needed"
mtcars |>
  mutate(rel_mpg = mpg / mean(mpg), .by = cyl)
```

`.by` scopes grouping to ONE verb only. No grouping leaks into the next step. For new code, this often replaces `group_by() |> mutate() |> ungroup()`.

### 5. Ungroup before joining

```r title="Joining a grouped df can surprise you"
left  <- mtcars |> group_by(cyl) |> summarise(avg = mean(mpg))
right <- data.frame(cyl = c(4, 6, 8), label = c("eco","mid","big"))

left |> ungroup() |> left_join(right, by = "cyl")
```

Joining a grouped left side can carry grouping into the result, which is rarely what you want.

[KEY INSIGHT]
**The `.by` argument (dplyr >= 1.1.0) is the modern way to scope grouping per-verb without `group_by()`/`ungroup()` bookends.** For one-step grouped computation, `mutate(df, .by = g, x = ...)` is cleaner. Reserve `group_by()` for multi-step grouped pipelines where every verb shares the same grouping.

## ungroup() vs .by vs summarise(.groups=)

**Three ways to control grouping scope in dplyr.**

| Approach | Scope | Best for |
|---|---|---|
| `group_by()` + `ungroup()` | Pipeline-wide, explicit cleanup | Multi-step grouped flows |
| `.by` argument | Single verb only | One-step grouped compute |
| `summarise(.groups = "drop")` | Auto-drop after summarise | Aggregations ending in summarise |

When to use which:

- Use `.by` for short pipelines where grouping applies to one verb.
- Use `group_by()` + `ungroup()` for long flows where the same groups apply to mutate, filter, AND summarise.
- Use `.groups = "drop"` inside summarise for aggregation-only flows.

## Common pitfalls

**Pitfall 1: forgetting to ungroup before downstream code.** A grouped tibble looks identical when printed but `nrow()`, `mutate()`, and `n()` behave per-group. `head(grouped_df, 3)` returns 3 rows PER GROUP, not 3 total.

**Pitfall 2: `n()` returns per-group counts.** Inside `mutate()` on a grouped df, `n()` is the group size, not the total rows. Use `dplyr::n()` carefully or switch to `nrow()` after `ungroup()`.

[WARNING]
**Functions like `slice_head(n=3)` operate PER GROUP on a grouped data frame.** A grouped df with 4 groups returns 12 rows from `slice_head(n=3)`, not 3. Ungroup first if you want 3 total.

## Try it yourself

**Try it:** Compute the within-cylinder mean MPG, then return an UNGROUPED data frame sorted by relative MPG. Save to `ex_result`.

```r title="Your turn: group, mutate, ungroup, sort"
ex_result <- mtcars |>
  # your code here

head(ex_result, 5)
#> Expected: ungrouped tibble with rel_mpg column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_result <- mtcars |>
  group_by(cyl) |>
  mutate(rel_mpg = mpg / mean(mpg)) |>
  ungroup() |>
  arrange(desc(rel_mpg))

head(ex_result, 3)
#>    mpg cyl ... rel_mpg
#> ...
```

**Explanation:** Group by cyl, compute relative MPG within each group, ungroup so `arrange()` sorts the entire frame (not within groups).

</details>

## Related dplyr functions

After mastering ungroup, look at:

- `group_by()`: attach group structure
- `groups()`: inspect current grouping
- `group_split()`: split a grouped df into a list of data frames
- `rowwise()`: group with one row per group (for non-vectorized ops)
- `summarise(.groups = ...)`: control post-summarise grouping
- `.by` arg in mutate / filter / summarise: per-verb grouping

For modern dplyr code (>=1.1), prefer `.by` over `group_by()/ungroup()` when grouping applies to a single verb.

## FAQ

**What does ungroup do in dplyr?**

`ungroup()` removes the grouping structure attached by `group_by()`. After `ungroup()`, subsequent verbs (mutate, filter, summarise) operate on the entire data frame instead of per-group.

**Do I always need ungroup() after group_by()?**

Not always. `summarise()` peels off one grouping level automatically. `.by` scopes grouping to one verb only. But for pipelines mixing `group_by()` with `mutate()` and downstream code, ungroup is the safe default.

**What is the difference between ungroup() and .by in dplyr?**

`.by = column` is a per-call grouping argument introduced in dplyr 1.1. It applies grouping to ONE verb only, no leftover state. `ungroup()` removes grouping that was attached by `group_by()`. For new code, `.by` is often cleaner.

**How do I check if a data frame is grouped?**

Use `is_grouped_df(df)` or `groups(df)`. The former returns TRUE/FALSE; the latter shows the grouping columns.

**Why is my mutate producing weird results after group_by?**

Because mutate is computing PER GROUP. `n()`, `mean()`, `rank()`, etc., are group-scoped. To compute across the entire data frame, ungroup first.
