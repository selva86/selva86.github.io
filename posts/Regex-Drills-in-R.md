---
title: "The Regex 20: Text Wrangling Drills in R"
slug: "Regex-Drills-in-R"
description: "Regex practice in R: 20 real regular expressions drills, from grepl and anchors to str_extract, gsub backreferences, capture groups, lookarounds and log cleanup."
keywords: "regex practice R, regular expressions exercises R, grepl, gsub, str_extract, regmatches, capture groups, lookarounds"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Regex Drills"
sidebar_order: 210
fr_parent: "stringr-regex-in-R.html"
auto_link_terms: "regex in r|regular expressions|grepl|gsub|str_extract|capture groups"
auto_link_case_sensitive: false
target_keyword: "regex practice R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# The Regex 20: Text Wrangling Drills in R

<p class="lead">Twenty regular expression drills in R, arranged from literal matches through anchors, extraction and replacement to lookarounds and real cleanup jobs on phone numbers, emails and log lines. Each problem states the task, shows the exact expected output, and hides a worked solution with an explanation. Reveal it only after you have tried.</p>

This is a featured job-skill collection: the pattern-matching moves that show up in almost every data-cleaning task. Work top to bottom. The difficulty climbs from single `grepl()` calls to multi-group log parsing, and every answer is verified against real R output.

```r title="Run this once before any exercise"
library(stringr)
```

## Section 1. Literal Matches and Character Classes (3 problems)

### Exercise 1.1: Flag CSV files with a dot-escaped literal match

**Task:** You have a vector of downloaded file names and need to know which ones are lowercase CSV exports. Use `grepl()` with a pattern that matches a literal dot followed by `csv`, so that `.txt` and uppercase `.CSV` files are not flagged. Save the resulting logical vector to `ex_1_1`.

**Expected result:**

```
#> [1]  TRUE FALSE  TRUE FALSE FALSE
```

**Difficulty:** Beginner

[HINTS]
A dot is a special character in regex that matches any character, so a bare `.` would also match the `t` in `.txt`; you need to make it literal.
Escape the dot as `\\.` inside the pattern and pass it to `grepl("\\.csv", files)`.

```r title="Your turn"
files <- c("sales_q1.csv", "notes.txt", "sales_q2.csv", "readme.md", "archive.CSV")

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
files <- c("sales_q1.csv", "notes.txt", "sales_q2.csv", "readme.md", "archive.CSV")

ex_1_1 <- grepl("\\.csv", files)
ex_1_1
#> [1]  TRUE FALSE  TRUE FALSE FALSE
```

**Explanation:** In a regex, `.` matches any single character, so the pattern `.csv` would also match strings like `xcsv`. Writing `\\.` escapes the metacharacter to a literal period. The double backslash is needed because R first parses the string, turning `\\.` into `\.`, which the regex engine then reads as an escaped dot. `archive.CSV` stays `FALSE` because matching is case sensitive by default; pass `ignore.case = TRUE` if you want uppercase extensions too.

</details>

### Exercise 1.2: Return only codes containing a digit with grep

**Task:** A product team hands you a list of short codes and wants just the ones that carry a version number. Use `grep()` with `value = TRUE` and the digit character class so the call returns the matching strings themselves rather than their positions. Save the character vector of matches to `ex_1_2`.

**Expected result:**

```
#> [1] "Beta7"   "Delta42"
```

**Difficulty:** Intermediate

[HINTS]
`grepl()` gives you TRUE/FALSE, but here you want the actual strings that matched, which is a different function in the same family.
Use `grep("[0-9]", codes, value = TRUE)`; the `[0-9]` class matches any single digit.

```r title="Your turn"
codes <- c("Alpha", "Beta7", "Gamma", "Delta42", "Zeta")

ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
codes <- c("Alpha", "Beta7", "Gamma", "Delta42", "Zeta")

ex_1_2 <- grep("[0-9]", codes, value = TRUE)
ex_1_2
#> [1] "Beta7"   "Delta42"
```

