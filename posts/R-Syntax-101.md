---
title: "R Syntax 101: Arithmetic, Assignment, Comments & Your First Script"
slug: "R-Syntax-101"
description: "Learn R syntax from scratch: arithmetic operators, variable assignment with <-, comments, and how to write your first R script. Interactive examples."
keywords: "R syntax, R assignment, R operators, R comments, R script, R basics, R variables, R arithmetic, <- operator"
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

# R Syntax 101: Arithmetic, Assignment, Comments & Your First Script

<p class="lead">R's core syntax has three building blocks: <strong>operators</strong> for math and comparison, <strong>assignment</strong> with <code>&lt;-</code> to store values in variables, and <strong>comments</strong> with <code>#</code> to annotate your code. Master these and you can read any R script.</p>

Open RStudio, type `2 + 2` in the console, and press Enter. You just ran R code. Everything in this tutorial builds from that moment — adding variables, combining operations, and writing scripts you can save and reuse.

## R as a Calculator

R evaluates arithmetic expressions the moment you press Enter. Every operator you'd expect from a calculator works out of the box.

```r
# Basic arithmetic
cat("Addition:       ", 10 + 3, "\n")
cat("Subtraction:    ", 10 - 3, "\n")
cat("Multiplication: ", 10 * 3, "\n")
cat("Division:       ", 10 / 3, "\n")
cat("Exponentiation: ", 2 ^ 10, "\n")
cat("Integer division:", 10 %/% 3, "\n")
cat("Modulo (remainder):", 10 %% 3, "\n")
```

### Operator Precedence (PEMDAS)

R follows the standard mathematical order of operations. Parentheses override everything.

```r
# Without parentheses: exponent first, then multiply, then add
result1 <- 2 + 3 * 4 ^ 2
cat("2 + 3 * 4^2 =", result1, "\n")

# With parentheses: force your own order
result2 <- (2 + 3) * 4 ^ 2
cat("(2 + 3) * 4^2 =", result2, "\n")

# Common trap: negative exponent
cat("-2^2 =", -2^2, "  (exponent first, then negate)\n")
cat("(-2)^2 =", (-2)^2, " (negate first, then exponent)\n")
```

![R operator precedence](screenshots/R-Syntax-101-operator-precedence.webp)

*Figure 1: R evaluates operators left to right within each precedence level — parentheses first, then exponents, then multiplication/division, then addition/subtraction, then comparisons, then logical, and finally assignment.*

### Comparison Operators

Comparisons return `TRUE` or `FALSE` — the foundation of filtering and conditional logic.

```r
cat("5 > 3:  ", 5 > 3, "\n")
cat("5 < 3:  ", 5 < 3, "\n")
cat("5 == 5: ", 5 == 5, "\n")   # Equal (double ==, not single =)
cat("5 != 3: ", 5 != 3, "\n")   # Not equal
cat("5 >= 5: ", 5 >= 5, "\n")
cat("5 <= 4: ", 5 <= 4, "\n")
```

> Use `==` for comparison, not `=`. A single `=` is assignment. This is the most common beginner mistake in R.

### Logical Operators

Combine TRUE/FALSE values with AND (`&`), OR (`|`), and NOT (`!`).

```r
x <- 7

cat("x > 5 AND x < 10:", x > 5 & x < 10, "\n")
cat("x > 5 OR  x > 10:", x > 5 | x > 10, "\n")
cat("NOT (x > 5):     ", !(x > 5), "\n")
```

## Variables & Assignment

A **variable** stores a value so you can reuse it by name. The assignment operator `<-` points the value into the variable — think of it as an arrow: "put this value into that name."

```r
# Assign with <-
age <- 25
name <- "Alice"
is_student <- TRUE

cat("Name:", name, "\n")
cat("Age:", age, "\n")
cat("Student?", is_student, "\n")
```

### Why `<-` Instead of `=`?

Both `<-` and `=` work for assignment at the top level. But `<-` is the R convention, recommended by every style guide, and avoids ambiguity inside function calls.

