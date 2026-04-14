---
title: "R Regex Cheat Sheet: 30 Patterns With stringr Examples — Copy and Paste"
slug: "R-Regex-Cheat-Sheet-stringr"
description: "Regex quick reference for R: character classes, quantifiers, anchors, groups, lookaheads with str_detect(), str_extract(), and str_replace() examples."
keywords: "R regex cheat sheet, R regular expressions, stringr regex, str_detect, str_extract, str_replace, R regex patterns, R pattern matching"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "CHT8"
post_type: "FR"
auto_link_terms: "R regex cheat sheet|regex in R|regular expressions in R|R regex patterns|R pattern matching"
auto_link_case_sensitive: false
fr_parent: "stringr-in-R.html"
---


# R Regex Cheat Sheet: 30 Patterns With stringr Examples — Copy and Paste

<p class="lead">Copy-paste regex pattern library for R: 30 patterns across six categories, each paired with a runnable stringr example and the output it produces.</p>

## How Do You Match Literal Text and Escape Metacharacters in R?

Regex starts with matching what you can see — letters, digits, and punctuation. Letters and numbers match themselves, but characters like `.`, `$`, and `(` have special regex meaning and need escaping. In R strings you double the backslash: write `\\.` to match a literal period. Here are the five foundational literal-match patterns with runnable examples.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 1 | Literal text | `abc` | Matches the exact characters "abc" |
| 2 | Any character | `.` | Matches any single character except newline |
| 3 | Escaped dot | `\\.` | Matches a literal period |
| 4 | Escaped backslash | `\\\\` | Matches a literal backslash |
| 5 | Escaped special | `\\$` | Matches a literal dollar sign, bracket, etc. |

The first code block loads stringr, creates the shared `texts` vector used throughout this cheat sheet, and runs three of the five literal-match patterns so you can see the output immediately.

```r
library(stringr)

# Sample texts used throughout the cheat sheet
texts <- c("Order #1234", "Email: bob@mail.com", "Price: $19.99",
           "Phone: 555-867-5309", "Date: 2026-04-06", "Hello World!")

# Pattern 1: Literal text match — detect the exact word "Email"
str_detect(texts, "Email")
#> [1] FALSE  TRUE FALSE FALSE FALSE FALSE

# Pattern 2: . matches any single character (here, between "P" and "ce")
str_extract(texts, "P..ce")
#> [1] NA      NA      "Price" NA      NA      NA

# Pattern 3: Escaped dot matches a literal period, then decimal digits
str_extract(texts, "\\.\\d+")
#> [1] NA    NA    ".99" NA    NA    NA
```

`str_detect()` returns TRUE only for "Email: bob@mail.com" because that is the one string containing the literal word. The `"P..ce"` pattern matches "Price" because each `.` stands in for exactly one character. The final pattern `"\\.\\d+"` finds a literal dot followed by digits and pulls out the ".99" fraction from the price string.

[WARNING]
**R requires double backslashes for regex escapes.** Write `\\d` in R where other languages write `\d`. The first backslash escapes the second for R's string parser; the second backslash reaches the regex engine. Using a single backslash gives an "unrecognized escape" error.

**Try it:** Write a `str_detect()` call that returns TRUE only for strings containing a literal `$` sign. Test it on `ex_prices`.

```r
# Try it: detect the literal $ character
ex_prices <- c("Price: $19.99", "Free", "Cost $0", "No charge")

# Write your code below:
# str_detect(ex_prices, ___)
#> Expected: TRUE FALSE TRUE FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_prices <- c("Price: $19.99", "Free", "Cost $0", "No charge")
str_detect(ex_prices, "\\$")
#> [1]  TRUE FALSE  TRUE FALSE
```

**Explanation:** `$` is a regex anchor meaning "end of string", so you must escape it with `\\$` to match the literal character. Without the escape, the regex engine would try to match an empty position at the end of every string.

</details>

## How Do Character Classes Group Related Characters?

