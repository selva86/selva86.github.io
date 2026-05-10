---
title: "dplyr c_across() in R: Combine Columns Within rowwise()"
slug: "dplyr-c_across-in-R"
description: "Use dplyr c_across() inside rowwise() to compute across columns row-wise in R. Covers c_across vs across, tidyselect helpers, pmap alternative, 5 examples."
keywords: "dplyr c_across, R rowwise sum, c_across vs across, dplyr row sum, c_across tidyselect, R per row computation, c_across mean"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "c_across()|dplyr c_across|rowwise sum|row-wise computation|c_across vs across"
auto_link_case_sensitive: true
target_keyword: "dplyr c_across"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr c_across() in R: Combine Columns Within rowwise()

<p class="lead">The <code>c_across()</code> function in dplyr concatenates values from multiple columns into a single vector, ROW BY ROW, when used inside <code>rowwise()</code>. It is the row-wise counterpart of <code>across()</code>.</p>

[QUICK ANSWER]
df |> rowwise() |> mutate(total = sum(c_across(x:z)))
df |> rowwise() |> mutate(avg = mean(c_across(starts_with("score"))))
df |> rowwise() |> mutate(n_na = sum(is.na(c_across(everything()))))
df |> rowwise() |> mutate(min_v = min(c_across(where(is.numeric))))
df |> mutate(total = rowSums(across(x:z)))    # often faster
df |> mutate(total = pmap_dbl(across(x:z), sum)) # purrr alternative

[DECISION TREE: Is c_across() the right tool?]
- row-wise sum / mean over many columns: rowwise + c_across, OR rowSums/rowMeans
- per-column transformation: across() (no rowwise needed)
- rowSums / rowMeans available: prefer those (faster)
- variable-length per row: rowwise + c_across
- non-numeric reduction (paste, list): rowwise + c_across is the right tool
- count NAs per row: rowwise + sum(is.na(c_across(everything())))

## What c_across() does in one sentence

**`c_across(cols)` collects the values from `cols` of the CURRENT row into a single vector, so you can call `sum`, `mean`, `paste`, etc. on it.** It only makes sense inside `rowwise()`; outside it, behavior is undefined.

`c_across()` is the row-wise sister of `across()`. Where `across()` applies a function to many COLUMNS, `c_across()` collects values from many columns into ONE row-wise vector.

## Syntax

**`c_across(cols)`. `cols` uses tidyselect helpers: `everything()`, `starts_with()`, `where(is.numeric)`, `x:z`.**

```r title="Sum across three columns row-wise"
library(dplyr)

df <- data.frame(x = 1:3, y = 4:6, z = 7:9)

df |>
  rowwise() |>
  mutate(total = sum(c_across(x:z))) |>
  ungroup()
#>   x y z total
#> 1 1 4 7    12
#> 2 2 5 8    15
#> 3 3 6 9    18
```

[TIP]
**For row-wise sum or mean, `rowSums()` and `rowMeans()` are faster than `rowwise() + c_across()`.** Reserve c_across for non-vectorized operations like `paste`, `min`, `max` over arbitrary column subsets.

## Five common patterns

### 1. Row-wise sum

```r title="Total across columns x to z"
df |>
  rowwise() |>
  mutate(total = sum(c_across(x:z))) |>
  ungroup()
```

For pure sums, `mutate(total = rowSums(across(x:z)))` is faster.

### 2. Row-wise mean of selected columns

```r title="Mean of all numeric columns"
df |>
  rowwise() |>
  mutate(avg = mean(c_across(where(is.numeric)))) |>
  ungroup()
```

`where(is.numeric)` selects numeric columns dynamically.

### 3. Count NAs per row

```r title="Number of missing values per row"
df_na <- data.frame(a = c(1, NA, 3), b = c(NA, 2, NA), c = c(1, 2, NA))

df_na |>
  rowwise() |>
  mutate(n_na = sum(is.na(c_across(everything())))) |>
  ungroup()
#>   a  b  c n_na
#> 1 1 NA  1    1
#> 2 NA 2  2    1
#> 3 3 NA NA    2
```

A common data-quality check.

### 4. Per-row min or max

```r title="Find the smallest value per row"
df |>
  rowwise() |>
  mutate(min_v = min(c_across(x:z))) |>
  ungroup()
```

base R has `pmin(x, y, z)` for parallel min; c_across is more general.

### 5. Combine string columns row-wise

```r title="Concatenate text columns per row"
text_df <- data.frame(
  first = c("Alice", "Bob"),
  last  = c("Smith", "Jones")
)

text_df |>
  rowwise() |>
  mutate(full = paste(c_across(everything()), collapse = " ")) |>
  ungroup()
#>   first  last        full
#> 1 Alice Smith Alice Smith
#> 2   Bob Jones   Bob Jones
```

