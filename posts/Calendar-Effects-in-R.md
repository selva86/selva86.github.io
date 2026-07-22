---
title: "Calendar Effects in R: Trading Days, Holidays, Time-Zone Traps"
slug: "Calendar-Effects-in-R"
description: "Fix calendar effects in R: adjust for trading days, build holiday regressors with lubridate, and avoid DST and time zone traps that corrupt forecasts."
keywords: "calendar effects in R, trading day adjustment R, holiday regressor R, lubridate time zones, DST R time series, business days R, TSLM calendar regressor, moving holidays R"
mathjax: false
webr: true
date: "2026-07-22"
curriculum_id: "TS2-1.5"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Calendar Effects"
sidebar_order: "49"
auto_link_terms: "calendar effects|calendar effect|trading day adjustment|trading days|holiday regressor|moving holidays|business days in R|daylight saving time in R|force_tz()|with_tz()|calendar regressor|day-of-week counts"
auto_link_case_sensitive: false
difficulty: "Intermediate"
---

<p class="lead">A calendar effect is a movement in a time series caused purely by how the calendar happens to fall, different numbers of working days per month, holidays that shift date each year, and clocks that jump forward and back, rather than by any real change in the activity you are measuring. Left alone, these effects get baked into your seasonal estimates and your forecasts inherit the error.</p>

## What is a calendar effect, and why does it wreck a forecast?

Here is the cleanest way to feel the problem. Build one year of daily activity with no trend, no seasonality, and no randomness at all: every weekday earns exactly 100, every weekend earns exactly 0. Then add the days up by month, which is what almost every reporting system does.

```r title="Build a zero-signal daily series"
library(lubridate)
library(dplyr)

# Every weekday earns exactly 100. Every weekend earns exactly 0.
days <- seq(as.Date("2024-01-01"), as.Date("2024-12-31"), by = "day")
daily <- tibble(
  date  = days,
  sales = ifelse(wday(days, week_start = 1) <= 5, 100, 0)
)

monthly <- daily |>
  group_by(month = floor_date(date, "month")) |>
  summarise(sales = sum(sales), .groups = "drop")

print(monthly, n = 12)
#> # A tibble: 12 × 2
#>    month      sales
#>    <date>     <dbl>
#>  1 2024-01-01  2300
#>  2 2024-02-01  2100
#>  3 2024-03-01  2100
#>  4 2024-04-01  2200
#>  5 2024-05-01  2300
#>  6 2024-06-01  2000
#>  7 2024-07-01  2300
#>  8 2024-08-01  2200
#>  9 2024-09-01  2100
#> 10 2024-10-01  2300
#> 11 2024-11-01  2100
#> 12 2024-12-01  2200
```

Walking through the code: `seq()` lays out all 366 days of 2024, `wday(days, week_start = 1)` numbers Monday as 1 through Sunday as 7 so the `<= 5` test picks out weekdays, and `floor_date(date, "month")` snaps every date back to the first of its month so `group_by()` can total them.

Now read the output. June says 2000 and January says 2300. Nothing about the business changed between those two months. June 2024 simply contained 20 weekdays and January contained 23. That gap is entirely an artefact of where the weekends happened to fall in 2024.

```r title="Measure the phantom swing"
range(monthly$sales)
#> [1] 2000 2300

diff(range(monthly$sales)) / mean(monthly$sales)
#> [1] 0.1374046
```

A 13.7% peak-to-trough swing, in a series that by construction contains no information whatsoever. If you handed this to `auto.arima()` or an ETS model, the two standard automatic forecasting methods, it would estimate a seasonal pattern from those numbers, and that pattern would be wrong the moment the calendar shifted in a later year.

![The three families of calendar effect feeding into a single distorted forecast](screenshots/Calendar-Effects-in-R-three-effects.webp)

*Figure 1: The three families of calendar effect and the single failure they all lead to.*

The diagram splits the problem into the three families you will meet. **Trading days** are the one you just saw: months contain different numbers of working days. **Moving holidays** are festivals like Easter or Diwali that land on a different date each year, so they migrate between months. **Clock shifts** are daylight saving transitions and time zone mistakes, which quietly change how many hours a "day" contains. The rest of this tutorial handles each in turn, and every technique here is plain lubridate and dplyr, so nothing depends on a specialist calendar package.

[KEY INSIGHT]
**The calendar is a measuring instrument, not part of your signal.** When a monthly total goes up, part of that rise is real activity and part is simply that the month offered more opportunities to trade. Seasonal adjustment cannot separate the two for you, because a fixed monthly seasonal factor assumes every January is the same, and calendar-wise no two Januarys are.

**Try it:** Work out which month of 2026 has the fewest weekdays and which has the most. Build the daily grid for 2026, count weekdays per month, then keep only the rows matching the minimum or the maximum.

```r title="Your turn: find the extreme months of 2026"
ex_days <- seq(as.Date("2026-01-01"), as.Date("2026-12-31"), by = "day")

ex_counts <- tibble(date = ex_days) |>
  group_by(ex_month = floor_date(date, "month")) |>
  summarise(ex_n = sum(wday(date, week_start = 1) <= 5), .groups = "drop")

# Now keep only the smallest and largest months:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extreme weekday months solution"
ex_days <- seq(as.Date("2026-01-01"), as.Date("2026-12-31"), by = "day")

ex_counts <- tibble(date = ex_days) |>
  group_by(ex_month = floor_date(date, "month")) |>
  summarise(ex_n = sum(wday(date, week_start = 1) <= 5), .groups = "drop")

ex_counts |> filter(ex_n == min(ex_n) | ex_n == max(ex_n))
#> # A tibble: 3 × 2
#>   ex_month    ex_n
#>   <date>     <int>
#> 1 2026-02-01    20
#> 2 2026-07-01    23
#> 3 2026-12-01    23
```

**Explanation:** February 2026 offers 20 weekdays while July and December offer 23. That is a 15% spread before a single customer has done anything, and it is why raw month-on-month comparisons mislead.

</details>

## How do you count trading days in R?

Everything in this tutorial is built on one function, so it is worth getting it exactly right. `wday()` turns a date into a day-of-week number, but its default numbering catches almost everyone out.

By default R follows the US convention where Sunday is day 1 and Saturday is day 7. That means the natural-looking test `wday(x) <= 5` selects Sunday through Thursday, which is wrong nearly everywhere. Passing `week_start = 1` switches to the ISO convention where Monday is 1 and Sunday is 7, and then `<= 5` really does mean Monday to Friday.

```r title="Check the wday numbering convention"
sample_days <- as.Date(c("2024-07-01", "2024-07-05", "2024-07-06", "2024-07-07"))

tibble(
  date    = sample_days,
  wday_no = wday(sample_days, week_start = 1),
  wday_lb = wday(sample_days, label = TRUE, week_start = 1),
  weekday = wday(sample_days, week_start = 1) <= 5
)
#> # A tibble: 4 × 4
#>   date       wday_no wday_lb weekday
#>   <date>       <dbl> <ord>   <lgl>  
#> 1 2024-07-01       1 Mon     TRUE   
#> 2 2024-07-05       5 Fri     TRUE   
#> 3 2024-07-06       6 Sat     FALSE  
#> 4 2024-07-07       7 Sun     FALSE  
```

Three columns, three jobs. `wday_no` is the raw number you compute with, `wday_lb` adds `label = TRUE` to get a readable ordered factor you can filter on by name, and `weekday` is the logical flag that does the actual work. Monday came back as 1, Sunday as 7, and `weekday` is `TRUE` for the two weekdays and `FALSE` for the weekend, exactly as intended. Always sanity-check this on dates whose weekday you already know before trusting a count built on top of it.

[WARNING]
**R numbers Sunday as day 1 unless you say otherwise.** Without week_start = 1, the filter wday(x) <= 5 quietly selects Sunday through Thursday, so your "working day" counts will be wrong by exactly one day per week and every downstream regressor inherits the error. Set the argument every time.

With the convention pinned down, counting weekdays per month is a two-line summarise. This is your first real calendar regressor, and the word is worth pinning down too: a regressor is simply an extra column you hand to a model as an explanatory variable. Here that column holds one number per month, the count of weekdays that month contained.

