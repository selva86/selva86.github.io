---
title: "Regex Exercises in R: 25 Real-World Practice Problems"
slug: "Regex-Exercises-in-R"
description: "25 regex in R practice problems with stringr: anchors, character classes, quantifiers, capture groups, lookarounds, and real-world text cleaning workflows."
keywords: "regex in R exercises, R regular expressions practice, R regex problems, stringr exercises, regex practice in R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Regex Exercises"
sidebar_order: 123
fr_parent: "R-Regex-stringr-Pattern-Matching.html"
auto_link_terms: "regex in R exercises|regular expressions in R practice|R regex problems|regex exercises|stringr practice"
auto_link_case_sensitive: false
target_keyword: "regex in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Regex Exercises in R: 25 Real-World Practice Problems

<p class="lead">Twenty-five hands-on practice problems covering anchors, character classes, quantifiers, capture groups, lookarounds, and real-world text cleaning with stringr. Every problem has a verifiable expected result and a hidden solution with an explanation of why the regex works.</p>

```r title="Run this once before any exercise"
library(stringr)
```

## Section 1. Anchors and character classes (4 problems)

### Exercise 1.1: Flag names that begin with an honorific Mr

**Task:** A receptionist wants to flag every entry in a guest list that begins with the honorific "Mr ". Build the input vector `names_v <- c("Mr Smith", "Dr Jones", "Mrs Park", "Mr Lee", "Ms Khan")` and use `str_detect()` with a start-anchored pattern so trailing names like "Mrs" are not matched. Save the logical result to `ex_1_1`.

**Expected result:**

```
#> [1]  TRUE FALSE FALSE  TRUE FALSE
```

**Difficulty:** Beginner

```r title="Your turn"
names_v <- c("Mr Smith", "Dr Jones", "Mrs Park", "Mr Lee", "Ms Khan")
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
names_v <- c("Mr Smith", "Dr Jones", "Mrs Park", "Mr Lee", "Ms Khan")
ex_1_1 <- str_detect(names_v, "^Mr ")
ex_1_1
#> [1]  TRUE FALSE FALSE  TRUE FALSE
```

**Explanation:** The caret `^` anchors the match to the start of the string, and the trailing space inside the pattern is what prevents "Mrs Park" from matching. Without the space, "Mrs" would also start with "Mr" and slip through. Anchoring is almost always cheaper to read and faster than `startsWith()` chains when you also want regex flexibility.

</details>

### Exercise 1.2: Identify CSV filenames with case-insensitive extension match

**Task:** An ingestion script must keep only filenames whose extension is `.csv`, regardless of case, and reject names where `.csv` appears mid-string. Given `files_v <- c("sales.csv","report.txt","2024-q1.CSV","data.csv.bak","summary.csv")`, use `str_detect()` with an end anchor and `regex(..., ignore_case = TRUE)`, then save the logical vector to `ex_1_2`.

**Expected result:**

```
#> [1]  TRUE FALSE  TRUE FALSE  TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
files_v <- c("sales.csv","report.txt","2024-q1.CSV","data.csv.bak","summary.csv")
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
files_v <- c("sales.csv","report.txt","2024-q1.CSV","data.csv.bak","summary.csv")
ex_1_2 <- str_detect(files_v, regex("\\.csv$", ignore_case = TRUE))
ex_1_2
#> [1]  TRUE FALSE  TRUE FALSE  TRUE
```

**Explanation:** `\\.csv$` requires a literal dot (escaped, since `.` matches any character) followed by `csv` followed by end-of-string. The `regex(..., ignore_case = TRUE)` wrapper lets the same pattern match both `.csv` and `.CSV`. Without the end anchor, "data.csv.bak" would slip through because the substring `.csv` appears inside it.

</details>

### Exercise 1.3: Match product codes that are exactly three digits

**Task:** A QA analyst auditing a parts catalog wants to flag codes that consist of exactly three digits with no surrounding letters. Given `codes_v <- c("123","ab12","456","78","9999","007","a456b")`, use `str_detect()` with both start and end anchors plus a digit character class with a fixed quantifier. Save the boolean vector to `ex_1_3`.

**Expected result:**

```
#> [1]  TRUE FALSE  TRUE FALSE FALSE  TRUE FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
codes_v <- c("123","ab12","456","78","9999","007","a456b")
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
codes_v <- c("123","ab12","456","78","9999","007","a456b")
ex_1_3 <- str_detect(codes_v, "^\\d{3}$")
ex_1_3
#> [1]  TRUE FALSE  TRUE FALSE FALSE  TRUE FALSE
```

**Explanation:** Both anchors are required: `^\\d{3}` alone would happily match "9999" (the first 3 digits), and `\\d{3}$` alone would match "a456b" if you stripped the last char. The fixed quantifier `{3}` means exactly three, not "three or more". `\\d` is equivalent to `[0-9]` in stringr's ICU engine and reads faster.

</details>

### Exercise 1.4: Accept SKU codes containing only uppercase letters and dashes

