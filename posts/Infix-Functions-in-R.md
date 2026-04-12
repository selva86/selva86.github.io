---
title: "Infix Functions in R: Write Your Own %op% Operators"
slug: "Infix-Functions-in-R"
description: "Learn how to create custom infix operators in R with %op% syntax. Covers naming rules, precedence, real-world examples, and best practices with interactive code."
keywords: "infix functions in R, custom infix operators R, R %op% operators, create infix function R, R operator precedence, R binary operators, user-defined operators R, R percent operators"
auto_link_terms: "infix functions|infix operators|custom operators|%op% operators|user-defined operators"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-1"
post_type: "FR"
fr_parent: "R-Function-Operators.html"
---

<p class="lead">An infix function in R is a function you call <em>between</em> its two arguments — like <code>x + y</code> or <code>a %in% b</code> — instead of the usual <code>func(x, y)</code> prefix style. You can define your own infix operators using the <code>%name%</code> syntax, turning any two-argument function into a clean, readable operator.</p>

## What Are Infix Functions and Why Does R Use Them?

Every operator you type in R — `+`, `-`, `*`, `<`, even `[` — is secretly a regular function. R just lets you write it *between* the arguments instead of wrapping them in parentheses. This "infix" placement is why `3 + 5` feels natural while `` `+`(3, 5) `` feels clunky. Let's prove it:

```r
# Every R operator is a function — you can call it in prefix form
3 + 5
#> [1] 8

`+`(3, 5)
#> [1] 8

# Same for %in%
10 %in% c(1, 10, 100)
#> [1] TRUE

`%in%`(10, c(1, 10, 100))
#> [1] TRUE
```

Both forms produce identical results because the infix style is syntactic sugar. When R sees `3 + 5`, it internally translates that to `` `+`(3, 5) ``. The same applies to every operator — arithmetic (`+`, `-`, `*`, `/`), comparison (`<`, `==`, `>=`), logical (`&`, `|`), and special operators like `%in%`.

[KEY INSIGHT]
**Every R operator is a function in disguise.** The `+` in `3 + 5` is syntactic sugar for calling the function `+`() with two arguments. This means you can pass operators to higher-order functions like Reduce(), store them in variables, and — most importantly — create your own.

This insight unlocks a powerful idea: if built-in operators are just two-argument functions with special names, nothing stops you from making your own. R reserves the `%name%` syntax specifically for user-defined infix operators.

**Try it:** Convert the expression `x * y - z` into fully prefix form using backtick notation. Assign `x <- 4`, `y <- 3`, `z <- 2` and verify both forms give the same result.

```r
# Try it: rewrite x * y - z in prefix form
ex_x <- 4
ex_y <- 3
ex_z <- 2

# Infix form:
ex_x * ex_y - ex_z
#> Expected: 10

# Prefix form:
# your code here
#> Expected: 10
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_x <- 4
ex_y <- 3
ex_z <- 2

# Infix form:
ex_x * ex_y - ex_z
#> [1] 10

# Prefix form:
`-`(`*`(ex_x, ex_y), ex_z)
#> [1] 10
```

**Explanation:** `x * y` becomes `` `*`(x, y) ``, and the outer `- z` wraps that result: `` `-`(`*`(x, y), z) ``. Read it inside-out — multiply first, then subtract.

</details>

## How Do You Create a Custom %op% Infix Operator?

Creating your own infix operator takes three steps: pick a name wrapped in `%`, define a function with exactly two arguments, and assign it using backticks around the `%name%`. Let's start with the simplest possible example:

```r
# Step 1: Define the operator (backticks required around %name%)
`%plus%` <- function(a, b) {
  a + b
}

# Step 2: Use it — infix style
10 %plus% 5
#> [1] 15

# You can still call it in prefix form
`%plus%`(10, 5)
#> [1] 15
```

That's it — `%plus%` is now a working infix operator. The backticks in the definition tell R that `%plus%` is the function name (special characters need backtick-quoting). When *calling* the operator, no backticks are needed — just write `a %plus% b`.

Let's build something more useful. A common need is checking divisibility:

```r
# Check if x is evenly divisible by y
`%divisible%` <- function(x, y) {
  x %% y == 0
}

12 %divisible% 4
#> [1] TRUE

12 %divisible% 5
#> [1] FALSE

# Works on vectors too
c(10, 15, 20, 25) %divisible% 5
#> [1] TRUE TRUE TRUE TRUE
```

