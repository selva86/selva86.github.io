---
title: "dplyr cur_data() in R: Deprecated; Use pick(everything())"
slug: "dplyr-cur_data-in-R"
description: "Use dplyr cur_data() to access the current group's data inside summarise (deprecated; use pick everything in R). Covers migration to pick, 5 examples."
keywords: "dplyr cur_data, R cur_data deprecated, cur_data vs pick, dplyr pick everything, current group data, dplyr 1.1 migration"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cur_data()|dplyr cur_data|cur_data deprecated|cur_data vs pick|pick everything"
auto_link_case_sensitive: true
target_keyword: "dplyr cur_data"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr cur_data() in R: Deprecated; Use pick(everything())

<p class="lead">The <code>cur_data()</code> function in dplyr returned the current group's data as a tibble inside <code>summarise()</code> or <code>mutate()</code>. As of dplyr 1.1, it is DEPRECATED; use <code>pick(everything())</code> instead.</p>

[QUICK ANSWER]
df |> summarise(out = some_fn(cur_data()))         # OLD (deprecated)
df |> summarise(out = some_fn(pick(everything()))) # NEW
cur_data_all()                                       # also deprecated
cur_group_id()                                       # different: integer ID
cur_group()                                          # different: group values

[DECISION TREE: Should I use cur_data?]
- new code: NO. Use pick(everything()) instead.
- legacy code: works but emits a deprecation warning.
- migrating: replace `cur_data()` with `pick(everything())` everywhere.
- need just group ID: cur_group_id()
- need group values: cur_group()

## What cur_data() did in one sentence

**`cur_data()` returned the current group's data (excluding grouping columns) as a tibble, inside dplyr verbs on a grouped tibble.** Since dplyr 1.1, it is deprecated in favor of `pick(everything())` which is more explicit about what's being selected.

## Migration

**Replace `cur_data()` with `pick(everything())`.** The new form is functionally equivalent but reads more clearly.

```r title="Old vs new"
library(dplyr)

# OLD (deprecated):
mtcars |>
  group_by(cyl) |>
  summarise(out = nrow(cur_data()))

# NEW:
mtcars |>
  group_by(cyl) |>
  summarise(out = nrow(pick(everything())))
```

[TIP]
**`cur_data()` and `cur_data_all()` are BOTH deprecated.** The first excluded grouping columns; the second included them. Both replaced by `pick(...)` with explicit column selection.

## Five common patterns (legacy)

### 1. Pass current data to a function

```r title="Compute something on group data"
df |>
  group_by(g) |>
  summarise(out = some_fn(cur_data()))
```

Modern: `summarise(out = some_fn(pick(everything())))`.

### 2. Row count

```r title="cur_data() |> nrow()"
df |>
  group_by(g) |>
  summarise(n = nrow(cur_data()))
```

Modern: just use `n()` (or `nrow(pick(everything()))`).

### 3. Pass to model fit

```r title="Per-group model"
df |>
  group_by(g) |>
  summarise(model = list(lm(y ~ x, data = cur_data())))
```

Modern: `summarise(model = list(lm(y ~ x, data = pick(everything()))))`.

### 4. Filter inside summarise (rare)

```r title="cur_data was the only way pre-1.1"
df |>
  group_by(g) |>
  summarise(custom = nrow(cur_data() |> filter(value > 10)))
```

Modern: same with pick(everything()).

### 5. cur_data_all (with grouping cols)

```r title="cur_data_all included grouping columns"
df |>
  group_by(g) |>
  summarise(rows = nrow(cur_data_all()))
```

Modern: still pick(everything()) (dplyr 1.1 includes grouping by default in pick).

[KEY INSIGHT]
**The deprecation reflects dplyr's move to more EXPLICIT column selection.** `cur_data()` was opaque about which columns were included; `pick(everything())` makes it explicit. Code reviewers can see exactly which columns are passed.

## cur_data() vs pick() vs cur_group()

**Three approaches in the deprecation transition.**

