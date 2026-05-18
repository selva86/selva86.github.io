---
title: "recipes step_lag() in R: Create Lagged Predictors"
slug: recipes-step_lag-in-R
description: "recipes step_lag() in R creates lagged copies of a column as new predictors for time-series models. Learn the lag argument, prefix, default, prep and bake."
keywords: "recipes step_lag, step_lag function R, recipes step_lag examples, R lagged predictors, step_lag tidymodels, lag features R, create lag variables R"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_lag()|recipes step_lag|recipes::step_lag()|step_lag|lagged predictors"
auto_link_case_sensitive: true
target_keyword: recipes step_lag
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_lag() in R: Create Lagged Predictors

<p class="lead">The <code>recipes</code> <code>step_lag()</code> function in R creates lagged copies of a column, shifting its values down by one or more rows so past observations become new predictor columns. You add it to a <code>recipe()</code>, register it with <code>prep()</code>, and apply it with <code>bake()</code>.</p>

[QUICK ANSWER]
step_lag(rec, units, lag = 1)              # one lag column
step_lag(rec, units, lag = 1:3)            # lags 1, 2 and 3
step_lag(rec, units, lag = c(1, 4))        # last week and four weeks back
step_lag(rec, units, prefix = "back_")     # custom column prefix
step_lag(rec, units, default = 0)          # fill leading gaps with 0
prep(rec) |> bake(new_data = NULL)         # learn, then apply

[DECISION TREE: Is step_lag() the right tool?]
- shift a column back in time: step_lag(rec, units, lag = 1)
- rolling mean or sum over a window: step_window(rec, units)
- extract month, weekday, year from a date: step_date(rec, week)
- flag named holidays on a date: step_holiday(rec, week)
- drop rows with NA from leading lags: step_naomit(rec, all_predictors())
- compute a change instead of a copy: step_mutate(rec, chg = units - lag(units))

## What step_lag() does in R

**step_lag() turns past values into present-day predictors.** Time-series models learn from history: last week's sales help predict this week's. A raw measurement column carries no memory, because each row stands alone. `step_lag()` copies a column and shifts it down by a fixed number of rows, so the value from `lag` rows ago lands next to the current row.

It belongs to the `recipes` package, the feature-engineering layer of tidymodels. The new column is named `<prefix><lag>_<variable>`. With the default `prefix = "lag_"`, lagging a `units` column by 1 produces a column called `lag_1_units`. The shift opens up empty cells at the top of the column, since the first row has nothing before it, and those cells are filled with `NA` by default.

[KEY INSIGHT]
**step_lag() shifts by row position, not by date.** It does not read a date column or check spacing between rows. It simply moves values down by `lag` positions in the order the rows arrive. Sorting the data correctly before the recipe runs is your job, not the step's.

## step_lag() syntax and arguments

**step_lag() attaches a lagging operation to a recipe.** You pass the recipe first, then the columns to lag, named directly or chosen with a selector such as `all_numeric_predictors()`.

```r title="The step_lag skeleton"
library(recipes)

sales <- data.frame(
  week  = as.Date("2024-01-01") + 7 * 0:7,
  units = c(120, 135, 150, 128, 142, 160, 155, 170)
)

recipe(units ~ week, data = sales) |>
  step_lag(units, lag = 1)
#> -- Recipe ----------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 1
#> -- Operations
#> * Lagging:  units
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Columns to lag, named or chosen with a selector. |
| `lag` | Integer vector of shift amounts. Default `1`. One new column per value. |
| `prefix` | String prepended to new column names. Default `"lag_"`. |
| `default` | Value used for the empty leading cells. Default `NA`. |
| `keep_original_cols` | If `TRUE` (default), the source column stays in the output. |

**The lag argument is the one you will always set.** A single integer makes one lagged column, while a vector like `1:3` or `c(1, 4)` makes one column per value. Lagging the outcome itself is the standard trick of autoregressive forecasting, and the new lagged column is given the `predictor` role automatically.

## step_lag() examples

**Build the recipe, prep it, then bake.** A recipe is only a plan until `prep()` registers the steps and `bake()` applies them. This recipe shifts `units` down by one row.

```r title="Lag one column and bake"
rec <- recipe(units ~ week, data = sales) |>
  step_lag(units, lag = 1)

