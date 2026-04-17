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
---

# dplyr Exercises: 15 Data Manipulation Practice Problems

<p class="lead">A set of 15 hands-on dplyr problems, <code>filter()</code>, <code>mutate()</code>, <code>summarise()</code>, <code>group_by()</code>, joins, and <code>across()</code>, each with a runnable solution you can execute on this page. Difficulty progresses from beginner to advanced so you can stop where you get comfortable and come back for the harder problems later.</p>

## How should you tackle these 15 dplyr problems?

The 15 problems below are grouped into three blocks of five. Exercises 1-5 cover one or two verbs at a time. Exercises 6-10 mix conditions, `across()`, `case_when()`, and joins. Exercises 11-15 stitch three or more concepts into real pipelines like grouped ranking and share of total. Every exercise gives you a starter block, hides the solution behind a reveal, and explains the result. Solve, compare, read the explanation, and move on. All code runs in a single shared R session, so the warm-up below loads `dplyr` once, the exercises after it do not need to reload it.

```r
# Warm-up: one dplyr pipeline you should feel comfortable writing by Exercise 5
library(dplyr)

mtcars |>
  filter(cyl == 4) |>
  summarise(n = n(), avg_mpg = round(mean(mpg), 1))
#>    n avg_mpg
#> 1 11    26.7
```

Read the pipe top-to-bottom: take `mtcars`, keep only 4-cylinder cars, then reduce the 11 surviving rows into a single row showing the count and the rounded mean mpg. If that pipeline looks natural to you, Exercises 1-5 should feel fast. If it does not, that is exactly what the first five problems are for.

[TIP]
**Load dplyr once, every block on this page shares the same R session.** The warm-up above calls `library(dplyr)`; none of the 15 exercise blocks repeat it. Variables you create in one block are visible in every later block, just like cells in a Jupyter notebook. Use `my_` prefixed names in your own exercise code so you do not accidentally overwrite warm-up variables.

## Easy (1-5): filter, select, mutate, summarise basics

These five exercises use one or two verbs each. If you have read the [dplyr filter() and select() tutorial](dplyr-filter-select.html), you already have what you need.

### Exercise 1: Filter and select the fuel-efficient cars

Keep the cars with `mpg > 25` and show only `mpg`, `cyl`, `hp`, and the car name. `mtcars` stores the name as a row name, not a column, you will need to lift it into a column before `select()` can see it.

```r
# Exercise 1: filter mpg > 25, show car name + mpg + cyl + hp
# Hint: use tibble::rownames_to_column() or mutate(car = rownames(mtcars))

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(car = rownames(mtcars)) |>
  filter(mpg > 25) |>
  select(car, mpg, cyl, hp)
#>               car  mpg cyl hp
#> 1      Fiat 128   32.4   4 66
#> 2   Honda Civic   30.4   4 52
#> 3 Toyota Corolla  33.9   4 65
#> 4   Fiat X1-9    27.3   4 66
#> 5    Porsche 914-2 26.0  4 91
#> 6  Lotus Europa   30.4   4 113
```

**Explanation:** `mutate(car = rownames(mtcars))` copies the row names into a regular column so `select()` can include them. Six cars clear the 25-mpg bar, and all six are 4-cylinder, no surprise given a 1974 dataset.

</details>

### Exercise 2: Add a power-to-weight column

Add a new column `pwr_wt` equal to `hp / wt` rounded to one decimal, and show the first 5 rows with only the relevant columns (`mpg`, `hp`, `wt`, `pwr_wt`).

```r
# Exercise 2: mutate pwr_wt = round(hp / wt, 1)
# Hint: pipe mtcars into mutate() then select() then head()

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(pwr_wt = round(hp / wt, 1)) |>
  select(mpg, hp, wt, pwr_wt) |>
  head(5)
#>                    mpg  hp    wt pwr_wt
#> Mazda RX4         21.0 110 2.620   42.0
#> Mazda RX4 Wag     21.0 110 2.875   38.3
#> Datsun 710        22.8  93 2.320   40.1
#> Hornet 4 Drive    21.4 110 3.215   34.2
#> Hornet Sportabout 18.7 175 3.440   50.9
```

**Explanation:** `mutate()` adds the new column; `select()` picks the reporting set; `head()` trims to the first five rows. The `pwr_wt` column measures horsepower per unit of car weight, a cleaner "how punchy is this car" index than raw `hp`.

