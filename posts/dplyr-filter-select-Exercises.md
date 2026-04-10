---
title: "dplyr filter() & select() Exercises: 12 Practice Problems — Solved Step-by-Step"
slug: "dplyr-filter-select-Exercises"
description: "Practise dplyr filter() & select() with 12 problems and worked solutions. Build real R skills through hands-on exercises from beginner to advanced."
keywords: "dplyr filter exercises, dplyr select exercises, filter practice R, select practice R, dplyr practice problems, tidyverse exercises"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "E2.2"
post_type: "EX"
sidebar_title: "filter & select (12 problems)"
auto_link_terms: "dplyr filter exercises|dplyr select exercises|filter and select exercises|filter practice problems"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
---


# dplyr filter() & select() Exercises: 12 Practice Problems

<p class="lead">Twelve hands-on exercises to master <code>dplyr::filter()</code> and <code>select()</code> — from simple condition filtering to helper-function selection like <code>starts_with()</code>, <code>where()</code>, and <code>matches()</code>. Every exercise has a runnable solution you can execute in your browser.</p>

## Introduction

Reading about `filter()` and `select()` is easy. Using them fluently under real conditions — with compound logic, missing values, and messy column names — takes practice. These 12 exercises give you that practice.

The problems start simple and build up. The first four cover basic row filtering and column picking on the `mtcars` and `starwars` datasets. The middle four combine conditions, handle `NA` values, and use selection helpers. The last four mix `filter()` and `select()` in pipelines that resemble real analysis work.

Each exercise states the task, gives you a starter block, and hides the solution behind a click-to-reveal. Try to write your own answer first, run it, compare with the solution, then read the explanation. If you are new to these verbs, review the [parent tutorial on dplyr filter() and select()](dplyr-filter-select.html) before starting.

All code runs in a shared R session on this page — variables you create in one block are available in the next. Use distinct names like `my_result` in your exercise code so you do not overwrite tutorial variables from earlier blocks.

## Quick Reference

Here is a one-screen cheat sheet before you start. Skim it, then begin Exercise 1.

| Task | Function | Example |
|---|---|---|
| Keep rows matching a condition | `filter()` | `filter(df, mpg > 20)` |
| Combine conditions with AND | `,` or `&` | `filter(df, mpg > 20, cyl == 4)` |
| Combine conditions with OR | `\|` | `filter(df, cyl == 4 \| cyl == 6)` |
| Match any of a set | `%in%` | `filter(df, cyl %in% c(4, 6))` |
| Handle missing values | `is.na()` | `filter(df, !is.na(mpg))` |
| Keep columns by name | `select()` | `select(df, mpg, cyl)` |
| Drop columns | `-` | `select(df, -cyl)` |
| Range of columns | `:` | `select(df, mpg:hp)` |
| Names starting with prefix | `starts_with()` | `select(df, starts_with("d"))` |
| Columns by type | `where()` | `select(df, where(is.numeric))` |
| Regex match | `matches()` | `select(df, matches("^d"))` |

[TIP]
**Load dplyr once, then use it for every exercise.** The first code block below loads `dplyr` and the built-in datasets. Because all blocks on this page share one R session, later blocks can call `filter()` and `select()` without reloading.

```r
# Load dplyr and preview the datasets we will use
library(dplyr)

# mtcars is a 32-row data frame of 1973-74 car models
head(mtcars, 3)
#>                    mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4         21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag     21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710        22.8   4  108  93 3.85 2.320 18.61  1  1    4    1

# starwars is a 87-row tibble of Star Wars characters
head(starwars[, 1:6], 3)
#> # A tibble: 3 × 6
#>   name           height  mass hair_color skin_color eye_color
#>   <chr>           <int> <dbl> <chr>      <chr>      <chr>
#> 1 Luke Skywalker    172    77 blond      fair       blue
#> 2 C-3PO             167    75 <NA>       gold       yellow
#> 3 R2-D2              96    32 <NA>       white      red
```

