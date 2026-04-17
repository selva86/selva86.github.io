---
title: "R Vectors: The Foundation of Everything in R (Master This First)"
slug: "R-Vectors"
description: "Master R vectors, create with c(), index with [], name elements, recycle, vectorize. The core data structure every R user must understand before anything else."
keywords: "R vectors, create vector R, c() function, vector indexing R, vector recycling, vectorized operations, named vectors, negative indexing R"
auto_link_terms: "R vectors|vectors in R|c() function|vector recycling|vectorized operations|named vectors in R|vector indexing"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.1.6"
post_type: C
sidebar_section: "R Fundamentals"
sidebar_title: "R Vectors"
sidebar_order: 6
difficulty: "Beginner"
---

# R Vectors: The Foundation of Everything in R (Master This First)

<p class="lead">A vector in R is an ordered sequence of values of the same type, it's the atomic building block that every data frame, column, and statistical function is built on. Master vectors and the rest of R snaps into place.</p>

## What is an R vector and how do you create one?

Here's the secret nobody tells beginners: in R, a single number is already a vector (of length 1). There are no "scalars." Once you understand this, vectorized operations, recycling, and indexing all make sense. Let's build one and run a few summary functions on it.

```r title="Create a numeric price vector"
prices <- c(19.99, 24.50, 9.75, 32.00, 15.25)
prices
#> [1] 19.99 24.50  9.75 32.00 15.25

mean(prices)
#> [1] 20.298
sum(prices)
#> [1] 101.49
length(prices)
#> [1] 5
```

The `c()` function ("combine") is how you build vectors from individual values. It's probably the function you'll type most often in your R career. Notice that `mean()`, `sum()`, and `length()` all operate on the whole vector at once, no loop needed. That's vectorization, and it's R's superpower.

> [TIP]
> The name `c` stands for "combine" or "concatenate," not "create." You can pass it existing vectors too: `c(prices, 99.99)` appends a value and returns a new vector of length 6.

**Try it:** Create a character vector of three city names and print its length.

```r title="Exercise: Build a character vector"
# your turn — use c() and length()
ex_cities <- c("___", "___", "___")

```

<details>
<summary>Click to reveal solution</summary>

```r title="Character vector solution"
ex_cities <- c("Mumbai", "Bengaluru", "Chennai")
length(ex_cities)
#> [1] 3
```

`c()` takes any number of arguments and glues them into a vector, here, three strings, so the result is a character vector of length 3. `length()` reports element count, not character count, which is why it returns 3 and not the total number of letters.
</details>

## How does R decide a vector's type?

A vector can only hold one type at a time, all numeric, all character, all logical, and so on. What happens if you mix types? R silently coerces every element to the most flexible type in the group. This rule trips up beginners constantly, so let's see it in action.

```r title="Type coercion across mixed vectors"
typeof(c(1, 2, 3))
#> [1] "double"
typeof(c(1L, 2L, 3L))
#> [1] "integer"
typeof(c(1, "two", 3))
#> [1] "character"
typeof(c(TRUE, FALSE, 1))
#> [1] "integer"
```

Watch the third example carefully. The number `1` and `3` got converted to the strings `"1"` and `"3"` because character is the most flexible type. This is called **implicit coercion**, R does it without warning you. It's convenient, but it can silently break calculations if a stray string sneaks into a numeric column.

> [WARNING]
> If `mean()` suddenly returns `NA` with a warning about "argument is not numeric," the first thing to check is `typeof()` on the vector. A single character value will coerce the entire vector to character and break every numeric function.

**Try it:** Predict what `typeof(c(FALSE, 2L))` returns, then run it.

```r title="Exercise: Predict mixed-type result"
# guess first, then verify
typeof(c(FALSE, 2L))

```

<details>
<summary>Click to reveal solution</summary>

```r title="Mixed-type prediction solution"
typeof(c(FALSE, 2L))
#> [1] "integer"
```

The coercion hierarchy is `logical < integer < double < character`, so when a logical meets an integer, R upgrades the logical to integer (`FALSE → 0L`) and returns an integer vector. If you added a double literal like `2` instead of `2L`, the result would move one step up the hierarchy to `"double"`.
</details>

## How do you index vectors with `[`?

Indexing, pulling out specific elements, is where R gets powerful. R offers four different ways to index a vector, and each is useful in different situations. The diagram below shows them side by side; we'll work through each one in code.

![Four ways to index an R vector](screenshots/R-Vectors-indexing-modes.webp)
*Figure 1: Positive integers select elements, negative integers exclude them, logical vectors filter by condition, and named indexing pulls by label.*

