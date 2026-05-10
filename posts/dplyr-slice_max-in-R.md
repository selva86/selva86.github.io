---
title: "dplyr slice_max() in R: Top N Rows by Column Value"
slug: "dplyr-slice_max-in-R"
description: "Use dplyr slice_max() to get the top n rows by a column value (or per group). Covers n, prop, with_ties, .by, vs arrange + slice_head, and 5 examples."
keywords: "dplyr slice_max, R top n by value, slice_max per group, dplyr top rows, slice_max with_ties, dplyr top_n superseded, top n by column R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "slice_max()|dplyr slice_max|top n by value|top rows by group|highest n rows"
auto_link_case_sensitive: true
target_keyword: "dplyr slice_max"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr slice_max() in R: Top N Rows by Column Value

<p class="lead">The <code>slice_max()</code> function in dplyr returns the rows with the LARGEST values of a specified column, optionally per group. It is the modern replacement for the deprecated <code>top_n()</code>.</p>

[QUICK ANSWER]
slice_max(df, mpg, n = 5)                   # 5 highest by mpg
slice_max(df, mpg, prop = 0.1)              # top 10%
slice_max(df, mpg, n = 3, by = cyl)         # top 3 per cyl
slice_max(df, mpg, n = 3, with_ties = FALSE)# strict 3 (no ties)
slice_max(df, mpg, n = -3)                  # all but top 3
arrange(df, desc(mpg)) |> slice_head(n = 5) # equivalent older form

[DECISION TREE: Is slice_max() the right tool?]
- top n by column value: slice_max(col, n = N)
- bottom n by column value: slice_min(col, n = N)
- top n PER GROUP: slice_max(col, n, by = g)
- top n by row order (no metric): slice_head(n = N)
- top n%: slice_max(col, prop = 0.1)
- random sample: slice_sample(n = N)
- handle ties strictly: with_ties = FALSE

## What slice_max() does in one sentence

**`slice_max(.data, order_by, n)` sorts by `order_by` descending and returns the top `n` rows.** On a grouped tibble (or with `by = g`), it returns the top n per group.

This is the cleanest way to answer "top N by metric" questions. It supersedes the older `top_n()` (deprecated in dplyr 1.0).

## Syntax

**`slice_max(.data, order_by, n = NULL, prop = NULL, by = NULL, with_ties = TRUE, na_rm = FALSE)`.**

```r title="Top 5 cars by MPG"
library(dplyr)

mtcars |>
  slice_max(mpg, n = 5)
#>                 mpg cyl ...
#> Toyota Corolla 33.9   4
#> Fiat 128       32.4   4
#> Honda Civic    30.4   4
#> Lotus Europa   30.4   4
#> Fiat X1-9      27.3   4
```

[TIP]
**`slice_max()` is more explicit than `arrange(desc(x)) |> head(n)`.** It says exactly what it does: "top n by x". Reach for it whenever you mean "top N by metric".

## Five common patterns

### 1. Top n by a column

```r title="3 highest MPG cars"
mtcars |>
  slice_max(mpg, n = 3)
#> Toyota Corolla 33.9
#> Fiat 128       32.4
#> Honda Civic    30.4
#> Lotus Europa   30.4   <-- tie
```

By default, ties are included (you may get more rows than n).

### 2. Top n per group

```r title="Highest MPG car per cylinder count"
mtcars |>
  slice_max(mpg, n = 1, by = cyl)
#>                 mpg cyl
#> Toyota Corolla 33.9   4
#> Hornet 4 Drive 21.4   6
#> Pontiac Firebird 19.2 8
```

`by = cyl` scopes to each cyl group; one row per group.

### 3. Top fraction (prop)

```r title="Top 10% of cars by MPG"
mtcars |>
  slice_max(mpg, prop = 0.1)
```

10% of 32 = 3 rows (or more with ties).

### 4. Strict top n (no ties)

```r title="Exactly 3 rows, drop ties arbitrarily"
mtcars |>
  slice_max(mpg, n = 3, with_ties = FALSE)
#> Toyota Corolla 33.9
#> Fiat 128       32.4
#> Honda Civic    30.4
```

`with_ties = FALSE` returns exactly `n` rows; arbitrary among ties.

### 5. Latest record per group (timestamp)

```r title="Most recent event per user"
events <- data.frame(
  user = c("a","a","b","b"),
  ts   = as.Date(c("2024-01-01","2024-03-15","2024-02-10","2024-04-20")),
  val  = c(10, 20, 30, 40)
)

events |>
  slice_max(ts, n = 1, by = user)
#>   user         ts val
#> 1    a 2024-03-15  20
#> 2    b 2024-04-20  40
```

