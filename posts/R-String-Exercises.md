---
title: "R String Exercises: 18 stringr Practice Problems Solved"
slug: "R-String-Exercises"
description: "Eighteen stringr exercises with worked solutions: detect, extract, replace, split, pad, case, regex anchors, lookarounds, plus end-to-end cleanup workflows."
keywords: "R string exercises, stringr exercises, R regex exercises, R string practice, str_detect, str_extract, str_replace, stringr practice problems"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Strings (18 problems)"
sidebar_order: 215
fr_parent: "stringr-in-R.html"
auto_link_terms: "R string exercises|stringr exercises|R regex exercises|stringr practice problems|R string practice"
auto_link_case_sensitive: false
target_keyword: "R string exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R String Exercises: 18 stringr Practice Problems Solved

<p class="lead">Eighteen stringr practice problems with revealable solutions, organised into six sections covering detection, extraction, replacement, splitting, regex anchors and lookarounds, plus realistic cleanup pipelines. Each exercise names the dataset, the expected result, and a difficulty marker. Solutions stay collapsed until you click; work the problem first, then check your approach.</p>

Strings are where real data goes to die: trailing whitespace, mixed case, embedded dates, dollar signs in numbers, hashtags inside tweets. The `stringr` package gives you a small, consistent vocabulary for cleaning all of it. These eighteen problems cover the verbs and regex techniques you will reach for in every data-cleaning job.

## Setup

```r title="Run this once before any exercise"
library(stringr)
library(dplyr)
library(tibble)
```

## Section 1. Detect, count, and filter (3 problems)

### Exercise 1.1: Flag product reviews that mention the word great

**Task:** A retail analytics team needs to flag product reviews that mention the word `great` so the marketing team can pull customer testimonials. From the inline `reviews` tibble below, filter to rows where the `text` column contains `great` case-insensitively, and save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>      id text
#>   <int> <chr>
#> 1     1 Great product, fast shipping!
#> 2     3 Not great quality, returned it
#> 3     5 Customer service was great
#> 4     7 Looks great but battery is weak
```

**Difficulty:** Beginner

```r title="Setup data for Exercise 1.1"
reviews <- tibble(
  id = 1:8,
  text = c("Great product, fast shipping!",
           "Average price for the size",
           "Not great quality, returned it",
           "Loved every minute",
           "Customer service was great",
           "Will buy again",
           "Looks great but battery is weak",
           "Stopped working after 2 weeks")
)
```

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- reviews |>
  filter(str_detect(text, regex("great", ignore_case = TRUE)))
ex_1_1
#> # A tibble: 4 x 2
#>      id text
#>   <int> <chr>
#> 1     1 Great product, fast shipping!
#> 2     3 Not great quality, returned it
#> 3     5 Customer service was great
#> 4     7 Looks great but battery is weak
```

**Explanation:** `str_detect()` returns a logical vector that plugs directly into `filter()`. Wrapping the pattern in `regex(..., ignore_case = TRUE)` makes the match case-insensitive without altering the original text. A common mistake is `text == "great"`, which checks for an exact match rather than a substring match.

</details>

### Exercise 1.2: Count how often free appears in each subject line

**Task:** A marketing analyst auditing 8 campaign subject lines wants to know how aggressively each one uses the word `free` so they can flag overpromising messaging. Build a tibble with columns `subject` and `free_count` using `str_count()` on the `subjects` vector below (case-insensitive), and save the tibble to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 8 x 2
#>   subject                             free_count
#>   <chr>                                    <int>
#> 1 Save 10 percent                              0
#> 2 Free shipping, free returns                  2
#> 3 Buy one get one free                         1
#> 4 New arrivals                                 0
#> 5 Free trial, free demo, free upgrade          3
#> 6 Limited time only                            0
#> 7 Free Free Free                               3
#> 8 Welcome back                                 0
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 1.2"
subjects <- c(
  "Save 10 percent",
  "Free shipping, free returns",
  "Buy one get one free",
  "New arrivals",
  "Free trial, free demo, free upgrade",
  "Limited time only",
  "Free Free Free",
  "Welcome back"
)
```

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- tibble(
  subject    = subjects,
  free_count = str_count(subjects, regex("free", ignore_case = TRUE))
)
ex_1_2
#> # A tibble: 8 x 2
#>   subject                             free_count
#>   <chr>                                    <int>
#> 1 Save 10 percent                              0
#> 2 Free shipping, free returns                  2
#> 3 Buy one get one free                         1
#> 4 New arrivals                                 0
#> 5 Free trial, free demo, free upgrade          3
#> 6 Limited time only                            0
#> 7 Free Free Free                               3
#> 8 Welcome back                                 0
```

