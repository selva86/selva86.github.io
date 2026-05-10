---
title: "dplyr matches() in R: Select Columns by Regex"
slug: "dplyr-matches-in-R"
description: "Use dplyr matches() tidyselect helper to select columns by regex pattern in R. Covers ignore.case, vs contains, regex syntax, and 5 worked examples."
keywords: "dplyr matches, R tidyselect regex, matches vs contains, regex column select, dplyr regex name, matches pattern"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "matches()|tidyselect matches|regex column select|dplyr matches|column name regex"
auto_link_case_sensitive: true
target_keyword: "dplyr matches"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr matches() in R: Select Columns by Regex

<p class="lead">The <code>matches()</code> helper in dplyr selects columns whose names match a REGULAR EXPRESSION. It is the regex tidyselect helper, more flexible than starts_with, ends_with, or contains.</p>

[QUICK ANSWER]
df |> select(matches("^score"))             # regex prefix
df |> select(matches("\\d+$"))              # ends with digits
df |> select(matches("^[A-Z]_\\w+"))        # complex pattern
df |> select(matches("score|rating"))       # alternation
df |> mutate(across(matches("^q\\d+$"), as.factor))

[DECISION TREE: Is matches() the right tool?]
- regex pattern in name: matches("regex")
- literal prefix: starts_with() (faster, simpler)
- literal suffix: ends_with()
- literal substring: contains()
- exact list of names: all_of()
- predicate: where()

## What matches() does in one sentence

**`matches(match, ignore.case = TRUE, perl = FALSE, vars = NULL)` selects columns whose names match the regex `match`.** The most flexible name-based tidyselect helper.

## Syntax

**`matches(match, ignore.case = TRUE, perl = FALSE, vars = NULL)`. Standard regex.**

```r title="Columns whose names start with 'q' followed by digits"
library(dplyr)

df <- tibble(q1 = 1, q2 = 2, q12 = 3, qa = 4, score = 5)

df |>
  select(matches("^q\\d+$"))
#>   q1 q2 q12   (qa dropped — no digit; score dropped — no q)
```

[TIP]
**Reach for matches when literal helpers (starts_with, ends_with, contains) can't express the pattern.** For simple cases, the literal helpers are clearer.

## Five common patterns

### 1. Regex prefix

```r title="Same as starts_with but with regex"
df |> select(matches("^score"))
```

`^` anchors to start.

### 2. Regex suffix

```r title="Names ending in digits"
df |> select(matches("\\d+$"))
```

`$` anchors to end.

### 3. Alternation

```r title="Multiple patterns at once"
df |> select(matches("score|rating|score_pct"))
```

`|` is OR in regex.

### 4. Character class

```r title="Names with format X_word"
df |> select(matches("^[A-Z]_\\w+"))
```

`[A-Z]` is uppercase; `\\w+` is word characters.

### 5. Multi-step transform

```r title="Convert all q1, q2, ... to factor"
df |>
  mutate(across(matches("^q\\d+$"), as.factor))
```

[KEY INSIGHT]
**`matches()` is the only tidyselect helper that supports REGEX.** Everything else (starts_with, ends_with, contains) uses literal strings. Use matches when the pattern is too complex for the literals.

## matches() vs starts_with / ends_with / contains

| Helper | Matches | Best for |
|---|---|---|
| `starts_with("x")` | Literal prefix | Simple prefixes |
| `ends_with("y")` | Literal suffix | Simple suffixes |
| `contains("ab")` | Literal substring | Substring anywhere |
| `matches("regex")` | Regex | Complex patterns |

When to use which:

- Use literal helpers when possible (faster, clearer).
- Reach for matches only when regex is needed.

## A practical workflow

**Use matches for column names with structured patterns.**

```r
# Q1, Q2, ..., Q20 columns -> all factors
df |>
  mutate(across(matches("^Q\\d+$"), as.factor))

# Year-stamped columns 2020-2024
df |>
  select(matches("_(202[0-4])$"))
```

For survey data with structured names, matches is essential.

## Common pitfalls

**Pitfall 1: regex special characters.** `matches(".")` matches every column (any character). Use `matches("\\.")` for literal period.

**Pitfall 2: case-insensitive default.** `matches("score")` matches "SCORE" and "ScOrE". Pass ignore.case = FALSE for strict.

[WARNING]
**Backslashes in R strings are double-escaped.** Regex `\d` in a string is `"\\d"`. Common bug: writing `matches("\d+")` (errors).

## Try it yourself

**Try it:** Select all iris columns ending in either "Length" or "Width". Save to `ex_dims`.

```r title="Your turn: dimension columns"
ex_dims <- iris |>
  # your code here

names(ex_dims)
#> Expected: 4 columns (Sepal/Petal Length/Width)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dims <- iris |>
  select(matches("(Length|Width)$"))

names(ex_dims)
#> [1] "Sepal.Length" "Sepal.Width" "Petal.Length" "Petal.Width"
```

**Explanation:** `(Length|Width)$` matches either word at the end of the name.

</details>

## Related tidyselect helpers

After mastering matches, look at:

- `starts_with()` / `ends_with()` / `contains()`: literal helpers
- `everything()`: all remaining
- `where()`: predicate
- `all_of()` / `any_of()`: explicit list
- `num_range()`: numeric-suffixed names

For 99% of name-based selection, the literal helpers are simpler and faster than matches.

## FAQ

**What does matches do in dplyr?**

`matches(pattern)` selects columns whose names match the regex `pattern`. Tidyselect helper for regex-based selection.

**Is matches case-sensitive?**

No by default. Pass `ignore.case = FALSE` for strict matching.

**What is the difference between matches and contains?**

matches uses regex; contains is literal substring. `matches("a.b")` is "a, any char, b"; `contains("a.b")` is the literal "a.b".

**How do I anchor matches to start or end?**

Use regex anchors: `^` for start (`matches("^score")`); `$` for end (`matches("score$")`).

**Why does my pattern with backslashes error?**

R strings double-escape backslashes. Regex `\d` is the string `"\\d"`. Use `matches("\\d+")`, not `matches("\d+")`.
