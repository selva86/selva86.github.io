---
title: "dplyr Exercises: 15 Data Manipulation Practice Problems (With Solutions)"
slug: "dplyr-Exercises"
description: "Practise dplyr with 15 data manipulation exercises. filter, mutate, summarise, group_by, joins, and across, runnable solutions from beginner to advanced."
keywords: "dplyr exercises, dplyr practice problems, data manipulation exercises R, tidyverse exercises, dplyr practice, dplyr tutorial problems"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.1"
post_type: "EX"
sidebar_title: "dplyr (15 problems)"
auto_link_terms: "dplyr exercises|dplyr practice problems|dplyr practice|data manipulation exercises|tidyverse exercises"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
difficulty: "Intermediate"
exercise_count: 15
time_estimate_min: 45
---

# dplyr Exercises: 15 Data Manipulation Practice Problems

<p class="lead">Fifteen hands-on dplyr problems covering <code>filter()</code>, <code>mutate()</code>, <code>summarise()</code>, <code>group_by()</code>, joins, and <code>across()</code>, each with an expected result so you can verify and a runnable solution behind a reveal. Difficulty progresses from beginner to advanced.</p>

The 15 problems are grouped into three sections of five. Section 1 covers one or two verbs at a time. Section 2 mixes compound conditions, `across()`, `case_when()`, and joins. Section 3 stitches three or more concepts into real pipelines. Every problem ships with an expected result, two progressive hints, and a hidden solution with an explanation.

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
```

All code runs in one shared R session, so the setup block above loads the packages once and the exercises do not repeat it. Use `ex_` prefixed names (already scaffolded) so you do not overwrite anything by accident.

## Section 1. Filter, select, mutate, and summarise basics

These five problems use one or two verbs each.

### Exercise 1.1: Filter and select the fuel-efficient cars

**Task:** From `mtcars`, keep the cars with `mpg > 25` and show only the car name, `mpg`, `cyl`, and `hp`. `mtcars` stores the name as a row name, so lift it into a column first. Save the result to `ex_1_1`.

**Expected result:**

```
#>              car  mpg cyl  hp
#> 1       Fiat 128 32.4   4  66
#> 2    Honda Civic 30.4   4  52
#> 3 Toyota Corolla 33.9   4  65
#> 4      Fiat X1-9 27.3   4  66
#> 5  Porsche 914-2 26.0   4  91
#> 6   Lotus Europa 30.4   4 113
```

**Difficulty:** Beginner

[HINTS]
The car name is not a column yet, so `select()` cannot see it until you promote the row names first.
Use `rownames_to_column("car")`, then `filter(mpg > 25)`, then `select(car, mpg, cyl, hp)`.

```r title="Your turn"
ex_1_1 <- mtcars |>
  rownames_to_column("car") |>
  # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mtcars |>
  rownames_to_column("car") |>
  filter(mpg > 25) |>
  select(car, mpg, cyl, hp)
ex_1_1
#>              car  mpg cyl  hp
#> 1       Fiat 128 32.4   4  66
#> 2    Honda Civic 30.4   4  52
#> 3 Toyota Corolla 33.9   4  65
#> 4      Fiat X1-9 27.3   4  66
#> 5  Porsche 914-2 26.0   4  91
#> 6   Lotus Europa 30.4   4 113
```

**Explanation:** `rownames_to_column("car")` copies the row names into a regular column so `select()` can include them. Six cars clear the 25-mpg bar, and all six are 4-cylinder, no surprise for a 1974 dataset.

</details>

### Exercise 1.2: Add a power-to-weight column

**Task:** Add a column `pwr_wt` equal to `hp / wt` rounded to one decimal, then show the first 5 rows with only `mpg`, `hp`, `wt`, and `pwr_wt`. Save the result to `ex_1_2`.

**Expected result:**

```
#>                    mpg  hp    wt pwr_wt
#> Mazda RX4         21.0 110 2.620   42.0
#> Mazda RX4 Wag     21.0 110 2.875   38.3
#> Datsun 710        22.8  93 2.320   40.1
#> Hornet 4 Drive    21.4 110 3.215   34.2
#> Hornet Sportabout 18.7 175 3.440   50.9
```

**Difficulty:** Beginner

[HINTS]
You need a new column first, then a narrower set of columns, then only the first few rows.
Pipe `mtcars` into `mutate(pwr_wt = round(hp / wt, 1))`, then `select()`, then `head(5)`.

```r title="Your turn"
ex_1_2 <- mtcars |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mtcars |>
  mutate(pwr_wt = round(hp / wt, 1)) |>
  select(mpg, hp, wt, pwr_wt) |>
  head(5)