```r title="Count weekdays in every month"
weekday_counts <- daily |>
  mutate(is_weekday = wday(date, week_start = 1) <= 5) |>
  group_by(month = floor_date(date, "month")) |>
  summarise(n_weekday = sum(is_weekday), .groups = "drop")

print(weekday_counts, n = 12)
#> # A tibble: 12 × 2
#>    month      n_weekday
#>    <date>         <int>
#>  1 2024-01-01        23
#>  2 2024-02-01        21
#>  3 2024-03-01        21
#>  4 2024-04-01        22
#>  5 2024-05-01        23
#>  6 2024-06-01        20
#>  7 2024-07-01        23
#>  8 2024-08-01        22
#>  9 2024-09-01        21
#> 10 2024-10-01        23
#> 11 2024-11-01        21
#> 12 2024-12-01        22
```

The trick that makes this work is `sum()` on a logical vector. R treats `TRUE` as 1 and `FALSE` as 0, so summing the `is_weekday` flag counts how many days passed the test. That pattern, flag each day then sum the flag, is the engine behind every regressor in this tutorial.

Compare this column against the sales table from the previous section and they match perfectly: 23 weekdays gave 2300, 20 weekdays gave 2000. You have now explained 100% of that phantom seasonality with a single number per month.

**Try it:** Not all weekdays are equally common. Count how many Fridays fall in each month of 2025. Filter the daily grid down to Fridays, then count by month.

```r title="Your turn: count Fridays per month"
ex_fri <- tibble(date = seq(as.Date("2025-01-01"), as.Date("2025-12-31"), by = "day")) |>
  # keep only Fridays, then count by month
  # your code here

print(ex_fri, n = 12)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fridays per month solution"
ex_fri <- tibble(date = seq(as.Date("2025-01-01"), as.Date("2025-12-31"), by = "day")) |>
  filter(wday(date, label = TRUE, week_start = 1) == "Fri") |>
  count(ex_month = month(date, label = TRUE))

print(ex_fri, n = 12)
#> # A tibble: 12 × 2
#>    ex_month     n
#>    <ord>    <int>
#>  1 Jan          5
#>  2 Feb          4
#>  3 Mar          4
#>  4 Apr          4
#>  5 May          5
#>  6 Jun          4
#>  7 Jul          4
#>  8 Aug          5
#>  9 Sep          4
#> 10 Oct          5
#> 11 Nov          4
#> 12 Dec          4
```

**Explanation:** Because `label = TRUE` returns a factor, you can filter by the readable name `"Fri"` instead of remembering that Friday is number 5. Four months of 2025 contain five Fridays and eight contain four. If Friday is your biggest trading day, that difference alone moves monthly revenue by several percent, which is exactly the effect the seven-regressor approach later in this tutorial is designed to capture.

</details>

## How do you build a holiday calendar without a specialist package?

Weekends are easy because they repeat on a fixed weekly cycle. Holidays are harder, and they come in two flavours. Some sit on a fixed date every year, like Christmas on 25 December. Others are defined by a rule, like "the fourth Thursday of November". The rule-based ones are where people reach for a package, and they do not need to.

The trick is to notice that the *nth occurrence* of a weekday within a month is pure arithmetic on the day-of-month number. The first Monday of a month always falls on day 1 to 7, the second on day 8 to 14, and so on. So `ceiling(mday / 7)` tells you which occurrence you are looking at, whatever the weekday. The mirror-image test for the *last* occurrence asks whether another day of the same weekday would still fit inside the month. Adding 7 days to it would run past the end, so the test reduces to checking that the date sits in the final seven days of the month.

```r title="Label each day's position in its month"
cal <- tibble(date = seq(as.Date("2024-01-01"), as.Date("2026-12-31"), by = "day")) |>
  mutate(
    yr      = year(date),
    mo      = month(date),
    dy      = mday(date),
    dow     = wday(date, label = TRUE, week_start = 1),
    nth     = ceiling(dy / 7),                 # 1st, 2nd, 3rd ... of this weekday
    is_last = dy > days_in_month(date) - 7     # last of this weekday in the month
  )

cal |> filter(mo == 11, yr == 2024, dow == "Thu")
#> # A tibble: 4 × 7
#>   date          yr    mo    dy dow     nth is_last
#>   <date>     <dbl> <dbl> <int> <ord> <dbl> <lgl>  
#> 1 2024-11-07  2024    11     7 Thu       1 FALSE  
#> 2 2024-11-14  2024    11    14 Thu       2 FALSE  
#> 3 2024-11-21  2024    11    21 Thu       3 FALSE  
#> 4 2024-11-28  2024    11    28 Thu       4 TRUE   
```

The output shows all four Thursdays in November 2024 with their `nth` labels running 1, 2, 3, 4. The 28th is both the fourth Thursday and the last one, so `is_last` is `TRUE` there and `FALSE` everywhere else.

That single grid now answers every "nth weekday of the month" question by filtering, with no loops and no date arithmetic.

```r title="Extract rule-based holidays"
# Thanksgiving = 4th Thursday of November
cal |> filter(mo == 11, dow == "Thu", nth == 4) |> pull(date)
#> [1] "2024-11-28" "2025-11-27" "2026-11-26"

# Memorial Day = LAST Monday of May
cal |> filter(mo == 5, dow == "Mon", is_last) |> pull(date)
#> [1] "2024-05-27" "2025-05-26" "2026-05-25"
```

Two filters, six correct dates across three years. `pull()` just extracts the `date` column as a plain vector so the output is easy to read.

[TIP]
**The nth-weekday grid replaces an entire package.** Once you have the columns nth and is_last, every rule-based holiday in any country is a one-line filter: third Monday of January, second Sunday of May, last Friday of August. Build the grid once for your whole date range and reuse it.

Fixed-date holidays bring their own wrinkle. When Christmas or Independence Day lands on a weekend, most employers shift the day off to the nearest weekday. The convention in the United States is that a Saturday holiday is observed on the preceding Friday and a Sunday holiday on the following Monday.

```r title="Apply the observed-day shift rule"
observed <- function(d) {
  dow <- wday(d, week_start = 1)
  d + ifelse(dow == 6, -1L, ifelse(dow == 7, 1L, 0L))   # Sat -> Fri, Sun -> Mon
}

jul4 <- as.Date(c("2026-07-04", "2027-07-04", "2028-07-04"))

tibble(
  actual   = jul4,
  fell_on  = wday(jul4, label = TRUE, week_start = 1),
  observed = observed(jul4)
)
#> # A tibble: 3 × 3
#>   actual     fell_on observed  
#>   <date>     <ord>   <date>    
#> 1 2026-07-04 Sat     2026-07-03
#> 2 2027-07-04 Sun     2027-07-05
#> 3 2028-07-04 Tue     2028-07-04
```

The nested `ifelse()` adds minus one day for a Saturday, plus one day for a Sunday, and zero otherwise. Because `ifelse()` is vectorised, the function handles a whole column of dates at once.

The result covers all three cases in one table. 2026 shifts back to Friday the 3rd, 2027 shifts forward to Monday the 5th, and 2028 already falls on a Tuesday so nothing moves. Getting this right matters more than it looks, because when a holiday sits next to a month boundary the shift carries it across. 1 January 2028 falls on a Saturday, so the day off is taken on Friday 31 December 2027, which puts the lost trading day in a different month and a different year from the holiday itself.

Now assemble both halves into one reusable function.

```r title="Assemble a US federal holiday calendar"
us_holidays <- function(years) {
  g <- tibble(date = seq(make_date(min(years), 1, 1),
                         make_date(max(years), 12, 31), by = "day")) |>
    mutate(mo = month(date), dy = mday(date),
           dow = wday(date, label = TRUE, week_start = 1),
           nth = ceiling(dy / 7),
           is_last = dy > days_in_month(date) - 7)

  fixed <- g |> filter((mo == 1  & dy == 1)  | (mo == 6  & dy == 19) |
                       (mo == 7  & dy == 4)  | (mo == 11 & dy == 11) |
                       (mo == 12 & dy == 25))

  floating <- g |> filter(
    (mo == 1  & dow == "Mon" & nth == 3) |   # MLK Day
    (mo == 2  & dow == "Mon" & nth == 3) |   # Presidents Day
    (mo == 5  & dow == "Mon" & is_last)  |   # Memorial Day
    (mo == 9  & dow == "Mon" & nth == 1) |   # Labor Day
    (mo == 10 & dow == "Mon" & nth == 2) |   # Columbus Day
    (mo == 11 & dow == "Thu" & nth == 4)     # Thanksgiving
  )

  sort(unique(c(observed(fixed$date), floating$date)))
}

us_holidays(2025)
#>  [1] "2025-01-01" "2025-01-20" "2025-02-17" "2025-05-26" "2025-06-19"
#>  [6] "2025-07-04" "2025-09-01" "2025-10-13" "2025-11-11" "2025-11-27"
#> [11] "2025-12-25"
```

