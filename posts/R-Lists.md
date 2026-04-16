---
title: "R Lists: When Data Frames Aren't Flexible Enough (Complete Guide)"
slug: "R-Lists"
description: "R lists hold any mix of data types — vectors, data frames, even other lists. Learn to create, access with [] vs [[]], modify, and convert lists efficiently."
keywords: "R lists, list() R, list indexing, [[]] vs [] R, nested lists R, list to vector, unlist R"
auto_link_terms: "R lists|list() in R|list indexing|nested lists in R|unlist()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.1.8"
post_type: C
sidebar_section: "R Fundamentals"
sidebar_title: "R Lists"
sidebar_order: 8
difficulty: "Beginner"
---

# R Lists: When Data Frames Aren't Flexible Enough (Complete Guide)

<p class="lead">A list in R is a container that can hold elements of any type, any length, and any structure — numbers next to data frames next to other lists. It's the most flexible data structure R has, and nearly every R object you'll encounter in the wild is built on top of one.</p>

## What is an R list and when do you need one?

Vectors force every element to be the same type. Data frames force every column to be the same length. Lists throw away both restrictions. Any slot can hold anything — a number, a string, a vector of 1,000 values, a linear model object, another list. That's why `lm()`, `summary()`, and virtually every statistical function returns a list.

```r
result <- list(
  model_name = "linear regression",
  coefficients = c(intercept = 2.5, slope = 0.8),
  residuals = c(-0.3, 0.1, -0.2, 0.4, 0.0),
  converged = TRUE,
  fit_date = Sys.Date()
)
result
#> $model_name
#> [1] "linear regression"
#> 
#> $coefficients
#> intercept     slope 
#>       2.5       0.8 
#> 
#> $residuals
#> [1] -0.3  0.1 -0.2  0.4  0.0
#> 
#> $converged
#> [1] TRUE
#> 
#> $fit_date
#> [1] "2026-04-11"

length(result)
#> [1] 5
```

Five elements, five different types and shapes, all in one object. No vector or data frame can hold this. That flexibility is exactly what you need when "the result of an analysis" is more than a single table.

![Structure of an R list](screenshots/R-Lists-structure.webp)
*Figure 1: A list is a sequence of named (or unnamed) slots, where each slot can point to an object of any type and size.*

> [KEY INSIGHT]
> If you've used Python: R lists are roughly like Python dicts with ordered keys. If you've used JSON: an R list *is* basically a JSON object. That's why `jsonlite::toJSON()` can convert most R lists to JSON in one line.

**Try it:** Create a list holding your name (character), three favorite numbers (vector), and `TRUE`.

```r
ex_me <- list(
  name = "___",
  numbers = c(___, ___, ___),
  r_user = ___
)

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_me <- list(
  name    = "Selva",
  numbers = c(3, 7, 42),
  r_user  = TRUE
)
ex_me
#> $name
#> [1] "Selva"
#>
#> $numbers
#> [1]  3  7 42
#>
#> $r_user
#> [1] TRUE
```

Each `list()` slot takes whatever you hand it — a single character, a three-element numeric vector, and a scalar logical coexist without forcing any type coercion. That's the whole point of a list over a vector: no common type is required.
</details>

## How do you access list elements with `$`, `[`, and `[[`?

This is the single biggest confusion in R for beginners. Lists have three access operators, and they return different things. Let's disentangle them.

```r
result$model_name
#> [1] "linear regression"

result[["coefficients"]]
#> intercept     slope 
#>       2.5       0.8 

result["coefficients"]
#> $coefficients
#> intercept     slope 
#>       2.5       0.8
```

Look carefully: the second call returns the vector itself, but the third returns a list of length 1 that *contains* the vector. That's the rule:

- `[[ ]]` (double brackets) or `$` → extracts the element itself
- `[ ]` (single brackets) → returns a sub-list

Single brackets are for *sub-setting* a list (returning a smaller list), double brackets are for *extracting* (pulling one element out).

```r
class(result[["coefficients"]])
#> [1] "numeric"
class(result["coefficients"])
#> [1] "list"
```

