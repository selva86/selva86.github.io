---
title: "rapply() in R: Recursively Apply Functions to Nested Lists"
slug: "base-rapply-in-R"
description: "Use base R rapply() to apply a function recursively to nested lists. Covers how arguments (replace, list, unlist), classes filter, and 5 real examples."
keywords: "rapply in R, base R rapply, R recursive apply, rapply nested list, rapply examples, rapply vs lapply, rapply unlist"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "rapply()|base rapply|recursive apply|rapply function|nested list apply"
auto_link_case_sensitive: true
target_keyword: "rapply in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# rapply() in R: Recursively Apply Functions to Nested Lists

<p class="lead">The <code>rapply()</code> function in base R is a recursive version of <code>lapply()</code> that walks every level of a nested list and applies a function to each leaf element. Three output modes (<code>replace</code>, <code>list</code>, <code>unlist</code>) let you keep the original structure, flatten the result, or fill unmatched leaves with a default.</p>

[QUICK ANSWER]
rapply(lst, sqrt, how = "replace")                       # apply, preserve nesting
rapply(lst, sqrt, how = "unlist")                        # apply, flatten to vector
rapply(lst, sqrt, how = "list")                          # apply, NULL for unmatched
rapply(lst, fn, classes = "numeric", how = "replace")    # filter leaves by class
rapply(lst, fn, classes = "character", deflt = NA)       # default for skipped
rapply(lst, toupper, classes = "character", how = "unlist")  # only strings, flat
rapply(lst, identity, how = "unlist")                    # flatten with type check

[DECISION TREE: Is rapply() the right tool?]
- recursively apply fn to nested list leaves: rapply()
- apply fn once to a flat list or vector: lapply()
- apply fn and auto-simplify the result: sapply()
- apply fn with strict type and length contract: vapply()
- apply fn pairwise across two or more vectors: mapply()
- apply fn over rows or columns of a matrix: apply()
- modern recursion with positions and pruning: rrapply::rrapply()
- flatten a nested list without applying any function: unlist()

## What rapply() does in one sentence

**`rapply(object, f, classes, deflt, how)` walks every nested branch of a list and applies `f` to each leaf whose class matches `classes`.** The `how` argument decides whether the original nesting is kept, replaced, or flattened into a vector.

A leaf is any element that is not itself a list. Branches are recursed into automatically. This makes rapply the natural choice for transforming numbers buried inside JSON-style nested data, cleaning text inside configuration trees, or rounding every numeric in a fitted-model summary.

## Syntax and arguments

**`rapply(object, f, classes = "ANY", deflt = NULL, how = c("unlist", "replace", "list"), ...)` takes five arguments by name.** Only `object` and `f` are required; the others default to applying `f` to every leaf and unlisting the result.

```r title="Basic recursive apply"
lst <- list(a = 1, b = list(c = 4, d = 9))
rapply(lst, sqrt, how = "replace")
#> $a
#> [1] 1
#>
#> $b
#> $b$c
#> [1] 2
#>
#> $b$d
#> [1] 3
```

The function visits `a`, then descends into `b` and visits `c` and `d`. Each numeric leaf is replaced with its square root and the nested structure stays intact.

| Argument | Purpose | Common values |
|---|---|---|
| `object` | The list (possibly nested) to walk | `list(a=1, b=list(c=2))`, model output, JSON parse |
| `f` | Function applied to each matching leaf | `sqrt`, `toupper`, `function(x) round(x, 2)` |
| `classes` | Vector of class names to act on | `"ANY"` (default), `"numeric"`, `"character"`, `c("numeric","integer")` |
| `deflt` | Value used for unmatched leaves (only when `how != "replace"`) | `NULL` (default), `NA`, any scalar |
| `how` | Output assembly mode | `"unlist"` (default), `"replace"`, `"list"` |

[TIP]
**Pick `how` before writing the call.** Use `"replace"` to keep the tree shape, `"unlist"` for a flat vector, and `"list"` to keep the shape with `deflt` in unmatched leaves. The default is `"unlist"`, which flattens silently and surprises users expecting nesting to survive.

## Five common patterns

### 1. Apply a transform and keep the structure

```r title="Round every numeric, preserve nesting"
cfg <- list(model = list(lr = 0.012345, momentum = 0.987654),
            data  = list(train_frac = 0.83333, test_frac = 0.16667))
rapply(cfg, round, classes = "numeric", deflt = NA, how = "replace", digits = 3)
#> $model
#> $model$lr
#> [1] 0.012
#>
#> $model$momentum
#> [1] 0.988
#>
#>
#> $data
#> $data$train_frac
#> [1] 0.833
#>
#> $data$test_frac
#> [1] 0.167
```

