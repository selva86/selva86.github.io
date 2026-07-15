---
title: "Base R Speed Round: 50 Rapid Drills"
slug: "Base-R-Speed-Round"
description: "Base R practice with 50 rapid one-liner drills: vectors, subsetting, the apply family, strings, factors, matrices, and dates, each with a hidden worked solution."
keywords: "base R practice, R one liner exercises, base r drills, apply family in r, base r subsetting, base r string functions"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Base R Speed Round"
sidebar_order: 105
fr_parent: "R-Data-Types.html"
auto_link_terms: "base r practice|base r exercises|base r drills|base r one liners"
auto_link_case_sensitive: false
target_keyword: "base R practice"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Base R Speed Round: 50 Rapid Drills

<p class="lead">Fifty short base R drills built for speed: vectors and recycling, subsetting, sorting, the apply family, strings, factors, matrices, and date arithmetic. Each one is a one-liner a fluent R user should dispatch in under a minute, and every solution is hidden behind a reveal so you can attempt first and then check.</p>

No packages, no data files, no setup beyond a fresh console. A fluent base R vocabulary is what lets you move fast before you reach for the tidyverse, so treat every drill as a timed rep: read the task, type the answer, run it, then open the solution to confirm. Work top to bottom; each section climbs from a warm-up to a genuinely tricky idiom.

```r title="Run this once before any exercise"
# Base R only. A fresh R session already attaches everything these drills
# need, so you will not write a single library() call from start to finish.
options(digits = 7)
```

## Section 1. Vectors and recycling (5 problems)

### Exercise 1.1: Build a sequence with a fixed step

**Task:** Produce the five break points that split the unit interval into equal quarters, running from 0 to 1 in steps of one quarter. Save the resulting numeric vector to `ex_1_1`.

**Expected result:**

```
#> [1] 0.00 0.25 0.50 0.75 1.00
```

**Difficulty:** Beginner

[HINTS]
You want evenly spaced values defined by a fixed gap, not by a fixed count of points.
Use `seq()` with the `by` argument set to the step size.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- seq(0, 1, by = 0.25)
ex_1_1
#> [1] 0.00 0.25 0.50 0.75 1.00
```

**Explanation:** `seq()` with `by` fixes the step size and lets the length fall out of the range. Passing `length.out = 5` instead would give the same vector by fixing the count rather than the gap. For plain integer runs the `from:to` colon operator is shorter, but `by` is the tool whenever the increment is not 1.

</details>

### Exercise 1.2: Add two vectors of different lengths

**Task:** Recycling kicks in when two vectors differ in length. Add the vector `c(1, 2, 3, 4, 5, 6)` to the shorter vector `c(10, 100)`, which repeats to match, and save the recycled sum to `ex_1_2`.

**Expected result:**

```
#> [1]  11 102  13 104  15 106
```

**Difficulty:** Intermediate

[HINTS]
The shorter vector is reused from the start as many times as needed to cover the longer one.
Just add the two vectors with `+`; R recycles automatically because 6 is a multiple of 2.

```r title="Your turn"
ex_1_2 <- c(1, 2, 3, 4, 5, 6) + c(10, 100)
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- c(1, 2, 3, 4, 5, 6) + c(10, 100)
ex_1_2
#> [1]  11 102  13 104  15 106
```

**Explanation:** The two-element vector recycles to `c(10, 100, 10, 100, 10, 100)` before the elementwise addition. Recycling is silent only when the longer length is an exact multiple of the shorter; otherwise R still recycles but warns about the partial reuse. Leaning on recycling deliberately is idiomatic, but an accidental length mismatch is a classic silent bug.

</details>

### Exercise 1.3: Repeat elements block by block

**Task:** Take the two labels `"lo"` and `"hi"` and repeat each of them three times in place, so all the `"lo"` values come before the `"hi"` values, then save the six-element character vector to `ex_1_3`.

**Expected result:**

```
#> [1] "lo" "lo" "lo" "hi" "hi" "hi"
```

**Difficulty:** Intermediate

[HINTS]
There are two repeat styles: one repeats the whole vector, the other repeats each element in turn.
Use `rep()` with the `each` argument rather than `times`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- rep(c("lo", "hi"), each = 3)
ex_1_3
#> [1] "lo" "lo" "lo" "hi" "hi" "hi"
```

**Explanation:** `each = 3` repeats every element three times before moving on, giving blocks; `times = 3` would instead cycle the whole vector three times, giving `lo hi lo hi lo hi`. Knowing which argument produces which layout is the whole point, and `rep()` also accepts a vector for `times` to repeat each element a different number of times.

</details>

### Exercise 1.4: Flip signs with a length-two recycler

**Task:** Use recycling to alternate the signs of the numbers 1 through 6, leaving the odd positions positive and negating the even positions, then save the alternating-sign vector to `ex_1_4`.

**Expected result:**

```
#> [1]  1 -2  3 -4  5 -6
```

**Difficulty:** Intermediate

[HINTS]
Multiplying by a repeating pattern of plus one and minus one flips every other element.
Multiply `1:6` by the two-element vector `c(1, -1)` and let recycling apply the pattern.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- (1:6) * c(1, -1)
ex_1_4
#> [1]  1 -2  3 -4  5 -6
```

**Explanation:** The multiplier `c(1, -1)` recycles across all six positions, so every even index is multiplied by minus one. This pattern-multiplication trick is a compact way to build alternating series without a loop or an `ifelse()`. The same idea powers alternating-row shading and sign-flipping in series expansions where a `(-1)^k` term appears.

</details>

### Exercise 1.5: Space five points evenly across a range

**Task:** You need exactly five values spread evenly from 10 up to 100 inclusive, with the endpoints included. Ask for a fixed count of points rather than a fixed step, and save the resulting vector to `ex_1_5`.

**Expected result:**

```
#> [1]  10.0  32.5  55.0  77.5 100.0
```

**Difficulty:** Intermediate

[HINTS]
When you know how many points you want but not the gap, fix the count and let R compute the spacing.
Use `seq()` with `length.out = 5`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- seq(10, 100, length.out = 5)
ex_1_5
#> [1]  10.0  32.5  55.0  77.5 100.0
```

**Explanation:** `length.out` guarantees the vector length and divides the range into equal gaps, here 22.5 apart. This is the counterpart to Exercise 1.1: use `by` when the step matters and `length.out` when the number of points matters. It is the standard way to build an evenly spaced grid for plotting a curve or defining axis breaks.

</details>

## Section 2. Indexing and subsetting (5 problems)

### Exercise 2.1: Pull elements by position

**Task:** Given the vector `x <- c(5, 10, 15, 20, 25)`, extract only the second and fourth elements using a single positional index, and save the two selected values to `ex_2_1`.

**Expected result:**

```
#> [1] 10 20
```

**Difficulty:** Beginner

[HINTS]
Positive integers inside the square brackets pick the elements at those positions.
Index with a vector of positions: `x[c(2, 4)]`.