ex_1_2
#>                    mpg  hp    wt pwr_wt
#> Mazda RX4         21.0 110 2.620   42.0
#> Mazda RX4 Wag     21.0 110 2.875   38.3
#> Datsun 710        22.8  93 2.320   40.1
#> Hornet 4 Drive    21.4 110 3.215   34.2
#> Hornet Sportabout 18.7 175 3.440   50.9
```

**Explanation:** `mutate()` adds the new column, `select()` picks the reporting set, and `head()` trims to the first five rows. The `pwr_wt` column measures horsepower per unit of weight, a cleaner "how punchy is this car" index than raw `hp`.

</details>

### Exercise 1.3: Sort by mpg and show the top 5

**Task:** Arrange the cars in descending `mpg` order and show the top 5 with their name, `mpg`, and cylinder count. Save the result to `ex_1_3`.

**Expected result:**

```
#>              car  mpg cyl
#> 1 Toyota Corolla 33.9   4
#> 2       Fiat 128 32.4   4
#> 3    Honda Civic 30.4   4
#> 4   Lotus Europa 30.4   4
#> 5      Fiat X1-9 27.3   4
```

**Difficulty:** Beginner

[HINTS]
Sorting needs to happen before you trim to the top 5, and a plain sort goes smallest-first.
Promote the row names, then `arrange(desc(mpg))`, then `select(car, mpg, cyl)`, then `head(5)`.

```r title="Your turn"
ex_1_3 <- mtcars |>
  rownames_to_column("car") |>
  # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- mtcars |>
  rownames_to_column("car") |>
  arrange(desc(mpg)) |>
  select(car, mpg, cyl) |>
  head(5)
ex_1_3
#>              car  mpg cyl
#> 1 Toyota Corolla 33.9   4
#> 2       Fiat 128 32.4   4
#> 3    Honda Civic 30.4   4
#> 4   Lotus Europa 30.4   4
#> 5      Fiat X1-9 27.3   4
```

**Explanation:** `arrange(desc(mpg))` sorts in descending order; without `desc()` you would get the least efficient cars first. The Toyota Corolla wins the 1974 fuel-economy crown, and every car in the top 5 is 4-cylinder.

</details>

### Exercise 1.4: Count and mean mpg per cylinder group

**Task:** For each cylinder group (4, 6, 8), compute the count of cars and the mean `mpg` rounded to one decimal. Save the result to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 3 × 3
#>     cyl     n avg_mpg
#>   <dbl> <int>   <dbl>
#> 1     4    11    26.7
#> 2     6     7    19.7
#> 3     8    14    15.1
```

**Difficulty:** Beginner

[HINTS]
First split the rows into one group per cylinder count, then collapse each group to a single summary row.
Use `group_by(cyl)` then `summarise(n = n(), avg_mpg = round(mean(mpg), 1), .groups = "drop")`.

```r title="Your turn"
ex_1_4 <- mtcars |>
  # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- mtcars |>
  group_by(cyl) |>
  summarise(n = n(), avg_mpg = round(mean(mpg), 1), .groups = "drop")
ex_1_4
#> # A tibble: 3 × 3
#>     cyl     n avg_mpg
#>   <dbl> <int>   <dbl>
#> 1     4    11    26.7
#> 2     6     7    19.7
#> 3     8    14    15.1
```

