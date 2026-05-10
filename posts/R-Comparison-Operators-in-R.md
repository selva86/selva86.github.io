---
title: "R Comparison Operators: ==, !=, <, >, <=, >= Guide"
slug: "R-Comparison-Operators-in-R"
description: "Learn R's comparison operators: ==, !=, <, >, <=, >=. Covers floating-point gotchas, identical(), NA handling, %in% membership, and 6 worked examples."
keywords: "R comparison operators, == in R, R relational operators, not equal in R, R floating point comparison, R %in% operator, identical R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Basic-Syntax-Beginners-Guide.html"
auto_link_terms: "comparison operators|relational operators|R comparison|equality in R|inequality"
auto_link_case_sensitive: false
target_keyword: "R comparison operators"
sibling_block_enabled: true
difficulty: "Beginner"
---

# R Comparison Operators: ==, !=, <, >, <=, >= Guide

<p class="lead">R has six comparison operators that return TRUE or FALSE: <code>==</code> (equal), <code>!=</code> (not equal), <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>. They are vectorized, so they work element-wise on whole vectors.</p>

[QUICK ANSWER]
x == y                       # equal (CAREFUL with floats)
x != y                       # not equal
x < y; x > y                 # less than, greater than
x <= y; x >= y               # less or equal, greater or equal
x %in% c(1, 2, 3)            # set membership
identical(x, y)              # exact equality (better than == for objects)
all.equal(x, y)              # near equality (use for floats)

[DECISION TREE: Which comparison operator?]
- exact equality (numeric vector): == (with caveats for floats)
- exact equality (any objects): identical(x, y)
- near equality for floats: all.equal(x, y) or abs(x - y) < tolerance
- inequality / range: <, >, <=, >=
- in a set of values: x %in% c(...)
- not in a set: !(x %in% c(...))
- pattern match (string): grepl, str_detect

## What R's comparison operators do in one sentence

**Each comparison operator returns a logical vector the same length as the longer input, with TRUE where the comparison holds and FALSE where it does not.** They are vectorized: `c(1, 2, 3) > 2` returns `c(FALSE, FALSE, TRUE)`.

For exact equality between objects (lists, models, complex types), use `identical(x, y)` instead of `x == y`. For floating-point comparisons, use `all.equal(x, y)` instead of `==`.

## Syntax

**All six operators take two values (or vectors) and return TRUE/FALSE.** They recycle the shorter vector if lengths differ.

```r title="Comparison operators on vectors"
x <- c(1, 2, 3, 4)
y <- c(2, 2, 2, 2)

x == y
#> [1] FALSE  TRUE FALSE FALSE

x > y
#> [1] FALSE FALSE  TRUE  TRUE

x %in% c(2, 4)
#> [1] FALSE  TRUE FALSE  TRUE
```

[TIP]
**`==` does element-wise comparison; `identical()` checks if two whole objects are EXACTLY the same.** `c(1, 2) == c(1, 2)` returns `c(TRUE, TRUE)` (a vector). `identical(c(1, 2), c(1, 2))` returns `TRUE` (a single value). Use identical for if-conditions where you want a single TRUE/FALSE for object equality.

## Six common patterns

### 1. Equality and inequality

```r title="Basic equality tests"
x <- c(1, 2, 3, 4)
x == 2
#> [1] FALSE  TRUE FALSE FALSE

x != 2
#> [1]  TRUE FALSE  TRUE  TRUE
```

`==` returns TRUE for matches; `!=` is its negation.

### 2. Range comparisons

```r title="Less than, greater than, between"
x <- c(5, 10, 15, 20, 25)
x > 10 & x < 25
#> [1] FALSE FALSE  TRUE  TRUE FALSE
```

Combine `>` and `<` with `&` for ranges. dplyr's `between(x, 10, 25)` is more readable for inclusive ranges.

### 3. Floating-point trap

```r title="The classic 0.1 + 0.2 != 0.3 problem"
0.1 + 0.2 == 0.3
#> [1] FALSE

# Why? Because:
0.1 + 0.2
#> [1] 0.3
0.1 + 0.2 - 0.3
#> [1] 5.551115e-17

# Use all.equal:
all.equal(0.1 + 0.2, 0.3)
#> [1] TRUE
```

Floating-point representation is approximate. Two values that look equal may differ by tiny amounts. ALWAYS use `all.equal()` for float comparisons or `abs(x - y) < tolerance` with an explicit tolerance.

### 4. Membership with %in%

```r title="Test if values are in a set"
fruits <- c("apple", "banana", "cherry", "date")
fruits %in% c("apple", "cherry")
#> [1]  TRUE FALSE  TRUE FALSE
```

`%in%` is the readable way to test "is x one of these values". Equivalent to chained `==` connected by `|` but cleaner.

### 5. NA propagation

```r title="NA in comparisons returns NA"
x <- c(1, NA, 3)
x > 2
#> [1] FALSE    NA  TRUE

is.na(x > 2)
#> [1] FALSE  TRUE FALSE
```

`NA > 2` is NA (the unknown could be anything). To handle NAs in comparisons, combine with `is.na()` or use `coalesce()` from dplyr.

### 6. identical() vs == for objects

