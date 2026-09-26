---
title: "Machine Learning and Deep Forecasting Lesson 1: One global model across many series"
slug: "Global-Models-One-Model-Across-Many-Series"
description: "Forecast 148 Australian retail series with one global model instead of 148 local ones: build lag features in R, fit one lm and score it on 2018 with MAPE."
keywords: "global forecasting models, local vs global models, forecasting many time series, lag features, grouped forecasting model, cross-learning, MAPE, aus_retail, fable, R"
mathjax: false
webr: true
date: "2026-09-27"
post_type: "LESSON"
course_id: "ts-ml"
course_title: "Machine Learning and Deep Forecasting"
course_lesson: "1"
course_total: "7"
course_landing: "Machine-Learning-and-Deep-Forecasting-Course.html"
course_prev: ""
course_next: "Machine-Learning-Forecasting-with-modeltime"
curriculum_id: "5.130.1"
lesson_access: "pro"
catalog_blurb: "When one model for many series forecasts better than a model for each."
---

=== step === cover
## One global model across many series

Today let's see how one model can forecast many series at once, and when that works better than fitting a separate model to each series.

Say you own the monthly turnover forecast for Australian retail. Turnover is the money shops take in during a month, and here it is in A$ million. The data has 8 states and 20 industries, and 148 of the state and industry combinations run through December 2018. Each combination is one series, so you have 148 series to forecast.

That leaves you a choice: fit one model to each series, or fit one model to the rows of all the series together.

The chart below shows one industry, Clothing retailing, in each of the 8 states from January 2016 to December 2018, which is 36 months each.

