---
title: "R Control Flow Exercises: 12 if/else, Loop & Function Practice Problems, Solved Step-by-Step"
slug: "R-Control-Flow-Exercises"
description: "12 interactive R control flow exercises, if/else, for loops, while, break, next, switch and short-circuit operators. Every problem runs in the browser with a worked solution."
keywords: "R control flow exercises, R if else exercises, R for loop exercises, R while loop exercises, R switch exercises"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.5"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Control Flow (12 problems)"
auto_link_terms: "R control flow exercises|R if else exercises|R for loop exercises"
auto_link_case_sensitive: false
fr_parent: "R-Control-Flow.html"
difficulty: "Intermediate"
---

# R Control Flow Exercises: 12 if/else, Loop & Function Practice Problems, Solved Step-by-Step

<p class="lead">Twelve hands-on exercises on R's control flow: <code>if/else</code>, <code>for</code> loops, <code>while</code>, <code>break</code>, <code>next</code>, <code>switch</code>, and the short-circuit operators <code>&amp;&amp;</code> and <code>||</code>. Each problem is runnable in the page with an expandable worked solution.</p>

Control flow in R is simpler than in most languages, and that simplicity hides two traps: `if` wants a single-value condition, and `for` loops are often the wrong tool when a vectorised operation would be shorter and faster. These exercises make both points concrete.

## Section 1, if, else, and short-circuit operators

### Exercise 1. A simple if/else

Write code that prints `"pass"` if a variable `score` is at least 60, otherwise `"fail"`. Test it with `score <- 72` and `score <- 45`.

```r title="Exercise: Pass/fail from score"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Pass/fail from score solution"
score <- 72
if (score >= 60) "pass" else "fail"   # "pass"

score <- 45
if (score >= 60) "pass" else "fail"   # "fail"
```

In R, `if` is an expression, it returns a value. You can assign its result: `grade <- if (score >= 60) "pass" else "fail"`.

</details>

### Exercise 2. else if chain

Turn a numeric `score` into a letter grade: 90+ = A, 80-89 = B, 70-79 = C, 60-69 = D, below 60 = F. Write it with a chain of `else if`.

```r title="Exercise: Letter grade from score"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Letter grade from score solution"
grade <- function(score) {
  if (score >= 90)      "A"
  else if (score >= 80) "B"
  else if (score >= 70) "C"
  else if (score >= 60) "D"
  else                  "F"
}

grade(95)  # "A"
grade(73)  # "C"
grade(42)  # "F"
```

Order matters, we test from highest to lowest. Each branch is only reached when all previous conditions are false.

</details>

### Exercise 3. `&&` vs `&`

Predict what each of these returns, then run them:

```r title="Predict & versus && on vectors"
x <- c(TRUE, TRUE, FALSE)
y <- c(TRUE, FALSE, FALSE)

x & y
x && y
```

```r title="Exercise: Predict vector logical output"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Predict vector logical output solution"
x & y     # TRUE FALSE FALSE   — element-wise AND
x && y    # in R 4.3+: errors (length > 1).
          # In older R: returned only the first comparison.
```

Rule: **use `&` and `|` for vectors, `&&` and `||` only inside `if` statements** on single values. Recent R versions enforce this by erroring when `&&` sees vectors longer than one.

</details>

### Exercise 4. `ifelse()` for vectors

Using `x <- c(-3, -1, 0, 2, 5)`, return a vector of the same length where negatives become `"neg"`, zero becomes `"zero"`, and positives become `"pos"`.

```r title="Exercise: Label signs with nested ifelse"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Label signs with nested ifelse solution"
x <- c(-3, -1, 0, 2, 5)

ifelse(x < 0, "neg",
  ifelse(x == 0, "zero", "pos"))
# "neg" "neg" "zero" "pos" "pos"
```

Nested `ifelse()` is the base R way to build more than two branches. For larger chains, switch to `dplyr::case_when()`.

</details>

## Section 2, for loops

### Exercise 5. Sum of squares

Write a for loop that computes the sum of squares from 1 to `n` (inclusive). Test it with `n <- 10`. Then compute the same thing in one line without a loop.

```r title="Exercise: Sum of squares one-liner"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Sum of squares solution"
n <- 10

total <- 0
for (i in 1:n) {
  total <- total + i^2
}
total        # 385

# One-liner:
sum((1:n)^2) # 385
```

The vectorised version is shorter, faster, and harder to get wrong. Reach for loops only when each iteration genuinely depends on the result of the previous one.

</details>

### Exercise 6. Pre-allocate the result

Rewrite this slow loop:

```r title="Slow loop that grows a vector"
# Slow — grows the result vector on every iteration
out <- c()
for (i in 1:1000) out <- c(out, i^2)
```

To pre-allocate `out` to length 1000 first, then assign into `out[i]`.

```r title="Exercise: Pre-allocate the output vector"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Pre-allocate the output solution"
n <- 1000
out <- numeric(n)         # pre-allocated, filled with 0
for (i in seq_len(n)) {
  out[i] <- i^2
}
head(out)  # 1 4 9 16 25 36
tail(out)  # 994009 996004 998001 1000000
```

Growing a vector with `c(out, x)` re-copies the whole vector on every iteration, O(n²) behaviour that becomes painful at a few thousand iterations. Pre-allocation is O(n).

</details>

### Exercise 7. Loop over a list

Given `nums <- list(a = 1:5, b = 6:10, c = 11:20)`, use a for loop to print each element's name and its mean.

