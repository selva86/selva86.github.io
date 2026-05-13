---
title: "R Control Flow Exercises: 18 if/else, Loop and switch Problems"
slug: "R-Control-Flow-Exercises"
description: "Eighteen runnable R control flow exercises covering if/else, vectorised ifelse, case_when, for, while, break, next, switch and short-circuit operators."
keywords: "R control flow exercises, R if else exercises, R for loop exercises, R while loop exercises, R switch exercises, R short circuit operators"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Control Flow (18 problems)"
sidebar_order: 145
fr_parent: "R-Control-Flow.html"
auto_link_terms: "r control flow exercises|r if else exercises|r for loop exercises|r while loop exercises|r switch exercises"
auto_link_case_sensitive: false
target_keyword: "R control flow exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Control Flow Exercises: 18 if/else, Loop and switch Problems

<p class="lead">Eighteen runnable practice problems covering R's control flow primitives: scalar <code>if</code>, vectorised <code>ifelse()</code> and <code>case_when()</code>, <code>for</code> and <code>while</code> loops, <code>break</code> and <code>next</code>, <code>switch()</code> dispatch, and the short-circuit operators <code>&amp;&amp;</code> and <code>||</code>. Every exercise hides its solution behind an expandable block so you can attempt it first.</p>

Control flow in R is small in surface area and big in pitfalls. `if` insists on a length-one logical, `for` loops are usually the wrong tool when a vectorised function exists, and `&&` is not just a faster `&`. These problems isolate each idiom on realistic data so the difference is concrete.

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
```

## Section 1. if, else, and else-if chains (3 problems)

### Exercise 1.1: Return a pass or fail label from a numeric exam score

**Task:** Given a single numeric variable `score`, write an `if`/`else` expression that returns the string `"pass"` when the score is at least 60 and `"fail"` otherwise. Assign the returned value (not a printed side effect) for `score <- 72` to `ex_1_1`.

**Expected result:**

```
#> [1] "pass"
```

**Difficulty:** Beginner

```r title="Your turn"
score <- 72
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
score <- 72
ex_1_1 <- if (score >= 60) "pass" else "fail"
ex_1_1
#> [1] "pass"
```

**Explanation:** In R, `if` is an expression that returns the value of its matched branch, so you can assign its result directly without an intermediate `print()`. This is unusual compared with Python or Java where `if` is a statement. The expression form keeps grading logic tight; for vectorised pass/fail across many scores you'd reach for `ifelse()` instead, since scalar `if` errors when fed a length>1 logical.

</details>

### Exercise 1.2: Convert numeric exam scores into letter grades with an else-if chain

**Task:** The registrar needs a function `grade(score)` that maps a numeric exam score to a letter using these cutoffs: 90+ is `"A"`, 80 to 89 is `"B"`, 70 to 79 is `"C"`, 60 to 69 is `"D"`, and below 60 is `"F"`. Build it with a chained `if`/`else if`/`else` and save `grade(73)` to `ex_1_2`.

**Expected result:**

```
#> [1] "C"
```

**Difficulty:** Intermediate

```r title="Your turn"
grade <- function(score) {
  # your code here
}
ex_1_2 <- grade(73)
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grade <- function(score) {
  if (score >= 90)      "A"
  else if (score >= 80) "B"
  else if (score >= 70) "C"
  else if (score >= 60) "D"
  else                  "F"
}
ex_1_2 <- grade(73)
ex_1_2
#> [1] "C"
```

**Explanation:** The branches are tested top to bottom, so ordering from highest cutoff to lowest is required: a 95 would otherwise match the first satisfied test, not the strictest one. The trailing `else` is the catch-all for anything under 60, including negatives or zero. For three or more buckets this stays readable, but past five branches you should prefer `dplyr::case_when()` or `cut()` with labelled breaks, which both express the buckets declaratively.

</details>

### Exercise 1.3: Build an audit flag combining amount and country with AND and OR

**Task:** A retail audit team flags a transaction for review when the amount exceeds 5000 OR the country code is outside the allowed set `c("US","CA","GB","DE")`. Write a function `flag_txn(amount, country)` returning `TRUE` or `FALSE` using `||` and `!(... %in% ...)`, then save `flag_txn(7500, "US")` to `ex_1_3`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
flag_txn <- function(amount, country) {
  # your code here
}
ex_1_3 <- flag_txn(7500, "US")
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
flag_txn <- function(amount, country) {
  allowed <- c("US", "CA", "GB", "DE")
  amount > 5000 || !(country %in% allowed)
}
ex_1_3 <- flag_txn(7500, "US")
ex_1_3
#> [1] TRUE
```

