---
title: "tidyr pivot_longer() in R: Wide to Long Format"
slug: "tidyr-pivot_longer-in-R"
description: "Use tidyr pivot_longer() to reshape wide data to long format in R. Covers names_to, values_to, multiple value columns, regex patterns, and 6 examples."
keywords: "tidyr pivot_longer, R wide to long, reshape data R, pivot longer R, R reshape, names_to values_to, gather replacement"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "pivot_longer()|tidyr pivot_longer|wide to long|reshape long|gather replacement"
auto_link_case_sensitive: true
target_keyword: "tidyr pivot_longer"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr pivot_longer() in R: Wide to Long Format

<p class="lead">The <code>pivot_longer()</code> function in tidyr reshapes wide data into long format by collapsing multiple columns into key-value pairs. It is the modern replacement for <code>gather()</code> and the most common reshape operation.</p>

[QUICK ANSWER]
pivot_longer(df, cols = c(a, b, c))                       # specific columns
pivot_longer(df, cols = -id)                              # all except id
pivot_longer(df, cols = starts_with("year"))              # tidyselect
pivot_longer(df, cols = ..., names_to = "year", values_to = "sales")
pivot_longer(df, cols = ..., names_to = c("var", "year"), names_sep = "_")
pivot_longer(df, cols = ..., names_to = c(".value", "year"), names_sep = "_")
pivot_longer(df, cols = ..., values_drop_na = TRUE)       # skip NA values

[DECISION TREE: Is pivot_longer() the right tool?]
- wide -> long, simple key-value: pivot_longer(cols = ...)
- column names hold variable info: names_to with regex/sep
- multiple value columns to keep separate: names_to = c(".value", "x")
- long -> wide: pivot_wider()
- summarise across cols: across() inside summarise
- transpose matrix: t()
- reshape data.table style: melt() and dcast()

## What pivot_longer() does in one sentence

**`pivot_longer()` collapses multiple columns into two new columns: one for the OLD COLUMN NAMES (the "key") and one for the VALUES they held.** Each input row produces multiple output rows, one per column being pivoted.

This is the "tidy" form of data: one observation per row, one variable per column. Most analysis functions (ggplot2, dplyr, broom) work best with long data; wide is for human-readable output.

## Syntax

**`pivot_longer(data, cols, names_to, values_to)` is the minimum.** `cols` selects columns to pivot; `names_to` is the name for the new "key" column; `values_to` is the name for the new "value" column.

```r title="Build a small wide data frame"
library(tidyr)

wide <- tibble::tribble(
  ~country, ~y2020, ~y2021, ~y2022,
  "USA",    100,    110,    120,
  "UK",      80,     85,     88,
  "DE",      90,     95,    100
)

print(wide)
```

The full signature:

```
pivot_longer(data, cols, ..., cols_vary = "fastest",
             names_to = "name", names_prefix = NULL, names_sep = NULL,
             names_pattern = NULL, names_ptypes = list(), names_transform = list(),
             names_repair = "check_unique",
             values_to = "value", values_drop_na = FALSE,
             values_ptypes = list(), values_transform = list())
```

[TIP]
**`cols = -id` is shorthand for "every column except id".** Pivot every column except the identifier columns. This pattern appears in nearly every real-world reshape.

## Six common patterns

### 1. Basic wide to long

```r title="Pivot year columns to long"
wide |>
  pivot_longer(cols = c(y2020, y2021, y2022),
               names_to = "year", values_to = "sales")
#> # A tibble: 9 x 3
#>   country year  sales
#>   <chr>   <chr> <dbl>
#> 1 USA     y2020   100
#> 2 USA     y2021   110
#> 3 USA     y2022   120
#> 4 UK      y2020    80
#> ...
```

The three year columns collapse into rows. Each country now has 3 rows (one per year).

### 2. All except identifier

```r title="Pivot everything except country"
wide |>
  pivot_longer(cols = -country, names_to = "year", values_to = "sales")
```

Negative selection: `-country` means "all columns except country". Common for "tidy this whole table except the IDs" pattern.

### 3. tidyselect helpers

```r title="Pivot columns matching pattern"
wide |>
  pivot_longer(cols = starts_with("y"), names_to = "year", values_to = "sales")
```

Use `starts_with()`, `ends_with()`, `contains()`, `matches()` (regex), `where()` for column selection.

### 4. Strip prefix from names

```r title="Drop the y prefix from year names"
wide |>
  pivot_longer(cols = -country,
               names_to = "year",
               names_prefix = "y",
               values_to = "sales")
#>   country year  sales
#>   <chr>   <chr> <dbl>
#> 1 USA     2020    100
#> 2 USA     2021    110
#> ...
```

`names_prefix = "y"` removes the "y" prefix when the column name becomes a year value. Useful for cleaning naming conventions in one step.

### 5. Split column names into multiple parts

```r title="When column names encode 2 things separated by _"
wide2 <- tibble::tribble(
  ~country, ~sales_2020, ~sales_2021, ~costs_2020, ~costs_2021,
  "USA",    100, 110, 50, 55,
  "UK",      80,  85, 40, 42
)

wide2 |>
  pivot_longer(cols = -country,
               names_to = c("metric", "year"),
               names_sep = "_")
#> # A tibble: 8 x 4
#>   country metric year  value
#>   <chr>   <chr>  <chr> <dbl>
#> 1 USA     sales  2020    100
#> 2 USA     sales  2021    110
#> 3 USA     costs  2020     50
#> 4 USA     costs  2021     55
#> ...
```

`names_to = c("metric", "year")` with `names_sep = "_"` splits each column name into TWO new columns. The values column captures the numeric value.

