---
title: "R Regex Cheat Sheet: 30 Patterns With stringr Examples — Copy and Paste"
slug: "R-Regex-Cheat-Sheet-stringr"
description: "Quick reference: character classes, quantifiers, anchors, groups, lookaheads — all with str_detect(), str_extract(), and str_replace() examples you can copy."
keywords: "R regex cheat sheet, R regular expressions, stringr regex, str_detect regex, str_extract regex, str_replace regex, R pattern matching, regex in R"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "CHT8"
post_type: "FR"
auto_link_terms: "R regex cheat sheet|regex in R|regular expressions in R|R regex patterns|R pattern matching"
auto_link_case_sensitive: false
fr_parent: "stringr-in-R.html"
---


# R Regex Cheat Sheet: 30 Patterns With stringr Examples — Copy and Paste

<p class="lead">A copy-paste regex pattern library for R: 30 patterns organized by category, each with a stringr code example and expected output.</p>

## Introduction

You know your data has a pattern. You know stringr can find it. But which regex syntax was it again? Was it `\\d` or `[:digit:]`? Does `+` mean "one or more" or "zero or more"? This page answers those questions in under 10 seconds.

This cheat sheet covers 30 regular expression patterns in six categories: literals, character classes, quantifiers, anchors, groups, and lookarounds. Every pattern includes a plain-English description, the regex syntax, and a runnable stringr example with output. Bookmark this page and come back whenever you need a pattern.

All examples use three stringr functions: `str_detect()` for TRUE/FALSE matching, `str_extract()` or `str_extract_all()` for pulling out matches, and `str_replace()` for substitutions. If you need a full walkthrough of stringr, see the [stringr tutorial](stringr-in-R.html).

```r
# Load stringr and create sample data used throughout
library(stringr)

texts <- c("Order #1234", "Email: bob@mail.com", "Price: $19.99",
           "Phone: 555-867-5309", "Date: 2026-04-06", "Hello World!")
messy_data <- c("  extra spaces  ", "MiXeD CaSe", "line1\nline2",
                "file.R", "data.csv", "report.pdf")
```

## How Do You Match Literal Characters and Metacharacters?

Most regex patterns start with plain text. Letters and numbers match themselves. The trouble begins with special characters like `.` and `$` that have regex meaning. You escape them with a double backslash in R.

Here are the five foundational patterns.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 1 | Literal text | `abc` | Matches the exact characters "abc" |
| 2 | Any character | `.` | Matches any single character except newline |
| 3 | Escaped dot | `\\.` | Matches a literal period |
| 4 | Escaped backslash | `\\\\` | Matches a literal backslash |
| 5 | Escaped special | `\\$` | Matches a literal dollar sign, bracket, etc. |

Let's see these in action. The first example detects literal text. The second extracts any-character matches. The third finds actual file extensions by matching a literal dot.

```r
# Pattern 1: Literal match
str_detect(texts, "Order")
#> [1]  TRUE FALSE FALSE FALSE FALSE FALSE

# Pattern 2: . matches any character
str_extract(texts, "P..ce")
#> [1] NA     NA     "Price" NA     NA     NA

# Pattern 3: Escaped dot matches literal period
str_extract(messy_data, "\\..+")
#> [1] NA    NA    NA    ".R"  ".csv" ".pdf"

# Pattern 5: Escaped dollar sign
str_detect(texts, "\\$")
#> [1] FALSE FALSE  TRUE FALSE FALSE FALSE
```

The `str_extract()` call with `"P..ce"` matches "Price" because each dot stands in for one character. The `"\\..+"` pattern matches a literal dot followed by one or more characters, pulling out file extensions.

[WARNING]
**R requires double backslashes for regex escapes.** Write `\\d` in R where other languages write `\d`. The first backslash escapes the second for R's string parser. The second backslash reaches the regex engine.

## How Do Character Classes Work in R Regex?

