---
title: "R Subsetting Exercises: 20 Practice Problems for Vectors, Lists, and Data Frames"
slug: "R-Subsetting-Exercises"
description: "Practice R subsetting with 20 hands-on exercises covering vectors, lists, data frames, and matrices. Hidden solutions and explanations included."
keywords: "R subsetting exercises, R bracket exercises, R indexing practice, R list subsetting, R data frame subsetting, R matrix subsetting, double bracket R, R subsetting practice"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Subsetting Exercises"
sidebar_order: 145
fr_parent: "R-Subsetting.html"
auto_link_terms: "R subsetting exercises|R subsetting practice|bracket exercises in R|R indexing exercises|practice R subsetting"
auto_link_case_sensitive: false
target_keyword: "R subsetting exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Subsetting Exercises: 20 Practice Problems for Vectors, Lists, and Data Frames

<p class="lead">Twenty scenario-based subsetting exercises grouped into five themed sections covering vectors, lists, data frames, matrices, and advanced patterns. Every problem ships with an expected result so you can verify your answer, and solutions stay hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(tibble)
```

## Section 1. Subsetting vectors (4 problems)

### Exercise 1.1: Extract elements by position and by name

**Task:** A teacher has stored mid-term scores in a named numeric vector called `scores`. Use `[]` to first extract the 2nd and 4th scores by position, then extract the same two scores by name. Save the name-based extraction to `ex_1_1`.

**Expected result:**

```
#> science history
#>      92      95
```

**Difficulty:** Beginner

```r title="Your turn"
scores <- c(math = 88, science = 92, english = 79, history = 95, art = 84)

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- c(math = 88, science = 92, english = 79, history = 95, art = 84)

scores[c(2, 4)]
#> science history
#>      92      95

ex_1_1 <- scores[c("science", "history")]
ex_1_1
#> science history
#>      92      95
```

**Explanation:** Position indexing with `c(2, 4)` and name indexing with `c("science", "history")` return the same named numeric vector here. Names survive every subsetting step, which is what makes the second form safer: if anyone reorders `scores` later, the position call grabs the wrong students while the name call still finds science and history.

</details>

### Exercise 1.2: Logical and negative indexing on a vector

**Task:** From the `scores` vector created above, extract every score strictly greater than 85 using a logical condition. Then build a second result that excludes the 3rd element using negative indexing. Save the above-85 result to `ex_1_2`.

**Expected result:**

```
#>    math science history
#>      88      92      95
```

**Difficulty:** Beginner

```r title="Your turn"
scores <- c(math = 88, science = 92, english = 79, history = 95, art = 84)

ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- c(math = 88, science = 92, english = 79, history = 95, art = 84)

ex_1_2 <- scores[scores > 85]
ex_1_2
#>    math science history
#>      88      92      95

scores[-3]
#>    math science history     art
#>      88      92      95      84
```

**Explanation:** `scores > 85` produces a logical vector aligned with `scores`, and `[ ]` keeps only positions where it evaluates `TRUE`. Negative indexing with `-3` drops the third element, and `-c(1, 3)` drops several at once. Mixing positive and negative indices inside one call is an error in R.

</details>

### Exercise 1.3: Replace selected elements via subsetting assignment

**Task:** A quality-control engineer just discovered that any reading below zero in the sensor vector `readings` is a calibration glitch and should be replaced with `NA`. Use logical indexing on the left side of `<-` to overwrite those bad values in place. Save the cleaned vector to `ex_1_3`.

**Expected result:**

```
#> [1] 12.4   NA  8.7   NA  0.5 15.6 22.1   NA
```

**Difficulty:** Intermediate

```r title="Your turn"
readings <- c(12.4, -1.0, 8.7, -3.2, 0.5, 15.6, 22.1, -0.1)

# your code here

ex_1_3 <- readings
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
readings <- c(12.4, -1.0, 8.7, -3.2, 0.5, 15.6, 22.1, -0.1)

readings[readings < 0] <- NA
ex_1_3 <- readings
ex_1_3
#> [1] 12.4   NA  8.7   NA  0.5 15.6 22.1   NA
```

**Explanation:** The left-hand side of `<-` accepts the same indexing syntax as the right-hand side, so R rewrites the call as "replace the selected positions with `NA`". The vector is modified in place rather than rebuilt. This idiom scales to data-cleaning steps where you want to mark bad values without dropping rows.

</details>

### Exercise 1.4: Find positions of matching elements with which

**Task:** An audit team needs to know the row positions where customer IDs in `ids` equal the suspicious values `"C103"` or `"C107"`. Use `which()` combined with `%in%` to return the integer positions inside `ids`. Save the positions to `ex_1_4`.

**Expected result:**

```
#> [1] 4 8
```

**Difficulty:** Intermediate

```r title="Your turn"
ids <- c("C100", "C101", "C102", "C103", "C104",
         "C105", "C106", "C107", "C108")

ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ids <- c("C100", "C101", "C102", "C103", "C104",
         "C105", "C106", "C107", "C108")

