---
title: "lubridate wday() in R: Day-of-Week From Dates"
slug: "lubridate-wday-in-R"
description: "Use lubridate wday() in R to extract the day of the week from a Date or POSIXct, switch Sunday vs Monday weeks, get ordered factor labels, and group by weekday."
keywords: "lubridate wday, wday function R, lubridate wday examples, day of week R, weekday from date R, lubridate weekday, wday() label"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "wday()|lubridate wday|lubridate::wday()|day of week|day-of-week extractor"
auto_link_case_sensitive: true
target_keyword: "lubridate wday"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate wday() in R: Day-of-Week From Dates

<p class="lead">The <code>wday()</code> function in lubridate returns the day of the week from a Date or POSIXct value as either an integer (1 to 7) or an ordered factor label like "Mon". It is the weekly-cycle counterpart to <code>yday()</code>, designed to drive weekday-vs-weekend analysis, day-of-week aggregations, and ordered plotting axes.</p>

[QUICK ANSWER]
wday(ymd("2024-02-14"))                       # integer, Sunday-week default
wday(ymd("2024-02-14"), week_start = 1)       # integer, Monday-week
wday(ymd("2024-02-14"), label = TRUE)         # ordered factor "Wed"
wday(ymd("2024-02-14"), label = TRUE, abbr = FALSE) # "Wednesday"
wday(x) %in% c(1, 7)                          # TRUE on weekends
wday(x) <- 2                                  # snap a date to Monday
df |> mutate(dow = wday(date, label = TRUE))  # ordered factor column
df |> count(wday(date, label = TRUE))         # tallies per weekday

[DECISION TREE: Is wday() the right tool?]
- pull the day of week (1 to 7 or Mon to Sun): wday(x, label = TRUE)
- pull the day of year (1 to 366): yday(x)
- pull the day of month (1 to 31): mday(x)
- pull ISO week of year (1 to 53): isoweek(x)
- check if a date is a weekend: wday(x) %in% c(1, 7)
- snap a date to the start of the week: floor_date(x, "week")
- get business days between two dates: bizdays from package bizdays
- format the weekday as a plain string: format(x, "%A")

## What wday() does in one sentence

**`wday()` returns the day-of-week position of a date-time, as integer or labelled factor.** Pass any Date, POSIXct, or POSIXlt vector and you get a vector of the same length with values 1 through 7 (default Sunday as 1), or an ordered factor of weekday names when `label = TRUE`. The function is fully vectorised.

The "w" prefix stands for "week". It is the lubridate counterpart to base R's `as.POSIXlt(x)$wday + 1L`, but adds two switches base R lacks: a `label` argument for ordered factor output and a `week_start` argument for Monday-first weeks.

## Syntax

**`wday(x, label = FALSE, abbr = TRUE, week_start = 7)` takes four arguments.** Only the date-time vector `x` is required; the rest control output format and the week-start day. Locale affects label names but not numeric output.

```r title="Load lubridate and pull a weekday"
library(lubridate)

d <- ymd("2024-02-14")
wday(d)
#> [1] 4

wday(d, label = TRUE)
#> [1] Wed
#> Levels: Sun < Mon < Tue < Wed < Thu < Fri < Sat

wday(d, week_start = 1)
#> [1] 3
```

The default `week_start = 7` means Sunday is day 1, matching the US convention. Setting `week_start = 1` flips to ISO 8601 (Monday as day 1), so Wednesday becomes 3 instead of 4. The `abbr` argument toggles "Wed" vs "Wednesday" when `label = TRUE`.

[TIP]
**Always set `week_start` explicitly in shared code.** The default reads from `getOption("lubridate.week.start", 7)`, so a colleague who set the option to 1 sees Mondays as 1 while your machine sees Mondays as 2. Hard-code `week_start = 1` or `week_start = 7` in production code to remove the global-state dependency.

## Five common patterns

### 1. Get the weekday as an integer

```r title="Numeric day of week"
d <- ymd(c("2024-01-01", "2024-02-14", "2024-07-04", "2024-12-25"))
wday(d)
#> [1] 2 4 5 4
```

