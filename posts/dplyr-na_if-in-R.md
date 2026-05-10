---
title: "dplyr na_if() in R: Convert a Specific Value to NA"
slug: "dplyr-na_if-in-R"
description: "Use dplyr na_if() to convert specific sentinel values like -99 or empty strings to NA in R. Covers scalar and vector matching, vs replace_na, 5 examples."
keywords: "dplyr na_if, R convert to NA, na_if sentinel, replace value with NA, na_if vs replace_na, dplyr clean missing values"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "na_if()|dplyr na_if|convert to NA|sentinel value|replace value with NA"
auto_link_case_sensitive: true
target_keyword: "dplyr na_if"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr na_if() in R: Convert a Specific Value to NA

<p class="lead">The <code>na_if()</code> function in dplyr converts a specific sentinel value (like <code>-99</code>, <code>""</code>, or <code>"N/A"</code>) into proper <code>NA</code>. It is the inverse of <code>tidyr::replace_na()</code>.</p>

[QUICK ANSWER]
na_if(x, -99)                        # convert -99 to NA
na_if(x, "")                         # empty string to NA
na_if(x, "N/A")                      # text sentinel to NA
df |> mutate(across(where(is.numeric), ~ na_if(.x, -99)))
df |> mutate(name = na_if(name, ""))  # in mutate
tidyr::replace_na(x, 0)              # opposite: NA -> 0

[DECISION TREE: Is na_if() the right tool?]
- one specific sentinel value -> NA: na_if()
- multiple sentinels: case_when() or chain na_if calls
- NA -> something else: tidyr::replace_na()
- recode many values to NA: case_when(value %in% sentinels ~ NA, TRUE ~ value)
- empty string -> NA on character columns: na_if(x, "")
- specific NA -> first non-NA fallback: coalesce()

## What na_if() does in one sentence

**`na_if(x, y)` returns a vector identical to `x` except every element equal to `y` is replaced with `NA` of the appropriate type.** The two arguments must be the same type.

This is the standard tool for cleaning datasets that use sentinel values (`-99`, `999`, `""`, `"N/A"`) instead of true NA. Almost every real-world data cleaning pipeline calls it at least once.

## Syntax

**`na_if(x, y)`. y is a single value (scalar) of the same type as x.**

```r title="Convert -99 sentinels to NA"
library(dplyr)

x <- c(10, -99, 30, -99, 50)
na_if(x, -99)
#> [1] 10 NA 30 NA 50
```

[TIP]
**`na_if()` is most powerful inside `across()` for cleaning many columns at once.** `mutate(across(everything(), ~ na_if(.x, -99)))` cleans every column in one step.

## Five common patterns

### 1. Numeric sentinel

```r title="-99 means missing"
x <- c(10, -99, 30, -99, 50)
na_if(x, -99)
#> [1] 10 NA 30 NA 50
```

The most common cleanup pattern from legacy datasets.

### 2. Empty string to NA

```r title="Common in scraped or CSV data"
y <- c("alice", "", "bob", "")
na_if(y, "")
#> [1] "alice" NA      "bob"   NA
```

### 3. Text sentinel "N/A"

```r title="Convert text 'N/A' to actual NA"
codes <- c("A", "B", "N/A", "C", "N/A")
na_if(codes, "N/A")
#> [1] "A" "B" NA  "C" NA
```

### 4. Apply across many columns

```r title="Clean -99 from every numeric column"
df <- data.frame(a = c(1, -99, 3), b = c(-99, 5, 6), c = c(7, 8, -99))

df |>
  mutate(across(everything(), ~ na_if(.x, -99)))
#>    a  b  c
#> 1  1 NA  7
#> 2 NA  5  8
#> 3  3  6 NA
```

`across(everything(), ~ na_if(.x, -99))` cleans every column in one step.

### 5. Multiple sentinels via chaining

```r title="Two sentinels: -99 and -999"
x <- c(10, -99, 30, -999, 50)
x |>
  na_if(-99) |>
  na_if(-999)
#> [1] 10 NA 30 NA 50
```

For many sentinels, prefer `case_when` or a custom helper.

[KEY INSIGHT]
**`na_if(x, y)` and `tidyr::replace_na(x, y)` are inverses.** `na_if` converts a specific value to NA. `replace_na` converts NA to a specific value. Together they let you switch back and forth between sentinel and proper-NA representations.

## na_if() vs replace_na() vs case_when() vs base ifelse

**Four ways to handle missing values and sentinels in R.**

