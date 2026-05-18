---
title: "recipes step_window() in R: Smooth Numeric Predictors"
slug: recipes-step_window-in-R
description: "recipes step_window() in R computes moving-window statistics like a rolling mean or median on a numeric column. Learn the size, statistic and names arguments."
keywords: "recipes step_window, step_window function R, recipes step_window examples, R moving average recipe, rolling window preprocessing R, step_window tidymodels, smooth column R"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_window()|recipes step_window|recipes::step_window()|step_window|moving window recipe"
auto_link_case_sensitive: true
target_keyword: recipes step_window
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_window() in R: Smooth Numeric Predictors

<p class="lead">The <code>recipes</code> <code>step_window()</code> function in R computes a moving-window statistic, such as a rolling mean or median, across a numeric column to smooth out short-term noise. You add it to a <code>recipe()</code>, register it with <code>prep()</code>, and apply it with <code>bake()</code>.</p>

[QUICK ANSWER]
step_window(rec, units)                        # 3-point moving mean, in place
step_window(rec, units, size = 5)              # wider 5-point window
step_window(rec, units, statistic = "median")  # rolling median, robust to spikes
step_window(rec, units, statistic = "sum")     # rolling sum over the window
step_window(rec, units, names = "units_ma")    # new column, keep the original
step_window(rec, units, na_rm = FALSE)         # let NA propagate into windows
prep(rec) |> bake(new_data = NULL)             # learn, then apply

[DECISION TREE: Is step_window() the right tool?]
- smooth a noisy series with a moving average: step_window(rec, units)
- copy a past value as a feature: step_lag(rec, units, lag = 1)
- fill NA gaps with a rolling statistic: step_impute_roll(rec, units)
- extract calendar parts from a date: step_date(rec, week)
- rescale a column to mean zero: step_normalize(rec, units)
- apply a custom rolling formula: step_mutate(rec, ...)

## What step_window() does in R

**step_window() replaces a column with its own moving-window summary.** Raw measurements often jitter from week to week even when the underlying trend is smooth. `step_window()` slides a fixed-width window along a numeric column and, at every row, replaces the value with a statistic computed from the values inside that window. The default statistic is the mean, so the column becomes a moving average of itself.

It belongs to the `recipes` package, the feature-engineering layer of tidymodels. The window is center-justified: for a window of `size = 3`, the smoothed value at a row is the statistic of that row plus its immediate neighbour on each side. The first and last rows have no full window, so they reuse the first and last complete window values respectively. That keeps the output the same length as the input with no `NA` cells.

[KEY INSIGHT]
**step_window() overwrites the column unless you ask it not to.** With no `names` argument, the smoothed values replace the original column in place. Supply `names` and the step instead creates fresh columns and leaves the source untouched. Decide which you want before you prep the recipe.

## step_window() syntax and arguments

**step_window() attaches a windowing operation to a recipe.** You pass the recipe first, then the numeric columns to smooth, named directly or chosen with a selector such as `all_numeric_predictors()`.

```r title="The step_window skeleton"
library(recipes)

sales <- data.frame(
  week  = as.Date("2024-01-01") + 7 * 0:7,
  units = c(120, 150, 135, 165, 150, 180, 165, 195)
)

recipe(units ~ week, data = sales) |>
  step_window(units, size = 3)
#> -- Recipe ----------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 1
#> -- Operations
#> * Moving window: units
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Numeric columns to smooth, named or chosen with a selector. |
| `size` | Window width. Must be an odd integer of 3 or more. Default `3`. |
| `statistic` | Window summary: `"mean"`, `"median"`, `"sum"`, `"min"`, `"max"`, `"sd"`, `"var"` or `"prod"`. Default `"mean"`. |
| `na_rm` | Drop `NA` inside each window before computing. Default `TRUE`. |
| `names` | Optional new column names. Supply this to keep the originals. |
| `keep_original_cols` | Keep the source columns when `names` is set. Default `TRUE`. |

**The size and statistic arguments shape the smoothing.** A larger `size` averages over more rows and produces a flatter line, while `statistic` swaps the mean for a median, sum, or spread measure. Both are common targets for tuning when the smoothing window itself is a model hyperparameter.

[NOTE]
**step_window() needs the RcppRoll package.** The rolling math is delegated to RcppRoll, so install it once with `install.packages("RcppRoll")`. If it is missing, `prep()` stops with a message naming the package rather than smoothing the column.

## step_window() examples

**Build the recipe, prep it, then bake.** A recipe is only a plan until `prep()` registers the steps and `bake()` applies them. This recipe smooths `units` with the default 3-point moving mean.

```r title="Smooth a column in place"
rec <- recipe(units ~ week, data = sales) |>
  step_window(units, size = 3)

