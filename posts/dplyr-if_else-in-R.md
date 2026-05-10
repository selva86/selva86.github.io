---
title: "dplyr if_else() in R: Type-Strict Vectorized Conditional"
slug: "dplyr-if_else-in-R"
description: "Use dplyr if_else() for a type-strict vectorized conditional in R. Covers if_else vs base ifelse, missing arg, NA handling, type preservation, 5 examples."
keywords: "dplyr if_else, R if_else, if_else vs ifelse, dplyr conditional vector, R type-strict conditional, if_else missing argument, if_else NA"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "if_else()|dplyr if_else|type-strict conditional|if_else vs ifelse|missing argument"
auto_link_case_sensitive: true
target_keyword: "dplyr if_else"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr if_else() in R: Type-Strict Vectorized Conditional

<p class="lead">The <code>if_else()</code> function in dplyr is a stricter, type-safer version of base R's <code>ifelse()</code>. It preserves Date / factor / POSIXct classes, errors on type mismatches, and accepts a separate <code>missing</code> argument for NA handling.</p>

[QUICK ANSWER]
if_else(x > 0, "pos", "neg")             # type-strict
if_else(x > 0, x, -x)                    # absolute value, preserves type
if_else(x > 0, x, NA_integer_)           # NA_<type>_ for integer NA
if_else(x > 0, "p", "n", missing = "?")  # 3rd value for NAs
if_else(date_x > today(), "future", "past")  # preserves Date class
ifelse(x > 0, "p", "n")                   # base R: lenient, may strip class

[DECISION TREE: if_else vs ifelse vs case_when?]
- 2 outcomes, type-strict: dplyr::if_else()
- 2 outcomes, quick interactive: base ifelse()
- 3+ outcomes: dplyr::case_when()
- preserve Date / POSIXct / factor: ALWAYS use dplyr::if_else()
- explicit NA branch: if_else(..., missing = ...)
- single scalar condition: base if/else

## What if_else() does in one sentence

**`if_else(condition, true, false, missing)` returns `true` where condition is TRUE, `false` where FALSE, and `missing` (default NA) where condition is NA.** All three branches must be the SAME TYPE; mismatch errors instead of silently coercing.

This strictness is the main difference from base `ifelse()`. It catches type bugs early and preserves Date / factor classes.

## Syntax

**`if_else(condition, true, false, missing = NA, ptype = NULL, size = NULL)`. condition, true, false must be vectors of the same length (or scalars).**

```r title="Strict 2-way branch"
library(dplyr)

x <- c(-2, 0, 3, NA)

if_else(x > 0, "positive", "non-positive")
#> [1] "non-positive" "non-positive" "positive"     NA
```

[TIP]
**Always reach for `dplyr::if_else()` when working with Date / POSIXct / factor / Date columns.** Base `ifelse()` strips class attributes, returning a numeric where you expected a Date.

## Five common patterns

### 1. Two-way recoding

```r title="Binary label"
y <- c(0, 1, 0, 1, 1)
if_else(y == 1, "yes", "no")
#> [1] "no"  "yes" "no"  "yes" "yes"
```

### 2. Replace negatives with zero

```r title="Floor at 0, preserving type"
x <- c(-2, 0, 3, -5)
if_else(x < 0, 0L, x)
#> [1]  0  0  3  0
```

The result is integer because both branches are integer. With base ifelse it would be double.

### 3. Explicit NA branch with missing

```r title="3rd value for NAs"
x <- c(1, NA, 3)
if_else(x > 1, "high", "low", missing = "unknown")
#> [1] "low"     "unknown" "high"
```

`missing` defaults to NA; specify it for an explicit third branch.

### 4. Preserve Date class

```r title="if_else keeps Date; ifelse strips it"
d <- as.Date(c("2024-01-15", "2024-03-20", "2024-07-04"))
class(if_else(d > as.Date("2024-04-01"), d, as.Date(NA)))
#> [1] "Date"

class(ifelse(d > as.Date("2024-04-01"), d, as.Date(NA)))
#> [1] "numeric"   <-- bug from base R
```

### 5. Combine with mutate in a pipeline

```r title="Add a derived column"
df <- data.frame(score = c(45, 78, 92, 55, 88))

df |>
  mutate(status = if_else(score >= 70, "pass", "fail"))
#>   score status
#> 1    45   fail
#> 2    78   pass
#> 3    92   pass
```

[KEY INSIGHT]
**`if_else()` errors on type mismatch; base `ifelse()` silently coerces.** `if_else(x, 1L, "two")` errors. `ifelse(x, 1L, "two")` returns a character vector. The strictness is a feature: it catches type bugs at the call site instead of letting them propagate.

## if_else() vs ifelse() vs case_when() vs switch()

**Four conditional functions in R, with different strictness and scope.**

