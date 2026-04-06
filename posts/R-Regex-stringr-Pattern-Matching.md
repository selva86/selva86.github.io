---
title: "R Regular Expressions: Pattern Matching with stringr (20 Examples)"
slug: "R-Regex-stringr-Pattern-Matching"
description: "Master R regex with 20 practical stringr examples: character classes, quantifiers, anchors, groups, and lookaheads using str_detect() and str_extract()."
keywords: "R regular expressions, R regex, stringr regex, str_detect regex, str_extract regex, str_replace regex, R pattern matching, R character classes, R regex lookahead, regex in R"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-stri-1"
post_type: "FR"
auto_link_terms: "R regular expressions|R regex|regex in R|regular expressions in R|pattern matching in R"
auto_link_case_sensitive: false
fr_parent: "stringr-in-R.html"
---


# R Regular Expressions: Pattern Matching with stringr (20 Examples)

<p class="lead">Regular expressions (regex) are text patterns that match, extract, and replace strings — and stringr makes them easy to use in R with consistent functions like <code>str_detect()</code>, <code>str_extract()</code>, and <code>str_replace()</code>.</p>

## Introduction

You need to pull phone numbers from messy text, validate email formats, or extract dollar amounts from thousands of rows. Hard-coded string matching with `==` or `grepl()` won't cut it when patterns vary. You need a way to describe *what text looks like* rather than what it literally says.

Regular expressions are a mini-language for describing text patterns. A single regex can match "any sequence of 3 digits followed by a dash" or "a word that starts with a capital letter." Combined with stringr, regex becomes the most powerful string tool in your R toolkit.

In this tutorial, you will work through 20 practical examples organized by regex concept: character classes, quantifiers, anchors, groups, and lookaheads. Each example uses a real stringr function you can run directly in your browser. By the end, you will be able to write regex patterns for the most common text-processing tasks in R.

Let's start by loading stringr and creating sample data we will reuse throughout.

```r
# Load stringr and create reusable sample data
library(stringr)

messy_text <- c("Order #1234 shipped on 2024-03-15",
                "Invoice 5678: $299.99 due",
                "Call (555) 867-5309 for support",
                "Email: user@example.com today")

phones <- c("(555) 867-5309", "555-1234", "(800) 555-0199", "1234567890")

emails <- c("alice@gmail.com", "bob AT yahoo", "carol@company.co.uk", "not-an-email")

cat("Sample data loaded.\n")
#> Sample data loaded.
```

These vectors simulate the kind of messy data you encounter in real projects. We will use them across multiple examples.

## How Do Character Classes Match Specific Characters?

Character classes let you define a *set* of characters to match at a single position. Square brackets `[abc]` match any one of the listed characters. Ranges like `[a-z]` match any lowercase letter. A caret inside brackets `[^abc]` negates the class — it matches any character *except* those listed.

R also provides shorthand classes that save typing. `\\d` matches any digit (same as `[0-9]`), `\\w` matches any word character (letters, digits, underscore), and `\\s` matches any whitespace (spaces, tabs, newlines). Their uppercase counterparts (`\\D`, `\\W`, `\\S`) match the opposite.

[KEY INSIGHT]
**Every backslash in a regex needs a second backslash in R.** The regex engine sees `\d`, but R's string parser consumes one backslash first. So you always write `\\d` in R code to get the regex `\d`.

### Example 1: Extract all digits from mixed text

The first thing you might need from messy text is the numbers hiding inside it. `str_extract_all()` with the pattern `\\d+` pulls out every sequence of one or more digits.

```r
# Example 1: Extract digit sequences from messy text
digits <- str_extract_all(messy_text, "\\d+")
digits
#> [[1]]
#> [1] "1234"   "2024"   "03"     "15"
#>
#> [[2]]
#> [1] "5678"   "299"    "99"
#>
#> [[3]]
#> [1] "555"  "867"  "5309"
#>
#> [[4]]
#> character(0)
```

Each element of the result is a character vector of all matches found in that string. The fourth string has no digits, so it returns an empty vector. Notice that `\\d+` matches *sequences* of digits, not individual digits — the `+` quantifier makes all the difference.

### Example 2: Detect strings containing only letters

Sometimes you need to check whether a string is "clean" — containing only alphabetic characters. You combine a character class with anchors for this.

