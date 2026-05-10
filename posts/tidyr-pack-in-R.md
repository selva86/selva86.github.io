---
title: "tidyr pack() in R: Combine Columns Into a Single df-Column"
slug: "tidyr-pack-in-R"
description: "Use tidyr pack() to combine multiple columns into a single tibble (data frame) column in R. Covers vs nest, unpack, names_sep, and 5 worked examples."
keywords: "tidyr pack, R pack columns, pack vs nest, unpack tidyr, df-column, packed columns tidyr"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::pack()|tidyr pack|packed columns|df-column|pack vs nest"
auto_link_case_sensitive: true
target_keyword: "tidyr pack"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr pack() in R: Combine Columns Into a Single df-Column

<p class="lead">The <code>pack()</code> function in tidyr combines multiple columns into a single COLUMN OF TIBBLES (a "df-column"). It is the wide-to-grouped version of nesting, useful for organizing related columns.</p>

[QUICK ANSWER]
df |> pack(metrics = c(mpg, hp, wt))           # 3 cols -> 1 df-col 'metrics'
df |> pack(coords = c(lon, lat), score = c(s1, s2))
df |> unpack(metrics)                            # opposite: spread back
df |> nest(.by = group)                          # different: nest by row groups

[DECISION TREE: Is pack() the right tool?]
- combine related columns into one df-column: pack()
- collapse rows into list-column: nest()
- spread a df-column back: unpack()
- combine into one string column: tidyr::unite()
- structural reshape (long/wide): pivot_longer/wider

## What pack() does in one sentence

**`pack(data, ...)` combines multiple columns into a SINGLE column where each cell is a one-row tibble.** Useful for organizing related metrics together while preserving access to individual fields.

## Syntax

**`pack(data, ..., .names_sep = NULL)`. `...` is `new_col = c(c1, c2, ...)`.**

```r title="Combine related columns into a df-column"
library(tidyr)
library(dplyr)

library(tibble)
mtcars |>
  tibble::rownames_to_column("car") |>
  pack(performance = c(mpg, hp, qsec)) |>
  head(3) |>
  select(car, performance)
#>             car performance$mpg performance$hp performance$qsec
#> 1     Mazda RX4              21            110             16.5
#> ...
```

[TIP]
**`pack()` is rarely the first tool you reach for.** It is mostly used for organizing wide data with semantically grouped columns (e.g., "address fields", "performance metrics") into a hierarchical structure.

## Five common patterns

### 1. Group related columns

```r title="Performance metrics together"
mtcars |>
  pack(performance = c(mpg, hp, qsec))
```

### 2. Multiple groups

```r title="Two semantic groups"
mtcars |>
  pack(
    performance = c(mpg, hp, qsec),
    physical    = c(disp, wt, drat)
  )
```

### 3. Reverse with unpack

```r title="Round-trip"
packed <- mtcars |> pack(perf = c(mpg, hp))
packed |> unpack(perf) |> identical(mtcars)
```

### 4. Use names_sep for prefix

```r title="Prefix new packed names"
df <- tibble(a = 1, b = 2, c = 3)
df |> pack(group = c(a, b), .names_sep = "_")
#> Inside the df-column: group_a, group_b
```

### 5. Access packed elements with $

```r title="Drill into df-column"
packed <- mtcars |> pack(perf = c(mpg, hp))
head(packed$perf$mpg)
```

[KEY INSIGHT]
**`pack()` is the OPPOSITE of `unpack()`, just as `nest` is the opposite of `unnest`.** They form a pair: pack creates df-columns; unpack flattens them. Same names, different shapes.

## pack() vs nest() vs unite()

| Function | Combines | Output |
|---|---|---|
| `pack()` | Columns into one df-column | New df-column |
| `nest()` | Rows into one list-column per group | New list-column, fewer rows |
| `unite()` | Columns into one string column | One string column |

When to use which:

- pack for organizing semantic groups of columns.
- nest for collapsing rows per group.
- unite for stringy column concatenation.

## A practical workflow

**Use pack to organize WIDE data with implicit groupings into hierarchical structure.**

```r
sensor_data |>
  pack(
    temperature = c(temp_min, temp_max, temp_avg),
    pressure    = c(pressure_min, pressure_max),
    flow        = c(flow_in, flow_out)
  )
```

Each top-level column is a logical group; access fields via `$temperature$temp_min`.

## Common pitfalls

**Pitfall 1: rare in everyday work.** pack and unpack are niche. Most analysis pipelines never need them.

**Pitfall 2: confusing pack with nest.** pack groups COLUMNS together (wide-to-hierarchical). nest groups ROWS together (long-to-list). Different orientations.

[WARNING]
**`pack()` makes downstream code more complex because columns become df-columns accessed via `$` chains.** Only pack when the hierarchical structure adds clarity.

## Try it yourself

**Try it:** Pack 3 dimension columns of iris into one "size" df-column. Save to `ex_packed`.

```r title="Your turn: pack iris dimensions"
ex_packed <- iris |>
  # your code here

names(ex_packed)
#> Expected: c("size", "Species") with size being a df-column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_packed <- iris |>
  pack(size = c(Sepal.Length, Sepal.Width, Petal.Length, Petal.Width))

names(ex_packed)
#> [1] "size" "Species"
```

**Explanation:** pack groups the 4 dimension columns under "size". The result is a 2-column tibble where size is a 4-column df-column.

</details>

## Related tidyr functions

After mastering pack, look at:

- `unpack()`: opposite (spread df-column to columns)
- `nest()`: per-group row collapsing
- `unite()`: combine to string column
- `pivot_wider()` / `pivot_longer()`: structural reshape

## FAQ

**What does pack do in tidyr?**

`pack(data, name = c(cols))` combines multiple columns into a single column where each cell is a 1-row tibble. Used for organizing related columns hierarchically.

**What is the difference between pack and nest?**

pack groups COLUMNS together (wide-to-hierarchical, same row count). nest groups ROWS together (long-to-list, fewer rows).

**How do I access a packed column's fields?**

Use `$` chains: `df$packed_col$inner_col`. Or `unpack(packed_col)` to flatten.

**Is pack commonly used?**

Rarely. Most workflows don't need it. Reserve for explicitly hierarchical wide data.

**What is the inverse of pack?**

`unpack()`. Together they round-trip: `pack(...) |> unpack(...)` returns the original.
