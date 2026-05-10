---
title: "tidyr replace_na() in R: Replace NA With a Value"
slug: "tidyr-replace_na-in-R"
description: "Use tidyr replace_na() to replace NA values in a data frame or vector in R. Covers per-column replacement, default values, dplyr alternatives, and 5 examples."
keywords: "tidyr replace_na, R replace NA, replace_na column, R fill NA value, dplyr replace_na, replace NA with 0 R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tidyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "replace_na()|tidyr replace_na|tidyr::replace_na()|replace NA values|fill NA"
auto_link_case_sensitive: true
target_keyword: "tidyr replace_na"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tidyr replace_na() in R: Replace NA With a Value

<p class="lead">The <code>replace_na()</code> function in tidyr replaces NA values in a vector or data frame with a specified value. For a vector, pass one replacement; for a data frame, pass a named list with column-specific replacements.</p>

[QUICK ANSWER]
replace_na(x, 0)                                  # vector: NA -> 0
replace_na(df, list(x = 0, y = "missing"))        # data frame: per-col
mutate(df, x = replace_na(x, 0))                  # inside mutate
mutate(df, across(where(is.numeric), ~ replace_na(., 0)))  # all numerics
coalesce(x, 0)                                    # alternative: first non-NA
ifelse(is.na(x), 0, x)                            # base R alternative
df |> mutate(x = if_else(is.na(x), 0, x))         # dplyr if_else

[DECISION TREE: Is replace_na() the right tool?]
- replace NA with a single value: replace_na(x, value)
- different replacement per column: replace_na(df, list(...))
- replace across many cols: mutate(across(..., ~ replace_na(., val)))
- take first non-NA across cols: coalesce(x, y, z)
- carry forward last value: tidyr::fill(df, col)
- impute with mean/median: not replace_na, use mutate with is.na
- conditional replacement: case_when() or if_else()

## What replace_na() does in one sentence

**`replace_na()` swaps NA values in a vector or data frame for a value you provide.** It is type-strict (replacement must match the column type) and pipeline-friendly.

For more flexible NA handling (e.g., conditional replacement, multi-column fallbacks, mean imputation), use `coalesce()`, `case_when()`, or `mutate()` with `is.na()` instead.

## Syntax

**For vectors: `replace_na(vec, value)`. For data frames: `replace_na(df, list(col1 = val1, col2 = val2))`.**

```r title="Replace NA in a vector"
library(tidyr)

x <- c(1, NA, 3, NA, 5)
replace_na(x, 0)
#> [1] 1 0 3 0 5
```

For a data frame, you pass a named list specifying per-column replacements:

```r title="Replace NAs differently per column"
df <- tibble::tribble(
  ~name,    ~age, ~city,
  "Alice",  30,   "NYC",
  "Bob",    NA,   NA,
  "Carol",  25,   "SF"
)

df |> replace_na(list(age = 0, city = "unknown"))
#> # A tibble: 3 x 3
#>   name    age city
#>   <chr> <dbl> <chr>
#> 1 Alice    30 NYC
#> 2 Bob       0 unknown
#> 3 Carol    25 SF
```

[TIP]
**Replacement values must match the column's TYPE.** `replace_na(df, list(x = "zero"))` errors if x is numeric. R is strict here; the replacement type must be compatible with the column type.

## Five common patterns

### 1. Replace NA in a vector

```r title="Vector: NA -> 0"
replace_na(c(1, NA, 3, NA, 5), 0)
#> [1] 1 0 3 0 5
```

The simplest case. Single replacement value for a single vector.

### 2. Replace NA per-column in a data frame

```r title="Different value per column"
df |> replace_na(list(age = 0, city = "unknown"))
```

Pass a named list. Columns NOT in the list keep their NAs.

### 3. Replace NA across many columns at once

```r title="All numeric columns -> 0"
df_num <- tibble::tibble(
  id = 1:3,
  a = c(1, NA, 3),
  b = c(NA, 2, 4),
  name = c("x", NA, "z")
)

df_num |> dplyr::mutate(dplyr::across(where(is.numeric), ~ replace_na(., 0)))
#> # A tibble: 3 x 4
#>      id     a     b name
#>   <int> <dbl> <dbl> <chr>
#> 1     1     1     0 x
#> 2     2     0     2 NA
#> 3     3     3     4 z
```

`across(where(is.numeric), ~ replace_na(., 0))` applies the replacement to every numeric column. Non-numeric columns (`name`) are untouched.

### 4. coalesce: first non-NA across columns

```r title="Pick first available value"
df_co <- tibble::tibble(
  primary = c(1, NA, 3),
  backup = c(NA, 2, NA),
  default = c(99, 99, 99)
)

df_co |> dplyr::mutate(value = dplyr::coalesce(primary, backup, default))
#> # A tibble: 3 x 4
#>   primary backup default value
#>     <dbl>  <dbl>   <dbl> <dbl>
#> 1       1     NA      99     1
#> 2      NA      2      99     2
#> 3       3     NA      99     3
```

