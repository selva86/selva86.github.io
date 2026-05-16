---
title: "data.table fcase() in R: Vectorised Multi-Case Conditionals"
slug: datatable-fcase-in-R
description: "Learn data.table fcase() in R for fast, vectorised multi-case conditionals. Covers syntax, the default argument, fcase vs fifelse vs case_when, and pitfalls."
keywords: "data.table fcase, fcase function R, data.table fcase examples, R fcase multiple conditions, fcase vs case_when, vectorized if else R, fcase default"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "fcase()|data.table fcase|data.table::fcase()|fcase|vectorised case when"
auto_link_case_sensitive: true
target_keyword: "data.table fcase"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table fcase() in R: Vectorised Multi-Case Conditionals

<p class="lead">The data.table fcase() function in R picks an output value from many condition branches in one fast, vectorized pass. It is the SQL CASE WHEN of R: cleaner than nested ifelse and built for large columns.</p>

[QUICK ANSWER]
fcase(x < 0, "neg", x > 0, "pos")          # two condition/value pairs
fcase(x < 0, "neg", default = "zero")      # default catches the rest
fcase(c1, v1, c2, v2, c3, v3)              # any number of pairs
DT[, grp := fcase(...)]                    # add a column by reference
fcase(x < 5, 1L, x >= 5, 2L)               # all values share one type
fcase(s == "a", 1, default = 0)            # numeric output works too

[DECISION TREE: Is fcase() the right tool?]
- classify by many conditions: fcase(c1, v1, c2, v2)
- one binary condition only: fifelse(test, yes, no)
- replace NA with a fallback: fcoalesce(x, backup)
- map exact keys to labels: DT[labels, on = "key"]
- bucket values by rank: frank(x)

## What fcase() does

**fcase() turns a stack of conditions into a single output vector.** You pass alternating pairs: a logical condition, then the value to return where that condition is `TRUE`. The function checks each pair in order and returns the value from the first condition that holds for each element.

It is the data.table answer to "I have more than two cases". A binary choice fits `fifelse()`. Three or more cases would force you into deeply nested `ifelse()` calls, which are slow to run and hard to read. `fcase()` flattens that nesting into one readable call and evaluates it as a single vectorized operation.

[KEY INSIGHT]
**fcase() is a vectorised switch, not a loop.** Every condition is evaluated across the whole vector at once, then the results are merged. That is why it scales to millions of rows without the per-row overhead of a hand-written loop.

## fcase() syntax

**The call is a flat list of condition and value pairs.** Arguments alternate strictly: condition one, value one, condition two, value two, and so on. An optional named `default` argument sets the value for elements that match no condition.

```r title="The fcase call shape"
library(data.table)

temp <- c(-3, 0, 18, 31)
fcase(
  temp < 0,   "freezing",   # condition 1, value 1
  temp < 25,  "mild",       # condition 2, value 2
  default = "hot"           # catch-all when nothing matched
)
#> [1] "freezing" "mild"     "mild"     "hot"
```

