---
title: "R Pipe Operator: %>% vs |>, The Complete Guide to Both Pipes"
slug: "R-Pipe-Operator"
description: "Master both R pipes: magrittr's %>% and the native |> pipe. Learn when to use each, placeholder tricks, common pitfalls, and how they make code dramatically more readable."
keywords: "R pipe operator, %>% R, |> R, magrittr pipe, native R pipe, R pipe vs base, pipe placeholder R"
auto_link_terms: "R pipe operator|%>%|native pipe in R|magrittr pipe|pipe operator"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.2.2"
post_type: C
sidebar_section: "Data Wrangling"
sidebar_title: "R Pipe Operator"
sidebar_order: 2
difficulty: "Intermediate"
---

# R Pipe Operator: %>% vs |>, The Complete Guide to Both Pipes

<p class="lead">The pipe operator takes the output of one function and feeds it as the first argument to the next, turning nested calls into a readable left-to-right sequence. R has two pipes, <code>%&gt;%</code> from magrittr and <code>|&gt;</code> built into base R, and this guide shows you exactly when to use each.</p>

## What problem does the pipe solve?

Without a pipe, multi-step transformations nest inside each other, and you read them inside-out. With a pipe, they read top-to-bottom like a recipe. Let's see both versions of the same computation.

```r title="Nested call vs piped chain"
# Nested — reads inside-out
round(mean(log(c(10, 100, 1000))), 2)
#> [1] 5.3

# Piped — reads left to right
c(10, 100, 1000) |> log() |> mean() |> round(2)
#> [1] 5.3
```

Same result. But the piped version says plainly: "take this vector, take its log, take the mean, round to 2 decimals." No mental gymnastics, no parenthesis-counting. For a chain of 4-5 steps the difference is transformative.

> [KEY INSIGHT]
> The pipe doesn't do anything you couldn't do with nested calls or temporary variables. It's purely for readability. But readability compounds: a codebase full of piped chains is dramatically easier to review, debug, and modify than one full of nested calls.

**Try it:** Rewrite `sum(sqrt(1:10))` as a pipeline with `|>`.

```r title="Exercise: sum the square roots"
# your turn
1:10 |> sqrt() |> ___

```

<details>
<summary>Click to reveal solution</summary>

```r title="Sum-sqrt solution"
1:10 |> sqrt() |> sum()
#> [1] 22.46828
```

The pipeline reads left to right: start with 1..10, take the square root of each element, then sum the resulting vector. Same answer as the nested `sum(sqrt(1:10))` but each step is explicit and reorderable.
</details>

## What's the difference between %>% and |>?

The magrittr pipe `%>%` has been around since 2014 and is used by dplyr, ggplot2, and the whole tidyverse. The native pipe `|>` was added to base R in version 4.1 (May 2021). They're almost identical for day-to-day work, but there are three real differences.

```r title="%% vs | on the same sort"
# Both pass LHS as the first argument of the RHS function
library(magrittr)
c(3, 1, 4, 1, 5) %>% sort()
#> [1] 1 1 3 4 5

c(3, 1, 4, 1, 5) |> sort()
#> [1] 1 1 3 4 5
```

**Difference 1, Parentheses required.** The native pipe requires `()` on the right-hand side: `x |> mean()` works, `x |> mean` does not. The magrittr pipe allows both.

**Difference 2, No anonymous dot.** magrittr lets you use `.` as a placeholder for the piped value anywhere: `x %>% lm(y ~ z, data = .)`. The native pipe's placeholder is `_` and it only works with named arguments and only once per call.

**Difference 3, No dependency.** `|>` is in base R, no packages needed. `%>%` requires `magrittr` or any package that re-exports it (dplyr, tidyr, etc.).

```r title="Placeholder differences on lm"
# Placeholder: magrittr
mtcars %>% lm(mpg ~ wt, data = .)
# native pipe — must use _ with a named argument
mtcars |> lm(mpg ~ wt, data = _)
```

