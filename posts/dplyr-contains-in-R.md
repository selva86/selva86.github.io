---
title: "dplyr contains() in R: Select Columns by Substring"
slug: "dplyr-contains-in-R"
description: "Use dplyr contains() tidyselect helper to select columns whose names contain a substring in R. Covers ignore.case, vs matches, and 5 worked examples."
keywords: "dplyr contains, R contains tidyselect, contains substring, select column substring, dplyr contains ignore.case, contains vs matches"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "contains()|tidyselect contains|substring select|dplyr contains|column substring"
auto_link_case_sensitive: true
target_keyword: "dplyr contains"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr contains() in R: Select Columns by Substring

<p class="lead">The <code>contains()</code> helper in dplyr selects columns whose names CONTAIN a given substring (anywhere in the name). It is the substring-match tidyselect helper, complementing starts_with and ends_with.</p>

[QUICK ANSWER]
df |> select(contains("score"))             # any column with "score" in name
df |> select(contains("Length"))            # case-insensitive default
df |> select(contains("X", ignore.case = FALSE))
df |> mutate(across(contains("amt"), ~ .x * 1.1))
df |> select(-contains("temp"))             # drop substring-matched

[DECISION TREE: Is contains() the right tool?]
- substring anywhere in name: contains("text")
- prefix: starts_with("X")
- suffix: ends_with("Y")
- regex: matches("pattern")
- exact name list: all_of(c(...))
- ignore case: default TRUE

## What contains() does in one sentence

**`contains(match)` selects columns whose names contain the literal substring `match` anywhere.** Used inside dplyr verbs that support tidyselect.

## Syntax

**`contains(match, ignore.case = TRUE, vars = NULL)`. Substring match, not regex.**

```r title="All columns containing 'Length'"
library(dplyr)

iris |>
  select(contains("Length")) |>
  head(3)
#>   Sepal.Length Petal.Length
#> 1          5.1          1.4
```

[TIP]
**Use contains for words that may appear ANYWHERE in column names.** When unsure if a token is a prefix or suffix, contains catches both.

## Five common patterns

### 1. Substring match

```r title="Any 'score' column"
df <- tibble(score_a = 1, x_score = 2, total = 3)
df |> select(contains("score"))
#>   score_a x_score
```

Both "score_a" and "x_score" match.

### 2. Apply across by substring

```r title="Round all amount-related columns"
df |>
  mutate(across(contains("amt"), round, 2))
```

### 3. Drop by substring

```r title="Remove all temp-related"
df |>
  select(-contains("temp"))
```

### 4. Case-sensitive

```r title="ignore.case = FALSE"
df <- tibble(SCORE = 1, score = 2)
df |> select(contains("score", ignore.case = FALSE))
#>   score
```

### 5. Multiple substrings

```r title="contains accepts a vector"
df |> select(contains(c("score", "rating")))
#> Names containing either "score" or "rating"
```

[KEY INSIGHT]
**`contains` is the most flexible name-based selector.** It catches matches anywhere; starts_with and ends_with are stricter. Use contains when you don't know exactly where the token sits in the name.

## contains() vs starts_with() vs ends_with() vs matches()

| Helper | Matches |
|---|---|
| `starts_with("x")` | Prefix |
| `ends_with("y")` | Suffix |
| `contains("ab")` | Anywhere |
| `matches("regex")` | Regex |

Use contains when the substring's position varies.

## A practical workflow

**The "audit" pattern uses contains for fuzzy matching of token names.**

```r
df |>
  summarise(across(contains("amount"), ~ sum(is.na(.x))))
```

NA counts for any column with "amount" in the name. Robust to naming inconsistencies.

For renaming groups of columns:

```r
df |>
  rename_with(toupper, contains("score"))
```

Uppercase any column with "score" in its name.

## Common pitfalls

**Pitfall 1: contains is literal, not regex.** `contains("a.b")` matches the literal "a.b" (dot included). For regex, use matches.

**Pitfall 2: case-insensitive default surprises.** `contains("ID")` matches "user_id" and "ID_2" because of ignore.case = TRUE. Pass FALSE if strict.

[WARNING]
**`contains()` matches MULTIPLE substrings if you pass a vector.** `contains(c("a","b"))` selects names containing either "a" OR "b" — NOT both. For "AND" logic, use `&` between two contains calls.

## Try it yourself

**Try it:** Select all iris columns containing "Petal". Save to `ex_petal`.

```r title="Your turn: petal columns"
ex_petal <- iris |>
  # your code here

names(ex_petal)
#> Expected: c("Petal.Length", "Petal.Width")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_petal <- iris |>
  select(contains("Petal"))

names(ex_petal)
#> [1] "Petal.Length" "Petal.Width"
```

**Explanation:** Two iris columns contain "Petal". Sepal.* columns are excluded.

</details>

## Related tidyselect helpers

After mastering contains, look at:

- `starts_with()` / `ends_with()`: stricter position-based
- `matches()`: regex
- `everything()`: all
- `where()`: predicate
- `all_of()` / `any_of()`: explicit name vector

For complex patterns, combine helpers with `&`, `|`, `!`.

## FAQ

**What does contains do in dplyr?**

`contains(match)` selects columns whose names contain the substring `match` anywhere.

**Is contains case-sensitive?**

No by default. Pass `ignore.case = FALSE` for strict matching.

**Can contains accept multiple substrings?**

Yes. `contains(c("a","b"))` matches names containing either "a" OR "b" (not both).

**What is the difference between contains and matches?**

contains is literal substring; matches uses regex. `contains(".")` matches a literal period; `matches(".")` is "any character".

**How do I require a column to contain BOTH "a" AND "b"?**

Combine: `contains("a") & contains("b")`. Both conditions must match.
