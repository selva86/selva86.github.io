---
title: "Hierarchical and Grouped Forecasting Lesson 4: Reconciliation with fabletools"
slug: "Reconciliation-with-fabletools"
description: "Declare a State and industry hierarchy, fit an ETS model to each of the 13 series, reconcile the forecasts so they add up, and compare accuracy by level."
keywords: "forecast reconciliation, hierarchical forecasting, fabletools, aggregate_key, reconcile, min_trace, bottom-up, MinT, coherent forecasts, fable, tsibble, R"
mathjax: false
webr: true
date: "2026-09-27"
post_type: "LESSON"
course_id: "ts-hierarchical"
course_title: "Hierarchical and Grouped Forecasting"
course_lesson: "4"
course_total: "5"
course_landing: "Hierarchical-and-Grouped-Forecasting-Course.html"
course_prev: "Optimal-Reconciliation-MinT"
course_next: "Coherent-Forecasts-Finance-Can-Plan-Against"
curriculum_id: "5.120.4"
lesson_access: "pro"
catalog_blurb: "How to make forecasts at every level of a hierarchy add up."
---

=== step === cover
## Reconciliation with fabletools

Today let's see how to make forecasts at every level of a hierarchy add up, using four functions from the fabletools package in R.

Say you forecast monthly retail turnover in Australia. There are three states, New South Wales, Victoria and Queensland, and three industries in each state: food retailing, household goods retailing, and clothing, footwear and personal accessory retailing. That gives 9 series of monthly turnover, in millions of Australian dollars, from January 2010 to December 2018.

Those 9 series roll up. The three industries in a state add up to that state's turnover, and the three states add up to a Total. So besides the 9 series you also have 3 State series and 1 Total series, 13 series in all.

The workflow that produces forecasts for all 13 is four function calls, in this order.

::widget process-flow {"steps":[{"title":"aggregate_key()","sub":"add State and Total series, 13 in all"},{"title":"model()","sub":"fit ETS(M,A,M) to every series"},{"title":"reconcile()","sub":"add bottom-up and min_trace sets"},{"title":"forecast()","sub":"24 months for every set"}]}

The diagram lists the four calls in the order the lesson runs them on the retail data.

=== step === concept
## How aggregate_key() declares the hierarchy

The retail data comes with the tsibbledata package as `aus_retail`, and it is a tsibble. A tsibble is a data frame for time series: one column is the time index (here `Month`), and the key columns (here `State` and `Industry`) say which series each row belongs to.

The code below reads it with `tsibbledata::aus_retail`, keeps the 3 states and 3 industries, from January 2010 onward, and prints the first 4 rows. The blocks on this page share one R session, so run them in order.

```r
# Build the retail turnover series for 3 states and 3 industries
library(tsibble)
library(tsibbledata)
library(dplyr)
library(fable)
library(fabletools)

retail <- tsibbledata::aus_retail |>
  filter(
    State %in% c("New South Wales", "Victoria", "Queensland"),
    Industry %in% c(
      "Food retailing",
      "Household goods retailing",
      "Clothing, footwear and personal accessory retailing"
    ),
    Month >= yearmonth("2010 Jan")
  ) |>
  select(Month, State, Industry, Turnover)

print(retail, n = 4)
#> # A tsibble: 972 x 4 [1M]
#> # Key:       State, Industry [9]
#>      Month State           Industry                                     Turnover
#>      <mth> <chr>           <chr>                                           <dbl>
#> 1 2010 Jan New South Wales Clothing, footwear and personal accessory r…     536.
#> 2 2010 Feb New South Wales Clothing, footwear and personal accessory r…     427.
#> 3 2010 Mar New South Wales Clothing, footwear and personal accessory r…     494.
#> 4 2010 Apr New South Wales Clothing, footwear and personal accessory r…     508.
#> # ℹ 968 more rows
```

