---
title: "purrr map() Variants: map, map2, imap, pmap — The Complete Tutorial"
slug: "purrr-map-Variants"
description: "Master every purrr map variant: map(), map2(), imap(), pmap(), and typed variants like map_dbl(). Interactive R examples with real use cases."
keywords: "purrr map, map2 R, imap R, pmap R, purrr tutorial, map_dbl, map_chr, functional programming R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.2.2"
post_type: "C"
auto_link_terms: "purrr map|map2|imap|pmap|map_dbl|map_chr"
auto_link_case_sensitive: false
---

# purrr map() Variants: map, map2, imap, pmap — The Complete Tutorial

<p class="lead">The <code>purrr</code> package gives you a family of <code>map()</code> functions that replace loops with clear, type-safe iteration. This tutorial covers every variant — <code>map()</code>, <code>map2()</code>, <code>imap()</code>, <code>pmap()</code> — with interactive examples.</p>

Base R's `lapply()` applies a function to each element of a list. The purrr package takes that idea and builds an entire family of mapping functions, each designed for a different iteration pattern. Once you learn when to use each variant, loops almost disappear from your code.

## Introduction

The purrr map family solves one problem: apply a function to every element of a collection and collect the results. The variants differ in two ways — how many inputs they take and what output type they guarantee.

| Function | Inputs | Output | Use when... |
|----------|--------|--------|-------------|
| `map(.x, .f)` | 1 list/vector | List | Iterating over one thing |
| `map_dbl(.x, .f)` | 1 list/vector | Double vector | You need a numeric result |
| `map_chr(.x, .f)` | 1 list/vector | Character vector | You need a string result |
| `map_lgl(.x, .f)` | 1 list/vector | Logical vector | You need TRUE/FALSE |
| `map_int(.x, .f)` | 1 list/vector | Integer vector | You need whole numbers |
| `map2(.x, .y, .f)` | 2 lists/vectors | List | Iterating over two things in parallel |
| `imap(.x, .f)` | 1 list + its names/indices | List | You need the name or position |
| `pmap(.l, .f)` | N lists/vectors | List | Iterating over 3+ things in parallel |
| `walk(.x, .f)` | 1 list/vector | Invisible input | Side effects (printing, writing files) |

## Prerequisites

```r
# Install purrr if needed (part of tidyverse)
# install.packages("purrr")
library(purrr)
```

## map(): One Input, One Output

`map()` takes a list (or vector) and applies a function to every element. It always returns a list.

```r
library(purrr)

# Square every number
numbers <- list(1, 4, 9, 16)
map(numbers, sqrt)
```

The typed variants — `map_dbl()`, `map_chr()`, `map_lgl()`, `map_int()` — do the same thing but return a vector of the specified type instead of a list. Use them when you know the output type in advance.

```r
library(purrr)

numbers <- list(1, 4, 9, 16)

# map_dbl returns a numeric vector instead of a list
map_dbl(numbers, sqrt)

# map_chr returns a character vector
map_chr(numbers, ~ paste("Value:", .x))

# map_lgl returns a logical vector
map_lgl(numbers, ~ .x > 5)

# map_int returns an integer vector
map_int(numbers, ~ as.integer(.x * 2))
```

> Use typed variants (`map_dbl`, `map_chr`, etc.) whenever you can. They're faster than `map()` and catch type errors immediately — if one element returns the wrong type, you get a clear error instead of a silent bug.

### The Formula Shorthand (~)

Instead of writing `function(x) x + 1`, purrr lets you write `~ .x + 1`. The tilde `~` creates an anonymous function where `.x` is the first argument.

```r
library(purrr)

names_list <- list("alice", "bob", "carol")

# These three are equivalent:
map_chr(names_list, function(x) toupper(x))
map_chr(names_list, ~ toupper(.x))
map_chr(names_list, toupper)  # Pass the function directly
```

### Extracting Elements by Name or Position

Pass a string or integer to `map()` to extract elements from nested lists — no function needed.

```r
library(purrr)

people <- list(
  list(name = "Alice", age = 30),
  list(name = "Bob", age = 25),
  list(name = "Carol", age = 35)
)

# Extract by name
map_chr(people, "name")

# Extract by position
map_dbl(people, 2)  # Gets age (2nd element)

# Nested extraction
data <- list(
  list(info = list(city = "NYC")),
  list(info = list(city = "LA")),
  list(info = list(city = "Chicago"))
)
map_chr(data, c("info", "city"))
```

## map2(): Two Inputs in Parallel

`map2()` iterates over two vectors simultaneously, passing one element from each to your function.

```r
library(purrr)

# Combine first and last names
first <- c("Alice", "Bob", "Carol")
last <- c("Smith", "Jones", "Lee")

map2_chr(first, last, ~ paste(.x, .y))
```