**Task:** A merchandising audit wants to accept SKU codes that consist solely of uppercase letters and dashes, with no digits, spaces, or lowercase letters allowed anywhere. Given `sku_v <- c("AB-CD","X-Y-Z","AB1-CD","SHIRT","red-hat","HAT 1","")`, use `str_detect()` with anchors around a character class that includes only uppercase letters and the dash. Save the logical vector to `ex_1_4`.

**Expected result:**

```
#> [1]  TRUE  TRUE FALSE  TRUE FALSE FALSE FALSE
```

**Difficulty:** Beginner

```r title="Your turn"
sku_v <- c("AB-CD","X-Y-Z","AB1-CD","SHIRT","red-hat","HAT 1","")
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sku_v <- c("AB-CD","X-Y-Z","AB1-CD","SHIRT","red-hat","HAT 1","")
ex_1_4 <- str_detect(sku_v, "^[A-Z-]+$")
ex_1_4
#> [1]  TRUE  TRUE FALSE  TRUE FALSE FALSE FALSE
```

**Explanation:** Inside a character class, the dash is a range operator (as in `A-Z`), but when it is placed at the very start or end of the class, it loses that meaning and matches a literal hyphen. The `+` quantifier requires at least one character, which is what rejects the empty string. Anchors `^` and `$` ensure that any forbidden character anywhere in the string causes the match to fail.

</details>

## Section 2. Quantifiers and repetition (3 problems)

### Exercise 2.1: Count how many digits appear in each user ID

**Task:** A data steward auditing legacy user IDs wants to know how many digit characters each ID contains, so messy IDs with too few digits can be flagged. Use `str_count()` with a digit character class on `ids_v <- c("user42","abc","007agent","2024-spring","NoNumbers")` and save the integer vector of counts to `ex_2_1`.

**Expected result:**

```
#> [1] 2 0 3 4 0
```

**Difficulty:** Beginner

```r title="Your turn"
ids_v <- c("user42","abc","007agent","2024-spring","NoNumbers")
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ids_v <- c("user42","abc","007agent","2024-spring","NoNumbers")
ex_2_1 <- str_count(ids_v, "\\d")
ex_2_1
#> [1] 2 0 3 4 0
```

**Explanation:** `str_count()` returns the number of non-overlapping matches per string, which is exactly what counts of a single-character class give you. No anchors are needed: every digit anywhere in the string is a separate match. For multi-character tokens like full numbers, use a quantified pattern such as `\\d+` and the count drops to one per run.

</details>

### Exercise 2.2: Validate US phone numbers with an optional country code

**Task:** A customer-support tool wants to accept US phone numbers that may begin with an optional "+1 " country prefix and otherwise consist of three groups of digits separated by hyphens, like "555-123-4567". Given `phones_v <- c("555-123-4567","+1 555-123-4567","555.123.4567","555-12-4567","+44 20 7946 0958")`, build a regex that handles both forms and save the logical vector to `ex_2_2`.

**Expected result:**

```
#> [1]  TRUE  TRUE FALSE FALSE FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
phones_v <- c("555-123-4567","+1 555-123-4567","555.123.4567","555-12-4567","+44 20 7946 0958")
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
phones_v <- c("555-123-4567","+1 555-123-4567","555.123.4567","555-12-4567","+44 20 7946 0958")
ex_2_2 <- str_detect(phones_v, "^(\\+1 )?\\d{3}-\\d{3}-\\d{4}$")
ex_2_2
#> [1]  TRUE  TRUE FALSE FALSE FALSE
```

**Explanation:** The `?` quantifier makes the preceding group optional, so `(\\+1 )?` matches zero or one occurrence of the country prefix. The `+` inside the group is escaped because `+` is a regex metacharacter. Anchoring with `^...$` ensures the whole string conforms; without it, "+44 20 7946 0958" could still match a substring and pass.

</details>

### Exercise 2.3: Find words that are between four and six letters long

**Task:** A crossword setter wants to keep only dictionary candidates that consist of four to six alphabetic characters and contain no digits or punctuation. From `words_v <- c("cat","tiger","leopard","wolf","panther","ox","jaguar7")`, write a regex using a quantified character class with both start and end anchors, and save the logical vector to `ex_2_3`.

**Expected result:**

```
#> [1] FALSE  TRUE FALSE  TRUE FALSE FALSE FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
words_v <- c("cat","tiger","leopard","wolf","panther","ox","jaguar7")
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
words_v <- c("cat","tiger","leopard","wolf","panther","ox","jaguar7")
ex_2_3 <- str_detect(words_v, "^[A-Za-z]{4,6}$")
ex_2_3
#> [1] FALSE  TRUE FALSE  TRUE FALSE FALSE FALSE
```

**Explanation:** The range quantifier `{4,6}` means at least four and at most six repeats. The character class `[A-Za-z]` rejects digits, so "jaguar7" fails even though the alphabetic portion is six characters long. Anchors `^` and `$` are essential: without them, "leopard" would match its first six letters and pass.