First, **positive integer indexing**. You pass the positions you want inside `[`. R uses one-based indexing, so the first element is `prices[1]`, not `prices[0]`.

```r title="Positive integer indexing"
prices[1]
#> [1] 19.99
prices[c(1, 3, 5)]
#> [1] 19.99  9.75 15.25
```

Next, **negative integer indexing** says "give me everything except these positions." This is the fastest way to drop an element you don't want.

```r title="Negative integer drop indexing"
prices[-1]
#> [1] 24.50  9.75 32.00 15.25
prices[-c(1, 2)]
#> [1]  9.75 32.00 15.25
```

**Logical indexing** is where vectorization pays off. You write a condition that produces a logical vector, then use it to filter. This is how you'll do almost all your real-world subsetting.

```r title="Logical condition indexing"
prices > 20
#> [1] FALSE  TRUE FALSE  TRUE FALSE
prices[prices > 20]
#> [1] 24.5 32.0
```

Finally, **named indexing**. If you give your vector element names, you can pull values by label, a cleaner, more self-documenting style.

```r title="Named element indexing"
scores <- c(math = 92, english = 85, science = 78)
scores["english"]
#> english 
#>      85
scores[c("math", "science")]
#>    math science 
#>      92      78
```

> [KEY INSIGHT]
> Logical indexing is the foundation of every `filter()`, `subset()`, and conditional operation you'll ever write in R. If `x[x > 0]` feels obvious, you've internalized the single most important R idiom.

**Try it:** From `prices`, select only the values greater than or equal to 15.25 using logical indexing.

```r title="Exercise: Filter by threshold"
# use a comparison inside [
ex_prices <- c(19.99, 24.50, 9.75, 32.00, 15.25)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Threshold filter solution"
ex_prices <- c(19.99, 24.50, 9.75, 32.00, 15.25)
ex_prices[ex_prices >= 15.25]
#> [1] 19.99 24.50 32.00 15.25
```

`ex_prices >= 15.25` evaluates to a length-5 logical vector, and using it inside `[` keeps only the positions where it's `TRUE`. Three values meet the cutoff outright and the trailing `15.25` is kept because `>=` is inclusive, swap it for `>` and you'd lose that element.
</details>

## How do vectorized operations work?

In most languages, if you want to add 10 to every element of a list, you write a loop. In R, you just write `x + 10`. R applies arithmetic element-by-element across the entire vector. This isn't just shorter, it's typically 10 to 100 times faster than a loop because the work happens in compiled C code under the hood.

```r title="Vectorized Celsius to Fahrenheit"
temps_c <- c(18, 22, 15, 27, 30)
temps_f <- temps_c * 9/5 + 32
temps_f
#> [1] 64.4 71.6 59.0 80.6 86.0

temps_c > 20
#> [1] FALSE  TRUE FALSE  TRUE  TRUE

sqrt(temps_c)
#> [1] 4.242641 4.690416 3.872983 5.196152 5.477226
```

Every arithmetic operator (`+`, `-`, `*`, `/`, `^`), every comparison (`>`, `<`, `==`, `!=`), and nearly every math function (`sqrt`, `log`, `abs`, `exp`) is vectorized. You'll almost never need an explicit `for` loop in idiomatic R.

**Try it:** Scale `temps_c` to a 0-to-1 range using `(x - min(x)) / (max(x) - min(x))`.

```r title="Exercise: Min-max scale temps"
ex_temps <- c(18, 22, 15, 27, 30)
# compute scaled values

```

<details>
<summary>Click to reveal solution</summary>

```r title="Min-max scale solution"
ex_temps <- c(18, 22, 15, 27, 30)
(ex_temps - min(ex_temps)) / (max(ex_temps) - min(ex_temps))
#> [1] 0.2000000 0.4666667 0.0000000 0.8000000 1.0000000
```

`min(ex_temps)` is 15 and `max(ex_temps)` is 30, so the denominator is 15. Each element gets recentred to 0-based distances (`3, 7, 0, 12, 15`) and divided element-wise by 15, min-max scaling in one vectorised line with no loop.
</details>

## What is recycling and when does it bite?

Here's what happens when you combine two vectors of different lengths: R silently repeats ("recycles") the shorter one until it matches the longer one. This is extremely convenient, but it can also cause silent bugs when you didn't mean to recycle.

![How R recycles shorter vectors](screenshots/R-Vectors-recycling.webp)
*Figure 2: When lengths don't match, R repeats the shorter vector from the beginning. No warning if the longer length is a multiple of the shorter.*

Let's see the friendly case first.

```r title="Clean recycling of shorter vector"
x <- c(1, 2, 3, 4, 5, 6)
x + c(10, 20)
#> [1] 11 22 13 24 15 26
```

