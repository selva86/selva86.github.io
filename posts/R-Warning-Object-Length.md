---
title: "R Vector Recycling Warning: When R Silently Gives You the Wrong Answer"
slug: "R-Warning-Object-Length"
description: "R warns 'longer object length is not a multiple of shorter object length' when recycling hits uneven lengths. Learn when it is safe and how to fix it."
keywords: "R vector recycling, longer object length warning, R warning object length, R recycling rule, R vector length mismatch, R vectorized operations"
auto_link_terms: "longer object length|not a multiple of shorter|vector recycling|R recycling rule|recycling warning"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR14"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R Vector Recycling Warning: When R Silently Gives You the Wrong Answer

<p class="lead">The R warning <code>longer object length is not a multiple of shorter object length</code> fires when a vectorized operation pairs two vectors of unequal length and the shorter one cannot divide evenly into the longer one. R still runs the operation by <strong>recycling</strong> the shorter vector — repeating its values from the top — but the result is almost always wrong.</p>

## What does "longer object length is not a multiple of shorter object length" mean?

R hits this warning whenever a pairwise operation — `+`, `*`, `==`, `ifelse()`, and friends — tries to line up two vectors of unequal length and the shorter one does not divide cleanly into the longer one. R does not stop. It finishes the calculation, hands you a result, and hopes you notice the warning in the console.

Let's reproduce it in the smallest possible way and see what R actually did.

```r
x <- c(1, 2, 3, 4, 5)
y <- c(10, 20)

result <- x + y
result
#> [1] 11 22 13 24 15
#> Warning message:
#> In x + y : longer object length is not a multiple of shorter object length
```

R lined up `x` and `y`, ran out of `y` after the second element, started `y` again from the top, and stopped partway through the third recycle. The result `11 22 13 24 15` is `1+10, 2+20, 3+10, 4+20, 5+10` — you got a number, but it is almost certainly not the number you wanted. The warning is the only signal that something is off.

**Try it:** Change `y` to a length-3 vector `c(10, 20, 30)` and predict the result before you run it. You should still get a warning — 5 is not a multiple of 3.

```r
# Try it: predict the output
ex_a <- c(1, 2, 3, 4, 5)
ex_b <- c(10, 20, 30)

ex_a + ex_b
#> Expected: 5 values, warning shown
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_a <- c(1, 2, 3, 4, 5)
ex_b <- c(10, 20, 30)

ex_a + ex_b
#> [1] 11 22 33 14 25
#> Warning message:
#> longer object length is not a multiple of shorter object length
```

**Explanation:** R recycles `ex_b` as `10, 20, 30, 10, 20` and adds element-wise. Length 3 does not divide into length 5, so the warning fires.

</details>

## Why does R recycle shorter vectors at all?

Recycling is not a bug. It is a deliberate design feature R inherited from its predecessor S, and it is the reason you can write `prices * 1.1` instead of looping. When the shorter vector is length 1, or when its length divides evenly into the longer one, R repeats it silently and the code reads cleanly.

The problem is that R uses the exact same silent mechanism for "obvious" cases and "jagged" cases, and only warns you when the jagged edge appears.

```r
# Case 1: scalar recycle - silent, intentional, this is why vectorized R works
prices <- c(100, 200, 300, 400)
taxed <- prices * 1.1
taxed
#> [1] 110 220 330 440

# Case 2: length divides evenly (6 / 3 = 2) - silent, often intentional
a <- c(1, 2, 3, 4, 5, 6)
b <- c(10, 20, 30)
a + b
#> [1] 11 22 33 14 25 36

# Case 3: length does not divide (5 / 2 is not whole) - WARNING
c(1, 2, 3, 4, 5) + c(10, 20)
#> [1] 11 22 13 24 15
#> Warning message:
#> longer object length is not a multiple of shorter object length
```

Case 1 is so ordinary you probably never thought of it as recycling — but it is. Case 2 shows that R also accepts "clean multiples" silently: `b` is repeated twice and added to `a`. Only Case 3 earns the warning, because R cannot even finish one clean pass through the shorter vector.

[KEY INSIGHT]
**The warning only fires at the jagged edge, not at the dangerous edge.** R happily recycles whenever the short length divides the long length, warning or no warning — so a "silent" recycle is not the same as a "correct" recycle.

**Try it:** Build a length-8 vector of prices and a length-4 vector of tax rates. Add them and confirm there is no warning — even though recycling is clearly happening.