</details>

## Section 3. Capture groups and backreferences (4 problems)

### Exercise 3.1: Extract the local part of each email address

**Task:** A marketing analyst building a deliverability report wants the local part (everything before the `@`) of each email address. Using `emails_v <- c("alice@acme.com","bob.lee@uni.edu","carol+spam@gmail.com","bademail","dan@io")`, capture the local part with `str_match()` and return a character vector containing only that capture group. Save the result to `ex_3_1`.

**Expected result:**

```
#> [1] "alice"      "bob.lee"    "carol+spam" NA           "dan"
```

**Difficulty:** Intermediate

```r title="Your turn"
emails_v <- c("alice@acme.com","bob.lee@uni.edu","carol+spam@gmail.com","bademail","dan@io")
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
emails_v <- c("alice@acme.com","bob.lee@uni.edu","carol+spam@gmail.com","bademail","dan@io")
ex_3_1 <- str_match(emails_v, "^([^@]+)@.+$")[, 2]
ex_3_1
#> [1] "alice"      "bob.lee"    "carol+spam" NA           "dan"
```

**Explanation:** `str_match()` returns a matrix: column 1 is the whole match and columns 2 onward are each capture group. Subscripting `[, 2]` pulls the first group, which is `[^@]+` (one or more non-`@` characters). The negated class is the trick that keeps the match from being greedy across the `@`. "bademail" has no `@`, so the whole row is `NA`.

</details>

### Exercise 3.2: Swap first and last names using backreferences

**Task:** An HR data engineer needs to flip "First Last" into "Last, First" inside a name list. Given `names_full <- c("Ada Lovelace","Grace Hopper","Linus Torvalds","Donald Knuth")`, use `str_replace()` with two capture groups in the pattern and `\\2, \\1` in the replacement string. Save the rewritten vector to `ex_3_2`.

**Expected result:**

```
#> [1] "Lovelace, Ada"   "Hopper, Grace"   "Torvalds, Linus" "Knuth, Donald"
```

**Difficulty:** Intermediate

```r title="Your turn"
names_full <- c("Ada Lovelace","Grace Hopper","Linus Torvalds","Donald Knuth")
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
names_full <- c("Ada Lovelace","Grace Hopper","Linus Torvalds","Donald Knuth")
ex_3_2 <- str_replace(names_full, "^(\\w+) (\\w+)$", "\\2, \\1")
ex_3_2
#> [1] "Lovelace, Ada"   "Hopper, Grace"   "Torvalds, Linus" "Knuth, Donald"
```

**Explanation:** Capture groups in the pattern become numbered placeholders `\\1`, `\\2`, etc. in the replacement. The double backslash is required in R string literals because `\1` would be interpreted by R first. Anchors `^...$` ensure the regex only matches well-formed two-word names; "Ada B. Lovelace" would not match because the second `\\w+` cannot cross the dot.

</details>

### Exercise 3.3: Parse semantic version strings into major, minor, and patch

**Task:** A release engineer needs to break semantic version strings like "1.4.12" into three numeric components for sorting. Given `versions_v <- c("1.4.12","2.0.0","0.10.3","11.22.33","bad")`, use `str_match()` with three capture groups, then assemble a `data.frame` with integer columns `major`, `minor`, `patch`. Save the result to `ex_3_3`.

**Expected result:**

```
#>   major minor patch
#> 1     1     4    12
#> 2     2     0     0
#> 3     0    10     3
#> 4    11    22    33
#> 5    NA    NA    NA
```

**Difficulty:** Advanced

```r title="Your turn"
versions_v <- c("1.4.12","2.0.0","0.10.3","11.22.33","bad")
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
versions_v <- c("1.4.12","2.0.0","0.10.3","11.22.33","bad")
m <- str_match(versions_v, "^(\\d+)\\.(\\d+)\\.(\\d+)$")
ex_3_3 <- data.frame(
  major = as.integer(m[, 2]),
  minor = as.integer(m[, 3]),
  patch = as.integer(m[, 4])
)
ex_3_3
#>   major minor patch
#> 1     1     4    12
#> 2     2     0     0
#> 3     0    10     3
#> 4    11    22    33
#> 5    NA    NA    NA
```

**Explanation:** Each `\\d+` is greedy by default so "0.10.3" correctly assigns "10" to minor, not "1". The literal dots must be escaped or they would match any character. `as.integer()` on the match matrix converts character captures and propagates `NA` for the "bad" row. This pattern is the basis for sortable version comparisons.

</details>

### Exercise 3.4: Split file paths into basename and final extension

**Task:** A data-engineering job needs the basename (last path segment before the final dot) and the trailing extension from a vector of file paths so the downstream router can pick the right reader. Given `paths_v <- c("reports/2026/q1.csv","data/raw.tsv","notes.md","archive/old/file.tar.gz","noext")`, use `str_match()` with two capture groups to grab everything after the last slash up to the last dot, plus the extension after that last dot. Save a `data.frame` with columns `basename` and `ext` to `ex_3_4`.

