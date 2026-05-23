---
title: "Mode in R: Find the Most Common Value With Base R"
slug: "base-mode-in-R"
description: "Find the statistical mode in R using base R. tabulate() with which.max() returns the most common value. Covers ties, factors, NA handling, 5 worked examples."
keywords: "mode in R, statistical mode R, most common value R, find mode R, R mode function, mode of a vector R, multimodal R, mode by group R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "statistical mode in R|find the mode in R|most common value in R|mode of a vector|R mode function"
auto_link_case_sensitive: false
target_keyword: "mode in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Mode in R: Find the Most Common Value With Base R

<p class="lead">The mode in R is the value that appears most often in a vector, but base R has no built-in function for it. The standard recipe is <code>unique(x)[which.max(tabulate(match(x, unique(x))))]</code>, which works for numeric, character, and factor data.</p>

[QUICK ANSWER]
mode_val(x)                                # custom function (define below)
unique(x)[which.max(tabulate(match(x, unique(x))))]   # one liner, base R only
names(which.max(table(x)))                 # via table() (returns character)
unique(x)[tabulate(match(x, unique(x))) == max(tabulate(match(x, unique(x))))]   # all ties
mode_val(x[!is.na(x)])                     # mode ignoring NA
mode_val(mtcars$cyl)                       # mode of a data frame column
DescTools::Mode(x)                         # CRAN alternative (handles ties)

[DECISION TREE: Is the statistical mode the right summary?]
- most common value in a vector: unique(x)[which.max(tabulate(match(x, unique(x))))]
- middle value (robust to outliers): median(x)
- arithmetic average: mean(x)
- frequency of every value: table(x)
- storage type of an object (not statistical): typeof(x) or class(x)
- most common category in a factor: names(which.max(table(f)))
- top N most common values: head(sort(table(x), decreasing = TRUE), 5)

## What the mode means in R

**The statistical mode is the value with the highest frequency in a vector.** Unlike the mean and median, it works on numeric, character, factor, and logical data, because frequency does not require a numeric scale.

A vector can have one mode (unimodal), two modes (bimodal), or none (every value unique). Base R has no function that returns the statistical mode directly; the built-in `mode()` does something completely different.

## Why mode() in R does not do what you expect

**Base R's `mode()` function returns the internal storage type, not the most common value.** This is the single most common source of confusion when newcomers search for "mode in R".

```r title="What base R mode() actually returns"
x <- c(1, 2, 2, 3, 3, 3, 4)
mode(x)
#> [1] "numeric"

mode(c("a", "b", "b"))
#> [1] "character"
```

The function tells you the storage category ("numeric", "character", "list", "function", and so on), the same family of answers as `typeof()` and `class()`. To find the most common value, you need a different recipe.

[NOTE]
**`mode()` is a holdover from S, R's predecessor.** It existed before R formalized the type system, and it survives for backward compatibility. For type introspection prefer `typeof()` (which returns more specific values like "double" and "integer") or `class()` (which respects S3 dispatch).

## The base R recipe in three lines

**The one-liner combines `unique()`, `match()`, `tabulate()`, and `which.max()`.** Each function does one job: enumerate distinct values, label every observation with its index in that enumeration, count labels, then pick the most frequent.

```r title="Statistical mode in one line"
x <- c(1, 2, 2, 3, 3, 3, 4)
unique(x)[which.max(tabulate(match(x, unique(x))))]
#> [1] 3
```

For repeated use, wrap it in a function. This is the version most R users keep in their utility script.

```r title="A reusable mode() function for any vector type"
mode_val <- function(v) {
  uniq <- unique(v)
  uniq[which.max(tabulate(match(v, uniq)))]
}

mode_val(c(1, 2, 2, 3, 3, 3, 4))
#> [1] 3
```

The function works on any atomic vector type because `tabulate()` counts indices, not values, so the underlying scale does not matter.

[KEY INSIGHT]
**`tabulate(match(v, unique(v)))` is the trick.** `match()` replaces every value with its position in `unique(v)`, turning the vector into integer codes 1, 2, 3, and so on. `tabulate()` then counts how often each code appears. `which.max()` returns the position of the largest count, and the matching value comes from `unique(v)`. This pattern reappears in `factor()`, `cut()`, and `as.integer()` of a factor.

