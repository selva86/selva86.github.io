---
title: "R Error: 'subscript out of bounds', Find Which Index Is Wrong Instantly"
slug: "R-Error-Subscript-Out-of-Bounds"
description: "Fix R's 'subscript out of bounds' error fast. Learn to identify which index is wrong, add bounds checks, and use seq_along() to prevent off-by-one bugs."
keywords: "R subscript out of bounds, R out of bounds error, R index error, R off by one error, seq_along R, R bounds checking, R indexing errors"
auto_link_terms: "subscript out of bounds|R subscript error|out of bounds error|R index out of bounds|subscript out of range"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR2"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R Error: 'subscript out of bounds', Find Which Index Is Wrong Instantly

<p class="lead"><code>Error in x[[i]] : subscript out of bounds</code> means R tried to reach an element at a position that does not exist, the index is larger than the object's length, or the row or column is past a matrix's dimensions. This guide shows how to find the bad index in ten seconds and stop it from coming back.</p>

## What does 'subscript out of bounds' actually mean?

The error fires when `[[` or a matrix subscript asks for an index that is not there. R raises an error instead of silently returning `NA`, so you know something is wrong, but the message does not tell you *which* index is the culprit. The fastest way to learn the pattern is to trigger the error on purpose and read the size of the object that rejected you.

```r title="Reproduce the out-of-bounds error"
# A vector of three exam scores
scores <- c(88, 92, 75)
length(scores)
#> [1] 3

# Ask for element 5 with double brackets — R refuses
tryCatch(
  scores[[5]],
  error = function(e) message("Error: ", conditionMessage(e))
)
#> Error: subscript out of bounds
```

The vector has 3 elements, so slot 5 does not exist. `[[` is designed to extract exactly one element, and there is no meaningful "single NA element" for R to return, so it throws instead. That is the entire mental model: *the slot is empty, and the operator refuses to invent a value for it.*

[KEY INSIGHT]
**Single brackets forgive, double brackets do not.** Single-bracket `[` indexing happily returns `NA` for out-of-range positions. Double-bracket `[[` indexing and matrix subscripts treat the same request as an error because they promise a single concrete value.

**Try it:** Trigger the error yourself on a length-4 vector by asking for index 10. Wrap the call in `tryCatch()` so the page keeps running.

```r title="Exercise: trigger with double brackets"
ex_v <- c(10, 20, 30, 40)

# Replace NULL with an expression that triggers the error on ex_v
ex_err <- tryCatch(
  NULL,
  error = function(e) conditionMessage(e)
)
ex_err
#> Expected: "subscript out of bounds"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Double-bracket error solution"
ex_v <- c(10, 20, 30, 40)
ex_err <- tryCatch(
  ex_v[[10]],
  error = function(e) conditionMessage(e)
)
ex_err
#> [1] "subscript out of bounds"
```

**Explanation:** `ex_v[[10]]` asks for a tenth element that does not exist. `tryCatch()` captures the `simpleError` object, and `conditionMessage()` returns the error text as a string.

</details>

## Which operators and objects trigger this error?

Three combinations of operator and object raise "subscript out of bounds": `[[` on a vector or list, a matrix row/column subscript, and a data.frame row subscript. Each one rejects an impossible index the same way, but the shape you need to compare against is different.

```r title="Three operators that throw"
# Case 1: double brackets on a short vector
nums <- c(1, 2, 3)
tryCatch(nums[[4]], error = function(e) message("vector: ", conditionMessage(e)))
#> vector: subscript out of bounds

# Case 2: row beyond matrix dimensions
mat <- matrix(1:6, nrow = 2, ncol = 3)
tryCatch(mat[5, 1], error = function(e) message("matrix: ", conditionMessage(e)))
#> matrix: subscript out of bounds

# Case 3: row beyond a data.frame
df <- data.frame(a = 1:3, b = 4:6)
tryCatch(df[[10, 1]], error = function(e) message("df[[,]]: ", conditionMessage(e)))
#> df[[,]]: subscript out of bounds
```

