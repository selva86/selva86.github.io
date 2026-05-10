---
title: "dplyr slice() in R: Select Rows by Position"
slug: "dplyr-slice-in-R"
description: "Use dplyr slice(), slice_head, slice_tail, slice_min, slice_max, and slice_sample to pick rows by position or by value in R. 7 worked examples included."
keywords: "dplyr slice, slice rows R, slice_head, slice_tail, slice_min, slice_max, slice_sample, dplyr select rows by position"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "slice()|dplyr slice|slice_head()|slice_tail()|slice_max()|slice_min()|slice_sample()"
auto_link_case_sensitive: true
target_keyword: "dplyr slice"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr slice() in R: Select Rows by Position

<p class="lead">The <code>slice()</code> family in dplyr selects rows by position, by value, or by random sampling. Use <code>slice()</code> for explicit indices, <code>slice_head()</code> / <code>slice_tail()</code> for first or last N, <code>slice_max()</code> / <code>slice_min()</code> for top by value, and <code>slice_sample()</code> for random rows.</p>

[QUICK ANSWER]
slice(df, 1:5)                          # rows 1 to 5 by position
slice_head(df, n = 5)                   # first 5 rows
slice_tail(df, n = 5)                   # last 5 rows
slice_max(df, mpg, n = 5)               # top 5 by mpg
slice_min(df, mpg, n = 5)               # bottom 5 by mpg
slice_sample(df, n = 5)                 # random 5 rows
slice_max(df, mpg, n = 1, by = cyl)     # top mpg per cyl group

[DECISION TREE: Is slice() the right tool?]
- pick rows by position index: slice(df, 1:5)
- first or last N rows: slice_head(df, n = 5) / slice_tail(df, n = 5)
- top N by value: slice_max(df, mpg, n = 5)
- random sample of rows: slice_sample(df, n = 5)
- filter by condition (not position): filter(df, x > 5)
- arrange + head: arrange(df, x) |> head(5) (works but slice_min is cleaner)
- top per group: slice_max(df, x, n = 1, by = g)

## What slice() does in one sentence

**The slice family selects rows by POSITION or VALUE, not by condition.** `slice()` itself takes integer positions; the variants `slice_head`, `slice_tail`, `slice_min`, `slice_max`, `slice_sample` cover the most common positional patterns.

Unlike `filter()` (which selects by logical condition), slice operates on row indices. Unlike `head()` and `tail()` (base R, work on any object), slice is data-frame-specific and pipe-friendly.

## Syntax

**Each slice variant has its own minimal arguments.** `slice(df, indices)` for explicit row numbers. `slice_head(df, n=5)` or `slice_head(df, prop=0.1)` for first 5 rows or first 10%. Same `n`/`prop` arguments for `slice_tail`, `slice_max`, `slice_min`, `slice_sample`.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

mtcars |> select(mpg, cyl, hp) |> head(3)
#>                    mpg cyl  hp
#> Mazda RX4         21.0   6 110
#> Mazda RX4 Wag     21.0   6 110
#> Datsun 710        22.8   4  93
```

The full signatures:

```
slice(.data, ..., .by = NULL, .preserve = FALSE)
slice_head(.data, ..., n, prop, by = NULL)
slice_tail(.data, ..., n, prop, by = NULL)
slice_max(.data, order_by, ..., n, prop, by = NULL, with_ties = TRUE, na_rm = FALSE)
slice_min(.data, order_by, ..., n, prop, by = NULL, with_ties = TRUE, na_rm = FALSE)
slice_sample(.data, ..., n, prop, by = NULL, weight_by = NULL, replace = FALSE)
```

[TIP]
**Use `n` for absolute count, `prop` for fraction.** `slice_head(df, n = 5)` returns 5 rows. `slice_head(df, prop = 0.1)` returns the first 10% of rows. They are mutually exclusive; pick one.

## Seven common patterns

### 1. Rows by explicit positions

```r title="Pick rows 1, 3, and 5"
mtcars |>
  slice(c(1, 3, 5)) |>
  select(mpg, cyl)
