---
title: "dplyr mutate() in R: Create and Transform Columns"
slug: "dplyr-mutate-in-R"
description: "Use dplyr mutate() to add, transform, or replace columns in R. Covers across(), if_else(), case_when(), grouped mutate, .keep, and 7 runnable examples."
keywords: "dplyr mutate, create column R, transform column R, dplyr mutate examples, mutate across, dplyr if_else, dplyr case_when"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "mutate()|dplyr mutate|dplyr::mutate()|create column|transform column"
auto_link_case_sensitive: true
target_keyword: "dplyr mutate"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr mutate() in R: Create and Transform Columns

<p class="lead">The <code>mutate()</code> function in dplyr adds new columns to a data frame or replaces existing ones. You write expressions that reference other columns, and mutate evaluates them and appends the result, keeping every original row.</p>

[QUICK ANSWER]
mutate(df, kpl = mpg * 0.425)              # new column from formula
mutate(df, mpg = round(mpg, 1))            # replace existing column
mutate(df, hp_class = if_else(hp > 150, "high", "low"))  # conditional
mutate(df, across(where(is.numeric), scale))             # apply to many cols
mutate(df, rank = row_number(), .by = cyl)               # within groups
mutate(df, hp_z = (hp - mean(hp)) / sd(hp))              # z-score
transmute(df, name, kpl = mpg * 0.425)     # mutate + drop other cols

[DECISION TREE: Is mutate() the right tool?]
- add or transform a column: mutate(df, y = x * 2)
- collapse rows to one summary: summarise(df, y = mean(x))
- drop other columns at the same time: transmute(df, y = x * 2)
- rename without changing values: rename(df, new = old)
- subset rows by condition: filter(df, x > 5)
- sort rows (no transform): arrange(df, x)
- row-by-row computation that wont vectorize: rowwise() |> mutate()

## What mutate() does in one sentence

**`mutate()` is a column adder.** You give it a data frame plus one or more expressions of the form `new_col = formula`, and it returns the same data frame with those columns added (or replaced if the name already exists). Every row stays; only the column structure changes.

Unlike base R `df$new_col <- ...`, mutate works inside a pipeline, supports computing several columns in one call, and lets you reference columns you just created in the same expression chain.

## Syntax

**`mutate()` takes a data frame plus name-value column expressions.** Use `if_else()`, `case_when()`, and `across()` for conditional and bulk transforms. Use `.by` to compute per group without leaving the data grouped.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

glimpse(mtcars)
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, ...
#> $ cyl  <dbl> 6, 6, 4, 6, 8, 6, 8, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, ...
#> $ hp   <int> 110, 110, 93, 110, 175, 105, 245, 62, 95, 123, 123, ...
```

The full signature is:

```
mutate(.data, ..., .by = NULL, .keep = "all", .before = NULL, .after = NULL)
```

`.data` is the data frame. The `...` argument takes one or more `name = expression` pairs. `.by` groups for the duration of the call. `.keep` controls which existing columns to retain. `.before` and `.after` position new columns relative to existing ones.

[TIP]
**Each new column is visible to the next expression in the same call.** `mutate(df, a = mpg * 2, b = a + 1)` works: the second expression sees `a` from the first. This is how you build chained transforms in one mutate call without intermediate variables.

## Seven common patterns

### 1. Create a new column from a formula

```r title="Convert mpg to km per liter"
mtcars |>
  mutate(kpl = mpg * 0.425) |>
  select(mpg, kpl) |>
  head(3)
#>                    mpg     kpl
#> Mazda RX4         21.0  8.9250
#> Mazda RX4 Wag     21.0  8.9250
#> Datsun 710        22.8  9.6900
```

### 2. Replace an existing column

```r title="Round mpg in place"
mtcars |>
  mutate(mpg = round(mpg, 0)) |>
  select(mpg, cyl) |>
  head(3)
#>                  mpg cyl
#> Mazda RX4         21   6
#> Mazda RX4 Wag     21   6
#> Datsun 710        23   4
```

If the column name already exists, the new value overwrites it.

### 3. Conditional values with if_else()

```r title="Tag horsepower as high or low"
mtcars |>
  mutate(hp_class = if_else(hp > 150, "high", "low")) |>
  count(hp_class)
#>   hp_class  n
#> 1     high 12
#> 2      low 20
```

`if_else()` is the type-strict dplyr alternative to base R `ifelse()`. The TRUE and FALSE branches must return the same type.

### 4. Multi-way branching with case_when()

```r title="Bucket cars by efficiency"
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

`case_when()` evaluates conditions in order and returns the value of the first match. The trailing `TRUE ~ default` is the catch-all.

### 5. Apply a function to many columns with across()

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

`across()` paired with `where()` lets you transform many columns in one stroke. This is the modern replacement for `mutate_at()`, `mutate_if()`, and `mutate_all()`.

### 6. Compute relative to a group with .by

```r title="Z-score hp within each cylinder group"
mtcars |>
  mutate(hp_z = (hp - mean(hp)) / sd(hp), .by = cyl) |>
  select(cyl, hp, hp_z) |>
  head(3)
#>                 cyl  hp        hp_z
#> Mazda RX4         6 110 -0.46291005
#> Mazda RX4 Wag     6 110 -0.46291005
#> Datsun 710        4  93  0.04000601
```

`.by` is preferred over `group_by()` when the grouping is only needed for this single mutate call. Result is automatically ungrouped.

### 7. Drop other columns with transmute()

