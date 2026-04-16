---
title: "Base R's Functional Triad: Reduce(), Filter(), Map() — Without purrr"
slug: Reduce-Filter-Map-in-R
description: "Before purrr, base R had Reduce(), Filter(), and Map(). Learn how they work, compare to purrr equivalents, and when base R's versions are the right choice."
keywords: "Reduce in R, Filter in R, Map in R, base R functional programming, R higher-order functions, R Reduce accumulate, R purrr alternatives"
auto_link_terms: "Reduce()|Filter()|Map()|base R functional programming|higher-order functions in R|Reduce accumulate|R functional triad"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: 2026-04-14
curriculum_id: "4.2.6"
post_type: C
sidebar_section: "Advanced R"
sidebar_title: "Reduce, Filter, Map"
sidebar_order: 6
difficulty: "Advanced"
---

# Base R's Functional Triad: Reduce(), Filter(), Map() — Without purrr

<p class="lead">R has three dependency-free higher-order functions — <code>Reduce()</code>, <code>Filter()</code>, and <code>Map()</code> — that handle the core patterns of functional programming without loading a single package.</p>

## Why use Reduce(), Filter(), Map() when purrr exists?

You've probably seen purrr's `map()`, `keep()`, and `reduce()` in tutorials. Base R ships with the same ideas — spelled `Map()`, `Filter()`, and `Reduce()` — and they work on a fresh R install with zero packages loaded. When you're writing a utility script, authoring a package that wants minimal dependencies, or teaching the language, the base versions pull their weight. Here's what the triad actually does, shown on one tiny vector so you can see all three at once.

We'll apply each function to the same input `nums <- 1:5` so the difference in what they produce is obvious from the output.

```r
nums <- 1:5

# Reduce: collapse to a single value
Reduce("+", nums)
#> [1] 15

# Filter: keep the elements passing a test
Filter(function(x) x > 2, nums)
#> [1] 3 4 5

# Map: transform each element, return a list
Map(function(x) x^2, 1:3)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 4
#>
#> [[3]]
#> [1] 9
```

Three functions, three distinct shapes of result. `Reduce` gave back one number, `Filter` gave back a shorter vector of the same type, and `Map` gave back a list — even though the input was a plain vector. That list-output from `Map` is the first surprise most learners hit; we'll unpack it in its own section below.

[NOTE]
**None of this requires installing anything.** Reduce, Filter, and Map live in the base package, so they are available on any R session. If you see them called "higher-order functions," that just means they take another function as an argument.

**Try it:** Given the vector `ex_nums <- c(2, 4, 6, 8)`, call all three functions: Reduce with `"+"`, Filter keeping values greater than 4, and Map doubling each value.

```r
# Try it: run the triad on ex_nums
ex_nums <- c(2, 4, 6, 8)

# your code here

#> Expected:
#>   Reduce  -> 20
#>   Filter  -> 6 8
#>   Map     -> list(4, 8, 12, 16)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_nums <- c(2, 4, 6, 8)
Reduce("+", ex_nums)
#> [1] 20
Filter(function(x) x > 4, ex_nums)
#> [1] 6 8
Map(function(x) x * 2, ex_nums)
#> [[1]]
#> [1] 4
#> [[2]]
#> [1] 8
#> [[3]]
#> [1] 12
#> [[4]]
#> [1] 16
```

**Explanation:** Each function takes the same input but returns a different shape — scalar, vector, list.

</details>

## How does Reduce() collapse a list into one value?

`Reduce` takes a two-argument function and threads it across your vector, carrying the running result forward. Calling `Reduce("+", 1:4)` is the same as writing `((1 + 2) + 3) + 4`. The function folds the input one step at a time until only a single value remains.

![Reduce() threads a running result through every element of the vector.](screenshots/Reduce-Filter-Map-in-R-reduce-flow.webp)
*Figure 1: Reduce() threads a running result through every element of the vector.*

Let's see the sum version spelled out, then push the same pattern to something less obvious.

```r
# Sum of 1..4 via Reduce
Reduce("+", 1:4)
#> [1] 10
```

