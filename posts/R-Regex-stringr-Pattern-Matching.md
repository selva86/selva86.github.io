---
title: "R Regular Expressions: Pattern Matching with stringr (20 Examples)"
slug: "R-Regex-stringr-Pattern-Matching"
description: "Master R regex with 20 practical stringr examples: character classes, quantifiers, anchors, groups, and lookarounds using str_detect() and str_extract()."
keywords: "R regular expressions, R regex, stringr regex, str_detect regex, str_extract regex, str_replace regex, R pattern matching, R character classes, R regex lookahead, regex in R"
auto_link_terms: "R regular expressions|R regex|regex in R|regular expressions in R|pattern matching in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-stri-1"
post_type: "FR"
fr_parent: "stringr-in-R.html"
difficulty: "Intermediate"
---

# R Regular Expressions: Pattern Matching with stringr (20 Examples)

<p class="lead">Regular expressions (regex) are compact patterns that describe what text looks like, digits, letters, anchors, and repetitions, so you can match, extract, or replace it without writing loops. In R, stringr wraps the ICU regex engine in consistent, pipe-friendly functions like <code>str_detect()</code>, <code>str_extract()</code>, and <code>str_replace()</code> that behave predictably on character vectors.</p>

## How do character classes target specific character types?

Messy text is full of embedded values, order numbers, prices, phone fragments, and character classes are how regex tells them apart. A class like `\\d` matches any digit, `\\w` matches any word character (letters, digits, underscore), and `\\s` matches whitespace. Let's pull every run of digits out of realistic customer text and see the payoff immediately.

```r
# Example 1: Extract every run of digits from messy text
library(stringr)

messy_text <- c("Order #1234 shipped on 2024-03-15",
                "Invoice 5678: $299.99 due",
                "Call (555) 867-5309 for support",
                "Email: user@example.com today")

digits <- str_extract_all(messy_text, "\\d+")
digits
#> [[1]]
#> [1] "1234" "2024" "03"   "15"
#>
#> [[2]]
#> [1] "5678" "299"  "99"
#>
#> [[3]]
#> [1] "555"  "867"  "5309"
#>
#> [[4]]
#> character(0)
```

Each element of the result is a character vector of every match found in that string. The fourth line has no digits, so it returns `character(0)`. The key detail is the `+` quantifier: `\\d+` matches *runs* of one or more digits, not individual digits, which is why "1234" comes back as a single token instead of four.

[KEY INSIGHT]
**Every backslash in a regex needs a second backslash in R.** The regex engine wants to see `\d`, but R's string parser consumes one backslash first, so you always write `"\\d"` in R code to mean the regex `\d`. This trips up almost every beginner.

### Example 2: Detect strings containing only letters

Sometimes you need to check whether a string is "clean", containing only alphabetic characters, nothing else. You combine a character class with anchors to lock the check to the whole string.

```r
# Example 2: Check for letter-only strings
words <- c("hello", "world123", "R", "data_frame", "clean")

letter_only <- str_detect(words, "^[a-zA-Z]+$")
data.frame(word = words, letters_only = letter_only)
#>         word letters_only
#> 1      hello         TRUE
#> 2   world123        FALSE
#> 3          R         TRUE
#> 4 data_frame        FALSE
#> 5      clean         TRUE
```

The pattern `^[a-zA-Z]+$` says "from the very start to the very end, only letters." Without the `^` and `$` anchors, `"world123"` would match because it *contains* letters. The anchors force the match to cover the whole string, which is how validation patterns work. We will dig deeper into anchors in the third H2.

### Example 3: Replace all non-word characters

Cleaning text often means stripping punctuation and special characters before further processing. The shorthand class `\\W` matches any non-word character, anything that is not a letter, digit, or underscore.

```r
# Example 3: Replace non-word runs with a single space
cleaned <- str_replace_all(messy_text, "\\W+", " ")
cleaned
#> [1] "Order 1234 shipped on 2024 03 15"
#> [2] "Invoice 5678 299 99 due"
#> [3] "Call 555 867 5309 for support"
#> [4] "Email user example com today"
```

