---
title: "purrr modify_at() in R: Transform Elements by Name"
slug: "purrr-modify_at-in-R"
description: "Use purrr modify_at() in R to transform only the list elements or data frame columns you select by name or position, leaving the rest unchanged. With examples."
keywords: "purrr modify_at, modify_at function R, purrr modify_at examples, R modify columns by name, modify_at vs modify_if, modify_at R, modify column purrr"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr modify_at|modify_at()|purrr::modify_at()|modify_at function|modify_at in R"
auto_link_case_sensitive: true
target_keyword: "purrr modify_at"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr modify_at() in R: Transform Elements by Name

<p class="lead">The purrr <code>modify_at()</code> function transforms only the list elements or data frame columns you select by name or position, and leaves every other element copied across unchanged.</p>

[QUICK ANSWER]
modify_at(df, "x", ~ .x * 10)            # one column by name
modify_at(df, c("x", "y"), round)        # several columns by name
modify_at(df, c(1, 3), sqrt)             # columns by position
modify_at(lst, "a", toupper)             # one list element by name
modify_at(lst, 2, ~ .x + 1)              # list element by position
modify_at(lst, c("a", "c"), `+`, 5)      # pass an extra argument to .f

[DECISION TREE: Is modify_at() the right tool?]
- transform named or positioned elements: modify_at(df, "x", f)
- transform elements that pass a test: modify_if(df, is.numeric, f)
- transform every element: modify(df, f)
- get a list back, not the input type: map_at(df, "x", f)
- replace or add list items by name: list_modify(lst, x = 1)
- pull out a single nested element: pluck(lst, "a", "b")

## What modify_at() does in one sentence

**`modify_at(.x, .at, .f)` runs `.f` only on the elements named or positioned in `.at`, then returns an object of the same class as `.x`.** Every element you did not select is copied through untouched.

Think of it as a targeted version of `modify()`. Where `modify()` transforms everything, `modify_at()` lets you point at the exact slots that should change. The selection happens through the `.at` argument, and that argument is the whole story of this function.

[KEY INSIGHT]
**`modify_at()` answers "change these specific elements" while `modify_if()` answers "change whatever passes this test".** Use `modify_at()` when you already know the names or positions. Use `modify_if()` when the elements to change are defined by a property of their values.

## Syntax

**`modify_at(.x, .at, .f, ...)` takes the object to transform, a selector, and a function.** Any arguments after `.f` are forwarded straight to it on every call.

The `.at` selector accepts a character vector of names or an integer vector of positions. The return type always matches `.x`: a data frame in gives a data frame out, a named list in gives a named list out.

```r title="modify_at selects one column by name"
library(purrr)

df <- data.frame(x = c(1, 2, 3), y = c(10, 20, 30), z = c(100, 200, 300))

modify_at(df, "x", ~ .x * 100)
#>     x  y   z
#> 1 100 10 100
#> 2 200 20 200
#> 3 300 30 300
```

Only column `x` is scaled by 100. Columns `y` and `z` are returned exactly as they came in, and the result is still a `data.frame`.

## Selecting elements with the .at argument

**The `.at` argument is what separates `modify_at()` from the rest of the `modify()` family.** It supports three practical styles, all shown below.

### Select by column or element name

**Pass a character vector to `.at` to target elements by name.** This is the most common use because names are stable even when column order changes.

```r title="modify_at targets columns by name"
modify_at(df, c("x", "z"), sqrt)
#>          x  y        z
#> 1 1.000000 10 10.00000
#> 2 1.414214 20 14.14214
#> 3 1.732051 30 17.32051
```

Columns `x` and `z` get the square root; `y` is left alone. The order you list names in `.at` does not matter, since each named element is matched independently.

### Select by position

**Pass an integer vector to `.at` to target elements by their index.** Positions are handy for unnamed lists or quick one-off calls.

```r title="modify_at targets columns by position"
modify_at(df, c(1, 3), ~ .x + 1)
#>   x  y   z
#> 1 2 10 101
#> 2 3 20 201
#> 3 4 30 301
```

Positions `1` and `3` (`x` and `z`) are incremented. Position `2` (`y`) is skipped. Mixing names and positions in one call is not allowed, so pick one style per call.

### Work on a named list

**A data frame is a list of columns, so `modify_at()` works the same way on any named list.** Each named element is an independent slot.

```r title="modify_at on a named list"
config <- list(host = "local", port = 8080, debug = 0)

modify_at(config, "host", toupper)
#> $host
#> [1] "LOCAL"
#>
#> $port
#> [1] 8080
#>
#> $debug
#> [1] 0
```

