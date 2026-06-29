---
title: "R Foundations Lesson 3: Operators, Recycling, and Coercion"
catalog_blurb: "Compute with whole vectors at once, even when lengths or types differ."
description: "Operate on whole vectors at once with R's arithmetic, comparison, and logical operators, watch recycling stretch a shorter vector, and see TRUE and FALSE coerce to 1 and 0."
keywords: "R operators, vectorized operations in R, recycling rule in R, logical operators in R, comparison operators in R, coercion in R, sum of a logical in R, R for beginners"
post_type: "LESSON"
curriculum_id: "1.1.3"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-basics"
course_title: "R Foundations: The Basics"
course_lesson: "3"
course_total: "4"
course_landing: "R-Foundations-Basics-Course.html"
course_next: "Missing-and-Special-Values.html"
course_prev: "Atomic-Vectors-and-Data-Types.html"
---

=== step === cover
::eyebrow Lesson 3 of 4
## Operators, Recycling, and Coercion
You are at the checkout with six things in your basket: **milk, bread, eggs, apples, coffee, rice**. Their unit prices are **2.50, 1.80, 3.20, 4.00, 7.50, 5.20** dollars, and you bought **2, 1, 1, 3, 1, 2** of them. In Lesson 2 you learned to hold each of those rows in a vector. This lesson is about *doing things with them*: working out every line total in one stroke, asking "which items cost more than \$5?", and applying a discount to the whole basket at once.

By the end of this lesson you will be able to:

- Use R's operators (`+ - * /`, `>`, `&`) on a whole vector at once, element by element
- Build TRUE/FALSE vectors to answer questions about your data, and count how many pass
- Predict how R **recycles** a shorter vector to fit a longer one, and what its warning means

**Prerequisites:** [Lesson 1](R-Syntax-and-First-Objects.html) (running R, assigning with `<-`, calling a function) and [Lesson 2](Atomic-Vectors-and-Data-Types.html) (building a vector with `c()`, the four types, and the coercion ladder). The box below holds three of your prices; press Run any time, and try the **+ "hi" (text)** button to see coercion at work before we even begin.

::widget vector-coercion {"start":[{"lit":"2.50","type":"double"},{"lit":"1.80","type":"double"},{"lit":"3.20","type":"double"}]}

=== step === concept
::eyebrow One stroke, not a loop
## Operators work on the whole vector at once

Here is the move that makes R feel different from a calculator. In most languages, to multiply each price by its quantity you would write a loop. In R you just write the multiplication once, and R applies it **position by position** across the whole vector. First, build the basket (each lesson starts a fresh R session, so we create the data right here; run this once):

```r
price    <- c(2.50, 1.80, 3.20, 4.00, 7.50, 5.20)   # price per unit, in dollars
quantity <- c(2,    1,    1,    3,    1,    2)        # how many of each
items    <- c("milk", "bread", "eggs", "apples", "coffee", "rice")
```

Now the line total for every item, in one expression. R lines up `price[1]` with `quantity[1]`, `price[2]` with `quantity[2]`, and so on, multiplying each pair:

```r
line_total <- price * quantity   # element by element, no loop needed
line_total
#> [1]  5.0  1.8  3.2 12.0  7.5 10.4
sum(line_total)                  # the whole basket, added up
#> [1] 39.9
```

That is what people mean when they call R **vectorized**: an operator on a vector returns a vector, computed one matching pair at a time. The same goes for `+`, `-`, `/`, `^` (powers), and the two whole-number helpers `%%` (remainder) and `%/%` (integer division); every one of them runs element by element. Here is the pairing `price * quantity` made visible:

::widget process-flow {"steps":[{"title":"2.50 x 2","sub":"milk = 5.00"},{"title":"1.80 x 1","sub":"bread = 1.80"},{"title":"3.20 x 1","sub":"eggs = 3.20"},{"title":"4.00 x 3","sub":"apples = 12.00"},{"title":"7.50 x 1","sub":"coffee = 7.50"},{"title":"5.20 x 2","sub":"rice = 10.40"}]}

=== step === tryit
::eyebrow Your turn
## Total each line yourself

The basket is already built (`price` and `quantity`, six values each). Replace the blank with the expression that multiplies them element by element, so `line_total` holds each item's cost. You are expecting `5.0 1.8 3.2 12.0 7.5 10.4`.

```r
line_total <- ____   # price times quantity, position by position
line_total
```
::check {"regex":"(price\\s*\\*\\s*quantity|quantity\\s*\\*\\s*price)","gate":true,"difficulty":"beginner","ok":"Exactly. price * quantity pairs them up by position, so you get all six line totals in one stroke, no loop.","no":"Multiply the two vectors directly: price * quantity. R lines them up element by element."}
::solution
```r
line_total <- price * quantity
line_total
#> [1]  5.0  1.8  3.2 12.0  7.5 10.4
```

