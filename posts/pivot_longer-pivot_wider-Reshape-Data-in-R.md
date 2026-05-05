---
title: "pivot_longer() vs pivot_wider() in R: Wide and Long Reshape (10 Patterns)"
slug: "pivot_longer-pivot_wider-Reshape-Data-in-R"
description: "Reshape R data frames with tidyr pivot_longer() and pivot_wider(). Every key argument explained: names_to, values_to, names_from, values_from, names_sep, values_fn."
keywords: "pivot_longer, pivot_wider, tidyr, reshape data R, wide to long R, long to wide R, names_to, values_to, names_from, values_from"
auto_link_terms: "pivot_longer()|pivot_wider()|pivot longer|pivot wider|reshape data in R|wide to long format|long to wide format"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "1.2.8"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "pivot_longer & pivot_wider"
sidebar_order: 8
difficulty: "Intermediate"
---

# pivot_longer() and pivot_wider(): Reshape Data in R Without Losing Your Mind

<p class="lead"><code>pivot_longer()</code> stacks several columns into one name-value pair, moving data from wide to long. <code>pivot_wider()</code> does the opposite, it spreads one column's values across new columns. They are inverses of each other, and together they cover almost every reshape job you will ever meet in R.</p>

## What does wide vs long data actually look like?

Most datasets arrive "wide" because humans like compact tables that fit on a screen. Sales by quarter, scores by subject, sensor readings by hour, the label sits in a column header and the number sits in a cell. Analysis tools, however, prefer "long" data where each row is a single observation. Let's see the same data in both shapes so the payoff is obvious before we touch arguments.

```r title="Sales wide to long pivot"
library(tidyr)
library(dplyr)

sales_wide <- tibble(
  store = c("North", "South", "East"),
  Q1 = c(120, 90, 150),
  Q2 = c(140, 110, 160),
  Q3 = c(135, 125, 155)
)
sales_wide
#> # A tibble: 3 x 4
#>   store    Q1    Q2    Q3
#>   <chr> <dbl> <dbl> <dbl>
#> 1 North   120   140   135
#> 2 South    90   110   125
#> 3 East    150   160   155

sales_long <- sales_wide |>
  pivot_longer(cols = Q1:Q3, names_to = "quarter", values_to = "sales")
sales_long
#> # A tibble: 9 x 3
#>   store quarter sales
#>   <chr> <chr>   <dbl>
#> 1 North Q1        120
#> 2 North Q2        140
#> 3 North Q3        135
#> 4 South Q1         90
#> 5 South Q2        110
#> 6 South Q3        125
#> 7 East  Q1        150
#> 8 East  Q2        160
#> 9 East  Q3        155
```

The wide version has 3 rows × 4 columns. The long version has 9 rows × 3 columns. Same information, different shape. Notice how every row in the long table now describes exactly one sales figure at one store in one quarter, that is what "tidy" means.

![Wide vs long shape of the same dataset](screenshots/pivot_longer-pivot_wider-wide-vs-long.webp)
*Figure 1: The same sales data in wide and long form. Wide stores values in column headers; long stores them in a single column.*

Why prefer long? Because ggplot2, dplyr's `group_by()`, and most statistical functions expect each observation on its own row. Try to plot the wide table with ggplot, you cannot map "quarter" to the x-axis because it does not exist as a column. Reshape first, plot second.

> **[TIP]** A quick test: if you find yourself writing `Q1 + Q2 + Q3` or `mean(c(col1, col2, col3))` to compute something across columns, your data is wide and you probably want it long.

**Try it:** Build a wide tibble with `student` and three grade columns `math`, `science`, `english`, then pivot it to a long form with columns `student`, `subject`, `grade`.

```r title="Exercise: Grades wide to long"
# Starter code
library(tidyr)

grades_wide <- tibble(
  student = c("Asha", "Bilal", "Cleo"),
  math = c(88, 72, 95),
  science = c(81, 79, 90),
  english = c(77, 85, 92)
)

# Your pivot_longer() call here — hint: cols = math:english
```

<details>
<summary>Click to reveal solution</summary>

