---
title: "Composable R Code: Design Functions That Chain Together Like Unix Pipes"
slug: "Writing-Composable-R-Code"
description: "Learn to design composable R functions: small, single-purpose, data-first, type-stable, side-effect free. Chain them with pipes and purrr beautifully."
keywords: "composable R code, composable R functions, R function design, pipe-friendly functions, R functional programming, tidyverse function design"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "4.2.8"
post_type: "C"
auto_link_terms: "composable R code|composable functions|pipe-friendly functions|composable function design|R function composition"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Composable R Code"
sidebar_order: 40
difficulty: "Beginner"
---

# Composable R Code: Design Functions That Chain Together Like Unix Pipes

<p class="lead">Composable R code is built from small, single-purpose functions that take a data object as their first argument and return the same shape — so they chain effortlessly through <code>|&gt;</code>, exactly like Unix shell commands chain through <code>|</code>.</p>

This tutorial gives you five concrete rules for writing functions that snap together cleanly, plus before-and-after refactors so you can see the difference in real R code. We will use base R and the tidyverse interchangeably — both ecosystems share the same composition idea.

## What does it mean for R code to be composable?

Unix shell commands feel powerful in combination because every command reads from stdin and writes to stdout the same way. R can feel just as powerful once your functions follow a small set of shape rules. Here is a tiny end-to-end pipeline using nothing but composable building blocks — each function does one job, takes a data frame, and hands one back.

```r
library(dplyr)

summary_by_cyl <- mtcars |>
  filter(mpg > 18) |>
  mutate(kpl = mpg * 0.425) |>
  group_by(cyl) |>
  summarise(avg_kpl = mean(kpl), n = n())

summary_by_cyl
#> # A tibble: 3 × 3
#>     cyl avg_kpl     n
#>   <dbl>   <dbl> <int>
#> 1     4    11.4    11
#> 2     6    8.96     7
#> 3     8    6.71     4
```

Look at the structure. Four functions — `filter()`, `mutate()`, `group_by()`, `summarise()` — chain through `|>` without a single intermediate variable. Each one accepts a data frame and returns a data frame. None of them print, plot, or write a file as a side effect. That is what "composable" means in practice: predictable shape in, predictable shape out, one job per function.

A function is composable when you can drop it into the middle of a pipe without thinking about it. Five rules make that possible. Each section below covers one rule, with a refactor that shows what changes when you apply it.

[KEY INSIGHT]
**The pipe is just glue — composability lives in the functions, not the operator.** `|>` only works because the functions on either side agree on a shape. Get the function shapes right and the pipe falls out naturally.

**Try it:** Write a 2-step pipe on `mtcars` that keeps rows where `cyl == 6` and then computes the mean `hp`. Save the result to `ex_mean_hp`.

```r
# Try it: chain filter + summarise
ex_mean_hp <- mtcars |>
  # your code here

ex_mean_hp
#> Expected: roughly 122.3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mean_hp <- mtcars |>
  filter(cyl == 6) |>
  summarise(mean_hp = mean(hp))

ex_mean_hp
#>    mean_hp
#> 1 122.2857
```

**Explanation:** `filter()` and `summarise()` both take a data frame and return one, so they snap together with `|>` directly.

</details>

## How do you keep a function focused on one job?

The first rule is the hardest one to follow because it asks you to resist convenience. When you are deep in an analysis, it is tempting to write one big function that loads, cleans, summarises, and prints results all at once. That function feels efficient — until you need to reuse half of it and discover the halves are stuck together.

Here is a "swiss army knife" function that does too many things. Notice how many concerns are tangled inside it.

```r
# Bad: one function doing four jobs
analyze_cars <- function(df, mpg_floor) {
  filtered <- df[df$mpg > mpg_floor, ]
  filtered$kpl <- filtered$mpg * 0.425
  result <- aggregate(kpl ~ cyl, data = filtered, FUN = mean)
  print(result)
  result
}

analyze_cars(mtcars, 18)
#>   cyl       kpl
#> 1   4 11.41591
#> 2   6  8.957143
#> 3   8  6.715
```

Notice four problems jammed into seven lines. The function filters rows, derives a new column, aggregates, *and* prints the result as a side effect. If you want to filter without aggregating — or aggregate without printing — you cannot. Worse, you cannot describe the function in one sentence without using the word "and."

Now refactor it into three small helpers that each do exactly one thing.