There are 972 rows, which is 9 series with 108 months each. The `[1M]` in the header means one row per month, and `Key: State, Industry [9]` says the data holds 9 series.

`aggregate_key()` adds the summed series. The formula `State / Industry` says Industry sits inside State, so every industry series has exactly one parent, its state. That one-parent rule is what makes this a hierarchy. And `Turnover = sum(Turnover)` says each new series is the sum of its children's turnover in every month.

```r
# Add the 3 State series and the Total series to the 9 State-by-industry series
sales <- retail |>
  aggregate_key(State / Industry, Turnover = sum(Turnover))

print(sales, n = 4)
#> # A tsibble: 1,404 x 4 [1M]
#> # Key:       State, Industry [13]
#>      Month State        Industry     Turnover
#>      <mth> <chr*>       <chr*>          <dbl>
#> 1 2010 Jan <aggregated> <aggregated>   10124.
#> 2 2010 Feb <aggregated> <aggregated>    8810 
#> 3 2010 Mar <aggregated> <aggregated>    9737.
#> 4 2010 Apr <aggregated> <aggregated>    9545.
#> # ℹ 1,400 more rows
n_keys(sales)
#> [1] 13
```

The output has 1,404 rows, which is 13 series times 108 months, and `n_keys()` counts the 13 series. In the new rows the key holds `<aggregated>`, a label that means the series is a sum over that key. The star in `<chr*>` marks a key column that can hold this label.

The 9 State-and-industry series are the bottom level. Each series in the hierarchy, from the Total down to the bottom level, is called a node.

The Total is the node where both keys are aggregated. `is_aggregated()` is TRUE when a key holds that label, so filtering on it for State and for Industry picks the Total out.

```r
# Pick out the Total series, where both keys are aggregated
sales_total <- sales |>
  filter(is_aggregated(State), is_aggregated(Industry))

print(sales_total, n = 3)
#> # A tsibble: 108 x 4 [1M]
#> # Key:       State, Industry [1]
#>      Month State        Industry     Turnover
#>      <mth> <chr*>       <chr*>          <dbl>
#> 1 2010 Jan <aggregated> <aggregated>   10124.
#> 2 2010 Feb <aggregated> <aggregated>    8810 
#> 3 2010 Mar <aggregated> <aggregated>    9737.
#> # ℹ 105 more rows
```

The Total has 108 rows, one per month. Its turnover is the sum of these 9 series only, so it is not the national retail figure.

There is one other way to declare the structure. Writing `State * Industry` crosses the two keys instead of nesting them, so each industry is also summed across all 3 states. Every bottom series then has two parents, its state and its industry, and a structure like that is called grouped rather than a hierarchy.

```r
# Count the series when the two keys cross instead of nest
crossed <- retail |>
  aggregate_key(State * Industry, Turnover = sum(Turnover))

n_keys(crossed)
#> [1] 16
```

The crossed version has 16 series against 13 for the nested one: the 9 bottom series, 3 State series, 3 Industry series and the Total. This lesson keeps the nested hierarchy.

=== step === concept
## How model() fits every node at once

`model()` fits a model to every series in a tsibble in one call. Before fitting, we set the last 24 months aside as a test window: the training data runs through December 2016, and the months from January 2017 to December 2018 stay unseen until we score the forecasts.

The model is ETS(M,A,M), an exponential smoothing model. The three letters give the type of the error, the trend and the season: multiplicative error, additive trend and multiplicative season. We give all 13 nodes the same form on purpose. The 13 fits then differ only in their data, not in a model choice, and the code runs faster than it would if each series searched for its own form.

