---
title: "R for Data Science Exercises: 50 R4DS Practice Problems"
slug: "R-for-Data-Science-Exercises"
description: "50 hands-on R for data science exercises covering import, tidy, transform, visualize, model, and communicate. Hidden solutions, real R4DS workflow."
keywords: "R for data science exercises, R4DS practice, tidyverse exercises, R data science problems, tidyverse practice problems"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "R for Data Science Exercises"
sidebar_order: 105
fr_parent: "R-for-Data-Science.html"
auto_link_terms: "r for data science exercises|r4ds practice|tidyverse exercises|r data science problems|tidyverse practice"
auto_link_case_sensitive: false
target_keyword: "R for data science exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R for Data Science Exercises: 50 R4DS Practice Problems

<p class="lead">Fifty graded problems walking the full R4DS pipeline: import, tidy, transform, visualize, model, and communicate. Each problem states the task, the expected output, and a hidden solution. Click to reveal once you have your own answer.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(readr)
library(tibble)
library(ggplot2)
library(scales)
library(lubridate)
library(stringr)
library(forcats)
library(broom)
library(knitr)

set.seed(2026)
```

---

## Section 1. Importing and inspecting data (6 problems)

### Exercise 1.1: Read a CSV from a string with read_csv

**Task:** A data engineer is prototyping an ingestion pipeline and wants to test parsing logic without touching the filesystem. Read the inline CSV string below using `read_csv()` and save the tibble to `ex_1_1`. Use the `I()` wrapper or pass the string directly.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   id    name    score
#>   <chr> <chr>   <dbl>
#> 1 A001  Alice    91.2
#> 2 A002  Bilal    74.5
#> 3 A003  Chinwe   88.0
```

**Difficulty:** Beginner

[HINTS]
Treat the multi-line string just as you would a file - the importer reads text connections directly, so no temp file is needed.
Call read_csv() on csv_text and add show_col_types = FALSE to silence the column-spec message.

```r title="Your turn"
csv_text <- "id,name,score
A001,Alice,91.2
A002,Bilal,74.5
A003,Chinwe,88.0"

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
csv_text <- "id,name,score
A001,Alice,91.2
A002,Bilal,74.5
A003,Chinwe,88.0"

ex_1_1 <- read_csv(csv_text, show_col_types = FALSE)
ex_1_1
#> # A tibble: 3 x 3
#>   id    name    score
#>   <chr> <chr>   <dbl>
#> 1 A001  Alice    91.2
#> 2 A002  Bilal    74.5
#> 3 A003  Chinwe   88.0
```

**Explanation:** `read_csv()` happily accepts a string containing newlines as if it were a file connection, which is invaluable for unit tests and reproducible examples. The `show_col_types = FALSE` argument suppresses the column-spec message that would otherwise clutter the output. For tabs use `read_tsv()`, and for any other delimiter use `read_delim(delim = ...)`.

</details>

### Exercise 1.2: Inspect mtcars with glimpse

**Task:** Use `glimpse()` from dplyr to print a transposed summary of the built-in `mtcars` dataset that shows every column with its type and first few values. Save the original dataset to `ex_1_2` and then call `glimpse(ex_1_2)`.

**Expected result:**

```
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, ...
#> $ cyl  <dbl> 6, 6, 4, 6, 8, 8, 8, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, 4, ...
#> $ disp <dbl> 160.0, 160.0, 108.0, 258.0, 360.0, 225.0, 360.0, 146.7, ...
#> ... 8 more columns
```

**Difficulty:** Beginner

[HINTS]
First copy the dataset into the target name, then ask for a transposed, column-by-column overview.
Assign mtcars to ex_1_2; the glimpse() call is already written for you.

```r title="Your turn"
ex_1_2 <- # your code here
glimpse(ex_1_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mtcars
glimpse(ex_1_2)
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, ...
#> $ cyl  <dbl> 6, 6, 4, 6, 8, 8, 8, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, 4, ...
#> $ disp <dbl> 160.0, 160.0, 108.0, 258.0, 360.0, 225.0, 360.0, 146.7, ...
```

**Explanation:** `glimpse()` rotates the usual `print()` view 90 degrees so every column becomes a row, which is the right shape for wide tables. It is the first call most R4DS practitioners reach for after `read_csv()`. Compare with `str()`, which has the same goal but a noisier display, and `summary()`, which gives quantile statistics instead of types.

</details>

### Exercise 1.3: Convert a data.frame to a tibble

**Task:** A junior analyst inherits a script that uses base-R data frames and wants every result to print as a tibble. Convert `airquality` to a tibble with `as_tibble()` and save it to `ex_1_3`. Then print just the first three rows to confirm the type marker `<tibble>`.

**Expected result:**

```
#> # A tibble: 3 x 6
#>   Ozone Solar.R  Wind  Temp Month   Day
#>   <int>   <int> <dbl> <int> <int> <int>
#> 1    41     190   7.4    67     5     1
#> 2    36     118   8       72    5     2
#> 3    12     149  12.6    74     5     3
```

**Difficulty:** Beginner

[HINTS]
You need a lossless conversion from a base data frame into the modern table type that prints compactly.
Wrap airquality in as_tibble(); the head(ex_1_3, 3) line is already provided.

```r title="Your turn"
ex_1_3 <- # your code here
head(ex_1_3, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- as_tibble(airquality)
head(ex_1_3, 3)
#> # A tibble: 3 x 6
#>   Ozone Solar.R  Wind  Temp Month   Day
#>   <int>   <int> <dbl> <int> <int> <int>
#> 1    41     190   7.4    67     5     1
#> 2    36     118   8       72    5     2
#> 3    12     149  12.6    74     5     3
```

**Explanation:** Tibbles are data frames with three behavioural tweaks that matter in production code: they never partial-match column names, they never coerce strings to factors, and they print only the first ten rows by default so a console session does not vanish behind a 10,000-row dump. `as_tibble()` is the lossless conversion; the reverse trip is `as.data.frame()`.

</details>

### Exercise 1.4: Spot parsing problems on a messy CSV

**Task:** An ops engineer suspects a vendor feed has stray text in a numeric column. Read the inline CSV below with `read_csv()`, then call `problems()` on the result to expose any rows that failed parsing. Save the parsed tibble to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 1 x 5
#>     row   col expected               actual file
#>   <int> <int> <chr>                  <chr>  <chr>
#> 1     3     2 a double               NA     literal data
```

**Difficulty:** Intermediate

[HINTS]
Import the data the usual way first - unparseable cells become NA, and the recovery report lives in a side attribute.
Read with read_csv(csv_text, show_col_types = FALSE); the problems() call then surfaces the failed row.

```r title="Your turn"
csv_text <- "user,spend
u1,42.0
u2,17.5
u3,unknown
u4,29.1"

