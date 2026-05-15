---
title: "purrr negate() in R: Flip a Predicate's Logic"
slug: purrr-negate-in-R
description: "Learn purrr negate() in R to flip a predicate function so TRUE becomes FALSE. Covers syntax, keep and discard pairing, formula predicates, and pitfalls."
keywords: "purrr negate, negate function R, purrr negate examples, R negate predicate, invert predicate function R, purrr negate is.na"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "negate()|purrr negate|purrr::negate()|negated predicate|negate a predicate"
auto_link_case_sensitive: true
target_keyword: "purrr negate"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr negate() in R: Flip a Predicate's Logic

<p class="lead">purrr negate() in R takes a predicate function and returns a new function that flips its result, turning every TRUE into FALSE and every FALSE into TRUE. It lets you reuse the opposite of a test, such as "not missing" from is.na(), without writing a wrapper by hand.</p>

[QUICK ANSWER]
negate(is.na)                       # flip a named predicate
negate(is.na)(c(1, NA, 3))          # call it inline
not_na <- negate(is.na)             # save the negated predicate
keep(x, negate(is.null))            # keep the non-NULL elements
negate(\(x) x > 0)                  # negate an anonymous function
negate(~ .x %% 2 == 0)              # negate a formula predicate
map_lgl(x, negate(is.character))    # use it inside map

[DECISION TREE: Is negate() the right tool?]
- flip a predicate's TRUE/FALSE result: negate(is.na)
- drop elements that pass a test: discard(x, is.null)
- keep elements that pass a test: keep(x, is.numeric)
- combine several functions into one: compose(f, g)
- pre-set some of a function's arguments: partial(fn, n = 2)
- test whether all or any elements pass: every(x, is.numeric)

## What negate does

**negate() builds the opposite of a test.** You hand it a predicate, a function that returns TRUE or FALSE, and it returns a new function that runs the original and inverts the answer. Nothing is computed when you call negate(); it hands back a function that you call later on real data.

This solves a small but constant annoyance. R ships `is.na()`, `is.null()`, and `is.numeric()`, but it ships no `is_not_na()`. Instead of writing `function(x) !is.na(x)` every time, you write `negate(is.na)` once and reuse it everywhere a function is expected.

[KEY INSIGHT]
**negate() is a function operator.** It takes a function as input and returns a function as output, the same family as compose() and partial(). The value it produces is a tool, not a result, so you store it in a variable and apply it again and again.

## negate syntax

**The signature is `negate(.p)`.** The single argument `.p` is the predicate to invert. negate() accepts it in three forms, all coerced through purrr's mapper rules.

| Form of `.p` | Example | Meaning |
|--------------|---------|---------|
| Named function | `negate(is.na)` | Inverts an existing predicate by name |
| Anonymous function | `negate(\(x) x > 0)` | Inverts an inline lambda |
| Formula | `negate(~ .x > 0)` | Inverts a purrr formula, `.x` is the input |

The function negate() returns is itself called like any predicate. Whatever arguments you pass go straight to the original predicate, and the `!` operator is applied to its result.

```r title="Load purrr and negate a predicate"
library(purrr)

not_na <- negate(is.na)
not_na(c(1, NA, 3, NA, 5))
#> [1]  TRUE FALSE  TRUE FALSE  TRUE
```

The call `negate(is.na)` reads as "not is.na". is.na() would mark the missing values TRUE; the negated version marks the present values TRUE instead, which is usually what you want when filtering.

## Pair negate with keep and discard

**negate() shines when a filter only has a positive test.** purrr's keep() retains elements that pass a predicate. To retain elements that fail one, wrap the predicate in negate() instead of switching to a different function.

```r title="Keep elements that fail a test"
x <- list(a = 1:3, b = "text", c = 4:6, d = "more")

keep(x, negate(is.numeric)) |> names()
#> [1] "b" "d"
```

Here `keep(x, negate(is.numeric))` retains the non-numeric elements. It produces the same result as `discard(x, is.numeric)`, so negate() and discard() are two routes to one outcome. Reach for negate() when you want to name the inverted predicate and reuse it, and for discard() when you only need the filter once.

[TIP]
**Name your negated predicates.** Assigning `not_na <- negate(is.na)` makes call sites read like plain English: `keep(values, not_na)`. An inline `negate(is.na)` works too, but a named predicate documents intent and avoids rebuilding the function on every call.

## Negate anonymous and formula predicates

**negate() is not limited to named functions.** Any predicate purrr can interpret works, including anonymous `\(x)` functions and `~` formulas where `.x` is the first argument.

```r title="Negate a formula or anonymous predicate"
not_positive <- negate(\(x) x > 0)
not_positive(c(-2, 0, 5, -1))
#> [1]  TRUE  TRUE FALSE  TRUE

is_odd <- negate(~ .x %% 2 == 0)
is_odd(c(1, 2, 3, 4))
#> [1]  TRUE FALSE  TRUE FALSE
```

`negate(\(x) x > 0)` flips a "greater than zero" test into "not greater than zero". The formula version `~ .x %% 2 == 0` tests for even numbers, so its negation tests for odd ones. Both negated functions stay vectorised because their underlying predicates are.

```r title="Use negate inside map_lgl"
items <- list(10, "hello", NULL, 42, NULL)
map_lgl(items, negate(is.null))
#> [1]  TRUE  TRUE FALSE  TRUE FALSE
```