Character classes match one character from a defined set. Square brackets create custom sets like `[aeiou]`. Shorthand classes like `\\d` save typing for common categories.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 6 | Custom set | `[aeiou]` | Matches any one character in the set |
| 7 | Range | `[a-z]` | Matches any lowercase letter |
| 8 | Negated set | `[^0-9]` | Matches any character NOT in the set |
| 9 | Digit shorthand | `\\d` | Matches any digit (same as `[0-9]`) |
| 10 | Word shorthand | `\\w` | Matches letter, digit, or underscore |
| 11 | Whitespace shorthand | `\\s` | Matches space, tab, or newline |
| 12 | POSIX alpha | `[[:alpha:]]` | Matches any letter (locale-aware) |

The shorthand classes `\\d`, `\\w`, and `\\s` each have uppercase negations: `\\D` matches non-digits, `\\W` matches non-word characters, and `\\S` matches non-whitespace.

```r
# Pattern 6: Custom character set — extract vowels
str_extract_all("banana", "[aeiou]")
#> [[1]]
#> [1] "a" "a" "a"

# Pattern 9: \\d extracts digits
str_extract(texts, "\\d+")
#> [1] "1234" NA     "19"   "555"  "2026" NA

# Pattern 11: \\s detects whitespace
str_detect(messy_data, "\\s")
#> [1]  TRUE  TRUE FALSE FALSE FALSE FALSE

# Pattern 8: Negated set — remove non-digits
str_replace_all(texts[4], "[^0-9]", "")
#> [1] "5558675309"
```

The negated set `[^0-9]` in the last example strips every character that is not a digit. This is a common pattern for cleaning phone numbers and IDs.

[TIP]
**POSIX classes use double brackets.** Write `[[:digit:]]` not `[:digit:]`. The outer brackets define the character class. The inner `[:digit:]` is the POSIX name. Forgetting the outer brackets causes a subtle wrong-match bug, not an error.

## How Do Quantifiers Control Pattern Repetition?

Quantifiers tell the regex engine how many times to repeat the preceding element. By default, quantifiers are greedy: they match as much as possible. Adding `?` after a quantifier makes it lazy, matching as little as possible.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 13 | Zero or one | `?` | Matches 0 or 1 of the preceding element |
| 14 | One or more | `+` | Matches 1 or more (greedy) |
| 15 | Zero or more | `*` | Matches 0 or more (greedy) |
| 16 | Exact count | `{3}` | Matches exactly 3 repetitions |
| 17 | N or more | `{2,}` | Matches 2 or more repetitions |
| 18 | Range | `{2,4}` | Matches between 2 and 4 repetitions |
| 19 | Lazy one-or-more | `+?` | Matches 1 or more (as few as possible) |

Let's see how quantifiers affect extraction on phone numbers and other structured text.

```r
phones <- c("555-867-5309", "555-12-3456", "1-800-555-0199")

# Pattern 16: Exact count — match 3-digit groups
str_extract_all(phones[1], "\\d{3}")
#> [[1]]
#> [1] "555" "867" "530"

# Pattern 18: Range — match 2 to 4 digit groups
str_extract_all(phones[2], "\\d{2,4}")
#> [[1]]
#> [1] "555" "12" "3456"

# Pattern 14 vs 19: Greedy vs lazy
html <- "<b>bold</b> and <i>italic</i>"
str_extract(html, "<.+>")
#> [1] "<b>bold</b> and <i>italic</i>"
str_extract(html, "<.+?>")
#> [1] "<b>"
```

The greedy `<.+>` swallows everything from the first `<` to the last `>`. The lazy `<.+?>` stops at the first `>` it finds. This is the single most common regex surprise.

[KEY INSIGHT]
**Greedy grabs the longest match. Lazy grabs the shortest.** If your extraction returns too much text, add `?` after the quantifier. If it returns too little, remove the `?`.

## How Do Anchors and Boundaries Pin a Pattern in Place?