ex_1_4 <- # your code here
problems(ex_1_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
csv_text <- "user,spend
u1,42.0
u2,17.5
u3,unknown
u4,29.1"

ex_1_4 <- read_csv(csv_text, show_col_types = FALSE)
problems(ex_1_4)
#> # A tibble: 1 x 5
#>     row   col expected               actual file
#>   <int> <int> <chr>                  <chr>  <chr>
#> 1     3     2 a double               NA     literal data
```

**Explanation:** `read_csv()` quietly converts un-parseable cells to `NA` rather than failing the whole import. The recovery information lives in a sidecar attribute that `problems()` surfaces. In a real pipeline you would either widen the column spec (`col_character()`) and parse downstream, or add a data-quality alert when `nrow(problems(x)) > 0`. Silent NAs are the bug that haunts R4DS analyses.

</details>

### Exercise 1.5: Enforce a column type specification at read time

**Task:** A reporting analyst wants the `score` column in the inline CSV below to import as `character` so leading zeros are preserved. Pass an explicit `col_types` spec to `read_csv()` and save the result to `ex_1_5`. Confirm with `class(ex_1_5$score)`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   id    score
#>   <chr> <chr>
#> 1 A     007
#> 2 B     042
#> 3 C     100
#> class: "character"
```

**Difficulty:** Intermediate

[HINTS]
Override the type guesser so the numeric-looking column is kept as text and its leading zeros survive.
Pass col_types = cols(id = col_character(), score = col_character()) to read_csv().

```r title="Your turn"
csv_text <- "id,score
A,007
B,042
C,100"

ex_1_5 <- # your code here
ex_1_5
class(ex_1_5$score)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
csv_text <- "id,score
A,007
B,042
C,100"

ex_1_5 <- read_csv(
  csv_text,
  col_types = cols(id = col_character(), score = col_character())
)
ex_1_5
#> # A tibble: 3 x 2
#>   id    score
#>   <chr> <chr>
#> 1 A     007
#> 2 B     042
#> 3 C     100
class(ex_1_5$score)
#> [1] "character"
```

**Explanation:** Leading-zero IDs, phone numbers, postal codes, and ISBNs all break under guess-driven numeric parsing. The `cols()` helper lets you nail down each column explicitly. The shorthand version is the compact string `"cc"` meaning "two character columns". Production pipelines should always pin `col_types` rather than relying on the first 1000-row guess that `read_csv()` makes by default.

</details>

### Exercise 1.6: Use skim-style summary with summarise across

**Task:** A statistician wants a one-shot numeric summary of every column of `iris` except the species factor. Use `summarise(across(...))` with `where(is.numeric)` to compute the mean of each numeric column. Save the resulting one-row tibble to `ex_1_6`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#>          <dbl>       <dbl>        <dbl>       <dbl>
#> 1         5.84        3.06         3.76        1.20
```

**Difficulty:** Intermediate

[HINTS]
Compute one statistic over every numeric column at once, letting the factor column drop out automatically.
Inside summarise(), use across(where(is.numeric), mean) on iris.

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- iris |>
  summarise(across(where(is.numeric), mean))
ex_1_6
#> # A tibble: 1 x 4
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#>          <dbl>       <dbl>        <dbl>       <dbl>
#> 1         5.84        3.06         3.76        1.20
```

**Explanation:** `across()` is the modern replacement for `summarise_if()` and `summarise_at()`. The first argument is a tidy-select that picks columns; here `where(is.numeric)` discards the `Species` factor automatically. Combined with `group_by()` this is the workhorse for cohort-style summaries. For multiple statistics pass a named list: `across(everything(), list(mu = mean, sd = sd))`.

</details>

---

## Section 2. Tidying messy data with tidyr (7 problems)

### Exercise 2.1: Pivot wide religious-style data to long

**Task:** A reporting team receives the wide tibble below, where each quarter is a column. Reshape it into a tidy long-form tibble with `quarter` and `revenue` columns using `pivot_longer()`. Save the result to `ex_2_1` and keep `product` as the identifier column.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   product quarter revenue
#>   <chr>   <chr>     <dbl>
#> 1 Alpha   Q1         12.3
#> 2 Alpha   Q2         15.8
#> 3 Alpha   Q3         19.1
#> 4 Beta    Q1          7.2
#> 5 Beta    Q2          9.4
#> 6 Beta    Q3         11.6
```

**Difficulty:** Beginner

[HINTS]
Each quarter column should collapse into rows, turning the column names into one variable and the cells into another.
Call pivot_longer() with cols = Q1:Q3, names_to = "quarter", and values_to = "revenue".

```r title="Your turn"
wide <- tibble(
  product = c("Alpha", "Beta"),
  Q1 = c(12.3, 7.2),
  Q2 = c(15.8, 9.4),
  Q3 = c(19.1, 11.6)
)

ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
wide <- tibble(
  product = c("Alpha", "Beta"),
  Q1 = c(12.3, 7.2),
  Q2 = c(15.8, 9.4),
  Q3 = c(19.1, 11.6)
)

ex_2_1 <- wide |>
  pivot_longer(
    cols = Q1:Q3,
    names_to = "quarter",
    values_to = "revenue"
  )
ex_2_1
#> # A tibble: 6 x 3
#>   product quarter revenue
#>   <chr>   <chr>     <dbl>
#> 1 Alpha   Q1         12.3
#> 2 Alpha   Q2         15.8
#> 3 Alpha   Q3         19.1
#> 4 Beta    Q1          7.2
#> 5 Beta    Q2          9.4
#> 6 Beta    Q3         11.6
```

**Explanation:** Tidy data wants one observation per row, so each quarter-product combination becomes its own row. `cols = Q1:Q3` is a tidy-select range; alternatives include `starts_with("Q")` or `-product` (everything except). The new column names go in `names_to`, and the cell values land in `values_to`. This is the most common reshape in R4DS practice.

</details>

### Exercise 2.2: Pivot long survey results back to wide

**Task:** A growth team has tidy-long survey responses and wants a wide pivot table where each `question` becomes its own column. Use `pivot_wider()` to spread the `answer` column out by `question`. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   respondent age   gender region
#>   <chr>      <chr> <chr>  <chr>
#> 1 r1         34    F      EU
#> 2 r2         28    M      US
```

**Difficulty:** Intermediate

[HINTS]
Spread one key column across the top so each of its values becomes its own column header.
Use pivot_wider() with names_from = question and values_from = answer.

```r title="Your turn"
long <- tibble(
  respondent = c("r1","r1","r1","r2","r2","r2"),
  question   = c("age","gender","region","age","gender","region"),
  answer     = c("34","F","EU","28","M","US")
)

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
long <- tibble(
  respondent = c("r1","r1","r1","r2","r2","r2"),
  question   = c("age","gender","region","age","gender","region"),
  answer     = c("34","F","EU","28","M","US")
)

ex_2_2 <- long |>
  pivot_wider(names_from = question, values_from = answer)
ex_2_2
#> # A tibble: 2 x 4
#>   respondent age   gender region
#>   <chr>      <chr> <chr>  <chr>
#> 1 r1         34    F      EU
#> 2 r2         28    M      US
```

**Explanation:** `pivot_wider()` is the inverse of `pivot_longer()`. The `names_from` column supplies the new column names and `values_from` supplies the cells. Wide form is rarely the right format for analysis but is exactly what reporting tools and human reviewers expect. If two rows share the same key combination, supply `values_fn = list` or an aggregator to control collisions.

</details>

### Exercise 2.3: Split a name column into first and last

**Task:** A CRM team has a tibble with a single `full_name` column and needs separate `first` and `last` columns for personalised emails. Use `separate_wider_delim()` to split on the space character. Save the result to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   first  last
#>   <chr>  <chr>
#> 1 Ada    Lovelace
#> 2 Grace  Hopper
#> 3 Alan   Turing
```

**Difficulty:** Intermediate

[HINTS]
Break the single text column into two pieces at the space and give each piece a name.
Apply separate_wider_delim() with delim = " " and names = c("first", "last").

```r title="Your turn"
people <- tibble(full_name = c("Ada Lovelace","Grace Hopper","Alan Turing"))

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
people <- tibble(full_name = c("Ada Lovelace","Grace Hopper","Alan Turing"))

ex_2_3 <- people |>
  separate_wider_delim(
    full_name,
    delim = " ",
    names = c("first", "last")
  )
ex_2_3
#> # A tibble: 3 x 2
#>   first  last
#>   <chr>  <chr>
#> 1 Ada    Lovelace
#> 2 Grace  Hopper
#> 3 Alan   Turing
```

**Explanation:** Since tidyr 1.3 the new `separate_wider_*` family replaced the old `separate()` because it is louder about parsing failures. Rows that do not match the requested shape now raise an informative error instead of silently producing `NA`. For fixed-width fields use `separate_wider_position()`; for regex captures use `separate_wider_regex()`.

</details>

### Exercise 2.4: Drop rows with missing Ozone values

**Task:** An environmental analyst needs a clean copy of `airquality` for downstream regression but cannot tolerate missing `Ozone` values. Use `drop_na(Ozone)` to remove those rows and save the cleaned tibble to `ex_2_4`. Confirm the new row count.

**Expected result:**

```
#> # A tibble: 116 x 6
#>   Ozone Solar.R  Wind  Temp Month   Day
#>   <int>   <int> <dbl> <int> <int> <int>
#> 1    41     190   7.4    67     5     1
#> 2    36     118   8       72    5     2
#> ...
#> # 114 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
Keep only the rows that are complete for the one column the regression cannot tolerate gaps in.
Pipe airquality into drop_na(Ozone).

```r title="Your turn"
ex_2_4 <- # your code here
nrow(ex_2_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- airquality |>
  drop_na(Ozone)
nrow(ex_2_4)
#> [1] 116
```

**Explanation:** `drop_na()` keeps only complete rows for the named columns; omit the argument to drop on any column. Compare with `filter(!is.na(Ozone))`, which is equivalent for a single column but verbose for many. For imputation rather than deletion you would reach for `replace_na()` (constant fill) or one of `tidyr::fill()` / `dplyr::coalesce()` for forward-fill and fallback chains.

</details>

### Exercise 2.5: Fill forward a sparse time-stamp column

**Task:** A SaaS reporting analyst gets event logs where `session_id` is only stamped on the first row of each session, then left blank. Use `fill(session_id)` to carry the value forward to the next non-`NA` row. Save the filled tibble to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   session_id event
#>   <chr>      <chr>
#> 1 S1         start
#> 2 S1         click
#> 3 S1         end
#> 4 S2         start
#> 5 S2         click
#> 6 S2         end
```

**Difficulty:** Intermediate

[HINTS]
Carry each stamped value downward into the blank rows beneath it until the next stamp appears.
Use fill(session_id, .direction = "down").

```r title="Your turn"
logs <- tibble(
  session_id = c("S1", NA, NA, "S2", NA, NA),
  event      = c("start","click","end","start","click","end")
)

ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
logs <- tibble(
  session_id = c("S1", NA, NA, "S2", NA, NA),
  event      = c("start","click","end","start","click","end")
)

ex_2_5 <- logs |>
  fill(session_id, .direction = "down")
ex_2_5
#> # A tibble: 6 x 2
#>   session_id event
#>   <chr>      <chr>
#> 1 S1         start
#> 2 S1         click
#> 3 S1         end
#> 4 S2         start
#> 5 S2         click
#> 6 S2         end
```

**Explanation:** `fill()` is the right tool for the "last observation carried forward" idiom common in reporting tables that visually merge header rows. The `.direction = "down"` default is what you want most of the time; `"up"`, `"downup"`, and `"updown"` cover edge cases when the first or last value is missing. Combine with `group_by()` to fill within groups only.

</details>

### Exercise 2.6: Complete a sparse panel with missing combinations

**Task:** An audit team has a quarterly panel where some product-quarter combinations are missing entirely because no sale happened. Use `complete()` to materialise every `product` x `quarter` pair with `revenue = 0` where missing. Save the dense panel to `ex_2_6`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   product quarter revenue
#>   <chr>   <chr>     <dbl>
#> 1 Alpha   Q1         12.3
#> 2 Alpha   Q2          0
#> 3 Beta    Q1          0
#> 4 Beta    Q2          9.4
```

**Difficulty:** Advanced

[HINTS]
Materialise every product-quarter pairing the data skipped, inserting a sentinel value where none existed.
Call complete(product, quarter, fill = list(revenue = 0)).

```r title="Your turn"
sparse <- tibble(
  product = c("Alpha","Beta"),
  quarter = c("Q1","Q2"),
  revenue = c(12.3, 9.4)
)

ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sparse <- tibble(
  product = c("Alpha","Beta"),
  quarter = c("Q1","Q2"),
  revenue = c(12.3, 9.4)
)

ex_2_6 <- sparse |>
  complete(product, quarter, fill = list(revenue = 0))
ex_2_6
#> # A tibble: 4 x 3
#>   product quarter revenue
#>   <chr>   <chr>     <dbl>
#> 1 Alpha   Q1         12.3
#> 2 Alpha   Q2          0
#> 3 Beta    Q1          0
#> 4 Beta    Q2          9.4
```

**Explanation:** `complete()` is a tidyr workhorse for time-series and cohort analyses where missing combinations should appear with a sentinel value rather than be absent. Internally it builds the cross-product of the grouping columns and left-joins back. The `fill` argument distinguishes "structurally absent" from `NA`; use `nesting()` inside `complete()` when only some combinations are valid.

</details>

### Exercise 2.7: Unite year, month, day into a single date column

**Task:** A retail analytics team has separate `year`, `month`, `day` columns and wants a single ISO date for time-series tools. Use `unite()` to combine them with a "-" separator, then parse with `ymd()` from lubridate. Save the parsed tibble to `ex_2_7`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   date       sales
#>   <date>     <dbl>
#> 1 2026-01-15  100
#> 2 2026-02-10  120
#> 3 2026-03-05  150
```

**Difficulty:** Intermediate

[HINTS]
Glue the three date parts into a single string, then parse that string into a real date.
Use unite("date", year, month, day, sep = "-"), then mutate(date = ymd(date)).

```r title="Your turn"
parts <- tibble(
  year  = c(2026, 2026, 2026),
  month = c(1, 2, 3),
  day   = c(15, 10, 5),
  sales = c(100, 120, 150)
)

ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
parts <- tibble(
  year  = c(2026, 2026, 2026),
  month = c(1, 2, 3),
  day   = c(15, 10, 5),
  sales = c(100, 120, 150)
)

ex_2_7 <- parts |>
  unite("date", year, month, day, sep = "-") |>
  mutate(date = ymd(date))
ex_2_7
#> # A tibble: 3 x 2
#>   date       sales
#>   <date>     <dbl>
#> 1 2026-01-15  100
#> 2 2026-02-10  120
#> 3 2026-03-05  150
```

**Explanation:** `unite()` is the inverse of `separate()`: it glues several columns into one. Combined with `lubridate::ymd()`, this is the canonical idiom for repairing date columns that arrived split. An equally valid one-liner is `mutate(date = make_date(year, month, day))`, which avoids the string roundtrip entirely; both produce a true `Date` vector that time-series tooling understands.

</details>

---

## Section 3. Transforming with dplyr (10 problems)

### Exercise 3.1: Filter mpg for highway efficiency over 30

**Task:** A fleet manager evaluating fuel cards wants to see only the cars in `mpg` whose highway mileage exceeds 30 miles per gallon. Use `filter()` to keep rows where `hwy > 30`. Save the filtered tibble to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 25 x 11
#>   manufacturer model    displ  year   cyl trans  drv     cty   hwy fl    class
#>   <chr>        <chr>    <dbl> <int> <int> <chr>  <chr> <int> <int> <chr> <chr>
#> 1 chevrolet    malibu     2.4  2008     4 auto(l4) f     22    30   r     midsize
#> 2 honda        civic      1.6  1999     4 manual(m5) f  28    33   r     subcompact
#> ...
#> # 23 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
Keep only the rows whose highway figure clears the threshold.
Pipe mpg into filter(hwy > 30).

```r title="Your turn"
ex_3_1 <- # your code here
nrow(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mpg |>
  filter(hwy > 30)
nrow(ex_3_1)
#> [1] 25
```

**Explanation:** `filter()` evaluates its expression for each row and keeps the `TRUE`s. Multiple conditions chain with commas (interpreted as `&`) or explicit `|` for `OR`. A common pitfall is using `=` instead of `==` inside the predicate; the former assigns and triggers a clear error, but logical typos like `x = 5` returning a scalar `TRUE` after coercion can silently drop everything.

</details>

### Exercise 3.2: Select and rename columns in one step

**Task:** A marketing analyst preparing a dashboard wants only three columns from `mpg`: the manufacturer, the model name renamed to `vehicle`, and the highway mileage renamed to `mpg_highway`. Use `select()` with rename-on-select syntax. Save the trimmed tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 234 x 3
#>   manufacturer vehicle  mpg_highway
#>   <chr>        <chr>          <int>
#> 1 audi         a4                29
#> 2 audi         a4                29
#> ...
#> # 232 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
Trim down to three columns and rename two of them in the very same step.
Use select(manufacturer, vehicle = model, mpg_highway = hwy).

```r title="Your turn"
ex_3_2 <- # your code here
head(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mpg |>
  select(manufacturer, vehicle = model, mpg_highway = hwy)
head(ex_3_2)
#> # A tibble: 6 x 3
#>   manufacturer vehicle  mpg_highway
#>   <chr>        <chr>          <int>
#> 1 audi         a4                29
#> 2 audi         a4                29
#> 3 audi         a4                31
#> 4 audi         a4                30
#> 5 audi         a4                26
#> 6 audi         a4                26
```

**Explanation:** `select()` accepts `new_name = old_name` syntax inline, eliminating a separate `rename()` step for renames that happen alongside trimming. Tidy-select helpers like `starts_with()`, `ends_with()`, `contains()`, and `matches()` (regex) work too. To keep all columns but rename a few, use `rename()` instead; `select()` keeps only what you name.

</details>

### Exercise 3.3: Mutate to add a fuel efficiency ratio

**Task:** A take-home interview asks the candidate to add a column `hwy_cty_ratio` to `mpg` that measures highway-to-city efficiency. Use `mutate()` to compute `hwy / cty` and save the augmented tibble to `ex_3_3`. Round the new column to two decimals.

**Expected result:**

```
#> # A tibble: 234 x 12
#>   manufacturer model  displ  year  cyl trans drv     cty   hwy fl    class hwy_cty_ratio
#>   <chr>        <chr>  <dbl> <int> <int> <chr> <chr> <int> <int> <chr> <chr>         <dbl>
#> 1 audi         a4       1.8  1999     4 auto(l5) f    18    29  p     compact        1.61
#> ...
#> # 233 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
Add a derived column dividing one mileage figure by the other, rounded for readability.
Use mutate(hwy_cty_ratio = round(hwy / cty, 2)).

```r title="Your turn"
ex_3_3 <- # your code here
head(ex_3_3, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mpg |>
  mutate(hwy_cty_ratio = round(hwy / cty, 2))
head(ex_3_3, 1)
#> # A tibble: 1 x 12
#>   manufacturer model displ  year   cyl trans drv     cty   hwy fl    class hwy_cty_ratio
#>   <chr>        <chr> <dbl> <int> <int> <chr> <chr> <int> <int> <chr> <chr>         <dbl>
#> 1 audi         a4      1.8  1999     4 auto(l5) f   18    29 p     compact        1.61
```

**Explanation:** `mutate()` adds or modifies columns based on existing ones. New columns appear at the right; use `.before = col` or `.after = col` to control placement. A ratio is more interpretable than a raw difference when scales vary across rows. For multiple new columns built from the same intermediate, factor the intermediate into its own `mutate()` step rather than recomputing it.

</details>

### Exercise 3.4: Group by class and summarise median mileage

**Task:** A consumer review site needs a one-row-per-vehicle-class table showing median city and highway mileage from `mpg`. Use `group_by(class)` followed by `summarise()` to compute `median_cty` and `median_hwy`. Save the per-class summary to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 7 x 3
#>   class      median_cty median_hwy
#>   <chr>           <dbl>      <dbl>
#> 1 2seater          15        24.5
#> 2 compact          20        27
#> 3 midsize          18        27
#> 4 minivan          15.5      23
#> 5 pickup           13        17
#> 6 subcompact       19        26
#> 7 suv              13        17
```

**Difficulty:** Intermediate

[HINTS]
Collapse the rows to one per vehicle class, reporting a robust center for two mileage columns.
Chain group_by(class) into summarise(median_cty = median(cty), median_hwy = median(hwy)).

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- mpg |>
  group_by(class) |>
  summarise(
    median_cty = median(cty),
    median_hwy = median(hwy),
    .groups = "drop"
  )
ex_3_4
#> # A tibble: 7 x 3
#>   class      median_cty median_hwy
#>   <chr>           <dbl>      <dbl>
#> 1 2seater          15        24.5
#> 2 compact          20        27
#> 3 midsize          18        27
#> 4 minivan          15.5      23
#> 5 pickup           13        17
#> 6 subcompact       19        26
#> 7 suv              13        17
```

**Explanation:** Group-then-summarise is the most reused pattern in R4DS. The new `.by` argument in dplyr 1.1 offers a one-line alternative: `summarise(..., .by = class)`. Always pass `.groups = "drop"` or use `.by` to avoid the persistent-grouping footgun where a downstream `mutate()` accidentally operates within the old groups. `median()` is more robust to outliers than `mean()`.

</details>

### Exercise 3.5: Arrange diamonds by descending price within cut

**Task:** A jeweller building a "top 3 per cut" display ranks the `diamonds` inventory inside each cut category by descending price. Use `group_by(cut)`, `slice_max(price, n = 3)`, and `arrange()`. Save the result to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 15 x 10
#> # Groups:   cut [5]
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.29 Fair      I     VS2      60      63 18531  8.52  8.45  5.09
#> ...
#> # 13 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Within each cut category, keep only the few highest-priced rows, then fix the display order.
Chain group_by(cut), slice_max(price, n = 3), and arrange(cut, desc(price)).

```r title="Your turn"
ex_3_5 <- # your code here
head(ex_3_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- diamonds |>
  group_by(cut) |>
  slice_max(price, n = 3) |>
  arrange(cut, desc(price))
head(ex_3_5)
#> # A tibble: 6 x 10
#> # Groups:   cut [2]
#>   carat cut    color clarity depth table price     x     y     z
#>   <dbl> <ord>  <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.29 Fair   I     VS2      60      63 18531  8.52  8.45  5.09
#> 2  3.01 Fair   I     I1       64.6    56 18242  9.44  9.34  6.08
#> 3  3.01 Fair   I     I1       65.8    56 18242  9.32  9.13  6.06
#> 4  2    Good   F     SI2      62.6    62 18707  7.94  7.84  4.93
#> 5  2.04 Good   I     VS1      60.9    61 18468  8.13  8.02  4.92
#> 6  2.39 Good   I     VS1      62      59 18308  8.59  8.55  5.32
#> ...
```

**Explanation:** `slice_max()` keeps the top-n rows per group by the column you pass. It replaces the older `top_n()`, which had confusing tie-breaking behaviour. `arrange()` controls the final display order; without it, slice results inherit the original row order. A useful variant: `slice_max(price, prop = 0.01)` keeps the top 1 percent per group instead of a fixed count.

</details>

### Exercise 3.6: Inner join customers with orders

**Task:** An e-commerce data engineer wants every order paired with its customer attributes. Inner-join the two inline tibbles on `customer_id`, keeping only customers who actually placed an order. Save the joined tibble to `ex_3_6`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   customer_id name    order_id amount
#>   <chr>       <chr>   <chr>     <dbl>
#> 1 C1          Aria    O100       42.5
#> 2 C2          Boris   O101       19.9
#> 3 C2          Boris   O102       55.0
```

**Difficulty:** Intermediate

[HINTS]
Pair each order with its customer attributes and drop customers who never placed one.
Use inner_join(orders, by = "customer_id") on the customers tibble.

```r title="Your turn"
customers <- tibble(customer_id = c("C1","C2","C3"), name = c("Aria","Boris","Cleo"))
orders    <- tibble(customer_id = c("C1","C2","C2"), order_id = c("O100","O101","O102"), amount = c(42.5,19.9,55.0))

ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(customer_id = c("C1","C2","C3"), name = c("Aria","Boris","Cleo"))
orders    <- tibble(customer_id = c("C1","C2","C2"), order_id = c("O100","O101","O102"), amount = c(42.5,19.9,55.0))

ex_3_6 <- customers |>
  inner_join(orders, by = "customer_id")
ex_3_6
#> # A tibble: 3 x 4
#>   customer_id name    order_id amount
#>   <chr>       <chr>   <chr>     <dbl>
#> 1 C1          Aria    O100       42.5
#> 2 C2          Boris   O101       19.9
#> 3 C2          Boris   O102       55.0
```

**Explanation:** `inner_join()` keeps only rows whose key appears in both tibbles, dropping Cleo who never ordered. `left_join()` would keep Cleo with `NA` order columns; `full_join()` would also keep any order-only rows. dplyr 1.1 added `join_by()` for non-equi joins like inequality conditions or rolling joins, which the old `by = ` argument cannot express.

</details>

### Exercise 3.7: Anti-join to find customers without orders

**Task:** The same e-commerce team wants the opposite cut: customers who have not placed any order. Use `anti_join()` against the orders tibble to keep only the no-order rows. Save the lonely customers to `ex_3_7`.

**Expected result:**

```
#> # A tibble: 1 x 2
#>   customer_id name
#>   <chr>       <chr>
#> 1 C3          Cleo
```

**Difficulty:** Intermediate

[HINTS]
Keep only the customer rows whose key never appears anywhere among the orders.
Use anti_join(orders, by = "customer_id") on the customers tibble.

```r title="Your turn"
customers <- tibble(customer_id = c("C1","C2","C3"), name = c("Aria","Boris","Cleo"))
orders    <- tibble(customer_id = c("C1","C2","C2"), order_id = c("O100","O101","O102"), amount = c(42.5,19.9,55.0))

ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(customer_id = c("C1","C2","C3"), name = c("Aria","Boris","Cleo"))
orders    <- tibble(customer_id = c("C1","C2","C2"), order_id = c("O100","O101","O102"), amount = c(42.5,19.9,55.0))

ex_3_7 <- customers |>
  anti_join(orders, by = "customer_id")
ex_3_7
#> # A tibble: 1 x 2
#>   customer_id name
#>   <chr>       <chr>
#> 1 C3          Cleo
```

**Explanation:** `anti_join()` is a filter, not a merge: it keeps rows of the left tibble whose key does not appear in the right tibble, and never adds columns. It is the most idiomatic way to express "find rows in A that are not in B". The cousin `semi_join()` is the opposite filter, keeping left rows that have at least one match without duplicating them.

</details>

### Exercise 3.8: Use case_when to bucket diamond prices

**Task:** A jeweller preparing a quarterly sale wants to bucket the `diamonds` inventory into three tiers based on `price`: "budget" (< 1000), "mid" (1000-4999), and "premium" (>= 5000). Add a `tier` column with `case_when()` and save the augmented tibble to `ex_3_8`.

**Expected result:**

```
#> # A tibble: 53,940 x 11
#>   carat cut       color clarity depth table price     x     y     z tier
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl> <chr>
#> 1  0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43 budget
#> 2  0.21 Premium   E     SI1      59.8    61   326  3.89  3.84  2.31 budget
#> ...
#> # 53,938 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Add a label column whose value depends on which price band each row falls into.
Inside mutate(), use case_when() with price < 1000, price < 5000, and a TRUE catch-all branch.

```r title="Your turn"
ex_3_8 <- # your code here
count(ex_3_8, tier)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- diamonds |>
  mutate(tier = case_when(
    price < 1000 ~ "budget",
    price < 5000 ~ "mid",
    TRUE         ~ "premium"
  ))
count(ex_3_8, tier)
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14524
#> 2 mid     28966
#> 3 premium 10450
```

**Explanation:** `case_when()` reads top-to-bottom; the first matching branch wins, so the second branch only fires for prices in [1000, 4999]. The trailing `TRUE ~ ...` is the catch-all default; without it, prices >= 5000 would become `NA`. Cleaner than nested `if_else()` once there are three or more buckets, and the case order itself documents the bucketing rule.

</details>

### Exercise 3.9: Lag and lead for day-over-day deltas

**Task:** A retail finance team has a daily sales tibble and wants a `delta` column with the day-over-day change. Use `lag()` inside `mutate()` to grab the previous day's sales and compute the difference. Save the augmented tibble to `ex_3_9`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   day        sales delta
#>   <chr>      <dbl> <dbl>
#> 1 Mon          100    NA
#> 2 Tue          110    10
#> 3 Wed          105    -5
#> 4 Thu          130    25
#> 5 Fri          145    15
```

**Difficulty:** Intermediate

[HINTS]
The change column is today's value minus the value sitting in the row directly above.
Use mutate(delta = sales - lag(sales)).

```r title="Your turn"
daily <- tibble(day = c("Mon","Tue","Wed","Thu","Fri"), sales = c(100,110,105,130,145))

ex_3_9 <- # your code here
ex_3_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
daily <- tibble(day = c("Mon","Tue","Wed","Thu","Fri"), sales = c(100,110,105,130,145))

ex_3_9 <- daily |>
  mutate(delta = sales - lag(sales))
ex_3_9
#> # A tibble: 5 x 3
#>   day        sales delta
#>   <chr>      <dbl> <dbl>
#> 1 Mon          100    NA
#> 2 Tue          110    10
#> 3 Wed          105    -5
#> 4 Thu          130    25
#> 5 Fri          145    15
```

**Explanation:** `lag(x)` returns the previous row's value; `lead(x)` returns the next row's. The first lag is `NA` because there is no prior row, which is correct: a zero delta would misleadingly imply "no change". Always confirm the tibble is sorted in time order before lagging; combine with `group_by(series_id)` to lag within panel groups rather than across them.

</details>

### Exercise 3.10: Rolling 3-row mean with cummean and slider replacement

**Task:** An ops engineer wants a simple 3-row trailing mean of the same daily sales tibble. Use a `mutate()` with `(sales + lag(sales) + lag(sales, 2)) / 3` to compute the trailing window. Save the augmented tibble to `ex_3_10`. The first two rows will be `NA`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   day        sales rolling_3
#>   <chr>      <dbl>     <dbl>
#> 1 Mon          100      NA
#> 2 Tue          110      NA
#> 3 Wed          105     105
#> 4 Thu          130     115
#> 5 Fri          145     127.
```

**Difficulty:** Advanced

[HINTS]
Average the current value together with the two values immediately preceding it.
Use mutate(rolling_3 = (sales + lag(sales) + lag(sales, 2)) / 3).

```r title="Your turn"
daily <- tibble(day = c("Mon","Tue","Wed","Thu","Fri"), sales = c(100,110,105,130,145))

ex_3_10 <- # your code here
ex_3_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
daily <- tibble(day = c("Mon","Tue","Wed","Thu","Fri"), sales = c(100,110,105,130,145))

ex_3_10 <- daily |>
  mutate(rolling_3 = (sales + lag(sales) + lag(sales, 2)) / 3)
ex_3_10
#> # A tibble: 5 x 3
#>   day        sales rolling_3
#>   <chr>      <dbl>     <dbl>
#> 1 Mon          100      NA
#> 2 Tue          110      NA
#> 3 Wed          105     105
#> 4 Thu          130     115
#> 5 Fri          145     127.
```

**Explanation:** The hand-rolled `lag()` approach works for a fixed small window but does not generalise. For longer windows or different aggregations, the `slider` package gives proper sliding windows with explicit alignment. The `zoo::rollmean()` and `RcppRoll::roll_mean()` are also classic options. The `NA` head is the trailing-window convention; pass `na.rm = TRUE` only if you really want partial-window means.

</details>

---

## Section 4. Visualizing with ggplot2 (9 problems)

### Exercise 4.1: Scatter of diamond carat vs price

**Task:** A jewellery analyst exploring `diamonds` wants a basic scatter plot of `carat` on the x-axis against `price` on the y-axis to inspect the relationship. Build it with `ggplot()` and `geom_point()`. Save the plot object to `ex_4_1`.

**Expected result:**

```
# A ggplot2 scatter plot:
#   x = carat (range ~0.2 to 5)
#   y = price (range ~$326 to $18,823)
#   single geom_point layer with default round black markers
```

**Difficulty:** Beginner

[HINTS]
Start a plot that maps carat and price to the two axes, then add a layer of dots.
Build ggplot(diamonds, aes(x = carat, y = price)) and add geom_point().

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point()
ex_4_1
#> # A ggplot2 scatter plot of price vs carat
```

**Explanation:** Every ggplot starts with `ggplot(data, aes(...))`, which sets the global mapping, then adds layers with `+`. With 50,000 points the scatter is mostly black because dots stack; the cure is `alpha = 0.05` for transparency or `geom_hex()` for a 2D density. Save the plot as an object so it can be reused, themed, or printed to file later.

</details>

### Exercise 4.2: Colour points by cut to expose price tiers

**Task:** Extend the carat-vs-price scatter so points are coloured by `cut`. A trader on the diamond desk wants to see whether the cut grade explains the price scatter at any given carat weight. Use `aes(colour = cut)` and `alpha = 0.4` to combat overplotting. Save the plot to `ex_4_2`.

**Expected result:**

```
# Scatter of carat vs price coloured by cut (five categories);
# legend on the right shows Fair, Good, Very Good, Premium, Ideal;
# transparency reveals that Ideal cuts price-cluster above Fair at the same carat.
```

**Difficulty:** Intermediate

[HINTS]
Make the colour data-driven by mapping it inside the aesthetic, but keep transparency a fixed setting outside it.
Add colour = cut inside aes() and alpha = 0.4 inside geom_point().

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(diamonds, aes(x = carat, y = price, colour = cut)) +
  geom_point(alpha = 0.4) +
  labs(title = "Price vs carat by cut", colour = "Cut grade")
ex_4_2
#> # ggplot2 scatter coloured by cut with alpha overplotting fix
```

**Explanation:** Putting `colour = cut` inside `aes()` makes the aesthetic data-driven; outside `aes()` it would be a fixed visual property. The `alpha = 0.4` inside `geom_point()` is fixed, not mapped, which is exactly what you want for an overplotting fix. `labs()` titles the legend so a non-R user can read the chart without guessing at column names.

</details>

### Exercise 4.3: Facet by class with facet_wrap

**Task:** A vehicle-class reviewer wants seven small scatter plots, one per `class`, comparing `displ` against `hwy` in `mpg`. Use `facet_wrap(~ class)` and let ggplot lay them out in a grid. Save the faceted plot to `ex_4_3`.

**Expected result:**

```
# 7 small panels: 2seater, compact, midsize, minivan, pickup, subcompact, suv;
# each shows displ on x and hwy on y; clear inverse relationship in most panels.
```

**Difficulty:** Intermediate

[HINTS]
Split the single scatter into one small panel per class on an auto-arranged grid.
Add facet_wrap(~ class) to a displ-vs-hwy geom_point() plot.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class) +
  labs(title = "Highway mileage vs engine displacement by class")
ex_4_3
#> # 7-panel faceted scatter
```

**Explanation:** `facet_wrap()` is the right tool when you have one categorical splitter and want a 2D grid that wraps automatically. `facet_grid(rows ~ cols)` is the choice when you have two splitters and want a strict matrix. Faceting is more honest than colouring when categories number more than five or six; the human eye separates panels better than it separates close hues.

</details>

### Exercise 4.4: Histogram of diamond carats with adjusted binwidth

**Task:** A scout is profiling the carat distribution in `diamonds` and notices the default 30 bins miss meaningful clusters at quarter-carat marks. Draw a histogram of `carat` with `binwidth = 0.05` to expose the spikes. Save the plot to `ex_4_4`.

**Expected result:**

```
# Histogram of diamond carat with binwidth 0.05;
# pronounced spikes at 0.30, 0.50, 0.70, 1.00 due to certified-weight rounding;
# right tail thins out past 2.5 carats.
```

**Difficulty:** Intermediate

[HINTS]
Draw a single-variable distribution and shrink the bin size so the hidden clusters surface.
Use geom_histogram(binwidth = 0.05) on aes(x = carat).

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- ggplot(diamonds, aes(x = carat)) +
  geom_histogram(binwidth = 0.05, fill = "steelblue", colour = "white") +
  labs(title = "Carat distribution in diamonds", x = "Carat", y = "Count")
ex_4_4
#> # Histogram with binwidth 0.05 exposing weight-rounding spikes
```

**Explanation:** Histogram shape depends sharply on `binwidth`. The default 30 bins is a starting point; always test two or three widths because a single setting can hide multimodality or invent it. The spikes at common weights illustrate why visual inspection matters: a summary statistic would smooth them away. For continuous shape, `geom_density()` is the kernel-smoothed alternative.

</details>

### Exercise 4.5: Boxplot of hwy mileage by drive train

**Task:** A used-car reviewer wants a quick side-by-side boxplot of `hwy` mileage for the three drive trains (`drv`) in `mpg`: 4WD, front-wheel, and rear-wheel. Use `geom_boxplot()` with `drv` on the x-axis. Save the plot to `ex_4_5`.

**Expected result:**

```
# Three boxes side-by-side along x = drv;
# y = hwy from ~10 to ~45;
# front-wheel-drive box sits noticeably higher (median ~28) than rear- and 4WD.
```

**Difficulty:** Intermediate

[HINTS]
Put the drive-train category on the x-axis and the mileage on the y-axis as side-by-side summary boxes.
Use geom_boxplot() with aes(x = drv, y = hwy).

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- ggplot(mpg, aes(x = drv, y = hwy)) +
  geom_boxplot(fill = "grey90") +
  labs(title = "Highway mileage by drive train", x = "Drive", y = "Highway mpg")
ex_4_5
#> # Side-by-side boxplot of hwy by drv
```

**Explanation:** A boxplot encodes five summary numbers (min, Q1, median, Q3, max) plus outliers as dots. It is the densest possible per-group display and the right first call when comparing a numeric variable across a small number of categories. With many categories, `geom_violin()` carries shape information that boxes do not, and `geom_jitter()` overlaid on a boxplot shows raw observations.

</details>

### Exercise 4.6: Bar chart of mpg class counts ordered by frequency

**Task:** A product manager wants a bar chart of `mpg` rows per `class`, with bars sorted from tallest to shortest for instant scanability. Use `fct_infreq()` from forcats to reorder `class` before plotting. Save the plot to `ex_4_6`.

**Expected result:**

```
# Bar chart with class on x reordered by descending count;
# tallest bar is suv (~62), shortest is 2seater (~5);
# y-axis labelled Count.
```

**Difficulty:** Intermediate

[HINTS]
Reorder the category by descending count before plotting so the bars rank tallest to shortest.
Wrap the x mapping in fct_infreq(class) and add geom_bar().

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- ggplot(mpg, aes(x = fct_infreq(class))) +
  geom_bar(fill = "steelblue") +
  labs(title = "Vehicle count by class", x = "Class", y = "Count")
ex_4_6
#> # Bar chart sorted by frequency descending
```

**Explanation:** ggplot draws factor levels in their stored order, which for a character vector is alphabetical. `fct_infreq()` reorders by descending count so the visual ranking matches the data. The siblings are `fct_reorder()` for ordering by a summary statistic of another column, `fct_rev()` to reverse order, and `fct_relevel()` for manual moves. Always reorder before passing to `aes()`.

</details>

### Exercise 4.7: Line plot of co2 atmospheric concentration

**Task:** A climatologist plots the built-in `co2` Mauna Loa series as a line over time to expose the long-term rise and the annual sawtooth. Convert `co2` to a tibble with explicit `year` and `value` columns, then draw it with `geom_line()`. Save the plot to `ex_4_7`.

**Expected result:**

```
# Line chart of atmospheric CO2 from ~1959 to ~1997;
# steady upward slope from ~315 ppm to ~366 ppm;
# annual seasonal sawtooth clearly visible.
```

**Difficulty:** Intermediate

[HINTS]
With the series already in a tibble, draw a connected line across the time index.
Map year and value in aes() and add geom_line().

```r title="Your turn"
co2_df <- tibble(
  year  = as.numeric(time(co2)),
  value = as.numeric(co2)
)

ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
co2_df <- tibble(
  year  = as.numeric(time(co2)),
  value = as.numeric(co2)
)

ex_4_7 <- ggplot(co2_df, aes(x = year, y = value)) +
  geom_line(colour = "darkred") +
  labs(title = "Atmospheric CO2 at Mauna Loa", x = "Year", y = "ppm")
ex_4_7
#> # Line chart with rising trend and annual sawtooth
```

**Explanation:** Converting a `ts` object to a tibble is the first step toward using any tidyverse tool on time-series data; the trick is `as.numeric(time(x))` for the index and `as.numeric(x)` for the values. `geom_line()` draws a line in the row order of the tibble, so always sort by time first. Compare with `geom_path()`, which traces an arbitrary 2D trajectory.

</details>

### Exercise 4.8: Add a smoothed trend line over a scatter

**Task:** A performance reviewer building a marketing slide wants the `mpg` scatter of `displ` vs `hwy` with a LOESS smoother on top so the trend reads at a glance. Add `geom_smooth(method = "loess")` to the scatter. Save the layered plot to `ex_4_8`.

**Expected result:**

```
# Scatter of hwy vs displ overlaid with a smooth blue curve;
# clear decreasing trend, with the smoother dipping then flattening past displ ~5;
# grey ribbon shows 95% confidence band.
```

**Difficulty:** Intermediate

[HINTS]
Layer a fitted trend curve on top of the existing scatter so the pattern reads at a glance.
Add geom_smooth(method = "loess") to the displ-vs-hwy geom_point() plot.

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "loess", formula = y ~ x) +
  labs(title = "Highway mpg vs displacement with LOESS trend")
ex_4_8
#> # Scatter with smoothed trend line and CI band
```

**Explanation:** `geom_smooth()` defaults to LOESS for under ~1000 points and to GAM above that; passing `method` explicitly removes the surprise. The grey band is a 95% confidence interval around the conditional mean; turn it off with `se = FALSE` for a cleaner deck slide. `method = "lm"` overlays an OLS line, which is more interpretable when you have a parametric story to tell.

</details>

### Exercise 4.9: Polish for publication with theme_minimal and labels

**Task:** A code reviewer asks for a final polished version of the carat-vs-price scatter ready to drop into a board deck. Use `theme_minimal()`, log-scale both axes, label them with currency and units, and add a subtitle. Save the publication-ready plot to `ex_4_9`.

**Expected result:**

```
# Carat-vs-price scatter on log-log scales;
# clean white background, light grid;
# title, subtitle, axis labels with $ on y and carat on x;
# point cloud now near-linear due to log transform.
```

**Difficulty:** Advanced

[HINTS]
Take the scatter, transform both axes logarithmically, format the labels, and apply a clean theme.
Combine scale_x_log10(), scale_y_log10(labels = scales::label_dollar()), labs(), and theme_minimal().

```r title="Your turn"
ex_4_9 <- # your code here
ex_4_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_9 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05) +
  scale_x_log10() +
  scale_y_log10(labels = scales::label_dollar()) +
  labs(
    title = "Diamond price scales near-linearly with carat on log-log",
    subtitle = "53,940 round-cut diamonds; alpha = 0.05 to handle overplotting",
    x = "Carat weight",
    y = "Price (log scale)"
  ) +
  theme_minimal(base_size = 12)