#>                  mpg cyl
#> Mazda RX4       21.0   6
#> Datsun 710      22.8   4
#> Hornet Sportabout 18.7  8
```

`slice()` takes a vector of positions. Use `1:5` for a range, `c(1, 3, 5)` for specific rows, or `-1` to drop the first row.

### 2. First or last N rows

```r title="First 3 and last 3 rows of mtcars"
mtcars |> slice_head(n = 3) |> select(mpg)
#>                  mpg
#> Mazda RX4       21.0
#> Mazda RX4 Wag   21.0
#> Datsun 710      22.8

mtcars |> slice_tail(n = 3) |> select(mpg)
#>                  mpg
#> Ferrari Dino    19.7
#> Maserati Bora   15.0
#> Volvo 142E      21.4
```

`slice_head()` returns the first N (in row order). `slice_tail()` returns the last N. Use `n=` or `prop=`.

### 3. Top N by value with slice_max

```r title="5 cars with highest mpg"
mtcars |>
  slice_max(mpg, n = 5) |>
  select(mpg, cyl)
#>                  mpg cyl
#> Toyota Corolla  33.9   4
#> Fiat 128        32.4   4
#> Honda Civic     30.4   4
#> Lotus Europa    30.4   4
#> Fiat X1-9       27.3   4
```

`slice_max()` sorts by `order_by` (here, `mpg`) and returns the top N. Includes ties by default (`with_ties = TRUE`).

### 4. Bottom N with slice_min

```r title="3 cars with lowest mpg"
mtcars |>
  slice_min(mpg, n = 3) |>
  select(mpg, cyl)
#>                       mpg cyl
#> Cadillac Fleetwood   10.4   8
#> Lincoln Continental  10.4   8
#> Camaro Z28           13.3   8
```

`slice_min()` is the inverse of `slice_max`. Same arguments.

### 5. Random sample of rows

```r title="Random 5 rows"
set.seed(42)
mtcars |>
  slice_sample(n = 5) |>
  select(mpg, cyl)
#>                    mpg cyl
#> Ford Pantera L    15.8   8
#> Ferrari Dino      19.7   6
#> Honda Civic       30.4   4
#> Cadillac Fleetwood 10.4  8
#> Hornet 4 Drive    21.4   6
```

`slice_sample()` picks rows uniformly at random. `set.seed()` makes the result reproducible. Use `replace = TRUE` for sampling with replacement.

### 6. Top per group

```r title="Best mpg per cylinder count"
mtcars |>
  slice_max(mpg, n = 1, by = cyl) |>
  select(cyl, mpg)
#>                  cyl  mpg
#> Toyota Corolla    4 33.9
#> Hornet 4 Drive    6 21.4
#> Pontiac Firebird  8 19.2
```

`by = cyl` groups for the slice operation. Each group returns its top N. The result is automatically ungrouped.

### 7. Drop rows by negative position

```r title="Drop the first 5 rows"
mtcars |>
  slice(-(1:5)) |>
  select(mpg) |>
  head(3)
