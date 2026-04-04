---
title: "R Lists: When Data Frames Aren't Flexible Enough"
slug: "R-Lists"
description: "Master R lists — create, subset, modify, and nest. Lists hold mixed types and lengths, making them R's most flexible data structure and the basis of data frames."
keywords: "R lists, list() in R, nested lists, list subsetting, [[ vs [, lapply, list manipulation R"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.8"
post_type: "C"
auto_link_terms: "R lists|list in R|nested lists|list() function"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Lists"
sidebar_order: 8
---

<nav class="breadcrumb-nav">Home &gt; Learn R &gt; Fundamentals &gt; R Lists</nav>

# R Lists: When Data Frames Aren't Flexible Enough

<p class="lead">A list is R's most flexible data structure — it can hold any combination of types, lengths, and nested structures. Every data frame is secretly a list. When you outgrow rectangular data, lists are where you go.</p>

## Introduction

A vector holds same-type values. A data frame holds equal-length vectors. A **list** holds anything — numbers, strings, vectors, data frames, even other lists — with no length or type constraints.

This tutorial covers how to create lists, access elements with `[[`, `[`, and `$`, add and remove elements, nest lists, and iterate with `lapply()`. Every example runs live in your browser.

By the end you'll understand why data frames behave like lists (they ARE lists) and when to reach for a list instead of a data frame.

## How do you create a list in R?

Use `list()` with named or unnamed arguments. Each argument becomes an element.

![R List Structure](screenshots/R-Lists-structure.webp)
*Figure 1: A list can hold mixed types, lengths, and nested structures.*

```r
# Mixed types in one container
person <- list(
  name = "Alice",
  age = 30,
  scores = c(85, 92, 78),
  active = TRUE
)
person
#> $name
#> [1] "Alice"
#>
#> $age
#> [1] 30
#>
#> $scores
#> [1] 85 92 78
#>
#> $active
#> [1] TRUE
```

Four elements, four different types and lengths: a string, a number, a 3-element vector, a logical. Lists are the only R structure that holds this mix naturally.

[KEY INSIGHT]
**A data frame is a list of equal-length vectors with `class = "data.frame"`.** This is why `df$col` works — it's list-style access. Understanding this equivalence unlocks most of R's advanced tricks.

## How do you access list elements?

Lists have three access operators: `[[`, `[`, and `$`. Each does something subtly different.

```r
person <- list(name = "Alice", age = 30, scores = c(85, 92, 78))

# [[ ]] returns the element itself
person[["name"]]
#> [1] "Alice"
person[[2]]
#> [1] 30

# $ is shorthand for [[ ]] with names
person$name
#> [1] "Alice"

# [ ] returns a SUBLIST — still a list
person["name"]
#> $name
#> [1] "Alice"

class(person[["name"]])
#> [1] "character"
class(person["name"])
#> [1] "list"
```

The critical distinction: `[[` and `$` return the **content** of an element (unwrapped). `[` returns a **sublist** containing that element (still wrapped). 90% of bugs involving lists come from using `[` when you meant `[[`.

[WARNING]
**`list[i]` returns a list; `list[[i]]` returns the element.** If you compute with `list[i]` you'll get type errors. Remember: double brackets unwrap, single brackets filter.

## How do you modify a list?

Add elements with `$` or `[[ ]]`, remove with `NULL`, update with assignment.

```r
person <- list(name = "Alice", age = 30)

# Add an element
person$city <- "Mumbai"
person$email <- "alice@example.com"
names(person)
#> [1] "name"  "age"   "city"  "email"

# Update an existing element
person$age <- 31
person$age
#> [1] 31

# Remove an element (assign NULL)
person$email <- NULL
names(person)
#> [1] "name" "age"  "city"

# Add a nested list
person$address <- list(street = "MG Road", pincode = "400001")
person$address$pincode
#> [1] "400001"
```

Assignment grows the list. Assigning `NULL` deletes. Lists can contain lists, so you can build arbitrary depth.

## How do you iterate over a list?

Use `lapply()` to apply a function to every element. It returns a new list. `sapply()` returns a simplified vector when possible.

```r
numbers <- list(a = 1:3, b = 4:6, c = 7:9)

# Apply mean to each element
lapply(numbers, mean)
#> $a
#> [1] 2
#>
#> $b
#> [1] 5
#>
#> $c
#> [1] 8

# sapply simplifies to a vector
sapply(numbers, mean)
#> a b c
#> 2 5 8

# sapply with sum
sapply(numbers, sum)
#>  a  b  c
#>  6 15 24
```

`lapply()` always returns a list of the same length. `sapply()` tries to simplify the result to a vector or matrix when shapes match. Use `sapply()` for quick summaries; `lapply()` for safety when you want predictable output types.

[TIP]
**When a function returns a list and you want one element from each, use `lapply()` then extract.** Example: `lapply(model_list, function(m) m$coefficients)` pulls coefficients from a list of fitted models.

## Common Mistakes and How to Fix Them

