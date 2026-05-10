---
title: "dplyr recode() in R: Map Old Values to New (Superseded)"
slug: "dplyr-recode-in-R"
description: "Use dplyr recode() to map old values to new values in R. Covers .default, factor handling, recode vs case_match, why it is superseded, and 5 examples."
keywords: "dplyr recode, R recode values, recode vs case_match, recode factor levels, dplyr value mapping, recode default, recode superseded"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "recode()|dplyr recode|recode vs case_match|recode factor|recode_factor|map old to new"
auto_link_case_sensitive: true
target_keyword: "dplyr recode"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr recode() in R: Map Old Values to New (Superseded)

<p class="lead">The <code>recode()</code> function in dplyr maps old values to new values, providing a quick way to relabel categorical data. As of dplyr 1.1, it is superseded by <code>case_match()</code>; existing code still works but new code should use case_match.</p>

[QUICK ANSWER]
recode(x, "a" = "Apple", "b" = "Banana")     # value -> value
recode(x, "a" = "Apple", .default = "Other") # default for unmatched
recode(num, `1` = "low", `2` = "high")       # numeric keys: backticks
case_match(x, "a" ~ "Apple", "b" ~ "Banana") # modern equivalent
forcats::fct_recode(f, Apple = "a")          # factor-aware
recode_factor(x, "a" = "Apple")              # returns factor

[DECISION TREE: Is recode() the right tool?]
- new code, value mapping: case_match() (preferred)
- legacy code, value mapping: recode() (still works)
- factor levels: forcats::fct_recode() (factor-aware)
- 3+ conditions, not just values: case_when()
- 2 outcomes only: if_else()
- text replacement (regex): stringr::str_replace()

## What recode() does in one sentence

**`recode(x, old1 = new1, old2 = new2, ..., .default = NULL)` returns x with each `old` value replaced by `new`.** Unmatched values are kept (or set to `.default` if specified).

`recode()` is "superseded" since dplyr 1.1, meaning `case_match()` is recommended for new code. recode still works and existing pipelines need no changes.

## Syntax

**`recode(.x, ..., .default = NULL, .missing = NULL)`. The `...` are `old = new` named arguments.**

```r title="Map letters to fruit names"
library(dplyr)

x <- c("a", "b", "c", "d")

recode(x, "a" = "Apple", "b" = "Banana")
#> [1] "Apple"  "Banana" "c"      "d"
```

[TIP]
**For new code, prefer `case_match()` over `recode()`.** Same result, formula syntax, more flexible (supports `c()` for multi-value mapping in one branch).

## Five common patterns

### 1. Simple value relabeling

```r title="Two replacements; rest kept"
x <- c("a", "b", "c", "d", "a")

recode(x, "a" = "Apple", "b" = "Banana")
#> [1] "Apple"  "Banana" "c"      "d"      "Apple"
```

### 2. Default for unmatched

```r title="Catch-all via .default"
x <- c("a", "b", "c", "d")

recode(x, "a" = "Apple", "b" = "Banana", .default = "Other")
#> [1] "Apple"  "Banana" "Other"  "Other"
```

### 3. Numeric keys

```r title="Recode integer codes (need backticks)"
codes <- c(1, 2, 3, 1, 2)

recode(codes, `1` = "low", `2` = "med", `3` = "high")
#> [1] "low"  "med"  "high" "low"  "med"
```

Backticks are required because R names cannot start with digits.

### 4. Recode within mutate

```r title="Add a relabeled column"
df <- data.frame(grade = c("A", "B", "C", "F"))

df |>
  mutate(label = recode(grade, "A" = "excellent", "B" = "good", "C" = "ok", .default = "fail"))
```

### 5. Factor-aware (recode_factor)

```r title="Returns a factor instead of character"
g <- c("a", "b", "c")
f <- recode_factor(g, "a" = "Alpha", "b" = "Beta")
class(f)
#> [1] "factor"
levels(f)
#> [1] "Alpha" "Beta"  "c"
```

`recode_factor` returns a factor with levels in the order you defined them.

[KEY INSIGHT]
**recode is superseded; case_match is the modern equivalent.** They are functionally similar; the difference is `case_match` uses formulas (`val ~ out`), supports multi-value matching (`c("a","b") ~ "X"`), and integrates better with newer dplyr APIs. Existing recode calls are NOT broken; just don't write new ones.

## recode() vs case_match() vs forcats::fct_recode()

**Three value-mapping functions in the tidyverse.**

