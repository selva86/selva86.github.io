---
title: "R Foundations Lesson 4: Matrices and Arrays"
catalog_blurb: "Hold a grid of same-type numbers, then reduce it by row or column."
description: "A matrix is R's all-one-type grid. Build one with matrix(), index it by [row, column], and collapse rows or columns to summaries with apply(). From scratch."
keywords: "matrix in R, R arrays, apply function, rowSums colMeans, matrix indexing, byrow, matrix vs data frame, array in R, R for beginners"
post_type: "LESSON"
curriculum_id: "1.2.4"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-structures"
course_title: "R Foundations: Data Structures"
course_lesson: "4"
course_total: "5"
course_landing: "R-Foundations-Structures-Course.html"
course_next: "Type-Conversion-in-Practice.html"
course_prev: "Inspecting-Data-Structure.html"
---

=== step === cover
::eyebrow Lesson 4 of 5
## Matrices and Arrays
In [Lesson 3](Inspecting-Data-Structure.html) you learned to x-ray any object with `str()`, `dim()` and `class()`. Now we meet the object those tools describe most cleanly: R's plain rectangle of numbers.

The trail club ran **four hikes** this month. For each of three members, Maya, Theo and Ada, you wrote down the **miles** they walked on each hike. Stack those numbers into a grid, three rows of members by four columns of hikes, and every single cell is a number. No names, no `TRUE`/`FALSE`, just numbers. That all-one-type grid is a **matrix**, and it is the shape R reaches for whenever the data is pure numbers: images, distances, correlations, the insides of a model.

By the end of this lesson you will be able to:

- Build a matrix from a vector and control how R fills it (down columns, or by row)
- Index it by `[row, column]` to pull a single cell, a whole row or column, or a sub-grid
- Collapse it to one summary per row or per column with `apply()`

**Prerequisites:** you can run a line of R and assign with `<-`, and you know that a [vector holds one type](Atomic-Vectors-and-Data-Types.html) while a [data frame is a list of equal-length, mixed-type columns](Data-Frames-and-Tibbles.html). The hike grid below is the matrix you are about to build; press **Show what changed** to see the payoff, the whole grid reduced to one total per member.

::widget table-transform {"code":"cbind(df, total = rowSums(df[, -1]))","caption":"Reduce the grid to one number for each member: a total-miles column.","before":{"cols":["member","hike1","hike2","hike3","hike4"],"rows":[["Maya",4,6,7,10],["Theo",3,5,5,8],["Ada",5,7,9,12]]},"after":{"cols":["member","hike1","hike2","hike3","hike4","total"],"rows":[["Maya",4,6,7,10,27],["Theo",3,5,5,8,21],["Ada",5,7,9,12,33]]}}

=== step === concept
::eyebrow The idea
## A matrix is a grid of one type

You already know R's table, the data frame: a stack of columns where each column can be a different type (a text `name`, a number `age`, a logical `member`). A **matrix** is stricter and, in return, simpler: it is a rectangle where **every cell is the same type**. One type for the whole grid, not one type per column.

That is the right shape for the hike data, because every cell is just miles, a number. We describe a matrix by its **shape**, written \(r \times c\): \(r\) rows by \(c\) columns. Our grid is \(3 \times 4\), three members by four hikes. The value in row \(i\), column \(j\) is written \(a_{ij}\); so \(a_{2,3}\) is the entry for the second member on the third hike. Those two coordinates, row then column, are the whole idea, and we will use them constantly.

Let us build it for real. Each lesson runs in a fresh R session, so we make the grid right here (run it once; the later steps reuse `m`):

```r
# Miles each member walked on each of the four hikes, as one grid of numbers
m <- matrix(
  c(4, 3, 5,      # hike 1, going down the column: Maya, Theo, Ada
    6, 5, 7,      # hike 2
    7, 5, 9,      # hike 3
    10, 8, 12),   # hike 4
  nrow = 3,
  dimnames = list(c("Maya", "Theo", "Ada"),
                  c("hike1", "hike2", "hike3", "hike4"))
)
m
#>      hike1 hike2 hike3 hike4
#> Maya     4     6     7    10
#> Theo     3     5     5     8
#> Ada      5     7     9    12
```

