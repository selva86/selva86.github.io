---
title: "dplyr filter() and select(): Subset Exactly the Data You Need, Every Time"
slug: "dplyr-filter-select"
description: "filter() keeps rows matching conditions; select() keeps specified columns. Learn boolean operators in filter(), column selection helpers like starts_with(), and how to combine both efficiently."
keywords: "dplyr filter, dplyr select, R filter rows, R select columns, starts_with R, where dplyr, filter multiple conditions R"
auto_link_terms: "dplyr filter()|dplyr select()|filter rows in R|select columns in R|starts_with()|ends_with()|contains()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.2.3"
post_type: C
sidebar_section: "Data Wrangling"
sidebar_title: "dplyr filter() & select()"
sidebar_order: 3
---

# dplyr filter() and select(): Subset Exactly the Data You Need, Every Time

<p class="lead">In dplyr, <code>filter()</code> keeps the <em>rows</em> that match a condition, and <code>select()</code> keeps the <em>columns</em> you name. Together they're the first two verbs you'll reach for in any data analysis — and they replace half a dozen clunky base-R patterns with two clean, composable calls.</p>

## How do you filter rows with dplyr::filter()?

`filter()` takes a data frame and one or more conditions. It keeps the rows where every condition evaluates to `TRUE`. You refer to columns by their bare names — no `$`, no quotes.

```r
library(dplyr)

filter(mtcars, mpg > 25)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4  71.1  79 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

Compare that to base R: `mtcars[mtcars$mpg > 25, ]`. The dplyr version is shorter, and it composes cleanly with the pipe. The real wins show up with multiple conditions.

```r
mtcars |> filter(mpg > 20, cyl == 4)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Datsun 710     22.8   4 108.0  93 3.85 2.320 18.61  1  1    4    1
#> Merc 240D      24.4   4 146.7  62 3.69 3.190 20.00  1  0    4    2
#> Merc 230       22.8   4 140.8  95 3.92 22.90  0  0    4    2
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> ...
```

Commas between conditions mean "and." Every row must satisfy all of them. This is the single most readable way to write multi-condition filters in R.

> [KEY INSIGHT]
> Inside `filter()`, dplyr uses *tidy evaluation*: column names are bare identifiers. That's why `filter(mtcars, mpg > 25)` works but `filter(mtcars, "mpg" > 25)` doesn't — the second is comparing a string to a number.

**Try it:** Filter `mtcars` to rows where `gear == 4` and `carb == 4`.

```r
library(dplyr)
mtcars |> filter(gear == ___, carb == ___)

```

## How do you combine filter conditions with `&`, `|`, and `!`?

Commas mean "and" — that's the common case. For "or" and "not," use the standard logical operators: `|` for or, `!` for not.

```r
# OR — either condition matches
mtcars |> filter(cyl == 8 | mpg > 30)

# NOT — exclude a group
mtcars |> filter(!(cyl == 8))

# Complex — (cyl 4 or 6) AND high mpg
mtcars |> filter(cyl %in% c(4, 6), mpg > 25)
```

The `%in%` operator is your friend for "is this value one of these values" checks — cleaner than chaining `==` with `|`.

```r
# Between — numeric range
mtcars |> filter(between(hp, 100, 150))

# String matching with stringr::str_detect()
library(stringr)
starwars |> filter(str_detect(name, "Luke"))
#> # A tibble: 1 x 14
#>   name       height  mass ...
#> 1 Luke Skywalker 172    77 ...
```

> [WARNING]
> Don't use `&&` or `||` inside `filter()`. Those are scalar operators — they return one value even if you give them vectors, and they'll silently filter wrong. Always use the vectorized `&` and `|`.

**Try it:** Filter to rows where `am == 1` OR `gear == 5`.

```r
mtcars |> filter(am == 1 | gear == ___)

```

## How do you handle NA in filters?

`NA` propagates through comparisons: `NA > 5` is `NA`, not `FALSE`. `filter()` drops rows where the condition is `NA` — safer than base R, which sometimes returns mystery `NA` rows. But you still need `is.na()` to explicitly select missing rows.

```r
df <- tibble(x = c(1, 2, NA, 4, NA))

df |> filter(x > 2)
#> # A tibble: 1 x 1
#>       x
#>   <dbl>
#> 1     4

df |> filter(is.na(x))
#> # A tibble: 2 x 1
#>       x
#>   <dbl>
#> 1    NA
#> 2    NA

