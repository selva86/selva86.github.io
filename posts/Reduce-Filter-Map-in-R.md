---
title: "Reduce(), Filter(), Map() in Base R: Functional Trifecta Explained"
slug: "Reduce-Filter-Map-in-R"
description: "Master base R's functional trio: Reduce() to collapse lists, Filter() to select elements, and Map() for parallel iteration. Interactive examples."
keywords: "R Reduce, R Filter, R Map, base R functional programming, Reduce examples, Filter function R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.2.6"
post_type: "C"
auto_link_terms: "Reduce|Filter|Map in base R|functional trifecta"
auto_link_case_sensitive: true
---

# Reduce(), Filter(), Map() in Base R: Functional Trifecta Explained

<p class="lead">Base R has three powerful higher-order functions: <code>Reduce()</code> collapses a list into a single value, <code>Filter()</code> keeps elements matching a condition, and <code>Map()</code> applies a function across parallel inputs. No packages needed.</p>

These three functions come from functional programming tradition and exist in nearly every language (fold, filter, map). In R, they're capitalized — `Reduce`, `Filter`, `Map` — to distinguish them from other base functions.

## Reduce(): Collapse a List to One Value

`Reduce(f, x)` takes a binary function `f` and a list `x`, then combines elements pairwise from left to right: `f(f(f(x[1], x[2]), x[3]), x[4])`.

```r
# Sum 1 through 5 by repeatedly adding pairs
Reduce(`+`, 1:5)
# Step by step: ((((1+2)+3)+4)+5) = 15

# String concatenation
Reduce(paste, c("R", "is", "great"))
# ((("R" paste "is") paste "great")) = "R is great"
```

### Reduce with accumulate = TRUE

Set `accumulate = TRUE` to see every intermediate result, not just the final one.

```r
# Running sum
Reduce(`+`, 1:5, accumulate = TRUE)
# [1]  1  3  6 10 15

# Running product (factorial-like)
Reduce(`*`, 1:6, accumulate = TRUE)
```

### Reduce with init

Provide an initial value with `init`. This is useful when the list might be empty or when you need a specific starting value.

```r
# With init, the first reduction is f(init, x[1])
Reduce(`+`, 1:5, init = 100)
# 100+1+2+3+4+5 = 115

# Empty list with init returns init
Reduce(`+`, list(), init = 0)
```

### Practical: Merging Multiple Data Frames

```r
df1 <- data.frame(id = 1:3, name = c("A", "B", "C"))
df2 <- data.frame(id = 2:4, score = c(88, 92, 76))
df3 <- data.frame(id = 1:3, grade = c("A", "A", "B"))

# Merge all three by id
merged <- Reduce(\(a, b) merge(a, b, by = "id", all = TRUE), list(df1, df2, df3))
print(merged)
```

### Practical: Combining Conditions

```r
conditions <- list(
  c(TRUE, FALSE, TRUE, TRUE, FALSE),
  c(TRUE, TRUE, FALSE, TRUE, FALSE),
  c(FALSE, FALSE, TRUE, TRUE, TRUE)
)

# AND all conditions together
all_true <- Reduce(`&`, conditions)
cat("All TRUE:", all_true, "\n")

# OR all conditions together
any_true <- Reduce(`|`, conditions)
cat("Any TRUE:", any_true, "\n")
```

## Filter(): Keep Matching Elements

`Filter(f, x)` applies a predicate function `f` to each element of `x` and keeps only the elements where `f` returns `TRUE`.

```r
# Keep only positive numbers
Filter(\(x) x > 0, c(-3, 1, -1, 4, -2, 5))

# Keep non-NULL elements
Filter(Negate(is.null), list(1, NULL, "a", NULL, TRUE))

# Keep strings longer than 3 characters
Filter(\(s) nchar(s) > 3, c("hi", "hello", "yo", "world", "R"))
```

### Filter on Data Frames

When applied to a data frame, `Filter()` operates on columns (since a data frame is a list of columns).

```r
df <- data.frame(
  name = c("A", "B", "C"),
  score = c(88, 92, 76),
  passed = c(TRUE, TRUE, FALSE),
  grade = c("B+", "A", "C")
)

# Keep only numeric columns
Filter(is.numeric, df)

# Keep only character columns
Filter(is.character, df)
```

### Find(): Return First Match

`Find()` is like `Filter()` but returns only the first matching element.

```r
# Find first even number
Find(\(x) x %% 2 == 0, c(3, 7, 4, 9, 6))

# Find from the right
Find(\(x) x %% 2 == 0, c(3, 7, 4, 9, 6), right = TRUE)
```

### Position(): Find the Index

`Position()` returns the index of the first matching element instead of the element itself.

```r
# Where is the first negative number?
Position(\(x) x < 0, c(5, 3, -1, 4, -2))

# From the right
Position(\(x) x < 0, c(5, 3, -1, 4, -2), right = TRUE)
```

## Map(): Parallel Iteration

`Map(f, ...)` applies function `f` to corresponding elements of the input lists. It's the multi-input version of `lapply()`.

```r
# Add corresponding elements
Map(`+`, 1:4, 10:13)

# Paste corresponding elements
Map(paste, c("Hello", "Good", "Nice"), c("World", "Morning", "Day"))
```