</details>

[WARNING]
**Inside `filter()` and `mutate()`, `=` is assignment, equality is `==`.** Writing `filter(mtcars, mpg = 20)` attempts to assign `20` to an argument called `mpg` and fails with a confusing error. Always use `filter(mtcars, mpg == 20)` when testing equality. The same rule applies to any condition in `case_when()` or `if_else()`.

### Exercise 3: Sort by mpg and show the top 5

Arrange the cars in descending mpg order and show the top 5 with their name, mpg, and cylinder count.

```r
# Exercise 3: arrange(desc(mpg)) then show car + mpg + cyl for the top 5
# Hint: mutate() the rownames first, then arrange(), then head()

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(car = rownames(mtcars)) |>
  arrange(desc(mpg)) |>
  select(car, mpg, cyl) |>
  head(5)
#>              car  mpg cyl
#> 1 Toyota Corolla 33.9   4
#> 2      Fiat 128  32.4   4
#> 3   Honda Civic  30.4   4
#> 4  Lotus Europa  30.4   4
#> 5     Fiat X1-9  27.3   4
```

**Explanation:** `arrange(desc(mpg))` sorts in descending order, without `desc()` you would get the least efficient cars first. The Toyota Corolla wins the 1974 fuel-economy crown, and every car in the top 5 is 4-cylinder.

</details>

### Exercise 4: Count and mean mpg per cylinder group

For each cylinder group (4, 6, 8), compute the count of cars and the mean mpg rounded to one decimal.

```r
# Exercise 4: group_by(cyl) then summarise(n = n(), avg_mpg = ...)
# Hint: remember to set .groups = "drop" to avoid a rowwise tibble warning

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  summarise(n = n(), avg_mpg = round(mean(mpg), 1), .groups = "drop")
#> # A tibble: 3 × 3
#>     cyl     n avg_mpg
#>   <dbl> <int>   <dbl>
#> 1     4    11    26.7
#> 2     6     7    19.7
#> 3     8    14    15.1
```

**Explanation:** `group_by(cyl)` creates three implicit sub-tables; `summarise()` collapses each into a single row. The `.groups = "drop"` argument returns a plain tibble instead of a still-grouped one, saves you an `ungroup()` step later. As expected, fewer cylinders mean better mileage: 26.7 mpg for 4-cyl, 15.1 mpg for 8-cyl.

</details>

### Exercise 5: Count iris flowers by species and add percentage

Use `count()` to count iris rows per `Species`, then `mutate()` a `pct` column that gives each species' share as a rounded percentage.

```r
# Exercise 5: iris |> count(Species) |> mutate(pct = round(n / sum(n) * 100, 1))
# Hint: count() already returns a tibble with column n

```

<details>
<summary>Click to reveal solution</summary>

```r
iris |>
  count(Species) |>
  mutate(pct = round(n / sum(n) * 100, 1))
#>      Species  n  pct
#> 1     setosa 50 33.3
#> 2 versicolor 50 33.3
#> 3  virginica 50 33.3
```

**Explanation:** `count(Species)` is shorthand for `group_by(Species) |> summarise(n = n())`. The `iris` dataset is perfectly balanced, each species has exactly 50 observations, so each is 33.3% of the total. In an unbalanced real-world dataset this same pattern is how you spot class imbalance for a classifier.

</details>

## Medium (6-10): compound logic, across(), case_when, joins

These five exercises combine two or more concepts. If you can solve them without looking at the reveal, you are comfortable with everyday dplyr.

### Exercise 6: Filter with two conditions against the dataset mean

Keep only cars where mpg is above the dataset mean AND weight is below the dataset mean. Show `mpg`, `hp`, `wt`, sorted by mpg descending.

```r
# Exercise 6: filter(mpg > mean(mpg), wt < mean(wt))
# Hint: comma inside filter() is AND

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  filter(mpg > mean(mpg), wt < mean(wt)) |>
  select(mpg, hp, wt) |>
  arrange(desc(mpg))
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

### Exercise 7: Label cars as Economy, Standard, or Guzzler with case_when

Create a `type` column using `case_when()` with the rules: `mpg > 25` → Economy, `mpg >= 15` → Standard, everything else → Guzzler. Then count cars per type, sorted by count.

```r
# Exercise 7: case_when(mpg > 25 ~ "Economy", mpg >= 15 ~ "Standard", TRUE ~ "Guzzler")
# Hint: case_when() evaluates top to bottom; the first match wins

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(type = case_when(
    mpg > 25  ~ "Economy",
    mpg >= 15 ~ "Standard",
    TRUE      ~ "Guzzler"
  )) |>
  count(type, sort = TRUE)
