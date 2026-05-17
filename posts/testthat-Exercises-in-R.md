---
title: "testthat Exercises in R: 17 Real-World Practice Problems"
slug: "testthat-Exercises-in-R"
description: "17 testthat exercises in R covering expect_equal, expect_identical, errors, warnings, fixtures, withr, mocks, and custom expectations. Solutions hidden."
keywords: "testthat R exercises, R unit testing practice, expect_equal in R, test_that examples"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "testthat Exercises"
sidebar_order: 169
fr_parent: "R-Tutorial.html"
auto_link_terms: "testthat exercises|testthat tutorial|r unit testing|test_that block|expect_equal in r|unit tests in r"
auto_link_case_sensitive: false
target_keyword: "testthat R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# testthat Exercises in R: 17 Real-World Practice Problems

<p class="lead">Seventeen hands-on testthat exercises covering equality matchers, type and shape contracts, error and warning assertions, test structure, fixtures with withr, parametrized checks, and custom expectations. Each problem has a hidden solution with an explanation of when to reach for that pattern in real testing work.</p>

```r title="Run this once before any exercise"
library(testthat)
library(withr)
library(purrr)
```

## Section 1. Equality and identity (3 problems)

### Exercise 1.1: Verify a simple function with expect_equal

**Task:** A junior developer onboarding wants to confirm a tiny `square()` helper behaves sensibly before wiring it into a larger pipeline. Define `square <- function(x) x^2` and write a `test_that()` block titled "square works on positives" that asserts `square(2)` equals `4` and `square(3)` equals `9` using `expect_equal()`. Save the test return value to `ex_1_1`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Beginner

[HINTS]
You need a labelled group that holds two checks, each confirming a computed value matches a known answer.
Wrap two `expect_equal()` calls inside a `test_that("square works on positives", { ... })` and assign the whole thing to `ex_1_1`.

```r title="Your turn"
square <- function(x) x^2
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
square <- function(x) x^2

ex_1_1 <- test_that("square works on positives", {
  expect_equal(square(2), 4)
  expect_equal(square(3), 9)
})
ex_1_1
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_equal()` compares numerically with a default `tolerance` of about `1.5e-8`, which is the right choice when floating point noise could otherwise cause spurious failures (`0.1 + 0.2 == 0.3` returns `FALSE`, but `expect_equal()` treats them as equal). `test_that()` groups related expectations under one label, returns `TRUE` invisibly on success, and prints a reporter line. If you need strict bit-for-bit equality, reach for `expect_identical()` instead.

</details>

### Exercise 1.2: Catch integer-vs-double mismatches with expect_identical

**Task:** A data engineer is hardening a CSV importer that must return `years` as `integer` (not `double`) so a downstream join on a SQL `INT` column does not silently break. Define `years <- 2020:2023` (integer). Write a `test_that()` block "years are integer typed" that uses both `expect_identical(years, 2020:2023)` and `expect_type(years, "integer")` to lock the value and the storage type. Save the test return to `ex_1_2`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Numeric value alone is not enough here - the storage type is also part of what you are locking down.
Use `expect_identical(years, 2020:2023)` together with `expect_type(years, "integer")` inside a `test_that()` block.

```r title="Your turn"
years <- 2020:2023
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
years <- 2020:2023

ex_1_2 <- test_that("years are integer typed", {
  expect_identical(years, 2020:2023)
  expect_type(years, "integer")
})
ex_1_2
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_identical()` requires the values AND types to match exactly, so it would FAIL if you wrote `expect_identical(years, c(2020, 2021, 2022, 2023))` because the right side is `double`. This is the right matcher whenever the storage type is part of the contract (`integer` for IDs and counts, `factor` for ordered categories, `Date` for dates). Use `expect_equal()` when you only care about numeric value, `expect_identical()` when you also care about class and storage mode.

</details>

### Exercise 1.3: Compare sets without caring about order

**Task:** An ETL pipeline returns a `levels` character vector whose order depends on a hashing step and is not stable across runs. The test must accept any permutation of {"a", "b", "c"}. Define `levels <- c("c", "a", "b")`. Write a `test_that()` block "levels contain a, b, c regardless of order" that uses `expect_setequal(levels, c("a", "b", "c"))`. Save the test return to `ex_1_3`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Order is not part of the contract, so you need a matcher that compares membership rather than position.
Call `expect_setequal(levels, c("a", "b", "c"))` inside the `test_that()` block.