Each block asks for a slot that does not exist, and each one raises the same error. The operators differ, but the reason is identical, R is being asked to extract a single value from a position that has no value.

Notice what single-bracket indexing would do in the vector case: `nums[4]` returns `NA` with no warning at all. That quietness is why off-by-one bugs can survive in production code for months.

[WARNING]
**Single-bracket on a vector returns NA; double-bracket throws.** If you are used to Python or JavaScript, `x[10]` probably feels like "index error territory", but in R, `x[10]` on a short vector is silent. If you need the crash as a safety net, reach for `[[` instead.

**Try it:** Build a 2x2 matrix and trigger the error by asking for row 3. Save the error message to `ex_mat_err`.

```r title="Exercise: matrix row out of range"
ex_mat <- matrix(1:4, nrow = 2, ncol = 2)

# Replace NULL with a subscript that asks for row 3
ex_mat_err <- tryCatch(
  NULL,
  error = function(e) conditionMessage(e)
)
ex_mat_err
#> Expected: "subscript out of bounds"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Matrix-row error solution"
ex_mat <- matrix(1:4, nrow = 2, ncol = 2)
ex_mat_err <- tryCatch(
  ex_mat[3, 1],
  error = function(e) conditionMessage(e)
)
ex_mat_err
#> [1] "subscript out of bounds"
```

**Explanation:** The matrix has 2 rows, so asking for row 3 fails. Matrix subscripts are strict in the same way `[[` is, they must point to a real cell.

</details>

## How do you find which subscript is wrong instantly?

The error message in R is famously uninformative, it never tells you which index is the bad one. You find it with a two-step recipe: look up the object's size, then compare the size to the index you used. Ten seconds of `length()` or `dim()` beats five minutes of guessing.

![Three checks that reveal the bad subscript](screenshots/R-Error-Subscript-Out-of-Bounds-debug-flow.webp)

*Figure 1: Three quick checks that reveal the bad subscript.*

Let's wrap that recipe in a small helper you can paste into any debugging session. It prints the object's shape, the index you passed, and a clear "out of bounds by how much" verdict.

```r title="Diagnose the bad subscript"
diagnose_subscript <- function(x, i) {
  if (is.null(dim(x))) {
    n <- length(x)
    cat("Type: ", class(x), " | length: ", n, " | index: ", i, "\n", sep = "")
    if (i > n) cat("Over by ", i - n, " element(s).\n", sep = "")
  } else {
    d <- dim(x)
    cat("Type: ", class(x)[1], " | dim: ", d[1], "x", d[2],
        " | index: [", i[1], ",", i[2], "]\n", sep = "")
    if (i[1] > d[1]) cat("Row over by ", i[1] - d[1], ".\n", sep = "")
    if (i[2] > d[2]) cat("Col over by ", i[2] - d[2], ".\n", sep = "")
  }
}

diagnose_subscript(scores, 5)
#> Type: numeric | length: 3 | index: 5
#> Over by 2 element(s).

diagnose_subscript(mat, c(5, 1))
#> Type: matrix | dim: 2x3 | index: [5,1]
#> Row over by 3.
```

Read the output line by line. The vector has length 3, you asked for 5, you are over by 2. The matrix has 2 rows, you asked for row 5, you are over by 3. Those numbers are exactly the arithmetic you need to fix the offending loop or off-by-one slip.

[TIP]
**Reach for str() as a one-line debug swiss army knife.** When you are staring at a crashed script, `str(x)` prints the class, length, dimensions, and the first few values of any object. It is faster than calling `length()`, `dim()`, and `class()` separately, and it works on nested lists.

**Try it:** Print the length of your object and your attempted index side by side in one line so you can see the mismatch immediately.

```r title="Exercise: print length and index"
ex_v2 <- c(1, 2, 3, 4, 5)
ex_i <- 9

# Your code: cat() length and index on one line
# your code here
#> Expected: length=5 index=9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Length-and-index solution"
ex_v2 <- c(1, 2, 3, 4, 5)
ex_i <- 9
cat("length=", length(ex_v2), " index=", ex_i, "\n", sep = "")
#> length=5 index=9
```