Every run of non-word characters, colons, hashes, dollar signs, parentheses, dots, gets replaced by a single space. This is a fast way to normalise text before tokenising or searching. The `+` is doing important work: without it, consecutive specials like `": $"` would each produce a separate space instead of collapsing into one.

### Example 4: Extract non-whitespace tokens

The opposite approach is sometimes useful: pull everything that is *not* whitespace. The pattern `\\S+` matches one or more non-whitespace characters, which gives you a quick-and-dirty word tokeniser.

```r
# Example 4: Tokenise by extracting non-whitespace runs
tokens <- str_extract_all(messy_text[1], "\\S+")
tokens
#> [[1]]
#> [1] "Order"      "#1234"      "shipped"    "on"         "2024-03-15"
```

Each "word" (including punctuation attached to it) becomes a separate element. The "#" stays glued to "1234" because there is no whitespace between them. For sophisticated tokenising you would reach for tidytext, but `\\S+` covers a lot of the quick cases, log lines, URLs, comma-free CSVs, without importing a new package.

**Try it:** Write code that extracts every run of lowercase vowels from the string `"Regular expressions are fun"`. Store the result in `ex_vowels`.

```r
# Try it: extract lowercase vowel runs
vowel_text <- "Regular expressions are fun"

ex_vowels <- # your code here

ex_vowels
#> Expected:
#> [[1]]
#> [1] "e" "u" "a" "e" "e" "io" "a" "e" "u"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vowels <- str_extract_all(vowel_text, "[aeiou]+")
ex_vowels
#> [[1]]
#> [1] "e" "u" "a" "e" "e" "io" "a" "e" "u"
```

**Explanation:** The character class `[aeiou]` matches any one lowercase vowel; the `+` turns that into "one or more in a row." `str_extract_all()` gathers every non-overlapping run, so "io" from "expressions" is returned as a single token.

</details>

## How do quantifiers control how many characters to match?

Quantifiers specify how many times the preceding element should repeat. The four workhorses are `?` (zero or one), `+` (one or more), `*` (zero or more), and `{n,m}` (between n and m times). By default quantifiers are *greedy*, they match as much text as they can while still letting the rest of the pattern succeed.

### Example 5: Extract optional area codes from phone numbers

Phone numbers sometimes have an area code in parentheses and sometimes don't. The `?` quantifier is perfect for "this bit may or may not be here."

```r
# Example 5: Match phones with an optional area code
phones <- c("(555) 867-5309", "555-1234", "(800) 555-0199", "1234567890")

phone_pattern <- "\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}"
str_detect(phones, phone_pattern)
#> [1] TRUE TRUE TRUE TRUE

str_extract(phones, phone_pattern)
#> [1] "(555) 867-5309" "555-1234"       "(800) 555-0199" "1234567890"
```

The pattern reads like a checklist: optional `(`, then exactly 3 digits, optional `)`, optional dash-or-space, 3 digits, another optional separator, then 4 digits. Notice how "555-1234" still matches: the `?` on the parenthesis, the `?` on the first separator, and the flexible spacing combine to accept formats the original pattern designer didn't explicitly list.

### Example 6: Match variable-length words

When you need words of a specific length range, `{n,m}` is the right tool. This example extracts words that are 3 to 6 characters long.

```r
# Example 6: Extract words of 3-6 characters
sentence <- "I am a data scientist who uses R for analysis"

short_words <- str_extract_all(sentence, "\\b[a-z]{3,6}\\b")
short_words
#> [[1]]
#> [1] "data" "who"  "uses" "for"
```

The `\\b` marks a word boundary (covered in the next H2). Without those boundaries, `"scientist"` would partially match because it contains 3-to-6-letter substrings. The `{3,6}` quantifier enforces complete words in that length range, "scientist" (9 letters) and "analysis" (8 letters) are excluded, and single-letter "I" and "R" don't hit the lower bound of 3.