**Explanation:** `grep()` and `grepl()` share a pattern engine but return different things: `grepl()` returns a logical vector, `grep()` returns integer positions, and `grep(..., value = TRUE)` returns the matched elements. The character class `[0-9]` matches a single digit anywhere in the string, so any code with at least one number survives. A common mistake is reaching for `grepl()` and then subsetting with it; `grep(value = TRUE)` does both steps in one call.

</details>

### Exercise 1.3: Detect multi-word labels with a POSIX space class

**Task:** A mapping dataset mixes single-word and multi-word region labels, and you want a logical flag for the compound ones. Use `grepl()` with the POSIX character class for whitespace to mark any label that contains a space. Save the logical vector to `ex_1_3`.

**Expected result:**

```
#> [1] FALSE  TRUE FALSE  TRUE FALSE
```

**Difficulty:** Intermediate

[HINTS]
Rather than hard-coding a literal space, regex offers a named class that also covers tabs and other whitespace.
Use the POSIX class inside brackets: `grepl("[[:space:]]", labels)`.

```r title="Your turn"
labels <- c("north", "north east", "south", "south west", "east")

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
labels <- c("north", "north east", "south", "south west", "east")

ex_1_3 <- grepl("[[:space:]]", labels)
ex_1_3
#> [1] FALSE  TRUE FALSE  TRUE FALSE
```

**Explanation:** POSIX classes like `[[:space:]]`, `[[:alpha:]]` and `[[:digit:]]` are portable, readable names for common character sets. `[[:space:]]` matches spaces, tabs and newlines, which is safer than a literal `" "` when data may contain tab separators. Note the double brackets: the inner `[:space:]` is the class name and the outer `[...]` makes it a character set, so a single-bracket `[:space:]` would wrongly match the literal characters `:`, `s`, `p` and so on.

</details>

## Section 2. Anchors and Quantifiers (3 problems)

### Exercise 2.1: Match filenames that start with a prefix anchor

**Task:** An export folder contains files from several teams, and you only want the ones whose names begin with `sales_`. Use `grepl()` with the start-of-string anchor so that a file like `q1_sales.csv`, where the prefix appears later, is not matched. Save the logical vector to `ex_2_1`.

**Expected result:**

```
#> [1]  TRUE FALSE  TRUE FALSE
```

**Difficulty:** Beginner

[HINTS]
Without an anchor the pattern would match `sales_` anywhere in the string; you need to pin it to the beginning.
Prefix the pattern with the caret anchor: `grepl("^sales_", files2)`.

```r title="Your turn"
files2 <- c("sales_jan.csv", "q1_sales.csv", "sales_feb.csv", "summary.csv")

ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
files2 <- c("sales_jan.csv", "q1_sales.csv", "sales_feb.csv", "summary.csv")

ex_2_1 <- grepl("^sales_", files2)
ex_2_1
#> [1]  TRUE FALSE  TRUE FALSE
```

**Explanation:** The caret `^` anchors a pattern to the start of the string, so `^sales_` only matches when those characters are the very first ones. `q1_sales.csv` contains `sales_` but not at the start, so it fails. Anchors match a position, not a character, which is why they never consume anything. The mirror anchor is `$` for the end of the string; combine both as `^...$` to force a whole-string match.

</details>

### Exercise 2.2: Find strings that end in one or more digits

**Task:** User handles in a legacy system sometimes end in a numeric suffix, and you want to flag those. Use `grepl()` with the digit class, the one-or-more quantifier, and the end-of-string anchor so that only handles finishing in digits are marked. Save the logical vector to `ex_2_2`.

**Expected result:**

```
#> [1]  TRUE FALSE  TRUE FALSE  TRUE
```

**Difficulty:** Intermediate

[HINTS]
You need "at least one digit, right up against the end of the string", which combines a quantifier with an anchor.
Use `grepl("[0-9]+$", ids)`, where `+` means one or more and `$` pins the match to the end.

```r title="Your turn"
ids <- c("user12", "userX", "user007", "admin", "guest9")

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ids <- c("user12", "userX", "user007", "admin", "guest9")

ex_2_2 <- grepl("[0-9]+$", ids)
ex_2_2
#> [1]  TRUE FALSE  TRUE FALSE  TRUE
```

