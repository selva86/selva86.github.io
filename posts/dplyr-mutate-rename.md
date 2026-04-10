---
title: "dplyr mutate(): Create New Columns, Transform Existing Ones — 8 Real Examples"
slug: "dplyr-mutate-rename"
description: "mutate() is the main tool for engineering features. Learn to create computed columns, apply conditional logic with if_else(), transform multiple columns with across(), and rename cleanly."
keywords: "dplyr mutate, dplyr across, if_else dplyr, case_when R, mutate across, dplyr rename, feature engineering R"
auto_link_terms: "dplyr mutate()|mutate() in R|if_else()|case_when()|across() in dplyr|dplyr rename()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.2.4"
post_type: C
sidebar_section: "Data Wrangling"
sidebar_title: "dplyr mutate()"
sidebar_order: 4
---

# dplyr mutate(): Create New Columns, Transform Existing Ones — 8 Real Examples

<p class="lead">In dplyr, <code>mutate()</code> adds new columns or modifies existing ones, letting you engineer features, apply conditional logic, and transform many columns in a single expression. It's the verb you'll reach for every time the raw data needs shaping before analysis.</p>

## How does mutate() create a new column?

`mutate()` takes a data frame and any number of `new_column = expression` arguments. Each expression can reference other columns by bare name and is computed vectorially across all rows.

```r
library(dplyr)

mtcars |>
  mutate(kpl = mpg * 0.425) |>
  select(mpg, kpl) |>
  head(3)
#>               mpg    kpl
#> Mazda RX4      21 8.9250
#> Mazda RX4 Wag  21 8.9250
#> Datsun 710   22.8 9.6900
```

One line: new column, computed from an existing one. Multiple new columns at once work too — and later ones can reference earlier ones within the same `mutate()` call.

```r
mtcars |>
  mutate(
    kpl = mpg * 0.425,
    efficient = kpl > 10
  ) |>
  select(mpg, kpl, efficient) |>
  head(3)
#>               mpg    kpl efficient
#> Mazda RX4      21 8.9250     FALSE
#> Mazda RX4 Wag  21 8.9250     FALSE
#> Datsun 710   22.8 9.6900     FALSE
```

This left-to-right resolution is a feature, not a bug. It lets you build derived columns in logical order without chaining multiple `mutate()` calls.

**Try it:** Add a `weight_tons` column to `mtcars` by dividing `wt` by 2.205 (kips per ton).

```r
mtcars |>
  mutate(weight_tons = wt / ___) |>
  select(wt, weight_tons) |>
  head()

```

## How do you modify an existing column in place?

Assign to a column name that already exists and `mutate()` overwrites it. This is the dplyr way to clean, rescale, or retype data.

```r
df <- tibble(name = c("Ann", "Bo", "Cal"), score = c(72, 91, 65))

df |> mutate(score = score / 100)
#> # A tibble: 3 x 2
#>   name  score
#>   <chr> <dbl>
#> 1 Ann    0.72
#> 2 Bo     0.91
#> 3 Cal    0.65

df |> mutate(name = toupper(name))
#> # A tibble: 3 x 2
#>   name  score
#>   <chr> <dbl>
#> 1 ANN      72
#> 2 BO       91
#> 3 CAL      65
```

Overwriting is safe: the original data frame isn't mutated, and a new one is returned. If you want to keep both the old and new values, use a different name like `score_pct`.

**Try it:** Upper-case the `Species` column of `iris`.

```r
iris |> mutate(Species = toupper(___)) |> head()

```

## How do you apply conditional logic with if_else() and case_when()?

`if_else()` is dplyr's strict version of base `ifelse()`: it checks that both branches return the same type, so you can't accidentally get a character column back from a numeric operation.

```r
mtcars |>
  mutate(economy = if_else(mpg > 25, "high", "low")) |>
  select(mpg, economy) |>
  head(5)
#>                mpg economy
#> Mazda RX4       21     low
#> Mazda RX4 Wag   21     low
#> Datsun 710    22.8     low
#> Hornet 4 Drive 21.4    low
#> Hornet Sportabout 18.7 low
```

When you need more than two branches, `case_when()` is cleaner than nested `if_else()`:

```r
mtcars |>
  mutate(
    size = case_when(
      wt < 2.5 ~ "small",
      wt < 3.5 ~ "medium",
      TRUE     ~ "large"
    )
  ) |>
  count(size)
#> # A tibble: 3 x 2
#>   size       n
#>   <chr>  <int>
#> 1 large     17
#> 2 medium     9
#> 3 small      6
```

The `TRUE ~ "large"` is the catch-all — every row that didn't match an earlier condition falls through to it. Always include one, or you'll get `NA`s where no branch matched.