#>       type  n
#> 1 Standard 20
#> 2  Economy  6
#> 3  Guzzler  6
```

**Explanation:** `case_when()` checks each condition top to bottom and assigns the first matching label. Because a car with `mpg = 30` matches both `mpg > 25` and `mpg >= 15`, the order matters, putting `mpg >= 15` first would classify every Economy car as Standard. The final `TRUE ~ "Guzzler"` is the catch-all default.

</details>

### Exercise 8: Mean and standard deviation of every numeric column with across()

For each iris species, compute the mean and standard deviation of every numeric column in one call. Round both statistics to 2 decimals. The result columns should be named like `Sepal.Length_mean`, `Sepal.Length_sd`, etc.

```r
# Exercise 8: across(where(is.numeric), list(mean = ..., sd = ...), .names = "{.col}_{.fn}")
# Hint: use anonymous functions — \(x) round(mean(x), 2)

```

<details>
<summary>Click to reveal solution</summary>

```r
iris |>
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
#> # A tibble: 3 × 9
#>   Species    Sepal.Length_mean Sepal.Length_sd Sepal.Width_mean Sepal.Width_sd
#>   <fct>                  <dbl>           <dbl>            <dbl>          <dbl>
#> 1 setosa                  5.01            0.35             3.43           0.38
#> 2 versicolor              5.94            0.52             2.77           0.31
#> 3 virginica               6.59            0.64             2.97           0.32
#> # ... plus 4 more columns for Petal.Length and Petal.Width
```

**Explanation:** `across(where(is.numeric), ...)` picks every numeric column, then the named list applies both `mean` and `sd` to each. The `.names = "{.col}_{.fn}"` glue template produces tidy column names you can read directly. This single call replaces four separate `summarise(mean_...)`/`summarise(sd_...)` lines, one of the biggest ergonomic wins in modern dplyr.

</details>

[KEY INSIGHT]
**`across()` is the modern successor to the `_at`, `_if`, and `_all` suffix family.** If you see older tutorials using `summarise_if(is.numeric, mean)` or `mutate_at(vars(a, b), scale)`, the current idiom is `summarise(across(where(is.numeric), mean))` and `mutate(across(c(a, b), scale))`. One pattern to learn covers every multi-column reduction.

### Exercise 9: Convert iris column names to snake_case

Rename every column of `iris` to snake_case (lowercase, dots replaced with underscores), then move `species` to the first position. Show the first 4 rows.

```r
# Exercise 9: rename_with(~ tolower(gsub("\\.", "_", .x)))
# Hint: select(species, everything()) to reorder

```

<details>
<summary>Click to reveal solution</summary>

```r
iris |>
  rename_with(~ tolower(gsub("\\.", "_", .x))) |>
  select(species, everything()) |>
  head(4)
#>   species sepal_length sepal_width petal_length petal_width
#> 1  setosa          5.1         3.5          1.4         0.2
#> 2  setosa          4.9         3.0          1.4         0.2
#> 3  setosa          4.7         3.2          1.3         0.2
#> 4  setosa          4.6         3.1          1.5         0.2
```

**Explanation:** `rename_with()` takes a function and applies it to every column name. The lambda `~ tolower(gsub("\\.", "_", .x))` lowercases the name and swaps the literal dot for an underscore, the backslash-dot escapes the regex metacharacter. `select(species, everything())` is the standard idiom for "move this column first, keep the rest as-is."

</details>

### Exercise 10: Find employees without a matching department

Create two small data frames as shown in the starter block, then use `anti_join()` to find the employees whose department is not listed in the departments table. As a sanity check, also `left_join()` the two tables so you can see every employee's budget (or `NA` when there is no match).

```r
# Exercise 10: anti_join(employees, departments, by = "dept")
# Hint: anti_join keeps rows from x with no match in y
employees   <- data.frame(name = c("Alice","Bob","Carol","David"),
                          dept = c("Eng","Mkt","Eng","HR"))
departments <- data.frame(dept = c("Eng","Mkt","Sales"),
                          budget = c(500, 300, 200))