Notice that `%divisible%` is automatically vectorized because `%%` and `==` are vectorized. Your operator inherits whatever behavior its body uses.

Here's one more — a string concatenation operator that replaces nested `paste0()` calls:

```r
# String concatenation operator
`%paste%` <- function(a, b) {
  paste0(a, b)
}

"Hello" %paste% " " %paste% "World" %paste% "!"
#> [1] "Hello World!"

# Compare with nested paste0:
paste0(paste0(paste0("Hello", " "), "World"), "!")
#> [1] "Hello World!"
```

The infix version reads left to right, just like the sentence it builds. The nested version forces you to read inside-out.

[TIP]
**Keep operator names short and descriptive.** Names like `%ni%` (not in) beat `%not_in_vector%`. Your future self should be able to guess what `x %op% y` does from the name alone, without checking the definition.

**Try it:** Create a `%between%` operator that checks if `x` falls between the minimum and maximum of a length-2 vector `y` (inclusive). Test with `15 %between% c(10, 20)`.

```r
# Try it: create %between%
`%between%` <- function(x, y) {
  # your code here
}

# Test:
15 %between% c(10, 20)
#> Expected: TRUE

25 %between% c(10, 20)
#> Expected: FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r
`%between%` <- function(x, y) {
  x >= min(y) & x <= max(y)
}

15 %between% c(10, 20)
#> [1] TRUE

25 %between% c(10, 20)
#> [1] FALSE

# Works with vectors on the left side too
c(5, 15, 25) %between% c(10, 20)
#> [1] FALSE  TRUE FALSE
```

**Explanation:** `min(y)` and `max(y)` extract the bounds, then `>=` and `<=` with `&` check that `x` falls within the range. Vectorization comes free from the comparison operators.

</details>

## What Naming Rules Apply to Custom Infix Operators?

R is surprisingly permissive with infix operator names. The only hard rule is: **no `%` character inside the name**. Everything else — spaces, punctuation, Unicode — is technically allowed.

```r
# Spaces in the name — legal but weird
`% %` <- function(a, b) paste(a, b)
"hello" % % "world"
#> [1] "hello world"

# Punctuation in the name — legal
`%=>%` <- function(a, b) setNames(list(b), a)
"key" %=>% "value"
#> $key
#> [1] "value"
```

Both work because R allows any sequence of characters between the `%` delimiters. You escape special characters in the *definition* (with backticks), but callers write the operator naturally.

The one thing you absolutely cannot do is put a `%` inside the name:

```r
# This will NOT work — % inside the name breaks parsing
# Uncomment to see the error:
# `%50%%` <- function(a, b) a * 0.5 + b * 0.5
# Error: unexpected input in "`%50%%`"
```

R's parser sees the second `%` as the closing delimiter and gets confused by what follows.

[WARNING]
**Avoid special characters in operator names even though R allows them.** Stick to letters, numbers, and underscores for practical code: `%ni%`, `%like%`, `%has%`. Exotic names like `%=>%` or spaces in names cause headaches in team codebases and can break syntax highlighting in some editors.

**Try it:** Create an operator called `%greet%` that pastes the left argument, `" says hello to "`, and the right argument. Test with `"Alice" %greet% "Bob"`.

```r
# Try it: create %greet%
`%greet%` <- function(a, b) {
  # your code here
}

# Test:
"Alice" %greet% "Bob"
#> Expected: "Alice says hello to Bob"
```

<details>
<summary>Click to reveal solution</summary>

```r
`%greet%` <- function(a, b) {
  paste(a, "says hello to", b)
}

"Alice" %greet% "Bob"
#> [1] "Alice says hello to Bob"

"R" %greet% "Python"
#> [1] "R says hello to Python"
```

**Explanation:** `paste()` joins strings with spaces by default. The operator wraps a common string-building pattern into a readable infix call.

</details>

## How Does Operator Precedence Work With Custom Infix Operators?

All custom `%op%` operators share the **same precedence level** — they sit between addition/subtraction and comparison operators in R's precedence table. They also associate **left to right**. Both facts can surprise you.

Let's see left-to-right association in action:

