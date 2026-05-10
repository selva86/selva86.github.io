---
title: "purrr Exercises in R: 50 Real Practice Problems"
slug: "purrr-Exercises-in-R"
description: "Master purrr with 50 practice problems in R: map, walk, reduce, safely, possibly, and many-models patterns. Hidden solutions, runnable code."
keywords: "purrr exercises, purrr practice, purrr exercises in R, map function R exercises, R functional programming practice, purrr many models"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "purrr Exercises"
sidebar_order: 113
fr_parent: "R-Tutorial.html"
auto_link_terms: "purrr exercises|purrr practice|map function R exercises|R functional programming practice"
auto_link_case_sensitive: false
target_keyword: "purrr exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# purrr Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems on purrr: map family, walk, reduce, safely/possibly, predicate variants, and many-models. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(purrr)
library(dplyr)
library(tibble)
library(broom)
```

## Section 1. map family basics (10 problems)

### Exercise 1.1: map a function

**Difficulty:** Beginner. Square each of 1:5 returning a list.

<details><summary>Show solution</summary>

```r
map(1:5, ~ .x^2)
```

</details>

### Exercise 1.2: map_dbl

**Difficulty:** Beginner. Same but return numeric.

<details><summary>Show solution</summary>

```r
map_dbl(1:5, ~ .x^2)
```

</details>

### Exercise 1.3: map_chr

**Difficulty:** Beginner. Convert numbers to strings.

<details><summary>Show solution</summary>

```r
map_chr(1:5, ~ paste0("v_", .x))
```

</details>

### Exercise 1.4: map_int

**Difficulty:** Beginner. Length of each list element.

<details><summary>Show solution</summary>

```r
map_int(list(1:3, 1:5, 1), length)
```

</details>

### Exercise 1.5: map_lgl

**Difficulty:** Intermediate. Are means positive?

<details><summary>Show solution</summary>

```r
map_lgl(list(c(1,-2,3), c(-1,-2), c(5)), ~ mean(.x) > 0)
```

</details>

### Exercise 1.6: map_dfr

**Difficulty:** Intermediate. Build a tibble from a list of vectors.

<details><summary>Show solution</summary>

```r
map_dfr(1:3, ~ tibble(n = .x, sq = .x^2))
```

</details>

### Exercise 1.7: map_dfc

**Difficulty:** Advanced. Combine columnwise.

<details><summary>Show solution</summary>

```r
map_dfc(c("a","b","c"), ~ tibble(!!.x := 1:3))
```

</details>

### Exercise 1.8: map with named list

**Difficulty:** Intermediate. Apply mean per element.

<details><summary>Show solution</summary>

```r
lst <- list(a = 1:5, b = 6:10, c = 11:15)
map_dbl(lst, mean)
```

</details>

### Exercise 1.9: map a function with extra args

**Difficulty:** Intermediate. Pass na.rm = TRUE.

<details><summary>Show solution</summary>

```r
lst <- list(c(1,NA,3), c(NA,5,6))
map_dbl(lst, mean, na.rm = TRUE)
```

</details>

### Exercise 1.10: map with anonymous function

**Difficulty:** Intermediate. Use \() shorthand (R 4.1+).

<details><summary>Show solution</summary>

```r
map_dbl(1:5, \(x) x * 10)
```

</details>

## Section 2. map2 and pmap (8 problems)

### Exercise 2.1: map2_dbl

**Difficulty:** Intermediate. Element-wise x^y.

<details><summary>Show solution</summary>

```r
map2_dbl(c(2,3,4), c(1,2,3), ~ .x^.y)
```

</details>

### Exercise 2.2: map2_chr

**Difficulty:** Intermediate. Combine two vectors into formatted strings.

<details><summary>Show solution</summary>

```r
map2_chr(c("Alice","Bob"), c(30, 25), ~ paste(.x, "is", .y))
```

</details>

### Exercise 2.3: pmap with three vectors

**Difficulty:** Advanced. Compute x*y + z.

<details><summary>Show solution</summary>

```r
pmap_dbl(list(1:3, 4:6, 7:9), ~ ..1 * ..2 + ..3)
```

</details>

### Exercise 2.4: pmap with a tibble

**Difficulty:** Advanced. Treat each row as args.

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:3, y = 4:6)
pmap_dbl(df, ~ ..1 + ..2)
```

</details>

