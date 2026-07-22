---
title: "tsibble in R: Tidy Time Series Objects, Keys, and Gaps"
slug: "tsibble-in-R"
description: "Learn tsibble in R from scratch: set the index and key, find implicit gaps with has_gaps(), fill them with fill_gaps(), and re-index time using index_by()."
keywords: "tsibble in R, as_tsibble, tsibble key, tsibble index, fill_gaps, has_gaps, index_by, tidy time series in R, tsibble package, yearmonth"
auto_link_terms: "tsibble|tsibbles|tsibble object|as_tsibble()|fill_gaps()|has_gaps()|scan_gaps()|count_gaps()|index_by()|filter_index()|tsibble key|tsibble index|yearmonth()|tidy time series"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-22"
curriculum_id: "TS2-1.2"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "tsibble Objects"
sidebar_order: "40"
difficulty: "Beginner"
---

<p class="lead">A tsibble is a data frame that knows which column is time (the <strong>index</strong>) and which columns identify separate series (the <strong>key</strong>). That one piece of extra knowledge lets it hold hundreds of time series in a single tidy table, and lets it catch the missing rows a plain data frame hides from you.</p>

## What is a tsibble, and why isn't a plain data frame enough?

A plain data frame will hold a column of dates without objecting. It just has no idea that the column is time. It will not tell you that a month is missing, it will not stop you from storing the same month twice, and it has no concept of "these rows are store North's series and those rows are store South's". A tsibble knows all three, and you get it by naming two columns.

Here is a small sales table for two stores over six months, turned into a tsibble.

```r title="Build your first tsibble"
library(tsibble)
library(dplyr)

sales <- data.frame(
  month = rep(c("2024-01", "2024-02", "2024-03",
                "2024-04", "2024-05", "2024-06"), times = 2),
  store = rep(c("North", "South"), each = 6),
  units = c(120, 133, 141, 138, 150, 162, 98, 101, 95, 110, 121, 118)
)

sales_ts <- sales |>
  mutate(month = yearmonth(month)) |>
  as_tsibble(index = month, key = store)

sales_ts
#> # A tsibble: 12 x 3 [1M]
#> # Key:       store [2]
#>       month store units
#>       <mth> <chr> <dbl>
#>  1 2024 Jan North   120
#>  2 2024 Feb North   133
#>  3 2024 Mar North   141
#>  4 2024 Apr North   138
#>  5 2024 May North   150
#>  6 2024 Jun North   162
#>  7 2024 Jan South    98
#>  8 2024 Feb South   101
#>  9 2024 Mar South    95
#> 10 2024 Apr South   110
#> 11 2024 May South   121
#> 12 2024 Jun South   118
```

Three things happened. `sales` started life as an ordinary data frame whose `month` column was plain text like `"2024-01"`. `yearmonth()` converted that text into a proper monthly time value. `as_tsibble()` then took the result and promoted it, with `index = month` saying "this is the time column" and `key = store` saying "this column tells one series apart from another". The `|>` symbol between the steps is R's pipe: it feeds the result on its left into the first argument of the function on its right, so `sales |> mutate(...)` is another way of writing `mutate(sales, ...)`.

Now read the two header lines, because they are the whole point. `[1M]` at the end of the first line is the **interval**: tsibble looked at the gaps between your time values, worked out that they are one month apart, and wrote it down. `Key: store [2]` says the table contains **2 separate series**, distinguished by `store`. You never told it either of those numbers. It figured them out and it will keep checking them.

[KEY INSIGHT]
**Those two header lines are a contract, not decoration.** Every tsibble operation from here on relies on them: forecasting functions read the interval to know the seasonal period, gap functions read the interval to know which rows should exist, and grouping functions read the key to know where one series ends and the next begins.

You can pull each piece of the contract out with a dedicated function, which is handy when you are debugging someone else's data.

```r title="Read the index, key and interval"
index_var(sales_ts)
#> [1] "month"

key_vars(sales_ts)
#> [1] "store"

interval(sales_ts)
#> <interval[1]>
#> [1] 1M
```

`index_var()` returns the name of the time column, `key_vars()` returns the names of the identifying columns (there can be more than one), and `interval()` returns the detected spacing. If a package ever complains that your data is not what it expected, these three calls tell you what the object actually thinks it is.

**Try it:** Build a tsibble of yearly profit for the years 2021 to 2024 using `tsibble()` directly, with no key at all. A single series does not need one.

```r title="Your turn: build an annual tsibble"
# Use tsibble(year = ..., profit = ..., index = year)
# Years 2021L to 2024L, profits 4.1, 5.6, 5.2, 6.8
# Note the L suffix: integer years, not decimals

# ex_profit <- tsibble(...)

# Expected header: A tsibble: 4 x 2 [1Y]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Annual tsibble solution"
ex_profit <- tsibble(
  year   = c(2021L, 2022L, 2023L, 2024L),
  profit = c(4.1, 5.6, 5.2, 6.8),
  index  = year
)

ex_profit
#> # A tsibble: 4 x 2 [1Y]
#>    year profit
#>   <int>  <dbl>
#> 1  2021    4.1
#> 2  2022    5.6
#> 3  2023    5.2
#> 4  2024    6.8
```

**Explanation:** `tsibble()` builds the object from scratch instead of converting an existing frame, so you pass the columns and name the index in one call. Integer years are recognised as annual data, hence the `[1Y]` interval. With one series there is nothing to tell apart, so the key is empty and no `Key:` line prints.

</details>

## What do the index, key, and interval actually mean?

Those three words carry the whole design, so it is worth slowing down on each one.

The **index** is the column that orders your data from past to present. It has to be a genuine time type (a date, a date-time, a year, a `yearmonth`, a `yearquarter`), not text and not a plain number pretending to be a year.

The **key** is the set of columns that say *which series a row belongs to*. In the sales table, `store` is the key: `North` is one series, `South` is another. If you also tracked product categories, the key would be `c(store, category)` and each store-category combination would be its own series.

The **interval** is the spacing between consecutive index values. You do not declare it. tsibble computes it from your data: it takes the gaps between consecutive time values and keeps the largest step that divides every one of them evenly.

Put together, they make one promise: **index plus key identifies exactly one row.** Everything else in the table is a measured value.

![Diagram showing the index column and the key column pointing to a single unique row, which then points to the measured value](screenshots/tsibble-in-R-anatomy.webp)

*Figure 1: The index and the key together pick out exactly one row, and everything else is a measured value.*

Two helper functions report what tsibble knows about your key.

```r title="Inspect the key structure"
n_keys(sales_ts)
#> [1] 2

key_data(sales_ts)
#> # A tibble: 2 × 2
#>   store       .rows
#>   <chr> <list<int>>
#> 1 North         [6]
#> 2 South         [6]
```

`n_keys()` counts the series: 2, one per store. `key_data()` goes further and shows which rows belong to which series. The `.rows` column says North occupies 6 rows and South occupies 6 rows. On a table with 300 series, `n_keys()` is the fastest sanity check you have: if it returns 301 you have a typo somewhere in your identifier column.

