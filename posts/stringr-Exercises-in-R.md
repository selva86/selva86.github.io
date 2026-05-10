---
title: "stringr Exercises in R: 50 Real Practice Problems"
slug: "stringr-Exercises-in-R"
description: "Master stringr with 50 practice problems in R: detect, extract, replace, split, regex. Hidden solutions, runnable code in the browser."
keywords: "stringr exercises, stringr practice, stringr exercises in R, regex in R exercises, R string manipulation practice, stringr regex exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "stringr Exercises"
sidebar_order: 111
fr_parent: "R-Tutorial.html"
auto_link_terms: "stringr exercises|stringr practice|regex in R exercises|R string manipulation"
auto_link_case_sensitive: false
target_keyword: "stringr exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# stringr Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems on stringr in R: detect, extract, replace, split, count, pad, regex. Real scenarios with hidden solutions.</p>

```r title="Run this once before any exercise"
library(stringr)
library(dplyr)
library(tibble)
```

## Section 1. Detect and match (8 problems)

### Exercise 1.1: Detect substring

**Difficulty:** Beginner. Filter emails containing "gmail.com".

<details><summary>Show solution</summary>

```r
emails <- c("a@gmail.com","b@yahoo.com","c@gmail.com")
emails[str_detect(emails, "gmail.com")]
```

</details>

### Exercise 1.2: Detect at start

**Difficulty:** Beginner. Strings starting with "Mr ".

<details><summary>Show solution</summary>

```r
x <- c("Mr Smith","Dr Jones","Mr Lee","Mrs Park")
x[str_detect(x, "^Mr ")]
```

</details>

### Exercise 1.3: Detect at end

**Difficulty:** Beginner. Filenames ending with ".csv".

<details><summary>Show solution</summary>

```r
f <- c("a.csv","b.txt","c.csv","d.tsv")
f[str_detect(f, "\\.csv$")]
```

</details>

### Exercise 1.4: Count matches

**Difficulty:** Intermediate. Count vowels per word.

<details><summary>Show solution</summary>

```r
str_count(c("apple","banana","sky"), "[aeiou]")
```

</details>

### Exercise 1.5: Position of match

**Difficulty:** Intermediate. Locate first digit position in each string.

<details><summary>Show solution</summary>

```r
str_locate(c("abc123","x9y","none"), "\\d")
```

</details>

### Exercise 1.6: Match case-insensitive

**Difficulty:** Intermediate. Detect "ERROR" anywhere, ignoring case.

<details><summary>Show solution</summary>

```r
logs <- c("Error: bad input","INFO: ok","error: fatal")
str_detect(logs, regex("error", ignore_case = TRUE))
```

</details>

### Exercise 1.7: Multi-word match

**Difficulty:** Intermediate. Filter rows where description contains BOTH "fast" AND "easy".

<details><summary>Show solution</summary>

```r
desc <- c("fast and easy","slow but reliable","easy and fast","quick")
desc[str_detect(desc, "fast") & str_detect(desc, "easy")]
```

</details>

### Exercise 1.8: Filter rows of a tibble

**Difficulty:** Intermediate. From a tibble, keep rows whose name starts with "A".

<details><summary>Show solution</summary>

```r
tibble(name = c("Alice","Bob","Anna","Carol")) |>
  filter(str_detect(name, "^A"))
```

</details>

## Section 2. Extract (8 problems)

### Exercise 2.1: First match

**Difficulty:** Intermediate. Extract the first 3-digit number from each string.

<details><summary>Show solution</summary>

```r
str_extract(c("abc123","45-678","xy"), "\\d{3}")
```

</details>

### Exercise 2.2: All matches

**Difficulty:** Intermediate. Extract ALL numbers per string.

<details><summary>Show solution</summary>

```r
str_extract_all(c("a1b2","x10y20","none"), "\\d+")
```

</details>

### Exercise 2.3: Capture groups

**Difficulty:** Advanced. From "user_42@x.com", capture "user" prefix and "42" id.

<details><summary>Show solution</summary>

```r
str_match("user_42@x.com", "([a-z]+)_(\\d+)")
```

</details>

### Exercise 2.4: Extract email domain

**Difficulty:** Intermediate. Get the domain part of an email.

<details><summary>Show solution</summary>

```r
str_extract(c("a@x.com","b@y.org"), "(?<=@).+")
```

</details>

### Exercise 2.5: Extract phone area code

**Difficulty:** Intermediate. From "(415) 555-1234".

<details><summary>Show solution</summary>

```r
str_extract("(415) 555-1234", "\\d{3}")
```

</details>

### Exercise 2.6: Extract dollars

**Difficulty:** Intermediate. From "Total: $123.45 paid".

<details><summary>Show solution</summary>