### Exercise 2.5: imap (with index)

**Difficulty:** Intermediate. map with the index/name.

<details><summary>Show solution</summary>

```r
imap_chr(c("a","b","c"), ~ paste0(.y, ":", .x))
```

</details>

### Exercise 2.6: walk for side effects

**Difficulty:** Intermediate. Print each element.

<details><summary>Show solution</summary>

```r
walk(c("a","b","c"), print)
```

</details>

### Exercise 2.7: walk2

**Difficulty:** Intermediate. Save plots per group.

<details><summary>Show solution</summary>

```r
# walk2(filenames, plots, ggsave)   # demo signature
walk2(c("v1","v2"), c(10, 20), ~ message(.x, ": ", .y))
```

</details>

### Exercise 2.8: pwalk

**Difficulty:** Advanced. Iterate over multiple parallel inputs for side effects.

<details><summary>Show solution</summary>

```r
pwalk(list(c("a","b"), c(1,2)), ~ message(..1, "=", ..2))
```

</details>

## Section 3. reduce and accumulate (6 problems)

### Exercise 3.1: Sum with reduce

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
reduce(1:10, `+`)
```

</details>

### Exercise 3.2: Reduce with accumulator

**Difficulty:** Intermediate. Running max.

<details><summary>Show solution</summary>

```r
accumulate(c(3, 1, 4, 1, 5, 9, 2, 6), max)
```

</details>

### Exercise 3.3: Reduce list of data frames

**Difficulty:** Advanced. Inner-join three.

<details><summary>Show solution</summary>

```r
dfs <- list(
  tibble(id = 1:3, a = 10:12),
  tibble(id = 1:3, b = 20:22),
  tibble(id = 1:3, c = 30:32)
)
reduce(dfs, inner_join, by = "id")
```

</details>

### Exercise 3.4: Reduce with init

**Difficulty:** Intermediate. Sum starting from 100.

<details><summary>Show solution</summary>

```r
reduce(1:5, `+`, .init = 100)
```

</details>

### Exercise 3.5: Reduce right-to-left

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
reduce(c("a","b","c"), paste, .dir = "backward")
```

</details>

### Exercise 3.6: Build cumulative product

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
accumulate(1:5, `*`)
```

</details>

## Section 4. Predicates and filtering (8 problems)

### Exercise 4.1: keep

**Difficulty:** Beginner. Keep list elements with mean > 5.

<details><summary>Show solution</summary>

```r
keep(list(c(1,2,3), c(7,8,9), c(4,5)), ~ mean(.x) > 5)
```

</details>

### Exercise 4.2: discard

**Difficulty:** Beginner. Drop NAs from a list.

<details><summary>Show solution</summary>

```r
discard(list(1, NA, 3, NA, 5), is.na)
```

</details>

### Exercise 4.3: detect (first match)

**Difficulty:** Intermediate. First element with length > 2.

<details><summary>Show solution</summary>

```r
detect(list(c(1), c(2,3), c(4,5,6)), ~ length(.x) > 2)
```

</details>

### Exercise 4.4: detect_index

**Difficulty:** Intermediate. Position of first match.

<details><summary>Show solution</summary>

```r
detect_index(c(2, 4, 6, 7, 8), ~ .x %% 2 == 1)
```

</details>

### Exercise 4.5: every

**Difficulty:** Intermediate. Are all elements positive?

<details><summary>Show solution</summary>

```r
every(c(1, 2, 3), ~ .x > 0)
```

</details>

### Exercise 4.6: some

**Difficulty:** Intermediate. Any element negative?

<details><summary>Show solution</summary>

```r
some(c(1, -2, 3), ~ .x < 0)
```

</details>

### Exercise 4.7: keep_at

**Difficulty:** Advanced. Keep specific named elements of a list.

<details><summary>Show solution</summary>

```r
keep_at(list(a = 1, b = 2, c = 3), c("a","c"))
```

</details>

### Exercise 4.8: compact

**Difficulty:** Intermediate. Drop NULL/empty elements.

<details><summary>Show solution</summary>

```r
compact(list(1, NULL, 3, NULL, 5))
```

</details>

## Section 5. Errors and safety (6 problems)

### Exercise 5.1: safely

**Difficulty:** Intermediate. Wrap log so it never errors.

<details><summary>Show solution</summary>

```r
safe_log <- safely(log)
result <- map(c(10, -1, 5), safe_log)
result
```

</details>

### Exercise 5.2: Extract results from safely

**Difficulty:** Intermediate. Pluck results.

<details><summary>Show solution</summary>

```r
out <- map(list(10, "x", 5), safely(log))
map(out, "result")
```

</details>

### Exercise 5.3: possibly

**Difficulty:** Intermediate. Replace failures with default.

<details><summary>Show solution</summary>

```r
poss_log <- possibly(log, otherwise = NA_real_)
map_dbl(list(10, "x", 5), poss_log)
```

</details>

### Exercise 5.4: quietly

**Difficulty:** Advanced. Capture warnings/messages.

<details><summary>Show solution</summary>

```r
q_log <- quietly(log)
q_log(-1)
```

</details>

### Exercise 5.5: Handle a batch of file reads

**Difficulty:** Advanced. Read CSVs, capture errors.

<details><summary>Show solution</summary>

```r
files <- c("a.csv","missing.csv","b.csv")
results <- map(files, safely(readr::read_csv))
ok_results <- compact(map(results, "result"))
```

</details>

### Exercise 5.6: rate_backoff for retries

**Difficulty:** Advanced. Retry up to 3 times.

<details><summary>Show solution</summary>

```r
maybe_fail <- function() if (runif(1) < 0.5) stop("err") else 1
purrr::insistently(maybe_fail, rate = rate_backoff(max_times = 3))()
```

</details>

## Section 6. Many models and pipelines (4 problems)

### Exercise 6.1: lm per group

**Difficulty:** Advanced. Fit lm per Species.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  tidyr::nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)))
```