Both datasets are loaded. `mtcars` has 11 numeric columns across 32 cars. `starwars` has 14 columns (including list-columns) across 87 characters, with several `NA` values — perfect for practising real-world filtering.

## Easy (1-4): Basic Filtering and Selection

Start here if you are new to dplyr. These four exercises use one verb at a time.

### Exercise 1: Filter by a single condition

Find all cars in `mtcars` with more than 25 miles per gallon. Store the result in `my_fuel_efficient`.

```r
# Exercise 1: filter mtcars where mpg > 25
# Hint: filter(data, condition)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_fuel_efficient <- mtcars |> filter(mpg > 25)
print(my_fuel_efficient)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Explanation:** `filter()` takes a data frame as its first argument and a logical condition as its second. It returns only the rows where the condition is `TRUE`. Six cars in `mtcars` have `mpg > 25`, and all six happen to be 4-cylinder models.

</details>

### Exercise 2: Select columns by name

From `mtcars`, keep only the `mpg`, `hp`, and `wt` columns. Save to `my_cols`.

```r
# Exercise 2: select three columns from mtcars
# Hint: select(data, col1, col2, col3)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_cols <- mtcars |> select(mpg, hp, wt)
head(my_cols, 4)
#>                 mpg  hp    wt
#> Mazda RX4      21.0 110 2.620
#> Mazda RX4 Wag  21.0 110 2.875
#> Datsun 710     22.8  93 2.320
#> Hornet 4 Drive 21.4 110 3.215
```

**Explanation:** `select()` picks columns by unquoted name. Column order in the result follows the order you list them — here `mpg, hp, wt` — not their original order in `mtcars`.

</details>

### Exercise 3: Drop columns with the minus sign

From `mtcars`, remove the `vs`, `am`, and `carb` columns. Save to `my_kept`. Use a single `select()` call with the minus sign.

```r
# Exercise 3: drop three columns from mtcars
# Hint: select(data, -col1, -col2, -col3)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_kept <- mtcars |> select(-vs, -am, -carb)
head(my_kept, 3)
#>                mpg cyl disp  hp drat    wt  qsec gear
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02    4
#> Datsun 710    22.8   4  108  93 3.85 2.320 18.61    4
```

**Explanation:** Prefixing a column with `-` drops it. The other eight columns stay in their original order. You could also write `select(mtcars, -c(vs, am, carb))` with a vector — both work identically.

</details>

### Exercise 4: Filter on equality

From `starwars`, keep only the characters whose `species` is exactly `"Droid"`. Save to `my_droids`.

```r
# Exercise 4: filter starwars for Droid species
# Hint: use == for equality, not a single =

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_droids <- starwars |> filter(species == "Droid")
my_droids |> select(name, height, species)
#> # A tibble: 6 × 3
#>   name  height species
#>   <chr>  <int> <chr>
#> 1 C-3PO    167 Droid
#> 2 R2-D2     96 Droid
#> 3 R5-D4     97 Droid
#> 4 IG-88    200 Droid
#> 5 R4-P17    96 Droid
#> 6 BB8       NA Droid
```

**Explanation:** Use `==` (double equals) to test equality. A single `=` is R's assignment operator and causes an error inside `filter()`. Six droids appear — note that BB8 has `NA` for height, which is fine because we filtered on `species`, not `height`.

</details>

## Medium (5-8): Compound Conditions and Helpers

These exercises combine logical operators, handle missing values, and use `select()` helpers.

### Exercise 5: AND conditions

From `mtcars`, keep cars with `mpg > 20` AND `cyl == 4`. Save to `my_efficient_fours`. Show the result with `select(mpg, cyl, hp)`.

```r
# Exercise 5: combine two conditions with AND
# Hint: filter(data, cond1, cond2) or filter(data, cond1 & cond2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_efficient_fours <- mtcars |>
  filter(mpg > 20, cyl == 4) |>
  select(mpg, cyl, hp)
