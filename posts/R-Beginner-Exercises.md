---
title: "R Beginner Exercises: 50 Practice Problems for Newcomers"
slug: "R-Beginner-Exercises"
description: "Start learning R with 50 beginner practice problems: vectors, basic stats, control flow, functions, plotting, file I/O. Hidden solutions, runnable in browser."
keywords: "R exercises for beginners, R basics practice, R beginner problems, learn R exercises, R practice for newbies, R intro exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R Beginner Exercises"
sidebar_order: 120
fr_parent: "R-Tutorial.html"
auto_link_terms: "R exercises for beginners|R basics practice|R beginner exercises|learn R exercises"
auto_link_case_sensitive: false
target_keyword: "R exercises for beginners"
sibling_block_enabled: false
difficulty: "Beginner"
---

# R Beginner Exercises: 50 Practice Problems for Newcomers

<p class="lead">Fifty beginner-friendly R practice problems covering vectors, arithmetic, basic statistics, control flow, functions, plotting, and simple file I/O. Hidden solutions.</p>

```r title="Run this once before any exercise"
# No external packages needed for most exercises
```

## Section 1. Vectors and basics (10 problems)

### Exercise 1.1: Create a vector

**Difficulty:** Beginner. Make a numeric vector of 1 through 10.

<details><summary>Show solution</summary>

```r
v <- 1:10
v
```

</details>

### Exercise 1.2: c() to combine

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
c(2, 4, 6, 8)
```

</details>

### Exercise 1.3: Length

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
length(c(1, 5, 9, 12))
```

</details>

### Exercise 1.4: Vector indexing

**Difficulty:** Beginner. Get element 3.

<details><summary>Show solution</summary>

```r
v <- c(10, 20, 30, 40, 50)
v[3]
```

</details>

### Exercise 1.5: Negative indexing

**Difficulty:** Beginner. All except element 2.

<details><summary>Show solution</summary>

```r
v <- c(10, 20, 30, 40, 50)
v[-2]
```

</details>

### Exercise 1.6: Range indexing

**Difficulty:** Beginner. Elements 2 to 4.

<details><summary>Show solution</summary>

```r
v <- c(10, 20, 30, 40, 50)
v[2:4]
```

</details>

### Exercise 1.7: Logical indexing

**Difficulty:** Beginner. Values > 25.

<details><summary>Show solution</summary>

```r
v <- c(10, 20, 30, 40, 50)
v[v > 25]
```

</details>

### Exercise 1.8: Named vector

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
c(a = 1, b = 2, c = 3)
```

</details>

### Exercise 1.9: seq()

**Difficulty:** Beginner. Sequence 0 to 1 by 0.1.

<details><summary>Show solution</summary>

```r
seq(0, 1, by = 0.1)
```

</details>

### Exercise 1.10: rep()

**Difficulty:** Beginner. "a" repeated 5 times.

<details><summary>Show solution</summary>

```r
rep("a", 5)
```

</details>

## Section 2. Arithmetic and basic stats (10 problems)

### Exercise 2.1: Sum

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sum(c(1, 2, 3, 4, 5))
```

</details>

### Exercise 2.2: Mean

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
mean(c(2, 4, 6, 8))
```

</details>

### Exercise 2.3: Median

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
median(c(1, 5, 3, 7, 2))
```

</details>

### Exercise 2.4: SD

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sd(c(2, 4, 6, 8, 10))
```

</details>

### Exercise 2.5: Min and max

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
v <- c(5, 2, 8, 1, 9)
c(min(v), max(v))
```

</details>

### Exercise 2.6: Range

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
range(c(5, 2, 8, 1, 9))
```

</details>

### Exercise 2.7: Variance

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
var(c(2, 4, 6, 8, 10))
```

</details>

### Exercise 2.8: Vectorized arithmetic

**Difficulty:** Beginner. Multiply each by 2.

<details><summary>Show solution</summary>

```r
c(1, 2, 3) * 2
```

</details>

