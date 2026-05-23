---
title: "base Find() in R: Return First Element Matching a Predicate"
slug: "base-Find-in-R"
description: "base R Find() returns the first list or vector element matching a predicate. See syntax, six patterns, Find vs Filter vs Position, and common pitfalls."
keywords: "base Find function, Find function R, R Find first match, Find predicate R, base R Find, functional programming Find R, Find vs Filter R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: base-r-essentials
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "Find()|base::Find()|base Find|Find function in R|R Find function"
auto_link_case_sensitive: true
target_keyword: "base Find function"
sibling_block_enabled: true
difficulty: Beginner
---

# base Find() in R: Return First Element Matching a Predicate

<p class="lead">base R Find() returns the first element of a list or vector for which a predicate function returns TRUE. It is part of R's Filter, Find, Position, Reduce, Map functional family, built into base.</p>

[QUICK ANSWER]
Find(\(x) x > 5, c(1, 8, 3))           # first element matching a predicate
Find(is.character, my_list)             # first character element
Find(\(x) x > 5, v, right = TRUE)       # last match (search from right)
Find(\(x) x > 100, v, nomatch = -1L)    # fallback when nothing matches
Find(\(x) length(x) > 0, my_list)       # first non-empty list element
Find(Negate(is.na), v)                  # first non-NA value

[DECISION TREE: Is Find() the right tool?]
- get the first element matching a predicate: Find(\(x) x > 5, v)
- get the INDEX of the first match: Position(\(x) x > 5, v)
- get ALL elements matching a predicate: Filter(\(x) x > 5, v)
- combine elements with an accumulator: Reduce(`+`, v)
- apply a function to every element: lapply(v, \(x) x * 2)
- locate a known value in a lookup: match(needle, haystack)

## What Find() does in one sentence

**Find() scans a list or vector left to right and returns the first element where a predicate returns TRUE.** It is base R's answer to "give me one match, not all of them." Unlike `Filter()`, which keeps every matching element, `Find()` stops at the first hit and returns that single element. The companion function `Position()` returns the index of the same hit; `Find()` returns the value.

[KEY INSIGHT]
**Find() returns a VALUE, Position() returns an INDEX.** If you need both, call Position() once, then index `x[[i]]`, rather than calling Find() and Position() back to back.

## Syntax

**Find() has a short signature with only four arguments.** Two are positional (the predicate and the data), two are keyword arguments that change scan direction and the no-match return value.

```r title="Find signature and arguments"
# Function signature
args(Find)
#> function (f, x, right = FALSE, nomatch = NULL)
#> NULL
```

The arguments:

- `f`: a predicate function that takes one element and returns a single TRUE or FALSE.
- `x`: a list or atomic vector to scan.
- `right`: if TRUE, scan from right to left and return the last matching element. Default FALSE.
- `nomatch`: value returned when no element matches. Default NULL.

Find() does not require any package, it ships with base R and has been stable since R 1.5. The predicate `f` is called once per element, in order, and scanning stops the moment a TRUE is returned.

## Six common patterns

**Each pattern below covers a different real-world shape of "find one match".** Run them in order; the WebR session keeps state across blocks.

### First element passing a numeric condition

**Pass a numeric predicate to grab the first value above (or below) a threshold.** This is the canonical Find() use case.

```r title="Find first value above threshold"
v <- c(2, 4, 6, 8, 10)
Find(\(x) x > 5, v)
#> [1] 6
```

The anonymous function `\(x) x > 5` is R 4.1+ shorthand for `function(x) x > 5`. Find() walks `v` left to right and returns 6, the first value where the predicate is TRUE.

### First element of a specific type in a mixed list

**Type predicates pair perfectly with Find() on heterogeneous lists.** Use `is.character`, `is.numeric`, `is.function`, or `is.list` to pluck the first element of that type.

```r title="Find first character element in a list"
mixed <- list(1L, TRUE, "hello", 3.14, "world")
Find(is.character, mixed)
#> [1] "hello"
```