**Expected result:**

```
#>   basename  ext
#> 1       q1  csv
#> 2      raw  tsv
#> 3    notes   md
#> 4 file.tar   gz
#> 5     <NA> <NA>
```

**Difficulty:** Advanced

```r title="Your turn"
paths_v <- c("reports/2026/q1.csv","data/raw.tsv","notes.md","archive/old/file.tar.gz","noext")
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
paths_v <- c("reports/2026/q1.csv","data/raw.tsv","notes.md","archive/old/file.tar.gz","noext")
m <- str_match(paths_v, "([^/]+)\\.([^.]+)$")
ex_3_4 <- data.frame(
  basename = m[, 2],
  ext      = m[, 3]
)
ex_3_4
#>   basename  ext
#> 1       q1  csv
#> 2      raw  tsv
#> 3    notes   md
#> 4 file.tar   gz
#> 5     <NA> <NA>
```

**Explanation:** `[^/]+` greedily matches the last path segment up to a slash without crossing one. The literal escaped dot `\\.` separates the basename from the extension, and `[^.]+$` at the end captures only the final extension token. That makes "file.tar.gz" split into basename "file.tar" and ext "gz", the conventional Unix interpretation of multi-suffix filenames. "noext" has no dot at all, so both captures return `NA`.

</details>

## Section 4. Lookarounds (4 problems)

### Exercise 4.1: Pull dollar amounts using a positive lookbehind

**Task:** A receipts parser needs to pull just the numeric amount that follows each dollar sign in lines like `"Total: $42.50 (was $50.00)"`. Use `str_extract_all()` with a positive lookbehind `(?<=\\$)` so the dollar sign is matched but not returned. Apply it to `lines_v <- c("Total: $42.50 (was $50.00)","Tax: $3.25","No charge","$1.00 deposit")` and save the list of character vectors to `ex_4_1`.

**Expected result:**

```
#> [[1]]
#> [1] "42.50" "50.00"
#> 
#> [[2]]
#> [1] "3.25"
#> 
#> [[3]]
#> character(0)
#> 
#> [[4]]
#> [1] "1.00"
```

**Difficulty:** Intermediate

```r title="Your turn"
lines_v <- c("Total: $42.50 (was $50.00)","Tax: $3.25","No charge","$1.00 deposit")
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lines_v <- c("Total: $42.50 (was $50.00)","Tax: $3.25","No charge","$1.00 deposit")
ex_4_1 <- str_extract_all(lines_v, "(?<=\\$)\\d+\\.\\d{2}")
ex_4_1
#> [[1]]
#> [1] "42.50" "50.00"
#> 
#> [[2]]
#> [1] "3.25"
#> 
#> [[3]]
#> character(0)
#> 
#> [[4]]
#> [1] "1.00"
```

**Explanation:** A lookbehind asserts that text before the current position matches the lookbehind pattern, but it does not consume those characters. So `(?<=\\$)\\d+\\.\\d{2}` returns just the digits and decimal, with no dollar sign in the result. Compared to capture groups, lookbehinds are cleaner when you only want the asserted prefix as a guard, not a value to extract.

</details>

### Exercise 4.2: Keep words not immediately followed by a comma

**Task:** A NLP preprocessor wants every word in a sentence that is not immediately followed by a comma, so trailing commas can later be treated separately. From `sentence <- "Linus, Ada and Grace built tools that Donald, Edsger, and others studied"`, use `str_extract_all()` with a negative lookahead `(?!,)` after a word boundary, and save the unlisted character vector to `ex_4_2`.

**Expected result:**

```
#> [1] "Ada"     "and"     "Grace"   "built"   "tools"   "that"    "and"     "others"  "studied"
```

**Difficulty:** Intermediate

```r title="Your turn"
sentence <- "Linus, Ada and Grace built tools that Donald, Edsger, and others studied"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sentence <- "Linus, Ada and Grace built tools that Donald, Edsger, and others studied"
ex_4_2 <- str_extract_all(sentence, "\\b\\w+\\b(?!,)")[[1]]
ex_4_2
#> [1] "Ada"     "and"     "Grace"   "built"   "tools"   "that"    "and"     "others"  "studied"
```

**Explanation:** The lookahead `(?!,)` asserts that the next character after the word is not a comma. Word boundaries `\\b...\\b` ensure full-word matches rather than substring matches. Because `str_extract_all()` returns a list (one element per input string), `[[1]]` unwraps the single-input case into a flat character vector.

</details>

### Exercise 4.3: Validate strong passwords using multiple lookaheads

**Task:** A security analyst is implementing a password rule: at least 8 characters, must contain a lowercase letter, an uppercase letter, a digit, and a special character from the set `!@#$%^&*`. Use `str_detect()` with multiple positive lookaheads stacked at the start of the pattern on `pw_v <- c("Pass123!","weakpass","STRONG1!","Sec ure9!","Aa1@bcde","short1!")` and save the logical vector to `ex_4_3`.