```r title="Your turn"
x <- c(5, 10, 15, 20, 25)
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- c(5, 10, 15, 20, 25)
ex_2_1 <- x[c(2, 4)]
ex_2_1
#> [1] 10 20
```

**Explanation:** Passing a vector of positive positions returns those elements in the order you list them, so `x[c(4, 2)]` would return `20 10` instead. Positional indexing is the most basic of R's four subsetting styles (positive, negative, logical, and by name), and the others in this section build on it.

</details>

### Exercise 2.2: Drop the first and last elements

**Task:** Starting from the sequence `x <- 1:10`, remove both the first and the last element in one expression using negative indexing, so only the middle eight numbers remain, and save them to `ex_2_2`.

**Expected result:**

```
#> [1] 2 3 4 5 6 7 8 9
```

**Difficulty:** Intermediate

[HINTS]
Negative positions mean "everything except these" rather than "these".
Use `x[-c(1, length(x))]` so it works no matter how long the vector is.

```r title="Your turn"
x <- 1:10
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 1:10
ex_2_2 <- x[-c(1, length(x))]
ex_2_2
#> [1] 2 3 4 5 6 7 8 9
```

**Explanation:** Negative indices exclude the named positions, and using `length(x)` for the last one keeps the code general instead of hard-coding `10`. You cannot mix positive and negative indices in the same bracket; R raises an error if you try. This trim-the-ends pattern is common when stripping header and footer rows from a raw import.

</details>

### Exercise 2.3: Keep values above the mean

**Task:** From the vector `v <- c(3, 7, 2, 9, 5)`, keep only the elements that are strictly greater than the vector's own mean, using a logical condition inside the brackets, and save the surviving values to `ex_2_3`.

**Expected result:**

```
#> [1] 7 9
```

**Difficulty:** Intermediate

[HINTS]
A comparison builds a TRUE/FALSE mask the same length as the vector, and indexing keeps the TRUE positions.
Index with the condition itself: `v[v > mean(v)]`.

```r title="Your turn"
v <- c(3, 7, 2, 9, 5)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
v <- c(3, 7, 2, 9, 5)
ex_2_3 <- v[v > mean(v)]
ex_2_3
#> [1] 7 9
```

**Explanation:** The comparison `v > mean(v)` (the mean is 5.2 here) returns a logical vector, and subsetting keeps every position that is TRUE. Logical subsetting is the workhorse of base R filtering and scales to data frames as `df[df$col > k, ]`. Beware that any `NA` in `v` produces an `NA` in the mask, which selects an unwanted `NA` row unless you guard with `!is.na()`.

</details>

### Exercise 2.4: Select and reorder by name

**Task:** Given the named vector `scores <- c(alice = 90, bob = 75, cara = 88)`, return just Cara's and Alice's scores in that order by indexing with their names rather than positions, and save the result to `ex_2_4`.

**Expected result:**

```
#>  cara alice 
#>    88    90 
```

**Difficulty:** Intermediate

[HINTS]
A character vector inside the brackets looks elements up by their names.
Index with `scores[c("cara", "alice")]`, and the order you list the names is the order you get back.

```r title="Your turn"
scores <- c(alice = 90, bob = 75, cara = 88)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- c(alice = 90, bob = 75, cara = 88)
ex_2_4 <- scores[c("cara", "alice")]
ex_2_4
#>  cara alice 
#>    88    90 
```

**Explanation:** Name-based indexing returns elements in the order requested and carries the names along, which makes it safer than positions when the underlying order might change. A name that does not exist returns `NA` with an `NA` name rather than an error, so a typo fails quietly. This is the vector version of selecting columns by name from a data frame.

</details>

### Exercise 2.5: Replace negatives in place

**Task:** In the vector `v <- c(-2, 5, -1, 8, -3)`, floor every negative value at zero by assigning into a logical subset, leaving the non-negative values untouched, and save the cleaned vector to `ex_2_5`.

**Expected result:**

```
#> [1] 0 5 0 8 0
```

**Difficulty:** Advanced

[HINTS]
You can assign a value into the selected positions, not just read from them.
Select the negatives with `v[v < 0]` and assign `0` to that subset.

```r title="Your turn"
v <- c(-2, 5, -1, 8, -3)
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
v <- c(-2, 5, -1, 8, -3)
v[v < 0] <- 0
ex_2_5 <- v
ex_2_5
#> [1] 0 5 0 8 0
```

**Explanation:** Subset assignment writes only into the positions the mask selects, so the single scalar `0` recycles across every negative slot. This is the base R way to clip or winsorize values without rebuilding the vector, and it modifies `v` in place. The vectorized alternative `ifelse(v < 0, 0, v)` returns a new vector instead of mutating the original.

</details>

## Section 3. Sorting, ordering, and ranking (5 problems)

### Exercise 3.1: Sort a vector descending

**Task:** Take the unsorted vector `c(4, 1, 3, 2)` and return its values arranged from largest to smallest in a single call, without reversing afterwards, and save the sorted vector to `ex_3_1`.

**Expected result:**

```
#> [1] 4 3 2 1
```

**Difficulty:** Beginner

[HINTS]
Sorting has a built-in switch to go high-to-low instead of the default low-to-high.
Use `sort()` with `decreasing = TRUE`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- sort(c(4, 1, 3, 2), decreasing = TRUE)
ex_3_1
#> [1] 4 3 2 1
```

**Explanation:** `sort()` returns the values themselves in order, and `decreasing = TRUE` avoids the clumsier `rev(sort(x))`. A key detail is that `sort()` drops `NA` values by default; pass `na.last = TRUE` to keep them. When you need the positions that would sort the vector rather than the sorted values, reach for `order()` instead, as the next drill shows.

</details>

### Exercise 3.2: Get the ordering positions

**Task:** For the vector `c(20, 10, 30)`, return the index positions that would arrange its values in ascending order, rather than the sorted values themselves, and save that index vector to `ex_3_2`.

**Expected result:**

```
#> [1] 2 1 3
```

**Difficulty:** Intermediate

[HINTS]
This function answers "which element goes first, second, third" as a vector of positions.
Use `order()`, which returns indices you can feed back into the bracket.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- order(c(20, 10, 30))
ex_3_2
#> [1] 2 1 3
```

**Explanation:** `order()` returns the positions in the order they should be visited, so `x[order(x)]` reproduces `sort(x)`. Its real power is reordering one object by another: you can sort a whole data frame by a column with `df[order(df$col), ]`. It also accepts multiple vectors for tie-breaking, sorting by the first then the second, which `sort()` cannot do.

</details>

### Exercise 3.3: Rank values with tied averages

**Task:** Compute the ascending rank of each element in `c(10, 30, 20, 30)`, letting the two tied thirties share the average of the ranks they would otherwise occupy, and save the rank vector to `ex_3_3`.

**Expected result:**