```

<details>
<summary>Click to reveal solution</summary>

```r
employees   <- data.frame(name = c("Alice","Bob","Carol","David"),
                          dept = c("Eng","Mkt","Eng","HR"))
departments <- data.frame(dept = c("Eng","Mkt","Sales"),
                          budget = c(500, 300, 200))

left_join(employees, departments, by = "dept")
#>    name dept budget
#> 1 Alice  Eng    500
#> 2   Bob  Mkt    300
#> 3 Carol  Eng    500
#> 4 David   HR     NA

anti_join(employees, departments, by = "dept")
#>    name dept
#> 1 David   HR
```

**Explanation:** `left_join()` keeps every employee and attaches their department budget when available, David has no matching department, so `budget` comes back as `NA`. `anti_join()` answers the same question inverted: give me only the rows from the left table that have *no* match in the right table. It is the standard dplyr tool for "find the orphans."

</details>

## Hard (11-15): grouped ranking, share of total, real pipelines

These five stitch three or more concepts into the kind of pipelines you actually write on the job.

### Exercise 11: Rank cars by mpg within each cylinder group

For each cylinder group, rank the cars by mpg (rank 1 = most efficient), keep the top 3 per group, and show the car name, cylinder count, mpg, and rank, sorted by cyl then rank.

```r
# Exercise 11: rank(-mpg) inside a grouped mutate, then filter(rank <= 3)
# Hint: ungroup() at the end so the result is a plain tibble

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  mutate(rank = rank(-mpg)) |>
  filter(rank <= 3) |>
  select(car, cyl, mpg, rank) |>
  arrange(cyl, rank) |>
  ungroup()
#> # A tibble: 9 × 4
#>   car               cyl   mpg  rank
#>   <chr>           <dbl> <dbl> <dbl>
#> 1 Toyota Corolla      4  33.9     1
#> 2 Fiat 128            4  32.4     2
#> 3 Honda Civic         4  30.4     3.5
#> 4 Lotus Europa        4  30.4     3.5
#> 5 Hornet 4 Drive      6  21.4     1
#> 6 Mazda RX4           6  21       2.5
#> 7 Mazda RX4 Wag       6  21       2.5
#> 8 Pontiac Firebird    8  19.2     1
#> 9 Hornet Sportabout   8  18.7     2
```

**Explanation:** `rank(-mpg)` ranks by negative mpg so the highest mpg gets rank 1. The grouped `mutate()` keeps the 32 rows but numbers each within its cylinder sub-table; `filter(rank <= 3)` then trims to the top 3 per group. Honda Civic and Lotus Europa tie at mpg 30.4, so both receive the average rank 3.5, swap to `min_rank()` or `dense_rank()` if you prefer integer ranks with ties broken differently.

</details>

### Exercise 12: Each car's hp as a percentage of its cylinder-group total

For each cylinder group, compute every car's horsepower as a rounded percentage of that group's total horsepower. Show `car`, `cyl`, `hp`, and `hp_pct` for the top 10 rows sorted by cyl then `hp_pct` descending.

```r
# Exercise 12: group_by(cyl) then mutate(hp_pct = hp / sum(hp) * 100)
# Hint: sum(hp) inside a grouped mutate is the group total, not the full-table total

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  mutate(hp_pct = round(hp / sum(hp) * 100, 1)) |>
  select(car, cyl, hp, hp_pct) |>
  arrange(cyl, desc(hp_pct)) |>
  ungroup() |>
  head(10)
