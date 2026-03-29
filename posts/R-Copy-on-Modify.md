---
title: "Why R Copies Your Data (And How Copy-on-Modify Actually Saves Memory)"
slug: "R-Copy-on-Modify"
description: "R copies your data when you modify it — but only when necessary. Learn how copy-on-modify works, how to detect copies, and how to avoid them."
keywords: "copy-on-modify, R memory management, tracemem(), R object copying, R performance, lobstr, R memory"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-fund-1"
post_type: "FR"
auto_link_terms: "copy-on-modify|R memory management|tracemem()"
auto_link_case_sensitive: false
fr_parent: "R-Data-Frames.html"
---

# Why R Copies Your Data (And How Copy-on-Modify Actually Saves Memory)

<p class="lead">When you assign <code>y &lt;- x</code> in R, both variables point to the same data in memory. R only makes a copy when you modify one of them. This "copy-on-modify" mechanism saves memory and is one of the most important things to understand about R performance.</p>

You've probably heard that "R copies everything" and that's why it's slow. That's a half-truth. R *can* copy — but it's smarter than most people think. Understanding when R copies (and when it doesn't) lets you write faster code and avoid mysterious memory spikes.

## Introduction

In most programming languages, assignment creates a copy. In Python, `y = x` for a list creates a reference (both point to the same object, and changing one affects the other). R takes a middle path called **copy-on-modify**:

1. `y <- x` — both `x` and `y` point to the **same data** (no copy yet)
2. Modify `y` — **now** R makes a copy of the data for `y`, leaving `x` untouched

This means assignment is cheap (no copying), and copies happen only when necessary (on modification). It's the best of both worlds: safe (no surprise mutations) and efficient (no unnecessary copies).

```r
# Step 1: x and y share the same data
x <- 1:1000000
cat("x created:", object.size(x), "bytes\n")

# Step 2: Assignment doesn't copy
y <- x
cat("After y <- x, still same memory footprint\n")

# Step 3: Modification triggers the copy
y[1] <- 999L
cat("After modifying y, now two separate copies exist\n")
cat("x[1]:", x[1], "(unchanged)\n")
cat("y[1]:", y[1], "(modified)\n")
```

The key insight: `y <- x` is instant regardless of how large `x` is, because no data is copied. The copy only happens when you modify `y`.

## Names and Values: The Mental Model

Think of R variables as **name tags**, not boxes. When you write `x <- c(1, 2, 3)`, you create a value `c(1, 2, 3)` in memory and stick a name tag "x" on it. When you write `y <- x`, you stick a second name tag "y" on the *same value*. No copying.

```r
# Both names point to the same value
x <- c(10, 20, 30)
y <- x

# They're identical — same underlying data
cat("x:", x, "\n")
cat("y:", y, "\n")
cat("identical(x, y):", identical(x, y), "\n")

# Modify y — NOW a copy happens
y[2] <- 99
cat("\nAfter y[2] <- 99:\n")
cat("x:", x, "\n")  # Still 10, 20, 30
cat("y:", y, "\n")  # Now 10, 99, 30
```

R guarantees that modifying `y` never affects `x`. That's the "safe" part. The "efficient" part is that the copy is deferred until it's actually needed.

## When Does R Copy?

### Copies happen when:

```r
# 1. Modifying a shared vector
x <- 1:5
y <- x
y[3] <- 99    # Copy triggered here

# 2. Modifying inside a function (usually)
double_first <- function(v) {
  v[1] <- v[1] * 2    # v is shared with the caller's variable
  return(v)
}
original <- c(10, 20, 30)
result <- double_first(original)
cat("Original:", original, "(unchanged)\n")
cat("Result:", result, "\n")
```

### Copies DON'T happen when:

```r
# 1. Assignment without modification
x <- 1:1000000
y <- x            # No copy — just a new name tag
z <- y            # Still no copy — three name tags, one value

# 2. Read-only operations
cat("mean:", mean(x), "\n")    # No copy — just reading
cat("length:", length(x), "\n") # No copy
cat("x[1:5]:", x[1:5], "\n")   # No copy (subsetting creates a new smaller object)

# 3. Only one name pointing to the data
x <- 1:10
# If y is removed or reassigned, x is the sole owner
x[5] <- 99   # No copy needed — x is the only name tag
cat("Modified in place:", x, "\n")
```

The last point is important: if only one name tag points to data, R can **modify in place** without copying. This is why removing temporary variables (or operating in a function's local scope) can speed up your code.

## How Copy-on-Modify Affects Data Frames

Data frames are lists of column vectors. When you modify a column, R copies **only that column** — not the entire data frame. This is called a **shallow copy**:

```r
# Create a data frame with several columns
df <- data.frame(
  a = 1:5,
  b = letters[1:5],
  c = rnorm(5)
)

# Modify one column
df2 <- df
df2$a <- df2$a * 10

cat("Original df$a:", df$a, "\n")
cat("Modified df2$a:", df2$a, "\n")

# Only column 'a' was copied!
# Columns b and c are still shared between df and df2
cat("df$b and df2$b identical:", identical(df$b, df2$b), "\n")
```

This is efficient — modifying one column of a 1GB data frame doesn't copy all 1GB. Only the changed column gets a new copy.

### Row modification is expensive

```r
# Column modification: only copies the modified column
df <- data.frame(x = 1:5, y = 6:10, z = 11:15)
df$x[3] <- 999
cat("After modifying column: fast (shallow copy)\n")

# Row modification: copies more data
df[3, ] <- c(100, 200, 300)
cat("After modifying row: copies all affected columns\n")

# This is why: columns are vectors, rows are NOT
# Modifying a row touches every column vector
print(df)
```

> **Performance tip:** When possible, work column-wise (modifying whole columns) rather than row-wise (modifying individual rows). This minimizes copies and is much faster for large data frames.

## Lists and Shallow Copying

Lists use the same copy-on-modify rule, but with an important nuance — **shallow copies**:

```r
# A list with large elements
big_list <- list(
  numbers = 1:1000000,
  text = paste0("item_", 1:1000000)
)

cat("Original size:", object.size(big_list), "bytes\n")

# Assignment: no copy
big_list2 <- big_list

# Modify one element: only THAT element is copied
big_list2$numbers <- big_list2$numbers * 2

cat("Original numbers[1]:", big_list$numbers[1], "\n")
cat("Modified numbers[1]:", big_list2$numbers[1], "\n")
# The 'text' element is still shared — not copied!
```

## Practical Implications: Writing Faster R Code

### Avoid growing vectors in loops

This is the #1 performance killer in R — and copy-on-modify explains why:

```r
# BAD: Growing a vector triggers a copy every iteration
bad_approach <- function(n) {
  result <- c()
  for (i in 1:n) {
    result <- c(result, i^2)  # Copy entire vector each time!
  }
  result
}

# GOOD: Pre-allocate, then fill
good_approach <- function(n) {
  result <- numeric(n)  # Allocate once
  for (i in 1:n) {
    result[i] <- i^2    # Modify in place (single owner)
  }
  result
}

# BEST: Vectorize — no loop at all
best_approach <- function(n) {
  (1:n)^2
}

n <- 10000
cat("Bad:", system.time(bad_approach(n))["elapsed"], "sec\n")
cat("Good:", system.time(good_approach(n))["elapsed"], "sec\n")
cat("Best:", system.time(best_approach(n))["elapsed"], "sec\n")
```

The "bad" approach copies the entire vector at each step: step 1 copies 1 element, step 2 copies 2 elements, ..., step n copies n elements. That's O(n²) copies total. Pre-allocation or vectorization avoids this entirely.

### Avoid unnecessary intermediate copies

```r
# Unnecessary copies
x <- rnorm(1000000)
y <- x          # Names point to same data
z <- y + 1      # Creates new vector for z (necessary — new values)
w <- z          # No copy — just a name
w <- w * 2      # Copy triggered (z also points to the same data)

# Cleaner: avoid intermediate names
x <- rnorm(1000000)
result <- (x + 1) * 2  # One expression, fewer copies

cat("Result length:", length(result), "\n")
cat("First 5:", round(result[1:5], 3), "\n")
```

### Use data.table for truly in-place modification

The `data.table` package provides genuine modify-in-place operations with the `:=` operator:

```r
# With data.table, modification happens in place — no copies!
# (Not available in WebR, but here's the syntax)
# library(data.table)
# dt <- data.table(x = 1:5, y = 6:10)
# dt[, z := x + y]   # Adds column z IN PLACE — no copy of dt!

# Compare to base R / dplyr:
df <- data.frame(x = 1:5, y = 6:10)
df$z <- df$x + df$y   # Creates a copy of at least the column
cat("data.table := modifies in place (no copy)\n")
cat("Base R $ creates a copy of the modified column\n")
print(df)
```

For datasets with millions of rows, `data.table`'s in-place modification can be 10-100x faster than base R or dplyr.

## Environments: The Exception to Copy-on-Modify

There's one R object that uses **reference semantics** (like Python) — environments:

```r
# Environments are NOT copied on modify
e1 <- new.env(parent = emptyenv())
e1$x <- 42

e2 <- e1  # Same environment — NOT a copy!
e2$x <- 999

cat("e1$x:", e1$x, "\n")  # 999 — e1 was affected!
cat("e2$x:", e2$x, "\n")  # 999 — same object

# This is why R6 classes (which use environments) have reference semantics
# and why environments are used for mutable state
```

This is the exception that proves the rule. Regular R objects (vectors, lists, data frames) are copy-on-modify. Environments are modify-in-place. R6 classes exploit this for object-oriented programming with mutable state.

## Practice Exercises

### Exercise 1: Predict the Copies

```r
# Exercise: For each line, predict whether a copy happens
# Write "COPY" or "NO COPY" next to each line, then verify

x <- 1:10          # ?
y <- x              # ?
z <- y              # ?
y[5] <- 99L         # ?
x[1] <- 0L          # ?
w <- z + 1          # ?
rm(z)               # ?
w[1] <- 100         # ?

# Write your predictions, then check by running the code:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
x <- 1:10          # NO COPY — creates new object
y <- x              # NO COPY — second name tag on same data
z <- y              # NO COPY — third name tag on same data
y[5] <- 99L         # COPY — y gets its own copy (x and z still share)
x[1] <- 0L          # COPY — x gets its own copy (z still has the original)
w <- z + 1          # NEW OBJECT — z + 1 creates a new vector
rm(z)               # NO COPY — just removes a name tag
w[1] <- 100         # NO COPY — w is the sole owner (modify in place)

cat("x:", x, "\n")
cat("y:", y, "\n")
cat("w:", w, "\n")
# z doesn't exist anymore
```

**Explanation:** The key insight is that copies only happen when data has multiple name tags AND you modify through one of them. When `rm(z)` removes the last other reference, `w` becomes the sole owner and can be modified in place.

</details>

### Exercise 2: Pre-allocate vs Grow

```r
# Exercise: Write two versions of a function that creates
# the first 20 Fibonacci numbers:
# Version 1: Grow a vector with c()
# Version 2: Pre-allocate with numeric(20)
# Compare their outputs (should be identical)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
# Version 1: Growing (slow for large n)
fib_grow <- function(n) {
  result <- c(1, 1)
  for (i in 3:n) {
    result <- c(result, result[i-1] + result[i-2])
  }
  result
}

# Version 2: Pre-allocated (fast)
fib_prealloc <- function(n) {
  result <- numeric(n)
  result[1:2] <- 1
  for (i in 3:n) {
    result[i] <- result[i-1] + result[i-2]
  }
  result
}

# Compare
cat("Grow:", fib_grow(20), "\n")
cat("Prealloc:", fib_prealloc(20), "\n")
cat("Match:", identical(fib_grow(20), fib_prealloc(20)), "\n")
```

**Explanation:** Both produce the same result, but `fib_prealloc` is much faster for large `n` because it allocates memory once. `fib_grow` copies the entire vector at each step — at step 100, it copies 99 elements just to add one more.

</details>

### Exercise 3: Column vs Row Operations

```r
# Exercise: Create a 1000-row data frame with 5 numeric columns.
# Compare the time to:
# 1. Double every value in column 'a' (column-wise)
# 2. Double every value in row 500 (row-wise)
# Which is faster? Why?

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
df <- data.frame(
  a = rnorm(1000), b = rnorm(1000), c = rnorm(1000),
  d = rnorm(1000), e = rnorm(1000)
)

# Column-wise: modify one column vector
t1 <- system.time({
  for (rep in 1:100) {
    df_col <- df
    df_col$a <- df_col$a * 2
  }
})

# Row-wise: modify one row (touches all columns)
t2 <- system.time({
  for (rep in 1:100) {
    df_row <- df
    df_row[500, ] <- df_row[500, ] * 2
  }
})

cat("Column-wise (100 reps):", t1["elapsed"], "sec\n")
cat("Row-wise (100 reps):", t2["elapsed"], "sec\n")
cat("Column-wise is faster because it only copies one column vector.\n")
cat("Row-wise modifies all 5 columns, triggering 5 copies.\n")
```

**Explanation:** Column modification in a data frame triggers a copy of just that one column (shallow copy). Row modification touches every column, potentially triggering a copy of each one. For wide data frames, this difference is dramatic.

</details>

## Summary

| Concept | What happens | Performance impact |
|---------|-------------|-------------------|
| `y <- x` | Both point to same data | Free (no copy) |
| Modify `y` when shared | R copies `y`'s data | One-time cost |
| Modify `y` when sole owner | R modifies in place | Free (no copy) |
| Growing vector in loop | Copy at every step | O(n²) — very slow |
| Pre-allocate + fill | One allocation | O(n) — fast |
| Column modification in df | Copies only that column | Fast (shallow copy) |
| Row modification in df | Copies all affected columns | Slower |
| Environments | Reference semantics (no copy) | Always in-place |

**The three rules for fast R:**
1. Pre-allocate vectors before loops
2. Prefer vectorized operations over loops
3. Work column-wise, not row-wise, on data frames

## FAQ

### Does R really copy a 1GB data frame when I modify one cell?

No. R makes a **shallow copy** of the data frame structure and a **deep copy** of only the modified column. The other columns are still shared. So modifying one cell in a 1GB data frame with 10 columns copies about 100MB (one column), not 1GB.

### Is copy-on-modify the same as pass-by-value?

Similar but smarter. True pass-by-value copies data immediately. Copy-on-modify defers the copy until modification — so if the function only reads the data, no copy ever happens.

### Why doesn't R use references like Python?

Safety. In Python, `y = x` for a list means modifying `y` also changes `x` — a major source of bugs. R's copy-on-modify guarantees that modifying one variable never affects another. You trade some performance for much safer code.

### How do I check if a copy happened?

Use `tracemem()` in a local R session (not available in WebR): `tracemem(x)` prints a message whenever `x` is copied. The `lobstr` package provides `obj_addr()` to compare memory addresses.

### When should I use data.table instead of base R?

When you're working with data frames larger than ~1 million rows and performance matters. `data.table`'s `:=` operator provides genuine in-place modification, avoiding the copy overhead entirely.

## What's Next?

Understanding copy-on-modify helps you write faster R code. Related topics:

1. **R Matrices** — uniform numeric data without copy overhead
2. **R Subsetting** — how [], [[]], and $ interact with copy-on-modify
3. **Data Wrangling with dplyr** — modern data manipulation built on these principles