Character classes match one character from a defined set. Square brackets create custom sets like `[aeiou]`. Shorthand classes like `\\d` save typing for common categories — digits, word characters, whitespace.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 6 | Custom set | `[aeiou]` | Matches any one character in the set |
| 7 | Range | `[a-z]` | Matches any lowercase letter |
| 8 | Negated set | `[^0-9]` | Matches any character NOT in the set |
| 9 | Digit shorthand | `\\d` | Matches any digit (same as `[0-9]`) |
| 10 | Word shorthand | `\\w` | Matches a letter, digit, or underscore |
| 11 | Whitespace shorthand | `\\s` | Matches a space, tab, or newline |
| 12 | POSIX alpha | `[[:alpha:]]` | Matches any letter (locale-aware) |

Each shorthand class has an uppercase negation: `\\D` matches non-digits, `\\W` matches non-word characters, and `\\S` matches non-whitespace. The next code block demonstrates the four most common patterns on our sample data plus a messy phone string.

```r
# Sample data: messy whitespace and casing for later examples
messy_data <- c("  extra spaces  ", "MiXeD CaSe", "line1\nline2",
                "file.R", "data.csv", "report.pdf")

# Pattern 6: Custom character set — extract every vowel from "banana"
str_extract_all("banana", "[aeiou]")
#> [[1]]
#> [1] "a" "a" "a"

# Pattern 9: \\d+ pulls out the first run of digits from each string
str_extract(texts, "\\d+")
#> [1] "1234" NA     "19"   "555"  "2026" NA

# Pattern 11: \\s detects any whitespace character (space, tab, or newline)
str_detect(messy_data, "\\s")
#> [1]  TRUE  TRUE  TRUE FALSE FALSE FALSE

# Pattern 8: Negated set — strip every non-digit from a phone number
str_replace_all(texts[4], "[^0-9]", "")
#> [1] "5558675309"
```

The `\\d+` pattern finds the first digit run in each string — "1234" in the order number, "19" before the price decimal, "555" in the phone number. The negated set `[^0-9]` in the last call strips every non-digit character, leaving a clean 10-digit phone number. This is one of the most common data-cleaning patterns in R.

[TIP]
**POSIX classes use double brackets.** Write `[[:digit:]]` not `[:digit:]`. The outer brackets define the character class; the inner `[:digit:]` is the POSIX name. Forgetting the outer brackets causes a subtle wrong-match bug — not an error — because regex treats `[:digit:]` as the set `{:, d, i, g, t}`.

**Try it:** Use a character class to extract every letter (upper or lower case) from `ex_noise`, returning them in a single vector.

```r
# Try it: extract all letters
ex_noise <- "a1b 2c!3D?4E"

# Write your code below:
# str_extract_all(ex_noise, ___)
#> Expected: "a" "b" "c" "D" "E"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_noise <- "a1b 2c!3D?4E"
str_extract_all(ex_noise, "[a-zA-Z]")
#> [[1]]
#> [1] "a" "b" "c" "D" "E"
```

**Explanation:** The range `[a-zA-Z]` covers both lowercase and uppercase letters. `str_extract_all()` returns every match as a list element (one per input string). You could also write `[[:alpha:]]` for a locale-aware version.

</details>

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

Let's see how quantifiers affect extraction on phone numbers and HTML — the two classic examples where greediness catches people off guard.

```r
phones <- c("555-867-5309", "555-12-3456", "1-800-555-0199")

# Pattern 16: Exact count — match runs of exactly 3 digits
str_extract_all(phones[1], "\\d{3}")
#> [[1]]
#> [1] "555" "867" "530"

# Pattern 18: Range — match 2 to 4 consecutive digits
str_extract_all(phones[2], "\\d{2,4}")
#> [[1]]
#> [1] "555"  "12"   "3456"

# Patterns 14 vs 19: Greedy + vs lazy +?
html <- "<b>bold</b> and <i>italic</i>"
str_extract(html, "<.+>")
#> [1] "<b>bold</b> and <i>italic</i>"
str_extract(html, "<.+?>")
#> [1] "<b>"
```

