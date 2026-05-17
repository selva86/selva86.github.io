---
title: "tidyr Exercises in R: 30 Real-World Practice Problems"
slug: "tidyr-Exercises-in-R"
description: "tidyr exercises in R: 30 hands-on practice problems covering pivot_longer, pivot_wider, separate, unite, fill, complete, nest and unnest. Solutions hidden."
keywords: "tidyr exercises, tidyr practice, pivot_longer in R, pivot_wider in R, separate in R, fill in R, complete in R, nest unnest practice"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "tidyr Exercises"
sidebar_order: 110
fr_parent: "R-Tutorial.html"
auto_link_terms: "tidyr exercises|tidyr practice|practice tidyr|pivot_longer practice|pivot_wider practice|tidyr problems"
auto_link_case_sensitive: false
target_keyword: "tidyr exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# tidyr Exercises in R: 30 Real-World Practice Problems

<p class="lead">Thirty practice problems on the tidyr verbs that move data between shapes: pivot_longer, pivot_wider, separate, unite, fill, complete, drop_na, replace_na, nest, and unnest. Each exercise embeds a realistic data task, with the expected output stated up front and the solution hidden until you click to reveal.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(ggplot2)
library(tibble)
library(purrr)
library(stringr)
library(broom)
```

## Section 1. Pivot longer: wide-to-long reshaping (5 problems)

### Exercise 1.1: Pivot three numeric columns of mtcars into long format

**Task:** A reporting analyst wants a tidy long-format slice of the `mtcars` dataset showing model, metric, and value for the columns `mpg`, `cyl`, and `hp`. Take the first five rows of `mtcars`, push the row names into a `model` column, then pivot the three metrics into key-value pairs and save to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 15 x 3
#>    model             metric value
#>    <chr>             <chr>  <dbl>
#>  1 Mazda RX4         mpg     21
#>  2 Mazda RX4         cyl      6
#>  3 Mazda RX4         hp     110
#>  4 Mazda RX4 Wag     mpg     21
#>  5 Mazda RX4 Wag     cyl      6
#>  6 Mazda RX4 Wag     hp     110
#>  7 Datsun 710        mpg     22.8
#>  8 Datsun 710        cyl      4
#>  9 Datsun 710        hp      93
#> 10 Hornet 4 Drive    mpg     21.4
#> # ... 5 more rows
```

**Difficulty:** Beginner

[HINTS]
The row names are not a column yet, so promote them first; then collapse the three metric columns into one name column and one value column.
Chain `rownames_to_column("model")`, `slice_head(n = 5)`, `select()`, then `pivot_longer()` with `names_to` and `values_to`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mtcars |>
  rownames_to_column("model") |>
  slice_head(n = 5) |>
  select(model, mpg, cyl, hp) |>
  pivot_longer(cols = c(mpg, cyl, hp), names_to = "metric", values_to = "value")

ex_1_1
#> # A tibble: 15 x 3
#>    model         metric value
#>    <chr>         <chr>  <dbl>
#>  1 Mazda RX4     mpg     21
#>  2 Mazda RX4     cyl      6
#>  ...
```

**Explanation:** `pivot_longer()` collapses several columns into two: a names column (`metric`) holding the original column names and a values column (`value`) holding the cells. Use it whenever each row should represent one observation of one variable. The `cols` argument accepts tidy-select helpers like `starts_with()` or `where(is.numeric)` when the column list is large.

</details>

### Exercise 1.2: Reshape all iris measurements into a single value column

**Task:** A statistics tutor wants `iris` in long form so they can facet a ggplot by measurement. Pivot every numeric column (`Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`) into a long table keeping `Species` intact, and save the result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 600 x 3
#>    Species measurement  value
#>    <fct>   <chr>        <dbl>
#>  1 setosa  Sepal.Length   5.1
#>  2 setosa  Sepal.Width    3.5
#>  3 setosa  Petal.Length   1.4
#>  4 setosa  Petal.Width    0.2
#>  5 setosa  Sepal.Length   4.9
#>  6 setosa  Sepal.Width    3
#>  ...
#> # 594 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Every measurement column should stack into a single value column while the species label stays untouched on each row.
Call `pivot_longer()` with `cols = -Species`, `names_to = "measurement"`, and `values_to = "value"`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- iris |>
  as_tibble() |>
  pivot_longer(cols = -Species, names_to = "measurement", values_to = "value")

ex_1_2
#> # A tibble: 600 x 3
#>    Species measurement  value
#>    <fct>   <chr>        <dbl>
#>  1 setosa  Sepal.Length   5.1
#>  2 setosa  Sepal.Width    3.5
#>  ...
```

**Explanation:** Using `cols = -Species` is a negative tidy-select: pivot every column except `Species`. It is more maintainable than spelling out the four numeric columns because adding a new metric to the source no longer breaks the pipeline. `where(is.numeric)` is an equivalent guard that excludes the factor automatically.

</details>

### Exercise 1.3: Pivot wide exam scores into a per-student long table

**Task:** A junior analyst has a wide exam tibble where each student row holds `math`, `science`, and `english` scores. Build the tibble inline, then pivot it longer so each row is one student-subject-score combination, ordered by `student`. Save the result to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 9 x 3
#>   student subject score
#>   <chr>   <chr>   <dbl>
#> 1 Alice   math       88
#> 2 Alice   science    72
#> 3 Alice   english    91
#> 4 Bob     math       64
#> 5 Bob     science    80
#> 6 Bob     english    77
#> 7 Carla   math       95
#> 8 Carla   science    89
#> 9 Carla   english    84
```

**Difficulty:** Intermediate

[HINTS]
Each subject column should become a row, with the student identifier carried along into every new row.
Call `pivot_longer()` with `cols = -student`, `names_to = "subject"`, and `values_to = "score"`.

```r title="Your turn"
scores_wide <- tibble(
  student = c("Alice", "Bob", "Carla"),
  math    = c(88, 64, 95),
  science = c(72, 80, 89),
  english = c(91, 77, 84)
)

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores_wide <- tibble(
  student = c("Alice", "Bob", "Carla"),
  math    = c(88, 64, 95),
  science = c(72, 80, 89),
  english = c(91, 77, 84)
)

ex_1_3 <- scores_wide |>
  pivot_longer(cols = -student, names_to = "subject", values_to = "score")

