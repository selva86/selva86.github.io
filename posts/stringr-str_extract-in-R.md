---
title: "stringr str_extract() in R: Extract Pattern From Strings"
slug: "stringr-str_extract-in-R"
description: "Use stringr str_extract() to extract the first regex match from each string in R. Covers all matches, named groups, NA handling, and 5 worked examples."
keywords: "str_extract, stringr str_extract, R extract pattern, regex extract R, str_extract_all, R extract substring, extract regex match"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "str_extract()|stringr str_extract|str_extract_all()|extract pattern|regex extract"
auto_link_case_sensitive: true
target_keyword: "stringr str_extract"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_extract() in R: Extract Pattern From Strings

<p class="lead">The <code>str_extract()</code> function in stringr returns the FIRST match of a regex from each input string. <code>str_extract_all()</code> returns ALL matches as a list. Both are vectorized and pipe-friendly.</p>

[QUICK ANSWER]
str_extract(x, "\\d+")                       # first run of digits
str_extract_all(x, "\\d+")                   # all matches per string
str_extract(x, "(?i)apple")                  # case-insensitive
str_extract(emails, "(?<=@)\\S+")            # lookbehind
str_match(x, "(\\d+)-(\\d+)")                # named/numbered capture groups
str_extract_all(x, "\\d+", simplify = TRUE)  # matrix output
str_extract(x, "[A-Z]+")                     # ALL CAPS substring

[DECISION TREE: Is str_extract() the right tool?]
- get the matched substring: str_extract()
- get all matches per string: str_extract_all()
- get capture groups: str_match()
- check pattern presence (TRUE/FALSE): str_detect()
- replace match: str_replace()
- count matches: str_count()
- get position of match: str_locate()

## What str_extract() does in one sentence

**`str_extract(string, pattern)` returns the FIRST substring matching `pattern` in each input.** Inputs with no match get NA. The output is the same length as the input.

It is the simplest way to extract numeric values, codes, or any structured text from messy strings. For multiple matches per string, use `str_extract_all()`.

## Syntax

**`str_extract(string, pattern)`. Pattern is regex by default.**

```r title="Extract digits from strings"
library(stringr)

x <- c("price 100", "qty 50", "no number")
str_extract(x, "\\d+")
#> [1] "100" "50"  NA
```

[TIP]
**`str_extract()` returns CHARACTER, even for digit patterns.** `str_extract("price 100", "\\d+")` returns "100" (string). Convert to numeric explicitly: `as.numeric(str_extract(...))`.

## Five common patterns

### 1. Extract digits

```r title="Pull out a number"
str_extract(c("apple 5", "banana 10"), "\\d+")
#> [1] "5"  "10"
```

`\\d+` matches one or more digits. The first match is returned per string.

### 2. Extract all matches

```r title="Get every number, not just first"
str_extract_all("price 100 qty 50", "\\d+")
#> [[1]]
#> [1] "100" "50"
```

`str_extract_all` returns a LIST of character vectors. Use `simplify = TRUE` for a matrix.

### 3. Capture groups with str_match

```r title="Pull out specific parts"
str_match(c("2024-01-15", "2025-03-20"), "(\\d{4})-(\\d{2})-(\\d{2})")
#>      [,1]         [,2]   [,3] [,4]
#> [1,] "2024-01-15" "2024" "01" "15"
#> [2,] "2025-03-20" "2025" "03" "20"
```

`str_match` returns a matrix: column 1 is the full match, columns 2+ are capture groups.

### 4. Lookbehind for "after-X" pattern

```r title="Extract email domains"
str_extract(c("a@example.com", "b@gmail.com"), "(?<=@)\\S+")
#> [1] "example.com" "gmail.com"
```

`(?<=@)` is a lookbehind: matches what FOLLOWS `@` without including it in the result.

### 5. ALL CAPS substring

```r title="Extract uppercase chunks"
str_extract(c("Order ABC123", "ITEM xyz"), "[A-Z]+")
#> [1] "ABC"  "ITEM"
```

Regex character class `[A-Z]+` matches uppercase letters.

[KEY INSIGHT]
**For "match and parse" patterns (extract specific parts), `str_match()` is more powerful than `str_extract()`.** It returns capture groups as separate columns, perfect for parsing structured strings like dates, IDs, URLs.

## str_extract() vs str_match() vs str_detect() vs str_locate()

