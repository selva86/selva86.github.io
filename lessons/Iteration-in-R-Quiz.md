---
title: "Iteration with apply and purrr: Quiz"
description: "A short, graded check on iteration in R: vectorization versus loops, the apply family, the purrr map functions and their typed variants, map2, and safely."
keywords: "R quiz, vectorization, sapply, lapply, vapply, purrr, map, map_dbl, map2, safely, R practice"
post_type: "LESSON"
curriculum_id: "1.6.5"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-iteration"
course_title: "R Foundations: Iteration"
course_lesson: "5"
course_total: "5"
course_landing: "R-Foundations-Iteration-Course.html"
lesson_kind: "quiz"
course_prev: "Resilient-and-Nested-Iteration.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the iteration section: why vectorization beats loops, the apply family, the purrr map functions and their typed variants, iterating over several inputs, and resilient iteration with safely. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## What vectorization means
Why is `prices * 1.1` preferred over a `for` loop that multiplies each price one at a time?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because loops give the wrong answer. ::no A correct loop gives the same answer; the difference is speed and clarity.
- Because the operation applies to the whole vector at once, which is faster and clearer. ::ok Right. Vectorized code pushes the loop into fast internal code and reads as a single intention.
- Because `for` loops do not exist in R. ::no R has `for` loops; vectorization is just usually the better tool.
- Because multiplication only works on vectors. ::no It works on single numbers too; vectorization is about doing it to all of them at once.

=== step === quiz
::eyebrow Question 2 of 8
## lapply versus sapply
What is the difference between `lapply()` and `sapply()`?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `lapply()` always returns a list; `sapply()` tries to simplify the result to a vector or matrix. ::ok Correct. Use `lapply` when you want a list for sure, `sapply` when a tidy vector would be nicer.
- They are identical. ::no They differ in the shape of what they return.
- `sapply()` always returns a list; `lapply()` returns a vector. ::no It is the other way round.
- `lapply()` only works on numbers. ::no It works on any list or vector of any type.

=== step === quiz
::eyebrow Question 3 of 8
## A typed map
You want a numeric vector out of a map, guaranteed, not a list. Which purrr function fits?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `map()`, then hope it is numeric. ::no `map()` always returns a list, so you would still have to simplify it.
- `walk()`. ::no `walk()` is for side effects and returns its input invisibly, not a numeric vector.
- `map_dbl()`, which returns a double vector or errors if a result is not a number. ::ok Right. The typed variants like `map_dbl()` guarantee the output type, which catches surprises early.
- `map2()`. ::no `map2()` is for iterating over two inputs, not for fixing the output type.

=== step === quiz
::eyebrow Question 4 of 8
## Iterating over two inputs
You have a vector of prices and a matching vector of quantities, and you want price times quantity per item. Which tool is built for this?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- `map()`, called twice. ::no A single `map()` walks one input; pairing two needs a two-input map.
- `map2()`, which walks both vectors in step, element by element. ::ok Correct. `map2(prices, qtys, ~ .x * .y)` pairs the first with the first, the second with the second, and so on.
- `sapply()` on the first vector only. ::no That ignores the second vector entirely.
- `sum()`. ::no `sum()` collapses to one number; you want one result per item.

=== step === quiz
::eyebrow Question 5 of 8
## Surviving a bad element
You map a function over a list, and one element makes it error. You want the whole run to finish, capturing the failure instead of stopping. Which helper fits?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Wrap the function in `safely()`, so each call returns a result-or-error pair instead of stopping. ::ok Right. `safely()` turns a risky function into one that always returns, so a single bad element cannot sink the run.
- Use `map_dbl()`, which ignores errors. ::no `map_dbl()` does not ignore errors; it would stop on the bad element.
- Delete the list and start over. ::no That loses your data; `safely()` lets you finish and inspect the failures.
- Nothing can be done; a loop will always stop. ::no `safely()` and `possibly()` are made exactly for this.

=== step === quiz
::eyebrow Question 6 of 8
## When a loop is fine
Which statement is the most honest?
::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Loops are always wrong in R. ::no Loops are a normal, valid tool; they are just often not the clearest one.
- Vectorization is always slower. ::no Vectorization is usually faster, not slower.
- Prefer a vectorized call or a map when one exists, and reach for a loop when the steps genuinely depend on each other. ::ok Right. The goal is clear, correct code; vectorization and maps win most of the time, and loops still have their place.
- `for` loops cannot be used inside functions. ::no They can be used anywhere.

=== step === concept
::eyebrow Run it: the apply family
## sapply in live R
Square each number from 1 to 6, getting a clean vector back. Run it, then change the function to `function(x) x * 10`.

```r
sapply(1:6, function(x) x^2)
```

`sapply()` applies your function to each element and simplifies the results into a single vector, no loop bookkeeping required.

=== step === concept
::eyebrow Run it: a typed map
## map_dbl in live R
Do the same square with purrr, but demand a numeric vector out. Run it, then try `map_chr` and read the error it raises about the wrong type.

```r
library(purrr)

map_dbl(1:6, ~ .x^2)
```

`map_dbl()` returns a double vector and would stop if any result were not a number, which is how the typed variants protect you from silent surprises.

=== step === complete
## Section complete
Strong work. You can say why vectorization beats a loop, tell `lapply` from `sapply`, pick a typed `map_dbl` when you need a vector, reach for `map2` over two inputs, use `safely` to survive a bad element, and judge when a plain loop is still fine. Next section: defensive code and debugging.
