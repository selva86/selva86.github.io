---
title: "dplyr filter() and select() Exercises: 20 Practice Problems in R"
slug: "dplyr-filter-select-Exercises"
description: "Practice dplyr filter() and select() with 20 hands-on R problems and worked solutions. Beginner to advanced, every exercise has a hidden answer and explanation."
keywords: "dplyr filter select exercises, dplyr filter practice, dplyr select practice, dplyr exercises R, tidyverse practice problems, R data manipulation exercises"
mathjax: false
webr: true
date: "2026-05-13"
curriculum_id: "E2.2"
post_type: "EX"
sidebar_title: "filter & select (20 problems)"
sidebar_order: 145
fr_parent: "dplyr-filter-select.html"
auto_link_terms: "dplyr filter exercises|dplyr select exercises|filter and select exercises|filter practice problems|dplyr practice problems"
auto_link_case_sensitive: false
target_keyword: "dplyr filter select exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dplyr filter() and select() Exercises: 20 Practice Problems

<p class="lead">Solve 20 short, focused R problems that drill the most important <code>filter()</code> and <code>select()</code> patterns. Every exercise lists the task, the expected output, and a difficulty marker. Click any solution panel to reveal the worked answer and a short explanation when you are ready to compare notes.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
```

## Section 1. Single-condition row filtering (3 problems)

### Exercise 1.1: Keep the fuel-efficient cars from mtcars

**Task:** Use `filter()` to keep only the rows of the built-in `mtcars` dataset where `mpg` is greater than 25 miles per gallon. The result is a shortlist of the most fuel-efficient cars in the dataset. Save the result to `ex_1_1`.

**Expected result:**

```
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Difficulty:** Beginner

[HINTS]
You want to keep only the rows that clear a numeric threshold and discard the rest.
Use `filter()` with the condition `mpg > 25`, taking care to use the greater-than operator and not `=`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mtcars |> filter(mpg > 25)
ex_1_1
```

**Explanation:** `filter()` keeps rows where the supplied condition evaluates to `TRUE`. Six cars clear the 25-mpg bar and every one of them is a four-cylinder economy compact. A common slip for newcomers is writing `=` instead of `>` when typing fast: only the comparison operators (`>`, `<`, `>=`, `<=`, `==`, `!=`) belong inside `filter()`. Assignment with `=` or `<-` would silently set a column and then drop nothing.

</details>

### Exercise 1.2: Pull a budget tier from the diamonds catalog

**Task:** A jeweller preparing a seasonal sale wants the budget tier of the `diamonds` catalog, defined as stones priced strictly below $1,000. Filter the `diamonds` dataset to that subset and save the result to `ex_1_2` so it can be exported to the discount flyer.

**Expected result:**

```
#> # A tibble: 14,524 x 10
#>    carat cut       color clarity depth table price     x     y     z
#>    <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1   0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43
#> 2   0.21 Premium   E     SI1      59.8    61   326  3.89  3.84  2.31
#> 3   0.23 Good      E     VS1      56.9    65   327  4.05  4.07  2.31
#> 4   0.29 Premium   I     VS2      62.4    58   334  4.20  4.23  2.63
#> 5   0.31 Good      J     SI2      63.3    58   335  4.34  4.35  2.75
#> # 14,519 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
You need to subset the catalog down to rows that sit below a strict price cut-off.
Use `filter()` with `price < 1000`; the strict `<` operator excludes the boundary value.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- diamonds |> filter(price < 1000)
ex_1_2
```

**Explanation:** Strictly less than (`<`) is correct because the brief says "strictly below $1,000". Switch to `<=` if the boundary should be inclusive. About 27% of the catalog falls in this tier, which often surprises people because the dataset's price range stretches up to $18,823. The long right tail of the price distribution hides how many entry-level stones the catalog actually contains.

</details>

### Exercise 1.3: Keep only compact cars from the mpg dataset

**Task:** Use `filter()` to keep only the `mpg` rows where the `class` column is exactly `"compact"`. The `mpg` dataset ships with the ggplot2 package and catalogues 234 car models with their EPA fuel economy ratings. Save the compact-only subset to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 47 x 11
#>    manufacturer model    displ  year   cyl trans drv     cty   hwy fl    class
#>    <chr>        <chr>    <dbl> <int> <int> <chr> <chr> <int> <int> <chr> <chr>
#> 1  audi         a4         1.8  1999     4 auto~ f        18    29 p     compact
#> 2  audi         a4         1.8  1999     4 manu~ f        21    29 p     compact
#> 3  audi         a4         2.0  2008     4 manu~ f        20    31 p     compact
#> # 44 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
You want to match each row's category against one exact text label and keep only the matches.
Use `filter()` with `class == "compact"`, quoting the string so R reads it as a literal value.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- mpg |> filter(class == "compact")
ex_1_3
```

