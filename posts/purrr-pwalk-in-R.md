---
title: "purrr pwalk() in R: Side Effects Over Parallel Lists"
slug: purrr-pwalk-in-R
description: "Learn purrr pwalk() in R to run side effects over three or more parallel lists. Examples cover data frame rows, file writing, and pwalk vs pmap differences."
keywords: "purrr pwalk, pwalk function R, purrr pwalk examples, R pwalk parallel, pwalk vs pmap, purrr pwalk data frame"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: pwalk()|purrr pwalk|purrr::pwalk()|pwalk function|pwalk in R
auto_link_case_sensitive: true
target_keyword: purrr pwalk
sibling_block_enabled: true
difficulty: Beginner
---

# purrr pwalk() in R: Side Effects Over Parallel Lists

<p class="lead">purrr pwalk() in R applies a function to three or more parallel lists for their side effects, then returns the input list invisibly. It is the side-effect cousin of pmap().</p>

[QUICK ANSWER]
pwalk(list(x, y, z), f)               # 3+ parallel inputs
pwalk(df, f)                          # iterate data frame rows
pwalk(list(a, b), ~ cat(..1, ..2))    # formula shorthand
pwalk(list(base = b, exp = e), fun)   # named list, matched by arg name
pwalk(args, f, sep = ", ")            # extra args after .f
walk2(x, y, f)                        # exactly two inputs

[DECISION TREE: Is pwalk() the right tool?]
- run side effects over 3+ parallel inputs: pwalk(list(a, b, c), f)
- need a return value, not side effects: pmap(list(a, b, c), f)
- exactly two parallel inputs: walk2(x, y, f)
- a single input vector: walk(x, f)
- side effects with the element index: iwalk(x, ~ ...)
- combine results into a data frame: pmap_dfr(df, f)

## What pwalk() does in one sentence

**pwalk() runs a function for its side effects across any number of parallel inputs.** You hand it a list of equal-length vectors (or a data frame), and it calls the function once per position, drawing one value from each vector. Side effects mean printing, plotting, writing files, or logging: actions whose value is the action itself, not a returned object. Unlike [pmap()](purrr-pmap-in-R.html), which collects results into a list, pwalk() throws the return values away and hands back the original input invisibly so it slots cleanly into a pipeline.

## Syntax

**The signature has two required arguments plus a passthrough.** The `p` prefix stands for parallel, and `walk` marks it as a side-effect function.

```r title="The pwalk function signature"
pwalk(.l, .f, ...)
```

- `.l` is a list of vectors, or a data frame. Every element must be the same length. Each element supplies one argument to `.f`.
- `.f` is the function to call. It accepts a plain function, an anonymous function, or a purrr formula using `..1`, `..2`, `..3` for the positional inputs.
- `...` holds extra named arguments. They are passed unchanged to every call of `.f`.

**The length of `.l` decides how many arguments `.f` receives.** A list of three vectors calls a three-argument function. If `.l` is named, the names are matched to the function's argument names, so order does not matter.

[KEY INSIGHT]
**A data frame is already a list of equal-length columns.** That is why `pwalk(df, f)` iterates over rows for free: each column becomes one argument, and each row supplies one set of values.

## Common use cases

**The four patterns below cover most real uses of pwalk().** Each runs on built-in data so you can execute it as is.

### 1. Iterate over data frame rows

**Pass a data frame straight to pwalk() to walk its rows.** Column names line up with the function's argument names.

```r title="Iterate over data frame rows"
library(purrr)

cars <- data.frame(
  model = c("Mazda RX4", "Datsun 710", "Valiant"),
  mpg   = c(21.0, 22.8, 18.1),
  cyl   = c(6, 4, 6)
)

pwalk(cars, function(model, mpg, cyl) {
  cat(model, "->", mpg, "mpg,", cyl, "cylinders\n")
})
#> Mazda RX4 -> 21 mpg, 6 cylinders
#> Datsun 710 -> 22.8 mpg, 4 cylinders
#> Valiant -> 18.1 mpg, 6 cylinders
```

The function ran once per row and printed a formatted line. Nothing was returned because printing is a side effect.

### 2. Three parallel vectors with formula shorthand

**Wrap loose vectors in `list()` when they are not already a data frame.** The formula form uses `..1`, `..2`, `..3` to reach each input.

```r title="Three parallel vectors"
product  <- c("Pencil", "Notebook", "Eraser")
price    <- c(0.50, 2.75, 0.30)
quantity <- c(12, 4, 8)

pwalk(list(product, price, quantity),
      ~ cat(sprintf("%-9s %2d x $%.2f = $%.2f\n", ..1, ..3, ..2, ..2 * ..3)))
#> Pencil    12 x $0.50 = $6.00
#> Notebook   4 x $2.75 = $11.00
#> Eraser     8 x $0.30 = $2.40
```

### 3. Pass extra arguments after the function

**Anything after `.f` is forwarded to every call.** Here a shared output folder is constant across all three writes.

