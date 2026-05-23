---
title: "Filter() in R: Keep List Elements That Match a Predicate"
slug: "base-Filter-in-R"
description: "Use base R Filter() to keep list or vector elements where a predicate returns TRUE. Covers Negate, Find, Position, subset, purrr::keep with 6 examples."
keywords: "Filter in R, base Filter, R Filter function, Filter predicate R, Filter vs subset, Filter vs purrr keep, R functional programming"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "Filter()|base Filter|R Filter function|Filter predicate|base::Filter()"
auto_link_case_sensitive: true
target_keyword: "Filter in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Filter() in R: Keep List Elements That Match a Predicate

<p class="lead">The <code>Filter()</code> function in base R keeps the elements of a list or vector for which a predicate function returns <code>TRUE</code>. It is the functional-programming way to subset by condition without writing a loop or building an index vector.</p>

[QUICK ANSWER]
Filter(is.numeric, list(1, "a", 2L, TRUE))         # keep numeric atoms
Filter(function(x) x > 0, c(-2, -1, 0, 1, 2))      # keep positives
Filter(Negate(is.null), list(1, NULL, 2, NULL))    # drop NULLs
Filter(function(df) nrow(df) > 10, list_of_dfs)    # keep big data frames
Filter(function(x) any(is.na(x)), df_columns)      # keep cols with NA
Filter(function(s) nchar(s) > 5, c("hi", "hello!", "ok"))  # length filter
Filter(is.function, mget(ls()))                    # keep functions in env

[DECISION TREE: Is Filter() the right tool?]
- keep list elements by predicate: Filter(f, list)
- drop list elements by predicate: Filter(Negate(f), list)
- first element matching predicate: Find(f, list)
- index of first match: Position(f, list)
- subset a numeric vector by condition: x[x > 0]
- subset data frame rows: subset() or dplyr::filter()
- tidyverse predicate filter on lists: purrr::keep()

## What Filter() does in one sentence

**`Filter(f, x)` returns the elements of `x` for which the predicate `f` returns `TRUE`, preserving order and the original container type.** It is R's predicate filter, the same operation as `filter` in Haskell or the list-comprehension `[e for e in x if f(e)]` in Python.

`Filter` belongs to base R's [functional programming](Functional-Programming-in-R.html) toolkit alongside `Map`, `Reduce`, `Find`, `Position`, and `Negate`. It is the only base function that accepts a user-supplied predicate and returns a subset of the input with the container type intact.

## Syntax

**`Filter(f, x)`. `f` is a single-argument function that returns `TRUE` or `FALSE`; `x` is a list, atomic vector, or expression vector.**

```r title="Keep positive numbers from a vector"
Filter(function(x) x > 0, c(-2, -1, 0, 1, 2))
#> [1] 1 2
```

The call applies `f` to each element of `x`, collects those returning `TRUE`, and rebuilds the result in the original container type. A list stays a list; a numeric vector stays a numeric vector.

[TIP]
**Use a named function for readability when the predicate is reusable.** `Filter(is.numeric, x)` reads better than `Filter(function(e) is.numeric(e), x)`. For one-off predicates, the anonymous function form is fine; for repeated logic, define the predicate once.

## Six common patterns

### 1. Keep elements of a specific type

```r title="Keep only numeric atoms from a mixed list"
mixed <- list(1, "a", 2L, TRUE, 3.5, NA)
Filter(is.numeric, mixed)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 2
#>
#> [[3]]
#> [1] 3.5
```

Any `is.*` predicate works: `is.numeric`, `is.character`, `is.list`, `is.function`. The output preserves list structure even when only one element matches.

### 2. Drop NULL or empty entries

```r title="Drop NULLs with Negate"
results <- list(a = 1, b = NULL, c = 2, d = NULL, e = 3)
Filter(Negate(is.null), results)
#> $a
#> [1] 1
#>
#> $c
#> [1] 2
#>
#> $e
#> [1] 3
```

`Negate(f)` returns a new function that flips `f`'s output. This is the idiomatic way to remove unwanted elements without writing `function(x) !is.null(x)`. Names are preserved.

### 3. Filter columns of a data frame

