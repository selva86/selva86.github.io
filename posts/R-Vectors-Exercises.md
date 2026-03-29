---
title: "R Vectors Exercises: 12 Hands-On Problems with Step-by-Step Answers"
slug: "R-Vectors-Exercises"
description: "12 R vector exercises: create, subset, filter, modify, and combine vectors. Interactive code blocks with step-by-step solutions."
keywords: "R vector exercises, R vector practice, R vector problems, R programming exercises, R subsetting exercises"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.2"
post_type: "EX"
auto_link_terms: "R vector exercises|R vector practice|R vector problems"
auto_link_case_sensitive: false
fr_parent: "R-Vectors.html"
---

# R Vectors Exercises: 12 Hands-On Problems with Step-by-Step Answers

<p class="lead">Practice everything about R vectors: creating, indexing, filtering, modifying, vectorized operations, and handling NAs. Each exercise includes an interactive code block and a detailed solution.</p>

These exercises progress from Easy (1-4) to Medium (5-8) to Hard (9-12). They cover the skills from the R Vectors tutorial. Try each one before checking the solution.

## Easy (1-4): Creation and Access

### Exercise 1: Create and Inspect

Create a numeric vector of the first 7 prime numbers. Find its length, sum, and mean.

```r
# Exercise 1: First 7 primes
# Primes: 2, 3, 5, 7, 11, 13, 17

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
primes <- c(2, 3, 5, 7, 11, 13, 17)
cat("Primes:", primes, "\n")
cat("Length:", length(primes), "\n")
cat("Sum:", sum(primes), "\n")
cat("Mean:", round(mean(primes), 2), "\n")
```

</details>

### Exercise 2: Sequence Shortcuts

Create these four vectors without typing every number: (a) 1 to 50, (b) even numbers 2 to 30, (c) 100 down to 90, (d) 0.0, 0.1, 0.2, ..., 1.0.

```r
# Exercise 2: Create sequences efficiently

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
a <- 1:50
b <- seq(2, 30, by = 2)
c <- 100:90
d <- seq(0, 1, by = 0.1)

cat("a (1 to 50):", a, "\n\n")
cat("b (even 2-30):", b, "\n\n")
cat("c (100 to 90):", c, "\n\n")
cat("d (0.0 to 1.0):", d, "\n")
```

</details>

### Exercise 3: Positive Indexing

Given `cities <- c("Tokyo", "Delhi", "Shanghai", "Sao Paulo", "Mumbai", "Beijing", "Cairo")`, extract: (a) the 3rd city, (b) the first and last city, (c) cities 2 through 5.

```r
# Exercise 3: Access elements by position
cities <- c("Tokyo", "Delhi", "Shanghai", "Sao Paulo", "Mumbai", "Beijing", "Cairo")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
cities <- c("Tokyo", "Delhi", "Shanghai", "Sao Paulo", "Mumbai", "Beijing", "Cairo")

cat("3rd city:", cities[3], "\n")
cat("First and last:", cities[c(1, length(cities))], "\n")
cat("Cities 2-5:", cities[2:5], "\n")
```

**Key concept:** `c(1, length(cities))` gets first and last regardless of vector length.

</details>

### Exercise 4: Negative Indexing

Using the same `cities` vector, get: (a) everything except the 4th city, (b) everything except the first and last.

```r
# Exercise 4: Exclude elements
cities <- c("Tokyo", "Delhi", "Shanghai", "Sao Paulo", "Mumbai", "Beijing", "Cairo")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
cities <- c("Tokyo", "Delhi", "Shanghai", "Sao Paulo", "Mumbai", "Beijing", "Cairo")

cat("Without 4th:", cities[-4], "\n")
cat("Without first/last:", cities[-c(1, length(cities))], "\n")
```

**Key concept:** Negative indices exclude elements. You can't mix positive and negative in the same `[]`.

</details>

## Medium (5-8): Filtering and Modification

