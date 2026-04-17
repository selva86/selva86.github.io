---
title: "stringr in R: 15 Functions That Handle Every String Task You'll Actually Encounter"
slug: "stringr-in-R"
description: "Master stringr in R with 15 essential functions for detecting, extracting, replacing, and splitting strings. Real examples for every function."
keywords: "stringr, stringr R, str_detect, str_replace, str_extract, str_split, regex in R, string manipulation R"
auto_link_terms: "stringr|str_detect()|str_replace()|str_extract()|str_split()|str_pad()|string manipulation in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "1.2.10"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "stringr"
sidebar_order: 9
difficulty: "Intermediate"
---

# stringr in R: 15 Functions That Handle Every String Task You'll Actually Encounter

<p class="lead">stringr is the tidyverse string toolkit. Every function starts with <code>str_</code>, takes the string as the first argument, and returns a vector the same length as its input. That consistency, missing from base R, is why it has become the default for cleaning, extracting, and reshaping text in R.</p>

## Why use stringr instead of base R string functions?

Base R has `grepl`, `gsub`, `regmatches`, `substr`, `sub`, `nchar`, `toupper`, and more. They work, but they disagree with each other about argument order, return type, and what "no match" means. stringr fixes all of this with one rule: the string comes first, the pattern comes second, and the output shape is predictable. Let's see the payoff on a messy vector of product names.

```r
library(stringr)

names <- c("  Laptop Pro 16  ", "USB-C Hub", "monitor-27in", "WiFi Router", NA)

# Find items that contain digits, ignoring whitespace and NA
str_detect(str_trim(names), "\\d")
#> [1]  TRUE FALSE  TRUE FALSE    NA
```

One line. `str_trim` strips whitespace, `str_detect` returns TRUE/FALSE for each element, NAs propagate cleanly. In base R you would write `grepl("\\d", trimws(names))` and silently lose the NA behavior because `grepl` returns FALSE for NA input. That asymmetry is exactly the kind of bug stringr prevents.

![stringr function families](screenshots/stringr-in-R-function-families.webp)
*Figure 1: The seven families of stringr functions. Pick a family based on what you want to do, detect, extract, replace, split, measure, modify, or format.*

stringr organizes its ~40 functions into seven families. You rarely need more than 15 of them in daily work, and this post covers every one of those 15.

> **[TIP]** stringr ships inside the tidyverse, so `library(tidyverse)` loads it automatically. If you only need strings, `library(stringr)` is lighter.

**Try it:** Use `str_detect()` on the vector below to return TRUE for elements that contain "fox".

```r
library(stringr)
animals <- c("red fox", "brown bear", "arctic fox", "deer")
# Your str_detect() call
```

<details>
<summary>Click to reveal solution</summary>

```r
library(stringr)
animals <- c("red fox", "brown bear", "arctic fox", "deer")
str_detect(animals, "fox")
#> [1]  TRUE FALSE  TRUE FALSE
```

`str_detect()` returns one logical value per input element, TRUE where the pattern `"fox"` appears anywhere in the string and FALSE otherwise. The two fox entries match, while "brown bear" and "deer" do not.
</details>

## How do you test if a string contains something with str_detect()?

`str_detect(string, pattern)` returns a logical vector, TRUE where the pattern matches, FALSE where it does not. It is the workhorse of every filter step that touches text.

```r
library(stringr)
library(dplyr)

emails <- tibble(
  id = 1:5,
  address = c("asha@gmail.com", "bilal@work.co", "cleo+tag@gmail.com",
              "daan@hotmail.com", "edu@gmail.com")
)

# Keep only gmail addresses
emails |> filter(str_detect(address, "@gmail\\.com$"))
#> # A tibble: 3 x 2
#>      id address
#>   <int> <chr>
#> 1     1 asha@gmail.com
#> 2     3 cleo+tag@gmail.com
#> 3     5 edu@gmail.com
```

Two details worth memorizing. First, `\\.` matches a literal dot, because `.` in regex means "any character". Escaping a dot is the single most common stringr bug. Second, `$` anchors to the end of the string, so `@gmail.com.backup` would not match.

Three cousins of `str_detect` come up often:

```r
# str_starts / str_ends — cheaper than regex anchors for fixed prefixes
str_starts(emails$address, "asha")
#> [1]  TRUE FALSE FALSE FALSE FALSE

# str_which — returns indices of matches, not a logical vector
str_which(emails$address, "@gmail")
#> [1] 1 3 5

# str_count — how many matches per string
str_count("banana", "a")
#> [1] 3
```