```r
# Try it: confirm silent recycle
ex_prices <- c(100, 200, 300, 400, 500, 600, 700, 800)
ex_tax <- c(5, 10, 15, 20)

ex_prices + ex_tax
#> Expected: 8 values, NO warning
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_prices <- c(100, 200, 300, 400, 500, 600, 700, 800)
ex_tax <- c(5, 10, 15, 20)

ex_prices + ex_tax
#> [1] 105 210 315 420 505 610 715 820
```

**Explanation:** 8 is a multiple of 4, so R recycles `ex_tax` twice (`5,10,15,20,5,10,15,20`) and adds element-wise. No warning — even though the operation is probably still wrong if you meant each price to have its own tax.

</details>

## When does recycling silently corrupt your results?

The scariest bug is not the warning. It is the clean multiple. When the longer length happens to be a whole multiple of the shorter length, R says nothing, and your code runs to completion with numbers that look plausible but are not what you meant.

Here is the classic trap: twelve months of data, four quarters of revenue.

```r
months <- month.name
q_rev <- c(100, 120, 115, 130)  # only Q1 data

bad_df <- data.frame(month = months, revenue = q_rev)
head(bad_df, 8)
#>      month revenue
#> 1  January     100
#> 2 February     120
#> 3    March     115
#> 4    April     130
#> 5      May     100
#> 6     June     120
#> 7     July     115
#> 8   August     130
```

Notice anything missing? There is no warning. There is no error. `data.frame()` even accepted both inputs because 12 is a multiple of 4. R happily repeated `100, 120, 115, 130` three times and called it a year of revenue. May through December have zero actual data, but the column is filled with recycled Q1 numbers as if they did.

[WARNING]
**Silent recycling is more dangerous than the warning.** A warning at least tells you to stop and look. A clean multiple produces confident, wrong output that can survive an entire analysis undetected.

**Try it:** The code below pairs a 10-element id vector with a 5-element flag vector. Spot the bug before running it — then run it to confirm.

```r
# Try it: spot the silent recycle
ex_ids <- 1:10
ex_flags <- c(TRUE, FALSE, TRUE, FALSE, TRUE)

data.frame(id = ex_ids, flag = ex_flags)
#> Expected: 10 rows, but flags repeat every 5 ids
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ids <- 1:10
ex_flags <- c(TRUE, FALSE, TRUE, FALSE, TRUE)

data.frame(id = ex_ids, flag = ex_flags)
#>    id  flag
#> 1   1  TRUE
#> 2   2 FALSE
#> 3   3  TRUE
#> 4   4 FALSE
#> 5   5  TRUE
#> 6   6  TRUE
#> 7   7 FALSE
#> 8   8  TRUE
#> 9   9 FALSE
#> 10 10  TRUE
```

**Explanation:** 10 is a multiple of 5, so `data.frame()` recycles `ex_flags` twice without a peep. Rows 6-10 are copies of rows 1-5 — likely not what the analyst meant.

</details>

## How do you fix the warning without breaking your pipeline?

Every fix follows the same principle: decide what the correct length is, then make both sides match before the operation. Which specific fix you use depends on why the lengths diverged in the first place.

```r
# Fix 1: fail fast with stopifnot() when you expect equal lengths
safe_add <- function(x, y) {
  stopifnot(length(x) == length(y))
  x + y
}

# Fix 2: pad with NA when a function returns a shorter vector
values <- c(10, 15, 13, 20, 18)
changes <- diff(values)             # length 4, not 5
changes_padded <- c(NA, changes)    # length 5, first day has no "change"
changes_padded
#> [1] NA  5 -2  7 -2

# Fix 3: trim the longer side when the short side is the source of truth
values_trimmed <- values[-1]
length(values_trimmed) == length(changes)
#> [1] TRUE

# Fix 4: use rep() when you genuinely want to repeat the short vector
tax_rates <- rep(c(0.05, 0.10), times = 4)   # length 8, explicit intent
tax_rates
#> [1] 0.05 0.10 0.05 0.10 0.05 0.10 0.05 0.10
```

Fix 1 is the cheapest guardrail and the one you should reach for inside any function that takes two vectors. Fixes 2 and 3 cover the common case where `diff()`, `lag()`, or a slice returned a vector one element short. Fix 4 is the rare case where you actually want repetition — but writing `rep()` out loud makes the intent obvious in code review.

[TIP]
**Add stopifnot(length(x) == length(y)) to any function that does vectorized math on two inputs.** It is one line, it fails fast with a readable error, and it prevents silent recycling from ever reaching your output.

