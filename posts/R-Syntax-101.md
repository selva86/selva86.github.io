---
title: "R Syntax 101: Write Your First Working Script in 10 Minutes"
slug: "R-Syntax-101"
description: "Learn R's core syntax: arithmetic operators, variable assignment with <-, comments, and how to write and run your first script — with every line explained."
keywords: "R syntax, R assignment, R operators, R comments, R script, R basics, R variables, R arithmetic, <- operator, PEMDAS R"
mathjax: false
webr: true
date: "2026-04-03"
curriculum_id: "1.1.4"
post_type: "C"
auto_link_terms: "R syntax|R basics|R assignment|<- operator"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Syntax 101"
sidebar_order: 4
---

# R Syntax 101: Write Your First Working Script in 10 Minutes

<p class="lead">R's core syntax has three building blocks: <strong>operators</strong> for math and comparison, <strong>assignment</strong> with <code>&lt;-</code> to store values in variables, and <strong>comments</strong> with <code>#</code> to annotate your code. Master these three and you can read — and write — any R script.</p>

Type `2 + 2` into the R console and press Enter. You just ran R code. This tutorial builds from that moment: first arithmetic, then variables, then comments, then a complete script that ties everything together. Every code block below is interactive — click **Run** to see the output yourself.

## R as a Calculator

R evaluates arithmetic the moment you hit Enter. Every operator you'd expect from a calculator works out of the box.

```r
# The six arithmetic operators
cat("Addition:        10 + 3 =", 10 + 3, "\n")
cat("Subtraction:     10 - 3 =", 10 - 3, "\n")
cat("Multiplication:  10 * 3 =", 10 * 3, "\n")
cat("Division:        10 / 3 =", round(10 / 3, 4), "\n")
cat("Exponentiation:   2 ^ 10 =", 2 ^ 10, "\n")
cat("Modulo (remainder): 10 %% 3 =", 10 %% 3, "\n")
cat("Integer division:   10 %/% 3 =", 10 %/% 3, "\n")
```

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `+` | Addition | `10 + 3` | 13 |
| `-` | Subtraction | `10 - 3` | 7 |
| `*` | Multiplication | `10 * 3` | 30 |
| `/` | Division | `10 / 3` | 3.333... |
| `^` | Exponentiation | `2 ^ 10` | 1024 |
| `%%` | Modulo (remainder) | `10 %% 3` | 1 |
| `%/%` | Integer division | `10 %/% 3` | 3 |

### Operator Precedence (PEMDAS)

