---
title: "purrr lift() in R: Change Function Argument Style"
slug: purrr-lift-in-R
description: "purrr lift() in R converts a function between dots, list, and vector argument styles. Learn lift_dl, lift_dv, lift_ld with examples and modern alternatives."
keywords: "purrr lift, lift function R, purrr lift examples, lift_dl R, lift_dv purrr, do.call alternative R, convert function arguments R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "lift()|purrr lift|purrr::lift()|lift_dl()|lift_dv()"
auto_link_case_sensitive: true
target_keyword: "purrr lift"
sibling_block_enabled: true
difficulty: Intermediate
---

# purrr lift() in R: Change Function Argument Style

<p class="lead">The purrr lift() function in R adapts a function so it accepts its arguments in a different shape: as a single list, a single vector, or individual dots. It is a thin wrapper around <code>do.call()</code> for functional pipelines.</p>

[QUICK ANSWER]
lift(sum)(list(1, 2, 3))             # alias of lift_dl
lift_dl(sum)(list(1, 2, 3))          # dots-fn  -> takes a list
lift_dv(paste)(c("a", "b", "c"))     # dots-fn  -> takes a vector
lift_ld(concat)(1, 2, 3)             # list-fn  -> takes dots
lift_vd(g_vec)(1, 2, 3)              # vector-fn -> takes dots
map_dbl(params, lift_dl(sum))        # apply across a list of arg-lists
do.call(sum, list(1, 2, 3))          # base R equivalent

[DECISION TREE: Is lift() the right tool?]
- change a function's argument interface: lift_dl(sum)
- call a function once with a list: do.call(f, args)
- apply a function over aligned columns: pmap(df, f)
- pre-fill some arguments of a function: partial(f, n = 1)
- chain several functions together: compose(sqrt, abs)
- run a function over each list element: map(x, f)

## What purrr lift() does

**lift() converts the argument interface of a function.** Some R functions take their inputs as loose dots, like `sum(1, 2, 3)`. Others want a single list or vector, like `mean(c(1, 2, 3))`. The `lift()` family rewrites a function so the calling style matches whatever your data already looks like.

This matters inside functional pipelines. When you carry parameters around as lists, a dots-based function will not accept them directly. `lift()` bridges that gap so the function slots into `map()`, `reduce()`, or a `%>%` chain without a manual wrapper.

[WARNING]
**The lift() family is deprecated as of purrr 1.0.0.** It still runs and emits a deprecation warning. For new code, use an anonymous function around `do.call()` instead. The examples below explain the behaviour you will still meet in older codebases and show the modern replacement.

## The lift() function family and syntax

**Each lift variant is named for a direction.** The pattern is `lift_<from><to>`, where `d` means dots, `l` means list, and `v` means vector. `lift_dl()` takes a function whose original interface is dots and returns one that takes a list.

```r title="The lift family at a glance"
library(purrr)

# lift(..f)      alias of lift_dl()
# lift_dl(..f)   dots   -> list
# lift_dv(..f)   dots   -> vector
# lift_ld(..f)   list   -> dots
# lift_vd(..f)   vector -> dots
# lift_lv(..f)   list   -> vector
# lift_vl(..f)   vector -> list
```

Every variant returns a **new function**. You call `lift_dl(sum)` once to build the adapter, then call that adapter with your data. Reading the suffix tells you the call style before and after: the first letter is what `..f` already expects, the second is what the lifted function will expect.

[KEY INSIGHT]
**Read the suffix as "from-to".** `lift_dl` lifts a dots function so it reads from a list. `lift_ld` does the reverse. Get the direction wrong and the adapter calls your function with the wrong argument shape, which usually fails silently rather than erroring.

## lift() examples by use case

**Start with lift_dl(), the most common variant.** `sum()` accepts dots, so wrapping it with `lift_dl()` produces a function that sums the contents of a list in one call.

```r title="Lift a dots function to take a list"
sum_list <- lift_dl(sum)
sum_list(list(1, 2, 3, 4))
#> [1] 10

# lift() with no suffix is the same thing
lift(sum)(list(5, 10, 15))
#> [1] 30
```

`lift_dv()` does the same job for a vector instead of a list. The difference is visible with `paste()`, which behaves differently when fed dots versus a single vector.

```r title="Lift to take a vector with lift_dv"
paste(c("R", "is", "great"))
#> [1] "R"     "is"    "great"

lift_dv(paste)(c("R", "is", "great"))
#> [1] "R is great"
```

The plain call vectorises over the input, while `lift_dv()` spreads each element into a separate argument, so `paste()` joins them. `lift_ld()` runs the opposite conversion: it takes a function that wants a list and lets you call it with loose arguments.

