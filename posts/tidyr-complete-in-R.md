---
title: "tidyr complete() in R: Fill Missing Combinations of Columns"
slug: "tidyr-complete-in-R"
description: "Use tidyr complete() to insert missing combinations of columns into a data frame in R. Covers fill, nesting, expand, and 5 worked examples."
keywords: "tidyr complete, R complete combinations, complete fill missing, tidyr nesting, complete vs expand, fill missing rows R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::complete()|tidyr complete|complete combinations|fill missing rows|complete vs expand"
auto_link_case_sensitive: true
target_keyword: "tidyr complete"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr complete() in R: Fill Missing Combinations of Columns

<p class="lead">The <code>complete()</code> function in tidyr ensures every COMBINATION of specified column values is present in the data frame, inserting NA rows where missing. It is the "make implicit missing values explicit" operation.</p>

[QUICK ANSWER]
df |> complete(year, product)                # fill all year-product combos
df |> complete(year, product, fill = list(qty = 0))
df |> complete(nesting(year, quarter), product) # respect existing pairs
df |> tidyr::expand(year, product)            # similar but returns just combos
df |> group_by(g) |> complete(...)            # per-group complete

[DECISION TREE: Is complete() the right tool?]
- ensure all combinations are present: complete()
- generate combinations only (no merge): expand()
- generate from vectors: expand_grid()
- forward-fill missing values: fill()
- replace NA with constant after complete: complete(..., fill = list(...))

## What complete() does in one sentence

**`complete(data, ...)` adds rows for every combination of the named columns that doesn't already appear, with other columns set to NA (or to a fill default).** It makes implicit missing combinations explicit.

## Syntax

**`complete(data, ..., fill = list())`. `...` are columns whose combinations should be complete.**

```r title="Ensure all year-product combos exist"
library(tidyr)
library(dplyr)

sales <- tibble(
  year    = c(2024, 2024, 2025),
  product = c("X","Y","X"),
  qty     = c(100, 200, 150)
)

sales |>
  complete(year, product)
#>    year product   qty
#>    2024       X   100
#>    2024       Y   200
#>    2025       X   150
#>    2025       Y    NA   <-- inserted (was missing)
```

[TIP]
**Use `fill = list(qty = 0)` to fill the new rows with a default instead of NA.** Common for sales / metric data where missing means zero.

## Five common patterns

### 1. Standard complete

```r title="All year-product combos"
sales |>
  complete(year, product)
```

### 2. With fill default

```r title="Missing -> 0"
sales |>
  complete(year, product, fill = list(qty = 0))
```

### 3. Per-group complete

```r title="Complete within each region"
sales_by_region |>
  group_by(region) |>
  complete(year, product) |>
  ungroup()
```

### 4. Nesting (preserve existing combinations)

```r title="Don't generate combos that don't exist"
events |>
  complete(nesting(user, year), product)
#> Each user-year is preserved (not all year x user); add product combos within those.
```

`nesting()` keeps a subset of pairs together rather than generating their cross product.

### 5. Combine with fill

```r title="Complete then forward-fill"
sales |>
  complete(year, product) |>
  group_by(product) |>
  arrange(year) |>
  fill(qty)
```

Complete ensures rows; fill carries forward values for the new NA rows.

[KEY INSIGHT]
**`complete()` exposes IMPLICIT missing values.** If 2025 had no data for product Y, the row was simply absent; complete makes it appear with NA, so downstream summaries treat it correctly.

## complete() vs expand() vs expand_grid() vs full_join

**Four ways to fill combinations.**

| Function | Inputs | Output | Best for |
|---|---|---|---|
| `complete(data, ...)` | Data + columns | Original data + missing rows | Make missing explicit |
| `expand(data, ...)` | Data + columns | Just combinations (no original data) | Pure combinations |
| `expand_grid(...)` | Vectors | All-pair tibble | Combinations from scratch |
| `full_join(x, y)` | Two tables | Joined | Different problem |

When to use which:

- complete to add missing rows in-place.
- expand for combinations without original data.
- expand_grid when starting from vectors.

## A practical workflow

**Use complete for time-series with sparse observations to ensure regular intervals.**

```r
sales |>
  complete(
    date    = seq(min(date), max(date), by = "month"),
    product,
    fill = list(qty = 0)
  )
```

Ensure every (month, product) combination exists, with qty = 0 for missing.

For per-subject completion:

```r
patient_data |>
  group_by(patient_id) |>
  complete(visit = 1:10) |>
  ungroup()
```

## Common pitfalls

**Pitfall 1: cross-product explosion.** `complete(year, product, region)` generates n_year * n_product * n_region rows. For high-cardinality data, this can be huge.

**Pitfall 2: NA after complete.** New rows have NA in non-key columns. Use `fill = list(...)` to default, or chain with `fill()` for forward-fill.

[WARNING]
**`complete()` does NOT use group_by automatically; it generates the FULL cross-product across the named columns.** Use `nesting()` or group_by to restrict.

## Try it yourself

**Try it:** Ensure every (cyl, gear) combination exists in a small mtcars subset, with a count column. Save to `ex_complete`.

```r title="Your turn: complete cyl x gear combinations"
mt <- mtcars |>
  count(cyl, gear)

ex_complete <- mt |>
  # your code here

ex_complete
#> Expected: 9 rows (3 cyl * 3 gear), missing combos filled with NA or 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_complete <- mt |>
  complete(cyl, gear, fill = list(n = 0))

ex_complete
#> # 9 rows: every (cyl, gear) combo with n = count or 0
```

**Explanation:** complete inserts the missing combinations and fills n with 0.

</details>

## Related tidyr functions

After mastering complete, look at:

- `expand()`: just combinations, no merge
- `expand_grid()`: combinations from vectors
- `crossing()`: similar to expand_grid
- `nesting()`: preserve existing pairs
- `fill()`: forward-fill values
- `replace_na()`: scalar fill

## FAQ

**What does complete do in tidyr?**

`complete(data, ...)` adds rows for every missing combination of the named columns; other columns are set to NA (or to a fill default).

**How do I avoid cross-product explosion with complete?**

Use `nesting(col1, col2)` to keep specific column pairs together instead of generating their full cross product.

**Can I fill the missing values with something other than NA?**

Yes. Pass `fill = list(col = 0)` to set a default for the new rows.

**What is the difference between complete and expand?**

complete adds missing rows to the existing data frame. expand returns ONLY the combinations (without the original data). complete = expand + full_join.

**Should I group_by before complete?**

If you want combinations to apply within each group only, yes: `group_by(g) |> complete(...) |> ungroup()`. Otherwise complete operates across the full data frame.