**Explanation:** `class == "compact"` is element-wise equality on a character column, so each row's class value is compared to the literal string. Quotes matter here: writing `class == compact` without quotes would search for a variable named `compact` and throw `object 'compact' not found`. There are 47 compact cars across seven manufacturers, making it one of the most common classes in the dataset.

</details>

## Section 2. Combining multiple conditions (4 problems)

### Exercise 2.1: Pick setosa flowers with wide petals

**Task:** Filter the `iris` dataset to rows where `Species` equals `"setosa"` AND `Petal.Width` is at least 0.4 centimetres. Combining two conditions inside `filter()` with a comma (implicit AND) is the single most common dplyr filter pattern in real analysis code. Save the result to `ex_2_1`.

**Expected result:**

```
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.4         3.9          1.7         0.4  setosa
#> 2          5.7         4.4          1.5         0.4  setosa
#> 3          5.1         3.5          1.4         0.3  setosa
#> ...
#> nrow(ex_2_1):
#> [1] 9
```

**Difficulty:** Intermediate

[HINTS]
Two separate requirements must both hold true before a row qualifies.
In `filter()`, list `Species == "setosa"` and `Petal.Width >= 0.4` separated by a comma.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- iris |> filter(Species == "setosa", Petal.Width >= 0.4)
ex_2_1
```

**Explanation:** Inside `filter()`, commas separate conditions and combine them with logical AND. You could also write `Species == "setosa" & Petal.Width >= 0.4` and get an identical result. Use `|` for OR. A common pitfall: `&&` and `||` (double form) short-circuit and only return one value, which silently breaks vectorised row-wise filtering. Stick to single `&` and `|` inside `filter()` calls.

</details>

### Exercise 2.2: Climatologist flags hot and broken-sensor days

**Task:** A climatologist studying poor air quality wants the `airquality` rows where `Ozone` is greater than 100 OR `Solar.R` is missing entirely. The first condition flags pollution hotspots and the second flags sensor outages. Combine the two with the OR operator `|` and save the result to `ex_2_2`.

**Expected result:**

```
#>    Ozone Solar.R Wind Temp Month Day
#> 1     NA      NA 14.3   56     5   5
#> 2    115     223  5.7   79     5  30
#> 3    135     269  4.1   84     7   1
#> ...
#> nrow(ex_2_2):
#> [1] 14
```

**Difficulty:** Intermediate

[HINTS]
A row should survive if either of two unrelated situations applies to it.
Combine `Ozone > 100` with `is.na(Solar.R)` using the `|` operator inside `filter()`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- airquality |> filter(Ozone > 100 | is.na(Solar.R))
ex_2_2
```

**Explanation:** Combining conditions with `|` (OR) keeps rows that satisfy either side. Note that the `Ozone > 100` clause alone would silently drop rows where `Ozone` is `NA`, because any comparison against `NA` returns `NA`, which `filter()` treats as `FALSE`. To explicitly include or exclude NAs, wrap with `is.na()` and chain it with `|` or `&`. There are seven rows where `Solar.R` is missing.

</details>

### Exercise 2.3: Use %in% for four or six-cylinder cars

**Task:** Use `filter()` together with the `%in%` operator to keep only `mtcars` rows whose `cyl` column is either 4 or 6. The `%in%` operator reads cleaner than chaining `==` with `|` once you have three or more allowed values. Save the result to `ex_2_3`.

**Expected result:**