`dimnames` is optional, it just labels the rows and columns so the printout reads nicely; a matrix is perfectly happy with no names at all. Now ask R for its shape and its kind:

```r
dim(m)     # rows, then columns
#> [1] 3 4
class(m)   # a matrix is its own kind of object
#> [1] "matrix" "array"
```

[KEY INSIGHT]
A data frame is a list of columns that may each be a different type. A matrix is one block of a single type with two dimensions. Same rectangle on screen, very different object underneath, which is exactly why `class(m)` says `"matrix"`, not `"data.frame"`.

=== step === concept
::eyebrow Building it
## How R fills the grid: down the columns

When you hand `matrix()` a flat vector of numbers, it has to decide where each one goes. The rule surprises everyone once: **R fills down the first column, then the next, then the next**, not left to right across the rows. That is why, above, the first three numbers `4, 3, 5` became the first *column* (hike 1 for Maya, Theo, Ada), not the first row.

The clearest way to see it is with the numbers `1` to `6` in a 2-row grid:

```r
matrix(1:6, nrow = 2)               # the default: fill DOWN each column
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6

matrix(1:6, nrow = 2, byrow = TRUE) # fill ACROSS each row instead
#>      [,1] [,2] [,3]
#> [1,]    1    2    3
#> [2,]    4    5    6
```

Same six numbers, two completely different grids. If your data is written out row by row (the way a person reads a table), pass `byrow = TRUE` so the numbers land where you expect. You only ever give `nrow` *or* `ncol`; R works out the other from how many values you handed it.

[TIP]
There is a second, often friendlier way to build a matrix: glue vectors together as columns with `cbind()` (column-bind) or as rows with `rbind()` (row-bind). `rbind(Maya = c(4, 6, 7, 10), Theo = c(3, 5, 5, 8))` stacks two members into a 2-row matrix, no fill-order puzzle to think about.

=== step === quiz
::eyebrow Check yourself
## Where does each number land?

You run `matrix(1:6, nrow = 2)` with no other arguments. Which number ends up in position `[1, 2]`, the first row, second column?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `3`, because R fills down the first column (`1, 2`) before starting the second column (`3, 4`) ::ok Right. The default is column-major: the first column gets `1, 2`, so the second column starts at `3`, and its first entry is position `[1, 2]`.
- `2`, because R fills left to right across the first row first ::no That is what `byrow = TRUE` would do. By default R fills DOWN columns, so the first row is `1, 3, 5`, making `[1, 2]` equal to `3`.
- `4`, because position `[1, 2]` is the second value overall ::no Position is read as `[row, column]`, not as a running count. R fills columns first, so `[1, 2]` is `3`; the value `4` sits at `[2, 2]`.

=== step === concept
::eyebrow Reaching in
## Index by [row, column]

A vector took one coordinate; a data frame took two, `df[rows, columns]`. A matrix is the same two-coordinate idea in its purest form: `m[i, j]` means **row `i`, column `j`**. Leave a slot empty to mean "all of it", and you can use a name or a number in either slot.

```r
m["Theo", ]        # one row: every hike for Theo
#> hike1 hike2 hike3 hike4
#>     3     5     5     8
m[, "hike3"]       # one column: every member on hike 3
#> Maya Theo  Ada
#>    7    5    9
m["Ada", "hike4"]  # a single cell: Ada on hike 4
#> [1] 12
m[1:2, ]           # a sub-grid: the first two members, all hikes
#>      hike1 hike2 hike3 hike4
#> Maya     4     6     7    10
#> Theo     3     5     5     8
```

Read every one of those as "row slot, comma, column slot". An empty slot keeps everything along that axis, so `m[, "hike3"]` keeps every row of one column, and `m[1:2, ]` keeps every column of two rows.

One sharp edge catches everyone. When you pull a **single** row or column, R helpfully drops the now-pointless second dimension and hands you back a plain *vector*, not a one-row matrix:

```r
m[1, ]                 # a single row -> drops to a plain vector
#> hike1 hike2 hike3 hike4
#>     4     6     7    10
m[1, , drop = FALSE]   # keep it a 1-row matrix instead
#>      hike1 hike2 hike3 hike4
#> Maya     4     6     7    10
```

[WARNING]
That silent drop to a vector is a classic source of bugs: code that expected a matrix suddenly has a vector with no `dim()`. When you must keep the matrix shape, add `drop = FALSE` to the brackets.

The widget shows the sub-grid move: keep the first two members and the third row falls away.

::widget table-transform {"code":"df[1:2, ]","caption":"Indexing keeps a sub-grid: rows 1 and 2 stay, the third member is dropped.","before":{"cols":["member","hike1","hike2","hike3","hike4"],"rows":[["Maya",4,6,7,10],["Theo",3,5,5,8],["Ada",5,7,9,12]]},"after":{"cols":["member","hike1","hike2","hike3","hike4"],"rows":[["Maya",4,6,7,10],["Theo",3,5,5,8]]}}

=== step === tryit
::eyebrow Your turn
## Pull one column

You want **everyone's miles on hike 2**, the whole second column. Fill the brackets: leave the row slot empty (all members) and ask for the `hike2` column. The result should be `6 5 7` for Maya, Theo and Ada.

```r
m[____]   # every member, just the hike2 column
```
::check {"regex":"m\\s*\\[\\s*,\\s*(2|\"hike2\")\\s*\\]","gate":true,"difficulty":"beginner","ok":"Exactly. An empty row slot means every member, and 2 (or \"hike2\") picks the second column, so m[, 2] returns 6 5 7.","no":"Leave the row slot empty and name the column: m[, 2] (or m[, \"hike2\"]). The comma with nothing before it means all rows."}
::solution
```r
m[, 2]
#> Maya Theo  Ada
#>    6    5    7
```

=== step === concept
::eyebrow The payoff
## Collapse a whole direction with apply()