**Explanation:** The `+` quantifier means "one or more of the preceding item", so `[0-9]+` matches a run of digits of any length. Anchoring with `$` forces that run to sit at the end of the string, which is why `admin` fails and `guest9` passes. Without `$` the pattern would match a digit anywhere, flagging strings like `v2beta`. Related quantifiers are `*` (zero or more) and `?` (zero or one); reach for `+` when at least one occurrence is required.

</details>

### Exercise 2.3: Validate 3-to-5 digit codes with bounded quantifiers

**Task:** A form accepts numeric location codes that must be between three and five digits long with nothing else in the field. Use `grepl()` with anchors at both ends and a bounded quantifier to validate each entry as a whole string. Save the logical vector of validity flags to `ex_2_3`.

**Expected result:**

```
#> [1]  TRUE  TRUE FALSE  TRUE FALSE
```

**Difficulty:** Intermediate

[HINTS]
"Between three and five digits, and nothing else" means you must anchor both ends and cap the repeat count.
Use a bounded quantifier `{3,5}` inside `^...$`: `grepl("^[0-9]{3,5}$", zips)`.

```r title="Your turn"
zips <- c("12345", "6789", "123456", "90210", "1")

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
zips <- c("12345", "6789", "123456", "90210", "1")

ex_2_3 <- grepl("^[0-9]{3,5}$", zips)
ex_2_3
#> [1]  TRUE  TRUE FALSE  TRUE FALSE
```

**Explanation:** The bounded quantifier `{3,5}` means "at least three, at most five" repetitions. Anchoring with `^` and `$` is what makes this a validation rather than a search: it forces the entire field to consist of nothing but three to five digits, so `123456` (six digits) and `1` (one digit) both fail. Drop the anchors and the pattern would match any three-to-five digit run inside a longer string, which is a frequent validation bug.

</details>

## Section 3. Extraction with regmatches and str_extract (3 problems)

### Exercise 3.1: Extract the first run of digits from each string

**Task:** Order confirmation lines each hold at most one order number, and you want to pull it out. Use `str_extract()` with the digit class and a one-or-more quantifier to grab the first numeric run from each string, leaving `NA` where no number exists. Save the character vector to `ex_3_1`.

**Expected result:**

```
#> [1] "12"   "8891" NA
```

**Difficulty:** Beginner

[HINTS]
You want the matched text back, not a TRUE/FALSE, and only the first match per string.
Use `str_extract(orders, "[0-9]+")`; it returns the first match or `NA` when nothing matches.

```r title="Your turn"
orders <- c("Order 12 shipped", "Ref 8891 pending", "No number here")

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders <- c("Order 12 shipped", "Ref 8891 pending", "No number here")

ex_3_1 <- str_extract(orders, "[0-9]+")
ex_3_1
#> [1] "12"   "8891" NA
```

**Explanation:** `str_extract()` returns the first substring that matches, keeping the result the same length as the input so it lines up with the original vector. When a string has no match it yields `NA` rather than dropping the element, which is exactly why the third entry is `NA`. This length-preserving behaviour is the key difference from base `regmatches()`, which silently drops non-matching elements and breaks positional alignment. Use `str_extract_all()` when you need every match, not just the first.

</details>

### Exercise 3.2: Pull every number from a log line with regmatches

**Task:** A single request log line embeds several numbers (a status code, a duration and a retry count) and you need all of them. Use base R `regmatches()` together with `gregexpr()` and the digit pattern to extract every numeric run from the line. Save the resulting list to `ex_3_2`.

**Expected result:**

```
#> [[1]]
#> [1] "200" "45"  "3"
```

**Difficulty:** Intermediate

[HINTS]
`regexpr()` finds only the first match; to capture every match you need its global counterpart.
Pair them as `regmatches(logline, gregexpr("[0-9]+", logline))`.

```r title="Your turn"
logline <- "GET /api 200 in 45ms, retried 3 times"

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
logline <- "GET /api 200 in 45ms, retried 3 times"

ex_3_2 <- regmatches(logline, gregexpr("[0-9]+", logline))
ex_3_2
#> [[1]]
#> [1] "200" "45"  "3"
```