```r
str_extract("Total: $123.45 paid", "\\$\\d+\\.\\d{2}")
```

</details>

### Exercise 2.7: Extract URL hostname

**Difficulty:** Advanced. From "https://r-statistics.co/path".

<details><summary>Show solution</summary>

```r
str_extract("https://r-statistics.co/path", "(?<=://)[^/]+")
```

</details>

### Exercise 2.8: Multiple groups to columns

**Difficulty:** Advanced. From "John Smith, 30", extract first, last, age.

<details><summary>Show solution</summary>

```r
m <- str_match("John Smith, 30", "(\\w+) (\\w+), (\\d+)")
m
```

</details>

## Section 3. Replace and modify (8 problems)

### Exercise 3.1: Replace first match

**Difficulty:** Beginner. Replace first digit with "*".

<details><summary>Show solution</summary>

```r
str_replace("abc123def", "\\d", "*")
```

</details>

### Exercise 3.2: Replace all matches

**Difficulty:** Beginner. Replace all digits with "*".

<details><summary>Show solution</summary>

```r
str_replace_all("abc123def", "\\d", "*")
```

</details>

### Exercise 3.3: Strip non-digits

**Difficulty:** Intermediate. Normalize phone to digits only.

<details><summary>Show solution</summary>

```r
str_replace_all("(415) 555-1234", "\\D", "")
```

</details>

### Exercise 3.4: Replace with backreference

**Difficulty:** Advanced. Reformat "John Smith" to "Smith, John".

<details><summary>Show solution</summary>

```r
str_replace("John Smith", "(\\w+) (\\w+)", "\\2, \\1")
```

</details>

### Exercise 3.5: Replace with named groups

**Difficulty:** Advanced. Same swap using named groups.

<details><summary>Show solution</summary>

```r
str_replace("John Smith", "(?<first>\\w+) (?<last>\\w+)", "\\2, \\1")
```

</details>

### Exercise 3.6: Trim whitespace

**Difficulty:** Beginner. Remove leading/trailing spaces.

<details><summary>Show solution</summary>

```r
str_trim(c("  hello  "," world ","ok"))
```

</details>

### Exercise 3.7: Squish whitespace

**Difficulty:** Intermediate. Collapse internal multi-spaces too.

<details><summary>Show solution</summary>

```r
str_squish("  hello   world  ok  ")
```

</details>

### Exercise 3.8: Remove punctuation

**Difficulty:** Intermediate. Strip all punctuation.

<details><summary>Show solution</summary>

```r
str_replace_all("Hello, world! Yes? No.", "[[:punct:]]", "")
```

</details>

## Section 4. Split and combine (8 problems)

### Exercise 4.1: Split by delimiter

**Difficulty:** Beginner. Split "a,b,c" on comma.

<details><summary>Show solution</summary>

```r
str_split("a,b,c", ",")
```

</details>

### Exercise 4.2: Split with simplify

**Difficulty:** Intermediate. Return a matrix.

<details><summary>Show solution</summary>

```r
str_split(c("a,b","c,d","e,f"), ",", simplify = TRUE)
```

</details>

### Exercise 4.3: Split into n parts

**Difficulty:** Intermediate. Split into max 2 pieces.

<details><summary>Show solution</summary>

```r
str_split("a,b,c,d", ",", n = 2)
```

</details>

### Exercise 4.4: Concatenate vector

**Difficulty:** Beginner. Join words with " ".

<details><summary>Show solution</summary>

```r
str_c(c("R","is","fun"), collapse = " ")
```

</details>

### Exercise 4.5: Vectorized concatenate

**Difficulty:** Intermediate. Join two vectors element-wise.

<details><summary>Show solution</summary>

```r
str_c(c("Hello","Hi"), c("Alice","Bob"), sep = " ")
```

</details>

### Exercise 4.6: Glue-style interpolation

**Difficulty:** Intermediate. Use stringr's str_glue for interpolation.

<details><summary>Show solution</summary>

```r
name <- "Alice"; age <- 30
str_glue("Hello {name}, age {age}")
```

</details>

### Exercise 4.7: Pad to fixed width

**Difficulty:** Beginner. Zero-pad ID to 6 chars.

<details><summary>Show solution</summary>

```r
str_pad("42", width = 6, side = "left", pad = "0")
```

</details>

### Exercise 4.8: Truncate with ellipsis

**Difficulty:** Intermediate. Truncate to 10 chars with "...".

<details><summary>Show solution</summary>

```r
str_trunc("This is a long sentence", width = 10)
```

</details>

## Section 5. Case and length (8 problems)

### Exercise 5.1: To lower

**Difficulty:** Beginner. Lowercase a string.

<details><summary>Show solution</summary>

```r
str_to_lower("HELLO WORLD")
```

