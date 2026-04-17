---
title: "R's Four Special Values: NA, NULL, NaN, Inf, What Each One Actually Means"
slug: "R-Special-Values"
description: "NA, NULL, NaN, and Inf mean different things in R. Learn how to tell them apart, test for each safely, and clean them without crashing your code."
keywords: "R special values, NA in R, NULL in R, NaN in R, Inf in R, is.na R, is.null R, is.nan R, handle missing values R"
auto_link_terms: "NA in R|NULL in R|NaN in R|Inf in R|special values in R|is.na()|is.null()|is.nan()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "1.1.11"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Special Values"
sidebar_order: 11
difficulty: "Beginner"
---

# R's Four Special Values: NA, NULL, NaN, Inf, What Each One Actually Means

<p class="lead">R has four special values that look similar but behave very differently. **NA** means "missing data", **NULL** means "nothing at all", **NaN** means "invalid math" (like `0/0`), and **Inf** means "too big to represent" (like `1/0`). Each needs its own test function and its own handling strategy.</p>

## What does each special value actually mean?

Every R user hits these four eventually, usually the hard way, a `mean()` that silently returns `NA`, a `length()` of 0 when they expected 1, or a model that explodes on `Inf`. The fix starts with understanding what each value represents.

```r title="Four special values at a glance"
x <- NA          # Missing data — we don't know the value
y <- NULL        # Nothing — the object has zero length
z <- 0 / 0       # NaN — Not a Number, math that has no answer
w <- 1 / 0       # Inf — positive infinity, answer too big

c(x, y, z, w)
#> [1]  NA NaN Inf
```

Notice `y` (NULL) vanished from the combined vector, `c()` just drops it. That's your first clue that NULL behaves differently from the others: it's not a value at all, it's the absence of one.

![Four R special values and their meanings, NA missing, NULL nothing, NaN invalid math, Inf too big](screenshots/R-Special-Values-meaning.webp)

*Figure 1: Each special value answers a different question about a result. Use the right test function for each.*

[KEY INSIGHT]
NA is a value. NULL is not. That one sentence explains most of the confusion: `NA` takes up a slot in a vector, `NULL` doesn't.

```r title="NA counted but NULL skipped"
length(c(1, NA, 3))
length(c(1, NULL, 3))
#> [1] 3
#> [1] 2
```

## How do you test for NA vs NULL vs NaN vs Inf safely?

Each special value has its own test, and using the wrong one silently gives you the wrong answer. The four tests you need are `is.na()`, `is.null()`, `is.nan()`, and `is.infinite()`. Each returns `TRUE` only for its matching value.

```r title="Four safe tests for special values"
x <- c(1, NA, 0/0, 1/0, -1/0, 5)

is.na(x)         # TRUE for NA — but also for NaN!
is.nan(x)        # TRUE only for NaN
is.infinite(x)   # TRUE for Inf and -Inf
is.finite(x)     # TRUE only for regular finite numbers
#> [1] FALSE  TRUE  TRUE FALSE FALSE FALSE
#> [1] FALSE FALSE  TRUE FALSE FALSE FALSE
#> [1] FALSE FALSE FALSE  TRUE  TRUE FALSE
#> [1]  TRUE FALSE FALSE FALSE FALSE  TRUE
```

Two gotchas in those four lines. First: `is.na()` returns `TRUE` for both `NA` *and* `NaN`. That's by design, R treats `NaN` as a special kind of `NA`. If you only care about missing data, `is.na()` is fine. If you need to distinguish, use `is.nan()`. Second: `is.infinite()` matches both `Inf` and `-Inf`.

[WARNING]
Never compare with `==`, these values break equality. `NA == NA` returns `NA`, not `TRUE`. `NaN == NaN` returns `NA` too. Always use `is.na()`, `is.nan()`, etc.

```r title="NA and NaN break equality"
NA == NA
NaN == NaN
NA == 5
#> [1] NA
#> [1] NA
#> [1] NA
```

