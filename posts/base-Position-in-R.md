---
title: "base Position() in R: Find Index of First Match"
slug: base-Position-in-R
description: "base Position() in R returns the index of the first vector or list element that satisfies a predicate. Syntax, examples, and which() vs match() vs Find()."
keywords: "base Position, Position function R, R Position function, R find index, R predicate position, R higher order function index, R Position vs which"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: base-r-essentials
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "Position()|base Position|R Position function|find first match index|predicate position R"
auto_link_case_sensitive: true
target_keyword: "base Position"
sibling_block_enabled: true
difficulty: Beginner
---

# base Position() in R: Find Index of First Element Matching a Predicate

<p class="lead">base <code>Position()</code> in R returns the integer index of the first element in a vector or list for which a predicate function returns <code>TRUE</code>. It is the index-returning sibling of <code>Find()</code> and a higher-order alternative to <code>which()[1]</code> that short-circuits on the first match.</p>

[QUICK ANSWER]
Position(\(x) x > 5, c(1, 3, 7, 2, 8))            # first index above 5
Position(is.character, list(1, "a", 2))           # first non-numeric slot
Position(is.na, c(1, 2, NA, 4))                   # first NA position
Position(\(x) x == "b", letters)                  # locate a value
Position(\(x) x > 100, 1:5, nomatch = 0L)         # no match, return 0
Position(\(x) x > 0, c(-1, 2, 3), right = TRUE)   # last match from the right
Position(\(x) nchar(x) > 4, c("hi", "hello"))     # first long string

[DECISION TREE: Is Position() the right tool?]
- first index where predicate is TRUE: Position(\(x) x > 5, v)
- first element value (not index): Find(\(x) x > 5, v)
- all indices where condition is TRUE: which(v > 5)
- lookup positions of values in another vector: match(needle, haystack)
- count elements satisfying a condition: sum(v > 5)
- filter elements that satisfy a predicate: Filter(\(x) x > 5, v)

## What Position() does

**Position() is a short-circuiting index finder.** You pass a predicate function and a vector or list. R walks the elements in order, applies the predicate to each, and returns the integer index of the first one that yields `TRUE`. If nothing matches, it returns `NA_integer_` by default. Unlike `which()`, it stops at the first hit, which matters when the input is long or the predicate is expensive. Unlike `match()`, the test is an arbitrary function, not equality against a lookup table.

```r title="The simplest Position call"
Position(\(x) x > 5, c(1, 3, 7, 2, 8))
#> [1] 3
```

The third element (`7`) is the first that exceeds 5, so the function returns `3`.

## Syntax

**The signature has four arguments, two of them optional.** The full form is `Position(f, x, right = FALSE, nomatch = NA_integer_)`. Most calls use only the first two.

```r title="Position signature in full"
args(Position)
#> function (f, x, right = FALSE, nomatch = NA_integer_)
#> NULL
```

[NOTE]
**Two functions, similar shapes.** `Position()` and `Find()` share the same argument list. `Find()` returns the matched element; `Position()` returns its index. Pick by what your downstream code needs.

| Argument | Purpose | Default |
|---|---|---|
| `f` | Predicate function applied to each element; must return a single logical | required |
| `x` | A vector or list to search | required |
| `right` | If `TRUE`, walk from the last element backward and return position of the last match | `FALSE` |
| `nomatch` | Value returned when no element satisfies `f` | `NA_integer_` |

The predicate `f` must accept one argument and return a scalar `TRUE` or `FALSE`. A vectorized predicate that returns a logical vector raises an error.

```r title="Predicates must return one logical"
Position(\(x) x > 5, c(1, 3, 7))
#> [1] 3

# This raises an error - the predicate returns a vector
tryCatch(
  Position(\(x) c(TRUE, FALSE), c(1, 2)),
  error = \(e) conditionMessage(e)
)
#> [1] "the condition has length > 1"
```

## Examples by use case