Passing `negate(is.null)` to map_lgl() produces a logical vector marking which list slots actually hold a value, a common first step before dropping the empty ones.

## negate vs the alternatives

**negate() produces a function; the `!` operator produces a value.** They answer related questions, so pick the one that matches whether you need a reusable predicate or a one-time answer.

| Tool | Produces | Best for |
|------|----------|----------|
| `negate(.p)` | A flipped predicate function | Reusing the inverse of a test in many places |
| `!test(x)` | A logical value | Inverting a test once, inline |
| `discard(x, .p)` | A filtered list or vector | Dropping the elements that pass a test |
| `base::Negate(f)` | A flipped predicate function | The same job without loading purrr |

The rule is short. If you invert a test in exactly one spot, `!is.na(x)` is clearest. If the same inverted test appears in three places, name it once with negate(). When you only want the filtered data and never the predicate itself, skip negate() and call discard() directly.

[NOTE]
**Coming from base R?** `base::Negate()` does the same job and predates purrr. `negate()` adds support for purrr formulas and anonymous-function shorthand, and reads consistently with the rest of the purrr toolkit. In Python there is no direct equivalent; you would write `lambda x: not f(x)`.

## Common pitfalls

**negate() takes a predicate, not data.** Its only argument is the function to invert. Passing the data alongside the predicate is the most frequent mistake, because it looks like a one-step call.

```r title="negate takes only a predicate, not data"
negate(is.na, c(1, NA))
#> Error in negate(is.na, c(1, NA)): unused argument (c(1, NA))
```

negate() builds a function first; you call that function on data in a separate step, as in `negate(is.na)(c(1, NA))`.

**negate() does not make a predicate NA-safe.** The negated function applies `!` to whatever the original returns. If the predicate returns NA, the negation is NA as well, since `!NA` is NA.

```r title="negate does not make a predicate NA-safe"
not_positive <- negate(\(x) x > 0)
not_positive(c(5, NA, -1))
#> [1] FALSE    NA  TRUE
```

The comparison `NA > 0` yields NA, and negating it leaves NA. Use an NA-aware predicate if missing values must resolve to a definite TRUE or FALSE.

**A negated predicate inherits the original's shape.** negate() does not vectorise anything. If the underlying predicate returns a single value, so does its negation, even when you pass a vector.

## Try it yourself

**Try it:** Build a predicate `ex_has_value` that returns TRUE for list elements that are not NULL, using negate(). Then use it with keep() to retain the non-NULL elements of `list(1, NULL, 3, NULL)`.

```r title="Your turn: negate is.null"
# Try it: negate is.null, then keep
ex_has_value <- # your code here

keep(list(1, NULL, 3, NULL), ex_has_value)
#> Expected: a list of 1 and 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_has_value <- negate(is.null)
keep(list(1, NULL, 3, NULL), ex_has_value)
#> [[1]]
#> [1] 1
#> 
#> [[2]]
#> [1] 3
```

**Explanation:** negate(is.null) returns a function that is TRUE when an element is not NULL. keep() then retains only the slots where that function returns TRUE, dropping the two NULL entries.

</details>

## Related purrr functions

These functions pair naturally with negate() when you build small predicate toolkits:

- The keep function retains the elements for which a predicate is TRUE, the natural home for a negated predicate.
- The discard function drops elements that pass a test, often the simpler choice when you do not need the inverted predicate by name.
- The compose function chains functions together, and a negated predicate can serve as one stage.
- The partial function fixes some of a function's arguments, another function operator like negate().

See the [purrr negate reference](https://purrr.tidyverse.org/reference/negate.html) for the full specification.

## FAQ

**What does negate() do in purrr?**
negate() takes a predicate function, one that returns TRUE or FALSE, and returns a new function that produces the opposite answer. Calling the new function runs the original predicate and applies `!` to its result. It exists so you can reuse the inverse of a test, such as "not missing" from is.na(), without hand-writing a wrapper function every time you need it.

**What is the difference between negate() and Negate() in base R?**
They do the same job: both take a predicate and return its logical inverse. `base::Negate()` is older and part of base R, so it needs no package. purrr's `negate()` additionally accepts purrr formulas like `~ .x > 0` and anonymous-function shorthand, and it reads consistently with keep(), discard(), and the rest of purrr. Use whichever fits the style of your codebase.

**How do I use negate() with is.na or is.null?**
Wrap the predicate in negate() and store the result: `not_na <- negate(is.na)` or `has_value <- negate(is.null)`. The new function returns TRUE for present, non-missing values. It pairs well with keep(), as in `keep(x, negate(is.null))`, which retains only the elements that actually hold a value.

**Can negate() take a formula or anonymous function?**
Yes. negate() coerces its argument through purrr's mapper rules, so a named function, an anonymous `\(x)` function, and a `~` formula all work. For example, `negate(~ .x %% 2 == 0)` flips an even-number test into an odd-number test, with `.x` standing for the input.

**Does negate() run the predicate or just return a function?**
negate() only returns a function; it runs nothing itself. The original predicate executes later, when you call the function negate() handed back. That is why `negate(is.na)(x)` needs two sets of parentheses: the first builds the negated predicate, the second applies it to `x`.
