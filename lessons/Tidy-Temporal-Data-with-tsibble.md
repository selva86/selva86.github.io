---
title: "Time Series Foundations Lesson 2: Tidy temporal data with tsibble"
catalog_blurb: "Turn a plain data frame into a tsibble and fix its missing dates."
description: "Convert a data frame into a tsibble with the right index and key, tell an implicit gap from an NA, and fill it with fill_gaps() before aggregating in R."
keywords: "tsibble in R, as_tsibble, fill_gaps, implicit gaps time series, index_by tsibble, tidy time series data"
post_type: "LESSON"
curriculum_id: "5.10.2"
webr: true
mathjax: false
lesson_access: "free"
course_id: "ts-foundations"
course_title: "Time Series Foundations"
course_lesson: "2"
course_total: "8"
course_landing: "Time-Series-Foundations-Course.html"
course_next: "Time-Series-Analysis-in-R.html"
course_prev: "What-Makes-Time-Series-Different.html"
---

=== step === cover
## Tidy temporal data with tsibble

Today let's understand tsibble, the data structure R uses for time series, with a real example.

Riverside Bike Share runs two rental kiosks, one at Riverside and one Downtown. Here is each kiosk's daily rentals for June and July 2024, 61 days, one dot per day.

::widget chart-plotter {"data":[{"x":1,"y":176,"fill":"Riverside"},{"x":2,"y":174,"fill":"Riverside"},{"x":3,"y":153,"fill":"Riverside"},{"x":4,"y":107,"fill":"Riverside"},{"x":5,"y":125,"fill":"Riverside"},{"x":6,"y":119,"fill":"Riverside"},{"x":7,"y":135,"fill":"Riverside"},{"x":8,"y":163,"fill":"Riverside"},{"x":9,"y":159,"fill":"Riverside"},{"x":10,"y":131,"fill":"Riverside"},{"x":11,"y":140,"fill":"Riverside"},{"x":12,"y":146,"fill":"Riverside"},{"x":13,"y":129,"fill":"Riverside"},{"x":14,"y":136,"fill":"Riverside"},{"x":15,"y":162,"fill":"Riverside"},{"x":16,"y":133,"fill":"Riverside"},{"x":17,"y":152,"fill":"Riverside"},{"x":18,"y":129,"fill":"Riverside"},{"x":19,"y":131,"fill":"Riverside"},{"x":20,"y":143,"fill":"Riverside"},{"x":21,"y":135,"fill":"Riverside"},{"x":22,"y":154,"fill":"Riverside"},{"x":23,"y":177,"fill":"Riverside"},{"x":24,"y":126,"fill":"Riverside"},{"x":25,"y":125,"fill":"Riverside"},{"x":26,"y":146,"fill":"Riverside"},{"x":27,"y":107,"fill":"Riverside"},{"x":28,"y":145,"fill":"Riverside"},{"x":29,"y":175,"fill":"Riverside"},{"x":30,"y":173,"fill":"Riverside"},{"x":31,"y":155,"fill":"Riverside"},{"x":32,"y":128,"fill":"Riverside"},{"x":33,"y":149,"fill":"Riverside"},{"x":34,"y":129,"fill":"Riverside"},{"x":35,"y":138,"fill":"Riverside"},{"x":36,"y":132,"fill":"Riverside"},{"x":37,"y":156,"fill":"Riverside"},{"x":38,"y":144,"fill":"Riverside"},{"x":39,"y":131,"fill":"Riverside"},{"x":40,"y":150,"fill":"Riverside"},{"x":41,"y":144,"fill":"Riverside"},{"x":42,"y":133,"fill":"Riverside"},{"x":43,"y":156,"fill":"Riverside"},{"x":44,"y":154,"fill":"Riverside"},{"x":45,"y":132,"fill":"Riverside"},{"x":46,"y":166,"fill":"Riverside"},{"x":47,"y":134,"fill":"Riverside"},{"x":48,"y":143,"fill":"Riverside"},{"x":49,"y":153,"fill":"Riverside"},{"x":50,"y":160,"fill":"Riverside"},{"x":51,"y":161,"fill":"Riverside"},{"x":52,"y":141,"fill":"Riverside"},{"x":53,"y":144,"fill":"Riverside"},{"x":54,"y":128,"fill":"Riverside"},{"x":55,"y":141,"fill":"Riverside"},{"x":56,"y":130,"fill":"Riverside"},{"x":57,"y":156,"fill":"Riverside"},{"x":58,"y":182,"fill":"Riverside"},{"x":59,"y":122,"fill":"Riverside"},{"x":60,"y":148,"fill":"Riverside"},{"x":61,"y":135,"fill":"Riverside"},{"x":1,"y":112,"fill":"Downtown"},{"x":2,"y":115,"fill":"Downtown"},{"x":3,"y":98,"fill":"Downtown"},{"x":4,"y":105,"fill":"Downtown"},{"x":5,"y":100,"fill":"Downtown"},{"x":6,"y":97,"fill":"Downtown"},{"x":7,"y":96,"fill":"Downtown"},{"x":8,"y":115,"fill":"Downtown"},{"x":9,"y":85,"fill":"Downtown"},{"x":10,"y":96,"fill":"Downtown"},{"x":12,"y":88,"fill":"Downtown"},{"x":13,"y":90,"fill":"Downtown"},{"x":14,"y":79,"fill":"Downtown"},{"x":15,"y":102,"fill":"Downtown"},{"x":16,"y":107,"fill":"Downtown"},{"x":17,"y":85,"fill":"Downtown"},{"x":19,"y":100,"fill":"Downtown"},{"x":20,"y":97,"fill":"Downtown"},{"x":21,"y":88,"fill":"Downtown"},{"x":22,"y":109,"fill":"Downtown"},{"x":23,"y":118,"fill":"Downtown"},{"x":24,"y":90,"fill":"Downtown"},{"x":26,"y":111,"fill":"Downtown"},{"x":27,"y":105,"fill":"Downtown"},{"x":28,"y":94,"fill":"Downtown"},{"x":29,"y":116,"fill":"Downtown"},{"x":30,"y":98,"fill":"Downtown"},{"x":31,"y":92,"fill":"Downtown"},{"x":32,"y":97,"fill":"Downtown"},{"x":33,"y":91,"fill":"Downtown"},{"x":34,"y":88,"fill":"Downtown"},{"x":35,"y":103,"fill":"Downtown"},{"x":36,"y":114,"fill":"Downtown"},{"x":37,"y":101,"fill":"Downtown"},{"x":38,"y":92,"fill":"Downtown"},{"x":39,"y":93,"fill":"Downtown"},{"x":40,"y":82,"fill":"Downtown"},{"x":41,"y":101,"fill":"Downtown"},{"x":42,"y":102,"fill":"Downtown"},{"x":43,"y":107,"fill":"Downtown"},{"x":44,"y":100,"fill":"Downtown"},{"x":45,"y":91,"fill":"Downtown"},{"x":46,"y":105,"fill":"Downtown"},{"x":47,"y":84,"fill":"Downtown"},{"x":48,"y":100,"fill":"Downtown"},{"x":49,"y":92,"fill":"Downtown"},{"x":50,"y":100,"fill":"Downtown"},{"x":51,"y":118,"fill":"Downtown"},{"x":52,"y":100,"fill":"Downtown"},{"x":53,"y":112,"fill":"Downtown"},{"x":54,"y":105,"fill":"Downtown"},{"x":55,"y":86,"fill":"Downtown"},{"x":56,"y":102,"fill":"Downtown"},{"x":57,"y":118,"fill":"Downtown"},{"x":58,"y":109,"fill":"Downtown"},{"x":59,"y":94,"fill":"Downtown"},{"x":60,"y":101,"fill":"Downtown"},{"x":61,"y":92,"fill":"Downtown"}],"geoms":["point"],"x":"day","y":"rentals","code":{"point":"ggplot(kiosk_points, aes(day, rentals, colour = group)) +\n  geom_point(size = 2, alpha = 0.85) +\n  labs(colour = \"Kiosk\")"}}