::widget facet-grid {"data":[{"x":1,"y":19.6,"facet":"Australian Capital Territory"},{"x":2,"y":17.8,"facet":"Australian Capital Territory"},{"x":3,"y":21.8,"facet":"Australian Capital Territory"},{"x":4,"y":23.2,"facet":"Australian Capital Territory"},{"x":5,"y":23.0,"facet":"Australian Capital Territory"},{"x":6,"y":22.9,"facet":"Australian Capital Territory"},{"x":7,"y":20.9,"facet":"Australian Capital Territory"},{"x":8,"y":19.3,"facet":"Australian Capital Territory"},{"x":9,"y":20.2,"facet":"Australian Capital Territory"},{"x":10,"y":21.6,"facet":"Australian Capital Territory"},{"x":11,"y":23.4,"facet":"Australian Capital Territory"},{"x":12,"y":34.7,"facet":"Australian Capital Territory"},{"x":13,"y":21.1,"facet":"Australian Capital Territory"},{"x":14,"y":17.0,"facet":"Australian Capital Territory"},{"x":15,"y":21.4,"facet":"Australian Capital Territory"},{"x":16,"y":23.7,"facet":"Australian Capital Territory"},{"x":17,"y":22.9,"facet":"Australian Capital Territory"},{"x":18,"y":22.0,"facet":"Australian Capital Territory"},{"x":19,"y":19.4,"facet":"Australian Capital Territory"},{"x":20,"y":17.6,"facet":"Australian Capital Territory"},{"x":21,"y":18.8,"facet":"Australian Capital Territory"},{"x":22,"y":19.1,"facet":"Australian Capital Territory"},{"x":23,"y":21.6,"facet":"Australian Capital Territory"},{"x":24,"y":33.0,"facet":"Australian Capital Territory"},{"x":25,"y":21.0,"facet":"Australian Capital Territory"},{"x":26,"y":18.5,"facet":"Australian Capital Territory"},{"x":27,"y":22.0,"facet":"Australian Capital Territory"},{"x":28,"y":22.5,"facet":"Australian Capital Territory"},{"x":29,"y":24.6,"facet":"Australian Capital Territory"},{"x":30,"y":24.5,"facet":"Australian Capital Territory"},{"x":31,"y":22.9,"facet":"Australian Capital Territory"},{"x":32,"y":22.1,"facet":"Australian Capital Territory"},{"x":33,"y":23.4,"facet":"Australian Capital Territory"},{"x":34,"y":24.4,"facet":"Australian Capital Territory"},{"x":35,"y":27.0,"facet":"Australian Capital Territory"},{"x":36,"y":35.5,"facet":"Australian Capital Territory"},{"x":1,"y":468.7,"facet":"New South Wales"},{"x":2,"y":381.1,"facet":"New South Wales"},{"x":3,"y":460.5,"facet":"New South Wales"},{"x":4,"y":488.3,"facet":"New South Wales"},{"x":5,"y":489.8,"facet":"New South Wales"},{"x":6,"y":514.3,"facet":"New South Wales"},{"x":7,"y":460.5,"facet":"New South Wales"},{"x":8,"y":438.4,"facet":"New South Wales"},{"x":9,"y":469.7,"facet":"New South Wales"},{"x":10,"y":479.8,"facet":"New South Wales"},{"x":11,"y":529.3,"facet":"New South Wales"},{"x":12,"y":809.2,"facet":"New South Wales"},{"x":13,"y":494.5,"facet":"New South Wales"},{"x":14,"y":380.3,"facet":"New South Wales"},{"x":15,"y":469.6,"facet":"New South Wales"},{"x":16,"y":491.2,"facet":"New South Wales"},{"x":17,"y":532.1,"facet":"New South Wales"},{"x":18,"y":526.9,"facet":"New South Wales"},{"x":19,"y":473.9,"facet":"New South Wales"},{"x":20,"y":460.5,"facet":"New South Wales"},{"x":21,"y":490.8,"facet":"New South Wales"},{"x":22,"y":507.4,"facet":"New South Wales"},{"x":23,"y":556.2,"facet":"New South Wales"},{"x":24,"y":791.2,"facet":"New South Wales"},{"x":25,"y":521.4,"facet":"New South Wales"},{"x":26,"y":402.9,"facet":"New South Wales"},{"x":27,"y":476.1,"facet":"New South Wales"},{"x":28,"y":475.4,"facet":"New South Wales"},{"x":29,"y":566.1,"facet":"New South Wales"},{"x":30,"y":560.0,"facet":"New South Wales"},{"x":31,"y":483.1,"facet":"New South Wales"},{"x":32,"y":473.9,"facet":"New South Wales"},{"x":33,"y":489.8,"facet":"New South Wales"},{"x":34,"y":524.3,"facet":"New South Wales"},{"x":35,"y":563.8,"facet":"New South Wales"},{"x":36,"y":793.1,"facet":"New South Wales"},{"x":1,"y":7.8,"facet":"Northern Territory"},{"x":2,"y":8.3,"facet":"Northern Territory"},{"x":3,"y":8.2,"facet":"Northern Territory"},{"x":4,"y":8.2,"facet":"Northern Territory"},{"x":5,"y":8.6,"facet":"Northern Territory"},{"x":6,"y":9.2,"facet":"Northern Territory"},{"x":7,"y":10.9,"facet":"Northern Territory"},{"x":8,"y":10.2,"facet":"Northern Territory"},{"x":9,"y":9.7,"facet":"Northern Territory"},{"x":10,"y":9.2,"facet":"Northern Territory"},{"x":11,"y":9.1,"facet":"Northern Territory"},{"x":12,"y":12.0,"facet":"Northern Territory"},{"x":13,"y":7.6,"facet":"Northern Territory"},{"x":14,"y":6.4,"facet":"Northern Territory"},{"x":15,"y":7.2,"facet":"Northern Territory"},{"x":16,"y":7.2,"facet":"Northern Territory"},{"x":17,"y":7.6,"facet":"Northern Territory"},{"x":18,"y":8.5,"facet":"Northern Territory"},{"x":19,"y":9.7,"facet":"Northern Territory"},{"x":20,"y":9.4,"facet":"Northern Territory"},{"x":21,"y":9.1,"facet":"Northern Territory"},{"x":22,"y":8.9,"facet":"Northern Territory"},{"x":23,"y":9.2,"facet":"Northern Territory"},{"x":24,"y":11.5,"facet":"Northern Territory"},{"x":25,"y":7.1,"facet":"Northern Territory"},{"x":26,"y":6.4,"facet":"Northern Territory"},{"x":27,"y":7.1,"facet":"Northern Territory"},{"x":28,"y":7.7,"facet":"Northern Territory"},{"x":29,"y":8.7,"facet":"Northern Territory"},{"x":30,"y":9.4,"facet":"Northern Territory"},{"x":31,"y":10.7,"facet":"Northern Territory"},{"x":32,"y":10.0,"facet":"Northern Territory"},{"x":33,"y":9.0,"facet":"Northern Territory"},{"x":34,"y":9.0,"facet":"Northern Territory"},{"x":35,"y":9.5,"facet":"Northern Territory"},{"x":36,"y":11.8,"facet":"Northern Territory"},{"x":1,"y":220.8,"facet":"Queensland"},{"x":2,"y":175.0,"facet":"Queensland"},{"x":3,"y":195.6,"facet":"Queensland"},{"x":4,"y":207.1,"facet":"Queensland"},{"x":5,"y":211.4,"facet":"Queensland"},{"x":6,"y":233.8,"facet":"Queensland"},{"x":7,"y":240.4,"facet":"Queensland"},{"x":8,"y":226.5,"facet":"Queensland"},{"x":9,"y":242.9,"facet":"Queensland"},{"x":10,"y":240.1,"facet":"Queensland"},{"x":11,"y":242.2,"facet":"Queensland"},{"x":12,"y":394.7,"facet":"Queensland"},{"x":13,"y":237.1,"facet":"Queensland"},{"x":14,"y":171.1,"facet":"Queensland"},{"x":15,"y":198.2,"facet":"Queensland"},{"x":16,"y":208.0,"facet":"Queensland"},{"x":17,"y":213.3,"facet":"Queensland"},{"x":18,"y":230.9,"facet":"Queensland"},{"x":19,"y":237.8,"facet":"Queensland"},{"x":20,"y":225.9,"facet":"Queensland"},{"x":21,"y":239.5,"facet":"Queensland"},{"x":22,"y":229.2,"facet":"Queensland"},{"x":23,"y":255.5,"facet":"Queensland"},{"x":24,"y":390.3,"facet":"Queensland"},{"x":25,"y":236.7,"facet":"Queensland"},{"x":26,"y":180.8,"facet":"Queensland"},{"x":27,"y":216.3,"facet":"Queensland"},{"x":28,"y":222.7,"facet":"Queensland"},{"x":29,"y":240.9,"facet":"Queensland"},{"x":30,"y":252.2,"facet":"Queensland"},{"x":31,"y":247.1,"facet":"Queensland"},{"x":32,"y":241.4,"facet":"Queensland"},{"x":33,"y":247.7,"facet":"Queensland"},{"x":34,"y":260.0,"facet":"Queensland"},{"x":35,"y":286.8,"facet":"Queensland"},{"x":36,"y":399.7,"facet":"Queensland"},{"x":1,"y":61.6,"facet":"South Australia"},{"x":2,"y":52.2,"facet":"South Australia"},{"x":3,"y":59.8,"facet":"South Australia"},{"x":4,"y":68.1,"facet":"South Australia"},{"x":5,"y":66.1,"facet":"South Australia"},{"x":6,"y":67.3,"facet":"South Australia"},{"x":7,"y":68.6,"facet":"South Australia"},{"x":8,"y":59.7,"facet":"South Australia"},{"x":9,"y":60.1,"facet":"South Australia"},{"x":10,"y":61.7,"facet":"South Australia"},{"x":11,"y":64.6,"facet":"South Australia"},{"x":12,"y":101.2,"facet":"South Australia"},{"x":13,"y":60.5,"facet":"South Australia"},{"x":14,"y":49.6,"facet":"South Australia"},{"x":15,"y":61.0,"facet":"South Australia"},{"x":16,"y":67.0,"facet":"South Australia"},{"x":17,"y":70.9,"facet":"South Australia"},{"x":18,"y":66.6,"facet":"South Australia"},{"x":19,"y":68.7,"facet":"South Australia"},{"x":20,"y":61.3,"facet":"South Australia"},{"x":21,"y":64.8,"facet":"South Australia"},{"x":22,"y":65.3,"facet":"South Australia"},{"x":23,"y":71.7,"facet":"South Australia"},{"x":24,"y":105.4,"facet":"South Australia"},{"x":25,"y":62.0,"facet":"South Australia"},{"x":26,"y":48.1,"facet":"South Australia"},{"x":27,"y":60.2,"facet":"South Australia"},{"x":28,"y":58.1,"facet":"South Australia"},{"x":29,"y":63.5,"facet":"South Australia"},{"x":30,"y":64.6,"facet":"South Australia"},{"x":31,"y":58.6,"facet":"South Australia"},{"x":32,"y":54.0,"facet":"South Australia"},{"x":33,"y":56.2,"facet":"South Australia"},{"x":34,"y":63.5,"facet":"South Australia"},{"x":35,"y":67.9,"facet":"South Australia"},{"x":36,"y":99.3,"facet":"South Australia"},{"x":1,"y":27.8,"facet":"Tasmania"},{"x":2,"y":22.8,"facet":"Tasmania"},{"x":3,"y":24.7,"facet":"Tasmania"},{"x":4,"y":27.3,"facet":"Tasmania"},{"x":5,"y":23.4,"facet":"Tasmania"},{"x":6,"y":23.1,"facet":"Tasmania"},{"x":7,"y":23.6,"facet":"Tasmania"},{"x":8,"y":22.2,"facet":"Tasmania"},{"x":9,"y":22.8,"facet":"Tasmania"},{"x":10,"y":20.9,"facet":"Tasmania"},{"x":11,"y":24.8,"facet":"Tasmania"},{"x":12,"y":39.0,"facet":"Tasmania"},{"x":13,"y":25.4,"facet":"Tasmania"},{"x":14,"y":18.8,"facet":"Tasmania"},{"x":15,"y":20.4,"facet":"Tasmania"},{"x":16,"y":21.9,"facet":"Tasmania"},{"x":17,"y":23.2,"facet":"Tasmania"},{"x":18,"y":21.3,"facet":"Tasmania"},{"x":19,"y":20.4,"facet":"Tasmania"},{"x":20,"y":18.4,"facet":"Tasmania"},{"x":21,"y":19.6,"facet":"Tasmania"},{"x":22,"y":18.8,"facet":"Tasmania"},{"x":23,"y":21.2,"facet":"Tasmania"},{"x":24,"y":30.7,"facet":"Tasmania"},{"x":25,"y":20.2,"facet":"Tasmania"},{"x":26,"y":17.7,"facet":"Tasmania"},{"x":27,"y":19.6,"facet":"Tasmania"},{"x":28,"y":19.9,"facet":"Tasmania"},{"x":29,"y":21.4,"facet":"Tasmania"},{"x":30,"y":20.4,"facet":"Tasmania"},{"x":31,"y":18.6,"facet":"Tasmania"},{"x":32,"y":18.3,"facet":"Tasmania"},{"x":33,"y":18.1,"facet":"Tasmania"},{"x":34,"y":20.2,"facet":"Tasmania"},{"x":35,"y":21.4,"facet":"Tasmania"},{"x":36,"y":29.5,"facet":"Tasmania"},{"x":1,"y":320.6,"facet":"Victoria"},{"x":2,"y":301.5,"facet":"Victoria"},{"x":3,"y":357.3,"facet":"Victoria"},{"x":4,"y":401.4,"facet":"Victoria"},{"x":5,"y":384.3,"facet":"Victoria"},{"x":6,"y":388.9,"facet":"Victoria"},{"x":7,"y":342.1,"facet":"Victoria"},{"x":8,"y":336.4,"facet":"Victoria"},{"x":9,"y":356.9,"facet":"Victoria"},{"x":10,"y":371.0,"facet":"Victoria"},{"x":11,"y":392.1,"facet":"Victoria"},{"x":12,"y":575.6,"facet":"Victoria"},{"x":13,"y":334.0,"facet":"Victoria"},{"x":14,"y":281.7,"facet":"Victoria"},{"x":15,"y":354.4,"facet":"Victoria"},{"x":16,"y":394.6,"facet":"Victoria"},{"x":17,"y":406.5,"facet":"Victoria"},{"x":18,"y":397.2,"facet":"Victoria"},{"x":19,"y":361.8,"facet":"Victoria"},{"x":20,"y":351.7,"facet":"Victoria"},{"x":21,"y":353.5,"facet":"Victoria"},{"x":22,"y":370.9,"facet":"Victoria"},{"x":23,"y":414.8,"facet":"Victoria"},{"x":24,"y":568.1,"facet":"Victoria"},{"x":25,"y":353.2,"facet":"Victoria"},{"x":26,"y":314.5,"facet":"Victoria"},{"x":27,"y":386.0,"facet":"Victoria"},{"x":28,"y":410.6,"facet":"Victoria"},{"x":29,"y":431.7,"facet":"Victoria"},{"x":30,"y":441.9,"facet":"Victoria"},{"x":31,"y":389.2,"facet":"Victoria"},{"x":32,"y":381.6,"facet":"Victoria"},{"x":33,"y":383.0,"facet":"Victoria"},{"x":34,"y":424.3,"facet":"Victoria"},{"x":35,"y":458.5,"facet":"Victoria"},{"x":36,"y":631.8,"facet":"Victoria"},{"x":1,"y":93.3,"facet":"Western Australia"},{"x":2,"y":81.3,"facet":"Western Australia"},{"x":3,"y":93.9,"facet":"Western Australia"},{"x":4,"y":103.6,"facet":"Western Australia"},{"x":5,"y":106.7,"facet":"Western Australia"},{"x":6,"y":104.2,"facet":"Western Australia"},{"x":7,"y":104.2,"facet":"Western Australia"},{"x":8,"y":94.1,"facet":"Western Australia"},{"x":9,"y":99.4,"facet":"Western Australia"},{"x":10,"y":100.0,"facet":"Western Australia"},{"x":11,"y":104.2,"facet":"Western Australia"},{"x":12,"y":164.0,"facet":"Western Australia"},{"x":13,"y":90.7,"facet":"Western Australia"},{"x":14,"y":74.2,"facet":"Western Australia"},{"x":15,"y":95.0,"facet":"Western Australia"},{"x":16,"y":95.8,"facet":"Western Australia"},{"x":17,"y":101.4,"facet":"Western Australia"},{"x":18,"y":96.4,"facet":"Western Australia"},{"x":19,"y":94.5,"facet":"Western Australia"},{"x":20,"y":88.3,"facet":"Western Australia"},{"x":21,"y":89.3,"facet":"Western Australia"},{"x":22,"y":93.4,"facet":"Western Australia"},{"x":23,"y":105.5,"facet":"Western Australia"},{"x":24,"y":155.6,"facet":"Western Australia"},{"x":25,"y":91.2,"facet":"Western Australia"},{"x":26,"y":76.8,"facet":"Western Australia"},{"x":27,"y":92.4,"facet":"Western Australia"},{"x":28,"y":94.1,"facet":"Western Australia"},{"x":29,"y":95.7,"facet":"Western Australia"},{"x":30,"y":102.9,"facet":"Western Australia"},{"x":31,"y":87.2,"facet":"Western Australia"},{"x":32,"y":84.9,"facet":"Western Australia"},{"x":33,"y":86.2,"facet":"Western Australia"},{"x":34,"y":93.2,"facet":"Western Australia"},{"x":35,"y":103.8,"facet":"Western Australia"},{"x":36,"y":147.0,"facet":"Western Australia"}],"geom":"line","x":"month","y":"turnover","facetVar":"State"}

