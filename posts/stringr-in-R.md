---
title: "stringr in R: 15 Functions That Handle Every String Task You'll Actually Encounter"
slug: "stringr-in-R"
description: "stringr gives R consistent, pipe-friendly string functions. Learn str_detect, str_replace, str_extract, str_split, str_pad, and 9 more with real data examples."
keywords: "stringr, stringr in R, str_detect, str_replace, str_extract, str_split, str_pad, R string functions, string manipulation R, stringr tutorial"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.2.10"
post_type: "C"
auto_link_terms: "stringr|stringr in R|str_detect()|str_replace()|str_extract()|str_split()|str_pad()|string manipulation in R"
auto_link_case_sensitive: false
sidebar_section: "Data Wrangling"
sidebar_title: "stringr"
sidebar_order: 11
---

<nav class="breadcrumb-nav">Home > Data Wrangling > String & Date Manipulation > stringr in R</nav>

# stringr in R: 15 Functions That Handle Every String Task You'll Actually Encounter

<p class="lead">stringr is a tidyverse package that provides a consistent, pipe-friendly set of functions for detecting, extracting, replacing, splitting, and formatting strings in R.</p>

## Introduction

Strings are messy. Customer names arrive with extra spaces. Dates show up as text in three different formats. Survey responses mix uppercase and lowercase. You need tools that clean this up reliably.

Base R has string functions like `grep()`, `gsub()`, and `substr()`. They work, but their names don't follow a pattern and their argument orders are inconsistent. Some take the pattern first, others take the string first. This makes them hard to remember and impossible to pipe.

stringr fixes these problems. Every function starts with `str_`, takes the string vector as its first argument, and follows a predictable naming pattern. That means you can pipe stringr functions with `|>` just like dplyr verbs.

In this tutorial, you will learn 15 essential stringr functions grouped into five task categories: detecting patterns, extracting text, replacing content, splitting and combining strings, and cleaning whitespace. Each function comes with a real example you can run directly in your browser.

![stringr function families](screenshots/stringr-in-R-function-families.webp)

*Figure 1: The five families of stringr functions.*

## How Do You Detect and Count Pattern Matches?

The most common string task is asking "does this string contain a pattern?" stringr gives you three functions for this: `str_detect()` returns TRUE/FALSE, `str_subset()` returns matching strings, and `str_count()` counts how many times a pattern appears.

Think of these as your search tools. `str_detect()` is like a metal detector — it tells you something is there. `str_subset()` is like a sieve — it keeps only what matches. `str_count()` is like a tally counter — it tells you how many times.

Let's start by loading stringr and creating a character vector to work with.

```r
# Load stringr and create sample data
library(stringr)

fruits <- c("apple", "banana", "blueberry", "strawberry", "grape", "grapefruit")

# Does each fruit contain "berry"?
str_detect(fruits, "berry")
#> [1] FALSE FALSE  TRUE  TRUE FALSE FALSE
```

`str_detect()` returns a logical vector the same length as the input. TRUE means the pattern was found in that string, FALSE means it was not. This makes it perfect for filtering inside `dplyr::filter()`.

Now let's use `str_subset()` to keep only matching strings, and `str_count()` to count pattern occurrences.

```r
# Keep only fruits containing "berry"
berry_fruits <- str_subset(fruits, "berry")
print(berry_fruits)
#> [1] "blueberry"  "strawberry"

# Count how many times "r" appears in each fruit
str_count(fruits, "r")
#> [1] 0 1 2 2 1 2
```

`str_subset()` returned just the two berry fruits. `str_count()` counted every "r" in each string — "banana" has one, while "blueberry" and "strawberry" each have two. Notice how all three functions take the string vector first and the pattern second, so they chain naturally with pipes.

[KEY INSIGHT]
**str_detect() is the stringr equivalent of grepl(), but with consistent argument order.** In base R, `grepl(pattern, x)` puts the pattern first. stringr puts the string first: `str_detect(x, pattern)`. This makes piping natural: `x |> str_detect("berry")`.

