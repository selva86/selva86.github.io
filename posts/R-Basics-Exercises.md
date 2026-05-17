---
title: "R Basics Exercises: 18 Practice Problems with Solutions"
slug: "R-Basics-Exercises"
description: "18 R basics exercises covering variables, vectors, indexing, logical ops, strings, functions, and control flow. Runnable code, hidden solutions, full explanations."
keywords: "R basics exercises, R practice problems, R beginner exercises, R exercises with solutions, R syntax practice, learn R exercises"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Basics (18 problems)"
sidebar_order: 140
fr_parent: "R-Syntax-101.html"
auto_link_terms: "R basics exercises|R practice problems|R beginner exercises|R syntax practice|learn R exercises"
auto_link_case_sensitive: false
target_keyword: "R basics exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Basics Exercises: 18 Practice Problems with Solutions

<p class="lead">Eighteen runnable R basics exercises covering variables, vectors, recycling, logical operations, indexing, strings, factors, and your first user-defined functions. Each problem ships with an expected result you can verify and a hidden, fully explained solution you can reveal once you have made an attempt.</p>

The set is designed for readers who can install R, open RStudio or Positron, and want a tight sequence of drills that pushes past "hello world" syntax into the patterns you actually use every day. Work top to bottom: each section reuses ideas from the section before it. Three problems are beginner, ten are intermediate, five are advanced.

```r title="Run this once before any exercise"
library(stats)
library(datasets)
```

## Section 1. Variables, arithmetic, and type coercion (3 problems)

### Exercise 1.1: Compute arithmetic, integer division, and remainder

**Task:** A junior analyst is double-checking that R's arithmetic operators behave the way they expect coming from Python. Using `x <- 17` and `y <- 5`, compute the sum, difference, product, integer quotient (`%/%`), and remainder (`%%`) and combine all five results into one named numeric vector. Save the vector to `ex_1_1`.

**Expected result:**

```
#>  sum diff prod quot  rem
#>   22   12   85    3    2
```

**Difficulty:** Beginner

[HINTS]
R has dedicated operators for the whole-number part of a division and for the leftover, kept separate from ordinary division.
Use the `%/%` and `%%` operators, and build the result with `c()` using `name = value` pairs.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 17
y <- 5
ex_1_1 <- c(sum = x + y, diff = x - y, prod = x * y, quot = x %/% y, rem = x %% y)
ex_1_1
#>  sum diff prod quot  rem
#>   22   12   85    3    2
```

**Explanation:** `%/%` returns the integer quotient (floor of `x / y`) and `%%` returns the remainder. The single-call form `c(name = value, ...)` builds a named vector in one pass, which is cleaner than calling `names()` afterward. A common mistake is to assume `x / y` already truncates to an integer; in R the `/` operator always returns a double (here `3.4`), so when you need a clean quotient you must reach for `%/%`.

</details>

### Exercise 1.2: Watch type coercion silently demote numbers to strings

**Task:** A reviewer of teaching material wants a worked demonstration that `c()` will silently coerce every element to the most general type when you mix kinds. Build a single vector containing `1L`, the double `2.5`, the logical `TRUE`, and the character string `"yes"`, then call `typeof()` and `length()` on it. Combine both into a named list, saved to `ex_1_2`, with elements `type` and `len`.

**Expected result:**

```
#> $type
#> [1] "character"
#>
#> $len
#> [1] 4
```

**Difficulty:** Intermediate

[HINTS]
When you mix kinds in one vector, R settles on whichever single type can hold them all - check what that turns out to be.
After building the mixed vector, wrap the storage and length results in `list(type = typeof(v), len = length(v))`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
v <- c(1L, 2.5, TRUE, "yes")
ex_1_2 <- list(type = typeof(v), len = length(v))
ex_1_2
#> $type
#> [1] "character"
#>
#> $len
#> [1] 4
```

**Explanation:** Atomic vectors in R hold one type, so `c()` walks a coercion ladder: logical -> integer -> double -> character. The presence of a single string forces every element into character, which is why `1L` becomes `"1"` and `TRUE` becomes `"TRUE"`. The painful version of this bug appears when a stray text value lands in a CSV column and quietly turns your numeric series into strings, breaking later arithmetic. Always check `typeof()` after reading data you do not control.

