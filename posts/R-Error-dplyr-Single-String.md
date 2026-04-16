---
title: "dplyr group_by Error: 'must return a single string' — The .data[[]] Fix"
slug: "R-Error-dplyr-Single-String"
description: "The dplyr 'must return a single string' error appears when you pass a column name programmatically to group_by(). Fix it with .data[[col]] or {{ col }}."
keywords: "dplyr group_by error, must return a single string, dplyr tidy evaluation, .data pronoun, embrace operator, dplyr programming, dplyr column variable"
auto_link_terms: "dplyr group_by error|must return a single string|.data pronoun|embrace operator|dplyr tidy evaluation"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR11"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# dplyr group_by Error: 'must return a single string' — The .data[[]] Fix

<p class="lead">The dplyr "must return a single string" error fires when you hand <code>group_by()</code> a column name stored in a variable. dplyr's tidy evaluation reads bare names as columns and strings as literal values — to group by a stored column name, wrap the variable in <code>.data[[col]]</code> (for strings) or <code>{{ col }}</code> (for bare names inside functions).</p>

## What does 'must return a single string' mean in dplyr?

You hit this error the moment you try to be clever about grouping. Instead of writing `group_by(cyl)`, you store the column name in a variable and pass it in — and dplyr complains with a message about strings, lengths, or missing columns. Below is the smallest reproduction. Run it once, then we'll unpack why dplyr disagrees with what you meant.

```r
library(dplyr)

my_col <- "cyl"
mtcars |> group_by(my_col) |> summarise(n = n())
#> Error in `group_by()`:
#> ! Must group by variables found in `.data`.
#> ✖ Column `my_col` is not found.
```

Notice what dplyr is really saying: *"I looked for a column literally named `my_col` in your data frame, and there isn't one."* It never peeked at the *value* held by `my_col` (the string `"cyl"`) — it took the expression you typed at face value. In older dplyr versions the same mistake can surface as "must return a single string" or "must be a length-one character vector," but the cause is identical.

[NOTE]
**Exact error wording varies by dplyr version.** dplyr 1.1+ says "Column not found"; pre-1.0 versions phrase the same fault as "must return a single string." The root cause — passing a string where dplyr expects a bare column symbol — is the same, and so is the fix below.

**Try it:** Store `"gear"` in `ex_col` and reproduce the same error by passing `ex_col` to `group_by()`.

```r
# Try it: reproduce the error with your own variable
ex_col <- "gear"
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_col <- "gear"
mtcars |> group_by(ex_col) |> summarise(n = n())
#> Error in `group_by()`:
#> ! Must group by variables found in `.data`.
#> ✖ Column `ex_col` is not found.
```

**Explanation:** Same pattern, same failure — dplyr treats `ex_col` as a literal column name, not as a reference to the string `"gear"`.

</details>

## Why does dplyr treat my variable as a column name?

dplyr uses **tidy evaluation** — a system that captures the expression you type, not the value it evaluates to. When you write `group_by(cyl)`, dplyr wants to see the symbol `cyl` so it can look up a column by that exact name. When you write `group_by(my_col)`, it sees the symbol `my_col` and looks for that column — never dereferencing the variable to discover it holds `"cyl"`.

The same trap appears with vectors of column names.

```r
cols <- c("cyl", "gear")
mtcars |> group_by(cols) |> tally()
#> Error in `group_by()`:
#> ! Must group by variables found in `.data`.
#> ✖ Column `cols` is not found.
```

dplyr isn't being stubborn — it's protecting you from ambiguity. If it silently dereferenced variables, a typo or shadowed name would group your data by the wrong column and hide the bug. The explicit error is the safer choice.

[KEY INSIGHT]
**dplyr reads what you typed, not what your variable points to.** Bare names are column references; strings are just strings. To bridge the gap, you need an explicit unquoting tool — either `.data[[col]]` or the embrace operator `{{ col }}`. Everything else in this post is applying that one idea.

**Try it:** Predict what happens if you assign `ex_valid <- "mpg"` and run `group_by(ex_valid)`. Does the error mention `mpg` or `ex_valid`?

