---
title: "stringr Tutorial: 15 String Functions Every R Data Scientist Needs"
slug: "stringr-Tutorial"
description: "Master stringr for string manipulation in R: str_detect, str_replace, str_extract, str_split, str_pad, and more. 15 essential functions with examples."
keywords: "stringr tutorial, string manipulation R, str_detect, str_replace, str_extract, str_split, stringr examples"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.10"
post_type: "C"
sidebar_text: "stringr Tutorial"
curriculum_path: "/data-wrangling/strings-dates/"
auto_link_terms: "stringr|str_detect|str_replace|str_extract|string manipulation R"
auto_link_case_sensitive: false
---

# stringr Tutorial: 15 String Functions Every R Data Scientist Needs

<p class="lead">The <code>stringr</code> package provides a consistent set of functions for string manipulation. All start with <code>str_</code>, take the string as the first argument, and work seamlessly with the pipe.</p>

## Detection and Matching

```r
library(stringr)
fruits <- c("apple", "banana", "cherry", "date", "elderberry")

# str_detect: returns TRUE/FALSE
str_detect(fruits, "an")

# str_which: returns positions
str_which(fruits, "an")

# str_count: how many matches
str_count(c("banana", "mississippi"), "a|i")
```

## Extraction

```r
library(stringr)
emails <- c("alice@gmail.com", "bob@company.org", "carol@university.edu")

# Extract domain
str_extract(emails, "@.+")

# Extract all numbers from a string
str_extract_all("Order 123 has 5 items at $29.99", "\\d+\\.?\\d*")
```

## Replacement

```r
library(stringr)
messy <- c("  Hello   World  ", "R   Programming  ", "Data   Science")

# Replace multiple spaces with single space
str_replace_all(messy, "\\s+", " ") |> str_trim()
```

```r
library(stringr)
# Replace first vs all matches
str_replace("banana", "a", "X")      # First only
str_replace_all("banana", "a", "X")  # All matches
```

## Splitting and Combining

```r
library(stringr)
# Split
str_split("a,b,c,d", ",")

# Split with max pieces
str_split("a-b-c-d", "-", n = 2)

# Combine (like paste)
str_c("Hello", "World", sep = " ")
str_c(c("a","b","c"), collapse = ", ")
```

## Case and Padding

```r
library(stringr)
x <- "hello world"

cat("Upper:", str_to_upper(x), "\n")
cat("Title:", str_to_title(x), "\n")
cat("Sentence:", str_to_sentence(x), "\n")
```

```r
library(stringr)
# Padding and truncating
str_pad(c("1","22","333"), width = 5, side = "left", pad = "0")

str_trunc("This is a very long string", width = 15)
```

## Subsetting

```r
library(stringr)
x <- "Hello, World!"

str_sub(x, 1, 5)      # "Hello"
str_sub(x, -6, -1)    # "orld!"
str_length(x)          # 13
```

## Quick Reference

| Function | Purpose | Example |
|----------|---------|---------|
| `str_detect(x, p)` | Match? TRUE/FALSE | `str_detect("abc", "b")` |
| `str_extract(x, p)` | First match | `str_extract("abc123", "\\d+")` |
| `str_replace(x, p, r)` | Replace first | `str_replace("aaa", "a", "b")` |
| `str_replace_all(x, p, r)` | Replace all | `str_replace_all("aaa", "a", "b")` |
| `str_split(x, p)` | Split string | `str_split("a,b", ",")` |
| `str_c(...)` | Concatenate | `str_c("a", "b", sep="-")` |
| `str_trim(x)` | Remove whitespace | `str_trim("  hi  ")` |
| `str_pad(x, w)` | Pad to width | `str_pad("1", 3, pad="0")` |
| `str_to_upper(x)` | UPPERCASE | `str_to_upper("hi")` |
| `str_to_title(x)` | Title Case | `str_to_title("hi there")` |
| `str_length(x)` | Character count | `str_length("hello")` |
| `str_sub(x, s, e)` | Substring | `str_sub("hello", 1, 3)` |
| `str_count(x, p)` | Count matches | `str_count("aabba", "a")` |
| `str_which(x, p)` | Which elements match | `str_which(c("a","b"), "a")` |
| `str_remove(x, p)` | Remove pattern | `str_remove("abc", "b")` |

## Practice Exercises

### Exercise 1: Clean Phone Numbers

Standardize these phone numbers to "XXX-XXX-XXXX" format.

```r
library(stringr)
phones <- c("(555) 123-4567", "555.987.6543", "555 456 7890", "5551234567")

```

<details><summary>Click to reveal solution</summary>

```r
library(stringr)
phones <- c("(555) 123-4567", "555.987.6543", "555 456 7890", "5551234567")
digits <- str_replace_all(phones, "[^0-9]", "")
formatted <- str_c(str_sub(digits,1,3), str_sub(digits,4,6), str_sub(digits,7,10), sep="-")
cat("Formatted:", formatted, "\n")
```
</details>

### Exercise 2: Extract Emails

Extract email addresses from text.

```r
library(stringr)
text <- "Contact alice@gmail.com or bob@company.org for info. CC: carol@uni.edu"

```

<details><summary>Click to reveal solution</summary>

```r
library(stringr)
text <- "Contact alice@gmail.com or bob@company.org for info. CC: carol@uni.edu"
str_extract_all(text, "[a-zA-Z0-9.]+@[a-zA-Z0-9.]+\\.[a-z]+")[[1]]
```
</details>

## FAQ

### What's the difference between stringr and base R string functions?

stringr functions are consistent (`str_` prefix), take string as first argument (pipe-friendly), use ICU regex, and handle NA gracefully. Base R functions (grep, gsub, substr) have inconsistent argument order and behavior.

### Does stringr use the same regex as base R?

No. stringr uses ICU regex (via the stringi package), which has some differences from base R's PCRE. Most patterns work the same, but Unicode handling is better in stringr.

## What's Next?

- [R Regular Expressions](/R-Regular-Expressions.html) — deep dive on regex patterns
- [lubridate Tutorial](/lubridate-Tutorial.html) — dates and times
- [dplyr mutate & rename](/dplyr-mutate-rename.html) — use stringr inside mutate
