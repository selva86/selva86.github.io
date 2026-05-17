---
title: "stringr Exercises in R: 28 Practice Problems with Solutions"
slug: "stringr-Exercises-in-R"
description: "Practice stringr with 28 real exercises covering detection, extraction, replacement, splitting and regex. Hidden solutions, explanations, runnable code."
keywords: "stringr exercises, regex in R exercises, str_detect, str_extract, str_replace, str_split, stringr practice"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "stringr Exercises"
sidebar_order: 130
fr_parent: "stringr-in-R.html"
auto_link_terms: "stringr exercises|regex exercises in r|str_detect practice|str_extract practice|stringr practice problems"
auto_link_case_sensitive: false
target_keyword: "stringr exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# stringr Exercises in R: 28 Practice Problems with Solutions

<p class="lead">Twenty-eight runnable problems that cover stringr from `str_length` through capture groups, lookarounds and slugification. Each exercise names the output variable, shows the exact result your code should print and hides the solution behind a click. Mix is 5 Beginner, 17 Intermediate, 6 Advanced.</p>

```r title="Run this once before any exercise"
library(stringr)
library(dplyr)
library(tibble)
library(tidyr)
```

## Section 1. Inspecting and reshaping strings (4 problems)

### Exercise 1.1: Measure character length of every fruit name

**Task:** stringr ships with a vector `fruit` containing 80 common fruit names. The product team wants to know how long each name is before designing a fixed-width product label. Compute the character length of every entry in `fruit` using `str_length()` and save the integer vector to `ex_1_1`.

**Expected result:**

```
#>  [1]  5  8  6  9  9 10  9  9  9  7  7 11  6  8  6  5 10 12 11  9  7  9  4 10  6
#> [26]  6  4 13  9 13  4  5 10  4  5  5  6  6  7 13 11  6  9  9  6  6  5  9  6  5
#> [51] 11 11 11  7  9  8  5  5  6  9  6  6  6  5  6  9 10  9  6  5 10  6  9  9 14
#> [76]  8  7  6  9 10
```

**Difficulty:** Beginner

[HINTS]
Every string has a size you can measure - you want one count for each fruit name in the vector.
Call the length-measuring function on the whole `fruit` vector; it returns one integer per element.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- str_length(fruit)
ex_1_1
#>  [1]  5  8  6  9  9 10  9  9  9  7  7 11  6  8  6  5 10 12 11  9  7  9  4 10  6
#> [26]  6  4 13  9 13  4  5 10  4  5  5  6  6  7 13 11  6  9  9  6  6  5  9  6  5
#> [51] 11 11 11  7  9  8  5  5  6  9  6  6  6  5  6  9 10  9  6  5 10  6  9  9 14
#> [76]  8  7  6  9 10
```

**Explanation:** `str_length()` counts Unicode characters, not bytes, which matters for accented or emoji input where `nchar()` can mislead with multibyte encodings. The return is always a plain integer vector the same length as the input, with `NA` preserved for missing entries. Prefer it over `nchar()` in any pipeline that may see non-ASCII data.

</details>

### Exercise 1.2: Slice the first three letters of each fruit

**Task:** Take the same `fruit` vector and pull the first three characters of each name to use as a stock-keeping prefix. Use `str_sub()` with positional arguments and save the resulting character vector to `ex_1_2`.

**Expected result:**

```
#>  [1] "app" "apr" "avo" "ban" "bel" "bil" "bla" "bla" "blo" "blu" "boy" "bre"
#> [13] "can" "cha" "che" "chi" "cla" "clo" "coc" "cra" "cur" "dam" "dat" "dra"
#> [25] "dur" "egg" "eld"
#> ...
```

**Difficulty:** Beginner

[HINTS]
You want a fixed-width slice taken from the start of each name, not the whole string.
Use `str_sub()` with `start = 1` and `end = 3` on the `fruit` vector.

```r title="Your turn"
ex_1_2 <- # your code here
head(ex_1_2, 27)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- str_sub(fruit, start = 1, end = 3)
head(ex_1_2, 27)
#>  [1] "app" "apr" "avo" "ban" "bel" "bil" "bla" "bla" "blo" "blu" "boy" "bre"
#> [13] "can" "cha" "che" "chi" "cla" "clo" "coc" "cra" "cur" "dam" "dat" "dra"
#> [25] "dur" "egg" "eld"
```

**Explanation:** `str_sub()` accepts negative positions so `str_sub(fruit, -3, -1)` would give the last three letters instead, which `substr()` cannot do without arithmetic. The function is also assignable: `str_sub(x, 1, 3) <- "XYZ"` overwrites the first three characters in place. Vectorised over both the string and the position arguments.

</details>

### Exercise 1.3: Pad ticker symbols to a fixed five-character width

**Task:** A trading desk needs a list of equity ticker symbols printed in a fixed five-character column with leading zeros so they line up in a CSV dump for a legacy downstream system. Given `tickers <- c("A", "BAC", "GE", "MSFT", "GOOGL")`, pad each ticker on the left with `0` to width 5 using `str_pad()` and save the character vector to `ex_1_3`.

**Expected result:**

```
#> [1] "0000A" "00BAC" "000GE" "0MSFT" "GOOGL"
```

**Difficulty:** Intermediate

[HINTS]
Short symbols need extra filler characters added to one side until they all reach the same length.
Use `str_pad()` with `width = 5`, `side = "left"` and `pad = "0"`.

```r title="Your turn"
tickers <- c("A", "BAC", "GE", "MSFT", "GOOGL")
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tickers <- c("A", "BAC", "GE", "MSFT", "GOOGL")
ex_1_3 <- str_pad(tickers, width = 5, side = "left", pad = "0")
ex_1_3
#> [1] "0000A" "00BAC" "000GE" "0MSFT" "GOOGL"
```

**Explanation:** `str_pad()` only grows strings, it never truncates, which is why `GOOGL` stays at length 5 untouched. The `side` argument accepts `"left"`, `"right"` or `"both"` for centring, and `pad` can be any single character. For situations where you want truncation too, chain with `str_trunc()`, or use `formatC()` for sprintf-style numeric padding.

</details>

### Exercise 1.4: Title-case messy customer-entered names

**Task:** A signup form did not enforce capitalisation, so the customer-success team has names like `"alice JOHNSON"` and `"   bob  smith "` in their export. Given the vector below, first squish runs of whitespace with `str_squish()`, then apply `str_to_title()`, and save the cleaned character vector to `ex_1_4`.

**Expected result:**

```
#> [1] "Alice Johnson" "Bob Smith"     "Carla Diaz"    "Devon Khan"
```

**Difficulty:** Intermediate

[HINTS]
Clean up the stray spacing first, then fix the capitalisation - two passes in that order.
Pipe `raw_names` through `str_squish()` and then `str_to_title()`.

```r title="Your turn"
raw_names <- c("alice JOHNSON", "   bob  smith ", "CARLA   diaz", "  devon KHAN")
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw_names <- c("alice JOHNSON", "   bob  smith ", "CARLA   diaz", "  devon KHAN")
ex_1_4 <- raw_names |>
  str_squish() |>
  str_to_title()