ex_4_9
#> # Polished log-log scatter ready for a board deck
```

**Explanation:** Log scales straighten exponential relationships; for diamonds the price-vs-carat plot is famously linear in log-log because price scales roughly with carat to the 1.6 power. `scales::label_dollar()` formats axis ticks as currency without manual `format()` gymnastics. `theme_minimal()` strips the grey ggplot default for a cleaner board-deck look; `base_size` scales every text element proportionally.

</details>

---

## Section 5. Statistical modeling (8 problems)

### Exercise 5.1: Fit a simple linear regression mpg on weight

**Task:** A pricing analyst wants to quantify how much fuel efficiency drops per 1000-pound increase in vehicle weight using `mtcars`. Fit `lm(mpg ~ wt, data = mtcars)` and save the fitted model object to `ex_5_1`. Inspect the coefficient table.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#>
#> Coefficients:
#> (Intercept)           wt
#>      37.285       -5.344
```

**Difficulty:** Beginner

[HINTS]
Fit an ordinary least-squares model of mileage on weight and keep the fitted object.
Use lm(mpg ~ wt, data = mtcars).

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- lm(mpg ~ wt, data = mtcars)
ex_5_1
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#>
#> Coefficients:
#> (Intercept)           wt
#>      37.285       -5.344
```

**Explanation:** `lm()` is the workhorse for ordinary least-squares regression. The default print method shows only point estimates; for inference (standard errors, t-statistics, p-values, R-squared) call `summary(ex_5_1)`. The slope of -5.34 says: for each extra 1000 lb of vehicle weight, predicted mpg drops by 5.34 miles per gallon. Always look at residual plots before trusting the inference.

</details>

### Exercise 5.2: Tidy the lm output into a coefficient tibble

**Task:** The same pricing analyst now wants the coefficient table as a tidy tibble so it can join with other model summaries. Use `tidy()` from broom on the fitted model. Save the tidy tibble to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 2 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)    37.3      1.88      19.9  8.24e-19
#> 2 wt             -5.34     0.559     -9.56 1.29e-10
```

