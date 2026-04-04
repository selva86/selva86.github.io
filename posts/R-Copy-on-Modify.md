---
title: "Why R Copies Your Data: Copy-on-Modify Explained"
slug: "R-Copy-on-Modify"
description: "Master R's copy-on-modify semantics — when R copies data, when it doesn't, and how to track memory usage. Understand why reference semantics surprise you in R."
keywords: "copy on modify R, R memory, R reference semantics, tracemem R, lobstr, R data copying"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "FR-fund-1"
post_type: "FR"
auto_link_terms: "copy-on-modify|R memory model|copy on modify"
auto_link_case_sensitive: false
fr_parent: "R-Data-Types.html"
---

<nav class="breadcrumb-nav">Home &gt; Learn R &gt; Further Reading &gt; R Copy-on-Modify</nav>

# Why R Copies Your Data: Copy-on-Modify Explained

<p class="lead">R uses <strong>copy-on-modify</strong> semantics — when you assign <code>y &lt;- x</code>, both names point to the same object in memory. Only when you modify one does R actually copy. This is both memory-efficient and a source of beginner confusion.</p>

## Introduction

In most programming languages, `y <- x` makes a copy. In R, it doesn't — both names point to the same memory until one of them is modified. This "copy-on-modify" design saves memory when you're just reading data and defers the cost of copying until it's actually needed.

This tutorial unpacks when R copies and when it doesn't, using the `tracemem()` function to watch copying happen in real time. Understanding this changes how you write efficient R code.

## What is copy-on-modify?

When you assign one object to another name, R does NOT create a new copy. Both names point to the same memory.

```r
x <- c(1, 2, 3, 4, 5)
y <- x           # no copy — both names point to same vector

# tracemem() reports when an object gets copied
tracemem(x)
#> [1] "<0x...>"

# Modifying y triggers the copy
y[1] <- 99
#> tracemem[0x...]: y   <- copy happened here

x    # x is unchanged
#> [1] 1 2 3 4 5
y
#> [1] 99  2  3  4  5
```

`y <- x` created a second name for the same vector — no memory allocation. The copy only happened when we modified `y[1]`. After that moment, `x` and `y` point to different objects.

[KEY INSIGHT]
**R is reference-sharing until you modify. Assignment is free; modification triggers copying.** This is why you can pass large data frames to functions without worrying about memory — they share until the function modifies them.

## When does R skip the copy?

R's internal code can detect "this object has only one name pointing to it" and modify in place without copying.

```r
# Single reference — modifies in place
x <- c(1, 2, 3)
tracemem(x)
x[1] <- 99       # may modify in place (R 4.0+)
# No tracemem copy message printed for in-place modify

# Multiple references — forces copy
x <- c(1, 2, 3)
y <- x
tracemem(x)
x[1] <- 99       # copy happens (x had 2 references)
untracemem(x)
```

R 4.0+ has refcount tracking that can modify objects in place when it's safe. In older R versions, every modification triggered a copy regardless.

## How do you see when R copies?

Use `tracemem()` to print a message each time R copies an object.

```r
library(lobstr)

x <- c(1:100)
obj_addr(x)
#> [1] "0x..."

# Copy-on-modify in a function
modify <- function(v) {
  v[1] <- 999
  v
}

y <- modify(x)
obj_addr(x)
#> [1] "0x..."         # x unchanged
obj_addr(y)
#> [1] "0x...different"  # y is a new object
```

`lobstr::obj_addr()` shows the memory address of an R object. If two names share an address, they share memory. If `modify()` had returned `v` without touching it, `y` would share `x`'s address.

## When does copy-on-modify surprise you?

Three common scenarios catch beginners off guard.

### Scenario 1: Modifying a data frame column

```r
df <- data.frame(x = 1:1000, y = rnorm(1000))
tracemem(df)

df$x[1] <- 999   # copies the entire data frame!
#> tracemem[...]: df
```

Changing one element copies the entire data frame because R's refcount sees `df` as having multiple "parts" being modified. For heavy data manipulation, packages like `data.table` use reference semantics to avoid this.

### Scenario 2: Function arguments

```r
big_vector <- 1:1e7   # 10 million elements

show_length <- function(v) {
  length(v)   # just reading — no copy
}

modify_arg <- function(v) {
  v[1] <- 999   # copies because we're modifying
  v
}
```

Passing to a read-only function: no copy. Passing to a modify-then-return function: copies once inside.

### Scenario 3: Growing a vector in a loop

```r
# Slow — allocates and copies every iteration
result <- c()
for (i in 1:1000) {
  result <- c(result, i)
}

# Fast — pre-allocated, modifies in place
result <- numeric(1000)
for (i in 1:1000) {
  result[i] <- i
}
```

Pre-allocated vectors can be modified in place (single reference). Growing with `c()` creates a new vector every iteration.

## Common Mistakes and How to Fix Them

### Mistake 1: Assuming R will mutate in place

❌ **Wrong:**
```r
# Trying to modify from inside a function
modify_global <- function(x) {
  x[1] <- 999    # only modifies local copy
}

my_v <- c(1, 2, 3)
modify_global(my_v)
my_v
#> [1] 1 2 3   # unchanged!
```

**Why it is wrong:** R passes arguments by copy-on-modify. The function's `x` is a local reference; modifying it doesn't touch `my_v`.