print(my_efficient_fours)
#>                 mpg cyl  hp
#> Datsun 710     22.8   4  93
#> Merc 240D      24.4   4  62
#> Merc 230       22.8   4  95
#> Fiat 128       32.4   4  66
#> Honda Civic    30.4   4  52
#> Toyota Corolla 33.9   4  65
#> Fiat X1-9      27.3   4  66
#> Porsche 914-2  26.0   4  91
#> Lotus Europa   30.4   4 113
#> Volvo 142E     21.4   4 109
```

**Explanation:** Separating conditions with a comma inside `filter()` means AND — every condition must be `TRUE` for the row to be kept. `filter(df, a, b)` is equivalent to `filter(df, a & b)`. The comma form reads more naturally.

</details>

### Exercise 6: OR conditions with %in%

From `mtcars`, keep cars with 4 OR 6 cylinders. Save to `my_small_engines`. Use `%in%` rather than `|`. Count how many rows remain.

```r
# Exercise 6: filter with %in%
# Hint: cyl %in% c(4, 6)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_small_engines <- mtcars |> filter(cyl %in% c(4, 6))
nrow(my_small_engines)
#> [1] 18
```

**Explanation:** `%in%` tests whether each value appears in a vector on the right. It is cleaner than `cyl == 4 | cyl == 6` and scales nicely to many values. 18 of 32 cars have 4 or 6 cylinders; the other 14 have 8 cylinders.

</details>

### Exercise 7: Filter out missing values

From `starwars`, keep only characters with a known `height` and `mass`. Save to `my_measured`. Then count how many rows remain.

```r
# Exercise 7: drop rows with NA in height or mass
# Hint: !is.na(x) keeps non-missing values

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_measured <- starwars |> filter(!is.na(height), !is.na(mass))
nrow(my_measured)
#> [1] 59
```

**Explanation:** `is.na(x)` returns `TRUE` for each missing value. Prefixing it with `!` negates it — keep rows where the value is NOT missing. Without this step, 28 rows with `NA` in either column would carry into downstream summaries and break `mean()` or `sum()` calculations.

</details>

[WARNING]
**Never filter on NA with ==.** Writing `filter(starwars, mass == NA)` returns zero rows because `NA == anything` is `NA`, not `TRUE`. Always use `is.na()` or `!is.na()` to test for missing values.

### Exercise 8: Select columns with starts_with()

From `starwars`, keep only the columns whose names start with `"s"`. Save to `my_s_cols`. How many columns do you get?

```r
# Exercise 8: select columns by prefix
# Hint: starts_with("s") inside select()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_s_cols <- starwars |> select(starts_with("s"))
names(my_s_cols)
#> [1] "skin_color" "species"    "starships"
ncol(my_s_cols)
#> [1] 3
```

**Explanation:** `starts_with("s")` matches any column whose name begins with `s` (case-insensitive by default). Three columns match: `skin_color`, `species`, `starships`. The related helpers `ends_with()`, `contains()`, and `matches()` (regex) work the same way.

</details>

[TIP]
**Use `where()` to select by type, not name.** `select(starwars, where(is.numeric))` keeps only numeric columns regardless of their names. This is invaluable when column names are unpredictable but types are known.

## Hard (9-12): Combined Pipelines

The final four exercises chain `filter()` and `select()` together, the way you would in a real analysis.

### Exercise 9: Filter then select in a pipeline

From `mtcars`, find all 8-cylinder cars and show only `mpg`, `hp`, `wt` — in that order. Save to `my_v8s`. Use the pipe to chain `filter()` and `select()`.

```r
# Exercise 9: filter then select
# Hint: data |> filter(...) |> select(...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_v8s <- mtcars |>
  filter(cyl == 8) |>
  select(mpg, hp, wt)
