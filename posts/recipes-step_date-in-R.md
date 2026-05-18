---
title: "recipes step_date() in R: Extract Date Features for Modeling"
slug: recipes-step_date-in-R
description: "recipes step_date() in R turns a Date column into year, month, and day-of-week predictors. Learn the syntax, the features argument, prep and bake, and pitfalls."
keywords: "recipes step_date, step_date function R, recipes step_date examples, R date features, step_date tidymodels, date feature engineering R, extract date parts R"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_date()|recipes step_date|recipes::step_date()|step_date|date features"
auto_link_case_sensitive: true
target_keyword: recipes step_date
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_date() in R: Extract Date Features for Modeling

<p class="lead">The <code>recipes</code> <code>step_date()</code> function in R turns a Date column into calendar features such as year, month, and day-of-week so a model can learn from them. You add it to a <code>recipe()</code>, then apply it with <code>prep()</code> and <code>bake()</code>.</p>

[QUICK ANSWER]
step_date(rec, order_date)                              # default: dow, month, year
step_date(rec, order_date, features = c("year"))        # year only
step_date(rec, order_date, features = c("doy","week"))  # day-of-year and week
step_date(rec, order_date, label = FALSE)               # numeric month and dow
step_date(rec, order_date, abbr = FALSE)                # full names like Monday
step_date(rec, all_date_predictors())                   # every date column
prep(rec) |> bake(new_data = NULL)                       # learn, then apply

[DECISION TREE: Is step_date() the right tool?]
- extract calendar parts from a date: step_date(rec, order_date)
- flag holidays and special days: step_holiday(rec, order_date)
- build lagged values of a column: step_lag(rec, sales, lag = 1)
- compute rolling window statistics: step_window(rec, sales, size = 3)
- encode the new month and dow factors: step_dummy(rec, all_nominal_predictors())
- drop the leftover Date column: step_rm(rec, order_date)

## What step_date() does in R

**step_date() expands a single Date column into several predictor columns.** A raw date carries information a model cannot read directly: seasonality lives in the month, weekly patterns live in the day of week, and long-term trend lives in the year. `step_date()` pulls those parts into their own columns so a regression or tree can use them.

By default it extracts three features, `dow`, `month`, and `year`, and names the new columns `<variable>_<feature>`. A column called `order_date` becomes `order_date_dow`, `order_date_month`, and `order_date_year`. The day-of-week and month columns come back as factors with readable labels, while the year is an integer.

[KEY INSIGHT]
**step_date() is deterministic, so prep() learns nothing from the data.** Unlike `step_dummy()` or `step_normalize()`, the calendar parts of a date do not depend on the training set. `prep()` still has to run to register the step, but the same date always produces the same features whether it appears in training or test data.

## step_date() syntax and arguments

**step_date() attaches a date-expansion operation to a recipe.** You pass the recipe first, then the date columns to expand, chosen by name or with the `all_date_predictors()` selector.

```r title="The step_date skeleton"
library(recipes)

sales <- data.frame(
  order_date = as.Date("2023-01-15") + c(0, 40, 95, 160, 250, 320),
  revenue    = c(120, 230, 90, 310, 175, 260)
)

recipe(revenue ~ order_date, data = sales) |>
  step_date(order_date)
#> -- Recipe ---------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 1
#> -- Operations
#> * Date features from: order_date
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Date columns to expand, named or selected with `all_date_predictors()`. |
| `features` | Character vector of parts to extract. Default `c("dow", "month", "year")`. |
| `abbr` | If `TRUE` (default), labels are short, like `Mon` and `Jan`. |
| `label` | If `TRUE` (default), `dow` and `month` are factors; `FALSE` makes them numeric. |
| `ordinal` | If `TRUE`, the `dow` and `month` factors are ordered. Default `FALSE`. |
| `keep_original_cols` | If `TRUE` (default), the source Date column stays in the output. |

The `features` argument accepts `year`, `doy` (day of year), `week`, `decimal` (decimal date), `semester`, `quarter`, `dow`, `month`, and `mday` (day of month).

## Extracting date features: worked examples

**Build the recipe, prep it, then bake.** A recipe is a plan until `prep()` registers the steps and `bake()` applies them. This example uses the default three features on the `order_date` column.

```r title="Extract the default date features"
rec <- recipe(revenue ~ order_date, data = sales) |>
  step_date(order_date)