#> # A tibble: 10 × 4
#>    car              cyl    hp hp_pct
#>    <chr>          <dbl> <dbl>  <dbl>
#>  1 Lotus Europa       4   113   13.5
#>  2 Porsche 914-2      4    91   10.9
#>  3 Volvo 142E         4   109   13
#>  4 Datsun 710         4    93   11.1
#>  5 Merc 230           4    95   11.4
#>  6 Toyota Corona      4    97   11.6
#>  7 Fiat X1-9          4    66    7.9
#>  8 Fiat 128           4    66    7.9
#>  9 Honda Civic        4    52    6.2
#> 10 Toyota Corolla     4    65    7.8
```

**Explanation:** Inside a grouped `mutate()`, aggregate functions like `sum()` operate on the current group, not the whole table. So `sum(hp)` for 4-cylinder cars returns the total hp across the 11 4-cyl cars, and dividing each car's hp by that total gives its share of the group. This is the canonical "share of total" pattern in dplyr, re-use it for market share, portfolio weight, or any per-group proportion.

</details>

[NOTE]
**Always `ungroup()` after a grouped mutate if you want later verbs to act row-wise again.** A tibble that is still grouped silently changes the behaviour of `mutate()`, `summarise()`, and even `slice()`. Adding `ungroup()` at the end of a grouped pipeline is a two-character fix that prevents hours of debugging.

### Exercise 13: Two heaviest cars per cylinder group

Use `slice_max()` to keep the two heaviest cars (by `wt`) in each cylinder group. Return `car`, `cyl`, `wt`, and `mpg`.

```r
# Exercise 13: slice_max(wt, n = 2) inside a grouped pipeline
# Hint: slice_max() handles the sort + head internally

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_max(wt, n = 2) |>
  select(car, cyl, wt, mpg) |>
  ungroup()
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

**Explanation:** `slice_max(wt, n = 2)` picks the two rows with the largest `wt` per group. You could write this yourself with `arrange(desc(wt)) |> head(2)`, but `slice_max()` is clearer, handles ties with `with_ties = TRUE` by default, and makes your intent obvious to the next reader of the code.

</details>

[TIP]
**Prefer `slice_max(col, n = k)` over the older `top_n(k, col)`.** `slice_max()` is the current dplyr idiom and has a matching `slice_min()` for the opposite end. `top_n()` still works but is marked "superseded" in the dplyr reference, new code should use `slice_max`/`slice_min`/`slice_sample`/`slice_head`/`slice_tail`.

### Exercise 14: A five-step real pipeline, manual-transmission fuel economy

Chain this five-step pipeline:

1. Keep only manual-transmission cars (`am == 1`).
2. Add a `kpl` column equal to `mpg * 0.425` (an approximate mpg-to-km-per-litre conversion), rounded to 2 decimals.
3. Group by `cyl`.
4. Summarise: count of cars and mean `kpl` per group.
5. Sort by mean `kpl` descending.

```r
# Exercise 14: filter -> mutate -> group_by -> summarise -> arrange
# Hint: this is a 5-verb pipeline; write it line-by-line and test each step if needed

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  filter(am == 1) |>
  mutate(kpl = round(mpg * 0.425, 2)) |>
  group_by(cyl) |>
  summarise(n = n(), avg_kpl = round(mean(kpl), 2), .groups = "drop") |>
  arrange(desc(avg_kpl))
#> # A tibble: 3 × 3
#>     cyl     n avg_kpl
#>   <dbl> <int>   <dbl>
#> 1     4     8   12.1
#> 2     6     3    8.44
#> 3     8     2    6.55
```

**Explanation:** Five verbs, each doing exactly one job, composed with pipes. The intermediate shape changes three times: 32-row `mtcars` → 13 manual cars → 13 manual cars with `kpl` → 3 grouped rows. Writing each verb on its own line makes the pipeline readable and lets you comment out any single step to debug.

</details>

### Exercise 15: Stratified 30% sample per iris species

Take a random 30% sample from each iris species (so roughly 15 rows per species, 45 total). Use `set.seed(42)` for reproducibility and count the rows per species in the result to verify the stratification worked.

```r
# Exercise 15: slice_sample(prop = 0.3) inside group_by(Species)
# Hint: set.seed before slice_sample so the same reader can reproduce your numbers

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)

iris |>
  group_by(Species) |>
  slice_sample(prop = 0.3) |>
  ungroup() |>
  count(Species)
#>      Species  n
#> 1     setosa 15
#> 2 versicolor 15
#> 3  virginica 15
```

**Explanation:** Inside a grouped pipeline, `slice_sample(prop = 0.3)` takes 30% of each group independently, that is what "stratified sampling" means. Without `group_by()`, you would get 45 rows drawn uniformly from the full 150-row table, with no guarantee of species balance. `set.seed(42)` fixes the random draw so every reader sees identical counts. This is the standard dplyr recipe for building a stratified train/test split for classification.

</details>

## Summary

The 15 problems together exercise every core dplyr verb and the two most common helper patterns (`case_when()` and `across()`).

