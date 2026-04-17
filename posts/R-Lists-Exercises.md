---
title: "R Lists Exercises: 10 Practice Problems with Full Solutions"
slug: "R-Lists-Exercises"
description: "10 interactive R list exercises with worked solutions, create, subset with [ vs [[, nest, modify, iterate with lapply/sapply, flatten and convert to data frames."
keywords: "R lists exercises, R list practice, R lapply exercises, R nested list, R list subsetting"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.4"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Lists (10 problems)"
auto_link_terms: "R lists exercises|R list practice|R list subsetting"
auto_link_case_sensitive: false
fr_parent: "R-Lists.html"
difficulty: "Intermediate"
---

# R Lists Exercises: 10 Practice Problems with Full Solutions

<p class="lead">Ten hands-on exercises on R lists, the most flexible data structure in the language. You will build, nest, subset with the tricky <code>[</code> vs <code>[[</code> rule, iterate with <code>lapply</code>/<code>sapply</code>, and convert between lists and data frames. Every problem runs in the browser.</p>

A list in R can hold anything: numbers, strings, data frames, other lists, even functions. That flexibility makes lists both indispensable (every `lm()` result is a list) and confusing (two different subsetting operators that return different things). These exercises fix the confusion by forcing you to use both operators deliberately.

## Setup

The code blocks share state across the whole page. We will build one list in Exercise 1 and keep using it.

## Section 1, Create and inspect

### Exercise 1. Build a heterogeneous list

Create a list called `profile` with four elements: `name = "Ada"`, `age = 37`, `skills = c("R", "Python", "SQL")`, and `employed = TRUE`. Confirm its length and print its `str()`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
profile <- list(
  name     = "Ada",
  age      = 37,
  skills   = c("R", "Python", "SQL"),
  employed = TRUE
)

length(profile)  # 4
str(profile)
# List of 4
#  $ name    : chr "Ada"
#  $ age     : num 37
#  $ skills  : chr [1:3] "R" "Python" "SQL"
#  $ employed: logi TRUE
```

Unlike a vector, a list does not coerce its elements to a common type. Each element keeps its own type.

</details>

### Exercise 2. Inspect a built-in list (a linear model)

Fit `m <- lm(mpg ~ wt, data = mtcars)`. Confirm that `m` is a list, report its class and its names.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
m <- lm(mpg ~ wt, data = mtcars)

is.list(m)  # TRUE
class(m)    # "lm"
names(m)
# "coefficients" "residuals" "effects" "rank" ...
```

Almost every model object in R is a list with a class attribute. Knowing this is why you can write `m$coefficients` or `m$residuals` directly.

</details>

## Section 2, The `[` vs `[[` rule

### Exercise 3. Predict the type

For the `profile` list, predict the class and length of each of the following *before* running them:

```r
profile["age"]
profile[["age"]]
profile$age
profile[c("name", "age")]
```

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
class(profile["age"])        # "list"
length(profile["age"])       # 1

class(profile[["age"]])      # "numeric"
length(profile[["age"]])     # 1

class(profile$age)           # "numeric"   — same as [[ ]]
length(profile$age)          # 1

class(profile[c("name", "age")])   # "list"
length(profile[c("name", "age")])  # 2
```

The rule: **`[` keeps the container (always returns a list), `[[` extracts the contents (returns whatever is inside)**. `$` is a shortcut for `[[` that only accepts literal names.

</details>

### Exercise 4. Modify an element

Change `profile$age` to 38, and append a new element `city = "Brisbane"` to the list.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
profile$age <- 38
profile[["city"]] <- "Brisbane"

names(profile)
# "name" "age" "skills" "employed" "city"
profile$city     # "Brisbane"
```

Assigning to an index that does not exist creates the element. Setting it to `NULL` removes it: `profile$city <- NULL`.

</details>

## Section 3, Nested lists

### Exercise 5. Create a nested list

Create `team` as a list of three members. Each member is itself a list with `name`, `role` and `years`. Use any made-up values.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
team <- list(
  list(name = "Ava",  role = "analyst",  years = 3),
  list(name = "Ben",  role = "engineer", years = 5),
  list(name = "Cho",  role = "manager",  years = 8)
)

length(team)            # 3
team[[1]]$name          # "Ava"
team[[2]]$role          # "engineer"
```

Each element of `team` is itself a list. `team[[1]]` extracts the first member (a list), then `$name` drills into it.

</details>

### Exercise 6. Drill down two levels

From `team`, return (a) the name of the third member, (b) the role of the second member, and (c) a vector of *all three* members' years of experience.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
team[[3]]$name       # "Cho"
team[[2]]$role       # "engineer"

sapply(team, function(m) m$years)
# 3 5 8
```

`sapply()` walks the top-level list and applies a function to each element, simplifying the result to a vector. This is how you extract parallel columns from a list of lists.

</details>

## Section 4, Iteration

### Exercise 7. lapply on a list of numbers

Create `nums <- list(a = 1:5, b = 6:10, c = 11:20)`. Use `lapply()` to compute the mean of each element, and `sapply()` to do the same thing and get a named vector.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
nums <- list(a = 1:5, b = 6:10, c = 11:20)

lapply(nums, mean)
# $a: 3
# $b: 8
# $c: 15.5

sapply(nums, mean)
#    a    b    c
#  3.0  8.0 15.5
```

`lapply()` always returns a list with the same length as its input. `sapply()` tries to simplify the list to a vector or matrix when every element has the same shape. When the shapes differ, `sapply()` quietly falls back to a list, so read your output.

</details>

### Exercise 8. Apply with extra arguments

Using `nums`, use `sapply()` to compute the mean of each element *ignoring* the first value. Hint: you can pass extra arguments to the applied function.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
sapply(nums, function(x) mean(x[-1]))
#    a    b    c
#  3.5  8.5 16.0

# Or with a formula-style anonymous function (base R 4.1+):
sapply(nums, \(x) mean(x[-1]))
```

The anonymous function gives you full control over what happens to each element. The `\(x)` form is the modern shorthand for `function(x)`.

</details>

## Section 5, Conversion and flattening

### Exercise 9. Flatten to a vector

Convert `nums` (a list of numeric vectors) into a single flat numeric vector, then into a character vector with every element joined by ", ".

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
flat <- unlist(nums)
flat
#  a1  a2  a3  a4  a5  b1  b2  ... c10
#   1   2   3   4   5   6   7  ...  20

paste(flat, collapse = ", ")
# "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20"
```

`unlist()` recursively flattens the list and attaches sensible names combining the list name and vector position. Use `unlist(x, use.names = FALSE)` if you do not want the names.

</details>

### Exercise 10. Convert a list of records to a data frame

Convert `team` (a list of three lists with the same fields) into a data frame with one row per team member.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
team_df <- do.call(rbind.data.frame, team)
team_df
#   name     role years
# 1  Ava  analyst     3
# 2  Ben engineer     5
# 3  Cho  manager     8

# Or with a more modern idiom:
# do.call(rbind, lapply(team, as.data.frame))
```

`do.call(rbind.data.frame, team)` is the base R one-liner for converting a list of equally shaped records into a data frame. For anything larger or messier, `dplyr::bind_rows(team)` handles mismatched fields gracefully.

</details>

## Summary

- A list can hold elements of any type, including other lists, data frames and functions.
- `[` returns a list (the container). `[[` and `$` return the element inside. This is the single most important rule about lists.
- Build nested lists by passing lists as list elements. Drill down with chained `[[` and `$`.
- `lapply()` always returns a list; `sapply()` simplifies when it can.
- Flatten with `unlist()`. Convert a list of records to a data frame with `do.call(rbind.data.frame, x)` or `dplyr::bind_rows(x)`.

## References

- [Advanced R, Subsetting](https://adv-r.hadley.nz/subsetting.html)
- [R for Data Science (2e), Iteration](https://r4ds.hadley.nz/iteration.html)
- [R Language Definition, Lists](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#List-objects)

## Continue Learning

- [R Lists: The Most Flexible Data Structure in R](R-Lists.html)
- [R Data Frames Exercises: 15 Practice Questions](R-Data-Frames-Exercises.html)
- [R Control Flow Exercises: 12 if/else, Loop & Function Practice Problems](R-Control-Flow-Exercises.html)