**Explanation:** `str_count()` returns one integer per input string, unlike `str_detect()`, which returns one TRUE/FALSE. Wrapping with `regex()` controls case sensitivity. To rank by aggressive copy, pipe into `arrange(desc(free_count))`. Note that `str_count()` counts non-overlapping matches, so `"aaaa"` matched against `"aa"` returns 2, not 3.

</details>

### Exercise 1.3: Keep only the SKUs that start with a digit

**Task:** A warehouse data engineer needs to separate numeric-prefixed SKUs from alphabetical ones in the `skus` vector below so they can be routed to different downstream pipelines. Use `str_detect()` with an anchored regex to keep only the SKUs whose first character is a digit (0 to 9), and save the filtered character vector to `ex_1_3`.

**Expected result:**

```
#> [1] "12-ALPHA" "7XX-RED"  "300-NEW"  "9-FINAL"
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 1.3"
skus <- c("ALPHA-12", "12-ALPHA", "BETA-99", "7XX-RED",
          "GAMMA", "300-NEW", "DELTA-1", "9-FINAL")
```

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- skus[str_detect(skus, "^\\d")]
ex_1_3
#> [1] "12-ALPHA" "7XX-RED"  "300-NEW"  "9-FINAL"
```

**Explanation:** The caret `^` anchors the match to the start of the string, while `\\d` matches any single digit. Without `^`, the regex would match any digit anywhere in the string, returning `ALPHA-12` and `BETA-99` too. The double backslash is needed because R parses `\\d` as a literal `\d` before the regex engine sees it.

</details>

## Section 2. Extract substrings and capture groups (3 problems)

### Exercise 2.1: Extract the year from quarterly report filenames

**Task:** An archive ops engineer is reorganising thousands of report files like `report_2024_q3.csv` and needs the year as its own column for partitioning. From the `filenames` vector below, use `str_extract()` with a four-digit pattern to pull out the year as a character vector, and save the result to `ex_2_1`.

**Expected result:**

```
#> [1] "2024" "2023" "2024" "2022" "2025" "2023"
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 2.1"
filenames <- c("report_2024_q3.csv", "summary_2023_annual.csv",
               "report_2024_q1.csv", "draft_2022_q4.csv",
               "final_2025_q2.csv", "audit_2023.csv")
```

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- str_extract(filenames, "\\d{4}")
ex_2_1
#> [1] "2024" "2023" "2024" "2022" "2025" "2023"
```

**Explanation:** `str_extract()` returns the FIRST match per string as a character vector, or `NA` when none is found. `\\d{4}` matches exactly four consecutive digits. If filenames could contain other four-digit numbers (an order id, for example), tighten the pattern with surrounding underscores: `(?<=_)\\d{4}(?=_)`. Convert to integer with `as.integer()` if you need numeric years.

</details>

### Exercise 2.2: Pull every hashtag from a vector of promotional tweets

**Task:** A social media analyst needs every hashtag mentioned across 6 promotional tweets so they can rank topic frequency. Use `str_extract_all()` with a hashtag pattern on the `tweets` vector below to return a list where each element is the character vector of hashtags from that tweet, and save the list to `ex_2_2`.

**Expected result:**

```
#> [[1]]
#> [1] "#sale"   "#summer"
#> 
#> [[2]]
#> character(0)
#> 
#> [[3]]
#> [1] "#newdrop"   "#exclusive" "#limited"
#> 
#> [[4]]
#> [1] "#review"
#> 
#> [[5]]
#> [1] "#flashsale" "#today"
#> 
#> [[6]]
#> character(0)
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 2.2"
tweets <- c(
  "Huge #sale this weekend #summer vibes",
  "Just shipped our newest release",
  "Drop alert: #newdrop #exclusive #limited",
  "Our #review of the new model",
  "#flashsale ends tonight #today only",
  "Thanks to everyone who joined the launch"
)
```

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- str_extract_all(tweets, "#\\w+")
ex_2_2
#> [[1]]
#> [1] "#sale"   "#summer"
#> 
#> [[2]]
#> character(0)
#> 
#> [[3]]
#> [1] "#newdrop"   "#exclusive" "#limited"
#> 
#> [[4]]
#> [1] "#review"
#> 
#> [[5]]
#> [1] "#flashsale" "#today"
#> 
#> [[6]]
#> character(0)
```

**Explanation:** `str_extract_all()` returns a list (one element per input) where each entry is every match found, or `character(0)` for strings with none. `#\\w+` matches a literal `#` followed by one or more word characters (letters, digits, underscore). Use `str_extract()` for one match per string; switch to `_all` when a string can hold many. Flatten with `unlist()` to get one long vector.

