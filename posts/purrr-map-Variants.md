---
title: "purrr map() in R: Every Variant Explained With the Mental Model That Makes Them Click"
slug: "purrr-map-Variants"
description: "Learn purrr map() variants in R: map(), map2(), imap(), pmap(), walk(), and the type-suffix system. One mental model to pick the right function every time."
keywords: "purrr map in R, purrr map2, pmap R, imap purrr, map_dbl, walk function R, purrr tutorial, functional programming R, tidyverse iteration, R for loops alternative"
auto_link_terms: "purrr map|map variants|purrr tutorial|map()|map2()|pmap()|imap()|walk()|map_dbl()|map_chr()"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "4.2.2"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "purrr map() Variants"
sidebar_order: 33
difficulty: "Beginner"
---

# purrr map() in R: Every Variant Explained With the Mental Model That Makes Them Click

<p class="lead">purrr's <strong>map family</strong> replaces <code>for</code> loops with composable one-liners, <code>map()</code> handles one input, <code>map2()</code> pairs two, <code>pmap()</code> scales to any number, and <code>_dbl</code>/<code>_chr</code>/<code>_lgl</code> suffixes guarantee the output type you expect.</p>

There are roughly 30 functions in the `map` family, but you don't need to memorise them. Once you see the two-dimensional grid behind the names, **how many inputs** on one axis, **what output type** on the other, every variant becomes obvious. This tutorial walks every useful member of the family with runnable examples so you leave with a working mental model, not a cheat-sheet.

## What does map() actually do, and why replace for loops?

If you've ever written a `for` loop just to build up a list of results, `map()` is the cleaner replacement. It takes a vector, applies a function to every element, and collects the answers into a list, in one line, with no counter variable and no pre-allocation. Here's the side-by-side: compute the mean of every column in `mtcars`, first the long way, then the `map()` way.

```r title="Column means via loop and map"
library(purrr)
library(dplyr)

# The hand-rolled for loop
col_means_loop <- vector("list", length(mtcars))
names(col_means_loop) <- names(mtcars)
for (col in names(mtcars)) {
  col_means_loop[[col]] <- mean(mtcars[[col]])
}
col_means_loop$mpg
#> [1] 20.09062

# The map() version — same result, one line
col_means_list <- map(mtcars, mean)
col_means_list$mpg
#> [1] 20.09062
```

Both expressions produce the same named list of column means, but `map()` removes every piece of loop ceremony. You don't pre-allocate the container, you don't track an index, and you don't copy the result into a slot, `map()` returns the assembled list as its value, so you can pipe it straight into the next step.

![From a hand-rolled for loop to map(), map_dbl(), and walk(), same iteration pattern, different return types.](screenshots/purrr-map-Variants-for-loop-to-map.webp)
*Figure 1: The same iteration pattern, apply a function to every element, expressed three ways. The return type changes; the logic doesn't.*

The second argument to `map()` is a function. You can pass a named function like `mean`, or inline a tiny one with R 4.1's backslash-lambda `\(x) ...`, or with purrr's formula shorthand `~ .x * 2` (where `.x` is the current element).

```r title="Three lambda styles for map"
# Three ways to write "double every value in 1:5"
doubled_named <- map(1:5, function(x) x * 2)
doubled_lambda <- map(1:5, \(x) x * 2)
doubled_formula <- map(1:5, ~ .x * 2)

identical(doubled_named, doubled_lambda)
#> [1] TRUE
identical(doubled_lambda, doubled_formula)
#> [1] TRUE
```

All three return the same 5-element list. Pick whichever reads best: use a named function when the logic has a name worth keeping, the `\(x)` lambda for anything longer than a single expression, and the `~ .x` formula for tiny one-liners.

[TIP]
**Prefer the backslash lambda for anything beyond a one-liner.** The `\(x)` syntax is standard R 4.1+, supports multiple arguments cleanly, and readers unfamiliar with purrr's `.x` placeholder can still read it. Save the `~` formula shorthand for very short expressions.

**Try it:** Use `map()` to square every element of `1:5`. The result should be a list of 5 numbers.