Riverside's dots run all the way across, one for every day. Downtown's row of dots breaks three times, on June 11, 18 and 25. That break is the whole problem this lesson solves: a plain data frame cannot tell you it has a gap, and a tsibble can.

=== step === concept
## A data frame that happens to have a time column

Before tsibble can help, look at what an ordinary data frame gives you for free, and what it does not.

Riverside Bike Share logs one row per kiosk per day: which kiosk, which date, how many rentals. Build that log for June and July 2024, 61 days at each kiosk, then look at its shape.

```r
# Build 61 days of rentals for two kiosks, then drop Downtown's 3 outage days
library(dplyr)

set.seed(614)
kiosk_dates <- seq(as.Date("2024-06-01"), as.Date("2024-07-31"), by = "day")
n <- length(kiosk_dates)
weekend_bump <- ifelse(weekdays(kiosk_dates) %in% c("Saturday", "Sunday"), 1.15, 1)
riverside_rentals <- round(140 * weekend_bump + rnorm(n, 0, 12))
downtown_rentals  <- round(95  * weekend_bump + rnorm(n, 0, 9))

bike_long <- bind_rows(
  data.frame(site = "Riverside", date = kiosk_dates, rentals = riverside_rentals),
  data.frame(site = "Downtown",  date = kiosk_dates, rentals = downtown_rentals)
)

outage_dates <- as.Date(c("2024-06-11", "2024-06-18", "2024-06-25"))
bike_long <- bike_long %>%
  filter(!(site == "Downtown" & date %in% outage_dates))

glimpse(bike_long)
#> Rows: 119
#> Columns: 3
#> $ site    <chr> "Riverside", "Riverside", "Riverside", "Riverside", "Riverside...
#> $ date    <date> 2024-06-01, 2024-06-02, 2024-06-03, 2024-06-04, 2024-06-05, 2...
#> $ rentals <dbl> 176, 174, 153, 107, 125, 119, 135, 163, 159, 131, 140, 146, 12...
```