```r
ex_valid <- "mpg"
# your code here: group_by(ex_valid) and see which name dplyr complains about
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_valid <- "mpg"
mtcars |> group_by(ex_valid) |> tally()
#> Error in `group_by()`:
#> ! Must group by variables found in `.data`.
#> ✖ Column `ex_valid` is not found.
```

**Explanation:** The error names `ex_valid`, not `mpg`. That confirms dplyr is looking at the literal symbol you passed — it never checks the variable's value. Even when the value would have been a real column, the lookup fails because dplyr looked for the wrong name.

</details>

## How do you fix it with .data[[col]]?

`.data` is a pronoun provided by the rlang package (re-exported by dplyr). Inside a dplyr verb, `.data` stands in for "the current data frame" and supports string indexing with `[[ ]]`. Writing `.data[["cyl"]]` tells dplyr: "look up the column whose name is the string I'm about to hand you." That's exactly the bridge we need.

Wrap `my_col` in `.data[[ ]]` and the grouping works.

```r
mtcars |>
  group_by(.data[[my_col]]) |>
  summarise(mean_mpg = mean(mpg), .groups = "drop")
#> # A tibble: 3 × 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4     26.7
#> 2     6     19.7
#> 3     8     15.1
```

dplyr evaluated `my_col` (getting `"cyl"`), handed the string to `.data[[ ]]`, and looked up the `cyl` column. The resulting tibble has one row per engine-cylinder group and the mean mpg for each. No magic — just an explicit string lookup where dplyr expected a bare symbol.

[TIP]
**Prefer .data[[col]] over !!sym(col).** Both work, but `.data[[ ]]` is clearer, avoids the `!!` (bang-bang) unquoting operator, and is the pattern the tidyverse team recommends in the dplyr programming vignette. Reserve `!!sym()` for meta-programming cases where you're assembling expressions dynamically.

**Try it:** Fix this broken pipeline by wrapping the string variable with `.data[[ ]]`.

```r
# Try it: this pipeline errors — fix it
ex_col <- "gear"
mtcars |>
  group_by(ex_col) |>
  summarise(avg_hp = mean(hp), .groups = "drop")
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_col <- "gear"
mtcars |>
  group_by(.data[[ex_col]]) |>
  summarise(avg_hp = mean(hp), .groups = "drop")
#> # A tibble: 3 × 2
#>    gear avg_hp
#>   <dbl>  <dbl>
#> 1     3   176.
#> 2     4    89.5
#> 3     5   196.
```

**Explanation:** Wrapping `ex_col` in `.data[[ ]]` tells dplyr to treat its value (`"gear"`) as a column name lookup instead of a bare symbol.

</details>

## When should you use {{ col }} instead?

The `.data[[col]]` pattern works when the column name arrives as a string. But what if you're writing a reusable function and you want the *caller* to pass a bare column name, the way `group_by()` itself accepts bare names? That's what the **embrace operator** `{{ }}` is for. It forwards an unevaluated expression from the caller straight through to dplyr's tidy-evaluation machinery.

Here's a helper that takes a bare column and returns a grouped mean.

```r
group_summary <- function(df, group_col) {
  df |>
    group_by({{ group_col }}) |>
    summarise(mean_mpg = mean(mpg), .groups = "drop")
}

group_summary(mtcars, cyl)
#> # A tibble: 3 × 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4     26.7
#> 2     6     19.7
#> 3     8     15.1
```

The caller writes `cyl` with no quotes — exactly the ergonomics of built-in dplyr verbs. Inside `group_summary()`, `{{ group_col }}` unwraps that expression and hands it to `group_by()` as a bare name. If you called `group_summary(mtcars, "cyl")` instead, the embrace would forward the string and you'd be back to the original error.

[NOTE]
**`{{ }}` needs a bare name; `.data[[ ]]` needs a string.** That's the whole decision. Your function's signature dictates which one you reach for. Mixing them in the same function is fine — support both by letting one argument be a bare column and another be a string of column names.

**Try it:** Write `ex_median_summary(df, group_col)` that groups by a bare column and returns the **median** of `mpg` per group. Test it on `mtcars` with `cyl`.

