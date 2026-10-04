---
title: "Production Forecasting Lesson 4: Calendar and event features for production forecasts"
catalog_blurb: "Why holiday features break between training and serving, and the fix."
description: "A holiday feature computed one way in training and a different way at serving time can throw off a forecast. One calendar table, read by both sides, is the fix."
keywords: "feature store, training-serving skew, calendar features, holiday features, moving holidays, lubridate, data leakage, offline online store, time series forecasting, R"
post_type: "LESSON"
curriculum_id: "5.160.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-production"
course_title: "Production Forecasting"
course_lesson: "4"
course_total: "6"
course_landing: "Production-Forecasting-Course.html"
course_next: "Scaling-fable-and-fabletools.html"
course_prev: "Detecting-and-Diagnosing-Forecast-Degradation.html"
---

=== step === cover
## Calendar and event features for production forecasts

Today let's understand how a forecast can quietly read the wrong holiday calendar, and how to build one calendar table that fixes it for good.

Northbay Supply sells online in both the US and India. In November 2023, its India forecast had to cover Diwali, the busiest shopping day of the year there. The forecast expected an ordinary Sunday, somewhere around 300 orders. The real count landed close to 900.

Below are four days from that same week on Northbay's India calendar. Toggle the table to see what each date actually carries once you look past the bare date.

::widget styled-table {"cols":["date","day_of_week","holiday_name"],"rows":[["2023-11-10","Fri","-"],["2023-11-11","Sat","-"],["2023-11-12","Sun","Diwali"],["2023-11-13","Mon","-"]],"title":"Four days on the India calendar, November 2023","note":"Toggle to the report table to see each date carry its weekday and its holiday name."}

One of those four dates is not like the others. Once you add its weekday and its holiday name, 2023-11-12 stands out as Diwali, the date a forecast has to catch.

=== step === concept
## Why a calendar feature breaks between training and serving

Let's work out exactly what went wrong with Northbay's Diwali forecast.

Northbay's forecasting model does not only use past order counts. It also uses a holiday flag: a column that is TRUE on a date that is a holiday for a given country, and FALSE otherwise. That flag is a feature, the same way lag values or a day-of-week indicator are features, and it is built from a list of known holiday dates.

A model like this is trained once, usually offline, and then used again and again to produce new forecasts as new dates arrive. The problem is that Diwali's date is not fixed. It depends on the lunar calendar and moves every year, so the list used to flag it has to be kept current.

Here is what happened at Northbay. The team that trained the model knew Diwali fell on 2023-11-12 that year, so the training data correctly flagged that date. But the forecasting service, running separately at serving time, was still relying on a hardcoded list someone had written the year before. That list still carried 2022's Diwali date, 2022-10-24, not 2023's.

Run the code below to see the two flags side by side, for the exact same date.

```r
# Compare the holiday flag a training pipeline computed against what a serving pipeline computed, for the same date
training_holidays <- as.Date("2023-11-12")       # Diwali's real 2023 date, known when the model was trained
serving_holidays_stale <- as.Date("2022-10-24")  # last year's Diwali date, cached at serving time and never refreshed

check_date <- as.Date("2023-11-12")

check_date %in% training_holidays
#> [1] TRUE
check_date %in% serving_holidays_stale
#> [1] FALSE
```

Same date, two different answers. Training says 2023-11-12 is a holiday. Serving, reading from a list nobody updated, says it is not.

This gap between what a model learned at training time and what it is given at serving time has a name: **training-serving skew**. It happens whenever the same feature is computed one way for training and a different way, or from different data, for serving. Northbay's Diwali miss is a direct case of it. At serving time, the model never saw a TRUE for 2023-11-12, so it forecast that date like an ordinary Sunday instead of like Diwali.

=== step === concept
## A calendar table: the feature built once

The real fix here is not to patch the holiday list again. It is to stop computing calendar features separately, in different places, in the first place.

Instead, build one **calendar table** ahead of time: one row for every day forecasting will ever need, with its day of week, whether it falls on a weekend, and its month already worked out. Training reads this table. Serving reads the exact same table. Neither side computes these values on its own, so there is no way for the two sides to disagree about them.