```r title="Grades long solution"
library(tidyr); library(tibble)
grades_wide <- tibble(
  student = c("Asha", "Bilal", "Cleo"),
  math = c(88, 72, 95),
  science = c(81, 79, 90),
  english = c(77, 85, 92)
)
grades_wide |>
  pivot_longer(cols = math:english, names_to = "subject", values_to = "grade")
#> # A tibble: 9 x 3
#>   student subject grade
#>   <chr>   <chr>   <dbl>
#> 1 Asha    math       88
#> 2 Asha    science    81
#> 3 Asha    english    77
#> 4 Bilal   math       72
#> 5 Bilal   science    79
#> 6 Bilal   english    85
#> 7 Cleo    math       95
#> 8 Cleo    science    90
#> 9 Cleo    english    92
```

`cols = math:english` selects those three subject columns by range, and pivot_longer stacks them into two new columns: `subject` (the former headers) and `grade` (the former values). `student` wasn't named in `cols`, so it's kept as an ID, each student now spans three rows, one per subject.
</details>

## How does pivot_longer() turn wide columns into rows?

`pivot_longer()` takes four arguments you will use every day: `cols` (which columns to stack), `names_to` (what to call the new "label" column), `values_to` (what to call the new "value" column), and sometimes `values_drop_na` to skip empty cells. Let's look at each in a simple example so the anatomy is crystal clear.

![pivot_longer argument anatomy](screenshots/pivot_longer-pivot_wider-longer-anatomy.webp)
*Figure 2: How pivot_longer() maps wide columns into a name column and a value column.*

```r title="Weather pivot with year conversion"
library(tidyr)

weather <- tibble(
  city = c("Pune", "Berlin", "Lima"),
  `2021` = c(34, 22, 25),
  `2022` = c(36, 24, 26),
  `2023` = c(35, 25, 27)
)

weather_long <- weather |>
  pivot_longer(
    cols = `2021`:`2023`,
    names_to = "year",
    values_to = "avg_temp",
    names_transform = list(year = as.integer)
  )
weather_long
#> # A tibble: 9 x 3
#>   city    year avg_temp
#>   <chr>  <int>    <dbl>
#> 1 Pune    2021       34
#> 2 Pune    2022       36
#> 3 Pune    2023       35
#> 4 Berlin  2021       22
#> 5 Berlin  2022       24
#> 6 Berlin  2023       25
#> 7 Lima    2021       25
#> 8 Lima    2022       26
#> 9 Lima    2023       27
```

Three things worth noticing. First, `cols = 2021:2023` selects a range of columns using the same tidyselect helpers as `select()`, you can also write `cols = starts_with("20")` or `cols = -city` to say "everything except city". Second, `names_transform` turns the text `"2021"` into an integer, which matters because column headers are always strings even when they look like numbers. Third, the `city` column is preserved without being named anywhere, pivot_longer keeps every column not listed in `cols`.

> **[NOTE]** If your wide table has holes (NA values where a measurement is missing), add `values_drop_na = TRUE` to drop those rows automatically. Without it you get explicit NA rows in the long output.

**Try it:** Pivot this expense table so each row is one month-category pair. Drop NA values.

```r title="Exercise: Expenses long drop NAs"
# Starter code
expenses <- tibble(
  category = c("rent", "food", "travel"),
  Jan = c(1200, 350, NA),
  Feb = c(1200, 380, 200),
  Mar = c(1250, 400, 150)
)

# pivot_longer() call — cols = Jan:Mar, drop NAs
```

<details>
<summary>Click to reveal solution</summary>

```r title="Expenses long solution"
library(tidyr); library(tibble)
expenses <- tibble(
  category = c("rent", "food", "travel"),
  Jan = c(1200, 350, NA),
  Feb = c(1200, 380, 200),
  Mar = c(1250, 400, 150)
)
expenses |>
  pivot_longer(
    cols = Jan:Mar,
    names_to = "month",
    values_to = "amount",
    values_drop_na = TRUE
  )
#> # A tibble: 8 x 3
#>   category month amount
#>   <chr>    <chr>  <dbl>
#> 1 rent     Jan     1200
#> 2 rent     Feb     1200
#> 3 rent     Mar     1250
#> 4 food     Jan      350
#> 5 food     Feb      380
#> 6 food     Mar      400
#> 7 travel   Feb      200
#> 8 travel   Mar      150
```