Anchors match a position, not a character. They answer "where in the string?" without consuming any text. The caret `^` pins a pattern to the start. The dollar sign `$` pins it to the end. Word boundaries `\\b` pin a pattern to the edge of a word.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 20 | Start of string | `^` | Matches the beginning of the string |
| 21 | End of string | `$` | Matches the end of the string |
| 22 | Word boundary | `\\b` | Matches position between word and non-word char |
| 23 | Non-word boundary | `\\B` | Matches position NOT at a word edge |

Anchors are essential for validation. Want to check if a string starts with a digit? Use `^\\d`. Want to confirm a filename ends in `.csv`? Use `\\.csv$`.

```r
words <- c("apple", "pineapple", "app", "application", "grapple")

# Pattern 20: ^ matches start only
str_detect(words, "^app")
#> [1]  TRUE FALSE  TRUE  TRUE FALSE

# Pattern 21: $ matches end only
str_detect(words, "ple$")
#> [1]  TRUE  TRUE FALSE FALSE  TRUE

# Pattern 22: \\b matches whole words only
str_detect(words, "\\bapp\\b")
#> [1] FALSE FALSE  TRUE FALSE FALSE

# Combined: start + end = exact match
str_detect(words, "^apple$")
#> [1]  TRUE FALSE FALSE FALSE FALSE
```

Without anchors, `"app"` matches anywhere inside a string. The `\\b` word boundary in `\\bapp\\b` requires "app" to be a complete word, not part of "apple" or "application".

[WARNING]
**The caret means different things in different positions.** Outside brackets, `^` is an anchor (start of string). Inside brackets, `[^abc]` means negation (NOT a, b, or c). Mixing these up is a common source of wrong results.

## How Do Groups and Alternation Capture Subpatterns?

Groups wrap part of a pattern in parentheses. Capturing groups `()` let you extract submatches. Non-capturing groups `(?:)` organize patterns without capturing. The alternation operator `|` means "this or that".

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 24 | Capturing group | `(\\d{4})` | Captures matched text for extraction |
| 25 | Non-capturing group | `(?:ab)+` | Groups without capturing (for quantifiers) |
| 26 | Backreference | `(\\w+) \\1` | Matches a repeated word |
| 27 | Alternation | `cat\|dog` | Matches "cat" or "dog" |

Use `str_match()` instead of `str_extract()` when you need captured group contents. `str_match()` returns a matrix with the full match in column 1 and each group in subsequent columns.

```r
dates <- c("2026-04-06", "2025-12-25", "2024-01-15")

# Pattern 24: Capturing groups with str_match
str_match(dates, "(\\d{4})-(\\d{2})-(\\d{2})")
#>      [,1]         [,2]   [,3] [,4]
#> [1,] "2026-04-06" "2026" "04" "06"
#> [2,] "2025-12-25" "2025" "12" "25"
#> [3,] "2024-01-15" "2024" "01" "15"

# Pattern 27: Alternation
pets <- c("I have a cat", "She has a dog", "They have a fish")
str_extract(pets, "cat|dog")
#> [1] "cat" "dog" NA

# Pattern 26: Backreference detects repeated words
typos <- c("the the cat", "a big dog", "is is good")
str_detect(typos, "\\b(\\w+) \\1\\b")
#> [1]  TRUE FALSE  TRUE
```

The backreference `\\1` refers to whatever the first group captured. In the typo detector, `(\\w+) \\1` matches any word followed by a space and the same word again.

[TIP]
**Use str_match() for groups, str_extract() for full matches.** The function `str_extract()` returns only the complete match. If you need the year, month, and day separately from a date pattern, `str_match()` gives you each group in its own column.

## How Do Lookaheads and Lookbehinds Match Without Consuming?

Lookarounds are zero-width assertions. They check what is next to a position without including it in the match. A lookahead checks what follows. A lookbehind checks what precedes.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 28 | Positive lookahead | `(?=...)` | Asserts what follows matches |
| 29 | Negative lookahead | `(?!...)` | Asserts what follows does NOT match |
| 30 | Positive lookbehind | `(?<=...)` | Asserts what precedes matches |

