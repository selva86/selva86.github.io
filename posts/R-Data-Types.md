---
title: "R Data Types: Which Type Is Your Variable?"
slug: "R-Data-Types"
description: "R's 6 data types — numeric, integer, character, logical, complex, raw. Learn how to check types, why coercion causes bugs, and when each type belongs."
keywords: "R data types, numeric in R, integer in R, character in R, logical in R, complex in R, class() vs typeof(), R type coercion, as.numeric, is.numeric"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.5"
post_type: "C"
auto_link_terms: "R data types|R type coercion|numeric in R|character in R|logical in R"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Data Types"
sidebar_order: 5
---


# R Data Types: Which Type Is Your Variable?

<p class="lead">R has six basic data types: numeric (double), integer, character, logical, complex, and raw. Every variable in R belongs to exactly one of these types, and knowing which type you're working with prevents most silent bugs.</p>

## Introduction

Type `typeof(1)` in R. It returns `"double"`, not `"numeric"` — and this surprises almost everyone the first time. R has its own vocabulary for types, and mismatches between that vocabulary and your intuition cause more beginner bugs than any other topic.

This tutorial walks through all six data types, shows the three different ways to check a variable's type, explains why R silently converts between types, and covers the four special values (NA, NULL, NaN, Inf) that behave like types but aren't. Every code block is live — click **Run** to execute directly in your browser.

By the end, you'll never be confused again when R returns `"double"` instead of `"numeric"` or when `1 + TRUE` gives `2`.

## What are R's six data types?

R classifies every value into one of six atomic types. These are the building blocks — every vector, list, data frame, and matrix is made of values that belong to exactly one of these types.

Let's create one value of each type and ask R what it is. We'll use `typeof()` to get R's internal name for the type.

```r
# Six atomic data types
x_numeric   <- 3.14
x_integer   <- 42L
x_character <- "hello"
x_logical   <- TRUE
x_complex   <- 2 + 3i
x_raw       <- charToRaw("A")

typeof(x_numeric)
#> [1] "double"
typeof(x_integer)
#> [1] "integer"
typeof(x_character)
#> [1] "character"
typeof(x_logical)
#> [1] "logical"
typeof(x_complex)
#> [1] "complex"
typeof(x_raw)
#> [1] "raw"
```

Six types, six values, six `typeof()` answers. Notice that `3.14` produces `"double"` — this is R's internal name for decimal numbers. The word "numeric" is a friendlier umbrella term we'll unpack in a moment.

Here's a decision tree for picking the right type when you create a variable:

![Which R Data Type Should I Use?](screenshots/R-Data-Types-decision-tree.webp)
*Figure 1: A quick decision guide for picking the right R data type.*

**Numeric (double).** R's default for any number you type without a special suffix. Double-precision floating point, 64 bits, ~15 significant digits of precision.

**Integer.** Whole numbers only, written with an `L` suffix (`42L`, not `42`). Takes half the memory of a double and interoperates better with C code. If you type `42` without the L, R stores it as a double — not an integer.

**Character.** Text wrapped in single or double quotes. Supports Unicode. Internally stored as length-encoded strings.

**Logical.** Either `TRUE` or `FALSE` (also the shortcuts `T` and `F`, though these can be overridden — prefer spelling out the full words). Used in conditions and as masks.

**Complex.** Numbers with an imaginary part, written with `i` (e.g., `2+3i`). Rare outside signal processing and physics.

**Raw.** A sequence of bytes. Used for binary data, file I/O, and cryptography. You'll rarely encounter raw in day-to-day R work.

[KEY INSIGHT]
**Numbers in R are doubles by default, not integers.** When you type `42`, R stores it as a double. Use the `L` suffix (`42L`) to force integer storage. This surprises beginners because most languages default to integer.

## How do you check a variable's type?

R gives you three functions that report a variable's type, and they don't always agree. Understanding when to use which saves hours of debugging.

The three functions are `class()`, `typeof()`, and `storage.mode()`. They answer slightly different questions.

```r
x <- 42L

class(x)
#> [1] "integer"
typeof(x)
#> [1] "integer"
storage.mode(x)
#> [1] "integer"
```

For an integer, all three agree. They disagree when R has attributes or S3 classes involved. Here's a case where they diverge:

```r
# A double variable — watch the disagreement
y <- 3.14
class(y)
#> [1] "numeric"
typeof(y)
#> [1] "double"
storage.mode(y)
#> [1] "double"

# A date object
d <- as.Date("2026-04-05")
class(d)
#> [1] "Date"
typeof(d)
#> [1] "double"
```