`cols = Jan:Mar` selects the three month columns as a range and stacks them into `month`/`amount`. `values_drop_na = TRUE` quietly removes the travel-Jan row where the original cell was NA, so you get 8 rows instead of 9.
</details>

## How does pivot_wider() turn rows back into columns?

`pivot_wider()` is the inverse. It takes a long table and spreads one column's values across new columns. You need two arguments: `names_from` (the column whose values become new headers) and `values_from` (the column whose values fill those new headers). Everything else stays as an ID.

![pivot_wider argument anatomy](screenshots/pivot_longer-pivot_wider-wider-anatomy.webp)
*Figure 3: How pivot_wider() maps a name column and a value column into new wide columns.*

```r title="Round-trip with pivotwider"
# Reuse sales_long from section 1
sales_back <- sales_long |>
  pivot_wider(names_from = quarter, values_from = sales)
sales_back
#> # A tibble: 3 x 4
#>   store    Q1    Q2    Q3
#>   <chr> <dbl> <dbl> <dbl>
#> 1 North   120   140   135
#> 2 South    90   110   125
#> 3 East    150   160   155
```

That is the same shape as the original `sales_wide`. Round-trip confirmed, pivot_longer and pivot_wider undo each other exactly. When would you actually *want* to go long→wide? The classic case is preparing a report table for humans: a row per customer, a column per month, ready to paste into a slide. Another is computing differences across groups, like churn rate between Q1 and Q2, which is easier when each quarter is its own column.

```r title="Student scores report-ready table"
# A report-ready table: students as rows, subjects as columns
scores_long <- tibble(
  student = c("Asha","Asha","Asha","Bilal","Bilal","Bilal"),
  subject = c("math","science","english","math","science","english"),
  grade   = c(88, 81, 77, 72, 79, 85)
)

scores_long |>
  pivot_wider(names_from = subject, values_from = grade)
#> # A tibble: 2 x 4
#>   student  math science english
#>   <chr>   <dbl>   <dbl>   <dbl>
#> 1 Asha       88      81      77
#> 2 Bilal      72      79      85
```

> **[TIP]** Use a `names_prefix` to prepend text to the new column names, like `names_prefix = "score_"`. Handy when the resulting headers would otherwise start with a number or collide with an existing column.

**Try it:** Spread this long survey table into wide form, one row per respondent.

```r title="Exercise: Survey answers wide"
# Starter code
survey <- tibble(
  id = c(1,1,1,2,2,2),
  question = c("q1","q2","q3","q1","q2","q3"),
  answer = c(5,3,4,2,4,5)
)

# pivot_wider() call — names_from = question, values_from = answer
```

<details>
<summary>Click to reveal solution</summary>

```r title="Survey answers wide solution"
library(tidyr); library(tibble)
survey <- tibble(
  id = c(1,1,1,2,2,2),
  question = c("q1","q2","q3","q1","q2","q3"),
  answer = c(5,3,4,2,4,5)
)
survey |>
  pivot_wider(names_from = question, values_from = answer)
#> # A tibble: 2 x 4
#>      id    q1    q2    q3
#>   <dbl> <dbl> <dbl> <dbl>
#> 1     1     5     3     4
#> 2     2     2     4     5
```

`names_from = question` promotes each distinct question label to its own column; `values_from = answer` fills those columns with the matching score. `id` isn't named in either argument, so it's treated as the row identifier, one row per respondent.
</details>

## How do you split compound column names with names_sep and names_pattern?

Real datasets often pack two pieces of information into a single column name. Think `sales_2022_Q1`, `temp_min`, or `height_cm`. `pivot_longer()` can split these into separate columns during the reshape, no extra `separate()` step needed.

