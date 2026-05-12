---
title: "readr Exercises in R: 28 Real Data Import Problems"
slug: "readr-Exercises-in-R"
description: "28 readr practice problems with hidden solutions: read_csv, col_types, parse_number, locales, encoding, write_csv. Realistic data-import scenarios."
keywords: "readr exercises, read_csv R exercises, R data import practice, readr practice problems, parse_number R, col_types readr"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "readr Exercises"
sidebar_order: 115
fr_parent: "readr-vs-read-csv-vs-fread.html"
auto_link_terms: "readr exercises|read_csv exercises|data import exercises|parse_number|col_types"
auto_link_case_sensitive: false
target_keyword: "readr exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# readr Exercises in R: 28 Real Data Import Problems

<p class="lead">Twenty eight practice problems that drill the readr workflow: <code>read_csv</code>, column type specifications, custom NA handling, locale and encoding tricks, the <code>parse_*</code> helper family, writing back to disk, and diagnosing parse failures. Every problem ships with a hidden runnable solution and a short explanation.</p>

```r title="Run this once before any exercise"
library(readr)
library(dplyr)
library(tibble)
```

## Section 1. Reading the basics with read_csv (5 problems)

### Exercise 1.1: Read an inline CSV string with read_csv

**Task:** A junior analyst onboarding to the data team is testing readr without touching disk. Use `read_csv()` on the literal string `"id,score\n1,87\n2,92\n3,78"` (wrap it in `I()` so readr treats it as data rather than a path) and save the resulting tibble to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>      id score
#>   <dbl> <dbl>
#> 1     1    87
#> 2     2    92
#> 3     3    78
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- read_csv(I("id,score\n1,87\n2,92\n3,78"))
ex_1_1
#> # A tibble: 3 x 2
#>      id score
#>   <dbl> <dbl>
#> 1     1    87
#> 2     2    92
#> 3     3    78
```

**Explanation:** `read_csv()` decides between a path and literal data by inspecting the input. Wrapping the string in `I()` (the AsIs class) forces the literal interpretation and silences the deprecation warning that earlier readr versions emit for raw strings. This pattern is the cleanest way to write reproducible examples and unit tests without managing temp files.

</details>

### Exercise 1.2: Read tab-separated data with read_tsv

**Task:** A reporting analyst exported the daily KPI table from a legacy BI tool and got a tab-separated file. Recreate that scenario by passing the literal `"region\tsales\nNorth\t1200\nSouth\t950"` (with real tab characters) to `read_tsv()` via `I()` and save the parsed tibble to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   region sales
#>   <chr>  <dbl>
#> 1 North   1200
#> 2 South    950
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- read_tsv(I("region\tsales\nNorth\t1200\nSouth\t950"))
ex_1_2
#> # A tibble: 2 x 2
#>   region sales
#>   <chr>  <dbl>
#> 1 North   1200
#> 2 South    950
```

**Explanation:** `read_tsv()` is a thin convenience wrapper around `read_delim(delim = "\t")`. The `\t` escape in the literal becomes a real tab byte, so readr splits each line on tabs. If your file had spaces inside a field, you would need to quote them; tabs are unambiguous separators and rarely appear inside business strings, which is why analysts prefer TSV for hand-curated data.

</details>

### Exercise 1.3: Parse a semicolon-delimited extract with read_delim

**Task:** The finance team's ERP exports use semicolons to avoid breaking on commas inside vendor names. Use `read_delim()` with `delim = ";"` to parse `"vendor;amount\nAcme, Inc.;1500\nBeta LLC;2300"` (wrapped in `I()`) and save the tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   vendor     amount
#>   <chr>       <dbl>
#> 1 Acme, Inc.   1500
#> 2 Beta LLC     2300
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- read_delim(
  I("vendor;amount\nAcme, Inc.;1500\nBeta LLC;2300"),
  delim = ";"
)
ex_1_3
#> # A tibble: 2 x 2
#>   vendor     amount
#>   <chr>       <dbl>
#> 1 Acme, Inc.   1500
#> 2 Beta LLC     2300
```

**Explanation:** Picking the right delimiter is the most common readr failure mode in financial pipelines. Semicolons sidestep the case where commas appear inside text fields ("Acme, Inc."). `read_delim()` is the general form; `read_csv()`, `read_tsv()`, and `read_csv2()` are pre-configured shortcuts. When in doubt, peek at the raw bytes with `read_lines(path, n_max = 5)` before choosing.

</details>

### Exercise 1.4: Read a European-style CSV with read_csv2

**Task:** A climatologist in Berlin exported station readings using comma as the decimal mark and semicolon as the column separator (the Excel German default). Use `read_csv2()` on `"station;temp_c\nA;12,4\nB;15,7"` (wrapped in `I()`) and save the parsed tibble to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   station temp_c
#>   <chr>    <dbl>
#> 1 A         12.4
#> 2 B         15.7
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- read_csv2(I("station;temp_c\nA;12,4\nB;15,7"))
ex_1_4
#> # A tibble: 2 x 2
#>   station temp_c
#>   <chr>    <dbl>
#> 1 A         12.4
#> 2 B         15.7
```

