---
title: "R Vectors: The Foundation of Everything in R (Master This First)"
slug: "R-Vectors"
description: "Master R vectors: create, access, modify, filter, and use vectorized operations. Interactive examples covering everything from c() to named vectors."
keywords: "R vectors, c() function, vector in R, R vector operations, R subsetting, named vectors, vectorized operations"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.6"
post_type: "C"
auto_link_terms: "R vectors|vector in R|c() function"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Vectors"
sidebar_order: 6
---

# R Vectors: The Foundation of Everything in R (Master This First)

<p class="lead">A vector is R's most fundamental data structure — an ordered collection of values of the same type. In R, even a single number is a vector of length 1. Master vectors first, and everything else in R clicks into place.</p>

Almost every R operation works on vectors. When you compute `mean(x)`, x is a vector. When you filter a data frame column, you're working with a vector. When you plot data, you're passing vectors to the plotting function. Vectors are everywhere.

This tutorial covers everything you need: creating vectors, accessing elements, modifying them, filtering, vectorized operations (R's secret superpower), and named vectors.

## Introduction

A **vector** is an ordered sequence of values where **every element has the same type** — all numeric, all character, or all logical. This single-type constraint is what makes vectors fast and predictable.

Think of a vector as a row of mailboxes: each has a number (its position), and they all hold the same kind of mail (the type). You can look at one mailbox, a range of mailboxes, or all of them at once.

```r
# A vector in action
temperatures <- c(72, 68, 75, 80, 77, 65, 71)
days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

cat("Temperatures:", temperatures, "\n")
cat("Days:", days, "\n")
cat("Length:", length(temperatures), "\n")
cat("Type:", class(temperatures), "\n")
```

## Creating Vectors

### The c() function

The primary way to create a vector is `c()` (combine):

```r
# Numeric vector
prices <- c(9.99, 14.50, 3.25, 22.00)
cat("Prices:", prices, "\n")

# Character vector
colors <- c("red", "blue", "green", "yellow")
cat("Colors:", colors, "\n")

# Logical vector
passed <- c(TRUE, FALSE, TRUE, TRUE, FALSE)
cat("Passed:", passed, "\n")

# Single value — still a vector (length 1)
x <- 42
cat("x is a vector of length", length(x), "\n")
cat("is.vector(x):", is.vector(x), "\n")
```

### Sequence shortcuts

R provides powerful shortcuts for creating sequences:

```r
# Colon operator — integer sequence
one_to_ten <- 1:10
cat("1:10 →", one_to_ten, "\n")

ten_to_one <- 10:1
cat("10:1 →", ten_to_one, "\n")

# seq() — flexible sequences
by_twos <- seq(2, 20, by = 2)
cat("Even numbers:", by_twos, "\n")

five_points <- seq(0, 1, length.out = 5)
cat("5 evenly spaced:", five_points, "\n")

# rep() — repeat values
threes <- rep(3, times = 5)
cat("rep(3, 5):", threes, "\n")

pattern <- rep(c(1, 2, 3), times = 3)
cat("Pattern repeated:", pattern, "\n")

each_repeated <- rep(c("A", "B", "C"), each = 2)
cat("Each repeated:", each_repeated, "\n")
```

Notice the difference between `times` and `each` in `rep()`: `times` repeats the whole vector; `each` repeats each element before moving to the next.

### Combining vectors

You can combine existing vectors into larger ones using `c()`:

```r
first_half <- c(1, 2, 3)
second_half <- c(4, 5, 6)

# Combine into one vector
combined <- c(first_half, second_half)
cat("Combined:", combined, "\n")

# Add single elements
extended <- c(0, first_half, 3.5, second_half, 7)
cat("Extended:", extended, "\n")
```

## Accessing Elements (Subsetting)

R uses **square brackets** `[]` to access vector elements. R uses **1-based indexing** — the first element is at position 1, not 0.

### By position

```r
fruits <- c("apple", "banana", "cherry", "date", "elderberry")

# Single element
cat("1st:", fruits[1], "\n")
cat("3rd:", fruits[3], "\n")
cat("Last:", fruits[length(fruits)], "\n")

# Multiple elements
cat("1st and 3rd:", fruits[c(1, 3)], "\n")
cat("First three:", fruits[1:3], "\n")

# Negative indexing — exclude elements
cat("All except 2nd:", fruits[-2], "\n")
cat("Except 1st and 5th:", fruits[c(-1, -5)], "\n")
```

**Key point:** Negative indices *exclude* elements. `fruits[-2]` means "everything except the 2nd element." You cannot mix positive and negative indices in the same bracket.

### By logical vector

This is the most powerful form of subsetting — and the foundation of data filtering in R:

```r
scores <- c(88, 72, 95, 61, 83, 77, 90)

# Create a logical condition
above_80 <- scores > 80
cat("Above 80?", above_80, "\n")

# Use the logical vector to filter
cat("Scores above 80:", scores[above_80], "\n")

# Do it in one step (most common pattern)
cat("Scores above 80:", scores[scores > 80], "\n")
cat("Scores 70-85:", scores[scores >= 70 & scores <= 85], "\n")

# Count how many pass
cat("Count above 80:", sum(scores > 80), "\n")
cat("Percentage above 80:", mean(scores > 80) * 100, "%\n")
```

The pattern `vector[condition]` is one of the most important patterns in R. You'll use it constantly in data analysis.

### By name

Vectors can have named elements, which you can use for access:

```r
# Named vector
ages <- c(Alice = 25, Bob = 32, Carol = 28, David = 45)
cat("Ages:", ages, "\n")

# Access by name
cat("Alice's age:", ages["Alice"], "\n")
cat("Bob and Carol:", ages[c("Bob", "Carol")], "\n")

# See all names
cat("Names:", names(ages), "\n")

# Add names to an existing vector
scores <- c(88, 72, 95)
names(scores) <- c("Math", "English", "Science")
cat("Scores:", scores, "\n")
cat("Science:", scores["Science"], "\n")
```

Named vectors are like simple lookup tables. They're especially useful when you need to map codes to labels or store configuration values.

## Modifying Vectors

### Change individual elements

```r
colors <- c("red", "blue", "green", "yellow")
cat("Original:", colors, "\n")

# Change one element
colors[2] <- "purple"
cat("After change:", colors, "\n")

# Change multiple elements
colors[c(1, 4)] <- c("orange", "pink")
cat("After multiple changes:", colors, "\n")

# Conditional replacement
scores <- c(88, 45, 92, 38, 77, 55, 91)
cat("Original scores:", scores, "\n")

# Replace all failing scores with 50 (minimum grade policy)
scores[scores < 50] <- 50
cat("After minimum grade:", scores, "\n")
```

The conditional replacement `scores[scores < 50] <- 50` is a powerful one-liner. It says: "find all elements below 50, and set them to 50."

### Add and remove elements

```r
x <- c(10, 20, 30)

# Append to the end
x <- c(x, 40, 50)
cat("After append:", x, "\n")

# Prepend to the beginning
x <- c(0, x)
cat("After prepend:", x, "\n")

# Insert in the middle (at position 3)
x <- c(x[1:2], 15, x[3:length(x)])
cat("After insert:", x, "\n")

# Remove by position
x <- x[-3]    # Remove the element at position 3
cat("After remove:", x, "\n")

# Remove by value (keep everything that's not 30)
x <- x[x != 30]
cat("After removing 30:", x, "\n")
```

> **Note:** R vectors don't have a built-in "insert at position" or "delete" function like Python lists do. You create a new vector by combining the pieces you want. This isn't a problem in practice — R is designed for working with whole vectors, not individual element operations.

## Vectorized Operations: R's Superpower

**Vectorization** is the #1 reason R is fast at data analysis. When you apply an operation to a vector, R applies it to *every element simultaneously* — no loops needed.

```r
# Math on entire vectors — no loop required!
prices <- c(10, 25, 8, 42, 15)

# Add tax to every price (8%)
with_tax <- prices * 1.08
cat("Original: ", prices, "\n")
cat("With tax: ", round(with_tax, 2), "\n")

# Convert Fahrenheit to Celsius
temps_f <- c(72, 68, 75, 80, 65)
temps_c <- round((temps_f - 32) * 5/9, 1)
cat("\nFahrenheit:", temps_f, "\n")
cat("Celsius:   ", temps_c, "\n")
```

In Python, you'd need a for loop or list comprehension for this. In R, it's one line. This makes R code more concise, more readable, and significantly faster (R executes vectorized operations in optimized C code under the hood).

### Element-wise operations on two vectors

When you combine two vectors with an operator, R matches them element by element:

```r
# Element-wise operations
quantities <- c(2, 1, 3, 4, 2)
unit_prices <- c(10, 25, 8, 42, 15)

totals <- quantities * unit_prices
cat("Quantities: ", quantities, "\n")
cat("Unit prices:", unit_prices, "\n")
cat("Totals:     ", totals, "\n")
cat("Grand total:", sum(totals), "\n")
```

### Recycling: what happens when vectors are different lengths

If two vectors have different lengths, R **recycles** the shorter one — repeating it until it matches the longer one:

```r
# Same length — straightforward
x <- c(1, 2, 3)
y <- c(10, 20, 30)
cat("Same length:", x + y, "\n")

# Scalar + vector — scalar gets recycled
cat("x + 100:", x + 100, "\n")  # 100 is recycled: c(100, 100, 100)

# Different lengths — shorter recycled
a <- c(1, 2, 3, 4, 5, 6)
b <- c(10, 20)
cat("Recycled:", a + b, "\n")  # b becomes c(10, 20, 10, 20, 10, 20)

# Warning when lengths don't divide evenly
a2 <- c(1, 2, 3, 4, 5)
b2 <- c(10, 20)
cat("Uneven recycle:", a2 + b2, "\n")  # Works but warns
```

Scalar recycling (adding a single number to a vector) is useful and common. Multi-element recycling can be a source of bugs — R will warn you when the lengths don't divide evenly.

## Useful Vector Functions

Here are the functions you'll use most often with vectors:

```r
x <- c(23, 45, 12, 67, 34, 89, 56, 8, 71, 42)

# Summary statistics
cat("Length:", length(x), "\n")
cat("Sum:   ", sum(x), "\n")
cat("Mean:  ", mean(x), "\n")
cat("Median:", median(x), "\n")
cat("Min:   ", min(x), "\n")
cat("Max:   ", max(x), "\n")
cat("Range: ", range(x), "\n")
cat("SD:    ", round(sd(x), 2), "\n")

# Position functions
cat("\nPosition of max:", which.max(x), "(value:", x[which.max(x)], ")\n")
cat("Position of min:", which.min(x), "(value:", x[which.min(x)], ")\n")
```

### Sorting and ordering

```r
x <- c(23, 45, 12, 67, 34)
names(x) <- c("A", "B", "C", "D", "E")

# sort() — returns sorted values
cat("Ascending:", sort(x), "\n")
cat("Descending:", sort(x, decreasing = TRUE), "\n")

# order() — returns the indices that would sort the vector
idx <- order(x)
cat("Order indices:", idx, "\n")
cat("Sorted via order:", x[idx], "\n")

# rev() — reverse a vector
cat("Reversed:", rev(x), "\n")

# unique() — remove duplicates
dupes <- c(1, 2, 2, 3, 3, 3, 4)
cat("Unique values:", unique(dupes), "\n")
cat("Duplicate table:\n")
print(table(dupes))
```

`order()` is more useful than `sort()` in practice because it tells you *where* each sorted element came from — essential for sorting data frames (you sort by one column and need the other columns to follow along).

### Set operations

```r
a <- c(1, 2, 3, 4, 5)
b <- c(3, 4, 5, 6, 7)

cat("Union:", union(a, b), "\n")         # All unique values from both
cat("Intersect:", intersect(a, b), "\n") # Values in both
cat("Setdiff(a, b):", setdiff(a, b), "\n")  # In a but not b
cat("Setdiff(b, a):", setdiff(b, a), "\n")  # In b but not a
cat("Is 3 in a?", 3 %in% a, "\n")           # Membership test
cat("Which of b are in a?", b %in% a, "\n")
```

The `%in%` operator is extremely useful for filtering: "show me all rows where the category is in this list."

## Handling Missing Values (NA)

Real data almost always has missing values. R represents these as `NA`. Here's how to work with vectors that contain NAs:

```r
# Vector with missing values
temps <- c(72, NA, 75, 80, NA, 65, 71)
cat("Temperatures:", temps, "\n")

# Most functions return NA if any value is NA
cat("Mean with NA:", mean(temps), "\n")

# Use na.rm = TRUE to ignore NAs
cat("Mean without NA:", mean(temps, na.rm = TRUE), "\n")
cat("Sum without NA:", sum(temps, na.rm = TRUE), "\n")

# Find and count NAs
cat("Is NA:", is.na(temps), "\n")
cat("NA count:", sum(is.na(temps)), "\n")
cat("Non-NA count:", sum(!is.na(temps)), "\n")

# Remove NAs from a vector
clean_temps <- temps[!is.na(temps)]
cat("Clean:", clean_temps, "\n")
# Or use na.omit()
cat("na.omit:", na.omit(temps), "\n")
```

The `na.rm = TRUE` pattern appears in almost every R script that handles real data. Memorize it.

## Practice Exercises

### Exercise 1: Vector Basics

Create a vector of daily step counts and analyze it:

```r
# Exercise: A fitness tracker recorded daily steps for two weeks
# Week 1: 8200, 10500, 7800, 12000, 9500, 15000, 6000
# Week 2: 9000, 11200, 8500, 10000, 13500, 14000, 7500
#
# 1. Combine both weeks into one vector
# 2. Find the total steps, daily average, best and worst day
# 3. How many days exceeded 10,000 steps?
# 4. What percentage of days exceeded 10,000 steps?

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
week1 <- c(8200, 10500, 7800, 12000, 9500, 15000, 6000)
week2 <- c(9000, 11200, 8500, 10000, 13500, 14000, 7500)

all_steps <- c(week1, week2)
cat("Total steps:", sum(all_steps), "\n")
cat("Daily average:", round(mean(all_steps), 0), "\n")
cat("Best day:", max(all_steps), "(day", which.max(all_steps), ")\n")
cat("Worst day:", min(all_steps), "(day", which.min(all_steps), ")\n")
cat("Days over 10k:", sum(all_steps > 10000), "\n")
cat("Percent over 10k:", round(mean(all_steps > 10000) * 100, 1), "%\n")
```

**Explanation:** `sum(all_steps > 10000)` counts how many TRUE values there are in the logical vector. `mean(all_steps > 10000)` gives the proportion, which we multiply by 100 for the percentage.

</details>

### Exercise 2: Filtering and Replacing

Clean a vector of test scores:

```r
# Exercise: A teacher has test scores with some data entry errors
# scores <- c(88, 102, 75, -5, 91, 200, 83, 67, 95, -10)
#
# 1. Scores must be between 0 and 100
# 2. Find and report which positions have invalid scores
# 3. Replace invalid scores with NA
# 4. Calculate the mean of valid scores only

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
scores <- c(88, 102, 75, -5, 91, 200, 83, 67, 95, -10)
cat("Original:", scores, "\n")

# Find invalid positions
invalid <- scores < 0 | scores > 100
cat("Invalid positions:", which(invalid), "\n")
cat("Invalid values:", scores[invalid], "\n")

# Replace invalid with NA
scores[invalid] <- NA
cat("Cleaned:", scores, "\n")

# Calculate mean of valid scores
cat("Mean (valid only):", round(mean(scores, na.rm = TRUE), 1), "\n")
cat("Valid count:", sum(!is.na(scores)), "of", length(scores), "\n")
```

**Explanation:** The `|` (OR) operator combines two conditions. `which()` returns the positions where the condition is TRUE. Setting those positions to NA and using `na.rm = TRUE` cleanly handles the invalid data.

</details>

### Exercise 3: Named Vectors as Lookup Tables

Create a grading system using named vectors:

```r
# Exercise: Create a named vector that maps letter grades to GPA values
# A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.0
#
# A student's grades: c("A", "B", "A", "C", "B", "A")
# 1. Use the lookup vector to convert letters to GPA values
# 2. Calculate the student's GPA (mean of all grades)
# Hint: You can use a named vector as a lookup: lookup[keys]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
# Create the lookup table
gpa_lookup <- c(A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.0)

# Student's grades
grades <- c("A", "B", "A", "C", "B", "A")

# Convert using the lookup vector
gpa_values <- gpa_lookup[grades]
cat("Grades:", grades, "\n")
cat("GPA values:", gpa_values, "\n")
cat("GPA:", round(mean(gpa_values), 2), "\n")
```

**Explanation:** `gpa_lookup[grades]` uses each element of `grades` as a name to look up the corresponding value in `gpa_lookup`. This is one of the most elegant patterns in R — using named vectors as dictionaries/hash maps.

</details>

## Summary

| Operation | Code | Example |
|-----------|------|---------|
| Create | `c()` | `c(1, 2, 3)` |
| Sequence | `:`, `seq()` | `1:10`, `seq(0, 1, by = 0.1)` |
| Repeat | `rep()` | `rep("x", 3)` |
| Access by position | `[n]` | `x[3]` |
| Access by condition | `[condition]` | `x[x > 5]` |
| Access by name | `["name"]` | `ages["Alice"]` |
| Exclude | `[-n]` | `x[-1]` |
| Modify | `[n] <- value` | `x[2] <- 99` |
| Length | `length()` | `length(x)` |
| Sort | `sort()` | `sort(x, decreasing = TRUE)` |
| Find position | `which()` | `which(x > 5)` |
| Membership | `%in%` | `3 %in% x` |
| Missing values | `na.rm = TRUE` | `mean(x, na.rm = TRUE)` |

**R's superpower:** Vectorized operations apply to all elements at once — no loops needed. `x * 2` doubles every element. `x[x > 0]` filters in one step.

## FAQ

### What's the difference between a vector and a list?

A vector requires all elements to have the **same type** (all numeric, all character, etc.). A list can hold elements of **different types** — even other vectors, data frames, or models. Vectors are simpler and faster; lists are more flexible.

### Can a vector have zero elements?

Yes. `c()` with no arguments creates an empty numeric vector. You can also create typed empty vectors: `character(0)`, `numeric(0)`, `logical(0)`. Empty vectors are useful when building up results in a loop.

### Why is R 1-indexed instead of 0-indexed?

R was designed by statisticians, and statisticians count starting at 1 (the first observation, the first row). Most other languages (Python, Java, C) use 0-based indexing. This is a common source of confusion when switching between R and Python.

### How do I add an element to a specific position?

R doesn't have an `insert()` function. You rebuild the vector: `c(x[1:2], new_value, x[3:length(x)])`. This seems awkward, but in practice you rarely insert single elements — R is designed for whole-vector operations.

### What's the maximum size of a vector?

Theoretically, up to 2^31 - 1 elements (~2.1 billion) on standard R, or 2^52 on 64-bit R with long vectors enabled. In practice, you're limited by RAM. A vector of 100 million doubles uses about 800 MB of memory.

## What's Next?

Now that you've mastered vectors, you're ready for more complex data structures:

1. **R Data Frames** — tabular data with rows and columns, where each column is a vector
2. **R Lists** — the flexible container that holds any type of object
3. **R Control Flow** — if/else, for loops, and while loops

Each tutorial builds on your vector knowledge — data frames are collections of vectors, and most loop operations can be replaced by vectorized operations.