The uniqueness promise is easy to verify by hand. Count how many rows share each month.

```r title="Verify the uniqueness promise"
sales_ts |> as_tibble() |> count(month)
#> # A tibble: 6 × 2
#>      month     n
#>      <mth> <int>
#> 1 2024 Jan     2
#> 2 2024 Feb     2
#> 3 2024 Mar     2
#> 4 2024 Apr     2
#> 5 2024 May     2
#> 6 2024 Jun     2
```

The `as_tibble()` step drops the tsibble structure for a moment so that `count()` behaves exactly as it would on any data frame, counting rows per month rather than per series. Each month appears twice, once for each store. That is allowed, because the *combination* of month and store is still unique. If any month appeared twice for the same store, tsibble would have refused to build the object at all, which is the subject of a later section.

Real tsibbles look exactly the same, just bigger. The `pedestrian` dataset ships with the tsibble package and records hourly foot traffic at four sensors in Melbourne.

```r title="A real keyed tsibble"
pedestrian
#> # A tsibble: 66,037 x 5 [1h] <Australia/Melbourne>
#> # Key:       Sensor [4]
#>    Sensor         Date_Time           Date        Time Count
#>    <chr>          <dttm>              <date>     <int> <int>
#>  1 Birrarung Marr 2015-01-01 00:00:00 2015-01-01     0  1630
#>  2 Birrarung Marr 2015-01-01 01:00:00 2015-01-01     1   826
#>  3 Birrarung Marr 2015-01-01 02:00:00 2015-01-01     2   567
#>  4 Birrarung Marr 2015-01-01 03:00:00 2015-01-01     3   264
#>  5 Birrarung Marr 2015-01-01 04:00:00 2015-01-01     4   139
#>  6 Birrarung Marr 2015-01-01 05:00:00 2015-01-01     5    77
#>  7 Birrarung Marr 2015-01-01 06:00:00 2015-01-01     6    44
#>  8 Birrarung Marr 2015-01-01 07:00:00 2015-01-01     7    56
#>  9 Birrarung Marr 2015-01-01 08:00:00 2015-01-01     8   113
#> 10 Birrarung Marr 2015-01-01 09:00:00 2015-01-01     9   166
#> # ℹ 66,027 more rows
```

Same structure, different scale. The index is `Date_Time`, the key is `Sensor`, the interval is `[1h]` (hourly), and there are 4 series sharing the 66,037 rows. The extra bit in angle brackets is the time zone, which tsibble tracks so that daylight-saving shifts do not quietly corrupt your hourly counts.

[NOTE]
**The interval is detected, not declared.** tsibble finds the greatest common divisor of the gaps between your time values, so a series with hourly stamps gets 1h and a series with 5-minute stamps gets 5m. If your observations are genuinely irregular, like the exact moment each customer walked in, pass `regular = FALSE` to `as_tsibble()` and the interval will print as `[!]` instead.

**Try it:** Report how many series `pedestrian` holds and what its interval is, using the two helpers you just met.

```r title="Your turn: describe the pedestrian data"
# Two calls, one per line:
# n_keys(...) and interval(...)

# Expected: 4 series, interval 1h
```

<details>
<summary>Click to reveal solution</summary>

```r title="Describe pedestrian solution"
n_keys(pedestrian)
#> [1] 4

interval(pedestrian)
#> <interval[1]>
#> [1] 1h
```

**Explanation:** Four sensors means four series. The `1h` interval is what tells forecasting packages later that a daily cycle spans 24 observations and a weekly cycle spans 168.

</details>

## How do you turn your own data into a tsibble?

There are three doors into a tsibble, and which one you use depends on what you already have.

| You have | Use | Example |
|---|---|---|
| A data frame or tibble with a time column | `as_tsibble(df, index = , key = )` | Your CSV import |
| A classic `ts` object | `as_tsibble(x)` | `AirPassengers`, `USAccDeaths` |
| Nothing yet, typing values by hand | `tsibble(col = , ..., index = )` | Small examples and tests |

Before any of them works, your time column has to be a real time type. R's built-in `Date` and `POSIXct` cover days and timestamps, and tsibble adds four classes for the coarser granularities.

| Granularity | Class to use | How to create it |
|---|---|---|
| Yearly | integer | `2024L` |
| Quarterly | `yearquarter` | `yearquarter("2023 Q1")` |
| Monthly | `yearmonth` | `yearmonth("2024-01")` |
| Weekly | `yearweek` | `yearweek("2024 W01")` |
| Daily | `Date` | `as.Date("2024-03-01")` |
| Sub-daily | `POSIXct` | `as.POSIXct("2024-03-01 09:00")` |

Start with the easiest door. A classic `ts` object already carries its own time information, so tsibble can read it without any help from you.

```r title="Convert a ts object to a tsibble"
air_ts <- as_tsibble(AirPassengers)
air_ts
#> # A tsibble: 144 x 2 [1M]
#>       index value
#>       <mth> <dbl>
#>  1 1949 Jan   112
#>  2 1949 Feb   118
#>  3 1949 Mar   132
#>  4 1949 Apr   129
#>  5 1949 May   121
#>  6 1949 Jun   135
#>  7 1949 Jul   148
#>  8 1949 Aug   148
#>  9 1949 Sep   136
#> 10 1949 Oct   119
#> # ℹ 134 more rows
```

No index or key argument was needed. `AirPassengers` is monthly data from 1949, and `as_tsibble()` read the frequency straight out of the `ts` object, converted the timestamps to `yearmonth` values, and named the two resulting columns `index` and `value`. A single `ts` object holds only one series, so there is no key.

The second door is building a tsibble by hand, which is what you want for small examples.

```r title="Build a quarterly tsibble by hand"
q_ts <- tsibble(
  quarter = yearquarter(c("2023 Q1", "2023 Q2", "2023 Q3", "2023 Q4")),
  revenue = c(41, 45, 39, 52),
  index   = quarter
)

q_ts
#> # A tsibble: 4 x 2 [1Q]
#>   quarter revenue
#>     <qtr>   <dbl>
#> 1 2023 Q1      41
#> 2 2023 Q2      45
#> 3 2023 Q3      39
#> 4 2023 Q4      52
```

`tsibble()` takes named vectors the same way `data.frame()` does, and the `index` argument names which of them is time. The `[1Q]` interval confirms it understood quarterly spacing, and `<qtr>` in the column header confirms the type.

The third door is the one you will use most: an ordinary table where the dates arrived as text.

```r title="Convert text dates to a daily tsibble"
visits <- data.frame(
  day    = c("2024-03-01", "2024-03-02", "2024-03-03", "2024-03-04"),
  clicks = c(310, 288, 402, 375)
)

visits_ts <- visits |>
  mutate(day = as.Date(day)) |>
  as_tsibble(index = day)

visits_ts
#> # A tsibble: 4 x 2 [1D]
#>   day        clicks
#>   <date>      <dbl>
#> 1 2024-03-01    310
#> 2 2024-03-02    288
#> 3 2024-03-03    402
#> 4 2024-03-04    375
```

