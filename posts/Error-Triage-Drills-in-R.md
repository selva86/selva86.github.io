---
title: "Error Triage Drills: 20 Broken R Scripts to Fix"
slug: "Error-Triage-Drills-in-R"
description: "Fix R errors with 20 broken-script triage drills covering object not found, subscript out of bounds, unused argument, factor traps and more, with hints."
keywords: "fix R errors practice, debug R code exercises, R error messages, R debugging exercises, object not found R, subscript out of bounds R, could not find function R"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Error Triage Drills"
sidebar_order: 150
fr_parent: "R-Debugging.html"
auto_link_terms: "error triage|fix r errors|debug r code|r error messages|triage drills"
auto_link_case_sensitive: false
target_keyword: "fix R errors practice"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Error Triage Drills: 20 Broken R Scripts to Fix

<p class="lead">This featured debugging collection hands you 20 broken R scripts to repair. Each drill shows the exact error R throws, from object not found and subscript out of bounds to unused argument and factor traps. Read the message, locate the fault, and fix the code so it returns the stated result. Full solutions stay hidden until you choose to reveal them.</p>

Run the setup block once, then work through the drills in any order. Every script fails on purpose: your job is to read the error, diagnose the cause, and repair the code.

```r title="Run this once before any exercise"
library(dplyr)

# Shared data for the data-frame triage section (Section 7)
orders <- data.frame(
  region   = c("West", "East", "West", "North", "East"),
  product  = c("A", "B", "A", "C", "B"),
  quantity = c(3, 1, 5, 2, 4),
  price    = c(19.99, 5.00, 19.99, 42.50, 5.00),
  stringsAsFactors = FALSE
)
```

## Section 1. Missing names: objects and functions (3 problems)

### Exercise 1.1: Fix a misspelled object name in a sum

**Task:** A quick sales tally throws `Error: object 'monthy' not found` because the variable name inside the `sum()` call is misspelled. Repair the typo so the total of the three monthly figures is computed, and save the repaired result to `ex_1_1`.

**Expected result:**

```
#> [1] 3680
```

**Difficulty:** Beginner

[HINTS]
The value already exists in the workspace under a correctly spelled name; the error is a mismatch between what you typed and what you defined.
Change `monthy` to `monthly` inside `sum()` so the call sees the real vector.

```r title="Your turn"
monthly <- c(1200, 1500, 980)
ex_1_1 <- sum(monthy)   # errors: object 'monthy' not found
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
monthly <- c(1200, 1500, 980)
ex_1_1 <- sum(monthly)
ex_1_1
#> [1] 3680
```

**Explanation:** R looks up names exactly as written, so a single dropped or transposed letter yields object not found rather than a helpful guess. The fix is never to redefine the data but to correct the reference. When this bites, print `ls()` to see the names actually in scope.

</details>

### Exercise 1.2: Correct a mistyped column-means function call

**Task:** This audit line meant to average two `mtcars` columns fails with `could not find function "colmeans"`. R is case-sensitive about function names, so correct the call to compute the mean of `mpg` and `hp`, and store the output in `ex_1_2`.

**Expected result:**

```
#>       mpg        hp 
#>  20.09062 146.68750 
```

**Difficulty:** Intermediate

[HINTS]
The function you want is real, but R found nothing under the exact casing you used; think about how R capitalises its built-in matrix helpers.
Use `colMeans()` with a capital M on the two selected columns.

```r title="Your turn"
ex_1_2 <- colmeans(mtcars[, c("mpg", "hp")])   # errors: could not find function "colmeans"
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- colMeans(mtcars[, c("mpg", "hp")])
ex_1_2
#>       mpg        hp 
#>  20.09062 146.68750 
```

**Explanation:** Function lookup is case-sensitive: `colmeans` and `colMeans` are different names, and only the camelCase one exists in base R. The same trap hits `rowMeans`, `colSums`, and `is.na`. When you see could not find function, check spelling and casing before assuming a package is missing.

</details>

### Exercise 1.3: Reference a data frame column that is out of scope

**Task:** An analyst tries `mean(disp)` to get the average displacement, but R replies `Error: object 'disp' not found` because `disp` lives inside `mtcars`, not the global workspace. Point the call at the right column and save the mean to `ex_1_3`.

**Expected result:**

```
#> [1] 230.7219
```

**Difficulty:** Intermediate

[HINTS]
The name is only visible from inside the data frame, not on its own; you must tell R which table the column belongs to.
Reach the column with `mtcars$disp` inside `mean()`.