```r
# Good: three single-purpose helpers
filter_fast <- function(df, mpg_floor) {
  df[df$mpg > mpg_floor, ]
}

add_kpl <- function(df) {
  df$kpl <- df$mpg * 0.425
  df
}

mean_kpl_by_cyl <- function(df) {
  aggregate(kpl ~ cyl, data = df, FUN = mean)
}

mtcars |>
  filter_fast(18) |>
  add_kpl() |>
  mean_kpl_by_cyl()
#>   cyl       kpl
#> 1   4 11.41591
#> 2   6  8.957143
#> 3   8  6.715
```

Each helper does one thing and you can describe it in a sentence: "filter rows above an mpg floor," "add a kilometres-per-litre column," "aggregate kpl by cylinder." You can reuse `filter_fast()` in twenty other contexts. You can swap `mean_kpl_by_cyl()` for `median_kpl_by_cyl()` without touching the rest. The pipeline reads top-to-bottom like a recipe.

[KEY INSIGHT]
**If you cannot describe a function in one sentence without using "and", split it.** The word "and" is the smell — it tells you the function has at least two responsibilities and at least two reasons to change.

**Try it:** Write a function `ex_clean_mpg(df)` that drops rows where `mpg` is `NA` and only that. Test it on a tweaked `mtcars` where one row has `mpg = NA`.

```r
# Try it: write ex_clean_mpg() — single job only
ex_clean_mpg <- function(df) {
  # your code here
}

ex_test <- mtcars
ex_test$mpg[1] <- NA
nrow(ex_clean_mpg(ex_test))
#> Expected: 31
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_clean_mpg <- function(df) {
  df[!is.na(df$mpg), ]
}

ex_test <- mtcars
ex_test$mpg[1] <- NA
nrow(ex_clean_mpg(ex_test))
#> [1] 31
```

**Explanation:** One job — drop NA rows in `mpg`. Nothing else. The function is now reusable anywhere you need that exact step.

</details>

## Why must the data argument come first?

The second rule is mechanical but absolutely load-bearing for pipe-friendliness. The native pipe `|>` always passes its left-hand side as the *first* argument of the right-hand function. If your function takes data as its second or third argument, it will not chain.

Watch what happens when you put the data argument in the wrong position.

```r
# Data first — pipe-friendly
add_kpl_first <- function(df, factor = 0.425) {
  df$kpl <- df$mpg * factor
  df
}

# Data last — breaks the pipe
add_kpl_last <- function(factor = 0.425, df) {
  df$kpl <- df$mpg * factor
  df
}

# Works
head(mtcars |> add_kpl_first(), 2)
#>               mpg cyl disp  hp drat    wt  qsec vs am gear carb     kpl
#> Mazda RX4      21   6  160 110 3.90 2.620 16.46  0  1    4    4 8.92500
#> Mazda RX4 Wag  21   6  160 160 3.88 2.875 17.02  0  1    4    4 8.92500

# Breaks — mtcars gets bound to `factor`, leaving `df` missing
try(head(mtcars |> add_kpl_last(), 2))
#> Error in add_kpl_last() : argument "df" is missing, with no default
```

The first call works because `mtcars` slots into `df`. The second call fails because `mtcars` gets bound to `factor` and then R tries to do `mtcars$mpg * df`, which has no meaning. The fix is permanent and free: always make the data object the first argument. Optional tuning parameters go after it with sensible defaults.

[TIP]
**Use the `_` placeholder when an existing function puts data in the wrong slot.** R 4.2+ supports `mtcars |> lm(mpg ~ wt, data = _)` so you can pipe into the `data` argument explicitly without rewriting the function.

**Try it:** Write `ex_top_hp(df, n)` that returns the top-n rows of a data frame by `hp`. Make it pipe-friendly.

```r
# Try it: data-first design
ex_top_hp <- function(df, n) {
  # your code here
}

mtcars |> ex_top_hp(3)
#> Expected: the 3 rows with highest hp
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_top_hp <- function(df, n) {
  df[order(-df$hp), ][1:n, ]
}

mtcars |> ex_top_hp(3)
#>                     mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Maserati Bora      15.0   8  301 335 3.54 3.570 14.60  0  1    5    8
#> Ford Pantera L     15.8   8  351 264 4.22 3.170 14.50  0  1    5    4
#> Duster 360         14.3   8  360 245 3.21 3.730 15.84  0  1    5    4
```

**Explanation:** Data first, configuration second. The function chains directly into any upstream pipeline.

