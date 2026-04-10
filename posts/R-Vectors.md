---
title: "R Vectors: The Foundation of Everything in R"
slug: "R-Vectors"
description: "Master R vectors — create with c(), subset with [], filter with logical masks, use vectorized operations, and handle recycling. Interactive examples throughout."
keywords: "R vectors, c() function, vector in R, R vector operations, R subsetting, named vectors, vectorized operations, vector recycling, R indexing"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.6"
post_type: "C"
auto_link_terms: "R vectors|vector in R|c() function|vector recycling|vectorized operations"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Vectors"
sidebar_order: 6
---


# R Vectors: The Foundation of Everything in R

<p class="lead">A vector is R's most fundamental data structure — an ordered sequence of values of the same type. Every "number" in R is actually a vector of length 1, and every column in a data frame is a vector. Master vectors, and the rest of R clicks into place.</p>

## Introduction

Type `length(42)` in R. It returns `1` — because `42` is a vector of length one, not a scalar. R has no true scalar type; single values are just short vectors. This single insight explains why R's syntax behaves the way it does.

This tutorial covers how to create vectors, access their elements four different ways, modify them, apply vectorized operations, and handle the trickiest beginner topic: recycling. Every example runs live in your browser — click **Run** to execute.

By the end, you'll understand why `c(1, 2, 3) + c(10, 20, 30)` gives `11 22 33` without a loop, and you'll never write a `for` loop for element-wise math again.

## How do you create a vector in R?

R uses the `c()` function (short for "combine") to build vectors. Pass values separated by commas, and `c()` returns them packaged as a vector.

```r
# Create vectors of different types
numbers <- c(10, 20, 30, 40, 50)
names   <- c("Alice", "Bob", "Carol")
flags   <- c(TRUE, FALSE, TRUE, TRUE)

numbers
#> [1] 10 20 30 40 50
names
#> [1] "Alice" "Bob"   "Carol"
flags
#> [1]  TRUE FALSE  TRUE  TRUE
```

Three vectors, three types: numeric, character, logical. Each holds elements of the same type — mixing types forces R to coerce them all to the highest type present (see [R Data Types](R-Data-Types.html)).

You can also generate vectors without typing every value. These shortcuts cover 95% of real-world use cases:

```r
# Sequence of integers
1:10
#> [1]  1  2  3  4  5  6  7  8  9 10

# Sequence with step size
seq(0, 1, by = 0.25)
#> [1] 0.00 0.25 0.50 0.75 1.00

# Repeat a value
rep("A", times = 5)
#> [1] "A" "A" "A" "A" "A"

# Repeat a pattern
rep(c(1, 2), times = 3)
#> [1] 1 2 1 2 1 2
```

The colon operator `1:10` makes integer sequences quickly. `seq()` gives precise control over step size or total length. `rep()` repeats values or patterns. These four — `c()`, `:`, `seq()`, `rep()` — create almost every vector you'll ever need.

You can also attach names to vector elements, turning the vector into a lightweight dictionary:

```r
# Named vector
prices <- c(apple = 1.20, bread = 2.50, milk = 3.00)
prices
#> apple bread  milk
#>  1.20  2.50  3.00

# Access by name
prices["bread"]
#> bread
#>   2.5
```

Names appear above the values when printed. You can access elements by name using `["name"]`, which is often more readable than numeric indices.

[KEY INSIGHT]
**There are no scalars in R — every value is a vector.** When you type `42`, R stores it as a length-1 vector. This is why R is vectorized by default: operators and functions naturally work on any length.

## How do you access elements in a vector?

R has four ways to subset a vector: positive integers (keep), negative integers (drop), logical masks (filter), and character names (lookup). Each has a specific use case.

![R Vector Indexing Modes](screenshots/R-Vectors-indexing-modes.webp)
*Figure 1: The four indexing modes — positive, negative, logical, and character.*

The most common method uses positive integer positions (R indices start at 1, not 0):

```r
x <- c(10, 20, 30, 40, 50)

# Single element
x[1]
#> [1] 10

# Multiple elements
x[c(2, 4)]
#> [1] 20 40

# A range
x[2:4]
#> [1] 20 30 40
```