`as.Date()` parses `"2024-03-01"` into a real date, then `as_tsibble()` detects that consecutive dates are one day apart and stamps the object `[1D]`. Skip the `as.Date()` step and `as_tsibble()` stops you immediately with `Unsupported index type: character`, which is the single most common first error people hit.

Now for the trap that catches almost everyone with monthly data.

```r title="The first-of-the-month Date trap"
first_of_month <- data.frame(
  d = as.Date(c("2024-01-01", "2024-02-01", "2024-03-01")),
  v = c(10, 12, 11)
)

fom_ts <- as_tsibble(first_of_month, index = d)
fom_ts
#> # A tsibble: 3 x 2 [1D]
#>   d              v
#>   <date>     <dbl>
#> 1 2024-01-01    10
#> 2 2024-02-01    12
#> 3 2024-03-01    11

has_gaps(fom_ts)
#> # A tibble: 1 × 1
#>   .gaps
#>   <lgl>
#> 1 TRUE
```

This is monthly data stored as the first day of each month, which is how nearly every database exports it. But the values are `Date` objects, and the gaps between them are 31 and 29 days, so the largest step that divides both evenly is one day. tsibble concludes the data is daily, stamps it `[1D]`, and then reports gaps: of the 61 calendar days between 1 January and 1 March, only 3 have rows, so 58 daily observations look missing. Nothing is broken, it just answered the question you accidentally asked.

[WARNING]
**Monthly data stored as Date becomes daily data.** Any time your series is monthly, quarterly or weekly, convert the column with yearmonth(), yearquarter() or yearweek() before calling as_tsibble(). Leaving it as Date silently changes the interval, which then changes the seasonal period every downstream model uses.

**Try it:** Convert the built-in `USAccDeaths` time series (monthly US accidental deaths) into a tsibble and check its interval in the printed header.

```r title="Your turn: convert USAccDeaths"
# USAccDeaths is already a ts object, so one call is enough
# ex_deaths <- as_tsibble(...)

# Expected header: A tsibble: 72 x 2 [1M]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Convert USAccDeaths solution"
ex_deaths <- as_tsibble(USAccDeaths)
ex_deaths
#> # A tsibble: 72 x 2 [1M]
#>       index value
#>       <mth> <dbl>
#>  1 1973 Jan  9007
#>  2 1973 Feb  8106
#>  3 1973 Mar  8928
#>  4 1973 Apr  9137
#>  5 1973 May 10017
#>  6 1973 Jun 10826
#>  7 1973 Jul 11317
#>  8 1973 Aug 10744
#>  9 1973 Sep  9713
#> 10 1973 Oct  9938
#> # ℹ 62 more rows
```

**Explanation:** 72 rows is six years of monthly observations, and the `[1M]` interval was carried over from the `ts` object's frequency of 12. Because it came from a `ts`, the columns are named `index` and `value` rather than anything descriptive. Rename them with `rename()` if you plan to keep the object around.

</details>

## Why does as_tsibble() reject your data, and how do you fix it?

At some point `as_tsibble()` will refuse to build your object. This is the error, and it is worth reading carefully because it is telling you something true about your data.

Here is what happens if we forget the key on the two-store sales table.

```r title="Trigger the duplicate rows error"
sales_raw <- sales |> mutate(month = yearmonth(month))

msg <- tryCatch(
  {as_tsibble(sales_raw, index = month); "it worked"},
  error = function(e) conditionMessage(e)
)
cat(msg)
#> A valid tsibble must have distinct rows identified by key and index.
#> ℹ Please use `duplicates()` to check the duplicated rows.
```

The `tryCatch()` wrapper is only there so the page keeps running after the error; in your own console you would just see the message in red. What it means is simple. We claimed `month` alone identifies each row, but January appears twice, once for North and once for South. tsibble cannot honour the uniqueness promise, so it refuses.

The error message names its own debugging tool, so use it.

```r title="Locate the duplicated rows"
is_duplicated(sales_raw, index = month)
#> [1] TRUE

duplicates(sales_raw, index = month) |> arrange(month) |> head(4)
#> # A tibble: 4 × 3
#>      month store units
#>      <mth> <chr> <dbl>
#> 1 2024 Jan North   120
#> 2 2024 Jan South    98
#> 3 2024 Feb North   133
#> 4 2024 Feb South   101
```

`is_duplicated()` answers yes or no, and `duplicates()` hands back every row caught in a clash so you can look at them. All twelve rows qualify here, so `arrange(month)` sorts them into pairs and `head(4)` shows the first two pairs. The answer is then plain to see: the two January rows carry the same timestamp and differ only by `store`, which is exactly the column we failed to name as the key.

That points to the two fixes, and choosing between them is a modelling decision, not a technical one.

**Fix 1, name the missing key.** If North and South really are two series you want to forecast separately, add `key = store` and you are done. That is what the very first code block did.

**Fix 2, aggregate the duplicates away.** If you only care about company-wide sales, collapse the two stores into one number per month first.

```r title="Aggregate duplicates into one series"
sales_total <- sales_raw |>
  summarise(units = sum(units), .by = month) |>
  as_tsibble(index = month)

sales_total
#> # A tsibble: 6 x 2 [1M]
#>      month units
#>      <mth> <dbl>
#> 1 2024 Jan   218
#> 2 2024 Feb   234
#> 3 2024 Mar   236
#> 4 2024 Apr   248
#> 5 2024 May   271
#> 6 2024 Jun   280
```

`summarise(.by = month)` adds up both stores for each month, leaving one row per month. Now `month` genuinely is unique, `as_tsibble()` accepts it, and you have a single national series. January's 218 is North's 120 plus South's 98.

[TIP]
**Read the duplicate error as "you have not named enough key columns yet."** Nine times out of ten a real column in your data explains why two rows share a timestamp: a store, a region, a product, a sensor. Find it, name it in the key, and the error disappears without you deleting a single row.

**Try it:** A sensor logged two readings on 2024-05-02 by mistake. Use `duplicates()` to pull out just the offending rows.

```r title="Your turn: find the duplicate readings"
ex_readings <- data.frame(
  day    = as.Date(c("2024-05-01", "2024-05-02", "2024-05-02", "2024-05-03")),
  temp_c = c(21.4, 22.8, 23.1, 20.9)
)

# duplicates(..., index = day)
# your code here

# Expected: 2 rows, both dated 2024-05-02
```

<details>
<summary>Click to reveal solution</summary>

```r title="Find duplicate readings solution"
duplicates(ex_readings, index = day)
#> # A tibble: 2 × 2
#>   day        temp_c
#>   <date>      <dbl>
#> 1 2024-05-02   22.8
#> 2 2024-05-02   23.1
```

**Explanation:** `duplicates()` returns every row involved in a clash, not just the extras, so you can compare 22.8 against 23.1 and decide which to keep. With no obvious key column here, the honest fixes are to average the pair or to keep whichever reading the logger marked as valid.

</details>