Three rules govern every call. Conditions must be logical vectors of the same length (length-1 conditions are recycled). Output values must all share one type, since the result is a single typed vector. Without `default`, unmatched elements become `NA`. See the official [data.table fcase reference](https://rdatatable.gitlab.io/data.table/reference/fcase.html) for the full argument list.

## fcase() examples

**These examples use the built-in `mtcars` dataset loaded as a data.table.** Each one shows a different real task: bucketing a column, combining columns, returning numbers, and grouping.

The first example sorts a numeric column into named bands. Conditions are checked top to bottom, so order them from the most specific threshold downward.

```r title="Bucket a numeric column"
DT <- as.data.table(mtcars, keep.rownames = "model")

DT[, mpg_band := fcase(
  mpg >= 30, "excellent",
  mpg >= 20, "good",
  mpg >= 15, "average",
  default = "poor"
)]
DT[1:6, .(model, mpg, mpg_band)]
#>                model  mpg mpg_band
#> 1:         Mazda RX4 21.0     good
#> 2:     Mazda RX4 Wag 21.0     good
#> 3:        Datsun 710 22.8     good
#> 4:    Hornet 4 Drive 21.4     good
#> 5: Hornet Sportabout 18.7  average
#> 6:           Valiant 18.1  average
```

A condition can reference several columns at once. Here each branch combines a cylinder count with a performance threshold.

```r title="Conditions across several columns"
DT[, segment := fcase(
  cyl == 4 & mpg > 25,   "efficient four",
  cyl == 8 & hp > 200,   "muscle car",
  default = "standard"
)]
DT[, .N, by = segment]
#>           segment  N
#> 1:       standard 19
#> 2:     muscle car  7
#> 3: efficient four  6
```

The output does not have to be text. Return numeric values to map a measurement onto a score.

```r title="Return numeric values not labels"
grade <- c(91, 82, 68, 55)
fcase(
  grade >= 90, 4.0,
  grade >= 80, 3.0,
  grade >= 70, 2.0,
  default = 0.0
)
#> [1] 4 3 0 0
```

Inside a `data.table`, `fcase()` respects the `by` clause. The condition is then evaluated per group, so `mean(mpg)` here is each cylinder group's own mean.

```r title="Classify within each group"
DT[, mpg_vs_class := fcase(
  mpg > mean(mpg), "above average",
  default = "below average"
), by = cyl]
DT[1:6, .(model, cyl, mpg, mpg_vs_class)]
#>                model cyl  mpg  mpg_vs_class
#> 1:         Mazda RX4   6 21.0 above average
#> 2:     Mazda RX4 Wag   6 21.0 above average
#> 3:        Datsun 710   4 22.8 below average
#> 4:    Hornet 4 Drive   6 21.4 above average
#> 5: Hornet Sportabout   8 18.7 above average
#> 6:           Valiant   6 18.1 below average
```

[NOTE]
**Coming from Python pandas?** The closest equivalent of `fcase()` is `numpy.select(condlist, choicelist, default=...)`, which also takes parallel lists of conditions and values.

## fcase vs fifelse vs case_when

**Pick the function that matches the number of cases and your stack.** A binary split needs `fifelse()`. Three or more cases call for `fcase()`. The tidyverse equivalent is `dplyr::case_when()`.

| Function | Package | Use when | Catch-all |
|---|---|---|---|
| `fcase()` | data.table | 3 or more conditions | `default =` |
| `fifelse()` | data.table | exactly one condition | 3rd argument |
| `ifelse()` | base R | one condition, no packages | nested else |
| `case_when()` | dplyr | tidyverse pipelines | `.default =` |

The decision rule is simple. If you already work in data.table, `fcase()` keeps everything in one fast, dependency-free idiom. `fcase()` and `case_when()` are close in speed and behaviour, but `fcase()` runs without loading dplyr and integrates directly with the `:=` update operator. Reach for `fifelse()` only when there is genuinely one condition, where its three-argument form reads more naturally.

## Common pitfalls

**Most fcase() bugs trace back to type mixing, missing defaults, or condition order.** All three are easy to spot once you know the symptom.

Mixing output types throws an error, because the result must be one typed vector. A character value and a numeric value cannot share a branch list.

```r title="All values must share one type"
n <- c(2, 8)
fcase(n < 5, "low", n >= 5, 99)
#> Error in fcase(n < 5, "low", n >= 5, 99) :
#>   Argument #4 is of type 'double' but argument #2 is of type 'character'.
```

[WARNING]
**Type mismatches fail loudly, missing matches fail silently.** Fix the error above by making every value the same type, for example `fcase(n < 5, "low", n >= 5, "high")`. The silent case is worse, so always set `default`.

Without `default`, any element that matches no condition returns `NA`. That is valid but often unintended.

```r title="Unmatched rows become NA"
score <- c(95, 72, 40)
fcase(
  score >= 90, "A",
  score >= 70, "B"
)
#> [1] "A" "B" NA
```

Condition order matters because the first match wins. Put the narrowest condition first, or a broader one will shadow it.

```r title="First matching condition wins"
y <- c(3, 7, 12)
fcase(
  y > 5,  "big",
  y > 10, "huge"
)
#> [1] NA    "big" "big"
```

Here `y > 5` is checked first, so `12` is labelled `"big"` and the `"huge"` branch is never reached.

## Try it yourself

**Try it:** Use fcase() to add a column hp_class to a data.table of mtcars: "high" when hp is at least 200, otherwise "low". Save the result to ex_dt.

```r title="Your turn: classify horsepower"
# Try it: classify hp with fcase()
ex_dt <- as.data.table(mtcars)
ex_dt[, hp_class := # your code here]

ex_dt[, .N, by = hp_class]
#> Expected: 7 high, 25 low
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(mtcars)
ex_dt[, hp_class := fcase(hp >= 200, "high", default = "low")]
ex_dt[, .N, by = hp_class]
#>    hp_class  N
#> 1:      low 25
#> 2:     high  7
```

**Explanation:** A single condition plus `default` covers both cases. `fcase()` evaluates `hp >= 200` across all 32 rows, returns `"high"` where it holds, and falls back to `"low"` everywhere else.

</details>

## Related data.table functions

**fcase() sits in data.table's family of fast, vectorized helpers.** These functions pair well with it for conditional logic and cleanup:

- `fifelse()`: the binary version, for a single condition. See [data.table fifelse in R](datatable-fifelse-in-R.html).
- `fcoalesce()`: returns the first non-`NA` value across vectors. See [data.table fcoalesce in R](datatable-fcoalesce-in-R.html).
- `frank()`: fast ranking, useful for rank-based buckets. See [data.table frank in R](datatable-frank-in-R.html).
- `shift()`: lag or lead a column before a comparison. See [data.table shift in R](datatable-shift-in-R.html).
- `uniqueN()`: count distinct values in the result. See [data.table uniqueN in R](datatable-uniqueN-in-R.html).

## FAQ

**What is the difference between fcase() and dplyr's case_when()?**

Both evaluate condition and value pairs and return the first match. `fcase()` ships with data.table and uses a `default` argument for the catch-all, while `case_when()` ships with dplyr and uses `.default` or a `TRUE ~` final branch. `fcase()` works directly inside `DT[, := ]` and needs no tidyverse load. In practice they are interchangeable in logic, so pick the one that matches the packages your project already uses.

**What does fcase() return when no condition is TRUE?**

If an element matches none of the conditions and you did not supply `default`, `fcase()` returns `NA` for that element. The `NA` is typed to match the output vector, so a character result gets `NA_character_`. To avoid silent gaps, always pass a `default` value that covers every remaining case. This is the single most common source of unexpected missing values in `fcase()` output.

**Can I use fcase() inside a data.table?**

Yes, and that is its main use. Wrap it in `DT[, newcol := fcase(...)]` to add a classified column by reference with no copy. It also respects the `by` clause, so `DT[, g := fcase(...), by = grp]` evaluates the conditions separately within each group. Any aggregate inside a condition, such as `mean(x)`, is then computed per group rather than globally.

**Is fcase() faster than nested ifelse()?**

Yes, usually by a wide margin on large vectors. Base `ifelse()` re-evaluates and allocates at every nesting level, while `fcase()` runs all branches in one optimized C pass. For a few hundred rows the difference is invisible, but on millions of rows `fcase()` is the clear choice. It also reads far better, since the branches are a flat list instead of a pyramid of nested calls.
