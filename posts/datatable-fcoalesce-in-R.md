---
title: "data.table fcoalesce() in R: Fill Missing Values Fast"
slug: datatable-fcoalesce-in-R
description: "Learn data.table fcoalesce() in R to fill missing values from the first non-NA source. Covers syntax, scalar defaults, fcoalesce vs coalesce, and pitfalls."
keywords: "data.table fcoalesce, fcoalesce function R, data.table fcoalesce examples, R coalesce NA, replace NA data.table, fcoalesce vs coalesce, first non-NA value R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "fcoalesce()|data.table fcoalesce|data.table::fcoalesce()|fcoalesce|coalesce in R"
auto_link_case_sensitive: true
target_keyword: "data.table fcoalesce"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table fcoalesce() in R: Fill Missing Values Fast

<p class="lead">The data.table fcoalesce() function in R returns the first non-missing value across two or more vectors, scanning them left to right in a single fast pass. It is the R equivalent of SQL's COALESCE.</p>

[QUICK ANSWER]
fcoalesce(x, y)                      # first non-NA of x then y
fcoalesce(x, 0)                      # scalar fills every NA
fcoalesce(x, y, z)                   # scan any number of vectors
DT[, v := fcoalesce(a, b)]           # add a column by reference
fcoalesce(d, as.Date("2024-01-01"))  # Date class is preserved
fcoalesce(chr, "unknown")            # text fallback for NA

[DECISION TREE: Is fcoalesce() the right tool?]
- fill NA from a backup vector: fcoalesce(x, backup)
- pick a value by one condition: fifelse(test, yes, no)
- classify by many conditions: fcase(c1, v1, c2, v2)
- replace NA in place by reference: setnafill(DT, fill = 0)
- drop every row containing NA: na.omit(DT)
- count NA values per column: colSums(is.na(DT))

## What fcoalesce() does

**fcoalesce() merges several vectors into one by taking the first value that is not NA.** You pass two or more vectors of the same type and length. For each position, the function walks the vectors left to right and returns the first value that is not missing.

It is data.table's tool for combining sparse sources into one complete column. A common case is a primary column with gaps and a backup column that fills them. Instead of writing `ifelse(is.na(x), y, x)` by hand, `fcoalesce()` does the same job in one optimized C pass and extends cleanly to three, four, or more fallback vectors.

[KEY INSIGHT]
**fcoalesce() resolves a priority order, not just a single fallback.** The argument order is the priority order: the first vector wins wherever it has a value, the second fills its gaps, the third fills what remains, and so on. Reading a call left to right tells you exactly which source takes precedence.

## fcoalesce() syntax

**The call takes any number of vectors plus an optional nan argument.** The signature is `fcoalesce(..., nan = NA)`. Each vector in `...` is a candidate source, and `nan` controls whether `NaN` is treated as missing alongside `NA`.

```r title="The fcoalesce call shape"
library(data.table)

x <- c(1, NA, NA, 4)
y <- c(9, 9, 9, 9)
fcoalesce(x, y)
#> [1] 1 9 9 4
```