## How do you find the gaps hiding in a time series?

Here is the problem tsibble solves that a plain data frame cannot.

There are two ways a value can be missing from a time series. The first is **explicit**: the row exists, and the value in it is `NA`. You can see it, `sum(is.na(x))` counts it, and every R function knows how to complain about it.

The second is **implicit**: the row is simply not there. March never made it into the export. There is no `NA` to find, because there is no row to hold one. Your data frame has 10 rows instead of 12 and looks completely healthy.

Implicit missingness is dangerous precisely because it is invisible. A forecasting model that assumes evenly spaced observations will treat February as if it were followed by May, and return a wrong answer without any warning or error.

![Diagram of the gap workflow: missing rows flow into has_gaps, then to count_gaps and scan_gaps, then to fill_gaps and explicit NA](screenshots/tsibble-in-R-gap-workflow.webp)

*Figure 2: The four gap functions in the order you use them, from detection to explicit NA.*

Let us break the sales data on purpose by deleting two of South's months, then ask tsibble whether anything is wrong.

```r title="Detect gaps with has_gaps"
sales_gappy <- sales_ts |>
  filter(!(store == "South" & month %in% yearmonth(c("2024-03", "2024-04"))))

nrow(sales_gappy)
#> [1] 10

has_gaps(sales_gappy)
#> # A tibble: 2 × 2
#>   store .gaps
#>   <chr> <lgl>
#> 1 North FALSE
#> 2 South TRUE
```

The `filter()` call drops South's March and April, taking the table from 12 rows to 10. `has_gaps()` then reports one row per series with a `.gaps` flag: North is complete, South is not. That is the whole detection step, and on a table with 300 series it still returns one tidy row per series, so you can pipe it into `filter(.gaps)` to list the broken ones.

Knowing *that* South is broken is a start. Two more functions tell you *where*.

```r title="Locate gaps with scan_gaps and count_gaps"
scan_gaps(sales_gappy)
#> # A tsibble: 2 x 2 [1M]
#> # Key:       store [1]
#>   store    month
#>   <chr>    <mth>
#> 1 South 2024 Mar
#> 2 South 2024 Apr

count_gaps(sales_gappy)
#> # A tibble: 1 × 4
#>   store    .from      .to    .n
#>   <chr>    <mth>    <mth> <int>
#> 1 South 2024 Mar 2024 Apr     2
```

The two answer the same question at different zoom levels. `scan_gaps()` lists every missing timestamp individually, one row per hole, which is what you want when there are a handful. `count_gaps()` collapses consecutive holes into runs and reports the start (`.from`), the end (`.to`), and the length (`.n`), which is what you want when there are thousands.

On real data, `count_gaps()` is the one you reach for.

```r title="Count gaps in real hourly data"
ped_gaps <- count_gaps(pedestrian)

nrow(ped_gaps)
#> [1] 18

head(ped_gaps, 5)
#> # A tibble: 5 × 4
#>   Sensor         .from               .to                    .n
#>   <chr>          <dttm>              <dttm>              <int>
#> 1 Birrarung Marr 2015-04-05 02:00:00 2015-04-05 02:00:00     1
#> 2 Birrarung Marr 2015-05-07 00:00:00 2015-05-31 23:00:00   600
#> 3 Birrarung Marr 2015-10-06 00:00:00 2015-10-31 23:00:00   624
#> 4 Birrarung Marr 2015-11-05 00:00:00 2015-11-06 23:00:00    48
#> 5 Birrarung Marr 2015-11-20 00:00:00 2015-11-24 23:00:00   120
```

Eighteen separate outages across the four sensors, and the pattern in them is informative. Row 1 is a single missing hour on 5 April 2015, which is the night Melbourne's clocks went back for daylight saving. Rows 2 and 3 are 600 and 624 consecutive hours, roughly 25 and 26 days: the sensor was offline for most of May and most of October. Row 4 is a two-day outage. None of this is visible in the raw 66,037 rows, and none of it would produce a single `NA`.

[WARNING]
**Counting NA values will not find implicit gaps.** Running sum(is.na(pedestrian$Count)) on this data returns zero, because every row that exists has a real count in it. The 3,011 missing hours those 18 runs add up to have no rows at all. Only has_gaps() and its relatives can see them.

**Try it:** Build a version of `sales_ts` where South's first three months are missing entirely, then compare `has_gaps()` with `has_gaps(.full = TRUE)`. The two disagree, and the reason is worth knowing.

```r title="Your turn: compare .full = FALSE and TRUE"
# ex_late <- sales_ts |>
#   filter(!(store == "South" &
#            month %in% yearmonth(c("2024-01", "2024-02", "2024-03"))))

# has_gaps(ex_late)
# has_gaps(ex_late, .full = TRUE)

# Expected: FALSE for South in the first, TRUE in the second
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare .full solution"
ex_late <- sales_ts |>
  filter(!(store == "South" &
           month %in% yearmonth(c("2024-01", "2024-02", "2024-03"))))

has_gaps(ex_late)
#> # A tibble: 2 × 2
#>   store .gaps
#>   <chr> <lgl>
#> 1 North FALSE
#> 2 South FALSE

has_gaps(ex_late, .full = TRUE)
#> # A tibble: 2 × 2
#>   store .gaps
#>   <chr> <lgl>
#> 1 North FALSE
#> 2 South TRUE
```

**Explanation:** By default, every gap function judges each series against its own time span. South now runs from April to June with nothing missing inside that window, so the default answer is "no gaps". Setting `.full = TRUE` judges every series against the full span of the whole table, January to June, and then South's late start counts as three missing months. Use the default when series legitimately begin at different times (a store that opened in April), and `.full = TRUE` when every series is supposed to cover the same window.

</details>

## How do you fill gaps so every period has a row?

Detection is half the job. `fill_gaps()` does the other half: it inserts the missing rows so the calendar is complete again.

```r title="Turn implicit gaps into explicit NA"
sales_full <- fill_gaps(sales_gappy)

sales_full |> filter(store == "South")
#> # A tsibble: 6 x 3 [1M]
#> # Key:       store [1]
#>      month store units
#>      <mth> <chr> <dbl>
#> 1 2024 Jan South    98
#> 2 2024 Feb South   101
#> 3 2024 Mar South    NA
#> 4 2024 Apr South    NA
#> 5 2024 May South   121
#> 6 2024 Jun South   118
```

South is back to six rows. March and April exist again, and their `units` values are `NA`. This is the crucial move: an invisible problem has become a visible one. Every R function that knows how to handle `NA` can now handle your data, and `sum(is.na(sales_full$units))` finally returns 2.

You can also fill with a value instead of `NA`, by naming the column.

```r title="Fill gaps with a fixed value"
fill_gaps(sales_gappy, units = 0) |> filter(store == "South")
#> # A tsibble: 6 x 3 [1M]
#> # Key:       store [1]
#>      month store units
#>      <mth> <chr> <dbl>
#> 1 2024 Jan South    98
#> 2 2024 Feb South   101
#> 3 2024 Mar South     0
#> 4 2024 Apr South     0
#> 5 2024 May South   121
#> 6 2024 Jun South   118
```