```r title="Split stock headers with namessep"
library(tidyr)

stocks <- tibble(
  date = as.Date(c("2026-01-01","2026-02-01","2026-03-01")),
  AAPL_open = c(180, 185, 190),
  AAPL_close = c(182, 188, 192),
  GOOG_open = c(140, 145, 148),
  GOOG_close = c(142, 147, 149)
)

stocks_long <- stocks |>
  pivot_longer(
    cols = -date,
    names_to = c("ticker", "price_type"),
    names_sep = "_",
    values_to = "price"
  )
stocks_long
#> # A tibble: 12 x 4
#>   date       ticker price_type price
#>   <date>     <chr>  <chr>      <dbl>
#> 1 2026-01-01 AAPL   open         180
#> 2 2026-01-01 AAPL   close        182
#> 3 2026-01-01 GOOG   open         140
#> 4 2026-01-01 GOOG   close        142
#> ...
```

`names_to` now takes a character vector, one name per chunk of the original header. `names_sep = "_"` splits on underscore. The result gives us a clean `ticker` and `price_type` pair that you can filter, group, or plot directly.

When your headers follow a more complex pattern, say `sales_q1_2022` where a regex would help, use `names_pattern` with capture groups:

```r title="Regex split with namespattern"
messy <- tibble(
  id = 1:2,
  sales_q1_2022 = c(100, 200),
  sales_q2_2022 = c(110, 210),
  sales_q1_2023 = c(120, 220),
  sales_q2_2023 = c(130, 230)
)

messy |>
  pivot_longer(
    cols = -id,
    names_to = c("metric", "quarter", "year"),
    names_pattern = "(.*)_(q[0-9])_(\\d{4})",
    values_to = "value"
  )
#> # A tibble: 8 x 5
#>    id metric quarter year  value
#> <int> <chr>  <chr>   <chr> <dbl>
#>   1 sales  q1      2022    100
#>   1 sales  q2      2022    110
#> ...
```

Three capture groups → three destination columns. No nested `mutate()` or `substr()` dance.

> **[WARNING]** `names_pattern` uses regex. If your column names contain characters like dots or parentheses, escape them in the pattern or they will match unintended text.

**Try it:** Pivot this table so `country` and `year` become separate columns.

```r title="Exercise: Country-year pivot with drops"
# Starter code
pop <- tibble(
  region = c("Asia","Europe"),
  India_2020 = c(1380, NA),
  India_2021 = c(1393, NA),
  Germany_2020 = c(NA, 83),
  Germany_2021 = c(NA, 84)
)

# pivot_longer() — cols = -region, names_sep = "_", drop NAs
```

<details>
<summary>Click to reveal solution</summary>

```r title="Country-year pivot solution"
library(tidyr); library(tibble)
pop <- tibble(
  region = c("Asia","Europe"),
  India_2020 = c(1380, NA),
  India_2021 = c(1393, NA),
  Germany_2020 = c(NA, 83),
  Germany_2021 = c(NA, 84)
)
pop |>
  pivot_longer(
    cols = -region,
    names_to = c("country", "year"),
    names_sep = "_",
    names_transform = list(year = as.integer),
    values_to = "population",
    values_drop_na = TRUE
  )
#> # A tibble: 4 x 4
#>   region country  year population
#>   <chr>  <chr>   <int>      <dbl>
#> 1 Asia   India    2020       1380
#> 2 Asia   India    2021       1393
#> 3 Europe Germany  2020         83
#> 4 Europe Germany  2021         84
```

`cols = -region` stacks every column except `region`, and `names_sep = "_"` splits each header into the two pieces named in `names_to`. `values_drop_na = TRUE` removes the four NA cells that only existed because the wide table padded every country across both regions.
</details>

## What happens when pivot_wider() creates missing values?

Going long is always safe, every row lands somewhere. Going wide is riskier. If the long table is missing a combination of `names_from` and row-ID columns, pivot_wider fills the gap with `NA`. Sometimes that is what you want. Sometimes it is a bug.

```r title="pivotwider introduces NAs"
attendance <- tibble(
  student = c("Asha","Asha","Bilal","Cleo","Cleo"),
  day = c("Mon","Tue","Mon","Mon","Wed"),
  present = c(1,1,1,1,0)
)

attendance |>
  pivot_wider(names_from = day, values_from = present)
#> # A tibble: 3 x 4
#>   student   Mon   Tue   Wed
#>   <chr>   <dbl> <dbl> <dbl>
#> 1 Asha        1     1    NA
#> 2 Bilal       1    NA    NA
#> 3 Cleo        1    NA     0
```