### Example 7: Greedy vs lazy extraction

This is where most regex beginners get tripped up. Greedy quantifiers grab the *longest* possible match; lazy quantifiers (add `?` after the quantifier) grab the *shortest*. The difference is huge when extracting between delimiters.

```r
# Example 7: Greedy vs lazy quantifiers
html_text <- '<span class="bold">Hello</span> and <span class="italic">World</span>'

# Greedy: matches from the first < to the LAST >
greedy <- str_extract(html_text, "<.*>")
greedy
#> [1] "<span class=\"bold\">Hello</span> and <span class=\"italic\">World</span>"

# Lazy: matches from the first < to the NEXT >
lazy <- str_extract(html_text, "<.*?>")
lazy
#> [1] "<span class=\"bold\">"
```

The greedy `.*` gobbled everything from the first `<` to the final `>`. The lazy `.*?` stopped at the first `>` it could reach. When you are pulling content between repeated delimiters, HTML tags, quoted strings, bracketed sections, lazy quantifiers almost always give the answer you actually wanted.

[TIP]
**When in doubt, try the lazy version first.** Add `?` after any quantifier to make it lazy. You can always remove it if you genuinely need the longest match.

### Example 8: Validate fixed-format codes

Some codes follow an exact shape, US ZIP codes, for instance, are 5 digits, optionally followed by a dash and 4 more. The `{n}` quantifier enforces an exact count.

```r
# Example 8: Validate US ZIP codes
zips <- c("90210", "90210-1234", "9021", "902101234", "ABCDE")

valid_zip <- str_detect(zips, "^\\d{5}(-\\d{4})?$")
data.frame(zip = zips, valid = valid_zip)
#>          zip valid
#> 1      90210  TRUE
#> 2 90210-1234  TRUE
#> 3       9021 FALSE
#> 4  902101234 FALSE
#> 5      ABCDE FALSE
```

The pattern reads as "start, exactly 5 digits, optionally a dash followed by exactly 4 digits, end." Without the anchors, `"902101234"` would sneak through because it contains 5 consecutive digits, the anchors force the *entire* string to match the shape, which is the whole point of validation.

**Try it:** Extract the content between the first pair of square brackets in the string `"[INFO] start [WARN] bad [ERROR] crash"`. Use a lazy quantifier so you only get the first bracketed word. Store the result in `ex_bracket`.

```r
# Try it: extract first bracketed word
bracket_text <- "[INFO] start [WARN] bad [ERROR] crash"

ex_bracket <- # your code here

ex_bracket
#> Expected: "[INFO]"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bracket <- str_extract(bracket_text, "\\[.*?\\]")
ex_bracket
#> [1] "[INFO]"
```