**Expected result:**

```
#> [1]  TRUE FALSE FALSE  TRUE  TRUE FALSE
```

**Difficulty:** Advanced

```r title="Your turn"
pw_v <- c("Pass123!","weakpass","STRONG1!","Sec ure9!","Aa1@bcde","short1!")
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pw_v <- c("Pass123!","weakpass","STRONG1!","Sec ure9!","Aa1@bcde","short1!")
ex_4_3 <- str_detect(pw_v, "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$")
ex_4_3
#> [1]  TRUE FALSE FALSE  TRUE  TRUE FALSE
```

**Explanation:** Each `(?=...)` is a zero-width assertion that scans the remainder of the string for one required character class without consuming input. Stacking four of them lets one pattern enforce four independent rules. After all assertions pass, `.{8,}$` enforces the length floor. Trying to express this without lookaheads would require an alternation of every ordering of the four character types, which is hopeless to maintain.

</details>

### Exercise 4.4: Extract HTML table cell text using a lookbehind and lookahead

**Task:** A web scraper has a tightly-controlled HTML snippet and wants only the text inside each `<td>...</td>` cell, with the surrounding tags excluded from the result. Given `html <- "<tr><td>Acme</td><td>1200</td><td>USD</td></tr>"`, use `str_extract_all()` combining a positive lookbehind `(?<=<td>)` and a positive lookahead `(?=</td>)` around a class that matches the cell text. Save the unlisted character vector to `ex_4_4`.

**Expected result:**

```
#> [1] "Acme" "1200" "USD"
```

**Difficulty:** Advanced

```r title="Your turn"
html <- "<tr><td>Acme</td><td>1200</td><td>USD</td></tr>"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
html <- "<tr><td>Acme</td><td>1200</td><td>USD</td></tr>"
ex_4_4 <- str_extract_all(html, "(?<=<td>)[^<]+(?=</td>)")[[1]]
ex_4_4
#> [1] "Acme" "1200" "USD"
```

**Explanation:** The lookbehind `(?<=<td>)` requires the literal opening tag immediately before the match without including it. The lookahead `(?=</td>)` does the same for the closing tag. `[^<]+` stops at the next `<` so the match never crosses into the closing tag. For tightly-structured snippets this is fine, but for messy real-world HTML (nested tags, attributes, comments) reach for `rvest::html_text()` rather than regex.

</details>

## Section 5. Extracting structured fields from real text (5 problems)

### Exercise 5.1: Extract the 5-digit US ZIP code from each address

**Task:** A logistics dashboard needs the 5-digit US ZIP code from each delivery address string, accepting "ZIP+4" forms but returning only the leading 5 digits. Given `addr_v <- c("742 Evergreen, Springfield, IL 62704","221B Baker St, NA","100 Main, Reno, NV 89501-1234","No address","P.O. Box 5, NY 10001")`, use `str_extract()` with word boundaries around a digit class. Save the character vector to `ex_5_1`.

**Expected result:**

```
#> [1] "62704" NA      "89501" NA      "10001"
```

**Difficulty:** Intermediate

```r title="Your turn"
addr_v <- c("742 Evergreen, Springfield, IL 62704","221B Baker St, NA",
            "100 Main, Reno, NV 89501-1234","No address","P.O. Box 5, NY 10001")
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
addr_v <- c("742 Evergreen, Springfield, IL 62704","221B Baker St, NA",
            "100 Main, Reno, NV 89501-1234","No address","P.O. Box 5, NY 10001")
ex_5_1 <- str_extract(addr_v, "\\b\\d{5}\\b")
ex_5_1
#> [1] "62704" NA      "89501" NA      "10001"
```

**Explanation:** Word boundaries `\\b` ensure the 5-digit run is not part of a longer number, so "221" in "221B" is rejected (only 3 digits) and "89501" in "89501-1234" is accepted (the hyphen acts as a word boundary). Without boundaries, you would silently match 5-digit substrings of longer numbers. `str_extract()` returns the first match per element, which is what we want here since a row should not have more than one ZIP.

</details>

### Exercise 5.2: Pull every URL from a log line

**Task:** A web ops engineer auditing referrer headers wants every URL referenced in a single log line. From `log_line <- "GET https://api.example.com/v1/users 200 ref=https://search.example.com/?q=test ua=Mozilla"`, use `str_extract_all()` to grab all substrings starting with `http://` or `https://` followed by non-whitespace characters. Save the resulting character vector to `ex_5_2`.

**Expected result:**

```
#> [1] "https://api.example.com/v1/users"   "https://search.example.com/?q=test"
```

**Difficulty:** Intermediate

```r title="Your turn"
log_line <- "GET https://api.example.com/v1/users 200 ref=https://search.example.com/?q=test ua=Mozilla"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log_line <- "GET https://api.example.com/v1/users 200 ref=https://search.example.com/?q=test ua=Mozilla"
ex_5_2 <- str_extract_all(log_line, "https?://\\S+")[[1]]
ex_5_2
#> [1] "https://api.example.com/v1/users"   "https://search.example.com/?q=test"
```