Whether that zero is right depends entirely on why the data is missing. If the store genuinely sold nothing in March, zero is the correct value. If the sales system was down, zero is simply wrong, and every model fitted to that history will forecast too low. Fill with zero only when absence really does mean none.

For most series, carrying the last known value forward is the safer default. `fill_gaps()` creates the rows and `tidyr::fill()` populates them.

```r title="Fill gaps then carry values forward"
library(tidyr)

sales_carried <- sales_full |>
  group_by_key() |>
  fill(units, .direction = "down") |>
  ungroup()

sales_carried |> filter(store == "South")
#> # A tsibble: 6 x 3 [1M]
#> # Key:       store [1]
#>      month store units
#>      <mth> <chr> <dbl>
#> 1 2024 Jan South    98
#> 2 2024 Feb South   101
#> 3 2024 Mar South   101
#> 4 2024 Apr South   101
#> 5 2024 May South   121
#> 6 2024 Jun South   118
```

March and April now hold 101, February's value, carried down. The `group_by_key()` call is what makes this safe: it tells `fill()` to work within each store separately, so North's last value can never leak into South's first gap. Without it, `fill()` would run straight down the combined table and do exactly that.

[TIP]
**Create the rows first, decide the values second.** Running fill_gaps() with no arguments and inspecting the NA rows shows you how much you are about to invent. Only then choose between carrying forward, interpolating, or filling with zero. Jumping straight to a filled value hides the size of the problem from yourself.

**Try it:** Fill South's two gaps with that store's own average instead of a fixed number. You will need `group_by_key()` for the average to be per-store.

```r title="Your turn: fill with the per-store mean"
# sales_gappy |>
#   group_by_key() |>
#   fill_gaps(units = mean(units)) |>
#   filter(store == "South")

# Expected: March and April both show 110. (South's own mean)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fill with group mean solution"
sales_gappy |>
  group_by_key() |>
  fill_gaps(units = mean(units)) |>
  filter(store == "South")
#> # A tsibble: 6 x 3 [1M]
#> # Key:       store [1]
#> # Groups:    store [1]
#>      month store units
#>      <mth> <chr> <dbl>
#> 1 2024 Jan South   98 
#> 2 2024 Feb South  101 
#> 3 2024 Mar South  110.
#> 4 2024 Apr South  110.
#> 5 2024 May South  121 
#> 6 2024 Jun South  118 
```

**Explanation:** With `group_by_key()`, `mean(units)` is evaluated inside each store, so South's gaps get South's average of its four observed months, 109.5, printed rounded as 110. Drop the `group_by_key()` line and `mean(units)` is computed across both stores instead, giving 128.2, which quietly imports North's larger numbers into South's series.

</details>

## How does index_by() change the time granularity?

Hourly data is rarely the granularity you want to model. `index_by()` is the tool that moves between granularities, and it is best understood as `group_by()` for the time column only.

Here is hourly pedestrian traffic collapsed into daily totals per sensor.

```r title="Aggregate hourly data to daily"
library(lubridate)

ped_daily <- pedestrian |>
  group_by_key() |>
  index_by(day = as_date(Date_Time)) |>
  summarise(daily_count = sum(Count))

ped_daily
#> # A tsibble: 2,752 x 3 [1D]
#> # Key:       Sensor [4]
#>    Sensor         day        daily_count
#>    <chr>          <date>           <int>
#>  1 Birrarung Marr 2015-01-01        8950
#>  2 Birrarung Marr 2015-01-02        3972
#>  3 Birrarung Marr 2015-01-03        2505
#>  4 Birrarung Marr 2015-01-04        6765
#>  5 Birrarung Marr 2015-01-05       10030
#>  6 Birrarung Marr 2015-01-06        7667
#>  7 Birrarung Marr 2015-01-07        5242
#>  8 Birrarung Marr 2015-01-08        5516
#>  9 Birrarung Marr 2015-01-09        7813
#> 10 Birrarung Marr 2015-01-10       15291
#> # ℹ 2,742 more rows
```

Read the pipeline one step at a time. `group_by_key()` says "keep the four sensors apart". `index_by(day = as_date(Date_Time))` creates a new index called `day` by throwing away the time-of-day part of each timestamp. `summarise(daily_count = sum(Count))` then adds up the counts inside each sensor-day.

The result is still a tsibble, and its header proves the transformation worked: 66,037 hourly rows became 2,752 daily rows, the interval changed from `[1h]` to `[1D]`, and the key survived with all 4 sensors intact. New Year's Day 2015 saw 8,950 people pass the Birrarung Marr sensor.

[NOTE]
**Loading lubridate hides tsibble's interval() function.** Both packages define a function called interval, and the one loaded last wins, so after `library(lubridate)` a call to `interval(sales_ts)` will fail. Write `tsibble::interval(sales_ts)` to be explicit. This is a naming collision, not a bug in either package.

The same pattern moves monthly data up to quarterly. When the new index is derived from the old one by a function, the tilde shorthand is tidier.

```r title="Aggregate months into quarters"
sales_q <- sales_ts |>
  group_by_key() |>
  index_by(quarter = ~ yearquarter(.)) |>
  summarise(units = sum(units))

sales_q
#> # A tsibble: 4 x 3 [1Q]
#> # Key:       store [2]
#>   store quarter units
#>   <chr>   <qtr> <dbl>
#> 1 North 2024 Q1   394
#> 2 North 2024 Q2   450
#> 3 South 2024 Q1   294
#> 4 South 2024 Q2   349
```

The `~ yearquarter(.)` formula means "apply `yearquarter()` to the current index", with the dot standing in for whatever the index happens to be called. Twelve monthly rows became four quarterly rows, two per store. North's Q1 total of 394 is January's 120 plus February's 133 plus March's 141.

For simply cutting out a window of time rather than aggregating, `filter_index()` is a shortcut that saves you writing date comparisons.

```r title="Select a time window with filter_index"
sales_ts |> filter_index("2024-02" ~ "2024-04")
#> # A tsibble: 6 x 3 [1M]
#> # Key:       store [2]
#>      month store units
#>      <mth> <chr> <dbl>
#> 1 2024 Feb North   133
#> 2 2024 Mar North   141
#> 3 2024 Apr North   138
#> 4 2024 Feb South   101
#> 5 2024 Mar South    95
#> 6 2024 Apr South   110
```

The tilde reads as "from, to", and it is inclusive at both ends. It also understands partial dates, so `"2015"` means all of 2015 and `"2015-03"` means all of March 2015. The open forms `. ~ "2024-04"` and `"2024-02" ~ .` mean "everything up to" and "everything from".

[KEY INSIGHT]
**index_by() re-indexes without ever merging two series, as long as you group by key first.** That is what separates it from a plain group_by() on a rounded date column: the key stays intact, the output is still a tsibble, and the new interval is recomputed for you rather than assumed.

**Try it:** Take the `ped_daily` object you just built and roll it up one more level, to monthly totals per sensor.

