---
title: "R Data Import Exercises: 10 read_csv(), read_excel() Practice Problems, Solved Step-by-Step"
slug: "R-Data-Import-Exercises"
description: "Ten hands-on R data import exercises: read_csv(), read_delim(), column types, NA handling, skipping metadata, multi-file reads, with full worked solutions."
keywords: "R data import exercises, read_csv exercises, readr practice, read_delim exercises, col_types exercises, import practice problems R, readxl exercises, R csv parsing practice"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "FR-impo-3"
post_type: "EX"
sidebar_title: "Data Import (10 problems)"
auto_link_terms: "R data import exercises|read_csv exercises|readr practice|data import practice problems|read_delim exercises|col_types exercises"
auto_link_case_sensitive: false
fr_parent: "Importing-Data-in-R.html"
difficulty: "Intermediate"
---


# R Data Import Exercises: 10 read_csv(), read_excel() Practice Problems

<p class="lead">Ten practical exercises drill <code>read_csv()</code>, <code>read_delim()</code>, column types, missing values, and multi-file imports in R, each with a runnable solution and inline output you can verify in your browser.</p>

## Introduction

Reading the `readr` reference page is one thing. Applying it to a file with stray metadata rows, leading-zero zip codes, and three different spellings of "missing" is another. These ten problems close that gap. Each one targets a specific import skill that trips real analysts on their first messy CSV.

You will start with straight CSV reads, then move to column-type control and NA handling, and finish by combining multiple files with mismatched columns. All solutions run in one shared R session, so use `ans1`, `ans2`, ... in your own attempts to avoid overwriting the setup datasets. One exercise uses `readxl` for Excel files, its code and expected output are shown inline.

If `read_csv()` and `col_types` are new to you, skim the parent [Importing Data in R](Importing-Data-in-R.html) tutorial first. Otherwise, run the Setup block and begin.

## Setup: The CSV Snippets We Will Use

Instead of scattering raw CSV strings across every exercise, we define them once here. These are tiny on purpose, a few rows each, so you can eyeball the expected output and catch mistakes without scrolling. Run the block below once; every exercise after it reuses these objects.

```r title="Setup: load libraries and CSV snippets"
# Setup: load libraries and define CSV snippets for every exercise
library(readr)
library(dplyr)

# Basic product catalog
csv_basic <- "product,price,qty,in_stock
Laptop,999.99,50,TRUE
Mouse,24.99,200,TRUE
Keyboard,74.50,0,FALSE"

# Pipe-delimited employee records
csv_pipe <- "name|dept|salary
Alice|Engineering|95000
Bob|Marketing|82000
Carol|Sales|68000"

# Customer IDs and zip codes with leading zeros
csv_zip <- "name,zipcode,phone
Alice,01234,5551234567
Bob,00501,5559876543
Carol,07008,5553344556"

# Scores with four different missing-value conventions
csv_na <- "id,score,grade
1,88,A
2,N/A,B
3,,-
4,-999,C
5,76,"

# Events with US-format dates
csv_dates <- "event,date
Meeting,03/30/2026
Lunch,03/31/2026
Review,04/01/2026"

# CSV with three metadata lines before the real header
csv_meta <- "Report: Quarterly Sales
Generated: 2026-03-30
---
product,q1,q2
Laptop,120,150
Mouse,450,500"

# Two monthly sales files to combine
csv_jan <- "date,sales
2026-01-01,100
2026-01-02,120"
csv_feb <- "date,sales
2026-02-01,150
2026-02-02,130"

# A bigger table — 1,000 rows
set.seed(1)
csv_big <- paste(c("x,y", paste(1:1000, round(runif(1000), 3), sep = ",")),
                 collapse = "\n")

# Two files with overlapping but non-identical columns
csv_mixed_a <- "id,name,score
1,Alice,88
2,Bob,76"
csv_mixed_b <- "id,name,grade
3,Carol,A
4,David,B"

cat("Setup complete. CSV snippets ready.\n")
#> Setup complete. CSV snippets ready.
```

Take a quick look at the shape of each snippet. `csv_basic` has 3 rows and 4 columns. `csv_na` contains five rows with missing values expressed as blank, `N/A`, `-`, and `-999`, a deliberate mess. `csv_big` is the only snippet with real volume (1,000 rows), and it only exists so Exercise 8 can demonstrate `n_max`.