`coalesce()` returns the FIRST non-NA value across the listed vectors. Useful for fallback chains: try column A, then B, then a default.

### 5. Conditional replacement with case_when

```r title="More than just constant replacement"
df |> dplyr::mutate(age_cleaned = dplyr::case_when(
  is.na(age) & city == "NYC" ~ 35,    # NYC NAs default to 35
  is.na(age)                  ~ 30,    # other NAs default to 30
  TRUE                        ~ age
))
```

`case_when()` lets you replace NAs based on OTHER columns or conditions. More flexible than `replace_na()`.

[KEY INSIGHT]
**`replace_na()` is for CONSTANT replacement. For dynamic or conditional replacement, use `case_when()` or `mutate(if_else(is.na(x), ...))` instead.** Replace_na fits a narrow but very common case: "fill NA with a specific value per column".

## replace_na() vs coalesce() vs ifelse(is.na(), ...)

| Approach | Best for | Notes |
|---|---|---|
| `replace_na(x, val)` | Constant value | Simple, type-strict |
| `coalesce(x, y, z)` | Fallback chain across cols | First non-NA wins |
| `ifelse(is.na(x), val, x)` | One-off in base R | Works without packages |
| `dplyr::if_else(is.na(x), val, x)` | One-off in dplyr | Type-strict like replace_na |
| `case_when()` | Conditional replacement | Flexible, multi-condition |

When to use which:

- Use `replace_na()` for clean per-column constants.
- Use `coalesce()` when the replacement comes from another column.
- Use `case_when()` when replacement depends on conditions.

## Common pitfalls

**Pitfall 1: type mismatch errors.** `replace_na(df, list(x = 0))` errors if x is character. Cast first: `mutate(x = as.numeric(x))` or use a string replacement: `list(x = "0")`.

**Pitfall 2: replacing with mean / median naively.** `replace_na(df, list(x = mean(df$x, na.rm = TRUE)))` works but is brittle. For mean imputation: `mutate(x = ifelse(is.na(x), mean(x, na.rm = TRUE), x))`. Better: use the `mice` package for principled imputation.

[WARNING]
**Replacing NA with 0 changes the meaning of "missing" to "zero". This is appropriate for COUNTS where missing usually means "didn't happen" but WRONG for measurements where missing means "we did not record it". Pick the replacement value that matches your domain semantics.**

## Try it yourself

**Try it:** Replace NAs in `airquality$Ozone` with the mean Ozone value. Save the modified vector to `ex_filled`.

```r title="Your turn: mean impute Ozone"
mean_ozone <- mean(airquality$Ozone, na.rm = TRUE)

ex_filled <- # your code here

sum(is.na(ex_filled))
#> Expected: 0 (no more NAs)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mean_ozone <- mean(airquality$Ozone, na.rm = TRUE)
ex_filled <- replace_na(airquality$Ozone, mean_ozone)

sum(is.na(ex_filled))
#> [1] 0
```

**Explanation:** Compute the mean (excluding NAs) first, then `replace_na(Ozone, mean_ozone)` fills NA with that mean. The result has zero NAs. For real analysis, mean imputation is a starting point; consider `mice::mice()` for proper missing-data treatment.

</details>

## Related tidyr / dplyr functions

After mastering replace_na, look at:

- `coalesce()`: pick first non-NA across multiple columns
- `fill()`: forward/backward-fill NAs
- `complete()`: fill in missing combinations
- `case_when()`, `if_else()`: conditional replacement
- `drop_na()`: remove rows with NA (alternative to replacement)
- `mice::mice()`: principled multiple imputation

For time series, `zoo::na.locf()` (last observation carried forward) and `imputeTS` package handle NAs more sophisticatedly.

## FAQ

**How do I replace NA with 0 in R?**

For a vector: `replace_na(x, 0)`. For a data frame column: `mutate(x = replace_na(x, 0))`. For all numeric columns: `mutate(across(where(is.numeric), ~ replace_na(., 0)))`.

**What is the difference between replace_na and coalesce in R?**

`replace_na(x, value)` replaces NA with a CONSTANT. `coalesce(x, y, z)` takes the FIRST non-NA across multiple inputs. Use replace_na for fixed defaults; coalesce for fallback chains.

**How do I replace NA values per column in a data frame?**

Pass a named list to replace_na: `replace_na(df, list(x = 0, name = "unknown", date = as.Date("1970-01-01")))`. Each column gets its own replacement value.

**Can I impute the mean for NA values with replace_na?**

Yes: `mean_x <- mean(df$x, na.rm = TRUE); replace_na(df$x, mean_x)`. But this is naive. For real analysis with missing data, use `mice` for multiple imputation; mean replacement understates variability.

**What replaces dplyr's deprecated replace_na?**

`replace_na()` is from tidyr (not deprecated). dplyr re-exports it for convenience. Both `tidyr::replace_na` and `dplyr::replace_na` refer to the same function.