NULL is different, it's not a value in a vector, it's an object of length 0. Test it with `is.null()`:

```r title="is null only flags NULL itself"
is.null(NULL)
is.null(NA)
is.null(list())
is.null(integer(0))
#> [1] TRUE
#> [1] FALSE
#> [1] FALSE
#> [1] FALSE
```

Only `NULL` itself is NULL, an empty list or empty vector is *not* NULL, they're just empty.

**Try it:** Create `ex_vals <- c(1, NA, NaN, Inf, -Inf, 2)` and write one line using `is.finite()` to keep only the "real" numbers.

```r title="Exercise: keep only finite values"
ex_vals <- c(1, NA, NaN, Inf, -Inf, 2)
# your one-liner here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Keep only finite values solution"
ex_vals <- c(1, NA, NaN, Inf, -Inf, 2)
ex_vals[is.finite(ex_vals)]
#> [1] 1 2
```

`is.finite()` is the Swiss-army test that returns `FALSE` for `NA`, `NaN`, `Inf`, and `-Inf` all at once, exactly the four values you'd want to exclude when you ask "give me just the real, usable numbers." Chaining three separate tests (`!is.na(x) & !is.nan(x) & !is.infinite(x)`) works but is noisier and slower.
</details>

## Why does NA poison calculations, and how do you stop it?

Any arithmetic touching `NA` returns `NA`. This is deliberate: R refuses to guess what a missing value "should" be. So `sum()`, `mean()`, `sd()`, `max()` on a vector with even one `NA` return `NA`, until you tell them to skip it with `na.rm = TRUE`.

![NA propagation through sum and mean, with and without na.rm](screenshots/R-Special-Values-propagation.webp)

*Figure 2: Without na.rm, one NA poisons the whole result. With na.rm = TRUE, it's dropped before computing.*

```r title="Arithmetic propagates NA without na rm"
x <- c(4, 7, NA, 12, 15)

sum(x)
mean(x)
sum(x, na.rm = TRUE)
mean(x, na.rm = TRUE)
#> [1] NA
#> [1] NA
#> [1] 38
#> [1] 9.5
```

This isn't a bug, it's R protecting you from silently wrong answers. If you `mean()` a column that has missing values, the *honest* answer is "I can't compute this without telling you what to do about the NAs." Always pass `na.rm = TRUE` consciously, not reflexively.

[TIP]
Use `anyNA(x)` instead of `any(is.na(x))`, it's faster on large vectors and bails out at the first NA it finds.

```r title="Detect any NA with anyNA"
anyNA(c(1, 2, 3, NA, 5))
anyNA(c(1, 2, 3, 4, 5))
#> [1] TRUE
#> [1] FALSE
```

Logical operations also propagate `NA`, but only when the answer genuinely depends on the unknown:

```r title="Logical NA with short circuit"
NA & FALSE        # FALSE wins — unknown AND false is still false
NA & TRUE         # NA — answer depends on the unknown
NA | TRUE         # TRUE wins — anything OR true is true
NA | FALSE        # NA — depends on the unknown
#> [1] FALSE
#> [1] NA
#> [1] TRUE
#> [1] NA
```

R is doing three-valued logic here, and it's smarter than most languages, if the answer is determined regardless of the missing value, R returns it without complaint.

## How does R's type-specific NA (NA_integer_, NA_character_) work?

`NA` has a type. By default it's *logical*, but R provides typed variants, `NA_integer_`, `NA_real_`, `NA_character_`, `NA_complex_`, for when you need missing values of a specific type. You'll hit this most often when initializing a result vector.

```r title="Plain NA is logical by default"
# Plain NA is logical — often not what you want
typeof(NA)

# Typed NAs preserve the target type
typeof(NA_integer_)
typeof(NA_real_)
typeof(NA_character_)
#> [1] "logical"
#> [1] "integer"
#> [1] "double"
#> [1] "character"
```

