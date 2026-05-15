---
title: "stringr str_order() in R: Sort Index for Character Vectors"
slug: "stringr-str_order-in-R"
description: "Get the integer index that sorts a character vector with stringr str_order() in R. Locale-aware, NA handling, decreasing sort order, base order() compared."
keywords: "stringr str_order, str_order function R, stringr str_order examples, R order character vector, str_order vs order, sort strings R, locale aware string sort R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_order()|stringr str_order|stringr::str_order()|order character vector|sort character vector|sorting strings in R"
auto_link_case_sensitive: true
target_keyword: "stringr str_order"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_order() in R: Sort Index for Character Vectors

<p class="lead">stringr str_order() returns the integer permutation that puts a character vector into sorted order, like base order() but with locale-aware, predictable Unicode collation. It powers row reordering, ranking, and any task where you need the sorting positions rather than the sorted values themselves.</p>

[QUICK ANSWER]
str_order(x)                                 # ascending sort index
str_order(x, decreasing = TRUE)              # descending sort index
str_order(x, na_last = FALSE)                # NAs first
str_order(x, na_last = NA)                   # drop NAs from index
str_order(x, locale = "en")                  # English collation (default)
str_order(x, locale = "sv")                  # Swedish locale rules
str_order(x, numeric = TRUE)                 # "a10" after "a2", natural sort
x[str_order(x)]                              # equivalent to str_sort(x)

[DECISION TREE: Is str_order() the right tool?]
- positions to reorder a character vector: str_order(x)
- the sorted values themselves: str_sort(x)
- order a data frame by a string column: arrange(df, col)
- rank with ties handled: rank(x, ties.method = "average")
- compute ranks the SQL way: dplyr::dense_rank(x)
- natural sort numbers inside strings: str_order(x, numeric = TRUE)
- order by multiple keys at once: order(key1, key2)

## What str_order() does in one sentence

**str_order() turns a character vector into the integer positions that, when used as an index, produce a sorted vector.** It is the stringr-flavored sibling of base `order()` with two upgrades: locale handling is explicit and consistent across operating systems, and a `numeric = TRUE` flag enables natural sort. The output is a permutation; pass it to `[ ]` to reorder the original vector, a data frame, or any parallel structure.

```r title="Load stringr and inspect the basic output"
library(stringr)

x <- c("banana", "apple", "cherry")
str_order(x)
#> [1] 2 1 3

x[str_order(x)]
#> [1] "apple"  "banana" "cherry"
```

The integer vector `c(2, 1, 3)` reads as "to sort x, take element 2 first, then 1, then 3." Indexing the original vector with that permutation reproduces what `str_sort()` would return directly. Use str_order() when you need to reorder a different parallel object using the same sort.

## Syntax

**str_order() accepts one required argument and four tuning arguments.** Every option is keyword-driven, so call sites stay readable.

```r title="Function signature"
# str_order(
#   x,
#   decreasing = FALSE,
#   na_last    = TRUE,
#   locale     = "en",
#   numeric    = FALSE,
#   ...
# )
#
# x         : character vector
# decreasing: FALSE = ascending, TRUE = descending
# na_last   : TRUE (last), FALSE (first), NA (drop NAs)
# locale    : ICU locale string ("en", "sv", "tr", "de", ...)
# numeric   : TRUE = natural sort (digits compared numerically)
```

The default locale of `"en"` produces English collation that is stable across Windows, macOS, and Linux, which is the main reason to prefer str_order() over `order()` for cross-platform code. The next blocks walk through each argument.

```r title="Decreasing and NA placement at a glance"
y <- c("delta", NA, "alpha", "charlie", "bravo")

str_order(y)                       # NAs go to the end
#> [1]  3  5  4  1  2

str_order(y, decreasing = TRUE)    # reverse, NAs still last
#> [1]  1  4  5  3  2

str_order(y, na_last = FALSE)      # NAs first
#> [1] 2 3 5 4 1
```

`na_last` controls only NA placement, not ordering direction. Pair it with `decreasing` to get any of the four corner cases.

## Five common str_order() scenarios

**Five patterns cover almost every real call to str_order().** Each block is independent and uses built-in vectors so you can run them in the live console.

### Reorder a character vector

**Use str_order() when you need the sort positions, not just the sorted output.** Indexing with the result is what makes it different from `str_sort()`.

```r title="Sort state names alphabetically"
short <- head(state.name, 6)
short
#> [1] "Alabama"    "Alaska"     "Arizona"    "Arkansas"   "California" "Colorado"

idx <- str_order(short)
short[idx]
#> [1] "Alabama"    "Alaska"     "Arizona"    "Arkansas"   "California" "Colorado"
```

This block happens to be a no-op because `state.name` already ships sorted. Shuffle it first and the difference is obvious. The pattern matters more than this specific result.