```r
# Example 2: Check for letter-only strings
words <- c("hello", "world123", "R", "data_frame", "clean")

letter_only <- str_detect(words, "^[a-zA-Z]+$")
data.frame(word = words, letters_only = letter_only)
#>        word letters_only
#> 1     hello         TRUE
#> 2  world123        FALSE
#> 3         R         TRUE
#> 4 data_frame       FALSE
#> 5     clean         TRUE
```

The pattern `^[a-zA-Z]+$` says "from start to end, only letters." The `^` and `$` anchors are critical — without them, `"world123"` would match because it *contains* letters. We will cover anchors in detail in Examples 9-12.

### Example 3: Replace all non-word characters

Cleaning text often means stripping punctuation and special characters. The shorthand `\\W` matches any non-word character (anything that is not a letter, digit, or underscore).

```r
# Example 3: Strip non-word characters
cleaned <- str_replace_all(messy_text, "\\W+", " ")
cleaned
#> [1] "Order 1234 shipped on 2024 03 15"
#> [2] "Invoice 5678 299 99 due"
#> [3] "Call 555 867 5309 for support"
#> [4] "Email user example com today"
```

Every run of non-word characters (colons, hashes, dollar signs, parentheses, dots) gets replaced by a single space. This is a quick way to normalize text before tokenizing or searching. Note that `\\W+` with the `+` collapses consecutive special characters into one space rather than leaving gaps.

### Example 4: Extract non-whitespace tokens

The opposite approach is sometimes useful: extract everything that is *not* whitespace. The pattern `\\S+` matches one or more non-whitespace characters.

```r
# Example 4: Tokenize by extracting non-whitespace sequences
tokens <- str_extract_all(messy_text[1], "\\S+")
tokens
#> [[1]]
#> [1] "Order"      "#1234"      "shipped"    "on"         "2024-03-15"
```

This is a quick-and-dirty tokenizer. Each "word" (including punctuation attached to it) becomes a separate element. For more sophisticated tokenization you would use tidytext, but `\\S+` handles many simple cases.

## How Do Quantifiers Control Pattern Repetition?

Quantifiers specify how many times a pattern element should repeat. The four essential quantifiers are: `?` (zero or one), `+` (one or more), `*` (zero or more), and `{n,m}` (between n and m times). By default, quantifiers are *greedy* — they match as much text as possible.

### Example 5: Extract optional area codes from phone numbers

Phone numbers sometimes have an area code in parentheses and sometimes don't. The `?` quantifier makes a pattern element optional.

```r
# Example 5: Match phone numbers with optional area code
phone_pattern <- "\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}"
str_detect(phones, phone_pattern)
#> [1]  TRUE  TRUE  TRUE  TRUE

str_extract(phones, phone_pattern)
#> [1] "(555) 867-5309" "555-1234"       "(800) 555-0199" "1234567890"
```

The pattern `\\(?` means "an optional opening parenthesis." The `\\d{3}` means "exactly 3 digits." The `[- ]?` means "an optional dash or space." Together this pattern handles all four phone formats in our vector.

### Example 6: Match variable-length words

When you need words of a specific length range, `{n,m}` is your tool. This example extracts words between 3 and 6 characters long.

```r
# Example 6: Extract words of 3-6 characters
sentence <- "I am a data scientist who uses R for analysis"

short_words <- str_extract_all(sentence, "\\b[a-z]{3,6}\\b")
short_words
#> [[1]]
#> [1] "data"     "who"      "uses"     "for"
```

The `\\b` marks a word boundary (we will cover boundaries in the next section). Without boundaries, `"scientist"` would partially match because it contains 3-6 letter substrings. The `{3,6}` quantifier ensures we match only complete words in that length range. Note that "scientist" and "analysis" are excluded because they exceed 6 characters.

### Example 7: Greedy vs lazy extraction

This is where most regex beginners get tripped up. Greedy quantifiers grab the *longest* possible match. Lazy quantifiers (add `?` after the quantifier) grab the *shortest*.

```r
# Example 7: Greedy vs lazy matching
html_text <- '<span class="bold">Hello</span> and <span class="italic">World</span>'

# Greedy: matches from first < to LAST >
greedy <- str_extract(html_text, "<.*>")
greedy
#> [1] "<span class=\"bold\">Hello</span> and <span class=\"italic\">World</span>"

# Lazy: matches from first < to NEXT >
lazy <- str_extract(html_text, "<.*?>")
lazy
#> [1] "<span class=\"bold\">"
```