```r
# Try it: median_summary with an embraced argument
ex_median_summary <- function(df, group_col) {
  # your code here
}

ex_median_summary(mtcars, cyl)
#> Expected: a tibble with columns cyl and median_mpg
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_median_summary <- function(df, group_col) {
  df |>
    group_by({{ group_col }}) |>
    summarise(median_mpg = median(mpg), .groups = "drop")
}

ex_median_summary(mtcars, cyl)
#> # A tibble: 3 × 2
#>     cyl median_mpg
#>   <dbl>      <dbl>
#> 1     4       26
#> 2     6       19.7
#> 3     8       15.2
```

**Explanation:** `{{ group_col }}` forwards the unevaluated `cyl` expression to `group_by()`, giving callers the same bare-name ergonomics dplyr verbs offer natively.

</details>

## How do .data[[]] and {{ }} compare?

Use the table below as a cheat sheet. Pick the pattern that matches how your column name arrives at the call site.

| Input form | Pattern | Typical use case |
|---|---|---|
| String variable (`"cyl"`) | `.data[[col]]` | Looping over columns, config-driven pipelines, scripts |
| Bare name (`cyl`) | `{{ col }}` | User-facing wrapper functions that mimic dplyr verbs |
| Vector of strings (`c("cyl","gear")`) | `across(all_of(cols))` | Grouping by 2+ columns named in a vector |
| Deprecated `group_by_()` | Replace with one of the above | Old code from dplyr 0.5 and earlier |

![Decision flow for fixing dplyr group_by tidy eval errors.](screenshots/R-Error-dplyr-Single-String-fix-decision.webp)

*Figure 1: Choosing between `.data[[col]]`, `{{ col }}`, and `across(all_of())` based on how the column name is supplied.*

When you have a vector of column names, `across(all_of())` is the idiomatic solution. It accepts a character vector and applies any dplyr selection to those columns.

```r
group_cols <- c("cyl", "gear")

mtcars |>
  group_by(across(all_of(group_cols))) |>
  summarise(mean_mpg = mean(mpg), .groups = "drop")
#> # A tibble: 8 × 3
#>     cyl  gear mean_mpg
#>   <dbl> <dbl>    <dbl>
#> 1     4     3     21.5
#> 2     4     4     26.9
#> 3     4     5     28.2
#> 4     6     3     19.8
#> 5     6     4     19.8
#> 6     6     5     19.7
#> 7     8     3     15.0
#> 8     8     5     15.4
```

`all_of()` is the strict version: it errors immediately if any name in `group_cols` is missing from the data, which surfaces typos at the call site instead of further down the pipeline. `any_of()` is the lenient cousin that silently skips missing names.

**Try it:** Regroup `mtcars` by `c("am", "gear")` using `across(all_of())` and summarise the mean horsepower.

```r
# Try it: across(all_of()) with a different vector
ex_group_cols <- c("am", "gear")
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_group_cols <- c("am", "gear")
mtcars |>
  group_by(across(all_of(ex_group_cols))) |>
  summarise(mean_hp = mean(hp), .groups = "drop")
#> # A tibble: 4 × 3
#>      am  gear mean_hp
#>   <dbl> <dbl>   <dbl>
#> 1     0     3    176.
#> 2     0     4    116.
#> 3     1     4    75.5
#> 4     1     5    196.
```

**Explanation:** `across(all_of(ex_group_cols))` expands the string vector into the two bare column references dplyr wants, without any further quoting.

</details>

## What other dplyr verbs need .data[[]]?

The same pattern applies everywhere in dplyr, not just `group_by()`. Any verb that takes a column reference — `filter()`, `arrange()`, `mutate()`, `summarise()`, `select()`, `pull()` — accepts `.data[[col]]` when you're holding the column name as a string.

```r
my_col <- "hp"

# filter
mtcars |> filter(.data[[my_col]] > 200) |> nrow()
#> [1] 7

# arrange (descending)
mtcars |> arrange(desc(.data[[my_col]])) |> head(3) |> rownames()
#> [1] "Maserati Bora"      "Ford Pantera L"     "Duster 360"

# mutate — create a new column whose name also comes from a variable
mtcars |>
  mutate("double_{my_col}" := .data[[my_col]] * 2) |>
  select(double_hp) |>
  head(3)
#>                   double_hp
#> Mazda RX4               220
#> Mazda RX4 Wag           220
#> Datsun 710               186
```