✅ **Correct:**
```r
modify_return <- function(x) {
  x[1] <- 999
  x
}
my_v <- modify_return(my_v)
my_v
#> [1] 999   2   3
```

### Mistake 2: Growing a vector with `c()` in a loop

❌ **Wrong:** (see Scenario 3 above)

✅ **Correct:** Pre-allocate, then assign by index.

### Mistake 3: Chained assignments with shared references

❌ **Wrong:**
```r
my_list <- list(a = 1:3, b = 4:6)
my_copy <- my_list
my_list$a[1] <- 999
# Did my_copy change? No — copy-on-modify triggered.
my_copy$a
#> [1] 1 2 3
```

**Actually this is fine** — R correctly copied. But don't assume list elements are shared after modification.

### Mistake 4: Using `<<-` to "avoid copies"

❌ **Wrong:**
```r
modify_via_global <- function() {
  my_v[1] <<- 999   # writes to global — confusing!
}
```

**Why it is wrong:** `<<-` bypasses scoping rules, creating hidden dependencies. Avoid it except in closures where you deliberately capture state.

## Practice Exercises

### Exercise 1: Verify Same Address

Use `lobstr::obj_addr()` to verify that `x` and `y` share memory after assignment.

```r
# install.packages("lobstr")
library(lobstr)

my_x <- c(1, 2, 3, 4, 5)
my_y <- my_x
# Write your code below to check addresses

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lobstr)
my_x <- c(1, 2, 3, 4, 5)
my_y <- my_x
obj_addr(my_x) == obj_addr(my_y)
#> [1] TRUE
```

</details>

### Exercise 2: Observe Copy on Modify

After assignment, modify `y` and check if addresses still match.

```r
library(lobstr)
my_x <- c(1, 2, 3)
my_y <- my_x
my_y[1] <- 99
# Check addresses now

```

<details>
<summary>Click to reveal solution</summary>

```r
library(lobstr)
my_x <- c(1, 2, 3)
my_y <- my_x
my_y[1] <- 99
obj_addr(my_x) == obj_addr(my_y)
#> [1] FALSE
```

**Explanation:** Modifying `my_y` triggered the copy.

</details>

### Exercise 3: Track Copies in a Function

```r
my_modify <- function(v) {
  v[1] <- 999
  v
}

my_x <- 1:1000
tracemem(my_x)
# Call my_modify - how many copies happen?
my_y <- my_modify(my_x)
untracemem(my_x)
```

<details>
<summary>Click to reveal solution</summary>

One copy happens: when `my_modify` assigns to `v[1]`. The argument `v` initially shared with `my_x`, but the assignment triggered a copy.

</details>

## Complete Example: Measuring Memory Impact

```r
library(lobstr)

# Make a 10M element vector
big <- 1:1e7
obj_size(big)
#> 40.00 MB

# Assignment is free (still 40 MB total)
big2 <- big
obj_size(big, big2)
#> 40.00 MB   (shared)

# Modifying triggers a copy
big2[1] <- 0L
obj_size(big, big2)
#> 80.00 MB   (two separate objects now)
```

`lobstr::obj_size()` is smart enough to report shared memory correctly. Before modification, two 40 MB vectors share memory and total 40 MB. After, they're separate and total 80 MB.

## Summary

| Action | Copies? |
|---|---|
| `y <- x` | No |
| Pass `x` to function (read only) | No |
| Modify `x` with single reference | No (R 4.0+, in place) |
| Modify `x` after `y <- x` | Yes |
| `c(result, new)` in a loop | Yes, every iteration |
| Modify data frame column | Usually yes (whole frame) |

## FAQ

### Is R pass-by-value or pass-by-reference?

Pass-by-copy-on-modify. Names are references, but modifying through a reference triggers a copy. The end result feels like pass-by-value to the caller.

### Why do loops with `c()` get slow?

Each `c(result, new)` copies `result` entirely because both the function call and the result name reference the vector. O(n²) total copying.

### Do `data.table` and R6 avoid copying?

Yes — both use reference semantics. `dt[, new_col := x]` modifies `dt` in place. R6 objects are mutable references.

### How much memory does my object use?

`object.size(x)` (base R) or `lobstr::obj_size(x)` (smarter about shared memory). `obj_size()` handles lists, environments, and shared references correctly.

### Can I force R to copy?

Rarely needed, but `x <- rlang::duplicate(y)` makes an explicit copy. Usually you want copy-on-modify; explicit copying is a rare optimization choice.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 2 (Names and values). [Link](https://adv-r.hadley.nz/names-values.html)
2. lobstr package documentation. [Link](https://lobstr.r-lib.org/)
3. R manual — `tracemem()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/tracemem.html)
4. R Internals — SEXP reference counting. [Link](https://cran.r-project.org/doc/manuals/r-release/R-ints.html)
5. Wickham, H. — *Advanced R*, Section 2.5 (Modify in place). [Link](https://adv-r.hadley.nz/names-values.html#modify-in-place)
6. data.table documentation — Reference semantics. [Link](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-reference-semantics.html)
7. R Core — R 4.0 release notes (refcount improvements). [Link](https://cran.r-project.org/doc/manuals/r-devel/NEWS.html)