</details>

### Exercise 2.3: Capture area code, exchange, and line from US phone numbers

**Task:** A CRM cleanup script is normalising contact data and needs the three numeric parts of US phone numbers split out for validation. From the `phones` vector formatted as `(415) 555-1234`, use `str_match()` with three capture groups to return a matrix with four columns (full match, area, exchange, line), and save the matrix to `ex_2_3`.

**Expected result:**

```
#>      [,1]             [,2]  [,3]  [,4]  
#> [1,] "(415) 555-1234" "415" "555" "1234"
#> [2,] "(212) 867-5309" "212" "867" "5309"
#> [3,] "(650) 253-0000" "650" "253" "0000"
#> [4,] "(800) 273-8255" "800" "273" "8255"
```

**Difficulty:** Advanced

```r title="Setup data for Exercise 2.3"
phones <- c("(415) 555-1234",
            "(212) 867-5309",
            "(650) 253-0000",
            "(800) 273-8255")
```

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- str_match(phones, "\\((\\d{3})\\) (\\d{3})-(\\d{4})")
ex_2_3
#>      [,1]             [,2]  [,3]  [,4]  
#> [1,] "(415) 555-1234" "415" "555" "1234"
#> [2,] "(212) 867-5309" "212" "867" "5309"
#> [3,] "(650) 253-0000" "650" "253" "0000"
#> [4,] "(800) 273-8255" "800" "273" "8255"
```

**Explanation:** `str_match()` returns a matrix: column 1 is the full match, columns 2 onward are each capture group in order. Parentheses around `\\d{3}` create capture groups, while the outer `\\(` and `\\)` escape the literal parentheses of the input. Coerce to a tibble with `as_tibble(ex_2_3[, -1], .name_repair = ~ c("area", "exchange", "line"))` for downstream joins.

</details>

## Section 3. Replace and rewrite (3 problems)

### Exercise 3.1: Mask credit card numbers while keeping the last four digits

**Task:** A compliance officer auditing transaction logs needs credit card numbers masked so support staff can still confirm the last four digits with customers, but not see the rest. From the `cards` vector formatted as `1234-5678-9012-3456`, use `str_replace()` with a backreference to replace the first three groups with `XXXX`, and save the masked character vector to `ex_3_1`.

**Expected result:**

```
#> [1] "XXXX-XXXX-XXXX-3456" "XXXX-XXXX-XXXX-1111"
#> [3] "XXXX-XXXX-XXXX-4242" "XXXX-XXXX-XXXX-7890"
```

**Difficulty:** Advanced

```r title="Setup data for Exercise 3.1"
cards <- c("1234-5678-9012-3456",
           "4111-1111-1111-1111",
           "4242-4242-4242-4242",
           "5500-0000-0000-7890")
```

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- str_replace(cards,
                      "^\\d{4}-\\d{4}-\\d{4}-(\\d{4})$",
                      "XXXX-XXXX-XXXX-\\1")
ex_3_1
#> [1] "XXXX-XXXX-XXXX-3456" "XXXX-XXXX-XXXX-1111"
#> [3] "XXXX-XXXX-XXXX-4242" "XXXX-XXXX-XXXX-7890"
```

**Explanation:** A backreference `\\1` in the replacement string refers to the first capture group, which is the last four digits here. Anchoring with `^` and `$` ensures the pattern only matches a complete card number, not a 16-digit substring embedded in something else. `str_replace()` is enough since each input has exactly one card; switch to `str_replace_all()` for multi-card strings.

</details>

### Exercise 3.2: Standardise messy spellings of the iPhone brand name

