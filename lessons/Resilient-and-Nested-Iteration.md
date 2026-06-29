---
title: "R Foundations Lesson 4: Resilient and Nested Iteration"
catalog_blurb: "Keep going when some items fail, and work group by group."
description: "Make iteration in R resilient: use safely and possibly so one failing element never stops a map, then run code group by group with list-columns, nest and unnest."
keywords: "safely in R, possibly purrr, nest and unnest, list-columns R, resilient iteration, error handling map, tidyr nest, purrr adverbs, functional programming R, map errors"
post_type: "LESSON"
curriculum_id: "1.6.4"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-iteration"
course_title: "R Foundations: Iteration"
course_lesson: "4"
course_total: "4"
course_landing: "R-Foundations-Iteration-Course.html"
course_next: ""
course_prev: "The-purrr-map-Family.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## Resilient and Nested Iteration

In Lesson 3 you ran a function across each item with `map` and got back a tidy, predictable result every time. That works beautifully when the data is clean and every piece is a single value.

Real data is rarely that polite. Picture six new Rosewood Bakery branches texting in their daily takings as hand-typed strings: a couple are mistyped, your parser chokes on them, and that one failure mid-`map` throws away every good result it computed before. Other times the natural unit is not a single value at all but a whole group, a table you want to run code on, group by group. This lesson gives you the two tools that handle exactly those cases: **resilient** iteration that survives failures (`safely`, `possibly`), and **nested** iteration over whole tables tucked inside a column (`nest`, `unnest`).

By the end of this lesson you will be able to:

- Explain why one broken element aborts an entire `map`, and what that costs you
- Run a function over every element and capture each result-or-error with `safely`, never stopping
- Reach for `possibly` when you just want a sensible fallback value on failure
- Read a list-column (a column whose cells are whole tables) and move between flat and nested with `nest` and `unnest`
- Run a real calculation on each group by mapping over a list-column, then tidy the result back

**Prerequisites:** Lesson 3 ([the purrr map family](The-purrr-map-Family.html)), how to [write a function](Writing-Functions-in-R.html) and pass a `\(x) ...` lambda, and that a column of a [data frame or tibble](Data-Frames-and-Tibbles.html) holds equal-length values.

::widget process-flow {"steps":[{"title":"Run over messy data","sub":"some pieces will fail, and one failure must not stop the rest"},{"title":"Stay resilient","sub":"safely and possibly let the map finish and mark the failures"},{"title":"Group into list-columns","sub":"nest folds each group into a single cell as a whole table"},{"title":"One result per group","sub":"map a calculation over each table, then unnest back to tidy rows"}]}

=== step === concept
::eyebrow The problem
## One broken element stops the whole run

Rosewood Bakery is opening six new branches, and head office texts in each branch's recent daily takings as a hand-typed string like `"120,135,150"`. You want each branch's **mean daily takings**. So you write a small parser, then `map` it over the branches. Build this week's batch once (run it), and notice that two branches were typed badly:

```r
library(purrr)

# Daily takings ($) texted in from six new Rosewood branches.
# Typed by hand, so a couple are malformed.
takings <- list(
  downtown   = "120,135,150",
  harbour    = "98,110,121",
  airport    = "two hundred",     # someone wrote words
  university = "75,eighty,80",     # a word slipped into the middle
  suburb     = "60,64,70",
  market     = "88,92,99"
)

# Parse ONE branch's text into its mean daily takings.
mean_takings <- function(txt) {
  nums <- as.numeric(strsplit(txt, ",")[[1]])   # "120,135" -> c(120, 135)
  if (anyNA(nums)) stop("non-numeric takings: ", txt)
  mean(nums)
}

mean_takings(takings$downtown)   # a good branch parses fine
#> [1] 135
```

One branch at a time is fine. But the moment you `map` over all six, the run hits `airport` (the third element), `mean_takings` calls `stop(...)`, and that error does not just skip that branch, it **aborts the entire call**. You get nothing back, not even the three good branches that came before it:

```r-static
map_dbl(takings, mean_takings)
#> Error in mean_takings(txt): non-numeric takings: two hundred
```

[WARNING]
This is the default in R: an error inside `map` (or any loop) propagates straight up and ends everything. Across six branches it is annoying; across six thousand files, an overnight job that dies on row 4,000 and discards the 3,999 results it already computed is a genuinely expensive failure.

