---
title: "R Basics Exercises: 15 Practice Problems for Beginners (With Solutions)"
slug: "R-Basics-Exercises"
description: "Practice R fundamentals with 15 exercises: variables, operators, functions, vectors, and type conversions. Each problem has an interactive solution."
keywords: "R exercises, R practice problems, R beginner exercises, R programming exercises, learn R exercises, R practice"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.1"
post_type: "EX"
auto_link_terms: "R exercises|R practice problems|R beginner exercises"
auto_link_case_sensitive: false
fr_parent: "R-Syntax-101.html"
---

# R Basics Exercises: 15 Practice Problems for Beginners (With Solutions)

<p class="lead">The best way to learn R is to write R. These 15 exercises cover variables, operators, functions, vectors, and type conversions — everything from the R Syntax 101 tutorial. Each problem has an interactive code block where you write your solution, plus a collapsible answer.</p>

Try each exercise yourself before looking at the solution. Writing code from scratch — even struggling with it — builds muscle memory that reading alone can't.

## How to Use These Exercises

1. Read the problem description
2. Write your solution in the interactive code block
3. Click **Run** to test it
4. If stuck, check the hint
5. Compare with the solution (click to reveal)

Exercises are grouped by difficulty: **Easy** (1-5), **Medium** (6-10), **Hard** (11-15).

## Easy (1-5): Variables and Basic Operations

### Exercise 1: Variable Assignment

Create three variables: `name` (your name as text), `age` (your age as a number), and `is_student` (TRUE or FALSE). Print all three using `cat()`.

```r
# Exercise 1: Create and print three variables
# Expected output (example):
# Name: Alice
# Age: 25
# Student: TRUE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
name <- "Alice"
age <- 25
is_student <- TRUE

cat("Name:", name, "\n")
cat("Age:", age, "\n")
cat("Student:", is_student, "\n")
```

**Key concept:** Use `<-` for assignment. Character values need quotes. Logical values are `TRUE`/`FALSE` (uppercase, no quotes).

</details>

### Exercise 2: Arithmetic Calculator

A pizza costs $12.99 and you're ordering for 7 people. Calculate: the subtotal, the tax (8.5%), the tip (18% of subtotal), and the total. Print each value rounded to 2 decimal places.

```r
# Exercise 2: Pizza order calculator
# Pizza price: $12.99 per person
# People: 7
# Tax rate: 8.5%
# Tip: 18% of subtotal (before tax)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
price <- 12.99
people <- 7
tax_rate <- 0.085
tip_rate <- 0.18

subtotal <- price * people
tax <- subtotal * tax_rate
tip <- subtotal * tip_rate
total <- subtotal + tax + tip

cat("Subtotal: $", round(subtotal, 2), "\n")
cat("Tax:      $", round(tax, 2), "\n")
cat("Tip:      $", round(tip, 2), "\n")
cat("Total:    $", round(total, 2), "\n")
cat("Per person: $", round(total / people, 2), "\n")
```

**Key concept:** Store values in variables, then compute from variables. `round(x, 2)` gives 2 decimal places.

</details>

### Exercise 3: Comparison Operators

Given `temperature <- 72`, write expressions that check: Is it above 80? Is it between 60 and 80 (inclusive)? Is it exactly 72? Is it NOT equal to 100?

```r
# Exercise 3: Temperature checks
temperature <- 72

# Write 4 comparisons and print results:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
temperature <- 72

cat("Above 80:", temperature > 80, "\n")
cat("Between 60-80:", temperature >= 60 & temperature <= 80, "\n")
cat("Exactly 72:", temperature == 72, "\n")
cat("Not 100:", temperature != 100, "\n")
```

**Key concept:** `==` for equality (not `=`). `&` for AND. Use `>=` and `<=` for inclusive ranges.

</details>

### Exercise 4: Built-in Functions

Given `numbers <- c(23, 7, 45, 12, 89, 34, 56)`, use built-in functions to find: the count, sum, mean, min, max, and sorted order.