**Task:** A marketing analyst auditing customer support tickets sees `iPhone` spelled four ways: `iphone`, `IPhone`, `i-phone`, `I phone`. Use `str_replace_all()` with a single case-insensitive regex on the `tickets` vector below that catches all four variants and rewrites them to the canonical `iPhone`. Save the cleaned character vector to `ex_3_2`.

**Expected result:**

```
#> [1] "iPhone battery drains fast"   
#> [2] "Selling my old iPhone"        
#> [3] "iPhone screen cracked"        
#> [4] "Bought a new iPhone yesterday"
#> [5] "iPhone vs Android comparison"
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 3.2"
tickets <- c("iphone battery drains fast",
             "Selling my old IPhone",
             "i-phone screen cracked",
             "Bought a new I phone yesterday",
             "iPhone vs Android comparison")
```

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- str_replace_all(tickets,
                          regex("i[- ]?phone", ignore_case = TRUE),
                          "iPhone")
ex_3_2
#> [1] "iPhone battery drains fast"   
#> [2] "Selling my old iPhone"        
#> [3] "iPhone screen cracked"        
#> [4] "Bought a new iPhone yesterday"
#> [5] "iPhone vs Android comparison"
```

**Explanation:** `[- ]?` matches an optional hyphen or space between `i` and `phone`, covering all four variants in one pattern. The `regex(..., ignore_case = TRUE)` wrapper means we do not need separate alternatives for uppercase `I`. Always prefer one tight regex over a chain of `str_replace_all()` calls: it is faster and easier to maintain.

</details>

### Exercise 3.3: Insert thousand separators into raw numeric strings

**Task:** A finance analyst preparing a board report needs numeric strings formatted with comma thousand separators for readability. Given the `amounts` vector of raw numeric strings like `"1234567"`, use `str_replace_all()` with a lookahead-based regex to produce strings like `"1,234,567"`, and save the formatted character vector to `ex_3_3`.

**Expected result:**

```
#> [1] "1,234,567" "42"        "999"       "100,000"   "12,345,678"
```

**Difficulty:** Advanced

```r title="Setup data for Exercise 3.3"
amounts <- c("1234567", "42", "999", "100000", "12345678")
```

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- str_replace_all(amounts, "\\B(?=(\\d{3})+(?!\\d))", ",")
ex_3_3
#> [1] "1,234,567" "42"        "999"       "100,000"   "12,345,678"
```

**Explanation:** `\\B` is a non-word-boundary, preventing a comma at position 0. The lookahead `(?=(\\d{3})+(?!\\d))` matches positions followed by groups of three digits, ending where no more digits remain. Numbers under 1000 stay untouched because no qualifying position exists. For locale-aware formatting on actual numerics, `formatC(x, big.mark = ",", format = "d")` is simpler.

</details>

## Section 4. Split, join, pad, and case (3 problems)

### Exercise 4.1: Split full names into first and last name columns

**Task:** A reporting analyst building an HR directory has a vector of full names like `"Ada Lovelace"` and needs them split into two columns: first name and last name. Use `str_split_fixed()` on the `full_names` vector below to return a two-column matrix, and save the result to `ex_4_1`.

**Expected result:**

```
#>      [,1]      [,2]      
#> [1,] "Ada"     "Lovelace"
#> [2,] "Alan"    "Turing"  
#> [3,] "Grace"   "Hopper"  
#> [4,] "Donald"  "Knuth"   
#> [5,] "Barbara" "Liskov"
```

**Difficulty:** Beginner

