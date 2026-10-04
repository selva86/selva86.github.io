---
title: "Production Forecasting Lesson 5: Forecasting thousands of series with fable"
catalog_blurb: "How one line of code fits a model to thousands of series at once."
description: "Fitting one model to one series is easy. Learn how fable fits thousands of series at once, how time and memory scale, and how one failed series is handled."
keywords: "fable, fabletools, time series forecasting, batch forecasting, mable, model fitting across keys, accuracy summary, forecast portfolio at scale, tsibble, R"
post_type: "LESSON"
curriculum_id: "5.160.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-production"
course_title: "Production Forecasting"
course_lesson: "5"
course_total: "6"
course_landing: "Production-Forecasting-Course.html"
course_next: "Deploying-a-Forecasting-Service.html"
course_prev: "Feature-Stores-for-Calendars-and-Events.html"
---

=== step === cover
## Forecasting thousands of series with fable

Today let's understand what changes when a forecasting job stops being about one series and becomes about a few thousand of them at once.

Australia's Bureau of Statistics publishes monthly retail turnover for every industry in every state. Below are 2 real years of that turnover, in millions of Australian dollars, for 8 Victorian retail industries: cafes and restaurants, takeaway food services on its own, food retailing, household goods, clothing and footwear, liquor, newspapers and books, and department stores.