**Explanation:** In base R, extraction is a two-step dance: `gregexpr()` returns the positions and lengths of every match, and `regmatches()` uses those to slice out the actual substrings. The `g` prefix means "global", so it finds all matches rather than just the first the way `regexpr()` does. Because the input could be a vector, `regmatches()` returns a list with one element per string; index with `[[1]]` to get the character vector. The stringr one-liner `str_extract_all()` does the same job with less ceremony.

</details>

### Exercise 3.3: Extract all capitalized words with str_extract_all

**Task:** From a set of short sentences you want every capitalized word as a rough proper-noun finder. Use `str_extract_all()` with a pattern that matches an uppercase letter followed by one or more lowercase letters, so each sentence yields its own vector of words. Save the list of matches to `ex_3_3`.

**Expected result:**

```
#> [[1]]
#> [1] "Paris"  "Berlin"
#>
#> [[2]]
#> [1] "Nile"
#>
#> [[3]]
#> [1] "New"  "York" "City"
```

**Difficulty:** Intermediate

[HINTS]
"An uppercase letter, then lowercase letters" is two character classes back to back with a quantifier on the second.
Use `str_extract_all(sentences, "[A-Z][a-z]+")`, which returns a list with one vector per input string.

```r title="Your turn"
sentences <- c("Paris and Berlin", "the river Nile", "New York City")

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sentences <- c("Paris and Berlin", "the river Nile", "New York City")

ex_3_3 <- str_extract_all(sentences, "[A-Z][a-z]+")
ex_3_3
#> [[1]]
#> [1] "Paris"  "Berlin"
#>
#> [[2]]
#> [1] "Nile"
#>
#> [[3]]
#> [1] "New"  "York" "City"
```

**Explanation:** The pattern `[A-Z][a-z]+` reads as "one uppercase letter followed by at least one lowercase letter", a compact heuristic for a capitalized word. `str_extract_all()` returns a list because each string can have a different number of matches, so a rectangular result is impossible. This is a heuristic, not a grammar: it would also grab a sentence's first word even when it is not a proper noun, and it misses all-caps acronyms. For real named-entity work you would move to a dedicated NLP tool.

</details>

## Section 4. Replacement with sub, gsub and Backreferences (3 problems)

### Exercise 4.1: Mask card digits with a gsub character class

**Task:** A compliance reviewer needs card numbers masked before they appear in a report, keeping the hyphen layout but hiding every digit. Use `gsub()` with the digit character class to replace all digits with a `#`, leaving the separators untouched. Save the masked vector to `ex_4_1`.

**Expected result:**

```
#> [1] "####-####-####" "####-####-####"
```

**Difficulty:** Beginner

[HINTS]
You want to replace every digit, not just the first one, so choose the global replacement function.
Use `gsub("[0-9]", "#", cards)`; `gsub` replaces all matches while `sub` would replace only the first.

```r title="Your turn"
cards <- c("4012-8888-1881", "5555-4444-3333")

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cards <- c("4012-8888-1881", "5555-4444-3333")

ex_4_1 <- gsub("[0-9]", "#", cards)
ex_4_1
#> [1] "####-####-####" "####-####-####"
```

**Explanation:** `gsub()` replaces every match of the pattern; the `g` again stands for "global". Matching the class `[0-9]` one character at a time and swapping in `#` masks each digit while leaving the hyphens, which are not digits, in place. Reach for `sub()` instead when only the first occurrence should change. A common slip is trying to mask with a fixed-width pattern like `[0-9]{16}`; matching a single digit repeatedly is simpler and survives odd groupings.

</details>

### Exercise 4.2: Replace only the first hyphen using sub

**Task:** Date strings arrive as `YYYY-MM-DD` and a downstream system wants the year separated from the rest by a slash while the month and day keep their hyphen. Use `sub()` so that only the first hyphen is replaced with a slash. Save the transformed vector to `ex_4_2`.

**Expected result:**

```
#> [1] "2024/01-15" "2023/12-31"
```

**Difficulty:** Intermediate