```r
# Build one calendar table: a row per day, with its weekday, weekend flag, and month computed once
library(lubridate)
library(dplyr)

calendar <- tibble(date = seq(as.Date("2023-10-01"), as.Date("2024-01-15"), by = "day")) %>%
  mutate(
    day_of_week = wday(date, label = TRUE, abbr = TRUE),
    is_weekend = day_of_week %in% c("Sat", "Sun"),
    month = month(date, label = TRUE, abbr = TRUE)
  )

nrow(calendar)
#> [1] 107
head(calendar, 4)
#> # A tibble: 4 × 4
#>   date       day_of_week is_weekend month
#>   <date>     <ord>       <lgl>      <ord>
#> 1 2023-10-01 Sun         TRUE       Oct
#> 2 2023-10-02 Mon         FALSE      Oct
#> 3 2023-10-03 Tue         FALSE      Oct
#> 4 2023-10-04 Wed         FALSE      Oct
```

`calendar` now has 107 rows, one for every day from 2023-10-01 to 2024-01-15. `wday()` reads off the weekday from the date, `is_weekend` is just TRUE when that weekday is Saturday or Sunday, and `month()` reads off the month. None of this depends on which model is asking, or when it asks. Below is the same four rows, toggled between a bare date column and the built table.

::widget styled-table {"cols":["date","day_of_week","is_weekend","month"],"rows":[["2023-10-01","Sun",true,"Oct"],["2023-10-02","Mon",false,"Oct"],["2023-10-03","Tue",false,"Oct"],["2023-10-04","Wed",false,"Oct"]],"title":"The calendar table, 4 of its 107 rows","note":"Every row from 2023-10-01 to 2024-01-15 is computed once. Training and serving both read these same four columns."}

This is the whole idea behind building a feature once: compute `day_of_week`, `is_weekend`, and `month` a single time for every date you will ever need, store the result, and have every consumer of that feature, training or serving, read it from the same place. There is no second copy of the logic to drift out of sync, because there is no second copy of the logic at all.

=== step === concept
## Fixed holidays and moving holidays

The calendar table above handles day of week, weekend, and month, because all three follow directly from the date itself. A holiday does not. Knowing a date is 2023-11-12 does not, by itself, tell you it is Diwali. For that you need a separate table of holiday dates, and before building one it helps to notice that holidays come in two different kinds.

New Year's Day is always 01-01, every single year. That makes it a **fixed holiday**: you could compute it straight from the date with a simple rule and never be wrong. Many holidays are not fixed. Easter is one, and it is a clean example because the rule behind it is well documented: Easter's date is set by a calculation tied to the moon, not a fixed spot on the calendar you use day to day.

```r
# Show Easter's real date across three years, and how far its day-of-year actually moves
library(lubridate)

easter_dates <- tibble(
  year = c(2023, 2024, 2025),
  date = as.Date(c("2023-04-09", "2024-03-31", "2025-04-20"))
) %>%
  mutate(day_of_year = yday(date))

easter_dates
#> # A tibble: 3 × 3
#>    year date       day_of_year
#>   <dbl> <date>           <dbl>
#> 1  2023 2023-04-09          99
#> 2  2024 2024-03-31          91
#> 3  2025 2025-04-20         110
```

Look at the `day_of_year` column. In 2024 Easter falls on day 91 of the year. In 2025 it falls on day 110, nineteen days later in the year's own count. That is a **moving holiday**: a holiday whose date changes from year to year, with no fixed day-of-year you could bake into a rule. Diwali, the holiday that caught Northbay's forecast off guard, is a moving holiday too, which is exactly why a hardcoded list from one year stops being correct the next.

Because a moving holiday does not repeat at the same day-of-year, you cannot store it as a rule like "day 99 is a holiday every year." You have to store the one real date for each year it happens, and look it up by that date, the same way the calendar table above stores an actual date in every row rather than a formula for one.

=== step === concept
## A country with its own calendar