```r title="Your turn"
levels <- c("c", "a", "b")
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
levels <- c("c", "a", "b")

ex_1_3 <- test_that("levels contain a, b, c regardless of order", {
  expect_setequal(levels, c("a", "b", "c"))
})
ex_1_3
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_setequal()` checks set membership in both directions: every element of `actual` is in `expected` and vice versa. It does not care about order or duplicates. This is the right matcher for outputs from hash maps, `unique()`, `dplyr::distinct()`, or any operation whose order is not part of the contract. If order matters, use `expect_equal()` or `expect_identical()` instead.

</details>

## Section 2. Shape, type, and class contracts (3 problems)

### Exercise 2.1: Predicate checks with expect_true and expect_false

**Task:** Write a `test_that()` block "is.numeric predicate behaves" that uses `expect_true(is.numeric(3.14))` to confirm a double counts as numeric and `expect_false(is.numeric("3.14"))` to confirm a string does not. Save the test return to `ex_2_1`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Beginner

[HINTS]
You are asserting that one predicate result is affirmatively true and another is affirmatively false.
Use `expect_true(is.numeric(3.14))` and `expect_false(is.numeric("3.14"))` inside a `test_that()` block.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- test_that("is.numeric predicate behaves", {
  expect_true(is.numeric(3.14))
  expect_false(is.numeric("3.14"))
})
ex_2_1
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_true()` and `expect_false()` are the simplest matchers, but they hide what was actually compared on failure (the report will say "is.numeric('3.14') isn't TRUE" with no context). For richer failure output, prefer dedicated matchers like `expect_type()`, `expect_s3_class()`, or `expect_gt()` whenever one applies. Keep `expect_true()`/`expect_false()` for boolean predicates that have no dedicated matcher.

</details>

### Exercise 2.2: Lock the shape of a return value with expect_length and expect_named

**Task:** A reporting analyst writes a `summary_stats()` helper that returns a named numeric vector of three summary statistics. Define `summary_stats <- function(x) c(mean = mean(x), sd = sd(x), n = length(x))`. Write a `test_that()` block "summary_stats has correct shape" with `expect_length(summary_stats(1:10), 3)` and `expect_named(summary_stats(1:10), c("mean", "sd", "n"))`. Save the test return to `ex_2_2`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Check both how many slots the return value has and what those slots are called.
Combine `expect_length(..., 3)` and `expect_named(..., c("mean", "sd", "n"))` on `summary_stats(1:10)`.

```r title="Your turn"
summary_stats <- function(x) c(mean = mean(x), sd = sd(x), n = length(x))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
summary_stats <- function(x) c(mean = mean(x), sd = sd(x), n = length(x))

ex_2_2 <- test_that("summary_stats has correct shape", {
  expect_length(summary_stats(1:10), 3)
  expect_named(summary_stats(1:10), c("mean", "sd", "n"))
})
ex_2_2
#> Test passed
#> [1] TRUE
```

**Explanation:** Shape contracts catch regressions where a downstream change accidentally drops a column, renames a slot, or returns a vector of the wrong length. `expect_length()` is cheaper than `expect_equal(length(...), n)` and produces a clearer failure message. `expect_named()` accepts an `ignore.order = TRUE` argument when name order is not part of the contract. Pair these with value checks when both the structure and the contents matter.

</details>

### Exercise 2.3: Verify model object class with expect_s3_class and expect_type

**Task:** A modeling team wraps `lm()` in `fit_lm <- function(d) lm(mpg ~ wt, data = d)` and wants a smoke test that the returned object is still an `lm`. Write a `test_that()` block "fit_lm returns an lm object" with `expect_s3_class(fit_lm(mtcars), "lm")` to verify class and `expect_type(fit_lm(mtcars), "list")` to verify the underlying storage type. Save the test return to `ex_2_3`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Confirm both the advertised class label of the object and the storage kind underneath it.
Pair `expect_s3_class(fit_lm(mtcars), "lm")` with `expect_type(fit_lm(mtcars), "list")`.

```r title="Your turn"
fit_lm <- function(d) lm(mpg ~ wt, data = d)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_lm <- function(d) lm(mpg ~ wt, data = d)