### Last match using right = TRUE

**Set `right = TRUE` to scan from the end and return the last match instead of the first.** It is the only direction flag Find() supports; use Filter() if you need every match.

```r title="Find the last matching element"
v <- c(2, 4, 6, 8, 10)
Find(\(x) x > 5, v, right = TRUE)
#> [1] 10
```

### Fallback when nothing matches

**Use the `nomatch` argument to return a sentinel when no element passes the predicate.** Without it, Find() silently returns NULL, which downstream code often mis-handles.

```r title="Provide a default with nomatch"
v <- c(2, 4, 6, 8, 10)

# Without nomatch: returns NULL silently
Find(\(x) x > 100, v)
#> NULL

# With nomatch: returns the sentinel
Find(\(x) x > 100, v, nomatch = -1L)
#> [1] -1
```

Set `nomatch` to a sentinel when downstream code expects a numeric or character result; see Pitfall 1 below for the NULL-ambiguity case.

### First non-empty element in a list of lists

**Combine Find() with `length(x) > 0` to skip empty entries when cleaning nested data.** It handles `list()`, `NULL`, and zero-length atomic vectors in one expression, useful for nested API responses.

```r title="Skip empty entries"
nested <- list(list(), c(), list(1, 2), list(3))
Find(\(x) length(x) > 0, nested)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 2
```

### Negate a predicate for "first NOT matching" semantics

**Wrap a predicate in `Negate()` to flip TRUE and FALSE without rewriting the function.** It reads cleanly alongside `is.na`, `is.null`, and `is.numeric`.

```r title="Find first non-NA value"
v <- c(NA, NA, 7, NA, 12)
Find(Negate(is.na), v)
#> [1] 7
```

[TIP]
**Anonymous functions are cheaper than named ones for one-off predicates.** Use `\(x) x > 5` inline rather than defining `is_big <- function(x) x > 5`; the predicate is called once per element and a lambda is the shortest form.

## Find vs Position vs Filter vs purrr::detect

**These four functions cover the "search a sequence with a predicate" space.** Pick by what you need back: a value, an index, all matches, or a tidyverse-style call order.

| Function | Returns | Stops at first match? | Package |
|---|---|---|---|
| `Find(f, x)` | First matching element (value) | Yes | base |
| `Position(f, x)` | Index of first match | Yes | base |
| `Filter(f, x)` | All matching elements | No, scans all | base |
| `purrr::detect(x, f)` | First match (tidyverse style) | Yes | purrr |

Base (Find, Filter, Position) takes the predicate first; purrr puts data first to fit pipe chains. If you already use tidyverse, `purrr::detect()` and `purrr::detect_index()` mirror Find()/Position() one-for-one.

[NOTE]
**purrr::detect() returns NULL on no match by default, same as Find().** Switching is a syntax change, not a semantics change.

## Common pitfalls

**Three traps catch most Find() users.** Read these before shipping production code.

### Pitfall 1: NULL on no match looks like "found NULL"

**A NULL return is ambiguous when the list itself contains NULL entries.** Was the match NULL, or was there no match? Use the `nomatch` argument with a clearly distinguishable sentinel to disambiguate.

```r title="Disambiguate no-match from match-is-NULL"
mixed <- list(NULL, 1, 2, NULL, 3)
Find(is.null, mixed)
#> NULL

# Use a sentinel to distinguish
result <- Find(is.null, mixed, nomatch = "NOT_FOUND")
result
#> NULL
```

The match here is genuine; element 1 IS NULL. With `nomatch = "NOT_FOUND"`, a "NOT_FOUND" return means no match, NULL means match-was-NULL.

### Pitfall 2: Predicate must return a scalar logical

**Find() uses `isTRUE()` internally, which rejects any logical vector with length > 1.** A predicate that returns a vector silently produces NULL, even when "some" element would seem to match.

