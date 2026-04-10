---
title: "R Names and Values: How R Actually Stores Data (Copy-on-Modify Explained)"
slug: "R-Names-and-Values"
description: "Understand how R binds names to values, copy-on-modify semantics, modify-in-place optimization, and how to use lobstr and tracemem for memory debugging."
keywords: "R names and values, copy-on-modify R, R binding, modify-in-place R, lobstr tracemem, R memory model, R internals"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.1.1"
post_type: "C"
auto_link_terms: "R names and values|copy-on-modify|modify-in-place|R binding"
auto_link_case_sensitive: false
---

# R Names and Values: How R Actually Stores Data (Copy-on-Modify Explained)

<p class="lead">In R, variables are <strong>names bound to values</strong>, not boxes containing data. When you write <code>y &lt;- x</code>, you don't copy the data -- you attach a second name tag to the same value. R only copies when you <strong>modify</strong> a shared value. Understanding this "copy-on-modify" model is the key to writing fast, memory-efficient R code.</p>

Most R users never think about this -- until they run out of memory or wonder why their code is slow. This tutorial explains the mental model, shows you how to observe it, and teaches you how to take advantage of it.

## Names Are Tags, Not Boxes

Think of R variables as **sticky notes** attached to objects in memory, not as containers that hold data.

```r
# Create a value and attach a name to it
x <- c(1, 2, 3)

# Attach a second name to the SAME value
y <- x

# Both names point to the same underlying data
cat("x:", x, "\n")
cat("y:", y, "\n")
cat("identical:", identical(x, y), "\n")

# The names are interchangeable at this point
# No data was copied by y <- x
```

This is why assignment in R is fast regardless of object size. `y <- x` for a 1GB data frame is instant -- it just adds another name tag.

```r
# Even for large objects, assignment is instant
big <- 1:10000000  # 10 million integers

# This does NOT copy 10 million integers
also_big <- big

cat("Length of big:", length(big), "\n")
cat("Length of also_big:", length(also_big), "\n")
# Both point to the same memory
```

## Copy-on-Modify

When two names point to the same value and you modify through one of them, R makes a copy first. This ensures the other name still sees the original data.

```r
# x and y share the same data
x <- c(10, 20, 30)
y <- x

# Modify y -- THIS triggers a copy
y[2] <- 99

# x is unchanged (the copy preserved it)
cat("x:", x, "\n")  # 10, 20, 30
cat("y:", y, "\n")  # 10, 99, 30

# Now x and y point to different data
```

### When does the copy happen?

The copy happens at the exact moment of modification -- not before, not after. This is lazy (deferred) copying.

```r
# Trace the sequence
a <- 1:5
cat("Step 1 - Created a:", a, "\n")

b <- a
cat("Step 2 - b <- a (no copy yet):", b, "\n")

c <- a
cat("Step 3 - c <- a (still no copy):", c, "\n")

# Three names, one value. Memory efficient!

b[1] <- 999
cat("Step 4 - Modified b (copy triggered for b):", b, "\n")
cat("a unchanged:", a, "\n")
cat("c unchanged:", c, "\n")

# Now: a and c share one value; b has its own copy
```

## Modify-in-Place Optimization

If only one name points to a value, R can **modify in place** without copying. This is a critical optimization.

```r
# Only one name pointing to the data
x <- c(1, 2, 3, 4, 5)

# If no other name shares this data, modification is in-place
x[3] <- 99
cat("Modified in place:", x, "\n")

# Compare: when shared, a copy is forced
a <- c(1, 2, 3, 4, 5)
b <- a           # Now two names share the data
a[3] <- 99       # Copy triggered because b also points to the data
cat("a:", a, "\n")
cat("b:", b, "\n")
```

### Functions and reference counts

When you pass a variable to a function, R increments the reference count. Inside the function, modifying the argument triggers a copy.

```r
# Passing to a function creates a temporary reference
double_first <- function(v) {
  # v is a new name pointing to the same data as the caller's variable
  v[1] <- v[1] * 2   # Copy happens here (v shares data with caller)
  v
}

original <- c(10, 20, 30)
result <- double_first(original)

cat("original:", original, "\n")  # Unchanged
cat("result:", result, "\n")      # Modified copy
```

## Observing with tracemem()

`tracemem()` marks an object so R prints a message every time it gets copied.

```r
# tracemem shows when copies happen
x <- c(1, 2, 3)
tracemem(x)

# Assignment: no copy
y <- x
cat("After y <- x: no copy message\n")

# Modification: copy!
y[1] <- 99
cat("After y[1] <- 99: copy was triggered\n")

untracemem(x)
```

### Data frame column behavior

```r
# Data frames use shallow copies
df <- data.frame(a = 1:3, b = 4:6, c = 7:9)
tracemem(df)

# Modifying one column copies only that column
df2 <- df
df2$a <- df2$a * 10
cat("Only column 'a' was copied, not the entire data frame\n")

untracemem(df)

cat("df$a:", df$a, "\n")
cat("df2$a:", df2$a, "\n")
cat("df$b and df2$b still share memory\n")
```

## Reference Counting in Practice

R uses reference counting to decide whether to copy or modify in place. Here are practical implications:

```r
# Growing a vector in a loop: BAD (copies every iteration)
bad_grow <- function(n) {
  result <- c()
  for (i in 1:n) {
    result <- c(result, i)  # Copy entire vector each time!
  }
  result
}

# Pre-allocate: GOOD (modify in place)
good_grow <- function(n) {
  result <- numeric(n)  # Allocate once
  for (i in 1:n) {
    result[i] <- i  # Modify in place (only one reference)
  }
  result
}

# Time comparison
n <- 10000
t1 <- system.time(bad_grow(n))
t2 <- system.time(good_grow(n))
cat("Bad (growing):", t1["elapsed"], "sec\n")
cat("Good (pre-allocated):", t2["elapsed"], "sec\n")
cat("Speedup:", round(t1["elapsed"] / max(t2["elapsed"], 0.001), 1), "x\n")
```