</details>

### Exercise 1.3: Compare typeof, class, and mode on the same value

**Task:** A new R user is confused by the three different "what type is this" functions. For the value `1L` and for the value `1` (a double), build a 2x3 matrix whose rows correspond to those two inputs and whose columns are `typeof`, `class`, and `mode`. Set the row names to `"1L"` and `"1.0"`. Save the matrix to `ex_1_3`.

**Expected result:**

```
#>     typeof    class     mode
#> 1L  "integer" "integer" "numeric"
#> 1.0 "double"  "numeric" "numeric"
```

**Difficulty:** Intermediate

[HINTS]
Inspect each value the same three ways, then stack the two inputs as rows of one table.
Apply `typeof()`, `class()`, and `mode()` to each value and bind the rows with `rbind("1L" = ..., "1.0" = ...)`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
inspect <- function(x) c(typeof = typeof(x), class = class(x), mode = mode(x))
ex_1_3 <- rbind("1L" = inspect(1L), "1.0" = inspect(1))
ex_1_3
#>     typeof    class     mode
#> 1L  "integer" "integer" "numeric"
#> 1.0 "double"  "numeric" "numeric"
```

**Explanation:** `typeof()` reports the underlying storage (integer vs double), `class()` reports the S3 class that method dispatch uses, and `mode()` is a coarser older grouping. For most modern code you want `typeof()` for storage questions and `class()` for dispatch questions. `mode()` is rarely the right answer; it exists for back-compatibility with S, and lumps integer and double together as `"numeric"`, which can mask the very distinction you are trying to debug.

</details>

## Section 2. Vectors, sequences, and recycling (3 problems)

### Exercise 2.1: Build a descending sequence with seq() and rev()

**Task:** A reporting analyst wants a quick countdown vector for a row-numbering routine: the integers from 50 down to 1, stepping by 1. Build it two different ways (using `seq()` with a negative `by`, and using `rev()` on `1:50`), and confirm both approaches agree by combining them into a length-2 named list with elements `via_seq` and `via_rev`. Save to `ex_2_1`.

**Expected result:**

```
#> $via_seq
#>  [1] 50 49 48 47 46 45 44 43 42 41 40 39 38 37 36 35 34 33 32 31 30 29 28 27 26
#> [26] 25 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1
#>
#> $via_rev
#>  [1] 50 49 48 47 46 45 44 43 42 41 40 39 38 37 36 35 34 33 32 31 30 29 28 27 26
#> [26] 25 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1
```

**Difficulty:** Beginner

[HINTS]
One approach counts down directly with a negative step; the other builds the sequence upward and then flips its order.
Use `seq(from = 50, to = 1, by = -1)` and `rev(1:50)`, then pack both into `list(via_seq = ..., via_rev = ...)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- list(
  via_seq = seq(from = 50, to = 1, by = -1),
  via_rev = rev(1:50)
)
identical(ex_2_1$via_seq, ex_2_1$via_rev)
#> [1] FALSE
```

**Explanation:** Both forms produce the same printed values, but `identical()` returns `FALSE` because `seq(50, 1, by = -1)` is a double while `1:50` is an integer, and `rev()` preserves type. If you need them to compare equal, use `seq.int(50, 1, by = -1L)` for the explicit integer form, or coerce one side with `as.integer()`. This is the same coercion trap as Exercise 1.2 in a different costume: equality in R cares about storage type, not just printed digits.

</details>

### Exercise 2.2: See the recycling rule fire (and warn) on mismatched lengths

**Task:** A code reviewer wants to make the recycling rule visible. Add the length-6 vector `1:6` to the length-2 vector `c(10, 20)`, then add it to the length-4 vector `c(10, 20, 30, 40)`. The first add reuses the short vector cleanly; the second emits a warning because the longer length is not a multiple of the shorter. Capture both results plus the warning text into a named list with elements `clean`, `mismatch`, and `warning_msg`. Save to `ex_2_2`.

**Expected result:**

```
#> $clean
#> [1] 11 22 13 24 15 26
#>
#> $mismatch
#> [1] 11 22 33 44 15 26
#>
#> $warning_msg
#> [1] "longer object length is not a multiple of shorter object length"
```

**Difficulty:** Intermediate

[HINTS]
The short vector gets reused to match the longer one; an inexact reuse raises a message you need to intercept rather than let abort.
Capture the text with `withCallingHandlers()`, reading it via `conditionMessage()` and clearing it with `invokeRestart("muffleWarning")`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
clean    <- 1:6 + c(10, 20)
mismatch <- withCallingHandlers(
  1:6 + c(10, 20, 30, 40),
  warning = function(w) {
    msg <<- conditionMessage(w)
    invokeRestart("muffleWarning")
  }
)
ex_2_2 <- list(clean = clean, mismatch = mismatch, warning_msg = msg)
ex_2_2
```