The states differ a lot in size. On the one chart, Northern Territory sits almost flat along the bottom next to New South Wales. Switch it to facet_wrap(~State) and look at months 12, 24 and 36 in each panel, which are the Decembers. Every state peaks in December, in all 3 years.

=== step === concept
## The 148 series and how the forecasts are scored

The data comes from the Australian Bureau of Statistics Retail Trade survey, and the tsibbledata package ships it as `aus_retail`. It holds 152 series, each one an industry in a state, with monthly turnover in A$ million. We keep the 148 series that run through December 2018.

Every model in this lesson is fitted to data up to December 2017 and then scored on the 12 months of 2018. Those 12 months are the holdout: months that no model was fitted to. Each 2018 month is forecast one step ahead, which means from the observed months before it. That gives 148 series times 12 months, or 1,776 test rows.

Most of the lesson keeps only the last 24 months before the cutoff, January 2016 to December 2017, which is a short history. Later we give the series more history and repeat the comparison.

The score is MAPE, the mean absolute percentage error. For each month we take the gap between the actual and the forecast, divide it by the actual and write it as a percent. Averaging over the 12 months gives one MAPE per series, and averaging over the 148 series gives the score. Because every error is a share of its own actual, a small series and a large series count the same.

The baseline is seasonal naive, which forecasts each month with the same month a year earlier. It fits nothing, so a fitted model is worth using only if it scores better.