Most of the time R coerces for you, so plain `NA` works fine. But in pre-allocated result vectors or tidyverse code that checks types strictly, the right typed `NA` prevents surprises.

```r title="Pre allocate with typed NA real"
# Pre-allocate a numeric result vector with NAs
result <- rep(NA_real_, 5)
result[1] <- 3.14
result
#> [1] 3.14   NA   NA   NA   NA
```

If you'd used `rep(NA, 5)` you'd have a logical vector and assigning `3.14` into it would trigger a silent type coercion. Typed NAs are the cleanest defensive pattern.

**Try it:** Pre-allocate `ex_names` as a length-3 character vector of `NA_character_`, then assign `"Ada"` to position 1.

```r title="Exercise: pre allocate character NAs"
# Your code here — pre-allocate and assign
```

<details>
<summary>Click to reveal solution</summary>

```r title="Character NA pre allocation solution"
ex_names <- rep(NA_character_, 3)
ex_names[1] <- "Ada"
ex_names
#> [1] "Ada" NA    NA
typeof(ex_names)
#> [1] "character"
```

Using `NA_character_` keeps the vector's type as `"character"` from the start, so assigning `"Ada"` into position 1 is a pure type-preserving operation. If you'd started with `rep(NA, 3)` you'd have a `logical` vector and the assignment would silently coerce the whole thing to `character`, harmless in a one-liner but a source of surprising bugs in pre-allocation loops where the type is supposed to stay fixed.
</details>

## Where does NULL belong (and where it doesn't)?

`NULL` represents *absence*, not missingness. You use it to say "this argument wasn't provided", "this list slot is empty", or "remove this element." It has length 0 and no type.

```r title="NULL as optional argument sentinel"
# NULL as a "missing argument" sentinel
describe <- function(x, label = NULL) {
  if (is.null(label)) label <- "Vector"
  cat(label, "has", length(x), "values\n")
}

describe(1:5)
describe(1:5, label = "Scores")
#> Vector has 5 values
#> Scores has 5 values
```

That's the cleanest use of `NULL`, a default that means "figure it out for me." Checking `is.null(label)` tells you whether the caller passed anything.

`NULL` is also how you **remove** elements from a list:

```r title="Remove list element by NULL"
person <- list(name = "Ada", age = 36, city = "London")
person$age <- NULL
person
#> $name
#> [1] "Ada"
#> 
#> $city
#> [1] "London"
```

Assigning `NULL` to a list element deletes it entirely. Same trick with data frame columns: `df$old_col <- NULL` drops the column.

[WARNING]
Don't put `NULL` *inside* a regular vector expecting a "missing" marker, use `NA` for that. `c(1, NULL, 3)` gives you `c(1, 3)`, not `c(1, NA, 3)`.

## How do Inf and NaN appear in real computations?

`Inf` (infinity) and `NaN` (not-a-number) come from math operations that don't have finite answers. The classic sources: dividing by zero, taking `log(0)`, or computing `0/0`.

```r title="Inf NaN and log zero sources"
1 / 0          # Inf
-1 / 0         # -Inf
log(0)         # -Inf
log(-1)        # NaN with a warning
0 / 0          # NaN
Inf - Inf      # NaN
#> [1] Inf
#> [1] -Inf
#> [1] -Inf
#> Warning message:
#> In log(-1) : NaNs produced
#> [1] NaN
#> [1] NaN
```

Each one is telling you something different. `Inf` says "the answer is larger than a finite double can store." `NaN` says "this operation has no meaningful answer at all." R uses IEEE 754 floating point, so these are the standard results your CPU would produce in any language.

They show up in real code most often after a `log()` transform or a rate calculation:

```r title="Sales over visits yields Inf"
sales <- c(100, 0, 250, 50)
visits <- c(1000, 500, 0, 250)

rate <- sales / visits
rate
#> [1] 0.1 0.0 Inf 0.2
```