**Explanation:** `read_csv2()` ships with a locale that sets `decimal_mark = ","` and `grouping_mark = "."`, plus the semicolon separator. Without it, `12,4` would land as the string "12,4" or trigger parse failures. The same result could be achieved with `read_delim(delim = ";", locale = locale(decimal_mark = ","))` but the `_csv2` shortcut is the idiomatic European import.

</details>

### Exercise 1.5: Round-trip mtcars through a tempfile

**Task:** Validate that a write-then-read cycle preserves data by writing `mtcars` to a temp file with `write_csv()`, reading it back with `read_csv()`, and saving the re-read tibble (just the first 3 rows) to `ex_1_5`. Use `tempfile()` so nothing pollutes your working directory.

**Expected result:**

```
#> # A tibble: 3 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2  21       6   160   110  3.9   2.88  17.0     0     1     4     4
#> 3  22.8     4   108    93  3.85  2.32  18.6     1     1     4     1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tf <- tempfile(fileext = ".csv")
write_csv(mtcars, tf)
ex_1_5 <- read_csv(tf, show_col_types = FALSE) |> head(3)
ex_1_5
```

**Explanation:** `write_csv()` drops row names, which is why the model names ("Mazda RX4") are not present in the round trip. If you need them, call `tibble::rownames_to_column()` before writing. `tempfile()` returns a path under the session temp directory that is cleaned up when R exits, making it safe for experiments and CI tests.

</details>

## Section 2. Column types and the cols() spec (5 problems)

### Exercise 2.1: Specify explicit column types with cols

**Task:** A data engineer wants to lock the schema for a partner extract so a stray text value cannot silently flip a column to character. Read `"id,amount\n1,100\n2,250"` (wrapped in `I()`) with `read_csv()` and a `col_types = cols(id = col_integer(), amount = col_double())` spec, saving the result to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>      id amount
#>   <int>  <dbl>
#> 1     1    100
#> 2     2    250
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- read_csv(
  I("id,amount\n1,100\n2,250"),
  col_types = cols(
    id     = col_integer(),
    amount = col_double()
  )
)
ex_2_1
#> # A tibble: 2 x 2
#>      id amount
#>   <int>  <dbl>
#> 1     1    100
#> 2     2    250
```

**Explanation:** Without an explicit spec, readr guesses types from the first 1000 rows. Guessing is convenient interactively, but brittle in pipelines where a partner might insert "N/A" on row 1001 and break downstream code. Locking types with `cols()` makes the schema part of your code review surface; a violation becomes a parsing warning you can catch with `problems()`.

</details>

### Exercise 2.2: Force a numeric-looking ID to character

**Task:** Customer IDs in the CRM extract are 10-digit numbers, but you must keep leading zeros for join keys to match. Read `"cust_id,total\n0012345,500\n0098761,300"` (wrapped in `I()`) and force `cust_id` to character with `col_types = cols(cust_id = col_character())`. Save the tibble to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   cust_id  total
#>   <chr>    <dbl>
#> 1 0012345    500
#> 2 0098761    300
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- read_csv(
  I("cust_id,total\n0012345,500\n0098761,300"),
  col_types = cols(cust_id = col_character())
)
ex_2_2
#> # A tibble: 2 x 2
#>   cust_id  total
#>   <chr>    <dbl>
#> 1 0012345    500
#> 2 0098761    300
```

