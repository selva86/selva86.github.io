---
title: "purrr cross2() in R: All Pairs of Two Lists"
slug: purrr-cross2-in-R
description: "purrr cross2() in R builds every pair from two lists, the Cartesian product. Learn its syntax, the .filter argument, examples, and the expand_grid replacement."
keywords: "purrr cross2, cross2 function R, purrr cross2 examples, R cross2 list combinations, cartesian product two lists R, cross two vectors R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "cross2()|purrr cross2|purrr::cross2()|cross two lists|cross2 function"
auto_link_case_sensitive: true
target_keyword: "purrr cross2"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr cross2() in R: All Pairs of Two Lists

<p class="lead">The purrr cross2() function pairs every element of one list with every element of another, returning the Cartesian product as a list of two-element lists. It is the fixed two-input member of the purrr cross family.</p>

[QUICK ANSWER]
cross2(1:3, c("a", "b"))             # all pairs of two vectors
cross2(x, y, .filter = `==`)         # drop pairs where x equals y
length(cross2(1:3, 1:2))             # count = length(x) * length(y)
map(cross2(x, y), \(p) p[[1]])       # pull the first slot of each pair
cross2(x, y) |> map(set_names, nm)   # name the two slots
tidyr::expand_grid(a = x, b = y)     # modern, non-deprecated replacement

[DECISION TREE: Is cross2() the right tool?]
- all pairs of exactly two vectors: cross2(x, y)
- pairs of three or more inputs: cross3(x, y, z)
- want a tidy data frame of pairs: tidyr::expand_grid(a = x, b = y)
- step two equal-length lists together: map2(x, y, f)
- combinations within one list: cross(list(a = x, b = x))
- run a function over each pair: map(cross2(x, y), f)

## What cross2() does in purrr

**The cross2() function pairs every element of one list with every element of another.** You pass it two vectors or lists, and it returns the Cartesian product: one entry for each possible pairing across the two inputs. Cross a vector of length two with a vector of length three and you get six pairs back. The result is a flat list, and each entry is itself a two-element list holding one value from each input.

This two-input case is common enough to deserve its own helper. A grid search over learning rate and batch size needs every pairing of the two. A plotting routine that varies colour and shape needs all colour-shape combinations. The cross2 function turns two short vectors into the full grid, so you iterate over it once instead of writing a nested loop.

[NOTE]
**The cross family is deprecated since purrr 1.0.0, released in December 2022.** The cross2 function still runs and returns correct results, but it prints a one-time lifecycle warning per session. For new code the tidyverse team recommends the expand_grid function from tidyr, covered below. This page still documents cross2 because many legacy scripts and older tutorials depend on it.

## cross2() syntax and arguments

**The signature has two inputs and one optional filter.** Unlike the variadic cross function, cross2 is fixed-arity: it always takes exactly two inputs.

```r title="The cross2 function signature"
# cross2(.x, .y, .filter = NULL)
```

The arguments work as follows:

- `.x` is the first vector or list. Its values vary fastest in the output.
- `.y` is the second vector or list.
- `.filter` is an optional predicate of two arguments. Any pair for which it returns TRUE is dropped before the result is returned.

The output length is always `length(.x)` times `length(.y)`, minus whatever the filter removes. Each output element is an unnamed list of two values, the first drawn from `.x` and the second from `.y`.

## cross2() examples

**Start with two plain vectors to see the pairing order.** The first input varies fastest, so the two red pairs come before the two blue pairs in the result.

```r title="All pairs of two vectors"
library(purrr)

pairs <- cross2(c("S", "L"), c("red", "blue"))
length(pairs)
#> [1] 4
pairs[[1]]
#> [[1]]
#> [1] "S"
#>
#> [[2]]
#> [1] "red"
```

Each element is a two-slot list, with `pairs[[1]]` holding the small-and-red combination. To act on the pairs, pass the list to map and index the two slots by position.

```r title="Apply a function over every pair"
grid <- cross2(c(10, 20), c(0.1, 0.5))
map_chr(grid, \(p) sprintf("n=%g, rate=%g", p[[1]], p[[2]]))
#> [1] "n=10, rate=0.1" "n=20, rate=0.1" "n=10, rate=0.5" "n=20, rate=0.5"
```

The `.filter` argument trims the grid before it is returned. The predicate receives the two candidate values, and any pair it flags as TRUE is removed. A frequent use is dropping pairs whose values are equal.

```r title="Drop matching pairs with a filter"
combos <- cross2(1:3, 1:3, .filter = `==`)
length(combos)
#> [1] 6
combos[[1]]
#> [[1]]
#> [1] 2
#>
#> [[2]]
#> [1] 1
```

A full cross of the integers one to three with themselves has nine pairs. The equality predicate flags the three pairs with matching values, so six remain. The two slots of each pair are unnamed, which trips up downstream code, so set the names yourself when you need labelled slots.

```r title="Name the two slots in each pair"
named <- cross2(c(10, 20), c(0.1, 0.5)) |>
  map(\(p) set_names(p, c("n", "rate")))
named[[2]]
#> $n
#> [1] 20
#>
#> $rate
#> [1] 0.1
```