```
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21.0   6 160.0 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710     22.8   4 108.0  93 3.85 2.320 18.61  1  1    4    1
#> Hornet 4 Drive 21.4   6 258.0 110 3.08 3.215 19.44  1  0    3    1
#> ...
#> nrow(ex_2_3):
#> [1] 18
```

**Difficulty:** Intermediate

[HINTS]
You want to test whether each row's value is one of a small allowed set.
Use `filter()` with the `%in%` operator and the vector `c(4, 6)`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- mtcars |> filter(cyl %in% c(4, 6))
ex_2_3
```

**Explanation:** `%in%` returns `TRUE` for each element of the left side that appears anywhere in the right-hand vector. Compared to `cyl == 4 | cyl == 6`, it scales better: just add another value to the vector for an extra allowed level. There are 11 four-cylinder cars and 7 six-cylinder cars in `mtcars`, totalling 18. The complement `!(cyl %in% c(4, 6))` catches the V8s.

</details>

### Exercise 2.4: Filter mid-carat diamonds with between()

**Task:** A jeweller's pricing model focuses on stones between 0.5 and 1.0 carats inclusive, the sweet spot for engagement rings. Use `between()` inside `filter()` to keep only the `diamonds` rows whose `carat` falls in that inclusive range, and save the result to `ex_2_4` for the pricing model input.

**Expected result:**

```
#> # A tibble: 24,624 x 10
#>    carat cut       color clarity depth table price     x     y     z
#>    <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1   0.5  Premium   F     SI2      60.7    58  1414  5.13  5.16  3.12
#> 2   0.51 Premium   F     VS2      59.4    62  1746  5.27  5.30  3.13
#> 3   0.52 Ideal     F     VS1      61.5    56  1624  5.18  5.21  3.19
#> ...
#> # 24,619 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You need to keep rows whose value falls inside a closed numeric range.
Use the `between(carat, 0.5, 1.0)` helper inside `filter()`; both bounds are inclusive.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- diamonds |> filter(between(carat, 0.5, 1.0))
ex_2_4
```

**Explanation:** `between(x, left, right)` is shorthand for `x >= left & x <= right`. Both bounds are inclusive, matching the jeweller's brief. It is purely a readability convenience: the underlying comparison runs at the same speed as the long form. If you need one bound exclusive, fall back to the explicit `carat >= 0.5 & carat < 1.0` form. About 46% of the catalog fits the engagement-ring range.

</details>

## Section 3. Missing values and slicing helpers (2 problems)

### Exercise 3.1: Drop rows where Ozone is missing

**Task:** An analyst preparing the `airquality` dataset for a regression model needs to drop every row where `Ozone` is missing, because the model response variable cannot be `NA`. Use `filter()` together with `!is.na()` to keep only the rows that have a recorded ozone value, and save the result to `ex_3_1`.

**Expected result:**

```
#>    Ozone Solar.R Wind Temp Month Day
#> 1     41     190  7.4   67     5   1
#> 2     36     118  8.0   72     5   2
#> 3     12     149 12.6   74     5   3
#> ...
#> nrow(ex_3_1):
#> [1] 116
```

**Difficulty:** Intermediate

[HINTS]
You want to discard every row whose key measurement was never recorded.
Wrap the column in `is.na()` and negate it with `!` inside `filter()`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- airquality |> filter(!is.na(Ozone))
ex_3_1
```

**Explanation:** `is.na()` returns `TRUE` for missing values, so `!is.na()` inverts the test and keeps only the present ones. `airquality` has 37 missing ozone readings out of 153, leaving 116 complete rows. A frequent trap is writing `Ozone != NA`, which returns `NA` for every row because you cannot compare a value to `NA` with `==` or `!=`, and `filter()` then silently drops every row.

</details>

### Exercise 3.2: Top five highest horsepower cars with slice_max

**Task:** Use `slice_max()` to extract the five `mtcars` rows with the highest `hp`. `slice_max()` is the modern dplyr replacement for sorting by descending value and taking `head(n)`. Save the result to `ex_3_2` and confirm five rows are returned for the top-power leaderboard.

**Expected result:**