head(my_v8s, 4)
#>                     mpg  hp    wt
#> Hornet Sportabout  18.7 175 3.440
#> Duster 360         14.3 245 3.570
#> Merc 450SE         16.8 180 4.070
#> Merc 450SL         17.3 180 3.730
```

**Explanation:** The pipe `|>` passes the result of one step into the next. `mtcars` goes into `filter(cyl == 8)`, which feeds into `select(mpg, hp, wt)`. Order matters: filtering first is usually faster because `select()` then operates on fewer rows.

</details>

### Exercise 10: Complex filter with OR and AND

From `mtcars`, find cars that are (4-cylinder AND mpg > 30) OR (8-cylinder AND hp > 200). Save to `my_extremes`. Show `mpg`, `cyl`, `hp`.

```r
# Exercise 10: combine OR with parenthesised AND groups
# Hint: use parentheses to group conditions

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_extremes <- mtcars |>
  filter((cyl == 4 & mpg > 30) | (cyl == 8 & hp > 200)) |>
  select(mpg, cyl, hp)
print(my_extremes)
#>                     mpg cyl  hp
#> Duster 360         14.3   8 245
#> Fiat 128           32.4   4  66
#> Honda Civic        30.4   4  52
#> Camaro Z28         13.3   8 245
#> Toyota Corolla     33.9   4  65
#> Ford Pantera L     15.8   8 264
#> Maserati Bora      15.0   8 335
#> Lotus Europa       30.4   4 113
```

**Explanation:** Parentheses control evaluation order. Without them, R reads `a & b | c & d` as `(a & b) | (c & d)` by default — which happens to be what we want here. Using parentheses anyway documents your intent and avoids mistakes when the logic is more complex.

</details>

[KEY INSIGHT]
**`filter()` and `select()` are the two most-used dplyr verbs because most analysis questions reduce to "which rows, which columns?"** Once you can compose them fluently with the pipe, the rest of the tidyverse — `mutate()`, `summarise()`, `group_by()` — layers on top of these two foundations.

### Exercise 11: Select with where() and a range

From `mtcars`, keep the columns `mpg` through `hp` (a range), then drop any of those that are NOT numeric. Save to `my_numeric_range`. How many columns remain?

```r
# Exercise 11: combine : range with where()
# Hint: select(data, mpg:hp) then & where(is.numeric)
# You can combine selectors with &

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_numeric_range <- mtcars |> select(mpg:hp & where(is.numeric))
names(my_numeric_range)
#> [1] "mpg"  "cyl"  "disp" "hp"
ncol(my_numeric_range)
#> [1] 4
```

**Explanation:** `mpg:hp` selects the four columns from `mpg` to `hp` in their original position. The `&` operator intersects two selectors — only columns matching BOTH criteria are kept. Because every column in `mtcars` is already numeric, all four survive. On a mixed-type data frame, the non-numeric columns would drop out.

</details>

### Exercise 12: Full analysis pipeline

Build a complete pipeline on `starwars`: keep only humans with known height, select `name`, `height`, `mass`, `homeworld`, and keep only those taller than 180cm. Save to `my_tall_humans`.

```r
# Exercise 12: full filter + select pipeline
# Hint: stack multiple filter() and select() calls with the pipe

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_tall_humans <- starwars |>
  filter(species == "Human", !is.na(height), height > 180) |>
  select(name, height, mass, homeworld)
