---
title: "R Data Import Exercises: 17 read_csv() and fread() Practice Problems"
slug: "R-Data-Import-Exercises"
description: "Seventeen R data import exercises drilling read_csv(), col_types, NA handling, fread(), JSON, and multi-file workflows, each with a worked solution."
keywords: "R data import exercises, read_csv exercises, readr practice problems, fread exercises, col_types tutorial, NA handling R, R read_delim exercises, jsonlite R exercises"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Data Import (17 problems)"
fr_parent: "Importing-Data-in-R.html"
auto_link_terms: "r data import exercises|read_csv exercises|readr practice problems|fread exercises|col_types exercises|read_delim exercises"
auto_link_case_sensitive: false
target_keyword: "R data import exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Data Import Exercises: 17 read_csv() and fread() Practice Problems

<p class="lead">Seventeen practical exercises drill <code>read_csv()</code>, <code>read_delim()</code>, column types, missing values, fixed-width files, JSON, and multi-file imports in R. Each problem ships a runnable solution and the exact expected output so you can verify in your browser.</p>

## Introduction

Reading the readr reference page is one thing. Loading a CSV with stray metadata rows, leading-zero ZIP codes, three different spellings of "missing", and a single bad row buried in the middle is another. These 17 problems close that gap. Each one targets a specific import skill that trips real analysts on their first messy file.

You will start with straight CSV reads, then move to column-type control, NA handling, skipping garbage, non-CSV formats, and finally end-to-end multi-file workflows. All solutions run in one shared R session, so use `ans1`, `ans2`, and so on for your own attempts to avoid overwriting the setup objects.

If `read_csv()` and `col_types` are new to you, skim the parent [Importing Data in R](Importing-Data-in-R.html) tutorial first. Otherwise, run the setup block once and begin.

## Setup: Run this once before any exercise

This block loads every package used in the hub and defines the small in-memory data strings each exercise reads. Defining the data inline keeps the focus on parsing instead of file paths.

```r title="Run this once before any exercise"
library(readr)
library(dplyr)
library(jsonlite)
library(data.table)

# 1.1 / 4.3 / 5.2 / 6.1: basic product catalog
csv_products <- "product,price,qty,in_stock
Laptop,999.99,50,TRUE
Mouse,24.99,200,TRUE
Keyboard,74.50,0,FALSE"

# 1.2: pipe-delimited HR records
csv_pipe <- "name|dept|salary
Alice|Engineering|95000
Bob|Marketing|82000
Carol|Sales|68000"

# 1.3: tab-separated lab results
tsv_lab <- "patient_id\tglucose\tcholesterol
P001\t92\t180
P002\t110\t210
P003\t85\t195"

# 2.1: customers with leading-zero ZIP codes and phone numbers
csv_zip <- "name,zipcode,phone
Alice,01234,5551234567
Bob,00501,5559876543
Carol,07008,5553344556"

# 2.3: a CSV with one row that fails to parse as a number
csv_bad_rows <- "id,qty
1,10
2,many
3,30"

# 3.1: scores with four different missing-value conventions
csv_messy_na <- 'id,score,grade
1,88,A
2,N/A,B
3,,
4,-999,C
5,76,NULL'

# 3.2: a numeric vector with -999 sentinel codes
numbers_with_sentinel <- c(10, 20, -999, 30, -999, 40)

# 4.1: CSV with three metadata lines before the real header
csv_with_meta <- "Report: Quarterly Sales
Generated: 2026-03-30
---
product,q1,q2
Laptop,120,150
Mouse,450,500"

# 4.2: fixed-width records (id in cols 1-3, name in 5-14, score in 16-19)
fwf_records <- "001 Alice      88
002 Bob        76
003 Carol      92"

# 5.1: JSON payload from a marketing API
json_campaigns <- '[
  {"name": "Campaign A", "clicks": 1200, "conversions": 84},
  {"name": "Campaign B", "clicks": 980,  "conversions": 62},
  {"name": "Campaign C", "clicks": 1450, "conversions": 97}
]'

# 6.2: three monthly sales files with identical schema
csv_sales_jan <- "date,region,sales
2026-01-01,East,120
2026-01-02,West,110"
csv_sales_feb <- "date,region,sales
2026-02-01,East,130
2026-02-02,West,125"
csv_sales_mar <- "date,region,sales
2026-03-01,East,140
2026-03-02,West,135"

# 6.3: messy combined file (metadata + leading zeros + -999 sentinel)
csv_dirty <- "Daily Balance Report
Generated: 2026-05-13
account_id,name,balance
0001,Alice,1200
0002,Bob,-999
0003,Carol,850
0004,David,-999"
```

