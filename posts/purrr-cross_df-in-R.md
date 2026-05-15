---
title: "purrr cross_df() in R: Make a Tibble of Combinations"
slug: purrr-cross_df-in-R
description: "Use purrr cross_df() in R to build a tibble of every combination from a list of inputs. Covers syntax, pmap grid search, and the expand_grid replacement."
keywords: "purrr cross_df, cross_df function R, purrr cross_df examples, cross_df data frame, expand_grid purrr, cross_df vs expand_grid, list combinations R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "cross_df()|purrr cross_df|purrr::cross_df()|cross() family|cross_df function"
auto_link_case_sensitive: true
target_keyword: "purrr cross_df"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr cross_df() in R: Make a Tibble of Combinations

<p class="lead">The purrr cross_df() function in R turns a list of input vectors into a tibble holding every combination of their values, with one row per combination. It is the data-frame member of the cross family, built for grid search and parameter sweeps.</p>

[QUICK ANSWER]
cross_df(list(a = 1:2, b = 3:4))         # all combos as a tibble
cross_df(list(n = 1:3, m = c("x", "y"))) # mixed-type columns
cross_df(grid_list, .filter = `==`)      # drop matching pairs
pmap_chr(cross_df(grid_list), f)         # run f over every row
tidyr::expand_grid(a = 1:2, b = 3:4)     # modern replacement
cross(list(a = 1:2, b = 3:4))            # nested-list variant

[DECISION TREE: Is cross_df() the right tool?]
- want a tibble of all combinations: cross_df(list(a = 1:2, b = 1:2))
- prefer non-deprecated code: tidyr::expand_grid(a = 1:2, b = 1:2)
- want a nested list, not a tibble: cross(list(a = 1:2, b = 1:2))
- need a base R data.frame: expand.grid(a = 1:2, b = 1:2)
- run a function over each combo: pmap(grid, f)
- combos with no duplicate rows: tidyr::crossing(a = 1:2)

## What cross_df() does in purrr

**cross_df() builds a data frame of combinations.** You hand it a named list of vectors, and it returns a tibble with one column per input and one row for every possible pairing of values across those inputs. It is the rectangular counterpart of `cross()`, which returns a nested list instead of a table.

Cross a length-two input with a length-three input, and the tibble comes back with six rows. This shape is exactly what grid search and simulation studies need. A hyperparameter sweep wants every pairing of learning rate and tree depth, and `cross_df()` turns two short vectors into the full grid in one call.

[NOTE]
**The cross family is deprecated since purrr 1.0.0, released in December 2022.** Functions like `cross_df()` still run and return correct results, but they print a one-time lifecycle warning. For new code the tidyverse team recommends `expand_grid()` from tidyr, shown later on this page. This guide still documents `cross_df()` because legacy scripts and older tutorials lean on it heavily.

## cross_df() syntax and arguments

**The signature has just two arguments.** Both are shared with the rest of the cross family, so the mental model carries over directly.

```r title="The cross_df signature"
# cross_df(.l, .filter = NULL)
```

The arguments work as follows:

- `.l` is a named list of vectors or lists to cross. The list names become the column names of the returned tibble.
- `.filter` is a two-argument predicate function. Any combination for which it returns TRUE is dropped before the tibble is assembled.

The first input in `.l` varies fastest in the output, so the first column cycles through its values before the second column advances. This matches the ordering used by `cross()` and differs from `expand_grid()`.

## cross_df() examples

**Start with a named list so every column is labelled.** Passing names means the tibble columns line up cleanly with downstream function arguments.

```r title="Build a tibble of combinations"
library(purrr)

cross_df(list(size = c("S", "L"), color = c("red", "blue")))
#> # A tibble: 4 x 2
#>   size  color
#>   <chr> <chr>
#> 1 S     red
#> 2 L     red
#> 3 S     blue
#> 4 L     blue
```

The columns can hold different types. Here a numeric sample size is crossed with a character test name, and the tibble keeps each column's class.

```r title="Cross mixed-type columns"
cross_df(list(n = c(30, 60), test = c("t.test", "wilcox")))
#> # A tibble: 4 x 2
#>       n test
#>   <dbl> <chr>
#> 1    30 t.test
#> 2    60 t.test
#> 3    30 wilcox
#> 4    60 wilcox
```

The `.filter` argument trims the grid before the tibble is returned. The predicate receives two values, and any combination it flags as TRUE is removed. A common use drops pairs where both values match.

```r title="Drop combinations with a filter"
grid <- cross_df(list(x = 1:3, y = 1:3), .filter = `==`)
nrow(grid)
#> [1] 6
head(grid, 3)
#> # A tibble: 3 x 2
#>       x     y
#>   <int> <int>
#> 1     2     1
#> 2     3     1
#> 3     1     2
```

A full cross of one through three with itself has nine rows. The equality predicate flags the three rows where the two values match, so six rows remain. The real payoff is pairing the grid with `pmap()` to evaluate something at every point.

