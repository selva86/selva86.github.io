---
title: "tidyr separate() & unite() in R: Split & Combine Character Columns"
slug: "tidyr-separate-unite-Split-Combine-Columns-in-R"
description: "Split columns with separate_wider_delim() and combine with unite() in tidyr. Practical R examples showing delimiter, position, and regex-based splits."
keywords: "tidyr separate, separate_wider_delim, separate_wider_position, separate_wider_regex, tidyr unite, split column R, combine columns R, tidyr"
auto_link_terms: "separate_wider_delim()|separate_wider_position()|separate_wider_regex()|unite()|split column in R|combine columns in R|tidyr separate"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-tidy-1"
post_type: "C"
fr_parent: "pivot_longer-pivot_wider-Reshape-Data-in-R.html"
sidebar_section: "Data Wrangling"
sidebar_title: "separate() & unite()"
difficulty: "Intermediate"
---


# tidyr separate() & unite() in R: Split & Combine Character Columns

<p class="lead"><code>separate_wider_delim()</code>, <code>separate_wider_position()</code>, and <code>separate_wider_regex()</code> split one character column into several new columns. <code>unite()</code> does the reverse, glueing several columns into one string. These are the modern tidyr tools for reshaping columns by splitting and combining text.</p>

## Introduction

Real data often packs multiple pieces of information into a single column. A "date" column might contain `"2026-04-06"` when you need separate year, month, and day fields. An order ID like `"US-2026-1042"` hides region, year, and sequence number. Before you can filter, group, or visualize those pieces, you need to break them apart.

The tidyr package provides three modern functions for this job. Each one splits a character column into new columns using a different strategy: a delimiter character, fixed character widths, or a regex pattern. For the reverse direction, `unite()` pastes columns back together with a separator of your choice.

[NOTE]
**The original separate() was superseded in tidyr 1.3.0.** The three `separate_wider_*()` functions replace it with clearer names and better error handling. All code in this tutorial uses the modern functions. If you see `separate()` in older tutorials, the concepts are the same but the syntax differs.

Every code block on this page runs in your browser. Click Run on the first block to load the library, then work through the rest top to bottom. Variables carry over between blocks.

## How do you split a column on a delimiter?

The most common case is splitting on a known character like a dash, underscore, or comma. This is the job for `separate_wider_delim()`. You tell it which column to split, the delimiter to split on, and the names for the new columns.

Let's start with a small order dataset where region, year, and ID are packed into one column.

```r
library(tidyr)
library(dplyr)

orders <- tibble(
  order_code = c("US-2026-1042", "EU-2025-3891", "AP-2026-0217"),
  amount     = c(250, 180, 430)
)
orders
#> # A tibble: 3 x 2
#>   order_code   amount
#>   <chr>         <dbl>
#> 1 US-2026-1042    250
#> 2 EU-2025-3891    180
#> 3 AP-2026-0217    430
```

Each `order_code` holds three pieces separated by dashes. Let's split them into `region`, `year`, and `id`.

```r
orders_split <- orders |>
  separate_wider_delim(
    cols  = order_code,
    delim = "-",
    names = c("region", "year", "id")
  )
orders_split
#> # A tibble: 3 x 4
#>   region year  id    amount
#>   <chr>  <chr> <chr>  <dbl>
#> 1 US     2026  1042     250
#> 2 EU     2025  3891     180
#> 3 AP     2026  0217     430
```

The original `order_code` column is gone (replaced by the three new ones). The new columns are all character type. If you need `year` as an integer, pipe into `mutate(year = as.integer(year))` afterward.

[TIP]
**Drop components you do not need by setting a name to NA.** If you only want the region, use `names = c("region", NA, NA)`. The unnamed parts are silently discarded.

Here is a second example: splitting a date string into year, month, and day.

