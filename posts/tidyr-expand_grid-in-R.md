---
title: "tidyr expand_grid() in R: All Combinations From Vectors"
slug: "tidyr-expand_grid-in-R"
description: "Use tidyr expand_grid() to generate all combinations of values from vectors as a tibble in R. Covers vs base expand.grid, vs crossing, and 5 examples."
keywords: "tidyr expand_grid, R expand_grid vs expand.grid, vectors to combinations, expand_grid tibble, expand_grid vs crossing"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::expand_grid()|tidyr expand_grid|expand_grid tibble|combinations from vectors|expand_grid vs crossing"
auto_link_case_sensitive: true
target_keyword: "tidyr expand_grid"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr expand_grid() in R: All Combinations From Vectors

<p class="lead">The <code>expand_grid()</code> function in tidyr generates a tibble of all combinations of values from one or more vectors or lists. It is the tibble-friendly version of base R's <code>expand.grid()</code>.</p>

[QUICK ANSWER]
expand_grid(year = 2020:2024, product = c("X","Y","Z"))
expand_grid(x = 1:3, y = 1:2)
crossing(year = 2020:2024, product = c("X","Y"))    # alias
base::expand.grid(...)                                # base R alternative
df |> expand(year, product)                           # different: from data

[DECISION TREE: Is expand_grid() the right tool?]
- combinations from vectors: expand_grid(year = 2020:2024, ...)
- combinations from existing data columns: tidyr::expand()
- combine while merging back: tidyr::complete()
- base R alternative: expand.grid (returns data frame, not tibble)
- two data frames: dplyr::cross_join()

## What expand_grid() does in one sentence

**`expand_grid(...)` returns a tibble where each row is a unique combination of values from the named arguments.** Output rows = product of input lengths.

## Syntax

**`expand_grid(...)`. `...` is one or more named vectors / lists.**

```r title="Year and product combinations"
library(tidyr)

expand_grid(year = 2024:2025, product = c("X","Y","Z"))
#> # A tibble: 6 x 2
#>    year product
#>    2024 X
#>    2024 Y
#>    2024 Z
#>    2025 X
#>    2025 Y
#>    2025 Z
```

[TIP]
**`expand_grid()` returns a TIBBLE; `expand.grid()` returns a data frame and reorders columns alphabetically.** Use the tidyr version for cleaner integration with the tidyverse.

## Five common patterns

### 1. Two-vector grid

```r title="Year x product"
expand_grid(year = 2020:2024, product = c("X","Y"))
```

### 2. Three-vector grid

```r title="Year, product, region"
expand_grid(year = 2020:2024, product = c("X","Y"), region = c("NA","EU"))
#> 5 * 2 * 2 = 20 rows
```

### 3. Custom values per column

```r title="Mix integer and character"
expand_grid(
  level = c("low","mid","high"),
  size  = c(10, 100, 1000)
)
```

### 4. Use for what-if analysis

```r title="All scenarios"
scenarios <- expand_grid(
  rate     = c(0.05, 0.10, 0.15),
  duration = c(12, 24, 36)
) |>
  mutate(total_interest = rate * duration / 12)
```

### 5. Larger grids (caution: row count grows fast)

```r title="3 vectors of size 10"
expand_grid(a = 1:10, b = 1:10, c = 1:10)
#> 1000 rows
```

[KEY INSIGHT]
**`expand_grid()` and `crossing()` are exact aliases.** crossing was the original name; expand_grid was added later for clarity. Both work; pick one and stay consistent.

## expand_grid() vs crossing() vs expand() vs base expand.grid

| Function | Inputs | Output | Origin |
|---|---|---|---|
| `expand_grid(...)` | Named vectors | Tibble | tidyr |
| `crossing(...)` | Same | Tibble | tidyr (alias) |
| `expand(data, ...)` | Data frame + columns | Tibble | tidyr |
| `expand.grid(...)` | Named vectors | Data frame | base R |

When to use which:

- expand_grid / crossing for vector inputs in tidyverse code.
- expand for combining existing column values.
- expand.grid only when avoiding tidyverse.

## A practical workflow

**Use expand_grid for parameter sweeps and what-if analysis.**

```r
results <- expand_grid(
  alpha = c(0.05, 0.10, 0.20),
  power = c(0.80, 0.90),
  effect = c(0.2, 0.5, 0.8)
) |>
  rowwise() |>
  mutate(n = pwr::pwr.t.test(d = effect, sig.level = alpha, power = power)$n) |>
  ungroup()
```

Compute sample size for every combination of alpha, power, and effect.

## Common pitfalls

**Pitfall 1: row count explosion.** Three vectors of length 100 = 1,000,000 rows. Always check sizes first.

**Pitfall 2: confusing with cross_join.** expand_grid takes VECTORS; cross_join takes DATA FRAMES. They serve different inputs.

[WARNING]
**`expand_grid` returns rows in a SPECIFIC ORDER: the LAST argument varies fastest.** `expand_grid(a = 1:2, b = 1:3)` returns (1,1), (1,2), (1,3), (2,1), (2,2), (2,3). The last column changes most rapidly.

## Try it yourself

**Try it:** Generate all combinations of 3 levels and 4 sizes. Save to `ex_grid`.

```r title="Your turn: parameter grid"
levels <- c("low","mid","high")
sizes  <- c(10, 100, 1000, 10000)

ex_grid <- # your code here

nrow(ex_grid)
#> Expected: 12
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- expand_grid(level = levels, size = sizes)

nrow(ex_grid)
#> [1] 12
```

**Explanation:** 3 levels * 4 sizes = 12 combinations.

</details>

## Related tidyr / base functions

After mastering expand_grid, look at:

- `crossing()`: alias for expand_grid
- `expand()`: from existing data
- `complete()`: expand + merge with data
- `nesting()`: preserve column pairs
- `dplyr::cross_join()`: cartesian product of tables
- `base::expand.grid()`: base R alternative

## FAQ

**What does expand_grid do in tidyr?**

`expand_grid(...)` returns a tibble of all combinations of values from named vector arguments. Each row is a unique combination.

**What is the difference between expand_grid and expand.grid?**

expand_grid (tidyr) returns a tibble and preserves argument order. expand.grid (base R) returns a data frame and reorders columns alphabetically.

**What is the difference between expand_grid and crossing?**

They are exact aliases. expand_grid is the newer name; crossing is the original. Both produce identical output.

**What is the order of rows in expand_grid?**

The LAST argument varies fastest. expand_grid(a=1:2, b=1:3) returns (1,1), (1,2), (1,3), (2,1), (2,2), (2,3).

**Can expand_grid handle list inputs?**

Yes. `expand_grid(x = 1:3, y = list(c(1,2), c(3,4)))` works for list inputs (each element is a row in the output).
