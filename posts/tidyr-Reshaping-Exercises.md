---
title: "tidyr Reshaping Exercises: 10 pivot_longer & pivot_wider Problems, Solved Step-by-Step"
slug: "tidyr-Reshaping-Exercises"
description: "Practise tidyr reshaping with 10 pivot_longer() and pivot_wider() problems in R. Runnable code blocks and click-to-reveal solutions, beginner to advanced."
keywords: "tidyr exercises, pivot_longer exercises, pivot_wider exercises, tidyr practice problems, reshape data in R, wide to long R, tidyr practice, R data reshaping exercises"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.5"
post_type: "EX"
sidebar_title: "tidyr Reshaping (10 problems)"
auto_link_terms: "tidyr exercises|pivot_longer exercises|pivot_wider exercises|tidyr reshaping exercises|tidyr practice problems|reshape data exercises"
auto_link_case_sensitive: false
fr_parent: "pivot_longer-pivot_wider-Reshape-Data-in-R.html"
difficulty: "Intermediate"
---

# tidyr Reshaping Exercises: 10 pivot_longer & pivot_wider Problems

<p class="lead">These 10 runnable tidyr exercises take you from basic <code>pivot_longer()</code> and <code>pivot_wider()</code> calls to advanced tricks like <code>names_sep</code>, <code>names_pattern</code>, and the <code>.value</code> sentinel, with a click-to-reveal solution for every problem.</p>

## How do you reshape wide data into long format with pivot_longer()?

Most datasets arrive in *wide* shape, one row per subject, one column per measurement, but ggplot2 and dplyr expect *long* shape: one row per observation. `pivot_longer()` is the bridge. Let's load `tidyr` and reshape the built-in `relig_income` dataset on US religious groups and their income brackets, so you can see the shape of a pivot call before writing one yourself. Every exercise below runs in the same R session, so variables carry over.

```r title="Collapse ten income columns into long"
library(tidyr)
library(tibble)   # for tribble()
library(dplyr)    # for group_by(), mutate(), slice_max(), and the Complete Example

# Payoff: collapse 10 income columns into 2 (income, count)
long_relig <- pivot_longer(
  relig_income,
  cols      = -religion,
  names_to  = "income",
  values_to = "count"
)
head(long_relig)
#> # A tibble: 6 × 3
#>   religion income             count
#>   <chr>    <chr>              <dbl>
#> 1 Agnostic <$10k                 27
#> 2 Agnostic $10-20k               34
#> 3 Agnostic $20-30k               60
#> 4 Agnostic $30-40k               81
#> 5 Agnostic $40-50k               76
#> 6 Agnostic $50-75k              137
```

`relig_income` started as 18 rows × 11 columns; after pivoting it is 180 rows × 3 columns, every religion × income combination is now its own row. The three arguments did all the work: `cols = -religion` picks every column *except* religion, `names_to` names the new key column, and `values_to` names the new value column. This is the canonical wide-to-long move you'll reach for 90% of the time.

[NOTE]
**Built-in tidyr datasets keep exercises self-contained.** `relig_income`, `billboard`, `fish_encounters`, and `household` all ship with the tidyr package, so you can run every exercise in this page without touching the file system.

**Try it:** Reshape `relig_income` but name the new columns `bracket` and `n` instead. Save to `ex1_long` and check the row count.

```r title="Exercise: Rename pivotlonger output columns"
# Exercise 1: rename the new columns
# Hint: change names_to and values_to

ex1_long <- relig_income    # replace with your pivot_longer call
nrow(ex1_long)
#> Expected after your fix: 180
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rename pivotlonger output solution"
ex1_long <- pivot_longer(
  relig_income,
  cols      = -religion,
  names_to  = "bracket",
  values_to = "n"
)
nrow(ex1_long)
#> [1] 180
head(ex1_long, 3)
#> # A tibble: 3 × 3
#>   religion bracket     n
#>   <chr>    <chr>   <dbl>
#> 1 Agnostic <$10k      27
#> 2 Agnostic $10-20k    34
#> 3 Agnostic $20-30k    60
```