**Difficulty:** Intermediate

[HINTS]
Convert the model's coefficient table into a tidy tibble that can join with other summaries.
Apply tidy() from broom to fit.

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_5_2 <- tidy(fit)
ex_5_2
#> # A tibble: 2 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)    37.3      1.88      19.9  8.24e-19
#> 2 wt             -5.34     0.559     -9.56 1.29e-10
```

**Explanation:** broom's three core verbs convert model outputs into tibbles: `tidy()` for coefficients, `glance()` for one-row model-level statistics (R-squared, AIC), and `augment()` for per-row fitted values and residuals. This bridges the gap between R's stats objects and tidyverse workflows; without broom you would manually pull pieces from `summary(fit)$coefficients`.

</details>

### Exercise 5.3: Glance to grab model-level statistics

**Task:** A take-home interviewer wants the model R-squared, adjusted R-squared, AIC, and BIC for the same `lm(mpg ~ wt)` fit, in a single one-row tibble. Use `glance()` from broom. Save the result to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 1 x 12
#>   r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC   BIC deviance df.residual nobs
#>       <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1     0.753         0.745  3.05      91.4 1.29e-10     1  -80.0  166.  170.     278.          30    32
```

**Difficulty:** Intermediate

[HINTS]
Pull the one-row, model-level fit metrics rather than the per-coefficient table.
Apply glance() from broom to fit.

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_5_3 <- glance(fit)
ex_5_3
#> # A tibble: 1 x 12
#>   r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC   BIC deviance df.residual nobs
#>       <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1     0.753         0.745  3.05      91.4 1.29e-10     1  -80.0  166.  170.     278.          30    32
```

**Explanation:** `glance()` produces a single-row tibble of model fit metrics. The columns vary by model class: for `lm` you get R-squared and friends; for `glm` you get null and residual deviance. Because every model returns the same shape (one row), you can `bind_rows()` glance outputs across many models and rank them by AIC. This is the foundation of model-comparison workflows.

</details>

### Exercise 5.4: Augment to attach residuals to the data

**Task:** A diagnostic-checking workflow needs the fitted values and residuals on the original `mtcars` rows. Use `augment()` on the `lm(mpg ~ wt)` fit and save the augmented tibble to `ex_5_4`. Confirm by selecting `mpg`, `.fitted`, and `.resid`.

**Expected result:**

```
#> # A tibble: 32 x 3
#>     mpg .fitted .resid
#>   <dbl>   <dbl>  <dbl>
#> 1  21      23.3  -2.28
#> 2  21      21.9  -0.92
#> 3  22.8    24.9  -2.09
#> ...
#> # 29 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Attach the predicted values and residuals back onto the original rows.
Apply augment() from broom to fit.

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_5_4 <- # your code here
head(select(ex_5_4, mpg, .fitted, .resid), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_5_4 <- augment(fit)
head(select(ex_5_4, mpg, .fitted, .resid), 3)
#> # A tibble: 3 x 3
#>     mpg .fitted .resid
#>   <dbl>   <dbl>  <dbl>
#> 1  21      23.3  -2.28
#> 2  21      21.9  -0.92
#> 3  22.8    24.9  -2.09
```

**Explanation:** `augment()` attaches model-derived columns to the original data: `.fitted` (predicted), `.resid` (observed minus fitted), `.hat` (leverage), `.cooksd` (Cook's distance), and `.std.resid`. This is the tidy way to do residual diagnostics: pipe straight into `ggplot()` for a plot of fitted versus residuals. The `.` prefix prevents name clashes with the original columns.

</details>

### Exercise 5.5: Multiple regression with three predictors

**Task:** A scout building a more nuanced mpg model wants to control for cylinder count and horsepower as well as weight. Fit `mpg ~ wt + cyl + hp` on `mtcars` and tidy the coefficients with `tidy()`. Save the tidied tibble to `ex_5_5`.

**Expected result:**

```
#> # A tibble: 4 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  38.8       1.79      21.7  4.80e-19
#> 2 wt           -3.17      0.741     -4.28 2.00e- 4
#> 3 cyl          -0.942     0.551     -1.71 9.85e- 2
#> 4 hp           -0.0180    0.0119    -1.52 1.40e- 1
```

**Difficulty:** Intermediate

[HINTS]
Fit a model with three predictors at once, then convert its coefficients to a tibble.
Pipe lm(mpg ~ wt + cyl + hp, data = mtcars) into tidy().

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- lm(mpg ~ wt + cyl + hp, data = mtcars) |>
  tidy()
ex_5_5
#> # A tibble: 4 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  38.8       1.79      21.7  4.80e-19
#> 2 wt           -3.17      0.741     -4.28 2.00e- 4
#> 3 cyl          -0.942     0.551     -1.71 9.85e- 2
#> 4 hp           -0.0180    0.0119    -1.52 1.40e- 1
```

**Explanation:** Notice how the slope on `wt` shrank from -5.34 (simple) to -3.17 (multiple). That gap is the classic story of confounding: weight, cylinder count, and horsepower correlate, so the simple model attributed shared variance entirely to weight. The multiple-regression slope is the partial effect holding the others fixed. Always interpret coefficients in context of the included covariates.

</details>

### Exercise 5.6: Logistic regression on iris virginica vs others

**Task:** A botanist wants a logistic classifier that flags `Species == "virginica"` from `Petal.Length` alone in `iris`. Build the binary outcome, fit a `glm()` with `family = binomial`, and tidy the coefficients. Save the tidied tibble to `ex_5_6`.

**Expected result:**

```
#> # A tibble: 2 x 5
#>   term         estimate std.error statistic  p.value
#>   <chr>           <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)    -43.78    12.16     -3.60   3.17e-4
#> 2 Petal.Length     9.00     2.50      3.60   3.18e-4
```

**Difficulty:** Intermediate

[HINTS]
Fit a model for the binary outcome using the link family meant for 0/1 responses, then tidy it.
Use glm(is_virginica ~ Petal.Length, data = iris_bin, family = binomial) piped into tidy().

```r title="Your turn"
iris_bin <- iris |>
  mutate(is_virginica = as.integer(Species == "virginica"))

ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris_bin <- iris |>
  mutate(is_virginica = as.integer(Species == "virginica"))

ex_5_6 <- glm(is_virginica ~ Petal.Length, data = iris_bin, family = binomial) |>
  tidy()
ex_5_6
#> # A tibble: 2 x 5
#>   term         estimate std.error statistic  p.value
#>   <chr>           <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)    -43.78    12.16     -3.60   3.17e-4
#> 2 Petal.Length     9.00     2.50      3.60   3.18e-4
```

**Explanation:** Logistic regression models the log-odds of a binary outcome as a linear function of predictors. The coefficient 9.00 means each 1cm increase in petal length multiplies the odds of being virginica by `exp(9.00)`, an enormous shift. The intercept alone is hard to interpret; what matters is the predicted probability at meaningful petal lengths. Use `predict(fit, type = "response")` to convert log-odds to probabilities.

</details>

### Exercise 5.7: Hypothesis test with t.test on mpg by transmission

**Task:** A statistician asks whether automatic and manual transmission cars in `mtcars` have different mean `mpg`. Run a Welch two-sample `t.test()` and tidy the result with `tidy()`. Save the tidy tibble to `ex_5_7`.

**Expected result:**

```
#> # A tibble: 1 x 8
#>   estimate estimate1 estimate2 statistic  p.value parameter conf.low conf.high
#>      <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>    <dbl>     <dbl>
#> 1    -7.24      17.1      24.4     -3.77 0.00137       18.3   -11.3    -3.21
```

**Difficulty:** Intermediate

[HINTS]
Compare the two transmission groups' mean mileage with a two-sample test, then tidy the result.
Use t.test(mpg ~ am, data = mtcars) piped into tidy().

```r title="Your turn"
ex_5_7 <- # your code here
select(ex_5_7, estimate, statistic, p.value)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- t.test(mpg ~ am, data = mtcars) |>
  tidy()
select(ex_5_7, estimate, statistic, p.value)
#> # A tibble: 1 x 3
#>   estimate statistic  p.value
#>      <dbl>     <dbl>    <dbl>
#> 1    -7.24     -3.77 0.00137
```

**Explanation:** The formula interface `y ~ group` splits `y` by `group` and runs the two-sample test. The Welch variant does not assume equal variances, which is almost always the right default. A p-value of 0.0014 strongly rejects the null of equal means; the 95 percent confidence interval (-11.3, -3.2) tells you how much lower automatic mileage is than manual, and is more informative than the p-value alone.

</details>

### Exercise 5.8: ANOVA across iris species petal length

**Task:** A geneticist wants to know whether mean petal length differs across the three `iris` species. Fit `aov(Petal.Length ~ Species, data = iris)`, then tidy the ANOVA table. Save the tidy tibble to `ex_5_8`.

**Expected result:**

```
#> # A tibble: 2 x 6
#>   term         df  sumsq  meansq statistic   p.value
#>   <chr>     <dbl>  <dbl>   <dbl>     <dbl>     <dbl>
#> 1 Species       2 437.    219.       1180. 2.86e-91
#> 2 Residuals   147  27.2     0.185      NA  NA
```

**Difficulty:** Advanced

[HINTS]
Partition petal-length variance into between-species and within-species pieces, then tidy the table.
Use aov(Petal.Length ~ Species, data = iris) piped into tidy().

```r title="Your turn"
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- aov(Petal.Length ~ Species, data = iris) |>
  tidy()
ex_5_8
#> # A tibble: 2 x 6
#>   term         df  sumsq  meansq statistic   p.value
#>   <chr>     <dbl>  <dbl>   <dbl>     <dbl>     <dbl>
#> 1 Species       2 437.    219.       1180. 2.86e-91
#> 2 Residuals   147  27.2     0.185      NA  NA
```

**Explanation:** ANOVA partitions total variance into between-group (Species) and within-group (Residuals) components. The huge F-statistic 1180 and astronomically small p-value say species explains essentially all the variation in petal length. ANOVA only tells you "some group differs"; for pairwise comparisons, follow up with `TukeyHSD(aov_fit)` or `emmeans::pairs()` to control family-wise error rates.

</details>

---

## Section 6. Machine learning basics (5 problems)

### Exercise 6.1: Train/test split with sample

**Task:** A junior ML engineer needs a reproducible 80/20 train/test split of `iris` for a downstream classifier. Use `sample()` with a fixed seed to grab 80 percent of the row indices and produce a list with `$train` and `$test` tibbles. Save the list to `ex_6_1`.

**Expected result:**

```
#> $train rows: 120
#> $test  rows:  30
#> overlap: 0
```

**Difficulty:** Intermediate

[HINTS]
Draw a random 80 percent of the row indices, then split rows into a kept set and its complement.
Use sample(seq_len(nrow(iris)), size = 0.8 * nrow(iris)) for the index, then build list(train = iris[idx, ], test = iris[-idx, ]).

```r title="Your turn"
set.seed(2026)
ex_6_1 <- # your code here
nrow(ex_6_1$train); nrow(ex_6_1$test)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
idx <- sample(seq_len(nrow(iris)), size = 0.8 * nrow(iris))
ex_6_1 <- list(
  train = iris[idx, ],
  test  = iris[-idx, ]
)
nrow(ex_6_1$train); nrow(ex_6_1$test)
#> [1] 120
#> [1] 30
```

**Explanation:** Setting a seed makes the split reproducible across sessions and reviewers. The negative indexing `iris[-idx, ]` is a base-R idiom that drops the selected rows. For stratified splits that preserve class balance, you would group by the outcome before sampling. Cross-validation generalises this idea: instead of one split you make `k` of them and average performance, which gives a much less noisy estimate.

</details>

### Exercise 6.2: Fit a knn-style classifier with class package replacement

**Task:** An ML engineer wants the simplest possible classifier on iris: predict species by nearest-mean centroid in petal-length/petal-width space. Compute the per-species centroid means on the training fold from Exercise 6.1, then classify each test row to its nearest centroid by Euclidean distance. Save the test tibble with a `predicted` column to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 30 x 6
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species    predicted
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>      <chr>
#> 1          5.1         3.5          1.4         0.2 setosa     setosa
#> ...
#> # 29 more rows hidden
```

**Difficulty:** Advanced

[HINTS]
Run the provided per-row classifier across every test row and store its verdict in a new column.
Pipe test through rowwise(), then mutate(predicted = classify_one(cur_data())) and ungroup().

```r title="Your turn"
set.seed(2026)
idx <- sample(seq_len(nrow(iris)), size = 0.8 * nrow(iris))
train <- iris[idx, ]
test  <- iris[-idx, ]

centroids <- train |>
  group_by(Species) |>
  summarise(pl = mean(Petal.Length), pw = mean(Petal.Width), .groups = "drop")

classify_one <- function(row) {
  dists <- sqrt((centroids$pl - row$Petal.Length)^2 + (centroids$pw - row$Petal.Width)^2)
  as.character(centroids$Species[which.min(dists)])
}

ex_6_2 <- # your code here
head(ex_6_2, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
idx <- sample(seq_len(nrow(iris)), size = 0.8 * nrow(iris))
train <- iris[idx, ]
test  <- iris[-idx, ]

centroids <- train |>
  group_by(Species) |>
  summarise(pl = mean(Petal.Length), pw = mean(Petal.Width), .groups = "drop")

classify_one <- function(row) {
  dists <- sqrt((centroids$pl - row$Petal.Length)^2 + (centroids$pw - row$Petal.Width)^2)
  as.character(centroids$Species[which.min(dists)])
}

ex_6_2 <- test |>
  rowwise() |>
  mutate(predicted = classify_one(cur_data())) |>
  ungroup()
head(ex_6_2, 1)
#> # A tibble: 1 x 6
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species predicted
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>   <chr>
#> 1          5.1         3.5          1.4         0.2 setosa  setosa
```

**Explanation:** Nearest-mean classifiers (also called Rocchio classifiers) are the linear baseline you compare every fancier model against. They are equivalent to linear discriminant analysis with equal priors and equal isotropic covariances. The `rowwise()` step is the tidy way to apply a per-row function; vectorising with matrix algebra would be faster for tens of thousands of rows.

</details>

### Exercise 6.3: Confusion matrix and accuracy

**Task:** Continue from the centroid classifier in Exercise 6.2. A take-home interviewer expects you to summarise prediction quality with a confusion matrix and a single accuracy number. Use `table()` for the matrix and compute accuracy as the diagonal sum over the total. Save a list with `$matrix` and `$accuracy` to `ex_6_3`.

**Expected result:**

```
#> $matrix
#>             predicted
#> Species      setosa versicolor virginica
#>   setosa         10          0         0
#>   versicolor      0          8         1
#>   virginica       0          1        10
#>
#> $accuracy
#> [1] 0.933
```

**Difficulty:** Intermediate

[HINTS]
Cross-tabulate the true labels against the predicted ones, then divide correct counts by the total.
Build the matrix with table(), compute sum(diag(cm)) / sum(cm), and store both in a list().

```r title="Your turn"
# build ex_6_2 first as in Exercise 6.2
preds <- ex_6_2

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
preds <- ex_6_2
cm <- table(Species = preds$Species, predicted = preds$predicted)
acc <- sum(diag(cm)) / sum(cm)
ex_6_3 <- list(matrix = cm, accuracy = round(acc, 3))
ex_6_3
#> $matrix
#>             predicted
#> Species      setosa versicolor virginica
#>   setosa         10          0         0
#>   versicolor      0          8         1
#>   virginica       0          1        10
#>
#> $accuracy
#> [1] 0.933
```

**Explanation:** A confusion matrix counts every (true, predicted) pair. The diagonal is correct predictions; off-diagonals are errors. Accuracy is the simplest aggregate but is misleading under class imbalance; precision, recall, and F1 give a richer per-class picture. For a quick sanity check on a balanced three-class problem like iris, accuracy is fine.

</details>

### Exercise 6.4: k-means cluster on iris features

**Task:** An unsupervised analyst wants to see whether iris flowers cluster naturally into three groups based on the four numeric features alone, without using species labels. Run `kmeans(..., centers = 3)` after scaling, and save the kmeans object to `ex_6_4`. Compare cluster size against true species.

**Expected result:**

```
#> $size
#> [1] 50 47 53
#>
#> # cross-tab vs Species:
#>             cluster
#> Species       1  2  3
#>   setosa     50  0  0
#>   versicolor  0 39 11
#>   virginica   0  8 42
```

**Difficulty:** Intermediate

[HINTS]
With the features already scaled, partition the rows into three groups.
Call kmeans(features, centers = 3, nstart = 25).

```r title="Your turn"
features <- iris |>
  select(-Species) |>
  scale()

set.seed(2026)
ex_6_4 <- # your code here
ex_6_4$size
table(Species = iris$Species, cluster = ex_6_4$cluster)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
features <- iris |>
  select(-Species) |>
  scale()

set.seed(2026)
ex_6_4 <- kmeans(features, centers = 3, nstart = 25)
ex_6_4$size
#> [1] 50 47 53
table(Species = iris$Species, cluster = ex_6_4$cluster)
#>             cluster
#> Species       1  2  3
#>   setosa     50  0  0
#>   versicolor  0 39 11
#>   virginica   0  8 42
```

**Explanation:** k-means minimises within-cluster sum of squared distances to centroids. Always `scale()` first so columns measured in centimetres do not dominate columns measured in grams. `nstart = 25` runs 25 random initialisations and keeps the best; otherwise local minima can produce wildly different solutions. The cross-tab shows clusters align well with species except for the versicolor-virginica overlap, which is expected.

</details>

### Exercise 6.5: Cross-validated mean absolute error with manual k-fold

**Task:** A risk team needs an honest out-of-sample error estimate for `lm(mpg ~ wt + cyl + hp)` on `mtcars`. Implement a manual 5-fold cross-validation loop, compute mean absolute error on each held-out fold, and average. Save the per-fold MAE vector to `ex_6_5`.

**Expected result:**

```
#> [1] 1.96 2.74 1.62 2.88 1.59
#> mean MAE: 2.16
```

**Difficulty:** Advanced

[HINTS]
For each fold, train on the rest of the rows and measure average absolute error on the held-out part.
Loop over the folds with vapply(), fitting lm(mpg ~ wt + cyl + hp) and computing mean(abs(preds - test$mpg)).

```r title="Your turn"
set.seed(2026)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))