## How Do You Extract and Locate Text Within Strings?

Sometimes you don't just want to know if a pattern exists — you want to pull it out. `str_extract()` grabs the first match, `str_extract_all()` grabs every match, and `str_sub()` extracts text by position.

These three functions serve different purposes. Use `str_extract()` when you need the matched text itself. Use `str_sub()` when you know the exact character positions.

Let's extract area codes from phone numbers using a regex pattern.

```r
# Extract area codes from phone numbers
phones <- c("(212) 555-1234", "(415) 555-5678", "(312) 555-9012", "no phone")

area_codes <- str_extract(phones, "\\d{3}")
print(area_codes)
#> [1] "212" "415" "312" NA
```

`str_extract()` found the first sequence of exactly three digits in each string. The last entry had no digits, so it returned NA. This is a safe behavior — you always get a vector the same length as your input, never a surprise.

Now let's use `str_sub()` for positional extraction, which is useful when your strings have a fixed structure.

```r
# Extract by position: first 3 characters
codes <- c("NYC-2024", "SFO-2025", "CHI-2023")

first_three <- str_sub(codes, start = 1, end = 3)
print(first_three)
#> [1] "NYC" "SFO" "CHI"

# Negative indexing: last 4 characters
years <- str_sub(codes, start = -4)
print(years)
#> [1] "2024" "2025" "2023"
```

`str_sub()` uses positive numbers to count from the left and negative numbers to count from the right. Extracting the last 4 characters with `start = -4` is much cleaner than calculating string lengths yourself.

![Choosing the right stringr function](screenshots/stringr-in-R-choose-function.webp)

*Figure 2: Choosing the right stringr function for your task.*

[TIP]
**Use str_extract_all() when a string might contain multiple matches.** `str_extract()` returns only the first match. If you need every email address in a paragraph, or every number in a report, `str_extract_all()` returns a list of all matches per string.

## How Do You Replace and Transform Text?

Replacing text is the bread and butter of data cleaning. `str_replace()` swaps the first match, `str_replace_all()` swaps every match, and the `str_to_*()` family changes case.

The most important distinction here is between `str_replace()` and `str_replace_all()`. Getting this wrong is one of the most common stringr mistakes.

Let's see the difference clearly.

```r
# str_replace() vs str_replace_all()
messy_text <- c("the  quick  brown  fox", "too   many   spaces")

# Replace only the FIRST double space
cleaned_once <- str_replace(messy_text, "  +", " ")
print(cleaned_once)
#> [1] "the quick  brown  fox" "too many   spaces"

# Replace ALL double spaces
cleaned_all <- str_replace_all(messy_text, "  +", " ")
print(cleaned_all)
#> [1] "the quick brown fox" "too many spaces"
```

See the difference? `str_replace()` only fixed the first run of extra spaces in each string. `str_replace_all()` fixed every one. The pattern `"  +"` means "two or more spaces" — the regex `+` quantifier means "one or more of the preceding character."

[WARNING]
**str_replace() only changes the FIRST match in each string.** This is the number-one stringr surprise. If you want every occurrence replaced, always use `str_replace_all()`. The single-match version exists for cases where you intentionally want to change only the first occurrence.

Now let's look at case conversion, which is useful for standardizing names and categories.

```r
# Case conversion functions
names <- c("john smith", "JANE DOE", "Bob Jones")

upper_names <- str_to_upper(names)
print(upper_names)
#> [1] "JOHN SMITH" "JANE DOE"   "BOB JONES"

title_names <- str_to_title(names)
print(title_names)
#> [1] "John Smith" "Jane Doe"   "Bob Jones"
```

`str_to_title()` is especially useful for messy data. It capitalized the first letter of every word and lowered the rest, turning "john smith" and "JANE DOE" both into properly formatted names.

## How Do You Split and Combine Strings?

Splitting breaks one string into pieces. Combining joins pieces into one string. stringr handles both with `str_split()` and `str_c()`.

