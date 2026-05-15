---
title: "purrr modify() in R: Transform Elements, Keep the Type"
slug: "purrr-modify-in-R"
description: "Use purrr modify() to transform every element of a list, vector, or data frame in R while keeping the same type. Covers modify_if, modify_at, modify2, examples."
keywords: "purrr modify, modify function R, purrr modify examples, R modify list, modify vs map purrr, modify_if R, modify_at R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr modify|modify()|modify_if()|modify_at()|modify2()"
auto_link_case_sensitive: true
target_keyword: "purrr modify"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr modify() in R: Transform Elements, Keep the Type

<p class="lead">The <code>modify()</code> function in purrr applies a function to each element of a list, vector, or data frame and returns the result with the <em>same type</em> as the input. That type-preservation is the one thing that separates it from <code>map()</code>.</p>

[QUICK ANSWER]
modify(df, ~ .x * 2)                  # each column, returns a data frame
modify(list(a = 1, b = 2), ~ .x + 1)  # each element, returns a list
modify_if(df, is.numeric, round)      # only the numeric columns
modify_at(df, "x", ~ .x * 100)        # only the named columns
modify_at(df, c(1, 3), sqrt)          # columns picked by position
modify2(x, y, `+`)                    # two inputs, type preserved
imodify(df, ~ paste(.y, .x))          # element plus its name or index
modify_depth(nested, 2, ~ .x + 1)     # modify at a nesting depth

[DECISION TREE: Is modify() the right tool?]
- transform elements, keep input type: modify()
- transform elements, always get a list: map()
- transform only elements that pass a test: modify_if()
- transform elements at known names or positions: modify_at()
- replace, add or remove list items by name: list_modify()
- transform two lists in parallel: modify2()
- run for side effects only, no return: walk()

## What modify() does in one sentence

**`modify(.x, .f)` runs `.f` on every element of `.x` and gives you back an object of the same class as `.x`.** Feed it a data frame, you get a data frame. Feed it an integer vector, you get an integer vector.

This is the whole reason `modify()` exists. `map()` is the workhorse of purrr, but it always flattens its result into a plain list. When you want the structure you started with, `modify()` is the type-stable choice.

[KEY INSIGHT]
**`modify()` is `map()` plus a promise: "the shape goes out the way it came in".** Mentally, read `modify(x, f)` as "apply `f` element-wise, then put the answers back into a copy of `x`". That copy-back step is what preserves the data frame, the named list, or the atomic vector.

## Syntax

**`modify(.x, .f, ...)` takes the object to transform and a function (or `~` lambda) to apply to each element.** Extra arguments after `.f` are passed straight through to it.

The same `.x`-then-`.f` signature is shared by every member of the family: `modify_if()`, `modify_at()`, `modify2()`, `imodify()`, and `modify_depth()`. Learn one and the rest follow.

```r title="modify keeps the input type"
library(purrr)

modify(c(1, 2, 3), ~ .x * 10)
#> [1] 10 20 30

modify(list(a = 1, b = 2), ~ .x * 10)
#> $a
#> [1] 10
#>
#> $b
#> [1] 20
```

The first call returns a numeric vector; the second returns a named list. Same function, same lambda, two different output types, each matching its input.

## Five common patterns

### 1. Transform every column of a data frame

A data frame is a list of columns, so `modify()` walks it column by column and rebuilds the data frame.

```r title="Modify every column of a data frame"
df <- data.frame(x = c(1, 2, 3), y = c(10, 20, 30))

modify(df, ~ .x / sum(.x))
#>           x         y
#> 1 0.1666667 0.1666667
#> 2 0.3333333 0.3333333
#> 3 0.5000000 0.5000000
```

`map(df, ...)` would have returned a bare list of two vectors. `modify()` keeps the `data.frame` class and the row names.

### 2. Touch only the numeric columns with modify_if

`modify_if(.x, .p, .f)` applies `.f` only to elements where the predicate `.p` returns `TRUE`. Everything else is left untouched.

```r title="modify_if transforms only matching elements"
modify_if(iris[1:3, ], is.numeric, ~ round(.x))
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1            5           4            1           0  setosa
#> 2            5           3            1           0  setosa
#> 3            5           3            1           0  setosa
```

The four numeric columns are rounded; the `Species` factor passes the `is.numeric` test as `FALSE` and survives unchanged.

### 3. Target columns by name with modify_at

When you know exactly which elements to change, `modify_at()` accepts a character vector of names or an integer vector of positions.

```r title="modify_at targets columns by name"
modify_at(iris[1:3, ], c("Sepal.Length", "Petal.Length"), ~ .x * 10)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1           51         3.5           14         0.2  setosa
#> 2           49         3.0           14         0.2  setosa
#> 3           47         3.2           13         0.2  setosa
```

Only the two named columns are scaled. The other three are copied across verbatim.

### 4. Walk two inputs in parallel with modify2

`modify2(.x, .y, .f)` is to `modify()` what `map2()` is to `map()`: it steps through two objects together, exposing `.x` and `.y` inside the lambda.

```r title="modify2 walks two inputs in parallel"
prices    <- c(100, 200, 300)
discounts <- c(0.1, 0.2, 0.5)

modify2(prices, discounts, ~ .x * (1 - .y))
#> [1]  90 160 150
```

The result is a numeric vector because `prices` (the `.x` argument) was a numeric vector. `modify2()` always copies its answer back into the type of `.x`.

