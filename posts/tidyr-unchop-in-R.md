---
title: "tidyr unchop() in R: Expand Vector List Column Into Rows"
slug: "tidyr-unchop-in-R"
description: "Use tidyr unchop() to expand vector list-columns back into rows in R. Covers vs unnest_longer, keep_empty, and 5 worked examples."
keywords: "tidyr unchop, R unchop list column, unchop vs unnest_longer, expand chopped vectors, tidyr unchop"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::unchop()|tidyr unchop|unchop list column|unchop vs unnest_longer|expand vector list"
auto_link_case_sensitive: true
target_keyword: "tidyr unchop"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr unchop() in R: Expand Vector List Column Into Rows

<p class="lead">The <code>unchop()</code> function in tidyr expands vector list-columns into multiple rows; each element of each vector becomes a row. It is the opposite of <code>chop()</code>.</p>

[QUICK ANSWER]
df |> unchop(col)                       # vectors to rows
df |> unchop(c(col1, col2))              # multiple parallel cols
df |> unchop(col, keep_empty = TRUE)    # preserve empty cells
df |> unnest_longer(col)                  # similar; alternative

[DECISION TREE: Is unchop() the right tool?]
- vector list-col -> rows: unchop()
- tibble list-col -> rows: unnest()
- vector list-col -> rows with index: unnest_longer(indices_to)
- preserve empty cells: keep_empty = TRUE

## What unchop() does in one sentence

**`unchop(data, cols, keep_empty = FALSE)` expands a vector list-column into multiple rows; each element becomes its own row.** Other columns are duplicated.

## Syntax

**`unchop(data, cols, keep_empty = FALSE, ptype = NULL)`. cols are list columns to expand.**

```r title="Round-trip chop/unchop"
library(tidyr)
library(dplyr)

library(purrr)
df <- tibble(g = c("a","b"), v = list(c(1,2,3), c(4,5)))

df |> unchop(v)
#>   g v
#> 1 a 1
#> 2 a 2
#> 3 a 3
#> 4 b 4
#> 5 b 5
```

[TIP]
**`unchop` and `unnest_longer` are nearly identical for vector list-cols.** unchop is older; unnest_longer is the unified family.

## Five common patterns

### 1. Standard unchop

```r title="Vector list -> rows"
df |> unchop(v)
```

### 2. Multiple parallel list-cols

```r title="Two list-cols expanded together"
df <- tibble(g = "a", v = list(c(1,2)), w = list(c(10,20)))
df |> unchop(c(v, w))
#>   g v  w
#> 1 a 1 10
#> 2 a 2 20
```

### 3. Keep empty cells

```r title="Preserve as NA rows"
df <- tibble(g = c("a","b","c"), v = list(c(1,2), integer(0), c(3)))
df |> unchop(v, keep_empty = TRUE)
```

### 4. Round-trip

```r title="chop then unchop"
df_orig <- tibble(g = c("a","a","b"), v = c(1, 2, 3))
df_orig |> chop(v) |> unchop(v) |> identical(df_orig)
```

### 5. unnest_longer alternative

```r title="Both work for vector list cols"
df |> unchop(v)
df |> unnest_longer(v)
```

[KEY INSIGHT]
**`unchop` and `unnest_longer` are functionally similar for vector list-cols.** unchop predates the unnest_* family; both are still maintained. For new code, the tidyr team recommends unnest_longer for consistency.

## unchop() vs unnest_longer() vs unnest()

| Function | Input | Output | Status |
|---|---|---|---|
| `unchop(col)` | Vector list-col | Rows | Active, older |
| `unnest_longer(col)` | Vector list-col | Rows | Active, newer (preferred) |
| `unnest(col)` | Tibble list-col | Rows | Active |

For vector list-cols, prefer unnest_longer for consistency with the rest of the family.

## A practical workflow

**Use unchop for round-tripping with chop().**

```r
df |>
  chop(v) |>
  mutate(processed = purrr::map(v, scale)) |>
  unchop(processed)
```

Process each group's vectors; unchop back to long form.

## Common pitfalls

**Pitfall 1: empty cells dropped.** Default `keep_empty = FALSE`. Pass TRUE to preserve as NA rows.

**Pitfall 2: parallel list-cols must align.** `unchop(c(v, w))` requires v and w to have same length per cell.

[WARNING]
**`unchop()` is older than `unnest_longer()`; for new code, prefer unnest_longer.** Both work; consistency favors unnest_longer.

## Try it yourself

**Try it:** Unchop a vector list-col and count rows. Save to `ex_long`.

```r title="Your turn: unchop"
df <- tibble(g = c("a","b"), v = list(c(1,2,3), c(4,5)))

ex_long <- df |>
  # your code here

nrow(ex_long)
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_long <- df |> unchop(v)

nrow(ex_long)
#> [1] 5
```

**Explanation:** unchop expands the vectors; total = 3 + 2 = 5 rows.

</details>

## Related tidyr functions

After mastering unchop, look at:

- `chop()`: opposite (rows to vector list-col)
- `unnest_longer()`: equivalent for vector list-cols
- `unnest()`: for tibble list-cols
- `nest()` / `unnest()`: tibble versions

## FAQ

**What does unchop do in tidyr?**

`unchop(data, col)` expands a vector list-column into multiple rows. Each element becomes a row.

**What is the difference between unchop and unnest_longer?**

Functionally similar for vector list-cols. unchop is older; unnest_longer is part of the unified unnest family. Prefer unnest_longer for new code.

**How do I keep empty cells with unchop?**

Pass `keep_empty = TRUE`. Empty list cells become NA rows.

**Is unchop deprecated?**

No. It is still active. unnest_longer is preferred for consistency but both work.

**How do I unchop multiple list-cols at once?**

`unchop(c(col1, col2))`. Both must have the same vector length per cell.