`str_split()` returns a list by default, because each input string might produce a different number of pieces. `str_c()` is the stringr version of `paste0()`, but with more intuitive arguments.

Let's split some delimited data.

```r
# Split strings by a delimiter
csv_data <- c("red,green,blue", "alpha,beta", "one,two,three,four")

split_result <- str_split(csv_data, ",")
print(split_result)
#> [[1]]
#> [1] "red"   "green" "blue"
#>
#> [[2]]
#> [1] "alpha" "beta"
#>
#> [[3]]
#> [1] "one"   "two"   "three" "four"
```

Each element became a character vector of its parts. The result is a list because the first string split into 3 pieces, the second into 2, and the third into 4. If you need a matrix instead, use `str_split_fixed(csv_data, ",", n = 4)` where `n` is the maximum number of pieces.

Now let's combine strings with `str_c()`.

```r
# Combine strings with str_c()
first <- c("John", "Jane", "Bob")
last <- c("Smith", "Doe", "Jones")

# Element-wise paste with separator
full_names <- str_c(first, last, sep = " ")
print(full_names)
#> [1] "John Smith" "Jane Doe"   "Bob Jones"

# Collapse a vector into one string
one_line <- str_c(full_names, collapse = ", ")
print(one_line)
#> [1] "John Smith, Jane Doe, Bob Jones"
```

The `sep` argument goes between paired elements (like `paste()`). The `collapse` argument joins the entire vector into a single string. These two arguments solve different problems: `sep` combines across vectors, `collapse` combines within a vector.

[NOTE]
**str_c() is the stringr equivalent of paste0(), but handles NA differently.** `paste0("hello", NA)` returns `"helloNA"` (silently converts NA to text). `str_c("hello", NA)` returns `NA` (propagates missing values). This is usually what you want in data analysis.

## How Do You Clean and Format Strings?

The last family handles whitespace and formatting. `str_trim()` removes leading and trailing spaces, `str_squish()` also collapses internal whitespace, `str_pad()` adds padding, and `str_trunc()` shortens long strings.

These functions are your final cleanup step. After extracting and replacing, you often need to trim edges and standardize widths.

Let's clean some messy survey responses.

```r
# Clean whitespace from survey responses
survey_responses <- c("  Agree  ", "Strongly Agree",
                       "  Disagree   ", "  Strongly   Disagree  ")

# str_trim() removes leading and trailing whitespace
trimmed <- str_trim(survey_responses)
print(trimmed)
#> [1] "Agree"                "Strongly Agree"
#> [3] "Disagree"             "Strongly   Disagree"

# str_squish() also collapses internal whitespace
squished <- str_squish(survey_responses)
print(squished)
#> [1] "Agree"              "Strongly Agree"
#> [3] "Disagree"           "Strongly Disagree"
```

Notice the difference on the last entry. `str_trim()` removed the outer spaces but left "Strongly   Disagree" with three spaces in the middle. `str_squish()` collapsed those internal spaces down to one. For messy survey data, `str_squish()` is almost always what you want.

[TIP]
**str_squish() removes leading, trailing, AND repeated internal whitespace.** It is more aggressive than str_trim(). When cleaning user-entered text, reach for str_squish() first.

Now let's look at `str_pad()` for fixed-width formatting.

```r
# Pad strings to a fixed width
ids <- c("1", "42", "365", "7")

padded_ids <- str_pad(ids, width = 5, side = "left", pad = "0")
print(padded_ids)
#> [1] "00001" "00042" "00365" "00007"
```

`str_pad()` added leading zeros to make every ID exactly 5 characters wide. The `side` argument controls where padding goes: "left" (default), "right", or "both" for centering. This is essential when creating fixed-width output files or aligning text in reports.

![Regex building blocks](screenshots/stringr-in-R-regex-anatomy.webp)

*Figure 3: The four building blocks of a regex pattern.*

## Common Mistakes and How to Fix Them

### Mistake 1: Using str_replace() when str_replace_all() is needed