| Function | Direction | Best for |
|---|---|---|
| `na_if(x, y)` | value -> NA | One specific sentinel |
| `tidyr::replace_na(x, y)` | NA -> value | Convert NA to default |
| `case_when()` | many -> NA | Multiple sentinels |
| `if_else(x == y, NA, x)` | one -> NA, explicit | Equivalent of na_if |
| `coalesce(x, y)` | first-non-NA | Fallback chain |

When to use which:

- `na_if(x, y)` for one sentinel.
- `case_when` for multiple sentinels in one shot.
- `replace_na` for the inverse direction.
- `coalesce` to pick the first non-NA across multiple vectors.

## A practical workflow

**The standard "clean a CSV" pattern uses na_if + across to scrub sentinels.**

```r title="Clean numeric and character sentinels"
df |>
  mutate(across(where(is.numeric), ~ na_if(.x, -99))) |>
  mutate(across(where(is.character), ~ na_if(.x, "")))
```

This cleans `-99` from numeric columns and empty strings from character columns in two lines. Combined with `summarise(across(everything(), ~ sum(is.na(.x))))` for an NA-count audit, it makes data import auditable.

## Common pitfalls

**Pitfall 1: type mismatch.** `na_if(c(1, 2, 3), "1")` errors because `c(1, 2, 3)` is numeric but `"1"` is character. The two arguments must share a type.

**Pitfall 2: only ONE sentinel per call.** `na_if(x, c(-99, -999))` does NOT convert both. It treats the second as a recycling vector. Chain calls or use `case_when` for multiple sentinels.

[WARNING]
**`na_if(x, NA)` returns x unchanged.** NA does not equal NA, so the equality test fails. To recode NA to something else, use `replace_na` (the inverse) or `coalesce`.

## Why proper NAs matter

**Sentinel values like -99 or "" silently break statistical functions.** `mean(c(10, -99, 30))` returns -19.7, not 20: the -99 is treated as a real observation. Switching to NA fixes this AS LONG AS the function accepts `na.rm = TRUE`. Even better, NA propagation through arithmetic and comparison is well-defined (`NA + 1` is NA), whereas sentinel propagation through `-99 + 1 = -98` produces nonsense without warning. The first step of any data import should be: identify the sentinels, convert with `na_if`, then audit with `summarise(across(everything(), ~ sum(is.na(.x))))`. This makes downstream analysis trustworthy.

## Try it yourself

**Try it:** Replace every "" (empty string) and "missing" sentinel in vector `survey` with NA. Save to `ex_clean`.

```r title="Your turn: clean two sentinels"
survey <- c("yes", "", "no", "missing", "yes", "")

ex_clean <- # your code here

ex_clean
#> Expected: c("yes", NA, "no", NA, "yes", NA)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- survey |>
  na_if("") |>
  na_if("missing")

ex_clean
#> [1] "yes" NA    "no"  NA    "yes" NA

# Alternative with case_when:
ex_alt <- case_when(
  survey %in% c("", "missing") ~ NA_character_,
  TRUE ~ survey
)
```

**Explanation:** Chain two na_if calls, one per sentinel. case_when with `%in%` is cleaner for many sentinels.

</details>

## Related dplyr / tidyr functions

After mastering na_if, look at:

- `tidyr::replace_na()`: inverse direction (NA -> value)
- `dplyr::coalesce()`: first non-NA across vectors
- `dplyr::case_when()`: multi-condition mapping including NA
- `dplyr::case_match()`: switch-style value mapping
- `is.na()`: detect NA values
- `naniar::replace_with_na()`: tidyverse-extension; multi-sentinel cleaning

For multi-sentinel cleaning at scale, `naniar::replace_with_na_all()` accepts a vector of sentinels.

## FAQ

**What does na_if do in dplyr?**

`na_if(x, y)` returns x with every element equal to y replaced by NA. Used to convert sentinel values (-99, "", "N/A") to proper NA.

**How do I convert empty strings to NA in dplyr?**

`na_if(x, "")` for one column. For all character columns: `mutate(across(where(is.character), ~ na_if(.x, "")))`.

**What is the difference between na_if and replace_na?**

They are inverses. `na_if(x, y)` converts y to NA. `tidyr::replace_na(x, y)` converts NA to y. Use them together to switch between sentinel and proper-NA representations.

**Can na_if handle multiple sentinels at once?**

Not directly. Either chain calls (`na_if(x, -99) |> na_if(-999)`) or use `case_when(x %in% sentinels ~ NA, TRUE ~ x)` for one-shot multi-sentinel cleaning.

**Why didn't na_if(x, NA) work?**

Because `NA == NA` is `NA`, not TRUE. The equality test fails. To recode NA, use `replace_na` (NA -> value) or `coalesce` (NA -> fallback).
