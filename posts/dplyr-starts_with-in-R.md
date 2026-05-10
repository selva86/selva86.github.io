---
title: "dplyr starts_with() in R: Select Columns by Prefix"
slug: "dplyr-starts_with-in-R"
description: "Use dplyr starts_with() tidyselect helper to select columns whose names start with a string in R. Covers ignore.case, vs ends_with, and 5 worked examples."
keywords: "dplyr starts_with, R starts_with select, tidyselect prefix, dplyr column prefix, starts_with ignore.case, select by prefix"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "starts_with()|tidyselect starts_with|select by prefix|dplyr starts_with|column prefix selection"
auto_link_case_sensitive: true
target_keyword: "dplyr starts_with"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr starts_with() in R: Select Columns by Prefix

<p class="lead">The <code>starts_with()</code> helper in dplyr selects columns whose names START WITH a given string. It is the most common tidyselect pattern for column-name-based selection.</p>

[QUICK ANSWER]
df |> select(starts_with("score_"))         # all columns starting with "score_"
df |> select(starts_with("X"))              # case-sensitive by default
df |> select(starts_with("x", ignore.case = TRUE))
df |> mutate(across(starts_with("score_"), ~ .x * 100))
df |> select(-starts_with("temp_"))         # drop columns with that prefix

[DECISION TREE: Is starts_with() the right tool?]
- columns whose names start with X: starts_with("X")
- end with: ends_with("X")
- contain anywhere: contains("X")
- regex match: matches("regex")
- exact list: all_of(c("a","b"))
- ignore case: starts_with("x", ignore.case = TRUE)

## What starts_with() does in one sentence

**`starts_with(match)` selects columns whose names start with the literal string `match`.** Used inside `select`, `across`, `pick`, and other tidyselect-aware verbs.

## Syntax

**`starts_with(match, ignore.case = TRUE, vars = NULL)`. The default IS case-insensitive.**

```r title="All columns starting with 'sepal'"
library(dplyr)

iris |>
  select(starts_with("Sepal")) |>
  head(3)
#>   Sepal.Length Sepal.Width
#> 1          5.1         3.5
#> 2          4.9         3.0
#> 3          4.7         3.2
```

[TIP]
**`starts_with()` is CASE-INSENSITIVE by default (unlike base R's `startsWith()`).** Pass `ignore.case = FALSE` for strict matching.

## Five common patterns

### 1. Select by prefix

```r title="All score_ columns"
df <- tibble(id = 1:3, score_math = c(90, 85, 92), score_lang = c(88, 91, 87))

df |>
  select(starts_with("score_"))
#>   score_math score_lang
#> 1         90         88
```

### 2. Apply across by prefix

```r title="Scale all score_ columns"
df |>
  mutate(across(starts_with("score_"), ~ .x / 100))
```

### 3. Drop by prefix

```r title="Remove all temp_ columns"
df |>
  select(-starts_with("temp_"))
```

### 4. Case-sensitive matching

```r title="ignore.case = FALSE for strict"
df <- tibble(X1 = 1, x2 = 2, X3 = 3)
df |> select(starts_with("X", ignore.case = FALSE))
#>   X1 X3   (x2 dropped)
```

### 5. Combine with other helpers

```r title="prefix AND numeric"
df |>
  select(starts_with("score_") & where(is.numeric))
```

[KEY INSIGHT]
**`starts_with()` matches LITERAL strings, not regex.** For regex matching, use `matches()`. For substring (anywhere in name), use `contains()`.

## starts_with() vs ends_with() vs contains() vs matches()

**Four name-based tidyselect helpers.**

| Helper | Matches |
|---|---|
| `starts_with("x")` | Names starting with "x" |
| `ends_with("y")` | Names ending with "y" |
| `contains("ab")` | Names containing "ab" anywhere |
| `matches("regex")` | Names matching regex |

When to use which:

- `starts_with` for prefix patterns (most common).
- `ends_with` for suffix patterns.
- `contains` for substring.
- `matches` for regex.

## A practical workflow

**The "transform all X_ columns" pattern is starts_with's killer use case.**

```r
survey_data |>
  mutate(across(starts_with("q"), as.factor)) |>
  mutate(across(starts_with("score_"), ~ .x / 100))
```

Convert all q* columns to factor; scale all score_* columns.

## Common pitfalls

**Pitfall 1: starts_with is case-INSENSITIVE by default.** This differs from base R's `startsWith` which is case-sensitive. If you need strict matching, pass `ignore.case = FALSE`.

**Pitfall 2: not regex.** `starts_with("a.")` matches names starting with the literal "a." (period included), not "a" followed by any character. Use `matches("^a.")` for regex.

[WARNING]
**`starts_with()` accepts a SINGLE string OR a character vector.** Passing a vector matches any of the prefixes: `starts_with(c("a_","b_"))` selects names starting with "a_" OR "b_".

## Try it yourself

**Try it:** Select all mtcars columns whose names start with "m". Save to `ex_m_cols`.

```r title="Your turn: select 'm' columns"
ex_m_cols <- mtcars |>
  # your code here

names(ex_m_cols)
#> Expected: mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_m_cols <- mtcars |>
  select(starts_with("m"))

names(ex_m_cols)
#> [1] "mpg"
```

**Explanation:** Only `mpg` starts with "m" (case-insensitive default).

</details>

## Related tidyselect helpers

After mastering starts_with, look at:

- `ends_with()`: suffix matching
- `contains()`: substring matching
- `matches()`: regex matching
- `everything()`: all remaining
- `where()`: type / predicate
- `all_of()` / `any_of()`: explicit vector

For combining helpers, use `&` (and), `|` (or), `!` (not).

## FAQ

**What does starts_with do in dplyr?**

`starts_with(match)` selects columns whose names start with the string `match`. Tidyselect helper for prefix-based selection.

**Is starts_with case-sensitive?**

No, by default it is case-insensitive. Pass `ignore.case = FALSE` for strict matching.

**Can starts_with take multiple prefixes?**

Yes. Pass a character vector: `starts_with(c("a_","b_"))` matches names starting with either prefix.

**What is the difference between starts_with and matches?**

starts_with matches a literal prefix. matches uses regex. `starts_with("a.")` matches "a." literally; `matches("^a.")` matches "a" followed by any character.

**How do I drop columns by prefix?**

`select(-starts_with("temp_"))`. The minus sign inverts the selection.
