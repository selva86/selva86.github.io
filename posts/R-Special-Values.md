---
title: "R's Four Special Values: NA, NULL, NaN, Inf"
slug: "R-Special-Values"
description: "Master R's four special values — NA, NULL, NaN, Inf. Know what each means, how to test for them, and how to handle them without silent bugs."
keywords: "NA in R, NULL in R, NaN in R, Inf in R, is.na(), is.null(), R missing values, R special values"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.11"
post_type: "C"
auto_link_terms: "NA in R|NULL in R|NaN in R|Inf in R|R special values"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Special Values"
sidebar_order: 11
---

<nav class="breadcrumb-nav">Home &gt; Learn R &gt; Fundamentals &gt; R Special Values</nav>

# R's Four Special Values: NA, NULL, NaN, Inf

<p class="lead">R has four special values: <code>NA</code> (missing), <code>NULL</code> (absent), <code>NaN</code> (not-a-number), and <code>Inf</code> (infinity). Each represents something different, and confusing them is one of the top bug sources in R programming.</p>

## Introduction

At first glance, `NA` and `NULL` look identical — both represent "no value". In reality they behave completely differently, and so do `NaN` and `Inf`. This tutorial unpacks each one, shows how to test for them, and explains when each appears naturally in R work.

Every example is live — click **Run** to see how R distinguishes these four values.

By the end you'll instantly know which special value to expect from any operation and which test function to use.

## What is NA in R?

`NA` stands for "Not Available" — it represents a **missing value inside a vector**. Unlike NULL, NA has a type and takes up a slot.

```r
x <- c(1, 2, NA, 4, NA, 6)
x
#> [1]  1  2 NA  4 NA  6

length(x)
#> [1] 6

# NA is typed — check with typeof()
typeof(NA)
#> [1] "logical"
typeof(NA_real_)
#> [1] "double"
typeof(NA_character_)
#> [1] "character"
```

`NA` fills positions in a vector where data is missing. The vector still has length 6 — NA occupies positions 3 and 5. R provides typed NAs (`NA_real_`, `NA_integer_`, `NA_character_`) so every vector type has a missing-value placeholder.

[KEY INSIGHT]
**Any operation involving NA returns NA.** `NA + 1` is `NA`. `NA == NA` is `NA`. This "NA infects everything" rule is deliberate — it forces you to handle missingness explicitly rather than silently ignoring it.

## What is NULL in R?

`NULL` represents the **absence of a value** — not missing, but not there at all. It has length 0 and no type.

```r
y <- NULL
length(y)
#> [1] 0

typeof(y)
#> [1] "NULL"

# NULL disappears when combined
c(1, 2, NULL, 4)
#> [1] 1 2 4

# Compare with NA
c(1, 2, NA, 4)
#> [1]  1  2 NA  4
```

`NULL` evaporates when combined in `c()` — it has length 0, so including it doesn't add any slots. Contrast with `NA`, which holds a slot. Use `NULL` to signal "no argument" or "no result"; use `NA` for missing data in a vector.

## What is NaN in R?

`NaN` stands for "Not a Number" — the result of **undefined numeric operations** like `0/0`.

```r
0 / 0
#> [1] NaN

log(-1)
#> Warning in log(-1): NaNs produced
#> [1] NaN

sqrt(-1)
#> Warning in sqrt(-1): NaNs produced
#> [1] NaN

# NaN is always a double
typeof(NaN)
#> [1] "double"
```

`NaN` signals "the math is undefined". R follows IEEE 754 floating-point rules. Operations that don't produce a real number result in `NaN` with a warning.

## What is Inf in R?

`Inf` and `-Inf` represent **infinity** — the result of dividing by zero or overflow.

```r
1 / 0
#> [1] Inf

-1 / 0
#> [1] -Inf

log(0)
#> [1] -Inf

exp(1000)
#> [1] Inf

# Arithmetic with Inf
Inf + 1
#> [1] Inf
Inf - Inf
#> [1] NaN
Inf / Inf
#> [1] NaN
```

Division by zero produces `Inf` (positive or negative based on sign). Arithmetic with infinity follows IEEE 754: `Inf + anything finite = Inf`, but `Inf - Inf` and `Inf / Inf` are undefined (NaN).

## How do you test for each special value?

**Never use `==` with special values.** `NA == NA` returns `NA`, not `TRUE`. Use the dedicated `is.*()` functions.

```r
x <- c(1, NA, NaN, Inf, -Inf, 5)

# Test for each
is.na(x)
#> [1] FALSE  TRUE  TRUE FALSE FALSE FALSE

is.nan(x)
#> [1] FALSE FALSE  TRUE FALSE FALSE FALSE

is.infinite(x)
#> [1] FALSE FALSE FALSE  TRUE  TRUE FALSE

is.finite(x)
#> [1]  TRUE FALSE FALSE FALSE FALSE  TRUE

# NULL has its own test
is.null(NULL)
#> [1] TRUE
is.null(NA)
#> [1] FALSE
```