**Explanation:** `group_by(cyl)` creates three implicit sub-tables and `summarise()` collapses each into a single row. The `.groups = "drop"` argument returns a plain tibble instead of a still-grouped one, saving an `ungroup()` step later. Fewer cylinders mean better mileage: 26.7 mpg for 4-cyl, 15.1 mpg for 8-cyl.

</details>

### Exercise 1.5: Count iris flowers by species with a percentage

**Task:** Use `count()` to count `iris` rows per `Species`, then add a `pct` column giving each species' share as a rounded percentage. Save the result to `ex_1_5`.

**Expected result:**

```
#>      Species  n  pct
#> 1     setosa 50 33.3
#> 2 versicolor 50 33.3
#> 3  virginica 50 33.3
```

**Difficulty:** Beginner

[HINTS]
`count()` already gives you the per-group counts in a column; you only need to turn those counts into a share.
After `count(Species)`, add `mutate(pct = round(n / sum(n) * 100, 1))`.

```r title="Your turn"
ex_1_5 <- iris |>
  # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- iris |>
  count(Species) |>
  mutate(pct = round(n / sum(n) * 100, 1))
ex_1_5
#>      Species  n  pct
#> 1     setosa 50 33.3
#> 2 versicolor 50 33.3
#> 3  virginica 50 33.3
```

**Explanation:** `count(Species)` is shorthand for `group_by(Species) |> summarise(n = n())`. The `iris` dataset is perfectly balanced, 50 rows per species, so each is 33.3% of the total. In a real-world dataset this same pattern is how you spot class imbalance before training a classifier.

</details>

## Section 2. Compound logic, across(), case_when, and joins

These five problems combine two or more concepts.

### Exercise 2.1: Filter with two conditions against the dataset mean

**Task:** Keep only cars where `mpg` is above the dataset mean AND `wt` is below the dataset mean. Show `mpg`, `hp`, `wt`, sorted by `mpg` descending. Save the result to `ex_2_1`.

**Expected result:**

```
#>                 mpg  hp    wt
#> Toyota Corolla 33.9  65 1.835
#> Fiat 128       32.4  66 2.200
#> Honda Civic    30.4  52 1.615
#> Lotus Europa   30.4 113 1.513
#> Fiat X1-9      27.3  66 1.935
#> Porsche 914-2  26.0  91 2.140
#> Merc 240D      24.4  62 3.190
#> Datsun 710     22.8  93 2.320
#> Toyota Corona  21.5  97 2.465
```

**Difficulty:** Intermediate

[HINTS]
Both conditions must hold at once, and each threshold is computed from the full table.
Inside `filter()`, separate `mpg > mean(mpg)` and `wt < mean(wt)` with a comma, which means AND.

```r title="Your turn"
ex_2_1 <- mtcars |>
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mtcars |>
  filter(mpg > mean(mpg), wt < mean(wt)) |>
  select(mpg, hp, wt) |>
  arrange(desc(mpg))
ex_2_1
#>                 mpg  hp    wt
#> Toyota Corolla 33.9  65 1.835
#> Fiat 128       32.4  66 2.200
#> Honda Civic    30.4  52 1.615
#> Lotus Europa   30.4 113 1.513
#> Fiat X1-9      27.3  66 1.935
#> Porsche 914-2  26.0  91 2.140
#> Merc 240D      24.4  62 3.190
#> Datsun 710     22.8  93 2.320
#> Toyota Corona  21.5  97 2.465
```

**Explanation:** `mean(mpg)` and `mean(wt)` are evaluated against the full `mtcars` table before filtering, so both thresholds come from the original 32-row dataset. Separating conditions with a comma inside `filter()` is identical to chaining with `&`, but the comma reads more naturally for simple AND logic.

</details>

### Exercise 2.2: Label cars as Economy, Standard, or Guzzler with case_when

**Task:** Add a `type` column with `case_when()`: `mpg > 25` is Economy, `mpg >= 15` is Standard, everything else is Guzzler. Then count cars per type, sorted by count. Save the result to `ex_2_2`.

**Expected result:**

```
#>       type  n
#> 1 Standard 20
#> 2  Economy  6
#> 3  Guzzler  6
```

**Difficulty:** Intermediate

