---
title: "R Basic Syntax: A Beginner's Complete Guide"
slug: R-Basic-Syntax-Beginners-Guide
description: "Learn R basic syntax from scratch — arithmetic, assignment, comments, variables, and your first R script with interactive runnable examples."
keywords: "R basic syntax, R arithmetic operators, R assignment, R comments, R variables, R first script, R tutorial beginners, learn R programming"
mathjax: false
date: 2026-03-28
category: Tutorial
---

# R Basic Syntax: A Beginner's Complete Guide

Think of R as a super-powered calculator that also speaks the language of data. Before you build machine learning models or create stunning visualizations, you need to learn how R "thinks." This guide teaches you R's basic syntax — from simple math to writing your first script — with interactive code you can run right here in your browser.

## Introduction

R is one of the most popular languages for statistics, data science, and machine learning. But every R journey starts with the basics: how to do math, how to store values, and how to write code that's clean and readable.

By the end of this guide, you will be able to:

- Use R as a powerful calculator
- Store and reuse values with variables
- Write clear, well-commented code
- Understand operator precedence (and avoid subtle bugs)
- Create and run your first R script

Every code block below is **interactive** — click **Run** to execute the code, edit it to experiment, and click **Reset** to restore the original.

## R as a Calculator

Open R and type a math expression. R gives you the answer instantly. Try it:

```r
# Addition
3 + 5

# Subtraction
10 - 4

# Multiplication
7 * 6

# Division
20 / 4
```

That's it. No `print()` needed, no semicolons — just type the math and R responds. The `[1]` you see before the answer means "this is the first element of the result." We'll explain why later when we cover vectors.

Now try the operators you might not have seen before:

```r
# Exponentiation (power): 2 raised to the power 10
2^10

# Modulus (remainder after division): What's left when 17 is divided by 5?
17 %% 5

# Integer division (quotient without remainder): How many full times does 5 go into 17?
17 %/% 5
```

**What just happened?**

- `2^10` calculates 2 multiplied by itself 10 times, giving 1024.
- `17 %% 5` gives the remainder: 17 = 5 x 3 + **2**, so the remainder is 2.
- `17 %/% 5` gives the whole number quotient: 5 goes into 17 exactly **3** full times.

The modulus (`%%`) operator is handy when you need to check if a number is even or odd, or when working with cyclical patterns.

Here's a quick reference of all arithmetic operators:

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraction | `10 - 4` | `6` |
| `*` | Multiplication | `7 * 6` | `42` |
| `/` | Division | `20 / 3` | `6.6667` |
| `^` | Exponentiation | `2^5` | `32` |
| `%%` | Modulus | `17 %% 5` | `2` |
| `%/%` | Integer Division | `17 %/% 5` | `3` |

## Operator Precedence: Why Order Matters

Just like in math class, R follows an order of operations. If you get this wrong, your calculations will silently give wrong answers — and that's one of the trickiest bugs to catch.

```r
# What does this give you? Think before you run it.
2 + 3 * 4
```

If you guessed 20 (doing left to right: 2+3=5, then 5*4=20), you'd be wrong. R follows **PEMDAS** — multiplication happens before addition. So it's 3*4=12, then 2+12=**14**.

Here's the precedence order from highest (first) to lowest (last):

1. `()` — Parentheses (always first)
2. `^` — Exponents
3. `%%`, `%/%` — Modulus, integer division
4. `*`, `/` — Multiplication, division
5. `+`, `-` — Addition, subtraction

When in doubt, use parentheses. They make your intent clear:

```r
# Without parentheses — ambiguous
2 + 3 * 4

# With parentheses — crystal clear
(2 + 3) * 4

# Another example: does this square 3 or negate 3-squared?
-3^2

# Answer: exponent first, then negate. So it's -(3^2) = -9
# If you want (-3) squared, use parentheses:
(-3)^2
```

**Key takeaway:** `-3^2` gives `-9`, not `9`. The exponent binds tighter than the minus sign. This catches many beginners off guard.

## Assignment: Storing Values in Variables

Doing math on the fly is nice, but real programs need to store values and reuse them. In R, you store a value in a variable using the **assignment operator** `<-`.

```r
# Store the value 42 in a variable called x
x <- 42

# Now x holds 42. Just type x to see its value:
x

# Use x in calculations
x + 8

x * 2
```

The `<-` arrow points from the value to the variable name: "take 42 and put it into x." Think of variables as labeled boxes — you put a value in, and you can take it out whenever you need it.

### Three Ways to Assign (and Which One to Use)

R actually has three assignment operators:

```r
# Method 1: Left arrow (RECOMMENDED)
name <- "Selva"

# Method 2: Equals sign (works, but not preferred)
age = 32

# Method 3: Right arrow (rarely used)
100 -> score

# All three work. Let's verify:
name
age
score
```