#>                  mpg
#> Valiant         18.1
#> Duster 360      14.3
#> Merc 240D       24.4
```

Negative indices drop those positions. `slice(df, -(1:5))` is equivalent to `tail(df, n = nrow(df) - 5)`.

[KEY INSIGHT]
**`slice_max(df, x, n=5)` is sort-and-take in one step.** The equivalent `arrange(df, desc(x)) |> head(5)` works but is two operations. `slice_max` is clearer in pipelines and signals intent: "top 5 by x", not "sort, then take 5".

## slice() variants vs base R

**Base R uses bracket subsetting and `head()` / `tail()`. dplyr's slice family unifies positional row access with explicit, pipe-friendly verbs.**

| Task | dplyr slice | Base R |
|---|---|---|
| Specific positions | `slice(df, c(1,3,5))` | `df[c(1,3,5), ]` |
| First N | `slice_head(df, n=5)` | `head(df, 5)` |
| Last N | `slice_tail(df, n=5)` | `tail(df, 5)` |
| Top N by value | `slice_max(df, x, n=5)` | `df[order(-df$x)[1:5], ]` |
| Random N | `slice_sample(df, n=5)` | `df[sample(nrow(df), 5), ]` |
| Top per group | `slice_max(df, x, n=1, by=g)` | (multiple awkward steps) |

When to use which:

- Use slice variants in any dplyr pipeline.
- Use base R `head()` / `tail()` for one-line scripts on non-data-frame objects.

## Common pitfalls

**Pitfall 1: confusing slice with filter.** `slice(df, 1:5)` returns rows by POSITION (the first 5). `filter(df, x %in% 1:5)` returns rows where x is 1, 2, 3, 4, or 5 (a CONDITION on values). Different operations.

**Pitfall 2: slice does not arrange first.** `slice_head(df, n=5)` returns the first 5 rows in their CURRENT order, not the 5 smallest values. To get top 5 by a value, use `slice_max()` or `arrange()` first.

[WARNING]
**`slice_max(with_ties = TRUE)` can return MORE than n rows when ties exist.** `slice_max(mtcars, mpg, n = 1, with_ties = TRUE)` returns 2 rows because two cars both have 30.4 mpg. To always return exactly n rows, set `with_ties = FALSE`. The default is TRUE because dropping ties silently is usually wrong.

**Pitfall 3: forgetting set.seed() before slice_sample.** Random sampling is non-reproducible without a seed. Always `set.seed(N)` before `slice_sample()` if you need consistent results across runs.

## Try it yourself

**Try it:** Use the slice family to get the 3 cars with the LOWEST `qsec` (fastest quarter mile). Save to `ex_fastest`.

```r title="Your turn: top 3 fastest by qsec"
# Try it: lowest qsec = fastest
ex_fastest <- # your code here

ex_fastest |> select(qsec, hp)
#> Expected: 3 rows, sorted ascending by qsec
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fastest <- mtcars |> slice_min(qsec, n = 3)
ex_fastest |> select(qsec, hp)
#>                  qsec  hp
#> Ford Pantera L  14.50 264
#> Maserati Bora   14.60 335
#> Camaro Z28      15.41 245
```

**Explanation:** `slice_min(qsec, n = 3)` orders rows by `qsec` ascending and returns the first 3. This is "fastest" because lower qsec means quicker quarter mile.

</details>

## Related dplyr functions

After mastering slice, look at:

- `head()`, `tail()`: base R equivalents for any object (not just data frames)
- `top_n()`: legacy, superseded by `slice_max()` / `slice_min()`
- `sample_n()`, `sample_frac()`: legacy, superseded by `slice_sample()`
- `filter()`: select rows by logical condition (not position)
- `arrange()`: sort rows (often paired with slice_head for top-N)
- `distinct()`: deduplicate rows

For per-group top-N, `slice_max(by = group)` is cleaner than `group_by() |> slice_max() |> ungroup()`.

## FAQ

**What is the difference between slice and filter in dplyr?**

`slice()` selects rows by POSITION (row number or value rank). `filter()` selects rows by CONDITION (logical expression). `slice(df, 1:5)` returns rows 1 to 5; `filter(df, x %in% 1:5)` returns rows where column x equals 1, 2, 3, 4, or 5.

**How do I get the top N rows in dplyr?**

Use `slice_max(df, x, n = 5)` to get top 5 by column x. For first 5 rows in the current order (not by value), use `slice_head(df, n = 5)`.

**How do I sample rows randomly in dplyr?**

Use `slice_sample(df, n = 5)` for 5 random rows or `slice_sample(df, prop = 0.1)` for 10% random sample. Set `replace = TRUE` for sampling with replacement. Always call `set.seed()` before for reproducibility.

**Can slice_max return more than n rows?**

Yes, with ties. Default `with_ties = TRUE` keeps all rows tied at the cutoff. `slice_max(mtcars, mpg, n = 1)` may return 2 rows if two cars share the highest mpg. Set `with_ties = FALSE` to always return exactly n rows.

**What replaced top_n() and sample_n() in dplyr?**

`top_n()` is superseded by `slice_max()` (top by value) or `slice_head()` (top by row order). `sample_n()` is superseded by `slice_sample()`. The new names are clearer about what is being selected.