```r
# Both work at the top level
x <- 10
y = 20
cat("x:", x, "  y:", y, "\n")

# But inside a function call, = means "argument", not "assign"
# mean(x = c(1, 2, 3))  ← sets the argument 'x', doesn't create variable x
# mean(x <- c(1, 2, 3)) ← creates variable x AND passes it to mean()

# Right assignment also exists (rare, but valid)
30 -> z
cat("z:", z, "\n")
```

![R assignment operators compared](screenshots/R-Syntax-101-assignment-operators.webp)

*Figure 2: Use `<-` for standard assignment. The `=` operator works at top level but causes confusion in function calls. Right assignment `->` and global assignment `<<-` exist but are rarely used.*

### Variable Naming Rules

```r
# Valid names
my_score <- 95
score2 <- 88
.hidden <- "starts with dot — valid but hidden from ls()"

# Show all variables in the environment
cat("Variables:", paste(ls(), collapse = ", "), "\n")

# R is case-sensitive
Score <- 100
score <- 50
cat("Score:", Score, "  score:", score, "\n")  # Different variables!
```

| Rule | Valid | Invalid |
|------|-------|---------|
| Letters, numbers, `.`, `_` | `my_var`, `x2`, `.temp` | `my-var`, `2x` |
| Must start with letter or `.` | `data1`, `.cache` | `1data`, `_var` |
| Case-sensitive | `X` and `x` are different | — |
| No reserved words | `my_if` | `if`, `for`, `TRUE` |

### Updating Variables

Variables can be overwritten. The old value is gone — R doesn't keep history.

```r
score <- 80
cat("Score:", score, "\n")

score <- score + 10   # Add 10 to the current value
cat("After bonus:", score, "\n")

score <- score * 1.1  # 10% increase
cat("After raise:", round(score, 1), "\n")
```

## Comments

A **comment** is any text after `#` on a line. R ignores it completely. Comments explain *why* the code does something — the code itself shows *what* it does.

```r
# This entire line is a comment — R skips it

x <- 42  # This is an inline comment — code runs, comment is ignored

# Good comment: explains WHY
age <- 18  # Legal voting age in most countries

# Bad comment: just restates the code
# age <- 18  # Set age to 18   ← don't do this
```

### Multi-Line Comments

R has no block comment syntax (no `/* */` like C). Use multiple `#` lines, or use the RStudio shortcut `Ctrl+Shift+C` to toggle commenting on selected lines.

```r
# ============================================
# Section: Data Cleaning
# Purpose: Remove outliers and fill missing values
# Author: Alice
# Date: 2026-04-03
# ============================================

# Step 1: Remove rows with NA
# Step 2: Cap values at the 99th percentile
# Step 3: Log-transform skewed columns

cat("Comments don't execute — this is the only output\n")
```

## Built-in Functions

R has hundreds of built-in functions. You call a function by name followed by parentheses containing the arguments.

```r
# Math functions
cat("sqrt(144):", sqrt(144), "\n")
cat("abs(-7):  ", abs(-7), "\n")
cat("round(3.14159, 2):", round(3.14159, 2), "\n")
cat("ceiling(3.2):", ceiling(3.2), "\n")
cat("floor(3.8):  ", floor(3.8), "\n")
```

```r
# String functions
cat("nchar('hello'):", nchar("hello"), "\n")
cat("toupper('hello'):", toupper("hello"), "\n")
cat("paste('R', 'is', 'great'):", paste("R", "is", "great"), "\n")
cat("substr('Hello World', 1, 5):", substr("Hello World", 1, 5), "\n")
```

```r
# Getting help (these open documentation — try in RStudio)
# ?mean           # Help for mean()
# help(round)     # Same as ?round
# example(paste)  # Run examples for paste()

cat("Use ?function_name in RStudio to see documentation\n")
```

## Your First Script

A **script** is a text file (`.R` extension) containing multiple lines of R code. R executes them top to bottom, one line at a time.

![How R executes a script](screenshots/R-Syntax-101-script-execution.webp)