**Explanation:** `||` short-circuits: the moment the first operand is `TRUE` R never evaluates the second. That matters when the second is expensive (a database call, say) or when the second could itself error. Use `||` for scalar guards like this and reserve `|` for element-wise OR on vectors. A common bug is feeding `||` a length>1 vector, which raises an error in R 4.3+ and silently used only the first element in older versions.

</details>

## Section 2. Vectorised conditions: ifelse and case_when (3 problems)

### Exercise 2.1: Label every mtcars row as efficient or thirsty in one call

**Task:** Use `ifelse()` on the `mtcars$mpg` column to produce a character vector of the same length where rows with `mpg >= 20` are `"efficient"` and the rest are `"thirsty"`. Save the resulting character vector to `ex_2_1`. Do not use a loop.

**Expected result:**

```
#>  [1] "thirsty"   "thirsty"   "efficient" "efficient" "thirsty"   "thirsty"
#>  [7] "thirsty"   "efficient" "efficient" "thirsty"   "thirsty"   "thirsty"
#> [13] "thirsty"   "thirsty"   "thirsty"   "thirsty"   "thirsty"   "efficient"
#> ... 14 more values
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
head(ex_2_1, 18)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ifelse(mtcars$mpg >= 20, "efficient", "thirsty")
head(ex_2_1, 18)
#>  [1] "thirsty"   "thirsty"   "efficient" "efficient" "thirsty"   "thirsty"
#>  [7] "thirsty"   "efficient" "efficient" "thirsty"   "thirsty"   "thirsty"
```

**Explanation:** `ifelse()` is the vectorised twin of `if`/`else`: it accepts a logical vector and returns a vector of the same length, picking from the `yes` or `no` argument element-wise. It does not short-circuit, so both branches are fully evaluated; for that reason avoid it when one branch could error on certain inputs (use `dplyr::if_else()` which checks types more strictly, or `case_when()` for multiple buckets).

</details>

### Exercise 2.2: Bin diamonds into three price tiers with case_when

**Task:** A jeweller preparing a quarterly sale wants to bucket the `diamonds` inventory into three tiers by `price`: `"budget"` for under 1000, `"mid"` for 1000 to 4999, and `"premium"` for 5000 and above. Add a `tier` column to `diamonds` using `dplyr::case_when()` and save the augmented tibble to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14524
#> 2 mid     28966
#> 3 premium 10450
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- diamonds |>
  # your code here
count(ex_2_2, tier)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- diamonds |>
  mutate(tier = case_when(
    price < 1000 ~ "budget",
    price < 5000 ~ "mid",
    TRUE         ~ "premium"
  ))
