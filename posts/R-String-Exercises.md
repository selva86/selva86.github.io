---
title: "R String Manipulation Exercises: 10 stringr Practice Problems Solved"
slug: "R-String-Exercises"
description: "10 interactive stringr exercises with worked solutions, detect, extract, replace, split, pad, case, and regex. Every problem runs in the browser."
keywords: "R string exercises, stringr exercises, R regex exercises, R string practice, stringr practice problems"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.7"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Strings (10 problems)"
auto_link_terms: "R string exercises|stringr exercises|R regex exercises"
auto_link_case_sensitive: false
fr_parent: "R-Syntax-101.html"
difficulty: "Intermediate"
---

# R String Manipulation Exercises: 10 stringr Practice Problems Solved

<p class="lead">Ten focused string exercises using the <code>stringr</code> package, detect, extract, replace, split, pad, case and regex. Every problem runs in the browser with a worked solution you can reveal. Use these to build fluency with the functions you will reach for in every data-cleaning job.</p>

Every real dataset has messy strings: trailing whitespace, inconsistent case, dates embedded in filenames, phone numbers with parentheses. The `stringr` package gives you a small, consistent set of verbs that handle all of this. These exercises cover the ten you will use most often.

## Setup

```r title="Setup: load stringr and sample names"
library(stringr)

# A small messy dataset we'll reuse throughout
names_raw <- c("  Ada Lovelace ", "alan TURING", "grace Hopper",
               "Donald knuth", "  Barbara Liskov")
```

## Section 1, Trim, pad, and case

### Exercise 1. Trim whitespace and fix case

From `names_raw`, produce a vector where leading and trailing whitespace is removed and each name is converted to title case (first letter of each word capitalised).

```r title="Exercise: trim and title case"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Trim-and-title solution"
library(stringr)

names_clean <- str_to_title(str_trim(names_raw))
names_clean
# "Ada Lovelace" "Alan Turing" "Grace Hopper" "Donald Knuth" "Barbara Liskov"
```

`str_trim()` removes whitespace on both sides; `str_squish()` also collapses internal runs of whitespace to single spaces. `str_to_title()` uppercases the first character of each word.

</details>

### Exercise 2. Pad to fixed width

Given `ids <- c("7", "42", "309", "1024")`, pad each to width 5 with leading zeros so they become `"00007", "00042", "00309", "01024"`.

```r title="Exercise: left-pad ids with zeros"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Left-pad solution"
ids <- c("7", "42", "309", "1024")

str_pad(ids, width = 5, side = "left", pad = "0")
# "00007" "00042" "00309" "01024"
```

`str_pad()` is the cleanest way to build fixed-width identifiers. The `side` argument can be `"left"`, `"right"`, or `"both"`.

</details>

## Section 2, Detect and count

### Exercise 3. Detect a substring

Using `names_clean` from Exercise 1, return a logical vector that is `TRUE` for names containing the letter `"a"` (case-insensitive).

```r title="Exercise: detect letter a in names"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Detect-letter solution"
str_detect(names_clean, regex("a", ignore_case = TRUE))
# TRUE TRUE TRUE FALSE TRUE

# Equivalent shortcut:
str_detect(tolower(names_clean), "a")
```

`str_detect()` returns a logical vector the same length as its input. Use `regex(..., ignore_case = TRUE)` when you want to ignore case inside the pattern itself.

</details>

### Exercise 4. Count occurrences

Count how many times the letter `"e"` appears in each element of `names_clean`.

```r title="Exercise: count letter e per name"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Count-letter solution"
str_count(names_clean, "e")
# 1 0 1 0 0

# Case-insensitive version:
str_count(tolower(names_clean), "e")
```

`str_count()` returns an integer vector, one count per input string.

</details>

## Section 3, Extract

### Exercise 5. Extract the first word

Return the first word (the given name) from each element of `names_clean`.

```r title="Exercise: extract first word"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="First-word solution"
str_extract(names_clean, "^\\S+")
# "Ada" "Alan" "Grace" "Donald" "Barbara"

# Equivalent using word():
word(names_clean, 1)
```

`str_extract()` returns the first match of the pattern, or `NA` if there is none. `word(x, 1)` is a shortcut that does not require regex.

</details>

### Exercise 6. Extract all numbers from a string

Given `txt <- "Year 2024, month 03, day 15 — score 42.7"`, extract every number (including the decimal) as a character vector.