These are powerful for extracting text next to a known marker without including the marker in the result.

```r
prices <- c("Price: $19.99", "Cost: $5.50", "Tax: $2.00", "Free: $0.00")

# Pattern 30: Lookbehind — extract number after $
str_extract(prices, "(?<=\\$)\\d+\\.\\d{2}")
#> [1] "19.99" "5.50"  "2.00"  "0.00"

# Pattern 28: Lookahead — extract word before a colon
str_extract(prices, "\\w+(?=:)")
#> [1] "Price" "Cost"  "Tax"   "Free"

# Pattern 29: Negative lookahead — digits NOT followed by a dot
str_extract_all("v2.1 build 42", "\\d+(?!\\.)")
#> [[1]]
#> [1] "1"  "42"
```

The lookbehind `(?<=\\$)` positions the match right after a dollar sign. The digits and dot that follow become the extracted result. The dollar sign itself is not included in the output.

[NOTE]
**Lookbehinds require fixed-width patterns in R's default regex engine.** You can write `(?<=\\$)` (one character) but not `(?<=\\$|USD )` (variable length). If you need variable-length lookbehinds, pass `perl = TRUE` to base R functions or use `regex()` options in stringr.

## Common Mistakes and How to Fix Them

### Mistake 1: Using a single backslash for regex escapes

❌ **Wrong:**
```r
# This causes an "unrecognized escape" error
str_detect("abc123", "\d")
#> Error: '\d' is an unrecognized escape
```

**Why it is wrong:** R interprets `\d` as a string escape sequence before the regex engine ever sees it. You need `\\d` so R passes a literal `\d` to the regex engine.

✅ **Correct:**
```r
str_detect("abc123", "\\d")
#> [1] TRUE
```

### Mistake 2: Expecting . to match only a literal dot

❌ **Wrong:**
```r
# Trying to find filenames with .csv extension
files <- c("data.csv", "dataXcsv", "notes.txt")
str_detect(files, ".csv")
#> [1]  TRUE  TRUE FALSE
```

**Why it is wrong:** The unescaped `.` matches any character, so "dataXcsv" matches too. Both "data.csv" and "dataXcsv" have one character followed by "csv".

✅ **Correct:**
```r
str_detect(files, "\\.csv")
#> [1]  TRUE FALSE FALSE
```

### Mistake 3: Greedy quantifier returns too much text

❌ **Wrong:**
```r
# Extract first HTML tag
html_text <- "<b>bold</b> and <i>italic</i>"
str_extract(html_text, "<.+>")
#> [1] "<b>bold</b> and <i>italic</i>"
```

**Why it is wrong:** The greedy `.+` matches as much as possible, stretching from the first `<` to the last `>`.

✅ **Correct:**
```r
str_extract(html_text, "<.+?>")
#> [1] "<b>"
```

### Mistake 4: Using str_extract() when you need group captures

❌ **Wrong:**
```r
# Want year, month, day separately
str_extract("2026-04-06", "(\\d{4})-(\\d{2})-(\\d{2})")
#> [1] "2026-04-06"
```

**Why it is wrong:** `str_extract()` returns the full match only. The captured groups are discarded.

✅ **Correct:**
```r
str_match("2026-04-06", "(\\d{4})-(\\d{2})-(\\d{2})")
#>      [,1]         [,2]   [,3] [,4]
#> [1,] "2026-04-06" "2026" "04" "06"
```

### Mistake 5: Forgetting that ^ means negation inside brackets

❌ **Wrong:**
```r
# Trying to anchor "abc" at the start
str_detect(c("abc", "xabc"), "[^abc]")
#> [1] FALSE  TRUE
```

**Why it is wrong:** Inside `[]`, the caret means "NOT these characters". The pattern `[^abc]` matches any character that is not a, b, or c. It returns TRUE for "xabc" because "x" is not a, b, or c.

