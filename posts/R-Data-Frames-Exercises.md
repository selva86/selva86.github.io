---
title: "Data Frame Exercises in R: 17 Real-World Practice Problems"
slug: "R-Data-Frames-Exercises"
description: "17 R data frame exercises with hidden solutions: create, subset, add columns, sort, dedupe, and merge using base R on mtcars, iris, airquality."
keywords: "r data frame exercises, data frame in r practice, base r data frame, subset data frame in r, merge data frames in r, sort data frame in r, factor column conversion"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Data Frames"
sidebar_order: 145
fr_parent: "R-Data-Frames.html"
auto_link_terms: "data frame exercises|data frame practice|r data frame exercises|exercises on data frames|practice data frames in r"
auto_link_case_sensitive: false
target_keyword: "data frame exercises in r"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Data Frame Exercises in R: 17 Real-World Practice Problems

<p class="lead">This page collects 17 carefully designed practice problems on R data frames, covering creation, inspection, subsetting, column manipulation, ordering, deduping, and merging. Every exercise lists the task, the exact expected output, and a hidden solution with an explanation of why it works. Work through them top to bottom or jump to the section that matches what you need to drill today.</p>

```r title="Run this once before any exercise"
# Every exercise here runs on base R. The datasets package below is
# loaded by default; the explicit call is a sanity check before you start.
library(datasets)
options(stringsAsFactors = FALSE)
```

## Section 1. Creating data frames (3 problems)

### Exercise 1.1: Build a small employees data frame from vectors

**Task:** A new HR onboarding team is putting together a master list of four employees. Create a data frame with columns `id` (101 to 104), `name`, `salary`, and `dept`, then save the result to `ex_1_1`. The columns should keep their natural types: integer, character, numeric, character.

**Expected result:**

```
   id  name salary  dept
1 101  Asha  58000    HR
2 102   Ben  64500   Eng
3 103 Carol  72000   Eng
4 104 Diego  51000 Sales
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- data.frame(
  id     = 101:104,
  name   = c("Asha", "Ben", "Carol", "Diego"),
  salary = c(58000, 64500, 72000, 51000),
  dept   = c("HR", "Eng", "Eng", "Sales")
)
ex_1_1
#>    id  name salary  dept
#> 1 101  Asha  58000    HR
#> 2 102   Ben  64500   Eng
#> 3 103 Carol  72000   Eng
#> 4 104 Diego  51000 Sales
```

**Explanation:** `data.frame()` takes equal-length vectors as named arguments and stacks them column-wise. Since R 4.0 character vectors stay as character by default; before that, `stringsAsFactors = TRUE` was the silent default and a long-standing source of subtle bugs. The integer sequence `101:104` keeps integer storage rather than being coerced to double, which matters if you later join on it.

</details>

### Exercise 1.2: Inspect column types of mtcars with sapply

**Task:** When you receive a data frame from an unfamiliar source the first sanity check is what every column actually stores. Run `sapply(mtcars, class)` to produce a named character vector listing the class of every column in `mtcars`, and save the result to `ex_1_2`. This is the kind of one-line audit you should run on every new frame.

**Expected result:**

```
      mpg       cyl      disp        hp      drat        wt      qsec
"numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric"
       vs        am      gear      carb
"numeric" "numeric" "numeric" "numeric"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- sapply(mtcars, class)
ex_1_2
#>       mpg       cyl      disp        hp      drat        wt      qsec
#> "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric"
#>        vs        am      gear      carb
#> "numeric" "numeric" "numeric" "numeric"
```

**Explanation:** A data frame is internally a list of equal-length columns, so `sapply()` walks each column and applies `class()`. The named character vector tells you immediately which columns are numeric, factor, character, or Date. For columns with multiple classes (such as POSIXct, POSIXt) prefer `vapply(mtcars, function(x) class(x)[1], character(1))` so the result stays a flat character vector instead of collapsing into a matrix.

</details>

### Exercise 1.3: Convert selected character columns to factor