### Exercise 5: Logical Filtering

Given monthly rainfall in mm, find: which months had above-average rainfall, and what percentage of months were below 50mm.

```r
# Exercise 5: Rainfall analysis
months <- c("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
rainfall <- c(78, 52, 63, 41, 35, 28, 22, 25, 38, 55, 68, 82)

# 1. Average rainfall
# 2. Which months are above average?
# 3. What % of months are below 50mm?

```

<details>
<summary>Click to reveal solution</summary>

```r
months <- c("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
rainfall <- c(78, 52, 63, 41, 35, 28, 22, 25, 38, 55, 68, 82)

avg <- mean(rainfall)
cat("Average:", round(avg, 1), "mm\n")

above_avg <- rainfall > avg
cat("Above average:", months[above_avg], "\n")
cat("Their rainfall:", rainfall[above_avg], "mm\n")

pct_below_50 <- mean(rainfall < 50) * 100
cat("Below 50mm:", round(pct_below_50, 1), "% of months\n")
```

**Key concept:** `mean(logical_vector)` gives the proportion of TRUEs. Use the logical vector to filter both `months` and `rainfall`.

</details>

### Exercise 6: Conditional Replacement

Replace all negative values with 0 and all values above 100 with 100 (clamp to 0-100 range).

```r
# Exercise 6: Clamp values to 0-100
scores <- c(105, 82, -3, 91, 67, 120, 45, -10, 78, 100)

# Clamp: negatives → 0, above 100 → 100
# Print before and after

```

<details>
<summary>Click to reveal solution</summary>

```r
scores <- c(105, 82, -3, 91, 67, 120, 45, -10, 78, 100)
cat("Before:", scores, "\n")

scores[scores < 0] <- 0
scores[scores > 100] <- 100
cat("After:", scores, "\n")

# One-liner alternative using pmin and pmax:
scores2 <- c(105, 82, -3, 91, 67, 120, 45, -10, 78, 100)
clamped <- pmax(pmin(scores2, 100), 0)
cat("pmin/pmax:", clamped, "\n")
```

**Key concept:** `scores[condition] <- value` replaces elements that meet the condition. `pmin()`/`pmax()` are vectorized min/max — perfect for clamping.

</details>

### Exercise 7: Named Vectors

Create a named vector of exchange rates (1 USD = X units of each currency), then convert $250 to each currency.

```r
# Exercise 7: Currency converter
# Create named vector: USD to EUR, GBP, JPY, INR, BRL
# Convert $250 to each currency

```

<details>
<summary>Click to reveal solution</summary>

```r
rates <- c(EUR = 0.92, GBP = 0.79, JPY = 149.5, INR = 83.1, BRL = 4.97)
amount_usd <- 250

converted <- amount_usd * rates
cat("$250 USD =\n")
for (currency in names(converted)) {
  cat(sprintf("  %s %.2f\n", currency, converted[currency]))
}

# Which currency gives the most units?
cat("\nBest value:", names(which.max(converted)),
    "—", round(max(converted), 2), "units\n")
```

**Key concept:** Multiplying a scalar by a named vector applies the operation to every element. Names are preserved in the result.

</details>

### Exercise 8: Set Operations

Given two vectors of student IDs, find: students in both classes, students in Math only, students in Science only, and all unique students.

```r
# Exercise 8: Student enrollment
math_students <- c(101, 103, 105, 107, 109, 111, 113)
science_students <- c(103, 106, 107, 110, 111, 114)

# 1. Students in BOTH classes
# 2. Math only (not in Science)
# 3. Science only (not in Math)
# 4. All unique students

```

<details>
<summary>Click to reveal solution</summary>

```r
math_students <- c(101, 103, 105, 107, 109, 111, 113)
science_students <- c(103, 106, 107, 110, 111, 114)

both <- intersect(math_students, science_students)
math_only <- setdiff(math_students, science_students)
sci_only <- setdiff(science_students, math_students)
all_unique <- union(math_students, science_students)

cat("Both classes:", both, "\n")
cat("Math only:", math_only, "\n")
cat("Science only:", sci_only, "\n")
cat("All students:", sort(all_unique), "\n")
cat("Total unique:", length(all_unique), "\n")
```