ex_1_3
#> # A tibble: 9 x 3
#>   student subject score
#>   <chr>   <chr>   <dbl>
#> 1 Alice   math       88
#> ...
```

**Explanation:** This is the classic gradebook reshape. The wide layout is good for entering data but bad for analysis: you cannot easily filter on subject or join in a per-subject pass mark. The long layout has one observation per row, which is what dplyr `group_by(subject)` and ggplot `facet_wrap(~subject)` expect.

</details>

### Exercise 1.4: Use names_sep to split a compound header during pivot

**Task:** A marketing analyst pulled a campaign report where columns are named like `clicks_jan`, `clicks_feb`, `signups_jan`, `signups_feb`. Pivot longer in a single call, splitting each header on the underscore into two new columns `metric` and `month`, and save to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 8 x 4
#>   campaign  metric  month value
#>   <chr>     <chr>   <chr> <dbl>
#> 1 A         clicks  jan     120
#> 2 A         clicks  feb     150
#> 3 A         signups jan      18
#> 4 A         signups feb      24
#> 5 B         clicks  jan      90
#> 6 B         clicks  feb     110
#> 7 B         signups jan       9
#> 8 B         signups feb      14
```

**Difficulty:** Intermediate

[HINTS]
Each header carries two facts joined by a delimiter, so the reshape can split them apart as it pivots.
Pass a two-element vector to `names_to` and set `names_sep = "_"` inside `pivot_longer()`.

```r title="Your turn"
camp <- tibble(
  campaign     = c("A", "B"),
  clicks_jan   = c(120, 90),
  clicks_feb   = c(150, 110),
  signups_jan  = c(18, 9),
  signups_feb  = c(24, 14)
)

ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- camp |>
  pivot_longer(
    cols = -campaign,
    names_to = c("metric", "month"),
    names_sep = "_",
    values_to = "value"
  )

ex_1_4
#> # A tibble: 8 x 4
#>   campaign metric  month value
#>   <chr>    <chr>   <chr> <dbl>
#> 1 A        clicks  jan     120
#> ...
```

**Explanation:** When column names encode two pieces of information separated by a delimiter, pass a character vector to `names_to` and a delimiter to `names_sep`. tidyr applies the split during the pivot so you skip a follow-up `separate()` step. For more complex headers, use `names_pattern` with a capture-group regex.

</details>

### Exercise 1.5: Parse multi-variable column names with names_pattern

**Task:** A public-health analyst has aggregated TB counts coded in the WHO-style header `new_sp_m65` (new cases, smear-positive, male, age 65 plus). Given a small inline tibble with four such columns, pivot longer and split the header into `diagnosis`, `gender`, and `age` columns using `names_pattern`. Save to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 8 x 5
#>   country diagnosis gender age   cases
#>   <chr>   <chr>     <chr>  <chr> <int>
#> 1 IND     sp        m      65       12
#> 2 IND     sp        f      65        7
#> 3 IND     ep        m      65        3
#> 4 IND     ep        f      65        2
#> 5 PAK     sp        m      65        9
#> 6 PAK     sp        f      65        5
#> 7 PAK     ep        m      65        1
#> 8 PAK     ep        f      65        4
```

**Difficulty:** Advanced

[HINTS]
When a header is not a clean delimiter join, a regex with one capture group per output column can pull each piece apart.
Call `pivot_longer()` with a three-element `names_to` and a `names_pattern` regex containing three capture groups.

```r title="Your turn"
tb <- tibble(
  country     = c("IND", "PAK"),
  new_sp_m65  = c(12, 9),
  new_sp_f65  = c(7, 5),
  new_ep_m65  = c(3, 1),
  new_ep_f65  = c(2, 4)
)

ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- tb |>
  pivot_longer(
    cols = -country,
    names_to = c("diagnosis", "gender", "age"),
    names_pattern = "new_(\\w+)_(m|f)(\\d+)",
    values_to = "cases"
  )

ex_1_5
#> # A tibble: 8 x 5
#>   country diagnosis gender age   cases
#>   <chr>   <chr>     <chr>  <chr> <dbl>
#> 1 IND     sp        m      65       12
#> ...
```

**Explanation:** `names_pattern` accepts a regex with one capture group per output column. The three groups `(\\w+)`, `(m|f)`, and `(\\d+)` map onto `diagnosis`, `gender`, and `age` in order. Use this pattern when the header is not a clean delimiter join: a regex captures arbitrary structure. The age column comes back as character; cast with `as.integer()` if you need numeric.

</details>

## Section 2. Pivot wider: long-to-wide reshaping (5 problems)

### Exercise 2.1: Average ChickWeight by Diet across time

**Task:** A nutrition team needs a wide summary of `ChickWeight` where each column is a diet and each row is a time point holding the mean chick weight. Group by `Time` and `Diet`, average the weight, then pivot the four diets into columns. Save to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 12 x 5
#>     Time    `1`    `2`    `3`    `4`
#>    <dbl>  <dbl>  <dbl>  <dbl>  <dbl>
#>  1     0   41.4   40.7   40.8   41.0
#>  2     2   47.2   49.4   50.4   51.8
#>  3     4   56.5   59.8   62.2   64.5
#>  4     6   66.8   75.4   77.9   83.9
#>  5     8   79.7   91.7   98.4  105.6
#>  6    10   93.1  108.5  123.4  126.0
#>  7    12  108.5  131.3  150.6  151.4
#>  8    14  123.4  141.2  174.9  166.7
#>  ...
```

**Difficulty:** Beginner

[HINTS]
Average the weights for each time-and-diet pair first, then lift the diet labels out into their own columns.
After `group_by()` and `summarise(mean(...))`, call `pivot_wider()` with `names_from = Diet` and `values_from`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ChickWeight |>
  group_by(Time, Diet) |>
  summarise(mean_weight = mean(weight), .groups = "drop") |>
  pivot_wider(names_from = Diet, values_from = mean_weight)

ex_2_1
#> # A tibble: 12 x 5
#>    Time   `1`   `2`   `3`   `4`
#>    <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1     0  41.4  40.7  40.8  41.0
#> ...
```

**Explanation:** `pivot_wider()` is the inverse of `pivot_longer()`: it lifts the values in one column out into new columns. Aggregate first, then pivot, so each (Time, Diet) cell has a single value. Without summarising you would get a list-column or a values_fn warning because some combinations have multiple chicks.

</details>

### Exercise 2.2: Build a quarterly sales matrix from a long ledger

**Task:** A finance team keeps a long-format sales tibble with `region`, `quarter`, and `sales`. Pivot it to a wide matrix where regions are rows and quarters Q1 to Q4 are columns, with each cell holding the recorded sale. Save to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   region    Q1    Q2    Q3    Q4
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 East     120   135   140   160
#> 2 North    100   110   130   125
#> 3 West      80    95   105   120
```

**Difficulty:** Intermediate

[HINTS]
Each quarter label should become a column heading, with the recorded sale dropped into the cell.
Call `pivot_wider()` with `names_from = quarter` and `values_from = sales`.

```r title="Your turn"
sales <- tibble(
  region  = rep(c("East", "North", "West"), each = 4),
  quarter = rep(c("Q1", "Q2", "Q3", "Q4"), times = 3),
  sales   = c(120, 135, 140, 160, 100, 110, 130, 125, 80, 95, 105, 120)
)

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- sales |>
  pivot_wider(names_from = quarter, values_from = sales)

ex_2_2
#> # A tibble: 3 x 5
#>   region    Q1    Q2    Q3    Q4
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 East     120   135   140   160
#> 2 North    100   110   130   125
#> 3 West      80    95   105   120
```

