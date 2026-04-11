---
title: "purrr map() in R: Every Variant Explained With the Mental Model That Makes Them Click"
slug: "purrr-map-Variants"
description: "Master every purrr map() variant — map, map2, pmap, imap, map_chr, map_dbl, map_dfr — with one mental model that makes the whole family make sense."
keywords: "purrr map, map variants R, map2 pmap imap, map_chr map_dbl, purrr tutorial, R functional programming"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.2.2"
post_type: "C"
auto_link_terms: "purrr map|map variants|map_chr|map_dbl|map2|pmap|imap"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "purrr map() Variants"
sidebar_order: 34
---

# purrr map() in R: Every Variant Explained With the Mental Model That Makes Them Click

<p class="lead">The purrr <code>map()</code> family walks over a collection and applies a function to every element. Each variant changes only two things: what shape the <em>output</em> takes, and how many <em>inputs</em> you iterate in parallel.</p>

Once you see that every `map_*()` name is just a two-axis grid — "what type of thing do I want back?" crossed with "how many things am I iterating over?" — the whole package collapses into something you can recall without Googling. This tutorial teaches that grid, then walks through every variant with a runnable example.

## How Does purrr's map() Improve on sapply()?

`purrr::map()` is purrr's version of `lapply()` — it takes a list or vector, applies a function to each element, and returns a *list*. Why use it over base R's version? Two reasons: **typed output variants** and **consistent behaviour across edge cases**. `sapply()` might return a vector on your test data and a list on your production data. `map_dbl()` either returns a numeric vector or errors — no silent surprises.

Here is the warm-up: apply `sqrt` to a list of numbers three different ways and see what each one returns.

```r
library(purrr)

nums <- list(a = 4, b = 16, c = 25)

map(nums, sqrt)
#> $a
#> [1] 2
#>
#> $b
#> [1] 4
#>
#> $c
#> [1] 5

map_dbl(nums, sqrt)
#>  a  b  c
#>  2  4  5

map_chr(nums, \(x) paste0("sqrt = ", sqrt(x)))
#>          a          b          c
#> "sqrt = 2" "sqrt = 4" "sqrt = 5"
```

Same iteration, three different output shapes: a list, a double vector, a character vector. The suffix after the underscore tells you what comes out. That single rule covers every `map_*()` variant — and it is already half of what you need to know about purrr.

[KEY INSIGHT]
**map_*() is a type contract, not a shortcut.** When you write `map_dbl`, you are promising the function returns a length-1 numeric. If it ever returns something else — even once — purrr errors immediately with a clear message. `sapply` would have limped along and returned a list.

## What Do the Typed Suffixes (map_dbl, map_chr, map_lgl) Mean?

The most common suffixes match R's atomic vector types. Each one expects the function to return exactly one value of that type per element.

| Suffix      | Returns         | Use when                                   |
|-------------|-----------------|--------------------------------------------|
| `map()`     | List            | The function returns arbitrary objects.   |
| `map_dbl()` | Numeric vector  | Function returns one number per element.  |
| `map_int()` | Integer vector  | Function returns one integer per element. |
| `map_chr()` | Character vector| Function returns one string per element.  |
| `map_lgl()` | Logical vector  | Function returns one TRUE/FALSE.          |
| `map_dfr()` | Row-bound data frame | Function returns a data frame per element. |
| `map_dfc()` | Column-bound data frame | Function returns a data frame per element. |

```r
library(purrr)

words <- list("apple", "banana", "cherry")

map_int(words, nchar)
#> [1] 5 6 6

map_lgl(words, \(w) startsWith(w, "c"))
#> [1] FALSE FALSE  TRUE

map_chr(words, toupper)
#> [1] "APPLE"  "BANANA" "CHERRY"
```

Pick the suffix that matches what your function actually returns. If you are unsure, start with plain `map()` — it always works because a list can hold anything — and switch to a typed variant once you trust the shape.

**Try it:** Use `map_int()` to return the number of characters in each string of `c("one", "three", "five")`.

```r
library(purrr)
# your code here
#> Expected: 3 5 4
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
map_int(c("one", "three", "five"), nchar)
#> [1] 3 5 4
```

**Explanation:** `nchar` returns one integer per string; `map_int` stacks them into an integer vector.

</details>

## When Do You Need map2() and pmap()?

Single-input `map()` covers "do X to each element". When your function needs *two* inputs walked in parallel, you need `map2()`. For three or more parallel inputs, use `pmap()`.

```r
library(purrr)

names  <- c("Ada", "Ben", "Cid")
scores <- c(92, 85, 78)

map2_chr(names, scores, \(n, s) paste0(n, ": ", s))
#> [1] "Ada: 92" "Ben: 85" "Cid: 78"
```

`map2()` walks position by position: first element of `names` with first element of `scores`, then second with second, and so on. The typed suffix (`_chr`, `_dbl`) works the same way as for `map()`.

For three or more inputs, wrap them in a list and use `pmap()`. The function argument receives one element from each list on every call.

```r
library(purrr)

products <- list(
  name  = c("Pen", "Pad", "Cap"),
  qty   = c(10, 5, 2),
  price = c(1.50, 3.00, 12.00)
)

pmap_dbl(products, \(name, qty, price) qty * price)
#> [1] 15 15 24
```

Because the argument names in the anonymous function match the list names, purrr binds them automatically. You can have as many parallel inputs as you like with `pmap()` — it is the most general form.

[TIP]
**Think "parallel iteration" not "multiple arguments".** `map2` and `pmap` iterate in lockstep — position 1 of every input, then position 2, and so on. They do not compute a cartesian product. For every combination, use `expand.grid()` first and then `pmap()`.