One zero denominator, one `Inf`, and now any downstream `mean()` or `sum()` is broken. You need to decide what `Inf` means in your context, a missing rate? A capped value? Then handle it explicitly.

```r title="Replace Inf with NA before mean"
# Replace Inf with NA so na.rm can handle it
rate[is.infinite(rate)] <- NA
mean(rate, na.rm = TRUE)
#> [1] 0.1
```

**Try it:** Given `ex_x <- c(1, 2, 0, 4, 0, 6)`, compute `1 / ex_x`, then replace any `Inf` with `NA_real_`.

```r title="Exercise: invert and replace Inf"
# Your code here — invert ex_x and replace Inf with NA_real_
```

<details>
<summary>Click to reveal solution</summary>

```r title="Invert and replace Inf solution"
ex_x <- c(1, 2, 0, 4, 0, 6)
ex_inv <- 1 / ex_x
ex_inv
#> [1] 1.0000000 0.5000000       Inf 0.2500000       Inf 0.1666667
ex_inv[is.infinite(ex_inv)] <- NA_real_
ex_inv
#> [1] 1.0000000 0.5000000        NA 0.2500000        NA 0.1666667
```

Dividing by zero produces `Inf` (positive, since both operands are positive), so positions 3 and 5 become `Inf`. `is.infinite()` catches both `Inf` and `-Inf` in one test, exactly what you want here. Assigning `NA_real_` (not plain `NA`) keeps the vector's type as `double`; plain `NA` is logical and would force an unnecessary coercion step.
</details>

## How do you clean special values before modeling?

Most statistical and machine-learning functions in R refuse to work with `NA`, `NaN`, or `Inf`. Your data prep checklist is: **detect, decide, replace or drop**. There's no single right answer, dropping rows, imputing the mean, or replacing with zero all have trade-offs.

```r title="Data frame with NA and Inf"
df <- data.frame(
  score = c(85, NA, 92, 78, 100),
  rate = c(0.2, 0.5, Inf, 0.3, NaN)
)

df
#>   score rate
#> 1    85  0.2
#> 2    NA  0.5
#> 3    92  Inf
#> 4    78  0.3
#> 5   100  NaN
```

**Strategy 1: Drop any row with problems.**

```r title="Drop rows with is finite"
is_clean <- is.finite(df$score) & is.finite(df$rate)
df_clean <- df[is_clean, ]
df_clean
#>   score rate
#> 1    85  0.2
#> 4    78  0.3
```

`is.finite()` is the Swiss-army test here, it returns `FALSE` for `NA`, `NaN`, `Inf`, and `-Inf` in one shot. Much cleaner than chaining three separate tests.

**Strategy 2: Replace with a sentinel.**

```r title="Replace with mean or median"
df$score[is.na(df$score)] <- mean(df$score, na.rm = TRUE)
df$rate[!is.finite(df$rate)] <- median(df$rate[is.finite(df$rate)])
df
#>   score  rate
#> 1 85.00  0.20
#> 2 88.75  0.50
#> 3 92.00  0.30
#> 4 78.00  0.30
#> 5 100.00 0.30
```

Imputing with mean/median preserves sample size at the cost of some variance. For the rate column we only computed the median over *finite* values, otherwise `NaN` and `Inf` would corrupt the replacement.

[KEY INSIGHT]
There is no "just clean the data" function that's right for every project. Whichever strategy you pick, **document it**. Future readers (including future-you) need to know whether a zero means "really zero" or "was NA, imputed to zero."

**Try it:** Given `ex_df` with a `score` column `c(1, NA, 3, Inf, 5)`, keep only rows where score is finite. Use `is.finite()`.

```r title="Exercise: keep finite score rows"
# Your code here — keep only rows where score is finite
```

<details>
<summary>Click to reveal solution</summary>

