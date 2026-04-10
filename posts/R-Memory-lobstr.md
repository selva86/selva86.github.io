---
title: "Understanding R Memory: lobstr Package — Object Sizes & References"
slug: "R-Memory-lobstr"
description: "Use the lobstr package to inspect R memory: obj_size() for true object sizes, ref() for shared references, obj_addr() for addresses, and memory profiling tips."
keywords: "lobstr R, obj_size R, ref R, R memory profiling, R object size, mem_used R, R memory management"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.1.3"
post_type: "C"
auto_link_terms: "lobstr package|obj_size|R memory profiling|R object size"
auto_link_case_sensitive: false
---

# Understanding R Memory: lobstr Package -- Object Sizes & References

<p class="lead">The <strong>lobstr</strong> package is R's best tool for understanding memory usage. It shows you the <em>true</em> size of objects (including shared components), whether two variables point to the same data, and how R's memory is structured internally. If you've ever wondered "why is my R session using 8 GB?", lobstr gives you the answer.</p>

Base R has `object.size()`, but it over-counts shared memory. `lobstr::obj_size()` accounts for sharing and gives you accurate numbers. This tutorial shows you how to use lobstr and how to think about R memory.

## obj_size(): True Object Size

`obj_size()` tells you exactly how much memory an object uses, correctly accounting for shared components.

```r
# Base R object.size vs lobstr::obj_size
x <- 1:1000

# object.size() shows the size of this object
cat("object.size:", object.size(x), "bytes\n")

# For simple objects, they agree. The difference shows with shared data.
y <- list(x, x, x)  # Three references to the SAME vector

# object.size counts x three times
cat("object.size of list:", object.size(y), "bytes\n")

# lobstr::obj_size would count x only once
# Because all three list elements point to the same vector
cat("True size is smaller due to sharing\n")
```

### Size of different data types

```r
# How much memory do different types use?
cat("Empty integer(0):", object.size(integer(0)), "bytes\n")
cat("1 integer:", object.size(1L), "bytes\n")
cat("1 double:", object.size(1.0), "bytes\n")
cat("1 character:", object.size("a"), "bytes\n")
cat("1 logical:", object.size(TRUE), "bytes\n")

cat("\n--- Scaling ---\n")
cat("1000 integers:", object.size(integer(1000)), "bytes\n")
cat("1000 doubles:", object.size(double(1000)), "bytes\n")
cat("1000 logicals:", object.size(logical(1000)), "bytes\n")

# Every R object has overhead (~40-56 bytes for the header)
# Then the actual data: 4 bytes/integer, 8 bytes/double, 4 bytes/logical
cat("\nPer-element sizes:\n")
n <- 10000
cat("Integer:", (object.size(integer(n)) - object.size(integer(0))) / n, "bytes/element\n")
cat("Double:", (object.size(double(n)) - object.size(double(0))) / n, "bytes/element\n")
```

## Understanding Object Overhead

Every R object carries metadata overhead. This is why a single integer is not 4 bytes -- it's about 56 bytes due to the SEXP header, type info, and memory management data.

```r
# The overhead is fixed per object, not per element
sizes <- sapply(c(1, 10, 100, 1000, 10000), function(n) {
  object.size(integer(n))
})

cat("Size of integer vectors:\n")
for (i in seq_along(sizes)) {
  n <- c(1, 10, 100, 1000, 10000)[i]
  cat(sprintf("  n=%5d: %8d bytes (%5.1f bytes/element)\n",
              n, sizes[i], sizes[i] / n))
}
cat("\nOverhead matters for small objects, negligible for large ones.\n")
```

## Detecting Shared References

Understanding when objects share memory is crucial for performance. Here's how to check.

```r
# Two names pointing to the same data
x <- 1:1000000
y <- x

# They share memory
cat("Before modification:\n")
cat("  x and y identical:", identical(x, y), "\n")
cat("  Combined size should be ~same as one vector\n")

# After modification, they're separate
y[1] <- 0L
cat("\nAfter y[1] <- 0L:\n")
cat("  x[1]:", x[1], "\n")
cat("  y[1]:", y[1], "\n")
cat("  Now two separate copies exist in memory\n")
```

### Data frame column sharing

```r
# Data frames share column vectors efficiently
df1 <- data.frame(
  a = 1:10000,
  b = rnorm(10000),
  c = sample(letters, 10000, replace = TRUE)
)

df2 <- df1  # Shares ALL columns

# Check sizes
s1 <- object.size(df1)
cat("df1 size:", s1, "bytes\n")

# Modify one column -- only that column is copied
df2$a <- df2$a * 2

cat("After modifying df2$a:\n")
cat("  df1$a[1]:", df1$a[1], "\n")
cat("  df2$a[1]:", df2$a[1], "\n")
cat("  Columns b and c are still shared\n")
```