**Which should you use?** Use `<-` for assignment. Here's why:

- `<-` is the traditional R way, used in virtually all R documentation and packages
- `=` works for assignment but also means "set this argument" inside function calls — mixing them up causes confusion
- `->` is valid but reads unnaturally (value on the left, name on the right) and is rarely seen

> **Rule of thumb:** Use `<-` for assigning values. Use `=` only inside function arguments like `read.csv(file = "data.csv")`.

### Variables Update When You Reassign

```r
# Start with a value
savings <- 1000
savings

# Add to it
savings <- savings + 500
savings

# Reassign completely
savings <- 2500
savings
```

Notice that `savings <- savings + 500` reads the current value of `savings` (1000), adds 500, and stores the result (1500) back into `savings`. The old value is gone.

## Variables: Naming Rules and Conventions

Naming variables well is a skill. Here are R's rules and best practices.

### The Rules (must follow — or R throws an error)

```r
# VALID names
my_data <- 10
myData <- 20
data2 <- 30
.hidden <- 40  # starts with a dot — valid but "hidden"

# Show them all
my_data
myData
data2
.hidden
```

- Names can contain letters, numbers, dots (`.`), and underscores (`_`)
- Must start with a letter or a dot (not a number)
- Cannot start with a number or underscore
- Cannot use reserved words (`if`, `else`, `for`, `TRUE`, `FALSE`, `NULL`, etc.)

### R Is Case-Sensitive

This is a common source of bugs:

```r
# These are THREE different variables
myVar <- 1
myvar <- 2
MYVAR <- 3

myVar
myvar
MYVAR
```

`myVar`, `myvar`, and `MYVAR` are completely different variables. Always be consistent with your casing.

### Naming Conventions

Choose one style and stick with it:

| Style | Example | Used By |
|-------|---------|---------|
| snake_case | `my_data_frame` | tidyverse, most modern R code |
| camelCase | `myDataFrame` | Some base R users |
| dot.case | `my.data.frame` | Older R code, base R functions |

> **Recommendation:** Use **snake_case**. It's the most readable and the standard in the tidyverse ecosystem.

## Comments: Writing Code That Explains Itself

Comments are notes in your code that R ignores. They're for humans — including future you.

```r
# This is a comment. R skips it entirely.

x <- 42  # You can put comments at the end of a line too

# Good comments explain WHY, not WHAT
# Bad:  add 1 to x
# Good: adjust for zero-based indexing
x <- x + 1
x
```

R only has single-line comments using `#`. There's no multi-line comment syntax (unlike `/* ... */` in other languages). For multi-line notes, just use `#` on each line:

```r
# ============================================
# This script calculates monthly savings
# Author: Selva
# Date: 2026-03-28
# ============================================

income <- 5000
expenses <- 3200
savings <- income - expenses
savings
```

**Comment best practices:**

- Comment the *why*, not the *what* — `x <- x + 1` doesn't need "add 1 to x"
- Use header comments to separate sections of your script
- Don't over-comment obvious code
- Do comment any tricky logic, workarounds, or business rules

## Built-in Math Functions

R comes with a rich set of mathematical functions. No packages needed.

```r
# Square root
sqrt(144)

# Absolute value (removes the negative sign)
abs(-25)

# Round to 2 decimal places
round(3.14159, 2)

# Round up and round down
ceiling(4.2)   # always rounds UP to the nearest integer
floor(4.9)     # always rounds DOWN to the nearest integer
```

**What happened?**

- `sqrt(144)` returns 12 because 12 x 12 = 144.
- `abs(-25)` strips the minus sign, giving 25.
- `round(3.14159, 2)` keeps 2 decimal places: 3.14.
- `ceiling(4.2)` rounds up to 5. `floor(4.9)` rounds down to 4.

More useful functions:

```r
# Natural logarithm (base e)
log(100)

# Log base 10
log10(100)

# Exponential: e raised to the power of 2
exp(2)

# Maximum and minimum
max(3, 7, 2, 9, 1)
min(3, 7, 2, 9, 1)

# Sum
sum(1, 2, 3, 4, 5)
```

Here's a quick reference:

| Function | What It Does | Example | Result |
|----------|-------------|---------|--------|
| `sqrt(x)` | Square root | `sqrt(81)` | `9` |
| `abs(x)` | Absolute value | `abs(-7)` | `7` |
| `round(x, n)` | Round to n decimals | `round(3.456, 1)` | `3.5` |
| `ceiling(x)` | Round up | `ceiling(2.1)` | `3` |
| `floor(x)` | Round down | `floor(2.9)` | `2` |
| `log(x)` | Natural log | `log(1)` | `0` |
| `log10(x)` | Log base 10 | `log10(1000)` | `3` |
| `exp(x)` | e^x | `exp(0)` | `1` |
| `max(...)` | Largest value | `max(3,7,1)` | `7` |
| `min(...)` | Smallest value | `min(3,7,1)` | `1` |
| `sum(...)` | Total | `sum(1:5)` | `15` |