### Order a data frame by a string column

**Pass the permutation to `[idx, ]` to reorder rows.** This is the dplyr-free version of `arrange(df, col)`.

```r title="Sort the first 5 mtcars rows by name"
cars5 <- head(mtcars, 5)
cars5$model <- rownames(cars5)

idx <- str_order(cars5$model)
cars5[idx, c("model", "mpg", "cyl")]
#>                          model  mpg cyl
#> Datsun 710          Datsun 710 22.8   4
#> Hornet 4 Drive Hornet 4 Drive 21.4   6
#> Hornet Sportabout Hornet Sportabout 18.7   8
#> Mazda RX4              Mazda RX4 21.0   6
#> Mazda RX4 Wag      Mazda RX4 Wag 21.0   6
```

`str_order()` gives the row order; the bracket subscript applies it. Pair this with several keys by stacking permutations or, more conveniently, with `dplyr::arrange()`.

### Sort in descending order

**`decreasing = TRUE` flips the index without changing locale rules.** Tie-breaking remains stable.

```r title="Top fruit names alphabetically reversed"
fruit5 <- c("apple", "banana", "cherry", "date", "elderberry")
fruit5[str_order(fruit5, decreasing = TRUE)]
#> [1] "elderberry" "date"       "cherry"     "banana"     "apple"
```

The `decreasing = TRUE` argument is preferred over `rev(str_order(x))` because it preserves stable order when input contains duplicates.

### Locale-aware sorting

**Different languages sort letters differently.** Swedish puts `å` after `z`; German treats `ö` like `o`; default English collation does neither.

```r title="Swedish vs English sort of accented letters"
nordics <- c("apel", "öl", "zebra", "åke")

nordics[str_order(nordics, locale = "en")]
#> [1] "åke"   "apel"  "öl"    "zebra"

nordics[str_order(nordics, locale = "sv")]
#> [1] "apel"  "zebra" "åke"   "öl"
```

`locale = "sv"` (Swedish) ranks `å` and `ö` after `z`, matching how a Swedish dictionary orders entries. Pick the locale that matches your readers, not your server.

[NOTE]
**The default `"en"` locale is consistent across operating systems.** Base R `order()` falls back to the system locale (`LC_COLLATE`), which is why a CSV sorted on a developer laptop sometimes reorders on a production Linux box. str_order() removes that surprise.

### Natural sort for filenames and versions

**`numeric = TRUE` compares embedded digit runs numerically.** This is what users mean by "natural sort" or "human sort".

```r title="Natural sort of version-like strings"
versions <- c("file2.txt", "file10.txt", "file1.txt", "file20.txt")

versions[str_order(versions)]                 # lexicographic
#> [1] "file1.txt"  "file10.txt" "file2.txt"  "file20.txt"

versions[str_order(versions, numeric = TRUE)] # natural
#> [1] "file1.txt"  "file2.txt"  "file10.txt" "file20.txt"
```

Lexicographic sort puts `file10` before `file2` because `"1"` precedes `"2"` character by character. Natural sort understands that `10 > 2` and reorders accordingly. Use it for filenames, version strings, and any IDs with embedded counters.

## str_order() vs order() vs str_sort() vs sort()

**Four functions order strings, but they answer two different questions in two different ways.** Picking the wrong one is the most common bug in sorting code.

| Function | Returns | Locale behavior | Best for |
|---|---|---|---|
| `str_order(x)` | integer permutation | explicit `locale =` arg, consistent across OS | reorder parallel objects, ranks |
| `str_sort(x)` | sorted character vector | same explicit locale | quick "give me the sorted values" |
| `order(x)` | integer permutation | uses system `LC_COLLATE`, varies by OS | base-only code; same idea as str_order |
| `sort(x)` | sorted character vector | uses system `LC_COLLATE` | base-only code; same idea as str_sort |

[KEY INSIGHT]
**Order returns positions; sort returns values.** Reach for `str_order()` when you need to reorder something other than `x` itself (a data frame row, a parallel vector, a ranking). Reach for `str_sort()` when all you want is the sorted strings. The choice is about what you do next, not what the values look like.

## Common pitfalls

**Three pitfalls account for most surprises with str_order().** Each has a one-line fix.

### Using order() and expecting cross-platform stability

**Base `order()` honors the system locale.** A file that sorts cleanly on macOS can shuffle on Linux because the OS-level `LC_COLLATE` differs.

```r title="Reproducible cross-OS sorting"
x <- c("Apple", "banana", "Cherry")

order(x)                            # depends on system locale
#> [1] 1 3 2

str_order(x, locale = "en")         # always the same
#> [1] 1 2 3
```

If the team ships R code that runs on developer laptops, CI runners, and production servers, default to str_order() with an explicit locale.

