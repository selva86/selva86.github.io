---
title: "lubridate yday() in R: Day-of-Year From Dates"
slug: "lubridate-yday-in-R"
description: "Use lubridate yday() in R to pull the day of year (1 to 366) from a Date or POSIXct, build seasonal features, and pair it with wday(), mday(), qday()."
keywords: "lubridate yday, yday function R, lubridate yday examples, day of year R, julian day R, extract day of year, yday() lubridate"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "yday()|lubridate yday|lubridate::yday()|day of year|day-of-year extractor"
auto_link_case_sensitive: true
target_keyword: "lubridate yday"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate yday() in R: Day-of-Year From Dates

<p class="lead">The <code>yday()</code> function in lubridate returns the day of the year from a Date or POSIXct value as an integer between 1 and 366. It is the seasonal-axis counterpart to <code>mday()</code>, designed to overlay multi-year time series on a single calendar position so February 14 in any year sits on day 45.</p>

[QUICK ANSWER]
yday(ymd("2024-02-14"))                       # extract day of year
yday(ymd_hms("2024-02-14 09:30:00"))          # works on POSIXct too
yday(c(ymd("2024-12-31"), ymd("2023-12-31"))) # 366 in leap, 365 otherwise
yday(x) <- 1                                  # snap a date to Jan 1
df |> mutate(doy = yday(invoice_date))        # seasonal feature column
yday(x) == 60                                 # March 1 in any non-leap year
identical(yday(x), as.POSIXlt(x)$yday + 1L)   # base R equivalent
ggplot(df, aes(yday(date), value, group = year(date))) # year overlay

[DECISION TREE: Is yday() the right tool?]
- pull the day of year (1 to 366): yday(x)
- pull the day of month (1 to 31): mday(x)
- pull the day of week number or name: wday(x, label = TRUE)
- pull the day of quarter (1 to 92): qday(x)
- pull ISO week of year (1 to 53): isoweek(x)
- snap a date to the first of the year: floor_date(x, "year")
- count days between two dates: as.numeric(b - a, units = "days")
- build a date from year and day-of-year: ymd("2024-01-01") + days(doy - 1)

## What yday() does in one sentence

**`yday()` returns the day-of-year position of a date-time as an integer.** Pass any Date, POSIXct, or POSIXlt vector and you get a numeric vector of the same length with values 1 (January 1) through 365 or 366 (December 31).

The "y" prefix stands for "year". It is the lubridate counterpart to base R's `as.POSIXlt(x)$yday + 1L`, but returns a 1-indexed integer ready for arithmetic, filtering, and overlay plotting.

## Syntax

**`yday(x)` takes a single argument: a date-time vector.** It returns an integer vector with values 1 to 366. Unlike `wday()`, there are no `label` or `week_start` arguments because day-of-year numbers are unambiguous across locales.

```r title="Load lubridate and pull a day"
library(lubridate)

yday(ymd("2024-02-14"))
#> [1] 45

yday(ymd_hms("2024-02-14 09:30:00"))
#> [1] 45

class(yday(ymd("2024-02-14")))
#> [1] "integer"
```

The input must be a `Date`, `POSIXct`, or `POSIXlt` value. Character strings are NOT accepted; parse them first with `ymd()`, `mdy()`, or `as.Date()`.

[TIP]
**Reach for yday() whenever you need to compare the same calendar position across years.** February 14 is day 45 in 2023 and day 45 in 2024; plotting `value ~ yday(date)` colored by `year(date)` overlays seasons cleanly and exposes year-over-year shifts that a raw date axis hides.

## Five common patterns

### 1. Extract day of year from a single date

```r title="Day of a parsed date"
d <- ymd("2024-02-14")
yday(d)
#> [1] 45
```

The result is integer 45, not the string `"45"`. Use it in arithmetic directly: `yday(d) - 1` is 44, the days completed before that date.

### 2. Extract day of year from a vector of dates

```r title="Vectorised over a date column"
dates <- ymd(c("2024-01-01", "2024-03-01", "2023-03-01", "2024-12-31", "2023-12-31"))
yday(dates)
#> [1]   1  61  60 366 365
```

`yday()` is fully vectorised: a million-row date column becomes a million-row integer vector in one call. 2024 ends at 366 (leap year); 2023 ends at 365. The same March 1 returns 61 in 2024 and 60 in 2023.

### 3. Year-over-year overlay with ggplot2