ex_2_3 <- test_that("fit_lm returns an lm object", {
  expect_s3_class(fit_lm(mtcars), "lm")
  expect_type(fit_lm(mtcars), "list")
})
ex_2_3
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_s3_class()` checks the S3 class attribute (use `expect_s4_class()` for S4). `expect_type()` checks the underlying `typeof()`, which is one of "logical", "integer", "double", "character", "list", "closure", etc. An `lm` object is an S3 list, so both matchers should pass. This pairing is useful when refactoring: if a maintainer accidentally converts an `lm` object into a tibble, `expect_s3_class()` still passes on the wrong type while `expect_type()` will catch it.

</details>

## Section 3. Errors, warnings, and clean execution (3 problems)

### Exercise 3.1: Verify a validator raises the right error message

**Task:** A validation helper `check_positive <- function(x) if (x <= 0) stop("x must be positive, got ", x) else x` should abort with a recognisable message when given non-positive input. Write a `test_that()` block "check_positive errors on zero" using `expect_error(check_positive(0), "must be positive")` to match a fragment of the error message via regex. Save the test return to `ex_3_1`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
You want to prove the function aborts, and that its complaint mentions the right reason.
Use `expect_error(check_positive(0), "must be positive")` so the second argument matches a fragment of the message.

```r title="Your turn"
check_positive <- function(x) if (x <= 0) stop("x must be positive, got ", x) else x
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
check_positive <- function(x) if (x <= 0) stop("x must be positive, got ", x) else x

ex_3_1 <- test_that("check_positive errors on zero", {
  expect_error(check_positive(0), "must be positive")
})
ex_3_1
#> Test passed
#> [1] TRUE
```

**Explanation:** The second argument to `expect_error()` is a regex pattern matched against the error message; using a stable substring rather than the full string keeps the test resilient when the message is reworded slightly. For typed errors (rlang::abort with a class), prefer `expect_error(..., class = "my_error_class")` which checks the condition class instead of the message text and survives any message rewording. Omitting the pattern entirely just asserts that an error of any kind occurred.

</details>

### Exercise 3.2: Confirm a deprecation warning is emitted

**Task:** A package maintainer is deprecating `old_api()` and wants the test suite to fail loudly if the deprecation warning is ever silently removed. Define `old_api <- function() { warning("old_api() is deprecated, use new_api()"); 1 }`. Write a `test_that()` block "old_api emits deprecation warning" using `expect_warning(old_api(), "deprecated")`. Save the test return to `ex_3_2`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Here the function should not stop, but it should raise a signal that the test can detect.
Call `expect_warning(old_api(), "deprecated")` inside the `test_that()` block.

```r title="Your turn"
old_api <- function() { warning("old_api() is deprecated, use new_api()"); 1 }
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
old_api <- function() {
  warning("old_api() is deprecated, use new_api()")
  1
}

ex_3_2 <- test_that("old_api emits deprecation warning", {
  expect_warning(old_api(), "deprecated")
})
ex_3_2
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_warning()` mirrors `expect_error()`: a regex pattern (or omitted to match any warning) plus an optional `class` argument for typed conditions. Note that calling `old_api()` inside `expect_warning()` SWALLOWS the warning, so the return value of `old_api()` (which is `1`) is not used here. If you need both the return value AND the warning check, capture the result: `result <- expect_warning(old_api(), "deprecated")`. Use `expect_message()` for `message()` calls.

</details>

### Exercise 3.3: Prove a function runs cleanly with expect_no_error

**Task:** A risk team CI step needs proof that `compute_var()` runs without any error or condition for a typical day of returns, so a green CI badge means the path is safe to deploy. Define `compute_var <- function(returns, p = 0.95) -quantile(returns, 1 - p, names = FALSE)` and `set.seed(1); returns <- rnorm(250, 0, 0.01)`. Write a `test_that()` block "compute_var runs cleanly on typical returns" using `expect_no_error(compute_var(returns))`. Save the test return to `ex_3_3`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Make the absence of any failure an explicit, named assertion rather than an unexamined side effect.
Wrap the call in `expect_no_error(compute_var(returns))` inside the `test_that()` block.

```r title="Your turn"
compute_var <- function(returns, p = 0.95) -quantile(returns, 1 - p, names = FALSE)
set.seed(1); returns <- rnorm(250, 0, 0.01)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
compute_var <- function(returns, p = 0.95) -quantile(returns, 1 - p, names = FALSE)
set.seed(1)
returns <- rnorm(250, 0, 0.01)