ex_1_4 <- which(ids %in% c("C103", "C107"))
ex_1_4
#> [1] 4 8
```

**Explanation:** `ids %in% c("C103", "C107")` returns a logical vector marking matches. Wrapping it in `which()` converts those `TRUE` positions to integer indices, which is what you actually need to subset other parallel vectors (transaction amounts, timestamps) that sit alongside `ids`. Without `which()` you would still have a logical mask, useful for slicing the same vector but awkward for cross-referencing positions.

</details>

## Section 2. Subsetting lists with [], [[]], and $ (4 problems)

### Exercise 2.1: One bracket keeps the list, two brackets extract the element

**Task:** Given the list `prefs` storing a user's display preferences, use single `[]` to return a one-element sub-list containing just `theme`, and use `[[]]` to extract the value of `theme` as a bare character vector. Save the `[[]]` extraction to `ex_2_1`.

**Expected result:**

```
#> [1] "dark"
```

**Difficulty:** Beginner

```r title="Your turn"
prefs <- list(theme = "dark", font_size = 14, autosave = TRUE)

ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prefs <- list(theme = "dark", font_size = 14, autosave = TRUE)

prefs["theme"]
#> $theme
#> [1] "dark"

ex_2_1 <- prefs[["theme"]]
ex_2_1
#> [1] "dark"
```

**Explanation:** `prefs["theme"]` keeps the list wrapper, so the result is still a list of length 1. `prefs[["theme"]]` unwraps and returns the underlying character vector. If you called `nchar()` on the first form you would hit an error; on the second it works cleanly. This is the single rule that catches the most beginners with R lists.

</details>

### Exercise 2.2: Dollar sign as syntactic sugar for [[]]

**Task:** Continuing with the `prefs` list, use the `$` operator to extract `font_size` directly. Then use `[[]]` to do the same and confirm with `identical()` that both calls return the same value. Save the `$` extraction to `ex_2_2`.

**Expected result:**

```
#> [1] 14
#> [1] TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
prefs <- list(theme = "dark", font_size = 14, autosave = TRUE)

ex_2_2 <- # your code here
ex_2_2
identical(ex_2_2, prefs[["font_size"]])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prefs <- list(theme = "dark", font_size = 14, autosave = TRUE)

ex_2_2 <- prefs$font_size
ex_2_2
#> [1] 14

identical(prefs$font_size, prefs[["font_size"]])
#> [1] TRUE
```

**Explanation:** `$name` is shorthand for `[["name"]]` with one extra feature: it does partial matching on names (`prefs$font` would still work, which is dangerous). Unlike `[[]]`, you cannot pass a variable holding the name to `$`; you must literally type the field. For programmatic code use `[[]]`; for quick interactive work, `$` is fine.

</details>

### Exercise 2.3: Recursive indexing with [[c(i, j, k)]]

**Task:** A list `report` contains a nested sub-list `metrics`, which itself holds a numeric vector `monthly`. Use the recursive form `[[c(...)]]` to reach two levels down and pull out the third element of `monthly` in one expression. Save it to `ex_2_3`.

**Expected result:**

```
#> [1] 162
```

**Difficulty:** Advanced

```r title="Your turn"
report <- list(
  title = "Q1",
  metrics = list(
    monthly = c(120, 145, 162, 178),
    yearly  = 605
  )
)

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
report <- list(
  title = "Q1",
  metrics = list(
    monthly = c(120, 145, 162, 178),
    yearly  = 605
  )
)

ex_2_3 <- report[[c("metrics", "monthly", 3)]]
ex_2_3
#> [1] 162
```

**Explanation:** When you pass a length-n vector to `[[]]`, R drills one level per element, so `[[c("metrics", "monthly", 3)]]` is equivalent to `report[["metrics"]][["monthly"]][[3]]`. This is the cleanest way to fetch deeply nested data, but it errors hard if any intermediate name is missing. Reach for `purrr::pluck()` when paths might fail and you want a safe default.

</details>

### Exercise 2.4: Partial matching pitfall with $

**Task:** A code reviewer is auditing a function where the previous author wrote `config$item` against a list whose actual key is `items`. Show that `config$item` still returns the value because of partial matching, then show that `config[["item"]]` returns `NULL` instead. Save the safe `[[]]` result to `ex_2_4`.

**Expected result:**

```
#> [1] "a" "b" "c"
#> NULL
```

**Difficulty:** Intermediate

```r title="Your turn"
config <- list(items = c("a", "b", "c"), threshold = 0.5)