> [WARNING]
> `result["coefficients"] * 2` will error — you can't multiply a list. `result[["coefficients"]] * 2` works because it returns a numeric vector. This mistake is responsible for about half of all "non-numeric argument" errors in R.

**Try it:** From `result`, extract the `residuals` as a numeric vector and compute its sum.

```r
ex_sum <- sum(result[[___]])
ex_sum

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_sum <- sum(result[["residuals"]])
ex_sum
#> [1] 0
```

Double brackets pull the numeric vector straight out of the list, so `sum()` operates on `c(-0.3, 0.1, -0.2, 0.4, 0.0)` and returns a scalar. If you'd used single brackets — `result["residuals"]` — you would have handed `sum()` a length-1 *list*, which fails with the classic "non-numeric argument" error.
</details>

## How do you add, modify, and remove list elements?

Modifying a list works like a data frame column: assign into a named slot. If the slot exists, you update it; if it doesn't, you create it. To remove, assign `NULL`.

```r
result$r_squared <- 0.87
length(result)
#> [1] 6

result[["converged"]] <- FALSE
result$converged
#> [1] FALSE

result$fit_date <- NULL
length(result)
#> [1] 5
names(result)
#> [1] "model_name"   "coefficients" "residuals"    "r_squared"    "converged"
```

Three edits, three different access styles — all valid. Pick whichever is clearest for the context.

> [TIP]
> To *really* set an element to `NULL` (not remove it), use `result["x"] <- list(NULL)`. The `list(NULL)` wrapping is the escape hatch R provides for this edge case.

**Try it:** Add a new element `notes` containing the string "looks good".

```r
result$notes <- "___"
result$notes

```

<details>
<summary>Click to reveal solution</summary>

```r
result$notes <- "looks good"
result$notes
#> [1] "looks good"
```

Assigning into a name the list doesn't have (`notes`) appends a new slot at the end — the same syntax that *modifies* an existing slot *creates* one when it's missing. There's no separate "add" call in base R; assignment handles both cases.
</details>

## How do you work with nested lists?

A list element can itself be a list — and the inner list can have its own list elements, and so on. Nested lists are everywhere: JSON responses, model outputs, configuration objects. The rule for accessing them is: chain the operators.

```r
experiment <- list(
  name = "A/B test 42",
  groups = list(
    control = list(n = 500, mean = 3.2, sd = 0.8),
    treatment = list(n = 510, mean = 3.5, sd = 0.9)
  )
)

experiment$groups$treatment$mean
#> [1] 3.5

experiment[["groups"]][["control"]][["n"]]
#> [1] 500
```

Both styles work. `$` chains are shorter for interactive use; `[[ ]]` chains let you parameterize the path (e.g., `experiment[["groups"]][[grp]]`).

```r
diff_in_means <- experiment$groups$treatment$mean - experiment$groups$control$mean
diff_in_means
#> [1] 0.3
```

That's extracting and computing in a single expression — the everyday pattern when pulling metrics out of a results object.

**Try it:** Pull the standard deviation of the treatment group from `experiment`.

```r
ex_sd <- experiment$groups$___$___
ex_sd

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_sd <- experiment$groups$treatment$sd
ex_sd
#> [1] 0.9
```

Chaining `$` descends one level at a time: first into the top-level `groups` list, then into the `treatment` sub-list, then to the scalar `sd` slot. Each step hands the next step a list until the final extraction pulls out the numeric value.
</details>

## How do you iterate over a list with lapply() and sapply()?

When every element of a list is the same shape (say, five numeric vectors), you often want to apply a function to each one. `lapply()` does this and returns a list; `sapply()` simplifies the result to a vector or matrix when possible.

```r
numbers <- list(
  a = 1:5,
  b = 10:15,
  c = c(100, 200, 300)
)

lapply(numbers, mean)
#> $a
#> [1] 3
#> 
#> $b
#> [1] 12.5
#> 
#> $c
#> [1] 200

sapply(numbers, mean)
#>    a    b    c 
#>  3.0 12.5 200.0

sapply(numbers, function(x) c(min = min(x), max = max(x)))
#>       a  b   c
#> min   1 10 100
#> max   5 15 300
```

