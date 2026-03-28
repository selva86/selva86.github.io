---
title: "R Syntax 101: Write Your First Working Script in 10 Minutes"
slug: R-Syntax-101-Write-Your-First-Working-Script
description: "Learn R syntax by building a real working script from scratch. Master variables, functions, conditionals, and loops — with interactive code you can run in your browser."
keywords: "R syntax, first R script, R tutorial beginners, learn R programming, R syntax basics, R variables, R functions, R for loop, R if else, write R script"
mathjax: false
date: 2026-03-28
category: Tutorial
---

# R Syntax 101: Write Your First Working Script in 10 Minutes

Most R tutorials dump a list of syntax rules on you and call it a day. This one is different. You'll build a real, working R script — a health metrics analyzer — from scratch. Along the way, you'll pick up every core syntax concept you need: variables, math, functions, conditionals, loops, and vectors.

Every code block below is **interactive**. Click **Run** to execute, edit to experiment, and **Reset** to restore the original.

## What You'll Build

By the end of this tutorial, you'll have a script that:

1. Stores a person's health data (height, weight, age)
2. Calculates their BMI
3. Classifies them into a health category
4. Processes multiple people at once
5. Prints a clean summary report

That's a real script doing real work — not just `print("Hello World")`. Let's go.

## Step 1: Print Output

Every programming journey starts with getting R to talk back to you. In R, you can print output two ways:

```r
# Just type an expression — R prints the result automatically
"Hello, R!"

# Or use print() explicitly
print("Welcome to R Syntax 101")
```

The `#` symbol marks a **comment** — R ignores everything after it. Use comments to explain *why* your code does something, not *what* it does.

`cat()` is another way to print, and it gives you more control over formatting:

```r
# cat() prints without the [1] prefix and supports special characters
cat("Name: Alice\n")
cat("Age:", 30, "\n")
cat("Status: Active\n")
```

The `\n` creates a new line. Use `print()` for quick debugging. Use `cat()` when you need clean, formatted output.

## Step 2: Variables and Assignment

A variable stores a value so you can reuse it later. In R, the assignment operator is `<-` (a left-arrow):

```r
# Store health data for one person
name <- "Alice"
height_m <- 1.68
weight_kg <- 62.5
age <- 29

# Print all variables
cat("Patient:", name, "\n")
cat("Height:", height_m, "m\n")
cat("Weight:", weight_kg, "kg\n")
cat("Age:", age, "years\n")
```

### Naming Rules

- Must start with a letter or a dot (`.`): `my_var`, `.hidden`
- Can contain letters, numbers, dots, and underscores: `weight_kg`, `var2`
- **Case-sensitive**: `Name` and `name` are different variables
- Cannot use reserved words: `if`, `else`, `for`, `TRUE`, `FALSE`, `function`, `NULL`

**Convention:** Use `snake_case` for variable names in R (e.g., `weight_kg`, `max_value`). It's the most common style in the R community.

### Why `<-` and Not `=`?

Both work for assignment, but `<-` is the R convention. The `=` sign is reserved for passing arguments inside functions. Stick with `<-` — it makes your code instantly recognizable as R.

```r
# Both work, but <- is preferred
x <- 10
y = 20

# Where = shines: inside function calls
cat("Sum:", x + y, sep = " ")
```

## Step 3: Data Types

R has five basic data types. You need to know them because they determine what operations you can perform:

```r
# Numeric (decimal numbers) — the default for all numbers
weight <- 62.5
class(weight)

# Integer (whole numbers) — add L to force integer
count <- 5L
class(count)

# Character (text strings)
name <- "Alice"
class(name)

# Logical (TRUE or FALSE)
is_active <- TRUE
class(is_active)

# Complex (rarely used)
z <- 3 + 2i
class(z)
```

Use `class()` to check a variable's type anytime. This is one of the most useful debugging tools in R.

### Type Checking and Conversion

```r
x <- "42"
cat("x is:", x, "\n")
cat("Type:", class(x), "\n")

# Convert string to number
x_num <- as.numeric(x)
cat("Converted:", x_num, "\n")
cat("New type:", class(x_num), "\n")

# Check type with is.* functions
cat("Is numeric?", is.numeric(x_num), "\n")
cat("Is character?", is.character(x), "\n")
```