```
#>                      mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Maserati Bora       15.0   8 301.0 335 3.54 3.570 14.60  0  1    5    8
#> Ford Pantera L      15.8   8 351.0 264 3.22 3.170 14.50  0  1    5    4
#> Duster 360          14.3   8 360.0 245 3.21 3.570 15.84  0  0    3    4
#> Camaro Z28          13.3   8 350.0 245 3.73 3.840 15.41  0  0    3    4
#> Chrysler Imperial   14.7   8 440.0 230 3.23 5.345 17.42  0  0    3    4
```

**Difficulty:** Intermediate

[HINTS]
You want the handful of rows sitting at the very top of one column's ranking.
Use `slice_max()` on the `hp` column with the argument `n = 5`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mtcars |> slice_max(hp, n = 5)
ex_3_2
```

**Explanation:** `slice_max(hp, n = 5)` orders rows in descending `hp` and returns the top five. Use `slice_min()` for the opposite end. Ties at the boundary are kept by default, so you may receive more than `n` rows when multiple rows share the cutoff value: pass `with_ties = FALSE` to cap at exactly five. The helper is more readable and faster than the older `arrange(desc(hp)) |> head(5)` idiom for this job.

</details>

## Section 4. Selecting and renaming columns (3 problems)

### Exercise 4.1: Keep three core columns from mtcars

**Task:** Use `select()` to keep only the `mpg`, `cyl`, and `hp` columns from `mtcars` and save the result to `ex_4_1`. This is the most basic `select()` pattern: name the columns you want, in the order you want them, and dplyr drops everything you do not name from the result.

**Expected result:**

```
#>                    mpg cyl  hp
#> Mazda RX4         21.0   6 110
#> Mazda RX4 Wag     21.0   6 110
#> Datsun 710        22.8   4  93
#> Hornet 4 Drive    21.4   6 110
#> Hornet Sportabout 18.7   8 175
#> Valiant           18.1   6 105
#> ...
#> # 26 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
You want to keep only a named subset of columns and drop everything else.
Use `select()` and list `mpg`, `cyl`, and `hp` as unquoted column names.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mtcars |> select(mpg, cyl, hp)
head(ex_4_1)
```

**Explanation:** `select()` returns a data frame with only the named columns, in the order you list them. The output order matches the call order: `select(hp, cyl, mpg)` would yield the same three columns but rearranged. Unlike `filter()`, which operates on rows, `select()` works on columns, so its arguments are unquoted column names rather than row-level conditions. This is the first verb most analysts reach for after loading data.

</details>

### Exercise 4.2: Drop one column with negative selection

**Task:** From the `mpg` dataset, drop only the `fl` column (fuel type) while keeping all other columns. Negative selection with a minus sign is the cleanest way to remove one or two columns without listing every survivor by hand. Save the trimmed tibble to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 234 x 10
#>   manufacturer model  displ  year   cyl trans drv     cty   hwy class
#>   <chr>        <chr>  <dbl> <int> <int> <chr> <chr> <int> <int> <chr>
#> 1 audi         a4       1.8  1999     4 auto~ f        18    29 compact
#> 2 audi         a4       1.8  1999     4 manu~ f        21    29 compact
#> 3 audi         a4       2.0  2008     4 manu~ f        20    31 compact
#> ...
#> # 231 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You want to remove a single column while every other column passes through untouched.
Use `select()` with a minus sign in front of the column name: `-fl`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- mpg |> select(-fl)
ex_4_2
```

**Explanation:** Putting a minus sign before a column name removes it from the result; every other column passes through. To drop multiple columns at once, wrap them in `c()`: `select(-c(fl, trans))`. Negative selection composes with helpers too, so `select(-starts_with("c"))` removes every column whose name starts with the letter c. A common confusion is mixing positive and negative selections in one call: keep the call all-positive or all-negative for clarity.

</details>

### Exercise 4.3: Rename columns inline while selecting

**Task:** A reporting analyst preparing a stakeholder summary wants only three columns from `mtcars`, renamed so they are self-explanatory: `mpg` becomes `fuel_economy`, `hp` becomes `horsepower`, and `wt` becomes `weight_tons`. Do both the selection and the rename in a single `select()` call and save the result to `ex_4_3`.

**Expected result:**

