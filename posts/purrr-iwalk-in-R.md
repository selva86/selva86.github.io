---
title: "purrr iwalk() in R: Walk a List With Its Names"
slug: "purrr-iwalk-in-R"
description: "Use purrr iwalk() in R to run a function over each value and its name or index for side effects. Covers syntax, examples, iwalk vs walk2 vs imap, and pitfalls."
keywords: "purrr iwalk, iwalk function R, purrr iwalk example, iwalk vs walk2, R iwalk index, imap walk, iwalk write files"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr iwalk|iwalk()|purrr::iwalk()|indexed walk|iwalk function"
auto_link_case_sensitive: true
target_keyword: "purrr iwalk"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr iwalk() in R: Walk a List With Its Names

<p class="lead">The <code>iwalk()</code> function in purrr applies a function to each element of a list or vector together with its name or index, purely for side effects like printing or saving files. It returns the original input invisibly, so it stays pipe-friendly.</p>

[QUICK ANSWER]
iwalk(x, ~ cat(.y, .x, "\n"))         # .x is value, .y is name/index
iwalk(named_vec, ~ print(.y))         # .y is the element name
iwalk(unnamed_vec, ~ print(.y))       # .y is the integer index
iwalk(dfs, ~ write.csv(.x, .y))       # save each, name as path
iwalk(x, function(val, nm) ...)       # full anonymous function form
iwalk(x, ~ message(.y))               # returns x invisibly

[DECISION TREE: Is iwalk() the right tool?]
- side effect that needs the name: iwalk(x, ~ cat(.y, .x))
- side effect, name not needed: walk(x, print)
- two parallel lists, side effect: walk2(x, y, ~ ...)
- transform values, keep the name: imap(x, ~ ...)
- transform values, return a list: map(x, ~ ...)
- many parallel lists, side effect: pwalk(list(a, b, c), ...)

## What iwalk() does in one sentence

**iwalk() walks a list alongside its names.** It calls your function once per element, passing the value as `.x` and the name as `.y`, and runs entirely for the side effect. The "i" stands for indexed: when the input has no names, `.y` becomes the integer position instead. It is the side-effect counterpart of [imap()](purrr-imap-in-R.html), which keeps return values.

[KEY INSIGHT]
**iwalk(x, f) is shorthand for walk2(x, names(x), f).** When `x` has no names, purrr substitutes `seq_along(x)`. Knowing this equivalence makes every `iwalk()` call predictable: `.x` is always the value and `.y` is always the label.

## Syntax

**iwalk() takes one input, one function, and nothing else.** The signature is short because indexing is automatic.

```r title="iwalk function signature"
library(purrr)

# iwalk(.x, .f, ...)
#   .x  a list or atomic vector
#   .f  a function of two arguments: value, then name/index
#   ... extra arguments passed on to .f
```

Inside a formula-style function, `.x` is the current value and `.y` is its name or index. With a full anonymous function, the first argument receives the value and the second receives the name. The return value of `.f` is discarded; `iwalk()` always hands back `.x` invisibly.

## Common use cases

**iwalk() shines whenever the name carries meaning.** Here are the patterns that come up most often.

Printing each element next to its label is the simplest case. The named vector supplies both halves of the message.

```r title="Print each value with its name"
prices <- c(apple = 3, banana = 1, cherry = 8)
iwalk(prices, ~ cat(.y, "costs $", .x, "\n"))
#> apple costs $ 3 
#> banana costs $ 1 
#> cherry costs $ 8
```

Splitting a data frame produces a named list, which `iwalk()` reports on cleanly. The split names (`4`, `6`, `8`) arrive as `.y`.

```r title="Summarise split groups by name"
by_cyl <- split(mtcars, mtcars$cyl)
iwalk(by_cyl, ~ cat("cyl", .y, "->", nrow(.x), "cars\n"))
#> cyl 4 -> 11 cars
#> cyl 6 -> 7 cars
#> cyl 8 -> 14 cars
```

Saving each group to its own file is the headline use case. The name becomes part of the file path, so one call writes a tidy set of outputs.

```r title="Write each group to its own CSV"
by_cyl <- split(mtcars, mtcars$cyl)
iwalk(by_cyl, ~ write.csv(.x, file.path(tempdir(), paste0("cyl_", .y, ".csv"))))
list.files(tempdir(), pattern = "^cyl_")
#> [1] "cyl_4.csv" "cyl_6.csv" "cyl_8.csv"
```

When the input has no names, `.y` falls back to the position. This is handy for numbered logging or progress messages.

```r title="Use the index on an unnamed vector"
iwalk(c(10, 20, 30), ~ cat("position", .y, "->", .x, "\n"))
#> position 1 -> 10 
#> position 2 -> 20 
#> position 3 -> 30
```