df |> filter(!is.na(x))
#> # A tibble: 3 x 1
#>       x
#>   <dbl>
#> 1     1
#> 2     2
#> 3     4
```

`!is.na(x)` is the idiomatic "keep the non-missing rows" filter. You'll write it in nearly every analysis that loads real data.

**Try it:** On `starwars`, keep only rows where `mass` is not `NA`.

```r
starwars |> filter(!is.na(___))

```

## How do you pick columns with select()?

`select()` keeps (or drops) columns by name. The simplest form lists the columns you want:

```r
mtcars |> select(mpg, cyl, hp) |> head(3)
#>                mpg cyl  hp
#> Mazda RX4       21   6 110
#> Mazda RX4 Wag   21   6 110
#> Datsun 710    22.8   4  93
```

A minus sign drops columns instead:

```r
mtcars |> select(-vs, -am, -gear, -carb) |> head(3)
#>                mpg cyl disp  hp drat    wt  qsec
#> Mazda RX4       21   6  160 110 3.90 2.620 16.46
#> Mazda RX4 Wag   21   6  160 110 3.90 2.875 17.02
#> Datsun 710    22.8   4  108  93 3.85 2.320 18.61
```

Ranges work with `:` — the colon operator picks every column between two names inclusive:

```r
mtcars |> select(mpg:drat) |> head(3)
#>                mpg cyl disp  hp drat
#> Mazda RX4       21   6  160 110 3.90
#> Mazda RX4 Wag   21   6  160 110 3.90
#> Datsun 710    22.8   4  108  93 3.85
```

**Try it:** Select just `mpg`, `wt`, and `hp` from `mtcars`.

```r
mtcars |> select(___, ___, ___) |> head()

```

## What are the column selection helpers (starts_with, ends_with, contains)?

Typing column names gets old fast when tables have 50+ columns. dplyr's tidyselect helpers let you pick by pattern.

```r
iris |> select(starts_with("Sepal")) |> head(3)
#>   Sepal.Length Sepal.Width
#> 1          5.1         3.5
#> 2          4.9         3.0
#> 3          4.7         3.2

iris |> select(ends_with("Width")) |> head(3)
#>   Sepal.Width Petal.Width
#> 1         3.5         0.2
#> 2         3.0         0.2
#> 3         3.2         0.2