```
#>                    fuel_economy horsepower weight_tons
#> Mazda RX4                  21.0        110       2.620
#> Mazda RX4 Wag              21.0        110       2.875
#> Datsun 710                 22.8         93       2.320
#> Hornet 4 Drive             21.4        110       3.215
#> ...
#> # 28 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You want to pick a few columns and give each a clearer label in the same step.
Inside `select()`, use the `new_name = old_name` syntax, for example `fuel_economy = mpg`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- mtcars |> select(fuel_economy = mpg, horsepower = hp, weight_tons = wt)
head(ex_4_3)
```

**Explanation:** Inside `select()`, the syntax `new_name = old_name` renames a column while selecting it. The new name goes on the left and the original on the right, which is the opposite of base R's `names()<-` idiom. If you only want to rename without dropping any other columns, reach for `rename()` instead. Doing both in one `select()` call keeps the pipeline shorter for ad-hoc reports that go straight into a slide deck.

</details>

## Section 5. Selection helpers (4 problems)

### Exercise 5.1: Pull Sepal columns with starts_with

**Task:** Use the `starts_with()` selection helper inside `select()` to keep only the columns of `iris` whose name begins with `"Sepal"`. This pattern is essential when your tables follow a naming convention like `prefix_*`, which is common in survey data and feature engineering output. Save the result to `ex_5_1`.

**Expected result:**

```
#>   Sepal.Length Sepal.Width
#> 1          5.1         3.5
#> 2          4.9         3.0
#> 3          4.7         3.2
#> 4          4.6         3.1
#> 5          5.0         3.6
#> ...
#> # 145 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You want to grab every column whose name shares a common opening prefix.
Use the `starts_with("Sepal")` helper inside `select()`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- iris |> select(starts_with("Sepal"))
head(ex_5_1)
```

**Explanation:** `starts_with()` matches column names that begin with the supplied string and returns them in original order. Companion helpers include `ends_with()`, `contains()`, and `matches()` (full regex). The match is case-insensitive by default; pass `ignore.case = FALSE` if you need exact case. For wide tables (think survey data with `q1_a`, `q1_b`, ...), helpers like these turn a 50-column select into a one-liner.

</details>

### Exercise 5.2: Pull dimension columns with any_of

**Task:** A jewellery analyst auditing physical measurements needs only the three dimension columns of the `diamonds` catalog: `x`, `y`, and `z`. Use `select()` with the `any_of()` helper and a name vector to grab them in one call, then save the result to `ex_5_2`. Using `any_of()` makes the call robust when the column list is built dynamically.

**Expected result:**

```
#> # A tibble: 53,940 x 3
#>       x     y     z
#>   <dbl> <dbl> <dbl>
#> 1  3.95  3.98  2.43
#> 2  3.89  3.84  2.31
#> 3  4.05  4.07  2.31
#> 4  4.20  4.23  2.63
#> ...
#> # 53,936 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You want to select columns from a name vector without breaking if one is absent.
Pass the character vector of names to the `any_of()` helper inside `select()`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dims <- c("x", "y", "z")
ex_5_2 <- diamonds |> select(any_of(dims))
ex_5_2
```

**Explanation:** `any_of(dims)` selects every column in the vector that actually exists in the data and silently ignores any that don't. The strict counterpart `all_of()` errors when a name is missing, which is useful when you want a hard contract. Either is far safer than the bare unquoted form `select(x, y, z)` for code that builds column names dynamically (from config files, function arguments, or user input).

</details>

### Exercise 5.3: Extract numeric columns with where(is.numeric)

**Task:** Use `select()` together with `where()` and the predicate `is.numeric` to keep only the numeric columns of the `mpg` dataset. The `where()` helper applies a predicate function to each column and returns the columns where the function evaluates to `TRUE`. Save the numeric-only tibble to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 234 x 5
#>   displ  year   cyl   cty   hwy
#>   <dbl> <int> <int> <int> <int>
#> 1   1.8  1999     4    18    29
#> 2   1.8  1999     4    21    29
#> 3   2.0  2008     4    20    31
#> ...
#> # 231 more rows hidden
```

**Difficulty:** Advanced

[HINTS]
You want to choose columns by testing a property of each one rather than naming them.
Use `select()` with `where()` and pass the predicate `is.numeric`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- mpg |> select(where(is.numeric))
ex_5_3
```