## Step 4: Arithmetic and Math

R is a calculator on steroids. Here are all the arithmetic operators you'll use daily:

```r
# Basic arithmetic
cat("Addition:       5 + 3 =", 5 + 3, "\n")
cat("Subtraction:    10 - 4 =", 10 - 4, "\n")
cat("Multiplication: 7 * 6 =", 7 * 6, "\n")
cat("Division:       20 / 3 =", 20 / 3, "\n")
cat("Exponent:       2^10 =", 2^10, "\n")
cat("Integer div:    20 %/% 3 =", 20 %/% 3, "\n")
cat("Modulo:         20 %% 3 =", 20 %% 3, "\n")
```

Now let's put this to work. The BMI formula is: **weight (kg) / height (m)²**

```r
# Calculate BMI
height_m <- 1.68
weight_kg <- 62.5

bmi <- weight_kg / height_m^2

cat("Height:", height_m, "m\n")
cat("Weight:", weight_kg, "kg\n")
cat("BMI:", round(bmi, 1), "\n")
```

`round(bmi, 1)` rounds to one decimal place. R has many built-in math functions:

```r
# Useful math functions
cat("round(3.14159, 2):", round(3.14159, 2), "\n")
cat("ceiling(3.2):     ", ceiling(3.2), "\n")
cat("floor(3.8):       ", floor(3.8), "\n")
cat("abs(-7):          ", abs(-7), "\n")
cat("sqrt(144):        ", sqrt(144), "\n")
cat("log(100):         ", log(100), "(natural log)\n")
cat("log10(100):       ", log10(100), "(base-10 log)\n")
```

## Step 5: Vectors — R's Superpower

In most languages, you work with one value at a time. In R, you work with **vectors** — ordered collections of values. This is what makes R special for data work.

Create a vector with `c()` (short for "combine"):

```r
# A vector of heights (in meters)
heights <- c(1.68, 1.75, 1.60, 1.82, 1.55)
weights <- c(62.5, 78.0, 55.3, 90.1, 48.7)
names <- c("Alice", "Bob", "Carol", "Dave", "Eve")

cat("Heights:", heights, "\n")
cat("Weights:", weights, "\n")
cat("Names:", names, "\n")
```

The magic of vectors: **operations apply to every element at once**.

```r
heights <- c(1.68, 1.75, 1.60, 1.82, 1.55)
weights <- c(62.5, 78.0, 55.3, 90.1, 48.7)

# Calculate BMI for ALL five people in one line
bmi <- round(weights / heights^2, 1)
cat("BMI values:", bmi, "\n")

# Vector math — no loops needed
cat("Mean BMI:", round(mean(bmi), 1), "\n")
cat("Max BMI:", max(bmi), "\n")
cat("Min BMI:", min(bmi), "\n")
```

No loop. No iteration. One line calculates BMI for everyone. That's vectorization, and it's why R code is often shorter than equivalent Python or Java.

### Accessing Vector Elements

R uses **1-based indexing** — the first element is at position 1, not 0:

```r
names <- c("Alice", "Bob", "Carol", "Dave", "Eve")
bmi <- c(22.1, 25.5, 21.6, 27.2, 20.3)

# Single element
cat("First person:", names[1], "\n")
cat("Third BMI:", bmi[3], "\n")

# Multiple elements
cat("First three:", names[1:3], "\n")
cat("Specific:", names[c(1, 4, 5)], "\n")

# Logical filtering — get names where BMI > 25
cat("BMI > 25:", names[bmi > 25], "\n")
```

That last line is powerful: `bmi > 25` creates a logical vector (`FALSE, TRUE, FALSE, TRUE, FALSE`), and using it as an index selects only the matching elements.

## Step 6: Comparison and Logical Operators

You need comparisons to make decisions in your code:

```r
x <- 22.1

# Comparison operators
cat("x > 25: ", x > 25, "\n")
cat("x < 25: ", x < 25, "\n")
cat("x >= 22.1:", x >= 22.1, "\n")
cat("x <= 20: ", x <= 20, "\n")
cat("x == 22.1:", x == 22.1, "\n")
cat("x != 25: ", x != 25, "\n")
```