[TIP]
**Run Setup once per session.** All ten exercises share these objects. If you refresh the browser or reset the R session, re-run the Setup block before trying the next exercise.

## Warm-Up: Read CSV Basics (Exercises 1-3)

The first three problems build muscle memory for `read_csv()` and `read_delim()`. If you can finish them without peeking at the reveal, you own the fundamentals. Each expected result is stated up front so you can self-check.

### Exercise 1: Read a CSV and report the inferred column types

Use `read_csv()` to parse `csv_basic` into a data frame, then print the parsed tibble. Save it as `ans1`. Expected: 3 rows, 4 columns, with `price` numeric, `qty` integer, and `in_stock` logical.

```r title="Exercise 1: readcsv basic parse"
# Exercise 1: parse csv_basic with read_csv()
# Hint: use show_col_types = FALSE to silence the spec message

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ans1 <- read_csv(csv_basic, show_col_types = FALSE)
ans1
#> # A tibble: 3 x 4
#>   product   price   qty in_stock
#>   <chr>     <dbl> <dbl> <lgl>
#> 1 Laptop    1000.    50 TRUE
#> 2 Mouse      25.0   200 TRUE
#> 3 Keyboard   74.5     0 FALSE
```

**Explanation:** `read_csv()` reads comma-separated text (here, a string passed directly instead of a file path) and infers each column's type from the first 1,000 rows. `price` becomes `<dbl>` because it has decimals, `qty` also becomes `<dbl>` because `readr` uses double as its default numeric type, and `in_stock` becomes `<lgl>` because its values are all `TRUE`/`FALSE`. `show_col_types = FALSE` hides the auto-spec message, useful in tutorials, but keep it on when debugging real data.

</details>

### Exercise 2: Read a pipe-delimited file

`read_csv()` expects commas. For other delimiters, use `read_delim()`. Parse `csv_pipe` and save the result as `ans2`. Expected: 3 rows, 3 columns.

```r title="Exercise 2: read pipe-delimited file"
# Exercise 2: parse csv_pipe (delimiter is |)
# Hint: read_delim(..., delim = "|")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ans2 <- read_delim(csv_pipe, delim = "|", show_col_types = FALSE)
ans2
#> # A tibble: 3 x 3
#>   name  dept        salary
#>   <chr> <chr>        <dbl>
#> 1 Alice Engineering  95000
#> 2 Bob   Marketing    82000
#> 3 Carol Sales        68000
```

**Explanation:** `read_delim()` is the general-purpose reader, you tell it the delimiter and it handles everything else the same way `read_csv()` does. Pipes (`|`) are common in database exports because commas appear inside free-text fields, so switching the delimiter avoids the need for quoting. The readr shortcuts `read_csv()`, `read_tsv()`, and `read_csv2()` (semicolon, European convention) are just `read_delim()` with the delimiter pre-set.

</details>

### Exercise 3: Preserve leading zeros in ID columns

`read_csv()` sees `01234` as the number 1234 and drops the leading zero. For zip codes, product SKUs, and phone numbers that is a silent data-loss bug. Parse `csv_zip` so that `zipcode` and `phone` are read as strings. Save as `ans3`.

```r title="Exercise 3: keep ZIP and phone as character"
# Exercise 3: keep zipcode and phone as character
# Hint: col_types = cols(zipcode = col_character(), phone = col_character())

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ans3 <- read_csv(csv_zip,
                 col_types = cols(zipcode = col_character(),
                                  phone   = col_character()))
ans3
#> # A tibble: 3 x 3
#>   name  zipcode phone
#>   <chr> <chr>   <chr>
#> 1 Alice 01234   5551234567
#> 2 Bob   00501   5559876543
#> 3 Carol 07008   5553344556
```

**Explanation:** The `col_types` argument lets you override `read_csv()`'s type guesses on a per-column basis. `col_character()` forces the column to stay as text, so leading zeros survive. You only need to declare the columns you want to override, the rest keep their inferred types. The shorthand `col_types = "ccc"` (three characters: one letter per column) does the same thing when every column is the same type.