=== step === concept
::eyebrow The fix
## safely(): catch every failure, keep going

`safely()` is an **adverb**: hand it a function and it returns a *new* function that does the same job but can never throw. Instead of returning a bare value (or crashing), the wrapped function always returns a small two-slot list: `result` and `error`. Exactly one slot is filled.

| For an element that... | `result` slot | `error` slot |
|---|---|---|
| works | the value your function returned | `NULL` |
| fails | `NULL` | the captured error |

Because the wrapped function never throws, `map` runs to the very end no matter how many elements break. Here is the precise idea. `safely` turns a function \(f\) into a new function \(f^{\star}\). For any input \(x\), \(f^{\star}(x)\) is the pair

\[ f^{\star}(x) = \begin{cases} (\,\text{result}=f(x),\ \text{error}=\texttt{NULL}\,) & \text{if } f(x) \text{ succeeds} \\ (\,\text{result}=\texttt{NULL},\ \text{error}=e\,) & \text{if } f(x) \text{ raises error } e \end{cases} \]

and crucially \(f^{\star}\) itself never raises. Wrap `mean_takings` and map the wrapped version over all six branches:

```r
safe_mean <- safely(mean_takings)        # same job, but returns result + error

results <- map(takings, safe_mean)       # ALWAYS finishes - no element can abort it

results$airport      # a branch that FAILED: result is NULL, error is filled
#> $result
#> NULL
#>
#> $error
#> <simpleError in mean_takings(txt): non-numeric takings: two hundred>

results$downtown     # a branch that WORKED: result is filled, error is NULL
#> $result
#> [1] 135
#>
#> $error
#> NULL
```

Now nothing is lost. Every branch is accounted for, and you can pull out just the numbers you wanted, using `NA` for the ones that broke:

```r
# pluck the "result" slot from each branch; missing ones become NA
map_dbl(results, "result", .default = NA)
#>   downtown    harbour    airport university     suburb     market
#>   135.0000   109.6667         NA         NA    64.6667    93.0000
```

[KEY INSIGHT]
`safely` trades a crash for a value you can inspect. The map always completes, and the failures are sitting right there in the `error` slots, ready to be reported or retried, instead of having taken down the whole job.

=== step === quiz
::eyebrow Check yourself
## What does safely hand back?

You wrap a parsing function with `safely()` and `map` it over 100 files, 3 of which are corrupt. What do you get back?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- An error, because the 3 corrupt files still make the run fail ::no That is the behavior `safely` removes. The wrapped function captures each error instead of throwing, so the `map` runs to completion.
- A list of 100 elements; each is a `result`/`error` pair, and the 3 corrupt files have `result = NULL` with their error captured ::ok Exactly. `safely` returns one two-slot list per element. The 97 good files carry their value in `result`; the 3 bad ones carry `NULL` in `result` and the captured error in `error`. Nothing is lost.
- A list of only the 97 files that worked ::no `safely` does not drop the failures, it captures them. You get all 100 elements; the failed ones have a `NULL` result and a filled `error`, which is what lets you find and report them.

=== step === concept
::eyebrow The lighter tool
## possibly(): just give me a fallback

The `result`/`error` pairs are perfect when you want to inspect *why* things failed. Often you do not care: you just want a plain answer per element, with a sensible stand-in where it broke. That is `possibly()`. You give it your function and an `otherwise` value to return on any failure, and it hands back the value directly, no wrapper to unpack.

```r
# possibly: on failure, return the fallback instead of the result/error pair
maybe_mean <- possibly(mean_takings, otherwise = NA_real_)

map_dbl(takings, maybe_mean)     # a clean numeric vector; failures are NA
#>   downtown    harbour    airport university     suburb     market
#>   135.0000   109.6667         NA         NA    64.6667    93.0000
```

Same answer as the `safely` version above, but in one step and ready for arithmetic. The rule of thumb:

- Want to **diagnose** failures (log them, retry them)? Use `safely` and read the `error` slots.
- Want a **clean result** with a fallback and do not care about the error detail? Use `possibly(otherwise = ...)`.

[NOTE]
There is a third adverb, `quietly()`, for the other kind of noise: it captures a function's printed output, **messages** and **warnings** (rather than errors) alongside its result, so a chatty function does not flood your console. Same idea, different thing caught.