## Five common patterns

### 1. Mode of a numeric vector

**Use `mode_val()` directly on any numeric vector.** Integer and double inputs return a value of the same type.

```r title="Mode of an integer vector"
ages <- c(22, 24, 24, 25, 27, 24, 30)
mode_val(ages)
#> [1] 24
```

The function returns 24 because it occurs three times, more than any other value. If you also need the count, wrap with `max(tabulate(match(ages, unique(ages))))`.

### 2. Mode of a character vector

**Strings work the same way.** This is useful for finding the most common category in a survey response or label column.

```r title="Most common category in a character vector"
responses <- c("yes", "no", "yes", "maybe", "yes", "no")
mode_val(responses)
#> [1] "yes"
```

For a tabular view of all categories ranked by frequency, use `sort(table(responses), decreasing = TRUE)` instead.

### 3. Mode of a factor

**Factors return a factor element, not a level index.** This is the right behavior when the result feeds into another factor operation.

```r title="Mode of a factor variable"
cyl_factor <- factor(mtcars$cyl)
mode_val(cyl_factor)
#> [1] 8
#> Levels: 4 6 8
```

The most common cylinder count in `mtcars` is 8 (14 cars), beating 4 (11 cars) and 6 (7 cars). The result keeps the factor's levels so it can be used as a reference category in a model.

### 4. Multiple modes (ties)

**A vector can have several values tied for most common.** The one-line recipe returns only the first; to return all modes, compare counts against their maximum.

```r title="Return every value tied for most common"
x <- c(1, 2, 2, 3, 3, 4)
counts <- tabulate(match(x, unique(x)))
unique(x)[counts == max(counts)]
#> [1] 2 3
```

Both 2 and 3 appear twice. The standard `mode_val()` returns whichever is first in `unique(x)`, which is data-order-dependent. For multimodal data, use the all-ties recipe or `DescTools::Mode(x)`, which handles ties as a documented behavior.

### 5. NA handling

**`NA` values can become the mode if they are common enough.** Unlike `mean()` and `median()`, there is no `na.rm` argument because the recipe is custom; you have to drop NAs yourself before calling it.

```r title="Drop NA before computing the mode"
x <- c(2, 2, 3, NA, NA, NA)
mode_val(x)
#> [1] NA

mode_val(x[!is.na(x)])
#> [1] 2
```

Without filtering, the function returns `NA` because it occurs three times. The filtered version returns the most common non-missing value. Always check for this when the answer is unexpectedly `NA`.

## mode vs mean vs median vs table

**Each summary answers a different question about the distribution.** The table below shows which to reach for in each scenario.

| Approach | What it returns | When to use |
|---|---|---|
| `mode_val(x)` | Most common value | Categorical or discrete data, modal categories |
| `mean(x)` | Arithmetic average | Symmetric numeric data with no outliers |
| `median(x)` | Middle value | Skewed numeric data, robust center |
| `table(x)` | Frequency of every value | When you need the full distribution, not just the top |
| `sort(table(x), decreasing = TRUE)` | Ranked frequencies | Top N most common values |
| `DescTools::Mode(x)` | Modes plus ties | When ties are expected and meaningful |

For continuous data the mode is often meaningless because no value repeats; bin with `cut()` first. For ordinal or categorical data, the mode is the natural center.

## Common pitfalls

**Pitfall 1: confusing `mode()` with the statistical mode.** Calling `mode(x)` on your data returns "numeric" or "character", never a frequency. The recipe above is what users almost always want.

**Pitfall 2: ignoring ties.** `which.max()` returns only the first maximum, so `mode_val(c(1, 1, 2, 2))` returns 1, not both. If ties matter (multimodal distributions, A/B tests with equal counts), use the all-ties recipe or switch to `DescTools::Mode()`.

**Pitfall 3: counting `NA` as a value.** The recipe treats `NA` like any distinct value, so it can win the count and silently return `NA`. Filter with `x[!is.na(x)]` first.