> [KEY INSIGHT]
> `case_when()` conditions are evaluated top-to-bottom and the first match wins. Order them from most-specific to most-general, and put the `TRUE ~ ...` catch-all last.

**Try it:** Use `case_when()` to add a `cylinder_class` column: "small" for 4 cyl, "mid" for 6, "large" for 8.

```r
mtcars |>
  mutate(cylinder_class = case_when(
    cyl == 4 ~ "small",
    cyl == 6 ~ "___",
    cyl == 8 ~ "large"
  )) |>
  count(cylinder_class)

```

## How do you transform many columns at once with across()?

When you need to apply the same function to several columns, `across()` is the answer. It plugs into `mutate()` (and `summarise()`) and takes two arguments: which columns and what function.

```r
iris |>
  mutate(across(where(is.numeric), ~ round(., 1))) |>
  head(3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
```

The `~ round(., 1)` is a compact anonymous function: `.` stands for the current column. You can also pass a named function directly: `across(where(is.numeric), log)`.

```r
iris |>
  mutate(across(starts_with("Sepal"), ~ . * 10)) |>
  head(3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1           51          35          1.4         0.2  setosa
#> 2           49          30          1.4         0.2  setosa
#> 3           47          32          1.3         0.2  setosa
```

To run multiple functions at once and get multiple new columns, pass a named list:

```r
iris |>
  mutate(across(where(is.numeric),
                list(log = log, sqrt = sqrt),
                .names = "{.col}_{.fn}")) |>
  head(1)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species Sepal.Length_log ...
```

The `.names = "{.col}_{.fn}"` glue pattern controls the output column names — `{.col}` is the original column name and `{.fn}` is the function name.

**Try it:** Use `across()` to take the log of every numeric column in `iris`.

```r
iris |> mutate(across(where(is.numeric), log)) |> head()

```

## How do you rank, lag, and lead values within a column?

dplyr bundles a set of window functions specifically for ordering and time-series work. `rank()`, `dense_rank()`, `row_number()`, `lag()`, and `lead()` are the ones you'll reach for most.

```r
sales <- tibble(
  day = 1:6,
  revenue = c(420, 510, 380, 620, 455, 580)
)

sales |>
  mutate(
    rank_rev = dense_rank(desc(revenue)),
    prev_day = lag(revenue),
    next_day = lead(revenue),
    change   = revenue - lag(revenue)
  )
#> # A tibble: 6 x 6
#>     day revenue rank_rev prev_day next_day change
#>   <int>   <dbl>    <int>    <dbl>    <dbl>  <dbl>
#> 1     1     420        5       NA      510     NA
#> 2     2     510        3      420      380     90
#> 3     3     380        6      510      620   -130
#> 4     4     620        1      380      455    240
#> 5     5     455        4      620      580   -165
#> 6     6     580        2      455       NA    125
```

`lag()` shifts the vector back by one (introducing `NA` at the start); `lead()` shifts forward. `rank_rev` uses `desc()` to rank highest-revenue as rank 1. All four are vectorized — no loops needed.

> [TIP]
> Window functions play beautifully with `group_by()`: `df |> group_by(store) |> mutate(day_over_day = revenue - lag(revenue))` computes a per-store change, handling each group independently.

**Try it:** Add a `revenue_change` column to `sales` using `lag()`.

```r
sales |> mutate(revenue_change = revenue - lag(___))

```

## How do you drop and rename columns cleanly?

Within `mutate()`, assigning `NULL` removes a column. If you only want to rename without adding anything, use `rename()` — cleaner than a full `select()`.

```r
mtcars |>
  mutate(vs = NULL, am = NULL) |>
  head(1) |>
  colnames()
#>  [1] "mpg"  "cyl"  "disp" "hp"   "drat" "wt"   "qsec" "gear" "carb"

mtcars |>
  rename(horsepower = hp, miles_per_gallon = mpg) |>
  head(1)
#>           miles_per_gallon cyl disp horsepower drat   wt  qsec vs am gear carb
#> Mazda RX4               21   6  160        110  3.9 2.62 16.46  0  1    4    4
```

`rename_with()` applies a function to rename many columns at once — useful for converting styles en masse (e.g., `.` to `_`).

```r
iris |>
  rename_with(~ gsub("\\.", "_", tolower(.))) |>
  head(1)
#>   sepal_length sepal_width petal_length petal_width species
#> 1          5.1         3.5          1.4         0.2  setosa
```

**Try it:** Use `rename_with(toupper)` to upper-case every column name in `mtcars`.

```r
mtcars |> rename_with(___) |> head()

```

## What does transmute() do differently?

`transmute()` is `mutate()` that drops every column you didn't mention. Use it when you want a clean new data frame with only the computed columns (and any existing columns you explicitly kept).

