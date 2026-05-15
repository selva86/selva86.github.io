---
title: "purrr some() in R: Test If Any Element Matches"
slug: purrr-some-in-R
description: "Learn purrr some() in R to test whether at least one element of a list or vector matches a predicate. Covers syntax, examples, NA handling, some vs every."
keywords: "purrr some, some function R, purrr some examples, purrr some vs every, test if any element R, R predicate function"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "some()|purrr some|purrr::some()|purrr some function|test if any element|purrr some predicate"
auto_link_case_sensitive: true
target_keyword: "purrr some"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr some() in R: Test If Any Element Matches

<p class="lead">The purrr some() function tests whether at least one element of a list or vector satisfies a predicate, returning a single TRUE or FALSE. It is the predicate-driven equivalent of asking "does any element match?"</p>

[QUICK ANSWER]
some(1:10, ~ .x > 8)              # any element greater than 8?
some(x, is.character)            # any character element?
some(x, is.na)                   # any NA element?
some(list(), ~ TRUE)             # empty input always FALSE
some(x, ~ .x %% 2 == 0)          # any even number?
some(x, `>`, 80)                 # extra arg 80 passed to >
every(x, .p)                     # ALL elements must match
some(df, ~ any(is.na(.x)))       # any column with NAs?

[DECISION TREE: Is some() the right tool?]
- test if ANY element matches: some(x, .p)
- test if ALL elements match: every(x, .p)
- test if NO element matches: none(x, .p)
- find the first matching value: detect(x, .p)
- find position of first match: detect_index(x, .p)
- check a known value is present: has_element(x, value)
- count how many elements match: sum(map_lgl(x, .p))

## What purrr some() does

**some() reduces a whole collection to one yes/no answer.** You hand it a list or vector and a predicate, and it walks the elements applying that predicate. The instant one element returns `TRUE`, `some()` stops and returns `TRUE`. If it reaches the end without a match, it returns `FALSE`.

This makes `some()` the natural tool for existence checks: "is there at least one missing value?", "did any test fail?", "does this list contain a data frame?". Because it short-circuits on the first match, it never does more work than it has to.

It belongs to a trio of predicate reducers in purrr alongside `every()` (all elements match) and `none()` (no elements match). Together they cover the three quantifier questions you can ask about a collection.

Because `some()` always returns a single logical, it slots cleanly into an `if` condition or a pipeline guard. A common pattern is to test inputs before running an expensive step: if `some()` of the inputs are invalid, you skip the work and report early. The predicate is evaluated element by element only as far as needed, so the check stays cheap even on long lists.

## some() syntax and arguments

**some() takes a collection, a predicate, and optional extra arguments.** The signature is compact:

```r title="The some function signature"
some(.x, .p, ...)
```

| Argument | What it accepts | Purpose |
|---|---|---|
| `.x` | A list or atomic vector | The collection to test |
| `.p` | A predicate function | Applied to each element; must return one `TRUE` or `FALSE` |
| `...` | Extra arguments | Passed on to `.p` on every call |

The predicate `.p` is flexible. You can pass a named function like `is.na`, an anonymous function such as `function(x) x > 0`, or a purrr formula shortcut where `.x` stands for the current element. All three forms behave identically.

The formula shortcut is the most concise option for one-off tests. Inside `~ ...`, the symbol `.x` (or its single-dot alias `.`) refers to whichever element is currently under inspection. The formula is converted into a real function once, then reused for every element, so there is no per-call parsing cost. Whatever expression you write must collapse to one `TRUE` or `FALSE`, which is why aggregations like `any()` often appear inside it.

[NOTE]
**Coming from base R?** `some()` is close to `any(sapply(x, .p))`, but it short-circuits and guarantees a single logical, so it is both faster and safer on large lists.

## some() examples by use case

**The same call shape handles every input type.** The examples below move from a plain numeric vector to a mixed list and then to a data frame, which covers the three input shapes you will meet most often. Each call follows the same structure: a collection, then a predicate. Only the predicate changes as the question changes, and that is the main idea worth carrying away from this section.

**Start with a numeric threshold check.** The formula `~ .x > 10` is applied to each number, and `some()` reports whether any element clears the bar.

```r title="Test a numeric vector against a threshold"
library(purrr)

nums <- c(3, 7, 11, 4)
some(nums, ~ .x > 10)
#> [1] TRUE

some(nums, ~ .x > 100)
#> [1] FALSE
```

**Predicates work on heterogeneous lists too.** Pass a type-checking function to ask whether a list holds any element of a given class.

```r title="Check element types in a list"
mixed <- list(1L, "a", TRUE, 2.5)

some(mixed, is.character)
#> [1] TRUE

some(mixed, is.data.frame)
#> [1] FALSE
```

A data frame is a list of columns, so `some()` iterates over columns. This gives a clean one-liner for spotting missing data anywhere in a table. The inner `any(is.na(.x))` collapses each column to one logical, and `some()` then collapses those column results to a single answer for the whole frame.

```r title="Detect missing values across columns"
some(airquality, ~ any(is.na(.x)))
#> [1] TRUE
```

This nesting pattern generalises well. Swap the inner test for whatever column-level rule you need, such as `~ is.numeric(.x)` to check for any numeric column, or `~ max(.x, na.rm = TRUE) > 100` to flag an out-of-range column. The outer `some()` stays the same; only the predicate changes.