Three things to notice. First, the `.data[[my_col]]` idiom is identical across all three verbs — one pattern to learn, everywhere it applies. Second, in `mutate()` the *output* column name also comes from `my_col`, built with the walrus operator `:=` and glue-style string interpolation (`"double_{my_col}"`). Third, nothing stops you from mixing `.data[[]]` with bare column names in the same expression — `filter()` and `mutate()` happily accept both.

[WARNING]
**Don't write `my_col` and `.data[[my_col]]` in the same expression by accident.** If you forget the wrapper on one of several references, dplyr will look for a literal `my_col` column and throw the original error again — but only on the unwrapped reference, which makes the failure harder to spot in a long pipeline. Wrap every reference, or wrap none.

**Try it:** Using `ex_col <- "wt"`, filter `mtcars` to rows where `wt > 3`, then arrange by descending `wt`. Use `.data[[ex_col]]` throughout.

```r
# Try it: filter + arrange with .data[[]]
ex_col <- "wt"
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_col <- "wt"
mtcars |>
  filter(.data[[ex_col]] > 3) |>
  arrange(desc(.data[[ex_col]])) |>
  head(3)
#>                       mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Lincoln Continental  10.4   8 460.0 215 3.00 5.424 17.82  0  0    3    4
#> Chrysler Imperial    14.7   8 440.0 230 3.23 5.345 17.42  0  0    3    4
#> Cadillac Fleetwood   10.4   8 472.0 205 2.93 5.250 17.98  0  0    3    4
```

**Explanation:** The same `.data[[ex_col]]` wrapper works in both `filter()` and `arrange()`. Every reference to the variable column needs the wrapper — mixing bare `ex_col` with `.data[[ex_col]]` would break the pipeline.

</details>

## Practice Exercises

### Exercise 1: Build a reusable grouped-mean helper

Write a function `summarise_by_col(df, col_string, metric_col)` that groups `df` by the column whose name is in `col_string` (a string) and returns the mean of `metric_col` (also a string) per group. Test it on `mtcars` with `col_string = "cyl"` and `metric_col = "mpg"`. Save the result to `my_result`.

```r
# Exercise 1: string-based grouping helper
# Hint: use .data[[col_string]] inside group_by and .data[[metric_col]] inside mean()

summarise_by_col <- function(df, col_string, metric_col) {
  # your code here
}

my_result <- summarise_by_col(mtcars, "cyl", "mpg")
print(my_result)
#> Expected: tibble with 3 rows and columns cyl, mean_metric
```

<details>
<summary>Click to reveal solution</summary>

```r
summarise_by_col <- function(df, col_string, metric_col) {
  df |>
    group_by(.data[[col_string]]) |>
    summarise(mean_metric = mean(.data[[metric_col]]), .groups = "drop")
}

my_result <- summarise_by_col(mtcars, "cyl", "mpg")
print(my_result)
#> # A tibble: 3 × 2
#>     cyl mean_metric
#>   <dbl>       <dbl>
#> 1     4        26.7
#> 2     6        19.7
#> 3     8        15.1
```

**Explanation:** `.data[[col_string]]` handles the grouping column and `.data[[metric_col]]` handles the column fed to `mean()`. The same pronoun works in both positions because dplyr evaluates it consistently across verbs.

</details>

### Exercise 2: Accept bare names OR strings

Write `flex_group_summary(df, group_col)` that works whether the caller passes a bare column name (`cyl`) or a string (`"cyl"`). Return a tibble with the group column and a `mean_mpg` column. Hint: try the bare-name path first with `{{ }}`; if that fails, catch the error and fall back to `.data[[ ]]` using `rlang::as_string(rlang::ensym(group_col))` to recover the name.

```r
# Exercise 2: accept both bare names and strings
# Hint: tryCatch({ ... use {{ group_col }} ... },
#                error = function(e) { ... use .data[[as_string(ensym(group_col))]] ... })

flex_group_summary <- function(df, group_col) {
  # your code here
}

flex_group_summary(mtcars, cyl)        # bare
flex_group_summary(mtcars, "cyl")      # string
#> Expected: both return the same 3-row tibble
```

<details>
<summary>Click to reveal solution</summary>