Two rules govern every call. All inputs must share one type, since the result is a single typed vector. Each input must have length 1 or the same length as the longest input, and length-1 values are recycled to fill every position. The output keeps the type and attributes of the inputs, so a `Date` stays a `Date`. See the official [data.table fcoalesce reference](https://rdatatable.gitlab.io/data.table/reference/coalesce.html) for the full argument list.

## fcoalesce() examples

**These examples cover the four most common fcoalesce() tasks.** Each one shows a different real job: merging two vectors, applying a scalar default, filling a data.table column, and resolving a priority chain.

The first example merges two sparse vectors. Wherever `primary` has a value it wins; wherever it is `NA`, the matching `secondary` value fills the gap.

```r title="Merge two sparse vectors"
primary   <- c(10, NA, 30, NA)
secondary <- c(NA, 20, NA, 40)
fcoalesce(primary, secondary)
#> [1] 10 20 30 40
```

A single number as the last argument acts as a default. Because length-1 inputs are recycled, that scalar fills every remaining `NA` at once.

```r title="Use a scalar as the default value"
readings <- c(5.2, NA, 7.8, NA, 3.1)
fcoalesce(readings, 0)
#> [1] 5.2 0.0 7.8 0.0 3.1
```

Inside a `data.table`, `fcoalesce()` pairs naturally with the `:=` operator. Here the built-in `airquality` data has 37 missing `Ozone` readings, and a precomputed mean fills them by reference.

```r title="Fill a data.table column with the mean"
aq <- as.data.table(airquality)
ozone_mean <- as.integer(round(mean(aq$Ozone, na.rm = TRUE)))
aq[, Ozone_filled := fcoalesce(Ozone, ozone_mean)]
c(before = sum(is.na(aq$Ozone)), after = sum(is.na(aq$Ozone_filled)))
#> before  after
#>     37      0
```

With three or more vectors, `fcoalesce()` resolves a priority chain. The official name wins, a nickname fills the next gaps, and a generated label catches whatever is still missing.

```r title="Resolve a priority chain of sources"
official <- c(NA, "Bob", NA)
nickname <- c("Ann", NA, NA)
fallback <- c("User1", "User2", "User3")
fcoalesce(official, nickname, fallback)
#> [1] "Ann"   "Bob"   "User3"
```

[NOTE]
**Coming from Python pandas?** The closest equivalent of `fcoalesce()` is `Series.combine_first()`, which fills missing values in one Series from another, element by element.

## fcoalesce vs coalesce vs nafill

**Pick the function that matches your stack and where the fill values come from.** All three handle `NA`, but they differ in source and in whether they edit data in place.

| Function | Package | Fills from | Best for |
|---|---|---|---|
| `fcoalesce()` | data.table | other vectors, element-wise | combining sparse columns |
| `coalesce()` | dplyr | other vectors, element-wise | tidyverse pipelines |
| `nafill()` | data.table | a constant, last, or next value | time-ordered single columns |
| `ifelse(is.na(x), y, x)` | base R | one backup vector | quick one-off, no packages |

The decision rule is short. If you already work in data.table, `fcoalesce()` keeps everything in one fast, dependency-free idiom and accepts as many fallback vectors as you need. Reach for `nafill()` when the fill should come from a neighbouring value in the same column, such as last-observation-carried-forward on a time series. Use `dplyr::coalesce()` only when the rest of your pipeline is already tidyverse, since it behaves the same way but needs dplyr loaded.

## Common pitfalls

**Most fcoalesce() bugs trace back to mixed types, wrong lengths, or assuming it catches values other than NA.** All three surface quickly once you know the symptom.

Mixing input types throws an error, because the result must be one typed vector. A numeric vector and a character fallback cannot share a call.

```r title="All inputs must share one type"
fcoalesce(c(1, NA, 3), "missing")
#> Error in fcoalesce(c(1, NA, 3), "missing") :
#>   Argument #2 is of type character but argument #1 is of type double. Please make sure all arguments have the same type.
```

[WARNING]
**Type mismatches fail loudly, but the empty-string trap fails silently.** The error above is easy to fix by coercing both inputs to the same type. The quieter mistake is expecting `fcoalesce()` to replace `""`, `0`, or the string `"NA"`. It only treats a true `NA` as missing.

Each input must be length 1 or the same length as the longest vector. Any other length is rejected.

```r title="Vectors must be length 1 or equal length"
fcoalesce(c(1, NA, 3), c(99, 88))
#> Error in fcoalesce(c(1, NA, 3), c(99, 88)) :
#>   Argument #2 is length 2 but argument #1 is length 3. Lengths must be 1 or equal.
```

Finally, `fcoalesce()` replaces only `NA`. An empty string is a real value, so it is kept and never filled.

```r title="Only NA counts as missing"
ids <- c("A", "", NA)
fcoalesce(ids, "unknown")
#> [1] "A"       ""        "unknown"
```

## Try it yourself

**Try it:** Use fcoalesce() to fill the NA values in stock with the matching value from backup, then fill any value still missing with 0. Save the result to ex_filled.

```r title="Your turn: coalesce stock levels"
# Try it: fill NA with fcoalesce()
stock  <- c(12, NA, NA, 7)
backup <- c(NA, 5, NA, NA)
ex_filled <- # your code here

ex_filled
#> Expected: 12 5 0 7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stock  <- c(12, NA, NA, 7)
backup <- c(NA, 5, NA, NA)
ex_filled <- fcoalesce(stock, backup, 0)
ex_filled
#> [1] 12  5  0  7
```

**Explanation:** `fcoalesce()` reads the arguments as a priority order. `stock` wins where it has a value, `backup` fills the next gap at position two, and the scalar `0` is recycled to cover position three where both vectors were `NA`.

</details>

## Related data.table functions

**fcoalesce() sits in data.table's family of fast, vectorized helpers.** These functions pair well with it for conditional logic and cleanup:

- `fifelse()`: the binary choice, for a single condition. See [data.table fifelse in R](datatable-fifelse-in-R.html).
- `fcase()`: the multi-case version, for three or more conditions. See [data.table fcase in R](datatable-fcase-in-R.html).
- `shift()`: lag or lead a column to build a fallback. See [data.table shift in R](datatable-shift-in-R.html).
- `setDT()`: convert a data.frame to a data.table in place. See [data.table setDT in R](datatable-setDT-in-R.html).
- `uniqueN()`: count distinct values in the filled result. See [data.table uniqueN in R](datatable-uniqueN-in-R.html).

## FAQ

**What is the difference between fcoalesce() and dplyr's coalesce()?**

Both return the first non-`NA` value across a set of equal-length vectors, scanning left to right. `fcoalesce()` ships with data.table and runs as optimized C code, so it is fast and needs no tidyverse load. `dplyr::coalesce()` does the same job inside tidyverse pipelines. In logic they are interchangeable, so pick the one that matches the packages your project already uses. Inside a `DT[, := ]` call, `fcoalesce()` is the natural fit.

**Does fcoalesce() modify the data.table in place?**

No. `fcoalesce()` itself is a pure function that returns a new vector and changes nothing. The in-place behaviour comes from the `:=` operator that you usually wrap it in, as in `DT[, col := fcoalesce(a, b)]`. That assignment adds or updates the column by reference with no copy. If you want to fill an existing column directly with a constant or a carried-forward value, use `setnafill()` instead, which edits the column in place.

**Can fcoalesce() fill missing values with a single number?**

Yes. Pass a length-1 value as the final argument and it is recycled across every position, so it fills any `NA` that the earlier vectors did not. For example, `fcoalesce(x, 0)` replaces every remaining missing value in `x` with `0`. The scalar must share the type of the other inputs, so use `0L` for an integer vector and `0` for a double vector to avoid a type-mismatch error.

**What types can fcoalesce() handle?**

`fcoalesce()` works with logical, integer, double, character, and complex vectors, plus classed types such as `Date`, `factor`, and `IDate`. The one firm rule is that every argument must share the same type, because the result is a single typed vector. It also preserves attributes, so a `Date` input returns a `Date` and a `factor` returns a `factor` with its levels intact, unlike a hand-written `ifelse()` that would strip the class.
</content>
</invoke>