**Explanation:** This is the single most common readr footgun in production code. Guessing turns `0012345` into the number 12345 and silently breaks every downstream join against a string key. The fix is a one-line `col_character()` override. Pin the column type any time the field is conceptually an identifier (zip codes, phone numbers, account IDs) even if the source data looks numeric.

</details>

### Exercise 2.3: Parse a date column with col_date and a format

**Task:** A retail ops analyst gets daily inventory exports with dates formatted as `dd/mm/yyyy`. Read `"sku,sold_on\nA1,03/04/2026\nA2,12/04/2026"` (wrapped in `I()`) and pass `col_types = cols(sold_on = col_date(format = "%d/%m/%Y"))` so the column lands as `Date`. Save to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   sku   sold_on
#>   <chr> <date>
#> 1 A1    2026-04-03
#> 2 A2    2026-04-12
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- read_csv(
  I("sku,sold_on\nA1,03/04/2026\nA2,12/04/2026"),
  col_types = cols(sold_on = col_date(format = "%d/%m/%Y"))
)
ex_2_3
#> # A tibble: 2 x 2
#>   sku   sold_on
#>   <chr> <date>
#> 1 A1    2026-04-03
#> 2 A2    2026-04-12
```

**Explanation:** Day-first formats are the rule across most of Europe and the Commonwealth, and readr does not guess them. Always pass an explicit `format` string when the source is ambiguous: `%d/%m/%Y` is unambiguous, `"03/04/2026"` is not. Skipping this step is the single most common cause of off-by-month bugs in cross-region reporting.

</details>

### Exercise 2.4: Drop unwanted columns with col_skip

**Task:** A privacy-conscious workflow needs to ingest a customer file but strip the email address at parse time so it never lives in memory. Read `"id,name,email,amount\n1,Ann,a@x.com,40\n2,Bob,b@y.com,55"` (wrapped in `I()`) and use `col_types = cols(email = col_skip())` to drop that column. Save the tibble to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 2 x 3
#>      id name  amount
#>   <dbl> <chr>  <dbl>
#> 1     1 Ann       40
#> 2     2 Bob       55
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- read_csv(
  I("id,name,email,amount\n1,Ann,a@x.com,40\n2,Bob,b@y.com,55"),
  col_types = cols(email = col_skip())
)
ex_2_4
#> # A tibble: 2 x 3
#>      id name  amount
#>   <dbl> <chr>  <dbl>
#> 1     1 Ann       40
#> 2     2 Bob       55
```

**Explanation:** `col_skip()` is cheaper than reading and then dropping with `select(-email)` because readr never allocates the column or parses its values. For wide files (think 200-column survey exports where you only care about 8 columns) this can be a 10x speedup. Pair it with `cols_only(...)` to flip the default from "read all" to "read these only".

</details>

### Exercise 2.5: Suppress the type message with show_col_types

**Task:** When automating reports, the column-type message printed by `read_csv()` pollutes the log output. Read `"x,y\n1,2\n3,4"` (wrapped in `I()`) and pass `show_col_types = FALSE` so the message is suppressed. Save the resulting tibble to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>       x     y
#>   <dbl> <dbl>
#> 1     1     2
#> 2     3     4
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- read_csv(I("x,y\n1,2\n3,4"), show_col_types = FALSE)
ex_2_5
#> # A tibble: 2 x 2
#>       x     y
#>   <dbl> <dbl>
#> 1     1     2
#> 2     3     4
```

**Explanation:** The default-on message is helpful when you are exploring, but noisy in batch jobs and Quarto documents. The safer alternative is to set an explicit `col_types` (which also suppresses the message) so readers can see the intended schema. Use `show_col_types = FALSE` only when you have already locked types or genuinely do not care.

</details>

## Section 3. Missing values, comments, and slicing (5 problems)

### Exercise 3.1: Treat a custom token as NA

**Task:** The marketing team's vendor exports use the literal string `"N/A"` to mean missing instead of an empty field. Read `"campaign,clicks\nA,150\nB,N/A\nC,275"` (wrapped in `I()`) with `na = "N/A"` so the missing value becomes a real `NA_real_`, and save the tibble to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   campaign clicks
#>   <chr>     <dbl>
#> 1 A           150
#> 2 B            NA
#> 3 C           275
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- read_csv(
  I("campaign,clicks\nA,150\nB,N/A\nC,275"),
  na = "N/A"
)
ex_3_1
#> # A tibble: 3 x 2
#>   campaign clicks
#>   <chr>     <dbl>
#> 1 A           150
#> 2 B            NA
#> 3 C           275
```