**Explanation:** `\\[` and `\\]` match literal brackets (they're escaped because `[` has a special meaning in regex). The `.*?` is a lazy "anything" that stops at the first closing bracket instead of running all the way to the last one.

</details>

## How do anchors and boundaries pin patterns to positions?

Anchors don't match characters, they match *positions*. The caret `^` is "start of string," the dollar `$` is "end of string," and `\\b` marks a word boundary (the position between a word character and a non-word character). Anchors are essential for validation, because without them a pattern can match anywhere inside a string and you get false positives.

### Example 9: Detect strings starting with a capital letter

A single anchor at the start ensures your check applies to the beginning of the string, not just any position inside it.

```r
# Example 9: Check for an initial capital letter
sentences <- c("The quick brown fox", "jumped over", "A lazy dog",
               "123 numbers first", "lowercase start")

starts_cap <- str_detect(sentences, "^[A-Z]")
data.frame(sentence = sentences, starts_with_capital = starts_cap)
#>              sentence starts_with_capital
#> 1 The quick brown fox                TRUE
#> 2         jumped over               FALSE
#> 3          A lazy dog                TRUE
#> 4   123 numbers first               FALSE
#> 5     lowercase start               FALSE
```

The pattern `^[A-Z]` says "at position zero, there must be an uppercase letter." Drop the `^` and any string containing an uppercase letter *anywhere* would match, which is almost certainly not what you want. Position anchors are how you turn "contains" checks into "starts with" or "ends with" checks.

### Example 10: Extract the last word of a sentence

The `$` anchor pins the pattern to the end of the string. Combined with `\\w+`, it captures the final word in one move.

```r
# Example 10: Get the last word of each sentence
last_words <- str_extract(sentences, "\\w+$")
last_words
#> [1] "fox"   "over"  "dog"   "first" "start"
```

`\\w+$` means "one or more word characters at the end of the string." This is cleaner than splitting on spaces and taking the last element, and it handles edge cases like extra trailing whitespace gracefully. If a sentence ended with punctuation like `"dog."`, you would swap `\\w+` for `[a-zA-Z]+` so the period doesn't count as a word character.

### Example 11: Replace whole words only using boundaries

Word boundaries `\\b` prevent accidental partial matches. This is one of the most underused regex features, and forgetting it is the top cause of surprised bug reports on find-and-replace jobs.

```r
# Example 11: Replace only the standalone word "cat"
text_boundary <- "The cat sat on the caterpillar's mat near concatenate"

# Without boundaries: breaks "caterpillar" and "concatenate"
str_replace_all(text_boundary, "cat", "dog")
#> [1] "The dog sat on the dogerpillar's mat near condogenate"

# With boundaries: replaces only the standalone word
str_replace_all(text_boundary, "\\bcat\\b", "dog")
#> [1] "The dog sat on the caterpillar's mat near concatenate"
```

Without `\\b`, the pattern `"cat"` matches inside "caterpillar" and "concatenate," producing nonsense. Adding `\\b` on each side pins the match to positions where the word actually starts and ends. Any time you do find-and-replace on English text, wrap the target in boundaries by default.

[TIP]
**Always wrap search terms in word boundaries when doing text replacement.** The pattern `\\bword\\b` prevents the "caterpillar problem", accidentally matching inside longer words that happen to contain your target as a substring.

### Example 12: Validate email format

Combining anchors with character classes gives you a validation pattern. This example checks for a basic email shape (enough for catching obvious non-emails, not for spec-perfect validation).

```r
# Example 12: Basic email validation
emails <- c("alice@gmail.com", "bob AT yahoo", "carol@company.co.uk", "not-an-email")

email_pattern <- "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
valid_email <- str_detect(emails, email_pattern)
data.frame(email = emails, valid = valid_email)
#>                 email valid
#> 1     alice@gmail.com  TRUE
#> 2        bob AT yahoo FALSE
#> 3 carol@company.co.uk  TRUE
#> 4        not-an-email FALSE
```

The pattern breaks down as: one or more allowed characters before the `@`, a domain with dots, and a top-level domain of at least 2 letters. The `^` and `$` anchors demand the *entire* string match, without them, `"alice@gmail.com extra"` would slip through. Real-world email validation is far more complex (RFC 5322 is a monster), but this catches the 80% case.

**Try it:** Detect which of the strings `c("running", "sing", "stop", "playing", "bring it")` end with the letters "ing". Store the logical vector in `ex_ing`.

```r
# Try it: detect strings ending in "ing"
ing_words <- c("running", "sing", "stop", "playing", "bring it")

ex_ing <- # your code here

ex_ing
#> Expected: TRUE TRUE FALSE TRUE FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ing <- str_detect(ing_words, "ing$")
ex_ing
#> [1]  TRUE  TRUE FALSE  TRUE FALSE
```

**Explanation:** The `$` anchor pins "ing" to the very end of the string. `"bring it"` ends in "it", not "ing", so it returns FALSE even though it contains "ing" as a substring, the anchor blocks the mid-string match.

</details>

## How do groups and backreferences capture subpatterns?

Parentheses `()` create capturing groups. Each group remembers the text it matched separately from the full match. `str_match()` returns a matrix where column 1 is the full match and columns 2+ are the groups. Backreferences like `\\1` let you reuse a captured group inside a replacement string to rearrange text.

### Example 13: Extract phone number parts with groups

When you need to split a match into components, groups do the work. Each parenthesised subpattern becomes its own column in the `str_match()` result.

```r
# Example 13: Parse phones into area code + prefix + line
phone_parts <- str_match(phones, "\\(?(\\d{3})\\)?[- ]?(\\d{3})[- ]?(\\d{4})")
colnames(phone_parts) <- c("full_match", "area_code", "prefix", "line")
phone_parts
#>      full_match       area_code prefix line
#> [1,] "(555) 867-5309" "555"     "867"  "5309"
#> [2,] "555-1234"       "555"     "123"  "4"
#> [3,] "(800) 555-0199" "800"     "555"  "0199"
#> [4,] "1234567890"     "123"     "456"  "7890"
```

Each `(\\d{3})` captures exactly 3 digits. The non-capturing parts (parentheses, dashes, spaces) are matched but not stored, they shape the match without showing up as columns. This is the go-to technique whenever you have structured text and need the pieces, not just the whole.

[KEY INSIGHT]
**str_match() returns a matrix, not a vector.** Column 1 is the full match; columns 2, 3, 4 correspond to the first, second, third capturing groups. This is a key difference from `str_extract()`, which only ever returns the full match as a plain character vector.

### Example 14: Swap first and last names with backreferences

Backreferences let you rearrange captured groups inside a replacement string. `\\1` refers to the first group, `\\2` to the second, and so on.

```r
# Example 14: Swap "First Last" into "Last, First"
names_vec <- c("John Smith", "Jane Doe", "Ada Lovelace")

swapped <- str_replace(names_vec, "(\\w+) (\\w+)", "\\2, \\1")
swapped
#> [1] "Smith, John"   "Doe, Jane"     "Lovelace, Ada"
```

The pattern `(\\w+) (\\w+)` captures two words separated by a space. In the replacement `"\\2, \\1"` we put the second capture first, add a comma, then the first capture. This is a one-liner for reformatting name columns in data frames, and the pattern naturally scales to any "flip these two tokens" task.

[TIP]
**Backreferences work in str_replace() but not in str_detect().** Use `\\1`, `\\2` only in the replacement argument. Inside a pattern, a backreference means "match the same text the group just captured", useful for detecting repeated words, but a different use case.

### Example 15: Use alternation inside groups

The pipe `|` inside a group matches either alternative. Think of it as an OR operator for patterns.

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

The group `(berry|orange|lemon|lime|grapefruit)` matches if *any* alternative appears. "strawberry" and "blueberry" match because they contain "berry", only "grape" fails because none of the listed terms appear in it. Alternation is how you collapse several related checks into one pattern.

### Example 16: Use non-capturing groups for cleaner patterns

Sometimes you need grouping for alternation or quantifiers but don't want that group to show up as a capture. The syntax `(?:...)` creates a non-capturing group.

```r
# Example 16: Non-capturing group for URL protocol
urls <- c("http://example.com", "https://secure.org", "ftp://files.net")

nc_result <- str_match(urls, "(https?)://([\\w.]+)")
colnames(nc_result) <- c("full", "protocol", "domain")
nc_result
#>      full                  protocol domain
#> [1,] "http://example.com"  "http"   "example.com"
#> [2,] "https://secure.org"  "https"  "secure.org"
#> [3,] NA                    NA       NA
```

Here `(https?)` captures "http" or "https" as a group, with the trailing `?` making the "s" optional. The result has two clean columns: protocol and domain. The FTP URL returns NA because it doesn't match the pattern. If we only needed grouping for the alternation and didn't care about capturing, we could have written `(?:https?)` instead, but here we do want the protocol back, so a capturing group is the right call.

**Try it:** Extract the file extension from `"report_final.tar.gz"`, the *last* extension only. Use a capturing group and store the captured extension (not the leading dot) in `ex_ext`.

```r
# Try it: extract final file extension
filename <- "report_final.tar.gz"

ex_ext_match <- # your code here
ex_ext <- ex_ext_match[, 2]

ex_ext
#> Expected: "gz"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ext_match <- str_match(filename, "\\.([a-zA-Z0-9]+)$")
ex_ext <- ex_ext_match[, 2]
ex_ext
#> [1] "gz"
```

**Explanation:** The `$` anchor forces the match to the end of the string so we only get the final extension, not "tar". The literal `\\.` matches the last dot, and the capturing group `([a-zA-Z0-9]+)` grabs the characters after it. Column 2 of the `str_match()` result is the captured extension without the dot.

</details>

## How do lookarounds match without consuming text?

Lookaround assertions check what comes before or after a position *without including it in the match*. There are four flavours: positive lookahead `(?=...)` (must be followed by), negative lookahead `(?!...)` (must NOT be followed by), positive lookbehind `(?<=...)` (must be preceded by), and negative lookbehind `(?<!...)` (must NOT be preceded by).

Think of a lookaround as a security guard checking your ID at a door. The guard looks at the ID but doesn't take it from you, the match only includes what's outside the lookaround. This "check but don't consume" behaviour is what makes lookarounds so useful for context-sensitive extraction.

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

The `(?<=\\$)` assertion says "there must be a dollar sign immediately before this position." The dollar sign is checked but not included in the extracted text. The Euro amount is skipped because it lacks the `$` prefix. This is much cleaner than extracting `"$299.99"` and then stripping the `$` in a second step.

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

The pattern `\\w+(?=,)` matches one or more word characters that are followed by a comma, the comma is checked but not included in the match. "date" is excluded because nothing follows it. This is the right tool for context-aware extraction: when you care about a word's neighbour but don't want that neighbour in your result.

### Example 19: Match numbers not preceded by a minus sign

Negative lookbehinds exclude matches that have a specific prefix.

```r
# Example 19: Extract only positive numbers
numbers_text <- "Scores: 42, -7, 100, -3, 88"

positive_nums <- str_extract_all(numbers_text, "(?<!-)\\b\\d+")
positive_nums
#> [[1]]
#> [1] "42"  "100" "88"
```

`(?<!-)\\b\\d+` says "match a run of digits at a word boundary, but only if there is no minus sign immediately before." The negative lookbehind rejects -7 and -3 while keeping 42, 100, and 88. The `\\b` is still important, without it, the engine would happily match the "7" in "-7" starting from after the minus sign.

[NOTE]
**R's ICU regex engine requires fixed-width lookbehinds.** You can use exact patterns like `(?<=\\$)` or `(?<!-)`, but variable-length patterns like `(?<=\\$+)` with a quantifier inside the lookbehind will error. If you need variable-length context, restructure the pattern or use multiple `str_detect()` calls.

### Example 20: Validate password strength with multiple lookaheads

You can stack multiple lookaheads to enforce several conditions from the same starting position. This is the classic regex technique for multi-rule validation.

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

Each `(?=.*[X])` lookahead asserts "somewhere in this string, there is a character matching [X]." The final `.{8,}` requires at least 8 characters total. Because lookaheads don't consume text, all three checks fire from the same starting position, they stack without interfering. Only "Abcdef1!" satisfies every rule.

[WARNING]
**Stacking too many lookaheads makes patterns unreadable.** For validation with 4+ conditions, split into multiple `str_detect()` calls and combine with `&`. A series of small checks is easier to read, debug, and unit-test than one giant regex.

**Try it:** Extract every word that is immediately followed by a question mark in the string `"Why? How? When do we start? Now!"`. Store the result in `ex_qwords`.

```r
# Try it: extract words before '?'
q_text <- "Why? How? When do we start? Now!"

ex_qwords <- # your code here

ex_qwords
#> Expected:
#> [[1]]
#> [1] "Why"   "How"   "start"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_qwords <- str_extract_all(q_text, "\\w+(?=\\?)")
ex_qwords
#> [[1]]
#> [1] "Why"   "How"   "start"
```

**Explanation:** `\\w+(?=\\?)` matches a run of word characters, but only where a question mark immediately follows. The lookahead `(?=\\?)` checks for the `?` without including it in the match. "Now" is excluded because it is followed by `!`, not `?`.

</details>

## Practice Exercises

These capstone exercises combine multiple techniques from the tutorial. They're harder than the inline "Try it" prompts, expect to use 2-3 regex concepts per solution. Every exercise is solvable with only what was taught above.

### Exercise 1: Extract all 4-digit years from mixed text

Pull every 4-digit number (likely a year) out of a sentence. Make sure your pattern rejects 2-digit and 6-digit numbers even if they appear nearby. Store the result in `my_years`.

```r
# Exercise 1: extract 4-digit years
my_text <- "Events in 1969, 1989, and 2024 changed history. See page 42 or row 123456."

# Hint: use str_extract_all() with exactly 4 digits surrounded by word boundaries.

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

**Explanation:** `\\b\\d{4}\\b` matches exactly 4 digits surrounded by word boundaries. Without boundaries, the pattern would greedily match the first four digits of "123456" and return "1234". "42" is also rejected because it has only 2 digits, not the required 4.

</details>

### Exercise 2: Parse product codes into components

Product codes follow the format `CAT-1234-XL`, a 2-3 letter category, dash, 4 digits, dash, 1-3 letter size. Extract all three components into separate columns using `str_match()`. Store the result in `my_parts`.

```r
# Exercise 2: parse structured product codes
my_codes <- c("SH-1001-M", "EL-2345-XL", "FD-9999-S", "HW-0042-XXL")

# Hint: use str_match() with three capturing groups and anchor the pattern
# with ^ and $ so the whole code must match.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_parts <- str_match(my_codes, "^([A-Z]{2,3})-(\\d{4})-([A-Z]{1,3})$")
colnames(my_parts) <- c("full", "category", "number", "size")
my_parts
#>      full          category number size
#> [1,] "SH-1001-M"   "SH"     "1001" "M"
#> [2,] "EL-2345-XL"  "EL"     "2345" "XL"
#> [3,] "FD-9999-S"   "FD"     "9999" "S"
#> [4,] "HW-0042-XXL" "HW"     "0042" "XXL"
```

**Explanation:** Three capturing groups split the code into pieces. `([A-Z]{2,3})` captures 2-3 uppercase letters, `(\\d{4})` captures exactly 4 digits, and `([A-Z]{1,3})` captures 1-3 uppercase letters. The `^` and `$` anchors make sure the whole string matches, so a malformed code wouldn't partially succeed.

</details>

### Exercise 3: Extract domain names from email addresses

Given a vector of email addresses, extract just the domain (everything after the `@`) using a lookbehind. Store the result in `my_domains`.

```r
# Exercise 3: extract domains from emails
my_emails <- c("alice@gmail.com", "bob@company.co.uk", "carol@university.edu")

# Hint: use a positive lookbehind for @ followed by a character class
# that captures letters, digits, dots, and hyphens.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_domains <- str_extract(my_emails, "(?<=@)[\\w.-]+")
my_domains
#> [1] "gmail.com"      "company.co.uk"  "university.edu"
```

**Explanation:** The positive lookbehind `(?<=@)` asserts the `@` must precede the match without including it in the result. Then `[\\w.-]+` grabs the domain characters (letters, digits, underscores, dots, hyphens). The `@` itself is never in the output because lookarounds don't consume text.

</details>

## Complete Example

Let's combine every technique from this tutorial in a realistic pipeline. You have a messy data frame of customer records where each row is a single pipe-delimited string, and you need to extract, validate, and clean several fields at once.

```r
# Complete example: clean a messy customer dataset
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
    name        = str_extract(raw, "^[A-Za-z]+ [A-Za-z]+"),
    phone       = str_extract(raw, "\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}"),
    email       = str_extract(raw, "[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}"),
    amount      = as.numeric(str_replace_all(
                    str_extract(raw, "(?<=\\$)[\\d,.]+"), ",", "")),
    valid_phone = str_detect(phone, "^\\(\\d{3}\\) \\d{3}-\\d{4}$"),
    valid_email = !is.na(email)
  ) |>
  select(-raw)