```
#> [1] 1.0 3.5 2.0 3.5
```

**Difficulty:** Intermediate

[HINTS]
Ranking assigns each value its position in sorted order, and ties get a shared fractional rank by default.
Use `rank()`; its default tie method averages the tied positions.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- rank(c(10, 30, 20, 30))
ex_3_3
#> [1] 1.0 3.5 2.0 3.5
```

**Explanation:** The two thirties would take ranks 3 and 4, so the default `ties.method = "average"` gives both 3.5. This averaged rank is exactly what a Spearman correlation or a Wilcoxon test uses under the hood. If you need distinct integer ranks instead, pass `ties.method = "first"` to break ties by original position, or `"min"` for competition-style ranking.

</details>

### Exercise 3.4: Order a data frame by a column

**Task:** Build the data frame `df <- data.frame(name = c("a", "b", "c"), score = c(88, 95, 72))` and return its rows sorted by `score` from highest to lowest, keeping all columns, then save the reordered frame to `ex_3_4`.

**Expected result:**

```
#>   name score
#> 2    b    95
#> 1    a    88
#> 3    c    72
```

**Difficulty:** Intermediate

[HINTS]
Ordering the row index and using it before the comma reorders the whole frame.
Compute `order(df$score, decreasing = TRUE)` and use it as the row selector `df[..., ]`.

```r title="Your turn"
df <- data.frame(name = c("a", "b", "c"), score = c(88, 95, 72))
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- data.frame(name = c("a", "b", "c"), score = c(88, 95, 72))
ex_3_4 <- df[order(df$score, decreasing = TRUE), ]
ex_3_4
#>   name score
#> 2    b    95
#> 1    a    88
#> 3    c    72
```

**Explanation:** `order()` returns the row positions in sorted order and the comma in `df[rows, ]` applies them to every column at once, keeping each row intact. The original row names (2, 1, 3) travel with the rows, which is a useful trace of where each came from; add `row.names = NULL` or reset them if you want a clean 1-to-n index. This is the base R equivalent of `dplyr::arrange()`.

</details>

### Exercise 3.5: Take the three largest values

**Task:** From the vector `x <- c(50, 20, 90, 10, 70)`, return only its three largest values in descending order by combining an ordering with a positional slice, and save the top three to `ex_3_5`.

**Expected result:**

```
#> [1] 90 70 50
```

**Difficulty:** Advanced

[HINTS]
First get the positions that sort the vector high-to-low, then keep only the first three of those.
Chain `x[order(x, decreasing = TRUE)]` with `[1:3]`.

```r title="Your turn"
x <- c(50, 20, 90, 10, 70)
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- c(50, 20, 90, 10, 70)
ex_3_5 <- x[order(x, decreasing = TRUE)][1:3]
ex_3_5
#> [1] 90 70 50
```

**Explanation:** Ordering descending then slicing the first three is the base R "top-n" idiom, and it generalizes to data frames by ordering the rows and taking `[1:n, ]`. For very large vectors where you only need a few extremes, `sort(x, decreasing = TRUE)[1:3]` or the partial-sort argument `sort(x, partial = ...)` avoids fully sorting everything and runs faster.

</details>

## Section 4. The apply family (5 problems)

### Exercise 4.1: Sum each element of a list with sapply

**Task:** Given the list `list(a = 1:3, b = 4:6, c = 7:9)`, compute the sum of each element and let the result simplify to a single named numeric vector, then save that vector to `ex_4_1`.

**Expected result:**

```
#>  a  b  c 
#>  6 15 24 
```

**Difficulty:** Intermediate

[HINTS]
You want to apply one function across every list element and get back a simple vector, not a list.
Use `sapply()`, which simplifies the result and keeps the list names.

```r title="Your turn"
ex_4_1 <- sapply(list(a = 1:3, b = 4:6, c = 7:9), sum)
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- sapply(list(a = 1:3, b = 4:6, c = 7:9), sum)
ex_4_1
#>  a  b  c 
#>  6 15 24 
```

**Explanation:** `sapply()` is the simplifying cousin of `lapply()`: it walks each element, applies the function, and collapses the results to a vector or matrix when it can, carrying the names through. The convenience comes at a cost: if the per-element results have inconsistent shapes, `sapply()` silently falls back to a list, which is the pitfall the type-safe `vapply()` in Exercise 4.3 was built to fix.

</details>

### Exercise 4.2: Keep the list shape with lapply

**Task:** Multiply each of the integers 1, 2, and 3 by ten using a function applied over the sequence, but this time keep the output as a list rather than simplifying it, and save that list to `ex_4_2`.

**Expected result:**

```
#> [[1]]
#> [1] 10
#> 
#> [[2]]
#> [1] 20
#> 
#> [[3]]
#> [1] 30
```

**Difficulty:** Intermediate

[HINTS]
One member of the apply family always returns a list, no matter how simple each result is.
Use `lapply(1:3, function(i) i * 10)`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- lapply(1:3, function(i) i * 10)
ex_4_2
#> [[1]]
#> [1] 10
#> 
#> [[2]]
#> [1] 20
#> 
#> [[3]]
#> [1] 30
```

**Explanation:** `lapply()` always returns a list of the same length as its input, which is exactly what you want when the results might be data frames, models, or vectors of differing lengths that should not be forced into a matrix. It is the safe default for iteration; wrap it in `sapply()` or `unlist()` only when you are sure the pieces will simplify cleanly.

</details>

### Exercise 4.3: Enforce a return type with vapply

**Task:** Sum each element of the list `list(1:2, 3:4, 5:6)`, but use the type-safe member of the apply family that requires you to declare the shape of each result up front as a single number, and save the vector to `ex_4_3`.

**Expected result:**

```
#> [1]  3  7 11
```

**Difficulty:** Intermediate

[HINTS]
This function takes a template describing what each call must return, and errors if reality disagrees.
Use `vapply(x, sum, numeric(1))`, where `numeric(1)` promises one number per element.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- vapply(list(1:2, 3:4, 5:6), sum, numeric(1))
ex_4_3
#> [1]  3  7 11
```

**Explanation:** `vapply()` behaves like `sapply()` but demands a `FUN.VALUE` template, here `numeric(1)`, and throws an error the moment a call returns the wrong type or length. That fail-fast contract makes it the right choice inside functions and pipelines, where `sapply()` silently returning a list instead of a vector could break downstream code in confusing ways.

</details>

### Exercise 4.4: Group means with tapply

**Task:** Using the built-in `mtcars` dataset, compute the mean `mpg` within each level of the cylinder count `cyl`, producing one average per group of four, six, and eight cylinders, then save the named result to `ex_4_4`.

**Expected result:**

```
#>        4        6        8 
#> 26.66364 19.74286 15.10000 
```

**Difficulty:** Advanced

[HINTS]
You want a summary of one numeric vector split by the groups defined in another.
Use `tapply(mtcars$mpg, mtcars$cyl, mean)`: values first, grouping second, function third.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- tapply(mtcars$mpg, mtcars$cyl, mean)
ex_4_4
#>        4        6        8 
#> 26.66364 19.74286 15.10000 
```