```r title="Write files with extra arguments"
dir   <- tempdir()
names <- c("alpha", "beta", "gamma")
lines <- c("first file", "second file", "third file")

pwalk(list(names, lines), function(name, line, folder) {
  writeLines(line, file.path(folder, paste0(name, ".txt")))
}, folder = dir)

list.files(dir, pattern = "\\.txt$")
#> [1] "alpha.txt" "beta.txt"  "gamma.txt"
```

The `folder` argument was supplied once through `...` and reused for every file.

### 4. Match arguments with a named list

**Name the elements of `.l` and pwalk() matches them to argument names.** Order in the list no longer matters.

```r title="Named list matches arguments by name"
inputs <- list(
  exponent = c(2, 3, 4),
  base     = c(10, 2, 3)
)

pwalk(inputs, function(base, exponent) {
  cat(base, "^", exponent, "=", base ^ exponent, "\n")
})
#> 10 ^ 2 = 100
#> 2 ^ 3 = 8
#> 3 ^ 4 = 81
```

## pwalk() vs pmap() vs walk2()

**Pick the function by input count and whether you need a return value.** All three iterate in parallel; they differ in arity and output.

| Function | Inputs | Returns | Use when |
|----------|--------|---------|----------|
| `pwalk()` | 3 or more (a list) | `.l` invisibly | Side effects over many parallel inputs |
| `pmap()` | 3 or more (a list) | A list of results | You need the computed values back |
| `walk2()` | Exactly 2 | `.x` invisibly | Side effects over two inputs only |

**Decision rule:** if you want the results, use [pmap()](purrr-pmap-in-R.html). If you only want the side effect and you have three or more inputs, use pwalk(). With exactly two inputs, [walk2()](purrr-walk2-in-R.html) reads more clearly than wrapping them in a list.

[NOTE]
**pwalk() generalizes walk2().** `walk2(x, y, f)` is equivalent to `pwalk(list(x, y), f)`. Reach for pwalk() the moment a third input appears.

## Common pitfalls

**Most pwalk() errors trace back to mismatched lengths or names.** Three mistakes account for nearly all of them.

```r title="Pitfall: unequal input lengths"
pwalk(list(c(1, 2, 3), c(10, 20)), ~ cat(..1 + ..2, ""))
#> Error in `pwalk()`:
#> ! Element 2 of `.l` must have the same length as element 1.
```

Every vector in `.l` must share one length (or be length 1, which recycles). Trim or pad inputs before the call.

[WARNING]
**Named list elements must match the function's argument names exactly.** If you write `pwalk(list(a = x, b = y), function(p, q) ...)`, R cannot match `a` to `p` and the call fails. Either drop the names for positional matching or align them.

The third trap is expecting output. `result <- pwalk(...)` gives you back `.l`, not the values your function computed. Switch to `pmap()` when you need results collected.

## Try it yourself

**Try it:** Use pwalk() to print one line per row of a small data frame holding three fruit names and three prices. Save the data frame to `ex_fruit` first.

```r title="Your turn: pwalk over a data frame"
# Try it: build the data frame, then pwalk over it
ex_fruit <- # your code here

ex_fruit
#> Expected: 3 printed lines, one per fruit
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fruit <- data.frame(
  fruit = c("Apple", "Banana", "Cherry"),
  price = c(0.40, 0.25, 0.80)
)

pwalk(ex_fruit, function(fruit, price) {
  cat(fruit, "costs $", price, "\n")
})
#> Apple costs $ 0.4
#> Banana costs $ 0.25
#> Cherry costs $ 0.8
```

**Explanation:** The data frame is a list of two equal-length columns, so pwalk() calls the function once per row with `fruit` and `price` matched by name.

</details>

## Related purrr functions

- [pmap()](purrr-pmap-in-R.html) returns a list of results from parallel inputs.
- [walk2()](purrr-walk2-in-R.html) runs side effects over exactly two inputs.
- [walk()](purrr-walk-in-R.html) handles the single-input side-effect case.
- [iwalk()](purrr-iwalk-in-R.html) walks one input with access to its index or names.
- [imap()](purrr-imap-in-R.html) maps over an input and its index together.

## FAQ

**What is the difference between pwalk() and pmap()?**

Both iterate over a list of parallel inputs. `pmap()` collects what the function returns into a result list, so you use it for transformations. `pwalk()` discards return values and hands back the input list invisibly, so you use it for side effects like printing or writing files. If you find yourself ignoring the output of `pmap()`, switch to `pwalk()` to signal intent.

**How does pwalk() handle a data frame?**

A data frame is internally a list of equal-length columns. When you pass one to `pwalk()`, each column becomes one argument and each row supplies one set of values. The column names are matched to your function's argument names, which makes `pwalk(df, f)` a clean way to iterate over rows without `apply()` or an explicit loop.

**Can pwalk() pass extra arguments to the function?**

Yes. Any named argument placed after `.f` is forwarded through `...` to every call. This is useful for values that stay constant across iterations, such as an output directory, a separator, or a connection. The constant argument is not part of `.l`, so it is not iterated.

**Why does pwalk() return nothing visible?**

`pwalk()` returns its input `.l` invisibly by design. Side-effect functions should not clutter the console with output, and returning `.l` lets pwalk() sit inside a pipe without breaking the chain. Wrap the call in `invisible()`-aware code or assign the result if you genuinely need the original list back.