ex_1_4
#> [1] "Alice Johnson" "Bob Smith"     "Carla Diaz"    "Devon Khan"
```

**Explanation:** `str_squish()` collapses every internal run of whitespace down to a single space and also trims leading and trailing whitespace in one step, doing what `str_trim()` plus a `str_replace_all("\\s+", " ")` would have taken two calls. `str_to_title()` uppercases the first letter of each word and lowercases the rest, which is exactly what name normalisation needs. For locale-sensitive casing (Turkish dotted-i, German eszett) pass `locale = "tr"` or similar.

</details>

## Section 2. Detecting and filtering patterns (5 problems)

### Exercise 2.1: Flag fruits that contain the letter pair "ap"

**Task:** The category lead wants a logical flag for every entry in `fruit` indicating whether the literal substring `"ap"` appears anywhere in the name. Use `str_detect()` and save the logical vector of length 80 to `ex_2_1`. Also print `sum(ex_2_1)` so the count of matches is visible.

**Expected result:**

```
#> sum(ex_2_1)
#> [1] 6
#> fruit[ex_2_1]
#> [1] "apple"        "apricot"      "cape gooseberry" "grape"
#> [5] "grapefruit"   "pineapple"
```

**Difficulty:** Beginner

[HINTS]
You need a yes/no answer for each name about whether a small piece of text appears somewhere inside it.
Use `str_detect()` with the pattern `"ap"` on the `fruit` vector.

```r title="Your turn"
ex_2_1 <- # your code here
sum(ex_2_1); fruit[ex_2_1]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- str_detect(fruit, "ap")
sum(ex_2_1)
#> [1] 6
fruit[ex_2_1]
#> [1] "apple"           "apricot"         "cape gooseberry" "grape"
#> [5] "grapefruit"      "pineapple"
```

**Explanation:** `str_detect()` returns a logical the same length as the input so it slots straight into `filter()` calls or base subsetting. The pattern is a regular expression by default, but plain literals like `"ap"` still work because they happen to be valid regex. Use `fixed("ap")` if you want to disable the regex engine for speed or to avoid metacharacter surprises on user input.

</details>

### Exercise 2.2: Filter words that end with "ing"

**Task:** Take the built-in `words` vector (980 common English words shipped with stringr) and keep only those that end with the suffix `"ing"` using `str_subset()` and an anchored regex. Save the result to `ex_2_2` and print its length plus the first ten entries.

**Expected result:**

```
#> length(ex_2_2)
#> [1] 12
#> head(ex_2_2, 10)
#>  [1] "bring"    "ceiling"  "during"   "evening"  "king"     "meaning"
#>  [7] "morning"  "ring"     "sing"     "spring"
```

**Difficulty:** Intermediate

[HINTS]
Keep only the entries whose tail matches a given suffix; an end-anchor in the pattern enforces "tail".
Use `str_subset()` on `words` with the anchored pattern `"ing$"`.

```r title="Your turn"
ex_2_2 <- # your code here
length(ex_2_2); head(ex_2_2, 10)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- str_subset(words, "ing$")
length(ex_2_2)
#> [1] 12
head(ex_2_2, 10)
#>  [1] "bring"    "ceiling"  "during"   "evening"  "king"     "meaning"
#>  [7] "morning"  "ring"     "sing"     "spring"
```

**Explanation:** `str_subset(x, pat)` is shorthand for `x[str_detect(x, pat)]` and reads more cleanly in a pipeline. The dollar sign `$` anchors the pattern to the end of the string, which is why `"thing"` matches but `"things"` would not. Pair with `^` for start-of-string anchors and `\\b` for word boundaries when you cannot assume the target is the whole string.

</details>

### Exercise 2.3: Find URLs that start with https and end with .com

**Task:** A web-analytics analyst is auditing a list of inbound links and wants only those served over HTTPS that resolve to a `.com` domain. Given the vector `urls` below, use `str_starts()` and `str_ends()` combined with `&` to build a logical filter, then subset `urls`. Save the kept URLs as a character vector to `ex_2_3`.

**Expected result:**

```
#> [1] "https://example.com"  "https://shop.acme.com"
```

**Difficulty:** Intermediate

[HINTS]
Two separate conditions - one about the start, one about the end - both have to hold before you keep a URL.
Combine `str_starts(urls, "https")` and `str_ends(urls, "\\.com")` with `&`, then subset `urls`.

```r title="Your turn"
urls <- c(
  "https://example.com",
  "http://example.com",
  "https://docs.example.org",
  "https://shop.acme.com",
  "ftp://files.acme.com"
)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
urls <- c(
  "https://example.com",
  "http://example.com",
  "https://docs.example.org",
  "https://shop.acme.com",
  "ftp://files.acme.com"
)
keep <- str_starts(urls, "https") & str_ends(urls, "\\.com")
ex_2_3 <- urls[keep]
ex_2_3
#> [1] "https://example.com"   "https://shop.acme.com"
```

**Explanation:** `str_starts()` and `str_ends()` are anchored detect helpers, equivalent to `str_detect(x, "^pat")` and `str_detect(x, "pat$")`. The dot in `.com` is escaped to `\\.com` so it matches a literal period rather than any character. Splitting the test into two named conditions reads better in code review than one long regex like `"^https.*\\.com$"`.

</details>

### Exercise 2.4: Count vowels in each sentence

**Task:** stringr's built-in `sentences` vector contains 720 short example sentences. The linguistics team wants the number of vowel characters (`aeiouAEIOU`) in each sentence so they can build a readability table. Use `str_count()` with a character class on the first six sentences. Save the integer vector to `ex_2_4`.

**Expected result:**

```
#> [1] 9 10 11 11 9 9
```

**Difficulty:** Intermediate

[HINTS]
You need a tally of how many characters from a given set occur in each sentence.
Use `str_count()` with the character class `"[aeiouAEIOU]"` on `six`.

```r title="Your turn"
six <- sentences[1:6]
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
six <- sentences[1:6]
ex_2_4 <- str_count(six, "[aeiouAEIOU]")
ex_2_4
#> [1]  9 10 11 11  9  9
```

**Explanation:** `str_count()` returns the number of non-overlapping matches per input string, perfect for tallying character classes. The bracketed set `[aeiouAEIOU]` is a regex character class, where every character inside is an alternative. You could also write the case-insensitive version as `regex("[aeiou]", ignore_case = TRUE)` if you want the casing toggled outside the pattern itself.

</details>

### Exercise 2.5: Locate the positions of fruits beginning with "bl"

**Task:** Given `fruit`, get the integer positions of the entries whose name starts with the letters `"bl"`. Use `str_which()` so the result is an integer vector of indices rather than a logical one, and save it to `ex_2_5`. Then use those indices to print the matching names.

**Expected result:**

```
#> ex_2_5
#> [1]  7  8  9 10
#> fruit[ex_2_5]
#> [1] "black currant" "black sapote"  "blackberry"    "blueberry"
```

**Difficulty:** Intermediate

[HINTS]
You want the index numbers of the matches, not a true/false vector.
Use `str_which()` with the start-anchored pattern `"^bl"` on `fruit`.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5; fruit[ex_2_5]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- str_which(fruit, "^bl")
ex_2_5
#> [1]  7  8  9 10
fruit[ex_2_5]
#> [1] "black currant" "black sapote"  "blackberry"    "blueberry"
```