Notice that `is.na()` returns `TRUE` for both `NA` AND `NaN` (because NaN is a kind of missing). `is.nan()` is more specific — only `TRUE` for NaN. `is.finite()` is `FALSE` for NA, NaN, Inf, and -Inf — it's the strictest check.

[WARNING]
**`is.na()` returns TRUE for NaN too.** If you need to distinguish NaN from regular NA, use `is.nan()`. Most of the time `is.na()` is what you want.

## How do you handle these values in analysis?

Most R statistics functions have `na.rm` arguments to skip missing values.

```r
x <- c(10, 20, NA, 40, NA, 60)

# Default: NA propagates
mean(x)
#> [1] NA

# Skip NAs
mean(x, na.rm = TRUE)
#> [1] 32.5

sum(x, na.rm = TRUE)
#> [1] 130

# Count non-missing values
sum(!is.na(x))
#> [1] 4

# Remove NAs from the vector
x_clean <- x[!is.na(x)]
x_clean
#> [1] 10 20 40 60
```

`na.rm = TRUE` drops NAs before computing. For more control, filter first with `!is.na()` and then compute.

For Inf values:

```r
y <- c(1, 2, Inf, 4, -Inf, 6)

# Remove Inf
y_finite <- y[is.finite(y)]
y_finite
#> [1] 1 2 4 6

mean(y)
#> [1] NaN
mean(y_finite)
#> [1] 3.25
```

`is.finite()` is the catch-all — excludes NA, NaN, Inf, and -Inf. Useful when you want only real finite numbers.

## Common Mistakes and How to Fix Them

### Mistake 1: Using `==` to test for NA

❌ **Wrong:**
```r
my_x <- c(1, 2, NA, 4)
my_x[my_x == NA]
#> [1] NA NA NA NA
```

**Why it is wrong:** `== NA` returns `NA` (not TRUE), so the subset returns all NAs.

✅ **Correct:**
```r
my_x <- c(1, 2, NA, 4)
my_x[is.na(my_x)]
#> [1] NA
```

### Mistake 2: Confusing NA and NULL

❌ **Wrong:**
```r
# "Empty" value in a data frame column
my_df <- data.frame(x = c(1, NULL, 3))
#> Error: cannot coerce type 'NULL' to vector of type 'double'
```

**Why it is wrong:** NULL has length 0, so it disappears. Can't create a data frame column with a gap.

✅ **Correct:**
```r
my_df <- data.frame(x = c(1, NA, 3))
my_df
#>    x
#> 1  1
#> 2 NA
#> 3  3
```

### Mistake 3: `if(is.na(x))` on a vector

❌ **Wrong:**
```r
my_x <- c(1, NA, 3)
if (is.na(my_x)) {
  print("has NA")
}
#> Error in if (is.na(my_x)) { : the condition has length > 1
```

**Why it is wrong:** `is.na()` is vectorized — returns a logical vector. `if()` needs length 1.

✅ **Correct:**
```r
my_x <- c(1, NA, 3)
if (any(is.na(my_x))) {
  print("has NA")
}
#> [1] "has NA"
```

### Mistake 4: Sum skipping NaN unexpectedly

❌ **Wrong:**
```r
my_x <- c(1, 2, NaN, 4)
sum(my_x)
#> [1] NaN
sum(my_x, na.rm = TRUE)
#> [1] 7
```

**Why it is wrong:** Actually correct — `na.rm = TRUE` removes both NA and NaN. Easy to forget this and wonder why NaN was filtered.

✅ **Correct (be explicit):**
```r
my_x <- c(1, 2, NaN, 4)
sum(my_x[!is.nan(my_x)])
#> [1] 7
```

## Practice Exercises

### Exercise 1: Test for NA

Count the number of NAs in `my_data`.

```r
my_data <- c(5, NA, 3, NA, 7, 2, NA, 1)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_data <- c(5, NA, 3, NA, 7, 2, NA, 1)
my_na_count <- sum(is.na(my_data))
my_na_count
#> [1] 3
```

</details>

### Exercise 2: Filter out NAs

Compute the mean of `my_data` without using `na.rm`.

```r
my_data <- c(5, NA, 3, NA, 7, 2, NA, 1)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_data <- c(5, NA, 3, NA, 7, 2, NA, 1)
my_mean <- mean(my_data[!is.na(my_data)])
my_mean
#> [1] 3.6
```

</details>

### Exercise 3: Detect Inf

Check whether `my_vals` contains any infinite values.

```r
my_vals <- c(1, 2, 1/0, 4)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_vals <- c(1, 2, 1/0, 4)
my_has_inf <- any(is.infinite(my_vals))
my_has_inf
#> [1] TRUE
```

</details>

### Exercise 4: Distinguish NaN from NA

Given `my_mixed`, count how many are NaN specifically (not regular NA).