**Key concept:** `intersect()`, `setdiff()`, and `union()` are R's set operations. `%in%` checks membership: `math_students %in% science_students`.

</details>

## Hard (9-12): Combined Skills

### Exercise 9: Running Statistics

Calculate the cumulative (running) sum, mean, min, and max of a vector. For position i, the running mean is the mean of elements 1 through i.

```r
# Exercise 9: Running statistics
sales <- c(120, 85, 150, 95, 200, 175, 110, 220, 160, 130)

# Calculate running: sum, mean, min, max
# Hint: cumsum() exists. For others, you'll need sapply or a loop.

```

<details>
<summary>Click to reveal solution</summary>

```r
sales <- c(120, 85, 150, 95, 200, 175, 110, 220, 160, 130)

# Running sum (built-in)
run_sum <- cumsum(sales)

# Running mean, min, max (via sapply)
run_mean <- sapply(seq_along(sales), function(i) round(mean(sales[1:i]), 1))
run_min <- sapply(seq_along(sales), function(i) min(sales[1:i]))
run_max <- sapply(seq_along(sales), function(i) max(sales[1:i]))

# Also: cummin() and cummax() are built-in!
cat("Sales:    ", sales, "\n")
cat("Run sum:  ", run_sum, "\n")
cat("Run mean: ", run_mean, "\n")
cat("Run min:  ", cummin(sales), "\n")
cat("Run max:  ", cummax(sales), "\n")
```

**Key concept:** `cumsum()`, `cummin()`, `cummax()` are built-in. Running mean needs `sapply()` or the loop: mean of `sales[1:i]` for each i.

</details>

### Exercise 10: Handle Missing Data

A sensor recorded temperatures but had some failures (NAs). Find the mean ignoring NAs, count the gaps, find the longest consecutive gap, and fill NAs with the last known value.

```r
# Exercise 10: Sensor data with gaps
temps <- c(22.1, 22.3, NA, NA, 23.0, 23.2, NA, 22.8, 22.5, NA, NA, NA, 23.5, 23.1)

# 1. Mean temperature (ignoring NAs)
# 2. How many NAs? What percentage?
# 3. Fill NAs with the previous non-NA value (carry forward)
# Hint: For #3, use a loop or zoo::na.locf logic

```

<details>
<summary>Click to reveal solution</summary>

```r
temps <- c(22.1, 22.3, NA, NA, 23.0, 23.2, NA, 22.8, 22.5, NA, NA, NA, 23.5, 23.1)

# 1. Mean
cat("Mean (valid):", round(mean(temps, na.rm = TRUE), 2), "\n")

# 2. NA count
na_count <- sum(is.na(temps))
cat("NAs:", na_count, "of", length(temps), "(", round(na_count/length(temps)*100, 1), "%)\n")

# 3. Fill NAs forward (carry last observation forward)
filled <- temps
for (i in 2:length(filled)) {
  if (is.na(filled[i])) {
    filled[i] <- filled[i - 1]
  }
}

cat("\nOriginal:", temps, "\n")
cat("Filled:  ", filled, "\n")
cat("Filled mean:", round(mean(filled, na.rm = TRUE), 2), "\n")
```

**Key concept:** "Last observation carried forward" (LOCF) is a common imputation method. The loop replaces each NA with the value before it. In practice, use `zoo::na.locf()` or `tidyr::fill()`.

</details>

### Exercise 11: Rank and Percentile

Given test scores, calculate each student's rank and percentile.

```r
# Exercise 11: Ranking
students <- c("Alice","Bob","Carol","David","Eve","Frank","Grace","Henry")
scores <- c(88, 72, 95, 61, 88, 77, 95, 83)

# 1. Rank each student (ties get average rank)
# 2. Calculate percentile for each student
# 3. Who is in the top 25%?
# Hint: rank(), quantile()

```