That's 119 rows: 61 for Riverside and 58 for Downtown. Downtown is short because its payment terminal failed to restart on three Tuesdays and logged nothing those days.

But `bike_long` is a plain data frame. R treats `date` as just another column, exactly like `site` or `rentals`. Nothing about it says the rows are in time order, or that the 61 Riverside rows and 58 Downtown rows form two separate ongoing series. You could shuffle every row in `bike_long` and R would not object, even though shuffling a time series destroys the one thing that makes it a time series: the order the values arrived in.

The gap is easy to miss too. Nothing in `bike_long` flags that Downtown's log is short compared to Riverside's, or which dates are missing. You would have to go looking for it by hand. That is exactly what tsibble is built to catch.

=== step === concept
## The tsibble: an index and a key, and the trip back

A tsibble, short for tidy time series table, is a data frame that knows two extra things: which column is time, and which column separates one series from another.

Convert `bike_long` into a tsibble with `as_tsibble()`, telling it that `date` is the index, the time column, and `site` is the key, the column that separates Riverside's rows from Downtown's.

```r
# Mark date as the index and site as the key
library(tsibble)

bike_tsbl <- as_tsibble(bike_long, index = date, key = site)
bike_tsbl
#> # A tsibble: 119 x 3 [1D]
#> # Key:       site [2]
#>    site     date       rentals
#>    <chr>    <date>       <dbl>
#>  1 Downtown 2024-06-01     112
#>  2 Downtown 2024-06-02     115
#>  3 Downtown 2024-06-03      98
#>  4 Downtown 2024-06-04     105
#>  5 Downtown 2024-06-05     100
#>  6 Downtown 2024-06-06      97
#>  7 Downtown 2024-06-07      96
#>  8 Downtown 2024-06-08     115
#>  9 Downtown 2024-06-09      85
#> 10 Downtown 2024-06-10      96
#> # i 109 more rows
```

The header now reads `119 x 3 [1D]`, 119 rows and 3 columns, same as before, but `[1D]` is new: tsibble worked out that every kiosk-day is exactly 1 day apart, and it will use that fact from here on. `Key: site [2]` says the 119 rows split into 2 separate series by `site`.

Underneath, `bike_tsbl` is still an ordinary tibble; `as_tsibble()` only adds the index and key on top of it. You can always take them back off with `as_tibble()`.

```r
# Strip the tsibble class back down to a plain tibble
bike_plain <- as_tibble(bike_tsbl)
class(bike_plain)
#> [1] "tbl_df"     "tbl"        "data.frame"
```

That is exactly the class of a plain tibble: no index, no key, no interval. Whatever you do to a tsibble mid-analysis, the trip back to an ordinary data frame is one function call away.

=== step === concept
## Regular vs irregular time intervals

The `[1D]` you just saw is called the interval, and tsibble computes it straight from the index column: the gap between one kiosk-day and the next. Every kiosk-day in `bike_tsbl` sits exactly 1 day after the last one for that site, so the interval is a fixed 1 day, and tsibble calls that a regular tsibble.

Not every time-stamped log works that way. Riverside Bike Share also keeps a repair log: one row every time a technician actually visits a kiosk, whenever something breaks. There is no fixed schedule to it.