```r
logs <- tibble(
  date_str = c("2026-04-06", "2025-12-31", "2026-01-15"),
  event    = c("login", "purchase", "logout")
)

logs_split <- logs |>
  separate_wider_delim(date_str, delim = "-", names = c("year", "month", "day"))
logs_split
#> # A tibble: 3 x 4
#>   year  month day   event
#>   <chr> <chr> <chr> <chr>
#> 1 2026  04    06    login
#> 2 2025  12    31    purchase
#> 3 2026  01    15    logout
```

The function reads left to right, assigning each piece between delimiters to the next name. Three dashes in the date produce two splits and three pieces, matching the three names you provided.

## How do you split a fixed-width column?

Some data encodes meaning in character positions, not delimiters. A product code like `"m1234"` might pack a one-character category code followed by a four-digit serial. There is no separator to split on, but `separate_wider_position()` handles this by character widths.

You pass a named integer vector where the names become column names and the values are the character widths.

```r
codes <- tibble(
  product_code = c("m1234", "f5678", "m9012", "f3456"),
  price        = c(29.99, 49.99, 15.00, 89.50)
)

codes_split <- codes |>
  separate_wider_position(
    cols   = product_code,
    widths = c(category = 1, serial = 4)
  )
codes_split
#> # A tibble: 4 x 3
#>   category serial price
#>   <chr>    <chr>  <dbl>
#> 1 m        1234    29.99
#> 2 f        5678    49.99
#> 3 m        9012    15.00
#> 4 f        3456    89.50
```

The widths must add up to the total character length of every value. If some rows are shorter, the function errors by default. You can relax this with the `too_few` argument (covered in the next section).

## How do you split columns using a regex pattern?

When neither a single delimiter nor fixed widths describe your data, `separate_wider_regex()` is the escape hatch. You provide a named character vector of regex patterns. Named patterns become columns; unnamed patterns match text to skip.

Consider tags like `"v2.1-beta"` where you want the major version, minor version, and stage. The hyphen separates the version from the stage, but the dot separates major from minor.

```r
tags <- tibble(
  tag = c("v2.1-beta", "v3.0-stable", "v1.12-alpha"),
  date = c("2026-01-10", "2026-03-20", "2025-11-05")
)

tags_split <- tags |>
  separate_wider_regex(
    cols = tag,
    patterns = c(
      "v",                       # skip the leading "v"
      major = "\\d+",           # capture digits as major
      "\\.",                     # skip the dot
      minor = "\\d+",           # capture digits as minor
      "-",                       # skip the hyphen
      stage = ".*"              # capture everything else as stage
    )
  )
tags_split
#> # A tibble: 3 x 4
#>   major minor stage  date
#>   <chr> <chr> <chr>  <chr>
#> 1 2     1     beta   2026-01-10
#> 2 3     0     stable 2026-03-20
#> 3 1     12    alpha  2025-11-05
```

Each named element in the `patterns` vector creates a column. Unnamed elements match text that gets discarded. The patterns are applied left to right, consuming the string as they go.

[KEY INSIGHT]
**Regex splitting is the most flexible but hardest to read.** Start with `separate_wider_delim()` when you have a single clean separator. Move to `separate_wider_position()` for fixed-width formats. Only reach for `separate_wider_regex()` when the other two cannot handle the pattern.

## How do you handle rows that do not split cleanly?

Real data is messy. Some rows may have fewer separators than expected, and others may have more. By default, all three `separate_wider_*()` functions throw an error when this happens. The `too_few` and `too_many` arguments control the behavior.

Let's see what happens when some orders have only two parts instead of three.

```r
messy <- tibble(
  code = c("US-2026-1042", "EU-2025", "AP-2026-0217-RUSH"),
  amount = c(250, 180, 430)
)

messy_split <- messy |>
  separate_wider_delim(
    code,
    delim = "-",
    names = c("region", "year", "id"),
    too_few  = "align_start",
    too_many = "merge"
  )
messy_split
#> # A tibble: 3 x 4
#>   region year  id        amount
#>   <chr>  <chr> <chr>      <dbl>
#> 1 US     2026  1042         250
#> 2 EU     2025  <NA>         180
#> 3 AP     2026  0217-RUSH    430
```

