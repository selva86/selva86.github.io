---
title: "The Pipe Operator in R: %>% vs |> — Master the Most Important Concept"
slug: "R-Pipe-Operator"
description: "Learn the pipe operator in R — both magrittr %>% and native |>. Understand chaining, when to use which, and how pipes transform your data wrangling code."
keywords: "pipe operator R, %>% R, |> R, magrittr pipe, native pipe, R pipe chaining, dplyr pipe"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.2"
post_type: "C"
sidebar_text: "Pipe Operator"
curriculum_path: "/data-wrangling/import/"
auto_link_terms: "pipe operator|%>%|native pipe"
auto_link_case_sensitive: false
---

# The Pipe Operator in R: %>% vs |> — Master the Most Important Concept

<p class="lead">The pipe operator takes the output of one function and feeds it as the first argument to the next function. It turns deeply nested function calls into readable, left-to-right chains. If you learn one concept in modern R, make it this one.</p>

Before pipes, R code looked like this: `round(mean(subset(mtcars, cyl == 6)$mpg), 2)`. You have to read it inside-out. With pipes, the same code reads top-to-bottom, like a recipe. R has two pipes: `%>%` from the magrittr package and `|>` built into R 4.1+. This tutorial covers both.

## The Problem Pipes Solve

Without pipes, you have three options for multi-step operations — and all of them have problems:

```r
# Option 1: Nested calls (hard to read)
round(mean(subset(mtcars, cyl == 6)$mpg), 2)

# Option 2: Intermediate variables (clutters your environment)
cyl6 <- subset(mtcars, cyl == 6)
avg_mpg <- mean(cyl6$mpg)
result <- round(avg_mpg, 2)
result

# Option 3: Overwriting one variable (destroys intermediate results)
x <- subset(mtcars, cyl == 6)
x <- mean(x$mpg)
x <- round(x, 2)
x
```

```r
# With pipes: read top-to-bottom, no nesting, no temp variables
library(dplyr)

mtcars |>
  filter(cyl == 6) |>
  pull(mpg) |>
  mean() |>
  round(2)
```

The pipe `|>` says: "Take what's on the left and pass it as the first argument to what's on the right."

## The magrittr Pipe: %>%

The `%>%` pipe was introduced by the magrittr package in 2014 and popularized by the tidyverse. It's available whenever you load dplyr, tidyr, or any tidyverse package.

```r
library(dplyr)

# Basic chaining with %>%
mtcars %>%
  filter(hp > 100) %>%
  select(mpg, hp, wt) %>%
  arrange(desc(mpg)) %>%
  head(5)
```

```r
library(dplyr)

# %>% passes to the first argument by default
# These two lines are identical:
# sqrt(16)
# 16 %>% sqrt()

# Use . (dot) to place the input somewhere other than the first argument
mtcars %>%
  lm(mpg ~ wt, data = .)

# The dot lets you use pipes with functions that don't take data as the first argument
c(3, 1, 4, 1, 5) %>%
  { . * 2 + 1 }
```

### magrittr's Extra Pipes

The magrittr package provides three additional pipe variants:

```r
library(magrittr)

# %T>% (tee pipe): passes the LEFT side forward (ignores the right's return value)
# Useful for side effects like printing or plotting
mtcars %>%
  filter(cyl == 4) %T>%
  { cat("Filtered to", nrow(.), "rows\n") } %>%
  summarise(avg_mpg = mean(mpg))
```

```r
library(magrittr)

# %<>% (assignment pipe): pipes AND assigns back
x <- c(3, 1, 4, 1, 5, 9)
x %<>% sort() %<>% unique()
x
# Equivalent to: x <- x %>% sort() %>% unique()

# %$% (exposition pipe): exposes column names
mtcars %$%
  cor(mpg, wt)
# Equivalent to: cor(mtcars$mpg, mtcars$wt)
```

## The Native Pipe: |>

R 4.1 (2021) introduced the native pipe `|>`. It's built into the language — no packages needed.

```r
# Native pipe: works without loading any packages
mtcars |>
  subset(cyl == 4) |>
  head(5)
```

```r
# Since R 4.2, you can use a placeholder with _
# The _ must be used with a NAMED argument
mtcars |>
  lm(mpg ~ wt, data = _)

# This works:
c(1, 5, 3, 2, 4) |>
  sort() |>
  rev()
```

## %>% vs |>: Key Differences