</details>

[KEY INSIGHT]
**Type inference is fast but lossy.** `read_csv()` looks at the top of the file to guess types. That guess is wrong whenever a column looks numeric but is actually an identifier, zip codes, SKUs, phone numbers, product codes with leading zeros. Always declare `col_types` for identifier columns, even when the first few rows look clean.

## Core Challenges: Column Types and Missing Data (Exercises 4-6)

Real CSV files rarely come clean. These three exercises fix the three most common header-to-data quirks: missing values in disguise, dates in regional formats, and report metadata stuffed above the real header row.

### Exercise 4: Handle multiple NA representations in one file

`csv_na` uses four different conventions for missing values, blank, `N/A`, `-`, and `-999`. Read it so that all four become `NA` in R. Save to `ans4` and confirm the total NA count equals 4.

```r title="Exercise 4: normalise missing-value markers"
# Exercise 4: normalise all missing value conventions
# Hint: read_csv(csv_na, na = c("", "N/A", "-", "-999"))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ans4 <- read_csv(csv_na,
                 na = c("", "N/A", "-", "-999"),
                 show_col_types = FALSE)
ans4
#> # A tibble: 5 x 3
#>      id score grade
#>   <dbl> <dbl> <chr>
#> 1     1    88 A
#> 2     2    NA B
#> 3     3    NA NA
#> 4     4    NA C
#> 5     5    76 NA

sum(is.na(ans4))
#> [1] 4
```

**Explanation:** `read_csv()` treats `""` and `"NA"` as missing by default. Anything else, `N/A`, `-`, `-999`, or a custom sentinel, has to be declared through the `na` argument. Pass a character vector of every spelling you want converted, and `readr` applies them before type inference runs. That matters: if you forget `"-999"`, the `score` column would be read as numeric with an outlier, and imputing the mean would quietly poison your analysis.

</details>

### Exercise 5: Parse dates in MM/DD/YYYY format

US-style dates (`03/30/2026`) are read as character strings by default. Parse `csv_dates` so the `date` column comes back as a real `Date`. Save to `ans5` and confirm `class(ans5$date)` is `"Date"`.

```r title="Exercise 5: parse MM/DD/YYYY dates"
# Exercise 5: parse the date column in MM/DD/YYYY format
# Hint: col_types = cols(date = col_date(format = "%m/%d/%Y"))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ans5 <- read_csv(csv_dates,
                 col_types = cols(date = col_date(format = "%m/%d/%Y")))
ans5
#> # A tibble: 3 x 2
#>   event   date
#>   <chr>   <date>
#> 1 Meeting 2026-03-30
#> 2 Lunch   2026-03-31
#> 3 Review  2026-04-01

class(ans5$date)
#> [1] "Date"
```

**Explanation:** `col_date()` turns a character column into a true `Date` at read time, using the `strptime` format codes (`%Y` year, `%m` month, `%d` day). Parsing dates up front is worth the extra keystrokes, once the column is a `Date` you get sort, filter, and arithmetic for free. The alternative, parsing later with `lubridate::mdy()`, works but means your column is wrong until you remember to fix it.

</details>

### Exercise 6: Skip metadata header rows

`csv_meta` has three lines of human-readable metadata (`Report:`, `Generated:`, `---`) before the real header. Read it so the tibble has two rows and three columns. Save to `ans6`.

```r title="Exercise 6: skip metadata lines"
# Exercise 6: skip the first 3 metadata lines
# Hint: read_csv(..., skip = 3)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ans6 <- read_csv(csv_meta, skip = 3, show_col_types = FALSE)
ans6
#> # A tibble: 2 x 3
#>   product    q1    q2
#>   <chr>   <dbl> <dbl>
#> 1 Laptop    120   150
#> 2 Mouse     450   500
```

**Explanation:** `skip = N` tells `readr` to ignore the first `N` lines entirely, they never enter the parser, so the next line becomes the header. This works for any fixed-length preamble. For variable-length metadata (for example, "skip until you hit a blank line"), use `comment = "#"` or read the whole file with `read_lines()` and filter before parsing. Pair `skip` with `col_names` when the file has no header at all.

</details>