For the double `y`, `class()` says `"numeric"` (the user-facing label) while `typeof()` says `"double"` (the storage name). For the date `d`, `class()` reports `"Date"` (the S3 class used for method dispatch) while `typeof()` reveals that underneath, a Date is just a double counting days since 1970-01-01.

Here's when to use each:

| Function | Returns | Use when you need... |
|---|---|---|
| `class()` | S3 class (for method dispatch) | to know how `print()`, `summary()`, etc. will behave |
| `typeof()` | Internal C storage type | to know how R stores the value in memory |
| `storage.mode()` | Similar to typeof with minor differences | rarely — mostly for historical compatibility |

You can also use the `is.*()` family for boolean type checks:

```r
# is.*() returns TRUE or FALSE
is.numeric(3.14)
#> [1] TRUE
is.integer(42L)
#> [1] TRUE
is.integer(42)        # 42 without L is a double, not integer
#> [1] FALSE
is.character("hi")
#> [1] TRUE
is.logical(TRUE)
#> [1] TRUE
```

Notice `is.integer(42)` returns `FALSE` — because `42` without the `L` suffix is a double. The `is.numeric()` function is a broader umbrella; it returns `TRUE` for both doubles and integers.

[TIP]
**Reach for typeof() when debugging storage surprises; reach for class() when debugging which method R called.** Most bugs at the data-science level trace back to class() confusion (e.g., a Date being unexpectedly treated as a double by an arithmetic operation).

## How does R convert between types?

When you need a value in a different type, R gives you a family of `as.*()` functions to convert explicitly. This is called **coercion**.

The conversion rules are consistent: R tries the conversion and returns `NA` with a warning if it fails.

```r
# Successful conversions
as.numeric("3.14")
#> [1] 3.14
as.integer("42")
#> [1] 42
as.character(3.14)
#> [1] "3.14"
as.logical(0)
#> [1] FALSE
as.logical(1)
#> [1] TRUE
```

R converted each value without issues. Logical converts cleanly from numeric: 0 becomes FALSE, any non-zero becomes TRUE. Characters convert to numbers as long as they look like numbers.

When the conversion can't happen cleanly, R returns `NA` and warns:

```r
# Failed conversion
as.numeric("hello")
#> Warning: NAs introduced by coercion
#> [1] NA

# Truncation (not rounding!) when double → integer
as.integer(3.9)
#> [1] 3
as.integer(-3.9)
#> [1] -3
```

`as.numeric("hello")` returns `NA` with a warning because "hello" doesn't parse as a number. `as.integer(3.9)` returns `3` — note that R **truncates toward zero**, it does not round. `as.integer(-3.9)` also gives `-3`, not `-4`. Use `round()`, `floor()`, or `ceiling()` before `as.integer()` if you want explicit rounding behavior.

[WARNING]
**as.integer() truncates toward zero — it does not round.** as.integer(3.9) gives 3; as.integer(-3.9) gives -3. Use round() first if you want nearest-integer behavior.

## Why does R auto-promote types?

When you combine values of different types in one vector (using `c()`) or in arithmetic, R automatically converts them all to a single common type. This is **implicit coercion**.

R follows a fixed promotion hierarchy: each type can be auto-converted up the ladder, but never down.

![R Type Coercion Ladder](screenshots/R-Data-Types-coercion-ladder.webp)
*Figure 2: R's coercion hierarchy. Mixed values all get promoted to the rightmost type present.*

Logical is the least flexible, character is the most flexible. When you mix types, R promotes everything to the highest type present.

```r
# Logical + integer → integer
c(TRUE, FALSE, 2L)
#> [1] 1 0 2

# Integer + double → double
c(1L, 2L, 3.14)
#> [1] 1.00 2.00 3.14

# Anything + character → character
c(1, 2, "three")
#> [1] "1"     "2"     "three"

# Logical + numeric in arithmetic → numeric
TRUE + 1
#> [1] 2
sum(c(TRUE, FALSE, TRUE, TRUE))
#> [1] 3
```

The first line shows logical values becoming integers: `TRUE` became 1, `FALSE` became 0. The second line shows integers becoming doubles. The third line shows everything becoming character — notice `1` became `"1"` with quotes. The last example shows `sum()` counting `TRUE` values because logicals become integers (0 or 1) in arithmetic.

This last behavior is extremely useful: `sum(some_vector > threshold)` counts how many elements pass the threshold.

[KEY INSIGHT]
**R's coercion ladder: logical → integer → double → complex → character. Mixed vectors always get promoted to the rightmost type present.** When you see "1" instead of 1 in your output, check whether a character value snuck into a numeric vector.

## What are NA, NULL, NaN, and Inf?

