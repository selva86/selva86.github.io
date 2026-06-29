---
title: "R Foundations Lesson 1: Why Vectorization Beats Loops"
catalog_blurb: "Why operating on a whole vector at once beats looping element by element."
description: "Stop looping over elements one at a time. See why a single operation on a whole vector in R is shorter, clearer and far faster, and when a loop still wins."
keywords: "vectorization in R, vectorized operations, R for loop vs vectorized, recycling rule R, why R loops are slow, R performance, base R, ifelse vectorized"
post_type: "LESSON"
curriculum_id: "1.6.1"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-iteration"
course_title: "R Foundations: Iteration"
course_lesson: "1"
course_total: "4"
course_landing: "R-Foundations-Iteration-Course.html"
course_next: "The-apply-Family.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 4
## Why Vectorization Beats Loops

You run Rosewood Bakery. This morning six items sit on the shelf: a croissant at $3.20, a muffin at $2.50, a bagel at $2.00, a scone at $2.80, a donut at $1.90 and a loaf at $4.50. Costs went up, so every price needs to rise 8%.

You already know how to do this with a `for` loop: visit price one, raise it, store it; visit price two, raise it, store it; and so on. The widget below steps a `for` loop one pass at a time, so you can watch what one trip per element really looks like. Step through it and watch it crawl.

This lesson is about a faster, clearer idea: tell R to raise **the whole price list at once**, in a single expression, with no loop and no counter. That move is called *vectorization*, and once you see it you will reach for it constantly.

By the end of this lesson you will be able to:

- Rewrite an element-by-element loop as a single vectorized expression
- Explain *recycling*: how one number, or a matching list of numbers, is applied across a whole vector
- Reach for a vectorized conditional or summary instead of a hand-written loop
- Explain *why* vectorized code runs far faster than the equivalent R loop

**Prerequisites:** you can build and name a [vector](Atomic-Vectors-and-Data-Types.html), you can write a `for` loop and use [`ifelse()`](Control-Flow-in-R.html), and you know R's [comparison operators](Operators-Recycling-and-Coercion.html) like `>=` return TRUE/FALSE.

::widget control-flow {}

=== step === concept
::eyebrow The core idea
## One operation, the whole vector at once

Here are the bakery's six prices. Each lesson runs in a fresh R session, so build them once now (run this):

```r
# Rosewood Bakery: today's six shelf prices, in dollars
prices <- c(croissant = 3.20, muffin = 2.50, bagel = 2.00,
            scone = 2.80, donut = 1.90, loaf = 4.50)
prices
#> croissant    muffin     bagel     scone     donut      loaf
#>      3.20      2.50      2.00      2.80      1.90      4.50
```

To raise every price by 8% the loop way, you create a place to store the answers, then walk the prices one index at a time:

```r
# the loop way: a counter, a place to store results, one element per pass
raised_loop <- numeric(length(prices))          # six empty slots
for (i in seq_along(prices)) {
  raised_loop[i] <- round(prices[i] * 1.08, 2)
}
raised_loop
```

That works, but look at all the machinery: an empty vector, an index `i`, a `seq_along()`, and a manual write into slot `i`. Now the **vectorized** way, the same job in one line:

```r
raised <- round(prices * 1.08, 2)
raised
#> croissant    muffin     bagel     scone     donut      loaf
#>      3.46      2.70      2.16      3.02      2.05      4.86
```

`prices * 1.08` multiplies **every** element at once and hands back a whole new vector, names and all. No counter, no storage to set up, no index to get wrong.

This is what *vectorized* means precisely. If \(x = (x_1, x_2, \dots, x_n)\) is a vector of length \(n\) (here \(n = 6\)), a vectorized function \(f\) applied to \(x\) returns the length-\(n\) vector formed by applying \(f\) to each element:

\[ f(x) = \big(f(x_1),\, f(x_2),\, \dots,\, f(x_n)\big) \]

The loop is still happening, you just are not writing it. R runs it for you, in one step, over the whole vector.

[KEY INSIGHT]
A vectorized expression describes *what* you want for the whole vector (raise every price 8%) instead of spelling out *how* to walk it element by element. Shorter to write, harder to get wrong, and, as you will see, far faster.

=== step === concept
::eyebrow How lengths line up
## Recycling: how one number meets many

In `prices * 1.08`, one value (`1.08`) met six values. How? Through R's **recycling rule**: when you combine vectors of different lengths, the shorter one is repeated as needed to match the longer one. A single number is length 1, so it gets reused for every element.

```r
prices * 2          # the length-1 value 2 is recycled across all six prices
#> croissant    muffin     bagel     scone     donut      loaf
#>      6.40      5.00      4.00      5.60      3.80      9.00
```

When **two equal-length** vectors meet, they line up position by position, element 1 with element 1, element 2 with element 2, and so on. Say each item has its own promo discount in dollars:

```r
discount <- c(0.00, 0.20, 0.00, 0.50, 0.30, 0.00)   # dollars off each item
prices - discount                                   # element by element
#> croissant    muffin     bagel     scone     donut      loaf
#>      3.20      2.30      2.00      2.30      1.60      4.50
```

