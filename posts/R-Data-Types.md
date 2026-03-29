---
title: "R Data Types: Which Type Is Your Variable? (And Why It Matters)"
slug: "R-Data-Types"
description: "R has six data types: numeric, integer, character, logical, complex, and raw. Learn to check, convert, and debug type errors with interactive examples."
keywords: "R data types, numeric, character, logical, integer, class() in R, typeof(), is.numeric, as.character, R type coercion"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.5"
post_type: "C"
auto_link_terms: "R data types|data types in R|class() in R"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Data Types"
sidebar_order: 5
---

# R Data Types: Which Type Is Your Variable? (And Why It Matters)

<p class="lead">R has six basic data types: numeric, integer, character, logical, complex, and raw. Every value in R belongs to one of these types, and the type determines what operations you can perform on it — add numbers, join text, or filter with TRUE/FALSE.</p>

Data types sound abstract until they cause bugs. You try to add two numbers and R throws an error because one is secretly a character string. You read a CSV file and your "numeric" column turns out to be character because of one rogue entry. Understanding types prevents these problems.

This tutorial shows you every R data type with examples you can run, how to check and convert types, and the hidden coercion rules R uses when you mix types together.

## Introduction

A **data type** tells R what kind of value a variable holds. Just as you can't add "hello" + 5 in real life, R can't add a character string to a number. Types are R's way of keeping track of what operations make sense.

Here's a quick overview of all six types — then we'll explore each one in detail:

| Type | Example | What it stores | How common |
|------|---------|---------------|-----------|
| **numeric** (double) | `3.14`, `42` | Decimal numbers | Very common |
| **integer** | `42L` | Whole numbers | Common |
| **character** | `"hello"` | Text strings | Very common |
| **logical** | `TRUE`, `FALSE` | Boolean values | Very common |
| **complex** | `3+2i` | Complex numbers | Rare |
| **raw** | `charToRaw("A")` | Raw bytes | Very rare |

You'll use the first four types daily. Complex and raw are specialized — we'll cover them briefly for completeness.

## Numeric: The Default Number Type

When you type a number in R, it's **numeric** (also called "double" because it uses double-precision floating point internally). This is R's default type for all numbers — even ones without decimal points:

```r
# All of these are numeric
x <- 42
pi_approx <- 3.14159
negative <- -7.5
big_number <- 1.5e6   # Scientific notation: 1,500,000

cat("x:", x, "— type:", class(x), "\n")
cat("pi:", pi_approx, "— type:", class(pi_approx), "\n")
cat("negative:", negative, "— type:", class(negative), "\n")
cat("big:", big_number, "— type:", class(big_number), "\n")

# Surprise: even 42 (no decimal) is numeric, not integer
cat("\nis.numeric(42):", is.numeric(42), "\n")
cat("is.integer(42):", is.integer(42), "\n")
```

Notice that `42` — a whole number — is still numeric, not integer. This catches many beginners off guard. In R, you must explicitly request an integer with the `L` suffix (covered next).

### Numeric precision

R's numeric type uses 64-bit double-precision floating point, which gives you about 15-16 significant digits. For almost all data analysis, this is more than enough. But floating-point arithmetic can produce tiny rounding errors:

```r
# Floating-point surprise
cat("0.1 + 0.2 == 0.3:", 0.1 + 0.2 == 0.3, "\n")
cat("0.1 + 0.2:", 0.1 + 0.2, "\n")
cat("Actual value:", sprintf("%.20f", 0.1 + 0.2), "\n")

# Use all.equal() for safe numeric comparison
cat("all.equal(0.1 + 0.2, 0.3):", all.equal(0.1 + 0.2, 0.3), "\n")
```

`0.1 + 0.2` is not exactly `0.3` due to how computers store decimal numbers. This isn't an R bug — it happens in every programming language. Use `all.equal()` instead of `==` when comparing floating-point numbers.

## Integer: Whole Numbers with L

Integers are whole numbers. In R, you create them by adding an `L` suffix:

```r
# Creating integers
count <- 42L
year <- 2026L
zero <- 0L

cat("count:", count, "— type:", class(count), "\n")
cat("year:", year, "— type:", class(year), "\n")

# Without L, it's numeric (double), not integer
x <- 42     # numeric
y <- 42L    # integer
cat("\n42 type:", class(x), "\n")
cat("42L type:", class(y), "\n")
cat("Are they equal?", x == y, "\n")  # TRUE — same value, different storage
```

### When does integer vs numeric matter?

For most data analysis, it doesn't. R silently converts between them when needed. Integers matter when:

- **Memory efficiency** — integers use 4 bytes, doubles use 8 bytes. For vectors with millions of elements, this adds up.
- **API requirements** — some R functions or packages expect integers (e.g., sequence indices).
- **Reading external data** — when R reads a CSV column of whole numbers, it stores them as integer by default.

```r
# Integer vs numeric memory usage
int_vec <- 1:1000000L      # 1 million integers
dbl_vec <- as.numeric(1:1000000)  # 1 million doubles

cat("Integer vector:", object.size(int_vec), "bytes\n")
cat("Numeric vector:", object.size(dbl_vec), "bytes\n")
cat("Integers use", round(object.size(int_vec) / object.size(dbl_vec) * 100), "% of the memory\n")
```

## Character: Text Strings

Character values hold text. Enclose them in single or double quotes — both work identically:

```r
# Creating character values
name <- "Alice"
greeting <- 'Hello, World!'
empty <- ""
number_as_text <- "42"    # This is text, NOT a number

cat("name:", name, "— type:", class(name), "\n")
cat("greeting:", greeting, "\n")
cat("empty string length:", nchar(empty), "\n")
cat("number_as_text:", number_as_text, "— type:", class(number_as_text), "\n")

# You CANNOT do math with character strings
# This would error: number_as_text + 1
cat("\nCan we add 1 to '42'? No! It's text, not a number.\n")
cat("Convert first:", as.numeric(number_as_text) + 1, "\n")
```

This is the most common source of type errors in R: a column that looks numeric but is actually character. One non-numeric entry (like "N/A" or "$100") in a CSV column turns the entire column into character.

### Useful character functions

```r
# String length
cat("nchar('hello'):", nchar("hello"), "\n")

# Combine strings
cat("paste:", paste("Hello", "World"), "\n")
cat("paste0:", paste0("Item", 1:3), "\n")

# Change case
cat("toupper:", toupper("hello"), "\n")
cat("tolower:", tolower("HELLO"), "\n")

# Substring
cat("substr:", substr("RStudio", 1, 3), "\n")

# Check if text contains a pattern
cat("grepl:", grepl("World", "Hello World"), "\n")

# Split text
cat("strsplit:", strsplit("a,b,c", ","), "\n")
```

## Logical: TRUE and FALSE

Logical values represent yes/no, true/false, on/off. R uses `TRUE` and `FALSE` (all uppercase, no quotes):

```r
# Creating logical values
is_active <- TRUE
is_empty <- FALSE

cat("is_active:", is_active, "— type:", class(is_active), "\n")
cat("is_empty:", is_empty, "— type:", class(is_empty), "\n")

# Logical values come from comparisons
x <- 10
cat("\nx > 5:", x > 5, "\n")
cat("x == 10:", x == 10, "\n")
cat("x < 0:", x < 0, "\n")

# Shortcuts: T and F work but are NOT recommended
cat("\nT:", T, "\n")  # Works but dangerous — T can be overwritten
# T <- 42  # This would break T! TRUE cannot be overwritten.
```

> **Warning:** R allows `T` and `F` as shortcuts for `TRUE` and `FALSE`. Don't use them. Someone (or you) might accidentally create a variable called `T`, breaking all code that relies on it. Always spell out `TRUE` and `FALSE`.

### Logical values as numbers

R treats `TRUE` as 1 and `FALSE` as 0. This is incredibly useful:

```r
# TRUE = 1, FALSE = 0
scores <- c(88, 72, 95, 61, 83, 77, 90)
passing <- 75

passed <- scores >= passing
cat("Passed:", passed, "\n")
cat("Number who passed:", sum(passed), "\n")         # sum() counts TRUEs
cat("Proportion who passed:", mean(passed), "\n")     # mean() gives proportion
cat("Percentage:", mean(passed) * 100, "%\n")
```

This is one of R's most elegant features. `sum(logical_vector)` counts how many TRUE values there are. `mean(logical_vector)` gives you the proportion. You'll use this pattern constantly in data analysis.

## Complex: Imaginary Numbers

Complex numbers have a real and imaginary part. R uses the `i` suffix for the imaginary component:

```r
# Creating complex numbers
z1 <- 3 + 2i
z2 <- 1 - 4i

cat("z1:", z1, "— type:", class(z1), "\n")
cat("z2:", z2, "\n")
cat("Sum:", z1 + z2, "\n")
cat("Product:", z1 * z2, "\n")
cat("Real part of z1:", Re(z1), "\n")
cat("Imaginary part of z1:", Im(z1), "\n")
cat("Modulus (magnitude):", Mod(z1), "\n")
```

Unless you work in engineering, physics, or signal processing, you'll rarely use complex numbers in R. They exist for completeness.