</details>

### Exercise 5.2: To upper

**Difficulty:** Beginner. Uppercase.

<details><summary>Show solution</summary>

```r
str_to_upper("hello")
```

</details>

### Exercise 5.3: To title

**Difficulty:** Beginner. Title case.

<details><summary>Show solution</summary>

```r
str_to_title("hello world")
```

</details>

### Exercise 5.4: To sentence

**Difficulty:** Intermediate. Capitalize first letter only.

<details><summary>Show solution</summary>

```r
str_to_sentence("hello world. how are you?")
```

</details>

### Exercise 5.5: String length

**Difficulty:** Beginner. Length of each.

<details><summary>Show solution</summary>

```r
str_length(c("R","stringr","x"))
```

</details>

### Exercise 5.6: Reverse a string

**Difficulty:** Intermediate. Reverse character order.

<details><summary>Show solution</summary>

```r
stringi::stri_reverse("hello")
```

</details>

### Exercise 5.7: Substring by position

**Difficulty:** Intermediate. Get characters 2-4.

<details><summary>Show solution</summary>

```r
str_sub("abcdefg", 2, 4)
```

</details>

### Exercise 5.8: Replace substring by position

**Difficulty:** Advanced. Replace chars 2-4 with "XX".

<details><summary>Show solution</summary>

```r
x <- "abcdefg"
str_sub(x, 2, 4) <- "XX"
x
```

</details>

## Section 6. Real workflows (10 problems)

### Exercise 6.1: Validate email format

**Difficulty:** Intermediate. Detect strings that look like emails.

<details><summary>Show solution</summary>

```r
emails <- c("a@x.com","not_an_email","b@y.co.uk","c@")
str_detect(emails, "^[\\w.]+@[\\w.]+\\.\\w{2,}$")
```

</details>

### Exercise 6.2: Extract hashtags

**Difficulty:** Intermediate. From a tweet, extract all #hashtags.

<details><summary>Show solution</summary>

```r
str_extract_all("Loving #rstats and #dataviz today", "#\\w+")
```

</details>

### Exercise 6.3: Parse a structured log line

**Difficulty:** Advanced. From "2024-01-15 ERROR [auth] timeout" extract date, level, module, msg.

<details><summary>Show solution</summary>

```r
log <- "2024-01-15 ERROR [auth] timeout"
str_match(log, "(\\d{4}-\\d{2}-\\d{2}) (\\w+) \\[(\\w+)\\] (.+)")
```

</details>

### Exercise 6.4: Clean phone numbers

**Difficulty:** Intermediate. Normalize "(415) 555-1234" to "+14155551234".

<details><summary>Show solution</summary>

```r
str_c("+1", str_replace_all("(415) 555-1234", "\\D", ""))
```

</details>

### Exercise 6.5: Detect duplicates by normalized name

**Difficulty:** Intermediate. After lowercasing+trimming names, find duplicates.

<details><summary>Show solution</summary>

```r
names <- c(" Alice ","BOB","alice","carol","Bob ")
norm <- str_to_lower(str_trim(names))
duplicated(norm)
```

</details>

### Exercise 6.6: Extract first sentence

**Difficulty:** Advanced. Pull the first sentence (up to ".", "!", or "?").

<details><summary>Show solution</summary>

```r
str_extract("Hello world. How are you? I'm great!", "[^.!?]+[.!?]")
```

</details>

### Exercise 6.7: Strip HTML tags

**Difficulty:** Advanced. Remove `<...>` tags from a string.

<details><summary>Show solution</summary>

```r
str_replace_all("<p>Hello <b>world</b></p>", "<[^>]+>", "")
```

</details>

### Exercise 6.8: Count words

**Difficulty:** Intermediate. Count words in a sentence.

<details><summary>Show solution</summary>

```r
str_count("Hello world from R", "\\b\\w+\\b")
```

</details>

### Exercise 6.9: Split sentences

**Difficulty:** Advanced. Split paragraph into sentences.

<details><summary>Show solution</summary>

```r
str_split("Hi there. How are you? I am fine.", "(?<=[.!?])\\s+")
```

</details>

### Exercise 6.10: Mask sensitive info

**Difficulty:** Advanced. Replace credit card numbers (16 digits) with X.

<details><summary>Show solution</summary>

```r
str_replace_all("Card: 4111-1111-1111-1234 expires 01/26",
                "\\d{4}-\\d{4}-\\d{4}-\\d{4}",
                "XXXX-XXXX-XXXX-XXXX")
```

</details>

## What to do next

- **Regex-Exercises-in-R** (coming) — pure regex drilling.
- **tidyverse-Exercises** (shipped) — string ops in pipelines.
- **Data-Cleaning-Exercises** (coming) — strings as part of cleanup.