```r title="Exercise: square each element with map"
# Try it: square each element of 1:5 using map()
ex_squares <- map(1:5, function(x) {
  # your code here
})

ex_squares
#> Expected: list(1, 4, 9, 16, 25)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Square each element solution"
ex_squares <- map(1:5, \(x) x ^ 2)
ex_squares
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 4
#>
#> [[3]]
#> [1] 9
#>
#> [[4]]
#> [1] 16
#>
#> [[5]]
#> [1] 25
```

**Explanation:** `map()` applies `\(x) x ^ 2` to each element and wraps the five results in a list. If you want a plain numeric vector instead of a list, use `map_dbl()`, that's the next section.

</details>

## How do the map_*() type suffixes guarantee the output you expect?

`map()` always returns a list. Most of the time you actually want a plain atomic vector, a numeric, a character, or a logical. That's what the type-suffix variants are for. `map_dbl()` returns a double vector, `map_int()` an integer, `map_chr()` a character, `map_lgl()` a logical. They do the same iteration as `map()`, but they unwrap the result and check that every piece matches the promised type.

```r title="map double returns numeric vector"
# map_dbl returns a named numeric vector
col_means <- map_dbl(mtcars, mean)
col_means
#>        mpg        cyl       disp         hp       drat         wt       qsec
#>  20.090625   6.187500 230.721875 146.687500   3.596563   3.217250  17.848750
#>         vs         am       gear       carb
#>   0.437500   0.406250   3.687500   2.812500
```

Compare that to the list you got in the last section, same numbers, but now you can drop the result straight into `sort()`, `plot()`, or arithmetic without unlisting first. The named-vector format also makes `col_means["mpg"]` work cleanly.

```r title="map character for formatted labels"
# map_chr returns a character vector — great for formatted labels
rounded_means <- map_chr(mtcars, \(x) sprintf("%.1f", mean(x)))
rounded_means
#>     mpg     cyl    disp      hp    drat      wt    qsec      vs      am
#>  "20.1"   "6.2" "230.7" "146.7"   "3.6"   "3.2"  "17.8"   "0.4"   "0.4"
#>    gear    carb
#>   "3.7"   "2.8"
```

`map_chr()` ran `sprintf()` on each column's mean and collected the 11 strings into a single named character vector, ready for a plot legend, a report heading, or a `paste0()` concatenation.

![The purrr map family arranged by input arity (rows) and output type (columns).](screenshots/purrr-map-Variants-type-suffix-grid.webp)
*Figure 2: The map family is a 2D grid. Pick a row (how many inputs) and a column (output type) and the function name writes itself.*

The suffix isn't cosmetic, it's a promise the function enforces. If your function returns something that isn't the promised type, `map_dbl()` errors loudly rather than silently returning garbage.

```r title="map double fails fast on bad types"
# map_dbl fails fast when types don't match
result <- tryCatch(
  map_dbl(list(1, "two", 3), identity),
  error = function(e) conditionMessage(e)
)
result
#> [1] "Can't coerce from a string to a double vector."
```

Instead of quietly coercing `"two"` into `NA` or a number, `map_dbl()` stops and tells you exactly which element broke the contract. That's a feature: an explicit failure beats a silent wrong answer every time.

[WARNING]
**The typed map variants are strict by design.** If your function returns values of mixed or unpredictable type, use plain `map()` and convert afterwards. Don't wrap `map_dbl()` in `tryCatch()` to paper over type mismatches, fix the upstream function instead.

[KEY INSIGHT]
**Pick the suffix that matches your known output, not the loosest one that works.** Using `map()` everywhere because "it always works" defeats the point, the suffixes exist so type errors surface at the iteration site, not three functions downstream where they're hard to debug.

**Try it:** Use `map_int()` to return the number of characters in each element of `c("dog", "horse", "bee")`. The answer should be an integer vector of length 3.

```r title="Exercise: string lengths with map integer"
# Try it: string lengths with map_int
ex_words <- c("dog", "horse", "bee")
ex_lengths <- map_int(ex_words, function(w) {
  # your code here
})

ex_lengths
#> Expected: c(3L, 5L, 3L)
```

<details>
<summary>Click to reveal solution</summary>

```r title="String lengths solution"
ex_words <- c("dog", "horse", "bee")
ex_lengths <- map_int(ex_words, \(w) nchar(w))
ex_lengths
#> [1] 3 5 3
```

**Explanation:** `nchar()` returns an integer for each string, and `map_int()` collects the three answers into an integer vector. You could also write this as `map_int(ex_words, nchar)`, when the function is a one-argument named function, you can drop the lambda entirely.