**Task:** An analyst hands you a small product catalog with three character columns: `sku`, `category`, and `country`. Categories and countries repeat heavily, but each sku is a unique identifier. Convert ONLY `category` and `country` to factors using `lapply`, leave `sku` as character, and save the modified data frame to `ex_1_3`. Verify with `lapply(ex_1_3, class)`.

**Expected result:**

```
$sku
[1] "character"

$category
[1] "factor"

$country
[1] "factor"
```

**Difficulty:** Intermediate

```r
catalog <- data.frame(
  sku      = c("A-1001", "A-1002", "B-2001", "B-2002", "C-3001"),
  category = c("Shoes", "Shoes", "Bags", "Bags", "Shoes"),
  country  = c("IN", "US", "IN", "DE", "US")
)
```

```r title="Your turn"
ex_1_3 <- # your code here
lapply(ex_1_3, class)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- catalog
to_factor <- c("category", "country")
ex_1_3[to_factor] <- lapply(ex_1_3[to_factor], factor)

lapply(ex_1_3, class)
#> $sku
#> [1] "character"
#>
#> $category
#> [1] "factor"
#>
#> $country
#> [1] "factor"
```

**Explanation:** Wrapping a column subset in `lapply()` and reassigning back is the canonical base-R idiom for coercing several columns at once. Constructing the frame with `data.frame(..., stringsAsFactors = TRUE)` would also have converted `sku` and wasted memory on a factor with one level per row. For larger frames you can stay base-R with `Filter(is.character, df)` to discover candidate columns and then loop on the survivors.

</details>

## Section 2. Inspecting and accessing data (3 problems)

### Exercise 2.1: Extract the Sepal.Length column three ways

**Task:** Pulling a single column from a data frame is something you do constantly, and R offers three equivalent ways: dollar syntax, double brackets, and matrix-style indexing. Extract the `Sepal.Length` column from `iris` using all three methods, verify with `identical()` that they return the same numeric vector, and save the dollar-syntax result to `ex_2_1`.

**Expected result:**

```
[1] 5.1 4.9 4.7 4.6 5.0 5.4 4.6 5.0 4.4 4.9 5.4 4.8 4.8 4.3 5.8 5.7 5.4 5.1 5.7 5.1
[21] 5.4 5.1 4.6 5.1 4.8 5.0 5.0 5.2 5.2 4.7
... (120 more values)
[1] TRUE TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
c(identical(ex_2_1, iris[["Sepal.Length"]]),
  identical(ex_2_1, iris[, "Sepal.Length"]))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- iris$Sepal.Length

a <- iris$Sepal.Length
b <- iris[["Sepal.Length"]]
d <- iris[, "Sepal.Length"]
c(identical(a, b), identical(a, d))
#> [1] TRUE TRUE
```

**Explanation:** All three forms return the same atomic numeric vector for a single column. Dollar syntax `$` is shortest but performs partial matching on column names, which is a footgun inside scripts; `[[]]` and `[, ]` accept a column name as a string and pair cleanly with column names stored in variables. Use `[[]]` when the column name lives in a variable; pass `drop = FALSE` if you must keep the result as a one-column data frame instead of a vector.

</details>

### Exercise 2.2: Glue head and tail of iris into one 6-row frame

**Task:** A new data frame typically deserves a quick look at both ends before you decide how to handle it. Combine the first three and last three rows of `iris` into a single 6-row data frame using `rbind(head(iris, 3), tail(iris, 3))`, save the result to `ex_2_2`, and confirm the Species column shows both setosa and virginica appearing.

**Expected result:**

```
    Sepal.Length Sepal.Width Petal.Length Petal.Width    Species
1            5.1         3.5          1.4         0.2     setosa
2            4.9         3.0          1.4         0.2     setosa
3            4.7         3.2          1.3         0.2     setosa
148          6.5         3.0          5.2         2.0  virginica
149          6.2         3.4          5.4         2.3  virginica
150          5.9         3.0          5.1         1.8  virginica
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- rbind(head(iris, 3), tail(iris, 3))
ex_2_2
#>     Sepal.Length Sepal.Width Petal.Length Petal.Width    Species
#> 1            5.1         3.5          1.4         0.2     setosa
#> 2            4.9         3.0          1.4         0.2     setosa
#> 3            4.7         3.2          1.3         0.2     setosa
#> 148          6.5         3.0          5.2         2.0  virginica
#> 149          6.2         3.4          5.4         2.3  virginica
#> 150          5.9         3.0          5.1         1.8  virginica
```