```r title="When you want one TRUE/FALSE, not a vector"
a <- list(x = 1:3, y = "hello")
b <- list(x = 1:3, y = "hello")

a == b
#> Error in a == b : comparison of these types is not implemented

identical(a, b)
#> [1] TRUE
```

`==` does NOT work on lists. `identical()` is the correct way to test deep equality between any R objects (lists, environments, functions, S4 objects).

[KEY INSIGHT]
**Never use `==` to compare floating-point numbers for equality.** The result depends on rounding errors invisible in the printed output. Use `all.equal(x, y)` (returns TRUE or a string describing the difference) or `abs(x - y) < tolerance` with an explicit tolerance. This is the most common silent bug in R numerical code.

## R comparison operators reference

**The six basic operators plus three companion functions cover every common comparison need in R.** Vectorized by default; use companion functions for object-level or float-aware checks.

| Operator | Meaning | Vectorized | Notes |
|---|---|---|---|
| `==` | equal | Yes | Beware of floating-point rounding |
| `!=` | not equal | Yes | Negation of `==` |
| `<` | less than | Yes | Strict |
| `>` | greater than | Yes | Strict |
| `<=` | less than or equal | Yes | Inclusive |
| `>=` | greater than or equal | Yes | Inclusive |
| `%in%` | element of set | Yes | Use for membership |
| `identical()` | exact equality | Returns single TRUE/FALSE | Best for objects |
| `all.equal()` | near equality | Returns TRUE or message | Best for floats |

When to use which:

- Use `==` and friends for vectorized element comparisons.
- Use `identical()` to compare whole R objects.
- Use `all.equal()` for floating-point near-equality.
- Use `%in%` for "is x one of these values".

## Common pitfalls

**Pitfall 1: comparing floats with `==`.** `0.1 + 0.2 == 0.3` returns FALSE due to floating-point representation. Use `all.equal()` or `abs(diff) < tolerance`.

**Pitfall 2: `==` on factors.** Comparing factors to strings often fails because factor equality compares LEVEL INTEGERS, not strings. Convert factor to character first: `as.character(factor_var) == "value"`.

[WARNING]
**`a == NA` is always NA, not FALSE.** Testing `if (x == NA)` is a bug; the result is NA, which `if()` cannot handle. Use `is.na(x)` instead. Same for `x == NULL`: it returns `logical(0)`, not FALSE; use `is.null(x)`.

**Pitfall 3: assuming `==` works on lists.** It does not. `list(1, 2) == list(1, 2)` errors. Use `identical()` for object equality.

## Try it yourself

**Try it:** Find rows in `mtcars` where `mpg` is NEARLY equal to 21 (within 0.5) using a tolerance comparison. Save to `ex_near21`.

```r title="Your turn: tolerance comparison"
# Try it: rows where abs(mpg - 21) < 0.5
ex_near21 <- mtcars[
  # your condition here,
]

ex_near21$mpg
#> Expected: values close to 21, e.g., 21.0, 21.0, 21.4, 21.4, 21.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_near21 <- mtcars[abs(mtcars$mpg - 21) < 0.5, ]
ex_near21$mpg
#> [1] 21.0 21.0 21.4 21.4 21.5
```

**Explanation:** `abs(mpg - 21) < 0.5` is TRUE for any row whose mpg differs from 21 by less than 0.5. This is the safe pattern for floating-point near-equality. `mtcars[..., ]` subsets rows where the condition is TRUE.

</details>

## Related R functions

After mastering comparison operators, look at:

- `identical()`: deep object equality
- `all.equal()`: near equality with tolerance
- `near()` (dplyr): readable wrapper for float near-equality
- `is.na()`, `is.null()`: tests for special values
- `between()` (dplyr): inclusive range check
- `%in%`: set membership
- `Negate()`: function-level negation (`Negate(is.na)` returns the inverse)

For string comparisons with case-insensitivity or pattern matching, use `tolower()`, `grepl()`, or `stringr::str_detect()`.

## FAQ

**What is the difference between == and identical() in R?**

`==` is vectorized element-wise comparison; returns a logical VECTOR. `identical()` returns a single TRUE/FALSE for whether two whole R objects are exactly equal (same type, same value, same structure). Use `==` for element-wise; `identical()` for whole-object comparison.

**Why does 0.1 + 0.2 != 0.3 in R?**

Floating-point representation is approximate. The true result of `0.1 + 0.2` is `0.30000000000000004`, not `0.3`. The `==` operator detects this tiny difference. Use `all.equal(0.1 + 0.2, 0.3)` (returns TRUE) or `abs(diff) < tolerance`.

**How do I check if a value is in a set in R?**

Use `%in%`: `x %in% c(1, 2, 3)` returns TRUE if x is one of 1, 2, or 3. Negate with `!`: `!(x %in% c(1, 2, 3))`. More readable than chained `==` connected by `|`.

**What does == NA return in R?**

NA. Comparing anything with NA returns NA, including `NA == NA`. To test for NA, use `is.na(x)`. To filter NAs out: `x[!is.na(x)]`.

**How do I compare floating-point numbers in R?**

Never with `==`. Use `all.equal(x, y)` for a tolerance-aware test (returns TRUE or a description of the difference). Or `abs(x - y) < tolerance` with an explicit tolerance like `1e-8`. dplyr provides `near(x, y, tol = ...)` as a readable wrapper.