[HINTS]
The difference between the two replacement functions is exactly "first match only" versus "every match".
Use `sub("-", "/", paths)`, which stops after replacing the first hyphen.

```r title="Your turn"
paths <- c("2024-01-15", "2023-12-31")

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
paths <- c("2024-01-15", "2023-12-31")

ex_4_2 <- sub("-", "/", paths)
ex_4_2
#> [1] "2024/01-15" "2023/12-31"
```

**Explanation:** `sub()` and `gsub()` differ in a single but important way: `sub()` replaces only the first match in each string, `gsub()` replaces them all. Because a year-month-day string has two hyphens, `sub("-", "/", ...)` converts just the first, giving `2024/01-15`. If you had reached for `gsub()` here you would get `2024/01/15`, changing both separators. When a transformation should touch only the leading occurrence, `sub()` is the precise tool.

</details>

### Exercise 4.3: Reorder names with capture-group backreferences

**Task:** A directory lists people as `First Last` but the export format your colleague needs is `Last, First`. Use `sub()` with two capture groups around the first and last name and a replacement string that references those groups by number to flip the order. Save the reordered vector to `ex_4_3`.

**Expected result:**

```
#> [1] "Lovelace, Ada" "Turing, Alan"
```

**Difficulty:** Advanced

[HINTS]
Capture the two names in parentheses so you can refer back to them in the replacement.
In the replacement string, `\\1` and `\\2` stand for the first and second captured groups: `sub("^(\\w+) (\\w+)$", "\\2, \\1", people)`.

```r title="Your turn"
people <- c("Ada Lovelace", "Alan Turing")

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
people <- c("Ada Lovelace", "Alan Turing")

ex_4_3 <- sub("^(\\w+) (\\w+)$", "\\2, \\1", people)
ex_4_3
#> [1] "Lovelace, Ada" "Turing, Alan"
```

**Explanation:** Parentheses in a pattern create capture groups, numbered left to right by their opening bracket. In the replacement string, `\\1` and `\\2` are backreferences that insert whatever those groups matched, so `"\\2, \\1"` writes the last name, a comma, then the first. The anchors `^` and `$` plus `\\w+` for each name keep the match tight to a simple two-word full name. This pattern would need extending for middle names or hyphenated surnames, but it is the canonical shape for reordering fields.

</details>

## Section 5. Capture Groups (2 problems)

### Exercise 5.1: Split key-value pairs into a match matrix

**Task:** Configuration lines arrive in `key=value` form and you want the key and value pulled apart into separate columns. Use `str_match()` with two capture groups on either side of the equals sign so the result is a matrix holding the full match plus each group. Save the matrix to `ex_5_1`.

**Expected result:**

```
#>      [,1]             [,2]    [,3]
#> [1,] "host=localhost" "host"  "localhost"
#> [2,] "port=5432"      "port"  "5432"
#> [3,] "debug=true"     "debug" "true"
```

**Difficulty:** Intermediate

[HINTS]
You need the individual captured pieces returned as columns, which is what the match-matrix function gives you.
Use `str_match(kv, "^(\\w+)=(\\w+)$")`; column 1 is the whole match, columns 2 and 3 are the groups.

```r title="Your turn"
kv <- c("host=localhost", "port=5432", "debug=true")

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
kv <- c("host=localhost", "port=5432", "debug=true")

ex_5_1 <- str_match(kv, "^(\\w+)=(\\w+)$")
ex_5_1
#>      [,1]             [,2]    [,3]
#> [1,] "host=localhost" "host"  "localhost"
#> [2,] "port=5432"      "port"  "5432"
#> [3,] "debug=true"     "debug" "true"
```

**Explanation:** `str_match()` returns a character matrix where the first column is the entire match and each subsequent column is one capture group, in order. That layout makes it ideal for tearing a structured string into fields in a single call. Contrast it with `str_extract()`, which returns only the whole match and no group columns. When a string does not match, the whole row comes back as `NA`, preserving the one-row-per-input alignment so you can bind it beside the source data.

</details>

### Exercise 5.2: Extract the host from a URL capture group

