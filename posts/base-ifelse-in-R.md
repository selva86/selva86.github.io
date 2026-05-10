---
title: "ifelse() in R: Vectorized Conditional"
slug: "base-ifelse-in-R"
description: "Use base R ifelse() to apply a vectorized conditional across a vector. Covers syntax, NA handling, dplyr if_else, case_when alternatives, and 5 examples."
keywords: "ifelse in R, R ifelse vector, ifelse vs if_else, R conditional vector, dplyr if_else, base R ifelse, ifelse multiple conditions"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Vectors.html"
auto_link_terms: "ifelse()|R ifelse|vectorized conditional|if_else()|case_when()"
auto_link_case_sensitive: true
target_keyword: "ifelse in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ifelse() in R: Vectorized Conditional

<p class="lead">The <code>ifelse()</code> function in base R is a vectorized conditional: for each element of a logical vector, it returns the matching element from <code>yes</code> or <code>no</code>. It is the workhorse for column-wise conditional logic.</p>

[QUICK ANSWER]
ifelse(x > 0, "pos", "neg")              # element-wise
ifelse(is.na(x), 0, x)                   # replace NA
ifelse(x > 0, x, -x)                     # absolute value via cond
dplyr::if_else(x > 0, "pos", "neg")      # type-strict variant
dplyr::case_when(x > 5 ~ "high", x > 0 ~ "mid", TRUE ~ "low")
ifelse(cond, yes, no)                     # syntax
ifelse(x > 0, x, NA_real_)               # preserve numeric type

[DECISION TREE: Is ifelse() the right tool?]
- one condition, vectorized: ifelse() (or dplyr::if_else)
- type-strict / strict NA: dplyr::if_else()
- multiple conditions: dplyr::case_when()
- single scalar condition (length 1): if/else
- replace NAs only: tidyr::replace_na() / coalesce()
- bin numeric to categories: cut() or case_when
- recode factor: dplyr::recode() or forcats::fct_recode()

## What ifelse() does in one sentence

**`ifelse(test, yes, no)` walks element-wise through `test`; for each TRUE it returns the matching element from `yes`, for each FALSE the matching element from `no`.** All three vectors must be (or recycle to) the same length.

`ifelse` is THE base R way to do conditional column logic in a single line. Reach for `dplyr::if_else()` when you want stricter type and NA behavior.

## Syntax

**`ifelse(test, yes, no)`. test is a logical vector; yes/no are values OR vectors of the same length.**

```r title="Basic vectorized branch"
x <- c(-2, -1, 0, 1, 2)

ifelse(x > 0, "positive", "non-positive")
#> [1] "non-positive" "non-positive" "non-positive" "positive"     "positive"
```

[TIP]
**Use `ifelse` for ELEMENT-WISE conditionals; use `if/else` for SCALAR conditionals.** `if (length(x) > 0) ... else ...` is the right tool when the condition is a single TRUE/FALSE. `ifelse` errors if the test is not a vector of TRUE/FALSE.

## Five common patterns

### 1. Replace negative values with zero

```r title="Floor at 0"
x <- c(-2, -1, 0, 1, 2)
ifelse(x < 0, 0, x)
#> [1] 0 0 0 1 2
```

This is `pmax(x, 0)` more directly, but `ifelse` shows the pattern clearly.

### 2. Recode a 2-level factor

```r title="Convert binary to label"
y <- c(0, 1, 0, 1, 1)
ifelse(y == 1, "yes", "no")
#> [1] "no"  "yes" "no"  "yes" "yes"
```

For binary recoding, ifelse is the cleanest tool.

### 3. Replace NAs

```r title="NA -> 0"
v <- c(1, NA, 3, NA, 5)
ifelse(is.na(v), 0, v)
#> [1] 1 0 3 0 5
```

Same idea as `tidyr::replace_na(v, 0)` for tidyverse code.

### 4. Build a derived column in a data frame

```r title="Create a status column"
df <- data.frame(score = c(45, 78, 92, 55, 88))
df$status <- ifelse(df$score >= 70, "pass", "fail")
df
#>   score status
#> 1    45   fail
#> 2    78   pass
#> 3    92   pass
#> 4    55   fail
#> 5    88   pass
```

### 5. Nested ifelse for 3+ branches (avoid)

```r title="Works but ugly; use case_when instead"
x <- c(-5, 2, 15)
ifelse(x < 0, "neg", ifelse(x < 10, "low", "high"))
#> [1] "neg"  "low"  "high"
```

For 3+ conditions, switch to `dplyr::case_when()` for readability.