```r title="Your turn"
ex_1_3 <- mean(disp)   # errors: object 'disp' not found
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- mean(mtcars$disp)
ex_1_3
#> [1] 230.7219
```

**Explanation:** Column names are not free-floating variables; they live inside the data frame and must be reached with `$`, `[[`, or `with()`. Writing bare `disp` searches the global environment and fails. Avoid `attach()` as a shortcut: it invites silent masking bugs when two frames share a column name.

</details>

## Section 2. Indexing past the edge (3 problems)

### Exercise 2.1: Repair a list index that runs past the end

**Task:** A pricing sheet holds three bids in a list, but reading `bids[[4]]` returns `Error in bids[[4]] : subscript out of bounds` because only three elements exist. Grab the last real element instead and save its value to `ex_2_1`.

**Expected result:**

```
#> [1] 1750
```

**Difficulty:** Intermediate

[HINTS]
You asked for a position one past the end; count how many elements the container actually holds before indexing.
Index the third element with `bids[[3]]`.

```r title="Your turn"
bids <- list(1200, 2500, 1750)
ex_2_1 <- bids[[4]]   # errors: subscript out of bounds
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bids <- list(1200, 2500, 1750)
ex_2_1 <- bids[[3]]
ex_2_1
#> [1] 1750
```

**Explanation:** Double brackets extract a single element, and asking for position 4 of a three-element list runs off the end. Always size the container with `length()` before indexing a computed position. Note that single brackets `bids[4]` would instead return a one-element list holding NULL rather than erroring.

</details>

### Exercise 2.2: Fix a matrix column subscript out of bounds

**Task:** A 2-by-3 matrix is queried for a fourth column with `m[, 4]`, raising `Error in m[, 4] : subscript out of bounds`. The matrix has only three columns, so read the correct final column and store the resulting vector in `ex_2_2`.

**Expected result:**

```
#> [1] 5 6
```

**Difficulty:** Advanced

[HINTS]
The requested column index exceeds the number of columns present; check the shape before you index.
Select the third column with `m[, 3]`.

```r title="Your turn"
m <- matrix(1:6, nrow = 2)
ex_2_2 <- m[, 4]   # errors: subscript out of bounds
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(1:6, nrow = 2)
ex_2_2 <- m[, 3]
ex_2_2
#> [1] 5 6
```

**Explanation:** A matrix subscript must fall within its dimensions, and `m[, 4]` asks for a fourth column that does not exist. Check the shape with `dim()` or `ncol()` first. Unlike a data frame, this matrix has no column names, so positional indexing is all you have.

</details>

### Exercise 2.3: Replace the dollar operator on a named vector

**Task:** A named numeric vector `fees` is accessed with `fees$setup`, which triggers `Error in fees$setup : $ operator is invalid for atomic vectors`. The dollar sign only works on lists and data frames, so use the right accessor and save the value to `ex_2_3`.

**Expected result:**

```
#> [1] 1250
```

**Difficulty:** Intermediate

[HINTS]
The dollar sign only reaches inside recursive structures; an atomic vector needs a different accessor for a named element.
Pull the element with `fees[["setup"]]` (or `fees["setup"]` to keep the name).

```r title="Your turn"
fees <- c(setup = 1250, monthly = 400)
ex_2_3 <- fees$setup   # errors: $ operator is invalid for atomic vectors
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fees <- c(setup = 1250, monthly = 400)
ex_2_3 <- fees[["setup"]]
ex_2_3
#> [1] 1250
```

**Explanation:** The `$` operator is defined only for recursive objects like lists and data frames, not atomic vectors. For a named vector, use `[[` for one value or `[` to keep the name attached. A frequent cause is treating a vector as if it were a one-row data frame.

</details>

## Section 3. Types that will not coerce (3 problems)

### Exercise 3.1: Add a string and a number without erroring

**Task:** A form field arrives as the text `"1200"`, and adding a `50` surcharge with `"1200" + 50` fails with `Error in "1200" + 50 : non-numeric argument to binary operator`. Convert the string before adding so the sum is 1250, and save the corrected result to `ex_3_1`.

**Expected result:**

```
#> [1] 1250
```

**Difficulty:** Beginner

[HINTS]
One operand is text, and arithmetic needs both sides to be numbers, so a conversion has to happen first.
Wrap the string in `as.numeric()` before the `+`.

