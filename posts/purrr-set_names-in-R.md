---
title: "purrr set_names() in R: Name Vector and List Elements"
slug: purrr-set_names-in-R
description: "Learn purrr set_names() in R to name vector, list, and data frame elements. Covers the syntax, self-naming, name transformations, and common length pitfalls."
keywords: "purrr set_names, set_names function R, purrr set_names examples, R set_names vector, name list elements R, rename vector elements R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "set_names()|purrr set_names|purrr::set_names()|set_names|rlang set_names"
auto_link_case_sensitive: true
target_keyword: "purrr set_names"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr set_names() in R: Name Vector and List Elements

<p class="lead">purrr set_names() assigns names to the elements of a vector, list, or data frame and returns the object, so it slots cleanly into a pipeline. It can take an explicit name vector, reuse the values as their own names, or transform existing names with a function.</p>

[QUICK ANSWER]
set_names(x, c("a", "b", "c"))     # name from a vector
set_names(x)                       # self-name: values become names
set_names(x, toupper)              # transform existing names
set_names(x, ~ paste0("v", .x))    # transform with a formula
set_names(x, "a", "b", "c")        # name from separate arguments
set_names(df, c("height", "wt"))   # rename data frame columns
set_names(x, NULL)                 # strip all names

[DECISION TREE: Is set_names() the right tool?]
- name a vector or list inside a pipe: set_names(x, nm)
- name elements from their own values: set_names(x)
- rename data frame columns by old name: rename(df, new = old)
- clean messy column names in bulk: clean_names(df)
- bind a list to rows keeping the id: list_rbind(x, names_to = "id")
- extract one named element: pluck(x, "key")

## What set_names does

**The set_names function is a pipe-friendly way to attach names.** Base R already lets you set names with `names(x) <- value`, but that statement does not return the object, so it cannot sit in the middle of a pipeline. set_names takes the object, applies the names, and hands the object back, which keeps a chain of transformations unbroken.

It accepts the names in three forms. You can pass an explicit character vector, you can pass nothing and let the values of the object become their own names, or you can pass a function that rewrites the names already in place. That flexibility is why the tidyverse leans on set_names instead of the base assignment form.

[KEY INSIGHT]
**Naming is a step in the data flow, not a side statement.** Because set_names returns its input, you can name a vector, map over it, and bind the result without ever breaking the pipe or creating a throwaway variable.

## set_names syntax

**The signature is set_names(x, nm = x, ...).** You pass the object to name, then the names themselves, supplied either as the `nm` argument or as several arguments spread across the dots.

| Argument | Description |
|----------|-------------|
| `x` | The vector, list, or data frame to name |
| `nm` | A character vector of names, or a function applied to current names. Defaults to `x` itself |
| `...` | Extra name pieces; all arguments are concatenated into one name vector |

The length of `nm` must match the length of `x`. When `nm` is a function or a formula, set_names calls it on the current names and uses the result. Passing `NULL` removes every name.

```r title="Load purrr and name a vector"
library(purrr)

scores <- c(88, 72, 95)
set_names(scores, c("math", "reading", "science"))
#>    math reading science 
#>      88      72      95
```

## Name elements from their own values

**Calling set_names with no name argument turns the values into names.** This is the single most common use in tidyverse code. When you map over a character vector, the output list is unnamed unless the input was named, so self-naming the input first carries labels through to the result.

```r title="Self-name a character vector"
parts <- c("engine", "wheels", "frame")
set_names(parts)
#>   engine   wheels    frame 
#> "engine" "wheels"  "frame"
```

Chained before a map call, self-naming produces a list whose element names match the original strings. Those names then survive into data frames, plots, and the `.id` column of binding functions.

```r title="Named output from a map loop"
c("a", "b", "c") |>
  set_names() |>
  map(toupper)
#> $a
#> [1] "A"
#> 
#> $b
#> [1] "B"
#> 
#> $c
#> [1] "C"
```

[TIP]
**Self-name inputs before mapping over files or groups.** Running `list.files() |> set_names() |> map(read.csv)` gives a list keyed by file name, so `list_rbind(.id = "file")` can record which row came from which source.

## Transform names with a function or formula

**Pass a function as nm to rewrite the names already on the object.** set_names calls that function on the current name vector and uses whatever it returns. A formula with `.x` works as a compact anonymous function, the same shorthand purrr uses elsewhere.

```r title="Transform existing names"
v <- c(a = 1, b = 2, c = 3)
set_names(v, toupper)
#> A B C 
#> 1 2 3

set_names(v, ~ paste0("col_", .x))
#> col_a col_b col_c 
#>     1     2     3
```

This keeps a renaming rule in one place instead of typing out a full name vector. It is handy for adding a shared prefix, fixing capitalization, or stripping a suffix from many names at once.