The greedy `.*` consumed everything from the first `<` to the very last `>`. The lazy `.*?` stopped at the first `>` it found. When extracting from text with repeated delimiters (HTML tags, quoted strings, bracketed sections), lazy quantifiers almost always give you the result you want.

[TIP]
**When in doubt, try the lazy version first.** Add `?` after any quantifier to make it lazy. You can always remove it if you genuinely need the longest match.

### Example 8: Validate fixed-format codes

ZIP codes follow an exact format: 5 digits, optionally followed by a dash and 4 more digits. The `{n}` quantifier enforces exact counts.

```r
# Example 8: Validate US ZIP codes
zips <- c("90210", "90210-1234", "9021", "902101234", "ABCDE")

valid_zip <- str_detect(zips, "^\\d{5}(-\\d{4})?$")
data.frame(zip = zips, valid = valid_zip)
#>         zip valid
#> 1     90210  TRUE
#> 2 90210-1234  TRUE
#> 3      9021 FALSE
#> 4 902101234 FALSE
#> 5     ABCDE FALSE
```

The pattern `^\\d{5}(-\\d{4})?$` reads as: "start, exactly 5 digits, optionally a dash followed by exactly 4 digits, end." The anchors `^` and `$` ensure the *entire* string must match — otherwise `"902101234"` would pass because it contains 5 consecutive digits.

## How Do Anchors and Boundaries Pin Patterns to Positions?

Anchors don't match characters — they match *positions*. The caret `^` matches the start of a string, the dollar sign `$` matches the end, and `\\b` matches a word boundary (the position between a word character and a non-word character). Anchors are essential for validation because without them, a pattern can match anywhere inside a string.

### Example 9: Detect strings starting with a capital letter

A simple anchor at the start ensures your pattern checks the beginning of the string, not just any position.

```r
# Example 9: Check for initial capital letter
sentences <- c("The quick brown fox", "jumped over", "A lazy dog",
               "123 numbers first", "lowercase start")

starts_cap <- str_detect(sentences, "^[A-Z]")
data.frame(sentence = sentences, starts_with_capital = starts_cap)
#>              sentence starts_with_capital
#> 1 The quick brown fox                TRUE
#> 2         jumped over               FALSE
#> 3          A lazy dog                TRUE
#> 4  123 numbers first               FALSE
#> 5     lowercase start               FALSE
```

The pattern `^[A-Z]` says "at position zero, there must be an uppercase letter." Without the `^`, every string containing any uppercase letter anywhere would match.

### Example 10: Extract the last word of a sentence

The `$` anchor pins a pattern to the end of the string. Combined with `\\w+`, it captures the final word.

```r
# Example 10: Get the last word from each string
last_words <- str_extract(sentences, "\\w+$")
last_words
#> [1] "fox"   "over"  "dog"   "first" "start"
```

The pattern `\\w+$` means "one or more word characters at the end of the string." This is cleaner than splitting on spaces and taking the last element. It also handles trailing punctuation — if a sentence ended with `"dog."`, you would use `[a-zA-Z]+` instead of `\\w+` to exclude the period.

### Example 11: Replace whole words only using boundaries

Word boundaries `\\b` prevent accidental partial matches. This is one of the most underused regex features.

```r
# Example 11: Replace only the whole word "cat"
text_boundary <- "The cat sat on the caterpillar's mat near concatenate"

# Without boundaries: breaks "caterpillar" and "concatenate"
str_replace_all(text_boundary, "cat", "dog")
#> [1] "The dog sat on the dogerpillar's mat near condogenate"

# With boundaries: only replaces the standalone word "cat"
str_replace_all(text_boundary, "\\bcat\\b", "dog")
#> [1] "The dog sat on the caterpillar's mat near concatenate"
```

Without `\\b`, the pattern `"cat"` matches inside "caterpillar" and "concatenate," producing nonsense. Adding `\\b` on both sides restricts the match to positions where the word starts and ends. This is critical whenever you do find-and-replace on English text.

[TIP]
**Always wrap search terms in word boundaries when doing text replacement.** The pattern `\\bword\\b` prevents the "caterpillar problem" — accidentally matching inside longer words.

### Example 12: Validate email format

Combining anchors with character classes creates a validation pattern. This example checks for a basic email structure.