R follows standard math order: **P**arentheses, **E**xponents, **M**ultiplication/**D**ivision, **A**ddition/**S**ubtraction. When in doubt, add parentheses.

```r
# Without parentheses: exponent first, then multiply, then add
result1 <- 2 + 3 * 4 ^ 2
cat("2 + 3 * 4^2 =", result1, "(exponent, then multiply, then add)\n")

# With parentheses: you control the order
result2 <- (2 + 3) * 4 ^ 2
cat("(2 + 3) * 4^2 =", result2, "(parentheses force addition first)\n")

# Classic trap: negative exponent
cat("-2^2 =", -2^2, "   (exponent first, THEN negate)\n")
cat("(-2)^2 =", (-2)^2, "  (negate first, THEN exponent)\n")
```

![R operator precedence](screenshots/R-Syntax-101-operator-precedence.webp)

*Figure 1: R evaluates operators in this order — parentheses first, then exponents, then multiplication/division, then addition/subtraction, then comparison, then logical, and finally assignment.*

## Comparison & Logical Operators

Comparisons return `TRUE` or `FALSE`. You'll use these constantly in filtering data and writing conditions.

```r
# Comparison operators
cat("5 > 3:   ", 5 > 3, "\n")
cat("5 < 3:   ", 5 < 3, "\n")
cat("5 == 5:  ", 5 == 5, "\n")    # Equal (double ==)
cat("5 != 3:  ", 5 != 3, "\n")    # Not equal
cat("5 >= 5:  ", 5 >= 5, "\n")
cat("5 <= 4:  ", 5 <= 4, "\n")
```

> Use `==` for comparison, not `=`. A single `=` is assignment. Mixing them up is the most common beginner mistake in R.

```r
# Logical operators: combine TRUE/FALSE values
x <- 7
cat("x > 5 AND x < 10:", x > 5 & x < 10, "\n")   # Both must be TRUE
cat("x > 5 OR  x > 10:", x > 5 | x > 10, "\n")   # At least one TRUE
cat("NOT (x > 5):     ", !(x > 5), "\n")           # Flip TRUE to FALSE
```

## Variables & Assignment

A **variable** stores a value so you can reuse it by name. R's assignment operator `<-` points the value into the variable — think of it as an arrow saying "put this into that."

```r
# Create variables with <-
age <- 25
name <- "Alice"
is_student <- TRUE

cat("Name:", name, "\n")
cat("Age:", age, "\n")
cat("Student?", is_student, "\n")

# Variables are reusable
cat("\nAge in 10 years:", age + 10, "\n")
cat("Name length:", nchar(name), "characters\n")
```

### Why `<-` and Not `=`?

Both work for assignment at the top level. But `<-` is the R convention, recommended by every style guide, and avoids a real ambiguity inside function calls.

```r
# Both work at the top level
x <- 10
y = 20
cat("x:", x, "  y:", y, "\n")

# The danger: inside function calls, = means "argument name"
# mean(x = c(1, 2, 3))   — sets the argument 'x', does NOT create a variable
# mean(x <- c(1, 2, 3))  — creates variable x AND passes it to mean()

# Stick with <- for assignment. Use = only for function arguments.
cat("Rule: use <- for assignment, = for function arguments\n")
```

![R assignment operators compared](screenshots/R-Syntax-101-assignment-operators.webp)

*Figure 2: Use `<-` for standard assignment. The `=` operator works at the top level but causes confusion inside function calls. Right assignment `->` and global assignment `<<-` exist but are rarely needed.*

### Naming Rules

```r
# Valid variable names
my_score <- 95          # snake_case (recommended by tidyverse)
score2 <- 88            # numbers OK (not at start)
.hidden_var <- "secret" # dot prefix hides from ls()

# R is case-sensitive!
Score <- 100
score <- 50
cat("Score:", Score, "\n")
cat("score:", score, "\n")  # Different variable!
```

| Rule | Valid examples | Invalid examples |
|------|---------------|-----------------|
| Letters, numbers, `.`, `_` | `my_var`, `x2`, `.temp` | `my-var`, `2x` |
| Must start with letter or `.` | `data1`, `.cache` | `1data`, `_var` |
| Case-sensitive | `X` and `x` are different | — |
| No reserved words | `my_if`, `my_for` | `if`, `for`, `TRUE`, `NULL` |

### Updating Variables

Assigning to an existing name overwrites the old value. R keeps no history — the previous value is gone.

```r
score <- 80
cat("Original:", score, "\n")

score <- score + 10    # Use the current value to compute the new one
cat("After +10:", score, "\n")

score <- score * 1.1   # 10% increase
cat("After 10% raise:", round(score, 1), "\n")
```

## Comments

A **comment** is any text after `#` on a line. R ignores it completely. Use comments to explain *why* your code does something — the code itself already shows *what* it does.

```r
# This entire line is a comment — R skips it completely

x <- 42  # Inline comment: code runs, comment is ignored

# Good comments explain WHY:
threshold <- 0.05  # Standard significance level in most fields

# Bad comments restate the code:
# threshold <- 0.05  # Set threshold to 0.05  (don't do this)
```

### Section Headers and Multi-Line Comments

R has no block comment syntax like `/* */` in other languages. Use multiple `#` lines. In RStudio, select lines and press `Ctrl+Shift+C` to toggle commenting.

```r
# =============================================
# Section: Data Cleaning
# Author: Alice
# Date: 2026-04-03
# Purpose: Remove outliers, fill missing values
# =============================================

cat("Section headers make long scripts readable\n")

# Tip: RStudio recognizes lines ending with ---- or ==== as sections
# You can fold and navigate them in the outline panel
```

## Built-in Functions

R comes with hundreds of built-in functions. Call a function by name, followed by parentheses containing the **arguments**.

```r
# Math functions
cat("sqrt(144):         ", sqrt(144), "\n")
cat("abs(-7):           ", abs(-7), "\n")
cat("round(3.14159, 2): ", round(3.14159, 2), "\n")
cat("ceiling(3.2):      ", ceiling(3.2), "\n")   # Round up
cat("floor(3.8):        ", floor(3.8), "\n")     # Round down
cat("log(100, base=10): ", log(100, base = 10), "\n")
```

```r
# String functions
cat("nchar('hello'):   ", nchar("hello"), "\n")
cat("toupper('hello'): ", toupper("hello"), "\n")
cat("tolower('WORLD'): ", tolower("WORLD"), "\n")
cat("paste('R', 'is', 'great'):", paste("R", "is", "great"), "\n")
cat("paste0('a', 'b', 'c'):    ", paste0("a", "b", "c"), "\n")
```