Row 2 had only two pieces, so `too_few = "align_start"` fills from the left and puts `NA` in the remaining column. Row 3 had four pieces, so `too_many = "merge"` keeps the extra part attached to the last column instead of erroring.

[WARNING]
**The default for both arguments is "error".** If you do not set `too_few` and `too_many`, the function stops at the first row that does not match. Always inspect your data first with `count()` or `str_count()` to know how many pieces each row has.

Here is a quick reference for the options:

| Argument | Option | What it does |
|---|---|---|
| `too_few` | `"error"` (default) | Stops with an error message |
| `too_few` | `"align_start"` | Fills columns left to right, puts `NA` in the rest |
| `too_few` | `"align_end"` | Fills columns right to left, puts `NA` at the start |
| `too_many` | `"error"` (default) | Stops with an error message |
| `too_many` | `"drop"` | Silently drops extra pieces |
| `too_many` | `"merge"` | Merges extra pieces into the last column |

Both arguments also accept `"debug"`, which keeps the original column plus adds problem indicator columns so you can investigate.

## How do you combine columns with unite()?

`unite()` is the complement of the split functions. It pastes two or more columns together with a separator and optionally removes the original columns.

Let's combine year, month, and day columns back into a date string.

```r
date_parts <- tibble(
  year  = c("2026", "2025", "2026"),
  month = c("04", "12", "01"),
  day   = c("06", "31", "15"),
  event = c("login", "purchase", "logout")
)

date_united <- date_parts |>
  unite(col = "date", year, month, day, sep = "-")
date_united
#> # A tibble: 3 x 2
#>   date       event
#>   <chr>      <chr>
#> 1 2026-04-06 login
#> 2 2025-12-31 purchase
#> 3 2026-01-15 logout
```

The `col` argument names the new combined column. The `sep` argument controls the glue between values (default is `"_"`). By default, `unite()` removes the source columns. Set `remove = FALSE` to keep them.

When your data has missing values, `unite()` pastes the literal string `"NA"` by default. Use `na.rm = TRUE` to skip missing values.

```r
addr <- tibble(
  street = c("123 Main St", "456 Oak Ave"),
  apt    = c(NA, "Suite 2B"),
  city   = c("Portland", "Denver")
)

addr_united <- addr |>
  unite("full_address", street, apt, city, sep = ", ", na.rm = TRUE)
addr_united
#> # A tibble: 2 x 1
#>   full_address
#>   <chr>
#> 1 123 Main St, Portland
#> 2 456 Oak Ave, Suite 2B, Denver
```

Without `na.rm = TRUE`, the first row would read `"123 Main St, NA, Portland"`. The `na.rm` argument drops the missing piece and adjusts the separators automatically.

## Common Mistakes and How to Fix Them

### Mistake 1: Using the deprecated separate() instead of separate_wider_delim()

❌ **Wrong:**
```r
df |> separate(name, into = c("first", "last"), sep = " ")
```

**Why it is wrong:** `separate()` is superseded in tidyr 1.3+. It still works but has weaker error handling and no `too_few`/`too_many` controls. New code should use the modern functions.

✅ **Correct:**
```r
df |> separate_wider_delim(name, delim = " ", names = c("first", "last"))
```

### Mistake 2: Forgetting too_few when data has inconsistent splits

❌ **Wrong:**
```r
messy_df |> separate_wider_delim(code, delim = "-", names = c("a", "b", "c"))
#> Error: Expected 3 pieces in every row, but row 2 has only 2
```

**Why it is wrong:** The default `too_few = "error"` halts on the first row with fewer pieces than expected. If even one row is short, the entire call fails.