That single line does the work of a for-loop with an accumulator. `Reduce` called `+` on 1 and 2, got 3, then called `+` on 3 and 3, got 6, then called `+` on 6 and 4, got 10. The same machinery works for any two-argument function — including ones that don't look like math.

```r
# Glue characters into one string
letters_vec <- c("a", "b", "c", "d")
Reduce(paste, letters_vec)
#> [1] "a b c d"
```

Here `Reduce` folded `paste` across the letters, building up `"a b"`, then `"a b c"`, then `"a b c d"`. Notice we never wrote a loop or tracked an index — the sequencing is implicit.

The real-world payoff is operations that need to combine *many* things pairwise. Intersecting three or more vectors is a classic case: `intersect` only takes two arguments at a time, so you'd have to chain it manually. `Reduce` handles the chaining for you.

```r
# Find values common to all three vectors
sets <- list(c(1, 2, 3, 4),
             c(2, 3, 4, 5),
             c(3, 4, 5, 6))
Reduce(intersect, sets)
#> [1] 3 4
```

`Reduce` called `intersect` on the first two vectors to get `c(2, 3, 4)`, then called `intersect` on that result and the third vector to get `c(3, 4)`. With one more element in `sets` the answer would shrink further — the code doesn't change.

[TIP]
**Pass init= when the vector could be empty.** `Reduce("+", integer(0))` returns `NULL`, which breaks any code that expects a number. Writing `Reduce("+", integer(0), init = 0)` returns `0` instead — a safer default whenever the input length isn't guaranteed.

**Try it:** Use Reduce to compute the product of `1:5` without calling `prod()`.

```r
# Try it: product via Reduce
ex_result <- # your code here

ex_result
#> Expected: [1] 120
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_result <- Reduce("*", 1:5)
ex_result
#> [1] 120
```

**Explanation:** `"*"` is a two-argument function just like `"+"`; passing its name as a string tells Reduce which operator to fold.

</details>

## How does Filter() keep elements that match a predicate?

`Filter` takes a *predicate* — a function that returns `TRUE` or `FALSE` for each element — and hands back only the elements where the predicate was `TRUE`. Think of it as the functional cousin of `x[condition]`. It shines when the condition is easier to express as a function than as a boolean expression.

```r
# Keep only even numbers
Filter(function(x) x %% 2 == 0, 1:10)
#>  [1]  2  4  6  8 10
```

The predicate here is `function(x) x %% 2 == 0`. `Filter` ran it on every element of `1:10` and kept the ones where it returned `TRUE`. You could do the same with `x[x %% 2 == 0]` — but the moment your condition gets complex, a named predicate is far more readable.

Filter is especially handy with heterogeneous lists, where writing a single boolean expression wouldn't even work because the elements aren't all the same type.

```r
# Filter a mixed list by type
mixed <- list(1, "a", TRUE, 3.14, "hi", 7L)
Filter(is.numeric, mixed)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 3.14
#>
#> [[3]]
#> [1] 7
```

Notice that `is.numeric` caught the integer `7L` as well as the double `3.14`. `Filter` kept the list structure intact — it returned a *list*, not a vector — because the input was a list. That type-preservation is what makes `Filter` useful in pipelines handling ragged data.

A practical example from everyday R work: suppose you've split a data frame into a list of sub-data-frames and want to discard the ones that are too small to analyse.

```r
# Drop data frames with fewer than 10 rows
dfs <- split(iris, iris$Species)
big_dfs <- Filter(function(d) nrow(d) >= 10, dfs)
names(big_dfs)
#> [1] "setosa"     "versicolor" "virginica"
```

All three species groups survived the filter because `iris` has 50 rows per species. If one group were tiny, `Filter` would silently drop it — the downstream code wouldn't need to know anything changed.

[KEY INSIGHT]
**Filter preserves the input's type.** Give it a vector, it returns a vector. Give it a list, it returns a list. That symmetry means you can chain Filter into any pipeline without worrying that the next step will choke on a surprise type change.

**Try it:** Filter the words longer than 4 characters from `ex_words <- c("cat", "tiger", "dog", "cheetah", "ox")`.