The greedy `<.+>` swallows everything from the first `<` to the last `>` — one huge match. The lazy `<.+?>` stops at the first `>` it finds, returning just the opening `<b>` tag. This is the single most common regex surprise, and it's also why many HTML-scraping bugs exist.

[KEY INSIGHT]
**Greedy grabs the longest possible match. Lazy grabs the shortest.** If your extraction returns too much text, add `?` after the quantifier. If it returns too little, remove the `?`. This one rule explains most "why is my regex returning weird results?" bugs.

**Try it:** Extract every 4-digit year from `ex_years` as a character vector.

```r
# Try it: extract 4-digit years
ex_years <- "Founded in 1776, revised in 1865, amended in 1920 and 2008."

# Write your code below:
# str_extract_all(ex_years, ___)
#> Expected: "1776" "1865" "1920" "2008"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_years <- "Founded in 1776, revised in 1865, amended in 1920 and 2008."
str_extract_all(ex_years, "\\d{4}")
#> [[1]]
#> [1] "1776" "1865" "1920" "2008"
```

**Explanation:** The exact-count quantifier `{4}` forces the regex to match runs of exactly four consecutive digits. Any run shorter or longer is skipped. This is safer than `\\d+` when you specifically want 4-digit years and not, say, zip codes.

</details>

## How Do Anchors Pin Patterns to String Positions?

Anchors match a position, not a character. They answer "where in the string?" without consuming any text. The caret `^` pins a pattern to the start. The dollar sign `$` pins it to the end. Word boundaries `\\b` pin a pattern to the edge of a word.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 20 | Start of string | `^` | Matches the beginning of the string |
| 21 | End of string | `$` | Matches the end of the string |
| 22 | Word boundary | `\\b` | Matches the position between a word and non-word char |
| 23 | Non-word boundary | `\\B` | Matches a position NOT at a word edge |

Anchors are essential for validation. Want to check if a string starts with a digit? Use `^\\d`. Want to confirm a filename ends in `.csv`? Use `\\.csv$`.

```r
words <- c("apple", "pineapple", "app", "application", "grapple")

# Pattern 20: ^ matches at the start only
str_detect(words, "^app")
#> [1]  TRUE FALSE  TRUE  TRUE FALSE

# Pattern 21: $ matches at the end only
str_detect(words, "ple$")
#> [1]  TRUE  TRUE FALSE FALSE  TRUE

# Pattern 22: \\b matches whole words only
str_detect(words, "\\bapp\\b")
#> [1] FALSE FALSE  TRUE FALSE FALSE

# Combined: start + end anchors = exact match
str_detect(words, "^apple$")
#> [1]  TRUE FALSE FALSE FALSE FALSE
```

Without anchors, `"app"` would match anywhere inside a string. The word-boundary pattern `\\bapp\\b` requires "app" to be a complete word, not part of "apple" or "application" — so only the standalone "app" returns TRUE. Combining `^` and `$` creates an exact-match test, a common technique for validation.

[WARNING]
**The caret means different things in different positions.** Outside brackets, `^` is an anchor meaning "start of string". Inside brackets, `[^abc]` means negation — any character that is NOT a, b, or c. Mixing these up produces silently wrong results, not errors.

**Try it:** Return a logical vector indicating which filenames in `ex_files` end with the `.csv` extension (escape the dot properly).

```r
# Try it: detect .csv files
ex_files <- c("data.csv", "report.pdf", "summaryXcsv", "notes.csv")

# Write your code below:
# str_detect(ex_files, ___)
#> Expected: TRUE FALSE FALSE TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_files <- c("data.csv", "report.pdf", "summaryXcsv", "notes.csv")
str_detect(ex_files, "\\.csv$")
#> [1]  TRUE FALSE FALSE  TRUE
```

**Explanation:** `\\.` matches a literal period (the escape prevents it from matching any character), `csv` matches the literal extension, and `$` anchors the match to the end of the string. Without the `$`, "csvfile.txt" would also match; without the `\\.`, "summaryXcsv" would slip through.

</details>