```r title="Your turn: aggregate daily to monthly"
# Same three-step pattern, with yearmonth() instead of as_date()
# ped_daily |>
#   group_by_key() |>
#   index_by(mth = ~ yearmonth(.)) |>
#   summarise(monthly_count = sum(daily_count))

# Expected: 95 rows, interval 1M, 4 sensors
```

<details>
<summary>Click to reveal solution</summary>

```r title="Daily to monthly solution"
ped_daily |>
  group_by_key() |>
  index_by(mth = ~ yearmonth(.)) |>
  summarise(monthly_count = sum(daily_count))
#> # A tsibble: 95 x 3 [1M]
#> # Key:       Sensor [4]
#>    Sensor              mth monthly_count
#>    <chr>             <mth>         <int>
#>  1 Birrarung Marr 2015 Jan        500834
#>  2 Birrarung Marr 2015 Feb        336921
#>  3 Birrarung Marr 2015 Mar        531849
#>  4 Birrarung Marr 2015 Apr        297232
#>  5 Birrarung Marr 2015 May         60985
#>  6 Birrarung Marr 2015 Jun        270735
#>  7 Birrarung Marr 2015 Jul        357525
#>  8 Birrarung Marr 2015 Aug        231976
#>  9 Birrarung Marr 2015 Sep        289593
#> 10 Birrarung Marr 2015 Oct         98432
#> # ℹ 85 more rows
```

**Explanation:** 2,752 daily rows became 95 monthly rows across four sensors. Notice May 2015 at 60,985 against March's 531,849: that is the 25-day outage `count_gaps()` found earlier showing up as a suspiciously small total. Aggregating over gaps sums whatever rows exist, so always fill gaps before you roll up, or a broken sensor will look like a quiet month.

</details>

## Which dplyr verbs behave differently on a tsibble?

A tsibble is a data frame, so `filter()`, `mutate()`, `select()` and `summarise()` all work. Three of them behave slightly differently, and the differences trip people up until they know the rule: **the index and key columns are structural, so tsibble protects them.**

Start with `select()`, which is the most surprising.

```r title="select() keeps the index and key"
sales_ts |> select(units)
#> # A tsibble: 12 x 3 [1M]
#> # Key:       store [2]
#>    units    month store
#>    <dbl>    <mth> <chr>
#>  1   120 2024 Jan North
#>  2   133 2024 Feb North
#>  3   141 2024 Mar North
#>  4   138 2024 Apr North
#>  5   150 2024 May North
#>  6   162 2024 Jun North
#>  7    98 2024 Jan South
#>  8   101 2024 Feb South
#>  9    95 2024 Mar South
#> 10   110 2024 Apr South
#> 11   121 2024 May South
#> 12   118 2024 Jun South
```

We asked for one column and got three. That is deliberate. Dropping `month` would leave an object claiming to be a time series with no time in it, so tsibble adds the index and key back automatically. They move to the end of the column order, which is your visual cue that they were re-attached rather than requested.

`summarise()` goes the other way: it removes the key.

```r title="summarise() collapses across the key"
sales_ts |> summarise(total = sum(units))
#> # A tsibble: 6 x 2 [1M]
#>      month total
#>      <mth> <dbl>
#> 1 2024 Jan   218
#> 2 2024 Feb   234
#> 3 2024 Mar   236
#> 4 2024 Apr   248
#> 5 2024 May   271
#> 6 2024 Jun   280
```

Without `group_by_key()`, `summarise()` treats the whole table as one thing and adds North and South together for each month, returning a single national series with no `Key:` line. That is either exactly what you wanted or a silent bug, depending on your intent. If you meant to keep the stores apart, `group_by_key()` before summarising is the fix, which is what the `index_by()` examples did.

For per-series calculations that keep every row, combine `group_by_key()` with `mutate()`.

```r title="Per-series running totals"
sales_ts |>
  group_by_key() |>
  mutate(cumulative = cumsum(units)) |>
  ungroup() |>
  as_tibble() |>
  head(3)
#> # A tibble: 3 × 4
#>      month store units cumulative
#>      <mth> <chr> <dbl>      <dbl>
#> 1 2024 Jan North   120        120
#> 2 2024 Feb North   133        253
#> 3 2024 Mar North   141        394
```

`cumsum()` restarts at each store rather than running continuously through the table, because `group_by_key()` scoped it. The `as_tibble()` at the end is the escape hatch: it strips the tsibble structure and hands back a plain tibble, which is what you want when you are done with time-series operations and just need a table to print or join.

[NOTE]
**arrange() cannot reorder the index.** Sorting a tsibble by anything other than key then index produces a warning that "current temporal ordering may yield unexpected results", because a time series with shuffled timestamps is not a time series. Convert with as_tibble() first if you genuinely want a table sorted by value.

**Try it:** Add a three-month rolling mean per store, computed with `lag()`. The first two months of each store have no history, so they should come out `NA`.

```r title="Your turn: per-store rolling mean"
# sales_ts |>
#   group_by_key() |>
#   mutate(roll3 = (units + lag(units) + lag(units, 2)) / 3) |>
#   ungroup() |>
#   as_tibble() |>
#   head(4)

# Expected: NA, NA, then 131. and 137. for North
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rolling mean solution"
sales_ts |>
  group_by_key() |>
  mutate(roll3 = (units + lag(units) + lag(units, 2)) / 3) |>
  ungroup() |>
  as_tibble() |>
  head(4)
#> # A tibble: 4 × 4
#>      month store units roll3
#>      <mth> <chr> <dbl> <dbl>
#> 1 2024 Jan North   120   NA 
#> 2 2024 Feb North   133   NA 
#> 3 2024 Mar North   141  131.
#> 4 2024 Apr North   138  137.
```

**Explanation:** `lag(units)` reaches back one row and `lag(units, 2)` reaches back two, so March averages 120, 133 and 141 to get 131.3. January and February have nothing to reach back to, so the arithmetic yields `NA`. `group_by_key()` is what stops South's first month from lagging into North's last, which would silently produce a nonsense number instead of an honest `NA`.

</details>

## Complete Example: from a messy raw table to a forecast

Time to put every step together on data that has both problems at once: a duplicated row and a stretch of missing months. This is what a real export from an orders database looks like.

First, build the raw table. Two regions, 24 months each, then one row accidentally duplicated and two months of West's data lost in transit.

```r title="Create the messy raw orders table"
set.seed(2024)

raw_orders <- data.frame(
  month  = rep(format(seq(as.Date("2022-01-01"), by = "month",
                          length.out = 24), "%Y-%m"), times = 2),
  region = rep(c("East", "West"), each = 24),
  orders = c(round(200 + 20 * sin(seq_len(24) / 2) + rnorm(24, 0, 8)),
             round(150 + 15 * sin(seq_len(24) / 2) + rnorm(24, 0, 6)))
)

raw_orders <- rbind(raw_orders, raw_orders[5, ])
raw_orders <- raw_orders[!(raw_orders$region == "West" &
                           raw_orders$month %in% c("2022-07", "2022-08")), ]

nrow(raw_orders)
#> [1] 47
```

