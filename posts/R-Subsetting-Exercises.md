---
title: "R Subsetting Exercises: 10 [] vs [[]] vs $ Practice Problems — Solved"
slug: "R-Subsetting-Exercises"
description: "Practice R's three subsetting operators — [], [[]], and $ — with 10 interactive exercises covering vectors, lists, and data frames. Full solutions included."
keywords: "R subsetting exercises, R bracket exercises, R double bracket practice, R dollar sign subsetting, R list subsetting exercises"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E1.10"
post_type: "EX"
auto_link_terms: "R subsetting exercises|subsetting exercises|bracket exercises"
auto_link_case_sensitive: false
sidebar_title: "R Subsetting (10 problems)"
fr_parent: "R-Vectors.html"
---

# R Subsetting Exercises: 10 [] vs [[]] vs $ Practice Problems

<p class="lead">Practice R's three subsetting operators — single bracket <code>[]</code>, double bracket <code>[[]]</code>, and dollar sign <code>$</code> — on vectors, lists, and data frames. Each exercise has an interactive solution you can run in your browser.</p>

R has three subsetting operators that look similar but behave very differently. These 10 exercises drill you on what each one *returns*, so you stop guessing and start predicting. Work through them in order — early exercises warm you up on vectors, later ones push into list and data frame edge cases.

## Quick Reference: The Three Operators

Keep this table next to the exercises. The single rule that keeps you sane: `[` preserves the container type; `[[` and `$` break the container open and hand you the element inside.

| Operator  | Works on                  | Returns                       | Good analogy                                   |
|-----------|---------------------------|-------------------------------|------------------------------------------------|
| `x[i]`    | Vectors, lists, data frames | A smaller object of the same type | Ripping pages out of a book — you still hold a book |
| `x[[i]]`  | Lists, data frames        | The element itself, unwrapped | Opening the box and pulling the item out       |
| `x$name`  | Lists, data frames        | The element itself (shortcut for `[["name"]]`) | Shortcut to the same drawer by name |

Here is the difference in ten lines. We build a two-element list and ask for its first element three different ways.

```r
box <- list(fruits = c("apple", "pear"), count = 42)

box[1]        # [ returns a smaller list
#> $fruits
#> [1] "apple" "pear"

box[[1]]      # [[ returns the element inside
#> [1] "apple" "pear"

box$fruits    # $ is shorthand for [["fruits"]]
#> [1] "apple" "pear"
```

Notice how `box[1]` prints with the `$fruits` header — that is the giveaway it is still a list. `box[[1]]` and `box$fruits` both drop the list wrapper and return the bare character vector. Most list-indexing bugs come from confusing those two outputs.

[KEY INSIGHT]
**Single bracket filters, double bracket extracts.** If you read `box[1]` as "the subset of box where position is 1", you can predict it will still be a list. If you read `box[[1]]` as "reach inside box and give me item 1", you can predict you get the contents. Every rule below reduces to that one sentence.

## Easy (1-4): Vector and List Basics

The first four exercises focus on what single and double brackets do on simple inputs. No data frames yet.

### Exercise 1: Six Ways to Subset a Named Vector

Given a named vector of city temperatures, extract subsets using positive indices, negative indices, logical vectors, and names.

```r
# Exercise 1: six different subsetting calls
temps <- c(London = 15, Paris = 18, Berlin = 14,
           Rome = 22, Madrid = 25, Oslo = 8)

# 1. The 2nd and 4th elements by position
# 2. Everything except the 1st and last
# 3. Cities warmer than 17 degrees
# 4. London and Madrid by name
# 5. The first three elements
# 6. The vector reversed

```

<details>
<summary>Click to reveal solution</summary>

```r
temps <- c(London = 15, Paris = 18, Berlin = 14,
           Rome = 22, Madrid = 25, Oslo = 8)

temps[c(2, 4)]
#>  Paris   Rome
#>     18     22

temps[c(-1, -6)]
#>  Paris Berlin   Rome Madrid
#>     18     14     22     25

temps[temps > 17]
#>  Paris   Rome Madrid
#>     18     22     25

temps[c("London", "Madrid")]
#> London Madrid
#>     15     25

temps[1:3]
#> London  Paris Berlin
#>     15     18     14

rev(temps)
#>   Oslo Madrid   Rome Berlin  Paris London
#>      8     25     22     14     18     15
```

**Key concept:** `[` accepts four kinds of index — positive integers (keep these positions), negative integers (drop these positions), logicals (keep `TRUE`s), and character vectors (match by name). Mixing positives and negatives in the same call is an error; everything else is fair game.

</details>

### Exercise 2: Single vs Double Bracket on a List

A named list contains three different data types. Use `[` and `[[` to extract the first element and inspect what you get back using `class()`.

```r
# Exercise 2: [ vs [[ on a list
bag <- list(
  title  = "Advanced R",
  pages  = 456,
  topics = c("functions", "OOP", "metaprogramming")
)

# 1. Use [ to get the first slot and check class()
# 2. Use [[ to get the first slot and check class()

```

<details>
<summary>Click to reveal solution</summary>