The code below builds the table of series, sets the cutoff and the MAPE function, and scores seasonal naive.

```r
# Build the 148 retail series, define the split and MAPE, and score seasonal naive on 2018
library(tsibble)
library(tsibbledata)
library(dplyr)

retail <- tsibbledata::aus_retail %>%
  as_tibble() %>%
  transmute(series = `Series ID`, state = State, industry = Industry,
            month = Month, turnover = Turnover) %>%
  group_by(series) %>%
  filter(max(month) == yearmonth("2018 Dec")) %>%
  ungroup() %>%
  arrange(series, month)

cutoff <- yearmonth("2017 Dec")

mape <- function(actual, forecast) {
  mean(abs(actual - forecast) / actual) * 100
}

last_year <- retail %>%
  filter(month > cutoff - 12, month <= cutoff) %>%
  mutate(month = month + 12) %>%
  select(series, month, forecast = turnover)

test_rows <- retail %>%
  filter(month > cutoff) %>%
  left_join(last_year, by = c("series", "month"))

snaive_mape <- test_rows %>%
  group_by(series) %>%
  summarise(mape = mape(turnover, forecast))

cat("series: ", n_distinct(retail$series), "\n", sep = "")
#> series: 148
cat("states: ", n_distinct(retail$state), "\n", sep = "")
#> states: 8
cat("industries: ", n_distinct(retail$industry), "\n", sep = "")
#> industries: 20
cat("test rows: ", nrow(test_rows), "\n", sep = "")
#> test rows: 1776
cat("seasonal naive MAPE: ", round(mean(snaive_mape$mape), 2), "\n", sep = "")
#> seasonal naive MAPE: 5.92
```

`yearmonth()` turns text into a month we can compare and add to. So `cutoff - 12` is December 2016, and `month + 12` moves each 2017 month forward a year, which lines it up with the 2018 month it forecasts.

The output confirms 148 series, 8 states, 20 industries and 1,776 test rows. Seasonal naive scores a MAPE of 5.92, so its forecasts are off by 5.92% of the actual turnover on average. That is the number every fitted model has to beat.

=== step === concept
## Local models and global models

A local model is fitted to one series, using only the rows of that series. With 148 series you fit 148 local models, and each one has its own set of estimated numbers.

ETS, short for exponential smoothing, is a standard model that is fitted to one series at a time, and it shows how many numbers a local model can need. The code below fits ETS to Victoria Clothing retailing, using only the 24 months from January 2016 to December 2017, and lists every number it estimates.

```r
# Fit ETS to one series of 24 months and list the numbers it estimates
library(fable)

victoria_24 <- retail %>%
  filter(state == "Victoria", industry == "Clothing retailing",
         month > cutoff - 24, month <= cutoff) %>%
  as_tsibble(index = month)

fit_ets <- victoria_24 %>% model(ets = ETS(turnover))
fit_ets
#> # A mable: 1 x 1
#>            ets
#>        <model>
#> 1 <ETS(M,N,M)>

tidy(fit_ets) %>% print(n = 15)
#> # A tibble: 15 × 3
#>    .model term    estimate
#>    <chr>  <chr>      <dbl>
#>  1 ets    alpha    0.408
#>  2 ets    gamma    0.00397
#>  3 ets    l[0]   406.
#>  4 ets    s[0]     1.50
#>  5 ets    s[-1]    1.07
#>  6 ets    s[-2]    0.989
#>  7 ets    s[-3]    0.940
#>  8 ets    s[-4]    0.912
#>  9 ets    s[-5]    0.935
#> 10 ets    s[-6]    1.05
#> 11 ets    s[-7]    1.03
#> 12 ets    s[-8]    1.04
#> 13 ets    s[-9]    0.926
#> 14 ets    s[-10]   0.756
#> 15 ets    s[-11]   0.856
```

fable picked ETS(M,N,M), which means multiplicative errors, no trend and multiplicative seasonality. `tidy()` lists 15 estimates: alpha and gamma, the smoothing weights for the level and the seasonal pattern, l[0], the starting level, and 12 starting seasonal indices, s[0] to s[-11], one for each month. So this one series gives 15 estimated numbers from 24 observations.

Each of the other 147 series would get its own set of estimates from its own 24 observations. That is what makes a model local.

A global model is one model with one set of coefficients, fitted to the rows of all 148 series together. The next three steps build those rows. The local and global models we score later use the same form, a linear regression on lagged values of turnover, so the only difference between them is which rows each fit uses.

=== step === widget
## How lag features turn a series into rows

A lag feature is the value of the same series k months earlier, placed on the row for month t. So `lag_1` on the row for March holds February's turnover from that series.

A regression on lagged values needs every row to carry its own lags, so we build them as columns. `lag(turnover)` shifts a column down by one row, and `group_by(series)` makes that shift happen inside each series separately.

The widget below applies that code to 4 months of two series, Clothing retailing in Tasmania (A3349371A) and in Victoria (A3349483V). The `series` column is the ABS series ID. The table holds only these 8 rows, so the first row of each series has no earlier month to take a value from.