```r
# Getting help — try these in RStudio:
# ?mean           opens the help page for mean()
# help(round)     same as ?round
# example(paste)  runs the built-in examples for paste()

cat("In RStudio, type ?function_name to see documentation\n")
cat("Or press F1 with cursor on a function name\n")
```

## Your First Complete Script

A **script** is a plain text file with a `.R` extension. R reads it top to bottom, executing one line at a time. Comments are skipped. Results are stored in the environment for later lines to use.

![How R executes a script](screenshots/R-Syntax-101-script-execution.webp)

*Figure 3: R reads your .R file line by line. Lines starting with # are skipped. Each executable line runs in order, and its results are available to all subsequent lines.*

Here's a complete script that combines everything from this tutorial — arithmetic, variables, functions, and comments:

```r
# =============================================
# My First R Script: Exam Score Analysis
# =============================================

# --- Input Data ---
scores <- c(88, 92, 76, 95, 81, 67, 90, 85, 73, 98)
passing_grade <- 70

# --- Calculations ---
n_students   <- length(scores)
avg_score    <- mean(scores)
best_score   <- max(scores)
worst_score  <- min(scores)
score_range  <- best_score - worst_score
n_passed     <- sum(scores >= passing_grade)
pass_rate    <- n_passed / n_students * 100

# --- Output Report ---
cat("========================================\n")
cat("        EXAM SCORE REPORT              \n")
cat("========================================\n")
cat("Students:       ", n_students, "\n")
cat("Average score:  ", round(avg_score, 1), "\n")
cat("Highest score:  ", best_score, "\n")
cat("Lowest score:   ", worst_score, "\n")
cat("Range:          ", score_range, "\n")
cat("Passed (>=", passing_grade, "):", n_passed, "of", n_students, "\n")
cat("Pass rate:      ", round(pass_rate, 1), "%\n")
cat("========================================\n")
```

> Try modifying the `scores` vector or `passing_grade` above and clicking **Run** again. Every variable recalculates automatically — that's the power of a script over manual calculator work.

## Common Syntax Errors

Every R beginner hits these. Recognizing the error message saves hours of frustration.

```r
# Error 1: Forgetting quotes around text
# name <- Alice        — R thinks Alice is a variable name
# Fix:
name <- "Alice"
cat("1. Quotes fixed:", name, "\n")

# Error 2: Using = instead of == in comparisons
x <- 5
# if (x = 5)           — assigns 5 to x instead of comparing
# Fix:
cat("2. Comparison:", x == 5, "\n")

# Error 3: Case sensitivity
# Mean(c(1,2,3))       — capital M, function not found
# Fix:
cat("3. Lowercase:", mean(c(1, 2, 3)), "\n")

# Error 4: Missing closing parenthesis
# mean(c(1, 2, 3)      — one ) missing
# Fix:
cat("4. Balanced parens:", mean(c(1, 2, 3)), "\n")
```

| Error Message | Likely Cause | Fix |
|--------------|-------------|-----|
| `object 'x' not found` | Typo in variable name, or forgot quotes | Check spelling, add `"quotes"` for strings |
| `unexpected '=' in "if(x ="` | Used `=` instead of `==` | Use `==` for comparison |
| `could not find function 'Mean'` | Wrong capitalization | R is case-sensitive — use `mean` |
| `unexpected end of input` | Missing `)` or `}` | Count your brackets |
| `unexpected symbol` | Missing comma or operator | Check commas between arguments |

## Practice Exercises

### Exercise 1: Calculator

Compute: (15 + 7) * 3 - 10 / 2. Store the result in `answer` and print it.

```r
# Calculate and store in 'answer'
# Expected output: "The answer is: 61"

```

<details>
<summary>Click to reveal solution</summary>

```r
answer <- (15 + 7) * 3 - 10 / 2
cat("The answer is:", answer, "\n")
```

**Explanation:** Parentheses force 15 + 7 = 22 first. Then 22 * 3 = 66 and 10 / 2 = 5 happen at the same precedence level (left to right). Finally 66 - 5 = 61.

</details>

### Exercise 2: Variable Swap

Swap the values of `a` and `b` without hardcoding numbers.

```r
a <- 10
b <- 20
cat("Before: a =", a, " b =", b, "\n")

# Swap a and b
# Hint: you need a temporary variable

cat("After:  a =", a, " b =", b, "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r
a <- 10
b <- 20
cat("Before: a =", a, " b =", b, "\n")

temp <- a
a <- b
b <- temp
cat("After:  a =", a, " b =", b, "\n")
```

**Explanation:** Without `temp`, writing `a <- b` would lose `a`'s original value. The temporary variable holds it during the swap.

</details>

### Exercise 3: Temperature Converter

