---
title: "Missing Data in R Exercises: 18 Real-World NA Practice Problems"
slug: "Missing-Data-in-R-Exercises"
description: "Practise missing data handling in R with 18 NA detection, removal, and imputation problems and worked solutions, from is.na audits to grouped imputation."
keywords: "missing data exercises R, NA exercises R, is.na exercises, complete.cases practice, na.omit exercises, imputation exercises R, missing value practice problems, NA detection R"
mathjax: false
webr: true
date: "2026-05-13"
curriculum_id: "E2.6"
post_type: "EX"
sidebar_title: "Missing Data (18 problems)"
sidebar_order: 175
fr_parent: "Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html"
auto_link_terms: "missing data exercises|NA exercises|is.na exercises|missing value practice|NA detection exercises"
auto_link_case_sensitive: false
target_keyword: "missing data exercises R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Missing Data in R Exercises: 18 Real-World NA Practice Problems

<p class="lead">Eighteen hands-on exercises drill NA detection, removal, and imputation in R, from base <code>is.na()</code> audits to grouped median imputation and end-to-end audit pipelines. Solutions stay hidden until you click reveal so you actually try each one first.</p>

## How to use this hub

Read each task, type your attempt into the "Your turn" box, then click reveal to compare. Every exercise saves its answer into a variable named `ex_<section>_<number>` so you can inspect intermediate results without overwriting the source datasets. All code runs in one shared session, so the setup block must run once before any exercise.

The exercises lean on the built-in `airquality` dataset (153 rows of New York weather and air-quality measurements with real NAs in `Ozone` and `Solar.R`), plus a small inline `clinic` tibble for grouped and sentinel-value problems. If `is.na()`, `complete.cases()`, and `na.omit()` are unfamiliar, skim the parent [Missing Values in R tutorial](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html) first.

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)

# airquality has 44 NAs: 37 in Ozone, 7 in Solar.R
data(airquality)

# clinic: small inline tibble used for grouped/sentinel exercises
clinic <- tibble(
  patient_id  = 1:10,
  arm         = c("drug", "drug", "drug", "drug", "drug",
                  "placebo", "placebo", "placebo", "placebo", "placebo"),
  bp_systolic = c(132, NA, 128, 140, 135, 145, NA, 150, NA, 138),
  weight_kg   = c(72, 80, NA, 68, 75, 90, 85, NA, 78, 82),
  visit_score = c(8, 7, 9, NA, 8, 6, 7, 0, 6, 7),
  diagnosis   = c("HT", NA, "HT", "HT", NA, "HT", "HT", "HT", "HT", NA)
)

clinic
#> # A tibble: 10 x 6
#>    patient_id arm     bp_systolic weight_kg visit_score diagnosis
#>         <int> <chr>         <dbl>     <dbl>       <dbl> <chr>
#>  1          1 drug            132        72           8 HT
#>  2          2 drug             NA        80           7 NA
#>  3          3 drug            128        NA           9 HT
#>  4          4 drug            140        68          NA HT
#>  5          5 drug            135        75           8 NA
#>  6          6 placebo         145        90           6 HT
#>  7          7 placebo          NA        85           7 HT
#>  8          8 placebo         150        NA           0 HT
#>  9          9 placebo          NA        78           6 HT
#> 10         10 placebo         138        82           7 NA
```

The `visit_score` of `0` for patient 8 is a deliberate sentinel: in this fictional protocol, `0` is the code clinicians enter when the visit was missed but the row still had to be created. Exercise 5.3 asks you to recover that as `NA` before any summary touches it.

## Section 1. Detect and quantify missingness (3 problems)

### Exercise 1.1: Compute the total NA count across airquality

**Task:** An onboarding analyst auditing the `airquality` dataset wants a single headline number for the report: how many missing values does the entire frame contain across every column? Use `is.na()` plus `sum()` on the whole frame and save the integer to `ex_1_1`.

**Expected result:**

```
#> ex_1_1
#> [1] 44
```

**Difficulty:** Beginner

[HINTS]
A logical test that marks each cell as missing or not can be totalled, since a TRUE counts as one.
Wrap the whole data frame in is.na() and pass that result straight into sum().

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- sum(is.na(airquality))
ex_1_1
#> [1] 44
```

**Explanation:** `is.na()` returns a logical matrix the same shape as `airquality`, and `sum()` coerces `TRUE` to `1` and `FALSE` to `0`. The total is 44 missing cells out of 153 rows by 6 columns. A common slip is writing `sum(airquality == NA)`, which silently returns `NA` because any comparison with `NA` propagates. Always use `is.na()` for NA tests, never `==`.

</details>

### Exercise 1.2: Count NAs in every column with colSums

