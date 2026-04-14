---
title: "dplyr case_when() in R: Replace Nested if_else with Clean Conditional Logic"
slug: "dplyr-case-when"
description: "Use dplyr case_when() to replace nested if_else chains with clean, vectorized conditional logic. Covers .default, NA handling, and multi-column rules in R."
keywords: "dplyr case_when, case_when R, dplyr conditional, nested ifelse replacement, case_when .default, multi-condition mutate, case_when NA, dplyr 1.1"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "FR-dply-2"
post_type: "FR"
auto_link_terms: "case_when()|dplyr case_when|conditional mutate|nested ifelse|case_match()"
auto_link_case_sensitive: false
fr_parent: "dplyr-mutate-rename.html"
---

# dplyr case_when() in R: Replace Nested if_else with Clean Conditional Logic

<p class="lead"><code>case_when()</code> walks through a list of conditions top to bottom and returns the value of the first one that's TRUE — like SQL's CASE WHEN, fully vectorized over an entire column at once. It replaces nested <code>if_else()</code> chains with clean, readable conditional logic.</p>

## How does case_when() replace nested if_else()?

Picture a column of student scores you need to bucket into letter grades. Five thresholds, five outcomes. Written with nested `if_else()`, you end up with a tower of parentheses that is painful to read and worse to debug. `case_when()` flattens that mess into a single tidy block where every condition lines up next to its result.

Here is the same grading rule written both ways. The first version uses the nested approach. The second uses `case_when()` — notice how each rule sits on its own line and reads almost like English.

```r
library(dplyr)

students <- data.frame(
  name  = c("Alice", "Bob", "Carol", "David", "Eve"),
  score = c(95, 82, 67, 55, 73)
)

# Nested if_else() — readable enough at 5 levels, painful at 10
students |>
  mutate(grade = if_else(score >= 90, "A",
                  if_else(score >= 80, "B",
                   if_else(score >= 70, "C",
                    if_else(score >= 60, "D", "F")))))
#>    name score grade
#> 1 Alice    95     A
#> 2   Bob    82     B
#> 3 Carol    67     D
#> 4 David    55     F
#> 5   Eve    73     C

# case_when() — one rule per line, no nesting
students_graded <- students |>
  mutate(grade = case_when(
    score >= 90 ~ "A",
    score >= 80 ~ "B",
    score >= 70 ~ "C",
    score >= 60 ~ "D",
    .default    = "F"
  ))
students_graded
#>    name score grade
#> 1 Alice    95     A
#> 2   Bob    82     B
#> 3 Carol    67     D
#> 4 David    55     F
#> 5   Eve    73     C
```

Both versions produce identical grades, but the `case_when()` block is what you would actually want to maintain six months from now. Adding a new threshold means inserting one line; reordering rules means swapping two lines. The nested version forces you to re-balance parentheses every time you touch it.

[KEY INSIGHT]
**Each `case_when()` line is one condition paired with one outcome.** Read top to bottom, the first TRUE wins, and the column is scored in one pass over the whole vector. There is no row loop and no branching tree to mentally simulate.

**Try it:** Bucket the vector `c(12, 45, 78, 33, 91)` into "low" (under 30), "mid" (30–69), and "high" (70+). Use `case_when()` with `.default`.

```r
ex_vals <- c(12, 45, 78, 33, 91)
ex_buckets <- case_when(
  # your code here
)
ex_buckets
#> Expected: "low"  "mid"  "high" "mid"  "high"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vals <- c(12, 45, 78, 33, 91)
ex_buckets <- case_when(
  ex_vals < 30  ~ "low",
  ex_vals < 70  ~ "mid",
  .default      = "high"
)
ex_buckets
#> [1] "low"  "mid"  "high" "mid"  "high"
```

**Explanation:** Conditions are checked top to bottom. A value of 33 fails `< 30` but matches `< 70`, so it gets "mid". Anything that falls through both rules takes the `.default`.

</details>

## What is the basic case_when() syntax?

The function takes a sequence of two-sided formulas. The left side is a logical condition, the right side is the value to return when that condition is TRUE. Conditions are evaluated in order, and the first match wins for each row.

![Evaluation flow of case_when()](screenshots/dplyr-case-when-evaluation-flow.webp)
*Figure 1: How case_when() walks through conditions top to bottom and returns on the first TRUE match.*

Since dplyr 1.1.0, you can pass a `.default` argument to set the fallback value for rows that match no condition. Before 1.1.0, the idiom was a final `TRUE ~ default_value` line — `TRUE` always matches, so it acts as the catch-all.