::widget facet-grid {"data":[{"x":1,"y":861.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":2,"y":753.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":3,"y":868.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":4,"y":859.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":5,"y":845.2,"facet":"Cafes, restaurants and takeaway food services"},{"x":6,"y":828.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":7,"y":857.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":8,"y":874.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":9,"y":872.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":10,"y":917.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":11,"y":925.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":12,"y":1008.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":13,"y":887.3,"facet":"Cafes, restaurants and takeaway food services"},{"x":14,"y":810.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":15,"y":909.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":16,"y":898.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":17,"y":866.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":18,"y":873.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":19,"y":916.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":20,"y":943.8,"facet":"Cafes, restaurants and takeaway food services"},{"x":21,"y":933.8,"facet":"Cafes, restaurants and takeaway food services"},{"x":22,"y":960,"facet":"Cafes, restaurants and takeaway food services"},{"x":23,"y":981.8,"facet":"Cafes, restaurants and takeaway food services"},{"x":24,"y":1066.2,"facet":"Cafes, restaurants and takeaway food services"},{"x":1,"y":505.4,"facet":"Clothing, footwear and personal accessory retailing"},{"x":2,"y":432.4,"facet":"Clothing, footwear and personal accessory retailing"},{"x":3,"y":512.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":4,"y":547.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":5,"y":579.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":6,"y":551.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":7,"y":512.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":8,"y":503.1,"facet":"Clothing, footwear and personal accessory retailing"},{"x":9,"y":503,"facet":"Clothing, footwear and personal accessory retailing"},{"x":10,"y":530.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":11,"y":593.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":12,"y":888.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":13,"y":521.5,"facet":"Clothing, footwear and personal accessory retailing"},{"x":14,"y":466.6,"facet":"Clothing, footwear and personal accessory retailing"},{"x":15,"y":552.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":16,"y":570.5,"facet":"Clothing, footwear and personal accessory retailing"},{"x":17,"y":610.6,"facet":"Clothing, footwear and personal accessory retailing"},{"x":18,"y":598.5,"facet":"Clothing, footwear and personal accessory retailing"},{"x":19,"y":542.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":20,"y":544.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":21,"y":535.4,"facet":"Clothing, footwear and personal accessory retailing"},{"x":22,"y":598.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":23,"y":655.1,"facet":"Clothing, footwear and personal accessory retailing"},{"x":24,"y":954.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":1,"y":360.3,"facet":"Department stores"},{"x":2,"y":276.6,"facet":"Department stores"},{"x":3,"y":343.5,"facet":"Department stores"},{"x":4,"y":391.9,"facet":"Department stores"},{"x":5,"y":371.3,"facet":"Department stores"},{"x":6,"y":390.7,"facet":"Department stores"},{"x":7,"y":362.6,"facet":"Department stores"},{"x":8,"y":320.5,"facet":"Department stores"},{"x":9,"y":345.2,"facet":"Department stores"},{"x":10,"y":384.2,"facet":"Department stores"},{"x":11,"y":436.7,"facet":"Department stores"},{"x":12,"y":716.5,"facet":"Department stores"},{"x":13,"y":354.3,"facet":"Department stores"},{"x":14,"y":277.8,"facet":"Department stores"},{"x":15,"y":364.9,"facet":"Department stores"},{"x":16,"y":370.1,"facet":"Department stores"},{"x":17,"y":389.5,"facet":"Department stores"},{"x":18,"y":396.5,"facet":"Department stores"},{"x":19,"y":356.5,"facet":"Department stores"},{"x":20,"y":335,"facet":"Department stores"},{"x":21,"y":349.3,"facet":"Department stores"},{"x":22,"y":382.6,"facet":"Department stores"},{"x":23,"y":437,"facet":"Department stores"},{"x":24,"y":723.7,"facet":"Department stores"},{"x":1,"y":2547.8,"facet":"Food retailing"},{"x":2,"y":2350.6,"facet":"Food retailing"},{"x":3,"y":2580.6,"facet":"Food retailing"},{"x":4,"y":2501.5,"facet":"Food retailing"},{"x":5,"y":2469.6,"facet":"Food retailing"},{"x":6,"y":2376.6,"facet":"Food retailing"},{"x":7,"y":2478.6,"facet":"Food retailing"},{"x":8,"y":2509.5,"facet":"Food retailing"},{"x":9,"y":2490.6,"facet":"Food retailing"},{"x":10,"y":2609.6,"facet":"Food retailing"},{"x":11,"y":2661.3,"facet":"Food retailing"},{"x":12,"y":3089.1,"facet":"Food retailing"},{"x":13,"y":2615.9,"facet":"Food retailing"},{"x":14,"y":2424.8,"facet":"Food retailing"},{"x":15,"y":2766.1,"facet":"Food retailing"},{"x":16,"y":2548.2,"facet":"Food retailing"},{"x":17,"y":2597.4,"facet":"Food retailing"},{"x":18,"y":2495.9,"facet":"Food retailing"},{"x":19,"y":2575.2,"facet":"Food retailing"},{"x":20,"y":2639.7,"facet":"Food retailing"},{"x":21,"y":2629.8,"facet":"Food retailing"},{"x":22,"y":2754.6,"facet":"Food retailing"},{"x":23,"y":2769.5,"facet":"Food retailing"},{"x":24,"y":3242.9,"facet":"Food retailing"},{"x":1,"y":1173,"facet":"Household goods retailing"},{"x":2,"y":1035.8,"facet":"Household goods retailing"},{"x":3,"y":1120.9,"facet":"Household goods retailing"},{"x":4,"y":1065,"facet":"Household goods retailing"},{"x":5,"y":1140.1,"facet":"Household goods retailing"},{"x":6,"y":1220,"facet":"Household goods retailing"},{"x":7,"y":1148.2,"facet":"Household goods retailing"},{"x":8,"y":1135.6,"facet":"Household goods retailing"},{"x":9,"y":1143.6,"facet":"Household goods retailing"},{"x":10,"y":1235.3,"facet":"Household goods retailing"},{"x":11,"y":1352.5,"facet":"Household goods retailing"},{"x":12,"y":1622,"facet":"Household goods retailing"},{"x":13,"y":1205.3,"facet":"Household goods retailing"},{"x":14,"y":1101,"facet":"Household goods retailing"},{"x":15,"y":1168,"facet":"Household goods retailing"},{"x":16,"y":1132,"facet":"Household goods retailing"},{"x":17,"y":1179.1,"facet":"Household goods retailing"},{"x":18,"y":1265.5,"facet":"Household goods retailing"},{"x":19,"y":1185.3,"facet":"Household goods retailing"},{"x":20,"y":1190.5,"facet":"Household goods retailing"},{"x":21,"y":1221.4,"facet":"Household goods retailing"},{"x":22,"y":1319.3,"facet":"Household goods retailing"},{"x":23,"y":1401.8,"facet":"Household goods retailing"},{"x":24,"y":1614.5,"facet":"Household goods retailing"},{"x":1,"y":203.2,"facet":"Liquor retailing"},{"x":2,"y":182.8,"facet":"Liquor retailing"},{"x":3,"y":211.9,"facet":"Liquor retailing"},{"x":4,"y":193.6,"facet":"Liquor retailing"},{"x":5,"y":184.8,"facet":"Liquor retailing"},{"x":6,"y":182.4,"facet":"Liquor retailing"},{"x":7,"y":190.7,"facet":"Liquor retailing"},{"x":8,"y":192.3,"facet":"Liquor retailing"},{"x":9,"y":205.7,"facet":"Liquor retailing"},{"x":10,"y":212.4,"facet":"Liquor retailing"},{"x":11,"y":233.3,"facet":"Liquor retailing"},{"x":12,"y":342.9,"facet":"Liquor retailing"},{"x":13,"y":212.4,"facet":"Liquor retailing"},{"x":14,"y":197.3,"facet":"Liquor retailing"},{"x":15,"y":231.9,"facet":"Liquor retailing"},{"x":16,"y":202,"facet":"Liquor retailing"},{"x":17,"y":197.9,"facet":"Liquor retailing"},{"x":18,"y":190.3,"facet":"Liquor retailing"},{"x":19,"y":191.8,"facet":"Liquor retailing"},{"x":20,"y":198,"facet":"Liquor retailing"},{"x":21,"y":207.2,"facet":"Liquor retailing"},{"x":22,"y":218,"facet":"Liquor retailing"},{"x":23,"y":227.8,"facet":"Liquor retailing"},{"x":24,"y":336.8,"facet":"Liquor retailing"},{"x":1,"y":48.7,"facet":"Newspaper and book retailing"},{"x":2,"y":50.3,"facet":"Newspaper and book retailing"},{"x":3,"y":54.2,"facet":"Newspaper and book retailing"},{"x":4,"y":46.3,"facet":"Newspaper and book retailing"},{"x":5,"y":45.1,"facet":"Newspaper and book retailing"},{"x":6,"y":42.2,"facet":"Newspaper and book retailing"},{"x":7,"y":45,"facet":"Newspaper and book retailing"},{"x":8,"y":47.3,"facet":"Newspaper and book retailing"},{"x":9,"y":43.9,"facet":"Newspaper and book retailing"},{"x":10,"y":45.9,"facet":"Newspaper and book retailing"},{"x":11,"y":49.7,"facet":"Newspaper and book retailing"},{"x":12,"y":75.8,"facet":"Newspaper and book retailing"},{"x":13,"y":47.6,"facet":"Newspaper and book retailing"},{"x":14,"y":42.8,"facet":"Newspaper and book retailing"},{"x":15,"y":43.7,"facet":"Newspaper and book retailing"},{"x":16,"y":40.8,"facet":"Newspaper and book retailing"},{"x":17,"y":40.6,"facet":"Newspaper and book retailing"},{"x":18,"y":39.1,"facet":"Newspaper and book retailing"},{"x":19,"y":37.3,"facet":"Newspaper and book retailing"},{"x":20,"y":39.3,"facet":"Newspaper and book retailing"},{"x":21,"y":38.9,"facet":"Newspaper and book retailing"},{"x":22,"y":39.8,"facet":"Newspaper and book retailing"},{"x":23,"y":41.7,"facet":"Newspaper and book retailing"},{"x":24,"y":60.1,"facet":"Newspaper and book retailing"},{"x":1,"y":326.3,"facet":"Takeaway food services"},{"x":2,"y":273.9,"facet":"Takeaway food services"},{"x":3,"y":326.9,"facet":"Takeaway food services"},{"x":4,"y":323.6,"facet":"Takeaway food services"},{"x":5,"y":311.2,"facet":"Takeaway food services"},{"x":6,"y":307.6,"facet":"Takeaway food services"},{"x":7,"y":316.4,"facet":"Takeaway food services"},{"x":8,"y":327.2,"facet":"Takeaway food services"},{"x":9,"y":328.3,"facet":"Takeaway food services"},{"x":10,"y":347.8,"facet":"Takeaway food services"},{"x":11,"y":349.7,"facet":"Takeaway food services"},{"x":12,"y":379.8,"facet":"Takeaway food services"},{"x":13,"y":325.2,"facet":"Takeaway food services"},{"x":14,"y":300.6,"facet":"Takeaway food services"},{"x":15,"y":330.4,"facet":"Takeaway food services"},{"x":16,"y":312.1,"facet":"Takeaway food services"},{"x":17,"y":319.8,"facet":"Takeaway food services"},{"x":18,"y":324.1,"facet":"Takeaway food services"},{"x":19,"y":349.4,"facet":"Takeaway food services"},{"x":20,"y":355.7,"facet":"Takeaway food services"},{"x":21,"y":356.9,"facet":"Takeaway food services"},{"x":22,"y":359.2,"facet":"Takeaway food services"},{"x":23,"y":354.9,"facet":"Takeaway food services"},{"x":24,"y":393.2,"facet":"Takeaway food services"}],"geom":"line","x":"month","y":"turnover","facetVar":"industry"}