The extra `digits = 3` argument flows through `...` into `round()`. With `how = "replace"`, the nested config keeps its exact original shape and only the numeric leaves change.

### 2. Flatten matched leaves into a vector

```r title="Pull all numerics into a flat vector"
nested <- list(a = 1, b = list(c = 2, d = list(e = 3, f = 4)), g = "skip me")
rapply(nested, function(x) x * 10, classes = "numeric", how = "unlist")
#>  a b.c b.d.e b.d.f
#> 10  20    30    40
```

With `how = "unlist"`, rapply collects every matching leaf into a single vector with dotted names that record the path through the tree. The character leaf `g` is filtered out by `classes = "numeric"`.

### 3. Filter leaves by class and default the rest

```r title="Uppercase only character leaves, NA for the rest"
mixed <- list(name = "alice", age = 30, addr = list(city = "delhi", zip = 110001))
rapply(mixed, toupper, classes = "character", deflt = NA, how = "list")
#> $name
#> [1] "ALICE"
#>
#> $age
#> [1] NA
#>
#> $addr
#> $addr$city
#> [1] "DELHI"
#>
#> $addr$zip
#> [1] NA
```

`how = "list"` keeps the tree shape (like `"replace"`) but writes `deflt` into unmatched leaves. Useful when you need a same-shaped tree filled with markers showing what was processed.

### 4. Use ANY to act on every leaf

```r title="Match every leaf regardless of type"
mixed2 <- list(x = 1L, y = "two", z = list(a = TRUE, b = 3.14))
rapply(mixed2, function(v) paste(class(v), v, sep = ":"), classes = "ANY", how = "unlist")
#>             x             y           z.a           z.b
#> "integer:1" "character:two" "logical:TRUE" "numeric:3.14"
```

Setting `classes = "ANY"` (the default) makes rapply visit every leaf no matter the type. Here we tag each leaf with its class to inspect a deeply mixed structure.

### 5. Clean a model summary tree

```r title="Round every numeric inside lm summary"
fit <- lm(mpg ~ wt + hp, data = mtcars)
s <- summary(fit)
rounded <- rapply(s, round, classes = c("numeric", "matrix"), deflt = NA,
                  how = "replace", digits = 2)
rounded$coefficients
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    37.23       1.60   23.28        0
#> wt             -3.88       0.63   -6.13        0
#> hp             -0.03       0.01   -3.52        0
```

A `summary.lm` object is a nested list with numerics, matrices, and language objects mixed together. `classes = c("numeric", "matrix")` rounds the numeric pieces while leaving non-numeric branches untouched.

[KEY INSIGHT]
**rapply is `lapply` plus recursion plus a leaf-type filter.** The three `how` modes are the same idea wearing different hats: replace keeps the tree, list keeps the tree but marks skipped leaves with `deflt`, unlist throws structure away in favour of a flat named vector. Pick the mode that matches what you plan to do with the result.

## rapply() vs lapply, sapply, and rrapply

**Each function answers a different recursion question.** The table below sorts the apply family by recursion depth and output handling.

| Function | Recursion | Output | Use when |
|---|---|---|---|
| `rapply()` | YES, descends into sublists | Tree (replace/list) or flat vector (unlist) | Transforming leaves inside arbitrarily nested lists |
| `lapply()` | NO, one level only | Always a list | Mapping over a flat list or vector |
| `sapply()` | NO, one level only | Auto-simplified vector, matrix, or list | Quick interactive apply on flat input |
| `vapply()` | NO, one level only | Type-checked vector or matrix | Production code with shape guarantees |
| `rrapply::rrapply()` | YES, with positions and pruning | Tree, flat, or data-frame | Modern recursion needing access to node names or paths |

The mental model: reach for `rapply()` whenever the input has nested lists and you need EVERY leaf touched. Stick with `lapply()`/`sapply()` for a single-level apply. Switch to `rrapply` from the `rrapply` package when you need richer features like conditional pruning or extracting paths.

[WARNING]
**rapply's `how = "list"` and `how = "unlist"` need an explicit `deflt`.** Without it, unmatched leaves become `NULL` in list mode and are silently dropped in unlist mode. The result vector can be shorter than expected, with no warning. Always set `deflt = NA` (or another sentinel) when filtering by `classes` and using `list` or `unlist`.

## Common pitfalls

**Three quirks of rapply catch most users off guard.** Knowing them up front saves debugging time.

### Pitfall 1: Data frames are atomic leaves, not branches

**rapply treats a data frame as a single leaf, not as a list to recurse into.** Even though a data frame is technically a list under the hood, rapply stops descent at the data frame boundary.

```r title="Data frame is one leaf"
lst <- list(meta = "experiment 1", data = data.frame(x = 1:3, y = 4:6))
rapply(lst, length, how = "unlist")
#>        meta        data
#>           1           2
```