```r
# Build an operator that wraps its result in parentheses
# so we can see evaluation order
`%w%` <- function(a, b) paste0("(", a, " %w% ", b, ")")

"a" %w% "b" %w% "c"
#> [1] "((a %w% b) %w% c)"
```

The output shows that `"a" %w% "b"` evaluates first, then that result feeds into `%w% "c"`. Left to right, just like `3 - 2 - 1` evaluates as `(3 - 2) - 1`.

Now here's the precedence surprise. Custom `%op%` operators bind **tighter** than `+` and `-`:

```r
# What does 10 - 2 %plus% 3 give?
10 - 2 %plus% 3
#> [1] 5

# It's NOT (10 - 2) %plus% 3 = 11
# It IS 10 - (2 %plus% 3) = 10 - 5 = 5
(10 - 2) %plus% 3
#> [1] 11

# But %op% binds looser than * and /
2 * 3 %plus% 4
#> [1] 10

# This is (2 * 3) %plus% 4 = 6 + 4 = 10, not 2 * (3 %plus% 4) = 14
2 * (3 %plus% 4)
#> [1] 14
```

Because `%plus%` has higher precedence than `-`, R evaluates `2 %plus% 3` first, then subtracts that result from 10. But `*` has higher precedence than `%plus%`, so `2 * 3` evaluates before the infix operator gets involved.

[WARNING]
**Custom %op% operators bind tighter than + and - but looser than * and /.** The expression `1 + x %op% y` means `1 + (x %op% y)`, not `(1 + x) %op% y`. When mixing custom operators with arithmetic, add parentheses to make your intent explicit.

**Try it:** Given the `%plus%` operator already defined, predict what `2 + 3 %plus% 4` returns. Then predict what `2 - 3 %plus% 4` returns. Run both to check.

```r
# Try it: predict the results, then run to verify
# Remember: %plus% binds tighter than + and -

2 + 3 %plus% 4
#> Expected: ?

2 - 3 %plus% 4
#> Expected: ?
```

<details>
<summary>Click to reveal solution</summary>

```r
2 + 3 %plus% 4
#> [1] 9

# This is 2 + (3 %plus% 4) = 2 + 7 = 9

2 - 3 %plus% 4
#> [1] -5

# This is 2 - (3 %plus% 4) = 2 - 7 = -5
# NOT (2 - 3) %plus% 4 = -1 + 4 = 3
```

**Explanation:** In both cases, `%plus%` evaluates before `+` or `-` because it has higher precedence. The first example `2 + 7 = 9` looks unsurprising, but the second example `2 - 7 = -5` reveals the trap — many people expect left-to-right reading and would predict `(2 - 3) + 4 = 3`.

</details>

## What Are Some Practical Custom Infix Operators You Can Build?

The toy examples above teach the syntax. Now let's build operators you'll actually use. Each one replaces a pattern you'd otherwise write over and over.

**The "not in" operator** is the most-requested missing operator in base R. Every R programmer has written `!x %in% y` and wondered why there's no built-in negation:

```r
# %ni% — "not in" (the inverse of %in%)
`%ni%` <- function(x, y) {
  !(x %in% y)
}

banned <- c("admin", "root", "test")
"alice" %ni% banned
#> [1] TRUE

"admin" %ni% banned
#> [1] FALSE

# Filter a vector
users <- c("alice", "admin", "bob", "root", "carol")
users[users %ni% banned]
#> [1] "alice" "bob"   "carol"
```

[KEY INSIGHT]
**The best custom operators encode a pattern you repeat often.** If you write `!x %in% y` ten times a day, `%ni%` saves keystrokes and prevents a subtle precedence bug: `!x %in% y` actually means `(!x) %in% y` for non-logical x — the `!` binds to x first, not the whole expression. With `%ni%`, the negation is safely inside the function.

**Null coalescing** gives a default value when the left side is `NULL` — like Python's `or` or JavaScript's `??`:

```r
# %??% — null coalescing (return left if not NULL, else right)
`%??%` <- function(a, b) {
  if (is.null(a)) b else a
}

config_value <- NULL
config_value %??% "default_setting"
#> [1] "default_setting"

config_value <- "custom_setting"
config_value %??% "default_setting"
#> [1] "custom_setting"
```

This is invaluable when working with function arguments or list elements that might be `NULL`.

**Case-insensitive pattern matching** wraps `grepl()` into a readable operator:

```r
# %like% — case-insensitive pattern match
`%like%` <- function(x, pattern) {
  grepl(pattern, x, ignore.case = TRUE)
}

fruits <- c("Apple", "Banana", "Pineapple", "Cherry")
fruits[fruits %like% "apple"]
#> [1] "Apple"     "Pineapple"

"Hello World" %like% "hello"
#> [1] TRUE
```

And **string concatenation** without nested `paste0()`:

```r
# %+% — string concatenation
`%+%` <- function(a, b) paste0(a, b)

greeting <- "Hello" %+% ", " %+% "World" %+% "!"
greeting
#> [1] "Hello, World!"

# Useful for building file paths
dir <- "/data"
file <- "results"
ext <- ".csv"
dir %+% "/" %+% file %+% ext
#> [1] "/data/results.csv"
```

**Try it:** Create a `%clamp%` operator that clamps `x` to the range defined by a length-2 vector `y`. Values below `min(y)` become `min(y)`, values above `max(y)` become `max(y)`. Test with `150 %clamp% c(0, 100)`.

```r
# Try it: create %clamp%
`%clamp%` <- function(x, y) {
  # your code here
  # Hint: use pmin() and pmax()
}

# Test:
150 %clamp% c(0, 100)
#> Expected: 100

-50 %clamp% c(0, 100)
#> Expected: 0

50 %clamp% c(0, 100)
#> Expected: 50
```

<details>
<summary>Click to reveal solution</summary>

```r
`%clamp%` <- function(x, y) {
  pmin(pmax(x, min(y)), max(y))
}

150 %clamp% c(0, 100)
#> [1] 100

-50 %clamp% c(0, 100)
#> [1] 0

50 %clamp% c(0, 100)
#> [1] 50

# Vectorized:
c(-20, 50, 150) %clamp% c(0, 100)
#> [1]   0  50 100
```

**Explanation:** `pmax(x, min(y))` raises any value below the minimum, and `pmin(..., max(y))` caps any value above the maximum. Using `pmin`/`pmax` instead of `min`/`max` keeps the operation vectorized.

</details>

## When Should You Write a Custom Infix Operator (and When Should You Not)?

Custom operators are powerful, but the power comes with a responsibility: every new operator is a symbol your collaborators need to learn. Here's how to decide.

Let's compare the same logic written with and without custom operators:

```r
# --- With custom operators (defined earlier in this session) ---
# Readable pipeline:
cars <- mtcars[mtcars$mpg %between% c(20, 30), ]
excluded <- c("Fiat 128", "Toyota Corolla")
cars <- cars[rownames(cars) %ni% excluded, ]
label <- "Found " %+% nrow(cars) %+% " cars"
label
#> [1] "Found 8 cars"

# --- Same logic without custom operators ---
cars2 <- mtcars[mtcars$mpg >= 20 & mtcars$mpg <= 30, ]
cars2 <- cars2[!(rownames(cars2) %in% c("Fiat 128", "Toyota Corolla")), ]
label2 <- paste0("Found ", nrow(cars2), " cars")
label2
#> [1] "Found 8 cars"
```

The custom operator version reads more like English. But notice — the standard version is also perfectly clear. The operators help most when the pattern repeats dozens of times across a project.

[TIP]
**Write a custom operator when it makes the calling code clearer, not the definition code.** If a colleague can't guess what `x %op% y` does from the name alone, use a regular function instead. A good test: would you put it in your project's utility file and expect everyone on the team to adopt it?

**Guidelines for good judgment:**

1. **Do create operators for** patterns you use 10+ times per project, team-agreed conventions, and package APIs where readability matters (like pipe variants).
2. **Don't create operators for** one-off transformations, complex multi-step logic (more than 5 lines in the body), or names that require explanation.
3. **Package operators** like `%>%`, `%in%`, and `%<>%` work because they're documented, widely known, and part of an ecosystem. Your custom `%magic%` operator in a solo script doesn't have those advantages.

**Try it:** Write a `%titlecase%` operator that capitalizes the first letter of a string and leaves the rest unchanged. Test with `"hello" %titlecase% NULL`. Then think about whether this *should* be an infix operator or a regular function.