## Section 1. read_csv and friends, the staples (3 problems)

### Exercise 1.1: Read a comma-separated product catalog with read_csv

**Task:** A bookstore chain just exported a tiny product catalog as a comma-separated string named `csv_products` (defined in setup). Use `read_csv()` from readr to parse it into a tibble and inspect the column types it infers automatically. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   product   price   qty in_stock
#>   <chr>     <dbl> <dbl> <lgl>
#> 1 Laptop    1000.    50 TRUE
#> 2 Mouse       25.0  200 TRUE
#> 3 Keyboard    74.5    0 FALSE
```

**Difficulty:** Beginner

[HINTS]
The readr import family inspects the first chunk of rows and infers a type for every column on its own.
Call read_csv() with csv_products as its only argument and assign the tibble it returns.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- read_csv(csv_products)
ex_1_1
#> # A tibble: 3 x 4
#>   product   price   qty in_stock
#>   <chr>     <dbl> <dbl> <lgl>
#> 1 Laptop    1000.    50 TRUE
#> 2 Mouse       25.0  200 TRUE
#> 3 Keyboard    74.5    0 FALSE
```

**Explanation:** `read_csv()` infers each column type from the first 1000 rows: numbers become `<dbl>`, the literal strings `TRUE` and `FALSE` become `<lgl>`, and mixed text stays `<chr>`. Unlike base `read.csv()`, it never coerces strings to factors, returns a compact tibble, and is roughly 10x faster on large files. Always verify the inferred types before the analysis continues.

</details>

### Exercise 1.2: Parse a pipe-delimited file with read_delim

**Task:** Use `read_delim()` to read the `csv_pipe` string (defined in setup) which uses the `|` character as the field separator instead of a comma. The data has three columns: `name`, `dept`, and `salary`. Save the parsed tibble to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   name  dept        salary
#>   <chr> <chr>        <dbl>
#> 1 Alice Engineering  95000
#> 2 Bob   Marketing    82000
#> 3 Carol Sales        68000
```

**Difficulty:** Beginner

[HINTS]
A comma reader will not split these fields; you need the general reader where you state which character separates columns.
Use read_delim() on csv_pipe and set delim = "|".

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- read_delim(csv_pipe, delim = "|")
ex_1_2
#> # A tibble: 3 x 3
#>   name  dept        salary
#>   <chr> <chr>        <dbl>
#> 1 Alice Engineering  95000
#> 2 Bob   Marketing    82000
#> 3 Carol Sales        68000
```

**Explanation:** `read_delim()` is the general workhorse behind `read_csv()` (which fixes `delim = ","`), `read_tsv()` (fixes `delim = "\t"`), and `read_csv2()` (fixes `delim = ";"` for European locales). Specify `delim = "|"` for pipe-separated values. If your file uses an exotic separator, `read_delim()` handles it. Just make sure no quoted text contains the delimiter unescaped.

</details>

### Exercise 1.3: Read a tab-separated lab results file with read_tsv

**Task:** A lab analyst exports a small batch of lab results as tab-separated text in the `tsv_lab` string (defined in setup). The file has columns `patient_id`, `glucose`, and `cholesterol`. Use `read_tsv()` to parse it and confirm the patient ID stays as a character column. Save the parsed tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   patient_id glucose cholesterol
#>   <chr>        <dbl>       <dbl>
#> 1 P001            92         180
#> 2 P002           110         210
#> 3 P003            85         195
```

**Difficulty:** Beginner

[HINTS]
Tabs separate the fields here, so reach for the reader named after that specific format.
Call read_tsv() on tsv_lab; no extra arguments are needed.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- read_tsv(tsv_lab)
ex_1_3
#> # A tibble: 3 x 3
#>   patient_id glucose cholesterol
#>   <chr>        <dbl>       <dbl>
#> 1 P001            92         180
#> 2 P002           110         210
#> 3 P003            85         195
```