The data frame returns `length(data) == 2` (its column count), not the length of each column. To recurse INTO columns, wrap the frame with `as.list()` first or use `rrapply` with custom class handling.

### Pitfall 2: Names get path-flattened with dots

**With `how = "unlist"`, leaf names become dot-separated paths from the root.** This is by design but breaks code that expects original short names.

```r title="Unlist mode mangles names"
lst <- list(group1 = list(x = 1, y = 2), group2 = list(x = 3, y = 4))
rapply(lst, function(v) v * 100, how = "unlist")
#> group1.x group1.y group2.x group2.y
#>      100      200      300      400
```

To recover original names, run `setNames(result, original_names)` or use `how = "replace"` and pull names from the structure afterward.

### Pitfall 3: `classes = "numeric"` does not match integers

**Integer leaves are skipped when `classes = "numeric"`.** R's class system treats `integer` and `numeric` (which is `double`) as distinct, and `rapply` checks the class string exactly.

```r title="Integers need explicit inclusion"
lst <- list(a = 1L, b = 2.5, c = 3L)
rapply(lst, sqrt, classes = "numeric", deflt = NA, how = "unlist")
#>        a        b        c
#>       NA 1.581139       NA
```

Use `classes = c("numeric", "integer")` (or `"ANY"` for everything) to catch both. The same trap applies to `Date`, `POSIXct`, and other typed leaves.

## Try it yourself

**Try it:** Use `rapply()` to round every numeric leaf inside the nested list `ex_input` below to 1 decimal place, preserving the structure. Save the result to `ex_out`.

```r title="Your turn: round numerics in a nested list"
# Try it: round numerics, keep structure
ex_input <- list(model = list(lr = 0.12345, beta = 0.98765),
                 score = 0.5555,
                 label = "run-A")
ex_out <- # your code here

ex_out
#> Expected: same shape as ex_input, numerics rounded to 1 decimal, label unchanged
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_out <- rapply(ex_input, round, classes = "numeric",
                 deflt = NA, how = "replace", digits = 1)
ex_out
#> $model
#> $model$lr
#> [1] 0.1
#>
#> $model$beta
#> [1] 1
#>
#>
#> $score
#> [1] 0.6
#>
#> $label
#> [1] "run-A"
```

**Explanation:** `how = "replace"` preserves the original tree shape. `classes = "numeric"` filters leaves so only numerics are passed to `round()`. The character leaf `label` is left untouched because `"replace"` ignores `deflt` and keeps unmatched leaves as-is. The trailing `digits = 1` flows through `...` into `round()`.

</details>

## Related apply functions in R

- [base lapply](base-lapply-in-R.html): single-level apply that always returns a list.
- [base sapply](base-sapply-in-R.html): single-level apply with auto-simplification.
- [base vapply](base-vapply-in-R.html): single-level apply with a strict type and length contract.
- [base mapply](base-mapply-in-R.html): apply across multiple parallel vectors.
- [Functional Programming in R](Functional-Programming-in-R.html): the broader hub covering apply, Reduce, Filter, Map, and recursion patterns.

External reference: the [R Language Definition on rapply](https://stat.ethz.ch/R-manual/R-devel/library/base/html/rapply.html) is the canonical source for argument semantics and the recursion algorithm.

## FAQ

**What does rapply do in R?**

`rapply()` is the recursive version of `lapply()`. It walks every level of a nested list and applies a function to each leaf (anything that is not itself a list). The `classes` argument picks which leaves are visited, `deflt` controls skipped leaves, and `how` decides whether the result keeps the nested shape or flattens to a vector. It is built into base R; no package is required.

**What is the difference between rapply and lapply?**

`lapply()` applies a function to each top-level element of a list and returns a list of the same length. It does NOT descend into sublists. `rapply()` descends recursively into every sublist and applies the function only to leaf elements. Use `lapply` for a flat one-level traversal and `rapply` when the input has nested structure and every leaf needs transformation.

**What are the how arguments in rapply (replace, list, unlist)?**

`how = "replace"` keeps the original nesting and substitutes matched leaves with the function result; unmatched leaves stay as-is. `how = "list"` keeps the structure but writes `deflt` into unmatched leaves. `how = "unlist"` discards the structure and collects matched leaves into a flat named vector. Default is `"unlist"`, which surprises new users.

**Can rapply handle data frames inside a list?**

`rapply()` treats a data frame as a single LEAF, not as a list to recurse into. To apply a function across data-frame columns, either wrap the frame with `as.list()` before calling rapply or call `lapply()` on the frame directly. The `rrapply` package extends base rapply with finer control over which list-like classes count as branches.
