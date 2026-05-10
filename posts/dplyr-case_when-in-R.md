---
title: "dplyr case_when() in R: Vectorized Multi-Way If-Else"
slug: "dplyr-case_when-in-R"
description: "Use dplyr case_when() for vectorized multi-way if-else logic in R. Covers fallback TRUE branch, NA handling, type rules, .default arg, and 6 examples."
keywords: "dplyr case_when, case_when in R, R multiple ifelse, vectorized if else R, dplyr case when examples, case_when default"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "case_when()|dplyr case_when|dplyr::case_when()|vectorized if else|multi-way if else"
auto_link_case_sensitive: true
target_keyword: "dplyr case_when"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr case_when() in R: Vectorized Multi-Way If-Else

<p class="lead">The <code>case_when()</code> function in dplyr returns one of several values based on a sequence of conditions. It is the readable alternative to nested <code>ifelse()</code> calls when you have three or more outcomes.</p>

[QUICK ANSWER]
case_when(x < 0 ~ "neg", x == 0 ~ "zero", x > 0 ~ "pos")            # 3-way
case_when(x < 0 ~ "neg", x >= 0 ~ "non-neg")                        # 2-way
case_when(x < 0 ~ "neg", TRUE ~ "non-neg")                          # with default
case_when(x < 0 ~ "neg", x == 0 ~ "zero", .default = "pos")         # explicit default
case_when(is.na(x) ~ "missing", x > 0 ~ "pos", TRUE ~ "neg-or-zero")# NA handling
mutate(df, label = case_when(...))                                  # inside mutate
case_match(x, c(1,2) ~ "low", c(3,4) ~ "high")                      # set membership

[DECISION TREE: Is case_when() the right tool?]
- 3+ branch conditions: case_when(a ~ "x", b ~ "y", c ~ "z")
- 2 branches only: if_else(cond, "x", "y")
- match against fixed values: case_match(x, c(1,2) ~ "a", c(3) ~ "b")
- numeric ranges with cuts: cut(x, breaks = c(0, 10, 20))
- recode factor levels: forcats::fct_recode(x, new = "old")
- complex multi-column logic: pipe through filter() + mutate()
- single condition, no else: if_else(cond, "x", x) (keep original)

## What case_when() does in one sentence

**`case_when()` evaluates a sequence of `condition ~ value` pairs and returns the value of the first matching condition for each element.** It is vectorized, handles NA explicitly, and enforces consistent return types. The trailing `TRUE ~ default` (or the `.default` argument) catches anything unmatched.

Unlike base R `ifelse()` for multiple branches (which requires nesting), `case_when()` reads top-to-bottom like a switch statement. Each line is one condition; the first match wins.

## Syntax

**`case_when()` takes a sequence of `condition ~ value` formulas.** Conditions are logical vectors. Values are the result for matched elements. Add `TRUE ~ default` or `.default = value` to handle the unmatched case.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

mtcars |> select(mpg, cyl) |> head(3)
#>                    mpg cyl
#> Mazda RX4         21.0   6
#> Mazda RX4 Wag     21.0   6
#> Datsun 710        22.8   4
```

The full signature is:

```
case_when(..., .default = NULL, .ptype = NULL, .size = NULL)
```

The `...` argument is a sequence of `condition ~ value` formulas, evaluated in order. `.default` (dplyr 1.1+) provides a fallback for unmatched elements. Older code uses `TRUE ~ value` for the same purpose.

[TIP]
**All return values must share a type, or be coercible to one.** `case_when(x < 0 ~ "neg", x > 0 ~ 0)` errors because "neg" is character but 0 is numeric. Either make both numeric (`-1` instead of `"neg"`) or both character (`"0"` instead of `0`). dplyr is strict here on purpose; base R `ifelse` would silently coerce.

## Six common patterns

### 1. Three-way classification

```r title="Bucket cars by mpg"
mtcars |>
  mutate(efficiency = case_when(
    mpg < 15  ~ "thirsty",
    mpg < 25  ~ "average",
    TRUE      ~ "efficient"
  )) |>
  count(efficiency)