**Four shapes cover most real uses.** Each predicate stays in one expression; nothing else changes.

### Locate the first value above a threshold

**The canonical use case is finding where a sequence crosses a boundary.** Pass an inline predicate and let `Position()` stop at the first qualifying value.

```r title="First mpg above 25 in mtcars"
Position(\(x) x > 25, mtcars$mpg)
#> [1] 3
mtcars$mpg[3]
#> [1] 22.8
```

Wait, that printed `22.8`, not a value above 25. The reason is that `mtcars` rows do not start in sorted order; index 3 is the first row whose `mpg` happens to satisfy. Let me sort:

```r title="On sorted data the index is the rank"
sorted_mpg <- sort(mtcars$mpg)
Position(\(x) x > 25, sorted_mpg)
#> [1] 25
sorted_mpg[25]
#> [1] 26
```

After sorting ascending, index `25` is the first value above `25`, namely `26`.

### Find the first non-numeric slot in a heterogeneous list

**Mixed-type lists are where `Position()` shines.** A predicate can ask any question about element type, structure, or content.

```r title="First character element in a mixed list"
mixed <- list(1, 2.5, "alpha", TRUE, 3L)
Position(is.character, mixed)
#> [1] 3
```

### Find the first NA

[TIP]
**Use `is.na` as the predicate.** `Position(is.na, x)` returns the first NA position. For "is there any NA," `anyNA(x)` is faster; use `Position()` when you need the location.

```r title="Locate the first missing value"
x <- c(4, 7, NA, 2, NA)
Position(is.na, x)
#> [1] 3
```

### Find from the right with `right = TRUE`

**The `right` argument flips the walk direction.** The walker still returns the position in the original vector, just of the last match instead of the first.

```r title="Last positive value in a signed sequence"
v <- c(-1, 2, 3, -4, 5, -6)
Position(\(x) x > 0, v)                    # first positive
#> [1] 2
Position(\(x) x > 0, v, right = TRUE)      # last positive
#> [1] 5
```

## Position() vs which() vs match() vs Find()

**Four base R tools, four different answers to "where is it?".** Pick by what you need back.

| Function | Returns | Predicate? | Stops at first? |
|---|---|---|---|
| `Position(f, x)` | First matching **index** (integer) | Yes, any function | Yes |
| `Find(f, x)` | First matching **value** | Yes, any function | Yes |
| `which(x > 5)` | **All** matching indices (integer vector) | No, condition only | No |
| `match(needle, haystack)` | Indices of `needle` in `haystack` | No, equality lookup | Per-element first match |

```r title="Same vector, four answers"
v <- c(1, 3, 7, 2, 8)

Position(\(x) x > 5, v)   # index of first hit
#> [1] 3
Find(\(x) x > 5, v)       # value of first hit
#> [1] 7
which(v > 5)              # all indices
#> [1] 3 5
match(7, v)               # equality lookup
#> [1] 3
```

[KEY INSIGHT]
**Use `Position()` when the predicate is non-trivial and the vector is large.** `which(v > 5)[1]` evaluates the condition on every element and allocates a full index vector before discarding all but one. `Position()` walks until the first match and stops, which is meaningfully faster when the predicate is expensive or the match is near the front.

### Use nomatch to avoid downstream NA propagation

**The `nomatch` default is `NA_integer_`.** That is usually correct, but if your downstream code feeds the result directly into an index expression, an `NA` will silently return an `NA` value. Set `nomatch = 0L` (or `length(x) + 1L`) when you want a sentinel instead.

```r title="nomatch returns a usable sentinel"
Position(\(x) x > 100, 1:5)                  # default NA
#> [1] NA
Position(\(x) x > 100, 1:5, nomatch = 0L)    # sentinel zero
#> [1] 0
```

## Common pitfalls

**Three mistakes trip beginners.** Watch for these silently incorrect calls.

