---
title: "Infix Functions in R: Write Your Own %op% Operators"
slug: "Infix-Functions-in-R"
description: "Infix functions in R let you write custom operators like %between% or %notin% that sit between their arguments. Learn the naming rule, the quoting trick, and five useful ones."
keywords: "infix functions R, R custom operators, R %op% operator, R notin operator, R between operator"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-1"
post_type: "FR"
auto_link_terms: "infix function|custom operator R|%between%|%notin%"
auto_link_case_sensitive: false
fr_parent: "R-Function-Operators.html"
---

# Infix Functions in R: Write Your Own %op% Operators

<p class="lead">An infix function in R is a function whose name starts and ends with <code>%</code>, letting you call it between two arguments like an operator: <code>a %op% b</code>. You already use several built-ins (<code>%in%</code>, <code>%*%</code>); writing your own is one line of code.</p>

R treats `+`, `-`, `*`, `/`, and their kin as regular functions with a special calling convention. You get to play the same game. Any function named `%something%` can be called infix, and most of R's cleanest DSLs — `%>%`, `%in%`, `%*%`, `ggplot2`'s `%+%` — use this trick. This short guide shows how to define one, when it helps, and a handful of ready-to-use examples.

## How Do You Define an Infix Function?

Assign a function to a name wrapped in backticks, with `%...%` as the name. Then use it between two values, no parentheses or commas required.

```r
`%between%` <- function(x, range) {
  x >= range[1] & x <= range[2]
}

5 %between% c(1, 10)
#> [1] TRUE

15 %between% c(1, 10)
#> [1] FALSE
```

The backticks tell R "this name contains special characters, treat it as a regular identifier". Once defined, you can call `5 %between% c(1, 10)` *or* `` `%between%`(5, c(1, 10)) `` — the two forms are identical, just like `5 + 3` and `` `+`(5, 3) ``.

[KEY INSIGHT]
**Infix is syntactic sugar, nothing more.** An infix function is a normal two-argument function with a special name. R's parser recognises the `%...%` pattern and lets you put the call between the arguments. There is no new semantics — `%op%` is just a function call dressed up differently.

## Why Write One? The `%notin%` Case

R ships with `%in%` but not `%notin%`. You can work around it with `!(x %in% y)`, but the custom operator reads closer to the sentence in your head.

```r
`%notin%` <- function(x, table) !(x %in% table)

fruits <- c("apple", "banana", "cherry", "date")

fruits %notin% c("banana", "date")
#> [1]  TRUE FALSE  TRUE FALSE
```

`fruits %notin% c("banana", "date")` reads "fruits that are not in the given set". `!(fruits %in% c("banana", "date"))` carries the same meaning but makes your eye bounce between the `!` and the closing `)`. When the same predicate shows up in ten places in a script, the infix version is noticeably cleaner.

**Try it:** Define `%divides%` such that `a %divides% b` returns `TRUE` when `a` divides `b` cleanly. Test on `3 %divides% 12` and `5 %divides% 12`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
`%divides%` <- function(a, b) b %% a == 0

3 %divides% 12
#> [1] TRUE

5 %divides% 12
#> [1] FALSE
```

**Explanation:** `b %% a` is the remainder; when it is `0`, `a` divides `b` without leftover.

</details>

## Five Useful Infix Functions to Steal

Here are five that earn their place in a utility file.

```r
# 1. Default value for NULL
`%||%` <- function(x, y) if (is.null(x)) y else x

config_timeout <- NULL
config_timeout %||% 30
#> [1] 30

# 2. Concatenate strings
`%+%` <- function(a, b) paste0(a, b)
"Hello, " %+% "World"
#> [1] "Hello, World"

# 3. Not in
`%notin%` <- function(x, table) !(x %in% table)
"z" %notin% letters[1:5]
#> [1] TRUE

# 4. Between (inclusive)
`%between%` <- function(x, range) x >= range[1] & x <= range[2]
7 %between% c(5, 10)
#> [1] TRUE