**Explanation:** The `names_to` and `values_to` arguments are just labels, rename them freely. 18 religions × 10 brackets = 180 rows.

</details>

**Try it:** The `billboard` dataset has one row per song and weekly rank columns `wk1`, `wk2`, ..., `wk76`. Reshape it so there are two new columns, `week` and `rank`. Save to `ex2_long`.

```r title="Exercise: Pivot a week range"
# Exercise 2: pivot a range of columns
# Hint: cols = wk1:wk76

ex2_long <- billboard       # replace with your pivot_longer call
ncol(ex2_long)
#> Expected after your fix: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pivot week range solution"
ex2_long <- pivot_longer(
  billboard,
  cols      = wk1:wk76,
  names_to  = "week",
  values_to = "rank"
)
head(ex2_long, 3)
#> # A tibble: 3 × 5
#>   artist  track                   date.entered week   rank
#>   <chr>   <chr>                   <date>       <chr> <dbl>
#> 1 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk1      87
#> 2 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk2      82
#> 3 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk3      72
```

**Explanation:** `wk1:wk76` selects the contiguous range of week columns. The three id columns (`artist`, `track`, `date.entered`) are preserved as-is; the 76 week columns collapse into two, giving 24,092 rows total.

</details>

## How do you turn long data back into wide format with pivot_wider()?