| Function | Vectorized | Type-strict | NA arg | Best for |
|---|---|---|---|---|
| `dplyr::if_else()` | Yes | Yes | Yes (`missing`) | Production pipelines |
| `base::ifelse()` | Yes | No (coerces) | No | Quick interactive |
| `dplyr::case_when()` | Yes | Yes | Implicit (TRUE branch) | 3+ outcomes |
| `base::switch()` | No (scalar) | Yes (per branch) | No | String dispatch |

When to use which:

- `if_else` for 2-way branches in production code.
- `ifelse` for quick scratch work where types don't matter.
- `case_when` for 3 or more branches.
- `switch` rarely; only for named-string scalar dispatch.

## A practical workflow

**The "type-preserving recode" pattern is the canonical if_else use case.**

```r title="Multi-step type-preserving recoding"
df |>
  mutate(
    flag       = if_else(score >= 70, "pass", "fail"),
    bonus      = if_else(score >= 90, score * 0.1, 0),
    next_step  = if_else(is.na(score), "review", "graded", missing = "review")
  )
```

Each line is type-strict: types must match within branches. Date / factor / POSIXct columns survive intact.

## Common pitfalls

**Pitfall 1: type mismatch errors.** `if_else(x > 0, 1L, NA)` errors because `1L` is integer but `NA` is logical. Use `NA_integer_` to force integer NA. Common typed NAs: `NA_integer_`, `NA_real_`, `NA_character_`.

**Pitfall 2: condition must be logical.** `if_else(x, ...)` errors if `x` isn't logical. Use `if_else(x > 0, ...)` or `if_else(as.logical(x), ...)`.

[WARNING]
**`if_else()` requires `true` and `false` to have the SAME TYPE.** `if_else(x, "a", 1)` errors. This catches bugs but means more typing (e.g., `NA_integer_` instead of `NA`). Worth it for production code.

## Why type strictness matters

**Silent type coercion is the #1 source of "why does my Date column look like a number?" bugs.** Base `ifelse()` strips class attributes from the FALSE branch when types differ, turning Date into numeric, factor into integer, POSIXct into double. The fix is not "remember to call `as.Date()` after every ifelse"; it is to use `if_else()`, which errors on type mismatch. The minor inconvenience of typed NAs (`NA_integer_`, `NA_Date_`) is a small price for correctness. In a production pipeline, prefer `if_else()` everywhere; reserve base `ifelse()` for one-off interactive scripts where types are obvious.

## Try it yourself

**Try it:** Create a derived column on `mtcars` with "efficient" if mpg >= 20, "thirsty" otherwise. Use `if_else()`. Save to `ex_label`.

```r title="Your turn: efficiency label"
ex_label <- mtcars |>
  # your code here

head(ex_label$category)
#> Expected: c("efficient" or "thirsty" per row)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_label <- mtcars |>
  mutate(category = if_else(mpg >= 20, "efficient", "thirsty"))

head(ex_label[, c("mpg", "category")])
#>                    mpg  category
#> Mazda RX4         21.0 efficient
#> Mazda RX4 Wag     21.0 efficient
#> Datsun 710        22.8 efficient
#> Hornet 4 Drive    21.4 efficient
#> Hornet Sportabout 18.7   thirsty
#> Valiant           18.1   thirsty
```

**Explanation:** `if_else(mpg >= 20, "efficient", "thirsty")` is type-strict (both branches character) and vectorized.

</details>

## Related conditional functions

After mastering if_else, look at:

- `case_when()`: 3+ branches
- `case_match()`: switch-style value matching
- `coalesce()`: first non-NA across vectors
- `na_if()`: convert specific value to NA
- `dplyr::recode()`: 1-to-1 value mapping
- `cut()`: bin numeric to intervals

For 3+ outcomes, `case_when` is dramatically more readable than nested if_else.

## FAQ

**What is the difference between if_else and ifelse in R?**

`dplyr::if_else()` is type-strict (errors on mismatched branch types) and preserves classes (Date, factor, POSIXct). `base::ifelse()` is permissive (silently coerces) and strips classes.

**Why does if_else error when ifelse worked?**

Because if_else requires both branches to be the SAME TYPE. The error is intentional: it catches type bugs early.

**How do I use NA in if_else?**

Use a typed NA matching the other branch: `NA_integer_`, `NA_real_`, `NA_character_`, `NA_Date_`. `if_else(x > 0, x, NA_real_)` works; `if_else(x > 0, x, NA)` may not.

**What is the missing argument in if_else?**

`missing` is the value used when the condition is NA. Default is NA (matching the other branches' type). Set it explicitly for a 3-way branch including NAs.

**Should I use if_else or case_when?**

`if_else` for exactly 2 outcomes; `case_when` for 3 or more. case_when's vertical layout is much more readable than nested if_else.
