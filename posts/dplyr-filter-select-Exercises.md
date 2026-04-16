---
title: "dplyr filter() & select() Exercises: 12 Practice Problems — Solved Step-by-Step)"
slug: "dplyr-filter-select-Exercises"
description: "Practise dplyr filter() and select() with 12 hands-on R problems and worked solutions. Master row filtering and column selection from beginner to advanced."
keywords: "dplyr filter exercises, dplyr select exercises, filter practice R, select practice R, dplyr practice problems, tidyverse exercises, R data manipulation exercises"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.2"
post_type: "EX"
sidebar_title: "filter & select (12 problems)"
auto_link_terms: "dplyr filter exercises|dplyr select exercises|filter and select exercises|filter practice problems|dplyr practice problems"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
difficulty: "Intermediate"
---

# dplyr filter() & select() Exercises: 12 Practice Problems

<p class="lead">The fastest way to master dplyr's <code>filter()</code> and <code>select()</code> is to solve real problems yourself. These 12 runnable exercises take you from single-condition filtering to selection helpers like <code>starts_with()</code> and <code>where()</code>, with a click-to-reveal solution and explanation for every question.</p>

## How do you filter rows with a simple condition?

Every analysis starts with the same question: which rows do I care about? dplyr's `filter()` answers it with a condition that evaluates to `TRUE` or `FALSE` for each row. Let's load `dplyr` and run a worked example on `mtcars` so you can see the shape of a filter call before you write your own. We'll use the same R session for all 12 problems, so variables defined in one block stay available in the next.

```r
library(dplyr)

# Payoff: keep only the most fuel-efficient cars
mtcars |> filter(mpg > 25)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

Six cars exceed 25 mpg, and every one of them is a 4-cylinder model. Reading `filter()` is straightforward — pass the data frame first, then a condition; rows where the condition is `TRUE` come through to the result, everything else is dropped. Now try writing two of your own.

**Try it:** Filter `mtcars` to keep only 4-cylinder cars. Save the result to `ex_fours` and print the first few rows.

```r
# Exercise 1: one-condition filter
# Hint: filter(cyl == 4)

ex_fours <- mtcars        # replace this line with your filter call
nrow(ex_fours)
#> Expected after your fix: 11
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fours <- mtcars |> filter(cyl == 4)
head(ex_fours, 3)
#>            mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Datsun 710 22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
#> Merc 240D  24.4   4  146.7 62 3.69 3.190 20.00  1  0    4    2
#> Merc 230   22.8   4  140.8 95 3.92 3.150 22.90  1  0    4    2
nrow(ex_fours)
#> [1] 11
```

**Explanation:** `filter(cyl == 4)` keeps the 11 rows where the cylinder count equals four. Note the double equals — a single `=` is R's assignment operator and would error inside `filter()`.

</details>

**Try it:** Filter `starwars` to keep only characters whose `eye_color` is `"blue"`. Save to `ex_blue` and show just the `name` and `eye_color` columns.

```r
# Exercise 2: filter on a character column
# Hint: eye_color == "blue"  — strings use ==, wrap them in quotes