**Explanation:** R recycles the shorter operand to the length of the longer one, position by position. When `6 / 2 == 3` cleanly, no warning. When `6 / 4 == 1.5`, R still completes the operation (recycling `c(10, 20, 30, 40, 10, 20)`) but warns you that the recycling was not exact. Catching the warning with `withCallingHandlers()` plus `muffleWarning` lets you inspect it without aborting; `tryCatch()` would have stopped the expression. The recycling rule is the single biggest source of silent vector bugs in R, so when you see "not a multiple" treat it as an error to fix.

</details>

### Exercise 2.3: Replace a for-loop with a single vectorized expression

**Task:** A statistician inherits a function that computes the standardized value `(x[i] - mean(x)) / sd(x)` inside a for-loop, and asks for the one-line vectorized rewrite. Using `mtcars$mpg`, produce the z-scored mpg vector in a single expression (no `for`, no `sapply`). Save the result to `ex_2_3` and confirm it has mean 0 and sd 1.

**Expected result:**

```
#> head(ex_2_3, 5)
#> [1]  0.1508  0.1508  0.4495 -0.2300  0.6101
#>
#> mean(ex_2_3)
#> [1] 7.112e-17
#> sd(ex_2_3)
#> [1] 1
```

**Difficulty:** Advanced

[HINTS]
Arithmetic in R spreads a single scalar across an entire column, so the standardizing formula needs no index walking.
Subtract `mean(mtcars$mpg)` from the column and divide by `sd(mtcars$mpg)` in one expression.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- (mtcars$mpg - mean(mtcars$mpg)) / sd(mtcars$mpg)
round(head(ex_2_3, 5), 4)
#> [1]  0.1509  0.1509  0.4495 -0.2301  0.6102

c(mean = mean(ex_2_3), sd = sd(ex_2_3))
#>          mean            sd
#>  7.112000e-17  1.000000e+00
```

**Explanation:** Every arithmetic operator in R is vectorized, so subtraction broadcasts the scalar `mean(mtcars$mpg)` across the whole column and division broadcasts the scalar `sd(...)` the same way. There is no need to walk indices one at a time. The mean of the result is exactly 0 in theory and a tiny float artifact (`7e-17`) in practice; this floating-point residue is harmless and is why you should compare floats with `all.equal()`, not `==`. The base helper `scale(x)[, 1]` does the same calculation if you want a one-shot version.

</details>

## Section 3. Logical operations and comparisons (3 problems)

### Exercise 3.1: Find indices where a condition holds with which()

**Task:** A scout reviewing `mtcars` wants the positions (not the values) of every car whose `mpg` is strictly greater than 25 and whose `wt` is less than 2. Return an integer vector of row indices, sorted ascending. Use `which()` rather than logical subsetting. Save the vector to `ex_3_1`.

**Expected result:**

```
#> [1]  3 18 19 20 26 28
```

**Difficulty:** Intermediate

[HINTS]
You want the slot numbers where a condition holds, not the matching values themselves.
Pass the combined condition `mtcars$mpg > 25 & mtcars$wt < 2` to `which()`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- which(mtcars$mpg > 25 & mtcars$wt < 2)
ex_3_1
#> [1]  3 18 19 20 26 28

rownames(mtcars)[ex_3_1]
#> [1] "Datsun 710"      "Fiat 128"        "Honda Civic"     "Toyota Corolla"
#> [5] "Fiat X1-9"       "Lotus Europa"
```

