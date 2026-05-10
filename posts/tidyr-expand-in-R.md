---
title: "tidyr expand() in R: Generate Combinations of Existing Columns"
slug: "tidyr-expand-in-R"
description: "Use tidyr expand() to generate all combinations of values from existing columns in R. Covers vs complete, nesting, expand_grid, and 5 worked examples."
keywords: "tidyr expand, R generate combinations, expand vs complete, expand vs expand_grid, tidyr nesting, expand columns"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::expand()|tidyr expand|generate combinations|expand vs complete|expand columns"
auto_link_case_sensitive: true
target_keyword: "tidyr expand"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr expand() in R: Generate Combinations of Existing Columns

<p class="lead">The <code>expand()</code> function in tidyr generates all unique COMBINATIONS of values from one or more columns of an existing data frame. It returns ONLY the combinations (no other columns).</p>

[QUICK ANSWER]
df |> expand(year, product)              # all year-product combos
df |> expand(nesting(year, quarter))     # preserve existing pairs
df |> expand(year = 2020:2024, product)  # custom values
df |> complete(year, product)             # different: merges back to original
expand_grid(year = 2020:2024, product = c("X","Y")) # from vectors

[DECISION TREE: Is expand() the right tool?]
- combinations from existing columns: expand()
- combinations from vectors: expand_grid()
- include original data: complete()
- preserve specific column pairs: expand(nesting(...))
- cross product of two tables: cross_join()

## What expand() does in one sentence

**`expand(data, ...)` returns a tibble of all UNIQUE combinations of values from the named columns of `data`, dropping all other columns.** It is "give me the combinations only" — no original rows.

## Syntax

**`expand(data, ...)`. `...` are columns or expressions like `year = 2020:2024`.**

```r title="All year-product combos"
library(tidyr)
library(dplyr)

sales <- tibble(
  year    = c(2024, 2024, 2025, 2026),
  product = c("X","Y","X","Z")
)

sales |>
  expand(year, product)
#>    year product
#>    2024       X
#>    2024       Y
#>    2024       Z
#>    2025       X
#>    ... (all 9 combos: 3 years * 3 products)
```

[TIP]
**`expand()` returns COMBINATIONS only.** Use `complete()` if you want the original data merged back with the missing combinations filled.

## Five common patterns

### 1. Cross-product of existing values

```r title="Every year x product"
sales |>
  expand(year, product)
```

### 2. Custom values

```r title="Override one column's values"
sales |>
  expand(year = 2020:2025, product)
#> 6 years x existing products
```

### 3. Nesting (preserve pairs)

```r title="Keep year-quarter pairs together"
sales |>
  expand(nesting(year, quarter), product)
#> Each (year, quarter) combo is preserved; cross with product
```

### 4. With group_by

```r title="Per-region combinations"
sales_by_region |>
  group_by(region) |>
  expand(year, product) |>
  ungroup()
```

### 5. Use as left side of full_join

```r title="Combine expand with original"
all_combos <- sales |> expand(year, product)
sales_complete <- all_combos |> left_join(sales, by = c("year","product"))
#> equivalent to complete(sales, year, product)
```

[KEY INSIGHT]
**`expand()` and `complete()` are sister functions: complete = expand + left_join back to original.** Use expand when you want JUST combinations; use complete when you want the original data with missing combinations filled in.

## expand() vs complete() vs expand_grid()

| Function | Inputs | Output |
|---|---|---|
| `expand(data, ...)` | Data + columns | Combinations only |
| `complete(data, ...)` | Data + columns | Original data + missing combos |
| `expand_grid(...)` | Vectors / lists | Combinations from scratch |
| `crossing(...)` | Same as expand_grid | (alias) |

When to use which:

- expand for combinations from existing data.
- complete for filling in missing rows.
- expand_grid for vector inputs.

## A practical workflow

**Use expand to generate "all expected combinations" reference tables.**

```r
expected_combos <- transactions |>
  expand(month, region, product)

# Now compare actual vs expected:
missing <- expected_combos |>
  anti_join(transactions, by = c("month","region","product"))
```

Check which (month, region, product) combinations have no transactions.

## Common pitfalls

**Pitfall 1: cross-product size.** `expand(year, product, region)` is years * products * regions. For high-cardinality data, this can be huge.

**Pitfall 2: expand drops original rows.** It returns only combinations. Use complete to keep the original data.

[WARNING]
**`expand()` returns UNIQUE combinations only.** Duplicate (year, product) rows in the input contribute one row to the output.

## Try it yourself

**Try it:** Generate all (cyl, gear) combinations present in mtcars. Save to `ex_combos`.

```r title="Your turn: cyl x gear combos"
ex_combos <- mtcars |>
  # your code here

nrow(ex_combos)
#> Expected: 8 (3 cyls * 3 gears, but with constraints from data)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_combos <- mtcars |>
  expand(cyl, gear)

ex_combos
#> 9 rows: every (cyl, gear) combination
```

**Explanation:** expand returns the cross product of the unique cyl and gear values in mtcars.

</details>

## Related tidyr functions

After mastering expand, look at:

- `complete()`: expand + merge with original
- `expand_grid()`: from vectors
- `crossing()`: alias for expand_grid
- `nesting()`: preserve column pairs
- `cross_join()`: full Cartesian product of tables

## FAQ

**What does expand do in tidyr?**

`expand(data, ...)` returns a tibble of all unique combinations of values from the named columns of `data`. Other columns are dropped.

**What is the difference between expand and complete?**

expand returns ONLY combinations (no original data). complete merges them back with the original. complete = expand + left_join.

**What is the difference between expand and expand_grid?**

expand operates on a data frame's existing values. expand_grid takes vectors / lists directly. Both produce combinations.

**What does nesting do inside expand?**

`nesting(col1, col2)` preserves the existing pairings of col1 and col2 (no cross-product between them). Useful for hierarchical data like (year, quarter).

**Can I expand with custom values?**

Yes. Pass `year = 2020:2025` etc. inside expand() to override the actual values used for that column.