Moving holidays are only half of what a holiday table needs to handle. The other half is that holidays differ by country. Diwali matters in India and nowhere else in Northbay's business. Black Friday, Christmas, and New Year's Day matter in the US. The same calendar date can be an ordinary Tuesday in one country and a company's busiest day in another, so a holiday table needs a country column sitting right next to the date, not just a date column on its own.

```r
# Add each country's own holidays, join them onto the calendar, and simulate daily orders from the result
holidays <- tribble(
  ~country, ~date,                 ~holiday_name,
  "US",     as.Date("2023-11-24"), "Black Friday",
  "US",     as.Date("2023-12-25"), "Christmas",
  "US",     as.Date("2024-01-01"), "New Year's Day",
  "IN",     as.Date("2023-11-12"), "Diwali",
  "IN",     as.Date("2024-01-01"), "New Year's Day"
)

set.seed(104)
countries <- tibble(country = c("US", "IN"))

orders <- calendar %>%
  cross_join(countries) %>%
  left_join(holidays, by = c("country", "date")) %>%
  mutate(
    is_holiday = !is.na(holiday_name),
    baseline = if_else(country == "US", 500, 300),
    weekend_adj = if_else(is_weekend, baseline * 0.7, baseline),
    daily_orders = round(if_else(is_holiday, baseline * 3, weekend_adj) + rnorm(n(), 0, 20))
  ) %>%
  select(date, country, day_of_week, is_holiday, holiday_name, daily_orders)

orders %>% filter(date == as.Date("2023-11-12"))
#> # A tibble: 2 × 6
#>   date       country day_of_week is_holiday holiday_name daily_orders
#>   <date>     <chr>   <ord>       <lgl>      <chr>               <dbl>
#> 1 2023-11-12 US      Sun         FALSE      <NA>                  301
#> 2 2023-11-12 IN      Sun         TRUE       Diwali                885
```

`cross_join(countries)` first pairs every date in `calendar` with both countries, so each date gets one row for the US and one row for India. `holidays` then joins onto that by both `country` and `date` together, so a row only matches when both agree. `orders` then simulates a daily order count for each country: 500 orders a day as the US baseline, 300 for India, cut to 70% on an ordinary weekend, and tripled on a day each country's own table flags as a holiday. Notice the result for 2023-11-12: the US, for whom that date is an ordinary Sunday, stays near its usual 301. India, for whom it is Diwali, jumps to 885.

The same pattern runs the other way for a US-only holiday.

```r
# Check the same pattern from the other side: Black Friday is a US holiday only
orders %>% filter(date == as.Date("2023-11-24"))
#> # A tibble: 2 × 6
#>   date       country day_of_week is_holiday holiday_name daily_orders
#>   <date>     <chr>   <ord>       <lgl>      <chr>               <dbl>
#> 1 2023-11-24 US      Fri         TRUE       Black Friday         1489
#> 2 2023-11-24 IN      Fri         FALSE      <NA>                  301
```

US orders jump to 1489 on Black Friday while India, for whom the day carries no holiday flag, sits at an ordinary 301. Each country's spike lands on its own country's holiday and nowhere else. Below is the full 107 days for both countries, toggled between one combined chart and a small multiple per country.

