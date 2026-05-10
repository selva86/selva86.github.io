---
title: "R Logical Operators: AND, OR, NOT (With Truth Tables)"
slug: "R-Logical-Operators-in-R"
description: "Complete guide to R logical operators: vectorized & |, short-circuit && ||, NOT (!), xor(). Includes truth tables, NA handling, and 7 worked examples."
keywords: "R logical operators, & vs && in R, R AND OR NOT, logical operators in R, R short circuit, R xor, R Boolean operators"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Basic-Syntax-Beginners-Guide.html"
auto_link_terms: "logical operators|R logical operators|Boolean operators|AND OR NOT in R|short circuit"
auto_link_case_sensitive: false
target_keyword: "R logical operators"
sibling_block_enabled: true
difficulty: "Beginner"
---

# R Logical Operators: AND, OR, NOT (With Truth Tables)

<p class="lead">R has six logical operators: <code>&amp;</code> and <code>|</code> (vectorized AND/OR), <code>&amp;&amp;</code> and <code>||</code> (scalar short-circuit AND/OR), <code>!</code> (NOT), and <code>xor()</code>. Vectorized forms work element-wise on whole vectors; scalar forms expect single TRUE/FALSE values.</p>

[QUICK ANSWER]
x & y                     # element-wise AND (vectorized)
x | y                     # element-wise OR (vectorized)
!x                        # element-wise NOT
x && y                    # scalar AND (short-circuit, single TRUE/FALSE)
x || y                    # scalar OR (short-circuit, single TRUE/FALSE)
xor(x, y)                 # element-wise exclusive OR
isTRUE(x); isFALSE(x)     # safer scalar tests (handle NA)

[DECISION TREE: Which logical operator?]
- vectorized AND on vectors: &
- vectorized OR on vectors: |
- scalar AND inside if(): && (R 4.3+ requires single TRUE/FALSE)
- scalar OR inside if(): ||
- negate condition: !
- exclusive OR (one but not both): xor()
- safe scalar test for TRUE: isTRUE(x)
- mix multiple conditions: parens to control precedence

## What R's logical operators do in one sentence

**`&` and `|` apply element-wise to whole vectors; `&&` and `||` apply only to scalars and short-circuit (stop evaluating once the result is determined).** `!` negates element-wise. `xor()` is element-wise exclusive OR.

R is unusual among programming languages in having both vectorized and scalar forms. The single-character operators (`&`, `|`) work on full vectors. The double-character forms (`&&`, `||`) require scalar inputs and stop evaluating early when possible. Use vectorized inside `filter()` and `which()`; use scalar inside `if()` and `while()`.

## Syntax

**Vectorized operators apply pairwise to vectors of the same length.** Scalar operators expect length-1 logical inputs.

```r title="Logical operators on vectors"
x <- c(TRUE, FALSE, TRUE, FALSE)
y <- c(TRUE, TRUE, FALSE, FALSE)

x & y     # vectorized AND
#> [1]  TRUE FALSE FALSE FALSE

x | y     # vectorized OR
#> [1]  TRUE  TRUE  TRUE FALSE

!x        # NOT
#> [1] FALSE  TRUE FALSE  TRUE

xor(x, y) # exclusive OR
#> [1] FALSE  TRUE  TRUE FALSE
```

[TIP]
**Use `&` and `|` inside dplyr filter and base R subsetting; use `&&` and `||` inside `if()` and `while()`.** The vectorized forms return logical vectors; the scalar forms return a single TRUE/FALSE. Mixing them up is the most common R logic bug.

## Seven common patterns

### 1. Truth tables for AND, OR, NOT, XOR