[WARNING]
**`skip` counts lines, not rows.** If a metadata block wraps inside quotes or spans multiple logical lines, `skip = 3` may cut through the middle of a record. Always preview raw files with `read_lines(path, n_max = 10)` before guessing how many lines to skip.

## Advanced: Multiple Files and Real-World Edge Cases (Exercises 7-10)

The final four exercises cover the situations where an import job becomes a data pipeline: filtering columns at read time, peeking at giant files, combining several files into one tibble, and reading a genuine Excel workbook.

### Exercise 7: Read only selected columns

Reading every column when you only need three is a waste on wide files. Use `col_select` to parse `csv_big` and keep only the `x` column. Save to `ans7` and confirm it has one column and 1,000 rows.

```r title="Exercise 7: read one column only"
# Exercise 7: read csv_big but keep only column x
# Hint: read_csv(..., col_select = x)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ans7 <- read_csv(csv_big, col_select = x, show_col_types = FALSE)

dim(ans7)
#> [1] 1000    1

head(ans7, 3)
#> # A tibble: 3 x 1
#>       x
#>   <int>
#> 1     1
#> 2     2
#> 3     3
```

**Explanation:** `col_select` supports the full `tidyselect` vocabulary, the same DSL `dplyr::select()` uses. You can pass bare names (`col_select = x`), helpers (`col_select = starts_with("value_")`), or negation (`col_select = !c(notes, metadata)`). Columns you drop are never parsed, so on wide files the performance gain is real, not just a post-read convenience.

</details>

### Exercise 8: Read only the first few rows

When you want a fast preview of a file, schema, first few values, rough shape, you do not need to read the whole thing. Use `n_max` to read the first 5 rows of `csv_big` and save to `ans8`.

```r title="Exercise 8: read first five rows"
# Exercise 8: read the first 5 rows of csv_big
# Hint: n_max = 5

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ans8 <- read_csv(csv_big, n_max = 5, show_col_types = FALSE)
ans8
#> # A tibble: 5 x 2
#>       x     y
#>   <int> <dbl>
#> 1     1 0.266
#> 2     2 0.372
#> 3     3 0.573
#> 4     4 0.908
#> 5     5 0.202
```

**Explanation:** `n_max` caps the number of data rows read, not counting the header. Pair it with `col_types = cols(.default = col_character())` when you just want to look at raw text and do not care about type inference yet. For really large files, `n_max` is much faster than reading everything and then calling `head()`, because `read_csv()` stops parsing the moment it hits the row limit.

</details>

### Exercise 9: Combine two CSVs and tag the source

You have two monthly sales files in `csv_jan` and `csv_feb`. Read both, add a `month` column to each showing which file it came from, and stack them into one tibble. Save to `ans9`. Expected: 4 rows, 3 columns.

```r title="Exercise 9: combine monthly files"
# Exercise 9: combine csv_jan and csv_feb, add month tag
# Hint: read each, mutate(month = ...), bind_rows()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
df_jan <- read_csv(csv_jan, show_col_types = FALSE) |>
  mutate(month = "Jan")

df_feb <- read_csv(csv_feb, show_col_types = FALSE) |>
  mutate(month = "Feb")

ans9 <- bind_rows(df_jan, df_feb)
ans9
#> # A tibble: 4 x 3
#>   date        sales month
#>   <date>      <dbl> <chr>
#> 1 2026-01-01    100 Jan
#> 2 2026-01-02    120 Jan
#> 3 2026-02-01    150 Feb
#> 4 2026-02-02    130 Feb
```

**Explanation:** `bind_rows()` stacks data frames vertically and aligns columns by name, not position, missing columns become `NA`, which saves you from silent misalignment bugs. Tagging each piece with its source (`month = "Jan"`) before binding is the key habit: once rows are mixed, you cannot tell them apart. For many files, wrap this pattern in `purrr::map_dfr(files, ~read_csv(.x) |> mutate(source = .x))` to read and tag in one pass.

</details>

[TIP]
**Prefer `bind_rows()` over `rbind()` for imported data.** `bind_rows()` handles mismatched columns, type promotion, and factor levels gracefully. Base R's `rbind()` errors on the first column mismatch and silently mangles factor columns when types differ across files.

