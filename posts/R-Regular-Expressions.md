---
title: "R Regular Expressions: Pattern Matching with stringr (20 Examples)"
slug: "R-Regular-Expressions"
description: "Master regex in R with stringr: character classes, quantifiers, anchors, groups, lookaheads, and 20 practical pattern matching examples."
keywords: "R regex, regular expressions R, stringr regex, pattern matching R, regex examples R, grep R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-stri-1"
post_type: "FR"
auto_link_terms: "regular expressions|regex|pattern matching|regex in R"
auto_link_case_sensitive: false
fr_parent: "stringr-Tutorial.html"
---

# R Regular Expressions: Pattern Matching with stringr (20 Examples)

<p class="lead">Regular expressions (regex) are patterns that match text. In R, use them with <code>stringr</code> functions like <code>str_detect()</code>, <code>str_extract()</code>, and <code>str_replace()</code> to find, extract, and transform text.</p>

## Basic Patterns

```r
library(stringr)

x <- c("apple", "banana", "cherry", "date", "elderberry")

# Literal match
str_detect(x, "an")

# Any character (.)
str_extract(c("cat", "cot", "cut"), "c.t")

# Character class [...]
str_extract(c("cat", "bat", "hat", "mat"), "[cbh]at")
```

## Quantifiers

```r
library(stringr)

# ? = 0 or 1, * = 0 or more, + = 1 or more
str_extract(c("color", "colour"), "colou?r")
str_extract_all("aabbbcccc", "b+")[[1]]
str_detect(c("ac", "abc", "abbc"), "ab*c")   # All TRUE
```

## Anchors

```r
library(stringr)

words <- c("apple", "pineapple", "application")

# ^ = start of string
str_detect(words, "^apple")

# $ = end of string
str_detect(words, "apple$")

# Both
str_detect(words, "^apple$")
```

## Character Classes

| Pattern | Matches | Example |
|---------|---------|---------|
| `\\d` | Digit (0-9) | `str_extract("abc123", "\\d+")` |
| `\\w` | Word char (letter/digit/_) | `str_extract("hi!", "\\w+")` |
| `\\s` | Whitespace | `str_split("a b  c", "\\s+")` |
| `[a-z]` | Lowercase letter | `str_extract("Hello", "[a-z]+")` |
| `[A-Z]` | Uppercase letter | `str_extract("Hello", "[A-Z]")` |
| `[^abc]` | NOT a, b, or c | `str_extract("xyz", "[^abc]")` |

```r
library(stringr)

text <- "Order #123 placed on 2026-03-30 for $49.99"

cat("Numbers:", str_extract_all(text, "\\d+\\.?\\d*")[[1]], "\n")
cat("Words:", str_extract_all(text, "[A-Za-z]+")[[1]], "\n")
cat("Date:", str_extract(text, "\\d{4}-\\d{2}-\\d{2}"), "\n")
cat("Price:", str_extract(text, "\\$[\\d.]+"), "\n")
```

## Groups and Capture

```r
library(stringr)

emails <- c("alice@gmail.com", "bob@company.org")

# Capture groups with ()
str_match(emails, "(.+)@(.+)\\.(.+)")
```

```r
library(stringr)

# Backreference: \\1 refers to first capture group
str_replace("2026-03-30", "(\\d{4})-(\\d{2})-(\\d{2})", "\\2/\\3/\\1")
```

## Lookahead and Lookbehind

```r
library(stringr)

prices <- c("$100", "$250", "300", "$50")

# Lookbehind: match digits preceded by $
str_extract(prices, "(?<=\\$)\\d+")

# Lookahead: match words followed by a colon
text <- "Name: Alice Age: 30 City: NYC"
str_extract_all(text, "\\w+(?=:)")[[1]]
```

## 20 Practical Examples

```r
library(stringr)

# 1. Validate email format
str_detect("user@domain.com", "^[\\w.]+@[\\w.]+\\.[a-z]{2,}$")

# 2. Extract phone numbers
str_extract("Call 555-123-4567 or 555.987.6543", "\\d{3}[-.\\s]\\d{3}[-.\\s]\\d{4}")

# 3. Remove HTML tags
str_replace_all("<b>Hello</b> <i>World</i>", "<[^>]+>", "")

# 4. Extract hashtags
str_extract_all("Love #R and #datascience!", "#\\w+")[[1]]

# 5. Validate zip code
str_detect(c("12345", "1234", "12345-6789", "abcde"), "^\\d{5}(-\\d{4})?$")
```

```r
library(stringr)

# 6. Split camelCase to words
str_replace_all("myVariableName", "([a-z])([A-Z])", "\\1 \\2")

# 7. Remove all punctuation
str_replace_all("Hello, World! R is #1.", "[[:punct:]]", "")

# 8. Extract first word
str_extract("Hello World", "^\\w+")

# 9. Find repeated words
str_extract("the the quick brown", "\\b(\\w+)\\s+\\1\\b")

# 10. Mask credit card
str_replace("4111-2222-3333-4444", "\\d{4}-\\d{4}-\\d{4}", "****-****-****")
```

## Practice Exercises

### Exercise 1: Extract Dates

Extract all dates in YYYY-MM-DD format from text.

```r
library(stringr)
text <- "Meeting on 2026-03-30, deadline 2026-04-15, review by 2026-05-01."

```

<details><summary>Click to reveal solution</summary>

```r
library(stringr)
text <- "Meeting on 2026-03-30, deadline 2026-04-15, review by 2026-05-01."
str_extract_all(text, "\\d{4}-\\d{2}-\\d{2}")[[1]]
```
</details>

### Exercise 2: Clean and Standardize

Remove everything except letters and spaces, then collapse multiple spaces.

```r
library(stringr)
messy <- "Hello!!!   World...   R   #1   Language!!!"

```

<details><summary>Click to reveal solution</summary>

```r
library(stringr)
messy <- "Hello!!!   World...   R   #1   Language!!!"
messy |> str_replace_all("[^a-zA-Z\\s]", "") |> str_replace_all("\\s+", " ") |> str_trim()
```
</details>

## Summary

| Pattern | Meaning |
|---------|---------|
| `.` | Any character |
| `\\d`, `\\w`, `\\s` | Digit, word char, whitespace |
| `[abc]`, `[^abc]` | Character class, negated |
| `^`, `$` | Start, end of string |
| `+`, `*`, `?` | 1+, 0+, 0-1 |
| `{n}`, `{n,m}` | Exactly n, n to m |
| `(...)` | Capture group |
| `(?=...)`, `(?<=...)` | Lookahead, lookbehind |

## FAQ

### What's the difference between grep and str_detect?

`grep()` returns indices, `grepl()` returns TRUE/FALSE, `str_detect()` also returns TRUE/FALSE. `str_detect()` is pipe-friendly and uses ICU regex (better Unicode support).

### Why do I need double backslashes in R regex?

R strings use `\` as an escape character. To get a literal `\d` in the regex, you write `"\\d"` in R. The first `\` escapes the second for R, passing `\d` to the regex engine.

## What's Next?

- [stringr Tutorial](/stringr-Tutorial.html) — the parent tutorial
- [dplyr filter & select](/dplyr-filter-select.html) — use regex in filter conditions
- [lubridate Tutorial](/lubridate-Tutorial.html) — parse dates extracted by regex