`pivot_wider()` is the mirror image of `pivot_longer()`. It takes a key column and a value column and spreads them back across new columns, perfect for presenting results or for undoing a reshape you did earlier in a pipeline. The two arguments that matter most are `names_from` (which column's values become the new column headers) and `values_from` (which column fills the cells).

```r title="Rebuild wide frame from long"
# Rebuild the original wide frame from ex1_long
wide_again <- pivot_wider(
  ex1_long,
  names_from  = bracket,
  values_from = n
)
dim(wide_again)
#> [1] 18 11
head(wide_again[, 1:4])
#> # A tibble: 6 × 4
#>   religion `<$10k` `$10-20k` `$20-30k`
#>   <chr>      <dbl>     <dbl>     <dbl>
#> 1 Agnostic      27        34        60
#> 2 Atheist       12        27        37
#> 3 Buddhist      27        21        30
#> 4 Catholic     418       617       732
#> 5 Don't k…      15        14        15
#> 6 Evangel…     575       869      1064
```

The 180-row long frame collapses back to 18 × 11, the exact shape of the original `relig_income`. That is the invariant you want for any round-trip reshape: `pivot_wider(pivot_longer(x))` should return `x` (up to column ordering). When it doesn't, you have duplicate keys hiding in your data.

[TIP]
**Always sanity-check a round trip.** If `pivot_wider(pivot_longer(x))` changes the row count or introduces `NA`s you didn't have before, your (`id`, `key`) pairs are not unique, inspect with `janitor::get_dupes()` or a quick `count()`.

**Try it:** The `fish_encounters` dataset tracks which fish were seen at which river monitoring station. Pivot it so that each station becomes its own column, with the `seen` value in the cells. Save to `ex3_wide`.

```r title="Exercise: Long to wide with pivotwider"
# Exercise 3: long -> wide
# Hint: names_from = station, values_from = seen

ex3_wide <- fish_encounters    # replace with your pivot_wider call
ncol(ex3_wide)
#> Expected after your fix: 12
```

<details>
<summary>Click to reveal solution</summary>

```r title="Long to wide solution"
ex3_wide <- pivot_wider(
  fish_encounters,
  names_from  = station,
  values_from = seen
)
head(ex3_wide, 3)
#> # A tibble: 3 × 12
#>   fish  Release I80_1 Lisbon  Rstr Base_TD  BCE  BCW  BCE2  BCW2   MAE   MAW
#>   <fct>   <int> <int>  <int> <int>   <int> <int> <int> <int> <int> <int> <int>
#> 1 4842        1     1      1     1       1    1    1     1     1     1     1
#> 2 4843        1     1      1     1       1    1    1     1     1     1     1
#> 3 4844        1     1      1     1       1    1    1    NA    NA    NA    NA
```

**Explanation:** Fish `4844` wasn't seen at the last four stations, so those cells are `NA`, `pivot_wider()` produces `NA` wherever a (fish, station) pair is missing from the input.

</details>

**Try it:** Repeat the pivot but replace missing encounters with `0` instead of `NA`. Save to `ex4_wide`.

```r title="Exercise: Fill missing cells with zero"
# Exercise 4: fill missing cells
# Hint: values_fill = 0

ex4_wide <- fish_encounters    # replace with your pivot_wider call
sum(is.na(ex4_wide))
#> Expected after your fix: 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fill missing cells solution"
ex4_wide <- pivot_wider(
  fish_encounters,
  names_from  = station,
  values_from = seen,
  values_fill = 0
)
sum(is.na(ex4_wide))
#> [1] 0
```

**Explanation:** `values_fill = 0` replaces every cell that would otherwise be `NA`. Pass a named list, e.g. `values_fill = list(seen = 0)`, when you have multiple value columns that need different defaults.

</details>

## How do you pick which columns to pivot with tidyselect helpers?

Listing columns by name is fine for small datasets, but the moment your column list grows, tidyselect helpers make the pivot call shorter and safer. Inside `cols =`, you can use `starts_with()`, `ends_with()`, `matches()` (regex), and `where(is.numeric)`, the same helpers you already use in `dplyr::select()`. Let's see it on `iris`, where the four measurement columns are all numeric and `Species` is a factor.

```r title="Pivot numeric iris columns with where"
# Pivot every numeric column in iris
iris_long <- pivot_longer(
  iris,
  cols      = where(is.numeric),
  names_to  = "measurement",
  values_to = "value"
)
head(iris_long, 4)
#> # A tibble: 4 × 3
#>   Species measurement  value
#>   <fct>   <chr>        <dbl>
#> 1 setosa  Sepal.Length   5.1
#> 2 setosa  Sepal.Width    3.5
#> 3 setosa  Petal.Length   1.4
#> 4 setosa  Petal.Width    0.2
```

The call pivoted all four numeric columns in one stroke without naming any of them. `iris` went from 150 × 5 to 600 × 3, exactly 150 × 4 value rows plus the untouched `Species` id column. Same result as `cols = Sepal.Length:Petal.Width`, but this version survives a column rename.

[TIP]
**`where(is.numeric)` is the fastest way to pivot every numeric column.** It is also a lifesaver in messy survey data where new numeric questions keep being added, you pivot once and forget.

**Try it:** Pivot `iris` so that only the `Petal.Length` and `Petal.Width` columns become rows (leave the sepal columns as-is). Save to `ex5_long`.

```r title="Exercise: Select with startswith"
# Exercise 5: select with starts_with()
# Hint: cols = starts_with("Petal")

ex5_long <- iris    # replace with your pivot_longer call
ncol(ex5_long)
#> Expected after your fix: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Select with startswith solution"
ex5_long <- pivot_longer(
  iris,
  cols      = starts_with("Petal"),
  names_to  = "petal_metric",
  values_to = "value"
)
head(ex5_long, 3)
#> # A tibble: 3 × 5
#>   Sepal.Length Sepal.Width Species petal_metric value
#>          <dbl>       <dbl> <fct>   <chr>        <dbl>
#> 1          5.1         3.5 setosa  Petal.Length   1.4
#> 2          5.1         3.5 setosa  Petal.Width    0.2
#> 3          4.9         3.0 setosa  Petal.Length   1.4
```

**Explanation:** `starts_with("Petal")` matches exactly `Petal.Length` and `Petal.Width`. The sepal columns stay put as id columns, so the result has 5 columns (2 sepals + Species + 2 new) and 300 rows.

</details>

## How do you split compound column names with names_sep and names_pattern?

Real datasets love to cram multiple variables into one header, `sales_2023_q1`, `mpg_city_2022`, `new_sp_m014`. `pivot_longer()` can split those headers during the pivot instead of leaving you with a messy string you have to separate later. Pass a vector to `names_to` (one name per piece) and tell tidyr how to cut the header with either `names_sep` (a delimiter) or `names_pattern` (a regex with capture groups).

```r title="Split compound names with namessep"
sales_wide <- tribble(
  ~store, ~sales_2023_q1, ~sales_2023_q2, ~sales_2024_q1, ~sales_2024_q2,
  "A",              120,            140,            150,            170,
  "B",               80,             95,            110,            125
)

sales_long <- pivot_longer(
  sales_wide,
  cols         = starts_with("sales_"),
  names_to     = c("year", "quarter"),
  names_prefix = "sales_",
  names_sep    = "_",
  values_to    = "sales"
)
sales_long
#> # A tibble: 8 × 4
#>   store year  quarter sales
#>   <chr> <chr> <chr>   <dbl>
#> 1 A     2023  q1        120
#> 2 A     2023  q2        140
#> 3 A     2024  q1        150
#> 4 A     2024  q2        170
#> 5 B     2023  q1         80
#> 6 B     2023  q2         95
#> 7 B     2024  q1        110
#> 8 B     2024  q2        125
```

`names_prefix = "sales_"` strips the common prefix first, then `names_sep = "_"` splits the remainder into exactly the two pieces named in `names_to`. Four columns become two (`year`, `quarter`) plus one `sales` value column, no messy post-pivot string surgery required.

[KEY INSIGHT]
**`names_sep` and `names_pattern` do the same job; the delimiter decides which.** Use `names_sep` whenever a clean character (or position) separates the fields. Use `names_pattern` when the pieces run together, for example `wk12` (letters + digits with no gap), where you need a regex capture group to pull the number out.

**Try it:** Reshape `billboard` so the week number is stored as an integer in a column called `week`. Use `names_pattern` to strip the `wk` prefix, and `names_transform` to cast the result to integer. Save to `ex6_long`.

```r title="Exercise: Extract digits with namespattern"
# Exercise 6: names_pattern with a capture group
# Hint: names_pattern = "wk(\\d+)"
#       names_transform = list(week = as.integer)

ex6_long <- billboard    # replace with your pivot_longer call
class(ex6_long$week)
#> Expected after your fix: "integer"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract digits with namespattern solution"
ex6_long <- pivot_longer(
  billboard,
  cols             = starts_with("wk"),
  names_to         = "week",
  names_pattern    = "wk(\\d+)",
  names_transform  = list(week = as.integer),
  values_to        = "rank",
  values_drop_na   = TRUE
)
head(ex6_long, 3)
#> # A tibble: 3 × 5
#>   artist track                   date.entered  week  rank
#>   <chr>  <chr>                   <date>       <int> <dbl>
#> 1 2 Pac  Baby Don't Cry (Keep... 2000-02-26       1    87
#> 2 2 Pac  Baby Don't Cry (Keep... 2000-02-26       2    82
#> 3 2 Pac  Baby Don't Cry (Keep... 2000-02-26       3    72
```

**Explanation:** `(\\d+)` captures only the digits after `wk`, so `week` comes out as `"1"`, `"2"`, .... `names_transform` then casts the string to integer. `values_drop_na = TRUE` discards weeks where a song wasn't on the chart, shrinking the result from ~24,000 rows to about 5,300.

</details>

**Try it:** Given the tribble below with `mpg_<road>_<year>` columns, reshape it so there is one row per (make, road, year) with an `mpg` value column. Save to `ex7_long`.

```r title="Exercise: Split into three fields"
# Exercise 7: names_sep with three outputs
mpg_wide <- tribble(
  ~make,     ~mpg_city_2021, ~mpg_hwy_2021, ~mpg_city_2022, ~mpg_hwy_2022,
  "Toyota",              28,            35,             30,            37,
  "Honda",               31,            38,             32,            40
)

ex7_long <- mpg_wide    # replace with your pivot_longer call
nrow(ex7_long)
#> Expected after your fix: 8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Split into three fields solution"
ex7_long <- pivot_longer(
  mpg_wide,
  cols      = starts_with("mpg_"),
  names_to  = c("metric", "road", "year"),
  names_sep = "_",
  values_to = "mpg"
)
ex7_long
#> # A tibble: 8 × 5
#>   make   metric road  year    mpg
#>   <chr>  <chr>  <chr> <chr> <dbl>
#> 1 Toyota mpg    city  2021     28
#> 2 Toyota mpg    hwy   2021     35
#> 3 Toyota mpg    city  2022     30
#> 4 Toyota mpg    hwy   2022     37
#> 5 Honda  mpg    city  2021     31
#> 6 Honda  mpg    hwy   2021     38
#> 7 Honda  mpg    city  2022     32
#> 8 Honda  mpg    hwy   2022     40
```

**Explanation:** `names_sep = "_"` cuts each header into three pieces, `mpg`, the road type, and the year, matching the three names in `names_to`. The `metric` column is constant here; in a real dataset it would hold multiple metrics like `"mpg"` and `"kWh"`.

</details>

## How do you reshape multiple value columns at once using .value?

What if a single row holds *two* values that should become *two* columns after the pivot? The built-in `household` dataset is the classic example: each row is a family, and the columns `dob_child1`, `dob_child2`, `name_child1`, `name_child2` encode both a *child* identifier and a *measurement type* (dob or name). Stacking everything into one value column would mix dates and names, which tidyr refuses to do. The answer is the special `.value` sentinel, it tells `pivot_longer()` that this piece of the header should become the *output column name*.

```r title="Reshape dob and name with .value"
hh_long <- household |> pivot_longer(
  cols      = -family,
  names_to  = c(".value", "child"),
  names_sep = "_"
)
hh_long
#> # A tibble: 10 × 4
#>   family child  dob        name
#>    <int> <chr>  <date>     <chr>
#> 1      1 child1 1998-11-26 Susan
#> 2      1 child2 2000-01-29 Jose
#> 3      2 child1 1996-06-22 Mark
#> 4      2 child2 NA         NA
#> 5      3 child1 2002-07-11 Sam
#> 6      3 child2 2004-04-05 Seth
#> 7      4 child1 2004-10-10 Craig
#> 8      4 child2 2009-08-27 Khai
#> 9      5 child1 2000-12-05 Parker
#>10      5 child2 2005-02-28 Gracie
```

`.value` sits in the `names_to` slot where `dob`/`name` lived in the original headers, and `"child"` takes the slot where `child1`/`child2` lived. The result has two *separate* typed columns, `dob` as a date and `name` as a character, instead of one messy column. Family 2's `child2` row has `NA` in both because that family only had one child in the source data.

[WARNING]
**Exactly one `.value` slot in `names_to`.** The other slot becomes the new key column. If you try to use `.value` twice, or forget it entirely when you have multiple value types, the pivot fails with a type-mismatch error.

**Try it:** Given the tribble below, reshape it so there is one row per (student, year) with two value columns `math` and `read`. Save to `ex8_long`.

```r title="Exercise: Pivot two score types by year"
# Exercise 8: .value with a year key
scores_wide <- tribble(
  ~student, ~score_math_2023, ~score_read_2023, ~score_math_2024, ~score_read_2024,
  "Asha",                 82,               78,               88,               84,
  "Ben",                  71,               73,               75,               80
)

ex8_long <- scores_wide    # replace with your pivot_longer call
names(ex8_long)
#> Expected after your fix: "student" "year" "math" "read"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pivot two score types solution"
ex8_long <- pivot_longer(
  scores_wide,
  cols         = -student,
  names_to     = c(".value", "year"),
  names_prefix = "score_",
  names_sep    = "_"
)
ex8_long
#> # A tibble: 4 × 4
#>   student year   math  read
#>   <chr>   <chr> <dbl> <dbl>
#> 1 Asha    2023     82    78
#> 2 Asha    2024     88    84
#> 3 Ben     2023     71    73
#> 4 Ben     2024     75    80
```

**Explanation:** After `names_prefix` trims `"score_"`, each remaining header looks like `math_2023` or `read_2024`. `names_sep = "_"` then hands the first piece to `.value` (which becomes the column name) and the second piece to `year`. Two headers per year collapse into two columns per row.

</details>

## Practice Exercises

The two capstone problems below combine everything above. They need more than one pivot call each, treat them like mini workflows and sketch the target shape on paper before you start typing.

### Exercise 9: Round-trip, long, summarise, wide again

Starting from `relig_income`, compute each income bracket's share of its religion's total. Your result should have one row per religion and one column per bracket (so the same shape as `relig_income`), but with proportions instead of raw counts. Save the final wide tibble to `ex9_result`.

```r title="Exercise: Share of income by religion"
# Exercise 9: round-trip reshape
# Hints:
#   1. pivot_longer to (religion, bracket, n)
#   2. group_by(religion) |> mutate(share = n / sum(n))
#   3. pivot_wider back using names_from = bracket, values_from = share
# You will need dplyr for group_by() and mutate().

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Share of income solution"
ex9_result <- relig_income |>
  pivot_longer(
    cols      = -religion,
    names_to  = "bracket",
    values_to = "n"
  ) |>
  group_by(religion) |>
  mutate(share = n / sum(n)) |>
  ungroup() |>
  select(religion, bracket, share) |>
  pivot_wider(
    names_from  = bracket,
    values_from = share
  )

dim(ex9_result)
#> [1] 18 11
round(head(ex9_result[, 1:4], 3), 3)
#> # A tibble: 3 × 4
#>   religion `<$10k` `$10-20k` `$20-30k`
#>   <chr>      <dbl>     <dbl>     <dbl>
#> 1 Agnostic   0.033     0.042     0.074
#> 2 Atheist    0.023     0.053     0.072
#> 3 Buddhist   0.054     0.042     0.06
```

**Explanation:** Pivoting long first lets `group_by(religion) |> mutate(share = n / sum(n))` divide each count by its religion total. Pivoting back wide returns the original 18 × 11 shape, but the cells now hold proportions that sum to 1 within each row. This long-compute-wide pattern is the reason `pivot_longer()` and `pivot_wider()` are always taught together.

</details>

### Exercise 10: Clean a messy wide dataset with compound headers and missing values

The tribble below holds quarterly store results. Column names encode three things, quarter, metric, currency, and a few cells are `NA`. Reshape it into a tidy frame with columns `store`, `quarter`, `sales`, `returns`, then drop any row where *both* `sales` and `returns` are missing. Save to `ex10_tidy`.

```r title="Exercise: Three-way compound headers"
# Exercise 10: real-world compound headers
messy_wide <- tribble(
  ~store, ~q1_sales_usd, ~q1_returns_usd, ~q2_sales_usd, ~q2_returns_usd,
  "A",            1200,             120,          1400,             150,
  "B",              NA,              NA,          1100,              95,
  "C",             980,             110,            NA,              NA
)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-way compound headers solution"
ex10_tidy <- messy_wide |>
  pivot_longer(
    cols         = -store,
    names_to     = c("quarter", ".value", "currency"),
    names_sep    = "_"
  ) |>
  select(-currency) |>
  filter(!(is.na(sales) & is.na(returns)))

ex10_tidy
#> # A tibble: 4 × 4
#>   store quarter sales returns
#>   <chr> <chr>   <dbl>   <dbl>
#> 1 A     q1       1200     120
#> 2 A     q2       1400     150
#> 3 B     q2       1100      95
#> 4 C     q1        980     110
```

**Explanation:** `names_to = c("quarter", ".value", "currency")` splits each header into three pieces: `"q1"`/`"q2"` become the `quarter` key, `"sales"`/`"returns"` become the output column names (thanks to `.value`), and `"usd"` goes into `currency`. Dropping the constant `currency` column and filtering out the all-`NA` rows yields a clean 4-row tidy frame.

</details>

## Complete Example

To wrap up, let's string the techniques together into a mini workflow on `billboard`: find the three tracks that stayed on the charts the longest, then display their weekly ranks in wide form. This is the kind of long-compute-wide loop you'll run every week in a real analysis job.

```r title="End-to-end billboard longevity analysis"
# End-to-end: tidy -> analyse -> display
bb_tidy <- billboard |>
  pivot_longer(
    cols             = starts_with("wk"),
    names_to         = "week",
    names_pattern    = "wk(\\d+)",
    names_transform  = list(week = as.integer),
    values_to        = "rank",
    values_drop_na   = TRUE
  )

bb_weeks <- bb_tidy |>
  group_by(artist, track) |>
  summarise(weeks_on_chart = n(), .groups = "drop") |>
  slice_max(weeks_on_chart, n = 3)

bb_weeks
#> # A tibble: 3 × 3
#>   artist         track                      weeks_on_chart
#>   <chr>          <chr>                               <int>
#> 1 Creed          Higher                                 57
#> 2 Lonestar       Amazed                                 55
#> 3 Creed          With Arms Wide Open                    47

bb_top3_wide <- bb_tidy |>
  semi_join(bb_weeks, by = c("artist", "track")) |>
  filter(week <= 6) |>
  pivot_wider(
    id_cols     = c(artist, track),
    names_from  = week,
    values_from = rank,
    names_glue  = "wk{week}"
  )

bb_top3_wide
#> # A tibble: 3 × 8
#>   artist   track                wk1   wk2   wk3   wk4   wk5   wk6
#>   <chr>    <chr>              <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Creed    Higher                81    77    73    63    61    58
#> 2 Creed    With Arms Wide Op…    84    78    76    74    71    63
#> 3 Lonestar Amazed                81    54    44    39    38    33
```

One `pivot_longer()` tidies the raw chart data, a dplyr pipeline finds the top-3 most persistent tracks, and a final `pivot_wider()` reshapes just those three tracks back to a wide weekly view, all from the same input frame. `names_glue = "wk{week}"` rebuilds the original `wk1`, `wk2`, ... column naming so the final table matches the publication convention of the source.

## Summary

| Problem type | Function | Key argument(s) |
|---|---|---|
| Wide → long, simple range | `pivot_longer()` | `cols`, `names_to`, `values_to` |
| Long → wide (inverse) | `pivot_wider()` | `names_from`, `values_from` |
| Fill missing cells on widen | `pivot_wider()` | `values_fill` |
| Pick columns programmatically | `pivot_longer()` | `cols = where(is.numeric)` / `starts_with()` |
| Split compound headers on a delimiter | `pivot_longer()` | `names_sep`, `names_prefix` |
| Split compound headers with regex | `pivot_longer()` | `names_pattern = "wk(\\d+)"` |
| Multiple value columns at once | `pivot_longer()` | `.value` in `names_to` |

[KEY INSIGHT]
**Every reshape is a round-trip.** If `pivot_wider(pivot_longer(x))` doesn't reproduce `x`, your data has duplicate keys, fix them before modelling, not after.

## References

1. tidyr, *pivot_longer() reference*. [Link](https://tidyr.tidyverse.org/reference/pivot_longer.html)
2. tidyr, *pivot_wider() reference*. [Link](https://tidyr.tidyverse.org/reference/pivot_wider.html)
3. tidyr, *Pivoting vignette*. [Link](https://tidyr.tidyverse.org/articles/pivot.html)
4. Wickham, H. & Grolemund, G., *R for Data Science* (2e), Chapter 5: Data tidying. [Link](https://r4ds.hadley.nz/data-tidy.html)
5. CRAN tidyr, *Pivoting vignette*. [Link](https://cran.r-project.org/web/packages/tidyr/vignettes/pivot.html)

## Continue Learning

- [pivot_longer() and pivot_wider(): Reshape Data in R Without Losing Your Mind](pivot_longer-pivot_wider-Reshape-Data-in-R.html), the parent tutorial walks through every argument you practised here, with extra worked examples.
- [dplyr group_by() & summarise() Exercises](dplyr-group-by-summarise-Exercises.html), grouping and summarising exercises that pair naturally with reshaping.
- [dplyr Exercises](dplyr-Exercises.html), a broader dplyr practice set covering filter, select, mutate, and summarise.
