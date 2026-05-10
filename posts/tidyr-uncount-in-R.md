---
title: "tidyr uncount() in R: Expand Frequency Counts Into Rows"
slug: "tidyr-uncount-in-R"
description: "Use tidyr uncount() to expand frequency-count rows into individual rows in R. Covers id, .remove, and 5 worked examples for opposite of count."
keywords: "tidyr uncount, R uncount frequency, uncount vs count, expand rows from count, tidyr uncount id"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::uncount()|tidyr uncount|expand frequency rows|uncount vs count|uncount id"
auto_link_case_sensitive: true
target_keyword: "tidyr uncount"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr uncount() in R: Expand Frequency Counts Into Rows

<p class="lead">The <code>uncount()</code> function in tidyr expands a data frame where one column holds frequency counts into one row per count unit. It is the opposite of <code>dplyr::count()</code>.</p>

[QUICK ANSWER]
df |> uncount(n)                    # repeat each row n times
df |> uncount(n, .remove = FALSE)   # keep the n column
df |> uncount(n, .id = "row_id")    # add row index
dplyr::count(df, ...)                # opposite operation

[DECISION TREE: Is uncount() the right tool?]
- expand frequency table to individual rows: uncount(n)
- one-row-per-event from a count: uncount(count)
- keep the original count column: .remove = FALSE
- add row id within each expansion: .id = "id"

## What uncount() does in one sentence

**`uncount(data, weights, .remove = TRUE, .id = NULL)` repeats each row of `data` `weights` times, expanding a frequency-count table into individual rows.** It reverses dplyr's `count()`.

## Syntax

**`uncount(data, weights, .remove = TRUE, .id = NULL)`. weights is the count column.**

```r title="Expand a frequency table"
library(tidyr)
library(dplyr)

freq <- tibble(
  product = c("X","Y","Z"),
  n       = c(3, 2, 1)
)

freq |>
  uncount(n)
#>   product
#> 1       X
#> 2       X
#> 3       X
#> 4       Y
#> 5       Y
#> 6       Z
```

[TIP]
**Use uncount when you have count-form data and need one-row-per-observation form.** Common after working with pre-aggregated data.

## Five common patterns

### 1. Standard expansion

```r title="Counts to rows"
freq |> uncount(n)
```

### 2. Keep original count

```r title=".remove = FALSE"
freq |> uncount(n, .remove = FALSE)
#> Each row repeated n times AND original n column kept
```

### 3. Add row index

```r title=".id assigns 1..n within each group"
freq |> uncount(n, .id = "instance")
#> Adds 'instance' column: 1, 2, 3 for first product; 1, 2 for second; etc.
```

### 4. After dplyr count

```r title="Round-trip"
df <- tibble(g = c("a","a","a","b","b"))

df |>
  count(g) |>
  uncount(n) |>
  identical(df)
```

### 5. Use to simulate / replicate

```r title="Multiply rows by a weight"
df <- tibble(item = c("X","Y"), wt = c(2, 3))
df |> uncount(wt)
#> X repeated 2 times, Y repeated 3 times
```

[KEY INSIGHT]
**`uncount` is dplyr `count`'s INVERSE.** count rolls rows into a frequency table; uncount expands a frequency table back into rows. Useful when downstream code needs row-per-event format.

## uncount() vs base rep() vs count()

| Function | Direction | Input |
|---|---|---|
| `uncount(data, n)` | Expand | Frequency table |
| `dplyr::count(data, g)` | Collapse | Row-per-event |
| `base::rep(x, times)` | Expand | Vector |

When to use which:

- uncount for data frame frequency expansion.
- count for row aggregation.
- rep for vector / non-data frame.

## A practical workflow

**Use uncount when bridging summary data to row-level analysis.**

```r
survey_summary |>
  uncount(respondent_count) |>
  mutate(id = row_number())
```

Each summary row expands to N rows; row_number adds a unique id.

## Common pitfalls

**Pitfall 1: confusing direction.** uncount EXPANDS; count COLLAPSES. They are opposites.

**Pitfall 2: zero or negative counts.** uncount with n = 0 produces no rows for that input. Negative weights error.

[WARNING]
**`uncount` can produce HUGE output.** A row with n = 1,000,000 expands to a million rows. Check sizes first.

## Try it yourself

**Try it:** Expand a frequency table of cars by gear count. Save to `ex_expanded`.

```r title="Your turn: expand gear frequencies"
freq <- mtcars |> count(gear, name = "n")

ex_expanded <- freq |>
  # your code here

nrow(ex_expanded)
#> Expected: 32 (matches original mtcars)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_expanded <- freq |> uncount(n)

nrow(ex_expanded)
#> [1] 32
```

**Explanation:** count produced (gear, n) rows; uncount(n) expands to 32 rows total.

</details>

## Related tidyr / dplyr functions

After mastering uncount, look at:

- `dplyr::count()`: opposite (collapse to frequency)
- `dplyr::add_count()`: count without collapsing
- `base::rep()`: vector replication
- `tidyr::complete()`: fill missing combinations

## FAQ

**What does uncount do in tidyr?**

`uncount(data, n)` repeats each row n times, expanding a frequency-count table into individual rows. Opposite of dplyr's count.

**What is the difference between uncount and count?**

count COLLAPSES rows into a frequency table. uncount EXPANDS a frequency table back into rows. Opposite operations.

**How do I keep the original count column?**

Pass `.remove = FALSE`. Each row is still repeated; the count column survives.

**How do I add an id within each expansion?**

Pass `.id = "instance"`. Adds a column with 1, 2, 3, ... per repetition.

**What if a count is 0?**

That row contributes 0 rows to the output. Negative weights error.