```r
# Example 12: Basic email validation
email_pattern <- "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

valid_email <- str_detect(emails, email_pattern)
data.frame(email = emails, valid = valid_email)
#>                 email valid
#> 1     alice@gmail.com  TRUE
#> 2        bob AT yahoo FALSE
#> 3 carol@company.co.uk  TRUE
#> 4        not-an-email FALSE
```

The pattern breaks down as: one or more allowed characters before the `@`, a domain name with dots, and a top-level domain of at least 2 letters. The `^` and `$` anchors ensure the entire string must match the pattern. Real-world email validation is more complex, but this catches the obvious non-emails.

## How Do Groups and Backreferences Capture Subpatterns?

Parentheses `()` create capturing groups. Each group captures the text it matches separately from the full match. `str_match()` returns a matrix where column 1 is the full match and columns 2+ are the groups. Backreferences like `\\1` let you reuse a captured group inside the same pattern or replacement string.

### Example 13: Extract phone number parts with groups

When you need to split a match into components, groups do the work. Each parenthesized subpattern becomes its own column in the `str_match()` result.

```r
# Example 13: Parse phone numbers into area code + number
phone_parts <- str_match(phones, "\\(?(\\d{3})\\)?[- ]?(\\d{3})[- ]?(\\d{4})")
colnames(phone_parts) <- c("full_match", "area_code", "prefix", "line")
phone_parts
#>      full_match       area_code prefix line
#> [1,] "(555) 867-5309" "555"     "867"  "5309"
#> [2,] "555-1234"       "555"     "123"  "4"
#> [3,] "(800) 555-0199" "800"     "555"  "0199"
#> [4,] "1234567890"     "123"     "456"  "7890"
```

[KEY INSIGHT]
**str_match() returns a matrix, not a vector.** Column 1 is the full match. Columns 2, 3, 4, etc. correspond to the first, second, third capturing groups. This is different from `str_extract()`, which only returns the full match.

Each `(\\d{3})` group captures exactly 3 digits. The non-capturing parts (parentheses, dashes, spaces) are matched but not stored in their own columns. This is perfect for structured extraction where you need the pieces, not just the whole.

### Example 14: Swap first and last names with backreferences

Backreferences let you rearrange captured groups in a replacement string. `\\1` refers to the first group, `\\2` to the second.

```r
# Example 14: Swap "First Last" to "Last, First"
names_vec <- c("John Smith", "Jane Doe", "Ada Lovelace")

swapped <- str_replace(names_vec, "(\\w+) (\\w+)", "\\2, \\1")
swapped
#> [1] "Smith, John"     "Doe, Jane"       "Lovelace, Ada"
```

The pattern `(\\w+) (\\w+)` captures two words separated by a space. In the replacement `"\\2, \\1"`, we put the second capture first, add a comma, and then the first capture. This is a common operation when reformatting name columns in data frames.

[TIP]
**Backreferences work in str_replace() but not in str_detect().** Use `\\1`, `\\2` etc. only in the replacement argument. In the pattern itself, backreferences match the same text the group already captured.

### Example 15: Use alternation inside groups

The pipe `|` inside a group matches either alternative. This is like an OR operator for patterns.

```r
# Example 15: Match fruits that are citrus or berry types
fruits <- c("strawberry", "orange", "blueberry", "lemon", "grape",
            "grapefruit", "raspberry", "lime")

citrus_or_berry <- str_detect(fruits, "(berry|orange|lemon|lime|grapefruit)")
data.frame(fruit = fruits, matches = citrus_or_berry)
#>        fruit matches
#> 1 strawberry    TRUE
#> 2     orange    TRUE
#> 3  blueberry    TRUE
#> 4      lemon    TRUE
#> 5      grape   FALSE
#> 6 grapefruit    TRUE
#> 7  raspberry    TRUE
#> 8       lime    TRUE
```

The group `(berry|orange|lemon|lime|grapefruit)` matches if *any* of the alternatives is found. Notice that "strawberry" and "blueberry" match because they contain "berry." Only "grape" fails because it does not contain any of the listed terms.

### Example 16: Use non-capturing groups for cleaner patterns

Sometimes you need grouping for alternation or quantifiers but don't want to capture the match. The syntax `(?:)` creates a non-capturing group.