`sapply()` returned a named numeric vector in the first case and a matrix in the second — it picks the simplest container that fits. If you want predictability, use `vapply()` (you declare the return shape) or stick to `lapply()`.

> [KEY INSIGHT]
> `lapply()` is how you write "map" in R. Once you can express an operation as "apply this function to every list element," you've internalized functional iteration and can write clean, loopless R code.

**Try it:** Use `sapply()` to get the length of each element in `numbers`.

```r
sapply(numbers, ___)

```

<details>
<summary>Click to reveal solution</summary>

```r
sapply(numbers, length)
#> a b c
#> 5 6 3
```

`sapply()` walks each slot of `numbers`, calls `length()` on it, and then simplifies the three scalar results into a named numeric vector. The names come straight from the list — which is why naming your list slots pays off the moment you start iterating.
</details>

## How do you flatten a list into a vector?

Sometimes you just want all the values from a list as a single flat vector. `unlist()` does it — walking the list recursively and concatenating everything into one vector of the most flexible type.

```r
unlist(numbers)
#>  a1  a2  a3  a4  a5  b1  b2  b3  b4  b5  b6  c1  c2  c3 
#>   1   2   3   4   5  10  11  12  13  14  15 100 200 300

unlist(list(1, "two", TRUE))
#> [1] "1"    "two"  "TRUE"

unlist(experiment$groups$control)
#>     n  mean    sd 
#> 500.0   3.2   0.8
```

Notice the second example: `unlist()` still obeys the coercion hierarchy — mix a string in and everything becomes character. Notice also the first example: the names came from concatenating the list slot names with the inner element positions.

> [NOTE]
> `unlist()` is destructive. You lose the list structure, and if any element was itself a complex object (like an S4 class), the result may be unexpected. Use it only when you're sure you want flat atomic values.

**Try it:** Flatten `numbers` and compute its total sum.

```r
sum(unlist(___))

```

<details>
<summary>Click to reveal solution</summary>

```r
sum(unlist(numbers))
#> [1] 690
```

`unlist(numbers)` collapses the three slots — `1:5`, `10:15`, `c(100, 200, 300)` — into a single numeric vector of length 14, and `sum()` adds them: `15 + 75 + 600 = 690`. The flatten-then-reduce pattern is handy when you don't care about the slot structure.
</details>

## How do you convert between lists and data frames?

A data frame *is* a list (of equal-length columns), so converting between them is common. The key constraint: to become a data frame, list elements must all have the same length.

```r
columns <- list(
  id = 1:4,
  name = c("Ann", "Bo", "Cal", "Di"),
  active = c(TRUE, TRUE, FALSE, TRUE)
)

df <- as.data.frame(columns)
df
#>   id name active
#> 1  1  Ann   TRUE
#> 2  2   Bo   TRUE
#> 3  3  Cal  FALSE
#> 4  4   Di   TRUE

as.list(df)
#> $id
#> [1] 1 2 3 4
#> 
#> $name
#> [1] "Ann" "Bo"  "Cal" "Di" 
#> 
#> $active
#> [1]  TRUE  TRUE FALSE  TRUE
```

Going the other way — a list where elements are *rows* rather than columns — needs `do.call(rbind, ...)`:

```r
rows <- list(
  list(id = 1, name = "Ann"),
  list(id = 2, name = "Bo"),
  list(id = 3, name = "Cal")
)

do.call(rbind, lapply(rows, as.data.frame))
#>   id name
#> 1  1  Ann
#> 2  2   Bo
#> 3  3  Cal
```

**Try it:** Convert `columns` to a data frame and print its dimensions.

```r
dim(as.data.frame(columns))

```

<details>
<summary>Click to reveal solution</summary>

```r
dim(as.data.frame(columns))
#> [1] 4 3
```

All three list elements in `columns` have length 4, so `as.data.frame()` lines them up as columns of a 4-row, 3-column data frame. `dim()` returns rows first, then columns — if the list elements had unequal lengths the call would have errored instead.
</details>