**Explanation:** Without the `na` argument, the literal "N/A" would force the entire column to character (since "N/A" cannot be coerced to double). The result is a column where you can no longer compute sums or averages until you find and replace the sentinel. Declaring `na = "N/A"` up front is faster than a post-hoc `mutate(clicks = na_if(clicks, "N/A"))` plus a re-parse.

</details>

### Exercise 3.2: Treat multiple sentinels as NA in one pass

**Task:** A legacy clinical export uses three different missing markers: empty string, `"."` (SAS convention), and `"NULL"` (database convention). Read `"patient_id,bp\n1,120\n2,.\n3,\n4,NULL\n5,135"` (wrapped in `I()`) with `na = c("", ".", "NULL")`, and save the tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   patient_id    bp
#>        <dbl> <dbl>
#> 1          1   120
#> 2          2    NA
#> 3          3    NA
#> 4          4    NA
#> 5          5   135
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- read_csv(
  I("patient_id,bp\n1,120\n2,.\n3,\n4,NULL\n5,135"),
  na = c("", ".", "NULL")
)
ex_3_2
#> # A tibble: 5 x 2
#>   patient_id    bp
#>        <dbl> <dbl>
#> 1          1   120
#> 2          2    NA
#> 3          3    NA
#> 4          4    NA
#> 5          5   135
```

**Explanation:** The `na` argument accepts a character vector and applies each entry across every column. If different columns need different missing markers, you must use `col_types` with per-column `col_double(na = ...)` instead. Always inspect the raw bytes (`read_lines(file, n_max = 20)`) before importing data from systems you do not control: every team invents its own sentinel.

</details>

### Exercise 3.3: Skip metadata rows at the top of the file

**Task:** Lab instruments often write three header rows (timestamp, instrument ID, operator) before the real CSV header. Read `"# generated 2026-04-12\n# instrument: GC-2010\n# operator: K\nsample,reading\nS1,3.4\nS2,4.1"` (wrapped in `I()`) with `skip = 3`, and save the tibble to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   sample reading
#>   <chr>    <dbl>
#> 1 S1         3.4
#> 2 S2         4.1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- read_csv(
  I("# generated 2026-04-12\n# instrument: GC-2010\n# operator: K\nsample,reading\nS1,3.4\nS2,4.1"),
  skip = 3
)
ex_3_3
#> # A tibble: 2 x 2
#>   sample reading
#>   <chr>    <dbl>
#> 1 S1         3.4
#> 2 S2         4.1
```

**Explanation:** `skip` is the right tool when the metadata count is fixed and known. If the count varies per file, you have two options: use `comment = "#"` to drop any line starting with that character (next exercise), or read with `read_lines()`, filter the metadata rows yourself, and pass the cleaned vector back to `read_csv()`. Choose `skip` for stability, `comment` for flexibility.

</details>

### Exercise 3.4: Drop comment lines starting with #

**Task:** A meteorologist's automated logger interleaves comment lines (starting with `#`) between data rows whenever the sensor recalibrates. Read `"station,reading\nA,12.4\n# recalibration at 09:14\nA,12.6\nB,11.0"` (wrapped in `I()`) with `comment = "#"` so the recalibration note is dropped, and save the tibble to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   station reading
#>   <chr>     <dbl>
#> 1 A          12.4
#> 2 A          12.6
#> 3 B          11.0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- read_csv(
  I("station,reading\nA,12.4\n# recalibration at 09:14\nA,12.6\nB,11.0"),
  comment = "#"
)
ex_3_4
#> # A tibble: 3 x 2
#>   station reading
#>   <chr>     <dbl>
#> 1 A          12.4
#> 2 A          12.6
#> 3 B          11.0
```

**Explanation:** `comment` is line-based, not row-based: any line whose first non-whitespace character matches the comment string is dropped entirely. This is more forgiving than `skip` because it works anywhere in the file, not just at the top. It will not handle inline trailing comments ("`12.4 # noted`"); for those you need to read into a character column and strip the trailing portion manually.

</details>