```r
bag <- list(
  title  = "Advanced R",
  pages  = 456,
  topics = c("functions", "OOP", "metaprogramming")
)

class(bag[1])
#> [1] "list"

class(bag[[1]])
#> [1] "character"
```

**Key concept:** `bag[1]` stays a list of length 1 — the container is preserved. `bag[[1]]` unwraps and hands you the character vector inside. If you forget which is which, check `class()`.

</details>

### Exercise 3: Extract Elements by Name

Using the same `bag` list, extract the `title` element three different ways and confirm all three return the same string.

```r
# Exercise 3: three routes to the same element
bag <- list(title = "Advanced R", pages = 456,
            topics = c("functions", "OOP", "metaprogramming"))

# 1. bag[["title"]]
# 2. bag$title
# 3. bag[["title"]] with getElement() as a bonus

```

<details>
<summary>Click to reveal solution</summary>

```r
bag <- list(title = "Advanced R", pages = 456,
            topics = c("functions", "OOP", "metaprogramming"))

bag[["title"]]
#> [1] "Advanced R"

bag$title
#> [1] "Advanced R"

getElement(bag, "title")
#> [1] "Advanced R"
```

**Key concept:** `$name` is pure syntactic sugar for `[["name"]]` — the three calls above produce an identical scalar. The difference is that `$` only accepts a *literal* name (typed directly), while `[[` accepts any expression that evaluates to a string, which is what you need inside functions.

</details>

### Exercise 4: NULL vs Missing Element

What happens when you ask a list for an element that does not exist? The answer depends on the operator. Try both.

```r
# Exercise 4: unknown names
bag <- list(title = "Advanced R", pages = 456)

# 1. bag[["author"]]
# 2. bag$author
# 3. bag["author"]

```

<details>
<summary>Click to reveal solution</summary>

```r
bag <- list(title = "Advanced R", pages = 456)

bag[["author"]]
#> NULL

bag$author
#> NULL

bag["author"]
#> $<NA>
#> NULL
```

**Key concept:** `[[` and `$` both return `NULL` silently when the name is missing. `[` returns a length-1 list whose only element is `NULL` (and whose name is `NA`). That is why it is so easy to write a pipeline that silently produces `NULL`s instead of erroring — check with `is.null()` early.

</details>

**Try it:** From the vector `c(a = 1, b = 2, c = 3, d = 4)`, use a logical vector to keep only the even values.

```r
ex_v <- c(a = 1, b = 2, c = 3, d = 4)
# your code here
#> Expected: b = 2, d = 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_v <- c(a = 1, b = 2, c = 3, d = 4)
ex_v[ex_v %% 2 == 0]
#> b d
#> 2 4
```

**Explanation:** `ex_v %% 2 == 0` produces a logical vector; `[` keeps positions where the logical is `TRUE`.

</details>

## Medium (5-7): Data Frames

Data frames are lists of columns, so every subsetting rule from exercises 1-4 still applies — but the two-dimensional form `df[rows, cols]` adds a second axis.

### Exercise 5: Select Rows and Columns in One Call

Using `mtcars`, extract the first 5 rows of the `mpg` and `cyl` columns.

```r
# Exercise 5: 2D subsetting
# Hint: df[rows, cols]

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars[1:5, c("mpg", "cyl")]
#>                    mpg cyl
#> Mazda RX4         21.0   6
#> Mazda RX4 Wag     21.0   6
#> Datsun 710        22.8   4
#> Hornet 4 Drive    21.4   6
#> Hornet Sportabout 18.7   8
```

**Key concept:** For data frames, `[` takes two indices separated by a comma. Leaving either blank means "all". `mtcars[, "mpg"]` is every row's mpg; `mtcars[1, ]` is the whole first row.

</details>

### Exercise 6: Column as Vector vs Column as Data Frame

Extract the `mpg` column from `mtcars` as a vector, then as a one-column data frame. Show that `length()` and `nrow()` each tell you what you got.

```r
# Exercise 6: column shape
# Hint: df[["col"]] vs df["col"] vs df[, "col", drop = FALSE]

```

<details>
<summary>Click to reveal solution</summary>

```r
v  <- mtcars[["mpg"]]
length(v)
#> [1] 32

d1 <- mtcars["mpg"]
class(d1)
#> [1] "data.frame"
nrow(d1)
#> [1] 32

d2 <- mtcars[, "mpg", drop = FALSE]
class(d2)
#> [1] "data.frame"
```

**Key concept:** `df[["col"]]` and `df$col` always return a vector. `df["col"]` and `df[, "col", drop = FALSE]` return a one-column data frame. By default, `df[, "col"]` drops the data frame wrapper when only one column is selected — use `drop = FALSE` to keep it.

</details>

### Exercise 7: Filter Rows Conditionally

Return only the rows of `mtcars` where `mpg > 25` *and* `cyl == 4`, keeping all columns.

```r
# Exercise 7: conditional row filter

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars[mtcars$mpg > 25 & mtcars$cyl == 4, ]
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  2    4    2
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  1  1    5    2
```

