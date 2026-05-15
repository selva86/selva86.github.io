---
title: "purrr walk2() in R: Side Effects Over Two Inputs"
slug: "purrr-walk2-in-R"
description: "Use purrr walk2() in R to run a function over two inputs in parallel for side effects, like saving files. Covers syntax, examples, walk2 vs map2, and pitfalls."
keywords: "purrr walk2, walk2 function R, purrr walk2 examples, R walk2 two inputs, walk2 vs map2, iterate two lists R, walk2 side effects"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr walk2|walk2()|purrr::walk2()|iterate over two inputs|walk2 function"
auto_link_case_sensitive: true
target_keyword: "purrr walk2"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr walk2() in R: Side Effects Over Two Inputs

<p class="lead">The purrr <code>walk2()</code> function applies a function over two inputs in parallel for their side effects, such as saving each object to its own file path. It discards return values and hands back the first input invisibly, so it stays pipe-friendly.</p>

[QUICK ANSWER]
walk2(x, y, fn)                        # run fn over two inputs, no output
walk2(objs, paths, ~ saveRDS(.x, .y))  # save each object to its path
walk2(labels, vals, ~ cat(.x, .y))     # print paired label and value
walk2(x, y, fn, digits = 2)            # extra args go after fn
walk2(seq, paths, write.csv)           # pass a bare function name
pwalk(list(a, b, c), fn)               # three or more inputs in parallel

[DECISION TREE: Is walk2() the right tool?]
- side effects over two inputs: walk2(x, y, fn)
- collect results from two inputs: map2(x, y, fn)
- side effects over one input: walk(x, fn)
- three or more inputs in parallel: pwalk(list(...), fn)
- need each element's name or index: iwalk(x, fn)
- transform two inputs into a vector: map2_chr(x, y, fn)

## What walk2() does in one sentence

**`walk2(.x, .y, .f)` calls `.f` on each matching pair from `.x` and `.y` purely for the side effect, then returns `.x` invisibly.** It is the two-input member of the `walk()` family: the same parallel iteration as `map2()`, but the results are thrown away instead of collected.

You reach for `walk2()` when an action needs two pieces of information at once. Saving a list of objects needs both the objects and their file paths. Printing a labelled report needs both the labels and the values. A single `walk2()` call walks the two inputs in lockstep so pair one meets pair one, pair two meets pair two, and so on.

Choosing `walk2()` over `map2()` also documents intent. A reader sees `walk2()` and knows the loop body does something to the outside world rather than computing a value worth keeping.

The "in lockstep" detail matters. `walk2()` does not pair every element of the first input with every element of the second. It advances both inputs by one position per iteration, so the two vectors must list the same items in the same order. Getting that order right in the source vectors is the only real work; the iteration itself is automatic.

## Syntax

**`walk2(.x, .y, .f, ...)`. `.x` and `.y` are the two inputs, `.f` is the function or lambda, and `...` passes extra arguments to `.f`.** Inside a lambda, `.x` refers to the current element of the first input and `.y` to the current element of the second.

```r title="Iterate over two inputs in parallel"
library(purrr)

prefixes <- c("Mr", "Ms", "Dr")
surnames <- c("Smith", "Jones", "Lee")
walk2(prefixes, surnames, ~ cat(.x, .y, "\n"))
#> Mr Smith 
#> Ms Jones 
#> Dr Lee 
```

The return value is the part that separates `walk2()` from a `for` loop. It hands back the first input, `.x`, and does so invisibly.

```r title="walk2 returns its first input invisibly"
result <- walk2(1:3, 4:6, ~ cat(.x + .y, ""))
#> 5 7 9 

result
#> [1] 1 2 3
```

Invisible means the value is returned but not auto-printed at the console. You can still capture it with assignment, which is what lets `walk2()` sit inside a pipe without breaking the chain.

