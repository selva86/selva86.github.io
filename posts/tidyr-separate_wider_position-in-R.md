---
title: "tidyr separate_wider_position() in R: Split by Character Position"
slug: "tidyr-separate_wider_position-in-R"
description: "Use tidyr separate_wider_position() to split a string column at fixed character positions in R. Covers width, named widths, vs delim, 5 worked examples."
keywords: "tidyr separate_wider_position, R split column position, fixed-width parse R, separate_wider_position widths, tidyr 1.3"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "separate_wider_position()|tidyr separate_wider_position|fixed-width parse|split by character position"
auto_link_case_sensitive: true
target_keyword: "tidyr separate_wider_position"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr separate_wider_position() in R: Split by Character Position

<p class="lead">The <code>separate_wider_position()</code> function in tidyr 1.3 splits a string column into multiple columns based on FIXED CHARACTER POSITIONS. It is the right tool for fixed-width formats like dates without delimiters or coded IDs.</p>

[QUICK ANSWER]
df |> separate_wider_position(col, widths = c(year=4, month=2, day=2))
df |> separate_wider_position(col, widths = c(prefix=3, code=5, suffix=2))
df |> separate_wider_position(col, widths = c(year=4, NA, month=2)) # skip
df |> separate_wider_delim(col, delim = "-")  # different: delimiter-based
df |> separate_wider_regex(col, patterns = c(...)) # regex-based

[DECISION TREE: Is separate_wider_position() the right tool?]
- fixed character widths: separate_wider_position()
- delimiter between parts: separate_wider_delim()
- regex groups: separate_wider_regex()
- variable-position parsing: regex helpers (str_match)
- skip parts of the input: name = NA in widths

## What separate_wider_position() does in one sentence

**`separate_wider_position(data, cols, widths)` splits each value of `cols` at the cumulative positions defined by the named integer vector `widths`.** Each name becomes a new column with the corresponding number of characters.

## Syntax

**`separate_wider_position(data, cols, widths, too_few = "error", too_many = "error", cols_remove = TRUE)`. widths is a named integer vector.**

```r title="Parse YYYYMMDD"
library(tidyr)
library(dplyr)

df <- tibble(date_str = c("20240115","20240320"))

df |>
  separate_wider_position(date_str, widths = c(year=4, month=2, day=2))
#>   year month day
#>   2024 01    15
#>   2024 03    20
```

[TIP]
**Use named widths to label each segment.** Skip a segment by using `NA` as the name: `widths = c(year=4, NA, month=2)` skips 2 characters between year and month.

## Five common patterns

### 1. Date string

```r title="YYYYMMDD format"
df |>
  separate_wider_position(d, widths = c(year=4, month=2, day=2))
```

### 2. Code with prefix and suffix

```r title="Parse 'PRE12345AB'"
df <- tibble(code = c("PRE12345AB"))
df |>
  separate_wider_position(code, widths = c(prefix=3, num=5, suffix=2))
#>   prefix num   suffix
#>   PRE    12345 AB
```

### 3. Skip middle characters

```r title="Skip a separator character"
df <- tibble(x = c("AB-12-CD"))
df |>
  separate_wider_position(x, widths = c(a=2, NA, num=2, NA, b=2))
#>   a num b
#>   AB 12  CD
```

### 4. Handle short strings with too_few

```r title="Short rows tolerated"
df <- tibble(x = c("ABC123","XY"))
df |>
  separate_wider_position(x, widths = c(a=3, b=3), too_few = "align_start")
```

### 5. Combine with other tidy operations

```r title="Parse then transform"
df |>
  separate_wider_position(date_str, widths = c(year=4, month=2, day=2)) |>
  mutate(across(everything(), as.integer))
```

[KEY INSIGHT]
**Each width represents a CHARACTER COUNT, not a position.** `widths = c(a=3, b=2)` means "first 3 chars to a, next 2 chars to b". Cumulative positions: a is chars 1-3, b is chars 4-5.

## separate_wider_position() vs separate_wider_delim() vs str_sub

| Function | Splits by | Best for |
|---|---|---|
| `separate_wider_position()` | Character positions | Fixed-width formats |
| `separate_wider_delim()` | Delimiter | Variable-width parts |
| `separate_wider_regex()` | Regex groups | Pattern-based |
| `stringr::str_sub()` | Position substring | One column at a time |

When to use which:

- separate_wider_position for FIXED-WIDTH (dates, codes).
- separate_wider_delim for DELIMITED.
- separate_wider_regex for COMPLEX patterns.

## A practical workflow

**Use for fixed-width data formats common in legacy systems.**

```r
df |>
  separate_wider_position(
    transaction_id,
    widths = c(year=4, month=2, day=2, branch=3, seq=6)
  )
```

Parse a structured ID into its semantic components in one step.

## Common pitfalls

**Pitfall 1: forgetting to name widths.** Unnamed widths are dropped (treated as skip). Always name segments you want to keep.

**Pitfall 2: mismatched total width.** If widths sum to less than string length, extras are dropped silently. Use too_many = "error" to catch.

[WARNING]
**`separate_wider_position()` operates on CHARACTER counts, not BYTE counts.** For multi-byte UTF-8 strings, the count is by codepoint, not byte.

## Try it yourself

**Try it:** Split a 7-character ID like "A12-CD" into 3 named segments. Save to `ex_parsed`.

```r title="Your turn: parse fixed-width ID"
df <- tibble(id = c("A12-CD"))

ex_parsed <- df |>
  # your code here

names(ex_parsed)
#> Expected: c("letter", "num", "code")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_parsed <- df |>
  separate_wider_position(id, widths = c(letter=1, num=2, NA, code=2))

ex_parsed
#>   letter num code
#>   A      12  CD
```

**Explanation:** Skip the dash between num and code with `NA`.

</details>

## Related tidyr functions

After mastering separate_wider_position, look at:

- `separate_wider_delim()`: delimiter-based
- `separate_wider_regex()`: regex-based
- `separate_longer_delim()`: split into rows
- `unite()`: combine columns
- `stringr::str_sub()`: position-based substring

## FAQ

**What does separate_wider_position do in tidyr?**

Splits a string column into multiple columns based on character widths. Each width specifies how many characters go into each new column.

**How do I skip characters with separate_wider_position?**

Use `NA` as the name in widths: `widths = c(a=3, NA, b=2)` skips one character between a and b.

**What is the difference between separate_wider_position and separate_wider_delim?**

position uses fixed character counts; delim uses a delimiter. Use position for fixed-width (YYYYMMDD); delim for variable parts (a-b-c).

**Can I parse multi-byte UTF-8 with separate_wider_position?**

Yes. Counts are by codepoint, not byte.

**What happens if the string is shorter than the widths?**

By default it errors. Pass `too_few = "align_start"` to fill with NA, or `"align_end"` for right-alignment.
