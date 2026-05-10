---
title: "tidyr nest() in R: Bundle Rows Into List Columns"
slug: "tidyr-nest-in-R"
description: "Use tidyr nest() to collapse rows into list-columns of nested data frames in R. Covers vs group_by, .by, unnest, many-models, and 5 worked examples."
keywords: "tidyr nest, R nest list column, nest vs group_by, tidyr nest .by, many models nest, unnest tidyr"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::nest()|tidyr nest|nest list column|many models nest|nest vs group_by"
auto_link_case_sensitive: true
target_keyword: "tidyr nest"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr nest() in R: Bundle Rows Into List Columns

<p class="lead">The <code>nest()</code> function in tidyr collapses rows into list-columns where each cell holds a nested tibble. It is the foundation of "many-models" workflows and tidy hierarchical data.</p>

[QUICK ANSWER]
df |> nest(.by = group)                  # one row per group, data column
df |> group_by(g) |> nest()                # legacy (works but .by preferred)
df |> nest(data = c(col1, col2))          # specific columns nested
df |> unnest(data)                         # opposite: flatten back
mtcars |> nest(.by = cyl) |> mutate(model = map(data, ~ lm(mpg ~ wt, .x)))

[DECISION TREE: Is nest() the right tool?]
- collapse rows into list-column per group: nest()
- many-models pattern: nest + map
- specific columns nested only: nest(data = c(cols))
- flatten list column back: unnest()
- group + summarise: group_by + summarise (different intent)

## What nest() does in one sentence

**`nest(data, .by = group)` returns one row per group, with a list-column whose cells contain the rows for that group as nested tibbles.** Foundation of list-column workflows.

## Syntax

**`nest(data, ..., .by = NULL, .key = NULL, .names_sep = NULL)`. `.by` for grouping; `...` for column-naming.**

```r title="Nest mtcars by cyl"
library(tidyr)
library(dplyr)

mtcars |>
  nest(.by = cyl)
#> # A tibble: 3 x 2
#>     cyl                 data
#>   <dbl>               <list>
#>     6  <tibble [7 x 10]>
#>     4  <tibble [11 x 10]>
#>     8  <tibble [14 x 10]>
```

[TIP]
**Combine `nest()` with `purrr::map()` for the "many models" pattern.** Each cell holds a tibble; map applies a function (like `lm`) to each.

## Five common patterns

### 1. Standard nest by group

```r title="One row per cyl"
mtcars |> nest(.by = cyl)
```

### 2. Many models pattern

```r title="Fit lm per cyl group"
library(purrr)
mtcars |>
  nest(.by = cyl) |>
  mutate(model = map(data, ~ lm(mpg ~ wt, data = .x)))
```

### 3. Per-group statistics

```r title="Custom statistic per group"
mtcars |>
  nest(.by = cyl) |>
  mutate(n = map_int(data, nrow),
         mean_mpg = map_dbl(data, ~ mean(.x$mpg)))
```

### 4. Nested with multiple grouping columns

```r title="Group by cyl AND gear"
mtcars |>
  nest(.by = c(cyl, gear))
```

### 5. Custom column nest

```r title="Nest specific columns into 'measures'"
mtcars |>
  nest(measures = c(disp, hp, qsec))
```

[KEY INSIGHT]
**`nest()` enables the "many models" workflow: one row per group, model fitted per row, results extracted via map.** This is the canonical tidyverse approach to per-group statistical analysis.

## nest() vs group_by() vs nest_join()

| Function | Output | Best for |
|---|---|---|
| `nest(.by = g)` | One row per group, list column | Many-models pattern |
| `group_by(g)` | Marker on data frame | Aggregation |
| `nest_join()` | Each x row + nested matches from y | Hierarchical join |

When to use which:

- nest for splitting data into per-group tibbles for further per-group operations.
- group_by for aggregation.
- nest_join for join-style hierarchical merging.

## A practical workflow

**The "fit, summarise, unnest" pattern for many-models analysis.**

```r
results <- mtcars |>
  nest(.by = cyl) |>
  mutate(
    model    = map(data, ~ lm(mpg ~ wt, data = .x)),
    glanced  = map(model, broom::glance),
    tidied   = map(model, broom::tidy)
  ) |>
  unnest(glanced)
```

Per cyl group: fit a model, extract glance summary, unnest into columns. Standard tidymodels workflow.

## Common pitfalls

**Pitfall 1: forgetting to use map.** After nest, the data column is a LIST. To compute on it, use `map(data, fn)`.

**Pitfall 2: mixing nest with group_by.** Modern dplyr uses `nest(.by = g)` directly; older code does `group_by(g) |> nest()`. Both work; .by is cleaner.

[WARNING]
**`nest()` returns a TIBBLE WITH A LIST COLUMN, not a list of tibbles.** This is important for downstream code: it can still be filtered, mutated, joined like a normal data frame.

## Try it yourself

**Try it:** Nest mtcars by `gear` and compute the row count per gear group. Save to `ex_nested`.

```r title="Your turn: nest by gear"
ex_nested <- mtcars |>
  # your code here

ex_nested
#> Expected: 3 rows (one per gear) with row count column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_nested <- mtcars |>
  nest(.by = gear) |>
  mutate(n = purrr::map_int(data, nrow))

ex_nested
#> # A tibble: 3 x 3
#>    gear              data     n
#>      3 <tibble [15 x 10]>    15
#>      4 <tibble [12 x 10]>    12
#>      5 <tibble [5 x 10]>      5
```

**Explanation:** nest creates one row per gear; map_int(data, nrow) counts rows in each.

</details>

## Related tidyr / purrr functions

After mastering nest, look at:

- `unnest()`: opposite (flatten list column)
- `unnest_longer()` / `unnest_wider()`: targeted unnesting
- `purrr::map()`: per-cell computation on list columns
- `nest_join()`: nested-join (different)
- `broom::glance()` / `broom::tidy()`: model output extraction
- `tidymodels`: framework using nest extensively

## FAQ

**What does nest do in tidyr?**

`nest(data, .by = g)` returns one row per group, with a list-column whose cells contain the rows for that group as nested tibbles.

**What is the difference between nest and group_by?**

group_by attaches a grouping marker; data shape is unchanged. nest CHANGES THE SHAPE: one row per group, with the original rows as nested tibbles.

**How do I do many models with nest?**

`nest(.by = g) |> mutate(model = map(data, ~ lm(y ~ x, data = .x)))`. Each row holds a fitted model.

**How do I flatten a nested data frame?**

Use `unnest(data)` (or `unnest_longer` / `unnest_wider`). Reverses nest.

**What is the .by argument in nest?**

`.by = column` is the modern way to specify grouping (dplyr 1.1+). Replaces the older `group_by(col) |> nest()` pattern.