Returned as integers 1 through 7. With the Sunday-week default, Monday (Jan 1, 2024) is 2 and Wednesday (Feb 14, 2024) is 4. Use these directly in arithmetic, comparison, and `%in%` checks.

### 2. Get the weekday as an ordered factor label

```r title="Labelled output for plots and tables"
wday(d, label = TRUE)
#> [1] Mon Wed Thu Wed
#> Levels: Sun < Mon < Tue < Wed < Thu < Fri < Sat

wday(d, label = TRUE, abbr = FALSE)
#> [1] Monday    Wednesday Thursday  Wednesday
#> Levels: Sunday < Monday < Tuesday < Wednesday < Thursday < Friday < Saturday
```

`label = TRUE` returns an ordered factor, so ggplot2 axes and `arrange()` calls respect the natural Sun-to-Sat order without manual `factor()` casting. Set `abbr = FALSE` for full weekday names; locale controls the language.

### 3. Switch between Sunday-week and Monday-week conventions

```r title="Same date, two week conventions"
new_year <- ymd("2024-01-01")

wday(new_year, week_start = 7)             # Sunday-week (US default)
#> [1] 2

wday(new_year, week_start = 1)             # Monday-week (ISO 8601)
#> [1] 1

wday(new_year, label = TRUE, week_start = 1)
#> [1] Mon
#> Levels: Mon < Tue < Wed < Thu < Fri < Sat < Sun
```

January 1, 2024 was a Monday. Under the Sunday-week default it returns 2; under the Monday-week convention it returns 1. The factor levels also reorder so "Mon" sits first, which keeps ggplot2 week-aligned heatmaps Mon-Sun without manual relevelling.

### 4. Flag weekends

```r title="Weekend indicator column"
library(dplyr)

set.seed(1)
sales <- tibble(
  sale_date = seq(ymd("2024-01-01"), ymd("2024-01-14"), by = "day"),
  amount = round(200 + rnorm(14, 0, 20), 1)
)

sales |>
  mutate(
    dow = wday(sale_date, label = TRUE),
    is_weekend = wday(sale_date) %in% c(1, 7)
  ) |>
  head(7)
#> # A tibble: 7 x 4
#>   sale_date  amount dow   is_weekend
#>   <date>      <dbl> <ord> <lgl>
#> 1 2024-01-01  187.  Mon   FALSE
#> 2 2024-01-02  204.  Tue   FALSE
#> 3 2024-01-03  183.  Wed   FALSE
#> 4 2024-01-04  232.  Thu   FALSE
#> 5 2024-01-05  207.  Fri   FALSE
#> 6 2024-01-06  216.  Sat   TRUE
#> 7 2024-01-07  191.  Sun   TRUE
```

`wday(x) %in% c(1, 7)` is the canonical weekend predicate for the Sunday-week default (Sunday=1, Saturday=7). With `week_start = 1`, switch to `wday(x, week_start = 1) %in% c(6, 7)` instead. Use the boolean column to split weekday and weekend traffic in one pass.

### 5. Group and summarise by day of week

```r title="Average sales by weekday"
set.seed(2)
sales90 <- tibble(
  sale_date = seq(ymd("2024-01-01"), ymd("2024-03-30"), by = "day"),
  amount = round(200 + 30 * sin(2 * pi * seq_len(90) / 7) + rnorm(90, 0, 15), 1)
)

sales90 |>
  group_by(dow = wday(sale_date, label = TRUE)) |>
  summarise(avg = round(mean(amount), 1), n = dplyr::n(), .groups = "drop")
#> # A tibble: 7 x 3
#>   dow     avg     n
#>   <ord> <dbl> <int>
#> 1 Sun    181.    13
#> 2 Mon    205.    13
#> 3 Tue    225.    13
#> 4 Wed    229.    13
#> 5 Thu    215.    13
#> 6 Fri    195.    13
#> 7 Sat    178.    13
```

Grouping on `wday(date, label = TRUE)` collapses any date column into seven buckets and keeps them in calendar order automatically. Sunday and Saturday sit at the bottom of the average column; Wednesday peaks, matching the embedded weekly sine wave.