```r
# Modern .default form (dplyr 1.1+)
students_graded2 <- students |>
  mutate(grade = case_when(
    score >= 90 ~ "A",
    score >= 80 ~ "B",
    .default    = "Below B"
  ))
students_graded2
#>    name score   grade
#> 1 Alice    95       A
#> 2   Bob    82       B
#> 3 Carol    67 Below B
#> 4 David    55 Below B
#> 5   Eve    73 Below B
```

The `.default` argument is the cleaner, more discoverable form. It also lets you skip the `TRUE` trick that always confuses newcomers ("why does TRUE go on the left?").

```r
# Legacy TRUE ~ form — still works, common in older code
students |>
  mutate(grade = case_when(
    score >= 90 ~ "A",
    score >= 80 ~ "B",
    TRUE        ~ "Below B"
  ))
#>    name score   grade
#> 1 Alice    95       A
#> 2   Bob    82       B
#> 3 Carol    67 Below B
#> 4 David    55 Below B
#> 5   Eve    73 Below B
```

Both produce the same result. Use `.default` in new code; recognise `TRUE ~` when you read older tutorials and packages.

[NOTE]
**If you omit both `.default` and `TRUE ~`, unmatched rows get NA.** That is sometimes what you want — for example, when you only care about flagging the rows that satisfy a positive rule and want to leave everything else blank.

**Try it:** Rewrite the following legacy snippet to use the modern `.default` argument. The behaviour should be identical.

```r
ex_x <- c(2, 7, 15)
ex_legacy <- case_when(
  ex_x < 5  ~ "small",
  ex_x < 10 ~ "medium",
  TRUE      ~ "large"
)
# Now write ex_modern using .default
ex_modern <- case_when(
  # your code here
)
identical(ex_legacy, ex_modern)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_modern <- case_when(
  ex_x < 5  ~ "small",
  ex_x < 10 ~ "medium",
  .default  = "large"
)
identical(ex_legacy, ex_modern)
#> [1] TRUE
```

**Explanation:** The two forms are equivalent. `.default` simply replaces the `TRUE ~` catch-all with a named argument that future readers will instantly recognise.

</details>

## How does case_when() handle NA values?

This is the gotcha that bites everyone at least once. When a left-hand-side condition involves an NA value, the comparison returns NA — and `case_when()` treats NA on the LHS the same as FALSE. The row falls through to the next rule, and eventually to `.default` if nothing matches.

```r
x_vals <- c(1, NA, 3, NA, 5)

na_demo <- case_when(
  x_vals > 3 ~ "high",
  x_vals > 1 ~ "mid",
  .default   = "low"
)
na_demo
#> [1] "low"  "low"  "mid"  "low"  "high"
```

Look at positions 2 and 4. The original values were NA, but the result says `"low"`. That is almost never what you want — your missing-data rows are now silently lumped in with the smallest bucket.

The fix is to put an explicit `is.na()` check **first**, before any numeric comparison. Because `case_when()` returns on the first TRUE match, the NA rows get caught before they fall through to the wrong rule.

```r
na_demo_fixed <- case_when(
  is.na(x_vals) ~ "missing",
  x_vals > 3    ~ "high",
  x_vals > 1    ~ "mid",
  .default      = "low"
)
na_demo_fixed
#> [1] "low"     "missing" "mid"     "missing" "high"
```

Now positions 2 and 4 carry the `"missing"` label. Same logic, same data — but the order of the rules changes the answer entirely.

[WARNING]
**NA on the left side of a `case_when()` formula is silently treated as FALSE.** Without an explicit `is.na()` check at the top, your missing-data rows quietly land in `.default` (or the wrong bucket), and no error or warning will tell you.

**Try it:** Tag the vector `c(10, NA, 25, 30, NA)` as "missing" for NA rows, "small" for values under 20, and "big" otherwise.

```r
ex_input <- c(10, NA, 25, 30, NA)
ex_tagged <- case_when(
  # your code here
)
ex_tagged
#> Expected: "small"   "missing" "big"     "big"     "missing"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_tagged <- case_when(
  is.na(ex_input) ~ "missing",
  ex_input < 20   ~ "small",
  .default        = "big"
)
ex_tagged
#> [1] "small"   "missing" "big"     "big"     "missing"
```

**Explanation:** The `is.na()` rule comes first so missing values are caught before the numeric comparisons get a chance to silently fail.

</details>

## How do I combine multiple columns in case_when() conditions?

The left-hand side of each formula is just an R logical expression, so it can reference any column in scope — not only the one you are creating. Combine multiple columns with `&` (AND) and `|` (OR), and remember that order matters: the most specific rule should come first.