</details>

## When do you need map2() to iterate over two inputs in parallel?

`map()` works beautifully when you're iterating over one vector. But plenty of problems pair two vectors, sample sizes with seeds, means with standard deviations, column names with column values. `map2()` is the version that walks two inputs in lockstep, feeding the `i`-th element of each to your function on every step.

```r title="map two simulates paired specs"
# Simulate 4 samples, each with its own mean and sd
set.seed(101)
means <- c(0, 5, 10, 20)
sds   <- c(1, 2, 1, 5)

sim_samples <- map2(means, sds, \(m, s) rnorm(n = 5, mean = m, sd = s))
sim_samples[[1]]
#> [1] -0.3260365  0.5524619 -0.6749438  0.2143595  0.3107692
sim_samples[[4]]
#> [1] 14.73944 22.18163 18.81113 17.92391 18.38659
```

Each call to `rnorm()` uses the matching element from both vectors, the first call gets `mean = 0, sd = 1`, the second gets `mean = 5, sd = 2`, and so on. The result is a length-4 list where each slot holds a 5-number sample from a different normal distribution.

Inside the lambda, you can name the arguments anything (`m` and `s` here) or use purrr's formula shorthand where `.x` is the first input and `.y` is the second.

```r title="Elementwise product with map two double"
# Elementwise product of two numeric vectors — return a plain numeric
elem_prod <- map2_dbl(c(1, 2, 3, 4), c(10, 20, 30, 40), \(a, b) a * b)
elem_prod
#> [1]  10  40  90 160
```

`map2_dbl()` works exactly like `map2()` but promises a double vector output, the same contract as `map_dbl()`, extended to two inputs. Every type suffix from the previous section has a `map2_` cousin.

[NOTE]
**For simple elementwise arithmetic, plain R vectorisation is faster.** `c(1,2,3,4) * c(10,20,30,40)` returns the same answer without purrr. Reach for `map2()` when the per-element operation is a function call that isn't already vectorised, random draws, model fits, custom transformations.

**Try it:** Multiply `c(2, 4, 6)` by `c(10, 100, 1000)` elementwise and return the result as a double vector.

```r title="Exercise: elementwise multiply with map two"
# Try it: elementwise multiply with map2_dbl
ex_a <- c(2, 4, 6)
ex_b <- c(10, 100, 1000)
ex_prod <- map2_dbl(ex_a, ex_b, function(x, y) {
  # your code here
})

ex_prod
#> Expected: c(20, 400, 6000)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Elementwise multiply solution"
ex_a <- c(2, 4, 6)
ex_b <- c(10, 100, 1000)
ex_prod <- map2_dbl(ex_a, ex_b, \(x, y) x * y)
ex_prod
#> [1]   20  400 6000
```

**Explanation:** `map2_dbl()` pairs `ex_a[i]` with `ex_b[i]` for each `i`, multiplies them, and collects the three products into a double vector. The defining feature of every `map2_*` variant is that the function takes two arguments instead of one.

</details>

## How does pmap() scale iteration to any number of arguments?

There's no `map3()` or `map4()`, because `pmap()` generalises the whole idea. Instead of accepting 2, 3, or 4 separate vectors, `pmap()` takes **one list** whose elements are the vectors you want to iterate over in parallel. Three inputs, ten inputs, same syntax.

The cleanest pattern is to name the list elements to match your function's argument names. purrr will wire them up for you automatically.

```r title="pmap over three paired vectors"
# Three paired vectors → named list → pmap
set.seed(202)
sim_list <- pmap(
  list(n = c(3, 4, 5), mean = c(0, 10, 20), sd = c(1, 2, 3)),
  rnorm
)
sim_list
#> [[1]]
#> [1] -0.4304691  0.2572641  1.0844412
#>
#> [[2]]
#> [1]  8.970506  7.826228  9.977303 10.812235
#>
#> [[3]]
#> [1] 18.20688 24.50030 18.71374 21.45382 19.94457
```

The first `rnorm()` call got `n = 3, mean = 0, sd = 1`; the second got `n = 4, mean = 10, sd = 2`; the third got `n = 5, mean = 20, sd = 3`. Because the list names match `rnorm`'s argument names, you didn't need a lambda at all, `pmap` passed them through directly.