baked <- prep(rec) |> bake(new_data = NULL)
baked
#> # A tibble: 8 x 3
#>   week       units lag_1_units
#>   <date>     <dbl>       <dbl>
#> 1 2024-01-01   120          NA
#> 2 2024-01-08   135         120
#> 3 2024-01-15   150         135
#> 4 2024-01-22   128         150
#> 5 2024-01-29   142         128
#> 6 2024-02-05   160         142
#> 7 2024-02-12   155         160
#> 8 2024-02-19   170         155
```

The new `lag_1_units` column holds each week's prior value. Row two reads `120`, the units figure from row one, and the first row is `NA` because no earlier week exists. Pass a vector to `lag` to build several shifted columns in one call.

```r title="Create several lags at once"
multi <- recipe(units ~ week, data = sales) |>
  step_lag(units, lag = 1:3) |>
  prep() |>
  bake(new_data = NULL)

multi
#> # A tibble: 8 x 5
#>   week       units lag_1_units lag_2_units lag_3_units
#>   <date>     <dbl>       <dbl>       <dbl>       <dbl>
#> 1 2024-01-01   120          NA          NA          NA
#> 2 2024-01-08   135         120          NA          NA
#> 3 2024-01-15   150         135         120          NA
#> 4 2024-01-22   128         150         135         120
#> 5 2024-01-29   142         128         150         135
#> 6 2024-02-05   160         142         128         150
#> 7 2024-02-12   155         160         142         128
#> 8 2024-02-19   170         155         160         142
```

Each value of `lag` produces its own column, and deeper lags leave more `NA` cells at the top. The `default` argument replaces those empty cells with a value you choose, which keeps every row usable.

```r title="Fill the leading gap with default"
filled <- recipe(units ~ week, data = sales) |>
  step_lag(units, lag = 1, default = 0) |>
  prep() |>
  bake(new_data = NULL)

