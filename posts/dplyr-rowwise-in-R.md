---
title: "dplyr rowwise() in R: Compute One Row at a Time"
slug: "dplyr-rowwise-in-R"
description: "Use dplyr rowwise() to operate on a data frame one row at a time in R. Covers rowwise + c_across, when to prefer vectorized alternatives, and 5 examples."
keywords: "dplyr rowwise, R rowwise mutate, rowwise vs vectorized, dplyr per-row, rowwise c_across, R row-by-row computation, rowwise alternative"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "rowwise()|dplyr rowwise|per-row computation|rowwise mutate|row-by-row"
auto_link_case_sensitive: true
target_keyword: "dplyr rowwise"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr rowwise() in R: Compute One Row at a Time

<p class="lead">The <code>rowwise()</code> function in dplyr converts a tibble into a special grouped form where every row is its own group. Subsequent <code>mutate()</code> calls operate one row at a time, useful when a function is NOT vectorized.</p>

[QUICK ANSWER]
df |> rowwise() |> mutate(total = sum(c_across(x:z)))
df |> rowwise() |> mutate(min_v = min(c(a, b, c)))
df |> rowwise() |> mutate(model = list(lm(y ~ x, data = data)))
df |> rowwise(id) |> mutate(...)              # preserve id col
df |> mutate(total = rowSums(across(x:z)))    # vectorized alternative
df |> mutate(model = pmap(list(...), fn))     # purrr alternative

[DECISION TREE: Is rowwise() the right tool?]
- per-row reduction (sum, mean) over columns: prefer rowSums/rowMeans/across
- per-row call to a non-vectorized function: rowwise()
- per-row model fitting on list-column data: rowwise() or purrr::map
- per-row string paste: rowwise + paste, or tidyr::unite
- vectorized arithmetic on columns: just use mutate (no rowwise)
- row min / max across cols: pmin / pmax (base R)

## What rowwise() does in one sentence

**`rowwise(.data, ...)` returns a tibble where each row forms its own group, so subsequent `mutate()` evaluates expressions ONE ROW AT A TIME.** Optional grouping vars (`...`) are kept in the row identity but otherwise behave like grouping columns.

The big win: lets you call functions that weren't designed for vectors (`lm`, `paste`, `min` over many columns) on each row independently. The big cost: speed.

## Syntax

**`rowwise(.data, ...)`. Returns a `rowwise_df`. Always pair with `ungroup()` afterwards.**

```r title="Per-row sum over selected columns"
library(dplyr)

library(tidyr)
df <- data.frame(x = 1:3, y = 4:6, z = 7:9)

df |>
  rowwise() |>
  mutate(total = sum(c(x, y, z))) |>
  ungroup()
#>   x y z total
#> 1 1 4 7    12
#> 2 2 5 8    15
#> 3 3 6 9    18
```

[TIP]
**For numeric reductions over columns, use `rowSums()` or `rowMeans()`: they are vectorized and much faster.** rowwise is for cases vectorized alternatives can't handle.

## Five common patterns

### 1. Row-wise sum or mean

```r title="Sum across columns"
df |>
  rowwise() |>
  mutate(total = sum(c_across(x:z))) |>
  ungroup()
```

For real code, prefer `mutate(total = rowSums(across(x:z)))`: vectorized.

### 2. Per-row min / max with mixed columns

```r title="Smallest value per row across selected columns"
df |>
  rowwise() |>
  mutate(min_v = min(c(x, y, z))) |>
  ungroup()
```

`pmin(df$x, df$y, df$z)` does the same vectorized.

### 3. Fit a model per group (with list-columns)

```r title="One model per group via rowwise"
nested <- mtcars |>
  group_by(cyl) |>
  tidyr::nest()

nested |>
  rowwise() |>
  mutate(model = list(lm(mpg ~ wt, data = data))) |>
  ungroup()
```

`list()` wraps the model object so it fits in a list-column. Classic many-models pattern.

### 4. String paste per row

```r title="Concatenate columns row-wise"
df_text <- data.frame(a = c("x","y"), b = c("1","2"))

df_text |>
  rowwise() |>
  mutate(combo = paste(a, b, sep = "-")) |>
  ungroup()
#>   a b combo
#> 1 x 1   x-1
#> 2 y 2   y-2
```

`paste()` IS vectorized; rowwise is unnecessary here. `mutate(combo = paste(a, b, sep="-"))` works too.

### 5. Apply a non-vectorized custom function

```r title="Function that takes a vector, returns a scalar"
mode_val <- function(v) {
  ux <- unique(v)
  ux[which.max(tabulate(match(v, ux)))]
}

df |>
  rowwise() |>
  mutate(mode_xyz = mode_val(c(x, y, z))) |>
  ungroup()
```

When no vectorized alternative exists, rowwise is the right tool.