## Rename data frame columns and use the dots

**A data frame is a list of columns, so set_names renames its columns.** Pass a character vector the same length as the number of columns and each column receives the matching name in order.

```r title="Rename data frame columns"
df <- data.frame(x = 1:2, y = 3:4)
set_names(df, c("height", "weight"))
#>   height weight
#> 1      1      3
#> 2      2      4
```

When names arrive as several pieces, you do not need to wrap them in `c()` yourself. Every argument after `x` is concatenated, so the dots accept loose strings or several short vectors.

```r title="Build names from separate arguments"
set_names(1:3, "a", "b", "c")
#> a b c 
#> 1 2 3
```

[NOTE]
**Coming from base R?** `set_names()` is the tidyverse counterpart of `setNames()`. The base function recycles or silently mismatches a wrong-length name vector, while set_names is strict and errors, which catches bugs earlier.

## set_names vs setNames and the names assignment

**Choose the naming tool that matches where the code lives.** All three approaches attach names, but they differ on pipe support, strictness, and the ability to transform.

| Tool | Returns object? | Wrong length | Accepts a function |
|------|-----------------|--------------|--------------------|
| `set_names(x, nm)` | Yes | Errors | Yes |
| `setNames(x, nm)` | Yes | Recycles or mismatches | No |
| `names(x) <- nm` | No | Errors | No |

The rule is short. Inside a pipeline, use set_names, since it returns the object and fails loudly on a length error. For a quick one-off outside a pipe, the base assignment form is fine. Reach for setNames only in base-only code where you cannot add a tidyverse dependency.

## Common pitfalls

**The name vector must match the length of the object.** set_names does not recycle a short name vector the way `setNames()` sometimes does. A mismatch stops with an error, which is the safer behavior but surprises people moving over from base R.

```r title="Length mismatch raises an error"
set_names(1:3, c("a", "b"))
#> Error in `set_names()`:
#> ! The size of `nm` (2) must be compatible with the size of `x` (3).
```

**Self-naming a numeric vector gives numeric strings as names.** `set_names(1:3)` produces names `"1"`, `"2"`, `"3"`, which is rarely what you want. Self-naming is meant for character vectors whose values are already meaningful labels.

**To strip names, pass NULL explicitly.** Because `nm` defaults to `x`, calling `set_names(x)` self-names rather than clears. Use `set_names(x, NULL)` to remove every name.

```r title="Strip all names with NULL"
named <- c(a = 1, b = 2)
set_names(named, NULL)
#> [1] 1 2
```

## Try it yourself

**Try it:** Name the vector `1:4` with the labels q1 through q4. Save the result to `ex_named`.

```r title="Your turn: name a vector"
# Try it: name 1:4 as q1..q4
ex_named <- # your code here

ex_named
#> Expected: names q1 q2 q3 q4 over values 1 2 3 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_named <- set_names(1:4, paste0("q", 1:4))
ex_named
#> q1 q2 q3 q4 
#>  1  2  3  4
```

**Explanation:** `paste0("q", 1:4)` builds the character vector `c("q1", "q2", "q3", "q4")`, and set_names attaches it because its length matches the four values being named.

</details>

## Related purrr functions

These functions work well alongside set_names when you handle named data:

- The map function preserves input names, so a self-named vector yields a named output list.
- The imap function iterates over values and their names together, which pairs with names you just set.
- The pluck function extracts a single element by the names set_names assigned.
- The list_rbind function turns a named list into rows and records the names in an id column.

See the [purrr reference](https://purrr.tidyverse.org/reference/set_names.html) for the full argument specification.

## FAQ

**What is the difference between set_names and setNames?**
Both attach names and return the object, but set_names comes from the tidyverse and setNames is base R. The key difference is strictness: set_names errors when the name vector length does not match the object, while setNames may recycle or produce a silent mismatch. set_names also accepts a function or formula to transform existing names, which setNames cannot do. In pipelines, prefer set_names for its clearer failures.

**How do I name list elements with set_names?**
Pass the list as the first argument and a character vector of names as the second, with one name per element. If the list already holds character values that make good labels, call `set_names()` with no second argument so the values become the names. This self-naming form is common right before a map call, because map carries the names through to its output list.

**Can set_names rename data frame columns?**
Yes. A data frame is internally a list of columns, so set_names treats the column vector as the thing to name. Supply a character vector the same length as the number of columns and each column is renamed in order. For renaming specific columns by their old name rather than position, the dplyr rename function is usually a better fit.

**Why does set_names give an error about size?**
That error means the name vector you passed has a different length than the object. set_names requires exactly one name per element and does not recycle a shorter vector. Count the elements, count the names, and make them equal. If you only meant to relabel some names, pass a function instead, since a function rewrites whatever names already exist without changing their count.
