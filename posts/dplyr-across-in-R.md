---
title: "dplyr across() in R: Apply Functions to Many Columns"
slug: "dplyr-across-in-R"
description: "Use dplyr across() inside mutate() and summarise() to apply a function to many columns. Covers where(), tidyselect, naming patterns, and 6 worked examples."
keywords: "dplyr across, dplyr across examples, mutate across, summarise across, dplyr where, apply function to multiple columns, replace mutate_at"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "across()|dplyr across|dplyr::across()|apply to multiple columns|across columns"
auto_link_case_sensitive: true
target_keyword: "dplyr across"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr across() in R: Apply Functions to Many Columns

<p class="lead">The <code>across()</code> function inside <code>mutate()</code> or <code>summarise()</code> applies a function to many columns at once, replacing the older <code>_at</code>, <code>_if</code>, and <code>_all</code> variants. Pair it with <code>where()</code>, <code>starts_with()</code>, or any tidyselect helper.</p>

[QUICK ANSWER]
mutate(df, across(where(is.numeric), scale))           # all numeric cols
summarise(df, across(c(mpg, hp), mean))                # specific cols
summarise(df, across(where(is.numeric), mean, .names = "avg_{.col}"))  # rename
mutate(df, across(starts_with("x"), ~ . * 100))        # by prefix
summarise(df, across(where(is.numeric), list(mean = mean, sd = sd)))   # multi fn
mutate(df, across(everything(), as.character))         # all cols
mutate(df, across(c(a, b), ~ replace_na(., 0)))        # custom lambda

[DECISION TREE: Is across() the right tool?]
- apply one function to many cols: mutate(df, across(where(is.numeric), scale))
- single column transform: mutate(df, x = scale(x))
- different function per column: mutate(df, x = scale(x), y = log(y))
- rename, do not transform: rename_with(df, ~ paste0("v_", .))
- pivot many cols to long format: pivot_longer(df, cols = everything())
- count distinct values per col: summarise(df, across(everything(), n_distinct))
- conditional replace per col: mutate(df, across(where(is.numeric), ~ replace_na(., 0)))

## What across() does in one sentence

**`across()` is the bulk-column verb.** Inside `mutate()` or `summarise()`, you give it a column selector (tidyselect helper) and one function (or list of functions). dplyr applies the function to every selected column and either replaces the columns (in mutate) or produces summary columns (in summarise).

Unlike the deprecated `mutate_at()`, `mutate_if()`, `mutate_all()` family, `across()` uses the same tidyselect grammar as `select()`, so the same `where()`, `starts_with()`, `c(a, b)` syntax works everywhere.

## Syntax

**`across()` takes a column selector plus a function (or list of functions).** The selector can be tidyselect helpers, bare names, or a vector. The function can be a name, a lambda (`~ . * 2`), or a named list of functions for multi-output.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

mtcars |> select(mpg, hp, wt) |> head(3)
#>                    mpg  hp    wt
#> Mazda RX4         21.0 110 2.620
#> Mazda RX4 Wag     21.0 110 2.875
#> Datsun 710        22.8  93 2.320
```

The full signature is:

```
across(.cols = everything(), .fns = NULL, ..., .names = NULL, .unpack = FALSE)
```

`.cols` selects columns via tidyselect. `.fns` is the function or list of functions. `.names` is a glue template for output column names (default keeps original names for one-fn, appends fn name for multi-fn).

[TIP]
**`across()` only works INSIDE another dplyr verb.** You cannot call `across(df, ...)` directly. It must be wrapped: `mutate(df, across(...))`, `summarise(df, across(...))`, or `filter(df, if_any(across(...)))`.

## Six common patterns

### 1. Apply one function to all numeric columns

```r title="Standardize all numeric columns"
mtcars |>
  mutate(across(where(is.numeric), scale)) |>
  select(mpg, hp) |>
  head(3)
#>                          mpg          hp
#> Mazda RX4         0.15088482 -0.53509284
#> Mazda RX4 Wag     0.15088482 -0.53509284
#> Datsun 710        0.44954345 -0.78304046
```

`where(is.numeric)` selects columns where the predicate returns TRUE. `scale()` is applied to each.

### 2. Specific columns by name

```r title="Mean of mpg, hp, wt only"
mtcars |>
  summarise(across(c(mpg, hp, wt), mean))
#>        mpg       hp       wt
#> 1 20.09062 146.6875 3.21725
```

Pass a vector of bare names to `c(...)` to target specific columns.

### 3. Multiple functions producing multiple outputs

```r title="Mean and SD for every numeric column"
mtcars |>
  summarise(across(c(mpg, hp), list(mean = mean, sd = sd)))
#>   mpg_mean   mpg_sd  hp_mean    hp_sd
#> 1 20.09062 6.026948 146.6875 68.56287
```

A named list of functions creates one output column per (input column, function) pair. Default naming is `{.col}_{.fn}`.

### 4. Custom lambda with anonymous function

```r title="Multiply numeric columns by 100"
mtcars |>
  mutate(across(c(mpg, hp), ~ . * 100)) |>
  select(mpg, hp) |>
  head(3)
#>                  mpg    hp
#> Mazda RX4       2100 11000
#> Mazda RX4 Wag   2100 11000
#> Datsun 710      2280  9300
```

The `~ . * 100` is shorthand for `function(x) x * 100`. The `.` placeholder refers to each column's values.

### 5. Custom output names with .names

```r title="Prefix each summary with avg_"
mtcars |>
  summarise(across(where(is.numeric), mean, .names = "avg_{.col}")) |>
  select(avg_mpg, avg_hp)