```r
# Four repair visits, logged whenever something actually broke
maint_log <- data.frame(
  visit = as.POSIXct(c("2024-06-05 09:15", "2024-06-05 14:40",
                        "2024-06-19 11:00", "2024-07-22 16:30"), tz = "UTC"),
  site = c("Riverside", "Downtown", "Riverside", "Downtown"),
  technician = c("A. Cole", "A. Cole", "B. Reyes", "B. Reyes")
)

maint_tsbl <- as_tsibble(maint_log, index = visit, regular = FALSE)
maint_tsbl
#> # A tsibble: 4 x 3 [!] <UTC>
#>   visit               site      technician
#>   <dttm>              <chr>     <chr>     
#> 1 2024-06-05 09:15:00 Riverside A. Cole   
#> 2 2024-06-05 14:40:00 Downtown  A. Cole   
#> 3 2024-06-19 11:00:00 Riverside B. Reyes  
#> 4 2024-07-22 16:30:00 Downtown  B. Reyes  
```

The header shows `[!]` instead of a day count. That `!` is tsibble's way of saying there is no fixed interval to check: one visit on June 5 at 09:15, another the same day at 14:40, then nothing again until June 19. `regular = FALSE` tells `as_tsibble()` not to even try computing one.

That distinction matters for what comes next. A regular tsibble like `bike_tsbl` has a fixed interval to check every row against, so tsibble can tell you exactly which dates are missing. An irregular tsibble like `maint_tsbl` has no fixed interval to check against, so the idea of a missing date does not even apply to it.

=== step === concept
## Implicit gaps: a missing row, not a missing value

Downtown's 3 outage days never became rows in `bike_long` at all. Nobody wrote `NA` for June 11; the row for June 11 simply does not exist. tsibble calls that an implicit gap: a gap the regular interval implies but the data does not show.

Because `bike_tsbl` is regular, with a fixed 1-day interval, tsibble can check every site's rows against that interval and tell you exactly where a day is missing. `has_gaps()` does the check, one row per key.

```r
# Check every kiosk for missing dates against the fixed 1-day interval
has_gaps(bike_tsbl)
#> # A tibble: 2 x 2
#>   site      .gaps
#>   <chr>     <lgl>
#> 1 Downtown  TRUE 
#> 2 Riverside FALSE

count_gaps(bike_tsbl)
#> # A tibble: 3 x 4
#>   site     .from      .to           .n
#>   <chr>    <date>     <date>     <int>
#> 1 Downtown 2024-06-11 2024-06-11     1
#> 2 Downtown 2024-06-18 2024-06-18     1
#> 3 Downtown 2024-06-25 2024-06-25     1
```

Downtown's `.gaps` reads `TRUE`, Riverside's reads `FALSE`. `count_gaps()` goes further and lists the missing dates themselves: three separate 1-day gaps, all Downtown, all in June, the 11th, the 18th and the 25th. Those are exactly the three Tuesdays its payment terminal failed to restart.

Plot both kiosks' daily rentals, one dot per day and colored by site, and the three gaps `count_gaps()` just listed show up as three missing dots in Downtown's row.