```r title="Your turn"
ex_3_1 <- "1200" + 50   # errors: non-numeric argument to binary operator
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- as.numeric("1200") + 50
ex_3_1
#> [1] 1250
```

**Explanation:** Arithmetic operators need numeric or logical operands, so a character string on either side stops the operation cold. `as.numeric()` performs the conversion, returning NA with a warning if the text is not a clean number. This is the classic bug when values arrive from form inputs or `read.csv()` columns.

</details>

### Exercise 3.2: Sum numbers that were stored as a factor

**Task:** Three heights were stored as a factor, so `sum(heights)` throws `Error in Summary.factor(...) : 'sum' not meaningful for factors`. Convert the factor back to real numbers before adding (a bare `as.numeric` returns level codes, not the labels) and save the total to `ex_3_2`.

**Expected result:**

```
#> [1] 515
```

**Difficulty:** Intermediate

[HINTS]
A factor stores labels plus hidden integer codes; converting straight to numeric gives the codes, so you must recover the labels as text first.
Use `as.numeric(as.character(heights))` before `sum()`.

```r title="Your turn"
heights <- factor(c("165", "170", "180"))
ex_3_2 <- sum(heights)   # errors: 'sum' not meaningful for factors
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
heights <- factor(c("165", "170", "180"))
ex_3_2 <- sum(as.numeric(as.character(heights)))
ex_3_2
#> [1] 515
```

**Explanation:** Summary generics like `sum`, `mean`, and `max` refuse factors outright. Converting with a bare `as.numeric()` is worse than the error: it silently returns the integer level codes (1, 2, 3), not the labels. Always route through `as.character()` first so the printed labels become the numbers you meant.

</details>

### Exercise 3.3: Total a character vector of prices safely

**Task:** A vector of prices read as text triggers `Error in sum(prices) : invalid 'type' (character) of argument` when totalled directly. Coerce the character values to numeric first so the three prices add up correctly, and store the sum in `ex_3_3`.

**Expected result:**

```
#> [1] 37.49
```

**Difficulty:** Intermediate

[HINTS]
The values look like numbers but are stored as text, and totals need real numerics under the hood.
Apply `as.numeric(prices)` inside `sum()`.

```r title="Your turn"
prices <- c("19.99", "5.00", "12.50")
ex_3_3 <- sum(prices)   # errors: invalid 'type' (character) of argument
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- c("19.99", "5.00", "12.50")
ex_3_3 <- sum(as.numeric(prices))
ex_3_3
#> [1] 37.49
```

**Explanation:** A character vector cannot be summed because addition is undefined for text, and `as.numeric()` restores the real values first. This commonly appears after importing data where one stray non-numeric entry forced the whole column to character. Inspect with `str()` to catch a text column that should have been numeric.

</details>

## Section 4. Arguments the function never accepted (2 problems)

### Exercise 4.1: Fix a mistyped matrix dimension argument

**Task:** A reshape step calls `matrix(1:6, nrow = 2, ncols = 3)` and fails with `Error in matrix(1:6, nrow = 2, ncols = 3) : unused argument (ncols = 3)`. The keyword for column count is spelled differently, so fix the argument name to build the 2-by-3 matrix and save it to `ex_4_1`.

**Expected result:**

```
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6
```

**Difficulty:** Intermediate

[HINTS]
The function rejected an argument it does not define; compare the keyword you passed against the ones the function expects.
Rename `ncols` to `ncol` in the `matrix()` call.

```r title="Your turn"
ex_4_1 <- matrix(1:6, nrow = 2, ncols = 3)   # errors: unused argument (ncols = 3)
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- matrix(1:6, nrow = 2, ncol = 3)
ex_4_1
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6
```

**Explanation:** R matches arguments by the exact names a function declares, and `matrix()` expects `ncol`, not `ncols`. Any unrecognised name triggers unused argument. When unsure, run `args(matrix)` or read `?matrix` to see the real parameter names rather than guessing at a plural.

</details>

### Exercise 4.2: Correct a misspelled argument name in a helper

**Task:** A helper defined as `standardize(x, center = TRUE)` is called with `centre = TRUE`, giving `Error in standardize(...) : unused argument (centre = TRUE)`. Match the argument name the function actually declares so the z-scores are returned, and store them in `ex_4_2`.

**Expected result:**

```
#> [1] -1.1618950 -0.3872983  0.3872983  1.1618950
```

**Difficulty:** Advanced

