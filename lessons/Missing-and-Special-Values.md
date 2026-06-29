---
title: "R Foundations Lesson 4: Missing and Special Values"
catalog_blurb: "How missing values spread through your results, and how to handle them honestly."
description: "Real data has holes. See how one NA spreads through sums and means, find and skip missing values with na.rm, and tell NA, NaN, Inf and NULL apart in R."
keywords: "NA in R, missing values in R, NULL vs NA, NaN in R, Inf in R, is.na, na.rm, na.omit, special values in R, R for beginners"
post_type: "LESSON"
curriculum_id: "1.1.4"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-basics"
course_title: "R Foundations: The Basics"
course_lesson: "4"
course_total: "4"
course_landing: "R-Foundations-Basics-Course.html"
course_next: ""
course_prev: "Operators-Recycling-and-Coercion.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## Missing and Special Values
Back at the checkout with the same six-item basket from Lesson 3 (**milk, bread, eggs, apples, coffee, rice**) something has gone wrong: the **eggs** barcode was smudged and never scanned, so its price came through blank. In R that blank is not zero and not an empty word. It is a special marker, `NA`, that means "a value belongs here, but we do not know what it is." This lesson is about that marker and its three cousins, and the surprising amount of damage a single hole can do if you do not handle it.

By the end of this lesson you will be able to:

- Explain what `NA` means and predict how a single one spreads through a `sum()` or a `mean()`
- Skip the holes with `na.rm = TRUE`, and find them with `is.na()` (and dodge the `NA == NA` trap)
- Tell `NA`, `NaN`, `Inf`, and `NULL` apart: what each one means and how you get it

**Prerequisites:** [Lesson 1](R-Syntax-and-First-Objects.html) (running R, `<-`, calling a function), [Lesson 2](Atomic-Vectors-and-Data-Types.html) (building a vector with `c()`, the four types), and [Lesson 3](Operators-Recycling-and-Coercion.html) (operators run element by element, and `sum()`/`mean()` of a condition count and average). The table below is the basket as a data frame, with that missing egg price already in it. Toggle the columns, then press **Build it in R**.

::widget dataframe-builder {"columns":[{"name":"item","type":"character","values":["milk","bread","eggs","apples","coffee","rice"]},{"name":"price","type":"double","values":[2.5,1.8,"NA",4,7.5,5.2]},{"name":"quantity","type":"integer","values":[2,1,1,3,1,2]}]}

=== step === concept
::eyebrow The marker for a hole
## NA marks a value that is missing

Real data has holes: a survey question left blank, a sensor that dropped out, a barcode that did not scan. R has one marker for every such hole, `NA` (short for "Not Available"). It is not a typo for zero and not an empty string `""`; it is R's honest way of saying *we do not know this value*.

Each lesson starts a fresh R session, so let us rebuild the basket right here, with the eggs price recorded as the hole it really is:

```r
item     <- c("milk", "bread", "eggs", "apples", "coffee", "rice")
price    <- c(2.50, 1.80, NA, 4.00, 7.50, 5.20)   # eggs did not scan -> unknown
quantity <- c(2, 1, 1, 3, 1, 2)
price
#> [1] 2.5 1.8  NA 4.0 7.5 5.2
```

Notice two things. First, the hole prints as `NA`, sitting in the third slot exactly where the egg price would go. Second, the hole still *takes up a slot*: the basket is six items long, not five. That matters later when we meet `NULL`, which behaves the opposite way.

```r
length(price)   # the hole still counts: six prices, one of them unknown
#> [1] 6
is.na(price)    # which slots are holes? (one TRUE, at position three)
#> [1] FALSE FALSE  TRUE FALSE FALSE FALSE
```

=== step === concept
::eyebrow Why a hole is dangerous
## One NA spreads to your whole answer

Here is the rule that catches every beginner. **Any calculation that touches an `NA` returns `NA`.** R reasons honestly: if you do not know the eggs price, then you also do not know the basket's total, and you do not know the average price. An unknown ingredient makes an unknown result.

So the very `sum()` and `mean()` you learned in Lesson 3 now come back blank, because one of the six prices is unknown:

```r
sum(price)        # add all six prices... but one of them is unknown
#> [1] NA
mean(price)       # so the average is unknown too
#> [1] NA
price * quantity  # and each line total is unknown wherever the price is
#> [1]  5.0  1.8   NA 12.0  7.5 10.4
```

The multiplication is the clearest picture of it: five of the six line totals compute fine, but the eggs slot is `NA`, and the moment you `sum()` that vector the single hole swallows the whole result. The flow below traces how one missing price turns the entire total into `NA`.

::widget process-flow {"steps":[{"title":"Six prices, one unknown","sub":"2.50, 1.80, NA, 4.00, 7.50, 5.20"},{"title":"Add them up","sub":"2.50 + 1.80 + NA + 4.00 + ..."},{"title":"NA infects the sum","sub":"any number added to NA is NA"},{"title":"Result of sum(price)","sub":"NA"}]}