[HINTS]
`case_when()` checks its conditions top to bottom, so the order you list them in changes the result.
Use `mutate(type = case_when(mpg > 25 ~ "Economy", mpg >= 15 ~ "Standard", TRUE ~ "Guzzler"))`, then `count(type, sort = TRUE)`.

```r title="Your turn"
ex_2_2 <- mtcars |>
  # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- mtcars |>
  mutate(type = case_when(
    mpg > 25  ~ "Economy",
    mpg >= 15 ~ "Standard",
    TRUE      ~ "Guzzler"
  )) |>
  count(type, sort = TRUE)
ex_2_2
#>       type  n
#> 1 Standard 20
#> 2  Economy  6
#> 3  Guzzler  6
```

**Explanation:** `case_when()` assigns the first matching label. A car with `mpg = 30` matches both `mpg > 25` and `mpg >= 15`, so order matters: putting `mpg >= 15` first would classify every Economy car as Standard. The final `TRUE ~ "Guzzler"` is the catch-all default.

</details>

### Exercise 2.3: Mean and standard deviation of every numeric column with across

**Task:** For each iris species, compute the mean and standard deviation of every numeric column in one `across()` call, rounded to 2 decimals, with result names like `Sepal.Length_mean`. Save the result to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 3 × 9
#>   Species    Sepal.Length_mean Sepal.Length_sd Sepal.Width_mean Sepal.Width_sd
#>   <fct>                  <dbl>           <dbl>            <dbl>          <dbl>
#> 1 setosa                  5.01            0.35             3.43           0.38
#> 2 versicolor              5.94            0.52             2.77           0.31
#> 3 virginica               6.59            0.64             2.97           0.32
#> # ... plus 4 more columns for Petal.Length and Petal.Width
```

**Difficulty:** Intermediate

[HINTS]
You want two statistics applied to every numeric column at once, named so you can tell mean from sd.
Inside `summarise()`, use `across(where(is.numeric), list(mean = \(x) round(mean(x), 2), sd = \(x) round(sd(x), 2)), .names = "{.col}_{.fn}")`.

```r title="Your turn"
ex_2_3 <- iris |>
  group_by(Species) |>
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- iris |>
  group_by(Species) |>
  summarise(
    across(
      where(is.numeric),
      list(
        mean = \(x) round(mean(x), 2),
        sd   = \(x) round(sd(x), 2)
      ),
      .names = "{.col}_{.fn}"
    ),
    .groups = "drop"
  )
ex_2_3
```

**Explanation:** `across(where(is.numeric), ...)` picks every numeric column, then the named list applies both `mean` and `sd` to each. The `.names = "{.col}_{.fn}"` glue template produces tidy column names. This single call replaces eight separate `summarise()` lines, one of the biggest ergonomic wins in modern dplyr.

</details>

### Exercise 2.4: Convert iris column names to snake_case

**Task:** Rename every column of `iris` to snake_case (lowercase, dots replaced with underscores), move `species` to the first position, and show the first 4 rows. Save the result to `ex_2_4`.

**Expected result:**

```
#>   species sepal_length sepal_width petal_length petal_width
#> 1  setosa          5.1         3.5          1.4         0.2
#> 2  setosa          4.9         3.0          1.4         0.2
#> 3  setosa          4.7         3.2          1.3         0.2
#> 4  setosa          4.6         3.1          1.5         0.2
```

**Difficulty:** Intermediate

[HINTS]
One verb applies a function to every column name; another reorders columns without dropping any.
Use `rename_with(~ tolower(gsub("\\.", "_", .x)))`, then `select(species, everything())`, then `head(4)`.

```r title="Your turn"
ex_2_4 <- iris |>
  # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- iris |>
  rename_with(~ tolower(gsub("\\.", "_", .x))) |>
  select(species, everything()) |>
  head(4)