**Explanation:** `head()` and `tail()` both preserve original row names, so the resulting `rbind` carries 1, 2, 3 and 148, 149, 150 in the row name slot. The Species column reveal makes it clear the rows are sorted by Species, a thing many EDA pipelines miss when they only call `head()` and assume the bottom of the frame looks the same. Treat this one-liner as a default sanity audit for any new data frame.

</details>

### Exercise 2.3: Count rows per Species with table

**Task:** For a quick group-size audit, `table()` on a single factor column gives you the per-level counts and respects the factor level ordering. Compute the row count per `Species` value in `iris` using `table(iris$Species)` and save the resulting `table` object to `ex_2_3` for later use in proportion calculations or a printed summary.

**Expected result:**

```
    setosa versicolor  virginica
        50         50         50
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- table(iris$Species)
ex_2_3
#>
#>     setosa versicolor  virginica
#>         50         50         50
```

**Explanation:** `table()` returns a `table` object (a thin wrapper over a named integer matrix) which prints as a named row of counts. Because Species is a factor with three levels, the counts respect the factor level order rather than alphabetical order or first-appearance order. To turn the result into a tidy data frame for plotting, wrap in `as.data.frame(table(...))`; to convert counts into proportions, wrap in `prop.table()`.

</details>

## Section 3. Subsetting rows and columns (3 problems)

### Exercise 3.1: Filter mtcars to fuel-efficient four-cylinder cars

**Task:** A fleet manager is hunting for compact economy cars in the `mtcars` catalog. Filter `mtcars` to rows where `mpg` is strictly greater than 25 AND `cyl` equals 4 using base-R logical indexing on the row dimension, and save the resulting subset to `ex_3_1`. Keep every column. Six rows should remain.

**Expected result:**

```
                mpg cyl  disp  hp drat    wt  qsec vs am gear carb
Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars[mtcars$mpg > 25 & mtcars$cyl == 4, ]
ex_3_1
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
```

**Explanation:** The bare-bracket `[rows, cols]` form takes a logical vector along the row axis. `mtcars$mpg > 25` evaluates to TRUE or FALSE per row, the `&` operator combines element-wise with the cylinder check, and the empty column slot keeps every column. Forgetting the trailing comma drops you to list-of-columns mode and silently returns a different shape, a classic R beginner trap to watch for.

</details>

### Exercise 3.2: Drop two specific columns from mtcars by name

**Task:** A risk model only consumes performance and engine metrics, so the analyst wants the `vs` and `am` columns thrown out. Drop `vs` and `am` from `mtcars` using `setdiff(names(mtcars), c("vs", "am"))` to pick the survivors, save the resulting nine-column data frame to `ex_3_2`, and confirm the column count with `ncol()`.

**Expected result:**

```
                mpg cyl disp  hp drat    wt  qsec gear carb
Mazda RX4      21.0   6  160 110 3.90 2.620 16.46    4    4
Mazda RX4 Wag  21.0   6  160 110 3.90 2.875 17.02    4    4
Datsun 710     22.8   4  108  93 3.85 2.320 18.61    4    1
... (29 more rows)
[1] 9
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ncol(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
keep <- setdiff(names(mtcars), c("vs", "am"))
ex_3_2 <- mtcars[, keep]
head(ex_3_2, 3)
#>                mpg cyl disp  hp drat    wt  qsec gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.320 18.61    4    1
ncol(ex_3_2)
#> [1] 9
```