**Wrong:**
```r
text <- "a-b-c-d"
str_replace(text, "-", "_")
#> [1] "a_b-c-d"
```

**Why it is wrong:** `str_replace()` only replaces the first match. The remaining dashes stay.

**Correct:**
```r
str_replace_all(text, "-", "_")
#> [1] "a_b_c_d"
```

### Mistake 2: Forgetting to escape special regex characters

**Wrong:**
```r
prices <- c("$10.99", "$5.50", "$100.00")
str_extract(prices, ".")
#> [1] "$" "$" "$"
```

**Why it is wrong:** In regex, `.` matches ANY character. It matched the `$` sign, not the decimal point.

**Correct:**
```r
str_extract(prices, "\\.")
#> [1] "." "." "."

# Or use fixed() for literal matching
str_extract(prices, fixed("."))
#> [1] "." "." "."
```

### Mistake 3: Using == instead of str_detect() for partial matching

**Wrong:**
```r
cities <- c("New York", "Newark", "New Orleans")
cities == "New"
#> [1] FALSE FALSE FALSE
```

**Why it is wrong:** `==` checks for exact equality. No city is exactly "New".

**Correct:**
```r
str_detect(cities, "^New")
#> [1] TRUE TRUE TRUE
```

### Mistake 4: Not using fixed() for literal string matching

**Wrong:**
```r
# Trying to find literal "file.txt"
files <- c("file.txt", "filetxt", "file-txt")
str_detect(files, "file.txt")
#> [1]  TRUE  TRUE FALSE
```

**Why it is wrong:** The `.` in the pattern matches any character, so "filetxt" also matches.

**Correct:**
```r
str_detect(files, fixed("file.txt"))
#> [1]  TRUE FALSE FALSE
```

## Practice Exercises

### Exercise 1: Find state names containing "New"

Use `str_detect()` to find which of these state names contain the word "New".

```r
# Exercise: detect states with "New"
my_states <- c("New York", "California", "New Jersey",
               "Texas", "New Mexico", "Nevada")
# Hint: use str_detect() with a pattern

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_states <- c("New York", "California", "New Jersey",
               "Texas", "New Mexico", "Nevada")
my_result <- str_detect(my_states, "New")
print(my_result)
#> [1]  TRUE FALSE  TRUE FALSE  TRUE FALSE

# To get the actual names:
my_new_states <- str_subset(my_states, "New")
print(my_new_states)
#> [1] "New York"   "New Jersey" "New Mexico"
```

**Explanation:** `str_detect()` returns a logical vector. `str_subset()` filters the vector directly, returning only matching elements.

</details>

### Exercise 2: Clean phone number formatting

Remove all non-digit characters from these phone numbers using `str_replace_all()`.

```r
# Exercise: clean phone numbers
my_phones <- c("(212) 555-1234", "415.555.5678", "312 555 9012")
# Hint: use str_replace_all() with the pattern "[^0-9]"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_phones <- c("(212) 555-1234", "415.555.5678", "312 555 9012")
my_clean_phones <- str_replace_all(my_phones, "[^0-9]", "")
print(my_clean_phones)
#> [1] "2125551234" "4155555678" "3125559012"
```

**Explanation:** The pattern `[^0-9]` matches any character that is NOT a digit. `str_replace_all()` replaces every non-digit with an empty string, effectively keeping only the numbers.

</details>

### Exercise 3: Extract email domains

Extract the domain (everything after @) from these email addresses using `str_extract()`.

```r
# Exercise: extract email domains
my_emails <- c("alice@gmail.com", "bob@company.org", "carol@university.edu")
# Hint: use str_extract() with the pattern "@.+" then str_replace()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_emails <- c("alice@gmail.com", "bob@company.org", "carol@university.edu")
my_domains <- str_extract(my_emails, "(?<=@).+")
print(my_domains)
#> [1] "gmail.com"      "company.org"    "university.edu"
```

**Explanation:** The pattern `(?<=@).+` uses a lookbehind `(?<=@)` to match one or more characters that come after the `@` sign, without including the `@` itself in the result.