For text-joining, `tidyr::unite()` is often cleaner.

[KEY INSIGHT]
**`c_across()` requires `rowwise()` to make sense.** Without rowwise, c_across either errors or returns the entire column. They are a paired idiom. If you forget rowwise, you get all values across the whole table, not per-row.

## c_across() vs across() vs rowSums()

**Three approaches to "operate over columns" in dplyr.**

| Function | Style | Speed | Best for |
|---|---|---|---|
| `c_across(cols)` | Row-wise (one vector per row) | Slower | Non-vectorized reductions |
| `across(cols, fn)` | Column-wise (apply fn to each col) | Fast | Per-column transformations |
| `rowSums()` / `rowMeans()` | Built-in row-wise | Fastest | Sum / mean across columns |

When to use which:

- `rowSums(across(x:z))` for fast row-wise sum.
- `c_across` inside rowwise for arbitrary row-wise reductions.
- `across()` for "apply fn to each column" (no rowwise needed).

## A practical workflow

**Most c_across uses fall into three categories: row sums of subsets, NA counts per row, and string-paste per row.** For each, there is a faster specialized tool, but c_across handles the irregular cases:

- Variable subset of columns chosen via tidyselect each call.
- Reductions that aren't `sum`/`mean` (e.g., `paste`, `var`, `median`).
- Custom logic per row (e.g., "is at least one column > threshold?").

If you find yourself writing `rowwise() + c_across()` for sum/mean, switch to `rowSums()/rowMeans()` with `across()` for 10-100x speedup on large data.

## Common pitfalls

**Pitfall 1: forgetting rowwise.** `df |> mutate(total = sum(c_across(x:z)))` returns the SUM OF THE ENTIRE x-to-z block, not per row. Add `rowwise()`.

**Pitfall 2: forgetting to ungroup.** `rowwise()` is a special grouping. Downstream operations stay rowwise unless you `ungroup()`. Subtle bugs result from this.

[WARNING]
**`rowwise() + c_across()` is SLOW on large data frames.** Each row does a separate function call. For sum/mean over many rows, use `rowSums()` or `rowMeans()` (vectorized C code). Reserve c_across for situations where vectorized alternatives don't exist.

## Try it yourself

**Try it:** For each row of a data frame with columns a, b, c, d, compute the maximum value across the four columns. Save to `ex_maxes`.

```r title="Your turn: row-wise max"
df <- data.frame(a = c(3,5,1), b = c(2,4,6), c = c(7,1,2), d = c(4,3,8))

ex_maxes <- df |>
  # your code here

ex_maxes
#> Expected: c(7, 5, 8) per row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_maxes <- df |>
  rowwise() |>
  mutate(row_max = max(c_across(a:d))) |>
  ungroup() |>
  pull(row_max)

ex_maxes
#> [1] 7 5 8

# Alternative without rowwise (faster):
ex_maxes2 <- pmax(df$a, df$b, df$c, df$d)
```

**Explanation:** `c_across(a:d)` collects each row's a, b, c, d values; `max()` reduces to a scalar. For pure pmax, base R is faster.

</details>

## Related dplyr functions

After mastering c_across, look at:

- `across()`: per-column counterpart
- `rowwise()`: required pairing with c_across
- `rowSums()` / `rowMeans()`: fast specialized
- `pmap()` / `pmap_dbl()`: purrr alternative for row-wise mapping
- `pmin()` / `pmax()`: parallel min/max in base R
- `tidyr::unite()`: text concatenation across columns

For most numeric row reductions, the rowSums/rowMeans family beats c_across on speed and clarity.

## FAQ

**What is the difference between c_across and across in dplyr?**

`across()` applies a function to each COLUMN; `c_across()` collects values from many columns into ONE row-wise vector. across is column-wise; c_across is row-wise (and requires rowwise).

**Why do I need rowwise() with c_across?**

`c_across()` only makes sense per row. Without `rowwise()`, it returns the entire concatenated block of columns, not a per-row vector. They must be paired.

**Is c_across slow for row sums?**

Yes. For pure row sum or mean, prefer `rowSums(across(x:z))` or `rowMeans(across(x:z))`: vectorized C code, much faster than rowwise + c_across.

**How do I count NAs per row in dplyr?**

`df |> rowwise() |> mutate(n_na = sum(is.na(c_across(everything())))) |> ungroup()`. Or for speed: `mutate(n_na = rowSums(is.na(across(everything()))))`.

**Can I use tidyselect helpers inside c_across?**

Yes. `c_across(starts_with("x_"))`, `c_across(where(is.numeric))`, `c_across(everything())` all work. Same syntax as `select()` and `across()`.