baked <- prep(rec) |> bake(new_data = NULL)
baked
#> # A tibble: 8 x 2
#>   week       units
#>   <date>     <dbl>
#> 1 2024-01-01   135
#> 2 2024-01-08   135
#> 3 2024-01-15   150
#> 4 2024-01-22   150
#> 5 2024-01-29   165
#> 6 2024-02-05   165
#> 7 2024-02-12   180
#> 8 2024-02-19   180
```

The zigzag in the raw `units` figures is gone, leaving a clean rising trend. Notice the column is still called `units`: the smoothed values replaced the originals. To keep both, pass the `names` argument.

```r title="Keep the original column"
rec_named <- recipe(units ~ week, data = sales) |>
  step_window(units, size = 3, names = "units_ma")

prep(rec_named) |> bake(new_data = NULL)
#> # A tibble: 8 x 3
#>   week       units units_ma
#>   <date>     <dbl>    <dbl>
#> 1 2024-01-01   120      135
#> 2 2024-01-08   150      135
#> 3 2024-01-15   135      150
#> 4 2024-01-22   165      150
#> 5 2024-01-29   150      165
#> 6 2024-02-05   180      165
#> 7 2024-02-12   165      180
#> 8 2024-02-19   195      180
```

Now `units` keeps its raw values and `units_ma` carries the moving average alongside it. The `size` and `statistic` arguments change how aggressively the column is smoothed.

```r title="Wider window and a different statistic"
recipe(units ~ week, data = sales) |>
  step_window(units, size = 5, statistic = "median", names = "units_med") |>
  prep() |>
  bake(new_data = NULL)