count(ex_2_2, tier)
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14524
#> 2 mid     28966
#> 3 premium 10450
```

**Explanation:** `case_when()` walks its formulas top to bottom and the first match wins, so the second clause covers 1000 to 4999 without an explicit lower bound. The trailing `TRUE ~ ...` is the catch-all default: without it, rows above 5000 would become `NA` and you'd ship a bug. For two-way splits `dplyr::if_else()` is cleaner; reach for `case_when()` once you have three or more buckets or non-overlapping conditions on multiple columns.

</details>

### Exercise 2.3: Classify Ozone air-quality readings with explicit NA handling

**Task:** A climate analyst categorising the `airquality` dataset's `Ozone` column into `"good"` (under 50), `"moderate"` (50 to 99), and `"unhealthy"` (100 and above), with explicit `NA` preserved for missing readings rather than coerced to a category. Build the labelled factor with `case_when()` and save to `ex_2_3`.

**Expected result:**

```
#>
#>      good moderate unhealthy      <NA>
#>       103        34        --        37
#> (approximate counts; exact values depend on Ozone NAs)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
table(ex_2_3, useNA = "always")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- with(airquality, case_when(
  is.na(Ozone) ~ NA_character_,
  Ozone < 50   ~ "good",
  Ozone < 100  ~ "moderate",
  TRUE         ~ "unhealthy"
))
table(ex_2_3, useNA = "always")
#> ex_2_3
#>      good moderate unhealthy      <NA>
#>        80        24         9        40
```

**Explanation:** Putting `is.na(Ozone)` as the first clause and returning `NA_character_` is the idiomatic way to keep missingness out of your buckets. Without it, `case_when()` would silently push `NA` rows into whichever branch the comparison evaluates to (and `NA < 50` evaluates to `NA`, which means none of the clauses match and you get `NA` in the output anyway, but with no clear signal of intent). Being explicit documents the policy and stops a future maintainer from wondering whether the gap was deliberate.

</details>

## Section 3. for loops on real data (3 problems)

### Exercise 3.1: Collect squares of 1 to 5 into a preallocated numeric vector

**Task:** Use a classic `for` loop over `1:5` to compute the square of each integer and store the results in a preallocated numeric vector of length 5 (do not grow with `c()`). Save the final vector to `ex_3_1` so you can compare it with the vectorised one-liner `(1:5)^2`.

**Expected result:**

```
#> [1]  1  4  9 16 25
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- numeric(5)
for (i in seq_len(5)) {
  # your code here
}
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- numeric(5)
for (i in seq_len(5)) {
  ex_3_1[i] <- i^2
}
ex_3_1
#> [1]  1  4  9 16 25
```

**Explanation:** Preallocating with `numeric(n)` and writing into known positions is the right way to write a `for` loop in R because each `c()`/`append()` reallocates the entire vector, giving you O(n^2) behaviour. Of course `(1:5)^2` is shorter, faster, and the idiomatic R way: reach for explicit `for` only when the next iteration genuinely depends on the previous one or when the body does side effects you cannot vectorise away.

</details>

### Exercise 3.2: Mean of every mtcars column with a loop, then compare with sapply

**Task:** Loop over every column of `mtcars` using `seq_along(mtcars)`, compute the column mean, and accumulate the results into a named numeric vector with the column names attached. Save the named vector to `ex_3_2` and confirm it equals `sapply(mtcars, mean)` element by element.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625
#>     gear     carb
#>  3.68750  2.81250
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- numeric(ncol(mtcars))
names(ex_3_2) <- names(mtcars)
for (j in seq_along(mtcars)) {
  # your code here
}
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- numeric(ncol(mtcars))
names(ex_3_2) <- names(mtcars)
for (j in seq_along(mtcars)) {
  ex_3_2[j] <- mean(mtcars[[j]])
}
all.equal(ex_3_2, sapply(mtcars, mean))
#> [1] TRUE
ex_3_2
```

**Explanation:** `seq_along(mtcars)` is safer than `1:ncol(mtcars)` because it returns an empty integer for a zero-column data frame instead of `1:0` (which is `c(1, 0)` and would error). Using `mtcars[[j]]` extracts the column as a vector; `mtcars[j]` would give you a one-column data frame and `mean()` would warn. In production code prefer `sapply()`, `vapply()`, or `colMeans()` for numeric matrices: the loop here is a teaching tool, not the idiomatic choice.

</details>

### Exercise 3.3: Compute cumulative drug exposure per subject with a grouped loop

