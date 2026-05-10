---
title: "tidyr separate() in R: Split One Column Into Many"
slug: "tidyr-separate-in-R"
description: "Use tidyr separate() and separate_wider_delim() to split a single column into multiple columns in R. Covers sep, regex, fill, NA, and 5 worked examples."
keywords: "tidyr separate, R split column, separate_wider_delim, separate column R, tidyr sep, separate into, R extract substring column"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "separate()|tidyr separate|separate_wider_delim()|split column|extract substring"
auto_link_case_sensitive: true
target_keyword: "tidyr separate"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr separate() in R: Split One Column Into Many

<p class="lead">The <code>separate()</code> function in tidyr splits a column into multiple columns by a delimiter or regex. Modern alternatives <code>separate_wider_delim()</code> and <code>separate_wider_regex()</code> are stricter and recommended for new code.</p>

[QUICK ANSWER]
separate(df, col = name, into = c("first","last"), sep = " ")
separate(df, col = date, into = c("y","m","d"), sep = "-", convert = TRUE)
separate_wider_delim(df, cols = name, delim = " ", names = c("first","last"))
separate_wider_regex(df, cols = code, patterns = c(letter="[A-Z]+", digit="[0-9]+"))
separate(df, col = ..., extra = "merge")            # too many pieces -> last gets rest
separate(df, col = ..., fill = "right")             # too few pieces -> NA on right
unite(df, "full", first, last, sep = " ")           # opposite of separate

[DECISION TREE: Is separate() the right tool?]
- split by simple delimiter: separate() or separate_wider_delim()
- split by regex pattern: separate_wider_regex()
- split into ROWS not cols: separate_longer_delim()
- combine multiple cols into one: unite()
- only need part of a string: str_extract() or str_sub()
- string with optional parts: separate_wider_regex (more flexible)
- date string: lubridate::ymd() or readr::parse_date()

## What separate() does in one sentence

**`separate()` takes one column and splits it into N columns based on a delimiter or position.** Each input row produces one output row; only the column structure changes.

For new code, prefer `separate_wider_delim()` and `separate_wider_regex()`. They are stricter (you must specify exactly how many pieces to expect) and produce clearer errors when the data does not match the expected pattern.

## Syntax

**`separate(data, col, into, sep)` is the basic form.** `col` is the column to split; `into` is a vector of new column names; `sep` is the delimiter (default: any non-alphanumeric).

```r title="Build a sample column to split"
library(tidyr)

df <- tibble::tibble(
  id = 1:3,
  name = c("Alice Smith", "Bob Jones", "Carol Davis")
)

df |> separate(col = name, into = c("first", "last"), sep = " ")
#> # A tibble: 3 x 3
#>      id first last
#>   <int> <chr> <chr>
#> 1     1 Alice Smith
#> 2     2 Bob   Jones
#> 3     3 Carol Davis
```

[TIP]
**Use `separate_wider_delim()` for new code.** It is stricter and gives clearer errors than the legacy `separate()`. The legacy form silently truncates or pads when the number of pieces does not match `into`.

## Five common patterns

### 1. Split by simple delimiter

```r title="Split full name into first and last"
df <- tibble::tibble(name = c("Alice Smith", "Bob Jones"))
df |> separate(name, into = c("first", "last"), sep = " ")
#> # A tibble: 2 x 2
#>   first last
#>   <chr> <chr>
#> 1 Alice Smith
#> 2 Bob   Jones
```

`sep = " "` splits on space. The two pieces become `first` and `last`.

### 2. Convert types automatically

```r title="Split a date and coerce to numeric"
df <- tibble::tibble(date = c("2024-01-15", "2024-03-20"))
df |> separate(date, into = c("y","m","d"), sep = "-", convert = TRUE)
#> # A tibble: 2 x 3
#>       y     m     d
#>   <int> <int> <int>
#> 1  2024     1    15
#> 2  2024     3    20
```

`convert = TRUE` runs `type.convert()` on each new column, so numeric strings become numeric.

### 3. Modern strict form

```r title="separate_wider_delim is stricter"
df <- tibble::tibble(name = c("Alice Smith", "Bob Jones"))
df |> separate_wider_delim(cols = name, delim = " ", names = c("first", "last"))
#> # A tibble: 2 x 2
#>   first last
#>   <chr> <chr>
#> 1 Alice Smith
#> 2 Bob   Jones
```

`separate_wider_delim()` errors if any row has a different number of pieces. The strictness catches data quality issues that `separate()` would silently fix.

### 4. Handle uneven splits