**Explanation:** `str_which()` is the index-returning sibling of `str_detect()`, equivalent to `which(str_detect(x, pat))`. Index vectors are useful when you need to align two parallel vectors, write back into a subset of a column or pass to `slice()`. The caret `^` anchors the regex at the start, so `"blackberry"` matches but a hypothetical `"oblique fruit"` would not.

</details>

## Section 3. Extracting and capturing matches (5 problems)

### Exercise 3.1: Extract the first digit sequence from order IDs

**Task:** A reporting analyst needs the numeric component of mixed order identifiers like `"ORD-2419-A"` so they can join to a numeric ledger. From the vector `orders` below, use `str_extract()` with the pattern `"\\d+"` to grab the first run of digits in each ID. Save the character vector to `ex_3_1`.

**Expected result:**

```
#> [1] "2419" "1788" "55"   NA     "9001"
```

**Difficulty:** Intermediate

[HINTS]
Grab only the first numeric chunk out of each mixed identifier and let the rest fall away.
Use `str_extract()` with the pattern `"\\d+"` on `orders`.

```r title="Your turn"
orders <- c("ORD-2419-A", "ORD-1788-B", "REF-55-Z", "ORD-NOID-X", "INV-9001-Q")
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders <- c("ORD-2419-A", "ORD-1788-B", "REF-55-Z", "ORD-NOID-X", "INV-9001-Q")
ex_3_1 <- str_extract(orders, "\\d+")
ex_3_1
#> [1] "2419" "1788" "55"   NA     "9001"
```

**Explanation:** `str_extract()` returns the first match per string and `NA` when nothing matches, which is exactly what you want for joining downstream (the `NA` row drops on an inner join). `\\d+` means "one or more digits" and is shorter than `[0-9]+` but identical under default ASCII matching. To convert to integers in a single pipeline, chain `as.integer()` after the extract.

</details>

### Exercise 3.2: Extract every hashtag from each tweet

**Task:** Social-team copy contains hashtags that have to be inventoried for a brand-mention dashboard. Given the small tweet vector below, use `str_extract_all()` so each input gets a character vector of zero or more matches, then `unlist()` and de-duplicate with `unique()`. Save the deduplicated character vector to `ex_3_2`.

**Expected result:**

```
#> [1] "#rstats"     "#dataviz"    "#tidyverse"  "#regex"      "#stringr"
#> [6] "#datascience"
```

**Difficulty:** Intermediate

[HINTS]
Each tweet may hold several tags or none, so you need every match per string and then a flat, de-duplicated set.
Use `str_extract_all()` with `"#\\w+"`, then `unlist()` and `unique()` the result.

```r title="Your turn"
tweets <- c(
  "Loving #rstats and #dataviz today",
  "Quick #tidyverse trick: #stringr beats regex",
  "Why I use #regex carefully #rstats",
  "No tags here",
  "#datascience #stringr #rstats"
)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tweets <- c(
  "Loving #rstats and #dataviz today",
  "Quick #tidyverse trick: #stringr beats regex",
  "Why I use #regex carefully #rstats",
  "No tags here",
  "#datascience #stringr #rstats"
)
ex_3_2 <- tweets |>
  str_extract_all("#\\w+") |>
  unlist() |>
  unique()
ex_3_2
#> [1] "#rstats"      "#dataviz"     "#tidyverse"   "#stringr"
#> [5] "#regex"       "#datascience"
```

**Explanation:** Because the count of hashtags differs per tweet, `str_extract_all()` returns a list with one vector per input, which `unlist()` flattens for de-duplication. The pattern `#\\w+` reads as "a literal hash followed by one or more word characters", where `\\w` is the regex shorthand for `[A-Za-z0-9_]`. If you want to keep the per-tweet structure instead, leave the list and pass it directly to `purrr::map()`.

</details>

### Exercise 3.3: Parse a name string into first and last name columns