The shorter vector `c(10, 20)` was recycled three times to match `x`'s length of 6. No warning, because 6 is a clean multiple of 2. Now the messy case:

```r title="Recycle with length mismatch warning"
x + c(10, 20, 30, 40)
#> Warning message:
#> In x + c(10, 20, 30, 40) :
#>   longer object length is not a multiple of shorter object length
#> [1] 11 22 33 44 15 26
```

R still gives you a result, but with a warning. It recycled `c(10, 20, 30, 40)` partially to fill the last two slots, almost certainly not what you wanted.

> [NOTE]
> Recycling is why `x + 1` works: the scalar `1` is a length-1 vector that gets recycled to match `x`. Every "add a constant" operation in R is really a recycled vector addition.

**Try it:** Predict the output of `c(1, 2, 3, 4) * c(10, 100)`, then run it.

```r title="Exercise: Predict recycled product"
# guess first
c(1, 2, 3, 4) * c(10, 100)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Recycled product solution"
c(1, 2, 3, 4) * c(10, 100)
#> [1]  10 200  30 400
```

The length-2 vector `c(10, 100)` recycles twice to become `c(10, 100, 10, 100)` and is then multiplied element-wise against `c(1, 2, 3, 4)`. Because the longer length (4) is a clean multiple of the shorter length (2), R does the recycling silently, no warning.
</details>

## How do you create sequences and repeat vectors?

Typing out long vectors by hand is painful. R gives you three tools to generate them: the `:` operator for integer ranges, `seq()` for custom spacing, and `rep()` for repetition. These three cover 95% of the "I need a vector of N things" cases.

```r title="Sequences with seq and rep"
1:10
#>  [1]  1  2  3  4  5  6  7  8  9 10

seq(0, 1, by = 0.25)
#> [1] 0.00 0.25 0.50 0.75 1.00

seq(0, 1, length.out = 5)
#> [1] 0.00 0.25 0.50 0.75 1.00

rep("yes", 4)
#> [1] "yes" "yes" "yes" "yes"

rep(c("a", "b"), times = 3)
#> [1] "a" "b" "a" "b" "a" "b"

rep(c("a", "b"), each = 3)
#> [1] "a" "a" "a" "b" "b" "b"
```

Notice the difference between `times` and `each` in `rep()`, `times` repeats the whole vector, while `each` repeats each element in place. You'll use `each` constantly when building factors for grouped analyses.

> [TIP]
> Prefer `seq_len(n)` over `1:n` when `n` might be zero. If `n = 0`, `1:n` gives you `c(1, 0)` (a gotcha), but `seq_len(0)` correctly returns an empty integer vector.

**Try it:** Use `seq()` to make 7 evenly-spaced numbers between -1 and 1.

```r title="Exercise: Seven evenly spaced values"
# use length.out
seq(-1, 1, length.out = 7)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Seven spaced values solution"
seq(-1, 1, length.out = 7)
#> [1] -1.0000000 -0.6666667 -0.3333333  0.0000000  0.3333333  0.6666667  1.0000000
```

`length.out = 7` tells `seq()` how many points you want and lets it compute the spacing, here `2 / 6 ≈ 0.333`. Use `length.out` when you care about the count (plotting grids, bins), and `by =` when you care about the step size.
</details>

## How do you modify vectors in place?

You can update any element, or a whole slice, by assigning into an index. The same four indexing modes from earlier all work on the left-hand side of `<-`.

```r title="Modify vectors by index"
grades <- c(72, 85, 91, 68, 77)
grades[4] <- 95
grades
#> [1] 72 85 91 95 77

grades[grades < 80] <- 80
grades
#> [1] 80 85 91 95 80

grades[6] <- 100
grades
#> [1]  80  85  91  95  80 100
```

Three things worth noting. First, logical-index assignment (`grades[grades < 80] <- 80`) is a one-line way to floor values, no loop needed. Second, assigning past the end of a vector automatically grows it. Third, R makes a copy under the hood on most modifications, so there's no "aliasing" issue like you'd see in Python lists.

**Try it:** Set all negative values in `v` to zero using logical-index assignment.

```r title="Exercise: Replace negatives with zero"
ex_v <- c(3, -1, 4, -2, 5)
# replace negatives with 0

```

<details>
<summary>Click to reveal solution</summary>

```r title="Replace negatives solution"
ex_v <- c(3, -1, 4, -2, 5)
ex_v[ex_v < 0] <- 0
ex_v
#> [1] 3 0 4 0 5
```

Putting the logical expression on the left of `<-` targets only the positions where it's `TRUE`, and the scalar `0` is recycled into each selected slot. That's the idiomatic way to floor values, no loop, no `ifelse`, just a single assignment.
</details>