ex_6_5 <- # your code here
ex_6_5
mean(ex_6_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))

ex_6_5 <- vapply(1:5, function(k) {
  train <- mtcars[folds != k, ]
  test  <- mtcars[folds == k, ]
  fit   <- lm(mpg ~ wt + cyl + hp, data = train)
  preds <- predict(fit, newdata = test)
  mean(abs(preds - test$mpg))
}, numeric(1))
ex_6_5
#> [1] 1.96 2.74 1.62 2.88 1.59
round(mean(ex_6_5), 2)
#> [1] 2.16
```

**Explanation:** Cross-validation breaks the data into k folds; each fold takes a turn as the held-out test set while the others train. Averaging k MAE estimates gives a much lower-variance estimate of out-of-sample error than a single train/test split, especially on small datasets like `mtcars`. `vapply()` enforces the numeric scalar return type, which catches subtle bugs that `sapply()` would silently swallow.

</details>

---

## Section 7. Communicating results (5 problems)

### Exercise 7.1: Format a tibble with kable for a report

**Task:** A reporting analyst wraps up the per-class median mileage table from Exercise 3.4 for a board memo and wants a clean markdown-ready table with two-decimal numbers. Use `kable()` from knitr with `digits = 2`. Save the rendered kable object to `ex_7_1`.

**Expected result:**

```
#>
#> |class      | median_cty| median_hwy|
#> |:----------|----------:|----------:|
#> |2seater    |      15.00|      24.50|
#> |compact    |      20.00|      27.00|
#> |midsize    |      18.00|      27.00|
#> |minivan    |      15.50|      23.00|
#> |pickup     |      13.00|      17.00|
#> |subcompact |      19.00|      26.00|
#> |suv        |      13.00|      17.00|
```

**Difficulty:** Beginner

[HINTS]
Render the summary tibble as a report-ready table with numbers fixed to two decimals.
Call kable() from knitr with digits = 2 on summary_tbl.

```r title="Your turn"
summary_tbl <- mpg |>
  group_by(class) |>
  summarise(median_cty = median(cty), median_hwy = median(hwy), .groups = "drop")

ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
summary_tbl <- mpg |>
  group_by(class) |>
  summarise(median_cty = median(cty), median_hwy = median(hwy), .groups = "drop")