**Try it:** Write a length guard for the snippet below so it errors cleanly instead of warning.

```r
# Try it: add a length guard
ex_x <- c(1, 2, 3, 4, 5)
ex_y <- c(10, 20, 30)

# your code here: error out if lengths do not match
ex_x + ex_y
#> Expected: an error, not a warning
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_x <- c(1, 2, 3, 4, 5)
ex_y <- c(10, 20, 30)

stopifnot(length(ex_x) == length(ex_y))
#> Error: length(ex_x) == length(ex_y) is not TRUE
```

**Explanation:** `stopifnot()` turns the silent recycle risk into a hard error at the top of the pipeline. You can wrap it in a function so every call site gets the same guard.

</details>

## How can you catch recycling bugs before production?

The `vctrs` package (a dependency of dplyr and tibble that is already in your library) provides a strict alternative to base R's recycling rules. Its `vec_recycle_common()` function accepts a scalar recycle — because that is universally safe — and errors on every other length mismatch, including the dangerous clean-multiple case.

```r
library(vctrs)

# Length 5 + length 1: accepted (scalar recycle)
vec_recycle_common(c(1, 2, 3, 4, 5), 10)
#> [[1]]
#> [1] 1 2 3 4 5
#>
#> [[2]]
#> [1] 10 10 10 10 10

# Length 5 + length 2: error, not a warning
try(vec_recycle_common(c(1, 2, 3, 4, 5), c(10, 20)))
#> Error in `vec_recycle_common()`:
#> ! Can't recycle input of size 2 to size 5.
```

Unlike base R's `+`, `vec_recycle_common()` refuses to guess. If the lengths do not match and neither side is length 1, it raises a hard error with a named input, which surfaces in tracebacks and test failures instead of getting lost in the warnings buffer.

The same strictness is baked into modern tidyverse tools. `tibble()` errors where `data.frame()` warns. `dplyr::mutate()` in dplyr 1.1+ uses vctrs recycling rules and refuses jagged lengths. Migrating new code onto those APIs turns the entire class of silent recycling bugs into failed tests.

[TIP]
**Use tibble() instead of data.frame() in new code.** `tibble()` errors on length mismatches that `data.frame()` accepts silently, so recycling bugs can never reach your analysis.

**Try it:** Wrap a length-5 / length-2 addition in `vec_recycle_common()` so it errors instead of warning.

```r
# Try it: strict wrapper
ex_v1 <- c(1, 2, 3, 4, 5)
ex_v2 <- c(10, 20)

# your code here: use vec_recycle_common() to error on mismatch
#> Expected: an error
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_v1 <- c(1, 2, 3, 4, 5)
ex_v2 <- c(10, 20)

try(vec_recycle_common(ex_v1, ex_v2))
#> Error in `vec_recycle_common()`:
#> ! Can't recycle input of size 2 to size 5.
```

**Explanation:** `vec_recycle_common()` treats the mismatch as an error, so the issue is caught at the point of call rather than hidden in the warnings buffer.

</details>

## Practice Exercises

### Exercise 1: Audit a function for silent recycling

Write a function `safe_diff(x, y)` that returns `x - y` only when the two inputs are exactly the same length **or** one of them is length 1. For any other input, it should error. Use `vctrs::vec_recycle_common()` instead of writing your own length checks.

```r
# Exercise 1: strict safe_diff()
# Hint: vec_recycle_common() returns a list of recycled vectors, or errors.

safe_diff <- function(x, y) {
  # your code here
}

# Tests:
safe_diff(c(10, 20, 30), c(1, 2, 3))
#> Expected: 9 18 27

safe_diff(c(10, 20, 30), 1)
#> Expected: 9 19 29

try(safe_diff(c(10, 20, 30), c(1, 2)))
#> Expected: an error
```

<details>
<summary>Click to reveal solution</summary>

```r
library(vctrs)

safe_diff <- function(x, y) {
  pair <- vec_recycle_common(x, y)
  pair[[1]] - pair[[2]]
}

safe_diff(c(10, 20, 30), c(1, 2, 3))
#> [1]  9 18 27

safe_diff(c(10, 20, 30), 1)
#> [1]  9 19 29

try(safe_diff(c(10, 20, 30), c(1, 2)))
#> Error in `vec_recycle_common()`:
#> ! Can't recycle input of size 2 to size 3.
```

**Explanation:** `vec_recycle_common()` handles the length-1 recycle automatically and errors on every other mismatch. The function body becomes three lines with no custom logic.