[KEY INSIGHT]
**some() is the predicate version of any().** Where `any()` consumes a logical vector, `some()` consumes raw data plus a rule. That rule lives in one place, so the question reads like plain English.

**Extra arguments are forwarded straight to the predicate.** Passing the backtick-quoted `>` operator with a second argument turns it into a clean comparison.

```r title="Pass extra arguments to the predicate"
scores <- c(45, 72, 88)
some(scores, `>`, 80)
#> [1] TRUE
```

Here the backtick-quoted `>` operator is the predicate and `80` is forwarded through `...` as its second argument, so each element is compared against the threshold. This style keeps a reusable threshold out of the predicate body, which is handy when the cutoff comes from a variable. The same mechanism works with any function that accepts extra parameters, such as passing `na.rm = TRUE` to a summary predicate.

## some() vs every(), none(), and any()

**Pick the function that matches the quantifier you mean.** All four answer existence questions, but they differ in what counts as success and whether they short-circuit.

| Function | Returns TRUE when | Stops early on |
|---|---|---|
| `some(x, .p)` | At least one element matches | First match |
| `every(x, .p)` | Every element matches | First non-match |
| `none(x, .p)` | No element matches | First match, then FALSE |
| `any(map_lgl(x, .p))` | At least one element matches | Never, evaluates all |

The decision rule is simple. Use `some()` for "any", `every()` for "all", and `none()` for "none". Reach for `any(map_lgl(...))` only when you also need the full logical vector for something else.

Short-circuiting matters most on large or expensive collections. If your predicate calls a slow function, `some()` may finish after the first element while `any(map_lgl(...))` evaluates every one. For a quick existence check on a long list, the purrr reducer is both shorter to read and faster to run.

## Common pitfalls

**Mistake 1: expecting an empty collection to error.** `some()` returns `FALSE` for an empty input because no element matched. This is the mathematically correct answer, but it can surprise you.

```r title="Empty input returns FALSE"
some(list(), ~ TRUE)
#> [1] FALSE
```

**Mistake 2: assuming NA propagates like base any().** When a predicate yields `NA`, `some()` treats it as "not a match" rather than passing the `NA` through. Base `any()` would return `NA` instead. If you actually want missing values to count, test for them directly with `is.na` so the predicate returns a real `TRUE`.

```r title="NA elements count as no match"
some(c(5, NA, 8), ~ .x > 10)
#> [1] FALSE
```

[WARNING]
**A predicate must return exactly one TRUE or FALSE per element.** If `.p` returns a length-2 logical or a non-logical value, `some()` raises an error. Wrap multi-value logic in `any()` or `all()` inside the predicate.

## Try it yourself

**Try it:** Use `some()` to test whether the `mtcars` dataset has any car with `mpg` above 30. Save the result to `ex_has_efficient`.

```r title="Your turn: test mtcars mpg"
# Try it: does any car beat 30 mpg?
ex_has_efficient <- # your code here

ex_has_efficient
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_has_efficient <- some(mtcars$mpg, ~ .x > 30)
ex_has_efficient
#> [1] TRUE
```

**Explanation:** `mtcars$mpg` is a numeric vector, so `some()` applies the formula `~ .x > 30` to each value and returns `TRUE` as soon as one car clears 30 mpg.

</details>

## Related purrr functions

- `every()`: returns `TRUE` only when all elements satisfy the predicate.
- `none()`: returns `TRUE` only when no element satisfies the predicate.
- `detect()`: returns the first matching element instead of a logical.
- `detect_index()`: returns the position of the first match.
- `has_element()`: tests whether a specific value is present in a list.

For the wider picture of predicate-driven iteration, see the guide to [functional programming in R](Functional-Programming-in-R.html). The official reference lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/every.html).

## FAQ

**What is the difference between some() and any() in R?**

`any()` works on a logical vector you have already computed, while `some()` works on raw data plus a predicate rule. `some()` applies the rule itself, short-circuits on the first match, and always returns a single `TRUE` or `FALSE`. It also treats `NA` predicate results as non-matches, whereas `any()` can return `NA`. Use `some()` when the test logic should travel with the question.

**Does purrr some() work on data frames?**

Yes. A data frame is a list of columns, so `some()` iterates over its columns. A call like `some(df, ~ any(is.na(.x)))` checks whether any column contains a missing value. To test rows instead, transpose the data or use a row-wise approach, since `some()` only sees the top-level list elements.

**What does some() return for an empty list?**

It returns `FALSE`. No element exists, so no element can satisfy the predicate, and "at least one match" is therefore false. This mirrors the behaviour of `any(logical(0))`, which is also `FALSE`. If your logic depends on collection size, check `length(x)` separately before calling `some()`.

**How does purrr some() handle NA values?**

When the predicate returns `NA` for an element, `some()` treats that element as not matching and keeps scanning. The final result is `TRUE` only if some element produced a genuine `TRUE`. This differs from base `any()`, which propagates `NA`. To make missing values themselves count as a match, test for them explicitly with `is.na` inside the predicate. The safest habit is to decide up front whether `NA` means "no" or "unknown" for your task, then write the predicate so that intent is explicit rather than relying on the default.