**Explanation:** `which()` converts a logical vector to the integer positions of its `TRUE` entries, which is exactly what you need when downstream code (a plotting helper, a row-removal step, a join key) expects indices rather than a boolean mask. Note that `which()` silently drops `NA` from its input, unlike a raw boolean subset where `NA` indices would expand the result. Use the vectorized `&` here, not the short-circuiting `&&`, which only looks at the first element of each side and will give you the wrong answer for vectors longer than 1.

</details>

### Exercise 3.2: Pick the right AND operator (& versus &&) for a vector

**Task:** A reviewer caught a bug where someone used `&&` to test a vector condition and silently lost most of the data. Build a length-4 logical vector `a <- c(TRUE, TRUE, FALSE, TRUE)` and `b <- c(TRUE, FALSE, TRUE, TRUE)`. Compute `a & b` (element-wise) and `a && b` (short-circuit) and combine both into a named list with elements `elementwise` and `shortcircuit`. Save it to `ex_3_2`.

**Expected result:**

```
#> $elementwise
#> [1]  TRUE FALSE FALSE  TRUE
#>
#> $shortcircuit
#> [1] TRUE
```

**Difficulty:** Advanced

[HINTS]
One operator compares every position in step; the other weighs only the first element of each side and returns a single result.
Compute `a & b` and `a && b` separately and store them as `list(elementwise = ..., shortcircuit = ...)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- c(TRUE, TRUE, FALSE, TRUE)
b <- c(TRUE, FALSE, TRUE, TRUE)
ex_3_2 <- list(
  elementwise  = a & b,
  shortcircuit = a && b
)
ex_3_2
#> $elementwise
#> [1]  TRUE FALSE FALSE  TRUE
#>
#> $shortcircuit
#> [1] TRUE
```

**Explanation:** `&` is vectorized and returns one logical per position; `&&` only inspects the first element of each side and returns a single scalar, which is exactly what you want inside `if (...)` and almost never what you want for filtering. Since R 4.3, `&&` and `||` on length-greater-than-1 vectors throw an error rather than the historical silent behaviour, but in plenty of installed packages and stack-overflow snippets you will still see the old form. The rule of thumb: use `&` and `|` for data, `&&` and `||` only inside scalar control flow.

</details>

### Exercise 3.3: Use any() and all() while handling NA explicitly

**Task:** A QA engineer is auditing a vector that may contain `NA`. For `v <- c(2, 4, NA, 6, 8)`, compute four checks: `any(v > 5)`, `any(v > 5, na.rm = TRUE)`, `all(v > 0)`, and `all(v > 0, na.rm = TRUE)`. Combine all four into a named logical vector with names `any_na`, `any_clean`, `all_na`, and `all_clean`. Save to `ex_3_3`.

**Expected result:**

```
#>    any_na any_clean    all_na all_clean
#>      TRUE      TRUE        NA      TRUE
```

**Difficulty:** Intermediate

[HINTS]
A missing value affects whether a "does any" check and a "do all" check can commit to an answer, and the two react differently.
Call `any()` and `all()` each twice, once plain and once with `na.rm = TRUE`, then name the four results in `c()`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
v <- c(2, 4, NA, 6, 8)
ex_3_3 <- c(
  any_na    = any(v > 5),
  any_clean = any(v > 5, na.rm = TRUE),
  all_na    = all(v > 0),
  all_clean = all(v > 0, na.rm = TRUE)
)
ex_3_3
#>    any_na any_clean    all_na all_clean
#>      TRUE      TRUE        NA      TRUE
```

**Explanation:** `any()` can return `TRUE` even with `NA` in the input as soon as it finds at least one confirmed `TRUE`, because no unknown value can change the answer. `all()` cannot return `TRUE` while an `NA` is unresolved because that unknown might be `FALSE`, so it returns `NA` by default. Passing `na.rm = TRUE` drops the `NA` before evaluating. The lesson: never trust an unparameterized `all()` on data that might have missing values; the silent `NA` propagation can disguise a "passes all checks" signal as merely "unknown".

</details>

## Section 4. Indexing and subsetting (3 problems)

### Exercise 4.1: Subset a vector with positive and negative indices

**Task:** Starting from `v <- c(10, 20, 30, 40, 50, 60)`, build a named list with three elements: `first_three` (positions 1, 2, 3 via positive indexing), `not_first_three` (everything except positions 1, 2, 3 via negative indexing), and `ends` (positions 1 and 6 only). Save the list to `ex_4_1`.

**Expected result:**

```
#> $first_three
#> [1] 10 20 30
#>
#> $not_first_three
#> [1] 40 50 60
#>
#> $ends
#> [1] 10 60
```

**Difficulty:** Beginner

[HINTS]
Positive positions pick what to keep; negative positions say what to leave out.
Use `v[1:3]`, `v[-(1:3)]`, and `v[c(1, length(v))]` as the three elements of a `list()`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
v <- c(10, 20, 30, 40, 50, 60)
ex_4_1 <- list(
  first_three     = v[1:3],
  not_first_three = v[-(1:3)],
  ends            = v[c(1, length(v))]
)
ex_4_1
```