```r
# Try it: create %titlecase%
# Hint: use substr() and toupper()
`%titlecase%` <- function(x, unused) {
  # your code here
}

# Test:
"hello" %titlecase% NULL
#> Expected: "Hello"
```

<details>
<summary>Click to reveal solution</summary>

```r
# As an infix operator (works, but has a design smell):
`%titlecase%` <- function(x, unused) {
  paste0(toupper(substr(x, 1, 1)), substr(x, 2, nchar(x)))
}
"hello" %titlecase% NULL
#> [1] "Hello"

# Better approach: a regular function
titlecase <- function(x) {
  paste0(toupper(substr(x, 1, 1)), substr(x, 2, nchar(x)))
}
titlecase("hello")
#> [1] "Hello"
```

**Explanation:** The infix version wastes its right argument — a sign this operation isn't naturally binary. `titlecase("hello")` is cleaner than `"hello" %titlecase% NULL`. When you find yourself ignoring an argument, that's a strong hint to use a regular function instead.

</details>

## Practice Exercises

### Exercise 1: Create a %swap% Operator

Write a `%swap%` operator that takes a vector on the left and a length-2 integer vector on the right (two positions), then returns the vector with those positions swapped. For example, `c("a", "b", "c", "d") %swap% c(2, 4)` should return `c("a", "d", "c", "b")`.

```r
# Exercise 1: %swap% operator
# Hint: copy the vector, then assign both positions from the original

# Write your code below:


# Test:
# c("a", "b", "c", "d") %swap% c(2, 4)
#> Expected: "a" "d" "c" "b"

# 1:5 %swap% c(1, 5)
#> Expected: 5 2 3 4 1
```

<details>
<summary>Click to reveal solution</summary>

```r
`%swap%` <- function(vec, positions) {
  result <- vec
  result[positions[1]] <- vec[positions[2]]
  result[positions[2]] <- vec[positions[1]]
  result
}

c("a", "b", "c", "d") %swap% c(2, 4)
#> [1] "a" "d" "c" "b"

1:5 %swap% c(1, 5)
#> [1] 5 2 3 4 1
```

**Explanation:** We copy the vector first to avoid overwriting a value before it's been read. Then we assign each position's value from the original vector's opposite position.

</details>

### Exercise 2: Create a %chain% Function Composition Operator

Create a `%chain%` operator that composes two functions **left-to-right**: `(f %chain% g)(x)` should equal `g(f(x))`. This is the opposite of mathematical composition (which is right-to-left). Test with `(sqrt %chain% round)(10)` — it should compute `round(sqrt(10))` which is 3.

```r
# Exercise 2: %chain% operator
# Hint: return a NEW function that applies f first, then g

# Write your code below:


# Test:
# (sqrt %chain% round)(10)
#> Expected: 3

# (log %chain% abs %chain% round)(0.01)
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r
`%chain%` <- function(f, g) {
  function(...) g(f(...))
}

(sqrt %chain% round)(10)
#> [1] 3

(log %chain% abs %chain% round)(0.01)
#> [1] 5
```

**Explanation:** `%chain%` returns a *new* function (a closure) that applies `f` first, then passes the result to `g`. The `...` lets the composed function accept any arguments the first function needs. Left-to-right chaining works because `%chain%` associates left to right: `f %chain% g %chain% h` becomes `(f %chain% g) %chain% h`, which applies `f`, then `g`, then `h`.

</details>

### Exercise 3: Create a %where% Data Frame Filter Operator

Create a `%where%` operator that filters a data frame (left side) using a quoted condition string (right side). For example, `mtcars %where% "mpg > 25 & cyl == 4"` should return only the matching rows. Use `parse()` and `eval()` to evaluate the condition string within the data frame's context.

```r
# Exercise 3: %where% operator
# Hint: parse() converts a string to an expression, eval() runs it

# Write your code below:


# Test:
# mtcars %where% "mpg > 25 & cyl == 4"
#> Expected: rows like Fiat 128, Honda Civic, Toyota Corolla, Lotus Europa
```

<details>
<summary>Click to reveal solution</summary>

```r
`%where%` <- function(df, condition) {
  expr <- parse(text = condition)
  mask <- eval(expr, envir = df)
  df[mask, ]
}

result <- mtcars %where% "mpg > 25 & cyl == 4"
result[, 1:4]
#>                 mpg cyl  disp  hp
#> Fiat 128       32.4   4  78.7  66
#> Honda Civic    30.4   4  75.7  52
#> Toyota Corolla 33.9   4  71.1  65
#> Fiat X1-9      27.3   4  79.0  66
#> Lotus Europa   30.4   4  95.1 113
```