### Exercise 10: Read an Excel workbook with readxl

Excel files need a different package: `readxl::read_excel()`. You pass a file path and (optionally) a sheet name or index. Write the code to read the first sheet of `"sales_2026.xlsx"` into `ans10`.

[NOTE]
**readxl does not run in this browser sandbox.** The interactive R engine on this page does not include `readxl`. Run the code below in local RStudio or any desktop R session. The expected output is shown so you can still verify your code against it.

```r title="Exercise 10: read Excel sheet"
# Exercise 10: read the first sheet of sales_2026.xlsx
# Hint: library(readxl); read_excel("path", sheet = 1)

# Write your code below (run in local RStudio):

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
library(readxl)
ans10 <- read_excel("sales_2026.xlsx", sheet = 1)
ans10
#> # A tibble: 3 x 3
#>   region  q1    q2
#>   <chr>   <dbl> <dbl>
#> 1 North    120   150
#> 2 South    450   500
#> 3 East     330   410
```

**Explanation:** `read_excel()` auto-detects `.xls` vs `.xlsx` from the file extension, so one function covers both formats. The `sheet` argument accepts either a number (1-based index) or a sheet name as a string. Use `excel_sheets("file.xlsx")` first if you want to inspect sheet names before reading. For multi-sheet reads in one call, `purrr::map(excel_sheets(path), ~read_excel(path, sheet = .x))` returns a named list of tibbles, one per sheet.

</details>

[KEY INSIGHT]
**`readr` and `readxl` share one mental model: you describe the file, R parses it.** Whether the source is CSV, TSV, pipe-delimited, or Excel, the workflow is the same, point at the file, declare the column types you care about, and let the parser handle the rest. Learning one package teaches you most of the other.

## Common Mistakes and How to Fix Them

Three import habits that quietly break downstream analysis, with fixes you can copy.

### Mistake 1: Using base `read.csv()` instead of `read_csv()`

Bad:
```r title="Mistake: stringsAsFactors with base read.csv"
df <- read.csv(text = csv_basic, stringsAsFactors = TRUE)
str(df)
#> 'data.frame':    3 obs. of  4 variables:
#>  $ product : Factor w/ 3 levels "Keyboard","Laptop","Mouse"
#>  $ price   : num  1000 25 74.5
#>  $ qty     : int  50 200 0
#>  $ in_stock: chr  "TRUE" "TRUE" "FALSE"
```

Good:
```r title="Correct: readcsv preserves types"
df <- read_csv(csv_basic, show_col_types = FALSE)
str(df)
#> tibble [3 x 4] (S3: tbl_df/tbl/data.frame)
#>  $ product : chr  "Laptop" "Mouse" "Keyboard"
#>  $ price   : num  1000 25 74.5
#>  $ qty     : num  50 200 0
#>  $ in_stock: logi  TRUE TRUE FALSE
```

**Why it matters:** Base `read.csv()` has three historic defaults that bite: it returns a plain data frame (not a tibble), it reads `"TRUE"` as a character string instead of a logical, and pre-R 4.0 it converted every character column to a factor. `read_csv()` returns a tibble, parses logicals correctly, and never creates factors. It is also 2-10x faster on large files because its parser is written in C++.

### Mistake 2: Losing leading zeros on identifier columns

Bad:
```r title="Mistake: ZIP codes read as numeric"
read_csv(csv_zip, show_col_types = FALSE)$zipcode
#> [1] 1234  501 7008
```

Good:
```r title="Correct: ZIP codes as character"
read_csv(csv_zip,
         col_types = cols(zipcode = col_character()))$zipcode
#> [1] "01234" "00501" "07008"
```

**Why it matters:** `readr` sees digits and guesses "number". That is correct for quantities but wrong for identifiers. The fix is a one-line `col_types` override. Make it a rule: any column whose values are codes, IDs, account numbers, or phone numbers starts life as `col_character()`, regardless of what the first few rows look like.

### Mistake 3: Forgetting to declare custom NA strings

Bad:
```r title="Mistake: -999 treated as numeric"
# csv_na uses "-999" as a missing sentinel — default reader treats it as numeric
read_csv(csv_na, show_col_types = FALSE)$score
#> [1]   88   NA   NA -999   76
```

