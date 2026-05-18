---
title: "recipes step_holiday() in R: Add Holiday Indicator Features"
slug: recipes-step_holiday-in-R
description: "recipes step_holiday() in R creates 0/1 indicator columns marking named holidays on a date column. Learn the syntax, the holidays argument, prep and bake."
keywords: "recipes step_holiday, step_holiday function R, recipes step_holiday examples, R holiday features, step_holiday tidymodels, holiday dummy variables R, add holiday indicators R"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: caret-preProcess-in-R.html
auto_link_terms: "step_holiday()|recipes step_holiday|recipes::step_holiday()|step_holiday|holiday features"
auto_link_case_sensitive: true
target_keyword: recipes step_holiday
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_holiday() in R: Add Holiday Indicator Features

<p class="lead">The <code>recipes</code> <code>step_holiday()</code> function in R creates binary 0/1 indicator columns that mark whether each date falls on a named holiday. You add it to a <code>recipe()</code>, register it with <code>prep()</code>, and apply it with <code>bake()</code>.</p>

[QUICK ANSWER]
step_holiday(rec, event_date)                                  # default 3 holidays
step_holiday(rec, event_date, holidays = "USIndependenceDay")  # one named holiday
step_holiday(rec, event_date, holidays = listHolidays("US"))   # every US holiday
step_holiday(rec, all_date_predictors())                       # all date columns
step_holiday(rec, event_date, keep_original_cols = FALSE)      # drop the raw date
prep(rec) |> bake(new_data = NULL)                             # learn, then apply

[DECISION TREE: Is step_holiday() the right tool?]
- flag named holidays on a date: step_holiday(rec, event_date)
- extract month, day-of-week, year: step_date(rec, event_date)
- compute days since a fixed event: step_mutate(rec, gap = date - ref)
- build lagged values of a column: step_lag(rec, sales, lag = 1)
- encode resulting factor columns: step_dummy(rec, all_nominal_predictors())
- drop the leftover Date column: step_rm(rec, event_date)

## What step_holiday() does in R

**step_holiday() turns a date into yes/no holiday flags.** Calendar effects are real: retail sales spike before Christmas, web traffic drops on New Year's Day, and clinics see fewer visits on public holidays. A raw `Date` column hides that signal, because a model reads `2024-12-25` as just another number. `step_holiday()` adds one column per holiday you name, holding `1` when the date matches and `0` otherwise.

It belongs to the `recipes` package, the feature-engineering layer of tidymodels. The new columns are named `<variable>_<holiday>`, so an `event_date` column checked against `USChristmasDay` produces a column called `event_date_USChristmasDay`. Holiday names come from the `timeDate` package, which computes the calendar date of each named holiday for any year.

[KEY INSIGHT]
**step_holiday() is deterministic, so prep() learns nothing from the data.** Whether a date is a holiday does not depend on the training set. `prep()` still runs to register the step, but the same date always yields the same flags in training, test, and future data.

## step_holiday() syntax and arguments

**step_holiday() attaches a holiday-flagging operation to a recipe.** You pass the recipe first, then the date columns to check, named directly or selected with `all_date_predictors()`.

```r title="The step_holiday skeleton"
library(recipes)

events <- data.frame(
  event_date = as.Date(c("2024-01-01", "2024-07-04", "2024-12-25",
                          "2024-03-15", "2024-08-20")),
  attendance = c(210, 480, 720, 260, 300)
)

recipe(attendance ~ event_date, data = events) |>
  step_holiday(event_date)
#> -- Recipe ----------------------------------------------------------------
#> -- Inputs
#> Number of variables by role
#> outcome:   1
#> predictor: 1
#> -- Operations
#> * Holiday features from: event_date
```

The arguments you will actually touch:

| Argument | Purpose |
|---|---|
| `recipe` | The recipe object the step is added to. |
| `...` | Date columns to flag, named or selected with `all_date_predictors()`. |
| `holidays` | Character vector of holiday names. Default `c("LaborDay", "NewYearsDay", "ChristmasDay")`. |
| `keep_original_cols` | If `TRUE` (default), the source Date column stays in the output. |
| `role` | Role given to the new columns. Default `"predictor"`. |