## What Does imap() Give You That map() Does Not?

`imap()` is `map()` with access to the *index or name* of each element. The function you pass takes two arguments: the value, and the name or position.

```r
library(purrr)

stats <- list(mean = 5.5, sd = 1.2, n = 100)

imap_chr(stats, \(value, name) paste0(name, " = ", value))
#> [1] "mean = 5.5" "sd = 1.2"   "n = 100"
```

When the input is named, `imap` passes the name as the second argument. When the input is unnamed, it passes the integer position. Use it whenever you want to label or number each element of your output.

**Try it:** Given `list(a = 10, b = 20, c = 30)`, use `imap_chr` to produce `"a → 10"`, `"b → 20"`, `"c → 30"`.

```r
library(purrr)
ex_lst <- list(a = 10, b = 20, c = 30)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
imap_chr(ex_lst, \(v, n) paste0(n, " → ", v))
#>           a           b           c
#> "a → 10" "b → 20" "c → 30"
```

**Explanation:** `imap_chr` passes each value as `v` and each name as `n`; `paste0` glues them into a labelled string.

</details>

## How Do You Build a Data Frame From a Map?

`map_dfr()` row-binds the per-element data frames into one tall result. `map_dfc()` column-binds them into one wide result. Pair them with `imap_dfr()` if you need the element name as a column.

```r
library(purrr)

groups <- list(a = 1:3, b = 4:6, c = 7:9)

imap_dfr(groups, \(vals, name) {
  data.frame(group = name, value = vals)
})
#>   group value
#> 1     a     1
#> 2     a     2
#> 3     a     3
#> 4     b     4
#> 5     b     5
#> 6     b     6
#> 7     c     7
#> 8     c     8
#> 9     c     9
```

The anonymous function returns a small data frame per element; `imap_dfr()` stacks them vertically and tags each row with its source name. This pattern is how you turn a "list of things" into a tidy long-format table in one call.

**Try it:** Use `map_dfr` to turn `list(x = 1:2, y = 3:4)` into a long data frame with columns `name` and `value`.

```r
library(purrr)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
imap_dfr(list(x = 1:2, y = 3:4), \(v, n) data.frame(name = n, value = v))
#>   name value
#> 1    x     1
#> 2    x     2
#> 3    y     3
#> 4    y     4
```

**Explanation:** Each list element becomes a two-column data frame; `imap_dfr` binds them by rows.

</details>

## Practice Exercises

### Exercise 1: Typed Map Over a List of Samples

Given a list of three numeric vectors, return a double vector of their means using `map_dbl`.

```r
library(purrr)
samples <- list(a = c(1, 2, 3), b = c(10, 20, 30), c = c(5, 5, 5))
# your code here
#> Expected: 2 20 5
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
samples <- list(a = c(1, 2, 3), b = c(10, 20, 30), c = c(5, 5, 5))
map_dbl(samples, mean)
#>  a  b  c
#>  2 20  5
```

**Explanation:** `mean` returns one double per vector; `map_dbl` stacks them into a typed numeric vector.

</details>

### Exercise 2: Combine map2 and pmap in One Pipeline

Build a data frame with columns `item`, `qty`, `price`, and `total` from three parallel vectors.

```r
library(purrr)
item  <- c("Pen", "Pad", "Cap")
qty   <- c(10, 5, 2)
price <- c(1.5, 3, 12)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
item  <- c("Pen", "Pad", "Cap")
qty   <- c(10, 5, 2)
price <- c(1.5, 3, 12)

my_df <- data.frame(
  item  = item,
  qty   = qty,
  price = price,
  total = pmap_dbl(list(qty, price), `*`)
)
my_df
#>   item qty price total
#> 1  Pen  10   1.5  15.0
#> 2  Pad   5   3.0  15.0
#> 3  Cap   2  12.0  24.0
```

**Explanation:** `pmap_dbl(list(qty, price), `*`)` multiplies position by position — exactly what you want for a line total.

</details>

## Summary

| Variant    | Walks over   | Returns                  |
|------------|-------------|--------------------------|
| `map`      | 1 input      | List                     |
| `map_dbl`  | 1 input      | Double vector            |
| `map_int`  | 1 input      | Integer vector           |
| `map_chr`  | 1 input      | Character vector         |
| `map_lgl`  | 1 input      | Logical vector           |
| `map2`     | 2 inputs     | List                     |
| `map2_*`   | 2 inputs     | Typed vector             |
| `pmap`     | N inputs     | List                     |
| `imap`     | 1 input + index | List                  |
| `map_dfr`  | 1 input      | Row-bound data frame    |
| `map_dfc`  | 1 input      | Column-bound data frame |

The rule that ties them together: **suffix = output type, prefix count = parallel inputs**.

## References

1. `purrr` package documentation. [Link](https://purrr.tidyverse.org/)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
3. Wickham, H. & Grolemund, G. — *R for Data Science*, Chapter 26: Iteration. [Link](https://r4ds.hadley.nz/iteration.html)
4. `purrr` cheatsheet. [Link](https://github.com/rstudio/cheatsheets/blob/main/purrr.pdf)
5. Jennifer Bryan — *Row-oriented workflows in R*. [Link](https://github.com/jennybc/row-oriented-workflows)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the broader mindset purrr sits inside.
- [R Anonymous Functions](R-Anonymous-Functions.html) — the `\(x)` shorthand that makes purrr pipelines short.
- [furrr Package in R](furrr-Package-in-R.html) — parallel purrr with the same API.