```r
library(purrr)

# Weighted scores: multiply each score by its weight
scores <- c(88, 92, 76)
weights <- c(0.3, 0.5, 0.2)

map2_dbl(scores, weights, ~ .x * .y)

# Raise each base to its corresponding power
bases <- c(2, 3, 4)
powers <- c(3, 2, 1)
map2_dbl(bases, powers, ~ .x ^ .y)
```

> Use `map2()` when you have exactly two parallel inputs. If one is shorter, it recycles (like base R), but purrr warns you if the lengths aren't compatible.

## imap(): Iterate with Names or Indices

`imap(.x, .f)` is shorthand for `map2(.x, names(.x), .f)` if `.x` has names, or `map2(.x, seq_along(.x), .f)` if it doesn't. Use it when you need both the value and its name or position.

```r
library(purrr)

# Named vector — .y gets the name
scores <- c(Alice = 95, Bob = 82, Carol = 88)
imap_chr(scores, ~ paste(.y, "scored", .x))
```

```r
library(purrr)

# Unnamed list — .y gets the index
fruits <- list("apple", "banana", "cherry")
imap_chr(fruits, ~ paste0(.y, ". ", .x))
```

```r
library(purrr)

# Real use case: label each data frame in a list
datasets <- list(
  training = head(mtcars, 3),
  testing = tail(mtcars, 3)
)

imap(datasets, ~ {
  cat(.y, "has", nrow(.x), "rows and", ncol(.x), "columns\n")
  .x
})
```

## pmap(): Three or More Inputs

When you need to iterate over 3+ vectors in parallel, use `pmap()`. It takes a single list containing all input vectors.

```r
library(purrr)

# Calculate BMI from height, weight, and name
params <- list(
  name = c("Alice", "Bob", "Carol"),
  height_m = c(1.65, 1.80, 1.70),
  weight_kg = c(60, 85, 68)
)

pmap_chr(params, function(name, height_m, weight_kg) {
  bmi <- round(weight_kg / height_m^2, 1)
  paste0(name, ": BMI = ", bmi)
})
```

```r
library(purrr)

# pmap with a data frame — each row becomes one call
configs <- data.frame(
  mean = c(0, 10, 100),
  sd = c(1, 5, 20),
  n = c(3, 3, 3)
)

set.seed(42)
pmap(configs, function(mean, sd, n) {
  round(rnorm(n, mean, sd), 1)
})
```

> A data frame is a list of columns, so `pmap()` over a data frame iterates row by row. Each row's values become the function arguments. This is one of the most powerful patterns in purrr.

## walk(): Side Effects Without Output

`walk()` works like `map()` but returns the input invisibly. Use it for side effects — printing, writing files, or plotting — where you don't need the return value.

```r
library(purrr)

# Print each element (walk is for side effects)
messages <- c("Loading data...", "Fitting model...", "Done!")
walk(messages, ~ cat(.x, "\n"))

# walk2 for two-input side effects
files <- c("data.csv", "model.rds", "report.html")
sizes <- c("2.1 MB", "450 KB", "89 KB")
walk2(files, sizes, ~ cat(.x, "—", .y, "\n"))
```

## Combining map with Other purrr Tools

### map + keep/discard: Filter Results

```r
library(purrr)

numbers <- list(1, -3, 5, -2, 8, -1)

# Keep only positive, then square them
numbers |>
  keep(~ .x > 0) |>
  map_dbl(~ .x^2)
```

### map + reduce: Collapse a List

```r
library(purrr)

# Merge multiple data frames
df1 <- data.frame(id = 1:3, x = c(10, 20, 30))
df2 <- data.frame(id = 2:4, y = c("a", "b", "c"))
df3 <- data.frame(id = 1:3, z = c(TRUE, FALSE, TRUE))

list(df1, df2, df3) |>
  reduce(merge, by = "id", all = TRUE)
```

### Nested map: Lists of Lists

```r
library(purrr)

# Apply different summaries to different columns
data_list <- list(
  a = c(1, 2, 3, 4, 5),
  b = c(10, 20, 30, 40, 50),
  c = c(100, 200, 300, 400, 500)
)

# Get mean, sd, and range for each vector
map(data_list, ~ list(
  mean = mean(.x),
  sd = round(sd(.x), 2),
  range = diff(range(.x))
))
```

## map vs lapply: When to Use Which

| Feature | `lapply()` | `map()` |
|---------|-----------|---------|
| Package | Base R | purrr |
| Formula shorthand | No | Yes (`~ .x + 1`) |
| Typed variants | No | `map_dbl()`, `map_chr()`, etc. |
| Element extraction | No | `map(x, "name")` |
| Multi-input | `mapply()` | `map2()`, `pmap()` |
| Error handling | `tryCatch()` | `safely()`, `possibly()` |
| Dependencies | None | Requires purrr |

Use `lapply()` when you want zero dependencies. Use `map()` when you want the full toolkit — typed outputs, formula shorthand, and composable helpers like `safely()` and `possibly()`.

## Practice Exercises