**Explanation:** `parse(text = condition)` converts the string into an R expression, and `eval(expr, envir = df)` evaluates it with the data frame's columns as variables. This produces a logical vector that subsets the rows. Note: `eval(parse(...))` on user-supplied strings is a security risk in production — fine for interactive analysis, but don't accept untrusted input.

</details>

## Putting It All Together

Let's use our operator toolkit in a realistic data-analysis workflow. We already defined `%ni%`, `%??%`, `%+%`, and `%between%` earlier in this session, so they're available in our WebR environment. Here's a complete example that chains them together:

```r
# --- Complete Analysis: Find efficient, mid-range cars ---

# Step 1: Filter to cars with 18-28 mpg
midrange <- mtcars[mtcars$mpg %between% c(18, 28), ]

# Step 2: Exclude specific models
skip <- c("Fiat 128", "Toyota Corolla")
midrange <- midrange[rownames(midrange) %ni% skip, ]

# Step 3: Add a label column using string concatenation
midrange$label <- rownames(midrange) %+% " (" %+% midrange$cyl %+% "cyl)"

# Step 4: Use null coalescing for optional config
max_display <- NULL
n_show <- max_display %??% 5

# Step 5: Show results
head(midrange[, c("mpg", "cyl", "hp", "label")], n_show)
#>                 mpg cyl  hp                    label
#> Mazda RX4      21.0   6 110      Mazda RX4 (6cyl)
#> Mazda RX4 Wag  21.0   6 110  Mazda RX4 Wag (6cyl)
#> Hornet 4 Drive 21.4   6 110 Hornet 4 Drive (6cyl)
#> Valiant        18.1   6 105        Valiant (6cyl)
#> Merc 240D      24.4   4  62      Merc 240D (4cyl)

cat("Showing" %+% " " %+% n_show %+% " of " %+%
    nrow(midrange) %+% " mid-range cars\n")
#> Showing 5 of 14 mid-range cars
```

Each operator replaces a common pattern: `%between%` replaces a double comparison, `%ni%` replaces `!... %in% ...` (avoiding the precedence trap), `%+%` replaces nested `paste0()`, and `%??%` provides a clean default. Together, they make the analysis code read almost like pseudocode.

## Summary

| Concept | Key Point | Example |
|---|---|---|
| What is an infix function? | A function called between its two arguments | `3 + 5` calls `` `+`(3, 5) `` |
| How to create one | Name with `%`, define with backticks, 2 arguments | `` `%ni%` <- function(x, y) !(x %in% y) `` |
| Naming rules | Any characters except `%` inside the name | `%like%`, `%=>%` are valid; `%50%%` is not |
| Precedence | All `%op%` share one level: tighter than `+`, looser than `*` | `1 + x %op% y` means `1 + (x %op% y)` |
| Practical operators | Encode repeated patterns as operators | `%ni%`, `%??%`, `%like%`, `%+%`, `%between%` |
| When to use | When calling code becomes clearer for the whole team | Use for 10+ repetitions; skip for one-off logic |
| When NOT to use | When the name needs explanation or the body is complex | Prefer regular functions for multi-step logic |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 6: Functions, §6.8 Function Forms. [Link](https://adv-r.hadley.nz/functions.html)
2. R Core Team — *R Language Definition*, §3.1.4 Operators. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
3. R Core Team — *An Introduction to R*, §10.2 Defining New Binary Operators. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
4. R Documentation — Syntax: Operator Precedence Table. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Syntax.html)
5. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)
6. magrittr package documentation — Pipe operators. [Link](https://magrittr.tidyverse.org/)

## Continue Learning

1. [R Function Operators](/R-Function-Operators.html) — Learn `compose()`, `negate()`, `partial()`, and `memoise()` to transform existing functions without rewriting them.
2. [Functional Programming in R](/Functional-Programming-in-R.html) — The complete guide to first-class functions, closures, and functional patterns in R.
3. [R Currying and Partial Application](/R-Currying-and-Partial-Application.html) — Pre-fill function arguments for cleaner, more reusable pipelines.
