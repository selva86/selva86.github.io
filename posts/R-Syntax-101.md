---
title: "R Syntax 101: Write Your First Working Script in 10 Minutes"
slug: "R-Syntax-101"
description: "Learn R syntax in 10 minutes: variables, operators, functions, and comments. Write and run your first R script with interactive examples."
keywords: "R syntax, R script, R basics, R variables, R operators, R functions, R comments, R programming basics"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.4"
post_type: "C"
auto_link_terms: "R syntax|R script|R basics"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Syntax 101"
sidebar_order: 4
---

# R Syntax 101: Write Your First Working Script in 10 Minutes

<p class="lead">R syntax is how you tell R what to do. You create variables with <code>&lt;-</code>, call functions with parentheses, and chain operations together. This tutorial covers every syntax rule you need to start writing real R code.</p>

If you've installed R and RStudio, you're ready to write code. This tutorial teaches you R's core syntax — variables, operators, functions, comments, and how to combine them into a working script. Every concept includes an interactive code block you can run immediately.

## Introduction

Every programming language has syntax rules — the grammar that tells the computer how to interpret your commands. R's syntax is designed for data analysis, so it has some unique features:

- The `<-` arrow for assigning values (instead of `=` in most other languages)
- 1-based indexing (counting starts at 1, not 0)
- Built-in support for vectors and statistical functions
- The pipe operator (`|>`) for chaining operations

Don't worry if those sound unfamiliar. By the end of this tutorial, you'll understand all of them and have written a complete R script from scratch.

Here's what we'll cover:

- Comments — how to annotate your code
- Variables and assignment — storing values
- Data types — the kinds of values R understands
- Operators — math, comparison, and logic
- Functions — using R's built-in tools
- Writing a complete script

## Comments: Annotating Your Code

Comments are notes you write for yourself (and others) inside your code. R ignores everything after a `#` symbol on a line.

```r
# This is a comment — R ignores this entire line

x <- 10  # This is an inline comment — R runs x <- 10, ignores the rest

# Good practice: explain WHY, not WHAT
# Bad:  x <- 10  # assign 10 to x (obvious from the code)
# Good: x <- 10  # sample size for pilot study
```

Comments are essential for making your code readable. When you come back to a script after two weeks, comments remind you what you were thinking.

> **Rule of thumb:** If you had to think about *why* you wrote a line, add a comment. If the code is self-explanatory (`x <- 10`), skip the comment.