**Explanation:** R is 1-indexed, and positive integers pick positions while negative integers drop them. You cannot mix positive and negative indices in a single bracket: `v[c(1, -2)]` is an error. Using `length(v)` instead of hardcoding `6` is a habit worth forming early; the day someone changes the vector to length 7, `v[c(1, 6)]` quietly produces the wrong answer while `v[c(1, length(v))]` keeps working.

</details>

### Exercise 4.2: Filter mtcars rows with a logical mask

**Task:** A consultant preparing a fuel-efficiency briefing wants the subset of `mtcars` where `mpg` is at least 25 AND `cyl` equals 4, keeping only the columns `mpg`, `cyl`, `hp`, and `wt`. Use logical subsetting (a `TRUE`/`FALSE` mask), not row numbers, so the code remains correct if rows are reordered. Save the resulting data frame to `ex_4_2`.

**Expected result:**

```
#>                 mpg cyl  hp    wt
#> Fiat 128       32.4   4  66 2.200
#> Honda Civic    30.4   4  52 1.615
#> Toyota Corolla 33.9   4  65 1.835
#> Fiat X1-9      27.3   4  66 1.935
#> Porsche 914-2  26.0   4  91 2.140
#> Lotus Europa   30.4   4 113 1.513
#> Volvo 142E     21.4   4 109 2.780
```

**Difficulty:** Intermediate

[HINTS]
Build a true/false flag per row so the selection stays correct even if rows are later reordered.
Make a mask `mtcars$mpg >= 25 & mtcars$cyl == 4`, then index rows with `mtcars[mask, c("mpg", "cyl", "hp", "wt")]`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
keep <- mtcars$mpg >= 25 & mtcars$cyl == 4
ex_4_2 <- mtcars[keep, c("mpg", "cyl", "hp", "wt")]
ex_4_2
```

**Explanation:** A logical mask is more robust than positional indexing because it keeps tracking the right rows even after sorts and joins reshuffle the table. Putting the mask in `keep` first lets you reuse it (for an `apply()` count, a print of dropped rows, an audit log) without recomputing. The condition for `cyl` uses `==` because we want exact membership; `cyl <= 4` would also include any imaginary 1, 2, 3-cylinder rows, which the data does not have but a hand-typed filter should still reject deliberately.

</details>

### Exercise 4.3: Tell apart single bracket and double bracket on a list

**Task:** A student is debugging a function that returned a list when they expected a vector. Construct `lst <- list(a = 1:3, b = letters[1:3], c = c(TRUE, FALSE))`. Extract element `b` two different ways: with single bracket `lst["b"]` (returns a sublist) and with double bracket `lst[["b"]]` (returns the bare vector). Wrap both results plus their `class()` into a named list with four elements `single`, `single_class`, `double`, and `double_class`. Save to `ex_4_3`.

**Expected result:**

```
#> $single
#> $single$b
#> [1] "a" "b" "c"
#>
#>
#> $single_class
#> [1] "list"
#>
#> $double
#> [1] "a" "b" "c"
#>
#> $double_class
#> [1] "character"
```

**Difficulty:** Advanced

[HINTS]
One extractor keeps the wrapping container; the other reaches inside a slot and hands back the bare contents.
Compare `lst["b"]` against `lst[["b"]]`, and record each one's `class()` in the result list.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lst <- list(a = 1:3, b = letters[1:3], c = c(TRUE, FALSE))
single <- lst["b"]
double <- lst[["b"]]
ex_4_3 <- list(
  single       = single,
  single_class = class(single),
  double       = double,
  double_class = class(double)
)
ex_4_3
```

