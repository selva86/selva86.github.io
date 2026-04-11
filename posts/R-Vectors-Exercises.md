---
title: "R Vectors Exercises: 12 Hands-On Problems with Step-by-Step Answers"
slug: "R-Vectors-Exercises"
description: "12 interactive R vector exercises with worked solutions: creation, coercion, indexing, logical filtering, arithmetic, recycling, named vectors, NA handling."
keywords: "R vectors exercises, R vector practice, R indexing exercises, R logical indexing, R recycling exercises"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.2"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Vectors (12 problems)"
auto_link_terms: "R vectors exercises|R vector practice|R indexing exercises"
auto_link_case_sensitive: false
fr_parent: "R-Vectors.html"
---

# R Vectors Exercises: 12 Hands-On Problems with Step-by-Step Answers

<p class="lead">Twelve focused exercises on R's most fundamental data structure. You will create vectors, coerce types, index by position, name and logical mask, do vectorised arithmetic, and avoid the two recycling traps that catch almost every beginner. Every problem is runnable right here in the page.</p>

The single most important thing to understand in R is that almost everything is a vector. Scalars are length-one vectors. Data frame columns are vectors. Function arguments are often vectors. Mastering vectors is the one investment that pays off in every other part of R.

Work through the exercises in order. The code blocks share state across the whole page, so variables you create in Exercise 1 are still available in Exercise 12.

## Section 1 — Creating and inspecting vectors

### Exercise 1. Four ways to create a vector

Create the same numeric vector `1, 2, 3, 4, 5, 6, 7, 8, 9, 10` in four different ways: with `c()`, with `:`, with `seq()`, and with `seq_len()`. Confirm they are equal with `identical()`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
v1 <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
v2 <- 1:10
v3 <- seq(1, 10, by = 1)
v4 <- seq_len(10)

identical(v2, v4)   # TRUE — both are integer
identical(v1, v3)   # TRUE — both are double
identical(v1, v2)   # FALSE — one is double, one is integer
```

`1:10` and `seq_len(10)` both produce *integer* vectors. `c(1, 2, ...)` and `seq(1, 10, by = 1)` produce *double* vectors. The values print the same but the type differs.

</details>

### Exercise 2. Type coercion in `c()`

Predict the type of each of these vectors, then check with `typeof()`:

```r
c(1, 2, 3)
c(1L, 2L, 3L)
c(1, 2L, 3)
c(1, "2", 3)
c(1, TRUE, 3)
```

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
typeof(c(1, 2, 3))        # "double"
typeof(c(1L, 2L, 3L))     # "integer"
typeof(c(1, 2L, 3))       # "double"   — integer promoted to double
typeof(c(1, "2", 3))      # "character" — everything becomes character
typeof(c(1, TRUE, 3))     # "double"   — logical promoted to double
```

The coercion hierarchy is `logical → integer → double → character`. `c()` picks the most general type present.

</details>

### Exercise 3. Length, head, tail

Create `x <- seq(5, 100, by = 5)`. Report its length, the first three values, and the last three values.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
x <- seq(5, 100, by = 5)

length(x)  # 20
head(x, 3) # 5 10 15
tail(x, 3) # 90 95 100
```

</details>

## Section 2 — Indexing

### Exercise 4. Positive and range indexing

From `x` (Exercise 3), extract the 1st, 5th and 10th elements in one call, and then the 11th through 15th elements as a contiguous slice.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
x[c(1, 5, 10)]   # 5 25 50
x[11:15]         # 55 60 65 70 75
```

A vector of indices inside `[ ]` picks those positions in the order given. Ranges are just vectors built with `:`.

</details>

### Exercise 5. Negative indexing

From `x`, return everything *except* the last two elements. Do it two ways: with a negative index, and with `head()`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
x[-c(length(x) - 1, length(x))]  # everything but last two
head(x, -2)                      # same result, cleaner

# head(x, -2) returns all but the last 2 elements.
# Similarly, tail(x, -2) returns all but the first 2.
```

`head()` and `tail()` accept negative counts. This is the idiomatic way to drop trailing or leading elements.

</details>

### Exercise 6. Logical indexing

Return the elements of `x` that are strictly greater than 30 *and* strictly less than 75.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
x[x > 30 & x < 75]
# 35 40 45 50 55 60 65 70

# Step-by-step:
x > 30                 # logical vector
x < 75                 # logical vector
(x > 30) & (x < 75)    # element-wise AND
x[(x > 30) & (x < 75)] # filter
```

Use `&` for element-wise AND and `|` for element-wise OR. The double forms `&&` and `||` are for single-value logic in `if` statements and should not be used for vector filtering.

</details>

### Exercise 7. Named vectors

Create a named vector of the populations (in millions) of five countries:

```r
pop <- c(USA = 331, China = 1412, India = 1417, Brazil = 215, Nigeria = 223)
```

Return India's population by name, the values for USA and Nigeria in one call, and the *names* of all countries with population greater than 300 million.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
pop <- c(USA = 331, China = 1412, India = 1417, Brazil = 215, Nigeria = 223)

pop["India"]                      # India: 1417
pop[c("USA", "Nigeria")]          # USA: 331, Nigeria: 223
names(pop)[pop > 300]             # "USA" "China" "India"
```

Note the last one: you apply the logical index to `names(pop)`, not to `pop` itself, because you want the *names* back, not the values.

</details>

## Section 3 — Arithmetic, recycling, and summaries

### Exercise 8. Vectorised arithmetic

Create `a <- 1:5` and `b <- 6:10`. Compute `a + b`, `a * b`, `a^b`, and the dot product.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
a <- 1:5
b <- 6:10

a + b          # 7 9 11 13 15
a * b          # 6 14 24 36 50
a^b            # 1 128 6561 262144 9765625
sum(a * b)     # 130 — the dot product
```

R has no special dot-product operator (unlike NumPy). `sum(a * b)` is idiomatic and fast.

</details>

### Exercise 9. Recycling — the safe case and the trap

Predict the output of each of these. Run them and read the warning on the second one.

```r
c(1, 2, 3, 4) * c(10, 100)
c(1, 2, 3, 4, 5) * c(10, 100)
```

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
c(1, 2, 3, 4) * c(10, 100)
# 10 200 30 400  — clean recycling, length 2 divides length 4

c(1, 2, 3, 4, 5) * c(10, 100)
# Warning message:
# longer object length is not a multiple of shorter object length
# 10 200 30 400 50
```

R recycles the shorter vector to match the longer. When lengths divide cleanly, no warning. When they do not, R still recycles but warns — and that is almost always a bug in your code. Treat the warning as an error until you have investigated.

</details>

### Exercise 10. Summary functions

Using `pop` from Exercise 7, compute the total population, the mean, the median, the country with the largest population (by name), and the country with the smallest (by name).

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
sum(pop)              # 3598 (million)
mean(pop)             # 719.6
median(pop)           # 331

names(pop)[which.max(pop)]  # "India"
names(pop)[which.min(pop)]  # "Brazil"
```

`which.max()` and `which.min()` return the *index* of the max/min, which you then apply to `names(pop)` to get the label.

</details>

## Section 4 — Missing values and reordering

### Exercise 11. NAs and counting

Create `v <- c(5, NA, 3, 8, NA, 1, 6, NA, 9)`. Count the NAs, compute the mean ignoring NAs, and return the vector with NAs replaced by 0.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
v <- c(5, NA, 3, 8, NA, 1, 6, NA, 9)

sum(is.na(v))                # 3
mean(v, na.rm = TRUE)        # 5.333333

v_clean <- v
v_clean[is.na(v_clean)] <- 0
v_clean
# 5 0 3 8 0 1 6 0 9
```

`is.na(v)` returns a logical vector. You can use it to either count, filter, or assign into the NA positions.

</details>

### Exercise 12. Sorting and ordering

From `pop` (Exercise 7), return (a) the populations sorted descending, and (b) the countries listed from smallest population to largest.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
sort(pop, decreasing = TRUE)
# India 1417, China 1412, USA 331, Nigeria 223, Brazil 215

pop[order(pop)]
# Brazil 215, Nigeria 223, USA 331, China 1412, India 1417
```

`sort()` reorders the *values* and keeps the names alongside. `order()` returns the *indices* that would produce the sorted order — use it when you need to reorder several parallel vectors (or a data frame) by one of them.

</details>

## Summary

- Vectors are R's fundamental data structure. Scalars are just length-one vectors.
- `c()` promotes types upward: logical → integer → double → character.
- Index with positive integers, negative integers, logicals, or names. Logical indexing is the most common in real analysis.
- Arithmetic is vectorised element-wise. Recycling happens when lengths differ — silent when clean, warned otherwise.
- Handle NAs with `na.rm = TRUE` or by masking with `is.na()`.
- Use `sort()` to reorder a single vector, `order()` to produce indices for reordering multiple parallel vectors.

## References

- [R Language Definition — Vectors](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Vector-objects)
- [Advanced R — Vectors chapter](https://adv-r.hadley.nz/vectors-chap.html)
- [R for Data Science (2e)](https://r4ds.hadley.nz/)

## Continue Learning

- [R Vectors: The Foundation of Everything in R (Master This First)](R-Vectors.html)
- [R Basics Exercises: 15 Practice Problems for Beginners](R-Basics-Exercises.html)
- [R Data Frames Exercises: 15 Practice Questions](R-Data-Frames-Exercises.html)