R does **not** have multi-line comments (no `/* */` like C or Python's triple quotes). To comment out multiple lines, select them in RStudio and press **Ctrl+Shift+C** — it adds `#` to each line.

## Variables and Assignment

A **variable** stores a value so you can use it later. In R, you create variables with the **assignment operator** `<-`:

```r
# Creating variables
name <- "Alice"
age <- 30
height <- 5.6
is_student <- TRUE

# Using variables
cat("Name:", name, "\n")
cat("Age:", age, "\n")
cat("Height:", height, "feet\n")
cat("Student:", is_student, "\n")

# Variables can be updated
age <- age + 1
cat("Next year:", age, "\n")
```

The `<-` arrow means "assign the value on the right to the name on the left." So `age <- 30` creates a variable called `age` and stores the number `30` in it.

### Why `<-` instead of `=`?

You *can* use `=` for assignment in R, and it works in most cases. But `<-` is the R convention for three reasons:

1. **Clarity** — `<-` visually shows direction: value flows into the name
2. **Tradition** — the R community uses `<-`, and consistency matters when reading others' code
3. **Edge cases** — in some contexts (function arguments), `=` means something different than assignment

Use `<-` for assignment. The RStudio shortcut is **Alt+-** (Windows/Linux) or **Option+-** (Mac) — it types `<-` with spaces automatically.

### Variable naming rules

| Rule | Valid | Invalid |
|------|-------|---------|
| Start with a letter or dot | `my_var`, `.hidden` | `1var`, `_var` |
| Use letters, numbers, dots, underscores | `data_2024`, `my.data` | `my-data`, `my data` |
| Case-sensitive | `Age` ≠ `age` | — |
| No reserved words | `my_if`, `data1` | `if`, `TRUE`, `function` |

**Best practice:** Use `snake_case` for variable names — all lowercase with underscores: `student_count`, `avg_score`, `file_path`. This is the tidyverse convention and makes code most readable.

## Data Types: What R Stores

Every value in R has a **type**. The four types you'll use most often are:

```r
# Numeric (decimal numbers) — the default for all numbers
price <- 19.99
count <- 42      # Even whole numbers are numeric by default
cat("price is", class(price), "\n")
cat("count is", class(count), "\n")

# Character (text strings) — always in quotes
greeting <- "Hello, World!"
city <- 'New York'    # Single or double quotes both work
cat("greeting is", class(greeting), "\n")

# Logical (TRUE or FALSE) — always uppercase
is_active <- TRUE
is_empty <- FALSE
cat("is_active is", class(is_active), "\n")

# Integer (whole numbers) — need an L suffix
year <- 2026L         # The L makes it an integer
cat("year is", class(year), "\n")
```

You can check any value's type with `class()`. Most of the time, R handles types automatically — you don't need to declare types like in Java or C. R just figures it out from the value you assign.

> **Key insight:** In R, even a single number is actually a vector of length 1. This is different from most other languages and is the reason R is so good at working with data — everything is built around collections of values.

## Operators: Math, Comparison, and Logic

### Arithmetic operators

R works as a calculator. Try these:

```r
# Basic arithmetic
cat("Addition:       5 + 3 =", 5 + 3, "\n")
cat("Subtraction:    10 - 4 =", 10 - 4, "\n")
cat("Multiplication: 6 * 7 =", 6 * 7, "\n")
cat("Division:       15 / 4 =", 15 / 4, "\n")
cat("Integer div:    15 %/% 4 =", 15 %/% 4, "\n")
cat("Remainder:      15 %% 4 =", 15 %% 4, "\n")
cat("Exponent:       2^10 =", 2^10, "\n")

# R follows standard math order of operations (PEMDAS)
result <- 2 + 3 * 4    # 14, not 20
cat("2 + 3 * 4 =", result, "\n")

result <- (2 + 3) * 4  # 20 — parentheses first
cat("(2 + 3) * 4 =", result, "\n")
```

Two operators might be unfamiliar: `%/%` (integer division — drops the decimal) and `%%` (modulo — gives the remainder). These are useful for tasks like checking if a number is even (`x %% 2 == 0`).

### Comparison operators

Comparison operators return `TRUE` or `FALSE`. They're essential for filtering data and making decisions:

```r
x <- 10

cat("x > 5:", x > 5, "\n")       # Greater than
cat("x < 5:", x < 5, "\n")       # Less than
cat("x >= 10:", x >= 10, "\n")   # Greater than or equal
cat("x <= 9:", x <= 9, "\n")     # Less than or equal
cat("x == 10:", x == 10, "\n")   # Equal to (double equals!)
cat("x != 5:", x != 5, "\n")     # Not equal to

# COMMON MISTAKE: = vs ==
# = is assignment (like <-)
# == is comparison (asking "are these equal?")
# Using = when you mean == is a frequent bug
```

The biggest trap for beginners: **`=` is assignment, `==` is comparison.** Writing `if (x = 5)` when you mean `if (x == 5)` is a common bug. R will actually warn you about this one.

### Logical operators

Logical operators combine TRUE/FALSE values:

```r
age <- 25
income <- 50000

# AND: both conditions must be true
cat("Age 20-30 AND income > 40k:",
    age >= 20 & age <= 30 & income > 40000, "\n")

# OR: at least one condition must be true
cat("Age < 20 OR income > 40k:",
    age < 20 | income > 40000, "\n")

# NOT: flip TRUE to FALSE
cat("NOT (age > 30):", !(age > 30), "\n")

# Combining conditions — very common in data filtering
is_eligible <- age >= 18 & age <= 65 & income > 30000
cat("Eligible:", is_eligible, "\n")
```

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `&` | AND | `TRUE & FALSE` | `FALSE` |
| `|` | OR | `TRUE | FALSE` | `TRUE` |
| `!` | NOT | `!TRUE` | `FALSE` |

These become crucial when you start filtering datasets: "show me all rows where age > 25 AND salary > 50000."

## Functions: R's Built-In Tools

A **function** takes inputs, does something, and returns an output. R has thousands of built-in functions. You call a function by typing its name followed by parentheses containing the **arguments**:

```r
# Basic functions
numbers <- c(12, 5, 8, 21, 3, 15, 7)

cat("Sum:", sum(numbers), "\n")
cat("Mean:", mean(numbers), "\n")
cat("Median:", median(numbers), "\n")
cat("Min:", min(numbers), "\n")
cat("Max:", max(numbers), "\n")
cat("Length:", length(numbers), "\n")
cat("Sorted:", sort(numbers), "\n")
cat("Std Dev:", round(sd(numbers), 2), "\n")
```

Let's break down the anatomy of a function call:

- `mean(numbers)` — `mean` is the function name, `numbers` is the argument
- `round(sd(numbers), 2)` — nested call: `sd(numbers)` runs first, then `round()` rounds the result to 2 decimal places
- `cat("Sum:", sum(numbers), "\n")` — `cat()` prints text, `\n` adds a newline

### Functions with multiple arguments

Many functions accept optional arguments that change their behavior:

```r
# round() — second argument controls decimal places
pi_value <- 3.14159265
cat("Default:", round(pi_value), "\n")       # 0 decimal places
cat("2 decimals:", round(pi_value, 2), "\n") # 3.14
cat("4 decimals:", round(pi_value, 4), "\n") # 3.1416

# seq() — generates a sequence of numbers
cat("By 1:", seq(1, 5), "\n")
cat("By 2:", seq(1, 10, by = 2), "\n")
cat("5 points:", seq(0, 1, length.out = 5), "\n")

# paste() — combines text
first <- "Jane"
last <- "Doe"
cat(paste(first, last), "\n")           # "Jane Doe" (space separator)
cat(paste0(first, last), "\n")          # "JaneDoe" (no separator)
cat(paste("Item", 1:3, sep = "-"), "\n") # "Item-1" "Item-2" "Item-3"
```

Notice how some arguments are **named** (`by = 2`, `length.out = 5`). Named arguments let you skip arguments or pass them in any order. Unnamed arguments must be in the right position.

### Getting help on functions

When you don't know what arguments a function accepts, use the `?` operator:

```r
# These open the help page (in RStudio, it appears in the Help tab)
# In your browser, the output shows the help summary

# The help() function and ? are equivalent
help(round)

# Show the arguments of a function
args(round)

# See working examples
example(round)
```

## The c() Function: Creating Vectors

The `c()` function (short for "combine") is one of the most important functions in R. It creates **vectors** — ordered collections of values:

```r
# Numeric vector
scores <- c(88, 92, 75, 95, 81)
cat("Scores:", scores, "\n")
cat("Average:", mean(scores), "\n")

# Character vector
fruits <- c("apple", "banana", "cherry")
cat("Fruits:", fruits, "\n")

# Logical vector
passed <- c(TRUE, TRUE, FALSE, TRUE, TRUE)
cat("Passed:", passed, "\n")
cat("Pass rate:", mean(passed) * 100, "%\n")  # TRUE=1, FALSE=0

# Combine vectors
more_scores <- c(scores, 67, 90)
cat("All scores:", more_scores, "\n")
```

A neat trick: `mean()` on a logical vector gives you the proportion of TRUE values. That's because R treats TRUE as 1 and FALSE as 0. So `mean(passed)` = 0.8 = 80% pass rate.

## Printing Output

R has several ways to display output. Here's when to use each:

```r
x <- 42
name <- "World"

# Method 1: Just type the variable name (simplest)
x       # Prints "42" (works in Console, not inside functions/loops)

# Method 2: print() — explicit printing
print(x)             # [1] 42
print(paste("Hello", name))  # [1] "Hello World"

# Method 3: cat() — clean output without [1] prefix
cat("Hello,", name, "\n")     # Hello, World
cat("x =", x, "\n")           # x = 42

# Method 4: paste() for building strings
message <- paste("The answer is", x)
cat(message, "\n")

# Method 5: sprintf() for formatted output (like C's printf)
cat(sprintf("Name: %s, Score: %d, GPA: %.2f\n", "Alice", 95, 3.87))
```

| Method | Best for | Adds `[1]`? | Adds newline? |
|--------|---------|------------|--------------|
| Variable name | Quick checks in Console | Yes | Yes |
| `print()` | Inside functions/loops | Yes | Yes |
| `cat()` | Clean output, combining values | No | Only with `\n` |
| `paste()` | Building strings to store/use | N/A | No |
| `sprintf()` | Formatted numbers/text | No | Only with `\n` |

## Writing a Complete Script

Let's put everything together into a real R script. In RStudio, you'd save this as a `.R` file and run it line by line with **Ctrl+Enter**:

```r
# ============================================
# My First R Script: Student Grade Analysis
# Author: Your Name
# Date: 2026-03-29
# ============================================

# --- 1. Define the data ---
students <- c("Alice", "Bob", "Carol", "David", "Eve")
scores <- c(92, 85, 78, 95, 88)
subject <- "Statistics"

# --- 2. Basic analysis ---
cat("=== Grade Report:", subject, "===\n\n")

avg_score <- mean(scores)
top_score <- max(scores)
low_score <- min(scores)
top_student <- students[which.max(scores)]

cat("Number of students:", length(students), "\n")
cat("Average score:", round(avg_score, 1), "\n")
cat("Highest score:", top_score, "(", top_student, ")\n")
cat("Lowest score:", low_score, "\n")
cat("Score range:", top_score - low_score, "\n\n")

# --- 3. Pass/fail assessment ---
passing_grade <- 80
passed <- scores >= passing_grade
pass_rate <- mean(passed) * 100

cat("Passing grade:", passing_grade, "\n")
cat("Students who passed:", sum(passed), "of", length(students), "\n")
cat("Pass rate:", pass_rate, "%\n\n")

# --- 4. Individual results ---
cat("--- Individual Results ---\n")
for (i in 1:length(students)) {
  status <- if (scores[i] >= passing_grade) "PASS" else "FAIL"
  cat(sprintf("  %s: %d (%s)\n", students[i], scores[i], status))
}
```

This script demonstrates everything you've learned: variables, vectors, arithmetic, comparison operators, functions, `cat()` for output, `sprintf()` for formatting, and even a `for` loop (which we'll cover in detail in a later tutorial).