config$item       # partial match: silently works

ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
config <- list(items = c("a", "b", "c"), threshold = 0.5)

config$item
#> [1] "a" "b" "c"

ex_2_4 <- config[["item"]]
ex_2_4
#> NULL
```

**Explanation:** `$` quietly partial-matches `item` against `items` and returns the value, which can mask bugs where a typo in the key would otherwise be caught. `[[]]` requires exact match by default and returns `NULL` for a missing key, surfacing the mistake immediately. Set `options(warnPartialMatchDollar = TRUE)` to get a warning, and prefer `[[]]` inside package code.

</details>

## Section 3. Subsetting data frames (4 problems)

### Exercise 3.1: Extract a data-frame column three different ways

**Task:** An analyst pulling totals from the built-in `mtcars` data frame wants to extract the `mpg` column three ways: with `mtcars[, "mpg"]`, with `mtcars[["mpg"]]`, and with `mtcars$mpg`. Confirm all three are identical with `identical()` and save the `$` version to `ex_3_1`.

**Expected result:**

```
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1
#> [1] TRUE
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1)
identical(ex_3_1, mtcars[["mpg"]])
identical(ex_3_1, mtcars[, "mpg"])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars$mpg
head(ex_3_1)
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1

identical(ex_3_1, mtcars[["mpg"]])
#> [1] TRUE

identical(ex_3_1, mtcars[, "mpg"])
#> [1] TRUE
```

**Explanation:** A data frame is internally a list of equal-length columns, so all three forms reach the same vector. Use `$` for interactive work, `[["mpg"]]` when the column name lives in a variable, and `[, "mpg"]` when you want consistent matrix-like notation. For tibbles (not base data frames), `[, "mpg"]` keeps the tibble wrapper, so the three forms diverge.

</details>

### Exercise 3.2: Filter rows and select columns in one call

**Task:** A used-car appraiser inspecting `mtcars` needs every six-cylinder model along with just the `cyl`, `mpg`, and `hp` columns. Use `[rows, cols]` notation in a single call: a logical condition for rows and a character vector for columns. Save the result to `ex_3_2`.

**Expected result:**

```
#>                cyl  mpg  hp
#> Mazda RX4        6 21.0 110
#> Mazda RX4 Wag    6 21.0 110
#> Hornet 4 Drive   6 21.4 110
#> Valiant          6 18.1 105
#> Merc 280         6 19.2 123
#> Merc 280C        6 17.8 123
#> Ferrari Dino     6 19.7 175
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mtcars[mtcars$cyl == 6, c("cyl", "mpg", "hp")]
ex_3_2
#>                cyl  mpg  hp
#> Mazda RX4        6 21.0 110
#> Mazda RX4 Wag    6 21.0 110
#> Hornet 4 Drive   6 21.4 110
#> Valiant          6 18.1 105
#> Merc 280         6 19.2 123
#> Merc 280C        6 17.8 123
#> Ferrari Dino     6 19.7 175
```

**Explanation:** The first argument inside `[ , ]` selects rows; the second selects columns. A logical vector for rows must be the same length as `nrow(df)`. A character vector for columns is order-preserving, so output columns appear in the order you listed them, not the original column order. Rownames carry through into the subset by default.

</details>

### Exercise 3.3: df[, 1] vs df[[1]] and the drop=TRUE trap

**Task:** Working on `iris`, show that `iris[, 1]` and `iris[[1]]` both return the same numeric vector, but `iris[, 1, drop = FALSE]` returns a single-column data frame instead. Save the data-frame-shaped result to `ex_3_3`.

**Expected result:**

```
#> [1] TRUE
#>   Sepal.Length
#> 1          5.1
#> 2          4.9
#> 3          4.7
#> [1] "data.frame"
```

**Difficulty:** Advanced

```r title="Your turn"
identical(iris[, 1], iris[[1]])