```r title="Overlay multi-year sales by season"
library(dplyr)
library(ggplot2)

set.seed(1)
sales <- tibble(
  sale_date = seq(ymd("2022-01-01"), ymd("2024-12-31"), by = "day"),
  amount = round(200 + 80 * sin(2 * pi * seq_len(1096) / 365.25) + rnorm(1096, 0, 20), 1)
)

sales |>
  mutate(yr = factor(year(sale_date)), doy = yday(sale_date)) |>
  ggplot(aes(doy, amount, colour = yr)) +
  geom_line(alpha = 0.5) +
  labs(x = "Day of year", y = "Daily amount", colour = "Year")
```

Replacing `sale_date` with `yday(sale_date)` collapses three years onto one 1-to-366 axis. Each year becomes a coloured line and seasonal peaks line up vertically; this is the canonical use case for `yday()`.

### 4. Replace yday values in place

```r title="Snap dates to January 1"
events <- ymd_hms(c("2024-02-14 09:00:00", "2024-07-04 18:30:00", "2024-12-25 23:59:00"))
yday(events) <- 1
events
#> [1] "2024-01-01 09:00:00 UTC" "2024-01-01 18:30:00 UTC" "2024-01-01 23:59:00 UTC"
```

The replacement form rewrites the year-day position while leaving year and time-of-day untouched. Setting `yday(x) <- 1` snaps any date to January 1 of the same year, useful for converting timestamps into year-start buckets without resetting hours and minutes.

### 5. Filter by seasonal window

```r title="Keep spring rows across all years"
sales |>
  mutate(doy = yday(sale_date)) |>
  filter(between(doy, 60, 151)) |>
  group_by(year(sale_date)) |>
  summarise(spring_total = round(sum(amount)), .groups = "drop")
#> # A tibble: 3 x 2
#>   `year(sale_date)` spring_total
#>               <dbl>        <dbl>
#> 1              2022        22481
#> 2              2023        22302
#> 3              2024        22568
```

`between(yday(date), 60, 151)` keeps rows from March 1 through May 31 in any year, without month-and-day boolean gymnastics. Note: in leap years, day 60 is February 29 instead of March 1, so use `month(date) %in% 3:5` if exact calendar months are required.

[KEY INSIGHT]
**Day-of-year is the only calendar axis where leap years are visible.** `mday()` reports the same 1-to-31 range every year and `wday()` cycles through 1-to-7 every week, so neither encodes the difference between 2023 and 2024. `yday()` returns 366 only in leap years and shifts every post-February date by one position; the integer alone tells you whether the year was leap.

## yday() vs the base R alternative

**`yday()` and `as.POSIXlt(x)$yday + 1L` both return day-of-year integers.** The choice is mostly about which API the surrounding pipeline already uses.

| Style | Example | Reads best when |
|---|---|---|
| `yday(x)` | `mutate(doy = yday(date))` | Inside a tidyverse pipeline alongside `mday()`, `wday()`, or `qday()` |
| `as.POSIXlt(x)$yday + 1L` | base R extraction | Avoiding the lubridate dependency in a package |
| `format(x, "%j")` | string extraction | Building a label like `"2024-045"`; remember to cast back to integer |
| `julian(x, origin = ymd("2024-01-01"))` | days since custom origin | Counting days from a non-January-1 epoch |

Confirm the equivalence in one line:

```r title="Confirm yday() matches base R"
d <- ymd(c("2024-01-01", "2024-02-14", "2024-12-31", "2023-12-31"))

identical(yday(d), as.integer(as.POSIXlt(d)$yday + 1L))
#> [1] TRUE

identical(yday(d), as.integer(format(d, "%j")))
#> [1] TRUE
```

All three paths return the same integers. The `format()` route returns a character vector by default; cast with `as.integer()` before arithmetic.

## Common pitfalls

**Pitfall 1: assuming the year always has 365 days.** `yday(ymd("2024-12-31"))` returns 366 because 2024 is a leap year. Code that hard-codes `seq_len(365)` silently drops December 31 in every leap year; use `365 + leap_year(x)` instead.

**Pitfall 2: comparing day-of-year across years without acknowledging the leap shift.** `yday(ymd("2024-03-01"))` is 61; `yday(ymd("2023-03-01"))` is 60. Joining on `yday` across mixed years offsets every post-February row by one day. For exact calendar alignment, key on `format(date, "%m-%d")` instead.

**Pitfall 3: passing a character string.** `yday("2024-02-14")` errors; wrap with `ymd()` first.

[WARNING]
**`yday()` is 1-indexed; base R's `as.POSIXlt(x)$yday` is 0-indexed.** January 1 returns 1 from lubridate but 0 from POSIXlt. Mixing the two without the `+ 1L` correction shifts every result by one day and is invisible until December 31 returns 365 from lubridate and 365 from POSIXlt on the same leap-year date, masking the off-by-one for non-edge dates.