[HINTS]
The function only accepts the argument names it declares, so a near-miss spelling is treated as unknown rather than corrected.
Pass `center = TRUE` to match the parameter `standardize()` defines.

```r title="Your turn"
standardize <- function(x, center = TRUE) (x - mean(x)) / sd(x)
ex_4_2 <- standardize(c(2, 4, 6, 8), centre = TRUE)   # errors: unused argument (centre = TRUE)
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
standardize <- function(x, center = TRUE) (x - mean(x)) / sd(x)
ex_4_2 <- standardize(c(2, 4, 6, 8), center = TRUE)
ex_4_2
#> [1] -1.1618950 -0.3872983  0.3872983  1.1618950
```

**Explanation:** Argument names must match the function signature character for character, so the British `centre` never binds to the American `center` the function declared. Partial matching would accept an unambiguous prefix like `cent`, but a differently spelled full word is rejected. Standardising spelling in your own APIs prevents this entirely.

</details>

## Section 5. Code that will not parse (2 problems)

### Exercise 5.1: Separate two statements crammed onto one line

**Task:** Two assignments were crammed onto one line as `price <- 100 quantity <- 3`, so R aborts with `unexpected symbol`. Put each statement on its own line so the product of price and quantity evaluates, then save the value to `ex_5_1`.

**Expected result:**

```
#> [1] 300
```

**Difficulty:** Beginner

[HINTS]
R could not tell where the first statement ended; two expressions cannot share a line without a separator between them.
Put `price <- 100` and `quantity <- 3` on separate lines (or divide them with a semicolon).

```r title="Your turn"
price <- 100 quantity <- 3   # errors: unexpected symbol
ex_5_1 <- price * quantity
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
price <- 100
quantity <- 3
ex_5_1 <- price * quantity
ex_5_1
#> [1] 300
```

**Explanation:** R parses one complete expression at a time and cannot tell where the first statement ends without a newline or semicolon, so two assignments on one line collide at the second name. Prefer newlines over semicolons for readability, and reserve `;` for terse one-off console lines.

</details>

### Exercise 5.2: Add the missing comma in a data frame call

**Task:** A data frame call is written `data.frame(x = 1:3 y = 4:6)` and R stops with `unexpected symbol` at `y`. A separator between the two columns is missing, so add it and build the two-column frame, saving the result to `ex_5_2`.

**Expected result:**

```
#>   x y
#> 1 1 4
#> 2 2 5
#> 3 3 6
```

**Difficulty:** Intermediate

[HINTS]
The parser hit a second column name with nothing telling it the first argument had already ended.
Insert a comma between `x = 1:3` and `y = 4:6` in `data.frame()`.

```r title="Your turn"
ex_5_2 <- data.frame(x = 1:3 y = 4:6)   # errors: unexpected symbol at y
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- data.frame(x = 1:3, y = 4:6)
ex_5_2
#>   x y
#> 1 1 4
#> 2 2 5
#> 3 3 6
```

**Explanation:** Inside a function call every argument must be separated by a comma, and without it the parser reaches the next name unexpectedly and stops. The caret in the error points at the first token it could not place. Scan just left of that position, where a comma or operator is usually missing.

</details>

## Section 6. Conditions that meet NA and emptiness (3 problems)

### Exercise 6.1: Guard an if condition against a missing mean

**Task:** A threshold check `if (mean(threshold) > 5)` errors with `missing value where TRUE/FALSE needed` because `threshold` contains an `NA` that poisons the mean. Make the mean ignore the missing value so the branch resolves, and save the chosen label to `ex_6_1`.

**Expected result:**

```
#> [1] "low"
```

**Difficulty:** Intermediate

[HINTS]
The condition evaluated to NA, and an if needs a definite TRUE or FALSE; the NA came from the summary of the data.
Compute the mean with `na.rm = TRUE` so the NA is dropped before the comparison.

```r title="Your turn"
threshold <- c(3, NA, 7)
ex_6_1 <- if (mean(threshold) > 5) "high" else "low"   # errors: missing value where TRUE/FALSE needed
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
threshold <- c(3, NA, 7)
ex_6_1 <- if (mean(threshold, na.rm = TRUE) > 5) "high" else "low"
ex_6_1
#> [1] "low"
```

**Explanation:** An `if` needs a single, non-missing logical, but `mean()` over data containing NA returns NA, which cannot be branched on. Passing `na.rm = TRUE` drops the gap before averaging. The deeper lesson is to handle NA deliberately rather than letting it surface at a control-flow boundary.

</details>