```r title="Finite score filter solution"
ex_df <- data.frame(score = c(1, NA, 3, Inf, 5))
ex_df_clean <- ex_df[is.finite(ex_df$score), ]
ex_df_clean
#>   score
#> 1     1
#> 3     3
#> 5     5
```

`is.finite(ex_df$score)` returns `c(TRUE, FALSE, TRUE, FALSE, TRUE)`, and using it to subset rows drops the `NA` at position 2 and the `Inf` at position 4 in one shot. The row numbers in the output (1, 3, 5) are preserved from the original data frame, a useful trace of which observations survived, though you can reset them with `rownames(ex_df_clean) <- NULL` if you need a clean sequence.
</details>

## Practice Exercises

### Exercise 1: Classify every value

Write `classify(x)` that takes a numeric vector and returns a character vector labelling each element as `"regular"`, `"NA"`, `"NaN"`, `"Inf"`, or `"-Inf"`. Use `is.na()`, `is.nan()`, and `is.infinite()` in the right order.

```r title="Exercise: classify each special value"
classify <- function(x) {
  # ...
}

classify(c(1, NA, 0/0, 1/0, -1/0, 42))
```

<details>
<summary>Show solution</summary>

```r title="Classify special values solution"
classify <- function(x) {
  out <- rep("regular", length(x))
  out[is.nan(x)] <- "NaN"
  out[is.na(x) & !is.nan(x)] <- "NA"
  out[is.infinite(x) & x > 0] <- "Inf"
  out[is.infinite(x) & x < 0] <- "-Inf"
  out
}

classify(c(1, NA, 0/0, 1/0, -1/0, 42))
#> [1] "regular" "NA"      "NaN"     "Inf"     "-Inf"    "regular"
```

Order matters: test `is.nan()` before `is.na()`, because `is.na()` is TRUE for NaN too.
</details>

### Exercise 2: Safe division

Write `safe_div(a, b, replace = NA_real_)` that divides two vectors element-wise. Wherever the result would be `Inf`, `-Inf`, or `NaN`, substitute `replace`.

```r title="Exercise: safe division with replacement"
safe_div <- function(a, b, replace = NA_real_) {
  # ...
}

safe_div(c(10, 20, 30), c(2, 0, 5))
```

<details>
<summary>Show solution</summary>

```r title="Safe division solution"
safe_div <- function(a, b, replace = NA_real_) {
  out <- a / b
  out[!is.finite(out)] <- replace
  out
}

safe_div(c(10, 20, 30), c(2, 0, 5))
#> [1]  5 NA  6

safe_div(c(10, 20, 30), c(2, 0, 5), replace = 0)
#> [1] 5 0 6
```
</details>

### Exercise 3: Missing-value report

Write `na_report(df)` that returns a data frame listing each column and its count of `NA`s (treat `NaN` and `Inf` as NA too, so use `is.finite()` on numeric columns).

```r title="Exercise: na report per column"
na_report <- function(df) {
  # ...
}

na_report(data.frame(
  a = c(1, NA, 3, Inf),
  b = c("x", NA, "y", "z"),
  c = c(0.1, 0.2, NaN, 0.4)
))
```

<details>
<summary>Show solution</summary>

```r title="na report per column solution"
na_report <- function(df) {
  missing_count <- sapply(df, function(col) {
    if (is.numeric(col)) sum(!is.finite(col))
    else sum(is.na(col))
  })
  data.frame(
    column = names(missing_count),
    missing = unname(missing_count),
    row.names = NULL
  )
}

na_report(data.frame(
  a = c(1, NA, 3, Inf),
  b = c("x", NA, "y", "z"),
  c = c(0.1, 0.2, NaN, 0.4)
))
#>   column missing
#> 1      a       2
#> 2      b       1
#> 3      c       1
```
</details>

## Complete Example: Cleaning a Messy Dataset

Here's the full workflow on a toy dataset with every kind of problem in it.