```r
# Exercise 4: Use built-in functions
numbers <- c(23, 7, 45, 12, 89, 34, 56)

# Find and print: count, sum, mean, min, max, sorted

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
numbers <- c(23, 7, 45, 12, 89, 34, 56)

cat("Count:", length(numbers), "\n")
cat("Sum:", sum(numbers), "\n")
cat("Mean:", round(mean(numbers), 2), "\n")
cat("Min:", min(numbers), "\n")
cat("Max:", max(numbers), "\n")
cat("Sorted:", sort(numbers), "\n")
cat("Sorted (desc):", sort(numbers, decreasing = TRUE), "\n")
```

**Key concept:** R has built-in functions for all common statistics. `length()` counts elements, not `count()` or `len()`.

</details>

### Exercise 5: String Operations

Create a first name and last name variable. Combine them into a full name using `paste()`. Then print the full name in uppercase and its character count.

```r
# Exercise 5: String operations
# Create first_name and last_name
# Combine into full_name
# Print uppercase version and character count

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
first_name <- "Jane"
last_name <- "Doe"
full_name <- paste(first_name, last_name)

cat("Full name:", full_name, "\n")
cat("Uppercase:", toupper(full_name), "\n")
cat("Characters:", nchar(full_name), "\n")

# Bonus: paste0 (no space separator)
username <- paste0(tolower(first_name), ".", tolower(last_name))
cat("Username:", username, "\n")
```

**Key concept:** `paste()` joins strings with a space. `paste0()` joins with no separator. `nchar()` counts characters (including spaces).

</details>

## Medium (6-10): Vectors and Logic

### Exercise 6: Vector Filtering

Given exam scores, find: how many students passed (score >= 70), the average of passing scores, and the names of failing students.

```r
# Exercise 6: Exam score analysis
students <- c("Alice", "Bob", "Carol", "David", "Eve", "Frank")
scores <- c(85, 62, 91, 58, 77, 44)

# 1. How many passed (>= 70)?
# 2. Average of passing scores?
# 3. Names of failing students?

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
students <- c("Alice", "Bob", "Carol", "David", "Eve", "Frank")
scores <- c(85, 62, 91, 58, 77, 44)

passed <- scores >= 70
cat("Passed:", sum(passed), "of", length(scores), "\n")
cat("Pass rate:", round(mean(passed) * 100, 1), "%\n")
cat("Average passing score:", round(mean(scores[passed]), 1), "\n")
cat("Failing students:", students[!passed], "\n")
cat("Their scores:", scores[!passed], "\n")
```

**Key concept:** `scores >= 70` creates a logical vector. Use it to filter both `scores` and `students`. `!passed` flips TRUE↔FALSE.

</details>

### Exercise 7: Sequence Generation

Create these sequences without typing every number:
1. 1 to 20
2. Even numbers from 2 to 20
3. 5, 10, 15, ..., 100
4. 1 repeated 10 times
5. The pattern 1, 2, 3, 1, 2, 3, 1, 2, 3

```r
# Exercise 7: Create sequences efficiently
# Don't type out every number — use :, seq(), and rep()

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
cat("1 to 20:", 1:20, "\n\n")
cat("Even 2-20:", seq(2, 20, by = 2), "\n\n")
cat("5 to 100 by 5:", seq(5, 100, by = 5), "\n\n")
cat("1 repeated 10x:", rep(1, 10), "\n\n")
cat("1,2,3 pattern:", rep(1:3, times = 3), "\n")
```

**Key concept:** `:` for simple integer sequences. `seq()` for custom step sizes. `rep()` for repetition — `times` repeats the whole vector, `each` repeats each element.

</details>

### Exercise 8: Named Vectors as Lookup Tables

Create a named vector mapping country codes to country names (US, UK, DE, JP, BR). Then look up the full name for "DE" and "JP".

```r
# Exercise 8: Country code lookup
# Create a named vector: codes → full names
# Look up "DE" and "JP"

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
countries <- c(
  US = "United States",
  UK = "United Kingdom",
  DE = "Germany",
  JP = "Japan",
  BR = "Brazil"
)

cat("DE:", countries["DE"], "\n")
cat("JP:", countries["JP"], "\n")

# Bonus: look up multiple at once
codes_to_find <- c("US", "BR", "JP")
cat("Multiple:", countries[codes_to_find], "\n")
```