ex_2_4
#>   species sepal_length sepal_width petal_length petal_width
#> 1  setosa          5.1         3.5          1.4         0.2
#> 2  setosa          4.9         3.0          1.4         0.2
#> 3  setosa          4.7         3.2          1.3         0.2
#> 4  setosa          4.6         3.1          1.5         0.2
```

**Explanation:** `rename_with()` applies a function to every column name. The lambda `~ tolower(gsub("\\.", "_", .x))` lowercases the name and swaps the literal dot for an underscore; the escaped `\\.` matches a real dot rather than the regex "any character". `select(species, everything())` is the standard "move this column first, keep the rest" idiom.

</details>

### Exercise 2.5: Find employees without a matching department

**Task:** Using the two data frames in the starter block, `left_join()` them so every employee shows their department budget (or `NA` when there is no match), then `anti_join()` to find the employees whose department is not listed. Save the anti-join result to `ex_2_5`.

**Expected result:**

```
#>    name dept budget
#> 1 Alice  Eng    500
#> 2   Bob  Mkt    300
#> 3 Carol  Eng    500
#> 4 David   HR     NA
#>    name dept
#> 1 David   HR
```

**Difficulty:** Intermediate

[HINTS]
One join keeps every left-table row and attaches matches; the other keeps only left-table rows that have no match at all.
`left_join(employees, departments, by = "dept")` for the budget view, `anti_join(employees, departments, by = "dept")` for the orphans.

```r title="Your turn"
employees   <- data.frame(name = c("Alice", "Bob", "Carol", "David"),
                          dept = c("Eng", "Mkt", "Eng", "HR"))
departments <- data.frame(dept = c("Eng", "Mkt", "Sales"),
                          budget = c(500, 300, 200))

# your code here: left_join to print, then save the anti_join to ex_2_5
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
employees   <- data.frame(name = c("Alice", "Bob", "Carol", "David"),
                          dept = c("Eng", "Mkt", "Eng", "HR"))
departments <- data.frame(dept = c("Eng", "Mkt", "Sales"),
                          budget = c(500, 300, 200))

left_join(employees, departments, by = "dept")
#>    name dept budget
#> 1 Alice  Eng    500
#> 2   Bob  Mkt    300
#> 3 Carol  Eng    500
#> 4 David   HR     NA

ex_2_5 <- anti_join(employees, departments, by = "dept")
ex_2_5
#>    name dept
#> 1 David   HR
```

**Explanation:** `left_join()` keeps every employee and attaches their department budget when available; David has no matching department, so `budget` comes back as `NA`. `anti_join()` inverts the question: give me only the left-table rows with *no* match in the right table. It is the standard dplyr tool for finding orphans.

</details>

## Section 3. Grouped ranking, share of total, and real pipelines

These five stitch three or more concepts into the kind of pipelines you write on the job.

### Exercise 3.1: Rank cars by mpg within each cylinder group

**Task:** For each cylinder group, rank the cars by `mpg` (rank 1 = most efficient), keep the top 3 per group, and show car name, `cyl`, `mpg`, and `rank`, sorted by `cyl` then `rank`. Save the result to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 9 × 4
#>   car               cyl   mpg  rank
#>   <chr>           <dbl> <dbl> <dbl>
#> 1 Toyota Corolla      4  33.9   1
#> 2 Fiat 128            4  32.4   2
#> 3 Honda Civic         4  30.4   3.5
#> 4 Lotus Europa        4  30.4   3.5
#> 5 Hornet 4 Drive      6  21.4   1
#> 6 Mazda RX4           6  21     2.5
#> 7 Mazda RX4 Wag       6  21     2.5
#> 8 Pontiac Firebird    8  19.2   1
#> 9 Hornet Sportabout   8  18.7   2
```

**Difficulty:** Advanced

[HINTS]
Ranking has to happen per group, so the ranking step belongs inside a grouped pipeline, and rank 1 should be the highest mpg.
Use a grouped `mutate(rank = rank(-mpg))`, then `filter(rank <= 3)`, then `arrange(cyl, rank)` and `ungroup()`.

