---
title: "purrr cross() in R: Generate All List Combinations"
slug: purrr-cross-in-R
description: "Use purrr cross() in R to generate every combination of list elements. Covers cross(), cross2(), cross_df(), the .filter argument, and the modern expand_grid()."
keywords: "purrr cross, cross function R, purrr cross examples, cross2 purrr, cross_df R, R cartesian product list, expand_grid alternative"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "cross()|purrr cross|purrr::cross()|cross_df()|cross2()"
auto_link_case_sensitive: true
target_keyword: "purrr cross"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr cross() in R: Generate All List Combinations

<p class="lead">The purrr cross() function generates every combination of elements from a set of lists, the Cartesian product, returned as a list of lists. It is the building block for grid searches, parameter sweeps, and exhaustive test cases.</p>

[QUICK ANSWER]
cross(list(a = 1:2, b = 3:4))        # all combinations as a list
cross2(1:3, c("x", "y"))             # combinations of two vectors
cross3(1:2, 1:2, 1:2)                # combinations of three
cross_df(list(a = 1:2, b = 3:4))     # combinations as a data frame
cross2(1:3, 1:3, .filter = `==`)     # drop pairs that match
expand_grid(a = 1:2, b = 3:4)        # modern, non-deprecated replacement

[DECISION TREE: Is cross() the right tool?]
- all combinations of named lists: cross(list(a = 1:2, b = 1:2))
- want a tidy data frame of combos: tidyr::expand_grid(a = 1:2)
- combinations of just two vectors: cross2(1:3, c("a", "b"))
- run a function over every combo: pmap(expand_grid(...), f)
- step two lists in parallel (not crossed): map2(x, y, f)
- combos with no duplicate rows: tidyr::crossing(a = 1:2)

## What cross() does in purrr

**The cross function builds a Cartesian product.** You pass it a list of input vectors or lists, and it returns one element for every possible pairing of values across those inputs. Cross two inputs of length two and three, and you get six combinations back. The result is a flat list, and each element is itself a small list that holds exactly one value drawn from each input.

This pattern appears constantly in real data work. A hyperparameter grid search needs every pairing of learning rate and tree depth. A simulation study needs every combination of sample size and effect size. The cross family turns a handful of short vectors into the full grid, so you loop over it once with no nested loops to maintain.

[NOTE]
**The cross family is deprecated since purrr 1.0.0, released in December 2022.** These functions still run and return correct results, but they print a one-time lifecycle warning. For new code the tidyverse team recommends the expand_grid function from tidyr, shown later on this page. This guide still documents the cross family because legacy scripts and older tutorials rely on it heavily.

## cross() syntax and arguments

**The signature is short, and the .filter argument is the powerful part.** Every member of the cross family shares the same basic shape, differing only in how many inputs it accepts.

```r title="The cross family signatures"
# cross(.l, .filter = NULL)
# cross2(.x, .y, .filter = NULL)
# cross3(.x, .y, .z, .filter = NULL)
# cross_df(.l, .filter = NULL)
```

The arguments work as follows:

- `.l` is a named list of vectors or lists to cross. Names carry through, so each output element is labelled.
- `.x`, `.y`, and `.z` are individual vectors for the fixed-arity helpers cross2 and cross3.
- `.filter` is a predicate function of two arguments. Any combination for which it returns TRUE is removed from the result before it is handed back.

## cross() examples

**Start with a named list so the output stays labelled.** Passing a named list means every combination carries the input names, which makes the result easy to read and easy to feed into pmap later.

```r title="Generate combinations with cross"
library(purrr)

combos <- cross(list(size = c("S", "L"), color = c("red", "blue")))
length(combos)
#> [1] 4
combos[[1]]
#> $size
#> [1] "S"
#>
#> $color
#> [1] "red"
```

The first input varies fastest, so element one is the small-and-red pairing, element two is large-and-red, and the blue pairings follow. When you want a rectangular result instead of a nested list, reach for the data-frame variant, which returns a tibble with one column per input.

```r title="Return combinations as a data frame"
cross_df(list(size = c("S", "L"), color = c("red", "blue")))
#> # A tibble: 4 x 2
#>   size  color
#>   <chr> <chr>
#> 1 S     red
#> 2 L     red
#> 3 S     blue
#> 4 L     blue
```

A common workflow pairs the data-frame output with pmap to evaluate something at every grid point. Tibble columns line up with the function arguments, so each row triggers one call.

```r title="Iterate over a cross grid with pmap"
grid <- cross_df(list(n = c(10, 20), rate = c(0.1, 0.5)))
pmap_chr(grid, function(n, rate) sprintf("n=%g, rate=%g", n, rate))
#> [1] "n=10, rate=0.1" "n=20, rate=0.1" "n=10, rate=0.5" "n=20, rate=0.5"
```

The `.filter` argument trims the grid before it is returned. The predicate receives two values, and any combination it flags as TRUE is dropped. A frequent use is removing pairs where the two values are equal, which leaves only the off-diagonal entries.

