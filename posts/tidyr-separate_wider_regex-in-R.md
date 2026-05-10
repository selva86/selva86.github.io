---
title: "tidyr separate_wider_regex() in R: Split Column by Regex"
slug: "tidyr-separate_wider_regex-in-R"
description: "Use tidyr separate_wider_regex() to split a string column into multiple columns using regex pattern groups in R. Covers patterns, NA, 5 worked examples."
keywords: "tidyr separate_wider_regex, R split column regex, separate_wider_regex pattern, regex extract columns, tidyr 1.3"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "separate_wider_regex()|tidyr separate_wider_regex|regex split columns|extract columns regex"
auto_link_case_sensitive: true
target_keyword: "tidyr separate_wider_regex"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr separate_wider_regex() in R: Split Column by Regex

<p class="lead">The <code>separate_wider_regex()</code> function in tidyr 1.3 splits a string column into multiple columns based on a sequence of REGEX PATTERNS. Each named pattern captures a part of the string into a new column.</p>

[QUICK ANSWER]
df |> separate_wider_regex(col, patterns = c(year="\\d{4}", "-", month="\\d{2}", "-", day="\\d{2}"))
df |> separate_wider_regex(col, patterns = c(letter="[A-Z]+", num="\\d+"))
df |> separate_wider_regex(col, patterns = c(name="[a-z]+", "@", domain="\\S+"))
df |> separate_wider_delim(col, delim = "-")  # simpler alternative
df |> separate_wider_position(col, widths = c(...)) # for fixed widths

[DECISION TREE: Is separate_wider_regex() the right tool?]
- complex regex pattern with named groups: separate_wider_regex()
- simple delimiter: separate_wider_delim() (cleaner)
- fixed widths: separate_wider_position()
- match anywhere with regex: stringr::str_match()
- skip characters between groups: unnamed string in patterns

## What separate_wider_regex() does in one sentence

**`separate_wider_regex(data, cols, patterns)` matches each value of `cols` against a CONCATENATED sequence of regex patterns; each named pattern becomes a new column.** Unnamed strings in patterns are skipped.

## Syntax

**`separate_wider_regex(data, cols, patterns, too_few = "error", cols_remove = TRUE)`. patterns is a NAMED character vector.**

```r title="Parse YYYY-MM-DD with regex"
library(tidyr)
library(dplyr)

df <- tibble(date_str = c("2024-01-15","2025-03-20"))

df |>
  separate_wider_regex(
    date_str,
    patterns = c(year = "\\d{4}", "-", month = "\\d{2}", "-", day = "\\d{2}")
  )
#>   year month day
#>   2024 01    15
#>   2025 03    20
```

[TIP]
**Unnamed elements in patterns (literal strings or unnamed regex) are MATCHED but not captured.** Use them as separators between named groups.

## Five common patterns

### 1. Letter prefix + number suffix

```r title="A123 -> letter='A', num='123'"
df <- tibble(code = c("A123","B45"))
df |>
  separate_wider_regex(code, patterns = c(letter = "[A-Z]+", num = "\\d+"))
```

### 2. Email address

```r title="user@domain"
df <- tibble(email = c("alice@example.com","bob@gmail.com"))
df |>
  separate_wider_regex(email, patterns = c(name = "[\\w.]+", "@", domain = "\\S+"))
```

### 3. Date with delimiter

```r title="Year-Month-Day"
df |>
  separate_wider_regex(
    date_str,
    patterns = c(year = "\\d{4}", "-", month = "\\d{2}", "-", day = "\\d{2}")
  )
```

### 4. Skip parts of input

```r title="Match 'ID:123' but extract only number"
df <- tibble(s = c("ID:123","ID:456"))
df |>
  separate_wider_regex(s, patterns = c("ID:", id = "\\d+"))
#>   id
#>   123
#>   456
```

### 5. Multi-step regex parse

```r title="Complex token format"
df <- tibble(token = c("v2.5.1-beta","v3.0.0-alpha"))
df |>
  separate_wider_regex(
    token,
    patterns = c("v", major = "\\d+", "\\.", minor = "\\d+", "\\.", patch = "\\d+", "-", tag = "\\w+")
  )
```

[KEY INSIGHT]
**`separate_wider_regex` is the regex sister of separate_wider_delim and separate_wider_position.** Use regex when patterns are complex (e.g., variable-length parts, alternation). For simple delim or position, use the simpler functions.

## separate_wider_regex() vs str_match() vs separate_wider_delim()

| Function | Output | Best for |
|---|---|---|
| `separate_wider_regex()` | Multi-column tibble | Structured regex parsing |
| `stringr::str_match()` | Matrix of capture groups | One-off vector extraction |
| `separate_wider_delim()` | Multi-column tibble | Simple delimiter |
| `separate_wider_position()` | Multi-column tibble | Fixed widths |

When to use which:

- regex for complex patterns.
- delim for simple delimiters.
- position for fixed widths.
- str_match for one-time extraction outside dplyr.

## A practical workflow

**Use separate_wider_regex when input has STRUCTURE the simpler functions can't capture.**

```r
log_lines |>
  separate_wider_regex(
    raw,
    patterns = c(
      ts = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}",
      " \\[",
      level = "\\w+",
      "\\] ",
      msg = ".*"
    )
  )
```

Parse log entries into timestamp, level, and message in one step.

## Common pitfalls

**Pitfall 1: too_few = "error" by default.** If a row doesn't match the full pattern, it errors. Pass `too_few = "align_start"` for partial matches.

**Pitfall 2: greedy regex eating too much.** `pattern = ".*"` is greedy. Use `.*?` (non-greedy) or anchored alternatives.

[WARNING]
**`separate_wider_regex()` requires the FULL string to match the concatenated pattern.** Each character of the input must be consumed by some part of patterns. Use unnamed strings to "skip" segments.

## Try it yourself

**Try it:** Parse "v2.5.1" into major, minor, patch integer components. Save to `ex_ver`.

```r title="Your turn: parse semver"
df <- tibble(v = c("v2.5.1","v3.0.10"))

ex_ver <- df |>
  # your code here

ex_ver
#> Expected: 3 columns major, minor, patch
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ver <- df |>
  separate_wider_regex(
    v,
    patterns = c("v", major = "\\d+", "\\.", minor = "\\d+", "\\.", patch = "\\d+")
  )

ex_ver
#>   major minor patch
#>   2     5     1
#>   3     0     10
```

**Explanation:** Match "v" literally, then capture digits as major, minor, patch with literal dots between.

</details>

## Related tidyr functions

After mastering separate_wider_regex, look at:

- `separate_wider_delim()`: simpler delimiter
- `separate_wider_position()`: fixed widths
- `separate_longer_delim()`: split into rows
- `stringr::str_match()`: lower-level vector extraction
- `unite()`: combine columns

## FAQ

**What does separate_wider_regex do in tidyr?**

Splits a string column into multiple columns by matching a sequence of regex patterns. Named patterns become columns; unnamed are matched but discarded.

**What is the difference between separate_wider_regex and separate_wider_delim?**

regex uses regex patterns (more flexible). delim uses a literal delimiter (simpler). Use regex when the pattern is too complex for a single delimiter.

**Can I use separate_wider_regex with capture groups?**

Yes implicitly. The named patterns ARE the capture groups; the function generates the regex internally.

**What happens if my input doesn't fully match the pattern?**

Errors by default. Pass `too_few = "align_start"` to tolerate partial matches with NA fill.

**Does separate_wider_regex use Perl regex?**

Standard PCRE-compatible regex. Most regex syntax you know from elsewhere applies.