::widget facet-grid {"data":[{"x":1,"y":343,"facet":"US"},{"x":2,"y":513,"facet":"US"},{"x":3,"y":521,"facet":"US"},{"x":4,"y":499,"facet":"US"},{"x":5,"y":512,"facet":"US"},{"x":6,"y":519,"facet":"US"},{"x":7,"y":361,"facet":"US"},{"x":8,"y":347,"facet":"US"},{"x":9,"y":524,"facet":"US"},{"x":10,"y":476,"facet":"US"},{"x":11,"y":489,"facet":"US"},{"x":12,"y":490,"facet":"US"},{"x":13,"y":517,"facet":"US"},{"x":14,"y":326,"facet":"US"},{"x":15,"y":324,"facet":"US"},{"x":16,"y":526,"facet":"US"},{"x":17,"y":487,"facet":"US"},{"x":18,"y":512,"facet":"US"},{"x":19,"y":488,"facet":"US"},{"x":20,"y":522,"facet":"US"},{"x":21,"y":342,"facet":"US"},{"x":22,"y":330,"facet":"US"},{"x":23,"y":503,"facet":"US"},{"x":24,"y":481,"facet":"US"},{"x":25,"y":507,"facet":"US"},{"x":26,"y":522,"facet":"US"},{"x":27,"y":489,"facet":"US"},{"x":28,"y":383,"facet":"US"},{"x":29,"y":365,"facet":"US"},{"x":30,"y":488,"facet":"US"},{"x":31,"y":486,"facet":"US"},{"x":32,"y":482,"facet":"US"},{"x":33,"y":485,"facet":"US"},{"x":34,"y":503,"facet":"US"},{"x":35,"y":345,"facet":"US"},{"x":36,"y":366,"facet":"US"},{"x":37,"y":495,"facet":"US"},{"x":38,"y":502,"facet":"US"},{"x":39,"y":483,"facet":"US"},{"x":40,"y":531,"facet":"US"},{"x":41,"y":502,"facet":"US"},{"x":42,"y":375,"facet":"US"},{"x":43,"y":301,"facet":"US"},{"x":44,"y":515,"facet":"US"},{"x":45,"y":492,"facet":"US"},{"x":46,"y":525,"facet":"US"},{"x":47,"y":488,"facet":"US"},{"x":48,"y":505,"facet":"US"},{"x":49,"y":369,"facet":"US"},{"x":50,"y":398,"facet":"US"},{"x":51,"y":506,"facet":"US"},{"x":52,"y":516,"facet":"US"},{"x":53,"y":488,"facet":"US"},{"x":54,"y":515,"facet":"US"},{"x":55,"y":1489,"facet":"US"},{"x":56,"y":387,"facet":"US"},{"x":57,"y":352,"facet":"US"},{"x":58,"y":511,"facet":"US"},{"x":59,"y":522,"facet":"US"},{"x":60,"y":517,"facet":"US"},{"x":61,"y":463,"facet":"US"},{"x":62,"y":480,"facet":"US"},{"x":63,"y":343,"facet":"US"},{"x":64,"y":350,"facet":"US"},{"x":65,"y":538,"facet":"US"},{"x":66,"y":457,"facet":"US"},{"x":67,"y":496,"facet":"US"},{"x":68,"y":533,"facet":"US"},{"x":69,"y":506,"facet":"US"},{"x":70,"y":343,"facet":"US"},{"x":71,"y":339,"facet":"US"},{"x":72,"y":503,"facet":"US"},{"x":73,"y":536,"facet":"US"},{"x":74,"y":493,"facet":"US"},{"x":75,"y":510,"facet":"US"},{"x":76,"y":524,"facet":"US"},{"x":77,"y":362,"facet":"US"},{"x":78,"y":346,"facet":"US"},{"x":79,"y":534,"facet":"US"},{"x":80,"y":484,"facet":"US"},{"x":81,"y":480,"facet":"US"},{"x":82,"y":513,"facet":"US"},{"x":83,"y":505,"facet":"US"},{"x":84,"y":367,"facet":"US"},{"x":85,"y":351,"facet":"US"},{"x":86,"y":1492,"facet":"US"},{"x":87,"y":519,"facet":"US"},{"x":88,"y":464,"facet":"US"},{"x":89,"y":513,"facet":"US"},{"x":90,"y":503,"facet":"US"},{"x":91,"y":344,"facet":"US"},{"x":92,"y":345,"facet":"US"},{"x":93,"y":1515,"facet":"US"},{"x":94,"y":491,"facet":"US"},{"x":95,"y":475,"facet":"US"},{"x":96,"y":526,"facet":"US"},{"x":97,"y":476,"facet":"US"},{"x":98,"y":329,"facet":"US"},{"x":99,"y":339,"facet":"US"},{"x":100,"y":496,"facet":"US"},{"x":101,"y":500,"facet":"US"},{"x":102,"y":533,"facet":"US"},{"x":103,"y":495,"facet":"US"},{"x":104,"y":497,"facet":"US"},{"x":105,"y":332,"facet":"US"},{"x":106,"y":332,"facet":"US"},{"x":107,"y":504,"facet":"US"},{"x":1,"y":223,"facet":"IN"},{"x":2,"y":294,"facet":"IN"},{"x":3,"y":306,"facet":"IN"},{"x":4,"y":329,"facet":"IN"},{"x":5,"y":289,"facet":"IN"},{"x":6,"y":295,"facet":"IN"},{"x":7,"y":207,"facet":"IN"},{"x":8,"y":205,"facet":"IN"},{"x":9,"y":267,"facet":"IN"},{"x":10,"y":289,"facet":"IN"},{"x":11,"y":297,"facet":"IN"},{"x":12,"y":269,"facet":"IN"},{"x":13,"y":287,"facet":"IN"},{"x":14,"y":226,"facet":"IN"},{"x":15,"y":204,"facet":"IN"},{"x":16,"y":279,"facet":"IN"},{"x":17,"y":297,"facet":"IN"},{"x":18,"y":299,"facet":"IN"},{"x":19,"y":307,"facet":"IN"},{"x":20,"y":284,"facet":"IN"},{"x":21,"y":233,"facet":"IN"},{"x":22,"y":230,"facet":"IN"},{"x":23,"y":281,"facet":"IN"},{"x":24,"y":318,"facet":"IN"},{"x":25,"y":306,"facet":"IN"},{"x":26,"y":304,"facet":"IN"},{"x":27,"y":307,"facet":"IN"},{"x":28,"y":210,"facet":"IN"},{"x":29,"y":183,"facet":"IN"},{"x":30,"y":296,"facet":"IN"},{"x":31,"y":301,"facet":"IN"},{"x":32,"y":306,"facet":"IN"},{"x":33,"y":332,"facet":"IN"},{"x":34,"y":330,"facet":"IN"},{"x":35,"y":232,"facet":"IN"},{"x":36,"y":205,"facet":"IN"},{"x":37,"y":320,"facet":"IN"},{"x":38,"y":304,"facet":"IN"},{"x":39,"y":291,"facet":"IN"},{"x":40,"y":304,"facet":"IN"},{"x":41,"y":341,"facet":"IN"},{"x":42,"y":238,"facet":"IN"},{"x":43,"y":885,"facet":"IN"},{"x":44,"y":283,"facet":"IN"},{"x":45,"y":317,"facet":"IN"},{"x":46,"y":269,"facet":"IN"},{"x":47,"y":296,"facet":"IN"},{"x":48,"y":300,"facet":"IN"},{"x":49,"y":186,"facet":"IN"},{"x":50,"y":210,"facet":"IN"},{"x":51,"y":277,"facet":"IN"},{"x":52,"y":328,"facet":"IN"},{"x":53,"y":323,"facet":"IN"},{"x":54,"y":313,"facet":"IN"},{"x":55,"y":301,"facet":"IN"},{"x":56,"y":222,"facet":"IN"},{"x":57,"y":210,"facet":"IN"},{"x":58,"y":276,"facet":"IN"},{"x":59,"y":338,"facet":"IN"},{"x":60,"y":297,"facet":"IN"},{"x":61,"y":317,"facet":"IN"},{"x":62,"y":307,"facet":"IN"},{"x":63,"y":228,"facet":"IN"},{"x":64,"y":191,"facet":"IN"},{"x":65,"y":287,"facet":"IN"},{"x":66,"y":303,"facet":"IN"},{"x":67,"y":288,"facet":"IN"},{"x":68,"y":301,"facet":"IN"},{"x":69,"y":320,"facet":"IN"},{"x":70,"y":178,"facet":"IN"},{"x":71,"y":194,"facet":"IN"},{"x":72,"y":296,"facet":"IN"},{"x":73,"y":283,"facet":"IN"},{"x":74,"y":277,"facet":"IN"},{"x":75,"y":293,"facet":"IN"},{"x":76,"y":298,"facet":"IN"},{"x":77,"y":191,"facet":"IN"},{"x":78,"y":194,"facet":"IN"},{"x":79,"y":329,"facet":"IN"},{"x":80,"y":269,"facet":"IN"},{"x":81,"y":315,"facet":"IN"},{"x":82,"y":267,"facet":"IN"},{"x":83,"y":312,"facet":"IN"},{"x":84,"y":222,"facet":"IN"},{"x":85,"y":202,"facet":"IN"},{"x":86,"y":291,"facet":"IN"},{"x":87,"y":297,"facet":"IN"},{"x":88,"y":331,"facet":"IN"},{"x":89,"y":320,"facet":"IN"},{"x":90,"y":276,"facet":"IN"},{"x":91,"y":192,"facet":"IN"},{"x":92,"y":217,"facet":"IN"},{"x":93,"y":894,"facet":"IN"},{"x":94,"y":299,"facet":"IN"},{"x":95,"y":300,"facet":"IN"},{"x":96,"y":267,"facet":"IN"},{"x":97,"y":256,"facet":"IN"},{"x":98,"y":232,"facet":"IN"},{"x":99,"y":219,"facet":"IN"},{"x":100,"y":302,"facet":"IN"},{"x":101,"y":302,"facet":"IN"},{"x":102,"y":293,"facet":"IN"},{"x":103,"y":288,"facet":"IN"},{"x":104,"y":300,"facet":"IN"},{"x":105,"y":191,"facet":"IN"},{"x":106,"y":191,"facet":"IN"},{"x":107,"y":300,"facet":"IN"}],"geom":"line","x":"day","y":"orders","facetVar":"country"}