</details>

### Exercise 4: Split and recombine names

Split these full names into first and last, then recombine as "Last, First".

```r
# Exercise: reformat names
my_names <- c("John Smith", "Jane Doe", "Bob Jones")
# Hint: use str_split_fixed() with n=2, then str_c()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_names <- c("John Smith", "Jane Doe", "Bob Jones")
my_parts <- str_split_fixed(my_names, " ", n = 2)
my_reformatted <- str_c(my_parts[, 2], my_parts[, 1], sep = ", ")
print(my_reformatted)
#> [1] "Smith, John" "Doe, Jane"   "Jones, Bob"
```

**Explanation:** `str_split_fixed()` returns a matrix with one column per piece. Column 1 is the first name, column 2 is the last name. `str_c()` with `sep = ", "` joins them in "Last, First" order.

</details>

### Exercise 5: Multi-step string cleaning

Clean this messy address data: trim whitespace, fix case, and replace abbreviations.

```r
# Exercise: clean addresses
my_addresses <- c("  123 MAIN ST  ", " 456 oak ave ",
                   "  789   ELM BLVD  ")
# Goal: "123 Main St", "456 Oak Ave", "789 Elm Blvd"
# Hint: chain str_squish(), str_to_title(), str_replace_all()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_addresses <- c("  123 MAIN ST  ", " 456 oak ave ",
                   "  789   ELM BLVD  ")
my_clean <- my_addresses |>
  str_squish() |>
  str_to_title()
print(my_clean)
#> [1] "123 Main St"   "456 Oak Ave"   "789 Elm Blvd"
```

**Explanation:** `str_squish()` removes extra whitespace everywhere. `str_to_title()` capitalizes the first letter of each word. The pipe `|>` chains the operations in a readable sequence.

</details>

## Putting It All Together

Let's clean a realistic customer dataset using multiple stringr functions in a single pipeline. This example combines everything you learned.

```r
# Complete example: clean a messy customer dataset
library(dplyr)

customers <- data.frame(
  name = c("  john SMITH ", "JANE   doe", "  bob jones  "),
  email = c("John@Gmail.COM", "jane@company.org", "BOB@school.edu"),
  phone = c("(212) 555-1234", "415.555.5678", "312-555-9012"),
  city = c("new york", "SAN FRANCISCO", "  chicago  ")
)

clean_customers <- customers |>
  mutate(
    name = name |> str_squish() |> str_to_title(),
    email = str_to_lower(email),
    phone = str_replace_all(phone, "[^0-9]", ""),
    city = city |> str_squish() |> str_to_title(),
    email_domain = str_extract(email, "(?<=@).+")
  )

print(clean_customers)
#>         name              email      phone          city email_domain
#> 1 John Smith   john@gmail.com  2125551234      New York    gmail.com
#> 2   Jane Doe jane@company.org  4155555678 San Francisco  company.org
#> 3  Bob Jones   bob@school.edu  3125559012       Chicago   school.edu
```

This pipeline cleaned four columns and created a new one, all in a single `mutate()` call. The names are properly capitalized, emails are lowercase, phone numbers are digits only, cities are trimmed and title-cased, and email domains are extracted. This is how stringr functions work in real data workflows — they chain together cleanly because every function takes a string vector first.

## Summary

Here are all 15 stringr functions from this tutorial, grouped by task.