```r title="Keep only the new columns"
mtcars |>
  transmute(name = rownames(mtcars), kpl = mpg * 0.425) |>
  head(3)
#>                            name     kpl
#> Mazda RX4             Mazda RX4  8.9250
#> Mazda RX4 Wag     Mazda RX4 Wag  8.9250
#> Datsun 710           Datsun 710  9.6900
```

`transmute()` is `mutate()` plus `select()`: it returns only the columns you name in the call.

[KEY INSIGHT]
**`mutate()` and `across()` together replace 90% of the legacy `_at`/`_if`/`_all` variants.** If you see old code with `mutate_if(df, is.numeric, scale)`, the modern equivalent is `mutate(df, across(where(is.numeric), scale))`. Same result, more composable, fewer functions to remember.

## mutate() vs base R column assignment

**Base R uses `<-` for column assignment; `mutate()` uses `=` inside the function call.** That is the surface difference. The deeper difference is composability: mutate slots into pipelines and supports many columns in one call.

| Task | dplyr | Base R |
|---|---|---|
| Add one column | `mutate(df, y = a * 2)` | `df$y <- df$a * 2` |
| Replace column | `mutate(df, a = round(a, 1))` | `df$a <- round(df$a, 1)` |
| Add multiple | `mutate(df, y = a*2, z = b/3)` | two assignments |
| Conditional | `mutate(df, y = if_else(a>0,"P","N"))` | `df$y <- ifelse(df$a>0,"P","N")` |
| Apply to many | `mutate(df, across(where(is.numeric), scale))` | `df[nums] <- lapply(df[nums], scale)` |

When to use which:

- Use `mutate()` inside any dplyr pipeline.
- Use base R `<-` for one-off scripts or single-column updates without other tidyverse code.

## Common pitfalls

**Pitfall 1: column references vs string literals.** `mutate(df, y = "a")` creates column y filled with the string "a", not a copy of column a. Use bare names to reference columns: `mutate(df, y = a)`.

**Pitfall 2: forgetting `.by` and getting wrong totals.** `mutate(df, pct = hp / sum(hp))` divides each hp by the total of all hp. To get per-cylinder percentages, add `.by = cyl`. Without grouping, `sum(hp)` is computed once over the whole column.

[WARNING]
**Type mismatch in `if_else()` causes errors that `ifelse()` silently coerces.** `if_else(cond, "yes", 0)` errors because TRUE returns character and FALSE returns numeric. Base R `ifelse()` would coerce; dplyr's `if_else()` refuses. This strictness catches bugs but surprises beginners. To opt out, use `dplyr::if_else(..., missing = NA_character_)` or fall back to `ifelse()`.

**Pitfall 3: `mutate()` keeps all columns; `transmute()` drops them.** If you want only the new columns and a few keepers, use `transmute()`. Mixing them up is a frequent source of "where did all my columns go" or "why are these columns still here" surprises.

## Try it yourself

**Try it:** Add a new column `mpg_per_cyl = mpg / cyl` to `mtcars`. Save the result to `ex_mtcars2` and print the first 3 rows of `mpg`, `cyl`, and the new column.

```r title="Your turn: compute mpg per cylinder"
# Try it: add mpg_per_cyl column
ex_mtcars2 <- # your code here

ex_mtcars2 |> select(mpg, cyl, mpg_per_cyl) |> head(3)
#> Expected: 3 rows showing mpg, cyl, mpg_per_cyl
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mtcars2 <- mtcars |> mutate(mpg_per_cyl = mpg / cyl)
ex_mtcars2 |> select(mpg, cyl, mpg_per_cyl) |> head(3)
#>                mpg cyl mpg_per_cyl
#> Mazda RX4     21.0   6    3.500000
#> Mazda RX4 Wag 21.0   6    3.500000
#> Datsun 710    22.8   4    5.700000
```

**Explanation:** `mutate()` takes `name = expression` pairs. The expression `mpg / cyl` is evaluated row-wise (vectorized), and the result becomes a new column appended to every row.

</details>

## Related dplyr functions

After mastering `mutate()`, look at:

- `transmute()`: like `mutate()` but drops unlisted columns
- `relocate()`: move columns to a specific position
- `if_else()`, `case_when()`, `case_match()`: vectorized conditional value generators
- `across()`: apply a function to multiple columns inside `mutate()` or `summarise()`
- `rowwise()` plus `mutate()`: row-by-row computation when you cannot vectorize

`mutate()` paired with `lag()`, `lead()`, `cumsum()`, `cummean()`, and `row_number()` covers most window-function needs in dplyr. For heavy time-series work, also check the slider package.

## FAQ

**How do I add multiple columns at once with mutate?**

List them comma-separated: `mutate(df, x = a + b, y = a * b, z = a / b)`. Each new column is visible to the next expression, so you can build chains in one call.

**What is the difference between mutate and transmute in dplyr?**

`mutate()` keeps every original column and adds new ones. `transmute()` returns ONLY the columns you name in the call, dropping the rest. Use `transmute()` when the next step only needs the derived columns.

**How do I create a conditional column in dplyr?**

For two outcomes use `if_else(condition, true_value, false_value)`. For three or more outcomes use `case_when()` with one condition per branch and a trailing `TRUE ~ default`. Both work inside `mutate()`.

**Can I use mutate to update columns conditionally?**

Yes. `mutate(df, x = if_else(x < 0, 0, x))` replaces negative values with 0. Or with `case_when` for richer logic: `mutate(df, x = case_when(x < 0 ~ 0, x > 100 ~ 100, TRUE ~ x))`.

**How do I add a column based on row position?**

Use `row_number()`: `mutate(df, rownum = row_number())`. To rank within groups: `mutate(df, rank = row_number(), .by = group)`. For absolute index of original row, do this BEFORE any filter or arrange.