In the combined view the two countries overlap on the baseline but their spikes sit at different points along the 107 days. Switch to the small multiples and each country gets its own panel: the US panel shows one tall spike around day 55, Black Friday, with two smaller ones later for Christmas and New Year's Day; the India panel shows its own single spike around day 43, Diwali, and nowhere else. Neither country's spike shows up in the other's panel, because neither country's holiday table has an entry for a date that is not actually its own holiday.

=== step === quiz
## Quick check: fixed, moving, and country calendars

Suppose Northbay wants to add Lunar New Year to its calendar system. Lunar New Year falls on 2024-02-10 and on 2025-01-29, and it only matters for a store serving customers in China.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Add one row per real year to the holidays table, each with its own country code and its actual date for that year, the same way Diwali and Easter are stored. ::ok Exactly right. A moving holiday needs its real date stored for each year, and a country-specific one needs its own country code, so both facts live in the same row.
- Store it as day-of-year 41 in the calendar table, since Lunar New Year falls around the same point most years. ::no That is the Easter mistake. A moving holiday does not land on the same day-of-year every year, so a day-of-year rule will eventually point at the wrong date.
- Add it to the holidays table without a country column, since every market can just ignore the days that do not apply to it. ::no Dropping the country column loses the one fact that tells a US or an India join which rows are actually theirs. Diwali and Lunar New Year would each start showing up for every country.
- Reuse Diwali's 2023-11-12 date for Lunar New Year, since both move with a lunar calendar. ::no A moving holiday needs its own real date stored for the year it falls in, not a fixed day-of-year rule, not another holiday's date, and a country-specific holiday needs its own country code so a join never spreads it into a market it does not belong to.