ex_7_1 <- kable(summary_tbl, digits = 2)
ex_7_1
#>
#> |class      | median_cty| median_hwy|
#> |:----------|----------:|----------:|
#> |2seater    |      15.00|      24.50|
#> |compact    |      20.00|      27.00|
#> ...
```

**Explanation:** `kable()` is the minimum viable table renderer for R Markdown, Quarto, and most static-site pipelines. It accepts the same `format` argument as the parent document expects (`"markdown"`, `"html"`, `"latex"`). For polished tables with merged headers, conditional cell colours, or footnotes, layer on the `kableExtra` package. For interactive tables, swap in `DT::datatable()` or `reactable`.

</details>

### Exercise 7.2: Build a summary tibble of three model glances

**Task:** A compliance officer reviewing a model selection memo wants the three competing `mtcars` mpg models compared side-by-side on R-squared and AIC. Glance each model (`mpg ~ wt`, `mpg ~ wt + cyl`, `mpg ~ wt + cyl + hp`) and `bind_rows()` the results with a `model` label. Save the comparison tibble to `ex_7_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   model            r.squared adj.r.squared    AIC
#>   <chr>                <dbl>         <dbl>  <dbl>
#> 1 wt only              0.753         0.745   166.
#> 2 wt + cyl             0.830         0.819   158.
#> 3 wt + cyl + hp        0.843         0.826   158.
```

**Difficulty:** Intermediate

[HINTS]
Get a one-row metric summary from each model, stack them into one tibble, and keep a label column.
Use bind_rows(lapply(fits, glance), .id = "model"), then select() the metric columns.

```r title="Your turn"
fits <- list(
  "wt only"       = lm(mpg ~ wt, data = mtcars),
  "wt + cyl"      = lm(mpg ~ wt + cyl, data = mtcars),
  "wt + cyl + hp" = lm(mpg ~ wt + cyl + hp, data = mtcars)
)

ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fits <- list(
  "wt only"       = lm(mpg ~ wt, data = mtcars),
  "wt + cyl"      = lm(mpg ~ wt + cyl, data = mtcars),
  "wt + cyl + hp" = lm(mpg ~ wt + cyl + hp, data = mtcars)
)