**Task:** Marketing hands you a list of full URLs and only wants the host portion for a domain report. Use `str_match()` with a capture group that grabs everything between the scheme and the first slash, then keep the second column of the result. Save the character vector of hosts to `ex_5_2`.

**Expected result:**

```
#> [1] "www.example.com" "sub.test.org"
```

**Difficulty:** Intermediate

[HINTS]
Match the `http` or `https` scheme, then capture the run of characters that are not a slash as the host.
Use `str_match(urls, "https?://([^/]+)")[, 2]` to keep just the captured group column.

```r title="Your turn"
urls <- c("https://www.example.com/path", "http://sub.test.org/a/b")

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
urls <- c("https://www.example.com/path", "http://sub.test.org/a/b")

ex_5_2 <- str_match(urls, "https?://([^/]+)")[, 2]
ex_5_2
#> [1] "www.example.com" "sub.test.org"
```

**Explanation:** The `s?` makes the `s` optional so the pattern matches both `http` and `https`, and `[^/]+` is a negated character class meaning "one or more characters that are not a slash", which stops the host capture at the first path separator. `str_match()` returns the full match in column 1 and the host group in column 2, so `[, 2]` keeps only what you want. Negated classes like `[^/]` are the workhorse for "everything up to the next delimiter" without resorting to greedy wildcards.

</details>

## Section 6. PCRE Power Tools: Lookarounds, Lazy Quantifiers, perl=TRUE (3 problems)

### Exercise 6.1: Grab the number before "ms" with a lookahead

**Task:** Timing strings report durations like `45ms`, and you want the numeric part only when the unit is milliseconds, not seconds. Use `str_extract()` with a lookahead so the digits are matched only when immediately followed by `ms`, without capturing the `ms` itself. Save the character vector to `ex_6_1`.

**Expected result:**

```
#> [1] "45"   "1200" NA
```

**Difficulty:** Intermediate

[HINTS]
You want to match digits only when a specific suffix follows, but you do not want that suffix in the result: that is a zero-width lookahead.
Put the condition in a lookahead group: `str_extract(timings, "[0-9]+(?=ms)")`.

```r title="Your turn"
timings <- c("took 45ms", "took 1200ms", "took 3s")

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
timings <- c("took 45ms", "took 1200ms", "took 3s")

ex_6_1 <- str_extract(timings, "[0-9]+(?=ms)")
ex_6_1
#> [1] "45"   "1200" NA
```

**Explanation:** A lookahead `(?=...)` asserts that the text ahead matches without consuming it, so `[0-9]+(?=ms)` matches a run of digits only when `ms` follows, yet returns just the digits. The `3s` case yields `NA` because its unit is not `ms`. stringr uses the ICU regex engine, which supports lookarounds natively, so no extra flag is needed here. In base R you would enable the same feature with `perl = TRUE`. Lookarounds shine when a neighbour must exist but should stay out of the captured text.

</details>

### Exercise 6.2: Extract HTML tags with a lazy quantifier

**Task:** A snippet of markup contains several tags and you want each tag captured separately rather than one greedy match spanning the whole line. Use `str_extract_all()` with a lazy quantifier inside the angle-bracket pattern so matching stops at the first closing bracket. Save the resulting character vector to `ex_6_2`.

**Expected result:**

```
#> [1] "<b>"  "</b>" "<i>"  "</i>"
```

**Difficulty:** Advanced

[HINTS]
A greedy `<.+>` would swallow everything from the first `<` to the last `>`; you want the smallest match instead.
Make the quantifier lazy with `?`: `str_extract_all(html, "<.+?>")[[1]]`.

```r title="Your turn"
html <- "<b>bold</b> and <i>italic</i>"

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
html <- "<b>bold</b> and <i>italic</i>"

ex_6_2 <- str_extract_all(html, "<.+?>")[[1]]
ex_6_2
#> [1] "<b>"  "</b>" "<i>"  "</i>"
```