**Explanation:** `read_tsv()` is `read_delim(file, delim = "\t")` with a friendlier name. Tab-separated files are common in scientific exports because tabs rarely appear inside the data itself. The `patient_id` column correctly stays `<chr>` because `P001` is not numeric: readr picks the narrowest type that fits every value, and `P` blocks the integer coercion path.

</details>

## Section 2. Column types, the part that bites (3 problems)

### Exercise 2.1: Preserve leading-zero ZIP codes with col_types

**Task:** A retail analytics team is loading customer records that include US ZIP codes starting with leading zeros, for example `01234` and `00501`. With the default settings, `read_csv()` will silently coerce these to integers and strip the zeros. Read `csv_zip` (defined in setup) forcing `zipcode` and `phone` to character. Save the cleaned tibble to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   name  zipcode phone
#>   <chr> <chr>   <chr>
#> 1 Alice 01234   5551234567
#> 2 Bob   00501   5559876543
#> 3 Carol 07008   5553344556
```

**Difficulty:** Intermediate

[HINTS]
The default type guesser will strip the leading zeros, so you must override the inferred type for the two identifier columns.
Pass col_types = cols(zipcode = col_character(), phone = col_character()) to read_csv().

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- read_csv(
  csv_zip,
  col_types = cols(zipcode = col_character(), phone = col_character())
)
ex_2_1
#> # A tibble: 3 x 3
#>   name  zipcode phone
#>   <chr> <chr>   <chr>
#> 1 Alice 01234   5551234567
#> 2 Bob   00501   5559876543
#> 3 Carol 07008   5553344556
```

**Explanation:** `col_types` is the single most important argument in `read_csv()`. The default type guesser scans the first 1000 rows and picks the narrowest type that fits, which turns `01234` into the integer `1234`. Passing `col_types = cols(zipcode = col_character())` overrides only the columns you name; the rest still auto-detect. Phone numbers get the same treatment because leading zeros and arithmetic make no sense for identifiers.

</details>

### Exercise 2.2: Parse currency strings to numeric with parse_number

**Task:** Use `parse_number()` from readr to convert a small vector of currency strings, `c("$1,299.00", "$24.99", "$74.50")`, into clean numeric values. The function should strip the dollar sign and the thousands separator automatically. Save the resulting numeric vector to `ex_2_2`.

**Expected result:**

```
#> [1] 1299.00   24.99   74.50
```

**Difficulty:** Intermediate

[HINTS]
You need a parser that discards currency symbols and the thousands grouping mark before turning the text into numbers.
Apply parse_number() to the vector c("$1,299.00", "$24.99", "$74.50").

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- parse_number(c("$1,299.00", "$24.99", "$74.50"))
ex_2_2
#> [1] 1299.00   24.99   74.50
```

**Explanation:** `parse_number()` is forgiving by design: it strips any leading or trailing non-numeric characters and the locale grouping mark (the comma in US locale), then parses what remains. It handles values like `$1,299.00`, `45%`, or `~250 USD` without further wrangling. For per-column control inside a `read_csv()` call, use `col_number()` in the `col_types` spec instead; both share the same parser.

</details>

### Exercise 2.3: Diagnose parsing failures with problems()

**Task:** A data engineer suspects a CSV has rows that fail to parse cleanly. Read `csv_bad_rows` (defined in setup) where row 3 contains the string `"many"` instead of a number, then call `problems()` on the result to surface the failed rows. Save the resulting problems tibble to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 1 x 5
#>     row   col expected actual file
#>   <int> <int> <chr>    <chr>  <chr>
#> 1     3     2 a double many   <NA>
```

**Difficulty:** Advanced

[HINTS]
Parse failures are recorded silently, so read the file first and then ask the result which rows it could not coerce.
Run read_csv(csv_bad_rows), then call problems() on the parsed object.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
parsed <- read_csv(csv_bad_rows)
ex_2_3 <- problems(parsed)
ex_2_3
#> # A tibble: 1 x 5
#>     row   col expected actual file
#>   <int> <int> <chr>    <chr>  <chr>
#> 1     3     2 a double many   <NA>
```

**Explanation:** When `read_csv()` cannot coerce a value to its inferred type, it silently inserts `NA` and records the failure in a `problems` attribute on the result. `problems()` extracts those failures as a tibble: row index, column index, what was expected, what was actually seen, and the source file. Build the habit of calling `problems()` after every production import; parse failures are otherwise invisible.

</details>

## Section 3. Missing values, the messy part (3 problems)

### Exercise 3.1: Map multiple missing-value conventions with the na argument

**Task:** A survey researcher receives a CSV where missing scores appear as one of `N/A`, an empty cell, `-999`, or `NULL`. Use the `na` argument of `read_csv()` on `csv_messy_na` to map all four conventions to actual `NA` so that the `score` column ends up numeric instead of character. Save the cleaned tibble to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>      id score grade
#>   <dbl> <dbl> <chr>
#> 1     1    88 A
#> 2     2    NA B
#> 3     3    NA NA
#> 4     4    NA C
#> 5     5    76 NA
```