```r
# Example 16: Non-capturing group for repeated pattern
urls <- c("http://example.com", "https://secure.org", "ftp://files.net")

# (?:s?) makes the "s" optional without creating a capture group
nc_result <- str_match(urls, "(https?)://([\\w.]+)")
colnames(nc_result) <- c("full", "protocol", "domain")
nc_result
#>      full                  protocol domain
#> [1,] "http://example.com"  "http"   "example.com"
#> [2,] "https://secure.org"  "https"  "secure.org"
#> [3,] NA                    NA       NA
```

Here `(https?)` captures "http" or "https" as a group. The `?` after `s` makes the "s" optional. We get two clean columns: protocol and domain. The FTP URL returns NA because it doesn't match the pattern. If we only needed grouping for the alternation and didn't need the capture, we would write `(?:https?)` — but here the capture is useful.

## How Do Lookaheads and Lookbehinds Match Without Consuming?

Lookaround assertions check what comes before or after a position *without including it in the match*. There are four types: positive lookahead `(?=...)` (must be followed by), negative lookahead `(?!...)` (must NOT be followed by), positive lookbehind `(?<=...)` (must be preceded by), and negative lookbehind `(?<!...)` (must NOT be preceded by).

Think of lookarounds as a security guard checking your ID. The guard looks at your ID (the assertion) but doesn't take it from you (doesn't consume it). The match only includes what's outside the lookaround.

### Example 17: Extract dollar amounts using lookbehind

Lookbehinds let you match text that follows a specific prefix without including the prefix in the result.

```r
# Example 17: Extract numbers preceded by a dollar sign
prices <- c("Price: $299.99", "Euro: 150.00", "Cost: $49", "Free: $0")

dollars <- str_extract_all(prices, "(?<=\\$)\\d+\\.?\\d*")
dollars
#> [[1]]
#> [1] "299.99"
#>
#> [[2]]
#> character(0)
#>
#> [[3]]
#> [1] "49"
#>
#> [[4]]
#> [1] "0"
```

The pattern `(?<=\\$)` asserts "there must be a dollar sign immediately before this position." The dollar sign is checked but not included in the extracted text. The Euro amount is skipped because it lacks the `$` prefix. This is much cleaner than extracting `$299.99` and then stripping the `$`.

### Example 18: Find words followed by a comma using lookahead

Lookaheads check what comes *after* the current position without consuming it.

```r
# Example 18: Extract words immediately before a comma
csv_line <- "apple, banana, cherry, date"

before_comma <- str_extract_all(csv_line, "\\w+(?=,)")
before_comma
#> [[1]]
#> [1] "apple"  "banana" "cherry"
```

The pattern `\\w+(?=,)` matches one or more word characters that are followed by a comma. The comma is checked but not included in the match. Notice that "date" is not extracted because it's not followed by a comma. This technique is useful for parsing delimited text when you need context-aware extraction.

### Example 19: Match numbers not preceded by a minus sign

Negative lookbehinds exclude matches that have a specific prefix.

```r
# Example 19: Extract positive numbers only (no minus sign before them)
numbers_text <- "Scores: 42, -7, 100, -3, 88"

positive_nums <- str_extract_all(numbers_text, "(?<!-)\\b\\d+")
positive_nums
#> [[1]]
#> [1] "42"  "100" "88"
```

The pattern `(?<!-)\\b\\d+` says "match digits at a word boundary, but only if there's no minus sign immediately before." The negative lookbehind `(?<!-)` rejects matches where a minus precedes the number. This correctly filters out -7 and -3 while keeping 42, 100, and 88.

[NOTE]
**R's regex engine (ICU) requires fixed-width lookbehinds.** You can use exact patterns like `(?<=\\$)` or `(?<!-)`, but not variable-length patterns like `(?<=\\$+)` with quantifiers inside the lookbehind.

### Example 20: Validate password strength with multiple lookaheads

You can chain multiple lookaheads to enforce several conditions at the same position. This is a classic regex technique for validation.

```r
# Example 20: Check password requirements
# At least 8 chars, one uppercase, one lowercase, one digit
passwords <- c("Abcdef1!", "short1A", "nouppercase1", "NOLOWER1", "NoDigits!")

password_pattern <- "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$"
strong <- str_detect(passwords, password_pattern)
data.frame(password = passwords, meets_requirements = strong)
#>       password meets_requirements
#> 1     Abcdef1!               TRUE
#> 2      short1A              FALSE
#> 3 nouppercase1              FALSE
#> 4     NOLOWER1              FALSE
#> 5    NoDigits!              FALSE
```