Use `str_detect` when you will feed the result to `filter()` or `if_else()`. Use `str_which` when you need integer positions (rare). Use `str_count` when "how many" is the actual question.

> **[NOTE]** stringr patterns are ICU regex by default. They support most of what you know from PCRE with minor differences. Wrap a pattern in `fixed()` to turn off regex interpretation and in `coll()` for locale-aware matching.

**Try it:** Filter the tibble to rows where the `title` column contains the word "report", case-insensitive.

```r
library(stringr); library(dplyr)
docs <- tibble(
  id = 1:4,
  title = c("Sales Report Q1", "invoice 2024", "REPORT-draft", "memo")
)
# Hint: wrap the pattern in regex(..., ignore_case = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r
library(stringr); library(dplyr); library(tibble)
docs <- tibble(
  id = 1:4,
  title = c("Sales Report Q1", "invoice 2024", "REPORT-draft", "memo")
)
docs |> filter(str_detect(title, regex("report", ignore_case = TRUE)))
#> # A tibble: 2 x 2
#>      id title
#>   <int> <chr>
#> 1     1 Sales Report Q1
#> 2     3 REPORT-draft
```

Wrapping the pattern in `regex(..., ignore_case = TRUE)` tells stringr to match "report" regardless of capitalization, so both `"Sales Report Q1"` and `"REPORT-draft"` pass the filter. The plain strings `"invoice 2024"` and `"memo"` are dropped because they don't contain the word at all.
</details>

## How do str_extract() and str_match() pull out parts of a string?

When you need the matched text itself, not just TRUE/FALSE, use `str_extract` for a simple capture and `str_match` when you need named groups.

```r
library(stringr)

logs <- c(
  "2026-04-01 INFO user=42 msg=login",
  "2026-04-01 WARN user=17 msg=bad_pwd",
  "2026-04-02 INFO user=99 msg=logout"
)

# Pull out the first ISO date in each string
str_extract(logs, "\\d{4}-\\d{2}-\\d{2}")
#> [1] "2026-04-01" "2026-04-01" "2026-04-02"

# Pull out every 2-digit-or-longer number
str_extract_all(logs, "\\d+")
#> [[1]]
#> [1] "2026" "04" "01" "42"
#> [[2]]
#> [1] "2026" "04" "01" "17"
#> [[3]]
#> [1] "2026" "04" "02" "99"
```

`str_extract` returns one match per string (the first). `str_extract_all` returns a list, one vector per string, possibly of different lengths. The list shape is annoying but honest: you cannot fit variable-length results into a plain vector.

For structured extraction, use capture groups with `str_match`:

```r
str_match(logs, "(\\d{4}-\\d{2}-\\d{2}) (\\w+) user=(\\d+)")
#>      [,1]                             [,2]         [,3]   [,4]
#> [1,] "2026-04-01 INFO user=42"       "2026-04-01" "INFO" "42"
#> [2,] "2026-04-01 WARN user=17"       "2026-04-01" "WARN" "17"
#> [3,] "2026-04-02 INFO user=99"       "2026-04-02" "INFO" "99"
```

Column 1 is the full match; columns 2+ are the capture groups in order. You can wrap this in a tibble and `rename` the columns for a quick parser. For the pipe-friendly version, `tidyr::extract()` does the same thing straight into a data frame.

![regex anatomy for stringr](screenshots/stringr-in-R-regex-anatomy.webp)
*Figure 2: Anatomy of a regex pattern. Every stringr function uses these same pieces.*

> **[WARNING]** `str_match` returns a character matrix, not a list or tibble. If your strings have no match, that row is all NAs, check with `anyNA()` before assuming success.

**Try it:** Extract the phone number (10 digits, possibly with dashes) from each string below.

```r
library(stringr)
contacts <- c("call 555-123-4567 anytime", "fax: 9876543210", "no phone")
# Use str_extract with a suitable regex
```

<details>
<summary>Click to reveal solution</summary>

```r
library(stringr)
contacts <- c("call 555-123-4567 anytime", "fax: 9876543210", "no phone")
str_extract(contacts, "\\d{3}-?\\d{3}-?\\d{4}")
#> [1] "555-123-4567" "9876543210"   NA
```