**Explanation:** The wide layout is the right shape for a stakeholder report because each row is one region and each column is one period. Notice tidyr preserves the order of quarter values as it encountered them in the data. To force a specific column order, set `quarter` to a factor with the right levels before pivoting.

</details>

### Exercise 2.3: Pivot ToothGrowth mean length by dose within supplement

**Task:** A pharmacology team is comparing dose-response curves for two supplements in `ToothGrowth`. Group by `supp` and `dose`, take the mean tooth length, then pivot doses into columns prefixed `dose_` so each row is one supplement with three dose readings. Save to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   supp  dose_0.5 dose_1 dose_2
#>   <fct>    <dbl>  <dbl>  <dbl>
#> 1 OJ        13.2   22.7   26.1
#> 2 VC         7.98  16.8   26.1
```

**Difficulty:** Intermediate

[HINTS]
Summarise the mean length per supplement-and-dose pair, then turn the doses into prefixed columns.
Use `pivot_wider()` with `names_from = dose`, `values_from`, and `names_prefix = "dose_"`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ToothGrowth |>
  group_by(supp, dose) |>
  summarise(mean_len = mean(len), .groups = "drop") |>
  pivot_wider(names_from = dose, values_from = mean_len, names_prefix = "dose_")

ex_2_3
#> # A tibble: 2 x 4
#>   supp  dose_0.5 dose_1 dose_2
#>   <fct>    <dbl>  <dbl>  <dbl>
#> 1 OJ       13.2   22.7   26.1
#> 2 VC        7.98  16.8   26.1
```

**Explanation:** `names_prefix` is useful when the source values are numeric like 0.5, 1, 2; without a prefix the new columns would be named with backtick-needing tokens. Two equivalent customisations: `names_glue = "dose_{dose}"` for templated output, or convert `dose` to a string before pivot for full control.

</details>

### Exercise 2.4: Pivot two value columns simultaneously into wide format

**Task:** A trading desk wants daily price AND volume side by side for two tickers across three dates. Starting from a long tibble with one row per ticker-date, pivot both `price` and `volume` so each date becomes a pair of columns named like `price_2026-04-01` and `volume_2026-04-01`. Save to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 2 x 7
#>   ticker `price_2026-04-01` `price_2026-04-02` `price_2026-04-03` `volume_2026-04-01` `volume_2026-04-02` `volume_2026-04-03`
#>   <chr>               <dbl>              <dbl>              <dbl>               <dbl>               <dbl>               <dbl>
#> 1 AAPL                  185                187                190                 1.2                 1.4                 1.1
#> 2 MSFT                  410                412                415                 0.8                 0.9                 0.7
```

**Difficulty:** Advanced

[HINTS]
Both metrics should spread across the dates at once, producing one column group per metric.
Call `pivot_wider()` with `names_from = date` and a vector `values_from = c(price, volume)`.

```r title="Your turn"
prices <- tibble(
  ticker = rep(c("AAPL", "MSFT"), each = 3),
  date   = rep(c("2026-04-01", "2026-04-02", "2026-04-03"), 2),
  price  = c(185, 187, 190, 410, 412, 415),
  volume = c(1.2, 1.4, 1.1, 0.8, 0.9, 0.7)
)

ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- prices |>
  pivot_wider(
    names_from = date,
    values_from = c(price, volume)
  )

ex_2_4
#> # A tibble: 2 x 7
#>   ticker price_2026-04-01 price_2026-04-02 ... volume_2026-04-03
#>   <chr>             <dbl>            <dbl>                 <dbl>
#> 1 AAPL                185              187                   1.1
#> 2 MSFT                410              412                   0.7
```

**Explanation:** Passing a vector to `values_from` tells `pivot_wider()` to spread each value column into its own group of new columns. The default column names take the form `{values_from}_{names_from}`, which is configurable via `names_glue`. This is the right move when reports need parallel metrics per period.

</details>

### Exercise 2.5: Control wide column names with names_glue

**Task:** A growth team wants a polished campaign report where the spread columns are named like `Q1_2026_revenue` rather than the default `revenue_Q1_2026`. Reshape the long quarterly tibble using `names_glue` to assemble that order, sorted ticker, and save to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 2 x 5
#>   product Q1_2026_revenue Q2_2026_revenue Q3_2026_revenue Q4_2026_revenue
#>   <chr>             <dbl>           <dbl>           <dbl>           <dbl>
#> 1 Basic              200             250             300             280
#> 2 Pro                450             520             600             650
```

**Difficulty:** Advanced

[HINTS]
A glue-style template lets you dictate the exact order of the pieces in each new column name.
Use `pivot_wider()` with `names_from = quarter`, `values_from = revenue`, and `names_glue = "{quarter}_revenue"`.

```r title="Your turn"
rev <- tibble(
  product = rep(c("Basic", "Pro"), each = 4),
  quarter = rep(c("Q1_2026", "Q2_2026", "Q3_2026", "Q4_2026"), 2),
  revenue = c(200, 250, 300, 280, 450, 520, 600, 650)
)

ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- rev |>
  pivot_wider(
    names_from = quarter,
    values_from = revenue,
    names_glue = "{quarter}_revenue"
  )

ex_2_5
#> # A tibble: 2 x 5
#>   product Q1_2026_revenue Q2_2026_revenue Q3_2026_revenue Q4_2026_revenue
#>   <chr>             <dbl>           <dbl>           <dbl>           <dbl>
#> 1 Basic               200             250             300             280
#> 2 Pro                 450             520             600             650
```

**Explanation:** `names_glue` accepts a glue-style template that references variables from `names_from` and the literal `.value` placeholder when multiple value columns exist. It is the cleanest way to enforce a strict naming convention for downstream consumers like BI tools, where stable column names are part of the contract.

</details>

## Section 3. Split, unite, and extract columns (5 problems)

### Exercise 3.1: Split a "Last, First" name field into two columns

**Task:** An HR analyst received a roster with a single `full_name` column formatted as "Doe, Jane". Use `separate_wider_delim()` to split on the comma plus space and produce clean `last_name` and `first_name` columns. Save the resulting tibble to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   last_name first_name
#>   <chr>     <chr>
#> 1 Doe       Jane
#> 2 Smith     Aaron
#> 3 Patel     Riya
```

**Difficulty:** Beginner

[HINTS]
The single name field holds two pieces joined by a comma, so a delimiter split gives two clean columns.
Call `separate_wider_delim()` with `delim = ", "` and `names = c("last_name", "first_name")`.

```r title="Your turn"
roster <- tibble(full_name = c("Doe, Jane", "Smith, Aaron", "Patel, Riya"))

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- roster |>
  separate_wider_delim(
    full_name,
    delim = ", ",
    names = c("last_name", "first_name")
  )