=== step === concept
## What a one-day misalignment does to a forecast

The calendar table and the holidays table now join correctly: same country, same date, same flag, wherever either side looks. It is worth seeing what breaks when that join slips by just one day, because that is exactly the shape a timezone bug takes: a date stored in one timezone and read back in another can land on the day before or the day after the one you meant.

First, measure how much Diwali is actually worth to Northbay's India numbers. Call this the **uplift**: the average daily orders on a holiday minus the average daily orders on an ordinary day.

```r
# Compute the holiday uplift from a correct join: average orders on a holiday minus average orders on an ordinary day
in_orders <- orders %>% filter(country == "IN")

uplift_correct <- mean(in_orders$daily_orders[in_orders$is_holiday]) -
  mean(in_orders$daily_orders[!in_orders$is_holiday])
round(uplift_correct, 1)
#> [1] 616.2
```

With the real join, Diwali is worth 616.2 orders a day over an ordinary day for Northbay's India store. Now shift every date in the holidays table one day later, the way a timezone bug would, and recompute the same uplift.

```r
# Shift every date in holidays one day later, then rebuild the India holiday flag and the uplift from that shifted table
holidays_shifted <- holidays %>% mutate(date = date + 1)
holidays_shifted
#> # A tibble: 5 × 3
#>   country date       holiday_name
#>   <chr>   <date>     <chr>
#> 1 US      2023-11-25 Black Friday
#> 2 US      2023-12-26 Christmas
#> 3 US      2024-01-02 New Year's Day
#> 4 IN      2023-11-13 Diwali
#> 5 IN      2024-01-02 New Year's Day

orders_shifted_flag <- calendar %>%
  cross_join(countries) %>%
  left_join(holidays_shifted, by = c("country", "date")) %>%
  mutate(is_holiday_shifted = !is.na(holiday_name)) %>%
  filter(country == "IN") %>%
  select(date, is_holiday_shifted)

in_shifted <- in_orders %>%
  select(date, daily_orders) %>%
  left_join(orders_shifted_flag, by = "date")

uplift_shifted <- mean(in_shifted$daily_orders[in_shifted$is_holiday_shifted]) -
  mean(in_shifted$daily_orders[!in_shifted$is_holiday_shifted])
round(uplift_shifted, 1)
#> [1] 6.3
```