Overlaid on one chart, the 8 lines tangle into one mess. Food retailing and household goods run in the thousands while newspapers and books runs in the tens, so on a shared scale the smaller industries flatten into near-straight lines near the bottom and you cannot read any of their shape. Toggle to small multiples and each industry gets its own panel with its own scale, and now every one of the 8 reads on its own.

=== step === concept
## One model() call, a model for every key

In a tsibble, the **key** is the column that says which rows belong to the same series. The lesson's data comes from `tsibbledata::aus_retail`, Australia's real monthly retail turnover by state and industry, and its key is `Industry`: every row that shares an industry name is one series.

Build the batch this lesson uses throughout: 8 real retail industries in Victoria, from January 2010 to December 2018. That is 108 months for each industry, 864 rows in total.

```r
# Build the 8-industry Victorian retail panel, keyed by Industry
library(fabletools)
library(fable)
library(tsibble)
library(tsibbledata)
library(dplyr)

retail_vic <- tsibbledata::aus_retail |>
  filter(
    State == "Victoria",
    Industry %in% c(
      "Cafes, restaurants and takeaway food services",
      "Takeaway food services",
      "Food retailing",
      "Household goods retailing",
      "Clothing, footwear and personal accessory retailing",
      "Liquor retailing",
      "Newspaper and book retailing",
      "Department stores"
    ),
    Month >= yearmonth("2010 Jan"),
    Month <= yearmonth("2018 Dec")
  ) |>
  as_tibble() |>
  select(Month, State, Industry, Turnover) |>
  as_tsibble(index = Month, key = Industry)

key(retail_vic)
#> [[1]]
#> Industry

n_keys(retail_vic)
#> [1] 8
nrow(retail_vic)
#> [1] 864
```

`key()` confirms the series are split by `Industry`, `n_keys()` says there are 8 of them, and `nrow()` confirms 864 rows: 8 industries times 108 months.

Now fit one ETS model to every one of those 8 industries, with a single call to `model()`.

```r
# Fit one ETS model to every one of the 8 keys, with a single call to model()
fit1 <- retail_vic |> model(ets = ETS(Turnover))
fit1
#> # A mable: 8 x 2
#> # Key:     Industry [8]
#>   Industry                                                      ets
#>   <chr>                                                     <model>
#> 1 Cafes, restaurants and takeaway food services        <ETS(A,A,A)>
#> 2 Clothing, footwear and personal accessory retailing  <ETS(M,A,M)>
#> 3 Department stores                                    <ETS(M,N,M)>
#> 4 Food retailing                                      <ETS(M,Ad,M)>
#> 5 Household goods retailing                            <ETS(M,A,A)>
#> 6 Liquor retailing                                    <ETS(M,Ad,M)>
#> 7 Newspaper and book retailing                         <ETS(M,A,M)>
#> 8 Takeaway food services                               <ETS(A,N,A)>
```

fabletools calls this result a **mable**, short for "model table." It has one row per key and one column per model you asked for, here just `ets`. Look down that column: 6 different ETS specifications turn up across the 8 industries, because `ETS()` searches for the best error, trend and season combination separately for each series, from that series' own data.

That is the whole mechanism of fitting at scale: one call to `model()`, one fit per key, and the result comes back as one row per key. Nothing about the code changes whether there are 8 keys or 8,000.

=== step === concept
## How many models are you actually fitting?

Add a second model to the same call: `SNAIVE()`, a seasonal naive benchmark that just repeats last year's value for the same month. Fit both to the same 8 industries at once.

```r
# Fit ETS and a seasonal naive benchmark together, across the same 8 keys
fit2 <- retail_vic |> model(ets = ETS(Turnover), snaive = SNAIVE(Turnover))
fit2
#> # A mable: 8 x 3
#> # Key:     Industry [8]
#>   Industry                                                      ets   snaive
#>   <chr>                                                     <model>  <model>
#> 1 Cafes, restaurants and takeaway food services        <ETS(A,A,A)> <SNAIVE>
#> 2 Clothing, footwear and personal accessory retailing  <ETS(M,A,M)> <SNAIVE>
#> 3 Department stores                                    <ETS(M,N,M)> <SNAIVE>
#> 4 Food retailing                                      <ETS(M,Ad,M)> <SNAIVE>
#> 5 Household goods retailing                            <ETS(M,A,A)> <SNAIVE>
#> 6 Liquor retailing                                    <ETS(M,Ad,M)> <SNAIVE>
#> 7 Newspaper and book retailing                         <ETS(M,A,M)> <SNAIVE>
#> 8 Takeaway food services                               <ETS(A,N,A)> <SNAIVE>
```

The mable is still 8 rows, one per key, exactly as before. But it now carries 2 model columns instead of 1. Count the models actually fit inside that one call, not the mable's rows:

```r
# 8 industries times 2 model specs: the fits that one model() call just ran
8 * 2
#> [1] 16
```

8 industries times 2 model specs is 16 separate model fits that happened inside that single call to `model()`, not 8. Add a third model spec and the same call would fit 24 models, still in one line of code and one mable.

=== step === concept
## How long does fitting a portfolio actually take?

`system.time()` reports how long a piece of code actually took to run; its `elapsed` column is the real wall-clock time. Wrap the last step's `model()` call in it.

```r
# Time the 16-fit call: 8 keys x 2 models (ets, snaive)
t <- system.time(
  retail_vic |> model(ets = ETS(Turnover), snaive = SNAIVE(Turnover))
)
t
#>    user  system elapsed 
#>    7.92    0.15    8.14 
```