The function rebuilds the grid for whatever years you ask for, pulls the five fixed dates and pushes them through `observed()`, pulls the six rule-based ones, then `sort(unique(...))` merges the two vectors and removes any overlap.

Eleven dates come back for 2025, which is the correct count for US federal holidays. Spot-check a couple: 20 January is the third Monday, and 26 May is the last Monday of May. You now have a holiday calendar you fully control and can adapt to any country by editing two filters.

Moving festivals are the last piece, and Easter is the one that matters most for European and Latin American series. Its date is set by a lunar rule, so it can land anywhere between 22 March and 25 April. The standard closed-form solution is the anonymous Gregorian computus, and it is plain arithmetic.

```r title="Compute Easter Sunday for any year"
easter_date <- function(year) {
  a <- year %% 19;  b <- year %/% 100;  cc <- year %% 100
  d <- b %/% 4;     e <- b %% 4;        f <- (b + 8) %/% 25
  g <- (b - f + 1) %/% 3
  h <- (19 * a + b - d - g + 15) %% 30
  i <- cc %/% 4;    k <- cc %% 4
  l <- (32 + 2 * e + 2 * i - h - k) %% 7
  m <- (a + 11 * h + 22 * l) %/% 451
  make_date(year, (h + l - 7 * m + 114) %/% 31,
                  ((h + l - 7 * m + 114) %% 31) + 1)
}

easter <- easter_date(2024:2028)

tibble(year = 2024:2028, easter = easter,
       month = month(easter, label = TRUE), dow = wday(easter, label = TRUE))
#> # A tibble: 5 × 4
#>    year easter     month dow  
#>   <int> <date>     <ord> <ord>
#> 1  2024 2024-03-31 Mar   Sun  
#> 2  2025 2025-04-20 Apr   Sun  
#> 3  2026 2026-04-05 Apr   Sun  
#> 4  2027 2027-03-28 Mar   Sun  
#> 5  2028 2028-04-16 Apr   Sun  
```

You do not need to follow the modular arithmetic, it is a published algorithm and every operator here is `%%` (remainder) or `%/%` (integer division) applied to whole vectors at once. Feed it a vector of years and it returns a vector of dates.

The `dow` column returning Sunday five times out of five is your correctness check, since Easter is Sunday by definition. Look at what the `month` column does though: 2024 and 2027 put Easter in March, the other three years put it in April. For a monthly retail series that single fact moves an entire holiday's worth of trade between two months, and no fixed seasonal factor can absorb it.

For US financial data specifically, exchange calendars differ from federal ones. The `timeDate` package ships them, and comparing it against what you just built is instructive. This block needs a local R session rather than the browser.

```r-static title="Compare against the NYSE exchange calendar"
# Run this locally in RStudio: timeDate is not available in the browser
library(timeDate)

nyse <- as.Date(holidayNYSE(2025))
nyse
#>  [1] "2025-01-01" "2025-01-20" "2025-02-17" "2025-04-18" "2025-05-26"
#>  [6] "2025-06-19" "2025-07-04" "2025-09-01" "2025-11-27" "2025-12-25"

length(nyse)
#> [1] 10
```

Compare that list against your federal one and two differences jump out. The NYSE closes on Good Friday (18 April 2025), which is not a federal holiday at all. It stays open on Columbus Day and Veterans Day, which are federal holidays. Ten dates against eleven, and only nine of them overlap.

[NOTE]
**Which calendar is correct is a business question, not a technical one.** A payroll series follows federal holidays, an equities series follows the exchange calendar, and a European retail series follows neither. Pick the calendar that matches when your business actually stops, and write it down, because the next person to touch the model will assume something different.

**Try it:** Labor Day in the United States is the first Monday of September. Use the `nth` trick to find it for 2025, 2026 and 2027.

```r title="Your turn: find Labor Day"
ex_grid <- tibble(date = seq(as.Date("2025-01-01"), as.Date("2027-12-31"), by = "day")) |>
  mutate(ex_nth = ceiling(mday(date) / 7))

# Filter to September, Mondays, first occurrence, then pull the dates:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Labor Day solution"
ex_grid <- tibble(date = seq(as.Date("2025-01-01"), as.Date("2027-12-31"), by = "day")) |>
  mutate(ex_nth = ceiling(mday(date) / 7))

ex_grid |>
  filter(month(date) == 9,
         wday(date, label = TRUE, week_start = 1) == "Mon",
         ex_nth == 1) |>
  pull(date)
#> [1] "2025-09-01" "2026-09-07" "2027-09-06"
```

**Explanation:** Three filters stack up to define the rule exactly as it is written in law: September, Monday, first occurrence. Note how far the date moves, from the 1st in 2025 to the 7th in 2026. That six-day drift is enough to shift a long weekend's trade out of one week and into another.

</details>

## How do you feed the calendar into a forecasting model?

You now have the ingredients. The next step is turning them into a column your model can use, which means counting trading days properly (weekdays that are not holidays) and attaching that count to a time series object.

The workflow below is the one worth memorising, because the last step is where most people come unstuck.

![Building a calendar regressor, from daily flags through to future values](screenshots/Calendar-Effects-in-R-regressor-workflow.webp)

*Figure 2: Turning a raw calendar into a model regressor, and the future-values step people forget.*

Start by flagging every day in a long span, well past the end of your data, then aggregating to the series frequency. Building the calendar out into the future costs nothing now and saves you at forecast time.

```r title="Count trading days per month"
library(tsibble)

hols <- us_holidays(2019:2026)

trading <- tibble(date = seq(as.Date("2019-01-01"), as.Date("2026-12-31"), by = "day")) |>
  mutate(is_trading = wday(date, week_start = 1) <= 5 & !(date %in% hols))

td_month <- trading |>
  group_by(month = yearmonth(date)) |>
  summarise(n_trading = sum(is_trading), .groups = "drop")

td_month |> filter(year(month) == 2025) |> print(n = 12)
#> # A tibble: 12 × 2
#>       month n_trading
#>       <mth>     <int>
#>  1 2025 Jan        21
#>  2 2025 Feb        19
#>  3 2025 Mar        21
#>  4 2025 Apr        22
#>  5 2025 May        21
#>  6 2025 Jun        20
#>  7 2025 Jul        22
#>  8 2025 Aug        21
#>  9 2025 Sep        21
#> 10 2025 Oct        22
#> 11 2025 Nov        18
#> 12 2025 Dec        22
```

Two things changed from the earlier weekday count. The `is_trading` flag now has a second condition, `!(date %in% hols)`, which excludes any date appearing in the holiday vector. And `yearmonth()` from tsibble replaces `floor_date()`, producing the monthly index type that tsibble and fable expect.

The 2025 numbers run from 18 to 22. November is the low month because it loses Veterans Day and Thanksgiving on top of having only 20 weekdays. That is a 22% spread between the best and worst month of a single year, which no seasonal factor fitted on other years will reproduce.

Next, build a monthly series and attach the regressor. The simulated series below has a real upward trend and a genuine December uplift, plus the trading-day effect, so there is something for the model to actually separate.

```r title="Build a monthly tsibble with the regressor"
library(fable)

set.seed(2024)
sales_daily <- trading |>
  filter(date <= as.Date("2025-12-31")) |>
  mutate(
    trend_part = 0.02 * as.numeric(date - as.Date("2019-01-01")),
    dec_boost  = ifelse(month(date) == 12, 30, 0),
    sales      = is_trading * (100 + trend_part + dec_boost + rnorm(n(), 0, 8))
  )

sales_month <- sales_daily |>
  group_by(month = yearmonth(date)) |>
  summarise(sales = round(sum(sales)), .groups = "drop") |>
  left_join(td_month, by = "month") |>
  as_tsibble(index = month)

head(sales_month, 5)
#> # A tsibble: 5 x 3 [1M]
#>      month sales n_trading
#>      <mth> <dbl>     <int>
#> 1 2019 Jan  2039        21
#> 2 2019 Feb  1921        19
#> 3 2019 Mar  2109        21
#> 4 2019 Apr  2241        22
#> 5 2019 May  2226        22
```