#>    avg_mpg  avg_hp
#> 1 20.09062 146.6875
```

`.names` is a glue template. `{.col}` is the input column name; `{.fn}` is the function name (when using a named list).

### 6. Conditional replacement across columns

```r title="Replace NA with 0 in numeric columns"
df <- tibble(a = c(1, NA, 3), b = c(NA, 5, 6), name = c("x","y","z"))
df |>
  mutate(across(where(is.numeric), ~ replace_na(., 0)))
#> # A tibble: 3 x 3
#>       a     b name
#>   <dbl> <dbl> <chr>
#> 1     1     0 x
#> 2     0     5 y
#> 3     3     6 z
```

The lambda receives each numeric column; non-numeric columns (`name`) are untouched.

[KEY INSIGHT]
**`across()` made `mutate_at()`, `mutate_if()`, and `mutate_all()` obsolete in dplyr 1.0+.** The old code `mutate_if(df, is.numeric, scale)` becomes `mutate(df, across(where(is.numeric), scale))`. Same result, more composable, fewer functions to remember. If you see _at/_if/_all in tutorials from 2019 or earlier, they still work but are superseded.

## across() vs the legacy _at/_if/_all family

**`across()` is the modern unified replacement.** The legacy functions still work but are not recommended for new code.

| Task | Modern (across) | Legacy (_at / _if / _all) |
|---|---|---|
| Apply to numeric | `mutate(across(where(is.numeric), scale))` | `mutate_if(is.numeric, scale)` |
| Apply to specific | `mutate(across(c(a,b), log))` | `mutate_at(vars(a,b), log)` |
| Apply to all | `mutate(across(everything(), as.character))` | `mutate_all(as.character)` |
| Multi-function | `summarise(across(., list(m=mean, s=sd)))` | `summarise_at(vars(...), funs(mean, sd))` |
| Rename outputs | `summarise(across(., mean, .names="avg_{.col}"))` | (awkward) |

When to use which:

- Always use `across()` in new code.
- The legacy functions still exist in dplyr for backward compatibility but produce deprecation warnings.

## Common pitfalls

**Pitfall 1: forgetting that `across()` returns columns, not a single value.** Inside `summarise()`, `across(c(mpg, hp), mean)` returns TWO columns (`mpg`, `hp`), not a vector. The result is a row of summaries, not a single number.

**Pitfall 2: trying to use `across()` outside a verb.** `across(df, ...)` errors. It is a helper that only works inside `mutate()`, `summarise()`, `filter(if_any(...))`, etc.

[WARNING]
**The lambda `~ . * 2` uses `.` as the column placeholder.** If you want to write a multi-step transform, you must wrap in braces: `~ { .x <- as.numeric(.); .x * 2 }`. The default `.` is fine for one-step expressions; for multi-step, use a named function or `function(x) {...}` syntax.

**Pitfall 3: `where()` predicate is column-level, not value-level.** `where(is.na)` selects columns that are ENTIRELY NA, not columns containing any NA. To check for any NA in a column, use `where(~ any(is.na(.)))`.

## Try it yourself

**Try it:** Use `across()` to compute the mean of every numeric column in `mtcars`. Save the result to `ex_means`.

```r title="Your turn: bulk numeric mean"
# Try it: mean of all numeric columns
ex_means <- # your code here

ex_means
#> Expected: a 1-row tibble with one column per numeric variable
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_means <- mtcars |> summarise(across(where(is.numeric), mean))
ex_means
#>        mpg     cyl     disp       hp     drat       wt    qsec      vs      am    gear   carb
#> 1 20.09062 6.1875 230.7219 146.6875 3.596563 3.21725 17.84875 0.4375 0.40625 3.6875 2.8125
```

**Explanation:** `across(where(is.numeric), mean)` selects every column where `is.numeric()` returns TRUE, then applies `mean()` to each. The output is one summary column per input column.

</details>

## Related dplyr functions

After mastering `across()`, look at:

- `where()`: column-level predicate selector inside tidyselect
- `if_any()`, `if_all()`: row-level predicate combiners (use inside `filter()`)
- `pick()`: tidyselect inside `arrange()` and `summarise()` to select column subsets
- `rename_with()`: rename columns by applying a function to names
- Legacy `_at`/`_if`/`_all`: avoid in new code, but readable in old codebases

For multi-column transformations that need different functions per column, just write multiple `name = expression` pairs inside `mutate()` directly.

## FAQ

**What is the difference between mutate_if and across in dplyr?**

`mutate_if(df, is.numeric, scale)` is the legacy syntax (dplyr 0.x). `mutate(df, across(where(is.numeric), scale))` is the modern equivalent (dplyr 1.0+). Same result, but `across()` is more composable and uses the unified tidyselect grammar.

**How do I use across with multiple functions in dplyr?**

Pass a named list: `summarise(df, across(where(is.numeric), list(mean = mean, sd = sd, n = ~ sum(!is.na(.)))))`. The result has one column per (input column, function) pair, named `{.col}_{.fn}` by default.

**Can I use across inside filter?**

Not directly. Use `if_any()` or `if_all()`: `filter(df, if_any(c(a, b), ~ . > 0))` keeps rows where at least one of `a` or `b` is positive. `if_all()` requires all selected columns to satisfy the predicate.

**Why does my across call return weird column names?**

If you pass a named list of functions, output is `{.col}_{.fn}`. If you pass a single function, output keeps the original column name (overwriting them). If you want custom names, use the `.names` argument with a glue template: `.names = "z_{.col}"`.

**Does across work with character columns?**

Yes, but you need to select them explicitly: `across(where(is.character), toupper)`. By default `where(is.numeric)` skips character columns. Use `where(is.character)` or `c(name1, name2)` to target specifics.