### Exercise 3.5: Read only the first 5 rows with n_max

**Task:** Before launching a full import of a 10-million-row file, you want a fast preview to confirm the schema. Build a 20-row CSV with `format_csv(head(diamonds, 20))`, feed it to `read_csv()` via `I()` with `n_max = 5`, and save the 5-row tibble to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 5 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <chr>     <chr> <chr>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43
#> 2  0.21 Premium   E     SI1      59.8    61   326  3.89  3.84  2.31
#> 3  0.23 Good      E     VS1      56.9    65   327  4.05  4.07  2.31
#> 4  0.29 Premium   I     VS2      62.4    58   334  4.2   4.23  2.63
#> 5  0.31 Good      J     SI2      63.3    58   335  4.34  4.35  2.75
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
preview_csv <- format_csv(head(diamonds, 20))
ex_3_5 <- read_csv(I(preview_csv), n_max = 5, show_col_types = FALSE)
ex_3_5
```

**Explanation:** `n_max` is the right lever for a fast preview because readr stops reading after `n_max` data rows and never allocates memory for the rest of the file. The factor columns of `diamonds` (`cut`, `color`, `clarity`) come back as character here because readr does not know their level ordering: serializing through CSV always strips factor metadata, which is why parquet or `qs` is preferred for round-trips of typed data.

</details>

## Section 4. Parsing helpers for vectors (5 problems)

### Exercise 4.1: Strip currency symbols with parse_number

**Task:** A finance analyst pasted invoice totals from a PDF into a CSV column and ended up with strings like `"$1,234.50"`. Use `parse_number()` on the vector `c("$1,234.50", "$899.00", "$2,500.75")` to extract clean doubles, and save the numeric result to `ex_4_1`.

**Expected result:**

```
#> [1] 1234.50  899.00 2500.75
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- parse_number(c("$1,234.50", "$899.00", "$2,500.75"))
ex_4_1
#> [1] 1234.50  899.00 2500.75
```

**Explanation:** `parse_number()` is the swiss army knife for "this looks numeric but has noise": it strips currency symbols, percent signs, grouping marks, and arbitrary surrounding text. It is safer than a custom `gsub()` chain because it respects the active locale (next exercise) and reports per-element parse failures through `problems()`. Reach for it whenever upstream data was hand-edited or copy-pasted.

</details>

### Exercise 4.2: Parse percentages stored as strings

**Task:** A campaign export from the ad platform stores click-through rates as strings with trailing percent signs, e.g. `c("3.5%", "2.8%", "4.1%")`. Use `parse_number()` to extract the numeric portion (you get a percentage point value, not a fraction), and save the result to `ex_4_2`.

**Expected result:**

```
#> [1] 3.5 2.8 4.1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- parse_number(c("3.5%", "2.8%", "4.1%"))
ex_4_2
#> [1] 3.5 2.8 4.1
```

**Explanation:** `parse_number()` strips the trailing `%` but does NOT divide by 100, so the result is "percentage points" not a fraction. If the downstream math expects a fraction (for example multiplying impressions by CTR), you must divide explicitly: `parse_number(x) / 100`. The lack of automatic division is intentional: readr refuses to assume what unit you wanted.

</details>

### Exercise 4.3: Parse dates with a custom format

**Task:** Quarterly board reports use `"Apr 12, 2026"` style dates (month-name first, US convention). Use `parse_date()` on the vector `c("Apr 12, 2026", "May 03, 2026", "Jun 21, 2026")` with `format = "%b %d, %Y"`, and save the resulting `Date` vector to `ex_4_3`.

**Expected result:**

```
#> [1] "2026-04-12" "2026-05-03" "2026-06-21"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- parse_date(
  c("Apr 12, 2026", "May 03, 2026", "Jun 21, 2026"),
  format = "%b %d, %Y"
)
ex_4_3
#> [1] "2026-04-12" "2026-05-03" "2026-06-21"
```

**Explanation:** `%b` matches abbreviated month names in the locale's language; `%B` matches full names. The default locale is English, so "Apr" works without further config. For non-English month names (next section), you must pass `locale = locale(date_names = "fr")` or similar. `parse_date()` returns `NA` for any unparseable element and routes the failure through `problems()` rather than crashing.

</details>

### Exercise 4.4: Parse datetimes with timezone offsets

**Task:** Server logs from a global SaaS app include explicit UTC offsets, e.g. `"2026-04-12T14:30:00+05:30"`. Use `parse_datetime()` on the vector `c("2026-04-12T14:30:00+05:30", "2026-04-12T22:00:00-04:00")` (the default ISO 8601 format handles offsets) and save the resulting `POSIXct` vector (printed in UTC) to `ex_4_4`.

**Expected result:**

```
#> [1] "2026-04-12 09:00:00 UTC" "2026-04-13 02:00:00 UTC"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- parse_datetime(
  c("2026-04-12T14:30:00+05:30", "2026-04-12T22:00:00-04:00")
)
ex_4_4
#> [1] "2026-04-12 09:00:00 UTC" "2026-04-13 02:00:00 UTC"
```

**Explanation:** ISO 8601 with explicit offset is the only timezone-safe format for distributed logs. `parse_datetime()` interprets the offset, normalizes every value to UTC internally, and prints in UTC by default. The first value (14:30 IST, which is UTC+5:30) becomes 09:00 UTC; the second (22:00 EDT, UTC-4) becomes 02:00 UTC the next day. Never store local times without an offset in audit logs.

</details>

### Exercise 4.5: Build an ordered factor with parse_factor

**Task:** A satisfaction survey collects responses on a Likert scale where the order matters for ordinal modeling. Use `parse_factor()` on `c("medium", "low", "high", "low", "high")` with `levels = c("low", "medium", "high")` so the factor preserves the survey ordering, and save the resulting factor to `ex_4_5`.

**Expected result:**

```
#> [1] medium low    high   low    high
#> Levels: low medium high
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- parse_factor(
  c("medium", "low", "high", "low", "high"),
  levels = c("low", "medium", "high")
)
ex_4_5
#> [1] medium low    high   low    high
#> Levels: low medium high
```

**Explanation:** `parse_factor()` differs from `factor()` in two ways. First, it raises a parse problem (visible via `problems()`) for any value not in `levels`, rather than silently turning it into `NA`. Second, it respects readr's locale machinery, so it composes with the rest of your import. Pass `ordered = TRUE` if downstream code needs an ordered factor that supports `<` and `>` comparisons.

</details>

## Section 5. Locales and encoding (4 problems)

### Exercise 5.1: Read European decimals with a custom locale

**Task:** A French utility shares meter readings with comma as the decimal mark and no grouping mark. Use `parse_double()` on the vector `c("12,345", "0,789", "3,14")` with `locale = locale(decimal_mark = ",")` so each string becomes the right double, and save the numeric result to `ex_5_1`.

**Expected result:**

```
#> [1] 12.345  0.789  3.140
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- parse_double(
  c("12,345", "0,789", "3,14"),
  locale = locale(decimal_mark = ",")
)
ex_5_1
#> [1] 12.345  0.789  3.140
```

**Explanation:** Note the subtle trap: `"12,345"` with `decimal_mark = ","` parses to 12.345 (twelve point three four five), NOT 12345. Locale choice is destiny here. If the source mixes thousands-grouped values like `"12.345,67"` (twelve thousand three hundred forty five point six seven) you must also set `grouping_mark = "."` so readr knows the dot is grouping, not decimal.

</details>

### Exercise 5.2: Strip a non-comma grouping mark from amounts

**Task:** Swiss financial statements format CHF amounts with apostrophes as grouping marks, e.g. `"1'234'567.50"`. Use `parse_number()` on the vector `c("1'234'567.50", "987'654.00", "12'345.67")` with `locale = locale(grouping_mark = "'")`, and save the result to `ex_5_2`.

**Expected result:**

```
#> [1] 1234567.50  987654.00   12345.67
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- parse_number(
  c("1'234'567.50", "987'654.00", "12'345.67"),
  locale = locale(grouping_mark = "'")
)
ex_5_2
#> [1] 1234567.50  987654.00   12345.67
```

**Explanation:** Switzerland is one of a handful of locales that use the apostrophe as a thousands grouping mark; you cannot rely on readr's defaults. Once the locale is set, `parse_number()` strips the apostrophes and parses the remainder as US-style decimals. If the file used commas for decimals as well, you would also pass `decimal_mark = ","` (a Swiss French convention) instead of letting the dot win.

</details>

### Exercise 5.3: Parse French month-name dates with a locale

**Task:** A travel-tech startup imports booking confirmations in French where dates look like `"12 avril 2026"`. Use `parse_date()` on the vector `c("12 avril 2026", "03 mai 2026", "21 juin 2026")` with `format = "%d %B %Y"` and `locale = locale(date_names = "fr")`, saving the resulting `Date` vector to `ex_5_3`.

**Expected result:**

```
#> [1] "2026-04-12" "2026-05-03" "2026-06-21"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- parse_date(
  c("12 avril 2026", "03 mai 2026", "21 juin 2026"),
  format = "%d %B %Y",
  locale = locale(date_names = "fr")
)
ex_5_3
#> [1] "2026-04-12" "2026-05-03" "2026-06-21"
```

**Explanation:** `locale(date_names = "fr")` rewires the month-name table from English to French, so `%B` now matches "avril", "mai", "juin". The full list of supported language codes is in `date_names_lang("en")` (and friends). Without the locale tweak, you would get a vector of `NA` values plus a `problems()` entry on every row. For mixed-language sources, parse each chunk separately and combine.

</details>

### Exercise 5.4: Decode a latin1 source to UTF-8 with locale

**Task:** A regional reseller in Lisbon sends product catalogs encoded as latin1 (a common Windows export). Build the raw bytes with `iconv("Café", to = "latin1", toRaw = TRUE)[[1]]`, write them to a tempfile in binary mode, then call `read_csv(tf, locale = locale(encoding = "latin1"))` to read it back correctly. Save the parsed tibble to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 1 x 1
#>   name
#>   <chr>
#> 1 Cafe (accented e shown as e with acute)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
header <- charToRaw("name\n")
payload <- iconv("Café", to = "latin1", toRaw = TRUE)[[1]]
tf <- tempfile(fileext = ".csv")
writeBin(c(header, payload, charToRaw("\n")), tf)
ex_5_4 <- read_csv(tf, locale = locale(encoding = "latin1"), show_col_types = FALSE)
ex_5_4
#> # A tibble: 1 x 1
#>   name
#>   <chr>
#> 1 Cafe
```