**Key concept:** Named vectors work as key-value lookup tables. `countries["DE"]` returns the value associated with the name "DE".

</details>

### Exercise 9: Type Detective

Predict the type of each value, then verify with `class()`. Some are tricky!

```r
# Exercise 9: Predict the type, then verify
a <- 42
b <- 42L
c <- "42"
d <- TRUE
e <- 4 + 2i
f <- c(1, 2, "3")
g <- c(TRUE, FALSE, 0)

# Predict each type, then uncomment to check:
# cat("a:", class(a), "\n")
# cat("b:", class(b), "\n")
# cat("c:", class(c), "\n")
# cat("d:", class(d), "\n")
# cat("e:", class(e), "\n")
# cat("f:", class(f), "\n")
# cat("g:", class(g), "\n")

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
a <- 42          # numeric (not integer — no L)
b <- 42L         # integer (L suffix)
c <- "42"        # character (quotes)
d <- TRUE        # logical
e <- 4 + 2i      # complex
f <- c(1, 2, "3") # character (coercion: string wins)
g <- c(TRUE, FALSE, 0) # numeric (coercion: numeric wins over logical)

cat("a (42):", class(a), "\n")
cat("b (42L):", class(b), "\n")
cat("c ('42'):", class(c), "\n")
cat("d (TRUE):", class(d), "\n")
cat("e (4+2i):", class(e), "\n")
cat("f (1,2,'3'):", class(f), "← string coerces everything\n")
cat("g (T,F,0):", class(g), "← numeric coerces logical\n")
```

**Key concept:** When mixing types in `c()`, R coerces to the most flexible: logical → integer → numeric → character.

</details>

### Exercise 10: Vector Math

Convert temperatures from Fahrenheit to Celsius for an entire week, then find the hottest and coldest days.

```r
# Exercise 10: Temperature conversion
days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
temps_f <- c(72, 68, 75, 80, 85, 70, 65)

# 1. Convert to Celsius: C = (F - 32) * 5/9
# 2. Find hottest and coldest day (by name)
# 3. How many days were above 25°C?

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
temps_f <- c(72, 68, 75, 80, 85, 70, 65)

# 1. Vectorized conversion (no loop needed!)
temps_c <- round((temps_f - 32) * 5/9, 1)
names(temps_c) <- days

cat("Fahrenheit:", temps_f, "\n")
cat("Celsius:   ", temps_c, "\n\n")

# 2. Hottest and coldest
cat("Hottest:", days[which.max(temps_c)], "at", max(temps_c), "°C\n")
cat("Coldest:", days[which.min(temps_c)], "at", min(temps_c), "°C\n\n")

# 3. Days above 25°C
above_25 <- temps_c > 25
cat("Days above 25°C:", sum(above_25), "\n")
cat("Which days:", days[above_25], "\n")
```

**Key concept:** `(temps_f - 32) * 5/9` converts ALL temperatures at once — R applies math to every vector element automatically.

</details>

## Hard (11-15): Combined Skills

### Exercise 11: Grade Calculator Function

Write a function that takes a numeric score (0-100) and returns a letter grade: A (90+), B (80+), C (70+), D (60+), F (<60). Test it on a vector of scores.

```r
# Exercise 11: Grade calculator
# Write a function get_grade(score) that returns "A", "B", "C", "D", or "F"
# Then apply it to: scores <- c(95, 82, 73, 61, 55, 88, 77, 100, 42, 90)

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
get_grade <- function(score) {
  ifelse(score >= 90, "A",
  ifelse(score >= 80, "B",
  ifelse(score >= 70, "C",
  ifelse(score >= 60, "D", "F"))))
}

scores <- c(95, 82, 73, 61, 55, 88, 77, 100, 42, 90)
grades <- get_grade(scores)

# Results
cat("Scores:", scores, "\n")
cat("Grades:", grades, "\n\n")

# Summary
cat("Grade distribution:\n")
print(table(grades))
cat("\nAverage score:", round(mean(scores), 1), "\n")
cat("Pass rate (D or above):", round(mean(scores >= 60) * 100, 1), "%\n")
```