[NOTE]
**Coming from Python pandas?** The equivalent of `yday(x)` is `s.dt.dayofyear` on a datetime Series. The dplyr pipeline `mutate(doy = yday(date))` mirrors `df.assign(doy=df.date.dt.dayofyear)`. Both libraries are 1-indexed and both return 366 for December 31 of a leap year.

## A practical workflow with yday()

**Day-of-year shows up in three places: seasonal features, multi-year overlays, and within-year window filters.**

1. **Forecast features.** Add `doy = yday(date)` plus a sin/cos encoding to handle the wrap from 366 to 1; pair with `year(date)` so the model can separate trend from seasonality.
2. **Multi-year overlays.** Map `yday(date)` to x and `year(date)` to colour; each year becomes one line and seasonal peaks align vertically.
3. **Within-year filters.** `filter(between(yday(date), 152, 243))` keeps the meteorological summer of every year.

```r title="Aggregate sales by day of year"
sales |>
  mutate(doy = yday(sale_date)) |>
  group_by(doy) |>
  summarise(daily_avg = round(mean(amount), 2), n = dplyr::n()) |>
  arrange(desc(daily_avg)) |>
  head(5)
#> # A tibble: 5 x 3
#>     doy daily_avg     n
#>   <int>     <dbl> <int>
#> 1   180      297.     3
#> 2   178      295.     3
#> 3   183      292.     3
#> 4   175      290.     3
#> 5   181      288.     3
```

Aggregating by `yday()` collapses three years into 366 buckets, one per calendar position. The top days cluster near day 180 (late June), matching the sin-wave peak the data was generated with.

## Try it yourself

**Try it:** Use the `sales` tibble from the year-over-year example above and keep only the rows that fall in the first 90 days of any year. Save the result to `ex_q1`.

```r title="Your turn: keep first-quarter rows"
# Try it: keep rows where day-of-year is in the first 90 days
ex_q1 <- # your code here

nrow(ex_q1)
#> Expected: 270 rows (90 days x 3 years)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_q1 <- sales |>
  filter(yday(sale_date) <= 90)

nrow(ex_q1)
#> [1] 270
```

**Explanation:** `yday(sale_date) <= 90` keeps January 1 through March 30 (or March 31 in non-leap years) for every year in the data. Three years times roughly 90 days gives 270 rows.

</details>

## Related lubridate functions

After mastering yday(), look at:

- `mday()`, `wday()`, `qday()`: the rest of the day-prefix family
- `year()`, `month()`: extract the other calendar parts
- `isoweek()`, `epiweek()`: week-of-year variants for weekly aggregation
- `leap_year()`: TRUE for years that contain February 29
- `days_in_month()`: get the last valid day for any month
- `floor_date()`, `ceiling_date()`: round a date to day, week, month, or year
- `make_date()`: build a date from year, month, day integers

For the official reference, see the [lubridate day() documentation](https://lubridate.tidyverse.org/reference/day.html), which covers `yday()` alongside the rest of the day-of-period family.

## FAQ

**What does yday() return in R?**

`yday()` returns the day of the year as an integer between 1 and 366. Input is a Date, POSIXct, or POSIXlt vector; output is an integer vector of the same length. January 1 is day 1, December 31 is day 365 in non-leap years and day 366 in leap years. The function is fully vectorised, so it runs on a million-row column without a loop.

**How do I get the Julian day from a date in R?**

For the day-of-year sense of "Julian day" (1 to 366 within a year), use `yday(x)`. For the astronomical Julian Day Number (continuous count since 4713 BC), use `julian(x, origin = as.Date("1970-01-01"))` plus 2440587.5 to convert from Unix epoch. Climate scientists usually mean the day-of-year sense; astronomers mean the continuous count.

**Why does yday() return 366 sometimes and 365 other times?**

Leap years contain 366 days, so December 31 of a leap year returns 366; December 31 of a non-leap year returns 365. The years 2020, 2024, and 2028 are leap; 2021, 2022, 2023, 2025 are not. Code that hard-codes 365 silently drops the leap-day endpoint.

**Can I change the day of year of a date with yday()?**

Yes, use the replacement form: `yday(x) <- 1`. This sets the day-of-year while keeping year and time-of-day untouched, snapping a timestamp to January 1 of the same year. Values above the year's length (365 in non-leap, 366 in leap) roll forward into the next year, so cap with `pmin(value, 365 + leap_year(x))` for fail-fast behaviour.

**What is the difference between yday() and wday() in R?**

`yday()` returns the position within the year (1 to 366); `wday()` returns the position within the week (1 to 7, Sunday as 1 by default). Both return small integers but answer different questions. Use `yday()` for seasonal analysis, `wday(x, label = TRUE)` for weekday analysis like "are weekend sales higher than weekday sales".