ex_7_2 <- bind_rows(lapply(fits, glance), .id = "model") |>
  select(model, r.squared, adj.r.squared, AIC)
ex_7_2
#> # A tibble: 3 x 4
#>   model            r.squared adj.r.squared    AIC
#>   <chr>                <dbl>         <dbl>  <dbl>
#> 1 wt only              0.753         0.745   166.
#> 2 wt + cyl             0.830         0.819   158.
#> 3 wt + cyl + hp        0.843         0.826   158.
```

**Explanation:** The `.id = "model"` argument to `bind_rows()` lifts the list names into a new column, which is the standard way to label per-model rows after a `lapply(fits, glance)`. Use adjusted R-squared, not raw R-squared, when comparing models with different numbers of predictors; AIC penalises complexity more aggressively and is preferred for nested-model selection.

</details>

### Exercise 7.3: Sentence-case a column with str_to_title

**Task:** A customer-success team has a `name` column in screaming uppercase from a legacy CRM and wants it title-cased for personalised emails. Use `str_to_title()` from stringr on an inline tibble. Save the cleaned tibble to `ex_7_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   id    name
#>   <chr> <chr>
#> 1 c1    Ada Lovelace
#> 2 c2    Grace Hopper
#> 3 c3    Alan Turing
```

**Difficulty:** Beginner

[HINTS]
Convert the screaming-uppercase names so only each word's first letter stays capitalised.
Inside mutate(), apply str_to_title() to the name column.

```r title="Your turn"
crm <- tibble(id = c("c1","c2","c3"), name = c("ADA LOVELACE","GRACE HOPPER","ALAN TURING"))

ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
crm <- tibble(id = c("c1","c2","c3"), name = c("ADA LOVELACE","GRACE HOPPER","ALAN TURING"))