**Explanation:** `https?` makes the `s` optional with the `?` quantifier, covering both http and https. `\\S+` is one or more non-whitespace characters, which is the simplest stop rule for URLs inside log lines because spaces are the natural delimiter between log fields. For HTML or JSON inputs you would need a stricter terminator that also excludes quotes and angle brackets.

</details>

### Exercise 5.3: Extract ISO 8601 timestamps from server log lines

**Task:** A reliability engineer auditing latency wants the ISO 8601 UTC timestamp from each log entry. Given `logs_v <- c("2026-04-12T08:13:55Z OK","ERR 2026-04-12T08:14:01Z timeout","clean line","2026-04-12T08:14:09Z status=500")`, use `str_extract()` with a precise pattern matching date, "T" separator, time, and the trailing "Z". Save the character vector to `ex_5_3`.

**Expected result:**

```
#> [1] "2026-04-12T08:13:55Z" "2026-04-12T08:14:01Z" NA                     "2026-04-12T08:14:09Z"
```

**Difficulty:** Intermediate

```r title="Your turn"
logs_v <- c("2026-04-12T08:13:55Z OK","ERR 2026-04-12T08:14:01Z timeout",
            "clean line","2026-04-12T08:14:09Z status=500")
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
logs_v <- c("2026-04-12T08:13:55Z OK","ERR 2026-04-12T08:14:01Z timeout",
            "clean line","2026-04-12T08:14:09Z status=500")
ex_5_3 <- str_extract(logs_v, "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z")
ex_5_3
#> [1] "2026-04-12T08:13:55Z" "2026-04-12T08:14:01Z" NA                     "2026-04-12T08:14:09Z"
```

**Explanation:** Fixed-width digit groups separated by literal punctuation are the safe way to extract structured timestamps without false positives. The literal "T" and "Z" act as anchors inside the string, so we do not need `^` or `$`. For loose timestamp formats (with optional sub-second precision or offsets) you would relax the pattern, but this rigid version is faster and rejects malformed dates outright.

</details>

### Exercise 5.4: Parse compound order labels into a structured tibble

**Task:** A retail data engineer needs to convert raw order labels like "ORD-2026-04-12-SKU742-Q5" into structured fields for downstream reporting. Given `orders_v <- c("ORD-2026-04-12-SKU742-Q5","ORD-2026-04-13-SKU100-Q1","ORD-2026-04-13-SKU742-Q12")`, use `str_match()` with three capture groups to produce a `data.frame` with columns `date`, `sku`, and integer `qty`. Save the result to `ex_5_4`.

**Expected result:**

```
#>         date sku qty
#> 1 2026-04-12 742   5
#> 2 2026-04-13 100   1
#> 3 2026-04-13 742  12
```

**Difficulty:** Advanced

```r title="Your turn"
orders_v <- c("ORD-2026-04-12-SKU742-Q5","ORD-2026-04-13-SKU100-Q1","ORD-2026-04-13-SKU742-Q12")
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders_v <- c("ORD-2026-04-12-SKU742-Q5","ORD-2026-04-13-SKU100-Q1","ORD-2026-04-13-SKU742-Q12")
m <- str_match(orders_v, "^ORD-(\\d{4}-\\d{2}-\\d{2})-SKU(\\d+)-Q(\\d+)$")
ex_5_4 <- data.frame(
  date = m[, 2],
  sku  = m[, 3],
  qty  = as.integer(m[, 4])
)
ex_5_4
#>         date sku qty
#> 1 2026-04-12 742   5
#> 2 2026-04-13 100   1
#> 3 2026-04-13 742  12
```

**Explanation:** Literal text like "ORD-", "SKU", and "Q" outside the capture groups anchors the structure of each field and rejects malformed inputs. The greedy `\\d+` after "SKU" and "Q" cleanly absorbs variable-width numbers. Compared to splitting on "-" and indexing, `str_match()` makes each field self-documenting and survives unexpected dash characters inside non-structured tokens.

</details>

### Exercise 5.5: Pull every IPv4 address from a batch of log lines

**Task:** A SRE auditing access logs needs every IPv4 address mentioned in a vector of log lines, including multiple addresses on the same line. Given `log_v <- c("10.0.0.1 - GET / 200","fail from 192.168.1.42","clean: 8.8.8.8 and 1.1.1.1","no-ip line")`, use `str_extract_all()` with word boundaries around four dot-separated 1-3 digit groups. Save the resulting list to `ex_5_5`.

**Expected result:**

```
#> [[1]]
#> [1] "10.0.0.1"
#> 
#> [[2]]
#> [1] "192.168.1.42"
#> 
#> [[3]]
#> [1] "8.8.8.8" "1.1.1.1"
#> 
#> [[4]]
#> character(0)
```