```r
# Fit one ETS(M,A,M) model to each of the 13 series, using data up to Dec 2016
train <- sales |>
  filter(Month <= yearmonth("2016 Dec"))

fit <- train |>
  model(base = ETS(Turnover ~ error("M") + trend("A") + season("M")))

nrow(train)
#> [1] 1092
fit
#> # A mable: 13 x 3
#> # Key:     State, Industry [13]
#>    State           Industry                                                 base
#>    <chr*>          <chr*>                                                <model>
#>  1 New South Wales Clothing, footwear and personal accessory retai… <ETS(M,A,M)>
#>  2 New South Wales Food retailing                                 … <ETS(M,A,M)>
#>  3 New South Wales Household goods retailing                      … <ETS(M,A,M)>
#>  4 New South Wales <aggregated>                                     <ETS(M,A,M)>
#>  5 Queensland      Clothing, footwear and personal accessory retai… <ETS(M,A,M)>
#>  6 Queensland      Food retailing                                 … <ETS(M,A,M)>
#>  7 Queensland      Household goods retailing                      … <ETS(M,A,M)>
#>  8 Queensland      <aggregated>                                     <ETS(M,A,M)>
#>  9 Victoria        Clothing, footwear and personal accessory retai… <ETS(M,A,M)>
#> 10 Victoria        Food retailing                                 … <ETS(M,A,M)>
#> 11 Victoria        Household goods retailing                      … <ETS(M,A,M)>
#> 12 Victoria        <aggregated>                                     <ETS(M,A,M)>
#> 13 <aggregated>    <aggregated>                                     <ETS(M,A,M)>
```

`train` has 1,092 rows, which is 13 series times 84 months. `fit` is a mable, a model table with one row per series. Its model column is called `base`, the name we gave inside `model()`, and every cell holds an ETS(M,A,M) model.

Notice what this means. Each of the 13 rows is a separate fit, with its own parameters estimated from that one series' turnover. The Total's model never sees the State series, and the State models never see the industries.

=== step === widget
## Do the base forecasts add up?

`forecast(h = 24)` produces the 24 months from January 2017 to December 2018 for every series. Forecasts that come straight from the fitted models, before any adjustment, are called base forecasts.

```r
# Forecast 24 months ahead from the base fits
fc_base <- fit |>
  forecast(h = 24)

nrow(fc_base)
#> [1] 312
```

That is 312 rows, which is 13 series times 24 months. Each row holds a forecast distribution and a `.mean` column, the mean of that distribution, which is the point forecast.

Forecasts are coherent when the forecasts of the children add up to the forecast of their parent, the way the actual data does. The Total is the exact sum of the 3 States, so a coherent Total forecast equals the sum of the 3 State forecasts in every month. The function below takes a set of forecasts and returns, for each month, the Total forecast, the sum of the State forecasts and their difference.

```r
# Define a function that returns the Total forecast minus the sum of the State forecasts
total_minus_states <- function(fc) {
  total <- fc |>
    filter(is_aggregated(State), is_aggregated(Industry)) |>
    as_tibble() |>
    select(Month, .model, total = .mean)

  states <- fc |>
    filter(!is_aggregated(State), is_aggregated(Industry)) |>
    as_tibble() |>
    group_by(Month, .model) |>
    summarise(states = sum(.mean), .groups = "drop")

  total |>
    left_join(states, by = c("Month", ".model")) |>
    mutate(difference = total - states)
}

gap_base <- total_minus_states(fc_base)

gap_base |>
  head(6) |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  as.data.frame()
#>      Month .model   total  states difference
#> 1 2017 Jan   base 13175.1 13193.5      -18.4
#> 2 2017 Feb   base 11754.6 11869.7     -115.1
#> 3 2017 Mar   base 12865.1 12873.1       -8.0
#> 4 2017 Apr   base 12500.0 12512.4      -12.4
#> 5 2017 May   base 12823.7 12788.4       35.3
#> 6 2017 Jun   base 12667.2 12679.8      -12.6
```

The column `.model` names the set of forecasts, and for now there is just `base`. In January 2017 the Total forecast is 13,175.1 and the 3 State forecasts sum to 13,193.5, so the difference is -18.4 million dollars. In May it flips sign to 35.3.