</details>

## How do you keep a function free of side effects?

The third rule is the one that separates "code that runs" from "code you can trust inside a pipeline." A side effect is anything a function does besides returning a value: printing, plotting, writing a file, modifying a global variable, sending an HTTP request. Side effects are not bad — they are how programs touch the real world — but they wreck composability when they are smuggled inside transform functions.

![Pure transforms feed each other; side effects sit at the edges of the pipeline.](screenshots/Writing-Composable-R-Code-side-effects.webp)

*Figure 1: Pure transforms feed each other; side effects sit at the edges of the pipeline.*

The picture says it: pure transforms live in the middle of the pipeline and pass shapes to each other. Side effects sit at the very edges — read at the start, write/print/plot at the end. Mixing the two zones is what creates code you cannot reuse.

Here is a function that mutates a global variable as a side effect. It happens to "work" but it cannot be safely called twice.

```r
# Bad: side effect mutates a global counter
call_count <- 0

bad_scale <- function(x) {
  call_count <<- call_count + 1   # hidden side effect
  (x - mean(x)) / sd(x)
}

bad_scale(mtcars$mpg)[1:3]
#> [1]  0.1508848  0.1508848  0.4495434
call_count
#> [1] 1
```

The function does its math correctly but it secretly modifies `call_count` every time it runs. If you call it inside a pipe and then re-run the same pipe later, the counter keeps climbing — and now your "pure" data transformation has hidden state. Compare it with the pure version below.

```r
# Good: pure transform, no global state
scale_col <- function(x) {
  (x - mean(x)) / sd(x)
}

scale_col(mtcars$mpg)[1:3]
#> [1]  0.1508848  0.1508848  0.4495434
```

The pure version takes a vector, returns a vector, and does nothing else. Run it a thousand times and the rest of your environment looks identical. That is the property you want for any function that lives in the middle of a pipe.

[WARNING]
**The `<<-` operator is the most common source of hidden side effects in R.** It writes to the parent environment, which usually means a global variable. If you see `<<-` inside a transform function, treat it as a bug until proven otherwise.

**Try it:** Refactor `bad_log` below into a pure function that takes a numeric vector and returns its log10, with no globals.

```r
# Try it: remove the side effect
log_count <- 0
bad_log <- function(x) {
  log_count <<- log_count + 1
  log10(x)
}

ex_log <- function(x) {
  # your code here
}

ex_log(c(1, 10, 100))
#> Expected: c(0, 1, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_log <- function(x) {
  log10(x)
}

ex_log(c(1, 10, 100))
#> [1] 0 1 2
```

**Explanation:** No global, no print, no write. The function takes input, returns output, and that is the entire contract.

</details>

## What is type stability and why does it matter?

The fourth rule is about predictability. A function is *type-stable* when its output shape and type depend only on its input shape and type — never on the input *values*. Type-unstable functions are a famous footgun in base R because they sometimes return a vector, sometimes a list, sometimes a matrix — depending on what the data happens to look like that day.

The classic offender is `sapply()`. It tries to "do the right thing" by simplifying its result, which means you cannot predict its return type ahead of time.

```r
# sapply: type-unstable
result_full <- sapply(1:3, function(i) i * 2)
class(result_full)
#> [1] "integer"

result_empty <- sapply(integer(0), function(i) i * 2)
class(result_empty)
#> [1] "list"
```

Same function, two different return types — `integer` when there is data, `list` when the input is empty. If the next step in your pipe expects an integer vector, the empty case crashes with a confusing error and you spend an hour finding it. Type-stable alternatives let you declare the contract up front.

```r
library(purrr)

# vapply: declare the output type
safe_full <- vapply(1:3, function(i) i * 2, integer(1))
safe_empty <- vapply(integer(0), function(i) i * 2, integer(1))
class(safe_full); class(safe_empty)
#> [1] "integer"
#> [1] "integer"

# purrr::map_dbl: same idea, friendlier
map_dbl(1:3, ~ .x * 2)
#> [1] 2 4 6
map_dbl(numeric(0), ~ .x * 2)
#> numeric(0)
```

`vapply()` forces you to declare the per-element type up front, so the function either returns the type you asked for or errors immediately. `purrr::map_dbl()` does the same thing but with a cleaner name — the `_dbl` suffix tells you "always returns a double vector." Both functions guarantee a stable shape, which means downstream code can rely on them.

