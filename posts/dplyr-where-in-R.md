---
title: "dplyr where() in R: Select Columns by Predicate"
slug: "dplyr-where-in-R"
description: "Use dplyr where() to select columns matching a predicate function (e.g., is.numeric, is.character) in R. Covers across, select, and 5 worked examples."
keywords: "dplyr where, R where tidyselect, where is.numeric, dplyr select by type, where character columns, tidyselect predicate"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "where()|tidyselect where|where is.numeric|select columns by type|predicate selection"
auto_link_case_sensitive: true
target_keyword: "dplyr where"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr where() in R: Select Columns by Predicate

<p class="lead">The <code>where()</code> tidyselect helper in dplyr selects columns where a PREDICATE function (like <code>is.numeric</code> or <code>is.character</code>) returns TRUE. It is the workhorse for "all numeric columns" or "all character columns" selection.</p>

[QUICK ANSWER]
df |> select(where(is.numeric))            # all numeric columns
df |> select(where(is.character))          # all character columns
df |> mutate(across(where(is.numeric), ~ .x * 2))   # multiply numerics
df |> summarise(across(where(is.numeric), mean))    # mean per numeric col
where(~ all(.x > 0))                        # custom predicate

[DECISION TREE: Is where() the right tool?]
- select all numeric / character / logical columns: where(is.numeric/character/logical)
- select by name pattern: starts_with(), ends_with(), contains(), matches()
- select all columns: everything()
- select a range: x:y
- select by custom logic per column: where(custom_predicate)

## What where() does in one sentence

**`where(.fn)` selects columns where applying `.fn` to the column returns TRUE.** It is a tidyselect helper used inside `select`, `across`, `pick`, `rename_with`, etc.

The most common use: `where(is.numeric)` to grab all numeric columns. But any predicate function works.

## Syntax

**`where(.fn)`. `.fn` is a function (or lambda) applied to each column; columns where it returns TRUE are kept.**

```r title="All numeric columns of mtcars"
library(dplyr)

mtcars |>
  select(where(is.numeric)) |>
  head(3)
#> All 11 columns of mtcars are numeric, so all selected
```

[TIP]
**Pair `where()` with `across()` for "apply this function to all numeric columns" patterns: `mutate(across(where(is.numeric), fn))`.** This is the standard dplyr idiom for type-based column transformations.

## Five common patterns

### 1. Select numeric columns

```r title="All numerics"
df <- tibble(name = c("a","b"), age = c(20, 30), city = c("NYC","LA"))

df |>
  select(where(is.numeric))
#>     age
#>      20
#>      30
```

### 2. Select character columns

```r title="All character columns"
df |>
  select(where(is.character))
#>   name city
#>      a  NYC
#>      b   LA
```

### 3. Apply function to all numerics

```r title="Z-score every numeric col"
mtcars |>
  mutate(across(where(is.numeric), ~ (.x - mean(.x)) / sd(.x)))
```

### 4. Custom predicate

```r title="Columns with no NAs"
df_with_na <- tibble(a = 1:3, b = c(1, NA, 3), c = c("x","y","z"))

df_with_na |>
  select(where(~ !any(is.na(.x))))
#>   a c
#>   1 x
#>   2 y
#>   3 z
#> (b dropped because it has NA)
```

### 5. Combine with other tidyselect helpers

```r title="Numeric columns starting with 'm'"
mtcars |>
  select(where(is.numeric) & starts_with("m"))
#>            mpg
#> ...
```

`&` and `|` combine tidyselect predicates.

[KEY INSIGHT]
**`where()` accepts ANY function returning TRUE/FALSE.** Common predicates are `is.numeric`, `is.character`, `is.logical`, `is.factor`. For custom logic, use a lambda: `where(~ all(.x > 0))` selects columns where every value is positive.

## where() vs starts_with() vs everything()

**Three tidyselect helpers, used for different selection strategies.**

