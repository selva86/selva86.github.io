---
title: "dplyr case_match() in R: Switch-Style Value Recoding"
slug: "dplyr-case_match-in-R"
description: "Use dplyr case_match() to map specific input values to outputs in R. Covers case_match vs case_when, default, NA handling, vs recode, 5 worked examples."
keywords: "dplyr case_match, R case_match, case_match vs case_when, dplyr recode replacement, R value mapping, case_match default, switch in dplyr"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "case_match()|dplyr case_match|switch-style mapping|case_match vs case_when|value recoding"
auto_link_case_sensitive: true
target_keyword: "dplyr case_match"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr case_match() in R: Switch-Style Value Recoding

<p class="lead">The <code>case_match()</code> function in dplyr maps specific INPUT values to specific OUTPUTS. It is dplyr 1.1's switch-style sister of <code>case_when()</code>, optimized for value-based mapping.</p>

[QUICK ANSWER]
case_match(x, "a" ~ 1, "b" ~ 2)            # value -> value mapping
case_match(x, "a" ~ 1, "b" ~ 2, .default = 0) # default for unmatched
case_match(x, c("a","b") ~ "letter", c("1","2") ~ "digit")  # multi-match
case_match(x, NA ~ "missing")               # NA handling
case_when(x == "a" ~ 1, x == "b" ~ 2)      # case_when equivalent (verbose)
recode(x, a = 1, b = 2)                     # superseded; do not use

[DECISION TREE: case_match vs case_when vs if_else?]
- map specific INPUT values to outputs: case_match()
- complex CONDITIONS, not just values: case_when()
- 2 outcomes only: if_else()
- replace 1 value with another: case_match() or na_if()
- many input values, same output: case_match(c("a","b","c") ~ "X")
- recode factor levels: forcats::fct_recode()

## What case_match() does in one sentence

**`case_match(.x, val1 ~ out1, val2 ~ out2, ..., .default = NULL)` returns `out1` where `.x` equals `val1`, `out2` where it equals `val2`, etc.** Multiple input values can map to one output: `c("a", "b") ~ "letter"`.

case_match is the modern (dplyr 1.1+) replacement for `recode()`. The formula syntax matches `case_when()` so the two scale together.

## Syntax

**`case_match(.x, ..., .default = NULL, .ptype = NULL)`. Each `...` is a `value(s) ~ output` formula.**

```r title="Map letters to numbers"
library(dplyr)

x <- c("a", "b", "c", "d", NA)

case_match(
  x,
  "a" ~ 1,
  "b" ~ 2,
  .default = 0
)
#> [1] 1 2 0 0 0
```

[TIP]
**`case_match` is faster and clearer than `case_when` when matching values, NOT conditions.** For `case_when(x == "a" ~ 1, x == "b" ~ 2)`, `case_match(x, "a" ~ 1, "b" ~ 2)` is the cleaner equivalent.

## Five common patterns

### 1. Simple value mapping

```r title="Two-way value swap"
case_match(c("y", "n", "y"), "y" ~ TRUE, "n" ~ FALSE)
#> [1]  TRUE FALSE  TRUE
```

### 2. Multiple inputs to one output

```r title="Group categories"
items <- c("apple","banana","carrot","broccoli","grape")

case_match(
  items,
  c("apple","banana","grape") ~ "fruit",
  c("carrot","broccoli")      ~ "vegetable"
)
#> [1] "fruit"     "fruit"     "vegetable" "vegetable" "fruit"
```

`c(...)` on the left side groups multiple inputs to the same output.

### 3. Default for unmatched

```r title="Catch-all via .default"
codes <- c(1, 2, 3, 99)

case_match(
  codes,
  1 ~ "low",
  2 ~ "med",
  3 ~ "high",
  .default = "unknown"
)
#> [1] "low"     "med"     "high"    "unknown"
```

`.default` replaces the older `TRUE ~ value` idiom from case_when.

### 4. Explicit NA handling

```r title="Map NA to a specific value"
x <- c("a", "b", NA)

case_match(
  x,
  "a" ~ 1,
  "b" ~ 2,
  NA  ~ 0
)
#> [1] 1 2 0
```

NA on the left matches NA in the input.

### 5. Numeric recoding

```r title="Bucket integer codes"
levels <- c(1, 2, 3, 4, 5)

case_match(
  levels,
  c(1, 2)    ~ "low",
  3          ~ "med",
  c(4, 5)    ~ "high"
)
#> [1] "low"  "low"  "med"  "high" "high"
```

[KEY INSIGHT]
**`case_match()` replaces `recode()`, which is now superseded.** Both do value-based mapping; case_match has clearer syntax (formulas), supports multiple-to-one mapping naturally, and handles NA explicitly. For new code, always prefer case_match.