ex_3_1
#> # A tibble: 3 x 2
#>   last_name first_name
#>   <chr>     <chr>
#> 1 Doe       Jane
#> ...
```

**Explanation:** `separate_wider_delim()` is the modern replacement for `separate()`. The "wider" suffix signals that the result grows columns rather than rows. Use the `too_few` and `too_many` arguments to control what happens when a row has an unexpected number of pieces. The retired `separate()` still works but emits a deprecation note.

</details>

### Exercise 3.2: Combine year, month, day columns into an ISO date string

**Task:** A reporting analyst has a tibble with three integer columns `yr`, `mo`, `dy` and needs a single `date` column formatted as YYYY-MM-DD for export to a CSV. Use `unite()` with a hyphen separator, drop the source columns, and save to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 4 x 1
#>   date
#>   <chr>
#> 1 2026-01-15
#> 2 2026-02-03
#> 3 2026-02-28
#> 4 2026-03-10
```

**Difficulty:** Intermediate

[HINTS]
Three columns need to be glued into one date string with a separator between the parts.
Use `unite()` with `col = "date"`, the three source columns, `sep = "-"`, and `remove = TRUE`.

```r title="Your turn"
calendar <- tibble(
  yr = c(2026, 2026, 2026, 2026),
  mo = c("01", "02", "02", "03"),
  dy = c("15", "03", "28", "10")
)

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- calendar |>
  unite(col = "date", yr, mo, dy, sep = "-", remove = TRUE)

ex_3_2
#> # A tibble: 4 x 1
#>   date
#>   <chr>
#> 1 2026-01-15
#> ...
```

**Explanation:** `unite()` is the inverse of `separate()`: it concatenates columns with a separator. Setting `remove = TRUE` discards the source columns once united. If month and day are stored as integers, format them with `sprintf("%02d", ...)` first to keep the leading zero. For real date conversion, pipe through `as.Date()`.

</details>

### Exercise 3.3: Parse a SKU code with separate_wider_regex

**Task:** A retail analyst inherits a sales table with an opaque `sku` column like "AB-1234-XL" coding a brand, a numeric ID, and a size. Use `separate_wider_regex()` to extract the three components into `brand`, `sku_id`, and `size` columns and save to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   brand sku_id size
#>   <chr> <chr>  <chr>
#> 1 AB    1234   XL
#> 2 CD    9876   M
#> 3 EF    0042   S
```

**Difficulty:** Intermediate

[HINTS]
The code has a fixed brand-id-size structure, so a pattern with one named piece per component extracts it cleanly.
Call `separate_wider_regex()` with a `patterns` vector naming `brand`, `sku_id`, and `size`, with unnamed strings for the hyphens.

```r title="Your turn"
products <- tibble(sku = c("AB-1234-XL", "CD-9876-M", "EF-0042-S"))

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- products |>
  separate_wider_regex(
    sku,
    patterns = c(brand = "[A-Z]+", "-", sku_id = "\\d+", "-", size = "[A-Z]+")
  )

ex_3_3
#> # A tibble: 3 x 3
#>   brand sku_id size
#>   <chr> <chr>  <chr>
#> 1 AB    1234   XL
#> ...
```

**Explanation:** `separate_wider_regex()` is more reliable than a hand-rolled regex with capture groups when the field has fixed structure. Each named element becomes a new column; unnamed strings are matched and discarded (the hyphens here). The function fails loudly on rows that do not match, which catches bad inputs early in a pipeline.

</details>

### Exercise 3.4: Expand a semicolon-separated tags column with separate_longer_delim

**Task:** A product team stores article tags in a single string column like "r;tidyverse;data". Use `separate_longer_delim()` on a sample tibble of three articles so each tag becomes its own row, preserving the article ID. Save to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 8 x 2
#>   article_id tag
#>        <int> <chr>
#> 1          1 r
#> 2          1 tidyverse
#> 3          1 data
#> 4          2 r
#> 5          2 ggplot2
#> 6          3 sql
#> 7          3 etl
#> 8          3 cloud
```

**Difficulty:** Intermediate

[HINTS]
Each delimited token in the tags string should expand into its own row, with the article id recycled.
Use `separate_longer_delim()` on the `tag` column with `delim = ";"`.

```r title="Your turn"
articles <- tibble(
  article_id = 1:3,
  tag        = c("r;tidyverse;data", "r;ggplot2", "sql;etl;cloud")
)

ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- articles |>
  separate_longer_delim(tag, delim = ";")

ex_3_4
#> # A tibble: 8 x 2
#>   article_id tag
#>        <int> <chr>
#> 1          1 r
#> 2          1 tidyverse
#> 3          1 data
#> ...
```

**Explanation:** `separate_longer_delim()` is the "growing rows" counterpart to `separate_wider_delim()`. Each delimited token becomes its own row; non-delimited columns are recycled. This is the right tool for normalising many-to-one fields like tags, authors, or roles before joining to a lookup table.

</details>

### Exercise 3.5: Parse server log lines with named regex groups

**Task:** An ops engineer needs to break a raw log column into `timestamp`, `level`, and `message` columns. Each line has the shape "2026-05-12T08:30:00 [INFO] Service started". Use `separate_wider_regex()` with three named patterns and save to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   timestamp           level message
#>   <chr>               <chr> <chr>
#> 1 2026-05-12T08:30:00 INFO  Service started
#> 2 2026-05-12T08:32:14 WARN  Slow query
#> 3 2026-05-12T08:35:01 ERROR Connection refused
```

**Difficulty:** Advanced

[HINTS]
Break each line into timestamp, level, and message by matching the fixed shape and dropping the brackets.
Call `separate_wider_regex()` with a `patterns` vector naming `timestamp`, `level`, and `message`, plus unnamed literals for the brackets and spaces.

```r title="Your turn"
logs <- tibble(line = c(
  "2026-05-12T08:30:00 [INFO] Service started",
  "2026-05-12T08:32:14 [WARN] Slow query",
  "2026-05-12T08:35:01 [ERROR] Connection refused"
))

ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- logs |>
  separate_wider_regex(
    line,
    patterns = c(
      timestamp = "\\S+",
      " \\[",
      level     = "[A-Z]+",
      "\\] ",
      message   = ".*"
    )
  )