[KEY INSIGHT]
**Type-stable functions are safe to chain; type-unstable functions are landmines.** If a function might return one of three types depending on the data, you cannot put it inside a reusable pipeline without wrapping it in defensive checks.

**Try it:** Replace the `sapply()` call below with `purrr::map_dbl()` so the function always returns a numeric vector.

```r
# Try it: make this type-stable
ex_lengths <- function(strings) {
  # your code here — use map_dbl
}

ex_lengths(c("apple", "banana", "kiwi"))
#> Expected: c(5, 6, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_lengths <- function(strings) {
  map_dbl(strings, nchar)
}

ex_lengths(c("apple", "banana", "kiwi"))
#> [1] 5 6 4
```

**Explanation:** `map_dbl()` is contractually guaranteed to return a `double` vector — even on an empty input, which would make `sapply()` return a list.

</details>

## How do you compose small functions into a real pipeline?

The fifth rule is "small" — keep each helper short enough that you can hold it in your head all at once. Roughly twenty lines is a good ceiling. Once you have small, single-purpose, data-first, side-effect-free, type-stable functions, composing them is the easy part. You just write down the steps in order and connect them with `|>`.

![Each step in a pipe takes a data frame and returns one — so the next step plugs straight in.](screenshots/Writing-Composable-R-Code-pipe-flow.webp)

*Figure 2: Each step in a pipe takes a data frame and returns one — so the next step plugs straight in.*

The diagram captures the whole idea. Each box is a function that takes a data frame and returns one. The arrows are `|>`. There is no special composition machinery — just functions that share a shape. Now let us build a real example with three small helpers and chain them on `iris`.

```r
# Three small composable helpers
drop_na_rows <- function(df) {
  df[complete.cases(df), ]
}

z_scale <- function(df, col) {
  df[[col]] <- (df[[col]] - mean(df[[col]])) / sd(df[[col]])
  df
}

top_n_by <- function(df, col, n) {
  df[order(-df[[col]]), ][1:n, ]
}
```

Each helper is short (1–4 lines), takes a data frame as its first argument, returns a data frame, and has no side effects. None of them know about the others. Now compose them.

```r
iris_top <- iris |>
  drop_na_rows() |>
  z_scale("Sepal.Length") |>
  top_n_by("Sepal.Length", 3)

iris_top[, c("Species", "Sepal.Length")]
#>       Species Sepal.Length
#> 132 virginica     2.483699
#> 118 virginica     2.241010
#> 136 virginica     2.241010
```

Notice how the pipeline reads as a sentence: "drop NA rows, z-scale Sepal.Length, take the top 3." If you wanted to swap z-scaling for min-max scaling, you would write a new `minmax_scale()` helper and substitute it — none of the other steps would change. That is the leverage composability gives you: small helpers are cheap to add, swap, and combine.

[NOTE]
**`purrr::compose()` lets you build a new function out of existing ones without going through data.** It is useful when you want to create a named pipeline that is itself a single function — for example, `clean_and_scale <- compose(z_scale, drop_na_rows, .dir = "forward")`.

[TIP]
**Name composable helpers with verbs.** Verbs like `filter_`, `add_`, `scale_`, `drop_`, `summarise_` make pipelines read like English. Avoid noun-only names like `analysis()` or `stats()` — they hide what the function does.

**Try it:** Add a fourth helper `add_id(df)` that prepends a 1-based row id column called `row_id`. Chain it into the pipeline so the final result has `row_id` plus the existing columns.

```r
# Try it: extend the pipeline
add_id <- function(df) {
  # your code here
}

iris |>
  drop_na_rows() |>
  z_scale("Sepal.Length") |>
  add_id() |>
  top_n_by("Sepal.Length", 2)
#> Expected: 2 rows with row_id, Species, and scaled Sepal.Length
```

<details>
<summary>Click to reveal solution</summary>

```r
add_id <- function(df) {
  df$row_id <- seq_len(nrow(df))
  df
}

ex_top2 <- iris |>
  drop_na_rows() |>
  z_scale("Sepal.Length") |>
  add_id() |>
  top_n_by("Sepal.Length", 2)

ex_top2[, c("row_id", "Species", "Sepal.Length")]
#>     row_id   Species Sepal.Length
#> 132    132 virginica     2.483699
#> 118    118 virginica     2.241010
```

**Explanation:** `add_id()` follows every rule — single job, data first, no side effects, type-stable, small. So it slots into the pipeline at any position you like.