Here is the same difference summarised over all 24 months, followed by the lowest and the highest month.

```r
# Summarise the 24 monthly differences, then show the lowest and the highest month
data.frame(
  months_below_zero = sum(gap_base$difference < 0),
  mean_abs = round(mean(abs(gap_base$difference)), 1),
  pct_of_total = round(100 * mean(abs(gap_base$difference) / gap_base$total), 1)
)
#>   months_below_zero mean_abs pct_of_total
#> 1                21     69.5          0.5

gap_base |>
  filter(difference == min(difference) | difference == max(difference)) |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  as.data.frame()
#>      Month .model   total  states difference
#> 1 2017 Jul   base 12934.0 12895.8       38.2
#> 2 2018 Dec   base 17546.9 17745.0     -198.1
```

The difference is below zero in 21 of the 24 months, and on average the Total forecast and the sum of the States differ by 69.5 million dollars, about 0.5% of the Total forecast. The largest gap is in December 2018: the Total forecast is 17,546.9 and the States sum to 17,745.0, a difference of -198.1. The largest positive value is 38.2, in July 2017.

To see how the difference moves over the forecast, here are all 24 values in horizon order, rounded to 1 decimal place.

```r
# The 24 differences at 1 decimal place, in horizon order
round(gap_base$difference, 1)
#>  [1]  -18.4 -115.1   -8.0  -12.4   35.3  -12.6   38.2   14.3  -83.7  -61.2
#> [11]  -85.9 -133.5  -69.6 -163.5  -56.6  -59.6  -11.7  -60.5   -9.2  -33.9
#> [21] -134.6 -113.0 -138.6 -198.1
```

The widget below plots these 24 differences against the horizon, the number of months ahead: 1 is January 2017 and 24 is December 2018. Each view shows a quick sketch first, and Run this chart draws the real ggplot2 chart.

::widget chart-plotter {"data":[{"x":1,"y":-18.4},{"x":2,"y":-115.1},{"x":3,"y":-8.0},{"x":4,"y":-12.4},{"x":5,"y":35.3},{"x":6,"y":-12.6},{"x":7,"y":38.2},{"x":8,"y":14.3},{"x":9,"y":-83.7},{"x":10,"y":-61.2},{"x":11,"y":-85.9},{"x":12,"y":-133.5},{"x":13,"y":-69.6},{"x":14,"y":-163.5},{"x":15,"y":-56.6},{"x":16,"y":-59.6},{"x":17,"y":-11.7},{"x":18,"y":-60.5},{"x":19,"y":-9.2},{"x":20,"y":-33.9},{"x":21,"y":-134.6},{"x":22,"y":-113.0},{"x":23,"y":-138.6},{"x":24,"y":-198.1}],"geoms":["line","point","bar"],"x":"horizon","y":"difference"}

In the line view most of the line sits below zero, and it drifts lower as the horizon grows. In the point view the widget prints r = -0.53, the correlation between horizon and difference. So the later the month, the further below zero the difference tends to be. The 3 months above zero (May, July and August 2017) all sit early in the horizon.

These base forecasts are incoherent: the Total forecast does not equal the sum of the State forecasts. Each of the 13 series has its own model, and nothing in those fits makes a parent's forecast match its children's forecasts.

=== step === quiz
## Quick check: why do the base forecasts not add up?

In December 2018 the Total's base forecast was 17,546.9 and the 3 State forecasts summed to 17,745.0. What explains the gap?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- ETS is biased on series that are sums of other series, so the Total forecast comes out too low. ::no
- The gap closes once the actual months arrive, because the actual Total equals the sum of the actual States. ::no
- Each of the 13 series was fitted on its own, so nothing ties the Total's forecast to the State forecasts. ::ok Yes. Every series has its own model and its own parameters, and nothing in those fits forces a parent's forecast to equal the sum of its children's forecasts.
- The Total series was built from different data than the State series. ::no The Total is the exact sum of the States in the data, and ETS(M,A,M) was fitted the same way to all 13 series. The gap comes from fitting each series separately. It is also a gap between two forecasts, so the actual months arriving do not close it: the actual data already adds up, and the forecasts still do not.