[KEY INSIGHT]
**`rowwise()` is a SPECIAL kind of grouping.** Internally, dplyr treats each row as its own group. Most operations that work on grouped tibbles also work on rowwise tibbles. The key difference: every group has exactly one row.

## rowwise() vs vectorized vs purrr::pmap

**Three approaches to per-row computation in R, with different speed and clarity.**

| Approach | Speed | Clarity | Best for |
|---|---|---|---|
| Vectorized (`rowSums`, `pmin`, `paste`) | Fastest | Cleanest | When a vectorized version exists |
| `rowwise()` + mutate | Slow | OK | Non-vectorized functions; list-column workflows |
| `purrr::pmap()` | Medium | OK | Multi-arg row-wise mapping; type-safe via pmap_dbl etc. |

When to use which:

- Always check for a vectorized alternative first. If `rowSums`, `pmin`, `paste`, `coalesce`, etc. exists, use that.
- If you have a function like `lm()`, `cor()`, `paste()` over many columns, rowwise is reasonable.
- For data-flow style (no list columns), `purrr::pmap_dbl(list(x, y, z), sum)` may be cleaner.

## A practical workflow

**The "many models" pattern is the killer use case for rowwise.**

```r title="Many models via rowwise"
mtcars |>
  group_by(cyl) |>
  tidyr::nest() |>
  rowwise() |>
  mutate(
    model = list(lm(mpg ~ wt, data = data)),
    r2    = summary(model)$r.squared
  ) |>
  ungroup()
```

Each row holds one nested data frame and one fitted model. List-columns + rowwise = elegant repeated modeling. Outside this pattern, prefer vectorized solutions.

## Common pitfalls

**Pitfall 1: rowwise applies to ALL subsequent verbs.** `df |> rowwise() |> mutate(total = sum(c(x,y,z))) |> filter(total > 10)` filters per-row (which works), but the `total > 10` is also evaluated per-row. Always `ungroup()` when done.

**Pitfall 2: passing column names without `c()`.** `mutate(total = sum(x, y, z))` works only if `x`, `y`, `z` are length-1. With rowwise, they ARE length-1 per row, so it works. Without rowwise, `sum(x, y, z)` sums all three columns into one scalar.

[WARNING]
**`rowwise()` is SLOW for big data.** Each row spawns a separate evaluation context. For a 1M-row data frame, this is orders of magnitude slower than vectorized alternatives. Always benchmark before shipping rowwise-heavy code.

## Try it yourself

**Try it:** For each row of `mtcars`, compute the max of `mpg`, `disp/100`, and `hp/10`. Save to `ex_max_metric`.

```r title="Your turn: row-wise max of derived quantities"
ex_max_metric <- mtcars |>
  # your code here

head(ex_max_metric)
#> Expected: numeric vector of per-row max values
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_max_metric <- mtcars |>
  rowwise() |>
  mutate(max_metric = max(mpg, disp/100, hp/10)) |>
  ungroup() |>
  pull(max_metric)

head(ex_max_metric)
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1   (depends on row)

# Vectorized alternative:
ex_alt <- pmax(mtcars$mpg, mtcars$disp/100, mtcars$hp/10)
```

**Explanation:** rowwise + max works per row. `pmax()` is the vectorized equivalent and is much faster.

</details>

## Related dplyr functions

After mastering rowwise, look at:

- `c_across()`: paired with rowwise for column-vector reductions
- `across()`: column-wise transformation
- `tidyr::nest()`: create list-columns for many-models workflows
- `purrr::pmap()`: multi-arg row-wise mapping
- `rowSums()` / `rowMeans()`: fast specialized
- `ungroup()`: always pair with rowwise to drop the grouping

For multi-input row-wise mapping, `purrr::pmap()` is often cleaner than rowwise + mutate.

## FAQ

**What does rowwise do in dplyr?**

`rowwise(df)` makes every row its own group. Subsequent `mutate()` evaluates expressions one row at a time, useful when a function expects scalars.

**When should I use rowwise vs vectorized operations?**

Always prefer vectorized when possible (rowSums, pmin, paste, etc.). Use rowwise only when a function expects scalars and there is no vectorized alternative.

**Is rowwise slower than mutate?**

Yes, often 10-100x slower. Each row spawns a separate evaluation. For numeric reductions, switch to rowSums / rowMeans / pmin / pmax.

**How do I fit one model per group with rowwise?**

`df |> group_by(g) |> tidyr::nest() |> rowwise() |> mutate(model = list(lm(y ~ x, data = data)))`. The `list()` wraps the model so it fits in a list-column.

**Do I need to ungroup() after rowwise?**

Yes. rowwise is a kind of grouping; downstream verbs continue to operate per-row unless you call `ungroup()`. Forgetting this is a common bug.