**Explanation:** By default quantifiers are greedy: `.+` grabs as much as it can, so `<.+>` would match from the first `<` all the way to the final `>` in one go. Adding `?` after the quantifier makes it lazy, matching as few characters as possible, so `<.+?>` stops at the first `>` and each tag is captured on its own. The `[[1]]` unwraps the single-element list `str_extract_all()` returns. Regex is famously the wrong tool for parsing real HTML, but for tokenizing simple tags the lazy trick is exactly right.

</details>

### Exercise 6.3: Title-case messy names with perl case modifiers

**Task:** A hand-entered name column has inconsistent casing like `aDA lovelace`, and you want each word title-cased. Use base R `gsub()` with `perl = TRUE` and the `\\U` and `\\L` case modifiers to uppercase the first letter of each word and lowercase the rest. Save the cleaned vector to `ex_6_3`.

**Expected result:**

```
#> [1] "Ada Lovelace" "Alan Turing"
```

**Difficulty:** Advanced

[HINTS]
Capture the first letter and the remaining letters of each word separately, then transform their case in the replacement.
With `perl = TRUE`, `\\U` uppercases and `\\L` lowercases what follows: `gsub("(\\w)(\\w*)", "\\U\\1\\L\\2", raw, perl = TRUE)`.

```r title="Your turn"
raw <- c("aDA lovelace", "ALAN turing")

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c("aDA lovelace", "ALAN turing")

ex_6_3 <- gsub("(\\w)(\\w*)", "\\U\\1\\L\\2", raw, perl = TRUE)
ex_6_3
#> [1] "Ada Lovelace" "Alan Turing"
```

**Explanation:** The Perl-compatible engine, enabled with `perl = TRUE`, adds case-modifier escapes usable in the replacement string: `\\U` forces following text to uppercase and `\\L` to lowercase, until reset. The pattern `(\\w)(\\w*)` captures a word's first character and its remaining characters as two groups, and the replacement `\\U\\1\\L\\2` uppercases the first and lowercases the rest. `gsub()` applies this to every word in the string. These modifiers are a Perl feature, so they silently do nothing without `perl = TRUE`, which is the classic gotcha.

</details>

## Section 7. Real Cleanup Scenarios (3 problems)

### Exercise 7.1: Normalize phone numbers to digits only

**Task:** A contact import mixes phone formats with parentheses, dots, spaces and dashes, and a downstream API wants bare ten-digit strings. Use `gsub()` with a negated character class to strip every non-digit character from each number. Save the normalized character vector to `ex_7_1`.

**Expected result:**

```
#> [1] "4155552671" "4155559900" "6505550000"
```

**Difficulty:** Intermediate

[HINTS]
Instead of listing every punctuation character to remove, match everything that is not a digit and delete it.
Use a negated class: `gsub("[^0-9]", "", phones)` replaces all non-digits with an empty string.

```r title="Your turn"
phones <- c("(415) 555-2671", "415.555.9900", "650-555-0000")

ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
phones <- c("(415) 555-2671", "415.555.9900", "650-555-0000")

ex_7_1 <- gsub("[^0-9]", "", phones)
ex_7_1
#> [1] "4155552671" "4155559900" "6505550000"
```

**Explanation:** The caret inside a character class, as in `[^0-9]`, negates it, so the class matches any character that is not a digit. Replacing all such characters with `""` in `gsub()` deletes the parentheses, dots, spaces and dashes in one pass, leaving only the digits. This "keep the good characters" approach scales far better than enumerating every separator to remove. For international numbers you would afterward inspect length and country prefix, since stripping punctuation alone does not validate that a number has the right digit count.

</details>

### Exercise 7.2: Keep only valid emails with a validation pattern

**Task:** A signup export contains malformed rows and you want to keep only entries that look like real email addresses. Use `grep()` with `value = TRUE` and an anchored pattern requiring a local part, an at sign, a domain, and a dot-separated top-level part of at least two letters. Save the vector of valid addresses to `ex_7_2`.

**Expected result:**

```
#> [1] "ada@example.com"        "alan.turing@test.co.uk"
```

**Difficulty:** Advanced