**Explanation:** Negative indexing by column name does not exist in base R directly. You could write `mtcars[, -which(names(mtcars) %in% c("vs","am"))]` but it is noisy and breaks if a target name is missing. Using `setdiff()` on names is clearer and survives both reordering and missing keys gracefully. For a single drop, `mtcars$vs <- NULL` works too, but it mutates in place which is usually not what you want in an analysis pipeline.

</details>

### Exercise 3.3: subset() with select and a row condition

**Task:** The ozone team at an air-quality monitoring station needs to inspect only Ozone and Wind for May readings. Use `subset(airquality, Month == 5, select = c(Ozone, Wind))` to pull those two columns for May only, and save the result to `ex_3_3`. Note that `subset()` accepts unquoted column names through non-standard evaluation.

**Expected result:**

```
  Ozone Wind
1    41  7.4
2    36  8.0
3    12 12.6
4    18 11.5
5    NA 14.3
6    28 14.9
... (25 more rows)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
head(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- subset(airquality, Month == 5, select = c(Ozone, Wind))
head(ex_3_3)
#>   Ozone Wind
#> 1    41  7.4
#> 2    36  8.0
#> 3    12 12.6
#> 4    18 11.5
#> 5    NA 14.3
#> 6    28 14.9
```

**Explanation:** `subset()` uses non-standard evaluation so you can reference column names without quoting, which is great for interactive use and a trap inside functions (R CMD check complains about no visible binding). For programmatic filtering prefer `airquality[airquality$Month == 5, c("Ozone","Wind")]`. The behaviour around NA in the condition is identical to bracket subsetting: rows where the condition is NA are dropped, not silently kept.

</details>

## Section 4. Adding and modifying columns (3 problems)

### Exercise 4.1: Add a km-per-litre column to mtcars

**Task:** A marketing team preparing copy for an Indian audience needs fuel economy reported in km per litre rather than US mpg. Add a column `kpl` to `mtcars` equal to `mpg` times 0.425144 (the US mpg to km/L conversion factor), round to two decimal places, and save the augmented data frame to `ex_4_1`.

**Expected result:**

```
                   mpg cyl disp  hp drat    wt  qsec vs am gear carb  kpl
Mazda RX4         21.0   6  160 110 3.90 2.620 16.46  0  1    4    4 8.93
Mazda RX4 Wag     21.0   6  160 110 3.90 2.875 17.02  0  1    4    4 8.93
Datsun 710        22.8   4  108  93 3.85 2.320 18.61  1  1    4    1 9.69
... (29 more rows)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
head(ex_4_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mtcars
ex_4_1$kpl <- round(ex_4_1$mpg * 0.425144, 2)
head(ex_4_1, 3)
#>                   mpg cyl disp  hp drat    wt  qsec vs am gear carb  kpl
#> Mazda RX4        21.0   6  160 110 3.90 2.620 16.46  0  1    4    4 8.93
#> Mazda RX4 Wag    21.0   6  160 110 3.90 2.875 17.02  0  1    4    4 8.93
#> Datsun 710       22.8   4  108  93 3.85 2.320 18.61  1  1    4    1 9.69
```

**Explanation:** Assigning a vector to a new dollar-name slot is the simplest column-add path: R recycles the vector length and validates it matches `nrow()`. Doing this on a copy (`ex_4_1 <- mtcars`) keeps the original frame untouched, which matters in long notebooks where downstream cells may still rely on the base column set. As a functional alternative, `transform(mtcars, kpl = round(mpg * 0.425144, 2))` produces the same shape in one expression.

</details>

### Exercise 4.2: Bin weight into Light, Medium, Heavy with cut

**Task:** A fleet operations dashboard wants cars binned by curb weight: Light below 2.5, Medium between 2.5 and 3.5, Heavy above 3.5 (units: 1000 lbs). Add a factor column `weight_class` to `mtcars` using `cut()` with breaks `c(-Inf, 2.5, 3.5, Inf)` and labels `c("Light","Medium","Heavy")`, and save the updated frame to `ex_4_2`.

**Expected result:**