```r title="Print all four logical functions on every TRUE/FALSE pair"
truth <- expand.grid(x = c(TRUE, FALSE), y = c(TRUE, FALSE))
truth$AND <- truth$x & truth$y
truth$OR  <- truth$x | truth$y
truth$NOT_x <- !truth$x
truth$XOR <- xor(truth$x, truth$y)
truth
#>       x     y   AND    OR NOT_x   XOR
#> 1  TRUE  TRUE  TRUE  TRUE FALSE FALSE
#> 2 FALSE  TRUE FALSE  TRUE  TRUE  TRUE
#> 3  TRUE FALSE FALSE  TRUE FALSE  TRUE
#> 4 FALSE FALSE FALSE FALSE  TRUE FALSE
```

These four columns are the fundamental truth tables. Every logic problem in R reduces to combinations of these.

### 2. Vectorized AND inside filter

```r title="Combine conditions with &"
library(dplyr)
mtcars |> filter(mpg > 20 & cyl == 4) |> nrow()
#> [1] 6
```

`&` works element-wise on the logical vectors `mpg > 20` and `cyl == 4`, returning TRUE only where both are TRUE.

### 3. Scalar AND inside if()

```r title="Use && for single-value tests"
x <- 10
if (x > 0 && x < 100) {
  print("in range")
}
#> [1] "in range"
```

`if()` requires a single TRUE/FALSE. `&&` short-circuits: if `x > 0` is FALSE, `x < 100` is never evaluated. Faster and safer when conditions have side effects or expensive computations.

### 4. Negation and parentheses

```r title="Negate a complex condition"
x <- c(5, 10, 15, 20)
!(x > 8 & x < 16)
#> [1]  TRUE FALSE FALSE  TRUE
```

`!` negates the whole expression. Parentheses force evaluation order: the outer `!` applies AFTER the inner `&`. Without parens, `!` would only apply to `x > 8`.

### 5. xor() for exclusive OR

```r title="One TRUE but not both"
xor(c(TRUE, TRUE, FALSE), c(TRUE, FALSE, FALSE))
#> [1] FALSE  TRUE FALSE
```

`xor()` returns TRUE when exactly ONE of the two inputs is TRUE. Different from `|` which is TRUE for both.

### 6. isTRUE and isFALSE for safety

```r title="Handles NA gracefully"
x <- NA
if (isTRUE(x)) "yes" else "no"
#> [1] "no"

# Compare to:
if (x) "yes" else "no"
#> Error in if (x) "yes" else "no" : missing value where TRUE/FALSE needed
```

`isTRUE(x)` returns TRUE only when `x` is exactly `TRUE` (not NA, not 1, not "TRUE"). Use it inside conditional logic where NA could break things.

### 7. NA propagation

```r title="NAs propagate through logical operators"
x <- c(TRUE, FALSE, NA)
y <- c(TRUE, TRUE, TRUE)
x & y
#> [1]  TRUE FALSE    NA

x | y
#> [1] TRUE TRUE TRUE
```

NA is "unknown". `NA & TRUE` is NA (the unknown could be TRUE or FALSE). `NA | TRUE` is TRUE (regardless of the NA, the OR is satisfied). Predict NA behavior using these rules.

[KEY INSIGHT]
**Use `&` and `|` for VECTORS; `&&` and `||` for SCALARS.** This is the single most important rule. `if (x > 0 & x < 100)` works for length-1 x but in R 4.3+ ERRORS for vectors. `if (x > 0 && x < 100)` always works because `&&` enforces scalar inputs. Inside `filter()`, `which()`, and any element-wise subset, use the single-character forms.

## R's logical operators compared

**Each operator has a specific role: vectorized vs scalar, AND vs OR, NOT, or XOR.** The table below summarizes the differences and where each fits.

| Operator | Type | Vectorized? | Short-circuits? | Use in |
|---|---|---|---|---|
| `&` | AND | Yes | No | filter, which, vectors |
| `|` | OR | Yes | No | filter, which, vectors |
| `!` | NOT | Yes | N/A | any logical context |
| `&&` | AND | No (scalar) | Yes | if, while, scalar tests |
| `||` | OR | No (scalar) | Yes | if, while, scalar tests |
| `xor()` | XOR | Yes | No | exclusive OR (rare) |

When to use which:

- Inside `filter()`, `subset()`, `which()`, `[ ]`: vectorized (`&`, `|`).
- Inside `if()`, `while()`, function-arg validators: scalar (`&&`, `||`).
- Use `isTRUE()` and `isFALSE()` for NA-safe scalar tests.

## Common pitfalls

**Pitfall 1: using `&&` on a vector.** In R 4.3+, `c(TRUE, FALSE) && TRUE` errors. Pre-4.3 it silently returned just the first comparison's result. Always use `&` for vectorized AND.

**Pitfall 2: using `&` inside `if()`.** `if (vec & TRUE)` returns a vector; `if()` expects a single value. R warns or errors depending on version. Use `&&` for scalar tests inside `if()`.

[WARNING]
**NA breaks naive `if()` checks.** `if (NA)` errors. To handle: wrap with `isTRUE()` or `isFALSE()`. `isTRUE(NA)` is FALSE; `isFALSE(NA)` is also FALSE. Both safely return TRUE/FALSE for any input.

**Pitfall 3: precedence with mixed operators.** `x | y & z` evaluates as `x | (y & z)` because `&` has HIGHER precedence than `|`. To force `(x | y) & z`, use parentheses explicitly. Always parenthesize compound conditions.

## Try it yourself

**Try it:** Use logical operators to subset `mtcars` to cars where (mpg > 25 OR hp > 200) AND am == 1 (manual transmission). Save to `ex_subset` and print row count.

```r title="Your turn: compound logical filter"
# Try it: combine OR + AND with proper parens
ex_subset <- mtcars[
  # your condition here,
]

nrow(ex_subset)
#> Expected: 7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_subset <- mtcars[(mtcars$mpg > 25 | mtcars$hp > 200) & mtcars$am == 1, ]
nrow(ex_subset)
#> [1] 7
```

**Explanation:** Outer `&` requires both conditions. Inner `|` requires either mpg > 25 OR hp > 200. Parentheses force the OR to evaluate first; without them, R would evaluate `&` first (higher precedence) and produce a different result.

</details>

## Related R operators

After mastering logical operators, look at:

- `==`, `!=`, `<`, `>`, `<=`, `>=`: comparison operators (produce logical vectors)
- `%in%`: set membership (produces logical vector)
- `any()`, `all()`: collapse a logical vector to a single TRUE/FALSE
- `ifelse()`, `if_else()`, `case_when()`: conditional value assignment
- `which()`: positions where a logical vector is TRUE
- `Negate()`: function-level negation (rare, for functional programming)

For NA-aware comparison, the dplyr `coalesce()` and `if_else(condition, true, false, missing = ...)` give explicit control.

## FAQ

**What is the difference between & and && in R?**

`&` is VECTORIZED: applies element-wise to vectors of any length. `&&` is SCALAR: requires single TRUE/FALSE inputs and short-circuits. Use `&` inside `filter()` and vector subsetting. Use `&&` inside `if()` and `while()`.

**How do I use logical operators in R?**

For element-wise on vectors: `&` (AND), `|` (OR), `!` (NOT), `xor()`. For single-value tests in `if()`: `&&` and `||`. Truth tables follow the standard Boolean rules; NA propagates as "unknown".

**What does the | operator do in R?**

`|` is the vectorized OR operator. `c(TRUE, FALSE) | c(FALSE, TRUE)` returns `c(TRUE, TRUE)` (each element is TRUE because at least one of the pair is). Used heavily inside `filter()` and `which()`.

**What is the difference between | and || in R?**

`|` is VECTORIZED OR; works element-wise on vectors. `||` is SCALAR OR; expects single inputs and short-circuits. R 4.3+ errors when `||` is given a vector longer than 1.

**How does NA work with logical operators in R?**

NA propagates as "unknown". `TRUE & NA` is NA. `TRUE | NA` is TRUE (the TRUE alone satisfies OR). `FALSE & NA` is FALSE. Use `isTRUE()` / `isFALSE()` to safely treat NA as not-TRUE / not-FALSE in conditional logic.