ex_3_3 <- test_that("compute_var runs cleanly on typical returns", {
  expect_no_error(compute_var(returns))
})
ex_3_3
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_no_error()` was added in testthat 3.0 to make "this code should not error" an explicit, named assertion rather than an implicit one. Without it, a clean run is just an unexamined side-effect of running the test, and a future refactor that introduces a regression would be detected only by a missing failure rather than a passing positive check. Sibling matchers `expect_no_warning()`, `expect_no_message()`, and `expect_no_condition()` make the same idea explicit for other condition types.

</details>

## Section 4. Structuring tests (3 problems)

### Exercise 4.1: Bundle related expectations under one test_that label

**Task:** Tests for a `normalize <- function(x) (x - mean(x)) / sd(x)` helper should jointly verify mean ~ 0, sd ~ 1, and unchanged length. Write ONE `test_that()` block "normalize standardizes correctly" containing all three `expect_equal()` calls on `normalize(1:100)`. Save the test return to `ex_4_1`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Beginner

[HINTS]
Three related properties of one behaviour belong together under a single descriptive label.
Inside one `test_that("normalize standardizes correctly", { ... })`, store `normalize(1:100)` and run three `expect_equal()` checks on its mean, sd, and length.

```r title="Your turn"
normalize <- function(x) (x - mean(x)) / sd(x)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
normalize <- function(x) (x - mean(x)) / sd(x)

ex_4_1 <- test_that("normalize standardizes correctly", {
  z <- normalize(1:100)
  expect_equal(mean(z), 0)
  expect_equal(sd(z), 1)
  expect_equal(length(z), 100)
})
ex_4_1
#> Test passed
#> [1] TRUE
```

**Explanation:** Group expectations that test ONE behaviour into a single `test_that()` block so a failure tells a coherent story; split them into separate blocks when they test independent behaviours. The label is what appears in the test report on failure, so phrase it as a true statement about the function ("normalize standardizes correctly") rather than a procedure ("test normalize"). All expectations in a block run even if an earlier one fails, so you see every issue at once.

</details>

### Exercise 4.2: Isolate failures with multiple test_that blocks

**Task:** A growth team wants the test report to flag valid-email and invalid-email failures separately so the on-call engineer can see which side of the predicate broke. Define `is_valid_email <- function(x) grepl("^[^@]+@[^@]+\\.[^@]+$", x)`. Write TWO separate `test_that()` blocks: "valid emails accepted" with `expect_true(is_valid_email("a@b.co"))`, and "invalid emails rejected" with `expect_false(is_valid_email("nope"))`. Save the SECOND test_that return to `ex_4_2`.

**Expected result:**

```
#> Test passed
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Splitting the positive case and the negative case gives the report two independent pass or fail signals.
Write two separate `test_that()` blocks - one with `expect_true(is_valid_email("a@b.co"))`, one with `expect_false(is_valid_email("nope"))` - and assign the second to `ex_4_2`.

```r title="Your turn"
is_valid_email <- function(x) grepl("^[^@]+@[^@]+\\.[^@]+$", x)
# first test_that here
ex_4_2 <- # second test_that here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
is_valid_email <- function(x) grepl("^[^@]+@[^@]+\\.[^@]+$", x)

test_that("valid emails accepted", {
  expect_true(is_valid_email("a@b.co"))
})

ex_4_2 <- test_that("invalid emails rejected", {
  expect_false(is_valid_email("nope"))
})
ex_4_2
#> Test passed
#> Test passed
#> [1] TRUE
```

**Explanation:** Separating positive and negative cases into their own `test_that()` blocks gives the report two independent pass/fail signals: if the regex breaks for valid emails only, "valid emails accepted" will fail and "invalid emails rejected" will still pass, which immediately points at the bug. Lump them together when they share a setup cost (a fitted model, a temp file); split them when they probe different behaviours that can fail independently.

</details>

### Exercise 4.3: Parametrize a check across many inputs with purrr::walk

**Task:** A statistician wants to verify `abs()` returns non-negative output for many sample inputs without writing dozens of `expect_*()` lines. Inside a `test_that()` block "abs is non-negative across inputs", use `purrr::walk(c(-5, -1.5, 0, 2.3, 100), function(x) expect_gte(abs(x), 0))` to loop the expectation over the sample. Save the test return to `ex_4_3`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Advanced