iris |> select(contains("eng")) |> head(3)
#>   Sepal.Length Petal.Length
#> 1          5.1          1.4
#> 2          4.9          1.4
#> 3          4.7          1.3
```

And `where()` lets you pick by column *type*:

```r
iris |> select(where(is.numeric)) |> head(3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1          5.1         3.5          1.4         0.2
#> 2          4.9         3.0          1.4         0.2
#> 3          4.7         3.2          1.3         0.2
```

> [TIP]
> `select(where(is.numeric))` plus `summarise(across(everything(), mean))` is how you compute summary stats on every numeric column in one line. Memorize this pattern — you'll use it constantly.

**Try it:** From `iris`, select all columns whose name starts with "Petal".

```r
iris |> select(starts_with("___")) |> head()

```

## How do you rename columns with select() and rename()?

`select()` can rename columns inline: the syntax is `new_name = old_name`. If you only want to rename without dropping anything, use `rename()`.

```r
mtcars |>
  select(miles_per_gallon = mpg, cylinders = cyl, horsepower = hp) |>
  head(3)
#>               miles_per_gallon cylinders horsepower
#> Mazda RX4                 21.0         6        110
#> Mazda RX4 Wag             21.0         6        110
#> Datsun 710                22.8         4         93

mtcars |>
  rename(miles_per_gallon = mpg) |>
  head(3) |>
  colnames()
#>  [1] "miles_per_gallon" "cyl"  "disp" "hp" "drat" "wt" "qsec" "vs" "am"   
#> [10] "gear"  "carb"
```

`rename()` keeps every other column; `select()` drops anything you didn't list.

**Try it:** Rename `wt` to `weight` in `mtcars`.

```r
mtcars |> rename(weight = ___) |> head()

```

## How do you combine filter() and select() in a pipeline?

The pair composes naturally. Filter first (reduce rows), then select (reduce columns) — or vice versa, it doesn't affect the result but it can affect memory for huge tables.

```r
mtcars |>
  filter(cyl == 4, mpg > 25) |>
  select(mpg, wt, hp, gear) |>
  arrange(desc(mpg))
#>                mpg    wt  hp gear
#> Toyota Corolla 33.9 1.835  79    4
#> Fiat 128       32.4 2.200  66    4
#> Honda Civic    30.4 1.615  52    4
#> Lotus Europa   30.4 1.513 113    5
#> Fiat X1-9      27.3 1.935  66    4
#> Porsche 914-2  26.0 2.140  91    5
```

Three verbs, four lines, and you've answered "which 4-cylinder cars have the best mileage, showing just the relevant columns." That's dplyr at its best.

> [NOTE]
> The order `filter() |> select()` is the conventional one — keep it even when either order works. Consistency makes pipelines faster to read for the next person (or future you).

**Try it:** From `mtcars`, filter to `gear == 4`, then keep only `mpg`, `hp`, and `wt`.

```r
mtcars |>
  filter(gear == ___) |>
  select(mpg, hp, ___)

```

## Practice Exercises

### Exercise 1: Top fuel-efficient manuals

From `mtcars`, return the names and mpg of manual-transmission cars (`am == 1`) with mpg above the overall median.

<details>
<summary>Show solution</summary>

```r
library(dplyr)
med <- median(mtcars$mpg)
mtcars |>
  tibble::rownames_to_column("model") |>
  filter(am == 1, mpg > med) |>
  select(model, mpg) |>
  arrange(desc(mpg))
```
</details>

### Exercise 2: Select by type and pattern

From `iris`, select every numeric column whose name contains "Length".

<details>
<summary>Show solution</summary>

```r
iris |> select(where(is.numeric) & contains("Length"))
#>   Sepal.Length Petal.Length
#> 1          5.1          1.4
#> ...
```
</details>

### Exercise 3: Exclude and rename

From `mtcars`, drop the `vs`, `am`, and `carb` columns, then rename `mpg` to `miles_per_gallon`.

<details>
<summary>Show solution</summary>

```r
mtcars |>
  select(-vs, -am, -carb) |>
  rename(miles_per_gallon = mpg) |>
  head()
```
</details>

## Putting It All Together

A complete mini-analysis on `starwars`: find the tallest human characters with known homeworlds, keeping only the columns we care about.

```r
library(dplyr)
starwars |>
  filter(
    species == "Human",
    !is.na(height),
    !is.na(homeworld)
  ) |>
  select(name, height, mass, homeworld, gender) |>
  arrange(desc(height)) |>
  head(5)
#> # A tibble: 5 x 5
#>   name              height  mass homeworld      gender   
#>   <chr>              <int> <dbl> <chr>          <chr>    
#> 1 Darth Vader          202   136 Tatooine       masculine
#> 2 Qui-Gon Jinn         193    89 unknown        masculine
#> 3 Dooku                193    80 Serenno        masculine
#> 4 Bail Prestor Organa  191    NA Alderaan       masculine
#> 5 Anakin Skywalker     188    84 Tatooine       masculine
```

Three filters (species, no NA height, no NA homeworld), a column selection, a sort, a top-5. Every line reads top-to-bottom as one thought.

## Summary

| Verb | What it does | Key pattern |
|------|-------------|-------------|
| `filter(cond, cond, ...)` | Keep rows where all conditions are `TRUE` | `filter(df, x > 5, y == "a")` |
| `filter(cond \| cond)` | Keep rows matching any condition | `filter(df, x > 5 \| y == "a")` |
| `filter(!is.na(x))` | Drop missing values in a column | Essential cleanup idiom |
| `select(a, b, c)` | Keep named columns | Explicit, clearest form |
| `select(-x, -y)` | Drop named columns | Inverse selection |
| `select(starts_with("x"))` | Keep by name pattern | Also `ends_with`, `contains` |
| `select(where(is.numeric))` | Keep by type | Combine with `across()` later |
| `rename(new = old)` | Rename without dropping | Use when selecting would drop too much |

## References

1. [dplyr package documentation](https://dplyr.tidyverse.org/)
2. [R for Data Science — Data Transformation](https://r4ds.hadley.nz/data-transform)
3. [tidyselect helpers reference](https://tidyselect.r-lib.org/reference/language.html)
4. [dplyr cheat sheet (RStudio)](https://rstudio.github.io/cheatsheets/data-transformation.pdf)
5. [Tidyverse Style Guide](https://style.tidyverse.org/)

## Continue Learning

- [dplyr mutate(): Create New Columns](dplyr-mutate-rename.html) — the natural next verb after filter/select.
- [dplyr group_by() + summarise()](dplyr-group-by-summarise.html) — aggregate filtered data.
- [R Pipe Operator: %>% vs |>](R-Pipe-Operator.html) — the glue that connects dplyr verbs.