## Memory Profiling Techniques

### Measuring total R memory usage

```r
# gc() reports current memory usage
gc_info <- gc()
cat("Memory used (Mb):\n")
print(gc_info)

# Track memory before and after an operation
before <- gc()
big_data <- matrix(rnorm(1000000), nrow = 1000)
after <- gc()

used_before <- before[2, 2]  # Mb used
used_after <- after[2, 2]
cat("\nMemory increase:", round(used_after - used_before, 1), "Mb\n")

rm(big_data)
gc()
```

### Profiling memory in functions

```r
# Simple memory tracking wrapper
mem_track <- function(expr_label, expr) {
  gc(reset = TRUE)
  before <- gc()[2, 2]
  result <- expr
  after <- gc()[2, 2]
  cat(sprintf("%s: %.1f Mb (before) -> %.1f Mb (after) = +%.1f Mb\n",
              expr_label, before, after, after - before))
  invisible(result)
}

# Track different operations
mem_track("Create 1M doubles", rnorm(1000000))
mem_track("Create 1M integers", sample.int(100, 1000000, replace = TRUE))
mem_track("Create data.frame", data.frame(x = rnorm(1000000), y = rnorm(1000000)))
```

## ALTREP: Efficient Representation

R 3.5+ introduced ALTREP (alternative representations) for compact storage of certain patterns.

```r
# ALTREP: 1:n uses almost no memory regardless of n
small_seq <- 1:100
huge_seq <- 1:100000000  # 100 million!

cat("1:100 size:", object.size(small_seq), "bytes\n")
cat("1:100M size:", object.size(huge_seq), "bytes\n")
# Both are tiny! ALTREP stores just start, end, and step.

# But materializing it uses full memory
# materialized <- huge_seq + 0  # This would allocate ~400 MB

# Sequences are ALTREP; random vectors are not
random_vec <- sample.int(100, 100)
cat("sample(100) size:", object.size(random_vec), "bytes\n")
cat("1:100 size:", object.size(1:100), "bytes (ALTREP!)\n")
```

## String Interning and Character Vectors

R caches unique strings in a global string pool. Duplicate strings share memory.

```r
# Character vectors with repeated values are efficient
unique_strings <- paste0("item_", 1:10000)
repeated_strings <- rep(c("cat", "dog", "bird"), length.out = 10000)

cat("10000 unique strings:", object.size(unique_strings), "bytes\n")
cat("10000 repeated (3 unique):", object.size(repeated_strings), "bytes\n")

# Factors are even more compact for repeated strings
f <- factor(repeated_strings)
cat("As factor:", object.size(f), "bytes\n")

cat("\nFactors store integer codes + a small levels vector.\n")
cat("For high-cardinality data, characters may be better.\n")
```

## Common Memory Traps

```r
# Trap 1: Growing vectors in a loop
cat("=== Trap 1: Growing vectors ===\n")
n <- 50000

# Bad: grows the vector each iteration
t1 <- system.time({
  result <- c()
  for (i in 1:n) result <- c(result, i)
})

# Good: pre-allocate
t2 <- system.time({
  result <- numeric(n)
  for (i in 1:n) result[i] <- i
})

cat("Growing:", t1["elapsed"], "sec\n")
cat("Pre-alloc:", t2["elapsed"], "sec\n")

# Trap 2: Unnecessary copies via intermediate variables
cat("\n=== Trap 2: Intermediate copies ===\n")
df <- data.frame(x = rnorm(100000))

# This creates an extra copy:
# temp <- df$x
# temp <- temp * 2
# df$x <- temp

# This is more memory-efficient:
df$x <- df$x * 2
cat("Direct modification avoids intermediate copies\n")
```

## Measuring Specific Objects

```r
# Useful function to summarize memory usage of workspace
workspace_summary <- function() {
  objs <- ls(envir = .GlobalEnv)
  if (length(objs) == 0) {
    cat("Workspace is empty\n")
    return(invisible(NULL))
  }

  sizes <- sapply(objs, function(nm) {
    object.size(get(nm, envir = .GlobalEnv))
  })

  df <- data.frame(
    object = objs,
    size_bytes = sizes,
    size_kb = round(sizes / 1024, 1),
    stringsAsFactors = FALSE
  )
  df <- df[order(-df$size_bytes), ]
  rownames(df) <- NULL

  cat("Top objects by memory:\n")
  print(head(df, 10))
  cat("\nTotal:", round(sum(sizes) / 1024 / 1024, 2), "MB\n")
}

# Create some objects to inspect
small_vec <- 1:100
medium_df <- mtcars
big_matrix <- matrix(rnorm(100000), nrow = 1000)
string_vec <- rep(letters, 1000)

workspace_summary()
```

