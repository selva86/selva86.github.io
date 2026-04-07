---
title: "R Subsetting: [, [[, $, @ Explained Clearly"
slug: "R-Subsetting"
description: "Master R subsetting — [] filters, [[]] unwraps, $ is named shorthand, @ is for S4. One definitive rule for each operator, with interactive examples."
keywords: "R subsetting, [ vs [[ R, $ operator R, @ slot R, R indexing, list subsetting, data frame subsetting"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "FR-fund-3"
post_type: "C"
auto_link_terms: "R subsetting|subsetting in R|[[ vs [|single bracket vs double"
auto_link_case_sensitive: false
fr_parent: "R-Vectors.html"
sidebar_section: "Learn R"
sidebar_title: "R Subsetting"
---


# R Subsetting: [, [[, $, @ Explained Clearly

<p class="lead">R has four subsetting operators: <code>[</code> filters (returns the same type), <code>[[</code> extracts (unwraps one element), <code>$</code> is named-element shorthand, and <code>@</code> accesses S4 slots. Knowing when to use each is one of R's biggest beginner hurdles.</p>

## Introduction

R's subsetting system is powerful but notoriously confusing. The same operator behaves differently on vectors, lists, and data frames. This tutorial gives you one clear mental rule for each operator and shows every combination with interactive examples.

By the end you'll know instantly which operator to reach for and never again stare at an unexpected `<NA>` wondering why your list returned the wrong thing.

## What's the difference between `[` and `[[`?

**`[` preserves the container type. `[[` unwraps one element.**

```r
my_list <- list(a = 1:5, b = "hello", c = TRUE)

# [ returns a sublist (still a list)
my_list[1]
#> $a
#> [1] 1 2 3 4 5

class(my_list[1])
#> [1] "list"

# [[ returns the element itself (unwrapped)
my_list[[1]]
#> [1] 1 2 3 4 5

class(my_list[[1]])
#> [1] "integer"
```

`my_list[1]` returns a list containing element 1. `my_list[[1]]` returns element 1 directly. On vectors, `[` and `[[` behave similarly for single elements, but `[` can return multiple while `[[` always returns exactly one.

[KEY INSIGHT]
**Use `[` when you want the same container type back. Use `[[` when you want the single element out.** If you're going to compute with the result, you probably want `[[`.

## How does `$` work?

`$name` is shorthand for `[["name"]]` — it unwraps a named element. Works on lists and data frames.

```r
person <- list(name = "Alice", age = 30)

person$name
#> [1] "Alice"

# Same as
person[["name"]]
#> [1] "Alice"
```

`$` only accepts bare names (not variables holding names). For dynamic access, use `[[var]]`:

```r
person <- list(name = "Alice", age = 30)
field <- "name"

person$field      # doesn't work — looks for literal "field"
#> NULL

person[[field]]   # correct — uses value of field variable
#> [1] "Alice"
```

[TIP]
**Use `$` for interactive exploration. Use `[[` when the name comes from a variable.** `$` is shorter but limited; `[[` handles all cases.

## How does subsetting work on vectors?

Vectors have four subsetting modes: positive integers, negative integers, logical vectors, and character names.

```r
x <- c(a = 10, b = 20, c = 30, d = 40, e = 50)

# Positive integers — keep these positions
x[c(1, 3)]
#>  a  c
#> 10 30

# Negative integers — drop these positions
x[-c(1, 3)]
#>  b  d  e
#> 20 40 50

# Logical vector — keep where TRUE
x[c(TRUE, FALSE, TRUE, FALSE, TRUE)]
#>  a  c  e
#> 10 30 50

# Character names
x[c("b", "d")]
#>  b  d
#> 20 40

# Zero — returns empty vector
x[0]
#> named integer(0)
```

The four modes don't mix — you can't combine positive and negative indices in the same call.

## How does subsetting work on lists?

Lists support `[`, `[[`, and `$`. Each does something different.

```r
L <- list(a = 1:3, b = "hi", c = list(x = 10, y = 20))

# [ returns sublists
L[c("a", "b")]
#> $a
#> [1] 1 2 3
#>
#> $b
#> [1] "hi"

# [[ returns a single element
L[["a"]]
#> [1] 1 2 3

# $ is shorthand
L$b
#> [1] "hi"

# Chained [[ for nested lists
L[["c"]][["x"]]
#> [1] 10

# $ chains too
L$c$x
#> [1] 10
```

For nested lists, chain `[[` or use a vector of names: `L[[c("c", "x")]]` is equivalent to `L[["c"]][["x"]]`.

## How does subsetting work on data frames?

Data frames are lists of columns, so list-style subsetting works. But they also support 2D `[row, col]` indexing.

```r
df <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  age = c(22, 25, 23),
  score = c(85, 72, 91)
)

# 2D indexing — [row, col]
df[1, ]           # row 1, all columns
#>    name age score
#> 1 Alice  22    85

df[, "name"]      # all rows, name column
#> [1] "Alice" "Bob"   "Carol"

df[1, "name"]     # row 1, name column
#> [1] "Alice"

# List-style column access
df$age
#> [1] 22 25 23

df[["age"]]
#> [1] 22 25 23

df["age"]         # returns a data frame with just age column
#>   age
#> 1  22
#> 2  25
#> 3  23

# Filter rows with logical
df[df$score >= 80, ]
#>    name age score
#> 1 Alice  22    85
#> 3 Carol  23    91
```

Key: `df[, "col"]` returns a vector (by default); `df["col"]` returns a single-column data frame. They look almost identical but behave differently.

## What is the `@` operator?

`@` accesses **slots** in S4 objects. Most everyday R uses S3 (no slots) or data frames (no slots), but formal statistical models sometimes use S4.

```r
# Create an S4 object (rare in typical use)
setClass("Person", representation(name = "character", age = "numeric"))
p <- new("Person", name = "Alice", age = 30)

p@name
#> [1] "Alice"
p@age
#> [1] 30
```

Use `@` for S4 objects only. If unsure whether an object is S4, check with `isS4(obj)`.

[NOTE]
**Most R objects use S3, not S4. You rarely see `@` in day-to-day analysis code.** S4 is common in Bioconductor packages and formal class definitions.

## Common Mistakes and How to Fix Them

### Mistake 1: Using `[` where you need `[[`

❌ **Wrong:**
```r
my_list <- list(x = 1:5, y = 10)
my_result <- my_list["x"] + 1
#> Error in my_list["x"] + 1 : non-numeric argument to binary operator
```

**Why it is wrong:** `my_list["x"]` is a sublist, not a vector. Can't add 1 to a list.

✅ **Correct:**
```r
my_list <- list(x = 1:5, y = 10)
my_result <- my_list[["x"]] + 1
my_result
#> [1] 2 3 4 5 6
```

### Mistake 2: `$` with variable name

❌ **Wrong:**
```r
my_field <- "age"
my_df <- data.frame(name = "A", age = 30)
my_df$my_field
#> NULL
```

**Why it is wrong:** `$` treats `my_field` as a literal column name, not a variable.

✅ **Correct:**
```r
my_field <- "age"
my_df <- data.frame(name = "A", age = 30)
my_df[[my_field]]
#> [1] 30
```

### Mistake 3: `df[, "col"]` vs `df["col"]` confusion

❌ **Wrong (when you expected a vector):**
```r
my_df <- data.frame(x = 1:3, y = 4:6)
ages <- my_df["x"]
ages * 2
#>   x
#> 1 2
#> 2 4
#> 3 6
# ^ still a data frame, not a vector
```

✅ **Correct:**
```r
my_df <- data.frame(x = 1:3, y = 4:6)
ages <- my_df[, "x"]        # or my_df$x
ages * 2
#> [1] 2 4 6
```

### Mistake 4: Forgetting the comma in df[,col]

❌ **Wrong:**
```r
my_df <- data.frame(a = 1:3, b = 4:6, c = 7:9)
my_df[1]     # returns a data frame, not row 1
#>   a
#> 1 1
#> 2 2
#> 3 3
```

**Why it is wrong:** Without the comma, `[1]` is list-style (first column). With the comma, `[1, ]` is 2D row indexing.

✅ **Correct:**
```r
my_df <- data.frame(a = 1:3, b = 4:6, c = 7:9)
my_df[1, ]   # first row
#>   a b c
#> 1 1 4 7
```

## Practice Exercises

### Exercise 1: `[` vs `[[`

Given a list, extract the second element as a vector (not a sublist).

```r
my_L <- list(nums = 1:5, chars = c("a", "b"), flag = TRUE)
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_L <- list(nums = 1:5, chars = c("a", "b"), flag = TRUE)
my_chars <- my_L[[2]]
# or my_L[["chars"]]
my_chars
#> [1] "a" "b"
class(my_chars)
#> [1] "character"
```

</details>

### Exercise 2: Dynamic Name Access

Given a variable holding a column name, extract that column from mtcars.

```r
my_colname <- "mpg"
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_colname <- "mpg"
my_col <- mtcars[[my_colname]]
# or mtcars[, my_colname]
head(my_col)
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1
```

</details>

### Exercise 3: Nested Subsetting

Extract the value `20` from the nested list.

```r
my_nested <- list(a = 1, b = list(x = 10, y = 20, z = 30))
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_nested <- list(a = 1, b = list(x = 10, y = 20, z = 30))
my_value <- my_nested$b$y
# or my_nested[["b"]][["y"]]
my_value
#> [1] 20
```

</details>

### Exercise 4: Filter Data Frame

From mtcars, extract rows where `cyl == 4` using logical subsetting.

```r
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_four_cyl <- mtcars[mtcars$cyl == 4, ]
head(my_four_cyl)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Datsun 710     22.8   4 108.0  93 3.85 2.320 18.61  1  1    4    1
#> Merc 240D      24.4   4 146.7  62 3.69 2.320 20.00  1  0    4    2
#> ...
```

</details>

### Exercise 5: Vectors, Negative Indices

Create `x <- c(10, 20, 30, 40, 50)`. Drop the first and last elements using negative indices.

```r
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_x <- c(10, 20, 30, 40, 50)
my_inner <- my_x[-c(1, length(my_x))]
my_inner
#> [1] 20 30 40
```

</details>

## Complete Example: Extracting Coefficients from a Model

```r
# --- Mix of list and vector subsetting ---

# Fit a model (returns a list)
fit <- lm(mpg ~ wt + hp, data = mtcars)
class(fit)
#> [1] "lm"

# See what's inside
names(fit)
#>  [1] "coefficients"  "residuals"     "effects"       "rank"
#>  [5] "fitted.values" "assign"        "qr"            "df.residual"
#>  [9] "xlevels"       "call"          "terms"         "model"

# Extract coefficients as a named vector
coefs <- fit$coefficients
coefs
#> (Intercept)          wt          hp
#> 37.22727012 -3.87783074 -0.03177295

# Get just the slope for wt
slope_wt <- coefs["wt"]
# or fit$coefficients[["wt"]]
slope_wt
#>        wt
#> -3.877831

# Extract rows with largest residuals
big_resid <- fit$residuals[abs(fit$residuals) > 3]
big_resid
#>   Chrysler Imperial          Fiat 128          Toyota Corolla
#>            5.793210          6.872711                6.422779
```

This real example uses `$` to pull from a list, `[` to filter a named vector by name, and logical `[` to filter by condition. One small pipeline uses three subsetting operators.

## Summary

| Operator | Input | Returns | Use when |
|---|---|---|---|
| `x[i]` | vector | Same-type vector | Keep/drop multiple elements |
| `L[i]` | list | Sublist | Keep list structure |
| `L[[i]]` | list | Single element | Unwrap one element |
| `L$name` | list | Single element | Named access, bare literal name |
| `L[[var]]` | list | Single element | Dynamic name from variable |
| `df[i, j]` | data frame | Data frame or vector | 2D access |
| `df[, j]` | data frame | Vector (default) | One column as vector |
| `df[j]` | data frame | 1-column data frame | Keep data frame shape |
| `obj@slot` | S4 object | Slot value | S4 object access |

## FAQ

### When does `[` drop to a vector?

For data frames, `df[, "col"]` drops to a vector by default. Use `df[, "col", drop = FALSE]` to keep a data frame. For vectors, `[` always returns a vector of the same type.

### What if my column name has spaces or special characters?

Use backticks with `$`: `df$`column name``. Or use `[[]]`: `df[["column name"]]`.

### Can I use `[[]]` with multiple indices?

Yes, but it's recursive extraction: `L[[c("a", "b")]]` is the same as `L[["a"]][["b"]]`. Use sparingly — it's confusing.

### Why does `list[[]]` sometimes return NULL instead of an error?

Accessing a non-existent name returns `NULL` silently: `list(a=1)[["z"]]` returns `NULL`. For a missing position index, it errors. Use `"name" %in% names(L)` to check first.

### What's the difference between `df$col <- NULL` and `df[, "col"] <- NULL`?

`df$col <- NULL` removes the column (works). `df[, "col"] <- NULL` errors because `[, col]` expects values. Use `$<- NULL` to delete.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 4 (Subsetting). [Link](https://adv-r.hadley.nz/subsetting.html)
2. R manual — `Extract` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extract.html)
3. R manual — `Extract.data.frame`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extract.data.frame.html)
4. R Language Definition — Indexing. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Indexing)
5. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 27 (A field guide to base R). [Link](https://r4ds.hadley.nz/base-R.html)
6. R Core — S4 slot access. [Link](https://stat.ethz.ch/R-manual/R-devel/library/methods/html/slot.html)
7. R manual — `[[.data.frame` special case. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extract.data.frame.html)