**Difficulty:** Intermediate

```r title="Your turn"
log_v <- c("10.0.0.1 - GET / 200","fail from 192.168.1.42","clean: 8.8.8.8 and 1.1.1.1","no-ip line")
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log_v <- c("10.0.0.1 - GET / 200","fail from 192.168.1.42","clean: 8.8.8.8 and 1.1.1.1","no-ip line")
ex_5_5 <- str_extract_all(log_v, "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b")
ex_5_5
#> [[1]]
#> [1] "10.0.0.1"
#> 
#> [[2]]
#> [1] "192.168.1.42"
#> 
#> [[3]]
#> [1] "8.8.8.8" "1.1.1.1"
#> 
#> [[4]]
#> character(0)
```

**Explanation:** The word boundaries `\\b` prevent matching inside longer numeric runs and reject malformed octet groups that bleed into adjacent text. Each `\\d{1,3}` accepts a 1-3 digit octet without validating the 0-255 range; that bound is best enforced afterwards by parsing the captured octets to integers and filtering. `str_extract_all()` returns a list with one slot per input line, including `character(0)` when nothing matches.

</details>

## Section 6. Cleaning and transforming messy text (5 problems)

### Exercise 6.1: Trim and collapse whitespace in raw form input

**Task:** A form-cleanup pipeline needs to trim leading and trailing whitespace and collapse internal runs of whitespace to a single space, normalizing user-pasted values. Given `raw_v <- c("  hello   world  ","\tone\ttwo  three","clean","   "," a  b  c ")`, use `str_squish()` (the stringr one-liner that does both jobs) and save the cleaned character vector to `ex_6_1`.

**Expected result:**

```
#> [1] "hello world"   "one two three" "clean"         ""              "a b c"
```

**Difficulty:** Beginner

```r title="Your turn"
raw_v <- c("  hello   world  ","\tone\ttwo  three","clean","   "," a  b  c ")
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw_v <- c("  hello   world  ","\tone\ttwo  three","clean","   "," a  b  c ")
ex_6_1 <- str_squish(raw_v)
ex_6_1
#> [1] "hello world"   "one two three" "clean"         ""              "a b c"
```

**Explanation:** `str_squish()` is shorthand for `str_trim()` plus `str_replace_all("\\s+", " ")`. It treats tabs, multiple spaces, and newlines uniformly as whitespace, which is what you almost always want for form input. A string of only whitespace collapses to the empty string. For more selective cleanup (preserving tabs, for example), build the pieces yourself with `str_replace_all()`.

</details>

### Exercise 6.2: Convert camelCase identifiers to snake_case

**Task:** A code-migration script needs to rename camelCase column names from a legacy schema to snake_case for a Postgres target. From `cols_v <- c("firstName","lastName","userID","httpRequestCount","email")`, use `str_replace_all()` to insert an underscore between a lowercase or digit character and a following uppercase letter, then `str_to_lower()` to downcase. Save the rewritten vector to `ex_6_2`.

**Expected result:**

```
#> [1] "first_name"         "last_name"          "user_id"            "http_request_count" "email"
```

**Difficulty:** Intermediate

```r title="Your turn"
cols_v <- c("firstName","lastName","userID","httpRequestCount","email")
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cols_v <- c("firstName","lastName","userID","httpRequestCount","email")
ex_6_2 <- str_to_lower(str_replace_all(cols_v, "([a-z0-9])([A-Z])", "\\1_\\2"))
ex_6_2
#> [1] "first_name"         "last_name"          "user_id"            "http_request_count" "email"
```

**Explanation:** The pattern only inserts an underscore at a lowercase-to-uppercase boundary, which means "userID" becomes "user_ID" (a single insertion between "r" and "I") and not "user_I_D". After lowercasing, the result is the canonical "user_id". Inputs already in snake or lowercase (like "email") pass through untouched because no `[a-z0-9][A-Z]` boundary exists.

</details>

### Exercise 6.3: Mask the middle digits of 16-digit credit-card numbers

**Task:** A PCI-compliance task needs to mask the middle 8 digits of any 16-digit credit-card number, keeping only the first 4 and last 4 visible, while leaving non-conforming strings unchanged. Given `cards_v <- c("4111111111111234","5500000000000009","378282246310005","invalid")`, use `str_replace()` with two capture groups and a fixed-width middle pattern. Save the masked vector to `ex_6_3`.

**Expected result:**

```
#> [1] "4111XXXXXXXX1234" "5500XXXXXXXX0009" "378282246310005"  "invalid"
```

**Difficulty:** Intermediate

```r title="Your turn"
cards_v <- c("4111111111111234","5500000000000009","378282246310005","invalid")
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cards_v <- c("4111111111111234","5500000000000009","378282246310005","invalid")
ex_6_3 <- str_replace(cards_v, "^(\\d{4})\\d{8}(\\d{4})$", "\\1XXXXXXXX\\2")
ex_6_3
#> [1] "4111XXXXXXXX1234" "5500XXXXXXXX0009" "378282246310005"  "invalid"
```