ex_7_3 <- crm |>
  mutate(name = str_to_title(name))
ex_7_3
#> # A tibble: 3 x 2
#>   id    name
#>   <chr> <chr>
#> 1 c1    Ada Lovelace
#> 2 c2    Grace Hopper
#> 3 c3    Alan Turing
```

**Explanation:** stringr provides a coherent family of case converters: `str_to_lower()`, `str_to_upper()`, `str_to_title()` (every word capitalised), and `str_to_sentence()` (first word only). These respect locale rules, so they handle Turkish dotted-I and similar edge cases that the base `toupper()` mishandles. For cleaning user-entered names always combine with `str_squish()` to collapse internal whitespace.

</details>

### Exercise 7.4: Top-five table sorted by a metric

**Task:** A performance reviewer wants the top 5 most-economical cars in `mtcars` by `mpg`, formatted with `kable()` and including the car name from the rownames. Use `arrange()`, `slice_head(n = 5)`, and `kable()`. Save the rendered kable to `ex_7_4`.

**Expected result:**

```
#>
#> |car             |  mpg|    wt|  hp|
#> |:---------------|----:|-----:|---:|
#> |Toyota Corolla  | 33.9| 1.835|  65|
#> |Fiat 128        | 32.4| 2.200|  66|
#> |Honda Civic     | 30.4| 1.615|  52|
#> |Lotus Europa    | 30.4| 1.513| 113|
#> |Fiat X1-9       | 27.3| 1.935|  66|
```

**Difficulty:** Intermediate

[HINTS]
Sort by mileage descending, keep the first five rows, trim the columns, and render a table.
Chain arrange(desc(mpg)), slice_head(n = 5), select(car, mpg, wt, hp), and kable().

```r title="Your turn"
mtcars_named <- mtcars |>
  tibble::rownames_to_column("car")

ex_7_4 <- # your code here
ex_7_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mtcars_named <- mtcars |>
  tibble::rownames_to_column("car")

ex_7_4 <- mtcars_named |>
  arrange(desc(mpg)) |>
  slice_head(n = 5) |>
  select(car, mpg, wt, hp) |>
  kable(digits = 3)
ex_7_4
#>
#> |car             |  mpg|    wt|  hp|
#> |:---------------|----:|-----:|---:|
#> |Toyota Corolla  | 33.9| 1.835|  65|
#> |Fiat 128        | 32.4| 2.200|  66|
#> |Honda Civic     | 30.4| 1.615|  52|
#> |Lotus Europa    | 30.4| 1.513| 113|
#> |Fiat X1-9       | 27.3| 1.935|  66|
```

**Explanation:** `rownames_to_column()` is the bridge from row-name-indexed data frames to tidy tibbles; the inverse is `column_to_rownames()`. `slice_head(n = 5)` is the modern, type-safe replacement for `head(5)` on grouped tibbles, and `slice_max(mpg, n = 5)` is even cleaner if you do not need to pre-sort. Selecting only the columns the reader cares about before rendering keeps the final memo readable.

</details>

### Exercise 7.5: Save a ggplot to a file with ggsave

**Task:** A reporting analyst has a polished plot from Exercise 4.9 and wants to drop a 6-by-4-inch PDF copy into a shared folder. Use `ggsave()` with explicit `width`, `height`, and `units`. Save the saved-file path string to `ex_7_5`. Use `tempfile()` so the example is portable.

**Expected result:**

```
#> [1] "/tmp/RtmpXXXX/file12345.pdf"
#> # file exists: TRUE
```

**Difficulty:** Advanced

[HINTS]
Write the plot object out to a portable temporary file at a fixed physical size.
Call ggsave() with a tempfile(fileext = ".pdf") path plus explicit width, height, and units.

```r title="Your turn"
plot_obj <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  theme_minimal()

ex_7_5 <- # your code here
ex_7_5
file.exists(ex_7_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plot_obj <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  theme_minimal()

ex_7_5 <- tempfile(fileext = ".pdf")
ggsave(ex_7_5, plot = plot_obj, width = 6, height = 4, units = "in")
ex_7_5
#> [1] "/tmp/RtmpXXXX/file12345.pdf"
file.exists(ex_7_5)
#> [1] TRUE
```

**Explanation:** `ggsave()` infers the file format from the extension, so `.pdf`, `.png`, `.svg`, and `.jpg` all just work. Specify `width` and `height` explicitly: the defaults match the current graphics device, which is rarely what you want. PDFs are vector-format and infinitely zoomable, the right choice for slide decks and printed reports; PNGs at 300 dpi (`dpi = 300`) are the right choice for web embeds.

</details>

---

## What to do next

- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html): deeper drills on dplyr verbs, joins, and grouped summaries.
- [EDA Exercises in R](EDA-Exercises-in-R.html): structured exploratory analysis problems on real-world datasets.
- [Data Visualization Exercises in R](Data-Visualization-Exercises-in-R.html): more ggplot2 polish, themes, and chart-type drills.
- [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html): supervised and unsupervised problems with tidy workflows.