```
                   wt weight_class
Mazda RX4         2.620       Medium
Mazda RX4 Wag     2.875       Medium
Datsun 710        2.320        Light
Hornet 4 Drive    3.215       Medium
Hornet Sportabout 3.440       Medium
Duster 360        3.570        Heavy
... (26 more rows)

# table(ex_4_2$weight_class)
 Light Medium  Heavy
     8     12     12
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
table(ex_4_2$weight_class)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- mtcars
ex_4_2$weight_class <- cut(
  ex_4_2$wt,
  breaks = c(-Inf, 2.5, 3.5, Inf),
  labels = c("Light", "Medium", "Heavy")
)
head(ex_4_2[, c("wt", "weight_class")], 6)
#>                       wt weight_class
#> Mazda RX4         2.620       Medium
#> Mazda RX4 Wag     2.875       Medium
#> Datsun 710        2.320        Light
#> Hornet 4 Drive    3.215       Medium
#> Hornet Sportabout 3.440       Medium
#> Duster 360        3.570        Heavy
table(ex_4_2$weight_class)
#>
#>  Light Medium  Heavy
#>      8     12     12
```

**Explanation:** `cut()` accepts breakpoints as a numeric vector and returns an ordered factor with one level per interval. Using `-Inf` and `Inf` as the outer bounds is cleaner than `min(wt) - 1` and `max(wt) + 1` and immune to new data falling outside the historical range. The default is right-closed intervals; pass `right = FALSE` if your domain prefers left-closed bins (financial price buckets and tax brackets typically want this).

</details>

### Exercise 4.3: Median-impute NA values in airquality$Ozone

**Task:** The atmospheric team cannot tolerate NAs in their daily Ozone series and asks for median imputation as a quick hold-the-line fill before a more careful model runs overnight. Replace every NA in `airquality$Ozone` with the median of the non-NA Ozone values and save the updated frame to `ex_4_3`. Confirm `sum(is.na(ex_4_3$Ozone))` is zero.

**Expected result:**

```
  Ozone Solar.R Wind Temp Month Day
1    41     190  7.4   67     5   1
2    36     118  8.0   72     5   2
3    12     149 12.6   74     5   3
4    18     313 11.5   62     5   4
5    32      NA 14.3   56     5   5
6    28      NA 14.9   66     5   6
# sum(is.na(ex_4_3$Ozone))
[1] 0
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
sum(is.na(ex_4_3$Ozone))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- airquality
ozone_median <- median(ex_4_3$Ozone, na.rm = TRUE)
ex_4_3$Ozone[is.na(ex_4_3$Ozone)] <- ozone_median

head(ex_4_3)
#>   Ozone Solar.R Wind Temp Month Day
#> 1    41     190  7.4   67     5   1
#> 2    36     118  8.0   72     5   2
#> 3    12     149 12.6   74     5   3
#> 4    18     313 11.5   62     5   4
#> 5    32      NA 14.3   56     5   5
#> 6    28      NA 14.9   66     5   6
sum(is.na(ex_4_3$Ozone))
#> [1] 0
```

**Explanation:** The trick is the targeted left-hand side: `ex_4_3$Ozone[is.na(...)] <- value` writes only into the NA positions and leaves the observed values untouched. Always pass `na.rm = TRUE` to `median()` or you compute NA and silently overwrite every reading with NA. Median imputation is a defensible quick fix; for a real air-quality pipeline you would want temporal interpolation or a model-based imputation that respects seasonality and weather covariates.

</details>

## Section 5. Sorting, ordering, and deduping (3 problems)

### Exercise 5.1: Sort mtcars by mpg descending then hp ascending

**Task:** An auction site wants to present its cars by best fuel economy first, breaking ties by lowest horsepower. Reorder `mtcars` rows by `mpg` descending, then by `hp` ascending using `order(-mpg, hp)` inside row brackets, and save the sorted data frame to `ex_5_1`. Inspect the first six rows to verify the sort.

**Expected result:**