prep(rec) |> bake(new_data = NULL)
#> # A tibble: 6 x 5
#>   order_date revenue order_date_dow order_date_month order_date_year
#>   <date>       <dbl> <fct>          <fct>                      <int>
#> 1 2023-01-15     120 Sun            Jan                         2023
#> 2 2023-02-24     230 Fri            Feb                         2023
#> 3 2023-04-20      90 Thu            Apr                         2023
#> 4 2023-06-24     310 Sat            Jun                         2023
#> 5 2023-09-22     175 Fri            Sep                         2023
#> 6 2023-12-01     260 Fri            Dec                         2023
```

Three new columns appear and `order_date` is kept, because `keep_original_cols` defaults to `TRUE`. To pull different parts, pass a `features` vector. Here we ask for day of year, week number, quarter, and the decimal date.

```r title="Choose features with the features argument"
rec_feat <- recipe(revenue ~ order_date, data = sales) |>
  step_date(order_date,
            features = c("doy", "week", "quarter", "decimal"))

prep(rec_feat) |> bake(new_data = NULL) |>
  subset(select = -c(order_date, revenue))
#> # A tibble: 6 x 4
#>   order_date_doy order_date_week order_date_quarter order_date_decimal
#>            <int>           <int> <fct>                           <dbl>
#> 1             15               3 Q1                              2023.
#> 2             55               8 Q1                              2023.
#> 3            110              16 Q2                              2023.
#> 4            175              25 Q2                              2023.
#> 5            265              38 Q3                              2023.
#> 6            335              48 Q4                              2023.
```

By default `dow` and `month` arrive as factors. Many engines, especially `glmnet` and `xgboost`, want numeric input, so set `label = FALSE` to get integers instead.

```r title="Return numeric month and day-of-week"
rec_num <- recipe(revenue ~ order_date, data = sales) |>
  step_date(order_date, features = c("month", "dow"), label = FALSE)

prep(rec_num) |> bake(new_data = NULL) |>
  subset(select = c(order_date_month, order_date_dow))
