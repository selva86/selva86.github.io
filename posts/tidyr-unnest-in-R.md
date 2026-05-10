---
title: "tidyr unnest() in R: Flatten List Columns Into Rows"
slug: "tidyr-unnest-in-R"
description: "Use tidyr unnest() to flatten list columns into rows in R. Covers vs unnest_longer, unnest_wider, keep_empty, and 5 worked examples."
keywords: "tidyr unnest, R unnest list column, unnest vs unnest_longer, unnest tibble, flatten list column R, tidyr unnest cols"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::unnest()|tidyr unnest|flatten list column|unnest tibble|unnest cols"
auto_link_case_sensitive: true
target_keyword: "tidyr unnest"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr unnest() in R: Flatten List Columns Into Rows

<p class="lead">The <code>unnest()</code> function in tidyr flattens list-columns of tibbles into multiple rows, expanding each cell into its constituent rows. It is the opposite of <code>nest()</code>.</p>

[QUICK ANSWER]
df |> unnest(data)                      # flatten the data list column
df |> unnest(c(col1, col2))              # multiple list cols
df |> unnest(data, keep_empty = TRUE)   # keep empty cells as NA rows
df |> unnest_longer(col)                 # for vector list cols
df |> unnest_wider(col)                  # spread named list cols to columns

[DECISION TREE: Is unnest() the right tool?]
- list column of tibbles -> rows: unnest(col)
- list column of vectors -> rows: unnest_longer(col)
- list column of named lists -> columns: unnest_wider(col)
- preserve empty cells: keep_empty = TRUE
- per-row keep raw matches: nest_join (different)

## What unnest() does in one sentence

**`unnest(data, cols)` expands list-columns where each cell is a tibble (or vector) into multiple rows; other columns are duplicated.** It reverses `nest()`.

## Syntax

**`unnest(data, cols, ..., keep_empty = FALSE, ptype = NULL, names_sep = NULL)`. cols are the list columns to unnest.**

```r title="Round-trip nest then unnest"
library(tidyr)
library(dplyr)

library(broom)
library(purrr)
# nest creates list column:
nested <- mtcars |> nest(.by = cyl)

# unnest flattens it back:
flat <- nested |> unnest(data)

nrow(flat)
#> [1] 32  (matches original mtcars rows)
```

[TIP]
**Use `unnest()` for tibbles in list columns; `unnest_longer()` for vectors; `unnest_wider()` for named lists turning into columns.**

## Five common patterns

### 1. Round-trip with nest

```r title="nest then unnest = original"
mtcars |>
  nest(.by = cyl) |>
  unnest(data)
```

### 2. Many-models extract

```r title="Unnest fitted summaries"
mtcars |>
  nest(.by = cyl) |>
  mutate(glanced = purrr::map(data, ~ broom::glance(lm(mpg ~ wt, .x)))) |>
  unnest(glanced) |>
  select(cyl, r.squared, p.value)
```

### 3. Keep empty cells

```r title="Empty list cells become NA rows"
df <- tibble(id = 1:2, x = list(c(1,2), integer(0)))
df |> unnest(x, keep_empty = TRUE)
#>   id  x
#> 1  1  1
#> 2  1  2
#> 3  2  NA   <-- empty cell preserved as NA
```

### 4. Multiple list columns

```r title="Unnest two parallel list cols"
df |> unnest(c(a, b))
```

Both must have the same length per cell.

### 5. Nest then transform

```r title="Per-group transformation then flatten"
df |>
  nest(.by = g) |>
  mutate(data = map(data, ~ mutate(.x, scaled = scale(value)))) |>
  unnest(data)
```

[KEY INSIGHT]
**`unnest()` family has 3 variants for different list-column shapes: tibbles, vectors, named lists.** unnest = tibbles, unnest_longer = vectors, unnest_wider = named lists to columns. Pick by what's in the list column.

## unnest() vs unnest_longer() vs unnest_wider()

| Function | List column contains | Output |
|---|---|---|
| `unnest()` | Tibbles / data frames | Multiple rows |
| `unnest_longer()` | Atomic vectors | Multiple rows |
| `unnest_wider()` | Named lists | Multiple columns |

When to use which:

- unnest for nested data frames (most common after nest()).
- unnest_longer for vector list columns (e.g., from str_split).
- unnest_wider for named list columns (e.g., from JSON).

## A practical workflow

**The "many-models extract" pattern is unnest's most common use.**

```r
result <- df |>
  nest(.by = group) |>
  mutate(model = map(data, ~ lm(y ~ x, data = .x)),
         tidied = map(model, broom::tidy)) |>
  unnest(tidied)
```

Per-group model coefficients in long format.

## Common pitfalls

**Pitfall 1: forgetting keep_empty.** Empty list cells (length 0) are silently dropped. Use `keep_empty = TRUE` to preserve them as NA rows.

**Pitfall 2: list column with mixed shapes.** unnest expects each cell to be the same type (all tibbles or all vectors). Mixed types may error.

[WARNING]
**`unnest()` can produce HUGE output for large nested tibbles.** A single nested tibble of 1M rows unnested becomes 1M output rows. Check sizes before running.

## Try it yourself

**Try it:** Nest mtcars by `cyl`, fit `lm(mpg ~ wt)` per group, then unnest the tidy coefficients. Save to `ex_coef`.

```r title="Your turn: many models tidy"
ex_coef <- mtcars |>
  # your code here

names(ex_coef)
#> Expected: cyl + tidy columns (term, estimate, std.error, statistic, p.value)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_coef <- mtcars |>
  nest(.by = cyl) |>
  mutate(tidied = purrr::map(data, ~ broom::tidy(lm(mpg ~ wt, .x)))) |>
  unnest(tidied) |>
  select(-data)

head(ex_coef)
#> # A tibble: 6 x 6
#>   cyl term     estimate std.error statistic p.value
#>   ...
```

**Explanation:** nest by cyl, fit lm, tidy each model, unnest the tidied coefficients.

</details>

## Related tidyr functions

After mastering unnest, look at:

- `unnest_longer()`: vectors to rows
- `unnest_wider()`: named lists to columns
- `nest()`: opposite (collapse to list column)
- `hoist()`: extract specific elements from list cols
- `purrr::map()`: per-cell transformation

## FAQ

**What does unnest do in tidyr?**

`unnest(data, cols)` flattens list-columns where each cell is a tibble (or vector) into multiple rows. Reverses nest().

**What is the difference between unnest and unnest_longer?**

unnest expects each list cell to be a TIBBLE (data frame). unnest_longer expects each cell to be an atomic VECTOR. Different input shapes.

**How do I keep empty list cells with unnest?**

Pass `keep_empty = TRUE`. Empty cells become NA rows.

**Does unnest preserve other columns?**

Yes. Other columns are duplicated to match the unnested rows.

**What is the difference between unnest and unite?**

unnest expands list-columns into rows. unite combines multiple columns into one. Different operations.