**Difficulty:** Intermediate

[HINTS]
Tell the reader, before parsing, every spelling that should count as missing so the score column lands as numeric.
Pass na = c("", "N/A", "-999", "NULL") to read_csv() on csv_messy_na.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- read_csv(
  csv_messy_na,
  na = c("", "N/A", "-999", "NULL")
)
ex_3_1
#> # A tibble: 5 x 3
#>      id score grade
#>   <dbl> <dbl> <chr>
#> 1     1    88 A
#> 2     2    NA B
#> 3     3    NA NA
#> 4     4    NA C
#> 5     5    76 NA
```

**Explanation:** By default `read_csv()` treats only `""` and `"NA"` as missing; everything else stays literal text, which corrupts the type guess. Passing a vector to `na =` tells readr to treat all of those strings as missing during parsing. The payoff is huge: `score` parses as `<dbl>` instead of being demoted to `<chr>` to accommodate the rogue `-999` and `N/A` tokens.

</details>

### Exercise 3.2: Replace sentinel codes with na_if after the read

**Task:** Sometimes you cannot change the import step. Suppose `numbers_with_sentinel` was already loaded as `c(10, 20, -999, 30, -999, 40)` so the `-999` codes look like real values. Use `dplyr::na_if()` to convert every occurrence of `-999` into `NA` and save the cleaned numeric vector to `ex_3_2`.

**Expected result:**

```
#> [1] 10 20 NA 30 NA 40
```

**Difficulty:** Intermediate

[HINTS]
The data is already loaded, so you need a post-hoc replacement that swaps one specific value for missing.
Call na_if() on numbers_with_sentinel with -999 as the second argument.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- na_if(numbers_with_sentinel, -999)
ex_3_2
#> [1] 10 20 NA 30 NA 40
```

**Explanation:** `na_if(x, y)` returns `x` with every value equal to `y` replaced by `NA`. It is vectorised, type-stable, and pipes cleanly inside `mutate()`: `mutate(score = na_if(score, -999))`. For multiple sentinel codes, chain calls or use `case_when()`. Never trust a sentinel value in arithmetic; the mean of a column containing `-999` codes is wildly wrong until you replace them.

</details>

### Exercise 3.3: Compute the completeness rate of every column

**Task:** An audit team needs a quick data-quality report showing the share of non-missing values for each column of the tibble `ex_3_1` from the previous exercise. Compute the completeness rate (1 minus the share of `NA`) per column, returning a single-row summary tibble. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>      id score grade
#>   <dbl> <dbl> <dbl>
#> 1     1   0.4   0.6
```

**Difficulty:** Intermediate

[HINTS]
For each column, the share of non-missing values is just the average of a non-missing TRUE/FALSE flag.
Apply summarise(across(everything(), ~ mean(!is.na(.x)))) to ex_3_1.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ex_3_1 |>
  summarise(across(everything(), ~ mean(!is.na(.x))))
ex_3_3
#> # A tibble: 1 x 3
#>      id score grade
#>   <dbl> <dbl> <dbl>
#> 1     1   0.4   0.6
```

**Explanation:** `mean(!is.na(.x))` is the canonical idiom for completeness: `!is.na()` returns logical `TRUE`/`FALSE`, and `mean()` averages those as 1s and 0s. `across(everything(), ...)` applies the same summary function to every column at once. The result is a one-row tibble with one column per source column, ready to plot or persist as input to a data-quality dashboard.

</details>

## Section 4. Skipping and selecting (3 problems)

### Exercise 4.1: Skip metadata header rows with the skip argument