Each `(?=.*[X])` lookahead asserts "somewhere in this string, there must be a character matching [X]." The final `.{8,}` requires at least 8 characters total. Because lookaheads don't consume text, all three checks happen from the same starting position. Only "Abcdef1!" passes all requirements.

[WARNING]
**Stacking too many lookaheads makes patterns unreadable.** For complex validation with 4+ conditions, consider using multiple `str_detect()` calls and combining with `&` instead of one massive regex.

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting to double-escape backslashes in R

❌ **Wrong:**
```r
# This throws an error: unrecognized escape
str_detect("hello123", "\d+")
#> Error: '\d' is an unrecognized escape in character string
```

**Why it is wrong:** R's string parser interprets `\d` as an escape sequence before the regex engine ever sees it. Since `\d` is not a valid R escape, you get an error.

✅ **Correct:**
```r
# Double-escape: R sees \\d, regex engine sees \d
str_detect("hello123", "\\d+")
#> [1] TRUE
```

### Mistake 2: Missing anchors in validation patterns

❌ **Wrong:**
```r
# Intended: check if string is ONLY digits
str_detect("abc123xyz", "\\d+")
#> [1] TRUE
```

**Why it is wrong:** Without anchors, `\\d+` matches the "123" inside the string. The function reports TRUE even though the string is not all digits.

✅ **Correct:**
```r
# Anchors ensure the ENTIRE string must be digits
str_detect("abc123xyz", "^\\d+$")
#> [1] FALSE

str_detect("123", "^\\d+$")
#> [1] TRUE
```

### Mistake 3: Greedy quantifiers capturing too much

❌ **Wrong:**
```r
# Trying to extract the first quoted word
text_greedy <- 'She said "hello" and then "goodbye"'
str_extract(text_greedy, '".*"')
#> [1] "\"hello\" and then \"goodbye\""
```

**Why it is wrong:** The greedy `.*` matches from the first quote to the *last* quote, gobbling up everything in between.

✅ **Correct:**
```r
# Lazy quantifier stops at the first closing quote
str_extract(text_greedy, '".*?"')
#> [1] "\"hello\""
```

### Mistake 4: Using str_extract when str_extract_all is needed

❌ **Wrong:**
```r
# Expecting all matches, but getting only the first
str_extract("Order 1234 and 5678", "\\d+")
#> [1] "1234"
```

**Why it is wrong:** `str_extract()` returns only the *first* match per string. The second number "5678" is silently ignored.

✅ **Correct:**
```r
# str_extract_all returns ALL matches
str_extract_all("Order 1234 and 5678", "\\d+")
#> [[1]]
#> [1] "1234" "5678"
```

### Mistake 5: Putting quantifiers inside character classes

❌ **Wrong:**
```r
# Intended: one or more digits. Actual: a digit or a literal +
str_extract("abc+123", "[\\d+]")
#> [1] "+"
```

**Why it is wrong:** Inside `[]`, the `+` is treated as a literal character, not a quantifier. The class `[\\d+]` matches "a digit OR a plus sign."

✅ **Correct:**
```r
# Quantifier goes OUTSIDE the character class
str_extract("abc+123", "\\d+")
#> [1] "123"
```

## Practice Exercises

### Exercise 1: Extract all 4-digit years from text

Extract every 4-digit number (likely a year) from the text below. Your result should be a character vector.

```r
# Exercise 1: Extract 4-digit years
my_text <- "Events in 1969, 1989, and 2024 changed history. See page 42."

# Hint: use str_extract_all() with a pattern for exactly 4 digits
# surrounded by word boundaries

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_years <- str_extract_all(my_text, "\\b\\d{4}\\b")
my_years
#> [[1]]
#> [1] "1969" "1989" "2024"
```

**Explanation:** The pattern `\\b\\d{4}\\b` matches exactly 4 digits surrounded by word boundaries. The boundaries prevent matching the first 4 digits of a longer number. The number 42 is excluded because it has only 2 digits.

</details>

### Exercise 2: Validate phone numbers in (XXX) XXX-XXXX format

Check which strings match the exact format `(XXX) XXX-XXXX` where X is a digit.