=== step === concept
::eyebrow Yes-or-no questions
## Comparing builds a TRUE/FALSE vector

Operators are not only for arithmetic. A **comparison** like `>` asks a yes/no question of every element and hands back a **logical** vector, one TRUE or FALSE per item. These are the same logicals you met in Lesson 2, now produced by a question:

```r
price > 5            # which items cost more than $5?
#> [1] FALSE FALSE FALSE FALSE  TRUE  TRUE
quantity > 1         # which did we buy more than one of?
#> [1]  TRUE FALSE FALSE  TRUE FALSE  TRUE
```

The full set of comparisons is `>`, `<`, `>=`, `<=`, `==` (equal to, two equals signs), and `!=` (not equal). You combine two logical vectors with the **logical operators**: `&` (and, TRUE only where both are TRUE), `|` (or, TRUE where either is), and `!` (not, which flips each value). A logical vector can also pick out the elements of another vector where it is TRUE, which is how you turn a question into an answer:

```r
(price > 5) & (quantity > 1)        # over $5 AND bought more than once
#> [1] FALSE FALSE FALSE FALSE FALSE  TRUE
items[(price > 5) & (quantity > 1)] # name the item(s) that match
#> [1] "rice"
(price > 5) | (quantity > 2)        # over $5 OR bought more than twice
#> [1] FALSE FALSE FALSE  TRUE  TRUE  TRUE
```

[KEY INSIGHT]
`&`, `|`, and `!` work element by element, lining up the TRUE/FALSE vectors position by position, exactly as `*` lined up the numbers. Their doubled cousins `&&` and `||` look at only the FIRST element and return a single TRUE/FALSE, so they are for one yes/no answer (inside an `if`), never for a whole vector. Reaching for `&&` when you meant `&` is the most common beginner slip here.

=== step === quiz
::eyebrow Check yourself
## Which operator answers the question?

You want a TRUE/FALSE for every item that is **both** over \$5 **and** bought more than once. Which expression gives you that, one value per item?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `(price > 5) & (quantity > 1)` ::ok Right. Single `&` combines the two logical vectors element by element, returning TRUE only where both conditions hold, one result per item.
- `(price > 5) && (quantity > 1)` ::no `&&` looks at only the FIRST element of each side and returns a single TRUE/FALSE, not one per item. For a whole vector you need single `&`.
- `(price > 5) | (quantity > 1)` ::no `|` is OR: it is TRUE when EITHER condition holds, not both. You asked for AND, which is `&`.

=== step === concept
::eyebrow Coercion, again
## TRUE counts as 1

Here is where Lesson 2's coercion ladder pays off. The moment a logical value meets arithmetic, R coerces it up the ladder `logical < integer < double`: **TRUE becomes 1 and FALSE becomes 0**. That single rule makes counting and averaging fall out for free:

```r
TRUE + TRUE          # logicals coerced to numbers: 1 + 1
#> [1] 2
sum(price > 5)       # add up the TRUEs: how many items cost over $5?
#> [1] 2
mean(price > 5)      # the average of 1s and 0s: what fraction are over $5?
#> [1] 0.3333333
```

`sum()` of a condition **counts** how many are TRUE, because it is adding 1s and 0s. `mean()` of a condition gives the **proportion** that are TRUE, for the same reason: two of the six prices clear \$5, so the mean is 2/6, about 0.33. You will use `sum(condition)` and `mean(condition)` constantly. The interactive below is the same ladder from Lesson 2; add a logical and a number and watch them land on one shared type:

::widget vector-coercion {}

=== step === quiz
::eyebrow Check yourself
## What does the count return?

R has no separate "count" happening here; it is plain arithmetic on TRUE/FALSE. For our basket, where two items cost more than \$5, what does `sum(price > 5)` return?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- an error, because you cannot add TRUE and FALSE together ::no Adding logicals is fine. R coerces TRUE to 1 and FALSE to 0 first, exactly the Lesson 2 ladder, now inside a calculation.
- `2`, because each TRUE counts as 1 and each FALSE as 0, so summing them counts the TRUEs ::ok Right. `price > 5` is `FALSE FALSE FALSE FALSE TRUE TRUE`; coerced to `0 0 0 0 1 1`, those sum to 2.
- `TRUE`, because at least one price is over \$5 ::no `sum()` does arithmetic, not a yes/no. The logicals become 1s and 0s and add up to a count (2), not a single TRUE.