**Explanation:** When the source bytes are not UTF-8, readr's default decoder produces mojibake (a literal "C", "a", "f", followed by `0xe9` rendered as a replacement glyph). Setting `locale(encoding = "latin1")` tells readr to transcode each byte from latin1 to UTF-8 on the way in, so the result is a clean R character string. Always inspect with `read_lines_raw()` first if you suspect an encoding problem.

</details>

## Section 6. Writing data and diagnosing problems (4 problems)

### Exercise 6.1: Write a CSV with a custom NA marker

**Task:** An audit team needs CSV deliverables where missing numeric values are written as the literal `"NA_VAL"` (their toolchain rejects empty fields). Build a small tibble with `tibble(id = 1:3, amount = c(100, NA, 250))`, write it to a tempfile with `write_csv(... , na = "NA_VAL")`, then read the file back as plain text with `read_lines()` and save the character vector of lines to `ex_6_1`.

**Expected result:**

```
#> [1] "id,amount"  "1,100"      "2,NA_VAL"   "3,250"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- tibble(id = 1:3, amount = c(100, NA, 250))
tf <- tempfile(fileext = ".csv")
write_csv(df, tf, na = "NA_VAL")
ex_6_1 <- read_lines(tf)
ex_6_1
#> [1] "id,amount"  "1,100"      "2,NA_VAL"   "3,250"
```