That batch of 16 fits took 8.14 seconds of elapsed time on the machine that ran it. Victoria's 8 industries are a toy portfolio. A national retailer, or a utility with a meter in every suburb, can easily have 2,000 series to refit on a schedule, which is 250 times as many keys as this call just handled (2,000 / 8 = 250). Fitting that larger portfolio means running the exact same call, with `retail_vic` swapped out for a 2,000-key tsibble; nothing else in the code changes.

```r
# Project the measured time onto a 2,000-key portfolio: 250x as many keys
elapsed_8_keys <- t[["elapsed"]]
elapsed_8_keys * 250
#> [1] 2035
(elapsed_8_keys * 250) / 60
#> [1] 33.91667
```

Multiply the measured 8.14 seconds by that same 250 and the 2,000-key batch would take about 2,035 seconds, a little over half an hour, for the identical call.

[NOTE]
Your own seconds will differ from these: timing depends on the machine and on how many candidate models `ETS()` searches through for each series. The 250x projection is just multiplication, and that logic holds regardless of the absolute number you start from.

=== step === concept
## What grows in memory, and the lever to pull

Fitting more models costs time. It also costs memory, because every fitted model, for every key, stays inside the mable until you do something else with it. Compare `fit1` (8 keys, 1 model column) against `fit2` (the same 8 keys, with `snaive` added).

```r
# Compare the memory footprint of 1 model column against 2, for the same 8 keys
object.size(fit1)
#> 400920 bytes
format(object.size(fit1), units = "KB")
#> [1] "391.5 Kb"

object.size(fit2)
#> 533192 bytes
format(object.size(fit2), units = "KB")
#> [1] "520.7 Kb"

as.numeric(object.size(fit2)) / as.numeric(object.size(fit1))
#> [1] 1.329921
```

Adding the second model column grows the mable from 391.5 Kb to 520.7 Kb, a factor of about 1.33, not 2. The reason is that a fitted SNAIVE model is a far lighter object than a fitted ETS model: ETS stores estimated level, trend and season states across all 108 months, while SNAIVE only needs last year's 12 seasonal values. Doubling the number of models you ask for does not double the memory, because the models you add are not the same weight.

That gives you 2 practical levers for keeping a large portfolio's memory in check.

1. Fit only the models you actually intend to use. A model column you never read from again still costs memory for every key, whether it is light like SNAIVE or heavy like ETS.
2. Once `forecast()` or `accuracy()` has pulled out what you need, drop the mable itself rather than holding every fitted model, for every key, in memory at once.

=== step === quiz
## Quick check: what grows as the portfolio grows

`retail_vic` has 8 keys, and you just fit 2 models to each of them. Which statement correctly describes what happens to elapsed time and to the mable's memory as both the number of keys and the number of models grow?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Time and memory both double whenever the number of models doubles, no matter which models they are. ::no
- Elapsed time scales with the number of individual fits, keys times models, but the mable's memory depends on the keys and on how heavy each added model actually is, not simply on how many models you asked for. ::ok Exactly. Every fit costs time regardless of weight, which is why keys times models is the right count for time. Memory is different: a light model barely moves the mable's size even though it was fit for every key, which is exactly what you measured between fit1 and fit2.
- Time grows with more fits, but memory does not, because each fitted model is discarded once model() returns. ::no
- Only the number of keys affects memory; which models you ask for makes no difference. ::no Not quite. Every fitted model for every key stays inside the mable until you do something else with it, so model count is not free, and which models you choose matters: a light model like SNAIVE barely moves the mable's size, while a heavy one like ETS moves it a lot, even at the same key count. Elapsed time scales with keys times models; memory scales with keys and with how heavy each model you added actually is.

=== step === concept
## A key with nothing to fit

Real portfolios are not always this clean. A new industry code can exist in the data with no history behind it yet, or a sensor can have been offline for its entire life. Add exactly that kind of key to the batch: a ninth industry, Online-only retailing, with the same 108 months as every other key, but every single month's `Turnover` set to missing.

```r
# Add a ninth key with no usable data at all: every month is missing
extra_key <- retail_vic |>
  as_tibble() |>
  filter(Industry == "Department stores") |>
  mutate(Industry = "Online-only retailing", Turnover = NA_real_) |>
  select(Month, State, Industry, Turnover)

retail_batch <- bind_rows(as_tibble(retail_vic), extra_key) |>
  as_tsibble(index = Month, key = Industry)

n_keys(retail_batch)
#> [1] 9
nrow(retail_batch)
#> [1] 972
```

Fit the same 2 models again, across all 9 keys this time.

```r
# Fit ETS and SNAIVE across all 9 keys, including the one with no data at all
fit_batch <- retail_batch |> model(ets = ETS(Turnover), snaive = SNAIVE(Turnover))
#> Warning messages:
#> 1: In min(y, na.rm = TRUE) :
#>   no non-missing arguments to min; returning Inf
#> 2: 1 error encountered for ets
#> [1] all times contain an NA
#> 3: 1 error encountered for snaive
#> [1] All observations are missing, a model cannot be estimated without data.

fit_batch
#> # A mable: 9 x 3
#> # Key:     Industry [9]
#>   Industry                                                      ets       snaive
#>   <chr>                                                     <model>      <model>
#> 1 Cafes, restaurants and takeaway food services        <ETS(A,A,A)>     <SNAIVE>
#> 2 Clothing, footwear and personal accessory retailing  <ETS(M,A,M)>     <SNAIVE>
#> 3 Department stores                                    <ETS(M,N,M)>     <SNAIVE>
#> 4 Food retailing                                      <ETS(M,Ad,M)>     <SNAIVE>
#> 5 Household goods retailing                            <ETS(M,A,A)>     <SNAIVE>
#> 6 Liquor retailing                                    <ETS(M,Ad,M)>     <SNAIVE>
#> 7 Newspaper and book retailing                         <ETS(M,A,M)>     <SNAIVE>
#> 8 Online-only retailing                                <NULL model> <NULL model>
#> 9 Takeaway food services                               <ETS(A,N,A)>     <SNAIVE>
```