```r
my_mixed <- c(1, NA, NaN, 3, NaN, NA, 5)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_mixed <- c(1, NA, NaN, 3, NaN, NA, 5)
my_nan_count <- sum(is.nan(my_mixed))
my_nan_count
#> [1] 2
```

</details>

### Exercise 5: Test for NULL

Write a safe helper that returns 0 if input is NULL, else the length.

```r
my_safe_length <- function(x) {
  # Return 0 if NULL, else length
  # Write your code below:

}

my_safe_length(NULL)
my_safe_length(c(1, 2, 3))
```

<details>
<summary>Click to reveal solution</summary>

```r
my_safe_length <- function(x) {
  if (is.null(x)) return(0)
  length(x)
}
my_safe_length(NULL)
#> [1] 0
my_safe_length(c(1, 2, 3))
#> [1] 3
```

</details>

## Complete Example: Cleaning a Messy Numeric Vector

```r
# --- Cleaning pipeline for a real-world messy vector ---

raw <- c(10, 20, NA, 30, NaN, 1/0, 40, -1/0, 50, NA)
raw
#>  [1]  10  20  NA  30 NaN Inf  40 -Inf  50  NA

# Step 1: Report what we have
cat("Total values:        ", length(raw), "\n")
cat("Missing (NA):        ", sum(is.na(raw) & !is.nan(raw)), "\n")
cat("Not-a-number (NaN):  ", sum(is.nan(raw)), "\n")
cat("Infinite (Inf/-Inf): ", sum(is.infinite(raw)), "\n")
cat("Finite valid:        ", sum(is.finite(raw)), "\n")
#> Total values:         10
#> Missing (NA):         2
#> Not-a-number (NaN):   1
#> Infinite (Inf/-Inf):  2
#> Finite valid:         5

# Step 2: Keep only finite values
clean <- raw[is.finite(raw)]
clean
#> [1] 10 20 30 40 50

# Step 3: Safe to compute statistics now
cat("Mean:     ", mean(clean), "\n")
cat("SD:       ", sd(clean), "\n")
cat("Range:    ", range(clean), "\n")
#> Mean:      30
#> SD:        15.81139
#> Range:     10 50
```

This pipeline diagnoses each type of special value separately, then uses `is.finite()` as the comprehensive filter. Reporting counts before cleaning makes the process transparent — no silent data loss.

## Summary

| Value | Meaning | Length | Test | Origin |
|---|---|---|---|---|
| `NA` | Missing | 1 (occupies slot) | `is.na()` | Placeholder in vector |
| `NULL` | Absent | 0 | `is.null()` | "no value" signal |
| `NaN` | Not-a-number | 1 | `is.nan()` | `0/0`, `log(-1)` |
| `Inf` / `-Inf` | Infinity | 1 | `is.infinite()` | `1/0`, overflow |
| (finite real) | Regular | 1 | `is.finite()` | All of the above return FALSE |

Comprehensive filter: `is.finite(x)` returns TRUE only for regular finite numbers.

## FAQ

### Why does R have both NA and NULL?

They represent different concepts. `NA` says "this slot has missing data". `NULL` says "this value doesn't exist at all". In a survey, NA means "question unanswered"; NULL means "question not asked".

### Is NaN a type of NA?

Yes and no. `is.na(NaN)` is `TRUE` (R treats NaN as a kind of NA). But `is.nan(NaN)` is also `TRUE` and `is.nan(NA)` is `FALSE`. Every NaN is an NA, but not every NA is a NaN.

### What's the difference between typed NAs like NA_real_ and NA?

`NA` alone is logical-typed. When you put it in a numeric vector, R promotes it to `NA_real_` automatically. You only need `NA_real_` explicitly when creating empty typed vectors: `vec <- rep(NA_real_, 100)`.

### How do I replace NAs with a value?

Use assignment with a logical mask: `x[is.na(x)] <- 0`. For data frames, `tidyr::replace_na()` is cleaner.

### Why does `Inf - Inf` return NaN, not 0?

IEEE 754 floating-point convention: the difference between two infinities is undefined because they could be "infinities of different sizes". R returns NaN to signal the undefinedness.

## References

1. R Core Team — *An Introduction to R*, Section 2.4 (Missing values). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Section 3.2 (Atomic vectors). [Link](https://adv-r.hadley.nz/vectors-chap.html)
3. R manual — `NA` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html)
4. R manual — `NULL` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NULL.html)
5. R manual — `is.finite()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/is.finite.html)
6. R FAQ — Why doesn't NA == NA return TRUE? [Link](https://cran.r-project.org/doc/FAQ/R-FAQ.html)
7. IEEE 754-2008 standard — Floating-point arithmetic. [Link](https://en.wikipedia.org/wiki/IEEE_754)

## What's Next?

- **[R Data Types](R-Data-Types.html)** — the six basic types and how NA fits into each.
- **[R Vectors](R-Vectors.html)** — special values inside the core R data structure.
- **[Getting Help in R](Getting-Help-in-R.html)** — how to debug when special values break your code.