</details>

## Practice Exercises

These exercises stitch the five rules together. Use distinct variable names so they do not collide with tutorial state.

### Exercise 1: Refactor a swiss-army function

Below is a 12-line function that filters, scales, summarises, and prints. Refactor it into three composable helpers — `my_filter()`, `my_scale()`, `my_summary()` — plus one orchestrator that chains them. The orchestrator should return the result, not print it.

```r
# Refactor this:
swiss_army <- function(df, weight_floor) {
  small <- df[df$wt > weight_floor, ]
  small$wt_z <- (small$wt - mean(small$wt)) / sd(small$wt)
  res <- aggregate(wt_z ~ cyl, data = small, FUN = mean)
  print(res)
  res
}

# Write your three helpers + orchestrator below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_filter <- function(df, weight_floor) {
  df[df$wt > weight_floor, ]
}

my_scale <- function(df) {
  df$wt_z <- (df$wt - mean(df$wt)) / sd(df$wt)
  df
}

my_summary <- function(df) {
  aggregate(wt_z ~ cyl, data = df, FUN = mean)
}

orchestrate <- function(df, weight_floor) {
  df |>
    my_filter(weight_floor) |>
    my_scale() |>
    my_summary()
}

orchestrate(mtcars, 2.5)
#>   cyl       wt_z
#> 1   4 -1.0728926
#> 2   6 -0.4324132
#> 3   8  0.5876343
```

**Explanation:** Each helper is single-purpose, data-first, side-effect-free. The orchestrator is the only thing that knows about the order of steps — and it returns its value instead of printing.

</details>

### Exercise 2: Build a reusable column scaler

Write `scale_columns(df, cols)` that takes a data frame and a character vector of column names, returns a new data frame with those columns z-scaled, and leaves the other columns untouched. It must be type-stable (always returns a data frame), data-first, and side-effect-free. Then chain it on `iris` to scale `Sepal.Length` and `Petal.Length` together.

```r
# Build the scaler:
scale_columns <- function(df, cols) {
  # your code here
}

# Chain it:
iris |>
  scale_columns(c("Sepal.Length", "Petal.Length")) |>
  head(3)
#> Expected: 3 rows of iris with two scaled columns
```

<details>
<summary>Click to reveal solution</summary>

```r
scale_columns <- function(df, cols) {
  for (col in cols) {
    df[[col]] <- (df[[col]] - mean(df[[col]])) / sd(df[[col]])
  }
  df
}

iris |>
  scale_columns(c("Sepal.Length", "Petal.Length")) |>
  head(3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1   -0.8976739         3.5    -1.335752         0.2  setosa
#> 2   -1.1392005         3.0    -1.335752         0.2  setosa
#> 3   -1.3807271         3.2    -1.392399         0.2  setosa
```

**Explanation:** The function loops over the column names but the contract is clean — data frame in, data frame out, no globals, predictable shape.

</details>

### Exercise 3: Compose a data quality report

Write three small helpers and chain them on `airquality` to produce a per-column quality report:

- `count_missing(df)` returns a data frame with one row per column and a `na_count` column.
- `count_outliers(df)` returns the same shape but with an `outlier_count` column (define an outlier as `> mean + 3*sd` or `< mean - 3*sd`, numeric columns only).
- `merge_quality(missing_df, outlier_df)` joins them on column name.

Then call all three on `airquality` and assign the merged result to `quality_report`.

```r
# Three helpers + final chain
count_missing <- function(df) {
  # your code here
}

count_outliers <- function(df) {
  # your code here
}

merge_quality <- function(missing_df, outlier_df) {
  # your code here
}

# Chain them:
quality_report <- # your code here
quality_report
#> Expected: a data frame with 6 rows (one per column) and na/outlier counts
```

<details>
<summary>Click to reveal solution</summary>

```r
count_missing <- function(df) {
  data.frame(
    column = names(df),
    na_count = vapply(df, function(x) sum(is.na(x)), integer(1)),
    row.names = NULL
  )
}

count_outliers <- function(df) {
  is_outlier <- function(x) {
    if (!is.numeric(x)) return(0L)
    m <- mean(x, na.rm = TRUE)
    s <- sd(x, na.rm = TRUE)
    sum(x > m + 3 * s | x < m - 3 * s, na.rm = TRUE)
  }
  data.frame(
    column = names(df),
    outlier_count = vapply(df, is_outlier, integer(1)),
    row.names = NULL
  )
}

merge_quality <- function(missing_df, outlier_df) {
  merge(missing_df, outlier_df, by = "column")
}

quality_report <- merge_quality(
  count_missing(airquality),
  count_outliers(airquality)
)
quality_report
#>   column na_count outlier_count
#> 1    Day        0             0
#> 2  Month        0             0
#> 3   Ozone       37             1
#> 4    Solar.R    7             0
#> 5    Temp       0             0
#> 6    Wind       0             0
```