[KEY INSIGHT]
**Use the labelled output for plots and tables; use the integer output for arithmetic.** `wday(x, label = TRUE)` returns an ordered factor that ggplot2 axes, `arrange()`, and `kable()` render in Sun-Sat order without extra code. `wday(x)` returns an integer ready for `%in%`, comparisons, and predicate functions. Choosing the wrong form means either an unordered character axis or factor arithmetic warnings.

## wday() vs the base R alternatives

**`wday()` competes with three base R approaches.** Each returns the same calendar truth but with a different type and indexing rule.

| Style | Example | Returns | Reads best when |
|---|---|---|---|
| `wday(x, label = TRUE)` | `mutate(dow = wday(date, label = TRUE))` | Ordered factor | Inside a tidyverse pipeline, plotting, or ordered grouping |
| `wday(x)` | `wday(x) %in% c(1, 7)` | Integer (1 to 7) | Boolean masks, fast arithmetic |
| `weekdays(x)` | `weekdays(ymd("2024-02-14"))` | Character | Avoiding lubridate dependency, accepting unordered output |
| `as.POSIXlt(x)$wday` | `as.POSIXlt(x)$wday + 1L` | Integer (0 to 6) | Already inside a `POSIXlt` workflow |

Confirm the equivalence:

```r title="Compare with base R routes"
d <- ymd(c("2024-01-01", "2024-02-14"))

identical(as.integer(wday(d)), as.integer(as.POSIXlt(d)$wday + 1L))
#> [1] TRUE

identical(as.character(wday(d, label = TRUE, abbr = FALSE)), weekdays(d))
#> [1] TRUE
```

Both base R routes match `wday()` numerically and by name. The factor versus character difference is the deciding feature when plotting; only the factor sorts itself. Neither base route offers a Monday-first switch.

## Common pitfalls

**Pitfall 1: assuming Monday is day 1.** With the default `week_start = 7`, Monday returns 2 and Sunday returns 1. Code written for ISO weeks fails silently. Set `week_start = 1` explicitly when using business-week logic.

**Pitfall 2: dropping the factor order.** `as.character(wday(x, label = TRUE))` discards the ordering and reduces the result to plain text. Downstream `ggplot()` then alphabetises ("Fri, Mon, Sat, Sun, Thu, Tue, Wed") instead of sorting Sun to Sat. Keep the factor or rebuild it with `factor(..., levels = ...)`.

**Pitfall 3: comparing labelled output with `==`.** `wday(d, label = TRUE) == "Sat"` works, but `wday(d, label = TRUE) == 7` returns NA and warns "comparison of these types is not implemented". Decide on integer or label early and stick with one.

**Pitfall 4: passing a character string.** `wday("2024-02-14")` errors; wrap the value with `ymd()` or `as.Date()` first.

[WARNING]
**Locale changes the labels but not the numbers.** Running `wday(d, label = TRUE)` on a French locale returns `lun, mar, mer, ...`; the integers stay 1-7. Code that string-matches `"Mon"` or `"Sat"` breaks the moment the locale shifts. Match on integer indices, or set `Sys.setlocale("LC_TIME", "C")` at the top of the script.

[NOTE]
**Coming from Python pandas?** The equivalent of `wday(x, label = TRUE)` is `s.dt.day_name()`; for the integer, `s.dt.dayofweek` (returning 0 for Monday to 6 for Sunday, the ISO convention). Pandas does not have a built-in `week_start` argument, so a Sunday-week pandas pipeline reorders with `(s.dt.dayofweek + 1) % 7` instead.

## A practical workflow with wday()

**Day-of-week shows up in three places: weekend flags, day-of-week aggregations, and ordered axes.**

1. **Weekend flags.** `is_weekend = wday(date) %in% c(1, 7)` adds a boolean column ready for `group_by()`, split modelling, or weekday-vs-weekend revenue comparisons.
2. **Day-of-week aggregations.** `group_by(dow = wday(date, label = TRUE))` produces a 7-row summary in calendar order without manual factor levels.
3. **Ordered plotting axes.** `geom_col(aes(wday(date, label = TRUE), value))` plots Sun to Sat left-to-right automatically; pair with `week_start = 1` for Mon-Sun layouts.