`model()` does not stop and it does not crash. It prints 2 warnings about the failure, one for each model spec that could not be fit: "1 error encountered for ets" and "1 error encountered for snaive", each followed by the reason fable gave internally. You will also see a smaller, unrelated warning from a range check that runs before fable gives up; ignore it. Notice what the 2 warnings do not tell you: which key failed. They name the model, not the key.

The mable still comes back with 9 rows, one per key, exactly as you would expect. The first 8 industries' `ets` and `snaive` cells are untouched, the same specifications as before, because `retail_batch`'s first 8 keys are exactly `retail_vic`'s 8 keys. Only row 8, Online-only retailing, is different: both its model cells hold `<NULL model>`, fable's way of recording that a fit was attempted and failed, for that key, for that model. A null model is not a crash, and it is not a literal missing value either, so you cannot find it by filtering `retail_batch` or `fit_batch` for a missing cell. `accuracy()` is what finds it, next.

See the missing key for yourself: the same small multiples as the cover, with the ninth key, Online-only retailing, added.

::widget facet-grid {"data":[{"x":1,"y":861.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":2,"y":753.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":3,"y":868.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":4,"y":859.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":5,"y":845.2,"facet":"Cafes, restaurants and takeaway food services"},{"x":6,"y":828.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":7,"y":857.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":8,"y":874.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":9,"y":872.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":10,"y":917.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":11,"y":925.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":12,"y":1008.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":13,"y":887.3,"facet":"Cafes, restaurants and takeaway food services"},{"x":14,"y":810.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":15,"y":909.7,"facet":"Cafes, restaurants and takeaway food services"},{"x":16,"y":898.6,"facet":"Cafes, restaurants and takeaway food services"},{"x":17,"y":866.4,"facet":"Cafes, restaurants and takeaway food services"},{"x":18,"y":873.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":19,"y":916.1,"facet":"Cafes, restaurants and takeaway food services"},{"x":20,"y":943.8,"facet":"Cafes, restaurants and takeaway food services"},{"x":21,"y":933.8,"facet":"Cafes, restaurants and takeaway food services"},{"x":22,"y":960,"facet":"Cafes, restaurants and takeaway food services"},{"x":23,"y":981.8,"facet":"Cafes, restaurants and takeaway food services"},{"x":24,"y":1066.2,"facet":"Cafes, restaurants and takeaway food services"},{"x":1,"y":505.4,"facet":"Clothing, footwear and personal accessory retailing"},{"x":2,"y":432.4,"facet":"Clothing, footwear and personal accessory retailing"},{"x":3,"y":512.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":4,"y":547.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":5,"y":579.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":6,"y":551.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":7,"y":512.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":8,"y":503.1,"facet":"Clothing, footwear and personal accessory retailing"},{"x":9,"y":503,"facet":"Clothing, footwear and personal accessory retailing"},{"x":10,"y":530.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":11,"y":593.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":12,"y":888.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":13,"y":521.5,"facet":"Clothing, footwear and personal accessory retailing"},{"x":14,"y":466.6,"facet":"Clothing, footwear and personal accessory retailing"},{"x":15,"y":552.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":16,"y":570.5,"facet":"Clothing, footwear and personal accessory retailing"},{"x":17,"y":610.6,"facet":"Clothing, footwear and personal accessory retailing"},{"x":18,"y":598.5,"facet":"Clothing, footwear and personal accessory retailing"},{"x":19,"y":542.8,"facet":"Clothing, footwear and personal accessory retailing"},{"x":20,"y":544.7,"facet":"Clothing, footwear and personal accessory retailing"},{"x":21,"y":535.4,"facet":"Clothing, footwear and personal accessory retailing"},{"x":22,"y":598.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":23,"y":655.1,"facet":"Clothing, footwear and personal accessory retailing"},{"x":24,"y":954.9,"facet":"Clothing, footwear and personal accessory retailing"},{"x":1,"y":360.3,"facet":"Department stores"},{"x":2,"y":276.6,"facet":"Department stores"},{"x":3,"y":343.5,"facet":"Department stores"},{"x":4,"y":391.9,"facet":"Department stores"},{"x":5,"y":371.3,"facet":"Department stores"},{"x":6,"y":390.7,"facet":"Department stores"},{"x":7,"y":362.6,"facet":"Department stores"},{"x":8,"y":320.5,"facet":"Department stores"},{"x":9,"y":345.2,"facet":"Department stores"},{"x":10,"y":384.2,"facet":"Department stores"},{"x":11,"y":436.7,"facet":"Department stores"},{"x":12,"y":716.5,"facet":"Department stores"},{"x":13,"y":354.3,"facet":"Department stores"},{"x":14,"y":277.8,"facet":"Department stores"},{"x":15,"y":364.9,"facet":"Department stores"},{"x":16,"y":370.1,"facet":"Department stores"},{"x":17,"y":389.5,"facet":"Department stores"},{"x":18,"y":396.5,"facet":"Department stores"},{"x":19,"y":356.5,"facet":"Department stores"},{"x":20,"y":335,"facet":"Department stores"},{"x":21,"y":349.3,"facet":"Department stores"},{"x":22,"y":382.6,"facet":"Department stores"},{"x":23,"y":437,"facet":"Department stores"},{"x":24,"y":723.7,"facet":"Department stores"},{"x":1,"y":2547.8,"facet":"Food retailing"},{"x":2,"y":2350.6,"facet":"Food retailing"},{"x":3,"y":2580.6,"facet":"Food retailing"},{"x":4,"y":2501.5,"facet":"Food retailing"},{"x":5,"y":2469.6,"facet":"Food retailing"},{"x":6,"y":2376.6,"facet":"Food retailing"},{"x":7,"y":2478.6,"facet":"Food retailing"},{"x":8,"y":2509.5,"facet":"Food retailing"},{"x":9,"y":2490.6,"facet":"Food retailing"},{"x":10,"y":2609.6,"facet":"Food retailing"},{"x":11,"y":2661.3,"facet":"Food retailing"},{"x":12,"y":3089.1,"facet":"Food retailing"},{"x":13,"y":2615.9,"facet":"Food retailing"},{"x":14,"y":2424.8,"facet":"Food retailing"},{"x":15,"y":2766.1,"facet":"Food retailing"},{"x":16,"y":2548.2,"facet":"Food retailing"},{"x":17,"y":2597.4,"facet":"Food retailing"},{"x":18,"y":2495.9,"facet":"Food retailing"},{"x":19,"y":2575.2,"facet":"Food retailing"},{"x":20,"y":2639.7,"facet":"Food retailing"},{"x":21,"y":2629.8,"facet":"Food retailing"},{"x":22,"y":2754.6,"facet":"Food retailing"},{"x":23,"y":2769.5,"facet":"Food retailing"},{"x":24,"y":3242.9,"facet":"Food retailing"},{"x":1,"y":1173,"facet":"Household goods retailing"},{"x":2,"y":1035.8,"facet":"Household goods retailing"},{"x":3,"y":1120.9,"facet":"Household goods retailing"},{"x":4,"y":1065,"facet":"Household goods retailing"},{"x":5,"y":1140.1,"facet":"Household goods retailing"},{"x":6,"y":1220,"facet":"Household goods retailing"},{"x":7,"y":1148.2,"facet":"Household goods retailing"},{"x":8,"y":1135.6,"facet":"Household goods retailing"},{"x":9,"y":1143.6,"facet":"Household goods retailing"},{"x":10,"y":1235.3,"facet":"Household goods retailing"},{"x":11,"y":1352.5,"facet":"Household goods retailing"},{"x":12,"y":1622,"facet":"Household goods retailing"},{"x":13,"y":1205.3,"facet":"Household goods retailing"},{"x":14,"y":1101,"facet":"Household goods retailing"},{"x":15,"y":1168,"facet":"Household goods retailing"},{"x":16,"y":1132,"facet":"Household goods retailing"},{"x":17,"y":1179.1,"facet":"Household goods retailing"},{"x":18,"y":1265.5,"facet":"Household goods retailing"},{"x":19,"y":1185.3,"facet":"Household goods retailing"},{"x":20,"y":1190.5,"facet":"Household goods retailing"},{"x":21,"y":1221.4,"facet":"Household goods retailing"},{"x":22,"y":1319.3,"facet":"Household goods retailing"},{"x":23,"y":1401.8,"facet":"Household goods retailing"},{"x":24,"y":1614.5,"facet":"Household goods retailing"},{"x":1,"y":203.2,"facet":"Liquor retailing"},{"x":2,"y":182.8,"facet":"Liquor retailing"},{"x":3,"y":211.9,"facet":"Liquor retailing"},{"x":4,"y":193.6,"facet":"Liquor retailing"},{"x":5,"y":184.8,"facet":"Liquor retailing"},{"x":6,"y":182.4,"facet":"Liquor retailing"},{"x":7,"y":190.7,"facet":"Liquor retailing"},{"x":8,"y":192.3,"facet":"Liquor retailing"},{"x":9,"y":205.7,"facet":"Liquor retailing"},{"x":10,"y":212.4,"facet":"Liquor retailing"},{"x":11,"y":233.3,"facet":"Liquor retailing"},{"x":12,"y":342.9,"facet":"Liquor retailing"},{"x":13,"y":212.4,"facet":"Liquor retailing"},{"x":14,"y":197.3,"facet":"Liquor retailing"},{"x":15,"y":231.9,"facet":"Liquor retailing"},{"x":16,"y":202,"facet":"Liquor retailing"},{"x":17,"y":197.9,"facet":"Liquor retailing"},{"x":18,"y":190.3,"facet":"Liquor retailing"},{"x":19,"y":191.8,"facet":"Liquor retailing"},{"x":20,"y":198,"facet":"Liquor retailing"},{"x":21,"y":207.2,"facet":"Liquor retailing"},{"x":22,"y":218,"facet":"Liquor retailing"},{"x":23,"y":227.8,"facet":"Liquor retailing"},{"x":24,"y":336.8,"facet":"Liquor retailing"},{"x":1,"y":48.7,"facet":"Newspaper and book retailing"},{"x":2,"y":50.3,"facet":"Newspaper and book retailing"},{"x":3,"y":54.2,"facet":"Newspaper and book retailing"},{"x":4,"y":46.3,"facet":"Newspaper and book retailing"},{"x":5,"y":45.1,"facet":"Newspaper and book retailing"},{"x":6,"y":42.2,"facet":"Newspaper and book retailing"},{"x":7,"y":45,"facet":"Newspaper and book retailing"},{"x":8,"y":47.3,"facet":"Newspaper and book retailing"},{"x":9,"y":43.9,"facet":"Newspaper and book retailing"},{"x":10,"y":45.9,"facet":"Newspaper and book retailing"},{"x":11,"y":49.7,"facet":"Newspaper and book retailing"},{"x":12,"y":75.8,"facet":"Newspaper and book retailing"},{"x":13,"y":47.6,"facet":"Newspaper and book retailing"},{"x":14,"y":42.8,"facet":"Newspaper and book retailing"},{"x":15,"y":43.7,"facet":"Newspaper and book retailing"},{"x":16,"y":40.8,"facet":"Newspaper and book retailing"},{"x":17,"y":40.6,"facet":"Newspaper and book retailing"},{"x":18,"y":39.1,"facet":"Newspaper and book retailing"},{"x":19,"y":37.3,"facet":"Newspaper and book retailing"},{"x":20,"y":39.3,"facet":"Newspaper and book retailing"},{"x":21,"y":38.9,"facet":"Newspaper and book retailing"},{"x":22,"y":39.8,"facet":"Newspaper and book retailing"},{"x":23,"y":41.7,"facet":"Newspaper and book retailing"},{"x":24,"y":60.1,"facet":"Newspaper and book retailing"},{"x":1,"y":326.3,"facet":"Takeaway food services"},{"x":2,"y":273.9,"facet":"Takeaway food services"},{"x":3,"y":326.9,"facet":"Takeaway food services"},{"x":4,"y":323.6,"facet":"Takeaway food services"},{"x":5,"y":311.2,"facet":"Takeaway food services"},{"x":6,"y":307.6,"facet":"Takeaway food services"},{"x":7,"y":316.4,"facet":"Takeaway food services"},{"x":8,"y":327.2,"facet":"Takeaway food services"},{"x":9,"y":328.3,"facet":"Takeaway food services"},{"x":10,"y":347.8,"facet":"Takeaway food services"},{"x":11,"y":349.7,"facet":"Takeaway food services"},{"x":12,"y":379.8,"facet":"Takeaway food services"},{"x":13,"y":325.2,"facet":"Takeaway food services"},{"x":14,"y":300.6,"facet":"Takeaway food services"},{"x":15,"y":330.4,"facet":"Takeaway food services"},{"x":16,"y":312.1,"facet":"Takeaway food services"},{"x":17,"y":319.8,"facet":"Takeaway food services"},{"x":18,"y":324.1,"facet":"Takeaway food services"},{"x":19,"y":349.4,"facet":"Takeaway food services"},{"x":20,"y":355.7,"facet":"Takeaway food services"},{"x":21,"y":356.9,"facet":"Takeaway food services"},{"x":22,"y":359.2,"facet":"Takeaway food services"},{"x":23,"y":354.9,"facet":"Takeaway food services"},{"x":24,"y":393.2,"facet":"Takeaway food services"},{"x":1,"y":null,"facet":"Online-only retailing"},{"x":24,"y":null,"facet":"Online-only retailing"}],"geom":"line","x":"month","y":"turnover","facetVar":"industry"}

The 8 real industries look exactly as they did on the cover. The ninth panel, Online-only retailing, has nothing in it: every month is missing, so there is no line to draw. That blank panel is the same fact you just saw in the mable, drawn instead of printed.

=== step === concept
## Reading an accuracy table as a portfolio

`model()` tells you whether a fit succeeded. `accuracy()` tells you how good the fits that did succeed actually are, measured against each series' own training data. Run it across the whole 9-key, 2-model batch.

```r
# Score every fit in the batch against its own training data
acc_batch <- accuracy(fit_batch)
acc_batch
#> # A tibble: 18 × 11
#>    Industry  .model .type       ME   RMSE    MAE      MPE   MAPE    MASE   RMSSE
#>    <chr>     <chr>  <chr>    <dbl>  <dbl>  <dbl>    <dbl>  <dbl>   <dbl>   <dbl>
#>  1 Cafes, r… ets    Trai…   1.92    18.2   14.8    0.213    1.99   0.391   0.392
#>  2 Cafes, r… snaive Trai…  27.1     46.4   37.7    3.18     4.75   1       1    
#>  3 Clothing… ets    Trai…   1.07    15.8   12.5    0.116    2.42   0.495   0.518
#>  4 Clothing… snaive Trai…  15.9     30.5   25.3    2.79     4.81   1       1    
#>  5 Departme… ets    Trai…   1.68    11.1    9.09   0.253    2.53   0.715   0.669
#>  6 Departme… snaive Trai…   3.96    16.5   12.7    0.929    3.49   1       1    
#>  7 Food ret… ets    Trai…   3.22    30.0   23.6    0.111    1.03   0.253   0.285
#>  8 Food ret… snaive Trai…  93.2    105.    93.4    3.98     3.99   1       1    
#>  9 Househol… ets    Trai…  -0.117   25.9   20.9   -0.0687   2.00   0.415   0.414
#> 10 Househol… snaive Trai…  44.3     62.6   50.4    4.04     4.67   1       1    
#> 11 Liquor r… ets    Trai…   0.0886   5.75   4.42  -0.0526   2.49   0.398   0.435
#> 12 Liquor r… snaive Trai…   9.14    13.2   11.1    4.90     6.10   1       1    
#> 13 Newspape… ets    Trai…  -0.504    5.16   3.47  -1.10     5.15   0.361   0.395
#> 14 Newspape… snaive Trai…  -5.96    13.1    9.61 -11.2     16.5    1       1    
#> 15 Online-o… ets    Trai… NaN      NaN    NaN    NaN      NaN    NaN     NaN    
#> 16 Online-o… snaive Trai… NaN      NaN    NaN    NaN      NaN    NaN     NaN    
#> 17 Takeaway… ets    Trai…   0.585    9.26   7.47   0.123    2.44   0.477   0.490
#> 18 Takeaway… snaive Trai…   4.62    18.9   15.7    1.23     5.06   1       1    
#> # ℹ 1 more variable: ACF1 <dbl>
```

That is 18 rows: 9 keys times 2 models, exactly as you would expect. Look at rows 15 and 16, both Online-only retailing: every error column reads `NaN`, not a literal missing value. `accuracy()` does not drop the key that could not be fit. It still reports a row for it, for both models; it simply has no score to give, because there is no training data to measure a fit against.

Averaging all 18 `MASE` values as they stand would let those 2 `NaN` rows poison the result. The fix is to group by model and average only the fits that actually produced a score.

```r
# Collapse 18 rows to 2: one mean MASE per model, across the keys that fit
portfolio_summary <- acc_batch |>
  group_by(.model) |>
  summarise(mean_mase = mean(MASE, na.rm = TRUE), n_fit = sum(!is.na(MASE)))
portfolio_summary
#> # A tibble: 2 × 3
#>   .model mean_mase n_fit
#>   <chr>      <dbl> <int>
#> 1 ets        0.438     8
#> 2 snaive     1         8
```

Lay that summary out as a report-ready table.

::widget styled-table {"cols":["Model","Mean MASE across the keys that fit","Keys fitted"],"rows":[["ets","0.438","8"],["snaive","1.000","8"]],"title":"Two models, one portfolio summary","note":"mean_mase averages MASE over the 8 industries that actually fit. The 2 NaN rows from Online-only retailing are excluded by na.rm = TRUE, not scored as zero, which is exactly what n_fit = 8, not 9, confirms."}

`na.rm = TRUE` inside `mean()` tells R to skip the 2 `NaN` rows rather than let them poison the average. `n_fit` counts how many keys actually contributed to each mean with `sum(!is.na(MASE))`: 8 for both models, not 9, which confirms the Online-only key was excluded, not scored as if it had hit 0.

`ets`'s mean MASE across the 8 industries that fit is 0.438: on average, ETS's error is 43.8% the size of the seasonal naive benchmark's own error on that industry. `snaive`'s own mean MASE is exactly 1, because MASE always scales a model's error against the seasonal naive's error on the same series, so the seasonal naive's error relative to itself is always 1. A mean MASE of 0.438 against 1 says ETS beats the naive benchmark by more than half, on average, across industries whose monthly turnover ranges from the tens of millions (newspapers and books) to the thousands of millions (food retailing), the same 8 industries shown on the cover.

=== step === tryit
## Your turn: find the failed key, then confirm the summary excludes it

`fit_batch`, from 2 steps back, still holds all 9 keys and both models. Find which key could not be fit, using `accuracy()` and a filter on the column that comes back `NaN` for a failed fit. Then rerun the `group_by(.model) |> summarise()` pipeline from the last step and confirm both models still show `n_fit = 8`, not 9, across 2 summary rows, not 18.

```r
# fit_batch already holds 9 keys x 2 models (ets, snaive) from the step before
# 1. Use accuracy() and a filter on the column that comes back NaN for a
#    fit that failed, to find which key it is
# 2. Rerun the group_by(.model) |> summarise() pipeline and confirm both
#    models still show n_fit = 8, across 2 rows, not 18
# Press Check when you have them.
```
::check {"regex": "filter\\s*[(]\\s*is\\.na[(]\\s*MASE\\s*[)]\\s*[)][\\s\\S]*group_by\\s*[(]\\s*\\.model\\s*[)][\\s\\S]*summarise\\s*[(][\\s\\S]*n_fit", "gate": true, "difficulty": "advanced", "ok": "Right: the 2 failed rows both belong to Online-only retailing, and both models still show n_fit = 8 across just 2 summary rows, not 18, so the failed key never entered either mean.", "no": "Start from accuracy(fit_batch): filter(is.na(MASE)) to see which key the 2 NaN rows belong to, then pipe accuracy(fit_batch) into group_by(.model) |> summarise(mean_mase = mean(MASE, na.rm = TRUE), n_fit = sum(!is.na(MASE))) and check n_fit."}
::solution
```r
# Find which key's rows came back with no score at all
accuracy(fit_batch) |> filter(is.na(MASE))
#> # A tibble: 2 × 11
#>   Industry              .model .type    ME  RMSE   MAE   MPE  MAPE  MASE RMSSE  ACF1
#>   <chr>                 <chr>  <chr> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Online-only retailing ets    Trai…   NaN   NaN   NaN   NaN   NaN   NaN   NaN    NA
#> 2 Online-only retailing snaive Trai…   NaN   NaN   NaN   NaN   NaN   NaN   NaN    NA

accuracy(fit_batch) |>
  group_by(.model) |>
  summarise(mean_mase = mean(MASE, na.rm = TRUE), n_fit = sum(!is.na(MASE)))
#> # A tibble: 2 × 3
#>   .model mean_mase n_fit
#>   <chr>      <dbl> <int>
#> 1 ets        0.438     8
#> 2 snaive     1         8
```

Both NaN rows belong to Online-only retailing, and no other key. The summary comes back as 2 rows, not 18, with `n_fit = 8` for each model, confirming the failed key never entered either mean.

=== step === quiz
## Quick check: summarizing accuracy across a portfolio

The 9-key, 2-model accuracy table came back with 2 `NaN` rows for the key that could not be fit. Which way of summarizing ETS's performance across the portfolio is the right one?

::quiz {"correct":3,"gate":true,"difficulty":"advanced"}
- Find whichever single industry gave ETS its best MASE, and report that number as how well ETS does across the portfolio. ::no
- Average all 9 industries' MASE values for ETS, treating the 2 NaN rows as 0. ::no
- Group by model, then average MASE over only the 8 industries that actually produced a fit, excluding the failed key rather than scoring it. ::ok Right. That is exactly the group_by(.model) |> summarise(mean_mase = mean(MASE, na.rm = TRUE)) pipeline from 2 steps back, and n_fit confirms 8 keys went into that average, not 9.
- Count how many industries ETS beats SNAIVE on versus how many it loses on, and call the model with more wins the better one. ::no A single best key cherry-picks one row out of 8 and hides the rest. Treating the 2 NaN rows as 0 scores a model that was never fit as if it had produced a perfect forecast, which is worse than ignoring it. And counting wins without their margins treats a model that wins by a hair the same as one that wins by a mile. The only sound summary groups by model and averages MASE over the keys that actually fit, which is exactly what n_fit confirms happened.

=== step === concept
## References

- [fable: Forecasting Models for Tidy Time Series](https://fable.tidyverts.org/) - O'Hara-Wild, M., Hyndman, R. and Wang, E. Documentation for `ETS()`, `SNAIVE()` and the rest of fable's model specifications.
- [fabletools package documentation](https://fabletools.tidyverts.org/) - `model()`, `accuracy()` and `glance()`, the verbs this lesson ran across a whole batch of keys at once.
- [tsibbledata::aus_retail](https://tsibbledata.tidyverts.org/reference/aus_retail.html) - the 152-series keyed tsibble this lesson's 8 real Victorian industries come from.
- [Retail Trade, Australia (cat. 8501.0)](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia) - Australian Bureau of Statistics, the source survey behind `aus_retail`.
- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/) - Hyndman, R.J. and Athanasopoulos, G. The chapters on the fable workflow and on forecasting many series at once.

=== step === complete
## What changes, and what doesn't, as a portfolio grows

One call to `model()` is what makes this scale at all. Give it a keyed tsibble and however many model specifications you want, and it fits every model to every key, Victoria's 8 industries or a portfolio of 2,000, with the exact same line of code.

What changes with the portfolio's size is time and memory, and they change for different reasons. Elapsed time scales with the number of individual fits, keys times models, so a portfolio 250 times the size takes roughly 250 times as long. Memory scales with the number of keys and with how heavy each model you add actually is, not simply with how many models you asked for: adding a light model like SNAIVE barely moved the mable in this lesson, while ETS's own weight did most of the work. Fitting only the models you intend to use, and dropping the mable once `forecast()` or `accuracy()` has pulled out what you need, are the 2 levers that keep both in check.

A key with nothing to fit does not take the batch down with it. `model()` prints a warning naming the model that failed, not the key, and leaves a null model in that cell instead of crashing; the other 8 keys' fits are untouched. `accuracy()` still reports a row for the failed key, with `NaN` instead of a score, so it is never silently dropped, nor is it ever scored as if it had fit perfectly. Reading that table as a portfolio means grouping by model and summarizing, the way `group_by(.model) |> summarise(mean_mase = mean(MASE, na.rm = TRUE))` turned 18 rows into 2, rather than reading any of it one row at a time.