[TIP]
**Name your pmap input list to match the target function's arguments.** It eliminates lambdas, makes the code self-documenting, and lets you reorder inputs safely. If your list elements aren't named, pmap falls back to positional matching (first list element → first function argument), which is more fragile.

A really powerful variant: since a tibble is just a named list of equal-length vectors, you can pass a whole tibble of experiment specifications straight to `pmap()`.

```r title="pmap on a tibble of specs"
library(tibble)

# A tibble where each row is one experiment
spec_tbl <- tibble(
  n    = c(10, 20, 50),
  mean = c(0,  5,  10),
  sd   = c(1,  2,  3)
)

set.seed(303)
mean_results <- pmap_dbl(spec_tbl, \(n, mean, sd) mean(rnorm(n, mean, sd)))
mean_results
#> [1] 0.2194892 5.3821048 9.9112164
```

Each row of `spec_tbl` became one call to the lambda; the lambda drew `n` random values from a normal with the row's `mean` and `sd`, then returned their observed mean. `pmap_dbl()` collected the three observed means into a numeric vector, and because it's `_dbl`, you get a flat atomic vector instead of a list of doubles.

If you don't want to name arguments, purrr's formula shorthand supports positional placeholders `..1`, `..2`, `..3` for any number of inputs.

```r title="pmap character with positional shorthand"
# Positional shorthand — fine for quick work, noisier to read
paste_out <- pmap_chr(
  list(c("A", "B", "C"), c(1, 2, 3), c("x", "y", "z")),
  ~ paste0(..1, ..2, ..3)
)
paste_out
#> [1] "A1x" "B2y" "C3z"
```

`..1` is the first list element, `..2` the second, and so on. It works, but the named-argument style from earlier is usually easier to read once you have more than two inputs.

**Try it:** Use `pmap_chr()` to build sentences of the form `"<name> scored <score> on the <subject> test"` from three equal-length vectors.

```r title="Exercise: build sentences with pmap character"
# Try it: build sentences with pmap_chr
ex_names    <- c("Ada", "Babbage", "Curie")
ex_scores   <- c(92, 88, 97)
ex_subjects <- c("math", "engineering", "chemistry")

ex_sentences <- pmap_chr(
  list(name = ex_names, score = ex_scores, subject = ex_subjects),
  function(name, score, subject) {
    # your code here
  }
)

ex_sentences
#> Expected: "Ada scored 92 on the math test", etc.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Build sentences solution"
ex_names    <- c("Ada", "Babbage", "Curie")
ex_scores   <- c(92, 88, 97)
ex_subjects <- c("math", "engineering", "chemistry")

ex_sentences <- pmap_chr(
  list(name = ex_names, score = ex_scores, subject = ex_subjects),
  \(name, score, subject) paste0(name, " scored ", score, " on the ", subject, " test")
)
ex_sentences
#> [1] "Ada scored 92 on the math test"
#> [2] "Babbage scored 88 on the engineering test"
#> [3] "Curie scored 97 on the chemistry test"
```

**Explanation:** The named list wires `name`, `score`, and `subject` into the lambda by argument name, and `pmap_chr()` collects the three formatted strings into a character vector. Using a named list is much clearer than `..1`/`..2`/`..3` once you have more than two inputs.

</details>

## What is imap() for, and why use it instead of manual indices?

Sometimes the function you're applying needs to know **where** each element came from, its position, its name, or both. You could do that with `map2()` by passing `seq_along(x)` as the second input, but `imap()` does it for you. It's exactly equivalent to `map2(.x, names(.x), .f)` when the input has names, and `map2(.x, seq_along(.x), .f)` when it doesn't.

```r title="imap over a named list"
# Named input → .y is the name
populations <- list(tokyo = 37.4, delhi = 32.9, shanghai = 28.5)
kv_strings <- imap_chr(populations, \(val, key) paste0(key, ": ", val, "M"))
kv_strings
#>             tokyo             delhi          shanghai
#>    "tokyo: 37.4M"    "delhi: 32.9M"  "shanghai: 28.5M"
```

The lambda received two arguments: `val` (the list element) and `key` (the name). `imap_chr()` pasted them together and returned a named character vector. You didn't have to extract `names(populations)` or track an index counter, `imap` did it for you.

If the input has no names, `imap()` uses the integer position instead.