**Explanation:** The anchors guarantee the input is exactly 16 digits with no surrounding text, so 15-digit Amex numbers and non-digit strings stay unchanged (no match means no substitution). Capturing the first 4 and last 4 digits lets the replacement weave the literal "XXXXXXXX" between them. For real PCI work, also consider tokenization rather than masking, since masked PANs are still considered cardholder data in some jurisdictions.

</details>

### Exercise 6.4: Normalize messy phone numbers to a canonical format

**Task:** A CRM cleanup task needs to normalize freeform US phone numbers (which may use parentheses, dots, spaces, or hyphens) into the canonical "(XXX) XXX-XXXX" form, and return `NA` for any input that does not contain exactly 10 digits. Given `phones_v2 <- c("(415) 555-2671","415.555.2671","415 555 2671","4155552671","1-415-555-2671","555-2671","abc")`, strip non-digits first with `str_replace_all()`, then format with `str_replace()` and three capture groups. Save the cleaned vector to `ex_6_4`.

**Expected result:**

```
#> [1] "(415) 555-2671" "(415) 555-2671" "(415) 555-2671" "(415) 555-2671" NA               NA               NA
```

**Difficulty:** Advanced

```r title="Your turn"
phones_v2 <- c("(415) 555-2671","415.555.2671","415 555 2671","4155552671",
               "1-415-555-2671","555-2671","abc")
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
phones_v2 <- c("(415) 555-2671","415.555.2671","415 555 2671","4155552671",
               "1-415-555-2671","555-2671","abc")
digits_only <- str_replace_all(phones_v2, "\\D", "")
ex_6_4 <- ifelse(
  str_detect(digits_only, "^\\d{10}$"),
  str_replace(digits_only, "^(\\d{3})(\\d{3})(\\d{4})$", "(\\1) \\2-\\3"),
  NA_character_
)
ex_6_4
#> [1] "(415) 555-2671" "(415) 555-2671" "(415) 555-2671" "(415) 555-2671" NA               NA               NA
```

**Explanation:** Splitting the problem in two (normalize then format) is much easier than writing one regex that accepts every input variant. `\\D` is the negation of `\\d` and removes parentheses, dots, dashes, and spaces in one pass. The length gate `^\\d{10}$` rejects "1-415-555-2671" (11 digits with country code) and "555-2671" (7 digits) without complicated logic. The final `str_replace()` weaves the three captures into the canonical form.

</details>

### Exercise 6.5: Strip HTML tags and decode common entity references

**Task:** A content-cleaning script needs to strip HTML tags and convert the three most common entity references (`&amp;`, `&lt;`, `&gt;`) to their literal characters from rich-text input. Given `raw_html <- c("<p>Hello &amp; goodbye</p>","<b>x &lt; y</b>","plain text","<span class=\"x\">tagged</span>")`, first use `str_replace_all()` with `"<[^>]+>"` to remove tags, then use the named-vector form of `str_replace_all()` for the three entity substitutions. Save the cleaned vector to `ex_6_5`.

**Expected result:**

```
#> [1] "Hello & goodbye" "x < y"           "plain text"      "tagged"
```

**Difficulty:** Advanced

```r title="Your turn"
raw_html <- c("<p>Hello &amp; goodbye</p>","<b>x &lt; y</b>","plain text","<span class=\"x\">tagged</span>")
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw_html <- c("<p>Hello &amp; goodbye</p>","<b>x &lt; y</b>","plain text","<span class=\"x\">tagged</span>")
stripped <- str_replace_all(raw_html, "<[^>]+>", "")
ex_6_5 <- str_replace_all(stripped, c("&amp;" = "&", "&lt;" = "<", "&gt;" = ">"))
ex_6_5
#> [1] "Hello & goodbye" "x < y"           "plain text"      "tagged"
```

**Explanation:** `<[^>]+>` matches a tag opening `<`, any non-`>` content, and the closing `>` in one shot; the negated class is what stops the match from greedily spanning multiple tags. The named-vector form of `str_replace_all()` applies each `pattern = replacement` mapping in turn across every input string, which is cleaner than three chained calls. For production HTML cleanup with nested or malformed markup, prefer `rvest::html_text()`, which handles entity decoding and attribute parsing correctly.

</details>

## What to do next

- Read [R Regular Expressions: Pattern Matching with stringr](R-Regex-stringr-Pattern-Matching.html) for the underlying grammar these exercises drill.
- Practice the broader stringr API in the [stringr Exercises in R](stringr-Exercises-in-R.html) hub, which covers detection, extraction, splitting, and padding.
- Apply regex inside data-frame pipelines with the [dplyr Exercises in R](dplyr-Exercises-in-R.html) hub, particularly the `filter()` and `mutate()` sections.
- Convert messy string columns into clean tidy data with the [tidyr Exercises in R](tidyr-Exercises-in-R.html) hub.