**Explanation:** `tapply()` splits the first argument by the grouping factor and applies the function to each piece, returning a named result indexed by the group labels. It is the base R workhorse for group-wise summaries, the equivalent of a `dplyr::group_by()` plus `summarise()`. For summaries across several grouping variables at once you get a multi-dimensional array, and `aggregate()` offers a data-frame-shaped alternative.

</details>

### Exercise 4.5: Combine two vectors elementwise with mapply

**Task:** Multiply the vectors `1:4` and `5:8` position by position using the multivariate member of the apply family, so the first elements multiply together, the second elements together, and so on, then save the result to `ex_4_5`.

**Expected result:**

```
#> [1]  5 12 21 32
```

**Difficulty:** Advanced

[HINTS]
This function walks several vectors in parallel, passing one element from each into the function per step.
Use `mapply(function(a, b) a * b, 1:4, 5:8)`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- mapply(function(a, b) a * b, 1:4, 5:8)
ex_4_5
#> [1]  5 12 21 32
```

**Explanation:** `mapply()` is the multivariate apply: it iterates over its vector arguments in lockstep, supplying one element from each to the function on every step. Here plain `1:4 * 5:8` would do the same job faster, but `mapply()` earns its place when the per-pair operation is not itself vectorized, such as calling a function that takes two scalars and returns a computed object.

</details>

## Section 5. String operations (5 problems)

### Exercise 5.1: Build file names by pasting

**Task:** Construct the three file names `file1.txt`, `file2.txt`, and `file3.txt` by gluing the constant prefix, the numbers one through three, and the extension together with no separator, and save the character vector to `ex_5_1`.

**Expected result:**

```
#> [1] "file1.txt" "file2.txt" "file3.txt"
```

**Difficulty:** Beginner

[HINTS]
The zero-separator pasting function joins pieces directly and recycles the constant parts across the numbers.
Use `paste0("file", 1:3, ".txt")`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- paste0("file", 1:3, ".txt")
ex_5_1
#> [1] "file1.txt" "file2.txt" "file3.txt"
```

**Explanation:** `paste0()` is `paste()` with `sep = ""`, and it recycles the scalar `"file"` and `".txt"` against the length-three number vector to produce three strings. This vectorized gluing is how you generate batches of file paths, column names, or labels. When you instead want to collapse a vector into one string, use the `collapse` argument, as in `paste(x, collapse = ", ")`.

</details>

### Exercise 5.2: Format numbers as percentages

**Task:** Format the numbers `c(1.5, 23.456, 100)` as percentage strings, each shown to exactly two decimal places and followed by a percent sign, using C-style formatting, then save the character vector to `ex_5_2`.

**Expected result:**

```
#> [1] "1.50%"   "23.46%"  "100.00%"
```

**Difficulty:** Intermediate

[HINTS]
A printf-style template controls the decimals, and a doubled percent sign prints a literal percent.
Use `sprintf("%.2f%%", x)`, where `%.2f` fixes two decimals and `%%` is the literal sign.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- sprintf("%.2f%%", c(1.5, 23.456, 100))
ex_5_2
#> [1] "1.50%"   "23.46%"  "100.00%"
```

**Explanation:** `sprintf()` applies a C-style format template to each element, so `%.2f` forces two decimal places (padding 1.5 to 1.50 and rounding 23.456 to 23.46) and `%%` escapes the percent sign. It is the tool of choice when you need aligned, fixed-width, or zero-padded output that `paste()` and `round()` cannot produce, such as `sprintf("%03d", 7)` giving `"007"`.

</details>

### Exercise 5.3: Extract a substring by position

**Task:** From the strings `c("abcdef", "ghijkl")`, pull out the characters from position two to position four of each, giving two three-letter substrings, and save the result to `ex_5_3`.

**Expected result:**

```
#> [1] "bcd" "hij"
```

**Difficulty:** Intermediate

[HINTS]
You need a function that takes a start and a stop character position and is vectorized over the input.
Use `substr(x, 2, 4)`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- substr(c("abcdef", "ghijkl"), 2, 4)
ex_5_3
#> [1] "bcd" "hij"
```

**Explanation:** `substr()` extracts characters between the given start and stop positions and is vectorized, so it applies to every string at once. It also works on the left of an assignment to overwrite that slice in place, as in `substr(x, 1, 1) <- "X"`. When the number of pieces varies by string, reach for `strsplit()` or `regmatches()` instead of fixed positions.

</details>

### Exercise 5.4: Combine toupper and nchar

**Task:** For the words `c("apple", "fig")`, build a vector whose values are each word's character count and whose names are the words converted to uppercase, then save that named integer vector to `ex_5_4`.

**Expected result:**

```
#> APPLE   FIG 
#>     5     3 
```

**Difficulty:** Intermediate

[HINTS]
One function counts the characters in each string; another shifts letters to uppercase for the names.
Wrap `nchar(x)` in `setNames()` with names given by `toupper(x)`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- setNames(nchar(c("apple", "fig")), toupper(c("apple", "fig")))
ex_5_4
#> APPLE   FIG 
#>     5     3 
```

**Explanation:** `nchar()` returns the length of each string and `toupper()` maps letters to their capitals, both vectorized character utilities. `setNames()` is a compact way to attach names to a vector in one expression without a separate `names(x) <-` line. Its lowercase partner `tolower()`, and `trimws()` for stripping surrounding whitespace, round out the everyday base R string toolkit.

</details>

### Exercise 5.5: Clean then split a delimited string

**Task:** Take the messy string `"a; b; c"`, remove all the spaces with a fixed (non-regex) replacement, then split what remains on the semicolon into its three parts, and save the resulting list to `ex_5_5`.

**Expected result:**

```
#> [[1]]
#> [1] "a" "b" "c"
```

**Difficulty:** Advanced

[HINTS]
Do it in two literal steps: strip the spaces, then break the string at each delimiter.
Nest `gsub(" ", "", s, fixed = TRUE)` inside `strsplit(..., ";", fixed = TRUE)`.

```r title="Your turn"
s <- "a; b; c"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s <- "a; b; c"
ex_5_5 <- strsplit(gsub(" ", "", s, fixed = TRUE), ";", fixed = TRUE)
ex_5_5
#> [[1]]
#> [1] "a" "b" "c"
```

**Explanation:** `gsub()` with `fixed = TRUE` treats the pattern as a literal string rather than a regular expression, which is safer and faster when you are matching plain characters like a space. `strsplit()` returns a list with one character vector per input string, so a single string yields a length-one list; add `[[1]]` to pull the vector straight out. Using `fixed = TRUE` throughout sidesteps every regex metacharacter surprise.

</details>

## Section 6. Factors and tables (5 problems)

### Exercise 6.1: Read the levels of a factor

**Task:** Turn the character vector `c("b", "a", "b", "c", "a")` into a factor and report its levels, which base R stores in sorted order regardless of first appearance, then save the level labels to `ex_6_1`.

**Expected result:**

```
#> [1] "a" "b" "c"
```

**Difficulty:** Beginner

[HINTS]
Making a factor assigns each distinct value a level; a dedicated accessor returns those labels.
Wrap the vector in `factor()` and call `levels()` on the result.

```r title="Your turn"
f <- factor(c("b", "a", "b", "c", "a"))
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- factor(c("b", "a", "b", "c", "a"))
ex_6_1 <- levels(f)
ex_6_1
#> [1] "a" "b" "c"
```

**Explanation:** `factor()` records the distinct values as levels in alphabetical order by default, which is why the result is `a b c` rather than the first-seen order `b a c`. Levels drive how models build contrasts and how plots order categories, so controlling them with the `levels` argument matters. `nlevels()` counts them and `levels(f) <- ...` renames them in place.

</details>

### Exercise 6.2: Count values with table

**Task:** Tabulate how many times each distinct value appears in the vector `c("x", "y", "x", "x", "z", "y")`, producing a labelled count for every category, and save the resulting one-dimensional table to `ex_6_2`.

**Expected result:**

```
#> 
#> x y z 
#> 3 2 1 
```

**Difficulty:** Intermediate

[HINTS]
One function turns a vector into a frequency count keyed by the distinct values.
Call `table()` on the vector.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- table(c("x", "y", "x", "x", "z", "y"))
ex_6_2
#> 
#> x y z 
#> 3 2 1 
```