## Practice Exercises

### Exercise 1: Variable Basics

Create variables for a product and calculate the total cost:

```r
# Exercise: Create these variables and calculate the total
# - product_name: "Widget" (character)
# - unit_price: 12.50 (numeric)
# - quantity: 8 (numeric)
# - tax_rate: 0.08 (numeric, representing 8%)
# Calculate: subtotal, tax_amount, and total
# Print: "8 Widgets @ $12.50 = $108.00 (including $8.00 tax)"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
product_name <- "Widget"
unit_price <- 12.50
quantity <- 8
tax_rate <- 0.08

subtotal <- unit_price * quantity
tax_amount <- subtotal * tax_rate
total <- subtotal + tax_amount

cat(sprintf("%d %ss @ $%.2f = $%.2f (including $%.2f tax)\n",
    quantity, product_name, unit_price, total, tax_amount))
```

**Explanation:** `sprintf()` uses format codes: `%d` for integers, `%s` for strings, `%.2f` for numbers with 2 decimal places. The `\n` adds a newline.

</details>

### Exercise 2: Comparison and Logic

Determine if a student qualifies for honors:

```r
# Exercise: A student qualifies for honors if:
# - GPA is 3.5 or higher, AND
# - attendance is 90% or higher, AND
# - has no disciplinary actions (is_clean = TRUE)
#
# Create variables for two students and check if each qualifies:
# Student A: GPA 3.8, attendance 95%, clean record
# Student B: GPA 3.6, attendance 85%, clean record
#
# Print whether each qualifies

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
# Student A
gpa_a <- 3.8
attendance_a <- 95
clean_a <- TRUE
honors_a <- gpa_a >= 3.5 & attendance_a >= 90 & clean_a

# Student B
gpa_b <- 3.6
attendance_b <- 85
clean_b <- TRUE
honors_b <- gpa_b >= 3.5 & attendance_b >= 90 & clean_b

cat("Student A qualifies for honors:", honors_a, "\n")
cat("Student B qualifies for honors:", honors_b, "\n")

# Student B fails because attendance (85%) is below 90%
```