=== step === quiz
::eyebrow Check yourself
## What does the average come back as?

Your `price` vector has six values, and one of them (eggs) is `NA`. The other five are perfectly good numbers. With no extra arguments, what does `mean(price)` return?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `NA`, because one input is unknown, so the average is unknown ::ok Right. Any calculation that touches an NA returns NA. R will not guess past a hole, so the mean of six values, one unknown, is itself unknown.
- `4.2`, the average of the five prices it can read ::no Tempting, but plain `mean()` does not silently drop the hole. It returns NA. To average only the known prices you must ASK it to skip them, with na.rm = TRUE (next step).
- an error, because a vector is not allowed to contain a missing value ::no A vector can absolutely hold NA, that is its whole job. R does not error; it propagates the unknown and quietly returns NA.

=== step === concept
::eyebrow The first fix
## Tell R to skip the holes: na.rm = TRUE

Most summary functions take an argument that says "ignore the missing values and work with what is left." It is called `na.rm` (NA-remove), and it is `FALSE` by default, which is why `sum()` and `mean()` blanked out above. Set it to `TRUE` and R computes over only the known values:

```r
sum(price, na.rm = TRUE)    # add only the five prices we DO know
#> [1] 21
mean(price, na.rm = TRUE)   # average those same five known prices
#> [1] 4.2
```

The five known prices (2.50, 1.80, 4.00, 7.50, 5.20) add to 21.0, and their average is 21 / 5 = 4.2. The same `na.rm = TRUE` works on `min()`, `max()`, `median()`, `sd()`, and friends. If instead you want to throw away the incomplete entries entirely, `na.omit(price)` returns the five-value vector with the hole removed.

[NOTE]
`na.rm = TRUE` is useful but it is not free: it quietly *changes the question*. `mean(price, na.rm = TRUE)` is no longer "the average price of my six-item basket"; it is "the average price of the five items I happened to scan." Usually that is what you want, but always know that you are answering about the data you have, not the data you wish you had.

=== step === tryit
::eyebrow Your turn
## Total the basket you can price

You want the basket total for the items whose price you actually know. `price * quantity` gives each line total (with `NA` at the eggs slot), and `sum()` adds them. Add the one argument that tells `sum()` to skip the hole. You are expecting `36.7`.

```r
known_total <- sum(price * quantity, ____)   # add the line totals, skipping the hole
known_total
```
::check {"regex":"na\\.rm\\s*=\\s*(T|TRUE)\\b","gate":true,"difficulty":"beginner","ok":"Exactly. na.rm = TRUE drops the NA line total, so the five priced items add up to 36.7.","no":"Add na.rm = TRUE inside sum(): sum(price * quantity, na.rm = TRUE). Without it, the single NA makes the whole sum NA."}
::solution
```r
known_total <- sum(price * quantity, na.rm = TRUE)
known_total
#> [1] 36.7
```

=== step === concept
::eyebrow Find the holes
## is.na() asks "which values are missing?"

Before you can skip or fix holes, you have to find them. Your instinct from Lesson 3 might be to compare against `NA` with `==`. That instinct fails, and failing to know why is one of the most common R bugs:

```r
price == NA       # the trap: this does NOT find the missing value
#> [1] NA NA NA NA NA NA
```

Every answer is `NA`, even for the prices that are plainly there. Why? Because `==` asks "is this value equal to that value?", and `NA` means "unknown." Asking "is 2.50 equal to an unknown number?" has only one honest answer: *unknown*. So `anything == NA` is `NA`, never `TRUE`. You can never test for missingness with `==`.

The right tool is the dedicated function `is.na()`, which returns a clean `TRUE`/`FALSE` for every element, with `TRUE` exactly at the holes:

```r
is.na(price)          # TRUE only where the value is missing
#> [1] FALSE FALSE  TRUE FALSE FALSE FALSE
sum(is.na(price))     # count the holes (TRUEs add up, just like Lesson 3)
#> [1] 1
which(is.na(price))   # WHERE are the holes? (their positions)
#> [1] 3
```

[WARNING]
`NA == NA` is `NA`, not `TRUE`: two unknowns are not "equal," because you do not know either one. Whenever you mean "is this value missing?" reach for `is.na(x)`, never `x == NA`. `sum(is.na(x))` then counts the missing values, and `mean(is.na(x))` gives the fraction missing.

=== step === quiz
::eyebrow Check yourself
## How do you flag the missing prices?

You want a `TRUE`/`FALSE` for every item, `TRUE` where its price is missing and `FALSE` where it is known. Which expression gives you that?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `is.na(price)` ::ok Right. is.na() is the one tool built for the job: it returns TRUE exactly at the holes and FALSE everywhere else, one value per item.
- `price == NA` ::no This is the trap. Comparing anything to NA yields NA (an unknown cannot be tested for equality), so you get six NAs and find nothing.
- `price == NaN` ::no NaN is a different special value (an undefined number, coming up next), and just like NA it cannot be matched with ==. To find missing values, always use is.na().