```r title="Run a function over each row with pmap"
grid <- cross_df(list(n = c(10, 20), rate = c(0.1, 0.5)))
pmap_chr(grid, function(n, rate) sprintf("n=%g, rate=%g", n, rate))
#> [1] "n=10, rate=0.1" "n=20, rate=0.1" "n=10, rate=0.5" "n=20, rate=0.5"
```

[KEY INSIGHT]
**cross_df() is cross() plus a tibble conversion in one step.** The plain `cross()` function returns a list of lists, which you would then bind into a table yourself. The `cross_df()` variant skips that conversion and hands back the tibble directly, so it slots straight into a `pmap()` call without an extra step.

## cross_df() vs expand_grid() and cross()

**expand_grid() from tidyr does the same job and is not deprecated.** It takes inputs as named arguments rather than a list, and returns a tibble that drops straight into a tidyverse pipeline.

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

Notice the row order. `expand_grid()` varies its last argument fastest, while `cross_df()` varies its first input fastest. The set of combinations is identical; only the sequence of rows changes. The table below shows when to reach for each option.

| Function | Output | Status | Best for |
|---|---|---|---|
| `cross_df()` | tibble | Deprecated | Legacy purrr pipelines |
| `cross()` | list of lists | Deprecated | Nested-list combinations |
| `expand_grid()` | tibble | Active | New tidyverse code |
| `expand.grid()` | data.frame | Active | Base R only scripts |

For new projects, pick `expand_grid()`. Reach for `cross_df()` only when you are maintaining code that already depends on it.

## Common pitfalls

**Three mistakes account for most cross_df() confusion.**

- **Ignoring the deprecation warning.** In a fresh session `cross_df()` prints a lifecycle warning the first time it runs. It is a warning, not an error, but it clutters logs and worries reviewers. Switching to `expand_grid()` removes the noise.
- **Expecting cross_df() and expand_grid() to agree on row order.** They produce the same combinations in a different sequence. Never compare their outputs row by row without sorting both first.
- **Passing an unnamed list.** Without names the tibble columns get default labels like `V1` and `V2`, so any `pmap()` call that matches on argument names will fail. Always name the inputs in the list.

[WARNING]
**The cross_d() function was removed before deprecation.** Older scripts may call `cross_d()`, an early name for the data-frame variant that was retired well before purrr 1.0.0. Replace `cross_d()` with `cross_df()`, then plan a move to `expand_grid()`.

## Try it yourself

**Try it:** Use `cross_df()` to build a tibble of every combination of two sample sizes and two effect sizes, then confirm the row count. Save the result to `ex_grid`.

```r title="Your turn: build a cross_df grid"
# Try it: cross_df of two two-element vectors
ex_grid <- # your code here

nrow(ex_grid)
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- cross_df(list(n = c(30, 60), effect = c(0.2, 0.8)))
nrow(ex_grid)
#> [1] 4
```

**Explanation:** Two two-element inputs cross into two times two, which is four rows. Each row holds one sample size paired with one effect size, the full grid for a power simulation.

</details>

## Related purrr functions

These functions show up alongside `cross_df()` in iteration code:

- `cross()` returns the same combinations as a nested list rather than a tibble.
- `cross2()` crosses exactly two vectors, a fixed-arity helper in the same family.
- `pmap()` applies a function across the rows of the grid, the natural partner for `cross_df()`.
- `map()` applies a function to each element of a single list.
- `transpose()` flips a list of lists, turning per-combination records into per-field columns.

For the bigger picture of list iteration, see the [Functional Programming in R](Functional-Programming-in-R.html) guide. The official reference lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/cross.html).

## FAQ

**Is purrr cross_df() deprecated?**

Yes. The `cross_df()` function, along with `cross()`, `cross2()`, and `cross3()`, was deprecated in purrr 1.0.0, released in December 2022. It still works and returns a correct tibble, but it emits a lifecycle warning the first time it runs in a session. The tidyverse team recommends `expand_grid()` from tidyr for all new code.

**What is the difference between cross_df() and cross()?**

Both produce the Cartesian product of their inputs. The `cross()` function returns a list of lists, where each element holds one combination. The `cross_df()` function returns a tibble, with one column per input and one row per combination. Use `cross_df()` when you want a rectangular result that feeds directly into `pmap()` or a data-frame pipeline.

**How do I run a function over every combination?**

Build the grid with `cross_df()` or `expand_grid()`, then pass it to `pmap()`. The `pmap()` call evaluates the function once per row, matching the grid column names to the function argument names. This pattern powers grid search and parameter sweeps without any nested loops.

**Why does cross_df() print a warning?**

The warning is a lifecycle notice telling you the function is deprecated. It fires once per session, not once per call, and it does not stop your code or change the result. To silence it permanently, switch the call to `expand_grid()`, which is the maintained replacement and produces the same set of combinations.

**Can cross_df() handle more than two inputs?**

Yes. The `.l` argument accepts a list of any length, so you can cross three, four, or more vectors in a single call. Remember that the row count grows multiplicatively, so four inputs of ten values each produce ten thousand rows. Filter early with the `.filter` argument when the full grid is larger than you need.