**Key concept:** `ifelse()` is vectorized — it works on entire vectors. Nesting `ifelse()` handles multiple conditions. `table()` counts occurrences.

</details>

### Exercise 12: Data Cleaning Challenge

A dataset has messy price values. Clean them and compute statistics.

```r
# Exercise 12: Clean messy price data
prices_raw <- c("$24.99", "$8.50", "N/A", "$15.00", "$42", "missing", "$7.99", "$31.50")

# 1. Remove "$" from all values
# 2. Replace "N/A" and "missing" with NA
# 3. Convert to numeric
# 4. Calculate mean, median, and count of valid prices
# Hint: gsub() removes characters, as.numeric() converts

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
prices_raw <- c("$24.99", "$8.50", "N/A", "$15.00", "$42", "missing", "$7.99", "$31.50")

# Step 1: Remove $
step1 <- gsub("\\$", "", prices_raw)
cat("After removing $:", step1, "\n")

# Step 2: Replace text NA values with real NA
step2 <- ifelse(step1 %in% c("N/A", "missing"), NA, step1)
cat("After NA handling:", step2, "\n")

# Step 3: Convert to numeric
prices <- as.numeric(step2)
cat("Numeric:", prices, "\n\n")

# Step 4: Statistics
cat("Valid prices:", sum(!is.na(prices)), "of", length(prices), "\n")
cat("Mean: $", round(mean(prices, na.rm = TRUE), 2), "\n")
cat("Median: $", round(median(prices, na.rm = TRUE), 2), "\n")
cat("Total: $", round(sum(prices, na.rm = TRUE), 2), "\n")
```

**Key concept:** `gsub("\\$", "", x)` removes dollar signs (`$` is special in regex, so escape with `\\`). `%in%` checks membership. `na.rm = TRUE` ignores NAs in calculations.

</details>

### Exercise 13: BMI Calculator with Validation

Write a BMI calculator function that validates inputs, handles edge cases, and categorizes the result.

```r
# Exercise 13: BMI calculator
# Write bmi_report(weight_kg, height_m) that:
# 1. Validates: both must be positive numbers
# 2. Calculates BMI = weight / height^2
# 3. Categorizes: Underweight(<18.5), Normal(18.5-24.9), Overweight(25-29.9), Obese(30+)
# 4. Returns a formatted message
# Test: bmi_report(70, 1.75), bmi_report(95, 1.80), bmi_report(-5, 1.70)

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
bmi_report <- function(weight_kg, height_m) {
  # Validate
  if (!is.numeric(weight_kg) || !is.numeric(height_m)) {
    return("Error: weight and height must be numbers")
  }
  if (weight_kg <= 0 || height_m <= 0) {
    return("Error: weight and height must be positive")
  }
  if (height_m > 3) {
    return("Warning: height seems too large. Did you use cm instead of m?")
  }

  # Calculate
  bmi <- weight_kg / height_m^2

  # Categorize
  category <- ifelse(bmi < 18.5, "Underweight",
              ifelse(bmi < 25, "Normal weight",
              ifelse(bmi < 30, "Overweight", "Obese")))

  # Report
  sprintf("Weight: %.1f kg | Height: %.2f m | BMI: %.1f (%s)",
          weight_kg, height_m, round(bmi, 1), category)
}

cat(bmi_report(70, 1.75), "\n")
cat(bmi_report(95, 1.80), "\n")
cat(bmi_report(50, 1.65), "\n")
cat(bmi_report(-5, 1.70), "\n")
cat(bmi_report(70, 175), "\n")
```

**Key concept:** Good functions validate inputs before computing. `sprintf()` creates formatted strings. `return()` for early exits on errors.

</details>

### Exercise 14: Fibonacci Generator

Write a function that generates the first n Fibonacci numbers. Use a pre-allocated vector (not growing with `c()`).