> [TIP]
> For new code in 2026+, prefer `|>`. It's faster (no function call), has no dependency, and works everywhere. Only fall back to `%>%` when you need its dot-placeholder flexibility or you're in a codebase that already uses it.

**Try it:** Use the native pipe to fit `lm(mpg ~ hp, data = mtcars)` without writing `mtcars` inside `lm()`.

```r title="Exercise: native pipe with data argument"
mtcars |> lm(mpg ~ hp, data = ___)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Native-pipe-lm solution"
mtcars |> lm(mpg ~ hp, data = _) |> coef()
#> (Intercept)          hp
#> 30.09886054 -0.06822828
```

The native pipe's `_` placeholder plugs the left-hand side into any *named* argument on the right, here `data = _` puts `mtcars` into `lm()`'s second slot so the formula can stay first. It only works with named arguments and only once per call.
</details>

## How does the pipe decide where to insert the value?

Both pipes insert the left-hand side as the **first argument** of the function on the right-hand side. If the function expects the data somewhere else, you need a placeholder or an anonymous function.

```r title="Pipe placeholder and anonymous function"
# First arg — straightforward
c(5, 3, 8, 1) |> sort()
#> [1] 1 3 5 8

# Need data as a later argument — use _ (named only)
mtcars |> lm(mpg ~ wt, data = _)

# Or use an anonymous function
c(1, 2, 3) |> (\(x) paste("value is", x))()
#> [1] "value is 1" "value is 2" "value is 3"
```

That last one is the native pipe's universal escape hatch: `(\(x) ...)()` wraps the rest of the expression in an inline function and calls it. Ugly, but it works when nothing else fits.

**Try it:** Pipe `1:5` into a custom operation that returns `x^2 + 1` using an anonymous function.

```r title="Exercise: inline function on 1:5"
1:5 |> (\(x) ___)()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Inline-function solution"
1:5 |> (\(x) x^2 + 1)()
#> [1]  2  5 10 17 26
```

The lambda `\(x) x^2 + 1` is created inline and then immediately called with the piped value. The trailing `()` is what makes the pipe call the function instead of just referencing it, this is the universal escape hatch when the operation doesn't already exist as a named function.
</details>

## When is a pipeline worth using?

Pipes shine on chains of 3+ steps where each step transforms the previous result. Below that threshold, nested calls are fine. Above it, pipes become a quality-of-life upgrade.

```r title="Nested dplyr vs piped dplyr"
library(dplyr)
# Without pipes — cluttered
arrange(summarise(group_by(filter(mtcars, cyl == 4), gear), mean_mpg = mean(mpg)), desc(mean_mpg))
#> # A tibble: 3 x 2
#>    gear mean_mpg
#>   <dbl>    <dbl>
#> 1     4     26.9
#> 2     5     28.2
#> 3     3     21.5

# With pipes — each step on its own line
mtcars |>
  filter(cyl == 4) |>
  group_by(gear) |>
  summarise(mean_mpg = mean(mpg)) |>
  arrange(desc(mean_mpg))
#> # A tibble: 3 x 2
#>    gear mean_mpg
#>   <dbl>    <dbl>
#> 1     5     28.2
#> 2     4     26.9
#> 3     3     21.5
```

The piped version isn't shorter, it's *linear*. You can drop in a `print()` or `View()` anywhere in the chain to debug. You can comment out a line to skip a step. That flexibility is the real win.

> [NOTE]
> Pipelines with intermediate steps are the idiomatic style in dplyr, ggplot2 (with `+` instead of `|>`), and most of the tidyverse. Learning to read them fluently is half the battle when picking up modern R.

**Try it:** Write a pipeline on `mtcars` that filters `gear == 4`, then returns the mean `mpg`.

```r title="Exercise: mean mpg for gear 4"
mtcars |>
  filter(gear == 4) |>
  summarise(mean_mpg = ___)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Gear-4 solution"
library(dplyr)
mtcars |>
  filter(gear == 4) |>
  summarise(mean_mpg = mean(mpg))
#>   mean_mpg
#> 1    24.53
```