| Function | Type-safe | Factor-aware | Status |
|---|---|---|---|
| `recode()` | No | No (use recode_factor) | Superseded |
| `case_match()` | Yes | No | Recommended (1.1+) |
| `forcats::fct_recode()` | n/a | Yes (factor-aware) | Recommended for factors |
| `case_when(x == "a" ~ "X")` | Yes | No | Verbose for value mapping |

When to use which:

- `case_match` for new value-mapping code on character/numeric.
- `fct_recode` for factor levels.
- `case_when` for arbitrary conditions.
- `recode` only in legacy code (no need to refactor).

## A practical workflow

**Most recode (or case_match) usage is categorical relabeling: short input domain, fixed output.**

Common variations:

- Country code -> region: `recode(code, US = "NA", CA = "NA", UK = "EU", .default = "Other")`
- Status code -> label: `recode(status, "200" = "ok", "404" = "missing", .default = "error")`
- Survey response -> numeric: `recode(resp, agree = 1, disagree = -1, .default = 0)`

For factor data, switch to `forcats::fct_recode()` which preserves factor structure and lets you reorder levels.

## Common pitfalls

**Pitfall 1: argument order matters with named args.** `recode(x, old1 = new1, old2 = new2)`. Reversing them silently changes the mapping.

**Pitfall 2: numeric keys need backticks.** `recode(x, 1 = "low")` errors. `recode(x, `1` = "low")` works. Names cannot start with a digit in R.

[WARNING]
**`recode` is superseded as of dplyr 1.1.0.** It still works and is not deprecated, but `case_match()` is preferred for new code. The dplyr team may deprecate it in a future major version.

## Why recode was superseded

**dplyr's design philosophy is "one obvious way to do it" per use case.** Before dplyr 1.1, value mapping was split across `recode` (concise, named-arg syntax) and `case_when` (verbose, condition-based). Power users wanted multi-value mapping (`c("a","b") ~ "X"`) which recode couldn't do cleanly. The team introduced `case_match` in 1.1 as the formula-syntax replacement: same conciseness as recode, plus multi-value matching, plus integration with the rest of the modern dplyr API. Old recode calls still work, so legacy pipelines need no rewrites; new code should default to case_match. Factor-aware recoding moved to the `forcats` package via `fct_recode`, which preserves factor structure properly.

## Try it yourself

**Try it:** Recode `mtcars$cyl` (4, 6, 8) into `c("small", "med", "big")`. Save to `ex_size`.

```r title="Your turn: cyl to label"
ex_size <- mtcars$cyl |>
  # your code here

head(ex_size)
#> Expected: c("med", "med", "small", ...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_size <- recode(mtcars$cyl, `4` = "small", `6` = "med", `8` = "big")
head(ex_size)
#> [1] "med"   "med"   "small" "med"   "big"   "med"

# Modern equivalent with case_match:
ex_modern <- case_match(
  mtcars$cyl,
  4 ~ "small",
  6 ~ "med",
  8 ~ "big"
)
```

**Explanation:** Backticks let you name numeric levels. case_match is the recommended replacement; recode still works.

</details>

## Related dplyr functions

After mastering recode, look at:

- `case_match()`: modern replacement
- `case_when()`: condition-based
- `if_else()`: 2-way branch
- `forcats::fct_recode()`: factor-aware version
- `forcats::fct_collapse()`: combine multiple levels into one
- `dplyr::na_if()`: convert specific value to NA

For factor cleanup, the `forcats` package has specialized tools (fct_recode, fct_collapse, fct_relevel) that recode cannot match.

## FAQ

**Is recode deprecated in dplyr?**

Superseded, not deprecated. As of dplyr 1.1, `case_match()` is the recommended replacement. recode still works; the team may deprecate it in a future major version.

**What is the difference between recode and case_match?**

Both map old values to new. recode uses `old = new` named arguments; case_match uses formula syntax `old ~ new`. case_match supports multi-value mapping naturally and integrates with the rest of the modern dplyr API.

**How do I recode numeric values with recode?**

Use backticks: `recode(x, `1` = "low", `2` = "high")`. Numeric names cannot be unquoted in R.

**What is the .default argument in recode?**

`.default = value` is the catch-all for unmatched inputs. Without it, unmatched values pass through unchanged.

**How do I recode factor levels?**

Use `forcats::fct_recode(f, NewLabel = "old_level")` for factor-aware recoding. It preserves factor structure and ordering.