```r title="Messy frame with every problem"
set.seed(1)
raw <- data.frame(
  id = 1:8,
  revenue = c(100, 250, NA, 0, 400, 600, NaN, 800),
  cost = c(50, 120, 180, 0, 200, NA, 300, 400)
)

# Step 1: compute a rate (can produce Inf from cost=0)
raw$margin <- (raw$revenue - raw$cost) / raw$cost
raw
#>   id revenue cost    margin
#> 1  1     100   50 1.0000000
#> 2  2     250  120 1.0833333
#> 3  3      NA  180        NA
#> 4  4       0    0       NaN
#> 5  5     400  200 1.0000000
#> 6  6     600   NA        NA
#> 7  7     NaN  300        NA
#> 8  8     800  400 1.0000000
```

Three kinds of problems in one column: `NA` from source data, `NaN` from `0/0`, and potentially `Inf` if cost were non-zero with a zero denominator elsewhere. `is.finite()` handles them all in one call:

```r title="End-to-end messy dataset cleaning"
# Step 2: flag problem rows
raw$has_issue <- !is.finite(raw$margin)

# Step 3: keep only clean rows for analysis
clean <- raw[!raw$has_issue, ]
clean[, c("id", "revenue", "cost", "margin")]
#>   id revenue cost   margin
#> 1  1     100   50 1.000000
#> 2  2     250  120 1.083333
#> 5  5     400  200 1.000000
#> 8  8     800  400 1.000000

mean(clean$margin)
#> [1] 1.020833
```

We reduced 8 rows to 4, but the mean margin is now trustworthy. The `has_issue` flag is left in `raw` so you can report how many rows were dropped, a habit worth keeping.

## Summary

![Decision flowchart: pick the right is.* test based on what you're checking](screenshots/R-Special-Values-decision.webp)

*Figure 3: Pick the right test by asking what you're checking. If you're not sure, start with `is.finite()`, it handles NA, NaN, and Inf in one call.*

| Value | Means | Test with | Example source |
|---|---|---|---|
| `NA` | Missing data (unknown) | `is.na()` | Missing from input, `na.rm = FALSE` on a gap |
| `NULL` | Absence, length 0 | `is.null()` | Unset argument, removed list element |
| `NaN` | Invalid math | `is.nan()` | `0/0`, `log(-1)`, `Inf - Inf` |
| `Inf` / `-Inf` | Too big to represent | `is.infinite()` | `1/0`, `log(0)`, overflow |
| Any of the above | "Not a regular number" | `!is.finite()` | One-shot check for numerics |

Three rules worth memorizing:

1. **Use `is.finite()`** when you want "a regular, usable number", it filters NA, NaN, and Inf in one call.
2. **Never compare special values with `==`**, comparisons involving NA or NaN return NA, not TRUE/FALSE.
3. **`na.rm = TRUE` is a deliberate choice**, not a default. Pass it when you've decided how to handle missingness, not because it made the error go away.

## References

1. R Language Definition, Special values. <https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Special-values>
2. Wickham, H. *Advanced R*, 2nd ed., Chapter 3 (Vectors), NA and NaN. <https://adv-r.hadley.nz/vectors-chap.html>
3. R Documentation: `?NA`, `?NULL`, `?is.finite`, `?is.nan`. Run in any R session.
4. IEEE 754 floating-point standard, source of Inf and NaN semantics. <https://en.wikipedia.org/wiki/IEEE_754>
5. Wickham, H. & Grolemund, G. *R for Data Science*, 2nd ed., Missing values chapter. <https://r4ds.hadley.nz/missing-values.html>

## Continue Learning

- [R Vectors](R-Vectors.html), where NA and NaN live most of the time.
- [Control Flow in R](Control-Flow-in-R.html), `if (is.na(x))` patterns for branching on missing data.
- [Write Better R Functions](R-Functions.html), use `stopifnot()` to validate that inputs aren't full of NAs before computing.