```r title="Keep numeric columns of mtcars"
numeric_cols <- Filter(is.numeric, mtcars)
names(numeric_cols)
#>  [1] "mpg"  "cyl"  "disp" "hp"   "drat" "wt"   "qsec" "vs"   "am"   "gear"
#> [11] "carb"
```

A data frame is a list of columns. `Filter(is.numeric, df)` returns a new data frame containing only the numeric columns. The same pattern with `function(x) any(is.na(x))` returns columns that contain at least one missing value.

### 4. Keep list entries by structural condition

```r title="Keep data frames with more than 10 rows"
samples <- list(
  small = data.frame(x = 1:5),
  big   = data.frame(x = 1:20),
  empty = data.frame(x = integer(0))
)

Filter(function(df) nrow(df) > 10, samples)
#> $big
#>     x
#> 1   1
#> 2   2
#> ... (20 rows total)
```

The predicate can be anything that returns a single `TRUE` or `FALSE`. Common patterns: `length(x) > 0`, `nrow(x) > N`, `inherits(x, "lm")` to keep model objects from a results list.

### 5. Filter strings by character length

```r title="Keep strings longer than 5 characters"
words <- c("hi", "hello!", "ok", "wonderful", "fine")
Filter(function(s) nchar(s) > 5, words)
#> [1] "hello!"    "wonderful"
```

For atomic vectors, the result stays atomic. `Filter` is essentially a wrapper for `x[vapply(x, f, logical(1))]`; the difference is that `Filter` reads as a single operation and works on lists where direct subscripting is awkward.

### 6. Filter functions out of an environment

```r title="Find all functions in the current environment"
square <- function(x) x^2
cube   <- function(x) x^3
favourite_number <- 7

env_objects <- mget(ls())
Filter(is.function, env_objects)
#> $cube
#> function(x) x^3
#>
#> $square
#> function(x) x^2
```

`mget(ls())` grabs every name in the environment as a list. `Filter(is.function, ...)` then narrows to just the functions. This is a quick way to introspect a workspace or package namespace.

[KEY INSIGHT]
**Filter preserves both the order and the container type of its input.** A named list stays a named list with the same key order; a numeric vector stays numeric. That contract matters when you chain `Filter` with `Map` or `Reduce`: the downstream functions can assume the structure is intact. Compare with `[`, which can silently drop names or simplify a list to a vector.

## Filter vs subset vs vectorized index vs purrr::keep

**Filter is for predicate-based subsetting of lists and atomic vectors; data-frame row filtering is a different problem.** The table below shows where Filter fits among the related base R and tidyverse tools.

| Tool | Best for | Returns |
|---|---|---|
| `Filter(f, x)` | Lists or atomic vectors, predicate by element | Same container, subset |
| `x[cond]` | Atomic vectors with a vectorized condition | Same atomic type |
| `subset(df, cond)` | Data frame rows, expression evaluated in `df` | Data frame |
| `dplyr::filter(df, cond)` | Data frame rows in tidyverse pipelines | Tibble or data frame |
| `purrr::keep(x, f)` | Tidyverse predicate filter on lists | Same container |
| `purrr::discard(x, f)` | Tidyverse opposite of `keep` | Same container |
| `Find(f, x)` | First matching element | The single element |

Decision rule:

- Use `Filter()` when `x` is a list and the predicate cannot be vectorized cleanly.
- Use `x[cond]` when `x` is an atomic vector and `cond` is a vectorized expression. It is faster and more idiomatic.
- Use `subset()` or `dplyr::filter()` for data frame rows, not `Filter()`. They evaluate the condition in the frame's column scope.
- Use `purrr::keep()` inside tidyverse pipelines for symmetry with `purrr::map()`; behavior is identical to `Filter`.

## Common pitfalls

**Pitfall 1: the predicate must return one logical, not a vector.** `Filter(function(x) x > 0, list(1:3, -1:1))` calls the predicate on each list element and expects a single `TRUE` or `FALSE` back. The expression `x > 0` returns a vector of length 3 here, which triggers a warning and uses only the first value. Wrap in `all()` or `any()`: `Filter(function(x) all(x > 0), ...)`.