Shifting every date by one day moves Diwali's flag from 2023-11-12 onto 2023-11-13. Look at what each of those two dates actually sold.

```r
# Compare the real sales on Diwali itself against the day after
in_orders %>% filter(date == as.Date("2023-11-12")) %>% select(date, daily_orders)
#> # A tibble: 1 × 2
#>   date       daily_orders
#>   <date>            <dbl>
#> 1 2023-11-12          885

in_orders %>% filter(date == as.Date("2023-11-13")) %>% select(date, daily_orders)
#> # A tibble: 1 × 2
#>   date       daily_orders
#>   <date>            <dbl>
#> 1 2023-11-13          283
```

November 12 sold 885 orders, the real Diwali spike. November 13 sold an ordinary 283. The shifted join still credits 2023-11-13 with the holiday flag, so it treats an ordinary day's 283 orders as the holiday number and treats the real 885 as just another ordinary day. That is why the uplift collapses from 616.2 to 6.3: the real holiday adjustment on November 12 is erased, and a false one gets invented for November 13, a day that was never actually Diwali. A join off by a single day does not just blur the numbers a little. It moves a real effect off the date that earned it and invents one on a date that did nothing to deserve it.

=== step === concept
## The calendar table as a feature store

Northbay now has two tables worth protecting: `calendar`, built once for every date, and `holidays`, built once per country and kept current as a real-date list rather than a day-of-year rule. The question left is how to make sure both tables stay available, unchanged, to every system that needs them, training and serving alike.

The usual answer is to write both tables once to an **offline store**: a columnar file format such as Parquet, kept in a distributed store such as Amazon S3. A copy of the same data is then mirrored to a fast **online store** built for quick lookups, the kind a live forecasting service queries while it is answering a request. Neither side recomputes the holiday logic. Both sides just look up the date they need, in a table that was written once and never rebuilt differently for one side or the other. This offline-plus-online pattern, serving the same features consistently to training and to a live system, is what a **feature store** provides. Feast is one widely used open-source example of this pattern.

```r-static
# Write the calendar and holidays tables once to an offline store, then read them back wherever a forecast runs (not run in this browser session)
library(arrow)

write_parquet(calendar, "calendar.parquet")
write_parquet(holidays, "holidays.parquet")

calendar_for_serving <- read_parquet("calendar.parquet")
holidays_for_serving <- read_parquet("holidays.parquet")
```

`write_parquet()` saves each table in Parquet, a column-oriented file format built for fast, compact reads. `read_parquet()` reads it back, unchanged, wherever it is needed next. Whether that read happens from a training script or a live serving system, it returns the exact same table, which is the one guarantee that keeps training and serving from ever disagreeing about a calendar feature again.