**Explanation:** `where(predicate)` evaluates the predicate against each column and keeps the columns where the result is `TRUE`. `is.numeric` matches both integer and double columns. Common variants include `where(is.character)`, `where(is.factor)`, and custom anonymous functions like `where(~ mean(.x, na.rm = TRUE) > 0)` for value-based selection. It is the dplyr equivalent of `Filter(is.numeric, df)` in base R, but composes naturally inside the tidyverse grammar.

</details>

### Exercise 5.4: Move the last column to the front with last_col

**Task:** A data engineer publishing the `mpg` dataset wants the very last column of the table moved to the front and every other column to follow in its original order. Use `select()` with `last_col()` and `everything()` to reorder without retyping any column names, then save the result to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 234 x 11
#>   class   manufacturer model displ  year   cyl trans drv     cty   hwy fl
#>   <chr>   <chr>        <chr> <dbl> <int> <int> <chr> <chr> <int> <int> <chr>
#> 1 compact audi         a4      1.8  1999     4 auto~ f        18    29 p
#> 2 compact audi         a4      1.8  1999     4 manu~ f        21    29 p
#> 3 compact audi         a4      2.0  2008     4 manu~ f        20    31 p
#> ...
#> # 231 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You want to pull the rightmost column to the front, then let the rest follow in their original order.
Combine the `last_col()` and `everything()` helpers inside `select()`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- mpg |> select(last_col(), everything())
head(ex_5_4)
```

**Explanation:** `last_col()` returns the index of the rightmost column, and dplyr keeps each named column only once even when it appears in multiple helpers. The result: `class` jumps to position 1, then `everything()` adds the rest in original order without duplicating `class`. The same trick reorders the second-to-last column with `last_col(offset = 1)`. Useful for surfacing identifier columns that exporters tend to bury at the end of a wide table.

</details>

## Section 6. Filter and select together (4 problems)

### Exercise 6.1: Houston-only housing trend feed

**Task:** A real estate analyst building a Houston-only price trend dashboard needs from `txhousing` only the columns `date`, `median`, and `sales`, and only the rows where `city` equals `"Houston"`. Chain `filter()` and `select()` together and save the result to `ex_6_1` for the dashboard data feed.

**Expected result:**

```
#> # A tibble: 187 x 3
#>     date median sales
#>    <dbl>  <dbl> <int>
#> 1  2000  129200  3041
#> 2  2000. 131800  4154
#> 3  2000. 133000  4202
#> 4  2000. 134300  4061
#> ...
#> # 183 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You want to narrow down to one city's rows first, then keep only the columns the feed needs.
Chain `filter(city == "Houston")` into `select(date, median, sales)` with the pipe.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- txhousing |>
  filter(city == "Houston") |>
  select(date, median, sales)
ex_6_1
```

**Explanation:** Order matters here only for efficiency, not correctness: filtering first means `select()` operates on far fewer rows. Reversing the order would still give an identical result. The pipe `|>` reads top to bottom as "take `txhousing`, filter to Houston, then select the three columns" - much clearer than the nested call `select(filter(txhousing, ...), ...)`. The Houston subset spans roughly 16 years of monthly observations.

</details>

### Exercise 6.2: Premium-cut diamond pricing slice

**Task:** A jeweller pricing premium-cut stones wants only the rows of `diamonds` where `cut` equals `"Premium"`, and only the columns `carat`, `color`, `clarity`, and `price`. Combine `filter()` and `select()` into one pipeline, then save the slice to `ex_6_2` so it can be handed off to the pricing model.

**Expected result:**

```
#> # A tibble: 13,791 x 4
#>    carat color clarity price
#>    <dbl> <ord> <ord>   <int>
#> 1   0.21 E     SI1       326
#> 2   0.29 I     VS2       334
#> 3   0.22 F     SI1       342
#> 4   0.20 E     SI2       345
#> ...
#> # 13,787 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
You want to restrict to one category of rows, then trim down to the reporting columns.
Pipe `filter(cut == "Premium")` into `select(carat, color, clarity, price)`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- diamonds |>
  filter(cut == "Premium") |>
  select(carat, color, clarity, price)