```r title="Your turn"
ex_3_1 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  mutate(rank = rank(-mpg)) |>
  filter(rank <= 3) |>
  select(car, cyl, mpg, rank) |>
  arrange(cyl, rank) |>
  ungroup()
ex_3_1
#> # A tibble: 9 × 4
#>   car               cyl   mpg  rank
#>   <chr>           <dbl> <dbl> <dbl>
#> 1 Toyota Corolla      4  33.9   1
#> 2 Fiat 128            4  32.4   2
#> 3 Honda Civic         4  30.4   3.5
#> 4 Lotus Europa        4  30.4   3.5
#> 5 Hornet 4 Drive      6  21.4   1
#> 6 Mazda RX4           6  21     2.5
#> 7 Mazda RX4 Wag       6  21     2.5
#> 8 Pontiac Firebird    8  19.2   1
#> 9 Hornet Sportabout   8  18.7   2
```

**Explanation:** `rank(-mpg)` ranks by negative mpg so the highest mpg gets rank 1. The grouped `mutate()` keeps all 32 rows but numbers each within its cylinder sub-table; `filter(rank <= 3)` then trims to the top 3 per group. Honda Civic and Lotus Europa tie at 30.4 mpg, so both get the average rank 3.5; switch to `min_rank()` or `dense_rank()` for integer ranks.

</details>

### Exercise 3.2: Each car's hp as a percentage of its cylinder-group total

**Task:** For each cylinder group, compute every car's horsepower as a rounded percentage of that group's total horsepower. Show `car`, `cyl`, `hp`, and `hp_pct` for the first 10 rows sorted by `cyl` then `hp_pct` descending. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 10 × 4
#>    car              cyl    hp hp_pct
#>    <chr>          <dbl> <dbl>  <dbl>
#>  1 Lotus Europa       4   113   13.5
#>  2 Toyota Corona      4    97   11.6
#>  3 Merc 230           4    95   11.4
#>  4 Datsun 710         4    93   11.1
#>  5 Volvo 142E         4   109   13
#>  6 Porsche 914-2      4    91   10.9
#>  7 Fiat 128           4    66    7.9
#>  8 Fiat X1-9          4    66    7.9
#>  9 Toyota Corolla     4    65    7.8
#> 10 Honda Civic        4    52    6.2
```

**Difficulty:** Advanced

[HINTS]
Inside a grouped pipeline, an aggregate like `sum()` operates on the current group, not the whole table.
Use a grouped `mutate(hp_pct = round(hp / sum(hp) * 100, 1))`, then `arrange(cyl, desc(hp_pct))`, `ungroup()`, and `head(10)`.

```r title="Your turn"
ex_3_2 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  mutate(hp_pct = round(hp / sum(hp) * 100, 1)) |>
  select(car, cyl, hp, hp_pct) |>
  arrange(cyl, desc(hp_pct)) |>
  ungroup() |>
  head(10)
ex_3_2
```

**Explanation:** Inside a grouped `mutate()`, `sum(hp)` is the total for the current group, not the whole table. Dividing each car's `hp` by that group total gives its share of the group. This is the canonical "share of total" pattern, reusable for market share, portfolio weight, or any per-group proportion.

</details>

### Exercise 3.3: Two heaviest cars per cylinder group

**Task:** Use `slice_max()` to keep the two heaviest cars (by `wt`) in each cylinder group. Return `car`, `cyl`, `wt`, and `mpg`. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 6 × 4
#>   car                   cyl    wt   mpg
#>   <chr>               <dbl> <dbl> <dbl>
#> 1 Toyota Corona           4  2.46  21.5
#> 2 Merc 240D               4  3.19  24.4
#> 3 Valiant                 6  3.46  18.1
#> 4 Merc 280C               6  3.44  17.8
#> 5 Lincoln Continental     8  5.42  10.4
#> 6 Cadillac Fleetwood      8  5.25  10.4
```

**Difficulty:** Advanced

[HINTS]
There is a single verb that does "sort by a column and take the top n", and it respects the current grouping.
Inside `group_by(cyl)`, call `slice_max(wt, n = 2)`, then `select()` and `ungroup()`.