**Task:** Customer records store the full name in one column like `"Last, First"` and you need to split it into `first` and `last` columns. Use `str_match()` with two capture groups against the inline tibble below so each row becomes a row in a three-column matrix. Convert the relevant columns to a tibble named `ex_3_3` with columns `full`, `last`, `first`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   full              last      first
#>   <chr>             <chr>     <chr>
#> 1 Johnson, Alice    Johnson   Alice
#> 2 Smith, Bob        Smith     Bob
#> 3 Diaz, Carla       Diaz      Carla
#> 4 Khan, Devon       Khan      Devon
```

**Difficulty:** Advanced

[HINTS]
Describe the comma-separated layout with two parenthesised pieces so each part comes back separately.
Use `str_match()` with a pattern like `"^([^,]+),\\s+(.+)$"`, then build a tibble from match columns 2 and 3.

```r title="Your turn"
people <- tibble(full = c("Johnson, Alice", "Smith, Bob",
                          "Diaz, Carla", "Khan, Devon"))
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
people <- tibble(full = c("Johnson, Alice", "Smith, Bob",
                          "Diaz, Carla", "Khan, Devon"))
m <- str_match(people$full, "^([^,]+),\\s+(.+)$")
ex_3_3 <- tibble(full = people$full, last = m[, 2], first = m[, 3])
ex_3_3
#> # A tibble: 4 x 3
#>   full           last    first
#>   <chr>          <chr>   <chr>
#> 1 Johnson, Alice Johnson Alice
#> 2 Smith, Bob     Smith   Bob
#> 3 Diaz, Carla    Diaz    Carla
#> 4 Khan, Devon    Khan    Devon
```

**Explanation:** `str_match()` differs from `str_extract()` by returning a matrix where column 1 is the whole match and subsequent columns are the parenthesised capture groups. The pattern uses `[^,]+` (one or more non-comma characters) to grab the last name, then `\\s+` to consume the comma-space separator, then `.+` to take everything else. For a wider table with many capture groups consider `tidyr::separate_wider_regex()` which builds the tibble directly.

</details>

### Exercise 3.4: Pull amounts from a column of currency strings

**Task:** A finance team exports amounts as strings like `"USD 1,234.50"` and you need just the numeric value. From the inline vector below, use `str_extract()` with a pattern that captures digits, commas and one optional decimal, then strip the comma with `str_remove_all()` and cast to numeric. Save the numeric vector to `ex_3_4`.

**Expected result:**

```
#> [1]  1234.50    25.00 12000.00     7.25      NA
```

**Difficulty:** Intermediate

[HINTS]
Pull out the numeric-looking text, drop the thousands separator, then turn the result into a real number.
Use `str_extract()` with `"[0-9,]+(?:\\.[0-9]+)?"`, then `str_remove_all()` the comma before casting.

```r title="Your turn"
amounts <- c("USD 1,234.50", "EUR 25.00", "GBP 12,000", "JPY 7.25", "no amount")
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
amounts <- c("USD 1,234.50", "EUR 25.00", "GBP 12,000", "JPY 7.25", "no amount")
ex_3_4 <- amounts |>
  str_extract("[0-9,]+(?:\\.[0-9]+)?") |>
  str_remove_all(",") |>
  as.numeric()
ex_3_4
#> [1]  1234.50    25.00 12000.00     7.25       NA
```

**Explanation:** The regex `[0-9,]+(?:\\.[0-9]+)?` matches one or more digits and commas, then an optional non-capturing group `(?:...)` for the decimal part. The non-capturing form is important because we just need a single string back from `str_extract()`, not a tidy matrix of pieces. The comma removal happens after extraction since R's `as.numeric()` does not understand thousands separators, and `NA` propagates through the cast for the no-amount row.

</details>

### Exercise 3.5: Extract domain from a vector of email addresses

**Task:** The growth team has a column of customer emails and they want a separate `domain` column to do an account-aggregation analysis. Use `str_extract()` with a positive lookbehind for the `@` sign so the result is only the domain part. Apply it to the inline vector below and save the character vector to `ex_3_5`.

**Expected result:**

```
#> [1] "example.com"    "acme.co.uk"     "gmail.com"      "school.edu"
#> [5] "consulting.io"
```

**Difficulty:** Advanced

[HINTS]
Capture everything that comes after the @ sign without including the @ itself in the result.
Use `str_extract()` with a lookbehind pattern such as `"(?<=@)[^@]+$"`.

```r title="Your turn"
emails <- c("alice@example.com", "bob@acme.co.uk",
            "carla.diaz@gmail.com", "devon_k@school.edu",
            "eva@consulting.io")
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
emails <- c("alice@example.com", "bob@acme.co.uk",
            "carla.diaz@gmail.com", "devon_k@school.edu",
            "eva@consulting.io")