Reading the construction: multiplying by `is_trading` zeroes out closed days, `trend_part` adds a slow rise of about 0.02 per day, `dec_boost` adds a genuine December lift, and `rnorm()` supplies noise. The `left_join()` then glues the regressor column on, and `as_tsibble(index = month)` declares which column is time.

The printed header `[1M]` confirms tsibble recognised a monthly series. Each row now carries both the value and the number of trading days that produced it, which is exactly what a regression model needs.

Now the payoff. Fit two models on the same data, one that only knows about trend and month-of-year, and one that also sees the trading-day count.

```r title="Compare a plain model against a calendar model"
fit <- sales_month |>
  model(
    plain    = TSLM(sales ~ trend() + season()),
    calendar = TSLM(sales ~ trend() + season() + n_trading)
  )

glance(fit) |> select(.model, r_squared, sigma2, AICc)
#> # A tibble: 2 × 4
#>   .model   r_squared sigma2  AICc
#>   <chr>        <dbl>  <dbl> <dbl>
#> 1 plain        0.932 13098.  816.
#> 2 calendar     0.991  1738.  648.
```

`TSLM()` is fable's time series linear model. `trend()` inserts a straight-line time index and `season()` inserts eleven monthly dummy variables, so `plain` is the standard textbook specification. The `calendar` model is identical plus one extra column. `glance()` then pulls out the fit statistics for both.

The difference is not marginal. Residual variance (`sigma2`) falls from 13098 to 1738, a factor of 7.5. AICc is a model-comparison score that rewards fit and penalises extra parameters, and lower is better, so a drop of 168 points is a large win rather than a rounding difference. One column did all of that, because the eleven seasonal dummies were trying to capture something that genuinely changes from year to year, and a fixed dummy per month cannot.

```r title="Inspect the calendar model coefficients"
fit |> select(calendar) |> report()
#> Series: sales 
#> Model: TSLM 
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -90.488 -26.612   1.523  23.639 101.088 
#> 
#> Coefficients:
#>                 Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)    -641.3724   125.6164  -5.106 2.72e-06 ***
#> trend()          12.7537     0.1895  67.286  < 2e-16 ***
#> season()year2    -7.3186    23.6224  -0.310   0.7576    
#> season()year3   -19.7535    24.2572  -0.814   0.4182    
#> season()year4   -33.9336    23.3546  -1.453   0.1507    
#> season()year5   -30.2566    22.7192  -1.332   0.1873    
#> season()year6   -23.5774    22.3229  -1.056   0.2945    
#> season()year7   -25.5267    22.9174  -1.114   0.2692    
#> season()year8   -28.6650    24.2905  -1.180   0.2420    
#> season()year9   -40.9352    22.3543  -1.831   0.0713 .  
#> season()year10   -9.5966    22.7705  -0.421   0.6747    
#> season()year11  -34.4362    23.4245  -1.470   0.1460    
#> season()year12  621.4674    22.8021  27.255  < 2e-16 ***
#> n_trading       131.3384     6.0908  21.563  < 2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 41.69 on 70 degrees of freedom
#> Multiple R-squared: 0.9911,	Adjusted R-squared: 0.9895
#> F-statistic: 602.1 on 13 and 70 DF, p-value: < 2.22e-16
```

This is the most informative output in the tutorial, so read it carefully. `n_trading` has an estimate of 131.34 with a t value of 21.6, meaning each extra trading day is worth about 131 units of sales and the evidence for it is overwhelming.

Now look at the seasonal dummies. Months 2 through 11 are all statistically indistinguishable from zero, with p-values from 0.07 to 0.76. Only `season()year12` survives, at 621, which is the genuine December uplift that was built into the data. The model has correctly separated the two: real seasonality lives in the December dummy, and the calendar noise lives in `n_trading`.

[KEY INSIGHT]
**Seasonality and calendar effects are two different jobs, and one cannot do the other.** A seasonal dummy says "Januarys are like this", which assumes every January is interchangeable. A trading-day regressor says "this particular January had 23 working days". Give the model both and each one handles the pattern it is actually shaped for.

Here is the step the workflow diagram flagged at its end. A model with an external regressor cannot forecast from a horizon alone, because it has no idea what `n_trading` will be next March. Ask for six steps ahead and it stops.

```r title="Forecasting without regressors fails"
msg <- tryCatch(forecast(fit |> select(calendar), h = 6),
                error = function(e) conditionMessage(e))

cat(grep("not found|Unable to compute", strsplit(msg, "\n")[[1]], value = TRUE), sep = "\n")
#> ! object 'n_trading' not found
#>   Unable to compute required variables from provided `new_data`.
```

`tryCatch()` catches the error instead of halting, and `grep()` picks out the two informative lines from fable's message. The complaint is precise: it needs `n_trading` and cannot invent it.

This is the single most common stumble when moving from `TSLM(y ~ trend() + season())` to a model with real predictors, and the error message is honest about the cause. The fix is to supply the future calendar, which you already built.

```r title="Build future regressor values"
future_cal <- td_month |>
  filter(month > yearmonth("2025 Dec"), month <= yearmonth("2026 Jun")) |>
  as_tsibble(index = month)

future_cal
#> # A tsibble: 6 x 2 [1M]
#>      month n_trading
#>      <mth>     <int>
#> 1 2026 Jan        20
#> 2 2026 Feb        19
#> 3 2026 Mar        22
#> 4 2026 Apr        22
#> 5 2026 May        20
#> 6 2026 Jun        21
```

Because `td_month` was built all the way to the end of 2026, the future values are just a filter away. This is why the earlier advice to extend the calendar past your data pays off.

Notice that these are not forecasts. The number of trading days in March 2026 is a known fact, fixed by arithmetic. That certainty is precisely what makes calendar regressors so useful: unlike most predictors, you never have to forecast them first.

```r title="Forecast with future calendar values"
fc <- fit |> select(calendar) |> forecast(new_data = future_cal)

fc |> as_tibble() |> select(month, n_trading, .mean)
#> # A tibble: 6 × 3
#>      month n_trading .mean
#>      <mth>     <int> <dbl>
#> 1 2026 Jan        20 3069.
#> 2 2026 Feb        19 2944.
#> 3 2026 Mar        22 3338.
#> 4 2026 Apr        22 3336.
#> 5 2026 May        20 3090.
#> 6 2026 Jun        21 3241.
```

Swapping `h = 6` for `new_data = future_cal` gives fable both the horizon and the regressor values in one object, so it forecasts happily.

Look at the relationship between the two columns. February is forecast lowest at 2944 with 19 trading days, March and April highest at around 3337 with 22. The forecast is now tracking the actual shape of 2026's calendar rather than assuming next February will resemble an average February.

**Try it:** Fit a model with `n_trading` on `sales_month` and read off just that coefficient. Use `tidy()` to get a tidy coefficient table, then filter to the term you want.

```r title="Your turn: extract the trading-day coefficient"
ex_fit <- sales_month |> model(ex_m = TSLM(sales ~ trend() + season() + n_trading))

# Get a coefficient table and keep only the n_trading row:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Trading-day coefficient solution"
ex_fit <- sales_month |> model(ex_m = TSLM(sales ~ trend() + season() + n_trading))

tidy(ex_fit) |> filter(term == "n_trading") |> select(term, estimate)
#> # A tibble: 1 × 2
#>   term      estimate
#>   <chr>        <dbl>
#> 1 n_trading     131.
```

**Explanation:** `tidy()` turns a fitted model into a data frame with one row per coefficient, which is far easier to filter than reading a printed summary. The 131 matches the `report()` output above, and it has a directly useful business reading: gaining one trading day is worth roughly 131 units.

</details>

## Why do seven day counts beat one trading-day total?

A single trading-day count assumes every working day is worth the same. For an office that is roughly true. For a restaurant, a cinema or a supermarket it is badly false, because Saturday might do triple Monday's business while Sunday sits somewhere in between.

The fix, which comes from the official seasonal adjustment literature, is to replace one count with seven: how many Mondays, how many Tuesdays, and so on. Building them is a `count()` plus a reshape.