**The holidays argument is the one you will always set.** Its default covers only three days, so name the holidays your problem needs. Valid names come from `timeDate::listHolidays()`, which returns every supported holiday, with region prefixes such as `US`, `CA`, and `GB`.

## step_holiday() examples

**Build the recipe, prep it, then bake.** A recipe is only a plan until `prep()` registers the steps and `bake()` applies them. This recipe checks `event_date` against three US holidays.

```r title="Flag three holidays and bake"
rec <- recipe(attendance ~ event_date, data = events) |>
  step_holiday(event_date,
               holidays = c("USNewYearsDay", "USIndependenceDay",
                            "USChristmasDay"))

baked <- prep(rec) |> bake(new_data = NULL)
subset(baked, select = -c(event_date, attendance))
#> # A tibble: 5 x 3
#>   event_date_USNewYearsDay event_date_USIndependenceDay event_date_USChristmasDay
#>                      <int>                        <int>                     <int>
#> 1                        1                            0                         0
#> 2                        0                            1                         0
#> 3                        0                            0                         1
#> 4                        0                            0                         0
#> 5                        0                            0                         0
```

Each holiday becomes its own 0/1 column. Rows four and five (March and August dates) are all zero because neither date is one of the named holidays. To find valid holiday names, call `listHolidays()` from `timeDate`. Pass a pattern to filter by region.

```r title="List the available holiday names"
library(timeDate)
listHolidays("US")
#>  [1] "USCPulaskisBirthday"  "USChristmasDay"       "USColumbusDay"
#>  [4] "USElectionDay"        "USGoodFriday"         "USInaugurationDay"
#>  [7] "USIndependenceDay"    "USLaborDay"           "USLincolnsBirthday"
#> [10] "USMLKingsBirthday"    "USMemorialDay"        "USNewYearsDay"
#> [13] "USPresidentsDay"      "USThanksgivingDay"    "USVeteransDay"
#> [16] "USWashingtonsBirthday"
```

Because the step is deterministic, it produces the same flags for dates the recipe has never seen. Apply the prepped recipe to new rows with `bake(new_data = ...)` and the holidays are recomputed for that year automatically.

```r title="Apply the recipe to new dates"
new_events <- data.frame(
  event_date = as.Date(c("2025-01-01", "2025-06-10")),
  attendance = c(NA, NA)
)

prep(rec) |> bake(new_data = new_events) |>
  subset(select = -c(event_date, attendance))
#> # A tibble: 2 x 3
#>   event_date_USNewYearsDay event_date_USIndependenceDay event_date_USChristmasDay
#>                      <int>                        <int>                     <int>
#> 1                        1                            0                         0
#> 2                        0                            0                         0
```

The 2025 New Year's Day is flagged correctly even though every training date was in 2024, because `timeDate` resolves each holiday per year rather than from a fixed lookup table.

[TIP]
**Use all_date_predictors() when several columns hold dates.** If a frame has both an `order_date` and a `ship_date`, `step_holiday(rec, all_date_predictors())` flags both in one call. The selector picks only `Date` and `POSIXct` columns, so a numeric column is never fed in by accident.

## step_holiday() vs step_date() vs manual flags

**Pick the tool that matches the calendar signal you need.** Holiday effects and seasonal effects are different features, and only a recipe step reapplies cleanly to new data.

| Approach | What it captures | New data handling |
|---|---|---|
| `step_holiday()` | 0/1 flags for named holidays | Recomputed by `bake()` for any year |
| `step_date()` | Calendar parts: month, day-of-week, year | Reapplied automatically by `bake()` |
| Manual `ifelse()` on a date list | Only the dates you hardcode | You rewrite the list every year |

Use `step_holiday()` when special days drive the outcome, such as sales, staffing, or traffic. Reach for `step_date()` when smooth seasonality matters more than specific days. A typical recipe runs both: `step_date()` for month and weekday, then `step_holiday()` for the special-day spikes.

## Common pitfalls with step_holiday()

**Most failures trace back to the holiday name or the column type.** Watch these three traps when adding the step.