## Summary Table

| Function/Concept | Purpose | Notes |
|------------------|---------|-------|
| `object.size(x)` | Size of object (base R) | Over-counts shared components |
| `lobstr::obj_size(x)` | True size accounting for sharing | Recommended for accurate measurement |
| `lobstr::obj_addr(x)` | Memory address of object | Check if two vars share data |
| `lobstr::ref(x, y)` | Visualize shared references | Shows sharing tree |
| `lobstr::mem_used()` | Total R memory usage | Like `gc()` but simpler |
| `gc()` | Garbage collect + report memory | Use `gc()[2,2]` for Mb used |
| `tracemem(x)` | Alert on copy | Base R, prints copy events |
| ALTREP | Compact representation | `1:n` is O(1) memory |
| String interning | Shared string storage | Repeated strings are efficient |

## Practice Exercises

**Exercise 1:** Without running it, predict: is `object.size(list(1:1000, 1:1000))` closer to the size of one `1:1000` vector or two? Why?

<details><summary>Click to reveal solution</summary>

`object.size()` reports the size as roughly **two** vectors, because it doesn't account for potential sharing. Each list element is measured independently.

However, with `lobstr::obj_size()`, if both list elements point to the same vector (created as `x <- 1:1000; list(x, x)`), the true size would be closer to one vector plus list overhead.

```r
x <- 1:1000
cat("One vector:", object.size(x), "bytes\n")
cat("list(x, x):", object.size(list(x, x)), "bytes\n")
cat("list(1:1000, 1:1000):", object.size(list(1:1000, 1:1000)), "bytes\n")

# list(x, x) shares the vector; list(1:1000, 1:1000) creates two separate vectors
# object.size doesn't distinguish, but lobstr::obj_size would
```

</details>

**Exercise 2:** Write a function that compares the memory usage of storing data as a character vector vs a factor, for different numbers of unique values.

<details><summary>Click to reveal solution</summary>

```r
compare_storage <- function(n = 100000, n_unique = c(2, 10, 100, 1000, 10000)) {
  cat(sprintf("%-12s %-15s %-15s %-10s\n", "Unique", "Character (KB)", "Factor (KB)", "Winner"))
  cat(strrep("-", 55), "\n")

  for (nu in n_unique) {
    vals <- sample(paste0("val_", 1:nu), n, replace = TRUE)
    char_size <- as.numeric(object.size(vals)) / 1024
    fact_size <- as.numeric(object.size(factor(vals))) / 1024
    winner <- if (char_size < fact_size) "character" else "factor"
    cat(sprintf("%-12d %-15.1f %-15.1f %-10s\n", nu, char_size, fact_size, winner))
  }
}

compare_storage()
```

</details>

**Exercise 3:** Demonstrate that ALTREP makes `1:n` constant-size by measuring `1:100`, `1:1000000`, and `1:100000000`.

<details><summary>Click to reveal solution</summary>

```r
sizes <- sapply(c(100, 1000000, 100000000), function(n) {
  as.numeric(object.size(1:n))
})

cat("1:100        :", sizes[1], "bytes\n")
cat("1:1,000,000  :", sizes[2], "bytes\n")
cat("1:100,000,000:", sizes[3], "bytes\n")
cat("\nAll the same size! ALTREP stores only (start, end, step).\n")
cat("\nCompare with materialized:\n")
cat("rnorm(100):", object.size(rnorm(100)), "bytes\n")
cat("rnorm(1000000):", object.size(rnorm(1000000)), "bytes\n")
```

</details>

## FAQ

**Q: Why does gc() sometimes not free memory?**
`gc()` collects unreferenced R objects, but the freed memory isn't always returned to the OS. R maintains a memory pool. Also, if objects are still referenced (even indirectly through closures or environments), they won't be collected.

**Q: How much memory overhead does each R object have?**
Every R object (SEXP) has a header of about 40-56 bytes on 64-bit systems. This includes type info, reference count, attributes pointer, and memory management data. For small objects (a single integer), the overhead dominates.

**Q: Is lobstr available in WebR?**
As of 2026, lobstr may not be available in WebR. The examples in this tutorial use base R alternatives (`object.size()`, `gc()`, `tracemem()`) that work everywhere. Install lobstr in a regular R session with `install.packages("lobstr")`.

## Continue Learning
- [R Names and Values](R-Names-and-Values.html) -- The mental model behind copy-on-modify
- [R Assignment Deep Dive](R-Assignment-Deep-Dive.html) -- All assignment operators and scoping
- [R Copy-on-Modify](R-Copy-on-Modify.html) -- Practical copy-on-modify examples