✅ **Correct:**
```r
messy_df |>
  separate_wider_delim(code, delim = "-", names = c("a", "b", "c"),
                       too_few = "align_start")
```

### Mistake 3: Getting "NA" strings from unite() with missing values

❌ **Wrong:**
```r
df |> unite("full", first_name, last_name, sep = " ")
#> Row with NA becomes "John NA" instead of just "John"
```

**Why it is wrong:** `unite()` converts `NA` to the string `"NA"` and pastes it. The result looks correct but contains a literal `"NA"` that passes `is.na()` as `FALSE`.

✅ **Correct:**
```r
df |> unite("full", first_name, last_name, sep = " ", na.rm = TRUE)
```

## Practice Exercises

### Exercise 1: Split email addresses

Split the `email` column into `username` and `domain` using the `@` delimiter.

```r
# Exercise: split emails on "@"
my_data <- tibble(
  email = c("alice@gmail.com", "bob@company.org", "carol@uni.edu"),
  active = c(TRUE, FALSE, TRUE)
)
# Hint: use separate_wider_delim() with delim = "@"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- my_data |>
  separate_wider_delim(email, delim = "@", names = c("username", "domain"))
my_result
#> # A tibble: 3 x 3
#>   username domain       active
#>   <chr>    <chr>        <lgl>
#> 1 alice    gmail.com    TRUE
#> 2 bob      company.org  FALSE
#> 3 carol    uni.edu      TRUE
```

**Explanation:** The `@` symbol cleanly separates every email into exactly two pieces. Each piece gets the name you assigned.

</details>

### Exercise 2: Split fixed-width census codes

Each `census_code` is exactly 7 characters: 2-character state, 3-digit county, 2-digit tract. Split it into three columns.

```r
# Exercise: split fixed-width census codes
my_data2 <- tibble(
  census_code = c("CA12301", "NY45602", "TX78903"),
  population  = c(50000, 32000, 87000)
)
# Hint: use separate_wider_position() with widths

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result2 <- my_data2 |>
  separate_wider_position(
    census_code,
    widths = c(state = 2, county = 3, tract = 2)
  )
my_result2
#> # A tibble: 3 x 4
#>   state county tract population
#>   <chr> <chr>  <chr>      <dbl>
#> 1 CA    123    01         50000
#> 2 NY    456    02         32000
#> 3 TX    789    03         87000
```

**Explanation:** The widths 2 + 3 + 2 = 7 match the total length of each code. Each width grabs that many characters from left to right.

</details>

### Exercise 3: Unite columns and handle NAs

Combine `first_name`, `middle_name`, and `last_name` into a single `full_name` column, skipping any missing values.

```r
# Exercise: unite names with NA handling
my_data3 <- tibble(
  first_name  = c("Ada", "Grace", "Alan"),
  middle_name = c(NA, "Brewster", NA),
  last_name   = c("Lovelace", "Hopper", "Turing")
)
# Hint: use unite() with na.rm = TRUE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result3 <- my_data3 |>
  unite("full_name", first_name, middle_name, last_name, sep = " ", na.rm = TRUE)
my_result3
#> # A tibble: 3 x 1
#>   full_name
#>   <chr>
#> 1 Ada Lovelace
#> 2 Grace Brewster Hopper
#> 3 Alan Turing
```

**Explanation:** With `na.rm = TRUE`, `unite()` skips the missing middle names and produces clean full names without extra spaces or literal "NA" strings.

</details>

## Putting It All Together

Let's combine splitting and combining in one realistic pipeline. You receive a dataset of employee records where the ID encodes department and hire year, and the name is a single column. You need to split the ID, split the name, and then unite department with last name for a label.

