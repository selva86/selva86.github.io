---
title: "Composable R Code: Design Functions That Chain Together Like Unix Pipes"
slug: "Writing-Composable-R-Code"
description: "Learn to write composable R functions that chain cleanly through the pipe. Five practical rules: single responsibility, data-first, no side effects, predictable types, and small."
keywords: "composable R code, R pipe design, R function design, composable functions R, R function architecture"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.2.8"
post_type: "C"
auto_link_terms: "composable R code|composable functions|R pipe design"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Composable R Code"
sidebar_order: 40
---

# Composable R Code: Design Functions That Chain Together Like Unix Pipes

<p class="lead">Composable R code is built from small, single-purpose functions that accept a data object as their first argument and return the same shape. Functions written this way chain effortlessly through the native pipe <code>|&gt;</code>, exactly like Unix pipes chain shell commands.</p>

The reason Unix shell commands are so powerful in combination is not the shell itself — it is that every command reads from stdin and writes to stdout in a predictable way. R can feel the same once you adopt five rules for how you write functions. This tutorial gives you those rules and shows what "composable" code looks like in practice.

## What Does "Composable" Actually Mean?

Two functions are composable when the output of one can be fed directly to the other. In R this usually means "take a data frame and return a data frame" or "take a vector and return a vector". If every step in your pipeline shares the same input/output shape, every permutation is legal — just like stringing together Unix commands with pipes.

Here is the difference. Look at two ways of computing the mean `mpg` for 4-cylinder cars in `mtcars`.

```r
# Not composable: nested, hard to read
round(mean(subset(mtcars, cyl == 4)$mpg), 1)
#> [1] 26.7

# Composable: each step takes and returns something pipeable
mtcars |>
  subset(cyl == 4) |>
  (\(df) df$mpg)() |>
  mean() |>
  round(1)
#> [1] 26.7
```

The second version is longer by a line or two but reads top to bottom: take `mtcars`, filter, pull a column, average, round. Each step is a function whose job is one verb. That is composability in action — and the rest of this tutorial is about how to write your own functions so they fit this shape.

[KEY INSIGHT]
**Composable code is about interfaces, not cleverness.** Any function can be written "composably" if you decide in advance what goes in, what comes out, and that the function does exactly one thing. Those three decisions are the entire design.

## Rule 1 — Data First Argument

If the first argument of every function is the data, the pipe becomes effortless. This is the single most important convention. `dplyr`, `tidyr`, `purrr`, and base R's `subset` all follow it; so should your own helpers.

```r
# Good: data first
add_total <- function(df, qty_col, price_col) {
  df$total <- df[[qty_col]] * df[[price_col]]
  df
}

orders <- data.frame(
  item  = c("Pen", "Pad"),
  qty   = c(10, 5),
  price = c(1.5, 3.0)
)

orders |> add_total("qty", "price")
#>   item qty price total
#> 1  Pen  10   1.5    15
#> 2  Pad   5   3.0    15
```

Because `df` is first, the pipe slots the data in automatically. If you had written `add_total(qty_col, price_col, df)` instead, you would need `|> (\(d) add_total("qty", "price", d))()` at every call site. Data first is the small choice that makes or breaks your library.

## Rule 2 — Return the Same Shape You Took

A function that takes a data frame and returns a data frame can be followed by another function that expects a data frame. A function that takes a data frame and returns a named list breaks the chain — the next step needs a custom unpacker.

```r
# Good: data frame in, data frame out
add_z_score <- function(df, col) {
  z_values <- scale(df[[col]])[, 1]
  df[[paste0(col, "_z")]] <- z_values
  df
}

mtcars |>
  add_z_score("mpg") |>
  add_z_score("hp") |>
  head(3)
#>                    mpg cyl ...        mpg_z     hp_z
#> Mazda RX4         21.0   6 ...   0.15088602 -0.5350928
#> Mazda RX4 Wag     21.0   6 ...   0.15088602 -0.5350928
#> Datsun 710        22.8   4 ...   0.44954344 -0.7830405
```

Two chained calls to `add_z_score` work because each one returns the same shape it received — a data frame with one extra column. You can keep piping indefinitely.

**Try it:** Write `ex_add_constant(df, col, k)` that adds `k` to every value of `col` and returns the data frame unchanged otherwise.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_add_constant <- function(df, col, k) {
  df[[col]] <- df[[col]] + k
  df
}
mtcars |> ex_add_constant("mpg", 10) |> head(2)
#>                    mpg cyl disp  hp ...
#> Mazda RX4         31.0   6  160 110 ...
#> Mazda RX4 Wag     31.0   6  160 110 ...
```

**Explanation:** The function returns the modified data frame as its last expression, preserving the shape for the next pipe step.

</details>

## Rule 3 — One Function, One Verb

A composable function does one thing. If your helper "loads a file, filters it, computes summary statistics, and writes a report", break it into four functions. Each becomes independently testable and reusable in other pipelines.

```r
# Good: four single-verb helpers
load_data     <- function(path) read.csv(path)
filter_valid  <- function(df) df[complete.cases(df), ]
compute_stats <- function(df, col) {
  data.frame(
    n    = nrow(df),
    mean = mean(df[[col]], na.rm = TRUE),
    sd   = sd(df[[col]], na.rm = TRUE)
  )
}

