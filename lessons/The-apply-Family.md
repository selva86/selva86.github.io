---
title: "R Foundations Lesson 2: The apply Family"
catalog_blurb: "Run your own function over each piece of a list or matrix."
description: "Run your own function over each element of a list or each row of a matrix, with no loop needed. Learn lapply, sapply, the type-safe vapply, and apply in R."
keywords: "apply family in R, lapply, sapply, vapply, apply function, base R iteration, functionals in R, lapply vs sapply, apply over matrix rows, MARGIN argument"
post_type: "LESSON"
curriculum_id: "1.6.2"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-iteration"
course_title: "R Foundations: Iteration"
course_lesson: "2"
course_total: "4"
course_landing: "R-Foundations-Iteration-Course.html"
course_next: "The-purrr-map-Family.html"
course_prev: "Why-Vectorization-Beats-Loops.html"
---

=== step === cover
::eyebrow Lesson 2 of 4
## The apply Family

In Lesson 1 you replaced hand-written loops with vectorized expressions: `prices * 1.08` raised every price at once. But that trick only works for R's built-in operations like `*` and `+`. What if you need to run *your own* function over each item, where each "item" is itself a whole vector (say a week of daily sales for one bakery product), or each row of a grid of numbers?

That is the job of the **apply family**: `lapply`, `sapply`, the type-safe `vapply`, and `apply`. You hand R a function and a collection; R runs the function on each piece and collects the answers, with no loop in sight.

By the end of this lesson you will be able to:

- Run your own function over each element of a list with `lapply`, and know it always returns a list
- Use `sapply` for a quick simplified result, and recognise when its return type becomes unpredictable
- Reach for `vapply` when you want a guaranteed shape, and a clear error when you do not get it
- Summarise the rows or columns of a matrix with `apply` and its `MARGIN` argument

**Prerequisites:** Lesson 1 ([vectorization](Why-Vectorization-Beats-Loops.html)), and you can [write a function](Writing-Functions-in-R.html) and build a [list](Lists-and-Nested-Data.html).

::widget process-flow {"steps":[{"title":"Take each piece","sub":"each element of a list, or each row of a matrix"},{"title":"Run your function","sub":"the same function you wrote, applied to that piece"},{"title":"Collect the results","sub":"gathered back into one object for you"}]}

=== step === concept
::eyebrow The shared idea
## One pattern, run on every piece

Rosewood Bakery now tracks **daily units sold** for each item: a separate run of numbers per product. That shape, several vectors bundled under one name, is a **list**, not a flat vector. Build this week's list once now (run it):

```r
# Rosewood Bakery: units sold Mon to Sat, one vector per item
sales <- list(
  croissant = c(40, 45, 50, 50, 55, 60),
  muffin    = c(20, 25, 30, 30, 35, 40),
  bagel     = c(35, 38, 40, 40, 42, 45)
)
sales
#> $croissant
#> [1] 40 45 50 50 55 60
#> 
#> $muffin
#> [1] 20 25 30 30 35 40
#> 
#> $bagel
#> [1] 35 38 40 40 42 45
```

Say you want the average daily sales for each item. You cannot write `mean(sales)`, that would try to average the whole tangle at once. You want `mean()` run *separately* on each element, and the three answers collected together. That "run a function on each piece, then collect" pattern is exactly what the apply family automates.

Here is the idea precisely. If your collection is \(x = (x_1, x_2, \dots, x_n)\), a list with \(n\) elements (here \(n = 3\)), and \(f\) is the function you supply (here `mean`), then `lapply` computes

\[ \text{lapply}(x, f) = \big(f(x_1),\, f(x_2),\, \dots,\, f(x_n)\big) \]

and hands the \(n\) answers back. Programmers call this *mapping* a function over a collection: \(x_i\) is the i-th element and \(n\) is how many there are.

[KEY INSIGHT]
Every member of the apply family is the same sentence with a different ending: "run this function on each piece, and return the results as ___." The only thing that changes is the shape of what you get back.

=== step === concept
::eyebrow The workhorse
## lapply(): always hands back a list

`lapply()` (think *list-apply*) is the most predictable member. Give it a list (or any vector) and a function, and it returns a **list of the same length**, with the function run on each element and the names carried over.

```r
mean_list <- lapply(sales, mean)   # run mean() on each item
mean_list
#> $croissant
#> [1] 50
#> 
#> $muffin
#> [1] 30
#> 
#> $bagel
#> [1] 40

class(mean_list)                   # what did we get back?
#> [1] "list"
length(mean_list)                  # one entry per input element
#> [1] 3
```