Combine comparisons with logical operators:

```r
bmi <- 22.1
age <- 29

# AND: both must be TRUE
cat("Healthy BMI AND under 30:", bmi < 25 & age < 30, "\n")

# OR: at least one must be TRUE
cat("High BMI OR over 60:", bmi > 30 | age > 60, "\n")

# NOT: flips TRUE/FALSE
cat("NOT overweight:", !(bmi > 25), "\n")
```

## Step 7: Conditionals — Making Decisions

Now let's classify BMI into health categories using `if` / `else if` / `else`:

```r
bmi <- 22.1

if (bmi < 18.5) {
  category <- "Underweight"
} else if (bmi < 25) {
  category <- "Normal weight"
} else if (bmi < 30) {
  category <- "Overweight"
} else {
  category <- "Obese"
}

cat("BMI:", bmi, "\n")
cat("Category:", category, "\n")
```

Try changing the `bmi` value and running again. The `{ }` braces group the code that belongs to each branch. The condition inside `( )` must evaluate to `TRUE` or `FALSE`.

### One-Line Conditionals with `ifelse()`

For simple either/or decisions, R has a vectorized `ifelse()` that works on entire vectors:

```r
bmi <- c(22.1, 25.5, 17.8, 27.2, 20.3)

# Classify all five at once
status <- ifelse(bmi < 25, "Healthy", "At risk")

cat("BMI:   ", bmi, "\n")
cat("Status:", status, "\n")
```

## Step 8: Functions — Reusable Code Blocks

A function packages code you want to use more than once. Here's the syntax:

```r
# Define a function
calculate_bmi <- function(weight_kg, height_m) {
  bmi <- weight_kg / height_m^2
  return(round(bmi, 1))
}

# Use it
cat("Alice's BMI:", calculate_bmi(62.5, 1.68), "\n")
cat("Bob's BMI:", calculate_bmi(78.0, 1.75), "\n")
cat("Carol's BMI:", calculate_bmi(55.3, 1.60), "\n")
```

Now let's build a more useful function that calculates BMI *and* returns the category:

```r
assess_health <- function(weight_kg, height_m) {
  bmi <- weight_kg / height_m^2

  if (bmi < 18.5) {
    category <- "Underweight"
  } else if (bmi < 25) {
    category <- "Normal weight"
  } else if (bmi < 30) {
    category <- "Overweight"
  } else {
    category <- "Obese"
  }

  return(list(bmi = round(bmi, 1), category = category))
}

# Use the function
result <- assess_health(62.5, 1.68)
cat("BMI:", result$bmi, "\n")
cat("Category:", result$category, "\n")
```

`list()` lets a function return multiple values. Access them with `$`.

### Default Arguments

Give parameters default values so callers can skip them:

```r
greet_patient <- function(name, greeting = "Hello") {
  cat(greeting, name, "- welcome to the clinic!\n")
}

greet_patient("Alice")
greet_patient("Bob", "Good morning")
```

## Step 9: Loops — Repeating Actions

A `for` loop repeats code for each element in a vector:

```r
names <- c("Alice", "Bob", "Carol")
weights <- c(62.5, 78.0, 55.3)
heights <- c(1.68, 1.75, 1.60)

for (i in 1:length(names)) {
  bmi <- round(weights[i] / heights[i]^2, 1)
  cat(names[i], "— BMI:", bmi, "\n")
}
```

`1:length(names)` generates the sequence `1, 2, 3`. The loop variable `i` takes each value in turn.

### While Loops

A `while` loop repeats as long as a condition is TRUE:

```r
# Simulate weight loss: lose 0.5 kg per week until target BMI
weight <- 85.0
height <- 1.75
target_bmi <- 25.0
week <- 0

while (weight / height^2 > target_bmi) {
  weight <- weight - 0.5
  week <- week + 1
}

cat("Reached target BMI in", week, "weeks\n")
cat("Final weight:", weight, "kg\n")
cat("Final BMI:", round(weight / height^2, 1), "\n")
```