✅ **Correct:**
```r
str_detect(c("abc", "xabc"), "^abc")
#> [1]  TRUE FALSE
```

## Practice Exercises

### Exercise 1: Extract all digits from a string

Given the string `"Order #4521 shipped on 2026-04-06"`, extract all individual digits as a character vector.

```r
# Exercise 1: Extract all digits
my_order <- "Order #4521 shipped on 2026-04-06"

# Hint: use str_extract_all() with \\d
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_order <- "Order #4521 shipped on 2026-04-06"
my_digits <- str_extract_all(my_order, "\\d")
print(my_digits)
#> [[1]]
#>  [1] "4" "5" "2" "1" "2" "0" "2" "6" "0" "4" "0" "6"
```

**Explanation:** `\\d` matches one digit at a time. `str_extract_all()` returns every match as a list of character vectors.

</details>

### Exercise 2: Detect emails from a specific domain

Given a vector of emails, return only those from the domain "company.com".

```r
# Exercise 2: Filter emails by domain
my_emails <- c("alice@company.com", "bob@gmail.com",
               "carol@company.com", "dave@yahoo.com")

# Hint: use str_detect() with an anchor and escaped dot
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_emails <- c("alice@company.com", "bob@gmail.com",
               "carol@company.com", "dave@yahoo.com")
my_result <- my_emails[str_detect(my_emails, "@company\\.com$")]
print(my_result)
#> [1] "alice@company.com" "carol@company.com"
```

**Explanation:** The `$` anchor ensures "company.com" appears at the end. The escaped dot `\\.` prevents matching "companyXcom". The `@` ensures we match the domain part, not a username containing "company.com".

</details>

### Exercise 3: Extract area codes from phone numbers

Given phone numbers in the format "(555) 867-5309", extract just the three-digit area code inside the parentheses.

```r
# Exercise 3: Extract area codes
my_phones <- c("(212) 555-0100", "(415) 555-0199", "(800) 555-0123")

# Hint: use a lookbehind for ( and a lookahead for )
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_phones <- c("(212) 555-0100", "(415) 555-0199", "(800) 555-0123")
my_codes <- str_extract(my_phones, "(?<=\\()\\d{3}(?=\\))")
print(my_codes)
#> [1] "212" "415" "800"
```

**Explanation:** The lookbehind `(?<=\\()` positions after the opening parenthesis. The `\\d{3}` matches exactly three digits. The lookahead `(?=\\))` confirms a closing parenthesis follows. Neither parenthesis appears in the result.

</details>

### Exercise 4: Replace all non-alphanumeric characters with underscores

Clean a vector of filenames by replacing every character that is not a letter, digit, or dot with an underscore.

```r
# Exercise 4: Clean filenames
my_files <- c("my report (final).pdf", "data & charts!.csv",
              "Q1 2026 results.xlsx")

# Hint: use str_replace_all() with a negated character class
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_files <- c("my report (final).pdf", "data & charts!.csv",
              "Q1 2026 results.xlsx")
my_clean <- str_replace_all(my_files, "[^a-zA-Z0-9.]", "_")
print(my_clean)
#> [1] "my_report__final_.pdf"  "data___charts_.csv"    "Q1_2026_results.xlsx"
```

**Explanation:** The negated class `[^a-zA-Z0-9.]` matches anything that is NOT a letter, digit, or dot. Inside character classes, the dot does not need escaping. `str_replace_all()` replaces every match, not just the first.

</details>

### Exercise 5: Extract dollar amounts using lookbehind

From a vector of transaction descriptions, extract the numeric amounts that follow a dollar sign. Return them as numbers, not strings.