R has four special values that represent missing, undefined, or extreme numbers. Each one is different, and confusing them is a top-10 beginner bug source.

![NA vs NULL vs NaN vs Inf](screenshots/R-Data-Types-special-values.webp)
*Figure 3: The four special values in R — each represents something different.*

**NA (Not Available).** Represents a missing value. NA has a type — R provides `NA_real_`, `NA_integer_`, `NA_character_` variants for vectors where all elements need the same type.

**NULL.** Represents the absence of a value entirely. Length 0, no type. Used when a function returns "nothing".

**NaN (Not a Number).** The result of undefined numeric operations like `0/0`. Always a double.

**Inf and -Inf (Infinity).** The result of operations like `1/0` or `log(0)`. Arithmetic with Inf follows IEEE 754 rules.

Let's see each in action:

```r
# NA — missing value, has a type
x <- c(1, 2, NA, 4)
x
#> [1]  1  2 NA  4

# NA is typed — check with typeof
typeof(NA)
#> [1] "logical"
typeof(NA_real_)
#> [1] "double"
typeof(NA_character_)
#> [1] "character"

# NULL — absence of value, length 0
y <- NULL
length(y)
#> [1] 0
typeof(y)
#> [1] "NULL"

# NaN — result of 0/0
0 / 0
#> [1] NaN
typeof(NaN)
#> [1] "double"

# Inf — result of division by zero
1 / 0
#> [1] Inf
log(0)
#> [1] -Inf
```

Each special value has a specific origin. `NA` inherits a type — plain `NA` is logical, but `NA_real_` is a double. `NULL` has zero length, which is how R signals "no value at all". `NaN` and `Inf` are both doubles and follow IEEE 754 floating-point rules.

To check for each, use the dedicated functions — **never use `==`**, because `NA == anything` returns `NA`, not `TRUE` or `FALSE`.

```r
# Testing for special values
x <- c(1, NA, NaN, Inf, -Inf)

is.na(x)
#> [1] FALSE  TRUE  TRUE FALSE FALSE

is.nan(x)
#> [1] FALSE FALSE  TRUE FALSE FALSE

is.infinite(x)
#> [1] FALSE FALSE FALSE  TRUE  TRUE

is.finite(x)
#> [1]  TRUE FALSE FALSE FALSE FALSE
```

Notice that `is.na()` returns `TRUE` for both `NA` and `NaN` — NaN is considered a kind of missing value. But `is.nan()` is more specific — it only flags NaN. Use whichever matches your intent.

[WARNING]
**NA == NA returns NA, not TRUE.** This is a top-3 R gotcha. Use is.na(x) to test for missing values, never x == NA.

## Common Mistakes and How to Fix Them

These four mistakes trip up almost every R beginner.

### Mistake 1: Adding a character to a number

❌ **Wrong:**
```r
my_x <- 1 + "1"
# Error in 1 + "1" : non-numeric argument to binary operator
```

**Why it is wrong:** R does NOT auto-convert characters to numbers in arithmetic. Characters can only auto-convert the other direction (numbers → characters in `c()`). Arithmetic throws an error.

✅ **Correct:**
```r
my_x <- 1 + as.numeric("1")
my_x
#> [1] 2
```

### Mistake 2: Using `==` to test for NA

❌ **Wrong:**
```r
my_val <- NA
if (my_val == NA) print("missing")
# Error in if (my_val == NA) print("missing") : missing value where TRUE/FALSE needed
```

**Why it is wrong:** Comparing anything to `NA` with `==` returns `NA` (not `TRUE` or `FALSE`), and `if()` can't handle `NA` as a condition.

✅ **Correct:**
```r
my_val <- NA
if (is.na(my_val)) print("missing")
#> [1] "missing"
```

### Mistake 3: Assuming class() and typeof() agree

❌ **Wrong:**
```r
my_date <- as.Date("2026-04-05")
# Assuming it's a double because typeof says so
typeof(my_date)
#> [1] "double"
# So I can do date arithmetic like a double, right?
my_date + 1
#> [1] "2026-04-06"
# Wait, that's a date, not 2026-04-06 as a number?
```

**Why it is wrong:** `typeof()` reveals storage, but `class()` determines behavior. The `+` method for Date class adds days, not raw doubles. Always check `class()` for behavioral expectations.

✅ **Correct:**
```r
my_date <- as.Date("2026-04-05")
class(my_date)
#> [1] "Date"
# Now I know + adds days, not raw numbers
my_date + 1
#> [1] "2026-04-06"
```

### Mistake 4: Integer overflow silently becoming NA