ex_3_3 <- # your code here
head(ex_3_3, 3)
class(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
identical(iris[, 1], iris[[1]])
#> [1] TRUE

ex_3_3 <- iris[, 1, drop = FALSE]
head(ex_3_3, 3)
#>   Sepal.Length
#> 1          5.1
#> 2          4.9
#> 3          4.7

class(ex_3_3)
#> [1] "data.frame"
```

**Explanation:** Base data frames have `drop = TRUE` as the default when you ask for a single column, which collapses the result to a bare vector and surprises pipelines that expect a data frame. Setting `drop = FALSE` preserves the column structure. Tibbles invert this default (a single-column tibble slice stays a tibble), which is one of the main reasons people migrate to tibbles.

</details>

### Exercise 3.4: Subset with a combined logical mask

**Task:** A retailer auditing `mtcars` wants rows where cars are heavy (`wt > 5`) AND fuel-thirsty (`mpg < 15`). Build a logical mask combining the two conditions with `&` and use it inside `[rows, ]`. Save the filtered data frame to `ex_3_4`.

**Expected result:**

```
#>                      mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Cadillac Fleetwood  10.4   8  472 205 2.93 5.250 17.98  0  0    3    4
#> Lincoln Continental 10.4   8  460 215 3.00 5.424 17.82  0  0    3    4
#> Chrysler Imperial   14.7   8  440 230 3.23 5.345 17.42  0  0    3    4
```

**Difficulty:** Intermediate

```r title="Your turn"
heavy_thirsty <- # your code here
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
heavy_thirsty <- mtcars$wt > 5 & mtcars$mpg < 15
ex_3_4 <- mtcars[heavy_thirsty, ]
ex_3_4
#>                      mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Cadillac Fleetwood  10.4   8  472 205 2.93 5.250 17.98  0  0    3    4
#> Lincoln Continental 10.4   8  460 215 3.00 5.424 17.82  0  0    3    4
#> Chrysler Imperial   14.7   8  440 230 3.23 5.345 17.42  0  0    3    4
```

**Explanation:** `&` is the vectorised AND operator that returns a logical vector the same length as its inputs; `&&` short-circuits and returns a single value, so it would error inside `[ , ]`. Save the mask to a name when the expression is long: it makes the subset call short and easy to read, and lets you reuse the same mask for parallel slicing of other objects.

</details>

## Section 4. Subsetting matrices (4 problems)

### Exercise 4.1: Two-dimensional indexing with [row, col]

**Task:** Given a 4 by 3 matrix `m` of quarterly regional sales, extract the value at row 2, column 3 using `m[2, 3]`. Then return the entire 2nd row by leaving the column index empty. Save the single value at row 2, column 3 to `ex_4_1`.

**Expected result:**

```
#> [1] 132
#> North South  East
#>   145   155   132
```

**Difficulty:** Intermediate

```r title="Your turn"
m <- matrix(
  c(120, 145, 162, 178,
    130, 155, 170, 184,
    110, 132, 150, 165),
  nrow = 4, ncol = 3,
  dimnames = list(c("Q1", "Q2", "Q3", "Q4"),
                  c("North", "South", "East"))
)

ex_4_1 <- # your code here
ex_4_1
m[2, ]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(
  c(120, 145, 162, 178,
    130, 155, 170, 184,
    110, 132, 150, 165),
  nrow = 4, ncol = 3,
  dimnames = list(c("Q1", "Q2", "Q3", "Q4"),
                  c("North", "South", "East"))
)

ex_4_1 <- m[2, 3]
ex_4_1
#> [1] 132

m[2, ]
#> North South  East
#>   145   155   132
```

**Explanation:** A matrix is indexed with two arguments inside `[ , ]`: row first, column second. Leaving an argument empty returns the full dimension. Both numeric and character (when dimnames exist) indexing work, so `m["Q2", "East"]` returns the same scalar. A single-cell extraction drops the matrix attribute and returns a bare numeric.

</details>

### Exercise 4.2: Keep matrix shape with drop = FALSE

**Task:** An ML engineer building a pipeline expects every step to receive a matrix. Show that `m[, 2]` collapses to a named vector and breaks the contract, then re-do the same selection with `drop = FALSE` to keep it as a 4 by 1 matrix. Save the matrix-shaped result to `ex_4_2`.

**Expected result:**

```
#>    South
#> Q1   130
#> Q2   155
#> Q3   170
#> Q4   184
```

**Difficulty:** Intermediate

```r title="Your turn"
m[, 2]                  # collapses to vector

ex_4_2 <- # your code here
ex_4_2
dim(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m[, 2]
#>  Q1  Q2  Q3  Q4
#> 130 155 170 184

ex_4_2 <- m[, 2, drop = FALSE]
ex_4_2
#>    South
#> Q1   130
#> Q2   155
#> Q3   170
#> Q4   184

dim(ex_4_2)
#> [1] 4 1
```

**Explanation:** The default `drop = TRUE` collapses any dimension of size 1, so a single-column slice becomes a vector and a single-row slice becomes a vector. Setting `drop = FALSE` keeps the dimension attribute intact. This matters most inside machine-learning pipelines or `apply()` callbacks where downstream code does `dim(x)[1]` or `solve(x)` and silently fails on a bare vector.

</details>

### Exercise 4.3: Filter matrix rows with a logical condition

**Task:** A regional sales analyst wants the rows of `m` where the North region sold more than 150 units. Build a logical mask from `m[, "North"] > 150` and use it as the row index inside `m[rows, ]`. Save the filtered matrix to `ex_4_3`.

**Expected result:**

```
#>    North South East
#> Q3   162   170  150
#> Q4   178   184  165
```

**Difficulty:** Intermediate

```r title="Your turn"
north_mask <- # your code here
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
north_mask <- m[, "North"] > 150
ex_4_3 <- m[north_mask, ]
ex_4_3
#>    North South East
#> Q3   162   170  150
#> Q4   178   184  165
```

**Explanation:** `m[, "North"]` returns the North column as a vector; comparing it to 150 produces a logical vector aligned with the rows. Passing that vector as the row index keeps only matching rows. The number of `TRUE` entries determines `nrow()` of the result. The same pattern flips for columns: `m[, m["Q1", ] > 100]` filters columns by the Q1 row.

</details>

### Exercise 4.4: Pull scattered cells with a 2-column index matrix

**Task:** A statistician needs the main diagonal of `m`'s first 3 rows and 3 columns: cells `(1, 1)`, `(2, 2)`, and `(3, 3)`. Build a 2-column matrix holding those row/column pairs and pass it directly to `m[ ]` with no comma to pull out just those cells. Save the result to `ex_4_4`.

**Expected result:**

```
#> [1] 120 155 150
```

**Difficulty:** Advanced

```r title="Your turn"
idx <- # your code here
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
idx <- matrix(c(1, 1,
                2, 2,
                3, 3),
              ncol = 2, byrow = TRUE)

ex_4_4 <- m[idx]
ex_4_4
#> [1] 120 155 150
```

**Explanation:** When you pass an n by 2 integer matrix to `m[ ]` (no comma inside the brackets), R reads each row as an `(i, j)` pair and returns the value at that cell. This is the canonical way to pull a scattered set of cells in a single call, far cleaner than a loop. The same trick generalises: an n by k index matrix works on a k-dimensional array.

</details>

## Section 5. Advanced subsetting patterns (4 problems)

### Exercise 5.1: Extract from a deeply nested config list

**Task:** A site reliability engineer is reading a configuration list that holds a `database` sub-list containing a `replicas` numeric vector of port numbers. Use `$` chaining first, then the recursive `[[c(...)]]` form, to pull out the second replica's port. Save the recursive-form result to `ex_5_1`.

**Expected result:**

```
#> [1] 5434
#> [1] 5434
```

**Difficulty:** Advanced

```r title="Your turn"
cfg <- list(
  app = list(name = "billing", version = "2.4"),
  database = list(
    host = "db.internal",
    replicas = c(5433L, 5434L, 5435L)
  )
)

cfg$database$replicas[2]

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cfg <- list(
  app = list(name = "billing", version = "2.4"),
  database = list(
    host = "db.internal",
    replicas = c(5433L, 5434L, 5435L)
  )
)

cfg$database$replicas[2]
#> [1] 5434

ex_5_1 <- cfg[[c("database", "replicas", 2)]]
ex_5_1
#> [1] 5434
```

**Explanation:** `$` chaining reads top-down and is fine when every key exists. The recursive `[[c(...)]]` form does the same drill in a single call and is easier to parameterise: store the path in a character vector and you can extract any field without touching code. Both forms throw a hard error if an intermediate name is missing, so wrap them in `tryCatch()` if paths might fail.

</details>

### Exercise 5.2: Bulk-redact list fields with a name vector

**Task:** A data engineer needs to mask three sensitive fields (`ssn`, `email`, `phone`) inside a customer record list by replacing each value with the string `"REDACTED"`. Use `record[c("ssn", "email", "phone")] <- "REDACTED"` to assign all three positions in a single call. Save the redacted list to `ex_5_2`.

**Expected result:**

```
#> $name
#> [1] "Alex Kim"
#>
#> $ssn
#> [1] "REDACTED"
#>
#> $email
#> [1] "REDACTED"
#>
#> $phone
#> [1] "REDACTED"
#>
#> $role
#> [1] "admin"
```

**Difficulty:** Intermediate

```r title="Your turn"
record <- list(
  name  = "Alex Kim",
  ssn   = "123-45-6789",
  email = "alex@example.com",
  phone = "555-0100",
  role  = "admin"
)

# your code here

ex_5_2 <- record
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
record <- list(
  name  = "Alex Kim",
  ssn   = "123-45-6789",
  email = "alex@example.com",
  phone = "555-0100",
  role  = "admin"
)

record[c("ssn", "email", "phone")] <- "REDACTED"
ex_5_2 <- record
ex_5_2
```

**Explanation:** Subset assignment with a name vector recycles the right-hand side across all selected positions. Pass a list on the right to assign different values per slot, like `record[...] <- list("X", "Y", "Z")`. Use `[<-` (not `[[<-`) when writing to multiple slots in one shot. This pattern is the cleanest way to bulk-update a config or redact a record.

</details>

### Exercise 5.3: Drop a list element by assigning NULL

**Task:** Given the same `record` list (the original, before redaction), drop the `ssn` field entirely by assigning `NULL` to it via `[[<-`. The name should disappear from `names(record)` and the list should shrink to four entries. Save the shrunk list to `ex_5_3`.

**Expected result:**

```
#> [1] "name"  "email" "phone" "role"
```

**Difficulty:** Advanced

```r title="Your turn"
record <- list(
  name  = "Alex Kim",
  ssn   = "123-45-6789",
  email = "alex@example.com",
  phone = "555-0100",
  role  = "admin"
)

# your code here

ex_5_3 <- record
names(ex_5_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
record <- list(
  name  = "Alex Kim",
  ssn   = "123-45-6789",
  email = "alex@example.com",
  phone = "555-0100",
  role  = "admin"
)

record[["ssn"]] <- NULL
ex_5_3 <- record
names(ex_5_3)
#> [1] "name"  "email" "phone" "role"
```

**Explanation:** Assigning `NULL` via `[[<-` is the documented way to drop a list element. The list shrinks by one and the surviving names are renumbered. To keep a slot that literally holds `NULL` (instead of removing it), wrap the value in `list(NULL)` on the right-hand side. The behaviour of `[<- NULL` is different and inconsistent, so always use `[[<-` for deletion.

</details>

### Exercise 5.4: Pull a matrix diagonal with a row/col equality mask

**Task:** Build a 5 by 5 matrix `mm` filled with the integers 1 through 25, then use the logical mask `row(mm) == col(mm)` inside `mm[ ]` to extract the main diagonal in a single call. Save the diagonal vector to `ex_5_4`.

**Expected result:**

```
#> [1]  1  7 13 19 25
#> [1]  1  7 13 19 25
```

**Difficulty:** Advanced

```r title="Your turn"
mm <- matrix(1:25, nrow = 5)

ex_5_4 <- # your code here
ex_5_4

diag(mm)  # built-in shortcut for comparison
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mm <- matrix(1:25, nrow = 5)

ex_5_4 <- mm[row(mm) == col(mm)]
ex_5_4
#> [1]  1  7 13 19 25

diag(mm)
#> [1]  1  7 13 19 25
```

**Explanation:** `row(mm)` and `col(mm)` return matrices the same shape as `mm` filled with row and column indices respectively. The comparison `row(mm) == col(mm)` is a logical matrix that is `TRUE` only on the main diagonal. Indexing `mm` with that mask pulls out those cells. `diag()` is the shortcut; the mask form generalises to off-diagonals (e.g., `row(mm) - col(mm) == 1`) or any geometric pattern.

</details>

## What to do next

You have practised every subsetting operator across vectors, lists, data frames, and matrices. Next, move on to one of these neighbouring hubs:

- [dplyr Exercises in R](dplyr-Exercises-in-R.html) for tidyverse-style row and column selection with `filter()`, `select()`, and `slice()`.
- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) for using subsetting alongside `sapply()`, `lapply()`, and `vapply()`.
- [R Vectors](R-Vectors.html) for a deeper review of how indexing interacts with names, coercion, and recycling.
- [R Subsetting](R-Subsetting.html) for the one unifying rule across `[`, `[[`, `$`, and `@`.