```r
# Exercise 5: Extract dollar amounts
my_transactions <- c("Paid $125.50 for groceries",
                      "Received $2000 refund",
                      "Tip: $15.00")

# Hint: combine lookbehind with \\d+\\.?\\d*, then as.numeric()
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_transactions <- c("Paid $125.50 for groceries",
                      "Received $2000 refund",
                      "Tip: $15.00")
my_amounts <- str_extract(my_transactions, "(?<=\\$)\\d+\\.?\\d*")
my_numbers <- as.numeric(my_amounts)
print(my_numbers)
#> [1]  125.5 2000.0   15.0
```

**Explanation:** The lookbehind `(?<=\\$)` matches the position after a dollar sign. The pattern `\\d+\\.?\\d*` matches one or more digits, an optional dot, and zero or more digits. This handles both whole numbers and decimals. The `as.numeric()` converts the character result to a number.

</details>

## Putting It All Together

Let's combine multiple patterns in a realistic task: extracting structured data from messy server log entries.

```r
# Complete example: parse server log entries
log_entries <- c(
  "2026-04-06 08:15:32 [INFO] GET /api/users 200 45ms",
  "2026-04-06 08:15:33 [ERROR] POST /api/orders 500 120ms",
  "2026-04-06 08:15:35 [WARN] GET /api/products 301 12ms",
  "2026-04-06 08:16:01 [INFO] DELETE /api/users/42 204 8ms"
)

# Extract date (pattern 16: exact count)
log_dates <- str_extract(log_entries, "\\d{4}-\\d{2}-\\d{2}")

# Extract log level (pattern 24: capturing group)
log_levels <- str_match(log_entries, "\\[(\\w+)\\]")[, 2]

# Extract HTTP method (pattern 27: alternation)
log_methods <- str_extract(log_entries, "GET|POST|PUT|DELETE")

# Extract endpoint (pattern 22: boundary + class)
log_endpoints <- str_extract(log_entries, "/api/[\\w/]+")

# Extract status code (pattern 30: lookbehind + pattern 16: exact count)
log_status <- str_extract(log_entries, "(?<=\\s)\\d{3}(?=\\s)")

# Extract response time (pattern 30: lookbehind for space)
log_time <- str_extract(log_entries, "\\d+(?=ms)")

# Build a clean data frame
log_df <- data.frame(
  date = log_dates,
  level = log_levels,
  method = log_methods,
  endpoint = log_endpoints,
  status = as.integer(log_status),
  time_ms = as.integer(log_time)
)
print(log_df)
#>         date level method         endpoint status time_ms
#> 1 2026-04-06  INFO    GET      /api/users    200      45
#> 2 2026-04-06 ERROR   POST    /api/orders    500     120
#> 3 2026-04-06  WARN    GET  /api/products    301      12
#> 4 2026-04-06  INFO DELETE /api/users/42    204       8
```

This example uses six different regex patterns from this cheat sheet: exact-count quantifiers, capturing groups, alternation, character classes, lookbehinds, and lookaheads. Each `str_extract()` or `str_match()` call targets one field. The result is a clean data frame ready for analysis.

## Summary

Here is the complete 30-pattern reference in one table.