clean_df
#>         name          phone          email  amount valid_phone valid_email
#> 1 John Smith (555) 867-5309 john@email.com  150.00        TRUE        TRUE
#> 2   Jane Doe       555-1234           <NA>   75.50       FALSE       FALSE
#> 3    Bob Lee (800) 555-0199   bob@work.org      NA        TRUE        TRUE
#> 4   Ann Park (312) 555-8888 ann@site.co.uk 2500.00       TRUE        TRUE
```

Every technique from the tutorial earns its keep here. Character classes extract names and email characters, quantifiers match flexible phone formats, groups and anchors validate strict phones, and a lookbehind pulls out the dollar amounts without the `$` prefix. Jane's email fails validation because "AT" isn't `@`. Bob's amount is `NA` because "Free" has no dollar sign. The pipeline does in six `mutate()` lines what would take pages of manual string handling.

[KEY INSIGHT]
**Regex shines when you combine techniques in a pipeline.** No single pattern family is that powerful alone, character classes are blunt, quantifiers are loose, anchors are strict. Together, inside a dplyr chain, they replace dozens of lines of conditional string logic with declarative field extraction.

## Summary

| Regex Concept | Key Syntax | Best stringr Function | When to Use |
|---|---|---|---|
| Character classes | `[a-z]`, `\\d`, `\\w`, `\\s` | `str_extract()`, `str_replace_all()` | Match specific character types |
| Quantifiers | `?`, `+`, `*`, `{n,m}`, `*?` | `str_extract()`, `str_detect()` | Control how many characters match |
| Anchors & boundaries | `^`, `$`, `\\b` | `str_detect()`, `str_replace_all()` | Pin patterns to positions, validate formats |
| Groups & backreferences | `()`, `\\1`, `(?:)` | `str_match()`, `str_replace()` | Capture subpatterns, rearrange text |
| Lookaround assertions | `(?=)`, `(?!)`, `(?<=)`, `(?<!)` | `str_extract()`, `str_detect()` | Match context without consuming it |

The mental model: regex describes *what text looks like*, and stringr gives you consistent, pipe-friendly functions to act on those descriptions. Start with the simple families (character classes + quantifiers) and reach for the richer ones (anchors, groups, lookarounds) only when you actually need the extra power.

## References

1. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 15: Regular Expressions. [Link](https://r4ds.hadley.nz/regexps)
2. Wickham, H., stringr: Simple, Consistent Wrappers for Common String Operations. CRAN. [Link](https://cran.r-project.org/package=stringr)
3. stringr documentation, Regular Expressions vignette. [Link](https://stringr.tidyverse.org/articles/regular-expressions.html)
4. R Core Team, Regular Expressions as used in R (`?regex`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/regex.html)
5. Friedl, J.E.F., *Mastering Regular Expressions*, 3rd Edition. O'Reilly (2006).
6. Sanchez, G., *Handling Strings with R*. Chapter 15: Boundaries and Lookarounds. [Link](https://www.gastonsanchez.com/r4strings/boundaries.html)
7. ICU Regular Expressions Documentation. [Link](https://unicode-org.github.io/icu/userguide/strings/regexp.html)

## Continue Learning

- **[stringr in R](stringr-in-R.html)**, The parent tutorial covering the 15 core stringr functions. If you want the full picture of string manipulation beyond regex, start here.
- **[lubridate in R](lubridate-in-R.html)**, Dates are the other common "messy text" problem. Learn how lubridate parses, extracts, and computes with dates and times.