**Four stringr "find a match" functions, each returning different shapes.**

| Function | Returns | Best for |
|---|---|---|
| `str_extract()` | Character vector of matched text | Pull a single substring per row |
| `str_extract_all()` | List of character vectors | When matches per row vary in count |
| `str_match()` | Matrix (full match + capture groups) | Parsing structured patterns into parts |
| `str_detect()` | Logical vector | Filter / boolean checks |
| `str_locate()` | Integer matrix (start, end positions) | Need character offsets, not text |
| `str_subset()` | Filtered character vector | Keep only strings that match |

When to use which:

- **str_extract** is the workhorse: simple, vectorized, returns the matched substring. Most string-mining tasks start here.
- **str_match** when the pattern has multiple meaningful parts (year + month + day, area code + number).
- **str_detect** for boolean conditions in `filter()` or `if`.
- **str_locate** for offset-based slicing.

A practical workflow combines them: `str_detect` to flag rows of interest, `str_extract` (or `str_match`) to pull the data, `str_replace` to clean up the source.

## Why regex matters here

**`str_extract()` is essentially a regex engine wrapped in a friendly vectorized API.** The function is only as powerful as the patterns you write. Three regex idioms cover most real-world extraction:

- **Quantifiers** (`+`, `*`, `?`, `{n,m}`) control how many characters to match.
- **Character classes** (`[A-Z]`, `\\d`, `\\w`, `\\s`) say WHAT to match.
- **Anchors and lookarounds** (`^`, `$`, `(?<=)`, `(?=)`) say WHERE to match.

Combining these lets you extract email addresses, phone numbers, URLs, dates, prices, codes, hashtags, and almost any structured token from messy text. For more advanced patterns, the `regex()` helper lets you set flags like `ignore_case = TRUE` or `multiline = TRUE`.

## Common pitfalls

**Pitfall 1: pattern matches "" causes empty extracts.** `str_extract(x, ".*")` matches the WHOLE string (greedy). For non-greedy, use `.*?` or anchored patterns.

**Pitfall 2: NA output for non-matches.** Strings without a match return NA. Check with `is.na()` after extracting.

[WARNING]
**Output of `str_extract` is CHARACTER even when matching digits.** Always cast to the right type after: `as.numeric(str_extract(x, "\\d+"))`. Forgetting causes downstream type errors.

## Try it yourself

**Try it:** Extract the YEAR from each date string in `dates`. Save to `ex_years` (as integers).

```r title="Your turn: extract year as integer"
dates <- c("2024-01-15", "2025-03-20", "1999-12-31")

ex_years <- # your code here

ex_years
#> Expected: c(2024, 2025, 1999) as integers
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_years <- as.integer(str_extract(dates, "\\d{4}"))
ex_years
#> [1] 2024 2025 1999
```

**Explanation:** `\\d{4}` matches exactly 4 digits (the year). `as.integer()` converts the string output to an integer vector.

</details>

## Related stringr functions

After mastering str_extract, look at:

- `str_match()`: returns capture groups as columns
- `str_extract_all()`: every match per string
- `str_detect()`: just check for presence
- `str_replace()`: replace matched part
- `str_locate()`: find character positions of match
- `str_subset()`: filter strings that match

For complex extraction with many groups, `str_match` plus naming groups via `(?<name>pattern)` (Perl regex) is the cleanest pattern.

## FAQ

**How do I extract a regex match from a string in R?**

Use `stringr::str_extract(x, "pattern")` for the first match. Use `str_extract_all(x, "pattern")` for all matches. Both accept regex by default; wrap with `fixed()` for literal text.

**What is the difference between str_extract and str_match in R?**

`str_extract()` returns the matched substring as a character vector. `str_match()` returns a matrix where column 1 is the full match and columns 2+ are capture groups. Use str_match when you need to parse specific parts.

**How do I extract numbers from a string in R?**

`as.numeric(str_extract(x, "\\d+"))` extracts the first run of digits and converts to numeric. For all numbers, `str_extract_all(x, "\\d+")` returns a list.

**What does str_extract return for non-matching strings?**

NA. Strings with no match get NA in the result. Filter with `na.omit()` or `!is.na()` if you need only successful matches.

**How do I make str_extract case-insensitive?**

Wrap pattern: `str_extract(x, regex("apple", ignore_case = TRUE))`. Or use inline modifier: `(?i)apple`.