# A pipeline assembles them
# path |> load_data() |> filter_valid() |> compute_stats("price")
```

If you ever need to "load and filter without computing", you call the first two. If you need to "compute stats on an in-memory data frame", you skip the first two. The composed pipeline is just one way to use the pieces, not the only way.

[TIP]
**If your function's name needs "and", split it.** `load_and_filter()` is two functions. `parse_and_validate()` is two functions. The `and` is the seam.

## Rule 4 — No Side Effects in the Core

Functions in the middle of your pipeline should not print, write files, or change global state. Save those actions for the edges — the first step (reading) and the last (writing). A pure middle makes the pipeline safe to call twice, re-run in parallel, or unit test.

```r
# Bad: prints in the middle of a pipeline
filter_valid_noisy <- function(df) {
  cat("Filtering", nrow(df), "rows\n")  # side effect!
  df[complete.cases(df), ]
}

# Good: returns quietly; any reporting happens outside
filter_valid <- function(df) df[complete.cases(df), ]
```

If you need logging, wrap the function with a function operator like `with_timing` from [R Function Operators](R-Function-Operators.html). That way the core is pure and the logging lives in a separate, optional layer.

## Rule 5 — Keep Functions Small and Predictable

A composable function is short — often five to fifteen lines. It has a small, documented return type. It does not accept dozens of arguments. It does not branch into wildly different behaviours based on a flag. If yours are getting long, the fix is usually to extract a helper and let your main function compose *that*.

```r
# Before: one big function doing three things
summarise_file <- function(path, col) {
  df <- read.csv(path)
  df <- df[complete.cases(df), ]
  data.frame(
    n    = nrow(df),
    mean = mean(df[[col]], na.rm = TRUE),
    sd   = sd(df[[col]], na.rm = TRUE)
  )
}

# After: three composable pieces
load_data     <- function(path) read.csv(path)
filter_valid  <- function(df) df[complete.cases(df), ]
compute_stats <- function(df, col) {
  data.frame(
    n = nrow(df),
    mean = mean(df[[col]], na.rm = TRUE),
    sd = sd(df[[col]], na.rm = TRUE)
  )
}

# Original behaviour, now composable
# summarise_file <- \(path, col) path |> load_data() |> filter_valid() |> compute_stats(col)
```

The "after" code is longer by line count but smaller in complexity. Each helper is separately testable, and you can compose them into pipelines that the original author never imagined.

**Try it:** Given `mtcars`, chain `subset(cyl == 6)`, then a function you write called `ex_standardise(df, col)` that replaces `col` with its z-scores, then `head(2)`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_standardise <- function(df, col) {
  df[[col]] <- as.numeric(scale(df[[col]]))
  df
}
mtcars |>
  subset(cyl == 6) |>
  ex_standardise("mpg") |>
  head(2)
```

**Explanation:** `ex_standardise` follows the four rules: data first, same shape out, one verb, no side effects. It slots into the pipeline cleanly.

</details>

## Practice Exercises

### Exercise 1: Refactor a Nested Call Into a Pipeline

Rewrite this nested expression as a composable pipeline using `|>` and anonymous helpers.

```r
# Original
round(mean(subset(airquality, Month == 7 & !is.na(Ozone))$Ozone), 1)
#> [1] 59.1

# Your pipeline version:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_answer <- airquality |>
  subset(Month == 7 & !is.na(Ozone)) |>
  (\(df) df$Ozone)() |>
  mean() |>
  round(1)
my_answer
#> [1] 59.1
```

**Explanation:** Each step is a single verb; the whole chain reads top to bottom.

</details>

### Exercise 2: Build Three Composable Helpers

Write three helpers — `keep_complete(df)`, `keep_numeric(df)`, `col_means(df)` — each following the five rules. Chain them on `airquality`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
keep_complete <- function(df) df[complete.cases(df), ]
keep_numeric  <- function(df) df[, sapply(df, is.numeric)]
col_means     <- function(df) sapply(df, mean)

my_output <- airquality |>
  keep_complete() |>
  keep_numeric() |>
  col_means() |>
  round(2)
my_output
```

**Explanation:** Each helper is data-first, shape-preserving (until the last), single-verb, pure, and short. That is why they chain without friction.

</details>

## Summary

| Rule                                          | Why                                               |
|-----------------------------------------------|---------------------------------------------------|
| 1. Data is the first argument                 | Makes the pipe effortless.                        |
| 2. Return the same shape you took             | Every step can feed the next without translation. |
| 3. One function, one verb                     | Small pieces recombine in more ways than one big one. |
| 4. No side effects in the core                | Pure code is safe, testable, parallelisable.      |
| 5. Keep functions small (5-15 lines)          | Small functions are easy to read and compose.     |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 6: Functions. [Link](https://adv-r.hadley.nz/functions.html)
2. Wickham, H. — *The tidyverse style guide*, function design chapter. [Link](https://style.tidyverse.org/)
3. Raymond, E. S. — *The Art of Unix Programming*, chapter on pipes and composition. [Link](http://www.catb.org/esr/writings/taoup/)
4. Bache, S. M. and Wickham, H. — *magrittr* package documentation. [Link](https://magrittr.tidyverse.org/)
5. R 4.1 NEWS — introduction of the native pipe `|>`. [Link](https://cran.r-project.org/doc/manuals/r-release/NEWS.html)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the broader mindset; composability is one of its benefits.
- [R Function Operators](R-Function-Operators.html) — add cross-cutting behaviour without breaking the core.
- [purrr map() Variants](purrr-map-Variants.html) — compose pipelines that iterate over collections.