**Explanation:** `table()` builds a contingency count of each unique value, and the blank first line is the empty name of the (unnamed) dimension. The result is not a plain vector but a `table` object, which you can feed to `prop.table()` for proportions or `barplot()` to chart. Passing two vectors produces a cross-tabulation, the two-way version explored in the next drill.

</details>

### Exercise 6.3: Map ordered levels to integer codes

**Task:** Create a factor from `c("low", "high", "med")` with the levels explicitly ordered as low, then med, then high, and convert it to the underlying integer codes those levels imply, saving the integer vector to `ex_6_3`.

**Expected result:**

```
#> [1] 1 3 2
```

**Difficulty:** Intermediate

[HINTS]
Supply the `levels` argument yourself so the codes follow your intended order, not alphabetical order.
Build the factor with `levels = c("low", "med", "high")`, then apply `as.integer()`.

```r title="Your turn"
f <- factor(c("low", "high", "med"), levels = c("low", "med", "high"))
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- factor(c("low", "high", "med"), levels = c("low", "med", "high"))
ex_6_3 <- as.integer(f)
ex_6_3
#> [1] 1 3 2
```

**Explanation:** A factor stores integer codes pointing into its `levels`, so setting the level order deliberately makes `as.integer()` return meaningful ranks: low is 1, med is 2, high is 3. The classic trap is `as.numeric(factor_of_numbers)`, which returns the codes rather than the original numbers; the safe route there is `as.numeric(as.character(f))`. Add `ordered = TRUE` when the levels have a true ranking you want comparisons to respect.

</details>

### Exercise 6.4: Cross-tabulate two variables

**Task:** Using `mtcars`, build a two-way frequency table of cylinder count `cyl` against transmission type `am`, giving the labels `cyl` and `am` to the two dimensions, then save the cross-tabulation to `ex_6_4`.

**Expected result:**

```
#>    am
#> cyl  0  1
#>   4  3  8
#>   6  4  3
#>   8 12  2
```

**Difficulty:** Intermediate

[HINTS]
Passing two named vectors to the tabulation function labels the rows and columns of the grid.
Call `table(cyl = mtcars$cyl, am = mtcars$am)`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- table(cyl = mtcars$cyl, am = mtcars$am)
ex_6_4
#>    am
#> cyl  0  1
#>   4  3  8
#>   6  4  3
#>   8 12  2
```

**Explanation:** Naming the arguments `cyl` and `am` labels the table's dimensions, turning a bare grid into a readable cross-tab: rows are cylinder counts, columns are transmission types. This joint count is the starting point for a chi-squared test of association via `chisq.test()`, and `addmargins()` appends row and column totals. It reads far better than the unnamed version, whose dimensions print blank.

</details>

### Exercise 6.5: Drop an unused factor level

**Task:** Start from the factor `factor(c("a", "b", "c", "a"))`, remove every row equal to `"c"`, and then strip the now-unused level so only the levels that still occur remain, saving those remaining levels to `ex_6_5`.

**Expected result:**

```
#> [1] "a" "b"
```

**Difficulty:** Advanced

[HINTS]
Subsetting a factor keeps every original level even when no rows use it anymore, so you must prune explicitly.
After filtering out `"c"`, call `droplevels()` and read its `levels()`.

```r title="Your turn"
f <- factor(c("a", "b", "c", "a"))
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- factor(c("a", "b", "c", "a"))
sub <- f[f != "c"]
ex_6_5 <- levels(droplevels(sub))
ex_6_5
#> [1] "a" "b"
```

**Explanation:** Filtering a factor with `f[f != "c"]` removes the rows but leaves `"c"` in the level set, which can produce empty groups in tables, ghost categories in legends, and phantom contrast columns in models. `droplevels()` rebuilds the factor keeping only the levels that still appear. This cleanup is a routine step after subsetting a data frame that carried more categories than the subset actually uses.

</details>

## Section 7. Lists and coercion (5 problems)

### Exercise 7.1: Pull a named element from a list

**Task:** Given the mixed list `list(a = 1, b = "two", c = TRUE)`, extract the value stored under the name `b` using the dollar-sign accessor, returning the single string it holds, and save it to `ex_7_1`.

**Expected result:**

```
#> [1] "two"
```

**Difficulty:** Beginner

[HINTS]
Lists can hold different types at once, and one operator reaches a single named element directly.
Access it with `lst$b`.

```r title="Your turn"
lst <- list(a = 1, b = "two", c = TRUE)
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lst <- list(a = 1, b = "two", c = TRUE)
ex_7_1 <- lst$b
ex_7_1
#> [1] "two"
```

**Explanation:** The `$` operator returns the single element itself, the same as `lst[["b"]]`, whereas single brackets `lst["b"]` would return a one-element list instead of the value. That distinction (double bracket to drill in, single bracket to keep the list wrapper) is one of the most important habits in base R. Lists are the general container that holds elements of any type and length.

</details>

### Exercise 7.2: Flatten a list into a vector

**Task:** Collapse the list `list(1:2, 3:4, 5)` into a single flat numeric vector containing all five values in order, discarding the list structure, and save the flattened vector to `ex_7_2`.

**Expected result:**

```
#> [1] 1 2 3 4 5
```

**Difficulty:** Intermediate

[HINTS]
One function walks a list and concatenates all the atomic pieces into one vector.
Use `unlist()`.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- unlist(list(1:2, 3:4, 5))
ex_7_2
#> [1] 1 2 3 4 5
```