#> # A tibble: 8 x 3
#>   week       units units_med
#>   <date>     <dbl>     <dbl>
#> 1 2024-01-01   120       150
#> 2 2024-01-08   150       150
#> 3 2024-01-15   135       150
#> 4 2024-01-22   165       150
#> 5 2024-01-29   150       165
#> 6 2024-02-05   180       165
#> 7 2024-02-12   165       165
#> 8 2024-02-19   195       165
```

A `size = 5` window spans five rows, and `statistic = "median"` reports the middle value instead of the average. The median ignores how far an outlier sits from the centre, so a single spike moves it far less than it moves a mean.

[TIP]
**Reach for the median when spikes are noise, not signal.** A promotion week or a data-entry error can drag a moving mean off course for several rows. `statistic = "median"` reports the central value of each window, so one extreme point barely shifts the smoothed line.

## step_window() vs step_lag() vs slider

**Pick the tool that matches whether you want an aggregate, a copy, or raw control.** A window summarises nearby rows, a lag copies one past row, and a manual rolling call trades convenience for flexibility.

| Approach | What it produces | New data handling |
|---|---|---|
| `step_window()` | Rolling statistic such as a moving mean or median | `bake()` reapplies the window to new rows |
| `step_lag()` | Shifted copies of a column as past-value features | `bake()` reapplies the shift to new rows |
| `slider::slide_dbl()` | Any rolling computation you write by hand | You rerun the `mutate()` on every new dataset |

Use `step_window()` when a smoothed trend matters more than any single observation. Reach for `step_lag()` when the exact past value is the feature you need. Drop down to `slider` only for a rolling computation that `statistic` cannot express.

## Common pitfalls with step_window()

**Most failures trace back to window size or row order.** Watch these three traps when adding the step.

1. **Even or too-small window.** `size` must be an odd integer of 3 or more. Passing `size = 4` or `size = 2` throws an error before the recipe preps, because a center-justified window has no defined midpoint without an odd width.
2. **Unsorted data.** The window slides by row position, not by date. If the rows are not already in time order, the moving average mixes unrelated periods. Sort with `arrange(week)` before you build the recipe.
3. **Mixing several series in one frame.** `step_window()` has no group awareness. With stacked panels, such as sales for many stores, the window straddles the boundary between stores. Smooth each series separately or filter to one before applying the step.

[WARNING]
**A large window quietly leaks the future.** A center-justified window uses rows on both sides of the current one, so a wide `size` blends in values that come after each point. For honest forecasting features, prefer `step_lag()` or a trailing window, since `step_window()` peeks ahead by design.

## Try it yourself

**Try it:** Add `step_window()` to a recipe on the `sales` data so it creates a 5-point moving mean of `units` in a new column called `units_avg5`, then bake it. Save the result to `ex_smoothed`.

```r title="Your turn: build a 5-point mean"
# Try it: 5-point moving mean of units
ex_rec <- recipe(units ~ week, data = sales) |>
  step_window(# your code here)

ex_smoothed <- # your code here
names(ex_smoothed)
#> Expected: week, units, units_avg5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(units ~ week, data = sales) |>
  step_window(units, size = 5, statistic = "mean", names = "units_avg5")

ex_smoothed <- prep(ex_rec) |> bake(new_data = NULL)
names(ex_smoothed)
#> [1] "week"       "units"      "units_avg5"
```

**Explanation:** Setting `names = "units_avg5"` tells `step_window()` to write a new column rather than overwrite `units`. With `size = 5` and the default `statistic = "mean"`, that column holds a five-row moving average.

</details>

## Related recipes steps

**step_window() is one of several recipes steps for time-based predictors.** These pair naturally with it in a tidymodels workflow:

- [step_lag()](recipes-step_lag-in-R.html) creates shifted copies of a column as past-value features.
- [step_date()](recipes-step_date-in-R.html) extracts month, day-of-week, and year from a date.
- [step_impute_roll()](recipes-step_impute_roll-in-R.html) fills missing values with a rolling-window statistic.
- [step_normalize()](recipes-step_normalize-in-R.html) centers and scales a numeric column.
- [recipe()](recipes-recipe-in-R.html) is the starting point every step is added to.

See the [official step_window() reference](https://recipes.tidymodels.org/reference/step_window.html) for the full argument list.

## FAQ

**What does step_window() do in R?**

`step_window()` is a recipes step that computes a moving-window statistic across a numeric column. At every row it slides a fixed-width window, summarises the values inside with a statistic such as the mean or median, and uses that as the row's value. The default is a 3-point moving mean. You add it to a `recipe()`, register it with `prep()`, and apply it with `bake()`. By default it replaces the column in place, keeping the output the same length as the input.

**What window sizes can step_window() use?**

The `size` argument must be an odd integer of 3 or more. Odd widths are required because the window is center-justified: each smoothed value sits at the midpoint of its window, and only an odd count of rows has a true middle. Common choices are `3`, `5`, and `7`. A larger `size` produces a flatter, less responsive line and is often tuned as a hyperparameter.

**Does step_window() replace the original column?**

Yes, by default. With no `names` argument, the smoothed values overwrite the source column and the role stays unchanged. To keep the raw column, pass `names` with one new name per selected column. The step then writes those new columns and leaves the originals in place, controlled by `keep_original_cols`, which defaults to `TRUE`.

**Why does step_window() need RcppRoll?**

The rolling calculations are delegated to the RcppRoll package, which implements them in compiled C++ for speed. `recipes` lists RcppRoll as a suggested dependency rather than a hard one, so it is not installed automatically. If you call `step_window()` without it, `prep()` stops with a message telling you to run `install.packages("RcppRoll")`. Install it once and the step works normally.
</content>
</invoke>