`x[1]` returns the first element. `x[c(2,4)]` returns elements 2 and 4. `x[2:4]` returns a slice. R returns a new vector containing the selected elements.

Negative indices do the opposite — they remove elements and return everything else:

```r
x <- c(10, 20, 30, 40, 50)

# Drop the first element
x[-1]
#> [1] 20 30 40 50

# Drop elements 2 and 4
x[-c(2, 4)]
#> [1] 10 30 50
```

The `-` sign means "exclude these positions". Useful when you know what to remove but not what remains.

Logical subsetting is R's superpower — you pass a logical vector the same length as `x`, and R keeps only the `TRUE` positions:

```r
x <- c(10, 20, 30, 40, 50)

# Manual logical mask
x[c(TRUE, FALSE, TRUE, FALSE, TRUE)]
#> [1] 10 30 50

# Condition-based mask (most common)
x[x > 25]
#> [1] 30 40 50

# Multiple conditions
x[x > 15 & x < 45]
#> [1] 20 30 40
```

The condition `x > 25` evaluates to a logical vector `c(FALSE, FALSE, TRUE, TRUE, TRUE)`, then `x[mask]` keeps only the `TRUE` positions. This is the single most important subsetting pattern in R — you'll use it daily.

Character subsetting works on named vectors:

```r
prices <- c(apple = 1.20, bread = 2.50, milk = 3.00)

# Single item
prices["milk"]
#> milk
#>    3

# Multiple items
prices[c("apple", "milk")]
#> apple  milk
#>   1.2   3.0
```

Name-based access makes code readable: `prices["apple"]` is clearer than `prices[1]` because it names the concept, not the position.

[TIP]
**Use logical subsetting (`x[x > threshold]`) instead of for loops for filtering.** It's more readable and several times faster. This is the most common R idiom — internalize it early.

## How do you modify a vector?

Vectors in R are modified by assigning to the subscripted position. The assignment replaces those positions with new values.

```r
x <- c(10, 20, 30, 40, 50)

# Replace a single element
x[2] <- 99
x
#> [1] 10 99 30 40 50

# Replace multiple elements
x[c(1, 3)] <- c(100, 300)
x
#> [1] 100  99 300  40  50

# Replace by condition
x[x > 50] <- 0
x
#> [1] 0 0 0 40 50
```

Each assignment writes to the positions selected by the subscript. The last pattern — `x[x > threshold] <- value` — zeroes out (or caps) values meeting a condition. It's the idiomatic way to clean outliers.

Adding elements uses `c()`:

```r
x <- c(1, 2, 3)

# Append to the end
x <- c(x, 4, 5)
x
#> [1] 1 2 3 4 5

# Prepend to the beginning
x <- c(0, x)
x
#> [1] 0 1 2 3 4 5
```

`c()` is used for both creation AND growth. This works because `c()` flattens its arguments — combining a vector with new values produces a longer vector.

## Why does R apply operators to whole vectors at once?

This is R's signature feature: **vectorization**. Arithmetic, comparison, and math functions apply element-by-element to entire vectors without a loop.

```r
a <- c(1, 2, 3, 4, 5)
b <- c(10, 20, 30, 40, 50)

# Element-wise arithmetic
a + b
#> [1] 11 22 33 44 55

a * 2
#> [1]  2  4  6  8 10

# Element-wise functions
sqrt(c(4, 9, 16, 25))
#> [1] 2 3 4 5

# Element-wise comparison
a > 3
#> [1] FALSE FALSE FALSE  TRUE  TRUE
```

Every operator applies element-by-element. `a + b` adds first-to-first, second-to-second, and so on. `a * 2` multiplies every element by 2. Math functions like `sqrt()`, `log()`, `exp()` work element-wise too.

[KEY INSIGHT]
**Vectorized operations are faster than loops because the iteration happens inside compiled C code.** When you write `a + b`, R doesn't loop in R — it calls a C routine that processes all elements at once. Loops in R are slow; vectorized operations are fast.

When vectors of different lengths meet in an operation, R applies **recycling** — the shorter vector repeats from the start until it matches the longer one:

![R Vector Recycling](screenshots/R-Vectors-recycling.webp)
*Figure 2: Recycling repeats the shorter vector's elements to match the longer vector's length.*

```r
# Recycling in action
long  <- c(1, 2, 3, 4, 5, 6)
short <- c(10, 100)

long + short
#> [1]  11 102  13 104  15 106
```

`short` has length 2. R recycled it — the first element (10) was added to positions 1, 3, 5 and the second element (100) was added to positions 2, 4, 6. Recycling is powerful but silent, which makes it a common source of bugs when lengths don't match cleanly.

[WARNING]
**Recycling only warns when the longer length is NOT a multiple of the shorter.** If `length(short)` evenly divides `length(long)`, R silently recycles — no warning. Mismatched lengths get a warning but R still performs the operation.

## What functions summarize a vector?

R ships with dozens of vector functions. The ones you'll use most:

```r
x <- c(3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5)

# Length and range
length(x)
#> [1] 11
min(x)
#> [1] 1
max(x)
#> [1] 9
range(x)
#> [1] 1 9

# Summary statistics
sum(x)
#> [1] 44
mean(x)
#> [1] 4
median(x)
#> [1] 4
sd(x)
#> [1] 2.280351
```

These cover 80% of descriptive statistics. `sum()` and `mean()` are the most common. `range()` returns the min and max as a length-2 vector.

Sorting and ordering:

```r
x <- c(3, 1, 4, 1, 5, 9, 2, 6)

# Sort the values
sort(x)
#> [1] 1 1 2 3 4 5 6 9

# Sort descending
sort(x, decreasing = TRUE)
#> [1] 9 6 5 4 3 2 1 1

# Reverse the order
rev(x)
#> [1] 6 2 9 5 1 4 1 3

# Unique values
unique(c(1, 2, 2, 3, 3, 3))
#> [1] 1 2 3
```

`sort()` orders values, `rev()` reverses without sorting, `unique()` removes duplicates. Combined, they handle most data-cleaning tasks.

## Common Mistakes and How to Fix Them

### Mistake 1: Off-by-one errors (R indices start at 1)

❌ **Wrong:**
```r
my_x <- c(10, 20, 30, 40)
my_x[0]
#> numeric(0)
```

**Why it is wrong:** R's first index is 1, not 0 (unlike Python or JavaScript). `x[0]` returns an empty vector, not the first element.

✅ **Correct:**
```r
my_x <- c(10, 20, 30, 40)
my_x[1]
#> [1] 10
```

### Mistake 2: Silent recycling with mismatched lengths

❌ **Wrong:**
```r
a <- c(1, 2, 3, 4, 5)
b <- c(10, 20, 30)
a + b
#> Warning: longer object length is not a multiple of shorter object length
#> [1] 11 22 33 14 25
```

**Why it is wrong:** R recycles `b` (10, 20, 30, 10, 20) to match `a`, producing unexpected arithmetic. The warning is easy to miss in long output.

✅ **Correct:**
```r
a <- c(1, 2, 3, 4, 5)
b <- c(10, 20, 30, 40, 50)  # matching length
a + b
#> [1] 11 22 33 44 55
```

### Mistake 3: Using `==` to check for NA in a vector

❌ **Wrong:**
```r
my_x <- c(1, 2, NA, 4)
my_x[my_x == NA]
#> [1] NA NA NA NA
```

**Why it is wrong:** Comparing anything to `NA` returns `NA`, not `TRUE`. The subset returns all `NA`s because the mask is all `NA`.

✅ **Correct:**
```r
my_x <- c(1, 2, NA, 4)
my_x[is.na(my_x)]
#> [1] NA
my_x[!is.na(my_x)]
#> [1] 1 2 4
```

### Mistake 4: Growing a vector in a loop

❌ **Wrong:**
```r
result <- c()
for (i in 1:1000) {
  result <- c(result, i * 2)   # slow — reallocates every iteration
}
```

**Why it is wrong:** Each `c()` call copies the entire vector, so the loop is O(n²). For small loops this is invisible; for 100,000+ iterations it's painfully slow.

✅ **Correct:**
```r
# Pre-allocate
result <- numeric(1000)
for (i in 1:1000) {
  result[i] <- i * 2
}

# Or better: use vectorization, no loop needed
result <- (1:1000) * 2
```