[HINTS]
Run the same expectation across a vector of inputs without repeating the assertion line by hand.
Inside the `test_that()` block, use `purrr::walk(c(-5, -1.5, 0, 2.3, 100), function(x) expect_gte(abs(x), 0))`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- test_that("abs is non-negative across inputs", {
  purrr::walk(c(-5, -1.5, 0, 2.3, 100), function(x) expect_gte(abs(x), 0))
})
ex_4_3
#> Test passed
#> [1] TRUE
```

**Explanation:** `purrr::walk()` runs a side-effecting function for each element and returns the input invisibly, which is the right shape for fanning expectations across cases without polluting the return value. The trade-off is that on failure the report points at the line inside the lambda, not at the specific input that failed; if you need that, switch to `purrr::iwalk()` and embed the input value in the expectation label, or use `expect_setequal(sapply(inputs, abs), expected)` for shape-equivalence checks.

</details>

## Section 5. Fixtures and isolation (3 problems)

### Exercise 5.1: Build an inline fixture inside the test

**Task:** Write a `test_that()` block "filter_adults keeps only age >= 18 rows" that builds a small inline data.frame fixture with three rows (one minor, two adults), defines `filter_adults <- function(d) d[d$age >= 18, ]`, then asserts the result has exactly 2 rows with `expect_equal(nrow(filter_adults(df)), 2)`. Save the test return to `ex_5_1`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Build the sample input right inside the test so the input and the expected outcome sit side by side.
Inside the `test_that()` block, create a 3-row `data.frame()` with an `age` column, then `expect_equal(nrow(filter_adults(df)), 2)`.

```r title="Your turn"
filter_adults <- function(d) d[d$age >= 18, ]
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
filter_adults <- function(d) d[d$age >= 18, ]

ex_5_1 <- test_that("filter_adults keeps only age >= 18 rows", {
  df <- data.frame(
    name = c("Alice", "Bob", "Carol"),
    age  = c(17, 35, 80)
  )
  expect_equal(nrow(filter_adults(df)), 2)
})
ex_5_1
#> Test passed
#> [1] TRUE
```

**Explanation:** Constructing the fixture INSIDE the `test_that()` block keeps the test self-contained: anyone reading the test sees the input and the expected output side by side, with no hidden state. For fixtures larger than a few rows or shared across many tests, factor them into a `helper-*.R` file in `tests/testthat/` so they load once per test run. Avoid loading real CSVs in tests; the slower IO and the implicit dependency on the file existing both undermine test reliability.

</details>

### Exercise 5.2: Scope a temp directory with withr::local_tempdir

**Task:** A data engineer's `save_summary <- function(df, path) write.csv(df, path, row.names = FALSE)` writes a CSV. The test must not pollute the working directory, so use `withr::local_tempdir()` inside a `test_that()` block "save_summary writes a CSV without polluting cwd" to switch into a per-test temp directory, call `save_summary(mtcars, "out.csv")`, then assert `expect_true(file.exists("out.csv"))`. Save the test return to `ex_5_2`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Advanced

[HINTS]
The test writes a file, so it must run in a throwaway location that is cleaned up automatically.
Call `withr::local_tempdir()` first inside the block, then `save_summary(mtcars, "out.csv")` and `expect_true(file.exists("out.csv"))`.

```r title="Your turn"
save_summary <- function(df, path) write.csv(df, path, row.names = FALSE)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
save_summary <- function(df, path) write.csv(df, path, row.names = FALSE)

ex_5_2 <- test_that("save_summary writes a CSV without polluting cwd", {
  withr::local_tempdir()
  save_summary(mtcars, "out.csv")
  expect_true(file.exists("out.csv"))
})
ex_5_2
#> Test passed
#> [1] TRUE
```

**Explanation:** `withr::local_tempdir()` creates a fresh directory, sets it as the working directory, and registers a cleanup that deletes it AND restores the original working directory when the calling frame exits (the `test_that()` block). This is the canonical pattern for file-touching tests because it guarantees isolation: a test cannot leak files into the repo, and parallel tests cannot collide on filenames. Companion helpers `withr::local_envvar()`, `withr::local_options()`, and `withr::local_dir()` apply the same scope-and-restore pattern to other global state.

</details>

### Exercise 5.3: Scope global options with withr::local_options

**Task:** A test must run with `options(digits = 3)` to make a printed-output assertion stable but restore the original `digits` value afterward so it does not leak into the next test. Inside a `test_that()` block "digits option scoped to the test", call `withr::local_options(list(digits = 3))` and then assert `expect_equal(getOption("digits"), 3)`. After the block exits, `getOption("digits")` returns to its previous value automatically. Save the test return to `ex_5_3`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Advanced

[HINTS]
Change a global setting for just the duration of the test so it does not leak into later tests.
Call `withr::local_options(list(digits = 3))` inside the block, then `expect_equal(getOption("digits"), 3)`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- test_that("digits option scoped to the test", {
  withr::local_options(list(digits = 3))
  expect_equal(getOption("digits"), 3)
})
ex_5_3
#> Test passed
#> [1] TRUE
```