❌ **Wrong:**
```r
# Max 32-bit integer
.Machine$integer.max
#> [1] 2147483647

# Add one — silent overflow
.Machine$integer.max + 1L
#> Warning: NAs produced by integer overflow
#> [1] NA
```

**Why it is wrong:** R's integer type is 32-bit, so values above ~2.1 billion overflow silently to `NA`. Easy to miss in long pipelines.

✅ **Correct:**
```r
# Use double instead — handles values up to ~9e15 exactly
.Machine$integer.max + 1    # 1 not 1L — now a double
#> [1] 2147483648
```

## Practice Exercises

Use `my_` prefixed variables to avoid polluting tutorial state.

### Exercise 1: Check Three Types

Create three variables: a numeric, a character, and a logical. Use `typeof()` to print the type of each.

```r
# Exercise: create 3 variables and check their types
# Hint: use typeof() on each

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_num <- 42
my_chr <- "R"
my_log <- FALSE

typeof(my_num)
#> [1] "double"
typeof(my_chr)
#> [1] "character"
typeof(my_log)
#> [1] "logical"
```

**Explanation:** Any number without an `L` suffix becomes a double. Quoted text is character. TRUE/FALSE are logical.

</details>

### Exercise 2: Convert Character to Integer

You have a character `"42"`. Convert it to an integer and verify with `is.integer()`.

```r
# Exercise: convert "42" to integer
# Hint: as.integer() handles this

my_char <- "42"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_char <- "42"
my_int <- as.integer(my_char)
my_int
#> [1] 42
is.integer(my_int)
#> [1] TRUE
```

**Explanation:** `as.integer()` parses the character and returns an integer. The `is.integer()` check confirms the type.

</details>

### Exercise 3: Count TRUEs with sum()

You have a logical vector. Count how many `TRUE` values it contains using `sum()`.

```r
# Exercise: count TRUEs via coercion
# Hint: sum() coerces logicals to integers (TRUE=1, FALSE=0)

my_flags <- c(TRUE, FALSE, TRUE, TRUE, FALSE, TRUE)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_flags <- c(TRUE, FALSE, TRUE, TRUE, FALSE, TRUE)
my_count <- sum(my_flags)
my_count
#> [1] 4
```

**Explanation:** `sum()` coerces logical to integer (TRUE→1, FALSE→0) before adding. This pattern — `sum(some_condition)` — is the standard R idiom for counting.

</details>

### Exercise 4: Test for NA Correctly

Given a vector with `NA` values, count how many non-missing values it has. Do NOT use `!=` or `==`.

```r
# Exercise: count non-NA values
# Hint: !is.na(x) returns TRUE for non-missing values

my_values <- c(1, 2, NA, 4, NA, 6, 7)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_values <- c(1, 2, NA, 4, NA, 6, 7)
my_non_na_count <- sum(!is.na(my_values))
my_non_na_count
#> [1] 5
```

**Explanation:** `is.na()` returns TRUE for NAs, `!` flips it, and `sum()` counts the TRUEs. This is the safe, idiomatic R pattern.

</details>

### Exercise 5: Diagnose a Mixed Vector

R coerces mixed-type input in `c()`. Predict the resulting type, then verify.

```r
# Exercise: predict coercion result
# Hint: the ladder is logical → integer → double → complex → character

my_mixed <- c(TRUE, 2L, 3.14, "hello")

# Write code to print typeof(my_mixed) and explain below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_mixed <- c(TRUE, 2L, 3.14, "hello")
typeof(my_mixed)
#> [1] "character"
my_mixed
#> [1] "TRUE"  "2"     "3.14"  "hello"
```

**Explanation:** The vector has four types that get promoted up the ladder. Character is the highest type present, so EVERYTHING becomes character — including TRUE (now "TRUE"), 2L (now "2"), and 3.14 (now "3.14"). This is why accidental character values in numeric vectors are a classic bug source.

</details>

## Complete Example: Detecting Coercion in a Pipeline

Here's a realistic scenario: you receive a vector that's supposed to be numeric, but coercion has silently changed its type. Let's detect and diagnose it.

```r
# --- Type diagnostic pipeline ---

# Step 1: Incoming data — looks numeric but isn't
raw_data <- c("45", "72", "28", "N/A", "95", "60")

# Step 2: Check the type we actually have
typeof(raw_data)
#> [1] "character"
class(raw_data)
#> [1] "character"

# Step 3: Coerce with as.numeric() — R warns about bad values
clean_data <- as.numeric(raw_data)
#> Warning: NAs introduced by coercion
clean_data
#> [1] 45 72 28 NA 95 60

# Step 4: Diagnose — count NAs introduced
n_na <- sum(is.na(clean_data))
cat("Converted", length(raw_data), "values; ", n_na, "became NA\n")
#> Converted 6 values;  1 became NA

# Step 5: Proceed with analysis, using na.rm=TRUE
mean_value <- mean(clean_data, na.rm = TRUE)
cat("Mean of valid values:", round(mean_value, 2), "\n")
#> Mean of valid values: 60
```