### Mistake 1: Using `[` when you meant `[[`

❌ **Wrong:**
```r
my_list <- list(x = 1:5, y = 10:14)
result <- my_list["x"] + 1
#> Error in my_list["x"] + 1 : non-numeric argument to binary operator
```

**Why it is wrong:** `my_list["x"]` returns a sublist (still a list), and you can't add 1 to a list.

✅ **Correct:**
```r
my_list <- list(x = 1:5, y = 10:14)
result <- my_list[["x"]] + 1
result
#> [1] 2 3 4 5 6
```

### Mistake 2: Forgetting `NULL` deletes an element

❌ **Wrong:**
```r
my_list <- list(a = 1, b = 2, c = 3)
my_list$b <- "remove it"  # actually replaces with a string
my_list
#> $a
#> [1] 1
#>
#> $b
#> [1] "remove it"
#>
#> $c
#> [1] 3
```

**Why it is wrong:** To delete, assign `NULL`. Assigning any other value just overwrites.

✅ **Correct:**
```r
my_list <- list(a = 1, b = 2, c = 3)
my_list$b <- NULL
my_list
#> $a
#> [1] 1
#>
#> $c
#> [1] 3
```

### Mistake 3: Mixing `[` and `[[` returns wrong type

❌ **Wrong:**
```r
my_list <- list(nums = c(10, 20, 30))
# Trying to get the second number
my_list["nums"][2]
#> $<NA>
#> NULL
```