::widget chart-plotter {"data":[{"x":1,"y":176,"fill":"Riverside"},{"x":2,"y":174,"fill":"Riverside"},{"x":3,"y":153,"fill":"Riverside"},{"x":4,"y":107,"fill":"Riverside"},{"x":5,"y":125,"fill":"Riverside"},{"x":6,"y":119,"fill":"Riverside"},{"x":7,"y":135,"fill":"Riverside"},{"x":8,"y":163,"fill":"Riverside"},{"x":9,"y":159,"fill":"Riverside"},{"x":10,"y":131,"fill":"Riverside"},{"x":11,"y":140,"fill":"Riverside"},{"x":12,"y":146,"fill":"Riverside"},{"x":13,"y":129,"fill":"Riverside"},{"x":14,"y":136,"fill":"Riverside"},{"x":15,"y":162,"fill":"Riverside"},{"x":16,"y":133,"fill":"Riverside"},{"x":17,"y":152,"fill":"Riverside"},{"x":18,"y":129,"fill":"Riverside"},{"x":19,"y":131,"fill":"Riverside"},{"x":20,"y":143,"fill":"Riverside"},{"x":21,"y":135,"fill":"Riverside"},{"x":22,"y":154,"fill":"Riverside"},{"x":23,"y":177,"fill":"Riverside"},{"x":24,"y":126,"fill":"Riverside"},{"x":25,"y":125,"fill":"Riverside"},{"x":26,"y":146,"fill":"Riverside"},{"x":27,"y":107,"fill":"Riverside"},{"x":28,"y":145,"fill":"Riverside"},{"x":29,"y":175,"fill":"Riverside"},{"x":30,"y":173,"fill":"Riverside"},{"x":31,"y":155,"fill":"Riverside"},{"x":32,"y":128,"fill":"Riverside"},{"x":33,"y":149,"fill":"Riverside"},{"x":34,"y":129,"fill":"Riverside"},{"x":35,"y":138,"fill":"Riverside"},{"x":36,"y":132,"fill":"Riverside"},{"x":37,"y":156,"fill":"Riverside"},{"x":38,"y":144,"fill":"Riverside"},{"x":39,"y":131,"fill":"Riverside"},{"x":40,"y":150,"fill":"Riverside"},{"x":41,"y":144,"fill":"Riverside"},{"x":42,"y":133,"fill":"Riverside"},{"x":43,"y":156,"fill":"Riverside"},{"x":44,"y":154,"fill":"Riverside"},{"x":45,"y":132,"fill":"Riverside"},{"x":46,"y":166,"fill":"Riverside"},{"x":47,"y":134,"fill":"Riverside"},{"x":48,"y":143,"fill":"Riverside"},{"x":49,"y":153,"fill":"Riverside"},{"x":50,"y":160,"fill":"Riverside"},{"x":51,"y":161,"fill":"Riverside"},{"x":52,"y":141,"fill":"Riverside"},{"x":53,"y":144,"fill":"Riverside"},{"x":54,"y":128,"fill":"Riverside"},{"x":55,"y":141,"fill":"Riverside"},{"x":56,"y":130,"fill":"Riverside"},{"x":57,"y":156,"fill":"Riverside"},{"x":58,"y":182,"fill":"Riverside"},{"x":59,"y":122,"fill":"Riverside"},{"x":60,"y":148,"fill":"Riverside"},{"x":61,"y":135,"fill":"Riverside"},{"x":1,"y":112,"fill":"Downtown"},{"x":2,"y":115,"fill":"Downtown"},{"x":3,"y":98,"fill":"Downtown"},{"x":4,"y":105,"fill":"Downtown"},{"x":5,"y":100,"fill":"Downtown"},{"x":6,"y":97,"fill":"Downtown"},{"x":7,"y":96,"fill":"Downtown"},{"x":8,"y":115,"fill":"Downtown"},{"x":9,"y":85,"fill":"Downtown"},{"x":10,"y":96,"fill":"Downtown"},{"x":12,"y":88,"fill":"Downtown"},{"x":13,"y":90,"fill":"Downtown"},{"x":14,"y":79,"fill":"Downtown"},{"x":15,"y":102,"fill":"Downtown"},{"x":16,"y":107,"fill":"Downtown"},{"x":17,"y":85,"fill":"Downtown"},{"x":19,"y":100,"fill":"Downtown"},{"x":20,"y":97,"fill":"Downtown"},{"x":21,"y":88,"fill":"Downtown"},{"x":22,"y":109,"fill":"Downtown"},{"x":23,"y":118,"fill":"Downtown"},{"x":24,"y":90,"fill":"Downtown"},{"x":26,"y":111,"fill":"Downtown"},{"x":27,"y":105,"fill":"Downtown"},{"x":28,"y":94,"fill":"Downtown"},{"x":29,"y":116,"fill":"Downtown"},{"x":30,"y":98,"fill":"Downtown"},{"x":31,"y":92,"fill":"Downtown"},{"x":32,"y":97,"fill":"Downtown"},{"x":33,"y":91,"fill":"Downtown"},{"x":34,"y":88,"fill":"Downtown"},{"x":35,"y":103,"fill":"Downtown"},{"x":36,"y":114,"fill":"Downtown"},{"x":37,"y":101,"fill":"Downtown"},{"x":38,"y":92,"fill":"Downtown"},{"x":39,"y":93,"fill":"Downtown"},{"x":40,"y":82,"fill":"Downtown"},{"x":41,"y":101,"fill":"Downtown"},{"x":42,"y":102,"fill":"Downtown"},{"x":43,"y":107,"fill":"Downtown"},{"x":44,"y":100,"fill":"Downtown"},{"x":45,"y":91,"fill":"Downtown"},{"x":46,"y":105,"fill":"Downtown"},{"x":47,"y":84,"fill":"Downtown"},{"x":48,"y":100,"fill":"Downtown"},{"x":49,"y":92,"fill":"Downtown"},{"x":50,"y":100,"fill":"Downtown"},{"x":51,"y":118,"fill":"Downtown"},{"x":52,"y":100,"fill":"Downtown"},{"x":53,"y":112,"fill":"Downtown"},{"x":54,"y":105,"fill":"Downtown"},{"x":55,"y":86,"fill":"Downtown"},{"x":56,"y":102,"fill":"Downtown"},{"x":57,"y":118,"fill":"Downtown"},{"x":58,"y":109,"fill":"Downtown"},{"x":59,"y":94,"fill":"Downtown"},{"x":60,"y":101,"fill":"Downtown"},{"x":61,"y":92,"fill":"Downtown"}],"geoms":["point"],"x":"day","y":"rentals","code":{"point":"ggplot(kiosk_points, aes(day, rentals, colour = group)) +\n  geom_point(size = 2, alpha = 0.85) +\n  labs(colour = \"Kiosk\")"}}