Bilal has no Tuesday record, so pivot_wider inserts NA. Often you would rather see a 0, absence means "not present", not "unknown". Use `values_fill`:

```r title="Fill missing values with zero"
attendance |>
  pivot_wider(names_from = day, values_from = present, values_fill = 0)
#> # A tibble: 3 x 4
#>   student   Mon   Tue   Wed
#>   <chr>   <dbl> <dbl> <dbl>
#> 1 Asha        1     1     0
#> 2 Bilal       1     0     0
#> 3 Cleo        1     0     0
```

The other trap is duplicate keys. If more than one row shares the same `student`/`day` pair, pivot_wider cannot decide which `present` value to use and produces list-columns (with a warning). The fix is either to deduplicate first or pass `values_fn = sum` (or `mean`, `max`, etc.) to aggregate.

```r title="Handle duplicates with valuesfn"
log <- tibble(
  student = c("Asha","Asha","Asha"),
  day = c("Mon","Mon","Tue"),
  minutes = c(30, 15, 45)
)

log |>
  pivot_wider(names_from = day, values_from = minutes, values_fn = sum)
#> # A tibble: 1 x 3
#>   student   Mon   Tue
#>   <chr>   <dbl> <dbl>
#> 1 Asha       45    45
```

> **[KEY INSIGHT]** `values_fill` handles missing combinations; `values_fn` handles duplicate combinations. Memorize this pair, between them they fix 95% of real pivot_wider headaches.

**Try it:** Fix this pivot so missing months become 0 instead of NA.

```r title="Exercise: User visits wide with fill"
# Starter code
visits <- tibble(
  user = c("a","a","b","c"),
  month = c("Jan","Feb","Jan","Mar"),
  n = c(3, 5, 2, 7)
)

# pivot_wider with values_fill = 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="User visits wide solution"
library(tidyr); library(tibble)
visits <- tibble(
  user = c("a","a","b","c"),
  month = c("Jan","Feb","Jan","Mar"),
  n = c(3, 5, 2, 7)
)
visits |>
  pivot_wider(names_from = month, values_from = n, values_fill = 0)
#> # A tibble: 3 x 4
#>   user    Jan   Feb   Mar
#>   <chr> <dbl> <dbl> <dbl>
#> 1 a         3     5     0
#> 2 b         2     0     0
#> 3 c         0     0     7
```

Without `values_fill`, users `b` and `c` would get `NA` for the months they never visited. `values_fill = 0` tells pivot_wider to treat missing user-month combinations as zero visits, which matches the intuition that "no record" means "did not visit".
</details>

## How do you reshape multiple value columns at once?

Sometimes one row of long data carries several kinds of measurement. Think: per student, per subject, both a grade and a rank. You want a wide table where each subject gets *two* columns, one for grade, one for rank. `pivot_wider()` handles this naturally.

```r title="Multiple value columns at once"
exam <- tibble(
  student = c("Asha","Asha","Bilal","Bilal"),
  subject = c("math","science","math","science"),
  grade = c(88, 81, 72, 79),
  rank = c(1, 2, 2, 1)
)

exam |>
  pivot_wider(
    names_from = subject,
    values_from = c(grade, rank)
  )
#> # A tibble: 2 x 5
#>   student grade_math grade_science rank_math rank_science
#>   <chr>        <dbl>         <dbl>     <dbl>        <dbl>
#> 1 Asha            88            81         1            2
#> 2 Bilal           72            79         2            1
```

With `values_from = c(grade, rank)`, pivot_wider produces column names by concatenating the value name and the subject. You control the order and glue character with `names_sep` or `names_glue`:

```r title="Custom namesglue templating"
exam |>
  pivot_wider(
    names_from = subject,
    values_from = c(grade, rank),
    names_glue = "{subject}_{.value}"
  )
#> # A tibble: 2 x 5
#>   student math_grade science_grade math_rank science_rank
#>   <chr>        <dbl>         <dbl>     <dbl>        <dbl>
#> 1 Asha            88            81         1            2
#> 2 Bilal           72            79         2            1
```

`{.value}` is a placeholder for the name of the value column being spread. `{subject}` is the current value from `names_from`. This templating is a huge time-saver when you need the resulting columns in a specific order for a report.

> **[TIP]** The same trick works in reverse with `pivot_longer()`, pass `names_to = c(".value", "year")` with `names_sep = "_"` and a header like `grade_2022` becomes a `grade` column with a `year` side column. The `.value` token tells pivot_longer "this chunk is the value column's new name".

**Try it:** Widen this long table so each product becomes two columns, `units` and `revenue`.

```r title="Exercise: Orders wide with units and revenue"
# Starter code
orders <- tibble(
  region = c("N","N","S","S"),
  product = c("widget","gizmo","widget","gizmo"),
  units = c(10, 5, 8, 3),
  revenue = c(100, 75, 80, 45)
)

# pivot_wider with values_from = c(units, revenue)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Orders wide solution"
library(tidyr); library(tibble)
orders <- tibble(
  region = c("N","N","S","S"),
  product = c("widget","gizmo","widget","gizmo"),
  units = c(10, 5, 8, 3),
  revenue = c(100, 75, 80, 45)
)
orders |>
  pivot_wider(
    names_from = product,
    values_from = c(units, revenue)
  )
#> # A tibble: 2 x 5
#>   region units_widget units_gizmo revenue_widget revenue_gizmo
#>   <chr>         <dbl>       <dbl>          <dbl>         <dbl>
#> 1 N                10           5            100            75
#> 2 S                 8           3             80            45
```

Passing a vector to `values_from` asks pivot_wider to spread *both* measurement columns across the product dimension at once. You end up with four new columns (`units_widget`, `units_gizmo`, `revenue_widget`, `revenue_gizmo`) and the original `region` preserved as the row identifier.
</details>

## When should you reshape vs keep data as-is?

Reshaping is not free. It changes the shape of your data, and if you pipe it through a long chain of dplyr calls you can lose track of what you have. A simple rule: reshape when a downstream function *needs* the other shape, and reshape back only if you need to present results.

Here are the common triggers for going long:

- **You are about to plot with ggplot2.** Every aesthetic (`x`, `y`, `color`, `facet`) needs a column. If the thing you want on the x-axis is a column header, pivot first.
- **You are grouping with `group_by()`.** dplyr groups by column values, not by column names. If your grouping variable is in the headers, pivot first.
- **You are computing summaries across variables.** `summarise()` and `across()` work on columns, but pivoting to long form makes many "mean per group" jobs a one-liner.

Triggers for going wide:

- **You are building a report table** where humans will read rows and columns side by side.
- **You are computing ratios or differences** between specific columns, for example Q2 revenue divided by Q1 revenue is trivial when they are two columns and awkward when they share one.
- **You are exporting to a spreadsheet** where analysts expect the wide layout.

```r title="Long-first compute then widen"
# Long-first workflow: pivot, compute, then pivot back for the final table
sales_long |>
  group_by(quarter) |>
  summarise(total = sum(sales), avg = mean(sales)) |>
  pivot_wider(names_from = quarter, values_from = c(total, avg))
#> # A tibble: 1 x 6
#>   total_Q1 total_Q2 total_Q3 avg_Q1 avg_Q2 avg_Q3
#>      <dbl>    <dbl>    <dbl>  <dbl>  <dbl>  <dbl>
#> 1      360      410      415    120 136.67 138.33
```

> **[NOTE]** If you never plot and never export, you probably do not need to reshape at all. Shape is a means, not an end, do not pivot for fun.

**Try it:** Given this long table of temperatures, produce a wide report showing min and max temperature per city per year.

