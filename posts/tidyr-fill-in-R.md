---
title: "tidyr fill() in R: Forward-Fill Missing Values"
slug: "tidyr-fill-in-R"
description: "Use tidyr fill() to fill NA values from above (or below) in a column in R. Covers .direction, multiple columns, per-group, and 5 worked examples."
keywords: "tidyr fill, R forward fill NA, tidyr fill direction, fill missing values R, last observation carried forward, tidyr fill_down"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::fill()|tidyr fill|forward fill NA|fill missing values|LOCF tidyr"
auto_link_case_sensitive: true
target_keyword: "tidyr fill"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr fill() in R: Forward-Fill Missing Values

<p class="lead">The <code>fill()</code> function in tidyr fills NA values in a column with the most recent non-NA value above (or below). It is the "last observation carried forward" (LOCF) operation, common in time-series data.</p>

[QUICK ANSWER]
df |> fill(col)                              # forward-fill (default down)
df |> fill(col, .direction = "up")           # backward-fill
df |> fill(col, .direction = "downup")       # both directions
df |> fill(c(col1, col2))                    # multiple columns
df |> group_by(g) |> fill(col)               # per-group fill

[DECISION TREE: Is fill() the right tool?]
- forward-fill NA (LOCF): fill(col)
- backward-fill: fill(col, .direction = "up")
- per-group fill: group_by + fill
- replace NA with constant: tidyr::replace_na()
- replace specific value with NA: dplyr::na_if()
- fill missing combinations: tidyr::complete()

## What fill() does in one sentence

**`fill(data, ..., .direction = "down")` replaces NAs in the named columns with the most recent NON-NA value above (or below).** Default direction is "down" (top to bottom).

The classic use case: time-series with sparse observations where each NA should inherit the previous value.

## Syntax

**`fill(data, ..., .direction = c("down","up","downup","updown"))`. `...` is the columns to fill.**

```r title="Forward-fill missing values"
library(tidyr)
library(dplyr)

df <- tibble(id = 1:6, status = c("a", NA, NA, "b", NA, "c"))

df |>
  fill(status)
#>   id status
#> 1  1 a
#> 2  2 a   <-- filled from row 1
#> 3  3 a
#> 4  4 b
#> 5  5 b   <-- filled from row 4
#> 6  6 c
```

[TIP]
**Use fill for time-series carrying-forward and for spreadsheet-style "category headers" that span multiple rows.** Common in Excel data where the category is only printed once per group.

## Five common patterns

### 1. Forward fill (default)

```r title="Down: each NA inherits previous value"
df |> fill(status)
```

### 2. Backward fill

```r title="Up: each NA inherits NEXT value"
df |> fill(status, .direction = "up")
```

### 3. Both directions

```r title="Fill from above, then any leading NAs from below"
df |> fill(status, .direction = "downup")
#> First fills down; then any remaining NAs filled up.
```

### 4. Multiple columns

```r title="Fill several at once"
df |>
  fill(col1, col2, col3)
```

### 5. Per-group

```r title="Fill within each group"
df |>
  group_by(user) |>
  fill(status) |>
  ungroup()
```

Crucial for time-series with multiple subjects: fill should reset at each user boundary.

[KEY INSIGHT]
**`fill()` is the tidyverse name for LOCF (last observation carried forward).** Common in time-series, sensor data, and "spreadsheet category headers" that span multiple rows. For per-subject time-series, ALWAYS group_by before fill.

## fill() vs replace_na() vs coalesce()

**Three NA-handling functions in tidyr/dplyr.**

| Function | Behavior | Best for |
|---|---|---|
| `tidyr::fill()` | Carry forward / backward | Time-series LOCF |
| `tidyr::replace_na()` | Replace NA with constant | Default value |
| `dplyr::coalesce()` | First non-NA across columns | Multi-source fallback |
| `dplyr::na_if()` | Replace specific value with NA | Sentinel cleanup |

When to use which:

- fill for sequential / time-series fill.
- replace_na for "if NA then X" (constant).
- coalesce for multi-source fallback.
- na_if for sentinel values.

## A practical workflow

**The "carry forward state" pattern is fill's main use.**

```r
events |>
  arrange(user, timestamp) |>
  group_by(user) |>
  fill(state) |>
  ungroup()
```

Per user, in chronological order, NA states inherit the previous known state. Without fill, state changes appear as NA between events.

For monthly reporting where the category column is only on the first row of each group:

```r
sales |>
  fill(category) |>
  group_by(category) |>
  summarise(total = sum(amount))
```

## Common pitfalls

**Pitfall 1: fill across group boundaries.** Without group_by, fill carries forward ACROSS groups. Always group_by before fill on grouped data.

**Pitfall 2: leading NAs.** Default direction "down" can't fill the first row if it's NA. Use ".direction = "downup"" to handle leading NAs.

[WARNING]
**`fill()` does NOT verify whether filling makes semantic sense.** Carrying forward a stale value may be wrong if the data is "truly missing" (not "same as previous"). Validate with domain knowledge.

## Try it yourself

**Try it:** Forward-fill the `name` column in a sparse dataset, grouped by user. Save to `ex_filled`.

```r title="Your turn: per-user forward fill"
df <- tibble(
  user = c("a","a","a","b","b"),
  step = 1:5,
  name = c("Alice", NA, NA, "Bob", NA)
)

ex_filled <- df |>
  # your code here

ex_filled
#> Expected: name filled within each user
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_filled <- df |>
  group_by(user) |>
  fill(name) |>
  ungroup()

ex_filled
#>   user step name
#> 1 a     1   Alice
#> 2 a     2   Alice
#> 3 a     3   Alice
#> 4 b     4   Bob
#> 5 b     5   Bob
```

**Explanation:** group_by ensures fill resets at each user boundary; name is carried forward within each user.

</details>

## Related tidyr / dplyr functions

After mastering fill, look at:

- `tidyr::replace_na()`: replace NA with constant
- `dplyr::coalesce()`: multi-source NA fill
- `tidyr::complete()`: fill missing row combinations
- `dplyr::lag()` / `lead()`: row-shift comparisons
- `dplyr::case_when()`: conditional fill logic

For Excel-style "merged cell" data, fill is the standard import-cleanup tool.

## FAQ

**What does fill do in tidyr?**

`fill(data, col)` replaces NA values in `col` with the most recent non-NA value above (default direction "down"). Used for last-observation-carried-forward (LOCF) imputation.

**How do I fill NAs from below in tidyr?**

Pass `.direction = "up"`: `fill(df, col, .direction = "up")`. Each NA inherits the next non-NA value.

**Should I fill before or after group_by?**

After. `group_by(g) |> fill(col)` fills WITHIN each group. Without grouping, fill crosses boundaries.

**What is the difference between fill and replace_na?**

fill carries forward (or backward) the most recent non-NA value. replace_na uses a CONSTANT value. Different semantics for missing data.

**Does fill modify the data in place?**

No. It returns a new data frame. Always assign the result.