Inside `orders`, the `sin()` term draws a gentle seasonal wave and `rnorm()` scatters random noise around it, so the numbers rise and fall the way real order volumes do. Forty-eight rows would be clean. We have 47, because one row was added and two were removed. The row count alone cannot tell you which rows were added and which were lost, and a plain data frame gives you no way to find out.

Step one is always to convert the time column and check for duplicates before doing anything else.

```r title="Convert the index and check duplicates"
raw_orders <- raw_orders |> mutate(month = yearmonth(month))

duplicates(raw_orders, index = month, key = region)
#> # A tibble: 2 × 3
#>      month region orders
#>      <mth> <chr>   <dbl>
#> 1 2022 May East      221
#> 2 2022 May East      221
```

Passing both `index` and `key` to `duplicates()` asks the exact question `as_tsibble()` would ask, without triggering an error. The answer: East's May 2022 appears twice with identical values, a straightforward double-load.

Step two is to remove the duplicate and build the tsibble, then immediately ask about gaps.

```r title="Build the tsibble and audit the gaps"
orders_ts <- raw_orders |>
  summarise(orders = first(orders), .by = c(region, month)) |>
  as_tsibble(index = month, key = region)

has_gaps(orders_ts)
#> # A tibble: 2 × 2
#>   region .gaps
#>   <chr>  <lgl>
#> 1 East   FALSE
#> 2 West   TRUE

count_gaps(orders_ts)
#> # A tibble: 1 × 4
#>   region    .from      .to    .n
#>   <chr>     <mth>    <mth> <int>
#> 1 West   2022 Jul 2022 Aug     2
```

`summarise(.by = c(region, month))` puts every region-month combination into its own group, which is what gives `as_tsibble()` the one row per group it needs. The choice of summary function is where you have to think. Here the pair is one order batch that got loaded twice, so `first(orders)` keeps East's May at its real 221. Using `sum()` instead would have added 221 to itself and reported 442, inventing a month that never happened. In your own data, decide deliberately: `sum()` when the rows are separate real events that belong together, `first()` or `max()` when they are the same event logged twice.

The gap audit is unambiguous. East is complete; West is missing July and August 2022.

Step three is to repair the calendar and impute, per series.

```r title="Fill and impute per region"
orders_full <- orders_ts |>
  fill_gaps() |>
  group_by_key() |>
  fill(orders, .direction = "down") |>
  ungroup()

has_gaps(orders_full)
#> # A tibble: 2 × 2
#>   region .gaps
#>   <chr>  <lgl>
#> 1 East   FALSE
#> 2 West   FALSE

orders_full |> filter(region == "West", month >= yearmonth("2022-06")) |> head(4)
#> # A tsibble: 4 x 3 [1M]
#> # Key:       region [1]
#>   region    month orders
#>   <chr>     <mth>  <dbl>
#> 1 West   2022 Jun    151
#> 2 West   2022 Jul    151
#> 3 West   2022 Aug    151
#> 4 West   2022 Sep    132
```

Both regions now report `FALSE`. July and August carry June's 151 forward, and September resumes with its own real value of 132. The series is complete and evenly spaced, and because you ran `count_gaps()` first you know exactly which two values you invented.

Step four is the payoff. A complete keyed tsibble is exactly what the forecasting packages in the same family expect, so fitting a model to both regions at once takes one line.

```r title="Forecast both regions at once"
library(fable)

orders_full |>
  model(snaive = SNAIVE(orders)) |>
  forecast(h = 3) |>
  as_tibble() |>
  select(region, month, .mean) |>
  print(n = 6)
#> # A tibble: 6 × 3
#>   region    month .mean
#>   <chr>     <mth> <dbl>
#> 1 East   2024 Jan   211
#> 2 East   2024 Feb   215
#> 3 East   2024 Mar   193
#> 4 West   2024 Jan   155
#> 5 West   2024 Feb   157
#> 6 West   2024 Mar   161
```

`model()` read the key and fitted a separate seasonal naive model to each region. `forecast(h = 3)` produced three months ahead for each. Six forecast rows came back, two series by three horizons, and at no point did you write a loop or split the data.

That is the return on the setup work. Every step in this pipeline, from `duplicates()` to `forecast()`, was possible only because the object knew its own index, key and interval.

## Practice Exercises

### Exercise 1: Audit a device log

You have voltage readings from two devices over four days, except device B's log lost two of them. Build a keyed tsibble and report exactly which days are missing.

```r title="Exercise 1 starter"
my_readings <- data.frame(
  stamp  = rep(c("2024-02-01", "2024-02-02",
                 "2024-02-03", "2024-02-04"), times = 2),
  device = rep(c("A", "B"), each = 4),
  volts  = c(3.31, 3.28, 3.35, 3.30, 3.11, 3.14, 3.09, 3.12)
)
my_readings <- my_readings[-c(6, 7), ]

# Hint: convert stamp with as.Date(), then as_tsibble(index=, key=)
# Then use count_gaps()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Device log audit solution"
my_ts <- my_readings |>
  mutate(stamp = as.Date(stamp)) |>
  as_tsibble(index = stamp, key = device)

my_ts
#> # A tsibble: 6 x 3 [1D]
#> # Key:       device [2]
#>   stamp      device volts
#>   <date>     <chr>  <dbl>
#> 1 2024-02-01 A       3.31
#> 2 2024-02-02 A       3.28
#> 3 2024-02-03 A       3.35
#> 4 2024-02-04 A       3.3 
#> 5 2024-02-01 B       3.11
#> 6 2024-02-04 B       3.12

count_gaps(my_ts)
#> # A tibble: 1 × 4
#>   device .from      .to           .n
#>   <chr>  <date>     <date>     <int>
#> 1 B      2024-02-02 2024-02-03     2
```

**Explanation:** Six rows survive instead of eight, and the printed tsibble shows device B jumping straight from the 1st to the 4th. `count_gaps()` names the run: device B, 2 February through 3 February, two observations. Because both missing days sit inside B's own span, the default `.full = FALSE` is enough to catch them.

</details>

### Exercise 2: Repair the log and prove it

Take the tsibble from Exercise 1, make the calendar complete, carry each device's last known voltage into its gaps, and then prove no gaps remain.

```r title="Exercise 2 starter"
# Hint: fill_gaps() creates the rows, tidyr::fill() populates them
# group_by_key() is what keeps device A's values out of device B's gaps
# Finish by calling has_gaps() on the result

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Repair the log solution"
my_filled <- my_ts |>
  fill_gaps() |>
  group_by_key() |>
  fill(volts, .direction = "down") |>
  ungroup()

my_filled
#> # A tsibble: 8 x 3 [1D]
#> # Key:       device [2]
#>   stamp      device volts
#>   <date>     <chr>  <dbl>
#> 1 2024-02-01 A       3.31
#> 2 2024-02-02 A       3.28
#> 3 2024-02-03 A       3.35
#> 4 2024-02-04 A       3.3 
#> 5 2024-02-01 B       3.11
#> 6 2024-02-02 B       3.11
#> 7 2024-02-03 B       3.11
#> 8 2024-02-04 B       3.12

has_gaps(my_filled)
#> # A tibble: 2 × 2
#>   device .gaps
#>   <chr>  <lgl>
#> 1 A      FALSE
#> 2 B      FALSE
```