The pattern `\\d{3}-?\\d{3}-?\\d{4}` asks for three digits, an optional dash, three more digits, an optional dash, then four digits, so it matches both the dashed and undashed forms. The third string has no run of 10 digits, so `str_extract()` returns `NA` for it.
</details>

## How does str_replace() change text inside strings?

`str_replace(string, pattern, replacement)` swaps the **first** match; `str_replace_all` swaps every match. The replacement string can reference capture groups with `\\1`, `\\2`, etc.

```r
library(stringr)

prices <- c("$1,299", "$450", "$12,000")

# Strip dollar signs and commas, then convert
clean <- prices |>
  str_replace_all("[$,]", "") |>
  as.numeric()
clean
#> [1]  1299   450 12000
```

The character class `[$,]` matches either a dollar sign or a comma. One `str_replace_all` call handles both. The pipe into `as.numeric` gives you a numeric column ready for arithmetic.

Capture groups make format-switching trivial:

```r
dates_us <- c("04/01/2026", "12/25/2025", "07/04/2026")

# Convert MM/DD/YYYY to YYYY-MM-DD (ISO)
str_replace(dates_us, "(\\d{2})/(\\d{2})/(\\d{4})", "\\3-\\1-\\2")
#> [1] "2026-04-01" "2025-12-25" "2026-07-04"
```

`\\1`, `\\2`, `\\3` correspond to the three parenthesized groups in the pattern. This is vastly simpler than a nested `substr()` + `paste0()` dance.

For non-regex replacement, when your pattern contains special characters you do not want interpreted, wrap the pattern in `fixed()`:

```r
# Literal replacement of a dotted string
str_replace("version 1.2.3", fixed("1.2.3"), "2.0.0")
#> [1] "version 2.0.0"
```

Without `fixed()`, the dots would match any character and you might accidentally replace `"1X2Y3"`. Use `fixed()` whenever the pattern is a known literal.

> **[TIP]** stringr also ships `str_remove()` and `str_remove_all()`, sugar for `str_replace(..., "")`. Both are clearer at the call site when you just want to delete text.

**Try it:** Normalize these filenames to lowercase kebab-case (lowercase, dashes not spaces).

```r
library(stringr)
files <- c("Sales Report Q1.pdf", "Customer List 2024.csv")
# Hint: str_replace_all(..., " ", "-") then str_to_lower()
```

<details>
<summary>Click to reveal solution</summary>

```r
library(stringr)
files <- c("Sales Report Q1.pdf", "Customer List 2024.csv")
files |>
  str_replace_all(" ", "-") |>
  str_to_lower()
#> [1] "sales-report-q1.pdf" "customer-list-2024.csv"
```

`str_replace_all(" ", "-")` swaps every space for a dash, and `str_to_lower()` then lowercases the full string including the file extension. Chaining the two in the pipe keeps the transformation readable and avoids an intermediate variable.
</details>

## How do you split and join strings with str_split() and str_c()?

`str_split` cuts one string into pieces on a pattern; `str_c` is the opposite, glueing several vectors into one. Both are used constantly in data cleaning.

```r
library(stringr)

addresses <- c(
  "21 Main St, Pune, 411001",
  "9 Park Ave, Lima, 15001",
  "42 Oak Rd, Berlin, 10115"
)

# Split on comma + optional space; simplify to a matrix
parts <- str_split(addresses, ",\\s*", simplify = TRUE)
parts
#>      [,1]          [,2]     [,3]
#> [1,] "21 Main St"  "Pune"   "411001"
#> [2,] "9 Park Ave"  "Lima"   "15001"
#> [3,] "42 Oak Rd"   "Berlin" "10115"
```

`simplify = TRUE` promotes the list result to a character matrix when every input has the same number of parts. When that is not guaranteed, leave it as the default list and `purrr::map_chr` through it. `str_split_fixed(x, pattern, n)` is another option, it pads short rows with empty strings so you always get `n` columns.

Going the other way:

```r
first <- c("Asha", "Bilal", "Cleo")
last  <- c("Rao", "Khan", "Patel")

str_c(first, last, sep = " ")
#> [1] "Asha Rao"  "Bilal Khan" "Cleo Patel"

# Collapse a vector into one string
str_c(first, collapse = ", ")
#> [1] "Asha, Bilal, Cleo"
```

`sep` concatenates element-wise; `collapse` concatenates the whole vector into a single string. The two arguments compose, you can use both in one call when combining vectors and then flattening.

