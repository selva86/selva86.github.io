---
title: "purrr walk() in R: Apply Functions for Side Effects"
slug: "purrr-walk-in-R"
description: "Use purrr walk() in R to apply a function for its side effects, printing, saving, or plotting. Covers walk2, pwalk, iwalk and how walk differs from map."
keywords: "purrr walk, walk function R, purrr walk examples, R walk side effects, walk vs map R, purrr walk2, iterate side effects R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr walk|walk()|purrr::walk()|walk2()|iwalk()"
auto_link_case_sensitive: true
target_keyword: "purrr walk"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr walk() in R: Apply Functions for Side Effects

<p class="lead">The <code>walk()</code> function in purrr applies a function to each element of a list or vector for its side effects, such as printing, saving files, or drawing plots. Unlike <code>map()</code>, it discards the return values and returns the original input invisibly so it stays pipe-friendly.</p>

[QUICK ANSWER]
walk(1:3, print)                       # run for side effect, no list output
walk(my_list, ~ cat(.x, "\n"))         # print each element
walk(plots, print)                     # render a list of ggplot objects
walk2(objs, paths, ~ saveRDS(.x, .y))  # two inputs: object + file path
iwalk(scores, ~ cat(.y, .x, "\n"))     # access the name or index too
pwalk(list(a, b, c), fn)               # three or more inputs in parallel
walk(x, fn)                            # returns x invisibly (pipe-safe)

[DECISION TREE: Is walk() the right tool?]
- run code for side effects only: walk(x, fn)
- collect return values into a list: map(x, fn)
- collect results into a typed vector: map_dbl(x, fn)
- two inputs in lockstep: walk2(x, y, fn)
- need the element name or index: iwalk(x, fn)
- many inputs in parallel: pwalk(list(...), fn)

## What walk() does in one sentence

**`walk(x, fn)` calls `fn` on each element of `x` purely for the side effect and returns `x` invisibly.** It is the side-effect twin of `map()`: the same iteration, but the function's return values are thrown away instead of collected.

You reach for `walk()` when the *action* matters, not the result. Printing, writing CSV files, saving plots, and logging are all side effects. Using `map()` for these works, but leaves a useless list of `NULL` values in the console.

R does not distinguish side effects from return values at the language level, so purrr gives you that distinction by convention. Choosing `walk()` over `map()` documents intent: a reader sees `walk()` and immediately knows the loop body does something to the outside world rather than computing a value to keep.

## Syntax

**`walk(.x, .f, ...)`. `.x` is the input list or vector, `.f` is the function or lambda, and `...` passes extra arguments to `.f`.** The signature mirrors `map()` exactly, so anything you know about calling `map()` transfers directly.

```r title="Apply a function for side effects"
library(purrr)

walk(1:3, ~ cat("Processing item", .x, "\n"))
#> Processing item 1
#> Processing item 2
#> Processing item 3
```

The key behavior is the return value. `walk()` hands back its input, not the results of `.f`, and it does so invisibly.

```r title="walk returns its input invisibly"
result <- walk(c("a", "b"), ~ cat("Got:", .x, "\n"))
#> Got: a
#> Got: b

result
#> [1] "a" "b"
```

Invisible means the value is returned but not auto-printed at the console. You can still capture it with assignment or feed it to the next function. That is what separates `walk()` from a plain `for` loop, which always returns `NULL`.

[KEY INSIGHT]
**`walk()` returns the input so it can sit in the middle of a pipe without breaking the chain.** `map()` returns results and ends a transformation; `walk()` returns the input and lets the data keep flowing. That invisible passthrough is the whole design point of the function.

## Four common patterns

### 1. Print each element

```r title="Print every element of a list"
my_list <- list(cars = nrow(mtcars), flowers = nrow(iris))
walk(my_list, print)
#> [1] 32
#> [1] 150
```

`walk(x, print)` is the cleanest way to print a list element by element without the bracketed `[[1]]` headers that calling `print()` on the whole list adds. Each element prints on its own line exactly as it would at the top level.

### 2. Two inputs with walk2

```r title="walk2 iterates over two inputs"
labels <- c("alpha", "beta", "gamma")
values <- c(10, 20, 30)
walk2(labels, values, ~ cat(.x, "=", .y, "\n"))
#> alpha = 10
#> beta = 20
#> gamma = 30
```

`walk2()` steps through TWO inputs in lockstep. `.x` is the first input and `.y` is the second. This is the pattern for saving objects to matching file paths.

### 3. iwalk for names and indices

```r title="iwalk gives you the name or index"
scores <- c(math = 90, science = 85, art = 78)
iwalk(scores, ~ cat(.y, "scored", .x, "\n"))
#> math scored 90
#> science scored 85
#> art scored 78
```

`iwalk()` exposes the element name as `.y`, or the integer index when the input is unnamed. It is `walk2(x, names(x), ...)` with less typing.

### 4. walk inside a pipeline

```r title="walk in a pipeline returns input invisibly"
1:3 |>
  walk(~ cat("step", .x, "\n")) |>
  sum()
#> step 1
#> step 2
#> step 3
#> [1] 6
```

Because `walk()` passes the input through, you can drop it into a pipe to log progress or inspect data without disturbing the result. Here `sum()` still receives `1:3` and returns 6.

[TIP]
**Use `walk()` to save many files in one line.** Pair `walk2()` with a vector of objects and a vector of file paths: `walk2(datasets, paths, ~ write.csv(.x, .y))`. This replaces a hand-written `for` loop and reads as a single, clear intention.

