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

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(weight_tons = wt / 2.205) |>
  select(wt, weight_tons) |>
  head()
#>                      wt weight_tons
#> Mazda RX4         2.620    1.188209
#> Mazda RX4 Wag     2.875    1.303855
#> Datsun 710        2.320    1.052154
#> Hornet 4 Drive    3.215    1.458050
#> Hornet Sportabout 3.440    1.560091
#> Valiant           3.460    1.569161
```

`wt / 2.205` is computed element-wise across all 32 rows and stored into the new column `weight_tons`. The `select(wt, weight_tons)` afterwards just trims the output to the two relevant columns so you can eyeball the conversion side-by-side — the rest of the data frame is unchanged.
</details>

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

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> mutate(Species = toupper(Species)) |> head()
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  SETOSA
#> 2          4.9         3.0          1.4         0.2  SETOSA
#> 3          4.7         3.2          1.3         0.2  SETOSA
#> 4          4.6         3.1          1.5         0.2  SETOSA
#> 5          5.0         3.6          1.4         0.2  SETOSA
#> 6          5.4         3.9          1.7         0.4  SETOSA
```

Because `Species` is a factor, `toupper()` coerces it to character first and the `mutate()` replaces the column with the upper-cased version — the factor levels are lost. If you need to preserve factor structure, wrap the result in `factor()` afterwards: `Species = factor(toupper(Species))`.
</details>

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

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(cylinder_class = case_when(
    cyl == 4 ~ "small",
    cyl == 6 ~ "mid",
    cyl == 8 ~ "large"
  )) |>
  count(cylinder_class)
#>   cylinder_class  n
#> 1          large 14
#> 2            mid  7
#> 3          small 11
```

`case_when()` evaluates each condition top-down and assigns the matching label to a new character column. Because every row's `cyl` is one of 4, 6, or 8, no row falls through the three branches — you'd only need a `TRUE ~ "other"` catch-all if a fourth cylinder count were possible.
</details>

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

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> mutate(across(where(is.numeric), log)) |> head()
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1     1.629241    1.252763    0.3364722   -1.609438  setosa
#> 2     1.589235    1.098612    0.3364722   -1.609438  setosa
#> 3     1.547563    1.163151    0.2623643   -1.609438  setosa
#> 4     1.526056    1.131402    0.4054651   -1.609438  setosa
#> 5     1.609438    1.280934    0.3364722   -1.609438  setosa
#> 6     1.686399    1.360977    0.5306283   -0.916291  setosa
```

`across(where(is.numeric), log)` walks every column, keeps only the numeric ones, and applies `log()` element-wise — the factor column `Species` is left untouched. Passing `log` as a bare function name is the cleanest form when no extra arguments are needed; reach for the `~` lambda syntax (`~ log(.)`) only when you need to wire in other arguments.
</details>

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

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr); library(tibble)
sales <- tibble(
  day = 1:6,
  revenue = c(420, 510, 380, 620, 455, 580)
)
sales |> mutate(revenue_change = revenue - lag(revenue))
#> # A tibble: 6 x 3
#>     day revenue revenue_change
#>   <int>   <dbl>          <dbl>
#> 1     1     420             NA
#> 2     2     510             90
#> 3     3     380           -130
#> 4     4     620            240
#> 5     5     455           -165
#> 6     6     580            125
```

`lag(revenue)` shifts the column one row down, placing `NA` in row 1 because there's no previous day to compare against. Subtracting the shifted vector from the original produces a day-over-day delta — positive for a jump, negative for a drop. Pair this with `group_by()` if you need per-group deltas across several stores at once.
</details>

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

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> rename_with(toupper) |> head()
#>                    MPG CYL DISP  HP DRAT    WT  QSEC VS AM GEAR CARB
#> Mazda RX4         21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag     21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710        22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
#> Hornet 4 Drive    21.4   6  258 110 3.08 3.215 19.44  1  0    3    1
#> Hornet Sportabout 18.7   8  360 175 3.15 3.440 17.02  0  0    3    2
#> Valiant           18.1   6  225 105 2.76 3.460 20.32  1  0    3    1
```

`rename_with(toupper)` applies the function to every column name at once — no `.cols` argument means "all columns". The data itself isn't touched; only the column labels change. Pass a tidyselect helper as the second argument (e.g., `rename_with(toupper, starts_with("m"))`) to target a subset of columns.
</details>

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

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> transmute(mpg, log_mpg = log(mpg)) |> head()
#>                    mpg  log_mpg
#> Mazda RX4         21.0 3.044522
#> Mazda RX4 Wag     21.0 3.044522
#> Datsun 710        22.8 3.126761
#> Hornet 4 Drive    21.4 3.063391
#> Hornet Sportabout 18.7 2.928524
#> Valiant           18.1 2.895912
```

`transmute()` behaves like `mutate()` but discards every column you didn't name — the result here has only `mpg` and the newly computed `log_mpg`, while the other nine columns of `mtcars` are dropped. Reach for it when you want a minimal output data frame without chaining a `select()` afterwards.
</details>

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