# 5. Approximately equal
`%~=%` <- function(a, b) abs(a - b) < 1e-8
0.1 + 0.2 %~=% 0.3
#> [1] TRUE
```

Each is a one-liner that pulls its weight because the shape of the expression — "value, relation, value" — matches how you say the check out loud. `%||%` in particular is so useful that `rlang` ships its own copy.

[TIP]
**rlang already exports `%||%`.** If you are using the tidyverse, you probably do not need to define your own — `library(rlang)` gives you a canonical version. The others (`%between%`, `%notin%`) are also in packages like `data.table` and `dplyr`, so check before writing a duplicate.

## What Are the Gotchas?

Two things to watch out for. First, infix functions are always two-argument. If you want three arguments, go back to a regular function. Second, operator precedence. R treats all `%...%` operators as having the same precedence — lower than `*` and `/`, higher than `<` and `>`.

```r
# Precedence surprise
1:5 %notin% c(2, 4) == TRUE
#> [1]  TRUE FALSE  TRUE FALSE  TRUE
# parses as: 1:5 %notin% (c(2, 4) == TRUE)
```

The `==` binds tighter than you might expect. When mixing custom infix with comparison operators, use parentheses to make the grouping explicit: `(1:5 %notin% c(2, 4)) == TRUE`.

## Practice Exercises

### Exercise 1: Write `%or_default%`

Write an infix function `%or_default%` that returns `x` unless `x` is `NA` or `NULL`, in which case it returns the default.

```r
# your code here
#> NA %or_default% 42  => 42
#> 7  %or_default% 42  => 7
```

<details>
<summary>Click to reveal solution</summary>

```r
`%or_default%` <- function(x, default) {
  if (is.null(x) || (length(x) == 1 && is.na(x))) default else x
}

NA %or_default% 42
#> [1] 42
7  %or_default% 42
#> [1] 7
```

**Explanation:** The check covers both `NULL` (short-circuit first) and scalar `NA`. For vector-safe semantics you would vectorise with `ifelse`.

</details>

### Exercise 2: Chain Two Infix Operators

Using `%between%` and `%notin%`, filter `1:20` to numbers that are between 5 and 15 but not in `c(7, 11)`.

```r
# your code here
#> Expected: 5 6 8 9 10 12 13 14 15
```

<details>
<summary>Click to reveal solution</summary>

```r
`%between%` <- function(x, range) x >= range[1] & x <= range[2]
`%notin%`   <- function(x, table) !(x %in% table)

nums <- 1:20
nums[nums %between% c(5, 15) & nums %notin% c(7, 11)]
#> [1]  5  6  8  9 10 12 13 14 15
```

**Explanation:** Each infix check returns a logical vector; `&` combines them; the result subsets `nums`.

</details>

## Summary

| Operator      | Purpose                                    |
|---------------|--------------------------------------------|
| `%notin%`     | Negation of `%in%`                         |
| `%between%`   | Inclusive range check                      |
| `%||%`        | Default value when `NULL`                  |
| `%+%`         | String concatenation                       |
| `%~=%`        | Approximate numeric equality               |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 6: Functions (infix functions section). [Link](https://adv-r.hadley.nz/functions.html#infix-functions)
2. `rlang::%||%` documentation. [Link](https://rlang.r-lib.org/reference/op-null-default.html)
3. `base::%in%` source — the canonical example of an infix predicate.
4. `magrittr::%>%` — the pipe that popularised custom infix in R. [Link](https://magrittr.tidyverse.org/)
5. `data.table::%between%` — production version of the range check. [Link](https://rdatatable.gitlab.io/data.table/)

## Continue Learning

- [R Function Operators](R-Function-Operators.html) — the parent topic; infix functions are a subset.
- [Writing Composable R Code](Writing-Composable-R-Code.html) — where infix helpers make pipelines read more naturally.
- [Functional Programming in R](Functional-Programming-in-R.html) — the broader FP mindset.