**Explanation:** The `&` operator requires ALL conditions to be TRUE. Student B has a good GPA and clean record, but attendance is 85% — below the 90% threshold — so the result is FALSE.

</details>

### Exercise 3: Functions and Vectors

Analyze a dataset of temperatures:

```r
# Exercise: Given daily temperatures for a week (in Fahrenheit):
# temps_f <- c(72, 68, 75, 80, 77, 65, 71)
#
# 1. Convert all temps to Celsius: C = (F - 32) * 5/9
# 2. Find the hottest and coldest days
# 3. Calculate the average temperature in both F and C
# 4. Count how many days were above 73°F
# Hint: R math works on entire vectors at once!

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
temps_f <- c(72, 68, 75, 80, 77, 65, 71)
days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

# Convert to Celsius (works on the entire vector at once!)
temps_c <- round((temps_f - 32) * 5/9, 1)

cat("Daily temperatures:\n")
for (i in 1:7) {
  cat(sprintf("  %s: %d°F / %.1f°C\n", days[i], temps_f[i], temps_c[i]))
}

cat("\nHottest day:", days[which.max(temps_f)], "-", max(temps_f), "°F\n")
cat("Coldest day:", days[which.min(temps_f)], "-", min(temps_f), "°F\n")
cat("Average (F):", round(mean(temps_f), 1), "°F\n")
cat("Average (C):", round(mean(temps_c), 1), "°C\n")
cat("Days above 73°F:", sum(temps_f > 73), "of 7\n")
```