=== step === concept
## How to reconcile with bottom_up() and min_trace()

Reconciliation adjusts the base forecasts so that they add up. The adjusted forecasts are called reconciled forecasts, and `reconcile()` sets up the adjustment. Each argument to it creates one new column: a name you choose on the left, and on the right a method that says how to adjust the forecasts in the `base` column.

We use two reconciliation functions.

- `bottom_up()` keeps the 9 State-and-industry base forecasts as they are and adds them up to get the State and Total forecasts. The base forecasts of the 3 State series and the Total are not used.
- `min_trace()` starts from all 13 base forecasts. Among all the ways of changing them so they add up, it picks the one with the smallest sum of forecast-error variances across the 13 reconciled series. That sum is the trace of their covariance matrix, which is where the name comes from.

To do that, `min_trace()` needs the covariance of the base forecast errors, and it estimates it from the residuals of the base fits. The `method` argument chooses how, and we compare three:

- `"ols"` is the simplest. It assumes every series has the same forecast-error variance and that no series' errors move with another's.
- `"wls_struct"` lets the variance grow with the number of bottom series a node sums. The Total counts 9, each State counts 3 and each bottom series counts 1.
- `"mint_shrink"` uses the full covariance of the residuals across the 13 series, shrunk toward its diagonal.

A fourth method, `"wls_var"`, is the default. It uses each series' own residual variance.

```r
# Add four reconciled sets to the fitted hierarchy, keeping the base fits
rec <- fit |>
  reconcile(
    bu   = bottom_up(base),
    ols  = min_trace(base, method = "ols"),
    wls  = min_trace(base, method = "wls_struct"),
    mint = min_trace(base, method = "mint_shrink")
  )

dim(rec)
#> [1] 13  7
names(rec)
#> [1] "State"    "Industry" "base"     "bu"       "ols"      "wls"      "mint"
```

The mable now has 13 rows and 7 columns: the 2 keys, `base`, and the four new sets `bu`, `ols`, `wls` and `mint`. The first argument in each call, `base`, names the column of models to reconcile.

`reconcile()` refits nothing. The ETS fits stay in the mable, and the four methods are applied when `forecast()` runs.

=== step === concept
## How to forecast and check that the children add to the parent

`forecast()` on this mable returns all five sets, and the `.model` column says which set a row belongs to.

```r
# Forecast 24 months ahead for the base set and the four reconciled sets
fc <- rec |>
  forecast(h = 24)

nrow(fc)
#> [1] 1560
fc |>
  as_tibble() |>
  count(.model) |>
  as.data.frame()
#>   .model   n
#> 1   base 312
#> 2     bu 312
#> 3   mint 312
#> 4    ols 312
#> 5    wls 312
```

The 1,560 rows are 13 series times 24 months times 5 sets, so each set has 312 rows. `count()` lists the sets in alphabetical order, not in the order we created them.

Now `total_minus_states()` runs on all five sets at once. The first table below gives the largest absolute difference over the 24 months for each set, and the second shows December 2018, the month with the biggest base gap.

```r
# Find the largest gap between the Total and the sum of the States in each set
gap <- total_minus_states(fc)

gap |>
  group_by(.model) |>
  summarise(max_abs_difference = round(max(abs(difference)), 1)) |>
  as.data.frame()
#>   .model max_abs_difference
#> 1   base              198.1
#> 2     bu                0.0
#> 3   mint                0.0
#> 4    ols                0.0
#> 5    wls                0.0

gap |>
  filter(Month == yearmonth("2018 Dec")) |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  as.data.frame()
#>      Month .model   total  states difference
#> 1 2018 Dec   base 17546.9 17745.0     -198.1
#> 2 2018 Dec     bu 17558.2 17558.2        0.0
#> 3 2018 Dec    ols 17593.4 17593.4        0.0
#> 4 2018 Dec    wls 17616.7 17616.7        0.0
#> 5 2018 Dec   mint 17657.5 17657.5        0.0
```