```r
mtcars_typed <- mtcars |>
  mutate(car_type = case_when(
    mpg > 25 & hp < 100 ~ "Efficient & Light",
    mpg > 25            ~ "Efficient & Powerful",
    hp > 200            ~ "Muscle Car",
    wt > 4              ~ "Heavy Cruiser",
    .default            = "Standard"
  )) |>
  count(car_type, sort = TRUE)
mtcars_typed
#>               car_type  n
#> 1             Standard 18
#> 2           Muscle Car  7
#> 3    Efficient & Light  5
#> 4        Heavy Cruiser  1
#> 5 Efficient & Powerful  1
```

Notice the rule ordering. "Efficient & Light" is a strict subset of "Efficient & Powerful" (it adds the `hp < 100` requirement), so it must come first. If you reversed them, every efficient car would match the broader rule and "Efficient & Light" would never fire — a silent logic bug with no error.

[TIP]
**Order your `case_when()` rules from most specific to most general.** When two rules overlap, the one written first wins. Putting a broad rule above a narrow one means the narrow rule is dead code.

**Try it:** Tag mtcars rows as `"sporty"` when `cyl == 8` AND `hp > 180`, `"economy"` when `mpg > 25`, otherwise `"regular"`.

```r
ex_cars <- mtcars |>
  mutate(class = case_when(
    # your code here
  )) |>
  count(class)
ex_cars
#> Expected three classes with counts
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cars <- mtcars |>
  mutate(class = case_when(
    cyl == 8 & hp > 180 ~ "sporty",
    mpg > 25            ~ "economy",
    .default            = "regular"
  )) |>
  count(class)
ex_cars
#>     class  n
#> 1 economy  6
#> 2 regular 19
#> 3  sporty  7
```

**Explanation:** Both `cyl` and `hp` appear on the same LHS, joined by `&`. The sporty rule is checked first because it is the most specific.

</details>

## When should I use case_when() vs case_match()?

`case_when()` is built for arbitrary logical conditions. When all you want to do is map specific values to new values — recode `"M"` to `"Male"`, `"F"` to `"Female"`, and so on — you end up writing a wall of `x == "M"` checks that adds noise without adding meaning. dplyr 1.1.0 introduced `case_match()` exactly for this case: a vectorised `switch()` that matches values directly.

```r
iris_recoded <- iris |>
  mutate(bloom_size = case_match(
    Species,
    "setosa"                       ~ "Small Bloom",
    "versicolor"                   ~ "Mid Bloom",
    "virginica"                    ~ "Large Bloom",
    .default                       = "Unknown"
  )) |>
  count(bloom_size)
iris_recoded
#>    bloom_size  n
#> 1 Large Bloom 50
#> 2   Mid Bloom 50
#> 3 Small Bloom 50
```

Notice how each LHS is just a value (or a vector of values to group), with no `Species ==` boilerplate. The right-hand side and `.default` work the same as in `case_when()`.

The rule of thumb: if every condition is `column == "literal"`, prefer `case_match()`. If you need numeric ranges, `is.na()` checks, multi-column logic, or anything beyond equality, stick with `case_when()`.

[TIP]
**Reach for `case_match()` whenever you are doing pure equality matching.** It strips out the repetitive `column ==` noise, communicates intent more clearly, and works on any vector type.

**Try it:** Rewrite the following `case_when()` as a `case_match()` call. The behaviour should be identical.

```r
ex_letters <- c("a", "b", "c", "d")
ex_via_when <- case_when(
  ex_letters == "a"             ~ "alpha",
  ex_letters %in% c("b", "c")   ~ "middle",
  .default                      = "other"
)
ex_via_match <- case_match(
  ex_letters,
  # your code here
)
identical(ex_via_when, ex_via_match)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_via_match <- case_match(
  ex_letters,
  "a"            ~ "alpha",
  c("b", "c")    ~ "middle",
  .default       = "other"
)
identical(ex_via_when, ex_via_match)
#> [1] TRUE
```

**Explanation:** `case_match()` accepts a literal value or a vector of values on the LHS. No `==` operator is needed — the matching is implicit.

</details>

## Why does case_when() throw a type-mismatch error?

Every right-hand-side value in a `case_when()` call must be coercible to a single common type. Mixing a character `"yes"` with a numeric `0` will fail because there is no shared type that holds both safely. dplyr 1.1+ uses the vctrs package for type coercion, so the error message is usually clear about what went wrong.