**Explanation:** `unlist()` recursively flattens a list into an atomic vector, applying the usual coercion rules if the pieces have different types. It is the natural way to turn an `lapply()` result back into a plain vector when every element is a scalar. Watch out that it also flattens names into a concatenated form, so pass `use.names = FALSE` when you want a clean unnamed vector.

</details>

### Exercise 7.3: Watch character coercion take over

**Task:** Combine the number `1`, the string `"a"`, and the logical `TRUE` into a single vector with `c()`, observe how R coerces every element to one common type, and save the resulting character vector to `ex_7_3`.

**Expected result:**

```
#> [1] "1"    "a"    "TRUE"
```

**Difficulty:** Intermediate

[HINTS]
An atomic vector can hold only one type, so R promotes everything to the most flexible one present.
Just build `c(1, "a", TRUE)` and inspect the quoted result.

```r title="Your turn"
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_3 <- c(1, "a", TRUE)
ex_7_3
#> [1] "1"    "a"    "TRUE"
```

**Explanation:** Because a vector is atomic, `c()` coerces to the most general type present, and the hierarchy runs logical to integer to double to character. A single string drags the whole vector to character, turning `1` into `"1"` and `TRUE` into `"TRUE"`. This silent promotion is a frequent source of bugs when a stray text value sneaks into a numeric column; use a list if you genuinely need to keep mixed types.

</details>

### Exercise 7.4: Average a logical vector into a proportion

**Task:** Compute what fraction of the logical vector `c(TRUE, TRUE, FALSE, TRUE)` is TRUE by taking its mean directly, relying on TRUE coercing to one and FALSE to zero, then save the proportion to `ex_7_4`.

**Expected result:**

```
#> [1] 0.75
```

**Difficulty:** Intermediate

[HINTS]
When averaging meets a logical vector, TRUE becomes 1 and FALSE becomes 0, so the mean is a share.
Wrap the logical vector in `mean()`.

```r title="Your turn"
ex_7_4 <- # your code here
ex_7_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_4 <- mean(c(TRUE, TRUE, FALSE, TRUE))
ex_7_4
#> [1] 0.75
```

**Explanation:** Taking the mean of a logical vector coerces `TRUE` to 1 and `FALSE` to 0, so the average is exactly the proportion of TRUE values, here three out of four. This is the idiomatic base R way to get a rate, as in `mean(x > 0)` for the share of positive values, while `sum()` on the same vector would return the raw count of TRUEs instead.

</details>

### Exercise 7.5: Reach into a nested list

**Task:** Given the deeply nested list `list(x = list(y = list(z = 2024)))`, retrieve the value `2024` buried three levels down by chaining double-bracket accessors by name, and save the extracted number to `ex_7_5`.

**Expected result:**

```
#> [1] 2024
```

**Difficulty:** Advanced

[HINTS]
Each double-bracket step descends exactly one level into the structure.
Chain `lst[["x"]][["y"]][["z"]]`, or equivalently `lst$x$y$z`.

```r title="Your turn"
lst <- list(x = list(y = list(z = 2024)))
ex_7_5 <- # your code here
ex_7_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lst <- list(x = list(y = list(z = 2024)))
ex_7_5 <- lst[["x"]][["y"]][["z"]]
ex_7_5
#> [1] 2024
```

**Explanation:** Each `[["name"]]` descends one level, so chaining three of them walks down the nested structure to the leaf value. A shortcut is the recursive form `lst[[c("x", "y", "z")]]`, where a vector of names drills straight through. Nested lists are exactly the shape you get from parsed JSON, so this navigation pattern is essential when working with API responses in base R.

</details>

## Section 8. Matrices (5 problems)

### Exercise 8.1: Read the dimensions of a matrix

**Task:** Fill a matrix with the numbers 1 through 6 arranged into two rows, using the column-first default fill order, then report its dimensions as a length-two vector of rows and columns, saving that to `ex_8_1`.

**Expected result:**

```
#> [1] 2 3
```

**Difficulty:** Beginner

[HINTS]
Building the matrix fixes the shape; one accessor returns the row and column counts together.
Create it with `matrix(1:6, nrow = 2)` and call `dim()`.

```r title="Your turn"
m <- matrix(1:6, nrow = 2)
ex_8_1 <- # your code here
ex_8_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(1:6, nrow = 2)
ex_8_1 <- dim(m)
ex_8_1
#> [1] 2 3
```

**Explanation:** `matrix()` fills down columns by default, so two rows and six values imply three columns, and `dim()` reports rows then columns. Set `byrow = TRUE` to fill across rows instead, a frequent need when transcribing a table as written. `nrow()` and `ncol()` return the two counts individually if you only want one.

</details>

### Exercise 8.2: Sum across matrix rows

**Task:** For the matrix `matrix(1:6, nrow = 2)` filled by column, compute the total of each row, returning one sum per row as a length-two vector, and save the row sums to `ex_8_2`.

**Expected result:**

```
#> [1]  9 12
```

**Difficulty:** Intermediate

[HINTS]
A dedicated fast function totals each row without you writing a loop or an apply call.
Use `rowSums(m)`.

```r title="Your turn"
m <- matrix(1:6, nrow = 2)
ex_8_2 <- # your code here
ex_8_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(1:6, nrow = 2)
ex_8_2 <- rowSums(m)
ex_8_2
#> [1]  9 12
```

**Explanation:** With column-first filling, row 1 holds 1, 3, 5 (summing to 9) and row 2 holds 2, 4, 6 (summing to 12). `rowSums()` and its siblings `colSums()`, `rowMeans()`, and `colMeans()` are compiled C routines, so they run much faster than `apply(m, 1, sum)` and should be your default for these four common aggregations.

</details>

### Exercise 8.3: Transpose a matrix

**Task:** Take the two-by-three matrix `matrix(1:6, nrow = 2)` and flip its rows and columns to produce a three-by-two matrix, so element positions swap across the diagonal, then save the transposed matrix to `ex_8_3`.

**Expected result:**

```
#>      [,1] [,2]
#> [1,]    1    2
#> [2,]    3    4
#> [3,]    5    6
```

**Difficulty:** Intermediate

[HINTS]
A single one-letter function swaps the two axes of a matrix.
Apply `t()` to the matrix.

```r title="Your turn"
m <- matrix(1:6, nrow = 2)
ex_8_3 <- # your code here
ex_8_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(1:6, nrow = 2)
ex_8_3 <- t(m)
ex_8_3
#>      [,1] [,2]
#> [1,]    1    2
#> [2,]    3    4
#> [3,]    5    6
```

**Explanation:** `t()` transposes a matrix, turning rows into columns so a 2-by-3 becomes a 3-by-2. Transposition is fundamental in linear algebra and shows up whenever you need to align dimensions before a matrix product. Applied to a data frame `t()` coerces it to a matrix first, which silently forces every column to a common type, so use it carefully on mixed-type frames.