```r title="Scalarize multi-element predicates"
v <- list(c(1, 2), c(5, 6), c(8, 9))

# WRONG: predicate returns a length-2 logical, isTRUE() rejects it
Find(\(x) x > 5, v)
#> NULL

# CORRECT: wrap in any() to force a scalar TRUE/FALSE
Find(\(x) any(x > 5), v)
#> [1] 5 6
```

Always wrap multi-element checks in `any()` or `all()` so the predicate returns ONE TRUE or FALSE per call.

### Pitfall 3: Slower than vectorized indexing on big numeric vectors

**For long atomic numeric or character vectors, `x[which(predicate(x))[1]]` is often faster than Find().** The comparison runs once in C instead of once per element in R. Find() shines on lists and mixed types where vectorized comparison is impossible; on long flat numeric vectors, prefer `which()` plus indexing.

[WARNING]
**Find() has no .progress argument and no parallel backend.** Long-running predicates on big lists block the main R session. If `f` is expensive and `x` has 10k+ elements, consider `furrr::future_detect()` or batched manual indexing.

## Try it yourself

**Try it:** Use Find() on `c(3, 1, 4, 1, 5, 9, 2, 6)` to return the first value greater than 4. Save the result to `ex_first_big`.

```r title="Your turn: first value above 4"
# Try it: find first element > 4
v <- c(3, 1, 4, 1, 5, 9, 2, 6)
ex_first_big <- # your code here

ex_first_big
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
v <- c(3, 1, 4, 1, 5, 9, 2, 6)
ex_first_big <- Find(\(x) x > 4, v)
ex_first_big
#> [1] 5
```

**Explanation:** Find() scans left to right, returns the first hit (5 at position 5), and stops. The values 9 and 6 also pass the predicate but are never visited because Find() short-circuits on the first TRUE.

</details>

## Related base R functional functions

**The base R functional family covers the common sequence operations without any package install.** Reach for the right sibling based on what you want to return.

- `Filter(f, x)`: keeps every element passing the predicate.
- `Position(f, x)`: returns the integer INDEX of the first match instead of the value.
- `Map(f, ...)`: applies `f` element-wise across one or more sequences, returns a list.
- `Reduce(f, x)`: accumulates a binary operation across a sequence.
- `Negate(f)`: flips a predicate's TRUE/FALSE return, handy with `is.na`, `is.null`, `is.numeric`.

For a complete tour with comparison to the apply family and purrr equivalents, see Further Reading below.

## FAQ

**What does Find() return if no element matches?**

By default, Find() returns NULL when no element satisfies the predicate, the silent failure that surprises beginners. Override it with the `nomatch` argument: `Find(predicate, x, nomatch = NA)` or `nomatch = -1L`. Choose a sentinel that cannot collide with any legitimate match so the no-match return is unambiguous downstream.

**What is the difference between Find() and Filter() in R?**

Find() returns the first matching element and stops; Filter() returns every matching element and scans the whole sequence. Use Find() when you need a single result and want short-circuit evaluation. Use Filter() when you need all matches, for example to subset a list. Both take the predicate first and the data second in base R.

**How does Find() differ from match() in R?**

match() looks up exact equality against a lookup table, returning the index of the first match. Find() applies a predicate function, so it handles conditions like `x > 5` or `is.numeric(x)` that match() cannot express. Use match() for value-equality lookups and Find() for predicate-based searches.

**Can Find() use lambda functions in R?**

Yes. From R 4.1, the shorthand `\(x) condition` is a full lambda you can pass directly: `Find(\(x) x > 5, v)`. Before R 4.1, use `function(x) condition`. Both forms work identically; the lambda is just shorter for one-line predicates.

**Is Find() vectorized?**

No. Find() calls the predicate element by element and stops at the first TRUE. For long atomic vectors where the predicate is vectorizable, `x[which(predicate(x))[1]]` is faster because the comparison runs once in C. Find() is most efficient for lists and mixed types where element-wise iteration is unavoidable.