### Exercise 1: Type-Safe Extraction

Given a list of employees, extract all salaries as a numeric vector and all names as a character vector.

```r
library(purrr)
employees <- list(
  list(name = "Alice", salary = 75000, dept = "Engineering"),
  list(name = "Bob", salary = 82000, dept = "Marketing"),
  list(name = "Carol", salary = 91000, dept = "Engineering"),
  list(name = "David", salary = 68000, dept = "Sales")
)

# Extract all salaries as a numeric vector
# Extract all names as a character vector
# Calculate average salary
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
employees <- list(
  list(name = "Alice", salary = 75000, dept = "Engineering"),
  list(name = "Bob", salary = 82000, dept = "Marketing"),
  list(name = "Carol", salary = 91000, dept = "Engineering"),
  list(name = "David", salary = 68000, dept = "Sales")
)

salaries <- map_dbl(employees, "salary")
names_vec <- map_chr(employees, "name")
cat("Salaries:", salaries, "\n")
cat("Names:", names_vec, "\n")
cat("Average salary:", mean(salaries), "\n")
```

**Explanation:** `map_dbl(list, "name")` extracts the named element and guarantees a double vector. If any salary were missing or non-numeric, you'd get an immediate error.

</details>

### Exercise 2: map2 Greetings

Generate personalized greetings combining names and cities.

```r
library(purrr)
names <- c("Alice", "Bob", "Carol")
cities <- c("New York", "London", "Tokyo")

# Create: "Hello Alice from New York!", etc.
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
names <- c("Alice", "Bob", "Carol")
cities <- c("New York", "London", "Tokyo")

greetings <- map2_chr(names, cities, ~ paste0("Hello ", .x, " from ", .y, "!"))
walk(greetings, ~ cat(.x, "\n"))
```

**Explanation:** `map2_chr()` pairs elements from both vectors. The `~` formula uses `.x` for the first input and `.y` for the second.

</details>

### Exercise 3: pmap with a Parameter Grid

Generate random samples with different parameters using `pmap()`.

```r
library(purrr)
params <- data.frame(
  dist = c("normal", "uniform", "normal"),
  n = c(5, 5, 5),
  param1 = c(0, 0, 100),   # mean for normal, min for uniform
  param2 = c(1, 10, 15)    # sd for normal, max for uniform
)

# Use pmap to generate samples from each row's distribution
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
params <- data.frame(
  dist = c("normal", "uniform", "normal"),
  n = c(5, 5, 5),
  param1 = c(0, 0, 100),
  param2 = c(1, 10, 15),
  stringsAsFactors = FALSE
)

set.seed(42)
samples <- pmap(params, function(dist, n, param1, param2) {
  if (dist == "normal") rnorm(n, param1, param2)
  else runif(n, param1, param2)
})

imap(samples, ~ cat("Row", .y, "(", params$dist[as.integer(.y)], "):", round(.x, 2), "\n"))
```

**Explanation:** `pmap()` takes a data frame and iterates row by row. Each column name must match the function argument names. This is powerful for parameter sweeps and simulations.

</details>

## Summary

| Variant | Inputs | When to use |
|---------|--------|-------------|
| `map()` | 1 | One list/vector, return a list |
| `map_dbl/chr/lgl/int()` | 1 | One list/vector, return a typed vector |
| `map2()` | 2 | Two parallel inputs |
| `imap()` | 1 + names/indices | Need the name or position alongside the value |
| `pmap()` | N | Three or more parallel inputs, or row-wise data frame iteration |
| `walk()` | 1 | Side effects only (printing, saving) |

## FAQ

### What does the ~ (tilde) mean in purrr functions?

The tilde creates a one-sided formula that purrr converts to an anonymous function. `~ .x + 1` becomes `function(.x) .x + 1`. In `map2()`, use `.x` for the first argument and `.y` for the second. In `pmap()`, use `..1`, `..2`, `..3` or named arguments.

### When should I use map() vs lapply()?

Use `lapply()` in packages or scripts where you want zero dependencies. Use `map()` when you want typed output (`map_dbl`), formula shorthand (`~`), element extraction by name, or error-handling wrappers like `safely()`. In interactive analysis, purrr is almost always more convenient.

### How does pmap() handle data frames?

A data frame is a list of equal-length vectors (columns). When you pass a data frame to `pmap()`, it iterates row by row, passing each column value as a named argument to your function. Column names must match function parameter names.

### What happens if map_dbl() gets a non-numeric result?

It throws an error immediately: "Result 1 must be a single double, not ...". This is the point of typed variants — they fail fast on unexpected types instead of silently producing a mixed-type list.

## Continue Learning

- [Functional Programming in R](/Functional-Programming-in-R.html) — the foundation: first-class functions and closures
- [R Anonymous Functions](/R-Anonymous-Functions.html) — deep dive into `\(x)` syntax and when to use lambdas
- [R Function Factories](/R-Function-Factories.html) — functions that create functions