## case_match() vs case_when() vs recode() vs if_else()

**Four conditional / mapping tools in dplyr.**

| Function | Style | Best for | Status |
|---|---|---|---|
| `case_match(x, v ~ out)` | Value-based mapping | Mapping specific values | Recommended (1.1+) |
| `case_when(cond ~ out)` | Condition-based | Arbitrary conditions | Recommended |
| `recode(x, old = new)` | Value-based mapping | Same as case_match | Superseded |
| `if_else(cond, t, f)` | 2-way branch | Two outcomes | Recommended |

When to use which:

- `case_match` for "value -> value" mapping.
- `case_when` for arbitrary conditions (not just equality).
- `if_else` for 2-way branches.
- Avoid `recode` in new code.

## A practical workflow

**Most case_match uses are categorical recoding: short input domain, fixed output mapping.**

Common variations:

- Country code -> region: `case_match(code, c("US","CA") ~ "NA", c("UK","FR") ~ "EU", ...)`
- Survey response -> numeric: `case_match(resp, "agree" ~ 1, "neutral" ~ 0, "disagree" ~ -1)`
- Status code -> label: `case_match(status, 200 ~ "ok", c(404, 410) ~ "not found", .default = "other")`

For more dynamic mapping (read from a lookup table), use `dplyr::left_join()` with the lookup data frame instead.

## Common pitfalls

**Pitfall 1: type mismatch on outputs.** All output values must share a common type. `case_match(x, "a" ~ 1, "b" ~ "two")` errors. Use `case_match(x, "a" ~ "1", "b" ~ "two")` or convert.

**Pitfall 2: missing default value.** Without `.default`, unmatched inputs return NA. If you want a fallback, set `.default = ...`.

[WARNING]
**`case_match()` is dplyr 1.1+ only.** If you target older dplyr versions, fall back to `case_when()` with `x == value` conditions. Check `packageVersion("dplyr")` to confirm.

## Why case_match exists

**`case_match` was added in dplyr 1.1 to fill a gap.** Before it, value-based mapping was either `case_when` (verbose: `case_when(x == "a" ~ 1, x == "b" ~ 2)`) or `recode` (concise but with awkward syntax: `recode(x, a = 1, b = 2)`). case_match takes the best of both: the formula syntax of case_when, the value-mapping focus of recode, plus first-class multi-input matching with `c()`. For mapping a small fixed set of values to outputs, it is unambiguously the cleanest choice. The argument naming (`.default`, `.ptype`) follows the modern `dot-prefixed` convention dplyr uses for named arguments to avoid clashing with bare column names.

## Try it yourself

**Try it:** Map `mtcars$cyl` (4, 6, 8) to labels "small", "medium", "large". Save to `ex_size`.

```r title="Your turn: cyl-to-size label"
ex_size <- mtcars$cyl |>
  # your code here

head(ex_size)
#> Expected: c("medium", "medium", "small", ...) per row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_size <- case_match(
  mtcars$cyl,
  4 ~ "small",
  6 ~ "medium",
  8 ~ "large"
)
head(ex_size)
#> [1] "medium" "medium" "small"  "medium" "large"  "medium"
```

**Explanation:** Each cyl value maps to one label. With three explicit branches and no `.default`, every row is covered.

</details>

## Related dplyr functions

After mastering case_match, look at:

- `case_when()`: condition-based; arbitrary tests
- `if_else()`: 2-way branch
- `recode()`: superseded predecessor of case_match
- `na_if()`: convert specific value to NA
- `coalesce()`: first non-NA across vectors
- `forcats::fct_recode()`: factor-level recoding

For factor variables, `forcats::fct_recode()` may be cleaner since it preserves factor structure.

## FAQ

**What is the difference between case_match and case_when in dplyr?**

`case_match` matches VALUES; `case_when` matches CONDITIONS. `case_match(x, "a" ~ 1)` checks `x == "a"`. `case_when(x > 5 ~ 1)` checks an arbitrary condition.

**How do I map multiple values to one output in case_match?**

Use `c()` on the left: `case_match(x, c("a","b") ~ "first", c("c","d") ~ "second")`. All values in the vector map to the same output.

**What is .default in case_match?**

`.default = value` is the catch-all for inputs not matching any pattern. Without it, unmatched inputs return NA.

**How do I handle NA in case_match?**

Add `NA ~ replacement` as a branch. NA on the left matches NA in the input vector.

**Is recode() deprecated in dplyr?**

Yes, superseded since dplyr 1.1. Use `case_match()` for value mapping, `case_when()` for conditions. recode still works but is no longer recommended.