**Key concept:** The row index is a logical vector of the same length as `nrow(df)`. `mtcars$mpg > 25` and `mtcars$cyl == 4` each produce length-32 logicals; `&` combines them element by element. Don't forget the trailing comma — without it, R treats your logical vector as a column index.

</details>

[WARNING]
**Forgetting the comma is the classic subsetting bug.** `mtcars[mtcars$mpg > 25]` (no comma) silently treats the logical vector as a *column* index, and because R recycles, you get nonsense. Always include the comma when you mean "these rows".

## Hard (8-10): Edge Cases

The last three exercises cover the gotchas that bite even experienced R users: negative indexing with names, `drop = FALSE`, and reordering.

### Exercise 8: Drop Several Columns by Name

Return `mtcars` with the `vs` and `am` columns removed, using a single `[` call.

```r
# Exercise 8: drop columns by name
# Hint: build a character vector of the columns to KEEP, or use setdiff()

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars[, setdiff(names(mtcars), c("vs", "am"))] |> head(3)
#>                mpg cyl disp  hp drat    wt  qsec gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02    4    4
#> Datsun 710    22.8   4  108  93 3.61 3.900 18.61    1    1
```

**Key concept:** Negative character indexing (`mtcars[, -c("vs", "am")]`) is an error — negative indices only work with integers. The idiom is `setdiff(names(df), drop_cols)` to build the keep-list instead.

</details>

### Exercise 9: Preserve a One-Column Selection

Select only the `mpg` column from `mtcars` but keep the result as a data frame, not a vector. Confirm it stayed a data frame.

```r
# Exercise 9: keep the data frame wrapper
# Hint: drop = FALSE

```

<details>
<summary>Click to reveal solution</summary>

```r
one_col <- mtcars[, "mpg", drop = FALSE]
class(one_col)
#> [1] "data.frame"
dim(one_col)
#> [1] 32  1
```

**Key concept:** The default `drop = TRUE` makes `df[, one_column]` return a bare vector — convenient at the console, dangerous inside functions that expect a data frame. Any function you ship to others should use `drop = FALSE` when selecting a variable number of columns.

</details>

### Exercise 10: Reorder Rows Based on a Column

Return the five rows of `mtcars` with the highest `mpg`, sorted in descending order. Use `order()` inside `[`.

```r
# Exercise 10: top-5 by mpg
# Hint: order() returns positions; negate for descending

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars[order(-mtcars$mpg), ][1:5, ]
#>                 mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Toyota Corolla 33.9   4 71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat 128       32.4   4 78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4 75.7  52 4.93 1.615 18.52  1  2    4    2
#> Lotus Europa   30.4   4 95.1 113 3.77 1.513 16.90  1  1    5    2
#> Porsche 914-2  26.0   4 120.3  91 4.43 2.140 16.70  1  1    5    2
```

**Key concept:** `order(x)` returns the positions that would put `x` in ascending order. Negate the column (`-mtcars$mpg`) for descending. Subsetting a data frame by `order()` reorders its rows — this is exactly what dplyr's `arrange()` does under the hood.

</details>

**Try it:** From `mtcars`, return the rows where `cyl` equals 6, sorted by `hp` in descending order.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
six <- mtcars[mtcars$cyl == 6, ]
six[order(-six$hp), ]
```

**Explanation:** First filter by `cyl`, then reorder by `-hp`. Two small steps are easier to debug than one nested call.

</details>

## Summary

| Exercise | Operator         | Rule                                                              |
|----------|------------------|-------------------------------------------------------------------|
| 1        | `[`              | Four index types — integer, negative, logical, character.         |
| 2, 3     | `[` vs `[[` vs `$` | `[` preserves the list; `[[` and `$` extract the element.       |
| 4        | Missing names    | `[[` and `$` return `NULL`; `[` returns a length-1 list of `NULL`.|
| 5        | `df[rows, cols]` | Comma-separated row and column indices.                           |
| 6        | `drop`           | Defaults to `TRUE` and unwraps one-column selections to vectors.  |
| 7        | Logical filter   | Build logicals from comparisons, combine with `&` / `|`.          |
| 8        | `setdiff()`      | Drop columns by name by building a keep-list.                     |
| 9        | `drop = FALSE`   | Keeps the data frame wrapper on single-column selections.         |
| 10       | `order()`        | Reorder rows by any column; negate for descending.                |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 4: Subsetting. [Link](https://adv-r.hadley.nz/subsetting.html)
2. R Core Team — *An Introduction to R*, section on indexing. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
3. `base::Extract` help page. [Link](https://rdrr.io/r/base/Extract.html)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, Chapter 5: Data transformation. [Link](https://r4ds.hadley.nz/data-transform.html)
5. Patrick Burns — *The R Inferno*, Circle 8: Believing it does as intended. [Link](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf)

## Continue Learning

- [R Vectors](R-Vectors.html) — the one-dimensional object `[` was designed for.
- [R Lists](R-Lists.html) — lists are where `[` vs `[[` vs `$` actually matters.
- [R Data Frames Exercises](R-Data-Frames-Exercises.html) — more practice with the two-dimensional form of subsetting.
