---
title: "R Basics Exercises: 15 Practice Problems for Beginners (With Solutions)"
slug: "R-Basics-Exercises"
description: "15 hands-on R basics exercises with worked interactive solutions, covering variables, vectors, arithmetic, logical ops, indexing, and your first function."
keywords: "R basics exercises, R beginner exercises, R practice problems, R exercises with solutions, learn R exercises"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.1"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Basics (15 problems)"
auto_link_terms: "R basics exercises|R beginner exercises|R practice problems"
auto_link_case_sensitive: false
fr_parent: "R-Syntax-101.html"
difficulty: "Intermediate"
---

# R Basics Exercises: 15 Practice Problems for Beginners (With Solutions)

<p class="lead">15 bite-sized R exercises you can run right here in the browser. Every problem has a worked solution you can reveal, so you get immediate feedback. Work through them in order, they build on each other from your first variable to your first function.</p>

These exercises are designed for complete beginners. If you can install R and open RStudio or Positron, you are ready. Each problem takes two to five minutes. You will learn by writing code, checking the output, comparing against the solution, and then running a small variation of your own.

## How to use this page

1. Read the problem.
2. Try it in the code block below. Click **Run** to see your output.
3. If you get stuck, expand **Solution** to see a worked answer.
4. Before moving on, change one thing in the solution and run it again. The understanding comes from the variation, not the copy.

[TIP]
The code blocks share state across the whole page, just like a notebook. A variable you create in Exercise 1 is still available in Exercise 15.

## Section 1, Variables, arithmetic and types

### Exercise 1. Assign and print

Create a variable `x` holding the number 17 and a variable `y` holding 5. Print their sum, difference, product, and integer quotient (`%/%`).

```r title="Exercise: Sum, diff, product, quotient"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Arithmetic with integer division solution"
x <- 17
y <- 5

x + y      # 22
x - y      # 12
x * y      # 85
x %/% y    # 3  (integer division)
x %% y     # 2  (remainder, bonus)
```

</details>

### Exercise 2. Types and coercion

Create `a <- 3.14`, `b <- 3L`, `c <- "3"`, `d <- TRUE`. Use `class()` on each. Then compute `b + d`, predict the result before running it.

```r title="Exercise: class of four types"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="class and logical coercion solution"
a <- 3.14
b <- 3L
c <- "3"
d <- TRUE

class(a)   # "numeric"
class(b)   # "integer"
class(c)   # "character"
class(d)   # "logical"

b + d      # 4 — TRUE is silently coerced to 1L
```

The key lesson: logical values become 1 and 0 in arithmetic. This is useful for counting TRUE values with `sum()`.

</details>

### Exercise 3. Round, floor, ceiling

Given `p <- 3.87`, produce 3.87 rounded to 1 decimal, the floor, the ceiling, and the result truncated toward zero.

```r title="Exercise: round, floor, ceiling, trunc"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Rounding helpers solution"
p <- 3.87

round(p, 1)   # 3.9
floor(p)      # 3
ceiling(p)    # 4
trunc(p)      # 3  (toward zero; same as floor for positive numbers)

trunc(-3.87)  # -3 (differs from floor(-3.87) which gives -4)
```

</details>

## Section 2, Vectors and indexing

### Exercise 4. Create and inspect a vector

Create a vector `temps` containing the values 22, 25, 19, 30, 28, 24, 21. Find its length, mean, and sort it in descending order.

```r title="Exercise: Length, mean, sort temps"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Length, mean, sort solution"
temps <- c(22, 25, 19, 30, 28, 24, 21)

length(temps)               # 7
mean(temps)                 # 24.14286
sort(temps, decreasing = TRUE)
# 30 28 25 24 22 21 19
```

</details>

### Exercise 5. Positive indexing

From `temps`, extract the first value, the last value, and the third through fifth values (inclusive).

```r title="Exercise: First, last, middle values"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Index first, last, range solution"
temps[1]              # 22
temps[length(temps)]  # 21
temps[3:5]            # 19 30 28
```

`length(temps)` is the portable way to get the last element, it works regardless of how long the vector is.

</details>

### Exercise 6. Logical indexing

Return only the values in `temps` greater than 23.

```r title="Exercise: Values over threshold"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Logical indexing solution"
temps[temps > 23]
# 25 30 28 24

# Step-by-step:
temps > 23
# FALSE TRUE FALSE TRUE TRUE TRUE FALSE
# The logical vector is used to keep elements where it is TRUE.
```

Logical indexing is the most important R idiom: build a TRUE/FALSE vector the same length as the data, then use it as an index. Almost all filtering in R boils down to this.

</details>

### Exercise 7. Negative indexing

Return `temps` with the second and fourth elements removed.

```r title="Exercise: Drop second and fourth"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Negative indexing solution"
temps[-c(2, 4)]
# 22 19 28 24 21

# Negative indices mean "exclude". You cannot mix positive
# and negative indices in a single [] call.
```

</details>

### Exercise 8. Named vectors

Create a named vector `scores` with three entries: `alice = 87`, `bob = 72`, `carol = 95`. Then extract Bob's score two different ways.

```r title="Exercise: Extract named score"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Named vector extraction solution"
scores <- c(alice = 87, bob = 72, carol = 95)

scores["bob"]   # bob: 72
scores[2]       # bob: 72
```

Both return the same value with the name attached. Use name-based indexing when you want the code to still work if the order changes.

</details>

## Section 3, Sequences and functions