```r
# This fails: "yes" is character, 0 is numeric
bad_demo <- tryCatch(
  case_when(
    c(1, -1, 5) > 0 ~ "yes",
    .default        = 0
  ),
  error = function(e) conditionMessage(e)
)
cat(bad_demo, "\n")
#> Can't combine `..1` <character> and `.default` <double>.

# Fix: pick one type and stick with it
good_demo <- case_when(
  c(1, -1, 5) > 0 ~ 1L,
  .default        = 0L
)
good_demo
#> [1] 1 0 1
```

The fix is to choose one type and convert. If you wanted a labelled column, return `"yes"` and `"no"`. If you wanted a 0/1 indicator, return `1L` and `0L`. Don't try to mix the two in one call — `case_when()` is strict about this on purpose, because a column with mixed types is almost always a bug.

[NOTE]
**dplyr 1.1+ error messages name the offending arguments.** When you see `Can't combine ..1 <character> and .default <double>`, `..1` refers to the first formula and `.default` refers to your fallback. Match those positions to the lines in your call to find the type clash.

**Try it:** The call below fails. Fix it so it returns `"adult"` for ages 18+ and `"minor"` otherwise.

```r
ex_ages <- c(12, 25, 17, 40)
ex_label <- case_when(
  ex_ages >= 18 ~ "adult",
  .default      = 0      # <- bug: numeric mixed with character
)
# Rewrite the case_when() call so it returns a character vector.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_label <- case_when(
  ex_ages >= 18 ~ "adult",
  .default      = "minor"
)
ex_label
#> [1] "minor" "adult" "minor" "adult"
```

**Explanation:** The original `.default = 0` is numeric, but the first rule returns a character. Replacing `0` with `"minor"` makes both branches character, so the call type-checks.

</details>

## Practice Exercises

### Exercise 1: Income bracket binning

Build a data frame with the income vector `c(18000, 42000, 75000, 120000, 9500, NA)` and add a `bracket` column that labels rows as `"Missing"` for NA, `"Low"` under 25,000, `"Mid"` from 25,000 to 79,999, and `"High"` for 80,000+. Save the result to `my_income_df`.

```r
# Hint: put is.na() FIRST, then numeric thresholds
income <- c(18000, 42000, 75000, 120000, 9500, NA)

# Write your code below

```

<details>
<summary>Click to reveal solution</summary>

```r
income <- c(18000, 42000, 75000, 120000, 9500, NA)

my_income_df <- data.frame(income) |>
  mutate(bracket = case_when(
    is.na(income)   ~ "Missing",
    income < 25000  ~ "Low",
    income < 80000  ~ "Mid",
    .default        = "High"
  ))
my_income_df
#>   income bracket
#> 1  18000     Low
#> 2  42000     Mid
#> 3  75000     Mid
#> 4 120000    High
#> 5   9500     Low
#> 6     NA Missing
```

**Explanation:** The `is.na()` rule is first so the NA row never falls through to a numeric comparison. After that, the thresholds are checked in increasing order, and the `.default` catches anything 80,000 and above.

</details>

### Exercise 2: Multi-column risk score

From the built-in `mtcars` dataset, create a `risk` column using these rules: `"Reckless"` if `hp > 200` AND `wt < 3.5`, `"Cruiser"` if `wt > 4`, `"Sippy"` if `mpg > 25`, otherwise `"Normal"`. Save the result to `my_risk_summary` as a count by category.

```r
# Hint: most specific rule (Reckless) goes first

# Write your code below

```

<details>
<summary>Click to reveal solution</summary>

```r
my_risk_summary <- mtcars |>
  mutate(risk = case_when(
    hp > 200 & wt < 3.5 ~ "Reckless",
    wt > 4              ~ "Cruiser",
    mpg > 25            ~ "Sippy",
    .default            = "Normal"
  )) |>
  count(risk, sort = TRUE)
my_risk_summary
#>       risk  n
#> 1   Normal 21
#> 2    Sippy  6
#> 3  Cruiser  4
#> 4 Reckless  1
```

**Explanation:** "Reckless" combines two conditions on different columns, so it is the most specific rule and must come first. Without that ordering, a heavy reckless car would get caught by the "Cruiser" rule instead.

</details>

### Exercise 3: Recode and bin airquality readings

Using the built-in `airquality` dataset, create two new columns: `season` using `case_match()` (Month 5 → `"Spring"`, Months 6–8 → `"Summer"`, Month 9 → `"Fall"`), and `temp_class` using `case_when()` (Temp ≥ 80 → `"Hot"`, Temp ≥ 70 → `"Warm"`, otherwise `"Cool"`). Show the first 6 rows of the result. Save it to `my_aq_class`.

```r
# Hint: use case_match() on Month, case_when() on Temp

# Write your code below

```

<details>
<summary>Click to reveal solution</summary>

