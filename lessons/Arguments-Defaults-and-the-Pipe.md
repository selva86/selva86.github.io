---
title: "R Foundations Lesson 4: Arguments, Defaults and the Pipe"
catalog_blurb: "Make functions flexible to call, and chain steps into readable code."
description: "Give R function arguments default values, pass them by name, forward extras through the dots, and chain calls left to right with the native pipe operator."
keywords: "R default arguments, named arguments R, R dots argument, three dots R, R pipe operator, native pipe R, function arguments R, R for beginners, chaining functions R"
post_type: "LESSON"
curriculum_id: "1.3.4"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-programming"
course_title: "R Foundations: Programming"
course_lesson: "4"
course_total: "5"
course_landing: "R-Foundations-Programming-Course.html"
course_next: "Environments-and-Scope.html"
course_prev: "Writing-Functions-in-R.html"
---

=== step === cover
::eyebrow Lesson 4 of 5
## Arguments, Defaults and the Pipe

Back to the weekend R study group: the same five friends, Mara, Dev, Ada, Theo and Iris, with their quiz scores 58, 91, 73, 49 and 84 out of 100. In Lesson 3 you wrapped the grading rule into a function, `grade()`, and learned that everything a function needs should be passed in as an argument.

That was the strict version. This lesson makes your functions pleasant to actually call. You will give an argument a **default** so callers can leave it out, pass arguments **by name** so the order stops mattering, collect any extra arguments with the **dots** (`...`), and finally chain several steps together with the `|>` **pipe** so a calculation reads like a sentence instead of a riddle.

By the end of this lesson you will be able to:

- Give a function argument a **default value** so a caller can omit it
- Pass arguments **by name** to reorder them and skip past a defaulted one
- Use **`...`** to let a function accept extra arguments and forward them on
- Chain several function calls with the **`|>` pipe** and read them left to right

**Prerequisites:** you can [run R and assign with `<-`](R-Syntax-and-First-Objects.html), [build and name a vector](Atomic-Vectors-and-Data-Types.html), use [`if` / `else`](Control-Flow-in-R.html) with comparisons like `>=`, and [define a function](Writing-Functions-in-R.html) with a name, arguments and a body.

::widget process-flow {"steps":[{"title":"Defaults","sub":"give an argument a fallback so the caller can leave it out"},{"title":"Named arguments","sub":"pass values by name, in any order you like"},{"title":"The pipe","sub":"chain steps left to right so the code reads like a sentence"}]}

=== step === concept
::eyebrow Tool 1: defaults
## A default lets the caller leave it out

In Lesson 3, the safe version of the pass/fail rule took the cut-off as an argument, so you had to spell it out on **every** call. But the pass mark is almost always 60. Forcing the caller to type `60` each time is busywork. A **default value** fixes that: write `cutoff = 60` in the argument list, and that becomes the value R uses **whenever the caller does not supply one**.

```r
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)

grade <- function(score, cutoff = 60) {
  if (score >= cutoff) "pass" else "needs help"
}

grade(58)               # no cutoff given, so R uses the default of 60
#> [1] "needs help"
grade(58, cutoff = 50)  # tough quiz this week: lower the pass mark to 50
#> [1] "pass"
```

The argument `cutoff` now has two faces. Leave it out and you get the sensible default (60). Supply it and your value wins. The default makes the common call short, `grade(58)`, without taking the flexibility away.

[KEY INSIGHT]
A default is a fallback, not a lock. `cutoff = 60` means "use 60 **unless** the caller passes something else." The default is only ever evaluated when the argument is missing from the call.

One honest caveat: give defaults only to arguments that genuinely have a sensible fallback. `score` has none, every caller must provide a score, so it stays a plain argument with no default.

=== step === tryit
::eyebrow Your turn
## Add a default

Write `is_pass` so it takes a `score` and a `cutoff` that **defaults to 60**, and returns `TRUE` when the score reaches the cut-off. Fill in the default, then check. After this, `is_pass(73)` should give `TRUE` without your passing a cut-off at all.

```r
is_pass <- function(score, cutoff = ____) {
  score >= cutoff
}
is_pass(73)
```
::check {"regex":"cutoff\\s*=\\s*60","gate":true,"difficulty":"beginner","ok":"Exactly. With cutoff = 60 as the default, is_pass(73) compares 73 >= 60 and returns TRUE, no second argument needed.","no":"Give cutoff the fallback value in the argument list: cutoff = 60."}
::solution
```r
is_pass <- function(score, cutoff = 60) {
  score >= cutoff
}
is_pass(73)
#> [1] TRUE
```

=== step === concept
::eyebrow Tool 2: named arguments
## Name an argument and the order stops mattering