**Explanation:** A single `cat()` with `sep = ""` keeps the output compact. In real debugging, drop this line right before the failing subscript and the mismatch is obvious.

</details>

## Why does `1:length(x)` cause off-by-one bugs?

The single most common trigger in real R code is a loop that writes `1:length(x)`. It looks correct for a non-empty vector, but the moment `length(x)` is zero, `1:0` expands to `c(1, 0)`, two iterations on an empty object, and the first `x[[1]]` crashes. `seq_along(x)` solves it in one word.

```r title="The 1:length(x) off-by-one trap"
# The trap: 1:length(x) when x is empty
empty <- integer(0)
1:length(empty)
#> [1] 1 0
seq_along(empty)
#> integer(0)

# The bug in a loop
bad_sum <- function(x) {
  total <- 0
  for (i in 1:length(x)) total <- total + x[[i]]
  total
}
tryCatch(bad_sum(empty), error = function(e) message("bad_sum: ", conditionMessage(e)))
#> bad_sum: subscript out of bounds

# The fix
safe_sum <- function(x) {
  total <- 0
  for (i in seq_along(x)) total <- total + x[[i]]
  total
}
safe_sum(empty)
#> [1] 0
safe_sum(c(3, 4, 5))
#> [1] 12
```

`1:length(empty)` produced `c(1, 0)`, so the loop iterated twice on an empty vector and crashed on the first `x[[1]]`. `seq_along(empty)` returns `integer(0)`, and the for loop runs zero times, which is exactly what you want. This is the classic unit-test-passes-but-production-fails pattern, your tests use a non-empty vector, production hands you an empty one, and the crash ships.

[TIP]
**Replace every 1:length(x) with seq_along(x).** Use `seq_along(x)` or `seq_len(n)` wherever you would have written `1:length(x)`. Both produce an empty iterator on empty input rather than the infamous `c(1, 0)`, and your future self will stop getting paged for this.

**Try it:** Rewrite the body of `ex_loop` to use `seq_along(ex_xs)` instead of `1:length(ex_xs)`, and confirm it returns 0 for an empty vector.

```r title="Exercise: safe loop with seqalong"
ex_xs <- integer(0)

ex_loop <- function(xs) {
  out <- 0
  # your code here: iterate over xs safely and sum the elements
  out
}

ex_loop(ex_xs)
#> Expected: 0
ex_loop(c(10, 20, 30))
#> Expected: 60
```

<details>
<summary>Click to reveal solution</summary>

```r title="seqalong loop solution"
ex_xs <- integer(0)

ex_loop <- function(xs) {
  out <- 0
  for (i in seq_along(xs)) out <- out + xs[[i]]
  out
}

ex_loop(ex_xs)
#> [1] 0
ex_loop(c(10, 20, 30))
#> [1] 60
```

**Explanation:** `seq_along(integer(0))` is `integer(0)`, so the loop runs zero times when `xs` is empty. For non-empty vectors it behaves exactly like `1:length(xs)`.

</details>

## How do you add bounds checks to prevent it?

Once you know which lines can trip, you wrap them in a guard. Three patterns cover almost every real case: an inline `if (i <= length(x))` check, a reusable `safe_get()` helper that returns a default, and `purrr::pluck()` for deeply nested lists.

```r title="Bounds-checking safeget helper"
# A helper that returns a default instead of crashing
safe_get <- function(x, i, default = NA) {
  if (is.na(i) || i < 1 || i > length(x)) default else x[[i]]
}

safe_get(scores, 2)
#> [1] 92
safe_get(scores, 8)
#> [1] NA
safe_get(scores, NA)
#> [1] NA
safe_get(scores, 8, default = -1)
#> [1] -1
```

`safe_get()` guards three failure modes at once: an `NA` index, an index below 1, and an index past `length(x)`. If any of them are true, it returns the default, otherwise it uses `[[` to extract the real element. Notice how the `is.na(i)` check comes first: the short-circuit `||` means the later comparisons never run on an `NA`, which would otherwise return `NA` instead of `TRUE` and sneak a crash through.