ex_blue <- starwars       # replace this line with your filter call
nrow(ex_blue)
#> Expected after your fix: 19
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_blue <- starwars |> filter(eye_color == "blue")
ex_blue |> select(name, eye_color) |> head()
#> # A tibble: 6 × 2
#>   name               eye_color
#>   <chr>              <chr>
#> 1 Luke Skywalker     blue
#> 2 Owen Lars          blue
#> 3 Beru Whitesun lars blue
#> 4 Anakin Skywalker   blue
#> 5 Wilhuff Tarkin     blue
#> 6 Anakin Skywalker   blue
```

**Explanation:** String equality uses `==` exactly like numeric equality. Nineteen characters have blue eyes. Strings must be wrapped in quotes; bare words would be interpreted as column names and error.

</details>

[WARNING]
**Never use a single `=` for equality inside filter().** A single `=` is assignment in R, and `filter(mtcars, mpg = 20)` attempts to rename the column rather than test equality. The correct form is always `==`.

## How do you combine conditions with AND, OR, and `%in%`?

Real questions almost always involve more than one condition. dplyr lets you stack conditions inside `filter()` with a comma (AND), use the `|` operator (OR), or compare against a set of values with `%in%`. Here is what the AND form looks like on `mtcars`.

```r
# Worked example: keep 4-cylinder cars that are also fuel efficient
mtcars |> filter(mpg > 20, cyl == 4) |> head(4)
#>                mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Datsun 710    22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
#> Merc 240D     24.4   4  146.7 62 3.69 3.190 20.00  1  0    4    2
#> Merc 230      22.8   4  140.8 95 3.92 3.150 22.90  1  0    4    2
#> Fiat 128      32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
```

Ten cars meet both conditions. The comma form reads more naturally than `mpg > 20 & cyl == 4`, but the two are identical — dplyr treats a comma-separated list of conditions as an AND chain.

**Try it:** From `mtcars`, keep rows where `cyl == 4` AND `mpg > 30`. Save to `ex_econ`.

```r
# Exercise 3: two conditions with AND
# Hint: filter(cyl == 4, mpg > 30)

ex_econ <- mtcars         # replace this line with your filter call
nrow(ex_econ)
#> Expected after your fix: 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_econ <- mtcars |> filter(cyl == 4, mpg > 30)
print(ex_econ)
#>                 mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4 78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4 75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4 71.1  65 4.22 1.835 19.90  1  1    4    1
#> Lotus Europa   30.4   4 95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Explanation:** Both conditions must be `TRUE` for a row to survive. Four cars pass — all small, light, and fuel-efficient. Writing `filter(cyl == 4 & mpg > 30)` would return the same result; pick whichever form you find more readable.

</details>

**Try it:** Keep cars from `mtcars` that have 4 OR 6 cylinders using the `%in%` operator. Save to `ex_46`, then count the rows.

```r
# Exercise 4: OR with %in%
# Hint: filter(cyl %in% c(4, 6))

ex_46 <- mtcars           # replace this line with your filter call
nrow(ex_46)
#> Expected after your fix: 18
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_46 <- mtcars |> filter(cyl %in% c(4, 6))
nrow(ex_46)
#> [1] 18
```

**Explanation:** `%in%` tests whether each value appears in a vector on the right. Eighteen cars have 4 or 6 cylinders; the remaining 14 are V8s. `%in%` stays readable as the list of allowed values grows — imagine writing ten `|` clauses by hand.

</details>

[TIP]
**Prefer `%in% c(...)` to chained `|` clauses.** For two allowed values the difference is cosmetic, but once you need three or more, `%in%` keeps the filter one line long and avoids off-by-one operator mistakes.

## How do you safely handle missing values in `filter()`?

Missing values need special treatment because `NA` is not equal to anything, not even itself. You test for missingness with `is.na()`, and you keep non-missing rows with its negation `!is.na()`. The `starwars` tibble has enough `NA` values in `height`, `mass`, and `hair_color` to practise on.

```r
# Worked example: how many starwars characters have a known mass?
starwars |> filter(!is.na(mass)) |> nrow()
#> [1] 59
```

Of 87 characters, 59 have a recorded mass. The 28 that don't would silently break a `mean(mass)` call unless you either filter them out first or pass `na.rm = TRUE`. Filtering first is usually clearer — your downstream code doesn't need to carry the special case.

**Try it:** From `starwars`, keep rows where BOTH `height` and `mass` are known. Save to `ex_measured` and report the row count.

```r
# Exercise 5: drop NA in two columns
# Hint: filter(!is.na(height), !is.na(mass))

ex_measured <- starwars   # replace this line with your filter call
nrow(ex_measured)
#> Expected after your fix: 59
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_measured <- starwars |> filter(!is.na(height), !is.na(mass))
nrow(ex_measured)
#> [1] 59
```

**Explanation:** Both negated-missing tests must hold. Comma = AND. The result matches the single-column version because every row with a known `mass` also has a known `height` in `starwars` — a pattern worth noticing before you assume the two filters are independent.