No counter, no `for`, no place to store results, just "run `mean` on each item." And the answer is *always* a list, every time, whatever the function returns. That total predictability is why `lapply` is the safe default when you will feed the result into more code.

=== step === quiz
::eyebrow Check yourself
## What comes back?

You run `lapply(sales, mean)` on the three-item `sales` list. What is the shape of the result?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- A list of length 3, holding one mean per item ::ok Right. `lapply` always returns a list the same length as its input: one element per piece, names preserved, whatever the function gives back.
- A numeric vector of length 3 ::no That is what `sapply` would try to give you. `lapply` never simplifies, it always returns a list. That guarantee is its whole point.
- A single number: the mean of all the sales at once ::no `mean` is run *per element*, not once over everything, so you get three means, not one. Running a function on each piece is the entire idea here.

=== step === concept
::eyebrow The convenient one
## sapply(): simplify when possible

Reading a list back every time is tedious when each answer is just one number. `sapply()` (*simplify-apply*) runs the same job as `lapply`, then tries to **simplify** the result to the simplest shape that fits.

When every call returns a single number, you get a tidy named vector:

```r
sapply(sales, mean)     # one number each, so it folds down to a vector
#> croissant    muffin     bagel 
#>        50        30        40
```

When every call returns the same count of values, you get a matrix, one column per item:

```r
sapply(sales, range)    # range() gives 2 numbers each, so a 2-row matrix
#>      croissant muffin bagel
#> [1,]        40     20    35
#> [2,]        60     40    45
```

Convenient. But notice the catch hiding in the word *tries*: the shape you get depends on what the function returns. Ask "which days sold more than 40?" and the items have different counts of such days (muffin had none, so its result is the empty `numeric(0)`), so `sapply` cannot line them up and silently falls back to a list:

```r
sapply(sales, function(x) x[x > 40])
#> $croissant
#> [1] 45 50 50 55 60
#> 
#> $muffin
#> numeric(0)
#> 
#> $bagel
#> [1] 42 45
```

[WARNING]
`sapply` can return a vector, a matrix, *or* a list from the same line of code, depending on the data it happens to see that day. Great at the console; risky inside a script, where the next line assumes a fixed shape and breaks when the data shifts.

=== step === concept
::eyebrow The safe one
## vapply(): state the shape up front

`vapply()` (*verify-apply*) closes that trap. It works like `sapply`, but you add one argument that **declares the shape every call must return**. R checks each result against your template and refuses to continue if any result does not match.

The template `numeric(1)` means "each call returns exactly one number":

```r
vapply(sales, mean, numeric(1))   # promise: one number per item
#> croissant    muffin     bagel 
#>        50        30        40
```

Same clean vector as `sapply` gave here, but now it is *guaranteed*, not hoped for. And if a result ever breaks the promise, you get a loud, immediate error instead of a silently wrong object. Ask `range` (which returns two numbers) for a one-number template and R stops you cold:

```r-static
vapply(sales, range, numeric(1))
#> Error in vapply(sales, range, numeric(1)) : 
#>   values must be length 1, but FUN(X[[1]]) result is length 2
```

[KEY INSIGHT]
At the console, `sapply` is fine. In a script or a package, prefer `vapply`: the extra template turns a shape mismatch from a silent bug into an error on the very line that caused it.

=== step === tryit
::eyebrow Your turn
## Get the peak day, safely

Rosewood wants the single best day's units for **each** item, returned as a named numeric vector, and it should error loudly if any item ever returns more than one value. Reach for the type-safe member of the family and fill in the function. (`max` returns the largest value of a vector.)

```r
# sales is already built above
peak <- vapply(sales, ____, numeric(1))
peak
```
::check {"regex":"vapply\\s*\\(\\s*sales\\s*,\\s*max\\s*,\\s*numeric\\s*\\(\\s*1\\s*\\)","gate":true,"difficulty":"beginner","ok":"Exactly. vapply runs max on each item and the numeric(1) template guarantees one number back per item, erroring at once if not.","no":"Use max as the function and keep the numeric(1) template: vapply(sales, max, numeric(1))."}
::solution
```r
peak <- vapply(sales, max, numeric(1))
peak
#> croissant    muffin     bagel 
#>        60        40        45
```

=== step === concept
::eyebrow Over a grid
## apply(): summarise a matrix by row or column