### 5. Use the element name with imodify

`imodify()` is the indexed variant. Inside the lambda, `.x` is the value and `.y` is the name (or the integer position when the input is unnamed).

```r title="imodify exposes each element name"
scores <- list(alice = 8, bob = 6, carol = 9)

imodify(scores, ~ paste0(.y, ": ", .x))
#> $alice
#> [1] "alice: 8"
#>
#> $bob
#> [1] "bob: 6"
#>
#> $carol
#> [1] "carol: 9"
```

You get a named list back, exactly the structure of `scores`, with each value rewritten using its own name.

[TIP]
**For column-wise data frame work, `modify()` beats `lapply()` and a manual `as.data.frame()` rebuild.** It does the transform and the type restoration in one call, so you never lose column names, row names, or the `data.frame` class along the way.

## modify() vs map() vs lapply()

**All three apply a function element-wise; they differ in what type they hand back.** That difference decides which one belongs in your pipeline.

| Function | Returns | Type-preserving? |
|---|---|---|
| `purrr::modify()` | Same class as `.x` | Yes |
| `purrr::map()` | Always a plain list | No |
| `base::lapply()` | Always a plain list | No |
| `base::sapply()` | Simplified, varies by input | Inconsistent |

The decision rule is short. Reach for `modify()` when you want the input structure preserved, especially data frames. Reach for `map()` or its typed cousins (`map_dbl()`, `map_chr()`) when a list or a specific atomic vector is the goal. Avoid `sapply()` in production code because its return type is unpredictable.

## Common pitfalls

**Pitfall 1: modify() does not change the original in place.** R uses copy-on-modify, so `modify(x, ~ .x + 1)` builds and returns a new object while `x` itself is untouched. The name "modify" describes the type-preserving behaviour, not mutation. You must reassign with `x <- modify(x, ...)` to keep the result.

**Pitfall 2: returning a new type silently coerces atomic vectors.** When `.x` is an atomic vector, `modify()` writes each answer back with `[[<-`. If your `.f` returns a different type, the whole vector is coerced. `modify(c(1, 2, 3), ~ as.character(.x))` quietly returns a character vector, so the type-preservation promise can break under you.

**Pitfall 3: modify() on a data frame is column-wise, never row-wise.** Each "element" of a data frame is a full column. If you expected the function to see one row at a time, you will get the wrong answer. For row-wise work, use `dplyr::rowwise()` or `purrr::pmap()` instead.

[WARNING]
**`.f` must return a value the container can hold.** For a list, anything goes. For an atomic vector, `.f` should return a length-1 value of a compatible type per element, or you trigger coercion (Pitfall 2) or a length error. When in doubt, transform into a list first.

## Try it yourself

**Try it:** Use `modify_if()` to double only the numeric columns of `df_mix`, leaving the character `name` column alone. Save the result to `ex_modified`.

```r title="Your turn: modify only numeric columns"
df_mix <- data.frame(
  name   = c("a", "b", "c"),
  score  = c(1, 2, 3),
  weight = c(10, 20, 30),
  stringsAsFactors = FALSE
)

ex_modified <- # your code here

ex_modified
#> Expected: score and weight doubled, name unchanged
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_modified <- modify_if(df_mix, is.numeric, ~ .x * 2)
ex_modified
#>   name score weight
#> 1    a     2     20
#> 2    b     4     40
#> 3    c     6     60
```

**Explanation:** `modify_if()` runs `is.numeric()` on each column and applies the lambda only where it returns `TRUE`. The `name` column fails the test and is copied through unchanged, while the data frame class is preserved.

</details>

## Related purrr functions

Once `modify()` clicks, the neighbouring functions extend it:

- `map()`: the same element-wise idea, but it always returns a plain list.
- `modify_if()` and `modify_at()`: conditional and positional variants of `modify()`.
- `modify_depth()`: reaches into nested lists and modifies elements at a chosen depth.
- `list_modify()`: a different operation entirely, it replaces, adds, or removes list items by name.
- `map2()` and `imap()`: the list-returning cousins of `modify2()` and `imodify()`.

The official reference for the whole family lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/modify.html).

## FAQ

**What is the difference between map() and modify() in purrr?**

`map()` always returns a plain list, no matter what you pass in. `modify()` returns an object of the same class as its input: a data frame stays a data frame, an atomic vector stays an atomic vector. Both apply the function element-wise in exactly the same way. Choose `modify()` when preserving the input structure matters, and `map()` when a list is what you actually want.

**Does purrr modify() change the original object?**

No. R follows copy-on-modify semantics, so `modify()` builds a new object and returns it while the original is left untouched. Despite the name, it does not mutate anything in place. To keep the transformed result, assign it back, for example `x <- modify(x, ~ .x + 1)`.

**How do I modify only some columns of a data frame in R?**

Use `modify_if()` with a predicate when the columns are defined by a test, such as `modify_if(df, is.numeric, round)`. Use `modify_at()` when you know the exact column names or positions, such as `modify_at(df, c("x", "y"), sqrt)`. Both leave the remaining columns and the data frame class intact.

**What does modify_at() do in purrr?**

`modify_at(.x, .at, .f)` applies `.f` only to the elements named or positioned in `.at`, and copies every other element across unchanged. It is the targeted version of `modify()`: instead of transforming everything, you pick the exact slots. The return type still matches the input, so a data frame in gives a data frame out.