`filter(gear == 4)` keeps only the 12 four-gear cars, and `summarise(mean_mpg = mean(mpg))` collapses that subset to a single-row tibble with their average mpg. Because the data flows in via the pipe, neither call needs to repeat `mtcars`.
</details>

## What are common pipe pitfalls?

Three traps catch new pipe users most often. Knowing them saves hours of debugging.

**Pitfall 1, Forgetting `()` on the right side (native pipe only):**

```r title="Common mistake: missing parentheses"
# Wrong — native pipe requires ()
# c(1, 2, 3) |> mean
# Error: The pipe operator requires a function call as RHS

# Right
c(1, 2, 3) |> mean()
#> [1] 2
```

**Pitfall 2, Piping into `.` without thinking.** With magrittr's dot, you can accidentally double-insert the value:

```r title="Magrittr dot double-insert"
library(magrittr)
# Using the dot as an argument AND as the LHS insertion
10 %>% seq(1, ., by = 2)
#> [1] 1 3 5 7 9
# This works, but it's subtle — the dot is the 10, and the LHS is also 10.
```

**Pitfall 3, Mixing pipe and `+` in ggplot2.** ggplot2 uses `+`, not `|>`, to add layers. Beginners routinely try `ggplot(df) |> geom_point(...)` and get confused errors. Use `|>` before `ggplot()` and `+` between layers:

```r title="Pipe vs plus in ggplot2"
# Correct pattern
# mtcars |>
#   filter(cyl == 4) |>
#   ggplot(aes(wt, mpg)) +
#   geom_point()
```

> [WARNING]
> Don't pipe anything that has side effects (like `print()` or `write.csv()`) expecting the return value to propagate. `print(x)` returns `x` invisibly, which does propagate. But many I/O functions return `NULL`, breaking the chain.

**Try it:** Spot the bug, why doesn't `c(1,2,3) %>% mean` work as expected in some environments?

```r title="Exercise: native pipe with parentheses"
# hint: magrittr accepts it, native pipe doesn't — always use () to be safe
c(1, 2, 3) |> mean()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Parentheses solution"
c(1, 2, 3) |> mean()
#> [1] 2
```

The native pipe strictly requires a function *call* on the right-hand side, `mean` alone is just a reference to the function object, so `c(1,2,3) |> mean` errors with "The pipe operator requires a function call as RHS". Adding `()` makes it a call and the pipe can insert the LHS as its first argument. magrittr's `%>%` is looser and accepts the bare name, which is what catches people moving between the two pipes.
</details>

## When should you NOT use the pipe?

Pipes are a tool, not a religion. Here are three cases where they hurt readability rather than help.

**Don't pipe a single call.** `sort(x)` is clearer than `x |> sort()`. The pipe adds visual noise with no benefit.

**Don't pipe when the intermediate variable has meaning.** If you'd describe a step as "the filtered customers" or "the standardized scores," save it to a named variable. A chain of 10 anonymous intermediate results is harder to debug than 3 named ones.

**Don't pipe when you need the value twice.** The pipe discards the original after one use. If step 3 needs both the current result and the original input, use a variable:

```r title="When not to pipe: single call"
# Bad — can't access original x inside the chain
# x |> transform() |> compare_to_original()  # no handle on x

# Good
scaled <- (mtcars$mpg - mean(mtcars$mpg)) / sd(mtcars$mpg)
scaled
#>  [1]  0.15088 ...
```

**Try it:** Decide which of these is clearer, single call or pipe: `sqrt(16)` vs `16 |> sqrt()`.

```r title="Exercise: sqrt(16) is clearer"
# answer: sqrt(16) — single-call pipes are noise
sqrt(16)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Single-call solution"
sqrt(16)
#> [1] 4
```