```r title="Weekday revenue split"
sales90 |>
  mutate(is_weekend = wday(sale_date) %in% c(1, 7)) |>
  group_by(is_weekend) |>
  summarise(total = round(sum(amount)), avg = round(mean(amount), 1), .groups = "drop")
#> # A tibble: 2 x 3
#>   is_weekend total   avg
#>   <lgl>      <dbl> <dbl>
#> 1 FALSE      14299  220.
#> 2 TRUE        4658  179.
```

Two buckets, one comparison: weekday days average 220 and weekend days average 179, separating a "weekday-heavy" pattern in 4 lines of code. Swap the predicate to `wday(date) %in% 2:6` to keep the same logic when `week_start = 1`.

## Try it yourself

**Try it:** Filter the `sales90` tibble from the previous example to keep only Friday rows, then count how many Fridays sit in the 90-day window. Save the result to `ex_fridays`.

```r title="Your turn: Friday rows only"
# Try it: keep only rows where the weekday is Friday
ex_fridays <- # your code here

nrow(ex_fridays)
#> Expected: 13 rows (one Friday per week, roughly)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fridays <- sales90 |>
  filter(wday(sale_date, label = TRUE) == "Fri")

nrow(ex_fridays)
#> [1] 13
```

**Explanation:** `wday(sale_date, label = TRUE) == "Fri"` keeps rows whose weekday label is Friday. A 90-day window starting on January 1, 2024 contains 13 Fridays.

</details>

## Related lubridate functions

After mastering wday(), look at:

- `yday()`, `mday()`, `qday()`: the rest of the day-prefix family
- `year()`, `month()`, `hour()`: extract the other calendar parts
- `isoweek()`, `epiweek()`, `week()`: week-of-year variants
- `floor_date()`, `ceiling_date()`: round to the start or end of the week
- `am()`, `pm()`: morning vs afternoon predicates
- `make_date()`, `make_datetime()`: build dates from integer parts
- `with_tz()`, `force_tz()`: when weekday changes because of time zone

For the official reference, see the [lubridate day() documentation](https://lubridate.tidyverse.org/reference/day.html), which covers `wday()` alongside `yday()`, `mday()`, and `qday()`.

## FAQ

**What does wday() return in R?**

`wday()` returns the day of the week for a Date or POSIXct value. The default is an integer between 1 and 7 with Sunday as 1; pass `label = TRUE` for an ordered factor like "Wed" or "Wednesday". Pass `week_start = 1` to shift to the ISO 8601 convention where Monday is day 1.

**How do I get the weekday name from a date in R?**

Use `wday(x, label = TRUE, abbr = FALSE)` to get full names like "Monday" as an ordered factor. The abbreviated form `wday(x, label = TRUE)` returns "Mon". The base R alternative `weekdays(x)` returns a plain character vector without ordering, so any plot built from it sorts alphabetically.

**Why does wday() return 2 for Monday instead of 1?**

The default `week_start = 7` puts Sunday at position 1, so Monday becomes 2. Pass `week_start = 1` to use the Monday-first convention used by ISO 8601 and most non-US calendars. Hard-code the week-start argument in shared code so the result does not depend on `getOption("lubridate.week.start")` on each machine.

**How do I check if a date is a weekend in R?**

The shortest form is `wday(x) %in% c(1, 7)`, returning `TRUE` for Saturday and Sunday under the default Sunday-week convention. Use it inside `mutate()` or `filter()`: `df |> filter(wday(date) %in% c(1, 7))` keeps only weekend rows. If you switch to `week_start = 1`, the weekend predicate becomes `wday(x, week_start = 1) %in% c(6, 7)`.

**What is the difference between wday() and yday() in R?**

`wday()` returns the position within the week (1 to 7 or Mon to Sun); `yday()` returns the position within the year (1 to 366). Use `wday()` for weekly cycles like "are weekend sales lower" and `yday()` for seasonal cycles like "is February 14 always a peak". The two are siblings inside lubridate's day-prefix family.