```r
# Try it: keep long words
ex_words <- c("cat", "tiger", "dog", "cheetah", "ox")

ex_long <- # your code here
ex_long
#> Expected: [1] "tiger"   "cheetah"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_words <- c("cat", "tiger", "dog", "cheetah", "ox")
ex_long <- Filter(function(w) nchar(w) > 4, ex_words)
ex_long
#> [1] "tiger"   "cheetah"
```

**Explanation:** `nchar(w) > 4` returns TRUE or FALSE per element; Filter keeps the TRUE ones and drops the rest.

</details>

## What does Map() return that sapply() does not?

`Map` applies a function element-wise to one or more vectors and *always* returns a list. The "one or more" part is the key feature: with two inputs, `Map` walks them in parallel, passing the first elements of each to your function, then the second, and so on.

```r
# Parallel iteration over two vectors
Map(function(x, y) x + y, 1:3, 4:6)
#> [[1]]
#> [1] 5
#>
#> [[2]]
#> [1] 7
#>
#> [[3]]
#> [1] 9
```

`Map` called `function(x, y) x + y` three times: once with `(1, 4)`, once with `(2, 5)`, once with `(3, 6)`. The result is a list of three numbers. If you expected a plain vector `c(5, 7, 9)`, you're now meeting the gotcha that catches every newcomer: `Map` always wraps its output in a list, even when every element is a single number.

`sapply` does the same element-wise work but tries to simplify its result. Comparing them side-by-side makes the difference obvious.

```r
# Map vs sapply
Map(function(x) x^2, 1:4)
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

sapply(1:4, function(x) x^2)
#> [1]  1  4  9 16
```

Same computation, different packaging. `sapply` collapsed the four scalars into a length-4 vector because it could; `Map` left them as a list. The trade-off is predictability — `sapply`'s return type depends on the function's output (sometimes a vector, sometimes a matrix, sometimes still a list), while `Map`'s return type is always a list no matter what. When you need that stability, `Map` wins.

A natural fit for `Map` is applying a summary function to every column of a data frame at once.

```r
# Mean of each numeric column in iris
Map(mean, iris[1:4])
#> $Sepal.Length
#> [1] 5.843333
#>
#> $Sepal.Width
#> [1] 3.057333
#>
#> $Petal.Length
#> [1] 3.758
#>
#> $Petal.Width
#> [1] 1.199333
```

Because a data frame *is* a list of columns, `Map(mean, iris[1:4])` just runs `mean` on each column and returns a named list. The names are preserved from the columns, which is often exactly what you want for downstream reporting.

[WARNING]
**Map returns a list even when a vector seems obvious.** If every call returns a single number and you want a numeric vector, wrap the result with `unlist()` or use `vapply(x, f, numeric(1))` instead. Forgetting this is a top-5 base R gotcha.

**Try it:** Use Map to paste each element of `ex_first` with the corresponding element of `ex_last` into a full name.

```r
# Try it: parallel paste with Map
ex_first <- c("Ada", "Alan", "Grace")
ex_last  <- c("Lovelace", "Turing", "Hopper")

ex_names <- # your code here
ex_names
#> Expected a list with:
#>   "Ada Lovelace", "Alan Turing", "Grace Hopper"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_first <- c("Ada", "Alan", "Grace")
ex_last  <- c("Lovelace", "Turing", "Hopper")
ex_names <- Map(function(f, l) paste(f, l), ex_first, ex_last)
ex_names
#> [[1]]
#> [1] "Ada Lovelace"
#>
#> [[2]]
#> [1] "Alan Turing"
#>
#> [[3]]
#> [1] "Grace Hopper"
```

**Explanation:** Map walks both vectors in lock-step, passing matched pairs to the function.

</details>

## How does accumulate=TRUE show every intermediate step?

By default `Reduce` throws away the running result and gives you only the final value. Set `accumulate = TRUE` and it returns the running result at each step — a cumulative trace of the reduction. This unlocks a whole family of "running totals" without writing a loop.

```r
# Running sum of 1..5
Reduce("+", 1:5, accumulate = TRUE)
#> [1]  1  3  6 10 15
```