*Figure 3: R reads your script file line by line. Comments are skipped. Each executable line runs in order, and results are stored in the environment for later lines to use.*

```r
# =============================================
# My First R Script
# Purpose: Analyze exam scores
# =============================================

# --- Data ---
scores <- c(88, 92, 76, 95, 81, 67, 90, 85)
student_count <- length(scores)

# --- Analysis ---
avg_score <- mean(scores)
best_score <- max(scores)
worst_score <- min(scores)
pass_count <- sum(scores >= 70)

# --- Report ---
cat("========== Exam Report ==========\n")
cat("Students:     ", student_count, "\n")
cat("Average score:", round(avg_score, 1), "\n")
cat("Highest score:", best_score, "\n")
cat("Lowest score: ", worst_score, "\n")
cat("Passed (>=70):", pass_count, "of", student_count, "\n")
cat("Pass rate:    ", round(pass_count / student_count * 100, 1), "%\n")
```

## Common Syntax Errors (and How to Fix Them)

```r
# Error 1: Missing closing parenthesis
# mean(c(1, 2, 3)   ← missing )
# Fix:
mean(c(1, 2, 3))

# Error 2: Using = instead of == for comparison
x <- 5
# if (x = 5)   ← assignment, not comparison
# Fix:
cat("x == 5:", x == 5, "\n")

# Error 3: Forgetting quotes around strings
# name <- Alice    ← R thinks Alice is a variable
# Fix:
name <- "Alice"
cat("Name:", name, "\n")

# Error 4: Case sensitivity
# Mean(c(1,2,3))  ← wrong: capital M
# Fix:
cat("mean:", mean(c(1, 2, 3)), "\n")
```

| Error | Message You See | Fix |
|-------|----------------|-----|
| Missing `)` | `unexpected end of input` | Count your parentheses |
| Wrong `=` | `unexpected '=' in "if(x ="` | Use `==` for comparison |
| Unquoted string | `object 'Alice' not found` | Wrap in `"quotes"` |
| Case mistake | `could not find function 'Mean'` | Use `mean` (lowercase) |
| Missing comma | `unexpected symbol` | Check commas between arguments |

## Practice Exercises

### Exercise 1: Calculator

Compute: (15 + 7) * 3 - 10 / 2

```r
# Calculate the result and store it in a variable called 'answer'
# Print: "The answer is: <value>"

```

<details>
<summary>Click to reveal solution</summary>

```r
answer <- (15 + 7) * 3 - 10 / 2
cat("The answer is:", answer, "\n")
```

**Explanation:** Parentheses force `15 + 7 = 22` first. Then `22 * 3 = 66` and `10 / 2 = 5` (same precedence, left to right). Finally `66 - 5 = 61`.

</details>

### Exercise 2: Variable Swap

You have two variables. Swap their values without hardcoding.

```r
a <- 10
b <- 20
cat("Before: a =", a, " b =", b, "\n")

# Swap a and b using a temporary variable
# Hint: you need a third variable to hold one value temporarily

cat("After: a =", a, " b =", b, "\n")
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

cat("After: a =", a, " b =", b, "\n")
```

**Explanation:** Without `temp`, assigning `a <- b` would lose `a`'s original value. The temporary variable holds it while the swap happens.

</details>

### Exercise 3: Temperature Converter

Convert 98.6 degrees Fahrenheit to Celsius. Formula: C = (F - 32) * 5/9

```r
fahrenheit <- 98.6

# Convert to Celsius and print with one decimal place
# Expected output: "98.6°F = 37.0°C"

```

<details>
<summary>Click to reveal solution</summary>

```r
fahrenheit <- 98.6
celsius <- (fahrenheit - 32) * 5 / 9
cat(fahrenheit, "F =", round(celsius, 1), "C\n")
```

**Explanation:** Parentheses ensure subtraction happens before multiplication. `round(celsius, 1)` gives one decimal place.

</details>

### Exercise 4: String Assembly

