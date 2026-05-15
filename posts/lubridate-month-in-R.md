---
title: "lubridate month() in R: Extract or Set Month"
slug: "lubridate-month-in-R"
description: "Use lubridate month() to extract the month from a Date or POSIXct in R, get month names as a factor with label = TRUE, and replace the month in place."
keywords: "lubridate month, month function R, lubridate month examples, R extract month from date, month name R, lubridate month label, month abbr"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "month()|lubridate month|lubridate::month()|extract month from date|month component"
auto_link_case_sensitive: true
target_keyword: "lubridate month"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate month() in R: Extract or Set Month

<p class="lead">The <code>month()</code> function in lubridate returns the month of a Date or POSIXct value as an integer 1 to 12, or as an ordered factor of month names when you pass <code>label = TRUE</code>. It is vectorised and works on any class lubridate recognises as a date.</p>

[QUICK ANSWER]
month(ymd("2024-07-15"))                       # 7 (integer)
month(ymd("2024-07-15"), label = TRUE)         # Jul (ordered factor)
month(ymd("2024-07-15"), label = TRUE, abbr = FALSE)  # July
month(now())                                   # month of current datetime
month(c(ymd("2024-01-01"), ymd("2024-06-30"))) # vectorised
month(x) <- 12                                 # replace month in place
df %>% mutate(m = month(order_date))           # extract a column
table(month(sales$date, label = TRUE))         # monthly counts

[DECISION TREE: Is month() the right tool?]
- pull the month number or name from a date: month(x)
- pull the calendar year: year(x)
- pull the day of month: day(x) or mday(x)
- pull the weekday name: wday(x, label = TRUE)
- pull the ISO 8601 week number: isoweek(x)
- pull the quarter: quarter(x)
- round a date to the first of the month: floor_date(x, "month")
- add or subtract whole months: x %m+% months(n)

## What month() does in one sentence

**`month()` returns the calendar month of a date-time, either as an integer 1 to 12 or as an ordered factor of month names.** Pass any Date, POSIXct, or POSIXlt vector and you get back a vector of the same length.

This is the lubridate counterpart to `format(x, "%m")` and `as.POSIXlt(x)$mon + 1` in base R. The lubridate version is shorter, vectorised, and the `label = TRUE` mode returns names already wrapped in an ordered factor, which means `ggplot2` and `dplyr::arrange()` keep the months in calendar order automatically.

## Syntax

**`month(x, label = FALSE, abbr = TRUE, locale = Sys.getlocale("LC_TIME"))`** takes one required argument and three optional ones. The return type changes based on `label`.

```r title="Load lubridate and inspect month"
library(lubridate)

month(ymd("2024-07-15"))
#> [1] 7

month(ymd("2024-07-15"), label = TRUE)
#> [1] Jul
#> 12 Levels: Jan < Feb < Mar < Apr < May < Jun < Jul < ... < Dec

class(month(ymd("2024-07-15"), label = TRUE))
#> [1] "ordered" "factor"
```

The integer return is what you want for arithmetic and grouping; the ordered factor return is what you want for plotting and tables. Character strings are not accepted directly. Parse first with `ymd()`, `mdy()`, or `as.Date()`.

[TIP]
**Set `label = TRUE` whenever the month appears in a chart or table.** The ordered factor keeps January through December in calendar order, so `ggplot2` does not alphabetise them to Apr, Aug, Dec... and you avoid the most common monthly-report bug.

## Six common patterns

### 1. Extract the month from a single date

```r title="Month of a parsed date"
d <- ymd("2024-07-15")
month(d)
#> [1] 7
```

The result is an integer between 1 and 12. Useful for filtering: `month(d) == 7` is a clean check for July.

### 2. Get the abbreviated or full month name

```r title="Switch between Jul and July"
month(ymd("2024-07-15"), label = TRUE)
#> [1] Jul

month(ymd("2024-07-15"), label = TRUE, abbr = FALSE)
#> [1] July
```

`abbr = TRUE` (the default when `label = TRUE`) gives the 3-letter abbreviation. `abbr = FALSE` gives the full name. Both come back as ordered factors with 12 levels.

### 3. Vectorise over a column

```r title="Month column from a date column"
dates <- ymd(c("2024-01-15", "2024-02-20", "2024-03-25", "2024-07-04"))
month(dates)
#> [1] 1 2 3 7

month(dates, label = TRUE)
#> [1] Jan Feb Mar Jul
#> Levels: Jan < Feb < Mar < Apr < May < Jun < Jul < ... < Dec
```

The function applies element by element, which is what you want inside `mutate()` or `transform()`.

### 4. Group and summarise sales by month

```r title="Aggregate values by month"
set.seed(1)
sales <- data.frame(
  date  = ymd("2024-01-01") + sample(0:364, 50),
  value = round(runif(50, 50, 200), 2)
)

aggregate(value ~ month(date, label = TRUE), data = sales, FUN = sum)
#>    month(date, label = TRUE)   value
#> 1                        Jan  447.71
#> 2                        Feb  617.50
#> 3                        Mar  398.45
```

(Output truncated to the first 3 months.) Using `label = TRUE` here means the printed table reads as `Jan`, `Feb`, `Mar` rather than `1`, `2`, `3`.

### 5. Replace the month in place

```r title="Shift a date to a different month"
x <- ymd("2024-07-15")
month(x) <- 12
x
#> [1] "2024-12-15"
```

The replacement form keeps the year, day-of-month, and time of day, and only swaps the month. This is the lubridate idiom for "move this event from July to December" without rebuilding the date string.