### Exercise 9. Build sequences

Create (a) the integers 1 through 20, (b) the even integers from 2 to 20, and (c) a sequence of five equally spaced values from 0 to 1.

```r title="Exercise: Three sequence builders"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Sequence builders solution"
1:20
seq(2, 20, by = 2)
seq(0, 1, length.out = 5)    # 0.00 0.25 0.50 0.75 1.00
```

`seq()` is the Swiss Army knife: pick `by = ` for a step or `length.out = ` for a count, not both.

</details>

### Exercise 10. Vectorised arithmetic

Create `x <- 1:5`. Compute `x` squared, `x` plus 10, and `x` minus its own mean. Do all three in one line each, with no loops.

```r title="Exercise: Square, add, center"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Vector arithmetic solution"
x <- 1:5

x^2          # 1 4 9 16 25
x + 10       # 11 12 13 14 15
x - mean(x)  # -2 -1  0  1  2
```

R applies scalar operations element by element on vectors. Explicit `for` loops are almost never needed for this kind of work.

</details>

### Exercise 11. Missing values

Create `v <- c(4, NA, 7, 2, NA, 10)`. Compute its mean naively, then correctly, and count how many NAs it contains.

```r title="Exercise: Mean with NA poison"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="na.rm and is.na solution"
v <- c(4, NA, 7, 2, NA, 10)

mean(v)               # NA — any NA poisons the result
mean(v, na.rm = TRUE) # 5.75 — NAs removed

sum(is.na(v))         # 2
```

Forgetting `na.rm = TRUE` is the single most common source of "my mean is NA" confusion for beginners. Every summary function (`sum`, `median`, `min`, `max`, `sd`) takes the same argument.

</details>

### Exercise 12. Your first function

Write a function `celsius_to_fahrenheit(c)` that converts a temperature in Celsius to Fahrenheit using the formula `F = C * 9/5 + 32`. Test it with 0, 100, and `temps` from Exercise 4.

```r title="Exercise: Write celsiustofahrenheit"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="celsiustofahrenheit solution"
celsius_to_fahrenheit <- function(c) {
  c * 9 / 5 + 32
}

celsius_to_fahrenheit(0)     # 32
celsius_to_fahrenheit(100)   # 212
celsius_to_fahrenheit(temps) # 71.6 77.0 66.2 86.0 82.4 75.2 69.8
```

Notice the function works on a vector with zero modification, because the arithmetic inside it is already vectorised.

</details>

## Section 4, A few intentional traps

### Exercise 13. Integer vs double

Predict the output: `identical(1, 1L)`. Then predict `identical(1:3, c(1, 2, 3))`. Run both.

```r title="Exercise: identical integer versus double"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="identical type check solution"
identical(1, 1L)             # FALSE — 1 is double, 1L is integer
identical(1:3, c(1, 2, 3))   # FALSE — 1:3 is integer, c(1,2,3) is double
```

`identical()` checks type as well as value. For numerical equality use `==` or `all.equal()`.

</details>

### Exercise 14. The double-equals trap

Create `a <- 0.1 + 0.2`. Check whether `a == 0.3`. Explain the result, then compute it correctly with `all.equal()`.

```r title="Exercise: Floating-point equality"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="all.equal for floating point solution"
a <- 0.1 + 0.2
a                 # 0.3
a == 0.3          # FALSE  — floating point rounding
print(a, digits = 20)
# [1] 0.30000000000000004441

all.equal(a, 0.3) # TRUE
isTRUE(all.equal(a, 0.3))  # TRUE  — safe in `if` statements
```

Never compare doubles with `==`. Use `all.equal()` wrapped in `isTRUE()` inside conditionals.

</details>

### Exercise 15. Vector recycling

Predict the output of `c(1, 2, 3, 4, 5, 6) + c(10, 20)`. Then predict `c(1, 2, 3, 4, 5) + c(10, 20)`. Run both and read the warning carefully.

```r title="Exercise: Recycling length mismatch"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Recycling warning solution"
c(1, 2, 3, 4, 5, 6) + c(10, 20)
# 11 22 13 24 15 26
# The shorter vector is recycled: 10 20 10 20 10 20

c(1, 2, 3, 4, 5) + c(10, 20)
# Warning message:
# longer object length is not a multiple of shorter object length
# 11 22 13 24 15
```

R silently recycles when lengths divide evenly and warns when they do not. This is the source of many hard-to-find bugs, respect the warning.

</details>

## Summary

- R uses `<-` for assignment, with typed values (numeric, integer, character, logical) that coerce silently into each other.
- Vectors support positive, negative, logical, and name-based indexing. Logical indexing is the most important.
- Arithmetic is vectorised, operations apply element-wise with no loops.
- `NA` propagates; always decide whether to remove it with `na.rm = TRUE`.
- Never compare floats with `==`, use `all.equal()` instead.
- Vector recycling is powerful but silently dangerous when lengths do not align.

## References

- [R Language Definition, Basic types](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
- [Advanced R: Vectors chapter](https://adv-r.hadley.nz/vectors-chap.html)
- [R for Data Science (2e)](https://r4ds.hadley.nz/)

## Continue Learning

- [R Syntax 101: Write Your First Working Script in 10 Minutes](R-Syntax-101.html)
- [R Vectors Exercises: 12 Hands-On Problems With Step-by-Step Answers](R-Vectors-Exercises.html)
- [R Data Frames Exercises: 15 Practice Questions](R-Data-Frames-Exercises.html)