::widget table-transform {"code":"df %>% group_by(series) %>% mutate(lag_1 = lag(turnover)) %>% ungroup()","caption":"lag_1 is the turnover of the month before, taken from the same series, so the first row of each series is NA.","before":{"cols":["series","month","turnover"],"rows":[["A3349371A","2016 Jan",27.8],["A3349371A","2016 Feb",22.8],["A3349371A","2016 Mar",24.7],["A3349371A","2016 Apr",27.3],["A3349483V","2016 Jan",320.6],["A3349483V","2016 Feb",301.5],["A3349483V","2016 Mar",357.3],["A3349483V","2016 Apr",401.4]]},"after":{"cols":["series","month","turnover","lag_1"],"rows":[["A3349371A","2016 Jan",27.8,"NA"],["A3349371A","2016 Feb",22.8,27.8],["A3349371A","2016 Mar",24.7,22.8],["A3349371A","2016 Apr",27.3,24.7],["A3349483V","2016 Jan",320.6,"NA"],["A3349483V","2016 Feb",301.5,320.6],["A3349483V","2016 Mar",357.3,301.5],["A3349483V","2016 Apr",401.4,357.3]]}}

Tasmania's turnover of 27.8, 22.8, 24.7 and 27.3 becomes a `lag_1` of NA, 27.8, 22.8 and 24.7. Every value moved down one row, and the first row has no month before it, so it is NA. Victoria's first row is NA as well, instead of taking Tasmania's 27.3.

Without `group_by(series)`, `lag()` treats the whole table as one long column. The first row of each series then takes the last value of the series above it. The code below counts how often that happens on the full table of 148 series, with and without `group_by()`.

```r
# Count the first rows that take a value from another series when lag() ignores the series
stacked <- retail %>%
  mutate(lag_1 = lag(turnover))

inside <- retail %>%
  group_by(series) %>%
  mutate(lag_1 = lag(turnover)) %>%
  ungroup()

first_rows <- function(x) {
  x %>% group_by(series) %>% slice(1) %>% ungroup()
}

sum(!is.na(first_rows(stacked)$lag_1))
#> [1] 147
sum(!is.na(first_rows(inside)$lag_1))
#> [1] 0
```

Without `group_by()`, 147 first rows hold a value from another series. The first row of the whole table has nothing above it, which is why the count is 147 and not 148. With `group_by(series)` the count is 0, so every first row is NA.

That is the reason the lags are built inside each series. Only then can the 148 series be stacked into one training table.

=== step === tryit
## Your turn: add a 2-month lag inside each series

The `retail` table is still in your session. Add `lag_2`, the turnover of two months earlier, inside each series. Then count the missing values in every column.

```r
# Add lag_2 inside each series, then count the missing values in every column
retail_lags <- retail %>%
  group_by(series) %>%
  mutate(lag_1 = lag(turnover, 1)) %>%
  ungroup()

colSums(is.na(retail_lags))
```
::check {"regex": "group_by[(]series[)][\\s\\S]*lag[(]turnover,\\s*2[)][\\s\\S]*ungroup", "gate": true, "difficulty": "beginner", "ok": "Yes. lag_2 has 296 missing values, 2 for each of the 148 series, because the first 2 months of a series have no month 2 earlier. The lag_1 column has 148, one for each series.", "no": "Add lag_2 = lag(turnover, 2) inside the same mutate(), between group_by(series) and ungroup(). Then colSums(is.na(retail_lags)) shows 296 missing values in lag_2."}
::solution
```r
# Add lag_2 inside each series, then count the missing values in every column
retail_lags <- retail %>%
  group_by(series) %>%
  mutate(lag_1 = lag(turnover, 1),
         lag_2 = lag(turnover, 2)) %>%
  ungroup()

colSums(is.na(retail_lags))
#>   series    state industry    month turnover    lag_1    lag_2
#>        0        0        0        0        0      148      296
```

The `lag_2` column has 2 missing values in each of the 148 series, which is 296.

=== step === concept
## How to build the scaled training table

The model uses three lags. `lag_1` is last month's turnover, `lag_12` is the same month a year earlier, and `lag_13` is the month before that one. Comparing `lag_1` with `lag_13` gives the year-on-year change in the latest month, and all three are already known when the next month is forecast.

The training window is January 2016 to December 2017, which is 24 months. A row needs all three lags, and `lag_13` reaches back 13 months, so the first 13 months of each series cannot make a training row. That leaves 11 rows per series, and 11 rows times 148 series is 1,628 rows.

The code below adds the three lags inside each series, then splits the table into training rows and 2018 test rows.

```r
# Build lag_1, lag_12 and lag_13 inside each series for the 24 training months and 2018
add_lags <- function(x) {
  x %>%
    arrange(series, month) %>%
    group_by(series) %>%
    mutate(lag_1 = lag(turnover, 1),
           lag_12 = lag(turnover, 12),
           lag_13 = lag(turnover, 13)) %>%
    ungroup()
}

window_24 <- retail %>% filter(month > cutoff - 24)
lagged_24 <- add_lags(window_24)

train_raw <- lagged_24 %>% filter(month <= cutoff, !is.na(lag_13))
test_raw <- lagged_24 %>% filter(month > cutoff)

nrow(train_raw)
#> [1] 1628
nrow(test_raw)
#> [1] 1776

train_raw %>%
  filter(state == "Victoria", industry == "Clothing retailing") %>%
  select(month, turnover, lag_1, lag_12, lag_13) %>%
  head(3)
#> # A tibble: 3 × 5
#>      month turnover lag_1 lag_12 lag_13
#>      <mth>    <dbl> <dbl>  <dbl>  <dbl>
#> 1 2017 Feb     282.  334    302.   321.
#> 2 2017 Mar     354.  282.   357.   302.
#> 3 2017 Apr     395.  354.   401.   357.
```

There are 1,628 training rows and 1,776 test rows. In the first Victoria row, February 2017 turnover is about 282. Its `lag_1` is January 2017 (334), its `lag_12` is February 2016 (302) and its `lag_13` is January 2016 (321).

The series are not close in size. In the training window the smallest series, Northern Territory Newspaper and book retailing, averages A$ 1.35 million a month, and the largest, New South Wales Food retailing, averages A$ 3,189 million. That is a 2,355-fold range. Least squares adds up squared errors in A$ million, so on raw turnover the large series would dominate the fit.

