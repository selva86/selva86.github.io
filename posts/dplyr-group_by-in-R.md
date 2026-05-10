---
title: "dplyr group_by() in R: Grouped Operations Made Easy"
slug: "dplyr-group_by-in-R"
description: "Use dplyr group_by() to run grouped summaries, mutates, and filters in R. Covers ungroup, .groups argument, .by alternative, multi-key, and 6 examples."
keywords: "dplyr group_by, group by R, dplyr group_by summarise, dplyr group_by mutate, ungroup, .groups argument, .by alternative"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "group_by()|dplyr group_by|dplyr::group_by()|grouped operations|group operations"
auto_link_case_sensitive: true
target_keyword: "dplyr group_by"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr group_by() in R: Grouped Operations Made Easy

<p class="lead">The <code>group_by()</code> function in dplyr tags a data frame with one or more grouping variables. Subsequent verbs like <code>summarise()</code>, <code>mutate()</code>, and <code>filter()</code> then operate within each group instead of across the whole data frame.</p>

[QUICK ANSWER]
group_by(df, cyl)                          # tag with one grouping var
group_by(df, cyl, gear)                    # tag with multiple
group_by(df, cyl) |> summarise(m = mean(mpg))  # group + summarise
group_by(df, cyl) |> mutate(z = scale(mpg))    # group + mutate
group_by(df, cyl) |> filter(mpg == max(mpg))   # group + top per group
df |> ungroup()                            # remove all grouping
summarise(df, m = mean(mpg), .by = cyl)    # alternative without group_by

[DECISION TREE: Should I use group_by or .by?]
- one-off grouped summarise: summarise(df, m = mean(x), .by = g)
- one-off grouped mutate: mutate(df, z = scale(x), .by = g)
- one-off grouped filter: filter(df, x == max(x), .by = g)
- multiple chained verbs all need grouping: group_by(df, g) |> ...
- preserve grouping in result: group_by(df, g) |> summarise(...)
- legacy code base: group_by(df, g) |> ... |> ungroup()

## What group_by() does in one sentence

**`group_by()` tags a data frame so subsequent verbs operate within groups instead of globally.** It does not change the data; it adds a grouping attribute. Functions like `mean()` inside `summarise()` or `mutate()` then run once per group instead of once across all rows.

Unlike base R's `tapply()` or `aggregate()`, `group_by()` is composable: you can chain a `group_by()` into multiple operations, and the grouping persists until you `ungroup()` or summarise away.

## Syntax

**`group_by()` takes a data frame plus one or more grouping columns.** The result is a "grouped data frame" that prints with a `Groups:` line. Use `ungroup()` to remove grouping. As of dplyr 1.1+, the `.by` argument inside `summarise()`, `mutate()`, and `filter()` provides one-off grouping without the persistence.

```r title="Load dplyr and group mtcars by cyl"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  print(n = 3)
#> # A tibble: 32 x 11
#> # Groups:   cyl [3]
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6  160    110  3.9   2.62  16.5     0     1     4     4
#> 2  21       6  160    110  3.9   2.88  17.0     0     1     4     4
#> 3  22.8     4  108     93  3.85  2.32  18.6     1     1     4     1
```

The full signature is:

```
group_by(.data, ..., .add = FALSE, .drop = TRUE)
```

`.data` is the data frame. The `...` argument takes one or more grouping columns. `.add = TRUE` adds to existing groups instead of replacing. `.drop = TRUE` (default) drops empty groups for factor columns; set FALSE to keep all factor levels.

[TIP]
**Grouping is metadata, not a transform.** `group_by(df, cyl)` returns the same rows in the same order, just tagged with grouping info. The rows do not get reordered, sliced, or duplicated. The tag only matters when a downstream verb honors it.

## Six common patterns

### 1. Group + summarise

```r title="Mean and count per cylinder"
mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg), n = n())
#> # A tibble: 3 x 3
#>     cyl avg_mpg     n
#>   <dbl>   <dbl> <int>
#> 1     4    26.7    11
#> 2     6    19.7     7
#> 3     8    15.1    14
```