When you write `grade(49, 80)`, how does R know that `49` is the score and `80` is the cut-off? By **position**: the first value you pass fills the first argument in the definition (`score`), the second value fills the second (`cutoff`). That is fine for one or two arguments, but it makes you remember the exact order.

Naming frees you from that. Write `name = value` and R binds by the **name** instead, so you can list the arguments in any order you like:

```r
grade(49, 80)                  # positional: 49 -> score, 80 -> cutoff
#> [1] "needs help"
grade(score = 49, cutoff = 80) # named: spelled out, same result
#> [1] "needs help"
grade(cutoff = 80, score = 49) # reversed order, still the same result
#> [1] "needs help"
```

Naming earns its keep most when a function has several arguments and you want to **skip** one that has a default. Here `report` takes a `score`, a `cutoff` (default 60) and a `label` (default `"student"`). Name the `label` and you can jump straight to it, leaving `cutoff` on its default:

```r
report <- function(score, cutoff = 60, label = "student") {
  paste0(label, ": ", if (score >= cutoff) "pass" else "needs help")
}

report(91, label = "Dev")   # skip cutoff (keep its default 60), set only label
#> [1] "Dev: pass"
```

Under the hood R matches arguments in a fixed order: first every argument you gave by exact name, then a unique partial name, and only then the leftovers by position. The flow below is that order.

::widget process-flow {"steps":[{"title":"By exact name","sub":"first R binds every argument you wrote as name = value"},{"title":"By partial name","sub":"then a unique prefix such as lab = ..., allowed but fragile"},{"title":"By position","sub":"whatever is left fills the remaining slots in order"}]}

[WARNING]
That middle step is a trap. R accepts a unique prefix, so `report(91, lab = "Dev")` works **today**, but add another argument starting with "lab" later and the call silently breaks. Spell argument names out in full.

=== step === quiz
::eyebrow Check yourself
## Where does the value land?

Using `report <- function(score, cutoff = 60, label = "student")` from the last step, a learner calls `report(73, "Ada")` hoping to label the row "Ada". Because `"Ada"` is **not** named, which argument does it fill?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `cutoff`, by position: it is the second value and `cutoff` is the second argument, so `label` keeps its default "student" ::ok Right. With no name, R matches by position, so "Ada" lands in cutoff (the second slot), not label. To label the row, name it: report(73, label = "Ada").
- `label`, because "Ada" is obviously a name and R is smart enough to see that ::no R does not guess by content. An unnamed value is matched by position, and the second position is cutoff, so "Ada" goes there and label stays "student".
- Neither: the call errors immediately because "Ada" is text, not a number ::no R does not type-check arguments at call time. "Ada" silently binds to cutoff and the function runs, which is exactly why the result is wrong rather than a clean error.

=== step === concept
::eyebrow Tool 3: the dots
## `...` collects and forwards extra arguments

This week Ada was away, so her score is missing. In R a missing value is written `NA`. Now suppose you write a small helper to average the class. The moment one score is `NA`, plain `mean()` returns `NA`, because the average of "something unknown" is itself unknown:

```r
scores <- c(Mara = 58, Dev = 91, Ada = NA, Theo = 49, Iris = 84)

class_mean <- function(s, ...) {
  mean(s, ...)          # ... hands anything extra straight through to mean()
}

class_mean(scores)               # one score is NA, so the average is unknown
#> [1] NA
class_mean(scores, na.rm = TRUE) # ... carried na.rm = TRUE through to mean()
#> [1] 70.5
```

The three dots, `...`, are a catch-all argument. They collect **any** extra arguments the caller passes and let you forward them, untouched, to another function inside the body. Here you never mentioned `na.rm` when defining `class_mean`, yet the caller could still pass it, because `...` scooped it up and `mean(s, ...)` passed it on. That is how thin wrapper functions stay flexible: they accept the inner function's options without having to list every one.

[KEY INSIGHT]
`...` means "and anything else." Whatever extra arguments arrive get gathered up, and forwarding them with `mean(s, ...)` (or `sort(s, ...)`, etc.) hands them to the function you wrap.

[WARNING]
Flexibility has a cost: `...` swallows typos in silence. Misspell `na.rm` as `na.mr` and it is simply collected and ignored, no error, and you are back to an `NA` you did not expect. When a result looks wrong, check the spelling of the arguments you passed through `...`.

=== step === tryit
::eyebrow Your turn
## Forward the dots

Complete `top_scores` so it sorts the scores and forwards any extra arguments to `sort()` through the dots. Fill in the blank so that `top_scores(scores, decreasing = TRUE)` sorts from highest to lowest (`sort()` drops the `NA` on its own).