## Practice Exercises

Three capstones that combine everything above.

### Exercise 1: Grade curve

You have 10 exam scores. Students below 60 get curved up to 60. Students at or above 90 get a 5-point bonus (capped at 100). Everyone else stays the same.

```r title="Exercise 1: Curve exam scores"
scores <- c(45, 72, 88, 91, 55, 67, 94, 78, 82, 99)
# your code here
```

<details>
<summary>Show solution</summary>

```r title="Curve exam scores solution"
curved <- scores
curved[curved < 60] <- 60
curved[curved >= 90] <- pmin(curved[curved >= 90] + 5, 100)
curved
#> [1]  60  72  88  96  60  67  99  78  82 100
```
</details>

### Exercise 2: Temperature outliers

Given hourly temperatures for a day, return the hours (1-24) more than one standard deviation from the mean.

```r title="Exercise 2: Find outlier hours"
temps <- c(12, 13, 14, 15, 18, 22, 25, 28, 30, 32, 33, 34,
           35, 34, 32, 29, 26, 22, 19, 17, 15, 14, 13, 12)
# return the hour numbers that are outliers
```

<details>
<summary>Show solution</summary>

```r title="Outlier hours solution"
hours <- 1:24
outlier_hours <- hours[abs(temps - mean(temps)) > sd(temps)]
outlier_hours
#> [1]  1  2  3  4 11 12 13 14 15 23 24
```
</details>

### Exercise 3: Discounted prices with recycling

You have 8 product prices. Apply a repeating discount pattern of 10%, 15%, 20%, 25% and return the final prices.

```r title="Exercise 3: Recycled discount pattern"
prices <- c(100, 200, 150, 300, 250, 180, 120, 90)
discounts <- c(0.10, 0.15, 0.20, 0.25)
# use recycling
```

<details>
<summary>Show solution</summary>

```r title="Recycled discount solution"
final_prices <- prices * (1 - discounts)
final_prices
#> [1]  90.0 170.0 120.0 225.0 225.0 153.0  96.0  67.5
```
</details>

## Putting It All Together

A realistic workflow: a month of daily sales. Find which days beat the average, flag slow days, and report summary stats, all without a single loop.

```r title="End-to-end daily sales workflow"
day <- 1:30
sales <- c(420, 380, 510, 495, 610, 720, 680,
           450, 390, 440, 520, 560, 640, 700,
           500, 430, 460, 510, 580, 650, 690,
           480, 420, 450, 530, 590, 660, 710, 500, 440)
names(sales) <- paste0("d", day)

avg <- mean(sales)
avg
#> [1] 534.1667

strong_days <- sales[sales > avg]
length(strong_days)
#> [1] 14

head(strong_days, 3)
#>  d3  d5  d6 
#> 610 720 680

slow <- sales < 0.8 * avg
day[slow]
#> [1]  9
```

We named each element (`d1`, `d2`, ...), used logical indexing to filter strong days, then combined a logical vector with positional indexing on `day` to pick out slow days. Every step is a single vectorized expression.

## Summary

| Concept | Key idea |
|---------|----------|
| Create | `c(1, 2, 3)` combines values; scalars are length-1 vectors |
| Type rule | All elements share one type; mixing coerces to the most flexible type |
| Indexing | Positive, negative, logical, and named, all use `[` |
| Vectorization | Operators and functions apply element-wise, fast and loop-free |
| Recycling | Shorter vector repeats to match the longer one; warns if not a clean multiple |
| Sequences | `1:n`, `seq()`, and `rep()` generate structured vectors |
| In-place update | Assign into any index or slice; vectors grow if you write past the end |

## References

1. [R Language Definition, Vectors](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Vector-objects), official documentation on vector types and storage.
2. [An Introduction to R, Simple manipulations](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Simple-manipulations-numbers-and-vectors), the canonical introduction to vectors.
3. [Advanced R, Subsetting](https://adv-r.hadley.nz/subsetting.html) by Hadley Wickham, deep dive on `[`, `[[`, and `$`.
4. [R for Data Science](https://r4ds.hadley.nz/), practical vector workflows for data analysis.
5. [R Inferno, Growing objects](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf) by Patrick Burns, the classic warning about growing vectors in loops.

## Continue Learning

- [R Data Types: Which Type Is Your Variable?](R-Data-Types.html), understand the six types that vectors can hold and when R coerces between them.
- [R Operators: Arithmetic, Logical, and Comparison](R-Operators.html), the operators that work vectorially across vectors.
- [R Control Flow: if, else, and switch](R-Control-Flow.html), learn when you still need explicit logic and when vectorization replaces it.