=== step === concept
::eyebrow When lengths differ
## Recycling: R stretches the shorter vector

So far every operation paired two vectors of the same length. But you have already used a mismatch without noticing: `price * 0.9` multiplies six prices by **one** number. R handles this by **recycling**: when one vector is shorter, R repeats it from the start, as many times as needed, to match the longer one. A single value is just the simplest case, repeated six times:

```r
price * 0.9          # one rate (length 1) recycled to all six prices: 10% off
#> [1] 2.25 1.62 2.88 3.60 6.75 4.68
```

Recycling works for any length that divides evenly. Say the shop runs an "every second item half price" promo, a length-2 pattern `c(1, 0.5)`. R recycles it as `1, 0.5, 1, 0.5, 1, 0.5` to cover all six items:

```r
price * c(1, 0.5)    # length-2 pattern recycled across the six prices
#> [1] 2.5 0.9 3.2 2.0 7.5 2.6
```

The repeating rate column is exactly what recycling does, made visible:

| item | price | rate (recycled) | charged |
|---|---|---|---|
| milk | 2.50 | 1.0 | 2.50 |
| bread | 1.80 | 0.5 | 0.90 |
| eggs | 3.20 | 1.0 | 3.20 |
| apples | 4.00 | 0.5 | 2.00 |
| coffee | 7.50 | 1.0 | 7.50 |
| rice | 5.20 | 0.5 | 2.60 |

But if the longer length is **not** a clean multiple of the shorter one, R recycles as far as it can and **warns** you that something is probably off. A length-4 pattern against six prices does not divide evenly:

```r
price * c(1, 0.9, 0.8, 0.7)   # length 4 into length 6: not a clean multiple
#> [1] 2.50 1.62 2.56 2.80 7.50 4.68
#> Warning message:
#> In price * c(1, 0.9, 0.8, 0.7) :
#>   longer object length is not a multiple of shorter object length
```

[WARNING]
That warning is R looking out for you: a length mismatch that is not a clean multiple is almost always a mistake (a column with a missing value, two vectors you thought were the same size). It still returns a result, so the bug runs silently unless you read the warning. When you see "longer object length is not a multiple of shorter object length", stop and check your lengths with `length()`.

=== step === tryit
::eyebrow Put it together
## Discount the whole basket

The shop offers a flat **10% off** everything. A 10% discount means paying 90%, so multiply every price by `0.9`, a single value recycled to all six. Fill in the blank, then the second line totals up the discounted basket. The discounted total should come to `35.91` (exactly 90% of the \$39.90 full price).

```r
deal <- ____            # 10% off every price (one rate, recycled to all six)
sum(deal * quantity)    # the discounted basket total
```
::check {"regex":"(price\\s*\\*\\s*0?\\.9|0?\\.9\\s*\\*\\s*price)","gate":true,"difficulty":"intermediate","ok":"That is it: price * 0.9 recycles the single rate across all six prices, and the discounted basket lands at 35.91.","no":"Multiply the whole price vector by one number: price * 0.9. That one rate is recycled to every item."}
::solution
```r
deal <- price * 0.9
sum(deal * quantity)
#> [1] 35.91
```

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [An Introduction to R: numbers and vectors](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the canonical first treatment of vector arithmetic and the recycling rule, straight from the R project.
- [R for Data Science (2e): Logical vectors](https://r4ds.hadley.nz/logicals) - comparisons, `&`/`|`/`!`, and using `sum()`/`mean()` on a condition to count and average.
- [Advanced R (2e): Vectors](https://adv-r.hadley.nz/vectors-chap.html) - the precise coercion rules behind "TRUE becomes 1", with the full type hierarchy.
- [The R Language Definition: Arithmetic operators](https://cran.r-project.org/doc/manuals/r-release/R-lang.html) - the authoritative spec for how operators, coercion, and recycling are defined.

=== step === complete
## Lesson 3 complete

You now *do things* with vectors, not just build them. You saw that R's operators are vectorized, running element by element so `price * quantity` needs no loop; that comparisons (`>`, `==`) build TRUE/FALSE vectors you combine with `&`, `|`, and `!`; that logicals coerce to 1 and 0 in arithmetic, so `sum()` and `mean()` of a condition count and average it; and that recycling quietly stretches a shorter vector to fit a longer one, warning you only when the lengths do not divide evenly.

Next, Lesson 4: Missing and Special Values. Real data has holes, and R marks them with `NA` (and meets `NULL`, `NaN`, and `Inf` along the way). You will see how a single `NA` ripples through exactly the operators, sums, and means you just learned, and the handful of tools that keep it from quietly wrecking your results.