```r title="imap on unnamed vector uses index"
# Unnamed input → .y is the integer index
idx_strings <- imap_chr(c("red", "green", "blue"), \(val, idx) paste0(idx, "=", val))
idx_strings
#> [1] "1=red"   "2=green" "3=blue"
```

Same pattern, different second argument. `imap()` silently switches between "use names" and "use indices" depending on whether the input is named, so your code reads the same whether you're looping a named list or a plain vector.

[KEY INSIGHT]
**`imap()` is the R equivalent of Python's `enumerate()`.** Any time you find yourself writing `for (i in seq_along(x))` to get both the element and its position, reach for `imap` instead. It's one function call, it respects names when they exist, and it plugs straight into a tidyverse pipeline.

**Try it:** Given a named numeric vector, build `"city (value)"` labels with `imap_chr()`.

```r title="Exercise: label named vector with imap"
# Try it: label a named vector with imap_chr
ex_cities <- c(paris = 11, london = 9, berlin = 4)
ex_labels <- imap_chr(ex_cities, function(val, key) {
  # your code here
})

ex_labels
#> Expected: "paris (11)" "london (9)" "berlin (4)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Label named vector solution"
ex_cities <- c(paris = 11, london = 9, berlin = 4)
ex_labels <- imap_chr(ex_cities, \(val, key) paste0(key, " (", val, ")"))
ex_labels
#>        paris       london       berlin
#> "paris (11)" "london (9)" "berlin (4)"
```

**Explanation:** `imap_chr()` hands the lambda both the value and its name on each iteration, and `paste0()` builds the label. This is the cleanest way to build "label: value" strings from a named vector.

</details>

## When should you use walk() instead of map()?

Sometimes you iterate purely for a side effect, printing, saving a plot, writing a file, logging a message, and you don't care about the return value. Using `map()` for that works, but it allocates a list of `NULL`s you'll throw away and it prints that list if you run it at the console. `walk()` is the "for its side effects" variant: it calls the function on every element, ignores the return values, and returns the **input** invisibly so pipelines keep flowing.

```r title="walk for per cylinder summary"
# Print a per-cylinder summary of mpg — side effect only
mtcars_by_cyl <- split(mtcars, mtcars$cyl)

walk(mtcars_by_cyl, \(df) {
  cat("cyl =", unique(df$cyl), "— mean mpg =", round(mean(df$mpg), 1), "\n")
})
#> cyl = 4 — mean mpg = 26.7
#> cyl = 6 — mean mpg = 19.7
#> cyl = 8 — mean mpg = 15.1
```

Three lines of output, no list of `NULL`s cluttering your console. `walk()` evaluated the lambda for its printing effect, discarded the return values, and invisibly returned `mtcars_by_cyl`, so you could even pipe the result into another step if you wanted to.

Like `map2()` and `pmap()`, `walk()` has `walk2()` and `pwalk()` siblings for two or n inputs.

```r title="walk two over filenames and frames"
# Simulate "write report" — in WebR we print instead of writing files
report_names <- c("report_4cyl.txt", "report_6cyl.txt", "report_8cyl.txt")

walk2(report_names, mtcars_by_cyl, \(fname, df) {
  cat("--- Would write:", fname, "---\n")
  cat("Rows:", nrow(df), "| Mean mpg:", round(mean(df$mpg), 1), "\n\n")
})
#> --- Would write: report_4cyl.txt ---
#> Rows: 11 | Mean mpg: 26.7
#>
#> --- Would write: report_6cyl.txt ---
#> Rows: 7 | Mean mpg: 19.7
#>
#> --- Would write: report_8cyl.txt ---
#> Rows: 14 | Mean mpg: 15.1
```

In a real R session you'd call `write.csv(df, fname)` or `ggsave(fname, plot)` inside the lambda. Here we print what would happen so you can see the pairing, each filename lines up with its matching data frame, exactly as `map2()` would.

[NOTE]
**This page runs R in a browser sandbox with an in-memory virtual filesystem.** Functions like `write.csv()` technically execute but the files vanish on page reload and there's no "Downloads" folder to find them in. That's why the example above prints instead of writing. In your local RStudio, `walk2(filenames, data_list, write.csv)` is the real thing.

**Try it:** Use `walk()` to print each greeting in a list with a `— ` prefix on its own line.