```r title="Count each weekday separately"
library(tidyr)

retail <- tibble(date = seq(as.Date("2016-01-01"), as.Date("2025-12-31"), by = "day")) |>
  mutate(dow = wday(date, label = TRUE, week_start = 1))

dow_counts <- retail |>
  count(month = yearmonth(date), dow) |>
  pivot_wider(names_from = dow, values_from = n, values_fill = 0)

head(dow_counts, 4)
#> # A tibble: 4 × 8
#>      month   Mon   Tue   Wed   Thu   Fri   Sat   Sun
#>      <mth> <int> <int> <int> <int> <int> <int> <int>
#> 1 2016 Jan     4     4     4     4     5     5     5
#> 2 2016 Feb     5     4     4     4     4     4     4
#> 3 2016 Mar     4     5     5     5     4     4     4
#> 4 2016 Apr     4     4     4     4     5     5     4
```

`count()` gives one row per month-weekday combination, and `pivot_wider()` spreads the `dow` values into seven columns with the counts as values. Ten years of history gives the model enough variation to work with, which matters here more than usual.

Every month has either four or five of each weekday, and which weekdays get the extra one rotates. January 2016 had five Fridays, Saturdays and Sundays; February 2016 had five Mondays instead. For a weekend-heavy business those two months are not comparable at all.

Now build a series where weekends genuinely dominate, and pit one regressor against seven.

```r title="One total against seven day counts"
set.seed(77)
weights <- c(Mon = 80, Tue = 80, Wed = 85, Thu = 95, Fri = 120, Sat = 260, Sun = 180)

retail_month <- retail |>
  mutate(sales = weights[as.character(dow)] + rnorm(n(), 0, 6)) |>
  group_by(month = yearmonth(date)) |>
  summarise(sales = round(sum(sales)), .groups = "drop") |>
  left_join(dow_counts, by = "month") |>
  mutate(n_days = Mon + Tue + Wed + Thu + Fri + Sat + Sun) |>
  as_tsibble(index = month)

fit2 <- retail_month |>
  model(
    total_days = TSLM(sales ~ n_days),
    seven_days = TSLM(sales ~ Mon + Tue + Wed + Thu + Fri + Sat + Sun - 1)
  )

glance(fit2) |> select(.model, sigma2, AICc)
#> # A tibble: 2 × 3
#>   .model     sigma2  AICc
#>   <chr>       <dbl> <dbl>
#> 1 total_days 14078. 1150.
#> 2 seven_days  1053.  845.
```

The `weights` vector sets each weekday's true daily value, and indexing it by `as.character(dow)` looks up the right one for every date. The `- 1` in the second formula drops the intercept, which is necessary because the seven counts already add up to the length of the month and would otherwise be perfectly collinear with it.

Residual variance falls from 14078 to 1053, a factor of 13, and AICc drops by 305 points. The total-days model knew February was short but had no way to know whether it was short of Saturdays or short of Tuesdays, and for this business those are very different things.

```r title="Recover the value of each weekday"
tidy(fit2) |> filter(.model == "seven_days") |>
  mutate(truth = as.numeric(weights[term])) |>
  select(term, estimate, std.error, truth)
#> # A tibble: 7 × 4
#>   term  estimate std.error truth
#>   <chr>    <dbl>     <dbl> <dbl>
#> 1 Mon       88.1      8.12    80
#> 2 Tue       77.1      8.38    80
#> 3 Wed       79.8      8.34    85
#> 4 Thu       98.9      8.01    95
#> 5 Fri      116.       8.06   120
#> 6 Sat      266.       8.12   260
#> 7 Sun      174.       8.13   180
```

Adding a `truth` column by looking up the same `weights` vector lets you grade the model directly, which you can only do with simulated data but which is the fastest way to build trust in a technique.

Every estimate lands within roughly one standard error of the value used to generate the data. Saturday comes back at 266 against a truth of 260, Monday at 88 against 80. The model has recovered the entire weekly profile from nothing but monthly totals and day counts, which is a genuinely surprising amount of information to extract from twelve numbers a year.

[WARNING]
**Seven day-count regressors need a long history to behave.** The counts only ever take the values 4 or 5, so they barely vary and they are close to collinear with month length. On three years of monthly data the coefficients swing wildly. This example used ten years. If you have less than about five, use a single trading-day count or group the days into weekday and weekend.

**Try it:** Confirm the weekend story by ranking the coefficients. Sort the seven-day model's estimates from largest to smallest and show the top three.

```r title="Your turn: rank the weekday coefficients"
ex_fit5 <- retail_month |> model(ex_m5 = TSLM(sales ~ Mon+Tue+Wed+Thu+Fri+Sat+Sun - 1))

# Sort the coefficients from largest to smallest and take the top 3:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ranked weekday coefficients solution"
ex_fit5 <- retail_month |> model(ex_m5 = TSLM(sales ~ Mon+Tue+Wed+Thu+Fri+Sat+Sun - 1))

tidy(ex_fit5) |> arrange(desc(estimate)) |> select(term, estimate) |> head(3)
#> # A tibble: 3 × 2
#>   term  estimate
#>   <chr>    <dbl>
#> 1 Sat       266.
#> 2 Sun       174.
#> 3 Fri       116.
```

**Explanation:** `arrange(desc(estimate))` sorts largest first. The weekend plus Friday take the top three slots, and Saturday alone is worth about three Mondays. A month that happens to contain five Saturdays instead of four gains roughly 266 units for reasons that have nothing to do with demand.

</details>

## What breaks when the clock changes?

Everything so far worked in whole days, where a date is unambiguous. Move to hourly or sub-daily data and a new class of bug appears, because the relationship between "clock reading" and "moment in time" stops being one-to-one twice a year.

Two lubridate functions handle the conversion between them, and they do opposite things. Mixing them up is the most common date-time bug in R.

![Deciding between force_tz and with_tz](screenshots/Calendar-Effects-in-R-tz-decision.webp)

*Figure 3: Choosing between force_tz() and with_tz().*

The distinction is worth stating plainly before you see the code. A timestamp carries two pieces of information: an instant (a specific moment in the history of the universe) and a clock reading (the digits a local wall clock would show). `force_tz()` keeps the digits and changes the instant. `with_tz()` keeps the instant and changes the digits.

```r title="force_tz against with_tz"
t <- ymd_hms("2024-06-01 09:00:00", tz = "UTC")
t
#> [1] "2024-06-01 09:00:00 UTC"

force_tz(t, "America/New_York")   # keep the digits, move the instant
#> [1] "2024-06-01 09:00:00 EDT"

with_tz(t,  "America/New_York")   # keep the instant, move the digits
#> [1] "2024-06-01 05:00:00 EDT"
```

Same input, two very different outputs. `force_tz()` still reads 09:00 but it is now a New York morning, four hours later in real time than the UTC original. `with_tz()` still refers to the identical moment, but expressed in New York it reads 05:00.

The practical rule: use `force_tz()` when your data arrived as naive local timestamps that R wrongly labelled UTC on import, and use `with_tz()` when you have correct instants and want to display or aggregate them in someone's local time.

[KEY INSIGHT]
**A timestamp is an instant plus a label, and the two can be changed independently.** Every time zone bug in R comes down to changing the one you did not mean to change. Before writing either function, finish this sentence out loud: "the digits are right and the label is wrong" (use force_tz) or "the instant is right and I want to see it elsewhere" (use with_tz).

Now the part that silently destroys data. On the spring-forward night the local clock jumps straight from 02:00 to 03:00, so 02:30 never existed.

```r title="A clock reading that never happened"
ymd_hms("2024-03-10 02:30:00", tz = "America/New_York")
#> [1] NA
#> Warning message:
#>  1 failed to parse. 
```

Rather than inventing a plausible instant, lubridate returns `NA` and warns. That is the right behaviour, but a warning in the middle of a long import script is easy to miss, and you end up with a hole in the series that surfaces much later as a mysterious gap.

The autumn transition creates the opposite problem. When the clock falls back, 01:30 happens twice, once on daylight time and once an hour later on standard time.

```r title="A clock reading that happened twice"
amb <- ymd_hms("2024-11-03 01:30:00", tz = "America/New_York")
amb
#> [1] "2024-11-03 01:30:00 EST"

with_tz(amb, "UTC")
#> [1] "2024-11-03 06:30:00 UTC"
```

No warning at all this time. Lubridate silently resolved the ambiguity by picking the standard-time occurrence, shown by the `EST` label and confirmed by the 06:30 UTC conversion (the daylight-time reading would have been 05:30 UTC).

That is a full hour of error, applied silently, on one day a year. If your data source recorded the first occurrence instead, every value in that hour is now attributed to the wrong hour.

Arithmetic has its own version of the trap. Adding "a day" can mean two different things, and lubridate makes you choose.