</details>

**Try it:** Find all `starwars` characters whose `hair_color` IS missing. Save to `ex_unknown_hair` and list the names.

```r
# Exercise 6: keep ONLY the NA rows
# Hint: filter(is.na(hair_color))  — no negation this time

ex_unknown_hair <- starwars   # replace this line with your filter call
nrow(ex_unknown_hair)
#> Expected after your fix: 5
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_unknown_hair <- starwars |> filter(is.na(hair_color))
ex_unknown_hair |> pull(name)
#> [1] "C-3PO"  "R2-D2"  "R5-D4"  "IG-88"  "R4-P17"
```

**Explanation:** Dropping the `!` flips the test — now you keep the missing rows. Every character with missing hair is a droid, which makes biological sense. Use this pattern whenever you want to investigate why values are missing rather than discard them.

</details>

[WARNING]
**`col == NA` always returns `NA`, never `TRUE`.** Any equality test against `NA` evaluates to `NA`, and `filter()` treats `NA` as "drop this row". The result is an empty data frame and no error. Always use `is.na()` or `!is.na()` for missing-value tests.

## How do you pick and drop columns with `select()` and its helpers?

Filtering picks rows; `select()` picks columns. You can list columns by name, drop them with a minus sign, or match them with helper functions like `starts_with()`, `ends_with()`, `contains()`, and `where()`. The order you list columns in `select()` is the order they appear in the output, which makes it a fast way to reorder a data frame.

```r
# Worked example: pick three columns and reorder them
starwars |> select(name, mass, height) |> head(3)
#> # A tibble: 3 × 3
#>   name            mass height
#>   <chr>          <dbl>  <int>
#> 1 Luke Skywalker    77    172
#> 2 C-3PO             75    167
#> 3 R2-D2             32     96
```

`mass` now comes before `height` even though the original tibble had them in the opposite order. `select()` returns a new data frame; it never modifies the source.

**Try it:** From `mtcars`, keep exactly the `mpg`, `hp`, and `wt` columns in that order. Save to `ex_cols`.

```r
# Exercise 7: select by name
# Hint: select(mpg, hp, wt)

ex_cols <- mtcars         # replace this line with your select call
names(ex_cols)
#> Expected after your fix: "mpg" "hp" "wt"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cols <- mtcars |> select(mpg, hp, wt)
head(ex_cols, 3)
#>                mpg  hp    wt
#> Mazda RX4     21.0 110 2.620
#> Mazda RX4 Wag 21.0 110 2.875
#> Datsun 710    22.8  93 2.320
```

**Explanation:** Three columns, in the order you listed them. Notice the rownames carry through — `select()` touches columns only, never rows.

</details>

**Try it:** From `mtcars`, DROP the `vs`, `am`, and `carb` columns and keep everything else. Save to `ex_kept`.

```r
# Exercise 8: drop with the minus sign
# Hint: select(-vs, -am, -carb)

ex_kept <- mtcars         # replace this line with your select call
names(ex_kept)
#> Expected after your fix: "mpg" "cyl" "disp" "hp" "drat" "wt" "qsec" "gear"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_kept <- mtcars |> select(-vs, -am, -carb)
names(ex_kept)
#> [1] "mpg"  "cyl"  "disp" "hp"   "drat" "wt"   "qsec" "gear"
```

**Explanation:** A leading minus means "drop this one". The remaining eight columns stay in their original order. The equivalent vector form is `select(-c(vs, am, carb))` — use whichever reads better to you.

</details>

**Try it:** From `starwars`, keep every column whose name starts with `"s"`. Save to `ex_s` and print its column names.

```r
# Exercise 9: select by prefix
# Hint: select(starts_with("s"))

ex_s <- starwars          # replace this line with your select call
names(ex_s)
#> Expected after your fix: "skin_color" "species" "starships"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_s <- starwars |> select(starts_with("s"))
names(ex_s)
#> [1] "skin_color" "species"    "starships"
```