```
                mpg cyl  disp  hp drat    wt  qsec vs am gear carb
Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
head(ex_5_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- mtcars[order(-mtcars$mpg, mtcars$hp), ]
head(ex_5_1)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  0  1    5    2
```

**Explanation:** `order()` returns the row indices that would sort the inputs; passing them as the row argument to `[ , ]` reorders the data frame. The leading minus negates numeric vectors to give descending order. For character or factor columns where minus does not work, use `order(x, decreasing = TRUE)` instead, but note that flag applies to ALL keys, so for mixed-direction sorts on non-numeric keys, convert with `-as.integer(factor)` or use `dplyr::arrange()` with `desc()`.

</details>

### Exercise 5.2: Find unique gear and cylinder combinations

**Task:** A motor-show planner is grouping cars into display lanes based on the gear-cylinder combination they share. Use `unique()` on the two-column subset `mtcars[, c("gear","cyl")]` to extract every distinct gear-cylinder pair present in the data, sort the result by gear then cyl for readability, and save it to `ex_5_2`.

**Expected result:**

```
                   gear cyl
Toyota Corona         3   4
Hornet 4 Drive        3   6
Hornet Sportabout     3   8
Datsun 710            4   4
Mazda RX4             4   6
Porsche 914-2         5   4
Ferrari Dino          5   6
Ford Pantera L        5   8
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
combos <- unique(mtcars[, c("gear", "cyl")])
ex_5_2 <- combos[order(combos$gear, combos$cyl), ]
ex_5_2
#>                    gear cyl
#> Toyota Corona         3   4
#> Hornet 4 Drive        3   6
#> Hornet Sportabout     3   8
#> Datsun 710            4   4
#> Mazda RX4             4   6
#> Porsche 914-2         5   4
#> Ferrari Dino          5   6
#> Ford Pantera L        5   8
```

**Explanation:** `unique()` on a data frame returns first occurrences as full rows, keeping the original row names so you can trace each pair back to the car that introduced it. Eight pairs out of a possible 12 (gear in 3-5, cyl in 4-8) tells you something structural: every gear count appears with every cylinder count except 3-gear-and-4-cyl is missing. For deduping by a key in much larger frames, `df[!duplicated(df[, keys]), ]` is more memory-efficient than `unique()` on a wide frame.

</details>

### Exercise 5.3: Flag duplicate audit-log rows without dropping them

**Task:** Audit logs sometimes contain accidental duplicates from client retries. Given the inline frame `audit` below, identify which rows duplicate an earlier row using `duplicated()`, add a logical column `is_dup` that captures the flag, and save the augmented frame to `ex_5_3`. Do not drop the duplicates: the auditor wants to see them in place.

**Expected result:**

```
     ts user action is_dup
1 09:01  ava  login  FALSE
2 09:02  ben   view  FALSE
3 09:01  ava  login   TRUE
4 09:03  ava   edit  FALSE
5 09:02  ben   view   TRUE
6 09:04 carl delete  FALSE
```

**Difficulty:** Advanced

```r
audit <- data.frame(
  ts     = c("09:01", "09:02", "09:01", "09:03", "09:02", "09:04"),
  user   = c("ava", "ben", "ava", "ava", "ben", "carl"),
  action = c("login", "view", "login", "edit", "view", "delete")
)
```

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- audit
ex_5_3$is_dup <- duplicated(audit)
ex_5_3
#>      ts user action is_dup
#> 1 09:01  ava  login  FALSE
#> 2 09:02  ben   view  FALSE
#> 3 09:01  ava  login   TRUE
#> 4 09:03  ava   edit  FALSE
#> 5 09:02  ben   view   TRUE
#> 6 09:04 carl delete  FALSE
```

**Explanation:** `duplicated()` returns FALSE for the first occurrence of each unique row and TRUE for every later copy, so it preserves the original row count. If you want both copies flagged (so the original also reads TRUE), call `duplicated(audit) | duplicated(audit, fromLast = TRUE)`. To drop duplicates outright use `audit[!duplicated(audit), ]`. Use `duplicated(audit[, c("user","action")])` to ignore noisy columns like millisecond timestamps when judging logical equivalence between rows.

</details>

## Section 6. Combining and merging frames (2 problems)

### Exercise 6.1: rbind two frames with reordered columns

**Task:** Two regional managers email you their Q1 numbers in different column orders by accident. Construct `q1_west` and `q1_east` with the same three columns in different orders (`region`, `product`, `revenue` versus `product`, `revenue`, `region`), combine them with `rbind()` which aligns by name, and save the stacked six-row result to `ex_6_1`.

**Expected result:**

```
  region product revenue
