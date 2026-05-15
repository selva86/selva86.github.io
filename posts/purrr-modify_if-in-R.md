---
title: "purrr modify_if() in R: Conditionally Transform Elements"
slug: "purrr-modify_if-in-R"
description: "Use purrr modify_if() in R to transform only the list or data frame elements that pass a predicate test. Examples, the .else argument, comparison, pitfalls."
keywords: "purrr modify_if, modify_if function R, purrr modify_if examples, R modify_if list, modify_if vs map_if, conditional list transformation R, modify_if R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr modify_if|modify_if()|purrr::modify_if()|modify_if function|modify_if in R"
auto_link_case_sensitive: true
target_keyword: "purrr modify_if"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr modify_if() in R: Conditionally Transform Elements

<p class="lead">The purrr <code>modify_if()</code> function transforms only the list elements or data frame columns that pass a predicate test, and returns an object of the same type you passed in.</p>

[QUICK ANSWER]
modify_if(x, is.numeric, ~ .x * 2)        # transform numeric elements
modify_if(x, is.character, toupper)       # transform character elements
modify_if(df, is.numeric, round)          # round numeric columns only
modify_if(x, is.numeric, f, .else = g)    # two-way transform
modify_if(x, c(TRUE, FALSE, TRUE), f)     # logical-vector selector
modify_if(x, ~ length(.x) > 1, sum)       # custom predicate per element

[DECISION TREE: Is modify_if() the right tool?]
- transform elements that pass a test: modify_if(x, is.numeric, f)
- transform named or positioned elements: modify_at(x, "col", f)
- transform every element: modify(x, f)
- get a list back, not the input type: map_if(x, .p, f)
- keep only the matching elements: keep(x, is.numeric)
- drop the matching elements: discard(x, is.numeric)

## What modify_if() does in one sentence

**`modify_if(.x, .p, .f)` runs `.f` on every element of `.x` for which the predicate `.p` returns `TRUE`, then returns an object of the same class as `.x`.** Elements that fail the test are copied through unchanged.

Think of it as a conditional version of `modify()`. Where `modify()` transforms everything, `modify_if()` first asks a yes-or-no question about each element and only transforms the ones that answer yes. The question is the `.p` argument, and it can be a function like `is.numeric`, a formula like `~ .x > 0`, or even a plain logical vector.

[KEY INSIGHT]
**`modify_if()` selects elements by a property of their values, while `modify_at()` selects them by name or position.** Reach for `modify_if()` when the elements to change share a type or pass a test. Reach for `modify_at()` when you already know exactly which slots to touch.

## Syntax

**`modify_if(.x, .p, .f, ..., .else = NULL)` takes the object to transform, a predicate, and a function.** Extra arguments after `.f` are forwarded to it on every call.

The `.p` predicate decides which elements get transformed. The `.f` function does the transforming. The optional `.else` argument supplies a second function for the elements that fail the predicate. Because the return type matches `.x`, a data frame in gives a data frame out and a named list in gives a named list out.

```r title="modify_if applies a function where a test passes"
library(purrr)

nums <- list(4, 9, 16, 25)

modify_if(nums, ~ .x > 10, sqrt)
#> [[1]]
#> [1] 4
#>
#> [[2]]
#> [1] 9
#>
#> [[3]]
#> [1] 4
#>
#> [[4]]
#> [1] 5
```

The predicate `~ .x > 10` is `FALSE` for 4 and 9, so they pass through. It is `TRUE` for 16 and 25, so `sqrt()` runs on them.

## Four ways to use modify_if()

**Each example below uses a different kind of predicate.** Together they cover almost every real use of the function.

The most common pattern is transforming the numeric columns of a data frame. A data frame is a list of columns, so `is.numeric` selects exactly the numeric ones.

```r title="Transform only the numeric columns"
df <- data.frame(
  product = c("pen", "mug", "book"),
  price   = c(2, 8, 15),
  stock   = c(120, 45, 30)
)

modify_if(df, is.numeric, ~ .x * 1.1)
#>   product price stock
#> 1     pen   2.2 132.0
#> 2     mug   8.8  49.5
#> 3    book  16.5  33.0
```

The `product` column is character, so it is left alone. Both numeric columns are scaled by 1.1.

The same idea works on a plain list. Here `is.character` selects the text elements and uppercases them.

```r title="Transform only the character elements"
mixed <- list(year = 2026, city = "boston", count = 7, label = "active")

modify_if(mixed, is.character, toupper)
#> $year
#> [1] 2026
#>
#> $city
#> [1] "BOSTON"
#>
#> $count
#> [1] 7
#>
#> $label
#> [1] "ACTIVE"
```

The `.else` argument lets you transform both groups in one call. Numeric elements go through `.f`, everything else goes through `.else`.

```r title="Transform both groups with .else"
records <- list(10, "ok", 25, "fail", 8)

modify_if(records, is.numeric, ~ .x * 10, .else = ~ toupper(.x))
#> [[1]]
#> [1] 100
#>
#> [[2]]
#> [1] "OK"
#>
#> [[3]]
#> [1] 250
#>
#> [[4]]
#> [1] "FAIL"
#>
#> [[5]]
#> [1] 80
```

Finally, `.p` can be a logical vector the same length as `.x`. This is handy when the decision comes from outside the data.