#>   efficiency  n
#> 1    average 18
#> 2  efficient  6
#> 3    thirsty  8
```

Conditions are evaluated top to bottom; the first match wins. `mpg < 15` is checked first; if true, returns "thirsty" and stops. If false, the next condition runs.

### 2. Explicit default with .default (dplyr 1.1+)

```r title="Cleaner default with .default argument"
mtcars |>
  mutate(class = case_when(
    cyl == 4 ~ "small",
    cyl == 6 ~ "medium",
    .default = "large"
  )) |>
  count(class)
#>    class  n
#> 1  large 14
#> 2 medium  7
#> 3  small 11
```

`.default` replaces the older `TRUE ~ "large"` idiom. Both work; `.default` is more explicit and self-documenting.

### 3. Handling NA explicitly

```r title="Assign labels handling missing values"
df <- tibble(score = c(85, NA, 65, 95, 72))
df |>
  mutate(grade = case_when(
    is.na(score) ~ "missing",
    score >= 90 ~ "A",
    score >= 80 ~ "B",
    score >= 70 ~ "C",
    TRUE        ~ "D"
  ))
#> # A tibble: 5 x 2
#>   score grade
#>   <dbl> <chr>
#> 1    85 B
#> 2    NA missing
#> 3    65 D
#> 4    95 A
#> 5    72 C
```

`is.na(score)` is checked first so missing values are labeled, not silently dropped. Without this branch, NA score rows would return NA from `case_when()`.

### 4. Multiple-condition compound branches

```r title="Combine columns in conditions"
mtcars |>
  mutate(category = case_when(
    cyl == 4 & mpg > 25 ~ "small efficient",
    cyl == 4            ~ "small inefficient",
    cyl == 6 & mpg > 20 ~ "medium efficient",
    cyl == 6            ~ "medium inefficient",
    TRUE                ~ "large"
  )) |>
  count(category)
```

Each condition can reference any column or combination. Use `&` for AND, `|` for OR.

### 5. Match-based version with case_match (dplyr 1.1+)

```r title="Map specific values"
df <- tibble(grade = c("A", "B", "C", "F", "B"))
df |>
  mutate(numeric_grade = case_match(
    grade,
    "A" ~ 4,
    "B" ~ 3,
    "C" ~ 2,
    .default = 0
  ))
#> # A tibble: 5 x 2
#>   grade numeric_grade
#>   <chr>         <dbl>
#> 1 A                 4
#> 2 B                 3
#> 3 C                 2
#> 4 F                 0
#> 5 B                 3
```

`case_match()` is a specialized form for matching against fixed values. Cleaner than `case_when()` when conditions are all `x == value` style.

### 6. case_when in summarise

```r title="Per-group classification with summarise"
mtcars |>
  summarise(
    speed_class = case_when(
      mean(qsec) < 17  ~ "fast",
      mean(qsec) < 18  ~ "medium",
      .default          = "slow"
    ),
    .by = cyl
  )