</details>

### Exercise 6.2: Tidy results

**Difficulty:** Advanced. Get coefficient tibbles per group.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  tidyr::nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)),
         tidy  = map(model, broom::tidy)) |>
  tidyr::unnest(tidy)
```

</details>

### Exercise 6.3: Per-group R-squared

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  tidyr::nest() |>
  mutate(r2 = map_dbl(data, ~ summary(lm(Sepal.Length ~ Petal.Length, data = .x))$r.squared))
```

</details>

### Exercise 6.4: Predict with each model

**Difficulty:** Advanced. Add fitted values back.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  tidyr::nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)),
         fits  = map2(model, data, predict))
```

</details>

## Section 7. Composition and currying (8 problems)

### Exercise 7.1: compose

**Difficulty:** Advanced. Compose abs(log(x)).

<details><summary>Show solution</summary>

```r
fn <- compose(abs, log)
fn(-2.7)
```

</details>

### Exercise 7.2: partial application

**Difficulty:** Advanced. Make a paste with fixed sep.

<details><summary>Show solution</summary>

```r
paste_dash <- partial(paste, sep = "-")
paste_dash("a","b","c")
```

</details>

### Exercise 7.3: Negate

**Difficulty:** Intermediate. Invert a predicate.

<details><summary>Show solution</summary>

```r
not_null <- negate(is.null)
not_null(NULL)   # FALSE
not_null(1)      # TRUE
```

</details>

### Exercise 7.4: list_modify

**Difficulty:** Advanced. Update list elements.

<details><summary>Show solution</summary>

```r
list_modify(list(a = 1, b = 2), b = 99, c = 3)
```

</details>

### Exercise 7.5: list_flatten

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
list_flatten(list(list(1, 2), list(3, 4)))
```

</details>

### Exercise 7.6: list_rbind

**Difficulty:** Intermediate. Modern alternative to map_dfr.

<details><summary>Show solution</summary>

```r
list_rbind(list(tibble(x = 1), tibble(x = 2)))
```

</details>

### Exercise 7.7: pluck

**Difficulty:** Intermediate. Deep extraction from nested list.

<details><summary>Show solution</summary>

```r
nested <- list(a = list(b = list(c = 42)))
pluck(nested, "a", "b", "c")
```

</details>

### Exercise 7.8: as_mapper string shortcut

**Difficulty:** Advanced. Use a string to access by name.

<details><summary>Show solution</summary>

```r
lst <- list(list(name = "A"), list(name = "B"))
map_chr(lst, "name")
```

</details>

## What to do next

- **R-Functional-Programming-Exercises** (coming) — base R FP idioms.
- **tidyverse-Exercises** (shipped) — purrr inside larger pipelines.
- **Apply-Family-Exercises** (coming) — purrr alternatives.