## Raw: Bytes

The raw type stores raw bytes. It's used for low-level data handling — binary file I/O, encryption, or network protocols:

```r
# Creating raw values
r <- charToRaw("Hello")
cat("Raw bytes:", r, "\n")
cat("Back to text:", rawToChar(r), "\n")
cat("Type:", class(r), "\n")
```

You will almost never use raw in normal data analysis. It's mentioned here only because it's one of R's six atomic types.

## Checking Types: class(), typeof(), is.*()

R gives you three ways to check a value's type. Here's when to use each:

```r
x <- 42L
y <- 3.14
z <- "hello"
w <- TRUE

# class() — the most useful for daily work
cat("class(42L):", class(x), "\n")
cat("class(3.14):", class(y), "\n")
cat("class('hello'):", class(z), "\n")
cat("class(TRUE):", class(w), "\n")

cat("\n")

# typeof() — the internal storage type (more technical)
cat("typeof(42L):", typeof(x), "\n")
cat("typeof(3.14):", typeof(y), "\n")
cat("typeof('hello'):", typeof(z), "\n")
cat("typeof(TRUE):", typeof(w), "\n")

cat("\n")

# is.*() — ask a yes/no question about the type
cat("is.numeric(42L):", is.numeric(x), "\n")     # TRUE — integers are numeric
cat("is.integer(42L):", is.integer(x), "\n")     # TRUE
cat("is.character('hello'):", is.character(z), "\n")
cat("is.logical(TRUE):", is.logical(w), "\n")
```

| Function | Returns | Use when |
|----------|---------|----------|
| `class(x)` | Type name as string | You want to know the type |
| `typeof(x)` | Internal storage type | You're debugging memory or performance |
| `is.numeric(x)` | TRUE/FALSE | You want to check before doing math |
| `is.character(x)` | TRUE/FALSE | You want to check before text operations |

> **Tip:** `is.numeric()` returns `TRUE` for both numeric AND integer values. Use `is.integer()` or `is.double()` if you need to distinguish between them.

## Converting Types: as.*()

Sometimes you need to convert a value from one type to another. R provides `as.*()` functions for this:

```r
# Character to numeric
price_text <- "29.99"
price_num <- as.numeric(price_text)
cat("Text to number:", price_num, "— type:", class(price_num), "\n")
cat("Now we can do math:", price_num * 1.08, "(with 8% tax)\n\n")

# Numeric to character
age <- 30
age_text <- as.character(age)
cat("Number to text:", age_text, "— type:", class(age_text), "\n\n")

# Numeric to integer (and back)
x <- as.integer(3.7)   # Truncates, doesn't round!
cat("as.integer(3.7):", x, "(truncated, not rounded)\n")
cat("as.double(42L):", as.double(42L), "\n\n")

# Logical to numeric
cat("as.numeric(TRUE):", as.numeric(TRUE), "\n")
cat("as.numeric(FALSE):", as.numeric(FALSE), "\n\n")

# What happens with invalid conversion?
bad <- as.numeric("hello")
cat("as.numeric('hello'):", bad, "(NA = missing/impossible)\n")
```