```r title="Calendar days against exact durations"
start <- ymd_hms("2024-03-09 12:00:00", tz = "America/New_York")

start + days(1)    # calendar period: same clock reading tomorrow
#> [1] "2024-03-10 12:00:00 EDT"

start + ddays(1)   # exact duration: 86400 seconds later
#> [1] "2024-03-10 13:00:00 EDT"
```

`days(1)` is a *period*, meaning "the same time tomorrow", so it lands on noon regardless of what the clock did overnight. `ddays(1)` is a *duration*, meaning exactly 86400 seconds, and because 10 March lost an hour it overshoots to 13:00.

Neither is wrong. Business logic ("the shop opens at noon tomorrow") wants `days(1)`. Physical measurement ("24 hours of exposure") wants `ddays(1)`. Choosing by accident is what causes trouble, and the default habit of writing `+ 86400` always gives you the duration behaviour whether you wanted it or not.

The consequence for aggregation is that days are not all the same length. Generate hourly timestamps across the spring transition and count them.

```r title="The 23-hour day"
hourly <- tibble(
  ts = seq(ymd_hms("2024-03-08 00:00:00", tz = "America/New_York"),
           ymd_hms("2024-03-12 23:00:00", tz = "America/New_York"),
           by = "hour")
)

hourly |> count(day = as_date(ts))
#> # A tibble: 5 × 2
#>   day            n
#>   <date>     <int>
#> 1 2024-03-08    24
#> 2 2024-03-09    24
#> 3 2024-03-10    23
#> 4 2024-03-11    24
#> 5 2024-03-12    24
```

`seq()` steps hour by hour through local time and `count()` tallies how many landed on each date. Ten March got 23 rows because the 02:00 hour does not exist in that zone.

The autumn transition does the reverse.

```r title="The 25-hour day"
fall <- tibble(
  ts = seq(ymd_hms("2024-11-02 00:00:00", tz = "America/New_York"),
           ymd_hms("2024-11-04 23:00:00", tz = "America/New_York"),
           by = "hour")
)

fall |> count(day = as_date(ts))
#> # A tibble: 3 × 2
#>   day            n
#>   <date>     <int>
#> 1 2024-11-02    24
#> 2 2024-11-03    25
#> 3 2024-11-04    24
```

Twenty-five hours on 3 November. Now think about what a daily `sum()` does to that: energy load, web traffic and call volumes all get a free 4% bump on one day each autumn and a 4% dip each spring, purely from clock arithmetic. Every anomaly detector you run will flag both.

[WARNING]
**Daily sums of hourly data are wrong twice a year.** One day has 23 observations and another has 25, so totals are inflated and deflated by about 4% with no change in activity. Either aggregate with mean() instead of sum(), or record the observation count alongside the total so you can normalise later.

**Try it:** Confirm the effect on a different year. Count the hourly observations per day between 8 and 10 March 2025 in New York, and find the short day.

```r title="Your turn: find the 23-hour day of 2025"
ex_hours <- tibble(
  ex_ts = seq(ymd_hms("2025-03-08 00:00:00", tz = "America/New_York"),
              ymd_hms("2025-03-10 23:00:00", tz = "America/New_York"), by = "hour")
)

# Count rows per local date:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Short day of 2025 solution"
ex_hours <- tibble(
  ex_ts = seq(ymd_hms("2025-03-08 00:00:00", tz = "America/New_York"),
              ymd_hms("2025-03-10 23:00:00", tz = "America/New_York"), by = "hour")
)

ex_hours |> count(ex_day = as_date(ex_ts))
#> # A tibble: 3 × 2
#>   ex_day         n
#>   <date>     <int>
#> 1 2025-03-08    24
#> 2 2025-03-09    23
#> 3 2025-03-10    24
```

**Explanation:** In 2025 the transition fell on 9 March rather than 10 March, because the rule is "the second Sunday in March" and that is a rule-based date exactly like the holidays earlier. The short day moves every year, so hard-coding last year's date will not protect you.

</details>

## Which time zone should your time series live in?

The previous section showed what goes wrong. This one gives you the policy that prevents it, and it comes down to three decisions made in the right order.

First, understand why a naive timestamp string is not enough information. The same text, read in three different zones, is three genuinely different moments.

```r title="One string, three different instants"
naive <- "2024-06-01 09:00:00"

sapply(c("America/New_York", "Europe/London", "Asia/Tokyo"),
       function(z) format(with_tz(as.POSIXct(naive, tz = z), "UTC"), "%Y-%m-%d %H:%M UTC"))
#>       America/New_York          Europe/London             Asia/Tokyo 
#> "2024-06-01 13:00 UTC" "2024-06-01 08:00 UTC" "2024-06-01 00:00 UTC" 
```

`sapply()` runs the same conversion for each of the three zone names: interpret the string in that zone with `as.POSIXct(tz = z)`, then express the result in UTC so all three are directly comparable.

Thirteen hours separate the New York and Tokyo readings of the identical text. Worse, `as.POSIXct()` with no `tz` argument at all does not fail, it silently uses whatever zone the machine is configured for. The same script then produces different numbers on your laptop, your colleague's laptop and the production server.

[TIP]
**Store UTC, aggregate local, display local.** Convert every timestamp to UTC the moment it enters your pipeline so arithmetic and joins are unambiguous. Convert to the business time zone only when grouping into days or hours, because human behaviour follows local clocks. Convert to the reader's zone only at the final formatting step.

The middle step of that rule deserves a demonstration, because it is where judgement is actually required. Take the same hourly instants from the previous section and count them by UTC date instead of local date.

```r title="Counting the same instants in UTC"
hourly |>
  mutate(ts_utc = with_tz(ts, "UTC")) |>
  count(day_utc = as_date(ts_utc))
#> # A tibble: 6 × 2
#>   day_utc        n
#>   <date>     <int>
#> 1 2024-03-08    19
#> 2 2024-03-09    24
#> 3 2024-03-10    24
#> 4 2024-03-11    24
#> 5 2024-03-12    24
#> 6 2024-03-13     4
```

Every full day in the middle now has exactly 24 hours, DST transition or not. The partial 19 and 4 at the ends are just the five-day local window straddling six UTC dates, which is the offset at work rather than a bug.

So which is right? It depends on what the data measures. Electricity demand, retail footfall and app usage follow human routines, so they belong on local days even though those days are ragged. Server throughput, sensor readings and anything physical belongs on UTC days, where every day really is 24 hours long. Choose deliberately, then write the choice into the code as a comment, because the two produce different answers and both look reasonable.

**Try it:** Take the `ex_hours` object from the previous exercise and recount it by UTC date instead of local date, then compare the row count.

```r title="Your turn: recount in UTC"
# Convert ex_ts to UTC, then count by UTC date:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="UTC recount solution"
ex_hours |> mutate(ex_utc = with_tz(ex_ts, "UTC")) |> count(ex_day = as_date(ex_utc))
#> # A tibble: 4 × 2
#>   ex_day         n
#>   <date>     <int>
#> 1 2025-03-08    19
#> 2 2025-03-09    24
#> 3 2025-03-10    24
#> 4 2025-03-11     4
```

**Explanation:** The 23-hour day has vanished. In UTC, 9 March 2025 has a full 24 hours because UTC never observes daylight saving. Three local dates became four UTC dates, which is the five-hour offset splitting the window differently, not lost or duplicated data. The totals still match: 71 observations either way.

</details>

## Complete Example

Time to put the whole toolkit to work on one realistic problem. You have eight years of daily revenue for a US business that closes at weekends and on federal holidays. The question is whether a calendar regressor measurably improves a forecast, tested honestly on data the model never saw.

The plan is: build a holiday-aware trading-day calendar running past the end of the data, aggregate revenue to months, train on 2018 through 2024, test on 2025, and compare a plain seasonal model against a calendar-aware one.