The `.f` argument accepts two forms. A formula written with `~` is the compact lambda shorthand, where `.x` and `.y` stand for the current pair. An ordinary function works too, and its first two parameters receive `.x` and `.y` in order regardless of their names. Reach for the formula when the body is a single short expression, and for a named function when the logic spans several lines or you want to reuse it elsewhere.

[KEY INSIGHT]
**`walk2()` returns the first input, never the results of `.f`.** That is the whole design point: `map2()` ends a transformation by returning results, while `walk2()` returns the input so data keeps flowing down a pipeline untouched.

## Common use cases

### 1. Save each object to its own file

```r title="Save data frames to matching paths"
tables <- list(cars = head(mtcars, 2), flowers = head(iris, 2))
paths  <- c("cars.csv", "flowers.csv")
walk2(tables, paths, ~ write.csv(.x, .y))
list.files(pattern = "csv$")
#> [1] "cars.csv"    "flowers.csv"
```

This is the canonical use of `walk2()`. The objects and the file names live in two separate vectors, and `walk2()` pairs them so each table lands at its intended path. It replaces a hand-written loop with one clear line, and because the iteration is index-free there is no off-by-one mistake to make. The same shape covers saving plots with `ggsave()` or writing `.rds` snapshots.

### 2. Print paired labels and values

```r title="Print a labelled report"
students <- c("Alice", "Bob", "Carol")
scores   <- c(88, 72, 95)
walk2(students, scores, ~ cat(.x, "scored", .y, "\n"))
#> Alice scored 88 
#> Bob scored 72 
#> Carol scored 95 
```

Here the side effect is console output. Each student name meets its matching score, and `cat()` formats the pair into a readable line. This pattern scales to any reporting task where two parallel vectors hold the label and the measurement: test names and pass counts, regions and totals, or column names and missing-value counts.

### 3. Pass extra arguments after the function

```r title="Forward extra arguments through walk2"
log_row <- function(label, value, unit) {
  cat(label, "=", value, unit, "\n")
}
walk2(c("speed", "weight"), c(60, 1500), log_row, unit = "units")
#> speed = 60 units 
#> weight = 1500 units 
```

Anything after `.f` is forwarded to every call. The `unit = "units"` argument is constant across iterations, while `label` and `value` vary with `.x` and `.y`.

### 4. Log progress inside a pipeline

```r title="walk2 keeps the pipe flowing"
c(2, 4, 6) |>
  walk2(c("a", "b", "c"), ~ cat(.y, "=", .x, "\n")) |>
  sum()
#> a = 2 
#> b = 4 
#> c = 6 
#> [1] 12
```

Because `walk2()` passes its first input straight through, you can drop it mid-pipe to log progress. Here `sum()` still receives `c(2, 4, 6)` and returns 12.

[TIP]
**Build the path vector with `paste0()` before calling `walk2()`.** A line like `paths <- paste0("out/", names(tables), ".csv")` keeps file naming logic separate from the iteration, so `walk2(tables, paths, ~ saveRDS(.x, .y))` reads as a single clear intention.

## walk2() vs map2()

**Both functions iterate two inputs the same way; they differ only in what they return.** Picking the wrong one rarely breaks code, but it muddies intent and clutters the console.

| Aspect | `map2()` | `walk2()` |
|---|---|---|
| Returns | List of results | First input, invisibly |
| Use for | Transforming data | Side effects (save, print, plot) |
| Console output | Prints the result list | Prints nothing extra |
| Pipe position | Ends a transformation | Sits mid-pipe |
| Typed variants | `map2_chr()`, `map2_dbl()` | none needed |

The rule of thumb: if you want the value the function produces, use `map2()`; if you want what it *does*, use `walk2()`. They often appear together, where `map2()` builds a list of plots and `walk2()` saves each one to disk.

There is no typed `walk2()` variant such as `walk2_dbl()`, and that absence is correct. Typed `map2()` variants guarantee the shape of a returned vector, but `walk2()` returns no results, so there is nothing to type.

## Common pitfalls