### Ignoring NA placement

**NAs land at the end by default, even with `decreasing = TRUE`.** That is rarely what you want when ranking real data.

```r title="Drop NAs from the sort index"
v <- c("c", NA, "a", "b")

str_order(v)                        # NAs last (default)
#> [1] 3 4 1 2

str_order(v, na_last = NA)          # exclude NAs entirely
#> [1] 3 4 1
```

Pass `na_last = NA` when you want the index to ignore missing values, or filter the input first with `v[!is.na(v)]` if downstream code expects a full permutation.

### Lexicographic vs natural sort

**Filenames and version strings need `numeric = TRUE` to sort the way users read them.** Defaults treat digit characters one at a time.

```r title="Item codes with embedded counters"
codes <- c("A2", "A10", "A1", "B2", "B10")

codes[str_order(codes)]
#> [1] "A1"  "A10" "A2"  "B10" "B2"

codes[str_order(codes, numeric = TRUE)]
#> [1] "A1"  "A2"  "A10" "B2"  "B10"
```

The first call puts `A10` before `A2`. The second compares the trailing digits as numbers and puts them in the natural order users expect.

[WARNING]
**`numeric = TRUE` only kicks in on digit runs.** Strings with no digits sort identically with both settings; strings that mix digits and letters get the natural treatment only for the digit segments. Test on representative inputs before relying on it for mixed payloads.

## Try it yourself

**Try it:** Use `state.name` to find the alphabetically last five state names (ascending order would put them at the end). Use str_order() and a slice, not str_sort().

```r title="Your turn: last five state names"
# Try it: alphabetically last 5 states
idx <- # your code here
ex_last5 <- # use idx to subset state.name
ex_last5
#> Expected: West Virginia, Wisconsin, Wyoming, ... (5 names)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
idx <- str_order(state.name)
ex_last5 <- tail(state.name[idx], 5)
ex_last5
#> [1] "Virginia"      "Washington"    "West Virginia" "Wisconsin"     "Wyoming"
```

**Explanation:** str_order() gives the ascending permutation of `state.name`. Indexing into the vector with that permutation produces the sorted names, and `tail(., 5)` keeps the last five, which are the alphabetically last five state names.

</details>

## Related stringr functions

When str_order() is not quite what you need, these are the next stops:

- [str_sort()](stringr-str_sort-in-R.html) returns the sorted vector directly instead of the permutation.
- [str_rank()](stringr-str_rank-in-R.html) returns the rank of each element (the inverse permutation).
- [str_detect()](stringr-str_detect-in-R.html) filters strings by a pattern before sorting.
- [str_to_lower()](stringr-str_to_lower-in-R.html) normalizes case for case-insensitive sorting.
- [arrange()](dplyr-arrange-in-R.html) is the dplyr verb that sorts a whole data frame by one or more columns.
- The official [stringr reference for str_order](https://stringr.tidyverse.org/reference/str_order.html) covers every argument and edge case.

## FAQ

**What is the difference between str_order() and order() in R?**

Both functions return an integer permutation that sorts a vector, but they differ in how locale is chosen. `str_order()` takes an explicit `locale =` argument and uses ICU, which gives identical results on every operating system. Base `order()` falls back to the system `LC_COLLATE`, so the same code can produce different sorts on a developer laptop and a CI runner. Use str_order() in production code where reproducibility matters.

**How do I sort a data frame by a string column with str_order()?**

Compute the permutation, then subset rows with that index. For example, `df[str_order(df$name), ]` reorders `df` by `name`. This is the base-R equivalent of `dplyr::arrange(df, name)`. For descending order, pass `decreasing = TRUE`. For multi-key sorts, prefer `arrange()` or chain `order()` with multiple columns since str_order() takes only one vector at a time.

**Does str_order() handle natural sort for filenames?**

Yes. Pass `numeric = TRUE` to compare embedded digit runs as numbers. That turns `c("file2", "file10")` into `c("file2", "file10")` in sorted order instead of the lexicographic `c("file10", "file2")`. The flag only affects digit segments; letters still sort by the chosen locale. It is the simplest way to handle version strings and counters embedded in IDs.

**Why does str_order() put NAs at the end?**

The default `na_last = TRUE` places NAs after every non-missing value, which keeps the result a complete permutation of the input. Set `na_last = FALSE` to put NAs first or `na_last = NA` to drop them from the result. Choose based on whether your downstream code wants a full-length index or a missing-free one.

**Can str_order() sort case-insensitively?**

Yes, by normalizing case before ordering. Wrap the argument in `str_to_lower()` (or `str_to_upper()`), e.g., `str_order(str_to_lower(x))`. ICU collation also exposes locale-level case folding, but the lowercase-then-order pattern is the easiest to read and works for most reporting needs.