### Exercise 6.2: Skip NA safely inside a filtering loop

**Task:** A loop keeps readings above four, but `if (v > 4)` errors with `missing value where TRUE/FALSE needed` the moment it reaches the `NA` reading. Guard the test so the loop skips missing values, collecting the survivors into `ex_6_2`.

**Expected result:**

```
#> [1] 5 8
```

**Difficulty:** Advanced

[HINTS]
The comparison returns NA on the missing element, and the if cannot branch on NA, so you must exclude missing values before testing.
Test `!is.na(v) && v > 4` inside the loop.

```r title="Your turn"
readings <- c(2, 5, NA, 8)
ex_6_2 <- c()
for (v in readings) {
  if (v > 4) ex_6_2 <- c(ex_6_2, v)   # errors at the NA reading
}
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
readings <- c(2, 5, NA, 8)
ex_6_2 <- c()
for (v in readings) {
  if (!is.na(v) && v > 4) ex_6_2 <- c(ex_6_2, v)
}
ex_6_2
#> [1] 5 8
```

**Explanation:** The comparison `v > 4` yields NA when `v` is NA, and `if` cannot act on NA. Guarding with `!is.na(v)` first, combined with `&&` so the second test is skipped when the first is FALSE, keeps the loop moving. A vectorised alternative is `readings[!is.na(readings) & readings > 4]`.

</details>

### Exercise 6.3: Handle an empty vector before an if test

**Task:** After filtering scores above 95 the result is empty, so `if (top > 90)` throws `Error in if (top > 90) ... : argument is of length zero`. Check whether any value survived the filter before testing it, and save the resulting label to `ex_6_3`.

**Expected result:**

```
#> [1] "good"
```

**Difficulty:** Intermediate

[HINTS]
The comparison ran on an empty vector, so the if received nothing to decide on; confirm something survived the filter first.
Gate the test with `length(top) > 0` before comparing.

```r title="Your turn"
scores <- c(85, 90, 78)
top <- scores[scores > 95]
ex_6_3 <- if (top > 90) "excellent" else "good"   # errors: argument is of length zero
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- c(85, 90, 78)
top <- scores[scores > 95]
ex_6_3 <- if (length(top) > 0) "excellent" else "good"
ex_6_3
#> [1] "good"
```

**Explanation:** Filtering can legitimately return an empty vector, and comparing it produces a length-zero logical that `if` rejects. Checking `length()` first is the guard. This is why `if` on a subset is fragile; for element-wise decisions on a vector, `ifelse()` or `any()` and `all()` are safer.

</details>

## Section 7. Data-frame pipelines that break (4 problems)

### Exercise 7.1: Build the revenue column a select could not find

**Task:** A reporting analyst runs `orders[, c("region", "revenue")]` and hits `Error in ... : undefined columns selected` because `revenue` was never computed. Derive it from `quantity` and `price`, then keep `region` and the new column, saving the two-column result to `ex_7_1`.

**Expected result:**

```
#>   region revenue
#> 1   West   59.97
#> 2   East    5.00
#> 3   West   99.95
#> 4  North   85.00
#> 5   East   20.00
```

**Difficulty:** Intermediate

[HINTS]
You cannot select a column that was never built; the fix is to create it, not to reference it.
Add the column with `mutate(revenue = quantity * price)`, then keep `region` and `revenue` with `select()`.

```r title="Your turn"
ex_7_1 <- orders[, c("region", "revenue")]   # errors: undefined columns selected
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- orders |>
  mutate(revenue = quantity * price) |>
  select(region, revenue)
ex_7_1
#>   region revenue
#> 1   West   59.97
#> 2   East    5.00
#> 3   West   99.95
#> 4  North   85.00
#> 5   East   20.00
```

**Explanation:** You cannot select a column that was never created, so the error is a symptom of a missing derivation rather than a typo. Building `revenue` with `mutate()` and then narrowing with `select()` produces exactly the two columns requested. In base R the same fix is `transform()` followed by column indexing.

</details>

### Exercise 7.2: Fix a replacement vector of the wrong length

**Task:** Adding a flat discount with `orders$discount <- c(0.1, 0.2)` fails with `Error ... replacement has 2 rows, data has 5`. The replacement vector is shorter than the five-row frame, so supply a value that applies to every row and save the updated copy to `ex_7_2`.

**Expected result:**