## Vectors: Your First Data Structure

In R, a **vector** is a sequence of values of the same type. It's the most fundamental data structure — even a single number like `42` is actually a vector of length 1 (that's why R prints `[1]` before it!).

Create a vector with the `c()` function (short for "combine"):

```r
# A numeric vector
prices <- c(10, 20, 35, 50, 15)
prices

# A character vector
fruits <- c("apple", "banana", "cherry")
fruits

# A logical vector
passed <- c(TRUE, FALSE, TRUE, TRUE, FALSE)
passed
```

The magic of vectors is **vectorized operations** — apply math to the entire vector at once, without writing a loop:

```r
prices <- c(10, 20, 35, 50, 15)

# Add 5 to every price
prices + 5

# Apply a 10% discount to all prices
prices * 0.90

# Which prices are above 25?
prices > 25
```

**What happened?**

- `prices + 5` added 5 to **each** element: 15, 25, 40, 55, 20.
- `prices * 0.90` multiplied each by 0.9 (a 10% discount).
- `prices > 25` tested each element, returning `TRUE` or `FALSE` for each one.

This is one of R's superpowers — you don't need loops for element-wise operations. Vectorized code is both simpler and faster.

```r
# Useful vector functions
prices <- c(10, 20, 35, 50, 15)

length(prices)   # How many elements?
sum(prices)      # Total
mean(prices)     # Average
sort(prices)     # Sorted (ascending)
range(prices)    # Min and max
```

## Printing Output: print() vs cat()

When you type a variable name in the console, R automatically prints it. But inside scripts and functions, you sometimes need explicit printing.

```r
# In the console, just typing the name prints it:
x <- 42
x

# print() shows the value with its type information (the [1] prefix):
print(x)

# cat() prints raw text without [1] — good for messages:
cat("The answer is", x, "\n")
```

**When to use which:**

- **Just type the name** — in the console or at the end of a code block. Simplest.
- **`print()`** — inside loops, functions, or if-else blocks where R won't auto-print. Keeps the `[1]` prefix.
- **`cat()`** — when you want clean, formatted output. Good for user-facing messages. Use `"\n"` to add a newline.

```r
# print() vs cat() in action
name <- "R"
version <- 4.3

print(paste("Hello", name))     # prints with [1] and quotes
cat("Hello", name, "\n")        # prints clean, no quotes
cat("Version:", version, "\n")  # you can mix text and numbers
```

## Special Values in R

R has a few special values you'll encounter. Knowing them prevents confusion:

```r
# Infinity
1 / 0

# Negative infinity
-1 / 0

# Not a Number (undefined math)
0 / 0

# Check for special values
is.infinite(1/0)
is.nan(0/0)
```

| Value | Meaning | How You Get It |
|-------|---------|----------------|
| `Inf` | Positive infinity | `1/0` |
| `-Inf` | Negative infinity | `-1/0` |
| `NaN` | Not a Number | `0/0`, `Inf - Inf` |
| `NA` | Missing value | Common in datasets |
| `NULL` | Empty/nothing | Empty function returns |
| `TRUE` / `FALSE` | Logical values | Comparisons, conditions |

## Your First R Script

So far you've been running code one block at a time. In real work, you write an **R script** — a file with the `.R` extension that contains all your code. Here's how.

### Step 1: Create the Script

In RStudio: **File > New File > R Script** (or press Ctrl+Shift+N).

### Step 2: Write Your Code

Type this into the script editor. This mini-analysis calculates summary statistics for a set of exam scores:

```r
# ============================================
# My First R Script
# Analyzing student exam scores
# ============================================

# Input data: exam scores for 10 students
scores <- c(78, 92, 85, 63, 95, 71, 88, 76, 90, 82)

# Basic statistics
cat("=== Exam Score Analysis ===\n")
cat("Number of students:", length(scores), "\n")
cat("Average score:", mean(scores), "\n")
cat("Highest score:", max(scores), "\n")
cat("Lowest score:", min(scores), "\n")
cat("Score range:", max(scores) - min(scores), "\n")

# How many students scored above 80?
above_80 <- sum(scores > 80)
cat("Students scoring above 80:", above_80, "out of", length(scores), "\n")

# Pass rate (assuming 70 is passing)
pass_rate <- sum(scores >= 70) / length(scores) * 100
cat("Pass rate:", pass_rate, "%\n")
```

### Step 3: Save and Run

- **Save:** File > Save (or Ctrl+S). Name it `exam_analysis.R`.
- **Run all:** Click "Source" button, or press Ctrl+Shift+Enter.
- **Run one line:** Place cursor on a line and press Ctrl+Enter.