```r title="Pitfall 1: passing a vectorized condition, not a predicate"
v <- c(1, 3, 7)
# WRONG: this passes a logical vector, not a function
tryCatch(Position(v > 5, v), error = \(e) conditionMessage(e))
#> [1] "could not find function \"f\""

# RIGHT: wrap it in a function
Position(\(x) x > 5, v)
#> [1] 3
```

```r title="Pitfall 2: forgetting NA means missing"
result <- Position(\(x) x == "rare", c("a", "b", "c"))
result
#> [1] NA
# This silently flows into NA-indexing:
c("a", "b", "c")[result]
#> [1] NA
# Guard with isTRUE(!is.na(result)) or nomatch = 0L
```

```r title="Pitfall 3: assuming order with names"
v <- c(c = 3, a = 1, b = 7)
Position(\(x) x > 5, v)
#> [1] 3
# Returns the POSITION (3), not the name. Use names(v)[Position(...)] for the label.
names(v)[Position(\(x) x > 5, v)]
#> [1] "b"
```

## Try it yourself

**Try it:** Use `Position()` on `airquality$Ozone` to find the index of the first measurement above 100. Save the result to `ex_first_high`.

```r title="Your turn: locate the first high ozone reading"
# Try it: first Ozone > 100 in airquality
ex_first_high <- # your code here

ex_first_high
#> Expected: an integer position (or NA if none)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_first_high <- Position(\(x) !is.na(x) && x > 100, airquality$Ozone)
ex_first_high
#> [1] 30
airquality$Ozone[ex_first_high]
#> [1] 115
```

**Explanation:** The predicate guards against `NA` first because `NA > 100` returns `NA`, not `FALSE`, and `Position()` treats anything non-`TRUE` as no match. Index 30 is the first reading that survives both checks.

</details>

## Related base R functions

- [`Find()`](Find-in-R.html) returns the matching value; same signature as `Position()`.
- [`Filter()`](base-Filter-in-R.html) keeps all elements satisfying a predicate.
- [`Reduce()`](base-Reduce-in-R.html) folds a list with a binary function.
- `which()` returns every index where a logical vector is `TRUE`.
- `match()` performs equality lookup of one vector against another.

## FAQ

**What does Position() return when no element matches?**

By default `Position()` returns `NA_integer_` when the predicate never holds. You can change this with the `nomatch` argument, for example `nomatch = 0L` to get a numeric sentinel. The `NA` default is consistent with `match()` and lets you detect "no hit" with `is.na()`. If you index back into the vector with the raw result, an `NA` will silently propagate, which is the most common Position() bug.

**How is Position() different from which()?**

`which(condition)` evaluates the condition on every element of the vector and returns all indices where it is `TRUE`. `Position(predicate, x)` walks element by element and stops at the first match. For finding "any" match in a large vector with an expensive test, `Position()` is faster because it short-circuits. For finding all matches or counting them, `which()` is the right tool.

**Can Position() take a function with extra arguments?**

Yes. Wrap your predicate in an anonymous function that closes over the extra arguments: `Position(\(x) my_test(x, threshold = 5), v)`. R 4.1 added the `\(x)` shorthand for `function(x)`. You can also pass a named function directly when it accepts a single argument, such as `Position(is.na, v)` or `Position(is.character, v)`.

**Does Position() work on lists as well as vectors?**

Yes. `Position()` accepts any vector or list, and the predicate is applied to each element regardless of type. For a list of data frames, `Position(\(d) nrow(d) > 100, list_of_dfs)` finds the first one with more than 100 rows. This makes `Position()` a natural fit for searching heterogeneous structures where indexing by name is not enough.

**Is Position() the same as `purrr::detect_index()`?**

They serve the same purpose. `purrr::detect_index()` is the tidyverse counterpart with a small API improvement: it returns `0` instead of `NA` when no element matches, which is friendlier in downstream code. The base `Position()` requires explicit `nomatch = 0L` to match that behavior. For pure base R code with no tidyverse dependency, `Position()` is the right choice.