```r title="Setup data for Exercise 4.1"
full_names <- c("Ada Lovelace", "Alan Turing", "Grace Hopper",
                "Donald Knuth", "Barbara Liskov")
```

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- str_split_fixed(full_names, " ", n = 2)
ex_4_1
#>      [,1]      [,2]      
#> [1,] "Ada"     "Lovelace"
#> [2,] "Alan"    "Turing"  
#> [3,] "Grace"   "Hopper"  
#> [4,] "Donald"  "Knuth"   
#> [5,] "Barbara" "Liskov"
```

**Explanation:** `str_split_fixed()` returns a rectangular matrix with `n` columns, padding short rows with `""`. Compare with `str_split()`, which returns a list of variable-length vectors and is awkward to bind into a frame. For names with middle parts (`"Ada Augusta King Lovelace"`), `n = 2` keeps the first token and bundles the rest into column 2. To get a tibble, wrap with `as_tibble(.name_repair = ~ c("first", "last"))`.

</details>

### Exercise 4.2: Pad zip codes to exactly five digits with leading zeros

**Task:** A postal data cleaner has zip codes loaded as integers, which dropped the leading zeros for New England states (`2138` should be `02138`). Convert the `zips` integer vector to character and use `str_pad()` to ensure every code is exactly 5 digits wide with leading zeros. Save the cleaned character vector to `ex_4_2`.

**Expected result:**

```
#> [1] "02138" "10001" "94110" "00501" "60601" "07030"
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 4.2"
zips <- c(2138L, 10001L, 94110L, 501L, 60601L, 7030L)
```

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- str_pad(as.character(zips), width = 5, side = "left", pad = "0")
ex_4_2
#> [1] "02138" "10001" "94110" "00501" "60601" "07030"
```

**Explanation:** `str_pad()` is the idiomatic way to widen short strings with a fill character. `side = "left"` pads on the left, which is correct for zero-prefixed identifiers. Inputs that already meet or exceed `width` are returned unchanged. A common alternative is `sprintf("%05d", zips)`, but `str_pad()` is more readable and composes cleanly inside a dplyr pipeline.

</details>

### Exercise 4.3: Reformat First Last names into Last, First order

**Task:** A reporting analyst preparing a printed directory needs names reversed from `"Ada Lovelace"` to `"Lovelace, Ada"` so the list can be alphabetised by surname. Reuse the `full_names` vector from Exercise 4.1 and apply a single `str_replace()` with two capture groups to swap the order. Save the reformatted character vector to `ex_4_3`.

**Expected result:**

```
#> [1] "Lovelace, Ada"  "Turing, Alan"   "Hopper, Grace" 
#> [4] "Knuth, Donald"  "Liskov, Barbara"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- str_replace(full_names, "^(\\S+)\\s+(.+)$", "\\2, \\1")
ex_4_3
#> [1] "Lovelace, Ada"  "Turing, Alan"   "Hopper, Grace" 
#> [4] "Knuth, Donald"  "Liskov, Barbara"
```

**Explanation:** Two capture groups bind the first token and everything after the first space, then the replacement swaps them. Using `(.+)` for the second group keeps multi-part surnames intact (`"Le Guin"`, `"Van Dijk"`). The alternative `str_split()` plus `paste()` works too but operates on a list, while the regex approach stays vectorised and faster.

</details>

## Section 5. Anchors, quantifiers, and lookarounds (3 problems)

### Exercise 5.1: Detect valid US zip codes including the ZIP+4 form

**Task:** An e-commerce validation script needs to reject mistyped shipping codes before checkout. Given the `codes` character vector mixing 5-digit zips, ZIP+4 codes like `90210-1234`, and invalid junk, use `str_detect()` with an anchored regex to return a logical vector flagging only valid US zip codes. Save the logical vector to `ex_5_1`.

**Expected result:**

```
#> [1]  TRUE  TRUE FALSE FALSE  TRUE  TRUE FALSE
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 5.1"
codes <- c("02138", "94110-1234", "1234", "ABCDE",
           "00501", "90210-0000", "90210-12")
```

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- str_detect(codes, "^\\d{5}(-\\d{4})?$")
ex_5_1
#> [1]  TRUE  TRUE FALSE FALSE  TRUE  TRUE FALSE
```

**Explanation:** `^` and `$` force the entire input to match, not just a substring, so `1234` fails because it is only four digits long. The group `(-\\d{4})?` makes the four-digit extension optional, accepting both plain ZIP and ZIP+4. Without anchors, `1234` would match the first four digits of any longer string and return TRUE incorrectly.

</details>

### Exercise 5.2: Extract every word that is at least seven letters long

**Task:** A readability checker flags long words to suggest simpler alternatives for an editor. From the `text_vec` character vector of three sentences, use `str_extract_all()` with a word-boundary regex that matches words of seven or more letters, and save the resulting list (one element per sentence) to `ex_5_2`.

**Expected result:**

```
#> [[1]]
#> [1] "extraordinary" "performance"  
#> 
#> [[2]]
#> [1] "comprehensive" "documentation" "essential"    
#> 
#> [[3]]
#> [1] "Statistics" "fascinating"
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 5.2"
text_vec <- c(
  "The new model showed extraordinary performance",
  "We need comprehensive documentation, it is essential",
  "Statistics can be fascinating"
)
```

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- str_extract_all(text_vec, "\\b[A-Za-z]{7,}\\b")
ex_5_2
#> [[1]]
#> [1] "extraordinary" "performance"  
#> 
#> [[2]]
#> [1] "comprehensive" "documentation" "essential"    
#> 
#> [[3]]
#> [1] "Statistics" "fascinating"
```