ex_3_5
#> # A tibble: 3 x 3
#>   timestamp           level message
#>   <chr>               <chr> <chr>
#> 1 2026-05-12T08:30:00 INFO  Service started
#> ...
```

**Explanation:** The named patterns become columns; the literal strings between them ("[", "]") are matched and dropped. Anchoring with `\\S+` for the timestamp and `.*` for the trailing message lets each row vary in length while still parsing reliably. For very large log files, prefer `readr::read_log()` which is optimised for the common Apache or syslog formats.

</details>

## Section 4. Handle missing data: fill, complete, drop_na, replace_na (5 problems)

### Exercise 4.1: Drop rows of airquality with any NA in the measurement columns

**Task:** A climatologist wants a clean subset of `airquality` where every numeric measurement is observed. Use `drop_na()` across the `Ozone`, `Solar.R`, `Wind`, and `Temp` columns and save the result to `ex_4_1`. Print the resulting row count and head.

**Expected result:**

```
#> [1] 111
#> # A tibble: 6 x 6
#>   Ozone Solar.R  Wind  Temp Month   Day
#>   <int>   <int> <dbl> <int> <int> <int>
#> 1    41     190   7.4    67     5     1
#> 2    36     118   8      72     5     2
#> 3    12     149  12.6    74     5     3
#> 4    18     313  11.5    62     5     4
#> 5    23     299   8.6    65     5     7
#> 6    19      99  13.8    59     5     8
```

**Difficulty:** Beginner

[HINTS]
Keep only the rows where every named measurement is actually observed.
Use `drop_na()` and list the columns `Ozone`, `Solar.R`, `Wind`, and `Temp`.

```r title="Your turn"
ex_4_1 <- # your code here
nrow(ex_4_1)
head(ex_4_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- airquality |>
  drop_na(Ozone, Solar.R, Wind, Temp)

nrow(ex_4_1)
#> [1] 111
head(ex_4_1)
#> # A tibble: 6 x 6
#>   Ozone Solar.R  Wind  Temp Month   Day
#>   <int>   <int> <dbl> <int> <int> <int>
#> 1    41     190   7.4    67     5     1
#> ...
```

**Explanation:** `drop_na()` removes rows that have a missing value in any of the named columns; calling it with no arguments drops rows with NA anywhere. Be conservative: a careless `drop_na()` can wipe out entire studies. Always inspect `nrow()` before and after, and consider whether imputation is more honest than deletion for the analysis at hand.

</details>

### Exercise 4.2: Replace NA with column-specific defaults

**Task:** A junior analyst has a tibble of customer responses with missing ratings and comments. Use `replace_na()` to fill `rating` with 0 and `comment` with "no comment" in one call, then save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   customer_id rating comment
#>         <int>  <dbl> <chr>
#> 1           1      4 great service
#> 2           2      0 no comment
#> 3           3      5 fast
#> 4           4      0 no comment
```

**Difficulty:** Intermediate

[HINTS]
Each missing cell should get a default that matches its column's type, all in one call.
Call `replace_na()` with a named list mapping `rating` to 0 and `comment` to "no comment".

```r title="Your turn"
feedback <- tibble(
  customer_id = 1:4,
  rating      = c(4, NA, 5, NA),
  comment     = c("great service", NA, "fast", NA)
)

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- feedback |>
  replace_na(list(rating = 0, comment = "no comment"))

ex_4_2
#> # A tibble: 4 x 3
#>   customer_id rating comment
#>         <int>  <dbl> <chr>
#> 1           1      4 great service
#> 2           2      0 no comment
#> 3           3      5 fast
#> 4           4      0 no comment
```

**Explanation:** `replace_na()` accepts a named list mapping columns to their replacement values. The replacement must be the same type as the column: numeric for numerics, character for character. For type-aware imputation across many columns, look at `mutate(across(where(is.numeric), \\(x) tidyr::replace_na(x, 0)))` to keep the pipeline declarative.

</details>

### Exercise 4.3: Forward-fill grouping headers with fill()

**Task:** A reporting analyst has a sales tibble where the `region` column is only populated on the first row of each block, like a printed report. Use `fill()` with `.direction = "down"` to propagate the region down the empty rows and save to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   region store_id   sales
#>   <chr>     <int>   <dbl>
#> 1 East          1    1200
#> 2 East          2    1400
#> 3 East          3    1100
#> 4 West          4    1700
#> 5 West          5    1500
#> 6 West          6    1600
```

**Difficulty:** Intermediate

[HINTS]
The blank rows below each header should inherit the last value that was actually present.
Use `fill()` on `region` with `.direction = "down"`.

```r title="Your turn"
report <- tibble(
  region   = c("East", NA, NA, "West", NA, NA),
  store_id = 1:6,
  sales    = c(1200, 1400, 1100, 1700, 1500, 1600)
)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- report |>
  fill(region, .direction = "down")

ex_4_3
#> # A tibble: 6 x 3
#>   region store_id sales
#>   <chr>     <int> <dbl>
#> 1 East          1  1200
#> 2 East          2  1400
#> 3 East          3  1100
#> 4 West          4  1700
#> 5 West          5  1500
#> 6 West          6  1600
```

**Explanation:** `fill()` copies the last non-NA value into subsequent NA cells. `.direction = "down"` (the default) is what you want for header-style fills; "up", "downup", and "updown" handle other patterns. It is most often used after reading Excel sheets with merged cells, where a header value only appears in the first row of each group.

</details>

### Exercise 4.4: Expand all combinations with complete() and fill missing counts with zero

**Task:** A retail analyst has a sales tibble with only the (region, product) pairs that actually transacted. They need a balanced panel showing every region-product combination, with zeros where there were no sales. Use `complete()` with `fill = list(units = 0)` and save to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   region product units
#>   <chr>  <chr>   <dbl>
#> 1 East   A          30
#> 2 East   B           0
#> 3 East   C          12
#> 4 West   A           0
#> 5 West   B          25
#> 6 West   C          18
```

**Difficulty:** Intermediate

[HINTS]
Build the full cross of every region and product, then put zero where no sale happened.
Call `complete()` with `region`, `product`, and `fill = list(units = 0)`.

```r title="Your turn"
sparse <- tibble(
  region  = c("East", "East", "West", "West"),
  product = c("A", "C", "B", "C"),
  units   = c(30, 12, 25, 18)
)

ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- sparse |>
  complete(region, product, fill = list(units = 0))

ex_4_4
#> # A tibble: 6 x 3
#>   region product units
#>   <chr>  <chr>   <dbl>
#> 1 East   A          30
#> 2 East   B           0
#> 3 East   C          12
#> 4 West   A           0
#> 5 West   B          25
#> 6 West   C          18
```

**Explanation:** `complete()` cross-joins the unique values of the named columns and fills any newly created rows with the values in `fill`. This is the right tool when downstream code expects a balanced panel: a missing zero is silent, a present zero is countable. For larger grids, `expand()` returns just the skeleton and you can left-join your data onto it.

</details>

### Exercise 4.5: Build an irregular-frequency monthly panel from gappy sensor data

**Task:** A field engineer logs sensor readings on irregular months and you need a continuous panel with no gaps. Use `complete()` to insert any missing months between the observed minimum and maximum, then `fill()` forward the `sensor_id` and `replace_na()` the reading with -999 as a sentinel. Save to `ex_4_5`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   month sensor_id reading
#>   <dbl> <chr>       <dbl>
#> 1     1 S1            5.2
#> 2     2 S1         -999
#> 3     3 S1            6.1
#> 4     4 S1         -999
#> 5     5 S1         -999
#> 6     6 S1            4.8
```

**Difficulty:** Advanced

[HINTS]
Insert every missing month between the first and last, carry the sensor id down, then mark unseen readings with a sentinel.
Chain `complete(month = full_seq(month, 1))`, `fill(sensor_id, .direction = "down")`, and `replace_na(list(reading = -999))`.

```r title="Your turn"
gappy <- tibble(
  month     = c(1, 3, 6),
  sensor_id = c("S1", "S1", "S1"),
  reading   = c(5.2, 6.1, 4.8)
)

ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- gappy |>
  complete(month = full_seq(month, 1)) |>
  fill(sensor_id, .direction = "down") |>
  replace_na(list(reading = -999))

ex_4_5
#> # A tibble: 6 x 3
#>   month sensor_id reading
#>   <dbl> <chr>       <dbl>
#> 1     1 S1            5.2
#> 2     2 S1         -999
#> 3     3 S1            6.1
#> ...
```

**Explanation:** `full_seq(month, 1)` builds a regular monthly skeleton from min to max. `complete()` injects rows for the missing months with NA values; `fill()` then propagates the sensor ID and `replace_na()` substitutes the sentinel for the missing reading. A real pipeline would more likely impute with `zoo::na.approx()` for a numeric series, but the pattern is the same.

</details>

## Section 5. List columns: nest, unnest, hoist (5 problems)

### Exercise 5.1: Nest iris rows by Species into a list-column

**Task:** A statistics tutor wants `iris` collapsed into three rows, one per `Species`, with a `data` list-column holding the matching subset of measurements. Use `nest()` with the `.by` argument so the result is one row per species and save to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   Species    data
#>   <fct>      <list>
#> 1 setosa     <tibble [50 x 4]>
#> 2 versicolor <tibble [50 x 4]>
#> 3 virginica  <tibble [50 x 4]>
```

**Difficulty:** Beginner

[HINTS]
Collapse the table to one row per species, tucking the matching measurements into a packed column.
Use `nest()` with `data = -Species`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- iris |>
  as_tibble() |>
  nest(data = -Species)

ex_5_1
#> # A tibble: 3 x 2
#>   Species    data
#>   <fct>      <list>
#> 1 setosa     <tibble [50 x 4]>
#> 2 versicolor <tibble [50 x 4]>
#> 3 virginica  <tibble [50 x 4]>
```

**Explanation:** `nest(data = -Species)` says "pack every column except Species into a list-column called data." The result is one row per species with the per-species table tucked inside, which is the foundation of the many-models pattern. You can also write `iris |> group_by(Species) |> nest()` for the same outcome with a grouping prefix.

</details>

### Exercise 5.2: Fit one regression per Species and pull out the coefficients

**Task:** A regression tutor wants to compare slopes of `Petal.Length` on `Sepal.Length` across the three iris species. Nest by `Species`, fit `lm()` inside each nested tibble using `purrr::map()`, tidy the model with `broom::tidy()`, then unnest the tidied output. Save the coefficient table to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>   Species    term         estimate std.error statistic       p.value
#>   <fct>      <chr>           <dbl>     <dbl>     <dbl>         <dbl>
#> 1 setosa     (Intercept)     0.803    0.344       2.34 0.0238
#> 2 setosa     Sepal.Length    0.132    0.0685      1.92 0.0607
#> 3 versicolor (Intercept)     0.185    0.514       0.36 0.720
#> 4 versicolor Sepal.Length    0.686    0.0863      7.95 0.0000000272
#> 5 virginica  (Intercept)     0.610    0.417       1.46 0.149
#> 6 virginica  Sepal.Length    0.750    0.0628     11.9  0.0000000000114
```

**Difficulty:** Intermediate

[HINTS]
Pack each species into its own table, fit a model inside every row, tidy it, then flatten the coefficients back out.
After `nest()`, use `mutate()` with `map()` to call `lm()`, `map()` again for `broom::tidy()`, then `unnest()` the tidied column.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- iris |>
  as_tibble() |>
  nest(data = -Species) |>
  mutate(
    model = map(data, \(df) lm(Petal.Length ~ Sepal.Length, data = df)),
    tidied = map(model, broom::tidy)
  ) |>
  select(Species, tidied) |>
  unnest(tidied)

ex_5_2
#> # A tibble: 6 x 6
#>   Species    term         estimate std.error statistic     p.value
#>   <fct>      <chr>           <dbl>     <dbl>     <dbl>       <dbl>
#> 1 setosa     (Intercept)     0.803    0.344       2.34   0.0238
#> 2 setosa     Sepal.Length    0.132    0.0685      1.92   0.0607
#> ...
```

**Explanation:** The many-models pattern (nest, then `map()` model fits, then `tidy()`, then `unnest()`) is one of the most powerful idioms in the tidyverse. Each model lives in its own row and remains addressable by its grouping keys. Compare slopes by filtering `term == "Sepal.Length"` and inspecting the estimate column.

</details>

### Exercise 5.3: Explode a list-column of skills with unnest_longer

**Task:** A recruiter has a tibble where each candidate row carries a `skills` list-column of variable length. Use `unnest_longer()` to expand the table so each skill becomes its own row, preserving the candidate ID. Save to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   candidate skill
#>       <int> <chr>
#> 1         1 R
#> 2         1 SQL
#> 3         1 Python
#> 4         2 R
#> 5         3 Python
#> 6         3 Java
```

**Difficulty:** Intermediate

[HINTS]
Each element of the variable-length list should be stacked into its own row.
Call `unnest_longer()` on the `skills` column with `values_to = "skill"`.

```r title="Your turn"
cands <- tibble(
  candidate = 1:3,
  skills    = list(c("R", "SQL", "Python"), "R", c("Python", "Java"))
)

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- cands |>
  unnest_longer(skills, values_to = "skill")

ex_5_3
#> # A tibble: 6 x 2
#>   candidate skill
#>       <int> <chr>
#> 1         1 R
#> 2         1 SQL
#> 3         1 Python
#> 4         2 R
#> 5         3 Python
#> 6         3 Java
```

**Explanation:** `unnest_longer()` is the right verb when each element of the list-column is a vector you want stacked into rows. If the elements were named, you would also get an index column with the names. Compare with `unnest_wider()`, which spreads named elements into columns instead. Both are descendants of the deprecated `unnest()`.

</details>

### Exercise 5.4: Spread a list-column of named lists into typed columns with unnest_wider

**Task:** An API client returned a tibble with a `details` list-column where each element is a named list of `weight`, `colour`, and `in_stock`. Use `unnest_wider()` to turn each named element into its own typed column and save to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   item_id weight colour in_stock
#>     <int>  <dbl> <chr>  <lgl>
#> 1       1   1.2  red    TRUE
#> 2       2   0.9  blue   FALSE
#> 3       3   2.1  green  TRUE
```

**Difficulty:** Intermediate

[HINTS]
Each named entry inside the list element should become its own typed column, keeping the row count unchanged.
Use `unnest_wider()` on the `details` column.

```r title="Your turn"
items <- tibble(
  item_id = 1:3,
  details = list(
    list(weight = 1.2, colour = "red",   in_stock = TRUE),
    list(weight = 0.9, colour = "blue",  in_stock = FALSE),
    list(weight = 2.1, colour = "green", in_stock = TRUE)
  )
)

ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- items |>
  unnest_wider(details)

ex_5_4
#> # A tibble: 3 x 4
#>   item_id weight colour in_stock
#>     <int>  <dbl> <chr>  <lgl>
#> 1       1   1.2  red    TRUE
#> 2       2   0.9  blue   FALSE
#> 3       3   2.1  green  TRUE
```

**Explanation:** `unnest_wider()` keeps the row count constant and grows columns. It is the right verb for parsing JSON-style responses where each row has the same schema. When elements are missing or unnamed, use `hoist()` for fine-grained control over which paths to extract and what to name them.

</details>

### Exercise 5.5: Per-group regressions on mtcars with predictions joined back

**Task:** An ML engineer wants per-cylinder linear models predicting `mpg` from `wt`. Nest `mtcars` by `cyl`, fit one `lm()` per group, augment each model with predictions on its own data, then unnest a tibble containing `cyl`, `wt`, `mpg`, and the fitted value `.fitted`. Save to `ex_5_5`.

**Expected result:**

```
#> # A tibble: 32 x 4
#>      cyl    wt   mpg .fitted
#>    <dbl> <dbl> <dbl>   <dbl>
#>  1     6  2.62  21    20.7
#>  2     6  2.88  21    19.4
#>  3     4  2.32  22.8  25.6
#>  4     6  3.21  21.4  17.6
#>  5     8  3.44  18.7  17.3
#>  6     6  3.46  18.1  16.4
#>  7     8  3.57  14.3  16.6
#>  ...
```

**Difficulty:** Advanced

[HINTS]
Fit one model per cylinder group, attach each model's predictions to its own data, then flatten the result.
After `nest(data = -cyl)`, `map()` an `lm()`, `map2()` `broom::augment()` over model and data, then `unnest()` and `select()` `.fitted`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- mtcars |>
  as_tibble() |>
  nest(data = -cyl) |>
  mutate(
    model = map(data, \(df) lm(mpg ~ wt, data = df)),
    aug   = map2(model, data, \(m, d) broom::augment(m, newdata = d))
  ) |>
  select(cyl, aug) |>
  unnest(aug) |>
  select(cyl, wt, mpg, .fitted)

ex_5_5
#> # A tibble: 32 x 4
#>      cyl    wt   mpg .fitted
#>    <dbl> <dbl> <dbl>   <dbl>
#> 1     6  2.62  21     20.7
#> ...
```

**Explanation:** `map2()` walks both the model and its original data in lockstep, calling `broom::augment()` which appends `.fitted`, `.resid`, and friends. This is how you generate predictions while keeping group identity attached. The pattern scales naturally to time series partitions, A/B experiments, or any per-group modelling problem.

</details>

## Section 6. End-to-end tidying workflows (5 problems)

### Exercise 6.1: Turn a wide survey response sheet into a tidy long answer log

**Task:** A market researcher exported a survey as a wide tibble where each column is a question (`q1`, `q2`, `q3`) and rows are respondents. Pivot longer so each row holds one respondent-question-answer triple, drop rows where the answer is NA, and save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 7 x 3
#>   respondent question answer
#>        <int> <chr>    <chr>
#> 1          1 q1       yes
#> 2          1 q2       no
#> 3          1 q3       yes
#> 4          2 q1       no
#> 5          2 q3       no
#> 6          3 q1       yes
#> 7          3 q2       yes
```

**Difficulty:** Intermediate

[HINTS]
Stack every question column into one answer column, then discard the rows where no answer was given.
Use `pivot_longer()` with `cols = starts_with("q")`, then `drop_na()` on `answer`.

```r title="Your turn"
survey <- tibble(
  respondent = 1:3,
  q1 = c("yes", "no", "yes"),
  q2 = c("no",  NA,    "yes"),
  q3 = c("yes", "no",  NA)
)

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- survey |>
  pivot_longer(cols = starts_with("q"), names_to = "question", values_to = "answer") |>
  drop_na(answer)

ex_6_1
#> # A tibble: 7 x 3
#>   respondent question answer
#>        <int> <chr>    <chr>
#> 1          1 q1       yes
#> 2          1 q2       no
#> 3          1 q3       yes
#> ...
```

**Explanation:** This two-step combo is the workhorse for survey ETL: `pivot_longer()` gets the data into one-observation-per-row shape, then `drop_na()` removes the skipped questions. The result feeds straight into `count(question, answer)` for a response distribution by question.

</details>

### Exercise 6.2: Build a region by quarter report with row and column totals

**Task:** A finance team wants a wide quarterly sales report by region with a `total` column summing across quarters. Starting from the long `sales` ledger from earlier, pivot wider, then `mutate()` a row total using `rowSums()`. Save to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 6
#>   region    Q1    Q2    Q3    Q4 total
#>   <chr>  <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 East     120   135   140   160   555
#> 2 North    100   110   130   125   465
#> 3 West      80    95   105   120   400
```

**Difficulty:** Intermediate

[HINTS]
Reshape the ledger into one row per region, then add a column that sums across the quarter columns.
After `pivot_wider()`, `mutate()` a `total` using `rowSums(across(starts_with("Q")))`.

```r title="Your turn"
sales <- tibble(
  region  = rep(c("East", "North", "West"), each = 4),
  quarter = rep(c("Q1", "Q2", "Q3", "Q4"), times = 3),
  sales   = c(120, 135, 140, 160, 100, 110, 130, 125, 80, 95, 105, 120)
)

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- sales |>
  pivot_wider(names_from = quarter, values_from = sales) |>
  mutate(total = rowSums(across(starts_with("Q"))))

ex_6_2
#> # A tibble: 3 x 6
#>   region    Q1    Q2    Q3    Q4 total
#>   <chr>  <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 East     120   135   140   160   555
#> 2 North    100   110   130   125   465
#> 3 West      80    95   105   120   400
```

**Explanation:** `rowSums(across(starts_with("Q")))` is the modern tidyverse way to sum a tidy-selected set of columns into a new column. The `across()` helper inside dplyr is the right tool here because the column names are known by pattern after the pivot. This idiom replaces older `mutate(total = Q1 + Q2 + Q3 + Q4)`, which is brittle if you add a Q5 next year.

</details>

### Exercise 6.3: Reconstruct a full daily panel from gappy weather readings

**Task:** A climatologist has temperature readings for two stations on irregular days in May and wants a complete daily panel for the month. For each station, `complete()` the date range from 2026-05-01 to 2026-05-07, fill `station` down, and impute missing `temp_c` with the station's mean using `coalesce()` and `mean()` inside `group_by()`. Save to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 14 x 3
#>    station date       temp_c
#>    <chr>   <date>      <dbl>
#>  1 A       2026-05-01   18
#>  2 A       2026-05-02   19
#>  3 A       2026-05-03   19.5
#>  4 A       2026-05-04   19.5
#>  5 A       2026-05-05   21
#>  6 A       2026-05-06   19.5
#>  7 A       2026-05-07   20
#>  8 B       2026-05-01   22
#>  9 B       2026-05-02   23.5
#> 10 B       2026-05-03   23.5
#> 11 B       2026-05-04   25
#> ...
```

**Difficulty:** Advanced

[HINTS]
Fill in every day of the range for each station, then replace gaps with that station's average reading.
Use `complete(station, date = seq(...))`, then `group_by(station)` and `mutate(temp_c = coalesce(temp_c, mean(temp_c, na.rm = TRUE)))`.

```r title="Your turn"
weather <- tibble(
  station = c("A", "A", "A", "B", "B"),
  date    = as.Date(c("2026-05-01", "2026-05-02", "2026-05-05",
                       "2026-05-01", "2026-05-04")),
  temp_c  = c(18, 19, 21, 22, 25)
)

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- weather |>
  complete(
    station,
    date = seq(as.Date("2026-05-01"), as.Date("2026-05-07"), by = "day")
  ) |>
  group_by(station) |>
  mutate(temp_c = coalesce(temp_c, mean(temp_c, na.rm = TRUE))) |>
  ungroup()

ex_6_3
#> # A tibble: 14 x 3
#>    station date       temp_c
#>    <chr>   <date>      <dbl>
#>  1 A       2026-05-01   18
#>  ...
```

**Explanation:** Passing both grouping columns to `complete()` cross-joins the unique stations against the explicit date sequence. The mean-imputation step uses `coalesce()` which returns the first non-NA value, so observed readings remain untouched. For modelling work a more principled imputation such as `mice::mice()` or `recipes::step_impute_*` is usually preferable.

</details>

### Exercise 6.4: Reshape a wide sensor log for a faceted ggplot

**Task:** A platform engineer has wide sensor data with `cpu`, `mem`, and `disk` columns sampled across timestamps and needs it in long format for a faceted ggplot. Pivot the three metric columns longer, then arrange by `timestamp` and `metric` so plotting code can use `facet_wrap(~metric)`. Save to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 12 x 3
#>    timestamp metric value
#>    <chr>     <chr>  <dbl>
#>  1 t1        cpu     12.5
#>  2 t1        disk    50
#>  3 t1        mem     30.1
#>  4 t2        cpu     14.7
#>  5 t2        disk    52
#>  6 t2        mem     31
#>  7 t3        cpu     20.2
#>  8 t3        disk    53
#>  9 t3        mem     33.8
#> 10 t4        cpu     18
#> ...
```

**Difficulty:** Advanced

[HINTS]
Stack the three metric columns into long form, then sort so the facet variable follows a predictable order.
Use `pivot_longer()` on `c(cpu, mem, disk)`, then `arrange()` by `timestamp` and `metric`.

```r title="Your turn"
sensors <- tibble(
  timestamp = paste0("t", 1:4),
  cpu  = c(12.5, 14.7, 20.2, 18.0),
  mem  = c(30.1, 31.0, 33.8, 32.5),
  disk = c(50,   52,   53,   54)
)

ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- sensors |>
  pivot_longer(cols = c(cpu, mem, disk), names_to = "metric", values_to = "value") |>
  arrange(timestamp, metric)

ex_6_4
#> # A tibble: 12 x 3
#>    timestamp metric value
#>    <chr>     <chr>  <dbl>
#>  1 t1        cpu     12.5
#>  2 t1        disk    50
#>  3 t1        mem     30.1
#>  ...
```

**Explanation:** Plotting libraries like ggplot2 expect long data because they map a single variable to position and another to colour or facet. Pivoting before plotting is so common that some teams build a small helper that pipes long form straight into the plot. Sort by the facet variable so legends and small multiples follow a predictable order.

</details>

### Exercise 6.5: Aggregate a raw event log into a stakeholder rollup

**Task:** A growth analyst has a raw event log where each row is one user action with `user_id`, `event_type`, and `value`. The product manager asks for a wide rollup by event type showing total value and event count, with zeros for absent events. Pivot wider with two value functions, then `replace_na()` zero into the missing cells. Save to `ex_6_5`.

**Expected result:**

```
#> # A tibble: 3 x 7
#>   user_id total_click count_click total_view count_view total_purchase count_purchase
#>     <int>       <dbl>       <int>      <dbl>      <int>          <dbl>          <int>
#> 1       1           5           2          0          0             20              1
#> 2       2           0           0          4          2              0              0
#> 3       3           3           1          2          1             50              1
```

**Difficulty:** Advanced

[HINTS]
Summarise total value and event count per user-and-type, then spread both metrics into columns with zero where an event is absent.
After `group_by()` and `summarise(total, count)`, call `pivot_wider()` with `values_from = c(total, count)`, `names_glue`, and `values_fill = 0`.

```r title="Your turn"
events <- tibble(
  user_id    = c(1, 1, 1, 2, 2, 2, 3, 3, 3),
  event_type = c("click", "click", "purchase",
                 "view",  "view",  "view",
                 "click", "view",  "purchase"),
  value      = c(2, 3, 20, 1, 2, 1, 3, 2, 50)
)

ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- events |>
  group_by(user_id, event_type) |>
  summarise(total = sum(value), count = n(), .groups = "drop") |>
  pivot_wider(
    names_from = event_type,
    values_from = c(total, count),
    names_glue = "{.value}_{event_type}",
    values_fill = 0
  )

ex_6_5
#> # A tibble: 3 x 7
#>   user_id total_click count_click total_view count_view total_purchase count_purchase
#>     <int>       <dbl>       <int>      <dbl>      <int>          <dbl>          <int>
#> 1       1           5           2          0          0             20              1
#> ...
```

**Explanation:** The `values_from = c(total, count)` shape creates two parallel column families per event type. `names_glue` enforces the metric-first column-name convention stakeholders expect. `values_fill = 0` saves a follow-up `replace_na()` call. This single pipeline is what a reporting analyst would otherwise hand-build with a half-dozen joins.

</details>

## What to do next

- Build on these patterns with the focused [tidyr Pivot Exercises](tidyr-Pivot-Exercises-in-R.html) for deeper pivot_longer and pivot_wider drills.
- Move to list-column workflows in [tidyr Nest and Unnest Exercises](tidyr-Nest-Unnest-Exercises-in-R.html).
- Combine tidying with row-wise transformations in [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- Practice the cleaning side of the pipeline in [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html).