Good:
```r title="Correct: declare all NA spellings"
read_csv(csv_na,
         na = c("", "N/A", "-", "-999"),
         show_col_types = FALSE)$score
#> [1] 88 NA NA NA 76
```

**Why it matters:** Analytics code downstream (`mean()`, `sum()`, `filter()`) does not know that `-999` means missing. Leaving sentinel values in place contaminates every summary statistic. Check the data dictionary of every new source and pass every missing-value spelling to the `na` argument before you trust any calculation.

## Summary

Quick reference for each exercise and the skill it tests.

| Exercise | Skill | Key function / argument |
|---|---|---|
| 1 | Parse a standard CSV | `read_csv()` |
| 2 | Parse a non-comma delimiter | `read_delim(delim = "|")` |
| 3 | Preserve leading zeros | `col_types = cols(col_character())` |
| 4 | Handle multiple NA conventions | `na = c(...)` |
| 5 | Parse dates in MM/DD/YYYY | `col_date(format = "%m/%d/%Y")` |
| 6 | Skip metadata header lines | `skip = N` |
| 7 | Read only selected columns | `col_select` |
| 8 | Preview first N rows of a big file | `n_max = N` |
| 9 | Combine multiple CSVs | `bind_rows()` + source tag |
| 10 | Read Excel workbooks | `readxl::read_excel()` |

## FAQ

### When should I use read_csv() instead of base read.csv()?

Always, for new code. `read_csv()` is faster on large files, returns a tibble, parses logicals and dates correctly, and never silently converts strings to factors. Base `read.csv()` is fine for legacy scripts that rely on its quirks, but every new import should default to the `readr` family.

### How do I force a column to a specific type during read?

Use the `col_types` argument with `cols()`: `read_csv("file.csv", col_types = cols(id = col_character(), date = col_date("%Y-%m-%d")))`. Any column you do not mention keeps its inferred type. The compact shorthand `col_types = "cDd"` (one letter per column: `c` character, `D` date, `d` double) works when you want to override every column at once.

### What NA strings does read_csv() treat as missing by default?

Only two: an empty string (`""`) and the literal text `"NA"`. Everything else, `N/A`, `-`, `-999`, `NULL`, `None`, `#N/A`, is read as a normal value. Pass the full set to the `na` argument whenever you import data from a new source.

### How do I read a very large CSV efficiently in R?

For files over a few hundred megabytes, `data.table::fread()` is usually the fastest option and auto-detects delimiter, header, and column types. If you need a tibble, stay on `readr::read_csv()` but pre-declare `col_types` to skip type inference, and use `col_select` to drop columns you will not use. For files too large for memory, use `vroom::vroom()` (lazy column reads) or `arrow::read_csv_arrow()` (Apache Arrow backend), both of which defer I/O until you actually touch each column.

## References

1. readr documentation, `read_csv()` reference. [Link](https://readr.tidyverse.org/reference/read_delim.html)
2. readr documentation, `cols()` and column specification. [Link](https://readr.tidyverse.org/reference/cols.html)
3. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 7: Data Import. [Link](https://r4ds.hadley.nz/data-import.html)
4. Tidyverse blog, readr 2.0.0 release notes. [Link](https://www.tidyverse.org/blog/2021/07/readr-2-0-0/)
5. readxl documentation, `read_excel()` reference. [Link](https://readxl.tidyverse.org/reference/read_excel.html)
6. R Core Team, *R Data Import/Export* manual. [Link](https://cran.r-project.org/doc/manuals/r-release/R-data.html)
7. data.table documentation, `fread()` reference. [Link](https://rdatatable.gitlab.io/data.table/reference/fread.html)
8. vroom package, fast delimited file reading. [Link](https://vroom.r-lib.org/)

## Continue Learning

Now that you can import CSVs, handle column types, and combine files, build on these foundations:

- [Importing Data in R](Importing-Data-in-R.html), review the parent tutorial if any exercise stumped you
- [Tidy Data in R](Tidy-Data-in-R.html), reshape imported data into long or wide form for analysis
- [dplyr Exercises](dplyr-Exercises.html), practise the filter, select, and summarise verbs you will reach for right after an import