| Feature | `%>%` (magrittr) | `|>` (native) |
|---------|------------------|---------------|
| Available since | 2014 (package) | R 4.1 (2021) |
| Requires package | Yes (magrittr/dplyr) | No |
| Placeholder | `.` (anywhere, multiple times) | `_` (named args only, once) |
| Performance | Slight overhead | Zero overhead |
| Debugging | Stack traces show `%>%` internals | Cleaner stack traces |
| Lambda syntax | `. %>% { ... }` | `\(x) ...` |
| Extra pipes (%T>%, %<>%) | Yes | No |

```r
# Performance comparison: native pipe is slightly faster
# but the difference is negligible for data analysis

# Where the placeholder difference matters:
library(dplyr)

# With %>%, the dot is flexible:
# c(1,2,3) %>% paste(., ., sep = "-")  # uses . twice
# With |>, the underscore is strict:
# c(1,2,3) |> paste(x = _, y = _, sep = "-")  # ERROR: _ only once

# Practical recommendation:
# Use |> for everyday code
# Use %>% when you need the dot placeholder in complex positions
mtcars |>
  head(3) |>
  print()
```

## When to Use Pipes (and When Not To)

Pipes work best for **linear sequences** of transformations:

```r
library(dplyr)

# GOOD: linear chain, each step feeds the next
mtcars |>
  filter(cyl %in% c(4, 6)) |>
  group_by(cyl) |>
  summarise(
    avg_mpg = mean(mpg),
    avg_hp = mean(hp),
    n = n()
  ) |>
  arrange(desc(avg_mpg))
```

Pipes are a poor fit when:

```r
# AVOID: branching logic (result is used in multiple places)
# Instead, save to a variable:
filtered <- mtcars |> subset(cyl == 4)

# Then use it in multiple downstream operations
mean(filtered$mpg)
mean(filtered$hp)
nrow(filtered)
```

### Rules of Thumb

1. **Use pipes** for 2-10 step linear transformations
2. **Save to a variable** when you need intermediate results more than once
3. **Don't pipe** into a function call with side effects (plotting, writing files) unless you use `%T>%`
4. **Break long pipes** (10+ steps) into named stages

## Keyboard Shortcuts

In RStudio, type the pipe instantly:

| Pipe | Shortcut (Windows/Linux) | Shortcut (Mac) |
|------|--------------------------|-----------------|
| `%>%` | Ctrl + Shift + M | Cmd + Shift + M |
| `|>` | Ctrl + Shift + M (if configured) | Cmd + Shift + M |

To switch RStudio's default pipe: **Tools > Global Options > Code > Use native pipe operator**

## Practice Exercises

**Exercise 1:** Rewrite this nested code using pipes. Use whichever pipe you prefer.

```r
round(sqrt(abs(mean(c(-16, 25, -9, 36)))), 2)
```

<details>
<summary>Click to reveal solution</summary>

```r
c(-16, 25, -9, 36) |>
  mean() |>
  abs() |>
  sqrt() |>
  round(2)
#> [1] 3
```

</details>

**Exercise 2:** Use a pipe chain with dplyr to find the top 3 heaviest cars (by `wt`) that have more than 100 horsepower. Show only `mpg`, `hp`, and `wt`.

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

mtcars |>
  filter(hp > 100) |>
  arrange(desc(wt)) |>
  select(mpg, hp, wt) |>
  head(3)
```

</details>

**Exercise 3:** The `lm()` function takes `data` as its second argument, not its first. Use a pipe to pass `mtcars` into `lm(mpg ~ wt, data = ...)` using either `|>` with `_` or `%>%` with `.`.

<details>
<summary>Click to reveal solution</summary>

```r
# With native pipe (R 4.2+)
mtcars |> lm(mpg ~ wt, data = _) |> summary()

# With magrittr pipe
library(dplyr)
mtcars %>% lm(mpg ~ wt, data = .) %>% summary()
```

</details>

## FAQ

**Q: Which pipe should I use in 2026?**
Use the native pipe `|>` as your default. It's faster, needs no packages, and produces cleaner error messages. Switch to `%>%` only when you need the dot placeholder in unusual positions or the tee pipe `%T>%`.

**Q: Can I mix `%>%` and `|>` in the same chain?**
Technically yes, but don't. Pick one per chain for readability. It's fine to use different pipes in different parts of a script.

**Q: Why does my pipe chain give a different result than the nested version?**
The most common cause: you forgot that the pipe passes to the **first** argument. If the function you're piping into doesn't take data as its first argument, use a placeholder (`_` or `.`).

## What's Next?

With pipes in your toolkit, you're ready to start transforming data. The next tutorial covers [dplyr filter() and select()](#) — the two functions you'll use most often to subset rows and columns.