The base set still has its largest gap, 198.1, and all four reconciled sets show 0.0. The raw differences in the reconciled sets are around 1e-12, which is computer rounding error, so rounding to 1 decimal place shows them as 0.0. In every month of every reconciled set, the Total equals the sum of the States.

But coherent does not mean identical. For December 2018 the four sets give four different Totals: 17,558.2 for bu, 17,593.4 for ols, 17,616.7 for wls and 17,657.5 for mint. Which of them lands closest to the actual turnover is something only the test months can tell us.

=== step === concept
## How to score every level with accuracy()

`accuracy()` compares forecasts with actual values. We pass it `fc` and the full `sales` tsibble, which still holds the 24 test months. If we passed `train` instead, there would be no actual values to compare against.

`measures = list(rmse = RMSE)` asks for the RMSE, the root mean squared error: square each forecast error, average the squares, then take the square root. It is in the units of turnover, millions of dollars.

```r
# Score every series on the 24 held-out months with RMSE
acc <- fc |>
  accuracy(sales, measures = list(rmse = RMSE))

nrow(acc)
#> [1] 65
```

That is one RMSE per series per set, 13 times 5 rows. Next each series gets a level label. The Total has both keys aggregated, a State series has only Industry aggregated, and the other 9 series have neither.

```r
# Label each series by its level in the hierarchy and count the rows per level
acc <- acc |>
  mutate(
    level = case_when(
      is_aggregated(State) ~ "Total",
      is_aggregated(Industry) ~ "State",
      TRUE ~ "State and industry"
    )
  )

acc |>
  as_tibble() |>
  count(level) |>
  as.data.frame()
#>                level  n
#> 1              State 15
#> 2 State and industry 45
#> 3              Total  5
```

The Total has 5 rows (1 series times 5 sets), State has 15 (3 times 5) and State and industry has 45 (9 times 5).

RMSE is in millions of dollars, so a big series has a bigger RMSE than a small one. The Total's RMSE and an industry's RMSE sit on different scales, and averaging them mixes the scales. So we compare the sets within one level. The code averages the RMSE of the series in each level, and adds an All 13 series row that averages the 13 RMSEs of a set.

```r
# Average the RMSE within each level, and across all 13 series, for every set
by_level <- acc |>
  as_tibble() |>
  group_by(level, .model) |>
  summarise(rmse = mean(rmse), .groups = "drop")

all_series <- acc |>
  as_tibble() |>
  group_by(.model) |>
  summarise(rmse = mean(rmse), .groups = "drop") |>
  mutate(level = "All 13 series")

lev <- bind_rows(by_level, all_series) |>
  mutate(
    level = factor(level, levels = c("Total", "State", "State and industry", "All 13 series")),
    .model = factor(.model, levels = c("base", "bu", "ols", "wls", "mint"))
  ) |>
  arrange(level, .model)

nrow(lev)
#> [1] 20
lev |>
  mutate(rmse = round(rmse, 1)) |>
  as.data.frame()
#>                 level .model  rmse
#> 1               Total   base 141.0
#> 2               Total     bu 134.9
#> 3               Total    ols 146.0
#> 4               Total    wls 146.4
#> 5               Total   mint 144.2
#> 6               State   base  88.8
#> 7               State     bu  84.8
#> 8               State    ols  81.8
#> 9               State    wls  83.1
#> 10              State   mint  88.2
#> 11 State and industry   base  48.2
#> 12 State and industry     bu  48.2
#> 13 State and industry    ols  47.8
#> 14 State and industry    wls  48.0
#> 15 State and industry   mint  47.6
#> 16      All 13 series   base  64.7
#> 17      All 13 series     bu  63.3
#> 18      All 13 series    ols  63.2
#> 19      All 13 series    wls  63.7
#> 20      All 13 series   mint  64.4
```