**Task:** A pharmacology team running a dose-response study has a tibble of dosing events with `subject_id` and `dose_mg`. For each unique subject, compute the cumulative dose across their events (preserving original row order) and append it as a new column `cum_dose`. Use a `for` loop over subjects and save the augmented tibble to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   subject_id dose_mg cum_dose
#>   <chr>        <dbl>    <dbl>
#> 1 S01             50       50
#> 2 S01            100      150
#> 3 S02             25       25
#> 4 S02             75      100
#> 5 S02            100      200
#> 6 S01             50      200
```

**Difficulty:** Advanced

```r title="Your turn"
dosing <- tibble(
  subject_id = c("S01", "S01", "S02", "S02", "S02", "S01"),
  dose_mg    = c(50, 100, 25, 75, 100, 50)
)
ex_3_3 <- dosing
ex_3_3$cum_dose <- NA_real_
for (s in unique(dosing$subject_id)) {
  # your code here
}
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dosing <- tibble(
  subject_id = c("S01", "S01", "S02", "S02", "S02", "S01"),
  dose_mg    = c(50, 100, 25, 75, 100, 50)
)
ex_3_3 <- dosing
ex_3_3$cum_dose <- NA_real_
for (s in unique(dosing$subject_id)) {
  idx <- which(ex_3_3$subject_id == s)
  ex_3_3$cum_dose[idx] <- cumsum(ex_3_3$dose_mg[idx])
}
ex_3_3
```

**Explanation:** The trick is using `which()` to capture the row positions per subject and writing back to those exact indices, which preserves the original event order without sorting. The same result in tidy idiom is one line: `dosing |> group_by(subject_id) |> mutate(cum_dose = cumsum(dose_mg))`. Knowing both versions matters because longitudinal clinical pipelines often interleave loops (when the next-event logic depends on prior state) with `group_by` (when it does not).

</details>

## Section 4. while loops with break and next (3 problems)

### Exercise 4.1: Count how many doublings of 1 it takes to exceed 1000

**Task:** Starting with `x <- 1`, use a `while` loop that doubles `x` until it strictly exceeds 1000, counting each doubling. Save the final iteration count (not the final value of `x`) to `ex_4_1`. Verify mentally that the answer is `log2(1000)` rounded up.

**Expected result:**

```
#> ex_4_1
#> [1] 10
#> ceiling(log2(1000))
#> [1] 10
```

**Difficulty:** Intermediate

```r title="Your turn"
x <- 1
ex_4_1 <- 0
while (x <= 1000) {
  # your code here
}
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 1
ex_4_1 <- 0
while (x <= 1000) {
  x <- x * 2
  ex_4_1 <- ex_4_1 + 1
}
ex_4_1
#> [1] 10
```

**Explanation:** The condition is tested at the top of each pass, so the loop exits as soon as `x` crosses 1000 with the count already incremented. `ceiling(log2(1000))` is 10, which matches: a `while` is the right tool whenever the number of iterations is implicit in a stopping condition rather than a known range. If the condition can never become false (a typo, perhaps) you have an infinite loop, so when in doubt add a hard iteration cap as a safety net.

</details>

### Exercise 4.2: Find the first day a return path crosses a stop-loss threshold

**Task:** A trading desk simulating a 100-day P&L path needs to know on which day the cumulative log-return first crosses below -10%. Given the returns vector below, iterate with a `while` loop, breaking out the moment the cumulative sum drops below -0.10. Save the breaching day index (or `NA_integer_` if it never breaches) to `ex_4_2`.

**Expected result:**

```
#> ex_4_2
#> [1] 47
#> # cumulative return at that day is just below -0.10
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
rets <- rnorm(100, mean = -0.003, sd = 0.02)
cum_ret <- 0
day <- 0
ex_4_2 <- NA_integer_
while (day < length(rets)) {
  # your code here
}
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
rets <- rnorm(100, mean = -0.003, sd = 0.02)
cum_ret <- 0
day <- 0
ex_4_2 <- NA_integer_
while (day < length(rets)) {
  day <- day + 1
  cum_ret <- cum_ret + rets[day]
  if (cum_ret < -0.10) {
    ex_4_2 <- day
    break
  }
}
ex_4_2
#> [1] 47
```

**Explanation:** `break` exits the loop immediately, leaving everything after it in the current iteration unexecuted, which is exactly what you want for a first-crossing test: there is no point continuing once the answer is known. The equivalent vectorised form `which(cumsum(rets) < -0.10)[1]` is shorter but evaluates the whole series even when day 1 already breaches. For backtests over millions of paths the loop with `break` is often faster than the vectorised one, since the average breach happens long before the path ends.

</details>

### Exercise 4.3: Sum 1 to 50, skip multiples of 3, stop once running total tops 200

**Task:** Iterate over `1:50`. Use `next` to skip any value divisible by 3 without adding it to the running total. Use `break` to exit the moment the running total strictly exceeds 200. Save a list with two elements, `total` (final running total) and `index` (the value of `i` when the loop stopped), to `ex_4_3`.

**Expected result:**

```
#> $total
#> [1] 202
#>
#> $index
#> [1] 25
```

**Difficulty:** Advanced

```r title="Your turn"
total <- 0
ex_4_3 <- list(total = NA_real_, index = NA_integer_)
for (i in 1:50) {
  # your code here
}
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
total <- 0
ex_4_3 <- list(total = NA_real_, index = NA_integer_)
for (i in 1:50) {
  if (i %% 3 == 0) next
  total <- total + i
  if (total > 200) {
    ex_4_3 <- list(total = total, index = i)
    break
  }
}
ex_4_3
#> $total
#> [1] 202
#>
#> $index
#> [1] 25
```

**Explanation:** `next` jumps to the start of the next iteration without running the rest of the loop body, which is cleaner than wrapping the rest of the body in an `if (!divisible) { ... }` block. `break` and `next` always apply to the innermost loop, so in nested loops you must structure with sentinel flags or refactor into a function with an early `return()` when you need to bail out of the outer loop. The pair shows up constantly in batch jobs that must filter and stop, such as web scrapers honouring rate limits.

</details>

## Section 5. switch and dispatch (3 problems)

### Exercise 5.1: Translate severity codes to integer levels with switch

**Task:** A junior analyst onboarding to an ops dashboard needs to convert string severity codes from log lines (`"INFO"`, `"WARN"`, `"ERROR"`, `"FATAL"`) to integer levels (1, 2, 3, 4). Write a function `severity_level(code)` using `switch()` that returns the integer, and save the result of `severity_level("ERROR")` to `ex_5_1`.

**Expected result:**

```
#> severity_level("ERROR")
#> [1] 3
#> severity_level("FATAL")
#> [1] 4
```

**Difficulty:** Beginner

```r title="Your turn"
severity_level <- function(code) {
  # your code here
}
ex_5_1 <- severity_level("ERROR")
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
severity_level <- function(code) {
  switch(code,
    INFO  = 1L,
    WARN  = 2L,
    ERROR = 3L,
    FATAL = 4L,
    NA_integer_
  )
}
ex_5_1 <- severity_level("ERROR")
ex_5_1
#> [1] 3
```

**Explanation:** `switch()` on a string matches the argument against the unnamed-or-named branches; the trailing unnamed expression (`NA_integer_` here) is the default returned when nothing matches, which is how you defend against typos like `"WANR"`. Unlike chained `if`/`else` it is constant-time and reads as a lookup table. The downside is that `switch()` with numeric input is positional, not value-based, so always coerce to character first if your codes happen to be numeric.

</details>

### Exercise 5.2: Build a summarise_by helper that dispatches on a function name

**Task:** A reporting analyst writes a generic helper `summarise_by(x, fn_name)` where `fn_name` is one of `"mean"`, `"median"`, `"max"`, or `"sd"`. The function uses `switch()` to call the corresponding base function on the numeric vector `x`. Save the result of `summarise_by(mtcars$mpg, "median")` to `ex_5_2`.

**Expected result:**

```
#> [1] 19.2
```

**Difficulty:** Intermediate

```r title="Your turn"
summarise_by <- function(x, fn_name) {
  # your code here
}
ex_5_2 <- summarise_by(mtcars$mpg, "median")
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
summarise_by <- function(x, fn_name) {
  switch(fn_name,
    mean   = mean(x),
    median = median(x),
    max    = max(x),
    sd     = sd(x),
    stop("Unsupported fn_name: ", fn_name)
  )
}
ex_5_2 <- summarise_by(mtcars$mpg, "median")
ex_5_2
#> [1] 19.2
```

**Explanation:** Using `stop()` as the default branch turns an unknown name into a loud failure instead of silently returning `NULL`, which is what `switch()` does when there is no default. A more dynamic alternative is `do.call(fn_name, list(x))` or `match.fun(fn_name)(x)`, but `switch()` keeps the supported menu explicit at the call site, which is easier to read and to audit in a regulated reporting workflow.

</details>

### Exercise 5.3: Convert between kg, lb, Celsius and Fahrenheit using a switch table

**Task:** An ops engineer building a small unit-converter receives a value and a conversion code from a config file: `"kg_to_lb"`, `"lb_to_kg"`, `"c_to_f"`, or `"f_to_c"`. Write `convert(value, code)` that uses `switch()` and the standard formulas (1 kg = 2.20462 lb; F = C*9/5 + 32). Save the result of `convert(100, "c_to_f")` to `ex_5_3`.

**Expected result:**

```
#> [1] 212
```

**Difficulty:** Advanced

```r title="Your turn"
convert <- function(value, code) {
  # your code here
}
ex_5_3 <- convert(100, "c_to_f")
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
convert <- function(value, code) {
  switch(code,
    kg_to_lb = value * 2.20462,
    lb_to_kg = value / 2.20462,
    c_to_f   = value * 9 / 5 + 32,
    f_to_c   = (value - 32) * 5 / 9,
    stop("Unknown conversion code: ", code)
  )
}
ex_5_3 <- convert(100, "c_to_f")
ex_5_3
#> [1] 212
```

**Explanation:** `switch()` shines when the dispatch keys are a closed enumeration like a unit catalogue: adding a new conversion is one line and the structure documents what is supported. For a fully extensible converter you'd register conversion functions in a named list and look them up with `conversions[[code]](value)`, which is the idiomatic R version of the Strategy pattern. The cutoff between `switch()` and a function table is roughly five or six entries.

</details>

## Section 6. Short-circuit operators and defensive guards (3 problems)

### Exercise 6.1: Write a scalar predicate that uses double-pipe AND short-circuit checks

**Task:** Write a predicate `is_positive_number(x)` that returns `TRUE` only when `x` is exactly length 1, numeric, not `NA`, and strictly greater than zero. Use `&&` rather than `&` to short-circuit the cheap checks before the expensive ones. Save the result of `is_positive_number(3)` to `ex_6_1`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
is_positive_number <- function(x) {
  # your code here
}
ex_6_1 <- is_positive_number(3)
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
is_positive_number <- function(x) {
  length(x) == 1 && is.numeric(x) && !is.na(x) && x > 0
}
ex_6_1 <- is_positive_number(3)
ex_6_1
#> [1] TRUE
```