**Pitfall 1: expecting results back.** `out <- walk2(1:3, 4:6, ~ .x + .y)` sets `out` to `1:3`, not `c(5, 7, 9)`. The sums are computed and discarded. Use `map2_dbl()` when you need the numbers.

**Pitfall 2: nothing prints.** `walk2(1:3, 4:6, ~ .x + .y)` produces no output, because arithmetic is not a side effect. You must call `cat()` or `print()` explicitly inside the function for anything to appear.

**Pitfall 3: mismatched lengths.** `walk2(x, y, fn)` requires `x` and `y` to be the same length, or one of them to have length 1. Unequal lengths raise an error rather than silently recycling.

[WARNING]
**`walk2()` does not recycle two short vectors against each other.** Unlike base `mapply()`, passing inputs of length 3 and length 2 throws an error. This strictness is deliberate: it catches the off-by-one bugs that silent recycling would hide.

## Try it yourself

**Try it:** Use `walk2()` to print each car name from `head(rownames(mtcars), 3)` alongside its cylinder count from `head(mtcars$cyl, 3)`, in the format `name: cyl`.

```r title="Your turn: pair names and cylinders"
# Try it: walk2 over names and cylinders
ex_names <- head(rownames(mtcars), 3)
ex_cyl   <- head(mtcars$cyl, 3)
walk2(ex_names, ex_cyl, ~ # your code here)

#> Expected: three lines like "Mazda RX4: 6"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_names <- head(rownames(mtcars), 3)
ex_cyl   <- head(mtcars$cyl, 3)
walk2(ex_names, ex_cyl, ~ cat(.x, ": ", .y, "\n", sep = ""))
#> Mazda RX4: 6
#> Mazda RX4 Wag: 6
#> Datsun 710: 4
```

**Explanation:** `walk2()` passes the car name as `.x` and the cylinder count as `.y`. The `cat()` call with `sep = ""` joins them into the `name: cyl` format. `walk2()` returns `ex_names` invisibly, so nothing extra prints afterward.

</details>

## Related purrr functions

Once `walk2()` is familiar, the rest of the side-effect family follows the same logic and reuses the `.x` and `.y` placeholders:

- `walk()`: iterate over a single input for side effects
- `pwalk()`: iterate over three or more inputs supplied as a list
- `iwalk()`: iterate with access to each element's name or index
- `map2()`: the transforming twin that collects return values
- `map2_chr()`, `map2_dbl()`: type-safe variants when you need typed results

For iteration that collects results from two inputs, `purrr map2` is the starting point. For the broader picture of applying functions across data structures, see functional programming in R. The official reference lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/map2.html).

## FAQ

**What is the difference between walk2 and map2 in purrr?**

`map2()` applies a function to each pair from two inputs and returns a list of the results, so you use it to transform data. `walk2()` applies a function to each pair for its side effects, such as saving files or printing, and discards the return values. `walk2()` returns its first input invisibly, which lets it sit inside a pipe without ending the chain.

**Does purrr walk2 return anything?**

Yes. `walk2()` returns its first argument, `.x`, invisibly. It does not return the values produced by the function you applied. Assigning `out <- walk2(x, y, fn)` gives `out` the original `x`. That invisible passthrough is what makes `walk2()` safe to place in the middle of a pipeline.

**How do I save multiple files with walk2 in R?**

Pair `walk2()` with a vector of objects and a matching vector of file paths. For example, `walk2(tables, paths, ~ write.csv(.x, .y))` writes each data frame to its own file. `.x` is the object and `.y` is the path. Both vectors must have the same length, or the call raises an error.

**Can walk2 take more than two inputs?**

No. `walk2()` handles exactly two inputs. For three or more, use `pwalk()`, which takes a single list of input vectors and passes one element from each to the function. `pwalk(list(a, b, c), fn)` iterates over three inputs in parallel for side effects.

**What happens if the two inputs have different lengths?**

`walk2()` throws an error unless one input has length 1, in which case that value is reused for every iteration. It does not recycle two short vectors against each other the way base `mapply()` can. The strict check is intentional and catches alignment bugs early.