## Practice Exercises

Use `my_` prefix for exercise variables to avoid polluting tutorial state.

### Exercise 1: Create a Sequence

Create a vector of the even numbers from 2 to 20 using `seq()`. Assign it to `my_evens` and print it.

```r
# Exercise: create even numbers 2 to 20
# Hint: seq(from, to, by = 2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_evens <- seq(2, 20, by = 2)
my_evens
#> [1]  2  4  6  8 10 12 14 16 18 20
```

**Explanation:** `seq()` generates arithmetic sequences. The `by = 2` argument creates a step of 2 between consecutive values.

</details>

### Exercise 2: Filter with Logical Subsetting

Given `my_scores <- c(65, 78, 92, 54, 88, 71, 95, 49)`, extract only the passing scores (≥ 60).

```r
my_scores <- c(65, 78, 92, 54, 88, 71, 95, 49)
# Exercise: extract scores >= 60
# Hint: use a logical mask

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_scores <- c(65, 78, 92, 54, 88, 71, 95, 49)
my_passing <- my_scores[my_scores >= 60]
my_passing
#> [1] 65 78 92 88 71 95
```

**Explanation:** `my_scores >= 60` produces a logical vector, then `my_scores[...]` keeps only the `TRUE` positions.

</details>

### Exercise 3: Named Vector Lookup

Create a named vector of 4 city populations (in millions), then extract two cities by name.

```r
# Exercise: named vector with city populations
# Hint: c(city1 = value1, city2 = value2, ...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_cities <- c(Tokyo = 37.4, Delhi = 28.5, Shanghai = 25.6, Mumbai = 20.4)
my_cities[c("Tokyo", "Mumbai")]
#>  Tokyo Mumbai
#>   37.4   20.4
```

**Explanation:** Named vectors support character subsetting. Passing a character vector of names returns those elements in the requested order.

</details>

### Exercise 4: Vectorized Temperature Conversion

Convert a vector of Celsius temperatures to Fahrenheit using the formula `F = C * 9/5 + 32`.

```r
# Exercise: vectorized Celsius to Fahrenheit
# Hint: arithmetic operators apply element-by-element

my_celsius <- c(-10, 0, 15, 25, 37, 100)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_celsius <- c(-10, 0, 15, 25, 37, 100)
my_fahrenheit <- my_celsius * 9/5 + 32
my_fahrenheit
#> [1]  14.0  32.0  59.0  77.0  98.6 212.0
```

**Explanation:** R applied `* 9/5 + 32` to every element of `my_celsius` in one vectorized expression — no loop needed.

</details>

### Exercise 5: Clean a Vector with NAs

Given a vector with `NA` values, compute the mean of only the non-missing values WITHOUT using `na.rm`.

```r
# Exercise: mean of non-NA values (don't use na.rm)
# Hint: filter with !is.na() first, then take mean

my_temps <- c(72, NA, 68, 75, NA, 80, 69)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_temps <- c(72, NA, 68, 75, NA, 80, 69)
my_valid <- my_temps[!is.na(my_temps)]
mean(my_valid)
#> [1] 72.8
```

**Explanation:** `!is.na()` returns TRUE for non-missing values. Subsetting with this mask removes all NAs first, then `mean()` works on clean data.

</details>

## Complete Example: Analyzing a Student Grade Vector

Here's a realistic scenario combining creation, subsetting, vectorized ops, and summary functions.