Important notes:
- `as.integer()` **truncates** (drops the decimal), it does NOT round. `as.integer(3.9)` gives `3`, not `4`.
- Invalid conversions produce `NA` (R's "missing value") with a warning. This is how R tells you it couldn't convert.

## Type Coercion: R's Automatic Conversions

When you mix types in a vector, R automatically converts everything to the most flexible type. This is called **coercion**, and it follows a strict hierarchy:

**logical → integer → numeric → complex → character**

The type on the right "wins" — it's more flexible and can represent the types to its left.

```r
# Mixing logical and numeric → numeric
mixed1 <- c(TRUE, FALSE, 42)
cat("c(TRUE, FALSE, 42):", mixed1, "\n")
cat("Type:", class(mixed1), "\n\n")

# Mixing numeric and character → character
mixed2 <- c(1, 2, "three")
cat("c(1, 2, 'three'):", mixed2, "\n")
cat("Type:", class(mixed2), "\n\n")

# Mixing logical and character → character
mixed3 <- c(TRUE, "hello")
cat("c(TRUE, 'hello'):", mixed3, "\n")
cat("Type:", class(mixed3), "\n\n")

# The coercion hierarchy in action
mixed4 <- c(TRUE, 42L, 3.14, "text")
cat("c(TRUE, 42L, 3.14, 'text'):", mixed4, "\n")
cat("Type:", class(mixed4), "— everything became text!\n")
```

This is why one character value in a numeric vector turns everything into characters. It's the #1 type gotcha in R. When reading CSV files, a single "N/A" text entry in a column of numbers forces the entire column to character type.

### How to debug coercion problems

```r
# A common real-world problem
data_column <- c(100, 200, "N/A", 400, 500)
cat("Type:", class(data_column), "\n")
cat("Values:", data_column, "\n")
cat("Sum attempt:", sum(as.numeric(data_column)), "\n")  # NA because of "N/A"

# The fix: suppress the warning and handle NAs
numeric_column <- suppressWarnings(as.numeric(data_column))
cat("\nConverted:", numeric_column, "\n")
cat("Sum (ignoring NAs):", sum(numeric_column, na.rm = TRUE), "\n")
cat("Mean (ignoring NAs):", mean(numeric_column, na.rm = TRUE), "\n")
```

The `na.rm = TRUE` argument tells R to ignore NA values when computing. You'll use this a lot.

## Special Values: NA, NULL, NaN, Inf

R has four special values that aren't regular data types but show up constantly:

```r
# NA — "Not Available" (missing data)
cat("NA:", NA, "— type:", class(NA), "\n")
cat("Is NA:", is.na(NA), "\n")
cat("5 + NA:", 5 + NA, "\n")   # Anything + NA = NA

# NULL — "nothing" (empty, doesn't exist)
cat("\nNULL:", NULL, "\n")
cat("Length of NULL:", length(NULL), "\n")
cat("Is NULL:", is.null(NULL), "\n")

# NaN — "Not a Number" (undefined math result)
cat("\n0/0:", 0/0, "\n")
cat("Is NaN:", is.nan(0/0), "\n")

# Inf — Infinity
cat("\n1/0:", 1/0, "\n")
cat("-1/0:", -1/0, "\n")
cat("Is Inf:", is.infinite(1/0), "\n")
```

| Value | Meaning | Created by | Check with |
|-------|---------|-----------|-----------|
| `NA` | Missing data | Missing CSV cells, failed conversion | `is.na()` |
| `NULL` | Empty/nothing | Empty function returns, deleted elements | `is.null()` |
| `NaN` | Not a number | `0/0`, `sqrt(-1)` | `is.nan()` |
| `Inf` | Infinity | `1/0`, `exp(1000)` | `is.infinite()` |

> **Key difference:** `NA` means "there's a value but we don't know it." `NULL` means "there's no value at all." This distinction matters when writing functions and handling missing data.

## Practice Exercises

### Exercise 1: Type Detective

Predict the type of each value before running the code:

```r
# Exercise: Predict the type of each value, then run to check
# What type is each of these?

a <- 100
b <- 100L
c <- "100"
d <- TRUE
e <- 3 + 0i
f <- c(1, 2, "3")

# Write your predictions as comments, then uncomment the cat() lines:
# cat("a:", class(a), "\n")  # Your prediction: ?
# cat("b:", class(b), "\n")  # Your prediction: ?
# cat("c:", class(c), "\n")  # Your prediction: ?
# cat("d:", class(d), "\n")  # Your prediction: ?
# cat("e:", class(e), "\n")  # Your prediction: ?
# cat("f:", class(f), "\n")  # Your prediction: ?
```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
a <- 100     # numeric (not integer — no L suffix)
b <- 100L    # integer (L suffix makes it integer)
c <- "100"   # character (quotes make it text)
d <- TRUE    # logical
e <- 3 + 0i  # complex (any use of i makes it complex)
f <- c(1, 2, "3")  # character (coercion: one string → all strings)

cat("a:", class(a), "\n")   # numeric
cat("b:", class(b), "\n")   # integer
cat("c:", class(c), "\n")   # character
cat("d:", class(d), "\n")   # logical
cat("e:", class(e), "\n")   # complex
cat("f:", class(f), "\n")   # character — the tricky one!
```

**Explanation:** `f` is the tricky one — even though `1` and `2` are numeric, the `"3"` is character, so R coerces everything to character: `c("1", "2", "3")`.

</details>

### Exercise 2: Fix the Type Bug

This code has a type error. Find and fix it:

```r
# Exercise: This code should calculate the total price but has a bug
prices <- c("19.99", "5.50", "12.00", "8.75")
quantities <- c(2, 1, 3, 4)

# This will fail — fix it!
# total <- sum(prices * quantities)
# cat("Total:", total, "\n")

# Hint: Check what type 'prices' is. Then convert it.

# Write your fix below:
```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
prices <- c("19.99", "5.50", "12.00", "8.75")
quantities <- c(2, 1, 3, 4)

# The bug: prices is character, not numeric
cat("prices type:", class(prices), "\n")

# Fix: convert prices to numeric first
prices_num <- as.numeric(prices)
total <- sum(prices_num * quantities)
cat("Total: $", total, "\n")

# Itemized:
for (i in 1:length(prices_num)) {
  cat(sprintf("  $%.2f x %d = $%.2f\n",
      prices_num[i], quantities[i], prices_num[i] * quantities[i]))
}
```

**Explanation:** `prices` is a character vector because of the quotes. You can't multiply text by numbers. `as.numeric(prices)` converts the text to numbers, and then the math works.

</details>

### Exercise 3: Coercion Challenge

Predict what R will produce for each coercion scenario:

```r
# Exercise: Predict the result and type for each
# Then uncomment and run to check

# 1. What happens when you add TRUE + TRUE + FALSE?
# cat(TRUE + TRUE + FALSE, "\n")

# 2. What type is c(1L, 2.5)?
# cat(class(c(1L, 2.5)), "\n")

# 3. What does as.integer(TRUE) return?
# cat(as.integer(TRUE), "\n")

# 4. What does as.logical(0) return?
# cat(as.logical(0), "\n")

# 5. What does as.logical("yes") return?
# cat(as.logical("yes"), "\n")

# Write your predictions, then run to verify:
```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
# 1. TRUE + TRUE + FALSE = 2 (TRUE=1, FALSE=0, so 1+1+0=2)
cat("TRUE + TRUE + FALSE:", TRUE + TRUE + FALSE, "\n")

# 2. c(1L, 2.5) → numeric (integer coerced to double)
cat("c(1L, 2.5) type:", class(c(1L, 2.5)), "\n")

# 3. as.integer(TRUE) = 1
cat("as.integer(TRUE):", as.integer(TRUE), "\n")

# 4. as.logical(0) = FALSE (0 is FALSE, any nonzero is TRUE)
cat("as.logical(0):", as.logical(0), "\n")

# 5. as.logical("yes") = NA (R only recognizes "TRUE"/"FALSE" strings)
cat("as.logical('yes'):", as.logical("yes"), "\n")
cat("as.logical('TRUE'):", as.logical("TRUE"), "\n")
```

**Explanation:** #5 surprises many people — R can only convert the strings "TRUE" and "FALSE" (case-insensitive) to logical values. "yes", "no", "1", "0" as strings produce `NA`.

</details>

## Summary

| Type | Example | Check | Convert | Notes |
|------|---------|-------|---------|-------|
| numeric | `3.14` | `is.numeric()` | `as.numeric()` | Default for all numbers |
| integer | `42L` | `is.integer()` | `as.integer()` | Needs L suffix; truncates when converting |
| character | `"text"` | `is.character()` | `as.character()` | Quotes required; "wins" in coercion |
| logical | `TRUE` | `is.logical()` | `as.logical()` | TRUE=1, FALSE=0 in math |
| complex | `3+2i` | `is.complex()` | `as.complex()` | Rare; for imaginary numbers |
| raw | `charToRaw("A")` | `is.raw()` | `as.raw()` | Very rare; for byte data |

**Coercion hierarchy:** logical → integer → numeric → complex → character

**The #1 type gotcha:** One character value in a numeric vector converts everything to character.

## FAQ

### What's the difference between class() and typeof()?

`class()` returns the high-level type (numeric, integer, character, etc.) — the one you use in daily work. `typeof()` returns the internal C-level storage type (double, integer, character, logical). For most purposes, use `class()`.

### Why does R say my numbers are "double"?

"Double" means "double-precision floating point" — it's the internal storage format for numeric values. `class()` reports "numeric" which is more user-friendly, but `typeof()` reports "double". They're the same thing.

### How do I check the type of a data frame column?

Use `class(df$column_name)` or `sapply(df, class)` to check all columns at once. The `str()` function also shows types: `str(df)`.

### Can I change a column's type in a data frame?

Yes. Use `df$column <- as.numeric(df$column)` to convert a single column. For multiple columns, use `dplyr::mutate(df, across(col1:col3, as.numeric))`.

### What's a factor? Is it a data type?

A factor is a special data structure (not an atomic type) for categorical data like "Male"/"Female" or "Low"/"Medium"/"High". Factors store integers internally but display as text labels. We cover factors in a later tutorial.

## What's Next?

Now that you understand R's data types, you're ready to learn about data structures — how R organizes multiple values:

1. **R Vectors** — the most fundamental data structure, where all elements must be the same type
2. **R Data Frames** — tabular data with rows and columns (each column can be a different type)
3. **R Lists** — the most flexible structure, holding any combination of types

Each tutorial includes interactive code blocks for hands-on practice.