head(filled, 3)
#> # A tibble: 3 x 3
#>   week       units lag_1_units
#>   <date>     <dbl>       <dbl>
#> 1 2024-01-01   120           0
#> 2 2024-01-08   135         120
#> 3 2024-01-15   150         135
```

Now row one carries `0` instead of `NA`. Choose the fill value carefully, because a constant like `0` is a real number the model will treat as data, not as missing.

[TIP]
**Reach for seasonal lags, not just lag 1.** Weekly data often repeats every four or five weeks, and monthly data every twelve. Passing `lag = c(1, 4)` builds both a short-term and a seasonal feature in one step, which usually beats a single lag for forecasting accuracy.

## step_lag() vs lag() vs step_window()

**Pick the tool that matches how the feature must travel to new data.** A lag is a copy, a window is an aggregate, and only a recipe step reapplies cleanly when fresh rows arrive.

| Approach | What it produces | New data handling |
|---|---|---|
| `step_lag()` | Shifted copies of a column inside a recipe | `bake()` reapplies the shift to new rows |
| `dplyr::lag()` | A shifted vector, computed once outside any recipe | You rerun the `mutate()` on every new dataset |
| `step_window()` | Rolling aggregate such as a moving mean or sum | `bake()` reapplies the window to new rows |

Use `step_lag()` when the exact past value matters, such as last month's revenue. Reach for `step_window()` when a smoothed trend matters more than any single point. Use `dplyr::lag()` only for quick exploration, since it lives outside the recipe and will not follow your model to production.

## Common pitfalls with step_lag()

**Most failures trace back to row order or the new NA cells.** Watch these three traps when adding the step.

1. **Unsorted data.** `step_lag()` shifts by position, so rows must already be in time order. Sort with `arrange(week)` or `data[order(data$week), ]` before you build the recipe, or the lags pair up the wrong observations.
2. **Leading NA values.** The first `max(lag)` rows always contain `NA`. Many engines reject `NA`, so either set a `default` or add `step_naomit(all_predictors())` to drop those rows before fitting.
3. **Mixing several series in one frame.** `step_lag()` has no group awareness. With stacked panels, such as sales for many stores, the lag bleeds the tail of one store into the head of the next. Lag each series in its own recipe, or filter to one series first.

[WARNING]
**step_lag() never sorts the data for you.** If the rows are shuffled, the step still runs without error and still produces a `lag_1_units` column, but every lagged value is meaningless. There is no warning. Always sort by your time column before the recipe sees the data.

## Try it yourself

**Try it:** Add `step_lag()` to a recipe on the `sales` data so it creates lags 1 and 2 of `units`, then bake it. Save the result to `ex_lagged`.

```r title="Your turn: build two lags"
# Try it: lag units by 1 and 2
ex_rec <- recipe(units ~ week, data = sales) |>
  step_lag(# your code here)

ex_lagged <- # your code here
names(ex_lagged)
#> Expected: week, units, lag_1_units, lag_2_units
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(units ~ week, data = sales) |>
  step_lag(units, lag = 1:2)

ex_lagged <- prep(ex_rec) |> bake(new_data = NULL)
names(ex_lagged)
#> [1] "week"        "units"       "lag_1_units" "lag_2_units"
```

**Explanation:** Passing `lag = 1:2` tells `step_lag()` to build one shifted column per value, so `units` gains both a one-step and a two-step lagged copy. `prep()` registers the step and `bake()` applies it.

</details>

## Related recipes steps

**step_lag() is one of several recipes steps for time-based predictors.** These pair naturally with it in a tidymodels workflow:

- [step_window()](recipes-step_window-in-R.html) computes a rolling mean or sum over a moving window.
- [step_date()](recipes-step_date-in-R.html) extracts month, day-of-week, and year from a date.
- [step_holiday()](recipes-step_holiday-in-R.html) flags named holidays on a date column.
- [step_naomit()](recipes-step_naomit-in-R.html) drops rows left with NA after lagging.
- [recipe()](recipes-recipe-in-R.html) is the starting point every step is added to.

See the [official step_lag() reference](https://recipes.tidymodels.org/reference/step_lag.html) for the full argument list.

[NOTE]
**Coming from Python pandas?** The closest equivalent is `df["units"].shift(1)`, which shifts a Series by one row. The recipes version differs by packaging the shift inside a recipe, so the same lag is recomputed whenever `bake()` runs on new data.

## FAQ

**What does step_lag() do in R?**

`step_lag()` is a recipes step that adds lagged copies of one or more columns to a dataset. It shifts a column's values down by a fixed number of rows so that a past observation sits beside the current one, which is how time-series models gain memory. You add it to a `recipe()`, register it with `prep()`, and apply it with `bake()`. New columns are named `lag_<n>_<variable>` by default, and the first rows hold `NA` because no earlier value exists.

**How do I create multiple lag features at once?**

Pass a vector to the `lag` argument. `step_lag(rec, units, lag = 1:3)` builds three columns, lagged by one, two, and three rows. A non-contiguous vector works too: `lag = c(1, 12)` pairs a short-term lag with a seasonal one for monthly data. Each value in the vector becomes its own column, named with the matching number, so one call can generate a whole block of lagged predictors.

**Why does step_lag() produce NA values?**

The shift opens empty cells at the top of every lagged column. A lag of 1 leaves the first row with no prior value, a lag of 3 leaves the first three rows empty, and so on. By default those cells are filled with `NA`. To avoid them, set the `default` argument to a numeric fill value, or add `step_naomit()` to your recipe to drop the incomplete leading rows before the model is fit.

**Does step_lag() sort the data by date?**

No. `step_lag()` shifts values strictly by row position and never inspects a date column. If your rows are out of order, the step still runs and still produces lagged columns, but the values are paired incorrectly and the feature is useless. Always sort the data by its time column, with `dplyr::arrange()` or `order()`, before you build and prep the recipe.
</content>
</invoke>