The 20 rows are 4 levels times 5 sets, and within each level the sets run in the order base, bu, ols, wls, mint.

=== step === widget
## What does the accuracy table say at each level?

The widget below lays the same 20 numbers out with one row per level and one column per set. Switch between the raw print and the report table, and read each row by comparing every set with base.

::widget styled-table {"cols":["level","base","bu","ols","wls","mint"],"rows":[["Total","141.0","134.9","146.0","146.4","144.2"],["State","88.8","84.8","81.8","83.1","88.2"],["State and industry","48.2","48.2","47.8","48.0","47.6"],["All 13 series","64.7","63.3","63.2","63.7","64.4"]],"formats":{"base":"1dp","bu":"1dp","ols":"1dp","wls":"1dp","mint":"1dp"},"title":"Mean RMSE by level","note":"24-month holdout, AUD million"}

Here is what each row says.

- **State**: base is 88.8, and all four reconciled sets are lower, from 88.2 under mint down to 81.8 under ols.
- **Total**: base is 141.0, and only bu is lower, at 134.9. The other three are higher: 146.0 for ols, 146.4 for wls and 144.2 for mint.
- **State and industry**: base is 48.2, and bu is also 48.2, because `bottom_up()` keeps the 9 bottom base forecasts unchanged. The other three differ from base by 0.6 at most.
- **All 13 series**: base is 64.7, and every set is lower, from 64.4 under mint down to 63.2 under ols. This row averages across scales, so the 9 bottom series carry most of its weight.

So every reconciled set is coherent, but accuracy is mixed by level. The Total got worse under three of the four sets while the States improved under all four. Each method adjusts all 13 forecasts together, so an improvement at one level can come with a loss at another.

One caution about the table itself. It comes from a single forecast origin, the last month of training data (December 2016), and one 24-month test window. Choosing between the methods reliably needs the same comparison at several forecast origins.

=== step === quiz
## Quick check: what does reconcile() guarantee?

The Total's mean RMSE was 141.0 for base and 146.0 under ols. Which statement about reconciled forecasts is right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- They are more accurate at every level, including the Total. ::no
- They are more accurate, but the children may still not add up to the parent. ::no
- The children add up to the parent in every month, while accuracy at a level can rise or fall. ::ok Yes. Coherence is what reconciliation guarantees. The Total row shows accuracy can fall, 141.0 for base against 146.0 under ols, while the State row fell under all four sets.
- reconcile() refits ETS to the aggregated data, so the 13 models now share information. ::no Reconciling makes the forecasts add up and nothing more. It refits nothing: the base fits stay in the mable, and the methods adjust their forecasts when forecast() runs. And the Total's RMSE rose under three of the four sets, so accuracy at a level is not guaranteed to improve.

=== step === tryit
## Your turn: reconcile with the default method and check the sum

`fit` still holds the 13 base models, and `total_minus_states()` is still defined. Reconcile `fit` again with one new set named `var`, using `min_trace()` with its default method. Then forecast 24 months ahead and find the largest absolute difference between the Total and the sum of the States, for each set.