```r title="Exercise: Mean of each named list element"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Mean of each named list solution"
nums <- list(a = 1:5, b = 6:10, c = 11:20)

for (nm in names(nums)) {
  cat(nm, ":", mean(nums[[nm]]), "\n")
}
# a : 3
# b : 8
# c : 15.5
```

Looping over `names()` gives you both the name and a way to extract the element with `nums[[nm]]`. For a functional alternative, `sapply(nums, mean)` returns the same numbers.

</details>

## Section 3, while, break, next

### Exercise 8. while until convergence

Write a while loop that starts at `x <- 1` and repeatedly replaces `x` with `(x + 10/x) / 2` (Babylonian method for the square root of 10). Stop when the change is less than 1e-8. Report the final `x` and the number of iterations.

```r title="Exercise: Babylonian square root loop"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Babylonian square root loop solution"
x    <- 1
iter <- 0

repeat {
  iter   <- iter + 1
  x_new  <- (x + 10 / x) / 2
  if (abs(x_new - x) < 1e-8) break
  x <- x_new
}

x_new         # 3.162278 — sqrt(10)
iter          # around 5
```

`repeat { ... break }` is the R equivalent of `do ... while`. A `while` loop would also work, but `repeat/break` is cleaner when the stop condition is easier to express mid-iteration.

</details>

### Exercise 9. next, skip odd numbers

Write a for loop over 1:20 that prints only the even numbers, using `next` to skip the odd ones.

```r title="Exercise: Skip odd numbers with next"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Skip odd numbers solution"
for (i in 1:20) {
  if (i %% 2 != 0) next
  cat(i, "")
}
# 2 4 6 8 10 12 14 16 18 20
```

`next` is R's `continue`. It jumps to the top of the current loop for the next iteration, skipping the rest of the loop body.

</details>

## Section 4, switch and functions

### Exercise 10. switch for named branches

Write a function `describe(season)` that returns a short description:

- `"spring"` → `"mild"`
- `"summer"` → `"hot"`
- `"autumn"` → `"cool"`
- `"winter"` → `"cold"`
- anything else → `"unknown"`

Use `switch()`, not `if/else`.

```r title="Exercise: Season to description with switch"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="Season to description solution"
describe <- function(season) {
  switch(season,
    spring = "mild",
    summer = "hot",
    autumn = "cool",
    winter = "cold",
    "unknown"
  )
}

describe("summer")  # "hot"
describe("autumn")  # "cool"
describe("monsoon") # "unknown"
```

The trailing unnamed argument is the default. `switch()` is typically faster and clearer than a long `if/else` chain when matching a single string against a fixed set of values.

</details>

### Exercise 11. Combine if/else and a for loop

Write a function `count_negative(x)` that takes a numeric vector and returns the count of strictly negative elements, using an explicit for loop with an `if` inside. Then compare to the vectorised `sum(x < 0)`.

```r title="Exercise: countnegative with a for loop"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="countnegative solution"
count_negative <- function(x) {
  k <- 0L
  for (v in x) {
    if (v < 0) k <- k + 1L
  }
  k
}

count_negative(c(-2, 3, -1, 0, -4, 5))  # 3
sum(c(-2, 3, -1, 0, -4, 5) < 0)         # 3
```

Both give the same answer. The vectorised version is significantly faster on large vectors and is the idiomatic R style. The loop version is worth writing once so you are comfortable with the alternative.

</details>

### Exercise 12. Early return from a function

Write `first_negative(x)` that returns the first strictly negative element of a numeric vector, or `NA` if there are none. Use `return()` to exit as soon as you find one.

```r title="Exercise: firstnegative with early return"
# Your attempt here

```

<details>
<summary>Solution</summary>

```r title="firstnegative with early return solution"
first_negative <- function(x) {
  for (v in x) {
    if (v < 0) return(v)
  }
  NA_real_
}

first_negative(c(3, 7, -2, 8, -5))  # -2
first_negative(c(1, 2, 3))          # NA

# Vectorised equivalent:
x <- c(3, 7, -2, 8, -5)
x[x < 0][1]  # -2 (or NA if no negatives)
```

`return()` exits the function early. This is one of the few cases where a loop is genuinely simpler than the vectorised alternative, until you remember `x[x < 0][1]`.

</details>

## Summary

- `if` returns a value and can be assigned. Use `else if` for more than two branches.
- `&&` / `||` are for single-value logic inside `if`; `&` / `|` are for element-wise vector logic.
- `ifelse()` and `dplyr::case_when()` are the vectorised alternatives to nested `if/else`.
- `for` loops: pre-allocate the result, loop over `seq_len(n)` or `names(x)`, reach for vectorised alternatives first.
- `while` and `repeat { break }` handle convergence loops. `next` skips to the next iteration.
- `switch()` is clearer than long `if/else` chains when matching one value against many named cases.

## References

- [Advanced R, Control flow](https://adv-r.hadley.nz/control-flow.html)
- [R Language Definition, Flow control](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Control-structures)
- [R for Data Science (2e)](https://r4ds.hadley.nz/)

## Continue Learning

- [R Control Flow: if, else, for, while and Their Pitfalls](R-Control-Flow.html)
- [R Functions Exercises: 10 Problems, Write, Debug & Optimize Functions](R-Functions-Exercises.html)
- [R Lists Exercises: 10 Practice Problems with Full Solutions](R-Lists-Exercises.html)