**Explanation:** Each helper does one thing and returns a data frame. The orchestration step combines them. Adding a fourth quality check tomorrow takes one more helper — none of the existing ones change.

</details>

## Complete Example

Here is an end-to-end mini analysis on `starwars` that uses every rule. We will compute a body-mass index for human characters, summarise the average BMI by homeworld, and pull the top-3 homeworlds — using six small composable helpers.

```r
library(dplyr)

# Six small helpers
keep_humans <- function(df) {
  df |> filter(species == "Human")
}

drop_missing_body <- function(df) {
  df |> filter(!is.na(height), !is.na(mass))
}

add_bmi <- function(df) {
  df |> mutate(bmi = mass / (height / 100)^2)
}

mean_bmi_by_homeworld <- function(df) {
  df |>
    group_by(homeworld) |>
    summarise(avg_bmi = mean(bmi), n = n(), .groups = "drop")
}

at_least <- function(df, min_n) {
  df |> filter(n >= min_n)
}

top_n_homeworlds <- function(df, n) {
  df |> arrange(desc(avg_bmi)) |> head(n)
}

# Chain them
sw_summary <- starwars |>
  keep_humans() |>
  drop_missing_body() |>
  add_bmi() |>
  mean_bmi_by_homeworld() |>
  at_least(2) |>
  top_n_homeworlds(3)

sw_summary
#> # A tibble: 3 × 3
#>   homeworld avg_bmi     n
#>   <chr>       <dbl> <int>
#> 1 Tatooine     26.0     8
#> 2 Naboo        24.6     3
#> 3 Alderaan     22.0     2
```

Six helpers, each three lines or fewer. The pipeline reads top-to-bottom: keep humans, drop missing body data, add BMI, average by homeworld, require at least two characters per homeworld, take the top 3. If your manager asks tomorrow for the *bottom* 3 instead, you change one helper. If they ask for droids instead of humans, you change one helper. That is composability paying off.

## Summary

![The five rules of composable R functions.](screenshots/Writing-Composable-R-Code-five-rules.webp)

*Figure 3: The five rules of composable R functions.*

| Rule | What it means | Why it matters |
|---|---|---|
| Single purpose | One job, one sentence to describe it | Reusable across contexts; easy to test |
| Data first | The data object is the first argument | Works with `\|>` without ceremony |
| No side effects | No prints, plots, writes, or globals inside transforms | Safe to call repeatedly inside a pipe |
| Type stable | Same input shape → same output shape | Downstream steps can rely on the contract |
| Small | Roughly under 20 lines | Holdable in your head; easy to swap |

Apply all five and your functions will snap together with `|>` exactly the way Unix commands snap together with `|`. Apply none of them and you end up with the swiss-army functions every refactor starts by tearing apart.

## References

1. Wickham, H. — *Tidyverse design principles: Unifying principles*. [Link](https://design.tidyverse.org/unifying.html)
2. Wickham, H. — *The tidy tools manifesto*. [Link](https://tidyverse.tidyverse.org/articles/manifesto.html)
3. Wickham, H. & Grolemund, G. — *R for Data Science*, Chapter 18: Pipes. [Link](https://r4ds.had.co.nz/pipes.html)
4. Tidyverse style guide — Pipes. [Link](https://style.tidyverse.org/pipes.html)
5. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 6: Functions. [Link](https://adv-r.hadley.nz/functions.html)
6. dplyr documentation. [Link](https://dplyr.tidyverse.org/)
7. purrr documentation — `map_dbl()` and friends. [Link](https://purrr.tidyverse.org/reference/map.html)
8. R Core Team — *An Introduction to R*, native pipe `|>`. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the broader paradigm that composable function design fits inside.
- [purrr map() Variants](purrr-map-Variants.html) — the type-stable workhorses (`map_dbl()`, `map_chr()`, `map_lgl()`) for replacing `sapply()`.
- [Writing R Functions](R-Functions.html) — the foundations for writing functions before you make them composable.