## Lists and Environments: Different Rules

Lists use copy-on-modify like vectors, but environments use **reference semantics** (like R6 objects).

```r
# Lists: copy-on-modify (like vectors)
list1 <- list(a = 1, b = 2, c = 3)
list2 <- list1
list2$a <- 99
cat("list1$a:", list1$a, "\n")  # Still 1
cat("list2$a:", list2$a, "\n")  # 99

# Environments: reference semantics (no copy)
env1 <- new.env(parent = emptyenv())
env1$x <- 100
env2 <- env1      # Both point to the SAME environment
env2$x <- 999

cat("\nenv1$x:", env1$x, "\n")  # 999! Modified in place
cat("env2$x:", env2$x, "\n")  # 999
cat("Same environment:", identical(env1, env2), "\n")
```

This is why R6 classes (which are based on environments) have reference semantics, while S3 objects (which are based on lists) have copy-on-modify semantics.

## The lobstr Package

The `lobstr` package provides tools to inspect R's memory model. While it may not be available in WebR, here's what it does:

```r
# lobstr::obj_addr(x) -- shows the memory address of the value x points to
# lobstr::ref(x, y)   -- shows whether x and y share memory
# lobstr::obj_size(x)  -- shows the actual memory used by x

# Simulation of what lobstr shows:
x <- 1:10
y <- x

# Before modification: same address
cat("Before modification:\n")
cat("  x and y are identical:", identical(x, y), "\n")
cat("  (lobstr would show same address)\n")

# After modification: different addresses
y[1] <- 99
cat("\nAfter y[1] <- 99:\n")
cat("  x and y identical:", identical(x, y), "\n")
cat("  (lobstr would show different addresses)\n")
```

## Summary Table

| Concept | Description | Performance Implication |
|---------|-------------|----------------------|
| Name binding | Variables are names pointing to values | Assignment is O(1), regardless of size |
| Copy-on-modify | Copy happens only when shared data is modified | Reads are free; writes may copy |
| Modify-in-place | If only one name exists, no copy needed | Removing unused variables helps |
| Reference counting | R tracks how many names point to each value | Functions increment the count |
| Shallow copy | Lists/data frames copy only the modified element | Column-wise ops are cheaper |
| Environments | Always reference semantics (no copy) | R6/environments are mutable |

## Practice Exercises

**Exercise 1:** Predict the output: `x <- 1:5; y <- x; y[3] <- 0; cat(x[3])`. Will it print 3 or 0? Why?

<details><summary>Click to reveal solution</summary>

It prints **3**. When `y[3] <- 0` executes, R sees that `x` and `y` share the same data. Copy-on-modify kicks in: R copies the data for `y`, then modifies the copy. `x` is unchanged.

```r
x <- 1:5
y <- x
y[3] <- 0
cat("x[3]:", x[3], "\n")  # 3 (unchanged)
cat("y[3]:", y[3], "\n")  # 0 (modified copy)
```

</details>

**Exercise 2:** Why is `result <- c(result, new_value)` inside a loop slow for large vectors? How would you fix it?

<details><summary>Click to reveal solution</summary>

Each `c(result, new_value)` creates a new, longer vector and copies all existing elements. For n iterations, this is O(n^2) total copies.

Fix: pre-allocate the vector.

```r
# Slow: O(n^2)
# result <- c()
# for (i in 1:n) result <- c(result, i)

# Fast: O(n)
n <- 10000
result <- numeric(n)
for (i in 1:n) result[i] <- i
cat("First 10:", result[1:10], "\n")
```

</details>

**Exercise 3:** Given that environments have reference semantics, what happens here: `e <- new.env(); e$x <- 1; f <- e; f$x <- 2; cat(e$x)`?

<details><summary>Click to reveal solution</summary>

It prints **2**. Environments use reference semantics (not copy-on-modify). `f <- e` does not copy the environment. Both `e` and `f` point to the same environment, so modifying `f$x` also changes `e$x`.

```r
e <- new.env(parent = emptyenv())
e$x <- 1
f <- e
f$x <- 2
cat("e$x:", e$x, "\n")  # 2
cat("Same env:", identical(e, f), "\n")  # TRUE
```

</details>

## FAQ

**Q: Is copy-on-modify the same as "pass by value"?**
Not exactly. True pass-by-value copies immediately on assignment. R's copy-on-modify defers the copy until modification. It's more accurately called "pass by value with copy-on-modify optimization." The end result is the same (no surprise mutations) but with better memory efficiency.

**Q: Can I force R to modify in place?**
You can't directly force it, but you can arrange your code so that only one reference exists when you modify. For example, use `rm()` to remove extra references before modifying, or wrap modifications in a function (local scope limits references).

**Q: Do all R objects use copy-on-modify?**
Most do: vectors, lists, data frames, matrices. The exceptions are environments (always reference) and certain internal objects. R6 classes use environments internally, which is why they have reference semantics.

## Continue Learning
- [R Assignment Deep Dive](R-Assignment-Deep-Dive.html) -- All assignment operators and their scoping rules
- [Understanding R Memory with lobstr](R-Memory-lobstr.html) -- Inspect object sizes and references
- [R Copy-on-Modify](R-Copy-on-Modify.html) -- More examples of copy-on-modify in action
