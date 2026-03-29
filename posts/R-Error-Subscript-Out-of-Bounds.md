---
title: "R Error: subscript out of bounds — What It Means & How to Solve It"
slug: "R-Error-Subscript-Out-of-Bounds"
description: "Fix R's 'subscript out of bounds' error. Learn why it happens with vectors, lists, matrices and data frames, and how to prevent off-by-one and NA index bugs."
keywords: "R subscript out of bounds, R index error, R out of bounds, R off by one, R indexing error, R subscript error"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR2"
post_type: "FR"
auto_link_terms: "subscript out of bounds"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# R Error: subscript out of bounds — What It Means & How to Solve It

<p class="lead"><code>Error in x[[i]] : subscript out of bounds</code> means you tried to access an element at a position that doesn't exist. The index is either too large, negative in the wrong way, or NA. Here's how to diagnose and fix it.</p>

## When Does This Error Occur?

This error happens with `[[` and matrices/arrays, but *not* with `[` on vectors (which returns NA instead):

```r
x <- c(10, 20, 30)

# Single bracket: returns NA (no error)
cat("x[5] with [:", x[5], "\n")

# Double bracket: throws an error
tryCatch(
  x[[5]],
  error = function(e) cat("x[[5]] with [[:", conditionMessage(e), "\n")
)

# Same for lists
my_list <- list(a = 1, b = 2)
tryCatch(
  my_list[[3]],
  error = function(e) cat("list[[3]]:", conditionMessage(e), "\n")
)
```

## Cause 1: Index Exceeds Length

The most common cause — you're asking for element 10 of a 5-element vector:

```r
scores <- c(88, 92, 75, 81, 96)
cat("Length:", length(scores), "\n")

# Safe: check length first
i <- 8
if (i <= length(scores)) {
  cat("Score:", scores[[i]], "\n")
} else {
  cat("Index", i, "is out of bounds (max:", length(scores), ")\n")
}

# Safer: use a helper
safe_get <- function(x, i, default = NA) {
  if (i >= 1 && i <= length(x)) x[[i]] else default
}

cat("safe_get(scores, 3):", safe_get(scores, 3), "\n")
cat("safe_get(scores, 8):", safe_get(scores, 8), "\n")
```

## Cause 2: Off-by-One in Loops

A very common bug — looping one past the end:

```r
values <- c(5, 10, 15, 20)

# BUG: 1:length(values)+1 is NOT 1:(length(values)+1)
# It's (1:length(values)) + 1 = c(2, 3, 4, 5)
# So values[[5]] is out of bounds!

# Fix: use seq_along() or seq_len()
for (i in seq_along(values)) {
  cat(sprintf("values[[%d]] = %d\n", i, values[[i]]))
}

# Also common: comparing adjacent elements
for (i in seq_len(length(values) - 1)) {
  diff <- values[[i + 1]] - values[[i]]
  cat(sprintf("Diff %d->%d: %d\n", i, i+1, diff))
}
```

## Cause 3: NA as Index

If your index variable is `NA`, you get an error with `[[`:

```r
# NA index with [[
idx <- NA
x <- list(a = 1, b = 2, c = 3)

tryCatch(
  x[[idx]],
  error = function(e) cat("NA index error:", conditionMessage(e), "\n")
)

# Fix: check for NA before indexing
if (!is.na(idx) && idx >= 1 && idx <= length(x)) {
  cat("Value:", x[[idx]], "\n")
} else {
  cat("Invalid index:", idx, "\n")
}
```

## Cause 4: Empty Subset Result

Using `which()` or filtering that returns no results, then indexing:

```r
data <- c(10, 20, 30, 40, 50)

# which() returns integer(0) when nothing matches
idx <- which(data > 100)
cat("Matching indices:", idx, "\n")
cat("Length:", length(idx), "\n")

# This is fine with [:
cat("data[idx]:", data[idx], "\n")  # Returns numeric(0)

# But this would error with [[:
if (length(idx) > 0) {
  cat("First match:", data[[idx[1]]], "\n")
} else {
  cat("No matches found\n")
}
```

## Cause 5: Matrix Row/Column Out of Range

```r
mat <- matrix(1:12, nrow = 3, ncol = 4)
cat("Matrix dimensions:", nrow(mat), "x", ncol(mat), "\n")

# Accessing row 5 of a 3-row matrix
tryCatch(
  mat[5, 2],
  error = function(e) cat("Error:", conditionMessage(e), "\n")
)

# Fix: validate indices against dimensions
row_i <- 5
col_j <- 2
if (row_i <= nrow(mat) && col_j <= ncol(mat)) {
  cat("Value:", mat[row_i, col_j], "\n")
} else {
  cat(sprintf("Index [%d,%d] exceeds dimensions [%d,%d]\n",
              row_i, col_j, nrow(mat), ncol(mat)))
}
```

