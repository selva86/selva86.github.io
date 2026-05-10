---
title: "Regex Exercises in R: 40 Practice Problems"
slug: "Regex-Exercises-in-R"
description: "Master regex in R with 40 practice problems: match, extract, replace, anchors, groups, lookarounds. Hidden solutions, runnable code."
keywords: "regex in R exercises, regular expressions in R practice, R regex problems, regex exercises in R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Regex Exercises"
sidebar_order: 123
fr_parent: "R-Tutorial.html"
auto_link_terms: "regex in R exercises|regular expressions in R practice|R regex problems"
auto_link_case_sensitive: false
target_keyword: "regex in R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Regex Exercises in R: 40 Practice Problems

<p class="lead">Forty practice problems on regular expressions in R: anchors, character classes, quantifiers, groups, lookarounds. Solutions hidden.</p>

```r title="Run this once before any exercise"
library(stringr)
```

## Section 1. Anchors and basics (8 problems)

### Exercise 1.1: Starts with

**Difficulty:** Beginner. Strings starting with "Mr".

<details><summary>Show solution</summary>

```r
str_detect(c("Mr Smith","Dr Jones","Mrs Park"), "^Mr ")
```

</details>

### Exercise 1.2: Ends with

**Difficulty:** Beginner. ".csv" filenames.

<details><summary>Show solution</summary>

```r
str_detect(c("a.csv","b.txt","c.csv"), "\\.csv$")
```

</details>

### Exercise 1.3: Contains digit

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_detect(c("abc","abc123","xy"), "\\d")
```

</details>

### Exercise 1.4: Word boundary

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("cat","catalog","scat"), "\\bcat\\b")
```

</details>

### Exercise 1.5: Whole-string match

**Difficulty:** Intermediate. Exactly 5 digits.

<details><summary>Show solution</summary>

```r
str_detect(c("12345","1234","12345abc"), "^\\d{5}$")
```

</details>

### Exercise 1.6: Empty string

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_detect(c("", "x"), "^$")
```

</details>

### Exercise 1.7: Whitespace-only

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("   ","abc","\t\n"), "^\\s*$")
```

</details>

### Exercise 1.8: Case-insensitive

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("Error","ERROR","ok"), regex("error", ignore_case = TRUE))
```

</details>

## Section 2. Character classes and quantifiers (8 problems)

### Exercise 2.1: Letters only

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_detect(c("abc","abc1","123"), "^[A-Za-z]+$")
```

</details>

### Exercise 2.2: Digits only

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_detect(c("123","12a","a1"), "^\\d+$")
```

</details>

### Exercise 2.3: Alphanumeric

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_detect(c("abc123","abc!"), "^[A-Za-z0-9]+$")
```

</details>

### Exercise 2.4: Hex string

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("ff00aa","gg11","123abc"), "^[0-9a-fA-F]+$")
```

</details>

### Exercise 2.5: Min length 8

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("short","longer_one"), "^.{8,}$")
```

</details>

### Exercise 2.6: Exact length

**Difficulty:** Intermediate. 5 digits.

<details><summary>Show solution</summary>

```r
str_detect(c("12345","123","123456"), "^\\d{5}$")
```

</details>

### Exercise 2.7: Range length

**Difficulty:** Intermediate. 3 to 6 letters.

<details><summary>Show solution</summary>

```r
str_detect(c("ab","abc","abcdefg"), "^[a-zA-Z]{3,6}$")
```

</details>

### Exercise 2.8: Optional group

**Difficulty:** Advanced. Optional "+1" prefix on phones.

<details><summary>Show solution</summary>

```r
str_detect(c("+15555550100","5555550100"), "^(\\+1)?\\d{10}$")
```

</details>

## Section 3. Groups and capturing (8 problems)

### Exercise 3.1: Capture domain

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_match("a@x.com", "@(.+)$")
```

</details>

### Exercise 3.2: Multiple groups

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_match("user_42", "(\\w+)_(\\d+)")
```

</details>