=== step === quiz
## Quick check: training-serving skew and feature stores

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Read the holiday flag for every date from one shared calendar table, used by both training and serving, instead of each side computing or caching it on its own. ::ok Right. The Diwali miss came from training and serving disagreeing about one flag. A single calendar table both sides read removes the disagreement entirely, whatever else changes about the model.
- Train a larger, more complex forecasting model on the same data. ::no A bigger model still reads whatever holiday flag it is given. If that flag is wrong, a more complex model just learns the wrong pattern with more confidence.
- Collect more historical training data before refitting. ::no More history does not fix a flag that is wrong at serving time. The training side already had the correct flag; the mismatch was on the serving side.
- Shorten the forecast horizon so fewer future dates need a holiday flag. ::no None of these touch the actual cause. The Diwali miss happened because training and serving read two different holiday flags for the same date, so the fix has to be a single calendar table both sides read, not a bigger model, more data, or a shorter horizon.

=== step === tryit
## Your turn: catch the misaligned join

`holidays_shifted` is already in your session, every one of its dates one day later than it should be, the shape of a timezone bug. Repair it: build `holidays_fixed` by moving each date back by 1 day, then confirm that 2023-11-12 is flagged as a holiday for India again.

```r
# holidays_shifted already exists, with every date shifted one day too late
# Build holidays_fixed by moving each date in holidays_shifted back by 1 day


# Then join holidays_fixed onto calendar and countries, and check is_holiday for IN on 2023-11-12


```
::check {"regex": "(?=.*holidays_fixed)(?=.*date\\s*[-]\\s*1)(?=.*is_holiday)", "gate": true, "difficulty": "intermediate", "ok": "Right: shifting every date back by 1 day puts Diwali's flag back on 2023-11-12, exactly where it belongs.", "no": "Build holidays_fixed with mutate(date = date - 1) on holidays_shifted, then join it onto calendar and countries the same way the earlier steps did, and check is_holiday for IN on 2023-11-12."}
::solution
```r
# Shift every date in holidays_shifted back by 1 day to repair it, then re-check 2023-11-12
holidays_fixed <- holidays_shifted %>% mutate(date = date - 1)

calendar %>%
  cross_join(countries) %>%
  left_join(holidays_fixed, by = c("country", "date")) %>%
  mutate(is_holiday = !is.na(holiday_name)) %>%
  filter(country == "IN", date == as.Date("2023-11-12")) %>%
  pull(is_holiday)
#> [1] TRUE
```

`holidays_fixed` moves every date back by exactly the one day `holidays_shifted` had added, which lines Diwali back up with 2023-11-12. Joined onto `calendar` and `countries` the same way as before, `is_holiday` comes back TRUE for India on that date, right where it started.

=== step === concept
## References

- [Feast documentation, "What is a feature store"](https://docs.feast.dev/) - Feast project. The offline/online split this lesson's calendar table follows.
- [Rules of Machine Learning: Best Practices for ML Engineering, Rule 29](https://developers.google.com/machine-learning/guides/rules-of-ml) - Zinkevich, M., Google. The rule on training-serving skew.
- [Michelangelo: Uber's Machine Learning Platform](https://www.uber.com/blog/michelangelo-machine-learning-platform/) - Uber Engineering. A production feature store built at scale.
- [Prophet documentation, "Seasonality, Holiday Effects, And Regressors"](https://facebook.github.io/prophet/docs/seasonality,_holiday_effects,_and_regressors.html) - Meta. How a forecasting library represents country and date-specific holidays.
- [lubridate package documentation](https://lubridate.tidyverse.org/) - the `wday()`, `month()`, and `yday()` functions used to build the calendar table.

=== step === complete
## Where this fits in a production forecasting system

By the end of this lesson, you can name the fix behind Northbay's Diwali miss in a production system's own vocabulary.

- A **calendar table**: one row per date, with day-of-week, weekend, and month computed once, built from `calendar`, read identically by every consumer.
- A **holidays table**: country and date together as the join key, holding each moving holiday's real date for every year it occurs, never a day-of-year shortcut.
- The two joined by `(country, date)`, exactly as `calendar`, `countries`, and `holidays` were joined throughout this lesson.
- Both written once to an offline store and mirrored to an online store for fast lookups, so training and serving read the same values and can never disagree about them again.

That is the whole pattern a feature store exists to provide: not a bigger model, not more data, just one calendar table and one holidays table, computed once and read everywhere the same way.