The first entry is `1` (just the first element), the second is `1+2=3`, the third is `3+3=6`, and so on until the final `15`. That's exactly what `cumsum(1:5)` produces — and for sums, products, mins, and maxes, the `cum*` shortcuts are shorter. `Reduce(accumulate=TRUE)` earns its keep when the step function is custom, like a running max:

```r
# Running max via Reduce + accumulate
Reduce(max, c(3, 1, 4, 1, 5, 9, 2, 6), accumulate = TRUE)
#> [1] 3 3 4 4 5 9 9 9
```

Every position shows the largest value seen up to that point. The running max never decreases, which is exactly the property you'd want for tracking a stock's all-time high or a player's best score over time.

You can also fold from the right instead of the left by setting `right = TRUE`, which changes the associativity of the operation.

```r
# Right-to-left reduction
Reduce("-", 1:4)
#> [1] -8

Reduce("-", 1:4, right = TRUE)
#> [1] -2
```

`Reduce("-", 1:4)` computes `((1 - 2) - 3) - 4 = -8`, while `right = TRUE` computes `1 - (2 - (3 - 4)) = -2`. For commutative operations like `+` or `max` the direction doesn't matter, so you'll rarely set `right = TRUE` for them. For non-commutative operations like subtraction, division, or string concatenation, flipping the direction changes the answer entirely.

[TIP]
**Reach for cumsum/cumprod/cummax first, accumulate second.** The `cum*` family is faster and more familiar for the arithmetic cases. Use `Reduce(..., accumulate = TRUE)` when your step function is custom, like merging nested data structures or building running set unions.

**Try it:** Use Reduce with `accumulate = TRUE` to compute the running minimum of `ex_stream <- c(8, 3, 5, 1, 4, 1, 2)`.

```r
# Try it: running min
ex_stream <- c(8, 3, 5, 1, 4, 1, 2)

ex_running_min <- # your code here
ex_running_min
#> Expected: [1] 8 3 3 1 1 1 1
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_stream <- c(8, 3, 5, 1, 4, 1, 2)
ex_running_min <- Reduce(min, ex_stream, accumulate = TRUE)
ex_running_min
#> [1] 8 3 3 1 1 1 1
```

**Explanation:** `min` is a two-argument function when given two values; Reduce folds it across the vector, and `accumulate = TRUE` retains each intermediate result.

</details>

## When should you pick base R's triad over purrr?

The purrr package is a popular tidyverse re-design of these same ideas. Its main wins are strictly-typed return values (`map_dbl`, `map_chr`, `map_lgl`), pipe-friendly argument order (data first), and clearer error messages when something fails mid-iteration. For interactive analysis in a tidyverse project, purrr is usually the nicer ergonomic choice.

![Each base R function has a purrr twin with the same underlying idea.](screenshots/Reduce-Filter-Map-in-R-base-vs-purrr.webp)
*Figure 2: Each base R function has a purrr twin with the same underlying idea.*

Here is the direct mapping between the two families:

| Base R | purrr | Notes |
|---|---|---|
| `Reduce(f, x)` | `reduce(x, f)` | purrr takes data first for piping |
| `Reduce(f, x, accumulate = TRUE)` | `accumulate(x, f)` | purrr splits this into a separate function |
| `Filter(p, x)` | `keep(x, p)` / `discard(x, p)` | purrr has both "keep" and the inverse |
| `Map(f, x, y)` | `map2(x, y, f)` | purrr has map, map2, pmap by arity |
| (none) | `map_dbl`, `map_chr`, `map_int` | typed variants — base R has no direct equivalent |

The side-by-side below shows the same task written both ways. They produce the same answer, but the reading experience is different.

```r
library(purrr)

# Sum with base R
Reduce("+", nums)
#> [1] 15

# Sum with purrr
reduce(nums, `+`)
#> [1] 15
```

Both give `15`. The base R version reads function-first, the purrr version reads data-first and chains naturally into a `|>` pipe. In a long dplyr pipeline, `|> reduce(`+`)` fits the flow of the surrounding code better than `|> (\(x) Reduce("+", x))()`.

So when does base R's triad win? In three situations:

1. **Package authoring.** If you're writing an R package and want zero imports beyond base, the triad gives you real functional programming without adding purrr to Imports.
2. **Small scripts and utilities.** A 30-line script doesn't need a library load just to combine three vectors with intersect.
3. **Teaching.** Learners can call Reduce, Filter, and Map on day one without installing anything — crucial in classrooms or online environments.

[KEY INSIGHT]
**purrr is a re-design of the same core ideas.** Once you understand what base R's triad does under the hood, the purrr functions will feel obvious — you already know what they're computing, you're just learning nicer names and argument orders.

**Try it:** Rewrite the purrr expression `keep(1:10, function(x) x > 5)` using base R's Filter.

```r
# Try it: purrr -> base R
ex_big <- # your code here
ex_big
#> Expected: [1]  6  7  8  9 10
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_big <- Filter(function(x) x > 5, 1:10)
ex_big
#> [1]  6  7  8  9 10
```

**Explanation:** `keep` and `Filter` both take a predicate and return the matching elements — only the argument order differs.

</details>

## Practice Exercises

### Exercise 1: Element-wise sum of parallel vectors

Given `my_nums <- list(c(1, 2, 3), c(4, 5, 6), c(7, 8, 9))`, use Reduce to compute a single vector containing the element-wise sum: `c(12, 15, 18)`. Save the result to `my_result1`.

```r
# Exercise 1: element-wise sum across a list of vectors
# Hint: Reduce chains a two-argument function; "+" on two vectors adds element-wise

my_nums <- list(c(1, 2, 3), c(4, 5, 6), c(7, 8, 9))

my_result1 <- # your code here
my_result1
```

<details>
<summary>Click to reveal solution</summary>

```r
my_nums <- list(c(1, 2, 3), c(4, 5, 6), c(7, 8, 9))
my_result1 <- Reduce("+", my_nums)
my_result1
#> [1] 12 15 18
```

**Explanation:** Because R's `+` is vectorised, calling it on two length-3 vectors returns a length-3 vector. Reduce folds that across the list: `c(1,2,3) + c(4,5,6) = c(5,7,9)`, then `c(5,7,9) + c(7,8,9) = c(12,15,18)`.

</details>

### Exercise 2: Numeric column summariser

Write a function `summarize_cols(df)` that returns a named list giving the mean of every *numeric* column in `df`. Use Filter to drop non-numeric columns, then Map to compute each mean. No for-loops. Test it on `iris`.

```r
# Exercise 2: summarize only the numeric columns
# Hint: Filter(is.numeric, df) keeps the numeric columns; Map(mean, ...) averages them

summarize_cols <- function(df) {
  # your code here
}

summarize_cols(iris)
```

<details>
<summary>Click to reveal solution</summary>

```r
summarize_cols <- function(df) {
  numeric_cols <- Filter(is.numeric, df)
  Map(mean, numeric_cols)
}

summarize_cols(iris)
#> $Sepal.Length
#> [1] 5.843333
#>
#> $Sepal.Width
#> [1] 3.057333
#>
#> $Petal.Length
#> [1] 3.758
#>
#> $Petal.Width
#> [1] 1.199333
```

**Explanation:** A data frame is a list of columns, so `Filter(is.numeric, iris)` returns the four numeric columns (dropping `Species`). `Map(mean, ...)` then runs mean on each and returns a named list. The function is five lines with no loops and no packages.

</details>

### Exercise 3: Running bank balance

A vector `my_txn <- c(100, -40, -10, 50, -20, 75)` represents deposits (positive) and withdrawals (negative). Use Reduce with `accumulate = TRUE` to produce the balance after each transaction. Save the result to `my_balance`.

```r
# Exercise 3: running balance
# Hint: the step function is just "+", and accumulate = TRUE keeps every intermediate total

my_txn <- c(100, -40, -10, 50, -20, 75)

my_balance <- # your code here
my_balance
```

<details>
<summary>Click to reveal solution</summary>

```r
my_txn <- c(100, -40, -10, 50, -20, 75)
my_balance <- Reduce("+", my_txn, accumulate = TRUE)
my_balance
#> [1] 100  60  50 100  80 155
```