> **Tip:** Always save your script. The console is for quick experiments. The script is your permanent record.

## Common Mistakes (and How to Fix Them)

Every beginner hits these. Save yourself the debugging time:

### Mistake 1: Using `=` Instead of `==` for Comparison

```r
x <- 10

# WRONG: This assigns 5 to x (no comparison!)
# x = 5

# RIGHT: Use == to compare
x == 5
x == 10
```

### Mistake 2: Forgetting Quotes Around Strings

```r
# WRONG (R thinks hello is a variable name):
# greeting <- hello

# RIGHT:
greeting <- "hello"
greeting
```

### Mistake 3: Case Sensitivity Errors

```r
MyValue <- 100

# This will cause an error because the case doesn't match:
# myvalue  # Error: object 'myvalue' not found

# Must match exactly:
MyValue
```

### Mistake 4: Misunderstanding Operator Precedence

```r
# You want to average two numbers: (10 + 20) / 2
# WRONG: This divides 20 by 2, then adds 10
10 + 20 / 2

# RIGHT: Use parentheses
(10 + 20) / 2
```

## Putting It All Together

Let's combine everything in a real mini-project. You're tracking daily temperatures for a week and want basic statistics:

```r
# ============================================
# Weekly Temperature Analysis
# ============================================

# Daily temperatures (Celsius) for one week
days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
temps <- c(22, 25, 19, 28, 31, 27, 23)

# Summary statistics
avg_temp <- round(mean(temps), 1)
hottest <- max(temps)
coldest <- min(temps)
temp_range <- hottest - coldest

cat("=== Weekly Temperature Report ===\n")
cat("Average temperature:", avg_temp, "C\n")
cat("Hottest day:", days[which.max(temps)], "at", hottest, "C\n")
cat("Coldest day:", days[which.min(temps)], "at", coldest, "C\n")
cat("Temperature range:", temp_range, "C\n")

# Days above average
above_avg <- days[temps > avg_temp]
cat("Days above average:", paste(above_avg, collapse = ", "), "\n")

# Convert to Fahrenheit
temps_f <- round(temps * 9/5 + 32, 1)
cat("\nTemperatures in Fahrenheit:\n")
for (i in 1:length(days)) {
  cat(" ", days[i], ":", temps_f[i], "F\n")
}
```

This script uses almost everything you've learned: variables, arithmetic, vectors, assignment, functions, comments, and printing. Run it, then try changing the temperature values to see how the output changes.

## Summary

| Concept | Syntax | Example |
|---------|--------|---------|
| Addition | `+` | `3 + 5` → `8` |
| Subtraction | `-` | `10 - 4` → `6` |
| Multiplication | `*` | `7 * 6` → `42` |
| Division | `/` | `20 / 3` → `6.67` |
| Exponent | `^` | `2^5` → `32` |
| Modulus | `%%` | `17 %% 5` → `2` |
| Integer division | `%/%` | `17 %/% 5` → `3` |
| Assignment | `<-` | `x <- 42` |
| Comment | `#` | `# this is ignored` |
| Vector creation | `c()` | `c(1, 2, 3)` |
| Print (formatted) | `cat()` | `cat("Hi", x)` |
| Print (with type) | `print()` | `print(x)` |

## FAQ

**Q: Why does R use `<-` instead of `=` for assignment?**
R inherited `<-` from the S language (created in the 1970s). Back then, some keyboards had a dedicated `<-` key. Today it's tradition. Use `<-` for assignment and `=` inside function arguments to stay consistent with the R community.

**Q: Do I need RStudio to write R code?**
No. You can use any text editor (VS Code, Sublime, Notepad++) and run R from the command line. But RStudio is free and makes R development much easier with its integrated console, plots, help, and file browser.

**Q: What does `[1]` mean in the output?**
It's R's way of saying "the first element starts here." For short results, you always see `[1]`. For long vectors, R adds position markers like `[1]`, `[14]`, `[27]` at the start of each printed line so you can count elements.

**Q: Is R case-sensitive?**
Yes. `myVar`, `myvar`, and `MYVAR` are three different variables. Function names are also case-sensitive: `Mean()` will throw an error — the correct name is `mean()`.

**Q: What's the difference between `print()` and `cat()`?**
`print()` shows the R representation of an object (with `[1]` prefix and quotes around strings). `cat()` prints raw text with no extras — better for clean, human-readable output. Inside functions and loops, you need one of these because R doesn't auto-print.

## What's Next?

Now that you know R's basic syntax, explore these tutorials on r-statistics.co:

- [R Tutorial](R-Tutorial.html) — a comprehensive R programming guide
- [ggplot2 Tutorial](ggplot2-Tutorial-With-R.html) — create stunning visualizations
- [Linear Regression](Linear-Regression.html) — your first statistical model