Create a formatted greeting using variables and `paste()`.

```r
first_name <- "Ada"
last_name <- "Lovelace"
year <- 1843

# Create: "Hello, Ada Lovelace! You wrote the first program in 1843."
# Hint: use paste0() for no-space concatenation or paste() with sep=""

```

<details>
<summary>Click to reveal solution</summary>

```r
first_name <- "Ada"
last_name <- "Lovelace"
year <- 1843

greeting <- paste0("Hello, ", first_name, " ", last_name,
                    "! You wrote the first program in ", year, ".")
cat(greeting, "\n")
```

**Explanation:** `paste0()` concatenates strings with no separator. You can mix strings and numbers — R converts numbers to text automatically.

</details>

### Exercise 5: Mini Analysis

Given a vector of daily temperatures, compute the mean, range, and how many days were above 30 degrees.

```r
temps <- c(28, 32, 27, 35, 30, 33, 29, 31, 26, 34)

# 1. Calculate mean temperature
# 2. Calculate range (max - min)
# 3. Count days above 30
# Print a formatted summary

```

<details>
<summary>Click to reveal solution</summary>

```r
temps <- c(28, 32, 27, 35, 30, 33, 29, 31, 26, 34)

avg_temp <- mean(temps)
temp_range <- max(temps) - min(temps)
hot_days <- sum(temps > 30)

cat("=== Temperature Summary ===\n")
cat("Days recorded:", length(temps), "\n")
cat("Average:      ", round(avg_temp, 1), "C\n")
cat("Range:        ", temp_range, "C (", min(temps), "-", max(temps), ")\n")
cat("Days above 30:", hot_days, "\n")
```

**Explanation:** `sum(temps > 30)` counts TRUE values — each TRUE counts as 1. This is R's idiomatic way to count elements matching a condition.

</details>

## Summary

| Concept | Syntax | Example |
|---------|--------|---------|
| Arithmetic | `+ - * / ^ %% %/%` | `2 ^ 10` → 1024 |
| Comparison | `== != > < >= <=` | `5 == 5` → TRUE |
| Logical | `& \| !` | `TRUE & FALSE` → FALSE |
| Assignment | `<-` | `x <- 42` |
| Comments | `#` | `# This is ignored` |
| Strings | `"text"` or `'text'` | `name <- "Alice"` |
| Function call | `fn(args)` | `mean(c(1, 2, 3))` |
| Help | `?fn` | `?mean` |

## FAQ

### Why does R use <- instead of = for assignment?

Historical convention from the S language (R's predecessor). The `<-` operator makes the direction of assignment visually clear: "put this value into that name." All major R style guides (tidyverse, Google, Bioconductor) recommend `<-`. The `=` works at top level but can be ambiguous inside function calls where `=` means "set this argument."

### What's the difference between = and == ?

`=` is assignment (stores a value): `x = 5`. `==` is comparison (tests equality): `x == 5` returns TRUE or FALSE. Using `=` when you mean `==` is one of the most common R bugs — the code runs but does the wrong thing.

### How do I write multi-line comments in R?

R doesn't have block comments like `/* */` in C. Use multiple `#` lines. In RStudio, select lines and press `Ctrl+Shift+C` (Windows) or `Cmd+Shift+C` (Mac) to toggle comments on all selected lines at once.

### Is R case-sensitive?

Yes. `mean()` works, `Mean()` throws an error. `myVar` and `myvar` are two different variables. This applies to function names, variable names, and arguments.

### Can I use . and _ in variable names?

Yes. Both `my.variable` and `my_variable` are valid. The tidyverse style guide recommends `snake_case` (underscores). Some older R code uses dots, but dots have special meaning in S3 method dispatch (`print.data.frame`), so underscores are safer for your own variables.

## What's Next?

- [R Data Types](/R-Data-Types.html) — understand numeric, character, logical, and more
- [R Vectors](/R-Vectors.html) — the core data structure everything builds on
- [R Control Flow](/R-Control-Flow.html) — if/else, for loops, and while loops