```r
employees <- tibble(
  emp_id = c("ENG-2019-042", "MKT-2021-108", "FIN-2020-007"),
  full_name = c("Alice Chen", "Bob Martinez", "Carol Singh"),
  salary = c(95000, 78000, 88000)
)

result <- employees |>
  separate_wider_delim(emp_id, delim = "-",
                       names = c("dept", "hire_year", "seq")) |>
  separate_wider_delim(full_name, delim = " ",
                       names = c("first", "last")) |>
  unite("dept_label", dept, last, sep = "-", remove = FALSE) |>
  select(dept_label, first, last, dept, hire_year, salary)
result
#> # A tibble: 3 x 6
#>   dept_label first last    dept  hire_year salary
#>   <chr>      <chr> <chr>   <chr> <chr>      <dbl>
#> 1 ENG-Chen   Alice Chen    ENG   2019       95000
#> 2 MKT-Martinez Bob  Martinez MKT  2021       78000
#> 3 FIN-Singh  Carol Singh   FIN   2020       88000
```

This pipeline chains two splits and one unite. The first split breaks the ID into department, year, and sequence. The second split breaks the name into first and last. Then `unite()` creates a department-last name label. Setting `remove = FALSE` keeps the source columns so you still have them for filtering or grouping.

## Summary

Here is a quick comparison of the four functions covered in this tutorial:

| Function | Strategy | Use when... | Key argument |
|---|---|---|---|
| `separate_wider_delim()` | Split on a delimiter character | Data has a consistent separator (dash, comma, space) | `delim` |
| `separate_wider_position()` | Split by character widths | Data uses fixed-width encoding (2-char state + 3-digit code) | `widths` |
| `separate_wider_regex()` | Split using regex patterns | No single delimiter or fixed width works | `patterns` |
| `unite()` | Combine columns into one string | You need to paste columns back together | `sep`, `na.rm` |

Key takeaways:

- Start with `separate_wider_delim()`. It handles 80% of split tasks.
- Use `too_few` and `too_many` to handle inconsistent data gracefully.
- Set `na.rm = TRUE` in `unite()` to avoid literal "NA" strings.
- All new columns from splitting are character type. Convert with `as.integer()` or `as.double()` as needed.

## FAQ

### When should I use separate_wider_regex() instead of separate_wider_delim()?

Use `separate_wider_regex()` when there is no single consistent delimiter. For example, a string like `"v2.1-beta"` has both dots and dashes as separators, plus a leading `"v"` to skip. A regex pattern handles all of these in one call.

### Does unite() change column types?

Yes. `unite()` always produces a character column, even if the input columns are numeric or logical. If you need a typed result, parse the united column afterward with `as.Date()`, `as.numeric()`, or similar.

### Can I split into rows instead of columns?

Yes, but you need different functions. `separate_longer_delim()` and `separate_longer_position()` split a column into multiple *rows* instead of multiple *columns*. Use the `_wider_` variants when each piece should become its own column and the `_longer_` variants when each piece should become its own row.

## References

1. Wickham, H. et al., tidyr: Tidy Messy Data. CRAN package documentation. [Link](https://tidyr.tidyverse.org/)
2. tidyr reference, `separate_wider_delim()`, `separate_wider_position()`, `separate_wider_regex()`. [Link](https://tidyr.tidyverse.org/reference/separate_wider_delim.html)
3. tidyr reference, `unite()`. [Link](https://tidyr.tidyverse.org/reference/unite.html)
4. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. O'Reilly (2023). Chapter 14: Strings. [Link](https://r4ds.hadley.nz/strings)
5. tidyr changelog, tidyr 1.3.0 release notes (separate_wider_* introduction). [Link](https://tidyr.tidyverse.org/news/index.html)

## Continue Learning

- [pivot_longer() and pivot_wider(): Reshape Data in R](pivot_longer-pivot_wider-Reshape-Data-in-R.html), The parent tutorial covering row-level reshaping, the complement to column-level splitting and combining.
- [Missing Values in R: Detect, Count, Remove, and Impute NA](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html), Splitting columns often reveals hidden NAs. Learn the full toolkit for handling them.