[TIP]
**iwalk() returns its input invisibly, so it drops into pipes.** Write `data |> iwalk(log_fn) |> map(transform_fn)` to log every element and keep processing without breaking the chain.

## iwalk() vs walk2() vs imap()

**iwalk() is the indexed, side-effect member of the walk family.** The three functions differ on two axes: how many inputs they take and whether they return a usable value.

| Function | Inputs | `.f` receives | Returns |
|---|---|---|---|
| `iwalk()` | one list/vector | value `.x`, name/index `.y` | input, invisibly |
| `walk2()` | two parallel lists | element of each | first input, invisibly |
| `imap()` | one list/vector | value `.x`, name/index `.y` | a new list |

Use `iwalk()` when one input already holds the labels you need. Use [walk2()](purrr-walk2-in-R.html) when the second value is genuinely separate data, not a name. Use `imap()` when you want the transformed result back instead of just a side effect.

## Common pitfalls

**iwalk() pitfalls cluster around the .x and .y order.** Three mistakes cause most confusion.

Swapping the arguments is the classic error. The value is always `.x` and the name is always `.y`, even though "name first" feels natural when reading.

```r title="Wrong and right argument order"
scores <- c(math = 90, art = 75)
# WRONG: treats the name as a number
# iwalk(scores, ~ cat(.x, "scored", .y, "\n"))
# RIGHT
iwalk(scores, ~ cat(.y, "scored", .x, "\n"))
#> math scored 90 
#> art scored 75
```

Expecting names from an unnamed input is the second trap. If `.x` has no names, `.y` is a position integer, not a label, so messages may read `1`, `2`, `3` unexpectedly.

[WARNING]
**iwalk() discards the return value of .f.** If you actually need the results, switch to `imap()`. Capturing `out <- iwalk(...)` gives you back the original input, not the computed values, which silently breaks code that expects transformed output.

## Try it yourself

**Try it:** Use `iwalk()` on the named vector `caps` to print each line as `"<name> is the capital"`. The value `.x` is the country and `.y` is the city name.

```r title="Your turn: iwalk over a named vector"
caps <- c(Paris = "France", Tokyo = "Japan")
# Try it: print "<city> is the capital of <country>"
ex_out <- # your code here

ex_out
#> Expected: two printed lines
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
caps <- c(Paris = "France", Tokyo = "Japan")
ex_out <- iwalk(caps, ~ cat(.y, "is the capital of", .x, "\n"))
#> Paris is the capital of France 
#> Tokyo is the capital of Japan
```

**Explanation:** `.y` holds the name (`Paris`, `Tokyo`) and `.x` holds the value (`France`, `Japan`). `iwalk()` runs `cat()` for its side effect and returns `caps` invisibly, so `ex_out` is the original vector.

</details>

## Related purrr functions

**iwalk() rarely works alone.** These functions cover the rest of the iterate-with-index toolkit.

- [imap()](purrr-imap-in-R.html): the value-returning version of `iwalk()`.
- [walk()](purrr-walk-in-R.html): side effects over one input, no name needed.
- [walk2()](purrr-walk2-in-R.html): side effects over two parallel lists.
- [pwalk()](purrr-pwalk-in-R.html): side effects over many parallel lists.
- [map()](purrr-map-in-R.html): the foundational transform-and-return iterator.

## FAQ

**What is the difference between iwalk() and walk() in R?**

`walk()` passes only the value to your function, while `iwalk()` passes both the value and its name or index. Choose `iwalk()` when the name matters, for example when the list name should become a file name or a label in printed output. Both run purely for side effects and both return their input invisibly, so the only practical difference is whether `.f` can see the name.

**What does the .y argument mean in iwalk()?**

In `iwalk()`, `.y` is the name of the current element. If the input vector or list has no names, `.y` becomes the integer index instead, starting at 1. The value itself is always `.x`. With a full anonymous function the same rule applies: the first argument is the value and the second is the name or index.

**Does iwalk() return anything?**

`iwalk()` returns its first argument `.x` invisibly. It is designed for side effects such as printing, plotting, or writing files, so the return value of your function is thrown away. If you assign the result, you get back the original input unchanged, which makes `iwalk()` safe to use in the middle of a pipe.

**When should I use imap() instead of iwalk()?**

Use `imap()` when you need the computed results, because it returns a new list of whatever `.f` produces. Use `iwalk()` when you only care about the side effect and want to keep the original data flowing through a pipe. The two share an identical calling convention, so switching between them is just a function-name change.

**Can iwalk() loop over an unnamed list?**

Yes. When the list or vector has no names, `iwalk()` uses `seq_along()` to supply integer indices as `.y`. This makes it a clean replacement for a `for` loop that needs a counter, without the manual index bookkeeping. The side effect runs once per element in order.

For the official argument reference, see the [purrr iwalk documentation](https://purrr.tidyverse.org/reference/imap.html).