#> # A tibble: 6 x 2
#>   order_date_month order_date_dow
#>              <int>          <int>
#> 1                1              1
#> 2                2              6
#> 3                4              5
#> 4                6              7
#> 5                9              6
#> 6               12              6
```

[TIP]
**Use all_date_predictors() when several columns hold dates.** If a data frame has both an `order_date` and a `ship_date`, `step_date(rec, all_date_predictors())` expands both in one call. The selector picks only columns of class `Date` or `POSIXct`, so you never accidentally feed a numeric column to the step.

## step_date() vs lubridate vs base R

**Pick the tool that matches where the work happens.** All three extract calendar parts, but only `step_date()` keeps the logic inside a reusable recipe.

| Approach | Where it fits | New data handling |
|---|---|---|
| `step_date()` | tidymodels recipes | Reapplied automatically by `bake()` |
| `lubridate::month()` etc. | ad hoc dplyr mutate | You rewrite the `mutate()` for each dataset |
| `format(x, "%m")` | base R, no packages | Manual, returns character strings |

Use `step_date()` when the feature extraction belongs to a modeling pipeline, because the recipe travels with the workflow and applies the exact same transformation to test and production data. Reach for `lubridate` inside a one-off `mutate()` during exploration, and use base `format()` only when you cannot add a dependency.

## Common pitfalls with step_date()

**Most failures trace back to column type or to the leftover Date column.** Watch these three traps when adding the step.

1. **Passing a character column.** `step_date()` needs class `Date` or `POSIXct`. A column of strings like `"2023-01-15"` triggers an error. Convert it first with `as.Date()`, or add `step_mutate()` ahead of `step_date()`.
2. **Feeding the Date column to the model.** Because `keep_original_cols` defaults to `TRUE`, `order_date` survives baking. Most engines reject the `Date` class, so add `step_rm(order_date)` after `step_date()` once the features exist.
3. **Expecting numbers but getting factors.** With the default `label = TRUE`, `dow` and `month` are factors. A linear or boosted model needs numeric input, so either set `label = FALSE` or follow with `step_dummy()`.

[WARNING]
**A two-digit year is not a Date.** Reading a CSV can leave a date stored as an integer like `20230115` or as a character. `step_date()` does not parse those; it errors instead. Confirm the column with `class()` before building the recipe, and parse with `lubridate::ymd()` if needed.

## Try it yourself

**Try it:** Add `step_date()` to a recipe on the `sales` data so it extracts only the `month` and `year`, then bake it. Save the result to `ex_dated`.

```r title="Your turn: extract month and year"
# Try it: extract month and year only
ex_rec <- recipe(revenue ~ order_date, data = sales) |>
  step_date(# your code here)

ex_dated <- # your code here
names(ex_dated)
#> Expected: order_date, revenue, order_date_month, order_date_year
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(revenue ~ order_date, data = sales) |>
  step_date(order_date, features = c("month", "year"))

ex_dated <- prep(ex_rec) |> bake(new_data = NULL)
names(ex_dated)
#> [1] "order_date"       "revenue"          "order_date_month" "order_date_year"
```

**Explanation:** The `features` argument restricts the extraction to the two parts you name. The original `order_date` column stays because `keep_original_cols` is `TRUE` by default.

</details>

## Related recipes steps

**step_date() is one of several recipes steps for time-based predictors.** These pair naturally with it in a tidymodels workflow:

- [step_holiday()](recipes-step_holiday-in-R.html) flags whether each date is a named holiday.
- [step_lag()](recipes-step_lag-in-R.html) creates lagged copies of a column for time-series features.
- [step_window()](recipes-step_window-in-R.html) computes rolling statistics over a moving window.
- [step_dummy()](recipes-step_dummy-in-R.html) converts the new month and dow factors into 0/1 columns.
- [step_rm()](recipes-step_rm-in-R.html) removes the original Date column once the features exist.

[NOTE]
**Coming from Python pandas?** The equivalent of `step_date()` is reading the `.dt` accessor, as in `df["order_date"].dt.month` and `.dt.dayofweek`. The recipes version differs by packaging the extraction inside a recipe so the same features are produced for any new data.

## FAQ

**What does step_date() do in R?**

`step_date()` is a recipes step that expands a Date column into separate calendar features. By default it extracts the day of week, month, and year, creating columns named `<variable>_dow`, `<variable>_month`, and `<variable>_year`. You add it to a `recipe()`, register it with `prep()`, and apply it with `bake()`. Because calendar parts are deterministic, the step needs no training data to compute its output.

**What features can step_date() extract?**

The `features` argument accepts any of `year`, `doy` (day of year), `week`, `decimal` (decimal date), `semester`, `quarter`, `dow` (day of week), `month`, and `mday` (day of month). The default is `c("dow", "month", "year")`. Pass a character vector to choose others, for example `features = c("quarter", "week")`. Each requested feature becomes one new column appended to the data.

**Does step_date() keep the original date column?**

Yes. The `keep_original_cols` argument defaults to `TRUE`, so the source Date column remains in the baked output alongside the new feature columns. This is convenient for inspection but causes errors when the data reaches a model, because most engines cannot handle the `Date` class. Add `step_rm()` after `step_date()` to drop the original column before fitting.

**What is the difference between step_date() and step_holiday()?**

`step_date()` extracts general calendar parts such as month and day of week from a date. `step_holiday()` answers a narrower question: it creates 0/1 indicator columns marking whether each date falls on a named holiday, like `LaborDay` or `NewYearsDay`. They are complementary, so a typical recipe runs `step_date()` first for seasonality, then `step_holiday()` for special-day effects, then `step_rm()` to discard the raw date.
</content>
</invoke>