The canonical "latest per group" idiom in modern dplyr.

[KEY INSIGHT]
**`slice_max()` replaces THREE older patterns: `top_n()` (deprecated), `arrange(desc(x)) |> head(n)`, and `arrange(desc(x)) |> slice_head(n)`.** It is more readable, faster, and group-aware. For new code, always prefer slice_max for "top N by metric".

## slice_max() vs top_n() vs arrange + slice_head vs slice_min

**Four ways to grab "top n by column" in R, with different ergonomics.**

| Function | Sorts | Per group | Status |
|---|---|---|---|
| `slice_max(col, n)` | Yes (desc) | Yes | Recommended |
| `slice_min(col, n)` | Yes (asc) | Yes | Recommended (mirror) |
| `arrange(desc(col)) |> slice_head(n)` | Yes | Yes if grouped | Verbose, equivalent |
| `top_n(n, col)` | No | Yes | Deprecated in dplyr 1.0 |

When to use which:

- `slice_max` for top-by-metric.
- `slice_min` for bottom-by-metric.
- `arrange + slice_head` only if you also need the full sorted intermediate state.
- Avoid `top_n` in new code.

## A practical slice_max workflow

**The "top N per group" pattern is the most common slice_max use case in real pipelines.**

Common variations:

- Top 1 per group → `slice_max(metric, n = 1, by = g)` ("best of each")
- Top 5 by metric overall → `slice_max(metric, n = 5)` ("leaderboard")
- Highest-priced item per category → `slice_max(price, n = 1, by = category)`
- Most recent record per user → `slice_max(timestamp, n = 1, by = user)`

The pattern is so common it deserves its own one-liner. `slice_max(df, col, n, by)` IS that one-liner.

## Common pitfalls

**Pitfall 1: ties expand the result.** `slice_max(mpg, n = 3)` returns 4 rows if two are tied at rank 3. Use `with_ties = FALSE` for strict `n`.

**Pitfall 2: NAs sort to the bottom of descending order.** `slice_max` excludes NAs in `order_by` only if `na_rm = TRUE`. Default behavior may surprise.

[WARNING]
**`slice_max()` differs from `arrange()`: it does NOT keep the sorted order in the output.** Output rows may appear in original order. To get the sorted output, chain with `arrange(desc(col))`.

## Try it yourself

**Try it:** Find the car with the highest `hp` for each `gear` value. Save to `ex_top_hp`.

```r title="Your turn: top hp per gear"
ex_top_hp <- mtcars |>
  # your code here

ex_top_hp
#> Expected: 3 rows (one per gear value)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_top_hp <- mtcars |>
  slice_max(hp, n = 1, by = gear)
ex_top_hp
#>                    mpg cyl ... hp gear
#> Maserati Bora    15.0   8    335    5
#> Hornet Sportabout 18.7  8    175    3
#> Ford Pantera L   15.8   8    264    5
```

**Explanation:** `slice_max(hp, n = 1, by = gear)` finds the highest-hp row for each unique value of `gear`. With ties, more rows may appear; add `with_ties = FALSE` for strict 1-per-group.

</details>

## Related slice functions

After mastering slice_max, look at:

- `slice_min()`: bottom n by column (mirror of slice_max)
- `slice_head()` / `slice_tail()`: first/last n by row order
- `slice_sample()`: random n rows
- `slice()`: specific row indexes
- `arrange()`: sort the entire frame
- `top_n()`: deprecated; do not use

For "lowest n by metric", `slice_min(col, n)` is the direct counterpart.

## FAQ

**What is the difference between slice_max and top_n in dplyr?**

`top_n()` is deprecated since dplyr 1.0. `slice_max()` is the replacement: clearer name, supports `prop`, `by`, and `with_ties` arguments.

**How does slice_max handle ties?**

By default `with_ties = TRUE` includes all tied rows, which may return more than n rows. Set `with_ties = FALSE` for exactly n rows.

**How do I get the top n per group?**

Pass `by = group_col` (dplyr 1.1+): `slice_max(df, col, n = 3, by = g)`. Or `df |> group_by(g) |> slice_max(col, n = 3) |> ungroup()`.

**What is the difference between slice_max and slice_head?**

`slice_max(col, n)` sorts by COLUMN VALUE descending and takes top n. `slice_head(n)` takes the FIRST n rows IN CURRENT ORDER, ignoring values. Use slice_max when ranking is the criterion.

**How does slice_max handle NA values?**

NAs go to the bottom of descending order, so they are not picked unless n exceeds the count of non-NAs. Set `na_rm = TRUE` to exclude NAs explicitly.