### Exercise 2.9: Element-wise sum

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
c(1, 2, 3) + c(10, 20, 30)
```

</details>

### Exercise 2.10: Round

**Difficulty:** Beginner. Round 3.14159 to 2 decimal places.

<details><summary>Show solution</summary>

```r
round(3.14159, 2)
```

</details>

## Section 3. Data frames (8 problems)

### Exercise 3.1: Create a data frame

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
df <- data.frame(name = c("A","B","C"), age = c(25, 30, 35))
df
```

</details>

### Exercise 3.2: Access a column with $

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
mtcars$mpg
```

</details>

### Exercise 3.3: Number of rows and columns

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
dim(mtcars)
```

</details>

### Exercise 3.4: Column names

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
names(mtcars)
```

</details>

### Exercise 3.5: First 5 rows

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
head(mtcars, 5)
```

</details>

### Exercise 3.6: Filter rows

**Difficulty:** Beginner. mpg > 25.

<details><summary>Show solution</summary>

```r
mtcars[mtcars$mpg > 25, ]
```

</details>

### Exercise 3.7: Add a column

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
mt <- mtcars
mt$kpl <- mt$mpg * 0.425
head(mt[, c("mpg","kpl")])
```

</details>

### Exercise 3.8: Summary

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
summary(mtcars$mpg)
```

</details>

## Section 4. Control flow (6 problems)

### Exercise 4.1: if/else

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
x <- 7
if (x > 5) "big" else "small"
```

</details>

### Exercise 4.2: ifelse vectorized

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ifelse(c(2, 7, 4) > 5, "big", "small")
```

</details>

### Exercise 4.3: for loop

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
for (i in 1:3) print(i^2)
```

</details>

### Exercise 4.4: while loop

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
i <- 1
while (i <= 3) { print(i); i <- i + 1 }
```

</details>

### Exercise 4.5: break

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
for (i in 1:10) { if (i > 5) break; print(i) }
```

</details>

### Exercise 4.6: next (skip)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
for (i in 1:5) { if (i == 3) next; print(i) }
```

</details>

## Section 5. Functions (6 problems)

### Exercise 5.1: Square function

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sq <- function(x) x^2
sq(5)
```

</details>

### Exercise 5.2: Default argument

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
multiply <- function(x, n = 10) x * n
multiply(5)
```

</details>

### Exercise 5.3: Multiple arguments

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
add <- function(a, b) a + b
add(3, 4)
```

</details>

### Exercise 5.4: Return a vector

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
stats <- function(x) c(min = min(x), mean = mean(x), max = max(x))
stats(c(2, 4, 6, 8))
```

</details>

### Exercise 5.5: Anonymous function

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sapply(1:5, function(x) x^2)
```

</details>

### Exercise 5.6: \() shorthand

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
sapply(1:5, \(x) x^2)
```

</details>

## Section 6. Plotting (6 problems)

### Exercise 6.1: Scatter plot

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot(mtcars$wt, mtcars$mpg)
```

</details>

### Exercise 6.2: Histogram

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
hist(mtcars$mpg)
```

</details>

### Exercise 6.3: Boxplot

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
boxplot(mpg ~ cyl, data = mtcars)
```

</details>

### Exercise 6.4: Bar chart

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
barplot(table(mtcars$cyl))
```

</details>

### Exercise 6.5: Line chart

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot(1:10, type = "l")
```

</details>

### Exercise 6.6: Title and axis labels

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot(mtcars$wt, mtcars$mpg,
     main = "Weight vs MPG", xlab = "Weight", ylab = "MPG")
```

</details>

## Section 7. NA and types (4 problems)

### Exercise 7.1: Detect NA

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
is.na(c(1, NA, 3))
```

</details>

### Exercise 7.2: Mean ignoring NA

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
mean(c(1, NA, 3, 5), na.rm = TRUE)
```

</details>

### Exercise 7.3: Class of an object

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
class(1.5)
class("hello")
class(TRUE)
```

</details>

### Exercise 7.4: Coerce to numeric

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
as.numeric(c("1.5", "2.7"))
```

</details>

## What to do next

- **dplyr-Exercises** (shipped) — modern wrangling.
- **R-for-Data-Science-Exercises** (shipped) — broader practice mapped to R4DS topics.
- **R-Interview-Questions** (shipped) — once basics feel solid.