**Why it is wrong:** `my_list["nums"]` returns a 1-element sublist, then `[2]` tries to access its second element (there isn't one).

✅ **Correct:**
```r
my_list <- list(nums = c(10, 20, 30))
my_list[["nums"]][2]   # unwrap first, then index
#> [1] 20
```

### Mistake 4: `sapply()` returning unexpected shapes

❌ **Wrong:**
```r
# When results have different lengths, sapply returns a list (not simplified)
my_list <- list(a = 1:3, b = 1:5)
result <- sapply(my_list, function(x) x * 2)
class(result)
#> [1] "list"
```

**Why it is wrong:** `sapply()` can only simplify when all results have the same shape. Different lengths → list.

✅ **Correct:**
```r
# Use lapply() when you want predictable list output
result <- lapply(my_list, function(x) x * 2)
class(result)
#> [1] "list"
# Or use vapply() for strict type checking
```

## Practice Exercises

### Exercise 1: Build a List

Create a list `my_book` with 4 elements: title (character), author (character), year (numeric), chapters (vector of chapter names).

```r
# Exercise: build a book list

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_book <- list(
  title = "Advanced R",
  author = "Hadley Wickham",
  year = 2019,
  chapters = c("Names and values", "Vectors", "Subsetting", "Functions")
)
my_book$title
#> [1] "Advanced R"
length(my_book$chapters)
#> [1] 4
```

**Explanation:** `list()` with named arguments packages mixed types into one object.

</details>

### Exercise 2: Extract an Element

From `my_book`, extract just the `chapters` vector (not a sublist).

```r
my_book <- list(title = "R4DS", chapters = c("Import", "Tidy", "Transform"))
# Exercise: extract chapters as a vector (not a list)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_book <- list(title = "R4DS", chapters = c("Import", "Tidy", "Transform"))
my_chapters <- my_book[["chapters"]]
my_chapters
#> [1] "Import"    "Tidy"      "Transform"
class(my_chapters)
#> [1] "character"
```

**Explanation:** `[[` unwraps the element, returning the character vector directly.

</details>

### Exercise 3: Add to a Nested List

Add a new chapter "Functions" to `my_book$chapters`.

```r
my_book <- list(title = "R4DS", chapters = c("Import", "Tidy"))
# Exercise: append "Functions" to the chapters vector

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_book <- list(title = "R4DS", chapters = c("Import", "Tidy"))
my_book$chapters <- c(my_book$chapters, "Functions")
my_book$chapters
#> [1] "Import"    "Tidy"      "Functions"
```

**Explanation:** Extract with `$`, modify with `c()`, assign back.

</details>

### Exercise 4: Iterate with lapply

Given a list of numeric vectors, compute the maximum of each using `lapply()`.

```r
my_data <- list(group_a = c(3, 7, 2, 9), group_b = c(5, 1, 8), group_c = c(4, 6))
# Exercise: max of each element using lapply

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_data <- list(group_a = c(3, 7, 2, 9), group_b = c(5, 1, 8), group_c = c(4, 6))
my_maxes <- lapply(my_data, max)
my_maxes
#> $group_a
#> [1] 9
#>
#> $group_b
#> [1] 8
#>
#> $group_c
#> [1] 6
```

**Explanation:** `lapply()` applies `max` to each element, returning a list of scalars.

</details>

### Exercise 5: Flatten a Named List to a Vector

Given a named list of single numbers, convert it to a named numeric vector.

```r
my_list <- list(alpha = 1.5, beta = 2.3, gamma = 0.8)
# Exercise: convert to a named numeric vector
# Hint: unlist()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_list <- list(alpha = 1.5, beta = 2.3, gamma = 0.8)
my_vec <- unlist(my_list)
my_vec
#> alpha  beta gamma
#>   1.5   2.3   0.8
class(my_vec)
#> [1] "numeric"
```

**Explanation:** `unlist()` flattens a list into a vector, preserving names. Works when all elements are the same type (or can be coerced).

</details>

## Complete Example: Storing a Linear Model's Results

The `lm()` function returns a list. Here's how to explore and extract from it.

```r
# --- Inspecting a model object ---

# Step 1: Fit a model — returns a list
model <- lm(mpg ~ wt + hp, data = mtcars)
class(model)
#> [1] "lm"

# Step 2: What's inside?
names(model)
#>  [1] "coefficients"  "residuals"     "effects"       "rank"
#>  [5] "fitted.values" "assign"        "qr"            "df.residual"
#>  [9] "xlevels"       "call"          "terms"         "model"

# Step 3: Extract specific components
model$coefficients
#> (Intercept)          wt          hp
#> 37.22727012 -3.87783074 -0.03177295

length(model$residuals)
#> [1] 32
head(model$fitted.values, 3)
#> Mazda RX4 Mazda RX4 Wag    Datsun 710
#>  23.57233      22.58348      25.27582

# Step 4: Build your own results list
my_results <- list(
  formula = "mpg ~ wt + hp",
  coefs = model$coefficients,
  rsquared = summary(model)$r.squared,
  n_obs = length(model$residuals)
)
my_results
#> $formula
#> [1] "mpg ~ wt + hp"
#>
#> $coefs
#> (Intercept)          wt          hp
#> 37.22727012 -3.87783074 -0.03177295
#>
#> $rsquared
#> [1] 0.8267855
#>
#> $n_obs
#> [1] 32
```

R's `lm()` returns a list with 12+ components. You explored it with `names()`, extracted pieces with `$`, and repackaged what you needed into your own compact list. This pattern — explore, extract, repackage — is how you work with every R statistical function.

## Summary

| Operation | Syntax | Example |
|---|---|---|
| Create | `list(...)` | `list(a = 1, b = "x")` |
| Element | `L[[i]]` or `L$name` | `person$name` |
| Sublist | `L[i]` | `person[1:2]` |
| Add | `L$new <- value` | `L$extra <- 5` |
| Remove | `L$name <- NULL` | `L$extra <- NULL` |
| Iterate | `lapply(L, FUN)` | `lapply(L, mean)` |
| Iterate, simplify | `sapply(L, FUN)` | `sapply(L, sum)` |
| Flatten | `unlist(L)` | `unlist(named_list)` |
| Names | `names(L)` | `names(L) <- c("a","b")` |
| Length | `length(L)` | `length(L)` |

## FAQ

### When should I use a list instead of a data frame?

Use a list when your elements have different lengths or structures. Use a data frame when your data is rectangular (equal-length columns). Examples of list-shaped data: a model's output, a config object, a tree structure, a JSON response.

### How do I check if an element exists in a list?

Use `"name" %in% names(my_list)` or `!is.null(my_list[["name"]])`. The `%in%` version is more readable.

### What's the difference between `lapply()` and `map()` from purrr?

Both apply a function to each element. `purrr::map()` has consistent return-type variants (`map_dbl`, `map_chr`, `map_df`) and anonymous function shortcuts (`~ .x * 2`). In base R, `lapply()` + `sapply()` + `vapply()` cover the same needs with more typing.

### How do I convert a list to a data frame?

If elements have equal length, `data.frame(my_list)` works. For more complex conversions, `do.call(rbind, list_of_rows)` or `dplyr::bind_rows()` handle row-oriented lists of lists.

### Can a list contain itself (recursion)?

Yes — R supports recursive lists. This creates infinite-depth structures, useful for trees and graphs. Use `rapply()` or recursive helper functions to traverse them.

## References

1. R Core Team — *An Introduction to R*, Chapter 6 (Lists and data frames). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 3.6 (Lists). [Link](https://adv-r.hadley.nz/vectors-chap.html#lists)
3. R manual — `list()` reference (stat.ethz.ch). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/list.html)
4. R manual — `lapply` family reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html)
5. R manual — `Extract` for lists. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extract.html)
6. Wickham, H. — *Advanced R*, Chapter 20 (Subsetting). [Link](https://adv-r.hadley.nz/subsetting.html)
7. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 23 (Hierarchical data). [Link](https://r4ds.hadley.nz/rectangling.html)

## What's Next?

- **[R Subsetting](R-Subsetting.html)** — deep dive on `[`, `[[`, `$`, and `@` across all R objects.
- **[purrr map() Variants](purrr-map-Variants.html)** — the modern tidyverse way to work with lists.
- **[R Control Flow](R-Control-Flow.html)** — `if`/`else`, `for`, `while` to write logic around lists.