```r
my_aq_class <- airquality |>
  mutate(
    season = case_match(
      Month,
      5          ~ "Spring",
      c(6, 7, 8) ~ "Summer",
      9          ~ "Fall",
      .default   = "Other"
    ),
    temp_class = case_when(
      Temp >= 80 ~ "Hot",
      Temp >= 70 ~ "Warm",
      .default   = "Cool"
    )
  )
head(my_aq_class, 6)
#>   Ozone Solar.R Wind Temp Month Day season temp_class
#> 1    41     190  7.4   67     5   1 Spring       Cool
#> 2    36     118  8.0   72     5   2 Spring       Warm
#> 3    12     149 12.6   74     5   3 Spring       Warm
#> 4    18     313 11.5   62     5   4 Spring       Cool
#> 5    NA      NA 14.3   56     5   5 Spring       Cool
#> 6    28      NA 14.9   66     5   6 Spring       Cool
```

**Explanation:** `case_match()` handles `season` because it is pure value matching on Month. `case_when()` handles `temp_class` because it needs the `>=` comparison, which `case_match()` cannot express.

</details>

## Complete Example

Here is everything woven together into one realistic pipeline. We tag daily air-quality readings by season and ozone level, handle missing values explicitly, and produce a clean labelled table.

```r
aq_classified <- airquality |>
  mutate(
    season = case_match(
      Month,
      5          ~ "Spring",
      c(6, 7, 8) ~ "Summer",
      9          ~ "Fall",
      .default   = NA_character_
    ),
    air_quality = case_when(
      is.na(Ozone) ~ "Unmeasured",
      Ozone > 100  ~ "Unhealthy",
      Ozone > 50   ~ "Moderate",
      .default     = "Good"
    )
  )
head(aq_classified, 6)
#>   Ozone Solar.R Wind Temp Month Day season air_quality
#> 1    41     190  7.4   67     5   1 Spring        Good
#> 2    36     118  8.0   72     5   2 Spring        Good
#> 3    12     149 12.6   74     5   3 Spring        Good
#> 4    18     313 11.5   62     5   4 Spring        Good
#> 5    NA      NA 14.3   56     5   5 Spring  Unmeasured
#> 6    28      NA 14.9   66     5   6 Spring        Good
```

The pipeline does two things in one `mutate()` call. First, `case_match()` recodes the numeric `Month` column into named seasons using pure equality matching — much cleaner than writing `Month == 5 ~ ...`. Second, `case_when()` builds an `air_quality` label that depends on numeric thresholds and explicitly handles the days where Ozone is missing. Both new columns sit alongside the original measurements, ready for grouping or plotting downstream.

## Summary

![Decision tree for picking conditional tools](screenshots/dplyr-case-when-decision-tree.webp)
*Figure 2: When to reach for if_else(), case_when(), or case_match().*

Key things to remember about `case_when()`:

- **Top-to-bottom evaluation.** The first condition that returns TRUE for a row determines its output. Order your rules from most specific to most general.
- **Use `.default` (dplyr 1.1+).** It replaces the legacy `TRUE ~ value` catch-all and makes the fallback explicit.
- **NA on the LHS is treated as FALSE.** Always put `is.na()` checks first when missing values matter.
- **All RHS values must share a type.** Don't mix `"yes"` with `0`. Pick one type and stay there.
- **Multi-column conditions are fine.** Any logical expression that R can evaluate works as an LHS. Combine columns with `&` and `|`.
- **Reach for `case_match()` for pure equality recoding.** It is cleaner than writing `column ==` over and over.

## References

1. dplyr — `case_when()` reference. [Link](https://dplyr.tidyverse.org/reference/case_when.html)
2. dplyr — `case_match()` reference. [Link](https://dplyr.tidyverse.org/reference/case_match.html)
3. tidyverse blog — *dplyr 1.1.0: The power of vctrs* (introduces `.default`). [Link](https://www.tidyverse.org/blog/2023/02/dplyr-1-1-0-vctrs/)
4. Wickham, H., Çetinkaya-Rundel, M. & Grolemund, G. — *R for Data Science* (2e), Chapter 12 Logical vectors. [Link](https://r4ds.hadley.nz/logicals)
5. Wickham, H. — *Advanced R* (2e), Chapter 9 Functionals & vectorisation. [Link](https://adv-r.hadley.nz/functionals.html)

## Continue Learning

- [dplyr mutate() and rename()](/dplyr-mutate-rename.html) — the parent tutorial covering column creation and transformation
- [dplyr filter() and select()](/dplyr-filter-select.html) — narrow rows and columns before applying conditional logic
- [dplyr across()](/dplyr-across.html) — apply the same transformation across many columns at once