**Task:** A reporting analyst receives a CSV that starts with three lines of metadata (report title, generation timestamp, separator) before the real header. Use `read_csv()` with the `skip` argument to ignore those three lines of `csv_with_meta` (defined in setup) and parse only the data block. Save the resulting tibble to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   product    q1    q2
#>   <chr>   <dbl> <dbl>
#> 1 Laptop    120   150
#> 2 Mouse     450   500
```

**Difficulty:** Intermediate

[HINTS]
The real header sits below several junk lines, so tell the reader how many lines to discard before it looks for column names.
Pass skip = 3 to read_csv() on csv_with_meta.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- read_csv(csv_with_meta, skip = 3)
ex_4_1
#> # A tibble: 2 x 3
#>   product    q1    q2
#>   <chr>   <dbl> <dbl>
#> 1 Laptop    120   150
#> 2 Mouse     450   500
```

**Explanation:** `skip = 3` tells readr to discard the first three lines before looking for the header. If the metadata is variable-length, read once with `skip = 0`, find the first row that looks like the real header (often by spotting a known column name), then re-read with the correct skip count. For Excel exports with banner rows, this is the single most common cleanup step.

</details>

### Exercise 4.2: Read a fixed-width file with read_fwf

**Task:** Use `read_fwf()` to parse `fwf_records` (defined in setup), a fixed-width string where columns occupy specific character positions: `id` at columns 1 to 3, `name` at columns 5 to 14, and `score` at columns 16 to 19. Use `fwf_positions()` to declare the layout and save the parsed tibble to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   id    name  score
#>   <chr> <chr> <dbl>
#> 1 001   Alice    88
#> 2 002   Bob      76
#> 3 003   Carol    92
```

**Difficulty:** Advanced

[HINTS]
There is no delimiter here; columns are defined by character positions, so you must declare where each one starts and ends.
Use read_fwf() with col_positions = fwf_positions(start, end, col_names) for the three columns.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- read_fwf(
  fwf_records,
  col_positions = fwf_positions(
    start     = c(1, 5, 16),
    end       = c(3, 14, 19),
    col_names = c("id", "name", "score")
  )
)
ex_4_2
#> # A tibble: 3 x 3
#>   id    name  score
#>   <chr> <chr> <dbl>
#> 1 001   Alice    88
#> 2 002   Bob      76
#> 3 003   Carol    92
```

**Explanation:** Fixed-width formats are still common in legacy banking, government, and mainframe exports where each column occupies a defined character range. `fwf_positions()` accepts vectors of starts, ends, and names; the alternative `fwf_widths()` uses column widths instead. `read_fwf()` strips trailing whitespace from each field by default, which keeps short values like `Bob` and `Alice` clean.

</details>

### Exercise 4.3: Read only selected columns with col_select

**Task:** Large CSVs are expensive to load when you only need a handful of columns out of dozens. Read `csv_products` but keep only the `product` and `price` columns by passing the `col_select` argument to `read_csv()`. Save the slimmer tibble to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   product  price
#>   <chr>    <dbl>
#> 1 Laptop   1000.
#> 2 Mouse      25.0
#> 3 Keyboard   74.5
```

**Difficulty:** Intermediate

[HINTS]
You can tell the reader which columns to keep so it never parses the discarded ones at all.
Pass col_select = c(product, price) to read_csv() on csv_products.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- read_csv(csv_products, col_select = c(product, price))
ex_4_3
#> # A tibble: 3 x 2
#>   product  price
#>   <chr>    <dbl>
#> 1 Laptop   1000.
#> 2 Mouse      25.0
#> 3 Keyboard   74.5
```

**Explanation:** `col_select` uses tidyselect syntax just like `dplyr::select()`, so a bare vector, a helper such as `starts_with("price_")`, a predicate like `where(is.numeric)`, or even negation with `-qty` all work. Skipping columns at the read step is faster than loading then dropping them, because readr never parses the discarded text at all. On 1GB CSVs with sparse interest, this can shave minutes.

</details>

## Section 5. Non-CSV formats (2 problems)

### Exercise 5.1: Parse a JSON API response with jsonlite

**Task:** An API returns the marketing analyst a JSON payload containing three campaign records, each carrying `name`, `clicks`, and `conversions`. Use `jsonlite::fromJSON()` on the `json_campaigns` string (defined in setup) to convert the payload into a data frame and save the result to `ex_5_1`. Confirm the numeric columns parsed as integers.