**Task:** Before deciding which columns to impute and which to drop, the analyst needs a per-column NA count for `airquality`. Use `is.na()` combined with `colSums()` to produce a named integer vector and save it to `ex_1_2`.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Difficulty:** Beginner

[HINTS]
You want one count for each column rather than a single grand total, so collapse the logical grid down its columns.
Feed is.na(airquality) into colSums() to get a named integer vector.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- colSums(is.na(airquality))
ex_1_2
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Explanation:** `is.na(airquality)` returns a 153 by 6 logical matrix, and `colSums()` sums each column treating `TRUE` as `1`. The result keeps the column names automatically, which is why this idiom is preferred over `sapply(airquality, function(x) sum(is.na(x)))`. With only `Ozone` and `Solar.R` carrying any NAs, you can move straight to imputation on those two and leave the rest alone.

</details>

### Exercise 1.3: Report the percentage missing per column

**Task:** A reporting analyst wants the per-column NA count expressed as a percentage of total rows, rounded to two decimals, so the cleaning summary slide reads cleanly. Build a named numeric vector of percentages for every column of `airquality` and save it to `ex_1_3`.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>   24.18    4.58    0.00    0.00    0.00    0.00
```

**Difficulty:** Intermediate

[HINTS]
The average of a column of TRUE and FALSE values is already the missing rate expressed as a proportion.
Apply colMeans() to the logical matrix, multiply by 100, and round() to 2 decimals.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- round(colMeans(is.na(airquality)) * 100, 2)
ex_1_3
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>   24.18    4.58    0.00    0.00    0.00    0.00
```

**Explanation:** `colMeans()` on a logical matrix returns the proportion of `TRUE` per column, which is exactly the NA rate. Multiplying by 100 converts to a percentage, and `round(..., 2)` formats it for reporting. The alternative `colSums(is.na(airquality)) / nrow(airquality) * 100` is equivalent but more keystrokes. At 24% missing, `Ozone` is on the borderline where many practitioners switch from imputation to a "missing as feature" flag.

</details>

## Section 2. Locate and pattern-find NAs (3 problems)

### Exercise 2.1: Find row indices that contain any NA

**Task:** A data engineer building a quarantine pipeline needs the row positions in `airquality` that have at least one NA anywhere in the row, so downstream consumers can choose to skip or repair them. Return an integer vector of those row indices and save it to `ex_2_1`.

**Expected result:**

```
#>  [1]   5   6  10  11  25  26  27  32  33  34  35  36  37  39  42  43  45  46  52
#> [20]  53  54  55  56  57  58  59  60  61  65  72  75  83  84 102 103 111
#> ... (some indices omitted)
#> length(ex_2_1)
#> [1] 42
```

**Difficulty:** Intermediate

