---
title: "R Foundations Lesson 3: The purrr map Family"
catalog_blurb: "Run a function across each item and get a consistent result every time."
description: "Meet purrr's map family in R: map for lists, the type-stable map_dbl, map_chr and map_lgl, map2 and pmap for several inputs, and walk for side effects."
keywords: "purrr map in R, map_dbl, map_chr, map2, pmap, walk, type-stable iteration, purrr vs apply, functional programming R, tidyverse iteration"
post_type: "LESSON"
curriculum_id: "1.6.3"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-iteration"
course_title: "R Foundations: Iteration"
course_lesson: "3"
course_total: "4"
course_landing: "R-Foundations-Iteration-Course.html"
course_next: "Resilient-and-Nested-Iteration.html"
course_prev: "The-apply-Family.html"
---

=== step === cover
::eyebrow Lesson 3 of 4
## The purrr map Family

In Lesson 2 you used `sapply` to summarise Rosewood Bakery's week: its daily units sold per item, like the croissant's `c(40, 45, 50, 50, 55, 60)`. It was the convenient one. The catch was that one line could hand you a vector, a matrix, *or* a list, depending on the data it happened to see that day. Fine at the console; a quiet bug waiting to happen inside a script.

The **purrr** package fixes exactly that. It gives you one consistent family of `map` functions: same "run a function on each piece" idea as the apply family, but where *you* decide the shape of the answer up front, and R holds it to that promise.

By the end of this lesson you will be able to:

- Run your own function over each element with `map`, and know it always returns a list
- Pick a typed variant (`map_dbl`, `map_chr`, `map_lgl`, `map_int`) to lock down the output shape
- Walk two inputs in step with `map2`, and several at once with `pmap`
- Reach for `walk` when you want a function's side effect, not its return value