ex_6_2
```

**Explanation:** This is the canonical analyst pattern: narrow rows first, then narrow columns. The `cut` column in `diamonds` is an ordered factor, but `"Premium"` still works as a character literal because R compares factor levels by their label string. There are 13,791 Premium-cut diamonds in the catalog, just over 25% of the total. Pricing teams typically pair this with a `group_by(color)` summary downstream.

</details>

### Exercise 6.3: Summer pollution audit

**Task:** A climatologist auditing summer pollution wants from `airquality` only the months of June, July, and August, only the rows that have a recorded `Ozone` value, and only the columns `Ozone`, `Temp`, and `Month`. Combine two `filter()` conditions with a `select()` step and save the result to `ex_6_3`.

**Expected result:**

```
#>    Ozone Temp Month
#> 1     NA   NA    NA
#> 2     71   81     6
#> 3     49   69     6
#> 4     39   84     6
#> ...
#> nrow(ex_6_3):
#> [1] 83
```

**Difficulty:** Advanced

[HINTS]
You want to apply two row tests at once, then expose only three columns.
Use `filter(Month %in% c(6, 7, 8), !is.na(Ozone))`, then `select(Ozone, Temp, Month)`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- airquality |>
  filter(Month %in% c(6, 7, 8), !is.na(Ozone)) |>
  select(Ozone, Temp, Month)
ex_6_3
```

**Explanation:** Two comma-separated filter conditions combine with implicit AND, the same as writing `&` between them. `airquality$Month` is numeric, not a factor, so `%in% c(6, 7, 8)` works without quotes around the months. Of the 92 summer rows, 83 have an ozone reading. The 10% missingness rate climbs late in August. Always filter NAs before downstream summary statistics so the row counts in your report match what users see.

</details>

### Exercise 6.4: Fuel-efficient small cars shortlist

**Task:** A consumer-reports analyst wants from `mpg` only the rows where `class` is either `"compact"` or `"subcompact"` and `hwy` (highway mpg) is at least 30. From those rows, keep just `manufacturer`, `model`, `class`, and `hwy`. Chain `filter()` and `select()` and save the result to `ex_6_4` for the shortlist.

**Expected result:**

```
#> # A tibble: 39 x 4
#>   manufacturer model     class      hwy
#>   <chr>        <chr>     <chr>    <int>
#> 1 audi         a4        compact     30
#> 2 audi         a4        compact     31
#> 3 audi         a4 quattro compact     31
#> ...
#> # 36 more rows hidden
```

**Difficulty:** Advanced

[HINTS]
You want to combine a set-membership test and a numeric threshold, then keep four columns.
Use `filter(class %in% c("compact", "subcompact"), hwy >= 30)`, then `select(manufacturer, model, class, hwy)`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- mpg |>
  filter(class %in% c("compact", "subcompact"), hwy >= 30) |>
  select(manufacturer, model, class, hwy)
ex_6_4
```

**Explanation:** `%in%` plus a numeric threshold is the typical "small fuel-efficient car" shopping query. The pipeline order (filter then select) is conventional: it narrows the data before exposing only the columns the consumer report cares about. Thirty-nine rows survive both filters. Watch out for duplicate `manufacturer`-`model` pairs across model years: here that's expected, because each row is one model-year combination rather than a single car.

</details>

## What to do next

You've drilled the full grammar of `filter()` and `select()` across 20 problems. To go deeper, work through these next:

- [dplyr filter() in R](dplyr-filter-in-R.html): the long-form reference for `filter()` patterns including row-wise comparisons, `if_any()`, and `if_all()`.
- [dplyr select() in R](dplyr-select-in-R.html): every selection helper (`starts_with`, `ends_with`, `matches`, `num_range`, `where`) with worked examples.
- [dplyr arrange and slice](dplyr-arrange-slice.html): combine row filters with ordering, `slice_head`, `slice_min`, and `slice_sample` to build leaderboards.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html): the umbrella exercise hub covering all six core dplyr verbs end to end.