```r title="Your turn"
ex_3_3 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  slice_max(wt, n = 2) |>
  select(car, cyl, wt, mpg) |>
  ungroup()
ex_3_3
#> # A tibble: 6 × 4
#>   car                   cyl    wt   mpg
#>   <chr>               <dbl> <dbl> <dbl>
#> 1 Toyota Corona           4  2.46  21.5
#> 2 Merc 240D               4  3.19  24.4
#> 3 Valiant                 6  3.46  18.1
#> 4 Merc 280C               6  3.44  17.8
#> 5 Lincoln Continental     8  5.42  10.4
#> 6 Cadillac Fleetwood      8  5.25  10.4
```

**Explanation:** `slice_max(wt, n = 2)` picks the two rows with the largest `wt` per group. You could write `arrange(desc(wt)) |> head(2)` yourself, but `slice_max()` is clearer, handles ties via `with_ties`, and makes intent obvious. Prefer it over the superseded `top_n()`.

</details>

### Exercise 3.4: A five-step pipeline for manual-transmission fuel economy

**Task:** Chain five steps: keep manual cars (`am == 1`), add `kpl = mpg * 0.425` rounded to 2 decimals, group by `cyl`, summarise count and mean `kpl`, then sort by mean `kpl` descending. Save the result to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 3 × 3
#>     cyl     n avg_kpl
#>   <dbl> <int>   <dbl>
#> 1     4     8   12.1
#> 2     6     3    8.44
#> 3     8     2    6.55
```

**Difficulty:** Advanced

[HINTS]
This is a five-verb pipeline; write it one verb per line and check the shape after each.
The order is `filter()` then `mutate()` then `group_by()` then `summarise()` then `arrange()`.

```r title="Your turn"
ex_3_4 <- mtcars |>
  # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- mtcars |>
  filter(am == 1) |>
  mutate(kpl = round(mpg * 0.425, 2)) |>
  group_by(cyl) |>
  summarise(n = n(), avg_kpl = round(mean(kpl), 2), .groups = "drop") |>
  arrange(desc(avg_kpl))
ex_3_4
#> # A tibble: 3 × 3
#>     cyl     n avg_kpl
#>   <dbl> <int>   <dbl>
#> 1     4     8   12.1
#> 2     6     3    8.44
#> 3     8     2    6.55
```

**Explanation:** Five verbs, each doing one job, composed with pipes. The intermediate shape changes three times: 32-row `mtcars`, then 13 manual cars, then 13 manual cars with `kpl`, then 3 grouped rows. Writing each verb on its own line keeps the pipeline readable and lets you comment out a step to debug.

</details>

### Exercise 3.5: Stratified 30% sample per iris species

**Task:** Take a random 30% sample from each iris species (roughly 15 rows per species), using `set.seed(42)` for reproducibility, then count rows per species to verify the stratification. Save the count to `ex_3_5`.

**Expected result:**

```
#>      Species  n
#> 1     setosa 15
#> 2 versicolor 15
#> 3  virginica 15
```

**Difficulty:** Advanced

[HINTS]
Sampling per group means the sampling verb must run inside a grouped pipeline, and a seed must be set before it.
Call `set.seed(42)`, then `group_by(Species) |> slice_sample(prop = 0.3) |> ungroup() |> count(Species)`.

```r title="Your turn"
set.seed(42)

ex_3_5 <- iris |>
  group_by(Species) |>
  # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)

ex_3_5 <- iris |>
  group_by(Species) |>
  slice_sample(prop = 0.3) |>
  ungroup() |>
  count(Species)