The design rule is *crash at the edges, trust the middle*: validate indices at the points where user input, file data, or loop math enters your function, and then trust the core loop to do its work without checks at every access.

[NOTE]
**purrr::pluck() is the tidyverse-native equivalent.** If you already use purrr, `pluck(x, i, .default = NA)` does the same job as `safe_get()` and handles deeply nested lists like `pluck(config, "db", "host", .default = "localhost")` without a cascade of `if` statements.

**Try it:** Write `ex_get(x, i)` that returns `"bad index"` when `i` is `NA` or out of range, otherwise returns `x[[i]]`.

```r title="Exercise: write exget helper"
ex_get <- function(x, i) {
  # your code here
}

ex_get(c("a", "b", "c"), 2)
#> Expected: "b"
ex_get(c("a", "b", "c"), 9)
#> Expected: "bad index"
ex_get(c("a", "b", "c"), NA)
#> Expected: "bad index"
```

<details>
<summary>Click to reveal solution</summary>

```r title="exget helper solution"
ex_get <- function(x, i) {
  if (is.na(i) || i < 1 || i > length(x)) "bad index" else x[[i]]
}

ex_get(c("a", "b", "c"), 2)
#> [1] "b"
ex_get(c("a", "b", "c"), 9)
#> [1] "bad index"
ex_get(c("a", "b", "c"), NA)
#> [1] "bad index"
```

**Explanation:** The guard is the same three checks as `safe_get()`: NA, below 1, above length. Ordering `is.na(i)` first matters, it short-circuits before the numeric comparisons, which would return `NA` and break the `if`.

</details>

## Practice Exercises

### Exercise 1: Fix a crashing pair-finder

The function below looks for pairs of numbers that sum to `target`. It works on normal input but crashes with "subscript out of bounds" when `x` has 0 or 1 elements. Find the bug and fix it. Your fix should return an empty list (not crash) for inputs shorter than 2.

```r title="Exercise: fix findpairs function"
# Broken version — do not change the signature
find_pairs <- function(x, target) {
  pairs <- list()
  for (i in 1:length(x)) {
    for (j in (i + 1):length(x)) {
      if (x[[i]] + x[[j]] == target) {
        pairs[[length(pairs) + 1]] <- c(i, j)
      }
    }
  }
  pairs
}

# Write your fixed version below and test it:

# Expected:
# find_pairs(c(3, 7, 5, 5, 2, 8), 10) should return 3 pairs
# find_pairs(c(5), 10)                should return list()
# find_pairs(integer(0), 10)          should return list()
```

<details>
<summary>Click to reveal solution</summary>

```r title="findpairs fix solution"
find_pairs <- function(x, target) {
  my_pairs <- list()
  n <- length(x)
  if (n < 2) return(my_pairs)

  for (i in seq_len(n - 1)) {
    for (j in seq.int(i + 1, n)) {
      if (x[[i]] + x[[j]] == target) {
        my_pairs[[length(my_pairs) + 1]] <- c(i, j)
      }
    }
  }
  my_pairs
}

length(find_pairs(c(3, 7, 5, 5, 2, 8), 10))
#> [1] 3
length(find_pairs(c(5), 10))
#> [1] 0
length(find_pairs(integer(0), 10))
#> [1] 0
```

**Explanation:** Two bugs had to be fixed together. First, `1:length(x)` expands to `c(1, 0)` on empty input, the `if (n < 2) return()` guard short-circuits both the empty and single-element cases. Second, `(i + 1):length(x)` becomes `2:1 = c(2, 1)` on a length-1 vector, so even if you got past the empty case, it would crash, `seq.int(i + 1, n)` together with the early return handles both. Variables use the `my_` prefix so the exercise does not clobber anything in the tutorial state.

</details>

### Exercise 2: Build a diagnostic wrapper

Write `explain_bounds(expr, x)` that runs `expr` (passed as a quoted R expression), catches any "subscript out of bounds" error, and prints the shape of `x` plus the exact error message. If `expr` runs without error, it should return the result. Use `tryCatch()` and `eval()`.