| Task | Function | What It Does | Base R Equivalent |
|---|---|---|---|
| Detect | `str_detect()` | TRUE/FALSE pattern match | `grepl()` |
| Detect | `str_subset()` | Filter matching strings | `grep(value = TRUE)` |
| Detect | `str_count()` | Count pattern matches | `gregexpr()` + lengths |
| Extract | `str_extract()` | Pull first match | `regmatches()` |
| Extract | `str_sub()` | Extract by position | `substr()` |
| Replace | `str_replace()` | Replace first match | `sub()` |
| Replace | `str_replace_all()` | Replace all matches | `gsub()` |
| Replace | `str_to_upper()` | Convert to uppercase | `toupper()` |
| Replace | `str_to_lower()` | Convert to lowercase | `tolower()` |
| Replace | `str_to_title()` | Title case | No direct equivalent |
| Split | `str_split()` | Split by delimiter | `strsplit()` |
| Combine | `str_c()` | Concatenate strings | `paste0()` |
| Format | `str_trim()` | Remove edge whitespace | `trimws()` |
| Format | `str_squish()` | Remove all extra whitespace | No direct equivalent |
| Format | `str_pad()` | Pad to fixed width | `formatC()` |

The key advantage of stringr over base R is consistency. Every function starts with `str_`, takes the string first, and returns a predictable output. Once you learn one function, you can guess how the others work.

## FAQ

**What is the difference between stringr and stringi?**

stringr is a wrapper around stringi. The stringi package has 250+ functions and handles every edge case (Unicode normalization, locale-specific collation, boundary detection). stringr exposes the 50 most common operations with a simpler interface. For 95% of data cleaning tasks, stringr is all you need. Reach for stringi when you need advanced Unicode handling or locale-specific sorting.

**Can stringr handle Unicode and non-English text?**

Yes. stringr uses stringi internally, which has full Unicode support. Functions like `str_to_upper()` and `str_to_lower()` handle accented characters correctly. For locale-specific behavior (like Turkish "i" capitalization), pass a locale: `str_to_upper("istanbul", locale = "tr")` gives "ISTANBUL" with the correct dotted capital I.

**When should I use fixed() instead of regex patterns?**

Use `fixed()` when your pattern is a literal string with no special regex characters. `str_detect(x, fixed("file.txt"))` is faster and more correct than `str_detect(x, "file\\.txt")`. The `fixed()` wrapper tells stringr to skip regex parsing entirely. Use it whenever you search for exact text — especially text containing `.`, `(`, `)`, `*`, `+`, or `?`.

**How does str_detect() differ from grepl()?**

Both return a logical vector. The difference is argument order. `grepl(pattern, x)` puts the pattern first. `str_detect(x, pattern)` puts the string first. This means `str_detect()` works naturally with pipes: `x |> str_detect("pattern")`. The output is identical for simple patterns.

**Is stringr faster than base R string functions?**

For single operations, stringr and base R are comparable in speed. stringr may be slightly slower due to wrapper overhead. For complex regex operations on large vectors (1M+ strings), the difference is negligible because both use compiled C code internally. The real advantage of stringr is programmer speed — consistent syntax means fewer bugs and faster development.

## References

1. Wickham, H. — stringr: Simple, Consistent Wrappers for Common String Operations. [Link](https://stringr.tidyverse.org/)
2. Wickham, H. & Grolemund, G. — *R for Data Science*, 1st Edition. Chapter 14: Strings. [Link](https://r4ds.had.co.nz/strings.html)
3. CRAN — Introduction to stringr (vignette). [Link](https://cran.r-project.org/web/packages/stringr/vignettes/stringr.html)
4. RStudio — String manipulation with stringr cheatsheet. [Link](https://rstudio.github.io/cheatsheets/html/strings.html)
5. Gagolewski, M. — stringi: Fast and Portable Character String Processing in R. [Link](https://stringi.gagolewski.com/)
6. R Core Team — grep() and related functions documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/grep.html)
7. Sanchez, G. — *Handling Strings with R*. [Link](https://www.gastonsanchez.com/r4strings/)

## What's Next?

Now that you can clean and manipulate strings, here are three natural next steps:

1. **[Regular Expressions in R](/R-Regex.html)** — Dive deeper into regex patterns for complex string matching beyond the basics covered here.
2. **[lubridate in R](/lubridate-in-R.html)** — Handle date-time strings after you have cleaned them with stringr.
3. **[dplyr mutate & rename](/dplyr-mutate-rename.html)** — Combine stringr with dplyr to transform string columns across entire data frames.