```r title="Lift a list function to take dots"
concat <- function(parts) paste(parts, collapse = "-")
concat(list("a", "b", "c"))
#> [1] "a-b-c"

lift_ld(concat)("a", "b", "c")
#> [1] "a-b-c"
```

The real payoff arrives with `map()`. When each element of a list is itself a bundle of arguments, a lifted function applies cleanly across all of them.

```r title="Apply a lifted function with map"
params <- list(list(1, 2, 3), list(10, 20, 30))
map_dbl(params, lift_dl(sum))
#> [1]  6 60
```

## lift() vs do.call() vs pmap()

**lift() is do.call() reshaped for pipelines.** `do.call()` invokes a function once with an argument list. `lift()` returns a reusable function you can pass around. `pmap()` is the modern tool when your arguments line up as parallel columns.

| Tool | Returns | Best when |
|---|---|---|
| `do.call(f, args)` | The result, immediately | You call `f` once with a known list |
| `lift_dl(f)` | A new function | You need a reusable adapter |
| `pmap(list, f)` | A list of results | Arguments are aligned vectors or columns |

[NOTE]
**The modern replacement is a one-line anonymous function.** Instead of `lift_dl(sum)`, write `\(args) do.call(sum, args)`. It is explicit, has no dependency on a deprecated API, and reads clearly to anyone who knows base R.

```r title="Modern replacement without lift"
lift_modern <- function(f) function(args) do.call(f, args)
lift_modern(sum)(list(1, 2, 3, 4))
#> [1] 10
```

## Common pitfalls

**Mistake 1: lifting a function that does not take dots.** `mean()` expects a single argument `x`. Lifting it and passing several values silently drops the extras.

```r title="Lifting a non-dots function misfires"
lift_dl(mean)(list(1, 2, 3))
#> [1] 1
```

`do.call(mean, list(1, 2, 3))` matches `1` to `x` and ignores the rest, so the result is `mean(1)`. Only lift functions whose signature genuinely accepts `...`.

**Mistake 2: confusing the suffix direction.** `lift_dl()` and `lift_ld()` are not interchangeable. Pick the variant whose first letter matches the function you already have.

**Mistake 3: assuming lift() is current.** On purrr 1.0.0 and later, every `lift_*` call prints a deprecation warning. In a clean codebase, migrate to `do.call()` or `pmap()` before the family is removed.

## Try it yourself

**Try it:** Use a lift variant to find the maximum value stored inside a list. Save the result to `ex_max`.

```r title="Your turn: lift max over a list"
# Try it: lift max() to accept a list
ex_max <- # your code here

ex_max
#> Expected: 9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_max <- lift_dl(max)(list(4, 9, 2, 7))
ex_max
#> [1] 9
```

**Explanation:** `max()` accepts dots, so `lift_dl()` builds an adapter that reads the values from a list and calls `max(4, 9, 2, 7)`.

</details>

## Related purrr functions

**lift() sits among purrr's function adapters.** These tools all transform functions rather than data:

- `partial()` pre-fills some arguments of a function and returns a simpler one.
- `compose()` chains several functions into a single pipeline function.
- `negate()` flips the result of a TRUE/FALSE predicate.
- `pmap()` maps a function over parallel lists or data frame columns.
- `exec()` calls a function by name with arguments supplied as dots or a list.

## FAQ

**What does purrr lift() do?**

`lift()` takes a function and returns a new function that accepts its arguments in a different shape. By default it behaves like `lift_dl()`: a function that originally took loose dots becomes one that takes a single list. Internally it is a wrapper around `do.call()`, so the lifted function unpacks the list and passes each element as a separate argument to the original function.

**Is lift() deprecated in purrr?**

Yes. The entire `lift_*` family was deprecated in purrr 1.0.0, released in late 2022. The functions still work but print a deprecation warning each time you call them. The maintainers recommend replacing them with an explicit anonymous function around `do.call()`, such as `\(args) do.call(f, args)`, which has the same effect with no deprecated dependency.

**What is the difference between lift_dl and lift_dv?**

Both lift a dots-based function, but they differ in what the new function accepts. `lift_dl()` produces a function that takes a single list, while `lift_dv()` produces one that takes a single vector. Use `lift_dl()` when your data is a list and `lift_dv()` when it is an atomic vector. The conversion direction in both cases is dots to a single container.

**How is lift() different from do.call()?**

`do.call()` invokes a function immediately with one argument list and returns the result. `lift()` does not call anything right away. It returns a reusable function that you can name, store, or pass into `map()` and `reduce()`. Think of `lift()` as `do.call()` packaged as a function operator, suited to functional pipelines rather than one-off calls.

## Related Reading

For the broader picture, see the [Functional Programming in R](Functional-Programming-in-R.html) guide.