```r title="Drop combinations with a filter"
pairs <- cross2(1:3, 1:3, .filter = `==`)
length(pairs)
#> [1] 6
map(pairs[1:2], unlist)
#> [[1]]
#> [1] 2 1
#>
#> [[2]]
#> [1] 3 1
```

A full cross of the integers one through three with themselves has nine pairs. The equality predicate flags the three pairs with matching values, so six combinations remain.

[KEY INSIGHT]
**A cross is multiplication, while a parallel step is addition.** The cross2 call returns the length of the first input times the length of the second, every possible pairing. The map2 function instead returns one result per element, walking both lists in lockstep. Reach for the cross family when you want all combinations, and map2 when the two lists are already aligned.

## cross() vs expand_grid(): the modern replacement

**The expand_grid function from tidyr does the same job and is not deprecated.** It accepts inputs directly as named arguments and returns a tibble, so it drops straight into a tidyverse pipeline without any conversion step.

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

Notice the ordering difference. The expand_grid function varies its last argument fastest, while the cross family varies its first input fastest. The set of combinations is identical in both cases; only the row order changes. The table below summarizes when to pick each option.

| Function | Output | Status | Best for |
|---|---|---|---|
| `cross()` / `cross_df()` | list of lists / tibble | Deprecated | Legacy purrr code |
| `expand_grid()` | tibble | Active | New tidyverse code |
| `expand.grid()` | data.frame | Active (base R) | Base-only scripts |

To run a function over the modern grid, pair expand_grid with pmap exactly as with the data-frame cross variant.

## Common pitfalls

**Three mistakes account for most cross confusion.**

- **Forgetting the deprecation warning.** In a fresh session the cross family prints a lifecycle warning the first time it runs. It is a warning, not an error, but it clutters logs and worries reviewers. Switching to expand_grid removes the noise entirely.
- **Expecting cross and expand_grid to agree on row order.** They produce the same combinations in a different sequence. Never compare their outputs row by row without sorting both first.
- **Passing an unnamed list to cross.** The result elements then have no names, so any downstream pmap call that relies on argument names will fail. Always name the inputs in the list you supply.

[WARNING]
**The cross_n() and cross_d() functions were removed.** Older scripts may call cross_n or cross_d, both retired well before the 1.0.0 deprecation. Replace cross_n with the plain cross function and cross_d with cross_df, then plan a move to expand_grid.

## Try it yourself

**Try it:** Use a cross helper to build every combination of three two-element vectors, then confirm the count. Save the result to `ex_combos`.

```r title="Your turn: cross three vectors"
# Try it: all combinations of three vectors
ex_combos <- # your code here

length(ex_combos)
#> Expected: 8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_combos <- cross3(c(1, 2), c(1, 2), c(1, 2))
length(ex_combos)
#> [1] 8
```

**Explanation:** The cross3 helper crosses three inputs, so the count is two times two times two, which equals eight. Each element is a list of three values, one drawn from each vector.

</details>

## Related purrr functions

These functions show up alongside the cross family in iteration code:

- `map()` applies a function to each element of one list.
- `map2()` walks two lists in parallel without crossing them, so the inputs must be the same length.
- `pmap()` applies a function across rows of a data frame or list of lists, the natural partner for cross_df and expand_grid.
- `transpose()` flips a list of lists, turning per-combination records into per-field columns.
- `cross2()` and `cross_df()` are the fixed-arity and data-frame variants of the plain cross function.

For the bigger picture of list iteration in R, see the [Functional Programming in R](Functional-Programming-in-R.html) guide. The official function reference lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/cross.html).

## FAQ

**Is purrr cross() deprecated?**

Yes. The cross, cross2, cross3, and cross_df functions were all deprecated in purrr 1.0.0, released in December 2022. They still work and return correct results, but they emit a lifecycle warning the first time they run in a session. The tidyverse team recommends the expand_grid function from tidyr for all new code.

**What is the difference between cross() and expand_grid()?**

Both produce the Cartesian product of their inputs. The cross function returns a list of lists and varies its first input fastest. The expand_grid function returns a tibble and varies its last input fastest. The combinations themselves are identical; only the container type and the row order differ. Because expand_grid is the maintained function, prefer it unless you specifically need the nested-list shape.

**How do I run a function over every combination?**

Build the grid with cross_df or expand_grid, then feed it to pmap. The pmap call evaluates the function once per combination, matching the grid column names to the function argument names. This pattern powers grid search and parameter sweeps.

**What does the .filter argument do in cross()?**

The `.filter` argument takes a predicate function of two arguments. The cross function applies that predicate to each candidate combination and removes the ones where it returns TRUE. For example, crossing the integers one through three with themselves and filtering on equality drops every pair whose two values match, leaving only the off-diagonal combinations.

**Can I cross more than three vectors?**

Yes. The plain cross function and cross_df accept a list of any length, so you can cross four or more inputs in one call. The numbered helpers stop at cross3. With many inputs the result grows multiplicatively, so a list of five vectors with ten elements each yields one hundred thousand combinations.