```r
# Map with more than two inputs
Map(\(x, y, z) paste(x, "+", y, "+", z, "=", x + y + z),
    1:3, 10:12, 100:102)
```

### Map vs mapply

`Map()` always returns a list. `mapply()` tries to simplify the result to a vector or matrix.

```r
# Map returns a list
Map(\(x, y) x * y, 1:3, 4:6)

# mapply simplifies to a vector
mapply(\(x, y) x * y, 1:3, 4:6)
```

## Comparison: Base R vs purrr

| Task | Base R | purrr |
|------|--------|-------|
| Map over 1 input | `lapply(x, f)` | `map(x, f)` |
| Map over 2 inputs | `Map(f, x, y)` | `map2(x, y, f)` |
| Map over N inputs | `Map(f, ...)` | `pmap(list(...), f)` |
| Filter elements | `Filter(f, x)` | `keep(x, f)` |
| Remove elements | `Filter(Negate(f), x)` | `discard(x, f)` |
| Reduce/fold | `Reduce(f, x)` | `reduce(x, f)` |
| Find first match | `Find(f, x)` | `detect(x, f)` |
| Find position | `Position(f, x)` | `detect_index(x, f)` |

> Use base R functions (`Reduce`, `Filter`, `Map`) when you want zero dependencies. Use purrr equivalents when you want typed outputs, formula shorthand, and richer error handling.

## Practice Exercises

### Exercise 1: Reduce a Shopping Cart

Calculate the total price of items with a discount applied sequentially.

```r
prices <- c(29.99, 15.50, 42.00, 8.75, 22.30)
# Use Reduce with accumulate to show running total
# Then apply a 10% discount using Reduce on the total

```

<details>
<summary>Click to reveal solution</summary>

```r
prices <- c(29.99, 15.50, 42.00, 8.75, 22.30)

running <- Reduce(`+`, prices, accumulate = TRUE)
cat("Running total:", round(running, 2), "\n")
cat("Final total: $", round(running[length(running)], 2), "\n")

# Apply sequential discounts: 10%, 5%, 3%
discounts <- c(0.10, 0.05, 0.03)
apply_discount <- \(price, disc) round(price * (1 - disc), 2)
final <- Reduce(apply_discount, discounts, init = sum(prices))
cat("After discounts: $", final, "\n")
```

**Explanation:** `Reduce(f, x, init)` starts with `init` and applies `f` pairwise. With `accumulate = TRUE`, you see every step — useful for running totals.

</details>

### Exercise 2: Filter and Find

From a list of measurements, filter valid ones, find the first outlier, and get its position.

```r
measurements <- c(23.1, 24.5, NA, 99.9, 22.8, 25.1, -1, 23.9, 24.2, 999)

# 1. Filter out NAs
# 2. Filter to keep only values between 10 and 50
# 3. Find the first value > 50 (outlier)
# 4. Find the position of the first NA
```

<details>
<summary>Click to reveal solution</summary>

```r
measurements <- c(23.1, 24.5, NA, 99.9, 22.8, 25.1, -1, 23.9, 24.2, 999)

no_na <- Filter(\(x) !is.na(x), measurements)
cat("Without NA:", no_na, "\n")

valid <- Filter(\(x) !is.na(x) & x >= 10 & x <= 50, measurements)
cat("Valid (10-50):", valid, "\n")

outlier <- Find(\(x) !is.na(x) & x > 50, measurements)
cat("First outlier:", outlier, "\n")

na_pos <- Position(is.na, measurements)
cat("First NA at position:", na_pos, "\n")
```

**Explanation:** `Filter` keeps elements matching a predicate. `Find` returns the first match. `Position` returns the index. All work with any predicate function.

</details>

## Summary

| Function | Purpose | Returns |
|----------|---------|---------|
| `Reduce(f, x)` | Collapse list pairwise | Single value |
| `Reduce(f, x, accumulate=TRUE)` | Show all intermediate results | Vector |
| `Filter(f, x)` | Keep elements where f is TRUE | Filtered list/vector |
| `Find(f, x)` | First element where f is TRUE | Single element |
| `Position(f, x)` | Index of first TRUE | Integer |
| `Map(f, ...)` | Apply f to parallel inputs | List |

## FAQ

### Why is Reduce capitalized?

Base R capitalizes `Reduce`, `Filter`, `Map`, `Find`, and `Position` to avoid conflicts with common variable names. Lowercase `filter` would clash with `dplyr::filter()` and `stats::filter()`.

### Can Reduce work right-to-left?

Yes. Set `right = TRUE` for right-to-left reduction: `Reduce(f, x, right = TRUE)` computes `f(x[1], f(x[2], f(x[3], x[4])))`.

### What happens if I pass an empty list to Reduce?

Without `init`, an empty list causes an error. With `init`, it returns `init`. Always provide `init` when the input could be empty.

## Continue Learning

- [Functional Programming in R](/Functional-Programming-in-R.html) — the bigger FP picture
- [purrr map() Variants](/purrr-map-Variants.html) — purrr's enhanced versions of Map
- [Memoization in R](/Memoization-in-R.html) — cache function results for speed