So we divide turnover and every lag by the series' own training-window mean. Every series then has a training mean of 1, and a value of 1.2 means 20% above the series' own average, in a small series and in a large one alike. The 2018 rows are divided by the same training means, because 2018 is not known when the model is fitted.

The code below scales the table and checks the range of the training means before and after.

```r
# Divide each series by its own training mean so every series has a training mean of 1
scale_rows <- function(x) {
  x %>%
    group_by(series) %>%
    mutate(train_mean = mean(turnover[month <= cutoff]),
           across(c(turnover, lag_1, lag_12, lag_13), ~ .x / train_mean)) %>%
    ungroup()
}

scaled_24 <- scale_rows(lagged_24)
train_24 <- scaled_24 %>% filter(month <= cutoff, !is.na(lag_13))
test_2018 <- scaled_24 %>% filter(month > cutoff)

train_means <- lagged_24 %>%
  filter(month <= cutoff) %>%
  group_by(series, state, industry) %>%
  summarise(mean = mean(turnover), .groups = "drop")

smallest <- train_means[which.min(train_means$mean), ]
largest <- train_means[which.max(train_means$mean), ]
cat("smallest: ", smallest$state, ", ", smallest$industry, ", ", round(smallest$mean, 2), "\n", sep = "")
#> smallest: Northern Territory, Newspaper and book retailing, 1.35
cat("largest: ", largest$state, ", ", largest$industry, ", ", round(largest$mean, 2), "\n", sep = "")
#> largest: New South Wales, Food retailing, 3188.94

scaled_means <- scaled_24 %>%
  filter(month <= cutoff) %>%
  group_by(series) %>%
  summarise(mean = mean(turnover))
range(scaled_means$mean)
#> [1] 1 1
```

The training means run from 1.35 to 3,188.94, and after scaling every series has a training mean of 1. The tables `train_24` and `test_2018` are the rows every model below is fitted and scored on.

=== step === concept
## One model fitted to all the rows

The global model is one linear regression fitted to all 1,628 stacked rows: `lm(turnover ~ lag_1 + lag_12 + lag_13)`. It gives one coefficient for each lag plus an intercept, and every series uses the same ones, applied to that series' own lags, so the forecasts still differ from series to series. A coefficient says how much the forecast moves when that lag rises by 1 with the other lags held fixed, and 1 here is one full training mean.

To compare, we fit the same lm to the 11 training rows of Victoria Clothing retailing, which is a local model. We also fit it to the 227 rows that series has when 240 months of history are available, from January 1998 to December 2017.

In each table below the Estimate column is the coefficient, and Std. Error is its standard error. The standard error is the estimated standard deviation of the coefficient across repeated samples of rows, so a smaller one means the estimate would move less from one sample to another.

```r
# Fit the same lm on all 1,628 rows, on Victoria's 11 rows, and on Victoria's 227 rows
model_formula <- turnover ~ lag_1 + lag_12 + lag_13

fit_global <- lm(model_formula, data = train_24)

victoria_rows_24 <- train_24 %>%
  filter(state == "Victoria", industry == "Clothing retailing")
fit_victoria_24 <- lm(model_formula, data = victoria_rows_24)

train_240 <- retail %>%
  filter(month > cutoff - 240) %>%
  add_lags() %>%
  scale_rows() %>%
  filter(month <= cutoff, !is.na(lag_13))
victoria_rows_240 <- train_240 %>%
  filter(state == "Victoria", industry == "Clothing retailing")
fit_victoria_240 <- lm(model_formula, data = victoria_rows_240)

cat("Global model,", nrow(train_24), "rows\n")
#> Global model, 1628 rows
round(coef(summary(fit_global)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    0.038      0.018   2.102    0.036
#> lag_1          0.767      0.021  37.343    0.000
#> lag_12         0.951      0.010  92.090    0.000
#> lag_13        -0.752      0.024 -31.827    0.000
cat("\nVictoria Clothing retailing,", nrow(victoria_rows_24), "rows\n")
#>
#> Victoria Clothing retailing, 11 rows
round(coef(summary(fit_victoria_24)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   -0.251      0.109  -2.294    0.056
#> lag_1         -0.238      0.270  -0.880    0.408
#> lag_12         0.901      0.059  15.200    0.000
#> lag_13         0.624      0.322   1.937    0.094
cat("\nVictoria Clothing retailing,", nrow(victoria_rows_240), "rows\n")
#>
#> Victoria Clothing retailing, 227 rows
round(coef(summary(fit_victoria_240)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    0.023      0.013   1.754    0.081
#> lag_1          0.715      0.047  15.259    0.000
#> lag_12         1.002      0.020  49.306    0.000
#> lag_13        -0.725      0.051 -14.231    0.000
```

Start with `lag_1`. The global fit gives 0.767 with a standard error of 0.021. The 11-row fit gives -0.238 with a standard error of 0.270, which is larger than the estimate itself, and its `lag_13` coefficient has the opposite sign, 0.624 against -0.752 for the global fit. With the same model form, 11 rows cannot pin the coefficients down.

Give that series 227 rows and its coefficients come out at 0.715, 1.002 and -0.725, close to the global fit's 0.767, 0.951 and -0.752. So the global coefficients are steadier because they are estimated from 1,628 rows instead of 11, and not because the model is different.

The three coefficients also read easily. `lag_12` carries 0.951, so most of last year's value for the same month goes into the forecast. The 0.767 on `lag_1` and the -0.752 on `lag_13` nearly offset each other, so together they add about 0.76 times the change from `lag_13` to `lag_1`, which is the year-on-year change in the latest month.

One limit applies. `lm` treats all 1,628 rows as independent, and they are not, because the months of one series follow each other. So read 0.021 as a sign of how much the extra rows help, and not as an exact measure of uncertainty.

=== step === concept
## Does one global model beat 148 local models?

Now we score. The local models are 148 lm fits, one for each series, each on its own 11 rows. The global model is the single fit from the last step. All of them forecast the 2018 months one step ahead, from the observed lags.

The forecasts come out in scaled units, so the code multiplies them by each series' training mean to get A$ million. It then computes one MAPE per series and averages them. `fit_by()` fits one lm for each value of a column, and `predict_by()` forecasts each test row with the fit for its own group. Here the column is `series`, so every series gets its own fit.