## Prevention Patterns

```r
# Pattern 1: Bounds checking helper
check_bounds <- function(x, i) {
  n <- if (is.null(dim(x))) length(x) else nrow(x)
  if (any(is.na(i))) stop("NA in index")
  if (any(i < 1) || any(i > n)) {
    stop(sprintf("Index %s out of bounds [1, %d]",
                 paste(i[i < 1 | i > n], collapse=","), n))
  }
  TRUE
}

x <- 1:5
tryCatch(
  { check_bounds(x, 7); x[[7]] },
  error = function(e) cat("Caught:", conditionMessage(e), "\n")
)

# Pattern 2: Use seq_along() in loops
x <- c(3, 1, 4, 1, 5)
for (i in seq_along(x)) {
  cat(x[[i]], " ")
}
cat("\n")

# Pattern 3: Defensive list access
safe_list_get <- function(lst, key, default = NULL) {
  if (key %in% names(lst)) lst[[key]] else default
}

config <- list(host = "localhost", port = 8080)
cat("host:", safe_list_get(config, "host"), "\n")
cat("timeout:", safe_list_get(config, "timeout", 30), "\n")
```

## Practice Exercise

```r
# Exercise: This function crashes with "subscript out of bounds"
# for certain inputs. Find the bug and fix it.

find_pairs <- function(x, target) {
  pairs <- list()
  for (i in 1:length(x)) {
    for (j in (i+1):length(x)) {
      if (x[[i]] + x[[j]] == target) {
        pairs[[length(pairs) + 1]] <- c(i, j)
      }
    }
  }
  pairs
}

# Works:
cat("Pairs summing to 10:\n")
result <- find_pairs(c(3, 7, 5, 5, 2, 8), 10)
for (p in result) cat("  indices", p[1], "and", p[2], "\n")

# Crashes with single element:
# find_pairs(c(5), 10)

# Fix the function below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Bug: When x has 1 element, (i+1):length(x) becomes 2:1 = c(2,1)
# which causes x[[2]] to be out of bounds.
# Fix: check that j > i and j <= length(x)

find_pairs <- function(x, target) {
  pairs <- list()
  n <- length(x)
  if (n < 2) return(pairs)  # Need at least 2 elements

  for (i in 1:(n - 1)) {
    for (j in (i + 1):n) {
      if (x[[i]] + x[[j]] == target) {
        pairs[[length(pairs) + 1]] <- c(i, j)
      }
    }
  }
  pairs
}

# Now works for all cases:
cat("Normal:", length(find_pairs(c(3, 7, 5, 5, 2, 8), 10)), "pairs\n")
cat("Single:", length(find_pairs(c(5), 10)), "pairs\n")
cat("Empty:", length(find_pairs(c(), 10)), "pairs\n")
```

**Explanation:** The bug is the `1:length(x)` pattern when `x` has only 1 element: `(i+1):length(x)` becomes `2:1`, which is `c(2, 1)`. Guard with `if (n < 2) return()` and use `1:(n-1)` for the outer loop.

</details>

## Summary

| Cause | Example | Fix |
|-------|---------|-----|
| Index too large | `x[[10]]` on length-5 | Check `length(x)` first |
| Off-by-one in loop | `1:(length(x)+1)` | Use `seq_along(x)` |
| NA index | `x[[NA]]` | Check `!is.na(i)` |
| Empty which() | `x[[which(x>999)[1]]]` | Check `length()` of result |
| Matrix bounds | `mat[5,2]` on 3-row | Check `nrow()`/`ncol()` |

## FAQ

### Why does x[10] return NA but x[[10]] throws an error?

`[` is designed for subsetting (can return multiple elements) and uses NA as a placeholder for missing positions. `[[` is designed for extracting a single element and is stricter — there's no meaningful "single NA element" to return.

### How do I handle this in lapply/sapply?

If your function might get indices out of range, wrap the access in `tryCatch` or validate before accessing. `purrr::pluck()` is a safe alternative that returns a default value when the element doesn't exist.

## What's Next?

1. **R Error: undefined columns selected** — data frame subsetting fix
2. **R Error: replacement has length zero** — the NA assignment bug
3. **R Common Errors** — the full reference of 50 common errors