```r
# Exercise 14: Fibonacci sequence
# Write fibonacci(n) that returns the first n Fibonacci numbers
# Rules: F(1)=1, F(2)=1, F(n) = F(n-1) + F(n-2)
# Use pre-allocation for efficiency
# Test: fibonacci(10) should give: 1 1 2 3 5 8 13 21 34 55

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
fibonacci <- function(n) {
  if (n <= 0) return(integer(0))
  if (n == 1) return(1)

  # Pre-allocate (important for large n!)
  fib <- numeric(n)
  fib[1:2] <- 1

  for (i in 3:n) {
    fib[i] <- fib[i-1] + fib[i-2]
  }
  return(fib)
}

cat("First 10:", fibonacci(10), "\n")
cat("First 20:", fibonacci(20), "\n")
cat("F(30):", fibonacci(30)[30], "\n")

# Bonus: verify the golden ratio
fib20 <- fibonacci(20)
ratios <- fib20[-1] / fib20[-length(fib20)]
cat("Ratio converges to golden ratio:", round(tail(ratios, 1), 6), "\n")
cat("Actual golden ratio:", round((1 + sqrt(5))/2, 6), "\n")
```

**Key concept:** Pre-allocate with `numeric(n)` instead of growing with `c()`. Edge cases (n=0, n=1) need special handling. Fibonacci ratios converge to the golden ratio (1.618...).

</details>

### Exercise 15: Mini Data Analysis

Perform a complete analysis on this dataset: find summary statistics, identify outliers, and create a report.

```r
# Exercise 15: Complete data analysis
# Daily step counts for a month (30 days)
set.seed(42)
steps <- c(round(rnorm(25, mean = 8000, sd = 2500)),
           NA, 450, 25000, NA, 15)

# 1. Basic stats (handle NAs)
# 2. How many NAs? What percentage?
# 3. Find outliers (values < 1000 or > 20000 are likely errors)
# 4. Replace outliers with NA
# 5. Report: mean, median, days above 10000, most active day

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
set.seed(42)
steps <- c(round(rnorm(25, mean = 8000, sd = 2500)),
           NA, 450, 25000, NA, 15)

cat("=== Raw Data Report ===\n")
cat("Days:", length(steps), "\n")
cat("NAs:", sum(is.na(steps)), "(", round(mean(is.na(steps))*100, 1), "%)\n")
cat("Raw mean:", round(mean(steps, na.rm = TRUE), 0), "\n\n")

# Find outliers
outliers <- !is.na(steps) & (steps < 1000 | steps > 20000)
cat("Outliers found:", sum(outliers), "\n")
cat("Outlier values:", steps[outliers], "\n\n")

# Clean: replace outliers with NA
clean_steps <- steps
clean_steps[outliers] <- NA

# Final report
valid <- clean_steps[!is.na(clean_steps)]
cat("=== Clean Data Report ===\n")
cat("Valid days:", length(valid), "of", length(steps), "\n")
cat("Mean steps:", round(mean(valid), 0), "\n")
cat("Median steps:", round(median(valid), 0), "\n")
cat("Std dev:", round(sd(valid), 0), "\n")
cat("Days above 10k:", sum(valid > 10000), "\n")
cat("Most active day:", max(valid), "steps (day",
    which.max(clean_steps), ")\n")
cat("Least active day:", min(valid), "steps (day",
    which.min(clean_steps), ")\n")
```

**Key concept:** Real data analysis workflow: explore → identify problems → clean → analyze. Always handle NAs with `na.rm = TRUE`. Define outlier rules clearly. Report both raw and cleaned statistics.

</details>

## Summary: What You Practiced

| Exercises | Skills Covered |
|-----------|---------------|
| 1-5 (Easy) | Variables, arithmetic, comparisons, functions, strings |
| 6-10 (Medium) | Vector filtering, sequences, named vectors, types, vectorized math |
| 11-15 (Hard) | Functions, data cleaning, validation, loops, complete analysis |

**If you got 1-5 right:** You've got the basics. Move on to R Data Types and R Vectors tutorials.

**If you got 6-10 right:** You understand R's vector-first approach. Move on to R Data Frames.

**If you got 11-15 right:** You're ready for real data analysis. Try the Data Wrangling with dplyr tutorial.

## What's Next?

More practice exercises for specific topics:

1. **R Vectors Exercises** — 12 problems focused on vector operations
2. **R Data Frames Exercises** — 15 problems with tabular data
3. **R Control Flow Exercises** — if/else, loops, and pattern matching

Or continue learning with the next tutorial in the series: **R Data Types**.
