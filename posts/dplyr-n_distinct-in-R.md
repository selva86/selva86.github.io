---
title: "dplyr n_distinct() in R: Count Unique Values Fast"
slug: "dplyr-n_distinct-in-R"
description: "Use dplyr n_distinct() to count unique values in a vector or column in R. Covers n_distinct vs length(unique()), na.rm, multi-column, 5 worked examples."
keywords: "dplyr n_distinct, R count unique values, n_distinct vs length unique, dplyr unique count, na.rm n_distinct, multi-column unique"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "n_distinct()|dplyr n_distinct|count unique values|unique count|n_distinct na.rm"
auto_link_case_sensitive: true
target_keyword: "dplyr n_distinct"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr n_distinct() in R: Count Unique Values Fast

<p class="lead">The <code>n_distinct()</code> function in dplyr counts the number of unique values in one or more vectors. It is the fast, dplyr-native equivalent of <code>length(unique(x))</code>.</p>

[QUICK ANSWER]
n_distinct(x)                          # unique values in x
n_distinct(x, na.rm = TRUE)            # exclude NAs
n_distinct(x, y)                       # unique combinations of x and y
df |> summarise(n_unique = n_distinct(col))
df |> group_by(g) |> summarise(n_unique = n_distinct(col))
length(unique(x))                       # base R equivalent (slower)

[DECISION TREE: Is n_distinct() the right tool?]
- count unique values in a vector: n_distinct(x)
- count unique combinations of multiple cols: n_distinct(x, y, z)
- exclude NA from the count: n_distinct(x, na.rm = TRUE)
- count rows: n() or nrow()
- show the distinct values: distinct(df, col) or unique(x)
- per-group unique count: group_by + summarise(n_distinct(col))

## What n_distinct() does in one sentence

**`n_distinct(x, ..., na.rm = FALSE)` returns the integer count of unique values in `x` (or unique combinations across `x, ...`).** It is faster than `length(unique(x))` because it avoids materializing the full unique vector.

The standard "how many unique customers / products / categories?" function in dplyr.

## Syntax

**`n_distinct(..., na.rm = FALSE)`. Pass one or more vectors; counts unique combinations across them.**

```r title="Unique values in a vector"
library(dplyr)

x <- c(1, 2, 2, 3, 3, 3, NA)
n_distinct(x)
#> [1] 4   (1, 2, 3, NA all counted as distinct)

n_distinct(x, na.rm = TRUE)
#> [1] 3
```

[TIP]
**`n_distinct(x)` is faster than `length(unique(x))`.** dplyr uses a hash-based approach that avoids materializing the unique vector. On a million-element vector the difference is significant.

## Five common patterns

### 1. Unique values in one column

```r title="How many cylinder counts in mtcars?"
n_distinct(mtcars$cyl)
#> [1] 3
```

### 2. Inside summarise

```r title="Per-group unique count"
mtcars |>
  group_by(cyl) |>
  summarise(n_gears = n_distinct(gear))
#>     cyl n_gears
#>     4       3
#>     6       3
#>     8       2
```

### 3. Multi-column combinations

```r title="Unique (cyl, gear) pairs"
n_distinct(mtcars$cyl, mtcars$gear)
#> [1] 8
```

Pass multiple vectors to count unique combinations.

### 4. Excluding NAs

```r title="Skip NAs in the count"
x <- c("a", "b", NA, "a", NA)
n_distinct(x, na.rm = TRUE)
#> [1] 2

n_distinct(x, na.rm = FALSE)
#> [1] 3   (NA counted as one of the distinct values)
```

### 5. Inside mutate (per-group)

```r title="Add unique count column"
mtcars |>
  group_by(cyl) |>
  mutate(n_gear = n_distinct(gear))
#> Each row gets the count of unique gear in its cyl group
```

[KEY INSIGHT]
**`n_distinct()` differs from `n()`: it counts UNIQUE values, not ROWS.** `n()` returns the group size; `n_distinct(col)` returns how many distinct values appear in that column. Easy to confuse but very different semantics.

## n_distinct() vs length(unique()) vs distinct() vs n()

**Four ways to handle "uniqueness" questions in dplyr / R.**

| Function | Returns | Best for |
|---|---|---|
| `n_distinct(x)` | Integer count | Quick count, dplyr summarise |
| `length(unique(x))` | Integer count | Base R, equivalent but slower |
| `dplyr::distinct(df, col)` | Filtered tibble | "Show me the unique rows" |
| `unique(x)` | Vector of unique values | Inspect what those values are |
| `n()` | Group size (row count) | Different question |