The most common use of `group_by()` is feeding into `summarise()` to compute per-group aggregates.

### 2. Group + mutate

```r title="Z-score mpg within each cylinder group"
mtcars |>
  group_by(cyl) |>
  mutate(mpg_z = (mpg - mean(mpg)) / sd(mpg)) |>
  select(cyl, mpg, mpg_z) |>
  head(3)
#> # A tibble: 3 x 3
#> # Groups:   cyl [2]
#>     cyl   mpg   mpg_z
#>   <dbl> <dbl>   <dbl>
#> 1     6  21    0.485
#> 2     6  21    0.485
#> 3     4  22.8 -1.13
```

`mutate()` inside a grouped data frame runs computations within each group. Each row gets a value relative to its own group's stats.

### 3. Group + filter for top per group

```r title="Best mpg car within each cylinder group"
mtcars |>
  group_by(cyl) |>
  filter(mpg == max(mpg)) |>
  select(cyl, mpg)
#> # A tibble: 3 x 2
#> # Groups:   cyl [3]
#>     cyl   mpg
#>   <dbl> <dbl>
#> 1     4  33.9
#> 2     6  21.4
#> 3     8  19.2
```

`filter()` inside a grouped data frame keeps rows that satisfy the condition WITHIN their group.

### 4. Group by multiple columns

```r title="Group by cyl AND gear"
mtcars |>
  group_by(cyl, gear) |>
  summarise(n = n(), avg_mpg = mean(mpg), .groups = "drop")
#> # A tibble: 8 x 4
#>     cyl  gear     n avg_mpg
#>   <dbl> <dbl> <int>   <dbl>
#> 1     4     3     1    21.5
#> 2     4     4     8    26.9
#> 3     4     5     2    28.2
#> 4     6     3     2    19.8
#> ...
```

Multi-column grouping creates one row per unique combination. Use `.groups = "drop"` to fully ungroup the result.

### 5. Removing groups with ungroup

```r title="Group, summarise, then explicitly ungroup"
mtcars |>
  group_by(cyl) |>
  summarise(avg = mean(mpg), .groups = "drop") |>
  mutate(rank = row_number())
#> # A tibble: 3 x 3
#>     cyl   avg  rank
#>   <dbl> <dbl> <int>
#> 1     4  26.7     1
#> 2     6  19.7     2
#> 3     8  15.1     3
```

After `summarise()`, dplyr 1.1+ peels off the last grouping level by default. For complex chains, use `.groups = "drop"` or call `ungroup()` to be explicit.

### 6. Using .by instead of group_by

```r title="Same per-cylinder mean via .by argument"
mtcars |>
  summarise(avg_mpg = mean(mpg), n = n(), .by = cyl)
#>   cyl  avg_mpg  n
#> 1   6 19.74286  7
#> 2   4 26.66364 11
#> 3   8 15.10000 14
```

`.by` (added in dplyr 1.1) groups for the single verb call only. Result is automatically ungrouped. Use this when grouping is a one-off and you do not want it to leak into subsequent operations.

[KEY INSIGHT]
**`group_by()` persists; `.by` does not.** That is the entire mental model. After `group_by(df, cyl) |> summarise(...)`, the result MAY still be grouped depending on the dplyr version. After `summarise(df, ..., .by = cyl)`, the result is always ungrouped. Pick `.by` for clarity in single-verb operations; use `group_by()` when several chained verbs need the same grouping.

## group_by() vs .by argument vs base R

**Base R has no general grouping primitive; you use `tapply()`, `aggregate()`, `split()`, or `by()` depending on the case.** dplyr's `group_by()` and `.by` provide one consistent grammar.