```r title="Exercise: Temperatures by year and kind"
# Starter code
temps <- tibble(
  city = rep(c("Pune","Berlin"), each = 4),
  year = rep(c(2022,2022,2023,2023), 2),
  kind = rep(c("min","max"), 4),
  temp = c(18, 38, 19, 39, -5, 28, -4, 30)
)

# pivot_wider with names_from = c(year, kind)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Temperatures wide solution"
library(tidyr); library(tibble)
temps <- tibble(
  city = rep(c("Pune","Berlin"), each = 4),
  year = rep(c(2022,2022,2023,2023), 2),
  kind = rep(c("min","max"), 4),
  temp = c(18, 38, 19, 39, -5, 28, -4, 30)
)
temps |>
  pivot_wider(names_from = c(year, kind), values_from = temp)
#> # A tibble: 2 x 5
#>   city   `2022_min` `2022_max` `2023_min` `2023_max`
#>   <chr>       <dbl>      <dbl>      <dbl>      <dbl>
#> 1 Pune           18         38         19         39
#> 2 Berlin         -5         28         -4         30
```

Passing two columns to `names_from` asks pivot_wider to build one new column per unique `year`/`kind` combination, joining the levels with an underscore. Each city ends up with four summary columns side by side, ideal for a compact report.
</details>

## Practice Exercises

These exercises combine multiple ideas from the post. Work through them in order, each builds on the previous.

### Exercise 1: Clean up a messy survey

You receive this survey export. Reshape it so each row is one respondent-question pair, then compute the mean score per question.

```r title="Exercise: Survey mean score pipeline"
library(tidyr); library(dplyr)

survey_wide <- tibble(
  respondent = 1:5,
  q1_score = c(4, 5, 3, 4, 5),
  q2_score = c(3, 4, 5, 4, 2),
  q3_score = c(5, 5, 4, 3, 4)
)

# 1. pivot_longer to one row per (respondent, question)
# 2. group_by(question) |> summarise(mean_score = mean(score))
```

<details><summary>Solution</summary>

```r title="Survey mean score solution"
survey_wide |>
  pivot_longer(
    cols = -respondent,
    names_to = "question",
    values_to = "score",
    names_pattern = "(q[0-9])_score"
  ) |>
  group_by(question) |>
  summarise(mean_score = mean(score))
```

</details>

### Exercise 2: Build a pivot-table report

Turn this sales log into a wide report: one row per store, one column per product, and a final column with the store total. Fill missing combinations with 0.

```r title="Exercise: Sales wide with row totals"
sales_log <- tibble(
  store = c("N","N","N","S","S","E"),
  product = c("A","B","C","A","C","B"),
  units = c(10, 5, 7, 12, 4, 9)
)

# 1. pivot_wider with values_fill = 0
# 2. mutate a total column using rowSums(across(where(is.numeric)))
```

<details><summary>Solution</summary>

```r title="Sales wide with totals solution"
sales_log |>
  pivot_wider(names_from = product, values_from = units, values_fill = 0) |>
  mutate(total = rowSums(across(A:C)))
```

</details>

### Exercise 3: Round-trip a dataset with multiple values

Take this exam table, go wide with two value columns, then long again to recover the original shape.

```r title="Exercise: Exam round-trip reshape"
exam_long <- tibble(
  student = rep(c("Asha","Bilal"), each = 3),
  subject = rep(c("math","sci","eng"), 2),
  score = c(88, 81, 77, 72, 79, 85),
  rank = c(1, 2, 3, 3, 2, 1)
)

# Wide: pivot_wider with values_from = c(score, rank)
# Long again: pivot_longer with names_to = c(".value","subject"), names_sep = "_"
```

<details><summary>Solution</summary>

```r title="Exam round-trip solution"
wide <- exam_long |>
  pivot_wider(
    names_from = subject,
    values_from = c(score, rank),
    names_glue = "{.value}_{subject}"
  )

wide |>
  pivot_longer(
    cols = -student,
    names_to = c(".value", "subject"),
    names_sep = "_"
  )
```

</details>

## Complete Example

Here is an end-to-end pipeline on a messy fake dataset. We start wide, reshape to long for analysis, then widen again for the final report.