```r title="Exercise: extract every number"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Extract-numbers solution"
txt <- "Year 2024, month 03, day 15 — score 42.7"

str_extract_all(txt, "\\d+\\.?\\d*")[[1]]
# "2024" "03" "15" "42.7"

# Convert to numeric if you need it:
as.numeric(str_extract_all(txt, "\\d+\\.?\\d*")[[1]])
```

`str_extract_all()` returns a *list* because each string can have any number of matches. Index into the list with `[[1]]` for a single-string input.

</details>

## Section 4, Replace and split

### Exercise 7. Replace the first match

In `"2024-03-15"`, replace the first `-` with a space, keeping the rest intact.

```r title="Exercise: replace the first dash"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Replace-first solution"
str_replace("2024-03-15", "-", " ")
# "2024 03-15"

# Compare with str_replace_all() which replaces all occurrences:
str_replace_all("2024-03-15", "-", " ")
# "2024 03 15"
```

`str_replace()` replaces only the first match; `str_replace_all()` replaces every match.

</details>

### Exercise 8. Split and take

Given `paths <- c("data/raw/file1.csv", "data/clean/file2.csv", "output/file3.csv")`, extract just the file name (the part after the last `/`).

```r title="Exercise: extract filename from path"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Extract-filename solution"
paths <- c("data/raw/file1.csv", "data/clean/file2.csv", "output/file3.csv")

sapply(str_split(paths, "/"), tail, 1)
# "file1.csv" "file2.csv" "file3.csv"

# Or, using basename() from base R:
basename(paths)
```

`str_split()` returns a list because each string can split into a different number of pieces. For known-structured paths, `basename()` is simpler and faster.

</details>

## Section 5, Light regex

### Exercise 9. Extract an email address

Given `text <- "Contact: ada@example.org for help, or bob@work.dev"`, extract both email addresses.

```r title="Exercise: extract emails from text"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Extract-emails solution"
text <- "Contact: ada@example.org for help, or bob@work.dev"

str_extract_all(text, "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}")[[1]]
# "ada@example.org" "bob@work.dev"
```

The pattern says: one or more allowed local-part characters, then `@`, then one or more allowed domain characters, then a dot, then two or more letters for the TLD. This is a pragmatic email regex, not a complete RFC-compliant one (which is notoriously complex).

</details>

### Exercise 10. Validate with a pattern

Write a function `is_valid_phone(x)` that returns `TRUE` for strings of the form `xxx-xxx-xxxx` where each `x` is a digit, and `FALSE` otherwise. Test with `c("555-123-4567", "5551234567", "abc-def-ghij", "555-12-4567")`.

```r title="Exercise: phone number validator"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Phone-validator solution"
is_valid_phone <- function(x) {
  str_detect(x, "^\\d{3}-\\d{3}-\\d{4}$")
}

is_valid_phone(c("555-123-4567", "5551234567", "abc-def-ghij", "555-12-4567"))
# TRUE FALSE FALSE FALSE
```

The anchors `^` and `$` force the pattern to match the *entire* string, not just a substring. `\d{3}` means exactly three digits. Without the anchors, `"555-123-4567 ext 99"` would also match.

</details>

## Summary

- Trim with `str_trim()` / `str_squish()`. Pad with `str_pad()`. Change case with `str_to_lower()`, `str_to_upper()`, `str_to_title()`.
- Detect with `str_detect()`, count with `str_count()`, both return vectors the same length as the input.
- Extract with `str_extract()` (first match) or `str_extract_all()` (all matches, returns a list).
- Replace with `str_replace()` (first) or `str_replace_all()` (all). Split with `str_split()`.
- Light regex essentials: `\\d` digit, `\\s` whitespace, `\\S` non-whitespace, `{n}` exactly n, `+` one or more, `*` zero or more, `^`/`$` anchors.

## References

- [stringr reference](https://stringr.tidyverse.org/reference/index.html)
- [R for Data Science (2e), Strings](https://r4ds.hadley.nz/strings.html)
- [Regular Expressions in R (cheat sheet)](https://rstudio.github.io/cheatsheets/strings.pdf)

## Continue Learning

- [R Syntax 101: Write Your First Working Script in 10 Minutes](R-Syntax-101.html)
- [R Date & Time Exercises: 10 lubridate Practice Problems](R-Date-Time-Exercises.html)
- [R Functions Exercises: 10 Problems, Write, Debug & Optimize](R-Functions-Exercises.html)
