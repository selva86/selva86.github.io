---
title: "tidyr separate_wider_delim() in R: Split Column by Delimiter Into Cols"
slug: "tidyr-separate_wider_delim-in-R"
description: "Use tidyr separate_wider_delim() to split one column into multiple columns by a delimiter in R. Covers names, too_few, too_many, and 5 worked examples."
keywords: "tidyr separate_wider_delim, R split column delimiter, separate_wider_delim names, separate vs separate_wider_delim, tidyr 1.3, R split column"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "separate_wider_delim()|tidyr separate_wider_delim|split column delimiter|separate columns wider"
auto_link_case_sensitive: true
target_keyword: "tidyr separate_wider_delim"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr separate_wider_delim() in R: Split Column by Delimiter Into Cols

<p class="lead">The <code>separate_wider_delim()</code> function in tidyr 1.3 splits one column into multiple columns based on a delimiter. It is the modern, type-safe replacement for the deprecated <code>separate()</code>.</p>

[QUICK ANSWER]
df |> separate_wider_delim(col, delim = "_", names = c("a","b","c"))
df |> separate_wider_delim(col, delim = ",", names_sep = "_")
df |> separate_wider_delim(col, delim = "-", names = c("y","m","d"), too_few = "align_start")
df |> separate_wider_delim(col, delim = "_", names = c("a","b"), too_many = "merge")
df |> tidyr::separate(col, into = c("a","b"), sep = "_") # superseded

[DECISION TREE: Is separate_wider_delim() the right tool?]
- split by delimiter into multiple columns: separate_wider_delim()
- split by character position: separate_wider_position()
- split by regex groups: separate_wider_regex()
- split into ROWS not columns: separate_longer_delim()
- old code with separate: works but superseded
- complex JSON-like nesting: tidyr::unnest_wider()

## What separate_wider_delim() does in one sentence

**`separate_wider_delim(data, cols, delim, names)` splits the values of `cols` by `delim` and puts the parts into NEW columns named in `names`.** Replaces the older `separate()` with type-safe column count handling.

## Syntax

**`separate_wider_delim(data, cols, delim, names = NULL, names_sep = NULL, too_few = "error", too_many = "error", cols_remove = TRUE)`.**

```r title="Split a date string"
library(tidyr)
library(dplyr)

df <- tibble(date_str = c("2024-01-15","2024-03-20"))

df |>
  separate_wider_delim(date_str, delim = "-", names = c("year","month","day"))
#>   year  month day
#>   2024  01    15
#>   2024  03    20
```

[TIP]
**`separate_wider_delim()` ERRORS by default if rows have too few or too many parts after splitting.** Pass `too_few = "align_start"` or `too_many = "merge"` to control this.

## Five common patterns

### 1. Standard split

```r title="ID into prefix-number"
df <- tibble(id = c("user_1","user_2","admin_3"))
df |>
  separate_wider_delim(id, delim = "_", names = c("role","num"))
```

### 2. Handle uneven splits with too_few

```r title="Some rows have fewer parts"
df <- tibble(x = c("a-b-c","d-e","f"))
df |>
  separate_wider_delim(x, delim = "-", names = c("p1","p2","p3"), too_few = "align_start")
#> Aligns to the LEFT, fills missing with NA
```

### 3. Merge extra parts

```r title="Some rows have too many parts"
df <- tibble(x = c("a-b","c-d-e"))
df |>
  separate_wider_delim(x, delim = "-", names = c("p1","p2"), too_many = "merge")
#> Merges extra parts into the last column
```

### 4. Auto-name with names_sep

```r title="Auto-generated names with prefix"
df |>
  separate_wider_delim(x, delim = ",", names_sep = "_")
#> Columns x_1, x_2, x_3, ...
```

### 5. Keep original column

```r title="cols_remove = FALSE"
df |>
  separate_wider_delim(x, delim = "-", names = c("a","b"), cols_remove = FALSE)
#> Both x AND a, b in result
```

[KEY INSIGHT]
**`separate_wider_delim()` is type-safe by default: too_few and too_many are explicit choices.** This is the main improvement over `separate()`, which silently produced inconsistent results.

## separate_wider_delim() vs separate() vs str_split

| Function | Output | Status |
|---|---|---|
| `separate_wider_delim()` | Multiple columns | Recommended (1.3+) |
| `separate_wider_position()` | Multi cols by position | Recommended |
| `separate_wider_regex()` | Multi cols by regex | Recommended |
| `tidyr::separate()` | Multiple columns | Superseded |
| `stringr::str_split()` | List of vectors | Manual workflow |

When to use which:

- separate_wider_delim for delimiter-based wider split.
- separate (old) only in legacy code.
- str_split for vector-level work outside data frames.

## A practical workflow

**Use separate_wider_delim for parsing structured strings into columns.**

```r
log_data |>
  separate_wider_delim(
    raw_message,
    delim = " | ",
    names = c("timestamp","level","module","msg"),
    too_many = "merge"
  )
```

Parse log entries into structured columns. too_many = "merge" handles cases where the message itself contains the delimiter.

## Common pitfalls

**Pitfall 1: too_few = "error" by default.** If any row has fewer parts than expected, separate_wider_delim errors. Switch to "align_start" or "align_end" to tolerate.

**Pitfall 2: forgetting names.** You must provide column names via `names` (or use `names_sep` for auto-naming).

[WARNING]
**`separate_wider_delim()` requires tidyr 1.3+ (Jan 2023).** Earlier versions only have the superseded `separate()`. Check version with `packageVersion("tidyr")`.

## Try it yourself

**Try it:** Split a `full_name` column into `first` and `last`. Save to `ex_split`.

```r title="Your turn: split full names"
df <- tibble(full_name = c("Alice Smith","Bob Jones","Carol Lee"))

ex_split <- df |>
  # your code here

ex_split
#> Expected: 3 rows with first and last columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_split <- df |>
  separate_wider_delim(full_name, delim = " ", names = c("first","last"))

ex_split
#>   first last
#> 1 Alice Smith
#> 2 Bob   Jones
#> 3 Carol Lee
```

**Explanation:** Split each full_name on " " into first and last columns.

</details>

## Related tidyr functions

After mastering separate_wider_delim, look at:

- `separate_wider_position()`: split by character position
- `separate_wider_regex()`: split by regex groups
- `separate_longer_delim()`: split into ROWS instead of columns
- `unite()`: opposite (combine columns into one)
- `tidyr::separate()`: superseded predecessor

## FAQ

**What does separate_wider_delim do in tidyr?**

It splits one column into multiple new columns based on a delimiter. Replaces the older `separate()` with type-safe handling of uneven splits.

**What is the difference between separate_wider_delim and separate?**

separate (old) is superseded. separate_wider_delim has explicit too_few / too_many handling, making errors visible instead of silent.

**How do I handle rows with different numbers of parts?**

Use `too_few = "align_start"` or `"align_end"` for fewer parts; `too_many = "merge"` to put extras in the last column. Without these, mismatch errors.

**Can I keep the original column?**

Yes. Pass `cols_remove = FALSE` to keep the input column alongside the new ones.

**What if my delimiter is a regex special character?**

Pass it as a literal string. separate_wider_delim treats `delim` as a literal substring, not regex.