**Explanation:** Six rows became eight, a complete four-by-two grid. Device B's 2nd and 3rd both carry 3.11 from the 1st, and device A is untouched because `group_by_key()` walled the two series off from each other. The final `has_gaps()` returning `FALSE` twice is the proof that the object is now safe to model.

</details>

### Exercise 3: Find the busiest sensor-day in Melbourne

Using the `ped_daily` object built earlier, find the single sensor-day with the highest pedestrian count in the whole dataset.

```r title="Exercise 3 starter"
# Hint: a tsibble refuses to be sorted by value, so escape with as_tibble()
# then slice_max(daily_count, n = 1)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Busiest sensor-day solution"
ped_daily |>
  as_tibble() |>
  slice_max(daily_count, n = 1)
#> # A tibble: 1 × 3
#>   Sensor         day        daily_count
#>   <chr>          <date>           <int>
#> 1 Birrarung Marr 2015-03-08       88086
```

**Explanation:** 88,086 people passed the Birrarung Marr sensor on 8 March 2015, which was the Sunday of Melbourne's Moomba festival held in that exact park. The `as_tibble()` step matters: `slice_max()` reorders rows by value, and a tsibble warns when you break its temporal ordering. Dropping the structure first says "I am done treating this as a time series" and removes the warning entirely.

</details>

## Frequently Asked Questions

### Do I need a key if I only have one time series?

No. The key is optional, and a tsibble with no key is perfectly valid, as the annual profit and daily clicks examples showed. Add a key only when your table stacks two or more series on top of each other.

### What is the real advantage over a plain ts object?

Three things. A `ts` object holds exactly one series, so 300 series means 300 objects or a wide matrix; a tsibble holds all 300 in one tidy table. A `ts` stores time as a start point plus a frequency, so it cannot represent an irregular or gapped series at all, whereas a tsibble stores real dates and can tell you precisely what is missing. And a tsibble is still a data frame, so every dplyr and ggplot2 skill you already have keeps working. The trade-off is that a lot of older forecasting code expects `ts`, which is why [time series objects in R](Time-Series-Objects-in-R.html) covers converting between all four classes.

### Why does my interval say 1D when my data is monthly?

Because your dates are stored as `Date` values sitting on the first of each month. The gaps between them are 28 to 31 days, and the largest step that divides all of them evenly is one day. Convert the column with `yearmonth()` before calling `as_tsibble()` and the interval becomes `1M`.

### Can a tsibble hold irregularly spaced events?

Yes, with `as_tsibble(regular = FALSE)`. The interval then prints as `[!]`, and the gap functions no longer apply, since "missing" has no meaning when there is no expected spacing. Use it for event logs such as trades or clicks; use the regular form for anything you plan to forecast.

### Does fable require a tsibble?

Yes. Every function in the fable and feasts packages takes a tsibble as input and reads the key to decide how many models to fit and the interval to decide the seasonal period. Getting the tsibble right is genuinely the prerequisite step, which is why the [fable forecasting tutorial](fable-in-R.html) assumes the object already exists.

## Summary

![Mindmap of tsibble concepts grouped into structure, building, gap handling, and reshaping](screenshots/tsibble-in-R-overview-mindmap.webp)

*Figure 3: Everything tsibble gives you, grouped by the job it does.*

| Job | Function | What it gives you |
|---|---|---|
| Promote a data frame | `as_tsibble(index =, key =)` | A time-aware table |
| Build from scratch | `tsibble(..., index =)` | Same, without a source frame |
| Convert coarse time | `yearmonth()`, `yearquarter()`, `yearweek()` | The right interval instead of `1D` |
| Inspect the contract | `index_var()`, `key_vars()`, `interval()`, `n_keys()` | What the object thinks it is |
| Diagnose a build error | `is_duplicated()`, `duplicates()` | The rows that broke uniqueness |
| Detect missing rows | `has_gaps()` | One TRUE/FALSE per series |
| Locate missing rows | `scan_gaps()`, `count_gaps()` | Every hole, or every run of holes |
| Repair the calendar | `fill_gaps()` | Explicit `NA` rows you can impute |
| Change granularity | `index_by()` + `summarise()` | Hourly to daily, monthly to quarterly |
| Cut a time window | `filter_index("a" ~ "b")` | A slice without date arithmetic |
| Leave time behind | `as_tibble()` | A plain tibble, no structure |

The three ideas worth carrying away:

1. **The index and key are a promise that each row is unique.** When `as_tsibble()` errors, it is telling you the promise is broken, and the fix is almost always naming a key column you forgot.
2. **Implicit missingness is invisible until you look for it.** A row that does not exist cannot be an `NA`, so counting `NA` values proves nothing. `has_gaps()` is the only honest check.
3. **Fix the calendar before you model.** Duplicates, then gaps, then imputation, then aggregation. Doing it in that order means every later step operates on a complete, evenly spaced series.

## References

1. Wang, E., Cook, D., and Hyndman, R.J. "A New Tidy Data Structure to Support Exploration and Modeling of Temporal Data." *Journal of Computational and Graphical Statistics*, 29(3), 2020. [Link](https://robjhyndman.com/publications/tsibble/)
2. tsibble package documentation. [Link](https://tsibble.tidyverts.org/)
3. Introduction to tsibble (package vignette). [Link](https://tsibble.tidyverts.org/articles/intro-tsibble.html)
4. Handle implicit missingness with tsibble (package vignette). [Link](https://cran.r-project.org/web/packages/tsibble/vignettes/implicit-na.html)
5. `fill_gaps()` reference page. [Link](https://tsibble.tidyverts.org/reference/fill_gaps.html)
6. Hyndman, R.J. and Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition, Chapter 2: Time series graphics. [Link](https://otexts.com/fpp3/graphics.html)
7. Hyndman, R.J. "Tidy time series data using tsibbles." [Link](https://robjhyndman.com/hyndsight/tsibbles/)
8. tidyverts, the tidy time series ecosystem. [Link](https://tidyverts.org/)
9. tsibble source repository on GitHub. [Link](https://github.com/tidyverts/tsibble)

## Continue Learning

- **[Forecasting with fable in R](fable-in-R.html)** - now that you can build a clean tsibble, fit ETS, ARIMA and seasonal naive models to every series in it with a single `model()` call.
- **[Time Series Objects in R](Time-Series-Objects-in-R.html)** - how tsibble compares with `ts`, `zoo` and `xts`, and how to convert between all four when older code demands a different class.
- **[Time Series Features in R](Time-Series-Features-in-R.html)** - turn each series in a keyed tsibble into a single row of summary features, so you can triage hundreds of series at once.