The most useful thing you do to a grid is **reduce** it: turn each row into one number (each member's total miles) or each column into one number (the average distance of each hike). The tool is `apply()`, and it takes three arguments: the matrix, a **MARGIN**, and the function to run.

The MARGIN is just a direction: \(1\) means "go along the rows" (one answer per row), \(2\) means "go along the columns" (one answer per column). Remember it from the shape \(r \times c\): \(r\) (rows) is the first dimension, so MARGIN `1` is rows; \(c\) (columns) is the second, so MARGIN `2` is columns.

```r
apply(m, 1, sum)    # MARGIN 1: one value per ROW (total miles per member)
#> Maya Theo  Ada
#>   27   21   33
apply(m, 2, mean)   # MARGIN 2: one value per COLUMN (average miles per hike)
#> hike1 hike2 hike3 hike4
#>     4     6     7    10
```

So Maya walked 27 miles over the month, and the four hikes averaged 4, 6, 7 and 10 miles, the trips got longer as the month went on. `apply()` runs *any* function this way, `sum`, `mean`, `max`, even one you write yourself, which is what makes it so general.

[TIP]
The two reductions you reach for most have their own fast, readable shortcuts: `rowSums(m)` and `rowMeans(m)` for the per-row versions, `colSums(m)` and `colMeans(m)` for the per-column ones. `rowSums(m)` is exactly `apply(m, 1, sum)`, just quicker to type and quicker to run.

::widget table-transform {"code":"cbind(df, total = rowSums(df[, -1]))","caption":"apply along each row gives one total per member, shown here added as a new column.","before":{"cols":["member","hike1","hike2","hike3","hike4"],"rows":[["Maya",4,6,7,10],["Theo",3,5,5,8],["Ada",5,7,9,12]]},"after":{"cols":["member","hike1","hike2","hike3","hike4","total"],"rows":[["Maya",4,6,7,10,27],["Theo",3,5,5,8,21],["Ada",5,7,9,12,33]]}}

=== step === quiz
::eyebrow Check yourself
## Which way does it reduce?

You run `apply(m, 2, mean)` on the hike grid. Remembering that the shape is `3 rows x 4 columns`, what do you get back?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- One number per member (3 values), each member's average hike ::no That is MARGIN `1` (along the rows). MARGIN `2` goes along the columns, so you get one number per hike, not per member.
- One number per hike (4 values), the average miles walked on each hike ::ok Right. MARGIN `2` is the column direction, so `mean` runs once per column and returns four values, one average per hike.
- A single number, the grand average of all 12 miles ::no `apply()` reduces along one direction, not the whole grid. MARGIN `2` returns one mean per column (4 values); `mean(m)` would give the single grand average.

=== step === tryit
::eyebrow Your turn
## Total miles per member

Now the per-row reduction. Give each member their **total** miles for the month by applying `sum` along the rows. Fill in the MARGIN. The answer should be `27 21 33` for Maya, Theo and Ada.

```r
apply(m, ____, sum)   # one total per member (go along the rows)
```
::check {"regex":"apply\\s*\\(\\s*m\\s*,\\s*1\\s*,\\s*sum","gate":true,"difficulty":"intermediate","ok":"Exactly. MARGIN 1 runs sum along each row, returning one total per member: 27, 21, 33. (rowSums(m) is the shortcut.)","no":"Rows are the first dimension, so the MARGIN is 1: apply(m, 1, sum). MARGIN 2 would total each hike instead."}
::solution
```r
apply(m, 1, sum)
#> Maya Theo  Ada
#>   27   21   33
```

=== step === concept
::eyebrow One step further
## A matrix is really a 2-D array

Look back at `class(m)`: it said `"matrix" "array"`. That second word is the bigger picture. A matrix is just a **2-dimensional array**, and an **array** is the same all-one-type idea stretched to *any* number of dimensions. Two dimensions give you rows and columns; a third gives you stacked grids.

Say the club hiked for two months and you want both. That is a \(3 \times 4 \times 2\) array: members by hikes by month. You build it with `array()`, naming the size of each dimension in `dim`:

```r
a <- array(1:24, dim = c(3, 4, 2),
           dimnames = list(c("Maya", "Theo", "Ada"),
                           c("h1", "h2", "h3", "h4"),
                           c("May", "June")))
dim(a)            # three dimensions now
#> [1] 3 4 2
a[, , "June"]     # fix the month and you are back to a familiar matrix
#>      h1 h2 h3 h4
#> Maya 13 16 19 22
#> Theo 14 17 20 23
#> Ada  15 18 21 24
```

The same column-major fill and the same `[ , ]` indexing scale up: you just get one coordinate per dimension. Most everyday work stays in two dimensions, so you will reach for matrices far more often than higher arrays, but it is worth knowing that the matrix is simply the flat, two-dimensional case of one idea.

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [An Introduction to R: Arrays and matrices](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Arrays-and-matrices) - the canonical first treatment of matrices, arrays, indexing and `apply`, straight from the R project.
- [Advanced R (2e): Vectors (matrices and arrays)](https://adv-r.hadley.nz/vectors-chap.html) - how a matrix is just a vector with a `dim` attribute, and where it differs from a data frame.
- [R documentation: matrix()](https://stat.ethz.ch/R-manual/R-devel/library/base/html/matrix.html) - every argument of the function you used to build the grid, including `byrow` and `dimnames`.
- [R documentation: apply()](https://stat.ethz.ch/R-manual/R-devel/library/base/html/apply.html) - the MARGIN argument in full, with examples of reducing rows versus columns.

=== step === complete
## Lesson 4 complete

You met R's all-one-type rectangle, the matrix: a grid where every cell shares a type, described by its shape \(r \times c\). You built one with `matrix()` (learning that R fills **down the columns** unless you say `byrow = TRUE`), indexed it by `[row, column]` to pull a cell, a row, a column or a sub-grid (minding the silent drop to a vector), and collapsed it with `apply()` along MARGIN `1` (rows) or `2` (columns), plus the `rowSums`/`colMeans` shortcuts. Finally you saw that a matrix is just the 2-D case of an **array** that can stretch to more dimensions.

Next, Lesson 5: Type Conversion in Practice. You can now build and read every core structure; the last skill is changing what type your data *is*, converting on purpose with `as.numeric()`, `as.character()` and `as.factor()`, and fixing a column that imported as the wrong type.