**Explanation:** `[` preserves the container: subsetting a list with single bracket always returns a (shorter) list, even when you ask for exactly one element. `[[` extracts the contents of a single slot, so a list of one character vector becomes the bare character vector itself. The third common form, `$`, is equivalent to `[[` for named lists but does not work with computed names. The rule of thumb: use `[[` when you want the value inside a slot; use `[` only when you really want to keep the wrapping list. Misuse here is the single most common cause of "why is my data a list?" debugging sessions.

</details>

## Section 5. Strings, factors, and missing values (3 problems)

### Exercise 5.1: Build paths and labels with paste() versus paste0()

**Task:** An ETL engineer is generating quarterly filenames like `report_2026Q1.csv` from a year and a quarter. Given `year <- 2026` and `quarter <- 1:4`, produce a length-4 character vector with one filename per quarter, using `paste0()` (no separator) rather than `paste()` (which would insert a space). Save the vector to `ex_5_1`.

**Expected result:**

```
#> [1] "report_2026Q1.csv" "report_2026Q2.csv" "report_2026Q3.csv" "report_2026Q4.csv"
```

**Difficulty:** Intermediate

[HINTS]
You need to glue tokens together with no spaces between them, while the quarter values spread across all four results.
Use `paste0("report_", year, "Q", quarter, ".csv")`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
year    <- 2026
quarter <- 1:4
ex_5_1  <- paste0("report_", year, "Q", quarter, ".csv")
ex_5_1
#> [1] "report_2026Q1.csv" "report_2026Q2.csv" "report_2026Q3.csv" "report_2026Q4.csv"
```

**Explanation:** `paste0()` is `paste(..., sep = "")`; using it directly avoids the constant ceremony of passing `sep = ""` to glue tokens together without spaces. Notice the vectorization: `quarter` is length 4 and the scalars get recycled, so a single call produces all four filenames. For more complex templates with named placeholders, `sprintf("report_%dQ%d.csv", year, quarter)` or `glue::glue("report_{year}Q{quarter}.csv")` are more readable; for two or three tokens, `paste0()` wins on terseness.

</details>

### Exercise 5.2: Measure and slice strings with nchar() and substr()

**Task:** A reviewer of imported survey data wants a sanity check. Given the character vector `s <- c("apple", "banana", "kiwi", "watermelon")`, build a data frame with three columns: `word` (the original), `length` (the number of characters via `nchar()`), and `first3` (the first three characters via `substr()`). Save it to `ex_5_2`.

**Expected result:**

```
#>         word length first3
#> 1      apple      5    app
#> 2     banana      6    ban
#> 3       kiwi      4    kiw
#> 4 watermelon     10    wat
```

**Difficulty:** Intermediate

[HINTS]
One helper counts how many characters each string has; another returns a slice of each string by position.
Build a `data.frame()` with `nchar(s)` for the length column and `substr(s, 1, 3)` for the first-three column.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s <- c("apple", "banana", "kiwi", "watermelon")
ex_5_2 <- data.frame(
  word   = s,
  length = nchar(s),
  first3 = substr(s, 1, 3),
  stringsAsFactors = FALSE
)
ex_5_2
```

**Explanation:** Both `nchar()` and `substr()` are vectorized over their main argument, so a single call handles all four words without an explicit loop. `substr(s, start, stop)` is end-inclusive (positions 1 through 3 give three characters), unlike Python's `s[0:3]` slicing. For strings shorter than `stop`, `substr()` silently returns whatever exists rather than padding or erroring, which is a behaviour you should remember when validating fixed-width inputs. Setting `stringsAsFactors = FALSE` is a safety habit on R versions before 4.0; the default flipped in 4.0 but explicit beats implicit.

</details>

### Exercise 5.3: Order a factor with explicit levels and drop unused ones