[WARNING]
**The recipe is order-dependent for ties.** `unique(x)` preserves first appearance, so `mode_val(c(2, 2, 3, 3))` returns 2 while `mode_val(c(3, 3, 2, 2))` returns 3. This is not random, but it can look that way if your data order changes between runs. For deterministic ties pick a sorted variant: `sort(unique(x))[which.max(tabulate(match(x, sort(unique(x)))))]`.

## Try it yourself

**Try it:** Find the most common cylinder count in the `mtcars` dataset. Save the result to `ex_mode_cyl`.

```r title="Your turn: mode of mtcars$cyl"
# Use the mode_val() function defined earlier
ex_mode_cyl <- # your code here

ex_mode_cyl
#> Expected: 8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mode_val <- function(v) {
  uniq <- unique(v)
  uniq[which.max(tabulate(match(v, uniq)))]
}

ex_mode_cyl <- mode_val(mtcars$cyl)
ex_mode_cyl
#> [1] 8
```

**Explanation:** `mtcars$cyl` contains 11 fours, 7 sixes, and 14 eights. The recipe returns 8 because it has the highest frequency. The same call on `mtcars$gear` returns 3 (15 cars), confirming the function works on any numeric column.

</details>

## Related base R summary functions

After mastering the statistical mode recipe, look at:

- `mean()`: arithmetic average for symmetric data
- `median()`: middle value, robust to outliers
- `table()`: full frequency distribution of a vector
- `tabulate()`: integer-only fast counter used inside the mode recipe
- `which.max()` and `which.min()`: position of the max or min in a vector
- `summary()`: five-number summary plus mean for numeric data

For full descriptive statistics workflow, see the [descriptive statistics guide](Descriptive-Statistics-in-R.html). For ranked frequency tables with custom sort, see `dplyr::count(x, sort = TRUE)`. The official base R reference for `tabulate()` is the [R help page](https://stat.ethz.ch/R-manual/R-devel/library/base/html/tabulate.html).

## FAQ

**Is there a mode function in R?**

Yes and no. Base R has `mode()`, but it returns the internal storage type (`"numeric"`, `"character"`, `"list"`), not the most common value. There is no base-R function for the statistical mode. The community standard recipe is `unique(x)[which.max(tabulate(match(x, unique(x))))]`, often wrapped in a custom `mode_val()` function. CRAN packages `DescTools` (`Mode()`) and `modeest` (`mfv()`) provide drop-in alternatives that also handle ties.

**How do I find the most common value in a vector in R?**

Use `unique(x)[which.max(tabulate(match(x, unique(x))))]`. The recipe enumerates distinct values with `unique()`, maps every observation to an integer code with `match()`, counts the codes with `tabulate()`, and picks the code with the highest count via `which.max()`. The matching value comes back from indexing `unique(x)`. The pattern works on numeric, character, factor, and logical vectors.

**How do I compute the mode in R while ignoring missing values?**

Filter the vector before calling the recipe: `mode_val(x[!is.na(x)])`. There is no `na.rm` argument because the recipe is custom, not a built-in. `NA` is treated as a distinct value by `unique()` and `match()`, so it can dominate the count and silently return `NA` as the answer. Always check with `any(is.na(x))` before summarizing real-world data.

**How do I find the mode by group in R?**

Use `aggregate(x ~ group, data = df, FUN = mode_val)` after defining the helper. For example, `aggregate(cyl ~ gear, mtcars, mode_val)` returns the most common cylinder count per gear value. The tidyverse equivalent is `dplyr::summarise(mode_val(cyl), .by = gear)`. Combine multiple keys with `+` in the formula.

**Can a vector have more than one mode in R?**

Yes. A bimodal vector has two values tied for highest frequency; the basic recipe returns only the first because `which.max()` breaks ties by position. To return all modes, compute the counts once and compare to their max: `counts <- tabulate(match(x, unique(x))); unique(x)[counts == max(counts)]`. This returns a vector of every value tied for most common, useful for multimodal distributions, A/B test ties, and survey response analysis.