## walk() vs map()

**Both functions iterate the same way; they differ only in what they return and what you do with it.** Picking the wrong one rarely breaks code, but it muddies intent and clutters output.

| Aspect | `map()` | `walk()` |
|---|---|---|
| Returns | List of results | The input, invisibly |
| Use for | Transforming data | Side effects (print, save, plot) |
| Console output | Prints the result list | Prints nothing extra |
| Pipe position | Ends a transformation | Sits mid-pipe |
| Variants | `map2()`, `pmap()`, `imap()` | `walk2()`, `pwalk()`, `iwalk()` |

The rule of thumb: if you care about the value the function produces, use `map()`; if you care about what it *does*, use `walk()`. The two often appear together: `map()` builds a list of plots, then `walk()` renders each one.

## When walk() fits a data analysis workflow

**Most real uses of this function arrive at the end of a pipeline, after the data is ready.** The familiar shape: load and reshape data, then hand the finished objects to a side-effect step.

Batch exporting is the clearest case. Suppose an analysis produces one summary table per region, held in a named list. A single iteration writes every table to its own file, named after the region it describes. The loop body is one function call, so the iteration reads better than a hand-written loop and leaves no room for an off-by-one mistake.

Reporting is the second case. Generating one chart per category and then drawing all of them into a report is a side effect: the charts already exist as objects, and printing them is the part that matters. Making the rendering step its own explicit iteration keeps it easy to find later.

Logging and progress messages are the third case. Because the input passes straight through, you can insert a logging step into the middle of a long pipeline to print a message at each stage. The surrounding transformation is left untouched, and deleting the logging line later restores the original behavior exactly.

## Common pitfalls

**Pitfall 1: expecting walk to return results.** `out <- walk(1:3, ~ .x^2)` sets `out` to `1:3`, not `c(1, 4, 9)`. The squared values are computed and discarded. Use `map_dbl()` when you want the results.

**Pitfall 2: nothing prints.** `walk(1:3, ~ .x^2)` produces no output, because computing `.x^2` is not a side effect. You must call `print()` or `cat()` explicitly inside the function for anything to appear.

**Pitfall 3: mismatched lengths in walk2.** `walk2(x, y, fn)` requires `x` and `y` to be the same length, or one of them to have length 1. Unequal lengths raise an error rather than recycling, which is usually the behavior you want.

[WARNING]
**A list of plots created in a loop often shows nothing until you `walk()` it.** Building ggplot objects only stores them; they render when printed. `walk(plot_list, print)` forces every plot to draw. Plain `map(plot_list, identity)` will not display anything.

## Try it yourself

**Try it:** Use `iwalk()` to print each value in the named vector `c(a = 1, b = 2, c = 3)` in the format `name: value`, so you can access the name.

```r title="Your turn: print name and value"
# Try it: iwalk over a named vector
ex_vec <- c(a = 1, b = 2, c = 3)
iwalk(ex_vec, ~ # your code here)

#> Expected: three lines like "a: 1"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_vec <- c(a = 1, b = 2, c = 3)
iwalk(ex_vec, ~ cat(.y, ": ", .x, "\n", sep = ""))
#> a: 1
#> b: 2
#> c: 3
```

**Explanation:** `iwalk()` passes the value as `.x` and the name as `.y`. The `cat()` call with `sep = ""` joins them into the `name: value` format. `iwalk()` returns the input invisibly, so nothing extra prints afterward.

</details>

## Related purrr functions

Once `walk()` is familiar, the rest of the side-effect family follows the same logic and uses the same `.x` and `.y` placeholders:

- `walk2()`: iterate over two inputs in lockstep
- `pwalk()`: iterate over three or more inputs supplied as a list
- `iwalk()`: iterate with access to each element's name or index
- `map()`: the transforming twin that keeps return values
- `map_dbl()`, `map_chr()`: type-safe variants when you need typed results

For iteration that collects results instead of discarding them, `purrr map` is the starting point. For the broader context of applying functions across data structures, see functional programming in R.

## FAQ

**What is the difference between map and walk in purrr?**

`map()` applies a function and returns a list of the results, so you use it to transform data. `walk()` applies a function for its side effects, such as printing or saving files, and discards the return values. `walk()` returns its input invisibly, which lets it sit inside a pipe without ending the chain.

**Does purrr walk return anything?**

Yes. `walk()` returns its first argument, the input `.x`, invisibly. It does not return the values produced by the function you applied. Assigning `out <- walk(x, fn)` gives `out` the original `x`, which is what makes `walk()` safe to place in the middle of a pipeline.

**How do I use walk to save multiple files in R?**

Pair `walk2()` with a vector of objects and a matching vector of file paths. For example, `walk2(datasets, paths, ~ write.csv(.x, .y))` writes each data frame to its own file. `.x` is the object and `.y` is the path. Both vectors must have the same length.

**What is the difference between walk, walk2, and pwalk?**

`walk()` iterates over one input. `walk2()` iterates over two inputs in lockstep, exposing them as `.x` and `.y`. `pwalk()` iterates over three or more inputs passed together in a list, and the function receives one argument per list element. All three discard return values.

**When should I use walk instead of a for loop?**

Use `walk()` when the loop body is a single function call with a side effect, such as printing or writing a file. It is more concise and signals intent clearly. Keep a `for` loop when the body is long or needs to accumulate state across iterations.