```r title="End-to-end GDP and population pipeline"
library(tidyr); library(dplyr)

# Step 1: raw wide data as it arrives from a spreadsheet
raw <- tibble(
  country = c("India","Brazil","Kenya"),
  gdp_2021 = c(3.18, 1.61, 0.11),
  gdp_2022 = c(3.39, 1.92, 0.12),
  pop_2021 = c(1408, 214, 53),
  pop_2022 = c(1417, 215, 54)
)

# Step 2: pivot to long with TWO values columns in one go
long <- raw |>
  pivot_longer(
    cols = -country,
    names_to = c(".value", "year"),
    names_sep = "_",
    names_transform = list(year = as.integer)
  )
long
#> # A tibble: 6 x 4
#>   country  year   gdp   pop
#>   <chr>   <int> <dbl> <dbl>
#> 1 India    2021  3.18  1408
#> 2 India    2022  3.39  1417
#> 3 Brazil   2021  1.61   214
#> 4 Brazil   2022  1.92   215
#> 5 Kenya    2021  0.11    53
#> 6 Kenya    2022  0.12    54

# Step 3: analysis in long form is one line
long |>
  mutate(gdp_per_capita = gdp * 1000 / pop) |>
  arrange(desc(gdp_per_capita))
#> # A tibble: 6 x 5
#>   country  year   gdp   pop gdp_per_capita
#>   <chr>   <int> <dbl> <dbl>          <dbl>
#> 1 Brazil   2022  1.92   215           8.93
#> 2 Brazil   2021  1.61   214           7.52
#> 3 India    2022  3.39  1417           2.39
#> 4 India    2021  3.18  1408           2.26
#> 5 Kenya    2022  0.12    54           2.22
#> 6 Kenya    2021  0.11    53           2.08

# Step 4: wide report, one column per year per metric, for the PDF
long |>
  mutate(gdp_per_capita = round(gdp * 1000 / pop, 2)) |>
  pivot_wider(
    names_from = year,
    values_from = c(gdp, pop, gdp_per_capita),
    names_glue = "{.value}_{year}"
  )
```

The `.value` token does the heavy lifting in both directions. In step 2 it captures the prefix (`gdp` or `pop`) as a destination column name. In step 4 it plugs those names back into the new wide headers. Once you have that token in your head, the rest of tidyr feels obvious.

## Summary

| Concept | pivot_longer() | pivot_wider() |
|---|---|---|
| Direction | wide → long | long → wide |
| Main args | cols, names_to, values_to | names_from, values_from |
| Splits names | names_sep, names_pattern |, |
| Combines values |, | values_from = c(a, b) |
| Missing combos | values_drop_na | values_fill |
| Duplicate keys |, | values_fn |
| Templated names |, | names_glue |
| Special token | `.value` (inverse) | `.value` |

Four rules to remember:

1. **Plot long, report wide.** Long form for analysis and ggplot; wide form for human-readable tables.
2. **`cols` uses tidyselect.** Same helpers as `select()`, `starts_with()`, `-col`, ranges, etc.
3. **Missing vs duplicate are different fixes.** `values_fill` for holes, `values_fn` for collisions.
4. **`.value` is the round-trip token.** Use it when headers encode both a variable name and a group.

## References

- [tidyr pivoting vignette](https://tidyr.tidyverse.org/articles/pivot.html), the authoritative reference from the package authors.
- [pivot_longer() reference](https://tidyr.tidyverse.org/reference/pivot_longer.html)
- [pivot_wider() reference](https://tidyr.tidyverse.org/reference/pivot_wider.html)
- [Hadley Wickham, *Tidy Data*, JSS 2014](https://www.jstatsoft.org/article/view/v059i10), the paper that started it all.
- [R for Data Science, 2e, Data Tidying chapter](https://r4ds.hadley.nz/data-tidy.html)
- [tidyselect reference](https://tidyselect.r-lib.org/reference/language.html), for the helpers `cols` accepts.

## Continue Learning

- [dplyr filter() and select()](dplyr-filter-select.html), the row and column basics that pair with every pivot.
- [dplyr group_by() and summarise()](dplyr-group-by-summarise.html), long data shines here; pivot first, group second.
- [R Joins With Visual Diagrams](R-Joins.html), combine reshaped data with other tables.