**Explanation:** The default `na = ""` writes empty fields, which round-trips through readr cleanly but breaks some downstream consumers (early SAS pipelines, certain Excel imports). Always negotiate the NA sentinel with the receiving team before delivering files. Reading back with `read_lines()` instead of `read_csv()` is the right verification step because it shows you the exact bytes on disk, sentinels and all.

</details>

### Exercise 6.2: Pick write_excel_csv when the consumer is Excel

**Task:** A non-technical stakeholder will open your file in Excel and complain about accented characters showing up as garbage. Build `tibble(city = c("Sao Paulo", "Munchen"))`, write it once with `write_csv()` to a tempfile, again with `write_excel_csv()` to a second tempfile, and save a length-2 character vector with the first byte of each file (as hex) to `ex_6_2` so you can prove the BOM is only in the second one.

**Expected result:**

```
#> [1] "73"     "efbbbf"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- tibble(city = c("Sao Paulo", "Munchen"))
tf1 <- tempfile(fileext = ".csv")
tf2 <- tempfile(fileext = ".csv")
write_csv(df, tf1)
write_excel_csv(df, tf2)

bytes1 <- readBin(tf1, what = "raw", n = 3)
bytes2 <- readBin(tf2, what = "raw", n = 3)
ex_6_2 <- c(
  paste(bytes1[1], collapse = ""),
  paste(bytes2, collapse = "")
)
ex_6_2
#> [1] "73"     "efbbbf"
```