1   West       A    1200
2   West       B     850
3   West       C    2100
4   East       A     900
5   East       B    1750
6   East       C    1100
```

**Difficulty:** Intermediate

```r
q1_west <- data.frame(
  region  = c("West", "West", "West"),
  product = c("A", "B", "C"),
  revenue = c(1200, 850, 2100)
)
q1_east <- data.frame(
  product = c("A", "B", "C"),
  revenue = c(900, 1750, 1100),
  region  = c("East", "East", "East")
)
```

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- rbind(q1_west, q1_east)
ex_6_1
#>   region product revenue
#> 1   West       A    1200
#> 2   West       B     850
#> 3   West       C    2100
#> 4   East       A     900
#> 5   East       B    1750
#> 6   East       C    1100
```

**Explanation:** `rbind.data.frame` matches columns by name rather than position, so the East frame's flipped column order is harmless as long as the names and types match. If a column exists in one frame but not the other, `rbind()` errors loudly rather than silently filling NAs. For unioning frames with mismatched columns (where you want NA fill for missing columns), use `dplyr::bind_rows()` or `data.table::rbindlist(fill = TRUE)` instead of base `rbind`.

</details>

### Exercise 6.2: Inner-join orders to customers with merge

**Task:** A retail analytics team needs a flat orders-with-customer table built from two normalized tables. Given inline frames `orders` and `customers` below (with `customer_id` as the key in both), produce an inner join using `merge(orders, customers, by = "customer_id")` and save the joined four-row result to `ex_6_2`. Order 1005 should disappear because customer 4 is unknown.

**Expected result:**

```
  customer_id order_id amount  name   tier
1           1     1001    120  Asha   Gold
2           1     1003    200  Asha   Gold
3           2     1002     75   Ben Silver
4           3     1004     50 Carol   Gold
```

**Difficulty:** Advanced

```r
orders <- data.frame(
  order_id    = 1001:1005,
  customer_id = c(1, 2, 1, 3, 4),
  amount      = c(120, 75, 200, 50, 320)
)
customers <- data.frame(
  customer_id = c(1, 2, 3),
  name        = c("Asha", "Ben", "Carol"),
  tier        = c("Gold", "Silver", "Gold")
)
```

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- merge(orders, customers, by = "customer_id")
ex_6_2
#>   customer_id order_id amount  name   tier
#> 1           1     1001    120  Asha   Gold
#> 2           1     1003    200  Asha   Gold
#> 3           2     1002     75   Ben Silver
#> 4           3     1004     50 Carol   Gold
```

**Explanation:** `merge()` defaults to an inner join, returning only rows where the key matches in both inputs. Order 1005 for customer 4 disappears because that customer is missing from the `customers` table. Switch to `all.x = TRUE` for a left join (NA columns from the right side appear for unmatched orders), or `all = TRUE` for a full outer join. For million-row frames, `data.table` or `dplyr::inner_join()` are substantially faster than base `merge`, but the join semantics are identical.

</details>

## What to do next

- Practice manipulating data frames with [dplyr Exercises in R](dplyr-Exercises-in-R.html) once you are comfortable with the base-R idioms above.
- Reshape wide and long data with [tidyr Exercises in R](tidyr-Exercises-in-R.html) for pivoting and separating columns.
- Drill the import and export side with [Read CSV in R Exercises](Read-CSV-in-R-Exercises.html).
- Return to the parent lesson at [R Data Frames](R-Data-Frames.html) for the full reference on creation, indexing, and column operations.