**Explanation:** `\\b` is a word boundary, ensuring the match starts and ends at a word edge so `dinary` does not match inside `extraordinary`. `[A-Za-z]{7,}` requires at least seven letters. To include words with digits or hyphens, switch to `\\w{7,}` or extend the character class. Call `unlist()` to get a single flat vector across all sentences.

</details>

### Exercise 5.3: Extract dollar prices using a positive lookbehind

**Task:** A pricing analyst scraping marketplace listings needs every dollar price mentioned in the `listings` vector, captured without the leading `$` sign so the values can be parsed as numerics. Use `str_extract_all()` with a positive lookbehind `(?<=\\$)` followed by the numeric pattern, and save the list of character vectors to `ex_5_3`.

**Expected result:**

```
#> [[1]]
#> [1] "19.99" "24.50"
#> 
#> [[2]]
#> [1] "100"
#> 
#> [[3]]
#> [1] "9.99"   "19.99"  "199.00"
#> 
#> [[4]]
#> character(0)
```

**Difficulty:** Advanced

```r title="Setup data for Exercise 5.3"
listings <- c(
  "Sale: was $19.99, now $24.50",
  "Flat $100 fee",
  "Bundle: $9.99, $19.99, or $199.00",
  "Free shipping, no extra charge"
)
```

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- str_extract_all(listings, "(?<=\\$)\\d+(?:\\.\\d{2})?")
ex_5_3
#> [[1]]
#> [1] "19.99" "24.50"
#> 
#> [[2]]
#> [1] "100"
#> 
#> [[3]]
#> [1] "9.99"   "19.99"  "199.00"
#> 
#> [[4]]
#> character(0)
```

**Explanation:** A lookbehind `(?<=\\$)` requires a `$` immediately before the match, but the `$` itself is not part of the captured text, so you get clean numerics. `(?:...)` is a non-capturing group used here so the decimal portion is optional without polluting capture results. Convert to numeric for totals with `as.numeric(unlist(ex_5_3))`.

</details>

## Section 6. End-to-end string cleanup workflows (3 problems)

### Exercise 6.1: Normalise messy customer name records in one pipeline

**Task:** A CRM team importing a customer file finds names with random whitespace, mixed case, and double spaces. From the `dirty_names` vector below, build a single pipeline that squishes whitespace with `str_squish()` and converts to title case with `str_to_title()`. Save the cleaned character vector to `ex_6_1`.

**Expected result:**

```
#> [1] "Ada Lovelace"    "Alan Turing"     "Grace Hopper"   
#> [4] "Donald Knuth"    "Barbara Liskov"  "John Von Neumann"
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 6.1"
dirty_names <- c("  ada lovelace ",
                 "alan   TURING",
                 "grace HOPPER  ",
                 "  donald knuth",
                 "BARBARA   liskov ",
                 " john von neumann ")
```

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- dirty_names |>
  str_squish() |>
  str_to_title()
ex_6_1
#> [1] "Ada Lovelace"    "Alan Turing"     "Grace Hopper"   
#> [4] "Donald Knuth"    "Barbara Liskov"  "John Von Neumann"
```

**Explanation:** `str_squish()` trims outer whitespace AND collapses internal runs to single spaces, doing the job of `str_trim()` plus a replace in one step. `str_to_title()` capitalises the first letter of every space-separated token. Watch out for names like `"o'brien"`, where you may want capitalisation after the apostrophe too; that requires a custom regex pass with `str_replace_all()`.

</details>

### Exercise 6.2: Parse server log lines into a tidy data frame

