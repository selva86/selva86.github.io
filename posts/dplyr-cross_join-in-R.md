---
title: "dplyr cross_join() in R: Cartesian Product of Two Tables"
slug: "dplyr-cross_join-in-R"
description: "Use dplyr cross_join() to compute the Cartesian product of two data frames in R. Covers vs expand_grid, full join with no key, name conflicts, 5 examples."
keywords: "dplyr cross_join, R cartesian product, cross_join vs expand_grid, dplyr full cross, R combination tables, cross join no key"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cross_join()|dplyr cross_join|cartesian product|combination of tables|cross_join vs expand_grid"
auto_link_case_sensitive: true
target_keyword: "dplyr cross_join"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr cross_join() in R: Cartesian Product of Two Tables

<p class="lead">The <code>cross_join()</code> function in dplyr returns the Cartesian product of two data frames, pairing every row of x with every row of y. Result rows = nrow(x) * nrow(y).</p>

[QUICK ANSWER]
cross_join(x, y)                        # all combinations
cross_join(x, y, suffix = c(".x",".y")) # disambiguate column names
tidyr::expand_grid(...)                  # similar; lighter input
dplyr::full_join(x, y, by = character()) # equivalent in older dplyr
nrow(cross_join(x, y))                   # = nrow(x) * nrow(y)

[DECISION TREE: Is cross_join() the right tool?]
- every combination of x rows and y rows: cross_join()
- generate combinations from vectors: tidyr::expand_grid()
- match by key: left_join(), inner_join(), full_join()
- compute pairwise distances / comparisons: cross_join() + filter
- avoid: cross_join on big tables (explosion of rows)

## What cross_join() does in one sentence

**`cross_join(x, y)` returns a data frame containing every combination of rows from x and y; the result has `nrow(x) * nrow(y)` rows.** No key is used; no rows are dropped.

This is the SQL CROSS JOIN. Useful for generating all-pair combinations, full grids, or pairwise comparison sets.

## Syntax

**`cross_join(x, y, suffix = c(".x", ".y"))`. No `by` argument; every row pairs with every row.**

```r title="Every combination of products and regions"
library(dplyr)

products <- data.frame(product = c("X","Y","Z"))
regions  <- data.frame(region  = c("NA","EU"))

cross_join(products, regions)
#>   product region
#> 1       X     NA
#> 2       X     EU
#> 3       Y     NA
#> 4       Y     EU
#> 5       Z     NA
#> 6       Z     EU
```

[TIP]
**Use `cross_join` to generate all combinations for grid expansion or pairwise comparison.** For simple vector combinations, `tidyr::expand_grid()` is more direct.

## Five common patterns

### 1. Generate all combinations

```r title="Product x Region grid"
products <- data.frame(product = c("X","Y","Z"))
regions  <- data.frame(region  = c("NA","EU"))

cross_join(products, regions)
```

3 * 2 = 6 rows.

### 2. Pairwise distance setup

```r title="All pairs of cities for distance"
cities <- data.frame(name = c("NYC","LA","SF","Chicago"))

pairs <- cross_join(cities, cities, suffix = c("_a","_b")) |>
  filter(name_a < name_b)
nrow(pairs)
#> [1] 6  (4 choose 2)
```

cross_join then filter for non-redundant pairs is the standard pattern for "all unique pairs".

### 3. Combine with computation

```r title="Compute revenue for every product/region grid cell"
budget <- data.frame(product = c("X","Y","Z"), price = c(10, 20, 15))
demand <- data.frame(region  = c("NA","EU"), qty = c(100, 80))

cross_join(budget, demand) |>
  mutate(revenue = price * qty)
```

### 4. Suffix to disambiguate

```r title="Same column name in both tables"
df_a <- data.frame(x = 1:2, label = c("a","b"))
df_b <- data.frame(x = 3:4, label = c("c","d"))

cross_join(df_a, df_b, suffix = c("_l","_r"))
#>   x_l label_l x_r label_r
#> 1   1       a   3       c
#> 2   1       a   4       d
#> 3   2       b   3       c
#> 4   2       b   4       d
```

### 5. Older dplyr equivalent

```r title="Pre-cross_join era"
full_join(products, regions, by = character())
# Empty character() means "no join keys" -> cross product
```

`cross_join` (added in dplyr 1.1) is the modern, explicit form.

[KEY INSIGHT]
**cross_join scales as O(nrow(x) * nrow(y)).** Two 1,000-row tables become a 1,000,000-row result. Always check sizes before running on real data. For very large grids, consider `tidyr::expand_grid()` (memory-efficient for vector inputs) or generating combinations on the fly.