</details>

### Exercise 8.4: Multiply a matrix by a vector

**Task:** Multiply the two-by-three matrix `matrix(1:6, nrow = 2)` by the length-three column vector `c(1, 0, 2)` using true matrix multiplication rather than elementwise multiplication, and save the resulting two-by-one matrix to `ex_8_4`.

**Expected result:**

```
#>      [,1]
#> [1,]   11
#> [2,]   14
```

**Difficulty:** Advanced

[HINTS]
Ordinary star multiplication is elementwise; a different operator does the row-times-column dot products.
Use the `%*%` operator between the matrix and the vector.

```r title="Your turn"
m <- matrix(1:6, nrow = 2)
ex_8_4 <- # your code here
ex_8_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(1:6, nrow = 2)
ex_8_4 <- m %*% c(1, 0, 2)
ex_8_4
#>      [,1]
#> [1,]   11
#> [2,]   14
```

**Explanation:** `%*%` performs matrix multiplication, taking the dot product of each row with the vector: row 1 gives 1(1) + 3(0) + 5(2) = 11 and row 2 gives 2(1) + 4(0) + 6(2) = 14. The inner dimensions must match (three columns against a length-three vector) or R errors. This operation is the computational core of linear regression, where fitted values are a design matrix times a coefficient vector.

</details>

### Exercise 8.5: Take the maximum of each column

**Task:** For the matrix `matrix(1:6, nrow = 2)`, find the largest value in each of its three columns by applying the maximum function down the column margin, and save the three column maxima as a vector to `ex_8_5`.

**Expected result:**

```
#> [1] 2 4 6
```

**Difficulty:** Advanced

[HINTS]
The general iterator over a matrix takes a margin code: 1 walks rows, 2 walks columns.
Use `apply(m, 2, max)`, where the 2 means apply down each column.

```r title="Your turn"
m <- matrix(1:6, nrow = 2)
ex_8_5 <- # your code here
ex_8_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(1:6, nrow = 2)
ex_8_5 <- apply(m, 2, max)
ex_8_5
#> [1] 2 4 6
```

**Explanation:** `apply()` iterates over a chosen margin of a matrix, with `1` for rows and `2` for columns, applying the function to each slice. Here the column-wise maxima are 2, 4, and 6. Unlike the specialized `rowSums()` family, `apply()` works with any function, which is its strength; the trade-off is that it is slower, so prefer the dedicated helpers when they exist.

</details>

## Section 9. Dates (5 problems)

### Exercise 9.1: Count the days between two dates

**Task:** Subtract the date first of January 2024 from the date first of March 2024 to get the number of days between them, remembering that 2024 is a leap year, and save the resulting difference object to `ex_9_1`.

**Expected result:**

```
#> Time difference of 60 days
```

**Difficulty:** Beginner

[HINTS]
Parse both strings into real dates first; subtracting dates yields a difference measured in days.
Subtract `as.Date("2024-01-01")` from `as.Date("2024-03-01")`.

```r title="Your turn"
ex_9_1 <- # your code here
ex_9_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_9_1 <- as.Date("2024-03-01") - as.Date("2024-01-01")
ex_9_1
#> Time difference of 60 days
```

**Explanation:** `as.Date()` parses the ISO strings into Date objects, and subtracting two dates returns a `difftime` that prints its units, here 60 days (January's 31 plus February's 29 in the 2024 leap year). Wrap it in `as.numeric()` to get a bare number for arithmetic. The ISO `YYYY-MM-DD` format is parsed without a `format` argument because it is the base R default.

</details>

### Exercise 9.2: Add days to a date

**Task:** Advance the date first of January 2024 forward by thirty days using plain numeric addition on the parsed date, letting R roll into the correct calendar day, and save the resulting single date to `ex_9_2`.

**Expected result:**

```
#> [1] "2024-01-31"
```

**Difficulty:** Intermediate

[HINTS]
A Date is stored as a day count, so adding a plain number moves it forward that many days.
Add `30` to `as.Date("2024-01-01")`.

```r title="Your turn"
ex_9_2 <- # your code here
ex_9_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_9_2 <- as.Date("2024-01-01") + 30
ex_9_2
#> [1] "2024-01-31"
```

**Explanation:** A Date is internally the number of days since 1970-01-01, so adding an integer shifts it by that many days and handles month and year boundaries automatically. Thirty days after January 1st is January 31st. This is simpler than string surgery on the date parts, and it means you can build a whole run of dates with `as.Date("2024-01-01") + 0:29`.

</details>

### Exercise 9.3: Find the weekday of a date

**Task:** Determine which day of the week the date fifteenth of July 2024 falls on, returning the full English weekday name rather than a number, and save that name string to `ex_9_3`.

**Expected result:**

```
#> [1] "Monday"
```

**Difficulty:** Intermediate

[HINTS]
A dedicated function turns a date into its weekday name directly.
Apply `weekdays()` to `as.Date("2024-07-15")`.

```r title="Your turn"
ex_9_3 <- # your code here
ex_9_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_9_3 <- weekdays(as.Date("2024-07-15"))
ex_9_3
#> [1] "Monday"
```

**Explanation:** `weekdays()` extracts the day name from a Date, and its companion `months()` returns the month name. These are handy for grouping a time series by day of week or month without manually formatting strings. The exact spelling follows the session locale, so a non-English locale would return the localized name; `format(d, "%A")` is the equivalent via a format code.

</details>

### Exercise 9.4: Build a monthly date sequence

**Task:** Generate a sequence of four consecutive month-start dates beginning on the first of January 2024, stepping forward one month at a time, and save the vector of four dates to `ex_9_4`.

**Expected result:**

```
#> [1] "2024-01-01" "2024-02-01" "2024-03-01" "2024-04-01"
```

**Difficulty:** Intermediate

[HINTS]
The sequence generator understands calendar steps like "month" when its `by` argument is a string.
Call `seq()` with a start Date, `by = "month"`, and `length.out = 4`.

```r title="Your turn"
ex_9_4 <- # your code here
ex_9_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_9_4 <- seq(as.Date("2024-01-01"), by = "month", length.out = 4)
ex_9_4
#> [1] "2024-01-01" "2024-02-01" "2024-03-01" "2024-04-01"
```

**Explanation:** `seq()` dispatches on the Date class and accepts calendar-aware steps such as `"day"`, `"week"`, `"month"`, and `"year"`, so it advances by whole months even though months differ in length. This is the base R way to build a regular date axis for a report. Using `to = ` instead of `length.out = ` lets you run the sequence to a fixed end date.

</details>

### Exercise 9.5: Measure a date gap in weeks

**Task:** Express the gap between the first of January 2024 and the thirty-first of December 2024 in weeks rather than days, using the date-difference function with an explicit weeks unit, and save the resulting difftime to `ex_9_5`.