=== step === tryit
::eyebrow Your turn
## Make it resilient, your way

Head office wants each branch's **highest** single day's takings as a plain numeric vector, with `NA` where a branch was typed badly, ready to drop into a report. You already have `takings` and this strict parser:

```r
max_takings <- function(txt) {
  nums <- as.numeric(strsplit(txt, ",")[[1]])
  if (anyNA(nums)) stop("non-numeric takings: ", txt)
  max(nums)
}
```

You want a clean numeric vector with a fallback, not a list of result/error pairs to unpack. Wrap `max_takings` with the right adverb so failures become `NA`, then map it. Fill in the blank.

```r
safe_max <- ____
map_dbl(takings, safe_max)
```
::check {"regex":"possibly\\s*\\(\\s*max_takings\\s*,\\s*otherwise\\s*=","gate":true,"difficulty":"intermediate","ok":"Exactly. possibly(max_takings, otherwise = NA_real_) returns the value directly with NA on failure, so map_dbl gives a clean numeric vector. safely would have forced you to unpack result/error pairs.","no":"You want a clean value with a fallback, not result/error pairs: possibly(max_takings, otherwise = NA_real_)."}
::solution
```r
safe_max <- possibly(max_takings, otherwise = NA_real_)
map_dbl(takings, safe_max)
#>   downtown    harbour    airport university     suburb     market
#>        150        121         NA         NA         70         99
```

=== step === concept
::eyebrow A column of tables
## List-columns: a whole table inside one cell

Now the second half. So far each element you iterated over was a single value or a string. But the natural unit is often a **group**: all of croissant's daily sales, all of muffin's, all of bagel's. R lets a single column hold a whole tibble in each cell, one per group. That is a **list-column**, and `nest()` builds it.

Take Rosewood's six-day sales in long form (one row per item per day). `nest()` collapses it to **one row per item**, packing each item's days-and-units into its own mini-tibble in a list-column. `unnest()` reverses it, spreading the tables back out into ordinary rows. Toggle between the two views below, then press Run to do it for real:

::widget nest-unnest {"cols":["item","day","units"],"rows":[["croissant","Mon",40],["croissant","Tue",45],["croissant","Wed",50],["muffin","Mon",20],["muffin","Tue",25],["muffin","Wed",30],["bagel","Mon",35],["bagel","Tue",38],["bagel","Wed",40]],"nestBy":"item","listCol":"sales"}

The nested cell does not say `40, 45, 50`; it says `tibble [3 x 2]`, a promise that a whole 3-row, 2-column table is folded up in there. The flat frame and the nested frame hold the *same data*, shaped for two different jobs: flat for filtering and joining, nested for "do something to each group as a unit".

=== step === concept
::eyebrow The payoff
## Map a calculation over each group

Here is why list-columns matter for iteration. Once each group is a single cell, you can `map` a function over that list-column and get **one result per group**, no loop, no copy-paste, no splitting the data into pieces by hand. The pattern is always the same three beats:

::widget process-flow {"steps":[{"title":"nest","sub":"one row per group, each carrying its own mini-table in a list-column"},{"title":"map over the list-column","sub":"run any calculation on the table for each group; the answer becomes a new column"},{"title":"unnest","sub":"spread the tidy results back into ordinary rows when you need them flat"}]}

Build the full six-day sales inline, nest by item, then map a few summaries over each item's table:

```r
library(dplyr)
library(tidyr)
library(tibble)
library(purrr)

# Rosewood's six-day sales, long form: one row per item per day
sales_long <- tibble(
  item  = rep(c("croissant", "muffin", "bagel"), each = 6),
  day   = rep(1:6, times = 3),
  units = c(40, 45, 50, 50, 55, 60,
            20, 25, 30, 30, 35, 40,
            35, 38, 40, 40, 42, 45)
)

# nest packs each item's six rows into its own mini-table (the list-column "sales"),
# then map runs a real calculation on each of those tables.
by_item <- sales_long |>
  nest(sales = c(day, units)) |>
  mutate(
    days  = map_int(sales, nrow),                # rows in each mini-table
    total = map_dbl(sales, \(d) sum(d$units)),   # units sold across the week
    peak  = map_dbl(sales, \(d) max(d$units))    # best single day
  )

by_item |> select(item, days, total, peak)
#> # A tibble: 3 x 4
#>   item       days total  peak
#>   <chr>     <int> <dbl> <dbl>
#> 1 croissant     6   300    60
#> 2 muffin        6   180    40
#> 3 bagel         6   240    45
```