[KEY INSIGHT]
**Beyond 2 branches, `case_when()` is FAR more readable than nested `ifelse()`.** Nested ifelse becomes hard to scan past depth 2. case_when's `condition ~ value` syntax linearizes the logic and allows arbitrary number of branches.

## ifelse() vs if_else() vs case_when() vs switch()

**Four "branch" mechanisms in R, with different scope and trade-offs.**

| Function | Type | Vectorized | NA handling | Best for |
|---|---|---|---|---|
| `if/else` | scalar | No | Errors on NA | Single decision in code |
| `ifelse()` | vector | Yes | Type-coerces | Quick element-wise |
| `dplyr::if_else()` | vector | Yes | Strict; explicit `missing` arg | Production pipelines |
| `dplyr::case_when()` | vector | Yes | Strict | 3+ conditions |
| `switch()` | scalar | No | NA-safe-ish | String dispatch |

When to use which:

- `if/else` for code-flow decisions.
- `ifelse` for quick column logic with 2 outcomes.
- `if_else` when you need strict types or explicit NA handling.
- `case_when` for 3 or more branches.
- `switch` for named-string dispatch (rare in data tasks).

## Common pitfalls

**Pitfall 1: type coercion surprises.** `ifelse(TRUE, 1L, 1.5)` returns 1 (integer). `ifelse(FALSE, 1L, 1.5)` returns 1.5 (double). Result type depends on which branch is taken. `if_else` errors on type mismatches, which is safer.

**Pitfall 2: factor handling.** `ifelse(cond, factor1, factor2)` strips factor attributes and returns integer codes. Convert to character first or use `if_else()`.

[WARNING]
**`ifelse(cond, Sys.Date(), Sys.Date())` returns a NUMBER, not a Date!** ifelse strips class attributes from Date / POSIXct. Use `dplyr::if_else()` which preserves class, or wrap with `as.Date()` after.

## When to choose ifelse vs case_when

**A simple rule of thumb: 2 outcomes use ifelse; 3+ outcomes use case_when.** Beyond two branches, nested ifelse becomes harder to scan and easier to misindent. case_when's vertical layout reads like a decision table, which mirrors how analysts think about category logic. For type-strict pipelines, prefer dplyr::if_else over base ifelse because it preserves Date and factor classes and refuses silent type coercion.

## Try it yourself

**Try it:** Bin scores into "high" (>= 80), "mid" (60 to 79), "low" (< 60) using `case_when`. Save to `ex_grade`.

```r title="Your turn: 3-way bin via case_when"
library(dplyr)
scores <- c(45, 72, 88, 55, 95, 65)

ex_grade <- # your code here

ex_grade
#> Expected: c("low","mid","high","low","high","mid")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grade <- case_when(
  scores >= 80 ~ "high",
  scores >= 60 ~ "mid",
  TRUE         ~ "low"
)
ex_grade
#> [1] "low"  "mid"  "high" "low"  "high" "mid"
```

**Explanation:** `case_when` checks each condition top-to-bottom. The first match wins. The trailing `TRUE ~ "low"` is the catch-all.

</details>

## Related conditional functions

After mastering ifelse, look at:

- `dplyr::if_else()`: type-strict variant
- `dplyr::case_when()`: 3+ branches
- `tidyr::replace_na()`: targeted NA replacement
- `dplyr::coalesce()`: first-non-NA pick across vectors
- `dplyr::recode()`: 1-to-1 value mapping
- `cut()`: bin numeric into intervals

For categorical recoding, `forcats::fct_recode()` is the cleanest tidyverse tool.

## FAQ

**What is the difference between if and ifelse in R?**

`if` is a scalar control-flow statement: `if (length(x) > 0) ... else ...`. `ifelse` is a vectorized function that works element-wise on logical vectors. Use `if` for code logic, `ifelse` for vector operations.

**What is the difference between ifelse and dplyr if_else?**

`ifelse` (base) is permissive about types and may strip Date / factor classes. `dplyr::if_else()` is strict: the `yes`, `no`, and `missing` must all be the same type. Use `if_else` for safer pipelines, `ifelse` for quick interactive work.

**How do I write nested ifelse for multiple conditions?**

`ifelse(cond1, val1, ifelse(cond2, val2, val3))` works but quickly becomes unreadable. Use `dplyr::case_when()` instead for 3+ branches.

**How do I replace NAs with ifelse?**

`ifelse(is.na(x), 0, x)` replaces NAs with 0. Or use `tidyr::replace_na(x, 0)` / `dplyr::coalesce(x, 0)`.

**Why does ifelse change my Date column to a number?**

`ifelse` strips attributes (class, factor levels). For Dates, POSIXct, factors, use `dplyr::if_else()` which preserves class, or convert with `as.Date()` after.