```r title="Exercise: explainbounds diagnostic"
# Expected:
# explain_bounds(quote(scores[[5]]), scores)
#   should print: "length=3, index attempted: 5" and return NULL
# explain_bounds(quote(scores[[2]]), scores)
#   should return 92

# Write explain_bounds below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="explainbounds solution"
explain_bounds <- function(expr, x) {
  tryCatch(
    eval(expr),
    error = function(e) {
      if (is.null(dim(x))) {
        cat("length=", length(x), ", error: ", conditionMessage(e), "\n", sep = "")
      } else {
        cat("dim=", paste(dim(x), collapse = "x"),
            ", error: ", conditionMessage(e), "\n", sep = "")
      }
      invisible(NULL)
    }
  )
}

explain_bounds(quote(scores[[5]]), scores)
#> length=3, error: subscript out of bounds
explain_bounds(quote(scores[[2]]), scores)
#> [1] 92
```

**Explanation:** `quote(scores[[5]])` captures the call without running it, so `eval()` decides when to run it. The error handler branches on whether `x` has dimensions (matrix / data.frame) or just a length (vector / list) and prints the relevant shape information alongside the original error message.

</details>

## Complete Example: Safe row extraction from a data.frame

Let's combine every pattern from this post into one utility you can reuse: a function that extracts a row from a data.frame and returns a row of `NA`s if the index is out of bounds. It guards against `NA` indices, negative indices, and indices past `nrow()`.

```r title="Safe row extraction from data frame"
safe_row <- function(df, i) {
  na_row <- df[1, ]
  na_row[] <- NA

  if (is.na(i) || i < 1 || i > nrow(df)) {
    return(na_row)
  }
  df[i, ]
}

people <- data.frame(
  name   = c("Amelia", "Bruno", "Cara"),
  age    = c(32, 45, 28),
  salary = c(75000, 92000, 68000),
  stringsAsFactors = FALSE
)

safe_row(people, 2)
#>    name age salary
#> 2 Bruno  45  92000

safe_row(people, 9)
#>   name age salary
#> 1 <NA>  NA     NA

safe_row(people, NA)
#>   name age salary
#> 1 <NA>  NA     NA
```

`safe_row()` pre-builds an NA template once (`na_row`) so the fallback keeps the original data.frame's column types, important for downstream code that expects `age` to be numeric and `name` to be character. The three checks, `is.na`, below 1, above `nrow(df)`, are exactly the same three from `safe_get()`, just using `nrow` instead of `length`. The pattern scales to any rectangular object.

## Summary

| Trigger | Example | Fast fix |
|---|---|---|
| `[[` past vector/list length | `scores[[10]]` on length-3 | Check `length(x)` first, use `safe_get()` |
| Matrix row/col out of range | `mat[5, 2]` on 2x3 | Check `dim(mat)` first, use `i <= nrow(mat)` |
| data.frame row past `nrow()` | `df[[10, 1]]` on 3 rows | `safe_row(df, i)` with NA fallback |
| `1:length(x)` on empty input | `for (i in 1:length(empty))` | Use `seq_along(x)` or `seq_len(n - 1)` |
| NA index | `x[[NA]]` | Guard with `is.na(i)` before comparison |

## References

1. Wickham, H., *Advanced R*, Chapter 4: Subsetting. [Link](https://adv-r.hadley.nz/subsetting.html)
2. R Core Team, *An Introduction to R*, Section 6: Lists and data frames. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
3. Base R help page: `?"[["`
4. purrr documentation, `pluck()` reference. [Link](https://purrr.tidyverse.org/reference/pluck.html)
5. R source code, `src/main/subscript.c` (where the error is raised).
6. Stack Overflow canonical: "What does 'subscript out of bounds' mean in R?" [Link](https://stackoverflow.com/questions/6929596)

## Continue Learning

1. **R Common Errors**, the full reference covering the other 50 errors R throws at you.
2. **R Error: undefined columns selected**, the data.frame cousin of this error, triggered by bad column names.
3. **R Error: replacement has length zero**, the NA assignment bug that shows up in the same debugging sessions.