**Expected result:**

```
#>         name clicks conversions
#> 1 Campaign A   1200          84
#> 2 Campaign B    980          62
#> 3 Campaign C   1450          97
```

**Difficulty:** Intermediate

[HINTS]
A JSON array of uniformly shaped objects can be flattened straight into a data frame by the right parser.
Call jsonlite::fromJSON() on the json_campaigns string.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- jsonlite::fromJSON(json_campaigns)
ex_5_1
#>         name clicks conversions
#> 1 Campaign A   1200          84
#> 2 Campaign B    980          62
#> 3 Campaign C   1450          97
```

**Explanation:** `fromJSON()` auto-flattens a JSON array of identically-shaped objects into a base `data.frame`, inferring column types from the JSON literal types (numbers become numeric, strings character, booleans logical). For nested payloads, pass `flatten = TRUE` or `simplifyDataFrame = FALSE` and walk the resulting list. For very large APIs, use `jsonlite::stream_in()` line-by-line to avoid loading the full payload into memory.

</details>

### Exercise 5.2: Save and reload a tibble with saveRDS, preserving types

**Task:** Use base R's `saveRDS()` to serialize the `ex_1_1` tibble to a temporary file path, then call `readRDS()` on that path to bring it back. Confirm that the column types are preserved exactly (including `<lgl>` for `in_stock`, which CSV cannot round-trip). Save the round-tripped tibble to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   product   price   qty in_stock
#>   <chr>     <dbl> <dbl> <lgl>
#> 1 Laptop    1000.    50 TRUE
#> 2 Mouse       25.0  200 TRUE
#> 3 Keyboard    74.5    0 FALSE
```

**Difficulty:** Beginner

[HINTS]
To round-trip a tibble with its exact column types intact you need R's native binary format, not a text file.
Write ex_1_1 to a tempfile() with saveRDS(), then read it back with readRDS().

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tmp <- tempfile(fileext = ".rds")
saveRDS(ex_1_1, tmp)
ex_5_2 <- readRDS(tmp)
ex_5_2
#> # A tibble: 3 x 4
#>   product   price   qty in_stock
#>   <chr>     <dbl> <dbl> <lgl>
#> 1 Laptop    1000.    50 TRUE
#> 2 Mouse       25.0  200 TRUE
#> 3 Keyboard    74.5    0 FALSE
```

**Explanation:** RDS is R's native binary format. It preserves every attribute (factor levels, custom S3/S4 classes, tibble-ness) and column types exactly, which CSV cannot. Use it for intermediate caches in long analyses, never for cross-language data exchange. `saveRDS()` writes a single object; the older `save()` / `load()` pair writes named objects and pollutes the calling environment, so RDS is preferable.

</details>

## Section 6. Bigger data and end-to-end workflows (3 problems)

### Exercise 6.1: Read a CSV with data.table::fread for speed

**Task:** When import jobs scale into gigabytes, the readr family becomes a bottleneck. Use `data.table::fread()` to parse `csv_products` (a tiny string here, but the same call scales to GB files) and then convert the result to a tibble for downstream tidyverse work. Save the tibble to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   product   price   qty in_stock
#>   <chr>     <dbl> <int> <lgl>
#> 1 Laptop    1000.    50 TRUE
#> 2 Mouse       25.0  200 TRUE
#> 3 Keyboard    74.5    0 FALSE
```

**Difficulty:** Intermediate

[HINTS]
For speed at scale, use the high-performance reader, then convert its output so dplyr pipelines can consume it.
Call data.table::fread() on csv_products and pipe the result into as_tibble().

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- data.table::fread(csv_products) |> as_tibble()
ex_6_1
#> # A tibble: 3 x 4
#>   product   price   qty in_stock
#>   <chr>     <dbl> <int> <lgl>
#> 1 Laptop    1000.    50 TRUE
#> 2 Mouse       25.0  200 TRUE
#> 3 Keyboard    74.5    0 FALSE
```

**Explanation:** `fread()` is the fastest CSV reader in R: on a 1GB file it is typically 5 to 10x quicker than `read_csv()`. It auto-detects the delimiter, handles quoted fields, and uses multiple threads. It returns a `data.table`, which prints differently from a tibble but is also a `data.frame` underneath, so `as_tibble()` adapts it for dplyr pipelines. For one-off exploration use `read_csv()`; for production ETL, fread.

</details>

### Exercise 6.2: Combine three monthly sales files into one panel

**Task:** Finance receives three monthly sales CSVs (`csv_sales_jan`, `csv_sales_feb`, `csv_sales_mar`, all defined in setup) with identical schemas: `date`, `region`, and `sales`. Read each one, then row-bind them into a single tibble with a leading `month` column derived from the source name. Save the combined panel to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   month date       region sales
#>   <chr> <date>     <chr>  <dbl>
#> 1 jan   2026-01-01 East     120
#> 2 jan   2026-01-02 West     110
#> 3 feb   2026-02-01 East     130
#> 4 feb   2026-02-02 West     125
#> 5 mar   2026-03-01 East     140
#> 6 mar   2026-03-02 West     135
```