### 6. Multiple value columns with .value

```r title="Keep each metric as its own column"
wide2 |>
  pivot_longer(cols = -country,
               names_to = c(".value", "year"),
               names_sep = "_")
#> # A tibble: 4 x 4
#>   country year  sales costs
#>   <chr>   <chr> <dbl> <dbl>
#> 1 USA     2020    100    50
#> 2 USA     2021    110    55
#> 3 UK      2020     80    40
#> 4 UK      2021     85    42
```

The special `.value` keyword in `names_to` tells pivot_longer to preserve those names as VALUE COLUMNS rather than collapsing into a single value column.

[KEY INSIGHT]
**The most powerful and confusing feature of pivot_longer is `.value`.** Use it when the column name encodes a VARIABLE name (like "sales" or "costs") plus another dimension (like year). Result: one row per (id, year) combination, with separate columns for each variable type.

## pivot_longer() vs older reshape methods

**`pivot_longer()` (tidyr 1.0+) replaced `gather()` (tidyr 0.x) and `melt()` (reshape2).**

| Operation | Modern tidyr | Old tidyr | reshape2 |
|---|---|---|---|
| Wide to long | pivot_longer | gather | melt |
| Long to wide | pivot_wider | spread | dcast |
| Multi-key names | names_sep / names_pattern | (manual) | (manual) |
| Multi-value | names_to = c(".value", ...) | (impossible cleanly) | (variable.name + value.name) |

When to use which:

- Use `pivot_longer()` and `pivot_wider()` for new code.
- `gather()`/`spread()` are deprecated but still work in old code.
- `melt()`/`dcast()` from reshape2 are still common in tutorials but supersedeed by tidyr.

## Common pitfalls

**Pitfall 1: forgetting to specify `cols`.** Without `cols`, `pivot_longer()` does nothing useful. Always specify which columns to pivot, either by name list or tidyselect helpers.

**Pitfall 2: type coercion with mixed columns.** If columns being pivoted have different types (e.g., one numeric, one character), they will all become CHARACTER in the output. Convert types upstream or use `values_transform = list(...)` for column-specific coercion.

[WARNING]
**`names_to = c(".value", "x")` requires that the SAME number of pieces appear in every column name.** If column names mix `sales_2020` and `sales`, the parser fails. Either rename inconsistent columns first, or use `names_pattern` (regex) for more control.

**Pitfall 3: NA propagation through pivot.** Wide data with NA values produces long data with NA values in `values_to`. Use `values_drop_na = TRUE` to skip them entirely.

## Try it yourself

**Try it:** Build a wide tibble with columns `student`, `math_2024`, `english_2024`, `math_2025`, `english_2025`. Use `pivot_longer` with `.value` to get one row per (student, year) with separate `math` and `english` columns. Save to `ex_long`.

```r title="Your turn: pivot with .value"
scores <- tibble::tribble(
  ~student, ~math_2024, ~english_2024, ~math_2025, ~english_2025,
  "Alice",   85, 90, 88, 92,
  "Bob",     78, 82, 80, 85
)

# Try it: pivot to one row per (student, year)
ex_long <- scores |>
  # your code here

ex_long
#> Expected: 4 rows, 4 cols (student, year, math, english)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_long <- scores |>
  pivot_longer(cols = -student,
               names_to = c(".value", "year"),
               names_sep = "_")

ex_long
#> # A tibble: 4 x 4
#>   student year   math english
#>   <chr>   <chr> <dbl>   <dbl>
#> 1 Alice   2024     85      90
#> 2 Alice   2025     88      92
#> 3 Bob     2024     78      82
#> 4 Bob     2025     80      85
```

**Explanation:** `.value` preserves the prefix (math, english) as separate value columns. The suffix (year) becomes a regular long column. Result: one row per (student, year), with subject scores as columns.

</details>

## Related tidyr functions

After mastering pivot_longer, look at:

- `pivot_wider()`: inverse operation, long to wide
- `separate()`, `separate_wider_delim()`: split one column into many
- `unite()`: combine multiple columns into one
- `nest()`, `unnest()`: list-column reshaping
- `complete()`: fill in implicit combinations
- `fill()`: forward-fill missing values

For data.table users, `melt()` and `dcast()` are the equivalents and are often faster on large data.

## FAQ

**How do I reshape from wide to long in R?**

Use `tidyr::pivot_longer(data, cols = ..., names_to = "key", values_to = "value")`. Specify `cols` (which columns to pivot) and provide names for the new key and value columns.

**What is the difference between gather() and pivot_longer()?**

`pivot_longer()` is the modern replacement (tidyr 1.0+). It handles multi-value reshaping (`.value`), multi-key names (`names_sep`, `names_pattern`), and tidyselect column specification more cleanly. `gather()` is deprecated but still works in old code.

**How do I pivot multiple value columns at once with pivot_longer?**

Use `names_to = c(".value", "other_dim")` with `names_sep` or `names_pattern`. The `.value` keyword tells tidyr that part of the column name becomes a NEW COLUMN (not collapsed into the value column).

**What does the cols argument do in pivot_longer?**

`cols` selects which columns to pivot. Use bare names: `cols = c(a, b, c)`. Use tidyselect: `cols = starts_with("year")`. Use negative selection: `cols = -id` for "everything except id".

**How do I handle NAs when pivoting longer?**

Set `values_drop_na = TRUE` to skip rows where the value would be NA. Otherwise NAs are preserved. For more control, filter after pivoting: `pivot_longer(...) %>% filter(!is.na(value))`.