```r title="Exercise: walk for printing greetings"
# Try it: walk() for printing side effects
ex_greetings <- list("Hello, Ada", "Hola, Babbage", "Bonjour, Curie")
walk(ex_greetings, function(g) {
  # your code here
})

#> Expected:
#> — Hello, Ada
#> — Hola, Babbage
#> — Bonjour, Curie
```

<details>
<summary>Click to reveal solution</summary>

```r title="walk printing greetings solution"
ex_greetings <- list("Hello, Ada", "Hola, Babbage", "Bonjour, Curie")
walk(ex_greetings, \(g) cat("—", g, "\n"))
#> — Hello, Ada
#> — Hola, Babbage
#> — Bonjour, Curie
```

**Explanation:** `cat()` prints to the console and returns `NULL`, exactly the side-effect-only pattern `walk()` is designed for. Using `map()` here would work but would also print a useless list of three `NULL`s below the greetings.

</details>

## Practice Exercises

These capstones combine multiple variants from the tutorial. Each is solvable with concepts you've already seen. Use distinct variable names (prefixed `my_`) so exercises don't overwrite tutorial state.

### Exercise 1: Summary report from a list of data frames

You have a list of three small data frames. Use `map_int()` to compute each row count, then `imap_chr()` to build a one-line summary string per data frame, then `walk()` to print each summary. The final printed output should have three lines.

```r title="Exercise: combine map integer imap walk"
# Exercise 1: combine map_int + imap_chr + walk
my_dfs <- list(
  a = data.frame(x = 1:5),
  b = data.frame(x = 1:10, y = 1:10),
  c = data.frame(x = 1:3)
)

# Hint: 1) map_int() for row counts
#       2) imap_chr() for "df <name> has N rows" strings
#       3) walk() to print each

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Row count summaries solution"
my_dfs <- list(
  a = data.frame(x = 1:5),
  b = data.frame(x = 1:10, y = 1:10),
  c = data.frame(x = 1:3)
)

my_rowcounts <- map_int(my_dfs, nrow)
my_summaries <- imap_chr(my_rowcounts, \(n, name) paste0("df ", name, " has ", n, " rows"))
walk(my_summaries, \(line) cat(line, "\n"))
#> df a has 5 rows
#> df b has 10 rows
#> df c has 3 rows
```

**Explanation:** `map_int(my_dfs, nrow)` returns a named integer vector of row counts. `imap_chr()` then turns each count into a sentence using the name of the data frame. Finally `walk()` prints each sentence as a side effect. You could chain these with `|>` if you prefer a single expression.

</details>

### Exercise 2: Monte Carlo experiment grid with pmap()

You have a tibble of experiment specifications, six combinations of sample size, distribution mean, and standard deviation. For each row, draw a random sample from a normal distribution, compute its observed mean, and return all six observed means alongside the original specs.

```r title="Exercise: pmap for Monte Carlo grid"
# Exercise 2: pmap + mutate for a Monte Carlo grid
library(dplyr)

my_spec <- tibble(
  n    = c(10, 10, 10, 100, 100, 100),
  mean = c(0, 5, 10, 0, 5, 10),
  sd   = c(1, 1, 1, 1, 1, 1)
)

set.seed(2026)

# Hint: inside mutate(), use pmap_dbl() to walk n/mean/sd in parallel
#       and return the observed mean of rnorm(n, mean, sd)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Monte Carlo grid solution"
library(dplyr)

my_spec <- tibble(
  n    = c(10, 10, 10, 100, 100, 100),
  mean = c(0, 5, 10, 0, 5, 10),
  sd   = c(1, 1, 1, 1, 1, 1)
)

set.seed(2026)
my_results <- my_spec |>
  mutate(observed_mean = pmap_dbl(
    list(n, mean, sd),
    \(n, mean, sd) mean(rnorm(n, mean, sd))
  ))
my_results
#> # A tibble: 6 × 4
#>       n  mean    sd observed_mean
#>   <dbl> <dbl> <dbl>         <dbl>
#> 1    10     0     1        0.172
#> 2    10     5     1        4.85
#> 3    10    10     1       10.1
#> 4   100     0     1       -0.0551
#> 5   100     5     1        5.08
#> 6   100    10     1        9.99
```