[HINTS]
First flag which rows are fully complete, then invert that flag and turn the surviving positions into numbers.
Negate complete.cases(airquality) and pass it to which().

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
length(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- which(!complete.cases(airquality))
length(ex_2_1)
#> [1] 42
head(ex_2_1, 10)
#> [1]  5  6 10 11 25 26 27 32 33 34
```

**Explanation:** `complete.cases()` returns `TRUE` for rows with no NAs, so `!complete.cases()` flips the test and `which()` converts the logical vector to positional indices. The 42 incomplete rows include 2 rows where BOTH `Ozone` and `Solar.R` are missing (which is why the total NA count was 44 but only 42 distinct rows are affected). For just dropping incomplete rows use `na.omit()`; for collecting them for inspection, `which(!complete.cases(...))` is the right tool.

</details>

### Exercise 2.2: Find rows where Ozone is missing but Solar.R is not

**Task:** A climatologist wants to study days where the ozone sensor failed but the solar radiation sensor still recorded, since those rows are the best candidates for model-based imputation of `Ozone` from `Solar.R`. Subset `airquality` to those rows and save the resulting data frame to `ex_2_2`.

**Expected result:**

```
#> # First few rows of ex_2_2
#>     Ozone Solar.R Wind Temp Month Day
#> 5      NA      NA 14.3   56     5   5
#> 10     NA     194  8.6   69     5  10
#> 25     NA      66 16.6   57     5  25
#> ...
#> nrow(ex_2_2)
#> [1] 35
```

**Difficulty:** Intermediate

[HINTS]
Combine two separate missingness tests so both must hold at once, then use that to pick rows.
Subset airquality with is.na(airquality$Ozone) & !is.na(airquality$Solar.R) in the row slot of the [ , ] brackets.

```r title="Your turn"
ex_2_2 <- # your code here
nrow(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- airquality[is.na(airquality$Ozone) & !is.na(airquality$Solar.R), ]
nrow(ex_2_2)
#> [1] 35
head(ex_2_2, 3)
#>    Ozone Solar.R Wind Temp Month Day
#> 10    NA     194  8.6   69     5  10
#> 25    NA      66 16.6   57     5  25
#> 26    NA     266 14.9   58     5  26
```

**Explanation:** The two NA conditions are combined with `&`, which keeps only rows where the first is `TRUE` and the second is `TRUE`. Beginners often try `airquality$Ozone == NA`, which always returns `NA` and therefore filters nothing. The dplyr equivalent reads more naturally: `filter(airquality, is.na(Ozone) & !is.na(Solar.R))`. Of the 37 `Ozone` NAs, 35 still have a usable `Solar.R` reading, which is a strong basis for regression-based imputation.

</details>

### Exercise 2.3: Build a missingness flag matrix

**Task:** Before fitting a missing-not-at-random model, a statistician wants a logical matrix the same shape as `airquality` where every cell is `TRUE` if the original cell was NA. This shadow matrix becomes a feature set in some downstream models. Produce it and save to `ex_2_3`.

**Expected result:**

```
#>      Ozone Solar.R  Wind  Temp Month   Day
#> [1,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [2,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [3,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [4,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [5,]  TRUE    TRUE FALSE FALSE FALSE FALSE
#> ... 148 more rows
#> dim(ex_2_3)
#> [1] 153   6
#> sum(ex_2_3)
#> [1] 44
```

**Difficulty:** Advanced

[HINTS]
A whole-frame missingness test already returns something the same shape as the original data.
Call is.na() on the entire airquality data frame and keep the logical matrix it returns.

```r title="Your turn"
ex_2_3 <- # your code here
dim(ex_2_3)
sum(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- is.na(airquality)
dim(ex_2_3)
#> [1] 153   6
sum(ex_2_3)
#> [1] 44
head(ex_2_3, 5)
#>      Ozone Solar.R  Wind  Temp Month   Day
#> [1,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [2,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [3,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [4,] FALSE   FALSE FALSE FALSE FALSE FALSE
#> [5,]  TRUE    TRUE FALSE FALSE FALSE FALSE
```

**Explanation:** Applied to a data frame, `is.na()` returns a logical matrix preserving dimensions and column names. This shadow matrix has many uses: bind it as suffixed columns (`Ozone_was_na`) to enable a "missingness indicator" feature, or pass it to imputation packages that need the original mask. Note that `sum(ex_2_3)` recovers the headline NA count from Exercise 1.1: the two views are consistent.

</details>

## Section 3. Remove missing data safely (3 problems)

### Exercise 3.1: Drop every row with any NA using na.omit

**Task:** A junior analyst preparing data for a linear model that cannot tolerate NAs needs a row-complete version of `airquality`. Use `na.omit()` to drop any row containing at least one NA in any column, preserving column order, and save the cleaned frame to `ex_3_1`.

**Expected result:**

```
#> head(ex_3_1)
#>    Ozone Solar.R Wind Temp Month Day
#> 1     41     190  7.4   67     5   1
#> 2     36     118  8.0   72     5   2
#> 3     12     149 12.6   74     5   3
#> 4     18     313 11.5   62     5   4
#> 7     23     299  8.6   65     5   7
#> 8     19      99 13.8   59     5   8
#> nrow(ex_3_1)
#> [1] 111
```

**Difficulty:** Beginner

[HINTS]
One base function removes every row that is not fully complete in a single step.
Pass airquality straight into na.omit().

```r title="Your turn"
ex_3_1 <- # your code here
nrow(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- na.omit(airquality)
nrow(ex_3_1)
#> [1] 111
```

**Explanation:** `na.omit()` deletes any row with at least one NA, attaches a `na.action` attribute listing the dropped row numbers, and otherwise leaves the frame untouched. Going from 153 to 111 rows is a 27% loss, which is steep, so this is only safe when downstream models genuinely cannot handle NAs and the missingness is plausibly random. For column-targeted dropping, prefer `tidyr::drop_na(col1, col2)` (Exercise 3.2). To recover the dropped row indices, inspect `attr(ex_3_1, "na.action")`.

</details>

### Exercise 3.2: Drop rows only when specific columns are missing

**Task:** A retailer fitting a model that needs `Ozone` and `Wind` but is fine with NAs in `Solar.R` wants to drop rows only where `Ozone` is missing, keeping every row that has an Ozone value even if `Solar.R` is NA. Use `tidyr::drop_na()` on the `Ozone` column and save to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 116 x 6
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <int>   <int> <dbl> <int> <int> <int>
#>  1    41     190   7.4    67     5     1
#>  2    36     118   8      72     5     2
#>  3    12     149  12.6    74     5     3
#> ... 113 more rows
#> nrow(ex_3_2)
#> [1] 116
#> sum(is.na(ex_3_2$Solar.R))
#> [1] 5
```

**Difficulty:** Intermediate

[HINTS]
You want to target a single named column for dropping, not every column at once.
Use drop_na() with Ozone passed as its argument.

```r title="Your turn"
ex_3_2 <- # your code here
nrow(ex_3_2)
sum(is.na(ex_3_2$Solar.R))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- airquality |> drop_na(Ozone)
nrow(ex_3_2)
#> [1] 116
sum(is.na(ex_3_2$Solar.R))
#> [1] 5
```

**Explanation:** `drop_na(Ozone)` removes only the 37 rows where `Ozone` is `NA`, leaving rows with other NAs intact. The 5 remaining `Solar.R` NAs prove that NAs in other columns survived. Bare `drop_na()` with no arguments is equivalent to `na.omit()` and would drop 42 rows. The named-column form is almost always what you want, since it lets you keep partial information for variables you do not need in this model.

</details>

### Exercise 3.3: Keep rows only where Wind is non-missing

**Task:** Imagine `Wind` is your model's response variable, so rows with missing `Wind` are useless, but partial predictors are fine. Filter `airquality` to keep only rows where `Wind` is NOT NA (in this dataset all 153 rows qualify, so the result equals the input) and use `dplyr::filter()` with `!is.na()`. Save to `ex_3_3` and report the row count.

**Expected result:**

```
#> # A tibble: 153 x 6
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <int>   <int> <dbl> <int> <int> <int>
#>  1    41     190   7.4    67     5     1
#>  2    36     118   8      72     5     2
#> ... 151 more rows
#> nrow(ex_3_3)
#> [1] 153
```

**Difficulty:** Advanced

[HINTS]
Keep rows by stating the condition they must satisfy rather than the one that disqualifies them.
Use filter() with the condition !is.na(Wind).

```r title="Your turn"
ex_3_3 <- # your code here
nrow(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- airquality |> filter(!is.na(Wind))
nrow(ex_3_3)
#> [1] 153
```

**Explanation:** Even when no rows are dropped, this filter belongs in the pipeline as a defensive guard. If a future data feed introduces NAs in `Wind`, the filter quietly removes them rather than letting them propagate into the model fit (where they would either error or, worse, silently bias the result). The idiom `filter(!is.na(col))` is preferred over `filter(col != NA)` because the latter is always `NA` and removes every row. Defensive code earns its keep on data drift.

</details>

## Section 4. Simple imputation (4 problems)

### Exercise 4.1: Mean-impute Ozone

**Task:** A first-pass workflow needs `Ozone` to be NA-free so a downstream linear regression runs, accepting the bias that single-value imputation introduces. Replace every NA in `airquality$Ozone` with the column mean (rounded to 2 decimals) using base R indexing and save the patched vector (not the whole frame) to `ex_4_1`.

**Expected result:**

```
#> head(ex_4_1, 10)
#>  [1] 41.00 36.00 12.00 18.00 42.13 28.00 23.00 19.00  8.00 42.13
#> any(is.na(ex_4_1))
#> [1] FALSE
#> length(ex_4_1)
#> [1] 153
```

**Difficulty:** Beginner

[HINTS]
Overwrite only the missing slots of the vector by selecting exactly those positions on the left of an assignment.
Index the vector with is.na() on the left side and assign round(mean(..., na.rm = TRUE), 2).

```r title="Your turn"
ex_4_1 <- # your code here
head(ex_4_1, 10)
any(is.na(ex_4_1))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- airquality$Ozone
ex_4_1[is.na(ex_4_1)] <- round(mean(ex_4_1, na.rm = TRUE), 2)
head(ex_4_1, 10)
#>  [1] 41.00 36.00 12.00 18.00 42.13 28.00 23.00 19.00  8.00 42.13
any(is.na(ex_4_1))
#> [1] FALSE
```

**Explanation:** Logical indexing on the left of `<-` overwrites only the positions that satisfy the condition. `na.rm = TRUE` is mandatory: without it `mean()` returns `NA` and you replace NAs with NAs. Mean imputation shrinks the variable's variance and pulls correlations toward zero, so it is acceptable as a quick fix but rarely as a final strategy. Note we returned the vector, not the frame, so the source `airquality` is untouched.

</details>

### Exercise 4.2: Median-impute Solar.R for robustness

**Task:** Because solar radiation is right-skewed and has a few very high readings, the team prefers the median over the mean to avoid pulling imputed values upward. Replace the 7 NAs in `airquality$Solar.R` with the column median, keep the original 153-row length, and save the imputed numeric vector to `ex_4_2`.

**Expected result:**

```
#> sum(is.na(ex_4_2))
#> [1] 0
#> median(ex_4_2)
#> [1] 205
#> length(ex_4_2)
#> [1] 153
```

**Difficulty:** Intermediate

[HINTS]
Fill the gaps with a center value that resists skew, touching only the missing positions.
Assign median(..., na.rm = TRUE) into the slots picked out by is.na().

```r title="Your turn"
ex_4_2 <- # your code here
sum(is.na(ex_4_2))
median(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- airquality$Solar.R
ex_4_2[is.na(ex_4_2)] <- median(ex_4_2, na.rm = TRUE)
sum(is.na(ex_4_2))
#> [1] 0
median(ex_4_2)
#> [1] 205
```

**Explanation:** The median is unaffected by extreme values, which is the right call when the distribution is skewed or has heavy tails. Note that imputing with the median 7 times will slightly bias future medians toward the original median (since you now have 7 extra copies of it), so downstream variance estimators should account for the imputation. For production, multiple imputation packages like `mice` produce several plausible imputations and pool the analyses to recover honest standard errors.

</details>

### Exercise 4.3: Mode-impute the diagnosis column

**Task:** For the `clinic$diagnosis` character column, 3 patients have NA. Best practice is mode imputation: replace NAs with the most frequent non-NA category. Compute the mode of `diagnosis` and use it to fill the NAs, returning the fully populated character vector saved to `ex_4_3`.

**Expected result:**

```
#> ex_4_3
#>  [1] "HT" "HT" "HT" "HT" "HT" "HT" "HT" "HT" "HT" "HT"
#> sum(is.na(ex_4_3))
#> [1] 0
```

**Difficulty:** Intermediate

[HINTS]
There is no ready-made statistical-mode function, so build the most-frequent category from a frequency count.
Take names(sort(table(clinic$diagnosis), decreasing = TRUE))[1] and assign it into the is.na() slots.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
sum(is.na(ex_4_3))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mode_val <- names(sort(table(clinic$diagnosis), decreasing = TRUE))[1]
ex_4_3 <- clinic$diagnosis
ex_4_3[is.na(ex_4_3)] <- mode_val
ex_4_3
#>  [1] "HT" "HT" "HT" "HT" "HT" "HT" "HT" "HT" "HT" "HT"
sum(is.na(ex_4_3))
#> [1] 0
```

**Explanation:** Base R has no built-in `mode()` for the statistical mode (the function named `mode()` returns storage type), so the idiom is `names(sort(table(x), decreasing = TRUE))[1]`. `table()` excludes NAs by default, which is exactly what you want here. Mode imputation underestimates the rare categories' frequencies, so for low-cardinality vars consider a "Missing" explicit level instead, especially when missingness itself carries signal.

</details>

### Exercise 4.4: Forward-fill Ozone within each month

**Task:** A time-series convention for sensor data is to carry the last observed value forward until a new reading arrives. Use `tidyr::fill()` to forward-fill NAs in `airquality$Ozone` within each `Month`, so a missing day inherits the previous day's Ozone reading from the same month. Save the result to `ex_4_4` as a tibble.

**Expected result:**

```
#> ex_4_4 |> filter(Month == 5) |> head(10)
#> # A tibble: 10 x 6
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <int>   <int> <dbl> <int> <int> <int>
#>  1    41     190   7.4    67     5     1
#>  2    36     118   8      72     5     2
#>  3    12     149  12.6    74     5     3
#>  4    18     313  11.5    62     5     4
#>  5    18      NA  14.3    56     5     5
#>  6    18      NA  14.9    66     5     6
#>  7    23     299   8.6    65     5     7
#>  8    19      99  13.8    59     5     8
#>  9     8      19  20.1    61     5     9
#> 10     8     194   8.6    69     5    10
```

**Difficulty:** Advanced

[HINTS]
Carry each last seen value forward into the gaps, but keep one month from bleeding into the next.
After group_by(Month), call fill(Ozone, .direction = "down") and then ungroup().

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4 |> filter(Month == 5) |> head(10)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- airquality |>
  group_by(Month) |>
  fill(Ozone, .direction = "down") |>
  ungroup()

ex_4_4 |> filter(Month == 5) |> head(10)
#> # A tibble: 10 x 6
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <int>   <int> <dbl> <int> <int> <int>
#>  1    41     190   7.4    67     5     1
#>  2    36     118   8      72     5     2
#>  3    12     149  12.6    74     5     3
#>  4    18     313  11.5    62     5     4
#>  5    18      NA  14.3    56     5     5
#>  6    18      NA  14.9    66     5     6
#>  7    23     299   8.6    65     5     7
```

**Explanation:** `fill(.direction = "down")` carries the last non-NA value forward; `"up"` walks backward, and `"downup"` does both. Grouping by `Month` prevents May's last value from leaking into June. This last-observation-carried-forward (LOCF) is standard in clinical trials and sensor pipelines but biases analyses when values trend (since a long missing run inherits a stale value). For trended series, linear interpolation (`zoo::na.approx`) is usually fairer.

</details>

## Section 5. Grouped and conditional imputation (3 problems)

### Exercise 5.1: Impute Ozone with the per-month median

**Task:** A more honest single-value strategy is to impute `Ozone` NAs with the median for that observation's month, since ozone has a strong seasonal cycle and the May median (around 11) is very different from August's (around 39). Add an imputed `Ozone` column on top of the existing structure of `airquality`, computed per `Month`, and save to `ex_5_1`.

**Expected result:**

```
#> ex_5_1 |> group_by(Month) |> summarise(median_ozone = median(Ozone))
#> # A tibble: 5 x 2
#>   Month median_ozone
#>   <int>        <dbl>
#> 1     5         11
#> 2     6         20.5
#> 3     7         60
#> 4     8         39.5
#> 5     9         23
#> sum(is.na(ex_5_1$Ozone))
#> [1] 0
```

**Difficulty:** Intermediate

[HINTS]
Compute the replacement separately within each month so the seasonal differences survive.
Inside group_by(Month) |> mutate(), swap NAs using ifelse(is.na(Ozone), median(Ozone, na.rm = TRUE), Ozone).

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1 |> group_by(Month) |> summarise(median_ozone = median(Ozone))
sum(is.na(ex_5_1$Ozone))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- airquality |>
  group_by(Month) |>
  mutate(Ozone = ifelse(is.na(Ozone),
                        median(Ozone, na.rm = TRUE),
                        Ozone)) |>
  ungroup()

ex_5_1 |> group_by(Month) |> summarise(median_ozone = median(Ozone))
#> # A tibble: 5 x 2
#>   Month median_ozone
#>   <int>        <dbl>
#> 1     5         11
#> 2     6         20.5
#> 3     7         60
#> 4     8         39.5
#> 5     9         23
sum(is.na(ex_5_1$Ozone))
#> [1] 0
```

**Explanation:** `group_by(Month) |> mutate(...)` computes the median once per month and broadcasts it back to every row in that month. `ifelse()` then swaps NAs for the group median and leaves observed values untouched. Per-group imputation preserves between-group differences (here, seasonality) where global imputation would smear them. Always remember to `ungroup()` after `group_by()` inside a pipeline so downstream operations are not silently grouped.

</details>

### Exercise 5.2: Conditional imputation with case_when

**Task:** A trial statistician wants three rules for `clinic$weight_kg`: if `arm == "drug"` and `weight_kg` is NA, fill with the drug-arm mean; if `arm == "placebo"` and NA, fill with the placebo-arm mean; otherwise keep the observed value. Implement with `dplyr::case_when()` and save the patched `clinic` tibble to `ex_5_2`.

**Expected result:**

```
#> ex_5_2 |> select(patient_id, arm, weight_kg)
#> # A tibble: 10 x 3
#>    patient_id arm     weight_kg
#>         <int> <chr>       <dbl>
#>  1          1 drug         72
#>  2          2 drug         80
#>  3          3 drug         73.75
#>  4          4 drug         68
#>  5          5 drug         75
#>  6          6 placebo      90
#>  7          7 placebo      85
#>  8          8 placebo      83.75
#>  9          9 placebo      78
#> 10         10 placebo      82
#> sum(is.na(ex_5_2$weight_kg))
#> [1] 0
```

**Difficulty:** Advanced

[HINTS]
List the keep-the-observed-value rule before the fill rules so real data is never overwritten.
Group by arm, then mutate() with case_when() putting !is.na(weight_kg) ~ weight_kg as the first branch.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2 |> select(patient_id, arm, weight_kg)
sum(is.na(ex_5_2$weight_kg))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- clinic |>
  group_by(arm) |>
  mutate(weight_kg = case_when(
    !is.na(weight_kg) ~ weight_kg,
    arm == "drug"     ~ mean(weight_kg, na.rm = TRUE),
    arm == "placebo"  ~ mean(weight_kg, na.rm = TRUE)
  )) |>
  ungroup()

ex_5_2 |> select(patient_id, arm, weight_kg)
#> # A tibble: 10 x 3
#>    patient_id arm     weight_kg
#>         <int> <chr>       <dbl>
#>  1          1 drug         72
#>  2          2 drug         80
#>  3          3 drug         73.75
#>  4          4 drug         68
#>  5          5 drug         75
#>  6          6 placebo      90
#>  7          7 placebo      85
#>  8          8 placebo      83.75
#>  9          9 placebo      78
#> 10         10 placebo      82
sum(is.na(ex_5_2$weight_kg))
#> [1] 0
```

**Explanation:** `case_when()` is evaluated top-to-bottom, so listing `!is.na(weight_kg) ~ weight_kg` first lets observed values short-circuit before any imputation rule fires. Because the data is grouped by `arm`, `mean(weight_kg, na.rm = TRUE)` inside `mutate()` returns the within-arm mean. The drug-arm mean of (72+80+68+75)/4 = 73.75 fills patient 3; the placebo-arm mean of (90+85+78+82)/4 = 83.75 fills patient 8. Without grouping, you would impute every NA with the global mean and erase the treatment effect.

</details>

### Exercise 5.3: Recode sentinel zeros as NA before imputing

**Task:** Patient 8 in `clinic` has `visit_score = 0`, which the protocol uses as a "missed visit" sentinel rather than a real score of zero. Detect and convert that zero (and any other zeros that might creep in) to `NA`, then impute with the column median. Save the corrected `visit_score` vector to `ex_5_3`.

**Expected result:**

```
#> ex_5_3
#>  [1] 8.0 7.0 9.0 7.0 8.0 6.0 7.0 7.0 6.0 7.0
#> any(is.na(ex_5_3))
#> [1] FALSE
```

**Difficulty:** Advanced

[HINTS]
Convert the disguised missing code into a real gap first, then fill that gap like any other.
Assign NA where the value equals 0, then assign median(..., na.rm = TRUE) into the is.na() slots.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
any(is.na(ex_5_3))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- clinic$visit_score
ex_5_3[ex_5_3 == 0] <- NA
ex_5_3[is.na(ex_5_3)] <- median(ex_5_3, na.rm = TRUE)
ex_5_3
#>  [1] 8 7 9 7 8 6 7 7 6 7
any(is.na(ex_5_3))
#> [1] FALSE
```

**Explanation:** Sentinel detection (treating special codes like `0`, `-99`, `999`, or `"N/A"` as missingness) is one of the most common silent data-quality bugs. If you skip the recoding step, `mean()` and `median()` quietly use the sentinel as a real number and bias every summary. After recoding, the median of the seven observed scores (8,7,9,8,6,7,6) is 7, which fills both the protocol NA at row 4 and the sentinel at row 8. Always document sentinel codes in a data dictionary and apply this two-step recode early in the pipeline.

</details>

## Section 6. End-to-end pipelines (3 problems)

### Exercise 6.1: Audit, impute, and verify in one pipeline

**Task:** An ops engineer wants a single, idempotent pipeline that takes `airquality`, reports per-column NA counts, mean-imputes `Ozone`, median-imputes `Solar.R`, and returns the cleaned tibble plus a "before" summary attribute. Build the pipeline using dplyr verbs and save the final cleaned tibble to `ex_6_1`. The `attr(ex_6_1, "na_before")` should hold the pre-imputation NA counts.

**Expected result:**

```
#> attr(ex_6_1, "na_before")
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
#> colSums(is.na(ex_6_1))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>       0       0       0       0       0       0
#> nrow(ex_6_1)
#> [1] 153
```

**Difficulty:** Advanced

[HINTS]
Capture the missingness snapshot before you change anything, then stash it alongside the cleaned data.
Save colSums(is.na(airquality)) first, impute inside mutate() with ifelse(), then attach it via attr(ex_6_1, "na_before") <-.

```r title="Your turn"
ex_6_1 <- # your code here
attr(ex_6_1, "na_before")
colSums(is.na(ex_6_1))
nrow(ex_6_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
na_before <- colSums(is.na(airquality))

ex_6_1 <- airquality |>
  mutate(
    Ozone   = ifelse(is.na(Ozone),   mean(Ozone,   na.rm = TRUE), Ozone),
    Solar.R = ifelse(is.na(Solar.R), median(Solar.R, na.rm = TRUE), Solar.R)
  )

attr(ex_6_1, "na_before") <- na_before

attr(ex_6_1, "na_before")
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
colSums(is.na(ex_6_1))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>       0       0       0       0       0       0
nrow(ex_6_1)
#> [1] 153
```

**Explanation:** Attaching the pre-imputation NA counts as an attribute keeps the audit trail next to the data, so anyone inspecting `ex_6_1` later can answer "how much of this came from imputation?" without re-reading the source. The pipeline is idempotent: running it twice yields the same result, since the second pass finds no NAs to impute. In production, log the `na_before` to a metrics store so you can alert when an upstream feed starts losing data.

</details>

### Exercise 6.2: Compare drop vs mean-impute vs median-impute row counts

**Task:** Before committing to a strategy, the team wants a side-by-side comparison: how many rows survive (a) `na.omit()`, (b) mean-imputing `Ozone` and `Solar.R`, and (c) median-imputing the same? Build a 3-row tibble with columns `strategy` and `rows_retained` and save to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   strategy        rows_retained
#>   <chr>                   <int>
#> 1 drop_na                   111
#> 2 mean_impute               153
#> 3 median_impute             153
```

**Difficulty:** Intermediate

[HINTS]
Build each cleaned version separately, then assemble their row counts into one small table.
Compute nrow(na.omit(...)) plus the mean and median imputations with across(c(Ozone, Solar.R), ...), then collect into a tibble() with strategy and rows_retained columns.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
drop_n <- nrow(na.omit(airquality))

mean_imp <- airquality |>
  mutate(across(c(Ozone, Solar.R), ~ ifelse(is.na(.x), mean(.x, na.rm = TRUE), .x)))

median_imp <- airquality |>
  mutate(across(c(Ozone, Solar.R), ~ ifelse(is.na(.x), median(.x, na.rm = TRUE), .x)))

ex_6_2 <- tibble(
  strategy      = c("drop_na", "mean_impute", "median_impute"),
  rows_retained = c(drop_n, nrow(mean_imp), nrow(median_imp))
)

ex_6_2
#> # A tibble: 3 x 2
#>   strategy        rows_retained
#>   <chr>                   <int>
#> 1 drop_na                   111
#> 2 mean_impute               153
#> 3 median_impute             153
```

**Explanation:** `across(c(col1, col2), ~ ifelse(...))` is the modern dplyr idiom for applying the same imputation rule to several columns without duplication. The headline number (111 vs 153) frames the tradeoff: dropping costs 27% of your sample but introduces no synthetic values, while imputing retains all 153 rows but injects 44 fabricated cells. The right call depends on whether the analysis is sensitive to bias (favor drop) or to sample size (favor impute).

</details>

### Exercise 6.3: Build a one-line missingness report

**Task:** A code reviewer asks for a tidy missingness report on `airquality` with columns `column`, `n_missing`, and `pct_missing` (to 2 decimals), sorted descending by `n_missing` so the worst offenders sit at the top. Produce it with dplyr and save the result to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   column  n_missing pct_missing
#>   <chr>       <int>       <dbl>
#> 1 Ozone          37       24.18
#> 2 Solar.R         7        4.58
#> 3 Wind            0        0
#> 4 Temp            0        0
#> 5 Month           0        0
#> 6 Day             0        0
```

**Difficulty:** Intermediate

[HINTS]
Count the missing values per column, then reshape that single wide row into a tall, sortable table.
Chain summarise(across(everything(), ~ sum(is.na(.x)))), pivot_longer(), a mutate() for the percentage, and arrange(desc(n_missing)).

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- airquality |>
  summarise(across(everything(), ~ sum(is.na(.x)))) |>
  pivot_longer(everything(), names_to = "column", values_to = "n_missing") |>
  mutate(pct_missing = round(n_missing / nrow(airquality) * 100, 2)) |>
  arrange(desc(n_missing))

ex_6_3
#> # A tibble: 6 x 3
#>   column  n_missing pct_missing
#>   <chr>       <int>       <dbl>
#> 1 Ozone          37       24.18
#> 2 Solar.R         7        4.58
#> 3 Wind            0        0
#> 4 Temp            0        0
#> 5 Month           0        0
#> 6 Day             0        0
```

**Explanation:** `across(everything(), ~ sum(is.na(.x)))` produces a wide one-row tibble of NA counts; `pivot_longer()` reshapes it into a tidy two-column frame. The `~ .x` formula-style anonymous function keeps the code compact. This idiom generalises: swap `sum(is.na(.x))` for any per-column summary (`mean`, `n_distinct`, `min`, etc.) to get a tidy diagnostic table you can write to disk or render in a report.

</details>

## What to do next

You worked through 18 missing-data problems. Now consolidate with these companion hubs:

- [dplyr Exercises](dplyr-Exercises-in-R.html): general dplyr verbs including grouped mutate, the workhorse for imputation pipelines.
- [tidyr Exercises](tidyr-Exercises-in-R.html): more practice with `drop_na()`, `fill()`, `pivot_longer()`, and missingness reshaping.
- [Data Cleaning Exercises](Data-Cleaning-Exercises-in-R.html): broader cleaning patterns including outlier detection and type coercion alongside NA handling.
- [EDA Exercises](EDA-Exercises-in-R.html): the diagnostic phase where missingness audits live in a real workflow.