**Task:** A product manager has survey responses in the vector `resp <- c("low", "high", "medium", "low", "high")` and wants an ordered factor with `low < medium < high`. After building the factor, take only the first three elements (so `"medium"` is present once but the levels `"low"` and `"high"` still appear), then call `droplevels()` on a subset that excludes `"medium"` so the unused level disappears. Save a named list with elements `ordered` (the ordered factor for all five responses) and `dropped` (the cleaned subset) to `ex_5_3`.

**Expected result:**

```
#> $ordered
#> [1] low    high   medium low    high
#> Levels: low < medium < high
#>
#> $dropped
#> [1] low  high low  high
#> Levels: low < high
```

**Difficulty:** Advanced

[HINTS]
Spell out the rank order yourself instead of accepting the alphabetical default, then clean up categories no row uses.
Call `factor(resp, levels = c("low", "medium", "high"), ordered = TRUE)`, then `droplevels()` on the subset that excludes "medium".

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- c("low", "high", "medium", "low", "high")
ordered_resp <- factor(resp, levels = c("low", "medium", "high"), ordered = TRUE)
no_medium    <- droplevels(ordered_resp[ordered_resp != "medium"])

ex_5_3 <- list(ordered = ordered_resp, dropped = no_medium)
ex_5_3
```

**Explanation:** Passing `levels = ...` overrides the default alphabetical ordering, which would otherwise put `"high"` before `"low"` and break any model or plot that respects factor order. `ordered = TRUE` turns the factor into an ordered factor (class `c("ordered", "factor")`), so comparison operators like `<` work correctly. Subsetting a factor preserves all original levels even when no observations use them, which is why categorical models can mysteriously refuse to converge after filtering. `droplevels()` removes the orphans and is the right cleanup step after any filter that narrows a factor column.

</details>

## Section 6. Functions and control flow (3 problems)

### Exercise 6.1: Write your first function with a default argument

**Task:** A reporting analyst wants a reusable summarizer. Write a function `summarise_vec(x, digits = 2)` that returns a named numeric vector with `n`, `mean`, `sd`, `min`, and `max`, each rounded to `digits` decimal places. Call it on `mtcars$mpg` with the default `digits` and save the resulting vector to `ex_6_1`.

**Expected result:**

```
#>     n  mean    sd   min   max
#> 32.00 20.09  6.03 10.40 33.90
```

**Difficulty:** Intermediate

[HINTS]
Give the rounding precision a fallback value so the function works whether or not the caller supplies it.
Define `summarise_vec <- function(x, digits = 2)` and `round()` a named `c(n = , mean = , sd = , min = , max = )` vector.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
summarise_vec <- function(x, digits = 2) {
  round(c(
    n    = length(x),
    mean = mean(x),
    sd   = sd(x),
    min  = min(x),
    max  = max(x)
  ), digits)
}
ex_6_1 <- summarise_vec(mtcars$mpg)
ex_6_1
#>     n  mean    sd   min   max
#> 32.00 20.09  6.03 10.40 33.90
```

**Explanation:** A default value (`digits = 2`) makes the function pleasant to call without arguments yet still tunable when needed. Naming the elements at construction time (via `c(name = value)`) is cheaper and more readable than building the vector first and adding `names()` afterward. Two real-world refinements you would add next: an `na.rm` argument that you pass through to `mean`, `sd`, `min`, and `max`, and a guard `if (!is.numeric(x)) stop("x must be numeric")` so the function fails fast on bad inputs instead of cascading cryptic warnings.

</details>

### Exercise 6.2: Choose between if/else and the vectorized ifelse()

**Task:** A junior analyst writes a per-row `if/else` and is puzzled that it errors on a vector of length 32. For the vector `mtcars$mpg`, label every row "efficient" if `mpg >= 25` and "thirsty" otherwise. Show two solutions side by side in a length-2 named list with elements `vectorised` (using `ifelse()`) and `looped` (using a `for` loop that builds a character vector of the same length). Save the list to `ex_6_2`.

**Expected result:**