**Explanation:** Each `&&` only evaluates its right operand if the left is `TRUE`. That ordering is intentional: testing `length(x) == 1` before `x > 0` prevents the value comparison from accidentally returning a length-2 logical that would crash an `if` later. `&` would not short-circuit and would also return a vector for vector inputs, which is wrong for a scalar guard. In R 4.3+ feeding `&&` a non-length-1 vector raises an error, which is why ordering the length check first matters.

</details>

### Exercise 6.2: Combine AND and OR in a fraud-risk flagging function

**Task:** A fraud team's policy: flag a transaction when (amount > 10000 AND country is in the high-risk list `c("XX","YY")`) OR (amount > 50000 regardless of country). Write `is_suspicious(amount, country)` using `&&` and `||` so the short-circuit avoids the `%in%` lookup when amount is small. Save the result of `is_suspicious(60000, "US")` to `ex_6_2`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
is_suspicious <- function(amount, country) {
  # your code here
}
ex_6_2 <- is_suspicious(60000, "US")
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
is_suspicious <- function(amount, country) {
  high_risk <- c("XX", "YY")
  (amount > 10000 && country %in% high_risk) || amount > 50000
}
ex_6_2 <- is_suspicious(60000, "US")
ex_6_2
#> [1] TRUE
```

**Explanation:** Parentheses change everything: without them `&&` binds tighter than `||` and R would still parse it correctly, but explicit grouping makes the policy auditable for a compliance reviewer. The short-circuit means that for the 99% of transactions under 10000 the `%in%` lookup never runs, which matters at high volume. In production you'd vectorise this for batch scoring with `&` and `|`, but for a per-row guard inside an apply loop or a service handler the scalar version is the right choice.

</details>

### Exercise 6.3: Guard a vector against both NULL and NA before computing a summary

**Task:** A code reviewer flagged a bug where `safe_mean(x)` crashed on `NULL` input because `is.na(NULL)` returns `logical(0)`, not a usable scalar. Rewrite `safe_mean(x)` using `is.null(x) || all(is.na(x))` to short-circuit the `is.null` check before touching `x`, returning `NA_real_` for those bad inputs. Save `safe_mean(NULL)` to `ex_6_3`.

**Expected result:**

```
#> safe_mean(NULL)
#> [1] NA
#> safe_mean(c(1, 2, NA))
#> [1] 1.5
```

**Difficulty:** Advanced

```r title="Your turn"
safe_mean <- function(x) {
  # your code here
}
ex_6_3 <- safe_mean(NULL)
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_mean <- function(x) {
  if (is.null(x) || all(is.na(x))) return(NA_real_)
  mean(x, na.rm = TRUE)
}
ex_6_3 <- safe_mean(NULL)
ex_6_3
#> [1] NA
```

**Explanation:** The first operand of `||` is evaluated and if `is.null(x)` is `TRUE` the second operand is never touched, so `all(is.na(NULL))` (which would be `TRUE` anyway, vacuously) is never reached. If you wrote `is.na(x) || is.null(x)` the order would matter for length>1 inputs since `is.na()` returns a vector; using `all(is.na(x))` collapses it to a scalar so `||` is well-defined. This pattern, ordering cheap and safe checks first, is the foundation of robust R input validation.

</details>

## What to do next

- Revisit the parent tutorial [R Control Flow](R-Control-Flow.html) for the syntax reference.
- Practice the loop alternative with the [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html).
- Build on the vectorised conditions in the [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- Tighten function-writing fundamentals in the [R Functions Exercises](R-Functions-Exercises.html).