| Helper | Selects by |
|---|---|
| `where(.fn)` | Predicate function on the column |
| `starts_with("x")` | Column name prefix |
| `ends_with("y")` | Column name suffix |
| `contains("ab")` | Column name substring |
| `matches("regex")` | Column name regex |
| `everything()` | All columns |
| `x:z` | Column range |

When to use which:

- `where` for type-based or content-based selection.
- `starts_with` / `ends_with` / `contains` / `matches` for name-based.
- `everything()` to grab all.

## A practical workflow

**The "type-based transformation" pattern is where's killer use case.**

```r
library(dplyr)

cleaned <- raw_data |>
  mutate(
    across(where(is.character), trimws),         # trim whitespace from chars
    across(where(is.numeric),   ~ na_if(.x, -99)) # convert -99 to NA
  )
```

Apply different transformations to different column types in one pipeline.

For audits:

```r
raw_data |>
  summarise(across(where(is.numeric), ~ sum(is.na(.x))))
```

NA counts per numeric column.

## Common pitfalls

**Pitfall 1: forgetting where with across.** `across(is.numeric, fn)` errors; `across(where(is.numeric), fn)` is correct. across needs the explicit tidyselect helper.

**Pitfall 2: predicate must return single TRUE/FALSE.** `where(~ .x > 0)` (returns a vector) errors. Use `where(~ all(.x > 0))` to reduce to single boolean.

[WARNING]
**`where()` is dplyr / tidyselect-specific.** It doesn't work in base R or with `[`-style indexing. Inside dplyr verbs, use `where`; outside, use `sapply(df, is.numeric)` or `Filter`.

## Try it yourself

**Try it:** From mtcars, select only the columns that have ALL values >= 1. Save to `ex_pos`.

```r title="Your turn: columns with positive values"
ex_pos <- mtcars |>
  # your code here

names(ex_pos)
#> Expected: column names where every row is >= 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pos <- mtcars |>
  select(where(~ all(.x >= 1)))

names(ex_pos)
#> [1] "mpg" "cyl" "disp" "hp" "drat" "wt" "qsec" "gear" "carb"
#> ("vs" and "am" are 0/1 binary; dropped)
```

**Explanation:** where(~ all(.x >= 1)) checks each column for whether every value is >= 1. vs and am have 0s and are dropped.

</details>

## Related tidyselect helpers

After mastering where, look at:

- `everything()`: all columns
- `starts_with()` / `ends_with()` / `contains()` / `matches()`: name-based
- `num_range()`: numeric-suffixed names
- `any_of()` / `all_of()`: literal column lists with strict / lax matching
- `last_col()`: rightmost column

For complex selection, combine with `&`, `|`, `!` for set operations on selections.

## Why where simplifies type-aware code

**Before tidyselect's `where`, applying a function to "all numeric columns" required `mutate_if(is.numeric, fn)` (now superseded) or hand-built loops.** `where` brings type-based selection into the unified tidyselect grammar, so it composes cleanly with name-based selectors. `select(where(is.numeric) & starts_with("score_"))` reads naturally; building the same selection without where would require multiple steps.

## FAQ

**What does where do in dplyr?**

`where(.fn)` is a tidyselect helper that selects columns where `.fn(column)` returns TRUE. Used inside `select`, `across`, `pick`, etc.

**Can I use where with custom predicates?**

Yes. `where(~ all(.x > 0))` selects columns where every value is positive. The predicate must reduce to a single TRUE/FALSE.

**How do I select all numeric columns in dplyr?**

`select(df, where(is.numeric))`. For non-numeric columns, `select(df, where(\(x) !is.numeric(x)))`.

**What is the difference between where and starts_with?**

where uses a function (predicate) on the column. starts_with uses a name prefix. They can be combined: `where(is.numeric) & starts_with("x_")`.

**Does where work outside dplyr?**

No. It is a tidyselect helper. Outside dplyr verbs, use `sapply(df, predicate)` or `Filter(predicate, df)`.