[HINTS]
Anchor the whole string and describe three parts: local characters, an at sign, then a domain ending in a dotted suffix of two or more letters.
A workable pattern is `"^[[:alnum:]._%+-]+@[[:alnum:].-]+\\.[[:alpha:]]{2,}$"`, passed to `grep(..., value = TRUE)`.

```r title="Your turn"
emails <- c("ada@example.com", "bad@", "alan.turing@test.co.uk", "no-at-sign", "x@y.z")

ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
emails <- c("ada@example.com", "bad@", "alan.turing@test.co.uk", "no-at-sign", "x@y.z")

ex_7_2 <- grep("^[[:alnum:]._%+-]+@[[:alnum:].-]+\\.[[:alpha:]]{2,}$",
               emails, value = TRUE)
ex_7_2
#> [1] "ada@example.com"        "alan.turing@test.co.uk"
```

**Explanation:** The pattern anchors the whole string and breaks the address into parts: `[[:alnum:]._%+-]+` for the local name, a literal `@`, `[[:alnum:].-]+` for the domain labels, then `\\.[[:alpha:]]{2,}$` demanding a dot followed by a top-level part of at least two letters. `bad@` and `no-at-sign` fail on structure, and `x@y.z` fails because its final part is a single letter. No regex fully validates email against the formal spec, so this is a pragmatic filter that catches the common malformed cases without rejecting real addresses.

</details>

### Exercise 7.3: Parse log lines into a data frame with groups

**Task:** Access log lines pack the client IP, request method, path, status code and byte count into one string, and you need them as columns. Use `str_match()` with five capture groups, then assemble the group columns into a data frame with `status` and `bytes` coerced to integers. Save the data frame to `ex_7_3`.

**Expected result:**

```
#>            ip method        path status bytes
#> 1 192.168.0.1    GET /index.html    200  1024
#> 2    10.0.0.5   POST      /login    403   256
```

**Difficulty:** Advanced

[HINTS]
Design one pattern with a group each for the IP, the quoted method, the path, the status and the bytes, then read off the match-matrix columns.
Match with `str_match(logs, '^([0-9.]+).*"(\\w+) ([^"]+)" ([0-9]+) ([0-9]+)$')` and build a `data.frame()` from columns 2 through 6, wrapping the numeric ones in `as.integer()`.

```r title="Your turn"
logs <- c('192.168.0.1 - - "GET /index.html" 200 1024',
          '10.0.0.5 - - "POST /login" 403 256')

ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
logs <- c('192.168.0.1 - - "GET /index.html" 200 1024',
          '10.0.0.5 - - "POST /login" 403 256')

m <- str_match(logs, '^([0-9.]+).*"(\\w+) ([^"]+)" ([0-9]+) ([0-9]+)$')
ex_7_3 <- data.frame(
  ip     = m[, 2],
  method = m[, 3],
  path   = m[, 4],
  status = as.integer(m[, 5]),
  bytes  = as.integer(m[, 6])
)
ex_7_3
#>            ip method        path status bytes
#> 1 192.168.0.1    GET /index.html    200  1024
#> 2    10.0.0.5   POST      /login    403   256
```

**Explanation:** This is the end-to-end payoff: one pattern with five groups turns each log line into structured fields. `([0-9.]+)` grabs the dotted IP, `.*` skips the two dash placeholders, `"(\\w+) ([^"]+)"` captures the method and the quoted path, and the two trailing `([0-9]+)` groups take the status and byte count. `str_match()` returns a matrix whose columns 2 through 6 are the groups, and `data.frame()` binds them into a table, with `as.integer()` restoring numeric types that regex always returns as text. For heavy log volumes a purpose-built parser is faster, but this shows how capture groups reshape raw text into analysis-ready rows.

</details>

## What to do next

- [stringr Exercises in R](stringr-Exercises-in-R.html): drill the tidyverse string toolkit, from `str_detect()` to `str_replace_all()`.
- [R String Exercises](R-String-Exercises.html): broader practice on splitting, padding, casing and formatting text.
- [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html): put these patterns to work fixing messy real-world columns.
- [Date-Time Manipulation Exercises in R](Date-Time-Manipulation-Exercises-in-R.html): parse and reshape timestamps, a frequent companion to text cleanup.