```r
# Exercise 2: Validate strict phone format
my_phones <- c("(555) 867-5309", "555-867-5309", "(800) 555-0199",
               "(12) 345-6789", "(555) 867-53091")

# Hint: use anchors and exact quantifiers {3} and {4}

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_valid <- str_detect(my_phones, "^\\(\\d{3}\\) \\d{3}-\\d{4}$")
data.frame(phone = my_phones, valid = my_valid)
#>             phone valid
#> 1  (555) 867-5309  TRUE
#> 2    555-867-5309 FALSE
#> 3  (800) 555-0199  TRUE
#> 4   (12) 345-6789 FALSE
#> 5 (555) 867-53091 FALSE
```

**Explanation:** The pattern `^\\(\\d{3}\\) \\d{3}-\\d{4}$` enforces the exact format. `\\(` and `\\)` match literal parentheses. `\\d{3}` requires exactly 3 digits. The anchors `^` and `$` ensure nothing extra appears before or after.

</details>

### Exercise 3: Extract domain names from email addresses

Given a vector of email addresses, extract just the domain name (everything after the `@` sign, excluding the top-level domain).

```r
# Exercise 3: Extract domains from emails
my_emails <- c("alice@gmail.com", "bob@company.co.uk", "carol@university.edu")

# Hint: use a lookbehind for @ and groups or a character class
# to match the domain portion

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_domains <- str_extract(my_emails, "(?<=@)[\\w.-]+")
my_domains
#> [1] "gmail.com"        "company.co.uk"    "university.edu"
```

**Explanation:** The positive lookbehind `(?<=@)` asserts the `@` must precede the match without including it. Then `[\\w.-]+` captures the domain name including dots and hyphens. This extracts the full domain after the `@` symbol.

</details>

### Exercise 4: Parse product codes into components

Product codes follow the format `CAT-1234-XL` (2-3 letter category, dash, 4 digits, dash, 1-3 letter size). Extract all three components into separate columns using `str_match()`.

```r
# Exercise 4: Parse structured product codes
my_codes <- c("SH-1001-M", "EL-2345-XL", "FD-9999-S", "HW-0042-XXL")

# Hint: use str_match() with three capturing groups
# Each group captures one component

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_parts <- str_match(my_codes, "^([A-Z]{2,3})-(\\d{4})-([A-Z]{1,3})$")
colnames(my_parts) <- c("full", "category", "number", "size")
my_parts
#>      full          category number size
#> [1,] "SH-1001-M"  "SH"     "1001" "M"
#> [2,] "EL-2345-XL" "EL"     "2345" "XL"
#> [3,] "FD-9999-S"  "FD"     "9999" "S"
#> [4,] "HW-0042-XXL" "HW"    "0042" "XXL"
```

**Explanation:** Three capturing groups separate the code into parts. `([A-Z]{2,3})` captures 2-3 uppercase letters. `(\\d{4})` captures exactly 4 digits. `([A-Z]{1,3})` captures 1-3 uppercase letters. The anchors ensure the entire string matches the expected format.

</details>

## Putting It All Together

Let's combine everything from this tutorial in a realistic pipeline. You have a messy data frame of customer records and need to extract, validate, and clean multiple fields using regex.

```r
# Complete example: Clean a messy customer dataset
library(dplyr)

customers <- data.frame(
  raw = c(
    "John Smith | (555) 867-5309 | john@email.com | $150.00",
    "Jane Doe | 555-1234 | jane AT mail | $75.50",
    "Bob Lee | (800) 555-0199 | bob@work.org | Free",
    "Ann Park|(312) 555-8888|ann@site.co.uk|$2,500.00"
  )
)

clean_df <- customers |>
  mutate(
    name       = str_extract(raw, "^[A-Za-z]+ [A-Za-z]+"),
    phone      = str_extract(raw, "\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}"),
    email      = str_extract(raw, "[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}"),
    amount     = as.numeric(str_replace_all(
                   str_extract(raw, "(?<=\\$)[\\d,.]+"), ",", "")),
    valid_phone = str_detect(phone, "^\\(\\d{3}\\) \\d{3}-\\d{4}$"),
    valid_email = !is.na(email)
  ) |>
  select(-raw)

clean_df
#>       name          phone          email  amount valid_phone valid_email
#> 1 John Smith (555) 867-5309 john@email.com 150.00        TRUE        TRUE
#> 2   Jane Doe       555-1234           <NA>  75.50       FALSE       FALSE
#> 3    Bob Lee (800) 555-0199   bob@work.org     NA        TRUE        TRUE
#> 4   Ann Park (312) 555-8888 ann@site.co.uk 2500.00       TRUE        TRUE
```