```r
# --- Student Grade Analysis ---

# Step 1: Student scores (with one missing entry)
scores <- c(Alice = 85, Bob = 72, Carol = 91, Dave = NA, Eve = 68, Frank = 95)
scores
#> Alice   Bob Carol  Dave   Eve Frank
#>    85    72    91    NA    68    95

# Step 2: Remove missing values
valid_scores <- scores[!is.na(scores)]
valid_scores
#> Alice   Bob Carol   Eve Frank
#>    85    72    91    68    95

# Step 3: Identify students who passed (>= 70)
passed <- valid_scores[valid_scores >= 70]
names(passed)
#> [1] "Alice" "Bob"   "Carol" "Frank"

# Step 4: Compute class statistics
cat("Class size:       ", length(scores), "\n")
cat("Valid responses:  ", length(valid_scores), "\n")
cat("Average score:    ", round(mean(valid_scores), 1), "\n")
cat("Highest score:    ", max(valid_scores), "\n")
cat("Number passed:    ", length(passed), "\n")
#> Class size:        6
#> Valid responses:   5
#> Average score:     82.2
#> Highest score:     95
#> Number passed:     4

# Step 5: Letter grades via vectorized comparison
grades <- ifelse(valid_scores >= 90, "A",
          ifelse(valid_scores >= 80, "B",
          ifelse(valid_scores >= 70, "C", "F")))
grades
#> Alice   Bob Carol   Eve Frank
#>   "B"   "C"   "A"   "F"   "A"
```

This pipeline uses every technique covered: named vector creation, logical subsetting to filter NAs, conditional subsetting for passed students, summary functions (`length`, `mean`, `max`), and vectorized `ifelse()` for letter grades. Every step runs element-by-element — no loops.

## Summary

| Task | Syntax | Example |
|---|---|---|
| Create | `c(...)` | `c(1, 2, 3)` |
| Sequence | `a:b` or `seq()` | `1:10`, `seq(0, 1, 0.25)` |
| Access | `x[positions]` | `x[2:4]` |
| Drop | `x[-positions]` | `x[-1]` |
| Filter | `x[condition]` | `x[x > 5]` |
| Name | `c(a=1, b=2)` | `x["a"]` |
| Modify | `x[pos] <- val` | `x[1] <- 99` |
| Length | `length(x)` | `length(x)` |
| Stats | `mean, sum, min, max, sd` | `mean(x)` |
| Sort | `sort(x)` | `sort(x, decreasing=TRUE)` |

## FAQ

### Why do R indices start at 1 instead of 0?

R inherited 1-based indexing from S and from statistical/mathematical convention — matrix element (1,1) is the top-left corner in linear algebra. Most programming languages (C, Python, JavaScript) use 0-based indexing for historical pointer-arithmetic reasons. R's choice aligns with the way statisticians and mathematicians number things.

### What's the difference between `c()` and `list()`?

`c()` creates a vector — all elements must be the same type. If you mix types, R coerces them all to the most general type. `list()` creates a list — each element can be a different type and different length. Use `c()` for homogeneous data, `list()` for heterogeneous collections.

### How do I check if a vector contains a specific value?

Use `%in%`: `5 %in% c(1, 3, 5, 7)` returns `TRUE`. This is vectorized on the left side too: `c(2, 4) %in% c(1, 2, 3, 4, 5)` returns `c(TRUE, TRUE)`.

### What does `x[]` (empty brackets) do?

`x[]` returns the entire vector unchanged. It's useful on the left side of an assignment: `x[] <- 0` replaces all values with 0 while preserving attributes (like names). Different from `x <- 0`, which replaces `x` with a length-1 vector.

### Why does `c(1, "a")` return character instead of an error?

R coerces to the highest type in the coercion ladder (logical → integer → double → character). Since character is highest, the number becomes the string `"1"`. See [R Data Types](R-Data-Types.html) for the full coercion rules.

## References

1. R Core Team — *An Introduction to R*, Chapter 2 (Simple manipulations; numbers and vectors). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 3 (Vectors). CRC Press (2019). [Link](https://adv-r.hadley.nz/vectors-chap.html)
3. R manual — `c()` reference (stat.ethz.ch). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/c.html)
4. R manual — `seq()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/seq.html)
5. R manual — `Extract` / subsetting reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extract.html)
6. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 20 (Vectors). [Link](https://r4ds.hadley.nz/base-R.html)
7. R Language Definition — Vector objects. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Vector-objects)

## Continue Learning

- **[R Data Frames](R-Data-Frames.html)** — stacks of vectors side-by-side, R's workhorse for tabular data.
- **[R Lists](R-Lists.html)** — collections that can hold vectors of mixed types and lengths.
- **[R Subsetting](R-Subsetting.html)** — deep dive on `[`, `[[`, `$`, and `@` operators across all structures.