print(my_tall_humans)
#> # A tibble: 11 × 4
#>    name               height  mass homeworld
#>    <chr>               <int> <dbl> <chr>
#>  1 Darth Vader           202   136 Tatooine
#>  2 Biggs Darklighter     183    84 Tatooine
#>  3 Anakin Skywalker      188    84 Tatooine
#>  4 Wilhuff Tarkin        180    NA Eriadu
#>  5 Han Solo              185    80 Corellia
#>  6 Boba Fett             183    78.2 Kamino
#>  7 Lando Calrissian      177    79 Socorro
#>  8 Arvel Crynyd           NA    NA <NA>
#>  9 Qui-Gon Jinn          193    89 Naboo
#> 10 Finis Valorum         170    NA Coruscant
#> 11 Bail Prestor Organa   191    NA Alderaan
```

**Explanation:** Three filter conditions stack cleanly: species match, height not missing, height above threshold. Then `select()` picks the four reporting columns. Reading the pipeline top-to-bottom tells the story: take `starwars`, keep tall humans with known height, show these four columns. This is the dplyr pattern you will reach for constantly.

</details>

[NOTE]
**The result still contains `NA` values in `mass` and `homeworld`.** We only filtered on `height`. If you need non-missing values in every reporting column, extend the filter: `filter(!is.na(height), !is.na(mass), !is.na(homeworld))`.

## Summary

| Concept | Key pattern |
|---|---|
| Filter one condition | `filter(df, col > x)` |
| AND conditions | `filter(df, cond1, cond2)` |
| OR conditions | `filter(df, col %in% c(a, b))` |
| Missing values | `filter(df, !is.na(col))` |
| Keep columns | `select(df, a, b, c)` |
| Drop columns | `select(df, -a, -b)` |
| By prefix | `select(df, starts_with("x"))` |
| By type | `select(df, where(is.numeric))` |
| Intersect selectors | `select(df, a:c & where(is.numeric))` |
| Chain in pipeline | `df \|> filter(...) \|> select(...)` |

If you solved all 12 without peeking, you are ready for `mutate()`, `arrange()`, and `summarise()` — the next core dplyr verbs. If you struggled on a few, re-read the [parent tutorial](dplyr-filter-select.html) and try the failed exercises again tomorrow. Spaced practice beats cramming.

## FAQ

**Q: What is the difference between `filter()` and `select()`?**
`filter()` works on rows — it keeps rows that satisfy a condition. `select()` works on columns — it picks or drops columns by name, position, or helper function. You almost always use them together.

**Q: Why do I get an error when I use `=` inside filter()?**
A single `=` is assignment in R. Equality testing uses `==` (double equals). Writing `filter(mtcars, mpg = 20)` attempts to assign and fails. Write `filter(mtcars, mpg == 20)` instead.

**Q: How do I filter rows where a column IS missing?**
Use `filter(df, is.na(col))`. The negation `!is.na(col)` keeps non-missing values. Never write `col == NA` — it always returns `NA`, not `TRUE`.

**Q: Can I use `select()` to reorder columns?**
Yes. `select(df, c, a, b)` returns the columns in the order you list them. For partial reordering, combine with `everything()`: `select(df, important_col, everything())` puts `important_col` first and keeps the rest.

**Q: Is `filter()` before `select()` the same as `select()` before `filter()`?**
Logically, yes — you get the same rows and columns. Practically, `filter()` first is usually faster because subsequent operations run on fewer rows. The exception: you cannot `filter()` on a column you have already dropped with `select()`.

## References

1. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 3: Data transformation. [Link](https://r4ds.hadley.nz/data-transform.html)
2. dplyr documentation — `filter()` reference. [Link](https://dplyr.tidyverse.org/reference/filter.html)
3. dplyr documentation — `select()` reference. [Link](https://dplyr.tidyverse.org/reference/select.html)
4. tidyselect — selection helpers (`starts_with`, `where`, `matches`). [Link](https://tidyselect.r-lib.org/reference/language.html)
5. Posit — Data transformation with dplyr cheatsheet. [Link](https://rstudio.github.io/cheatsheets/data-transformation.pdf)
6. R Core Team — An Introduction to R, Logical vectors and NA. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Logical-vectors)

## Continue Learning

- [dplyr filter() and select() Tutorial](dplyr-filter-select.html) — the parent tutorial that covers every pattern in depth with explanations
- [dplyr Exercises: 15 Practice Problems](dplyr-Exercises.html) — broader dplyr practice covering `mutate`, `summarise`, `group_by`, joins, and `across`
- [data.table vs dplyr](data-table-vs-dplyr.html) — compare the two dominant R data-manipulation frameworks