**Difficulty:** Advanced

[HINTS]
Read each file on its own, tag every set of rows with its source month, then stack the three tables into one.
Read each string with read_csv(), add the label via mutate(month = ..., .before = 1), and combine with bind_rows().

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
parts <- list(jan = csv_sales_jan, feb = csv_sales_feb, mar = csv_sales_mar)
ex_6_2 <- bind_rows(
  lapply(names(parts), function(m) {
    read_csv(parts[[m]], show_col_types = FALSE) |>
      mutate(month = m, .before = 1)
  })
)
ex_6_2
#> # A tibble: 6 x 4
#>   month date       region sales
#>   <chr> <date>     <chr>  <dbl>
#> 1 jan   2026-01-01 East     120
#> 2 jan   2026-01-02 West     110
#> 3 feb   2026-02-01 East     130
#> 4 feb   2026-02-02 West     125
#> 5 mar   2026-03-01 East     140
#> 6 mar   2026-03-02 West     135
```

**Explanation:** This pattern (read each, tag with provenance, bind) is the bread and butter of multi-file imports. `lapply()` over names lets you carry the file label into the data; `bind_rows()` stacks the resulting tibbles. For directories on disk, replace the list with `list.files(..., full.names = TRUE)` and parse the filename to derive the tag. Real ETL pipelines do exactly this hundreds of times a day.

</details>

### Exercise 6.3: Audit and clean a real-world messy CSV end-to-end

**Task:** A data steward receives `csv_dirty` (defined in setup) which combines three problems at once: two metadata lines at the top, leading-zero account numbers, and `-999` as the missing-value sentinel for `balance`. Read the file in a single `read_csv()` call by setting `skip`, `col_types`, and `na` correctly. Save the clean tibble to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   account_id name  balance
#>   <chr>      <chr>   <dbl>
#> 1 0001       Alice    1200
#> 2 0002       Bob        NA
#> 3 0003       Carol     850
#> 4 0004       David      NA
```

**Difficulty:** Advanced

[HINTS]
Three separate problems each need their own reader argument; fix the row alignment before the column types and missing values.
In one read_csv() call set skip = 2, col_types = cols(account_id = col_character()), and na = c("", "NA", "-999").

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- read_csv(
  csv_dirty,
  skip = 2,
  col_types = cols(account_id = col_character()),
  na = c("", "NA", "-999")
)
ex_6_3
#> # A tibble: 4 x 3
#>   account_id name  balance
#>   <chr>      <chr>   <dbl>
#> 1 0001       Alice    1200
#> 2 0002       Bob        NA
#> 3 0003       Carol     850
#> 4 0004       David      NA
```

**Explanation:** This single call combines three independent readr arguments. Real messy CSVs almost always present these problems together. Stage the import logic in this order: `skip` first (gets you to real data), then `col_types` (locks down the schema), then `na` (cleans missingness). Each subsequent argument depends on the previous one having corrected the row alignment first.

</details>

## What to do next

Working through these import drills sets up the next stage of any analysis pipeline. Pick the natural next layer below:

- [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html) covers the cleanup that almost always follows an import: trimming whitespace, fixing types, deduplication.
- [Missing Data in R Exercises](Missing-Data-in-R-Exercises.html) goes deeper into imputation strategies and the patterns behind `NA` once the read step is correct.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html) drills the dplyr verbs that turn clean imports into analysis-ready tibbles.
- [API Calls Exercises in R](API-Calls-Exercises-in-R.html) extends the JSON import patterns shown here to live HTTP requests with httr2 and pagination.