Formally, when two vectors \(x\) and \(y\) of the same length combine with an operator \(\star\), the result \(z\) has \(z_i = x_i \star y_i\) for each position \(i\). If \(y\) has length 1, that single \(y_1\) is recycled, so \(z_i = x_i \star y_1\) for every \(i\).

Recycling even works when the longer length is an exact multiple of the shorter. But if it is **not** a clean multiple, R still recycles and warns you, a sign your lengths probably do not mean what you think:

```r
prices + c(0.10, 0.20, 0.40, 0.05)   # length 6 and length 4 do not divide evenly
#> Warning message:
#> longer object length is not a multiple of shorter object length
```

[WARNING]
A "longer object length is not a multiple of shorter object length" warning almost always means you combined two vectors that were supposed to be the same length but were not. Treat it as a bug to fix, not noise to ignore.

=== step === quiz
::eyebrow Check yourself
## Raise every price, one line

You have `prices`, a length-6 numeric vector of shelf prices, and you want **every** price raised by 8% in a single expression. Which one does that correctly?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `prices * 1.08` ::ok Right. The length-1 value `1.08` is recycled across all six elements, so you get a length-6 vector of raised prices back, no loop, counter or storage needed.
- `prices[i] * 1.08`, run once for each `i` ::no That is the loop mindset: it needs an index `i`, a counter and somewhere to store each result. Vectorization exists precisely so you do not have to set any of that up.
- `sum(prices) * 1.08` ::no That raises the *total* by 8% and collapses six prices into one number. You want each of the six prices raised, which keeps all six. `sum()` is a reduction, not an element-wise operation.

=== step === concept
::eyebrow Why it reads better
## Clearer code: say what, not how

Speed gets the headlines, but clarity is the daily win. A vectorized line reads like the sentence you would say out loud. Compare labelling each item "premium" or "everyday". The loop spells out the bookkeeping:

```r
# the loop way
tier_loop <- character(length(prices))
for (i in seq_along(prices)) {
  if (prices[i] >= 3) {
    tier_loop[i] <- "premium"
  } else {
    tier_loop[i] <- "everyday"
  }
}
tier_loop
```

`ifelse()` is the vectorized conditional, it makes the same decision for every element at once and returns a vector of labels:

```r
tier <- ifelse(prices >= 3, "premium", "everyday")
tier
#> croissant    muffin     bagel     scone     donut      loaf
#>  "premium" "everyday" "everyday" "everyday" "everyday"  "premium"
```

The other everyday move is a **reduction**: collapsing a whole vector into a single summary number. R ships these vectorized and ready, no loop required:

```r
sum(prices)    # total shelf value
#> [1] 16.9
mean(prices)   # average price
#> [1] 2.816667
max(prices)    # the priciest item
#> [1] 4.5
```

[KEY INSIGHT]
Most loops you are tempted to write fall into two buckets: transform every element (use a vectorized operator or `ifelse()`) or boil the vector down to a summary (use a reduction like `sum()`, `mean()` or `max()`). In both cases the vectorized form is shorter and says exactly what it does.

=== step === tryit
::eyebrow Your turn
## Vectorize a points calculation

Rosewood gives 10 loyalty points per dollar. Compute `points` for **every** item at once, no loop, by multiplying the whole `prices` vector. Fill in the blank, then check. (You should get one points value per item.)

```r
prices <- c(croissant = 3.20, muffin = 2.50, bagel = 2.00,
            scone = 2.80, donut = 1.90, loaf = 4.50)
# 10 loyalty points per dollar, for EVERY item at once
points <- ____
points
```
::check {"regex":"prices\\s*\\*\\s*10","gate":true,"difficulty":"beginner","ok":"Exactly. prices * 10 multiplies all six elements at once and returns a vector of points, wrapping it in round() just tidies the decimals.","no":"Multiply the whole vector by 10 in one expression: prices * 10 (you can wrap it in round() to drop the decimals)."}
::solution
```r
prices <- c(croissant = 3.20, muffin = 2.50, bagel = 2.00,
            scone = 2.80, donut = 1.90, loaf = 4.50)
points <- round(prices * 10)
points
#> croissant    muffin     bagel     scone     donut      loaf
#>        32        25        20        28        19        45
```

=== step === concept
::eyebrow The real reason it is fast
## Why it runs faster

Six prices finish instantly either way. The difference shows up at scale, so step the loop widget below once more and count: every pass is a separate trip through R's interpreter, R reads the next element, works out what to do with it, computes it, then stores the result. Five passes here. Now picture the bakery's full sales log: not six numbers but 100,000 line items this year.

::widget control-flow {}

A vectorized call does **not** make 100,000 separate trips. R recognises `x * 10` as one operation on the whole vector and hands the actual element-by-element loop to fast compiled code (written in C) underneath. One trip through the interpreter, then a tight machine-level loop. The R loop pays the interpreter's overhead 100,000 times; the vectorized call pays it once. Time both on the bakery's sales log and see:

```r
set.seed(1)
n <- 100000
x <- runif(n, 1, 100)        # 100,000 sale amounts, in dollars

# vectorized: one compiled loop does the whole vector
t_vec <- system.time(points_vec <- round(x * 10))

# the FAIR loop: preallocated, one interpreted R pass per element
points_loop <- numeric(n)
t_loop <- system.time(
  for (i in seq_along(x)) points_loop[i] <- round(x[i] * 10)
)

t_vec["elapsed"]                      # near zero
t_loop["elapsed"]                     # many times larger
identical(points_vec, points_loop)    # same answer, very different effort
#> [1] TRUE
```

Your exact elapsed times will vary by machine, but the vectorized line is typically dozens to hundreds of times faster, while `identical()` confirms both produce the very same result.

[WARNING]
There is a worse loop habit that makes things slower still: **growing** a result with `c()` on every pass. Each `c()` copies the whole vector to a bigger spot, so the cost balloons as the vector grows. If you must loop, *preallocate* and fill by index.

```r
# the trap: regrows (and recopies) the vector every single pass
bad <- c()
for (i in 1:5) bad <- c(bad, i^2)

# the fix: make the space once, then fill slot by slot
good <- numeric(5)
for (i in 1:5) good[i] <- i^2
good
#> [1]  1  4  9 16 25
```

=== step === quiz
::eyebrow Check yourself
## Where does the speed come from?

Your vectorized `x * 10` finishes almost instantly, while the equivalent *preallocated* `for` loop over the same 100,000 numbers takes far longer. Both do exactly the same multiplications. Why is the loop so much slower?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Each loop pass is a separate trip through R's interpreter, while the vectorized call hands the whole job to one fast compiled loop underneath ::ok Right. The arithmetic is identical; the loop's cost is paying the interpreter's per-pass overhead 100,000 times instead of once.
- The loop does more arithmetic than the vectorized version ::no Both do exactly `n` multiplications, the math count is identical. The extra cost is interpreter overhead per pass, not extra arithmetic.
- Vectorized code automatically uses the GPU or multiple CPU cores ::no Plain vectorized arithmetic is single-threaded too. Its speed comes from running one compiled C loop instead of 100,000 interpreted R steps, not from parallel hardware.

=== step === concept
::eyebrow Know the limits
## When a loop is still the right tool

Vectorization is the default, not a law. The one case it cannot replace is a **genuine sequential dependence**: when each value needs the value the loop just computed. There is no "whole vector at once" because element `m` does not exist until element `m - 1` is done.

Suppose Rosewood saves up: each month the balance earns 1% interest *on last month's balance*, then a $200 deposit lands. Month 2 depends on month 1, month 3 on month 2, and so on, a chain. A loop expresses that chain directly:

```r
balance <- numeric(12)
balance[1] <- 200                       # first deposit
for (m in 2:12) {
  balance[m] <- balance[m - 1] * 1.01 + 200   # needs LAST month's balance
}
round(balance, 2)
#> [1]  200.00  402.00  606.02  812.08 1020.20 1230.40 1442.71 1657.13
#> [9] 1873.71 2092.44 2313.37 2536.50
```

The widget shows why no single vectorized expression does this: each box reads the box before it.

::widget process-flow {"steps":[{"title":"Month 1","sub":"start with the $200 deposit"},{"title":"Month 2","sub":"grow month 1 by 1%, add $200"},{"title":"Month 3","sub":"grow month 2 by 1%, add $200"},{"title":"...and on","sub":"each month needs the prior month balance"}]}

[NOTE]
Loops are also the natural fit for *side effects*, doing something each pass rather than computing a value: printing progress, writing files, or calling a service once per row. The rule of thumb: if each result is independent, vectorize; if each result feeds the next, loop.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take vectorization further:

- [Advanced R (2e): Improving performance, "Vectorise"](https://adv-r.hadley.nz/perf-improve.html) - Hadley Wickham on why vectorized code is fast and how to spot loops worth replacing.
- [The R Inferno (Patrick Burns)](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf) - Circle 2 ("Growing objects") and Circle 3 ("Failing to vectorize") are the classic, vivid treatment of the exact traps in this lesson.
- [Hands-On Programming with R: Speed](https://rstudio-education.github.io/hopr/speed.html) - a beginner-first chapter that builds up vectorized code and benchmarks it against loops.
- [An Introduction to R: Simple manipulations](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the official manual on vector arithmetic and the recycling rule.

=== step === complete
## Lesson 1 complete

You can now turn an element-by-element loop into a single vectorized expression, you understand recycling (a length-1 value reused for every element, equal-length vectors lined up position by position, and the warning when lengths do not divide evenly), you reach for `ifelse()` and reductions like `sum()` instead of writing the loop yourself, and you can say *why* the vectorized form is so much faster: one trip through the interpreter and a compiled inner loop, not 100,000 interpreted passes. You also know the honest exception, a genuine sequential dependence still wants a loop.

Next, Lesson 2: The apply Family. Not every "do this to each element" job is plain arithmetic, sometimes you need to run your *own* function over each piece of a list or each row of a matrix. `apply()`, `lapply()`, `sapply()` and the type-safe `vapply()` give you vectorization's clarity for those jobs too.
