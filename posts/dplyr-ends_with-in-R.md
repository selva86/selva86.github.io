---
title: "dplyr ends_with() in R: Select Columns by Suffix"
slug: "dplyr-ends_with-in-R"
description: "Use dplyr ends_with() tidyselect helper to select columns whose names end with a string in R. Covers ignore.case, vs starts_with, and 5 worked examples."
keywords: "dplyr ends_with, R ends_with select, tidyselect suffix, dplyr column suffix, ends_with ignore.case, select by suffix"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "ends_with()|tidyselect ends_with|select by suffix|dplyr ends_with|column suffix selection"
auto_link_case_sensitive: true
target_keyword: "dplyr ends_with"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr ends_with() in R: Select Columns by Suffix

<p class="lead">The <code>ends_with()</code> helper in dplyr selects columns whose names END WITH a given string. It is the suffix-based mirror of <code>starts_with()</code>.</p>

[QUICK ANSWER]
df |> select(ends_with("_2024"))           # all columns ending with "_2024"
df |> select(ends_with("_pct"))            # percentage columns
df |> select(ends_with("X", ignore.case = FALSE))
df |> mutate(across(ends_with("_total"), as.integer))
df |> select(-ends_with("_temp"))           # drop suffix-matched

[DECISION TREE: Is ends_with() the right tool?]
- columns whose names end with X: ends_with("X")
- start with X: starts_with("X")
- contain X anywhere: contains("X")
- regex: matches("regex")
- ignore case: default is TRUE; set FALSE for strict
- combine: ends_with("_pct") & where(is.numeric)

## What ends_with() does in one sentence

**`ends_with(match)` selects columns whose names END with the literal string `match`.** Used inside dplyr verbs that support tidyselect.

## Syntax

**`ends_with(match, ignore.case = TRUE, vars = NULL)`. Case-insensitive by default.**

```r title="All columns ending in 'Length'"
library(dplyr)

iris |>
  select(ends_with("Length")) |>
  head(3)
#>   Sepal.Length Petal.Length
#> 1          5.1          1.4
#> 2          4.9          1.4
#> 3          4.7          1.3
```

[TIP]
**Use ends_with for naming conventions like `_2024`, `_pct`, `_total`, `_id`.** Common in tidy data with descriptive suffixes.

## Five common patterns

### 1. Select by suffix

```r title="All _2024 columns"
df |>
  select(ends_with("_2024"))
```

### 2. Apply transformation by suffix

```r title="Scale all _pct columns"
df |>
  mutate(across(ends_with("_pct"), ~ .x / 100))
```

### 3. Drop by suffix

```r title="Remove all _temp columns"
df |>
  select(-ends_with("_temp"))
```

### 4. Strict matching

```r title="Case-sensitive"
df <- tibble(score_X = 1, score_x = 2)
df |> select(ends_with("X", ignore.case = FALSE))
#>   score_X
```

### 5. Combine with other helpers

```r title="Suffix AND numeric"
df |>
  select(ends_with("_total") & where(is.numeric))
```

[KEY INSIGHT]
**`ends_with()` matches LITERAL strings.** For regex suffix patterns, use `matches("_\\d{4}$")` to match `_` followed by 4 digits at end.

## ends_with() vs starts_with() vs contains() vs matches()

| Helper | Matches |
|---|---|
| `starts_with("x")` | Names starting with "x" |
| `ends_with("y")` | Names ending with "y" |
| `contains("ab")` | Names containing "ab" |
| `matches("regex")` | Regex match |

Use ends_with for suffix-based; starts_with for prefix; contains for substring; matches for regex.

## A practical workflow

**Use ends_with for time-stamped or unit-suffixed columns.**

```r
sales |>
  mutate(across(ends_with("_revenue"), ~ .x / 1000)) |>
  rename_with(~ sub("_revenue", "_revenue_k", .x), ends_with("_revenue"))
```

Scale and rename simultaneously.

For period comparisons:

```r
df |>
  mutate(diff = rowSums(across(ends_with("_2024"))) -
                rowSums(across(ends_with("_2023"))))
```

## Common pitfalls

**Pitfall 1: confusing ends_with with starts_with.** Easy typo. Make sure you're matching the right side of the column name.

**Pitfall 2: case-sensitivity default.** Like starts_with, ends_with is case-insensitive by default. Pass ignore.case = FALSE for strict.

[WARNING]
**`ends_with()` accepts a single string or character vector.** Vector means "OR": `ends_with(c("_a","_b"))` matches names ending with either suffix.

## Try it yourself

**Try it:** Select all iris columns ending with "Width". Save to `ex_widths`.

```r title="Your turn: width columns"
ex_widths <- iris |>
  # your code here

names(ex_widths)
#> Expected: c("Sepal.Width", "Petal.Width")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_widths <- iris |>
  select(ends_with("Width"))

names(ex_widths)
#> [1] "Sepal.Width" "Petal.Width"
```

**Explanation:** Two iris columns end with "Width".

</details>

## Related tidyselect helpers

After mastering ends_with, look at:

- `starts_with()`: prefix mirror
- `contains()`: substring
- `matches()`: regex
- `everything()`: all remaining
- `where()`: predicate-based

## FAQ

**What does ends_with do in dplyr?**

`ends_with(match)` selects columns whose names end with the string `match`. Tidyselect helper for suffix matching.

**Is ends_with case-sensitive?**

No, by default it is case-insensitive. Pass `ignore.case = FALSE` for strict matching.

**Can ends_with take multiple suffixes?**

Yes. `ends_with(c("_a","_b"))` matches names ending with either suffix.

**What is the difference between ends_with and matches?**

ends_with is literal; matches is regex. `ends_with(".csv")` matches the literal ".csv"; `matches("\\.csv$")` does the same with regex.

**How do I drop columns by suffix?**

`select(-ends_with("_temp"))`. Minus inverts the selection.