**Explanation:** Inside `mutate()`, `pmap_dbl()` walks the three column vectors in parallel. On each iteration the lambda draws `n` values from `rnorm(mean, sd)` and returns the observed mean. With `n = 100` rows the observed means are much closer to the true means, the classic law-of-large-numbers effect.

</details>

### Exercise 3: Labelled output with imap() and walk2()

Given a list of model specifications (each a nested list with `family` and `formula`), build a labelled printout where each spec appears below a numbered heading like `=== Model 1: linear ===`.

```r title="Exercise: imap and walk two printouts"
# Exercise 3: imap + walk2 for labelled printout
my_specs <- list(
  linear   = list(family = "gaussian", formula = "y ~ x"),
  logistic = list(family = "binomial", formula = "y ~ x1 + x2"),
  poisson  = list(family = "poisson",  formula = "y ~ x1 + x2 + x3")
)

# Hint: 1) imap_chr() to build the heading lines (use the list name + its position)
#       2) walk2() to print each heading followed by the spec

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Labelled printout solution"
my_specs <- list(
  linear   = list(family = "gaussian", formula = "y ~ x"),
  logistic = list(family = "binomial", formula = "y ~ x1 + x2"),
  poisson  = list(family = "poisson",  formula = "y ~ x1 + x2 + x3")
)

my_headings <- imap_chr(my_specs, \(spec, name) {
  paste0("=== Model ", match(name, names(my_specs)), ": ", name, " ===")
})

walk2(my_headings, my_specs, \(heading, spec) {
  cat(heading, "\n")
  cat("  family:  ", spec$family, "\n")
  cat("  formula: ", spec$formula, "\n\n")
})
#> === Model 1: linear ===
#>   family:   gaussian
#>   formula:  y ~ x
#>
#> === Model 2: logistic ===
#>   family:   binomial
#>   formula:  y ~ x1 + x2
#>
#> === Model 3: poisson ===
#>   family:   poisson
#>   formula:  y ~ x1 + x2 + x3
```

**Explanation:** `imap_chr()` builds one heading string per spec, using the list name as the model label. Then `walk2()` walks the headings and specs in parallel, printing each heading followed by the model's family and formula. This is the pattern you'd use to build progress logs or formatted reports.

</details>

## Complete Example: a mini Monte Carlo study

Here's how the pieces fit together in a realistic workflow. The goal is to compare how well the sample mean recovers the true mean at three different sample sizes (`n = 10, 50, 200`) for two distributions (standard normal and exponential).

We'll use `pmap()` to iterate the experiment grid, `map_dbl()` to summarise each draw, and `walk()` to print a formatted per-distribution report.

```r title="End-to-end mini Monte Carlo study"
library(dplyr)
library(tibble)

# Build a 6-row experiment grid: 3 sample sizes × 2 distributions
experiments <- tibble(
  dist      = rep(c("normal", "exponential"), each = 3),
  n         = rep(c(10, 50, 200), times = 2),
  true_mean = rep(c(0, 1), each = 3)    # N(0,1) has mean 0; Exp(1) has mean 1
)

set.seed(2026)

# Run every experiment with pmap(): one random sample per row
experiments <- experiments |>
  mutate(
    sample        = pmap(list(dist, n), \(dist, n) {
      if (dist == "normal") rnorm(n) else rexp(n, rate = 1)
    }),
    observed_mean = map_dbl(sample, mean),
    observed_sd   = map_dbl(sample, sd),
    abs_error     = abs(observed_mean - true_mean)
  )

# Show the results (drop the raw sample column for readability)
experiments |> select(-sample)
#> # A tibble: 6 × 5
#>   dist            n true_mean observed_mean observed_sd abs_error
#>   <chr>       <dbl>     <dbl>         <dbl>       <dbl>     <dbl>
#> 1 normal         10         0         0.172       0.825    0.172
#> 2 normal         50         0         0.0311      1.01     0.0311
#> 3 normal        200         0        -0.0282      0.965    0.0282
#> 4 exponential    10         1         1.02        1.13     0.0247
#> 5 exponential    50         1         0.906       0.801    0.0943
#> 6 exponential   200         1         1.06        1.04     0.0605
```

Every column in the results tibble came from a different map variant. `pmap()` ran the experiments, `map_dbl()` extracted the observed mean and SD from each sample, and plain vectorised arithmetic handled `abs_error`. Notice the `sample` column, it's a **list-column**, one random sample per row, preserved for inspection. That's the tidyverse's native way of holding "one object per row."