```r
mtcars |>
  transmute(
    model = rownames(mtcars),
    kpl = mpg * 0.425,
    power_per_ton = hp / (wt * 0.907)
  ) |>
  head(3)
#>          model    kpl power_per_ton
#> 1    Mazda RX4 8.9250      46.28570
#> 2 Mazda RX4 Wag 8.9250      42.17030
#> 3   Datsun 710  9.6900      55.22411
```

In modern dplyr (1.0+), `mutate(.keep = "none")` does the same thing and is slightly more discoverable. Use whichever reads clearly in context.

**Try it:** Use `transmute()` to return only `mpg` and a new `log_mpg` column from `mtcars`.

```r
mtcars |> transmute(mpg, log_mpg = log(___)) |> head()

```

## Practice Exercises

### Exercise 1: Feature engineering

On `mtcars`, add three features: `power_to_weight` (hp/wt), `displacement_per_cyl` (disp/cyl), and `fast` (TRUE if qsec < 17).

<details>
<summary>Show solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(
    power_to_weight = hp / wt,
    displacement_per_cyl = disp / cyl,
    fast = qsec < 17
  ) |>
  select(power_to_weight, displacement_per_cyl, fast) |>
  head()
```
</details>

### Exercise 2: Standardize columns

Rescale every numeric column of `iris` to z-scores using `across()`.

<details>
<summary>Show solution</summary>

```r
iris |>
  mutate(across(where(is.numeric), ~ (. - mean(.)) / sd(.))) |>
  head()
```
</details>

### Exercise 3: Conditional transformation

Create an `mpg_grade` column on `mtcars` using `case_when()`: "A" if mpg ≥ 25, "B" if 18-25, "C" if 15-18, "D" otherwise.

<details>
<summary>Show solution</summary>

```r
mtcars |>
  mutate(mpg_grade = case_when(
    mpg >= 25 ~ "A",
    mpg >= 18 ~ "B",
    mpg >= 15 ~ "C",
    TRUE      ~ "D"
  )) |>
  count(mpg_grade)
```
</details>

## Putting It All Together

A typical feature-engineering pipeline: load, clean strings, add derived features, transform numeric columns, summarize.

```r
library(dplyr)

mtcars |>
  tibble::rownames_to_column("model") |>
  mutate(
    brand = word(model, 1),
    kpl = mpg * 0.425,
    power_to_weight = hp / wt,
    transmission = if_else(am == 1, "manual", "automatic"),
    size = case_when(
      wt < 2.5 ~ "small",
      wt < 3.5 ~ "medium",
      TRUE     ~ "large"
    )
  ) |>
  mutate(across(c(kpl, power_to_weight), ~ round(., 2))) |>
  select(model, brand, kpl, power_to_weight, transmission, size) |>
  head(5)
```

Five new columns, one clean type conversion, one selection — all in one pipeline. That's what idiomatic dplyr feature engineering looks like.

## Summary

| Pattern | Verb | Example |
|---------|------|---------|
| Add column | `mutate()` | `mutate(kpl = mpg * 0.425)` |
| Modify column | `mutate()` (overwrite) | `mutate(score = score / 100)` |
| Drop column | `mutate(x = NULL)` | or use `select(-x)` |
| Two-way condition | `if_else()` | `if_else(mpg > 25, "high", "low")` |
| Multi-way condition | `case_when()` | `case_when(x > 5 ~ "big", TRUE ~ "small")` |
| Same op on many columns | `across()` | `mutate(across(where(is.numeric), log))` |
| Window function | `lag()`, `lead()`, `rank()` | `mutate(delta = x - lag(x))` |
| Rename one column | `rename()` | `rename(new = old)` |
| Rename many | `rename_with()` | `rename_with(tolower)` |
| Keep only new cols | `transmute()` or `.keep="none"` | `transmute(kpl = mpg * 0.425)` |

## References

1. [dplyr mutate() reference](https://dplyr.tidyverse.org/reference/mutate.html)
2. [across() reference](https://dplyr.tidyverse.org/reference/across.html)
3. [case_when() reference](https://dplyr.tidyverse.org/reference/case_when.html)
4. [R for Data Science — Data Transformation](https://r4ds.hadley.nz/data-transform)
5. [dplyr cheat sheet](https://rstudio.github.io/cheatsheets/data-transformation.pdf)

## Continue Learning

- [dplyr filter() and select()](dplyr-filter-select.html) — the verbs you use before mutate().
- [dplyr group_by() + summarise()](dplyr-group-by-summarise.html) — aggregate mutated features.
- [dplyr arrange(), slice(), top_n()](dplyr-arrange-slice.html) — ordering and top-N queries.