Riverside's dots run unbroken across all 61 days. Downtown's stop exactly at June 11, 18 and 25, the same three dates `count_gaps()` found.

[KEY INSIGHT]
An implicit gap is a missing row, not a missing value. tsibble can only find it because `bike_tsbl` is regular: a fixed interval gives it something to check every date against. Take away the fixed interval, as with `maint_tsbl`, and the idea of a missing date no longer applies.

=== step === concept
## fill_gaps(): making the missing dates explicit

An implicit gap is easy to miss and awkward to work with: you cannot filter, plot or model a row that is not there. `fill_gaps()` fixes that by inserting a real row for every date `count_gaps()` found, with `NA` in every other column, turning the implicit gap into an explicit NA.

```r
# Insert Downtown's 3 missing dates as real rows, with rentals set to NA
bike_filled <- fill_gaps(bike_tsbl)
nrow(bike_filled)
#> [1] 122

bike_filled %>%
  filter(site == "Downtown", is.na(rentals))
#> # A tsibble: 3 x 3 [1D]
#> # Key:       site [1]
#>   site     date       rentals
#>   <chr>    <date>       <dbl>
#> 1 Downtown 2024-06-11      NA
#> 2 Downtown 2024-06-18      NA
#> 3 Downtown 2024-06-25      NA
```

`bike_filled` has 122 rows now: the original 119 plus the 3 Downtown rows `fill_gaps()` just added, one for June 11, 18 and 25. Their `rentals` value is `NA`, not 0.

That distinction matters. The terminal outage means Downtown's rental count for those three days is unknown, not zero. Riverside Bike Share may well have handed out bikes at Downtown that day; the terminal just never recorded them. Writing 0 would claim something you do not know to be true, and it would drag down any total or average that includes those days. `NA` says, correctly, that the value is unknown, and every function you run on `rentals` from here on has to decide, on purpose, what to do with it.

Downtown's row count before and after `fill_gaps()` shows the fix in one picture.

::widget chart-plotter {"data":[{"x":"Before fill_gaps()","y":58},{"x":"After fill_gaps()","y":61}],"geoms":["bar"],"x":"stage","y":"rows","code":{"bar":"ggplot(kiosk_rows, aes(stage, rows)) +\n  geom_col()"}}

`fill_gaps()` brought Downtown level with Riverside: both kiosks now have exactly 61 rows, one per day, June 1 through July 31.

[KEY INSIGHT]
`fill_gaps()` only ever inserts `NA`. It never guesses, averages or copies a neighbouring value. Deciding what to do with that `NA`, if anything, is a separate step you take on purpose, never something a gap-filling function should decide for you.

=== step === quiz
## Quick check: gap or NA?

Before `fill_gaps()` runs, Downtown's June 11 row is missing from `bike_tsbl` entirely, and `count_gaps()` lists it as a gap. What does `fill_gaps()` do to fix it, and what value does the new row get?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- fill_gaps() estimates what Downtown probably rented that day and writes that number into the new row. ::no
- The June 11 row already existed with rentals = NA before fill_gaps() ran; fill_gaps() only relabels it. ::no
- fill_gaps() inserts a new row for June 11 with rentals = NA, turning the implicit gap into an explicit missing value. ::ok Exactly right. The row did not exist before; fill_gaps() creates it and marks the value unknown, it never invents a number.
- fill_gaps() also removes June 11 from Riverside's series, so both kiosks skip the same dates. ::no fill_gaps() only ever adds rows to close gaps implied by the interval; it never removes rows from a series that already has none. Before it runs, June 11 is not a row at all for Downtown, an implicit gap. fill_gaps() inserts that row with rentals = NA, an explicit missing value, and never guesses a number to put there instead.