```r title="Train and test a calendar-aware model"
hols_full <- us_holidays(2018:2027)

calendar <- tibble(date = seq(as.Date("2018-01-01"), as.Date("2026-12-31"), by = "day")) |>
  mutate(is_trading = wday(date, week_start = 1) <= 5 & !(date %in% hols_full)) |>
  group_by(month = yearmonth(date)) |>
  summarise(n_trading = sum(is_trading), .groups = "drop")

set.seed(909)
revenue <- tibble(date = seq(as.Date("2018-01-01"), as.Date("2025-12-31"), by = "day")) |>
  mutate(open = wday(date, week_start = 1) <= 5 & !(date %in% hols_full),
         daily = open * (4000 + 1.2 * as.numeric(date - as.Date("2018-01-01")) +
                         ifelse(month(date) == 12, 900, 0) + rnorm(n(), 0, 250))) |>
  group_by(month = yearmonth(date)) |>
  summarise(revenue = round(sum(daily)), .groups = "drop") |>
  left_join(calendar, by = "month") |>
  as_tsibble(index = month)

train <- revenue |> filter(year(month) <= 2024)
test  <- revenue |> filter(year(month) == 2025)

models <- train |>
  model(plain    = TSLM(revenue ~ trend() + season()),
        calendar = TSLM(revenue ~ trend() + season() + n_trading))

accuracy(forecast(models, new_data = test), revenue) |>
  select(.model, RMSE, MAPE)
#> # A tibble: 2 × 3
#>   .model    RMSE  MAPE
#>   <chr>    <dbl> <dbl>
#> 1 calendar 2499.  1.18
#> 2 plain    6684.  3.58
```

Following the pipeline: `calendar` runs to the end of 2026 so future values are ready, `revenue` simulates daily takings with a trend and a December uplift then rolls up to months, `train` and `test` split at the end of 2024, and `accuracy()` scores both models' 2025 forecasts against what actually happened.

The verdict is decisive. Mean absolute percentage error falls from 3.58% to 1.18%, and root mean squared error from 6684 to 2499. The calendar model's typical monthly forecast error is less than a third of the plain model's, from one extra column that required no forecasting of its own.

With the better model chosen on evidence, produce the forecast that the business actually asked for.

```r title="Forecast the first half of 2026"
future <- calendar |>
  filter(month > yearmonth("2025 Dec"), month <= yearmonth("2026 Jun")) |>
  as_tsibble(index = month)

models |> select(calendar) |> forecast(new_data = future) |>
  as_tibble() |> select(month, n_trading, .mean) |> mutate(.mean = round(.mean))
#> # A tibble: 6 × 3
#>      month n_trading  .mean
#>      <mth>     <int>  <dbl>
#> 1 2026 Jan        20 152224
#> 2 2026 Feb        19 147241
#> 3 2026 Mar        22 163917
#> 4 2026 Apr        22 164957
#> 5 2026 May        20 155614
#> 6 2026 Jun        21 161288
```

The `filter()` slices the pre-built calendar down to the forecast window, and `round()` tidies the output for reporting.

The forecast tells a story a plain model could not. February 2026 is the weakest month at 147k, but not because February is inherently weak, it is because 2026 gives it only 19 trading days. If the business compares February against March and sees a 17k gap, the calendar explains almost all of it, and nobody needs to launch an investigation into a sales slump that never happened.

## Practice Exercises

### Exercise 1: Build an Easter regressor split across months

Easter moves between March and April, so a monthly series needs its effect apportioned between the two. The standard method treats the holiday as a window of days and gives each month the fraction of that window it contains.

Build a regressor for 2018 to 2025 using a 7-day window ending on Easter Sunday (the six days before, plus Easter itself). For each month that overlaps a window, report how many of the 7 days fell in it and what share of the window that is. You will need the `easter_date()` function from earlier in the tutorial.

```r title="Exercise 1 starter"
my_years  <- 2018:2025
my_easter <- easter_date(my_years)

# Hint: build one row per window-day with rep(), then count by yearmonth()
# Expand each Easter into its 7-day window:

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Easter regressor solution"
my_years  <- 2018:2025
my_easter <- easter_date(my_years)

my_window <- tibble(
  easter = rep(my_easter, each = 7),
  day    = rep(my_easter, each = 7) - rep(6:0, times = length(my_easter))
)

my_easter_reg <- my_window |>
  count(my_month = yearmonth(day), name = "n_days") |>
  mutate(easter_share = n_days / 7)

my_easter_reg
#> # A tibble: 10 × 3
#>    my_month n_days easter_share
#>       <mth>  <int>        <dbl>
#>  1 2018 Mar      6        0.857
#>  2 2018 Apr      1        0.143
#>  3 2019 Apr      7        1    
#>  4 2020 Apr      7        1    
#>  5 2021 Mar      3        0.429
#>  6 2021 Apr      4        0.571
#>  7 2022 Apr      7        1    
#>  8 2023 Apr      7        1    
#>  9 2024 Mar      7        1    
#> 10 2025 Apr      7        1    
```

**Explanation:** `rep(my_easter, each = 7)` repeats each Easter date seven times, and subtracting `rep(6:0, ...)` walks backwards from six days before to Easter itself. `count()` then does the apportioning automatically, because days that crossed a month boundary land in different `yearmonth()` groups.

Read the interesting years. 2018 splits 6 days into March and 1 into April; 2021 splits 3 and 4. The other six years fall entirely within one month. That `easter_share` column is what you feed to `TSLM()` as a regressor, and it is the same logic the US Census Bureau's `genhol` function implements for X-13ARIMA-SEATS.

</details>

### Exercise 2: Decide which series has a trading-day effect

You are handed two monthly series and asked which one needs a calendar adjustment. Guessing from a plot is unreliable because a trading-day effect looks a lot like ordinary seasonality.

Build both series with the code below, then regress each on `n_trading` and use the coefficient's t statistic and p-value to decide. Reshape to long form and use a keyed tsibble so one `model()` call handles both. Expect a t statistic above 10 for the series that has an effect and below 2 for the one that does not.

```r title="Exercise 2 starter"
set.seed(4242)
my_cal <- tibble(date = seq(as.Date("2018-01-01"), as.Date("2025-12-31"), by = "day")) |>
  mutate(wd = wday(date, week_start = 1) <= 5) |>
  group_by(my_month = yearmonth(date)) |>
  summarise(n_trading = sum(wd), .groups = "drop")

my_series <- my_cal |>
  mutate(series_a = round(500 * n_trading + rnorm(n(), 0, 400)),
         series_b = round(11000 + 20 * row_number() + rnorm(n(), 0, 400)))

# Hint: pivot_longer() then as_tsibble(index = ..., key = ...), then tidy()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Trading-day detection solution"
set.seed(4242)
my_cal <- tibble(date = seq(as.Date("2018-01-01"), as.Date("2025-12-31"), by = "day")) |>
  mutate(wd = wday(date, week_start = 1) <= 5) |>
  group_by(my_month = yearmonth(date)) |>
  summarise(n_trading = sum(wd), .groups = "drop")

my_series <- my_cal |>
  mutate(series_a = round(500 * n_trading + rnorm(n(), 0, 400)),
         series_b = round(11000 + 20 * row_number() + rnorm(n(), 0, 400))) |>
  pivot_longer(c(series_a, series_b), names_to = "series", values_to = "value") |>
  as_tsibble(index = my_month, key = series)

my_check <- my_series |> model(td = TSLM(value ~ n_trading))

tidy(my_check) |> filter(term == "n_trading") |>
  select(series, estimate, statistic, p.value)
#> # A tibble: 2 × 4
#>   series   estimate statistic  p.value
#>   <chr>       <dbl>     <dbl>    <dbl>
#> 1 series_a    625.     13.9   1.49e-24
#> 2 series_b    -58.0    -0.825 4.12e- 1
```

**Explanation:** Reshaping to long form and declaring `key = series` makes a keyed tsibble, so a single `model()` call fits one model per series and `tidy()` returns both coefficient sets stacked with a `series` column.

The answer is unambiguous. Series A has a t statistic of 13.9 and a p-value near zero, so it needs a trading-day regressor. Series B has t = -0.83 and p = 0.41, which is exactly what noise looks like, so adding the regressor there would only cost a degree of freedom. Series B was built from a trend plus noise with no calendar dependence at all.

</details>

### Exercise 3: Aggregate hourly data safely across a DST transition

An energy team gives you hourly load readings across the November fall-back weekend and asks for daily figures. The readings are deliberately constant at 100 for every single hour, so any variation you see in the daily output is an artefact and not a signal.

Build the hourly frame below, then group by local date and report three things per day: the number of observations, the sum of load, and the mean of load. Then explain which of `sum()` and `mean()` you would ship to the energy team, and why.