[KEY INSIGHT]
**Regex shines when you combine concepts in a pipeline.** Character classes extract names, quantifiers match phone formats, groups and anchors validate emails, and lookbehinds pull dollar amounts — all in a single dplyr chain.

This pipeline uses character classes to extract names, quantifiers to match phone formats, groups and anchors to validate emails, and lookbehinds to pull dollar amounts. Jane's email fails validation because "AT" is not `@`. Bob's amount is NA because "Free" has no dollar sign prefix. Every technique from the tutorial works together in a real workflow.

## Summary

| Regex Concept | Key Syntax | Best stringr Function | When to Use |
|---|---|---|---|
| Character classes | `[a-z]`, `\\d`, `\\w`, `\\s` | `str_extract()`, `str_replace_all()` | Match specific character types |
| Quantifiers | `?`, `+`, `*`, `{n,m}`, `*?` | `str_extract()`, `str_detect()` | Control how many characters to match |
| Anchors / boundaries | `^`, `$`, `\\b` | `str_detect()`, `str_replace_all()` | Pin patterns to positions, validate formats |
| Groups / backreferences | `()`, `\\1`, `(?:)` | `str_match()`, `str_replace()` | Capture subpatterns, rearrange text |
| Lookaround assertions | `(?=)`, `(?!)`, `(?<=)`, `(?<!)` | `str_extract()`, `str_detect()` | Match context without consuming it |

The key takeaway: regex describes *what text looks like*, and stringr gives you consistent, pipeable functions to act on those descriptions. Start with simple patterns (character classes + quantifiers) and add complexity (anchors, groups, lookarounds) only when needed.

## FAQ

**What is the difference between str_extract() and str_match()?**

`str_extract()` returns the full match as a character vector. `str_match()` returns a matrix with the full match in column 1 and each capturing group in subsequent columns. Use `str_extract()` when you just need the matched text. Use `str_match()` when you need to pull apart subpatterns (like area code and phone number separately).

**How do I make regex case-insensitive in stringr?**

Wrap the pattern in `regex()` with the `ignore_case` argument: `str_detect(x, regex("pattern", ignore_case = TRUE))`. This affects the entire pattern. You can also use a character class like `[Aa]` to make specific characters case-insensitive.

**Can I use regex with dplyr filter()?**

Yes. Combine `str_detect()` inside `filter()`: `df |> filter(str_detect(column, "pattern"))`. This keeps only rows where the column matches the regex. You can negate it with `!str_detect()` to exclude matches.

**What is the difference between a word boundary and start/end anchors?**

`^` and `$` match the start and end of the entire string. `\\b` matches the boundary between a word character and a non-word character — it can occur anywhere inside the string. Use `^`/`$` for format validation (the whole string must match). Use `\\b` for whole-word searches within text.

**How do I debug a regex that doesn't match?**

Build the pattern incrementally. Start with the simplest part and add one piece at a time. Test each step with `str_detect()` on a known-good string. Check for the double-backslash issue first — it causes most "pattern not found" errors in R. The `str_view()` function highlights matches visually, which helps spot where a pattern fails.

## References

1. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 15: Regular Expressions. [Link](https://r4ds.hadley.nz/regexps)
2. Wickham, H. — stringr: Simple, Consistent Wrappers for Common String Operations. CRAN. [Link](https://cran.r-project.org/package=stringr)
3. stringr documentation — Regular Expressions vignette. [Link](https://stringr.tidyverse.org/articles/regular-expressions.html)
4. R Core Team — Regular Expressions as used in R (`?regex`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/regex.html)
5. Friedl, J.E.F. — *Mastering Regular Expressions*, 3rd Edition. O'Reilly (2006).
6. Sanchez, G. — *Handling Strings with R*. Chapter 15: Boundaries and Lookarounds. [Link](https://www.gastonsanchez.com/r4strings/boundaries.html)
7. ICU Regular Expressions Documentation. [Link](https://unicode-org.github.io/icu/userguide/strings/regexp.html)

## What's Next?

- **[stringr in R](stringr-in-R.html)** — The parent tutorial covering all 15 essential stringr functions. If you want the full picture of string manipulation beyond regex, start here.
- **[lubridate in R](lubridate-in-R.html)** — Dates are the other common "messy text" problem. Learn how lubridate parses, extracts, and computes with dates and times.