The first three work on lists. `apply()` is for a **matrix**: a rectangular grid of numbers, all the same type, with rows and columns. Stack the per-item vectors into one grid: `rbind` binds vectors together as rows, and `do.call` hands all three to it at once (items become rows, days become columns):

```r
# items in rows, days in columns
weekly <- do.call(rbind, sales)
colnames(weekly) <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
weekly
#>           Mon Tue Wed Thu Fri Sat
#> croissant  40  45  50  50  55  60
#> muffin     20  25  30  30  35  40
#> bagel      35  38  40  40  42  45
```

`apply()` takes a second argument, `MARGIN`, that says which way to slice: `1` runs your function on each **row**, `2` on each **column**. (Same order as `nrow` then `ncol`, and the same order you index with `weekly[row, column]`.)

```r
apply(weekly, 1, sum)   # MARGIN = 1: total per item (one per row)
#> croissant    muffin     bagel 
#>       300       180       240 

apply(weekly, 2, sum)   # MARGIN = 2: total per day (one per column)
#> Mon Tue Wed Thu Fri Sat 
#>  95 108 120 120 132 145
```

::widget process-flow {"steps":[{"title":"Pick a margin","sub":"rows is MARGIN 1, columns is MARGIN 2"},{"title":"Run your function","sub":"apply runs it on each row, or each column"},{"title":"Collect","sub":"one result per slice, returned as a vector"}]}

=== step === quiz
::eyebrow Check yourself
## Which way does it slice?

`weekly` has items as its rows and days as its columns. You run `apply(weekly, 2, sum)`. What do you get back?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- One total per day: the sum down each column ::ok Right. `MARGIN = 2` means columns, so `sum` runs on each column and you get one total per day.
- One total per item: the sum across each row ::no That is `MARGIN = 1` (rows). With `2` you slice the other way, giving one result per column.
- A single grand total of every number in the matrix ::no That is just `sum(weekly)`. `apply` with a `MARGIN` always gives one result *per slice*, never one overall.

=== step === concept
::eyebrow Choosing well
## Which one should you reach for?

They all share the pattern; they differ in what they return and how safe they are.

| Function | Works on | Returns | Reach for it when |
|---|---|---|---|
| `lapply` | list / vector | always a list | you want a predictable shape to pass onward |
| `sapply` | list / vector | vector, matrix, or list | a quick answer at the console |
| `vapply` | list / vector | the shape you declare | scripts and packages, where safety matters |
| `apply` | matrix / array | a vector or matrix | summarising rows or columns of a grid |

Two honest limits. First, `apply` is *not* the C-level vectorization from Lesson 1; it runs an R-level loop over the slices, so for plain numeric totals the purpose-built `rowSums()`, `colSums()`, `rowMeans()` and `colMeans()` are both clearer and faster. Second, the family's quirks (especially `sapply`'s shifting return type) are exactly what the **purrr** package was built to fix, with a consistent, type-stable set of `map` functions. That is Lesson 3.

[NOTE]
Rule of thumb: at the console, `sapply` for speed of typing; in code you will keep, `lapply` or `vapply` for a shape you can rely on; for a matrix, `apply` (or the faster `rowSums`/`colSums` when you just need totals).

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Advanced R (2e): Functionals](https://adv-r.hadley.nz/functionals.html) - Hadley Wickham on apply and map as functionals, why they beat loops, and how the base and purrr families relate.
- [R Programming for Data Science: Loop Functions](https://bookdown.org/rdpeng/rprogdatascience/loop-functions.html) - Roger Peng's clear walkthrough of lapply, sapply, vapply, apply and mapply with worked examples.
- [base R help: lapply, sapply and vapply](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html) - the official documentation for the exact arguments, including vapply's FUN.VALUE template.
- [An Introduction to R: vectorized operations and applying functions](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the official manual's treatment of working over vectors and arrays.

=== step === complete
## Lesson 2 complete

You can now push your own function over a whole collection without writing the loop yourself: `lapply` for a guaranteed list, `sapply` for a quick simplified answer (mindful that its shape can shift), `vapply` when you want that shape locked down and checked, and `apply` with `MARGIN` to total or summarise the rows or columns of a matrix. You also know the honest limits: `apply` is a loop in disguise, and `sapply`'s convenience can bite in a script.

Next, Lesson 3: The purrr map Family. You will meet `map` and its type-stable cousins (`map_dbl`, `map_chr` and friends), `map2` and `pmap` for walking several inputs in step, and `walk` for side effects, the modern, consistent toolkit that smooths over exactly the rough edges you just saw.