**Task:** A site reliability engineer needs daily log lines like `[2024-08-15 10:23:45] WARN auth.service: token expired` parsed into structured fields for monitoring dashboards. From the `logs` vector below, use `str_match()` with four capture groups (timestamp, level, service, message) and assemble the result into a tibble with named columns. Save the tibble to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   timestamp           level service       message
#>   <chr>               <chr> <chr>         <chr>
#> 1 2024-08-15 10:23:45 WARN  auth.service  token expired
#> 2 2024-08-15 10:24:01 INFO  user.api      login ok
#> 3 2024-08-15 10:25:17 ERROR payment.api   gateway timeout
#> 4 2024-08-15 10:26:02 DEBUG cache.layer   evicted key
```

**Difficulty:** Advanced

```r title="Setup data for Exercise 6.2"
logs <- c(
  "[2024-08-15 10:23:45] WARN auth.service: token expired",
  "[2024-08-15 10:24:01] INFO user.api: login ok",
  "[2024-08-15 10:25:17] ERROR payment.api: gateway timeout",
  "[2024-08-15 10:26:02] DEBUG cache.layer: evicted key"
)
```

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pattern <- "^\\[(.+?)\\] (\\w+) ([\\w.]+): (.+)$"
m <- str_match(logs, pattern)
ex_6_2 <- tibble(
  timestamp = m[, 2],
  level     = m[, 3],
  service   = m[, 4],
  message   = m[, 5]
)
ex_6_2
#> # A tibble: 4 x 4
#>   timestamp           level service       message
#>   <chr>               <chr> <chr>         <chr>
#> 1 2024-08-15 10:23:45 WARN  auth.service  token expired
#> 2 2024-08-15 10:24:01 INFO  user.api      login ok
#> 3 2024-08-15 10:25:17 ERROR payment.api   gateway timeout
#> 4 2024-08-15 10:26:02 DEBUG cache.layer   evicted key
```

**Explanation:** `(.+?)` is a lazy capture, stopping at the first `]` so the timestamp does not bleed into the next field. `(\\w+)` captures the alphabetic level; `([\\w.]+)` allows dotted service names like `auth.service`. Lines that fail the pattern give a row of `NA`, which makes upstream validation easy: filter `is.na(timestamp)` to surface malformed records.

</details>

### Exercise 6.3: Convert article titles into clean URL slugs

**Task:** An editor publishing to a CMS needs human titles converted into URL slugs that are lowercase, contain only alphanumerics and hyphens, have no leading or trailing dashes, and no consecutive dashes. From the `titles` vector below, build a pipeline using `str_to_lower()` and two `str_replace_all()` passes. Save the slug character vector to `ex_6_3`.

**Expected result:**

```
#> [1] "10-tips-for-faster-r-code"            
#> [2] "regex-in-r-a-complete-guide"          
#> [3] "dplyr-vs-data-table-which-wins"       
#> [4] "from-zero-to-shiny-app"               
#> [5] "ggplot2-themes-explained"
```

**Difficulty:** Intermediate

```r title="Setup data for Exercise 6.3"
titles <- c(
  "10 Tips for Faster R Code!",
  "Regex in R: A Complete Guide",
  "dplyr vs data.table -- Which Wins?",
  "From Zero to Shiny App",
  "ggplot2 Themes Explained..."
)
```

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- titles |>
  str_to_lower() |>
  str_replace_all("[^a-z0-9]+", "-") |>
  str_replace_all("^-|-$", "")
ex_6_3
#> [1] "10-tips-for-faster-r-code"            
#> [2] "regex-in-r-a-complete-guide"          
#> [3] "dplyr-vs-data-table-which-wins"       
#> [4] "from-zero-to-shiny-app"               
#> [5] "ggplot2-themes-explained"
```

**Explanation:** Replacing one or more non-alphanumerics with a single dash (`[^a-z0-9]+`) collapses spaces, punctuation, and multiple dashes in one pass. The final pass strips leading and trailing dashes that resulted from punctuation at the edges. For Unicode titles with accents, run `stringi::stri_trans_general(x, "Latin-ASCII")` before lowercasing so characters like `é` fold to `e`.

</details>

## What to do next

- Review the [stringr in R](stringr-in-R.html) reference for a deeper tour of every verb covered above.
- Drill the pattern language itself in the [Regex Exercises in R](Regex-Exercises-in-R.html) hub.
- Keep the [Regex Cheat Sheet for stringr](R-Regex-Cheat-Sheet-stringr.html) at hand while you work.
- Combine string operations with row-wise data work in the [dplyr Exercises in R](dplyr-Exercises-in-R.html) hub.
