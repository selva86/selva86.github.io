---
title: "tidyr spread() in R: Long to Wide (Superseded by pivot_wider)"
slug: "tidyr-spread-in-R"
description: "Use tidyr spread() to reshape long to wide format in R (superseded by pivot_wider). Covers migration, key/value, vs pivot_wider, and 5 examples."
keywords: "tidyr spread, R spread vs pivot_wider, spread superseded, long to wide R, tidyr reshape, spread migration"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::spread()|tidyr spread|spread superseded|spread vs pivot_wider|long to wide"
auto_link_case_sensitive: true
target_keyword: "tidyr spread"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr spread() in R: Long to Wide (Superseded by pivot_wider)

<p class="lead">The <code>spread()</code> function in tidyr reshapes data from LONG to WIDE format. As of tidyr 1.0 (2019), it is SUPERSEDED by <code>pivot_wider()</code>; existing code works but new code should use pivot_wider.</p>

[QUICK ANSWER]
df |> spread(key = "var", value = "val")          # superseded
df |> pivot_wider(names_from = var, values_from = val)  # modern
df |> gather(key, value, ...)                      # long form (also superseded)
df |> pivot_longer(cols, names_to = ...)           # modern long form

[DECISION TREE: Should I use spread()?]
- new code: NO. Use pivot_wider() instead.
- legacy code: works, no changes required.
- migrating: replace spread(key = X, value = Y) with pivot_wider(names_from = X, values_from = Y).

## What spread() did in one sentence

**`spread(data, key, value)` took a data frame in long format (a key column and a value column) and reshaped it to wide format with one column per key value.** Since tidyr 1.0, it is superseded by the more flexible `pivot_wider()`.

## Migration

**Replace `spread(key = X, value = Y)` with `pivot_wider(names_from = X, values_from = Y)`.**

```r title="Old vs new"
library(tidyr)

# OLD (still works):
long <- tibble(id = c(1,1,2,2), var = c("a","b","a","b"), val = c(10,20,30,40))
long |> spread(key = "var", value = "val")

# NEW:
long |> pivot_wider(names_from = var, values_from = val)
#>      id     a     b
#>      1     10    20
#>      2     30    40
```

[TIP]
**`pivot_wider()` is more flexible than `spread()`: it supports multiple value columns, prefixes, and complex naming.** For new code, always use pivot_wider.

## Five common patterns (legacy)

### 1. Standard spread

```r title="Long to wide"
df |> spread(key = "var", value = "val")
```

Modern: `pivot_wider(names_from = var, values_from = val)`.

### 2. With fill for missing combinations

```r title="Fill NA cells"
df |> spread(key = "var", value = "val", fill = 0)
```

Modern: `pivot_wider(names_from = var, values_from = val, values_fill = 0)`.

### 3. Unique combinations enforced

```r title="convert = TRUE for type guess"
df |> spread(key = "var", value = "val", convert = TRUE)
```

Modern: pivot_wider auto-handles types.

### 4. Multi-step pipeline

```r title="Chain with other verbs"
sales |>
  group_by(region, product) |>
  summarise(total = sum(amount)) |>
  spread(key = "product", value = "total")
```

Modern: same with pivot_wider.

### 5. Verify both produce same result

```r title="Identical output"
old <- df |> spread(key = "var", value = "val")
new <- df |> pivot_wider(names_from = var, values_from = val)
identical(old, new)
#> [1] TRUE  (or near-identical depending on column order)
```

[KEY INSIGHT]
**Spread was superseded because it only handled the simplest reshape case.** pivot_wider can spread multiple value columns at once, customize naming with prefixes, and combine with names_glue for complex outputs. Spread can do none of these.

## spread() vs pivot_wider()

**Same output for simple cases; pivot_wider is more flexible.**

| Feature | spread() | pivot_wider() |
|---|---|---|
| Single value column | Yes | Yes |
| Multiple value columns | No | Yes |
| Custom naming | No | Yes (names_glue) |
| Prefix to new column names | No | Yes (names_prefix) |
| Status | Superseded | Recommended |

When to use which:

- pivot_wider for all new code.
- spread only in legacy code (no rewrites needed).

## A practical migration

**Search for `spread(` and replace with `pivot_wider`.**

```r
# Before:
df |> spread(category, amount)

# After:
df |> pivot_wider(names_from = category, values_from = amount)
```

The argument names are explicitly named in pivot_wider (clearer in code review). spread used positional args.

## Common pitfalls

**Pitfall 1: ignoring the soft-deprecation.** spread still works, but the tidyr team recommends migration. Future tidyr major versions may deprecate further.

**Pitfall 2: confusing direction.** spread is LONG -> WIDE. gather (also superseded) was WIDE -> LONG. Modern: pivot_wider and pivot_longer.

[WARNING]
**`spread` and `gather` were superseded in tidyr 1.0 (2019).** That's a long time. Most current tutorials and Stack Overflow answers show pivot_*. Migrating saves time on future reading.

## Try it yourself

**Try it:** Reshape a long-format data frame to wide using BOTH spread and pivot_wider, then verify identical output. Save check to `ex_check`.

```r title="Your turn: confirm spread == pivot_wider"
df_long <- tibble(id = c(1,1,2,2), var = c("x","y","x","y"), val = c(10,20,30,40))

old <- df_long |> spread(key = "var", value = "val")
new <- df_long |> pivot_wider(names_from = var, values_from = val)

ex_check <- # your code here

ex_check
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_check <- identical(old, new)

ex_check
#> [1] TRUE
```

**Explanation:** Both produce the same wide-format result for this simple case.

</details>

## Related tidyr functions

After understanding spread's deprecation, look at:

- `pivot_wider()`: modern replacement
- `pivot_longer()`: modern replacement for gather
- `tidyr::gather()`: also superseded
- `dplyr::summarise()` + `pivot_wider`: common pre-pivot aggregation
- `data.table::dcast()`: alternative for big data

## FAQ

**Is spread deprecated in tidyr?**

Superseded since tidyr 1.0 (2019). Use `pivot_wider()` instead.

**What is the modern replacement for spread?**

`pivot_wider(names_from = key_col, values_from = value_col)`.

**Why was spread superseded?**

It couldn't spread multiple value columns at once and lacked features like custom naming. pivot_wider is a strict superset.

**Will spread be removed?**

Possibly in a future major tidyr version. Migrate proactively.

**Are gather and spread both deprecated?**

Both are superseded (not deprecated). Gather is replaced by pivot_longer; spread by pivot_wider.