When to use which:

- `n_distinct(x)` inside summarise/mutate.
- `length(unique(x))` for base R; same result, slightly slower.
- `distinct(df, col)` to keep one row per unique value.
- `unique(x)` to see the actual unique values.

## A practical workflow

**The "audit" pattern is the most common n_distinct use case in summary tables.**

```r title="Dataset audit"
df |>
  summarise(
    rows         = n(),
    unique_users = n_distinct(user_id),
    unique_items = n_distinct(item_id),
    avg_qty      = mean(qty),
    .groups      = "drop"
  )
```

A first-pass dataset audit: how many rows, how many unique users, how many unique items. Tells you the table's shape at a glance.

For per-group audits:

```r title="Daily session and unique-user counts"
df |>
  group_by(date) |>
  summarise(
    sessions       = n(),
    unique_users   = n_distinct(user_id),
    .groups        = "drop"
  )
```

Daily session and unique-user counts.

## Common pitfalls

**Pitfall 1: NA counted as distinct.** Default `na.rm = FALSE` includes NA in the count. `n_distinct(c(1, NA, 1))` returns 2 (1 and NA). Add `na.rm = TRUE` to exclude.

**Pitfall 2: passing multiple cols treats them as combinations.** `n_distinct(x, y)` counts unique (x, y) PAIRS, not unique values in either. To count separately, call twice.

[WARNING]
**`n_distinct()` is faster than `length(unique(x))` but they CAN differ on edge cases.** With factors and NA handling, results may vary. Pick one in a project and stick with it for consistency.

## Performance note

**For very large data, `n_distinct()` is faster than `length(unique(x))` thanks to a hash-based implementation.** On vectors with millions of elements the difference can be 2-10x. For everyday data sizes (thousands to hundreds of thousands of rows) both functions feel instant, so pick by readability and consistency. Inside dplyr pipelines, n_distinct is the idiomatic choice. For data.table users, `uniqueN()` plays the same role with similar performance. The underlying algorithm uses a hash set internally rather than building the full unique vector, which is what saves memory and time on big inputs.

## Try it yourself

**Try it:** For each `cyl` group in mtcars, count the unique number of gears AND the unique number of carburetors. Save to `ex_uniq`.

```r title="Your turn: 2 unique-counts per group"
ex_uniq <- mtcars |>
  # your code here

ex_uniq
#> Expected: 3 rows (one per cyl) with n_gear and n_carb columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_uniq <- mtcars |>
  group_by(cyl) |>
  summarise(
    n_gear = n_distinct(gear),
    n_carb = n_distinct(carb),
    .groups = "drop"
  )

ex_uniq
#> # A tibble: 3 x 3
#>     cyl n_gear n_carb
#>     4      3      2
#>     6      3      4
#>     8      2      4
```

**Explanation:** `n_distinct(gear)` counts unique gear values per cyl. Same for carb. Two summary stats per group.

</details>

## Related dplyr functions

After mastering n_distinct, look at:

- `n()`: row count of current group
- `count(df, g)`: count rows per group
- `distinct(df, col)`: keep one row per unique value
- `unique(x)`: base R; show the unique values
- `summarise()`: standard aggregation context
- `group_by()`: per-group n_distinct

For "show me the actual unique rows", `distinct(df, col, .keep_all = TRUE)` is the cleaner tool.

## FAQ

**What does n_distinct do in dplyr?**

`n_distinct(x)` returns the count of unique values in x as an integer. Faster than `length(unique(x))` and integrates with summarise / mutate.

**What is the difference between n_distinct and length(unique())?**

Both return the same count. n_distinct is faster (hash-based) and is the dplyr-native idiom. length(unique()) is base R; works anywhere.

**How do I exclude NAs from n_distinct?**

Pass `na.rm = TRUE`: `n_distinct(x, na.rm = TRUE)`. Default counts NA as one of the distinct values.

**How do I count unique combinations of multiple columns?**

`n_distinct(x, y, z)` counts unique tuples across the three vectors. Pass each column as a separate argument.

**Is n_distinct different from n() in dplyr?**

Yes. `n()` counts ROWS in the current group. `n_distinct(col)` counts UNIQUE values in a column. Different questions.