The pipeline shows the standard type-checking workflow: check what you received, coerce, diagnose what failed, then analyze with NA-aware functions. `typeof()` revealed the data was character (quoted-looking numbers). `as.numeric()` converted what it could and flagged `"N/A"` as `NA`. The `is.na()` count reported the damage. The final `mean(..., na.rm = TRUE)` skipped the `NA` gracefully.

This pattern — **check, coerce, diagnose, analyze** — is the foundation of robust R data pipelines.

[NOTE]
**R's integer type is 32-bit. For large counts or IDs, use bit64::integer64 or keep values as doubles.** R has no native 64-bit integer. Doubles exactly represent integers up to 2^53, which covers most use cases.

## Summary

| Type | typeof() | class() | Example | When to use |
|---|---|---|---|---|
| double | `"double"` | `"numeric"` | `3.14`, `42` | Any number without L |
| integer | `"integer"` | `"integer"` | `42L`, `-3L` | Whole numbers, memory-critical |
| character | `"character"` | `"character"` | `"hello"` | Text, labels, IDs |
| logical | `"logical"` | `"logical"` | `TRUE`, `FALSE` | Conditions, masks |
| complex | `"complex"` | `"complex"` | `2+3i` | Signal processing, physics |
| raw | `"raw"` | `"raw"` | `charToRaw("A")` | Binary, crypto |

Three rules that matter most: (1) `typeof()` shows storage, `class()` shows dispatch behavior; (2) mixed vectors get promoted up the coercion ladder; (3) always use `is.na()` and `is.null()` — never `==`.

## FAQ

### What's the difference between numeric and double?

They're almost the same in everyday use. `"numeric"` is R's user-facing umbrella term covering both `double` and `integer`. `"double"` is the specific internal storage name for floating-point numbers. `class(3.14)` returns `"numeric"`; `typeof(3.14)` returns `"double"`. When people say "numeric variable", they almost always mean a double.

### Why does R default to double instead of integer?

Doubles cover integer values too (exactly, up to 2^53) and handle decimals without you thinking about it. R's designers prioritized statistical computing where most work involves fractions and means. Defaulting to double means `10 / 3` gives `3.333...` instead of `3`, matching mathematical intuition.

### When should I use the L suffix?

Three cases: (1) interfacing with C or C++ code that expects 32-bit integers, (2) memory-critical code with large vectors where halving memory matters, (3) index counters where you want to ensure integer arithmetic. For ordinary numeric work, you never need L.

### Why does TRUE + TRUE return 2?

Logical values auto-promote to integers in arithmetic: TRUE becomes 1, FALSE becomes 0. This means `sum(x > threshold)` counts how many elements pass — an idiomatic R pattern. Once you internalize this, logical-to-integer coercion becomes a feature, not a quirk.

### Is NA the same as NULL?

No. `NA` represents a missing value (a placeholder inside a vector, with a type). `NULL` represents the absence of a value entirely (length 0, no type). A vector `c(1, NA, 3)` has length 3 with one missing element. A vector `c(1, NULL, 3)` has length 2 — the `NULL` disappeared. Use `NA` for missing data, `NULL` for function arguments that mean "not provided".

## References

1. R Core Team — *An Introduction to R*, Chapter 2 (Simple manipulations; numbers and vectors). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 3 (Vectors). CRC Press (2019). [Link](https://adv-r.hadley.nz/vectors-chap.html)
3. R Language Definition — Basic Types. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Basic-types)
4. R manual — `typeof()` reference (stat.ethz.ch). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/typeof.html)
5. R manual — `NA` reference (stat.ethz.ch). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html)
6. R manual — `NULL` reference (stat.ethz.ch). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NULL.html)
7. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 12 (Logical vectors). [Link](https://r4ds.hadley.nz/logicals.html)

## Continue Learning

- **[R Vectors](R-Vectors.html)** — R's core data structure. Every data type lives inside vectors, and vectors are where coercion happens in practice.
- **[R Factors](R-Factors.html)** — a special integer-backed type for categorical data. Looks like a character, behaves like an integer internally.
- **[R Special Values](R-Special-Values.html)** — a deeper dive into NA, NULL, NaN, and Inf, including typed NAs and common debugging patterns.