```r
str_c(first, last, sep = " ", collapse = "; ")
#> [1] "Asha Rao; Bilal Khan; Cleo Patel"
```

> **[NOTE]** `str_c` treats NA like NA, any element with an NA becomes NA. Use `paste` or `coalesce(x, "")` if you want NAs to be silently treated as empty strings.

**Try it:** Split each string on the colon, then build a named vector from the result.

```r
library(stringr)
meta <- c("name: Asha", "age: 30", "city: Pune")
# str_split on ": " then map to a named vector
```

<details>
<summary>Click to reveal solution</summary>

```r
library(stringr)
meta <- c("name: Asha", "age: 30", "city: Pune")
parts <- str_split(meta, ": ", simplify = TRUE)
named <- setNames(parts[, 2], parts[, 1])
named
#>   name    age   city
#> "Asha"   "30" "Pune"
```

`simplify = TRUE` turns the split list into a 3x2 character matrix, keys in column 1, values in column 2. `setNames()` then attaches the key column as names on the value column, producing a named character vector ready for lookup.
</details>

## How do you clean whitespace, case, and padding?

Most real string cleanup involves four things: trimming whitespace, changing case, padding to a fixed width, and fixing length. stringr has one-liners for each.

```r
library(stringr)

messy <- c("  Asha  ", "BILAL", "cleo", "  Daan", "Edu ")

str_trim(messy)           # drop leading + trailing whitespace
#> [1] "Asha"  "BILAL" "cleo"  "Daan"  "Edu"

str_squish(messy)         # also collapse repeated internal whitespace
#> [1] "Asha"  "BILAL" "cleo"  "Daan"  "Edu"

str_to_lower(messy)
#> [1] "  asha  " "bilal"    "cleo"     "  daan"   "edu "

str_to_title(str_squish(messy))
#> [1] "Asha"  "Bilal" "Cleo"  "Daan"  "Edu"
```

Pair `str_squish` with `str_to_title` as a one-stop cleanup for names. `str_squish` is stronger than `str_trim` because it also collapses any internal runs of whitespace to a single space, critical when copy-pasting from spreadsheets.

Padding is the opposite problem: making short strings match a target width, typically for alignment.

```r
ids <- c("1", "12", "123", "1234")
str_pad(ids, width = 5, side = "left", pad = "0")
#> [1] "00001" "00012" "00123" "01234"
```

Zero-padded IDs are a classic need, think invoice numbers, customer codes, file names sorted lexically. `side = "right"` and `side = "both"` are also valid.

`str_length` answers "how many characters in this string?". It counts by code points, not bytes, so it is safe for non-ASCII text.

```r
str_length(c("hi", "hello", "नमस्ते"))
#> [1] 2 5 6
```

![Choosing the right stringr function](screenshots/stringr-in-R-choose-function.webp)
*Figure 3: A cheat sheet for picking the right stringr function based on the question you are trying to answer.*

> **[TIP]** `str_to_title` uses locale rules, so "o'brien" becomes "O'Brien" in English but may behave differently in Turkish locale due to the dotted/dotless I. For strict ASCII, use `str_to_upper(substring(x, 1, 1))` + `str_to_lower(substring(x, 2))`.

**Try it:** Clean the vector below so every element is title-case, single-spaced, and trimmed.

```r
library(stringr)
raw <- c("  red fox  ", "BROWN  BEAR", "arctic     fox")
# Hint: chain str_squish then str_to_title
```

<details>
<summary>Click to reveal solution</summary>

```r
library(stringr)
raw <- c("  red fox  ", "BROWN  BEAR", "arctic     fox")
raw |>
  str_squish() |>
  str_to_title()
#> [1] "Red Fox"    "Brown Bear" "Arctic Fox"
```

`str_squish()` trims leading and trailing whitespace *and* collapses any internal runs of spaces down to a single space, which handles the double and quintuple gaps in the input. `str_to_title()` then capitalizes the first letter of each word, giving you a clean, uniform vector.
</details>

## How do you use regex with stringr effectively?

Every stringr function takes a pattern, and by default that pattern is regex. A short tour of the five regex features you will actually use:

```r
library(stringr)

x <- c("apple123", "banana45", "cherry", "PEACH-7", "Grape_12")

# 1. Character classes
str_extract(x, "[A-Za-z]+")
#> [1] "apple"  "banana" "cherry" "PEACH"  "Grape"

# 2. Quantifiers
str_extract(x, "\\d{2,}")
#> [1] "123" "45"  NA    NA    "12"

# 3. Anchors
str_detect(x, "^[A-Z]")
#> [1] FALSE FALSE FALSE  TRUE  TRUE

# 4. Alternation
str_detect(x, "apple|banana")
#> [1]  TRUE  TRUE FALSE FALSE FALSE

# 5. Groups
str_match(x, "([A-Za-z]+)(\\d*)")[, -1]
#>      [,1]     [,2]
#> [1,] "apple"  "123"
#> [2,] "banana" "45"
#> [3,] "cherry" ""
#> [4,] "PEACH"  ""
#> [5,] "Grape"  "12"
```

Five regex tools, five concepts. Most data-cleaning regex you will ever write is just a combination of these with careful escaping. Resist the temptation to build a 200-character super-regex, split it into two or three simpler steps that are easier to debug.

When regex feels like overkill, wrap the pattern in `fixed()` for literal matching or `coll()` for locale-aware matching. When the pattern needs options like case-insensitive or dotall, use `regex(..., ignore_case = TRUE)`.

```r
# Case-insensitive search
str_detect(c("Error", "ERROR", "error", "warn"), regex("error", ignore_case = TRUE))
#> [1]  TRUE  TRUE  TRUE FALSE
```

> **[WARNING]** stringr uses double-escaped backslashes in R strings: `"\\d"` in code, `\d` in the compiled regex. Forgetting the double backslash is the second-most-common stringr bug (after unescaped dots).

**Try it:** Use a regex to extract the hashtags from the tweet below into a character vector.

```r
library(stringr)
tweet <- "Loving the new R release! #rstats #tidyverse #coding"
# Hint: str_extract_all with "#\\w+"
```

<details>
<summary>Click to reveal solution</summary>

```r
library(stringr)
tweet <- "Loving the new R release! #rstats #tidyverse #coding"
str_extract_all(tweet, "#\\w+")[[1]]
#> [1] "#rstats"    "#tidyverse" "#coding"
```

`str_extract_all()` returns a list (one element per input string), so `[[1]]` unwraps the single tweet's matches into a plain character vector. The pattern `#\\w+` matches a `#` followed by one or more word characters (letters, digits, underscore), which is exactly the shape of a hashtag.
</details>

## Practice Exercises

### Exercise 1: Parse a messy log

Given this log vector, extract a tibble with columns `timestamp`, `level`, `user_id`, and `message`.

```r
library(stringr); library(tibble); library(dplyr)

log <- c(
  "2026-04-01 10:30:15 [INFO] user=42 login successful",
  "2026-04-01 10:31:02 [WARN] user=17 password retry",
  "2026-04-01 10:31:45 [ERROR] user=99 db connection lost"
)
# Your code: use str_match with capture groups
```

<details><summary>Solution</summary>

```r
m <- str_match(log, "(\\S+ \\S+) \\[(\\w+)\\] user=(\\d+) (.*)")
tibble(
  timestamp = m[, 2],
  level     = m[, 3],
  user_id   = as.integer(m[, 4]),
  message   = m[, 5]
)
```

</details>

### Exercise 2: Normalize phone numbers

Take the messy vector and normalize each to the format `+1-AAA-BBB-CCCC`. Drop numbers that do not have exactly 10 digits.

```r
phones <- c("(555) 123-4567", "555.987.6543", "5551234567", "123-45", "+1 555 111 2222")
```

<details><summary>Solution</summary>

```r
digits <- str_extract_all(phones, "\\d") |> sapply(function(x) str_c(x, collapse = ""))
digits <- str_sub(digits, -10)  # keep last 10 digits
ok <- str_length(digits) == 10
formatted <- ifelse(
  ok,
  str_c("+1-", str_sub(digits, 1, 3), "-", str_sub(digits, 4, 6), "-", str_sub(digits, 7, 10)),
  NA
)
formatted
```

</details>

### Exercise 3: Find and count hashtags

Given a vector of tweets, return a tibble with columns `hashtag` and `count`, sorted descending.

```r
tweets <- c(
  "Learning #rstats today #tidyverse",
  "#rstats community is the best #rstats",
  "tried #python but prefer #rstats",
  "no tags here"
)
```

<details><summary>Solution</summary>

```r
library(tibble); library(dplyr)
tags <- str_extract_all(tweets, "#\\w+") |> unlist()
tibble(hashtag = tags) |>
  count(hashtag, sort = TRUE, name = "count")
```