```r
# Score seasonal naive, 148 local models and the global model on the 2018 holdout
fit_by <- function(train, key) {
  lapply(split(train, train[[key]]), lm, formula = model_formula)
}

predict_by <- function(fits, test, key) {
  pred <- numeric(nrow(test))
  for (g in names(fits)) {
    in_group <- test[[key]] == g
    pred[in_group] <- predict(fits[[g]], newdata = test[in_group, ])
  }
  pred
}

fits_local <- fit_by(train_24, "series")

scored <- test_2018 %>%
  mutate(actual = turnover * train_mean,
         seasonal_naive = lag_12 * train_mean,
         local = predict_by(fits_local, test_2018, "series") * train_mean,
         global = predict(fit_global, newdata = test_2018) * train_mean)

by_series <- scored %>%
  group_by(series, industry) %>%
  summarise(seasonal_naive = mape(actual, seasonal_naive),
            local = mape(actual, local),
            global = mape(actual, global),
            .groups = "drop")

round(colMeans(by_series[, c("seasonal_naive", "local", "global")]), 2)
#> seasonal_naive          local         global
#>           5.92           6.54           3.94
sum(by_series$global < by_series$local)
#> [1] 127
```

The global fit scores a MAPE of 3.94, seasonal naive 5.92 and the 148 local fits 6.54. The local fits are worse than seasonal naive. Each of them estimates 4 coefficients from 11 rows, and the standard errors in the last step showed how imprecise such estimates are.

The global fit has a lower MAPE than the local fit on 127 of the 148 series.

The scaling did part of that work. The next block refits the global model on `train_raw`, the unscaled rows, and scores it the same way. Every series has the same 12 test months, so this pooled MAPE equals the average of the per-series MAPEs.

```r
# Refit the global model on the unscaled rows to see what the scaling contributed
fit_unscaled <- lm(model_formula, data = train_raw)
pred_unscaled <- predict(fit_unscaled, newdata = test_raw)
round(mape(test_raw$turnover, pred_unscaled), 2)
#> [1] 5.17
```

Without scaling, the same global model scores 5.17 instead of 3.94. The fit is driven by the large series, because their squared errors in A$ million are far bigger than those of the small ones. MAPE itself is not affected by the scaling, since it divides each error by its own actual.

=== step === concept
## Pooling by industry: a grouped model

The global model pools all 148 series, including series from very different industries, such as Newspaper and book retailing and Food retailing. A grouped model is a middle course: a global model fitted separately within each group of series. Here the groups are the 20 industries, so we fit 20 models, each on the 5 to 8 series of one industry, which is 55 to 88 rows.

The code below fits the 20 industry models and scores them, then compares all three set-ups on Department stores.

```r
# Fit one lm per industry and compare the three set-ups on Department stores
fits_grouped <- fit_by(train_24, "industry")
length(fits_grouped)
#> [1] 20
range(table(train_24$industry))
#> [1] 55 88

scored$grouped <- predict_by(fits_grouped, test_2018, "industry") * scored$train_mean

by_series <- scored %>%
  group_by(series, industry) %>%
  summarise(local = mape(actual, local),
            grouped = mape(actual, grouped),
            global = mape(actual, global),
            .groups = "drop")

round(mean(by_series$grouped), 2)
#> [1] 4.31

by_series %>%
  filter(industry == "Department stores") %>%
  summarise(series = n(),
            local = round(mean(local), 2),
            grouped = round(mean(grouped), 2),
            global = round(mean(global), 2))
#> # A tibble: 1 × 4
#>   series local grouped global
#>    <int> <dbl>   <dbl>  <dbl>
#> 1      6  4.27    3.53   4.17
```

On 24 months of history the grouped models score a MAPE of 4.31, between the local fits (6.54) and the global fit (3.94). Each industry fit has only 55 to 88 rows, far fewer than the 1,628 of the global fit, so pooling only alike series costs rows.

But the industry can matter. Department stores has 6 series, and the fit pooled within that industry scores 3.53. The local fits score 4.27 and the global fit 4.17. For this industry the grouped fit has the lowest MAPE of the three, so pooling Department stores with series from other industries cost accuracy.

=== step === widget
## Which set-up is best at each history length?

So far every series had 24 months. The best set-up can change when the series have more history, so we repeat the comparison for 24, 48, 120 and 240 months, each ending in December 2017.

`score_history(W)` refits all three set-ups on the last W months up to December 2017 and scores each one on 2018. With W = 24, 48, 120 and 240, each series has 11, 35, 107 and 227 rows. The code runs it four times, prints the MAPE for each set-up, counts the series where the global fit beats the local fit, and shows Department stores at 240 months.

```r
# Refit local, grouped and global models for four history lengths and score each on 2018
score_history <- function(W) {
  scaled <- retail %>%
    filter(month > cutoff - W) %>%
    add_lags() %>%
    scale_rows()
  train <- scaled %>% filter(month <= cutoff, !is.na(lag_13))
  test <- scaled %>% filter(month > cutoff)
  fit_global <- lm(model_formula, data = train)

  test %>%
    mutate(actual = turnover * train_mean,
           seasonal_naive = lag_12 * train_mean,
           local = predict_by(fit_by(train, "series"), test, "series") * train_mean,
           grouped = predict_by(fit_by(train, "industry"), test, "industry") * train_mean,
           global = predict(fit_global, newdata = test) * train_mean) %>%
    group_by(series, industry) %>%
    summarise(across(c(seasonal_naive, local, grouped, global), ~ mape(actual, .x)),
              .groups = "drop")
}

windows <- c(24, 48, 120, 240)
scores <- lapply(windows, score_history)

mape_table <- data.frame(
  history = windows,
  rows_per_series = windows - 13,
  seasonal_naive = sapply(scores, function(s) mean(s$seasonal_naive)),
  local = sapply(scores, function(s) mean(s$local)),
  grouped = sapply(scores, function(s) mean(s$grouped)),
  global = sapply(scores, function(s) mean(s$global))
)
round(mape_table, 2)
#>   history rows_per_series seasonal_naive local grouped global
#> 1      24              11           5.92  6.54    4.31   3.94
#> 2      48              35           5.92  4.11    3.94   4.00
#> 3     120             107           5.92  3.83    3.87   4.08
#> 4     240             227           5.92  3.81    3.87   4.02

sapply(scores, function(s) sum(s$global < s$local))
#> [1] 127  68  64  50

department_240 <- scores[[4]] %>% filter(industry == "Department stores")
round(colMeans(department_240[, c("local", "grouped", "global")]), 2)
#>   local grouped  global
#>    3.11    3.10    4.24
```

The widget shows the same four rows as a report table.

::widget styled-table {"cols":["History (months)","Rows per series","Seasonal naive","Local","Grouped","Global"],"rows":[["24","11","5.92","6.54","4.31","3.94"],["48","35","5.92","4.11","3.94","4.00"],["120","107","5.92","3.83","3.87","4.08"],["240","227","5.92","3.81","3.87","4.02"]],"title":"MAPE on the 2018 holdout by history length","note":"Lower is better. Each MAPE is the average over the 148 series."}

