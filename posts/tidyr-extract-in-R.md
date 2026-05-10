---
title: "tidyr extract() in R: Extract Regex Capture Groups Into Cols"
slug: "tidyr-extract-in-R"
description: "Use tidyr extract() to extract regex capture groups from a column into multiple new columns in R. Covers vs separate_wider_regex, 5 worked examples."
keywords: "tidyr extract, R regex extract column, extract vs separate_wider_regex, tidyr capture groups, extract column R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tidyr::extract()|tidyr extract|regex extract column|extract capture groups|extract vs separate_wider_regex"
auto_link_case_sensitive: true
target_keyword: "tidyr extract"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# tidyr extract() in R: Extract Regex Capture Groups Into Cols

<p class="lead">The <code>extract()</code> function in tidyr extracts regex CAPTURE GROUPS from a string column into multiple new columns. It is similar to <code>separate_wider_regex()</code> but uses traditional capture-group syntax.</p>

[QUICK ANSWER]
df |> extract(col, into = c("year","month"), regex = "(\\d{4})-(\\d{2})")
df |> extract(col, c("a","b"), "([A-Z]+)(\\d+)")
df |> separate_wider_regex(col, ...)    # modern alternative
df |> stringr::str_match(col, ...)        # base-level extraction

[DECISION TREE: Is extract() the right tool?]
- regex with capture groups -> columns: extract()
- modern unified family: separate_wider_regex() (recommended)
- delimiter-based: separate_wider_delim()
- fixed widths: separate_wider_position()
- one-off vector extraction: stringr::str_match()

## What extract() does in one sentence

**`extract(data, col, into, regex, remove = TRUE, convert = FALSE)` extracts capture groups from a regex match into new columns named in `into`.** Older API; the newer `separate_wider_regex()` is preferred.

## Syntax

**`extract(data, col, into, regex = "([[:alnum:]]+)", remove = TRUE, convert = FALSE)`.**

```r title="Extract date components"
library(tidyr)
library(dplyr)

df <- tibble(date_str = c("2024-01-15","2024-03-20"))

df |>
  extract(date_str, into = c("year","month","day"),
          regex = "(\\d{4})-(\\d{2})-(\\d{2})")
#>   year month day
#> 1 2024  01    15
#> 2 2024  03    20
```

[TIP]
**`extract` is older and still works; `separate_wider_regex()` is the modern unified replacement.** Both extract regex capture groups; the latter has cleaner syntax.

## Five common patterns

### 1. Date with regex

```r title="YYYY-MM-DD"
df |>
  extract(date, c("y","m","d"), "(\\d{4})-(\\d{2})-(\\d{2})")
```

### 2. Letter prefix + number

```r title="A123 -> letter, num"
df <- tibble(code = c("A123","B45"))
df |>
  extract(code, c("letter","num"), "([A-Z]+)(\\d+)")
```

### 3. Convert types

```r title="convert = TRUE"
df |>
  extract(date, c("y","m","d"), "(\\d{4})-(\\d{2})-(\\d{2})", convert = TRUE)
#> y, m, d are integers
```

### 4. Modern alternative

```r title="separate_wider_regex equivalent"
df |>
  separate_wider_regex(
    date,
    patterns = c(year = "\\d{4}", "-", month = "\\d{2}", "-", day = "\\d{2}")
  )
```

### 5. Keep original column

```r title="remove = FALSE"
df |>
  extract(date, c("y","m","d"), "(\\d{4})-(\\d{2})-(\\d{2})", remove = FALSE)
```

[KEY INSIGHT]
**`extract` is the OLDER regex-based extractor; `separate_wider_regex` is the MODERN unified version.** Both work; for consistency with the separate_wider_* family, prefer the newer.

## extract() vs separate_wider_regex() vs str_match

| Function | API style | Best for |
|---|---|---|
| `extract()` | Older, capture-group syntax | Existing code |
| `separate_wider_regex()` | Modern, named patterns | New code |
| `stringr::str_match()` | Base extraction | Outside dplyr |

## A practical workflow

**Both extract and separate_wider_regex work; for new code use separate_wider_regex.**

```r
log_lines |>
  separate_wider_regex(
    msg,
    patterns = c(level = "\\w+", " ", time = "\\d+:\\d+:\\d+", " ", text = ".*")
  )
```

## Common pitfalls

**Pitfall 1: regex special characters.** `extract` uses regex by default. Escape literals: `\\.` for period.

**Pitfall 2: convert auto-detection.** `convert = TRUE` tries to convert types; this may surprise (e.g., "01" -> 1 not "01").

[WARNING]
**`extract()` is a soft-superseded function.** Existing uses are fine; new code should use `separate_wider_regex()` for consistency.

## Try it yourself

**Try it:** Extract version major and minor from "v2.5". Save to `ex_ver`.

```r title="Your turn: parse version"
df <- tibble(v = c("v2.5","v3.10"))

ex_ver <- df |>
  # your code here

ex_ver
#> Expected: 2 columns major, minor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ver <- df |>
  extract(v, c("major","minor"), "v(\\d+)\\.(\\d+)", convert = TRUE)

ex_ver
#>   major minor
#> 1     2     5
#> 2     3    10
```

**Explanation:** Capture groups extract the digits; convert turns them into integers.

</details>

## Related tidyr functions

After mastering extract, look at:

- `separate_wider_regex()`: modern equivalent
- `separate_wider_delim()`: delimiter-based
- `separate_wider_position()`: fixed widths
- `stringr::str_match()`: base extraction

## FAQ

**What does extract do in tidyr?**

`extract(data, col, into, regex)` extracts regex capture groups into new columns named in `into`.

**What is the difference between extract and separate_wider_regex?**

extract is older with capture-group syntax. separate_wider_regex is newer with named pattern syntax. Both extract regex; new code prefers separate_wider_regex.

**Should I use extract or separate_wider_regex in new code?**

separate_wider_regex. extract still works but is part of the older API.

**What does convert = TRUE do?**

Tries to convert each new column to its appropriate type (numeric, integer). May surprise with leading zeros.

**Can I keep the original column?**

Yes. Pass `remove = FALSE` to keep the source column alongside the extracted ones.