</details>

## Complete Example

Here is a full cleaning pipeline on a customer table with messy names, emails, and phone numbers.

```r
library(stringr); library(dplyr); library(tibble)

raw <- tibble(
  id = 1:5,
  name = c("  ASHA rao ", "bilal Khan ", "cleo PATEL", " daan de Vries", "EDU Silva"),
  email = c("asha@GMAIL.com", "bilal@work.co", "cleo@gmail.com", "daan@HOTMAIL.com", "edu@gmail.com"),
  phone = c("(555) 111-2222", "5551234567", "555.999.8888", "not listed", "+1 555 777 6666")
)

clean <- raw |>
  mutate(
    name = name |> str_squish() |> str_to_title(),
    email = str_to_lower(email),
    domain = str_extract(email, "(?<=@).+$"),
    phone_digits = str_replace_all(phone, "\\D", ""),
    phone_clean = if_else(
      str_length(phone_digits) >= 10,
      str_c(
        "+1-",
        str_sub(phone_digits, -10, -8), "-",
        str_sub(phone_digits, -7, -5), "-",
        str_sub(phone_digits, -4, -1)
      ),
      NA_character_
    ),
    is_gmail = str_detect(domain, "^gmail\\.")
  ) |>
  select(id, name, email, domain, phone_clean, is_gmail)

clean
#> # A tibble: 5 x 6
#>      id name            email               domain      phone_clean      is_gmail
#>   <int> <chr>           <chr>               <chr>       <chr>            <lgl>
#> 1     1 Asha Rao        asha@gmail.com      gmail.com   +1-555-111-2222  TRUE
#> 2     2 Bilal Khan      bilal@work.co       work.co     +1-555-123-4567  FALSE
#> 3     3 Cleo Patel      cleo@gmail.com      gmail.com   +1-555-999-8888  TRUE
#> 4     4 Daan De Vries   daan@hotmail.com    hotmail.com NA               FALSE
#> 5     5 Edu Silva       edu@gmail.com       gmail.com   +1-555-777-6666  TRUE
```

Seven stringr calls, one clean pipeline, tidy output ready for the next step in your workflow. The lookahead regex `(?<=@).+$` extracts everything after the `@` without including the `@` itself, a clean way to get the domain.

## Summary

| Task | Function | Returns |
|---|---|---|
| Test match | `str_detect()` | logical |
| Count matches | `str_count()` | integer |
| Find positions | `str_which()` | integer |
| Extract first match | `str_extract()` | character |
| Extract all matches | `str_extract_all()` | list |
| Extract with groups | `str_match()` | matrix |
| Replace first | `str_replace()` | character |
| Replace all | `str_replace_all()` | character |
| Split | `str_split()` | list |
| Join | `str_c()` | character |
| Trim whitespace | `str_trim()` / `str_squish()` | character |
| Change case | `str_to_lower/upper/title()` | character |
| Pad | `str_pad()` | character |
| Length | `str_length()` | integer |
| Subset by position | `str_sub()` | character |

Four rules worth internalizing:

1. **Escape dots.** `\\.` matches a literal dot; `.` matches any character.
2. **Pattern interpretation.** Plain strings are regex; `fixed()` is literal; `regex()` adds options.
3. **Single vs all.** Most functions have a `_all` variant, pick the one that matches your question.
4. **List vs vector.** `_all` extractors return lists because match counts vary; handle that shape explicitly.

## References

- [stringr official reference](https://stringr.tidyverse.org/reference/index.html)
- [stringr regex vignette](https://stringr.tidyverse.org/articles/regular-expressions.html)
- [R for Data Science, 2e, Strings chapter](https://r4ds.hadley.nz/strings.html)
- [ICU regex syntax](https://unicode-org.github.io/icu/userguide/strings/regexp.html)
- [regex101.com](https://regex101.com/), interactive regex testing; set flavor to "PCRE2" for a close match to stringr.

## Continue Learning

- [dplyr filter() and select()](dplyr-filter-select.html), pair `str_detect()` with `filter()` for text-based row filters.
- [pivot_longer() and pivot_wider()](pivot_longer-pivot_wider-Reshape-Data-in-R.html), often needed before or after string cleanup.
- [dplyr mutate() and rename()](dplyr-mutate-rename.html), every string transformation lives inside a mutate.