```r
# Add a reconciled set named var, forecast 24 months, and check the sum
# 1. Reconcile fit with the default min_trace method, in a set named var,
#    and save the result as rec_var.
# 2. Forecast rec_var 24 months ahead and save the result as fc_var.
# 3. Run total_minus_states on fc_var, then take the largest absolute
#    difference for each set, rounded to 1 decimal place.
# Press Check when you have them.
```
::check {"regex": "reconcile\\s*[(][\\s\\S]*(min_trace\\s*[(]\\s*base\\s*[)]|wls_var)[\\s\\S]*forecast\\s*[(]", "gate": true, "difficulty": "intermediate", "ok": "Yes. base still shows 198.1 because fit keeps the base fits, and var shows 0.0, so the default set is coherent too. Called with no method, min_trace() uses wls_var, which weights each series by its own residual variance.", "no": "Put var = min_trace(base) inside reconcile(), pass the result to forecast(h = 24), then run total_minus_states() on that forecast and take the largest absolute difference for each set."}
::solution
```r
# Reconcile with the default min_trace method and check the sum
rec_var <- fit |>
  reconcile(var = min_trace(base))

fc_var <- rec_var |>
  forecast(h = 24)

gap_var <- total_minus_states(fc_var)

gap_var |>
  group_by(.model) |>
  summarise(max_abs_difference = round(max(abs(difference)), 1)) |>
  as.data.frame()
#>   .model max_abs_difference
#> 1   base              198.1
#> 2    var                0.0

gap_var |>
  filter(Month == yearmonth("2018 Dec")) |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  as.data.frame()
#>      Month .model   total  states difference
#> 1 2018 Dec   base 17546.9 17745.0     -198.1
#> 2 2018 Dec    var 17616.5 17616.5        0.0
```

The `rec_var` mable holds only `base` and `var`, so the check covers those two sets. In December 2018 the Total under `var` is 17,616.5, the same as the sum of the States.

=== step === concept
## References

- [Forecasting: Principles and Practice, chapter 11, Forecasting hierarchical and grouped time series](https://otexts.com/fpp3/hierarchical.html) - Hyndman and Athanasopoulos (2021), 3rd edition, OTexts. The textbook treatment of coherence, bottom-up and MinT reconciliation, with fable code.
- [Optimal forecast reconciliation for hierarchical and grouped time series through trace minimization](https://doi.org/10.1080/01621459.2018.1448825) - Wickramasuriya, Athanasopoulos and Hyndman (2019), Journal of the American Statistical Association 114(526), 804-819. The paper that introduced `min_trace()` reconciliation.
- [Optimal combination forecasts for hierarchical time series](https://doi.org/10.1016/j.csda.2011.03.006) - Hyndman, Ahmed, Athanasopoulos and Shang (2011), Computational Statistics and Data Analysis 55(9), 2579-2589. The regression approach that the ols method comes from.
- [fabletools documentation](https://fabletools.tidyverts.org/) - O'Hara-Wild, Hyndman and Wang. The reference pages for `aggregate_key()`, `reconcile()` and `min_trace()`.
- [Retail Trade, Australia](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia) - Australian Bureau of Statistics, catalogue 8501.0, table 11. The source of the `aus_retail` data in tsibbledata.

=== step === complete
## Quick recap

You took a hierarchy of 13 series from its declaration to coherent forecasts, and scored them by level. To summarize:

- `aggregate_key(State / Industry)` turned the 9 State-and-industry series into 13 series by adding 3 State series and the Total.
- One `model()` call fitted ETS(M,A,M) to all 13 series separately. Those base forecasts were incoherent: the Total forecast sat below the sum of the States in 21 of 24 months, by up to 198.1 million dollars in December 2018.
- `reconcile()` added four sets, bu, ols, wls and mint, and `forecast()` returned all five. In each reconciled set the Total minus the sum of the States is 0.0 when rounded to 1 decimal place.
- `accuracy()` by level gave a mixed result. State RMSE fell under all four sets, Total RMSE fell only under bottom-up, and State-and-industry RMSE moved by 0.6 at most.
- Reconciliation guarantees coherence. It does not guarantee that every level becomes more accurate.

So whenever someone asks what reconcile() did to the forecasts, you can say: "It changed them so the parts add up to the whole, and accuracy at any one level can rise or fall."

The next part takes incoherent regional forecasts, puts the difference in money terms and reconciles them.
