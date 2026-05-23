---
title: "vapply() in R: Type-Safe Apply With Guaranteed Output"
slug: "base-vapply-in-R"
description: "Use base R vapply() to apply a function with a type-safe output template. Covers FUN.VALUE, NA handling, vapply vs sapply, pitfalls, and five real examples."
keywords: "vapply in R, vapply vs sapply, base R vapply, vapply FUN.VALUE, R type-safe apply, vapply examples, vapply numeric(1)"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "vapply()|base vapply|vapply function|type-safe apply|FUN.VALUE"
auto_link_case_sensitive: true
target_keyword: "vapply in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# vapply() in R: Type-Safe Apply With Guaranteed Output

<p class="lead">The <code>vapply()</code> function in base R applies a function to each element of a list or vector while enforcing a TEMPLATE for the expected output type and length. It is the safer, production-ready sibling of <code>sapply()</code> that errors loudly instead of silently changing shape.</p>

[QUICK ANSWER]
vapply(1:5, sqrt, numeric(1))                        # scalar numeric per call
vapply(1:5, function(x) x^2, double(1))              # explicit double scalar
vapply(letters[1:3], toupper, character(1))          # scalar character per call
vapply(1:4, function(x) c(x, x^2), numeric(2))       # length-2 vector per call
vapply(list(1:3, 4:6), range, numeric(2))            # min/max pair per element
vapply(1:5, is.numeric, logical(1))                  # logical scalar per call
vapply(x, fn, numeric(1), USE.NAMES = FALSE)         # drop result names

[DECISION TREE: Is vapply() the right tool?]
- apply fn, want type-safe vector or matrix: vapply()
- apply fn, want flexible auto-simplification: sapply()
- apply fn, always want a list back: lapply()
- apply fn pairwise across two or more vectors: mapply()
- apply fn over matrix rows or columns: apply()
- functional-programming style with type checks: purrr::map_dbl, map_chr, map_lgl
- aggregate by a grouping factor: tapply()

## What vapply() does in one sentence

**`vapply(X, FUN, FUN.VALUE)` calls FUN on each element of X and checks that every result matches the type and length of FUN.VALUE.** If a call returns a different type or length, vapply throws an error instead of returning a list silently.

This guarantee is the whole point. Where sapply() can hand you a numeric vector today and a list tomorrow because one element changed shape, vapply locks the contract up front and fails fast when reality diverges.

## Syntax and arguments

**`vapply(X, FUN, FUN.VALUE, ..., USE.NAMES = TRUE)` requires four arguments by name.** X is a list or vector; FUN is the function applied to each element; FUN.VALUE is the template prototype for the expected return value.

```r title="Apply with a numeric scalar template"
vapply(1:5, function(x) x^2, numeric(1))
#> [1]  1  4  9 16 25
```

The template `numeric(1)` says "every call must return one numeric value." If even one call returns a length-2 vector or a character, vapply errors before producing any output.

| Argument | Purpose | Common values |
|---|---|---|
| `X` | Input list or vector | `1:10`, `list(a=1, b=2)`, `letters` |
| `FUN` | Function applied to each element | `sqrt`, `function(x) x^2`, `is.numeric` |
| `FUN.VALUE` | Type and length template | `numeric(1)`, `character(1)`, `logical(1)`, `numeric(2)` |
| `...` | Extra args passed to FUN | `na.rm = TRUE` for `mean` |
| `USE.NAMES` | Carry input names to output | `TRUE` (default), `FALSE` to drop |

[TIP]
**Read FUN.VALUE as a contract, not a hint.** `numeric(1)` means EXACTLY one numeric per call. To allow a length-3 numeric output, write `numeric(3)`. To allow integers and floats interchangeably, use `numeric(1)` (which accepts both, since integers coerce to double).

## Five common patterns

### 1. Scalar numeric output per element

```r title="Squareroot with type safety"
vapply(c(4, 9, 16, 25), sqrt, numeric(1))
#> [1] 2 3 4 5
```