```r
top_scores <- function(s, ...) {
  sort(s, ____)        # forward the extra arguments (like decreasing = TRUE) to sort()
}
top_scores(scores, decreasing = TRUE)
```
::check {"regex":"\\.\\.\\.","gate":true,"difficulty":"intermediate","ok":"That is it. sort(s, ...) forwards decreasing = TRUE straight into sort(), so the scores come back highest first.","no":"Forward the catch-all argument itself: write the three dots, sort(s, ...)."}
::solution
```r
top_scores <- function(s, ...) {
  sort(s, ...)
}
top_scores(scores, decreasing = TRUE)
#>  Dev Iris Mara Theo
#>   91   84   58   49
```

=== step === concept
::eyebrow Tool 4: the pipe
## `|>` chains steps into a sentence

Real work strings several functions together. Say you want the class average rounded to one decimal place: two steps, average then round. Written as ordinary nested calls, you have to read them **inside out**, starting in the middle and working outward:

```r
round(mean(scores, na.rm = TRUE), 1)
#> [1] 70.5
```

Your eye has to find `mean(...)` buried inside `round(...)` first. With two steps it is bearable; with four it is a puzzle. The pipe operator `|>` rewrites the same calculation in reading order. It takes the value on its **left** and drops it into the **first argument** of the call on its **right**:

```r
scores |> mean(na.rm = TRUE) |> round(1)
#> [1] 70.5
```

Now read it straight across, like a recipe: take `scores`, average them (ignoring the `NA`), then round the result to one decimal. Same answer, far clearer.

Recall from Lesson 3 that a function is a rule \(f\) that turns an input \(x\) into an output \(f(x)\). The pipe is just that application written left-first: `x |> f()` runs exactly \(f(x)\), and `x |> f(y)` runs \(f(x, y)\), with the piped value filling the first slot and `y` the rest.

[KEY INSIGHT]
`x |> f()` is exactly `f(x)`. The value on the left becomes the **first** argument of the call on the right, which is why each step reads as "...then do this next."

[WARNING]
The pipe always feeds the **first** argument. When the value needs to go somewhere else, name the other arguments around it or use the placeholder `_` (R 4.2 and later): `"Dev" |> report(91, label = _)` runs `report(91, label = "Dev")`, dropping the piped value into the `label` slot instead of the first. Also note the native `|>` pipe needs R 4.1 or newer.

::widget process-flow {"steps":[{"title":"scores","sub":"start with the five quiz scores"},{"title":"mean(na.rm = TRUE)","sub":"the scores arrive as the first argument and get averaged"},{"title":"round(1)","sub":"that one average arrives next and is rounded to a decimal"}]}

=== step === quiz
::eyebrow Check yourself
## Reading a pipe

The pipe feeds the left-hand value into the **first** argument on the right. Which plain, un-piped call is exactly the same as `scores |> round(1)`?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `round(scores, 1)` ::ok Right. The value on the left of the pipe becomes the first argument on the right, so `scores |> round(1)` is just `round(scores, 1)`.
- `round(1, scores)` ::no The piped value goes into the FIRST slot, not the last. This swaps them and would try to round the number 1 to "scores" decimal places.
- `scores(round, 1)` ::no The pipe does not call `scores`; `scores` is data, not a function. It passes `scores` into `round` as the first argument: `round(scores, 1)`.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [R for Data Science (2e), Functions](https://r4ds.hadley.nz/functions.html) - a hands-on chapter on defaults and on passing the dots through to another function.
- [An Introduction to R: Named arguments and defaults](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Named-arguments-and-defaults) - the official manual's section on exactly this, named matching and default values.
- [Advanced R (2e), Function arguments](https://adv-r.hadley.nz/functions.html) - the rigorous treatment: how argument matching really works, lazy default evaluation, and `...`.
- [The base R and magrittr pipes](https://www.tidyverse.org/blog/2023/04/base-vs-magrittr-pipe/) - a clear explainer of the native `|>` pipe, the placeholder, and how it differs from the older `%>%`.

=== step === complete
## Lesson 4 complete

Your functions are now comfortable to call. You gave an argument a **default** (`cutoff = 60`) so callers can leave it out; you passed arguments **by name** to reorder them and skip past a defaulted one; you used the **dots** (`...`) to collect extra arguments and forward them straight into `mean()` and `sort()`; and you chained steps with the **`|>` pipe**, turning a read-it-inside-out nest into a left-to-right sentence.

Next, Lesson 5: Environments and Scope. You have leaned on the idea that a function "finds" names like `cutoff`, but where exactly does R look, and in what order? You will see how R resolves a name, starting inside the function and working outward to the global workspace, and why that lookup rule is the last piece of how functions really work.