## How Do You Capture Groups and Alternate Patterns?

Groups wrap part of a pattern in parentheses. Capturing groups `()` let you extract submatches. Non-capturing groups `(?:)` organize patterns without capturing. The alternation operator `|` means "this or that".

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 24 | Capturing group | `(\\d{4})` | Captures matched text for extraction |
| 25 | Non-capturing group | `(?:ab)+` | Groups without capturing (for quantifiers) |
| 26 | Backreference | `(\\w+) \\1` | Matches a repeated word |
| 27 | Alternation | `cat\|dog` | Matches "cat" or "dog" |

Use `str_match()` instead of `str_extract()` when you need captured group contents. `str_match()` returns a matrix with the full match in column 1 and each captured group in the following columns.

```r
dates <- c("2026-04-06", "2025-12-25", "2024-01-15")

# Pattern 24: Capturing groups — pull year, month, day separately
str_match(dates, "(\\d{4})-(\\d{2})-(\\d{2})")
#>      [,1]         [,2]   [,3] [,4]
#> [1,] "2026-04-06" "2026" "04" "06"
#> [2,] "2025-12-25" "2025" "12" "25"
#> [3,] "2024-01-15" "2024" "01" "15"

# Pattern 27: Alternation — match either "cat" or "dog"
pets <- c("I have a cat", "She has a dog", "They have a fish")
str_extract(pets, "cat|dog")
#> [1] "cat" "dog" NA

# Pattern 26: Backreference \\1 detects repeated words
typos <- c("the the cat", "a big dog", "is is good")
str_detect(typos, "\\b(\\w+) \\1\\b")
#> [1]  TRUE FALSE  TRUE
```

The backreference `\\1` refers to whatever the first group captured. In the typo detector, `(\\w+) \\1` matches any word followed by a space and the same word again — a lightweight duplicate-word finder. The `str_match()` call returns a matrix so you can index columns: `[, 2]` gives all years, `[, 3]` gives all months, and so on.

[TIP]
**Use str_match() for groups, str_extract() for full matches.** `str_extract()` always returns only the complete match text — your capturing groups get discarded. If you need the year, month, and day from a date pattern as separate values, `str_match()` gives you each group in its own column.

**Try it:** Extract just the 3-digit area code from `ex_phone` using a capturing group and `str_match()`.

```r
# Try it: extract area code
ex_phone <- "(415) 555-0199"

# Write your code below:
# str_match(ex_phone, ___)[, 2]
#> Expected: "415"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_phone <- "(415) 555-0199"
str_match(ex_phone, "\\((\\d{3})\\)")[, 2]
#> [1] "415"
```

**Explanation:** `\\(` and `\\)` match literal parentheses (both are regex metacharacters). The capturing group `(\\d{3})` captures the three digits between them. Indexing `[, 2]` pulls column 2 of the match matrix, which holds the first captured group — the area code without the parentheses.

</details>

## How Do Lookarounds Match Without Consuming Text?

Lookarounds are zero-width assertions. They check what is next to a position without including it in the match. A lookahead checks what follows. A lookbehind checks what precedes. Both are powerful for extracting text next to a known marker without including the marker itself.

| # | Pattern | Regex | Description |
|---|---------|-------|-------------|
| 28 | Positive lookahead | `(?=...)` | Asserts what follows matches |
| 29 | Negative lookahead | `(?!...)` | Asserts what follows does NOT match |
| 30 | Positive lookbehind | `(?<=...)` | Asserts what precedes matches |

These are most useful when you want to grab text adjacent to a delimiter — like the digits after a `$` sign or the word before a colon — without pulling the delimiter into the result.

```r
prices <- c("Price: $19.99", "Cost: $5.50", "Tax: $2.00", "Free: $0.00")

# Pattern 30: Lookbehind — extract the number that follows $
str_extract(prices, "(?<=\\$)\\d+\\.\\d{2}")
#> [1] "19.99" "5.50"  "2.00"  "0.00"

# Pattern 28: Lookahead — extract the word that precedes a colon
str_extract(prices, "\\w+(?=:)")
#> [1] "Price" "Cost"  "Tax"   "Free"

# Pattern 29: Negative lookahead — digits NOT followed by a dot
str_extract_all("v2.1 build 42", "\\d+(?!\\.)")
#> [[1]]
#> [1] "1"  "42"
```