<details>
<summary>Click to reveal solution</summary>

```r
students <- c("Alice","Bob","Carol","David","Eve","Frank","Grace","Henry")
scores <- c(88, 72, 95, 61, 88, 77, 95, 83)

# 1. Rank (highest score = rank 1)
ranks <- rank(-scores, ties.method = "average")

# 2. Percentile: what percentage scored at or below you
percentiles <- round(rank(scores) / length(scores) * 100, 1)

# Display
results <- data.frame(
  Student = students, Score = scores,
  Rank = ranks, Percentile = percentiles
)
results <- results[order(results$Rank), ]
print(results)

# 3. Top 25% (75th percentile and above)
q75 <- quantile(scores, 0.75)
top_25 <- students[scores >= q75]
cat("\nTop 25% (score >=", q75, "):", top_25, "\n")
```

**Key concept:** `rank(-scores)` ranks highest first. Percentile = `rank / n * 100`. `quantile(scores, 0.75)` gives the 75th percentile cutoff.

</details>

### Exercise 12: Weighted Score Calculator

Calculate weighted final grades from homework, midterm, and final exam scores with different weights.

```r
# Exercise 12: Weighted grades
students <- c("Alice", "Bob", "Carol", "David", "Eve")
homework <- c(92, 78, 88, 65, 95)   # Weight: 30%
midterm <- c(85, 82, 74, 90, 88)    # Weight: 30%
final_exam <- c(78, 90, 92, 85, 82) # Weight: 40%

# 1. Calculate weighted final grade for each student
# 2. Assign letter grades (A:90+, B:80+, C:70+, D:60+, F:<60)
# 3. Class average and highest scorer

```

<details>
<summary>Click to reveal solution</summary>

```r
students <- c("Alice", "Bob", "Carol", "David", "Eve")
homework <- c(92, 78, 88, 65, 95)
midterm <- c(85, 82, 74, 90, 88)
final_exam <- c(78, 90, 92, 85, 82)

# 1. Weighted grade (vectorized — no loop!)
weighted <- homework * 0.30 + midterm * 0.30 + final_exam * 0.40
weighted <- round(weighted, 1)

# 2. Letter grades
grades <- ifelse(weighted >= 90, "A",
          ifelse(weighted >= 80, "B",
          ifelse(weighted >= 70, "C",
          ifelse(weighted >= 60, "D", "F"))))

# Display
for (i in seq_along(students)) {
  cat(sprintf("%-8s HW=%d Mid=%d Fin=%d → %.1f (%s)\n",
    students[i], homework[i], midterm[i], final_exam[i],
    weighted[i], grades[i]))
}

# 3. Class stats
cat("\nClass average:", round(mean(weighted), 1), "\n")
cat("Highest:", students[which.max(weighted)], "with", max(weighted), "\n")
cat("Grade distribution:\n")
print(table(grades))
```

**Key concept:** `homework * 0.30 + midterm * 0.30 + final_exam * 0.40` computes weighted grades for ALL students at once — vectorized arithmetic across three parallel vectors.

</details>

## Summary: Skills Practiced

| Exercises | Vector Skills |
|-----------|-------------|
| 1-4 (Easy) | `c()`, `seq()`, `1:n`, positive/negative indexing |
| 5-8 (Medium) | Logical filtering, conditional replacement, named vectors, set operations |
| 9-12 (Hard) | `cumsum()`, NA handling, `rank()`, weighted arithmetic |

## What's Next?

Continue practicing with more exercise sets:

1. **R Data Frames Exercises** — 15 problems with tabular data
2. **R Lists Exercises** — 10 problems with nested structures
3. **R Control Flow Exercises** — if/else and loops practice

Or learn new concepts in the next tutorial: **R Data Frames**.