#>   cyl speed_class
#> 1   6      medium
#> 2   4        slow
#> 3   8      medium
```

`case_when()` works inside `summarise()` too, where the conditions reference aggregated values.

[KEY INSIGHT]
**Conditions in `case_when()` are checked in ORDER and stop at the first match.** Order matters. Put the most specific conditions first and the most general (catchall) last. Reversing them silently produces wrong results: a `TRUE ~ "default"` placed first would short-circuit every later condition.

## case_when() vs base R nested ifelse()

**Nested `ifelse()` for 3+ branches is unreadable; `case_when()` is the modern replacement.** Both produce the same result but case_when is dramatically clearer past two branches.

| Branches | dplyr | Base R |
|---|---|---|
| 2 | `if_else(x>0, "p", "n")` | `ifelse(x>0, "p", "n")` |
| 3 | `case_when(x<0~"n", x==0~"z", TRUE~"p")` | `ifelse(x<0, "n", ifelse(x==0, "z", "p"))` |
| 4+ | `case_when(...)` reads top-down | `ifelse(...)` chains nest deeply |
| Type strict | Yes (errors on mismatch) | No (silently coerces) |
| NA explicit | Yes (treat as condition) | No (returns NA) |

When to use which:

- 2 branches: `if_else()` (dplyr) or `ifelse()` (base) is fine.
- 3+ branches: always `case_when()`.

## Common pitfalls

**Pitfall 1: forgetting the catchall branch.** If no condition matches a row, `case_when()` returns NA for that row. Add `TRUE ~ default` or `.default = value` to ensure complete coverage.

**Pitfall 2: type mismatch between branches.** `case_when(x < 0 ~ "neg", x > 0 ~ 0)` errors. Pick one type for all return values. Numeric returns must all be numeric; character returns must all be character.

[WARNING]
**Conditions are evaluated TOP TO BOTTOM, not by specificity.** `case_when(x > 0 ~ "pos", x > 100 ~ "huge")` returns "pos" for everything above 0, and "huge" is unreachable. Put more specific conditions first.

**Pitfall 3: confusing `case_when()` with `case_match()`.** Use `case_when()` when conditions are arbitrary expressions (`x > 0`, `is.na(x)`, etc.). Use `case_match()` when conditions are all `x %in% values` or `x == value`.

## Try it yourself

**Try it:** Use `case_when()` to classify `mtcars$hp` into `"low"` (< 100), `"medium"` (100 to 200), and `"high"` (> 200). Save the result as a new column `hp_class` in `ex_classed`.

```r title="Your turn: classify horsepower"
# Try it: hp_class column
ex_classed <- mtcars |>
  mutate(hp_class = # your code here
  )

ex_classed |> count(hp_class)
#> Expected: 3 rows, one per class
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_classed <- mtcars |>
  mutate(hp_class = case_when(
    hp < 100             ~ "low",
    hp >= 100 & hp <= 200 ~ "medium",
    .default              = "high"
  ))

ex_classed |> count(hp_class)
#>   hp_class  n
#> 1     high  4
#> 2      low  7
#> 3   medium 21
```

**Explanation:** Conditions evaluate in order. The first match wins. `.default = "high"` catches anything not matched by the prior two conditions (i.e., hp > 200).

</details>

## Related dplyr functions

After mastering `case_when()`, look at:

- `if_else()`: two-branch type-strict alternative to `ifelse()`
- `case_match()`: specialized version for value matching
- `recode()`: simpler value renaming (now superseded by `case_match()`)
- `cut()`: base R for binning numeric ranges into categorical breaks
- `forcats::fct_recode()`: rename factor levels

For very many conditions or lookup-table style mappings, consider a left_join with a lookup tibble instead of a long `case_when()`.

## FAQ

**How do I add a default value in dplyr case_when?**

Two options. The traditional `TRUE ~ default_value` as the LAST branch (works in all versions). The modern `.default = default_value` argument (dplyr 1.1+, more explicit). Both produce identical results.

**How does case_when handle NA values in dplyr?**

If no condition matches and there is no `TRUE ~ default` or `.default`, the result is NA for that row. NA values themselves are FALSE for comparisons (`NA > 0` is NA, treated as not matching). Use `is.na(x) ~ "missing"` as the first branch to label NAs explicitly.

**What is the difference between case_when and case_match in dplyr?**

`case_when()` takes arbitrary logical expressions (`x > 0`, `is.na(x)`, `cyl == 4 & mpg > 25`). `case_match()` is specialized for matching values: `case_match(x, c(1,2) ~ "low", c(3,4) ~ "high")`. Use `case_match()` when all conditions are equality or membership tests; use `case_when()` for everything else.

**Can I use case_when outside of mutate?**

Yes. `case_when()` returns a vector, so you can use it anywhere a vector is expected: inside `mutate()`, `summarise()`, `filter()`, or assigned directly to a new variable: `df$label <- case_when(...)`. The most common use is inside `mutate()`.

**Why does case_when error with type errors?**

Each branch returns a value; all branches must return the same type (numeric, character, logical, etc.) or types that coerce cleanly. `case_when(x ~ "a", y ~ 1)` errors because "a" is character and 1 is numeric. Either make all branches return character (`"1"`) or all return numeric (`-1` instead of `"a"`).