```
#>   region product quantity price discount
#> 1   West       A        3 19.99      0.1
#> 2   East       B        1  5.00      0.1
#> 3   West       A        5 19.99      0.1
#> 4  North       C        2 42.50      0.1
#> 5   East       B        4  5.00      0.1
```

**Difficulty:** Intermediate

[HINTS]
The number of values you assign must match the number of rows, or recycle cleanly into them.
Assign a single value like `0.1` so it recycles across all five rows.

```r title="Your turn"
ex_7_2 <- orders
ex_7_2$discount <- c(0.1, 0.2)   # errors: replacement has 2 rows, data has 5
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- orders
ex_7_2$discount <- 0.1
ex_7_2
#>   region product quantity price discount
#> 1   West       A        3 19.99      0.1
#> 2   East       B        1  5.00      0.1
#> 3   West       A        5 19.99      0.1
#> 4  North       C        2 42.50      0.1
#> 5   East       B        4  5.00      0.1
```

**Explanation:** Assigning into a data frame column requires a vector whose length matches the rows or recycles evenly, so two values cannot spread across five rows. A single scalar recycles cleanly to every row. When you truly need per-row values, supply a full-length vector, often computed from the existing columns.

</details>

### Exercise 7.3: Correct a mistyped column inside a mutate

**Task:** A pipeline `orders |> mutate(line_total = quantop * price)` breaks with `object 'quantop' not found` raised inside `mutate()`. The column name is mistyped, so correct it to multiply quantity by price per row, and store the widened frame in `ex_7_3`.

**Expected result:**

```
#>   region product quantity price line_total
#> 1   West       A        3 19.99      59.97
#> 2   East       B        1  5.00       5.00
#> 3   West       A        5 19.99      99.95
#> 4  North       C        2 42.50      85.00
#> 5   East       B        4  5.00      20.00
```

**Difficulty:** Advanced

[HINTS]
The expression references a name that does not exist in the frame; check the column spelling against the actual data.
Change `quantop` to `quantity` inside `mutate()`.

```r title="Your turn"
ex_7_3 <- orders |>
  mutate(line_total = quantop * price)   # errors: object 'quantop' not found
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_3 <- orders |>
  mutate(line_total = quantity * price)
ex_7_3
#>   region product quantity price line_total
#> 1   West       A        3 19.99      59.97
#> 2   East       B        1  5.00       5.00
#> 3   West       A        5 19.99      99.95
#> 4  North       C        2 42.50      85.00
#> 5   East       B        4  5.00      20.00
```

**Explanation:** Inside `mutate()`, unquoted names are resolved against the frame's columns, so a misspelled `quantop` is reported as object not found. dplyr wraps the base error to show which argument failed. Fixing the spelling to `quantity` lets the multiplication run row by row.

</details>

### Exercise 7.4: Fix an equals sign used inside filter

**Task:** A filter written `orders |> filter(region = "West")` errors because R reads `region = "West"` as a named argument, not a comparison. Swap in the equality test dplyr expects to keep only the West rows, and save them to `ex_7_4`.

**Expected result:**

```
#>   region product quantity price
#> 1   West       A        3 19.99
#> 2   West       A        5 19.99
```

**Difficulty:** Advanced

[HINTS]
A single equals sign inside the call is read as naming an argument, not comparing values.
Use the double-equals test `region == "West"` inside `filter()`.

```r title="Your turn"
ex_7_4 <- orders |>
  filter(region = "West")   # errors: we detected a named input (= instead of ==)
ex_7_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_4 <- orders |>
  filter(region == "West")
ex_7_4
#>   region product quantity price
#> 1   West       A        3 19.99
#> 2   West       A        5 19.99
```

**Explanation:** A single `=` inside `filter()` looks like you are naming an argument, so dplyr warns that you likely meant `==`. Comparison always uses double equals, while single equals is assignment or argument binding. The helpful hint in the message even suggests the corrected expression for you to copy.

</details>

## What to do next

You have triaged 20 broken scripts across ten of R's most common error families. Keep the momentum going with these related practice sets:

- [R Debugging Exercises](R-Debugging-Exercises.html): step through `traceback()`, `browser()`, and defensive coding drills.
- [R Beginner Exercises](R-Beginner-Exercises.html): shore up the fundamentals that prevent these errors in the first place.
- [R Control Flow Exercises](R-Control-Flow-Exercises.html): practise the `if`, `for`, and `while` patterns behind the condition errors above.
- [R Vectors Exercises](R-Vectors-Exercises.html): drill the indexing and coercion rules that cause subscript and type errors.