1. **An unknown holiday name.** A name not returned by `listHolidays()`, such as `"Christmas"` instead of `"USChristmasDay"`, raises an error. Copy names straight from `listHolidays()` to avoid typos.
2. **Passing a character column.** `step_holiday()` needs class `Date` or `POSIXct`. A column of strings like `"2024-12-25"` errors. Convert it first with `as.Date()`.
3. **Feeding the Date column to the model.** With `keep_original_cols = TRUE` (the default), `event_date` survives baking. Most engines reject the `Date` class, so add `step_rm(event_date)` once the flags exist.

[WARNING]
**The default holidays argument flags only three days.** `step_holiday()` defaults to `c("LaborDay", "NewYearsDay", "ChristmasDay")`, not the full national calendar. A recipe written without an explicit `holidays` argument silently ignores Thanksgiving, Independence Day, and every other date. Always name the holidays your model needs.

## Try it yourself

**Try it:** Add `step_holiday()` to a recipe on the `events` data so it flags `USIndependenceDay` and `USChristmasDay`, then bake it. Save the result to `ex_holidays`.

```r title="Your turn: flag two holidays"
# Try it: flag Independence Day and Christmas
ex_rec <- recipe(attendance ~ event_date, data = events) |>
  step_holiday(# your code here)

ex_holidays <- # your code here
names(ex_holidays)
#> Expected: event_date, attendance, event_date_USIndependenceDay, event_date_USChristmasDay
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(attendance ~ event_date, data = events) |>
  step_holiday(event_date,
               holidays = c("USIndependenceDay", "USChristmasDay"))

ex_holidays <- prep(ex_rec) |> bake(new_data = NULL)
names(ex_holidays)
#> [1] "event_date"                   "attendance"
#> [3] "event_date_USIndependenceDay" "event_date_USChristmasDay"
```

**Explanation:** The `holidays` argument names the two holidays to check, and each becomes a 0/1 column. The original `event_date` column stays because `keep_original_cols` is `TRUE` by default.

</details>

## Related recipes steps

**step_holiday() is one of several recipes steps for time-based predictors.** These pair naturally with it in a tidymodels workflow:

- [step_date()](recipes-step_date-in-R.html) extracts month, day-of-week, and year from a date.
- [step_lag()](recipes-step_lag-in-R.html) creates lagged copies of a column for time-series features.
- [step_dummy()](recipes-step_dummy-in-R.html) converts factor columns into 0/1 indicators.
- [step_rm()](recipes-step_rm-in-R.html) removes the original Date column once the flags exist.
- [recipe()](recipes-recipe-in-R.html) is the starting point every step is added to.

[NOTE]
**Coming from Python pandas?** The closest equivalent is the `holidays` package or `pandas.tseries.holiday.USFederalHolidayCalendar`, checked against a date column. The recipes version differs by packaging the logic inside a recipe so the same flags are produced for any new data.

## FAQ

**What does step_holiday() do in R?**

`step_holiday()` is a recipes step that adds binary indicator columns to a dataset, one per holiday you name. Each column holds `1` when a date matches that holiday and `0` otherwise. You add it to a `recipe()`, register it with `prep()`, and apply it with `bake()`. The new columns are named `<variable>_<holiday>`. Because holidays are deterministic, the step needs no training data to compute its output.

**How do I see the list of valid holiday names?**

Call `listHolidays()` from the `timeDate` package, which `recipes` uses under the hood. With no argument it returns every supported holiday; pass a pattern such as `listHolidays("US")` or `listHolidays("CA")` to filter by region. The names are case-sensitive and must be copied exactly, for example `USThanksgivingDay`. Any name not in this list raises an error when the recipe is prepped.

**What is the difference between step_holiday() and step_date()?**

`step_date()` extracts general calendar parts such as month, day-of-week, and year from a date. `step_holiday()` answers a narrower question: it flags whether each date falls on a specific named holiday. They are complementary. A typical recipe runs `step_date()` first for smooth seasonality, then `step_holiday()` for special-day spikes, then `step_rm()` to drop the raw date column before fitting a model.

**Does step_holiday() work for non-US holidays?**

Yes. The `timeDate` package supports holidays for several regions, including Canada (`CA` prefix), Great Britain (`GB`), Switzerland, and others, plus religious holidays like `Easter` and `GoodFriday`. Run `listHolidays()` with the matching pattern to see what is available. Pass any of those names in the `holidays` argument exactly as listed, and `step_holiday()` flags them the same way it flags US holidays.
</content>
</invoke>