**Explanation:** The key insight is that `(temps_f - 32) * 5/9` converts ALL temperatures at once — R automatically applies math to every element in a vector. Similarly, `temps_f > 73` returns a logical vector, and `sum()` counts the TRUEs.

</details>

## Summary

Here's a quick reference for everything you learned:

| Concept | Syntax | Example |
|---------|--------|---------|
| Comment | `# text` | `# This is a comment` |
| Assignment | `<-` | `x <- 42` |
| Numeric | bare number | `3.14` |
| Character | quotes | `"hello"` |
| Logical | TRUE/FALSE | `TRUE` |
| Arithmetic | `+ - * / ^ %% %/%` | `2 + 3 * 4` |
| Comparison | `== != > < >= <=` | `x >= 10` |
| Logical | `& | !` | `a > 0 & b > 0` |
| Function call | `name(args)` | `mean(x)` |
| Create vector | `c()` | `c(1, 2, 3)` |
| Print (clean) | `cat()` | `cat("Hi\n")` |
| Get help | `?name` | `?mean` |

## FAQ

### Why does R use `<-` instead of `=` for assignment?

Historical reasons — R inherited `<-` from the S language (1976), which was inspired by APL where a left-arrow key existed on keyboards. Today, `=` works for assignment in most situations, but `<-` is the community convention. Use `<-` to follow R style guides and avoid rare edge-case bugs.

### What does `[1]` mean in R output?

It's an index label. When R prints a result, `[1]` means "the first element starts here." For long vectors, you'll see `[1]`, `[14]`, `[27]`, etc. — telling you which position each row starts at. It's informational; you don't need to type it.

### Can I use spaces around `<-` and operators?

Yes, and you should. `x <- 10` is much more readable than `x<-10`. R ignores whitespace around operators. The standard style guide recommends spaces around `<-`, `=`, `+`, `-`, `*`, `/`, and all comparison operators.

### What happens if I type a variable name wrong?

R throws an error: `Error: object 'misspelled_name' not found`. This is the most common R error for beginners. Check your spelling and capitalization — R is case-sensitive (`myVar` ≠ `myvar`).

### Can I run R code without RStudio?

Yes. You can run R from the command line by typing `R` (starts an interactive session) or `Rscript myfile.R` (runs a script file). However, RStudio makes everything easier — especially viewing plots, managing files, and debugging errors.

## What's Next?

You now know the fundamental syntax of R. The next tutorials dive deeper into R's core data structures:

1. **R Data Types** — understand the six types and why they matter for data analysis
2. **R Vectors** — master the most important data structure in R
3. **R Data Frames** — work with tabular data (rows and columns)

Each tutorial builds on what you've learned here, and all include interactive code blocks for hands-on practice.