### 6. Filter rows to a specific month

```r title="Keep only March rows"
march_rows <- sales[month(sales$date) == 3, ]
nrow(march_rows)
#> [1] 4
```

A clean alternative to parsing the string or using regex on `format(date, "%m")`.

[KEY INSIGHT]
**The two return types are deliberate, not redundant.** Integer mode (`label = FALSE`) plugs into arithmetic, comparisons, and `dplyr::group_by()`. Factor mode (`label = TRUE`) plugs into plotting axes, summary tables, and any output a human will read. Pick the type for the consumer, not the producer.

## Compare with alternatives

**`month()` is one of several ways to pull the month from a date in R.** Each has a different return type and different ergonomics.

| Approach | Return type | Notes |
|---|---|---|
| `month(x)` | integer | Vectorised, fast, default lubridate idiom |
| `month(x, label = TRUE)` | ordered factor | Best for charts and reports |
| `format(x, "%m")` | character (zero-padded) | Base R, returns "07" not 7 |
| `format(x, "%B")` | character | Base R, full month name, no ordering |
| `as.POSIXlt(x)$mon + 1` | integer | Base R, needs +1 because mon is 0-indexed |
| `data.table::month(x)` | integer | Same idea, no factor mode |

Rule of thumb: use `month(x)` for math and grouping, `month(x, label = TRUE)` for display. Reach for `format()` only when you need character output for a downstream system that expects a string.

[WARNING]
**`as.POSIXlt(x)$mon` is zero-indexed.** January is 0, December is 11. Forgetting the `+ 1` is a classic off-by-one bug. `month()` returns 1 to 12 directly, which is why most R code now uses lubridate even when base R alone would do.

## Common pitfalls

**Three mistakes appear in almost every code review of date code.** All three are easy to avoid once you know the pattern.

1. **Passing a character string instead of a Date.** `month("2024-07-15")` errors. Parse first: `month(ymd("2024-07-15"))`. The error message is helpful but the fix is always the same.
2. **Sorting a factor month with `as.character()`.** Once you call `as.character()` on the `label = TRUE` output, you lose the order and `arrange()` puts Apr before Jan. Keep it as a factor as long as possible.
3. **Confusing `month()` with `months()`.** `month()` (singular) extracts a component. `months()` (plural) builds a `Period` object for arithmetic: `ymd("2024-07-15") + months(3)` returns `2024-10-15`. Different functions, near-identical spelling.

## Try it yourself

**Try it:** Extract the month name (abbreviated) from `ymd("2026-11-04")` and store it in `ex_month`. The expected value is `Nov` as an ordered factor.

```r title="Your turn: extract a month name"
# Try it: get the month name from a date
ex_month <- # your code here

ex_month
#> Expected: Nov (ordered factor)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_month <- month(ymd("2026-11-04"), label = TRUE)
ex_month
#> [1] Nov
#> 12 Levels: Jan < Feb < Mar < Apr < May < Jun < Jul < ... < Dec
```

**Explanation:** `label = TRUE` returns the abbreviated name. `abbr` defaults to `TRUE`, so the result is `Nov`. The ordered factor keeps calendar order, which matters once you plot or arrange.

</details>

## Related lubridate functions

Reach for these when you need a different component or different operation:

- `year(x)` returns the calendar year as an integer
- `day(x)` and `mday(x)` return the day of month
- `wday(x, label = TRUE)` returns the weekday name as an ordered factor
- `quarter(x)` returns the quarter (1 to 4)
- `floor_date(x, "month")` rounds a date down to the first of its month
- `x %m+% months(n)` adds n months while handling end-of-month edge cases

For the full reference, see the [lubridate documentation on lubridate.tidyverse.org](https://lubridate.tidyverse.org/reference/month.html).

## FAQ

**How do I get the month name instead of the number?**

Pass `label = TRUE` to `month()`. The function returns an ordered factor with 12 levels in calendar order. The default abbreviation is the 3-letter form (`Jan`, `Feb`, `Jul`). Pass `abbr = FALSE` to get the full names (`January`, `February`, `July`). The ordered factor is the right type for `ggplot2` axes and grouped summaries because it preserves January through December order instead of alphabetising.

**What is the difference between month() and months()?**

`month()` (singular) is an accessor. It pulls the month component out of an existing date and returns an integer or factor. `months()` (plural) is a constructor. It builds a `Period` object representing a span of N months that you can add to a date with `+` or `%m+%`. So `month(d)` reads a date, while `d + months(3)` shifts a date three months forward.

**Why does month() return a factor sometimes and an integer other times?**

The return type depends on the `label` argument. With `label = FALSE` (the default) the function returns a plain integer between 1 and 12, suitable for math and `group_by()`. With `label = TRUE` it returns an ordered factor of month names suitable for charts and reports. Pick the type for the downstream consumer.

**Can month() handle character strings directly?**

No. `month("2024-07-15")` errors because the input is character, not a date. Parse first with `ymd()`, `mdy()`, `dmy()`, or base R's `as.Date()`, then pipe the result into `month()`. The two-step pattern is `month(ymd(x))`, and it works the same way for vectors.

**How do I change the language of month names?**

Pass a `locale` argument matching your system's locale strings. On Linux and macOS, `month(d, label = TRUE, locale = "fr_FR.UTF-8")` returns French names. On Windows, use the platform locale string such as `"French_France.1252"`. The default uses `Sys.getlocale("LC_TIME")`, so set the system locale once if every chart should match.