| Function | Status | Best for |
|---|---|---|
| `cur_data()` | Deprecated | Migrate to pick |
| `cur_data_all()` | Deprecated | Migrate to pick |
| `pick(everything())` | Recommended | Modern equivalent |
| `pick(specific, cols)` | Recommended | Explicit column subset |
| `cur_group()` | Active | Just the group values |

When to use which:

- For new code: `pick(everything())` or `pick(specific, cols)`.
- Reading old code: cur_data and cur_data_all both mean "current group's data".
- Just need group ID: `cur_group_id()`.

## A practical migration

**Search legacy code for `cur_data` and replace.**

```r
# Before:
df |> group_by(g) |> summarise(x = some_fn(cur_data()))

# After:
df |> group_by(g) |> summarise(x = some_fn(pick(everything())))
```

For the rare cur_data_all case:

```r
# Before:
df |> group_by(g) |> summarise(x = some_fn(cur_data_all()))

# After (same):
df |> group_by(g) |> summarise(x = some_fn(pick(everything())))
```

dplyr 1.1's `pick(everything())` includes grouping columns by default, matching cur_data_all.

## Common pitfalls

**Pitfall 1: ignoring the deprecation warning.** Code still works but the warning means a future dplyr major version may remove cur_data entirely.

**Pitfall 2: confusing cur_data with cur_group_id.** They serve different purposes. cur_data was the FULL data; cur_group_id is just an integer.

[WARNING]
**`cur_data` and `cur_data_all` are deprecated as of dplyr 1.1 (Jan 2023).** Code using them emits warnings and may break in a future major version. Migrate now.

## Try it yourself

**Try it:** Convert a cur_data call to its pick equivalent. Save to `ex_pick`.

```r title="Your turn: migrate cur_data to pick"
# Old (avoid):
old_result <- mtcars |>
  group_by(cyl) |>
  summarise(rows = nrow(cur_data()))

# New (write this version):
ex_pick <- mtcars |>
  # your code here

ex_pick
#> Expected: same result, no deprecation warning
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pick <- mtcars |>
  group_by(cyl) |>
  summarise(rows = nrow(pick(everything())))

# Or even simpler:
ex_simple <- mtcars |>
  group_by(cyl) |>
  summarise(rows = n())
```

**Explanation:** pick(everything()) is the direct cur_data replacement. For row counts, `n()` is even simpler.

</details>

## Related dplyr functions

After understanding cur_data's deprecation, look at:

- `pick()`: modern column-selection inside verbs
- `cur_group_id()` / `cur_group()` / `cur_group_rows()`: group introspection (still active)
- `n()`: row count
- `across()`: per-column transformation
- `c_across()`: row-wise across

For most cur_data uses, `n()` (for counts) or `pick()` (for full data) covers the use case.

## Why cur_data was deprecated

**The dplyr team's reasoning: cur_data was implicit, pick is explicit.** With cur_data you couldn't tell from the call site which columns were being operated on; with pick(everything()) the intent is visible. Combined with the new tidyselect support in pick (`pick(starts_with("x_"))` etc.), the new function is strictly more flexible. The deprecation is part of dplyr's broader push toward making pipelines self-documenting.

## FAQ

**Is cur_data deprecated in dplyr?**

Yes, as of dplyr 1.1.0 (Jan 2023). Use `pick(everything())` instead.

**What is the modern replacement for cur_data?**

`pick(everything())`. It returns the same result but is more explicit about column selection.

**What is the difference between cur_data and cur_data_all?**

cur_data EXCLUDED grouping columns; cur_data_all INCLUDED them. Both deprecated. pick(everything()) includes grouping columns by default in dplyr 1.1+.

**Will cur_data be removed in a future dplyr version?**

Possibly. It is currently soft-deprecated (warning). Future major versions may remove it entirely. Migrate proactively.

**Can I use cur_data_id?**

There is no `cur_data_id`. You may be thinking of `cur_group_id`, which returns an integer. cur_data and cur_data_all both returned a tibble.