**Prerequisites:** Lesson 2 ([the apply family](The-apply-Family.html), and why `sapply`'s shape can shift), and you can [write a function](Writing-Functions-in-R.html) and build a [list](Lists-and-Nested-Data.html).

::widget process-flow {"steps":[{"title":"Take each piece","sub":"each element of a list, in turn"},{"title":"Run your function","sub":"the function you supply, on that one piece"},{"title":"Return the shape you asked for","sub":"a list, or a typed vector you name up front"}]}

=== step === concept
::eyebrow The consistent core
## map(): the modern lapply

Rosewood Bakery is back. As in Lesson 2, it tracks **daily units sold** for each item: one run of numbers per product, bundled in a list. Build this week's list once now (run it):

```r
library(purrr)

# Rosewood Bakery: units sold Mon to Sat, one vector per item
sales <- list(
  croissant = c(40, 45, 50, 50, 55, 60),
  muffin    = c(20, 25, 30, 30, 35, 40),
  bagel     = c(35, 38, 40, 40, 42, 45)
)

map(sales, mean)        # run mean() on each item; map always returns a list
#> $croissant
#> [1] 50
#> 
#> $muffin
#> [1] 30
#> 
#> $bagel
#> [1] 40
```

That is `lapply` from Lesson 2 with a tidier name: hand `map()` a collection and a function, and it runs the function on each element and returns a **list of the same length**, names carried over. Here is the idea precisely. If your list is \(x = (x_1, x_2, \dots, x_n)\) with \(n\) elements (here \(n = 3\)) and \(f\) is the function you supply (here `mean`), then `map` computes

\[ \text{map}(x, f) = \big(f(x_1),\, f(x_2),\, \dots,\, f(x_n)\big) \]

and hands the \(n\) answers back in a list. Programmers call this *mapping* a function over a collection.

When the function you want is not a ready-made name like `mean`, write it inline. purrr accepts a base R "lambda", `\(x) ...`, where `x` is the current item:

```r
map(sales, \(x) max(x) - min(x))   # each item's weekly spread: max minus min
#> $croissant
#> [1] 20
#> 
#> $muffin
#> [1] 20
#> 
#> $bagel
#> [1] 10
```

[NOTE]
You will also see purrr's older shorthand, a formula with `.x` for the current item: `map(sales, ~ max(.x) - min(.x))` does the same thing. Both styles are fine; the `\(x)` lambda is the newer, more readable one.

=== step === concept
::eyebrow Get the shape you asked for
## The typed variants

A list is safe but clunky when every answer is just one number. The typed cousins of `map` run the same job, then return a plain **vector of the type named in the suffix**, and they error loudly if any result does not fit that promise. That single guarantee is the cure for `sapply`'s shifting shape.

```r
map_dbl(sales, mean)                       # one double each -> numeric vector
#> croissant    muffin     bagel 
#>        50        30        40

map_int(sales, length)                     # one integer each -> integer vector
#> croissant    muffin     bagel 
#>         6         6         6

map_lgl(sales, \(x) mean(x) > 45)          # one TRUE/FALSE each -> logical vector
#> croissant    muffin     bagel 
#>      TRUE     FALSE     FALSE

map_chr(sales, \(x) paste(max(x), "max"))  # one string each -> character vector
#>  croissant     muffin      bagel 
#>  "60 max"   "40 max"   "45 max"
```

Each suffix is a contract about *one result per item*:

| Variant | Each result must be | You get back |
|---|---|---|
| `map` | anything | a list |
| `map_dbl` | one number (double) | a numeric vector |
| `map_int` | one whole number | an integer vector |
| `map_chr` | one string | a character vector |
| `map_lgl` | one TRUE or FALSE | a logical vector |

Break the contract and the typed map stops you at once, naming the item that failed, instead of silently bending the shape:

```r-static
# range() returns TWO numbers, but map_dbl promised one:
map_dbl(sales, range)
#> Error in `map_dbl()`:
#> i In index: 1.
#> i With name: croissant.
#> Caused by error:
#> ! Result must be length 1, not 2.
```

[KEY INSIGHT]
This is the whole reason purrr exists. `sapply` *tries* to simplify and quietly returns whatever fits; `map_dbl` and friends *demand* the shape you named and fail on the very line that broke it. Predictable output is worth one extra keystroke.

=== step === quiz
::eyebrow Check yourself
## Which one gives a vector you can do math on?

You want each item's average daily sales as a plain named numeric vector, so the next line can compute `revenue <- averages * price`. Which call gives you that, guaranteed?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- `map(sales, mean)` ::no That runs `mean` on each item, but `map` *always* returns a list. You would get a list of single numbers, not a numeric vector ready for arithmetic.
- `map_dbl(sales, mean)` ::ok Right. `map_dbl` promises one double per item and hands back a named numeric vector, ready for math, and it would error loudly if any item returned something else.
- `sapply(sales, mean)` ::no It often works here, but `sapply`'s return type depends on the data: it can give a vector, a matrix, or a list. `map_dbl` guarantees the numeric vector you asked for.

=== step === concept
::eyebrow Two inputs at once
## map2(): walk two lists in step

So far each call needed one input. But Rosewood wants **revenue**, and that needs two things lined up: the mean units sold *and* the price, item by item. `map2` walks two inputs in lockstep, handing your function the i-th element of each, together.

```r
mean_units <- map_dbl(sales, mean)               # 50, 30, 40 per item
price      <- c(croissant = 3.5, muffin = 2.0, bagel = 1.5)

# map2 pairs the i-th units with the i-th price; \(u, p) names the two
map2_dbl(mean_units, price, \(u, p) u * p)       # mean daily revenue per item
#> croissant    muffin     bagel 
#>       175        60        60
```

The function now takes **two** arguments because there are two inputs; `map2_dbl` promises one number back per pair, exactly like `map_dbl` did for one input. The two inputs must be the same length, and the result is paired by position.

::widget process-flow {"steps":[{"title":"Pair them up","sub":"the i-th units with the i-th price"},{"title":"Run your function","sub":"multiply units by price for that item"},{"title":"Collect","sub":"one revenue per item, type fixed by the suffix"}]}

=== step === concept
::eyebrow Several inputs at once
## pmap(): walk a whole row of inputs

Two inputs has `map2`; three or more has `pmap` (*parallel map*). You hand `pmap` a single **list of inputs** (or, most usefully, a data frame), and it walks them together. With a data frame it takes one **row** at a time, and each column fills the function argument of the same name.

```r
library(tibble)

menu <- tibble(
  item  = c("croissant", "muffin", "bagel"),
  price = c(3.5, 2.0, 1.5),
  units = c(50, 30, 40)
)

# each row supplies item, price, units by name to the function
pmap_chr(menu, \(item, price, units) paste0(item, ": $", price * units))
#> [1] "croissant: $175" "muffin: $60"     "bagel: $60"
```

Matching by column name is what makes `pmap` the natural tool for "do this for every row of a table". Add a column and your function just gains an argument of that name; nothing else changes.

::widget process-flow {"steps":[{"title":"Take a row","sub":"one row of the table is one set of inputs"},{"title":"Match by name","sub":"each column fills the argument of the same name"},{"title":"Run and collect","sub":"one result per row, gathered in order"}]}

=== step === tryit
::eyebrow Your turn
## Best-day revenue, per item

Rosewood wants each item's **best single day's revenue**: its highest daily units times its price, returned as a named numeric vector. You have `sales` (the list of daily units) and `price` (one price per item) from earlier. Two inputs, one number out per item, so reach for `map2_dbl`, and fill in the function body. (`max(x)` is the largest value in a vector.)

```r
# sales (daily units per item) and price are already built above
best_day_revenue <- map2_dbl(sales, price, \(x, p) ____ )
best_day_revenue
```
::check {"regex":"max\\s*\\(\\s*x\\s*\\)\\s*\\*\\s*p|p\\s*\\*\\s*max\\s*\\(\\s*x\\s*\\)","gate":true,"difficulty":"intermediate","ok":"Exactly. map2 pairs each item's daily-units vector x with its price p, and max(x) * p gives that item's best-day revenue, with the numeric vector guaranteed by the _dbl suffix.","no":"You want the peak day's units times the price: max(x) * p."}
::solution
```r
best_day_revenue <- map2_dbl(sales, price, \(x, p) max(x) * p)
best_day_revenue
#> croissant    muffin     bagel 
#>     210.0      80.0      67.5
```

=== step === concept
::eyebrow When you want the doing, not the answer
## walk(): for side effects

Sometimes you do not want a value back at all. You want a function run **for its effect**: print a line, save a file, send a message. Using `map` for that works, but it builds a list of return values you never use (often a list of `NULL`s). `walk` is the honest tool: it runs the function purely for the side effect and returns its input, invisibly.

```r
# run a function for its side effect; nothing is collected as a result
walk(names(sales), \(item) cat("Prep station ready:", item, "\n"))
#> Prep station ready: croissant 
#> Prep station ready: muffin 
#> Prep station ready: bagel
```

Notice no list printed afterwards: `walk` returned its input silently. That is by design, so you can drop it into a pipeline and carry on:

```r
out <- walk(names(sales), \(item) cat("Baking", item, "\n"))
#> Baking croissant 
#> Baking muffin 
#> Baking bagel
out                       # the side effect happened; walk handed back its input unchanged
#> [1] "croissant" "muffin"    "bagel"
```

[NOTE]
The rule of thumb: if you want the results, use `map` (or a typed variant). If you only want the *doing* and the results would be noise, use `walk`.

=== step === quiz
::eyebrow Check yourself
## Which verb for a pure side effect?

You want to save a chart to disk for each of Rosewood's three items. Saving a file is a side effect; you do not need any value back. Which verb fits best?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- `map_dbl`, because it returns a clean numeric vector ::no You are not computing numbers, you are *doing* something (saving files). There is no single number per item to collect.
- `map`, so you also capture whatever each call returns ::no `map` would run the saves, but it also builds a list of return values you do not need (often a list of NULLs): wasted memory and noise for a pure side effect.
- `walk`, because you want the side effect and not a returned value ::ok Exactly. `walk` runs the function for its effect (saving, printing, messaging) and returns its input invisibly, so it reads as "do this for each", with nothing to collect.

=== step === concept
::eyebrow From base R to purrr
## The same family, two dialects

Everything here has a base R twin from Lesson 2. purrr's win is not new power; it is one consistent set of names and a return type you can rely on.

| Base R (Lesson 2) | purrr | What you get back |
|---|---|---|
| `lapply` | `map` | a list |
| `sapply` (simplify) | `map_dbl`, `map_chr`, `map_lgl`, `map_int` | a vector of THAT type, or a clear error |
| `vapply` | `map_dbl` and friends | a typed, checked vector |
| `mapply` / `Map` | `map2`, `pmap` | several inputs walked in step |
| a `for` loop for side effects | `walk` | the input, returned invisibly |

Two honest limits. First, purrr is an extra package dependency; base R's apply family ships with R and needs nothing installed, so for a one-off script `sapply`/`vapply` are perfectly fine. Second, `map` is not the C-level vectorization from Lesson 1: it still runs an R-level loop over the pieces, so for plain arithmetic on a whole vector, `prices * 1.08` beats any `map`. Reach for the map family when each piece needs *your own function*, and you want a predictable shape back.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [purrr: map() reference](https://purrr.tidyverse.org/reference/map.html) - the official documentation for `map` and every typed variant, with the exact argument rules.
- [purrr: map2() and pmap() reference](https://purrr.tidyverse.org/reference/map2.html) - how `map2`, `pmap`, `walk` and their typed suffixes line up several inputs.
- [R for Data Science (2e): Iteration](https://r4ds.hadley.nz/iteration.html) - Hadley Wickham's chapter on iterating with purrr and dplyr, with worked data examples.
- [Advanced R (2e): Functionals](https://adv-r.hadley.nz/functionals.html) - the deeper theory: `map` as a functional, and why this style beats hand-written loops.

=== step === complete
## Lesson 3 complete

You can now iterate the modern way: `map` for a guaranteed list, the typed `map_dbl`, `map_int`, `map_chr` and `map_lgl` when you want a specific shape locked down and checked, `map2` and `pmap` to walk two or many inputs in step, and `walk` for the side-effect jobs where the return value would just be noise. You also know the honest trade-off: purrr buys consistency at the cost of one dependency, and none of it replaces plain vectorization for simple arithmetic.

Next, Lesson 4: Resilient and Nested Iteration. You will keep a `map` going even when one element throws an error, using `safely` and `possibly`, and learn to work with list-columns, whole tables tucked inside a single column, with `nest` and `unnest`.