```r title="Select elements with a logical vector"
quarters <- list(q1 = 100, q2 = 200, q3 = 300, q4 = 400)
adjust   <- c(TRUE, FALSE, FALSE, TRUE)

modify_if(quarters, adjust, ~ .x + 50)
#> $q1
#> [1] 150
#>
#> $q2
#> [1] 200
#>
#> $q3
#> [1] 300
#>
#> $q4
#> [1] 450
```

[TIP]
**Pass extra arguments to `.f` through the `...` slot.** `modify_if(df, is.numeric, round, digits = 2)` rounds every numeric column to two decimals without writing a formula.

## modify_if() vs map_if() vs modify()

**All three apply a function across elements, but they differ in what they select and what they return.** The table makes the choice quick.

| Function | Selects | Returns | Has `.else`? |
|---|---|---|---|
| `modify_if()` | elements passing `.p` | same type as `.x` | Yes |
| `map_if()` | elements passing `.p` | always a list | Yes |
| `modify()` | every element | same type as `.x` | No |

The decision rule: use `modify_if()` when you want the input type preserved, such as keeping a data frame a data frame. Use `map_if()` when you want a list back no matter what. Use `modify()` when there is no condition and every element should change.

[NOTE]
**Coming from Python pandas?** The closest equivalent is `df.select_dtypes(include='number')` combined with an assignment back into the frame. `modify_if()` does the select-and-assign in one expression.

## Common pitfalls

**`modify_if()` has a few sharp edges that produce confusing errors.** Knowing them saves debugging time.

The predicate `.p` must return a single `TRUE` or `FALSE` for each element. If your formula is vectorized over values inside an element, it returns several logicals and the call fails.

```r title="Predicate must return one TRUE or FALSE"
groups <- list(a = c(1, 5), b = c(8, 2))

# Errors: ~ .x > 4 yields a length-2 logical for each element
modify_if(groups, ~ .x > 4, ~ .x * 10)
#> Error: Result 1 must be a single logical, not a logical vector of length 2
```

The fix is a predicate that collapses to one value, such as `~ any(.x > 4)` or `~ mean(.x) > 4`.

Two more traps to watch:

- **`modify_if()` does not filter.** Elements that fail `.p` are kept untouched, not removed. Use `keep()` or `discard()` when you actually want to drop elements.
- **The return type follows the input.** Passing a data frame returns a data frame, not a list. If downstream code expects a list, convert with `as.list()` or switch to `map_if()`.

[WARNING]
**A predicate that returns `NA` is treated as failing.** If `.p` can produce `NA`, those elements silently skip `.f`. Guard the predicate so it always returns a clean `TRUE` or `FALSE`.

## Try it yourself

**Try it:** Use `modify_if()` on the built-in `iris` data frame to multiply only its numeric columns by 10, leaving the `Species` column unchanged. Save the result to `ex_iris`.

```r title="Your turn: scale numeric columns"
# Try it: transform only the numeric columns of iris
ex_iris <- # your code here

head(ex_iris, 3)
#> Expected: numeric columns 10x larger, Species unchanged
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_iris <- modify_if(iris, is.numeric, ~ .x * 10)
head(ex_iris, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1           51          35           14           2  setosa
#> 2           49          30           14           2  setosa
#> 3           47          32           13           2  setosa
```

**Explanation:** `is.numeric` selects the four measurement columns, the formula `~ .x * 10` scales them, and the character `Species` column fails the predicate so it is copied through unchanged.

</details>

## Related purrr functions

**`modify_if()` belongs to a family of element-wise transformers.** These related functions cover the adjacent tasks:

- `modify()` applies a function to every element with no condition.
- `modify_at()` selects elements by name or position instead of a test.
- `map_if()` does the same conditional transform but always returns a list.
- `keep()` and `discard()` filter elements by a predicate rather than transforming them.
- `modify2()` and `imap_modify()` extend the idea to paired inputs and indices.

See the [purrr reference](https://purrr.tidyverse.org/reference/modify.html) for the full modify family.

## FAQ

**What is the difference between modify_if() and map_if() in R?**

Both apply a function only to elements that pass a predicate. The difference is the return type. `modify_if()` returns an object of the same class as its input, so a data frame stays a data frame. `map_if()` always returns a list, even when you pass a data frame or an atomic vector. Choose `modify_if()` to preserve structure and `map_if()` when a list is what you want next.

**Does modify_if() change the original object?**

No. `modify_if()` returns a new object and leaves the input untouched, following R's copy-on-modify behavior. You must assign the result to a name, such as `df <- modify_if(df, is.numeric, round)`, to keep the transformed version. Forgetting the assignment is a common reason the change appears to vanish.

**Can modify_if() work on data frames?**

Yes. A data frame is a list of columns, so `modify_if()` treats each column as an element. A predicate like `is.numeric` selects columns by type, and `.f` transforms them. The result is still a data frame because `modify_if()` preserves the input class. This makes it a clean way to scale or round numeric columns while leaving character columns alone.

**What does the .else argument do in modify_if()?**

The `.else` argument supplies a second function for elements that fail the predicate. Without it, failing elements are copied through unchanged. With it, `modify_if()` becomes a two-way switch: `.f` runs on the `TRUE` elements and `.else` runs on the `FALSE` elements. It is the equivalent of an `if-else` applied across a whole list in one expression.

**Is modify_if() a stable purrr function?**

Yes. `modify_if()` is part of purrr's stable modify family and is safe to use in production code. It has been available since early purrr releases and its interface has not changed. The function is documented alongside `modify()` and `modify_at()` in the official purrr reference.