```r
flex_group_summary <- function(df, group_col) {
  # If group_col is a string, use .data[[ ]]; otherwise use the embrace operator.
  if (is.character(rlang::enexpr(group_col))) {
    col_name <- group_col
    df |>
      group_by(.data[[col_name]]) |>
      summarise(mean_mpg = mean(mpg), .groups = "drop")
  } else {
    df |>
      group_by({{ group_col }}) |>
      summarise(mean_mpg = mean(mpg), .groups = "drop")
  }
}

flex_group_summary(mtcars, cyl)
#> # A tibble: 3 × 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4     26.7
#> 2     6     19.7
#> 3     8     15.1

flex_group_summary(mtcars, "cyl")
#> # A tibble: 3 × 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4     26.7
#> 2     6     19.7
#> 3     8     15.1
```

**Explanation:** `rlang::enexpr(group_col)` captures the caller's expression without evaluating it. If the captured expression is a character literal, we know the caller passed a string and use `.data[[ ]]`. Otherwise we assume a bare name and use `{{ }}`. Both paths produce identical output for real column references.

</details>

## Complete Example

Putting everything together: a config-driven summary function that reads a vector of grouping columns and a single metric column — all as strings — and returns the grouped mean. This is the shape real pipelines take when column choices come from a YAML config, a Shiny input, or a loop over many metrics.

```r
config_cols <- c("cyl", "am")
metric_col <- "mpg"

final_summary <- mtcars |>
  group_by(across(all_of(config_cols))) |>
  summarise(
    n = n(),
    mean_metric = mean(.data[[metric_col]]),
    sd_metric = sd(.data[[metric_col]]),
    .groups = "drop"
  )

print(final_summary)
#> # A tibble: 6 × 5
#>     cyl    am     n mean_metric sd_metric
#>   <dbl> <dbl> <int>       <dbl>     <dbl>
#> 1     4     0     3        22.9     1.45
#> 2     4     1     8        28.1     4.48
#> 3     6     0     4        19.1     1.63
#> 4     6     1     3        20.6     0.751
#> 5     8     0    12        15.0     2.77
#> 6     8     1     2        15.4     0.566
```

Two idioms do the work. `across(all_of(config_cols))` expands the string vector into real grouping columns, and `.data[[metric_col]]` lets the summary expressions reach for the metric column by string. Swap `config_cols` for any other vector of column names and the pipeline keeps working — that's the payoff of learning these two patterns.

## Summary

| Input | Pattern | Example |
|---|---|---|
| Column name as a string variable | `.data[[col]]` | `group_by(.data[[my_col]])` |
| Column name passed bare to a function | `{{ col }}` | `group_by({{ group_col }})` |
| Vector of string column names | `across(all_of(cols))` | `group_by(across(all_of(group_cols)))` |
| Same pattern in other verbs | Works in `filter`, `arrange`, `mutate`, `summarise`, `select`, `pull` | `filter(.data[[col]] > 0)` |
| Output column name from a string | `"{var}" := value` | `mutate("mean_{col}" := mean(.data[[col]]))` |

Any dplyr error that mentions "must return a single string," "Column not found," or "must be a length-one character vector" when you passed a column-name variable is the same problem with a different shirt on — and the patterns above are the fix.

## References

1. dplyr — *Programming with dplyr* vignette. [Link](https://dplyr.tidyverse.org/articles/programming.html)
2. rlang — `.data` pronoun reference. [Link](https://rlang.r-lib.org/reference/dot-data.html)
3. tidyselect — `all_of()` and `any_of()` reference. [Link](https://tidyselect.r-lib.org/reference/all_of.html)
4. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 19: Quasiquotation. [Link](https://adv-r.hadley.nz/quasiquotation.html)
5. tidyverse blog — "dplyr 0.7.0" (introduction of tidy evaluation). [Link](https://www.tidyverse.org/blog/2017/06/dplyr-0-7-0/)

## Continue Learning

1. **[50 R Errors Decoded: Plain-English Explanations and Exact Fixes](R-Common-Errors.html)** — the parent index of every common R error, with one-line diagnoses and links to focused fixes like this one.
2. **[dplyr Basics: group_by and summarise](dplyr-group-by-summarise.html)** — the everyday, non-programmatic use of grouping before you need the `.data[[]]` pattern.
3. **[Writing Functions in R](R-Functions.html)** — how argument passing, environments, and lazy evaluation shape R function design, including the ideas that make `{{ }}` possible.