Convert 98.6 degrees Fahrenheit to Celsius using C = (F - 32) * 5/9.

```r
fahrenheit <- 98.6

# Convert and print: "98.6°F = 37.0°C"

```

<details>
<summary>Click to reveal solution</summary>

```r
fahrenheit <- 98.6
celsius <- (fahrenheit - 32) * 5 / 9
cat(fahrenheit, "F =", round(celsius, 1), "C\n")
```

**Explanation:** Parentheses ensure the subtraction happens before the multiplication. `round(celsius, 1)` formats to one decimal place.

</details>

### Exercise 4: String Builder

Build a formatted greeting using `paste0()` and variables.

```r
first <- "Ada"
last <- "Lovelace"
year <- 1843

# Create: "Hello, Ada Lovelace! First program written in 1843."
# Hint: paste0() joins strings with no space between them

```

<details>
<summary>Click to reveal solution</summary>

```r
first <- "Ada"
last <- "Lovelace"
year <- 1843

msg <- paste0("Hello, ", first, " ", last, "! First program written in ", year, ".")
cat(msg, "\n")
```

**Explanation:** `paste0()` concatenates with no separator. R automatically converts `year` (numeric) to text. Use `paste()` with `sep = " "` if you want spaces added automatically.

</details>

### Exercise 5: Mini Data Analysis

Given daily temperatures, compute the mean, the range (max - min), and count how many days exceeded 30 degrees.

```r
temps <- c(28, 32, 27, 35, 30, 33, 29, 31, 26, 34)

# Calculate: mean, range, count above 30
# Print a formatted summary report

```

<details>
<summary>Click to reveal solution</summary>

```r
temps <- c(28, 32, 27, 35, 30, 33, 29, 31, 26, 34)

avg <- mean(temps)
temp_range <- max(temps) - min(temps)
hot_days <- sum(temps > 30)

cat("=== Temperature Report ===\n")
cat("Days recorded:", length(temps), "\n")
cat("Average:      ", round(avg, 1), "C\n")
cat("Range:        ", temp_range, "C (", min(temps), "to", max(temps), ")\n")
cat("Days > 30C:   ", hot_days, "of", length(temps), "\n")
```

**Explanation:** `sum(temps > 30)` counts TRUE values — R treats each TRUE as 1 and FALSE as 0. This is the idiomatic R way to count elements matching a condition.

</details>

## Summary

| Concept | Syntax | Example |
|---------|--------|---------|
| Arithmetic | `+ - * / ^ %% %/%` | `2 ^ 10` → 1024 |
| Comparison | `== != > < >= <=` | `5 == 5` → TRUE |
| Logical | `& | !` | `TRUE & FALSE` → FALSE |
| Assignment | `<-` | `x <- 42` |
| Comments | `#` | `# This is ignored` |
| Strings | `"text"` or `'text'` | `name <- "Alice"` |
| Function call | `fn(args)` | `mean(c(1, 2, 3))` |
| Help | `?fn` | `?mean` |

## FAQ

### Why does R use <- instead of = for assignment?

It's a convention inherited from the S language (R's ancestor, created in the 1970s at Bell Labs). The `<-` makes the direction of assignment visually explicit: "put this value into that name." Every major R style guide — tidyverse, Google, Bioconductor — recommends `<-`. The `=` operator works at the top level but is ambiguous inside function calls, where `=` means "set this argument."

### What's the difference between = and ==?

`=` is assignment — it stores a value: `x = 5`. `==` is comparison — it tests equality: `x == 5` returns TRUE or FALSE. Using `=` when you mean `==` is one of the most common R bugs. The code runs without error but does something completely different from what you intended.

### Is R case-sensitive?

Yes, everywhere. `mean()` works; `Mean()` throws "could not find function." `myVar` and `myvar` are two separate variables. This applies to function names, variable names, package names, and argument names.

### How do I write multi-line comments?

R has no block comment syntax. Use multiple lines starting with `#`. In RStudio, select lines and press Ctrl+Shift+C (Windows) or Cmd+Shift+C (Mac) to toggle comments on all selected lines at once.

### Can I use dots and underscores in variable names?

Yes. Both `my.variable` and `my_variable` are valid R names. The tidyverse style guide recommends **snake_case** (underscores). Some older R code uses dots, but dots have special meaning in S3 method dispatch (`print.data.frame` is the print method for data frames), so underscores are safer for your own variables.

## What's Next?

- [R Data Types](/R-Data-Types.html) — understand numeric, character, logical, and more
- [R Vectors](/R-Vectors.html) — the fundamental data structure everything builds on
- [R Control Flow](/R-Control-Flow.html) — if/else, for loops, and while loops
