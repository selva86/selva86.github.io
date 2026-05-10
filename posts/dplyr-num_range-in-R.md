---
title: "dplyr num_range() in R: Select Numeric-Suffixed Columns"
slug: "dplyr-num_range-in-R"
description: "Use dplyr num_range() tidyselect helper to select columns with a prefix and numeric suffix in R. Covers width, padding, vs matches, 5 worked examples."
keywords: "dplyr num_range, R num_range tidyselect, num_range width, dplyr numeric column suffix, q1 q2 q3 select, num_range padding"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "num_range()|tidyselect num_range|numeric suffix select|q1 q2 columns|num_range width"
auto_link_case_sensitive: true
target_keyword: "dplyr num_range"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr num_range() in R: Select Numeric-Suffixed Columns

<p class="lead">The <code>num_range()</code> helper in dplyr selects columns with a prefix followed by a numeric range, like <code>q1, q2, q3</code> or <code>year_2020, year_2021</code>. It is the explicit numeric-suffix tidyselect helper.</p>

[QUICK ANSWER]
df |> select(num_range("q", 1:5))             # q1, q2, q3, q4, q5
df |> select(num_range("year_", 2020:2024))   # year_2020 to year_2024
df |> select(num_range("Q", 1:10, width = 2)) # Q01, Q02, ..., Q10 (padded)
df |> select(matches("^q\\d+$"))               # regex alternative
df |> select(starts_with("q"))                 # less precise alternative

[DECISION TREE: Is num_range() the right tool?]
- prefix + integer suffix: num_range("q", 1:5)
- with zero-padding: num_range("q", 1:9, width = 2) -> q01..q09
- range with prefix: num_range("year_", 2020:2024)
- regex alternative: matches("^q\\d+$")
- prefix only: starts_with("q")

## What num_range() does in one sentence

**`num_range(prefix, range, width = NULL)` selects columns named `prefix` followed by an integer in `range`, optionally zero-padded to `width` digits.** Matches `q1, q2, q3` or `Q01, Q02` depending on width.

## Syntax

**`num_range(prefix, range, width = NULL)`. width pads with leading zeros if set.**

```r title="Quarterly columns"
library(dplyr)

df <- tibble(id = 1:3, q1 = 10:12, q2 = 20:22, q3 = 30:32, q4 = 40:42)

df |>
  select(num_range("q", 1:3))
#>   q1 q2 q3
#> 1 10 20 30
```

[TIP]
**Use num_range when column names follow a strict numeric-suffix pattern.** Cleaner than regex matches; more precise than starts_with.

## Five common patterns

### 1. Sequential quarters

```r title="q1 to q4"
df |> select(num_range("q", 1:4))
```

### 2. Year-range

```r title="Year 2020 to 2024"
df |> select(num_range("year_", 2020:2024))
```

### 3. Zero-padded

```r title="Q01, Q02, ... Q10"
df |> select(num_range("Q", 1:10, width = 2))
#> Matches Q01 through Q10
```

### 4. Apply across to numeric-suffixed

```r title="Scale all q1-q5"
df |>
  mutate(across(num_range("q", 1:5), ~ .x * 100))
```

### 5. Drop a numeric range

```r title="Remove q1-q3"
df |> select(-num_range("q", 1:3))
```

[KEY INSIGHT]
**`num_range` is more EXPLICIT than `matches("^q\\d+$")`.** With num_range you specify exactly which numbers; with matches you'd accept any digit. For known fixed ranges, num_range is safer.

## num_range() vs matches() vs starts_with()

| Helper | Precision | Best for |
|---|---|---|
| `num_range("q", 1:5)` | Exact range | Known numeric suffixes |
| `matches("^q\\d+$")` | Any digit | Variable-length suffixes |
| `starts_with("q")` | Any "q*" | Imprecise, may include qa/qb |

When to use which:

- num_range for KNOWN ranges with sequential integers.
- matches for unknown numbers of unknown widths.
- starts_with for general prefix matching.

## A practical workflow

**Use num_range for survey questions or time-series with structured names.**

```r
# Q1, Q2, ..., Q20 -> all to factor
survey |>
  mutate(across(num_range("Q", 1:20), as.factor))

# Year-stamped revenue columns
sales |>
  rowwise() |>
  mutate(total_5yr = sum(c_across(num_range("rev_", 2020:2024)))) |>
  ungroup()
```

## Common pitfalls

**Pitfall 1: width parameter must match.** If columns are q01, q02, ..., use `num_range("q", 1:9, width = 2)`. Without width, "q01" doesn't match "q" + 1.

**Pitfall 2: skipped numbers.** `num_range("q", c(1, 3, 5))` works for non-contiguous. Just pass any integer vector.

[WARNING]
**`num_range()` requires the suffix to be EXACTLY numeric — no other characters.** "q1_score" is NOT matched by `num_range("q", 1:10)`. For mixed patterns, use `matches`.

## Try it yourself

**Try it:** Build a tibble with columns `q1` through `q5` and select only `q2, q3, q4`. Save to `ex_mid`.

```r title="Your turn: middle quarters"
df <- tibble(id = 1, q1 = 1, q2 = 2, q3 = 3, q4 = 4, q5 = 5)

ex_mid <- df |>
  # your code here

names(ex_mid)
#> Expected: c("q2","q3","q4")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mid <- df |>
  select(num_range("q", 2:4))

names(ex_mid)
#> [1] "q2" "q3" "q4"
```

**Explanation:** num_range with range 2:4 picks q2, q3, q4 exactly.

</details>

## Related tidyselect helpers

After mastering num_range, look at:

- `starts_with()` / `ends_with()` / `contains()` / `matches()`: name-based
- `everything()`: all remaining
- `where()`: predicate
- `all_of()` / `any_of()`: explicit name vector

For irregular numeric patterns (e.g., q1, q2, q5, q10), num_range with a custom integer vector handles non-contiguous ranges.

## FAQ

**What does num_range do in dplyr?**

`num_range(prefix, range, width)` selects columns whose names are `prefix` followed by an integer from `range`. Optionally zero-padded to `width` digits.

**How do I match q01, q02, ... q10 with num_range?**

Pass `width = 2`: `num_range("q", 1:10, width = 2)`. width pads with leading zeros.

**What is the difference between num_range and matches?**

num_range is for KNOWN numeric ranges. matches uses regex for unknown / variable patterns. num_range is more explicit and safer for fixed ranges.

**Can num_range handle non-contiguous integers?**

Yes. `num_range("q", c(1, 3, 5))` selects q1, q3, q5 only.

**What if my prefix has special regex characters?**

num_range treats the prefix as LITERAL, so "q." is fine (matches "q." prefix). For regex, use matches.