The lookbehind `(?<=\\$)` positions the match right after a dollar sign — the `$` is checked but never included in the extracted text, so the result is a clean numeric string. The lookahead `(?=:)` works the same way but on the right: it matches a word only if a colon follows immediately.

[NOTE]
**Lookbehinds require fixed-width patterns in R's default regex engine.** You can write `(?<=\\$)` (one character) but not `(?<=\\$|USD )` (variable length). If you need variable-length lookbehinds, pass `perl = TRUE` to base R functions or use `stringr::regex()` with the `comments` and engine options.

**Try it:** Extract the label (the word before `=`) from each string in `ex_labels`.

```r
# Try it: extract the left side of key=value pairs
ex_labels <- c("name=alice", "age=30", "country=france")

# Write your code below:
# str_extract(ex_labels, ___)
#> Expected: "name" "age" "country"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_labels <- c("name=alice", "age=30", "country=france")
str_extract(ex_labels, "\\w+(?==)")
#> [1] "name"    "age"     "country"
```

**Explanation:** `\\w+` matches one or more word characters, and the lookahead `(?==)` requires an `=` to follow without including it in the match. The two equals signs look odd but the first is the literal character inside the lookahead `(?=...)`.

</details>

## Practice Exercises

### Exercise 1: Validate email addresses

Given a vector of strings, return a logical vector marking which ones look like valid email addresses. A valid email has word characters, an `@`, more word characters, an escaped dot, and a 2-4 letter extension — all anchored from start to end.

```r
# Capstone 1: email validation
my_emails <- c("alice@company.com", "not-an-email", "bob@test.io",
               "bad@", "carol@sub.domain.org", "@nope.com")

# Hint: combine ^, $, \\w+, @, \\., and [a-zA-Z]{2,4}
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_emails <- c("alice@company.com", "not-an-email", "bob@test.io",
               "bad@", "carol@sub.domain.org", "@nope.com")
my_email_pattern <- "^[\\w.]+@[\\w.]+\\.[a-zA-Z]{2,4}$"
str_detect(my_emails, my_email_pattern)
#> [1]  TRUE FALSE  TRUE FALSE  TRUE FALSE
```

**Explanation:** `^[\\w.]+` requires the string to start with one or more word characters or dots (the username). `@` matches the literal separator. `[\\w.]+\\.` matches the domain name followed by a literal dot. `[a-zA-Z]{2,4}$` matches a 2-4 letter top-level domain anchored at the end. Real-world email validation is much more complex, but this catches the common structural errors.

</details>

### Exercise 2: Parse URLs into scheme, host, and path

Given a vector of URLs, use capturing groups and `str_match()` to pull the scheme (`http` or `https`), the host, and the path into a matrix. Store the result in `my_parts`.

```r
# Capstone 2: parse URLs
my_urls <- c("https://r-statistics.co/posts/index.html",
             "http://example.com/about",
             "https://cran.r-project.org/web/packages/")

# Hint: 3 capturing groups — (https?), ([^/]+), (/.*)
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_urls <- c("https://r-statistics.co/posts/index.html",
             "http://example.com/about",
             "https://cran.r-project.org/web/packages/")
my_parts <- str_match(my_urls, "(https?)://([^/]+)(/.*)")
print(my_parts)
#>      [,1]                                       [,2]    [,3]                 [,4]
#> [1,] "https://r-statistics.co/posts/index.html" "https" "r-statistics.co"    "/posts/index.html"
#> [2,] "http://example.com/about"                 "http"  "example.com"        "/about"
#> [3,] "https://cran.r-project.org/web/packages/" "https" "cran.r-project.org" "/web/packages/"
```