```r title="Exercise 3 starter"
my_hours <- tibble(
  ts = seq(ymd_hms("2024-11-02 00:00:00", tz = "America/New_York"),
           ymd_hms("2024-11-04 23:00:00", tz = "America/New_York"), by = "hour")
) |> mutate(load = 100)

# Hint: group_by(as_date(ts)) then summarise n(), sum() and mean() together

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="DST-safe aggregation solution"
my_hours <- tibble(
  ts = seq(ymd_hms("2024-11-02 00:00:00", tz = "America/New_York"),
           ymd_hms("2024-11-04 23:00:00", tz = "America/New_York"), by = "hour")
) |> mutate(load = 100)

my_hours |>
  group_by(my_day = as_date(ts)) |>
  summarise(n_obs = n(), total = sum(load), average = mean(load), .groups = "drop")
#> # A tibble: 3 × 4
#>   my_day     n_obs total average
#>   <date>     <int> <dbl>   <dbl>
#> 1 2024-11-02    24  2400     100
#> 2 2024-11-03    25  2500     100
#> 3 2024-11-04    24  2400     100
```

**Explanation:** The `n_obs` column is the tell: 3 November carries 25 readings because the 01:00 hour occurred twice. The `total` column duly reports 2500 against 2400 on the neighbouring days, a 4.2% spike, even though the load never changed by a single unit. The `average` column stays flat at 100, which is the truth.

Ship the mean, or ship the sum with `n_obs` beside it so the reader can normalise. Shipping a bare daily sum guarantees that one day every autumn looks like a demand surge and one day every spring looks like an outage, and both will be investigated by someone who does not know about clocks.

</details>

## Frequently Asked Questions

### Why not just divide the monthly total by the number of trading days?

That is the obvious alternative and it does remove most of the distortion, but it forces the effect to be exactly proportional: 5% more trading days must mean 5% more sales. A regressor lets the model estimate the per-day value from the data instead of assuming it, which matters when part of the month's activity is fixed (a subscription base, a standing order) and does not scale with opening days at all. Dividing also destroys the units of the series, so your forecast comes back as "sales per trading day" and has to be multiplied out again.

### Does a weekly or daily series need this too?

A weekly series is the one case that mostly escapes, because every week contains exactly seven days and one of each weekday, so there are no trading-day counts to vary. It still needs holiday handling, since a public holiday inside a week is a genuine loss. Daily series have the opposite problem: the day-of-week pattern is not a nuisance count any more, it is the seasonality itself, so you model it directly with a weekly seasonal term plus holiday dummies rather than with the monthly counts built here.

### What about leap years and months of different lengths?

Month length is handled automatically, because counting weekdays or trading days per month already absorbs it. February 2024 gets 20 trading days and February 2025 gets 19, and the extra one is the leap day itself, 29 February 2024, which happened to fall on a Thursday. `n_trading` carries that difference without any extra work. The only place you have to think about it separately is the `is_last` test, which is why the code calls `days_in_month(date)` instead of hard-coding 30 or 31.

### Should I use a package like timeDate or bizdays instead of writing this myself?

Use a package when it already ships the exact calendar you need, which is the case for major exchanges (`timeDate::holidayNYSE()`) and for the financial centres covered by `bizdays`. Build it yourself when your calendar is company-specific, regional, or simply not in any package, which covers most real business series: a warehouse that shuts for a local festival, a clinic with its own closure days. The grid pattern in this tutorial is worth knowing either way, because it is what lets you edit a packaged calendar rather than accept it.

### One trading-day count or seven day-of-week counts?

Start with one count and only move to seven if the business genuinely trades at different rates on different days. Seven regressors need roughly five years of monthly data before the coefficients settle, because each count only ever takes the value 4 or 5. A useful middle option when history is short is two columns, weekday count and weekend-day count, which captures most of the retail pattern at a quarter of the parameter cost.

### Do auto.arima() or ETS handle calendar effects on their own?

No. Both estimate a fixed seasonal pattern, meaning one factor for January that is reused for every January, so a January with 23 trading days and a January with 21 get the same adjustment. That is exactly the assumption calendar effects violate. The fix is to pass the calendar in as an external regressor, which ARIMA supports through `ARIMA(y ~ n_trading + pdq(...))` in fable; ETS does not accept external regressors at all, so a calendar-sensitive series is a reason to prefer a regression or ARIMA model over ETS.

## Summary

Calendar effects are not exotic. They show up in any series aggregated to a period the calendar does not divide evenly, which is nearly all of them.

![The calendar effects toolkit at a glance](screenshots/Calendar-Effects-in-R-overview-mindmap.webp)

*Figure 4: The calendar-effects toolkit at a glance.*

| Effect | How it shows up | Fix in R |
|---|---|---|
| Trading days | Monthly totals swing 10-15% with no real change | Count working days per month, add as a regressor |
| Holidays | Certain months dip for reasons no seasonal factor explains | Build a holiday vector, exclude those dates from the count |
| Observed shifts | A holiday's cost lands in the wrong month | Shift Saturday holidays to Friday, Sunday to Monday |
| Moving festivals | March and April swap places year to year | Compute the date (Easter computus), split the window across months |
| Unequal weekdays | Weekend-heavy business, one total count underfits | Use seven day-of-week counts instead of one |
| DST transitions | One day has 23 hours, another has 25 | Aggregate with mean(), or store the observation count |
| Time zone drift | Same script, different answers on different machines | Store UTC, aggregate local, display local |

The key techniques, in the order you will reach for them:

1. **`wday(x, week_start = 1)`** so Monday is 1, otherwise every count is off by a day per week.
2. **`nth = ceiling(mday(x) / 7)`** and **`is_last = mday(x) > days_in_month(x) - 7`** to express any "nth weekday of the month" holiday as a filter.
3. **`sum(logical_column)`** to turn per-day flags into per-period counts.
4. **`TSLM(y ~ trend() + season() + n_trading)`** to let seasonality and the calendar each do their own job.
5. **`forecast(new_data = ...)`**, never `h = ...`, once a model has an external regressor.
6. **`force_tz()` versus `with_tz()`**, decided by whether the digits or the instant is the thing that is already correct.

The single most valuable habit is building the calendar past the end of your data. Future trading-day counts are arithmetic, not forecasts, so they cost nothing to compute and they are the one predictor you will never be uncertain about.

## References

1. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd Edition. Section 7.4: Some useful predictors (trading days, Easter, distributed lags). [Link](https://otexts.com/fpp3/useful-predictors.html)
2. Monsell, B.C., *Issues in Modeling and Adjusting Calendar Effects in Economic Time Series*. US Census Bureau, Proceedings of ICES-III (2007). [Link](https://www.census.gov/library/working-papers/2007/adrm/monsell-01.html)
3. Sax, C. & Eddelbuettel, D., *Seasonal Adjustment by X-13ARIMA-SEATS in R*. Journal of Statistical Software. Covers the `genhol()` function for moving-holiday regressors. [Link](https://cran.r-project.org/web/packages/seasonal/vignettes/seas.pdf)
4. lubridate reference, time zone functions `force_tz()`, `with_tz()`, and the period versus duration distinction. [Link](https://lubridate.tidyverse.org/reference/index.html)
5. fable reference, `TSLM()` and forecasting with external regressors via `new_data`. [Link](https://fable.tidyverts.org/reference/TSLM.html)
6. Wang, E., Cook, D. & Hyndman, R.J., *A New Tidy Data Structure to Support Exploration and Modeling of Temporal Data*. Journal of Computational and Graphical Statistics (2020). The tsibble paper. [Link](https://doi.org/10.1080/10618600.2019.1695624)
7. timeDate package, `holidayNYSE()` and other exchange calendars. [Link](https://search.r-project.org/CRAN/refmans/timeDate/html/holiday-NYSE.html)
8. IANA Time Zone Database, the authoritative source behind every Olson zone name such as `America/New_York`. [Link](https://www.iana.org/time-zones)
9. R Core Team, *An Introduction to R*, and the `?as.POSIXct` help page on the empty time zone default. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- **[Time Series Regression in R](Time-Series-Regression-in-R.html)** goes deeper on `TSLM()`, including the spurious regression trap and how to check residual assumptions once you have added regressors like the ones built here.
- **[tsibble in R](tsibble-in-R.html)** explains the tsibble object model used throughout this tutorial: index columns, keys for multiple series, and how to find and fill gaps in irregular data.
- **[Dates and Times Drills in R](Dates-and-Times-Drills-in-R.html)** is fifteen graded problems on parsing, arithmetic and time zones, and is the fastest way to make the lubridate patterns here automatic.