Each `map` call walked the three mini-tables and returned one number per group, lined up beside its item. When you want the per-row detail back, `unnest()` the list-column and the new summary columns ride along, repeated down each group's rows:

```r
by_item |> unnest(sales)
#> # A tibble: 18 x 6
#>   item        day units  days total  peak
#>   <chr>     <int> <dbl> <int> <dbl> <dbl>
#> 1 croissant     1    40     6   300    60
#> 2 croissant     2    45     6   300    60
#> # i 16 more rows
```

[NOTE]
The calculation can be anything that takes a table, including a model. Swap `sum(d$units)` for `lm(units ~ day, d)` and you get a separate fitted model per item, the classic "many models" use of list-columns. Wrap that map in `possibly()` and a group with too little data to fit just yields a fallback instead of sinking the whole pipeline, both halves of this lesson working together.

=== step === quiz
::eyebrow Check yourself
## What did nest produce?

You start with a 200-row sales table covering 8 products and run `nest(sales = c(day, units))` grouped by `product`. What does the result look like?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Still 200 rows; `nest` only reorders them ::no `nest` changes the shape, it does not just reorder. It collapses each group's rows into a single packed cell.
- 200 rows, with a new column holding the numbers `day` and `units` ::no The new column does not hold loose numbers; it holds a whole tibble per group, and the row count drops to one per group.
- 8 rows (one per product), with a list-column whose each cell is that product's own tibble ::ok Right. `nest` gives one row per group (8 products -> 8 rows) and a list-column where each cell is a whole tibble of that product's days and units, ready to map a calculation over.

=== step === tryit
::eyebrow Capstone
## One summary per group, the tidy way

Put it together. Using `sales_long` from above, nest each item's rows into a `sales` list-column, then add a column `avg` holding each item's **mean daily units** by mapping over that list-column. The result should have one row per item. Fill in the blank with the calculation that runs on each group's mini-table `d`.

```r
avg_by_item <- sales_long |>
  nest(sales = c(day, units)) |>
  mutate(avg = map_dbl(sales, \(d) ____ ))

avg_by_item |> select(item, avg)
```
::check {"regex":"mean\\s*\\(\\s*d\\$units\\s*\\)","gate":true,"difficulty":"intermediate","ok":"Exactly. map_dbl walks each item's mini-table d and mean(d$units) returns one number per group, guaranteed numeric by the _dbl suffix and lined up beside its item.","no":"Each d is one item's table; you want the mean of its units column: mean(d$units)."}
::solution
```r
avg_by_item <- sales_long |>
  nest(sales = c(day, units)) |>
  mutate(avg = map_dbl(sales, \(d) mean(d$units)))

avg_by_item |> select(item, avg)
#> # A tibble: 3 x 2
#>   item        avg
#>   <chr>     <dbl>
#> 1 croissant    50
#> 2 muffin       30
#> 3 bagel        40
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [purrr: safely(), possibly(), quietly()](https://purrr.tidyverse.org/reference/safely.html) - the official reference for the three adverbs and exactly what each one captures.
- [tidyr: nest() and unnest()](https://tidyr.tidyverse.org/reference/nest.html) - how list-columns are built and spread back, with the current argument syntax.
- [R for Data Science (1e): Many models](https://r4ds.had.co.nz/many-models.html) - the canonical worked example of nest plus map plus list-columns, fitting one model per group.
- [R for Data Science (2e): Iteration](https://r4ds.hadley.nz/iteration.html) - the map family in context, the foundation everything here builds on.

=== step === complete
## Lesson 4 complete

You can now make iteration survive the real world. `safely` runs your function over every element and hands back a `result`/`error` pair so a single failure can never abort the run; `possibly` does the lighter job of returning a clean value with a fallback. And with `nest` you fold each group into a list-column of whole tables, `map` a calculation, even a model, over them, and `unnest` to tidy the answers back out.

That is the end of **R Foundations: Iteration**. You started by replacing loops with vectorization, moved to the apply family and then purrr's typed `map`, and you finish able to iterate over messy, grouped, real data without it falling over. Next up, the Debugging course: when a function does misbehave, how to find out exactly why.