=== step === concept
::eyebrow Meet the cousins
## NaN, Inf, and NULL: the rest of the family

`NA` is the one you will meet daily, but R has three more special values worth recognizing on sight. The first two appear when the arithmetic itself breaks down:

```r
0 / 0          # an undefined result -> Not a Number
#> [1] NaN
1 / 0          # division by zero -> positive infinity
#> [1] Inf
2^2000         # a number too big for R to store -> overflow to Inf
#> [1] Inf
```

`NaN` ("Not a Number") is what you get from a calculation with no defined answer, like `0/0` or the square root of a negative number. `Inf` and `-Inf` are positive and negative infinity, from dividing a non-zero number by zero or from a result too large to represent. Each has its own test, and watch this one closely: `NaN` also counts as missing (every `NaN` is an `NA`, but not the reverse):

```r
is.nan(0 / 0)                    # specifically a NaN?
#> [1] TRUE
is.infinite(1 / 0)               # specifically an infinity?
#> [1] TRUE
is.na(NaN)                       # a NaN is "missing" too
#> [1] TRUE
is.finite(c(1, NA, Inf, NaN))    # the catch-all: only 1 is a usable number
#> [1]  TRUE FALSE FALSE FALSE
```

The last cousin is different in kind. `NULL` is not a hole *in* a vector; it is the absence of anything at all, an object of length zero. Where `NA` keeps its slot, `NULL` simply vanishes when you build a vector:

```r
length(NULL)     # NULL is emptiness itself: zero length, no slot
#> [1] 0
c(1, NULL, 3)    # NULL disappears (you get a length-2 vector)
#> [1] 1 3
c(1, NA, 3)      # NA keeps its slot (a length-3 vector with a hole)
#> [1]  1 NA  3
is.null(NULL)    # the test for "nothing here"
#> [1] TRUE
```

Here is the whole family on one card:

| value | what it means | a typical way you get it | test it with |
|---|---|---|---|
| `NA` | a value exists but is unknown (missing) | a reading that did not scan | `is.na()` |
| `NaN` | an undefined numeric result | `0 / 0`, `sqrt(-1)` | `is.nan()` |
| `Inf` / `-Inf` | infinity: a number too big to represent | `1 / 0`, overflow | `is.infinite()` |
| `NULL` | nothing at all, not even a slot | a function that returns nothing | `is.null()` |

=== step === quiz
::eyebrow Check yourself
## Which special value appears?

A sales report computes each category's average price as `total / count`. One brand-new category had no sales yet, so both `total` and `count` are `0`, and R evaluates `0 / 0` for it. What shows up in that cell?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `NaN`, because `0 / 0` is an undefined numeric result, not a missing reading ::ok Right. The math has no defined answer, so R returns NaN. (And note is.na(NaN) is TRUE, so it would also be caught by an is.na() check.)
- `NA`, because the value is missing ::no Close, but not the same thing. NA marks a value that exists yet is unknown (a reading that did not scan). Here the value was computed and the computation is undefined, which is NaN.
- `Inf`, because you divided by zero ::no Inf comes from a NON-zero number over zero, like 5 / 0. The special case 0 / 0 is undefined in a different way, and that one is NaN.
- `NULL`, because there is nothing to show ::no NULL is the absence of a slot entirely. A computed cell still holds a value here, and that value is NaN.

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [R for Data Science (2e): Missing values](https://r4ds.hadley.nz/missing-values) - a practical chapter on explicit vs implicit missing values and how to handle them in real data.
- [An Introduction to R: Missing values](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the R project's own first treatment of `NA` and `is.na()`, straight from the source.
- [The R Language Definition: special values](https://cran.r-project.org/doc/manuals/r-release/R-lang.html) - the authoritative spec for how `NA`, `NaN`, `Inf`, and `NULL` are defined and behave.
- [Advanced R (2e): Vectors](https://adv-r.hadley.nz/vectors-chap.html) - the precise distinction between `NULL` (length zero) and `NA` (a missing element), with the full type rules.

=== step === complete
## Lesson 4 complete

You can now handle the holes that real data always has. You saw that `NA` marks a value that exists but is unknown, and that a single one spreads through `sum()`, `mean()`, and elementwise math because R refuses to guess past it; that `na.rm = TRUE` (and `na.omit()`) let you compute over the known values, as long as you remember it answers a slightly different question; that `is.na()` is the only safe way to find missing values, since `NA == NA` is itself `NA`; and that `NaN` (undefined math), `Inf` (infinity), and `NULL` (nothing at all) are three more special values, each with its own meaning and its own test.

That completes **R Foundations: The Basics**. You have gone from your first `<-` to vectors, types, operators, recycling, and now the special values that trip up everyone who skips them. Next, the Foundations track moves from single vectors to the structures you will use every day, data frames and lists, and the control flow (`if`, `for`) that ties your code together. Head back to the [course page](R-Foundations-Basics-Course.html) to keep going.