**Expected result:**

```
#> Time difference of 52.14286 weeks
```

**Difficulty:** Advanced

[HINTS]
The date-difference function takes a units argument so the answer comes back in weeks, not the default days.
Use `difftime(d2, d1, units = "weeks")` with the later date first.

```r title="Your turn"
ex_9_5 <- # your code here
ex_9_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_9_5 <- difftime(as.Date("2024-12-31"), as.Date("2024-01-01"), units = "weeks")
ex_9_5
#> Time difference of 52.14286 weeks
```

**Explanation:** `difftime()` computes the gap between two dates in whatever unit you name, so `units = "weeks"` divides the 365-day span (2024 is a leap year, but December 31st is one day short of a full year from January 1st) by seven to report 52.14286 weeks. Plain date subtraction always returns days, so `difftime()` is how you switch to weeks, hours, or minutes; wrap it in `floor(as.numeric(...))` when you want only the count of whole completed weeks.

</details>

## Section 10. Misc idioms (5 problems)

### Exercise 10.1: Find the position of the busiest day

**Task:** From the named daily traffic vector `c(mon = 120, tue = 90, wed = 250, thu = 110)`, return the position of the peak day, letting the winning day's name travel along with the index, and save the named position to `ex_10_1`.

**Expected result:**

```
#> wed 
#>   3 
```

**Difficulty:** Beginner

[HINTS]
A single function returns the location of the peak rather than its value, and a named input labels that location.
Use `which.max()` on the named vector.

```r title="Your turn"
ex_10_1 <- # your code here
ex_10_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_10_1 <- which.max(c(mon = 120, tue = 90, wed = 250, thu = 110))
ex_10_1
#> wed 
#>   3 
```

**Explanation:** `which.max()` returns the position of the first maximum, and because the input is named it carries that name along, so the answer reports `wed` at position 3. Its partner `which.min()` finds the smallest. Both are cleaner and faster than `which(x == max(x))[1]`, and they ignore `NA` by default, which the naive comparison version does not.

</details>

### Exercise 10.2: Build a running total

**Task:** Turn the vector `c(10, 20, 30, 40)` into its running cumulative total, so each position holds the sum of all values up to and including it, and save the four-element cumulative vector to `ex_10_2`.

**Expected result:**

```
#> [1]  10  30  60 100
```

**Difficulty:** Intermediate

[HINTS]
One function produces the accumulating sum along a vector in a single pass.
Use `cumsum()`.

```r title="Your turn"
ex_10_2 <- # your code here
ex_10_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_10_2 <- cumsum(c(10, 20, 30, 40))
ex_10_2
#> [1]  10  30  60 100
```

**Explanation:** `cumsum()` returns a vector of the same length where each element is the sum so far, ideal for running totals, cumulative revenue, or empirical distribution curves. The family includes `cumprod()` for running products, and `cummax()` and `cummin()` for running extremes. Each does in one compiled pass what a manual loop with an accumulator would do far more slowly.

</details>

### Exercise 10.3: Recode with a vectorized conditional

**Task:** Label each element of `c(-2, 3, -1, 4)` as either `"neg"` when it is below zero or `"pos"` otherwise, using a single vectorized conditional rather than a loop, and save the character vector of labels to `ex_10_3`.

**Expected result:**

```
#> [1] "neg" "pos" "neg" "pos"
```

**Difficulty:** Intermediate

[HINTS]
A vectorized if-then-else picks from two vectors element by element based on a condition.
Use `ifelse(x < 0, "neg", "pos")`.

```r title="Your turn"
ex_10_3 <- # your code here
ex_10_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_10_3 <- ifelse(c(-2, 3, -1, 4) < 0, "neg", "pos")
ex_10_3
#> [1] "neg" "pos" "neg" "pos"
```

**Explanation:** `ifelse()` evaluates the condition for every element and returns the matching value from the yes or no vector, so it recodes a whole vector at once without a loop. It differs from the scalar `if () else`, which handles a single condition. Watch that `ifelse()` propagates `NA` in the test straight to the output, and that it drops attributes like names, which a bracket assignment would preserve.

</details>

### Exercise 10.4: Test membership with %in%

**Task:** Check for each element of `c(1, 5, 10)` whether it appears anywhere in the reference set `c(1, 2, 3, 4, 5)`, returning a logical vector of the same length as the first, and save it to `ex_10_4`.

**Expected result:**

```
#> [1]  TRUE  TRUE FALSE
```

**Difficulty:** Intermediate

[HINTS]
A dedicated operator asks "is each left element found among the right ones" and returns TRUE or FALSE.
Use the infix operator `%in%` between the two vectors.

```r title="Your turn"
ex_10_4 <- # your code here
ex_10_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_10_4 <- c(1, 5, 10) %in% c(1, 2, 3, 4, 5)
ex_10_4
#> [1]  TRUE  TRUE FALSE
```

**Explanation:** `%in%` returns a logical vector marking which elements of the left operand occur in the right one, so it is the natural tool for filtering rows whose category is in an allowed set. It is a readable wrapper around `match()` that returns TRUE or FALSE instead of positions. Unlike `==`, it handles many candidate values at once and never triggers surprise recycling.

</details>

### Exercise 10.5: Run-length encode a sequence

**Task:** Compress the repeated runs in the vector `c("a", "a", "b", "a", "a", "a")` into their run lengths and values, so consecutive duplicates collapse into a single length-plus-value entry, and save the run-length encoding to `ex_10_5`.

**Expected result:**

```
#> Run Length Encoding
#>   lengths: int [1:3] 2 1 3
#>   values : chr [1:3] "a" "b" "a"
```

**Difficulty:** Advanced

[HINTS]
One function summarizes consecutive equal values as parallel lengths and values.
Apply `rle()` to the vector.

```r title="Your turn"
ex_10_5 <- # your code here
ex_10_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_10_5 <- rle(c("a", "a", "b", "a", "a", "a"))
ex_10_5
#> Run Length Encoding
#>   lengths: int [1:3] 2 1 3
#>   values : chr [1:3] "a" "b" "a"
```

**Explanation:** `rle()` scans for consecutive runs and returns an object with parallel `lengths` and `values` vectors, so the "a a b a a a" input becomes runs of 2, 1, and 3. It is invaluable for detecting streaks, gaps, or state changes in a sequence, such as consecutive up-days in a price series. The reverse function `inverse.rle()` reconstructs the original vector from the encoding.

</details>

## What to do next

Keep building base R fluency with these related practice hubs:

- [R Vectors Exercises](R-Vectors-Exercises.html) to drill vector creation, coercion, and subsetting in more depth.
- [R Basics Exercises](R-Basics-Exercises.html) for a broader tour of the language fundamentals.
- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) to go deeper on sapply, lapply, vapply, tapply, and mapply.
- [R String Exercises](R-String-Exercises.html) for paste, sprintf, substr, and regular-expression practice.