Finally, print a per-distribution summary using `walk()` on a split of the tibble.

```r title="walk split by distribution results"
walk(split(experiments, experiments$dist), \(df) {
  cat("Distribution:", unique(df$dist), "\n")
  cat("  Mean absolute error by n:\n")
  for (i in seq_len(nrow(df))) {
    cat("    n =", df$n[i], ": abs_error =", round(df$abs_error[i], 4), "\n")
  }
  cat("\n")
})
#> Distribution: exponential
#>   Mean absolute error by n:
#>     n = 10 : abs_error = 0.0247
#>     n = 50 : abs_error = 0.0943
#>     n = 200 : abs_error = 0.0605
#>
#> Distribution: normal
#>   Mean absolute error by n:
#>     n = 10 : abs_error = 0.172
#>     n = 50 : abs_error = 0.0311
#>     n = 200 : abs_error = 0.0282
```

This is the kind of workflow `purrr` is built for. Each map variant has one job, `pmap` for the experiment grid, `map_dbl` for the scalar summaries, `walk` for the side-effect printing, and they all compose into a single readable pipeline.

## Summary

Pick the variant by asking three questions: **how many inputs?**, **do I need the index or name?**, and **do I want a return value or a side effect?** The table below is the whole map family in one grid.

![Pick the right map variant in three questions: how many inputs, need index/name, return value or side effect.](screenshots/purrr-map-Variants-decision-flow.webp)
*Figure 3: A three-question decision flow that narrows 30+ map functions down to one.*

| Variant | Inputs | Returns | Use when |
|---|---|---|---|
| `map()` | 1 | list | Output type varies, or you want a list |
| `map_dbl()` | 1 | double vector | Every call returns one double |
| `map_int()` | 1 | integer vector | Every call returns one integer |
| `map_chr()` | 1 | character vector | Every call returns one string |
| `map_lgl()` | 1 | logical vector | Every call returns `TRUE`/`FALSE` |
| `map2()` / `map2_*` | 2 | list or typed vector | Iterating two paired vectors |
| `pmap()` / `pmap_*` | n (list) | list or typed vector | 3+ inputs, or a tibble of specs |
| `imap()` / `imap_*` | 1 + index | list or typed vector | You need the name or position alongside the value |
| `walk()` | 1 | input (invisibly) | Side effects only, printing, saving, logging |
| `walk2()` / `pwalk()` | 2 or n | input (invisibly) | Multi-input side effects |

**Key takeaways**

1. `map()` is for one input; `map2()` pairs two; `pmap()` scales to any number.
2. The `_dbl`/`_int`/`_chr`/`_lgl` suffix turns the list output into a flat atomic vector, and enforces the type.
3. `imap()` is the R equivalent of "enumerate", use it whenever you'd reach for `seq_along()` or `names()` inside a manual loop.
4. `walk()` is for side effects: no list of `NULL`s, returns the input invisibly so pipelines keep flowing.
5. When in doubt, name your `pmap()` list elements to match the target function's argument names, it eliminates lambdas entirely.

## References

1. Wickham, H., *Advanced R*, 2nd Edition. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
2. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 27: Iteration. [Link](https://r4ds.hadley.nz/iteration)
3. purrr documentation, `map()` reference. [Link](https://purrr.tidyverse.org/reference/map.html)
4. purrr documentation, `map2()` and `pmap()` reference. [Link](https://purrr.tidyverse.org/reference/map2.html)
5. purrr documentation, `imap()` reference. [Link](https://purrr.tidyverse.org/reference/imap.html)
6. Stanford DCL, *Functional Programming with purrr*, parallel iteration chapter. [Link](https://dcl-prog.stanford.edu/purrr-parallel.html)
7. Wickham, H., *Advanced R*, 1st Edition archive on functional style. [Link](http://adv-r.had.co.nz/Functional-programming.html)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html), the broader paradigm that makes `map` feel natural: first-class functions, pure functions, and composition.
- [Writing R Functions](R-Functions.html), how to write clean functions for the `.f` argument you keep passing to every map variant.
- [dplyr Basics](dplyr-Basics.html), the natural companion to purrr; `mutate()` + `pmap()` is the workflow for per-row computations on tibbles.