**Pitfall 2: confusing Filter with dplyr::filter.** Loading dplyr masks no base function (the names differ in case: `Filter` vs `filter`), but the two do very different things. `Filter(f, x)` applies a predicate per list element. `dplyr::filter(df, cond)` evaluates an expression in the column scope of a data frame and keeps matching rows. They are not interchangeable.

**Pitfall 3: NA in the predicate output silently drops the element.** If the predicate returns `NA`, that element is excluded (treated as not-`TRUE`). Make the predicate NA-aware: `Filter(function(x) !is.na(x) && x > 0, ...)`. Otherwise missing values produce a quietly shrunken result.

[WARNING]
**Filter() copies the input.** For large lists or wide data frames, `Filter(is.numeric, big_df)` materializes the kept columns as a new object. This is fine for most workflows but matters in tight memory budgets. For atomic vectors, prefer `x[cond]` which can avoid the copy via vectorized subsetting.

## Try it yourself

**Try it:** Use `Filter` with `Negate` to drop columns of `airquality` that contain any `NA`. Save the result to `ex_no_na_cols`.

```r title="Your turn: drop NA columns"
# Try it: drop NA columns
ex_no_na_cols <- # your code here

names(ex_no_na_cols)
#> Expected: "Wind" "Temp" "Month" "Day"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_no_na_cols <- Filter(Negate(function(x) any(is.na(x))), airquality)
names(ex_no_na_cols)
#> [1] "Wind"  "Temp"  "Month" "Day"
```

**Explanation:** `function(x) any(is.na(x))` returns `TRUE` for a column that contains at least one `NA`. `Negate()` flips it so we keep columns with no `NA`. `Ozone` and `Solar.R` are dropped because both contain missing values.

</details>

## Related base R functional functions

After mastering `Filter`, look at:

- `Find()`: the first element matching a predicate (stops at first match, faster than `Filter()[[1]]`)
- `Position()`: the index of the first matching element
- `Negate()`: flips a predicate function, the inverse of `Filter` (drop instead of keep)
- `Map()`: apply a function across multiple lists in parallel
- `Reduce()`: fold a binary function across a list
- `purrr::keep()` and `purrr::discard()`: tidyverse equivalents with pipe-friendly signatures

For predicate-based data frame row filtering, `subset()` and `dplyr::filter()` are the right tools, not `Filter`. See the [base funprog reference](https://stat.ethz.ch/R-manual/R-devel/library/base/html/funprog.html) for the full base R functional-programming family.

## FAQ

**What is Filter() in R used for?**

`Filter()` keeps the elements of a list or atomic vector for which a predicate function returns `TRUE`. Common uses include keeping numeric atoms from a mixed list, dropping `NULL` entries from API results, selecting columns of a data frame by type, and narrowing a list of model objects to those meeting a quality threshold. It is base R's predicate-filter primitive.

**What is the difference between Filter and subset in R?**

`Filter(f, x)` applies a predicate to each element of a list or vector and keeps the matches. `subset(df, cond)` evaluates an expression in the column scope of a data frame and keeps matching rows. `Filter` is for lists; `subset` is for data-frame rows. Use `Filter(is.numeric, df)` to keep numeric COLUMNS but `subset(df, mpg > 20)` to keep matching ROWS.

**How is Filter different from dplyr::filter?**

The names share a stem but the functions are unrelated. Base `Filter(f, x)` is a predicate filter over list elements: `Filter(is.numeric, mtcars)` returns the numeric columns. `dplyr::filter(df, mpg > 20)` is a row-level expression filter for data frames. The two never compete because they take different argument shapes.

**Can Filter return an empty result?**

Yes. If no element matches the predicate, `Filter` returns an empty container of the same type: `list()` for a list input, `integer(0)` (or the appropriate empty atomic) for an atomic vector. The function never errors on no-match; downstream code should handle the empty case if it matters.

**How does Filter compare to purrr::keep?**

Behavior is identical: both keep elements where the predicate returns `TRUE`. `purrr::keep()` has a tidyverse-friendly signature (`keep(.x, .f)`) and accepts purrr-style anonymous functions like `\(x) x > 0` or `~ .x > 0`. `Filter()` is base R with no dependency. Use `purrr::keep` inside tidyverse pipelines, `Filter` everywhere else.