Identical output to `sapply(c(4,9,16,25), sqrt)`, but vapply guarantees the return is always a length-4 numeric vector. The template is the safety net.

### 2. Scalar character output

```r title="Uppercase each letter"
vapply(c("a", "b", "c"), toupper, character(1))
#>   a   b   c
#> "A" "B" "C"
```

Use `character(1)` when each call returns one string. Names are preserved by default from the input vector.

### 3. Vector output of fixed length (becomes a matrix)

```r title="Return min and max per list element"
vapply(list(1:5, 6:10, c(100, 200)), range, numeric(2))
#>      [,1] [,2] [,3]
#> [1,]    1    6  100
#> [2,]    5   10  200
```

When FUN.VALUE has length > 1, vapply assembles a matrix with one column per input element. The template `numeric(2)` locks every call to return exactly 2 numerics.

### 4. Logical predicate per element

```r title="Test which elements are numeric"
mixed <- list(1, "x", TRUE, 2.5, NA)
vapply(mixed, is.numeric, logical(1))
#> [1]  TRUE FALSE FALSE  TRUE FALSE
```

A `logical(1)` template is the standard pattern for predicate functions. The result is always a clean logical vector, never a list.

### 5. Pass extra arguments to FUN

```r title="Mean with na.rm forwarded through ..."
xs <- list(c(1, 2, NA), c(4, 5, 6), c(NA, NA, 7))
vapply(xs, mean, numeric(1), na.rm = TRUE)
#> [1] 1.5 5.0 7.0
```

Anything after FUN.VALUE flows into FUN as additional named arguments. Here `na.rm = TRUE` reaches `mean()` for every call.

[KEY INSIGHT]
**vapply is a TYPE CHECK at the boundary of your data and your function.** It does the same work as sapply, then asserts the result shape matches what you promised. Treat the FUN.VALUE template as a runtime test, not as decoration.

## vapply() vs sapply(), lapply(), and mapply()

**Each member of the apply family trades safety for convenience differently.** The table below shows when vapply is preferred.

| Function | Output type | Type-checked? | Use when |
|---|---|---|---|
| `vapply()` | Vector or matrix, fixed by FUN.VALUE | YES, errors on mismatch | Production code, package internals, reusable utilities |
| `sapply()` | Auto-simplified vector, matrix, or list | NO, silently returns list on mismatch | Interactive exploration where output shape is obvious |
| `lapply()` | Always a list | N/A, no simplification | Inputs return varying shapes; want list for further processing |
| `mapply()` | Multivariate apply across multiple vectors | NO | FUN takes multiple arguments and each comes from a parallel vector |

The mental model: write `vapply()` in any code that another person, future you, or a unit test will read. Use `sapply()` only at the REPL.

[WARNING]
**`sapply()` can silently return a list when one input deviates.** If your function usually returns a scalar but occasionally returns NULL, sapply hands back a list and downstream code that expected a vector breaks far from the cause. `vapply()` would have errored at the call site, with a clear message about which element broke the contract.

## Common pitfalls

**Three vapply errors trip up most beginners.** Understanding the message saves debugging time.

### Pitfall 1: FUN.VALUE shape does not match returned values

**Length mismatches throw a clear error citing the offending element.** This is the most common vapply failure for users coming from sapply.

```r title="Length mismatch errors loudly"
# vapply(1:3, function(x) c(x, x^2), numeric(1))
#> Error in vapply(1:3, function(x) c(x, x^2), numeric(1)) :
#>   values must be length 1, but FUN(X[[1]]) result is length 2
```

The function returned 2 values per call but the template promised 1. Fix by writing `numeric(2)`.

### Pitfall 2: Type coercion is not allowed

**Vapply checks the exact storage mode of each result, not the broader numeric category.** Mixing integer and double templates with double and integer outputs triggers an error.