</details>

### Exercise 2: Fix a broken quarterly pipeline

You are handed `months <- month.name` (length 12) and `my_q1 <- c(100, 120, 115, 130)` (only Q1 revenue). Write code that produces a 12-row data frame with one column for month and one for revenue, where April through December contain `NA` instead of recycled Q1 values.

```r
# Exercise 2: twelve months, four data points
my_months <- month.name
my_q1 <- c(100, 120, 115, 130)

# your code here

# Expected: 12 rows, 4 real values, 8 NAs
```

<details>
<summary>Click to reveal solution</summary>

```r
my_months <- month.name
my_q1 <- c(100, 120, 115, 130)

my_full <- c(my_q1, rep(NA_real_, length(my_months) - length(my_q1)))
payroll_df <- data.frame(month = my_months, revenue = my_full)
payroll_df
#>        month revenue
#> 1    January     100
#> 2   February     120
#> 3      March     115
#> 4      April     130
#> 5        May      NA
#> 6       June      NA
#> 7       July      NA
#> 8     August      NA
#> 9  September      NA
#> 10   October      NA
#> 11  November      NA
#> 12  December      NA
```

**Explanation:** Padding with `NA_real_` preserves the numeric column type and forces the pipeline to acknowledge the missing months instead of silently duplicating Q1 revenue across the year.

</details>

## Complete Example

Here is a realistic payroll pipeline where silent recycling almost ships to production. Ten employees, but only four got a bonus this quarter. The naive version fails loudly on `data.frame()` — which is good — but a single typo that makes the lengths match could have made it silent.

```r
employees <- c("Alice", "Bob", "Carol", "Dave", "Eve",
               "Frank", "Grace", "Heidi", "Ivan", "Judy")
bonuses <- c(500, 750, 1000, 600)  # only four employees earned one

# Naive attempt: data.frame errors here, but tibble would too
try(data.frame(employee = employees, bonus = bonuses))
#> Error in data.frame(employee = employees, bonus = bonuses) :
#>   arguments imply differing number of rows: 10, 4

# Fix: align the short vector to the full roster with NA
bonuses_full <- c(bonuses, rep(NA_real_, length(employees) - length(bonuses)))
payroll <- data.frame(employee = employees, bonus = bonuses_full)
payroll
#>    employee bonus
#> 1     Alice   500
#> 2       Bob   750
#> 3     Carol  1000
#> 4      Dave   600
#> 5       Eve    NA
#> 6     Frank    NA
#> 7     Grace    NA
#> 8     Heidi    NA
#> 9      Ivan    NA
#> 10     Judy    NA
```

The fix is three lines: pad with `NA_real_`, build the data frame, and now the missing bonuses are explicit instead of invisible. If you later want to filter to employees who actually received a bonus, `payroll[!is.na(payroll$bonus), ]` does exactly that — and the same filter would quietly return every row if you had let recycling fill in the blanks.

## Summary

| Situation | What R does | How to handle it |
|---|---|---|
| Scalar recycles (length 1) | Silent, intentional | Nothing — this is R's design |
| Shorter length divides cleanly | Silent, often unintentional | `stopifnot()` or switch to `tibble()` |
| Shorter length does not divide | Warning, runs anyway | Align lengths before the operation |
| `diff()`, `lag()` returns shorter | Warning on combine | Pad with `NA` or trim the other side |
| `data.frame()` length mismatch | Errors outright | Match lengths with `NA_real_` padding |
| `vec_recycle_common()` mismatch | Errors outright | Use for strict guardrails |

## References

1. R Core Team — *An Introduction to R*, Section 2.2 on vector arithmetic and the recycling rule. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Vector-arithmetic)
2. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 3: Vectors. [Link](https://adv-r.hadley.nz/vectors-chap.html)
3. `vctrs` package documentation — `vec_recycle_common()` reference. [Link](https://vctrs.r-lib.org/reference/vec_recycle.html)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter on vectors and recycling. [Link](https://r4ds.hadley.nz/)
5. `tibble` package — "Invariants: Comparing behaviour with data frames." [Link](https://tibble.tidyverse.org/articles/invariants.html)

## Continue Learning

1. **R Common Errors** — the full reference of plain-English fixes for R's warnings and errors.
2. **R Vectors** — the foundation chapter on how R stores and operates on vectors, including the recycling rule.
3. **R Error: argument is of length zero** — a related conditional-logic bug that often shows up alongside recycling issues.