## cross_join() vs expand_grid() vs full_join() vs combn()

**Four ways to generate combinations in R.**

| Function | Input | Output | Best for |
|---|---|---|---|
| `cross_join(x, y)` | Two data frames | All-pair df | Two existing tables |
| `tidyr::expand_grid()` | Vectors / lists | All-pair df | Variadic vector input |
| `full_join(by = character())` | Two data frames | All-pair df | Pre-1.1 dplyr |
| `base::combn(x, m)` | Vector | Combinations | Choose m of n |

When to use which:

- `cross_join` for two existing data frames.
- `expand_grid` when starting from vectors.
- `combn` for "choose m" combinations.

## A practical workflow

**Use cross_join for "what-if" grid analysis.**

```r title="Three-way scenario grid"
products  <- data.frame(product = c("A","B","C"), unit_cost = c(5, 7, 9))
volumes   <- data.frame(volume  = c(100, 500, 1000, 5000))
discounts <- data.frame(discount = c(0, 0.1, 0.2))

scenarios <- products |>
  cross_join(volumes) |>
  cross_join(discounts) |>
  mutate(total_cost = unit_cost * volume * (1 - discount))
```

3 products * 4 volumes * 3 discounts = 36 scenarios. Compute total_cost for each. Useful for sensitivity analysis.

## Common pitfalls

**Pitfall 1: row explosion.** `cross_join` of two 10k tables = 100M rows. Always check sizes first.

**Pitfall 2: column name conflicts.** Both tables having a column named `id` produces `id.x` and `id.y` in the result; rename or pass `suffix` to customize.

[WARNING]
**`cross_join` has NO `by` argument by design.** It is for "no key, all combinations" semantics. If you need a key-based join, use `left_join` / `inner_join` instead.

## When to use cross_join vs filter pattern

**The cross_join + filter pattern handles "all valid pairs" computations elegantly but at high memory cost.** For pairwise distance, comparison, or compatibility checks, the natural expression is `cross_join` followed by `filter(valid)`. The cost: the intermediate cartesian table is huge. For n = 1,000 cities, cross_join produces 1M rows before filter reduces it. This is fine for n in the hundreds; problematic for n in the tens of thousands. Alternatives include nested loops with early termination, or the `proxy` and `vegan` packages for specialized distance computation. As a rule: if the result of cross_join would exceed a few million rows, design a smarter algorithm.

## Try it yourself

**Try it:** Generate all combinations of 3 cylinder counts and 2 transmission types. Save to `ex_grid`.

```r title="Your turn: cyl x am combinations"
cyls <- data.frame(cyl = c(4, 6, 8))
ams  <- data.frame(am  = c(0, 1))

ex_grid <- # your code here

ex_grid
#> Expected: 6 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- cross_join(cyls, ams)

ex_grid
#>   cyl am
#> 1   4  0
#> 2   4  1
#> 3   6  0
#> 4   6  1
#> 5   8  0
#> 6   8  1
```

**Explanation:** Every cyl pairs with every am: 3 * 2 = 6 rows.

</details>

## Related dplyr / tidyr functions

After mastering cross_join, look at:

- `tidyr::expand_grid()`: vector-input alternative
- `tidyr::expand()`: complete grid from existing data
- `tidyr::complete()`: fill missing combinations
- `full_join()`: match by key, all unmatched
- `combn()` / `expand.grid()`: base R alternatives
- `crossing()`: tidyr; same as expand_grid

For "fill missing combinations in existing data", `tidyr::complete()` is the right tool.

## FAQ

**What does cross_join do in dplyr?**

`cross_join(x, y)` returns the Cartesian product: every row of x paired with every row of y. The result has nrow(x) * nrow(y) rows.

**What is the difference between cross_join and expand_grid?**

cross_join takes two data frames. expand_grid takes vectors or lists (more flexible) and returns a tibble of all combinations.

**How do I do a cross join in older dplyr?**

`full_join(x, y, by = character())` worked before cross_join was added. cross_join was introduced in dplyr 1.1.

**Why is my cross_join so slow / large?**

Because the result grows as nrow(x) * nrow(y). Two 1,000-row tables produce 1,000,000 rows. Always check sizes before running.

**Can cross_join take more than 2 tables?**

Not directly, but you can chain: `df1 |> cross_join(df2) |> cross_join(df3)`. Be careful with row count explosion.