| Verb / helper | Exercises that use it |
|---|---|
| `filter()` | 1, 6, 14 |
| `select()` | 1, 2, 3, 9, 11, 12, 13 |
| `mutate()` | 2, 7, 9, 11, 12, 14 |
| `arrange()` | 3, 6, 11, 12, 14 |
| `group_by()` + `summarise()` | 4, 8, 14 |
| `count()` | 5, 7, 15 |
| `case_when()` | 7 |
| `across()` + `where()` | 8 |
| `rename_with()` | 9 |
| `left_join()` + `anti_join()` | 10 |
| `rank()` / `slice_max()` / `slice_sample()` | 11, 13, 15 |
| Grouped share of total | 12 |

If you solved Exercises 1-10 without peeking, you are comfortable with everyday dplyr. If you solved 11-15 as well, you are ready for window functions, complex joins, and real analytical pipelines. Come back to the failed ones tomorrow, spaced practice beats cramming every time.

## FAQ

**Q: Should I use the native pipe `|>` or the magrittr pipe `%>%`?**
Both work. The native `|>` is built into base R from version 4.1 and is the current recommendation, no package needed, marginally faster, and the syntax is simpler. Use `%>%` only when you need the dot placeholder (`df %>% lm(y ~ x, data = .)`) or the assignment pipe `%<>%`, neither is in the native pipe yet. Every solution above uses `|>`.

**Q: Does dplyr change my data frame in place?**
No. dplyr verbs always return a new tibble; they never modify the original. If you want to keep a transformed version, assign it to a variable: `my_clean <- mtcars |> mutate(...)`. This immutability is what makes pipelines safe to compose and debug.

**Q: Does `group_by()` stay active after `summarise()`?**
`summarise()` peels off one level of grouping. If you grouped by one variable, the result is ungrouped; if you grouped by two variables, the result is still grouped by the first. To be explicit, and to avoid surprising later verbs, pass `.groups = "drop"` to `summarise()` or add `ungroup()` after it. Every grouped solution above uses one of these.

**Q: How does dplyr handle `NA` inside `filter()`?**
`filter()` drops any row where the condition evaluates to `NA`. So `filter(df, col > 5)` silently removes both `col <= 5` rows and `col == NA` rows. If you want to keep `NA` rows explicitly, write `filter(df, col > 5 | is.na(col))`. For aggregate functions like `mean()` and `sum()`, pass `na.rm = TRUE` to ignore missing values.

**Q: What is the difference between `slice_max(col, n = k)` and `top_n(k, col)`?**
`slice_max()` is the modern replacement for `top_n()`. Both keep the `k` rows with the largest value of `col`, but `slice_max()` has clearer argument order (column first, `n` second), a companion `slice_min()` for the opposite end, and a `with_ties` argument. `top_n()` still works but is marked "superseded", prefer `slice_max()` in new code.

## References

1. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 3: Data transformation. [Link](https://r4ds.hadley.nz/data-transform.html)
2. dplyr documentation, `filter()` reference. [Link](https://dplyr.tidyverse.org/reference/filter.html)
3. dplyr documentation, `mutate()` reference. [Link](https://dplyr.tidyverse.org/reference/mutate.html)
4. dplyr documentation, `summarise()` reference. [Link](https://dplyr.tidyverse.org/reference/summarise.html)
5. dplyr documentation, `across()` for multi-column operations. [Link](https://dplyr.tidyverse.org/reference/across.html)
6. dplyr documentation, mutating joins (`left_join`, `inner_join`, etc.) and filtering joins (`anti_join`, `semi_join`). [Link](https://dplyr.tidyverse.org/reference/mutate-joins.html)
7. dplyr documentation, `slice_max()`, `slice_min()`, `slice_sample()`. [Link](https://dplyr.tidyverse.org/reference/slice.html)
8. Posit, Data transformation with dplyr cheatsheet. [Link](https://rstudio.github.io/cheatsheets/data-transformation.pdf)
9. R Core Team, *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [dplyr filter() and select()](dplyr-filter-select.html), the parent tutorial with every filtering and selection pattern explained in depth
- [dplyr group_by and summarise](dplyr-group-by-summarise.html), the full story on grouped reductions, `.groups`, and multi-column summaries
- [dplyr filter & select Exercises](dplyr-filter-select-Exercises.html), a narrower 12-problem set focused just on filter() and select()
- [R Joins](R-Joins.html), reference for `inner_join`, `left_join`, `anti_join`, and the rest of the join family