### Exercise 3.3: Named groups

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_match("John 30", "(?<name>\\w+) (?<age>\\d+)")
```

</details>

### Exercise 3.4: Backreference in replacement

**Difficulty:** Advanced. Swap "John Smith" -> "Smith, John".

<details><summary>Show solution</summary>

```r
str_replace("John Smith", "(\\w+) (\\w+)", "\\2, \\1")
```

</details>

### Exercise 3.5: Non-capturing group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_match("color", "colou?r")
str_match("color", "colo(?:u)?r")
```

</details>

### Exercise 3.6: Alternation in group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("cat","dog","fish"), "^(cat|dog)$")
```

</details>

### Exercise 3.7: Repeated group

**Difficulty:** Advanced. Match repeated digits like "123-456-7890".

<details><summary>Show solution</summary>

```r
str_detect("123-456-7890", "^(\\d{3}-){2}\\d{4}$")
```

</details>

### Exercise 3.8: Match all groups

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_match_all("user_1 user_2 user_3", "user_(\\d+)")
```

</details>

## Section 4. Lookarounds (6 problems)

### Exercise 4.1: Lookbehind

**Difficulty:** Advanced. Digit after "$".

<details><summary>Show solution</summary>

```r
str_extract("Total: $100", "(?<=\\$)\\d+")
```

</details>

### Exercise 4.2: Negative lookbehind

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_extract_all("Item 5, $10 each", "(?<!\\$)\\d+")
```

</details>

### Exercise 4.3: Lookahead

**Difficulty:** Advanced. Digit BEFORE "px".

<details><summary>Show solution</summary>

```r
str_extract("font: 14px", "\\d+(?=px)")
```

</details>

### Exercise 4.4: Negative lookahead

**Difficulty:** Advanced. Numbers NOT followed by "px".

<details><summary>Show solution</summary>

```r
str_extract_all("a:14px b:7em c:3", "\\d+(?!px)")
```

</details>

### Exercise 4.5: Combined

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_extract("between [BEGIN] foo [END]", "(?<=\\[BEGIN\\]).+?(?=\\[END\\])")
```

</details>

### Exercise 4.6: Password rule

**Difficulty:** Advanced. At least one digit, one letter, length 8+.

<details><summary>Show solution</summary>

```r
str_detect(c("abc12345","abcdefgh","12345678"), "^(?=.*[A-Za-z])(?=.*\\d).{8,}$")
```

</details>

## Section 5. Real-world (10 problems)

### Exercise 5.1: Email

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("a@x.com","not_email","b@y.co.uk"), "^[\\w.]+@[\\w.]+\\.\\w{2,}$")
```

</details>

### Exercise 5.2: URL

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect("https://r-statistics.co", "^https?://[\\w.-]+(/.*)?$")
```

</details>

### Exercise 5.3: ISO date

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect(c("2024-01-15","2024/01/15"), "^\\d{4}-\\d{2}-\\d{2}$")
```

</details>

### Exercise 5.4: Phone US

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_detect("(415) 555-1234", "^\\(\\d{3}\\) \\d{3}-\\d{4}$")
```

</details>

### Exercise 5.5: Hashtag extraction

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_extract_all("Loving #rstats and #dataviz", "#\\w+")
```

</details>

### Exercise 5.6: Strip HTML tags

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_replace_all("<p>Hello <b>world</b></p>", "<[^>]+>", "")
```

</details>

### Exercise 5.7: Mask credit card

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_replace_all("CC: 4111-1111-1111-1234", "\\d{4}-\\d{4}-\\d{4}-\\d{4}", "XXXX-XXXX-XXXX-XXXX")
```

</details>

### Exercise 5.8: Extract numbers from messy text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_extract_all("p1=10, p2=20.5, p3=300", "[-+]?\\d*\\.?\\d+")
```

</details>

### Exercise 5.9: First word

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_extract("Hello World Today", "^\\S+")
```

</details>

### Exercise 5.10: Detect repeated words

**Difficulty:** Advanced. e.g. "the the".

<details><summary>Show solution</summary>

```r
str_detect("the the cat sat", "\\b(\\w+)\\b\\s+\\1\\b")
```

</details>

## What to do next

- **stringr-Exercises** (shipped) — string-tooling drills.
- **Data-Cleaning-Exercises** (shipped) — regex inside cleanup.