=== step === concept
## index_by(): collapsing daily rentals into monthly totals

With every date accounted for, roll the daily rows up into a coarser total. `index_by()` does for the time index what `group_by()` does for an ordinary column: it groups rows by whatever time expression you give it, ready for `summarise()`. `yearmonth(date)` turns each date into its calendar month.

```r
# Roll the 122 daily rows up into one total per kiosk per month
bike_monthly <- bike_filled %>%
  index_by(month = yearmonth(date)) %>%
  group_by(site) %>%
  summarise(total_rentals = sum(rentals, na.rm = TRUE), .groups = "drop")

bike_monthly
#> # A tsibble: 4 x 3 [1M]
#> # Key:       site [2]
#>   site         month total_rentals
#>   <chr>        <mth>         <dbl>
#> 1 Downtown  2024 Jun          2696
#> 2 Downtown  2024 Jul          3072
#> 3 Riverside 2024 Jun          4306
#> 4 Riverside 2024 Jul          4475
```

`bike_filled` had 122 daily rows across 2 kiosks and 2 months; `bike_monthly` collapses that down to 4 rows, one per kiosk per month.

`na.rm = TRUE` inside `sum()` is doing real work here. Without it, Downtown's June total would itself come back `NA`, because 3 of June's 30 rows for Downtown are the `NA`s `fill_gaps()` added. `na.rm = TRUE` tells `sum()` to add up the days it does know and skip the ones it does not.

Here is that same 4-row result as a report-ready table.

::widget styled-table {"cols":["site","month","total_rentals"],"rows":[["Downtown","2024 Jun",2696],["Downtown","2024 Jul",3072],["Riverside","2024 Jun",4306],["Riverside","2024 Jul",4475]],"formats":{"total_rentals":"comma"},"title":"Monthly rentals by kiosk","note":"na.rm = TRUE drops the 3 NA outage rows from the Downtown June total before summing."}

=== step === concept
## Why fable needs a complete, regular tsibble
::prose-only the visual is the printed R error and the successful fit that follows it

tsibble's gap-checking is not just tidiness. fable, the forecasting package that fits models directly on a tsibble, refuses to fit a model until every implied date is present.

Try fitting an ETS model, a common forecasting model, on Downtown's series before its gaps are filled.

```r
# Try to fit an ETS model on Downtown's series before its gaps are filled
library(fable)

downtown_gappy <- bike_tsbl %>% filter(site == "Downtown")
downtown_gappy %>% model(ETS(rentals))
#> # A mable: 1 x 2
#> # Key:     site [1]
#>   site     `ETS(rentals)`
#>   <chr>           <model>
#> 1 Downtown   <NULL model>
#> Warning message:
#> 1 error encountered for ETS(rentals)
#> [1] .data contains implicit gaps in time. You should check your data and convert implicit gaps into explicit missing values using `tsibble::fill_gaps()` if required.
```

`model()` prints its result as a mable, short for model table: one row per key, with a model column holding the fit. Here fable will not guess past a hole in the series, so it refuses outright and names the exact problem, implicit gaps, and the exact fix, `fill_gaps()`. The model column shows `<NULL model>`: no model was fit.

Fit the identical model on the filled series instead.

```r
# Fit the same ETS model on Downtown's series after its gaps are filled
downtown_filled <- bike_filled %>% filter(site == "Downtown")
downtown_filled %>% model(ETS(rentals))
#> # A mable: 1 x 2
#> # Key:     site [1]
#>   site     `ETS(rentals)`
#>   <chr>           <model>
#> 1 Downtown   <ETS(A,N,N)>
```

Same model, same call, no error this time: `ETS(A,N,N)`, a model fable was able to fit.

The reason is that fable places every forecast date by counting forward from the tsibble's own interval, day 62, day 63 and so on. If a day inside the series is silently missing, that count is off from the very first forecast date onward. `fill_gaps()` is not a formality before modelling; it is what keeps that day count accurate, from the very first forecast date onward.

[KEY INSIGHT]
fable places every forecast date by counting forward from the tsibble's own interval. A silently missing day throws that count off from the very first forecast date, so model() refuses to fit until fill_gaps() has made the interval complete.