```r title="Integer vs double matters here"
# vapply(c("1", "2"), as.numeric, integer(1))
#> Error in vapply(c("1", "2"), as.numeric, integer(1)) :
#>   values must be type 'integer', but FUN(X[[1]]) result is type 'double'
```

`as.numeric` returns doubles, not integers, even when the string parses to a whole number. Use `numeric(1)` or `double(1)` instead of `integer(1)`.

### Pitfall 3: Empty input returns a zero-length vector of the template type

**Empty inputs do not error; vapply returns an empty result of the templated type.** This is consistent with the apply family but often surprises new users.

```r title="Empty input behavior"
vapply(integer(0), sqrt, numeric(1))
#> numeric(0)
```

Vapply on an empty input does NOT error; it returns an empty vector of the template type. This is correct behavior but surprises users who expect an error. Always pair with `length(X) > 0` guards when zero-length input is unexpected.

## Try it yourself

**Try it:** Use `vapply()` on the built-in `iris` dataset to compute the mean of each numeric column. Save the result to `ex_means`.

```r title="Your turn: column means with vapply"
# Try it: column means of iris numeric columns
ex_means <- # your code here

ex_means
#> Expected: 4 named numerics for Sepal.Length, Sepal.Width, Petal.Length, Petal.Width
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_means <- vapply(iris[, 1:4], mean, numeric(1))
ex_means
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>     5.843333     3.057333     3.758000     1.199333
```

**Explanation:** `iris[, 1:4]` is a data frame, which behaves as a list of column vectors. `vapply()` iterates over the four numeric columns, calls `mean()` on each, and the `numeric(1)` template guarantees one numeric per column. Names come from the column names.

</details>

## Related apply functions in R

- [base sapply](base-sapply-in-R.html): the auto-simplifying sibling without type checks.
- [base lapply](base-lapply-in-R.html): always returns a list, no simplification.
- [base mapply](base-mapply-in-R.html): apply across multiple vectors in parallel.
- [base apply](base-apply-in-R.html): apply over rows or columns of a matrix.
- [Functional Programming in R](Functional-Programming-in-R.html): the broader hub covering apply, Reduce, Filter, and Map.

External reference: the [R Language Definition on vapply](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html) covers the full argument signature on the same page as lapply and sapply.

## FAQ

**What is the difference between vapply and sapply in R?**

`vapply()` requires a FUN.VALUE template that locks the expected output type and length, and errors if any call returns a different shape. `sapply()` tries to simplify the result automatically and silently falls back to a list if the function returns inconsistent shapes. Use vapply in production code where output shape must be predictable; use sapply at the REPL for quick exploration.

**Why is vapply faster than sapply?**

`vapply()` is marginally faster because it pre-allocates the output container using the FUN.VALUE template, skipping the type-detection logic that sapply runs after each call. The speedup is real but small (often 5 to 15 percent on tight loops over short vectors). The bigger win is correctness, not speed.

**What does numeric(1) mean as the FUN.VALUE in vapply?**

`numeric(1)` is a zero-filled length-1 numeric vector that serves as a TEMPLATE. It tells vapply: "every call to FUN must return exactly one numeric value." The actual zero is never used; only the type (double) and length (1) are checked against each FUN result. Common templates are `numeric(1)`, `character(1)`, `logical(1)`, and `integer(1)`.

**Can vapply return a matrix?**

Yes. When FUN.VALUE has length greater than 1, vapply assembles results into a matrix with one column per input element. For example, `vapply(list(1:5, 6:10), range, numeric(2))` returns a 2-by-2 matrix where row 1 is the min and row 2 is the max for each input list element.

**Does vapply work with NA values?**

`vapply()` does not handle NA specially; it passes elements through to FUN as-is. If your function returns NA, that NA flows into the result, which is still considered to match a `numeric(1)` template because `NA_real_` is of type double. To skip NAs inside FUN, pass `na.rm = TRUE` through the `...` argument as you would with sapply.