[KEY INSIGHT]
**cross2() multiplies, while map2() adds.** The cross2 call returns `length(.x)` times `length(.y)` pairs, every possible combination. The map2 function instead walks two equal-length lists in lockstep and returns one result per position. Reach for cross2 when you want all pairings, and map2 when the two lists are already aligned one to one.

## cross2() vs alternatives

**Three functions can do what cross2 does, and one of them is not deprecated.** The table compares the realistic choices for pairing two inputs.

| Function | Output | Status | Best for |
|---|---|---|---|
| `cross2()` | list of 2-element lists | Deprecated | Legacy purrr code |
| `expand_grid()` | tibble, one column per input | Active (tidyr) | New tidyverse code |
| `expand.grid()` | data.frame | Active (base R) | Base-only scripts |

The expand_grid function is the modern replacement. It takes the inputs as named arguments and returns a tibble, so it slots directly into a tidyverse pipeline without a conversion step.

```r title="The modern replacement expand_grid"
library(tidyr)

expand_grid(size = c("S", "L"), color = c("red", "blue"))
#> # A tibble: 4 x 2
#>   size  color
#>   <chr> <chr>
#> 1 S     red
#> 2 S     blue
#> 3 L     red
#> 4 L     blue
```

Note the row order differs. The cross2 function varies its first input fastest, while expand_grid varies its last argument fastest. The set of pairs is identical in both cases; only the sequence changes. To run a function over the tibble, pass it to pmap.

## Common pitfalls

**Three mistakes cause most cross2 trouble.**

- **Expecting named slots.** The inner lists from cross2 are unnamed. Any code that indexes by name fails or returns NULL. Name the slots with set_names, or use `cross(list(a = .x, b = .y))` for named output.
- **Comparing row order with expand_grid.** cross2 and expand_grid produce the same pairs in a different order. Never diff their outputs without sorting both first.
- **Ignoring the deprecation warning.** cross2 prints a lifecycle warning the first time it runs in a session. It is a warning, not an error, but it clutters logs. Switching to expand_grid removes the noise.

[WARNING]
**cross2() returns a list, not a data frame.** A common error is feeding the cross2 result straight to a function that expects a rectangular table, such as ggplot or a dplyr verb. Convert the pairs first, or skip cross2 and use expand_grid, which returns a tibble directly.

## Try it yourself

**Try it:** Use cross2() to build every pair from `c(1, 2, 3)` and `c("a", "b")`, then confirm the count. Save the result to `ex_pairs`.

```r title="Your turn: cross two vectors"
# Try it: all pairs of two vectors
ex_pairs <- # your code here

length(ex_pairs)
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pairs <- cross2(c(1, 2, 3), c("a", "b"))
length(ex_pairs)
#> [1] 6
```

**Explanation:** cross2 pairs each of the three numbers with each of the two letters, so the count is three times two, which equals six. Each element is a two-slot list holding one number and one letter.

</details>

## Related purrr functions

These functions appear alongside cross2 in iteration code:

- `cross()` crosses a list of any number of inputs, not just two.
- `cross3()` is the three-input fixed-arity helper.
- `map2()` walks two equal-length lists in parallel without crossing them.
- `map()` applies a function to each element of one list, the natural partner for iterating over cross2 output.
- `transpose()` flips a list of lists, turning per-pair records into per-slot vectors.

For the wider picture of list iteration in R, see the [Functional Programming in R](Functional-Programming-in-R.html) guide. The official function reference lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/cross.html).

## FAQ

**Is purrr cross2() deprecated?**

Yes. The cross2 function, along with cross, cross3, and cross_df, was deprecated in purrr 1.0.0, released in December 2022. It still works and returns correct results, but it emits a lifecycle warning the first time it runs in a session. The tidyverse team recommends the expand_grid function from tidyr for all new code.

**What is the difference between cross2() and cross()?**

Both build a Cartesian product. The cross2 function is fixed-arity: it always takes exactly two inputs and returns a list of two-element lists. The cross function is variadic: it takes a single list of any number of inputs and, when that list is named, returns named inner lists. Use cross2 for the common two-input case and cross when the number of inputs varies.

**What is the difference between cross2() and map2()?**

The cross2 function returns every possible pairing of its two inputs, so the output length is the product of the two input lengths. The map2 function steps two equal-length inputs together one position at a time and returns one result per position. In short, cross2 builds a grid while map2 performs a parallel walk.

**How do I run a function over every pair from cross2()?**

Pass the cross2 result to map, and index the two slots inside the function with `[[1]]` and `[[2]]`. Each element of the cross2 output is a two-element list, so a lambda like `\(p) f(p[[1]], p[[2]])` applies your function to both values of every pair.

**Why are the inner lists from cross2() unnamed?**

The cross2 function takes its inputs as positional arguments, `.x` and `.y`, so it has no names to carry through. If you need labelled slots, call set_names on each element, or switch to `cross(list(a = .x, b = .y))`, which propagates the list names into every combination.
