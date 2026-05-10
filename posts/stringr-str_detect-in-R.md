---
title: "stringr str_detect() in R: Find Pattern in Strings"
slug: "stringr-str_detect-in-R"
description: "Use stringr str_detect() to find a regex pattern in strings in R. Covers fixed match, case-insensitive, negate, vectorized use, and 5 worked examples."
keywords: "str_detect, stringr str_detect, R pattern detect, regex match in R, str_detect examples, stringr grepl alternative"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "str_detect()|stringr str_detect|stringr::str_detect()|regex match|pattern match"
auto_link_case_sensitive: true
target_keyword: "stringr str_detect"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_detect() in R: Find Pattern in Strings

<p class="lead">The <code>str_detect()</code> function in stringr returns TRUE or FALSE for each string indicating whether a pattern was found. It is the modern, vectorized replacement for base R <code>grepl()</code>.</p>

[QUICK ANSWER]
str_detect(x, "pattern")                            # regex (default)
str_detect(x, fixed("text"))                        # literal match
str_detect(x, regex("pattern", ignore_case = TRUE)) # case-insensitive
str_detect(x, "pattern", negate = TRUE)             # opposite (not match)
str_detect(c("apple","banana"), "an")               # vectorized
sum(str_detect(x, "pattern"))                       # count matches
filter(df, str_detect(name, "Smith"))               # use in dplyr filter

[DECISION TREE: Is str_detect() the right tool?]
- check pattern presence (TRUE/FALSE per string): str_detect()
- find match position: str_locate()
- extract matched substring: str_extract()
- count matches per string: str_count()
- replace matches: str_replace() / str_replace_all()
- match exact whole string: str_detect with anchors ^ and $
- case-insensitive: regex(pattern, ignore_case = TRUE)

## What str_detect() does in one sentence

**`str_detect(string, pattern)` returns a logical vector of the same length as `string`, with TRUE where the pattern matches and FALSE elsewhere.** The pattern is a regular expression by default; wrap with `fixed()` for literal string matching.

It is the workhorse for filtering data frames by string conditions, validating user input, and pre-processing text data.

## Syntax

**`str_detect(string, pattern, negate = FALSE)`. Pattern is regex; use modifiers for fixed or case-insensitive.**

```r title="Load stringr and test pattern"
library(stringr)

library(tibble)
x <- c("apple", "banana", "cherry", "Date")

str_detect(x, "an")
#> [1]  TRUE  TRUE FALSE FALSE
```

[TIP]
**Default pattern is REGEX, so special characters need escaping.** To match a literal `.`, use `fixed(".")` or `\\.`. To match a literal `(`, use `\\(`. The `fixed()` modifier is the simplest way to skip regex parsing entirely.

## Five common patterns

### 1. Basic regex detection

```r title="Does each string contain 'an'?"
str_detect(c("apple","banana","cherry"), "an")
#> [1]  TRUE  TRUE FALSE
```

### 2. Literal (non-regex) match

```r title="Match a literal dot"
str_detect(c("a.b", "ab", "a-b"), fixed("."))
#> [1]  TRUE FALSE FALSE
```

`fixed("text")` treats text literally. Without `fixed`, `.` is regex for "any character".

### 3. Case-insensitive match

```r title="Find 'apple' or 'Apple' or 'APPLE'"
str_detect(c("apple","Apple","Banana"), regex("apple", ignore_case = TRUE))
#> [1]  TRUE  TRUE FALSE
```

`regex(pattern, ignore_case = TRUE)` is the case-insensitive variant.

### 4. Negate (find non-matches)

```r title="Strings NOT containing 'an'"
str_detect(c("apple","banana","cherry"), "an", negate = TRUE)
#> [1] FALSE FALSE  TRUE
```

`negate = TRUE` flips the result. Equivalent to `!str_detect(...)`.

### 5. Use in dplyr filter

```r title="Filter rows by string pattern"
library(dplyr)
df <- tibble::tibble(name = c("Alice Smith","Bob Jones","Carol Smith"))

df |> filter(str_detect(name, "Smith"))
#> # A tibble: 2 x 1
#>   name
#>   <chr>
#> 1 Alice Smith
#> 2 Carol Smith
```

`str_detect()` returns a logical vector, perfect for `filter()`.

[KEY INSIGHT]
**`str_detect()` and `grepl()` produce the same results for simple patterns.** stringr is more consistent (always returns the same length as input, NA in produces NA out) and reads cleaner in pipelines. For large vectors, performance is similar.

## Common pitfalls

**Pitfall 1: regex special chars treated literally.** `str_detect(x, "1.5")` matches "1a5", "1b5", etc., not just "1.5". Use `fixed("1.5")` or escape: `"1\\.5"`.

**Pitfall 2: NA propagation.** `str_detect(NA, "x")` returns NA, not FALSE. Filter with `!is.na(x) & str_detect(...)` to drop NAs cleanly.

[WARNING]
**Anchors `^` and `$` match start/end of EACH STRING, not start/end of vector.** `str_detect(c("apple","banana"), "^a")` returns `c(TRUE, FALSE)`. To match whole strings exactly, use `^pattern$`.

## Try it yourself

**Try it:** Filter `iris$Species` (as a character vector) to rows where the species name contains "color". Save to `ex_match`.

```r title="Your turn: detect species with 'color'"
species <- as.character(iris$Species)

ex_match <- # your code here

unique(ex_match)
#> Expected: "versicolor"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
species <- as.character(iris$Species)
ex_match <- species[str_detect(species, "color")]
unique(ex_match)
#> [1] "versicolor"
```

**Explanation:** `str_detect(species, "color")` returns TRUE for species containing "color" anywhere. `species[...]` subsets to those entries. Only "versicolor" matches.

</details>

## Related stringr functions

After mastering str_detect, look at:

- `str_extract()`: pull out the matched substring
- `str_replace()`: replace matched pattern
- `str_count()`: count matches per string
- `str_locate()`: find position of match
- `str_subset()`: return matching strings (filter + extract in one)
- `grepl()`: base R equivalent

For complex patterns, the `regex()`, `fixed()`, `coll()`, and `boundary()` modifier functions in stringr give precise control over match behavior.

## FAQ

**How do I check if a string contains a pattern in R?**

Use `stringr::str_detect(string, "pattern")`. Returns TRUE/FALSE per string. The pattern is a regex by default; wrap with `fixed()` for literal match.

**What is the difference between str_detect and grepl in R?**

Both return logical vectors. `str_detect()` is more consistent (NA in -> NA out, predictable lengths). `grepl()` is base R, no package needed. Choose stringr for tidyverse code; grepl for zero dependencies.

**How do I do a case-insensitive str_detect in R?**

Wrap the pattern in `regex(pattern, ignore_case = TRUE)`: `str_detect(x, regex("apple", ignore_case = TRUE))`.

**How do I check if a string starts with a substring in R?**

Use anchor `^`: `str_detect(x, "^apple")` returns TRUE for strings starting with "apple". Or use `str_starts(x, "apple")` for a clearer intent.

**How do I count strings matching a pattern?**

`sum(str_detect(x, "pattern"))` counts how many of the strings match. To count matches WITHIN each string, use `str_count(x, "pattern")` instead.