**Explanation:** Global state mutations (options, env vars, locale, RNG seed, working directory) leak between tests and cause maddening order-dependent failures. `withr::local_options()` solves this by automatically restoring the previous value when the calling frame exits, even on error. A common alternative is `on.exit(options(old))` at the top of a test, but `local_options()` is shorter, harder to forget, and composes cleanly with other `local_*` helpers in the same block.

</details>

## Section 6. Advanced patterns (2 problems)

### Exercise 6.1: Compare named outputs with expect_mapequal regardless of key order

**Task:** A market data feed returns `prices <- list(GOOG = 142.3, AAPL = 178.5, MSFT = 410.1)` but the key order is not stable across reconnects. Write a `test_that()` block "prices match expected map" using `expect_mapequal(prices, list(AAPL = 178.5, GOOG = 142.3, MSFT = 410.1))` to assert the same key-value pairs in any order. Save the test return to `ex_6_1`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
The named pairs must match, but the order the keys appear in is not part of the contract.
Use `expect_mapequal(prices, list(AAPL = 178.5, GOOG = 142.3, MSFT = 410.1))` inside the `test_that()` block.

```r title="Your turn"
prices <- list(GOOG = 142.3, AAPL = 178.5, MSFT = 410.1)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- list(GOOG = 142.3, AAPL = 178.5, MSFT = 410.1)

ex_6_1 <- test_that("prices match expected map", {
  expect_mapequal(prices, list(AAPL = 178.5, GOOG = 142.3, MSFT = 410.1))
})
ex_6_1
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect_mapequal()` is to named lists what `expect_setequal()` is to unnamed vectors: equality of the key-value association regardless of key order. It is the right matcher for JSON responses, named lookup tables, or any structure where the natural identity is the mapping rather than the slot positions. If element order is part of the contract (e.g., a regression coefficient vector indexed by term position), stick with `expect_equal()`.

</details>

### Exercise 6.2: Build a custom expectation with expect()

**Task:** testthat's `expect()` is the primitive that every `expect_*()` matcher wraps under the hood. Define a custom matcher `expect_positive <- function(object) { expect(object > 0, sprintf("Got %s, expected > 0", object)); invisible(object) }`. Use it in a `test_that()` block "values are positive" with `expect_positive(5)` and `expect_positive(0.1)`. Save the test return to `ex_6_2`.

**Expected result:**

```
#> Test passed
#> [1] TRUE
```

**Difficulty:** Advanced

[HINTS]
Build your own matcher on top of the primitive that every built-in matcher is itself built from.
Define `expect_positive` to call `expect(object > 0, sprintf(...))` and return `invisible(object)`, then use it twice inside a `test_that()` block.

```r title="Your turn"
expect_positive <- # define your custom expectation here
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
expect_positive <- function(object) {
  expect(object > 0, sprintf("Got %s, expected > 0", object))
  invisible(object)
}

ex_6_2 <- test_that("values are positive", {
  expect_positive(5)
  expect_positive(0.1)
})
ex_6_2
#> Test passed
#> [1] TRUE
```

**Explanation:** `expect(condition, failure_message)` is the kernel of the testthat matcher protocol: it signals a pass when `condition` is `TRUE` and a fail (with `failure_message`) otherwise. Returning `invisible(object)` follows the convention of built-in matchers so custom matchers chain in a pipe (`result |> expect_positive() |> expect_lt(100)`). For full-featured matchers that quote their input nicely in failure reports, wrap the argument with `testthat::quasi_label()` to capture both the value and the unevaluated expression text.

</details>

## What to do next

- Anchor the basics in [R Functions](R-Functions.html), since every test you write is testing the behaviour of a function under specific inputs.
- Practise the language pieces tested most often in [Functional Programming in R Exercises](Functional-Programming-Exercises-in-R.html) and [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html).
- Tighten your assertion skills against side-effecting code with [Error Handling in R](Error-Handling-in-R.html) and its companion [Debugging in R Exercises](Debugging-in-R-Exercises-in-R.html).