| Task | dplyr group_by | dplyr .by | Base R |
|---|---|---|---|
| Mean by group | `df \|> group_by(g) \|> summarise(m=mean(x))` | `summarise(df, m=mean(x), .by=g)` | `aggregate(x ~ g, df, mean)` |
| Within-group transform | `df \|> group_by(g) \|> mutate(z=scale(x))` | `mutate(df, z=scale(x), .by=g)` | `df$z <- ave(df$x, df$g, FUN=scale)` |
| Top per group | `df \|> group_by(g) \|> filter(x==max(x))` | `filter(df, x==max(x), .by=g)` | `do.call(rbind, lapply(split(df,df$g), function(d) d[d$x==max(d$x),]))` |
| Multi-key group | `group_by(df, g1, g2)` | `.by = c(g1, g2)` | (multiple awkward options) |

When to use which:

- Use `.by` for single-verb grouped operations (cleanest).
- Use `group_by()` when several chained verbs need the same grouping.
- Use base R primitives only when you cannot use the tidyverse.

## Common pitfalls

**Pitfall 1: forgetting to ungroup.** A grouped data frame "remembers" its grouping. If you `group_by()` once and then run multiple unrelated operations, all of them inherit the grouping. Symptom: weird results in `mutate()` or `slice()` later. Fix: `ungroup()` explicitly, use `.by` instead, or rely on summarise's auto-peeling.

**Pitfall 2: `.groups` warning noise.** `group_by(df, a, b) |> summarise(...)` may print "summarise() has grouped output by 'a'". This is dplyr telling you it dropped one level of grouping but kept others. To silence, set `.groups = "drop"` (fully ungroup), `"keep"`, `"drop_last"`, or `"rowwise"` explicitly.

[WARNING]
**Grouping changes the meaning of `n()`, `cur_data()`, and many other helpers.** Inside a grouped frame, `n()` returns the per-group count. Inside an ungrouped frame, `n()` returns the total. Same code, different result. When debugging grouped operations, always verify whether you are inside a group context.

**Pitfall 3: factor `.drop = TRUE` silently drops empty groups.** If your grouping variable is a factor and some levels have zero rows, those levels disappear by default. To keep all factor levels in the result (even with zero observations), set `.drop = FALSE` in `group_by()`.

## Related dplyr functions

After mastering `group_by()`, look at:

- `ungroup()`: remove grouping
- `.by` argument: alternative one-off grouping in `summarise()`, `mutate()`, `filter()`
- `summarise()`, `mutate()`, `filter()`, `slice()`: the verbs that honor grouping
- `n()`, `cur_group()`, `cur_group_id()`, `cur_group_rows()`: helpers that use grouping context
- `group_split()`, `group_keys()`, `group_data()`: introspect a grouped data frame
- `nest()` plus `unnest()`: alternative grouping via list-columns

For very large data, also check `data.table` syntax which provides the same semantics with often faster execution per group.

## FAQ

**What is the difference between group_by and .by in dplyr?**

`group_by()` tags the data frame with persistent grouping that affects every downstream verb until `ungroup()`. `.by` is a per-call argument that groups for the single operation and auto-ungroups the result. Use `.by` for one-off operations; `group_by()` when chained verbs all need the grouping.

**How do I group by multiple columns in dplyr?**

Pass them comma-separated: `group_by(df, cyl, gear)`. The result has one group per unique combination. With `.by`, use a vector: `summarise(df, ..., .by = c(cyl, gear))`.

**How do I ungroup a data frame in dplyr?**

Pipe to `ungroup()`: `df |> group_by(g) |> summarise(...) |> ungroup()`. Or set `.groups = "drop"` inside the summarise call: `summarise(df, ..., .groups = "drop")`.

**Does group_by sort the data?**

No. `group_by()` only adds a grouping attribute; it does not reorder rows. The internal grouping index lets dplyr operate on each group efficiently, but the visible row order stays the same. To reorder by group, chain `arrange()` after `group_by()` with `.by_group = TRUE`.

**Can I use group_by inside a function?**

Yes, but use the `{{ }}` (curly-curly) operator to forward column names: `my_fn <- function(df, grp) df |> group_by({{ grp }}) |> summarise(n = n())`. Without `{{ }}`, R interprets `grp` as a literal column name "grp" rather than the value the user passed.