**Explanation:** `write_excel_csv()` prepends the UTF-8 byte-order mark (`ef bb bf`) so Excel auto-detects the encoding and renders accented characters correctly. Plain `write_csv()` produces strict UTF-8 without the BOM, which is the right answer for every consumer EXCEPT Excel on Windows. If your stakeholder will open the file in Excel, default to `write_excel_csv()`; otherwise stay with `write_csv()` for cleaner downstream parsing.

</details>

### Exercise 6.3: Capture parse failures with problems

**Task:** A risk analyst is running a daily import and needs to flag rows that failed to parse so the data steward can fix the source. Read `"id,value\n1,3.14\n2,not_a_number\n3,2.71"` (wrapped in `I()`) with `col_types = cols(value = col_double())`, then call `problems()` on the result, and save the diagnostics tibble to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 1 x 5
#>     row   col expected actual       file
#>   <int> <int> <chr>    <chr>        <chr>
#> 1     2     2 a double not_a_number ""
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- read_csv(
  I("id,value\n1,3.14\n2,not_a_number\n3,2.71"),
  col_types = cols(value = col_double())
)
ex_6_3 <- problems(res)
ex_6_3
#> # A tibble: 1 x 5
#>     row   col expected actual       file
#>   <int> <int> <chr>    <chr>        <chr>
#> 1     2     2 a double not_a_number ""
```

**Explanation:** Parse problems are attached as an attribute to the returned tibble; `problems()` extracts them for inspection. The offending row is replaced with `NA` in the data so downstream code keeps running. In production pipelines, log `nrow(problems(res))` as a metric and alert when it exceeds your threshold. That single check catches 90 percent of upstream schema drift before it becomes a wrong dashboard.

</details>

### Exercise 6.4: Stream a large file with read_csv_chunked

**Task:** A platform engineer needs to compute a running sum over a million-row export without loading the full file into memory. Simulate it with `format_csv(tibble(x = 1:100))` fed via `I()` to `read_csv_chunked()` using a `SideEffectChunkCallback` that appends each chunk sum to an accumulator, and save the final per-chunk sums vector to `ex_6_4`.

**Expected result:**

```
#> [1] 1275 3775 6275 8775 (with chunk_size = 25, four chunks)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
big_csv <- format_csv(tibble(x = 1:100))

sums <- c()
cb <- SideEffectChunkCallback$new(function(chunk, pos) {
  sums <<- c(sums, sum(chunk$x))
})

read_csv_chunked(
  I(big_csv),
  callback = cb,
  chunk_size = 25,
  col_types = cols(x = col_double())
)

ex_6_4 <- sums
ex_6_4
#> [1]  325  950 1575 2200
```

**Explanation:** `read_csv_chunked()` is the streaming sibling of `read_csv()`: it parses the file in chunks of `chunk_size` rows and applies your callback to each one. The `SideEffectChunkCallback` is for callbacks that mutate external state (here the `sums` vector via `<<-`); `DataFrameCallback` is for callbacks that return tibbles and want them auto-row-bound. Use chunked reads when memory is tight or when you want to start computing before the file finishes downloading.

</details>

## What to do next

You now have repetitions across the full readr surface: parsing, locales, encoding, writing, and diagnostics. Extend the practice with these neighbouring drills:

- [data.table Exercises in R](data.table-Exercises-in-R.html) for the higher-performance import path with `fread()`.
- [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html) for the post-import wrangling pipeline.
- [lubridate Exercises in R](lubridate-Exercises-in-R.html) to deepen date and datetime handling after the readr parse step.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) for the tidy verbs you will reach for once the file is in memory.