=== step === quiz
## Quick check: the tsibble pipeline

Parkside Library logs daily visitor counts, with some days missing because the front desk scanner malfunctioned. You want monthly visitor totals with the gaps handled properly. Which order gets you there?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- index_by(yearmonth(date)) + summarise(), then as_tsibble(index = date), then fill_gaps(). ::no
- as_tsibble(index = date), then fill_gaps(), then index_by(yearmonth(date)) + summarise(na.rm = TRUE). ::ok Right order: mark the index and key, insert the missing dates as explicit NA, then aggregate with na.rm = TRUE so the NAs do not wreck the totals.
- fill_gaps(), then as_tsibble(index = date), then index_by(yearmonth(date)) + summarise(). ::no
- as_tsibble(index = date), then index_by(yearmonth(date)) + summarise(), then fill_gaps(). ::no fill_gaps() only works on a tsibble, so as_tsibble() has to come first. And it has to come before you aggregate, or the monthly totals would already be missing whatever fill_gaps() would have added. The order is always: mark the structure, fix the gaps, then roll up.

=== step === tryit
## Your turn: fill the gaps and aggregate

`bike_tsbl` still holds the 119-row tsibble, before its gaps are filled. Insert Downtown's missing dates with `fill_gaps()`, calling the result `bike_filled`. Then roll `bike_filled` up to one total per kiosk per month with `index_by()` and `summarise()`, remembering `na.rm = TRUE`.

```r
# bike_tsbl still holds the 119-row tsibble, before its gaps are filled.
# Insert the missing dates with fill_gaps(), calling the result bike_filled.
# Then roll bike_filled up to one total per kiosk per month with index_by()
# and summarise(total = sum(rentals, na.rm = TRUE)).
# Press Check when you have both.
```
::check {"regex": "fill_gaps[(]bike_tsbl[)][\\s\\S]*index_by[(][\\s\\S]*summarise[(]", "gate": true, "difficulty": "beginner", "ok": "Right: fill_gaps() first, so index_by() and summarise() have every date to work with.", "no": "Two calls, in order: fill_gaps(bike_tsbl) to close the gaps, then index_by(yearmonth(date)) followed by summarise(total = sum(rentals, na.rm = TRUE)) to roll the filled series up to monthly totals."}
::solution
```r
# Close the gaps, then roll the filled series up to monthly totals
bike_filled <- fill_gaps(bike_tsbl)

bike_monthly <- bike_filled %>%
  index_by(month = yearmonth(date)) %>%
  group_by(site) %>%
  summarise(total_rentals = sum(rentals, na.rm = TRUE), .groups = "drop")

bike_monthly
#> # A tsibble: 4 x 3 [1M]
#> # Key:       site [2]
#>   site         month total_rentals
#>   <chr>        <mth>         <dbl>
#> 1 Downtown  2024 Jun          2696
#> 2 Downtown  2024 Jul          3072
#> 3 Riverside 2024 Jun          4306
#> 4 Riverside 2024 Jul          4475
```

=== step === concept
## References

- [tsibble objects, Forecasting: Principles and Practice](https://otexts.com/fpp3/tsibbles.html) - Hyndman and Athanasopoulos (2021), 3rd edition. The index/key structure this lesson builds by hand.
- [tsibble package reference](https://tsibble.tidyverts.org/) - as_tsibble(), fill_gaps(), index_by() documentation.
- Wang, E., Cook, D., and Hyndman, R.J. (2020), "A New Tidy Data Structure to Support Exploration and Modeling of Temporal Data," Journal of Computational and Graphical Statistics. The design paper behind index and key.
- [fable package reference](https://fable.tidyverts.org/) - model()'s gap-checking behavior this lesson demonstrates.

=== step === complete
## Quick recap

`as_tsibble(index =, key =)` marks which column is time and which column separates one series from another. A regular interval turns a missing date into a gap tsibble can actually check for, with `has_gaps()` and `count_gaps()`. `fill_gaps()` turns that gap into an explicit `NA`, never a guessed number. `index_by()` and `summarise()` roll the daily rows up to a coarser total once `na.rm = TRUE` is told what to do with those `NA`s. And fable's `model()` only fits once every implied day is present, because that is how it places each forecast date correctly.

Next, you will read what a time series actually says before any model touches it: its level, trend, seasonal pattern, cycles and noise, off three real series.