**Explanation:** `starts_with("s")` matches any column whose name begins with `s` (case-insensitive). Three columns qualify. Its siblings are `ends_with()`, `contains()`, and `matches()` — the last one takes a regex for when the pattern is more subtle.

</details>

[KEY INSIGHT]
**Most analysis questions reduce to "which rows, which columns?".** Once `filter()` and `select()` are muscle memory, the rest of the tidyverse — `mutate()`, `summarise()`, `group_by()`, `arrange()` — layers on top of these two foundations without new mental models.

## Practice Exercises

The first nine exercises drilled one concept at a time. These three capstone problems combine multiple concepts into the kind of pipeline you write in real analysis work. Use fresh variable names (prefixed `my_`) so the solutions don't shadow your earlier exercise variables.

### Exercise 10: Filter then select in one pipeline

From `mtcars`, find all 8-cylinder cars and keep only the `mpg`, `hp`, and `wt` columns. Save the result to `my_v8s`. Use the pipe to chain `filter()` and `select()` in that order.

```r
# Capstone 10: filter → select pipeline
# Hint: mtcars |> filter(cyl == 8) |> select(mpg, hp, wt)

my_v8s <- mtcars          # replace this line with your full pipeline
dim(my_v8s)
#> Expected after your fix: 14 3
```

<details>
<summary>Click to reveal solution</summary>

```r
my_v8s <- mtcars |>
  filter(cyl == 8) |>
  select(mpg, hp, wt)
head(my_v8s, 4)
#>                    mpg  hp    wt
#> Hornet Sportabout 18.7 175 3.440
#> Duster 360        14.3 245 3.570
#> Merc 450SE        16.8 180 4.070
#> Merc 450SL        17.3 180 3.730
```

**Explanation:** Order matters — filter first, then select. Doing it the other way around works here but wastes work, because `select()` would have to carry all 32 rows through before the filter narrows them. Filtering early is a universal performance habit in dplyr.

</details>

### Exercise 11: Combine a column range with `where()`

From `mtcars`, keep the columns from `mpg` through `hp` (inclusive), then keep only those of that range that are numeric. Save to `my_numeric_range`. Use a single `select()` call with the `&` intersection operator.

```r
# Capstone 11: intersect two selectors with &
# Hint: select(mpg:hp & where(is.numeric))

my_numeric_range <- mtcars   # replace this line with your select call
names(my_numeric_range)
#> Expected after your fix: "mpg" "cyl" "disp" "hp"
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

**Explanation:** `mpg:hp` selects the four contiguous columns from `mpg` to `hp`. The `&` inside `select()` intersects two tidyselect expressions — only columns matching both stay. Every `mtcars` column is already numeric, so all four survive. On a mixed-type data frame, non-numeric columns in that range would drop out.

</details>

### Exercise 12: Full pipeline on starwars

Build a full analysis pipeline on `starwars`. Keep only human characters with a known height above 180 cm, then select `name`, `height`, `mass`, and `homeworld`. Save to `my_tall_humans`.

```r
# Capstone 12: three filter conditions + column selection
# Hint: filter(species == "Human", !is.na(height), height > 180) |> select(name, height, mass, homeworld)

my_tall_humans <- starwars   # replace this line with your full pipeline
nrow(my_tall_humans)
#> Expected after your fix: 10
```

<details>
<summary>Click to reveal solution</summary>

```r
my_tall_humans <- starwars |>
  filter(species == "Human", !is.na(height), height > 180) |>
  select(name, height, mass, homeworld)