```r title="Some rows have more pieces than others"
df <- tibble::tibble(x = c("a-b-c", "a-b", "a-b-c-d"))

df |> separate(x, into = c("p1","p2","p3"), sep = "-",
                extra = "merge", fill = "right")
#> # A tibble: 3 x 3
#>   p1    p2    p3
#>   <chr> <chr> <chr>
#> 1 a     b     c
#> 2 a     b     NA
#> 3 a     b     c-d
```

`extra = "merge"` keeps extra pieces in the last column. `fill = "right"` pads NAs on the right when too few pieces. Together they handle messy data without errors.

### 5. Regex-based split

```r title="Use a regex to extract typed parts"
df <- tibble::tibble(code = c("A123", "B456", "AB12"))

df |> separate_wider_regex(cols = code,
                            patterns = c(letter = "[A-Z]+", digit = "[0-9]+"))
#> # A tibble: 3 x 2
#>   letter digit
#>   <chr>  <chr>
#> 1 A      123
#> 2 B      456
#> 3 AB     12
```

`separate_wider_regex()` lets you name pieces by REGEX PATTERN, not delimiter. Useful when boundaries are between TYPES (letter vs digit) rather than fixed delimiters.

[KEY INSIGHT]
**`separate()` is being superseded by `separate_wider_delim()`, `separate_wider_position()`, and `separate_wider_regex()` in tidyr 1.3+.** The newer functions are stricter and error early on bad data. For new code, prefer them; legacy `separate()` is still in tidyr for backward compatibility.

## Common pitfalls

**Pitfall 1: silent truncation in legacy separate.** With `sep = " "` and a name like "Mary Jane Smith", legacy separate truncates to first/last, dropping "Jane" silently. Use `extra = "merge"` or switch to `separate_wider_delim()` for explicit handling.

**Pitfall 2: regex special chars in `sep`.** `sep` is interpreted as a regex by default. To split on a literal `.`, escape: `sep = "\\."`. Or use `separate_wider_delim()` which treats `delim` as a literal string.

[WARNING]
**`separate()` produces a warning when rows have different numbers of pieces.** Pay attention to it. Without `extra` and `fill` arguments, the function picks defaults that may silently corrupt data.

## Try it yourself

**Try it:** Split the column "version" containing strings like "v1.2.3" into three columns: major, minor, patch. Save to `ex_split`.

```r title="Your turn: split version strings"
df <- tibble::tibble(version = c("v1.2.3", "v2.0.1", "v3.4.0"))

ex_split <- df |>
  # your code here

ex_split
#> Expected: 3 rows, 3 cols (major, minor, patch)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_split <- df |>
  tidyr::separate_wider_regex(
    cols = version,
    patterns = c("v", major = "[0-9]+", "\\.", minor = "[0-9]+", "\\.", patch = "[0-9]+")
  )

ex_split
#> # A tibble: 3 x 3
#>   major minor patch
#>   <chr> <chr> <chr>
#> 1 1     2     3
#> 2 2     0     1
#> 3 3     4     0
```

**Explanation:** Unnamed patterns ("v", "\\.") match but get DROPPED. Named patterns become columns. Regex `[0-9]+` captures one or more digits. Each row must match the pattern exactly.

</details>

## Related tidyr functions

After mastering separate, look at:

- `unite()`: combine columns into one (inverse of separate)
- `separate_wider_position()`: split by character position, not delimiter
- `separate_longer_delim()`: split into rows instead of columns
- `extract()`: regex-based column extraction
- `pivot_longer()` plus `separate()`: combine reshaping with splitting

For pure string operations on a single column, `stringr::str_split()` returns a list-column you can `unnest()`.

## FAQ

**How do I split a column into multiple columns in R?**

Use `tidyr::separate(df, col, into = c(...), sep = ...)` for the legacy form. For new code, prefer `separate_wider_delim(df, cols, delim = "...", names = c(...))`. Both split one column based on a delimiter.

**What is the difference between separate and separate_wider_delim?**

`separate()` is the legacy function. `separate_wider_delim()` (tidyr 1.3+) is stricter: it errors when row pieces do not match the expected count, while `separate()` silently truncates or pads. Prefer the modern one for new code.

**How do I split a column using a regex in R?**

Use `separate_wider_regex(cols, patterns = c(name = "regex", ...))`. Each named pattern becomes a new column; unnamed patterns match but are dropped.

**How do I handle missing pieces with separate?**

Use `fill = "right"` (pads NA on the right) or `fill = "left"` (pads on the left). For too many pieces, `extra = "merge"` puts extras in the last column; `extra = "drop"` discards them.

**What does the convert argument do in separate?**

`convert = TRUE` runs `type.convert()` on the new columns, converting numeric strings to numbers, etc. Without it, all output columns are character.
