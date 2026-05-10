---
title: "tidyr crossing() in R: All Combinations (Alias for expand_grid)"
slug: "tidyr-crossing-in-R"
description: "Use tidyr crossing() to generate all combinations of values from vectors as a tibble in R. Alias for expand_grid. Covers vs expand.grid, 5 worked examples."
keywords: "tidyr crossing, R crossing vs expand_grid, crossing tibble, all combinations vectors, crossing tidyr, deduplicated grid"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::crossing()|tidyr crossing|crossing vs expand_grid|all combinations vectors|deduplicated grid"
auto_link_case_sensitive: true
target_keyword: "tidyr crossing"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr crossing() in R: All Combinations (Alias for expand_grid)

<p class="lead">The <code>crossing()</code> function in tidyr generates a tibble of all unique combinations of values from named vectors. It is an alias of <code>expand_grid()</code> with one extra step: it deduplicates the result.</p>

[QUICK ANSWER]
crossing(year = 2020:2024, product = c("X","Y"))
crossing(x = c(1,1,2), y = c(3,3,4))   # dedupes inputs first
expand_grid(...)                         # similar, no dedup of inputs
expand.grid(...)                         # base R alternative

[DECISION TREE: crossing or expand_grid?]
- inputs may have duplicates: crossing() (dedupes)
- inputs are unique: either works
- want raw cartesian product including dups: expand_grid()
- prefer base R: expand.grid()

## What crossing() does in one sentence

**`crossing(...)` returns a tibble of all unique combinations of values from named arguments, deduplicating inputs first.** It is `expand_grid()` followed by an implicit unique step.

## Syntax

**`crossing(...)`. `...` is named vectors / lists.**

```r title="Year and product combinations"
library(tidyr)

crossing(year = 2024:2025, product = c("X","Y","Z"))
#> 6 rows: every (year, product) combination
```

[TIP]
**`crossing()` and `expand_grid()` differ only in deduplication.** `expand_grid(x = c(1,1,2))` returns 3 rows; `crossing(x = c(1,1,2))` returns 2 rows (deduped). For unique inputs, they are identical.

## Five common patterns

### 1. Standard combinations

```r title="Two-vector grid"
crossing(year = 2020:2024, product = c("X","Y"))
```

### 2. Inputs with duplicates

```r title="crossing dedupes inputs"
crossing(x = c(1,1,2,2,3))
#> 3 rows: 1, 2, 3
```

### 3. Three-vector grid

```r title="3D combinations"
crossing(
  year     = 2020:2024,
  product  = c("X","Y"),
  region   = c("NA","EU")
)
#> 5 * 2 * 2 = 20 rows
```

### 4. List inputs

```r title="List of choices per parameter"
crossing(
  alpha = c(0.05, 0.10),
  beta  = c(0.20, 0.10)
) |>
  mutate(power = 1 - beta)
```

### 5. Use as join target

```r title="Generate grid then merge with data"
target <- crossing(year = 2020:2024, product = c("X","Y","Z"))
target |> left_join(actuals, by = c("year","product"))
```

[KEY INSIGHT]
**`crossing()` was the ORIGINAL tidyr function; `expand_grid()` was added later as a clearer name.** Both still exist as aliases (with a small difference: crossing dedupes input values).

## crossing() vs expand_grid() vs expand() vs expand.grid

| Function | Dedupes inputs | Output | Origin |
|---|---|---|---|
| `crossing(...)` | Yes | Tibble | tidyr (original) |
| `expand_grid(...)` | No | Tibble | tidyr (newer) |
| `expand(data, ...)` | Yes (unique values) | Tibble | tidyr |
| `expand.grid(...)` | No | Data frame | base R |

When to use which:

- crossing for tidy combinations with input dedup.
- expand_grid for raw cartesian product.
- expand for combinations from existing data.

## A practical workflow

**Use crossing for "every possible scenario" tables.**

```r
scenarios <- crossing(
  market    = c("US","EU","ASIA"),
  product   = c("A","B","C"),
  campaign  = c("organic","paid","email")
)

# 27 scenarios
```

For testing combinations, crossing is the cleanest tool.

## Common pitfalls

**Pitfall 1: row count growth.** crossing(a = 1:10, b = 1:10, c = 1:10) returns 1,000 rows. Three big vectors -> millions of rows. Always check size.

**Pitfall 2: dedupe surprise.** If you DEPEND on duplicates appearing, use expand_grid instead of crossing.

[WARNING]
**`crossing()` quietly dedupes inputs but `expand_grid()` does not.** This is the only behavioral difference. For most data with unique-by-default inputs, they're equivalent.

## Try it yourself

**Try it:** Generate all combinations of 3 ratings and 2 modes. Save to `ex_grid`.

```r title="Your turn: rating x mode"
ex_grid <- # your code here

nrow(ex_grid)
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- crossing(rating = c("low","mid","high"), mode = c("auto","manual"))

nrow(ex_grid)
#> [1] 6
```

**Explanation:** 3 ratings * 2 modes = 6 combinations.

</details>

## Related tidyr / base functions

After mastering crossing, look at:

- `expand_grid()`: same but no dedup
- `expand()`: from existing data
- `complete()`: expand + merge with data
- `nesting()`: preserve column pairs
- `base::expand.grid()`: base R alternative

## FAQ

**What does crossing do in tidyr?**

`crossing(...)` returns a tibble of all unique combinations of values from named vector arguments. Inputs are deduplicated first.

**What is the difference between crossing and expand_grid?**

crossing deduplicates inputs first. expand_grid does not. For unique inputs they're identical.

**Which is preferred for new code?**

Either works. The tidyr team uses both. expand_grid is more discoverable (the name describes the action); crossing is shorter.

**Does crossing return a data frame or tibble?**

A tibble. Use `as.data.frame()` if you need a base data frame.

**What is the order of rows in crossing?**

The LAST argument varies fastest. crossing(a=1:2, b=1:3) returns 6 rows, with b cycling fastest.