Only `host` is uppercased. `port` and `debug` are returned verbatim, and the result keeps the named-list structure of `config`.

[TIP]
**Forward extra arguments to `.f` by listing them after it.** In `modify_at(df, "x", round, digits = 2)`, the `digits = 2` is handed to `round()` on every selected element, so you avoid wrapping a one-line lambda just to set a single option.

## modify_at() vs modify_if() vs map_at()

**All three apply a function to a subset of elements; they differ in how the subset is chosen and what type comes back.** That decides which one belongs in your pipeline.

| Function | Selects elements by | Returns |
|---|---|---|
| `modify_at()` | name or position | same class as input |
| `modify_if()` | a predicate test on values | same class as input |
| `map_at()` | name or position | always a plain list |
| `modify()` | nothing, transforms all | same class as input |

The rule is short. Use `modify_at()` when you can name the elements. Use `modify_if()` when a test like `is.numeric` defines them. Reach for `map_at()` only when you actually want a plain list back instead of the original structure.

## Common pitfalls

**Pitfall 1: a name that does not exist raises an error.** Calling `modify_at(df, "typo", ~ .x * 2)` stops with an error rather than silently skipping the bad name. Always confirm the names exist, for example with `names(df)`, before selecting them.

**Pitfall 2: modify_at() does not change the original.** R uses copy-on-modify, so `modify_at()` builds and returns a new object while `.x` itself stays untouched. To keep the result you must reassign it with `df <- modify_at(df, ...)`.

**Pitfall 3: modify_at() on a data frame is column-wise, never row-wise.** Each selected "element" is a full column. If you expected `.f` to see one row at a time, the answer will be wrong. For row-wise work use `pmap()` or `dplyr::rowwise()` instead.

[WARNING]
**`.f` should return a value the container can hold.** When `.x` is an atomic vector, returning a different type from `.f` silently coerces the whole vector. For lists this is harmless, but for atomic vectors check that `.f` returns a compatible length-1 value per element.

## Try it yourself

**Try it:** Use `modify_at()` to convert only the `city` column of `df_loc` to uppercase, leaving the `pop` column alone. Save the result to `ex_at`.

```r title="Your turn: uppercase one column"
df_loc <- data.frame(
  city = c("paris", "tokyo", "lima"),
  pop  = c(2, 14, 9),
  stringsAsFactors = FALSE
)

ex_at <- # your code here

ex_at
#> Expected: city uppercased, pop unchanged
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_at <- modify_at(df_loc, "city", toupper)
ex_at
#>    city pop
#> 1 PARIS   2
#> 2 TOKYO  14
#> 3  LIMA   9
```

**Explanation:** `modify_at()` applies `toupper()` only to the element named `"city"`. The `pop` column is not in `.at`, so it is copied across unchanged, and the data frame class is preserved.

</details>

## Related purrr functions

Once `modify_at()` clicks, the neighbouring functions extend it:

- `modify()`: transforms every element instead of a selected subset.
- `modify_if()`: selects elements by a predicate test rather than by name.
- `map_at()`: the same name or position selection, but it always returns a plain list.
- `modify_depth()`: reaches into nested lists and modifies elements at a chosen depth.
- `list_modify()`: replaces, adds, or removes list items by name, a different operation entirely.

The official reference for the whole family lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/modify.html).

## FAQ

**What does modify_at() do in purrr?**

`modify_at(.x, .at, .f)` applies the function `.f` only to the elements you select with `.at`, which is a vector of names or positions. Every element not selected is copied across unchanged. The return value has the same class as the input, so a data frame stays a data frame and a named list stays a named list. It is the targeted member of the `modify()` family.

**What is the difference between modify_at() and modify_if()?**

Both transform a subset of elements and both preserve the input type. They differ in how the subset is chosen. `modify_at()` selects by explicit name or position, so you use it when you already know which columns or elements to change. `modify_if()` selects by a predicate test on the values, such as `is.numeric`, so you use it when a property defines the subset rather than a fixed name.

**How do I modify only some columns of a data frame in R?**

Use `modify_at()` with a character vector of the column names, for example `modify_at(df, c("x", "y"), sqrt)`. You can also pass integer positions like `modify_at(df, c(1, 3), sqrt)`. The unselected columns and the data frame class are kept intact, so the result is ready to use in the next step of your pipeline.

**Does modify_at() change the original data frame?**

No. R follows copy-on-modify semantics, so `modify_at()` returns a new object and leaves the original untouched. Despite the name, it does not mutate anything in place. To keep the transformed result, assign it back, for example `df <- modify_at(df, "x", round)`.