**Explanation:** `(https?)` captures the scheme — the `?` makes the `s` optional. `://` matches the separator literally. `([^/]+)` captures the host by greedily matching any character that is not a forward slash. `(/.*)` captures everything from the first slash onward as the path. Each captured group appears in its own column in the matrix.

</details>

### Exercise 3: Clean and reformat phone numbers

Given a vector of messy phone-number strings, extract only the digits, then reformat to the standard `XXX-XXX-XXXX` pattern. Assume every input has exactly 10 digits.

```r
# Capstone 3: extract digits and reformat
my_raw_phones <- c("(555) 867-5309", "555.867.5309",
                   "555 867 5309", "5558675309")

# Hint: str_replace_all() to strip non-digits,
#       then str_replace() with backreferences to reformat
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_raw_phones <- c("(555) 867-5309", "555.867.5309",
                   "555 867 5309", "5558675309")
my_digits <- str_replace_all(my_raw_phones, "[^0-9]", "")
my_formatted <- str_replace(my_digits,
                            "(\\d{3})(\\d{3})(\\d{4})",
                            "\\1-\\2-\\3")
print(my_formatted)
#> [1] "555-867-5309" "555-867-5309" "555-867-5309" "555-867-5309"
```

**Explanation:** `str_replace_all(..., "[^0-9]", "")` strips every non-digit character, leaving a clean 10-digit string. The second call uses three capturing groups `(\\d{3})(\\d{3})(\\d{4})` to split the digits and backreferences `\\1`, `\\2`, `\\3` in the replacement to insert dashes between them. This is the idiomatic "clean then reformat" pattern for phone numbers.

</details>

## Putting It All Together

Let's combine multiple patterns in a realistic task: extracting structured data from messy server log entries into a clean data frame.

```r
# Complete example: parse server log entries into a data frame
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

# Extract endpoint (pattern 10: word character class + slash)
log_endpoints <- str_extract(log_entries, "/api/[\\w/]+")

# Extract status code (patterns 30 + 16: lookbehind + exact count)
log_status <- str_extract(log_entries, "(?<=\\s)\\d{3}(?=\\s)")

# Extract response time (pattern 28: lookahead for "ms")
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

This single example uses six different pattern families from the cheat sheet: exact-count quantifiers, capturing groups, alternation, character classes, lookbehinds, and lookaheads. Each `str_extract()` or `str_match()` call targets one field. The result is a tidy data frame ready for filtering, grouping, or plotting.

## Summary

Here is the complete 30-pattern reference in one table, sorted by category.

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

Bookmark this table. The fastest way to use it is to open the page, Ctrl+F for the category you need, and copy the runnable example from the section above into your own script.

## References

1. Wickham, H. — *stringr: Simple, Consistent Wrappers for Common String Operations*. CRAN package documentation. [Link](https://cran.r-project.org/web/packages/stringr/)
2. stringr documentation — Regular expressions vignette. [Link](https://stringr.tidyverse.org/articles/regular-expressions.html)
3. RStudio — *Basic Regular Expressions in R Cheat Sheet* (PDF). [Link](https://rstudio.github.io/cheatsheets/regex.pdf)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 15: Regular expressions. [Link](https://r4ds.hadley.nz/regexps.html)
5. R Core Team — *R Documentation: Regular Expressions* (`?regex` help page). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/regex.html)
6. Posit — *Work with Strings: stringr Cheat Sheet* (HTML). [Link](https://rstudio.github.io/cheatsheets/html/strings.html)

## Continue Learning

- **[stringr in R: 15 Functions That Handle Every String Task](stringr-in-R.html)** — The full stringr tutorial covering `str_split()`, `str_pad()`, `str_trim()`, and 12 more functions with real data examples.
- **[R Cheat Sheet: The Ultimate Quick Reference](R-Cheat-Sheet.html)** — 200 essential R functions organized by category, including base R string functions.
- **[lubridate Cheat Sheet for R: Parse and Format Dates](lubridate-Cheat-Sheet-R.html)** — The date-handling companion to this regex sheet, with 20+ parsing and formatting patterns.