| # | Category | Pattern | Regex | What It Matches |
|---|----------|---------|-------|-----------------|
| 1 | Literal | Literal text | `abc` | Exact characters |
| 2 | Literal | Any character | `.` | Any char except newline |
| 3 | Literal | Escaped dot | `\\.` | Literal period |
| 4 | Literal | Escaped backslash | `\\\\` | Literal backslash |
| 5 | Literal | Escaped special | `\\$` | Literal dollar sign |
| 6 | Class | Custom set | `[aeiou]` | One char from the set |
| 7 | Class | Range | `[a-z]` | Any lowercase letter |
| 8 | Class | Negated set | `[^0-9]` | Any char NOT in set |
| 9 | Class | Digit | `\\d` | Any digit |
| 10 | Class | Word char | `\\w` | Letter, digit, underscore |
| 11 | Class | Whitespace | `\\s` | Space, tab, newline |
| 12 | Class | POSIX alpha | `[[:alpha:]]` | Any letter (locale-aware) |
| 13 | Quantifier | Zero or one | `?` | 0 or 1 repetition |
| 14 | Quantifier | One or more | `+` | 1 or more (greedy) |
| 15 | Quantifier | Zero or more | `*` | 0 or more (greedy) |
| 16 | Quantifier | Exact count | `{3}` | Exactly 3 repetitions |
| 17 | Quantifier | N or more | `{2,}` | 2 or more repetitions |
| 18 | Quantifier | Range | `{2,4}` | Between 2 and 4 |
| 19 | Quantifier | Lazy | `+?` | 1 or more (shortest) |
| 20 | Anchor | Start | `^` | Beginning of string |
| 21 | Anchor | End | `$` | End of string |
| 22 | Anchor | Word boundary | `\\b` | Edge of a word |
| 23 | Anchor | Non-boundary | `\\B` | NOT at a word edge |
| 24 | Group | Capturing | `(\\d{4})` | Captures for extraction |
| 25 | Group | Non-capturing | `(?:ab)+` | Groups without capturing |
| 26 | Group | Backreference | `(\\w+) \\1` | Matches repeated word |
| 27 | Group | Alternation | `cat\|dog` | Matches either option |
| 28 | Lookaround | Positive lookahead | `(?=...)` | Asserts what follows |
| 29 | Lookaround | Negative lookahead | `(?!...)` | Asserts what does NOT follow |
| 30 | Lookaround | Positive lookbehind | `(?<=...)` | Asserts what precedes |

## FAQ

### What is the difference between grepl() and str_detect()?

Both return TRUE/FALSE for pattern matches. The function `grepl()` is base R and takes the pattern as the first argument: `grepl("abc", x)`. The function `str_detect()` is from stringr and takes the string first: `str_detect(x, "abc")`. The string-first argument order makes `str_detect()` pipe-friendly.

### How do I make regex case-insensitive in stringr?

Wrap the pattern in `regex()` with the `ignore_case` argument: `str_detect(x, regex("hello", ignore_case = TRUE))`. This matches "Hello", "HELLO", "hello", and any other case combination.

### Can I use regex with str_replace_all()?

Yes. Both `str_replace()` and `str_replace_all()` accept regex patterns. The function `str_replace()` replaces only the first match. Use `str_replace_all()` to replace every match in each string.

### Why does \\d need two backslashes in R?

R's string parser interprets the first backslash as an escape character. You need `\\d` so R's parser produces the literal string `\d`, which the regex engine then interprets as "any digit". Other languages with raw strings (like Python's `r"\d"`) don't need the extra backslash.

### How do I test a regex pattern before using it in code?

Use `str_view()` to see matches highlighted in your console. Call `str_view("test string 123", "\\d+")` and stringr marks the matching portions. This is faster than running `str_extract()` and checking output.

## References

1. Wickham, H. — *stringr: Simple, Consistent Wrappers for Common String Operations*. CRAN package documentation. [Link](https://cran.r-project.org/web/packages/stringr/)
2. stringr documentation — Regular expressions vignette. [Link](https://stringr.tidyverse.org/articles/regular-expressions.html)
3. RStudio — *Basic Regular Expressions in R Cheat Sheet*. [Link](https://rstudio.github.io/cheatsheets/regex.pdf)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 15: Regular expressions. [Link](https://r4ds.hadley.nz/regexps.html)
5. R Core Team — *R Documentation: Regular Expressions*. `?regex` help page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/regex.html)
6. RStudio — *Work with Strings: stringr Cheat Sheet*. [Link](https://rstudio.github.io/cheatsheets/html/strings.html)

## What's Next?

- **[stringr in R: 15 Functions That Handle Every String Task](stringr-in-R.html)** — The full stringr tutorial covering `str_split()`, `str_pad()`, `str_trim()`, and 12 more functions with real data examples.
- **[R Cheat Sheet: The Ultimate Quick Reference](R-Cheat-Sheet.html)** — 200 essential R functions organized by category, including base R string functions.