ex_3_5 <- str_extract(emails, "(?<=@)[^@]+$")
ex_3_5
#> [1] "example.com"    "acme.co.uk"     "gmail.com"      "school.edu"
#> [5] "consulting.io"
```

**Explanation:** `(?<=@)` is a positive lookbehind that requires an `@` immediately before the match position but does not include the `@` in the returned text. Then `[^@]+$` consumes everything that is not another `@` up to the end of the string, which is robust to weird local-parts. If you cannot rely on a regex engine with lookbehinds (some older versions), a `str_match()` with a capture group is a portable alternative.

</details>

## Section 4. Replacing, removing and rewriting (5 problems)

### Exercise 4.1: Replace the first whitespace in each fruit name

**Task:** For display in a CSV column header, the design team wants only the first space inside each compound fruit name turned into an underscore (so `"cape gooseberry"` becomes `"cape_gooseberry"`), but additional spaces if any stay as spaces. Use `str_replace()` to substitute only the first match. Save the character vector of length 80 to `ex_4_1` and print the first eight entries.

**Expected result:**

```
#> [1] "apple"           "apricot"         "avocado"         "banana"
#> [5] "bell_pepper"     "bilberry"        "black_currant"   "black_sapote"
```

**Difficulty:** Beginner

[HINTS]
Only the very first space in each name should change; any later spaces stay as they are.
Use `str_replace()` (the single-match form) with `" "` and `"_"` on `fruit`.

```r title="Your turn"
ex_4_1 <- # your code here
head(ex_4_1, 8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- str_replace(fruit, " ", "_")
head(ex_4_1, 8)
#> [1] "apple"           "apricot"         "avocado"         "banana"
#> [5] "bell_pepper"     "bilberry"        "black_currant"   "black_sapote"
```

**Explanation:** `str_replace()` only touches the first match per input string, leaving later occurrences alone. For non-compound names with zero spaces the function is a no-op, and the original value is returned unchanged. Use `str_replace_all()` when you need every occurrence rewritten, which is the much more common need in practice.

</details>

### Exercise 4.2: Mask all digits in a free-text column

**Task:** A compliance officer wants every digit in a free-text complaints column replaced with `"X"` before sharing the dump with an external auditor, to avoid leaking account numbers. Use `str_replace_all()` against the inline tibble below and overwrite the `complaint` column. Save the resulting tibble to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>      id complaint
#>   <int> <chr>
#> 1     1 Charged me $XXX twice on account XXXXX
#> 2     2 Wrong delivery for order XXXXXX
#> 3     3 Call back on XXX-XXXX
```

**Difficulty:** Intermediate

[HINTS]
Every numeric character in the text column has to become a placeholder - all occurrences, not just the first.
Inside `mutate()`, use `str_replace_all()` with the pattern `"\\d"` and replacement `"X"` on the `complaint` column.

```r title="Your turn"
df <- tibble(id = 1:3,
             complaint = c("Charged me $50 twice on account 12345",
                           "Wrong delivery for order 998877",
                           "Call back on 555-1234"))
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- tibble(id = 1:3,
             complaint = c("Charged me $50 twice on account 12345",
                           "Wrong delivery for order 998877",
                           "Call back on 555-1234"))
ex_4_2 <- df |>
  mutate(complaint = str_replace_all(complaint, "\\d", "X"))
ex_4_2
#> # A tibble: 3 x 2
#>      id complaint
#>   <int> <chr>
#> 1     1 Charged me $XX twice on account XXXXX
#> 2     2 Wrong delivery for order XXXXXX
#> 3     3 Call back on XXX-XXXX
```

**Explanation:** `str_replace_all()` is the global-replace cousin of `str_replace()` and walks every non-overlapping match in each string. The pattern `\\d` matches one digit at a time so the dollar amount `50` becomes `XX` rather than a single `X`, which is what compliance usually wants. If you needed to mask whole numeric runs with one `X` regardless of length, use `\\d+` instead.

</details>

### Exercise 4.3: Strip punctuation from headlines

**Task:** A news-feed dataset stores headlines with mixed punctuation that breaks downstream tokenisation. Given the inline vector, remove every non-word and non-space character with `str_remove_all()` using the regex `"[[:punct:]]"`. Save the cleaned character vector to `ex_4_3`.

**Expected result:**

```
#> [1] "Markets rally on rate cut hopes"
#> [2] "Apple unveils MR headset whats new"
#> [3] "Storms batter coastline officials warn"
#> [4] "Why this strategy works  and when it doesnt"
```

**Difficulty:** Intermediate

[HINTS]
Drop every punctuation mark from each headline while leaving letters and spaces untouched.
Use `str_remove_all()` with the POSIX class `"[[:punct:]]"` on `headlines`.

```r title="Your turn"
headlines <- c(
  "Markets rally on rate-cut hopes!",
  "Apple unveils MR headset: what's new?",
  "Storms batter coastline, officials warn.",
  "Why this strategy works -- and when it doesn't."
)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
headlines <- c(
  "Markets rally on rate-cut hopes!",
  "Apple unveils MR headset: what's new?",
  "Storms batter coastline, officials warn.",
  "Why this strategy works -- and when it doesn't."
)
ex_4_3 <- str_remove_all(headlines, "[[:punct:]]")
ex_4_3
#> [1] "Markets rally on ratecut hopes"
#> [2] "Apple unveils MR headset whats new"
#> [3] "Storms batter coastline officials warn"
#> [4] "Why this strategy works  and when it doesnt"
```

**Explanation:** `str_remove_all(x, pat)` is shorthand for `str_replace_all(x, pat, "")`, which is the common cleaning idiom worth keeping in your fingers. `[[:punct:]]` is a POSIX character class that catches the full punctuation set in a locale-aware way, including apostrophes, colons and brackets without you having to list every glyph. Note headline 1 becomes `"ratecut"` not `"rate cut"` because the hyphen is removed, not replaced with a space, so add a space replacement step if word boundaries matter.

</details>

### Exercise 4.4: Reformat dates from DD/MM/YYYY to YYYY-MM-DD using backreferences

**Task:** A vendor sent dates in `DD/MM/YYYY` format but your pipeline expects ISO `YYYY-MM-DD`. Given the inline vector, write one `str_replace()` call with three capture groups and a backreferenced replacement string. Save the character vector to `ex_4_4`.

**Expected result:**

```
#> [1] "2026-05-12" "2025-12-31" "2024-01-09" "2023-07-04"
```

**Difficulty:** Advanced

[HINTS]
Capture the three date parts, then reassemble them in a new order inside the replacement text.
Use `str_replace()` with `"^(\\d{2})/(\\d{2})/(\\d{4})$"` and a replacement of `"\\3-\\2-\\1"`.

```r title="Your turn"
dates <- c("12/05/2026", "31/12/2025", "09/01/2024", "04/07/2023")
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dates <- c("12/05/2026", "31/12/2025", "09/01/2024", "04/07/2023")
ex_4_4 <- str_replace(dates, "^(\\d{2})/(\\d{2})/(\\d{4})$", "\\3-\\2-\\1")
ex_4_4
#> [1] "2026-05-12" "2025-12-31" "2024-01-09" "2023-07-04"
```

**Explanation:** Backreferences `\\1`, `\\2`, `\\3` in the replacement string refer to the first, second and third parenthesised groups in the pattern, letting you reorder pieces without writing R-level string concatenation. Anchoring with `^...$` rejects partial-match input that would silently produce a half-rewritten string. For genuine date arithmetic prefer `lubridate::dmy()` since it understands more formats and returns proper `Date` objects, but for pure-string reshaping the regex approach is fastest.

</details>

### Exercise 4.5: Translate language codes to language names with a named replacement vector

**Task:** A localisation dashboard has user records tagged with two-letter language codes like `"en"` and `"de"`. Use `str_replace_all()` with a named vector so each code maps to a full name (`"English"`, `"German"`, `"French"`, `"Spanish"`). Apply it to the inline `codes` vector and save the result to `ex_4_5`.

**Expected result:**

```
#> [1] "English" "German"  "French"  "Spanish" "English"
```

**Difficulty:** Intermediate

[HINTS]
A lookup of old-to-new values can be handed straight to the replacer as a named set of patterns.
Pass an anchored named vector (keys like `"^en$"`) as the `pattern` argument of `str_replace_all()`.

```r title="Your turn"
codes <- c("en", "de", "fr", "es", "en")
lookup <- c(en = "English", de = "German", fr = "French", es = "Spanish")
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
codes <- c("en", "de", "fr", "es", "en")
lookup <- c("^en$" = "English", "^de$" = "German",
            "^fr$" = "French",  "^es$" = "Spanish")
ex_4_5 <- str_replace_all(codes, lookup)
ex_4_5
#> [1] "English" "German"  "French"  "Spanish" "English"
```

**Explanation:** When the `pattern` argument is a named character vector, `str_replace_all()` runs every name as a regex against every input and replaces with the corresponding value, which is a tiny built-in lookup engine. Anchoring each key with `^...$` prevents `"en"` from matching inside `"enabled"` or other longer strings. For a much larger or non-regex lookup, `dplyr::recode()` or a `left_join()` on a translation table scales better.

</details>

## Section 5. Splitting, joining and formatting (5 problems)

### Exercise 5.1: Split full names into first and last on a single space

**Task:** Given the simple character vector of clean `"First Last"` strings below, split each entry on a single space using `str_split()` with `simplify = TRUE` so the result is a 4-by-2 character matrix. Save the matrix to `ex_5_1`.

**Expected result:**

```
#>      [,1]    [,2]
#> [1,] "Alice" "Johnson"
#> [2,] "Bob"   "Smith"
#> [3,] "Carla" "Diaz"
#> [4,] "Devon" "Khan"
```

**Difficulty:** Beginner

[HINTS]
Break each name at the space and arrange the pieces as a rectangular grid of rows and columns.
Use `str_split()` with `" "` and `simplify = TRUE` on `clean_names`.

```r title="Your turn"
clean_names <- c("Alice Johnson", "Bob Smith", "Carla Diaz", "Devon Khan")
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
clean_names <- c("Alice Johnson", "Bob Smith", "Carla Diaz", "Devon Khan")
ex_5_1 <- str_split(clean_names, " ", simplify = TRUE)
ex_5_1
#>      [,1]    [,2]
#> [1,] "Alice" "Johnson"
#> [2,] "Bob"   "Smith"
#> [3,] "Carla" "Diaz"
#> [4,] "Devon" "Khan"
```

**Explanation:** Without `simplify = TRUE` you get a list with one character vector per input, which is right when row lengths vary but awkward when they are uniform. `simplify = TRUE` returns a matrix padded with `""` if some rows happen to be shorter than the longest. For a tidy-tibble alternative, use `tidyr::separate_wider_delim()` so each column gets a name immediately.

</details>

### Exercise 5.2: Join a vector of words into a comma-separated sentence

**Task:** A reporting analyst has a character vector of category labels and wants them collapsed into a single comma-separated sentence with the word `"and"` joining the last two. Use `str_c()` for the bulk join and bare R string concatenation only for the final two-element join. Save the single-element character vector to `ex_5_2`.

**Expected result:**

```
#> [1] "apples, bananas, cherries, and dates"
```

**Difficulty:** Intermediate

[HINTS]
Glue all but the last item with commas, then attach the final item with a different connector word.
Use `str_c()` with `collapse = ", "` for the head items, then another `str_c()` to add `", and "` plus the last item.

```r title="Your turn"
items <- c("apples", "bananas", "cherries", "dates")
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
items <- c("apples", "bananas", "cherries", "dates")
n <- length(items)
head_part <- str_c(items[1:(n - 1)], collapse = ", ")
ex_5_2 <- str_c(head_part, ", and ", items[n])
ex_5_2
#> [1] "apples, bananas, cherries, and dates"
```

**Explanation:** `str_c()` with `collapse = ", "` reduces a vector of length n to a single string of length 1, useful for building human-readable summaries. The trick is splitting off the last element so you can prepend the Oxford comma plus `"and "` before joining the head and tail. For very long lists, consider `knitr::combine_words()` which handles this idiom natively.

</details>

### Exercise 5.3: Build a templated email greeting with str_glue

**Task:** The customer-success team wants a templated greeting line for each row of an inline tibble of customer data. Use `str_glue_data()` on the tibble so column names interpolate directly into a template string. Save the character vector of greetings to `ex_5_3`.

**Expected result:**

```
#> [1] "Hi Alice, your 3 orders total $245.50."
#> [2] "Hi Bob, your 1 orders total $89.00."
#> [3] "Hi Carla, your 7 orders total $1,210.75."
```

**Difficulty:** Intermediate

[HINTS]
Drop column values straight into a sentence template, producing one finished line per row.
Use `str_glue_data()` on `customers` with `{name}`, `{orders}` and `{total}` placeholders.

```r title="Your turn"
customers <- tibble(
  name   = c("Alice", "Bob", "Carla"),
  orders = c(3, 1, 7),
  total  = c("245.50", "89.00", "1,210.75")
)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(
  name   = c("Alice", "Bob", "Carla"),
  orders = c(3, 1, 7),
  total  = c("245.50", "89.00", "1,210.75")
)
ex_5_3 <- str_glue_data(customers,
  "Hi {name}, your {orders} orders total ${total}.")
ex_5_3
#> Hi Alice, your 3 orders total $245.50.
#> Hi Bob, your 1 orders total $89.00.
#> Hi Carla, your 7 orders total $1,210.75.
```

**Explanation:** `str_glue_data()` resolves `{name}` against the column names of the data frame, which is cleaner than `paste0()` with many `$column` references. The output is a `glue` vector that prints without quotes and converts to a regular character vector with `as.character()` if a downstream function complains. For Markdown or Quarto templating use `glue::glue_collapse()` to join the resulting vector with bullet points.

</details>

### Exercise 5.4: Normalise whitespace and case for keyword tagging

**Task:** A content team enters keyword tags in a messy single-line input box, with stray uppercase letters, leading and trailing spaces and double spaces between tags. Given the inline vector, run `str_squish()` then `str_to_lower()` and split on `","` to get a per-row list of clean tags. Save the list-of-character-vectors to `ex_5_4`.

**Expected result:**

```
#> [[1]]
#> [1] "rstats"     "dplyr"      "data viz"
#>
#> [[2]]
#> [1] "regex"   "stringr" "cleanup"
```

**Difficulty:** Intermediate

[HINTS]
Tidy the spacing and the casing first, then break each line into its individual tags.
Pipe through `str_squish()`, `str_to_lower()`, then `str_split()` on `",\\s*"`.

```r title="Your turn"
tags_raw <- c("  Rstats, DPLYR,  Data Viz ",
              "REGEX,stringr,   cleanup")
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tags_raw <- c("  Rstats, DPLYR,  Data Viz ",
              "REGEX,stringr,   cleanup")
ex_5_4 <- tags_raw |>
  str_squish() |>
  str_to_lower() |>
  str_split(",\\s*")
ex_5_4
#> [[1]]
#> [1] "rstats"   "dplyr"    "data viz"
#>
#> [[2]]
#> [1] "regex"   "stringr" "cleanup"
```

**Explanation:** `str_squish()` runs first because trimming and collapsing internal whitespace makes the casing transform and the comma split predictable. `str_split(x, ",\\s*")` splits on a comma optionally followed by whitespace, which is more forgiving than `","` alone. Because the inputs had different tag counts you get a list back, which is the right shape for `tidyr::unnest_longer()` if this is part of a tidy-data pipeline.

</details>

### Exercise 5.5: Split address strings into a fixed three-column tibble

**Task:** Postal addresses arrive concatenated as `"street | city | postcode"` in one column and you need three columns out. Given the inline tibble, use `tidyr::separate_wider_delim()` (which itself wraps `stringr::str_split`) with a `|` delimiter. Save the resulting tibble to `ex_5_5`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   street       city    postcode
#>   <chr>        <chr>   <chr>
#> 1 12 Main St   Boston  02118
#> 2 9 Elm Ave    Chicago 60611
#> 3 1 Hill Road  Seattle 98101
```

**Difficulty:** Intermediate

[HINTS]
One column holds three fields joined by a delimiter; you want them broken out into three named columns.
Use `separate_wider_delim()` with `delim = " | "` and `names = c("street", "city", "postcode")`.

```r title="Your turn"
addr <- tibble(raw = c("12 Main St | Boston | 02118",
                       "9 Elm Ave | Chicago | 60611",
                       "1 Hill Road | Seattle | 98101"))
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
addr <- tibble(raw = c("12 Main St | Boston | 02118",
                       "9 Elm Ave | Chicago | 60611",
                       "1 Hill Road | Seattle | 98101"))
ex_5_5 <- addr |>
  separate_wider_delim(raw,
                       delim = " | ",
                       names = c("street", "city", "postcode"))
ex_5_5
#> # A tibble: 3 x 3
#>   street      city    postcode
#>   <chr>       <chr>   <chr>
#> 1 12 Main St  Boston  02118
#> 2 9 Elm Ave   Chicago 60611
#> 3 1 Hill Road Seattle 98101
```

**Explanation:** `separate_wider_delim()` is the modern tidyr replacement for the deprecated `separate()` and is built on stringr-style splitting. The `names` argument creates typed columns directly, and if any row has the wrong number of pieces you get an informative error rather than silent truncation. For variable-width pieces (no fixed column count) use `separate_longer_delim()` to get extra rows instead.

</details>

## Section 6. Real-world regex workflows (4 problems)

### Exercise 6.1: Validate email addresses against a defensible pattern

**Task:** A signup form needs server-side validation that distinguishes well-formed email-looking strings from obvious garbage. The compliance team accepts a conservative pattern: one or more allowed local-part characters, an `@`, one or more allowed domain characters, a dot, and a 2-to-10-letter top-level domain. Apply `str_detect()` with that anchored pattern to the inline `candidates` vector. Save the logical vector to `ex_6_1`.

**Expected result:**

```
#> [1]  TRUE  TRUE  TRUE FALSE FALSE FALSE
```

**Difficulty:** Advanced

[HINTS]
Test each candidate against one anchored description of what a valid address must look like end to end.
Use `str_detect()` with an anchored pattern like `"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,10}$"`.

```r title="Your turn"
candidates <- c("alice@example.com",
                "bob.smith+tag@acme.co.uk",
                "carla_diaz@school.edu",
                "no_at_sign.com",
                "spaces in@email.com",
                "x@y.toolongdomainname")
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
candidates <- c("alice@example.com",
                "bob.smith+tag@acme.co.uk",
                "carla_diaz@school.edu",
                "no_at_sign.com",
                "spaces in@email.com",
                "x@y.toolongdomainname")
pat <- "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,10}$"
ex_6_1 <- str_detect(candidates, pat)
ex_6_1
#> [1]  TRUE  TRUE  TRUE FALSE FALSE FALSE
```

**Explanation:** The pattern explicitly anchors `^...$` so partial matches are rejected, important for any validation use case where you do not want `"hello alice@example.com world"` to pass. The local-part class allows the realistic set including `+`, `.` and `%`, the domain class allows hyphens and dots, and the `{2,10}` quantifier on the TLD rejects the suspiciously long fake `.toolongdomainname`. Full RFC 5322 conformance is famously hard; a conservative regex like this catches >99% of typos in practice without false-flagging legitimate addresses.

</details>

### Exercise 6.2: Parse a log line into timestamp, level, and message

**Task:** An SRE has a one-line-per-event log file and wants to break each line into a tibble row with columns `ts`, `level`, `message`. Apply `str_match()` against the inline `log` vector with three capture groups, then assemble a tibble. Save it to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   ts                  level message
#>   <chr>               <chr> <chr>
#> 1 2026-05-12 09:14:01 INFO  Job started
#> 2 2026-05-12 09:14:09 WARN  Retrying connection
#> 3 2026-05-12 09:14:11 ERROR Timeout after 5s
```

**Difficulty:** Advanced

[HINTS]
Describe the fixed layout of a log line with three parenthesised pieces, then lift each piece into its own column.
Use `str_match()` with three capture groups, then assemble a tibble from match columns 2, 3 and 4.

```r title="Your turn"
log <- c("2026-05-12 09:14:01 [INFO] Job started",
         "2026-05-12 09:14:09 [WARN] Retrying connection",
         "2026-05-12 09:14:11 [ERROR] Timeout after 5s")
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log <- c("2026-05-12 09:14:01 [INFO] Job started",
         "2026-05-12 09:14:09 [WARN] Retrying connection",
         "2026-05-12 09:14:11 [ERROR] Timeout after 5s")
pat <- "^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[([A-Z]+)\\] (.+)$"
m <- str_match(log, pat)
ex_6_2 <- tibble(ts = m[, 2], level = m[, 3], message = m[, 4])
ex_6_2
#> # A tibble: 3 x 3
#>   ts                  level message
#>   <chr>               <chr> <chr>
#> 1 2026-05-12 09:14:01 INFO  Job started
#> 2 2026-05-12 09:14:09 WARN  Retrying connection
#> 3 2026-05-12 09:14:11 ERROR Timeout after 5s
```

**Explanation:** `str_match()` returns one row per input with one column per capture group plus a column 1 holding the whole match, perfect for parsing structured log lines. The square brackets around the level need escaping `\\[` and `\\]` because they are character-class metacharacters in regex. For larger workflows look at `tidyr::separate_wider_regex()` which builds the tibble directly without the intermediate matrix.

</details>

### Exercise 6.3: Slugify article titles for URLs

**Task:** A CMS needs every article title converted to a URL slug: lowercase, ASCII-only letters and digits, with single hyphens replacing any run of non-alphanumeric characters and no leading or trailing hyphen. Given the inline vector, build the pipeline with `str_to_lower()`, `str_replace_all("[^a-z0-9]+", "-")` and `str_remove_all()` for boundary hyphens. Save the character vector to `ex_6_3`.

**Expected result:**

```
#> [1] "introducing-stringr-1-5-0"
#> [2] "5-tips-for-fast-r-code"
#> [3] "what-is-tidy-data"
#> [4] "regex-101-the-essentials"
```

**Difficulty:** Intermediate

[HINTS]
Lowercase the text, collapse every run of unwanted characters into a single hyphen, then tidy the ends.
Chain `str_to_lower()`, `str_replace_all("[^a-z0-9]+", "-")` and `str_remove_all()` for the boundary hyphens.

```r title="Your turn"
titles <- c("Introducing stringr 1.5.0!",
            "5 Tips for Fast R Code",
            "What is Tidy Data?",
            "Regex 101: The Essentials")
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
titles <- c("Introducing stringr 1.5.0!",
            "5 Tips for Fast R Code",
            "What is Tidy Data?",
            "Regex 101: The Essentials")
ex_6_3 <- titles |>
  str_to_lower() |>
  str_replace_all("[^a-z0-9]+", "-") |>
  str_remove_all("^-|-$")
ex_6_3
#> [1] "introducing-stringr-1-5-0"
#> [2] "5-tips-for-fast-r-code"
#> [3] "what-is-tidy-data"
#> [4] "regex-101-the-essentials"
```

**Explanation:** Lowercasing first means the character class `[^a-z0-9]` does not have to enumerate uppercase too, which keeps the regex compact. The `+` quantifier on the negated class collapses runs of punctuation and whitespace into a single hyphen, so `"1.5.0!"` becomes `"1-5-0"`. The final `^-|-$` strip handles inputs that begin or end with punctuation, which is otherwise easy to forget and ugly when you see `/posts/-intro-` in a URL bar.

</details>

### Exercise 6.4: Parse host and path out of full URLs

**Task:** A web-analytics analyst wants two new columns `host` and `path` for a tibble of full URLs. Use `str_match()` with two capture groups against a pattern that splits at the first `/` after the host. Save the resulting tibble (with the original `url`) to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   url                                    host        path
#>   <chr>                                  <chr>       <chr>
#> 1 https://example.com/blog/post-1        example.com /blog/post-1
#> 2 https://shop.acme.com/cart             shop.acme.com /cart
#> 3 https://r-statistics.co/stringr.html   r-statistics.co /stringr.html
#> 4 https://docs.example.org/              docs.example.org /
```

**Difficulty:** Advanced

[HINTS]
Split each URL at the first slash after the host, keeping both halves of the result.
Use `str_match()` with a pattern like `"^https?://([^/]+)(/.*)?$"` and read match columns 2 and 3.

```r title="Your turn"
urls_df <- tibble(url = c(
  "https://example.com/blog/post-1",
  "https://shop.acme.com/cart",
  "https://r-statistics.co/stringr.html",
  "https://docs.example.org/"
))
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
urls_df <- tibble(url = c(
  "https://example.com/blog/post-1",
  "https://shop.acme.com/cart",
  "https://r-statistics.co/stringr.html",
  "https://docs.example.org/"
))
pat <- "^https?://([^/]+)(/.*)?$"
m <- str_match(urls_df$url, pat)
ex_6_4 <- urls_df |>
  mutate(host = m[, 2],
         path = if_else(is.na(m[, 3]), "/", m[, 3]))
ex_6_4
#> # A tibble: 4 x 3
#>   url                                  host             path
#>   <chr>                                <chr>            <chr>
#> 1 https://example.com/blog/post-1      example.com      /blog/post-1
#> 2 https://shop.acme.com/cart           shop.acme.com    /cart
#> 3 https://r-statistics.co/stringr.html r-statistics.co  /stringr.html
#> 4 https://docs.example.org/            docs.example.org /
```

**Explanation:** The pattern uses `[^/]+` for the host (everything up to the first slash) and an optional `(/.*)?` for the path so URLs that omit the trailing slash do not produce `NA`. The `if_else()` step fills missing paths with `"/"`, the convention every well-behaved web server uses. For production URL parsing, prefer `urltools::url_parse()` which understands ports, query strings and fragments, but for one-off cleanup the regex is faster to read.

</details>

## What to do next

- Cement the basics with [stringr in R: Modern String Manipulation](stringr-in-R.html) before tackling harder regex problems.
- Move from string-cleaning to data-cleaning at scale with [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html).
- Sharpen pipe-friendly data wrangling next door in [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- Combine string work with date parsing in [lubridate Exercises in R](lubridate-Exercises-in-R.html) for end-to-end ETL practice.