**Important:** In practice, R programmers avoid loops when possible and use vectorized operations instead. Loops are slower and more verbose. But for sequential logic (like this simulation), they're the right tool.

## Step 10: Putting It All Together

Here's your complete health metrics analyzer — a real working R script using every concept from this tutorial:

```r
# ============================================
# Health Metrics Analyzer
# Your first complete R script!
# ============================================

# --- Data ---
names <- c("Alice", "Bob", "Carol", "Dave", "Eve")
heights <- c(1.68, 1.75, 1.60, 1.82, 1.55)
weights <- c(62.5, 78.0, 55.3, 90.1, 48.7)
ages <- c(29, 45, 34, 52, 23)

# --- Function ---
classify_bmi <- function(bmi) {
  if (bmi < 18.5) return("Underweight")
  if (bmi < 25.0) return("Normal")
  if (bmi < 30.0) return("Overweight")
  return("Obese")
}

# --- Calculate BMI (vectorized) ---
bmi <- round(weights / heights^2, 1)

# --- Generate report ---
cat("========================================\n")
cat("       HEALTH METRICS REPORT\n")
cat("========================================\n\n")

for (i in 1:length(names)) {
  category <- classify_bmi(bmi[i])
  flag <- ifelse(bmi[i] > 25, " ⚠", "")
  cat(sprintf("%-8s | Age: %2d | BMI: %4.1f | %s%s\n",
              names[i], ages[i], bmi[i], category, flag))
}

cat("\n========================================\n")
cat("SUMMARY\n")
cat("========================================\n")
cat("Total patients:", length(names), "\n")
cat("Average BMI:   ", round(mean(bmi), 1), "\n")
cat("Highest BMI:   ", max(bmi), "(", names[which.max(bmi)], ")\n")
cat("Lowest BMI:    ", min(bmi), "(", names[which.min(bmi)], ")\n")
cat("At risk (>25): ", sum(bmi > 25), "of", length(names), "\n")
```

Click **Run** to see the full report. Then try modifying the data — add a sixth person, change a weight, or adjust the BMI thresholds.

## R Syntax Cheat Sheet

Here's a quick reference for everything you learned:

| Concept | Syntax | Example |
|---------|--------|---------|
| Comment | `#` | `# This is a comment` |
| Assignment | `<-` | `x <- 10` |
| Print | `print()`, `cat()` | `cat("Hello\n")` |
| Data types | numeric, character, logical, integer | `class(x)` |
| Arithmetic | `+`, `-`, `*`, `/`, `^`, `%%`, `%/%` | `2^10` |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=` | `x > 5` |
| Logical | `&`, `|`, `!` | `x > 0 & x < 10` |
| Vector | `c()` | `c(1, 2, 3)` |
| Indexing | `[ ]` | `x[1]`, `x[1:3]` |
| Conditional | `if / else if / else` | `if (x > 0) { ... }` |
| Function | `function()` | `f <- function(x) { x^2 }` |
| For loop | `for (i in seq)` | `for (i in 1:10) { ... }` |
| While loop | `while (cond)` | `while (x > 0) { ... }` |

## Where to Go Next

You now know enough R syntax to read and write real scripts. Here are the natural next steps:

- **[Data frames](/R-Data-Frames.html)** — R's table structure for working with datasets
- **[Reading data](/Import-Data-Into-R.html)** — Load CSV, Excel, and database files
- **[dplyr](/Data-Wrangling-With-dplyr.html)** — Filter, sort, group, and summarize data with clean syntax
- **[ggplot2](/ggplot2-Tutorial-With-R.html)** — Create publication-quality plots and charts

## Conclusion

In this tutorial, you went from zero to a working R script in 10 steps. You learned how to print output, store values in variables, do math, work with vectors, make decisions with conditionals, package logic into functions, and repeat actions with loops. Most importantly, you saw how these pieces fit together into a real, useful script.

R's syntax is minimal by design — there are fewer rules to memorize than in most languages. The key is practice. Take the health metrics script above, modify it, break it, fix it, and extend it. That's how syntax becomes second nature.