```
#> $vectorised
#>  [1] "thirsty"   "thirsty"   "thirsty"   "thirsty"   "thirsty"
#>  [6] "thirsty"   "thirsty"   "thirsty"   "thirsty"   "thirsty"
#> ...
#> # 22 more entries hidden, both vectors identical
#>
#> identical(ex_6_2$vectorised, ex_6_2$looped)
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Scalar branching expects one condition at a time, so labeling a whole column needs a branch that walks elementwise.
Use `ifelse(mtcars$mpg >= 25, "efficient", "thirsty")` for one element and a `for` loop over `seq_along()` for the other.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vectorised <- ifelse(mtcars$mpg >= 25, "efficient", "thirsty")

looped <- character(length(mtcars$mpg))
for (i in seq_along(mtcars$mpg)) {
  if (mtcars$mpg[i] >= 25) looped[i] <- "efficient" else looped[i] <- "thirsty"
}

ex_6_2 <- list(vectorised = vectorised, looped = looped)
identical(ex_6_2$vectorised, ex_6_2$looped)
#> [1] TRUE
```

**Explanation:** `if (cond) ... else ...` is scalar control flow: it expects a length-1 logical and warns or errors otherwise. `ifelse(test, yes, no)` is vectorized and walks elementwise, which is why it just works on the full column. The loop version is correct but slower and noisier; for simple two-branch labels, prefer `ifelse()`. For more than two branches, reach for `dplyr::case_when()` or a lookup-table join, both of which scale to many conditions far more readably than nested `ifelse()` calls.

</details>

### Exercise 6.3: Build a running total with a preallocated for-loop

**Task:** A finance team wants a worked example of the right way to write a for-loop that has to keep state (a running cumulative sum is a stand-in for daily portfolio P&L). Given `x <- c(2, 5, 1, 8, 3, 6)`, compute the cumulative sum in two ways: first preallocate `out <- numeric(length(x))` and fill it in a `for` loop, then compute the same answer with the built-in `cumsum()`. Combine both into a named list with elements `loop` and `builtin`, and save to `ex_6_3`.

**Expected result:**

```
#> $loop
#> [1]  2  7  8 16 19 25
#>
#> $builtin
#> [1]  2  7  8 16 19 25
#>
#> identical(ex_6_3$loop, ex_6_3$builtin)
#> [1] TRUE
```

**Difficulty:** Advanced

[HINTS]
Size the output container up front rather than growing it each pass, and compare against R's built-in running-sum helper.
Preallocate with `numeric(length(x))`, fill it in a `for` loop over `seq_along(x)[-1]`, and compare to `cumsum(x)`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- c(2, 5, 1, 8, 3, 6)

out <- numeric(length(x))
out[1] <- x[1]
for (i in seq_along(x)[-1]) {
  out[i] <- out[i - 1] + x[i]
}

ex_6_3 <- list(loop = out, builtin = cumsum(x))
identical(ex_6_3$loop, ex_6_3$builtin)
#> [1] TRUE
```

**Explanation:** The two key mistakes a beginner makes in a stateful loop are growing the output with `c(out, value)` (which reallocates on every iteration and turns a fast O(n) job into O(n^2)) and iterating with `1:length(x)` (which silently iterates `1:0 = c(1, 0)` when `x` is empty). Preallocating `out` and using `seq_along(x)[-1]` avoids both traps. For genuinely stateful work like exponentially weighted averages or sequential simulations, an explicit loop is fine; for plain cumulative reductions, `cumsum()`, `cumprod()`, or `Reduce()` are clearer and faster.

</details>

## What to do next

You have covered the syntax surface area: variables, types, vectors, indexing, logical operations, strings, factors, and your first user-defined function. The next step is leaving base R for the workflow ecosystem.

- [Apply Family Exercises](Apply-Family-Exercises-in-R.html) for the next stage of vectorized thinking with `sapply()`, `vapply()`, and `Map()`.
- [dplyr filter/select Exercises](dplyr-filter-select-Exercises.html) to move from base subsetting to the more readable dplyr verbs.
- [Loops vs Vectorization Exercises](Loops-vs-Vectorization-Exercises-in-R.html) to drill the performance habit of choosing the right tool for the job.
- [Data Wrangling Exercises](Data-Wrangling-Exercises-in-R.html) for an end-to-end workout on real-shaped data once you are comfortable with these basics.