## Practice Exercises

### Exercise 1: Summary stats list

Write a function that takes a numeric vector and returns a list with `n`, `mean`, `sd`, `min`, and `max`.

<details>
<summary>Show solution</summary>

```r
describe <- function(x) {
  list(n = length(x), mean = mean(x), sd = sd(x),
       min = min(x), max = max(x))
}
describe(c(4, 8, 6, 5, 3, 9))
#> $n
#> [1] 6
#> $mean
#> [1] 5.833333
#> $sd
#> [1] 2.228602
#> $min
#> [1] 3
#> $max
#> [1] 9
```
</details>

### Exercise 2: Extract from lm() output

Fit a linear model on `mtcars` and pull the R² and the residual standard error from the `summary()` object.

<details>
<summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
s <- summary(fit)
s$r.squared
#> [1] 0.7528328
s$sigma
#> [1] 3.045882
```
</details>

### Exercise 3: Apply across a list of models

Fit three models (`mpg ~ wt`, `mpg ~ hp`, `mpg ~ wt + hp`) on `mtcars`, store them in a named list, then use `sapply()` to get the R² of each.

<details>
<summary>Show solution</summary>

```r
models <- list(
  wt = lm(mpg ~ wt, data = mtcars),
  hp = lm(mpg ~ hp, data = mtcars),
  both = lm(mpg ~ wt + hp, data = mtcars)
)
sapply(models, function(m) summary(m)$r.squared)
#>        wt        hp      both 
#> 0.7528328 0.6024373 0.8267855
```
</details>

## Putting It All Together

A realistic pattern: run three models, collect the results in a nested list, extract key metrics, and assemble a summary data frame.

```r
predictors <- c("wt", "hp", "disp")
fits <- lapply(predictors, function(p) {
  f <- as.formula(paste("mpg ~", p))
  lm(f, data = mtcars)
})
names(fits) <- predictors

summaries <- list(
  r_squared = sapply(fits, function(m) summary(m)$r.squared),
  sigma     = sapply(fits, function(m) summary(m)$sigma),
  n_coef    = sapply(fits, function(m) length(coef(m)))
)

report <- as.data.frame(summaries)
report
#>      r_squared    sigma n_coef
#> wt   0.7528328 3.045882      2
#> hp   0.6024373 3.862962      2
#> disp 0.7183433 3.251454      2
```

Six lines: fit a list of models, extract three metrics via `sapply()`, assemble into a summary table. This pattern — list of models → apply → data frame — scales to dozens of models or cross-validation folds without changing shape.

## Summary

| Task | Syntax |
|------|--------|
| Create | `list(a = 1, b = "two", c = 1:5)` |
| Extract element | `lst$a`, `lst[["a"]]` |
| Sub-list | `lst["a"]` or `lst[c("a", "b")]` |
| Modify | `lst$a <- new_value` |
| Remove | `lst$a <- NULL` |
| Iterate | `lapply(lst, f)` or `sapply(lst, f)` |
| Flatten | `unlist(lst)` |
| To data frame | `as.data.frame(lst)` (equal-length elements) |

## References

1. [R Language Definition — List objects](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#List-objects)
2. [Advanced R — Lists](https://adv-r.hadley.nz/vectors-chap.html#lists) by Hadley Wickham
3. [An Introduction to R — Lists and data frames](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Lists-and-data-frames)
4. [R for Data Science — Iteration](https://r4ds.hadley.nz/iteration) — modern alternatives with `purrr`
5. [R Inferno — Chapter 8: Believing it does as intended](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf) by Patrick Burns — `[` vs `[[` gotchas

## Continue Learning

- [R Data Frames: Every Operation You'll Need](R-Data-Frames.html) — the tabular cousin of lists.
- [R Vectors: The Foundation of Everything in R](R-Vectors.html) — the building blocks that go inside list slots.
- [R Data Types: Which Type Is Your Variable?](R-Data-Types.html) — the types a list can hold.