Read the table by rows. At 24 months the global fit scores lowest (3.94) and the local fits highest (6.54). At 48 months the grouped fit is lowest (3.94), with global at 4.00 and local at 4.11. At 120 and 240 months the local fits are lowest (3.83 and 3.81), and the grouped fit is within 0.1 of the lowest from 48 months on.

The count of series where the global fit has a lower MAPE than the local fit falls from 127 of 148 at 24 months to 50 of 148 at 240 months. Department stores show the same change. At 240 months local scores 3.11, grouped 3.10 and global 4.24, so with enough rows per series the global fit scores worse for this industry.

The reason is how many rows each set-up estimates from. With 11 rows per series, a local fit has too little to estimate 4 coefficients, so sharing rows across series helps. With 227 rows, a local fit has enough of its own, while the global fit still applies one set of coefficients to every series.

[KEY INSIGHT]
Share a model across series that behave alike, and share more widely when history is short. At 24 months one global model scored lowest. From 120 months on, one local model per series did, and the grouped model stayed within 0.1 of it.

=== step === quiz
## Quick check: which set-up scores lowest with 24 months of history?

Every series has 24 months of history, which leaves 11 training rows per series. Using the table from the last step, which set-up had the lowest MAPE on the 2018 holdout?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- One local model per series, because every series has its own pattern. ::no
- One grouped model per industry, because series of the same industry always pool better. ::no
- One global model across all 148 series. ::ok Yes. With 24 months each series has 11 rows, and the global fit uses all 1,628 of them, so its lag_1 standard error is 0.021 against 0.270 for one series. That is why it scores 3.94, the lowest of the four.
- Seasonal naive, because nothing is fitted. ::no At 24 months the table reads global 3.94, grouped 4.31, seasonal naive 5.92 and local 6.54. A local fit estimates 4 coefficients from 11 rows, and the standard errors showed how imprecise such estimates are. The grouped fit uses only 55 to 88 rows per industry, and its advantage showed up for Department stores, not overall. Seasonal naive fits nothing, but both pooled set-ups beat it.

=== step === tryit
## Your turn: fit one model for a single industry and score it

The objects `train_24`, `test_2018`, `model_formula` and `mape()` are still in your session. The starter fits one lm to all 148 series. Change the two lines that create `food_train` and `food_test` so they keep only the 8 series of the Food retailing industry, then run it.

```r
# Fit one lm on the Food retailing rows only and score it on 2018
food_train <- train_24
food_test <- test_2018

fit_food <- lm(model_formula, data = food_train)
round(mape(food_test$turnover, predict(fit_food, newdata = food_test)), 2)
```
::check {"regex": "industry\\s*==\\s*.Food retailing.[\\s\\S]*lm[(]", "gate": true, "difficulty": "intermediate", "ok": "Yes. The fit on the 8 Food retailing series scores a MAPE of 1.76. The global fit scores 1.82 on the same 8 series, so for this industry the fit pooled within the industry is a little lower.", "no": "Keep only the Food retailing rows in both train_24 and test_2018 with filter(industry == ...), then fit lm() on the filtered training rows and score it on the filtered test rows."}
::solution
```r
# Fit one lm on the Food retailing rows only and score it on 2018
food_train <- train_24 %>% filter(industry == "Food retailing")
food_test <- test_2018 %>% filter(industry == "Food retailing")

fit_food <- lm(model_formula, data = food_train)
round(mape(food_test$turnover, predict(fit_food, newdata = food_test)), 2)
#> [1] 1.76
```

The starter scores 3.94, the global fit on all 148 series. Restricted to Food retailing, the fit scores 1.76, against 1.82 for the global fit on the same 8 series.

=== step === concept
## References
::prose-only a reference list; there is nothing to draw

- Hyndman, R.J. and Athanasopoulos, G. (2021). [Forecasting: Principles and Practice](https://otexts.com/fpp3/), 3rd edition, OTexts. The chapters on evaluating forecast accuracy and on time series regression cover the MAPE and the lm fits used here.
- Montero-Manso, P. and Hyndman, R.J. (2021). [Principles and algorithms for forecasting groups of time series: locality and globality](https://doi.org/10.1016/j.ijforecast.2021.03.004). International Journal of Forecasting 37(4), 1632 to 1653. The paper that sets out local and global forecasting for groups of series.
- Januschowski, T. et al. (2020). [Criteria for classifying forecasting methods](https://doi.org/10.1016/j.ijforecast.2019.05.008). International Journal of Forecasting 36(1), 167 to 177. Where the local and global distinction sits among the ways of classifying forecasting methods.
- Makridakis, S., Spiliotis, E. and Assimakopoulos, V. (2022). [M5 accuracy competition: results, findings, and conclusions](https://doi.org/10.1016/j.ijforecast.2021.11.013). International Journal of Forecasting 38(4), 1346 to 1364. A large forecasting competition on retail series.
- O'Hara-Wild, M., Hyndman, R. and Wang, E. [tsibbledata: Diverse Datasets for tsibble](https://tsibbledata.tidyverts.org/reference/aus_retail.html). The package documentation for `aus_retail`, from the Australian Bureau of Statistics, Retail Trade, cat. 8501.0.

=== step === complete
## Quick recap

You forecast 148 retail series three ways and scored each one on the 12 months of 2018. To summarize:

- A local model is fitted to one series from that series' rows only, so 148 series need 148 fits. ETS on 24 months of Victoria Clothing retailing estimated 15 numbers from 24 observations.
- A global model is one model fitted to the stacked rows of all the series. The lags are built inside each series, and each series is divided by its own training mean, so one coefficient means the same for a small and a large series.
- The same lm gave a `lag_1` standard error of 0.021 on 1,628 rows and 0.270 on the 11 rows of Victoria Clothing retailing.
- At 24 months of history the MAPEs were 3.94 for the global fit, 4.31 for the grouped fit, 5.92 for seasonal naive and 6.54 for the local fits.
- At 240 months the local fits scored 3.81, the grouped fit 3.87 and the global fit 4.02. The grouped fit stayed within 0.1 of the lowest from 48 months on.
- Share a model across series that behave alike, and share more widely when history is short.

So when someone asks whether to fit one model per series or one model for all of them, you can answer from two facts: how many months each series has, and how alike the series are.

The next lesson fits machine learning models to lag features like the ones you built here.