For a single function call, the nested form is already left-to-right, there's nothing to flatten. `16 |> sqrt()` adds two characters and an extra reading step for zero gain. Pipes earn their keep at three or more chained steps, not one.
</details>

## Practice Exercises

### Exercise 1: Refactor nested into pipe

Rewrite this nested call using `|>`:

```r title="Exercise: rewrite nested call with pipe"
round(mean(abs(c(-3, -1, 4, -5, 2))), 1)
```

<details>
<summary>Show solution</summary>

```r title="Nested-rewrite solution"
c(-3, -1, 4, -5, 2) |> abs() |> mean() |> round(1)
#> [1] 3
```
</details>

### Exercise 2: Placeholder practice

Use the native pipe's `_` placeholder to fit a linear model of `mpg ~ wt + hp` on `mtcars` without naming `mtcars` inside `lm()`.

<details>
<summary>Show solution</summary>

```r title="Exercise: lm with two predictors"
mtcars |> lm(mpg ~ wt + hp, data = _) |> coef()
#> (Intercept)          wt          hp 
#> 37.22727012 -3.87783074 -0.03177295
```
</details>

### Exercise 3: Dplyr pipeline

Using `|>` and dplyr, from `iris`: filter to Species == "versicolor", compute the mean of every numeric column.

<details>
<summary>Show solution</summary>

```r title="Two-predictor solution"
library(dplyr)
iris |>
  filter(Species == "versicolor") |>
  summarise(across(where(is.numeric), mean))
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1        5.936        2.77         4.26       1.326
```
</details>

## Putting It All Together

A complete one-pipeline analysis, load, clean, transform, summarize, and visualize, on `mtcars`.

```r title="End-to-end piped mtcars analysis"
library(dplyr)

result <- mtcars |>
  tibble::rownames_to_column("model") |>
  filter(cyl %in% c(4, 6)) |>
  mutate(
    power_to_weight = hp / wt,
    efficiency = mpg / hp
  ) |>
  group_by(cyl) |>
  summarise(
    n = n(),
    mean_mpg = mean(mpg),
    mean_ptw = mean(power_to_weight),
    mean_eff = round(mean(efficiency), 4)
  ) |>
  arrange(desc(mean_mpg))

result
#> # A tibble: 2 x 5
#>     cyl     n mean_mpg mean_ptw mean_eff
#>   <dbl> <int>    <dbl>    <dbl>    <dbl>
#> 1     4    11     26.7     34.7    0.319
#> 2     6     7     19.7     40.2    0.163
```

Eight pipeline stages, one result. Every step reads in natural order, and any line can be commented out for quick debugging.

## Summary

| Aspect | `%>%` (magrittr) | `\|>` (base) |
|--------|------------------|---------------|
| Available since | 2014 | R 4.1 (2021) |
| Package needed | magrittr (or tidyverse) | none |
| `()` on RHS required | No | Yes |
| Placeholder | `.` anywhere | `_` in named args only |
| Speed | Slower (function call) | Faster (syntax) |
| Recommended for | Legacy code, `.` placeholder use | New code, default choice |

## References

1. [R 4.1.0 release notes, native pipe](https://stat.ethz.ch/pipermail/r-announce/2021/000670.html)
2. [magrittr documentation](https://magrittr.tidyverse.org/)
3. [R for Data Science, Pipes](https://r4ds.hadley.nz/workflow-style#pipes)
4. [Advanced R, Function composition](https://adv-r.hadley.nz/functions.html#function-composition) by Hadley Wickham
5. [Tidyverse Style Guide, Pipes](https://style.tidyverse.org/pipes.html)

## Continue Learning

- [dplyr filter() and select()](dplyr-filter-select.html), the most common pipeline starting point.
- [dplyr group_by() + summarise()](dplyr-group-by-summarise.html), the pattern at the heart of every analysis.
- [R Data Frames: Every Operation You'll Need](R-Data-Frames.html), the structures that flow through pipelines.