print(my_tall_humans)
#> # A tibble: 10 × 4
#>    name              height  mass homeworld
#>    <chr>              <int> <dbl> <chr>
#>  1 Darth Vader          202 136   Tatooine
#>  2 Biggs Darklighter    183  84   Tatooine
#>  3 Anakin Skywalker     188  84   Tatooine
#>  4 Wilhuff Tarkin       180  NA   Eriadu
#>  5 Han Solo             185  80   Corellia
#>  6 Boba Fett            183  78.2 Kamino
#>  7 Qui-Gon Jinn         193  89   Naboo
#>  8 Finis Valorum        180  NA   Coruscant
#>  9 Bail Prestor Organa  191  NA   Alderaan
#> 10 Gregar Typho         185  85   Naboo
```

**Explanation:** Three filter conditions stack inside one call: species match, height not missing, height above threshold. The pipeline reads top to bottom like prose — take `starwars`, keep tall humans with known height, show these four columns. This is the dplyr pattern you will reach for constantly.

</details>

## Complete Example

Here is an end-to-end mini-analysis that uses every technique from the twelve exercises together. The business question: *which fuel-efficient cars in `mtcars` have a 4-cylinder engine, moderate horsepower, and a manual gearbox?*

```r
# Analysis: find the sweet-spot commuter cars
top_cars <- mtcars |>
  filter(cyl == 4, mpg > 25, hp %in% 60:120, am == 1) |>
  select(mpg, hp, wt, gear)
print(top_cars)
#>                 mpg  hp    wt gear
#> Fiat 128       32.4  66 2.200    4
#> Honda Civic    30.4  52 2.200    4
#> Toyota Corolla 33.9  65 1.835    4
#> Fiat X1-9      27.3  66 1.935    4
#> Lotus Europa   30.4 113 1.513    5
```

Reading the pipeline in plain language: take every car in `mtcars`, keep those with exactly four cylinders, more than 25 mpg, horsepower between 60 and 120, and a manual transmission (`am == 1`); then show only the mpg, hp, weight, and gear columns. Five cars match. Notice how `%in% 60:120` handled a numeric range — the `60:120` sequence is just a vector of integers, and `%in%` works on any vector, numeric or character. This is the entire template for everyday data filtering: compose a few conditions, pick the columns you want to report, and let the pipe do the rest.

## Summary

| Pattern | Code |
|---|---|
| Single condition | `filter(df, col > x)` |
| AND | `filter(df, cond1, cond2)` |
| OR on a set | `filter(df, col %in% c(a, b))` |
| Drop missing | `filter(df, !is.na(col))` |
| Keep only missing | `filter(df, is.na(col))` |
| Keep columns by name | `select(df, a, b, c)` |
| Drop columns by name | `select(df, -a, -b)` |
| Column range | `select(df, a:c)` |
| By prefix | `select(df, starts_with("x"))` |
| By type | `select(df, where(is.numeric))` |
| Intersect selectors | `select(df, a:c & where(is.numeric))` |
| Chain filter + select | `df \|> filter(...) \|> select(...)` |

If you solved all twelve without peeking, you are ready to layer `mutate()`, `arrange()`, and `summarise()` on top of what you know. If some exercises felt rough, pick the failing ones and try them again tomorrow without looking at the solutions.

[TIP]
**Space your retries out by a day.** One sitting builds recognition; a second sitting 24 hours later builds recall. Re-solving the problems that defeated you on day one is how the pipeline pattern becomes muscle memory.

## References

1. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 3: Data transformation. [Link](https://r4ds.hadley.nz/data-transform.html)
2. dplyr documentation — `filter()` reference. [Link](https://dplyr.tidyverse.org/reference/filter.html)
3. dplyr documentation — `select()` reference. [Link](https://dplyr.tidyverse.org/reference/select.html)
4. tidyselect — selection helpers language reference. [Link](https://tidyselect.r-lib.org/reference/language.html)
5. Posit — Data transformation with dplyr cheatsheet. [Link](https://rstudio.github.io/cheatsheets/data-transformation.pdf)
6. R Core Team — *An Introduction to R*, Logical vectors and NA. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Logical-vectors)

## Continue Learning

- [dplyr filter() and select() Tutorial](dplyr-filter-select.html) — the parent tutorial that walks through every pattern in depth with full explanations.
- [dplyr Exercises: 15 Practice Problems](dplyr-Exercises.html) — broader practice across `mutate()`, `summarise()`, `group_by()`, joins, and `across()`.
- [data.table vs dplyr](data-table-vs-dplyr.html) — side-by-side comparison of the two dominant R data-manipulation frameworks.