ex_3_5
#>      Species  n
#> 1     setosa 15
#> 2 versicolor 15
#> 3  virginica 15
```

**Explanation:** Inside a grouped pipeline, `slice_sample(prop = 0.3)` takes 30% of each group independently, which is what stratified sampling means. Without `group_by()`, you would get 45 rows drawn uniformly from the full 150-row table with no species balance. `set.seed(42)` fixes the random draw so every reader sees identical counts, the standard recipe for a reproducible stratified train/test split.

</details>

## Summary

The 15 problems together exercise every core dplyr verb plus the two most common helper patterns, `case_when()` and `across()`.

| Verb / helper | Exercises that use it |
|---|---|
| `filter()` | 1.1, 2.1, 3.4 |
| `select()` | 1.1, 1.2, 1.3, 2.4, 3.1, 3.2, 3.3 |
| `mutate()` | 1.2, 2.2, 2.4, 3.1, 3.2, 3.4 |
| `arrange()` | 1.3, 2.1, 3.1, 3.2, 3.4 |
| `group_by()` + `summarise()` | 1.4, 2.3, 3.4 |
| `count()` | 1.5, 2.2, 3.5 |
| `case_when()` | 2.2 |
| `across()` + `where()` | 2.3 |
| `rename_with()` | 2.4 |
| `left_join()` + `anti_join()` | 2.5 |
| `rank()` / `slice_max()` / `slice_sample()` | 3.1, 3.3, 3.5 |
| Grouped share of total | 3.2 |

If you solved Sections 1 and 2 without peeking, you are comfortable with everyday dplyr. If you solved Section 3 too, you are ready for window functions, complex joins, and real analytical pipelines.

## FAQ

**Q: Should I use the native pipe `|>` or the magrittr pipe `%>%`?**
Both work. The native `|>` is built into base R from version 4.1 and is the current recommendation: no package needed, marginally faster, simpler syntax. Use `%>%` only when you need the dot placeholder (`df %>% lm(y ~ x, data = .)`) or the assignment pipe `%<>%`. Every solution above uses `|>`.

**Q: Does dplyr change my data frame in place?**
No. dplyr verbs always return a new tibble; they never modify the original. To keep a transformed version, assign it to a variable. This immutability is what makes pipelines safe to compose and debug.

**Q: Does `group_by()` stay active after `summarise()`?**
`summarise()` peels off one level of grouping. To be explicit and avoid surprising later verbs, pass `.groups = "drop"` to `summarise()` or add `ungroup()`. Every grouped solution above does one or the other.

**Q: How does dplyr handle `NA` inside `filter()`?**
`filter()` drops any row where the condition evaluates to `NA`. To keep `NA` rows explicitly, write `filter(df, col > 5 | is.na(col))`. For aggregates like `mean()` and `sum()`, pass `na.rm = TRUE`.

**Q: What is the difference between `slice_max(col, n = k)` and `top_n(k, col)`?**
`slice_max()` is the modern replacement for `top_n()`. Both keep the `k` largest-`col` rows, but `slice_max()` has clearer argument order, a companion `slice_min()`, and a `with_ties` argument. `top_n()` is superseded; prefer `slice_max()` in new code.

## References

1. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 3: Data transformation. [Link](https://r4ds.hadley.nz/data-transform.html)
2. dplyr documentation, `filter()` reference. [Link](https://dplyr.tidyverse.org/reference/filter.html)
3. dplyr documentation, `mutate()` reference. [Link](https://dplyr.tidyverse.org/reference/mutate.html)
4. dplyr documentation, `summarise()` reference. [Link](https://dplyr.tidyverse.org/reference/summarise.html)
5. dplyr documentation, `across()` for multi-column operations. [Link](https://dplyr.tidyverse.org/reference/across.html)
6. dplyr documentation, mutating and filtering joins. [Link](https://dplyr.tidyverse.org/reference/mutate-joins.html)
7. dplyr documentation, `slice_max()`, `slice_min()`, `slice_sample()`. [Link](https://dplyr.tidyverse.org/reference/slice.html)
8. Posit, Data transformation with dplyr cheatsheet. [Link](https://rstudio.github.io/cheatsheets/data-transformation.pdf)

## Continue Learning

- [dplyr filter() and select()](dplyr-filter-select.html), the parent tutorial with every filtering and selection pattern explained in depth
- [dplyr group_by and summarise](dplyr-group-by-summarise.html), the full story on grouped reductions, `.groups`, and multi-column summaries
- [dplyr filter & select Exercises](dplyr-filter-select-Exercises.html), a narrower 12-problem set focused just on filter() and select()
- [R Joins](R-Joins.html), reference for `inner_join`, `left_join`, `anti_join`, and the rest of the join family