**Explanation:** Starting at 100, each subsequent value is the previous balance plus the current transaction. `accumulate = TRUE` preserves that trail so you can plot it or report it row-by-row.

</details>

## Complete Example

Let's put all three functions together in one end-to-end pipeline. The task: given `iris` split by `Species`, drop any species group smaller than 10 rows (there won't be any, but we'll check anyway), compute the mean sepal length for each surviving group, and then combine those means into a single overall average.

```r
# Step 1: split iris into a list of data frames, one per species
species_dfs <- split(iris, iris$Species)

# Step 2: Filter out any group with fewer than 10 rows
big_groups <- Filter(function(d) nrow(d) >= 10, species_dfs)
names(big_groups)
#> [1] "setosa"     "versicolor" "virginica"

# Step 3: Map the mean sepal length across each surviving group
means_list <- Map(function(d) mean(d$Sepal.Length), big_groups)
means_list
#> $setosa
#> [1] 5.006
#>
#> $versicolor
#> [1] 5.936
#>
#> $virginica
#> [1] 6.588

# Step 4: Reduce the list of means to a single overall mean
overall_mean <- Reduce("+", means_list) / length(means_list)
overall_mean
#> [1] 5.843333
```

Every step used a different member of the triad. Filter handled "drop what we don't want," Map handled "compute per-group," and Reduce handled "combine everything back." Together they solved a split-apply-combine problem with no loops and no packages beyond base R — the kind of thing you'd typically reach for dplyr or purrr to do.

## Summary

![The functional triad at a glance — what each one does and why.](screenshots/Reduce-Filter-Map-in-R-triad-overview.webp)
*Figure 3: The functional triad at a glance — what each one does and why.*

| Function | Purpose | Input | Output | purrr equivalent |
|---|---|---|---|---|
| `Reduce()` | Collapse to a single value by folding a 2-arg function | Vector or list | One value (or all intermediates with accumulate = TRUE) | `reduce()` / `accumulate()` |
| `Filter()` | Keep elements where a predicate is TRUE | Vector or list | Same type as input, shorter | `keep()` / `discard()` |
| `Map()` | Apply a function element-wise to one or more vectors | One or more vectors | List (always) | `map()` / `map2()` / `pmap()` |

**Key takeaways:**

1. **Reduce folds**, turning many things into one. Set `accumulate = TRUE` when you want the running trail.
2. **Filter preserves type**, returning vectors from vectors and lists from lists. Its predicate is any function returning TRUE or FALSE.
3. **Map always returns a list**, even when the values look like they could be a vector. Wrap with `unlist()` or use `vapply` when you need a specific type.
4. The triad is **dependency-free**, making it the right pick for packages, scripts, and teaching.
5. purrr re-designs the same ideas with nicer ergonomics — learning base first makes purrr feel natural.

## References

1. R Core Team — *Common Higher-Order Functions in Functional Programming Languages* (`base::funprog`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/funprog.html)
2. Wickham, H. — *Advanced R*, 2nd edition, Chapter 9: Functionals. CRC Press (2019). [Link](https://adv-r.hadley.nz/functionals.html)
3. purrr documentation — `reduce()`, `map()`, `keep()` reference pages. [Link](https://purrr.tidyverse.org/reference/index.html)
4. R Core Team — *An Introduction to R*, Section 10: Writing your own functions. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
5. Hohenfeld, J. — *Reduce, Filter, Find and more: R's unknown heroes*. [Link](https://hohenfeld.is/posts/reduce-filter-find-and-more-r-s-unknown-heroes/)
6. Monroe, B. L. — *Split-Apply-Combine and Map-Reduce in R*, SoDA 501 course notes. [Link](https://burtmonroe.github.io/SoDA501/Materials/SplitApplyCombine_R/)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the big-picture overview of functional style in R, including pure functions and closures.
- [R Anonymous Functions](R-Anonymous-Functions.html) — the lambda-style functions you just passed into Reduce, Filter, and Map.
- [purrr map() Variants](purrr-map-Variants.html) — the typed cousins (map_dbl, map_chr, map_int) that return vectors instead of lists.
